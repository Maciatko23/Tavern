//=============================================================================
// Kantor.js
//=============================================================================
// The engine of the arc W5 "Towary z kontynentu" (docs/QUESTY.md W5; the data: Kantor_Data.js). Baltazar Vey smuggles for the Black
// Eyes (Straż Pewności): the requisitioned grain out, the raven stones out, maps and men in. The chapters:
//   1 "Dziwny kupiec" - two clues of K15/K16/D11/D10/D6, the bell's "three and one", the night guests (Kłos, Feliks, Grum)
//   2 "Trzy stuknięcia" - after midnight a hooded courier ($Npc_Kurier) walks in through the south gate, knocks three times at the
//     kantor's back door (Map008, the user's event 94), Ambroży rings "three and one" (TownQuests' W2 signal); the hero watches it
//     unseen (the courier has eyes: Hunting's awareness). Then the smugglers' camp on Skraj lasu (Map023): a fire, a cart, Baltazar's
//     men (Humans.js, sitting by the fire) and the courier - the hero listens unseen, or is seen and fights (beaten: robbed)
//   3 "Nocny tragarz" - Baltazar hires him (trust: K15 clean, D6 sold, D11 bribe...; else "the curious ones close by"); two night
//     shifts 22-2: through the back door (opened for him), the back room of Map103, the trapdoor (5,9) to the cellar Map171; three
//     crates a night from the pile to the stack by the back door; what he sees grows each night (the court's grain, raven stones)
//   4 "Rejestr" - the third night: at half past midnight Baltazar goes up for twenty minutes; Sławek watches the store room; the
//     register on the desk: take it / copy it (a quarter of an hour) / leave it; caught - thrown out, no pay, again the next night.
//     The strongbox holds card 1 of the Order's chronicles when they were sold to Baltazar (D23 - Pustelnia.giveCard)
//   5 "Komu to dać" - Wit (his trust: he confesses, the kantor is shut, Wit stands with the hero / no trust: the register burnt, a
//     night in the guardhouse), the reeve (the town meeting next day: the kantor shut, Opinia +12, Baltazar off on the ferry), Baltazar
//     himself (the double game: 30 G a week / blackmail: 50 G, an enemy - double prices, a night raid)
//   6 "Noc promu" - the next ferry night a cart on Polna droga (Map022) with the raven stones (and Rafał, when the court took him in
//     W6): the guards notice him - an ambush springs (Humans.js); won: the cargo his; unseen: the crates swapped for plain stones; the
//     double game: he lets it go (30 G) or swaps them quietly
//   7 "Co dalej z Kantorem" (Act II) - shut: the reeve asks who runs it - Ludmiła's camp or the town hall (an honest counter, 10%
//     cheaper); Baltazar back at the harbour with mercenaries. The double game: iron and steel at half price, but the faction knows
//     his every step underground. The enemy: double prices.
// Events: Tawerna.inject ids 730-759 (owner "Kantor"). No map file of the user is changed: the back door and the front door of the
// kantor (Map008) answer through Game_Event.list while W5 needs it, the trapdoor of Map103 is an injected event on the user's tile.
// API: window.Kantor (Tawerna.api("Kantor")).

/*:
 * @target MZ
 * @plugindesc [W5] Wątek „Towary z kontynentu”: trzy stuknięcia, obóz przemytników, nocny tragarz, rejestr Baltazara, noc promu, kantor w Akcie II. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Kantor_Data
 * @orderAfter Kantor_Data
 * @orderAfter TownQuests
 * @orderAfter Humans
 * @orderAfter Cysterna
 *
 * @help
 * ============================================================================
 * Kantor.js - wątek W5 „Towary z kontynentu” (Baltazar Vey)
 * ============================================================================
 * Rozdziały: 1 poszlaki, 2 trzy stuknięcia po północy przy tylnych drzwiach
 * kantoru i obóz przemytników na Skraju lasu, 3 nocny tragarz (piwnica
 * kantoru - mapa 171), 4 rejestr z biurka Baltazara, 5 komu go dać (kapral
 * Wit / sołtys / podwójna gra / szantaż), 6 noc promu na Polnej drodze
 * (zasadzka, podmiana skrzyń), 7 co dalej z kantorem w Akcie II.
 * Skradanie: C. Pobity przez ludzi Baltazara bohater zostaje obrabowany.
 * Zdarzenia 730-759 (rejestr TawernaCore: "Kantor"). F9, zakładka
 * „Wyspa i fabuła”: „W5: przeskocz do rozdziału N”.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    const D = window.KantorData;
    if (!T) throw new Error("Kantor.js: brak TawernaCore.js");
    if (!D) { console.warn("Kantor.js: brak Kantor_Data.js - wątek W5 wyłączony"); return; }
    const PLUGIN = "Kantor";
    const M = D.MAP, EV = D.EV, P = D.PLACES, TM = D.TIME, TX = D.TX, ART = D.ART;
    const COIN_ICON = 314;
    const HERO = { id: 0, name: "" };
    const OPTS = { talkGap: 215, slawekFace: 0 };   // (tests: the frames between two lines of the talk by the camp's fire; Sławek's facing held)
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const HU = () => T.api("Hunting") || window.Hunting || null;
    const HM = () => T.api("Humans") || window.Humans || null;
    const SB = () => T.api("SpeechBubbles") || window.SpeechBubbles || null;
    const RA = () => window.RoamingActor || null;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const nightOf = () => (hour() < 12 ? day() - 1 : day());   // (a night counts from the evening before)
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const onMap = id => !!(window.$gameMap && $gameMap.mapId() === id);
    const report = (where, e) => console.error("[Kantor] " + where + ":", e);
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const K = () => TX.kod;   // (the words of this file: js/teksty/kantor.txt, kod.*)

    // ------------------------------------------------------------------
    // The state (the save)
    // ------------------------------------------------------------------
    const store = T.state.define("kantor", () => ({
        clues: {},                                                     // own clues: klos, goscie, dzwon
        knock: { seen: 0, night: -1, spooked: -1 }, guests: {},        // ch. 2: the knock seen (day), the guests witnessed
        camp: { heard: 0, fought: 0, beaten: -1, night: -1 },           // ch. 2: the camp
        hired: 0, mood: "", shifts: 0,                                  // ch. 3
        shift: { night: -1, n: 0, carrying: false, paid: false, seen: 0 },   // tonight's shift: crates placed, carrying one, paid
        reg: { night: -1, state: "", back: 0, caught: 0, done: 0, took: "", card: 0 },   // ch. 4
        outcome: "", komu: "", zebranie: 0,                             // ch. 5: closed | double | enemy ; wit | witBurn | soltys | double | blackmail
        ferry: { day: 0, state: "", ambush: 0, rafal: "" },             // ch. 6
        honest: "", weekPaid: 0, raid: { day: 0, done: 0 }, back: 0, backRaid: 0
    }), { version: 1, owner: PLUGIN });
    const S = () => store();

    // TownQuests' flags, things, records
    const qstate = () => { const q = TQ(); return q && q.state ? q.state() : null; };
    const flags = () => { const s = qstate(); return s ? s.flags : {}; };
    const flag = k => !!flags()[k];
    function setFlag(k) { const f = flags(); if (f && k && !f[k]) f[k] = day(); }
    const vcount = k => { const s = qstate(); return s && s.v ? s.v[k] || 0 : 0; };
    const vgive = (k, n) => { const s = qstate(); if (s && s.v) s.v[k] = (s.v[k] || 0) + (n || 1); };
    const vtake = (k, n) => { const s = qstate(); if (!s || !s.v) return; s.v[k] = Math.max(0, (s.v[k] || 0) - (n || 1)); if (!s.v[k]) delete s.v[k]; };
    const rec = id => { const q = TQ(); return q && q.rec ? q.rec(id) : null; };
    const isActive = id => { const r = rec(id); return !!r && r.s === "active"; };
    const isDone = id => { const r = rec(id); return !!r && (r.s === "done" || (r.times || 0) > 0); };
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const notePair = p => note(p[0], p[1]);
    const opinion = (n, why) => { const q = TQ(); return q && q.addOpinion ? q.addOpinion(n, why) : 0; };
    const xp = (n, why) => T.call("Combat", "gainXp", n, why || "W5", true);
    const autoChecks = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const actTwo = () => { const q = TQ(); try { return !!(q && q.actTwo && q.actTwo()); } catch (e) { return false; } };
    const gone = key => !!T.call("TownLife", "gone", key);
    // the W5 record and its step's name (the step's check / talk)
    const W5 = () => (TQ() && TQ().Q ? TQ().Q.W5 : null);
    const w5 = () => rec("W5");
    const STEP_NAMES = D.W5.steps.map(s => s.check || s.talk);
    const stepIdx = name => STEP_NAMES.indexOf(name);
    function cur() { const r = w5(); return r && r.s === "active" ? STEP_NAMES[r.step] || "" : ""; }
    const at = name => cur() === name;
    const pastStep = name => { const r = w5(); return !!r && (r.s === "done" || (r.s === "active" && r.step > stepIdx(name))); };
    function complete(opts) { const q = TQ(); if (q && q.completeStep && isActive("W5")) q.completeStep("W5", opts); }

    // ------------------------------------------------------------------
    // Talk helpers (event commands; "> " the hero, "@key: " a resident nearby)
    // ------------------------------------------------------------------
    const LINE = 46, PAGE = 3;
    function wrap(text) {
        const out = [];
        let line = "";
        for (const w of String(text).split(/\s+/)) {
            if (!w) continue;
            if (line && (line + " " + w).length > LINE) { out.push(line); line = w; } else line = line ? line + " " + w : w;
        }
        if (line) out.push(line);
        return out;
    }
    function sayTo(out, spk, text, ind) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""], ind));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l], ind)));
        }
        return out;
    }
    function speaker(key) {
        const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null, r = L && L.RESIDENTS ? L.RESIDENTS.find(x => x.key === key) : null;
        return { id: ev && $gameMap.event(ev.eventId()) === ev ? ev.eventId() : -1, name: r ? r.name : key };
    }
    function linesTo(out, spk, arr, vars, ind) {
        for (const raw of [].concat(arr || [])) {
            if (!raw) continue;
            const s = fill(raw, vars);
            if (s.startsWith("> ")) { sayTo(out, HERO, s.slice(2), ind); continue; }
            const m = /^@(\w+):\s*([\s\S]*)$/.exec(s);
            if (m) sayTo(out, speaker(m[1]), m[2], ind);
            else sayTo(out, spk, s, ind);
        }
        return out;
    }
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
    const act = (out, args, ind) => (out.push(C(355, ["Kantor.act(this, " + JSON.stringify(args) + ")"], ind)), out);
    // bubbles one after another outside a talk (over the hero "> ...", or over a character)
    const thoughts = [];
    let thoughtAt = 0;
    function think(lines, who) {
        for (const l of [].concat(lines || [])) if (l) thoughts.push({ who: /^> /.test(l) ? null : who || null, text: String(l).replace(/^> /, "") });
    }
    function updateThoughts() {
        if (!thoughts.length || Graphics.frameCount < thoughtAt || !(SceneManager._scene instanceof Scene_Map)) return;
        const t = thoughts.shift(), sb = SB(), who = t.who && (t.who === $gamePlayer || $gameMap.event(t.who.eventId ? t.who.eventId() : -1) === t.who) ? t.who : $gamePlayer;
        if (sb && sb.say) sb.say(who, t.text, 210); else T.popup(t.text, { color: "#eceef0" });
        thoughtAt = Graphics.frameCount + 220;
    }
    const say = (ch, text, frames) => { const sb = SB(); if (sb && sb.say && ch) sb.say(ch, text, frames || 200); };
    const sneaking = () => !!T.call("Hunting", "sneaking");
    // the clock moved on to an hour (past midnight: the next day) - as a wait does
    function advanceTo(h) {
        const now = hour(), dh = ((h - now) % 24 + 24) % 24;
        if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(dh); else $gameSystem.setDayNightHour(h);
    }

    // ------------------------------------------------------------------
    // Chapter 1: the clues
    // ------------------------------------------------------------------
    function bellHeard(sig) { const s = qstate(); return !!(s && (s.bells || []).some(b => b.sig === sig)); }
    function clueList() {
        const f = flags(), s = qstate() || {}, c = s.clues || {}, own = S().clues, out = [];
        if (f.k15Opened || f.k15Clean || f.k15Wit || isDone("K15")) out.push("skrzynia");
        if (isDone("K16") || c.w8_stores) out.push("zapasy");
        if (f.d11Told || f.d11Bribe || isDone("D11") || (rec("D11") && rec("D11").s === "active" && rec("D11").step >= 2)) out.push("kosz");
        if (c.w6_seal || vcount("lek") > 0) out.push("lek");
        if (f.d6Bribe) out.push("walka");
        if (bellHeard("3+1") || own.dzwon) out.push("dzwon");
        if (f.w5ChroniclesSold) out.push("kroniki");
        if (f.rafalSmuggled) out.push("rafal");
        if (f.wrakKamienieBaltazar) out.push("kamienie");
        if (f.krukBaltazarWie) out.push("listy");
        if (own.klos || own.goscie) out.push("goscie");
        return out;
    }
    // trust: Baltazar knows the hero keeps his mouth shut (or took his money)
    function trust() {
        const f = flags();
        return !!(f.k15Clean || f.balthazarTrust || f.d6Sold || f.d11Bribe || f.rafalSmuggled || f.w5ChroniclesSold || f.wrakKamienieBaltazar || f.krukBaltazarWie);
    }
    // Wit trusts the hero: his debt (D5), or the crate and the brazier both told to him, or a well-liked man in town
    function witTrusts() {
        const f = flags(), q = TQ(), op = q && q.opinion ? q.opinion() : 0;
        return !!(f.witOwes || (f.k15Wit && f.d11Told) || op >= 60);
    }

    // ------------------------------------------------------------------
    // The events (Tawerna.inject 730-759): built for each map; shown / hidden at runtime by the state
    // ------------------------------------------------------------------
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function eventData(id, name, x, y, o) {
        o = o || {};
        const img = o.img || ["", 0, 2, 1];
        const page = { conditions: Object.assign({}, BLANK), directionFix: !!o.fix, image: { tileId: o.tileId || 0, characterName: img[0], direction: img[2], pattern: img[3], characterIndex: img[1] },
            list: [C(355, ["Kantor.act(this);"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false },
            moveSpeed: o.speed || 3, moveType: 0, priorityType: o.priority === undefined ? 1 : o.priority, stepAnime: !!o.step, through: !!o.through, trigger: 0, walkAnime: o.walk !== false };
        return { id, name: "W5: " + name, note: "<Kantor:" + (o.key || name) + ">" + (o.note || ""), pages: [page], x, y };
    }
    const FIRE_LIGHT = "<Light:190,255,150,70><LightFlicker:0.18,255,110,40><LightHeight:20>";
    function build(data, mapId) {
        const out = [];
        if (mapId === M.kantor) {
            out.push(eventData(EV.klapa, K().nazwy.klapa, P.klapa[0], P.klapa[1], { key: "klapa", walk: false, fix: true }));
            out.push(eventData(EV.stos, K().nazwy.stos, P.stos[0], P.stos[1], { key: "stos", img: ART.stos1, fix: true, walk: false }));
            out.push(eventData(EV.lada, D.TX.lada, P.lada[0], P.lada[1], { key: "lada", walk: false, fix: true }));
        } else if (mapId === M.town) {
            out.push(eventData(EV.kurier, K().nazwy.kurier, P.gateIn[0], P.gateIn[1], { key: "kurier", img: ART.kurier, speed: 4, through: true, priority: 0 }));
            out.push(eventData(EV.gosc, K().nazwy.gosc, P.east[0], P.east[1], { key: "gosc", img: ART.feliks, speed: 3, through: true, priority: 0 }));
        } else if (mapId === M.piwnica) {
            const spot = name => { const e = (data.events || []).find(v => v && v.name === "Miejsce: " + name); return e ? [e.x, e.y] : null; };
            const pl = (name, def) => spot(name) || def;
            out.push(eventData(EV.baltazar, K().nazwy.baltazar, P.baltazar[0], P.baltazar[1], { key: "baltazar", img: ART.baltazar, speed: 4 }));
            const sl = pl("w5_slawek", P.slawek);
            out.push(eventData(EV.slawek, K().nazwy.slawek, sl[0], sl[1], { key: "slawek", img: [ART.slawek[0], 0, 8, 1] }));
            const st = pl("w5_sterta", P.sterta), wk = pl("w5_worki", P.worki), km = pl("w5_kamienie", P.kamienie), sz = pl("w5_szkatula", P.szkatula), si = pl("w5_siedzisko", P.siedzisko);
            out.push(eventData(EV.sterta, K().nazwy.sterta, st[0], st[1], { key: "sterta", img: ART.sterta, fix: true, walk: false, note: "<Occupy:left=1>" }));
            out.push(eventData(EV.worki, K().nazwy.worki, wk[0], wk[1], { key: "worki", img: ART.worki, fix: true, walk: false }));
            out.push(eventData(EV.kamienie, K().nazwy.kamienie, km[0], km[1], { key: "kamienie", img: ART.kamienie, fix: true, walk: false }));
            out.push(eventData(EV.mapy, K().nazwy.mapy, 13, 5, { key: "mapy", img: ART.mapy, fix: true, walk: false }));
            out.push(eventData(EV.biurko, K().nazwy.biurko, P.biurko[0], P.biurko[1], { key: "biurko", tileId: 598, fix: true, walk: false }));
            out.push(eventData(EV.szkatula, K().nazwy.szkatula, sz[0], sz[1], { key: "szkatula", img: ART.szkatula, fix: true, walk: false }));
            out.push(eventData(EV.siedzisko, K().nazwy.siedzisko, si[0], si[1], { key: "siedzisko", img: ART.skrzynia, fix: true, walk: false }));
        } else if (mapId === M.skraj) {
            const lit = campWanted();
            out.push(eventData(EV.ogien, K().nazwy.ogien, P.ognisko[0], P.ognisko[1], { key: "ogien", img: ["!Decoration", 2, 4, 0], step: true, fix: true, walk: false, note: lit ? FIRE_LIGHT : "" }));
            out.push(eventData(EV.wozOboz, K().nazwy.wozOboz, P.wozOboz[0], P.wozOboz[1], { key: "wozOboz", img: ART.woz, fix: true, walk: false, note: "<Occupy:right=1>" }));
            out.push(eventData(EV.skrzynieOboz, K().nazwy.skrzynie, P.skrzynieOboz[0], P.skrzynieOboz[1], { key: "skrzynieOboz", img: ART.stos2, fix: true, walk: false }));
            out.push(eventData(EV.kurierOboz, K().nazwy.kurier, P.kurierOboz[0], P.kurierOboz[1], { key: "kurierOboz", img: [ART.kurier[0], 0, P.kurierOboz[2], 1] }));
        } else if (mapId === M.droga) {
            // (the men by the cart keep a small fire - every light a flame; its light only when the map comes up on the ferry night)
            out.push(eventData(EV.ogienProm, K().nazwy.ogienProm, P.ogienProm[0], P.ogienProm[1], { key: "ogienProm", img: ["!Decoration", 2, 4, 0], step: true, fix: true, walk: false, note: has() && at("w5Prom") && ferryNow() ? FIRE_LIGHT : "" }));
            out.push(eventData(EV.wozProm, K().nazwy.wozProm, P.wozProm[0], P.wozProm[1], { key: "wozProm", img: ART.wozWorki, fix: true, walk: false, note: "<Occupy:right=1>" }));
            out.push(eventData(EV.skrzynieProm, K().nazwy.skrzynie, P.skrzynieProm[0], P.skrzynieProm[1], { key: "skrzynieProm", img: ART.stos3, fix: true, walk: false }));
            out.push(eventData(EV.rafal, K().nazwy.rafal, P.rafal[0], P.rafal[1], { key: "rafal", img: ART.rafal }));
            P.guards.forEach((g, i) => out.push(eventData(EV.straz1 + i, K().nazwy.straz, g[0], g[1], { key: "straz" + i, img: [ART.slawek[0], 0, 4, 1] })));
        }
        return out.filter(e => e.x < data.width && e.y < data.height);
    }
    T.inject([M.kantor, M.town, M.piwnica, M.skraj, M.droga], { ids: D.IDS, owner: PLUGIN, build });

    const evOf = id => (window.$gameMap ? $gameMap.event(id) : null);
    const keyOf = ev => { const m = ev && ev.event() && /<Kantor:(\w+)>/.exec(ev.event().note || ""); return m ? m[1] : ""; };
    function showEv(ev, img, dir) {
        if (!ev) return;
        remember(ev);
        if (ev._w5hidden !== false) { ev.setTransparent(false); ev.setThrough(!!ev._w5through); ev._priorityType = ev._w5prio === undefined ? 1 : ev._w5prio; ev._w5hidden = false; }
        if (img) {
            if (ev.characterName() !== img[0] || ev.characterIndex() !== img[1]) ev.setImage(img[0], img[1]);
            if (img[2] && ev._directionFix) ev._direction = img[2]; else if (dir) ev.setDirection(dir);
            if (img[3] !== undefined && ev._directionFix) { ev._pattern = img[3]; ev._originalPattern = img[3]; }
        }
    }
    function hideEv(ev) {
        if (!ev || ev._w5hidden === true) return;
        if (ev._w5prio === undefined) { ev._w5prio = ev._priorityType; ev._w5through = ev.isThrough(); }
        ev._w5hidden = true;
        ev.setTransparent(true); ev.setThrough(true); ev._priorityType = 0;
    }
    const hidden = ev => !ev || ev._w5hidden === true;
    function remember(ev) { if (ev && ev._w5prio === undefined) { ev._w5prio = ev._priorityType; ev._w5through = ev.isThrough(); } }

    // ------------------------------------------------------------------
    // A walker (the courier, a guest, Baltazar in the cellar): Hunting's path8 + RoamingActor's steps (as TownLife's residents)
    // ------------------------------------------------------------------
    function walkTo(ev, tx, ty) {
        if (!ev || ev.isMoving()) return ev && ev.x === tx && ev.y === ty;
        if (ev.x === tx && ev.y === ty) return true;
        const H = HU(), R = RA();
        const d = H && H.path8 ? H.path8(ev, tx, ty, { key: "w5" }).dir : ev.findDirectionTo(tx, ty);
        ev._w5stuck = ev._w5stuck || 0;
        if (d > 0 && (R ? R.canStep(ev, ev.x, ev.y, d) : ev.canPass(ev.x, ev.y, d))) { if (R) R.step(ev, d); else ev.moveStraight(d); ev._w5stuck = 0; return false; }
        if (++ev._w5stuck > 90) { ev.locate(tx, ty); ev._w5stuck = 0; return true; }   // (round some other way)
        return false;
    }
    // the event's sprite (for the awareness mark over its head)
    function spriteOf(ev) {
        const set = SceneManager._scene && SceneManager._scene._spriteset;
        return set && set._characterSprites ? set._characterSprites.find(s => s._character === ev) || null : null;
    }
    // a watcher's eyes: Hunting's awareness (cover, sneaking, the dark) - in front of him full, behind him a quarter
    function watch(ev, who, sight, sharp) {
        const H = HU();
        if (!H || !H.noticeRate) return 0;
        const v = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[ev.direction()] || [0, 1];
        const dx = $gamePlayer.x - ev.x, dy = $gamePlayer.y - ev.y, d = Math.max(0.01, Math.hypot(dx, dy));
        const front = (dx * v[0] + dy * v[1]) / d > 0.3;
        const r = H.noticeRate(ev.x + 0.5, ev.y + 0.5, sight + (sharp || 0)) * (front ? 1 : 0.25);
        who._aware = Math.max(0, Math.min(1, (who._aware || 0) + (r > 0 ? r : -0.004)));
        const sp = spriteOf(ev);
        if (sp && H.updateMark) H.updateMark(who, sp, -68, who._aware);
        return who._aware;
    }

    // a guard's eyes indoors (Sławek in the cellar - Hunting's step of the hero is not kept indoors): in front of him up to 5 tiles
    // (2 sneaking), beside or behind him 2.5 (1 sneaking); a meter 0..1 with the "?" / "!" over his head
    function guardSees(ev, who, sharp) {
        const H = HU(), sneak = sneaking();
        const v = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[ev.direction()] || [0, 1];
        const dx = $gamePlayer._realX - ev.x, dy = $gamePlayer._realY - ev.y, d = Math.hypot(dx, dy);
        const front = d < 0.5 || (dx * v[0] + dy * v[1]) / d > 0.3;
        const reach = (front ? (sneak ? 2 : 5) : (sneak ? 1 : 2.5)) + (sharp || 0);
        const covered = H && H.coverBetween && d > 1.5 && H.coverBetween($gamePlayer._realX + 0.5, $gamePlayer._realY + 0.5, ev.x + 0.5, ev.y + 0.5);
        const rate = d <= reach && !covered ? (front ? 0.05 : 0.03) * (sneak ? 0.5 : 1) : 0;
        who._aware = Math.max(0, Math.min(1, (who._aware || 0) + (rate > 0 ? rate : -0.004)));
        const sp = spriteOf(ev);
        if (sp && H && H.updateMark) H.updateMark(who, sp, -68, who._aware);
        return who._aware;
    }

    // ------------------------------------------------------------------
    // Chapter 2a: the night visitors of the back door (Map008)
    // ------------------------------------------------------------------
    // tonight's visitors: the courier every night from day 10; Feliks on the nights of day%7 == 3 (while he is in town); Grum once
    function visitorsTonight() {
        const n = nightOf(), out = [];
        if (n < 10 || S().outcome === "closed") return out;
        out.push({ who: "kurier", ev: EV.kurier, img: ART.kurier, from: P.gateIn, back: P.gateOut, spawn: TM.spawn, knock: 24 + TM.knock, out: 24 + TM.knock + TM.inside, gone: 24 + TM.leaveBy });
        if (n % 7 === 3 && !gone("feliks") && !flag("feliksArrested")) out.push({ who: "feliks", ev: EV.gosc, img: ART.feliks, from: P.east, back: P.east, spawn: 23.5, knock: 23.9, out: 24.05, gone: 24.6 });
        else if (n >= 14 && n % 7 === 5 && !S().guests.grum && !T.call("TownQuests", "grumAway")) out.push({ who: "grum", ev: EV.gosc, img: ART.grum, from: P.tavern, back: P.tavern, spawn: 23.3, knock: 23.7, out: 23.85, gone: 24.4 });
        return out;
    }
    const clock = () => { const h = hour(); return h < 12 ? h + 24 : h; };   // (the night's clock: 23.9 ... 25.2)
    const vis = {};   // event id -> { phase, night }
    function updateVisitors() {
        if (!onMap(M.town)) return;
        const list = visitorsTonight(), t = clock(), n = nightOf();
        for (const id of [EV.kurier, EV.gosc]) {
            const ev = evOf(id);
            if (!ev) continue;
            remember(ev);
            const v = list.find(x => x.ev === id);
            if (!v || t < v.spawn || t >= v.gone || (hour() >= 12 && hour() < 20)) { hideEv(ev); vis[id] = null; continue; }
            let st = vis[id];
            if (!st || st.night !== n || st.who !== v.who) {
                // (the hero came onto the map in the middle of it: where the visitor is now)
                st = vis[id] = { night: n, who: v.who, phase: t < v.knock ? "come" : t < v.out ? "inside" : "leave", aware: 0, knocked: t >= v.knock };
                if (st.phase === "come") ev.locate(v.from[0], v.from[1]); else ev.locate(P.backFront[0], P.backFront[1]);
                showEv(ev, v.img, 8);
                if (st.phase === "inside") hideEv(ev);
                if (v.who === "kurier" && S().knock.spooked === n) { st.phase = "away"; ev.locate(v.from[0], v.from[1]); }
            }
            step(ev, v, st, t);
        }
    }
    function step(ev, v, st, t) {
        if (st.phase === "come") {
            showEv(ev, v.img);
            const there = walkTo(ev, P.backFront[0], P.backFront[1]);
            // the courier keeps his eyes open: seen, he turns back (no knock tonight)
            if (v.who === "kurier" && !there && dist(ev, $gamePlayer) < 9 && watch(ev, st, 5.5) >= 1) {
                st.phase = "away"; S().knock.spooked = nightOf();
                say(ev, TX.kurierSploszony, 180);
                return;
            }
            if (there && t >= v.knock - 0.02) {
                ev.setDirection(8);
                st.phase = "knock"; st.at = Graphics.frameCount;
            } else if (there) ev.setDirection(8);
        } else if (st.phase === "knock") {
            if (Graphics.frameCount - st.at === 1) {
                T.audio.se("Knock", { volume: 80 });
                say(ev, TX.stukanie, 150);
            }
            if (Graphics.frameCount - st.at === 70) {
                T.audio.se("Door1", { volume: 70 });
                const door = backDoorEv();
                if (door) say(door, TX.drzwiOtwarte, 150);
                if (v.who === "kurier" && hour() < 12 && TQ() && TQ().ringPattern && (!S().knock.seen || nightOf() % 7 === 0)) {   // (after midnight: Ambroży rings "three and one" - till the hero has seen it, then once a week)
                    TQ().ringPattern([3, 1], 160);
                    if (TQ().hearSignal) TQ().hearSignal("3+1");
                    S().clues.dzwon = day();
                }
                witness(ev, v);
            }
            if (Graphics.frameCount - st.at >= 120) { st.phase = "inside"; hideEv(ev); }
        } else if (st.phase === "inside") {
            if (t >= v.out) { st.phase = "leave"; ev.locate(P.backFront[0], P.backFront[1]); showEv(ev, v.img, 2); if (v.who === "kurier") { say(ev, TX.kurierWychodzi, 150); witness(ev, v); } }
        } else if (st.phase === "leave" || st.phase === "away") {
            showEv(ev, v.img);
            if (walkTo(ev, v.back[0], v.back[1])) { st.phase = "gone"; hideEv(ev); }
        }
    }
    // seen: the hero near enough, the visitor on the screen, not spooked
    function witness(ev, v) {
        const sp = spriteOf(ev), onScreen = sp ? sp.visible && ev.screenX() > -24 && ev.screenX() < Graphics.width + 24 && ev.screenY() > 0 && ev.screenY() < Graphics.height + 48 : true;
        if (dist(ev, $gamePlayer) > 9 || !onScreen) return false;
        const s = S();
        if (v.who === "kurier") {
            if (s.knock.spooked === nightOf()) return false;
            if (!s.knock.seen) { s.knock.seen = day(); s.knock.night = nightOf(); notePair(TX.noteKnock); }
            s.clues.goscie = s.clues.goscie || day();
            autoChecks();
        } else if (!s.guests[v.who]) {
            s.guests[v.who] = day();
            s.clues.goscie = s.clues.goscie || day();
            notePair(v.who === "feliks" ? TX.noteFeliks : TX.noteGrum);
            say(ev, v.who === "feliks" ? TX.felixBark : TX.grumBark, 180);
            autoChecks();
        }
        return true;
    }
    function backDoorEv() {
        if (!onMap(M.town)) return null;
        return $gameMap.events().find(e => e && e.x === P.backDoor[0] && e.y === P.backDoor[1] && /<Town:door=kantor>/.test((e.event() && e.event().note) || "")) || null;
    }
    // Kłos at the back door on a ferry night (Garnizon.js's event 659): a clue when the hero is near
    function updateKlos() {
        if (!onMap(M.town) || S().clues.klos) return;
        const k = evOf(659);
        if (!k || !k.characterName() || k.isTransparent() || dist(k, $gamePlayer) > 6) return;
        S().clues.klos = day();
        notePair(TX.noteKlos);
        autoChecks();
    }

    // ------------------------------------------------------------------
    // Chapter 2b: the smugglers' camp on Skraj lasu (Map023)
    // ------------------------------------------------------------------
    const CAMP_TAG = "w5Oboz";
    const campWanted = () => has() && at("w5Oboz") && inHours(hour(), TM.camp) && S().camp.beaten !== nightOf();
    const campMen = () => { const H = HM(); return H ? H.humans().filter(h => h._tag === CAMP_TAG && !h._dead) : []; };
    const OCT = { 0: 6, 1: 3, 2: 2, 3: 1, 4: 4, "-4": 4, "-3": 7, "-2": 8, "-1": 9 };
    const octOf = (dx, dy) => OCT[Math.round(Math.atan2(dy, dx) / (Math.PI / 4))] || 2;
    let campTalk = null;   // the overheard talk running: { i, at }
    let campSpawnVisit = false, ferrySpawnVisit = false;   // (the men are put on the map once each time the hero comes onto it)
    function spawnCamp() {
        const H = HM();
        if (!H || !H.spawn) return;
        const band = H.makeBand([], { tag: CAMP_TAG });
        const kinds = ["bandit", "archer", "bandit", "knifer"];
        P.seats.forEach(([x, y, mode], i) => {
            const h = H.spawn(kinds[i] || "bandit", x, y, { band, mode, tag: CAMP_TAG, noBand: true });
            if (!h) return;
            h._seat = { x, y }; h._home = { x, y };
            h._seatF8 = mode === "sleep" ? (x < P.ognisko[0] ? 4 : 6) : octOf(P.ognisko[0] - x, P.ognisko[1] - y);
            h._faceAng = Math.atan2(P.ognisko[1] - y, P.ognisko[0] - x);
            h._chatT = rnd(200, 600); h._poseT = 999;
        });
        S().camp.night = nightOf();
    }
    function updateCamp() {
        if (!onMap(M.skraj)) return;
        const want = campWanted(), H = HM();
        // (no random band camps on this map while the smugglers sit here)
        if (want && H && H.state && H.nightKey) { const cs = H.state().camps; if (!cs[M.skraj] || !cs[M.skraj].none || cs[M.skraj].night !== H.nightKey()) cs[M.skraj] = { night: H.nightKey(), none: true }; }
        for (const id of [EV.ogien, EV.wozOboz, EV.skrzynieOboz, EV.kurierOboz]) {
            const ev = evOf(id);
            if (!ev) continue;
            remember(ev);
            if (want && !(id === EV.kurierOboz && S().camp.fled === nightOf())) showEv(ev); else hideEv(ev);
        }
        if (!want) { if (campMen().length && !campMen().some(h => h._engaged)) H.clear(CAMP_TAG); campTalk = null; return; }
        if (!campMen().length && !campSpawnVisit) { campSpawnVisit = true; spawnCamp(); }
        const men = campMen(), engaged = men.some(h => h._engaged);
        if (engaged) {   // (a fight: the courier runs off into the forest)
            const k = evOf(EV.kurierOboz);
            if (k && !hidden(k)) { say(k, K().kurierUcieka, 120); hideEv(k); S().camp.fled = nightOf(); }
            campTalk = null;
            return;
        }
        // the talk by the fire: heard from close enough while nobody has noticed him
        const d = Math.hypot($gamePlayer.x - P.ognisko[0], $gamePlayer.y - P.ognisko[1]);
        if (!campTalk && d <= P.listen && men.length) campTalk = { i: 0, at: Graphics.frameCount + 30 };
        if (campTalk && d > P.listen + 2) campTalk = null;   // (walked off: heard only a piece)
        if (campTalk && Graphics.frameCount >= campTalk.at) {
            const line = TX.obozRozmowa[campTalk.i];
            if (!line) { campTalk = null; campHeard(); return; }
            const who = line[0] === "kurier" ? evOf(EV.kurierOboz) : line[0] === "a" ? men[0] : men[2] || men[0];
            if (who) say(who, line[1], 200);
            campTalk.i++;
            campTalk.at = Graphics.frameCount + OPTS.talkGap;
        }
    }
    function campHeard() {
        if (!at("w5Oboz")) return;
        S().camp.heard = day();
        think(TX.obozHeard);
        notePair(TX.noteObozHeard);
        complete();
    }
    function campFought() {
        if (!at("w5Oboz")) return;
        S().camp.fought = day();
        vgive("list_przewozowy", 1);
        T.popup(K().list, { top: true, color: "#ffd23f", sub: K().listSub });
        notePair(TX.noteObozFight);
        complete();
    }

    // ------------------------------------------------------------------
    // Chapters 3-4: the night porter and the register (Map008 back door -> Map103 back room -> trapdoor -> Map171 cellar)
    // ------------------------------------------------------------------
    const working = () => has() && (at("w5Zmiany") || at("w5Rejestr")) && S().hired > 0;
    const shiftTime = () => inHours(hour(), [TM.shift[0], TM.shiftEnd]);
    const checkedIn = () => S().shift.night === nightOf() && shiftTime();
    const regNight = () => at("w5Rejestr");
    // the TownLife condition: Baltazar is in the cellar tonight (not behind the counter)
    function shiftOn() { return working() && shiftTime() && !(S().shift.night === nightOf() && S().shift.over); }
    // the kantor's doors on Map008 (the user's events 94 and 95, <Town:door=kantor>): what they do while W5 needs them
    const DOOR_STUB = [C(355, ["Kantor.door(this);"]), C(0, [])];
    // (2026-10-23) the core's one list hook (Tawerna.onEventList): a scene at a door - after Kasztelan's and Dwor's, before Homes' (as the
    // old wrappers by the plugin list)
    T.onEventList(ev => {
        if (ev._mapId === M.town && window.$gameMap && $gameMap.mapId() === M.town && has()) {
            const d = ev.event();
            if (d && /<Town:door=kantor>/.test(d.note || "")) {
                const back = ev.x === P.backDoor[0] && ev.y === P.backDoor[1];
                if (closedNow() || (back && working() && shiftTime())) return DOOR_STUB;
            }
        }
        return null;
    }, { owner: PLUGIN, priority: T.onEventList.PRIORITY.scene + 20 });
    const closedNow = () => S().outcome === "closed" && !S().honest;
    function door(interp) {
        const ev = interp && $gameMap.event(interp.eventId());
        if (!ev) return;
        if (closedNow()) { T.popup(TX.kantorZamkniety, { kind: "info" }); return; }
        const s = S();
        if (s.shift.night !== nightOf() && !inHours(hour(), TM.shift)) { T.popup(TX.tylneSpoznienie, { kind: "info" }); return; }
        if (s.shift.night !== nightOf()) {   // checking in tonight
            if (s.reg.caught && s.reg.lastCaught === nightOf()) { T.popup(TX.tylneZamkniete, { kind: "info" }); return; }
            s.shift = { night: nightOf(), n: 0, carrying: false, paid: false, seen: 0, over: false };
            if (regNight()) s.reg = Object.assign(s.reg, { night: nightOf(), state: "", back: 0, took: "" });
        }
        if (s.shift.over) { T.popup(TX.tylneZamkniete, { kind: "info" }); return; }
        T.audio.se("Door1", { volume: 80 });
        $gamePlayer.reserveTransfer(M.kantor, P.kantorBackLand[0], P.kantorBackLand[1], P.kantorBackLand[2], 0);
    }
    // the trapdoor in the back room (Map103)
    function klapa(ev) {
        if (!checkedIn() || S().shift.over) { T.popup(TX.klapaZamknieta, { kind: "info" }); return null; }
        const out = [];
        T.audio.se("Door2", { volume: 70, pitch: 80 });
        out.push(C(201, [0, M.piwnica, P.piwnicaLand[0], P.piwnicaLand[1], P.piwnicaLand[2], 0]));
        return out;
    }
    // the stack by the back door: the crate carried up is put down
    function stos(ev) {
        const s = S();
        if (!checkedIn()) { T.popup(TX.stosNic, { kind: "info" }); return null; }
        if (!s.shift.carrying) { T.popup(s.shift.n >= D.CRATES ? TX.stertaPusta : TX.stosNic, { kind: "info" }); return null; }
        s.shift.carrying = false;
        vtake("skrzynia_w5", 1);
        s.shift.n++;
        T.audio.se("Equip2", { volume: 70, pitch: 80 });
        T.popup(fill(TX.stosPolozona, { n: s.shift.n, max: D.CRATES }), { kind: "info" });
        syncKantor();
        if (s.shift.n >= D.CRATES) shiftDone();
        return null;
    }
    function shiftDone() {
        const s = S();
        if (s.shift.paid) return;
        s.shift.paid = true;
        $gameParty.gainGold(D.PAY.shift);
        T.popup(fill(K().zaplata, { n: D.PAY.shift }), { icon: COIN_ICON, kind: "gold" });
        think(TX.baltazarPay.map(l => l));
        s.shifts++;
        s.shift.over = true;
        autoChecks();
    }
    // the pile in the cellar: a crate taken (what is in it - by the night)
    function sterta(ev) {
        const s = S();
        if (regNight()) { T.popup(TX.stertaPusta, { kind: "info" }); return null; }
        if (s.shift.carrying) { T.popup(TX.stertaNiesiesz, { kind: "info" }); return null; }
        if (s.shift.n >= D.CRATES || s.shift.over) { T.popup(TX.stertaPusta, { kind: "info" }); return null; }
        s.shift.carrying = true;
        vgive("skrzynia_w5", 1);
        T.audio.se("Equip1", { volume: 70, pitch: 80 });
        T.popup(TX.sterta, { kind: "info" });
        const k = Math.min(s.shifts, 1);
        if (!(s.shift.seen & (1 << k))) {
            s.shift.seen |= 1 << k;
            think(TX.widzi[k]);
            if (!s["noted" + k]) { s["noted" + k] = day(); notePair(TX.noteWidzi[k]); if (k === 1) setFlag("w5Kamienie"); }
        }
        return null;
    }
    // the heavy crate: a slower walk (as K15's crate)
    const _realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        const s = _realMoveSpeed.call(this);
        return has() && vcount("skrzynia_w5") > 0 ? Math.max(2, s - 1) : s;
    };

    // the cellar's life: Baltazar at his desk, Sławek by the barrels, what lies about tonight, the register's night
    const inGabinet = () => { const g = P.gabinet; return $gamePlayer.x >= g[0] && $gamePlayer.x <= g[2] && $gamePlayer.y >= g[1] && $gamePlayer.y <= g[3] && !($gamePlayer.x === g[0] && $gamePlayer.y !== P.gabinetDoor[1]); };
    let slawekT = 0, cellarGreet = -1;
    let slawekEye = {};   // (Sławek's awareness and its mark over his head - not in the save: the mark is a sprite)
    function syncCellar() {
        if (!onMap(M.piwnica)) return;
        const s = S(), on = checkedIn(), r = s.reg;
        const b = evOf(EV.baltazar), sl = evOf(EV.slawek);
        [EV.baltazar, EV.slawek, EV.sterta, EV.worki, EV.kamienie, EV.mapy, EV.biurko, EV.szkatula, EV.siedzisko].forEach(id => remember(evOf(id)));
        const away = regNight() && (r.state === "out");
        if (on && !away) showEv(b); else if (!on || away) hideEv(b);
        if (on) showEv(sl); else hideEv(sl);
        const nights = s.shifts + (on ? 1 : 0);   // (tonight counts: night 1 shows the grain)
        const se = (id, show) => { const e = evOf(id); if (show) showEv(e); else hideEv(e); };
        se(EV.sterta, on && !regNight() && s.shift.n < D.CRATES && !s.shift.over);
        se(EV.worki, nights >= 1 || pastStep("w5Zmiany"));
        se(EV.kamienie, nights >= 2 || pastStep("w5Zmiany"));
        se(EV.mapy, regNight() || pastStep("w5Rejestr"));
        se(EV.biurko, !r.took || r.took === "copy");
        se(EV.szkatula, true);
        se(EV.siedzisko, true);
    }
    function updateCellar() {
        if (!onMap(M.piwnica)) return;
        syncCellar();
        const s = S(), r = s.reg, b = evOf(EV.baltazar), sl = evOf(EV.slawek);
        if (!checkedIn()) return;
        if (cellarGreet !== nightOf() && b && !hidden(b) && dist(b, $gamePlayer) < 14) {
            cellarGreet = nightOf();
            if (regNight()) {
                think(TX.baltazarNight3, b);
                think(TX.widzi[2]);
                if (!s.noted2) { s.noted2 = day(); notePair(TX.noteWidzi[2]); }
            } else if (!s.shift.over) think(TX.baltazarStart, b);
        }
        // Sławek: the barrels, a look about now and then; a word when the hero passes
        if (sl && !hidden(sl)) {
            slawekT++;
            const period = r.state === "out" ? 420 : 600, look = r.state === "out" ? 150 : 120;
            const ph = slawekT % period;
            sl.setDirection(OPTS.slawekFace || (ph < period - look ? 8 : 6));
            if (slawekT % 1500 === 700 && dist(sl, $gamePlayer) < 5) say(sl, pick(TX.slawekBarks), 160);
        }
        if (!regNight()) return;
        // the register's night: half past midnight Baltazar goes up; twenty minutes; Sławek has eyes
        const h = hour(), t = h < 12 ? h + 24 : h;
        if (r.night !== nightOf()) return;
        if (!r.state && t >= 24 + TM.out && t < 24 + TM.out + TM.away) {
            r.state = "leaving";
            if (b) say(b, TX.baltazarIdzie, 180);
        }
        if (r.state === "leaving" && b) {
            showEv(b);
            if (walkTo(b, P.piwnicaLand[0], P.piwnicaLand[1])) { r.state = "out"; r.back = 24 + TM.out + TM.away; hideEv(b); }
        }
        if (r.state === "out") {
            // Sławek watches the way to the office (the hero east of the barrels, at its door or in it): seen in it - "Szefie!" and
            // Baltazar is back at once; seen on the way - a warning (sneaking - C - he does not see him at all at that distance)
            const watcher = sl && !hidden(sl) ? sl : null;
            if (watcher && ($gamePlayer.x >= P.slawek[0] || inGabinet())) {
                if (guardSees(watcher, slawekEye, s.reg.caught ? 1 : 0) >= 1) {
                    if (inGabinet() || dist($gamePlayer, { x: P.gabinetDoor[0], y: P.gabinetDoor[1] }) < 1.5) { say(watcher, TX.slawekAlarm, 150); r.alarm = 1; r.back = t; }
                    else { say(watcher, TX.slawekHej, 150); slawekEye._aware = 0.5; }
                }
            }
            if (t >= r.back) { r.state = "returning"; if (b) { b.locate(P.piwnicaLand[0], P.piwnicaLand[1]); showEv(b); say(b, TX.baltazarWraca, 150); } }
        }
        if (r.state === "returning" && b) {
            showEv(b);
            const there = walkTo(b, P.baltazar[0], P.baltazar[1]);
            const seesIn = inGabinet() && (b.x >= P.gabinet[0] || dist(b, $gamePlayer) < 4);
            if (seesIn) { caught(); return; }
            if (there) { b.setDirection(2); r.state = "back"; regBack(); }
        }
    }
    function caught() {
        const s = S(), r = s.reg, b = evOf(EV.baltazar);
        r.state = "caught";
        r.caught = (r.caught || 0) + 1;
        r.lastCaught = nightOf();
        if (r.took === "take") { vtake("rejestr", 1); r.took = ""; }
        s.shift.over = true;
        T.popup(K().przylapany, { top: true, color: "#ff9f8f", sub: K().przylapanySub });
        think(r.caught > 1 ? TX.caughtAgain : TX.caught, b);
        if (b) b.setDirection(4);
        pendingOut = Graphics.frameCount + 240;   // (thrown out: the street before the back door, after his words)
    }
    let pendingOut = 0;
    function regBack() {
        const s = S(), r = s.reg;
        s.shift.over = true;
        $gameParty.gainGold(D.PAY.shift);
        T.popup(fill(K().zaplata, { n: D.PAY.shift }), { icon: COIN_ICON, kind: "gold" });
        think(TX.baltazarAfter, evOf(EV.baltazar));
        if (r.took) { r.done = day(); autoChecks(); }
    }
    function biurko() {
        const s = S(), r = s.reg;
        if (vcount("rejestr") > 0 || (r.took && r.done)) { T.popup(r.took === "copy" || vcount("odpis_rejestru") > 0 ? TX.biurkoOdpis : TX.biurkoNic, { kind: "info" }); return null; }
        if (r.took === "copy") { T.popup(TX.biurkoOdpis, { kind: "info" }); return null; }
        if (!regNight() || r.state !== "out") {
            if (pastStep("w5Rejestr")) { T.popup(TX.biurkoNic, { kind: "info" }); return null; }
            T.popup(TX.biurkoZamkniete, { kind: "info" });
            return null;
        }
        const out = linesTo([], HERO, TX.biurkoAsk);
        out.push(...registerLines().map(l => l));
        return choiceTo(out, [TX.biurkoTake, TX.biurkoCopy, TX.biurkoLeave],
            [act([], ["biurko", "take"]), act([], ["biurko", "copy"]), []], 2);
    }
    // the register's text: its lines by what happened on the island (Kantor_Data.REGISTER), shown over the hero
    function registerText() {
        const f = flags(), feliksGone = gone("feliks");
        return D.REGISTER.filter(x => !x.flag || f[x.flag]).map(x => (x.unless === "feliksGone" && feliksGone) || (x.unless && x.unless !== "feliksGone" && f[x.unless]) ? x.alt : x.line);
    }
    function registerLines() {
        const lines = registerText(), out = [];
        for (let i = 0; i < lines.length; i += 2) sayTo(out, HERO, "(" + lines.slice(i, i + 2).join(" ") + ")");
        return out;
    }
    function registerNote(copy) {
        note(D.TX.noteRejestr, fill(K().notatkaRejestru, { jak: copy ? TX.rejestrOdpis : TX.rejestrWzial, tresc: registerText().join(" ") }));
    }
    function takeRegister(how, interp) {
        const s = S(), r = s.reg;
        if (r.state !== "out" || r.took) return;
        if (how === "take") {
            vgive("rejestr", 1); r.took = "take";
            T.popup(D.VITEMS.rejestr.name, { top: true, color: "#ffd23f", sub: K().wyjdzZGabinetu });
            think(TX.biurkoTaken);
            registerNote(false);
        } else if (how === "copy") {
            // a quarter of an hour bent over the desk (a fade); back by then: caught
            advanceTo(hour() + TM.copy);
            const t = clock();
            if (t >= r.back) { r.state = "returning"; const b = evOf(EV.baltazar); if (b) { b.locate(P.gabinetDoor[0] - 1, P.gabinetDoor[1]); showEv(b); } caught(); return; }
            vgive("odpis_rejestru", 1); r.took = "copy";
            T.popup(D.VITEMS.odpis_rejestru.name, { top: true, color: "#ffd23f", sub: K().oryginalZostaje });
            think(TX.biurkoCopied);
            registerNote(true);
        }
    }
    // the strongbox: card 1 of the Order's chronicles (D23) when they were sold to Baltazar
    function cardInBox() {
        const f = flags(), PU = T.api("Pustelnia");
        if (!f.w5ChroniclesSold || S().reg.card || f.kronikaKarta1) return false;
        if (PU && PU.state && PU.state().got && PU.state().got[1]) return false;
        return !isDone("W5") && !pastStep("w5Rejestr");
    }
    function szkatula() {
        const s = S();
        if (!checkedIn()) { T.popup(TX.szkatula, { kind: "info" }); return null; }
        const b = evOf(EV.baltazar);
        if (b && !hidden(b) && dist(b, $gamePlayer) < 5) { T.popup(TX.szkatula, { kind: "info" }); return null; }
        if (!cardInBox()) { T.popup(TX.szkatulaNic, { kind: "info" }); return null; }
        s.reg.card = day();
        think(TX.szkatulaKarta);
        if (!T.call("Pustelnia", "giveCard", 1, K().kartaZeSzkatuly)) vgive("karta_1", 1);
        return null;
    }
    function siedzisko() {
        if (!regNight() || !checkedIn() || S().reg.state) { T.popup(K().skrzyniaTwarda, { kind: "info" }); return null; }
        const t = clock();
        if (t >= 24 + TM.out - 0.1) { T.popup(K().zarazWpol, { kind: "info" }); return null; }
        const out = linesTo([], HERO, ["> " + TX.siedzisko]);
        return choiceTo(out, [TX.czekaj, TX.nieCzekaj], [[C(221, []), C(355, ["Kantor.act(this, [\"wait\"]);"]), C(230, [30]), C(222, [])], []], 1);
    }

    // ------------------------------------------------------------------
    // Chapter 6: the ferry night on Polna droga (Map022)
    // ------------------------------------------------------------------
    const PROM_TAG = "w5Prom";
    const isFerry = d => { const q = TQ(); return q && q.isFerry ? q.isFerry(d) : (d - 1) % 3 === 0; };
    function ferryDay() {
        const s = S();
        if (!s.ferry.day) { let d = day() + 1; while (!isFerry(d) && d < day() + 30) d++; s.ferry.day = d; }
        return s.ferry.day;
    }
    // the ferry night now: 21:00 of the ferry day - 3:00 the next morning
    function ferryNow() {
        const d = S().ferry.day, h = hour();
        return !!d && ((day() === d && h >= TM.ferry[0]) || (day() === d + 1 && h < TM.ferry[1]));
    }
    const friendly = () => S().outcome === "double";
    const promMen = () => { const H = HM(); return H ? H.humans().filter(h => h._tag === PROM_TAG && !h._dead) : []; };
    const fightingMen = () => promMen().filter(h => !h._surrendered && !h._defeated && h._mode !== "flee" && h._mode !== "leave");
    const rafalOnCart = () => flag("rafalTaken") && !flag("rafalAlly") && !S().ferry.rafal;
    function updateFerry() {
        const s = S();
        if (!at("w5Prom")) {
            if (onMap(M.droga)) for (const id of [EV.wozProm, EV.skrzynieProm, EV.rafal, EV.straz1, EV.straz1 + 1, EV.ogienProm]) {
                const e = evOf(id);
                if (e && !(id === EV.wozProm && s.ferry.state === "seized" && s.ferry.stateDay === day())) hideEv(e);
            }
            return;
        }
        ferryDay();
        // the night over without him: the cart went
        if (!s.ferry.state && s.ferry.day && (day() > s.ferry.day + 1 || (day() === s.ferry.day + 1 && hour() >= TM.ferry[1]))) ferryEnd("gone");
        if (!onMap(M.droga)) return;
        const on = ferryNow() && !s.ferry.state;
        for (const id of [EV.wozProm, EV.skrzynieProm, EV.rafal, EV.straz1, EV.straz1 + 1, EV.ogienProm]) remember(evOf(id));
        const se = (id, show) => { const e = evOf(id); if (show) showEv(e); else hideEv(e); };
        se(EV.ogienProm, on);
        se(EV.wozProm, on || (s.ferry.state === "seized" && s.ferry.stateDay === day()));
        se(EV.skrzynieProm, on);
        se(EV.rafal, on && rafalOnCart());
        se(EV.straz1, on && friendly()); se(EV.straz1 + 1, on && friendly());
        if (!on) { if (promMen().length && !fightingMen().length) HM().clear(PROM_TAG); return; }
        if (!friendly() && !promMen().length && !ferrySpawnVisit && !s.ferry.cleared) {
            ferrySpawnVisit = true;
            const H = HM();
            if (H && H.spawn) {
                const band = H.makeBand([], { tag: PROM_TAG });
                P.guards.forEach(([x, y, mode], i) => H.spawn(i ? "archer" : "bandit", x, y, { band, mode, tag: PROM_TAG, noBand: true }));
            }
        }
        // the ambush: once the guards have seen him, two (three - the enemy) more come out of the bushes
        if (!friendly() && !s.ferry.ambush && promMen().some(h => h._engaged)) {
            s.ferry.ambush = day();
            const H = HM(), kinds = ["knifer", "bandit"].concat(s.outcome === "enemy" ? ["knifer"] : []);
            const m = promMen().find(h => h._engaged);
            if (m) say(m, pick(TX.promStraz), 150);
            if (H && H.ambush) H.ambush(kinds, { tag: PROM_TAG, far: [4, 8], say: TX.promZasadzka });
        }
    }
    function ferryEnd(state) {
        const s = S();
        if (s.ferry.state) return;
        s.ferry.state = state;
        s.ferry.stateDay = day();
        if (state === "gone" || state === "beaten" || state === "letgo") {
            if (rafalOnCart()) { s.ferry.rafal = "shipped"; setFlag("w5RafalShipped"); notePair(TX.noteRafalGone); }
        }
        const rw = { gone: null, beaten: null, letgo: { gold: D.PAY.letGo, xp: 30 }, seized: { xp: 150 }, swapped: { xp: 200 } }[state];
        notePair({ gone: TX.noteGone, beaten: TX.noteBeaten, letgo: TX.noteLetGo, seized: TX.noteSeized, swapped: TX.noteSwapped }[state]);
        if (state === "gone") T.popup(TX.promGone[0], { top: true, color: "#ff9f8f", sub: TX.promGone[1] });
        if (state === "seized" || state === "swapped") { vgive("kamien_kruk", D.STONES.gain); setFlag(state === "seized" ? "w5LadunekZabrany" : "w5LadunekPodmieniony"); }
        else setFlag("w5LadunekOdplynal");
        complete(rw ? { reward: rw } : undefined);
    }
    function wozProm() {
        const s = S();
        if (!ferryNow() || s.ferry.state) { T.popup(TX.promWoz, { kind: "info" }); return null; }
        if (friendly()) return straz();
        const fight = fightingMen();
        if (!fight.length) {   // all beaten (or fled): the cargo is his
            think(TX.promSeized);
            ferryEnd("seized");
            return null;
        }
        if (fight.some(h => h._engaged)) { T.popup(TX.promWoz, { kind: "info" }); return null; }
        // nobody has noticed him: the swap
        const out = linesTo([], HERO, ["> " + TX.promSwapAsk]);
        return choiceTo(out, [K().podmien, K().zostaw], [act([], ["swap"]), []], 1);
    }
    function swap() {
        if (count(D.STONE_ITEM) < D.STONES.swap) { T.popup.need(item(D.STONE_ITEM) ? item(D.STONE_ITEM).iconIndex : 0, TX.promSwapNeed); return; }
        $gameParty.loseItem(item(D.STONE_ITEM), D.STONES.swap);
        think(TX.promSwapped);
        ferryEnd("swapped");
    }
    function straz() {
        const s = S(), spk = { id: EV.straz1, name: K().nazwy.straz }, out = linesTo([], spk, TX.promSwoj);
        return choiceTo(out, TX.promSwojOpts, [act(linesTo([], spk, TX.promLetGo), ["letgo"]), act([], ["swap"]), []], 2);
    }
    function rafal() {
        const s = S();
        if (!rafalOnCart()) return null;
        if (fightingMen().some(h => h._engaged)) { T.popup(TX.rafalWait, { kind: "info" }); return null; }
        const spk = { id: EV.rafal, name: K().nazwy.rafal }, out = linesTo([], spk, TX.rafalFree);
        return act(out, ["rafal"]);
    }
    function freeRafal() {
        const s = S();
        if (!rafalOnCart()) return;
        s.ferry.rafal = "free";
        setFlag("rafalAlly"); setFlag("w5RafalFreed");
        T.call("TownLife", "setGone", "rafal", false);
        notePair(TX.noteRafal);
        opinion(3, K().rafalOpinia);
        hideEv(evOf(EV.rafal));
    }

    // ------------------------------------------------------------------
    // Chapters 5 and 7: TownQuests' handlers (the talks with Wit, the reeve, Baltazar)
    // ------------------------------------------------------------------
    const hasRegister = () => vcount("rejestr") > 0 || vcount("odpis_rejestru") > 0;
    function giveUpRegister() { vtake("rejestr", 9); vtake("odpis_rejestru", 9); }
    function w5Vars() {
        const s = S(), r = w5();
        const d = s.ferry.day || (at("w5Prom") ? ferryDay() : 0);
        const A = K().akt2, akt2 = !actTwo() ? A.przed : s.outcome === "closed" ? A.closed : s.outcome === "double" ? A.double : A.enemy;
        return { n: Math.min(2, clueList().length), zmiany: Math.min(D.SHIFTS, s.shifts), noce: D.SHIFTS, rejestr: vcount("rejestr") > 0 ? K().rejestrMasz : K().odpisMasz,
            zebranie: s.zebranie || day() + 1, prom: d ? fill(K().promNoc, { d, d2: d + 1 }) : K().promNajblizszy, akt2 };
    }
    function hookQuests() {
        const q = TQ();
        if (!q || !q.FX || hookQuests.done) return;
        hookQuests.done = true;
        Object.assign(q.FX, {
            w5Auto: () => has() && day() >= 10 && clueList().length >= 1,
            w5Vars: { vars: () => w5Vars() },
            w5Poszlaki: { check: () => clueList().length >= 2 },
            w5Stuk: { check: () => S().knock.seen > 0 },
            w5Oboz: { check: () => S().camp.heard > 0 || S().camp.fought > 0 },
            w5Najem: {
                ready: (qq, r, st, key) => key === "kupiec" && inHours(hour(), TM.work),
                talk(qq, r, st, key, spk) {
                    if (key !== "kupiec" || !inHours(hour(), TM.work)) return null;
                    const s = S(), mood = trust() ? "trust" : s.camp.fought ? "fight" : "cold";
                    const out = linesTo([], spk, mood === "trust" ? TX.najemTrust : mood === "fight" ? TX.najemFight : TX.najemCold);
                    choiceTo(out, [TX.najemYes, TX.najemNo], [act(linesTo([], spk, TX.najemOk), ["hire", mood]), linesTo([], spk, TX.najemLater)], 1);
                    return { ready: true, list: out };
                }
            },
            w5Zmiany: { check: () => S().shifts >= D.SHIFTS },
            w5Rejestr: { check: () => S().reg.done > 0 && hasRegister() },
            w5Komu: {
                ready: (qq, r, st, key) => (key === "kapral" || (key === "soltys" && inHours(hour(), [8, 18])) || (key === "kupiec" && inHours(hour(), TM.work))) && hasRegister(),
                talk(qq, r, st, key, spk) {
                    if (!hasRegister()) return null;
                    if (key === "kapral") {
                        const L = TX.komuWit, out = linesTo([], spk, L.ask.concat(witTrusts() ? L.trust : L.burn));
                        return { ready: true, list: act(out, ["komu", witTrusts() ? "wit" : "witBurn"]) };
                    }
                    if (key === "soltys" && inHours(hour(), [8, 18])) {
                        const L = TX.komuSoltys;
                        return { ready: true, list: act(linesTo([], spk, L.ask.concat(L.say)), ["komu", "soltys"]) };
                    }
                    if (key === "kupiec" && inHours(hour(), TM.work)) {
                        const L = TX.komuBaltazar, out = linesTo([], spk, L.ask.concat(L.say));
                        choiceTo(out, [L.double, L.blackmail, L.later], [act(linesTo([], spk, L.doubleSay), ["komu", "double"]),
                            act(linesTo([], spk, L.blackmailSay), ["komu", "blackmail"]), linesTo([], spk, L.laterSay)], 2);
                        return { ready: true, list: out };
                    }
                    return null;
                }
            },
            w5Zebranie: {
                ready: (qq, r, st, key) => key === "soltys" && day() >= S().zebranie && inHours(hour(), TM.meeting),
                talk(qq, r, st, key, spk) {
                    if (key !== "soltys") return null;
                    if (day() < S().zebranie || !inHours(hour(), TM.meeting)) return { ready: false, list: linesTo([], spk, TX.zebranie.notYet) };
                    return { ready: true, list: act(linesTo([], spk, TX.zebranie.say), ["zebranie"]) };
                }
            },
            w5Prom: { check: () => !!S().ferry.state },
            w5Akt2: {
                ready: (qq, r, st, key) => actTwo() && ((S().outcome === "closed" && key === "soltys") || (S().outcome !== "closed" && key === "kupiec")) && inHours(hour(), TM.work),
                talk(qq, r, st, key, spk) {
                    if (!actTwo() || !inHours(hour(), TM.work)) return null;
                    const s = S();
                    if (s.outcome === "closed" && key === "soltys") {
                        const out = linesTo([], spk, TX.akt2Soltys);
                        choiceTo(out, [TX.akt2Ludmila, TX.akt2Ratusz], [act(linesTo([], spk, TX.akt2LudmilaSay), ["akt2", "ludmila"]), act(linesTo([], spk, TX.akt2RatuszSay), ["akt2", "ratusz"])], -1);
                        return { ready: true, list: out };
                    }
                    if (s.outcome !== "closed" && key === "kupiec") {
                        return { ready: true, list: act(linesTo([], spk, s.outcome === "double" ? TX.akt2Grip : TX.akt2Enemy), ["akt2", s.outcome]) };
                    }
                    return null;
                }
            }
        });
    }
    hookQuests();
    // ch. 5: the choice taken
    function komu(how) {
        const s = S(), q = TQ(), Q = W5();
        if (!at("w5Komu") || !q) return;
        s.komu = how;
        const prom = stepIdx("w5Prom");
        if (how === "wit") {
            giveUpRegister();
            s.outcome = "closed";
            for (const f of ["w5WitAlly", "witAlly", "w5Zamkniety", "w5BaltazarWrog"]) setFlag(f);
            notePair(TX.noteWit);
            closeKantor();
            complete({ to: prom, reward: { opinion: 8, xp: 150 } });
        } else if (how === "witBurn") {
            giveUpRegister();
            s.outcome = "enemy";
            for (const f of ["w5WitSpalil", "w5BaltazarWrog"]) setFlag(f);
            notePair(TX.noteWitBurn);
            scheduleRaid();
            if (hour() >= 7) $gameSystem._dayNightDay = day() + 1;   // (a night in the guardhouse: out at seven in the morning)
            $gameSystem.setDayNightHour(7);
            T.popup(K().wartownia, { top: true, color: "#ff9f8f", sub: K().wartowniaSub });
            complete({ to: prom, reward: { opinion: -1, xp: 30 } });
        } else if (how === "soltys") {
            giveUpRegister();
            s.zebranie = day() + 1;
            notePair(TX.noteSoltys);
            complete({ reward: { xp: 50 } });
        } else if (how === "double") {
            if (vcount("rejestr") > 0) vtake("rejestr", 9);   // (he takes the original back; a copy stays with the hero)
            s.outcome = "double";
            s.weekPaid = day();
            for (const f of ["w5Podwojna", "w5FactionWatches"]) setFlag(f);
            notePair(TX.noteDouble);
            complete({ to: prom, reward: { xp: 100 } });
        } else if (how === "blackmail") {
            s.outcome = "enemy";
            for (const f of ["w5Szantaz", "w5BaltazarWrog"]) setFlag(f);
            notePair(TX.noteBlackmail);
            scheduleRaid();
            complete({ to: prom, reward: { gold: D.PAY.blackmail, xp: 50, opinion: -2 } });
        }
    }
    function zebranie() {
        const s = S();
        if (!at("w5Zebranie")) return;
        s.outcome = "closed";
        for (const f of ["w5Zamkniety", "w5Soltys", "w5BaltazarWrog"]) setFlag(f);
        notePair(TX.noteZebranie);
        // the loose card of the chronicles found in the strongbox: the reeve hands it over
        if (cardInBoxAny()) { S().reg.card = day(); if (!T.call("Pustelnia", "giveCard", 1, K().kartaSoltys)) vgive("karta_1", 1); }
        closeKantor();
        complete({ reward: { opinion: 12, xp: 150 } });
    }
    const cardInBoxAny = () => { const f = flags(), PU = T.api("Pustelnia"); return !!(f.w5ChroniclesSold && !S().reg.card && !(PU && PU.state && PU.state().got && PU.state().got[1])); };
    // the kantor shut: Baltazar off the island (the next ferry) - back in Act II at the harbour
    function closeKantor() {
        T.call("TownLife", "setGone", "kupiec", true);
        S().back = 0;
    }
    function scheduleRaid() { const s = S(); if (!s.raid.day) s.raid = { day: day() + rnd(D.RAID.after[0], D.RAID.after[1]), done: 0 }; }
    function akt2(how) {
        const s = S(), q = TQ();
        if (!at("w5Akt2") || !q) return;
        if (how === "ludmila" || how === "ratusz") {
            s.honest = how;
            setFlag(how === "ludmila" ? "w5KantorLudmila" : "w5KantorRatusz");
            setFlag("w5KantorUczciwy");
            notePair(TX.noteHonest);
        } else if (how === "double") { setFlag("w5KantorTani"); notePair(TX.noteGrip); }
        else { setFlag("w5KantorDrogi"); notePair(TX.noteEnemy); }
        q.finish("W5");
    }

    // ------------------------------------------------------------------
    // After: Baltazar back at the harbour (Act II, the kantor shut), the raids of the enemy, the weekly pay, the shops
    // ------------------------------------------------------------------
    function updateWorld() {
        const s = S(), f = flags();
        // the kantor shut: Baltazar comes back in Act II - at the harbour, with mercenaries
        if (s.outcome === "closed" && f.w5Zamkniety && actTwo() && !s.back && pastStep("w5Prom")) {
            s.back = day();
            T.call("TownLife", "setGone", "kupiec", false);
            setFlag("w5BaltazarWrocil");
            notePair(TX.noteBack);
            s.backRaid = day() + rnd(2, 5);
        }
        // the enemy's men at night on the roads (once): after the blackmail / the burnt register, and after his return
        const raidDue = (s.raid.day && !s.raid.done && day() >= s.raid.day) || (s.backRaid && day() >= s.backRaid && !s.backRaidDone);
        if (raidDue && D.RAID.maps.includes($gameMap.mapId()) && inHours(hour(), D.RAID.hours)) {
            const H = HM();
            if (H && H.ambush && !H.humans().some(h => !h._dead && h._engaged) && !$gameMap.isEventRunning()) {
                const band = H.ambush(D.RAID.kinds, { tag: "w5Napad", say: TX.napadShout });
                if (band) { if (s.raid.day && !s.raid.done) s.raid.done = day(); else s.backRaidDone = day(); }
            }
        }
    }
    function mode() {
        const s = S();
        if (s.honest) return "honest";
        if (s.outcome === "double") return "grip";
        if (s.outcome === "enemy" || (s.outcome === "closed" && s.back)) return "enemy";
        return "normal";
    }
    // the price of what Baltazar sells (the lens of the lighthouse, the card of the chronicles - Latarnia.js, Pustelnia.js): double for an
    // enemy, half in the hero's grip
    function priceMul() { const m = mode(); return m === "enemy" ? D.PRICE.enemy : m === "grip" ? D.PRICE.grip : 1; }
    const priceOf = base => Math.max(1, Math.round(base * priceMul()));
    function shopList(spk, kind, quiet) {
        const k = kind || mode(), mul = D.PRICE[k] || 1, out = linesTo([], spk, quiet ? [] : TX.sklepPowitanie[k] || []);
        const goods = D.GOODS.filter(g => item(g.id));
        const labels = goods.map(g => item(g.id).name + " ×" + g.n + " - " + Math.max(1, Math.round(g.price * g.n * mul)) + " G").concat([TX.sklepNic]);
        return choiceTo(out, labels, goods.map(g => act([], ["buy", g.id, k])).concat([[]]), labels.length - 1);
    }
    function buy(id, kind) {
        const g = D.GOODS.find(x => x.id === id);
        if (!g || !item(id)) return false;
        const cost = Math.max(1, Math.round(g.price * g.n * (D.PRICE[kind] || 1)));
        if ($gameParty.gold() < cost) { T.popup.need(COIN_ICON, fill(K().potrzebujesz, { n: cost })); return false; }
        $gameParty.loseGold(cost);
        $gameParty.gainItem(item(id), g.n);
        T.popup(item(id).name + " ×" + g.n, { icon: item(id).iconIndex, kind: "good" });
        return true;
    }
    // Baltazar's own talk after W5 (the core's talk service, below the quests: they speak first): the weekly cut, the shop
    function baltazarHook(key, ev) {
        if (key !== "kupiec" || !has()) return null;
        const s = S(), spk = { id: ev.eventId(), name: K().nazwy.baltazar };
        const out = [];
        if (s.outcome === "double" && day() - (s.weekPaid || 0) >= 7 && inHours(hour(), TM.work)) {
            s.weekPaid = day();
            linesTo(out, spk, TX.dzialka);
            act(out, ["pay", D.PAY.double]);
        }
        if (isDone("W5") && (mode() === "grip" || mode() === "enemy") && inHours(hour(), TM.work)) {
            // (2026-10-23) the other systems' rows (Tawerna.talk.option, who "kupiec" - Bron.js: the kantor's weapons) after his shop
            T.talk.menu(out, T.talk.rows("kupiec", { ev }, [{ label: TX.sklepAsk, cmds: shopList(spk) }]), TX.sklepBye);
        }
        return out.length ? out : null;
    }
    // (2026-10-17, the user) Ludmiła behind the counter of the honest kantor (Map103, 9-15): a short word and the shop - her quests'
    // hand-ins first (TownQuests), her camp's news on a choice (TownQuests' talk of her: offers, reminders - or a line of the camp)
    const ludmilaHere = () => { const L = TL(), ev = L && L.eventOf ? L.eventOf("ludmila") : null; return onMap(M.kantor) && !!ev && !(ev._town && ev._town.hidden) ? ev : null; };
    // (2026-10-23, docs/ROZMOWY.md) her menu takes the other systems' rows through the core's talk service (Tawerna.talk.option, who
    // "ludmila" - Bron.js: the kantor's weapons): the goods, their rows, her camp's news, the farewell last - as the old addMenu did
    function ladaMenu(spk, ev) {
        const out = linesTo([], spk, [pick(TX.ladaLudmila)]);
        const rows = T.talk.rows("ludmila", { ev }, [{ label: TX.ladaPokaz, cmds: shopList(spk, "honest", true) },
            { label: TX.ladaOboz, cmds: act([], ["ludmilaTalk"]), order: T.talk.ORDER.chat }]);
        return T.talk.menu(out, rows, TX.ladaBywaj);
    }
    function ludmilaHook(key, ev) {
        if (key !== "ludmila" || !has() || !onMap(M.kantor) || S().honest !== "ludmila") return null;
        const q = TQ();
        try { if (q && q.talkFor && q.talkFor("ludmila", true)) return null; } catch (e) { /* (her quests speak through TownQuests) */ }
        return ladaMenu({ id: ev.eventId(), name: K().nazwy.ludmila }, ev);
    }
    // (2026-10-23, docs/ROZMOWY.md) the core's talk service: Ludmiła behind the honest counter - an "owner" takeover (steps aside for her
    // quests' hand-ins itself); Baltazar's weekly cut and shop after W5 - "shop + 20": only when the quests (and Pustelnia's card, Kruk's
    // letters...) have nothing for him, before Bron's shop of his (whose row comes into this menu) and the greeting of the day
    (function hookTalk() {
        const L = TL();
        T.talk.takeover({ owner: PLUGIN, name: "ludmila", who: "ludmila", priority: T.talk.PRIORITY.owner + 20,
            run: ctx => { try { return ludmilaHook(ctx.who, ctx.ev); } catch (e) { report("talk", e); return null; } } });
        T.talk.takeover({ owner: PLUGIN, name: "baltazar", who: "kupiec", priority: T.talk.PRIORITY.shop + 20,
            run: ctx => { try { return baltazarHook(ctx.who, ctx.ev); } catch (e) { report("talk", e); return null; } } });
        if (L && L.addCondition) {
            L.addCondition("w5Shift", () => { try { return shiftOn(); } catch (e) { return false; } });
            L.addCondition("w5Harbour", () => { try { return S().outcome === "closed" && !!S().back; } catch (e) { return false; } });
            L.addCondition("w5Lada", () => { try { return S().honest === "ludmila"; } catch (e) { return false; } });
        }
    })();
    // the honest counter in the kantor (Map103, Act II): Ludmiła behind it 9-15 (her camp runs it) - else the price list and the money
    // box while the kantor's doors are open (8-21); the town hall's kantor: always the box ("honesty on one's word")
    function lada() {
        const s = S();
        if (!s.honest) return null;
        const lu = s.honest === "ludmila" ? ludmilaHere() : null;
        if (lu) return ladaMenu({ id: lu.eventId(), name: K().nazwy.ludmila });
        if (!inHours(hour(), [8, 21])) { T.popup(K().ladaNoc, { kind: "info" }); return null; }
        return linesTo([], HERO, TX.ladaPusta[s.honest] || TX.ladaPusta.ratusz).concat(shopList({ id: EV.lada, name: TX.lada }, "honest", true));
    }
    // Map103: the stack's look by tonight's crates, the trapdoor (an empty event on the user's tile)
    function syncKantor() {
        if (!onMap(M.kantor)) return;
        const st = evOf(EV.stos), kl = evOf(EV.klapa), la = evOf(EV.lada);
        remember(st); remember(kl); remember(la);
        const n = checkedIn() ? S().shift.n : 0;
        if (checkedIn()) showEv(st, n >= 3 ? ART.stos3 : n === 2 ? ART.stos2 : ART.stos1); else hideEv(st);
        if (kl) showEv(kl);
        if (S().honest) showEv(la); else hideEv(la);
    }

    // ------------------------------------------------------------------
    // The events' script: Kantor.act(this) - by the event; Kantor.act(this, [what, ...]) - from a talk
    // ------------------------------------------------------------------
    function actCall(interp, args) {
        if (!has() || !interp) return;
        const stop = () => { if (interp._list) interp._index = interp._list.length; };
        try {
            if (Array.isArray(args)) return actArgs(args, interp, stop);
            const ev = $gameMap.event(interp.eventId());
            if (!ev || hidden(ev)) return;
            const k = keyOf(ev);
            const list = { klapa: () => klapa(ev), stos: () => stos(ev), lada: () => lada(), baltazar: () => talkBaltazar(ev), slawek: () => talkSlawek(ev),
                sterta: () => sterta(ev), worki: () => (T.popup(TX.worki, { kind: "info" }), null), kamienie: () => (T.popup(TX.kamienie, { kind: "info" }), setFlag("w5Kamienie"), null),
                mapy: () => (T.popup(TX.mapy, { kind: "info" }), null), biurko: () => biurko(), szkatula: () => szkatula(), siedzisko: () => siedzisko(),
                wozProm: () => wozProm(), skrzynieProm: () => (T.popup(TX.promWoz, { kind: "info" }), null), rafal: () => rafal(),
                straz0: () => straz(), straz1: () => straz(), wozOboz: () => (T.popup(K().wozOboz, { kind: "info" }), null),
                skrzynieOboz: () => (T.popup(K().skrzynieOboz, { kind: "info" }), null), ogien: () => null, ogienProm: () => null, kurierOboz: () => null,
                kurier: () => null, gosc: () => null }[k];
            const out = list ? list() : null;
            if (out && out.length) interp.setupChild(out.concat([C(0, [])]), ev.eventId());
        } catch (e) { report("act", e); }
    }
    function actArgs(args, interp, stop) {
        const [what, a, b] = args;
        if (what === "hire") {
            if (!at("w5Najem")) return;
            const s = S();
            s.hired = day(); s.mood = a;
            if (a !== "trust") setFlag("w5NajetyZimno");
            notePair(TX.noteNajem);
            complete();
        } else if (what === "biurko") takeRegister(a, interp);
        else if (what === "wait") { const t = clock(); if (t < 24 + TM.out - 0.1) advanceTo(TM.out - 0.08); }
        else if (what === "komu") komu(a);
        else if (what === "zebranie") zebranie();
        else if (what === "akt2") akt2(a);
        else if (what === "swap") swap();
        else if (what === "letgo") { if (ferryNow() && !S().ferry.state) ferryEnd("letgo"); }
        else if (what === "rafal") freeRafal();
        else if (what === "buy") { if (!buy(a, b)) stop(); }
        else if (what === "pay") { $gameParty.gainGold(a); T.popup(fill(K().zaplata, { n: a }), { icon: COIN_ICON, kind: "gold" }); }
        else if (what === "ludmilaTalk") {   // (her own quests' talk - TownQuests - or a word of the camp)
            const q = TQ(), lu = ludmilaHere();
            let list = null;
            try { list = q && q.talkFor ? q.talkFor("ludmila") : null; } catch (e) { list = null; }
            if (!list || !list.length) list = linesTo([], { id: lu ? lu.eventId() : -1, name: K().nazwy.ludmila }, TX.ladaObozLine);
            if (interp) interp.setupChild(list.concat([C(0, [])]), interp.eventId());
        }
    }
    function talkBaltazar(ev) {
        const s = S(), spk = { id: ev.eventId(), name: K().nazwy.baltazar };
        if (!checkedIn()) return linesTo([], spk, TX.baltazarDone);
        if (regNight()) {
            if (s.reg.state) return linesTo([], spk, [TX.baltazarWraca]);
            const out = linesTo([], spk, TX.baltazarNight3);
            return choiceTo(out, [TX.czekaj, TX.nieCzekaj], [[C(221, []), C(355, ["Kantor.act(this, [\"wait\"]);"]), C(230, [30]), C(222, [])], []], 1);
        }
        if (s.shift.over) return linesTo([], spk, TX.baltazarDone);
        if (!s.shift.n && !s.shift.carrying) return linesTo([], spk, TX.baltazarStart);
        return linesTo([], spk, TX.baltazarWork, { left: D.CRATES - s.shift.n });
    }
    function talkSlawek(ev) { return linesTo([], { id: ev.eventId(), name: K().nazwy.slawek }, TX.slawekTalk); }

    // ------------------------------------------------------------------
    // The frame: the visitors, the camp, the cellar, the ferry night, the world
    // ------------------------------------------------------------------
    T.onMapUpdate((scene, n) => {
        if (!has()) return;
        updateThoughts();
        try { updateVisitors(); } catch (e) { report("visitors", e); }
        try { updateCellar(); } catch (e) { report("cellar", e); }
        if (pendingOut && Graphics.frameCount >= pendingOut && !$gameMap.isEventRunning()) {
            pendingOut = 0;
            if (onMap(M.piwnica) && !$gamePlayer.isTransferring()) $gamePlayer.reserveTransfer(M.town, P.backFront[0], P.backFront[1], 2, 0);
        }
        if (n % 5) return;
        try { updateCamp(); } catch (e) { report("camp", e); }
        try { updateFerry(); } catch (e) { report("ferry", e); }
        if (n % 30) return;
        try { syncKantor(); updateKlos(); updateWorld(); } catch (e) { report("world", e); }
    }, { owner: PLUGIN, name: "kantor" });
    T.on("mapReady", () => {
        if (!has()) return;
        for (const k of Object.keys(vis)) vis[k] = null;
        campTalk = null; slawekT = 0; slawekEye = {}; campSpawnVisit = false; ferrySpawnVisit = false; pendingOut = 0;
        syncKantor(); syncCellar();
    }, { owner: PLUGIN });
    T.on("humansDone", e => {
        if (!has() || !e) return;
        if (e.tag === CAMP_TAG && !campMen().some(h => !h._surrendered && !h._defeated)) campFought();
        if (e.tag === PROM_TAG && !fightingMen().length && ferryNow()) { S().ferry.cleared = day(); think([K().pobici]); }
    }, { owner: PLUGIN });
    T.on("heroRobbed", e => {
        if (!has() || !e) return;
        if (e.tag === CAMP_TAG) { S().camp.beaten = nightOf(); think(TX.obozPobity); }
        if (e.tag === PROM_TAG && ferryNow()) ferryEnd("beaten");
    }, { owner: PLUGIN });
    T.on("load", () => { thoughts.length = 0; thoughtAt = 0; }, { owner: PLUGIN });
    T.on("newGame", () => { thoughts.length = 0; thoughtAt = 0; }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // F9 ("Wyspa i fabuła"): straight to a chapter - the flags, the hour, the place
    // ------------------------------------------------------------------
    const JUMP = {
        1: { step: "w5Poszlaki", hour: 10, go: [M.town, 16, 49, 8] },
        2: { step: "w5Stuk", hour: 23.85, go: [M.town, 10, 49, 2] },
        3: { step: "w5Najem", hour: 10, go: [M.town, 16, 49, 8] },
        4: { step: "w5Rejestr", hour: 22.05, go: [M.town, 14, 49, 8] },
        5: { step: "w5Komu", hour: 10, go: [M.town, 16, 49, 8] },
        6: { step: "w5Prom", hour: 21.5, go: [M.droga, 12, 2, 2] },
        7: { step: "w5Akt2", hour: 10, go: [M.town, 16, 49, 8] }
    };
    function debugJump(ch) {
        const j = JUMP[ch], q = TQ();
        if (!j || !q || !has()) return null;
        if (day() < 10) $gameSystem._dayNightDay = 10;
        const s = S();
        if (ch >= 2) { s.clues.debug = day(); setFlag("k15Clean"); }
        if (ch >= 3) { s.knock.seen = s.knock.seen || day(); s.camp.heard = s.camp.heard || day(); }
        if (ch >= 4) { s.hired = s.hired || day(); s.mood = s.mood || "trust"; s.shifts = Math.max(s.shifts, D.SHIFTS); }
        if (ch >= 5) { s.reg.done = s.reg.done || day(); if (!hasRegister()) vgive("odpis_rejestru", 1); }
        if (ch >= 6 && !s.outcome) { s.outcome = "closed"; setFlag("w5Zamkniety"); setFlag("w5BaltazarWrog"); closeKantor(); giveUpRegister(); }
        if (ch === 6) { s.ferry = { day: day(), state: "", ambush: 0, rafal: "" }; }
        if (ch >= 7 && !s.ferry.state) s.ferry.state = "seized";
        const r = q.rec("W5");
        if (!r || r.s !== "active") q.start("W5", stepIdx(j.step));
        else { r.step = stepIdx(j.step); r.sday = day(); }
        $gameSystem.setDayNightHour(j.hour);
        if (ch === 6) s.ferry.day = day();
        if (ch === 4) { s.shift = { night: -1, n: 0, carrying: false, paid: false, seen: 0, over: false }; s.reg = Object.assign(s.reg, { night: -1, state: "", took: "", back: 0, done: 0 }); }
        if (q.refreshMarkers) q.refreshMarkers();
        return j.go;
    }

    // ------------------------------------------------------------------
    // API
    // ------------------------------------------------------------------
    window.Kantor = T.register(PLUGIN, {
        DATA: D, state: () => S(), act: actCall, door, clues: clueList, trust, witTrusts, registerText, cardInBox, priceMul, priceOf, mode,
        ferryDay, ferryNow, shiftOn, checkedIn, outcome: () => S().outcome, debugJump, JUMP, step: () => cur(),
        // tests: a visitor's phase, the camp's men, the ferry's men
        visitors: () => Object.assign({}, vis), campMen, promMen, fightingMen, spawnCamp, campWanted, opts: OPTS, backDoorEv, cellarState: () => S().reg
    });
})();
