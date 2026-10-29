//=============================================================================
// Zakon.js
//=============================================================================
// PACZKA D „Tajemnice i zakon” (docs/rozszerzenia/PLAN.md, punkt 7) - the engine; the data and texts are Zakon_Data.js.
//   - the places (Okolice.registerSpots("D", ...)) and the discoveries (Okolice.discoverable): found by walking close, never from the
//     eagle's back (flying over a place does not count); the eagle's places only by landing there
//   - the events (Tawerna.inject, ids 2700-2899, owner "Zakon") on the new terrain of 15 maps and on this package's own Map176; one
//     script for all of them: Zakon.act(this, [what, ...]). Their looks follow the state: self switch B (the second page) is set by
//     sync() - the wreck's piece shown at low tide, the slab looked under, the herb picked, the grave cleaned, the basin with rain...
//   - the work by hand or with the shovel (the cairn's top, the grave's stone, the key's hole, the wreck's pieces): N blows with the
//     game's tool swing (startToolSwing: crouch / shovel), stamina each blow (Farming.hitCost), O held = the next blow (as Homes.js)
//   - "Zapiski strażnic": six cards (TownQuests vitems zak_karta_1..6) from the cairns (1-3) and the towers (4-6); brother Kleofas
//     reads them (his talk: Tawerna.talk.takeover) - 2 hours, 40 XP, a note
//   - the shadow riddle: the Watchman's shadow (Okolice.shadowAt, the rock's real foot) over the hole, the sun's light, no rain
//   - the eagle: the dive in low flight over a cliff herb (Space, the adult; before Orzel_Lot reads the key - priority 4), the
//     perches (the eagle near one: bond +5 once), the one-way ways down from the landing places
//   - the grove of the Silent: one hour of silence from dusk (Sky.sunTimes), broken by running, the combat mode, a talk, leaving
//   - the wild ravens on the rocks of Map155/157: drawn here from img/system/Kruk.png (Kruk.js only read), fed once a day per rock
//   - the gallows at night (22-3): its creak and a little fog round it
//   - the wreck: each storm's end (a storm seen to start) one more piece out of the sand; dug at low tide
//   - the thread "zakon" (Zakon_Data.js, the engine Watki.js, 2026-10-28): the state, K67-K70 and D36-D38, the talks at the places
//     (the question and the choice) and the gravedigger's and Eryk's few words are the data's - this file gives their hooks
//     (w.haki); Kleofas's reading is built here (from the card); F9 rows (Okolice.f9)
// No water anywhere here (the drought): the perches' rain is the eagles', the chamber's basin is dry or not the hero's.

/*:
 * @target MZ
 * @plugindesc [paczka D] Tajemnice i zakon: strażnice, kapliczki, kopce z Zapiskami strażnic, krąg menhirów z zagadką cieni i komora (mapa 176), miejsca tylko dla orła, orle grzędy, cmentarz z grabarzem i szubienica, gaj Milczących, kruki, kawałki wraku. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Okolice
 *
 * @help
 * ============================================================================
 * Zakon.js - silnik paczki D „Tajemnice i zakon”
 * ============================================================================
 * Plan i kontrakt: docs/rozszerzenia/PLAN.md (punkt 7). Dane: Zakon_Data.js.
 * Numery zdarzeń: 2700-2899 (wstawiane w czasie wczytania mapy - pliki map
 * użytkownika zostają bez zmian). Własna mapa: 176 „Komora pod menhirami”.
 *
 * W skryptach zdarzeń: Zakon.act(this, [co, ...]).
 * Dla testów i F9: Zakon.state(), Zakon.shadowHits(dzień, godzina),
 * Zakon.shadowWindow(dzień), Zakon.giveCard(n), Zakon.revealWreck(),
 * Zakon.sync(), Zakon.ravens(), Zakon.grove().
 * Stan w zapisie: Tawerna.state("zakon").
 * Test: tests/zakon_test.js (port 9554).
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("zakon");   // (the words of this file: js/teksty/zakon.txt, kod.*)

    const PLUGIN = "Zakon";
    const T = window.Tawerna;
    if (!T) throw new Error("Zakon.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const D = window.ZakonData;
    if (!D || !D.ready) throw new Error("Zakon.js: brak Zakon_Data.js - musi być wyżej na liście wtyczek (the package's data is missing)");
    const VERSION = D.VERSION, TX = D.TX, ITEM = D.ITEM, ICON = D.ICON, IMG = D.IMG;
    // the thread (Zakon_Data.js, the engine Watki.js): the state "zakon", K67-K70, D36-D38, the places' talks, the hero's thoughts
    const w = Watki.get("zakon");
    if (!w) throw new Error("Zakon.js: brak wątku „zakon” (Zakon_Data.js / Watki.js)");
    const OK = () => T.api("Okolice") || window.Okolice || null;

    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------
    const { C, HERO } = Watki.mowa;   // (the event commands' maker and the hero as a speaker: the engine's)
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const day = () => T.time.day();
    const hour = () => T.time.hour();
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const give = (id, n) => { if (item(id) && n) $gameParty.gainItem(item(id), n); };
    const iconOf = id => (item(id) ? item(id).iconIndex : 0);
    const nameOf = id => (item(id) ? item(id).name : "");
    const report = (where, e) => { try { console.error("[Zakon] " + where, e); } catch (x) { /* (no console) */ } };
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    // TownQuests' flags, things, records (the thread's helpers); the checks after a change (a quest check's error told here, as before)
    const { vcount, vgive, vtake } = w;
    const qflag = k => w.flag(k);
    const isActive = id => w.active(id);
    function autoChecks() { try { w.autoChecks(); } catch (e) { report("autoChecks", e); } }
    const pop = (text, icon, color) => T.popup(text, { icon: icon || 0, color: color || "#cfe6ff" });
    const need = (icon, text) => T.popup.need(icon, text);
    const top = (text, sub, color) => T.popup(text, { top: true, sub: sub || "", color: color || "#ffe27a" });
    const se = (name, vol, pitch) => T.audio.se(name, { volume: vol || 85, pitch: pitch || 100 });
    const flying = () => { const L = T.api("Orzel_Lot"); try { return !!(L && L.flying && L.flying()); } catch (e) { return false; } };
    const mapId = () => (window.$gameMap ? $gameMap.mapId() : 0);
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
    const raining = () => {
        const F = T.api("Farming"), S0 = T.api("Survival");
        try {
            if (F && F.rainingHere && F.rainingHere()) return true;
            if (S0 && S0.stormNow && S0.stormNow()) return true;
            return !!(T.call("Storm", "level") > 0);
        } catch (e) { return false; }
    };
    const stamina = () => (typeof $gameSystem.trySpendStamina === "function");

    // ------------------------------------------------------------------
    // The state (the save): the thread's (Zakon_Data.js - Tawerna.state "zakon" v1)
    // ------------------------------------------------------------------
    const S = () => w.S();

    // ------------------------------------------------------------------
    // Speech: the hero's thoughts (the thread's - bubbles one after another, Zakon_Data mysli), event commands for the talks (the
    // engine's builder, Watki.mowa: "\n" a new line, as before). The places' talks are the data's (Zakon_Data rozmowy); the lines
    // looked at and Kleofas's reading (built from the card) are built here
    // ------------------------------------------------------------------
    const think = lines => w.mysl(lines);
    const MOWA = { akapity: true };
    // "> text" the hero, else the speaker
    const linesTo = (out, spk, arr) => Watki.mowa.linesTo(out, spk, arr, null, 0, MOWA);
    const act = (out, args) => (out.push(C(355, ["Zakon.act(this, " + JSON.stringify(args) + ")"])), out);
    const choiceTo = Watki.mowa.choiceTo;
    // a plain message (the cards read): a title line and the text wrapped, four lines a page, no bubble (\SPK[-1])
    const plain = (out, title, lines) => Watki.mowa.plain(out, title, lines, { spk: -1 });
    const runList = (interp, list) => w.uruchom(interp && interp.setupChild ? interp : null, list);

    // ------------------------------------------------------------------
    // The places and the discoveries (Okolice): their names and words are js/teksty/zakon.txt's and Okolice copies them - registered
    // once the words are in (still before any game) and again after F9 "Wczytaj teksty od nowa"
    // ------------------------------------------------------------------
    function registerPlaces() {
        const O = OK();
        if (!O) return;
        O.registerSpots("D", D.SPOTS);
        for (const d of D.DISC) O.discoverable(Object.assign({ pkg: "D", when: () => !flying() }, d));
    }
    Watki.poTekstach(registerPlaces);
    T.on("tekstyWczytane", registerPlaces, { owner: PLUGIN });
    const discover = (key, quiet) => { const O = OK(); return !!(O && O.discover && O.discover(key, quiet)); };
    const found = key => { const O = OK(); return !!(O && O.isFound && O.isFound(key)); };

    // ------------------------------------------------------------------
    // The events (Tawerna.inject): built from the data and the state at the map's load; their looks then follow sync()
    // ------------------------------------------------------------------
    const LIGHT = {
        candle: "<Light:80,255,170,80><LightFlicker:0.07,255,140,60><LightHeight:44>",
        lamp: "<Light:130,255,170,90><LightFlicker:0.12,255,130,60><LightHeight:62>"
    };
    const img = f => (f ? { characterName: f[0], direction: f[1], pattern: f[2], characterIndex: f[3] || 0 } : {});
    const script = args => [C(355, ["Zakon.act(this, " + JSON.stringify(args) + ");"])];
    // a page: { look (IMG entry), args (Zakon.act), priority (0 below, 1 same), through, trigger, cond (self switch B / switch) }
    function pg(o) {
        const O = OK();
        const cond = o.b ? { selfSwitchCh: "B", selfSwitchValid: true } : o.c ? { selfSwitchCh: "C", selfSwitchValid: true } : o.sw ? { switch1Id: o.sw, switch1Valid: true } : null;
        return O.page({ image: img(o.look), list: o.args ? script(o.args) : [], priority: o.priority === undefined ? 1 : o.priority, through: !!o.through,
            trigger: o.trigger || 0, directionFix: true, cond });
    }
    const ev = (id, name, x, y, pages, note) => OK().event(id, name, x, y, pages, note || "");
    const blank = (id, x, y, name) => OK().blank(id, x, y, name || TK.kod.blank[0]);
    // a thing with one look, or a second one on self switch B
    const thing = (id, name, x, y, look, args, o) => {
        const q = o || {};
        const pages = [pg({ look, args, priority: q.priority, through: q.through, trigger: q.trigger })];
        if (q.lookB !== undefined || q.argsB !== undefined) pages.push(pg({ look: q.lookB === undefined ? look : q.lookB, args: q.argsB === undefined ? args : q.argsB, b: true,
            priority: q.priorityB === undefined ? q.priority : q.priorityB, through: q.throughB === undefined ? q.through : q.throughB }));
        return ev(id, name, x, y, pages, (q.note || "") + "<Zakon:" + (args ? args.join(":") : "deko") + ">");
    };

    function buildMap(data, map) {
        const out = [];
        const O = OK();
        if (!O) return out;
        // 7.1 the foundations of the towers
        for (const t of D.TOWERS.filter(t => t.map === map)) {
            // the ring of low walls (one picture, below the hero, the hero walks in): its 4x4 tiles in the middle of the 6x6 place
            // (x+1..x+4, y+1..y+4); the frame is 5 tiles wide (the picture in its left 4), centred on x+3
            out.push(thing(t.ids.ring, TK.kod.buildMap[0], t.x + 3, t.y + 4, IMG.fundament, null, { priority: 0, through: true }));
            const sx = t.x + D.SLAB_AT[0], sy = t.y + D.SLAB_AT[1];
            out.push(thing(t.ids.slab, TK.kod.buildMap[1], sx, sy, IMG.plytaStr, ["tower", t.key], { lookB: IMG.plytaStrZbadana, note: "<ZakFlat>" }));
            t.bushes.forEach((b, i) => { if (!(b[0] === sx && b[1] === sy)) out.push(blank(t.ids.blank + i, b[0], b[1])); });
        }
        // 7.2 the shrines (a candle at night: the light is drawn only in the dark outside)
        for (const s of D.SHRINES.filter(s => s.map === map)) {
            out.push(thing(s.id, s.name, s.at[0], s.at[1], IMG.kapliczka, ["shrine", s.key], { lookB: IMG.kapliczkaDar, note: LIGHT.candle }));
            s.bushes.forEach((b, i) => out.push(blank(s.id + 1 + i, b[0], b[1])));
        }
        // 7.3 the cairns: the cairn (a rock picture - its own list, never mined; the sun's shadow comes with the rock picture) and the
        // raven stone on its top (gone once the top was taken down - the card found)
        for (const c of D.CAIRNS.filter(c => c.map === map)) {
            out.push(thing(c.ids.cairn, TK.kod.buildMap[2], c.at[0], c.at[1], ["!$Rock_Cairn", 2, 0], ["cairn", c.key]));
            out.push(thing(c.ids.stone, TK.kod.buildMap[3], c.at[0], c.at[1], IMG.kopiecKruk, null, { priority: 1, through: true, lookB: null }));
        }
        // 7.4 the ring of menhirs, the plate, the hole
        if (map === D.RING.map) {
            const R = D.RING;
            R.stones.forEach((p, i) => out.push(thing(R.stoneIds + i, "Menhir", p[0], p[1], [R.stoneImg, 2, 0], ["stone"])));
            out.push(thing(R.watchman.id, TK.kod.buildMap[4], R.watchman.x, R.watchman.y, [R.watchman.img, 2, 0], ["watchman"]));
            out.push(ev(R.plate.id, TK.kod.buildMap[5], R.plate.x, R.plate.y, [
                pg({ look: IMG.plyta, args: ["plate"] }),
                pg({ look: IMG.plytaOtwarta, args: ["plateDown"], sw: D.SW.komora, priority: 0, trigger: 1 })], "<Zakon:plyta><ZakFlat>"));
            out.push(thing(R.hole.id, TK.kod.buildMap[6], R.hole.x, R.hole.y, IMG.dol, ["hole"], { lookB: IMG.dolKopany, argsB: ["hole"], priorityB: 0, throughB: true, note: "<ZakFlat>" }));
        }
        // 7.4 the chamber (this package's own map)
        if (map === D.CHAMBER.map) {
            const K = D.CHAMBER;
            out.push(ev(K.stairs.id, TK.kod.buildMap[7], K.stairs.x, K.stairs.y, [pg({ look: ["!Fantasy_door5", 2, 0], args: ["chStairs"], priority: 1, trigger: 1 })], "<Zakon:schody>"));
            for (const sc of K.sarcophagus) out.push(thing(sc.id, TK.kod.buildMap[8], sc.x, sc.y, null, ["chSarc"], { priority: 1 }));
            for (const tc of K.torches) out.push(thing(tc.id, TK.kod.buildMap[9], tc.x, tc.y, IMG.pochodniaZimna, null, { priority: 1, through: true }));
            out.push(thing(K.basin.id, TK.kod.buildMap[10], K.basin.x, K.basin.y, IMG.komoraMisa, ["chBasin"]));
            out.push(thing(K.wall.id, TK.kod.buildMap[11], K.wall.x, K.wall.y, IMG.komoraMapa, ["chWall"]));
            out.push(thing(K.chest.id, TK.kod.buildMap[12], K.chest.x, K.chest.y, IMG.komoraSkrzynia, ["chChest"], { lookB: IMG.komoraSkrzyniaOtw }));
            for (const st of K.statues) out.push(thing(st.id, TK.kod.buildMap[13], st.x, st.y, null, ["chStatue"], { priority: 1 }));
        }
        // 7.5 the eagle's places
        for (const e of D.EAGLE.filter(e => e.map === map)) {
            out.push(thing(e.down.id, e.rope === "lina" ? TK.kod.buildMap[14] : TK.kod.buildMap[15], e.down.at[0], e.down.at[1], IMG.kolki, ["down", e.key], { priority: 0 }));
            for (const t of e.things) {
                const name = { stash: TK.kod.buildMap[16], warzucha: TK.kod.buildMap[17], nest: TK.kod.buildMap[18], nestOrder: TK.kod.buildMap[19],
                    szarotka: TK.kod.buildMap[20], ravenStone: TK.kod.buildMap[21], camp: TK.kod.buildMap[22] }[t.kind] || "Rzecz";
                const look = { stash: IMG.skrytka, warzucha: IMG.warzucha, nest: IMG.gniazdo, nestOrder: IMG.gniazdo, szarotka: IMG.ziele, ravenStone: IMG.kamienKruk, camp: IMG.ognisko }[t.kind];
                const lookB = { stash: IMG.skrytkaPusta, warzucha: IMG.zieleZerwane, nest: IMG.gniazdoPuste, nestOrder: IMG.gniazdoPuste, szarotka: IMG.zieleZerwane }[t.kind];
                out.push(thing(t.id, name, t.x, t.y, look, ["eagleThing", e.key, t.id], lookB ? { lookB } : {}));
            }
            (e.bushes || []).forEach((b, i) => out.push(blank(e.blankId + i, b[0], b[1])));
        }
        // 7.5 the cliff herbs (in the sea by the cliff: seen from the eagle's back, picked in a dive)
        for (const c of D.CLIFF.filter(c => c.map === map)) out.push(thing(c.id, TK.kod.buildMap[23], c.x, c.y, IMG.warzucha, null, { priority: 0, through: true, lookB: IMG.zieleZerwane }));
        // 7.6 the perches
        for (const p of D.PERCHES.filter(p => p.map === map)) {
            out.push(thing(p.id, TK.kod.buildMap[24], p.at[0], p.at[1], IMG.grzeda, ["perch", p.n], { lookB: IMG.grzedaWoda }));
            const tr = p.trace, look = tr.kind === "pioro" ? IMG.pioro : tr.kind === "siodlo" ? IMG.siodlo : IMG.slady;
            out.push(thing(tr.id, TK.kod.buildMap[25], tr.x, tr.y, look, ["trace", p.n], { lookB: tr.kind === "siodlo" ? IMG.siodlo : IMG.sladyPuste }));
        }
        // 7.7 the cemetery and the gallows
        if (map === D.CEMETERY.map) {
            const G = D.CEMETERY, x1 = G.x + G.w - 1, y1 = G.y + G.h - 1, gate = new Set(G.gate.map(c => c[0] + "," + c[1]));
            let id = G.wall.from;
            for (let x = G.x; x <= x1; x++) for (const y of [G.y, y1]) {
                if (gate.has(x + "," + y) || (x === G.lamp.x && y === G.lamp.y)) continue;
                const corner = x === G.x || x === x1;
                out.push(thing(id++, TK.kod.buildMap[26], x, y, corner ? IMG.murekRog : IMG.murekH, null));
            }
            for (let y = G.y + 1; y < y1; y++) for (const x of [G.x, x1]) out.push(thing(id++, TK.kod.buildMap[26], x, y, IMG.murekV, null));
            out.push(thing(G.lamp.id, TK.kod.buildMap[27], G.lamp.x, G.lamp.y, IMG.lampa, ["lamp"], { note: LIGHT.lamp }));
            for (const g of G.graves) {
                if (g.raven) out.push(thing(g.id, TK.kod.buildMap[28], g.x, g.y, IMG.grobKruk, ["grave", g.raven], { lookB: IMG.grobKrukCzysty }));
                else out.push(thing(g.id, TK.kod.buildMap[29], g.x, g.y, IMG[g.img], ["graveOld"]));
            }
            const W = D.GALLOWS;
            out.push(thing(W.id, "Szubienica", W.at[0], W.at[1], IMG.szubienica, ["gallows"], { note: "<Occupy:left=1,right=1>" }));
        }
        // 7.8 the grove of the Silent
        if (map === D.GROVE.map) {
            const G = D.GROVE;
            G.stones.forEach((p, i) => out.push(thing(G.ids + i, TK.kod.buildMap[30], p[0], p[1], IMG.kamienMilcz, ["gstone", i], i === 0 ? { lookB: IMG.kamienMilczDar } : {})));
            out.push(blank(G.centreId, G.centre[0], G.centre[1], TK.kod.buildMap[31]));
        }
        // 7.10 the wreck's pieces (page 1 nothing; B the piece out of the sand at low tide; C the hole left)
        if (map === D.WRECK.map) {
            for (const p of D.WRECK.pieces) {
                out.push(ev(p.id, Watki.wstaw(TK.kod.buildMap[32], { n: p.n }), p.x, p.y, [
                    pg({ look: null, priority: 0, through: true }),
                    pg({ look: IMG[p.img], args: ["wreck", p.n], b: true }),
                    pg({ look: IMG.wrakDol, args: ["wreckHole", p.n], c: true, priority: 0, through: true })], "<Zakon:wrak:" + p.n + "><ZakFlat>"));
            }
        }
        return out;
    }
    // flat things (<ZakFlat>: the plate, the slab, the hole, the wreck's pieces) block and are faced like any thing, but are drawn
    // under the hero (a flat stone is never over his feet)
    const _Game_Event_screenZ = Game_Event.prototype.screenZ;
    Game_Event.prototype.screenZ = function() {
        if (this._zakFlat === undefined) { const d = this.event(); this._zakFlat = !!(d && d._twOwner === PLUGIN && /<ZakFlat>/.test(d.note || "")); }
        return this._zakFlat ? 1 : _Game_Event_screenZ.call(this);
    };
    const MAPS = Array.from(new Set([].concat(D.TOWERS.map(t => t.map), D.SHRINES.map(s => s.map), D.CAIRNS.map(c => c.map), [D.RING.map, D.CHAMBER.map],
        D.EAGLE.map(e => e.map), D.CLIFF.map(c => c.map), D.PERCHES.map(p => p.map), [D.CEMETERY.map, D.GROVE.map, D.WRECK.map])));
    T.inject(MAPS, { ids: D.IDS, owner: PLUGIN, build: (data, map) => { try { return buildMap(data, map); } catch (e) { report("build " + map, e); return []; } } });

    // ------------------------------------------------------------------
    // The looks follow the state: self switches B / C of the package's events on the map the hero is on
    // ------------------------------------------------------------------
    function selfSw(id, ch, on) {
        if (!$gameMap.event(id)) return;
        const key = [$gameMap.mapId(), id, ch];
        if (!!$gameSelfSwitches.value(key) !== !!on) $gameSelfSwitches.setValue(key, !!on);
    }
    const herbReady = k => { const d = S().herbs[k]; return !d || day() - d >= D.REGROW; };
    const tideLow = () => { const W = T.api("Wyspa"); try { return !!(W && W.tide && W.tide().low); } catch (e) { return false; } };
    const rainWater = () => { const O = OK(); return !!(O && (O.rainOn(day()) || O.rainOn(day() - 1))); };
    function sync() {
        if (!has()) return;
        const m = mapId(), s = S();
        for (const t of D.TOWERS) if (t.map === m) selfSw(t.ids.slab, "B", !!s.towers[t.key]);
        for (const sh of D.SHRINES) if (sh.map === m) selfSw(sh.id, "B", s.offered[sh.key] === day());
        for (const c of D.CAIRNS) if (c.map === m) selfSw(c.ids.stone, "B", !!s.cairns[c.key]);
        if (m === D.RING.map) selfSw(D.RING.hole.id, "B", !!s.key);
        if (m === D.CHAMBER.map) selfSw(D.CHAMBER.chest.id, "B", !!s.chamber.chest);
        for (const e of D.EAGLE) if (e.map === m) for (const t of e.things) {
            if (t.kind === "stash") selfSw(t.id, "B", !!s.stash);
            else if (t.kind === "warzucha" || t.kind === "szarotka") selfSw(t.id, "B", !herbReady(e.key + ":" + t.id));
            else if (t.kind === "nest") selfSw(t.id, "B", !herbReady(e.key + ":" + t.id));
            else if (t.kind === "nestOrder") selfSw(t.id, "B", !!s.nests[e.key]);
        }
        for (const c of D.CLIFF) if (c.map === m) selfSw(c.id, "B", !herbReady(c.key));
        for (const p of D.PERCHES) if (p.map === m) { selfSw(p.id, "B", rainWater()); selfSw(p.trace.id, "B", !!s.traces[p.n]); }
        if (m === D.CEMETERY.map) for (const g of D.CEMETERY.graves) if (g.raven) selfSw(g.id, "B", !!s.graves[g.raven]);
        if (m === D.GROVE.map) selfSw(D.GROVE.ids, "B", !!s.grove.done && !s.grove.gift);
        if (m === D.WRECK.map) {
            const low = tideLow();
            for (const p of D.WRECK.pieces) {
                const out = s.wreck >= p.n, dug = !!s.wreckDug[p.n];
                selfSw(p.id, "B", out && !dug && low);
                selfSw(p.id, "C", dug && low);
            }
        }
    }

    // ------------------------------------------------------------------
    // The work: N blows by hand (crouch) or with the shovel, the stamina each blow, O held = the next one (as Homes.js)
    // ------------------------------------------------------------------
    const SWING = { hands: 6, shovel: 2 };
    let again = null;
    // def: { key, need, tool (item id) | null, kind (SWING), x, y, se, fx, label(n, m), done() }
    function strike(def) {
        if (def.tool && count(def.tool) < 1) { need(iconOf(def.tool), TX.needShovel); return false; }
        if ($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging()) return false;
        const cost = Number(T.call("Farming", "hitCost")) || 2;
        if (cost > 0 && stamina() && !$gameSystem.trySpendStamina(cost)) { need(ICON.stamina, TX.tired); return false; }
        const rate = Number(T.call("Combat", "workSpeed")) || 1;
        const next = () => { again = { def, at: Graphics.frameCount + Math.max(2, Math.round(12 / rate)) }; };
        let started = false;
        try { started = !!($gamePlayer.startToolSwing && $gamePlayer.startToolSwing(def.kind, () => blow(def), next, { rate })); } catch (e) { started = false; }
        if (!started) blow(def);
        return true;
    }
    function blow(def) {
        const wk = S().work, n = wk[def.key] = Math.min(def.need, (wk[def.key] || 0) + 1), last = n >= def.need;
        if (def.tool) T.call("Durability", "use", def.tool);
        se(def.se || "Earth1", 80, 95 + Math.floor(Math.random() * 10));
        try {
            ($gameTemp._hitFx || ($gameTemp._hitFx = [])).push({ type: def.fx || "dirt", final: last, bx: def.x + 0.5, by: def.y + 1,
                dx: Math.sign(def.x - $gamePlayer.x), dy: Math.sign(def.y - $gamePlayer.y) });
        } catch (e) { /* (no hit effects) */ }
        if (last) { again = null; delete wk[def.key]; try { def.done(); } catch (e) { report("work " + def.key, e); } }
        else pop(def.label(n, def.need), def.icon || 0, "#e8e0c8");
    }
    function holdUpdate() {
        if (!again || Graphics.frameCount < again.at) return;
        const a = again;
        again = null;
        if (!Input.isPressed("ok") || !T.isCalm(null, { only: ["farmMenu", "build", "event", "message", "tool"] })) return;
        const p = $gamePlayer, d = p.direction();
        if ($gameMap.roundXWithDirection(p.x, d) !== a.def.x || $gameMap.roundYWithDirection(p.y, d) !== a.def.y) return;
        if ((S().work[a.def.key] || 0) < a.def.need && (!a.def.can || a.def.can())) strike(a.def);
    }
    function work(def) { return strike(def); }

    // ------------------------------------------------------------------
    // "Zapiski strażnic": the cards (vitems zak_karta_1..6)
    // ------------------------------------------------------------------
    const cardsFound = () => Object.keys(S().cards).length;
    const cardsRead = () => Object.keys(S().read).length;
    function giveCard(n) {
        const s = S();
        if (!n || s.cards[n]) return false;
        s.cards[n] = day();
        if (!s.read[n]) vgive("zak_karta_" + n, 1);
        pop(Watki.wstaw(TK.kod.giveCard[0], { n: n }), ICON.karta, "#ffd866");
        se("Book1", 80, 100);
        autoChecks();
        return true;
    }
    const nextCard = (from, to) => { for (let n = from; n <= to; n++) if (!S().cards[n]) return n; return 0; };
    function readCard(n) {
        const s = S(), c = D.CARDS.find(x => x.n === n);
        if (!c || s.read[n]) return false;
        s.read[n] = day();
        vtake("zak_karta_" + n, 1);
        if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(D.READ_TIME);
        T.call("Journal", "addNote", Watki.wstaw(TK.kod.readCard[0], { n: n, title: c.title }), c.note);
        T.call("Combat", "gainXp", D.READ_XP, Watki.wstaw(TK.kod.readCard[1], { n: n }), true);
        pop(Watki.wstaw(TK.kod.readCard[2], { "1": cardsRead() }), ICON.karta, "#ffd866");
        if (n === 3 || n === 4) { const O = OK(); if (O && O.hint) O.hint("menhiry_krag"); }
        autoChecks();
        return true;
    }

    // ------------------------------------------------------------------
    // The shadow riddle: the Watchman's shadow over the hole (the drawn rock shadow: its foot 14 px over the cell's bottom, 92 px tall)
    // ------------------------------------------------------------------
    function shadowHits(d, h) {
        const O = OK(), R = D.RING, sh = R.shadow;
        if (!O || !O.shadowAt) return false;
        const s = O.shadowAt(d, h, sh.hPx);
        if (!s || !(s.light >= sh.light)) return false;
        const T48 = 48, ax = (R.watchman.x + 0.5) * T48, ay = (R.watchman.y + 1) * T48 - sh.footUp, bx = ax + s.dx, by = ay + s.dy;
        const px = (R.hole.x + 0.5) * T48, py = (R.hole.y + 0.5) * T48, vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
        return Math.hypot(px - (ax + t * vx), py - (ay + t * vy)) <= sh.tol * T48;
    }
    function shadowWindow(d) {
        const at = d === undefined ? day() : d;
        let first = null, last = null;
        for (let h = 12; h <= 21.5; h += 0.05) if (shadowHits(at, h)) { if (first === null) first = h; last = h; }
        return first === null ? null : [Math.round(first * 100) / 100, Math.round(last * 100) / 100];
    }
    function shadowNow() {
        if (mapId() !== D.RING.map || raining()) return false;
        const Sky = T.api("Sun") || window.Sky;
        try { if (Sky && Sky.now && !(Sky.now().light >= D.RING.shadow.light)) return false; } catch (e) { return false; }
        return shadowHits(day(), hour());
    }

    // ------------------------------------------------------------------
    // The acts (the events' scripts): Zakon.act(this, [what, ...])
    // ------------------------------------------------------------------
    const evOf = interp => (interp && window.$gameMap ? $gameMap.event(interp.eventId()) : null);
    const ACT = {};
    // 7.1 the towers: look under the slab = the next card of 4-6
    ACT.tower = (interp, key) => {
        const s = S();
        if (s.towers[key]) { pop(TX.towerEmpty, ICON.karta); return; }
        runList(interp, w.rozmowa("wieza", { spk: HERO, key }));   // (the data's talk: look under the slab or leave it)
    };
    ACT.towerTake = (interp, key) => {
        const s = S();
        if (s.towers[key]) return;
        const n = nextCard(4, 6);
        s.towers[key] = day();
        discover(key, true);
        se("Push", 70, 80);
        if (n) { giveCard(n); runList(interp, linesTo([], HERO, TX.towerFound(n))); }
        // all three towers seen: they looked at the stone ring - the compass of "Okolice" leads there (when it leads nowhere else)
        if (D.TOWERS.every(t => s.towers[t.key])) {
            const O = OK();
            if (O && O.hint) O.hint("menhiry_krag");
            if (O && O.track) O.track("menhiry_krag", { ifNone: true });   // (2026-10-22: the core's API, integration)
            think(TX.towersRing);
        }
        sync();
        autoChecks();
    };
    // 7.2 the shrines
    ACT.shrine = (interp, key) => runList(interp, w.rozmowa("kapliczka", { spk: HERO, key }));   // (the data's talk: pray, a coin, food, away)
    function buffLeft(key) { const b = $gameSystem.buffs ? $gameSystem.buffs()[key] : 0; const now = day() * 24 + hour(); return b ? Math.max(0, b - now) : 0; }
    ACT.pray = (interp, key) => {
        const s = S();
        if (s.prayed[key] === day()) { need(ICON.blogoslawienstwo, TX.prayedToday); return; }
        s.prayed[key] = day();
        s.prayCount[key] = (s.prayCount[key] || 0) + 1;
        $gameSystem.addBuff("blogoslawienstwo", 4);
        discover(key, true);
        se("Bell1", 50, 120);
        top(TX.prayed, TX.prayedSub(Math.round(buffLeft("blogoslawienstwo"))), "#ffe9b0");
        if (Object.keys(s.prayCount).length === 1 && s.prayCount[key] === 1) think(TX.prayThink);
        autoChecks();
    };
    ACT.offer = (interp, key, what) => {
        const s = S();
        if (s.prayed[key] !== day()) { need(ICON.blogoslawienstwo, TX.offerNeedPrayer); return; }
        if (s.offered[key] === day()) { need(ICON.blogoslawienstwo, TX.offeredToday); return; }
        const left = buffLeft("blogoslawienstwo");
        if (left >= 6 - 0.01) { need(ICON.blogoslawienstwo, TX.offerFull); return; }
        if (what === "coin") {
            if ($gameParty.gold() < 1) { need(ICON.gold, TX.noCoin); return; }
            $gameParty.loseGold(1);
        } else {
            const food = $gameParty.items().filter(i => i && /<Food:/.test(i.note || "")).sort((a, b) => a.price - b.price)[0];
            if (!food) { need(ICON.food, TX.noFood); return; }
            $gameParty.loseItem(food, 1);
        }
        s.offered[key] = day();
        const b = $gameSystem.buffs(), now = day() * 24 + hour();
        b.blogoslawienstwo = now + Math.min(6, left + 1);
        se("Coin", 60, 110);
        pop(TX.offered(Math.round(buffLeft("blogoslawienstwo") * 10) / 10), ICON.blogoslawienstwo, "#ffe9b0");
        sync();
    };
    // 7.3 the cairns: the top taken down by hand (4 blows) = the next card of 1-3
    ACT.cairn = (interp, key) => {
        const s = S();
        if (s.cairns[key]) { pop(TX.cairnDone, ICON.kruk); return; }
        runList(interp, w.rozmowa("kopiec", { spk: HERO, key }));   // (the data's talk: take the top down or leave it)
    };
    ACT.cairnWork = (interp, key) => {
        const c = D.CAIRNS.find(x => x.key === key);
        if (!c || S().cairns[key]) return;
        work({ key: "cairn:" + key, need: D.WORK.cairn, tool: null, kind: SWING.hands, x: c.at[0], y: c.at[1], se: "Earth2", fx: "stone", icon: ICON.kruk,
            label: TX.cairnHit, can: () => !S().cairns[key],
            done: () => {
                const s = S(), n = nextCard(1, 3);
                s.cairns[key] = day();
                discover(key, true);
                se("Earth1", 70, 80);
                if (n) giveCard(n);
                think(TX.cairnFound(n || 1));
                sync();
            } });
    };
    // 7.4 the ring
    ACT.stone = () => think(TX.stoneLook);
    ACT.watchman = () => think(TX.watchmanLook);
    ACT.plate = interp => {
        runList(interp, w.rozmowa("plyta", { spk: HERO }));   // (the data's talk: the look; with the key - put it in or leave it)
        if (count(ITEM.klucz) < 1) need(ICON.klucz, TX.plateNoKey);
    };
    ACT.plateKey = interp => {
        const s = S();
        if (count(ITEM.klucz) < 1 || $gameSwitches.value(D.SW.komora)) return;
        s.plate = day();
        $gameSwitches.setValue(D.SW.komora, true);
        se("Switch2", 85, 80);
        se("Push", 90, 70);
        $gameScreen.startShake(3, 6, 30);
        runList(interp, linesTo([], HERO, TX.plateOpen));
        autoChecks();
    };
    ACT.plateDown = () => {
        if (!$gameSwitches.value(D.SW.komora)) return;
        se("Stairs", 80, 90);
        $gamePlayer.reserveTransfer(D.CHAMBER.map, D.CHAMBER.entry[0], D.CHAMBER.entry[1], D.CHAMBER.dir, 0);
    };
    ACT.hole = interp => {
        const s = S(), R = D.RING;
        if (s.key) { pop(TX.holeDug, ICON.shovel); return; }
        if (count(ITEM.shovel) < 1) { need(iconOf(ITEM.shovel), TX.needShovel); return; }
        if (raining()) { need(ICON.klucz, TX.holeRain); return; }
        if (!shadowNow()) { need(ICON.klucz, TX.holeLook); return; }
        work({ key: "hole", need: D.WORK.dig, tool: ITEM.shovel, kind: SWING.shovel, x: R.hole.x, y: R.hole.y, se: "Earth1", fx: "dirt", icon: iconOf(ITEM.shovel),
            label: TX.holeHit, can: () => !S().key && shadowNow(),
            done: () => {
                const s2 = S();
                if (s2.key) return;
                s2.key = day();
                if (count(ITEM.klucz) < 1) give(ITEM.klucz, 1);
                discover("cien_straznika");
                se("Item3", 80, 90);
                think(TX.keyFound);
                sync();
                autoChecks();
            } });
    };
    // 7.4 the chamber
    ACT.chStairs = () => {
        se("Stairs", 80, 110);
        $gamePlayer.reserveTransfer(D.RING.map, D.RING.back[0], D.RING.back[1], 2, 0);
    };
    ACT.chSarc = interp => { S().chamber.sarc = S().chamber.sarc || day(); runList(interp, linesTo([], HERO, TX.sarcLook)); };
    ACT.chBasin = interp => runList(interp, linesTo([], HERO, rainWater() ? TX.basinWater : TX.basinLook));
    ACT.chStatue = interp => runList(interp, linesTo([], HERO, TX.statueLook));
    ACT.chWall = interp => {
        const s = S();
        const first = !s.chamber.wall;
        if (first) s.chamber.wall = day();
        runList(interp, linesTo([], HERO, TX.wallLook));
        if (first) { T.call("Combat", "gainXp", 30, TK.kod.chWall[0], true); autoChecks(); }
    };
    ACT.chChest = interp => {
        const s = S();
        if (s.chamber.chest) { pop(TX.chestEmpty, ICON.pioro); return; }
        if (count(ITEM.pioro) < 1 && s.feather !== "nest") {
            s.chamber.chest = "pioro"; s.feather = "chamber";
            give(ITEM.pioro, 1);
            runList(interp, linesTo([], HERO, TX.chestFeather));
        } else {
            s.chamber.chest = "gold";
            $gameParty.gainGold(D.CHAMBER.gold);
            runList(interp, linesTo([], HERO, TX.chestGold));
        }
        se("Chest1", 85, 100);
        sync();
    };
    // 7.5 the eagle's places
    ACT.down = (interp, key) => {
        const e = D.EAGLE.find(x => x.key === key);
        if (!e) return;
        runList(interp, w.rozmowa("zejscie", { spk: HERO, key, lina: e.rope }));   // (the data's talk: go down or stay)
    };
    ACT.downGo = (interp, key) => {
        const e = D.EAGLE.find(x => x.key === key);
        if (!e) return;
        S().downs[key] = (S().downs[key] || 0) + 1;
        se("Jump1", 70, 80);
        $gamePlayer.reserveTransfer(e.map, e.down.to[0], e.down.to[1], e.down.dir || 2, 0);
        think(TX.downThink);
    };
    ACT.eagleThing = (interp, key, id) => {
        const e = D.EAGLE.find(x => x.key === key), t = e && e.things.find(x => x.id === id), s = S();
        if (!t) return;
        discover(key, true);
        const hk = key + ":" + id;
        if (t.kind === "stash") {
            if (s.stash) { pop(TX.stashTaken, ICON.gold); return; }
            s.stash = day();
            runList(interp, linesTo([], HERO, TX.stashLook));
            const r = T.call("Ludzie", "stashFound", { map: e.map, x: t.x, y: t.y, by: "Zakon" });
            if (r === undefined || r === false || r === null) { $gameParty.gainGold(30); give(ITEM.lina, 1); give(ITEM.smola, 1); }
            se("Chest1", 85, 90);
        } else if (t.kind === "warzucha" || t.kind === "szarotka") {
            if (!herbReady(hk)) { pop(TX.herbGone, t.kind === "szarotka" ? ICON.szarotka : ICON.warzucha); return; }
            s.herbs[hk] = day();
            give(t.kind === "szarotka" ? ITEM.szarotka : ITEM.warzucha, 1);
            se("Item1", 70, 110);
        } else if (t.kind === "nest") {
            if (!herbReady(hk)) { runList(interp, linesTo([], HERO, TX.nestLook)); pop(TX.nestEmpty, ICON.gniazdo); return; }
            s.herbs[hk] = day();
            runList(interp, linesTo([], HERO, TX.nestLook));
            give(ITEM.piora, t.feathers || 3);
        } else if (t.kind === "nestOrder") {
            if (s.nests[key]) { runList(interp, linesTo([], HERO, TX.nestOrderLook)); return; }
            s.nests[key] = day();
            if (count(ITEM.pioro) < 1 && s.feather !== "chamber") {
                s.feather = "nest";
                give(ITEM.pioro, 1);
                runList(interp, linesTo([], HERO, TX.nestOrderLook.concat(TX.nestOrderFeather)));
            } else { runList(interp, linesTo([], HERO, TX.nestOrderLook)); give(ITEM.piora, 2); }
        } else if (t.kind === "ravenStone") runList(interp, linesTo([], HERO, TX.ravenStoneLook));
        else if (t.kind === "camp") runList(interp, linesTo([], HERO, TX.campLook));
        sync();
    };
    // 7.6 the perches
    ACT.perch = (interp, n) => {
        const p = D.PERCHES.find(x => x.n === n), s = S();
        if (!p) return;
        const first = !s.perches[n];
        if (first) s.perches[n] = day();
        const out = linesTo([], HERO, TX.perchLook(n));
        runList(interp, out);
        pop(rainWater() ? TX.perchWater : TX.perchDry, ICON.gniazdo);
        if (first) {
            discover(p.key, true);
            T.call("Combat", "gainXp", 40, TK.kod.perch[0], true);
            T.call("Journal", "addNote", Watki.wstaw(TK.kod.perch[4], { "1": [TK.kod.perch[1], TK.kod.perch[2], TK.kod.perch[3]][n - 1] }), TX.perchLook(n).map(l => l.replace(/^> /, "")).join(" "));
        }
        autoChecks();
    };
    ACT.trace = (interp, n) => {
        const s = S();
        if (n === 1) {
            if (s.traces[1]) { pop(TX.traceTaken, ICON.strzemie); return; }
            s.traces[1] = day();
            give(ITEM.strzemie, 1);
            se("Item3", 70, 90);
        } else if (n === 2) {
            runList(interp, linesTo([], HERO, TX.saddleLook));
            s.traces[2] = s.traces[2] || day();
        } else {
            if (s.traces[3]) { pop(TX.featherTaken, ICON.pioro); return; }
            s.traces[3] = day();
            give(ITEM.piora, 2);
        }
        sync();
        autoChecks();
    };
    // 7.7 the cemetery
    ACT.graveOld = () => pop(TX.graveLook, ICON.grob, "#d8d2c4");
    ACT.grave = (interp, n) => {
        const s = S(), name = TX.graveNames[n];
        if (s.graves[n]) { runList(interp, linesTo([], HERO, TX.graveRead(name))); return; }
        runList(interp, w.rozmowa("grob", { spk: HERO, n }));   // (the data's talk: clean the stone or leave it)
    };
    ACT.graveWork = (interp, n) => {
        const g = D.CEMETERY.graves.find(x => x.raven === n);
        if (!g || S().graves[n]) return;
        work({ key: "grave:" + n, need: D.WORK.grave, tool: null, kind: SWING.hands, x: g.x, y: g.y, se: "Sand", fx: "leaf", icon: ICON.grob,
            label: TX.graveHit, can: () => !S().graves[n],
            done: () => {
                const s = S();
                s.graves[n] = day();
                se("Item3", 60, 80);
                think(TX.graveRead(TX.graveNames[n]));
                T.call("Journal", "addNote", Watki.wstaw(TK.kod.done[0], { name: TX.graveNames[n].name }), TX.graveNames[n].line);
                if ([1, 2, 3].every(k => s.graves[k]) && !s.names) {
                    s.names = day();
                    vgive("zak_imiona", 1);
                    think(TX.graveAll);
                }
                sync();
                autoChecks();
            } });
    };
    ACT.lamp = () => pop(TX.lampLook, ICON.blogoslawienstwo, "#ffe9b0");
    ACT.gallows = interp => {
        const h = hour(), night = h >= D.GALLOWS.creak[0] || h < D.GALLOWS.creak[1];
        S().gallows = S().gallows || day();
        runList(interp, linesTo([], HERO, TX.gallowsLook.concat(night ? TX.gallowsNight : [])));
    };
    // 7.8 the grove
    ACT.gstone = (interp, i) => {
        const s = S();
        if (i === 0 && s.grove.done && !s.grove.gift) {
            s.grove.gift = day();
            if (count(ITEM.kamien) < 1) give(ITEM.kamien, 1);
            sync();
            return;
        }
        pop(TX.groveStone, ICON.kamien, "#e8eef4");
    };
    // 7.10 the wreck
    ACT.wreck = (interp, n) => {
        const s = S();
        if (s.wreckDug[n] || s.wreck < n) return;
        if (!tideLow()) { need(ICON.okucie, TX.wreckHigh); return; }
        runList(interp, w.rozmowa("wrak", { spk: HERO, n }));   // (the data's talk: dig it out or leave it)
    };
    ACT.wreckHole = () => {};
    ACT.wreckWork = (interp, n) => {
        const p = D.WRECK.pieces.find(x => x.n === n);
        if (!p || S().wreckDug[n]) return;
        if (count(ITEM.shovel) < 1) { need(iconOf(ITEM.shovel), TX.needShovel); return; }
        work({ key: "wreck:" + n, need: D.WORK.wreck, tool: ITEM.shovel, kind: SWING.shovel, x: p.x, y: p.y, se: "Sand", fx: "dirt", icon: ICON.okucie,
            label: TX.wreckHit, can: () => !S().wreckDug[n] && tideLow(),
            done: () => {
                const s = S();
                s.wreckDug[n] = day();
                if (n === 1) give(ITEM.okucie, 2);
                else if (n === 2) give(ITEM.tabliczka, 1);
                else { $gameParty.gainGold(D.WRECK.chestGold); give(ITEM.smola, 1); }
                discover("wrak_kawalki", true);
                think(TX.wreckGot(n));
                sync();
                autoChecks();
            } });
    };
    // Kleofas's reading (the talk's branches)
    // ("Nie, w innej sprawie": the same talk again without this plugin's part - the core's talk service, skip)
    ACT.read = (interp, n) => { readCard(n); };
    ACT.pass = interp => { const L = T.api("TownLife"); if (L && L.talk && interp) L.talk(interp, { skip: PLUGIN }); };
    ACT.told = (interp, k) => { S().told[k] = day(); };
    ACT.ravenFeed = (interp, key, ri, itemId) => feedRavens(key, ri, itemId);

    // (the old script calls of the places' talks - towerTake, pray, offer, cairnWork, plateKey, downGo, graveWork, wreckWork,
    // ravenFeed, told: a talk saved before 2026-10-28 - are these same acts; the new ones go through Watki.act to the data's actions,
    // whose hooks call them)
    function actCall(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const e = evOf(interp);
        if (e && e._erased) return;
        const f = ACT[args[0]];
        if (!f) return;
        try { f(interp, args[1], args[2], args[3]); } catch (e2) { report("act " + JSON.stringify(args), e2); }
    }

    // ------------------------------------------------------------------
    // The eagle: the dive over a cliff herb (before Orzel_Lot reads the Space key: priority 4), the landing, the perches
    // ------------------------------------------------------------------
    function diveUpdate() {
        if (!has() || !flying()) return;
        const L = T.api("Orzel_Lot"), lot = L && L.lot;
        if (!lot || lot.phase !== "fly" || lot.level !== "low" || !Input.isTriggered("dodge")) return;
        const m = mapId(), herbs = D.CLIFF.filter(c => c.map === m);
        if (!herbs.length) return;
        const O = T.api("Orzel"), e = O && O.eagle;
        if (!e) return;
        const near = herbs.map(c => ({ c, d: dist(e.x, e.y, c.x + 0.5, c.y + 0.9) })).filter(o => o.d <= D.DIVE.reach).sort((a, b) => a.d - b.d)[0];
        if (!near) return;
        const st = O.state();
        if ((st.stage || 0) < D.DIVE.stage) return;   // (the young ones: Orzel_Lot says it itself)
        Input._latestButton = null;                    // (the key is ours: no "Nie ma na kogo nurkować")
        const c = near.c, s = S();
        if (!herbReady(c.key)) { pop(TX.diveGone, ICON.warzucha); return; }
        if ((st.st || 0) < D.DIVE.cost) { need(ICON.stamina, TX.diveTired); return; }
        st.st -= D.DIVE.cost;
        s.herbs[c.key] = day();
        s.cliff[c.key] = day();
        se("Wind7", 60, 120);
        se("Water1", 60, 110);
        give(ITEM.warzucha, 1);
        discover("ziola_klif");
        sync();
    }
    T.on("orzelLand", e => {
        if (!has() || !e) return;
        const m = e.map || mapId(), p = $gamePlayer;
        for (const x of D.EAGLE) {
            if (x.map !== m) continue;
            if (dist(p.x, p.y, x.x + 1.5, x.y + 1.5) > 6) continue;
            S().eagle[x.key] = S().eagle[x.key] || day();
            if (!S().told["land:" + x.key]) { S().told["land:" + x.key] = day(); think([Watki.wstaw(TK.kod.glowna[0], { "1": TX.downAsk(x.rope).replace(/\.$/, "") })]); }
        }
    }, { owner: PLUGIN });
    function perchUpdate() {
        if (mapId() !== 175) return;
        const O = T.api("Orzel"), e = O && O.eagle;
        if (!e || e.map !== 175 || e.ridden || e.caged) return;
        const s = S();
        for (const p of D.PERCHES) {
            if (s.perchBond[p.n]) continue;
            if (dist(e.x, e.y, p.at[0] + 0.5, p.at[1] + 0.9) > D.PERCH_NEAR) continue;
            s.perchBond[p.n] = day();
            if (O.addBond) O.addBond(D.PERCH_BOND);
            pop(Watki.wstaw(TK.kod.perchUpdate[1], { "1": TX.perchEagle(O.nameOf ? O.nameOf() : TK.kod.perchUpdate[0]), PERCH_BOND: D.PERCH_BOND }), ICON.gniazdo, "#e8eef4");
        }
    }

    // ------------------------------------------------------------------
    // The grove of the Silent: one hour of silence from dusk
    // ------------------------------------------------------------------
    function sunset(d) { const Sky = T.api("Sun") || window.Sky; try { return Sky && Sky.sunTimes ? Sky.sunTimes(d).set : 20; } catch (e) { return 20; } }
    const absHours = () => day() * 24 + hour();
    const groveWindow = () => { const h = hour(), set = sunset(day()); return h >= set - 0.25 && h < set + D.GROVE.late; };
    const inGrove = (x, y) => x >= D.GROVE.x && x < D.GROVE.x + D.GROVE.w && y >= D.GROVE.y && y < D.GROVE.y + D.GROVE.h;
    const talking = () => { const SB = T.api("SpeechBubbles"); try { const t = SB && SB.talk ? SB.talk() : null; return !!(t && t.on) || $gameMessage.isBusy(); } catch (e) { return $gameMessage.isBusy(); } };
    let groveNoteAt = 0;
    function breakGrove(why) {
        const g = S().grove;
        g.run = null;
        g.broken = day();
        need(ICON.kamien, TX.groveBroken);
        T.emit("zakonGrove", { done: false, why });
    }
    function groveUpdate() {
        if (mapId() !== D.GROVE.map) return;
        const s = S(), g = s.grove, p = $gamePlayer, G = D.GROVE;
        if (!g.seen && inGrove(p.x, p.y) && !flying()) { g.seen = day(); think(TX.groveFirst); }
        if (g.done) return;
        const dc = dist(p.x, p.y, G.centre[0], G.centre[1]);
        const running = p.isMoving() && p.isDashing(), combat = !!$gameSystem._combatMode;
        if (g.run) {
            if (dc > G.keep + 0.01) return breakGrove("left");
            if (running) return breakGrove("run");
            if (combat) return breakGrove("combat");
            if (talking() || $gameMap.isEventRunning()) return breakGrove("talk");
            const left = g.run.start + G.hours - absHours();
            if (left <= 0) return finishGrove();
            if (Graphics.frameCount >= groveNoteAt) { groveNoteAt = Graphics.frameCount + 900; pop(TX.groveWait(Math.max(1, Math.ceil(left * 60))), ICON.kamien, "#e8eef4"); }
            return;
        }
        if (!inGrove(p.x, p.y) || g.broken === day()) return;
        if (!groveWindow()) {
            if (dc <= G.start && Graphics.frameCount >= groveNoteAt) { groveNoteAt = Graphics.frameCount + 1200; pop(TX.groveNotYet, ICON.kamien, "#e8eef4"); }
            return;
        }
        if (running || combat) return breakGrove(running ? "run" : "combat");
        if (dc <= G.start && !p.isMoving() && !talking()) {
            g.run = { start: absHours(), day: day() };
            groveNoteAt = Graphics.frameCount + 600;
            think(TX.groveStart);
        }
    }
    function finishGrove() {
        const s = S(), g = s.grove;
        g.run = null;
        g.done = day();
        $gameSystem.addBuff("spokoj", 6);
        discover("gaj", true);
        se("Bell1", 40, 70);
        top(TK.kod.finishGrove[0], TX.groveDoneSub, "#e8eef4");
        think(TX.groveDone);
        T.emit("zakonGrove", { done: true });
        sync();
        autoChecks();
    }

    // ------------------------------------------------------------------
    // The wild ravens on the rocks (Map155, Map157): drawn here from img/system/Kruk.png (Kruk.js: the sheet, read only)
    // ------------------------------------------------------------------
    const KS = (window.KrukData && KrukData.SHEET) || { file: "Kruk", cell: 48, feet: 45, height: 30, stand: [0, 0], caw: [0, [1, 2, 3, 4, 5, 6, 7, 8]],
        peck: [1, [0, 1, 2, 3, 4, 5, 6, 7, 8]], takeoff: [2, [0, 1, 2, 3, 4, 5, 6]], fly: [3, [0, 1, 2, 3, 4, 5, 6, 7]], glide: [3, 2] };
    // the rock tops (px from the rock's foot, px sideways from the cell's middle): measured on the pictures
    const ROCK_TOPS = { "!$Boulder_A": [[20, 60], [44, 64]], "!$Rock_Cracked": [[-6, 40], [6, 40]] };
    let birds = [], birdMap = 0, birdLayer = null;
    const tilemap = () => { const sc = SceneManager._scene; return sc instanceof Scene_Map && sc._spriteset ? sc._spriteset._tilemap : null; };
    const krukTame = () => qflag("krukTame");
    function rockEventAt(x, y) {
        return $gameMap.eventsXy(x, y).find(e => e && !e._erased && /Boulder|Rock_/.test(e.characterName() || "") && (e._twOwner || (e.event() && e.event()._twOwner) || "") !== PLUGIN) || null;
    }
    function spawnBirds() {
        dropBirds();
        birdMap = mapId();
        const R = D.RAVENS.find(r => r.map === birdMap);
        if (!R) return;
        const h = hour();
        if (h < 6 || h >= 20.5) return;   // (asleep in the ruins at night)
        R.rocks.forEach((c, ri) => {
            const rock = rockEventAt(c[0], c[1]);
            if (!rock) return;
            const tops = ROCK_TOPS[rock.characterName()] || [[0, 40]];
            const n = Math.min(D.RAVEN.perRock, tops.length, 1 + ((day() + ri) % 2));
            for (let i = 0; i < n; i++) {
                const tp = tops[i];
                birds.push({ key: R.key, ri, x: c[0] + 0.5 + tp[0] / 48, y: c[1] + 0.98, z: tp[1], home: { x: c[0] + 0.5 + tp[0] / 48, z: tp[1] },
                    facing: (ri + i) % 2 ? 1 : -1, state: "sit", t: 0, idle: 60 + Math.floor(Math.random() * 200), anim: null, rock, away: 0 });
            }
        });
    }
    function dropBirds() {
        for (const b of birds) for (const sp of [b.holder, b.shadow]) if (sp && sp.parent) sp.parent.removeChild(sp);
        birds = [];
    }
    let birdShadow = null;
    function birdShadowBmp() {
        if (birdShadow) return birdShadow;
        birdShadow = new Bitmap(28, 10);
        const ctx = birdShadow.context;
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.ellipse(14, 5, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        birdShadow._baseTexture.update();
        return birdShadow;
    }
    function birdSprite(b) {
        const tm = tilemap();
        if (!tm) return false;
        if (b.holder && b.holder.parent === tm) return true;
        const holder = new Sprite(), spr = new Sprite(ImageManager.loadSystem(KS.file)), sh = new Sprite(birdShadowBmp());
        spr.anchor.set(0.5, KS.feet / KS.cell);
        holder.addChild(spr);
        sh.anchor.set(0.5, 0.5);
        sh.z = 1;
        tm.addChild(sh);
        tm.addChild(holder);
        b.holder = holder; b.sprite = spr; b.shadow = sh;
        return true;
    }
    function birdFrame(b) {
        if (b.state === "takeoff") { const i = Math.min(KS.takeoff[1].length - 1, Math.floor(b.t / 4)); return [KS.takeoff[0], KS.takeoff[1][i]]; }
        if (b.state === "land") { const i = Math.max(0, KS.takeoff[1].length - 1 - Math.floor(b.t / 4)); return [KS.takeoff[0], KS.takeoff[1][i]]; }
        if (b.state === "fly") return [KS.fly[0], KS.fly[1][Math.floor(b.t / 5) % KS.fly[1].length]];
        if (b.anim) return [b.anim.row, b.anim.frames[Math.min(b.anim.i, b.anim.frames.length - 1)]];
        return KS.stand;
    }
    function drawBird(b) {
        if (!birdSprite(b)) return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const gx = Math.round($gameMap.adjustX(b.x) * tw), gy = Math.round($gameMap.adjustY(b.y) * th);
        const [row, col] = birdFrame(b);
        b.sprite.setFrame(col * KS.cell, row * KS.cell, KS.cell, KS.cell);
        b.sprite.scale.x = b.facing;
        b.holder.x = gx; b.holder.y = gy + 2;
        b.sprite.y = -Math.round(b.z) - 2;
        b.holder.z = b.state === "fly" && b.z > 26 ? 9 : 3;
        b.holder.visible = b.state !== "gone";
        const flyingNow = b.state === "fly" || b.state === "takeoff" || b.state === "land";
        b.shadow.x = gx; b.shadow.y = gy;
        b.shadow.visible = flyingNow && b.state !== "gone";
        b.shadow.alpha = Math.max(0.2, 1 - b.z / 150);
    }
    function updateBirds() {
        const m = mapId();
        if (m !== birdMap || (birds.length && birds.some(b => b.holder && b.holder.parent && b.holder.parent !== tilemap()))) {
            if (D.RAVENS.some(r => r.map === m)) spawnBirds(); else { dropBirds(); birdMap = m; }
        }
        if (!birds.length) return;
        const p = $gamePlayer, running = p.isMoving() && p.isDashing(), tame = krukTame();
        for (const b of birds) {
            b.t++;
            if (b.rock && b.rock._erased) { b.state = "gone"; }
            if (b.state === "sit") {
                if (!tame && running && dist(p.x + 0.5, p.y + 0.5, b.x, b.y) <= D.RAVEN.flee) { b.state = "takeoff"; b.t = 0; se("Crow", 60, 100 + Math.floor(Math.random() * 20)); }
                else if (b.anim) { if (++b.anim.k >= b.anim.speed) { b.anim.k = 0; if (++b.anim.i >= b.anim.frames.length) b.anim = null; } }
                else if (--b.idle <= 0) {
                    b.idle = 120 + Math.floor(Math.random() * 260);
                    const r = Math.random();
                    if (r < 0.3) { b.anim = { row: KS.caw[0], frames: KS.caw[1], i: 0, k: 0, speed: 5 }; if (dist(p.x, p.y, b.x, b.y) < 10) se("Crow", 35, 95 + Math.floor(Math.random() * 25)); }
                    else if (r < 0.6) b.anim = { row: KS.peck[0], frames: KS.peck[1], i: 0, k: 0, speed: 5 };
                    else b.facing = -b.facing;
                }
            } else if (b.state === "takeoff") {
                if (b.t >= KS.takeoff[1].length * 4) { b.state = "fly"; b.t = 0; b.vx = (b.facing || 1) * (0.05 + Math.random() * 0.03); }
            } else if (b.state === "fly") {
                b.x += b.vx; b.z += 1.6;
                if (b.z > 200) { b.state = "gone"; b.away = Graphics.frameCount + 60 * 45; }
            } else if (b.state === "gone") {
                if (b.away && Graphics.frameCount >= b.away && dist(p.x, p.y, b.home.x, b.y) > 7 && b.rock && !b.rock._erased) {
                    b.x = b.home.x; b.z = b.home.z; b.state = "land"; b.t = 0; b.away = 0;
                }
            } else if (b.state === "land") {
                if (b.t >= KS.takeoff[1].length * 4) { b.state = "sit"; b.t = 0; }
            }
            drawBird(b);
        }
    }
    // the action button facing a rock with ravens on it (no event of ours there): feed them
    function ravensAt(x, y) {
        const R = D.RAVENS.find(r => r.map === mapId());
        if (!R) return null;
        const ri = R.rocks.findIndex(c => c[0] === x && c[1] === y);
        if (ri < 0) return null;
        const here = birds.filter(b => b.ri === ri && b.state === "sit");
        return here.length ? { R, ri, here } : null;
    }
    function feedMenu(R, ri) {
        const s = S(), k = R.key + ":" + ri;
        if (s.ravens[k] === day()) { need(ICON.kruk, TX.ravenFedToday); return true; }
        const food = D.RAVEN_FOOD.find(id => count(id) > 0);
        if (!food) { need(ICON.kruk, TX.ravenNoFood); return true; }
        runList(null, w.rozmowa("kruki", { spk: HERO, key: R.key, ri, food, jedzenie: nameOf(food) }));   // (the data's talk: throw it or not)
        return true;
    }
    function feedRavens(key, ri, itemId) {
        const s = S(), k = key + ":" + ri;
        if (s.ravens[k] === day() || count(itemId) < 1) return;
        $gameParty.loseItem(item(itemId), 1);
        s.ravens[k] = day();
        for (const b of birds) if (b.ri === ri && b.state === "sit") b.anim = { row: KS.peck[0], frames: KS.peck[1], i: 0, k: 0, speed: 4 };
        se("Crow", 70, 115);
        const g = D.RAVEN.gifts[(day() + ri + key.length) % D.RAVEN.gifts.length];
        pop(TX.ravenGift, ICON.kruk, "#e8eef4");
        give(g[0], g[1]);
        discover(key, true);
    }
    const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && has() && birds.length && !this.isInVehicle() && !$gameMap.isEventRunning()) {
            const d = this.direction(), x = $gameMap.roundXWithDirection(this.x, d), y = $gameMap.roundYWithDirection(this.y, d);
            const r = ravensAt(x, y);
            if (r && feedMenu(r.R, r.ri)) return true;
        }
        return _triggerButtonAction.call(this);
    };

    // ------------------------------------------------------------------
    // The gallows at night (22-3): its creak now and then, a little fog round it
    // ------------------------------------------------------------------
    let fog = null, creakAt = 0;
    function fogBitmap() {
        const b = new Bitmap(192, 80), ctx = b.context, g = ctx.createRadialGradient(96, 40, 4, 96, 40, 92);
        g.addColorStop(0, "rgba(220,226,232,0.55)"); g.addColorStop(1, "rgba(220,226,232,0)");
        ctx.save(); ctx.scale(1, 80 / 192); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(96, 96, 96, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        b._baseTexture.update();
        return b;
    }
    function gallowsUpdate() {
        const W = D.GALLOWS, tm = tilemap();
        const onMap = mapId() === W.map && !!tm;
        const h = hour(), night = h >= W.creak[0] || h < W.creak[1];
        if (!onMap) { if (fog && fog.layer.parent) fog.layer.parent.removeChild(fog.layer); fog = null; return; }
        if (!fog || fog.layer.parent !== tm) {
            if (fog && fog.layer.parent) fog.layer.parent.removeChild(fog.layer);
            const layer = new Sprite(), bmp = fogBitmap(), parts = [];
            layer.z = 4;
            for (let i = 0; i < 7; i++) {
                const s = new Sprite(bmp);
                s.anchor.set(0.5, 0.5);
                parts.push({ s, ox: (Math.random() - 0.5) * 6, oy: (Math.random() - 0.5) * 3.5 + 1, ph: Math.random() * 6.28, sp: 0.002 + Math.random() * 0.003 });
                layer.addChild(s);
            }
            tm.addChild(layer);
            fog = { layer, parts, alpha: 0 };
        }
        const want = night ? 0.8 : 0;
        fog.alpha += (want - fog.alpha) * 0.01;
        fog.layer.visible = fog.alpha > 0.01;
        if (fog.layer.visible) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            for (const q of fog.parts) {
                q.ph += q.sp;
                q.s.x = Math.round($gameMap.adjustX(W.at[0] + 0.5 + q.ox + Math.sin(q.ph) * 0.8) * tw);
                q.s.y = Math.round($gameMap.adjustY(W.at[1] + q.oy) * th);
                q.s.alpha = fog.alpha * (0.6 + 0.4 * Math.sin(q.ph * 1.7));
            }
        }
        if (night && Graphics.frameCount >= creakAt) {
            creakAt = Graphics.frameCount + 480 + Math.floor(Math.random() * 600);
            const p = $gamePlayer, d = dist(p.x, p.y, W.at[0], W.at[1]);
            if (d < 14) T.audio.se("Door1", { volume: Math.round(60 * (1 - d / 14)) + 10, pitch: 55 + Math.floor(Math.random() * 10), pan: Math.max(-80, Math.min(80, Math.round((W.at[0] - p.x) * 12))) });
        }
    }

    // ------------------------------------------------------------------
    // The wreck: a storm seen to start, then its end = one more piece out of the sand (stormEnd also comes right after a load - only
    // a storm whose start was seen counts)
    // ------------------------------------------------------------------
    function revealWreck() {
        const s = S();
        if (s.wreck >= D.WRECK.pieces.length) return false;
        s.wreck++;
        s.wreckDay = day();
        sync();
        return true;
    }
    T.on("stormStart", () => { if (has()) S().stormOn = day() || 1; }, { owner: PLUGIN });
    T.on("stormEnd", () => { if (!has() || !S().stormOn) return; S().stormOn = 0; revealWreck(); }, { owner: PLUGIN });
    function wreckUpdate() {
        if (mapId() !== D.WRECK.map) return;
        const s = S(), p = $gamePlayer;
        if (!tideLow()) return;
        for (const pc of D.WRECK.pieces) {
            if (s.wreck < pc.n || s.wreckDug[pc.n]) continue;
            if (dist(p.x, p.y, pc.x, pc.y) <= 4 && !flying()) {
                if (!s.wreckSeen) { s.wreckSeen = day(); think([TX.wreckShown]); }
                if (!found("wrak_kawalki")) discover("wrak_kawalki");
                autoChecks();
            }
        }
    }

    // ------------------------------------------------------------------
    // The chamber: the first time down, the dark
    // ------------------------------------------------------------------
    function arriveChamber() {
        const s = S();
        if (!s.chamber.been) { s.chamber.been = day(); think(TX.chamberFirst); discover("komora"); autoChecks(); }
        const Tr = T.api("Torch");
        try { if (!(Tr && Tr.isLit && Tr.isLit())) need(iconOf(59), TX.chamberDark); } catch (e) { /* (no torch plugin) */ }
    }

    // ------------------------------------------------------------------
    // The talks: brother Kleofas reads the cards; the gravedigger about the raven graves; Ansgar and the name board
    // ------------------------------------------------------------------
    function kleofasMet() { const P = T.api("Pustelnia"); try { return !!(P && P.state && P.state().met); } catch (e) { return false; } }
    function kleofasTalk(ev) {
        if (!kleofasMet()) return null;
        const h = hour();
        if (h < D.READ_HOURS[0] || h >= D.READ_HOURS[1]) return null;
        const s = S(), n = D.CARDS.map(c => c.n).find(k => s.cards[k] && !s.read[k] && vcount("zak_karta_" + k) > 0);
        if (!n) return null;
        const q = TQ(), mk = q && q.markers ? q.markers().pustelnik : null;
        if (mk === "ready") return null;   // (a quest hand-in first)
        const c = D.CARDS.find(x => x.n === n), spk = { id: ev.eventId(), name: TK.kod.kleofasTalk[0] }, out = [];
        linesTo(out, spk, [!s.told.kleofasZapiski ? TK.kod.kleofasTalk[1] : TK.kod.kleofasTalk[2]]);
        if (!s.told.kleofasZapiski) act(out, ["told", "kleofasZapiski"]);
        const branch = [C(221, [])].concat(act([], ["read", n]), [C(222, [])]);
        plain(branch, Watki.wstaw(TK.kod.kleofasTalk[3], { n: n, title: c.title }), c.read);
        return choiceTo(out, [Watki.wstaw(TK.kod.kleofasTalk[4], { n: n }), TK.kod.kleofasTalk[5]], [branch, act([], ["pass"])], 1);
    }
    // (the gravedigger's and Eryk's words: the data's talks "grabarz" / "ansgar" - said once)
    function grabarzTalk(ev) {
        const s = S();
        if (!isActive("D37") || s.told.grabarzGroby || [1, 2, 3].every(k => s.graves[k])) return null;
        return w.rozmowa("grabarz", { spk: { id: ev.eventId(), name: TX.digger } });
    }
    function ansgarTalk(ev) {
        const s = S();
        if (count(ITEM.tabliczka) < 1 || s.told.ansgarTabliczka) return null;
        return w.rozmowa("ansgar", { spk: { id: ev.eventId(), name: TK.kod.ansgarTalk[0] } });
    }
    // (2026-10-23, docs/ROZMOWY.md) the core's talk service: the owner of the order's matters at Kleofas, Hieronim and Eryk - first of the
    // "owner" takeovers (as the old hook: the last one put first at the load)
    function hookTalk() {
        if (hookTalk.done) return;
        hookTalk.done = true;
        T.talk.takeover({ owner: PLUGIN, who: ["pustelnik", "grabarz", "rozbitek"], priority: T.talk.PRIORITY.owner + 60, run: ctx => {
            const key = ctx.who, ev = ctx.ev;
            try {
                if (!has()) return null;
                if (key === "pustelnik") return kleofasTalk(ev);
                if (key === "grabarz") return grabarzTalk(ev);
                if (key === "rozbitek") return ansgarTalk(ev);
            } catch (e) { report("talk", e); }
            return null;
        } });
    }
    hookTalk();

    // ------------------------------------------------------------------
    // K67-K70, D36-D38 and the places' talks - the data's (Zakon_Data.js); what their conditions, talks and actions ask of the game
    // ------------------------------------------------------------------
    w.haki({
        // K68's offer: brother Kleofas met; D36 starts by the plate in the ring; D38 once the grove is found
        kleofasPoznany: () => kleofasMet(),
        przyPlycie: () => dist($gamePlayer.x, $gamePlayer.y, D.RING.plate.x, D.RING.plate.y) <= 2,
        gajZnaleziony: () => found("gaj"),
        // the places' talks: the Watchman's Key in the bag; the line of the way down (the rope / the pegs) and of the wreck's piece
        maKlucz: () => count(ITEM.klucz) > 0,
        zejscieLinia: ctx => [TX.downAsk(ctx.lina)],
        wrakLinia: ctx => [TX.wreckLook(ctx.n)],
        // the talks' choices: this file's acts
        towerTake: (ctx, key) => ACT.towerTake(ctx.interp, key),
        pray: (ctx, key) => ACT.pray(ctx.interp, key),
        offer: (ctx, key, what) => ACT.offer(ctx.interp, key, what),
        cairnWork: (ctx, key) => ACT.cairnWork(ctx.interp, key),
        plateKey: ctx => ACT.plateKey(ctx.interp),
        downGo: (ctx, key) => ACT.downGo(ctx.interp, key),
        graveWork: (ctx, n) => ACT.graveWork(ctx.interp, n),
        ravenFeed: (ctx, key, ri, itemId) => feedRavens(key, ri, itemId),
        wreckWork: (ctx, n) => ACT.wreckWork(ctx.interp, n)
    });

    // ------------------------------------------------------------------
    // The buffs (Survival): the blessing of the road (the shrines), the calm of the Silent (the grove)
    // ------------------------------------------------------------------
    // (their names and descriptions: js/teksty/zakon.txt, premie - defined once the words are in, before any game)
    Watki.poTekstach(function defineBuffs() {
        const Sv = T.api("Survival") || window.Survival;
        if (!Sv || !Sv.defineBuff) return;
        const PR = TK.premie;
        Sv.defineBuff("blogoslawienstwo", { name: PR.blogoslawienstwo.name, icon: ICON.blogoslawienstwo, desc: PR.blogoslawienstwo.desc, cost: 0.9 });
        Sv.defineBuff("spokoj", { name: PR.spokoj.name, icon: ICON.spokoj, desc: PR.spokoj.desc, cost: 0.95 });
    });

    // ------------------------------------------------------------------
    // The map, the day, the frame
    // ------------------------------------------------------------------
    T.on("mapReady", e => {
        if (!has()) return;
        sync();
        if (mapId() === D.CHAMBER.map) arriveChamber();
        birdMap = -1;
    }, { owner: PLUGIN });
    T.on("dayStart", () => { if (has()) sync(); }, { owner: PLUGIN });
    T.on("load", () => { again = null; dropBirds(); birdMap = -1; }, { owner: PLUGIN });
    T.on("newGame", () => { again = null; dropBirds(); birdMap = -1; }, { owner: PLUGIN });
    let tick = 0;
    T.onMapUpdate(() => { if (has()) diveUpdate(); }, { owner: PLUGIN, name: "dive", priority: 4 });
    T.onMapUpdate(() => {
        if (!has()) return;
        tick++;
        holdUpdate();
        updateBirds();
        gallowsUpdate();
        groveUpdate();
        if (tick % 30 === 0) { sync(); wreckUpdate(); perchUpdate(); }
    }, { owner: PLUGIN, name: "zakon" });

    // ------------------------------------------------------------------
    // F9 (Debug.js, the tab "Wyspa i fabuła"): the package's rows through Okolice.f9
    // ------------------------------------------------------------------
    // [name, map, x, y] - the names: js/teksty/zakon.txt, f9.* (a tower, a cairn: its discovery's; a shrine, an eagle's place: its
    // place's), read when F9 asks
    const GO = () => [].concat(
        D.TOWERS.map(t => [t.name, t.map, t.x + 2, t.y + 4]),
        D.SHRINES.map(s => [s.name, s.map, s.at[0], s.at[1] + 1]),
        D.CAIRNS.map(c => [Watki.wstaw(TK.f9.kopiec, { n: c.key.replace("kopiec_", "") }), c.map, c.at[0], c.at[1] + 1]),
        [[TK.f9.krag, 18, 52, 44], [TK.f9.komora, 176, D.CHAMBER.entry[0], D.CHAMBER.entry[1]]],
        D.EAGLE.map(e => [Watki.wstaw(TK.f9.orzel, { name: e.name }), e.map, e.x + 1, e.y + 1]),
        D.PERCHES.map(p => [Watki.wstaw(TK.f9.grzeda, { n: p.n }), p.map, p.at[0], p.at[1] + 1]),
        [[TK.f9.cmentarz, 8, 9, 27], [TK.f9.szubienica, 8, 88, 125], [TK.f9.gaj, 120, 57, 54], [TK.f9.krukiPustelnia, 155, 76, 49], [TK.f9.krukiUrwisko, 157, 78, 39],
         [TK.f9.wrak, 165, 62, 19]]);
    let f9Spot = 0;
    const f9Label = i => { const g = GO(); return Watki.wstaw(TK.kod.f9Label[0], { "1": i + 1, length: g.length, "3": g[i][0], "4": g[i][1] }); };
    (function f9() {
        const O = OK();
        if (!O || !O.f9) return;
        O.f9.add({ owner: PLUGIN, get title() { return TK.f9.tytul; },
            rows: () => [
                { label: f9Label(f9Spot), icon: ICON.plyta, desc: TK.kod.rows[0], what: "spot", pick: f9Spot },
                { label: TK.kod.rows[1], icon: ICON.klucz, desc: TK.kod.rows[2], what: "shadow" },
                { label: TK.kod.rows[3], icon: ICON.klucz, desc: TK.kod.rows[4], what: "key" },
                { label: TK.kod.rows[5], icon: ICON.karta, desc: TK.kod.rows[6], what: "cards" },
                { label: TK.kod.rows[7], icon: ICON.gniazdo, desc: TK.kod.rows[8], what: "eagle" },
                { label: TK.kod.rows[9], icon: ICON.okucie, desc: TK.kod.rows[10], what: "storm" },
                { label: TK.kod.rows[11], icon: ICON.okucie, desc: TK.kod.rows[12], what: "tide" },
                { label: TK.kod.rows[13], icon: ICON.kamien, desc: TK.kod.rows[14], what: "act2" },
                { label: TK.kod.rows[15], icon: ICON.spokoj, desc: TK.kod.rows[16], what: "grove" }
            ],
            pick(row, delta) {
                if (row.what !== "spot") return;
                const n = GO().length;
                f9Spot = row.pick = ((row.pick || 0) + delta + n) % n;
                row.label = f9Label(row.pick);
            },
            ok(row) {
                if (!has()) return { say: TK.kod.ok[0], bad: true };
                const s = S();
                if (row.what === "spot") { const g = GO()[row.pick || 0]; return { go: [g[0], g[1], g[2], g[3], 2] }; }
                if (row.what === "shadow") {
                    const sw = shadowWindow(day());
                    if (!sw) return { say: TK.kod.ok[1], bad: true };
                    const S0 = T.api("Survival"); if (S0 && S0.calmWeather) S0.calmWeather();
                    $gameSystem.setDayNightHour((sw[0] + sw[1]) / 2);
                    return { say: Watki.wstaw(TK.kod.ok[2], { "1": sw[0].toFixed(2), "2": sw[1].toFixed(2), "3": ((sw[0] + sw[1]) / 2).toFixed(2) }) };
                }
                if (row.what === "key") { if (count(ITEM.klucz) < 1) give(ITEM.klucz, 1); s.key = s.key || day(); sync(); return { say: TK.kod.ok[3] }; }
                if (row.what === "cards") { for (let n = 1; n <= 6; n++) giveCard(n); return { say: Watki.wstaw(TK.kod.ok[4], { "1": cardsFound() }) }; }
                if (row.what === "eagle") {
                    const O = T.api("Orzel"), L = T.api("Orzel_Lot");
                    if (!O || !O.forceStage) return { say: TK.kod.ok[5], bad: true };
                    O.forceStage(5);
                    O.state().bond = Math.max(O.state().bond || 0, 80);
                    O.state().st = O.maxSt ? O.maxSt() : 100;
                    O.state().name = O.state().name || TK.kod.ok[6];
                    if (L && L.mount) L.mount();
                    return { say: Watki.wstaw(TK.kod.ok[8], { "1": L && L.flying && L.flying() ? TK.kod.ok[7] : "" }) };
                }
                if (row.what === "storm") { return { say: revealWreck() ? Watki.wstaw(TK.kod.ok[9], { wreck: s.wreck }) : TK.kod.ok[10] }; }
                if (row.what === "tide") { const W = T.api("Wyspa"); if (W && W.forceTide) W.forceTide("low"); sync(); return { say: TK.kod.ok[11] }; }
                if (row.what === "act2") {
                    const st = T.api("Story"), ss = st && st.state ? st.state() : null;
                    if (ss) { ss.paid = ss.debt || ss.paid; ss.done = ss.done || day(); }
                    $gameSwitches.setValue(16, true);
                    autoChecks();
                    return { say: ss ? TK.kod.ok[12] : TK.kod.ok[13] };
                }
                if (row.what === "grove") { $gameSystem.setDayNightHour(Math.round(sunset(day()) * 100) / 100); return { go: [TK.kod.ok[14], 120, D.GROVE.centre[0], D.GROVE.centre[1] + 1, 8] }; }
                return null;
            } });
    })();

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    // (2026-10-22, integration) the epilogue after the Heart: Underground.js asks Zakon.epilogue(kind, w) - a line, a list or null
    function epilogue() {
        if (!has() || !D.EPILOG) return null;
        const s = S(), out = [];
        if (s.chamber && s.chamber.been) out.push(D.EPILOG.chamber);
        if (s.grove && s.grove.done) out.push(D.EPILOG.grove);
        return out;
    }
    window.Zakon = T.register(PLUGIN, { epilogue,
        VERSION, PKG: "D", DATA: D, ready: true, state: () => S(), act: actCall, sync, buildMap, shadowHits, shadowWindow, shadowNow,
        giveCard, readCard, cardsFound, cardsRead, revealWreck, raining, tideLow, herbReady, kleofasTalk, grabarzTalk, ansgarTalk,
        ravens: () => birds.map(b => ({ key: b.key, ri: b.ri, x: b.x, y: b.y, z: b.z, state: b.state })), ravensAt, feedRavens,
        grove: () => Object.assign({}, S().grove, { window: groveWindow(), sunset: sunset(day()) }), finishGrove,
        fog: () => (fog ? { alpha: fog.alpha, visible: fog.layer.visible } : null), thoughts: () => w.mysli().map(t => t.text), hush: () => { w.thoughtsReset(); return 0; },
        work: () => (again ? again.def.key : null), MAPS
    });
})();
