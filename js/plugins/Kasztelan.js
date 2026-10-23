//=============================================================================
// Kasztelan.js
//=============================================================================
// The arc W4 "Krew kasztelana" after its compact chapters 1-5 (TownQuests.js: Borgar's half key, the raven cairn, Tadek's forge, the
// grate in the cellar opened, Borgar's saying) - docs/QUESTY.md W4, chapters 6-8:
//   6 "Ród Kowali" - who Borgar's blood was: three of the clues - the Order's notes underground (the saying carved on floor 3,
//     "Kasztelan Kowal" on 6, "Ostatni wpis" on 10 - "Słowa zna tylko krew kasztelana - niech je powtarza, choćby jako żart przy
//     piwie", the prior's letter to the castellan on 20), the list of castellans (W2's chronicles or floor 24), brother Kleofas on the
//     cliff (shown the key: the key's guard swore "Nie pytam o to, czego nie chcę wiedzieć"), grandpa Stach ("Kruk u nas, klucz u
//     Kowali"). Three found: the note "Ród Kowali"
//   7 "Konfrontacja" - only after chapter 1 is over (Story.chapterEnded: the debt paid or the field lost - QUESTY 6.2) and only
//     after closing time (23-1, at the bar): tell him everything (the key, the castellan, the oath; his nights at the grate when the
//     Truth Layer's page is known - it counts as W9's truth told) or keep silent - it is his tavern and his saying. Told, he flares
//     up and shuts the tavern for a day (no shift: the door locked from outside, Borgar says only "zamknięte"); the next night he
//     waits in the cellar by the grate. Already half-prepared - Melia sang the song only for him (W3 b) or he heard of his nights
//     (W9) - he does not flare up: it all comes at once, at the bar. His grandmother: "Pilnuj piwnicy i nie pytaj". Then the hero
//     asks: "Chodź ze mną w dół" - he comes when he trusts the hero enough (the song for him, his nights told, a dozen shifts or the
//     tavern's fame; telling the Lord first counts against) - or he stays as the cellar's guard: "zejdziesz - nie wracaj do pracy"
//     (the next descent ends the hero's shifts until Act III's siege is over); "Zostań, pilnuj piwnicy" - the guard by agreement
//   8 "Komnata Serca" - the key opens the last door (Underground.js); Borgar who went down can take the guardian's place
//     (Underground: world().borgar). The arc ends with any ending of the Heart.
// What Borgar does then: "idzie" - after closing, every night 1-5 he keeps a fire at the tenth gate (Map140; his basket there: bread
// and water once a day), stronger in Act III (Act3_Data), at the Heart; "pilnuje" - every night 1-5 by the grate in the cellar (Map009)
// with a fire basket, the old door holds better in Act III; "niewie" - nothing changes, he does not know.
// The tavern's own map (Map001) is the user's: nothing in its file changes - Borgar's event, the counter and the town's tavern door
// (Map008) answer in code (Game_Event.list) while W4 needs it.
// Events: Tawerna.inject ids 540-559 (owner "Kasztelan"): 540-541 the cellar (Map009), 542-544 the tenth gate (Map140).
// (2026-10-23) The thread's data - the chapters, the talks, the actions, the F9 jumps - is Kasztelan_Data.js (the thread engine Watki.js,
// docs/WATKI_DANE.md), its words js/teksty/kasztelan.txt; here what only code can do, as the data's named hooks.
// API: window.Kasztelan (Tawerna.api("Kasztelan")).

/*:
 * @target MZ
 * @plugindesc [W4] Wątek „Krew kasztelana” rozdz. 6-8: ród Kowali (poszlaki), konfrontacja z Borgarem po zamknięciu, zamknięta tawerna, noc w piwnicy, Borgar idzie w dół albo pilnuje piwnicy, Komnata Serca. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base TownQuests
 * @base Watki
 * @base Kasztelan_Data
 * @orderAfter TownQuests
 * @orderAfter Story
 * @orderAfter Underground
 * @orderAfter Act3
 * @orderAfter Pustelnia
 * @orderAfter Dwor
 * @orderAfter Kasztelan_Data
 *
 * @help
 * ============================================================================
 * Kasztelan.js - wątek W4 „Krew kasztelana”, rozdziały 6-8
 * ============================================================================
 * Rozdziały 1-5 (pół klucza znad baru, kopiec z krukiem, kuźnia Tadka, krata
 * w piwnicy, słowa Borgara) są w TownQuests.js. Tu dalej:
 *  6 Ród Kowali - trzy poszlaki: zapiski zakonu w podziemiach (piętra 3, 6,
 *    10, 20, 24), kroniki z Archiwum (lista kasztelanów), brat Kleofas
 *    (pokaż mu klucz), dziadek Stach.
 *  7 Konfrontacja - po rozdziale 1 (spłata długu albo strata działki), po
 *    zamknięciu (23-1) przy barze: powiedz Borgarowi wszystko albo przemilcz.
 *    Powiedziane: Borgar się wścieka i zamyka tawernę na dzień (bez zmiany),
 *    następnej nocy czeka w piwnicy przy kracie. Kto mu wcześniej zaśpiewał
 *    pieśń (W3) albo powiedział o jego nocach (W9) - bez złości, od razu.
 *    Potem: „Chodź ze mną w dół” albo „Zostań, pilnuj piwnicy”.
 *  8 Komnata Serca - klucz otwiera ostatnie drzwi; Borgar, który poszedł
 *    w dół, może zostać strażnikiem zamiast bohatera.
 * Zdarzenia 540-559 (rejestr TawernaCore: "Kasztelan"). Mapa tawerny
 * (Map001) się nie zmienia - Borgar, lada i drzwi odpowiadają w kodzie.
 * F9, zakładka „Wyspa i fabuła”: „W4: rozdział N”.
 * Dane wątku: Kasztelan_Data.js (silnik Watki.js), teksty:
 * js/teksty/kasztelan.txt.
 * ============================================================================
 */
(() => {
    "use strict";
    const TK = Watki.teksty("kasztelan");   // (the words of this file: js/teksty/kasztelan.txt, kod.*)
    const T = window.Tawerna;
    if (!T) throw new Error("Kasztelan.js: brak TawernaCore.js");
    const PLUGIN = "Kasztelan";
    const W = window.Watki, w = W && W.get ? W.get("kasztelan") : null;
    if (!w) { console.warn("Kasztelan.js: brak Watki.js albo Kasztelan_Data.js - wątek W4 rozdz. 6-8 wyłączony"); return; }
    const MAP = { tavern: 1, town: 8, cellar: 9, ruins: 10, floor10: 140, house: 19, cairn: 20 };
    const IDS = [540, 559];
    const EV = { cellarBorgar: 540, cellarFire: 541, postBorgar: 542, postFire: 543, postBasket: 544 };
    // the places: the cellar - Borgar right of the grate (15,2), his fire basket left of it (the grate's own tile 15,3 stays free);
    // the tenth gate (Map140) - the west corner of the entrance hall by the stairs up (5,12; the rival's camp is east, 12-25)
    const POS = { cellarBorgar: [16, 3, 4], cellarFire: [14, 3], postFire: [3, 16], postBorgar: [4, 16, 4], postBasket: [2, 16] };
    // talk: after closing at the bar; door: the town's door shut on the shut day; bar: Borgar only says "zamknięte"; cellar: the night
    // he waits by the grate; post: the nights he keeps his post (the cellar or the tenth gate) - he is not at the bar then
    const HOURS = { talk: [23, 1], door: [5, 22], bar: [5, 23], cellar: [23, 5], post: [1, 5] };
    const NEED = 3, BREAD = 83, WATER = 35, TRUST = { shifts: 12, rep: 40 };
    const BREAD_ICON = 0;
    const HERO = W.mowa.HERO;
    const C = W.mowa.C;
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const ST = () => T.api("Story") || window.Story || null;
    const UG = () => T.api("Underground") || window.Underground || null;
    const SB = () => T.api("SpeechBubbles") || window.SpeechBubbles || null;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const onMap = id => !!(window.$gameMap && $gameMap.mapId() === id);
    const report = (where, e) => console.error("[Kasztelan] " + where + ":", e);
    const fill = W.mowa.fill;
    const now = () => day() * 24 + hour();

    // ------------------------------------------------------------------
    // The words (js/teksty/kasztelan.txt - filled when the game starts), the state, TownQuests' flags (the engine's)
    // ------------------------------------------------------------------
    const TX = w.tx;
    const S = () => w.S();
    const { flags, flag, setFlag, rec } = w;
    const w4 = () => rec();
    const w4Active = () => { const r = w4(); return !!r && r.s === "active"; };
    const stepOf = name => w.stepOf(name);
    const cur = () => w.cur();
    const at = name => w.at(name);
    const note =(title, text) => T.call("Journal", "addNote", title, text);
    const notePair = p => note(p[0], p[1]);
    const chapterEnded = () => { const s = ST(); try { return !!(s && s.chapterEnded && s.chapterEnded()); } catch (e) { return false; } };
    const siegeOn = () => { try { const A = T.api("Act3"); return !!(A && A.phase && A.phase() === "siege"); } catch (e) { return false; } };
    const siegeOver = () => { try { const A = T.api("Act3"); if (A && A.outcome && A.outcome()) return true; } catch (e) { /* (the flags) */ } const f = flags(); return !!(f.act3Held || f.act3Costly || f.act3Fallen); };
    const ugState = () => { const U = UG(); try { return U && U.state ? U.state() : null; } catch (e) { return null; } };
    const autoChecks = () => w.autoChecks();
    const run = (interp, list) => W.mowa.uruchom(interp, list);
    const think = lines => w.mysl(lines);
    const sayOver = (ch, text, frames) => { const sb = SB(); if (sb && sb.say && ch) sb.say(ch, text, frames || 200); };

    // ------------------------------------------------------------------
    // 6. Ród Kowali: the clues
    // ------------------------------------------------------------------
    const CLUES = [
        { key: "napis", note: "3" }, { key: "kowal", note: "6" }, { key: "wpis", note: "10d" }, { key: "przeor", note: "20c" },
        { key: "lista", note: "24", flags: ["chroniclesTaken", "chroniclesForAmbrozy", "chroniclesLeft", "ambrozyChronicles"] },
        { key: "kleofas", talk: "pustelnik" }, { key: "dziadek", talk: "grandpa" }
    ];
    // the clues the game shows on its own (the Order's notes read, the chronicles of the Archive) - kept once found
    function syncClues() {
        if (!has()) return 0;
        const s = S(), u = ugState(), notes = (u && u.notes) || {}, f = flags();
        for (const c of CLUES) {
            if (s.clues[c.key] || c.talk) continue;
            if ((c.note && notes[c.note]) || (c.flags || []).some(k => f[k])) s.clues[c.key] = day();
        }
        return clueCount();
    }
    const clueCount = () => CLUES.filter(c => S().clues[c.key]).length;
    function rodVars() {
        syncClues();
        const got = CLUES.filter(c => S().clues[c.key]).map(c => TX.clues[c.key]), n = got.length;
        return { n: Math.min(n, NEED), need: NEED, jest: n ? " (" + got.join(", ") + ")" : "", gdzie: n >= NEED ? TX.whereDone : TX.where };
    }
    function rodDone() {
        const s = S();
        if (s.rod) return;
        s.rod = day();
        const skad = CLUES.filter(c => s.clues[c.key]).map(c => TX.clues[c.key]).join(", ");
        think(TX.rodThink);
        return [TX.noteRodTitle, fill(TX.noteRod, { skad })];
    }

    // ------------------------------------------------------------------
    // 7. The confrontation at the bar (its talk: Kasztelan_Data rozmowy.konfrontacja) - what the talk asks of the game
    // ------------------------------------------------------------------
    const talkHours = () => inHours(hour(), HOURS.talk);
    // W9's truth of his nights (the Truth Layer, floor 76): known and not yet told or kept
    function nightsPending() {
        const q = TQ(), r = TQ() && TQ().rec ? TQ().rec("W9") : null, U = UG();
        let known = false;
        try { const t = U && U.truths ? U.truths() : {}; known = Object.keys(t).some(k => t[k] && t[k].who === "borgar"); } catch (e) { known = false; }
        if (!known || flag("borgarKnows") || flag("truthKept_borgar") || flag("truthTold_borgar")) return false;
        return !(r && r.t && r.t.res && r.t.res.borgar) && !!q;
    }
    const prepared = () => flag("w3Borgar") || flag("w4Faster") || flag("borgarKnows");
    const trustOk = () => {
        let shifts = 0, rep = 0;
        try { const TS = T.api("TavernShift"); shifts = TS && TS.stats ? TS.stats().done || 0 : 0; } catch (e) { shifts = 0; }
        try { const QB = T.api("QuestBoard"); rep = QB && QB.reputation ? QB.reputation() || 0 : 0; } catch (e) { rep = 0; }
        return shifts >= TRUST.shifts || rep >= TRUST.rep;
    };
    // how far he trusts the hero to go down with him: the song for him (W3 b), his nights told (W9, also now), the bar's evenings or
    // the tavern's fame; the Lord told first (W7 ch. 6) counts against. Two: he comes.
    function score(nightsNow) {
        const f = flags(), why = [], whyNot = [];
        let n = 0;
        if (f.w3Borgar || f.w4Faster) { n++; why.push(TX.whySong); }
        if (f.borgarKnows || nightsNow) { n++; why.push(TX.whyNights); }
        if (trustOk()) { n++; why.push(TX.whyShifts); } else whyNot.push(TX.whyNotShifts);
        if (f.w7LordFirst && !f.w7KlamstwoWyszlo) { n--; whyNot.unshift(TX.whyNotLord); }
        if (!whyNot.length) whyNot.push(TX.whyNotAny);
        return { n, ok: n >= 2, why: why.slice(0, 2), whyNot: whyNot.slice(0, 2) };
    }
    // his nights at the grate said in the same breath - W9's truth told (its reward and note, the W9 record's result)
    function tellNights() {
        const q = TQ();
        if (!q) return;
        try { if (!q.rec("W9")) q.autoChecks(); } catch (e) { /* (below) */ }
        const r = q.rec("W9"), f = q.FX && q.FX.w9Truth;
        if (r && r.s === "active" && f && f.act && q.Q.W9) { try { f.act(q.Q.W9, "tell:borgar"); } catch (e) { report("W9 tell", e); } }
        if (!flag("borgarKnows")) { setFlag("borgarKnows"); setFlag("truthTold_borgar"); }
    }

    // ------------------------------------------------------------------
    // The shut day, the cellar's night, the posts (Borgar away from the bar 1-5)
    // ------------------------------------------------------------------
    const closedBarNow = () => !!S().closed && day() === S().closed && inHours(hour(), HOURS.bar);
    const doorClosedNow = () => !!S().closed && day() === S().closed && inHours(hour(), HOURS.door) && !siegeOn();
    const cellarNightNow = () => at("w4Piwnica") && !!S().closed && now() >= S().closed * 24 + HOURS.cellar[0] && inHours(hour(), HOURS.cellar) && !siegeOn();
    // the Heart's ending made Borgar its guardian: he sits on the bench before it (Underground.js) - no posts up here any more
    const guardianNow = () => { const u = ugState(); return !!(u && u.ending && u.ending.kind === "straznik" && u.ending.guardian === "borgar"); };
    const stance = () => S().stance || "";
    const postsOn = () => (stance() === "idzie" || stance() === "pilnuje") && !guardianNow();
    const postNow = () => postsOn() && inHours(hour(), HOURS.post) && !siegeOn();
    const barAway = () => (cellarNightNow() || postNow()) && !siegeOn();
    const cellarBorgarNow = () => cellarNightNow() || (stance() === "pilnuje" && postNow());
    const cellarFireOn = () => at("w4Piwnica") || (stance() === "pilnuje" && postsOn());
    const postBorgarNow = () => stance() === "idzie" && postNow();

    // the events (Tawerna.inject 540-559): built with the map's data; shown / hidden by the hour (sync)
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function eventData(id, name, x, y, o) {
        const img = o.img || ["", 0, 2, 0];
        const page = { conditions: Object.assign({}, BLANK), directionFix: !!o.fix, image: { tileId: 0, characterName: img[0], direction: o.dir || img[2], pattern: img[3], characterIndex: img[1] },
            list: [C(355, ["Kasztelan.act(this);"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: o.priority === undefined ? 1 : o.priority, stepAnime: !!o.anim, through: !!o.through, trigger: 0, walkAnime: o.walk !== false };
        return { id, name: "W4: " + name, note: "<Kasztelan:" + o.key + ">" + (o.note || ""), pages: [page], x, y };
    }
    const FIRE_LIGHT = "<Light:170,255,150,70><LightFlicker:0.16,255,110,40><LightHeight:26>";
    const BORGAR_NOTE = "<Bust:People3_5><BustName:Borgar>";
    function build(data, mapId) {
        const out = [];
        if (!has()) return out;
        if (mapId === MAP.cellar && (at("w4Piwnica") || (stance() === "pilnuje" && postsOn()))) {
            const b = POS.cellarBorgar, f = POS.cellarFire;
            out.push(eventData(EV.cellarBorgar, "Borgar", b[0], b[1], { key: "borgar", img: ["$Npc_Borgar", 0, 2, 1], dir: b[2], note: BORGAR_NOTE }));
            out.push(eventData(EV.cellarFire, TK.kod.build[0], f[0], f[1], { key: "zar", img: ["!Decoration", 0, 2, 0], fix: true, anim: true, walk: false, note: FIRE_LIGHT }));
        } else if (mapId === MAP.floor10 && stance() === "idzie" && postsOn()) {
            const b = POS.postBorgar, f = POS.postFire, k = POS.postBasket;
            out.push(eventData(EV.postBorgar, "Borgar", b[0], b[1], { key: "post", img: ["$Npc_Borgar", 0, 2, 1], dir: b[2], note: BORGAR_NOTE }));
            out.push(eventData(EV.postFire, TK.kod.build[1], f[0], f[1], { key: "ognisko", img: ["!Decoration", 2, 4, 0], fix: true, anim: true, walk: false, note: FIRE_LIGHT.replace("26", "14") }));
            out.push(eventData(EV.postBasket, TK.kod.build[2], k[0], k[1], { key: "kosz", img: ["!Decoration_static_2", 0, 2, 2], fix: true, walk: false }));
        }
        return out.filter(e => e.x < data.width && e.y < data.height);
    }
    T.inject([MAP.cellar, MAP.floor10], { ids: IDS, owner: PLUGIN, build });

    const evOf = id => (window.$gameMap ? $gameMap.event(id) : null);
    const keyOf = ev => { const m = ev && ev.event && ev.event() && /<Kasztelan:(\w+)>/.exec(ev.event().note || ""); return m ? m[1] : ""; };
    function remember(ev) { if (ev && ev._w4prio === undefined) { ev._w4prio = ev._priorityType; ev._w4through = ev.isThrough(); } }
    function showEv(ev) {
        if (!ev || ev._w4hidden === false) return;
        remember(ev);
        ev.setTransparent(false); ev.setThrough(!!ev._w4through); ev._priorityType = ev._w4prio === undefined ? 1 : ev._w4prio;
        ev._w4hidden = false;
    }
    function hideEv(ev) {
        if (!ev || ev._w4hidden === true) return;
        remember(ev);
        ev._w4hidden = true;
        ev.setTransparent(true); ev.setThrough(true); ev._priorityType = 0;
    }
    const hidden = ev => !!ev && ev._w4hidden === true;
    const barBorgar = () => { const s = ST(); try { return s && s.borgarEvent ? s.borgarEvent() : null; } catch (e) { return null; } };
    function sync() {
        if (!has()) return;
        if (onMap(MAP.cellar)) {
            const b = evOf(EV.cellarBorgar), f = evOf(EV.cellarFire);
            if (b) { if (cellarBorgarNow()) showEv(b); else hideEv(b); }
            if (f) { if (cellarFireOn()) showEv(f); else hideEv(f); }
        } else if (onMap(MAP.floor10)) {
            const b = evOf(EV.postBorgar);
            if (b) { if (postBorgarNow()) showEv(b); else hideEv(b); }
            for (const id of [EV.postFire, EV.postBasket]) { const e = evOf(id); if (e) { if (stance() === "idzie" && postsOn()) showEv(e); else hideEv(e); } }
        } else if (onMap(MAP.tavern) && !siegeOn()) {
            const b = barBorgar();
            if (b) { if (barAway()) hideEv(b); else if (hidden(b)) showEv(b); }
        }
    }
    // the parallel "Atmosfera - Borgar" of the tavern shows balloons over him: not while he is away
    const _requestBalloon = Game_Temp.prototype.requestBalloon;
    Game_Temp.prototype.requestBalloon = function(target) {
        if (target instanceof Game_Event && hidden(target)) return;
        return _requestBalloon.apply(this, arguments);
    };

    // ------------------------------------------------------------------
    // The tavern's own events answer in code (the user's Map001 untouched): Borgar and the counter on the shut day / while he is away;
    // the cellar's grate asks first while his warning stands
    // ------------------------------------------------------------------
    const STUB_CLOSED = [C(355, ["Kasztelan.closed(this)"]), C(0, [])];
    const STUB_GRATE = [C(355, ["Kasztelan.grate(this)"]), C(0, [])];
    const STUB_DOOR = [C(355, ["Kasztelan.door(this)"]), C(0, [])];
    const counterTag = ev => {
        if (ev._w4counter === undefined) {
            const d = ev.event(), p = d && d.pages ? d.pages.map(pg => JSON.stringify(pg.list)).join("") : "";
            ev._w4counter = /<Tavern:meal[\s>]/.test(p + ((d && d.note) || ""));
        }
        return ev._w4counter;
    };
    const grateOf = ev => { const d = ev.event(); return !!d && /^Stara krata zakonu/.test(d.name || ""); };
    const doorOf = ev => { const d = ev.event(); return !!d && /^Drzwi tawerny/.test(d.name || ""); };
    let grateGo = false;   // (the warning answered "Zejdź": the original commands once)
    // (2026-10-23) the core's one list hook (Tawerna.onEventList): "closed" - the first asked (as the old wrapper, the outermost of the
    // plugin list): the bar shut over Story's Borgar and TavernLife's counter, the tavern's door, the grate over TownQuests' W4 stub
    T.onEventList(ev => {
        if (window.$gameMap && has() && ev._mapId === $gameMap.mapId()) {
            const m = ev._mapId;
            if (m === MAP.tavern && !siegeOn()) {
                const S0 = ST(), role = S0 && S0.roleOf ? S0.roleOf(ev) : null;
                if (role === "borgar" && (closedBarNow() || hidden(ev))) return STUB_CLOSED;
                if (role !== "borgar" && (closedBarNow() || barAway()) && counterTag(ev)) return STUB_CLOSED;
            } else if (m === MAP.town && doorClosedNow() && doorOf(ev)) return STUB_DOOR;
            else if (m === MAP.cellar && !grateGo && grateOf(ev) && ev.findProperPageIndex() >= 1 && S().warned && !S().fired && !S().back) return STUB_GRATE;
        }
        return null;
    }, { owner: PLUGIN, priority: T.onEventList.PRIORITY.closed });
    function closedTalk(interp) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev) return;
        const S0 = ST(), role = S0 && S0.roleOf ? S0.roleOf(ev) : null;
        if (role === "borgar" && !hidden(ev)) { run(interp, w.rozmowa("zamkniete", { spk: { id: ev.eventId(), name: "Borgar" } })); return; }
        T.popup(closedBarNow() ? TX.closedCounter : TX.awayCounter, { kind: "info" });
    }
    // the grate: the warning, "Zejdź" (the shifts gone - zwolnij - then the grate's own commands) / "Zostań na górze"
    function grateTalk(interp) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev) return;
        run(interp, w.rozmowa("krata", { spk: HERO }));
    }
    // "Zejdź": the grate's own commands (its open page: down to the castle's ruins)
    function grateDown(interp) {
        const ev = interp && $gameMap.event(interp.eventId());
        if (!ev) return;
        grateGo = true;
        let list = null;
        try { list = (ev.list() || []).slice(); } finally { grateGo = false; }
        if (!list || !list.length) return;
        if (list[list.length - 1].code === 0) list.pop();
        run(interp, list);
    }
    // the town's door of the tavern (Map008 "Drzwi tawerny") on the shut day: a popup over the hero, a step back - only the door:
    // the scenes' own transfers (the Heart's film, F9) go in as always
    function doorTalk(interp) {
        if (!has()) return;
        T.popup(TX.closedDoor, { kind: "info" });
        stepBack($gamePlayer);
    }
    function stepBack(p) {
        const back = { 2: 8, 4: 6, 6: 4, 8: 2 }[p.direction()] || 2;
        const x = $gameMap.roundXWithDirection(p.x, back), y = $gameMap.roundYWithDirection(p.y, back);
        if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f)) { p.locate(x, y); p.setDirection(back); }
    }
    // the shifts (Story.js's Borgar asks): the shut day; the hero went down after the warning (till the siege is over and they made up)
    function shiftBan() {
        if (!has()) return null;
        if (closedBarNow()) return TX.shiftClosed;
        const s = S();
        if (s.fired && !s.back) return TX.shiftFired;
        return null;
    }

    // ------------------------------------------------------------------
    // The injected events: Kasztelan.act(this) - by the event (the talks' own script calls go to the engine: Watki.act)
    // ------------------------------------------------------------------
    // (the old names of the talks' actions - a command list made before 2026-10-23 still works)
    const OLD = { clue: a => (a === "kleofas" ? "poszlakaKleofas" : "poszlakaDziadek"), tell: () => "tell", anger: () => "anger", keep: () => "keep",
        verdict: a => a, fire: () => "zwolnij", back: () => "pogodzenie" };
    function actCall(interp, args) {
        if (!has()) return;
        try {
            if (Array.isArray(args)) {
                const [what, a] = args, name = OLD[what] ? OLD[what](a) : what;
                return w.akcja(name, what === "tell" ? [!!a] : [], interp);
            }
            if (!interp) return;
            const ev = $gameMap.event(interp.eventId());
            if (!ev || hidden(ev)) return;
            const k = keyOf(ev), spk = { id: ev.eventId(), name: "Borgar" };
            if (k === "borgar") run(interp, w.rozmowa("piwnicaBorgar", { spk, key: "borgar" }));
            else if (k === "post") {
                const s = S(), first = !s.postSeen;
                s.postSeen = s.postSeen || day();
                run(interp, w.rozmowa("warta", { spk, key: "borgar", pierwszy: first }));
            } else if (k === "kosz") basket(interp);
            else if (k === "zar") T.popup(TX.fireCellar, { kind: "info" });
            else if (k === "ognisko") T.popup(TX.firePost, { kind: "info" });
        } catch (e) { report("act", e); }
    }
    // Borgar's basket at the tenth gate: bread and water once a day
    function basket(interp) {
        const s = S();
        if (s.basket === day()) { T.popup(TX.basketEmpty, { kind: "info" }); return; }
        s.basket = day();
        run(interp, w.rozmowa("kosz", { spk: HERO }));
        if (window.$dataItems && $dataItems[BREAD]) {
            $gameParty.gainItem($dataItems[BREAD], 1);
            T.popup($dataItems[BREAD].name + " ×1", { icon: $dataItems[BREAD].iconIndex || BREAD_ICON, kind: "good" });
        }
        const N = T.api("Needs") || window.Needs;
        let got = 0;
        try { got = N && N.drink ? N.drink(WATER) : 0; if (N && N.fillSkin) N.fillSkin(); } catch (e) { got = 0; }
        if (got > 0) T.popup(fill(TX.nawodnienie, { n: got }), { kind: "good" });
    }
    // after the siege of Act III: back behind the bar (its talk: rozmowy.pogodzenie)
    const reconcileReady = () => !!S().fired && !S().back && siegeOver() && !barAway();

    // ------------------------------------------------------------------
    // W4's steps (Kasztelan_Data kroki): what their texts and checks ask of the game
    // ------------------------------------------------------------------
    function serceText() {
        const s = S(), t = TX.serce;
        let out = t[s.stance] || t.niewie;
        if (s.stance === "pilnuje" && s.warned) out += s.back ? t.back : s.fired ? t.fired : t.warned;
        return out;
    }
    function endNow() {
        const u = ugState(), s = S(), U = UG();
        if (!u || !u.ending) return false;
        if (U && U.film && U.film.cinema) return false;   // (the ending's film first - the arc's popup after it)
        if (s.end) return true;
        const g = u.ending.kind === "straznik" && u.ending.guardian === "borgar";
        s.end = g ? "guardian" : s.stance || "none";
        notePair(TX.endNote[s.end] || TX.endNote.none);
        return true;
    }
    // the hooks the data names (Kasztelan_Data.js): conditions, words, code
    w.haki({
        // conditions
        fabula: () => { const St = ST(); return !!(St && St.active && St.active()); },
        rozdzial1: () => chapterEnded(),
        poZamknieciu: () => talkHours(),
        barNieMa: () => barAway(),
        nocePending: () => nightsPending(),
        przygotowany: () => prepared(),
        zaufanie: ctx => score(!!ctx.noce).ok,
        pogodzenieGotowe: () => reconcileReady(),
        nocWPiwnicy: () => cellarNightNow(),
        // the words
        powodyTak: ctx => score(!!ctx.noce).why,
        powodyNie: ctx => score(!!ctx.noce).whyNot,
        poszlakaZmienne: (ctx, key) => ({ nazwa: TX.clues[key], n: Math.min(clueCount(), NEED), need: NEED }),
        rodZmienne: () => rodVars(),
        piwnicaZmienne: () => ({ dzien: S().closed || day() }),
        serceZmienne: () => ({ serce: serceText() }),
        dzienZamkniecia: () => (hour() >= 12 ? day() + 1 : day()),
        // 6: three clues - the chapter's note goes with the step's popup (its reward: rodNagroda)
        rodGotowe: ctx => {
            if (syncClues() < NEED) return false;
            const n = rodDone();
            if (n && ctx.r) ctx.r.t.rodNote = n;
            return true;
        },
        rodNagroda: ctx => ({ note: (ctx.r && ctx.r.t.rodNote) || null }),
        koniecLuku: () => endNow(),
        // code
        powiedzNoce: () => tellNights(),
        sync: () => sync(),
        zamknijRozdzial1: () => { const St = ST(), ss = St.state(); ss.flags.hired = true; ss.paid = ss.debt; if (St.chapterDone) St.chapterDone(); },
        krata: (ctx, how) => { const U = UG(); if (U && U.open && U.close) { if (how === "zamknij") U.close(); else U.open(); } },
        zapiski: () => {   // (three clues: the Order's notes of floors 3, 6 and 10 read)
            const u = ugState(), s = S();
            if (u && u.notes) for (const k of ["3", "6", "10d"]) u.notes[k] = true;
            syncClues();
            if (!s.rod) s.rod = day();
        }
    });
    // W9's truth of his nights told after W4: Borgar knows his blood already; the town's remarks once (their words: the texts)
    W.poTekstach(() => {
        const q = TQ();
        try {
            const t = q && q.Q && q.Q.W9 && q.Q.W9.truths && q.Q.W9.truths.borgar;
            if (t && !(t.tellIf || []).some(x => x[0] === "borgarWie")) t.tellIf = (t.tellIf || []).concat([["borgarWie", TX.w9After]]);
        } catch (e) { report("W9 tellIf", e); }
        try {
            const D = window.TownQuestsData, R = [{ id: "w4Zamkniete", who: "piekarka", flag: "borgarZamknal" }, { id: "w4Kowadlo", who: "kowal", flag: "borgarWie" }];
            if (D && D.REMARKS) for (const m of R) if (!D.REMARKS.some(o => o.id === m.id)) D.REMARKS.push(Object.assign(m, { lines: TX.remarks[m.id] }));
        } catch (e) { report("remarks", e); }
    });

    // ------------------------------------------------------------------
    // The frame, the maps, the Heart's lock, a descent after the warning
    // ------------------------------------------------------------------
    T.onMapUpdate((scene, n) => {
        if (scene !== SceneManager._scene || !has()) return;
        if (n % 20 === 0) sync();
        // Borgar's word when the hero comes by his post
        if (n % 30 === 0) {
            const b = onMap(MAP.cellar) ? evOf(EV.cellarBorgar) : onMap(MAP.floor10) ? evOf(EV.postBorgar) : null;
            if (b && !hidden(b) && !$gameMap.isEventRunning() && Math.hypot(b.x - $gamePlayer.x, b.y - $gamePlayer.y) < 3.5) {
                const s = S(), k = "bark" + $gameMap.mapId();
                if (s[k] !== day()) { s[k] = day(); sayOver(b, onMap(MAP.cellar) && !cellarNightNow() ? pick(TX.cellarGuardDown) : TX.postBark, 220); }
            }
        }
    }, { owner: PLUGIN, name: "update" });
    T.on("mapReady", () => {
        if (!has()) return;
        for (const id of [EV.cellarBorgar, EV.cellarFire, EV.postBorgar, EV.postFire, EV.postBasket]) { const e = evOf(id); if (e) { e._w4hidden = undefined; hideEv(e); } }
        sync();
        // a descent after the warning by any way (the grate, the diggers' tunnel): the shifts are gone
        const U = UG(), m = $gameMap.mapId();
        let down = m === MAP.ruins;
        try { down = down || !!(U && U.isUnderground && U.isUnderground(m)); } catch (e) { /* (as is) */ }
        if (down && S().warned && !S().fired && !S().back) w.akcja("zwolnij", []);
        if (w4Active()) { syncClues(); autoChecks(); }
    }, { owner: PLUGIN });
    T.on("undergroundLock", e => {
        if (!has() || !e || e.lock !== "key" || S().keyLock) return;
        S().keyLock = day();
        notePair(TX.noteKeyLock);
        think(TX.keyLock);
    }, { owner: PLUGIN });
    T.on("undergroundEnding", () => { if (has()) autoChecks(); }, { owner: PLUGIN });
    T.on("load", () => { grateGo = false; }, { owner: PLUGIN });
    T.on("newGame", () => { grateGo = false; }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // For the Heart's world (Underground.js), its epilogue and Act III
    // ------------------------------------------------------------------
    function forWorld() {
        const s = S();
        return { stance: s.stance || null, told: s.how === "tell", closed: !!s.closed, warned: !!s.warned, fired: !!s.fired && !s.back, back: !!s.back,
            clues: clueCount(), keyLock: !!s.keyLock };
    }
    function epilogue(kind, wd, who) {
        const s = S(), E = TX.epilog, guardian = kind ? kind === "straznik" && who === "borgar" : guardianNow();
        if (guardian) return null;
        if (s.stance === "pilnuje" && s.fired && !s.back) return E.fired;
        return E[s.stance] || null;
    }

    // ------------------------------------------------------------------
    // API (F9's jumps are the data's - Kasztelan_Data skoki, run by the engine: Watki.skocz("kasztelan", i))
    // ------------------------------------------------------------------
    const JUMP = w.def.skoki.lista;
    window.Kasztelan = T.register(PLUGIN, {
        TX, POS, EV, HOURS, JUMP, CLUES, NEED, state: () => S(), act: actCall, closed: closedTalk, grate: grateTalk, grateDown, door: doorTalk,
        shiftBan, forWorld, epilogue, debugJump: i => w.skocz(i), sync, syncClues, clueCount, score, stance, step: () => cur(),
        closedNow: () => closedBarNow(), doorClosed: () => doorClosedNow(), cellarNight: () => cellarNightNow(), barAway: () => barAway(),
        nightsPending, prepared, reconcileReady, f9Name: i => w.skokNazwa(i)
    });
})();
