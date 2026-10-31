// Zdjęcia sali tawerny z ekranu gry (1280x720, bez HUD): node tools/tavern/przytulna/zdjecia.js <przed|po> [staging]
//   przed: mapa gracza jak jest; po: kopia z próby (GAME_OVERLAY) i włączona wtyczka Przytulna (window.PRZYTULNA = true).
// Wynik: docs/tawerna_przytulna/<przed|po>_<miejsce>.png ; goście i podróżni o 20:00 jak w tests/wydajnosc_test.js
const path = require("path"), fs = require("fs");
process.env.CDP_PORT = process.env.CDP_PORT || "9380";
const ROOT = path.join(__dirname, "..", "..", "..");
const kit = require(path.join(ROOT, "tests", "lib", "kit.js"));
const tag = process.argv[2] || "przed";
const PO = tag === "po";
const only = process.argv.slice(3);
const OUT = path.join(ROOT, "docs", "tawerna_przytulna");
const SPOTS = { // nazwa: [x, y, kierunek, godzina]
    noc: [50, 35, 8, 20.2], dzien: [50, 35, 8, 12], bar_noc: [50, 31, 8, 20.2], bar_dzien: [50, 31, 8, 12],
    kominek: [57, 32, 8, 20.2], scena: [74, 33, 8, 20.2]
};
kit.test(Object.assign({ port: Number(process.env.CDP_PORT), bootCheck: "the game boots" }, PO ? { overlay: "tools/tavern/przytulna/overlay" } : {}), async t => {
    if (PO) await t.eval("window.PRZYTULNA = true; 0");
    await t.newGame({ map: 1, x: 50, y: 34, day: 40, hour: 20, minimap: false });
    await t.eval(`(function(){ for (const k of ["tobiasz", "kartograf", "grajek", "kompania"]) { try { Podroznicy.przyplyn(k); } catch (e) {} } try { Podroznicy.przyplyn("pula"); } catch (e) {} return 0; })()`);
    await t.go(1, 50, 34, 8);
    fs.mkdirSync(OUT, { recursive: true });
    for (const [name, s] of Object.entries(SPOTS)) {
        if (only.length && !only.includes(name)) continue;
        await t.eval(`(function(){ $gamePlayer.locate(${s[0]}, ${s[1]}); $gamePlayer.setDirection(${s[2]}); $gamePlayer.center(${s[0]}, ${s[1]}); $gameSystem.setDayNightHour(${s[3]});
            const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false; return 0; })()`);
        await t.frames(220);
        if (process.env.DIAG) console.log(JSON.stringify(await t.json("({n: $dataMap.note, p: $dataMap._przyt, h: $gameSystem.dayNightHour(), ev: $dataMap.events[50].note, lights: SceneManager._scene._spriteset._nightLight && SceneManager._scene._spriteset._nightLight.lights ? SceneManager._scene._spriteset._nightLight.lights().length : -1})")));
        const f = path.join(OUT, `${tag}_${name}.png`);
        await t.shot(f); console.log("saved", f);
    }
});
