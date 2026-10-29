// A unit test (tests/unit/*.test.js): plain Node, no browser; the same PASS / FAIL lines and "N/M passed" as the game tests.
//
//   const unit = require("../lib/unit.js");
//   unit.test(t => {
//       const w = unit.load(["TavernDice"]);
//       t.eq("three ones count 1000", w.TavernDice.score([1, 1, 1]).points, 1000);
//   });
"use strict";
const fs = require("fs");
const path = require("path");
const util = require("util");
const { Report } = require("./report.js");
const sandbox = require("./sandbox.js");

// t.check(name, ok, info) as in the game tests; t.eq(name, got, want): equal (deeply), shows both when not
async function test(body) {
    const t = new Report();
    t.eq = (name, got, want) => { const ok = util.isDeepStrictEqual(got, want); return t.check(name, ok, ok ? undefined : { got, want }); };
    try { await body(t); } catch (e) { t.error(e); console.log(e && e.stack ? e.stack.split("\n").slice(1, 4).join("\n") : ""); }
    process.exit(t.summary() ? 0 : 1);
}

// the database with notes read as the engine reads them (item.meta)
const data = name => sandbox.withMeta(sandbox.loadData(name));

// unit.load(names, opts): the plugins in one fake window (tests/lib/sandbox.js). (2026-10-23) A plugin whose words are data
// (Watki.scal / Watki.zTekstu / Watki.teksty - js/teksty/<name>.txt, which the game reads over the server before the title) gets Watki.js put in
// right after the core and every js/teksty file read from the disk, so its objects are whole as in the game - unless the test
// loads Watki itself (then it feeds the words itself: Watki.wczytaj).
function load(names, opts) {
    names = names.slice();
    const src = n => { try { return fs.readFileSync(path.join(sandbox.PLUGINS, n + ".js"), "utf8"); } catch (e) { return ""; } };
    const wantsTexts = !names.includes("Watki") && names.includes("TawernaCore") && fs.existsSync(path.join(sandbox.PLUGINS, "Watki.js")) &&
        names.some(n => /\bWatki\.(scal|zTekstu|teksty)\(/.test(src(n)));
    if (wantsTexts) names.splice(names.indexOf("TawernaCore") + 1, 0, "Watki");
    const w = sandbox.loadPlugins(names, opts);
    if (wantsTexts && w.Watki && typeof w.Watki.wczytaj === "function") {
        const dir = path.join(sandbox.ROOT, "js", "teksty");
        for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.txt$/.test(f)).sort() : []) w.Watki.wczytaj(f.replace(/\.txt$/, ""), fs.readFileSync(path.join(dir, f), "utf8"));
    }
    return w;
}

module.exports = { test, load, data, standIn: sandbox.standIn };
