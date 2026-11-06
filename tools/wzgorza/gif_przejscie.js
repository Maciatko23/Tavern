// The walk behind the back edge as frames: DIR=right|left SZER=1920 WYS=1080 node tools/wzgorza/gif_przejscie.js -> docs/wzgorza/runda4/klatki/pr_NN.png (the GIF is put together by the caller)
const kit = require("../../tests/lib/kit.js"); const path = require("path"), fs = require("fs");
const OUT = path.join(__dirname, "..", "..", "docs", "wzgorza", "runda4", "klatki"); fs.mkdirSync(OUT, { recursive: true });
const DIR = process.env.DIR === "left" ? "left" : "right", FY = Number(process.env.FY) || 884;
kit.test({ port: Number(process.env.CDP_PORT) || 9413, width: Number(process.env.SZER) || 1920, height: Number(process.env.WYS) || 1080, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.newGame({ map: 990, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    const X0 = Number(process.env.X0) || (DIR === "right" ? 1850 : 2000), Y0 = Number(process.env.Y0) || 850;
    await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer._wzUp = false; $gamePlayer._realX = ${X0} / 48; $gamePlayer._realY = ${Y0} / 48; $gamePlayer._x = Math.round(${X0} / 48); $gamePlayer._y = Math.round(${Y0} / 48); $gamePlayer.setDirection(2); 0`);
    await t.frames(40);
    let n = 0;
    const POS = [];
    const shot = async () => { await t.shot(path.join(OUT, "pr_" + String(n++).padStart(2, "0") + ".png")); POS.push(await t.json("(() => { const sp = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); return [sp.x, sp.y]; })()")); fs.writeFileSync(path.join(OUT, "pos.json"), JSON.stringify(POS)); };
    const st = () => t.json("(() => { const x = Math.round($gamePlayer._realX * 48), y = Math.round($gamePlayer._realY * 48); return [x, y, Wzgorza.standing(x, y), Wzgorza.maxDepth(x, y)]; })()");
    const HOLD = async (keys, frames) => { await t.eval(`window.__k = ${JSON.stringify(keys)}; window.__iv = setInterval(() => { for (const k of ["left","right","up","down"]) Input._currentState[k] = window.__k.includes(k); }, 4); 0`); await t.frames(frames); await t.eval("clearInterval(window.__iv); for (const k of ['left','right','up','down']) Input._currentState[k] = false; 0"); };
    // the whole run as the player presses it: the way, and "down" too in the strip going right
    let s0 = await st(), was = false, post = 0;
    await shot();
    for (let k = 0; k < 140 && post < 4; k++) {
        await HOLD([DIR], 6);
        s0 = await st(); await shot(); if (process.env.DBGS) console.log("S", n, s0.join(","));
        if (s0[2] === 1) was = true;
        if (was && s0[2] === 0) post++;
    }
    console.log("frames", n);
});
