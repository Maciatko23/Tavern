// The places of the new terrain's packages from the live game -> tools/powieksz/miejsca_okolic.json (read by przerzedz.py: the generator's
// objects on and next to these places stay). Okolice.spots() (what the packages registered) + OkoliceData.PLAN_SPOTS (the plan), each
// with its cells (Okolice.cellsOf). The game server on 127.0.0.1:8765 (tools/serve.js) must be running.
//   CDP_PORT=9565 node tools/powieksz/miejsca_okolic.js
const path = require("path"), fs = require("fs");
const kit = require(path.join(__dirname, "..", "..", "tests", "lib", "kit.js"));
kit.test({ port: 9565 }, async t => {
    await t.newGame({ map: 3, x: 9, y: 26, hour: 12, quiet: true, minimap: false });
    const spots = await t.json("Okolice.spots().map(s => Object.assign({}, s, { cells: Okolice.cellsOf(s) }))");
    const plan = await t.json("OkoliceData.PLAN_SPOTS.map(s => Object.assign({}, s, { cells: Okolice.cellsOf(s) }))");
    fs.writeFileSync(path.join(__dirname, "miejsca_okolic.json"), JSON.stringify({ spots, plan }, null, 1) + "\n");
    t.check("miejsca paczek zapisane (" + spots.length + " zarejestrowanych, " + plan.length + " z planu)", spots.length > 0 && plan.length > 0);
    await t.done();
});
