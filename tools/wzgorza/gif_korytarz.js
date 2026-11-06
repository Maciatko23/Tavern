// The walk through the corridor (in at the left side, round the corners, out on the right) as frames: SZER=1920 WYS=1080 node tools/wzgorza/gif_korytarz.js -> docs/wzgorza/runda4/kor_NN.png
const kit = require("../../tests/lib/kit.js"); const path = require("path"), fs = require("fs");
const OUT = path.join(__dirname, "..", "..", "docs", "wzgorza", "runda4", "klatki"); fs.mkdirSync(OUT, { recursive: true });
kit.test({ port: Number(process.env.CDP_PORT) || 9413, width: Number(process.env.SZER) || 1920, height: Number(process.env.WYS) || 1080, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.newGame({ map: 990, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    await t.eval("document.querySelectorAll('canvas').length; 0");
    await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer._wzUp = false; $gamePlayer._realX = 1690 / 48; $gamePlayer._realY = 1040 / 48; $gamePlayer._x = 35; $gamePlayer._y = 21; $gamePlayer.setDirection(6); 0`);
    await t.frames(40);
    let n = 0;
    const shot = async () => { await t.shot(path.join(OUT, "kor_" + String(n++).padStart(2, "0") + ".png")); };
    const HOLD = async (keys, frames) => { await t.eval(`window.__k = ${JSON.stringify(keys)}; window.__iv = setInterval(() => { for (const k of ["left","right","up","down"]) Input._currentState[k] = window.__k.includes(k); }, 4); 0`); await t.frames(frames); await t.eval("clearInterval(window.__iv); for (const k of ['left','right','up','down']) Input._currentState[k] = false; 0"); };
    const pos = () => t.json("[Math.round($gamePlayer._realX * 48), Math.round($gamePlayer._realY * 48), Wzgorza.standing(Math.round($gamePlayer._realX * 48), Math.round($gamePlayer._realY * 48))]");
    await shot();
    for (let k = 0; k < 5; k++) { await HOLD(["right"], 12); await shot(); }
    for (let k = 0, py = 1e9; k < 40; k++) { await HOLD(["up"], 8); const p = await pos(); await shot(); if (p[1] <= 905 || p[1] >= py) break; py = p[1]; }
    for (let k = 0, px = -1e9; k < 60; k++) { await HOLD(["right"], 8); const p = await pos(); await shot(); console.log(JSON.stringify(p)); if (p[0] >= 2262 || p[0] <= px) break; px = p[0]; }
    for (let k = 0; k < 2; k++) { await HOLD(["right"], 12); await shot(); }
    console.log("frames", n);
});
