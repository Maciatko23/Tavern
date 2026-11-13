// Overlay test of the staged buildings on Map027 (nothing installed):
//   GAME_OVERLAY=tools/budynki/staging CDP_PORT=9650 node tools/budynki/test_budynki.js
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const spis = JSON.parse(fs.readFileSync(path.join(__dirname, "spis.json"), "utf8"));
const OUT = path.join(__dirname, "..", "..", "docs", "budynki");
fs.mkdirSync(OUT, { recursive: true });
const ROWS = [[44, ["Kamienica", "Kuznia", "Spichlerz", "Rybak"]], [54, ["Karczma", "Wieza", "Ciesla", "Mieszczanin"]]];
const place = {};
for (const [by, names] of ROWS) { let x = 60; for (const n of names) { const s = spis[n]; place[n] = { by, left: x, cx: x + s.center_col, dx: x + s.door_col, s }; x += s.tiles[0] + 3; } }
kit.test({ port: Number(process.env.CDP_PORT) || 9650, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: 27, x: 62, y: 47, day: 40, hour: 10, quiet: true, minimap: false });
    await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); 0");
    await t.eval("(function(){ const sp = SceneManager._scene._spriteset; if (sp._cloudSprites) { for (const c of sp._cloudSprites) if (c.parent) c.parent.removeChild(c); sp._cloudSprites.length = 0; } return 0; })()");
    const can = (x, y, d) => t.json(`$gamePlayer.canPass(${x}, ${y}, ${d})`);
    for (const [n, p] of Object.entries(place)) {
        const s = p.s, o = s.occupy, by = p.by;
        // walls: the bottom row (all but the door cell: the door is an event) and the top wall row block from the front; the roof rows above the walls do not
        let blockedBottom = 0, cells = 0;
        for (let x = p.left; x < p.left + s.tiles[0]; x++) { cells++; if (!(await can(x, by + 1, 8))) blockedBottom++; }
        t.check(`${n}: the wall row blocks from the front (${blockedBottom}/${cells} cells)`, blockedBottom === cells);
        t.check(`${n}: the top wall row blocks from the side`, !(await can(p.left - 1, by - o.up, 6)));
        if (by - o.up - 1 >= 0) t.check(`${n}: the roof row above the walls is free (stand behind)`, await can(p.cx, by - o.up - 2, 2));
        // the hero in the cell behind the wall rows (inside the roof zone): drawn beneath the building
        await t.locate(p.cx, by - s.tiles[1], 2);
        await t.eval(`$gamePlayer._realY += 1.5; $gamePlayer.center(${p.cx}, ${by - Math.floor(s.tiles[1] / 2)}); 0`);   // (feet half a row inside the top row: the head shows over the roof edge)
        await t.frames(40);
        await t.shot(path.join(OUT, `za_${n}.png`));
    }
    // the door of a building: touch, the leaf animation, the placeholder popup
    for (const n of ["Karczma", "Mieszczanin"]) {
        const p = place[n];
        await t.locate(p.dx, p.by + 1, 8); await t.eval(`$gamePlayer.center(${p.dx}, ${p.by - 1}); 0`); await t.frames(20);
        await t.popups({ clear: true });
        for (let k = 0; k < 8 && !(await t.json("$gameMap.isEventRunning()")); k++) { await t.press("up", 6); await t.frames(2); }
        const evId = await t.json(`$gameMap.events().find(e => e.event().name.indexOf("Drzwi budynku: ${p.s.label}") === 0).eventId()`);
        let seen = new Set(), k = 0;
        for (let i = 0; i < 40; i++) { await t.frames(3); const pat = await t.json(`(function(e){ return e.direction() + ":" + e.pattern(); })($gameMap.event(${evId}))`); seen.add(pat); if (i === 8 || i === 16) await t.shot(path.join(OUT, `drzwi_${n}_${i}.png`)); }
        t.check(`${n}: the door animates (${[...seen].join(",")})`, seen.size >= 3);
        const pops = await t.popups();
        t.check(`${n}: the placeholder popup "Tu jeszcze nie ma wnętrza."`, pops.some(x => /nie ma wnętrza/.test(x)));
        await t.dismiss(); await t.frames(60);
        t.check(`${n}: the door closes again`, (await t.json(`$gameMap.event(${evId}).direction()`)) === 2);
    }
    // the set: shots of both rows in pieces (stitched by tools/budynki/zestaw.py)
    await t.eval("$gamePlayer.setTransparent(true); 0");
    for (const [name, x, y] of [["a1", 66, 40], ["a2", 85, 40], ["b1", 66, 50], ["b2", 85, 50]]) {
        await t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.center(${x}, ${y}); 0`); await t.frames(30);
        await t.shot(path.join(OUT, `czesc_${name}.png`));
    }
});
