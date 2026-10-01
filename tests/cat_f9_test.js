// The cat in the F9 menu (user 2026-10-01: "dodaj jego zachowanie do konsoli F9"): in grandpa's house the 'Kot' tab says what
// Mruczek does now, where, for how long and what is next; its rows send it to its places (back on the map to watch), let it
// choose, pet it. CDP_PORT=9445.
const path = require("path");
const kit = require("./lib/kit.js");

kit.test({ port: 9445, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ story: true, skipIntro: true, day: 3, hour: 11, quiet: true, minimap: false });   // (grandpa's welcome skipped: the cat waits while anyone talks)
    await t.eval(`(function(){ $gamePlayer.locate(9, 7); return 0; })()`);
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 20);
    await t.frames(40);
    const openCat = async () => {
        await t.eval(`(function(){ SceneManager.push(Scene_Debug); return 0; })()`);
        await t.until("SceneManager._scene instanceof Scene_Debug && !SceneManager.isSceneChanging()", 20);
        await t.eval(`(function(){ SceneManager._scene.goTo(4, 0); return 0; })()`);
        await t.frames(6);
        return t.json(`(function(){ const l = SceneManager._scene._list; return l._rows.map(r => ({ kind: r.kind, label: r.label, spot: r.spot || null })); })()`);
    };
    const rows = await openCat();
    const text = rows.map(r => r.label);
    t.check("in grandpa's house the 'Kot' tab says what it does now, where and for how long",
        text.some(l => /^ +Robi: /.test(l)) && text.some(l => /^ +Gdzie: kratka \d+, \d+/.test(l)), text.slice(0, 6));
    t.check("...and has its doings to send it to (hearth, rug, sill, stroll, its own choice, petting)",
        ["hearth", "rug", "sill", "stroll"].every(k => rows.some(r => r.kind === "cat" && r.spot === k)) && rows.some(r => r.kind === "catChoose") && rows.some(r => r.kind === "catPet"), rows.filter(r => r.kind !== "info").map(r => r.label));
    await t.shot(path.join(__dirname, "..", "docs", "f9_kot.png"));
    // 'Wskocz na parapet okna': back on the map, the cat goes to the window and jumps up
    await t.eval(`(function(){ const s = SceneManager._scene, l = s._list, i = l._rows.findIndex(r => r.kind === "cat" && r.spot === "sill"); l.select(i); s.onOk(); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20);
    const sent = await t.json("HomeLife.catState()");
    t.check("'Wskocz na parapet okna' takes the menu back to the map and the cat sets off for the sill (a jump in its plan)", sent.spot === "sill" && (sent.steps.includes("hop") || sent.cur === "hop"), sent);
    await t.until("(s => s.cur === 'stay' && s.spot === 'sill' && !s.perch)(HomeLife.catState())", 40);
    const under = await openCat();
    t.check("on the floor under the window the tab says it is about to jump up", under.some(r => /Robi: siedzi pod oknem, zaraz wskoczy na parapet/.test(r.label)), under.slice(0, 4).map(r => r.label));
    await t.eval(`(function(){ SceneManager._scene.popScene(); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20);
    await t.until("(s => s.cur === 'stay' && s.spot === 'sill' && s.perch)(HomeLife.catState())", 40);
    const up = await t.json("HomeLife.catState()");
    t.check("...it jumps up and sits on the sill", up.spot === "sill" && up.cur === "stay" && up.pose === "sit" && up.perch, up);
    // the tab again: it says so
    const rows2 = await openCat();
    t.check("the tab now says it sits on the sill, for how long", rows2.some(r => /Robi: siedzi na parapecie okna/.test(r.label)) && rows2.some(r => /Jeszcze: ok\. \d+ s/.test(r.label)), rows2.slice(0, 5).map(r => r.label));
    // petting from the menu
    await t.eval(`(function(){ const s = SceneManager._scene, l = s._list, i = l._rows.findIndex(r => r.kind === "catPet"); l.select(i); s.onOk(); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20);
    const purr = await t.json("HomeLife.catState()");
    t.check("'Pogłaszcz' - it purrs", purr.purr > 0, purr);
    // its own choice: it plans something new at once
    await t.frames(260);
    await openCat();
    await t.eval(`(function(){ const s = SceneManager._scene, l = s._list, i = l._rows.findIndex(r => r.kind === "catChoose"); l.select(i); s.onOk(); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20);
    const own = await t.json("HomeLife.catState()");
    t.check("'Niech sam wybierze' - it picks a new doing at once (not the sill again)", own.spot && own.spot !== "sill" && (own.steps.length > 0 || own.cur), own);
});
