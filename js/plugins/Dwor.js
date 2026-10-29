//=============================================================================
// Dwor.js
//=============================================================================
// The engine of the arc W7 "Dwór z kamieni twierdzy" (docs/QUESTY.md W7; the data: Dwor_Data.js) - VARIANT A (the user's choice
// 2026-10-17): the Lord knows nothing; Feliks, his butler, sells the faction (Straż Pewności - "the Black Eyes") the water of the
// Order's canal, news and the raven stones of the manor's own walls. The chapters:
//   1 "Dług" - grandpa's debt (Story.js); half of it paid (or half of the buyback once the field is lost: Story.halfWay)
//   2 "Zaproszenie" - the Lord asks the hero in (the manor's door of the user's Map024, event 1, answers in code): the hall of the
//     fortress stones (Map172), every tenth with a carved raven - three gone by the study's door; the family chronicle in the
//     library (Map173) = the fifth verse of W3. From then on the door lets him in by day (8-20)
//   3 "Dwa życia Feliksa" - the hero follows Feliks a whole day (C sneaks): 6-10:30 the market, 10:30-20 the hall's lectern, about
//     2:00 the hatch behind the orangery with Kuba (W1's water - he comes UP from under the hatch), a midnight a week at the
//     kantor's back door (Kantor.js). Three of the four: the journal's note "Plan dnia Feliksa". Feliks already gone (W1 a/b): his
//     traces instead - Teodor, Hanka, Kuba, Baltazar's register
//   4 "Gabinet nocą" - at night the hatch (the user's event 2 of Map024) takes him down the Order's old canal and up through the
//     study's trapdoor (Map174): Feliks's writing desk, the key in the inkwell, the letters in his hand "Do sztabu Straży Pewności":
//     take them / copy them (half an hour) / leave them. Feliks comes through the trapdoor at 1:30 and back at 3:00 - caught: shown out
//   4b "Prawda" - the letters to the Lord (by day at his door), or told without them (he checks himself and answers the next day):
//     he breaks; Feliks is arrested - or fled on the ferry when the letters were taken and he noticed; the Lord an ally (lordAlly)
//   5 "Ostatnia spłata" - the end of chapter 1 (Story.chapterEnded: paid, or the field lost); the legend's hook is Story's
//   6 "Do kogo najpierw" (Act II - the grate open and the hero has been down): the Lord asks what is under the rocks - tell him all
//     (100 G a week, the armoury's gear, his men follow the hero down: W9's rival "the Lord's men"), stay silent (Feliks, if still
//     here, spies for the faction), lie (found out after a while: the manor hostile - a dearer toll, the hut searched)
//   7 "Lord przy Sercu" - Underground.js's own scene (the son Kazimierz); W7 ends when it has played
// Events: Tawerna.inject ids 570-599 (owner "Dwor"). The user's maps are not changed: Map024's door and hatch answer through
// Game_Event.list while W7 needs it. API: window.Dwor (Tawerna.api("Dwor")).
// The thread (Dwor_Data.js, the engine Watki.js, 2026-10-28): the state "dwor", W7's steps and their conditions, the talks (the
// Lord's words at his door, Feliks's traces, the drawer, the hatch and the trapdoor) with their actions, the F9 jumps - this file
// gives their hooks (w.haki): which of the Lord's talks and when, the scenes (the tour, the chronicle, the catch), the watch.

/*:
 * @target MZ
 * @plugindesc [W7] Wątek „Dwór z kamieni twierdzy” (wariant A): zaproszenie, hol z krukami, kronika rodu, dwa życia Feliksa, gabinet nocą, prawda dla Lorda, Akt II. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Dwor_Data
 * @orderAfter Dwor_Data
 * @orderAfter TownQuests
 * @orderAfter Story
 * @orderAfter Kantor
 * @orderAfter Rywal
 *
 * @help
 * ============================================================================
 * Dwor.js - wątek W7 „Dwór z kamieni twierdzy” (wariant A: Lord nic nie wie)
 * ============================================================================
 * Rozdziały: 1 dług dziadka (połowa spłacona), 2 zaproszenie do dworu (hol
 * z kamieni twierdzy - mapa 172, kronika rodu w bibliotece - mapa 173),
 * 3 dwa życia Feliksa (śledzenie przez dobę: rynek, hol, właz za oranżerią,
 * kantor), 4 gabinet nocą (kanał spod włazu, gabinet - mapa 174, listy
 * Feliksa: zabierz / przepisz / zostaw), prawda dla Lorda, 5 ostatnia spłata,
 * 6 do kogo najpierw (Akt II), 7 Lord przy Sercu (Underground.js).
 * Drzwi dworu (zdarzenie 1 mapy 24) wpuszczają zaproszonego za dnia (8-20);
 * właz z krukiem za oranżerią (zdarzenie 2 mapy 24) nocą prowadzi do gabinetu.
 * Zdarzenia 570-599 (rejestr TawernaCore: "Dwor"). F9, zakładka „Wyspa i
 * fabuła”: „W7: rozdział N”.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    const D = window.DworData;
    if (!T) throw new Error("Dwor.js: brak TawernaCore.js");
    if (!D) { console.warn("Dwor.js: brak Dwor_Data.js - wątek W7 wyłączony"); return; }
    const PLUGIN = "Dwor";
    // the thread (Dwor_Data.js, the engine Watki.js): the state "dwor", W7's steps, the talks, the F9 jumps, the hero's thoughts
    const w = Watki.get("dwor");
    if (!w) throw new Error("Dwor.js: brak wątku „dwor” (Dwor_Data.js / Watki.js)");
    const M = D.MAP, EV = D.EV, P = D.PLACES, TM = D.TIME, TX = D.TX, ART = D.ART, OBS = D.OBS;
    const COIN_ICON = 314;
    const { HERO, C, fill } = Watki.mowa;   // (the hero as a speaker, the event commands' maker, {words} filled: the engine's)
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const ST = () => T.api("Story") || window.Story || null;
    const UG = () => T.api("Underground") || window.Underground || null;
    const SB = () => T.api("SpeechBubbles") || window.SpeechBubbles || null;
    const HU = () => T.api("Hunting") || window.Hunting || null;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const nightOf = () => (hour() < 12 ? day() - 1 : day());
    const clock = () => { const h = hour(); return h < 12 ? h + 24 : h; };   // (the night's clock: 22 ... 29)
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const onMap = id => !!(window.$gameMap && $gameMap.mapId() === id);
    const report = (where, e) => console.error("[Dwor] " + where + ":", e);
    const K = () => TX.kod;   // (the words of this file: js/teksty/dwor.txt, kod.*)
    const sneaking = () => !!T.call("Hunting", "sneaking");

    // ------------------------------------------------------------------
    // The state (the save): the thread's (Dwor_Data.js - Tawerna.state "dwor" v1)
    // ------------------------------------------------------------------
    const S = () => w.S();

    // TownQuests' flags, things, records (the thread's helpers)
    const { flags, flag, setFlag, vcount, vgive, vtake, rec } = w;
    const isActive = id => w.active(id);
    const opinion = (n, why) => { const q = TQ(); return q && q.addOpinion ? q.addOpinion(n, why) : 0; };
    const xp = (n, why) => T.call("Combat", "gainXp", n, why || "W7", true);
    const autoChecks = () => w.autoChecks();
    const actTwo = () => { const q = TQ(); try { return !!(q && q.actTwo && q.actTwo()); } catch (e) { return false; } };
    const gone = key => !!T.call("TownLife", "gone", key);
    const storyOn = () => { const s = ST(); try { return !!(s && s.active && s.active()); } catch (e) { return false; } };
    const chapterEnded = () => { const s = ST(); try { return !!(s && s.chapterEnded && s.chapterEnded()); } catch (e) { return false; } };
    const butler = () => (gone("feliks") ? "Teodor" : "Feliks");
    const feliksHere = () => !gone("feliks") && !flag("feliksArrested");
    // Feliks still takes water to Kuba at night (W1: the sluice not half open, Kuba in town)
    const tradeOn = () => feliksHere() && !flag("sluiceHalf") && !gone("woziwoda");
    const hasProof = () => vcount("listy_feliksa") > 0 || vcount("odpis_listow") > 0;
    // the W7 record and its step's name (the thread's: the steps' names of Dwor_Data)
    const w7 = () => rec("W7");
    const cur = () => w.cur("W7");
    const at = name => w.at(name);
    const reached = name => { const r = w7(); return !!r && (r.s === "done" || (r.s === "active" && r.step >= w.stepOf(name))); };
    // journal notes: a new one, or the same title's text replaced (the plan of Feliks's day grows)
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const notePair = (p, vars) => note(p[0], fill(p[1], vars));
    function noteSet(title, text) {
        const J = T.api("Journal"), d = J && J.data ? J.data() : null, n = d && d.notes ? d.notes.find(x => x.title === title) : null;
        if (!n) return note(title, text);
        n.text = text; n.day = day();
        T.popup(fill(K().notatkaUzupelniona, { tytul: title }), { color: "#eceef0" });
    }

    // ------------------------------------------------------------------
    // Talk helpers (event commands; "> " the hero, "@key: " a resident nearby) - the engine's builder (Watki.mowa); the talks of the
    // scenes (the tour, the chronicle, the catch) are built here, the others are the data's (Dwor_Data rozmowy)
    // ------------------------------------------------------------------
    function speaker(key) {
        const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null, r = L && L.RESIDENTS ? L.RESIDENTS.find(x => x.key === key) : null;
        return { id: ev && $gameMap.event(ev.eventId()) === ev ? ev.eventId() : -1, name: r ? r.name : key };
    }
    const MOWA = { kto: speaker };
    const linesTo = (out, spk, arr, vars, ind) => Watki.mowa.linesTo(out, spk, arr, vars, ind, MOWA);
    const choiceTo = Watki.mowa.choiceTo;
    const act = (out, args, ind) => (out.push(C(355, ["Dwor.act(this, " + JSON.stringify(args) + ")"], ind)), out);
    const say = (ch, text, frames) => { const sb = SB(); if (sb && sb.say && ch) sb.say(ch, text, frames || 200); };
    // thoughts over the hero, one after another (the thread's: Dwor_Data mysli)
    const think = lines => w.mysl(lines);
    function advance(hours) {
        if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(hours);
        else $gameSystem.setDayNightHour((hour() + hours) % 24);
    }

    // ------------------------------------------------------------------
    // The events (Tawerna.inject 570-599): built for each map; shown / hidden at runtime by the state
    // ------------------------------------------------------------------
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function eventData(id, name, x, y, o) {
        o = o || {};
        const img = o.img || ["", 0, 2, 1];
        const page = { conditions: Object.assign({}, BLANK), directionFix: !!o.fix, image: { tileId: 0, characterName: img[0], direction: o.dir || img[2], pattern: img[3], characterIndex: img[1] },
            list: [C(355, ["Dwor.act(this);"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false },
            moveSpeed: o.speed || 3, moveType: 0, priorityType: o.priority === undefined ? 1 : o.priority, stepAnime: false, through: !!o.through, trigger: 0, walkAnime: o.walk !== false };
        return { id, name: "W7: " + name, note: "<Dwor:" + o.key + ">" + (o.bust ? "<Bust:" + o.bust + ">" : "") + "<BustName:" + (o.bustName || name) + ">" + (o.note || ""), pages: [page], x, y };
    }
    const LANTERN = "<Light:130,255,170,90><LightFlicker:0.14,255,130,60><LightHeight:24>";
    function build(data, mapId) {
        const out = [];
        const spot = (name, def) => { const e = (data.events || []).find(v => v && v.name === "Miejsce: " + name); return e ? [e.x, e.y, def ? def[2] : 2] : def; };
        if (mapId === M.hol) { const p = spot("lord_hol", P.hol.lord); out.push(eventData(EV.lordHol, K().nazwy.lordPelne, p[0], p[1], { key: "lordHol", img: ART.lord, dir: P.hol.lord[2], bustName: K().nazwy.lord })); }
        else if (mapId === M.bib) { const p = spot("lord_kronika", P.bib.lord); out.push(eventData(EV.lordBib, K().nazwy.lordPelne, p[0], p[1], { key: "lordBib", img: ART.lord, dir: P.bib.lord[2], bustName: K().nazwy.lord })); }
        else if (mapId === M.gab) {
            const f = spot("feliks_klapa", P.gab.feliks), l = spot("listy", [P.gab.listy[0], P.gab.listy[1], 8]);
            out.push(eventData(EV.feliksGab, K().nazwy.feliks, f[0], f[1], { key: "feliksGab", img: ART.feliks, dir: 8, bustName: K().nazwy.feliks }));
            out.push(eventData(EV.listy, K().nazwy.listy, l[0], l[1], { key: "listy", img: ART.listy, fix: true, walk: false, priority: 0, through: true }));
        } else if (mapId === M.manor) {
            const pf = P.manor.feliksNoc, pk = P.manor.kubaNoc;
            // (Feliks keeps a small lantern by the hatch - every light a flame; its light only when the map comes up in his hours)
            const lit = has() && hatchNight() && !w1Hatch() ? LANTERN : "";
            out.push(eventData(EV.feliksNoc, K().nazwy.feliks, pf[0], pf[1], { key: "feliksNoc", img: ART.feliks, dir: pf[2], bustName: K().nazwy.feliks, note: lit }));
            out.push(eventData(EV.kubaNoc, K().nazwy.kuba, pk[0], pk[1], { key: "kubaNoc", img: ART.kuba, dir: pk[2], bustName: K().nazwy.kuba }));
        }
        return out.filter(e => e.x < data.width && e.y < data.height);
    }
    T.inject([M.hol, M.bib, M.gab, M.manor], { ids: D.IDS, owner: PLUGIN, build });

    const evOf = id => (window.$gameMap ? $gameMap.event(id) : null);
    const keyOf = ev => { const m = ev && ev.event && ev.event() && /<Dwor:(\w+)>/.exec(ev.event().note || ""); return m ? m[1] : ""; };
    function remember(ev) { if (ev && ev._w7prio === undefined) { ev._w7prio = ev._priorityType; ev._w7through = ev.isThrough(); } }
    function showEv(ev) {
        if (!ev) return;
        remember(ev);
        if (ev._w7hidden !== false) { ev.setTransparent(false); ev.setThrough(!!ev._w7through); ev._priorityType = ev._w7prio === undefined ? 1 : ev._w7prio; ev._w7hidden = false; }
    }
    function hideEv(ev) {
        if (!ev || ev._w7hidden === true) return;
        remember(ev);
        ev._w7hidden = true;
        ev.setTransparent(true); ev.setThrough(true); ev._priorityType = 0;
    }
    const hidden = ev => !ev || ev._w7hidden === true;
    const residentEv = key => { const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null; return ev && !(ev._town && ev._town.hidden) && !ev.isTransparent() ? ev : null; };
    // Feliks and Kuba at the hatch tonight - W1's own place shows them while W1's fifth chapter wants it (not both)
    const w1Hatch = () => { const q = TQ(); try { const sw = q && q.spotWanted ? q.spotWanted("w1_feliks") : null; return !!(sw && sw.ready); } catch (e) { return false; } };
    const hatchNight = () => inHours(hour(), TM.hatch) && tradeOn();
    let drawerShown = false;
    function sync() {
        if (!has()) return;
        const s = S();
        if (onMap(M.hol)) { const l = evOf(EV.lordHol); if (s.tour === 1 && !s.tourGone) showEv(l); else hideEv(l); }
        if (onMap(M.bib)) { const l = evOf(EV.lordBib); if (s.tour === 1) showEv(l); else hideEv(l); }
        if (onMap(M.gab)) {
            const f = evOf(EV.feliksGab), l = evOf(EV.listy);
            if (!catchRun) hideEv(f);
            if (drawerShown) showEv(l); else hideEv(l);
        }
        if (onMap(M.manor)) {
            const on = hatchNight() && !w1Hatch();
            for (const id of [EV.feliksNoc, EV.kubaNoc]) { const e = evOf(id); if (on) showEv(e); else hideEv(e); }
        }
    }

    // ------------------------------------------------------------------
    // Map024: the manor's door (event 1, found by its name like Story.js) and the user's hatch (event 2: !Fantasy_door2 7 at 3,20)
    // answer in code while W7 needs it; Story's own door talk stays below
    // ------------------------------------------------------------------
    const DOOR_STUB = [C(355, ["Dwor.door(this)"]), C(0, [])];
    const HATCH_STUB = [C(355, ["Dwor.hatch(this)"]), C(0, [])];
    const isDoor = ev => ev._mapId === M.manor && /^Drzwi dworu/i.test((ev.event() && ev.event().name) || "");
    function isHatch(ev) {
        if (ev._mapId !== M.manor || ev.eventId() >= 500) return false;
        const d = ev.event(), p = d && d.pages && d.pages[0], img = p && p.image;
        if (img && img.characterName === "!Fantasy_door2" && img.characterIndex === 7) return true;
        return !!d && d.x === P.manor.hatch[0] && d.y === P.manor.hatch[1];
    }
    const canEnter = () => storyOn() && inHours(hour(), TM.lord) && (S().invited > 0 || S().tour === 1) && !S().lieOut;
    const hatchOn = () => storyOn() && reached("w7Gabinet");
    // (2026-10-23) the core's one list hook (Tawerna.onEventList): a scene at the manor's door - over Story's own door talk, after
    // Kasztelan's (as the old wrappers by the plugin list)
    T.onEventList(ev => {
        if (ev._mapId === M.manor && has()) {
            try {
                if (isDoor(ev) && canEnter()) return DOOR_STUB;
                if (hatchOn() && isHatch(ev)) return HATCH_STUB;
            } catch (e) { report("list", e); }
        }
        return null;
    }, { owner: PLUGIN, priority: T.onEventList.PRIORITY.scene + 30 });
    function door(interp) {
        if (!has() || !interp) return;
        if (canEnter()) {
            const H = P.hol.land;
            interp.setupChild([C(250, [{ name: "Door1", volume: 80, pitch: 100, pan: 0 }]), C(201, [0, M.hol, H[0], H[1], H[2], 0]), C(0, [])], interp.eventId());
            return;
        }
        const St = ST();
        if (St && St.talk) St.talk(interp, "door");
    }
    function hatch(interp) {
        if (!has() || !interp) return;
        const s = S();
        if (!inHours(hour(), TM.night)) { T.popup(TX.wlazDzien, { kind: "info" }); return; }
        if (hatchNight()) { T.popup(TX.wlazFeliks, { kind: "info" }); return; }
        if (s.bolt >= nightOf() && feliksHere()) { T.popup(TX.wlazRygiel, { kind: "info" }); return; }
        w.uruchom(interp, w.rozmowa("wlaz", { spk: HERO }));   // (the data's talk: down the canal or not)
    }

    // ------------------------------------------------------------------
    // Chapter 2: the tour (the hall on arrival, the chronicle in the library)
    // ------------------------------------------------------------------
    const LORD_HOL = { id: EV.lordHol, get name() { return K().nazwy.lord; } }, LORD_BIB = { id: EV.lordBib, get name() { return K().nazwy.lord; } };
    const ROUTE = (id, codes, wait) => C(205, [id, { list: codes.map(c => (typeof c === "number" ? { code: c, indent: null } : Object.assign({ indent: null }, c))).concat([{ code: 0 }]),
        repeat: false, skippable: true, wait: !!wait }]);
    const rep = (code, n) => Array(n).fill(code);
    function tourList() {
        const out = [], fel = residentEv("feliks");
        for (const [who, text] of TX.tour) {
            if (who === "walk") {
                // the Lord to the wall with the ravens (16,5), the hero up the runner and beside him (14,6) - the wall in view
                out.push(ROUTE(-1, rep(4, 7).concat(rep(3, 3), [19])), ROUTE(EV.lordHol, rep(4, 4).concat(rep(3, 4), rep(4, 3), [19]), true));
                out.push(C(230, [30]));
                continue;
            }
            if (who === "feliks") { if (fel) linesTo(out, { id: fel.eventId(), name: "Feliks" }, [text]); continue; }
            if (who === "hero") linesTo(out, HERO, [text]);
            else linesTo(out, LORD_HOL, [gone("feliks") && /^Feliks dba o mury/.test(text) ? TX.tourMuryGone : text]);
        }
        // the Lord goes ahead to the library's door and in (round the hero: down the row below him)
        out.push(ROUTE(EV.lordHol, rep(1, 2).concat(rep(2, 12), rep(4, 3), [2, 19]), true));
        out.push(C(250, [{ name: "Door1", volume: 80, pitch: 100, pan: 0 }]));
        act(out, ["tourGone"]);
        return out;
    }
    function kronikaList(ev) {
        const s = S(), out = [];
        if (s.tour === 1) {
            for (const [, text] of TX.tourKronika) linesTo(out, LORD_BIB, [text], { butler: butler() });
            return act(out, ["kronika"]);
        }
        return linesTo(out, HERO, TX.kronikaSam);
    }
    function kronikaRead() {
        const s = S();
        if (s.tour !== 1) return;
        s.tour = 2; s.invited = day();
        setFlag("w7Kronika");
        notePair(TX.noteKronika);
        // W3 "Pieśń o Kruczych Skałach": the fifth verse (the chronicle) - when W3 is collecting its verses now
        const q = TQ();
        try { if (q && q.act && isActive("W3") && q.hasVerse && !q.hasVerse("kronika")) q.act(null, ["W3", "fx", "w3Verse", "kronika"]); } catch (e) { report("w3 verse", e); }
        xp(60, K().xp.kronika);
        autoChecks();
        sync();
    }

    // ------------------------------------------------------------------
    // Chapter 3: Feliks's two lives (what the hero saw; his traces when he is gone)
    // ------------------------------------------------------------------
    const OBS_KEYS = ["rano", "dzien", "noc", "kantor"];
    function kantorSaw() { const K = T.api("Kantor"); try { const g = K && K.state ? K.state().guests : null; return g && g.feliks ? g.feliks : 0; } catch (e) { return 0; } }
    function registerSeen() {
        const K = T.api("Kantor");
        let reg = false;
        try { reg = !!(K && K.state && K.state().reg && K.state().reg.done); } catch (e) { reg = false; }
        return reg || vcount("rejestr") > 0 || vcount("odpis_rejestru") > 0;
    }
    function syncObs() {
        const s = S();
        if (!s.obs.kantor && kantorSaw()) s.obs.kantor = kantorSaw();
        if (!s.obs.noc && flag("w1SawFeliks")) s.obs.noc = flags().w1SawFeliks;
        if (!s.traces.rejestr && gone("feliks") && registerSeen()) s.traces.rejestr = day();
    }
    const obsCount = () => { const s = S(); return OBS_KEYS.filter(k => s.obs[k]).length + (gone("feliks") ? Object.keys(s.traces).length : 0); };
    function planText() {
        const s = S(), P0 = TX.plan, lines = [P0.head];
        for (const k of OBS_KEYS) lines.push("- " + (s.obs[k] ? P0[k] : P0[k].split(":")[0] + ": " + P0.miss));
        if (gone("feliks") || Object.keys(s.traces).length) {
            lines.push("", P0.gone);
            for (const k of ["teodor", "hanka", "kuba", "rejestr"]) if (s.traces[k]) lines.push("- " + P0[k]);
        }
        if (obsCount() >= OBS.need) lines.push("", P0.foot);
        return lines.join("\n");
    }
    function observed(k, line) {
        const s = S();
        if (s.obs[k]) return;
        s.obs[k] = day();
        if (line) think([].concat(line));
        noteSet(TX.notePlanTitle, planText());
        xp(30, K().xp.plan);
        autoChecks();
    }
    function traced(k) {
        const s = S();
        if (s.traces[k]) return;
        s.traces[k] = day();
        noteSet(TX.notePlanTitle, planText());
        autoChecks();
    }
    // a watcher's eyes (the night guard of the garden, Feliks at the hatch): in front of him up to `front` tiles (`sneakFront`
    // sneaking), beside or behind a third of it; Hunting's cover between them hides the hero; a meter 0..1
    function guardSees(ev, who, front, sneakFront, noCover) {
        const H = HU(), sneak = sneaking();
        const v = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[ev.direction()] || [0, 1];
        const dx = $gamePlayer._realX - ev.x, dy = $gamePlayer._realY - ev.y, d = Math.hypot(dx, dy);
        const ahead = d < 0.5 || (dx * v[0] + dy * v[1]) / d > 0.3;
        const reach = ahead ? (sneak ? sneakFront : front) : (sneak ? 1 : front / 3);
        let covered = false;
        try { covered = !noCover && !!(H && H.coverBetween && d > 1.5 && H.coverBetween($gamePlayer._realX + 0.5, $gamePlayer._realY + 0.5, ev.x + 0.5, ev.y + 0.5)); } catch (e) { covered = false; }
        const rate = d <= reach && !covered ? (ahead ? 0.05 : 0.03) * (sneak ? 0.5 : 1) : 0;
        who._aware = Math.max(0, Math.min(1, (who._aware || 0) + (rate > 0 ? rate : -0.004)));
        return who._aware;
    }
    let pendingOut = null, eyes = {};
    function throwOut(why) {
        const o = P.manor.out;
        pendingOut = { at: Graphics.frameCount + 75, map: o[0], x: o[1], y: o[2], dir: o[3] };
        const got = opinion(-3, K().opiniaOgrod);
        T.popup(why || K().zlapali, { top: true, color: "#ff9f8f", sub: TX.caughtNoc + (got ? fill(K().opinia, { n: got }) : "") });
    }
    function updateWatch() {
        const s = S(), stepOn = at("w7Feliks") || at("w7Gabinet"), h = hour();
        if (!stepOn || $gameMap.isEventRunning() || pendingOut) return;
        // the market: Feliks shopping (6-10:30)
        if (onMap(M.town) && at("w7Feliks") && !s.obs.rano && feliksHere() && inHours(h, TM.market) && s.spotted.rano !== day()) {
            const f = residentEv("feliks");
            if (f && dist(f, $gamePlayer) <= OBS.near) {
                if (dist(f, $gamePlayer) < OBS.close && !sneaking()) { s.spotted.rano = day(); s.acc.rano = 0; say(f, TX.feliksSpotted, 180); return; }
                if (++s.acc.rano >= OBS.rano) observed("rano", TX.obsRano);
            }
        }
        // the hall: Feliks behind his lectern (10:30-20)
        if (onMap(M.hol) && at("w7Feliks") && !s.obs.dzien && feliksHere()) {
            const f = residentEv("feliks");
            if (f && dist(f, $gamePlayer) <= OBS.hall && ++s.acc.dzien >= OBS.dzien) observed("dzien", TX.obsDzien);
        }
        if (!onMap(M.manor)) return;
        // the garden at night: the guard's round (W1's fifth chapter keeps its own eyes) and Feliks at the hatch
        const inGarden = $gamePlayer.x <= P.manor.garden.x1 && $gamePlayer.y >= P.manor.garden.y0;
        if (!inGarden || !inHours(h, [21, 4.5]) || s.garden === nightOf()) return;
        const w1On = (() => { const r = rec("W1"); return !!r && r.s === "active" && W1Ch5(r); })();
        const g = residentEv("straznik");
        if (g && !w1On && guardSees(g, eyes.guard || (eyes.guard = {}), 5, 2) >= 1) {
            eyes.guard = {}; s.garden = nightOf(); say(g, TX.guardSees, 160); throwOut(); return;
        }
        const f = evOf(EV.feliksNoc);
        if (at("w7Feliks") && !s.obs.noc && f && !hidden(f)) {
            if (guardSees(f, eyes.feliks || (eyes.feliks = {}), 4, 2.2, true) >= 1) {   // (by the hatch itself: nothing hides the hero from him)
                eyes.feliks = {}; s.garden = nightOf(); say(f, TX.feliksNocKto, 160); throwOut(K().feliksZauwazyl); return;
            }
            if (dist(f, $gamePlayer) <= OBS.hatch && ++s.acc.noc >= OBS.noc) observed("noc", TX.obsNoc);
        }
    }
    function W1Ch5(r) { const q = TQ(), W1 = q && q.Q ? q.Q.W1 : null, st = W1 && W1.steps[r.step]; return !!(st && st.tick === "w1Orangery"); }

    // ------------------------------------------------------------------
    // Chapter 4: the study at night - the drawer, Feliks through the trapdoor
    // ------------------------------------------------------------------
    // Feliks's moments in the study tonight (he goes down at 1:30, comes up at 3:00) - only while he still takes water to Kuba
    const feliksInStudy = () => tradeOn() && (inHours(hour(), TM.down) || inHours(hour(), TM.up));
    function overlapsFeliks(from, len) {
        if (!tradeOn()) return false;
        const t0 = from, t1 = from + len;
        return [TM.down[0] + 24, TM.up[0] + 24].some(x => t0 < x + 0.15 && t1 > x);
    }
    const GAB = { id: EV.feliksGab, name: "Feliks" };
    function drawerList() {
        const s = S(), out = [], O = TX.szuflada;
        if (s.truth) { T.popup(K().szufladaPusta, { kind: "info" }); return null; }
        if (s.letters === "take") return linesTo(out, HERO, [O.done]);
        if (s.letters === "copy") return linesTo(out, HERO, [O.doneCopy]);
        return w.rozmowa("szuflada", { spk: HERO });   // (the data's talk: the key, the letters - take / copy / leave)
    }
    function drawerChoice(how, interp, stop) {
        const s = S(), O = TX.szuflada;
        const first = !s.letters;
        if (how === "copy" && overlapsFeliks(clock(), TM.copy)) {
            // (the copy runs into Feliks coming through the trapdoor: caught with the pen in hand)
            const at0 = [TM.down[0], TM.up[0]].find(x => { const c = clock(), wx = x + 24; return c < wx + 0.15 && c + TM.copy > wx; });
            if (at0 !== undefined) $gameSystem.setDayNightHour(at0 + 0.02);
            drawerShown = false;
            stop();   // (the frame's runner starts the catch once this talk is over: Feliks is in the study now)
            return;
        }
        if (how === "take") { vgive("listy_feliksa", 1); s.letters = "take"; s.lettersDay = day(); linesQueue(O.tookSay); setFlag("w7ListyZabrane"); }
        else if (how === "copy") { advance(TM.copy); vgive("odpis_listow", 1); s.letters = "copy"; s.lettersDay = day(); linesQueue(O.copySay); setFlag("w7ListyPrzepisane"); }
        else { if (s.letters !== "left") { s.letters = "left"; s.lettersDay = day(); } linesQueue(O.leaveSay); setFlag("w7ListyZostawione"); }
        if (first || !T.api("Journal") || !(T.api("Journal").data().notes || []).some(n => n.title === TX.noteListy[0])) notePair(TX.noteListy);
        w.complete("w7Gabinet", { to: "w7Prawda", reward: { xp: 120 } });   // (only while the study is the step on)
        autoChecks();
    }
    const linesQueue = lines => think(lines);
    let catchRun = false;
    function startCatch() {
        const s = S(), f = evOf(EV.feliksGab);
        catchRun = true;
        if (f) { const p = P.gab.feliks; f.locate(p[0], p[1]); f.setDirection(8); showEv(f); }
        s.caught = day(); s.bolt = nightOf() + 1;
        setFlag("w7FeliksCzujny");
        const out = [C(250, [{ name: "Door1", volume: 70, pitch: 70, pan: 0 }]), C(213, [EV.feliksGab, 1, true])];
        linesTo(out, GAB, TX.caughtGab);
        const L = P.manor.doorLand;
        out.push(C(221, []));
        act(out, ["caught"]);
        out.push(C(201, [0, M.manor, L[0], L[1], L[2], 0]), C(222, []));
        $gameMap._interpreter.setup(out.concat([C(0, [])]), EV.feliksGab);
    }
    function caughtDone() {
        catchRun = false;
        drawerShown = false;
        T.popup(TX.caughtGabPopup, { top: true, color: "#ff9f8f", sub: TX.caughtGabSub });
    }

    // ------------------------------------------------------------------
    // The truth: the letters (or the word) to the Lord - he breaks; Feliks arrested / fled / already gone; the Lord an ally
    // ------------------------------------------------------------------
    const LORD = () => { const St = ST(); return { id: St && St.NPCS ? St.NPCS.lord.id : 902, name: K().nazwy.lord }; };
    const lieOut = () => !!S().lieOut;
    function truthReady() {
        const s = S();
        if (s.truth || lieOut() || !storyOn() || !reached("w7Gabinet")) return false;
        return hasProof() || (s.letters === "left");
    }
    function fateNow() {
        const f = flags();
        if (S().fate) return S().fate;
        if (feliksHere()) return "arrest";
        if (f.w7FeliksUciekl) return "fled";
        if (f.w1Revealed) return "jailed";
        if (f.lordAlly) return "sent";
        return "gone";
    }
    // the truth's talks are the data's (Dwor_Data rozmowy: prawdaListy / powiedz / prawdaScena / powiedzCzekaj): which one - here.
    // ctx.how: the letters, the copy or the Lord's own check; ctx.los: Feliks's fate now (the Lord's line on it)
    function truthTalk(spk) {
        const s = S();
        if (!truthReady()) return null;
        const ctx = { spk, los: fateNow() };
        if (hasProof()) return { ready: true, list: w.rozmowa("prawdaListy", Object.assign(ctx, { how: vcount("listy_feliksa") > 0 ? "letters" : "copy" })) };
        if (s.letters === "left" && !s.told) return { ready: true, list: w.rozmowa("powiedz", ctx) };
        if (s.letters === "left" && s.told && day() > s.told) return { ready: true, list: w.rozmowa("prawdaScena", Object.assign(ctx, { how: "check" })) };
        if (s.letters === "left" && s.told) return { ready: false, list: w.rozmowa("powiedzCzekaj", ctx) };
        return null;
    }
    function truthDone(how) {
        const s = S();
        if (s.truth) return;
        s.truth = day(); s.how = how || "letters";
        const fate = fateNow();
        s.fate = fate;
        vtake("listy_feliksa", 9); vtake("odpis_listow", 9);
        for (const f of ["lordAlly", "w7Prawda"]) setFlag(f);
        if (fate === "arrest") {
            for (const f of ["w7FeliksZatrzymany", "feliksArrested"]) setFlag(f);
            T.call("TownLife", "setGone", "feliks", true);
        }
        // the reward: the debt (or the buyback) lighter, or a purse
        const St = ST(), ss = St && St.state ? St.state() : null;
        if (ss && !ss.lost && !ss.done && ss.paid < ss.debt) {
            $gameParty.gainGold(D.PAY.truthDebt);
            const paid = T.call("Story", "pay", D.PAY.truthDebt) || 0;
            T.popup(K().odpisDlugu, { top: true, color: "#ffe27a", sub: fill(K().odpisDluguSub, { n: paid }) });
        } else if (ss && ss.lost && ss.buy && !ss.buy.done) {
            ss.buy.price = Math.max(ss.buy.paid, ss.buy.price - D.PAY.truthBuyback);
            T.popup(K().odkupTanszy, { top: true, color: "#ffe27a", sub: fill(K().odkupTanszySub, { n: ss.buy.price }) });
            if (ss.buy.paid >= ss.buy.price && St.fieldReturned) St.fieldReturned();
        } else {
            $gameParty.gainGold(D.PAY.truthElse);
            T.popup(fill(K().odLorda, { n: D.PAY.truthElse }), { icon: COIN_ICON, kind: "gold" });
        }
        const G = T.api("Garnizon");
        try { if (G && G.addFavor) G.addFavor(10, K().przychylnosc); } catch (e) { report("garrison", e); }
        if (fate === "arrest") w1Broke("arrest");
        notePair(TX.noteTruth, { fate: TX.fateNote[fate] || "" });
        xp(200, K().xp.prawda);
        T.emit("w7Prawda", { how: s.how, fate });
        autoChecks();
    }

    // W1 6 c (the hush money): Feliks arrested by the Lord or fled over the sea - no more twenty groszy a week and no men of his on Polna
    // droga; W1 goes back to its big choice with the sluice's drawing (sołtys / the Lord / silence), as after the ambush won
    function w1Broke(fate) {
        const q = TQ(), r = rec("W1");
        if (!q || !q.Q || !q.Q.W1 || !r || r.s !== "active") return;
        const st = q.Q.W1.steps[r.step];
        if (!st || !(st.talk === "w1Feliks" || st.tick === "w1Ambush") || (r.t && r.t.amb)) return;
        setFlag("feliksBroke");
        notePair(TX.w1Broke, { fate: TX.w1BrokeFate[fate] || TX.w1BrokeFate.arrest });
        if (q.completeStep) q.completeStep("W1", { to: q.Q.W1.steps.findIndex(x => x.talk === "w1Choice") });
    }

    // ------------------------------------------------------------------
    // Act II (chapter 6): who first - the Lord, silence, a lie; the weekly pay; the lie found out (the toll, the search)
    // ------------------------------------------------------------------
    const beenDown = () => { const U = UG(); let open = false; try { open = !!(U && U.isOpen && U.isOpen()); } catch (e) { open = false; } return open && !!S().down; };
    // (the Lord's question and the three answers: the data's talk "najpierw" - its tone by the flags)
    function najpierwTalk(spk) {
        const s = S();
        if (s.najpierw || !actTwo() || !beenDown()) return null;
        return { ready: true, list: w.rozmowa("najpierw", { spk }) };
    }
    function najpierw(how) {
        const s = S();
        if (s.najpierw) return;
        s.najpierw = how; s.najDay = day();
        if (how === "lord") {
            setFlag("w7LordFirst");
            s.weekPaid = day();
            $gameParty.gainGold(D.PAY.week);
            T.popup(fill(K().odLorda, { n: D.PAY.week }), { icon: COIN_ICON, kind: "gold" });
            for (const [id, n] of D.GEAR) if (window.$dataItems && $dataItems[id]) { $gameParty.gainItem($dataItems[id], n); T.popup($dataItems[id].name + " ×" + n, { icon: $dataItems[id].iconIndex, kind: "good" }); }
            note(K().najpierw.tytul, K().najpierw.lord);
        } else if (how === "lie") {
            setFlag("w7Klamstwo");
            note(K().najpierw.tytul, K().najpierw.klamstwo);
        } else {
            setFlag("w7Milczenie");
            if (feliksHere()) { setFlag("w7FeliksDonosi"); notePair(TX.noteDonosi); }
            else note(K().najpierw.tytul, K().najpierw.milczenie);
        }
        autoChecks();
    }
    function weekTalk(spk) {
        const s = S(), f = flags();
        if (s.najpierw !== "lord" || lieOut() || day() - (s.weekPaid || 0) < 7) return null;
        if (f.galazDworskaZamknieta) return { ready: true, list: w.rozmowa("tydzienNie", { spk }) };
        return { ready: true, list: w.rozmowa("tydzien", { spk }) };
    }
    function hostileTalk(spk) {
        const s = S();
        if (!lieOut() || s.hostileSaid === day()) return null;
        return { ready: true, list: w.rozmowa("wrogi", { spk }) };
    }
    // the Lord remembers his men beaten in the ruins (W9's rival - the coordinator's small effect: words, no new mechanics)
    const w9Line = () => (flag("w9DworPobity") && !S().saidW9 ? TX.w9Lord : null);
    function withW9(h, spk) {
        const line = w9Line();
        if (!line) return h;
        const pre = w.rozmowa("w9", { spk });   // (the data's talk: the line and its mark - said once)
        if (h && h.ready) return { ready: true, list: pre.concat(h.list) };
        return { ready: true, list: pre };
    }
    // the Lord's talk at his door by W7's step (its hooks lordMowi / lordGotowy): the invitation (ch. 2), the truth (ch. 4-5), who first
    // (ch. 6), the lie found out / the truth / the weekly pay (ch. 7)
    const LORD_TALK = { w7Zapro: "zapro", w7Prawda: "prawda", w7Splata: "prawda", w7Najpierw: "najpierw", w7Serce: "tydzien" };
    function lordTalk(kind, key, spk) {
        if (key !== "lord" || !inHours(hour(), TM.lord)) return null;
        let h = null;
        if (kind === "prawda") h = truthTalk(spk);
        else if (kind === "najpierw") h = najpierwTalk(spk) || truthTalk(spk);   // (the Lord asks about the ruins first; the truth on the next talk)
        else if (kind === "tydzien") h = hostileTalk(spk) || truthTalk(spk) || weekTalk(spk);
        else if (kind === "zapro") h = zaproTalk(spk);
        return withW9(h, spk);
    }
    function zaproTalk(spk) {
        const s = S();
        if (s.tour === 0) {
            const St = ST(), ss = St && St.state ? St.state() : null;
            // (the field lost: first the Lord's own word on it - the buyback; and a "no" stands for the rest of the day)
            if ((ss && ss.lost && !ss.flags.lordLost) || s.zaproNo === day()) return null;
            return { ready: true, list: w.rozmowa("zaproszenie", { spk }) };   // (the data's talk: his words by the field and W1; in / later)
        }
        if (s.tour === 1) return { ready: false, list: w.rozmowa("lordCzeka", { spk }) };
        return null;
    }
    function updateWorld() {
        const s = S(), f = flags(), h = hour();
        syncObs();
        // the letters taken and Feliks still here: he notices the next morning - and is off on the first ferry after it
        if (s.letters === "take" && !s.truth && feliksHere() && s.lettersDay) {
            if (!s.flee) { const q = TQ(); let d = s.lettersDay + 1; while (q && q.isFerry && !q.isFerry(d) && d < s.lettersDay + 8) d++; s.flee = d; }
            if (day() > s.flee || (day() === s.flee && h >= 6)) {
                setFlag("w7FeliksUciekl"); s.fate = "fled";
                T.call("TownLife", "setGone", "feliks", true);
                w1Broke("fled");
                notePair(TX.noteFlee);
                T.popup(TX.noteFlee[0], { top: true, color: "#ffb4a0", sub: K().uciekl });
            }
        }
        // the lie found out: the tenth gate passed, or a week gone by
        if (s.najpierw === "lie" && !s.lieOut) {
            const U = UG(), deep = U && U.deepest ? U.deepest() : 0;
            if (deep >= 10 || day() >= s.najDay + 7) {
                s.lieOut = day(); s.search = day() + 1;
                setFlag("w7KlamstwoWyszlo");
                notePair(TX.lieOut);
                T.popup(TX.lieOutPopup, { top: true, color: "#ff9f8f", sub: TX.lieOutSub });
            }
        }
        // the search of the hut (the hero's own roof - or grandpa's house): they take the raven stones
        if (s.lieOut && s.search && !s.searched && day() >= s.search && h >= 8 && T.isCalm(SceneManager._scene, "strict")) {
            s.searched = day();
            const n = vcount("kamien_kruk");
            if (n > 0) vtake("kamien_kruk", n);
            notePair(TX.search, { what: n > 0 ? fill(TX.searchTook, { n }) : TX.searchNone });
            T.popup(TX.search[0], { top: true, color: "#ff9f8f", sub: n > 0 ? fill(TX.searchTook, { n }) : TX.searchNone });
        }
        // the dearer toll at the east gate (the Lord's men - Wit's post), once a day
        if (s.lieOut && onMap(M.town) && s.toll !== day() && Math.hypot($gamePlayer.x - P.town.gate[0], $gamePlayer.y - P.town.gate[1]) <= 3) {
            s.toll = day();
            const n = Math.min(D.PAY.toll, $gameParty.gold());
            const wit = residentEv("kapral");
            if (wit) say(wit, TX.toll, 180);
            if (n > 0) { $gameParty.loseGold(n); T.popup(fill(K().myto, { n }), { icon: COIN_ICON, kind: "bad" }); }
        }
        // Feliks the spy (the hero kept silent with Feliks still in the manor)
        if (f.w7FeliksDonosi && feliksHere() && s.donosi !== day()) {
            const fe = residentEv("feliks");
            if (fe && dist(fe, $gamePlayer) <= 4) { s.donosi = day(); say(fe, pick(TX.donosi), 200); }
        }
        // the manor's guard after the ruins (W9): cooler
        if (f.w9DworPobity && onMap(M.manor) && s.guardW9 !== day()) {
            const g = residentEv("straznik");
            if (g && dist(g, $gamePlayer) <= 3) { s.guardW9 = day(); say(g, TX.w9Guard, 200); }
        }
    }

    // ------------------------------------------------------------------
    // TownQuests' handlers (the steps of W7)
    // ------------------------------------------------------------------
    function w7Vars() {
        const s = S(), St = ST(), ss = St && St.state ? St.state() : null, f = flags();
        const V = K().kroki, n = Math.min(obsCount(), OBS.need), need = OBS.need;
        const dlug = !ss ? "-" : ss.lost ? fill(V.dlugPrzepadla, { ile: Math.min(ss.buy.paid, ss.buy.price), cena: ss.buy.price })
            : fill(V.dlugSplacono, { ile: Math.min(ss.paid, ss.debt), dlug: ss.debt });
        const zapro = s.tour === 1 ? V.zaproBiblioteka : V.zaproPrzedDworem;
        const gone0 = gone("feliks");
        const feliks = fill(gone0 ? V.feliksSlady : V.feliksDwaZycia, { n, need });
        const gabinet = V.gabinet + (tradeOn() ? V.gabinetFeliks : V.gabinetKoniec);
        const prawda = s.truth ? V.prawdaZna : hasProof() ? V.prawdaListy
            : s.letters === "left" ? (s.told ? V.prawdaSprawdza : V.prawdaKantorek)
            : V.prawda;
        const extra = !s.truth && hasProof() ? V.listyWTorbie : "";
        const splata = (ss && (ss.done || ss.paid >= ss.debt) ? V.splataDone : ss && ss.lost ? V.splataPrzepadla : fill(V.splataTermin, { dzien: ss ? ss.deadline : 60 })) + extra;
        const najpierw = (!actTwo() ? V.najpierwAkt2 : !beenDown() ? V.najpierwZejdz : V.najpierwPyta) + extra;
        const U = UG();
        let stance = "absent";
        try { stance = U && U.world && U.lordStance ? U.lordStance(U.world()) : "absent"; } catch (e) { stance = "absent"; }
        const serce = (TX.serce[stance] || TX.serce.absent) + (s.najpierw === "lord" && !lieOut() ? V.serceTydzien : "") + extra;
        return { dlug, zapro, feliks, gabinet, prawda, splata, najpierw, serce, butler: butler() };
    }
    // ------------------------------------------------------------------
    // W7 - the data's (Dwor_Data.js): what its conditions, words, talks, actions and F9 jumps ask of the game
    // ------------------------------------------------------------------
    w.haki({
        // the start (the story on, the Lord met or something paid) and the steps' conditions; the words of the journal's line
        fabula: () => storyOn(),
        dlugZaczety: () => { const ss = ST().state(); return !!(ss.flags.lordMet || ss.paid > 0 || ss.lost || ss.done); },
        polowaDlugu: () => { const St = ST(); try { return !!(St && St.halfWay && St.halfWay()); } catch (e) { return false; } },
        planGotowy: () => { syncObs(); return obsCount() >= OBS.need; },
        rozdzialKoniec: () => chapterEnded(),
        serceGotowe: () => { const U = UG(); try { const st = U && U.state ? U.state() : null; return !!(st && (st.lord || st.ending)); } catch (e) { return false; } },
        w7Zmienne: () => w7Vars(),
        // the Lord at his door (the steps' talk): which talk this step gives now, and whether he has something ready
        lordMowi: (ctx, qq, r, st, key, spk) => lordTalk(LORD_TALK[st && st.nazwa], key, spk),
        lordGotowy: (ctx, qq, r, st, key) => { try { const h = lordTalk(LORD_TALK[st && st.nazwa], key, LORD()); return !!(h && h.ready); } catch (e) { return false; } },
        // ch. 3 with Feliks gone: who still has a trace of him to tell
        sladGotowy: (ctx, qq, r, st, key) => !!sladyKey(key),
        sladRozmowa: (ctx, qq, r, st, key, spk) => { const k = sladyKey(key); return k ? { ready: true, list: w.rozmowa("slady", { spk, key, slad: k }) } : null; },
        // the talks' conditions: the field lost, the debt / the buyback still open, the garrison there, Feliks still at the manor
        dzialkaPrzepadla: () => { const St = ST(), ss = St && St.state ? St.state() : null; return !!(ss && ss.lost); },
        splataTrwa: () => { const St = ST(), ss = St && St.state ? St.state() : null; return !!(ss && !ss.lost && !ss.done && ss.paid < ss.debt); },
        odkupTrwa: () => { const St = ST(), ss = St && St.state ? St.state() : null; return !!(ss && ss.lost && ss.buy && !ss.buy.done); },
        garnizon: () => !!T.api("Garnizon"),
        feliksTutaj: () => feliksHere(),
        // the talks' actions
        prawda: (ctx, how) => truthDone(how),
        najpierw: (ctx, how) => najpierw(how),
        tydzien: () => { const s = S(); if (day() - (s.weekPaid || 0) >= 7) { s.weekPaid = day(); $gameParty.gainGold(D.PAY.week); T.popup(fill(K().odLorda, { n: D.PAY.week }), { icon: COIN_ICON, kind: "gold" }); } },
        slad: (ctx, k) => traced(k),
        szuflada: (ctx, how) => drawerChoice(how, ctx.interp, () => { const it = ctx.interp; if (it && it._list) it._index = it._list.length; }),
        drawerShow: () => { drawerShown = true; sync(); },
        drawerHide: () => { drawerShown = false; sync(); },
        // F9: what the chapters before the one jumped to need (ctx.skok: the chapter)
        skokPrzygotuj: ctx => jumpPrep(ctx.skok)
    });
    // W3's chronicle verse: with the manor open (W7) the Lord shows the chronicle in his library (chapter 2), not at the door - his
    // door's offer of it waits while W7 has not been through the tour yet (Feliks's / Teodor's copy for a jug of mead stays)
    (function hookW3() {
        const q = TQ(), vf = q && q.FX ? q.FX.w3Verse : null;
        if (!vf || typeof vf.source !== "function" || vf.source._w7) return;
        const orig = vf.source;
        vf.source = function(qq, r, key) {
            const v = orig.apply(this, arguments);
            if (v === "kronika" && key === "lord") { try { if (storyOn() && (S().tour || 0) < 2 && !isDoneW7()) return null; } catch (e) { /* (as before) */ } }
            return v;
        };
        vf.source._w7 = true;
    })();
    function isDoneW7() { const r = w7(); return !!r && r.s === "done"; }
    // a trace of Feliks (he is gone): who still has something to say (the talk: the data's "slady")
    function sladyKey(key) {
        const s = S(), map = { kamerdyner: "teodor", piekarka: "hanka", woziwoda: "kuba" };
        if (!gone("feliks") || !map[key] || s.traces[map[key]] || !at("w7Feliks")) return null;
        return map[key];
    }

    // ------------------------------------------------------------------
    // The events' script: Dwor.act(this) - by the event; Dwor.act(this, [what, ...]) - from a talk
    // ------------------------------------------------------------------
    function actCall(interp, args) {
        if (!has()) return;
        try {
            if (Array.isArray(args)) return actArgs(args, interp);
            if (!interp) return;
            const ev = $gameMap.event(interp.eventId());
            if (!ev || hidden(ev)) return;
            const k = keyOf(ev), s = S();
            const info = text => { T.popup(text, { kind: "info" }); return null; };
            const list = {
                kruk: () => info(TX.kamien),
                brak: () => info(s.letters ? TX.brakPo : TX.brak),
                schody: () => info(TX.schody),
                ksiegaGosci: () => info(gone("feliks") ? TX.ksiegaTeodor : TX.ksiega),
                gabinetDrzwi: () => info(fill(TX.gabZamkniety, { butler: butler() })),
                gabinetWyjscie: () => {
                    if (inHours(hour(), TM.lord)) { const L = P.gab.exitTo; return [C(250, [{ name: "Door1", volume: 80, pitch: 100, pan: 0 }]), C(201, [0, M.hol, L[0], L[1], L[2], 0])]; }
                    T.popup(TX.gabNoc, { kind: "info" });
                    const L = P.gab.land;
                    $gamePlayer.locate(L[0], L[1]); $gamePlayer.setDirection(8);
                    return null;
                },
                kronika: () => kronikaList(ev),
                szuflada: () => drawerList(),
                biurko: () => info(s.truth ? TX.biurkoPo : TX.biurko),
                mapa: () => info(TX.mapa),
                klapa: () => w.rozmowa("klapa", { spk: HERO }),   // (the data's talk: back down the trapdoor or not)
                lordHol: () => linesTo([], LORD_HOL, [s.tour === 1 ? TX.tourLordWaits : K().rozgosc]),
                lordBib: () => linesTo([], LORD_BIB, [K().kronikaNaPulpicie]),
                feliksNoc: () => null, kubaNoc: () => null, feliksGab: () => null, listy: () => null
            }[k];
            const out = list ? list() : null;
            if (out && out.length) interp.setupChild(out.concat([C(0, [])]), ev.eventId());
        } catch (e) { report("act", e); }
    }
    // the scenes' own calls (the tour, the chronicle, the catch); the talks' choices are the data's actions (Watki.act) - and an old
    // script call Dwor.act(this, ["tour"...]) of a talk saved before 2026-10-28 goes to the same action
    function actArgs(args, interp) {
        const [what, a] = args, s = S();
        if (what === "tourGone") { s.tourGone = 1; sync(); }
        else if (what === "kronika") kronikaRead();
        else if (what === "caught") caughtDone();
        else if (w.def.akcje[what]) w.akcja(what, a === undefined ? [] : [a], interp);
    }

    // ------------------------------------------------------------------
    // The frame: the tour starts in the hall, the watch of chapter 3, Feliks in the study, the world
    // ------------------------------------------------------------------
    T.onMapUpdate((scene, n) => {
        if (!has()) return;
        if (pendingOut && Graphics.frameCount >= pendingOut.at && !$gameMap.isEventRunning() && !$gamePlayer.isTransferring()) {
            const o = pendingOut;
            pendingOut = null;
            $gamePlayer.reserveTransfer(o.map, o.x, o.y, o.dir, 0);
        }
        if (!storyOn()) return;
        const s = S();
        try {
            if (onMap(M.hol) && s.tour === 1 && !s.tourHall && n > 20 && !$gameMap.isEventRunning() && T.isCalm(scene, "strict")) {
                s.tourHall = 1;
                $gameMap._interpreter.setup(tourList().concat([C(0, [])]), EV.lordHol);
            }
            if (onMap(M.gab) && !catchRun && feliksInStudy() && !$gameMap.isEventRunning() && n > 10) startCatch();
            updateWatch();
        } catch (e) { report("watch", e); }
        if (n % 30) return;
        try { sync(); updateWorld(); } catch (e) { report("world", e); }
    }, { owner: PLUGIN, name: "dwor" });
    T.on("mapReady", () => {
        if (!has()) return;
        catchRun = false; drawerShown = false; eyes = {};
        const s = S(), U = UG();
        try { if (!s.down && U && U.isUnderground && U.isUnderground($gameMap.mapId())) s.down = day(); } catch (e) { /* (no underground) */ }
        if (s.acc) s.acc.dzien = 0;
        sync();
    }, { owner: PLUGIN });
    // the Lord's scene at the Heart (Underground.js, W7 ch. 7) - the arc ends there
    T.on("undergroundLord", e => {
        if (!has() || !e) return;
        const s = S();
        s.serce = e.stance || "absent";
        notePair(TX.noteSerce, { how: TX.serceHow[e.choice] || TX.serceHow.none });
        const q = TQ();
        if (q && isActive("W7") && q.finish) q.finish("W7");
    }, { owner: PLUGIN });
    T.on("load", () => { pendingOut = null; catchRun = false; }, { owner: PLUGIN });
    T.on("newGame", () => { pendingOut = null; catchRun = false; }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // For the Heart's world (Underground.js) and the epilogue
    // ------------------------------------------------------------------
    function forWorld() {
        const s = S(), f = flags();
        return { truth: !!s.truth, how: s.how || null, fate: s.fate || null, first: s.najpierw || null, lie: !!s.lieOut, spy: !!f.w7FeliksDonosi, letters: s.letters || null };
    }
    function epilogue() {
        const s = S(), f = flags(), E = TX.epilog;
        if (s.lieOut) return E.lie;
        if (s.truth) return E.truth;
        if (f.w7FeliksUciekl) return E.fled;
        if (reached("w7Gabinet") && !s.truth) return E.silent;
        return null;
    }

    // ------------------------------------------------------------------
    // F9 ("Wyspa i fabuła"): straight to a chapter - the data's jumps (Dwor_Data skoki: the step, the hour, the place; the engine sets
    // the step); here the payments and the flags of the chapters before it (the hook skokPrzygotuj)
    // ------------------------------------------------------------------
    const JUMP = {};   // (the old shape for whoever reads it: { step, hour, go })
    for (const [i, j] of Object.entries(w.def.skoki.lista)) JUMP[i] = { step: j.krok, hour: j.godzina, go: j.idz };
    const debugJump = ch => w.skocz(ch);
    function jumpPrep(ch) {
        const St = ST(), s = S(), ss = St.state();
        ss.flags.lordMet = true;
        if (ch >= 2 && ss.paid < ss.debt / 2 && !ss.lost) { ss.paid = Math.ceil(ss.debt / 2); ss.payments.push({ day: day(), n: 0 }); }
        if (ch >= 3) { s.tour = 2; s.invited = s.invited || day(); setFlag("w7Kronika"); }
        if (ch >= 4) { for (const k of ["rano", "dzien", "kantor"]) s.obs[k] = s.obs[k] || day(); noteSet(TX.notePlanTitle, planText()); }
        if (ch >= 5 && !s.letters) { s.letters = "take"; s.lettersDay = day(); vgive("listy_feliksa", 1); }
        if (ch >= 6) {
            if (!s.truth) truthDone("letters");
            if (!chapterEnded()) { ss.paid = ss.debt; if (St.chapterDone) St.chapterDone(); }
            const U = UG();
            if (U && U.open) U.open();
            s.down = s.down || day();
        }
        if (ch >= 7 && !s.najpierw) najpierw("lord");
        if (ch === 4) { s.bolt = -1; s.letters = ""; vtake("listy_feliksa", 9); }
    }

    // ------------------------------------------------------------------
    // API
    // ------------------------------------------------------------------
    window.Dwor = T.register(PLUGIN, {
        DATA: D, state: () => S(), act: actCall, door, hatch, step: () => cur(), obsCount, planText, hasProof, truthReady, forWorld, epilogue,
        debugJump, JUMP, sync, canEnter, hatchOn, tradeOn, feliksInStudy, startCatch, beenDown,
        // tests: the vars of the journal's line, the catch running; the data's talks: "@key: " - a resident nearby
        vars: () => w7Vars(), catching: () => catchRun, speaker
    });
})();
