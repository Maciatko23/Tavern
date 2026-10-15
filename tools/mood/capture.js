// Before / after shots of Mood.js (the picture's mood: bloom, grading, vignette) - the same frame drawn twice: the game loop stopped,
// rendered with the effects (po_) and without (przed_). Into docs/klimat/<scene>_przed.png / _po.png, then tools/mood/zestawienie.py.
//   CDP_PORT=9489 node tools/mood/capture.js [scene...]
// Scenes: las_poludnie, zloty_zachod, noc_ognisko, tawerna_wieczor, burza, zima, podziemia, jaskinia, mroczny_las_dzien,
// mroczny_las_noc, walka_noc
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "klimat");
const only = process.argv.slice(2);

// the hero with a lit torch (as the bag's "use"), a campfire on Map003 at (x, y), the view held still
const CAMP = (x, y) => `(function(){ const F = $gameSystem._farm, L = (F.buildings[$gameMap.mapId()] = F.buildings[$gameMap.mapId()] || []); L.length = 0;
    L.push({ id: F.nextId++, type: "campfire", x: ${x}, y: ${y}, last: 1 }); F.rev++; return 0; })()`;
const TORCH = `(function(){ $gameParty.gainItem($dataItems[59], 1); const a = $gameParty.leader(), it = $dataItems[59]; a.useItem(it);
    const act = new Game_Action(a); act.setItemObject(it); act.applyGlobal(); return 0; })()`;
const VIEW = (x, y) => `(function(){ $gamePlayer.updateScroll = function(){}; $gameMap.setDisplayPos(${x}, ${y}); return 0; })()`;
const NO_CLOUDS = `(function(){ for (const c of SceneManager._scene._spriteset._cloudSprites || []) { c._baseOpacity = 0; c.opacity = 0; } return 0; })()`;
const CLEAR_POPS = `(function(){ const s = SceneManager._scene; if (s._lootLayer) s._lootLayer.removeChildren(); if ($gameTemp._lootPopups) $gameTemp._lootPopups.length = 0; return 0; })()`;

const SCENES = {
    async las_poludnie(t) {
        await t.newGame({ map: 3, x: 26, y: 15, day: 38, hour: 12, quiet: true, minimap: false });
        await t.eval(VIEW(10, 5));
    },
    async zloty_zachod(t) {
        await t.newGame({ map: 4, x: 20, y: 16, day: 38, hour: 20.35, quiet: true, minimap: false });
        await t.eval(VIEW(8, 8));
    },
    async noc_ognisko(t) {
        await t.newGame({ map: 3, x: 28, y: 12, dir: 6, day: 10, hour: 23, quiet: true, minimap: false });
        await t.eval(VIEW(13.4, 4));
        await t.eval(CAMP(31, 11));
        await t.eval(TORCH);
        await t.until("Torch.isLit()", 10);
        await t.frames(40);
        await t.eval(NO_CLOUDS);
    },
    async tawerna_wieczor(t) {
        await t.newGame({ map: 1, x: 50, y: 31, day: 12, hour: 22, quiet: true, minimap: false });
        await t.frames(60);
    },
    async burza(t) {
        await t.newGame({ map: 3, x: 26, y: 15, day: 38, hour: 15, quiet: true, minimap: false, calm: false });
        await t.eval(VIEW(10, 5));
        await t.eval("delete $gameSystem._stormForce; $gameSystem.setDayNightHour(15); Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.7); Storm.state.nextStrike = Storm.state.t + 100000; 0");
        await t.until("Storm.level() > 0.85 && $gameScreen.weatherPower() > 6", 40);
        await t.until("Storm.flash() < 0.01", 10);
    },
    async zima(t) {
        await t.newGame({ map: 3, x: 26, y: 15, day: 94, hour: 12, quiet: true, minimap: false });
        await t.eval(VIEW(10, 5));
        await t.eval("$gameScreen.changeWeather('snow', 4, 0); 0");
        await t.frames(90);
    },
    async podziemia(t) {
        await t.newGame({ map: 11, x: 15, y: 12, dir: 8, day: 30, hour: 22, quiet: true, minimap: false });
        await t.frames(60);
    },
    async jaskinia(t) {
        await t.newGame({ map: 14, x: 18, y: 18, dir: 8, day: 30, hour: 14, quiet: true, minimap: false });
        await t.frames(60);
    },
    async mroczny_las_dzien(t) {
        await t.newGame({ map: 12, x: 12, y: 10, day: 38, hour: 12, quiet: true, minimap: false });
        await t.frames(30);
    },
    async mroczny_las_noc(t) {
        await t.newGame({ map: 12, x: 12, y: 10, day: 38, hour: 23, quiet: true, minimap: false });
        await t.eval(TORCH);
        await t.until("Torch.isLit()", 10);
        await t.frames(40);
    },
    async walka_noc(t) {
        await t.newGame({ map: 3, x: 28, y: 12, dir: 6, day: 10, hour: 23, quiet: true, minimap: false });
        await t.eval(VIEW(13.4, 4));
        await t.eval(CAMP(31, 11));
        await t.eval(TORCH);
        await t.until("Torch.isLit()", 10);
        await t.eval("$gameSystem._combatMode = true; window.__pack = Hunting.spawnPack(33, 13, 3); for (const w of __pack.members) w._frozen = true; 0");
        await t.frames(60);
        await t.eval(NO_CLOUDS);
        // (the shot at the pulse's strongest)
        await t.until("(function(){ const s = SceneManager._scene._spriteset._mood; return !!s && s.pulse > 0.97; })()", 5, 16);
    }
};

kit.test({ plugins: ["Mood"], port: 9489 }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    for (const [name, setup] of Object.entries(SCENES)) {
        if (only.length && !only.includes(name)) continue;
        await setup(t);
        await t.eval(CLEAR_POPS);
        await t.frames(10);
        // the same frame twice: the loop stopped, the look snapped to what the place asks, drawn with and without the effects
        await t.eval("Graphics.stopGameLoop(); Mood.snap(); Mood.filter().enabled = true; Graphics._app.render(); 0");
        await t.wait(200);
        await t.shot(path.join(OUT, name + "_po.png"));
        const info = await t.json("Mood.info()");
        await t.eval("Mood.filter().enabled = false; Graphics._app.render(); 0");
        await t.wait(200);
        await t.shot(path.join(OUT, name + "_przed.png"));
        await t.eval("Graphics.startGameLoop(); 0");
        await t.frames(5);
        const c = info.cur || {};
        console.log(name.padEnd(16), info.kind, "vig", (info.state && info.state.vig || 0).toFixed(2), "bloom", (c.bloom || 0).toFixed(2), "thr", (c.thr || 0).toFixed(2),
            "sat", [c.satLo, c.satHi].map(v => (v || 0).toFixed(2)).join("/"));
    }
    t.check("no console errors while shooting", t.errors().length === 0, t.errors().slice(-3));
}).catch(e => { console.log("ERR", e); process.exit(1); });
