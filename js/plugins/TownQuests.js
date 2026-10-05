//=============================================================================
// TownQuests.js
//=============================================================================
// The town's quests (docs/QUESTY.md; the user, 2026-10-04: "zrób to wszystko co tylko możesz"): a small quest engine over
// TownLife.js's residents. A resident with something to say about a quest says it instead of the usual talk (TownLife.addTalkHook):
// an offer with a choice, a reminder (what is missing pops up over the hero), the hand-in, the reward. The Lord and grandpa Stach
// (Story.js) speak first about a quest too (Story.talk is wrapped: the quest's lines, then the story's own talk). The places a quest
// needs (a window, a wall, a gate, a glint on the road) are events put into the maps (Tawerna.inject, ids 951-959), there only while
// a quest needs them. "Opinia w miasteczku" 0-100 (the town's opinion of the hero, its tiers and greetings), the market day every
// 7 days, the calendar (ferry days, the dated days of the year), the bell's signals (W2) and a little bell-ringing mini-game.
// The journal has the tab "Miasteczko" (quests, the opinion, the calendar, the bell's signals) and the goal window follows one quest.
// Data: TownQuests_Data.js (right above this plugin). The state: Tawerna.state("townQuests").
// Bus: emits townQuestAccepted { id, title }, townQuestDone { id, kind, title, giver, gold, xp, opinion }, townQuestFailed { id }.
// DROUGHT (the user's rule): nothing here ever gives the hero water.

/*:
 * @target MZ
 * @plugindesc Questy miasteczka: zadania od mieszkańców (oferta, kroki, nagrody), Opinia w miasteczku, dzień targowy, kalendarz, sygnały dzwonu, mini-gra dzwonu, zakładka „Miasteczko” w dzienniku. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TownLife
 *
 * @help
 * ============================================================================
 * TownQuests.js - questy miasteczka
 * ============================================================================
 * Zadania, teksty i nagrody są w TownQuests_Data.js (ma stać nad tą
 * wtyczką). Działa z TownLife.js (mieszkańcy miasteczka, mapa 8), Journal.js
 * (zakładka „Miasteczko”, okienko celu), Story.js (Lord i dziadek Stach).
 *
 * Mieszkaniec z zadaniem ma nad głową żółty „!”, a z zadaniem do oddania -
 * zielony ptaszek. Miejsca zadań (okienko piekarni, ściany do obwieszczeń,
 * posterunek, błysk na drodze...) pojawiają się tylko wtedy, gdy zadanie
 * ich potrzebuje (żółty romb nad nimi). Zdarzenia 951-959.
 *
 * W skryptach: TownQuests.start("K1"), TownQuests.opinion(),
 * TownQuests.addOpinion(n, "powód"), TownQuests.state().
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("TownQuests.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const D = window.TownQuestsData;
    if (!D) throw new Error("TownQuests.js: TownQuests_Data.js must stand above it in the plugin list");
    const PLUGIN = "TownQuests";
    const TOWN = 8;
    const QUESTS = D.QUESTS, Q = {};
    for (const q of QUESTS) Q[q.id] = q;
    const KIND = { K: "krótkie", D: "długie", W: "wątek" };
    const COIN_ICON = 314, NOTE_ICON = 80, BELL_SE = { name: "Bell3", volume: 70, pitch: 85, pan: 0 };
    const HERO = { id: 0, name: "" };
    const NIGHT_FROM = 21, NIGHT_TO = 5;

    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const day = () => T.time.day(), hour = () => T.time.hour();
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const iconOfItem = id => (item(id) ? item(id).iconIndex : 0);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    // [a, b] (b < a: over midnight), or a list of such ranges
    const inHours = (h, r) => !r || (Array.isArray(r[0]) ? r.some(x => inHours(h, x)) : r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const isNight = h => h >= NIGHT_FROM || h < NIGHT_TO;
    const hm = h => { const t = Math.round(h * 60), H = Math.floor(t / 60) % 24, M = t % 60; return H + ":" + (M < 10 ? "0" : "") + M; };
    const now = () => day() * 24 + hour();
    const onTown = () => !!(window.$gameMap && $gameMap.mapId() === TOWN);
    const TL = () => T.api("TownLife");
    const ST = () => T.api("Story");
    const report = (where, e) => console.error("[TownQuests] " + where + ":", e);
    const has = () => !!window.$gameSystem;
    function rainingNow() {
        const Sv = T.api("Survival");
        if (Sv && typeof Sv.currentWeather === "function" && window.$gameSystem && $gameSystem.dayNightDay) {
            const w = Sv.currentWeather();
            if (w) return true;
        }
        const s = window.$gameScreen;
        if (!s) return false;
        const t = s.weatherType();
        return (t === "rain" || t === "storm" || t === "snow") && s.weatherPower() > 0;
    }
    function fill(text, vars) {
        return String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    }

    // ------------------------------------------------------------------
    // The state in the save
    // ------------------------------------------------------------------
    const store = T.state.define("townQuests", () => ({
        opinion: D.OPINION.start, q: {}, track: null, flags: {}, clues: {}, v: {}, perks: {}, bells: [], opLog: [], declined: {}, greeted: {},
        seen: {}, trade: { day: 0, n: 0 }, mute: [], stats: { done: 0, failed: 0, gold: 0 }, k20: { left: 0, hides: 0 }, rung: {}, marketSeen: 0
    }), { version: 1, owner: PLUGIN });
    const S = () => store();
    const rec = id => (has() ? S().q[id] || null : null);
    const isActive = id => { const r = rec(id); return !!r && r.s === "active"; };
    const isDone = id => { const r = rec(id); return !!r && (r.s === "done" || (r.times || 0) > 0); };
    const activeQuests = () => QUESTS.filter(q => isActive(q.id));

    // things carried that are not database items ("v:key")
    const vcount = k => (has() ? S().v[k] || 0 : 0);
    const vgive = (k, n) => { const v = S().v; v[k] = (v[k] || 0) + n; };
    const vtake = (k, n) => { const v = S().v; v[k] = Math.max(0, (v[k] || 0) - n); if (!v[k]) delete v[k]; };
    const vname = k => (D.VITEMS[k] ? D.VITEMS[k].name : k);
    const vicon = k => (D.VITEMS[k] ? D.VITEMS[k].icon : 0);

    // ------------------------------------------------------------------
    // The opinion: 0-100, its tiers
    // ------------------------------------------------------------------
    function tierOf(v) {
        let i = 0;
        D.OPINION.tiers.forEach((t, k) => { if (v >= t.at) i = k; });
        return i;
    }
    const opinion = () => (has() ? S().opinion : D.OPINION.start);
    function addOpinion(n, why) {
        n = Math.round(Number(n) || 0);
        if (!n || !has()) return 0;
        const s = S(), before = s.opinion;
        s.opinion = clamp(before + n, 0, 100);
        const got = s.opinion - before;
        if (!got) return 0;
        s.opLog.unshift({ day: day(), n: got, why: String(why || "") });
        s.opLog.length = Math.min(s.opLog.length, 12);
        const tb = tierOf(before), ta = tierOf(s.opinion);
        if (ta !== tb) {
            const t = D.OPINION.tiers[ta];
            T.popup((ta > tb ? "Opinia w miasteczku: " : "Opinia spada: ") + t.name, { top: true, color: ta > tb ? "#9ff0a8" : "#ff9f8f", sub: t.text });
        }
        T.emit("townOpinion", { opinion: s.opinion, change: got, why: String(why || ""), tier: ta });
        return got;
    }

    // ------------------------------------------------------------------
    // The calendar: days without rain, the market, the ferry, the dated days
    // ------------------------------------------------------------------
    let dryCache = { key: "", n: 0 };
    function dryBefore(d) {   // the days without a rain plan just before day d
        const Sv = T.api("Survival");
        if (!Sv || typeof Sv.weatherPlan !== "function") return 0;
        let n = 0;
        for (let k = d - 1; k >= 1 && n < 99; k--) { const p = Sv.weatherPlan(k); if (p && p.type === "rain") break; n++; }
        return n;
    }
    function dryDays() {
        const Sv = T.api("Survival");
        if (!Sv || typeof Sv.weatherPlan !== "function" || !has()) return 0;
        const d = day(), h = hour(), key = d + ":" + Math.floor(h * 4);
        if (dryCache.key === key) return dryCache.n;
        const p = Sv.weatherPlan(d);
        const n = p && p.type === "rain" && h >= p.start ? 0 : dryBefore(d);
        dryCache = { key, n };
        return n;
    }
    const isMarket = d => d % D.MARKET.every === 0;
    function isFerry(d) {
        if (d < 1) return false;
        const QB = T.api("QuestBoard");
        if (QB && typeof QB.cycleOf === "function") return d === 1 || QB.cycleOf(d) !== QB.cycleOf(d - 1);
        return (d - 1) % D.CALENDAR.ferryEvery === 0;
    }
    const nextOf = (from, test) => { for (let d = from; d < from + 60; d++) if (test(d)) return d; return null; };
    function storyOn() {
        const St = ST();
        try { return !!(St && St.active && St.active() && St.state && St.state() && St.state().intro === 2); } catch (e) { return false; }
    }
    const storyOpen = () => !!T.call("Story", "isOpen");

    // ------------------------------------------------------------------
    // Conditions (an offer's cond)
    // ------------------------------------------------------------------
    function condOk(c) {
        if (!c) return true;
        const d = day(), h = hour(), s = S();
        if (c.hours && !inHours(h, c.hours)) return false;
        if (c.day !== undefined && d < c.day) return false;
        if (c.until !== undefined && d > c.until) return false;
        if (c.season && !c.season.includes(T.time.season(d))) return false;
        if (c.dry !== undefined && dryDays() < c.dry) return false;
        if (c.clear && rainingNow()) return false;
        if (c.opinion !== undefined && s.opinion < c.opinion) return false;
        if (c.done && !c.done.every(isDone)) return false;
        if (c.flags && !c.flags.every(f => s.flags[f])) return false;
        if (c.noFlags && c.noFlags.some(f => s.flags[f])) return false;
        if (c.story && !storyOn()) return false;
        if (c.market && !isMarket(d)) return false;
        if (c.afterFerry && !isFerry(d - 1)) return false;
        if (c.has && !c.has.every(([id, n]) => count(id) >= n)) return false;
        if (c.fn && FX[c.fn] && FX[c.fn].cond && !FX[c.fn].cond()) return false;
        return true;
    }
    function offerable(q) {
        if (!q.offer || !q.giver) return false;
        const r = rec(q.id), s = S();
        if (r) {
            if (r.s === "active" || r.s === "refused") return false;
            if (q.repeat === "daily") { if (r.end === day()) return false; }
            else if (q.repeat !== "trade") return false;
        }
        if (s.declined[q.id] === day()) return false;
        return condOk(q.offer.cond);
    }

    // ------------------------------------------------------------------
    // Water (the hero's own rain water: the bucket carried in the bag, the waterskin) - only ever taken, never given
    // ------------------------------------------------------------------
    function waterParts() {
        const F = T.api("Farming"), N = T.api("Needs");
        const bucket = F && typeof F.bagWater === "function" && count(138) > 0 ? Math.max(0, F.bagWater() || 0) : 0;
        const skin = N && typeof N.ownsSkin === "function" && N.ownsSkin() && typeof N.skinCharges === "function" ? Math.max(0, N.skinCharges() || 0) : 0;
        return { bucket, skin, all: bucket + skin };
    }
    function waterTake(n) {
        const F = T.api("Farming"), N = T.api("Needs"), w = waterParts();
        let left = n;
        const b = Math.min(left, w.bucket);
        if (b > 0) { F.setBagWater(F.bagWater() - b); left -= b; }
        const k = Math.min(left, w.skin);
        if (k > 0 && N && N.state) { N.state().skin = N.skinCharges() - k; left -= k; }
        return n - left;
    }

    // ------------------------------------------------------------------
    // What a step needs: rows { name, icon, have, n, ok }
    // ------------------------------------------------------------------
    function itemRow(id, n) {
        if (typeof id === "string" && id.startsWith("v:")) { const k = id.slice(2); return { kind: "v", key: k, name: vname(k), icon: vicon(k), have: vcount(k), n }; }
        return { kind: "item", id, name: item(id) ? item(id).name : "?", icon: iconOfItem(id), have: count(id), n };
    }
    // the first alternative of needAny the hero has in full (else 0: the first, to show)
    function altOf(st) {
        if (!st.needAny) return -1;
        const i = st.needAny.findIndex(list => list.every(([id, n]) => itemRow(id, n).have >= n));
        return i < 0 ? 0 : i;
    }
    function needRows(st, alt) {
        const rows = [];
        const list = st.needAny ? st.needAny[alt === undefined || alt < 0 ? altOf(st) : alt] : st.need;
        for (const [id, n] of list || []) rows.push(itemRow(id, n));
        for (const [id, n] of st.tools || []) rows.push(Object.assign(itemRow(id, n), { tool: true }));
        if (st.toolsAny) {   // one of these (a knife: stone or iron)
            const owned = st.toolsAny.find(id => count(id) > 0), id = owned || st.toolsAny[0];
            rows.push(Object.assign(itemRow(id, 1), { tool: true, have: owned ? 1 : 0 }));
        }
        if (st.water || st.showWater) { const n = st.water || st.showWater; rows.push({ kind: "water", name: "Deszczówka (wiadro albo bukłak)", icon: iconOfItem(138), have: waterParts().all, n }); }
        if (st.gold) rows.push({ kind: "gold", name: "Złoto", icon: COIN_ICON, have: $gameParty.gold(), n: st.gold });
        for (const r of rows) r.ok = r.have >= r.n;
        return rows;
    }
    const missingRows = (st, alt) => needRows(st, alt).filter(r => !r.ok);
    function popupMissing(rows) {
        for (const r of rows.slice(0, 2)) {
            const text = r.tool ? "Potrzebujesz: " + r.name : r.kind === "water" ? "Potrzebujesz deszczówki: " + r.have + "/" + r.n + " (wiadro albo bukłak)"
                : r.kind === "gold" ? "Potrzebujesz " + r.n + " G" : "Potrzebujesz: " + r.name + " " + r.have + "/" + r.n;
            T.popup.need(r.icon, text);
        }
    }
    function takeNeeds(st, alt) {
        const list = st.needAny ? st.needAny[alt === undefined || alt < 0 ? altOf(st) : alt] : st.need;
        for (const [id, n] of list || []) {
            if (typeof id === "string" && id.startsWith("v:")) vtake(id.slice(2), n);
            else if (item(id)) $gameParty.loseItem(item(id), n);
        }
        if (st.water) waterTake(st.water);
        if (st.gold) $gameParty.loseGold(st.gold);
    }
    const listOk = list => (list || []).every(([id, n]) => itemRow(id, n).have >= n);

    // ------------------------------------------------------------------
    // When a step can be done: { ok, why: "early" | "late" | "hours" | "weather" }
    // ------------------------------------------------------------------
    function timing(q, r, st) {
        const d = day(), h = hour();
        if (st.dayIs !== undefined && d !== st.dayIs) return { ok: false, why: d < st.dayIs ? "early" : "late" };
        if (st.dayRel !== undefined && d !== r.sday + st.dayRel) return { ok: false, why: d < r.sday + st.dayRel ? "early" : "late" };
        if (st.after) {
            const [i, n] = st.after, done = r.t.done ? r.t.done[i] : undefined;
            if (done === undefined || d < done + n) return { ok: false, why: "early" };
        }
        if (st.hours && !inHours(h, st.hours)) return { ok: false, why: "hours" };
        if (st.night && !isNight(h)) return { ok: false, why: "hours" };
        if (st.clear && rainingNow()) return { ok: false, why: "weather" };
        return { ok: true, why: "" };
    }
    function varsOf(q, r) {
        const t = r ? r.t : {};
        return { n: t.n || 0, left: t.left || 0, gold: (q.reward && q.reward.gold) || 0 };
    }

    // ------------------------------------------------------------------
    // Who speaks: a resident (TownLife), the Lord / grandpa (Story), the hero, a quest's place
    // ------------------------------------------------------------------
    function resident(key) { const L = TL(); return L && L.RESIDENTS ? L.RESIDENTS.find(r => r.key === key) || null : null; }
    function residentEv(key) {
        const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null;
        return ev && !(ev._town && ev._town.hidden) ? ev : null;
    }
    function storyEv(role) { const St = ST(); try { return St && St.npc ? St.npc(role) || null : null; } catch (e) { return null; } }
    function nameOf(key) {
        if (key === "lord") return "Lord Zaleski";
        if (key === "grandpa") return "Dziadek Stach";
        const r = resident(key);
        return r ? r.name : String(key || "");
    }
    function titleOf(key) {
        if (key === "lord") return "dwór";
        if (key === "grandpa") return "dziadek";
        const r = resident(key);
        return r ? r.title : "";
    }
    function speakerOf(key) {
        if (key === "hero") return HERO;
        const ev = key === "lord" || key === "grandpa" ? storyEv(key) : residentEv(key);
        return { id: ev && $gameMap.event(ev.eventId()) === ev ? ev.eventId() : -1, name: nameOf(key) };
    }

    // ------------------------------------------------------------------
    // Event commands: messages (speech bubbles: \SPK[n]), choices, script calls back here
    // ------------------------------------------------------------------
    const LINE = 46, PAGE = 3;
    function wrap(text) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const w of para.split(/\s+/)) {
                if (!w) continue;
                if (line && (line + " " + w).length > LINE) { out.push(line); line = w; } else line = line ? line + " " + w : w;
            }
            if (line) out.push(line);
        }
        return out;
    }
    function sayTo(out, spk, text, ind) {
        const lines = wrap(String(text).replace(/(\d) G\b/g, "$1 G"));
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""], ind));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l], ind)));
        }
        return out;
    }
    function linesTo(out, spk, arr, vars, ind) {
        for (const raw of [].concat(arr || [])) {
            if (raw === null || raw === undefined || raw === "") continue;
            const s = fill(raw, vars);
            if (s.startsWith("> ")) { sayTo(out, HERO, s.slice(2), ind); continue; }
            const m = /^@(\w+):\s*([\s\S]*)$/.exec(s);
            if (m) sayTo(out, speakerOf(m[1]), m[2], ind);
            else sayTo(out, spk, s, ind);
        }
        return out;
    }
    const script = (out, args, ind) => (out.push(C(355, ["TownQuests.act(this, " + JSON.stringify(args) + ")"], ind)), out);
    // labels + branches (each a list of commands at indent 0); cancel: the option Esc picks (-1: none)
    function choiceTo(out, labels, branches, cancel, ind) {
        const i0 = ind || 0;
        out.push(C(102, [labels, cancel === undefined ? labels.length - 1 : cancel, 0, 2, 0], i0));
        labels.forEach((l, i) => {
            out.push(C(402, [i, l], i0));
            for (const c of branches[i] || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + i0 + 1 }));
            out.push(C(0, [], i0 + 1));
        });
        out.push(C(404, [], i0));
        return out;
    }
    const shownOptions = list => list.map((op, i) => ({ op, i })).filter(x => !x.op.cond || condOk(x.op.cond));
    function choiceBlock(out, q, stepIdx, ch, spk, vars) {
        linesTo(out, spk, ch.ask, vars);
        const opts = shownOptions(ch.options);
        const branches = opts.map(({ op, i }) => {
            const b = [];
            script(b, [q.id, "pick", stepIdx, i]);
            linesTo(b, spk, op.say, vars);
            return b;
        });
        return choiceTo(out, opts.map(x => x.op.label), branches, -1);
    }
    // What is said at a moment of a quest outside a talk (the night at the pond, the ambush, after the bell game): speech bubbles,
    // one after another, over the hero ("> ...") or a resident - never a message window or an interpreter started by itself
    const thoughts = [];
    let thoughtAt = 0;
    function think(lines, key) {
        for (const l of [].concat(lines || [])) {
            if (!l) continue;
            const hero = /^> /.test(l) || !key;
            thoughts.push({ key: hero ? null : key, text: String(l).replace(/^> /, "") });
        }
    }
    function updateThoughts() {
        if (!thoughts.length || Graphics.frameCount < thoughtAt || !(SceneManager._scene instanceof Scene_Map)) return;
        const SB = T.api("SpeechBubbles"), t = thoughts.shift(), who = t.key ? residentEv(t.key) : $gamePlayer;
        if (SB && SB.say && who) SB.say(who, t.text, 200); else T.popup(t.text, { color: "#eceef0" });
        thoughtAt = Graphics.frameCount + 210;
    }

    // ------------------------------------------------------------------
    // Rewards
    // ------------------------------------------------------------------
    function mergeReward(a, b) {
        const out = Object.assign({}, a || {});
        for (const [k, v] of Object.entries(b || {})) {
            if (k === "gold" || k === "xp" || k === "opinion" || k === "debtCredit") out[k] = (out[k] || 0) + v;
            else if (k === "items") out.items = (out.items || []).concat(v);
            else out[k] = v;
        }
        return out;
    }
    function addNote(note) {
        if (!note) return;
        const J = T.api("Journal");
        if (J && J.addNote) J.addNote(note[0], note[1]);
    }
    function setFlag(f) { if (f) S().flags[f] = day(); }
    function addClue(k) { if (k && !S().clues[k]) S().clues[k] = day(); }
    function addPerk(p) { if (!p) return; const pk = S().perks; for (const [k, v] of Object.entries(p)) pk[k] = (pk[k] || 0) + v; }
    // gives it; returns the parts of the notice's second line
    function applyReward(q, rw, first) {
        const parts = [], s = S();
        if (!rw) return parts;
        if (rw.gold) {
            $gameParty.gainGold(rw.gold);
            s.stats.gold += rw.gold;
            if (rw.debt && storyOpen()) { const paid = T.call("Story", "pay", rw.gold) || 0; parts.push(paid + " G na dług dziadka"); if (paid < rw.gold) parts.push("+" + (rw.gold - paid) + " G"); }
            else parts.push("+" + rw.gold + " G");
        }
        if (rw.debtCredit) {
            $gameParty.gainGold(rw.debtCredit);
            if (storyOpen()) { const paid = T.call("Story", "pay", rw.debtCredit) || 0; parts.push(paid + " G odpisane z długu"); }
            else parts.push("+" + rw.debtCredit + " G");
        }
        for (const [id, n] of rw.items || []) if (item(id)) $gameParty.gainItem(item(id), n);
        if (rw.xp) { const got = T.call("Combat", "gainXp", rw.xp, "zadanie: " + q.title, true) || 0; if (got) parts.push("+" + got + " dośw."); }
        const op = (rw.opinion || 0) + (first && rw.opinionFirst ? rw.opinionFirst : 0);
        if (op) { const got = addOpinion(op, q.title); if (got) parts.push("Opinia " + (got > 0 ? "+" : "") + got); }
        addNote(rw.note);
        addClue(rw.clue);
        setFlag(rw.flag);
        addPerk(rw.perk);
        return parts;
    }
    function rewardText(rw) {
        if (!rw) return "";
        const parts = [];
        if (rw.gold) parts.push(rw.gold + " G" + (rw.debt ? " (albo na dług)" : ""));
        if (rw.debtCredit) parts.push(rw.debtCredit + " G na dług dziadka");
        for (const [id, n] of rw.items || []) if (item(id)) parts.push(item(id).name + " ×" + n);
        if (rw.xp) parts.push(rw.xp + " dośw.");
        if (rw.opinion) parts.push("Opinia " + (rw.opinion > 0 ? "+" : "") + rw.opinion);
        if (rw.opinionFirst) parts.push("Opinia +" + rw.opinionFirst + " (za pierwszym razem)");
        if (rw.clue) parts.push("poszlaka");
        return parts.join("  ·  ");
    }
    // the vitems a quest hands out (taken back when it ends)
    function questVitems(q) {
        const keys = new Set(Object.keys((q.offer && q.offer.vgives) || {}));
        for (const st of q.steps || []) for (const k of Object.keys(st.vgives || {})) keys.add(k);
        return Array.from(keys);
    }

    // ------------------------------------------------------------------
    // The life of a quest: start, the steps, finish, fail
    // ------------------------------------------------------------------
    const trackedElsewhere = () => { const QB = T.api("QuestBoard"); try { return !!(QB && QB.state && QB.state().track); } catch (e) { return false; } };
    function start(q, step, quiet) {
        if (typeof q === "string") q = Q[q];
        if (!q || !has()) return false;
        const s = S(), old = s.q[q.id];
        s.q[q.id] = { s: "active", step: step || 0, day: day(), sday: day(), sh: hour(), t: { done: {} }, times: old ? old.times || 0 : 0, end: old ? old.end : 0 };
        delete s.declined[q.id];
        const o = q.offer || {};
        for (const [k, n] of Object.entries(o.vgives || {})) vgive(k, n);
        for (const [id, n] of o.gives || []) if (item(id)) $gameParty.gainItem(item(id), n);
        if (o.pay) $gameParty.gainGold(o.pay);
        if (!s.track && !trackedElsewhere() && q.kind !== "W") s.track = q.id;
        if (!quiet) T.popup((q.kind === "W" ? "Nowy wątek: " : "Nowe zadanie: ") + q.title, { top: true, color: "#ffe27a", sub: stepLine(q) });
        T.emit("townQuestAccepted", { id: q.id, title: q.title });
        enterStep(q);
        return true;
    }
    function enterStep(q) {
        const r = rec(q.id), st = q.steps[r.step];
        r.sday = day();
        r.sh = hour();
        if (st && st.tick && FX[st.tick] && FX[st.tick].enter) FX[st.tick].enter(q, r, st);
    }
    const stepLine = q => { const r = rec(q.id), st = r && q.steps[r.step]; return st ? fill(st.text, varsOf(q, r)) : ""; };
    function completeStep(q, opts) {
        const o = opts || {}, r = rec(q.id);
        if (!r || r.s !== "active") return;
        const st = q.steps[r.step];
        r.t.done[r.step] = day();
        for (const [k, n] of Object.entries(st.vgives || {})) vgive(k, n);
        for (const [id, n] of st.gives || []) if (item(id)) $gameParty.gainItem(item(id), n);
        let rw = st.reward || null;
        if (st.anyRewards && o.alt >= 0) rw = mergeReward(rw, st.anyRewards[o.alt]);
        if (st.rewardFx && FX[st.rewardFx] && FX[st.rewardFx].reward) rw = mergeReward(rw, FX[st.rewardFx].reward(q, r, st));
        if (o.reward) rw = mergeReward(rw, o.reward);
        const last = st.end || r.step + 1 >= q.steps.length || o.finish;
        if (last) return finish(q, rw);
        const parts = rw ? applyReward(q, rw, (r.times || 0) === 0) : [];
        r.step = o.to !== undefined ? o.to : r.step + 1;
        enterStep(q);
        const line = stepLine(q);
        T.popup(q.title, { top: true, color: "#ffe27a", sub: (parts.length ? parts.join("  ·  ") + "  ·  " : "") + line });
        autoChecks();
    }
    function finish(q, extra, opts) {
        if (typeof q === "string") q = Q[q];
        if (!q || !has()) return null;
        const o = opts || {}, s = S();
        let r = s.q[q.id];
        if (!r) r = s.q[q.id] = { s: "active", step: 0, day: day(), sday: day(), sh: hour(), t: { done: {} }, times: 0 };
        r.s = "done";
        r.end = day();
        r.times = (r.times || 0) + 1;
        const rw = o.replace ? extra || {} : mergeReward(q.reward, extra);
        const parts = applyReward(q, rw, r.times === 1);
        for (const k of questVitems(q)) delete s.v[k];
        s.stats.done++;
        if (s.track === q.id) s.track = null;
        T.popup((q.kind === "W" ? "Wątek: " : "Zadanie wykonane: ") + q.title, { top: true, color: "#9ff0a8", sub: parts.join("  ·  ") || "Wykonane" });
        T.emit("townQuestDone", { id: q.id, kind: q.kind, title: q.title, giver: q.giver, gold: rw.gold || 0, xp: rw.xp || 0, opinion: rw.opinion || 0 });
        T.call("Journal", "evaluateGoals");
        autoChecks();
        return parts;
    }
    function fail(q, why) {
        const r = rec(q.id), s = S();
        if (!r || r.s !== "active") return;
        r.s = "failed";
        r.end = day();
        s.stats.failed++;
        const f = q.fail || {}, got = addOpinion(f.opinion || 0, q.title);
        for (const k of questVitems(q)) delete s.v[k];
        if (s.track === q.id) s.track = null;
        T.popup("Zadanie przepadło: " + q.title, { top: true, color: "#ff9f8f", sub: (why || f.text || "Nie zdążyłeś.") + (got ? "  ·  Opinia " + got : "") });
        if (f.fx && FX[f.fx] && FX[f.fx].fail) FX[f.fx].fail(q, r);
        T.emit("townQuestFailed", { id: q.id, title: q.title });
    }
    // a deadline missed: the quest fails, or (late: "next") the client is cross and the next step comes
    function late(q, st) {
        const r = rec(q.id), dl = st.deadline;
        r.t.late = (r.t.late || 0) + 1;
        const got = addOpinion(-2, q.title);
        T.popup("Spóźniłeś się: " + q.title, { top: true, color: "#ff9f8f", sub: (dl.text || "Klient się obraził.") + (got ? "  ·  Opinia " + got : "") });
        const to = dl.skip !== undefined ? dl.skip : r.step + 1;
        for (const k of Object.keys(st.vgives || {})) delete S().v[k];
        for (const [id] of st.need || []) if (typeof id === "string" && id.startsWith("v:")) delete S().v[id.slice(2)];
        if (to >= q.steps.length) { finish(q); return; }
        r.t.done[r.step] = day();
        r.step = to;
        enterStep(q);
    }
    function deadlineAt(r, st) {
        const dl = st.deadline;
        if (!dl) return null;
        const d = dl.abs !== undefined ? dl.abs : r.sday + (dl.day || 0);
        return d * 24 + (dl.hour || 0);
    }
    function checkDeadlines() {
        if (!has()) return;
        const t = now();
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step];
            if (!st) continue;
            const at = deadlineAt(r, st);
            if (at !== null && t >= at) { if (st.deadline.late === "next") late(q, st); else fail(q, st.deadline.text); continue; }
            if (st.type === "wait" && day() >= r.sday + (st.days || 0) && hour() >= (st.hour || 0)) completeStep(q);
        }
    }
    // the checks that move steps by themselves (W1's clues, W2's signals...) and the arcs that start by themselves
    function autoChecks() {
        if (!has()) return;
        for (const q of QUESTS) {
            if (q.kind !== "W" || rec(q.id)) continue;
            const fx = FX["start" + q.id];
            if (fx && fx()) start(q);
        }
        for (let guard = 0; guard < 6; guard++) {
            let moved = false;
            for (const q of activeQuests()) {
                const r = rec(q.id), st = q.steps[r.step];
                if (st && st.check && FX[st.check] && FX[st.check].check && FX[st.check].check(q, r, st)) { completeStep(q); moved = true; }
            }
            if (!moved) break;
        }
    }

    // ------------------------------------------------------------------
    // Script calls from the talks (TownQuests.act(this, [id, what, ...]))
    // ------------------------------------------------------------------
    function act(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [id, what, a, b] = args, q = Q[id];
        const stop = () => { if (interp && interp._list) interp._index = interp._list.length; };
        if (!q) return;
        try {
            if (what === "opt") return offerPick(q, a, stop);
            if (what === "hand") return handIn(q, a, b, stop);
            if (what === "pick") return stepPick(q, a, b, stop);
            if (what === "fx") { const f = FX[a]; if (f && f.act) return f.act(q, b, interp, stop); }
        } catch (e) { report("act " + JSON.stringify(args), e); }
    }
    function offerOptions(q) {
        const o = q.offer || {};
        return o.options || [{ label: o.yes || "Pomogę.", then: "accept", say: o.accept }, { label: o.no || "Nie teraz.", then: "decline", say: o.decline }];
    }
    function offerPick(q, i, stop) {
        const op = offerOptions(q)[i], s = S();
        if (!op) return;
        if (op.then === "decline") { s.declined[q.id] = day(); return; }
        if (op.then === "refuse") { s.q[q.id] = { s: "refused", step: 0, day: day(), sday: day(), end: day(), t: { done: {} }, times: 0 }; return; }
        if (op.cost && $gameParty.gold() < op.cost) { T.popup.need(COIN_ICON, "Potrzebujesz " + op.cost + " G"); stop(); return; }
        if (op.need && !listOk(op.need)) { popupMissing(op.need.map(([id, n]) => itemRow(id, n)).filter(r => r.have < r.n)); stop(); return; }
        if (op.cost) $gameParty.loseGold(op.cost);
        for (const [id, n] of op.need || []) { if (typeof id === "string" && id.startsWith("v:")) vtake(id.slice(2), n); else $gameParty.loseItem(item(id), n); }
        setFlag(op.flag);
        if (op.then === "accept") start(q, op.step || 0);
        else if (op.then === "close") finish(q, op.reward, { replace: !!op.reward });
        if (op.fx && FX[op.fx] && FX[op.fx].pick) FX[op.fx].pick(q, op);
    }
    function handIn(q, stepIdx, alt, stop) {
        const r = rec(q.id);
        if (!r || r.s !== "active" || r.step !== stepIdx) { stop(); return; }
        const st = q.steps[stepIdx];
        const tm = timing(q, r, st);
        if (!tm.ok) { stop(); return; }
        const miss = missingRows(st, alt);
        if (miss.length) { popupMissing(miss); stop(); return; }
        if (st.guard && FX[st.guard] && FX[st.guard].blocked && FX[st.guard].blocked(q, r, st)) { stop(); return; }
        takeNeeds(st, alt);
        r.t.alt = alt;
        if (st.se) T.audio.se(st.se, { volume: 85 });
        if (st.fx && FX[st.fx] && FX[st.fx].hand) FX[st.fx].hand(q, r, st);
        if (st.choice) { r.t.handed = stepIdx; return; }
        completeStep(q, { alt });
    }
    function stepPick(q, stepIdx, optIdx, stop) {
        const r = rec(q.id);
        if (!r || r.s !== "active" || r.step !== stepIdx) return;
        const st = q.steps[stepIdx], op = st.choice && st.choice.options[optIdx];
        if (!op) return;
        if (op.cost) {
            if ($gameParty.gold() < op.cost) { T.popup.need(COIN_ICON, "Potrzebujesz " + op.cost + " G"); stop(); return; }
            $gameParty.loseGold(op.cost);
        }
        setFlag(op.flag);
        addClue(op.clue);
        addNote(op.note);
        addPerk(op.perk);
        r.t.pick = r.t.pick || {};
        r.t.pick[stepIdx] = optIdx;
        if (op.fx && FX[op.fx] && FX[op.fx].pick) FX[op.fx].pick(q, op);
        completeStep(q, { reward: op.reward, alt: r.t.alt });
    }

    // ------------------------------------------------------------------
    // The talks: a resident's (TownLife's hook), the Lord's and grandpa's (Story.talk), a quest's place (an injected event)
    // ------------------------------------------------------------------
    // the talk a step gives `key`: { ready, list, pop } or null
    function stepTalk(q, r, st, key, spk) {
        if (st.talk && FX[st.talk] && FX[st.talk].talk) {
            const h = FX[st.talk].talk(q, r, st, key, spk);
            if (h) return h;
        }
        if ((st.type !== "bring" && st.type !== "talk") || st.to !== key) return null;
        const vars = varsOf(q, r), tm = timing(q, r, st);
        if (!tm.ok) return { ready: false, list: linesTo([], spk, (tm.why === "early" || tm.why === "hours") && st.early ? st.early : st.remind || st.early || [], vars) };
        const alt = altOf(st), miss = missingRows(st, alt);
        if (miss.length) return { ready: false, list: linesTo([], spk, st.remind || [], vars), pop: () => popupMissing(miss) };
        if (st.guard && FX[st.guard] && FX[st.guard].blocked && FX[st.guard].blocked(q, r, st)) return { ready: false, list: linesTo([], spk, [(q.lines || {}).guard || "Nie teraz."], vars) };
        const out = [];
        const pre = st.type === "talk" ? (st.sayFx && FX[st.sayFx] ? FX[st.sayFx].say(q, r, st) : st.say) : st.hero;
        linesTo(out, spk, pre, vars);
        script(out, [q.id, "hand", r.step, alt]);
        linesTo(out, spk, st.done, vars);
        if (st.fx && FX[st.fx] && FX[st.fx].post) linesTo(out, spk, FX[st.fx].post(q, r, st), vars);
        if (st.choice) choiceBlock(out, q, r.step, st.choice, spk, vars);
        return { ready: true, list: out };
    }
    // ready to do now for `key` (no side effects: the markers ask it)
    function stepReady(q, r, st, key) {
        if (st.talk && FX[st.talk] && FX[st.talk].ready) { const v = FX[st.talk].ready(q, r, st, key); if (v !== undefined && v !== null) return v; }
        if ((st.type !== "bring" && st.type !== "talk") || st.to !== key) return false;
        return timing(q, r, st).ok && missingRows(st).length === 0;
    }
    function offerList(q, spk) {
        const o = q.offer;
        if (o.custom && FX[o.custom] && FX[o.custom].offer) return FX[o.custom].offer(q, spk);
        const out = [], vars = varsOf(q, rec(q.id));
        linesTo(out, spk, o.say, vars);
        if (o.auto) {   // (Story's people: no choice in their talk - the quest is simply handed over, the story's talk goes on after it)
            script(out, [q.id, "opt", 0]);
            return linesTo(out, spk, o.accept, vars);
        }
        const opts = shownOptions(offerOptions(q));
        const branches = opts.map(({ op, i }) => { const b = []; script(b, [q.id, "opt", i]); linesTo(b, spk, op.say, vars); return b; });
        const cancel = opts.findIndex(x => x.op.then === "decline");
        return choiceTo(out, opts.map(x => x.op.label), branches, cancel < 0 ? opts.length - 1 : cancel);
    }
    // what `key` says about the quests now, or null; story: only the ready things and the offers (the Lord's talk goes on after)
    function talkFor(key, spk, story) {
        let remind = null, own = null;
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step];
            if (!st) continue;
            const h = stepTalk(q, r, st, key, spk);
            if (!h || !h.list || !h.list.length) continue;
            if (h.ready) return h.list;
            if (!remind) remind = h;
            if (!own && q.giver === key) own = h;
        }
        // (one thing at a time with each person: his own quest not done yet - he reminds of it before offering another)
        if (own && !story) { if (own.pop) own.pop(); return own.list; }
        for (const q of QUESTS) if (q.giver === key && (!story || q.offer.auto) && offerable(q)) { const list = offerList(q, spk); if (list && list.length) return list; }
        if (remind && !story) { if (remind.pop) remind.pop(); return remind.list; }
        return null;
    }
    // the first talk of the day: a greeting by the opinion, then the resident's usual line (TownLife's own, the same turn)
    function usualLine(key, ev) {
        const L = TL(), t = L && L.lines ? L.lines(key) : null;
        if (!t) return "";
        const h = hour(), w = $gameScreen.weatherType(), rain = (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0;
        const slot = rain && t.rain ? "rain" : h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
        const list = t[slot] || t.day || [];
        if (!list.length) return "";
        const st = ev._town || (ev._town = {}), n = st.talkN || 0;
        st.talkN = n + 1;
        return list[n % list.length];
    }
    function greeting(key, ev, spk) {
        const s = S();
        if (s.greeted[key] === day()) return null;
        s.greeted[key] = day();
        const tier = tierOf(s.opinion), mine = D.GREET[key] && D.GREET[key][tier];
        const g = pick(mine && mine.length ? mine : D.GREET.any[tier]), usual = usualLine(key, ev);
        return sayTo([], spk, g + (usual ? " " + usual : ""));
    }
    function residentTalk(key, ev) {
        if (!has()) return null;
        const res = resident(key), spk = { id: ev.eventId(), name: res ? res.name : key };
        try { return talkFor(key, spk, false) || greeting(key, ev, spk); } catch (e) { report("talk " + key, e); return null; }
    }
    // the hook into Story.js's talks of the Lord and grandpa: the quest's lines first, then the story's own talk
    let storyTalkOrig = null;
    function storyTalk(interp, role) {
        if (storyTalkOrig) return storyTalkOrig.call(ST(), interp, role);
    }
    function hookStory() {
        const St = ST();
        if (!St || typeof St.talk !== "function" || St.talk._townQuests) return;
        storyTalkOrig = St.talk;
        const wrapped = function(interp, role) {
            let pre = null;
            if ((role === "lord" || role === "grandpa") && interp && has() && storyOn()) {
                try {
                    const ev = $gameMap.event(interp.eventId());
                    if (ev) pre = talkFor(role, { id: ev.eventId(), name: nameOf(role) }, true);
                } catch (e) { report("story talk", e); pre = null; }
            }
            if (pre && pre.length) {
                interp.setupChild(pre.concat([C(355, ["TownQuests.storyTalk(this, " + JSON.stringify(role) + ")"]), C(0, [])]), interp.eventId());
                return;
            }
            return storyTalkOrig.apply(this, arguments);
        };
        wrapped._townQuests = true;
        St.talk = wrapped;
    }
    hookStory();

    // the places of the quests (injected events): which one, what it says
    const SPOT_LIST = Object.keys(D.SPOTS).map(k => Object.assign({ key: k }, D.SPOTS[k]));
    const spotOf = (mapId, id) => SPOT_LIST.find(s => s.map === mapId && s.id === id) || null;
    function spotTalk(interp) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId()), s = ev && spotOf($gameMap.mapId(), ev.eventId());
        if (!s) return;
        const spk = { id: ev.eventId(), name: s.name };
        try {
            for (const q of activeQuests()) {
                const r = rec(q.id), st = q.steps[r.step];
                if (!st) continue;
                if (st.spotFx && FX[st.spotFx] && (st.spots || []).includes(s.key)) {
                    const list = FX[st.spotFx].spot(q, r, st, s, spk);
                    if (list) { if (list.length) interp.setupChild(list.concat([C(0, [])]), ev.eventId()); return; }
                }
                if (st.type !== "spot" || st.spot !== s.key) continue;
                const vars = varsOf(q, r), tm = timing(q, r, st);
                if (!tm.ok) {
                    const text = fill((st.early || ["Jeszcze nie pora."])[0], vars).replace(/^> /, "");
                    T.popup(tm.why === "weather" ? "Przy takiej pogodzie nic tu nie widać." : text, { color: "#ffe9a8" });
                    return;
                }
                const miss = missingRows(st);
                if (miss.length) { popupMissing(miss); return; }
                const out = [];
                linesTo(out, spk, st.say, vars);
                script(out, [q.id, "hand", r.step, -1]);
                linesTo(out, spk, st.done, vars);
                if (st.choice) choiceBlock(out, q, r.step, st.choice, spk, vars);
                interp.setupChild(out.concat([C(0, [])]), ev.eventId());
                return;
            }
        } catch (e) { report("spot " + s.key, e); }
    }
    // is a place wanted now (its event shows): the step that needs it is the current one
    function spotWanted(key) {
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step];
            if (!st) continue;
            if (st.spotFx && FX[st.spotFx] && (st.spots || []).includes(key)) { if (FX[st.spotFx].wanted(q, r, st, key)) return { q, st, ready: true }; continue; }
            if (st.type === "spot" && st.spot === key) return { q, st, ready: timing(q, r, st).ok };
        }
        return null;
    }

    // ------------------------------------------------------------------
    // Injected events: the quests' places (ids 951-959; on each map only its own)
    // ------------------------------------------------------------------
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function spotEvent(s) {
        const page = { conditions: Object.assign({}, BLANK, { selfSwitchCh: "A", selfSwitchValid: true }), directionFix: true,
            image: { tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 },
            list: [C(355, ["TownQuests.spot(this)"]), C(0, [])],
            moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: true, trigger: 0, walkAnime: false };
        return { id: s.id, name: "Zadanie: " + s.name, note: "<TownQuests:" + s.key + ">", pages: [page], x: s.x, y: s.y };
    }
    const SPOT_MAPS = Array.from(new Set(SPOT_LIST.map(s => s.map)));
    T.inject(SPOT_MAPS, { ids: [951, 959], owner: PLUGIN,
        build(data, mapId) { return SPOT_LIST.filter(s => s.map === mapId && s.x < data.width && s.y < data.height).map(spotEvent); } });
    function syncSpots() {
        if (!$gameMap || !$gameSelfSwitches) return;
        const mapId = $gameMap.mapId();
        for (const s of SPOT_LIST) {
            if (s.map !== mapId || !$gameMap.event(s.id)) continue;
            const on = !!spotWanted(s.key), k = [mapId, s.id, "A"];
            if (!!$gameSelfSwitches.value(k) !== on) $gameSelfSwitches.setValue(k, on);
        }
    }
    // O pressed standing ON a place (not only facing it): it answers too
    const _Game_Player_checkEventTriggerHere = Game_Player.prototype.checkEventTriggerHere;
    Game_Player.prototype.checkEventTriggerHere = function(triggers) {
        _Game_Player_checkEventTriggerHere.call(this, triggers);
        if (!triggers.includes(0) || !this.canStartLocalEvents() || $gameMap.isEventRunning() || $gameMap.isAnyEventStarting()) return;
        for (const ev of $gameMap.eventsXy(this.x, this.y)) {
            if (spotOf($gameMap.mapId(), ev.eventId()) && ev.page() && ev.isTriggerIn([0])) { ev.start(); return; }
        }
    };

    // ------------------------------------------------------------------
    // Markers over the people and the places: "!" an offer, a tick something to give back, a diamond a place
    // ------------------------------------------------------------------
    const markers = {};   // key -> "new" | "ready" | ""
    function refreshMarkers() {
        if (!has()) return;
        const keys = ((TL() && TL().RESIDENTS) || []).map(r => r.key).concat(["lord", "grandpa"]);
        for (const key of keys) {
            let m = "";
            for (const q of activeQuests()) { const r = rec(q.id), st = q.steps[r.step]; if (st && stepReady(q, r, st, key)) { m = "ready"; break; } }
            if (!m && QUESTS.some(q => q.giver === key && offerable(q) && !(q.repeat === "trade" && !FX.k16Trade.goods().length && isDone(q.id)))) m = "new";
            markers[key] = m;
        }
    }
    const markerCache = {};
    function markerBitmap(kind) {
        if (markerCache[kind]) return markerCache[kind];
        const b = new Bitmap(26, 30), ctx = b.context, col = kind === "ready" ? "#7ddc6a" : "#ffd23f", U = window.UIStyle;
        if (U && U.panel) U.panel(ctx, 1, 1, 24, 24, { cut: 4, fill: "rgba(11,12,15,0.9)", line: col, accent: false });
        else { ctx.fillStyle = "rgba(11,12,15,0.9)"; ctx.fillRect(1, 1, 24, 24); }
        ctx.fillStyle = "rgba(11,12,15,0.9)";
        ctx.beginPath(); ctx.moveTo(9, 25); ctx.lineTo(13, 29); ctx.lineTo(17, 25); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.lineCap = "round";
        if (kind === "ready") { ctx.beginPath(); ctx.moveTo(7, 13); ctx.lineTo(11.5, 18); ctx.lineTo(19, 8); ctx.stroke(); }
        else if (kind === "spot") { ctx.beginPath(); ctx.moveTo(13, 6); ctx.lineTo(19, 13); ctx.lineTo(13, 20); ctx.lineTo(7, 13); ctx.closePath(); ctx.fill(); }
        else { ctx.fillRect(11.5, 6, 3, 10); ctx.fillRect(11.5, 18.5, 3, 3); }
        b._baseTexture.update();
        return (markerCache[kind] = b);
    }
    // the little pictures of the places: a paper notice, a glint, paw prints, a drowned fire basket
    const decoCache = {};
    function decoBitmap(kind) {
        if (decoCache[kind]) return decoCache[kind];
        const b = new Bitmap(48, 48), ctx = b.context;
        if (kind === "paper") {
            ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(15, 13, 20, 24);
            ctx.fillStyle = "#e9dcb6"; ctx.fillRect(13, 11, 20, 24);
            ctx.fillStyle = "#cdbb8f"; ctx.fillRect(13, 31, 20, 4);
            ctx.fillStyle = "#6b5a3a"; for (let i = 0; i < 5; i++) ctx.fillRect(16, 16 + i * 3, i === 0 ? 14 : 10 + (i % 2) * 3, 1);
            ctx.fillStyle = "#555"; ctx.fillRect(22, 12, 2, 2);
        } else if (kind === "glint") {
            ctx.fillStyle = "#fffbe0";
            ctx.beginPath(); ctx.moveTo(24, 12); ctx.lineTo(26, 22); ctx.lineTo(36, 24); ctx.lineTo(26, 26); ctx.lineTo(24, 36); ctx.lineTo(22, 26); ctx.lineTo(12, 24); ctx.lineTo(22, 22); ctx.closePath(); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.fillRect(23, 23, 3, 3);
        } else if (kind === "tracks") {
            ctx.fillStyle = "rgba(40,30,20,0.55)";
            for (const [x, y] of [[10, 34], [20, 26], [28, 34], [38, 24], [16, 14]]) {
                ctx.beginPath(); ctx.ellipse(x, y, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
                for (const [dx, dy] of [[-3, -4], [0, -5], [3, -4]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.2, 0, Math.PI * 2); ctx.fill(); }
            }
        } else if (kind === "doused") {
            ctx.fillStyle = "rgba(60,70,80,0.55)";
            ctx.beginPath(); ctx.ellipse(24, 40, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(200,210,220,0.35)";
            for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(18 + i * 4, 18 - i * 3, 4 + i, 0, Math.PI * 2); ctx.fill(); }
        }
        b._baseTexture.update();
        return (decoCache[kind] = b);
    }
    // a TownLife resident (on the town map, in the tavern, at home): its note says <Town:key>
    function residentKeyOf(ev) {
        const d = ev.event && ev.event(), m = d && d.note ? /<Town:(\w+)>/.exec(d.note) : null;
        return m ? m[1] : null;
    }
    function storyRoleOf(ev) {
        const St = ST(), N = St && St.NPCS;
        if (!N) return null;
        for (const role of ["grandpa", "lord"]) if (N[role] && N[role].id === ev.eventId() && N[role].map === $gameMap.mapId()) return role;
        return null;
    }
    function updateDeco(spr, c) {
        let kind = "", deco = "";
        const s = spotOf($gameMap.mapId(), c.eventId());
        if (s) {
            const w = spotWanted(s.key);
            if (w && w.ready) kind = "spot";
            if (s.deco === "paper") deco = S().flags["notice_" + s.key] && day() - S().flags["notice_" + s.key] < 7 ? "paper" : "";
            else if (s.deco === "glint") deco = w && w.ready && Math.sin(Graphics.frameCount / 9) > 0.2 ? "glint" : "";
            else if (s.deco === "tracks") deco = w && w.q.id === "D5" ? "tracks" : "";
            else if (s.deco === "doused") deco = w && w.q.id === "D11" && w.ready ? "doused" : "";
        } else {
            const key = residentKeyOf(c) || (c.eventId() >= 900 && c.eventId() <= 902 ? storyRoleOf(c) : null);
            if (key && !c.isTransparent() && c.opacity() > 0) kind = markers[key] || "";
        }
        if (kind && !spr._tqMark) { spr._tqMark = new Sprite(); spr._tqMark.anchor.set(0.5, 1); spr.addChild(spr._tqMark); }
        if (spr._tqMark) {
            const m = spr._tqMark;
            m.visible = !!kind;
            if (kind) {
                if (m._kind !== kind) { m.bitmap = markerBitmap(kind); m._kind = kind; }
                m.y = -Math.max(40, spr.patternHeight()) - 2 - Math.round(Math.abs(Math.sin(Graphics.frameCount / 18)) * 4);
                m.scale.set(1 / (spr.scale.x || 1), 1 / (spr.scale.y || 1));
            }
        }
        if (deco && !spr._tqDeco) { spr._tqDeco = new Sprite(); spr._tqDeco.anchor.set(0.5, 1); spr.addChildAt(spr._tqDeco, 0); }
        if (spr._tqDeco) {
            spr._tqDeco.visible = !!deco;
            if (deco && spr._tqDeco._kind !== deco) { spr._tqDeco.bitmap = decoBitmap(deco); spr._tqDeco._kind = deco; }
        }
        if (s && (kind || deco) && !c.isTransparent()) spr.visible = true;   // (MZ hides an event without a picture - a place shows its marker and its little picture)
    }
    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        const c = this._character;
        if (c instanceof Game_Event && has() && $gameMap) { try { updateDeco(this, c); } catch (e) { /* (a sprite must never stop the map) */ } }
    };

    // ------------------------------------------------------------------
    // The bell: TownLife's bell kept quiet when the hero rang that hour himself (or the rope broke: K13); the signals (W2)
    // ------------------------------------------------------------------
    function muted() {
        if (!has() || !onTown()) return false;
        const d = day(), h = hour();
        return S().mute.some(m => m.day === d && h >= m.from && h < m.to);
    }
    function mute(from, to) {
        const s = S();
        s.mute = s.mute.filter(m => m.day >= day() - 1);
        s.mute.push({ day: day(), from, to });
    }
    const _AudioManager_playSe = AudioManager.playSe;
    AudioManager.playSe = function(se) {
        if (se && se.name === BELL_SE.name && onTown()) { checkDeadlines(); if (muted()) return; }
        return _AudioManager_playSe.apply(this, arguments);
    };
    const bellQueue = [];
    function ringPattern(pattern, delay) {
        let t = Graphics.frameCount + (delay || 30);
        pattern.forEach((g, gi) => { for (let i = 0; i < g; i++) { bellQueue.push(t); t += 48; } if (gi < pattern.length - 1) t += 100; });
    }
    function updateBellQueue() {
        while (bellQueue.length && Graphics.frameCount >= bellQueue[0]) { bellQueue.shift(); if (onTown()) T.audio.se(BELL_SE.name, { volume: BELL_SE.volume, pitch: BELL_SE.pitch }); }
    }
    // a signal heard on the town map: noted (W2); the first of a kind goes into the journal
    function hearSignal(sig) {
        if (!has() || !D.SIGNALS[sig]) return;
        const s = S(), first = !s.bells.some(b => b.sig === sig);
        s.bells.push({ day: day(), hour: Math.round(hour() * 4) / 4, sig });
        if (s.bells.length > 30) s.bells.splice(0, s.bells.length - 30);
        const sg = D.SIGNALS[sig];
        if (first) addNote(["Dzwon: " + sg.name, "Dzień " + day() + ", " + hm(hour()) + ": dzwon - " + sg.name + ". " + sg.when]);
        autoChecks();
    }
    function onHour(e) {
        if (!has()) return;
        checkDeadlines();
        if (!onTown()) return;
        const L = TL();
        if (e.hour === 3 && L && L.RESIDENTS) {   // TownLife rings three at three when Ambroży stands at the bell
            const res = L.RESIDENTS.find(r => r.key === "dzwonnik");
            if (res && L.entryAt(res, 3.01).act === "bell" && !muted()) hearSignal("3");
        }
        if (e.hour === 23 && S().rung.change !== day()) {   // the change of the watch: Wit goes in at 23
            S().rung.change = day();
            ringPattern([1, 1, 1, 1], 60);
            hearSignal("1-1-1-1");
        }
    }
    function rainSignal() {
        if (!onTown() || S().rung.rain === day()) return;
        const Sv = T.api("Survival"), w = Sv && Sv.currentWeather ? Sv.currentWeather() : null;
        if (!w || w.type !== "rain" || dryBefore(day()) < 3) return;
        S().rung.rain = day();
        ringPattern([4, 2], 120);
        hearSignal("4+2");
    }
    T.on("lightning", () => {
        if (!has() || !onTown() || S().rung.storm === day()) return;
        S().rung.storm = day();
        ringPattern([2, 2, 2], 180);
        hearSignal("2+2+2");
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The bell mini-game: a bell swings, O pulls the rope when its heart is up (the green ends of the gauge); exactly N strikes
    // ------------------------------------------------------------------
    const UI = T.ui;
    let Scene_TownBell = null;
    if (UI && UI.Scene_MiniGame) {
        const W0 = 1280, H0 = 720, PIVOT = { x: 520, y: 150 };
        const bmpCache = {};
        const cached = (k, fn) => bmpCache[k] || (bmpCache[k] = fn());
        const dirty = b => { if (b && b._baseTexture) b._baseTexture.update(); return b; };
        const backBitmap = () => cached("back", () => {
            const b = new Bitmap(W0, H0), ctx = b.context;
            const g = ctx.createLinearGradient(0, 0, 0, H0); g.addColorStop(0, "#1b1a20"); g.addColorStop(1, "#0d0c10");
            ctx.fillStyle = g; ctx.fillRect(0, 0, W0, H0);
            for (let y = 0; y < H0; y += 40) for (let x = (y / 40) % 2 ? 0 : 40; x < W0; x += 80) { ctx.fillStyle = "rgba(255,255,255,0.025)"; ctx.fillRect(x, y, 78, 38); }
            // the arch of the tower's window and the night outside
            ctx.fillStyle = "#26314a"; ctx.beginPath(); ctx.moveTo(880, 520); ctx.lineTo(880, 210); ctx.arc(990, 210, 110, Math.PI, 0); ctx.lineTo(1100, 520); ctx.closePath(); ctx.fill();
            ctx.fillStyle = "#e9e3c4"; for (const [x, y] of [[930, 250], [1040, 230], [1010, 330], [960, 400], [1070, 420]]) ctx.fillRect(x, y, 2, 2);
            ctx.strokeStyle = "#3a3540"; ctx.lineWidth = 10; ctx.stroke();
            // the beam the bell hangs on
            ctx.fillStyle = "#3b2818"; ctx.fillRect(250, PIVOT.y - 40, 540, 34);
            ctx.fillStyle = "#2a1c10"; ctx.fillRect(250, PIVOT.y - 10, 540, 6);
            const v = ctx.createRadialGradient(W0 / 2, H0 / 2, 200, W0 / 2, H0 / 2, 760); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.7)");
            ctx.fillStyle = v; ctx.fillRect(0, 0, W0, H0);
            return dirty(b);
        });
        const bellBitmap = () => cached("bell", () => {
            const w = 260, h = 300, b = new Bitmap(w, h), ctx = b.context, cx = w / 2;
            ctx.fillStyle = "#4a3a22"; ctx.fillRect(cx - 20, 0, 40, 26);   // the yoke
            ctx.fillStyle = "#2c2214"; ctx.fillRect(cx - 20, 22, 40, 6);
            const body = new Path2D();
            body.moveTo(cx - 46, 34); body.bezierCurveTo(cx - 70, 40, cx - 78, 120, cx - 86, 200);
            body.bezierCurveTo(cx - 92, 240, cx - 120, 250, cx - 122, 262); body.lineTo(cx + 122, 262);
            body.bezierCurveTo(cx + 120, 250, cx + 92, 240, cx + 86, 200); body.bezierCurveTo(cx + 78, 120, cx + 70, 40, cx + 46, 34); body.closePath();
            const g = ctx.createLinearGradient(cx - 120, 0, cx + 120, 0);
            g.addColorStop(0, "#5b3d16"); g.addColorStop(0.3, "#b98a3e"); g.addColorStop(0.45, "#e8c27a"); g.addColorStop(0.6, "#a8762f"); g.addColorStop(1, "#4b3112");
            ctx.fillStyle = g; ctx.fill(body);
            ctx.strokeStyle = "#2a1a08"; ctx.lineWidth = 3; ctx.stroke(body);
            ctx.fillStyle = "rgba(40,24,6,0.5)"; ctx.fillRect(cx - 100, 218, 200, 6); ctx.fillRect(cx - 70, 92, 140, 4);
            ctx.fillStyle = "rgba(255,240,200,0.18)"; ctx.fillRect(cx - 30, 50, 10, 170);
            ctx.fillStyle = "#1c140a"; ctx.beginPath(); ctx.ellipse(cx, 262, 122, 12, 0, 0, Math.PI * 2); ctx.fill();   // its mouth
            ctx.fillStyle = "#3a2c18"; ctx.beginPath(); ctx.arc(cx, 280, 13, 0, Math.PI * 2); ctx.fill();               // the clapper
            ctx.fillStyle = "#6a5434"; ctx.beginPath(); ctx.arc(cx - 4, 276, 4, 0, Math.PI * 2); ctx.fill();
            // a raven cut in the bronze
            ctx.strokeStyle = "rgba(40,24,6,0.7)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx - 16, 150); ctx.quadraticCurveTo(cx, 136, cx + 16, 150); ctx.moveTo(cx, 143); ctx.lineTo(cx + 8, 160); ctx.stroke();
            return dirty(b);
        });
        Scene_TownBell = class extends UI.Scene_MiniGame {
            createGame() {
                const o = this.opts;
                this.target = Math.max(1, o.target || 6);
                this.period = Math.max(50, o.period || 110);
                this.win = Math.min(0.97, Math.max(0.7, o.window || 0.86));
                this.bot = o.bot === "target" ? this.target : typeof o.bot === "number" ? o.bot : null;   // (tests: strikes by itself)
                this.setTitle("DZWON", o.sub || "dzwonnica na rynku");
                this.setHints([["O", "pociągnij sznur"], ["P", "pauza"]]);
                this.root = new Sprite();
                this.stage.addChild(this.root);
                this.root.addChild(new Sprite(backBitmap()));
                this.rope = new Sprite(new Bitmap(W0, H0));
                this.root.addChild(this.rope);
                this.bell = new Sprite(bellBitmap());
                this.bell.anchor.set(0.5, 0.02);
                this.bell.x = PIVOT.x; this.bell.y = PIVOT.y;
                this.root.addChild(this.bell);
                this.gauge = new Sprite(new Bitmap(560, 64));
                this.gauge.x = PIVOT.x - 280; this.gauge.y = 560;
                this.root.addChild(this.gauge);
                this.slate = new Sprite(new Bitmap(320, 240));
                this.slate.x = 860; this.slate.y = 92;
                this.root.addChild(this.slate);
                this.ph = 0; this.strikes = 0; this.faults = 0; this.silent = 0; this.usedWin = null; this.curWin = null; this.shake = 0;
                this.over = 0; this.result = null; this.lastSlate = "";
            }
            begin() {
                if (this.bot !== null) { this.setPhase("play"); return; }
                this.setPhase("intro");
                const o = this.opts;
                this.showCard({ kicker: "DZWON", title: o.title || "Zadzwoń " + this.target + " razy", sub: o.who || "",
                    lines: ["O - pociągnij sznur, kiedy serce dzwonu jest na górze (zielone końce paska).", "Uderz dokładnie " + this.target + " razy - i przestań. Liczba ma znaczenie.",
                        "Za wcześnie albo za późno - zgrzyt. Więcej niż dwa zgrzyty i rytm się sypie."],
                    foot: "O - zaczynamy", h: 400 }, () => this.setPhase("play"));
            }
            helpLines() { return ["O, kiedy wskazówka jest na zielonym końcu paska.", "Dokładnie " + this.target + " uderzeń, potem puść sznur."]; }
            quitResult() { return { strikes: this.strikes, faults: this.faults, target: this.target, ok: false }; }
            tick() {
                if (this.phase === "end") { if (++this.over > 70) this.end(this.result); return; }
                if (this.phase !== "play") return;
                this.ph += (Math.PI * 2) / this.period;
                const s = Math.sin(this.ph), inWin = Math.abs(s) >= this.win, k = Math.round((this.ph - Math.PI / 2) / Math.PI);
                if (inWin) this.curWin = k;
                else if (this.curWin !== null) {   // a window just went by
                    if (this.usedWin !== this.curWin && this.strikes > 0) this.silent++;
                    this.curWin = null;
                    if (this.strikes > 0 && this.silent >= 2) return this.finish();
                    if (this.strikes === 0 && k > 12) return this.finish();
                }
                let press = this.trig.ok;
                if (this.bot !== null) press = inWin && this.usedWin !== k && this.strikes < this.bot && Math.abs(s) > 0.985;
                if (press) {
                    if (inWin && this.usedWin !== k) {
                        this.usedWin = k; this.strikes++; this.silent = 0; this.shake = 14;
                        T.audio.se(BELL_SE.name, { volume: 90, pitch: BELL_SE.pitch });
                    } else {
                        this.faults++;
                        this.se("buzzer");
                        this.banner.show("bust", "Zgrzyt!", "", 40);
                    }
                }
                if (this.shake > 0) this.shake--;
            }
            finish() {
                const ok = this.strikes === this.target && this.faults <= 2;
                this.result = { strikes: this.strikes, faults: this.faults, target: this.target, ok, right: this.strikes === this.target };
                this.banner.show(ok ? "win" : "lose", ok ? "Równo!" : this.strikes === this.target ? "Krzywo..." : "Zła liczba!", this.strikes + " uderzeń", 80);
                this.se(ok ? "win" : "lose");
                this.setPhase("end");
                this.over = 0;
            }
            frame() {
                const s = Math.sin(this.ph);
                this.bell.rotation = 0.42 * s + (this.shake > 0 ? Math.sin(this.shake * 1.7) * 0.012 * this.shake : 0);
                // the rope from the bell's wheel down out of the picture
                const rb = this.rope.bitmap, rc = rb.context, ex = PIVOT.x + Math.sin(this.bell.rotation) * 30;
                rb.clear();
                rc.strokeStyle = "#8a6a3a"; rc.lineWidth = 5; rc.beginPath(); rc.moveTo(ex, PIVOT.y + 10); rc.quadraticCurveTo(PIVOT.x + 40 * s, 460, PIVOT.x + 20, H0); rc.stroke();
                dirty(rb);
                // the gauge: where the heart is, the green ends
                const gb = this.gauge.bitmap, gc = gb.context, gw = gb.width, x0 = 20, x1 = gw - 20, mid = (x0 + x1) / 2, half = (x1 - x0) / 2;
                gb.clear();
                if (UI.panel) UI.panel(gb, 0, 0, gw, 64, { cut: 6 });
                gc.fillStyle = "#2a2e36"; gc.fillRect(x0, 26, x1 - x0, 12);
                gc.fillStyle = "#5fbf5a"; const zw = half * (1 - this.win) * 1.4 + 6;
                gc.fillRect(x0, 24, zw, 16); gc.fillRect(x1 - zw, 24, zw, 16);
                const nx = mid + s * half;
                gc.fillStyle = Math.abs(s) >= this.win ? "#bdf5a8" : "#ffd23f"; gc.fillRect(nx - 4, 14, 8, 36);
                dirty(gb);
                const key = this.strikes + "|" + this.faults;
                if (key !== this.lastSlate) {
                    this.lastSlate = key;
                    const b = this.slate.bitmap, U = UI;
                    b.clear();
                    if (U.panel) U.panel(b, 0, 0, 320, 240, { cut: 8 });
                    U.text(b, "UDERZENIA", 20, 18, 280, { size: 18, color: "#9aa0a8", bold: true });
                    U.text(b, this.strikes + " / " + this.target, 20, 46, 280, { size: 64, color: this.strikes > this.target ? "#ff9f8f" : "#ffd23f", bold: true });
                    U.text(b, "Zgrzyty: " + this.faults, 20, 140, 280, { size: 24, color: this.faults > 2 ? "#ff9f8f" : "#d8dde3" });
                    U.text(b, "Puść sznur po ostatnim.", 20, 186, 280, { size: 18, color: "#9aa0a8" });
                    dirty(b);
                }
            }
            state() { return Object.assign(super.state(), { strikes: this.strikes, faults: this.faults, target: this.target, result: this.result }); }
        };
        Scene_TownBell.gameId = "townBell";
    }
    // opens the mini-game; onEnd(result) on the map
    function openBell(opts, onEnd) {
        if (!Scene_TownBell || !UI) { onEnd({ strikes: opts.target, faults: 0, target: opts.target, ok: true, right: true, none: true }); return true; }
        const o = Object.assign({}, api.bellOpts || {}, opts, { onEnd: res => { try { onEnd(res || {}); } catch (e) { report("bell end", e); } } });
        return UI.open(Scene_TownBell, o);
    }

    // ------------------------------------------------------------------
    // The quests' own handlers (named in the data: talk / ready / act / check / tick / fx)
    // ------------------------------------------------------------------
    const visible = key => !!residentEv(key);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const FX = {
        // ---- K1: before nine Tadek sharpens a worn tool
        k1Early: {
            post: () => (hour() < 9 && wornTool() ? ["I jeszcze przed dziewiątą! Daj no to narzędzie... O tak. Teraz tnie jak nowe."] : []),
            hand: () => {
                const id = hour() < 9 ? wornTool() : 0, Du = T.api("Durability");
                if (id && Du && Du.repair(id)) T.popup("Tadek naostrzył: " + item(id).name, { icon: iconOfItem(id), kind: "good" });
            }
        },
        // ---- K5: four loaves before nine
        k5: {
            talk(q, r, st, key, spk) {
                if (!st.targets.includes(key) || (r.t.k5 || {})[key] || vcount("bochen") <= 0 || hour() >= 9) return null;
                const out = [], g = D.GOSSIP[key] || ["Dziękuję."];
                linesTo(out, spk, ["> Chleb od Hanki."]);
                script(out, [q.id, "fx", "k5", key]);
                linesTo(out, spk, [g[day() % g.length]]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => st.targets.includes(key) && !(r.t.k5 || {})[key] && vcount("bochen") > 0 && hour() < 9,
            act(q, key) {
                const r = rec(q.id);
                if (!r || (r.t.k5 || {})[key] || vcount("bochen") <= 0) return;
                (r.t.k5 = r.t.k5 || {})[key] = 1;
                vtake("bochen", 1);
                const g = D.GOSSIP[key] || [], text = g[day() % g.length], seenKey = "gossip:" + key + ":" + (day() % Math.max(1, g.length));
                if (text && !S().seen[seenKey]) { S().seen[seenKey] = day(); addNote(["Plotka: " + nameOf(key), text]); }
                if (Object.keys(r.t.k5).length >= q.steps[r.step].targets.length) completeStep(q);
            }
        },
        // ---- K9: the two of them say their bit when they are near
        k9Fair: { pick: () => { if (visible("kowal")) T.call("TownLife", "say", "kowal", "No dobra. Po połowie."); if (visible("garbarz")) T.call("TownLife", "say", "garbarz", "Niech będzie. Na zmianę."); } },
        k9Dice: { pick: () => { if (visible("garbarz")) T.call("TownLife", "say", "garbarz", "Kośćmi... Następnym razem rzucisz za mnie, kowalu?"); } },
        // ---- K13: the rope broke - the noon bell is silent today
        k13Silence: {
            fail: () => {
                mute(12, 12.4);
                for (const k of ["piekarka", "kowal", "soltys", "woziwoda"]) if (visible(k)) { T.call("TownLife", "say", k, "Czemu dzwon milczy?"); break; }
            }
        },
        // ---- K14 / D16: ringing the bell (the mini-game)
        bellTalk: {
            talk(q, r, st, key, spk) {
                if (key !== "dzwonnik" || !inHours(hour(), [17.5, 18.4])) return null;
                const out = [];
                linesTo(out, spk, (q.lines && q.lines.go) || []);
                script(out, [q.id, "fx", "bellTalk"]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "dzwonnik" && inHours(hour(), [17.5, 18.4]),
            act(q, arg, interp) {
                const st = q.steps[rec(q.id).step];
                openBell({ target: st.target || 6, title: "Szósta wieczorem", who: "Ambroży patrzy z dołu", period: 112, window: 0.86 }, res => bellK14(q, res));
            }
        },
        bellLesson: {
            talk(q, r, st, key, spk) {
                if (key !== "dzwonnik" || !bellTime()) return null;
                const out = [];
                if (r.t.last === day()) return { ready: false, list: linesTo(out, spk, (q.lines && q.lines.wait) || []) };
                linesTo(out, spk, (q.lines && q.lines.go) || [], varsOf(q, r));
                script(out, [q.id, "fx", "bellLesson"]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "dzwonnik" && !!bellTime() && r.t.last !== day(),
            act(q) {
                const r = rec(q.id), n = r.t.n || 0, h = bellTime();
                if (!h) return;
                const target = h % 12 || 12;
                openBell({ target, title: "Lekcja " + (n + 1) + " z 4 - " + h + ":00", who: "Ambroży liczy z tobą", period: 112 - n * 10, window: 0.86 + n * 0.02 },
                    res => bellLesson(q, res, h));
            }
        },
        // ---- K15: the crate to the corporal instead; the pay the next day
        k15Wit: {
            talk(q, r, st, key, spk) {
                if (key !== "kapral" || vcount("skrzynia") <= 0 || !inHours(hour(), [21.5, 23])) return null;
                const out = [];
                linesTo(out, spk, (q.lines && q.lines.wit) || []);
                script(out, [q.id, "fx", "k15Wit"]);
                return { ready: true, list: out };
            },
            ready: () => false,   // (no tick over Wit: that would tell the player what to do)
            act(q) {
                const r = rec(q.id);
                if (!r || r.step !== 0) return;
                vtake("skrzynia", 1);
                setFlag("k15Wit");
                addOpinion(2, "skrzynia u kaprala");
                completeStep(q);
            }
        },
        k15Pay: {
            talk(q, r, st, key, spk) {
                if (key !== "kupiec" || day() <= r.sday || !inHours(hour(), [8, 18])) return null;
                const f = S().flags, L = q.lines || {}, out = [];
                linesTo(out, spk, f.k15Wit ? L.payWit : f.k15Opened ? L.payOpened : L.payClean);
                script(out, [q.id, "fx", "k15Pay"]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "kupiec" && day() > r.sday && inHours(hour(), [8, 18]),
            act(q) {
                const f = S().flags;
                finish(q, f.k15Wit ? { xp: 50 } : f.k15Opened ? { gold: 10, xp: 50 } : { gold: 20, xp: 50 }, { replace: true });
            }
        },
        // ---- K16: Baltazar buys what keeps (a trade on the day after a ferry)
        k16Trade: {
            GOODS: [103, 102, 105, 106],
            goods() { return this.GOODS.filter(id => count(id) > 0); },
            left() { const t = S().trade; return t.day === day() ? Math.max(0, 10 - t.n) : 10; },
            offer(q, spk) {
                const L = q.lines || {}, out = [], left = this.left(), goods = this.goods();
                if (left <= 0) return linesTo(out, spk, L.full);
                linesTo(out, spk, L.intro);
                if (!goods.length) return linesTo(out, spk, L.none);
                const labels = goods.map(id => item(id).name + " ×" + Math.min(count(id), left) + " - " + item(id).price + " G za sztukę").concat([L.no || "Nic nie sprzedam."]);
                const branches = goods.map(id => { const b = []; script(b, [q.id, "fx", "k16Trade", id]); linesTo(b, spk, L.sold); return b; }).concat([[]]);
                return choiceTo(out, labels, branches, labels.length - 1);
            },
            act(q, id) {
                const n = Math.min(count(id), this.left());
                if (n <= 0 || this.GOODS.indexOf(id) < 0) return;
                $gameParty.loseItem(item(id), n);
                const gold = item(id).price * n, t = S().trade;
                if (t.day !== day()) { t.day = day(); t.n = 0; }
                t.n += n;
                $gameParty.gainGold(gold);
                if (!isDone(q.id)) finish(q);
                else T.popup("Sprzedane: " + item(id).name + " ×" + n, { icon: iconOfItem(id), kind: "gold" });
            }
        },
        // ---- K17: the four notices (a nail and the hammer each)
        k17: {
            wanted: (q, r, st, key) => !(r.t.k17 || {})[key],
            spot(q, r, st, s, spk) {
                if ((r.t.k17 || {})[s.key]) { T.popup("Tu już wisi obwieszczenie.", { color: "#ffe9a8" }); return []; }
                const miss = [itemRow(89, 1), itemRow(88, 1)].filter(x => x.have < 1);
                if (miss.length) { popupMissing(miss.map(x => Object.assign(x, { tool: x.id === 89 }))); return []; }
                const out = [];
                linesTo(out, spk, ["> (Przykładasz obwieszczenie do ściany i przybijasz je gwoździem.)"]);
                script(out, [q.id, "fx", "k17", s.key]);
                return out;
            },
            act(q, key) {
                const r = rec(q.id);
                if (!r || (r.t.k17 || {})[key] || count(88) < 1 || count(89) < 1) return;
                (r.t.k17 = r.t.k17 || {})[key] = day();
                $gameParty.loseItem(item(88), 1);
                vtake("obwieszczenie", 1);
                S().flags["notice_" + key] = day();
                T.audio.se("Hammer", { volume: 80 });
                const s = D.SPOTS[key], react = q.react && q.react[key];
                if (react && s && s.owner && visible(s.owner)) T.call("TownLife", "say", s.owner, react);
                r.t.n = Object.keys(r.t.k17).length;
                if (r.t.n >= q.steps[r.step].spots.length) completeStep(q);
            }
        },
        // ---- K20: three cleaner dressings (a sinew more each time a raw hide comes into the bag)
        k20Bonus: { pick: () => { const k = S().k20; k.left = 3; k.hides = count(96); } },
        // ---- K38: the night watch
        k38Watch: {
            enter: (q, r) => { r.t.watch = { ev: {}, left: false }; },
            tick(q, r, st) {
                const w = r.t.watch || (r.t.watch = { ev: {} }), h = hour(), post = D.SPOTS.watch_post, L = q.lines || {};
                if (h >= 3 && h < 12) { completeStep(q); return; }
                if (!onTown() || dist($gamePlayer, post) > 6) { fail(q, L.left || "Opuściłeś posterunek."); return; }
                const say = t => T.call("SpeechBubbles", "say", $gamePlayer, t);
                if (h >= 1.25 && !w.ev.fox) { w.ev.fox = 1; say(L.fox); }
                if (h >= 1.6 && !w.ev.owl) { w.ev.owl = 1; say(L.owl); }
                const kuba = residentEv("woziwoda");
                if (kuba && !w.ev.kuba && h >= 1.7 && h < 3 && dist(kuba, post) < 9) { w.ev.kuba = 1; say(L.kuba); S().flags.k38Kuba = day(); addClue("w1_watch"); autoChecks(); }
            }
        },
        k38Report: { say: q => (S().flags.k38Kuba ? (q.lines || {}).reportKuba : (q.lines || {}).reportQuiet) },
        // ---- D3: an hour at the forge
        d3Forge: { hand: () => { if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(Math.min(23.5, hour() + 1)); if ($gameSystem.changeStamina) $gameSystem.changeStamina(-10); } },
        // ---- D11: the coal, the drowned basket, the report
        d11Deliver: {
            talk(q, r, st, key, spk) {
                if (key !== "kapral" || !inHours(hour(), [18, 21]) || r.t.last === day()) return null;
                const L = q.lines || {}, vars = varsOf(q, r);
                if (count(79) < 3) return { ready: false, list: linesTo([], spk, L.remind, vars), pop: () => popupMissing([itemRow(79, 3)]) };
                const out = [];
                linesTo(out, spk, L.give, vars);
                script(out, [q.id, "fx", "d11Deliver"]);
                linesTo(out, spk, L.thanks, { n: (r.t.n || 0) + 1 });
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "kapral" && inHours(hour(), [18, 21]) && r.t.last !== day() && count(79) >= 3,
            act(q) {
                const r = rec(q.id);
                if (!r || r.t.last === day() || count(79) < 3) return;
                $gameParty.loseItem(item(79), 3);
                r.t.n = (r.t.n || 0) + 1;
                r.t.last = day();
                if (r.t.n >= (q.steps[r.step].upto || 5)) completeStep(q);
            }
        },
        d11Report: {
            talk(q, r, st, key, spk) {
                const L = q.lines || {}, out = [];
                if (key === "kapral") {
                    linesTo(out, spk, L.wit);
                    script(out, [q.id, "fx", "d11Report", "wit"]);
                    return { ready: true, list: out };
                }
                if (key === "kupiec" && !r.t.refused) {
                    linesTo(out, spk, L.bribe);
                    const yes = [], no = [];
                    script(yes, [q.id, "fx", "d11Report", "bribe"]); linesTo(yes, spk, L.bribeYes);
                    script(no, [q.id, "fx", "d11Report", "no"]); linesTo(no, spk, L.bribeNo);
                    return { ready: true, list: choiceTo(out, ["Biorę.", "Nie. Powiem kapralowi."], [yes, no], 1) };
                }
                return null;
            },
            ready: (q, r, st, key) => key === "kapral" || (key === "kupiec" && !r.t.refused),
            act(q, how) {
                const r = rec(q.id);
                if (!r) return;
                if (how === "wit") { setFlag("d11Told"); completeStep(q); }
                else if (how === "bribe") { setFlag("d11Bribe"); finish(q, { gold: 30, xp: 50 }, { replace: true }); }
                else r.t.refused = true;
            }
        },
        // ---- D14: the corporal looks into the bag
        d14Inspect: {
            talk(q, r, st, key, spk) {
                if (key !== "kapral" || day() < r.sday + 3) return null;
                const out = [], caught = count(74) > 0;
                linesTo(out, spk, caught ? (q.lines || {}).caught : (q.lines || {}).clean);
                script(out, [q.id, "fx", "d14Inspect", caught ? 1 : 0]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "kapral" && day() >= r.sday + 3,
            act(q, caught) {
                if (caught) {
                    const fine = Math.min(40, $gameParty.gold());
                    $gameParty.loseGold(fine);
                    setFlag("guardSuspicious");
                    finish(q, { opinion: -3, xp: 20 }, { replace: true });
                    T.popup("Kara: " + fine + " G", { icon: COIN_ICON, kind: "need" });
                } else finish(q, { xp: 50 }, { replace: true });
            }
        },
        // ---- D17: the crosses under the petition
        d17Sign: {
            talk(q, r, st, key, spk) {
                const sg = r.t.sign || {}, out = [];
                if (key === "kapral" && !sg.kapral) {
                    linesTo(out, spk, ["> Podpiszesz petycję sołtysa?", D.SIGN.kapral]);
                    script(out, [q.id, "fx", "d17Sign", "kapral"]);
                    return { ready: false, list: out };
                }
                if (!st.signers.includes(key) || sg[key]) return null;
                if (key === "kupiec" && !S().flags.k15Clean && count(97) < 3) return { ready: false, list: linesTo(out, spk, ["> Podpiszesz petycję sołtysa?", D.SIGN.kupiecAsk]) };
                linesTo(out, spk, ["> Podpiszesz petycję sołtysa? Przeciw podatkowi wojennemu."]);
                if (key === "kupiec" && !S().flags.k15Clean) linesTo(out, spk, [D.SIGN.kupiecAsk, "> Masz trzy skóry."]);
                script(out, [q.id, "fx", "d17Sign", key]);
                linesTo(out, spk, [D.SIGN[key]]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => st.signers.includes(key) && !(r.t.sign || {})[key] && (key !== "kupiec" || !!S().flags.k15Clean || count(97) >= 3),
            act(q, key) {
                const r = rec(q.id), st = r && q.steps[r.step];
                if (!r || !st || (r.t.sign || {})[key]) return;
                (r.t.sign = r.t.sign || {})[key] = day();
                if (key === "kapral") return;
                if (key === "kupiec" && !S().flags.k15Clean) $gameParty.loseItem(item(97), 3);
                r.t.n = Object.keys(r.t.sign).filter(k => k !== "kapral").length;
                if (r.t.n >= (st.signNeed || 5)) completeStep(q);
            }
        },
        // ---- K19: counting the camp (Rafał asks not to be counted)
        k19Count: {
            talk(q, r, st, key, spk) {
                if (!st.targets.includes(key) || (r.t.count || {})[key]) return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L[key]);
                if (key !== "rafal") { script(out, [q.id, "fx", "k19Count", key]); return { ready: true, list: out }; }
                const yes = [], no = [];
                script(yes, [q.id, "fx", "k19Count", "rafal:hide"]); linesTo(yes, spk, L.rafalYes);
                script(no, [q.id, "fx", "k19Count", "rafal"]); linesTo(no, spk, L.rafalNo);
                return { ready: true, list: choiceTo(out, ["Dobrze. Nie liczę cię.", "Muszę. Sołtys chce wiedzieć."], [yes, no], -1) };
            },
            ready: (q, r, st, key) => st.targets.includes(key) && !(r.t.count || {})[key],
            act(q, what) {
                const r = rec(q.id);
                if (!r) return;
                const [key, hide] = String(what).split(":");
                (r.t.count = r.t.count || {})[key] = day();
                if (hide) { setFlag("rafalAskedHide"); setFlag("rafalTrust"); }
                r.t.n = Object.keys(r.t.count).length;
                if (r.t.n >= q.steps[r.step].targets.length) completeStep(q);
            }
        },
        // ---- K28: in winter a hot meal counts twice
        k28Winter: {
            post: () => (T.time.season() === 3 ? ["W taki mróz... Ciepła strawa to więcej niż chleb."] : []),
            hand: q => { if (T.time.season() === 3) addOpinion(4, q.title + " (zimą)"); }
        },
        // ---- K29: not while the corporal is near
        k29Guard: {
            blocked: () => { const w = residentEv("kapral"); return !!w && dist(w, $gamePlayer) < 9; }
        },
        // ---- D4: the ambush before six; what Hanka hears; the reward by the choice at Ela's
        d4Ambush: {
            tick(q, r) {
                const h = hour(), L = q.lines || {};
                if (!onTown() || day() <= r.sday || r.t.tried === day() || h < 5.3 || h >= 6) return;
                const stall = T.call("TownLife", "spot", "stragan1");
                if (!stall) return;
                const d = Math.hypot($gamePlayer.x - stall[0], $gamePlayer.y - stall[1]);
                if (h < 5.6) { if (d < 7 && !T.call("Hunting", "sneaking") && h >= 5.45) { r.t.tried = day(); T.popup(L.spotted, { top: true, color: "#ff9f8f" }); } return; }
                r.t.tried = day();
                if (d >= 7) return;
                if (!T.call("Hunting", "sneaking")) { T.popup(L.spotted, { top: true, color: "#ff9f8f" }); return; }
                think(L.seen);
                completeStep(q);
            }
        },
        d4Hanka: { say: (q, r) => { const L = q.lines || {}, p = (r.t.pick || {})[1]; return p === 2 ? L.hankaWork : p === 1 ? L.hankaPay : L.hankaTell; } },
        d4Reward: {
            reward(q, r) {
                const p = (r.t.pick || {})[1];
                if (p === 2) return { opinion: 6, flag: "ludmilaBakes", clue: "w9_drawing",
                    note: ["Rysunek Eli", "Ela narysowała mi kruka nad tawerną i schody w dół. „Mama mówi, że w nocy coś tam stuka.”"] };
                if (p === 1) return { opinion: 3 };
                return { gold: 5, opinion: -2 };
            }
        },
        // ---- D10: Baltazar's "medicine from the continent"; the morning after
        d10Lek: {
            talk(q, r, st, key, spk) {
                if (key !== "kupiec" || vcount("lek") > 0 || !inHours(hour(), [8, 18])) return null;
                const L = q.lines || {}, out = [], yes = [], no = [];
                linesTo(out, spk, ["> Masz coś na gorączkę? Dla dziecka."].concat(L.lek || []));
                script(yes, [q.id, "fx", "d10Lek"]); linesTo(yes, spk, L.lekBuy);
                linesTo(no, spk, L.lekNo);
                return { ready: false, list: choiceTo(out, ["Kupuję (60 G).", "Nie, dziękuję."], [yes, no], 1) };
            },
            ready: () => false,
            act(q, a, interp, stop) {
                if ($gameParty.gold() < 60) { T.popup.need(COIN_ICON, "Potrzebujesz 60 G"); stop(); return; }
                $gameParty.loseGold(60);
                vgive("lek", 1);
            }
        },
        d10Morning: {
            say(q, r) {
                const L = q.lines || {};
                if (r.t.alt === 1) { addClue("w6_seal"); return L.morningLek; }
                return L.morning;
            }
        },
        // ---- D18: the cloaks to the camp - or to the court's guard for Feliks's money
        d18Give: {
            talk(q, r, st, key, spk) {
                if (vcount("plaszcze") <= 0) return null;
                const L = q.lines || {}, out = [];
                if (key === "ludmila") { linesTo(out, spk, L.camp); script(out, [q.id, "fx", "d18Give", "camp"]); return { ready: true, list: out }; }
                if (key === "feliks") {
                    linesTo(out, spk, L.feliks);
                    const yes = [], no = [];
                    script(yes, [q.id, "fx", "d18Give", "guard"]); linesTo(yes, spk, L.feliksYes);
                    linesTo(no, spk, L.feliksNo);
                    return { ready: false, list: choiceTo(out, ["Sprzedam (90 G).", "Nie. Są dla obozu."], [yes, no], 1) };
                }
                return null;
            },
            ready: (q, r, st, key) => key === "ludmila" && vcount("plaszcze") > 0,
            act(q, to) {
                if (vcount("plaszcze") <= 0) return;
                if (to === "camp") finish(q, { opinion: 10, items: [[112, 1]], flag: "campCloaks" });
                else finish(q, { gold: 90, opinion: -3, xp: 50, flag: "cloaksToGuard" }, { replace: true });
            }
        },
        // ---- W1: the clues; following Kuba at night
        startW1: () => (D.QUESTS.find(q => q.id === "W1").clues || []).some(k => S().clues[k]),
        w1Clues: {
            check(q, r) {
                const n = (q.clues || []).filter(k => S().clues[k]).length;
                r.t.n = n;
                return n >= (q.cluesNeed || 3);
            }
        },
        w1Follow: {
            tick(q, r) {
                const h = hour(), L = q.lines || {}, f = r.t.follow || (r.t.follow = {});
                if (!onTown() || h < 1.5 || h >= 3.4 || f.tried === day()) return;
                const kuba = TL() && TL().eventOf("woziwoda");
                if (!kuba) return;
                const st = TL().state("woziwoda");
                if (st.hidden) return;
                const p = $gamePlayer, d = dist(kuba, p), sneak = !!T.call("Hunting", "sneaking");
                const v = [[0, 0], [0, 1], [0, 0], [-1, 0], [0, 0], [1, 0], [0, 0], [0, -1]][kuba.direction() - 1] || [0, 1];
                const dx = p.x - kuba.x, dy = p.y - kuba.y, ahead = (dx * v[0] + dy * v[1]) / Math.max(0.01, d);
                const seen = d < 2 || (d < 4.5 && !sneak) || (!sneak && d < 7 && ahead > 0.6);
                if (seen) {
                    f.tried = day();
                    T.call("TownLife", "say", "woziwoda", L.caught);
                    const got = addOpinion(-3, "nocne włóczenie się");
                    T.popup("Kuba cię zauważył", { top: true, color: "#ff9f8f", sub: "Spróbuj następnej nocy" + (got ? "  ·  Opinia " + got : "") });
                    return;
                }
                const pond = T.call("TownLife", "spot", "staw");
                if (pond && kuba.x === pond[0] && kuba.y === pond[1] && st.act === "work" && d <= 8) {
                    f.watch = (f.watch || 0) + 10;
                    if (f.watch >= 900) {
                        f.done = true;
                        addClue("w1_pond");
                        think(L.seen);
                        addNote(L.note);
                        completeStep(q, { reward: { xp: 40 } });
                    }
                }
            }
        },
        // ---- W2: the bell's code
        startW2: () => S().bells.length > 0,
        w2Heard: { check: () => S().bells.length > 0 },
        w2Apprentice: { check: () => isDone("D16") },
        w2Table: {
            check(q, r) {
                const kinds = new Set(S().bells.map(b => b.sig));
                r.t.n = kinds.size;
                return kinds.size >= 3;
            }
        },
        w2Key: { hand: () => { setFlag("gardenKey"); addNote(["Klucz do ogrodu rycerzy", "Ambroży jest ostatnim uczniem straży zakonu - dzwoni, „bo nikt nie odwołał warty”. Dał mi klucz do furtki ogrodu rycerzy."]); } }
    };
    // the tool Tadek sharpens: the most worn one in the bag
    function wornTool() {
        const Du = T.api("Durability");
        if (!Du || !Du.TOOLS || !Du.enabled || !Du.enabled()) return 0;
        let best = 0, worst = 1;
        for (const id of Object.keys(Du.TOOLS).map(Number)) {
            if (!item(id) || !$gameParty.hasItem(item(id)) || !(Du.used(id) > 0)) continue;
            const r = Du.left(id) / Math.max(1, Du.lifeOf(id));
            if (r < worst) { worst = r; best = id; }
        }
        return best;
    }
    // Ambroży at the bell now: the hour to ring, or 0
    function bellTime() {
        const L = TL(), st = L && L.state ? L.state("dzwonnik") : null;
        if (!st || st.hidden || st.act !== "bell") return 0;
        const h = hour();
        return h >= 5.5 && h < 6.5 ? 6 : h >= 11.5 && h < 12.5 ? 12 : h >= 17.5 && h < 18.5 ? 18 : 0;
    }
    function bellK14(q, res) {
        const L = q.lines || {}, say = lines => think(lines, "dzwonnik");
        if (!res || res.aborted || (!res.strikes && !res.none)) { say(L.quit); return; }
        mute(18, 18.45);
        if (res.ok) { say(L.ok); finish(q, { gold: 8, opinion: 2 }); setFlag("ambrozyTrust"); return; }
        if (res.right) { say(L.badRhythm); finish(q, { gold: 4, opinion: 1 }); return; }
        say(L.wrong);
        addNote(L.note);
        addClue("w2_count");
        finish(q, {});
    }
    function bellLesson(q, res, h) {
        const r = rec(q.id), L = q.lines || {}, say = lines => think([].concat(lines || []).map(l => fill(l, varsOf(q, r))), "dzwonnik");
        if (!r || r.s !== "active") return;
        if (!res || res.aborted) return;
        mute(h, h + 0.45);
        if (!res.ok) { say(L.again); return; }
        r.t.n = (r.t.n || 0) + 1;
        r.t.last = day();
        if (r.t.n >= (q.steps[r.step].days || 4)) { say(L.done); completeStep(q); }
        else say(L.ok);
    }

    // ------------------------------------------------------------------
    // Kill steps (the bus's "kill"), the wolves of D5 brought in at night
    // ------------------------------------------------------------------
    T.on("kill", e => {
        if (!has() || !e || (e.by && e.by !== "hero" && e.by !== "dog")) return;
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step];
            if (!st || st.type !== "kill" || e.kind !== st.kind) continue;
            if (st.map && e.mapId !== st.map) continue;
            if (st.night && !isNight(hour())) continue;
            if (st.leader && !(e.animal && e.animal._tqLeader)) continue;
            r.t.got = (r.t.got || 0) + 1;
            if (r.t.got >= (st.n || 1)) completeStep(q);
            else T.popup(q.title + ": " + r.t.got + "/" + st.n, { color: "#ffe9a8" });
        }
    }, { owner: PLUGIN });
    function spawnFor() {
        if (!has() || !$gameMap) return;
        const H = T.api("Hunting");
        if (!H || typeof H.spawn !== "function") return;
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step];
            if (!st || st.type !== "kill" || !st.spawn || st.map !== $gameMap.mapId() || !isNight(hour())) continue;
            const night = hour() < 12 ? day() - 1 : day();
            if (r.t.spawned === night) continue;
            const spots = [];
            for (let k = 0; k < 200 && spots.length < 1; k++) {
                const x = Math.floor(Math.random() * $gameMap.width()), y = Math.floor(Math.random() * $gameMap.height());
                const d = Math.hypot(x - $gamePlayer.x, y - $gamePlayer.y);
                if (d < 8 || d > 16 || !$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXyNt(x, y).length) continue;
                spots.push([x, y]);
            }
            if (!spots.length) continue;
            r.t.spawned = night;
            const [x, y] = spots[0], members = [];
            const around = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]];
            for (const [ox, oy] of around) {
                if (members.length >= st.spawn) break;
                const sx = x + ox, sy = y + oy;
                if (!$gameMap.isValid(sx, sy) || !$gameMap.checkPassage(sx, sy, 0x0f)) continue;
                try { const a = H.spawn("wolf", sx, sy); if (a) members.push(a); } catch (e) { report("spawn", e); }
            }
            if (st.leader && members[0]) { const a = members[0]; a._tqLeader = true; a._qbScale = 1.3; a._qbName = "Przewodnik watahy"; a._qbTone = [40, 0, -10, 0]; }
            if (members.length > 1 && typeof H.makePack === "function") { try { H.makePack(members); } catch (e) { /* (alone, then) */ } }
            if (members.length) T.audio.se("Wolf", { volume: 70, pitch: 90 });
        }
    }

    // ------------------------------------------------------------------
    // The map clock: deadlines, the checks, the steps' own ticks, the places, the markers, the market, K20's hides
    // ------------------------------------------------------------------
    let marketBarkAt = 0;
    function marketLife() {
        if (!onTown() || !isMarket(day()) || !inHours(hour(), D.MARKET.hours)) return;
        const s = S();
        if (s.marketSeen !== day() && hour() >= 6) { s.marketSeen = day(); T.popup(D.MARKET.notice[0], { top: true, color: "#ffe27a", sub: D.MARKET.notice[1] }); }
        if (Graphics.frameCount < marketBarkAt) return;
        marketBarkAt = Graphics.frameCount + 420 + Math.floor(Math.random() * 360);
        const L = TL(), mid = L && L.spot ? L.spot("rynek_srodek") : null;
        if (!mid || Math.hypot($gamePlayer.x - mid[0], $gamePlayer.y - mid[1]) > 14 || $gameMap.isEventRunning()) return;
        const near = Object.keys(D.MARKET.barks).filter(k => { const ev = residentEv(k); return ev && Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y) < 9; });
        if (!near.length) return;
        const k = pick(near);
        T.call("TownLife", "say", k, pick(D.MARKET.barks[k]));
    }
    function hidesWatch() {
        const k = S().k20;
        if (!k || !(k.left > 0)) return;
        const n = count(96);
        if (n > k.hides) {
            const gain = Math.min(k.left, n - k.hides);
            if (item(163)) $gameParty.gainItem(item(163), gain);
            k.left -= gain;
            T.popup("Czystsze cięcie: +" + gain + " " + (item(163) ? item(163).name : "Ścięgna"), { icon: iconOfItem(163), kind: "good" });
        }
        k.hides = n;
    }
    let tollBarkDay = 0;
    function tollBark() {
        if (!onTown() || isDone("K11") || isActive("K11") || tollBarkDay === day() || !inHours(hour(), [6, 18])) return;
        const L = TL(), gate = L && L.spot ? L.spot("brama_wsch") : null, wit = residentEv("kapral");
        if (!gate || !wit || Math.hypot($gamePlayer.x - gate[0], $gamePlayer.y - gate[1]) > 2.5) return;
        tollBarkDay = day();
        T.call("TownLife", "say", "kapral", "Hej! Do dworu? Myto - dwa grosze!");
    }
    T.onMapUpdate((scene, n) => {
        if (!has()) return;
        updateBellQueue();
        updateThoughts();
        if (n % 10) return;
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step];
            if (st && st.tick && FX[st.tick] && FX[st.tick].tick) { try { FX[st.tick].tick(q, r, st); } catch (e) { report("tick " + q.id, e); } }
        }
        if (n % 30 === 0) { syncSpots(); refreshMarkers(); hidesWatch(); marketLife(); tollBark(); }
        if (n % 60 === 0) { checkDeadlines(); autoChecks(); if (onTown()) rainSignal(); }
        if (n % 120 === 0) spawnFor();
    }, { owner: PLUGIN, name: "quests" });
    T.on("hourChange", onHour, { owner: PLUGIN });
    T.on("dayStart", () => checkDeadlines(), { owner: PLUGIN });
    T.on("wake", () => checkDeadlines(), { owner: PLUGIN });
    T.on("mapReady", () => { if (!has()) return; syncSpots(); refreshMarkers(); spawnFor(); }, { owner: PLUGIN });
    T.on("mapLeave", () => { bellQueue.length = 0; }, { owner: PLUGIN });
    T.on("newGame", () => { bellQueue.length = 0; thoughts.length = 0; }, { owner: PLUGIN });
    T.on("load", () => { bellQueue.length = 0; thoughts.length = 0; }, { owner: PLUGIN });

    // the boots of D1: their effect through the skills' perks (Combat.perk is asked by every system)
    const CB = T.api("Combat");
    if (CB && typeof CB.perk === "function" && !CB.perk._townQuests) {
        const orig = CB.perk;
        const wrapped = function(key) { const base = orig.apply(this, arguments); const p = has() ? S().perks[key] : 0; return p ? base + p : base; };
        wrapped._townQuests = true;
        CB.perk = wrapped;
    }
    // the crate of K15 is heavy: a slower walk while it is carried
    const _Game_Player_realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        const s = _Game_Player_realMoveSpeed.call(this);
        return has() && (vcount("skrzynia") > 0 || vcount("koszyki") > 0) ? Math.max(2, s - 1) : s;
    };

    // ------------------------------------------------------------------
    // TownLife's talk: the quests speak first
    // ------------------------------------------------------------------
    const L0 = TL();
    if (L0 && L0.addTalkHook) L0.addTalkHook((key, ev) => residentTalk(key, ev));
    else console.warn("[TownQuests] TownLife.js not found - the residents will not talk about quests");

    // ------------------------------------------------------------------
    // The journal: the tab "Miasteczko" and the goal window
    // ------------------------------------------------------------------
    const iconOf = q => (q.icon && item(q.icon) ? iconOfItem(q.icon) : NOTE_ICON);
    function stepReadyAny(q, r, st) {
        if (!st) return false;
        if (st.type === "bring" || st.type === "talk") return timing(q, r, st).ok && missingRows(st).length === 0;
        if (st.type === "spot") return timing(q, r, st).ok && missingRows(st).length === 0;
        return false;
    }
    function deadlineText(r, st) {
        const at = deadlineAt(r, st);
        if (at === null) return "";
        const d = Math.floor(at / 24), h = at - d * 24;
        return "Termin: " + (d === day() ? "dziś" : d === day() + 1 ? "jutro" : "dzień " + d) + " do " + hm(h) + ".";
    }
    function trackLine(q, r, st) {
        const miss = missingRows(st).slice(0, 2).map(x => x.name + " " + Math.min(x.have, x.n) + "/" + x.n);
        const dl = deadlineAt(r, st), parts = [];
        if (miss.length) parts.push(miss.join(" · "));
        else parts.push(fill(st.text, varsOf(q, r)).split(/(?<=[.!?])\s/)[0]);
        if (dl !== null) { const d = Math.floor(dl / 24); parts.push((d === day() ? "do " : "dz. " + d + ", do ") + hm(dl - d * 24)); }
        return parts.join(" · ");
    }
    function journalItems() {
        if (!has()) return [{ label: "Brak zadań", mark: "locked", dim: true, empty: true }];
        const s = S(), out = [];
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step];
            out.push({ label: q.title, icon: iconOf(q), mark: stepReadyAny(q, r, st) ? "ready" : s.track === q.id ? "pin" : "todo",
                right: st && st.type === "pause" ? "wkrótce" : KIND[q.kind], quest: q });
        }
        const tier = D.OPINION.tiers[tierOf(s.opinion)].name, dNext = nextOf(day(), isMarket);
        out.push({ label: "Opinia w miasteczku", icon: 0, mark: "locked", right: s.opinion + " · " + tier, info: "opinion" });
        out.push({ label: "Kalendarz miasteczka", icon: 0, mark: "locked", right: isMarket(day()) ? "dziś targ" : "targ za " + (dNext - day()) + " d.", info: "calendar" });
        if (s.bells.length) out.push({ label: "Sygnały dzwonu", icon: 0, mark: "locked", right: new Set(s.bells.map(b => b.sig)).size + " z " + Object.keys(D.SIGNALS).length, info: "bells" });
        const ended = QUESTS.filter(q => { const r = rec(q.id); return r && r.s !== "active"; }).sort((a, b) => rec(b.id).end - rec(a.id).end);
        for (const q of ended.slice(0, 30)) {
            const r = rec(q.id);
            out.push({ label: q.title, icon: iconOf(q), mark: r.s === "done" ? "done" : "locked", dim: true, quest: q, hist: true,
                right: (r.s === "done" ? "dz. " : r.s === "failed" ? "przepadło, dz. " : "odmówione, dz. ") + r.end });
        }
        return out;
    }
    function questOps(it) {
        const q = it.quest, r = rec(q.id), s = S(), vars = varsOf(q, r);
        const who = q.giver ? nameOf(q.giver) + (titleOf(q.giver) ? ", " + titleOf(q.giver) : "") : "sprawa miasta";
        const ops = [{ k: "title", text: q.title, icon: iconOf(q) }, { k: "sub", text: (q.kind === "W" ? "Wątek" : "Zadanie " + KIND[q.kind]) + "  ·  " + who + (r ? "  ·  od dnia " + r.day : "") },
            { k: "rule" }, { k: "p", text: q.desc }];
        if (r && r.s === "active") {
            const st = q.steps[r.step];
            ops.push({ k: "gap", n: 8 }, { k: "h", text: q.kind === "W" ? "Rozdział " + (r.step + 1) : "Teraz" }, { k: "p", text: fill(st.text, vars) });
            for (const row of needRows(st)) ops.push({ k: "cost", icon: row.icon, name: row.name, have: Math.min(row.have, row.n), need: row.n, note: "" });
            const dl = deadlineText(r, st);
            if (dl) ops.push({ k: "muted", text: dl });
            if (r.step > 0) {
                ops.push({ k: "gap", n: 6 }, { k: "h", text: "Zrobione" });
                for (let i = 0; i < r.step; i++) ops.push({ k: "muted", text: "✓ " + fill(q.steps[i].text, vars).split(/(?<=[.!?])\s/)[0] });
            }
        } else if (r) {
            ops.push({ k: "gap", n: 8 }, { k: "p", text: r.s === "done" ? "Wykonane w dniu " + r.end + (q.repeat === "daily" ? ". Można je wziąć znowu następnego dnia." : ".")
                : r.s === "failed" ? "Przepadło w dniu " + r.end + "." + (q.repeat === "daily" ? " Jutro można spróbować znowu." : "") : "Odmówiłeś w dniu " + r.end + "." });
        }
        if (q.reward && rewardText(q.reward)) ops.push({ k: "gap", n: 6 }, { k: "h", text: "Nagroda" }, { k: "p", text: rewardText(q.reward) });
        ops.push({ k: "gap", n: 6 }, { k: "muted", text: "Gdzie: " + q.where + ".  Kiedy: " + q.when + "." });
        if (r && r.s === "active" && q.kind !== "W") ops.push({ k: "muted", text: s.track === q.id ? "Śledzisz to zadanie w okienku celu. OK: przestań śledzić." : "OK: śledź to zadanie w okienku celu." });
        return ops;
    }
    function opinionOps() {
        const s = S(), ti = tierOf(s.opinion), t = D.OPINION.tiers[ti];
        const ops = [{ k: "title", text: "Opinia w miasteczku" }, { k: "sub", text: s.opinion + " / 100  ·  " + t.name }, { k: "rule" }, { k: "p", text: t.text },
            { k: "muted", text: "To coś innego niż „Sława w tawernie” z tablicy zleceń: sława dotyczy tawerny, opinia - ulicy. Rośnie za pomoc ludziom, spada za złamane słowo, kłamstwo i nocne włóczenie się." },
            { k: "gap", n: 8 }, { k: "h", text: "Progi" }];
        D.OPINION.tiers.forEach((x, i) => ops.push({ k: "p", text: (i === ti ? "▶ " : "") + x.at + " - " + x.name + ": " + x.text }));
        if (s.opLog.length) {
            ops.push({ k: "gap", n: 8 }, { k: "h", text: "Ostatnio" });
            for (const l of s.opLog.slice(0, 6)) ops.push({ k: "muted", text: "dz. " + l.day + ": " + (l.n > 0 ? "+" : "") + l.n + (l.why ? " - " + l.why : "") });
        }
        return ops;
    }
    function calendarEvents(from, n) {
        const out = [];
        for (let d = from; d < from + 40 && out.length < n; d++) {
            for (const e of D.CALENDAR.events) if (e.day === d) out.push({ day: d, title: e.title, text: e.text, wait: e.wait });
            if (T.time.isEaster(d) && !T.time.isEaster(d - 1)) out.push({ day: d, title: "Wielkanoc", text: "Pisanki, święcone, a śmigus-dyngus bez wody - sołtys zakazał." });
            if (T.time.isWigilia(d) && !T.time.isWigilia(d - 1)) out.push({ day: d, title: "Wigilia", text: "Wspólna wieczerza. O północy Ambroży bije siedem razy." });
        }
        return out;
    }
    function calendarOps() {
        const d = day(), dry = dryDays(), mkt = nextOf(d, isMarket), fer = nextOf(d, isFerry);
        const ops = [{ k: "title", text: "Kalendarz miasteczka" }, { k: "sub", text: "Dzień " + d + "  ·  " + T.time.seasonName(d) + ", dzień " + T.time.dayOfSeason(d) }, { k: "rule" },
            { k: "p", text: dry > 0 ? "Bez deszczu od " + dry + " " + (dry === 1 ? "dnia" : "dni") + ". Studnia na rynku daje mało, woda tylko na przydział." : "Dziś padało - beczki i garnki pełniejsze." },
            { k: "gap", n: 8 }, { k: "h", text: "Co tydzień" },
            { k: "p", text: "Targ co 7 dni: " + (mkt === d ? "dziś (6–14)" : "dzień " + mkt + " (za " + (mkt - d) + " d.)") + "." },
            { k: "p", text: "Prom co 3 dni - nowe kartki na tablicy zleceń, dzień później Baltazar skupuje zapasy: " + (fer === d ? "dziś" : "dzień " + fer) + "." },
            { k: "gap", n: 8 }, { k: "h", text: "Co przed nami" }];
        const ev = calendarEvents(d, 6);
        if (!ev.length) ops.push({ k: "muted", text: "Nic szczególnego w najbliższych tygodniach." });
        for (const e of ev) {
            ops.push({ k: "p", text: (e.day === d ? "Dziś" : "Dzień " + e.day) + " - " + e.title + ". " + e.text });
            if (e.wait) ops.push({ k: "muted", text: "(Jeszcze nie w grze - czeka na: " + e.wait + ".)" });
        }
        return ops;
    }
    function bellsOps() {
        const s = S(), known = !!s.flags.gardenKey;
        const ops = [{ k: "title", text: "Sygnały dzwonu" }, { k: "sub", text: "Co dzwon mówi i kiedy" }, { k: "rule" },
            { k: "p", text: "Ambroży dzwoni nie tylko o pełnych godzinach. Zapisuję, ile razy i co się wtedy działo." }];
        for (const [sig, sg] of Object.entries(D.SIGNALS)) {
            const heard = s.bells.filter(b => b.sig === sig);
            if (!heard.length) { ops.push({ k: "muted", text: "? ? ?" }); continue; }
            const last = heard[heard.length - 1];
            ops.push({ k: "p", text: sg.name + " (" + sg.pattern.join(" + ") + ") - ostatnio dz. " + last.day + ", " + hm(last.hour) + "." });
            ops.push({ k: "muted", text: sg.when + (known ? " Znaczy: " + sg.meaning + "." : "") });
        }
        return ops;
    }
    function journalOps(it) {
        if (!it || it.empty) return [{ k: "title", text: "Miasteczko" }, { k: "rule" }, { k: "p", text: "Tu zobaczysz sprawy ludzi z miasteczka wokół tawerny: kto prosi, o co, do kiedy i za ile." }];
        if (it.info === "opinion") return opinionOps();
        if (it.info === "calendar") return calendarOps();
        if (it.info === "bells") return bellsOps();
        return questOps(it);
    }
    const J = T.api("Journal");
    if (J && J.addTab) {
        J.addTab({
            name: "Miasteczko",
            items: () => journalItems(),
            detail: it => ({ ops: journalOps(it) }),
            legend: () => { if (!has()) return ""; const s = S(); return "Opinia " + s.opinion + "/100  ·  " + D.OPINION.tiers[tierOf(s.opinion)].name + "  ·  w toku: " + activeQuests().length + "  ·  wykonane: " + s.stats.done; },
            help: "OK: śledź zadanie na ekranie   ←/→: zakładka",
            ok: it => { if (it && it.quest && isActive(it.quest.id) && it.quest.kind !== "W") { const s = S(); s.track = s.track === it.quest.id ? null : it.quest.id; SoundManager.playOk(); } }
        });
    }
    if (J && J.addTrackerSource) {
        J.addTrackerSource(() => {
            if (!has()) return null;
            const s = S();
            if (!s.track) return null;
            const q = Q[s.track], r = rec(s.track);
            if (!q || !r || r.s !== "active") { s.track = null; return null; }
            const st = q.steps[r.step];
            if (!st) return null;
            const line = trackLine(q, r, st);
            return { label: "MIASTECZKO", title: q.title, line, key: "tq|" + q.id + "|" + r.step + "|" + line };
        });
    }

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        QUESTS, Q, act, spot: spotTalk, storyTalk, start: (id, step) => start(Q[id], step), finish: (id, rw) => finish(Q[id], rw), fail: id => fail(Q[id]),
        completeStep: (id, o) => completeStep(Q[id], o), state: () => S(), rec, isActive, isDone, opinion, addOpinion, tier: () => tierOf(opinion()),
        tierName: () => D.OPINION.tiers[tierOf(opinion())].name, offerable: id => offerable(Q[id]), dryDays, isMarket, isFerry, markers: () => Object.assign({}, markers),
        refreshMarkers, syncSpots, spotWanted, checkDeadlines, autoChecks, waterParts, hearSignal, ringPattern, bellQueue: () => bellQueue.slice(), muted,
        talkFor: (key, story) => talkFor(key, speakerOf(key), !!story), openBell, Scene_TownBell, journalItems, journalOps, calendarEvents, track: id => { S().track = id || null; return S().track; },
        bellOpts: null, vcount, FX
    };
    window.TownQuests = T.register(PLUGIN, api);
})();
