//=============================================================================
// Jarmark.js
//=============================================================================
// The thread W17 "Jarmark Kruczogrodu" (docs/zadania_nowe/jarmark.md, 2026-11-12) - the ENGINE (core part); the data: Jarmark_Data.js, the
// words: js/teksty/jarmark.txt, the scenes and the chase over the roofs: Jarmark_Sceny.js. What the data cannot do:
//   - the injected events of Map008 / Map001 (Tawerna.inject "Jarmark", ids 4800-4999): the stall places and the stalls, the lamp posts,
//     the barrels, the stage with its torches, the cushion with the Silver Raven, the troupe and the merchant, the crowd, the clues, the
//     hall's judges - drawn from ONE function (spec) by the state, the day and the hour (no scan of the map's events)
//   - the three works (stalls, barrels, lanterns), the beer contest (four judges, four additions), the dice tournament (three matches
//     of TavernDice; Wanda's loaded die), the troupe's helpers, the five clues of the investigation, the endings (A-D, F) and the rewards
//   - the clock (day / hour): the fair opens at 14:30 of day 49 by itself when the hero is away, the contest, the tournament and the play
//     are missed without a loss of the thread (the walk-over, the alarm bell), the ambush of day 52 23:30, the closing of day 53 at 12:00
// API: window.Jarmark (Tawerna.api("Jarmark")): stan(), S(), actor(key), fair(), ... (the tests: Jarmark.wymus, Jarmark.debugGo(n)).
// Not built (said in the report): the selling at the stalls (+30%), the rain water for Borgar's beer, the cart of the barrels (Wojciech),
// the night sabotage of the vat, the dog's sniffing of the coat, the stall's privilege, the new fanfare.

/*:
 * @target MZ
 * @plugindesc [W17] Wątek „Jarmark Kruczogrodu” - silnik: kramy, beczki, lampiony, konkurs piwny, turniej w kości, pomoc trupie, poszlaki, zakończenia. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Jarmark_Data
 * @base TownLife
 * @orderAfter Dezerter
 *
 * @help
 * ============================================================================
 * Jarmark.js - wątek W17 „Jarmark Kruczogrodu”
 * ============================================================================
 * Zlecenie u sołtysa (ratusz, dzień 47+), prace (kramy, beczki, lampiony),
 * otwarcie jarmarku (49), konkurs piwny (49, 19-21), turniej w kości (50-51),
 * sztuka trupy (51, 19:00), śledztwo (51-52), pościg po dachach (52, 23:30).
 * F9 → „Wyspa i fabuła” → „Wątek W17”: skoki do rozdziałów, poszlaki, finały.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.JarmarkData;
    if (!T || !window.Watki || !D) throw new Error("Jarmark.js: brak TawernaCore.js / Watki.js / Jarmark_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Jarmark";
    const w = D.watek, TX = D.TX, fill = Watki.wstaw, C = Watki.mowa.C;
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap && !!window.$gameParty && !!window.$gamePlayer;
    const TL = () => T.api("TownLife");
    const TQ = () => T.api("TownQuests");
    const SB = () => T.api("SpeechBubbles");
    const tx = k => w.tekst(k);
    const tx1 = k => { const v = w.tekst(k); return Array.isArray(v) ? v[0] : v; };
    const report = (where, e) => console.error("[Jarmark] " + where + ":", e);
    const COIN = 314;
    const popup = (text, o) => T.popup(text, o || {});
    const inHours = (h, a) => h >= a[0] && h < a[1];
    const api = { opts: null };
    const mapNow = () => ($gameMap ? $gameMap.mapId() : 0);
    const odswiez = () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const sprawdz = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); odswiez(); };
    const note = key => { const p = w.pair(key); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const opinia = n => T.call("TownQuests", "addOpinion", n, tx("zadania.W17.title"));
    const xp = n => T.call("Combat", "gainXp", n, tx("zadania.W17.title"), true);
    const opiniaNow = () => { try { return TQ().state().opinion || 0; } catch (e) { return 0; } };
    function zlato(n) {
        if (!n || !has()) return;
        if (n > 0) { $gameParty.gainGold(n); popup(fill(tx("napis.zloto"), { n }), { icon: COIN, kind: "gold" }); }
        else { $gameParty.loseGold(-n); popup(fill(tx("napis.koszt"), { n: -n }), { icon: COIN, kind: "info" }); }
    }

    // ==================================================================
    // 1. State and the days
    // ==================================================================
    const zamkniety = () => has() && S().zamkniecie === 1;
    const targOn = () => has() && day() >= D.DNI.otwarcie && !zamkniety() && day() <= D.DNI.rozstrzygniecie;
    const przed = () => has() && S().z === 1 && day() >= D.DNI.zgloszenie && day() < D.DNI.otwarcie + (hour() < 10 ? 0 : 0) + 1 && !zamkniety();   // (the works: days 47-49)
    const jarmark = () => has() && day() >= D.DNI.zgloszenie && day() <= D.DNI.rozstrzygniecie && !zamkniety();
    function warunki() {
        try {
            const q = TQ(), p = T.api("Podroznicy") || window.Podroznicy || null;
            const w1 = q && q.rec ? q.rec("W1") : null;
            const w1ok = !!w1 && (w1.s === "done" || w1.step >= 3);
            return q.opinion() >= D.WARUNKI.opinia && ((p && p.renoma ? p.renoma(0) : 0) >= D.WARUNKI.renoma) && w1ok;
        } catch (e) { return false; }
    }
    const sladyN = () => Object.keys(S().slady).length;
    const praceN = () => { const p = S().prace; return (p.kramy.length >= 6 ? 1 : 0) + (p.beczki ? 1 : 0) + (p.lampy.length >= 8 ? 1 : 0); };
    const praceGotowe = () => { const s = S(); return s.z !== 1 || praceN() >= 3 || s.prace.wydane === 1; };

    // ==================================================================
    // 2. The events: ONE function says what each id shows now
    // ==================================================================
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    const LAMP_NOTE = "<Light:150,110,76,28><LightWhen:night>", FIRE_NOTE = "<Light:190,255,150,60><LightFlicker:0.14,255,130,60><LightHeight:24>";
    const idIn = (id, base, n) => id >= base && id < base + n;
    const fairHour = (a, h) => (h === undefined ? hour() : h) >= a[0] && (h === undefined ? hour() : h) < a[1];
    const SCENA_CELLS = () => [D.SCENA.x, D.SCENA.y];
    // spec(id): null = hidden now; else { name, x, y, sheet, index, dir, pat, trigger, through, anim, note, prio, say }
    function spec(id) {
        if (!has()) return null;
        const s = S(), d = day(), h = hour(), M = mapNow();
        if (idIn(id, D.ID.slad0, 5)) {
            const sl = D.SLADY[id - D.ID.slad0];
            if (!sl || s.slady[sl.k] || (sl.map || D.MAP.miasto) !== M) return null;
            const on = s.przed.kradziez === 1 && (d > D.DNI.sztuka || h >= 19.7) && s.zasadzka !== 1 && d <= D.DNI.pogon && fairHour(sl.godz);
            return on ? { name: "Ślad: " + sl.k, x: sl.x, y: sl.y, sheet: "!$Wesele_Znak", index: 0, dir: 2, pat: 1, trigger: 0, through: true, say: "slad", k: sl.k } : null;
        }
        if (M === D.MAP.miasto) {
            if (idIn(id, D.ID.kram0, 6)) {
                const i = id - D.ID.kram0, p = D.KRAMY[i];
                if (!jarmark()) return null;
                if (s.prace.kramy.includes(i)) return { name: "Stragan jarmarczny", x: p[0], y: p[1], sheet: "!Town_Props", index: 2, dir: 6, pat: i % 3, trigger: 0, through: false, say: "kram" };
                if (s.z === 1 && s.prace.deski > 0 && d <= D.DNI.otwarcie) return { name: "Miejsce na kram", x: p[0], y: p[1], sheet: "!$Wesele_Znak", index: 0, dir: 2, pat: 1, trigger: 0, through: false, say: "miejsceKram" };
                return null;
            }
            if (idIn(id, D.ID.lampa0, 8)) {
                const i = id - D.ID.lampa0, p = D.LAMPY[i];
                if (!jarmark()) return null;
                if (s.prace.lampy.includes(i)) return { name: "Lampion jarmarczny", x: p[0], y: p[1], sheet: "!lamp", index: 0, dir: 2, pat: 0, through: false, note: LAMP_NOTE, say: "lampa" };
                if (s.z === 1 && s.prace.lampiony > 0 && d <= D.DNI.otwarcie + 0) return { name: "Słup na lampion", x: p[0], y: p[1], sheet: "!$Wesele_Znak", index: 0, dir: 2, pat: 1, trigger: 0, through: false, say: "miejsceLampa" };
                return null;
            }
            if (idIn(id, D.ID.beczka0, 4)) {
                const i = id - D.ID.beczka0, p = D.BECZKI[i];
                return jarmark() && s.prace.beczki ? { name: "Beczka z browaru", x: p[0], y: p[1], sheet: "!Tavern_Yard", index: 0, dir: 8, pat: 0, through: false } : null;
            }
            const targ = targOn() && (d > D.DNI.otwarcie || h >= 8);
            if (id === D.ID.scena) return targ ? { name: "Scena trupy", x: D.SCENA.x, y: D.SCENA.y, sheet: "!$Jarmark_Scena", index: 0, dir: 2, pat: 1, through: false, note: "<Occupy:left=3,right=3,up=2>", fix: true } : null;
            if (idIn(id, D.ID.pochodnia0, 4)) {
                const p = D.SCENA.torches[id - D.ID.pochodnia0];
                if (!targ) return null;
                const lit = !(s.przed.cien === 1);
                return { name: "Pochodnia sceny", x: p[0], y: p[1], sheet: "!Decoration", index: 3, dir: lit ? 4 : 2, pat: 1, through: false, anim: lit, note: lit && id >= D.ID.pochodnia0 + 2 ? "<Light:230,255,150,60><LightFlicker:0.14,255,130,60><LightHeight:24>" : "" };
            }
            if (id === D.ID.poduszka) {
                if (!targ || s.przed.kradziez === 1 || d < D.DNI.otwarcie || (d === D.DNI.otwarcie && h < 15)) return null;
                return { name: "Poduszka z Krukiem", x: D.SCENA.poduszka[0], y: D.SCENA.poduszka[1], sheet: "!$Jarmark_Kruk", index: 0, dir: 2, pat: 1, through: false, say: "poduszka" };
            }
            for (const [k, v] of Object.entries(D.TRUPA)) if (id === D.ID[k]) {
                if (!targ || !fairHour(v.godz)) return null;
                if (k === "szept" && (s.przed.kradziez === 1)) return null;
                if (k === "marcel" && s.marcel === "aresztowany") return null;
                if (k === "marcel" && d >= D.DNI.pogon + 1 && h > 9) return null;
                if (d >= D.DNI.rozstrzygniecie + 1) return null;
                const pos = v.pos;
                return { name: tx1("imiona." + k), x: pos[0], y: pos[1], sheet: v.sheet, index: 0, dir: pos[2], pat: 1, through: false, trigger: 0, say: "rozmowa", kto: k, keep: true };
            }
            if (idIn(id, D.ID.tlum0, D.TLUM.length)) {
                const i = id - D.ID.tlum0, c = D.TLUM[i];
                // the crowd of the play: 18:30-20:00 of day 51 (and the closing at noon of day 53)
                const play = d === D.DNI.sztuka && h >= 18.5 && h < 20 && s.przed.kradziez !== 1;
                const close = d === D.DNI.rozstrzygniecie && h >= 11.5 && h < 12.5 && !zamkniety();
                return play || close || (api.crowd) ? { name: "Widz", x: c[1], y: c[2], sheet: c[0], index: 0, dir: 8, pat: 1, through: false } : null;
            }
            if (id === D.ID.ambrozy) {
                const play = d === D.DNI.sztuka && h >= 18.5 && h < 20 && s.przed.kradziez !== 1, close = d === D.DNI.rozstrzygniecie && h >= 11.5 && h < 12.5 && !zamkniety();
                return play || close ? { name: tx1("imiona.ambrozy"), x: D.SCENA.ambrozy[0], y: D.SCENA.ambrozy[1], sheet: "$Npc_Dzwonnik", index: 0, dir: 2, pat: 1, through: false } : null;
            }
            if (idIn(id, D.ID.pochod0, 10)) return api.pochod && api.pochod[id - D.ID.pochod0] ? api.pochod[id - D.ID.pochod0] : null;
            if (idIn(id, D.ID.noc0, 6)) {
                const n = id - D.ID.noc0, night = d === D.DNI.pogon || (d === D.DNI.rozstrzygniecie && h < 7);
                if (!night || zamkniety()) return null;
                if (n < 4) { const c = D.NOC_DZWONNICA.lampy[n]; return { name: "Latarnia przy dzwonnicy", x: c[0], y: c[1], sheet: "!lamp", index: 0, dir: 2, pat: 0, through: false, note: "<Light:200,120,84,30><LightWhen:night>" }; }
                const c = D.NOC_DZWONNICA.ogniska[n - 4];
                return { name: "Ognisko straży", x: c[0], y: c[1], sheet: "!Decoration", index: 3, dir: 4, pat: 1, through: false, anim: true, note: "<Light:230,255,150,60><LightFlicker:0.14,255,130,60><LightHeight:24>" };
            }
            if (idIn(id, D.ID.pogon0, 10)) return api.pogonEv && api.pogonEv[id - D.ID.pogon0] ? api.pogonEv[id - D.ID.pogon0] : null;
        } else if (M === D.MAP.karczma) {
            if (idIn(id, D.ID.sedzia0, 4)) {
                const k = Object.keys(D.SEDZIOWIE)[id - D.ID.sedzia0], v = D.SEDZIOWIE[k];
                return api.sala ? { name: tx1("imiona." + k), x: v.x, y: D.HALA.rzad, sheet: v.sheet, index: 0, dir: 2, pat: 1, through: false } : null;
            }
            if (id === D.ID.mietek) return api.sala ? { name: tx1("imiona.mietek"), x: D.HALA.mietek[0], y: D.HALA.mietek[1], sheet: "$Npc_Gracz", index: 0, dir: 2, pat: 1, through: false } : null;
            if (id === D.ID.soltysHala) return api.sala ? { name: tx1("imiona.soltys"), x: D.HALA.soltys[0], y: D.HALA.soltys[1], sheet: "$Npc_Soltys", index: 0, dir: 2, pat: 1, through: false } : null;
            if (id === D.ID.wanda) {   // Wanda Ósemka by the dice table of the game room, days 50-51, 14-23, until the tournament is won (she leaves in disgrace)
                const on = (d === 50 || d === 51) && h >= 14 && h < 23 && s.z !== 0 && s.turniej.fin !== 1 && !s.turniej.wygral && jarmark();
                return on || api.wanda ? { name: tx1("imiona.wanda"), x: D.HALA.wanda[0], y: D.HALA.wanda[1], sheet: "$Npc_Jarmark_Wanda", index: 0, dir: D.HALA.wanda[2], pat: 1, through: false, trigger: 0, say: "rozmowa", kto: "wanda" } : null;
            }
        }
        return null;
    }
    // the note of an event: the solid size stays from the start (a stall is 3 cells wide, the stage 7 x 3 - ChoppableTree reads it
    // once), the light follows the state (zastosuj writes it into the map's data and tells the lights: Tawerna.lightsVer)
    const STALA = id => idIn(id, D.ID.kram0, 6) ? "<Occupy:left=1,right=1>" : id === D.ID.scena ? "<Occupy:left=3,right=3,up=2>" : "";
    const notatka = (id, sp) => STALA(id) + (sp && sp.note && !/<Occupy/i.test(sp.note) ? sp.note : "");
    function dane(id, sp) {
        const x = sp ? sp.x : 0, y = sp ? sp.y : 0;
        return { id, name: sp ? sp.name : "Jarmark", note: notatka(id, sp), x, y, pages: [{ conditions: Object.assign({}, BLANK), directionFix: !!(sp && (sp.fix || sp.say === "kram" || sp.dir === undefined ? 0 : 0)),
            image: { tileId: 0, characterName: sp ? sp.sheet : "", direction: sp ? sp.dir : 2, pattern: sp ? sp.pat : 1, characterIndex: sp ? sp.index : 0 },
            list: [C(355, ["Jarmark.dotknij(this);"]), C(0)], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 1,
            stepAnime: !!(sp && sp.anim), through: sp ? !!sp.through : true, trigger: sp && sp.say ? (sp.trigger !== undefined ? sp.trigger : 0) : 0, walkAnime: !!(sp && sp.kto) }] };
    }
    const ALL_IDS = [];
    for (let i = D.IDS[0]; i < D.ID.slad0 + 5; i++) ALL_IDS.push(i);
    for (let i = D.ID.pochod0; i < D.ID.noc0 + 6; i++) ALL_IDS.push(i);
    // the ids a day can need (the rest are not made: a map with fewer events updates faster)
    function potrzebne(id, mapId) {
        if (mapId === D.MAP.podgrodzie) return true;
        if (mapId !== D.MAP.miasto) return true;
        const d = has() ? day() : 0;
        if (id < D.ID.scena) return true;                                     // stalls, lamps, barrels
        if (d < D.DNI.otwarcie) return false;
        if (idIn(id, D.ID.tlum0, 8)) return d === D.DNI.sztuka || d === D.DNI.rozstrzygniecie;
        if (idIn(id, D.ID.slad0, 5)) return d === D.DNI.sztuka || d === D.DNI.pogon;
        if (idIn(id, D.ID.pochod0, 10)) return d === D.DNI.otwarcie || d === D.DNI.rozstrzygniecie;
        if (idIn(id, D.ID.pogon0, 10) || idIn(id, D.ID.noc0, 6)) return d === D.DNI.pogon || d === D.DNI.rozstrzygniecie;
        return true;
    }
    const MIASTO_IDS = ALL_IDS.filter(i => i < D.ID.sedzia0 || i >= D.ID.pochod0);   // (4800-4849 and 4860-4889)
    const KARCZMA_IDS = [D.ID.sedzia0, D.ID.sedzia0 + 1, D.ID.sedzia0 + 2, D.ID.sedzia0 + 3, D.ID.mietek, D.ID.wanda, D.ID.soltysHala];
    const PODGRODZIE_IDS = D.SLADY.map((sl, i) => sl.map === D.MAP.podgrodzie ? D.ID.slad0 + i : 0).filter(Boolean);   // (the clues lying in Podgrodzie)
    const idsOf = M => M === D.MAP.miasto ? MIASTO_IDS : M === D.MAP.karczma ? KARCZMA_IDS : M === D.MAP.podgrodzie ? PODGRODZIE_IDS : null;
    T.inject([D.MAP.miasto, D.MAP.karczma, D.MAP.podgrodzie], { ids: D.IDS, owner: D.OWNER, when: () => jarmark() || api.scena, build: (data, mapId) => {
        const out = [], ids = idsOf(mapId) || [];
        for (const id of ids) if (potrzebne(id, mapId)) out.push(dane(id, spec(id)));   // (a hidden one is an empty, through event at 0,0: shown later by the clock)
        return out;
    } });
    // the events of this map apply their spec (a changed state; never a scan of all the events: only our own ids, found by id)
    function evOf(id) { return $gameMap && $gameMap.event ? $gameMap.event(id) || null : null; }
    let lastApply = "";
    function zastosuj(ev, id) {
        const sp = spec(id), dn = ev.event(), want = notatka(id, sp);
        if (dn && dn.note !== want) { const light = /<Light/i.test(dn.note + want); dn.note = want; if (light) T.lightsVer = (T.lightsVer || 0) + 1; }
        if (!sp) { if (!ev._jarHid) { ev._jarHid = true; ev._jarFree = false; ev._jarMove = false; ev.setTransparent(true); ev.setThrough(true); ev._trigger = -1; ev.locate(0, 0); } return; }
        const was = ev._jarHid;
        if (sp.move && ev._jarMove && !was) return;
        ev._jarMove = !!sp.move;
        ev._jarHid = false;
        ev.setTransparent(false); ev.setThrough(!!sp.through);
        ev.setImage(sp.sheet, sp.index);
        ev.setDirectionFix(false); ev.setDirection(sp.dir); ev.setPattern(sp.pat); ev.setDirectionFix(!sp.move);
        if (sp.move) ev.setWalkAnime(true);
        ev._trigger = sp.say ? (sp.trigger !== undefined ? sp.trigger : 0) : -1;
        ev.setStepAnime(!!sp.anim);
        ev._jarFree = !!sp.free || (ev._jarFree && !!sp.keep);
        if (ev._jarFree || (ev.isMoveRouteForcing && ev.isMoveRouteForcing())) return;   // (a scene has put the actor somewhere: the stage's, the procession's)
        if (was || ev.x !== sp.x || ev.y !== sp.y) { if (!ev._moving) ev.locate(sp.x, sp.y); }
    }
    function odswiezMape(force) {
        if (!has()) return;
        const ids = idsOf(mapNow());
        if (!ids) return;
        for (const id of ids) {
            const ev = evOf(id);
            if (!ev) continue;
            // nobody vanishes in sight: a person (a trooper) shown or taken away only when the hero cannot see the place
            if (!force && id >= D.ID.ofelia && id < D.ID.tlum0 + 8 && Math.abs(ev.x - $gamePlayer.x) < 15 && Math.abs(ev.y - $gamePlayer.y) < 9 && (!!spec(id)) === !ev._jarHid) continue;
            if (!force && id >= D.ID.ofelia && id < D.ID.tlum0 + 8 && (!!spec(id)) !== !ev._jarHid && Math.abs(ev.x - $gamePlayer.x) < 15 && Math.abs(ev.y - $gamePlayer.y) < 9 && !ev._jarHid) continue;
            zastosuj(ev, id);
        }
    }
    const tickState = { sig: "" };
    function eventsTick() {
        if (!has() || !idsOf(mapNow()) || api.noTick) return;
        const s = S();
        const sig = mapNow() + "|" + [day(), Math.floor(hour() * 2), s.z, s.prace.kramy.length, s.prace.lampy.length, s.prace.beczki, s.prace.deski, s.prace.lampiony, s.przed.kradziez, s.przed.cien,
            s.zamkniecie, Object.keys(s.slady).length, s.zasadzka, s.marcel, s.otw, !!api.sala, !!api.wanda, !!api.crowd].join(",");
        if (sig === tickState.sig) return;
        tickState.sig = sig;
        odswiezMape(false);
    }

    // ==================================================================
    // 3. Touching the props (the stalls, the posts, the clues, the people of the fair)
    // ==================================================================
    const SAY = { kram: "dotyk.kram", lampa: "dotyk.lampa", poduszka: "dotyk.poduszka" };
    function dotknij(interp, what, key) {
        const out = [], hero = Watki.mowa.HERO, id = interp && interp.eventId ? interp.eventId() : 0, ev = evOf(id);
        if (!what) { const sp = spec(id); if (!sp || !sp.say) return; what = sp.say; key = sp.k || sp.kto || ""; }   // (every event of ours has this one script: what it does is what the spec says now)
        if (what === "miejsceKram") { postawKram(id - D.ID.kram0); return; }
        if (what === "miejsceLampa") { powiesLampe(id - D.ID.lampa0); return; }
        if (what === "slad") { slad(key); return; }
        if (what === "rozmowa") { aktor(interp, key); return; }
        if (SAY[what]) { linie(out, hero, SAY[what]); uruchom(interp, out); }
    }
    const linie = (out, sp, key, vars) => w.linie(out, sp, key, vars);
    const skrypt = (out, code) => Watki.mowa.script(out, code);
    const wybor = (out, labels, branches, cancel) => Watki.mowa.choiceTo(out, labels, branches, cancel);
    const bran = (sp, key, vars, code) => { const o = []; if (key) linie(o, sp, key, vars); if (code) skrypt(o, code); return o; };
    const uruchom = (interp, list) => Watki.mowa.uruchom(interp || null, list);
    const spkOf = key => { const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null; return { id: ev ? ev.eventId() : -1, name: w.tekstMoze(key + ".imie") || "" }; };
    const spkEv = (id, name) => ({ id, name: name || "" });
    const HERO = () => Watki.mowa.HERO;

    // ==================================================================
    // 4. The works: stalls (6), barrels (4), lanterns (8)
    // ==================================================================
    function postawKram(i) {
        const s = S();
        if (!(i >= 0 && i < 6) || s.prace.kramy.includes(i)) return;
        if (w.vcount("deska_kram") < 1) { popup(tx("prace.brakDesek"), { kind: "info" }); return; }
        w.vtake("deska_kram", 1);
        s.prace.kramy.push(i);
        T.audio.se("Hammer", { volume: 70, pitch: 100 });
        const sp = spec(D.ID.kram0 + i), ev = evOf(D.ID.kram0 + i);
        if (ev) zastosuj(ev, D.ID.kram0 + i);
        popup(fill(tx("prace.kramPostawiony"), { n: s.prace.kramy.length }), { kind: "info" });
        if (s.prace.kramy.length >= 6) { note("notatki.kramy"); praceKoniec("kramy"); }
        sprawdz();
    }
    function powiesLampe(i) {
        const s = S();
        if (!(i >= 0 && i < 8) || s.prace.lampy.includes(i)) return;
        if (hour() < D.GODZ.lampiony && day() <= D.DNI.zgloszenie + 1) { popup(tx("prace.zaWczesnie"), { kind: "info" }); return; }
        if (w.vcount("lampion") < 1) { popup(tx("prace.brakLampionow"), { kind: "info" }); return; }
        w.vtake("lampion", 1);
        s.prace.lampy.push(i);
        T.audio.se("Equip1", { volume: 70, pitch: 110 });
        const ev = evOf(D.ID.lampa0 + i);
        if (ev) zastosuj(ev, D.ID.lampa0 + i);
        popup(fill(tx("prace.lampaPowieszona"), { n: s.prace.lampy.length }), { kind: "info" });
        if (s.prace.lampy.length >= 8) { note("notatki.lampiony"); praceKoniec("lampiony"); if (window.Jarmark_Sceny && Jarmark_Sceny.zapalone) setTimeout(() => { try { Jarmark_Sceny.zapalone(); } catch (e) { report("zapalone", e); } }, 600); }
        sprawdz();
    }
    function praceKoniec(co) {
        const s = S();
        zlato(D.NAGRODA.prace.gold); xp(D.NAGRODA.prace.xp);
        if (praceN() >= 3) { s.prace.wydane = 1; note("notatki.prace"); }
    }
    function deski() { const s = S(); if (s.prace.deski) return; s.prace.deski = 1; w.vgive("deska_kram", 6); popup(tx("prace.deskiWziete"), { kind: "good" }); odswiezMape(true); sprawdz(); }
    function obrecze() { const s = S(); if (s.prace.obrecze) return; s.prace.obrecze = 1; w.vgive("obrecz", 4); popup(tx("prace.obrecze"), { kind: "good" }); sprawdz(); }
    function lampiony() { const s = S(); if (s.prace.lampiony) return; s.prace.lampiony = 1; w.vgive("lampion", 8); popup(tx("prace.lampiony"), { kind: "good" }); odswiezMape(true); sprawdz(); }
    function beczki() {
        const s = S();
        if (s.prace.beczki) return;
        if (w.vcount("obrecz") < 4) { popup(tx("prace.brakObreczy"), { kind: "info" }); return; }
        w.vtake("obrecz", 4);
        s.prace.beczki = 1;
        popup(tx("prace.beczki"), { kind: "good" });
        praceKoniec("beczki");
        note("notatki.beczki");
        sprawdz();
    }

    // ==================================================================
    // 5. The beer contest (S2): four judges, four additions
    // ==================================================================
    const SEDZ = Object.keys(D.SEDZIOWIE);
    function konkursStart() {
        const s = S();
        if (s.konkurs.fin) return;
        if (mapNow() !== D.MAP.karczma) { popup(tx("konkurs.wSali"), { kind: "info" }); return; }
        api.sala = true; odswiezMape(true);
        const out = [], hero = HERO(), sp = k => ({ id: D.ID.sedzia0 + SEDZ.indexOf(k), name: tx1("imiona." + k) });
        skrypt(out, "Jarmark.pasy(true); Jarmark.heroNa(" + D.HALA.hero.join(",") + ");");
        out.push(C(230, [40]));
        linie(out, spkEv(D.ID.soltysHala, tx1("imiona.soltys")), "konkurs.otwarcie");
        for (const k of SEDZ) {
            linie(out, sp(k), "konkurs.sedzia." + k);
            wybor(out, D.DODATKI.map(d => tx1("konkurs.dod." + d)), D.DODATKI.map(d => bran(null, null, null, "Jarmark.dodatek('" + k + "','" + d + "')")), 0);
        }
        skrypt(out, "Jarmark.konkursWynik(this);");
        uruchom(null, out);
    }
    function dodatek(k, d) {
        const s = S(), v = D.SEDZIOWIE[k], ok = v.dod === d;
        s.konkurs.dod[k] = d;
        const a = evOf(D.ID.sedzia0 + SEDZ.indexOf(k));
        if (a && SB() && SB().say) SB().say(a, [].concat(tx((ok ? "konkurs.dobry." : "konkurs.zly.") + k))[0], 140);
        if (a) $gameTemp.requestBalloon(a, ok ? 6 : 1);
        T.audio.se(ok ? "Applause1" : "Buzzer1", { volume: 50 });
    }
    function konkursWynik(interp) {
        const s = S();
        let g = 0; for (const k of SEDZ) if (D.SEDZIOWIE[k].dod === s.konkurs.dod[k]) g++;
        s.konkurs.glosy = g;
        let wynik = g >= 3 ? "wygrana" : g === 2 ? (opiniaNow() >= 30 ? "remisWygrana" : "remisPrzegrana") : "przegrana";
        s.konkurs.wynik = wynik; s.konkurs.fin = 1;
        const out = [], so = spkEv(D.ID.soltysHala, tx1("imiona.soltys"));
        linie(out, so, "konkurs.wynik." + wynik, { g });
        skrypt(out, "Jarmark.konkursKoniec();");
        uruchom(interp, out);
    }
    function konkursKoniec() {
        const s = S(), win = /wygrana|Wygrana/.test(s.konkurs.wynik);
        api.sala = false; pasy(false); odswiezMape(true);
        if (win) { zlato(D.NAGRODA.konkurs.gold); xp(D.NAGRODA.konkurs.xp); opinia(D.NAGRODA.konkurs.opinia); T.call("TavernLife", "addTrust", "borgar", 3, "W17"); note("notatki.konkursWygrana"); }
        else { opinia(-1); note("notatki.konkursPrzegrana"); }
        sprawdz();
    }
    function plotka() {
        const s = S(), k = (T.talk && T.talk.last) ? null : null;
        const cur = api.plotkaKto;
        if (cur) { s.konkurs.znane = s.konkurs.znane || {}; s.konkurs.znane[cur] = 1; }
    }

    // ==================================================================
    // 6. The dice tournament (J7): three matches, the loaded die of Wanda
    // ==================================================================
    function diceParts() { return T.api("TavernDice_parts"); }
    function dodajWande() {
        const P = diceParts();
        if (!P || !P.data || P.data.OPPONENTS.wanda) return;
        P.data.OPPONENTS.wanda = { styleColor: "#e07a6b", bust: "Wanda_Bust", sheet: null, index: 0, hours: [0, 0], stakes: [15], perDay: 0, jarmark: true,
            ai: { bank: [0, 350, 400, 500, 700, 1400, Infinity], reckless: 0, chase: 1.6 }, die: { key: "szczesciarz", chance: 0, giveAfter: 99 }, lines: {}, short: "Wanda" };
    }
    function turniejOkno() { const d = day(), h = hour(); return D.DNI.turniej.includes(d) && inHours(h, D.GODZ.turniej) && !S().turniej.fin; }
    function turniejWpisz() {
        const s = S();
        if (s.turniej.wpisal) return;
        if ($gameParty.gold() < D.TURNIEJ.wpisowe) { popup(fill(tx("turniej.brakZlota"), { n: D.TURNIEJ.wpisowe }), { kind: "info" }); return; }
        zlato(-D.TURNIEJ.wpisowe);
        s.turniej.wpisal = day(); s.turniej.mecz = 0;
        note("notatki.turniej");
        sprawdz();
    }
    function turniejMecz() {
        const s = S(), dice = T.api("TavernDice") || window.TavernDice, m = s.turniej.mecz;
        if (m >= 3 || s.turniej.fin) return;
        dodajWande();
        const opp = D.TURNIEJ.mecze[m];
        if (m === 2 && !s.turniej.oszust) { /* Wanda plays loaded: the stronger head (below) */ }
        if (!dice || !dice.start) { turniejWynik(m, true); return; }
        if (m === 2) { const o = diceParts().data.OPPONENTS.wanda; o.ai.bank = s.turniej.oszust ? [0, 300, 350, 400, 450, 600, Infinity] : [0, 350, 400, 500, 700, 1400, Infinity]; o.ai.chase = s.turniej.oszust ? 1.2 : 1.6; }
        setTimeout(() => dice.start({ opponent: opp, stake: D.TURNIEJ.stawki[m], onEnd: r => {
            const won = !!(r && (r.won || r.win || (r.last && r.last.won) || (r.result && r.result.won)));
            turniejWynik(m, won);
        } }), 30);
    }
    function turniejWynik(m, won) {
        const s = S();
        if (!won) { s.turniej.fin = 2; popup(tx("turniej.przegrana"), { kind: "info" }); note("notatki.turniejPrzegrana"); sprawdz(); return; }
        s.turniej.mecz = m + 1;
        if (s.turniej.mecz >= 3) {
            s.turniej.fin = 1; s.turniej.wygral = 1;
            zlato(D.NAGRODA.turniej.gold); xp(D.NAGRODA.turniej.xp);
            if (window.TavernDice && TavernDice.giveDie) { try { TavernDice.giveDie(D.TURNIEJ.kosc) || TavernDice.giveDie("szczesciarz"); s.turniej.kosc = 1; } catch (e) { report("kosc", e); } }
            s.szept = s.szept || "dluzny";
            if (s.turniej.oszust) note("notatki.turniejWanda");
            note("notatki.turniejWygrana");
        } else popup(fill(tx("turniej.dalej"), { n: s.turniej.mecz }), { top: true, color: "#ffe27a" });
        sprawdz();
    }
    function turniejKontrola() {
        const s = S();
        if (s.turniej.oszust || s.turniej.mecz !== 2) return;
        s.turniej.oszust = 1;
        popup(tx("turniej.kosc"), { top: true, color: "#ffe27a", sub: tx("turniej.koscPod") });
        note("notatki.kosc");
    }

    // ==================================================================
    // 7. The troupe's helpers (J8), the troupe's talk, the clues (J9)
    // ==================================================================
    function pomoc() {
        const s = S(), k = api.pomocKto, key = k === "szwaczka" ? "kostium" : k === "kowal" ? "zar" : k === "piekarka" ? "peruka" : "";
        if (!key || s.przed.pomoc[key]) return;
        s.przed.pomoc[key] = day();
        popup(fill(tx("pomoc.napis"), { n: Object.keys(s.przed.pomoc).length }), { kind: "good" });
        T.call("TownQuests", "addOpinion", 1, tx("zadania.W17.title"));
        sprawdz();
    }
    function aktor(interp, k) {
        const s = S(), out = [], hero = HERO(), sp = { id: interp.eventId(), name: tx1("imiona." + k) };
        if (k === "marcel") linie(out, sp, s.przed.kradziez === 1 ? "marcel.po" : "marcel.rozmowa");
        else if (k === "szept") linie(out, sp, "szept.przed");
        else if (k === "wanda") linie(out, sp, S().turniej.oszust ? "wanda.zdemaskowana" : "wanda.rozmowa");
        else if (k === "ofelia") {
            const n = Object.keys(s.przed.pomoc).length;
            linie(out, sp, s.przed.kradziez === 1 ? "ofelia.po" : n >= 2 ? "ofelia.wskazowka" : "ofelia.rozmowa");
            if (s.przed.kradziez === 1 && n >= 2 && !s.slady.ofelia) skrypt(out, "Jarmark.slad('ofelia')");
        } else linie(out, sp, k + (s.przed.kradziez === 1 ? ".po" : ".rozmowa"));
        uruchom(interp, out);
    }
    const SLAD_KEYS = ["gablota", "cech", "garbarnia", "laznia", "przytulek"];
    function slad(k) {
        const s = S();
        if (s.slady[k]) return;
        const out = [], hero = HERO();
        s.slady[k] = day();
        linie(out, hero, "slad." + k);
        skrypt(out, "Jarmark.sladPo('" + k + "')");
        uruchom(null, out);
    }
    function sladPo(k) {
        const s = S(), n = SLAD_KEYS.filter(x => s.slady[x]).length;
        note("notatki.slad." + k);
        popup(tx("slad.napis"), { top: true, color: "#ffe27a", sub: fill(tx("slad.pod"), { n }) });
        odswiezMape(true); sprawdz();
    }

    // ==================================================================
    // 8. The endings (J11)
    // ==================================================================
    function koniecGotowe() { return !!S().koniec; }
    // the choices of the morning (Jarmark_Sceny.js runs the talk and calls this): how = "A" | "B" | "C" | "D" | "F"
    function koniec(how) {
        const s = S();
        if (s.koniec) return;
        s.koniec = how;
        const n = D.NAGRODA;
        if (how !== "F") { zlato(n.kruk.gold); xp(n.kruk.xp); }
        if (how === "A") { zlato(n.marcel.gold); s.marcel = "aresztowany"; s.szept = "ulaskawiony"; }
        if (how === "B") { s.szept = "dyby"; s.marcel = "odplynal"; }
        if (how === "C") { zlato(-n.litosc.koszt); s.szept = "wolny"; s.marcel = "wolny"; }
        if (how === "D") { zlato(n.szantaz.gold); s.szept = "dyby"; s.marcel = "szantaz"; if (T.call) { try { w.setFlag("jarmarkSzantaz"); } catch (e) { /* none */ } } }
        if (how === "F") { s.szept = "uciekl"; s.marcel = "czysty"; }
        opinia(n.koniec[how].opinia);
        note("notatki.koniec" + how);
        w.setFlag("jarmarkKoniec" + how);
        zwrotka();
        sprawdz();
    }
    // the verse hidden in the Raven's belly: W3's missing one (when W3 is going), else a note
    function zwrotka() {
        const s = S();
        if (s.zwrotka || S().koniec === "F") return;
        const q = TQ(), r = q && q.rec ? q.rec("W3") : null;
        let v = null;
        try { v = q && q.Q && q.Q.W3 && q.hasVerse && r ? (q.Q.W3.verses || []).find(x => !q.hasVerse(x.key)) : null; } catch (e) { v = null; }
        if (v && q.gainVerse) { try { q.gainVerse(v.key); s.zwrotka = v.key; popup(tx("kruk.zwrotka"), { top: true, color: "#ffe27a", sub: tx("kruk.zwrotkaPod") }); return; } catch (e) { report("zwrotka", e); } }
        s.zwrotka = "notatka"; note("notatki.zwrotka");
    }

    // ==================================================================
    // 9. The talks of the thread (hooks of the data)
    // ==================================================================
    const ctxKto = ctx => (ctx && ctx.key) || "";
    w.haki({
        mowca: (ctx, key) => {
            if (key === "bohater") return HERO();
            const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null;
            return { id: ev ? ev.eventId() : -1, name: w.tekstMoze("imiona." + key) || w.tekstMoze(key + ".imie") || "" };
        },
        mozeZgloszenie: () => has() && S().z !== -2 && day() >= D.DNI.zgloszenie && day() <= D.DNI.otwarcie + 2 && (S().z === 1 || !!S().zmus || warunki()),
        soltysZgloszenie: () => has() && S().z === 0 && inHours(hour(), D.GODZ.zlecenie),
        soltysPrace: () => has() && S().z === 1 && !praceGotowe(),
        praceGotowe: () => praceGotowe(),
        soltysPraceLinie: () => { const p = S().prace; return [].concat(fill(tx("soltys.prace"), { kramy: p.kramy.length, beczki: p.beczki ? "tak" : "jeszcze nie", lampy: p.lampy.length })); },
        deskiMozna: () => has() && S().z === 1 && !S().prace.deski && day() <= D.DNI.otwarcie,
        deskiJuz: () => !!S().prace.deski,
        obrecze: () => has() && S().z === 1 && !S().prace.obrecze && day() <= D.DNI.otwarcie,
        lampionyMozna: () => has() && S().z === 1 && !S().prace.lampiony && day() <= D.DNI.otwarcie,
        borgarBeczki: () => has() && S().z === 1 && S().prace.obrecze === 1 && !S().prace.beczki && day() <= D.DNI.otwarcie,
        konkursGdy: () => has() && S().z !== 0 && day() === D.DNI.otwarcie && inHours(hour(), D.GODZ.konkurs) && !S().konkurs.fin && mapNow() === D.MAP.karczma && jarmark(),
        konkursJuz: () => !!S().konkurs.fin,
        plotkaSedzia: ctx => has() && S().z !== 0 && day() >= D.DNI.zgloszenie && day() <= D.DNI.otwarcie && !(S().konkurs.znane || {})[ctxKto(ctx)] && !S().konkurs.fin,
        plotkaLinie: ctx => { api.plotkaKto = ctxKto(ctx); return [].concat(tx("plotka." + (ctxKto(ctx) === "kapral" ? "wit" : ctxKto(ctx) === "dzwonnik" ? "ambrozy" : ctxKto(ctx) === "kamerdyner" ? "teodor" : "hanka"))); },
        turniejGdy: () => has() && S().z !== 0 && jarmark() && turniejOkno(),
        turniejWpisany: () => !!S().turniej.wpisal && !S().turniej.fin,
        turniejKosc: () => !!S().turniej.wpisal && S().turniej.mecz === 2 && !S().turniej.oszust,
        pomocMozna: ctx => has() && S().z !== 0 && day() === D.DNI.sztuka && inHours(hour(), D.GODZ.sztukaPomoc) && !S().przed.pomoc[({ szwaczka: "kostium", kowal: "zar", piekarka: "peruka" })[ctxKto(ctx)]],
        pomocLinie: ctx => { api.pomocKto = ctxKto(ctx); return [].concat(tx("pomoc." + ctxKto(ctx))); },
        soltysSledztwo: () => has() && S().przed.kradziez === 1 && !S().koniec && day() <= D.DNI.rozstrzygniecie && S().zasadzka !== 1,
        soltysSledztwoLinie: () => [].concat(fill(tx("soltys.sledztwo"), { n: sladyN() })),
        koniecGotowe: () => koniecGotowe(),
        przyjmij: () => { const s = S(); s.z = 1; s.zDzien = day(); note("notatki.zlecenie"); popup(tx("napis.jarmark"), { top: true, color: "#ffe27a", sub: tx("zadania.W17.when") }); odswiezMape(true); sprawdz(); },
        odloz: () => { const s = S(); s.z = -1; sprawdz(); },
        deski, obrecze, lampiony, beczki, konkursStart, plotka, turniejWpisz, turniejMecz, turniejKontrola, pomoc,
        krokZm: () => { const s = S(); return { kramy: s.prace.kramy.length, prace: praceN(), slady: sladyN(), glosy: Math.max(0, s.konkurs.glosy), mecz: s.turniej.mecz, czas: s.pogon.czas, upadki: s.pogon.upadki }; },
        f9Przygotuj: ctx => przygotuj(Number(ctx && ctx.skok) || 1),
        f9Zm: ctx => { const s = S(); return { n: ctx && ctx.row && ctx.row.co === "poszlaki" ? sladyN() : ctx && ctx.row && ctx.row.co === "finaly" ? (s.koniec || "-") : (s.z === 1 ? "tak" : s.z === -1 ? "widz" : "nie") }; },
        f9Wybierz: (ctx, delta) => {
            const s = S(), co = ctx && ctx.row && ctx.row.co;
            if (co === "poszlaki") { const n = (sladyN() + (delta || 1) + 6) % 6; s.slady = {}; SLAD_KEYS.slice(0, n).forEach(k => { s.slady[k] = day(); }); return true; }
            if (co === "finaly") { const L = ["", "A", "B", "C", "D", "F"], i = Math.max(0, L.indexOf(s.koniec || "")); s.koniec = L[(i + (delta || 1) + L.length) % L.length]; return true; }
            if (co === "stan") { s.z = s.z === 1 ? -1 : s.z === -1 ? 0 : 1; return true; }
            return false;
        },
        f9Ok: ctx => { odswiezMape(true); return { say: "Jarmark: " + JSON.stringify({ z: S().z, slady: sladyN(), koniec: S().koniec }) }; }
    });

    // F9: a jump to chapter k prepares the state as far as the chapter needs (the day is set here: the engine's jump sets the hour only)
    function przygotuj(k) {
        const s = S();
        $gameSystem._dayNightDay = [47, 48, 49, 49, 50, 51, 52, 52, 53][k - 1] || 47;
        s.zmus = 1; s.zDzien = day();
        s.z = k === 1 ? 0 : 1;
        if (k >= 3) { s.prace.deski = 1; s.prace.obrecze = 1; s.prace.lampiony = 1; s.prace.kramy = [0, 1, 2, 3, 4, 5]; s.prace.lampy = [0, 1, 2, 3, 4, 5, 6, 7]; s.prace.beczki = 1; s.prace.wydane = 1; }
        if (k >= 4) s.otw = 1;
        if (k >= 5) { s.konkurs.fin = 1; s.konkurs.wynik = "wygrana"; s.konkurs.glosy = 4; }
        if (k >= 6) { s.turniej.fin = 1; s.turniej.wygral = 1; }
        if (k >= 7) { s.przed.kradziez = 1; s.przed.scena = 1; }
        if (k >= 8) { s.slady = { gablota: day(), cech: day(), laznia: day() }; }
        if (k >= 9) { s.zasadzka = 1; s.pogon.koniec = 1; s.szept = "swiadek"; if (!w.vcount("srebrny_kruk")) w.vgive("srebrny_kruk", 1); }
        const q = TQ();
        if (q && q.start && !w.active("W17") && !w.done("W17")) { try { q.start("W17"); } catch (e) { report("start", e); } }
        tickState.sig = "";
        sprawdz();
        if ($gamePlayer.requestMapReload) $gamePlayer.requestMapReload();
    }

    // ==================================================================
    // 10. The clock
    // ==================================================================
    const clockState = { d: -1, h: -1 };
    function zegar() {
        if (!has() || api.noClock) return;
        const s = S(), d = day(), h = hour();
        if (d < D.DNI.zgloszenie || d > D.DNI.rozstrzygniecie + 2) return;
        // never answered the sołtys by day 49: the fair is only the background (a watcher)
        if (s.z === 0 && d > D.DNI.otwarcie && h >= 0) { s.z = -1; sprawdz(); }
        // the works not done by 10:00 of day 49: the sołtys hands the rest to others
        if (s.z === 1 && !s.prace.wydane && (d > D.DNI.otwarcie || (d === D.DNI.otwarcie && h >= 10))) { s.prace.wydane = 1; if (praceN() < 3) opinia(-1); note("notatki.pracePrzejete"); sprawdz(); }
        // the opening: by itself at 15:00 of day 49 when the hero was away
        if (!s.otw && (d > D.DNI.otwarcie || (d === D.DNI.otwarcie && h >= 15))) { s.otw = 1; sprawdz(); }
        // the contest not held by 21:00 of day 49: Mietek by the walk-over
        if (!s.konkurs.fin && (d > D.DNI.otwarcie || (d === D.DNI.otwarcie && h >= D.GODZ.konkurs[1]))) { s.konkurs.fin = 2; s.konkurs.wynik = "walkower"; sprawdz(); }
        // the tournament over (day 51, 23:00) without the hero
        if (!s.turniej.fin && (d > D.DNI.turniej[1] || (d === D.DNI.turniej[1] && h >= D.GODZ.turniej[1]))) { s.turniej.fin = 3; sprawdz(); }
        // the closing at noon of day 53 without the hero's ending: the Raven back (the chase done) - the default decision; else the failure
        if (!s.koniec && s.przed.kradziez === 1 && (d > D.DNI.rozstrzygniecie || (d === D.DNI.rozstrzygniecie && h >= D.GODZ.zamkniecie)) && !(window.Jarmark_Sceny && Jarmark_Sceny.zajete && Jarmark_Sceny.zajete())) {
            if (s.zasadzka !== 1) s.zasadzka = 1;
            if (s.pogon.koniec === 1 && window.Jarmark_Sceny) Jarmark_Sceny.rozstrzygnij(true);
            else { if (!s.pogon.koniec) s.pogon.koniec = 3; koniec("F"); }
            s.zamkniecie = 1;
        }
        if (window.Jarmark_Sceny && Jarmark_Sceny.zegar) { try { Jarmark_Sceny.zegar(); } catch (e) { report("sceny.zegar", e); } }
    }
    T.on("hourChange", () => { try { zegar(); odswiezMape(false); } catch (e) { report("godzina", e); } }, { owner: PLUGIN });
    T.on("dayStart", () => { try { zegar(); odswiezMape(false); } catch (e) { report("dzień", e); } }, { owner: PLUGIN });
    T.on("mapReady", () => { try { if (mapNow() === D.MAP.karczma) dodajWande(); zegar(); tickState.sig = ""; odswiezMape(true); } catch (e) { report("mapa", e); } }, { owner: PLUGIN });
    T.on("load", () => { try { api.sala = false; api.wanda = false; api.crowd = false; api.pochod = null; api.pogonEv = null; } catch (e) { /* ignore */ } }, { owner: PLUGIN });
    let ticker = 0;
    T.onMapUpdate(() => { if (++ticker % 20) return; try { eventsTick(); } catch (e) { report("tick", e); } });

    // ==================================================================
    // 11. The helpers shared with the scenes (Jarmark_Sceny.js)
    // ==================================================================
    function pasy(on) { try { T.call("CleanHUD", "sceneBars", !!on); } catch (e) { report("pasy", e); } }
    function heroNa(x, y, dir) { $gamePlayer.locate(x, y); $gamePlayer.setDirection(dir || 8); if ($gamePlayer.center) $gamePlayer.center(x, y); }
    function dotkniecieEv(interp, what, key) { return dotknij(interp, what, key); }

    const API = { stan: () => S(), S, D, w, tx, tx1, fill, spec, dane, zastosuj, odswiezMape, evOf, popup, note, zlato, xp, opinia, opiniaNow, sprawdz, report, has, day, hour, mapNow, api,
        linie, skrypt, wybor, bran, uruchom, spkOf, spkEv, HERO, pasy, heroNa, inHours, sladyN, praceN, koniec, zwrotka, slad, sladPo, dotknij: dotkniecieEv, dodatek, konkursWynik, konkursKoniec,
        konkursStart, turniejWpisz, turniejMecz, turniejKontrola, dodajWande, warunki, targOn, jarmark, zamkniety, zegar, aktor, postawKram, powiesLampe, praceGotowe, SLAD_KEYS, SB, TL, TQ, C,
        wymus: { slad, postawKram, powiesLampe, deski, obrecze, lampiony, beczki, turniejWynik, koniec } };
    window.Jarmark = T.register(PLUGIN, API);
})();
