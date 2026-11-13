const kit = require("../../tests/lib/kit.js"); const path = require("path");
kit.test({ port: 9460, overlay: "tools/jarmark/overlay", overlayJs: true, errorCheck: "bez błędów" }, async t => {
    const J = e => t.json(e);
    console.log(JSON.stringify(await J("({ api: !!window.Jarmark, sceny: !!window.Jarmark_Sceny, q: !!TownQuests.Q.W17, steps: TownQuests.Q.W17 && TownQuests.Q.W17.steps.length, files: Watki.pliki().filter(f => f.name === 'jarmark').map(f => [f.st, f.keys, f.errors.length]) })")));
    await t.newGame({ map: 8, x: 52, y: 56, hour: 12, quiet: true, minimap: false, day: 49 });
    await t.eval("Jarmark.S().z = 1; Jarmark.S().otw = 1; 0");
    await t.eval("$gamePlayer.requestMapReload(); 0"); await t.go(8, 60, 56, 8); await t.frames(60);
    console.log(JSON.stringify(await J("({ n: $gameMap.events().filter(e => e.eventId() >= 4800 && e.eventId() < 5000).length, vis: $gameMap.events().filter(e => e.eventId() >= 4800 && e.eventId() < 5000 && !e.isTransparent()).map(e => e.eventId()) })")));
    await t.shot(path.resolve("tools/jarmark/podglad/g1.png"));
});
