// node tools/wnetrza/shots.js <out dir> <name suffix> [map ids...]     (CDP_PORT, default 9461; the game at 127.0.0.1:8765)
// Pictures of the interiors FROM THE GAME (RoomLighting, lights, residents, the hero at the landing): the whole room at zoom 1
// (each room fits a 1280x720 screen, the engine centres a small map), noon and 22:00 - <out>/Map<id>_<suffix>_dzien.png / _noc.png
// plus <out>/shots_<suffix>.json (the crop box of each map on the screen). GAME_OVERLAY=<dir> shows staged maps (tests/cdp.js).
"use strict";
const path = require("path");
const fs = require("fs");
process.env.CDP_PORT = process.env.CDP_PORT || "9461";
const ROOT = path.join(__dirname, "..", "..");
const kit = require(path.join(ROOT, "tests", "lib", "kit.js"));
const OUT = path.resolve(process.argv[2] || path.join(ROOT, "docs", "wnetrza_poprawa"));
const SUFFIX = process.argv[3] || "przed";
const DEFAULT_IDS = [100, 102, 103, 104, 105, 106, 107, 108, 109, 110, 112, 113, 114, 115, 116, 117, 121, 122, 123, 124];
const IDS = process.argv.slice(4).map(Number).filter(Boolean);
const HOURS = (process.env.HOURS || "12,22").split(",").map(Number);
const overlay = process.env.GAME_OVERLAY || null;

function mapJson(id) {
    const name = "Map" + String(id).padStart(3, "0") + ".json";
    const o = overlay && path.join(ROOT, overlay, "data", name);
    return JSON.parse(fs.readFileSync(o && fs.existsSync(o) ? o : path.join(ROOT, "data", name), "utf8"));
}
function landing(m, id) {
    for (const e of m.events) {
        if (!e) continue;
        for (const p of e.pages) for (const c of p.list) {
            if (c.code === 201 && c.parameters[0] === 0 && c.parameters[1] !== id && e.y >= m.height - 2) return [e.x, e.y - 1];
        }
    }
    return id === 100 ? [3, 4] : [Math.floor(m.width / 2), m.height - 2];
}

kit.test({ port: Number(process.env.CDP_PORT), overlay, bootCheck: "the game boots" }, async t => {
    const ids = IDS.length ? IDS : DEFAULT_IDS;
    fs.mkdirSync(OUT, { recursive: true });
    const first = mapJson(ids[0]), l0 = landing(first, ids[0]);
    await t.newGame({ map: ids[0], x: l0[0], y: l0[1], dir: 8, hour: 12, quiet: true, minimap: false });
    const boxes = {};
    for (const id of ids) {
        const m = mapJson(id), [lx, ly] = landing(m, id);
        const ok = await t.go(id, lx, ly, 8);
        if (!ok) { t.check("map " + id + " comes up", false); continue; }
        await t.quiet();
        const W = m.width * 48, H = m.height * 48;
        boxes[id] = [Math.round((1280 - W) / 2), Math.round((720 - H) / 2), W, H];
        for (const h of HOURS) {
            await t.eval(`(function(){ $gameSystem.setDayNightHour(${h}); $gamePlayer.setDirection(8);
                $gameMap._zoomFollowsPlayer = false; $gameScreen.setZoom(0, 0, 1); $gameScreen._zoomScaleTarget = 1; $gameScreen._zoomDuration = 0;
                const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false; return 0; })()`);
            await t.frames(70);
            await t.eval(`(function(){ $gameScreen.setZoom(0, 0, 1); const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false; return 0; })()`);
            await t.frames(4);
            const f = path.join(OUT, `Map${id}_${SUFFIX}_${h >= 19 || h < 6 ? "noc" : "dzien"}.png`);
            await t.shot(f);
            console.log("saved", f);
        }
    }
    fs.writeFileSync(path.join(OUT, `shots_${SUFFIX}.json`), JSON.stringify(boxes, null, 1));
    t.check("no page errors", (await t.errors()).length === 0);
});
