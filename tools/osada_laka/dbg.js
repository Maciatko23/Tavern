const kit = require("../../tests/lib/kit.js");
kit.test({ bootCheck: "boots", errorCheck: "no errors" }, async t => {
    await t.newGame({ map: +(process.env.DMAP||3), x: +(process.env.DX||99), y: +(process.env.DY||63), dir: 8, day: 3, hour: 12, quiet: true, minimap: false });
    await t.frames(120);
    const r = await t.json(`(function(){ const s = Cienie.solids(); return { runs: s.runs.filter(r => r.x0>=${process.env.X0||80} && r.x0 <= ${process.env.X1||118} && r.f>=${process.env.Y0||40} && r.f<=${process.env.Y1||64}), rects: s.rects.filter(r => r.x0>=${process.env.X0||80} && r.x0 <= ${process.env.X1||118} && r.f>=${process.env.Y0||40} && r.f<=${process.env.Y1||64}), things: s.things.filter(r=>r.x>=${process.env.X0||80}&&r.x<=${process.env.X1||118}&&r.y>=${process.env.Y0||40}&&r.y<=${process.env.Y1||64}).length }; })()`);
    console.log(JSON.stringify(r));
});
