// pozycje bohatera za krawędzią (maks. głębokość) na mapie w oknie pikseli: node tools/wzgorza/pozycje.js mapa x0 y0 x1 y1   (z nakładką)
const kit = require("../../tests/lib/kit.js");
const [map, x0, y0, x1, y1] = process.argv.slice(2).map(Number);
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.newGame({ map, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    const r = await t.json(`(() => { const out = []; for (let fy = ${y0}; fy < ${y1}; fy += 4) for (let fx = ${x0}; fx < ${x1}; fx += 4) { if (Wzgorza.standing(fx, fy) !== 1 || Wzgorza.bodyBad(fx, fy)) continue; const d = Wzgorza.maxDepth(fx, fy); if (d >= 27) out.push([fx, fy, +d.toFixed(1)]); } return out; })()`);
    console.log(JSON.stringify(r.filter((_, i) => i % Math.max(1, Math.floor(r.length / 40)) === 0)));
});
