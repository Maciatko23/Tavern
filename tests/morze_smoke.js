const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", port: Number(process.env.CDP_PORT) || 9955 }, async t => {
    const J = e => t.json(e);
    const T0 = Date.now(), lap = s => console.log(((Date.now() - T0) / 1000).toFixed(1) + "s " + s);
    await t.newGame({ map: 125, x: 60, y: 70, hour: 22.5, day: 12 });
    await t.eval(`(function(){ const n = Morze.night().n; Morze.state().noce[Morze.key(n, 125)] = { l: 1, k: "topielec_morski", c: 1, o: 0, sp: 0, left: 0, tr: null }; return 0; })()`);
    await t.until("MorzePotwory.seaList().length > 0", 60, 300); lap("spawned");
    await t.setDay(12, 23.0); await t.frames(30);
    await t.frames(600); lap('600 more');
    await t.setDay(12, 20.9); lap('hour'); await t.shot('_x.png'); lap('shot');
    await t.eval(`MorzePotwory.seaList().forEach(c => c.setMode('idle')); Morze.dawn(); 0`); lap('dawn'); await t.frames(200); lap('200'); console.log(await t.until('MorzePotwory.seaList().length === 0', 40, 300)); lap('until');
    for (let i = 0; i < 0; i++) { await t.frames(60); lap("60 frames " + JSON.stringify(await J("MorzePotwory.seaList().map(c => [c._mode, Math.round(c.playerDistance()), !!c._culled]).concat([Graphics.frameCount, $gameParty.leader().hp])"))); }
});
