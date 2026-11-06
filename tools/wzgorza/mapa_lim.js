// ASCII map of the edge state around a spot: node tools/wzgorza/mapa_lim.js x0 y0 x1 y1 [step]   . outside, # strip (lim>0), o inside lim 0, + deeper than the strip
const kit = require("../../tests/lib/kit.js");
const [x0, y0, x1, y1, st] = process.argv.slice(2).map(Number); const S = st || 6;
kit.test({ port: Number(process.env.CDP_PORT) || 9413, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 100000 }, async t => {
    await t.newGame({ map: 990, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    const rows = await t.json(`(() => { const W = Wzgorza, out = []; for (let y = ${y0}; y <= ${y1}; y += ${S}) { let r = ""; for (let x = ${x0}; x <= ${x1}; x += ${S}) { const s = W.edgeState(x + 0.5, y + 0.5); r += !s.inn ? "." : s.lim === 0 ? "o" : (s.d <= s.lim ? "#" : "+"); } out.push(String(y).padStart(5) + " " + r); } return out; })()`);
    console.log(rows.join("\n"));
});
