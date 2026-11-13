const kit = require("../../tests/lib/kit.js");
kit.test({ port: 9464, overlay: "tools/jarmark/overlay", overlayJs: true, errorCheck: "bez błędów" }, async t => {
    const J = e => t.json(e);
    await t.newGame({ map: 8, x: 52, y: 64, dir: 8, hour: 10, quiet: true, minimap: false, day: 47 });
    await t.eval("Jarmark.S().zmus = 1; TownQuests.autoChecks(); 0"); await t.frames(10);
    console.log(JSON.stringify(await J("Watki.f9.sekcje().filter(s => /W17/.test(s.head)).map(s => ({ head: s.head, rows: s.rows.length, labels: s.rows.map(r => r.label) }))")));
    console.log(JSON.stringify(await J("(function(){ const r = TownQuests.rec('W17'); return { r: r && r.s, step: r && r.step }; })()")));
    console.log(JSON.stringify(await J("Watki.skocz('jarmark', 6)")));
    await t.frames(120);
    console.log(JSON.stringify(await J("({ d: Tawerna.time.day(), h: Tawerna.time.hour(), m: $gameMap.mapId(), z: Jarmark.S().z })")));
});
