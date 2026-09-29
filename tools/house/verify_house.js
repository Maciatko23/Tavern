// node verify_house.js <A|B> [...] [--installed]   (CDP_PORT=9376)  - plays a staged cottage in the real game, data/ untouched
// (--installed: the game's own data/Map019.json and Map020.json - after the install - with the staged meta's spots):
// the staged Map019_<X>.json is served as Map019.json, Map020.json with its cottage door (event "Drzwi chaty") sent to
// the new landing, and System.json's start moved to the concept's start tile (in the page only). Checks:
//   1 a new game starts on the start tile in the cottage; Story.js puts grandpa (event 901) on the concept's spot
//     (Story.NPCS.grandpa.at is set to it in the page, as the install will do);
//   2 the hero's bed: facing it from the start tile, the action button asks "Położyć się spać?" (Spać / Jeszcze nie);
//   3 walking down from the landing through the doorway -> Map020 (15,8) facing down;
//   4 walking up into the cottage door on Map020 -> Map019 at the landing facing up;
//   5 every floor cell the generator calls walkable is walkable in the game from the landing (the game's own passage
//     rules, events included), and no furniture cell is.
const path = require("path"), fs = require("fs");
const { launch, sleep } = require(path.join(__dirname, "..", "..", "tests", "cdp.js"));
const ROOT = path.join(__dirname, "..", "..");
const WINLU_CHARS = "Winlu Fantasy Tileset - Interior/Remaster/characters/";
const winluNames = fs.readdirSync(path.join(ROOT, "img", "tilesets", WINLU_CHARS)).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4));
const ownNames = new Set(fs.readdirSync(path.join(ROOT, "img", "characters")).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4)));
const fromWinlu = winluNames.filter(n => !ownNames.has(n));
const INSTALLED = process.argv.includes("--installed");

async function verify(b, concept) {
    const ev = e => b.evaluate(e);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(0); } }, 5); })`);
    const until = async (cond, secs) => { for (let i = 0; i < secs * 10; i++) { if (await ev(cond).catch(() => false)) return true; await sleep(100); } return false; };
    const staged = path.join(__dirname, "staging", "Map019_" + concept + ".json");
    const meta = JSON.parse(fs.readFileSync(path.join(__dirname, "staging", "Map019_" + concept + "_meta.json"), "utf8"));
    const sp = meta.spots, res = [];
    const check = (name, ok, info) => { res.push(!!ok); console.log((ok ? "ok   " : "FAIL ") + name + (ok ? "" : "  " + JSON.stringify(info))); };
    const map19 = fs.readFileSync(staged, "utf8");
    const map20 = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "Map020.json"), "utf8"));
    const door = map20.events.find(e => e && /^Drzwi chaty/.test(e.name || ""));
    for (const c of door.pages[0].list) if (c.code === 201) { c.parameters[2] = sp.landing[0]; c.parameters[3] = sp.landing[1]; c.parameters[4] = 8; }
    await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
    if (!await until("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')", 60)) throw new Error("no title");
    const over = INSTALLED ? {} : { "Map019.json": map19, "Map020.json": JSON.stringify(map20) };
    await ev(`(function(){ window.__over = ${JSON.stringify(over)};
        const _load = DataManager.loadDataFile;
        DataManager.loadDataFile = function(name, src) { if (window.__over[src]) { window[name] = null; const t = window.__over[src]; setTimeout(() => this.onXhrLoad({ status: 200, responseText: t }, name, src, "data/" + src), 0); return; } return _load.call(this, name, src); };
        const Wn = new Set(${JSON.stringify(fromWinlu)}); const _lc = ImageManager.loadCharacter;
        ImageManager.loadCharacter = function(f) { return Wn.has(f) ? this.loadBitmap("img/tilesets/", ${JSON.stringify(WINLU_CHARS)} + f) : _lc.call(this, f); };
        Object.assign($dataSystem, { startMapId: 19, startX: ${sp.start[0]}, startY: ${sp.start[1]} });
        if (window.Story && Story.NPCS) Story.NPCS.grandpa.at = [${sp.grandpa[0]}, ${sp.grandpa[1]}];
        return 0; })()`);
    // ---- 1 a new game
    await ev(`(function(){ DataManager.setupNewGame(); $gameSystem._minimapHidden = true; SceneManager.goto(Scene_Map); return 0; })()`);
    await until("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId()===19", 40);
    await ev(`(function(){ if (window.Story && Story.skipIntro) Story.skipIntro(); if (window.Birds) Birds.auto(false); if (window.Hunting) Hunting.auto(false); if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); return 0; })()`);
    await frames(30);
    const st = await J(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, g: $gameMap.event(901) ? [$gameMap.event(901).x, $gameMap.event(901).y, $gameMap.event(901).event().name] : null, note: $dataMap.note })`);
    check(concept + " 1 the new game starts on the start tile " + JSON.stringify(sp.start.slice(0, 2)), st.map === 19 && st.x === sp.start[0] && st.y === sp.start[1], st);
    check(concept + " 1 grandpa Stach (901) stands on his spot " + JSON.stringify(sp.grandpa.slice(0, 2)), st.g && st.g[0] === sp.grandpa[0] && st.g[1] === sp.grandpa[1] && st.g[2] === "Dziadek Stach", st.g);
    // ---- 2 the hero's bed
    await ev(`(function(){ $gameMap._interpreter.clear(); $gameMessage.clear(); $gamePlayer.locate(${sp.start[0]}, ${sp.start[1]}); $gamePlayer.setDirection(${sp.start[2] || 2}); Input.clear(); return 0; })()`);
    await frames(10);
    await ev(`(function(){ Input._currentState.ok = true; return 0; })()`); await frames(3); await ev(`(function(){ Input._currentState.ok = false; return 0; })()`);
    const asked = await until("$gameMessage.isBusy() && $gameMessage.allText().indexOf('Położyć się spać?') >= 0", 5);
    const choices = await J("$gameMessage.choices()");
    check(concept + " 2 the hero's bed asks 'Położyć się spać?' (Spać / Jeszcze nie)", asked && choices[0] === "Spać" && choices[1] === "Jeszcze nie", { asked, choices });
    const cmds = await J(`(function(){ const e = $gameMap.eventsXy(${sp.hero_bed[0][0]}, ${sp.hero_bed[0][1]})[0]; return e ? e.list().filter(c => c.code === 357).map(c => c.parameters.slice(0, 2).concat([c.parameters[3] && c.parameters[3].restoreHealth])) : null; })()`);
    check(concept + " 2 ...and 'Spać' runs SurvivalHUD sleep {restoreHealth: true}", cmds && cmds.some(c => c[0] === "SurvivalHUD" && c[1] === "sleep" && c[2] === "true"), cmds);
    await ev(`(function(){ $gameMap._interpreter.clear(); $gameMessage.clear(); if (SceneManager._scene._messageWindow) SceneManager._scene._messageWindow.close(); return 0; })()`);
    await frames(20);
    // ---- 3 out through the door
    const KEY = { 2: "down", 8: "up" };
    const walk = async (d, fromMap) => {
        await ev(`(function(){ Input.clear(); Input._currentState["${KEY[d]}"] = true; return 0; })()`);
        let moved = false;
        for (let i = 0; i < 100; i++) { await sleep(60); if (await ev(`$gamePlayer.isTransferring() || $gameMap.mapId()!==${fromMap}`)) { moved = true; break; } }
        await ev(`(function(){ Input._currentState["${KEY[d]}"] = false; return 0; })()`);
        await until("!$gamePlayer.isTransferring() && SceneManager._scene.constructor.name==='Scene_Map' && !SceneManager.isSceneChanging()", 20);
        await frames(10);
        return moved;
    };
    await ev(`(function(){ $gamePlayer.locate(${sp.landing[0]}, ${sp.landing[1]}); $gamePlayer.setDirection(2); return 0; })()`);
    await frames(20);
    const out = await walk(2, 19);
    const o = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    check(concept + " 3 down from the landing through the doorway -> Map020 (15,8) facing down", out && o.map === 20 && o.x === 15 && o.y === 8 && o.d === 2, o);
    // ---- 4 back in through the cottage door
    await ev(`(function(){ $gamePlayer.locate(15, 8); $gamePlayer.setDirection(8); return 0; })()`);
    await frames(20);
    const inn = await walk(8, 20);
    const i2 = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    check(concept + " 4 into the cottage door on Map020 -> Map019 " + JSON.stringify(sp.landing.slice(0, 2)) + " facing up", inn && i2.map === 19 && i2.x === sp.landing[0] && i2.y === sp.landing[1] && i2.d === 8, i2);
    // ---- 5 the game's own passability against the generator's plan
    const pass = await J(`(function(){ const w = $gameMap.width(), h = $gameMap.height(), seen = {}, todo = [[${sp.landing[0]}, ${sp.landing[1]}]];
        seen[todo[0]] = 1; const g = $gameMap.event(901); if (g) g.setThrough(true);
        while (todo.length) { const [x, y] = todo.pop(); for (const d of [2, 4, 6, 8]) { if (!$gamePlayer.canPass(x, y, d)) continue;
            const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d); if (!seen[[nx, ny]]) { seen[[nx, ny]] = 1; todo.push([nx, ny]); } } }
        if (g) g.setThrough(false); return Object.keys(seen); })()`);
    const gameSeen = new Set(pass);
    const plan = new Set();
    // the generator's reachable set = what check_house.py computes; recompute it the same way from the probe of the meta
    const floorCells = meta.floor.map(c => c[0] + "," + c[1]);
    const solid = new Set(); for (const th of meta.things) if (["table", "seat", "floorprop", "furniture", "counter"].includes(th.cat)) for (const c of th.cells) solid.add(c[0] + "," + c[1]);
    const wrongOpen = [...gameSeen].filter(c => solid.has(c) && !meta.things.some(t => t.cat === "floorprop" && t.kind === "drape"));
    const closed = floorCells.filter(c => !solid.has(c) && !gameSeen.has(c));
    check(concept + " 5 the game walks every free floor cell from the landing, and never onto furniture", !wrongOpen.length && !closed.length, { wrongOpen, closed });
    return res;
}

(async () => {
    const args = process.argv.slice(2).filter(a => a !== "--installed");
    const concepts = args.length ? args : ["A", "B"];
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    let all = [];
    for (const c of concepts) {
        try { all = all.concat(await verify(b, c)); } catch (e) { console.log("ERR", c, e.message); all.push(false); }
    }
    const errs = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("page errors:", errs.slice(-6));
    console.log(all.filter(Boolean).length + "/" + all.length + " passed");
    await b.close();
    process.exit(0);
})();
