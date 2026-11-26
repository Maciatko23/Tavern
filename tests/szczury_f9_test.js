// F9 "Rój szczurów: 10 naraz" (the user, 2026-11-26: "daj w F9 opcję, że tworzy naraz 10 szczurów"): the row in 'Walka i zwierzęta' under
// 'Ruiny i podziemia', OK takes the menu back to the map and ten rats come out a few tiles off at once, one swarm, after him.
// CDP_PORT=9446.
"use strict";
const path = require("path");
const kit = require("./lib/kit.js");

kit.test({ port: 9446, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    t.check("a new game on the meadow (Map218)", await t.newGame({ hour: 12, quiet: true }));
    await t.eval("if (window.Combat) Combat.hero().level = 1; Creatures.clear(); 0");
    await t.eval("SceneManager.push(Scene_Debug); 0");
    await t.until("SceneManager._scene instanceof Scene_Debug && !SceneManager.isSceneChanging()", 20);
    await t.eval("(function(){ const s = SceneManager._scene; s.goTo(s._tabs._list.findIndex(c => c.name === 'Walka i zwierzęta'), 0); return 0; })()");
    await t.frames(6);
    const row = await t.json("(function(){ const l = SceneManager._scene._list, i = l._rows.findIndex(r => r.kind === 'cr_rats10'); return i < 0 ? null : { i, label: l._rows[i].label, after: l._rows[i - 1] && l._rows[i - 1].kind }; })()");
    t.check("'Walka i zwierzęta' has the row 'Rój szczurów: 10 naraz' right after the ruins' boss", !!row && row.label === "Rój szczurów: 10 naraz" && row.after === "cr_boss", row);
    await t.eval(`(function(){ const s = SceneManager._scene, l = s._list; l.select(${row ? row.i : 0}); s.onOk(); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20);
    await t.frames(20);
    const rats = await t.json(`(function(){ const r = Creatures.list.filter(c => c._base === "szczur" && !c._dead), p = $gamePlayer;
        return { n: r.length, swarms: new Set(r.map(c => c._swarm)).size, engaged: r.filter(c => c._engaged).length, far: Math.max(...r.map(c => Math.hypot(c._realX - p._realX, c._realY - p._realY))) }; })()`);
    t.check("back on the map: ten rats at once, one swarm, all after him, a few tiles off (like any F9 creature: 4-6 tiles away, the swarm round that spot)", rats.n === 10 && rats.swarms === 1 && rats.engaged === 10 && rats.far <= 10.5, rats);
    await t.frames(30);
    await t.shot(path.join(__dirname, "szczury_f9.png"));
    await t.eval("Creatures.clear(); 0");
});
