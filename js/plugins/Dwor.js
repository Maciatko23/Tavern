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

/*:
 * @target MZ
 * @plugindesc [W7] Wątek „Dwór z kamieni twierdzy” (wariant A): zaproszenie, hol z krukami, kronika rodu, dwa życia Feliksa, gabinet nocą, prawda dla Lorda, Akt II. v1.0.0
 * @author Claude
 * @base TawernaCore
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
    const M = D.MAP, EV = D.EV, P = D.PLACES, TM = D.TIME, TX = D.TX, ART = D.ART, OBS = D.OBS;
    const COIN_ICON = 314;
    const HERO = { id: 0, name: "" };
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
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
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const sneaking = () => !!T.call("Hunting", "sneaking");

    // ------------------------------------------------------------------
    // The state (the save)
    // ------------------------------------------------------------------
    const store = T.state.define("dwor", () => ({
        tour: 0, tourHall: 0, invited: 0,                              // ch. 2: 1 the Lord shows him round, 2 the chronicle read
        obs: {}, acc: { rano: 0, dzien: 0, noc: 0 }, spotted: {},       // ch. 3: what he saw of Feliks (day), the frames watched
        traces: {},                                                    // ch. 3 with Feliks gone: teodor, hanka, kuba, rejestr
        letters: "", lettersDay: 0, bolt: -1, caught: 0, garden: -1,   // ch. 4
        truth: 0, how: "", fate: "", told: 0, flee: 0,                 // the truth (day), how the Lord learnt it, Feliks's fate
        najpierw: "", najDay: 0, weekPaid: 0, lieOut: 0, search: 0, searched: 0, toll: -1, donosi: -1,   // ch. 6
        down: 0, saidW9: 0, guardW9: -1, serce: ""
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
    const opinion = (n, why) => { const q = TQ(); return q && q.addOpinion ? q.addOpinion(n, why) : 0; };
    const xp = (n, why) => T.call("Combat", "gainXp", n, why || "W7", true);
    const autoChecks = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const actTwo = () => { const q = TQ(); try { return !!(q && q.actTwo && q.actTwo()); } catch (e) { return false; } };
    const gone = key => !!T.call("TownLife", "gone", key);
    const storyOn = () => { const s = ST(); try { return !!(s && s.active && s.active()); } catch (e) { return false; } };
    const chapterEnded = () => { const s = ST(); try { return !!(s && s.chapterEnded && s.chapterEnded()); } catch (e) { return false; } };
    const butler = () => (gone("feliks") ? "Teodor" : "Feliks");
    const feliksHere = () => !gone("feliks") && !flag("feliksArrested");
    // Feliks still takes water to Kuba at night (W1: the sluice not half open, Kuba in town)
    const tradeOn = () => feliksHere() && !flag("sluiceHalf") && !gone("woziwoda");
    const hasProof = () => vcount("listy_feliksa") > 0 || vcount("odpis_listow") > 0;
    // the W7 record and its step's name
    const W7 = () => (TQ() && TQ().Q ? TQ().Q.W7 : null);
    const w7 = () => rec("W7");
    const stepIdx = name => D.STEPS.indexOf(name);
    function cur() { const r = w7(); return r && r.s === "active" ? D.STEPS[r.step] || "" : ""; }
    const at = name => cur() === name;
    const reached = name => { const r = w7(); return !!r && (r.s === "done" || (r.s === "active" && r.step >= stepIdx(name))); };
    function complete(opts) { const q = TQ(); if (q && q.completeStep && isActive("W7")) q.completeStep("W7", opts); }
    // journal notes: a new one, or the same title's text replaced (the plan of Feliks's day grows)
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const notePair = (p, vars) => note(p[0], fill(p[1], vars));
    function noteSet(title, text) {
        const J = T.api("Journal"), d = J && J.data ? J.data() : null, n = d && d.notes ? d.notes.find(x => x.title === title) : null;
        if (!n) return note(title, text);
        n.text = text; n.day = day();
        T.popup("Notatka uzupełniona: " + title, { color: "#eceef0" });
    }

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
    const act = (out, args, ind) => (out.push(C(355, ["Dwor.act(this, " + JSON.stringify(args) + ")"], ind)), out);
    const say = (ch, text, frames) => { const sb = SB(); if (sb && sb.say && ch) sb.say(ch, text, frames || 200); };
    const thoughts = [];
    let thoughtAt = 0;
    function think(lines) { for (const l of [].concat(lines || [])) if (l) thoughts.push(String(l).replace(/^> /, "")); }
    function updateThoughts() {
        if (!thoughts.length || Graphics.frameCount < thoughtAt || !(SceneManager._scene instanceof Scene_Map) || $gameMap.isEventRunning()) return;
        const t = thoughts.shift(), sb = SB();
        if (sb && sb.say) sb.say($gamePlayer, t, 210); else T.popup(t, { color: "#eceef0" });
        thoughtAt = Graphics.frameCount + 220;
    }
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
        if (mapId === M.hol) { const p = spot("lord_hol", P.hol.lord); out.push(eventData(EV.lordHol, "Lord Leopold Zaleski", p[0], p[1], { key: "lordHol", img: ART.lord, dir: P.hol.lord[2], bustName: "Lord Zaleski" })); }
        else if (mapId === M.bib) { const p = spot("lord_kronika", P.bib.lord); out.push(eventData(EV.lordBib, "Lord Leopold Zaleski", p[0], p[1], { key: "lordBib", img: ART.lord, dir: P.bib.lord[2], bustName: "Lord Zaleski" })); }
        else if (mapId === M.gab) {
            const f = spot("feliks_klapa", P.gab.feliks), l = spot("listy", [P.gab.listy[0], P.gab.listy[1], 8]);
            out.push(eventData(EV.feliksGab, "Feliks", f[0], f[1], { key: "feliksGab", img: ART.feliks, dir: 8, bustName: "Feliks" }));
            out.push(eventData(EV.listy, "Listy Feliksa", l[0], l[1], { key: "listy", img: ART.listy, fix: true, walk: false, priority: 0, through: true }));
        } else if (mapId === M.manor) {
            const pf = P.manor.feliksNoc, pk = P.manor.kubaNoc;
            // (Feliks keeps a small lantern by the hatch - every light a flame; its light only when the map comes up in his hours)
            const lit = has() && hatchNight() && !w1Hatch() ? LANTERN : "";
            out.push(eventData(EV.feliksNoc, "Feliks", pf[0], pf[1], { key: "feliksNoc", img: ART.feliks, dir: pf[2], bustName: "Feliks", note: lit }));
            out.push(eventData(EV.kubaNoc, "Kuba Woziwoda", pk[0], pk[1], { key: "kubaNoc", img: ART.kuba, dir: pk[2], bustName: "Kuba Woziwoda" }));
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
    const w1Hatch = () => { const q = TQ(); try { const w = q && q.spotWanted ? q.spotWanted("w1_feliks") : null; return !!(w && w.ready); } catch (e) { return false; } };
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
    const _Game_Event_list = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        if (this._mapId === M.manor && has()) {
            try {
                if (isDoor(this) && canEnter()) return DOOR_STUB;
                if (hatchOn() && isHatch(this)) return HATCH_STUB;
            } catch (e) { report("list", e); }
        }
        return _Game_Event_list.call(this);
    };
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
        const s = S(), ev = $gameMap.event(interp.eventId());
        if (!inHours(hour(), TM.night)) { T.popup(TX.wlazDzien, { kind: "info" }); return; }
        if (hatchNight()) { T.popup(TX.wlazFeliks, { kind: "info" }); return; }
        if (s.bolt >= nightOf() && feliksHere()) { T.popup(TX.wlazRygiel, { kind: "info" }); return; }
        const L = P.gab.trapLand, out = [];
        const yes = [C(250, [{ name: "Open1", volume: 70, pitch: 80, pan: 0 }])];
        linesTo(yes, HERO, TX.kanalGora);
        yes.push(C(221, []), C(201, [0, M.gab, L[0], L[1], L[2], 0]), C(222, []));
        choiceTo(out, [TX.wlazTak, TX.wlazNie], [yes, []], 1);
        out.unshift(C(101, ["", 0, 0, 2, ""]), C(401, ["\\SPK[0]" + TX.wlazZejdz]));
        interp.setupChild(out.concat([C(0, [])]), ev ? ev.eventId() : 0);
    }

    // ------------------------------------------------------------------
    // Chapter 2: the tour (the hall on arrival, the chronicle in the library)
    // ------------------------------------------------------------------
    const LORD_HOL = { id: EV.lordHol, name: "Lord Zaleski" }, LORD_BIB = { id: EV.lordBib, name: "Lord Zaleski" };
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
        xp(60, "kronika rodu");
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
        xp(30, "plan dnia Feliksa");
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
        const got = opinion(-3, "nocą w ogrodzie dworu");
        T.popup(why || "Złapali cię w ogrodzie dworu", { top: true, color: "#ff9f8f", sub: TX.caughtNoc + (got ? "  ·  Opinia " + got : "") });
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
                eyes.feliks = {}; s.garden = nightOf(); say(f, TX.feliksNocKto, 160); throwOut("Feliks cię zauważył"); return;
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
        return [TM.down[0] + 24, TM.up[0] + 24].some(w => t0 < w + 0.15 && t1 > w);
    }
    const GAB = { id: EV.feliksGab, name: "Feliks" };
    function drawerList() {
        const s = S(), out = [], O = TX.szuflada;
        if (s.truth) { T.popup("Szuflada pusta - listy są u jaśnie pana.", { kind: "info" }); return null; }
        if (s.letters === "take") return linesTo(out, HERO, [O.done]);
        if (s.letters === "copy") return linesTo(out, HERO, [O.doneCopy]);
        linesTo(out, HERO, O.open.concat([s.obs.dzien ? O.key : O.keyGuess, O.bundle]));
        act(out, ["drawerShow"]);
        const last = !feliksHere() ? O.lastGone : flag("feliksPays") && !flag("feliksBroke") ? O.lastPays : O.lastHere;   // (W1 6 c: he pays the hero)
        linesTo(out, HERO, O.letters.concat([last, O.hand]));
        linesTo(out, HERO, ["> " + O.ask]);
        choiceTo(out, [O.take, O.copy, O.leave], [act([], ["szuflada", "take"]), act([], ["szuflada", "copy"]), act([], ["szuflada", "leave"])], 2);
        act(out, ["drawerHide"]);
        return out;
    }
    function drawerChoice(how, interp, stop) {
        const s = S(), O = TX.szuflada, idxPrawda = stepIdx("w7Prawda");
        const first = !s.letters;
        if (how === "copy" && overlapsFeliks(clock(), TM.copy)) {
            // (the copy runs into Feliks coming through the trapdoor: caught with the pen in hand)
            const w = [TM.down[0], TM.up[0]].find(x => { const c = clock(), wx = x + 24; return c < wx + 0.15 && c + TM.copy > wx; });
            if (w !== undefined) $gameSystem.setDayNightHour(w + 0.02);
            drawerShown = false;
            stop();   // (the frame's runner starts the catch once this talk is over: Feliks is in the study now)
            return;
        }
        if (how === "take") { vgive("listy_feliksa", 1); s.letters = "take"; s.lettersDay = day(); linesQueue(O.tookSay); setFlag("w7ListyZabrane"); }
        else if (how === "copy") { advance(TM.copy); vgive("odpis_listow", 1); s.letters = "copy"; s.lettersDay = day(); linesQueue(O.copySay); setFlag("w7ListyPrzepisane"); }
        else { if (s.letters !== "left") { s.letters = "left"; s.lettersDay = day(); } linesQueue(O.leaveSay); setFlag("w7ListyZostawione"); }
        if (first || !T.api("Journal") || !(T.api("Journal").data().notes || []).some(n => n.title === TX.noteListy[0])) notePair(TX.noteListy);
        if (at("w7Gabinet")) complete({ to: idxPrawda, reward: { xp: 120 } });
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
    const LORD = () => { const St = ST(); return { id: St && St.NPCS ? St.NPCS.lord.id : 902, name: "Lord Zaleski" }; };
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
    function truthScene(out, spk, how) {
        const s = S();
        if (how === "copy") linesTo(out, spk, TX.copyCheck);
        if (how === "check") linesTo(out, spk, TX.sprawdzil);
        linesTo(out, spk, TX.prawda);
        if (flag("feliksPays")) linesTo(out, spk, [TX.prawdaPays]);   // (W1 6 c: the letters tell of the hush money)
        const fate = fateNow();
        linesTo(out, spk, [TX.fate[fate]]);
        const St = ST(), ss = St && St.state ? St.state() : null;
        if (ss && !ss.lost && !ss.done && ss.paid < ss.debt) linesTo(out, spk, [TX.reward.debt]);
        else if (ss && ss.lost && ss.buy && !ss.buy.done) linesTo(out, spk, [TX.reward.buyback]);
        else linesTo(out, spk, [TX.reward.other]);
        if (T.api("Garnizon")) linesTo(out, spk, [TX.prawdaGaraz]);
        if (flag("galazDworskaZamknieta")) linesTo(out, spk, [TX.prawdaGalaz]);
        linesTo(out, spk, [TX.prawdaKoniec]);
        return act(out, ["prawda", how]);
    }
    function truthTalk(spk) {
        const s = S(), out = [];
        if (!truthReady()) return null;
        if (hasProof()) {
            linesTo(out, HERO, TX.prawdaAsk);
            const how = vcount("listy_feliksa") > 0 ? "letters" : "copy";
            const yes = truthScene([], spk, how);
            return { ready: true, list: choiceTo(out, [TX.prawdaOpt, TX.prawdaLater], [yes, linesTo([], spk, TX.prawdaLaterSay)], 1) };
        }
        if (s.letters === "left" && !s.told) {
            return { ready: true, list: choiceTo(out, [TX.powiedzOpt, TX.prawdaLater], [act(linesTo([], spk, TX.powiedzSay), ["powiedz"]), []], 1) };
        }
        if (s.letters === "left" && s.told && day() > s.told) return { ready: true, list: truthScene(out, spk, "check") };
        if (s.letters === "left" && s.told) return { ready: false, list: linesTo(out, spk, TX.powiedzWait) };
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
            T.popup("Lord odpisuje z długu", { top: true, color: "#ffe27a", sub: paid + " G mniej do spłaty" });
        } else if (ss && ss.lost && ss.buy && !ss.buy.done) {
            ss.buy.price = Math.max(ss.buy.paid, ss.buy.price - D.PAY.truthBuyback);
            T.popup("Odkup pola tańszy", { top: true, color: "#ffe27a", sub: "Lord odsprzeda pole za " + ss.buy.price + " G" });
            if (ss.buy.paid >= ss.buy.price && St.fieldReturned) St.fieldReturned();
        } else {
            $gameParty.gainGold(D.PAY.truthElse);
            T.popup("+" + D.PAY.truthElse + " G od Lorda", { icon: COIN_ICON, kind: "gold" });
        }
        const G = T.api("Garnizon");
        try { if (G && G.addFavor) G.addFavor(10, "listy Feliksa"); } catch (e) { report("garrison", e); }
        if (fate === "arrest") w1Broke("arrest");
        notePair(TX.noteTruth, { fate: TX.fateNote[fate] || "" });
        xp(200, "prawda dla Lorda");
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
    function najpierwTalk(spk) {
        const s = S(), out = [];
        if (s.najpierw || !actTwo() || !beenDown()) return null;
        const f = flags(), tone = f.lordAlly || f.w7Prawda ? "ally" : f.w1Revealed || f.lordCold ? "cold" : "normal";
        linesTo(out, spk, TX.najpierwAsk[tone]);
        const br = [
            act(linesTo([], spk, TX.sayLord), ["najpierw", "lord"]),
            act(linesTo([], spk, TX.sayLie), ["najpierw", "lie"]),
            act(linesTo([], spk, TX.saySilent.concat(feliksHere() ? [TX.saySilentFeliks] : [])), ["najpierw", "silent"])
        ];
        return { ready: true, list: choiceTo(out, [TX.optLord, TX.optLie, TX.optSilent], br, -1) };
    }
    function najpierw(how) {
        const s = S();
        if (s.najpierw) return;
        s.najpierw = how; s.najDay = day();
        if (how === "lord") {
            setFlag("w7LordFirst");
            s.weekPaid = day();
            $gameParty.gainGold(D.PAY.week);
            T.popup("+" + D.PAY.week + " G od Lorda", { icon: COIN_ICON, kind: "gold" });
            for (const [id, n] of D.GEAR) if (window.$dataItems && $dataItems[id]) { $gameParty.gainItem($dataItems[id], n); T.popup($dataItems[id].name + " ×" + n, { icon: $dataItems[id].iconIndex, kind: "good" }); }
            note("Do kogo najpierw", "Powiedziałem Lordowi, że będę mu mówił o wszystkim, co znajdę pod tawerną. Płaci sto groszy na tydzień i dał mi ekwipunek ze zbrojowni. Jego ludzie pójdą za mną w dół - „pilnować, żebym wrócił, i żeby nikt inny nie był pierwszy”.");
        } else if (how === "lie") {
            setFlag("w7Klamstwo");
            note("Do kogo najpierw", "Skłamałem Lordowi: „Nic tam nie ma, kurz i szczury.” Uwierzył. Na razie.");
        } else {
            setFlag("w7Milczenie");
            if (feliksHere()) { setFlag("w7FeliksDonosi"); notePair(TX.noteDonosi); }
            else note("Do kogo najpierw", "Nie powiedziałem Lordowi, co jest pod tawerną. „Szanuję milczenie. Ale pamiętam je.”");
        }
        autoChecks();
    }
    function weekTalk(spk) {
        const s = S(), f = flags();
        if (s.najpierw !== "lord" || lieOut() || day() - (s.weekPaid || 0) < 7) return null;
        if (f.galazDworskaZamknieta) return { ready: true, list: act(linesTo([], spk, TX.tydzienNie), ["weekNie"]) };
        return { ready: true, list: act(linesTo([], spk, TX.tydzien), ["tydzien"]) };
    }
    function hostileTalk(spk) {
        const s = S();
        if (!lieOut() || s.hostileSaid === day()) return null;
        return { ready: true, list: act(linesTo([], spk, TX.lordHostile), ["hostileSaid"]) };
    }
    // the Lord remembers his men beaten in the ruins (W9's rival - the coordinator's small effect: words, no new mechanics)
    const w9Line = () => (flag("w9DworPobity") && !S().saidW9 ? TX.w9Lord : null);
    function withW9(h, spk) {
        const line = w9Line();
        if (!line) return h;
        const pre = act(linesTo([], spk, [line]), ["w9Said"]);
        if (h && h.ready) return { ready: true, list: pre.concat(h.list) };
        return { ready: true, list: pre };
    }
    function lordTalk(name, key, spk) {
        if (key !== "lord" || !inHours(hour(), TM.lord)) return null;
        let h = null;
        if (name === "w7Prawda") h = truthTalk(spk);
        else if (name === "w7Najpierw") h = najpierwTalk(spk) || truthTalk(spk);   // (the Lord asks about the ruins first; the truth on the next talk)
        else if (name === "w7Tydzien") h = hostileTalk(spk) || truthTalk(spk) || weekTalk(spk);
        else if (name === "w7Zapro") h = zaproTalk(spk);
        return withW9(h, spk);
    }
    function zaproTalk(spk) {
        const s = S();
        if (s.tour === 0) {
            const St = ST(), ss = St && St.state ? St.state() : null;
            // (the field lost: first the Lord's own word on it - the buyback; and a "no" stands for the rest of the day)
            if ((ss && ss.lost && !ss.flags.lordLost) || s.zaproNo === day()) return null;
            const f = flags(), ask = ss && ss.lost ? TX.zaproAskBuy : f.lordAlly ? TX.zaproAskAlly : f.w1Revealed || f.lordCold ? TX.zaproAskCold : TX.zaproAsk;
            const out = linesTo([], spk, ask);
            const L = P.hol.land;
            const yes = act([], ["tour"]).concat([C(250, [{ name: "Door1", volume: 80, pitch: 100, pan: 0 }]), C(201, [0, M.hol, L[0], L[1], L[2], 0])]);
            return { ready: true, list: choiceTo(out, [TX.zaproTak, TX.zaproNie], [yes, act(linesTo([], spk, TX.zaproLater), ["zaproNo"])], 1) };
        }
        if (s.tour === 1) return { ready: false, list: linesTo([], spk, [TX.tourLordWaits]) };
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
                T.popup(TX.noteFlee[0], { top: true, color: "#ffb4a0", sub: "Uciekł promem na ląd" });
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
            const w = residentEv("kapral");
            if (w) say(w, TX.toll, 180);
            if (n > 0) { $gameParty.loseGold(n); T.popup("Myto dworu: -" + n + " G", { icon: COIN_ICON, kind: "bad" }); }
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
        const dlug = !ss ? "-" : ss.lost ? "pole przepadło - odkup: " + Math.min(ss.buy.paid, ss.buy.price) + " / " + ss.buy.price + " G (połowa otworzy drzwi dworu)"
            : "spłacono " + Math.min(ss.paid, ss.debt) + " z " + ss.debt + " G. Kiedy oddasz połowę, Lord zaprosi cię do dworu.";
        const zapro = s.tour === 1 ? "Lord czeka w bibliotece dworu (hol, drzwi na lewo) - kronika rodu leży na pulpicie."
            : "Lord przed dworem (8–20) chce cię zaprosić do środka - porozmawiaj z nim.";
        const gone0 = gone("feliks");
        const feliks = gone0 ? "Ślady Feliksa: Feliksa nie ma już w dworze. Popytaj o niego Teodora (rynek rano, hol za dnia), Hankę przy straganie i Kubę przy studni - i zajrzyj do rejestru Baltazara. Ślady i obserwacje: " + Math.min(obsCount(), OBS.need) + "/" + OBS.need + "."
            : "Dwa życia Feliksa: śledź go przez dobę - z ukrycia (C). Rano na rynku (6–10:30), za dnia w holu dworu (10:30–20), nocą przy włazie za oranżerią (ok. 2:00), w noc tygodnia przy tylnych drzwiach kantoru (północ). Widziane: " + Math.min(obsCount(), OBS.need) + "/" + OBS.need + ".";
        const gabinet = "nocą (22–5) właz z krukiem za oranżerią (ogród dworu, pod sosną) prowadzi starym kanałem zakonu pod gabinet. W gabinecie - kantorek Feliksa. Uważaj na strażnika w ogrodzie" +
            (tradeOn() ? " i na Feliksa: o 1:30 schodzi przez gabinet do kanału, o 3:00 wraca." : ".");
        const prawda = s.truth ? "Lord zna prawdę." : hasProof() ? "Prawda dla Lorda: pokaż mu listy Feliksa (przed dworem, 8–20)."
            : s.letters === "left" ? (s.told ? "Lord sprawdza kantorek sam - przyjdź do niego następnego dnia (8–20)." : "Prawda dla Lorda: listy zostały w kantorku. Możesz powiedzieć o nich Lordowi (przed dworem, 8–20) - albo milczeć.")
            : "Prawda dla Lorda.";
        const extra = !s.truth && hasProof() ? " Listy Feliksa wciąż masz w torbie - Lord czeka na prawdę." : "";
        const splata = (ss && (ss.done || ss.paid >= ss.debt) ? "dług spłacony." : ss && ss.lost ? "pole przepadło - rozdział 1 i tak się skończył." : "Lord przyjmuje spłatę przed dworem (8–20), nocą kamerdyner. Termin: dzień " + (ss ? ss.deadline : 60) + ".") + extra;
        const najpierw = (!actTwo() ? "w Akcie II (po spłacie długu albo stracie pola)." : !beenDown() ? "kiedy zejdziesz pod tawernę (krata w piwnicy), Lord zapyta, co tam jest." : "Lord pyta przed dworem (8–20), co jest pod Kruczymi Skałami.") + extra;
        const U = UG();
        let stance = "absent";
        try { stance = U && U.world && U.lordStance ? U.lordStance(U.world()) : "absent"; } catch (e) { stance = "absent"; }
        const serce = (TX.serce[stance] || TX.serce.absent) + (s.najpierw === "lord" && !lieOut() ? " Sto groszy na tydzień - u Lorda przed dworem." : "") + extra;
        return { dlug, zapro, feliks, gabinet, prawda, splata, najpierw, serce, butler: butler() };
    }
    function hookQuests() {
        const q = TQ();
        if (!q || !q.FX || hookQuests.done) return;
        hookQuests.done = true;
        const talkFx = name => ({
            ready: (qq, r, st, key) => { try { const h = lordTalk(name, key, LORD()); return !!(h && h.ready); } catch (e) { return false; } },
            talk: (qq, r, st, key, spk) => lordTalk(name, key, spk)
        });
        Object.assign(q.FX, {
            w7Auto: () => storyOn() && (() => { const ss = ST().state(); return !!(ss.flags.lordMet || ss.paid > 0 || ss.lost || ss.done); })(),
            w7Vars: { vars: () => w7Vars() },
            w7Dlug: { check: () => { const St = ST(); try { return !!(St && St.halfWay && St.halfWay()); } catch (e) { return false; } } },
            w7Zapro: talkFx("w7Zapro"),
            w7Kronika: { check: () => S().tour >= 2 },
            w7Feliks: { check: () => { syncObs(); return obsCount() >= OBS.need; } },
            w7Slady: {
                ready: (qq, r, st, key) => !!sladyKey(key),
                talk(qq, r, st, key, spk) {
                    const k = sladyKey(key);
                    if (!k) return null;
                    return { ready: true, list: act(linesTo([], spk, TX.slady[key]), ["slad", k]) };
                }
            },
            w7Prawda: talkFx("w7Prawda"),
            w7PoPrawdzie: { check: () => !!S().truth || chapterEnded() },
            w7Splata: { check: () => chapterEnded() },
            w7Najpierw: talkFx("w7Najpierw"),
            w7Wybor: { check: () => !!S().najpierw },
            w7Tydzien: talkFx("w7Tydzien"),
            w7Serce: { check: () => { const U = UG(); try { const st = U && U.state ? U.state() : null; return !!(st && (st.lord || st.ending)); } catch (e) { return false; } } }
        });
    }
    // W3's chronicle verse: with the manor open (W7) the Lord shows the chronicle in his library (chapter 2), not at the door - his
    // door's offer of it waits while W7 has not been through the tour yet (Feliks's / Teodor's copy for a jug of mead stays)
    (function hookW3() {
        const q = TQ(), w = q && q.FX ? q.FX.w3Verse : null;
        if (!w || typeof w.source !== "function" || w.source._w7) return;
        const orig = w.source;
        w.source = function(qq, r, key) {
            const v = orig.apply(this, arguments);
            if (v === "kronika" && key === "lord") { try { if (storyOn() && (S().tour || 0) < 2 && !isDoneW7()) return null; } catch (e) { /* (as before) */ } }
            return v;
        };
        w.source._w7 = true;
    })();
    function isDoneW7() { const r = w7(); return !!r && r.s === "done"; }
    // a trace of Feliks (he is gone): who still has something to say
    function sladyKey(key) {
        const s = S(), map = { kamerdyner: "teodor", piekarka: "hanka", woziwoda: "kuba" };
        if (!gone("feliks") || !map[key] || s.traces[map[key]] || !at("w7Feliks")) return null;
        return map[key];
    }
    hookQuests();

    // ------------------------------------------------------------------
    // The events' script: Dwor.act(this) - by the event; Dwor.act(this, [what, ...]) - from a talk
    // ------------------------------------------------------------------
    function actCall(interp, args) {
        if (!has()) return;
        const stop = () => { if (interp && interp._list) interp._index = interp._list.length; };
        try {
            if (Array.isArray(args)) return actArgs(args, interp, stop);
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
                klapa: () => {
                    const L = P.manor.hatchLand, out = [], yes = [C(250, [{ name: "Open1", volume: 70, pitch: 80, pan: 0 }])];
                    linesTo(yes, HERO, TX.kanalDol);
                    yes.push(C(221, []), C(201, [0, M.manor, L[0], L[1], L[2], 0]), C(222, []));
                    out.push(C(101, ["", 0, 0, 2, ""]), C(401, ["\\SPK[0]" + TX.klapaZejdz]));
                    return choiceTo(out, [TX.klapaTak, TX.klapaNie], [yes, []], 1);
                },
                lordHol: () => linesTo([], LORD_HOL, [s.tour === 1 ? TX.tourLordWaits : "Rozgość się."]),
                lordBib: () => linesTo([], LORD_BIB, [TX.tourLordWaits.replace("Jaśnie pan czeka w bibliotece - drzwi na lewo.", "Kronika leży na pulpicie. Czytaj śmiało.")]),
                feliksNoc: () => null, kubaNoc: () => null, feliksGab: () => null, listy: () => null
            }[k];
            const out = list ? list() : null;
            if (out && out.length) interp.setupChild(out.concat([C(0, [])]), ev.eventId());
        } catch (e) { report("act", e); }
    }
    function actArgs(args, interp, stop) {
        const [what, a] = args, s = S();
        if (what === "tour") { if (!s.tour) { s.tour = 1; s.tourHall = 0; s.tourGone = 0; } }
        else if (what === "tourGone") { s.tourGone = 1; sync(); }
        else if (what === "kronika") kronikaRead();
        else if (what === "drawerShow") { drawerShown = true; sync(); }
        else if (what === "drawerHide") { drawerShown = false; sync(); }
        else if (what === "szuflada") drawerChoice(a, interp, stop);
        else if (what === "caught") caughtDone();
        else if (what === "slad") traced(a);
        else if (what === "powiedz") { if (!s.told) { s.told = day(); setFlag("w7LordWie"); } }
        else if (what === "prawda") truthDone(a);
        else if (what === "najpierw") najpierw(a);
        else if (what === "tydzien") { if (day() - (s.weekPaid || 0) >= 7) { s.weekPaid = day(); $gameParty.gainGold(D.PAY.week); T.popup("+" + D.PAY.week + " G od Lorda", { icon: COIN_ICON, kind: "gold" }); } }
        else if (what === "hostileSaid") s.hostileSaid = day();
        else if (what === "weekNie") s.weekPaid = day();
        else if (what === "zaproNo") s.zaproNo = day();
        else if (what === "w9Said") s.saidW9 = day();
    }

    // ------------------------------------------------------------------
    // The frame: the tour starts in the hall, the watch of chapter 3, Feliks in the study, the world
    // ------------------------------------------------------------------
    T.onMapUpdate((scene, n) => {
        if (!has()) return;
        updateThoughts();
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
    T.on("load", () => { thoughts.length = 0; thoughtAt = 0; pendingOut = null; catchRun = false; }, { owner: PLUGIN });
    T.on("newGame", () => { thoughts.length = 0; thoughtAt = 0; pendingOut = null; catchRun = false; }, { owner: PLUGIN });

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
    // F9 ("Wyspa i fabuła"): straight to a chapter - the payments, the flags, the hour, the place
    // ------------------------------------------------------------------
    const JUMP = {
        1: { step: "w7Dlug", hour: 10, go: [M.manor].concat(P.manor.f9) },
        2: { step: "w7Zapro", hour: 10, go: [M.manor].concat(P.manor.f9) },
        3: { step: "w7Feliks", hour: 6.5, go: [M.town].concat(P.town.f9) },
        4: { step: "w7Gabinet", hour: 22.5, go: [M.manor, 3, 22, 8] },
        5: { step: "w7Prawda", hour: 10, go: [M.manor].concat(P.manor.f9) },
        6: { step: "w7Najpierw", hour: 10, go: [M.manor].concat(P.manor.f9) },
        7: { step: "w7Serce", hour: 10, go: [M.manor].concat(P.manor.f9) }
    };
    function debugJump(ch) {
        const j = JUMP[ch], q = TQ(), St = ST();
        if (!j || !q || !has() || !storyOn()) return null;
        const s = S(), ss = St.state();
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
        const r = q.rec("W7");
        if (!r || r.s !== "active") q.start("W7", stepIdx(j.step));
        else { r.step = stepIdx(j.step); r.sday = day(); }
        $gameSystem.setDayNightHour(j.hour);
        if (q.refreshMarkers) q.refreshMarkers();
        return j.go;
    }

    // ------------------------------------------------------------------
    // API
    // ------------------------------------------------------------------
    window.Dwor = T.register(PLUGIN, {
        DATA: D, state: () => S(), act: actCall, door, hatch, step: () => cur(), obsCount, planText, hasProof, truthReady, forWorld, epilogue,
        debugJump, JUMP, sync, canEnter, hatchOn, tradeOn, feliksInStudy, startCatch, beenDown,
        // tests: the vars of the journal's line, the catch running
        vars: () => w7Vars(), catching: () => catchRun
    });
})();
