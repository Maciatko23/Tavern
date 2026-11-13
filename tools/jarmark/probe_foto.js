// re-shoots: the lamps of the market (day 48, 20:00) and the night at the bell tower (ambush, 52, 23:40)
const kit = require("../../tests/lib/kit.js"); const path = require("path");
const SH = path.resolve(__dirname, "../../docs/zadania_nowe/jarmark_gra");
kit.test({ port: Number(process.env.CDP_PORT) || 9462, overlay: "tools/jarmark/overlay", overlayJs: true, errorCheck: "bez błędów" }, async t => {
    const shot = n => t.shot(path.join(SH, n + ".png"));
    await t.newGame({ map: 8, x: 52, y: 53, dir: 8, hour: 20, quiet: true, minimap: false, day: 48 });
    await t.eval("(function(){ const s = Jarmark.S(); s.zmus = 1; s.z = 1; s.prace.deski = 1; s.prace.kramy = [0,1,2,3,4,5]; s.prace.lampy = [0,1,2,3,4,5,6,7]; s.prace.beczki = 1; })(); $gamePlayer.requestMapReload(); 0");
    await t.go(8, 52, 53, 8); await t.frames(90); await shot("03_lampiony_noc");
    await t.eval("(function(){ const s = Jarmark.S(); s.otw = 1; s.przed.kradziez = 1; })(); 0");
    await t.setDay(52, 23.6); await t.calm();
    await t.eval("$gamePlayer.requestMapReload(); 0"); await t.go(8, 46, 107, 8); await t.frames(90);
    await t.eval("Jarmark_Sceny.zasadzkaSpec(true); 0"); await t.frames(60); await shot("14_zasadzka_u_dzwonnicy");
});
