// Diagnostyka geometrii: node tools/wzgorza/diag.js <mapa> x0 y0 x1 y1  (z nakładką: GAME_OVERLAY=tools/wzgorza/staging GAME_OVERLAY_JS=1 CDP_PORT=9413)
const kit = require("../../tests/lib/kit.js");
const [map, x0, y0, x1, y1] = process.argv.slice(2).map(Number);
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.newGame({ map, x: 5, y: 5, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(200);
    const out = await t.json(`(() => { const g = Wzgorza.geo(); const rows = []; const sym = ["", "T", "F"];
        for (let y = ${y0}; y < ${y1}; y++) { let s = ""; for (let x = ${x0}; x < ${x1}; x++) { s += g.hin[y * g.W + x] ? "#" : "."; } rows.push(String(y).padStart(3) + " " + s); }
        const cs = g.corners.filter(c => c.vx >= ${x0} && c.vx <= ${x1} && c.vy >= ${y0} && c.vy <= ${y1}).map(c => [c.vx, c.vy, c.kind ? "cc" : "cx", c.style, c.rho, c.sx, c.sy].join(","));
        return { rows, cs }; })()`);
    console.log(out.rows.join("\n")); console.log(out.cs.join("\n"));
});
