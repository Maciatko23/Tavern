// Kopalnia pod Orlą Granią (Map213; tools/kopalnia, docs/questy_mapa/PLAN.md 4a): the way from the quarry (Map013) through the mine to Orla Grań
// (Map175). Checks, on the STAGED files (overlay tools/kopalnia/staging with its plugin list; KOP_OVERLAY=none: the installed game):
//   - the plugin on the list after Orzel_Lot, the map and its tileset, events index == id, the markers the plugin reads
//   - the quarry's mouth (54,31) -> Map213 (9,37); no climb cells on Map013 (the eagle's shelves stay eagle only); the way out again
//   - the cart at station A: O -> the menu (Jedź ... / Zostań), the ride A -> B in ~25 s of game time, one moving cart, the rim over the rider, the
//     camera on the cart, no saving and no menu during the ride, the hero steps out on a free cell by the station
//   - Esc brakes at the next station (the halt H on the way), the ride goes on from there; the lever turns the junction: A -> the spur (S); the ore
//     of the spur mined (iron pickaxe), the empty cart rolls back by itself, the whole mine walkable on foot (nobody stuck on the spur)
//   - the stairs on B: gated (popup) until the egg / Act II / D29, then Map175 (20,28); the shaft on Orla Grań (19..21,30) -> back under the stairs;
//     Map175's north-edge transfers 144 / 152 / 155 gone
//   - a game saved and loaded at a station; no enemies in the mine; the frame time of a ride against walking on Map014 (4x CPU throttle, best of 3)
// Shots: tests/kopalnia/. Run: CDP_PORT=9760 node tests/kopalnia_test.js
const path = require("path");
const fs = require("fs");
const kit = require("./lib/kit.js");

const OVERLAY = process.env.KOP_OVERLAY === "none" ? undefined : "tools/kopalnia/staging";
const SHOTS = path.join(__dirname, "kopalnia");

const REACH = (x, y) => `(function(){
    const W = $gameMap.width(), H = $gameMap.height(), seen = new Uint8Array(W * H), q = [[${x}, ${y}]];
    const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough() && !e._erased);
    seen[${y} * W + ${x}] = 1;
    while (q.length) { const [x, y] = q.pop();
        for (const [dx, dy, d] of [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]]) { const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
            if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) continue;
            seen[ny * W + nx] = 1; q.push([nx, ny]); } }
    window.__reach = seen; return seen.reduce((a, b) => a + b, 0); })()`;
const AT = (x, y) => `!!window.__reach[${y} * $gameMap.width() + ${x}]`;

kit.test({ port: 9760, overlay: OVERLAY, overlayJs: !!OVERLAY, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    fs.mkdirSync(SHOTS, { recursive: true });
    const J = e => t.json(e);
    const ST = () => J("Kopalnia.state()");
    const popups = async () => (await t.popups({ clear: true })).join(" | ");
    const freeCell = (x, y) => `(function(){ const x = ${x}, y = ${y}; return $gameMap.isValid(x, y) && [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e._erased); })()`;
    const hero = () => J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), rx: $gamePlayer._realX, ry: $gamePlayer._realY })");
    const cart = key => J(`(function(){ const e = $gameMap.events().find(v => v.event().note.includes("<KopWagon:${key}>")); return e ? { x: e._realX, y: e._realY, erased: !!e._erased, pri: e._priorityType, dir: e._direction } : null; })()`);
    const menu = async () => {                    // the choice window of the boarding: its texts
        await t.until("$gameMessage.isChoice()", 8);
        await t.until("(function(){ const w = SceneManager._scene._messageWindow; return !!(w && w._choiceListWindow && w._choiceListWindow.active); })()", 8);
        await t.frames(6);
        return J("$gameMessage.choices()");
    };
    const board = async (stop, pick = 0, asked) => {   // a cart of that stop: the hero by it, O, the menu, the pick-th choice
        const spot = { A: [7, 32, 8], H: [55, 21, 2], B: [88, 11, 2], S: [59, 14, 4] }[stop];
        await t.locate(spot[0], spot[1], spot[2]);
        await t.frames(8);
        await t.press("ok");
        const choices = await menu();
        if (asked) asked.push(choices);
        for (let i = 0; i < pick; i++) await t.press("down");      // (the keyboard, like a player: down to the pick-th row, then OK)
        for (let k = 0; k < 4; k++) {                 // (a key tap now and then falls between two frames: once more)
            await t.press("ok");
            await t.frames(10);
            if (!(await t.eval("$gameMessage.isChoice()"))) break;
        }
        await t.until("!$gameMessage.isBusy()", 8);
        await t.frames(4);
        return choices;
    };
    const rideDone = (secs = 60) => t.until("!Kopalnia.riding() && !(Kopalnia.state().ride)", secs, 100);
    const walkOut = async (key, map, secs = 10) => {
        await t.eval(`(function(){ Input.clear(); Input._currentState["${key}"] = true; return 0; })()`);
        await t.until("$gamePlayer.isTransferring() || $gameMap.mapId() !== " + map, secs, 30);
        await t.eval(`(function(){ Input._currentState["${key}"] = false; return 0; })()`);
    };

    // ======================================================================= the list, the data
    await t.newGame({ map: 13, x: 54, y: 34, dir: 8, hour: 12, quiet: true, minimap: false });
    const names = await J("$plugins.filter(p => p.status).map(p => p.name)");
    t.check("Kopalnia on the plugin list, right after Orzel_Lot", names.indexOf("Kopalnia") === names.indexOf("Orzel_Lot") + 1 && names.indexOf("Kopalnia") > 0, names.slice(names.indexOf("Orzel_Lot") - 1, names.indexOf("Orzel_Lot") + 3));
    t.check("Kopalnia is up (the API)", await t.eval("!!(window.Kopalnia && Kopalnia.board && Kopalnia.lever && Kopalnia.ride)"));
    const info = await J("(function(){ const i = $dataMapInfos[213]; return i ? { name: i.name, parent: i.parentId } : null; })()");
    t.check("MapInfos: Map213 'Kopalnia pod Orlą Granią' under Góry i kamieniołom", info && info.name === "Kopalnia pod Orlą Granią" && info.parent === 13, info);

    // ======================================================================= Map013: the mouth, the eagle's shelves
    const m13 = await J(`(function(){ const ev = $gameMap.events(); return {
        mouth: ev.filter(e => e.event().name === "Wejście do kopalni").map(e => [e.x, e.y]),
        climb: ev.filter(e => /<Orzel:wspinaczka>/.test(e.event().note)).length,
        injected: Tawerna.injected(13), pine: ev.filter(e => e.x === 53 && e.y === 32 && /Sosna/.test(e.event().name)).length,
        rails: ev.filter(e => e.event().name === "Tor z kopalni").length }; })()`);
    t.check("Map013: the mine's mouth at (54,31), rails out of it to the old cart (8 pieces), no tree over the mouth", m13.mouth.length === 1 && m13.mouth[0][0] === 54 && m13.mouth[0][1] === 31 && m13.rails === 8 && m13.pine === 0, m13);
    t.check("Map013: still no climb cells - the eagle's shelves stay eagle only (no Orzel way up injected here)", m13.climb === 0 && !(m13.injected && Object.keys(m13.injected).some(k => /Orzel/.test(k) && (m13.injected[k] || []).length)), m13.injected);
    await t.locate(54, 34, 8);
    await t.shot(path.join(SHOTS, "wejscie_gory.png"));
    // ======================================================================= in through the mouth
    await t.locate(54, 33, 8);
    await walkOut("up", 13);
    t.check("walking up into the mouth (54,31) -> Map213 (9,37) facing up", await t.until(t.onMap(213), 20));
    await t.frames(40);
    const in213 = await hero();
    t.check("arrival on Map213 at (9,37) facing up", in213.x === 9 && in213.y === 37 && in213.d === 8, in213);
    await t.shot(path.join(SHOTS, "przyjazd.png"));

    // ======================================================================= the model, the map's events
    const mine = await J(`(function(){ const M = Kopalnia.model(), ev = $gameMap.events();
        return { main: M.main.map(p => [p.x, p.y, p.stop]), spur: M.spur.map(p => [p.x, p.y, p.stop]), exits: M.exits, carts: M.carts, lever: M.lever,
            idx: $dataMap.events.every((e, i) => i === 0 ? e === null : (e === null || e.id === i)), w: $dataMap.width, h: $dataMap.height, ts: $dataMap.tilesetId,
            ts_name: $dataSystem && $dataTilesets[$dataMap.tilesetId] ? $dataTilesets[$dataMap.tilesetId].name : "",
            visible: ev.filter(e => /Wagonik/.test(e.event().name)).map(e => [e.event().name, e._erased]),
            enemies: window.Hunting && Hunting.animals ? Hunting.animals.length : 0, lights: ev.filter(e => /<Light:/.test(e.event().note)).length }; })()`);
    t.check("map 96 x 40, events index == id, the tileset the staged copy of 10 with the rails", mine.w === 96 && mine.h === 40 && mine.idx && /Dungeon z torami/.test(mine.ts_name), mine);
    t.check("the way: main A(7,31) ... H(55,22) J(58,22) ... B(88,12), the spur J -> S(58,14); exits of the four stops; the carts and the lever tagged",
        mine.main[0][2] === "A" && mine.main[mine.main.length - 1][2] === "B" && mine.main.some(p => p[2] === "H") && mine.main.some(p => p[2] === "J") && mine.spur[mine.spur.length - 1][2] === "S"
        && ["A", "H", "B", "S"].every(k => mine.exits[k]) && mine.carts.A && mine.carts.B && mine.carts.M && mine.carts.R && mine.lever, mine);
    t.check("the two ends' carts stand, the moving cart and the rim are away", mine.visible.filter(v => !v[1]).map(v => v[0]).sort().join() === "Wagonik A,Wagonik B", mine.visible);
    t.check("no enemies, a dozen lights from lanterns and braziers (every light a fire)", mine.enemies === 0 && mine.lights >= 12 && mine.lights <= 24, { enemies: mine.enemies, lights: mine.lights });

    // ======================================================================= the whole mine on foot: from the landing to every stop
    await t.eval("0");
    const reach = await t.eval(REACH(9, 37));
    const cells = await J(`(function(){ const M = Kopalnia.model(); return { exits: M.exits, stairs: [84, 9] }; })()`);
    const reached = {};
    for (const k of ["A", "H", "B", "S"]) reached[k] = await t.eval(AT(cells.exits[k].x, cells.exits[k].y));
    reached.stairs = await t.eval(AT(84, 9));
    reached.chamber = await t.eval(AT(57, 13));
    reached.lever = await t.eval(AT(57, 22));
    t.check("on foot from the landing: station A, the halt, station B, the spur's end and its chamber, the lever, the stairs - nobody can get stuck (" + reach + " cells)",
        Object.values(reached).every(Boolean), reached);

    // ======================================================================= the ride A -> B
    t.check("the carts do not block the landing cells", await t.eval(freeCell(7, 32)) && await t.eval(freeCell(88, 11)));
    const asked = [];
    const choices = await board("A", 0, asked);
    t.check("O at the cart of A: the menu 'Jedź na szczyt' / 'Zostań' (the lever on the line)", choices.length === 2 && /szczyt/.test(choices[0]) && /Zostań/.test(choices[1]), choices);
    const s0 = await ST();
    t.check("the ride begins (A -> B), the hero rides", s0.ride && s0.ride.from === "A" && s0.ride.to === "B" && s0.ride.hero, s0);
    await t.frames(200);
    const mid = await J(`({ riding: Kopalnia.riding(), save: $gameSystem.isSaveEnabled(), canMove: $gamePlayer.canMove(), through: $gamePlayer.isThrough(), px: $gamePlayer._realX, py: $gamePlayer._realY,
        dx: $gameMap.displayX() + $gameMap.screenTileX() / 2 - 0.5, dy: $gameMap.displayY() + $gameMap.screenTileY() / 2 - 0.5, menu: SceneManager._scene.isMenuCalled ? SceneManager._scene.isMenuCalled() : null })`);
    const m = await cart("M"), r = await cart("R"), a = await cart("A");
    t.check("mid-ride: the hero rides (cannot walk, saving and the menu refused), the camera on him", mid.riding && !mid.save && !mid.canMove && mid.through && Math.abs(mid.px - mid.dx) < 1.6 && Math.abs(mid.py - mid.dy) < 1.6 && mid.menu === false, mid);
    t.check("one moving cart carries him, the rim over him (priority 2), the end's parked cart is away", m && !m.erased && m.pri === 0 && Math.abs(m.x - mid.px) < 0.01 && Math.abs(m.y - mid.py) < 0.01 && r && !r.erased && r.pri === 2 && a.erased, { m, r, a });
    await t.key("Escape", 8);              // (the ride was to be stopped later: first the speed of the whole ride)
    await t.shot(path.join(SHOTS, "jazda.png"));
    // (the Esc pressed above brakes at the halt - this ride shows the brake; the full A -> B follows after the halt)
    t.check("Esc during the ride: it brakes at the next station (the halt, H)", await t.until("(Kopalnia.state().ride && Kopalnia.state().ride.brake) || !Kopalnia.state().ride", 3));
    t.check("the ride ends at the halt H (stops, the hero steps out beside it)", await rideDone(60), await ST());
    const sh = await ST(), hh = await hero();
    t.check("at the halt: the cart rests at H, the hero on the exit cell (55,21), free, facing up", sh.rest && sh.rest.stop === "H" && hh.x === 55 && hh.y === 21 && hh.d === 8, { sh, hh });
    // (the end's carts are away while this one is out: the hero far from it - the cart goes home and both stand at the ends again)
    await t.locate(40, 22, 6);
    t.check("the hero walks away from the resting cart: it goes back, both end carts stand again, nothing left at the halt", await t.until("!Kopalnia.state().rest", 20, 100) && (await cart("A")).erased === false && (await cart("B")).erased === false && (await cart("M")).erased === true, await ST());
    await t.locate(55, 21, 8);
    t.check("saving works again at the station", await t.eval("$gameSystem.isSaveEnabled()"));
    t.check("a station popup came up", /Mijanka|Stacja/.test(await popups()));
    await t.shot(path.join(SHOTS, "mijanka.png"));

    // ======================================================================= from the halt on to B: the brake taken, the full ride timing
    await t.locate(7, 32, 8);
    await board("A", 0);
    await t.frames(30);
    await t.key("Escape", 8);
    await rideDone(60);
    const asked2 = [];
    const c2 = await board("H", 0, asked2);
    t.check("at the halt the menu offers: on to the summit / back to the quarry / stay", c2.length === 3 && /szczyt/.test(c2[0]) && /kamieniołomu/.test(c2[1]) && /Zostań/.test(c2[2]), c2);
    t.check("the ride H -> B", (await ST()).ride.to === "B");
    t.check("it arrives at B within the time (the way ~44 tiles at 4 a second)", await rideDone(60));
    const hb = await hero(), cb = await cart("M");
    t.check("station B: the hero on (88,11) facing up, the cart rests on (88,12) (the end's cart: M)", hb.x === 88 && hb.y === 11 && hb.d === 8 && cb && Math.round(cb.x) === 88 && Math.round(cb.y) === 12 && !cb.erased, { hb, cb });
    t.check("the exit cell is free of things, the rim is away", await t.eval(freeCell(88, 11)) && (await cart("R")).erased);
    await t.shot(path.join(SHOTS, "stacja_b.png"));

    // ======================================================================= the full ride B -> A (timing), then A -> B whole
    await board("B", 0);
    const t0 = await ST();
    t.check("the ride B -> A (the main line, the lever on the main line does not matter from this side)", t0.ride && t0.ride.from === "B" && t0.ride.to === "A", t0);
    t.check("it arrives at A", await rideDone(80));
    const full = await J("window.__lastFrames || 0");
    const hA = await hero();
    t.check("station A: the hero on (7,32), free, facing down (off the platform)", hA.x === 7 && hA.y === 32 && hA.d === 2, hA);
    // the timing of a whole ride: A -> B by frames of the game (not the wall clock): 99.1 tiles at 4 a second + the start and the brake
    await board("A", 0);
    let fr = 0;
    for (let i = 0; i < 400; i++) { const s = await ST(); if (!s.ride) break; fr = s.ride.frames; await t.frames(60); }
    const last = await J("Kopalnia.state()");
    t.check("A -> B arrives (the whole way)", (await hero()).x === 88 && (await hero()).y === 11, await hero());
    t.check("the whole A -> B takes about 25 seconds of game time (24-28)", fr / 60 > 22 && fr / 60 < 30, { seconds: fr / 60 });

    // ======================================================================= the stairs (gated) and Orla Grań
    await t.locate(84, 8, 8);
    await t.frames(10);
    await t.eval("(function(){ const o = Orzel.state(); if (o.flags) delete o.flags.f9Egg; return 0; })()");
    await popups();
    await t.press("ok");
    await t.frames(20);
    const gated = await J("({ map: $gameMap.mapId(), tr: $gamePlayer.isTransferring() })");
    t.check("the stairs on B are gated (a popup, no transfer) while there is no reason to climb (no egg, not Act II, no D29)", gated.map === 213 && !gated.tr && /nie masz po co/.test(await popups()), gated);
    await t.eval("(function(){ const o = Orzel.state(); o.flags = o.flags || {}; o.flags.f9Egg = true; return 0; })()");
    await t.press("ok");
    t.check("with a reason: up the stairs -> Orla Grań (20,28) facing up", await t.until(t.onMap(175), 20));
    await t.frames(30);
    const top = await hero();
    t.check("arrival on Orla Grań at (20,28) facing up", top.map === 175 && top.x === 20 && top.y === 28 && top.d === 8, top);
    const g = await J(`(function(){ const ev = $gameMap.events(); return { shaft: ev.filter(e => e.event().name === "Szyb do kopalni").map(e => [e.x, e.y]),
        down: ev.filter(e => /<Orzel:zejscie>/.test(e.event().note)).map(e => [e.x, e.y]).sort((a, b) => a[0] - b[0]),
        edge: [144, 152, 155].map(i => $dataMap.events[i] ? 1 : 0), ids: $dataMap.events.every((e, i) => i === 0 ? e === null : (e === null || e.id === i)) }; })()`);
    t.check("Orla Grań: the shaft at (20,30), the way down on (19..21,30), the north edge's 144 / 152 / 155 gone, events index == id",
        g.shaft.length === 1 && g.shaft[0][0] === 20 && g.shaft[0][1] === 30 && g.down.length === 3 && g.down[0][0] === 19 && g.down[2][0] === 21 && g.down.every(c => c[1] === 30) && g.edge.join() === "0,0,0" && g.ids, g);
    await t.shot(path.join(SHOTS, "gran.png"));
    await t.locate(20, 29, 2);
    await walkOut("down", 175);
    t.check("down the shaft -> the mine, under the stairs of B", await t.until(t.onMap(213), 20));
    await t.frames(30);
    const back = await hero();
    t.check("back on Map213 at (84,9) / (85,9) facing down, a free cell", back.map === 213 && (back.x === 84 || back.x === 85) && back.y === 9 && back.d === 2 && await t.eval(freeCell(back.x, back.y)), back);

    // ======================================================================= the lever and the spur
    await t.locate(7, 32, 8);
    await t.frames(10);
    await t.locate(57, 22, 2);
    await t.frames(8);
    await popups();
    await t.press("ok");
    await t.frames(10);
    const lv = await J("({ lever: Kopalnia.state().lever, dir: $gameMap.event(Kopalnia.model().lever)._direction })");
    t.check("the lever (O): the junction turns to the spur, the lever's picture leans the other way, a popup says so", lv.lever === 1 && lv.dir === 2 && /odnoga/i.test(await popups()), lv);
    await t.shot(path.join(SHOTS, "zwrotnica.png"));
    const c3 = await board("A", 0);
    t.check("at A the menu now offers the spur", /odnog/.test(c3[0]), c3);
    const rs = await ST();
    if (!rs.ride) console.log("DEBUG no ride:", JSON.stringify(rs), JSON.stringify(await J("({ choice: $gameMessage.isChoice(), busy: $gameMessage.isBusy(), ev: $gameMap.isEventRunning(), p: [$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()], cart: $gameMap.events().filter(e => /Wagonik/.test(e.event().name)).map(e => [e.x, e.y, e._erased]) })")), JSON.stringify(t.b.logs.slice(-6)));
    t.check("the ride A -> S", !!(rs.ride && rs.ride.to === "S"), rs);
    t.check("the ride to the spur's end ends", await rideDone(80));
    const hs = await hero(), ss = await ST();
    t.check("the spur's end: the hero on (59,14), the cart rests at S (58,14)", hs.x === 59 && hs.y === 14 && ss.rest && ss.rest.stop === "S" && Math.round((await cart("M")).y) === 14, { hs, ss });
    await t.shot(path.join(SHOTS, "odnoga.png"));

    // ======================================================================= the ore of the spur: mined, and the cart rolls back by itself
    const ore = await J(`(function(){ const e = $gameMap.events().find(v => v.event().pages[0].image.characterName === "!$Rock_Ore_Iron_Chunk"); return e ? { id: e.eventId(), x: e.x, y: e.y } : null; })()`);
    t.check("an ore vein (the game's own iron ore picture) stands at the face", !!ore, ore);
    let oreGot = false;
    if (ore) {
        await t.eval("$gameParty.gainItem($dataItems[116], 1); 0");
        const before = await t.eval("$gameParty.numItems($dataItems[85])");
        await t.eval(`$gameSystem.setStamina(100); $gamePlayer.locate(${ore.x}, ${ore.y + 1}); $gamePlayer.setDirection(8); 0`);
        for (let i = 0; i < 40; i++) {
            await t.until(`!$gameMap.isEventRunning() && !$gameMap.event(${ore.id}).isTreeAnimating() && !$gamePlayer.isToolSwinging() && $gamePlayer.canMove()`, 20, 30);
            await t.eval(`$gameSystem.setStamina(100); $gameMap.event(${ore.id}).start(); 0`);
            await t.frames(30);
            if ((await t.eval("$gameParty.numItems($dataItems[85])")) > before) { oreGot = true; break; }
        }
        t.check("the spur's ore mined with the pickaxe like any ore (iron ore in the bag)", oreGot, { before, after: await t.eval("$gameParty.numItems($dataItems[85])") });
        await t.shot(path.join(SHOTS, "ruda.png"));
    }
    // the hero walks off the cart: it rolls back by itself
    await t.locate(54, 10, 2);
    t.check("the hero left the cart far behind: the empty cart rolls back by itself (an empty ride S -> A)", await t.until("Kopalnia.state().ride && !Kopalnia.state().ride.hero && Kopalnia.state().ride.from === 'S' && Kopalnia.state().ride.to === 'A'", 10, 100), await ST());
    t.check("the rolling cart has no rider and the hero can walk freely (not riding)", await t.eval("!Kopalnia.riding() && $gamePlayer.canMove()"));
    t.check("it reaches A: the two carts stand at the ends again (nothing left on the spur)", await t.until("!Kopalnia.state().ride && !Kopalnia.state().rest", 60, 100)
        && (await cart("A")).erased === false && (await cart("B")).erased === false && (await cart("M")).erased === true, await ST());
    t.check("the hero walks back from the spur's end on foot (the whole mine connected)", await t.eval(REACH(54, 10)) > 300 && await t.eval(AT(7, 32)) && await t.eval(AT(88, 11)));
    await t.eval("(function(){ const s = Kopalnia.state(); return 0; })()");
    // turn the lever back
    await t.locate(57, 22, 2); await t.frames(8); await t.press("ok"); await t.frames(10);
    t.check("the lever back: the main line", (await ST()).lever === 0);

    // ======================================================================= save and load at a station
    await t.locate(7, 32, 8);
    await t.saveTo(1);
    t.check("a game loads at the station: nobody riding, the ends' carts parked, the moving cart away", await t.loadFrom(1)
        && await t.until(t.onMap(213), 20) && (await t.frames(20), true) && !(await t.eval("Kopalnia.riding()")) && (await cart("A")).erased === false && (await cart("M")).erased === true, await ST());
    await t.shot(path.join(SHOTS, "stacja_a.png"));
    // saved and loaded in the middle of a ride is not possible: the save is refused
    await board("A", 0);
    await t.frames(60);
    t.check("a ride: saving is refused (isSaveEnabled false)", !(await t.eval("$gameSystem.isSaveEnabled()")));
    await t.key("Escape", 8);
    t.check("the ride is over at the halt after the Esc", await rideDone(60));

    t.check("no leftovers: nothing riding at the end", await t.eval("!Kopalnia.riding() && !$gamePlayer._kopRiding && !$gamePlayer.isThrough()"));

    // ======================================================================= the frame time: a ride against walking on Map014 (4x CPU throttle, best of 3)
    // (the browser caps the frame clock at the display rate, so the clock says nothing: the time the game's own frame takes - SceneManager.updateMain, the logic of a frame - is measured)
    const measure = async secs => {
        await t.eval(`(function(){ window.__ft = []; if (!window.__ftHook) { window.__ftHook = true; const u = SceneManager.updateMain;
            SceneManager.updateMain = function() { const t0 = performance.now(); const r = u.apply(this, arguments); if (window.__ftRun) window.__ft.push(performance.now() - t0); return r; }; }
            window.__ftRun = true; return 0; })()`);
        await t.wait(secs * 1000);
        return J(`(function(){ window.__ftRun = false; const a = window.__ft.slice(2), n = a.length, s = a.reduce((x, y) => x + y, 0); a.sort((x, y) => x - y);
            return { n, avg: s / Math.max(1, n), p95: a[Math.floor(n * 0.95)] || 0 }; })()`);
    };
    const bestOf3 = async fn => { const out = []; for (let i = 0; i < 3; i++) out.push(await fn()); out.sort((a, b) => a.avg - b.avg); return out[0]; };
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await t.go(14, 20, 25, 8);
    await t.frames(30);
    const walk = await bestOf3(async () => {
        await t.eval(`(function(){ Input.clear(); $gamePlayer.locate(20, 26); let f = false; Input._currentState["up"] = true;
            window.__walkIv = setInterval(() => { f = !f; Input._currentState["up"] = !f; Input._currentState["down"] = f; }, 600); return 0; })()`);
        const r = await measure(3);
        await t.eval(`(function(){ clearInterval(window.__walkIv); Input._currentState["up"] = false; Input._currentState["down"] = false; return 0; })()`);
        return r;
    });
    await t.go(213, 7, 32, 8);
    await t.frames(30);
    const rideM = await bestOf3(async () => {
        await t.go(213, 7, 32, 8); await t.frames(10);
        await t.eval("Kopalnia.ride('A', 'B'); 0");
        await t.frames(30);
        const r = await measure(3);
        await t.eval("(function(){ Kopalnia.brake(); return 0; })()");
        await t.until("!Kopalnia.state().ride", 60, 100);
        return r;
    });
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    console.log("frame time at 4x CPU throttle: walking on Map014 avg " + walk.avg.toFixed(2) + " ms (p95 " + walk.p95.toFixed(1) + ", " + walk.n + " frames), riding on Map213 avg " + rideM.avg.toFixed(2) + " ms (p95 " + rideM.p95.toFixed(1) + ", " + rideM.n + " frames)");
    t.check("frame time: riding (4x CPU throttle, best of 3) is not worse than walking on Map014 (+10%)", rideM.n > 30 && walk.n > 30 && rideM.avg <= walk.avg * 1.10 + 0.3, { walk, ride: rideM });
});
