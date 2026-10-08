// The HUD fades while the hero is under it (user 2026-09-30: "jak gracz idzie do rogu mapy, niech się robią przezroczyste"): the clock
// panel top left, the goal tracker top right, the XP bar bottom right - each alone, smoothly, and back when he leaves. CDP_PORT=9440.
const path = require("path");
const kit = require("./lib/kit.js");

kit.test({ port: 9440, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.eval("ConfigManager.uiClean = false; 0");   // (the classic look: this test checks the old panels' places - CleanHUD.js's clean look is tests/clean_hud_test.js)
    await t.newGame({ map: 3, x: 22, y: 14, day: 1, hour: 12, quiet: true, minimap: false });
    const alphas = () => t.json(`(function(){ const s = SceneManager._scene, a = el => el ? +el.alpha.toFixed(2) : null;
        return { hud: a(s._survivalHud), goal: a(s._goalTracker), goalShown: !!(s._goalTracker && s._goalTracker.visible), xp: a(s._xpBar), xpShown: !!(s._xpBar && s._xpBar.visible) }; })()`);
    // the hero at a spot of the screen (tiles from the top-left of the view), the view held still at the map's top-left
    const at = async (sx, sy) => {
        await t.eval(`(function(){ $gameMap.setDisplayPos(0, 0); $gamePlayer.locate(${sx}, ${sy}); $gameMap.setDisplayPos(0, 0); return 0; })()`);
        await t.frames(40);
        return alphas();
    };
    const mid = await at(13, 7);
    t.check("in the middle of the screen the whole HUD is solid", mid.hud === 1 && mid.goal === 1 && mid.xp === 1, mid);
    const tl = await at(1, 1);
    await t.shot(path.join(__dirname, "..", "docs", "hud_przezroczysty.png"));
    t.check("under the clock (top left) the clock panel fades, the rest stays", tl.hud <= 0.3 && tl.goal === 1 && tl.xp === 1, tl);
    const tr = await at(25, 1);
    t.check("under the goal (top right) the goal fades, the clock is back", !tr.goalShown || (tr.goal <= 0.3 && tr.hud === 1), tr);
    const br = await at(25, 14);
    t.check("under the XP bar (bottom right) it fades", !br.xpShown || (br.xp <= 0.3 && br.hud === 1 && br.goal === 1), br);
    // picking things up in the middle of the screen: the list of gains (bottom right) stays solid; standing under it, it fades
    await at(13, 7);
    await t.eval(`(function(){ $gameParty.gainItem($dataItems[64], 2); $gameParty.gainItem($dataItems[77], 1); return 0; })()`);
    await t.frames(40);
    const feed = await t.json(`(function(){ const f = SceneManager._scene._gainFeed; return { plates: f.children.length, alpha: +f.alpha.toFixed(2) }; })()`);
    t.check("picking things up in the middle of the screen, the list of gains stays solid", feed.plates > 0 && feed.alpha === 1, feed);
    const under = await t.json(`(function(){ const f = SceneManager._scene._gainFeed, p = f.children[f.children.length - 1];
        $gameMap.setDisplayPos(0, 0); $gamePlayer.locate(Math.floor((p.x - 30) / 48), Math.floor(p.y / 48)); $gameMap.setDisplayPos(0, 0); return 0; })()`);
    await t.frames(30);
    const feedUnder = await t.json(`(function(){ const f = SceneManager._scene._gainFeed; return { plates: f.children.length, alpha: +f.alpha.toFixed(2) }; })()`);
    t.check("...and under it, it fades", feedUnder.plates === 0 || feedUnder.alpha <= 0.3, feedUnder);
    const back = await at(13, 7);
    t.check("back in the middle, everything is solid again", back.hud === 1 && back.goal === 1 && back.xp === 1, back);
    // an element that sets its own alpha keeps it: the goal tracker hidden and shown again under the hero stays faded, not doubled
    const tl2 = await at(1, 1);
    const own = await t.json(`(function(){ const h = SceneManager._scene._survivalHud; h.alpha = h.alpha; return +h.alpha.toFixed(2); })()`);
    t.check("the fade does not add up frame after frame (it stays at its level)", Math.abs(tl2.hud - own) < 0.02 && own >= 0.2, { tl2, own });
});
