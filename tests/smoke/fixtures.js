// Smoke: the saves in tests/fixtures/ (made by the game - tests/fixtures/make_fixtures.js) load as the load screen loads them: the
// saved map, place, day, purse, buildings and dog come back; the game then runs a few seconds with no error; saved again and loaded
// again it is the same. Old-save compatibility: a refactor must keep these green.
const kit = require("../lib/kit.js");

kit.test({}, async t => {
    const names = kit.fixtures();
    t.check("fixtures to load: " + names.join(", "), names.length >= 3, names);
    // what a save shows of itself (the fixture's summary is the same, taken when it was made)
    const state = () => t.json(`(function(){ const F = window.Farming && Farming.farm ? Farming.farm() : null, bl = F && F.buildings ? Object.values(F.buildings).reduce((a, l) => a.concat(l || []), []) : [];
        return { day: $gameSystem.dayNightDay(), map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, gold: $gameParty.gold(), items: $gameParty.items().length, story: !!$gameSystem._story,
            buildings: bl.filter(b => !b.site).map(b => b.type), dog: !!(window.Dog && Dog.state && Dog.state().tame), reputation: window.QuestBoard ? QuestBoard.reputation() : null }; })()`);
    const same = (a, b) => ["day", "map", "x", "y", "gold", "items", "story", "dog", "reputation"].every(k => a[k] === b[k]) && a.buildings.join() === b.buildings.join();
    for (const name of names) {
        const fx = kit.fixture(name), want = fx.summary;
        const up = await t.loadFixture(fx);
        const got = await state();
        t.check(`${name}: loads on its map (${want.map}, ${want.x},${want.y}, day ${want.day}) with its purse, bag, buildings, dog`, up && same(got, want), { got, want });
        const f0 = await t.eval("Graphics.frameCount");
        await t.frames(150);
        const run = await t.json(`({ scene: SceneManager._scene.constructor.name, error: (document.getElementById("errorPrinter") || {}).innerText || "", map: $gameMap.mapId(), frames: Graphics.frameCount - ${f0} })`);
        t.check(`${name}: the game runs on (150 frames, no error screen)`, run.scene === "Scene_Map" && !run.error && run.frames >= 150, run);
        const before = await state();
        await t.saveTo(2);
        await t.loadFrom(2);
        const after = await state();
        t.check(`${name}: saved and loaded again, it is the same`, same(before, after), { before, after });
    }
});
