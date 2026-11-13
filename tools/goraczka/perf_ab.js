// Interleaved A/B of tests/goraczka_perf.js: base (no overlay), overlay, base, overlay, base, overlay (3 rounds), the best (lowest) frame of each scene per side.
//   node tools/goraczka/perf_ab.js            (CDP ports 9451 / 9452)
const { spawnSync } = require("child_process");
const path = require("path");
const root = path.join(__dirname, "..", "..");
const best = { base: {}, over: {} };
const run = (side, port) => {
    const env = Object.assign({}, process.env, { CDP_PORT: String(port) });
    if (side === "over") { env.GAME_OVERLAY = "tools/goraczka/overlay"; env.GAME_OVERLAY_JS = "1"; } else { delete env.GAME_OVERLAY; delete env.GAME_OVERLAY_JS; }
    const r = spawnSync("node", ["tests/goraczka_perf.js"], { cwd: root, env, encoding: "utf8", timeout: 600000 });
    for (const m of (r.stdout || "").matchAll(/PERF (?:z|bez) W21 (.+?): ([\d.]+) ms/g)) {
        const k = m[1], v = Number(m[2]);
        if (!(k in best[side]) || v < best[side][k]) best[side][k] = v;
    }
    console.log(side, "run done", (r.stdout || "").split("\n").filter(l => /PERF/.test(l)).join(" | "));
};
for (let i = 0; i < 3; i++) { run("base", 9451); run("over", 9452); }
console.log("\nA/B (best of 3 interleaved rounds, 4x CPU, frame = update + render, ms):");
for (const k of Object.keys(best.over)) {
    const a = best.base[k], b = best.over[k];
    console.log("  " + k + ": bez W21 " + a + "  z W21 " + b + "  (" + (a ? ((b / a - 1) * 100).toFixed(1) + "%" : "?") + ")");
}
