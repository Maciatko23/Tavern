// Makes tests/fixtures/home_decor_v0.json: a save from BEFORE the refactor's stage 2 - HomeDecor.js as it was (the old code, kept in
// backup_art_2026-09-28/refactor/HomeDecor.js) with its state in $gameSystem._homeDecor, no TawernaCore in the page, no _tw in the
// save. tests/core_fixtures_test.js loads it with the core to prove the old state is adopted (_homeDecor -> Tawerna.state).
// Made ONCE and kept (like tests/fixtures/make_fixtures.js's): run again only if the fixture has to show something new.
//   CDP_PORT=9398 node tests/fixtures/make_home_decor_v0.js
"use strict";
const kit = require("../lib/kit.js");
const OLD = "backup_art_2026-09-28/refactor/HomeDecor.js";

kit.test({ port: 9398, bootCheck: "the game boots" }, async t => {
    const put = await t.eval(`new Promise(res => { if (window.Tawerna) return res("core already here"); const s = document.createElement("script"); s.src = ${JSON.stringify(OLD)} + "?" + Date.now();
        s.onload = () => res(window.HomeDecor ? "old HomeDecor" : "no"); s.onerror = () => res("none"); document.body.appendChild(s); })`);
    t.check("the old HomeDecor.js (before the core) in the page, no TawernaCore", put === "old HomeDecor" && !(await t.eval("!!window.Tawerna")), put);
    t.check("a new story game in grandpa's house", await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, day: 14, hour: 11 }));
    // what the hero has lived: his first wolf (Hunting's own kill path), a shift at Borgar's, a contract's notice
    await t.eval(`(function(){ const a = Hunting.spawn("wolf", 12, 9); a._frozen = true; a._wait = 9999; Hunting.hit(a, 99999, "spear"); const cs = Hunting.carcasses(); cs.splice(0, cs.length);
        $gameSystem._tavernShift = Object.assign({ done: 0, best: 0, earned: 0, last: null }, $gameSystem._tavernShift || {}); $gameSystem._tavernShift.done = 1; HomeDecor.refresh(); return 0; })()`);
    await t.frames(40);
    const st = await t.json("({ hd: $gameSystem._homeDecor, tw: $gameSystem._tw || null, skora: $gameMap.event(984) && $gameMap.event(984)._decorLook, map: $gameMap.mapId() })");
    t.check("the old plugin's state: $gameSystem._homeDecor with the wolf's pelt and Borgar's tankard, no _tw", st.hd && st.hd.got.wolf > 0 && st.hd.got.tankard > 0 && st.tw === null && st.skora === "skora", st);
    const r = await t.saveFixture("home_decor_v0", { desc: "Before the refactor's stage 2: the old HomeDecor.js (" + OLD + ") keeps its state in $gameSystem._homeDecor " +
        "(the first wolf's pelt, Borgar's tankard, day 14 = Easter), no TawernaCore, no _tw. A story game in grandpa's house (Map019)." });
    const text = require("fs").readFileSync(r.file, "utf8");
    t.check("the fixture is written: tests/fixtures/home_decor_v0.json (with _homeDecor, without _tw)", /_homeDecor/.test(text) && !/"_tw"/.test(text), { bytes: r.bytes, summary: r.summary });
});
