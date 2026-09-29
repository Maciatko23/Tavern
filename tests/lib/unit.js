// A unit test (tests/unit/*.test.js): plain Node, no browser; the same PASS / FAIL lines and "N/M passed" as the game tests.
//
//   const unit = require("../lib/unit.js");
//   unit.test(t => {
//       const w = unit.load(["TavernDice"]);
//       t.eq("three ones count 1000", w.TavernDice.score([1, 1, 1]).points, 1000);
//   });
"use strict";
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

module.exports = { test, load: sandbox.loadPlugins, data, standIn: sandbox.standIn };
