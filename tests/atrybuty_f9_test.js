// F9 "Wszystkie atrybuty na maksimum (60)" (the user, 2026-11-26: "zrób w F9, że gracz dostaje wszystkie atrybuty na maxa"): the row
// under the experience rows; OK sets every attribute to Combat.ATTR_MAX, the free points stay, the health grows to the new top (full);
// a second OK says they are already there. CDP_PORT=9448.
"use strict";
const kit = require("./lib/kit.js");

kit.test({ port: 9448, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    t.check("a new game on the meadow (Map218)", await t.newGame({ hour: 12, quiet: true }));
    const h0 = await t.json("(function(){ const h = Combat.hero(); h.points = 4; return { attr: Object.values(h.attr).join(), mhp: $gameParty.leader().mhp, points: h.points }; })()");
    await t.eval("SceneManager.push(Scene_Debug); 0");
    await t.until("SceneManager._scene instanceof Scene_Debug && !SceneManager.isSceneChanging()", 20);
    const found = await t.json(`(function(){ const s = SceneManager._scene, n = s._tabs._list.length;
        for (let i = 0; i < n; i++) { s.goTo(i, 0); const l = s._list, k = l._rows.findIndex(r => r.kind === "isleAttrMax"); if (k >= 0) return { tab: s._tabs._list[i].name, k, label: l._rows[k].label, before: l._rows[k - 1] && l._rows[k - 1].kind }; }
        return null; })()`);
    t.check("the row 'Wszystkie atrybuty na maksimum (60)' right under the experience rows", !!found && found.label === "Wszystkie atrybuty na maksimum (60)" && found.before === "isleXp", found);
    const ok = async () => { await t.eval(`(function(){ const s = SceneManager._scene; s._list.select(${found ? found.k : 0}); s.onOk(); return 0; })()`); await t.frames(6); };
    await ok();
    const h1 = await t.json("(function(){ const h = Combat.hero(), a = $gameParty.leader(); return { attr: Object.values(h.attr).join(), mhp: a.mhp, hp: a.hp, points: h.points, scene: SceneManager._scene.constructor.name }; })()");
    t.check("OK: every attribute 60, the free points kept, the health up to its new top and full, the menu still open", h1.attr === "60,60,60,60,60" && h1.points === h0.points && h1.mhp > h0.mhp && h1.hp === h1.mhp && h1.scene === "Scene_Debug", { h0, h1 });
    await ok();
    const h2 = await t.json("(function(){ const h = Combat.hero(); return { attr: Object.values(h.attr).join() }; })()");
    t.check("a second OK: nothing more (they are at the top)", h2.attr === "60,60,60,60,60", h2);
    await t.eval("SceneManager._scene.popScene(); 0");
});
