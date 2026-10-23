//=============================================================================
// Lowy.js
//=============================================================================
// PACZKA B „Zwierzęta i łowy” (docs/rozszerzenia/PLAN.md, punkt 5) - the engine of: the wolves' den (Map023), the bear's den (Map013),
// the boars' wallow (Map021), the salt lick with the hide (Map004), the fixed camps of the robbers (Map021) and the Black Eyes' hunters
// (Map023), the Lord's game park with its gamekeeper and the hedge's gap (Map024), the strays of the Ług farm (Map168), the soldiers'
// shooting range (Map162). Data: Lowy_Data.js. Event ids 2300-2499 (owner "Lowy"), state Tawerna.state("lowy"), the F9 rows through
// Okolice.f9.add, the places through Okolice.registerSpots("B", ...), the discoveries through Okolice.discoverable / discover.
// How it reaches the other systems without touching them (the plan's contract):
//   - the animals are Hunting.js's (spawn / spawnPack / dropCarcass) with flags of their own: _lowDen, _lowPup, _lowGawra, _lowWallow,
//     _lowLick, _lowPark; _noClash (Starcia.js leaves them be), _noDog (Dog.js's findPrey skips them - the one marked line in Dog.js),
//     _summoned (they stay out of their hours); the friendly pack and the calm bear by wrappers of Game_Animal (thinkWolf, update), the
//     park's bounds by its isMapPassable; the mud and the hide by a wrapper of Combat.perk("sneak") / Combat.aimSteady (Hunting asks
//     them through the API), the woken bear's rage by a wrapper of Combat.hitPlayer
//   - the camps are Humans.js's (Humans.fixedCamp - the one marked block in Humans.js)
//   - the gamekeeper is a TownLife resident (2905, Lowy_Data); his and the others' extra talk by Tawerna.talk.takeover
//   - the quests are TownQuests' (K59-K62, D32-D33 in Lowy_Data; their custom steps' FX here), the board's contracts QuestBoard's
//   - the strays are characters of this file (like Livestock.js's animals: not events, not saved - their state is)

/*:
 * @target MZ
 * @plugindesc [paczka B] Zwierzęta i łowy: wilcza nora, gawra, błotnisko dzików, lizawka, stałe obozy, zwierzyniec Lorda z gajowym, zbłąkane zwierzęta, strzelnica. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Okolice
 *
 * @help
 * ============================================================================
 * Lowy.js - silnik paczki B „Zwierzęta i łowy”
 * ============================================================================
 * Plan i kontrakt: docs/rozszerzenia/PLAN.md (punkt 5). Dane: Lowy_Data.js.
 *
 * WILCZA NORA (Skraj lasu): za dnia przy norze śpi wataha, wiosną i latem
 *   bawią się szczenięta. Rozbij watahę (zabij dorosłe) - albo w trzech
 *   różnych dniach zostaw przy norze surowe mięso: wataha stanie się
 *   przyjazna (wilki z Leśnej drogi i Skraju lasu nie atakują cię), a raz
 *   w tygodniu przy norze leży zając. Zadanie K59.
 * GAWRA (Góry): od wiosny do jesieni niedźwiedź przy gawrze. Zimą śpi
 *   w środku - zajrzysz, to go obudzisz (wściekły: minutę bije mocniej).
 *   Ubity: skóra i pazur; gawra pusta do wiosny. Zadanie D33 (Akt II).
 * BŁOTNISKO (Leśna droga): rano i wieczorem dziki. Wejdź w błoto: przez
 *   2 godziny zwierzęta wyczują cię później. Z dzika z błotniska czasem kieł.
 * LIZAWKA (Łąka): bryła soli ściąga jelenie na 6 dni (świt i zmierzch).
 *   W zasiadce obok zwierzęta wyczują cię później, a łuk trzymasz pewniej.
 *   Wiosną bywa przy niej zrzucone poroże. Zadanie K60.
 * OBOZY: rabusie przy Leśnej drodze (nocą, ze zleceniem co noc), obcy
 *   myśliwi Czarnych Oczu na Skraju lasu (Akt II, za dnia).
 * ZWIERZYNIEC LORDA (za wyłomem w żywopłocie dworu): jelenie i dziki,
 *   gajowy Gniewko Bór. Zabite zwierzę bez zezwolenia to kłusownictwo:
 *   grzywna 40 / 60 / 80 G, za trzecim razem wyłom zarasta cierniem na
 *   7 dni. Zadanie D32 (sidła i kłusownik Rysiek).
 * ZBŁĄKANE ZWIERZĘTA (Spalona zagroda): Krasula, owca, dwie kury. Powróz
 *   (lina) na krowę i owcę, kury łapiesz rękami. Odprowadź je do zagrody
 *   Ługów albo do swojej zagrody. Zadanie K62.
 * STRZELNICA (Garnizon): runda 5 strzał ćwiczebnych z łuku. Co siódmy
 *   dzień 10-12 zawody (24 / 30 / 36 pkt). Zadanie K61.
 * F9 (Wyspa i fabuła): miejsca, wataha, przyjaźń, niedźwiedź, sól, obozy,
 *   kłusownictwo, zawody, zbłąkane zwierzęta.
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("lowy");   // (the words of this file: js/teksty/lowy.txt, kod.*)

    const PLUGIN = "Lowy";
    const T = window.Tawerna;
    if (!T) throw new Error("Lowy.js: brak TawernaCore.js");
    const D = window.LowyData;
    if (!D || !D.ready) throw new Error("Lowy.js: Lowy_Data.js musi stać wyżej na liście wtyczek");
    const VERSION = "1.1.0";
    const { ITEM, IDS, NORA, GAWRA, BLOTO, LIZAWKA, OBOZY, ZWIERZYNIEC: PARK, ZBLAKANE, STRZELNICA: RANGE, TX, TALK } = D;

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    const OK = () => T.api("Okolice") || window.Okolice;
    const H = () => T.api("Hunting");
    const HP = () => T.api("Hunting_parts");
    const TQ = () => T.api("TownQuests");
    const TLf = () => T.api("TownLife");
    const QBd = () => T.api("QuestBoard");
    const Hm = () => T.api("Humans");
    const day = () => T.time.day();
    const hour = () => T.time.hour();
    const clock = () => day() * 24 + hour();
    const season = d => T.time.season(d === undefined ? day() : d);
    const year = d => T.time.year(d === undefined ? day() : d);
    const mapId = () => (window.$gameMap ? $gameMap.mapId() : 0);
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
    const heroDist = (x, y) => (window.$gamePlayer ? dist($gamePlayer.x, $gamePlayer.y, x, y) : 99);
    const inHours = (h, ranges) => ranges.some(([a, b]) => h >= a && h < b);
    const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] !== undefined ? o[k] : m));
    const item = id => (window.$dataItems ? $dataItems[id] : null);
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const has = id => count(id) > 0;
    const gain = (id, n) => { if (item(id)) $gameParty.gainItem(item(id), n === undefined ? 1 : n); };
    const lose = (id, n) => { if (item(id)) $gameParty.loseItem(item(id), n === undefined ? 1 : n, false); };
    const se = (name, volume, pitch) => T.audio && T.audio.se && T.audio.se(name, { volume: volume || 80, pitch: pitch || 100 });
    const popup = (text, o) => T.popup(text, o || {});
    const need = (icon, text) => T.popup.need(icon, text);
    const say = (ch, text, frames) => T.call("SpeechBubbles", "say", ch, text, frames || 200);
    const warn = m => { try { console.warn("[Lowy] " + m); } catch (e) { /* (no console) */ } };
    const actTwo = () => {
        const W = T.api("Wyspa");
        try { if (W && W.actTwo) return !!W.actTwo(); } catch (e) { /* (fall through) */ }
        return !!T.call("TownQuests", "actTwo");
    };
    const tqFlag = name => { const q = TQ(); try { return !!(q && q.state && q.state().flags && q.state().flags[name]); } catch (e) { return false; } };
    const setTqFlag = name => { const q = TQ(); try { if (q && q.state) q.state().flags[name] = day(); } catch (e) { /* (no quests) */ } };
    const qRec = id => { const q = TQ(); try { return q && q.rec ? q.rec(id) : null; } catch (e) { return null; } };
    const qStep = id => { const r = qRec(id); return r && r.s === "active" ? r.step : -1; };
    const qDone = id => { const r = qRec(id); return !!r && r.s === "done"; };
    const opinion = (n, why) => T.call("TownQuests", "addOpinion", n, why);
    const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const animals = () => { const Hn = H(); return Hn ? Hn.animals || [] : []; };
    const removeAnimal = a => { const Hn = H(); if (Hn && Hn.removeAnimal && a && !a._dead) Hn.removeAnimal(a); };
    const passable = (x, y) => window.$gameMap && $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f);
    const freeCell = (x, y) => passable(x, y) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough())
        && !animals().some(a => !a._dead && a._x === x && a._y === y) && !(T.api("Farming") && T.api("Farming").buildingAt && T.api("Farming").buildingAt(x, y));
    const inRect = (x, y, r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    const inPark = (x, y) => PARK.areas.some(a => x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1);
    const sceneMap = () => SceneManager._scene instanceof Scene_Map;
    const busy = () => !window.$gameMap || $gameMap.isEventRunning() || !sceneMap() || ($gameMessage && $gameMessage.isBusy());

    // ------------------------------------------------------------------
    // Saved state (TawernaCore: _tw.lowy)
    // ------------------------------------------------------------------
    const DEF = () => ({
        den: { meat: [], friendly: false, betrayed: false, emptyUntil: 0, choice: null, giftDay: -99, giftSeen: -1, forcePups: -1, seenBundles: [] },
        bear: { deadYear: 0, wokeDay: -1, forceWinter: -1 },
        wallow: { msg: -99, windows: {} },
        lick: { until: 0, ever: false, watched: false, trophy: false, antlerKey: -1, windows: {} },
        camps: { forceRab: -1, forceCzo: -1, marched: "" },
        czo: { choice: null, bearDead: false, resolved: null, paid: false },
        park: { seen: false, count: 0, shutUntil: 0, permitDay: -99, pending: [], wanted: null, legal: 0, fines: 0 },
        d32: { taken: [false, false, false], met: false, choice: null },
        strays: { done: {}, led: null, pos: {}, milkDay: -99 },
        range: { best: 0, wins: 0, silver: false, beatBest: false, contestDay: -1, forceContest: -1, rounds: 0, last: null },
        arrow: { rotmistrz: false, pustelnik: false },
        trophies: []
    });
    const store = T.state.define("lowy", DEF, { version: 1, owner: PLUGIN });
    // (a save from an older version of the package: the missing parts filled in - once for each state object; S() is asked every frame)
    const filled = new WeakSet();
    function S() {
        const s = store();
        if (filled.has(s)) return s;
        const d = DEF();
        for (const k of Object.keys(d)) {
            if (s[k] === undefined) s[k] = d[k];
            else if (d[k] && typeof d[k] === "object" && !Array.isArray(d[k])) for (const kk of Object.keys(d[k])) if (s[k][kk] === undefined) s[k][kk] = d[k][kk];
        }
        filled.add(s);
        return s;
    }

    // ------------------------------------------------------------------
    // The places and the discoveries (Okolice)
    // ------------------------------------------------------------------
    const dayTime = () => hour() >= NORA.dayHours[0] && hour() < NORA.dayHours[1];
    function campLive(key) {
        const c = OBOZY[key], Hn = Hm();
        if (!c || mapId() !== c.map || !Hn || !Hn.campHere) return false;
        const camp = Hn.campHere();
        return !!(camp && camp.fixed);
    }
    (function registerPlaces() {
        const O = OK();
        if (!O) { warn("brak Okolice.js - miejsca i odkrycia niezarejestrowane"); return; }
        O.registerSpots("B", D.SPOTS);
        for (const d of D.DISCOVER) {
            const when = d.day ? () => dayTime() : d.camp ? () => campLive(d.camp) : undefined;
            O.discoverable({ key: d.key, pkg: "B", map: d.map, x: d.x, y: d.y, name: d.name, text: d.text, icon: d.icon, xp: d.xp, near: d.near, when });
        }
    })();
    const found = key => { const O = OK(); return !!(O && O.isFound && O.isFound(key)); };

    // ------------------------------------------------------------------
    // The events (Tawerna.inject, 2300-2499). A page may carry _lowWhen: it shows only while WHEN[...] says so (Game_Event's
    // meetsConditions below); the map is refreshed when one of them changes
    // ------------------------------------------------------------------
    const img = (name, dir, pattern) => ({ characterName: name, direction: dir || 2, pattern: pattern === undefined ? 1 : pattern, characterIndex: 0 });
    const scr = js => [{ code: 355, indent: 0, parameters: [js] }];
    function page(o) { return OK().page(o); }
    function pageW(when, o) { const p = OK().page(o); p._lowWhen = when; return p; }
    const hidden = () => page({ priority: 0, through: true });
    const ev = (id, name, x, y, pages, note) => OK().event(id, name, x, y, pages, (note || "") + "<Lowy:" + id + ">");
    const look = what => scr("Lowy.look(this, " + JSON.stringify(what) + ")");
    const BUILD = {
        23: () => [
            ev(IDS.nora, TK.kod.n23[0], NORA.x, NORA.y, [page({ image: img("!$Low_Nora"), list: look("nora") })], "<Occupy:left=1,right=1,up=1>"),
            ev(IDS.czoNamiot, TK.kod.n23[1], OBOZY.czo.tent[0], OBOZY.czo.tent[1], [hidden(), pageW("campCzo", { image: img("!$Mt_Tent"), list: look("namiot") })])
        ],
        13: () => [
            ev(IDS.gawra, "Gawra", GAWRA.ev[0], GAWRA.ev[1], [page({ image: img("!$Low_Gawra"), list: look("gawra") })]),
            ev(IDS.gawraBok, TK.kod.n13[0], GAWRA.side[0], GAWRA.side[1], [page({ list: look("gawra") })])
        ],
        21: () => [
            ev(IDS.bloto, TK.kod.n21[0], BLOTO.ev[0], BLOTO.ev[1], [page({ image: img("!$Low_Bloto"), priority: 0, through: true, list: look("bloto") })]),
            ev(IDS.rabNamiot, TK.kod.n21[1], OBOZY.rabusie.tent[0], OBOZY.rabusie.tent[1], [hidden(), pageW("campRab", { image: img("!$Mt_Tent"), list: look("namiotRab") })])
        ],
        4: () => [
            ev(IDS.lizawka, "Lizawka", LIZAWKA.x, LIZAWKA.y, [page({ image: img("!$Low_Lizawka", 2), list: look("lizawka") }),
                pageW("lickOn", { image: img("!$Low_Lizawka", 4), list: look("lizawka") })]),
            ev(IDS.zasiadka, "Zasiadka", LIZAWKA.hide[0], LIZAWKA.hide[1], [page({ image: img("!$Low_Zasiadka"), priority: 2, through: true })]),
            ev(IDS.poroze, TK.kod.n4[0], LIZAWKA.antler[0], LIZAWKA.antler[1], [hidden(), pageW("antler", { image: img("!$Low_Poroze"), list: scr("Lowy.pickAntler(this)") })])
        ],
        24: () => {
            const sw = { switch1Valid: true, switch1Id: D.SW_WYLOM };
            const out = [
                ev(IDS.wylomL, TK.kod.n24[0], PARK.gap[0][0], PARK.gap[0][1], [hidden(), page({ cond: sw, list: look("ciernie") })]),
                ev(IDS.wylomP, TK.kod.n24[1], PARK.gap[1][0], PARK.gap[1][1], [page({ image: img("!$Low_Wylom", 2), priority: 0, through: true }),
                    page({ cond: sw, image: img("!$Low_Wylom", 4), list: look("ciernie") })]),
                ev(IDS.lesniczowka, TK.kod.n24[2], PARK.hut[0], PARK.hut[1], [page({ image: img("!$Low_Lesniczowka"), list: look("lesniczowka") })], "<Occupy:left=2,right=2,up=2>"),
                ev(IDS.pasnik, TK.kod.n24[3], PARK.feeder[0], PARK.feeder[1], [page({ image: img("!$Low_Pasnik"), list: look("pasnik") })], "<Occupy:left=1>"),
                ev(IDS.rysiek, TK.kod.n24[4], PARK.rysiek[0], PARK.rysiek[1], [hidden(), pageW("rysiek", { image: img("$Npc_Klusownik", 4, 1), list: scr("Lowy.rysiekTalk(this)") })])
            ];
            PARK.snares.forEach(([x, y], i) => out.push(ev(IDS.sidla[i], TK.kod.n24[5], x, y, [hidden(), pageW("sidlo" + i, { image: img("!$Low_Sidla"), list: scr("Lowy.takeSnare(this, " + i + ")") })])));
            return out;
        },
        162: () => {
            // a target: its picture below the characters (an arrow flies through to its face) and an empty blocking event on the same
            // cell (the hero does not walk through it; Hunting's arrows stop only at events with a picture)
            const out = [];
            RANGE.targets.forEach((t, i) => {
                out.push(ev(IDS.tarcze[i], Watki.wstaw(TK.kod.n162[0], { d: t.d }), t.x, t.y, [page({ image: img("!$Low_Tarcza"), priority: 0, list: look("tarcza" + i) })]));
                out.push(ev(IDS.tarczeBlok[i], Watki.wstaw(TK.kod.n162[0], { d: t.d }), t.x, t.y, [page({ list: look("tarcza" + i) })]));
            });
            out.push(ev(IDS.stojak, TK.kod.n162[1], RANGE.rack[0], RANGE.rack[1], [page({ image: img("!$Low_Stojak"), list: scr("Lowy.rangeMenu(this)") })]));
            RANGE.soldiers.forEach(([x, y], i) => out.push(ev(IDS.zolnierze[i], TK.kod.n162[2], x, y,
                [hidden(), pageW("drill", { image: img(i ? "$Npc_Zolnierz_B" : "$Npc_Zolnierz", 6, 1), directionFix: true, list: look("zolnierz") })])));
            return out;
        }
    };
    T.inject(Object.keys(BUILD).map(Number), { ids: D.IDS_RANGE, owner: PLUGIN, build: (data, id) => (BUILD[id] ? BUILD[id]() : []) });

    const WHEN = {
        campCzo: () => campLive("czo"),
        campRab: () => campLive("rabusie"),
        lickOn: () => lickActive(),
        antler: () => antlerShown(),
        sidlo0: () => snareShown(0), sidlo1: () => snareShown(1), sidlo2: () => snareShown(2),
        rysiek: () => rysiekShown(),
        drill: () => { const h = hour(); return h >= RANGE.drill[0] && h < RANGE.drill[1]; }
    };
    const _meets = Game_Event.prototype.meetsConditions;
    Game_Event.prototype.meetsConditions = function(pg) {
        if (!_meets.call(this, pg)) return false;
        if (pg && pg._lowWhen) {
            const f = WHEN[pg._lowWhen];
            try { return !!(f && f(this)); } catch (e) { return false; }
        }
        return true;
    };
    let whenSig = "";
    function refreshWhen(force) {
        if (!window.$gameMap || !BUILD[mapId()]) return;
        const sig = Object.keys(WHEN).map(k => { try { return WHEN[k]() ? 1 : 0; } catch (e) { return 0; } }).join("") + ($gameSwitches ? ($gameSwitches.value(D.SW_WYLOM) ? 1 : 0) : 0);
        if (force || sig !== whenSig) { whenSig = sig; $gameMap.requestRefresh(); }
    }

    // ------------------------------------------------------------------
    // The talk helpers (as in Kantor.js / Dwor.js): message pages with the speaker's bubble, choices, script calls back here
    // ------------------------------------------------------------------
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const HERO = { id: 0, name: "" };
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
    // the speakers a line may name with "@key: ": a resident (TownLife), the poacher by the snares, the hunters of the camp
    function speaker(key) {
        if (key === "rysiek") { const e = $gameMap.event(IDS.rysiek); return { id: e && mapId() === PARK.map ? IDS.rysiek : -1, name: TK.kod.speaker[0] }; }
        if (key === "czo") return { id: -1, name: OBOZY.czo.name };
        const L = TLf(), e = L && L.eventOf ? L.eventOf(key) : null, r = L && L.RESIDENTS ? L.RESIDENTS.find(x => x.key === key) : null;
        return { id: e && $gameMap.event(e.eventId()) === e ? e.eventId() : -1, name: r ? r.name : key };
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
    const act = (out, args, ind) => (out.push(C(355, ["Lowy.act(this, " + JSON.stringify(args) + ")"], ind)), out);
    // a list run inside the talking event, or by itself on the map (no event running)
    function runList(interp, list) {
        if (!list || !list.length) return false;
        if (interp && interp.setupChild) { interp.setupChild(list.concat([C(0, [])]), interp.eventId()); return true; }
        if (!window.$gameMap || $gameMap.isEventRunning()) return false;
        $gameMap._interpreter.setup(list.concat([C(0, [])]), 0);
        return true;
    }
    const heroLines = (arr, vars) => linesTo([], HERO, arr, vars);

    // ==================================================================
    // B1 THE WOLVES' DEN (Map023)
    // ==================================================================
    // the wolf cub: a species of its own (the wolf's sheet made small), no YIELD entry - nothing to dress
    (function addPup() {
        const Hn = H();
        if (Hn && Hn.SPECIES && !Hn.SPECIES.wolfPup) Hn.SPECIES.wolfPup = Object.assign({}, D.PUP);
        const Cb = T.api("Combat");
        if (Cb && Cb.KILL_XP && Cb.KILL_XP.wolfPup === undefined) Cb.KILL_XP.wolfPup = 2;
    })();
    let denSession = { killed: 0, spawned: false, resolved: false };
    const denEmpty = () => S().den.emptyUntil > day();
    const denAdults = () => animals().filter(a => a._lowDen && !a._dead && a.kind() === "wolf");
    const denPups = () => animals().filter(a => a._lowPup && !a._dead);
    const pupSeason = () => [0, 1].includes(season()) || S().den.forcePups === day();
    const friendOn = () => { const d = S().den; return !!d.friendly && !d.betrayed; };
    function isFriend(a) {
        return !!a && !a._dead && !a._qbBounty && !a._tqLeader && !a._lowHostile && a._kind === "wolf" && NORA.friendMaps.includes(mapId()) && friendOn();
    }
    function bountyNotice(tpl) {
        const Q = QBd();
        try { return Q && Q.active ? Q.active().find(n => n.tpl === tpl && n.state === "active") || null : null; } catch (e) { return null; }
    }
    function spawnBountyAt(tpl, at) {
        const Q = QBd(), n = bountyNotice(tpl);
        if (!Q || !n || !Q.spawnBounty) return null;
        if (animals().some(a => !a._dead && a._qbBounty === n.id)) return null;
        try { return Q.spawnBounty(n.id, at); } catch (e) { warn(Watki.wstaw(TK.kod.spawnBountyAt[0], { tpl: tpl, message: e.message })); return null; }
    }
    function markDen(a, leaderGoal) {
        a._lowDen = true;
        a._lowDenDay = true;
        a._summoned = true;
        a._noClash = true;
        a._goal = leaderGoal ? { x: NORA.rest[0] + rnd(-1, 1), y: NORA.rest[1] + rnd(0, 1), near: NORA.restNear } : null;
    }
    function spawnDen() {
        const Hn = H();
        if (!Hn || denSession.spawned) return;
        denSession.spawned = true;
        if (!denAdults().length) {
            let pack = null;
            if (!friendOn()) {   // (Szary Kieł's contract: he leads the den's pack - QuestBoard's own spawn, on the fixed cell)
                const b = spawnBountyAt("b_szary_kiel", NORA.bounty);
                if (b && b._pack) pack = b._pack;
            }
            if (!pack) pack = Hn.spawnPack ? Hn.spawnPack(NORA.rest[0], NORA.rest[1], NORA.adults) : null;
            if (pack) for (const m of pack.members) markDen(m, true);
        }
        if (pupSeason() && !denPups().length) {
            const n = NORA.pups[0] + Math.floor(hash(day(), 59) * (NORA.pups[1] - NORA.pups[0] + 1));
            const cells = [[64, 51], [66, 51], [65, 52], [63, 51], [67, 52], [64, 52], [66, 53]].filter(([x, y]) => freeCell(x, y));
            for (let i = 0; i < n && i < cells.length; i++) {
                const p = Hn.spawn("wolfPup", cells[i][0], cells[i][1]);
                if (!p) continue;
                p._lowPup = true; p._summoned = true; p._noClash = true; p._noDog = true; p._noAutoCombat = true;
                p._qbScale = NORA.pupScale;
                p._goal = { x: NORA.x + rnd(-1, 1), y: NORA.y + 2, near: 2 };
            }
        }
    }
    // dusk: the cubs go into the den, the grown ones go hunting as the night's wolves (Hunting's own)
    function denNight() {
        for (const p of denPups()) removeAnimal(p);
        for (const a of denAdults()) if (a._lowDenDay) { a._lowDenDay = false; a._summoned = false; a._noClash = false; a._goal = null; }
        denSession.spawned = false;
    }
    function denTick() {
        if (mapId() !== NORA.map) return;
        const d = S().den;
        if (denEmpty()) { for (const p of denPups()) removeAnimal(p); return; }
        if (dayTime()) spawnDen(); else denNight();
        // the pack broken: every grown wolf of the den killed while the hero is here
        if (!denSession.resolved && denSession.killed > 0 && !denAdults().length && d.choice !== "zostawione") denBroken();
        meatTick();
        giftTick();
        // a friendly wolf (or a cub) hit by the hero: the pack will not forget it
        if (friendOn() && animals().some(a => (isFriend(a) || a._lowPup) && a._heroHitAt)) betray();
    }
    function denBroken() {
        const d = S().den;
        denSession.resolved = true;
        d.choice = d.choice || "rozbita";
        d.emptyUntil = day() + NORA.emptyDays;
        const pups = denPups();
        if (pups.length) {
            popup(TX.pupsFled, { icon: 481, color: "#cfe6a8" });
            for (const p of pups) { p._alarm = 600; p._goal = null; p._summoned = false; }
            setTimeout(() => { for (const p of denPups()) removeAnimal(p); }, 1500);
        }
        if (!qDone("K59")) T.call("TownQuests", "finish", "K59", { gold: 60, xp: 120, note: [TK.kod.denBroken[0], TK.kod.denBroken[1]] });
    }
    function befriend() {
        const d = S().den;
        d.friendly = true;
        d.choice = "zostawione";
        popup(TX.denFriend, { top: true, color: "#9ff0a8", sub: TX.denFriendSub });
        if (!qDone("K59")) T.call("TownQuests", "finish", "K59", { xp: 150, note: [TK.kod.befriend[0], TK.kod.befriend[1]] });
    }
    function betray() {
        const d = S().den;
        if (d.betrayed) return;
        d.betrayed = true;
        popup(TX.betrayed, { top: true, color: "#ff9f8f" });
        for (const a of animals()) if (a.kind && a.kind() === "wolf") a._lowHostile = true;
    }
    const isMeat = id => D.MEATS.includes(Number(id));
    function denBundles() {
        const Dr = T.api("Drops");
        if (!Dr || !Dr.list) return [];
        return Dr.list().filter(b => b.map === NORA.map && dist(b.x, b.y, NORA.x, NORA.y) <= NORA.meatR + 0.5 && Object.keys(b.items || {}).some(isMeat));
    }
    // meat left by the den: when the hero has stepped back (or on a later visit), a wolf takes a piece - one day counted
    function meatTick() {
        const d = S().den;
        if (d.choice === "rozbita" || d.betrayed) return;
        const list = denBundles();
        for (const b of list) if (!d.seenBundles.includes(b.id)) { d.seenBundles.push(b.id); if (d.seenBundles.length > 20) d.seenBundles.shift(); if (!d.meat.includes(day())) popup(TX.meatLeft, { icon: 94 }); }
        if (!list.length || d.meat.includes(day())) return;
        if (heroDist(NORA.x, NORA.y) < 5) return;
        const b = list[0], id = Object.keys(b.items).find(isMeat), Dr = T.api("Drops");
        if (!id || !Dr || !Dr.take) return;
        if (!Dr.take(b.id, Number(id), 1)) return;
        d.meat.push(day());
        d.meat = Array.from(new Set(d.meat)).sort((a, c) => a - c);
        const n = Math.min(NORA.meatDays, d.meat.length);
        popup(fill(TX.meatTaken, { n }), { icon: 94, color: "#cfe6a8" });
        se("Wolf", 40, 120);
        if (n >= NORA.meatDays && !d.friendly && d.choice !== "rozbita") befriend();
    }
    function giftTick() {
        const d = S().den, Hn = H();
        if (!friendOn() || !Hn || !Hn.dropCarcass) return;
        if (day() - d.giftDay >= NORA.giftEvery && dayTime()) {
            d.giftDay = day();
            Hn.dropCarcass("rabbit", NORA.gift[0] + 0.5, NORA.gift[1] + 0.5, 2);
        }
        if (d.giftDay === day() && d.giftSeen !== day() && heroDist(NORA.gift[0], NORA.gift[1]) <= 4) { d.giftSeen = day(); popup(TX.gift, { icon: 94, color: "#9ff0a8" }); }
    }
    function denKilled(a, e) {
        if (a._lowPup) { if (friendOn()) betray(); return; }
        if (a._lowDen && e.mapId === NORA.map) denSession.killed++;
    }

    // ==================================================================
    // B2 THE BEAR'S DEN (Map013)
    // ==================================================================
    let bearSession = { spawned: false, snoreT: 0 };
    const winter = () => season() === 3 || S().bear.forceWinter === day();
    const bearDeadNow = () => { const b = S().bear; return !!b.deadYear && year() <= b.deadYear && !(season() === 0 && year() > b.deadYear); };
    const gawraBear = () => animals().find(a => a._lowGawra && !a._dead) || null;
    function spawnBear(raging) {
        const Hn = H();
        if (!Hn || gawraBear()) return gawraBear();
        const b = Hn.spawn("bear", GAWRA.home[0], GAWRA.home[1]);
        if (!b) return null;
        b._lowGawra = true;
        b._home = { x: GAWRA.home[0], y: GAWRA.home[1] };
        if (raging) {
            b._summoned = true;
            b._lowRage = Graphics.frameCount + GAWRA.rageSec * 60;
            b._aware = 1;
            if (Hn.bearEngage) Hn.bearEngage(b);
        }
        return b;
    }
    function gawraTick() {
        if (mapId() !== GAWRA.map) return;
        const h = hour();
        if (h < GAWRA.hours[0] || h >= GAWRA.hours[1]) bearSession.spawned = false;   // (the night: tomorrow it comes out again)
        else if (!bearDeadNow() && !winter() && !bearSession.spawned) { bearSession.spawned = true; spawnBear(false); }
        // one bear by the den: the map's random ones are sent off while it lives
        const own = gawraBear();
        if (own) for (const a of animals()) if (a !== own && !a._dead && a.kind() === "bear" && !a._qbBounty && !a._engaged && dist(a._x, a._y, GAWRA.home[0], GAWRA.home[1]) < GAWRA.oneR) removeAnimal(a);
        // winter: it sleeps inside, snoring
        if (winter() && !bearDeadNow() && S().bear.wokeDay !== day() && heroDist(GAWRA.home[0], GAWRA.home[1]) <= GAWRA.snoreR) {
            if (--bearSession.snoreT <= 0) { bearSession.snoreT = 8; se("Breath", Math.round(70 - 8 * heroDist(GAWRA.home[0], GAWRA.home[1])), 50); if (Math.random() < 0.3) popup(TX.snore, { icon: 0, color: "#cfd6de" }); }
        }
    }
    function wakeBear() {
        const b = S().bear;
        b.wokeDay = day();
        const bear = spawnBear(true);
        se("Growl", 90, 70);
        $gameScreen.startShake(4, 6, 20);
        popup(TX.woke, { top: true, color: "#ff9f8f", sub: TX.wokeSub });
        return bear;
    }
    function gawraKilled(a, e) {
        const b = S().bear;
        b.deadYear = year();
        trophy(e, ITEM.pazur, "bear");
        if (S().czo.choice === "help" && !S().czo.resolved) { S().czo.bearDead = true; refreshQuest(); }
    }
    // D33 "przegnani": the den's bear does not go for the hero near its den while he walks (not running)
    // the woken bear's blows: +20% while its rage lasts (Combat.hitPlayer's wrapper below)
    const rageOf = o => (o && o.attacker && o.attacker._lowRage > Graphics.frameCount && o.damage > 0 ? Object.assign({}, o, { damage: Math.round(o.damage * GAWRA.rageMul) }) : o);
    const heroRunning = () => !!($gamePlayer && $gamePlayer.isDashing && $gamePlayer.isDashing());
    const bearCalm = a => a._lowGawra && S().czo.resolved === "drive" && !a._heroHitAt && !heroRunning() && heroDist(GAWRA.home[0], GAWRA.home[1]) <= GAWRA.calmR;

    // ==================================================================
    // B3 THE BOARS' WALLOW (Map021)
    // ==================================================================
    let wallowSession = { window: "" };
    const muddy = () => !!($gameSystem && typeof $gameSystem.hasBuff === "function" && $gameSystem.hasBuff("ubloceny"));
    (function defineMud() {
        const Sv = T.api("Survival") || window.Survival;
        if (Sv && Sv.defineBuff) Sv.defineBuff("ubloceny", { name: "Ubłocony", icon: D.ICON.kiel, desc: "pachniesz jak las: zwierzęta wyczują cię później" });
    })();
    const windowKey = ranges => { const h = hour(), i = ranges.findIndex(([a, b]) => h >= a && h < b); return i < 0 ? "" : day() + ":" + i; };
    const mudCells = () => { const out = []; for (let y = BLOTO.y; y < BLOTO.y + BLOTO.h; y++) for (let x = BLOTO.x; x < BLOTO.x + BLOTO.w; x++) out.push([x, y]); return out; };
    function cellsAround(cx, cy, lo, hi, n, avoidHero) {
        const out = [];
        for (let tries = 0; tries < 400 && out.length < n; tries++) {
            const ang = Math.random() * Math.PI * 2, r = lo + Math.random() * (hi - lo), x = Math.round(cx + Math.cos(ang) * r), y = Math.round(cy + Math.sin(ang) * r);
            if (!freeCell(x, y) || out.some(c => c[0] === x && c[1] === y)) continue;
            if (avoidHero && heroDist(x, y) < avoidHero) continue;
            out.push([x, y]);
        }
        return out;
    }
    function wallowTick() {
        if (mapId() !== BLOTO.map) return;
        const s = S().wallow, key = windowKey(BLOTO.hours), Hn = H();
        if (key && key !== wallowSession.window && !s.windows[key] && Hn) {
            wallowSession.window = key;
            s.windows = { [key]: true };
            const n = BLOTO.boars[0] + Math.floor(Math.random() * (BLOTO.boars[1] - BLOTO.boars[0] + 1));
            const mud = mudCells();
            for (const [x, y] of cellsAround(BLOTO.x + 1.5, BLOTO.y + 1, 8, 13, n, 7)) {
                const b = Hn.spawn("boar", x, y);
                if (!b) continue;
                const g = pick(mud);
                b._lowWallow = true; b._noClash = true; b._goal = { x: g[0], y: g[1], near: 0.8 };
            }
            const ryj = spawnBountyAt("b_czarny_ryj", BLOTO.bounty);
            if (ryj) { ryj._lowWallow = true; ryj._noClash = true; ryj._goal = { x: BLOTO.bounty[0], y: BLOTO.bounty[1], near: 0.8 }; }
        }
        // wallowing boars keep coming back to the mud now and then
        for (const a of animals()) if (a._lowWallow && !a._dead && !a._goal && !a._engaged && Math.random() < 0.05) { const g = pick(mudCells()); a._goal = { x: g[0], y: g[1], near: 0.8 }; }
        // the hero in the mud
        if ($gamePlayer && inRect($gamePlayer.x, $gamePlayer.y, BLOTO)) {
            if (typeof $gameSystem.addBuff === "function") $gameSystem.addBuff("ubloceny", BLOTO.muddyHours);
            if (clock() - s.msg >= BLOTO.muddyHours) { s.msg = clock(); popup(TX.muddy, { icon: D.ICON.kiel, color: "#d9b38c" }); popup(TX.muddySub, { top: true, color: "#d9b38c" }); }
        }
    }

    // ==================================================================
    // B4 THE SALT LICK AND THE HIDE (Map004)
    // ==================================================================
    let lickSession = { window: "", hideMsg: false };
    const lickActive = () => S().lick.until > day();
    const inHide = () => mapId() === LIZAWKA.map && $gamePlayer && $gamePlayer.x === LIZAWKA.hide[0] && $gamePlayer.y === LIZAWKA.hide[1];
    const antlerKey = () => year() * 4 + season();
    const antlerShown = () => mapId() === LIZAWKA.map && season() === 0 && S().lick.ever && S().lick.antlerKey !== antlerKey();
    const lickDeer = () => animals().filter(a => a._lowLick && !a._dead);
    function lickTick() {
        if (mapId() !== LIZAWKA.map) return;
        const s = S().lick, Hn = H(), key = windowKey(LIZAWKA.hours);
        if (lickActive() && key && key !== lickSession.window && !s.windows[key] && Hn) {
            lickSession.window = key;
            s.windows = { [key]: true };
            const n = LIZAWKA.deer[0] + Math.floor(Math.random() * (LIZAWKA.deer[1] - LIZAWKA.deer[0] + 1));
            for (const [x, y] of cellsAround(LIZAWKA.x, LIZAWKA.y, 6, LIZAWKA.r, n, 5)) {
                const d = Hn.spawn("deer", x, y);
                if (!d) continue;
                d._lowLick = true; d._noDog = true; d._noClash = true;
                d._goal = { x: LIZAWKA.x, y: LIZAWKA.y + 1, near: 1.2, face: true };
                d._lickT = rnd(LIZAWKA.lick[0], LIZAWKA.lick[1]);
            }
        }
        for (const d of lickDeer()) {
            const at = dist(d._x, d._y, LIZAWKA.x, LIZAWKA.y) <= 1.6;
            if (at && !d._lowLeaving) {
                d._lickT -= 30;
                if (d._lickT <= 0) {
                    d._lowLeaving = true;
                    const [c] = cellsAround(LIZAWKA.x, LIZAWKA.y, 12, 16, 1, 0);
                    d._goal = c ? { x: c[0], y: c[1], near: 1 } : null;
                }
                if (inHide() && inHours(hour(), [LIZAWKA.hours[0]])) { if (!s.watched) { s.watched = true; refreshQuest(); } }
            }
            if (d._lowLeaving && (heroDist(d._x, d._y) > 14 || !d._goal)) removeAnimal(d);
        }
        if (inHide()) { if (!lickSession.hideMsg) { lickSession.hideMsg = true; popup(TX.hideIn, { icon: 0, color: "#cfe6a8" }); } }
        else lickSession.hideMsg = false;
    }
    function putSalt() {
        if (!has(ITEM.sol)) { need(D.ICON.sol, TX.lickNeed); return false; }
        lose(ITEM.sol, 1);
        const s = S().lick;
        s.until = day() + LIZAWKA.days;
        s.ever = true;
        s.windows = {};
        lickSession.window = "";
        se("Equip1", 60, 90);
        popup(TX.lickSet, { icon: D.ICON.sol, color: "#9ff0a8" });
        refreshWhen(true);
        refreshQuest();
        return true;
    }

    // ==================================================================
    // B5 THE FIXED CAMPS (Humans.fixedCamp)
    // ==================================================================
    const nightKey = () => { const Hn = Hm(); return Hn && Hn.nightKey ? Hn.nightKey() : day(); };
    function rabusieWanted() {
        const c = S().camps;
        if (c.forceRab === day() || c.forceRab === day() - 1) return true;
        if (bountyNotice(D.TEMPLATES.oboz.id)) return true;
        return hash(nightKey(), 21) < 1 / OBOZY.rabusie.every;
    }
    function czoWanted() {
        const c = S().camps, h = hour(), H2 = OBOZY.czo.hours;
        if (!(h >= H2[0] && h < H2[1])) return false;
        if (c.forceCzo === day()) return true;
        return actTwo() && !S().czo.resolved;
    }
    (function registerCamps() {
        const Hn = Hm();
        if (!Hn || !Hn.fixedCamp) { warn("Humans.fixedCamp brak - stałe obozy wyłączone (blok paczki B w Humans.js)"); return; }
        const R = OBOZY.rabusie, Z = OBOZY.czo;
        Hn.fixedCamp(R.map, { x: R.x, y: R.y, size: R.size, tag: R.tag, when: rabusieWanted });
        Hn.fixedCamp(Z.map, { x: Z.x, y: Z.y, kinds: Z.kinds, looks: Z.looks, name: Z.name, tag: Z.tag, day: true, only: false, when: czoWanted, sack: Z.sack });
    })();
    // the robbers' nights when the charcoal kiln burns (package C): the ones awake go to the kiln (a raid on Zbych)
    function campTick() {
        if (mapId() !== OBOZY.rabusie.map) return;
        const Hn = Hm(), camp = Hn && Hn.campHere ? Hn.campHere() : null;
        if (!camp || !camp.fixed || S().camps.marched === String(camp.night)) return;
        let burning = false;
        try { burning = !!T.call("Ludzie", "mielerzBurning"); } catch (e) { burning = false; }
        if (!burning) return;
        S().camps.marched = String(camp.night);
        for (const h of Hn.list) if (h._campRef && camp.members.includes(h._campRef) && h._mode !== "sleep" && !h._engaged) Hn.march(h, OBOZY.rabusie.mielerz[0], OBOZY.rabusie.mielerz[1]);
    }
    // the board's camp contracts end on the camp cleared (whoever of its men was beaten, spared or robbed)
    function boardDone(tpl) {
        const n = bountyNotice(tpl);
        if (!n) return false;
        for (const r of n.req) if (r.k === "kill" || r.k === "bounty") r.got = r.n;
        return true;
    }
    T.on("campCleared", e => { if (e && e.mapId === OBOZY.rabusie.map) boardDone(D.TEMPLATES.oboz.id); }, { owner: PLUGIN });
    T.on("humansDone", e => {
        if (!e || e.tag !== OBOZY.czo.tag) return;
        boardDone(D.TEMPLATES.czo.id);
        const z = S().czo;
        if (!z.resolved) czoResolve("drive");
    }, { owner: PLUGIN });
    // the hunters' contract is on the board only while their camp may stand (Act II, D33 not decided)
    function boardTemplates() {
        const Q = QBd(), L = Q && Q.TEMPLATES;
        if (!L) return;
        const want = actTwo() && !S().czo.resolved, i = L.findIndex(t => t.id === D.TEMPLATES.czo.id);
        if (want && i < 0) L.push(D.TEMPLATES.czo);
        if (!want && i >= 0) L.splice(i, 1);
    }
    // the hunters keep to their fire while nothing is decided (D33's talk): they see the hero, they do not go for him - unless he
    // hits one of them or tells them to go (czoDrive)
    const czoPeace = h => h._tag === OBOZY.czo.tag && !h._engaged && S().czo.choice !== "drive" && !S().czo.resolved && !(h._band && h._band._heroAlarm);
    function hookMen() {
        const Hn = Hm(), GH = Hn && Hn.Game_Human;
        if (!GH || GH.prototype._lowHooked) return;
        GH.prototype._lowHooked = true;
        const _think = GH.prototype.think;
        GH.prototype.think = function() {
            if (czoPeace(this)) {
                this._aware = Math.min(this._aware || 0, 0.25);
                this._alarm = 0;
                if (this._mode === "alert" || this._mode === "wake") this.setMode(this._seat ? "sit" : "idle");
            }
            return _think.call(this);
        };
    }
    hookMen();
    // D33: the talk by the hunters' fire, the payment, the end
    function czoMen() {
        const Hn = Hm();
        return Hn ? Hn.list.filter(h => h._tag === OBOZY.czo.tag && !h._dead) : [];
    }
    function czoTick() {
        if (mapId() !== OBOZY.czo.map || !campLive("czo") || busy()) return;
        const z = S().czo, Z = OBOZY.czo, near = heroDist(Z.x, Z.y) <= 4.5, men = czoMen();
        if (!near || men.some(h => h._engaged)) return;
        if (qStep("D33") === 0 && !z.choice) {
            const out = linesTo([], speaker("czo"), TALK.czoMeet);
            choiceTo(out, [TK.kod.czoTick[0], TK.kod.czoTick[1]], [
                act([], ["czoHelp"]).concat(linesTo([], speaker("czo"), TALK.czoHelp)),
                linesTo([], speaker("czo"), TALK.czoDrive).concat(act([], ["czoDrive"]))], 1);
            runList(null, out);
        } else if (z.choice === "help" && z.bearDead && !z.paid) {
            z.paid = true;
            const out = linesTo([], speaker("czo"), TALK.czoPaid);
            act(out, ["czoPaid"]);
            runList(null, out);
        }
    }
    function czoResolve(how) {
        const z = S().czo;
        if (z.resolved) return;
        z.resolved = how;
        if (how === "drive") T.call("TownQuests", "finish", "D33", { opinion: 3, flag: "lowCzoPrzegnani",
            note: [TK.kod.czoResolve[0], TK.kod.czoResolve[1]] });
        else T.call("TownQuests", "finish", "D33", { gold: 80, flag: "lowCzoPomoc",
            note: [TK.kod.czoResolve[0], TK.kod.czoResolve[2]] });
        boardTemplates();
    }

    // ==================================================================
    // B6 THE LORD'S GAME PARK (Map024) - the gamekeeper, the gap, the poaching
    // ==================================================================
    let parkSession = { spawned: false, firstMsg: false };
    function parkAreaCells() {
        const O = OK(), reach = O && O.walk ? O.walk(PARK.inside) : null, out = [];
        for (const a of PARK.areas) for (let y = a.y0; y <= a.y1; y++) for (let x = a.x0; x <= a.x1; x++) {
            if (!passable(x, y) || (reach && !reach.has(x + "," + y))) continue;
            out.push([x, y]);
        }
        return out;
    }
    function spawnPark() {
        const Hn = H();
        if (!Hn || parkSession.spawned) return;
        parkSession.spawned = true;
        const cells = parkAreaCells().filter(([x, y]) => heroDist(x, y) >= 10 && freeCell(x, y));
        const kinds = [];
        for (let i = 0, n = rnd(PARK.deer[0], PARK.deer[1]); i < n; i++) kinds.push("deer");
        for (let i = 0; i < PARK.boars; i++) kinds.push("boar");
        for (const k of kinds) {
            if (!cells.length) break;
            const [x, y] = cells.splice(Math.floor(Math.random() * cells.length), 1)[0];
            const a = Hn.spawn(k, x, y);
            if (!a) continue;
            a._lowPark = true; a._summoned = true; a._noDog = true; a._noClash = true;
        }
    }
    function gajowyEv() {
        const L = TLf();
        if (!L || !L.eventOf || mapId() !== PARK.map) return null;
        const e = L.eventOf("gajowy"), st = L.state ? L.state("gajowy") : null;
        if (!e || $gameMap.event(e.eventId()) !== e || e._erased || (st && st.hidden) || !e.characterName()) return null;
        return e;
    }
    function gajowySees(x, y) {
        const g = gajowyEv();
        if (!g) return false;
        const d = dist(g.x, g.y, x, y);
        if (d > PARK.sight) return false;
        const Hn = H();
        let cover = false;
        try { cover = !!(Hn && Hn.coverBetween && Hn.coverBetween(g.x + 0.5, g.y + 0.5, x + 0.5, y + 0.5)); } catch (e) { cover = false; }
        return !cover || d <= PARK.sight * 0.5;
    }
    const permitLegal = kind => kind === "deer" && has(ITEM.zezwolenie) && day() - S().park.permitDay >= PARK.permitDays;
    function poachKill(a, e) {
        const p = S().park, kind = a.kind();
        if (permitLegal(kind)) { p.permitDay = day(); p.legal++; popup(TX.legal, { icon: D.ICON.zezwolenie, color: "#9ff0a8" }); return; }
        const tx = Math.floor(e.x), ty = Math.floor(e.y);
        if (gajowySees($gamePlayer.x, $gamePlayer.y) || gajowySees(tx, ty)) { crime("seen"); return; }
        p.pending.push({ x: tx, y: ty, clock: clock(), kind });
        if (p.pending.length > 8) p.pending.shift();
    }
    function crime(how) {
        const p = S().park;
        if (p.wanted) return;   // (one fine at a time)
        p.count++;
        const n = Math.min(p.count, 3);
        p.wanted = { how, n, fine: PARK.fines[n - 1], day: day() };
        popup(how === "seen" ? TX.caught : TX.found, { top: true, color: "#ff9f8f", sub: TK.kod.crime[0] });
        const g = gajowyEv();
        if (g && how === "seen") say(g, TK.kod.crime[1], 180);
    }
    const carcassNear = (x, y) => { const Hn = H(); try { return !!(Hn && Hn.carcasses && Hn.carcasses().some(c => dist(c.x, c.y, x + 0.5, y + 0.5) <= 1.2)); } catch (e) { return false; } };
    function parkTick() {
        if (mapId() !== PARK.map) return;
        const p = S().park;
        spawnPark();
        // the first time through the gap
        if (!p.seen && $gamePlayer.y >= 30 && $gamePlayer.y <= 33 && $gamePlayer.x <= 10) { p.seen = true; say($gamePlayer, TX.parkFirst, 260); }
        // the gamekeeper on his round finds a carcass within 2 hours
        const g = gajowyEv();
        p.pending = p.pending.filter(q => clock() - q.clock <= PARK.findHours && carcassNear(q.x, q.y));
        if (g) for (const q of p.pending.slice()) if (dist(g.x, g.y, q.x, q.y) <= PARK.findR) { p.pending = p.pending.filter(o => o !== q); crime("found"); break; }
        // the fine: he comes up to the hero
        if (p.wanted && g && !busy() && dist(g.x, g.y, $gamePlayer.x, $gamePlayer.y) <= 6) runList(null, fineList(g));
    }
    function fineList(g) {
        const p = S().park, w = p.wanted, spk = { id: g ? g.eventId() : -1, name: D.GAJOWY.name }, out = [];
        if (!w) return out;
        if (w.how === "found") linesTo(out, spk, [TALK.gajowyFound]);
        linesTo(out, spk, TALK["gajowyFine" + w.n]);
        if ($gameParty.gold() < w.fine) linesTo(out, spk, [TALK.gajowyNoGold]);
        act(out, ["fine"]);
        if (w.n >= 3) linesTo(out, spk, [TALK.gajowyEscort]);
        return out;
    }
    function payFine() {
        const p = S().park, w = p.wanted;
        if (!w) return;
        p.wanted = null;
        p.fines++;
        if ($gameParty.gold() >= w.fine) { $gameParty.loseGold(w.fine); popup(Watki.wstaw(TK.kod.payFine[0], { fine: w.fine }), { icon: D.ICON.gold, color: "#ff9f8f" }); }
        else {
            const take = D.MEATS.concat([ITEM.skora, ITEM.skoraNiedzwiedzia, 163]);
            let n = 0;
            for (const id of take) { const c = count(id); if (c > 0) { lose(id, c); n += c; } }
            popup(Watki.wstaw(TK.kod.payFine[1], { n: n }), { icon: 94, color: "#ff9f8f" });
        }
        opinion(PARK.opinion, TK.kod.payFine[2]);
        if (w.n >= 3) shutGap(true);
    }
    function shutGap(escort) {
        const p = S().park;
        p.shutUntil = day() + PARK.closeDays;
        $gameSwitches.setValue(D.SW_WYLOM, true);
        if (escort && mapId() === PARK.map && inPark($gamePlayer.x, $gamePlayer.y)) { $gamePlayer.locate(PARK.gap[0][0], PARK.gap[0][1] - 1); $gamePlayer.setDirection(8); }
        popup(fill(TX.parkShut, { n: PARK.closeDays }), { top: true, color: "#ff9f8f" });
    }
    function gapTick() {
        if (!$gameSwitches) return;
        const p = S().park;
        if ($gameSwitches.value(D.SW_WYLOM) && p.shutUntil <= day()) $gameSwitches.setValue(D.SW_WYLOM, false);
    }
    // D32: the snares, the night by them, Rysiek
    const snareShown = i => qStep("D32") === 0 && !S().d32.taken[i];
    const rysiekShown = () => qStep("D32") === 1 && !S().d32.choice && rysiekHour();
    const rysiekHour = () => { const h = hour(), A = PARK.ambushHours; return h >= A[0] || h < A[1]; };
    function d32Tick() {
        if (mapId() !== PARK.map || qStep("D32") !== 1 || S().d32.choice || !rysiekHour() || busy()) return;
        const e = $gameMap.event(IDS.rysiek);
        if (e && heroDist(PARK.rysiek[0], PARK.rysiek[1]) <= 2.2) runList(null, rysiekList(e));
    }
    function rysiekList() {
        const out = linesTo([], speaker("rysiek"), TALK.rysiekMeet);
        choiceTo(out, [TK.kod.rysiekList[0], TK.kod.rysiekList[1]], [
            linesTo([], speaker("rysiek"), TALK.rysiekGive).concat(act([], ["rysiek", "give"])),
            linesTo([], speaker("rysiek"), TALK.rysiekWarn).concat(act([], ["rysiek", "warn"]))], -1);
        return out;
    }
    function rysiekDecide(how) {
        const d = S().d32;
        if (d.choice) return;
        d.choice = how;
        d.met = true;
        if (how === "give") {
            setTqFlag("lowWydalRyska");
            opinion(2, TK.kod.rysiekDecide[0]);
            T.call("TownLife", "setGone", "klusownik", day() + 7);
        } else {
            setTqFlag("lowOstrzegl");
            opinion(3, TK.kod.rysiekDecide[1]);
        }
        refreshWhen(true);
        if (qStep("D32") === 1) T.call("TownQuests", "completeStep", "D32");
    }

    // ==================================================================
    // B7 THE STRAYS OF THE ŁUG FARM (Map168): characters of their own (like Livestock's), led on a rope, caught by hand
    // ==================================================================
    const RA = () => window.RoamingActor;
    let strays = [];
    function Game_Stray() { this.initialize(...arguments); }
    Game_Stray.prototype = Object.create(Game_Character.prototype);
    Game_Stray.prototype.constructor = Game_Stray;
    Game_Stray.prototype.initialize = function(def, x, y, mode) {
        Game_Character.prototype.initialize.call(this);
        this._def = def;
        this._key = def.key;
        this._mode = mode || "free";   // free (on the meadows), led (after the hero), home (at the farm)
        this._wait = rnd(30, 120);
        this._runT = 0;
        this._frozen = false;
        this.setImage(def.sheet, 0);
        this.setPosition(x, y);
        this.setDirection(pick([2, 4, 6, 8]));
        this.setMoveSpeed(def.speed);
        this.setMoveFrequency(5);
        this.setWalkAnime(true);
        this.setStepAnime(false);
        this.setThrough(false);
        this.setPriorityType(1);
    };
    Game_Stray.prototype.kind = function() { return this._def.kind; };
    Game_Stray.prototype.centerX = function() { return this._realX + 0.5; };
    Game_Stray.prototype.centerY = function() { return this._realY + 0.5; };
    Game_Stray.prototype.isMapPassable = function(x, y, d) {
        const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d), F = T.api("Farming");
        if (F && F.buildingAt && F.buildingAt(nx, ny)) return false;
        if (this._mode === "free") { const A = ZBLAKANE.area; if (nx < A.x0 || nx > A.x1 || ny < A.y0 || ny > A.y1) return false; }
        if (this._mode === "home") { const f = ZBLAKANE.farm; if (dist(nx, ny, f.x, f.y) > f.r + 1) return false; }
        return Game_Character.prototype.isMapPassable.call(this, x, y, d);
    };
    Game_Stray.prototype.isCollidedWithCharacters = function(x, y) {
        if (Game_Character.prototype.isCollidedWithCharacters.call(this, x, y)) return true;
        if (this._mode !== "led" && Math.abs($gamePlayer._realX - x) < 0.95 && Math.abs($gamePlayer._realY - y) < 0.95) return true;
        return strays.some(a => a !== this && a._x === x && a._y === y);
    };
    Game_Stray.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        if (this._frozen || this.isMoving()) return;
        if (this._mode === "led") this.follow(); else this.roam();
    };
    Game_Stray.prototype.roam = function() {
        const dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY, d = Math.hypot(dx, dy);
        if (this._runT > 0 || d < (this._def.kind === "hen" ? 1.6 : 1.3)) {   // too close: a step away (a hen that got away runs a few)
            const R = RA(), away = R && R.fleeDirection ? R.fleeDirection(this, dx, dy, { startAtDistance: true, margin: 0.05 }) : 0;
            if (away) { if (this._runT > 0) this._runT--; this.setMoveSpeed(this._runT > 0 ? 4.5 : this._def.speed); this.moveStraight(away); this._wait = 8; return; }
            this._runT = 0;
        }
        this.setMoveSpeed(this._def.speed);
        if (this._wait > 0) { this._wait--; return; }
        this._wait = rnd(60, 240);
        const dirs = [2, 4, 6, 8].filter(dd => this.canPass(this._x, this._y, dd));
        if (!dirs.length) return;
        if (Math.random() < 0.35) { this.setDirection(pick([2, 4, 6, 8])); return; }
        this.moveStraight(pick(dirs));
    };
    Game_Stray.prototype.follow = function() {
        const px = $gamePlayer.x, py = $gamePlayer.y, d = dist(this._x, this._y, px, py);
        if (d > 9) {   // lost behind: it catches up beside him
            const back = { 2: [0, -1], 4: [1, 0], 6: [-1, 0], 8: [0, 1] }[$gamePlayer.direction()] || [0, 1];
            for (const [ox, oy] of [back, [1, 0], [-1, 0], [0, 1], [0, -1]]) if (passable(px + ox, py + oy)) { this.locate(px + ox, py + oy); return; }
            return;
        }
        if (d <= (this._def.kind === "hen" ? 1.1 : 1.6)) { this.turnTowardCharacter($gamePlayer); return; }
        this.setMoveSpeed(Math.max(this._def.speed, 4));
        const dir = this.findDirectionTo(px, py);
        if (dir > 0) this.moveStraight(dir);
    };
    function addStray(def, x, y, mode) {
        const a = new Game_Stray(def, x, y, mode);
        strays.push(a);
        const R = RA();
        if (R && R.addSprite) R.addSprite(a);
        return a;
    }
    function dropStray(a) {
        const R = RA();
        if (R && R.dropSprite) R.dropSprite(a);
        strays = strays.filter(o => o !== a);
    }
    let straysFor = 0;
    function straysSpawn() {
        if (straysFor === mapId()) return;
        straysFor = mapId();
        const s = S().strays, here = mapId();
        for (const def of ZBLAKANE.list) {
            const done = s.done[def.key];
            if (s.led === def.key) {   // (led: it comes with the hero onto any map)
                const c = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([ox, oy]) => [$gamePlayer.x + ox, $gamePlayer.y + oy]).find(([x, y]) => passable(x, y)) || [$gamePlayer.x, $gamePlayer.y];
                addStray(def, c[0], c[1], "led");
                continue;
            }
            if (here !== ZBLAKANE.map) continue;
            if (done && done.how === "farm") { const f = ZBLAKANE.farm, c = cellsAround(f.x, f.y, 1, f.r, 1, 0)[0]; if (c) addStray(def, c[0], c[1], "home"); continue; }
            if (done) continue;
            const pos = s.pos[def.key], st = ZBLAKANE.start;
            const c = pos && passable(pos[0], pos[1]) ? pos : cellsAround(st.x + 1, st.y + 1, 0, 3, 1, 0)[0];
            if (c) addStray(def, c[0], c[1], "free");
        }
        yardExtras();
    }
    // the strays put into the hero's own yards: one more animal of that kind there (Livestock's, not saved - put back on each visit)
    function yardExtras() {
        const s = S().strays, L = window.Livestock, F = T.api("Farming");
        if (!L || !L.spawn || !F || !F.farm) return;
        for (const def of ZBLAKANE.list) {
            const d = s.done[def.key];
            if (!d || d.how !== "yard" || d.map !== mapId()) continue;
            const b = yardsOf(def.kind).find(o => o.id === d.b);
            if (!b || L.animals.some(a => a._lowExtra === def.key)) continue;
            const cells = (F.yardInterior ? F.yardInterior(b) : []).filter(c => passable(c.x, c.y));
            if (!cells.length) continue;
            const c = pick(cells), a = L.spawn(def.kind, b, c.x, c.y);
            if (a) a._lowExtra = def.key;
        }
    }
    function yardsOf(kind) {
        const F = T.api("Farming");
        try {
            const list = (F.farm().buildings[mapId()] || []);
            return list.filter(b => !b.site && !b.empty && ((F.BUILDINGS[b.type] || {}).yard || {}).animal === kind);
        } catch (e) { return []; }
    }
    function strayAhead() {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, d = $gamePlayer.direction();
        const fx = d === 4 ? -1 : d === 6 ? 1 : 0, fy = d === 8 ? -1 : d === 2 ? 1 : 0;
        let best = null, bd = 99;
        for (const a of strays) {
            const dx = a.centerX() - px, dy = a.centerY() - py, dd = Math.hypot(dx, dy);
            if (dd > 1.5 || (dd > 0.5 && (dx * fx + dy * fy) / dd < 0.4)) continue;
            if (dd < bd) { bd = dd; best = a; }
        }
        return best;
    }
    function strayAction(a) {
        const s = S().strays, def = a._def;
        if (a._mode === "home") { say(a, def.kind === "cow" ? "Muuu." : def.kind === "sheep" ? "Beee." : "Ko-ko.", 120); return; }
        if (a._mode === "led") {
            const out = heroLines(["> " + def.name + "."]);
            choiceTo(out, [TK.kod.strayAction[0], TK.kod.strayAction[1]], [act([], ["strayLet", def.key]), []], 1);
            runList(null, out);
            return;
        }
        if (s.led) { need(D.ICON.lina, TK.kod.strayAction[2]); return; }
        if (def.kind === "hen") {
            if (Math.random() < ZBLAKANE.catchHen) { strayLead(a); popup(TX.henCaught, { icon: 0, color: "#9ff0a8" }); se("Chicken", 80, 110); }
            else { a._runT = ZBLAKANE.henRun; popup(TX.henMissed, { icon: 0, color: "#ff9f8f" }); se("Chicken", 90, 130); }
            return;
        }
        const out = heroLines(["> " + def.name + ". " + (def.kind === "cow" ? TK.kod.strayAction[3] : TK.kod.strayAction[4])]);
        choiceTo(out, [TK.kod.strayAction[5], "Zostaw"], [act([], ["strayRope", def.key]), []], 1);
        runList(null, out);
    }
    function strayLead(a) {
        S().strays.led = a._key;
        a._mode = "led";
        a.setThrough(false);
        popup(fill(TX.roped, { name: a._def.name }), { icon: D.ICON.lina, color: "#cfe6a8" });
    }
    function strayRope(key) {
        const a = strays.find(o => o._key === key);
        if (!a) return;
        if (!has(ITEM.lina)) { need(D.ICON.lina, TX.ropeNeed); return; }
        lose(ITEM.lina, 1);
        se(a._def.kind === "cow" ? "Cow" : "Sheep", 70, 100);
        strayLead(a);
    }
    function strayLet(key) {
        const s = S().strays, a = strays.find(o => o._key === key);
        if (s.led === key) s.led = null;
        if (!a) return;
        popup(fill(TX.letGo, { name: a._def.name }), { icon: 0 });
        if (mapId() === ZBLAKANE.map) { a._mode = "free"; s.pos[key] = [a.x, a.y]; }
        else { dropStray(a); s.pos[key] = null; }   // (on another map it goes back to the meadows by itself)
    }
    function deliverStray(a, how, b) {
        const s = S().strays;
        s.led = null;
        s.done[a._key] = how === "yard" ? { how, map: mapId(), b: b.id, day: day() } : { how, day: day() };
        popup(fill(TX.delivered, { name: a._def.name }), { icon: 0, color: "#9ff0a8" });
        se(a._def.kind === "cow" ? "Cow" : a._def.kind === "sheep" ? "Sheep" : "Chicken", 80, 100);
        if (how === "farm") { a._mode = "home"; } else { dropStray(a); yardExtras(); }
        refreshQuest();
    }
    function straysTick() {
        straysSpawn();
        const s = S().strays;
        for (const a of strays) if (a._mode === "free") s.pos[a._key] = [a.x, a.y];
        const led = strays.find(a => a._mode === "led");
        if (!led) return;
        const Ho = T.api("Homes"), f = ZBLAKANE.farm;
        let stage = 0;
        try { stage = Ho && Ho.stage ? Ho.stage() : 0; } catch (e) { stage = 0; }
        if (mapId() === ZBLAKANE.map && stage >= f.stage && dist(led.x, led.y, f.x, f.y) <= f.r) { deliverStray(led, "farm"); return; }
        const F = T.api("Farming");
        for (const b of yardsOf(led.kind())) {
            const cells = F && F.yardInterior ? F.yardInterior(b) : [];
            if (cells.some(c => dist(c.x, c.y, led.x, led.y) <= 2.2)) { deliverStray(led, "yard", b); return; }
        }
    }
    const strayCount = () => Object.keys(S().strays.done).length;
    // they live in this file's own list: moved with the map, drawn by RoamingActor, gone with the map (the state keeps them)
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        for (const a of strays.slice()) a.update();
    };
    const _createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _createCharacters.call(this);
        const R = RA();
        if (R && R.addSprite) for (const a of strays) { a._sprite = null; R.addSprite(a, this); }
    };
    const _trigger = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && !$gameMap.isEventRunning()) {
            const a = strayAhead();
            if (a) { strayAction(a); return true; }
        }
        return _trigger.call(this);
    };

    // ==================================================================
    // B8 THE SOLDIERS' RANGE (Map162)
    // ==================================================================
    let round = null;   // { shots, pts, contest, arrows0, loaned, list }
    let lastHit = null;
    const contestToday = () => RANGE.contestDay(day()) || S().range.forceContest === day();
    const contestHours = () => hour() >= RANGE.contestHours[0] && hour() < RANGE.contestHours[1];
    (function addTargets() {
        const Hn = H();
        if (!Hn || !Hn.addTargets) return;
        Hn.addTargets(() => {
            if (!round || mapId() !== RANGE.map) return [];
            return RANGE.targets.map((t, i) => ({ x: t.x + 0.5, y: t.y + RANGE.faceY, radius: RANGE.radius, ref: { kind: "tarcza", lowTarget: i },
                hit: () => { lastHit = { i, frame: Graphics.frameCount }; } }));
        });
    })();
    function startRound(contest) {
        if (!has(ITEM.luk)) { need(D.ICON.luk, TX.noBow); return false; }
        if (round) return false;
        const arrows0 = count(ITEM.strzaly);
        gain(ITEM.strzaly, RANGE.practice);
        round = { shots: 0, pts: 0, contest: !!contest, arrows0, list: [] };
        const Cb = T.api("Combat");
        try { if (Cb && Cb.setHand) Cb.setHand("ranged"); } catch (e) { /* (an older Combat) */ }
        $gamePlayer.locate(RANGE.stand[0], RANGE.stand[1]);   // (from here no target stands in the way of another)
        $gamePlayer.setDirection(6);
        popup(contest ? fill(TX.contest, { list: RANGE.rivals.map(r => r.score).join(" / ") }) : TX.roundStart, { top: true, color: "#ffe27a", sub: TK.kod.startRound[0] });
        return true;
    }
    function scoreShot(e) {
        const hit = lastHit && Graphics.frameCount - lastHit.frame <= 3 ? lastHit : null;
        lastHit = null;
        if (!hit || !e.hit) return 0;
        const t = RANGE.targets[hit.i], cx = t.x + 0.5, cy = t.y + RANGE.faceY;
        const sx = $gamePlayer._realX + 0.5, sy = $gamePlayer._realY + 0.3, vx = e.x - sx, vy = e.y - sy, len = Math.hypot(vx, vy) || 1;
        const off = Math.abs((cx - sx) * vy / len - (cy - sy) * vx / len) * 48;
        return off <= RANGE.ring.center ? RANGE.score.center : off <= RANGE.ring.mid ? RANGE.score.mid : RANGE.score.edge;
    }
    T.on("shot", e => {
        if (!round || !e || e.weapon !== "bow" || mapId() !== RANGE.map) return;
        const pts = scoreShot(e);
        round.shots++;
        round.pts += pts;
        round.list.push(pts);
        popup(pts ? fill(TX.shotPts, { n: pts }) + "  (" + round.pts + ")" : TX.shotMiss + "  (" + round.pts + ")", { icon: 0, color: pts >= 10 ? "#ffe27a" : pts ? "#cfe6a8" : "#cfd6de" });
        if (pts) se("Bow3", 60, 120);
        if (round.shots >= RANGE.shots) setTimeout(() => endRound(false), 400);
    }, { owner: PLUGIN });
    function endRound(forfeit) {
        if (!round) return;
        const r = round, s = S().range;
        round = null;
        const now = count(ITEM.strzaly);   // (the practice arrows are the army's: the bag as it was)
        if (now > r.arrows0) lose(ITEM.strzaly, now - r.arrows0); else if (now < r.arrows0) gain(ITEM.strzaly, r.arrows0 - now);
        s.rounds++;
        s.last = { pts: r.pts, list: r.list, contest: r.contest, day: day() };
        if (forfeit) { popup(TK.kod.endRound[0], { icon: 0, color: "#cfd6de" }); return; }
        s.best = Math.max(s.best, r.pts);
        popup(fill(TX.roundEnd, { n: r.pts }), { top: true, color: "#ffe27a", sub: r.list.join(" + ") || TK.kod.endRound[1] });
        if (r.contest) contestResult(r.pts);
    }
    function contestResult(pts) {
        const s = S().range, beat = RANGE.rivals.filter(x => pts > x.score).length;
        s.contestDay = day();
        if (!beat) { popup(Watki.wstaw(TK.kod.contestResult[0], { name: RANGE.rivals[2].name, score: RANGE.rivals[2].score }), { top: true, color: "#cfd6de" }); return; }
        const gold = RANGE.prizes[beat - 1], favor = RANGE.favor[beat - 1];
        $gameParty.gainGold(gold);
        T.call("Garnizon", "addFavor", favor, TK.kod.contestResult[1]);
        s.wins++;
        popup(Watki.wstaw(TK.kod.contestResult[2], { beat: beat, gold: gold }), { top: true, color: "#9ff0a8", sub: beat === 3 ? TK.kod.contestResult[3] : "" });
        if (beat === 3) {
            s.beatBest = true;
            if (!s.silver) { s.silver = true; gain(ITEM.srebrnaStrzala, 1); popup(TX.silver, { icon: D.ICON.srebrnaStrzala, color: "#ffe27a", gain: true }); }
            refreshQuest();
        }
    }
    function rangeTick() {
        if (!round) return;
        if (mapId() !== RANGE.map || $gamePlayer.x > RANGE.line[1] + 2 || $gamePlayer.y < RANGE.area.y - 1 || $gamePlayer.y > RANGE.area.y + RANGE.area.h) endRound(true);
    }
    let drillBark = 0;
    function drillTick() {
        if (mapId() !== RANGE.map || !WHEN.drill() || --drillBark > 0) return;
        drillBark = rnd(12, 24);
        const e = $gameMap.event(pick(IDS.zolnierze));
        if (e && heroDist(e.x, e.y) < 12) say(e, pick([TK.kod.drillTick[0], TK.kod.drillTick[1], TK.kod.drillTick[2], TK.kod.drillTick[3]]), 200);
    }

    // ==================================================================
    // Trophies: the claw, the tusk, the antler from an animal killed at its place - given when its carcass is dressed
    // ==================================================================
    function trophy(e, itemId, kind) {
        const list = S().trophies;
        list.push({ map: e.mapId, x: e.x, y: e.y, kind: kind || (e.animal && e.animal.kind ? e.animal.kind() : ""), item: itemId, day: day() });
        while (list.length > 12) list.shift();
    }
    T.on("carcassDressed", e => {
        if (!e) return;
        const list = S().trophies, i = list.findIndex(t => t.map === e.mapId && t.kind === e.kind && dist(t.x, t.y, e.x, e.y) <= 1.6);
        if (i >= 0) {
            const t = list.splice(i, 1)[0];
            gain(t.item, 1);
            const it = item(t.item);
            if (it) popup(it.name, { icon: it.iconIndex, color: "#ffe27a", gain: true });
        }
        // K60: the meat of a deer from the lick
        if (e.kind === "deer" && e.mapId === LIZAWKA.map && dist(e.x, e.y, LIZAWKA.x, LIZAWKA.y) <= LIZAWKA.r + 3 && !S().lick.trophy) { S().lick.trophy = true; refreshQuest(); }
    }, { owner: PLUGIN });

    // ==================================================================
    // The kills
    // ==================================================================
    T.on("kill", e => {
        const Hn = H(), a = e && e.animal;
        if (!a || !Hn || !Hn.Game_Animal || !(a instanceof Hn.Game_Animal)) return;
        if (a._lowDen || a._lowPup) denKilled(a, e);
        if (a._lowGawra) gawraKilled(a, e);
        if (a._lowWallow && Math.random() < BLOTO.tusk) trophy(e, ITEM.kiel, "boar");
        if (a._lowLick && a.kind() === "deer" && Math.random() < LIZAWKA.antlerChance) trophy(e, ITEM.poroze, "deer");
        if (e.mapId === PARK.map && (a._lowPark || inPark(Math.floor(e.x), Math.floor(e.y))) && ["hero", "dog", "eagle"].includes(e.by || "hero")) poachKill(a, e);
    }, { owner: PLUGIN });

    // ==================================================================
    // The animals' behaviour: the friendly pack, the calm bear, the park's bounds; the hero's senses in the mud and the hide
    // ==================================================================
    const FRIEND_MODES = ["windup", "close", "stalk", "recover"];
    function hookAnimals() {
        const Hn = H(), GA = Hn && Hn.Game_Animal;
        if (!GA || GA.prototype._lowHooked) return !!GA;
        GA.prototype._lowHooked = true;
        const P = GA.prototype;
        const _update = P.update;
        P.update = function() {
            if (!this._clash && (isFriend(this) || bearCalm(this))) { this._aware = Math.min(this._aware || 0, 0.2); this._alarm = 0; }
            return _update.call(this);
        };
        const _think = P.thinkWolf;
        P.thinkWolf = function(d) {
            if (this._clash || !isFriend(this) || this._mode === "flee" || this._mode === "lunge") return _think.call(this, d);
            const pack = this._pack, ai = HP() && HP().ai;
            if (pack && pack.engaged && ai && ai.disengage) ai.disengage(pack);
            this._engaged = false;
            this._wounded = false;
            this._noAutoCombat = true;
            if (FRIEND_MODES.includes(this._mode)) this.setMode("roam");
            if (pack && pack.leader && pack.leader !== this && !pack.leader._dead && dist(pack.leader._x, pack.leader._y, this._x, this._y) > 2.2) {
                const r = Hn.path8 ? Hn.path8(this, pack.leader._x, pack.leader._y, { animal: true, key: "pack", near: 1.5 }) : null;
                if (r && Hn.takeStep && Hn.takeStep(this, r.dir)) return;
            }
            this.wander();
        };
        const _pass = P.isMapPassable;
        P.isMapPassable = function(x, y, d) {
            if (this._lowPark && !inPark($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d))) return false;
            return _pass.call(this, x, y, d);
        };
        return true;
    }
    (function hookCombat() {
        const Cb = T.api("Combat");
        if (!Cb || Cb._lowHooked) return;
        Cb._lowHooked = true;
        const _perk = Cb.perk;
        if (typeof _perk === "function") Cb.perk = function(key) {
            const v = _perk.apply(this, arguments) || 0;
            if (key !== "sneak") return v;
            return v + (muddy() ? BLOTO.sneak : 0) + (inHide() ? LIZAWKA.hideSneak : 0);
        };
        const _aim = Cb.aimSteady;
        if (typeof _aim === "function") Cb.aimSteady = function() { const v = _aim.apply(this, arguments); return inHide() ? v * LIZAWKA.hideAim : v; };
        const _hit = Cb.hitPlayer;
        if (typeof _hit === "function") Cb.hitPlayer = function(o) { return _hit.call(this, rageOf(o)); };
    })();

    // ==================================================================
    // The quests (TownQuests' FX of the custom steps) and the board
    // ==================================================================
    function refreshQuest() { const q = TQ(); try { if (q && q.autoChecks) q.autoChecks(); } catch (e) { /* (no quests yet) */ } }
    (function hookQuests() {
        const q = TQ();
        if (!q || !q.FX) { warn("brak TownQuests - zadania K59-K62, D32-D33 nieaktywne"); return; }
        const F = q.FX;
        // K59: starts by itself once the den is found (Bogdan's notice on the board told of it); its end is the den's (finish with the reward)
        F.lowK59Start = () => found("nora") && !S().den.choice;
        F.lowK59 = { check: () => false, vars: () => ({ n: Math.min(NORA.meatDays, S().den.meat.length) }) };
        // K60: once the lick is found
        F.lowK60Start = () => found("lizawka");
        F.lowK60Sol = { check: () => S().lick.ever };
        F.lowK60Swit = { check: () => S().lick.watched };
        F.lowK60Lup = { check: () => S().lick.trophy || has(ITEM.poroze) };
        // K61: Kłos offers it (the range found); with Kłos gone (D27) it starts by itself
        F.lowK61Offer = { cond: () => found("strzelnica") };
        F.lowK61Start = () => found("strzelnica") && !!T.call("Garnizon", "klosGone");
        F.lowK61 = { check: () => S().range.beatBest };
        // K62
        F.lowK62 = { check: () => strayCount() >= ZBLAKANE.list.length, vars: () => ({ n: strayCount() }) };
        // D32
        F.lowD32Offer = { cond: () => found("zwierzyniec") };
        F.lowD32Sidla = { check: () => S().d32.taken.every(Boolean), vars: () => ({ n: S().d32.taken.filter(Boolean).length }) };
        F.lowD32Noc = { check: () => !!S().d32.choice };
        // D33 (Act II): the hunters' camp found
        F.lowD33Start = () => actTwo() && found("oboz_czo") && !S().czo.resolved;
        F.lowD33Wybor = { check: () => false };
        F.lowD33Koniec = { check: () => false, vars: () => {
            const z = S().czo;
            return { co: z.choice === "help" ? (z.bearDead ? TK.kod.vars[0] : TK.kod.vars[1])
                : TK.kod.vars[2] };
        } };
        // the quest done: the garrison's favour for K61
        T.on("townQuestDone", e => { if (e && e.id === "K61") T.call("Garnizon", "addFavor", 5, TK.kod.hookQuests[0]); }, { owner: PLUGIN });
    })();

    // ==================================================================
    // The talks of the residents (Tawerna.talk.takeover, "owner" priority): the gamekeeper's fine, the white-eye arrow shown, Rysiek's hides,
    // Marta's milk
    // ==================================================================
    function questWants(key) { const q = TQ(); try { const m = q && q.markers ? q.markers()[key] : null; return m === "new" || m === "ready"; } catch (e) { return false; } }
    function talkHook(key, e) {
        const spk = { id: e ? e.eventId() : -1, name: (D.GAJOWY.key === key ? D.GAJOWY.name : speaker(key).name) };
        if (key === "gajowy" && S().park.wanted) return fineList(e);
        if (questWants(key)) return null;
        if ((key === "rotmistrz" || key === "pustelnik") && has(ITEM.strzalaOko) && !S().arrow[key]) {
            const out = linesTo([], spk, key === "rotmistrz" ? TALK.arrowRotmistrz : TALK.arrowKleofas);
            return act(out, ["arrow", key]);
        }
        if (key === "klusownik" && tqFlag("lowOstrzegl")) {
            const out = linesTo([], spk, [TALK.rysiekShop]);
            choiceTo(out, [TK.kod.talkHook[0], TK.kod.talkHook[1]], [[C(302, [0, ITEM.skora, 1, 4, true]), C(605, [0, 163, 1, 3])], []], 1);
            return out;
        }
        if (key === "praczka" && tqFlag("lowMlekoMarty") && day() - S().strays.milkDay >= ZBLAKANE.milkEvery) {
            const out = linesTo([], spk, [TALK.martaMilk]);
            return act(out, ["milk"]);
        }
        return null;
    }
    // (2026-10-23, docs/ROZMOWY.md) the core's talk service: an "owner" takeover, after Zakon's and Ludzie's, before Zasoby's (as the old
    // hooks: the arrow shown to the captain comes before Garnizon's menu, to Kleofas after Zakon's reading)
    T.talk.takeover({ owner: PLUGIN, who: [D.GAJOWY.key, "rotmistrz", "pustelnik", "klusownik", "praczka"], priority: T.talk.PRIORITY.owner + 40,
        run: ctx => talkHook(ctx.who, ctx.ev) });

    // ==================================================================
    // The events' calls (Lowy.look, Lowy.act, ...)
    // ==================================================================
    function lookAt(interp, what) {
        const s = S();
        if (what === "nora") {
            if (denEmpty()) return runList(interp, heroLines(["> " + TX.denEmpty]));
            return runList(interp, heroLines([friendOn() ? TK.kod.lookAt[0] : TK.kod.lookAt[1]]));
        }
        if (what === "gawra") {
            if (bearDeadNow()) return runList(interp, heroLines(["> " + TX.empty]));
            if (winter() && s.bear.wokeDay !== day()) {
                const out = heroLines(["> " + TX.peekAsk]);
                choiceTo(out, [TX.peekSleep, TX.peekLeave], [act([], ["wake"]), []], 1);
                return runList(interp, out);
            }
            return runList(interp, heroLines(["> " + (gawraBear() ? TX.nobody : TX.nobody)]));
        }
        if (what === "bloto") return need(0, TX.muddyNoDrink);
        if (what === "lizawka") {
            if (lickActive()) return runList(interp, heroLines(["> " + fill(TX.lickActive, { n: s.lick.until - day() })]));
            const out = heroLines(["> " + TX.lickAsk]);
            choiceTo(out, [TX.lickPut, TX.lickNo], [act([], ["salt"]), []], 1);
            return runList(interp, out);
        }
        if (what === "namiot") return runList(interp, heroLines([TK.kod.lookAt[2]]));
        if (what === "namiotRab") return runList(interp, heroLines([TK.kod.lookAt[3]]));
        if (what === "ciernie") return runList(interp, heroLines(["> " + fill(TX.parkShut, { n: Math.max(1, s.park.shutUntil - day()) })]));
        if (what === "lesniczowka") return runList(interp, heroLines([TK.kod.lookAt[4]]));
        if (what === "pasnik") return runList(interp, heroLines([season() === 3 ? TK.kod.lookAt[5] : TK.kod.lookAt[6]]));
        if (what === "zolnierz") return runList(interp, linesTo([], { id: interp ? interp.eventId() : -1, name: TK.kod.lookAt[7] }, [pick([TK.kod.lookAt[8], TK.kod.lookAt[9]])]));
        const m = /^tarcza(\d)$/.exec(what);
        if (m) return runList(interp, heroLines([Watki.wstaw(TK.kod.lookAt[10], { d: RANGE.targets[Number(m[1])].d })]));
        return false;
    }
    function rangeMenu(interp) {
        if (round) { popup(Watki.wstaw(TK.kod.rangeMenu[0], { shots: round.shots, shots2: RANGE.shots }), { icon: 0 }); return; }
        const labels = [TK.kod.rangeMenu[1]], branches = [act([], ["round", false])];
        if (contestToday() && contestHours() && S().range.contestDay !== day()) { labels.push(TK.kod.rangeMenu[2]); branches.push(act([], ["round", true])); }
        labels.push(TK.kod.rangeMenu[3]);
        branches.push([]);
        const out = heroLines([Watki.wstaw(TK.kod.rangeMenu[5], { "1": contestToday() ? TK.kod.rangeMenu[4] : "" })]);
        choiceTo(out, labels, branches, labels.length - 1);
        runList(interp, out);
    }
    function takeSnare(interp, i) {
        const d = S().d32;
        if (d.taken[i]) return;
        d.taken[i] = true;
        se("Equip2", 70, 100);
        popup(fill(TX.snareFound, { n: d.taken.filter(Boolean).length }), { icon: 0, color: "#cfe6a8" });
        refreshWhen(true);
        refreshQuest();
    }
    function pickAntler() {
        const s = S().lick;
        if (!antlerShown()) return;
        s.antlerKey = antlerKey();
        gain(ITEM.poroze, 1);
        popup(TX.antler, { icon: D.ICON.poroze, color: "#ffe27a", gain: true });
        popup(TX.antlerSub, { top: true, color: "#cfe6a8" });
        refreshWhen(true);
        refreshQuest();
    }
    function actCall(interp, args) {
        const [what, a] = Array.isArray(args) ? args : [];
        try {
            if (what === "salt") return putSalt();
            if (what === "wake") return wakeBear();
            if (what === "fine") return payFine();
            if (what === "rysiek") return rysiekDecide(a);
            if (what === "strayRope") return strayRope(a);
            if (what === "strayLet") return strayLet(a);
            if (what === "round") return startRound(!!a);
            if (what === "czoHelp") { S().czo.choice = "help"; if (qStep("D33") === 0) T.call("TownQuests", "completeStep", "D33"); return true; }
            if (what === "czoDrive") {
                S().czo.choice = "drive";
                if (qStep("D33") === 0) T.call("TownQuests", "completeStep", "D33");
                for (const h of czoMen()) if (h.engage) h.engage(false);
                return true;
            }
            if (what === "czoPaid") return czoResolve("help");
            if (what === "arrow") {
                S().arrow[a] = true;
                if (a === "rotmistrz") T.call("Garnizon", "addFavor", 5, TK.kod.actCall[0]);
                else T.call("Journal", "addNote", TK.kod.actCall[1], TK.kod.actCall[2]);
                return true;
            }
            if (what === "milk") { S().strays.milkDay = day(); gain(ITEM.mleko, ZBLAKANE.milk); const it = item(ITEM.mleko); if (it) popup(it.name + " ×" + ZBLAKANE.milk, { icon: it.iconIndex, gain: true }); return true; }
        } catch (e) { console.error("[Lowy] act " + JSON.stringify(args), e); }
        return false;
    }

    // ==================================================================
    // The map drives it
    // ==================================================================
    let auto = true;   // (tests switch the spawning off)
    let frame = 0;
    function resetSession() {
        denSession = { killed: 0, spawned: false, resolved: false };
        bearSession = { spawned: false, snoreT: 0 };
        wallowSession = { window: "" };
        lickSession = { window: "", hideMsg: false };
        parkSession = { spawned: false, firstMsg: false };
        for (const a of strays) { const R = RA(); if (R && R.dropSprite) R.dropSprite(a); }
        strays = [];
        straysFor = 0;
        whenSig = "";
        frame = 0;
        if (round) { const r = round; round = null; const now = count(ITEM.strzaly); if (now > r.arrows0) lose(ITEM.strzaly, now - r.arrows0); }
    }
    T.on("mapEnter", resetSession, { owner: PLUGIN });
    T.on("load", resetSession, { owner: PLUGIN });
    T.on("dayStart", () => gapTick(), { owner: PLUGIN });
    function tick() {
        if (!window.$gameMap || !$gamePlayer || !$gameSystem) return;
        hookAnimals();
        gapTick();
        boardTemplates();
        if (auto) {
            denTick();
            gawraTick();
            wallowTick();
            lickTick();
            parkTick();
            straysTick();
        }
        campTick();
        czoTick();
        d32Tick();
        rangeTick();
        drillTick();
        refreshWhen(false);
    }
    T.onMapUpdate(() => {
        frame++;
        if (frame === 3 || frame % 30 === 0) {
            try { tick(); } catch (e) { console.error("[Lowy] tick", e); }
        }
    }, { owner: PLUGIN, name: "tick" });

    // ==================================================================
    // F9 (Debug.js, tab "Wyspa i fabuła", through Okolice.f9)
    // ==================================================================
    let f9Place = 0, f9Poach = 0;
    const F9_GO = {
        nora: ["Wilcza nora", 23, 65, 55, 8], gawra: ["Gawra", 13, 99, 49, 8], blotnisko: ["Błotnisko", 21, 66, 50, 8], lizawka: ["Lizawka (zasiadka)", 4, 70, 53, 6],
        oboz_rabusiow: ["Obóz rabusiów", 21, 60, 45, 8], oboz_czo: ["Obóz myśliwych", 23, 66, 24, 8], zwierzyniec: ["Zwierzyniec (wyłom)", 24, 7, 31, 2],
        zblakane: ["Zbłąkane zwierzęta", 168, 85, 32, 8], strzelnica: ["Strzelnica", 162, 74, 52, 6]
    };
    const placeLabel = i => { const d = D.DISCOVER[i]; return Watki.wstaw(TK.kod.placeLabel[0], { "1": i + 1, length: D.DISCOVER.length, name: d.name }); };
    function f9Rows() {
        const s = S();
        return [
            { label: placeLabel(f9Place), icon: D.ICON.poroze, desc: TK.kod.f9Rows[0], what: "place", pick: f9Place },
            { label: TK.kod.f9Rows[1], icon: D.ICON.kiel, desc: TK.kod.f9Rows[2], what: "den" },
            { label: Watki.wstaw(TK.kod.f9Rows[3], { "1": friendOn() ? "TAK" : "nie" }), icon: D.ICON.kiel, desc: TK.kod.f9Rows[4], what: "friend" },
            { label: TK.kod.f9Rows[5], icon: D.ICON.pazur, desc: TK.kod.f9Rows[6], what: "bear" },
            { label: TK.kod.f9Rows[7], icon: D.ICON.sol, desc: TK.kod.f9Rows[8], what: "salt" },
            { label: TK.kod.f9Rows[9], icon: 156, desc: TK.kod.f9Rows[10], what: "rab" },
            { label: TK.kod.f9Rows[11], icon: D.ICON.strzalaOko, desc: TK.kod.f9Rows[12], what: "czo" },
            { label: Watki.wstaw(TK.kod.f9Rows[13], { count: s.park.count }), icon: D.ICON.zezwolenie, desc: TK.kod.f9Rows[14], what: "poach", pick: f9Poach },
            { label: TK.kod.f9Rows[15], icon: D.ICON.srebrnaStrzala, desc: TK.kod.f9Rows[16], what: "contest" },
            { label: TK.kod.f9Rows[17], icon: D.ICON.lina, desc: TK.kod.f9Rows[18], what: "strays" }
        ].map(r => Object.assign(r, { owner: PLUGIN }));
    }
    function f9Pick(row, delta) {
        if (row.what === "place") { f9Place = row.pick = ((row.pick || 0) + delta + D.DISCOVER.length) % D.DISCOVER.length; row.label = placeLabel(row.pick); }
        if (row.what === "poach") { f9Poach = row.pick = ((row.pick || 0) + delta + 4) % 4; row.label = Watki.wstaw(TK.kod.f9Pick[0], { pick: row.pick }); }
    }
    const setHour = h => { if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(h); };
    function f9Ok(row) {
        const s = S();
        if (row.what === "place") { const d = D.DISCOVER[row.pick || 0], g = F9_GO[d.key]; return g ? { go: g } : { go: [d.name, d.map, d.x, d.y, 2] }; }
        if (row.what === "den") { setHour(10); s.den.forcePups = day(); s.den.emptyUntil = 0; return { go: F9_GO.nora }; }
        if (row.what === "friend") { s.den.friendly = !friendOn(); s.den.betrayed = false; if (s.den.friendly) s.den.choice = "zostawione"; return { say: Watki.wstaw(TK.kod.f9Ok[0], { "1": friendOn() ? "tak" : "nie" }) }; }
        if (row.what === "bear") { s.bear.forceWinter = day(); s.bear.wokeDay = -1; s.bear.deadYear = 0; return { go: F9_GO.gawra }; }
        if (row.what === "salt") { s.lick.until = day() + LIZAWKA.days; s.lick.ever = true; s.lick.windows = {}; setHour(5.5); return { go: F9_GO.lizawka }; }
        if (row.what === "rab") { s.camps.forceRab = day(); setHour(22); return { go: F9_GO.oboz_rabusiow }; }
        if (row.what === "czo") { s.camps.forceCzo = day(); setHour(10); return { go: F9_GO.oboz_czo }; }
        if (row.what === "poach") { s.park.count = row.pick || 0; s.park.wanted = null; return { say: Watki.wstaw(TK.kod.f9Ok[1], { count: s.park.count }) }; }
        if (row.what === "contest") { s.range.forceContest = day(); s.range.contestDay = -1; setHour(10.5); return { go: F9_GO.strzelnica }; }
        if (row.what === "strays") { if (!has(ITEM.lina)) gain(ITEM.lina, 2); return { go: F9_GO.zblakane }; }
        return null;
    }
    (function addF9() {
        const O = OK();
        if (O && O.f9 && O.f9.add) O.f9.add({ owner: PLUGIN, title: "Paczka B: Zwierzęta i łowy", rows: f9Rows, pick: f9Pick, ok: f9Ok });
    })();

    // ------------------------------------------------------------------
    // API (window.Lowy)
    // ------------------------------------------------------------------
    // (2026-10-22, integration) the epilogue after the Heart: Underground.js asks Lowy.epilogue(kind, w) - a line, a list or null
    function epilogue() {
        if (!window.$gameSystem || !D.EPILOG) return null;
        const s = S(), out = [];
        if (friendOn()) out.push(D.EPILOG.pack);
        if (has(ITEM.zezwolenie)) out.push(D.EPILOG.permit);
        else if (s.park && s.park.seen && !s.park.count) out.push(D.EPILOG.park);
        return out;
    }
    window.Lowy = T.register(PLUGIN, { epilogue,
        PKG: "B", VERSION, ready: true, state: S, auto: v => { auto = v === undefined ? auto : !!v; return auto; }, tick, resetSession,
        look: lookAt, act: actCall, rangeMenu, takeSnare, pickAntler, rysiekTalk: interp => runList(interp, rysiekList()),
        // the parts the tests (and the integration) reach
        den: { adults: denAdults, pups: denPups, spawn: spawnDen, friend: friendOn, isFriend, broken: denBroken, befriend, bundles: denBundles, session: () => denSession },
        bear: { get: gawraBear, spawn: spawnBear, wake: wakeBear, winter, dead: bearDeadNow, calm: bearCalm, rageOf },
        wallow: { muddy, cells: mudCells },
        lick: { active: lickActive, deer: lickDeer, inHide, putSalt, antlerShown },
        camps: { rabusieWanted, czoWanted, live: campLive, czoMen, resolve: czoResolve },
        park: { inPark, gajowy: gajowyEv, sees: gajowySees, crime, payFine, fineList, shutGap, spawn: spawnPark, poach: poachKill },
        strays: { list: () => strays, add: addStray, ahead: strayAhead, action: strayAction, rope: strayRope, let: strayLet, deliver: deliverStray, count: strayCount, Game_Stray },
        range: { start: startRound, end: endRound, round: () => round, score: scoreShot, contestToday },
        WHEN, refreshWhen, talkHook, trophy, hookAnimals
    });
})();
