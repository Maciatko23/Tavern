// A new game is the new world whatever map the editor's test start points at (Story.js startWorld, 2026-11-16: the start was set to
// the tavern's floor - Map025 - and a new game would have become the old world with grandpa's house Map019).
// Uruchom: node tests/run.js start_swiat --port 9473
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const r = await t.json(`(function(){ const was = $dataSystem.startMapId, out = { start: was, worlds: {} };
        for (const m of [was, 224, 218, 25, 1, 19]) { $dataSystem.startMapId = m; DataManager.setupNewGame(); const s = Story.state(); out.worlds[m] = s ? s.world : null; }
        $dataSystem.startMapId = was; return out; })()`);
    t.check("nowa gra = nowy świat przy starcie z mapy 224, 218, 25 (piętro karczmy), 1 i z obecnego punktu startu; stary świat tylko przy starej mapie 19",
        r.worlds[r.start] === "nowy" && r.worlds[224] === "nowy" && r.worlds[218] === "nowy" && r.worlds[25] === "nowy" && r.worlds[1] === "nowy" && r.worlds[19] === "stary", r);
});
