// The cat in the F9 menu (user 2026-10-01: "dodaj jego zachowanie do konsoli F9"; 2026-11-11: the 'Kot' tab is gone, its commands are
// the 'Kot Mruczek' section of 'Fabuła i postacie', the long description of its day dropped): in grandpa's house (since 2026-11-17 the
// hut of the new world, Map224) its rows send it to its places (back on the map to watch), let it choose, pet it; away from the house -
// the way to it (to the hut, by the hearth). CDP_PORT=9445.
const path = require("path");
const kit = require("./lib/kit.js");

kit.test({ port: 9445, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ story: true, skipIntro: true, day: 3, hour: 11, quiet: true, minimap: false });   // (grandpa's welcome skipped: the cat waits while anyone talks)
    await t.eval(`(function(){ $gamePlayer.locate(2, 6); return 0; })()`);
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 20);
    await t.frames(40);
    const openCat = async () => {
        await t.eval(`(function(){ SceneManager.push(Scene_Debug); return 0; })()`);
        await t.until("SceneManager._scene instanceof Scene_Debug && !SceneManager.isSceneChanging()", 20);
        await t.eval(`(function(){ SceneManager._scene.goTo(SceneManager._scene._tabs._list.findIndex(c => c.name === 'Fabuła i postacie'), 0); return 0; })()`);
        await t.frames(6);
        return t.json(`(function(){ const l = SceneManager._scene._list; return l._rows.map(r => ({ kind: r.kind, label: r.label, spot: r.spot || null })); })()`);
    };
    const rows = await openCat();
    const head = rows.findIndex(r => r.kind === "info" && r.label === "Kot Mruczek:");
    t.check("in grandpa's house 'Fabuła i postacie' has the 'Kot Mruczek:' section with the way to the house, and no long text about its day",
        head >= 0 && rows.some(r => r.kind === "catHouse") && !rows.some(r => /^ +Robi: |Jego dzień/.test(r.label)), rows.slice(head, head + 8).map(r => r.label));
    t.check("...and has its doings to send it to (hearth, rug, sill, stroll, its own choice, petting)",
        ["hearth", "rug", "sill", "stroll"].every(k => rows.some(r => r.kind === "cat" && r.spot === k)) && rows.some(r => r.kind === "catChoose") && rows.some(r => r.kind === "catPet"), rows.filter(r => r.kind !== "info").map(r => r.label));
    // 'Wskocz na parapet okna': back on the map, the cat goes to the window and jumps up
    await t.eval(`(function(){ const s = SceneManager._scene, l = s._list, i = l._rows.findIndex(r => r.kind === "cat" && r.spot === "sill"); l.select(i); s.onOk(); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20);
    const sent = await t.json("HomeLife.catState()");
    t.check("'Wskocz na parapet okna' takes the menu back to the map and the cat sets off for the sill (a jump in its plan)", sent.spot === "sill" && (sent.steps.includes("hop") || sent.cur === "hop"), sent);
    await t.until("(s => s.cur === 'stay' && s.spot === 'sill' && !s.perch)(HomeLife.catState())", 40);
    await openCat();
    await t.eval(`(function(){ SceneManager._scene.popScene(); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20);
    await t.until("(s => s.cur === 'stay' && s.spot === 'sill' && s.perch)(HomeLife.catState())", 40);
    const up = await t.json("HomeLife.catState()");
    t.check("...it jumps up and sits on the sill", up.spot === "sill" && up.cur === "stay" && up.pose === "sit" && up.perch, up);
    // the tab again: its orders are still there
    const rows2 = await openCat();
    t.check("the section still has the orders (hearth, rug, stroll, its own choice, a stroke)", rows2.some(r => r.kind === "cat") && rows2.some(r => r.kind === "catChoose") && rows2.some(r => r.kind === "catPet"), rows2.filter(r => r.kind !== "info").map(r => r.label));
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
    // away from the house: 'Do domu dziadka' takes the hero into the hut, by the hearth
    await t.go(218, 30, 18);
    await openCat();
    await t.eval(`(function(){ const s = SceneManager._scene, l = s._list, i = l._rows.findIndex(r => r.kind === "catHouse"); l.select(i); s.onOk(); return 0; })()`);
    const home = await t.until(t.onMap(224), 20);
    const at = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), !!$gameMap.event(960)]");
    t.check("away from the house: the way to it puts the hero in the hut by the hearth (Map224 5,6), the cat there", home && JSON.stringify(at) === JSON.stringify([224, 5, 6, 8, true]), at);
});
