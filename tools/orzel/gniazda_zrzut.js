// Biały orzeł - zrzuty gniazd na miarę ptaka (2026-10-18): w układzie docs/orzel/gniazda_teraz.png (od lewej: pisklę w koszu, młody
// w koszu, podrostek w gnieździe, prawie dorosły w gnieździe, dorosły w Orlej grzędzie, dorosły przy gnieździe 3x3) - dzień i noc.
//   CDP_PORT=9542 node tools/orzel/gniazda_zrzut.js   -> tools/orzel/zrzuty_gniazda/*.png, potem: python tools/orzel/gniazda_sklej.py
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "zrzuty_gniazda");

kit.test({ port: 9542 }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 3, x: 34, y: 20, day: 40, hour: 11, quiet: true, minimap: false });
    // the open meadow east of x=24 on Map003: three nests in a row
    const at = await t.json(`(function(){ const f = $gameSystem._farm, list = (f.buildings[3] = f.buildings[3] || []), out = {};
        const free = (type, x, y) => !Farming.whyNotBuild(type, x, y, false, true);
        const put = (type, x0, y0) => { for (let r = 0; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (free(type, x0 + dx, y0 + dy)) {
            const b = { id: f.nextId++, type, x: x0 + dx, y: y0 + dy, last: 1 }; list.push(b); f.rev++; return b; } return null; };
        out.kosz = put("orzel_kosz", 26, 12); out.gniazdo = put("orzel_gniazdo", 29, 12); out.grzeda = put("orzel_grzeda", 32, 18);
        return out; })()`);
    console.log("gniazda", JSON.stringify(at));
    const panels = [[1, "orzel_kosz", "1_piskle_kosz"], [2, "orzel_kosz", "2_mlody_kosz"], [3, "orzel_gniazdo", "3_podrostek_gniazdo"],
        [4, "orzel_gniazdo", "4_prawie_gniazdo"], [5, "orzel_grzeda", "5_dorosly_grzeda"], [5, "orzel_gniazdo", "6_dorosly_przy_gniezdzie"]];
    const boxes = {};
    for (const hour of [11, 21.1]) {
        for (const [stage, type, name] of panels) {
            // (the adult beside the 3x3 nest: the perch taken away for this one)
            await t.eval(`(function(){ $gameSystem.setDayNightHour(${hour}); const f = $gameSystem._farm, list = f.buildings[3];
                const g = list.find(b => b.type === "orzel_grzeda"), want = ${JSON.stringify(type)};
                if (${stage} === 5 && want === "orzel_gniazdo" && g) { window.__grz = g; list.splice(list.indexOf(g), 1); f.rev++; }
                if (want === "orzel_grzeda" && !g && window.__grz) { list.push(window.__grz); f.rev++; }
                Orzel.forceStage(${stage}); const s = Orzel.state(); s.name = "Śnieżny"; s.bond = 80;
                $gamePlayer.locate(30, 24); s.mode = "home"; s.map = 3; Orzel.removeEagle(); Orzel.sync(); return 0; })()`);
            await t.eval("(function(){ const sc = SceneManager._scene; for (const k of ['_survivalHud', '_cleanHud', '_hud']) if (sc[k]) sc[k].visible = false; return 0; })()");
            await t.frames(40);
            const box = await t.json(`(function(){ const n = Orzel.home(); const tw = 48; $gameMap.setDisplayPos(n.b.x + 2 - $gameMap.screenTileX() / 2, n.b.y - 1 - $gameMap.screenTileY() / 2);
                return null; })()`);
            await t.frames(30);
            const sb = await t.json(`(function(){ const n = Orzel.home(), sp = Orzel.nestScreen(n), e = Orzel.eagle;
                return { x: sp.x, y: sp.y, side: e && e.x < n.b.x ? -1 : 1, e: e ? { x: e.x, y: e.y, pose: e.pose && e.pose.kind, nested: !!e.nested } : null, type: n.b.type }; })()`);
            boxes[name + "_" + Math.floor(hour)] = sb;
            await t.shot(path.join(OUT, name + "_" + Math.floor(hour) + ".png"));
        }
    }
    fs.writeFileSync(path.join(OUT, "boxes.json"), JSON.stringify(boxes, null, 1));
    console.log(JSON.stringify(boxes));
}).catch(e => { console.log("ERR", e); process.exit(1); });
