// TawernaCore.js on the map without the game - the parts of the browser test tests/core_test.js that a map and a clock drive, run
// with stand-ins for the engine (a map's data, Game_Map, Scene_Map, the sound buffers) and the core's late hooks put on as at
// Scene_Boot.start. Map injection: id ranges (an overlap with another owner refused - also the reserved ones of Story, Forestry,
// the packages -, the same owner again fine), the events put into the map's data as it loads (an id outside its range left out, an
// editor's own event left alone, when() false - nothing), onMapData after the injections, a transfer within the same map keeping
// a live event's data, Game_Map.setup taking a when()-false owner's events out, an older save on the map getting the missing events
// and losing the orphaned ones (then mapReady). The bus's own events: newGame, save, load (the states looked over first),
// mapLeave / mapEnter, dayStart and hourChange from the map's frames, sleep -> wake -> dayStart. The map's updater (every, priority,
// calm, one that throws turned off), the calm check (presets, only, single checks, settle). Sound: the SE budget a frame and a missing
// SE silent; a BGS layer fading in to its target (clamped, scaled, panned), down and stopped, stopped by AudioManager.stopBgs.
// Tawerna.popup: over the hero, the top notice, a menu's help line.
"use strict";
const unit = require("../lib/unit.js");

unit.test(t => {
    // ---------------------------------------------------------------- the engine, as far as the core's hooks need it
    function Game_System() { this._day = 1; this._hour = 9; }
    Game_System.prototype.dayNightDay = function() { return this._day; };
    Game_System.prototype.dayNightHour = function() { return this._hour; };
    Game_System.prototype.sleepUntilHour = function(h) { if (h <= this._hour) this._day++; this._hour = h; return { day: this._day, hour: h }; };
    class Game_Map {
        constructor(id) { this._mapId = id || 0; this._events = []; }
        setup(id) { this._mapId = id; this.setups = (this.setups || 0) + 1; }
        mapId() { return this._mapId; }
        isEventRunning() { return false; }
        isAnyEventStarting() { return false; }
    }
    class Game_Event { constructor(mapId, id) { this._mapId = mapId; this._eventId = id; } }
    class Scene_Base { fadeOutAll() {} slowFadeSpeed() { return 60; } }
    class Scene_Boot extends Scene_Base { start() {} }
    class Scene_Map extends Scene_Base { update() {} onMapLoaded() {} isFading() { return false; } }
    class Scene_Menu extends Scene_Base {}
    const log = [];
    const DataManager = {
        loadMapData() {}, onLoad() {}, createGameObjects() {}, extractSaveContents() {}, setupNewGame() {},
        makeSaveContents() { log.push("contents made"); return { system: env.$gameSystem }; },
        extractMetadata(o) { o.meta = {}; const re = /<([^<>:]+)(:?)([^>]*)>/g; let m; while ((m = re.exec(o.note))) o.meta[m[1]] = m[2] === ":" ? m[3] : true; }
    };
    const buffers = [];
    const AudioManager = {
        bgsVolume: 80, seVolume: 90, stopSe() {}, stopBgs() {},
        createBuffer(folder, name) {
            const b = { folder, name, playing: false, volume: 0, pitch: 1, pan: 0, plays: 0, isError() { return /^NoSuch/.test(this.name); }, isPlaying() { return this.playing; },
                play() { this.playing = true; this.plays++; }, stop() { this.playing = false; }, fadeOut(s) { this.faded = s; } };
            buffers.push(b);
            return b;
        }
    };
    const Graphics = { frameCount: 0, width: 1280, height: 720 };
    const SceneManager = { _scene: null, isSceneChanging: () => false };
    const env = { $gameSystem: null, $dataMap: null, $gameMap: null, $gameTemp: {}, $gameScreen: { brightness: () => 255 }, $gameMessage: { busy: false, isBusy() { return this.busy; } },
        $gamePlayer: { transferring: false, isTransferring() { return this.transferring; }, _needsMapReload: false, newMapId: () => 3, isToolSwinging: () => false, canMove: () => true } };
    const globals = { Game_System, Game_Map, Game_Event, Scene_Base, Scene_Boot, Scene_Map, Scene_Menu, DataManager, AudioManager, Graphics, SceneManager };
    for (const k of Object.keys(env)) Object.defineProperty(globals, k, { get: () => env[k], enumerable: true, configurable: true });
    const errors = [], warns = [];
    const w = unit.load(["TawernaCore"], { globals });
    w.console = Object.assign({}, console, { error: (...a) => errors.push(a.map(String).join(" ")), warn: (...a) => warns.push(a.map(String).join(" ")) });
    const T = w.Tawerna;
    new Scene_Boot().start();   // (the core's "tell" hooks go on at Scene_Boot.start, over every plugin)
    const heard = [];
    for (const n of T.EVENTS.core) T.on(n, p => heard.push([n, p]), { owner: "CoreMapTest" });
    const names = () => heard.map(h => h[0]);

    // ---------------------------------------------------------------- injection: the id ranges
    const page = () => ({ list: [{ code: 0, indent: 0, parameters: [] }] });
    const evd = (id, x, y) => ({ id, name: "CoreTest " + id, note: "<CoreTest:x=" + id + "><Flag>", x, y, pages: [page()] });
    let build = [780, 781], whenOn = false;
    const own = { id: 120, name: "Editor 120", note: "<Mine>", x: 1, y: 1, pages: [page()] };
    const mapData = () => { const events = [null, { id: 1, name: "Editor 1", note: "", x: 2, y: 2, pages: [page()] }]; for (let i = 2; i < 120; i++) events.push(null); events.push(JSON.parse(JSON.stringify(own))); return { note: "", events }; };
    const builder = () => build.map((id, i) => evd(id, 5 + i, 5)).concat([evd(795, 7, 5)]);   // (795: outside the range)
    T.inject(3, { ids: [780, 789], owner: "CoreTest", build: builder });
    const tryIt = spec => { try { T.inject(3, spec); return "ok"; } catch (e) { return e.message; } };
    const res = {
        overlap: tryIt({ ids: [785, 790], owner: "Other", build: () => [] }), story: tryIt({ ids: [900, 901], owner: "Other", build: () => [] }),
        forestry: tryIt({ ids: [1500, 1501], owner: "Other", build: () => [] }), zasoby: tryIt({ ids: [2150, 2151], owner: "Other", build: () => [] }),
        same: tryIt({ ids: [780, 789], owner: "CoreTest", build: builder }), free: tryIt({ ids: [790, 791], owner: "Other", build: () => [] }),
        noOwner: tryIt({ ids: [792, 792], build: () => [] }), badIds: tryIt({ ids: [0, 5], owner: "Other2", build: () => [] }), noBuild: tryIt({ ids: [793, 793], owner: "Other3" })
    };
    t.check("id ranges: an overlap with another owner is refused (also a reserved range: Story 901-902, Forestry 1000-1999, Zasoby 2100-2299); the same owner again and a free range are fine; no owner, bad ids, no build: errors",
        /overlap 780-789 of CoreTest/.test(res.overlap) && /Story/.test(res.story) && /Forestry/.test(res.forestry) && /Zasoby/.test(res.zasoby) && res.same === "ok" && res.free === "ok" &&
        /an owner is needed/.test(res.noOwner) && /bad ids/.test(res.badIds) && /has no build/.test(res.noBuild) && T.inject.list().filter(i => i.owner === "CoreTest").length === 1, res);
    T.inject(3, { ids: [120, 120], owner: "CoreTestEditor", build: () => [{ id: 120, name: "not mine", note: "", x: 1, y: 1, pages: [] }] });
    T.inject(3, { ids: [798, 798], owner: "CoreTestWhen", when: () => whenOn, build: () => [evd(798, 9, 5)] });
    const seen = [];
    T.onMapData((data, mapId) => seen.push([mapId, data.events.filter(Boolean).map(e => e.id)]), { owner: "CoreTestData" });
    T.onMapData(() => { throw new Error("deliberate data hook failure"); }, { owner: "CoreTestBroken" });

    // ---------------------------------------------------------------- injection: a map's data as it loads
    const loadMap = (id, data) => { env.$dataMap = data; DataManager.loadMapData(id); DataManager.onLoad(data); return data; };
    errors.length = 0;
    const d3 = loadMap(3, mapData());
    const e780 = d3.events[780], holes = [];
    for (let i = 0; i < d3.events.length; i++) if (!(i in d3.events) || d3.events[i] === undefined) holes.push(i);
    t.check("the events come into Map003's data as it loads (780, 781) with their meta and a hidden owner; one outside its range (795) is left out and told; no holes in the list",
        !!e780 && !!d3.events[781] && !d3.events[795] && e780.meta.Flag === true && e780.meta.CoreTest === "x=780" && e780._twOwner === "CoreTest" && !Object.keys(e780).includes("_twOwner") &&
        JSON.stringify(T.injected(3)) === '{"CoreTest":[780,781]}' && holes.length === 0 && d3.events.length === 782 && warns.some(x => /event id 795 is outside 780-789/.test(x)),
        { injected: T.injected(3), holes: holes.slice(0, 5), len: d3.events.length });
    t.check("... an editor's own event on an id is left alone (and told); when() false puts nothing in; onMapData runs after the injections (one that throws is told)",
        d3.events[120].name === "Editor 120" && !d3.events[798] && warns.some(x => /map 3 has its own event 120/.test(x)) && seen.length === 1 && seen[0][0] === 3 &&
        seen[0][1].includes(780) && seen[0][1].includes(781) && errors.some(e => /onMapData \(CoreTestBroken\)/.test(e)), { seen, errors });
    const d4 = loadMap(4, mapData()), other = { events: [null] };
    env.$dataMap = d4;
    DataManager.onLoad(other);
    t.check("another map (Map004) gets none of Map003's events; data that is not the map being loaded is not touched",
        !d4.events[780] && JSON.stringify(T.injected(4)) === "{}" && other.events.length === 1 && seen.length === 2 && seen[1][0] === 4, { injected4: T.injected(4) });

    // when() true; then false while the event is live, and a transfer within the same map: the live event keeps its data
    whenOn = true;
    let d = loadMap(3, mapData());
    const came = !!d.events[798];
    env.$gameMap = new Game_Map(3);
    env.$gameMap._events[798] = new Game_Event(3, 798);
    whenOn = false;
    env.$gamePlayer.transferring = true;
    d = loadMap(3, mapData());
    const kept = !!d.events[798] && /CoreTest:x=798/.test(d.events[798].note) && (T.injected(3).CoreTestWhen || []).includes(798);
    env.$gamePlayer._needsMapReload = true;
    d = loadMap(3, mapData());
    const reload = !d.events[798];
    env.$gamePlayer._needsMapReload = false;
    env.$gamePlayer.transferring = false;
    t.check("when() true: the event comes in; when() false, then a transfer within the same map: the live event keeps its data (no live event without data) - not when a reload is asked for",
        came && kept && reload, { came, kept, reload });
    // Game_Map.setup with when() false: its events leave the data before the map makes its events; mapLeave / mapEnter round it
    whenOn = true;
    d = loadMap(3, mapData());
    whenOn = false;
    heard.length = 0;
    const gm = new Game_Map(4);
    gm.setup(3);
    t.check("Game_Map.setup: a when()-false owner's events are taken out of the data first; mapLeave { mapId: 4, to: 3 }, then mapEnter { mapId: 3, from: 4 }",
        d.events[798] === null && gm.setups === 1 && gm.mapId() === 3 && JSON.stringify(heard) === '[["mapLeave",{"mapId":4,"to":3}],["mapEnter",{"mapId":3,"from":4}]]', heard);
    // an older save on the map: made before 781 existed and with 782 that the data no longer has
    d = loadMap(3, mapData());
    env.$gameMap = new Game_Map(3);
    env.$gameMap._events[780] = new Game_Event(3, 780);
    env.$gameMap._events[782] = new Game_Event(3, 782);
    heard.length = 0;
    const scene = new Scene_Map();
    scene.onMapLoaded();
    const evs = env.$gameMap._events;
    t.check("an older save on the map: the missing event (781) is added, the orphaned one (782, no data) taken away; then mapReady { mapId: 3, transfer: false }",
        evs[781] instanceof Game_Event && evs[781]._eventId === 781 && !(782 in evs) && !!evs[780] && names().join() === "mapReady" && heard[0][1].mapId === 3 && heard[0][1].transfer === false,
        { evs: Object.keys(evs), heard: names() });

    // ---------------------------------------------------------------- the bus's own events
    T.state.define("ctLoad", { n: 0 }, { version: 1, adopt: "_ctLoadOld" });
    let atLoad = null;
    T.on("load", () => { atLoad = env.$gameSystem._tw && env.$gameSystem._tw.ctLoad ? env.$gameSystem._tw.ctLoad.n : null; });
    heard.length = 0; log.length = 0;
    DataManager.setupNewGame();
    T.on("save", () => log.push("save heard"));
    DataManager.makeSaveContents();
    const sys = Object.assign(new Game_System(), { _ctLoadOld: { n: 4 } });
    env.$gameSystem = sys;
    DataManager.extractSaveContents({ system: sys });
    t.check("newGame { boot: false }; save is sent before the contents are made; load after they are taken - the states already looked over (an old key adopted)",
        names().join() === "newGame,save,load" && heard[0][1].boot === false && log.join() === "save heard,contents made" && atLoad === 4, { heard: names(), log, atLoad });

    // ---------------------------------------------------------------- the clock: dayStart, hourChange, sleep, wake
    SceneManager._scene = scene;
    const frame = (n = 1) => { for (let i = 0; i < n; i++) { Graphics.frameCount++; scene.update(); } };
    sys._day = 5; sys._hour = 10.5;
    frame();
    heard.length = 0;
    sys._day = 6;
    frame();
    sys._hour = 11.2;
    frame();
    sys._hour = 11.9;
    frame();
    t.check("the map's frames: dayStart { day: 6, prev: 5 } when the day changes; hourChange { hour: 11, prev: 10 } when the whole hour does; nothing within the hour",
        JSON.stringify(heard) === '[["dayStart",{"day":6,"prev":5}],["hourChange",{"hour":11,"prev":10,"day":6}]]', heard);
    sys._hour = 22;
    frame();
    heard.length = 0;
    sys.sleepUntilHour(7);
    t.check("sleepUntilHour(7) at 22:00: sleep { day 6, hour 22, until 7 }, then wake { day 7, hour 7, from day 6 }, then dayStart 7 and hourChange 22 -> 7",
        names().join() === "sleep,wake,dayStart,hourChange" && heard[0][1].until === 7 && heard[0][1].day === 6 && heard[1][1].day === 7 && heard[1][1].from.day === 6 &&
        heard[1][1].from.hour === 22 && heard[2][1].day === 7 && heard[2][1].prev === 6 && heard[3][1].prev === 22, heard);

    // ---------------------------------------------------------------- the map's updater and the calm check
    const up = { a: 0, calm: 0, order: [] };
    const u1 = T.onMapUpdate(() => { up.a++; }, { owner: "CoreTest", name: "every5", every: 5 });
    const u2 = T.onMapUpdate(() => { up.calm++; }, { owner: "CoreTest", name: "calm", calm: true });
    const u3 = T.onMapUpdate(() => { if (up.order.length < 4) up.order.push("late"); }, { owner: "CoreTest", name: "late", priority: 5 });
    const u4 = T.onMapUpdate(() => { if (up.order.length < 4) up.order.push("early"); }, { owner: "CoreTest", name: "early", priority: -5 });
    const calm0 = [T.isCalm(), T.whyNotCalm().length];
    frame(40);
    t.check("onMapUpdate: every 5 frames (8 in 40), a calm one every calm frame (40), priority orders them (early before late); calm with nothing going on",
        calm0[0] === true && calm0[1] === 0 && up.a === 8 && up.calm === 40 && up.order.join(",") === "early,late,early,late", { up, calm0 });
    env.$gameMessage.busy = true;
    up.calm = 0;
    frame(20);
    const busy = { calm: up.calm, isCalm: T.isCalm(), why: T.whyNotCalm(), input: T.isCalm(null, "input"), noMsg: T.isCalm(null, { message: false }), only: T.isCalm(null, { only: ["transfer"] }) };
    env.$gameMessage.busy = false;
    t.check("a message on screen: not calm (message), the calm updater waits; 'input' and { message: false } and { only } choose the checks",
        busy.calm === 0 && !busy.isCalm && busy.why.join() === "message" && !busy.input && busy.noMsg && busy.only, busy);
    env.$gameTemp._farmMenuOpen = true;
    const farm = { isCalm: T.isCalm(), why: T.whyNotCalm(), without: T.isCalm(null, { farmMenu: false }), strict: T.whyNotCalm(null, "strict"), settle: T.isCalm(null, { farmMenu: false, settle: 1e9 }),
        settled: T.isCalm(null, { farmMenu: false, settle: 10 }) };
    env.$gameTemp._farmMenuOpen = false;
    env.$gamePlayer.isToolSwinging = () => true;
    env.$gameScreen.brightness = () => 120;
    const strict = { auto: T.isCalm(), why: T.whyNotCalm(null, "strict") };
    env.$gamePlayer.isToolSwinging = () => false;
    env.$gameScreen.brightness = () => 255;
    SceneManager._scene = new Scene_Menu();
    const menu = T.whyNotCalm();
    SceneManager._scene = scene;
    T.ui.running = {};
    const mini = T.whyNotCalm();
    T.ui.running = null;
    t.check("the farm menu open: not calm (farmMenu) unless { farmMenu: false }; settle waits for the map's frames; 'strict' also asks the tool and the fade; a menu scene is not the map; a mini-game is not calm",
        !farm.isCalm && farm.why.join() === "farmMenu" && farm.without && farm.strict.includes("farmMenu") && !farm.settle && farm.settled && strict.auto && strict.why.join() === "tool,fade" &&
        menu.join() === "onMap" && mini.join() === "miniGame", { farm, strict, menu, mini });
    errors.length = 0;
    const u5 = T.onMapUpdate(() => { throw new Error("deliberate updater failure"); }, { owner: "CoreTest", name: "broken" });
    const before = up.a;
    frame(10);
    const dbg = T.debug.updaters().filter(u => u.owner === "CoreTest");
    t.check("an updater that throws is told once and turned off - the other updaters go on; the debug list shows the calls and the state",
        u5.on === false && u5.errors === 1 && errors.length === 1 && /CoreTest\.broken \(turned off\)/.test(errors[0]) && up.a === before + 2 &&
        dbg.some(u => u.name === "every5" && u.calls === up.a && u.every === 5) && dbg.some(u => u.name === "broken" && !u.on && u.errors === 1), { dbg, errors });
    for (const u of [u1, u2, u3, u4, u5]) u.off();
    t.check("off(): the updaters are gone", T.debug.updaters().filter(u => u.owner === "CoreTest").length === 0);

    // ---------------------------------------------------------------- sound
    const A = T.audio;
    let n = 0;
    for (let i = 0; i < 20; i++) if (A.se("Cursor1", { volume: 50, pitch: 120, pan: -50 })) n++;
    const seBuf = buffers.filter(b => b.name === "Cursor1"), set1 = seBuf.map(b => [b.volume, b.pitch, b.pan, b.plays]);
    Graphics.frameCount++;
    const nextFrame = A.se("Cursor1");
    warns.length = 0;
    const missing = [A.se("NoSuchSound"), A.se("NoSuchSound"), A.isMissing("NoSuchSound")];
    t.check("Tawerna.audio.se: at most seBudget (6) SEs a frame, the rest dropped, the next frame plays again; from a pool of 3 buffers; the volume a share of the SE option (90 x 50%), the pitch, the pan; a missing SE silent and told once",
        n === A.seBudget && n === 6 && nextFrame === true && seBuf.length === 3 && set1.every(x => Math.abs(x[0] - 0.45) < 1e-9 && x[1] === 1.2 && x[2] === -0.5 && x[3] === 2) &&
        missing.join() === "false,false,true" && warns.filter(x => /NoSuchSound/.test(x)).length === 1, { n, set1, missing, warns });
    const L = A.bgsLayer("CoreTest:wind", { name: "Wind3", pitch: 90, max: 22, scale: () => 0.5, owner: "CoreTest" }).set(30, -0.5);
    const M = A.bgsLayer("CoreTest:missing", { name: "NoSuchBgs" }).set(20);
    frame(150);
    const li = L.info(), lb = L.buf, mi = M.info();
    t.check("a BGS layer fades in to its target clamped to its max (30 -> 22), its volume = the BGS option x the level x scale() (0.8 x 0.22 x 0.5), panned, looping from bgs/; a missing file stays silent",
        li.playing && li.vol === 22 && Math.abs(lb.volume - 0.088) < 1e-6 && lb.pan === -0.5 && lb.folder === "bgs/" && lb.pitch === 0.9 && lb.plays === 1 && !mi.playing &&
        A.layer("CoreTest:wind") === L && A.bgsLayer("CoreTest:wind") === L, { li, mi });
    L.set(0);
    frame(60);
    const mid = L.info();
    frame(240);
    const gone = L.info();
    L.set(20);
    frame(100);
    const again = L.info().playing;
    AudioManager.stopBgs();
    const stopped = L.info();
    t.check("... set(0) fades it down (under half after a second) and stops it when silent; set again: it plays again; AudioManager.stopBgs() stops every layer at once",
        mid.playing && mid.vol < 10 && mid.vol > 0 && !gone.playing && gone.vol === 0 && again && !stopped.playing && stopped.vol === 0 && stopped.target === 0, { mid, gone, stopped });

    // ---------------------------------------------------------------- popups
    const loot = [], tops = [], help = [];
    env.$gameTemp = { pushLootPopup: (icon, text, color, extra) => loot.push([icon, text, color, extra]), pushTopNotice: (text, color, sub) => tops.push([text, color, sub]) };
    const r = [T.popup("Potrzebujesz siekiery", { icon: 2, kind: "need" }), T.popup.need(3, "Potrzebujesz łopaty"), T.popup("Nowa pamiątka", { top: true, color: "#ffd23f", sub: "Kufel" }),
        T.popup("Drewno +2", { icon: 7, gain: 2 }), T.popup("", 1)];
    const menuScene = Object.assign(new Scene_Menu(), { _helpWindow: { setText: s => help.push(s) } });
    SceneManager._scene = menuScene;
    const inMenu = [T.popup("Zjadłeś: chleb", { menu: true }), T.popup("Gdzie indziej")];
    t.check("Tawerna.popup: over the hero (the icon, red for a need), popup.need, top: the notice at the top with its second line, a gain into the gains' list, no text: nothing; in a menu its help line only when asked",
        r.join() === "true,true,true,true,false" && JSON.stringify(loot.slice(0, 2).map(p => [p[0], p[1], p[2]])) === '[[2,"Potrzebujesz siekiery","#ff9f8f"],[3,"Potrzebujesz łopaty","#ff9f8f"]]' &&
        tops.length === 1 && tops[0][1] === "#ffd23f" && tops[0][2].sub === "Kufel" && loot[2][2] === "#ffffff" && loot[2][3].gain === 2 && inMenu.join() === "true,false" && help.join() === "Zjadłeś: chleb",
        { loot, tops, help, r, inMenu });
});
