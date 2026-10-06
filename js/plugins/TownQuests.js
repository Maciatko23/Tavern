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
// (2026-10-05, v1.1.0) W1 to its chapter 6 (Kuba's talk, the raven grate at the well's bottom, the orangery at night past the manor's
// guard, the big choice - the truth: Feliks is guilty, the Lord knows nothing), W2 to its chapter 6 (seven strikes at noon, the
// statues' shadows, the slab, the Order's Archive), K26 (the ring in the well), K37 (the stolen purse: a chase), K39 (the dice
// sharper: TavernDice + Czujność), K15 with the carter. Places on the new maps (the well's bottom 118, the Archive 119, the
// orangery on the manor 24); quests that start by themselves (autoStart); residents' remarks after what happened (REMARKS).
// (2026-10-06, v1.2.0) The tavern's regulars - Melia, Dziadek Ozzy, Grum (Map001's own events, TavernLife_Regulars.js asks
// regularTalk first, then shows their own menu) - are givers too: K22 (the string), K33 (the cap on the statue, knocked off with the
// sling through the garden gate's grate: Hunting's target and its "shot" bus; the view peeks over the wall), D13 (Ozzy's predictions
// read from Survival's weather plan, Grum's bet), D6 (the arm-wrestling tournament at the market: TavernLife's mini-game with other
// rivals, Baltazar's bribe, the strongman's belt - Combat.carryBonus), W3 (the seventh ballad: six verses from six sources, Melia's
// origin, the Kupała bonfire with a real fight - Humans.js - or Borgar alone, or the words burnt), W8 rozdz. 1 (Grum asks about the
// mountains), K27 Melia's way. Quest topics in a regular's menu (FX topic / topicList), reward.trust, a step's own words (r.t.v).
// (later the same day) D6 moved into the tavern (the author: arm-wrestling only there) - the sign-up with Borgar, the bouts at the arm
// table on the market day's evening (TavernLife_ArmWrestle asks armTable); Borgar's topics at the bar (FX borgarTopic / borgarList);
// W4 compact: after the debt, the castellan's key (Borgar's half, the half under the raven cairn in grandpa's yard, Tadek's forge)
// opens the order's grate in the cellar through Underground.open() - and Borgar says the floor-10 guardian's words.
// (2026-10-06, v1.3.0, Act II's chapters) W1 6 c: Feliks's men on Polna droga are a real fight (Humans.ambush, tag "w1Feliks": won -
// the choice of 6 back, a spared man a witness; lost - robbed and the drawing gone; fled - they wait again); W1 7: the cistern's main
// sluice (Underground's bus "undergroundSluice") and the bell's four and two - the market well fills under the sołtys's lock, the
// hero's two draws a day stay (the drought); W9 6: the Truth Layer's truths (Underground.truths(), bus "undergroundTruth") told or
// kept, person by person; W8 2-6 on the mountain maps (Map013/014/120, places on their "Miejsce:" markers - SPOTS `marker`): the
// guide's dawn, the quarry, the diggers' camp and Marek, the order "Świadków nie zostawiać" (drunk / the thin wall / the crate), the
// Silent's gate (switch 16), Grum's choice - the honour bout, his side (switch 15), the faction, or the fight with him (Humans.js).

/*:
 * @target MZ
 * @plugindesc Questy miasteczka: zadania od mieszkańców i stałych bywalców tawerny (oferta, kroki, nagrody), Opinia w miasteczku, dzień targowy, kalendarz, sygnały dzwonu, mini-gra dzwonu, zakładka „Miasteczko” w dzienniku. v1.3.0
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
    const TOWN = 8, ROAD = 22, MANOR = 24;   // the town, Polna droga, the Lord's manor (its garden and the orangery)
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
        const t = r ? r.t : {}, st = r && q.steps ? q.steps[r.step] : null;
        const own = st && st.vars && FX[st.vars] && FX[st.vars].vars ? FX[st.vars].vars(q, r) : null;   // (2026-10-06: a step's words counted when shown - W9's truths)
        return Object.assign({ n: t.n || 0, left: t.left || 0, gold: (q.reward && q.reward.gold) || 0 }, t.v || {}, own || {});   // (t.v: a handler's own words - D6's market day, W3's verses)
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
    // (2026-10-06) the tavern's regulars - Map001's own events (TavernLife finds them by name): givers and speakers too
    const TAVERN = 1;
    const REGULAR = { melia: ["Melia", "pieśniarka w tawernie"], ozzy: ["Dziadek Ozzy", "stały bywalec tawerny"], grum: ["Grum", "najemnik w tawernie"], borgar: ["Borgar", "karczmarz"] };
    const isRegular = key => key !== "borgar" && !!REGULAR[key];
    function regularEv(key) {
        if (!REGULAR[key] || !window.$gameMap || $gameMap.mapId() !== TAVERN) return null;
        const ev = T.call("TavernLife", "npc", key);
        return ev && $gameMap.event(ev.eventId()) === ev ? ev : null;
    }
    const whoEv = key => residentEv(key) || regularEv(key);
    function nameOf(key) {
        if (key === "lord") return "Lord Zaleski";
        if (key === "grandpa") return "Dziadek Stach";
        if (REGULAR[key]) return REGULAR[key][0];
        const r = resident(key);
        return r ? r.name : String(key || "");
    }
    function titleOf(key) {
        if (key === "lord") return "dwór";
        if (key === "grandpa") return "dziadek";
        if (REGULAR[key]) return REGULAR[key][1];
        const r = resident(key);
        return r ? r.title : "";
    }
    function speakerOf(key) {
        if (key === "hero") return HERO;
        const ev = key === "lord" || key === "grandpa" ? storyEv(key) : whoEv(key);
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
        const SB = T.api("SpeechBubbles"), t = thoughts.shift(), who = t.key ? whoEv(t.key) : $gamePlayer;
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
            else if (k === "trust") out.trust = Object.assign({}, out.trust || {}, v);
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
        for (const [role, n] of Object.entries(rw.trust || {})) {   // (2026-10-06: the tavern's regulars trust the hero more - TavernLife_Regulars)
            const got = T.call("TavernLife", "addTrust", role, n, q.title) || 0;
            if (got) parts.push(nameOf(role) + ": zaufanie " + (got > 0 ? "+" : "") + got);
        }
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
        for (const [role, n] of Object.entries(rw.trust || {})) parts.push(nameOf(role) + ": zaufanie +" + n);
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
        for (const q of QUESTS) {   // (the arcs, and the quests with autoStart: K37's theft)
            if ((q.kind !== "W" && !q.autoStart) || rec(q.id)) continue;
            const fx = FX[q.autoStart || "start" + q.id];
            try { if (fx && fx()) start(q); } catch (e) { report("start " + q.id, e); }
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
        // (a market day's money and a remark after what happened come first - each once; then the quests, then the greeting)
        try { return sideTalk(key, spk) || remark(key, spk) || talkFor(key, spk, false) || greeting(key, ev, spk); } catch (e) { report("talk " + key, e); return null; }
    }
    // (2026-10-06) a tavern regular's talk (TavernLife_Regulars asks it first, its own greeting and menu come after): { list, kind,
    // pop } - kind "ready" (a hand-in now), "offer", "remind" (his own quest, what is missing pops up), "remark" - or null
    function regularTalk(key, ev) {
        if (!has() || !isRegular(key) || !ev) return null;
        const spk = { id: ev.eventId(), name: nameOf(key) };
        try {
            const rm = remark(key, spk), pre = rm || [];
            let remind = null, own = null;
            for (const q of activeQuests()) {
                const r = rec(q.id), st = q.steps[r.step];
                if (!st) continue;
                const h = stepTalk(q, r, st, key, spk);
                if (!h || !h.list || !h.list.length) continue;
                if (h.ready) return { list: pre.concat(h.list), kind: "ready" };
                if (!remind) remind = h;
                if (!own && q.giver === key) own = h;
            }
            for (const q of QUESTS) if (q.giver === key && offerable(q)) { const list = offerList(q, spk); if (list && list.length) return { list: pre.concat(list), kind: "offer" }; }
            const rem = own || remind;
            if (rem) return { list: pre.concat(rem.list), kind: "remind", pop: rem.pop || null };
            return rm ? { list: rm, kind: "remark" } : null;
        } catch (e) { report("regular talk " + key, e); return null; }
    }
    // what a resident says once, the first talk after something happened (D.REMARKS)
    const goneNow = k => !!T.call("TownLife", "gone", k);
    function remarkFor(key) {
        const s = S(), said = s.said || (s.said = {});
        return (D.REMARKS || []).find(m => m.who === key && !said[m.id] && (!m.flag || s.flags[m.flag]) && (!m.gone || goneNow(m.gone)) && (!m.back || !goneNow(m.back))) || null;
    }
    function remark(key, spk) {
        const m = remarkFor(key);
        if (!m) return null;
        S().said[m.id] = day();
        S().greeted[key] = day();
        return linesTo([], spk, m.lines);
    }
    // talks outside the quests' steps: Kuba's market-day money (W1 rozdz. 3 b), Baltazar's offer for the chronicles (W2 rozdz. 6)
    function sideTalk(key, spk) {
        const s = S(), f = s.flags, side = s.side || (s.side = {});
        if (key === "woziwoda" && f.kubaPays && !f.sluiceHalf && isMarket(day()) && side.kubaPaid !== day()) {
            side.kubaPaid = day();
            $gameParty.gainGold(5);
            T.popup("+5 G od Kuby", { icon: COIN_ICON, kind: "gold" });
            return linesTo([], spk, Q.W1.lines.kubaTribute);
        }
        if (key === "kupiec" && f.chroniclesTaken && vcount("kroniki") > 0 && !f.w5ChroniclesSold && side.chronAsked !== day() && inHours(hour(), [8, 18])) {
            side.chronAsked = day();
            const L = Q.W2.lines, out = [], yes = [], no = [];
            linesTo(out, spk, L.sell);
            script(yes, ["W2", "fx", "w2Sell", 1]); linesTo(yes, spk, L.sellYes);
            script(no, ["W2", "fx", "w2Sell", 0]); linesTo(no, spk, L.sellNo);
            return choiceTo(out, ["Sprzedam (300 G).", "Nie sprzedam."], [yes, no], 1);
        }
        const d6 = rec("D6");   // (2026-10-06) D6: Baltazar's forty groszy for a lost first bout - once, after the training, before the tournament
        if (key === "kupiec" && d6 && d6.s === "active" && d6.step >= 1 && !d6.t.round && !side.d6Asked && day() <= (d6.t.market || 0) && inHours(hour(), [8, 21.5])) {
            side.d6Asked = day();
            const L = Q.D6.lines, out = [], yes = [], no = [];
            linesTo(out, spk, L.bribe);
            script(yes, ["D6", "fx", "d6Bribe", 1]); linesTo(yes, spk, L.bribeYes);
            script(no, ["D6", "fx", "d6Bribe", 0]); linesTo(no, spk, L.bribeNo);
            return choiceTo(out, ["Biorę.", "Nie sprzedaję walk."], [yes, no], 1);
        }
        return null;
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
                    T.popup(tm.why === "weather" ? st.wet || "Przy takiej pogodzie nic tu nie widać." : text, { color: "#ffe9a8" });
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
    // (img: [sheet, index, direction, pattern] - a picture on the page; solid: it blocks, like a person standing there)
    function spotEvent(s) {
        const img = s.img || ["", 0, 2, 0];
        const page = { conditions: Object.assign({}, BLANK, { selfSwitchCh: "A", selfSwitchValid: true }), directionFix: true,
            image: { tileId: 0, characterName: img[0], direction: img[2], pattern: img[3], characterIndex: img[1] },
            list: [C(355, ["TownQuests.spot(this)"]), C(0, [])],
            moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: !s.solid, trigger: 0, walkAnime: false };
        return { id: s.id, name: "Zadanie: " + s.name, note: "<TownQuests:" + s.key + ">" + (s.bust ? "<Bust:" + s.bust + ">" : ""), pages: [page], x: s.x, y: s.y };
    }
    const SPOT_MAPS = Array.from(new Set(SPOT_LIST.map(s => s.map)));
    // (2026-10-06) a place with `marker`: it stands on the map's "Miejsce: <marker>" event (the maps agent's markers - docs/
    // miasta_miejsca_zadan.md), shifted by dx/dy; x/y are only the fallback when the marker is missing
    function spotAt(s, data) {
        if (!s.marker) return s;
        const m = (data.events || []).find(e => e && String(e.name || "").trim() === "Miejsce: " + s.marker);
        if (!m) return s.x !== undefined ? s : null;
        return Object.assign({}, s, { x: m.x + (s.dx || 0), y: m.y + (s.dy || 0) });
    }
    T.inject(SPOT_MAPS, { ids: [951, 959], owner: PLUGIN,
        build(data, mapId) { return SPOT_LIST.filter(s => s.map === mapId).map(s => spotAt(s, data)).filter(s => s && s.x < data.width && s.y < data.height).map(spotEvent); } });
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
        const keys = ((TL() && TL().RESIDENTS) || []).map(r => r.key).concat(["lord", "grandpa"], Object.keys(REGULAR));
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
        } else if (kind === "dig") {
            ctx.fillStyle = "rgba(70,48,28,0.55)";
            ctx.beginPath(); ctx.ellipse(24, 34, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(40,26,14,0.7)";
            for (const [x, y] of [[17, 33], [27, 31], [31, 36], [21, 37]]) ctx.fillRect(x, y, 3, 2);
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
            if (w && w.ready && !s.nomark) kind = "spot";
            if (s.deco === "paper") deco = S().flags["notice_" + s.key] && day() - S().flags["notice_" + s.key] < 7 ? "paper" : "";
            else if (s.deco === "glint") deco = w && w.ready && Math.sin(Graphics.frameCount / 9) > 0.2 ? "glint" : "";
            else if (s.deco === "tracks") deco = w && w.q.id === "D5" ? "tracks" : "";
            else if (s.deco === "doused") deco = w && w.q.id === "D11" && w.ready ? "doused" : "";
            else if (s.deco === "dig") deco = w ? "dig" : "";
        } else {
            const key = residentKeyOf(c) || (c.eventId() >= 900 && c.eventId() <= 902 ? storyRoleOf(c) : null) || ($gameMap.mapId() === TAVERN && c.eventId() < 100 ? T.call("TavernLife", "regularOf", c) || (c === regularEv("borgar") ? "borgar" : null) : null);
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
        if (c instanceof Game_Event && has() && $gameMap) { try { updateDeco(this, c); updateCap(this, c); } catch (e) { /* (a sprite must never stop the map) */ } }
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
    const nightOf = () => (hour() < 12 ? day() - 1 : day());   // (a night counts from the evening before)
    // a quest's place on this map, while it is shown (its page on)
    function spotEv(key) {
        const s = D.SPOTS[key];
        if (!s || !window.$gameMap || $gameMap.mapId() !== s.map) return null;
        const ev = $gameMap.event(s.id);
        return ev && ev.page() ? ev : null;
    }
    // a watcher (the manor's guard) sees the hero: close by, in front of him, or not sneaking (sharp: a warned watch sees further)
    function sees(w, p, sneak, sharp) {
        const v = [[0, 0], [0, 1], [0, 0], [-1, 0], [0, 0], [1, 0], [0, 0], [0, -1]][w.direction() - 1] || [0, 1];
        const d = dist(w, p), ahead = ((p.x - w.x) * v[0] + (p.y - w.y) * v[1]) / Math.max(0.01, d);
        return d < 1.6 || (ahead > 0.5 && d < (sneak ? 3.5 : 6) + sharp) || (!sneak && d < 4 + sharp);
    }
    // a free cell next to a character (K37: the thief beside Feliks)
    function freeBeside(c) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]]) {
            const x = c.x + dx, y = c.y + dy;
            if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough())
                && !($gamePlayer.x === x && $gamePlayer.y === y)) return [x, y];
        }
        return null;
    }
    // the residents near the hero who would see what he does (K37: the purse kept)
    function witnesses(but) {
        const L = TL();
        return ((L && L.RESIDENTS) || []).map(r => r.key).filter(k => k !== but && (() => { const e = residentEv(k); return !!e && dist(e, $gamePlayer) <= 7; })());
    }
    // the slab of the knights' garden (Map008 "Płyta w ścieżce"): found by name, else the id the places' builder gave it
    function slabId() {
        const e = window.$dataMap && $gameMap && $gameMap.mapId() === TOWN ? ($dataMap.events || []).find(x => x && /^Płyta w ścieżce/.test(x.name || "")) : null;
        return e ? e.id : 246;
    }
    // the hero thrown out of the manor's garden (W1 rozdz. 5): after the bubble, out of its gate to the town's side
    let pendingOut = null;
    // ------------------------------------------------------------------
    // (2026-10-06) Helpers of the regulars' quests: the seventh ballad's verses (W3), Natchniony, the hour said in words, D13's
    // predictions and Ozzy's truth, D6's bouts, the cap on the statue (K33), the Kupała night
    // ------------------------------------------------------------------
    const ORD = ["dwunastej", "pierwszej", "drugiej", "trzeciej", "czwartej", "piątej", "szóstej", "siódmej", "ósmej", "dziewiątej", "dziesiątej", "jedenastej"];
    function hourWords(h) {
        const H = Math.floor(h) % 24, part = H < 5 ? " w nocy" : H < 11 ? " rano" : H < 13 ? " w południe" : H < 18 ? " po południu" : " wieczorem";
        return "o " + ORD[H % 12] + (H === 12 ? "" : part);
    }
    // the offer's usual two answers after a handler's own lines (D13)
    function offerChoice(out, q, spk) {
        const opts = shownOptions(offerOptions(q));
        const branches = opts.map(({ op, i }) => { const b = []; script(b, [q.id, "opt", i]); linesTo(b, spk, op.say, varsOf(q, rec(q.id))); return b; });
        const cancel = opts.findIndex(x => x.op.then === "decline");
        return choiceTo(out, opts.map(x => x.op.label), branches, cancel < 0 ? opts.length - 1 : cancel);
    }
    const verseOf = key => (Q.W3 && Q.W3.verses || []).find(v => v.key === key) || null;
    const hasVerse = key => has() && !!S().flags["verse_" + key];
    // a verse sung (or read) by `spk`: two couplets, each a bubble
    function sing(out, spk, key) {
        const v = verseOf(key);
        if (!v) return out;
        sayTo(out, spk, "♪ " + v.lines[0] + "\n" + v.lines[1]);
        return sayTo(out, spk, "♪ " + v.lines[2] + "\n" + v.lines[3]);
    }
    // the note "Siódma ballada": the song as far as it is known, in its order
    function verseNote() {
        const J = T.api("Journal"), vs = Q.W3.verses, title = "Siódma ballada";
        const text = "Melii śni się siódma ballada - „Pieśń o Kruczych Skałach”. Melodię zna, słów nie. Zbieram zwrotki dla niej (" + vs.filter(v => hasVerse(v.key)).length + "/" + vs.length + ").\n\n" +
            vs.map((v, i) => (i + 1) + ". " + (hasVerse(v.key) ? v.lines.join("\n") + "\n(" + v.from + ")" : "...") ).join("\n\n");
        const d = J && J.data ? J.data() : null, old = d && d.notes ? d.notes.find(n => n.title === title) : null;
        if (old) old.text = text; else addNote([title, text]);
    }
    function w3Vars(q, r) {
        if (!r) return;
        const vs = q.verses, got = vs.filter(v => hasVerse(v.key)), miss = vs.filter(v => !hasVerse(v.key));
        r.t.n = got.length;
        r.t.v = Object.assign({}, r.t.v, { got: got.map(v => v.name).join(", ") || "nic", miss: miss.map(v => q.hints[v.key] || v.name).join("; ") || "nic - masz wszystkie" });
    }
    function gainVerse(key, quiet) {
        if (!has() || hasVerse(key)) return;
        setFlag("verse_" + key);
        verseNote();
        const q = Q.W3, r = rec("W3"), v = verseOf(key), n = q.verses.filter(x => hasVerse(x.key)).length;
        if (r) w3Vars(q, r);
        if (!quiet) T.popup("Siódma ballada: nowa zwrotka", { top: true, color: "#ffe27a", sub: (v ? v.from : key) + "  ·  " + n + "/" + q.verses.length });
        if (r && r.s === "active") FX.w3Verse.maybeDone(q);
    }
    // Melia's gift: Natchniony for some hours (TavernLife's buff)
    function inspire(hours) {
        if (!$gameSystem.addBuff) return;
        $gameSystem.addBuff("inspired", hours);
        T.popup("Natchniony (" + hours + " godz.)", { icon: 80, kind: "good" });
    }
    const halfPaid = () => { const St = ST(); try { const s = St && St.active && St.active() ? St.state() : null; return !!s && s.paid >= s.debt / 2; } catch (e) { return false; } };
    // the next Noc Kupały (summer, its 14th day - day 42 in the first year) from today on
    function nextKupala() {
        for (let d = day(); d < day() + 4 * T.time.seasonLength() + 2; d++) {
            if (T.time.season(d) === 1 && T.time.dayOfSeason(d) === 14 && (d > day() || hour() < 22)) return d;
        }
        return day() + 1;
    }
    // D13: the predictions as made on the day the quest began; the journal's words for them
    function d13Pred(r) { return r.t.pred || (r.t.pred = FX.d13Offer.pred(r.day) || { wDay: r.day + 1, wHour: 15, storm: true, oven: r.day + 2, shoe: r.day + 3 }); }
    function d13Vars(q, r) {
        const p = d13Pred(r), g = r.t.got || {};
        const mark = k => (g[k] === true ? " ✓" : g[k] === false ? " (przegapione)" : "");
        r.t.n = ["weather", "oven", "shoe"].filter(k => g[k]).length;
        r.t.v = Object.assign({}, r.t.v, {
            p1: "dzień " + p.wDay + " " + hourWords(p.wHour) + " " + (p.storm ? "burza" : "deszcz") + mark("weather"),
            p2: "dzień " + p.oven + " pęknie piec Hanki (rynek, piekarnia)" + mark("oven"),
            p3: "dzień " + p.shoe + " koń kaprala zgubi podkowę (brama wschodnia, 6–18)" + mark("shoe")
        });
    }
    // what Ozzy says about the hero, sober for a moment: true things he could not know
    function ozzyTruth() {
        const out = [], items = $gameParty.items().filter(it => it && it.name && $gameParty.numItems(it) > 0);
        out.push("Masz w sakiewce " + $gameParty.gold() + " groszy. Ani grosza więcej, ani mniej.");
        const one = items.find(it => $gameParty.numItems(it) === 1) || items[0];
        if (one) out.push("W torbie nosisz " + one.name.toLowerCase() + (($gameParty.numItems(one) === 1) ? " - jedną sztukę" : "") + ". Nie pytaj, skąd wiem. Wiem.");
        const St = ST();
        let story = null;
        try { story = St && St.active && St.active() ? St : null; } catch (e) { story = null; }
        if (story && !story.state().done) out.push("Twój dziadek nie śpi po nocach. Liczy dni do terminu - zostało ich " + Math.max(0, story.daysLeft()) + ". I modli się za ciebie, choć mówi, że nie umie.");
        else out.push("Śni ci się woda. Ciemna, pod kamieniem. Ta sama, co mnie.");
        out.push("Zejdziesz kiedyś tam, gdzie ja wpadłem. Nie bój się ciemności, synku. Bój się pytań. Jedno pytanie - nigdy więcej.");
        return out;
    }
    // D6: a bout over (the arm-wrestling scene's end, back on the map)
    function d6Bout(q, res) {
        const r = rec(q.id), L = q.lines || {};
        if (!r || r.s !== "active" || q.steps[r.step].talk !== "d6Tourney" || !res) return;
        const i = r.t.round || 0;
        if (res.won) {
            if (i === 0 && S().flags.d6Bribe) setFlag("d6Crossed");
            r.t.round = i + 1;
            if (r.t.round >= q.rivals.length) {   // the champion: the belt (a bigger load) and the barrel
                think(L.champion);
                vgive("pas", 1);
                addPerk({ carry: 8 });
                finish(q, { gold: 50, opinion: 5, xp: 120, flag: "d6Won", trust: { grum: 10 }, note: L.noteWon }, { replace: true });
                return;
            }
            think(L.won.concat([fill(L.next, { who: q.rivals[r.t.round].name })]));
            return;
        }
        think(i === 0 ? L.lostQf : i === 1 ? L.lostSf : L.lostF);
        finish(q, i === 0 ? { xp: 30, opinion: 1 } : i === 1 ? { gold: 5, xp: 50, opinion: 1 } : { gold: 15, xp: 80, opinion: 2, trust: { grum: 5 } }, { replace: true });
    }
    // K33: the cap on the left statue of the knights' garden (Map008 5,9 - its head at y 7.15), fallen just behind the gate's grate
    const CAP = { statue: [5, 9], head: { x: 5.5, y: 7.15 }, ground: { x: 5.6, y: 16.3 }, r: 0.38, fall: 40 };
    let capFall = null;   // { t } frames since it was knocked off (the fall is drawn; the step has moved on already)
    const capStep = () => { const r = has() ? rec("K33") : null; return r && r.s === "active" ? r.step : -1; };
    function gateEv() {
        if (!window.$gameMap || $gameMap.mapId() !== TOWN) return null;
        return $gameMap.events().find(e => e.event() && /^Furtka ogrodu rycerzy/.test(e.event().name || "")) || null;
    }
    const gateOpen = () => { const g = gateEv(); return !!g && !!$gameSelfSwitches.value([TOWN, g.eventId(), "A"]); };
    function knockCap() {
        if (capStep() !== 0 || !onTown()) return false;
        capFall = { t: 0 };
        T.audio.se("Blow1", { volume: 60, pitch: 140 });
        think((Q.K33.lines || {}).hit);
        completeStep(Q.K33);
        return true;
    }
    // a stone or an arrow that flew towards the garden from in front of its gate (stopped by the grate, or out of range): does its
    // line pass the cap? (the aim's circle decides where it flies - held still, it is narrow enough)
    function shotAtCap(e) {
        if (capStep() !== 0 || capFall || !onTown() || !e || e.hit) return false;
        const p = $gamePlayer, sx = p._realX + 0.5, sy = p._realY + 0.3;
        if (sy < 15.5 || !(e.y < sy - 0.3) || e.x < 1.5 || e.x > 10.5 || e.y < 6.5) return false;
        const dx = e.x - sx, dy = e.y - sy, xAt = sx + dx * (CAP.head.y - sy) / dy;
        return Math.abs(xAt - CAP.head.x) <= CAP.r + 0.04 ? knockCap() : false;
    }
    T.on("shot", e => { try { shotAtCap(e); } catch (err) { report("K33 shot", err); } }, { owner: PLUGIN });
    const HU = T.api("Hunting");
    if (HU && typeof HU.addTargets === "function") {   // (from close by - inside the garden - the cap is an ordinary target of the aim)
        HU.addTargets(() => (capStep() === 0 && !capFall && onTown() ? [{ x: CAP.head.x, y: CAP.head.y, radius: CAP.r, ref: { kind: "czapka" }, hit: () => knockCap() }] : []));
    }
    // the cap drawn: on the statue's head (K33 step 0), falling, lying behind the grate (step 1) - a child of the statue's sprite
    let capBmp = null;
    function capBitmap() {
        if (capBmp) return capBmp;
        const b = new Bitmap(28, 16), ctx = b.context;
        // a worn felt cap, a short brim to the right (1 px outline like the map's art)
        const rows = [[9, 16], [7, 18], [6, 19], [5, 20], [4, 21], [4, 21], [4, 22], [4, 24], [4, 25], [5, 25]];
        ctx.fillStyle = "#24170e";
        rows.forEach(([a, z], y) => ctx.fillRect(a - 1, y + 2, z - a + 3, 1));
        ctx.fillRect(rows[0][0], 1, rows[0][1] - rows[0][0] + 1, 1);
        ctx.fillRect(rows[9][0], 12, rows[9][1] - rows[9][0] + 1, 1);
        ctx.fillStyle = "#6e5537";
        rows.forEach(([a, z], y) => ctx.fillRect(a, y + 2, z - a + 1, 1));
        ctx.fillStyle = "#4f3b25"; ctx.fillRect(5, 9, 20, 2); ctx.fillRect(18, 10, 7, 1);   // the shade under the crown, the brim
        ctx.fillStyle = "#8f7250"; ctx.fillRect(9, 3, 5, 1); ctx.fillRect(7, 4, 3, 1);       // a light on the felt
        ctx.fillStyle = "#4a5a3c"; ctx.fillRect(14, 5, 4, 3);                                // a patch
        ctx.fillStyle = "#2f3a26"; ctx.fillRect(14, 5, 4, 1); ctx.fillRect(15, 7, 1, 1);
        ctx.fillStyle = "#c9b48a"; ctx.fillRect(13, 6, 1, 1); ctx.fillRect(18, 6, 1, 1);     // stitches
        b._baseTexture.update();
        return (capBmp = b);
    }
    let capStatue = { map: null, id: 0 };
    function capStatueId() {
        if (capStatue.map !== $gameMap) {
            const e = (($dataMap && $dataMap.events) || []).find(x => x && x.x === CAP.statue[0] && x.y === CAP.statue[1] && x.pages && x.pages[0] && /^!Statue/.test(x.pages[0].image.characterName || ""));
            capStatue = { map: $gameMap, id: e ? e.id : 0 };
        }
        return capStatue.id;
    }
    function updateCap(spr, c) {
        const step = $gameMap.mapId() === TOWN && c.eventId() === capStatueId() ? capStep() : -1;
        const show = step === 0 || step === 1;
        if (!show && !spr._tqCap) return;
        if (!spr._tqCap) { spr._tqCap = new Sprite(capBitmap()); spr._tqCap.anchor.set(0.5, 1); spr.addChild(spr._tqCap); }
        const s = spr._tqCap, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        s.visible = show;
        if (!show) return;
        const head = { x: 1, y: -spr.patternHeight() + 9 }, ground = { x: (CAP.ground.x - CAP.statue[0] - 0.5) * tw, y: (CAP.ground.y - CAP.statue[1] - 1) * th };
        if (step === 0) { s.x = head.x; s.y = head.y; s.rotation = 0; s.scale.set(1, 1); return; }
        const k = capFall ? Math.min(1, capFall.t / CAP.fall) : 1;
        if (capFall && ++capFall.t > CAP.fall + 2) capFall = null;
        s.x = head.x + (ground.x - head.x) * k;
        s.y = head.y + (ground.y - head.y) * k - Math.sin(Math.PI * k) * 70;
        s.rotation = k < 1 ? k * 7 : 0.35;
        s.scale.set(1, k < 1 ? 1 : 0.85);
    }
    // standing at the garden's gate and looking in (K33: the cap on the head is high above the screen's top from there), the view
    // eases up over the wall; once he steps away or turns, it eases back to the hero and leaves the camera to the map again
    const PEEK = { tiles: 4.6, speed: 0.14 };
    let peeking = false;
    function centeredY() {
        const p = $gamePlayer, y = p._realY - p.centerY();
        return $gameMap.isLoopVertical() ? y : Math.max(0, Math.min($gameMap.height() - $gameMap.screenTileY(), y));
    }
    function updatePeek() {
        if (!window.$gameMap || !$gamePlayer) return;
        if (!onTown() || $gamePlayer.isTransferring()) { peeking = false; return; }
        const p = $gamePlayer, st = capStep();
        const inZone = (st === 0 || st === 1) && p.x >= 4 && p.x <= 8 && p.y >= 16 && p.y <= 19 && p.direction() === 8;
        if (!inZone && !peeking) return;
        peeking = true;
        const target = inZone ? Math.max(0, centeredY() - PEEK.tiles) : centeredY(), d = target - $gameMap._displayY;
        if (Math.abs(d) < 0.01) { if (!inZone) peeking = false; return; }
        const step = Math.max(-PEEK.speed, Math.min(PEEK.speed, d));
        if (step < 0) $gameMap.scrollUp(-step); else $gameMap.scrollDown(step);
    }
    T.on("mapEnter", () => { peeking = false; }, { owner: PLUGIN });
    // the gate (K33: the cap through the bars) and the statues' plinths (W3: the carved verse) answer the action button
    const STUB_GATE = [C(355, ["TownQuests.place(this, 'gate')"]), C(0, [])], STUB_STATUE = [C(355, ["TownQuests.place(this, 'statue')"]), C(0, [])];
    const plinthWanted = () => { const r = has() ? rec("W3") : null; return !!r && r.s === "active" && Q.W3.steps[r.step].talk === "w3Verse" && !hasVerse("cokoly"); };
    const _Game_Event_list_tq = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        if (window.$gameMap && $gameMap.mapId() === TOWN && has() && this._mapId === TOWN) {
            const d = this.event(), p = this.page();
            if (d && capStep() === 1 && /^Furtka ogrodu rycerzy/.test(d.name || "")) return STUB_GATE;
            if (d && p && plinthWanted() && /^!Statue/.test(p.image.characterName || "") && this.y === CAP.statue[1]) return STUB_STATUE;
        }
        if (window.$gameMap && $gameMap.mapId() === CELLAR && this._mapId === CELLAR && has() && w4On()) {
            const d = this.event();
            if (d && /^Stara krata zakonu/.test(d.name || "") && !T.call("Underground", "isOpen")) return STUB_GRATE;
        }
        return _Game_Event_list_tq.call(this);
    };
    function placeTalk(interp, what) {
        const ev = interp && $gameMap.event(interp.eventId());
        if (!ev || !has()) return;
        let out = null;
        if (what === "gate" && capStep() === 1) {
            out = linesTo([], HERO, (Q.K33.lines || {}).pick);
            script(out, ["K33", "fx", "k33Pick"]);
        } else if (what === "statue" && plinthWanted()) {
            const L = Q.W3.lines || {};
            if (!inHours(hour(), [6, 20])) { T.popup(L.plinthDark, { color: "#ffe9a8" }); return; }
            out = linesTo([], HERO, L.plinth);
            const v = verseOf("cokoly");
            linesTo(out, HERO, ["> „" + v.lines[0] + "\n" + v.lines[1], "> " + v.lines[2] + "\n" + v.lines[3] + "”"]);
            script(out, ["W3", "fx", "w3Verse", "cokoly"]);
        } else if (what === "grate" && w4On() && !T.call("Underground", "isOpen")) out = grateTalk();
        if (out) interp.setupChild(out.concat([C(0, [])]), ev.eventId());
    }
    // (2026-10-06) Borgar: the quests' topics at the bar (TavernLife adds them to Borgar's menu and to the counter): [{ id, label }]
    function borgarTopics() {
        const out = [];
        if (!has()) return out;
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step], f = st && st.talk && FX[st.talk];
            if (!f || !f.borgarTopic) continue;
            let label = null;
            try { label = f.borgarTopic(q, r, st); } catch (e) { report("borgar topic " + q.id, e); }
            if (label) out.push({ id: q.id, label });
        }
        return out;
    }
    function borgarTalk(interp, id) {
        const q = Q[id], r = rec(id), st = q && r && r.s === "active" ? q.steps[r.step] : null, f = st && st.talk && FX[st.talk];
        if (!interp || !f || !f.borgarList || !f.borgarTopic(q, r, st)) return;
        const sp = speakerOf("borgar"), spk = { id: sp.id >= 0 ? sp.id : interp.eventId(), name: "Borgar" };
        try { interp.setupChild(f.borgarList(q, r, st, spk).concat([C(0, [])]), interp.eventId()); } catch (e) { report("borgar talk " + id, e); }
    }
    // the arm-wrestling table on D6's evening: the tournament's bout instead of a game with Grum (TavernLife_ArmWrestle asks it)
    function armTable() {
        const r = has() ? rec("D6") : null;
        if (!r || r.s !== "active" || Q.D6.steps[r.step].talk !== "d6Tourney") return null;
        return FX.d6Tourney.table(Q.D6, r);
    }
    // W4: the old grate in the tavern's cellar (Map009, "Stara krata zakonu") - its locked text hints at the key once W4 began;
    // with the castellan's key it opens (Underground.open: switch 11 - its page 2 leads down)
    const CELLAR = 9;
    const w4On = () => { const r = has() ? rec("W4") : null; return !!r && r.s === "active"; };
    const STUB_GRATE = [C(355, ["TownQuests.place(this, 'grate')"]), C(0, [])];
    function grateTalk() {
        const r = rec("W4"), q = Q.W4, L = q.lines || {}, st = q.steps[r.step], out = [];
        if (st.check === "w4Gate" && vcount("klucz_kasztelana") > 0) {
            linesTo(out, HERO, L.grateOpen);
            return script(out, ["W4", "fx", "w4Open"]);
        }
        linesTo(out, HERO, L.grate);
        linesTo(out, HERO, vcount("klucz_borgar") > 0 || vcount("klucz_kopiec") > 0 ? L.grateHalf : L.grateAsk);
        return out;
    }
    // the topics a quest adds to a regular's talk (K27: Melia under the wall, W3: Ozzy's mead): [{ id, label }]
    function regularTopics(key) {
        const out = [];
        if (!has()) return out;
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step], f = st && st.talk && FX[st.talk];
            if (!f || !f.topic) continue;
            let label = null;
            try { label = f.topic(q, r, st, key); } catch (e) { report("topic " + q.id, e); }
            if (label) out.push({ id: q.id, label });
        }
        return out;
    }
    function regularTopicList(key, id, ev) {
        const q = Q[id], r = rec(id), st = q && r && r.s === "active" ? q.steps[r.step] : null, f = st && st.talk && FX[st.talk];
        if (!f || !f.topicList || !f.topic(q, r, st, key)) return null;
        return f.topicList(q, r, st, key, { id: ev ? ev.eventId() : -1, name: nameOf(key) });
    }
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
        // in through the knights' garden's gate (Map008, the gate event 39 opens with the key): anywhere in the garden
        w2Garden: {
            tick(q) {
                const p = $gamePlayer;
                if (!onTown() || p.x < 2 || p.x > 10 || p.y < 4 || p.y > 13) return;
                const L = q.lines || {};
                if (L.garden) think(L.garden);
                if (L.note) addNote(L.note);
                completeStep(q, { reward: { xp: 40, opinion: 1 } });
            }
        },
        w2Key: { hand: () => { setFlag("gardenKey"); addNote(["Klucz do ogrodu rycerzy", "Ambroży jest ostatnim uczniem straży zakonu - dzwoni, „bo nikt nie odwołał warty”. Dał mi klucz do furtki ogrodu rycerzy."]); } },

        // ================================================================ W1 rozdz. 3-6 (2026-10-05: Feliks is guilty, the Lord knows nothing)
        // rozdz. 3: Kuba at the market - promise silence / make him pay / threaten him with the sołtys
        w1Kuba: {
            talk(q, r, st, key, spk) {
                if (key !== "woziwoda" || !inHours(hour(), [7, 14])) return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.kubaAsk);
                const opts = [["Będę milczał. Powiedz mi wszystko.", "tell", L.kubaTell], ["Płać mi, a będę milczał.", "pay", L.kubaPay],
                    ["Powiem o wszystkim sołtysowi.", "flee", L.kubaFlee], ["Nic. Zapomnij.", "", L.kubaLater]];
                const branches = opts.map(([, how, say]) => { const b = []; linesTo(b, spk, say); if (how) script(b, [q.id, "fx", "w1Kuba", how]); return b; });
                return { ready: true, list: choiceTo(out, opts.map(o => o[0]), branches, 3) };
            },
            ready: (q, r, st, key) => key === "woziwoda" && inHours(hour(), [7, 14]),
            act(q, how) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w1Kuba") return;
                r.t.kuba = how;
                if (how === "tell") { setFlag("kubaTold"); addNote(L.noteTell); }
                else if (how === "pay") { setFlag("kubaPays"); setFlag("feliksWarned"); addNote(L.notePay); }   // (Kuba complains at the manor: its watch is sharper)
                else if (how === "flee") {
                    setFlag("kubaFled");
                    T.call("TownLife", "setGone", "woziwoda", day() + 7);
                    addNote(L.noteFlee);
                    const got = addOpinion(-5, "Kuba uciekł z miasta");
                    T.popup("Kuba uciekł z miasta", { top: true, color: "#ff9f8f", sub: "Na tydzień: piekarnia i kuźnia bez przydziału, Baltazar sprzedaje wodę dwa razy drożej" + (got ? "  ·  Opinia " + got : "") });
                    for (const k of ["piekarka", "soltys", "kowal"]) if (visible(k)) { T.call("TownLife", "say", k, k === "soltys" ? "Kuba! Wracaj! A przydział?!" : "Kuba uciekł? A woda na jutro?!"); break; }
                } else return;
                completeStep(q, { reward: { xp: 60 } });
            }
        },
        // rozdz. 5: the orangery at night - the guard's round, Feliks at the back gate with Kuba's cart (1:30-3:00), the pump, the drawer
        w1Orangery: {
            night: () => inHours(hour(), [21, 4.5]),
            gateNight: () => inHours(hour(), [1.5, 3]) && !goneNow("woziwoda") && !goneNow("feliks"),
            wanted(q, r, st, key) {
                if (key === "w1_feliks" || key === "w1_kuba") return FX.w1Orangery.gateNight();
                if (r.t.tried === nightOf() || !FX.w1Orangery.night()) return false;
                return key === "w1_pump" ? !r.t.pump : key === "w1_drawer" ? !r.t.drawer : false;
            },
            spot(q, r, st, s) {
                const L = q.lines || {}, out = [];
                if (s.key !== "w1_pump" && s.key !== "w1_drawer") return out;   // (Feliks and Kuba: the clock watches them)
                linesTo(out, HERO, s.key === "w1_pump" ? L.pump : L.drawer);
                script(out, [q.id, "fx", "w1Orangery", s.key === "w1_pump" ? "pump" : "drawer"]);
                return out;
            },
            act(q, what) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].tick !== "w1Orangery" || r.t[what]) return;
                r.t[what] = day();
                if (what === "pump") addClue("w1_hatch");
                if (what === "drawer") { vgive("rysunek", 1); T.popup(vname("rysunek"), { icon: vicon("rysunek"), kind: "good" }); }
                if (r.t.pump && r.t.drawer) { addNote(L.note5); completeStep(q, { reward: { xp: 100 } }); }
            },
            tick(q, r) {
                if (!window.$gameMap || $gameMap.mapId() !== MANOR || pendingOut || $gameMap.isEventRunning()) return;
                const self = FX.w1Orangery, p = $gamePlayer, L = q.lines || {};
                if (r.t.tried === nightOf() || !(self.night() || self.gateNight())) return;
                if (p.x > 21 || p.y < 17) return;   // (only the west garden, the orangery's terrace and the strip of forest behind the hedge)
                const sneak = !!T.call("Hunting", "sneaking"), sharp = S().flags.feliksWarned ? 1.5 : 0;
                const g = residentEv("straznik");
                if (g && self.night() && sees(g, p, sneak, sharp)) { self.caught(q, r, g, L.caughtGuard); return; }
                const f = self.gateNight() ? spotEv("w1_feliks") : null;
                if (!f) return;
                const d = dist(f, p);
                if (d < (sneak ? 2.2 : 4) + sharp) { self.caught(q, r, f, L.caughtFeliks); return; }
                if (!r.t.saw && d <= 8) {   // (watched unseen for a while: Feliks fills Kuba's barrels at the gate)
                    r.t.watch = (r.t.watch || 0) + 10;
                    if (r.t.watch >= 480) { r.t.saw = day(); setFlag("w1SawFeliks"); think(L.sawFeliks); addNote(L.noteFeliks); }
                }
            },
            // seen: a word from the one who saw him, then out of the manor's gate to the town's side - try another night
            caught(q, r, who, line) {
                r.t.tried = nightOf();
                const SB = T.api("SpeechBubbles");
                if (SB && SB.say && who) SB.say(who, line, 160);
                const got = addOpinion(-3, "nocą w ogrodzie dworu");
                T.popup("Złapali cię w ogrodzie dworu", { top: true, color: "#ff9f8f", sub: "Wyrzucony za bramę dworu - spróbuj innej nocy" + (got ? "  ·  Opinia " + got : "") });
                pendingOut = { at: Graphics.frameCount + 75, map: TOWN, x: 50, y: 51, dir: 4 };
            }
        },
        // rozdz. 6: the big choice - the sołtys (a market day: reveal it to the town; any day: stay silent), the Lord (quietly), Feliks (pay me)
        w1Choice: {
            talk(q, r, st, key, spk) {
                const L = q.lines || {}, out = [], has = vcount("rysunek") > 0, witness = S().flags.w1Confession ? L.withWitness : [];
                let opts;
                if (key === "soltys" && inHours(hour(), [8, 18])) {
                    const market = isMarket(day()) && inHours(hour(), [8, 14]);
                    linesTo(out, spk, market ? L.soltysMarket : L.soltysAsk);
                    opts = [has && market ? ["Ujawnijmy to. Dziś, przy wszystkich.", "reveal", [].concat(L.reveal.slice(0, 1), witness, L.reveal.slice(1))] : ["Pokażę ci coś w dzień targowy.", "", L.soltysWait],
                        ["Nic nie mam. (Zachowaj to dla siebie.)", "silent", L.silent], ["Jeszcze nie.", "", L.soltysLater]];
                } else if (key === "lord" && has) {
                    linesTo(out, spk, L.lordAsk);
                    opts = [["Pokaż Lordowi rysunek śluzy.", "lord", [].concat(L.lordShow.slice(0, 1), witness, L.lordShow.slice(1))], ["Jeszcze nie.", "", L.lordLater]];
                } else if (key === "feliks" && has && !S().flags.feliksBroke) {   // (2026-10-06: after his men's ambush - no second deal)
                    linesTo(out, spk, L.feliksAsk);
                    opts = [["Dwadzieścia groszy na tydzień - i milczę.", "deal", L.feliksDeal], ["Jeszcze się zobaczymy.", "", L.feliksLater]];
                } else return null;
                const branches = opts.map(([, how, say]) => { const b = []; linesTo(b, spk, say); if (how) script(b, [q.id, "fx", "w1Choice", how]); return b; });
                return { ready: true, list: choiceTo(out, opts.map(o => o[0]), branches, opts.length - 1) };
            },
            ready: (q, r, st, key) => (key === "soltys" && inHours(hour(), [8, 18])) || ((key === "lord" || (key === "feliks" && !S().flags.feliksBroke)) && vcount("rysunek") > 0),
            act(q, how) {
                const r = rec(q.id), L = q.lines || {}, PAUSE = w1Ch7(q), witness = S().flags.w1Confession ? 3 : 0;   // (PAUSE: rozdz. 7 - Act II)
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w1Choice") return;
                r.t.choice = how;
                if (how === "reveal") {   // a) the town hears it; the Lord did not know - Feliks arrested, the sluice half open
                    vtake("rysunek", 1);
                    for (const f of ["w1Revealed", "sluiceHalf", "millRuns", "witDegraded", "lordCold"]) setFlag(f);
                    T.call("TownLife", "setGone", "feliks", true);
                    addNote(L.noteReveal);
                    completeStep(q, { to: PAUSE, reward: { opinion: 15 + witness, xp: 150 } });
                } else if (how === "lord") {   // b) quietly: Feliks gone, 200 G off the debt, the Lord an ally, Kuba resentful
                    vtake("rysunek", 1);
                    for (const f of ["lordAlly", "sluiceHalf", "millRuns", "kubaResent"]) setFlag(f);
                    T.call("TownLife", "setGone", "feliks", true);
                    addNote(L.noteLord);
                    completeStep(q, { to: PAUSE, reward: { debtCredit: 200, opinion: 5, xp: 150 } });
                } else if (how === "deal") {   // c) 20 G a week - and two weeks later Feliks's men on the road
                    setFlag("feliksPays");
                    r.t.deal = day(); r.t.paid = day(); r.t.got = 20;
                    addNote(L.noteDeal);
                    completeStep(q, { reward: { gold: 20, xp: 50 } });
                } else if (how === "silent") {   // d) nothing changes (rozdz. 7 comes back in Act II anyway)
                    setFlag("w1Silent");
                    addNote(L.noteSilent);
                    completeStep(q, { to: PAUSE, reward: { xp: 50 } });
                }
            }
        },
        // rozdz. 6 c: Feliks's money every 7 days at the market; 14 days after the deal his men wait on Polna droga
        w1Feliks: {
            talk(q, r, st, key, spk) {
                if (key !== "feliks" || r.t.amb || day() < (r.t.paid || 0) + 7) return null;
                const out = [];
                linesTo(out, spk, (q.lines || {}).feliksWeek);
                script(out, [q.id, "fx", "w1Feliks"]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "feliks" && !r.t.amb && day() >= (r.t.paid || 0) + 7,
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w1Feliks" || r.t.amb || day() < (r.t.paid || 0) + 7) return;
                r.t.paid = day();
                r.t.got = (r.t.got || 0) + 20;
                $gameParty.gainGold(20);
                T.popup("+20 G od Feliksa", { icon: COIN_ICON, kind: "gold" });
            }
        },
        // (2026-10-06) two weeks after the deal Feliks's men wait on Polna droga: a real fight (Humans.ambush - combat stage 3). Two men
        // (a club and - if Humans.js has it - a knife), three (an archer too) once Feliks has paid 40 G. Beaten: the hero keeps the drawing - the choice of rozdz. 6 comes back (no
        // second deal; a spared man's word is a witness). Beaten by them: robbed as Humans.js robs (part of the gold and food, a wound,
        // an hour) - and the drawing is gone: on to rozdz. 7. Off the road mid-fight: they wait for him again three days later.
        // Without Humans.js: the old scripted robbery.
        w1Ambush: {
            TAG: "w1Feliks",
            due: r => day() >= Math.max((r.t.deal || 0) + 14, r.t.ambAt || 0),
            tick(q, r) {
                if (!window.$gameMap) return;
                const self = FX.w1Ambush, Hm = T.api("Humans");
                if (r.t.amb) {   // (the fight is on - its end comes on the bus: humansDone / heroRobbed; off the road or the band gone = he got away)
                    if (Hm && Hm.robbery) return;
                    if ($gameMap.mapId() !== ROAD || !(Hm && Hm.band && Hm.band(self.TAG))) self.end(q, "fled");
                    return;
                }
                if ($gameMap.mapId() !== ROAD || !self.due(r) || $gameMap.isEventRunning() || $gamePlayer.isTransferring()) return;
                if (!Hm || typeof Hm.ambush !== "function") { self.scripted(q, r); return; }
                if (Hm.robbery) return;
                const L = q.lines || {}, kinds = ["bandit", Hm.KINDS && Hm.KINDS.knifer ? "knifer" : "bandit"].concat((r.t.got || 0) >= 40 ? ["archer"] : []);   // (a club, a knife - the bow, too, once paid 40 G)
                const band = Hm.ambush(kinds, { tag: self.TAG, say: L.ambushShout, name: L.manName, gold: 8 });
                if (!band) return;   // (no room for them here - a few steps further on)
                r.t.amb = day();
                r.t.men = band.members.length;
                think(kinds.length > 2 ? [].concat(L.ambushStart, L.ambushArcher) : L.ambushStart);
            },
            end(q, how, e) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].tick !== "w1Ambush" || !r.t.amb) return;
                r.t.amb = null;
                setFlag("feliksBroke");   // (no more of Feliks's money)
                if (how === "won") {
                    setFlag("w1AmbushWon");
                    think(L.ambushWon);
                    addNote(L.noteAmbushWon);
                    if (e && (e.spared || 0) + (e.robbed || 0) > 0) { setFlag("w1Confession"); think(L.confession); addNote(L.noteConfession); }
                    completeStep(q, { to: q.steps.findIndex(s => s.talk === "w1Choice"), reward: { xp: 120 } });
                } else if (how === "lost") {
                    vtake("rysunek", 1);
                    for (const f of ["w1Ambushed", "w1Robbed"]) setFlag(f);
                    think(L.ambushLost);
                    addNote(L.noteAmbush);
                    completeStep(q, { to: w1Ch7(q), reward: { xp: 40 } });
                } else {   // fled: they wait again, three days on
                    r.t.ambAt = day() + 3;
                    think(L.ambushFled);
                    const hunted = q.steps.findIndex(s => s.tick === "w1Ambush" && !s.talk);
                    if (r.step !== hunted) completeStep(q, { to: hunted });
                    else T.popup(q.title, { top: true, color: "#ffe27a", sub: stepLine(q) });
                }
            },
            // (no Humans.js: told in bubbles, as before)
            scripted(q, r) {
                const L = q.lines || {}, g = $gameParty.gold(), loss = Math.min(g, Math.max(r.t.got || 0, Math.floor(g / 2)));
                if (loss > 0) $gameParty.loseGold(loss);
                if (typeof $gameSystem.injure === "function") $gameSystem.injure(30, 24);   // (Survival.js: a wound)
                T.audio.se("Blow1", { volume: 85 });
                think(L.ambush);
                T.popup("Napad na Polnej drodze", { top: true, color: "#ff9f8f", sub: "Ludzie Feliksa: -" + loss + " G i rana" });
                r.t.amb = day();
                FX.w1Ambush.end(q, "lost");
            }
        },
        // ---- W1 rozdz. 7 (2026-10-06, Act II): the main sluice of the Order's cistern (underground floor 30, the bus "undergroundSluice"),
        // then the bell's "water" signal - four and two - rung by the hero (the bell mini-game, six strikes) or by Ambroży
        w1Sluice: { check: () => !!S().flags.sluiceFound },
        w1Bell: {
            ok: () => inHours(hour(), [6, 21]),
            talk(q, r, st, key, spk) {
                if (key !== "dzwonnik" || !FX.w1Bell.ok()) return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.bellAsk);
                const opts = [[L.optBellSelf, "self", L.bellSelf], [L.optBellHim, "him", L.bellHim], [L.optBellLater, "", L.bellLater]];
                return { ready: true, list: choiceTo(out, opts.map(o => o[0]), opts.map(([, how, say]) => { const b = []; linesTo(b, spk, say); if (how) script(b, [q.id, "fx", "w1Bell", how]); return b; }), 2) };
            },
            ready: (q, r, st, key) => key === "dzwonnik" && FX.w1Bell.ok(),
            act(q, how) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w1Bell") return;
                if (how === "self") openBell({ target: 6, title: "Cztery i dwa", sub: "dzwonnica - sygnał wody", who: "Cztery, przerwa, dwa: sześć uderzeń", period: 104, window: 0.88 }, res => ringW1(q, res));
                else if (how === "him") { ringPattern([4, 2], 60); FX.w1Bell.open(q, false); }
            },
            // the water goes: the market well fills - under the sołtys's lock and ration (for the hero still its two draws a day), the mill
            // runs, Kuba carries the ration honestly. The hero gets no water from it (the drought rule)
            open(q, self) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w1Bell") return;
                hearSignal("4+2");
                for (const f of ["cisternOpen", "sluiceHalf", "millRuns", "kubaHonest"]) if (!S().flags[f]) setFlag(f);
                think(L.waterComes);
                if (visible("dzwonnik")) T.call("TownLife", "say", "dzwonnik", L.waterAmbrozy);
                let n = 0;
                for (const [k, line] of Object.entries(L.shout || {})) if (n < 2 && visible(k) && k !== "dzwonnik") { T.call("TownLife", "say", k, line); n++; }
                addNote(L.noteCistern);
                finish(q, { xp: self ? 350 : 300, opinion: 20 });
            }
        },

        // ================================================================ W2 rozdz. 5-6 (2026-10-05)
        // rozdz. 5: seven strikes ("pytanie") at noon from the tower - Ambroży lets the hero ring
        w2Ring: {
            ok: () => { const st = TL() && TL().state("dzwonnik"); return !!st && !st.hidden && st.act === "bell" && inHours(hour(), [11.5, 12.3]); },
            talk(q, r, st, key, spk) {
                if (key !== "dzwonnik" || !FX.w2Ring.ok() || r.t.rang === day() || r.t.wrong === day()) return null;
                const out = [];
                linesTo(out, spk, (q.lines || {}).ringGo);
                script(out, [q.id, "fx", "w2Ring"]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "dzwonnik" && FX.w2Ring.ok() && r.t.rang !== day() && r.t.wrong !== day(),
            act(q) { openBell({ target: 7, title: "Siedem w południe", who: "Ambroży patrzy w stronę ogrodu rycerzy", period: 104, window: 0.88 }, res => ringW2(q, res)); }
        },
        // ...then in the knights' garden between 12:00 and 12:30 the shadows meet on the slab - it opens (Map008 "Płyta w ścieżce", self switch A)
        w2Shadow: {
            tick(q, r) {
                const h = hour(), L = q.lines || {};
                if (day() !== r.t.rang || h >= 12.5) {   // the shadows moved on: ring again another day
                    think(L.shadowLate);
                    r.step = q.steps.findIndex(s => s.talk === "w2Ring");
                    enterStep(q);
                    T.popup(q.title, { top: true, color: "#ffe27a", sub: stepLine(q) });
                    return;
                }
                const p = $gamePlayer;
                if (!onTown() || h < 12 || p.x < 2 || p.x > 10 || p.y < 4 || p.y > 13) return;
                think(L.shadow);
                $gameSelfSwitches.setValue([TOWN, slabId(), "A"], true);
                T.audio.se("Earth2", { volume: 70, pitch: 80 });
                addNote(L.noteSlab);
                completeStep(q, { reward: { xp: 60 } });
            }
        },
        // rozdz. 6: the Archive (Map119) - the Book of Signals (every signal known), the chronicles (take / leave / to Ambroży)
        w2Archive: {
            wanted: (q, r, st, key) => (key === "w2_book" ? !r.t.book : key === "w2_chron" ? !r.t.chron : false),
            spot(q, r, st, s) {
                const L = q.lines || {}, out = [];
                if (s.key === "w2_book") { linesTo(out, HERO, L.book); script(out, [q.id, "fx", "w2Archive", "book"]); return out; }
                linesTo(out, HERO, L.chronicles);
                const opts = [["Zabierz kroniki.", "take", L.chronTake], ["Zostaw je tutaj.", "leave", L.chronLeave], ["Zanieś je Ambrożemu.", "give", L.chronGive]];
                return choiceTo(out, opts.map(o => o[0]), opts.map(([, how, say]) => { const b = []; linesTo(b, HERO, say); script(b, [q.id, "fx", "w2Archive", how]); return b; }), -1);
            },
            act(q, what) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].spotFx !== "w2Archive") return;
                if (what === "book") {
                    if (r.t.book) return;
                    r.t.book = day();
                    setFlag("signalBook");
                    addNote(["Księga sygnałów", "W Archiwum zakonu przeczytałem Księgę sygnałów: " + Object.values(D.SIGNALS).map(sg => sg.pattern.join(" + ") + " - " + sg.meaning).join("; ") + "."]);
                    T.popup("Księga sygnałów", { top: true, color: "#ffe27a", sub: "Znasz wszystkie sygnały dzwonu (dziennik: Miasteczko - Sygnały dzwonu)" });
                } else {
                    if (r.t.chron) return;
                    r.t.chron = what;
                    addNote(L.noteChron);
                    if (what === "take") { vgive("kroniki", 1); setFlag("chroniclesTaken"); }
                    else if (what === "give") { vgive("kroniki", 1); setFlag("chroniclesForAmbrozy"); }
                    else setFlag("chroniclesLeft");
                }
                if (r.t.book && r.t.chron) {
                    const give = q.steps.findIndex(s => s.type === "bring" && s.to === "dzwonnik");
                    completeStep(q, { to: r.t.chron === "give" ? give : q.steps.length - 1, reward: { xp: 120 } });
                }
            }
        },
        // the chronicles taken: Baltazar buys them (300 G) - a hook for W5 (flags w5ChroniclesSold / w5ChroniclesKept)
        w2Sell: {
            act(q, yes) {
                if (!vcount("kroniki")) return;
                if (yes) { vtake("kroniki", 1); $gameParty.gainGold(300); setFlag("w5ChroniclesSold"); T.popup("+300 G od Baltazara", { icon: COIN_ICON, kind: "gold" }); }
                else setFlag("w5ChroniclesKept");
            }
        },

        // ================================================================ K37: the stolen purse - Szymek runs, the hero chases (2026-10-05)
        k37Theft() {   // (autoStart) a market day from day 10, Feliks shopping at the stalls, the hero close by
            if (!onTown() || !isMarket(day()) || day() < 10 || !inHours(hour(), [8.5, 10.4]) || $gameMap.isEventRunning() || pendingOut) return false;
            const f = residentEv("feliks"), z = residentEv("zlodziej");
            return !!f && !!z && !f.isMoving() && dist(f, $gamePlayer) <= 9;
        },
        k37Chase: {
            ROUTE: ["schody_rzem", "woziwoda_dom", "pod_murem"],   // down the stairs, along the craftsmen's terrace, into the camp
            enter(q, r) {
                const z = TL() && TL().eventOf("zlodziej"), f = residentEv("feliks"), L = q.lines || {};
                r.t.chase = { leg: 0, pause: 0 };
                if (!z) return;
                const c = f ? freeBeside(f) : null;
                if (c) z.locate(c[0], c[1]);
                z.setMoveSpeed(4.4);   // (faster than the hero walks, slower than he runs)
                FX.k37Chase.go(r);
                T.call("TownLife", "say", "feliks", L.shout);
                T.call("TownLife", "say", "zlodziej", L.run);
            },
            go(r) {
                const sp = T.call("TownLife", "spot", FX.k37Chase.ROUTE[r.t.chase.leg]);
                T.call("TownLife", "hold", "zlodziej", true, sp || null);
                return sp;
            },
            tick(q, r) {
                const z = TL() && TL().eventOf("zlodziej"), L = q.lines || {}, c = r.t.chase || (r.t.chase = { leg: 0, pause: 0 });
                if (!z || !onTown()) { FX.k37Chase.lost(q); return; }
                const p = $gamePlayer, d = dist(z, p);
                if (d <= 1.5) {   // caught: he stops, the talk decides
                    T.call("TownLife", "hold", "zlodziej", true, null);
                    z.setMoveSpeed(4);
                    z.turnTowardCharacter(p);
                    T.call("TownLife", "say", "zlodziej", L.caught);
                    completeStep(q);
                    return;
                }
                if (d > 14) { FX.k37Chase.lost(q); return; }
                if (c.pause > 0) { if (--c.pause === 0) FX.k37Chase.go(r); return; }
                if (!TL().held("zlodziej")) { FX.k37Chase.go(r); return; }   // (after a load: taken over again)
                const sp = T.call("TownLife", "spot", FX.k37Chase.ROUTE[c.leg]);
                if (!sp) { FX.k37Chase.lost(q); return; }
                if (z.x === sp[0] && z.y === sp[1] && !z.isMoving()) {   // a corner: he looks back, then on
                    if (c.leg + 1 >= FX.k37Chase.ROUTE.length) { FX.k37Chase.lost(q); return; }
                    c.leg++;
                    c.pause = 3;
                    z.turnTowardCharacter(p);
                    T.call("TownLife", "say", "zlodziej", pick(L.look));
                    T.call("TownLife", "hold", "zlodziej", true, null);
                }
            },
            lost(q) {
                const z = TL() && TL().eventOf("zlodziej");
                if (z) z.setMoveSpeed(4);
                T.call("TownLife", "hold", "zlodziej", false);
                fail(q);
            }
        },
        k37Hold: {   // caught, he waits for the talk - unless the hero walks off
            tick(q) {
                const z = TL() && TL().eventOf("zlodziej");
                if (z && onTown() && dist(z, $gamePlayer) <= 8) return;
                if (z) T.call("TownLife", "hold", "zlodziej", false);
                fail(q, (q.lines || {}).gone);
            }
        },
        k37Caught: {
            talk(q, r, st, key, spk) {
                if (key !== "zlodziej") return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.talk);
                const opts = [["Oddaj sakiewkę. Wróci do Feliksa.", "return", L.giveBack], ["Uciekaj. I więcej nie kradnij.", "free", L.free], ["Sakiewka zostaje u mnie.", "keep", L.keep]];
                return { ready: true, list: choiceTo(out, opts.map(o => o[0]), opts.map(([, how, say]) => { const b = []; linesTo(b, spk, say); script(b, [q.id, "fx", "k37Caught", how]); return b; }), -1) };
            },
            ready: (q, r, st, key) => key === "zlodziej",
            act(q, how) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "k37Caught") return;
                T.call("TownLife", "hold", "zlodziej", false);
                if (how === "return") { completeStep(q); return; }   // (the purse in the bag: back to Feliks, the Lord writes 50 G off the debt)
                if (how === "free") { setFlag("campTrust"); finish(q, { xp: 60, flag: "szymekFree", note: L.noteFree }, { replace: true }); return; }
                const rw = { gold: 80, xp: 20, note: L.noteKeep };   // keep: 80 G - and if someone saw it, the town knows and the guard watches
                if (witnesses("zlodziej").length) { rw.opinion = -15; rw.flag = "k37Seen"; setFlag("guardSuspicious"); }
                finish(q, rw, { replace: true });
            }
        },

        // ================================================================ K39: the dice sharper at the market (TavernDice + Czujność 10)
        k39Play: {
            talk(q, r, st, key, spk) {
                if (key !== "gracz" || !inHours(hour(), [9.7, 14])) return null;
                const L = q.lines || {}, out = [], yes = [], no = [];
                linesTo(out, spk, L.play);
                script(yes, [q.id, "fx", "k39Play"]);
                linesTo(no, spk, L.playNo);
                return { ready: true, list: choiceTo(out, ["Zagram (5 G).", "Nie teraz."], [yes, no], 1) };
            },
            ready: (q, r, st, key) => key === "gracz" && inHours(hour(), [9.7, 14]),
            act(q, a, interp, stop) {
                const TD = T.api("TavernDice");
                if (!TD || typeof TD.start !== "function") { k39After(q, { played: 1, none: true }); return; }
                if (TD.OPPONENTS && !TD.OPPONENTS.lucjan) TD.OPPONENTS.lucjan = D.LUCJAN;   // (a rival of the market only - never at the tavern's table)
                const ok = TD.start(Object.assign({ opponent: "lucjan", stake: 5 }, api.diceOpts || {}, { onEnd: res => k39After(q, res) }));
                if (!ok) stop();
            }
        },
        k39Choice: {
            talk(q, r, st, key, spk) {
                if (key !== "gracz") return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.face);
                const opts = [["Zdemaskuję cię. Przy wszystkich.", "out", L.out], ["Podziel się zyskiem - dziesięć groszy i milczę.", "share", L.share], ["Jeszcze nie.", "", L.later]];
                return { ready: true, list: choiceTo(out, opts.map(o => o[0]), opts.map(([, how, say]) => { const b = []; linesTo(b, spk, say); if (how) script(b, [q.id, "fx", "k39Choice", how]); return b; }), 2) };
            },
            ready: (q, r, st, key) => key === "gracz",
            act(q, how) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "k39Choice") return;
                if (how === "out") {   // he leaves the market for good; Bartek gets to hear it
                    T.call("TownLife", "setGone", "gracz", true);
                    setFlag("lucjanOut");
                    addNote(L.noteOut);
                    completeStep(q, { reward: { opinion: 4 } });
                } else if (how === "share") {
                    setFlag("lucjanShare");
                    finish(q, { gold: 10, xp: 30, note: L.noteShare }, { replace: true });
                }
            }
        },

        // ================================================================ THE TAVERN'S REGULARS (2026-10-06): K22, K27 (Melia's way), K33, D13, D6, W3, W8
        // ---- K22: Ignac twists the string in an hour; Melia sings a new verse if it comes before 18:00 of the day she asked
        k22Twist: { hand: (q, r) => { r.t.twistAt = now() + 1; } },
        k22String: {
            talk(q, r, st, key, spk) {
                if (key !== "garbarz") return null;
                const L = q.lines || {};
                if (now() < (r.t.twistAt || 0)) return { ready: false, list: linesTo([], spk, L.twisting) };
                const out = [];
                script(out, [q.id, "fx", "k22String"]);
                return { ready: true, list: linesTo(out, spk, L.string) };
            },
            ready: (q, r, st, key) => key === "garbarz" && now() >= (r.t.twistAt || 0),
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "k22String") return;
                vgive("struna", 1);
                T.popup(vname("struna"), { icon: vicon("struna"), kind: "good" });
                completeStep(q);
            }
        },
        k22Melia: {
            onTime: r => day() === r.day && hour() < 18,
            talk(q, r, st, key, spk) {
                if (key !== "melia" || vcount("struna") <= 0) return null;
                const L = q.lines || {}, out = [], on = FX.k22Melia.onTime(r);
                linesTo(out, spk, L.hero);
                if (on) {
                    linesTo(out, spk, L.onTime);
                    sing(out, spk, "struna");
                    script(out, [q.id, "fx", "k22Melia", 1]);
                    linesTo(out, spk, L.after);
                } else {
                    script(out, [q.id, "fx", "k22Melia", 0]);
                    linesTo(out, spk, L.late);
                }
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "melia" && vcount("struna") > 0,
            act(q, on) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "k22Melia" || vcount("struna") <= 0) return;
                vtake("struna", 1);
                if (on) { setFlag("k22Verse"); gainVerse("struna"); inspire(4); finish(q, { gold: 15 }); }
                else finish(q, { gold: 10 });
            }
        },
        // ---- K27, Melia's way: she sings for Ela under the wall (a topic in her talk, 17-21:30); the next day Ludmiła or Ela tells it
        k27Melia: {
            topic: (q, r, st, key) => (key === "melia" && !S().flags.k27Melia && inHours(hour(), [17, 21.5]) ? "Zaśpiewasz Eli kołysankę pod murem?" : null),
            topicList(q, r, st, key, spk) {
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.meliaAsk);
                script(out, [q.id, "fx", "k27Melia", "melia"]);
                return linesTo(out, HERO, L.meliaGone);
            },
            talk(q, r, st, key, spk) {
                if (FX.k27Melia.ready(q, r, st, key) !== true) return null;
                const out = [];
                linesTo(out, spk, (q.lines || {}).morning);
                script(out, [q.id, "fx", "k27Melia", "done"]);
                return { ready: true, list: out };
            },
            // (null when it is not Melia's way: the step's own hand-in to Ela decides the tick)
            ready: (q, r, st, key) => { const f = S().flags.k27Melia; return (key === "ludmila" || key === "ela") && !!f && day() > f && inHours(hour(), [6.5, 20]) ? true : null; },
            act(q, what) {
                const r = rec(q.id);
                if (!r || r.s !== "active") return;
                if (what === "melia") { setFlag("k27Melia"); return; }   // (the flag's value is the day: no song in the tavern that evening)
                if (what === "done" && S().flags.k27Melia && day() > S().flags.k27Melia) finish(q, { trust: { melia: 5 } });
            }
        },
        // ---- K33: the cap on the statue (the shot - Hunting's target and the "shot" bus, below), picked up through the bars
        k33Shot: { tick() {} },
        k33Pick: {
            // the gate open (W2's key): walking up to the cap is enough
            tick(q, r) {
                if (!onTown() || !gateOpen()) return;
                if (Math.hypot($gamePlayer.x + 0.5 - CAP.ground.x, $gamePlayer.y + 0.5 - CAP.ground.y) > 1.3) return;
                think((q.lines || {}).pick);
                FX.k33Pick.act(q);
            },
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].tick !== "k33Pick") return;
                vgive("czapka", 1);
                T.popup(vname("czapka"), { icon: vicon("czapka"), kind: "good" });
                completeStep(q);
            }
        },
        // ---- D13: Ozzy's three predictions, read from the weather plan; Grum's bet; seeing each with one's own eyes
        d13Offer: {
            cond: () => !!FX.d13Offer.pred(day()),
            // from day d0: the first rain or storm of the next two days (the plan), Hanka's oven in two days, the corporal's horse in three
            pred(d0) {
                const Sv = T.api("Survival");
                if (!Sv || typeof Sv.weatherPlan !== "function") return null;
                for (const d of [d0 + 1, d0 + 2]) {
                    const p = Sv.weatherPlan(d);
                    if (p && (p.type === "rain" || p.storm)) return { wDay: d, wHour: p.storm ? p.storm.start : p.start, storm: !!p.storm, oven: d0 + 2, shoe: d0 + 3 };
                }
                return null;
            },
            say(p, d0) {
                if (!p) return [];
                const w = (p.wDay === d0 + 1 ? "Jutro " : "Pojutrze ") + hourWords(p.wHour) + (p.storm ? " burza. Taka, że psy pod ławy wejdą!" : " deszcz. Wystawiajcie garnki, ludzie!");
                return [w, "Pojutrze pęknie piec Hanki. Trzask - i na dwoje!", "A za trzy dni koń kaprala zgubi podkowę. Na równej drodze! *hep* Zapamiętajcie, co mówił stary Ozzy!"];
            },
            offer(q, spk) {
                const out = [];
                linesTo(out, spk, (q.lines || {}).offer);
                linesTo(out, spk, FX.d13Offer.say(FX.d13Offer.pred(day()), day()));
                return offerChoice(out, q, spk);
            }
        },
        d13Bet: {
            talk(q, r, st, key, spk) {
                if (key !== "grum") return null;
                const out = [];
                linesTo(out, spk, (q.lines || {}).bet);
                script(out, [q.id, "fx", "d13Bet"]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "grum",
            act(q) { const r = rec(q.id); if (r && r.s === "active" && q.steps[r.step].talk === "d13Bet") { d13Vars(q, r); completeStep(q); } }
        },
        d13Check: {
            due(r, key) {
                const p = d13Pred(r), g = r.t.got || {};
                if (key === "piekarka") return day() === p.oven && g.oven === undefined;
                if (key === "kapral") return day() === p.shoe && g.shoe === undefined && inHours(hour(), [6, 18]);
                return false;
            },
            talk(q, r, st, key, spk) {
                if (!FX.d13Check.due(r, key)) return null;
                const L = q.lines || {}, out = [], what = key === "piekarka" ? "oven" : "shoe";
                linesTo(out, spk, what === "oven" ? L.hankaOven : L.witShoe);
                script(out, [q.id, "fx", "d13Check", what]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => FX.d13Check.due(r, key),
            act(q, what) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "d13Check") return;
                const g = r.t.got || (r.t.got = {});
                if (g[what] !== undefined) return;
                g[what] = true;
                if (what === "oven") setFlag("d13Oven");
                d13Vars(q, r);
                FX.d13Check.done(q, r);
            },
            tick(q, r) {
                const p = d13Pred(r), g = r.t.got || (r.t.got = {}), L = q.lines || {}, d = day(), h = hour();
                if (g.weather === undefined && d === p.wDay && h >= p.wHour && h < p.wHour + 3) { g.weather = true; think([fill(p.storm ? L.storm : L.rain, { hour: hm(p.wHour) })]); }
                for (const [k, when] of [["weather", p.wDay], ["oven", p.oven], ["shoe", p.shoe]]) {
                    if (g[k] === undefined && (d > when || (k === "weather" && d === when && h >= p.wHour + 3))) { g[k] = false; think([L.missed]); }
                }
                // the town hears it: Hanka at her stall, the corporal at his gate (a word when the hero passes)
                if (onTown() && !r.t.barked && d === p.oven && visible("piekarka") && dist(residentEv("piekarka"), $gamePlayer) < 8) { r.t.barked = 1; T.call("TownLife", "say", "piekarka", "Piec mi pękł! Mój piec!"); }
                if (onTown() && r.t.barked !== 2 && d === p.shoe && visible("kapral") && dist(residentEv("kapral"), $gamePlayer) < 8) { r.t.barked = 2; T.call("TownLife", "say", "kapral", "Podkowa! Koń zgubił podkowę, psiakrew!"); }
                d13Vars(q, r);
                FX.d13Check.done(q, r);
            },
            done(q, r) { const g = r.t.got || {}; if (["weather", "oven", "shoe"].every(k => g[k] !== undefined)) completeStep(q); }
        },
        d13Pay: {
            talk(q, r, st, key, spk) {
                if (key !== "grum") return null;
                const g = r.t.got || {}, n = ["weather", "oven", "shoe"].filter(k => g[k]).length, L = q.lines || {}, out = [];
                linesTo(out, spk, n ? L.pay : L.payNone, { n, gold: n * 10 });
                script(out, [q.id, "fx", "d13Pay"]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "grum",
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "d13Pay") return;
                const g = r.t.got || {}, n = ["weather", "oven", "shoe"].filter(k => g[k]).length;
                completeStep(q, { reward: n ? { gold: n * 10 } : null });
            }
        },
        d13Ozzy: {
            talk(q, r, st, key, spk) {
                if (key !== "ozzy") return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.ozzy);
                linesTo(out, spk, ozzyTruth());
                script(out, [q.id, "fx", "d13Ozzy"]);
                return { ready: true, list: linesTo(out, spk, L.ozzyEnd) };
            },
            ready: (q, r, st, key) => key === "ozzy",
            act(q) { const r = rec(q.id); if (r && r.s === "active" && q.steps[r.step].talk === "d13Ozzy") finish(q); }
        },
        // ---- D6: the tournament (the author, 2026-10-06: arm-wrestling only in the tavern) - three evenings' training with Grum, the
        // sign-up with Borgar at the bar (2 G), Baltazar's 40 G, three bouts at the arm-wrestling table on the market day's evening
        d6Late: {
            enter(q, r) {
                if (r.t.market) return;
                r.t.market = nextOf(r.day + 3, isMarket);
                r.t.train = [];
                r.t.v = Object.assign({}, r.t.v, { market: r.t.market });
            },
            tick(q, r) {
                const m = r.t.market, L = q.lines || {};
                if (!m) return;
                if (!r.t.round) { if (day() > m || (day() === m && hour() >= 22)) fail(q, L.late); return; }
                if (day() > m && q.steps[r.step].talk === "d6Tourney") {   // (gone home in the middle of it: what was won so far)
                    think(L.walkover);
                    finish(q, r.t.round >= 2 ? { gold: 15, xp: 80, opinion: 2, trust: { grum: 5 } } : { gold: 5, xp: 50, opinion: 1 }, { replace: true });
                }
            }
        },
        d6Train: {
            check(q, r) {
                FX.d6Late.enter(q, r);
                r.t.n = (r.t.train || []).length;
                if (r.t.n >= 3 || day() >= r.t.market) { r.t.trained = r.t.n; return true; }
                return false;
            }
        },
        // the sign-up: a topic at the bar (Borgar's menu, the counter)
        d6Sign: {
            borgarTopic: (q, r) => (day() < r.t.market || (day() === r.t.market && hour() < 22) ? (q.lines || {}).signTopic : null),
            borgarList(q, r, st, spk) {
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.sign);
                script(out, [q.id, "fx", "d6Sign"]);
                return linesTo(out, spk, L.signDone);
            },
            ready: (q, r, st, key) => (key === "borgar" ? !!FX.d6Sign.borgarTopic(q, r) : null),
            act(q, a, interp, stop) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "d6Sign") return;
                if ($gameParty.gold() < 2) { T.popup.need(COIN_ICON, "Potrzebujesz 2 G"); stop(); return; }
                $gameParty.loseGold(2);
                completeStep(q);
            }
        },
        d6Bribe: {
            act(q, yes) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || S().flags.d6Bribe || S().flags.d6Refused) return;
                if (yes) { setFlag("d6Bribe"); $gameParty.gainGold(40); T.popup("+40 G od Baltazara", { icon: COIN_ICON, kind: "gold" }); }
                else setFlag("d6Refused");
            }
        },
        // the bouts: at the arm-wrestling table (<Tavern:arm>, or "Siłujmy się" with Grum) the market day's evening is the tournament's
        d6Tourney: {
            open: r => (day() === r.t.market && inHours(hour(), [18, 22])) || (!!r.t.round && day() === r.t.market && hour() >= 18),
            table(q, r) {
                if (!FX.d6Tourney.open(r)) return null;
                const L = q.lines || {}, i = r.t.round || 0, out = [];
                linesTo(out, HERO, [L.call[i]]);
                const opts = i === 0 && S().flags.d6Bribe ? [[L.fair, "fight"], [L.throw, "throw"], [L.wait, ""]] : [[L.go, "fight"], [L.wait, ""]];
                return choiceTo(out, opts.map(o => o[0]), opts.map(([, how]) => { const b = []; if (how) script(b, [q.id, "fx", "d6Tourney", how]); return b; }), opts.length - 1);
            },
            ready: (q, r, st, key) => key === "grum" && FX.d6Tourney.open(r),
            act(q, how, interp, stop) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "d6Tourney" || !FX.d6Tourney.open(r)) return;
                if (how === "throw") {
                    setFlag("d6Sold");
                    setFlag("balthazarTrust");
                    think(L.sold);
                    finish(q, { xp: 20, note: L.noteSold, trust: { grum: -5 } }, { replace: true });
                    return;
                }
                const i = r.t.round || 0, rv = Object.assign({}, q.rivals[i]);
                rv.level = (rv.level || 0) + ((r.t.trained || 0) >= 3 ? 0 : 1);   // (untrained: every rival a notch harder)
                const ok = T.call("TavernLife", "armWrestle", Object.assign({ stake: 0, rival: rv }, api.armOpts || {}, { onEnd: res => d6Bout(q, res) }));
                if (!ok) stop();
            }
        },
        // ---- W4 (compact, 2026-10-06): the castellan's key - after the debt; it opens the order's grate in the cellar (Underground.js)
        startW4: () => { const St = ST(); try { const s = St && St.active && St.active() ? St.state() : null; return !!s && !!s.done; } catch (e) { return false; } },
        w4Borgar: {
            borgarTopic: q => (q.lines || {}).askTopic,
            borgarList(q, r, st, spk) {
                const out = [];
                linesTo(out, spk, (q.lines || {}).ask);
                return script(out, [q.id, "fx", "w4Borgar"]);
            },
            ready: (q, r, st, key) => (key === "borgar" ? true : null),
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w4Borgar") return;
                vgive("klucz_borgar", 1);
                T.popup(vname("klucz_borgar"), { icon: vicon("klucz_borgar"), kind: "good" });
                completeStep(q, { reward: { xp: 40, note: (q.lines || {}).noteAsk } });
            }
        },
        // the dig: an hour of hard work with the spade - the other half
        w4Dig: {
            hand() {
                if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(Math.min(23.5, hour() + 1));
                if ($gameSystem.changeStamina) $gameSystem.changeStamina(-10);
                T.audio.se("Earth2", { volume: 70, pitch: 110 });
                vgive("klucz_kopiec", 1);
                T.popup(vname("klucz_kopiec"), { icon: vicon("klucz_kopiec"), kind: "good" });
            }
        },
        w4Forge: { hand: (q, r) => { r.t.forgeDay = day() + 1; } },
        w4Key: {
            talk(q, r, st, key, spk) {
                if (key !== "kowal") return null;
                const L = q.lines || {};
                if (day() < (r.t.forgeDay || 0)) return { ready: false, list: linesTo([], spk, L.forgeWait) };
                const out = [];
                script(out, [q.id, "fx", "w4Key"]);
                return { ready: true, list: linesTo(out, spk, L.key) };
            },
            ready: (q, r, st, key) => key === "kowal" && day() >= (r.t.forgeDay || 0),
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w4Key") return;
                vgive("klucz_kasztelana", 1);
                T.popup(vname("klucz_kasztelana"), { icon: vicon("klucz_kasztelana"), kind: "good" });
                completeStep(q, { reward: { xp: 60, note: (q.lines || {}).noteKey } });
            }
        },
        // the grate: the key opens it (TownQuests.place 'grate'); opened some other way (F9, an event), the chapter is done all the same
        w4Gate: { check: () => !!T.call("Underground", "isOpen") },
        w4Open: {
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].check !== "w4Gate" || vcount("klucz_kasztelana") <= 0) return;
                T.call("Underground", "open");
                T.audio.se("Open5", { volume: 80, pitch: 80 });
                addNote((q.lines || {}).noteGate);
                completeStep(q, { reward: { xp: 100 } });
            }
        },
        w4Tell: {
            borgarTopic: q => (q.lines || {}).tellTopic,
            borgarList(q, r, st, spk) {
                const out = [];
                linesTo(out, spk, (q.lines || {}).tell);
                return script(out, [q.id, "fx", "w4Tell"]);
            },
            ready: (q, r, st, key) => (key === "borgar" ? true : null),
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w4Tell") return;
                setFlag("borgarSaying");
                completeStep(q, { reward: { xp: 150, opinion: 2, note: (q.lines || {}).noteTell } });
            }
        },
        // ---- W3: the seventh ballad
        startW3: () => { const st = T.call("TavernLife", "stats"); return !!st && (st.heard || []).length >= 6 && isDone("K22"); },
        w3Dream: {
            talk(q, r, st, key, spk) {
                if (key !== "melia") return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.dream);
                if (!hasVerse("struna")) { linesTo(out, spk, L.dreamVerse); sing(out, spk, "struna"); }
                script(out, [q.id, "fx", "w3Dream"]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => key === "melia",
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w3Dream") return;
                gainVerse("struna", true);
                completeStep(q, { reward: { xp: 40 } });
                w3Vars(q, rec(q.id));
                FX.w3Verse.maybeDone(q);
            }
        },
        w3Verse: {
            // who can give a verse now (key: the one spoken to)
            source(q, r, key) {
                const h = hour(), f = S().flags;
                if (key === "dzwonnik" && !hasVerse("dzwon") && isDone("D16") && inHours(h, [6.3, 18.3])) return "dzwon";
                if (key === "ludmila" && !hasVerse("kolysanka") && (isDone("K27") || isDone("D10")) && inHours(h, [17, 20.5])) return "kolysanka";
                if (key === "ozzy" && !hasVerse("belkot") && r.t.mead === nightOf() && inHours(h, [1.75, 2.6])) return "belkot";
                if (key === "lord" && !hasVerse("kronika") && halfPaid()) return "kronika";
                if ((key === "feliks" || key === "kamerdyner") && !hasVerse("kronika") && count(137) > 0 && !f.w3MeadFeliks) return "kronikaMead";
                return null;
            },
            talk(q, r, st, key, spk) {
                const v = FX.w3Verse.source(q, r, key), L = q.lines || {}, out = [];
                if (!v) {
                    if ((key === "feliks" || key === "kamerdyner") && !hasVerse("kronika") && !r.t.feliksAsked && inHours(hour(), [7, 10.5])) {
                        r.t.feliksAsked = day();
                        return { ready: false, list: linesTo(out, spk, L.feliksAsk) };
                    }
                    return null;
                }
                if (v === "dzwon") { linesTo(out, spk, L.ambrozy); sing(out, spk, "dzwon"); }
                else if (v === "kolysanka") { linesTo(out, spk, L.ludmila); sing(out, spk, "kolysanka"); linesTo(out, spk, L.ludmilaAfter); }
                else if (v === "belkot") {
                    if (!T.call("TavernLife", "rentedRoom")) return { ready: true, list: linesTo(out, HERO, [L.meadNoRoom]) };
                    linesTo(out, spk, L.ozzySleep); sing(out, spk, "belkot"); linesTo(out, spk, L.ozzyAfter);
                } else if (v === "kronika") { linesTo(out, spk, L.lordAsk); sing(out, spk, "kronika"); linesTo(out, spk, L.lordAfter); }
                else if (v === "kronikaMead") {
                    linesTo(out, spk, L.feliksAsk);
                    const yes = [];
                    linesTo(yes, spk, L.feliksGive);
                    sing(yes, HERO, "kronika");
                    script(yes, [q.id, "fx", "w3Verse", "kronikaMead"]);
                    return { ready: true, list: choiceTo(out, ["Dam ci dzban miodu pitnego.", "Nie teraz."], [yes, []], 1) };
                }
                script(out, [q.id, "fx", "w3Verse", v]);
                return { ready: true, list: out };
            },
            ready: (q, r, st, key) => !!FX.w3Verse.source(q, r, key) && (key !== "ozzy" || !!T.call("TavernLife", "rentedRoom")),
            // Ozzy's mead: a topic in his talk in the evening (he sings in his sleep at two that night)
            topic: (q, r, st, key) => (key === "ozzy" && !hasVerse("belkot") && count(137) > 0 && r.t.mead !== nightOf() && inHours(hour(), [17, 23]) ? "Daj mu dzban miodu pitnego." : null),
            topicList(q, r, st, key, spk) {
                const out = [];
                linesTo(out, spk, (q.lines || {}).meadGive);
                return script(out, [q.id, "fx", "w3Verse", "mead"]);
            },
            act(q, what) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w3Verse") return;
                if (what === "mead") { if (count(137) > 0) { $gameParty.loseItem(item(137), 1); r.t.mead = nightOf(); } return; }
                if (what === "kronikaMead") { if (count(137) <= 0) return; $gameParty.loseItem(item(137), 1); setFlag("w3MeadFeliks"); what = "kronika"; }
                gainVerse(what);
            },
            maybeDone(q) {
                const r = rec(q.id);
                if (r && r.s === "active" && q.steps[r.step].talk === "w3Verse" && q.verses.every(v => hasVerse(v.key))) completeStep(q, { reward: { xp: 100, trust: { melia: 10 } } });
            }
        },
        w3Origin: {
            talk(q, r, st, key, spk) {
                if (key !== "melia" || !inHours(hour(), [0, 4.5])) return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.origin);
                const opts = [[L.optGentle, "gentle", L.gentle], [L.optJoke, "joke", L.joke], [L.optQuiet, "quiet", L.quiet]];
                return { ready: true, list: choiceTo(out, opts.map(o => o[0]), opts.map(([, how, say]) => { const b = []; linesTo(b, spk, say); script(b, [q.id, "fx", "w3Origin", how]); return b; }), -1) };
            },
            ready: (q, r, st, key) => key === "melia" && inHours(hour(), [0, 4.5]),
            act(q, how) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w3Origin") return;
                S().flags.w3Told = how;
                completeStep(q, { reward: { xp: 60, trust: { melia: how === "quiet" ? 2 : 5 } } });
            }
        },
        w3Final: {
            talk(q, r, st, key, spk) {
                if (key !== "melia") return null;
                const L = q.lines || {}, out = [], k = nextKupala();
                linesTo(out, spk, L.finalAsk);
                const opts = [[L.optKupala, "kupala", L.sayKupala], [L.optBorgar, "borgar", L.sayBorgar], [L.optBurn, "burn", L.sayBurn], [L.optLater, "", L.sayLater]];
                return { ready: true, list: choiceTo(out, opts.map(o => o[0]),
                    opts.map(([, how, say]) => { const b = []; linesTo(b, spk, say, { kupala: k }); if (how) script(b, [q.id, "fx", "w3Final", how]); return b; }), 3) };
            },
            ready: (q, r, st, key) => key === "melia",
            act(q, how) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w3Final") return;
                if (how === "kupala") {
                    r.t.kupala = nextKupala();
                    r.t.v = Object.assign({}, r.t.v, { kupala: r.t.kupala });
                    completeStep(q, { to: q.steps.findIndex(s => s.spotFx === "w3Kupala") });
                } else if (how === "borgar") completeStep(q, { to: q.steps.findIndex(s => s.talk === "w3Borgar") });
                else if (how === "burn") {
                    for (const f of ["w3Burned", "w3Shortcut"]) setFlag(f);
                    finish(q, { xp: 150, note: L.noteBurn, trust: { melia: -5 } }, { replace: true });
                }
            }
        },
        w3Kupala: {
            on: r => day() === r.t.kupala && inHours(hour(), [20, 23.5]),
            wanted: (q, r, st, key) => key === "w3_kupala" && FX.w3Kupala.on(r),
            spot(q, r, st, s, spk) {
                const L = q.lines || {}, out = [];
                if (!FX.w3Kupala.on(r)) return out;
                linesTo(out, spk, L.kupala);
                for (const v of q.verses) sing(out, spk, v.key);
                linesTo(out, spk, L.kupalaEnd);
                return script(out, [q.id, "fx", "w3Kupala"]);
            },
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].spotFx !== "w3Kupala") return;
                for (const f of ["w3Sung", "w3Shortcut", "w3Attack", "w5Faster", "w8Faster"]) setFlag(f);
                completeStep(q);   // (the kidnap: w3Defend)
            },
            tick(q, r) {
                if (!r.t.kupala || day() < r.t.kupala || (day() === r.t.kupala && hour() < 23.5)) return;
                think((q.lines || {}).kupalaMissed);
                r.step = q.steps.findIndex(s => s.talk === "w3Final");
                enterStep(q);
                T.popup(q.title, { top: true, color: "#ffe27a", sub: stepLine(q) });
            }
        },
        // the kidnap after the song: a real fight with Humans.js (combat stage 3) - without it, as told: Grum drives them off
        w3Defend: {
            TAG: "w3Kupala",
            enter(q, r) { r.t.defend = null; },
            tick(q, r) {
                const L = q.lines || {}, Hm = T.api("Humans");
                if (!r.t.defend) {
                    if (!Hm || typeof Hm.ambush !== "function" || !onTown()) { think(L.kupalaAfter); FX.w3Defend.end(q, "told"); return; }
                    const band = Hm.ambush(["bandit", "bandit"], { tag: FX.w3Defend.TAG, far: [3, 6], say: L.attackShout, gold: 4 });
                    if (!band) { think(L.kupalaAfter); FX.w3Defend.end(q, "told"); return; }
                    r.t.defend = day();
                    think(L.attack);
                    const m = spotEv("w3_kupala");
                    if (m) T.call("SpeechBubbles", "say", m, L.meliaHelp, 160);
                    return;
                }
                if (!onTown()) { think(L.defendAway); FX.w3Defend.end(q, "away"); }   // (he walked off: Grum saved her)
            },
            end(q, how) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].tick !== "w3Defend") return;
                if (how === "won") think(L.defendWon);
                if (how === "lost") think(L.defendLost);
                const rw = { opinion: 10, note: L.noteKupala, trust: how === "won" ? { melia: 15, grum: 10 } : { melia: 10, grum: 10 } };
                if (how === "won") { rw.opinion += 3; setFlag("w3Defended"); }
                finish(q, rw);
            }
        },
        w3Borgar: {
            talk(q, r, st, key, spk) {
                if (key !== "melia" || !inHours(hour(), [23, 1])) return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.borgar);
                for (const v of q.verses) sing(out, spk, v.key);
                linesTo(out, spk, L.borgarEnd);
                return { ready: true, list: script(out, [q.id, "fx", "w3Borgar"]) };
            },
            ready: (q, r, st, key) => key === "melia" && inHours(hour(), [23, 1]),
            act(q) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w3Borgar") return;
                for (const f of ["w3Borgar", "w3Shortcut", "w4Faster"]) setFlag(f);
                finish(q, { note: L.noteBorgar, trust: { melia: 10 } });
            }
        },
        // ---- W8 rozdz. 1: Grum asks about the mountains (after a win over him at arm-wrestling and at dice)
        startW8: () => {
            const tl = T.call("TavernLife", "stats"), td = T.call("TavernDice", "stats");
            return !!tl && !!td && (tl.arm || {}).won >= 1 && ((td.vs || {}).grum || {}).wins >= 1;
        },
        w8Ask: {
            talk(q, r, st, key, spk) {
                if (key !== "grum") return null;
                const L = q.lines || {}, s = S(), out = [];
                linesTo(out, spk, L.ask);
                const opts = [];
                if (s.clues.lord_stones) opts.push([L.optStones, "stones"]);
                if (s.clues.w6_heart) opts.push([L.optHeart, "heart"]);
                if (s.flags.signalBook || s.flags.chroniclesTaken || s.flags.chroniclesLeft || s.flags.chroniclesForAmbrozy) opts.push([L.optArchive, "archive"]);
                opts.push([L.optNothing, "nothing"], [L.optWhy, "why"]);
                const branches = opts.map(([, k]) => {
                    const b = [];
                    linesTo(b, spk, L[k]);
                    if (k !== "why") linesTo(b, spk, [L.why[1]]);
                    linesTo(b, spk, L.end);
                    return script(b, [q.id, "fx", "w8Ask", k]);
                });
                return { ready: true, list: choiceTo(out, opts.map(o => o[0]), branches, -1) };
            },
            ready: (q, r, st, key) => key === "grum",
            act(q, k) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w8Ask") return;
                setFlag("w8Told_" + k);
                completeStep(q, { reward: { xp: 80, trust: { grum: 10 }, note: (q.lines || {}).note } });
            }
        },
        // ---- W8 rozdz. 2-6 (2026-10-06): the mountains (Map013), the diggers' cave (Map014), the Silent's valley (Map120) - on the maps
        // agent's markers. Grum goes along as a picture at each place (no followers).
        w8Vars: {
            vars(q, r) {
                const L = q.lines || {}, f = S().flags, chron = w8Chronicles();
                return { trip: r.t.trip || day() + 1, letter: r.t.letter || day(), osada: r.t.gate ? L.osadaOpen : "",
                    marek: f.marekSaved ? "jest" : "jeszcze nie", kroniki: chron ? "są" : "nie ma", honor: f.w8Honour ? "wygrane" : "jeszcze nie" };
            }
        },
        // rozdz. 2: Grum hires the hero - tomorrow at dawn (after midnight: this dawn)
        w8Hire: {
            talk(q, r, st, key, spk) {
                if (key !== "grum") return null;
                const L = q.lines || {}, out = [];
                linesTo(out, spk, L.hireAsk);
                const opts = [[L.optHire, "go", L.hireYes], [L.optHireLater, "", L.hireNo]];
                return { ready: true, list: choiceTo(out, opts.map(o => o[0]), opts.map(([, how, say]) => { const b = []; linesTo(b, spk, say); if (how) script(b, [q.id, "fx", "w8Hire", how]); return b; }), 1) };
            },
            ready: (q, r, st, key) => key === "grum",
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w8Hire") return;
                r.t.trip = hour() < 4 ? day() : day() + 1;
                completeStep(q);
            }
        },
        // ...at dawn by the way into the mountains (Map013 "grum_przewodnik_start", 4:30-9): food for the day, water in the skin, herbs
        w8Trip: {
            on: r => day() === r.t.trip && inHours(hour(), [4.5, 9]),
            wanted: (q, r, st, key) => key === "w8_start" && FX.w8Trip.on(r),
            spot(q, r, st, s, spk) {
                const L = q.lines || {}, out = [];
                if (!FX.w8Trip.on(r)) return out;
                linesTo(out, spk, L.start);
                if (w8Pack().length) { linesTo(out, spk, L.startMissing); return script(out, [q.id, "fx", "w8Trip", "missing"]); }
                linesTo(out, spk, L.startOk);
                return script(out, [q.id, "fx", "w8Trip", "go"]);
            },
            act(q, how) {
                const r = rec(q.id);
                if (how === "missing") { popupMissing(w8Pack()); return; }
                if (!r || r.s !== "active" || q.steps[r.step].spotFx !== "w8Trip" || !FX.w8Trip.on(r)) return;
                completeStep(q, { reward: { xp: 40 } });
            },
            tick(q, r) { if (day() > r.t.trip || (day() === r.t.trip && hour() >= 9)) w8Back(q, (q.lines || {}).tripMissed); }
        },
        // ...to the Order's old quarry (Map013 "kamieniolom_znak") the same day - Grum pays 50 G; the night falls first: start again
        w8Quarry: {
            wanted: (q, r, st, key) => key === "w8_quarry" && day() === r.t.trip,
            spot(q, r, st, s, spk) {
                const out = [];
                if (day() !== r.t.trip) return out;
                linesTo(out, spk, (q.lines || {}).quarry);
                return script(out, [q.id, "fx", "w8Quarry"]);
            },
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].spotFx !== "w8Quarry") return;
                addClue("w8_raven");
                completeStep(q, { reward: { gold: 50, xp: 150, trust: { grum: 10 }, note: (q.lines || {}).noteQuarry } });
            },
            tick(q, r) { if (day() > r.t.trip) w8Back(q, (q.lines || {}).quarryLost); }
        },
        // rozdz. 3: the diggers' camp in the cave (Map014) - Marek in his niche, Grum beside him (his picture by the "marek" marker)
        w8Camp: {
            wanted: (q, r, st, key) => key === "w8_cave",
            spot(q, r, st, s, spk) { const out = []; linesTo(out, spk, (q.lines || {}).camp); return script(out, [q.id, "fx", "w8Camp"]); },
            act(q) {
                const r = rec(q.id);
                if (!r || r.s !== "active" || q.steps[r.step].spotFx !== "w8Camp") return;
                setFlag("w8Marek");
                completeStep(q, { reward: { xp: 100, trust: { grum: 5 }, note: (q.lines || {}).noteCamp } });
            }
        },
        // rozdz. 4: the order comes through Baltazar two days later - Grum drunk (a topic in his menu: a jug of mead or two beers), the
        // thin wall of the guest rooms (Map025, a room rented tonight, 22-24), or the copy in the commander's crate (Map014, at night, sneaking)
        w8Letter: {
            topic: (q, r, st, key) => (key === "grum" && day() >= (r.t.letter || 0) && inHours(hour(), [17, 24]) ? (q.lines || {}).letterTopic : null),
            topicList(q, r, st, key, spk) {
                const L = q.lines || {}, out = [];
                if (!w8Drink()) return linesTo(out, spk, L.letterNoDrink);
                linesTo(out, spk, L.letterDrunk);
                return script(out, [q.id, "fx", "w8Letter", "drunk"]);
            },
            ready: (q, r, st, key) => (key === "grum" ? day() >= (r.t.letter || 0) && inHours(hour(), [17, 24]) : null),
            act(q, how) {
                if (how === "drunk") { const d = w8Drink(); if (!d) return; $gameParty.loseItem(item(d[0]), d[1]); }
                w8LetterDone(q, how);
            }
        },
        w8Wall: {
            enter(q, r) { r.t.letter = day() + 2; r.t.wallT = 0; },
            tick(q, r) {
                if (!window.$gameMap || $gameMap.mapId() !== ROOMS || day() < (r.t.letter || 0) || !inHours(hour(), [22, 24]) || $gameMap.isEventRunning()) return;
                if (!T.call("TavernLife", "rentedRoom")) return;
                r.t.wallT = (r.t.wallT || 0) + 10;
                if (r.t.wallT < 300) return;   // (five seconds of listening)
                think((q.lines || {}).wall);
                w8LetterDone(q, "wall");
            }
        },
        w8Crate: {
            wanted: (q, r, st, key) => key === "w8_crate" && day() >= (r.t.letter || 0),
            spot(q, r, st, s) {
                const L = q.lines || {}, out = [];
                if (!isNight(hour())) { T.popup(L.crateDay, { color: "#ffe9a8" }); return out; }
                if (!T.call("Hunting", "sneaking")) { T.popup(L.crateLoud, { color: "#ffe9a8" }); return out; }
                linesTo(out, HERO, L.crate);
                return script(out, [q.id, "fx", "w8Letter", "crate"]);
            }
        },
        // rozdz. 5: the Silent's valley (Act II: the debt paid) - the gate opens from inside (switch 16), Grum at their circle (Map120)
        w8Osada: {
            wanted: (q, r, st, key) => (key === "w8_gate" ? actTwo() && !r.t.gate : key === "w8_osada" ? !!r.t.gate : false),
            spot(q, r, st, s, spk) {
                const L = q.lines || {}, out = [];
                if (s.key === "w8_gate") { linesTo(out, spk, L.gate); return script(out, [q.id, "fx", "w8Osada", "gate"]); }
                linesTo(out, spk, L.osada);
                return script(out, [q.id, "fx", "w8Osada", "osada"]);
            },
            act(q, how) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].spotFx !== "w8Osada") return;
                if (how === "gate") {
                    if (r.t.gate) return;
                    r.t.gate = day();
                    $gameSwitches.setValue(SW_OSADA, true);
                    T.audio.se("Open5", { volume: 70, pitch: 70 });
                    T.popup(q.title, { top: true, color: "#ffe27a", sub: stepLine(q) });
                } else if (how === "osada" && r.t.gate) completeStep(q, { reward: { xp: 150, trust: { grum: 5 }, note: L.noteOsada } });
            }
        },
        // rozdz. 6: Grum's choice - two of three (Marek saved - W6, the Order's chronicles - W2, the arm-wrestling "na honor" - only in
        // the tavern) and he is the hero's; else the fight at the tunnel's mouth, or the work for his paymasters
        w8Choice: {
            count: () => { const f = S().flags; return (f.marekSaved ? 1 : 0) + (w8Chronicles() ? 1 : 0) + (f.w8Honour ? 1 : 0); },
            topic: (q, r, st, key) => (key === "grum" ? (q.lines || {}).choiceTopic : null),
            topicList(q, r, st, key, spk) {
                const L = q.lines || {}, out = [], f = S().flags;
                linesTo(out, spk, L.choiceAsk);
                if (FX.w8Choice.count() < 2) linesTo(out, spk, L.need);
                const opts = [];
                if (!f.w8Honour && r.t.honourDay !== day()) opts.push([L.optHonour, "honour", L.honourGo]);
                if (FX.w8Choice.count() >= 2) opts.push([L.optAlly, "ally", L.ally]);
                opts.push([L.optFaction, "faction", L.faction], [L.optFight, "fight", L.fight], [L.optLater, "", L.choiceLater]);
                return choiceTo(out, opts.map(o => o[0]), opts.map(([, how, say]) => { const b = []; linesTo(b, spk, say); if (how) script(b, [q.id, "fx", "w8Choice", how]); return b; }), opts.length - 1);
            },
            ready: (q, r, st, key) => (key === "grum" ? true : null),
            act(q, how, interp, stop) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].talk !== "w8Choice") return;
                if (how === "honour") {
                    if (S().flags.w8Honour || r.t.honourDay === day()) return;
                    const st = T.call("TavernLife", "stats") || {}, lv = clamp(((st.arm || {}).level || 0) + 1, 4, 6);   // (his best and then some: 4-6)
                    const rv = { key: "grum", name: "Grum", sub: "Żelazna Pięść - na honor", bust: null, level: lv, kicker: "NA HONOR · BEZ STAWKI" };
                    const ok = T.call("TavernLife", "armWrestle", Object.assign({ stake: 0, rival: rv }, api.armOpts || {}, { onEnd: res => w8Honour(q, res) }));
                    if (!ok) stop();
                } else if (how === "ally" && FX.w8Choice.count() >= 2) {
                    $gameSwitches.setValue(SW_TUNNEL, true);
                    finish(q, { xp: 300, trust: { grum: 20 }, flag: "grumAlly", note: L.noteAlly });
                } else if (how === "faction") {
                    $gameSwitches.setValue(SW_TUNNEL, true);
                    finish(q, { gold: 100, xp: 150, flag: "w8Faction", note: L.noteFaction });
                } else if (how === "fight") completeStep(q);
            }
        },
        // ...the fight at the tunnel's mouth in the cave (Map014 "tunel_wejscie"): Grum as Humans.js's mercenary. Beaten: he may kneel -
        // spared / robbed / fled = he leaves on the ferry, killed = he is dead (both gone from the tavern); the tunnel stays shut.
        // Beating the hero: robbed (Humans.js's rule), the diggers break through (switch 15). Away from the cave: he waits again.
        w8Duel: {
            TAG: "w8Grum",
            tick(q, r) {
                if (!window.$gameMap) return;
                const self = FX.w8Duel, Hm = T.api("Humans"), L = q.lines || {};
                if (r.t.duel) {
                    if (Hm && Hm.robbery) return;
                    if ($gameMap.mapId() !== CAVE || !(Hm && Hm.band && Hm.band(self.TAG))) { r.t.duel = null; think(L.duelAway); }
                    return;
                }
                if ($gameMap.mapId() !== CAVE || $gameMap.isEventRunning() || $gamePlayer.isTransferring()) return;
                const m = markerAt("tunel_wejscie") || { x: 8, y: 13 };
                if (Math.hypot($gamePlayer.x - m.x, $gamePlayer.y - m.y) > 7) return;
                if (!Hm || typeof Hm.spawn !== "function") { think(L.duelWon); self.end(q, "won", { spared: 1 }, true); return; }
                if (Hm.robbery) return;
                const opts = { tag: self.TAG, name: "Grum", engaged: true, level: 6, gold: 30, say: L.duelShout };
                const g = ($gamePlayer.x !== m.x || $gamePlayer.y !== m.y) && $gameMap.isPassable(m.x, m.y, 2) ? Hm.spawn("mercenary", m.x, m.y, opts) : Hm.spawnNear("mercenary", 3, 6, opts);
                if (g) r.t.duel = day();
            },
            end(q, how, e, told) {
                const r = rec(q.id), L = q.lines || {};
                if (!r || r.s !== "active" || q.steps[r.step].tick !== "w8Duel" || (!r.t.duel && !told)) return;
                r.t.duel = null;
                if (how === "won") {
                    const dead = !!e && (e.killed || 0) > 0;
                    setFlag(dead ? "grumDead" : "grumGone");
                    if (!told) think(dead ? L.duelKilled : L.duelWon);
                    finish(q, { xp: 250, flag: "w8Duel", note: dead ? L.noteDuelKilled : L.noteDuelWon });
                } else {
                    $gameSwitches.setValue(SW_TUNNEL, true);
                    think(L.duelLost);
                    finish(q, { xp: 80, flag: "w8Lost", note: L.noteDuelLost });
                }
            }
        },
        // ---- W9 rozdz. 6 (2026-10-06): the truths of the Truth Layer told or kept. A resident asks it before his own talk (once a day),
        // the tavern's regulars have it as a topic in their menu, Borgar at the bar, the Lord and grandpa before their story talk
        startW9: () => w9Known().length > 0,
        w9Truth: {
            talk(q, r, st, key, spk) {
                if (isRegular(key) || key === "borgar") return null;   // (their own menus: a topic)
                const x = w9Pending(r, key);
                if (!x || (r.t.asked || {})[x.who] === day()) return null;
                return { ready: true, list: w9List(q, r, x, spk) };
            },
            ready: (q, r, st, key) => { const x = w9Pending(r, key); return !!x && (isRegular(key) || key === "borgar" || (r.t.asked || {})[x.who] !== day()); },
            topic: (q, r, st, key) => (isRegular(key) && w9Pending(r, key) ? (q.lines || {}).topic : null),
            topicList(q, r, st, key, spk) { const x = w9Pending(r, key); return x ? w9List(q, r, x, spk) : []; },
            borgarTopic: (q, r) => (w9Pending(r, "borgar") ? (q.lines || {}).borgarTopic : null),
            borgarList(q, r, st, spk) { const x = w9Pending(r, "borgar"); return x ? w9List(q, r, x, spk) : []; },
            vars: (q, r) => w9Vars(r),
            act(q, arg) {
                const r = rec(q.id), [how, who] = String(arg || "").split(":"), t = q.truths[who];
                if (!r || r.s !== "active" || !t) return;
                const res = r.t.res || (r.t.res = {}), asked = r.t.asked || (r.t.asked = {});
                if (how === "ask") { asked[who] = day(); return; }
                if ((how !== "tell" && how !== "keep") || res[who]) return;
                res[who] = how;
                setFlag((how === "tell" ? "truthTold_" : "truthKept_") + who);
                const parts = applyReward(q, how === "tell" ? t.told : t.kept, false), U = window.Underground_Data;
                const nm = (U && U.TRUTH_WHO && U.TRUTH_WHO[who]) || who;
                T.popup((how === "tell" ? "Prawda powiedziana: " : "Prawda przemilczana: ") + nm, { top: true, color: how === "tell" ? "#9ff0a8" : "#bcd8ff", sub: parts.join("  ·  ") || stepLine(q) });
                T.emit("townTruth", { who, how });
                refreshMarkers();
            }
        }
    };
    // W1 rozdz. 7: four and two rung by the hero - six strikes (the count matters; the pause after four is his to keep)
    function ringW1(q, res) {
        const L = q.lines || {}, say = lines => think(lines, "dzwonnik");
        if (!res || res.aborted || (!res.strikes && !res.none)) { say(L.bellQuit); return; }
        if (!res.right) { say(L.bellWrong); return; }
        FX.w1Bell.open(q, true);
    }
    // W1's first step of rozdz. 7 (Act II) - where the choices of rozdz. 6 lead
    function w1Ch7(q) { return q.steps.findIndex(s => s.ch === 7); }
    // ---- W8 (2026-10-06): the mountains. The maps agent's switches: 15 "Gory_TunelKopaczy" (the diggers' tunnel to floor 50), 16
    // "Osada_Milczacych" (the Silent's gate); the guest rooms over the tavern (Map025) for the thin wall
    const ROOMS = 25, CAVE = 14, SW_TUNNEL = 15, SW_OSADA = 16;
    // Act II: the debt paid (Story's chapter 1 done) - or no story game at all
    function actTwo() {
        const St = ST();
        try { return !(St && St.active && St.active()) || !!(St.state() || {}).done; } catch (e) { return true; }
    }
    // a marker "Miejsce: <name>" on this map
    function markerAt(name) {
        const e = window.$dataMap ? ($dataMap.events || []).find(x => x && String(x.name || "").trim() === "Miejsce: " + name) : null;
        return e ? { x: e.x, y: e.y } : null;
    }
    // what the hero lacks for a day in the mountains: food for the day (2 portions of anything to eat), water in the skin, herbs
    // or a bandage (rows for popupMissing)
    function w8Pack() {
        const food = $gameParty.items().filter(it => /<Food:/.test(it.note || "")).reduce((n, it) => n + $gameParty.numItems(it), 0);
        const skin = waterParts().skin, herbs = count(149) + count(150) + count(152), out = [];
        if (food < 2) out.push({ kind: "item", name: "Jedzenie na cały dzień", icon: iconOfItem(83), have: food, n: 2 });
        if (skin < 1) out.push({ kind: "item", name: "Woda w bukłaku", icon: iconOfItem(129), have: skin, n: 1 });
        if (herbs < 1) out.push({ kind: "item", name: "Zioła albo opatrunek", icon: iconOfItem(150), have: 0, n: 1 });
        return out;
    }
    // what the hero can stand Grum: a jug of mead (137) or two beers (81) - [id, n] or null
    const w8Drink = () => (count(137) >= 1 ? [137, 1] : count(81) >= 2 ? [81, 2] : null);
    // the Order's chronicles (W2): kept by the hero, or given to Ambroży (he can show them) - not left behind, not sold
    const w8Chronicles = () => { const f = S().flags; return vcount("kroniki") > 0 || !!f.ambrozyChronicles || (!!f.chroniclesForAmbrozy && !f.w5ChroniclesSold); };
    // back to Grum's hire (the dawn missed, Grum lost in the mountains)
    function w8Back(q, lines) {
        const r = rec(q.id);
        think(lines);
        r.t.trip = 0;
        r.step = q.steps.findIndex(s => s.talk === "w8Hire");
        enterStep(q);
        T.popup(q.title, { top: true, color: "#ffe27a", sub: stepLine(q) });
    }
    function w8LetterDone(q, how) {
        const r = rec(q.id);
        if (!r || r.s !== "active" || q.steps[r.step].talk !== "w8Letter") return;
        setFlag("w8Letter_" + how);
        completeStep(q, { reward: { xp: 100, note: (q.lines || {}).noteLetter } });
    }
    // the arm-wrestling "na honor" (TavernLife's mini-game against Grum, no stake; only in the tavern - the author's rule)
    function w8Honour(q, res) {
        const r = rec(q.id), L = q.lines || {};
        if (!r || r.s !== "active" || q.steps[r.step].talk !== "w8Choice" || !res || res.aborted) return;
        if (res.won) {
            setFlag("w8Honour");
            think(L.honourWon);
            T.call("TavernLife", "addTrust", "grum", 10, q.title);
        } else { r.t.honourDay = day(); think(L.honourLost); }
        refreshMarkers();
    }
    // ---- W9 rozdz. 6 (2026-10-06): the truths of the Truth Layer (Underground.truths(): { floor: { who, floor } }) about the people up
    // top - Q.W9.truths has the ones that can be told (not the hero's own, not the guardian's). One person at a time.
    function w9Known() {
        const U = T.api("Underground"), q = Q.W9;
        let t = {};
        try { t = U && U.truths ? U.truths() || {} : {}; } catch (e) { t = {}; }
        return Object.keys(t).map(k => ({ key: k, who: t[k] && t[k].who })).filter(x => q && q.truths[x.who]);
    }
    const w9Speaker = who => (Q.W9.truths[who] || {}).talk || who;
    const w9Away = who => !!T.call("TownLife", "gone", w9Speaker(who));   // (Feliks after W1 a/b; Kuba fled for a week)
    // the truth `key` (a speaker: a resident, a regular, "borgar", "lord", "grandpa") still waits to be told or kept
    function w9Pending(r, key) {
        if (!r || !Q.W9) return null;
        const res = r.t.res || {};
        return w9Known().find(x => w9Speaker(x.who) === key && !res[x.who]) || null;
    }
    function w9Vars(r) {
        const q = Q.W9, L = q.lines || {}, res = (r && r.t.res) || {}, U = window.Underground_Data, names = (U && U.TRUTH_WHO) || {}, open = [];
        const known = w9Known();
        let told = 0, kept = 0;
        for (const x of known) {
            if (res[x.who] === "tell") told++;
            else if (res[x.who] === "keep") kept++;
            else open.push((q.truths[x.who].openAs || names[x.who] || x.who) + (w9Away(x.who) ? L.gone : ""));
        }
        return { known: known.length, told, kept, open: open.length ? open.join(", ") : L.none };
    }
    // the talk: the kartka remembered, then tell / keep silent / not now (asked once a day)
    function w9List(q, r, x, spk) {
        const L = q.lines || {}, t = q.truths[x.who], U = window.Underground_Data, n = U && U.NOTES ? U.NOTES[x.key] : null, out = [];
        script(out, [q.id, "fx", "w9Truth", "ask:" + x.who]);
        linesTo(out, HERO, [fill(L.remember, { truth: n ? String(n.text).split("\n")[0] : t.name })]);
        const tellLines = [].concat(t.tell || []);
        for (const [f, lines] of t.tellIf || []) if (S().flags[f]) tellLines.push(...lines);
        const tell = [], keep = [];
        linesTo(tell, spk, tellLines);
        script(tell, [q.id, "fx", "w9Truth", "tell:" + x.who]);
        linesTo(keep, spk, t.keep);
        script(keep, [q.id, "fx", "w9Truth", "keep:" + x.who]);
        return choiceTo(out, [L.optTell, L.optKeep, L.optLater], [tell, keep, []], 2);
    }
    // W2 rozdz. 5: the bell rung - seven (the count matters, not the rhythm)
    function ringW2(q, res) {
        const r = rec(q.id), L = q.lines || {}, say = lines => think(lines, "dzwonnik");
        if (!r || r.s !== "active" || q.steps[r.step].talk !== "w2Ring") return;
        if (!res || res.aborted || (!res.strikes && !res.none)) { say(L.ringQuit); return; }
        if (!res.right) { r.t.wrong = day(); say(L.ringWrong); return; }
        mute(11.5, 12.45);   // (the usual noon bell keeps quiet today)
        r.t.rang = day();
        hearSignal("pytanie");
        say(L.ringOk);
        completeStep(q);
    }
    // K39: back from the dice - with Czujność 10 the hero saw the swap
    function k39After(q, res) {
        const r = rec(q.id), L = q.lines || {};
        if (!r || r.s !== "active" || q.steps[r.step].talk !== "k39Play" || !res || !(res.played > 0)) return;
        if ((Number(T.call("Combat", "attr", "per")) || 0) >= 10) { think(L.spotted); completeStep(q); }
        else { r.t.games = (r.t.games || 0) + 1; think(L.notSpotted); }
    }
    // the manor's back gate (Map024 "Tylna furtka", self switch A): open while Feliks lets Kuba's cart in (W1 rozdz. 5)
    function syncGate() {
        if (!window.$gameMap || $gameMap.mapId() !== MANOR || !window.$dataMap) return;
        const e = ($dataMap.events || []).find(x => x && /^Tylna furtka/.test(x.name || ""));
        if (!e) return;
        const r = rec("W1"), st = r && r.s === "active" ? Q.W1.steps[r.step] : null, want = !!st && st.tick === "w1Orangery" && FX.w1Orangery.gateNight();
        const k = [MANOR, e.id, "A"], s = S();
        if (want && !$gameSelfSwitches.value(k)) { $gameSelfSwitches.setValue(k, true); s.gateOpened = true; }
        else if (!want && s.gateOpened) { $gameSelfSwitches.setValue(k, false); s.gateOpened = false; }   // (only shut what this opened)
    }
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
        updatePeek();
        if (pendingOut && Graphics.frameCount >= pendingOut.at) {   // (W1 rozdz. 5: caught in the manor's garden)
            const o = pendingOut;
            pendingOut = null;
            if ($gameMap.mapId() === MANOR && !$gamePlayer.isTransferring()) $gamePlayer.reserveTransfer(o.map, o.x, o.y, o.dir, 0);
        }
        if (n % 10) return;
        for (const q of activeQuests()) {
            const r = rec(q.id), st = q.steps[r.step];
            if (st && st.tick && FX[st.tick] && FX[st.tick].tick) { try { FX[st.tick].tick(q, r, st); } catch (e) { report("tick " + q.id, e); } }
        }
        if (n % 30 === 0) { syncSpots(); refreshMarkers(); hidesWatch(); marketLife(); tollBark(); syncGate(); }
        if (n % 60 === 0) { checkDeadlines(); autoChecks(); if (onTown()) rainSignal(); }
        if (n % 120 === 0) spawnFor();
    }, { owner: PLUGIN, name: "quests" });
    T.on("hourChange", onHour, { owner: PLUGIN });
    T.on("dayStart", () => checkDeadlines(), { owner: PLUGIN });
    T.on("wake", () => checkDeadlines(), { owner: PLUGIN });
    T.on("mapReady", () => { if (!has()) return; syncSpots(); refreshMarkers(); spawnFor(); syncGate(); }, { owner: PLUGIN });
    T.on("mapLeave", () => { bellQueue.length = 0; pendingOut = null; }, { owner: PLUGIN });
    // (2026-10-06: thoughtAt too - a save brings back its own Graphics.frameCount, an old later mark held the hero's thoughts back)
    T.on("newGame", () => { bellQueue.length = 0; thoughts.length = 0; thoughtAt = 0; pendingOut = null; }, { owner: PLUGIN });
    T.on("load", () => { bellQueue.length = 0; thoughts.length = 0; thoughtAt = 0; pendingOut = null; }, { owner: PLUGIN });

    // (2026-10-06) W3's kidnap at the Kupała bonfire (Humans.js): the band beaten - or the hero beaten and robbed
    T.on("humansDone", e => { if (has() && e && e.tag === FX.w3Defend.TAG) FX.w3Defend.end(Q.W3, "won"); }, { owner: PLUGIN });
    T.on("heroRobbed", e => { if (has() && e && e.tag === FX.w3Defend.TAG) FX.w3Defend.end(Q.W3, "lost"); }, { owner: PLUGIN });
    // (2026-10-06) W1 rozdz. 6 c: Feliks's men on Polna droga - beaten (a spared one talks) or the hero beaten and robbed (the drawing too)
    T.on("humansDone", e => { if (has() && e && e.tag === FX.w1Ambush.TAG) FX.w1Ambush.end(Q.W1, "won", e); }, { owner: PLUGIN });
    T.on("heroRobbed", e => { if (has() && e && e.tag === FX.w1Ambush.TAG) FX.w1Ambush.end(Q.W1, "lost", e); }, { owner: PLUGIN });
    // (2026-10-06) W8 rozdz. 6: the fight with Grum at the tunnel's mouth
    T.on("humansDone", e => { if (has() && e && e.tag === FX.w8Duel.TAG) FX.w8Duel.end(Q.W8, "won", e); }, { owner: PLUGIN });
    T.on("heroRobbed", e => { if (has() && e && e.tag === FX.w8Duel.TAG) FX.w8Duel.end(Q.W8, "lost", e); }, { owner: PLUGIN });
    // (2026-10-06) W1 rozdz. 7: the main sluice of the cistern found (Underground.js, floor 30: every look at it sends this)
    T.on("undergroundSluice", () => {
        if (!has()) return;
        const s = S(), first = !s.flags.sluiceFound, r = rec("W1");
        if (first) setFlag("sluiceFound");
        if (first && r && r.s === "active" && Q.W1.steps[r.step].check === "w1Sluice") think((Q.W1.lines || {}).sluiceSeen);
        autoChecks();
    }, { owner: PLUGIN });
    // (2026-10-06) W9 rozdz. 6: a truth of the Truth Layer read - the arc starts (or counts it), a thought: tell it up there, or not
    T.on("undergroundTruth", e => {
        if (!has() || !e) return;
        autoChecks();
        const q = Q.W9, t = q && q.truths[e.who];
        if (t && t.name) think(fill((q.lines || {}).found, { name: t.name }));
    }, { owner: PLUGIN });
    // (2026-10-06) D6's training: an arm-wrestling game with Grum (TavernLife's bus) on a day before the tournament
    T.on("tavernGame", e => {
        if (!has() || !e || e.game !== "arm" || (e.rival && e.rival !== "grum")) return;
        const r = rec("D6");
        if (!r || r.s !== "active" || r.step !== 0) return;
        const t = r.t.train || (r.t.train = []);
        if (!t.includes(day()) && (!r.t.market || day() < r.t.market)) t.push(day());
        autoChecks();
    }, { owner: PLUGIN });
    // the boots of D1: their effect through the skills' perks (Combat.perk is asked by every system)
    const CB = T.api("Combat");
    if (CB && typeof CB.perk === "function" && !CB.perk._townQuests) {
        const orig = CB.perk;
        const wrapped = function(key) { const base = orig.apply(this, arguments); const p = has() ? S().perks[key] : 0; return p ? base + p : base; };
        wrapped._townQuests = true;
        CB.perk = wrapped;
    }
    // (2026-10-06) D6's belt: the quests' "carry" perk adds to the load the bag takes (Survival asks Combat.carryBonus)
    if (CB && typeof CB.carryBonus === "function" && !CB.carryBonus._townQuests) {
        const origCarry = CB.carryBonus;
        const wrappedCarry = function() { return origCarry.apply(this, arguments) + (has() ? S().perks.carry || 0 : 0); };
        wrappedCarry._townQuests = true;
        CB.carryBonus = wrappedCarry;
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
    // Kuba's night trips for water (TownLife_Data: his plan's entry "w1Water") end once the sluice is half open (W1 rozdz. 6 a/b)
    if (L0 && L0.addCondition) L0.addCondition("w1Water", () => !(has() && S().flags.sluiceHalf));

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
        const regs = T.call("TavernLife", "regularsInfo");
        if (regs && regs.length) out.push({ label: "Stali bywalcy tawerny", icon: 0, mark: "locked", right: regs.map(x => x.name.split(" ")[0] + " " + x.trust).join(" · "), info: "regulars" });
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
            ops.push({ k: "gap", n: 8 }, { k: "h", text: q.kind === "W" ? "Rozdział " + (st.ch || r.step + 1) : "Teraz" }, { k: "p", text: fill(st.text, vars) });
            for (const row of needRows(st)) ops.push({ k: "cost", icon: row.icon, name: row.name, have: Math.min(row.have, row.n), need: row.n, note: "" });
            const dl = deadlineText(r, st);
            if (dl) ops.push({ k: "muted", text: dl });
            if (r.step > 0) {
                ops.push({ k: "gap", n: 6 }, { k: "h", text: "Zrobione" });
                for (let i = 0; i < r.step; i++) {
                    if (r.t.done && r.t.done[i] === undefined && Object.keys(r.t.done).length) continue;   // (a step skipped by a choice)
                    ops.push({ k: "muted", text: "✓ " + fill(q.steps[i].text, vars).split(/(?<=[.!?])\s/)[0] });
                }
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
        const s = S(), known = !!s.flags.gardenKey || !!s.flags.signalBook;
        const ops = [{ k: "title", text: "Sygnały dzwonu" }, { k: "sub", text: "Co dzwon mówi i kiedy" }, { k: "rule" },
            { k: "p", text: "Ambroży dzwoni nie tylko o pełnych godzinach. Zapisuję, ile razy i co się wtedy działo." }];
        const book = !!s.flags.signalBook;   // (W2 rozdz. 6: the Book of Signals read - every signal known)
        if (book) ops.push({ k: "muted", text: "Z Księgi sygnałów w Archiwum zakonu znam już wszystkie." });
        for (const [sig, sg] of Object.entries(D.SIGNALS)) {
            const heard = s.bells.filter(b => b.sig === sig);
            if (!heard.length && book) { ops.push({ k: "p", text: sg.name + " (" + sg.pattern.join(" + ") + ") - jeszcze nie słyszany." }, { k: "muted", text: sg.when + " Znaczy: " + sg.meaning + "." }); continue; }
            if (!heard.length) { ops.push({ k: "muted", text: "? ? ?" }); continue; }
            const last = heard[heard.length - 1];
            ops.push({ k: "p", text: sg.name + " (" + sg.pattern.join(" + ") + ") - ostatnio dz. " + last.day + ", " + hm(last.hour) + "." });
            ops.push({ k: "muted", text: sg.when + (known ? " Znaczy: " + sg.meaning + "." : "") });
        }
        return ops;
    }
    // (2026-10-06) the tavern's regulars: how far each trusts the hero, what trust opens next
    function regularsOps() {
        const regs = T.call("TavernLife", "regularsInfo") || [];
        const ops = [{ k: "title", text: "Stali bywalcy tawerny" }, { k: "sub", text: "Melia, Dziadek Ozzy i Grum - zaufanie 0–100" }, { k: "rule" },
            { k: "p", text: "Zaufanie rośnie od rozmów (pierwsza w danym dniu), piwa dla Ozzy'ego, pieśni Melii, gier z Grumem i Ozzym - do pewnej granicy. Resztę dają zadania. Z zaufaniem otwierają się głębsze tematy." }];
        for (const x of regs) {
            ops.push({ k: "gap", n: 6 }, { k: "h", text: x.name + " (" + x.title + ")" }, { k: "p", text: "Zaufanie " + x.trust + "/100 · " + x.tierName + (x.next ? " · następny próg: " + x.next : "") });
            if (x.text) ops.push({ k: "muted", text: x.text });
            if (x.opens) ops.push({ k: "muted", text: x.opens });
        }
        return ops;
    }
    function journalOps(it) {
        if (!it || it.empty) return [{ k: "title", text: "Miasteczko" }, { k: "rule" }, { k: "p", text: "Tu zobaczysz sprawy ludzi z miasteczka wokół tawerny: kto prosi, o co, do kiedy i za ile." }];
        if (it.info === "opinion") return opinionOps();
        if (it.info === "calendar") return calendarOps();
        if (it.info === "bells") return bellsOps();
        if (it.info === "regulars") return regularsOps();
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
        bellOpts: null, vcount, FX,
        // (2026-10-05) the market well's ration grows once the sluice is half open (Farming_Plots.rationOf asks it), the dice's options
        // for the tests (K39: { auto, turbo, seed, rules }), the places' events, what a resident would remark now
        wellBonus: mapId => (has() && mapId === TOWN && S().flags.sluiceHalf ? D.WELL_BONUS || 0 : 0),
        diceOpts: null, spotEv, slabId, remarkFor: key => (has() ? remarkFor(key) : null), nightOf,
        // (2026-10-06) the tavern's regulars (TavernLife_Regulars asks these), the places that answer (the gate, the plinths), the
        // regulars' quest topics, the verses of W3, the cap of K33, D6's bouts (armOpts: the tests' bot settings for the arm-wrestling)
        regularTalk, regularTopics, regularTopicList, place: placeTalk, hasVerse, gainVerse, verseOf, nextKupala, knockCap, shotAtCap,
        capState: () => ({ step: capStep(), falling: !!capFall, statue: window.$gameMap ? capStatueId() : 0, gateOpen: gateOpen() }), CAP, d6Bout, hourWords,
        d13Pred: () => { const r = rec("D13"); return r ? d13Pred(r) : FX.d13Offer.pred(day()); }, armOpts: null,
        borgarTopics, borgarTalk, armTable,
        // (2026-10-06) W8: Grum gone from the tavern for good (beaten at the tunnel: on the ferry - or dead); TavernLife / TavernDice ask
        grumAway: () => { if (!has()) return false; const f = S().flags; return !!(f.grumGone || f.grumDead); }, actTwo, markerAt
    };
    window.TownQuests = T.register(PLUGIN, api);
})();
