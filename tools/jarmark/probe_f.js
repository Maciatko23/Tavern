const kit = require("../../tests/lib/kit.js");
kit.test({ port: 9464, overlay: "tools/jarmark/overlay", overlayJs: true, errorCheck: "bez błędów" }, async t => {
    const J = e => t.json(e);
    await t.newGame({ map: 8, x: 68, y: 56, dir: 8, hour: 12.2, quiet: true, minimap: false, day: 53 });
    await t.eval("(function(){ const s = Jarmark.S(); s.z = 1; s.otw = 1; s.przed.kradziez = 1; s.pogon.koniec = 0; })()");
    console.log("roofstale", JSON.stringify(await J("({ on: Jarmark_Sceny.roof.on, zas: Jarmark.S().zasadzka })")));
    console.log(JSON.stringify(await J("({ d: Tawerna.time.day(), h: Tawerna.time.hour(), zajete: Jarmark_Sceny.zajete(), run: $gameMap.isEventRunning(), has: Jarmark.has() })")));
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 30, 200);
    await t.eval("Jarmark.zegar(); 0");
    console.log(JSON.stringify(await J("({ koniec: Jarmark.S().koniec, z: Jarmark.S().zamkniecie, d: Tawerna.time.day(), h: Tawerna.time.hour(), zajete: Jarmark_Sceny.zajete(), run: $gameMap.isEventRunning() })")));
    await t.frames(80);
    console.log(JSON.stringify(await J("({ koniec: Jarmark.S().koniec, z: Jarmark.S().zamkniecie, h: Tawerna.time.hour() })")));
});
