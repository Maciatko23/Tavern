// Existing tests that touch what W21 changed (TownLife residents, Map008's two doors/carts, Items, TawernaCore's id registry, the plugin list, F9),
// run BEFORE (live game, no overlay) and AFTER (the overlay), each with a timeout, on my own CDP ports (9453 before / 9454 after).
//   node tools/goraczka/regres.js [test ...]      -> tools/goraczka/regres.log
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "..");
const TESTS = process.argv.slice(2).length ? process.argv.slice(2) : ["core_test", "town_life_test", "town_interiors_test", "zakon_test", "debug_menu_test", "podgrodzie_life_test", "town_quests_test"];
const log = [];
const runOne = (name, side, port) => new Promise(res => {
    const env = Object.assign({}, process.env, { CDP_PORT: String(port) });
    if (side === "after") { env.GAME_OVERLAY = "tools/goraczka/overlay"; env.GAME_OVERLAY_JS = "1"; } else { delete env.GAME_OVERLAY; delete env.GAME_OVERLAY_JS; }
    const p = spawn("node", ["tests/" + name + ".js"], { cwd: root, env });
    let out = ""; p.stdout.on("data", d => out += d); p.stderr.on("data", d => out += d);
    const to = setTimeout(() => { out += "\nTIMEOUT"; p.kill(); }, 900000);
    p.on("close", () => { clearTimeout(to); const m = /(\d+)\/(\d+) passed/.exec(out); const fails = out.split("\n").filter(l => /^FAIL/.test(l)).map(l => l.slice(0, 160));
        res({ name, side, result: m ? m[0] : /TIMEOUT/.test(out) ? "TIMEOUT" : "no result", fails }); });
});
(async () => {
    const results = [];
    for (const name of TESTS) {
        const [a, b] = await Promise.all([runOne(name, "before", 9453), runOne(name, "after", 9454)]);
        results.push(a, b);
        const line = name + ": before " + a.result + " -> after " + b.result + (b.fails.length ? "\n    after FAIL: " + b.fails.join("\n    ") : "") + (a.fails.length ? "\n    before FAIL: " + a.fails.join("\n    ") : "");
        console.log(line); log.push(line);
        fs.writeFileSync(path.join(__dirname, "regres.log"), log.join("\n") + "\n");
    }
})();
