//=============================================================================
// Ludzie.js
//=============================================================================
// PACZKA C „Ludzie” (docs/rozszerzenia/PLAN.md, punkt 6) - the engine of: Zbych Smolarz i mielerz, pasterz z owcami, wędrowny
// handlarz, patrole, obóz kopaczy (W8), jaskinia przemytników (W5, mapa 177), stare groby Ługów. The data: Ludzie_Data.js.
//   C1 the kiln on Leśna droga (Map021): cold / burning (smoke, at night the glow - a flame's light) / ready by its 6-day cycle; Zbych
//      (TownLife's drwal) lives there on its days (his "alt"), sells charcoal (4 G, 10 a burn), burns the hero's wood (12 -> 8 in 2
//      days); Ludzie.mielerzBurning() for package B; K63 „Węgiel dla kowala” (the guarded night: Humans.ambush under the kiln)
//   C2 the shepherd (TownLife 2910) and his six sheep (our own characters: Game_LudSheep, Hunting.path8 + RoamingActor's steps): the
//      pasture by day, the wicker fold at night (the fence = invisible events), every third day by the menhirs (Map018); his trade,
//      the shearing in spring, the blanket (+50% resting on the ground); K64 „Zabłąkana owca” (the lost sheep follows the hero
//      across the maps)
//   C3 the pedlar (TownLife 2911): four stops by d % 4 (his alt map is the day's stop: TownLife.HOMES gets the other three), his
//      wagon, donkey and fire there; five goods a day, the map of the area (Okolice.revealAll), dear water once a day, buying 20%
//      over the town, a rumour a day (Okolice.hint); K65 „Zgubiony juk”
//   C4 the patrols (TownLife 2912-2915): the second walks one cell behind the first (TownLife.hold), calls, the bag searched under the
//      garrison's favour 10 (Garnizon's own rule and texts); K66 „Nocny patrol” (the night round, Humans.ambush at the lighthouse)
//   C5 the Black Eyes' diggers' camp (Map013, from W8 ch. 3): tents, a fire, the commander's chest, the shaft; 4 diggers (Humans,
//      asleep at night); D35 „Szyb pod Orlą Granią” (the journal, then: fill the shaft / tell Grum / tell the captain)
//   C6 the smugglers' cave (Map125 -> Map177): only at low tide, from W5 ch. 4; Sławek at night (Humans); D34 „Jaskinia pod
//      zatoczką” (the crate to the customs officer / to Baltazar / broken open); Ludzie.stashFound() for package D's eagle stash
//   C7 the old graves of the Ług family (Map168): cleaned by hand (3 x 4 blows); Marta sometimes there on her grave days
// Event ids 2500-2699 (TawernaCore registry, owner "Ludzie"), state Tawerna.state("ludzie"), F9 rows through Okolice.f9.add,
// places through Okolice.registerSpots("C", ...), discoveries through Okolice.discoverable / Okolice.discover.

/*:
 * @target MZ
 * @plugindesc [paczka C] Ludzie: Zbych Smolarz i mielerz, pasterz z owcami, wędrowny handlarz, patrole, obóz kopaczy (W8), jaskinia przemytników (W5, mapa 177), stare groby Ługów. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @base Ludzie_Data
 * @orderAfter Okolice
 *
 * @help
 * ============================================================================
 * Ludzie.js - paczka C „Ludzie” (nowy teren powiększonych map)
 * ============================================================================
 * Mielerz Zbycha Smolarza przy Leśnej drodze (co 6 dni dwa dni wypału,
 * węgiel po 4 G, drewno na wypał), pasterz Wawrzyn Owczarz z sześcioma
 * owcami (koszar na Łące, co trzeci dzień przy menhirach), wędrowny handlarz
 * Szymon Juczny (cztery postoje: Polna droga, Leśna droga, Łąka, Kruczy
 * Jar), patrole garnizonu na przylądku i wybrzeżu, obóz kopaczy Czarnych
 * Oczu w górach (od W8 rozdz. 3), jaskinia przemytników pod zatoczką na
 * przystani (tylko w odpływie, od W5 rozdz. 4), stare groby Ługów.
 * Zadania: K63, K64, K65, K66, D34, D35.
 * Zdarzenia 2500-2699. F9 (zakładka „Wyspa i fabuła”, sekcja „Paczka C”).
 * Dla paczek: Ludzie.mielerzBurning() (B), Ludzie.stashFound() (D).
 * Woda: tylko droga beczka handlarza (łyk raz na dzień); w jaskini słona.
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "Ludzie";
    const T = window.Tawerna;
    if (!T) throw new Error("Ludzie.js: brak TawernaCore.js");
    const D = window.LudzieData;
    if (!D || !D.ready) { console.warn("Ludzie.js: brak Ludzie_Data.js - paczka C wyłączona"); window.Ludzie = T.register(PLUGIN, { PKG: "C", ready: false }); return; }
    const M = D.MAP, EV = D.EV, TX = D.TX;
    const COIN_ICON = 314, STAMINA_ICON = 82;
    const HERO = { id: 0, name: "" };
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const named = id => { const it = item(id); return it && it.name ? it : null; };
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const iconOf = id => (item(id) ? item(id).iconIndex : 0);
    const OK = () => T.api("Okolice") || window.Okolice || null;
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const HU = () => T.api("Hunting") || window.Hunting || null;
    const HM = () => T.api("Humans") || window.Humans || null;
    const SBl = () => T.api("SpeechBubbles") || window.SpeechBubbles || null;
    const GZ = () => T.api("Garnizon") || window.Garnizon || null;
    const RA = () => window.RoamingActor || null;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const onMap = id => !!(window.$gameMap && $gameMap.mapId() === id);
    const report = (where, e) => console.error("[Ludzie] " + where + ":", e);
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const inRect = (z, x, y) => !!z && x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h;
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
    const heroAt = (x, y) => dist($gamePlayer.x, $gamePlayer.y, x, y);
    function hash(a, b) {
        let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    const OPTS = { auto: true, kilnWait: 0 };   // tests: no men spawned by themselves (the camp, Sławek); the frames before the kiln's thieves come

    // ------------------------------------------------------------------
    // The state (the save)
    // ------------------------------------------------------------------
    const store = T.state.define("ludzie", () => ({
        shop: { coalCycle: -1, coalN: 0, water: 0, rumour: 0, map: 0, steel: 0, shear: 0, told: {} },
        order: null,                                                   // wood given to Zbych: { day, ready }
        k63: null, k64: null, k65: null, k66: null,                    // the quests' own records
        camp: { beaten: 0, gone: 0 },                                  // the diggers' camp (C5)
        d35: { journal: 0, how: "", end: 0, hits: 0 },
        d34: { taken: 0, opened: 0, given: "", stash: 0, gave: 0 },
        graves: { c: [0, 0, 0], done: 0 },
        force: { camp: false, cave: false, storm: 0 }
    }), { version: 1, owner: PLUGIN });
    const S = () => store();

    // TownQuests' flags, records, opinion
    const qstate = () => { const q = TQ(); return q && q.state ? q.state() : null; };
    const flags = () => { const s = qstate(); return s ? s.flags : {}; };
    const flag = k => !!flags()[k];
    function setFlag(k) { const f = flags(); if (f && k && !f[k]) f[k] = day(); }
    const vgive = (k, n) => { const s = qstate(); if (s && s.v) s.v[k] = (s.v[k] || 0) + (n || 1); };
    const vcount = k => { const s = qstate(); return s && s.v ? s.v[k] || 0 : 0; };
    const rec = id => { const q = TQ(); return q && q.rec ? q.rec(id) : null; };
    const isActive = id => { const r = rec(id); return !!r && r.s === "active"; };
    const isDone = id => { const r = rec(id); return !!r && (r.s === "done" || (r.times || 0) > 0); };
    const atStep = (id, i) => { const r = rec(id); return !!r && r.s === "active" && r.step === i; };
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const opinion = (n, why) => { const q = TQ(); return q && q.addOpinion ? q.addOpinion(n, why) : 0; };
    const xp = (n, why) => T.call("Combat", "gainXp", n, why || "Ludzie", true);
    const autoChecks = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    // the chapter of an arc (W5, W8): 0 not begun, its step's "ch" while active, 9 done
    function arcCh(id) {
        const q = TQ(), r = rec(id);
        if (!r) return 0;
        if (r.s === "done") return 9;
        if (r.s !== "active") return 0;
        const st = q && q.Q && q.Q[id] ? q.Q[id].steps[r.step] : null;
        return st ? st.ch || 0 : 0;
    }

    // ------------------------------------------------------------------
    // Talk helpers (event commands; "> " the hero, "@key: " a resident nearby) - the way TownQuests writes them
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
    const cmdAct = (out, args, ind) => (out.push(C(355, ["Ludzie.act(this, " + JSON.stringify(args) + ")"], ind)), out);
    const end = list => list.concat([C(0, [])]);
    const say = (ch, text, frames) => { const sb = SBl(); if (sb && sb.say && ch) sb.say(ch, text, frames || 200); };
    const sayLater = (interp, list) => { if (interp && list && list.length) interp.setupChild(end(list), interp.eventId()); };
    const info = text => T.popup(text, { kind: "info" });

    // ------------------------------------------------------------------
    // The cycles: the kiln, the pedlar's stops, the shepherd by the menhirs, the flock
    // ------------------------------------------------------------------
    const workDay = dawn => (hour() < dawn ? day() - 1 : day());
    const kilnDay = () => ((workDay(D.CYCLE.kiln.dawn) % D.CYCLE.kiln.every) + D.CYCLE.kiln.every) % D.CYCLE.kiln.every;
    const zbychAtKiln = () => D.CYCLE.kiln.work.includes(kilnDay());
    // "cold" | "burn" | "ready": the cycle's (burning on its days 2-3, ready on 4) or K63's own burn (from 20:00 of the wood's day
    // for two days, then ready a day)
    function kilnState() {
        if (!has()) return "cold";
        const k = S().k63, d = day(), h = hour();
        if (k && k.burn && !k.taken) {
            const t = d * 24 + h, a = k.burn * 24 + 20, b = (k.burn + 2) * 24 + 8;
            if (t >= a && t < b) return "burn";
            if (t >= b && t < b + 24) return "ready";
        }
        const c = kilnDay();
        if (D.KILN.burn.includes(c)) return "burn";
        if (D.KILN.ready.includes(c)) return "ready";
        return "cold";
    }
    const mielerzBurning = () => kilnState() === "burn";
    const kilnCycle = () => Math.floor((workDay(D.CYCLE.kiln.dawn) - D.CYCLE.kiln.work[0]) / D.CYCLE.kiln.every);
    const stopIndex = () => ((workDay(D.CYCLE.dawn) % 4) + 4) % 4;
    const stopMap = () => D.CYCLE.stops[stopIndex()];
    const stopName = m => ({ 22: "Polna droga", 21: "Leśna droga", 4: "Łąka", 3: "Kruczy Jar" })[m === undefined ? stopMap() : m] || "";
    function pasterz018() {
        if (!has()) return false;
        const p = D.CYCLE.pasture018, h = hour();
        return day() % p.every === p.at && h >= p.hours[0] && h < p.hours[1];
    }
    // where the flock is now: 18 (by the menhirs) or 4; "pasture" / "fold"
    const flockMap = () => (pasterz018() ? M.menhiry : M.laka);
    const flockOut = () => { const h = hour(); return h >= D.CYCLE.flock.out && h < D.CYCLE.flock.home; };
    const campActive = () => has() && !S().camp.gone && (S().force.camp || arcCh("W8") >= 3);
    const caveOpen = () => has() && (S().force.cave || arcCh("W5") >= 4);
    function tideLow() {
        const W = T.api("Wyspa") || window.Wyspa;
        try { return !!(W && W.tide && W.tide().low); } catch (e) { return true; }
    }
    const baltazarOk = () => !flag("w5BaltazarWrog") && !T.call("TownLife", "gone", "kupiec");
    const grumOk = () => { const q = TQ(); try { return !(q && q.grumAway && q.grumAway()); } catch (e) { return true; } };
    function stormRecently() {
        if (!has()) return false;
        if (S().force.storm && day() - S().force.storm <= 2) return true;
        const Sv = T.api("Survival") || window.Survival;
        if (!Sv || !Sv.weatherPlan) return false;
        const d = day(), h = hour(), p0 = Sv.weatherPlan(d);
        if (p0 && p0.storm && h >= p0.storm.end) return true;
        for (const k of [1, 2]) { const p = d - k >= 1 ? Sv.weatherPlan(d - k) : null; if (p && p.storm) return true; }
        return false;
    }

    // ------------------------------------------------------------------
    // The places, the discoveries, TownLife's conditions and homes
    // ------------------------------------------------------------------
    (function register() {
        const O = OK();
        if (O && O.registerSpots) O.registerSpots("C", D.SPOTS);
        if (O && O.discoverable) for (const d of D.DISCOVER) O.discoverable(Object.assign({ pkg: "C", xp: 25 }, d, d.key === "lud_oboz" ? { when: () => campActive() } : {}));
        const L = TL();
        if (L && L.addCondition) {
            L.addCondition("ludMielerz", () => has() && zbychAtKiln());
            L.addCondition("ludHandlarzW", () => has() && stopMap() !== M.polna);
            L.addCondition("ludPasterz018", () => has() && pasterz018());
            L.addCondition("ludNocnyPatrol", () => has() && patrolNightOn());
        }
        if (L && L.HOMES) for (const m of D.CYCLE.stops) L.HOMES.add(m);
    })();
    function patrolNightOn() { const h = hour(); return atStep("K66", 0) && h >= 20.5 && S().k66 && S().k66.night === (h < 12 ? day() - 1 : day()); }

    // ------------------------------------------------------------------
    // The events (Tawerna.inject 2500-2699): built for each map; shown / hidden at runtime by the state
    // ------------------------------------------------------------------
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function eventData(id, name, x, y, o) {
        o = o || {};
        const img = o.img || ["", 0, 2, 1];
        const page = { conditions: Object.assign({}, BLANK), directionFix: o.fix !== false, image: { tileId: 0, characterName: img[0], direction: img[2], pattern: img[3], characterIndex: img[1] },
            list: o.list || [C(355, ["Ludzie.act(this);"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false },
            moveSpeed: o.speed || 3, moveType: 0, priorityType: o.priority === undefined ? 1 : o.priority, stepAnime: !!o.step, through: !!o.through, trigger: 0,
            walkAnime: !!o.walk };
        return { id, name: "Ludzie: " + name, note: "<Ludzie:" + (o.key || name) + ">" + (o.note || ""), pages: [page], x, y };
    }
    const FIRE = ["!Decoration", 2, 4, 0];
    const fireEv = (id, at, key) => eventData(id, "Ognisko", at[0], at[1], { key, img: FIRE, step: true, speed: 3 });
    const BIG = "<Occupy:left=1,right=1,up=1>";
    function build(data, mapId) {
        const out = [];
        if (mapId === M.droga) {
            out.push(eventData(EV.mielerz, "Mielerz", D.KILN_AT.x, D.KILN_AT.y, { key: "mielerz", img: ["!$Lud_Mielerz", 0, 2, 1], note: "<Occupy:left=1,right=1,up=2>" }));
            out.push(eventData(EV.dym, "Dym z mielerza", D.KILN_AT.x, D.KILN_AT.y - 2, { key: "dym", img: ["!Fantasy_chimney", 0, 2, 1], priority: 2, through: true, step: true, list: [C(0, [])] }));
            out.push(eventData(EV.szalas, "Szałas węglarza", D.SHED_AT.x, D.SHED_AT.y, { key: "szalas", img: ["!$Lud_Szalas", 0, 2, 1], note: BIG }));
            out.push(fireEv(EV.ogien021, D.STOPS[21].ogien, "ogien"));
            out.push(eventData(EV.tobol021, "Tobołek handlarza", D.STOPS[21].tobol[0], D.STOPS[21].tobol[1], { key: "tobol", img: ["!$Lud_Juk", 0, 2, 1] }));
            const k = has() ? S().k65 : null, j = D.JUK_SPOTS[k && k.spot >= 0 ? k.spot : 0];
            out.push(eventData(EV.juk, "Zgubiony juk", j[0], j[1], { key: "juk", img: ["!$Lud_Juk", 0, 2, 1] }));
        } else if (mapId === M.polna || mapId === M.laka || mapId === M.domek) {
            const st = D.STOPS[mapId], ids = { 22: [EV.woz022, EV.osiol022, EV.ogien022], 4: [EV.woz004, 0, EV.ogien004], 3: [EV.woz003, EV.osiol003, EV.ogien003] }[mapId];
            out.push(eventData(ids[0], "Wóz handlarza", st.woz[0], st.woz[1], { key: "woz", img: ["!$Lud_Woz", 0, 2, 1], note: BIG }));
            if (ids[1] && st.osiol) out.push(eventData(ids[1], "Osiołek handlarza", st.osiol[0], st.osiol[1], { key: "osiol", img: ["!$Lud_Osiol", 0, 2, 0], step: true, speed: 2 }));
            out.push(fireEv(ids[2], st.ogien, "ogien"));
            if (mapId === M.laka) {
                out.push(eventData(EV.koszar, "Koszar", D.FOLD.gate[0], D.FOLD.gate[1], { key: "koszar", img: ["!$Lud_Koszar", 0, 2, 1], priority: 0, through: true }));
                D.FOLD.fence.forEach(([x, y], i) => out.push(eventData(EV.plot[0] + i, "Płot koszaru", x, y, { key: "plot" })));
                const O = OK();
                if (O && O.blank) out.push(Object.assign(O.blank(EV.krzak004, 47, 49, "Znacznik pastwiska (krzak)"), {}));
            }
        } else if (mapId === M.gory) {
            const c = D.CAMP;
            out.push(eventData(EV.namiotA, "Namiot kopaczy", c.tentA[0], c.tentA[1], { key: "namiot", img: ["!$Mt_Tent", 0, 2, 1], note: BIG }));
            out.push(eventData(EV.namiotB, "Namiot kopaczy", c.tentB[0], c.tentB[1], { key: "namiot", img: ["!$Mt_Tent", 0, 2, 1], note: BIG }));
            out.push(eventData(EV.skrzyniaKop, "Skrzynia dowódcy kopaczy", c.chest[0], c.chest[1], { key: "skrzyniaKop", img: ["!$Lud_Skrzynia", 0, 2, 1] }));
            out.push(fireEv(EV.ogienKop, c.fire, "ogienKop"));
            out.push(eventData(EV.szyb, "Szyb poszukiwawczy", c.shaft[0], c.shaft[1], { key: "szyb", img: ["!$Lud_Szyb", 0, 2, 1] }));
            out.push(eventData(EV.skrzynkiA, "Skrzynie kopaczy", c.crates[0][0], c.crates[0][1], { key: "skrzynki", img: ["!$Lud_Skrzynia", 0, 2, 0] }));
            out.push(eventData(EV.skrzynkiB, "Skrzynie kopaczy", c.crates[1][0], c.crates[1][1], { key: "skrzynki", img: ["!$Lud_Skrzynia", 0, 2, 2] }));
            const O = OK();
            if (O && O.blank) out.push(O.blank(EV.krzak013, c.bush[0], c.bush[1], "Znacznik obozu (krzak)"));
        } else if (mapId === M.przystan) {
            out.push(eventData(EV.wylot, "Wylot jaskini", D.CAVE.mouth[0], D.CAVE.mouth[1], { key: "wylot", img: ["!$Lud_Jaskinia", 0, 2, 1], note: "<Occupy:right=1><LudOff:24,0>" }));
        } else if (mapId === M.zagroda) {
            D.GRAVES.crosses.forEach(([x, y], i) => out.push(eventData(EV.krzyz[i], "Stary krzyż Ługów", x, y, { key: "krzyz", img: ["!$Lud_KrzyzStary", 0, 2, i] })));
            out.push(eventData(EV.lawka, "Ławka przy grobach", D.GRAVES.bench[0], D.GRAVES.bench[1], { key: "lawka", img: ["!$Lud_Lawka", 0, 2, 1], priority: 0, through: true, note: "<LudOff:24,0>" }));
            out.push(eventData(EV.marta, "Marta Ługowa", D.GRAVES.marta[0], D.GRAVES.marta[1], { key: "marta", img: ["$Npc_Praczka", 0, 8, 1], fix: false, walk: true }));
        }
        return out.filter(e => e && e.x >= 0 && e.y >= 0 && e.x < data.width && e.y < data.height);
    }
    T.inject([M.droga, M.polna, M.laka, M.domek, M.gory, M.przystan, M.zagroda], { ids: D.IDS, owner: PLUGIN, build });

    const evOf = id => (window.$gameMap ? $gameMap.event(id) : null);
    const keyOf = ev => { const d = ev && ev.event(), m = d && /<Ludzie:(\w+)>/.exec(d.note || ""); return m ? m[1] : ""; };
    const mine = ev => !!ev && ev.eventId() >= D.IDS[0] && ev.eventId() <= D.IDS[1] && !!keyOf(ev);
    function remember(ev) { if (ev && ev._ludPrio === undefined) { ev._ludPrio = ev._priorityType; ev._ludThrough = ev.isThrough(); } }
    function showEv(ev, dir, pattern) {
        if (!ev) return;
        remember(ev);
        if (ev._ludHidden !== false) { ev.setTransparent(false); ev.setThrough(!!ev._ludThrough); ev._priorityType = ev._ludPrio; ev._ludHidden = false; }
        if (dir && ev._directionFix) ev._direction = dir; else if (dir) ev.setDirection(dir);
        if (pattern !== undefined && ev._directionFix) { ev._pattern = pattern; ev._originalPattern = pattern; }
    }
    function hideEv(ev) {
        if (!ev || ev._ludHidden === true) return;
        remember(ev);
        ev._ludHidden = true;
        ev.setTransparent(true); ev.setThrough(true); ev._priorityType = 0;
    }
    const setShown = (ev, on, dir, pattern) => (on ? showEv(ev, dir, pattern) : hideEv(ev));
    // hidden, it never starts (the action button on its cell, a touch)
    const _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        if (this._ludHidden === true) return;
        _Game_Event_start.call(this);
    };
    // <LudOff:dx,dy>: the picture moved by some pixels (the cave's mouth over two cells, the bench)
    const offOf = ev => {
        if (ev._ludOff !== undefined) return ev._ludOff;
        const d = ev.event && ev.event(), m = d && /<LudOff:(-?\d+),(-?\d+)>/.exec(d.note || "");
        return (ev._ludOff = m ? [Number(m[1]), Number(m[2])] : null);
    };
    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        const ch = this._character;
        // (2026-10-22: also the cave's own events on Map177 - its table has <LudOff:24,0> in the map file)
        if (ch instanceof Game_Event && ((ch.eventId() >= D.IDS[0] && ch.eventId() <= D.IDS[1]) || $gameMap.mapId() === D.MAP.jaskinia)) { const o = offOf(ch); if (o) { this.x += o[0]; this.y += o[1]; } }
    };

    // the looks by the state (every 20 frames and as the map comes up)
    function syncMap() {
        if (!has()) return;
        const id = $gameMap.mapId(), h = hour(), night = h >= 18 || h < 8, stop = stopMap();
        if (id === M.droga) {
            const ks = kilnState(), kiln = evOf(EV.mielerz);
            showEv(kiln, ks === "burn" ? 4 : ks === "ready" ? 6 : 2, ks === "burn" ? Math.floor(Graphics.frameCount / 14) % 3 : 1);
            setShown(evOf(EV.dym), ks === "burn");
            showEv(evOf(EV.szalas));
            setShown(evOf(EV.ogien021), stop === M.droga && night);
            setShown(evOf(EV.tobol021), stop === M.droga);
            const k = S().k65, juk = evOf(EV.juk), on = atStep("K65", 0) && !!k && !k.picked;
            if (on && juk) { const j = D.JUK_SPOTS[k.spot || 0]; if (juk.x !== j[0] || juk.y !== j[1]) juk.locate(j[0], j[1]); }
            setShown(juk, on);
        } else if (D.STOPS[id] && id !== M.droga) {
            const here = stop === id;
            const ids = { 22: [EV.woz022, EV.osiol022, EV.ogien022], 4: [EV.woz004, 0, EV.ogien004], 3: [EV.woz003, EV.osiol003, EV.ogien003] }[id];
            setShown(evOf(ids[0]), here);
            if (ids[1]) setShown(evOf(ids[1]), here);
            setShown(evOf(ids[2]), here && night);
            if (id === M.laka) showEv(evOf(EV.koszar));
        } else if (id === M.gory) {
            const on = campActive(), s = S();
            for (const e of [EV.namiotA, EV.namiotB, EV.skrzyniaKop, EV.ogienKop, EV.skrzynkiA, EV.skrzynkiB]) setShown(evOf(e), on);
            const chest = evOf(EV.skrzyniaKop);
            if (on && chest) showEv(chest, s.d35.journal ? 4 : 2, 1);
            const shaft = evOf(EV.szyb), filled = !!s.d35.how;
            setShown(shaft, on || filled, filled ? 4 : 2, 1);
        } else if (id === M.przystan) {
            showEv(evOf(EV.wylot));
        } else if (id === M.zagroda) {
            const g = S().graves;
            D.GRAVES.crosses.forEach((c, i) => showEv(evOf(EV.krzyz[i]), g.c[i] >= D.GRAVES.blows ? 4 : 2, i));
            showEv(evOf(EV.lawka));
            syncMarta();
        }
    }
    // Marta at the old graves instead of at Jan's cross: her grave day (Homes), every second one, once the graves are cleaned
    function martaHere() {
        if (!has() || !S().graves.done) return false;
        const Hm = T.api("Homes") || window.Homes;
        try { return !!(Hm && Hm.martaAway && Hm.martaAway()) && Math.floor(day() / 7) % 2 === 0; } catch (e) { return false; }
    }
    function syncMarta() {
        const on = martaHere(), ev = evOf(EV.marta);
        setShown(ev, on);
        const Hm = T.api("Homes") || window.Homes, other = Hm && Hm.MARTA ? evOf(Hm.MARTA) : null;
        if (!other) return;
        if (on) { if (!other._ludHid) { other._ludHid = true; } other.setTransparent(true); other.setThrough(true); }
        else if (other._ludHid) { other._ludHid = false; other.setTransparent(false); other.setThrough(false); other.refresh(); }
    }

    // ------------------------------------------------------------------
    // The sheep: our own characters (not Hunting's animals - no wolf, no dog goes for them); the flock and the lost one
    // ------------------------------------------------------------------
    function Game_LudSheep() { this.initialize(...arguments); }
    Game_LudSheep.prototype = Object.create(Game_Character.prototype);
    Game_LudSheep.prototype.constructor = Game_LudSheep;
    Game_LudSheep.prototype.initialize = function(x, y, o) {
        Game_Character.prototype.initialize.call(this);
        o = o || {};
        this._lud = { role: o.role || "flock", mode: o.mode || "wander", zone: o.zone || null, cell: o.cell || null, after: o.after || "wander",
            wait: rnd(30, 200), steps: 0, heading: 2, stuck: 0, bleat: Graphics.frameCount + rnd(300, 900) };
        this.setImage("$Animal_Sheep", 0);
        this.setPosition(x, y);
        this.setDirection([2, 4, 6, 8][rnd(0, 3)]);
        this.setMoveSpeed(o.role === "lost" ? 3.6 : 3);
        this.setMoveFrequency(5);
        this.setWalkAnime(true);
        this.setStepAnime(false);
        this.setThrough(false);
        this.setPriorityType(1);
    };
    Game_LudSheep.prototype.isLudSheep = function() { return true; };
    Game_LudSheep.prototype.inZone = function(x, y) { const z = this._lud.zone; return !z || (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h); };
    Game_LudSheep.prototype.isMapPassable = function(x, y, d) {
        if (!Game_Character.prototype.isMapPassable.call(this, x, y, d)) return false;
        if (this._lud.mode !== "wander") return true;
        return this.inZone($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d));
    };
    Game_LudSheep.prototype.isCollidedWithCharacters = function(x, y) {
        if (Game_Character.prototype.isCollidedWithCharacters.call(this, x, y)) return true;
        if (Math.abs($gamePlayer._realX - x) < 0.95 && Math.abs($gamePlayer._realY - y) < 0.95) return true;
        return sheep.some(a => a !== this && ((a._x === x && a._y === y) || (Math.round(a._realX) === x && Math.round(a._realY) === y)));
    };
    Game_LudSheep.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        if (this._frozen || this.isMoving()) return;
        try { this.think(); } catch (e) { report("owca", e); this._frozen = true; }
    };
    const onScreen = ch => { const x = ch.screenX(), y = ch.screenY(); return x > -48 && y > -48 && x < T.view.w() + 48 && y < T.view.h() + 96; };
    const cellTaken = (x, y, self) => ($gamePlayer.x === x && $gamePlayer.y === y) || $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough())
        || sheep.some(a => a !== self && a._x === x && a._y === y);
    Game_LudSheep.prototype.goTo = function(tx, ty, near) {
        const L = this._lud, H = HU(), R = RA();
        const d = H && H.path8 ? H.path8(this, tx, ty, { key: "ludOwca", near: near ? 1 : 0 }).dir : this.findDirectionTo(tx, ty);
        if (d > 0 && (R ? R.canStep(this, this.x, this.y, d) : this.canPass(this.x, this.y, d))) { if (R) R.step(this, d); else this.moveStraight(d); L.stuck = 0; return true; }
        if (++L.stuck > (onScreen(this) ? 420 : 60)) {   // (round some other way - not onto someone)
            L.stuck = 0;
            if (near) { const c = freeBeside($gamePlayer.x, $gamePlayer.y, this); if (c) this.locate(c[0], c[1]); }
            else if (!cellTaken(tx, ty, this)) this.locate(tx, ty);
        }
        return false;
    };
    Game_LudSheep.prototype.think = function() {
        const L = this._lud;
        if (L.mode === "follow") {
            const d = dist(this.x, this.y, $gamePlayer.x, $gamePlayer.y);
            if (d > 9 && !onScreen(this)) { const c = freeBeside($gamePlayer.x, $gamePlayer.y, this); if (c) this.locate(c[0], c[1]); return; }
            if (d > 1.5) this.goTo($gamePlayer.x, $gamePlayer.y, true); else this.turnTowardCharacter($gamePlayer);
            this.bleatMaybe();
            return;
        }
        if (L.mode === "go" && L.cell) {
            if (this.x === L.cell[0] && this.y === L.cell[1]) { L.mode = L.after || "wander"; L.wait = rnd(40, 160); return; }
            this.goTo(L.cell[0], L.cell[1]);
            return;
        }
        if (L.mode === "lost") { if (--L.wait <= 0) { L.wait = rnd(120, 300); this.setDirection([2, 4, 6, 8][rnd(0, 3)]); } this.bleatMaybe(); return; }
        if (L.mode === "rest") { if (--L.wait <= 0) { L.wait = rnd(200, 500); if (Math.random() < 0.5) this.setDirection([2, 4, 6, 8][rnd(0, 3)]); } return; }
        // wander (as Livestock's animals): a step aside from the hero, short walks inside the zone, a look round
        const dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY, R = RA();
        if (Math.hypot(dx, dy) < 1.5 && R) { const away = R.fleeDirection(this, dx, dy, { startAtDistance: true, margin: 0.05 }); if (away) { this.moveStraight(away); L.steps = 0; L.wait = 8; return; } }
        if (L.steps > 0) { if (this.canPass(this.x, this.y, L.heading)) { L.steps--; this.moveStraight(L.heading); return; } L.steps = 0; }
        if (L.wait-- > 0) return;
        L.wait = rnd(60, 240);
        const dirs = [2, 4, 6, 8].filter(d => this.canPass(this.x, this.y, d));
        if (!dirs.length || Math.random() < 0.3) { this.setDirection([2, 4, 6, 8][rnd(0, 3)]); return; }
        L.heading = dirs.includes(L.heading) && Math.random() < 0.5 ? L.heading : pick(dirs);
        L.steps = rnd(0, 2);
        this.moveStraight(L.heading);
    };
    Game_LudSheep.prototype.bleatMaybe = function() {
        if (Graphics.frameCount < this._lud.bleat) return;
        this._lud.bleat = Graphics.frameCount + rnd(600, 1400);
        if (heroAt(this.x, this.y) > 8) return;
        T.audio.se("Sheep", { volume: 55, pitch: 95 + rnd(0, 15) });
        say(this, pick(["Beee...", "Bee!", "Meee..."]), 110);
    };
    function freeBeside(x, y, self) {
        for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) {
            const nx = x + dx, ny = y + dy;
            if ($gameMap.isValid(nx, ny) && $gameMap.checkPassage(nx, ny, 0x0f) && !cellTaken(nx, ny, self)) return [nx, ny];
        }
        return null;
    }
    let sheep = [], flockMode = "", sheepMap = 0;
    function addSheep(x, y, o, set) {
        const a = new Game_LudSheep(x, y, o);
        sheep.push(a);
        const R = RA();
        if (R) R.addSprite(a, set);
        return a;
    }
    function clearSheep() {
        const R = RA();
        for (const a of sheep) if (R) R.dropSprite(a);
        sheep = [];
        flockMode = "";
    }
    const lostNow = () => { const k = S().k64; if (isActive("K64")) return !(k && k.home); const q = TQ(); try { return !!(q && q.offerable && q.offerable("K64")); } catch (e) { return false; } };
    const flockSize = () => D.CYCLE.flock.size - (lostNow() ? 1 : 0);
    function zoneCells(z) {
        const out = [];
        for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) {
            if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough())) out.push([x, y]);
        }
        return out;
    }
    // what the flock does here now: "pasture" | "fold" | "" (not here)
    function flockWanted() {
        const id = $gameMap.mapId(), fm = flockMap();
        if (id === M.menhiry) return fm === M.menhiry ? "pasture" : "";
        if (id !== M.laka) return "";
        if (fm === M.menhiry) return "";
        return flockOut() ? "pasture" : "fold";
    }
    function spawnSheep(set) {
        if (!has()) return;
        clearSheep();
        sheepMap = $gameMap.mapId();
        const want = flockWanted();
        if (want) {
            const n = flockSize(), z = D.PASTURE[sheepMap], cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();
            for (let i = 0; i < n && cells.length; i++) {
                const c = want === "pasture" ? cells.splice(rnd(0, cells.length - 1), 1)[0] : cells[i];
                if (!c) break;
                addSheep(c[0], c[1], want === "pasture" ? { zone: z, mode: "wander" } : { mode: "rest", cell: c }, set);
            }
            flockMode = want;
        }
        // the lost one: on Omszała łąka where the shepherd saw it, or after the hero
        const k = S().k64;
        if (k && isActive("K64") && !k.home) {
            if (k.follow) {
                const c = freeBeside($gamePlayer.x, $gamePlayer.y, null) || [$gamePlayer.x, $gamePlayer.y + 1];
                addSheep(c[0], c[1], { role: "lost", mode: "follow" }, set);
            } else if (sheepMap === M.omszala) {
                const s = D.SHEEP_SPOTS[k.spot || 0];
                addSheep(s[0], s[1], { role: "lost", mode: "lost" }, set);
            }
        }
    }
    // the day's turns while he watches: out to the pasture at 7, into the fold at 18:30, off to the menhirs
    function flockTick() {
        if ($gameMap.mapId() !== sheepMap) return;
        const want = flockWanted();
        if (want === flockMode) return;
        const flock = sheep.filter(a => a._lud.role === "flock");
        if (!want) { for (const a of flock) { const R = RA(); if (R) R.dropSprite(a); } sheep = sheep.filter(a => a._lud.role !== "flock"); flockMode = ""; return; }
        if (!flockMode) { const keep = sheep.filter(a => a._lud.role !== "flock"); sheep = keep; spawnSheep(); return; }
        const z = D.PASTURE[sheepMap], cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();
        flock.forEach((a, i) => {
            const c = want === "pasture" ? cells.splice(rnd(0, Math.max(0, cells.length - 1)), 1)[0] : cells[i];
            if (!c) return;
            Object.assign(a._lud, { mode: "go", cell: c, after: want === "pasture" ? "wander" : "rest", zone: want === "pasture" ? z : null, stuck: 0 });
        });
        flockMode = want;
    }
    // the lost sheep led home: on Łąka, on the pasture or by the fold's gate
    function lostTick() {
        const k = S().k64;
        if (!k || !k.follow || k.home || !onMap(M.laka)) return;
        const a = sheep.find(s => s._lud.role === "lost");
        if (!a) return;
        const z = D.PASTURE[M.laka], g = D.FOLD.gate;
        if (!(inRect(z, a.x, a.y) || dist(a.x, a.y, g[0], g[1]) <= 2.5)) return;
        k.home = day();
        k.follow = false;
        a._lud.role = "flock";
        Object.assign(a._lud, flockOut() ? { mode: "wander", zone: z } : { mode: "go", cell: D.FOLD.cells[Math.min(5, sheep.length - 1)], after: "rest", zone: null });
        T.popup(TX.sheepHome, { icon: iconOf(111), kind: "good" });
        T.audio.se("Sheep", { volume: 70, pitch: 105 });
        autoChecks();
    }
    const sheepAhead = () => {
        const d = $gamePlayer.direction(), x = $gameMap.roundXWithDirection($gamePlayer.x, d), y = $gameMap.roundYWithDirection($gamePlayer.y, d);
        return sheep.find(a => (a._x === x && a._y === y) || (a._x === $gamePlayer.x && a._y === $gamePlayer.y)) || null;
    };
    function touchSheep(a) {
        const L = a._lud;
        if (L.role === "lost" && L.mode === "lost") {
            const k = S().k64;
            if (k) { k.follow = true; k.found = k.found || day(); }
            L.mode = "follow";
            a.turnTowardCharacter($gamePlayer);
            T.popup(TX.sheepFound, { icon: iconOf(111), kind: "good" });
            T.audio.se("Sheep", { volume: 80, pitch: 100 });
            autoChecks();
            return true;
        }
        info(L.role === "lost" ? TX.sheepLost : TX.sheepLook);
        return true;
    }
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && sheep.length && !$gameMap.isEventRunning()) {
            const a = sheepAhead();
            if (a) { try { if (touchSheep(a)) return true; } catch (e) { report("owca", e); } }
        }
        return _Game_Player_triggerButtonAction.call(this);
    };
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        if (sheep.length && this.mapId() === sheepMap) for (const a of sheep.slice()) a.update();
    };
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        const R = RA();
        for (const a of sheep) { a._sprite = null; if (R) R.addSprite(a, this); }
        // the flames' light at night (Farming_Render's dark - its lights list on the instance, as Humans.js and Latarnia.js do)
        const nl = this._nightLight;
        if (nl && typeof nl.lights === "function" && !nl._ludzieLit) {
            const base = nl.lights;
            nl.lights = function() { const out = base.call(this); try { out.push(...lightsNow()); } catch (e) { /* no light of ours this frame */ } return out; };
            nl._ludzieLit = true;
        }
    };
    T.on("load", () => clearSheep(), { owner: PLUGIN });
    T.on("mapEnter", () => clearSheep(), { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The flames: the kiln's glow, the fires (the pedlar's, the diggers'), the patrol's lantern on the night round
    // ------------------------------------------------------------------
    function lightsNow() {
        const out = [];
        if (!has()) return out;
        const add = (ev, r, i, hf, up) => {
            if (!ev || ev._ludHidden === true || ev.isTransparent()) return;
            const x = ev.screenX(), y = ev.screenY();
            out.push({ x, y: y - (up || 12), r, i, id: 9500 + (ev.eventId() % 1000), gx: x, gy: y, hf, glow: true });
        };
        const id = $gameMap.mapId();
        if (id === M.droga && kilnState() === "burn") add(evOf(EV.mielerz), 230, 0.8, 14, 40);
        for (const e of [EV.ogien021, EV.ogien022, EV.ogien004, EV.ogien003, EV.ogienKop]) {
            const ev = evOf(e);
            if (ev && mine(ev)) add(ev, 300, 1, 18, 10);
        }
        if (id === M.przyladek && patrolNightOn()) {
            const L = TL(), lead = L && L.eventOf ? L.eventOf("patrol_latarnia_1") : null;
            if (lead && !(lead._town && lead._town.hidden)) { const x = lead.screenX(), y = lead.screenY(); out.push({ x, y: y - 40, r: 170, i: 0.75, id: 9490, gx: x, gy: y, hf: 20, glow: true }); }
        }
        return out;
    }

    // ------------------------------------------------------------------
    // Blows by hand (the old graves, the shaft's props): one a press, held O goes on (the crouching swing - hands, no tool picture)
    // ------------------------------------------------------------------
    let again = null;
    const facingEv = ev => {
        const d = $gamePlayer.direction(), x = $gameMap.roundXWithDirection($gamePlayer.x, d), y = $gameMap.roundYWithDirection($gamePlayer.y, d);
        return !!ev && ev.pos(x, y);
    };
    function strike(ev, spec) {
        if (!spec.can()) return false;
        const F = T.api("Farming"), cost = F && F.hitCost ? F.hitCost() : 2;
        if (cost > 0 && typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(cost)) { T.popup.need(STAMINA_ICON, "Jesteś zbyt zmęczony"); return false; }
        const c = T.api("Combat"), rate = c && c.workSpeed ? c.workSpeed() : 1;
        const next = () => { again = { id: ev.eventId(), spec, at: Graphics.frameCount + Math.max(2, Math.round(12 / rate)) }; };
        const started = $gamePlayer.startToolSwing && $gamePlayer.startToolSwing(6, () => spec.blow(), next, { rate });
        if (!started) { spec.blow(); next(); }
        return true;
    }
    T.onMapUpdate(() => {
        if (!again || Graphics.frameCount < again.at) return;
        const a = again;
        again = null;
        try {
            if (!Input.isPressed("ok") || !T.isCalm(null, { only: ["farmMenu", "build", "event", "message", "tool"] })) return;
            const ev = evOf(a.id);
            if (ev && facingEv(ev) && a.spec.can()) strike(ev, a.spec);
        } catch (e) { report("cios", e); }
    }, { owner: PLUGIN, name: "hold" });

    // ------------------------------------------------------------------
    // The trades
    // ------------------------------------------------------------------
    const pedlarMul = () => (flag("ludJukRabat") ? D.PEDLAR_DISCOUNT : 1);
    const shepherdMul = () => (flag("ludOwcaRabat") ? D.SHEPHERD_DISCOUNT : 1);
    const priceOf = (g, mul) => Math.max(1, Math.round(g.price * g.n * mul));
    // the pedlar's goods today: five of the list (a hash of the day), the map of the area while not bought
    function pedlarGoods() {
        const d = day(), list = D.PEDLAR_SELLS.filter(g => named(g.id)).map(g => ({ g, h: hash(d, g.id + 17) })).sort((a, b) => a.h - b.h).slice(0, 5).map(x => x.g);
        if (!S().shop.map && named(D.PEDLAR_MAP.id)) list.unshift({ id: D.PEDLAR_MAP.id, price: D.PEDLAR_MAP.price, n: 1, map: true });
        return list;
    }
    function shopList(spk, who) {
        const goods = who === "pasterz" ? D.SHEPHERD_SELLS.filter(g => named(g.id)) : pedlarGoods(), mul = who === "pasterz" ? shepherdMul() : pedlarMul();
        const labels = goods.map(g => item(g.id).name + (g.n > 1 ? " ×" + g.n : "") + " - " + priceOf(g, mul) + " G").concat([TX.menu.nothing]);
        return choiceTo([], labels, goods.map(g => cmdAct([], ["buy", who, g.id])).concat([[]]), labels.length - 1);
    }
    function buy(who, id) {
        const list = who === "pasterz" ? D.SHEPHERD_SELLS : pedlarGoods(), g = list.find(x => x.id === id), it = named(id);
        if (!g || !it) return false;
        const cost = priceOf(g, who === "pasterz" ? shepherdMul() : pedlarMul());
        if ($gameParty.gold() < cost) { T.popup.need(COIN_ICON, "Potrzebujesz " + cost + " G"); return false; }
        $gameParty.loseGold(cost);
        $gameParty.gainItem(it, g.n);
        T.popup(it.name + (g.n > 1 ? " ×" + g.n : ""), { icon: it.iconIndex, kind: "good" });
        T.audio.se("Shop1", { volume: 70 });
        if (g.map) {
            S().shop.map = day();
            const O = OK();
            if (O && O.revealAll) O.revealAll();
            note("Mapa okolic", "Kupiłem od wędrownego handlarza mapę okolic. Zaznaczone na niej miejsca widać teraz w dzienniku, w zakładce „Okolice” - kompas poprowadzi do każdego.");
        }
        return true;
    }
    const buysOf = who => (who === "pasterz" ? D.SHEPHERD_BUYS : D.PEDLAR_BUYS).filter(b => named(b.id) && count(b.id) > 0);
    function sellList(spk, who) {
        const list = buysOf(who);
        if (!list.length) return linesTo([], spk, who === "pasterz" ? ["Soli nie masz? Szkoda. Tylko sól od ciebie kupię."] : TX.pedlarNoBuy);
        const labels = list.map(b => item(b.id).name + " ×" + count(b.id) + " - " + b.price * count(b.id) + " G").concat([TX.menu.nothing]);
        return choiceTo([], labels, list.map(b => cmdAct([], ["sell", who, b.id])).concat([[]]), labels.length - 1);
    }
    function sell(who, id) {
        const b = (who === "pasterz" ? D.SHEPHERD_BUYS : D.PEDLAR_BUYS).find(x => x.id === id), n = count(id);
        if (!b || n <= 0) return 0;
        $gameParty.loseItem(item(id), n, false);
        $gameParty.gainGold(b.price * n);
        T.popup("+" + b.price * n + " G", { icon: COIN_ICON, kind: "good" });
        T.audio.se("Coin", { volume: 70 });
        return b.price * n;
    }
    function waterPrice() { const O = OK(); return O && O.drought && O.drought(day()) ? D.PEDLAR_WATER.drought : O && O.hot && O.hot(day()) ? D.PEDLAR_WATER.hot : D.PEDLAR_WATER.price; }
    function water(spk, interp) {
        const s = S().shop;
        if (s.water === day()) { T.popup.need(iconOf(129), TX.pedlarWaterDone); return; }
        const cost = waterPrice();
        if ($gameParty.gold() < cost) { T.popup.need(COIN_ICON, "Potrzebujesz " + cost + " G"); return; }
        $gameParty.loseGold(cost);
        s.water = day();
        const N = T.api("Needs") || window.Needs, got = N && N.drink ? N.drink(D.PEDLAR_WATER.sip) : 0;
        T.audio.se("Water1", { volume: 60 });
        T.popup("Łyk wody z beczki" + (got ? ": nawodnienie +" + got : ""), { icon: iconOf(129), kind: "good" });
        sayLater(interp, linesTo([], spk, [TX.pedlarWaterLine]));
    }
    function rumour(spk, interp) {
        const s = S().shop, O = OK();
        if (s.rumour === day()) { sayLater(interp, linesTo([], spk, TX.rumourDone)); return; }
        const list = O && O.discoverables ? O.discoverables().filter(d => !O.isFound(d.key) && !(O.known && O.known(d.key)) && !d.air) : [];
        if (!list.length) { sayLater(interp, linesTo([], spk, TX.rumourNone)); return; }
        const d = list[Math.floor(hash(day(), list.length + 3) * list.length)];
        s.rumour = day();
        O.hint(d.key);
        sayLater(interp, linesTo([], spk, [fill(TX.rumour, { map: O.mapName ? O.mapName(d.map) : "?", name: d.name.toLowerCase() })]));
    }
    // the resident's usual words (its quests' talk first - TownQuests -, else TownLife's line for the hour)
    function plainTalk(key, spk, interp) {
        const q = TQ();
        let list = null;
        try { list = q && q.talkFor ? q.talkFor(key) : null; } catch (e) { list = null; }
        if (!list || !list.length) {
            const L = TL(), t = L && L.lines ? L.lines(key) : null, h = hour();
            const slot = h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
            const lines = t ? t[slot] || t.day || [] : [];
            list = lines.length ? linesTo([], spk, [pick(lines)]) : [];
        }
        sayLater(interp, list);
    }
    // the shearing (spring, days 10-20 of the season): with shears, an hour of work, wool and pay
    const shearSeason = () => { const sh = D.SHEARING, d = day(); return T.time.season(d) === sh.season && T.time.dayOfSeason(d) >= sh.from && T.time.dayOfSeason(d) <= sh.to; };
    function shear(spk, interp) {
        const sh = D.SHEARING, s = S().shop;
        if (!shearSeason()) { info(TX.shearNo); return; }
        if (s.shear === day()) { info(TX.shearDone); return; }
        if (count(sh.tool) <= 0) { T.popup.need(item(sh.tool) ? item(sh.tool).iconIndex : 0, "Potrzebujesz nożyc"); return; }
        s.shear = day();
        T.call("Durability", "use", sh.tool);
        if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(sh.hours);
        if (item(111)) $gameParty.gainItem(item(111), sh.wool);
        $gameParty.gainGold(sh.gold);
        T.popup("Wełna ×" + sh.wool + "  ·  +" + sh.gold + " G", { icon: 367, kind: "good" });
        sayLater(interp, linesTo([], spk, TX.shearOk));
    }
    // Zbych's charcoal: 4 G a sack, 10 a burn (a burn = his 6-day cycle); the hero's wood burnt (12 -> 8 in 2 days)
    function coalLeft() { const s = S().shop, c = kilnCycle(); if (s.coalCycle !== c) { s.coalCycle = c; s.coalN = 0; } return Math.max(0, D.KILN.coalMax - s.coalN); }
    function buyCoal(n) {
        const left = coalLeft(), k = Math.min(n, left), cost = k * D.KILN.coal;
        if (k <= 0) { info(TX.coalOut); return; }
        if ($gameParty.gold() < cost) { T.popup.need(COIN_ICON, "Potrzebujesz " + cost + " G"); return; }
        $gameParty.loseGold(cost);
        S().shop.coalN += k;
        $gameParty.gainItem(item(79), k);
        T.popup("Węgiel drzewny ×" + k, { icon: item(79).iconIndex, kind: "good" });
    }
    function giveWood(spk, interp) {
        const s = S();
        if (s.order && !s.order.got) { info(TX.woodBusy); return; }
        if (count(61) < D.KILN.wood) { T.popup.need(item(61).iconIndex, "Potrzebujesz: " + item(61).name + " " + count(61) + "/" + D.KILN.wood); return; }
        $gameParty.loseItem(item(61), D.KILN.wood);
        s.order = { day: day(), ready: day() + D.KILN.days, got: 0 };
        sayLater(interp, linesTo([], spk, [TX.woodOk]));
    }
    function collectCoal(spk, interp) {
        const o = S().order;
        if (!o || o.got) return;
        if (day() < o.ready) { sayLater(interp, linesTo([], spk, [fill(TX.collectWait, { day: o.ready })])); return; }
        o.got = day();
        $gameParty.gainItem(item(79), D.KILN.give);
        T.popup("Węgiel drzewny ×" + D.KILN.give, { icon: item(79).iconIndex, kind: "good" });
        sayLater(interp, linesTo([], spk, [TX.collectOk]));
    }
    function buySteel() {
        const s = S().shop, sm = D.SMITH, it = item(sm.steel);
        if (s.steel === day()) { info(TX.smithDone); return; }
        if ($gameParty.gold() < sm.price) { T.popup.need(COIN_ICON, "Potrzebujesz " + sm.price + " G"); return; }
        $gameParty.loseGold(sm.price);
        s.steel = day();
        $gameParty.gainItem(it, 1);
        T.popup(it.name, { icon: it.iconIndex, kind: "good" });
    }

    // ------------------------------------------------------------------
    // The talks of our residents (TownLife's hook, first): the quests first when they have something (TownQuests), else the menus
    // ------------------------------------------------------------------
    function questFirst(key) {
        const q = TQ();
        if (!q) return false;
        try {
            if (q.remarkFor && q.remarkFor(key)) return true;
            if (q.talkFor && q.talkFor(key, true)) return true;
            if ((q.QUESTS || []).some(x => x.giver === key && x.offer && q.offerable && q.offerable(x.id))) return true;
        } catch (e) { /* (the quests speak through TownQuests) */ }
        return false;
    }
    const spkOf = (ev, name) => ({ id: ev.eventId(), name });
    function pedlarMenu(ev) {
        const spk = spkOf(ev, "Szymon Juczny"), h = hour();
        if (h < 7 || h >= 20) return linesTo([], spk, TX.pedlarNight);
        const out = linesTo([], spk, [pick(TX.pedlarHello)]);
        const labels = [TX.menu.buy, TX.menu.sell, TX.menu.water + " (" + waterPrice() + " G)", TX.menu.rumour, TX.menu.talk, TX.menu.bye];
        return choiceTo(out, labels, [shopList(spk, "handlarz"), sellList(spk, "handlarz"), cmdAct([], ["water"]), cmdAct([], ["rumour"]), cmdAct([], ["talk", "handlarz"]), []], 5);
    }
    function shepherdMenu(ev) {
        const spk = spkOf(ev, "Wawrzyn Owczarz"), h = hour();
        if (h < 6 || h >= 21) return linesTo([], spk, TX.shepherdNight);
        const out = linesTo([], spk, [pick(TX.shepherdHello)]);
        const labels = [TX.menu.buy, TX.menu.sell], branches = [shopList(spk, "pasterz"), sellList(spk, "pasterz")];
        if (shearSeason()) { labels.push(TX.menu.shear); branches.push(cmdAct([], ["shear"])); }
        labels.push(TX.menu.talk, TX.menu.bye);
        branches.push(cmdAct([], ["talk", "pasterz"]), []);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    function zbychMenu(ev) {
        const spk = spkOf(ev, "Zbych Smolarz"), o = S().order;
        const out = linesTo([], spk, [pick(TX.zbychHello)]);
        const left = coalLeft(), labels = [], branches = [];
        if (left > 0) {
            labels.push(TX.menu.coal + " (×1 - " + D.KILN.coal + " G)"); branches.push(cmdAct([], ["coal", 1]));
            if (left >= 5) { labels.push(TX.menu.coal + " (×5 - " + D.KILN.coal * 5 + " G)"); branches.push(cmdAct([], ["coal", 5])); }
        }
        if (o && !o.got) { labels.push(TX.menu.collect); branches.push(cmdAct([], ["collect"])); }
        else { labels.push(TX.menu.wood + " (" + D.KILN.wood + " polan)"); branches.push(cmdAct([], ["wood"])); }
        labels.push(TX.menu.talk, TX.menu.bye);
        branches.push(cmdAct([], ["talk", "drwal"]), []);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    // (2026-10-23, Bron.js) other trades of the same people, as lines of their own menus - their rules, hours and words kept:
    // addMenu(fn(key, ev) -> [{ label, cmds, say }]) - say: a line said before a soldier's choice
    const extraMenus = [];
    const addMenu = fn => { if (typeof fn === "function" && !extraMenus.includes(fn)) extraMenus.push(fn); };
    function extraRows(key, ev) {
        const out = [];
        for (const fn of extraMenus) { try { for (const r of fn(key, ev) || []) if (r && r.label) out.push(r); } catch (e) { console.error("[Ludzie] menu " + key, e); } }
        return out;
    }
    function smithMenu(ev) {
        const spk = spkOf(ev, "Tadek Młot"), it = item(D.SMITH.steel), extra = extraRows("kowal", ev);
        const out = linesTo([], spk, TX.smithHello);
        return choiceTo(out, [TX.menu.steel + " (" + (it ? it.name : "Stal") + " - " + D.SMITH.price + " G)"].concat(extra.map(r => r.label), [TX.menu.talk, TX.menu.bye]),
            [cmdAct([], ["steel"])].concat(extra.map(r => r.cmds || []), [cmdAct([], ["talk", "kowal"]), []]), extra.length + 2);
    }
    // the patrol: the search (under the garrison's favour 10) when the hero comes close, else its usual words
    let searchFor = "";
    function patrolTalk(key, ev) {
        if (searchFor !== key) return null;
        searchFor = "";
        const G = GZ(), spk = spkOf(ev, "Patrol");
        ev.turnTowardPlayer();
        const out = linesTo([], spk, TX.patrolSearch.concat(G && G.TX && G.TX.patrol ? G.TX.patrol : []));
        return cmdAct(out, ["szukaj"]);
    }
    // the extra crate (the eagle's stash, found after D34 was done): the officer or Baltazar takes it too
    function crateExtra(key, ev) {
        if (!isDone("D34") || count(D.ITEMS.skrzynia) <= 0) return null;
        if (key === "kupiec" && !baltazarOk()) return null;
        const spk = spkOf(ev, key === "celnik" ? "Sambor Kwit" : "Baltazar Vey");
        return choiceTo([], [key === "celnik" ? TX.crateLabel.celnik : TX.crateLabel.baltazar, TX.crateLabel.keep], [cmdAct([], ["d34", key === "celnik" ? "celnik" : "baltazar"]), []], 1);
    }
    function talkHook(key, ev) {
        if (!has()) return null;
        if (/^patrol_/.test(key)) return patrolTalk(key, ev);
        if (key === "celnik" || key === "kupiec") return crateExtra(key, ev);
        if (key === "handlarz") return questFirst(key) ? null : pedlarMenu(ev);
        if (key === "pasterz") return questFirst(key) ? null : shepherdMenu(ev);
        if (key === "drwal") return questFirst(key) ? null : zbychMenu(ev);
        if (key === "kowal" && flag("ludKowalRabat")) return questFirst(key) ? null : smithMenu(ev);
        return null;
    }
    (function hookTalk() {
        const L = TL();
        if (L && L.addTalkHook) L.addTalkHook((key, ev) => { try { return talkHook(key, ev); } catch (e) { report("talk " + key, e); return null; } }, true);
    })();

    // ------------------------------------------------------------------
    // The patrols: the pair (the second one cell behind the first), the search, the night round of K66
    // ------------------------------------------------------------------
    function patrolTick() {
        const L = TL();
        if (!L || !L.eventOf) return;
        for (const [a, b] of D.PAIRS) {
            const lead = L.eventOf(a), fol = L.eventOf(b);
            if (!lead || !fol) continue;
            const here = [lead.x, lead.y];
            if (!lead._ludLast || lead._ludLast[0] !== here[0] || lead._ludLast[1] !== here[1]) { lead._ludPrev = lead._ludLast || null; lead._ludLast = here; }
            const res = (L.RESIDENTS || []).find(r => r.key === a), e = res ? L.entryAt(res, hour()) : null;
            const on = !!e && e.act === "patrol" && !(lead._town && lead._town.hidden);
            if (on) {
                const to = lead._ludPrev || [lead.x, lead.y + 1];
                if (!fol._ludTo || fol._ludTo[0] !== to[0] || fol._ludTo[1] !== to[1]) { fol._ludTo = to; L.hold(b, true, to); }
            } else if (L.held && L.held(b)) { fol._ludTo = null; L.hold(b, false); }
            // the search: under the garrison's favour 10, once a day (shared with the garrison's road patrol)
            const G = GZ();
            if (on && G && G.favor && G.state && !$gameMap.isEventRunning() && !searchFor && T.isCalm(null, { only: ["event", "message", "transfer", "farmMenu"] })) {
                try {
                    const F = G.DATA && G.DATA.FAVOR ? G.DATA.FAVOR : { patrol: 10 };
                    if (G.favor() < F.patrol && G.state().patrolDay !== day() && heroAt(lead.x, lead.y) <= 2.5) { searchFor = a; lead.start(); }
                } catch (err) { report("przeszukanie", err); }
            }
        }
    }
    function patrolSearch(interp) {
        const G = GZ();
        if (!G || !G.state) return;
        const gs = G.state(), F = G.DATA && G.DATA.FAVOR ? G.DATA.FAVOR : {}, spk = { id: interp ? interp.eventId() : -1, name: "Patrol" };
        gs.patrolDay = day();
        let lines;
        if (!flag("rochMet")) { if (G.addFavor) G.addFavor(F.stonesSeen || -2, "kruk na szyi"); lines = G.TX && G.TX.patrolPendant ? G.TX.patrolPendant : []; }
        else {
            if ($gameParty.gold() >= 5) { $gameParty.loseGold(5); T.popup("-5 G (opłata za przepustkę)", { icon: COIN_ICON, kind: "bad" }); }
            lines = G.TX && G.TX.patrolClean ? G.TX.patrolClean : [];
        }
        sayLater(interp, linesTo([], spk, lines));
    }
    // K66: the round by night - the ambush near the lighthouse's path when the hero is there
    function patrolNightTick() {
        const k = S().k66, P = D.PATROL_AMBUSH;
        if (!k || k.ambush || k.done || !onMap(P.map) || !patrolNightOn()) return;
        if (!k.told) { k.told = day(); T.popup(TX.patrolNightStart, { top: true, color: "#ffe27a" }); }
        if (heroAt(P.at[0], P.at[1]) > P.r) return;
        const H = HM();
        if (!H || !H.ambush) return;
        const band = H.ambush(P.kinds, { tag: "ludPatrol", far: [5, 8], say: "Brać ich! Żołnierzyki z latarenką!" });
        if (!band) return;
        k.ambush = day();
        const L = TL(), lead = L && L.eventOf ? L.eventOf("patrol_latarnia_1") : null, fol = L && L.eventOf ? L.eventOf("patrol_latarnia_2") : null;
        if (lead) say(lead, TX.patrolNight[0], 160);
        if (fol) say(fol, TX.patrolNight[1], 160);
    }

    // ------------------------------------------------------------------
    // The kiln's guarded night (K63): two thieves come for the charcoal while the hero watches
    // ------------------------------------------------------------------
    function k63Tick() {
        const k = S().k63, A = D.KILN_AMBUSH;
        if (!k || k.guarded || k.lost || k.spoiled) return;
        const d = day(), h = hour(), nightOf = h < 12 ? d - 1 : d;
        if (d > k.burn + 1 || (d === k.burn + 1 && h >= 4)) {   // the night is over: unguarded (or the hero ran) - the thieves dug half of it out
            k.spoiled = d;
            note("Rozkopany mielerz", "W noc wypału nikt nie pilnował mielerza Zbycha. Rabusie rozkopali kopiec i wynieśli część węgla. Zbych da tylko połowę.");
            autoChecks();
            return;
        }
        if (k.ambush || nightOf !== k.burn || !inHours(h, A.hours) || !onMap(A.map)) return;
        if (heroAt(D.KILN_AT.x, D.KILN_AT.y) > A.r) { k.near = 0; return; }
        k.near = (k.near || 0) + 10;
        if (k.near < (OPTS.kilnWait || A.wait)) return;
        const H = HM();
        if (!H || !H.ambush) return;
        const band = H.ambush(A.kinds, { tag: "ludMielerz", far: [6, 9], say: "Węgiel! Bierzcie worki, szybko!" });
        if (band) { k.ambush = d; T.popup(TX.kilnNight, { top: true, color: "#ff9f8f" }); }
    }
    const coalReady = () => { const k = S().k63; return !!k && day() * 24 + hour() >= (k.burn + 2) * 24 + 8; };
    T.on("humansDone", e => {
        if (!has() || !e) return;
        const s = S();
        if (e.tag === "ludMielerz" && s.k63 && !s.k63.lost) { s.k63.guarded = day(); autoChecks(); }
        if (e.tag === "ludPatrol" && s.k66) { s.k66.done = day(); autoChecks(); }
        if (e.tag === "ludKopacze") s.camp.beaten = day();
    }, { owner: PLUGIN });
    T.on("heroRobbed", e => {
        if (!has() || !e) return;
        const s = S();
        if (e.tag === "ludMielerz" && s.k63 && !s.k63.guarded) { s.k63.lost = day(); autoChecks(); }
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The diggers' camp (Map013): four men by the fire by day (one at the shaft), asleep at night
    // ------------------------------------------------------------------
    const faceTo = (x, y, at) => { const dx = at[0] - x, dy = at[1] - y; return Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 4 : 6) : (dy < 0 ? 8 : 2); };
    function spawnCamp() {
        const H = HM(), c = D.CAMP, s = S();
        if (!OPTS.auto || !H || !H.spawn || !onMap(M.gory) || !campActive()) return;
        if (s.camp.beaten && day() < s.camp.beaten + 2) return;
        if (H.band && H.band("ludKopacze")) return;
        const night = T.time.isNight(), spots = night ? [c.seats[0], c.seats[1], c.seats[2], c.sleeper] : [c.seats[0], c.seats[1], c.seats[2], c.worker];
        let band = null;
        D.CAMP_MEN.forEach((m, i) => {
            const [x, y] = spots[i], mode = night ? "sleep" : i === 3 ? "idle" : "sit";
            const h = H.spawn(m.kind, x, y, { tag: "ludKopacze", name: "Kopacz Czarnych Oczu", look: m.look, mode, band: band || undefined, noBand: !band });
            if (!h) return;
            band = band || h._band;
            h._seatF8 = faceTo(x, y, i === 3 && !night ? c.shaft : c.fire);
            if (i === 3 && !night) h.setDirection(8);
        });
    }
    let campNight = null;
    function campTick() {
        const H = HM();
        if (!H || !onMap(M.gory) || !campActive()) return;
        const night = T.time.isNight();
        if (campNight === null) { campNight = night; return; }
        if (night === campNight) return;
        campNight = night;
        for (const h of (H.humans ? H.humans() : [])) {
            if (h._tag !== "ludKopacze" || h._dead || h._engaged || h._surrendered) continue;
            try { h.setMode(night ? "sleep" : "sit"); } catch (e) { /* (a man busy with something else) */ }
        }
    }
    // Sławek in the cave at night (while the crate is still in its niche)
    function spawnSlawek() {
        const H = HM(), c = D.CAVE, s = S().d34;
        if (!OPTS.auto || !H || !H.spawn || !onMap(M.jaskinia) || s.taken || s.opened) return;
        if (!inHours(hour(), c.slawek.hours) || (H.band && H.band("ludJaskinia"))) return;
        const h = H.spawn(c.slawek.kind, c.seat[0], c.seat[1], { tag: "ludJaskinia", name: "Sławek", look: c.slawek.look, mode: "sit" });
        if (h) h._seatF8 = 8;
    }

    // ------------------------------------------------------------------
    // The events' own actions (the action button: Ludzie.act(this)) and the talks' script calls (Ludzie.act(this, [what, ...]))
    // ------------------------------------------------------------------
    function eventAct(interp) {
        const ev = interp && $gameMap.event(interp.eventId());
        if (!ev) return;
        const key = keyOf(ev), s = S();
        switch (key) {
            case "mielerz": info(TX.kiln[kilnState()]); return;
            case "szalas": info(TX.shed); return;
            case "ogien": case "ogienKop": info(key === "ogien" ? "Ognisko handlarza. Ciepło i trochę dymu." : TX.camp.fireDay); return;
            case "tobol": info("Tobołek handlarza, ściągnięty rzemieniem."); return;
            case "woz": info(TX.wagon); return;
            case "osiol": info(TX.donkey); T.audio.se("Horse", { volume: 45, pitch: 130 }); return;
            case "koszar": case "plot": info(TX.fold); return;
            case "namiot": info(TX.camp.tent); return;
            case "skrzynki": info(TX.camp.crates); return;
            case "juk": {
                const k = s.k65;
                if (!atStep("K65", 0) || !k || k.picked) return;
                k.picked = day();
                vgive("juk", 1);
                hideEv(ev);
                T.popup("Juk handlarza", { icon: D.VITEMS.juk.icon, kind: "good" });
                autoChecks();
                return;
            }
            case "skrzyniaKop": {
                if (s.d35.journal) { info(TX.camp.chestEmpty); return; }
                if (!isActive("D35") && !isDone("D35")) { const q = TQ(); if (q && q.start) q.start("D35"); }
                s.d35.journal = day();
                const it = named(D.ITEMS.dziennik);
                if (it) $gameParty.gainItem(it, 1);
                T.popup(it ? it.name : "Dziennik kopacza", { icon: it ? it.iconIndex : 0, kind: "good" });
                note(TX.journalNote[0], TX.journalNote[1]);
                showEv(ev, 4, 1);
                T.audio.se("Book1", { volume: 60 });
                autoChecks();
                return;
            }
            case "szyb": {
                if (s.d35.how) { info(TX.camp.shaftDone); return; }
                if (!atStep("D35", 1)) { info(TX.camp.shaft); return; }
                const sh = D.SHAFT;
                if (count(sh.saw) <= 0) { T.popup.need(item(sh.saw) ? item(sh.saw).iconIndex : 0, "Potrzebujesz piły"); return; }
                if (count(sh.rope) <= 0 && !s.d35.hits) { T.popup.need(item(sh.rope) ? item(sh.rope).iconIndex : 0, "Potrzebujesz liny"); return; }
                strike(ev, {
                    can: () => !S().d35.how && atStep("D35", 1),
                    blow: () => {
                        const z = S().d35;
                        if (!z.hits && count(sh.rope) > 0) $gameParty.loseItem(item(sh.rope), 1);
                        z.hits = (z.hits || 0) + 1;
                        T.call("Durability", "use", sh.saw);
                        T.audio.se(z.hits >= sh.blows ? "Collapse1" : "Earth2", { volume: 85, pitch: 95 + rnd(0, 10) });
                        if (z.hits >= sh.blows) shaftChoice("zasyp");
                    }
                });
                return;
            }
            case "wylot": {
                if (!caveOpen()) { T.popup.need(0, TX.cave.closed); return; }
                if (!tideLow()) { T.popup.need(0, TX.cave.flooded); return; }
                T.audio.se("Move1", { volume: 80, pitch: 90 });
                $gamePlayer.reserveTransfer(M.jaskinia, D.CAVE.landing[0], D.CAVE.landing[1], 8, 0);
                return;
            }
            case "jaskinia_wyjscie": $gamePlayer.reserveTransfer(M.przystan, D.CAVE.back[0], D.CAVE.back[1], 2, 0); return;
            case "nisza": {
                if (s.d34.taken || s.d34.opened) { info(TX.cave.niche); return; }
                const out = linesTo([], HERO, ["> " + TX.cave.nicheLook]);
                sayLater(interp, choiceTo(out, TX.caveTake, [cmdAct([], ["nisza", 0]), cmdAct([], ["nisza", 1]), []], 2));
                return;
            }
            case "stol": info(TX.cave.table); return;
            case "beczki": info(TX.cave.barrel); return;
            case "krzyz": {
                const i = EV.krzyz.indexOf(ev.eventId());
                if (i < 0) return;
                if (s.graves.c[i] >= D.GRAVES.blows) { info(TX.graves.clean); return; }
                strike(ev, {
                    can: () => S().graves.c[i] < D.GRAVES.blows,
                    blow: () => {
                        const g = S().graves;
                        g.c[i]++;
                        T.audio.se("Earth1", { volume: 60, pitch: 105 + rnd(0, 10) });
                        if (g.c[i] >= D.GRAVES.blows) { showEv(ev, 4, i); if (g.c.every(n => n >= D.GRAVES.blows)) gravesDone(); }
                    }
                });
                return;
            }
            case "lawka": info(TX.graves.bench); return;
            case "marta": {
                ev.turnTowardPlayer();
                sayLater(interp, linesTo([], spkOf(ev, "Marta Ługowa"), TX.martaLines[day() % TX.martaLines.length]));
                return;
            }
            default: return;
        }
    }
    function gravesDone() {
        const g = S().graves;
        if (g.done) return;
        g.done = day();
        setFlag("ludGroby");
        opinion(2, "Groby Ługów");
        xp(30, "Groby Ługów");
        think(TX.graves.done);
        const O = OK();
        if (O && O.discover) O.discover("lud_groby");
    }
    // the shaft's end (D35 step 2): filled by the hero, Grum told, the captain told
    function shaftChoice(how, interp) {
        const s = S();
        if (s.d35.how) return;
        s.d35.how = how;
        s.d35.end = day();
        s.camp.gone = day();
        const H = HM();
        if (H && H.clear && onMap(M.gory)) H.clear("ludKopacze");
        if (how === "zasyp") { think(TX.shaftDone); const sh = evOf(EV.szyb); if (sh) showEv(sh, 4, 1); }
        else if (how === "grum") setFlag("ludSzyb");
        else if (how === "rotmistrz") { setFlag("ludSzybRotmistrz"); const G = GZ(); if (G && G.addFavor) G.addFavor(8, "szyb kopaczy"); }
        if (count(D.ITEMS.dziennik) > 0 && how !== "zasyp") $gameParty.loseItem(item(D.ITEMS.dziennik), 1);
        autoChecks();
    }
    // thoughts over the hero, one after another (outside a talk)
    const thoughts = [];
    let thoughtAt = 0;
    function think(lines, who) { for (const l of [].concat(lines || [])) if (l) thoughts.push({ who: who || null, text: String(l).replace(/^> /, "") }); }
    function updateThoughts() {
        if (!thoughts.length || Graphics.frameCount < thoughtAt || !(SceneManager._scene instanceof Scene_Map)) return;
        const t = thoughts.shift(), sb = SBl();
        if (sb && sb.say) sb.say(t.who || $gamePlayer, t.text, 220); else T.popup(t.text, { color: "#eceef0" });
        thoughtAt = Graphics.frameCount + 230;
    }
    // the crate of the cave: taken whole, or broken open on the spot
    function niche(how, interp) {
        const s = S().d34;
        if (s.taken || s.opened) return;
        const q = TQ(), it = named(D.ITEMS.skrzynia);
        if (q && q.start && !isActive("D34") && !isDone("D34")) q.start("D34");
        if (how === 0) {
            s.taken = day();
            if (it) $gameParty.gainItem(it, 1);
            T.popup(it ? it.name : "Skrzynia przemytu", { icon: it ? it.iconIndex : 0, kind: "good" });
            if (s.stash) setFlag("ludObieSkrzynie");
            autoChecks();
        } else {
            s.opened = day();
            setFlag("ludSkrzyniaOtwarta");
            sayLater(interp, linesTo([], HERO, TX.caveOpened.map(l => "> " + l)));
            if (q && q.finish && isActive("D34")) q.finish("D34", { gold: 35, opinion: -2, items: [[210, 3], [88, 6]] });
        }
        syncCave();
    }
    function giveCrate(to, interp) {
        const s = S().d34, n = count(D.ITEMS.skrzynia);
        if (n <= 0) return;
        if (to === "baltazar" && !baltazarOk()) return;
        $gameParty.loseItem(item(D.ITEMS.skrzynia), n);
        const first = !isDone("D34"), spk = speaker(to === "celnik" ? "celnik" : "kupiec");
        let gold = 0, lines = [];
        if (to === "celnik") { gold = (first ? 40 : 0) + (n > 1 || !first ? 20 : 0); lines = first ? TX.crateCelnik.concat(n > 1 ? TX.crateCelnik2 : []) : TX.crateCelnik2; }
        else { gold = (first ? 90 : 0) + (n > 1 || !first ? 40 : 0); lines = first ? TX.crateBaltazar.concat(n > 1 ? TX.crateBaltazar2 : []) : TX.crateBaltazar2; }
        s.given = s.given || to;
        s.gave = (s.gave || 0) + n;
        const q = TQ();
        if (first && q && q.finish) {
            setFlag(to === "celnik" ? "ludSkrzyniaCelnik" : "ludSkrzyniaBaltazar");
            q.finish("D34", { gold, opinion: to === "celnik" ? 3 : 0 });
        } else if (gold) { $gameParty.gainGold(gold); T.popup("+" + gold + " G", { icon: COIN_ICON, kind: "gold" }); }
        sayLater(interp, linesTo([], spk, lines));
    }
    function syncCave() {
        if (!onMap(M.jaskinia)) return;
        const s = S().d34;
        for (const ev of $gameMap.events()) {
            const d = ev.event();
            if (!d || !/<Ludzie:nisza>/.test(d.note || "")) continue;
            ev._direction = s.taken || s.opened ? 4 : 2;
        }
    }
    function act(interp, args) {
        if (!has()) return;
        try {
            if (!Array.isArray(args)) return eventAct(interp);
            const [what, a, b] = args, ev = interp && $gameMap.event(interp.eventId());
            switch (what) {
                case "buy": buy(a, b); return;
                case "sell": sell(a, b); return;
                case "water": water(ev ? spkOf(ev, "Szymon Juczny") : HERO, interp); return;
                case "rumour": rumour(ev ? spkOf(ev, "Szymon Juczny") : HERO, interp); return;
                case "talk": plainTalk(a, ev ? spkOf(ev, speaker(a).name) : speaker(a), interp); return;
                case "shear": shear(ev ? spkOf(ev, "Wawrzyn Owczarz") : HERO, interp); return;
                case "coal": buyCoal(a || 1); return;
                case "wood": giveWood(ev ? spkOf(ev, "Zbych Smolarz") : HERO, interp); return;
                case "collect": collectCoal(ev ? spkOf(ev, "Zbych Smolarz") : HERO, interp); return;
                case "steel": buySteel(); return;
                case "szukaj": patrolSearch(interp); return;
                case "k63wegiel": k63Coal(a); return;
                case "nisza": niche(a, interp); return;
                case "d34": giveCrate(a, interp); return;
                case "d35": shaftChoice(a, interp); return;
                default: return;
            }
        } catch (e) { report("act " + JSON.stringify(args), e); }
    }
    // K63: Zbych hands over the charcoal (fewer when the night went wrong)
    function k63Coal(n) {
        const k = S().k63;
        if (!k || k.taken || !atStep("K63", 2)) return;
        k.taken = day();
        $gameParty.gainItem(item(79), n);
        T.popup("Węgiel drzewny ×" + n, { icon: item(79).iconIndex, kind: "good" });
        const q = TQ();
        if (q && q.completeStep) q.completeStep("K63");
    }

    // ------------------------------------------------------------------
    // TownQuests' handlers (its FX table) and the quests' own bookkeeping
    // ------------------------------------------------------------------
    function hookQuests() {
        const q = TQ();
        if (!q || !q.FX || hookQuests.done) return;
        hookQuests.done = true;
        const FX = q.FX;
        // K63
        FX.ludK63Drewno = { hand: () => { S().k63 = { burn: day(), guarded: 0, ambush: 0, lost: 0, spoiled: 0, taken: 0, near: 0 }; } };
        FX.ludK63Noc = {
            check: () => { const k = S().k63; return !!k && !!(k.guarded || k.lost || k.spoiled); },
            tick: () => k63Tick()
        };
        FX.ludK63Vars = { vars: () => { const k = S().k63 || { burn: day() }; return { noc: k.burn, gotowy: k.burn + 2 }; } };
        FX.ludK63Wegiel = {
            ready: (Q, r, st, key) => (key === "drwal" ? coalReady() : null),
            talk(Q, r, st, key, spk) {
                if (key !== "drwal") return null;
                const k = S().k63 || {};
                if (!coalReady()) return { ready: false, list: linesTo([], spk, [fill(TX.collectWait, { day: (k.burn || day()) + 2 })]) };
                const n = k.spoiled ? 5 : k.lost ? 6 : 10;
                const lines = k.spoiled ? ["Rabusie rozkopali kopiec w nocy. Uratowałem pięć worków. Resztę dokup albo przynieś z innego wypału."]
                    : k.lost ? ["Pobili cię, a i tak coś zostało. Sześć worków - więcej nie dam rady."]
                    : ["Kopiec ostygł, węgiel jak smoła. Dziesięć worków dla Tadka - i dzięki za noc przy kopcu."];
                return { ready: true, list: cmdAct(linesTo([], spk, lines), ["k63wegiel", n]) };
            }
        };
        // K64
        FX.ludPoBurzy = { cond: () => stormRecently() };
        FX.ludOwcaIdzie = { check: () => { const k = S().k64; return !!k && !!(k.follow || k.home); } };
        FX.ludOwcaDoma = { check: () => { const k = S().k64; return !!k && !!k.home; } };
        FX.ludOwcaVars = { vars: () => { const k = S().k64 || { spot: 0 }; return { gdzie: D.SHEEP_WHERE[k.spot || 0] }; } };
        // K65
        FX.ludJuk = { check: () => { const k = S().k65; return !!k && !!k.picked; } };
        FX.ludJukVars = { vars: (Q, r) => { const k = S().k65 || { spot: 0 }; return { gdzie: ["za mielerzem, przy drodze", "dalej na wschód, przy zakręcie", "aż pod lasem na północnym wschodzie"][k.spot || 0], do: (r && r.sday ? r.sday : day()) + 2, postoj: stopName() }; } };
        // K66
        FX.ludPatrolNoc = { check: () => { const k = S().k66; return !!k && !!k.done; }, tick: () => patrolNightTick() };
        FX.ludPatrolVars = { vars: () => ({}) };
        // D34
        FX.ludJaskiniaOtwarta = { cond: () => caveOpen() };
        FX.ludD34Start = () => has() && onMap(M.jaskinia) && caveOpen();
        FX.ludSkrzynia = { check: () => { const s = S().d34; return !!(s.taken || s.opened || s.stash) && count(D.ITEMS.skrzynia) + (s.opened ? 1 : 0) > 0; } };
        FX.ludD34Vars = { vars: () => ({ balt: baltazarOk() ? " - albo Baltazarowi Veyowi (kantor w miasteczku)" : "" }) };
        FX.ludKomuSkrzynia = {
            ready: (Q, r, st, key) => (key === "celnik" || (key === "kupiec" && baltazarOk()) ? count(D.ITEMS.skrzynia) > 0 : null),
            talk(Q, r, st, key, spk) {
                if (!(key === "celnik" || (key === "kupiec" && baltazarOk())) || count(D.ITEMS.skrzynia) <= 0) return null;
                const to = key === "celnik" ? "celnik" : "baltazar";
                return { ready: true, list: choiceTo([], [TX.crateLabel[to], TX.crateLabel.keep], [cmdAct([], ["d34", to]), []], 1) };
            }
        };
        // D35
        FX.ludD35Start = () => has() && onMap(M.gory) && campActive() && heroAt(D.CAMP.chest[0], D.CAMP.chest[1]) <= D.CAMP.near;
        FX.ludDziennik = { check: () => !!S().d35.journal };
        FX.ludSzybKoniec = { check: () => !!S().d35.how };
        FX.ludD35Vars = { vars: () => ({ grum: grumOk() ? ", powiedz Grumowi (tawerna)" : "" }) };
        FX.ludSzybKomu = {
            ready: (Q, r, st, key) => ((key === "grum" && grumOk()) || key === "rotmistrz" ? count(D.ITEMS.dziennik) > 0 && !S().d35.how : null),
            talk(Q, r, st, key, spk) {
                if (!((key === "grum" && grumOk()) || key === "rotmistrz") || S().d35.how || count(D.ITEMS.dziennik) <= 0) return null;
                const lines = key === "grum" ? TX.shaftGrum : TX.shaftCaptain;
                const out = linesTo([], spk, [lines[0]]);
                const rest = cmdAct(linesTo([], spk, lines.slice(1)), ["d35", key === "grum" ? "grum" : "rotmistrz"]);
                return { ready: true, list: choiceTo(out, ["Powiedz o szybie.", "Jeszcze nie."], [rest, []], 1) };
            }
        };
    }
    hookQuests();
    // the quests' own records as they begin; the garrison's favour after the night round
    T.on("townQuestAccepted", e => {
        if (!has() || !e) return;
        const s = S(), d = day();
        if (e.id === "K64") s.k64 = { spot: Math.floor(hash(d, 64) * D.SHEEP_SPOTS.length), found: 0, follow: false, home: 0 };
        if (e.id === "K65") s.k65 = { spot: Math.floor(hash(d, 65) * D.JUK_SPOTS.length), picked: 0 };
        if (e.id === "K66") s.k66 = { night: d, ambush: 0, done: 0, told: 0 };
        if (e.id === "K63") s.k63 = null;
    }, { owner: PLUGIN });
    T.on("townQuestDone", e => {
        if (!has() || !e) return;
        const G = GZ();
        if (e.id === "K66" && G && G.addFavor) G.addFavor(5, "nocny patrol");
    }, { owner: PLUGIN });
    // K63's five days: from the day it was taken to 21:00 of the fifth day after
    function k63Deadline() {
        const r = rec("K63"), q = TQ();
        if (!r || r.s !== "active" || !q || !q.fail) return;
        if (day() * 24 + hour() >= (r.day + 5) * 24 + 21) q.fail("K63");
    }
    // the eagle's stash of package D (orzel_125_a): the second crate of the smugglers
    function stashFound() {
        if (!has()) return false;
        const s = S().d34, it = named(D.ITEMS.skrzynia);
        if (s.stash) return false;
        s.stash = day();
        if (it) $gameParty.gainItem(it, 1);
        T.popup(TX.stash, { icon: it ? it.iconIndex : 0, kind: "good" });
        if (s.taken || s.opened) setFlag("ludObieSkrzynie");
        const q = TQ();
        if (q && q.start && !isActive("D34") && !isDone("D34") && caveOpen()) q.start("D34");
        autoChecks();
        return true;
    }

    // ------------------------------------------------------------------
    // The blanket: resting on the ground with it in the bag is half again quicker (Farming's rest on the grass: "still", no building)
    // ------------------------------------------------------------------
    const _startToolSwing = Game_Player.prototype.startToolSwing;
    if (_startToolSwing) {
        Game_Player.prototype.startToolSwing = function(kind, onImpact, onDone, opts) {
            try {
                if (opts && opts.still && typeof opts.onWait === "function" && !opts._lud && count(D.BLANKET.item) > 0 && groundRest()) {
                    const base = opts.onWait;
                    opts._lud = true;
                    opts.onWait = function() {
                        const before = $gameSystem.stamina ? $gameSystem.stamina() : 0;
                        const r = base.apply(this, arguments);
                        const got = ($gameSystem.stamina ? $gameSystem.stamina() : 0) - before;
                        if (got > 0 && $gameSystem.changeStamina) $gameSystem.changeStamina(got * D.BLANKET.bonus);
                        return r;
                    };
                    if (has() && !S().shop.told.koc) { S().shop.told.koc = day(); T.popup(TX.blanket, { icon: item(D.BLANKET.item) ? item(D.BLANKET.item).iconIndex : 0, kind: "good" }); }
                }
            } catch (e) { report("koc", e); }
            return _startToolSwing.apply(this, arguments);
        };
    }
    function groundRest() {
        const F = T.api("Farming") || window.Farming;
        try { return !(F && F.buildingAt && F.buildingAt($gamePlayer.x, $gamePlayer.y)); } catch (e) { return true; }
    }

    // ------------------------------------------------------------------
    // The map drives it
    // ------------------------------------------------------------------
    T.on("mapReady", () => {
        if (!has()) return;
        try {
            hookQuests();
            syncMap();
            spawnSheep();
            spawnCamp();
            spawnSlawek();
            syncCave();
            campNight = null;
        } catch (e) { report("mapReady", e); }
    }, { owner: PLUGIN });
    T.onMapUpdate((scene, n) => {
        if (!has()) return;
        try {
            updateThoughts();
            if (n % 20 === 0) syncMap();
            if (n % 30 === 5) { patrolTick(); lostTick(); }
            if (n % 60 === 11) { flockTick(); campTick(); spawnSlawek(); k63Deadline(); }
            if (n % 600 === 17 && onMap(M.gory)) spawnCamp();
            for (const a of sheep) if (!a._sprite || !a._sprite.parent) { const R = RA(); if (R) R.addSprite(a); }
        } catch (e) { report("update", e); }
    }, { owner: PLUGIN, name: "ludzie" });

    // ------------------------------------------------------------------
    // F9: the package's rows (Okolice.f9 - Debug.js shows them in the tab "Wyspa i fabuła")
    // ------------------------------------------------------------------
    const PLACES = [
        ["Mielerz Zbycha (Leśna droga)", 21, 49, 21, 8], ["Szałas węglarza", 21, 53, 23, 8], ["Postój handlarza (Polna droga)", 22, 52, 23, 8],
        ["Postój handlarza (Leśna droga)", 21, 54, 18, 8], ["Postój handlarza (Łąka)", 4, 62, 12, 8], ["Postój handlarza (Kruczy Jar)", 3, 61, 12, 8],
        ["Koszar i pastwisko (Łąka)", 4, 52, 45, 8], ["Pastwisko przy menhirach", 18, 68, 34, 8], ["Omszała łąka (owca K64)", 17, 60, 40, 8],
        ["Juk K65 (Leśna droga)", 21, 55, 13, 8], ["Obóz kopaczy (Góry)", 13, 101, 77, 8], ["Szyb kopaczy", 13, 105, 73, 8],
        ["Zatoczka: wylot jaskini (Przystań)", 125, 16, 66, 8], ["Jaskinia przemytników (mapa 177)", 177, 3, 11, 8], ["Stare groby Ługów", 168, 89, 28, 8],
        ["Patrol: przylądek z latarnią", 159, 53, 46, 2], ["Patrol: garnizon (wybrzeże)", 162, 60, 46, 2]
    ];
    let f9Place = 0, f9Stop = 0;
    const placeLabel = i => "Miejsce " + (i + 1) + "/" + PLACES.length + ": " + PLACES[i][0] + "   ←→";
    const stopLabel = i => "Dzień handlarza: " + stopName(D.CYCLE.stops[i]) + "   ←→";
    // the first day from today on whose number fits test (the clock's hour kept; a transfer then reloads the map)
    function jumpDay(test, h) {
        let d = day();
        for (let k = 0; k < 24 && !test(d); k++) d++;
        $gameSystem._dayNightDay = d;
        if (h !== undefined) $gameSystem.setDayNightHour(h);
        return d;
    }
    const f9 = {
        owner: PLUGIN, title: "Paczka C: Ludzie (mielerz, pasterz, handlarz, patrole, kopacze, jaskinia, groby):",
        rows: () => {
            const s = has() ? S() : null;
            return [
                { label: placeLabel(f9Place), icon: 190, desc: "←→ wybierz miejsce paczki C, OK przenosi na nie.", what: "go", pick: f9Place },
                { label: "Dzień mielerza: Zbych przy kopcu, kopiec się tli", icon: 334, desc: "Dzień cyklu 2 (rano, 10:00) - przenosi na Leśną drogę pod mielerz.", what: "kiln" },
                { label: stopLabel(f9Stop), icon: 496, desc: "←→ postój; OK: dzień tego postoju (10:00) i przeniesienie do wozu.", what: "stop", pick: f9Stop },
                { label: "Pasterz z owcami przy menhirach", icon: 367, desc: "Dzień, w którym stado pasie się na Łące menhirów (10:00) - przenosi tam.", what: "p018" },
                { label: "K66: noc patrolu (przylądek, 20:55)", icon: 387, desc: "Zaczyna K66, ustawia 20:55 i przenosi pod latarnię - o 21 patrol wyrusza.", what: "patrol" },
                { label: "W8 gotowe: obóz kopaczy " + (s && s.force.camp ? "(wymuszony - OK wyłącza)" : "(OK wymusza)"), icon: 499, desc: "Obóz kopaczy stoi bez rozdziału 3 wątku W8 (tylko do prób).", what: "camp" },
                { label: "Odpływ teraz (wejście do jaskini)", icon: 190, desc: "Wyspa.forceTide(„low”) i przeniesienie do zatoczki.", what: "tide" },
                { label: "W5 rozdz. 4: jaskinia otwarta " + (s && s.force.cave ? "(wymuszona)" : ""), icon: 498, desc: "Wejście do jaskini bez rozdziału 4 wątku W5 (tylko do prób).", what: "cave" },
                { label: "Burza wczoraj (pasterz zgubił owcę - K64)", icon: 367, desc: "Udaje burzę z wczoraj: pasterz da zadanie K64.", what: "storm" }
            ];
        },
        pick(row, delta) {
            if (row.what === "go") { f9Place = row.pick = ((row.pick || 0) + delta + PLACES.length) % PLACES.length; row.label = placeLabel(row.pick); }
            if (row.what === "stop") { f9Stop = row.pick = ((row.pick || 0) + delta + 4) % 4; row.label = stopLabel(row.pick); }
        },
        ok(row) {
            if (!has()) return { say: "Najpierw gra", bad: true };
            const s = S();
            if (row.what === "go") { const p = PLACES[row.pick || 0]; if (p[1] === M.przystan || p[1] === M.jaskinia) { const W = T.api("Wyspa") || window.Wyspa; if (W && W.forceTide) W.forceTide("low"); } return { go: p }; }
            if (row.what === "kiln") { jumpDay(d => ((d % 6) + 6) % 6 === 2, 10); return { go: ["Mielerz", 21, 49, 21, 8] }; }
            if (row.what === "stop") { const i = row.pick || 0, m = D.CYCLE.stops[i]; jumpDay(d => ((d % 4) + 4) % 4 === i, 10); const p = PLACES.find(x => x[1] === m && /Postój/.test(x[0])); return { go: p || ["Postój", m, 50, 20, 2] }; }
            if (row.what === "p018") { jumpDay(d => d % D.CYCLE.pasture018.every === D.CYCLE.pasture018.at, 10); return { go: ["Pastwisko przy menhirach", 18, 68, 34, 8] }; }
            if (row.what === "patrol") {
                const q = TQ();
                if (q && q.start && !isActive("K66")) q.start("K66");
                if (s.k66) s.k66.night = day();
                $gameSystem.setDayNightHour(20.9);
                return { go: ["Przylądek z latarnią", 159, 53, 46, 2] };
            }
            if (row.what === "camp") { s.force.camp = !s.force.camp; s.camp.gone = 0; return s.force.camp ? { go: ["Obóz kopaczy", 13, 101, 77, 8] } : { say: "Obóz kopaczy: jak w wątku W8" }; }
            if (row.what === "tide") { const W = T.api("Wyspa") || window.Wyspa; if (W && W.forceTide) W.forceTide("low"); return { go: ["Zatoczka przemytników", 125, 16, 66, 8] }; }
            if (row.what === "cave") { s.force.cave = !s.force.cave; return { say: "Jaskinia " + (s.force.cave ? "otwarta (wymuszona)" : "jak w wątku W5") }; }
            if (row.what === "storm") { s.force.storm = day() - 1; return { say: "Burza „wczoraj” - pasterz da zadanie K64" }; }
            return null;
        }
    };
    (function f9add() { const O = OK(); if (O && O.f9 && O.f9.add) O.f9.add(f9); })();

    // (2026-10-22, integration) the epilogue after the Heart: Underground.js asks Ludzie.epilogue(kind, w) - a line, a list or null
    function epilogue() {
        if (!has() || !D.EPILOG) return null;
        const out = [];
        if (flag("ludGroby")) out.push(D.EPILOG.graves);
        const c = flag("ludSkrzyniaCelnik") ? "celnik" : flag("ludSkrzyniaBaltazar") ? "baltazar" : flag("ludSkrzyniaOtwarta") ? "otwarta" : null;
        if (c) out.push(D.EPILOG.cave[c]);
        return out;
    }
    window.Ludzie = T.register(PLUGIN, { epilogue, addMenu,
        PKG: "C", VERSION: D.VERSION, DATA: D, ready: true, state: () => S(), act, opts: OPTS, auto: v => { OPTS.auto = !!v; },
        // for the other packages: B (the bandits' camp by the kiln), D (the eagle's stash)
        mielerzBurning, stashFound,
        // the cycles and the places (the tests, F9)
        kilnState, kilnDay, zbychAtKiln, stopMap, stopIndex, stopName, pasterz018, flockMap, flockWanted, campActive, caveOpen, tideLow, stormRecently,
        coalLeft, pedlarGoods, waterPrice, lostNow, flockSize, martaHere,
        sheep: () => sheep.slice(), spawnSheep, spawnCamp, spawnSlawek, syncMap, lightsNow, f9, PLACES, Game_LudSheep, niche, giveCrate, shaftChoice, gravesDone
    });
})();
