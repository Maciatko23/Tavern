// Hero trying to get onto the hill through a rounded back corner: PREFIKS=przed|po node tools/wzgorza/probuje.js  -> docs/wzgorza/runda4/<prefiks>_wejscie_<nazwa>.png
const kit = require("../../tests/lib/kit.js"); const path = require("path"), fs = require("fs");
const OUT = path.join(__dirname, "..", "..", "docs", "wzgorza", "runda4"); fs.mkdirSync(OUT, { recursive: true });
const PRE = process.env.PREFIKS || "po";
const CASES = [["tyl", 1900, 850, ["down"], 70], ["lewy_bok_nisko", 1600, 1160, ["right"], 90], ["lewy_bok_wyzej", 1700, 975, ["right"], 80], ["rog_stopnia", 2500, 985, ["left"], 150]];
kit.test({ port: Number(process.env.CDP_PORT) || 9413, width: Number(process.env.SZER) || 1280, height: Number(process.env.WYS) || 720, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.newGame({ map: 990, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    for (const [name, fx, fy, keys, n] of CASES) {
        await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer._wzUp = false; $gamePlayer._realX = ${fx} / 48; $gamePlayer._realY = ${fy} / 48; $gamePlayer._x = Math.round(${fx} / 48); $gamePlayer._y = Math.round(${fy} / 48); $gamePlayer.center($gamePlayer._realX, $gamePlayer._realY); 0`);
        await t.frames(10);
        await t.eval(`window.__k = ${JSON.stringify(keys)}; window.__iv = setInterval(() => { for (const k of ["left","right","up","down"]) Input._currentState[k] = window.__k.includes(k); }, 4); 0`);
        await t.frames(n);
        await t.eval("clearInterval(window.__iv); for (const k of ['left','right','up','down']) Input._currentState[k] = false; 0");
        await t.frames(6);
        console.log(name, await t.json("[Math.round($gamePlayer._realX * 48), Math.round($gamePlayer._realY * 48), Wzgorza ? Wzgorza.standing(Math.round($gamePlayer._realX * 48), Math.round($gamePlayer._realY * 48)) : -1]"));
        await t.shot(path.join(OUT, `${PRE}_bok_${name}.png`));
    }
});
