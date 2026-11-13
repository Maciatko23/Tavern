// Obrazy kopalni do docs/kopalnia/ (z gry: staging jako nakładka; "przed" z gry bez nakładki). Potem: python tools/kopalnia/obrazy.py (sklejki, GIF, zestawienie).
//   CDP_PORT=9761 node tools/kopalnia/obrazy.js
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.resolve(__dirname, "..", "..", "docs", "kopalnia");
const RAW = path.join(OUT, "surowe");
const PORT = Number(process.env.CDP_PORT) || 9761;

const HIDE = `(function(){ const s = SceneManager._scene; s.__hid = []; for (const c of s.children) if (c !== s._spriteset && c.visible) { c.visible = false; s.__hid.push(c); } return 0; })()`;
const SHOW = `(function(){ const s = SceneManager._scene; for (const c of (s.__hid || [])) c.visible = true; s.__hid = []; return 0; })()`;

const DARK = off => `(function(){ const sp = SceneManager._scene._spriteset; if (sp && sp._darknessSprite) sp._darknessSprite.visible = ${off ? "false" : "true"}; return 0; })()`;
async function shot(t, name, hide = true) {
    if (hide) await t.eval(HIDE);
    await t.frames(4);
    await t.shot(path.join(RAW, name + ".png"));
    if (hide) await t.eval(SHOW);
}
async function at(t, name, map, x, y, dir, o = {}) {
    await t.go(map, x, y, dir || 2, { fade: false });
    if (o.pre) await t.eval(o.pre);
    await t.eval(DARK(map === 213 && !o.dark));
    await t.frames(o.wait || 60);
    await shot(t, name);
}

(async () => {
    fs.mkdirSync(RAW, { recursive: true });
    // ---- before: the installed game, the quarry's wall
    let t = await kit.open({ port: PORT, bootCheck: "gra" });
    await t.newGame({ map: 3, x: 22, y: 14, quiet: true, minimap: false, hour: 11 });
    await at(t, "wejscie_przed", 13, 54, 34, 8);
    await t.b.close();
    // ---- after: the staged game
    t = await kit.open({ port: PORT, overlay: "tools/kopalnia/staging", overlayJs: true, bootCheck: "gra" });
    await t.newGame({ map: 3, x: 22, y: 14, quiet: true, minimap: false, hour: 11 });
    await at(t, "wejscie_po", 13, 54, 34, 8);
    await at(t, "stacja_a", 213, 9, 33, 4);
    await at(t, "stacja_a_wagonik", 213, 7, 32, 8, { wait: 40, dark: true });
    await at(t, "rozjazd_dzwignia", 213, 57, 22, 2);
    await at(t, "stacja_b", 213, 86, 10, 8);
    await at(t, "gran_przyjazd", 175, 20, 28, 8);
    await at(t, "gran_szyb", 175, 20, 33, 8);
    // the spur: the lever to the branch, a ride to its end, the ore face
    await t.go(213, 57, 22, 2, { fade: false });
    await t.eval("(function(){ const s = Kopalnia.state(); if (!s.lever) Kopalnia.lever(); return 0; })()");
    await t.go(213, 7, 32, 8, { fade: false });
    await t.eval("Kopalnia.ride('A', 'S'); 0");
    await t.until("!Kopalnia.state().ride", 80, 200);
    await t.frames(40);
    await t.eval(DARK(true));
    await shot(t, "odnoga_ruda");
    await t.eval("(function(){ $gamePlayer.locate(58, 16); $gamePlayer.setDirection(8); return 0; })()");
    await t.frames(30);
    await shot(t, "odnoga_tory");
    await t.eval("(function(){ if (Kopalnia.state().lever) Kopalnia.lever(); return 0; })()");
    // the whole map as the game draws it: screens at whole tiles, stitched later
    await t.go(213, 9, 37, 8, { fade: false });
    await t.frames(30);
    const W = 96, H = 40, SW = 26, SH = 15;
    const xs = [0, 26, 52, W - SW], ys = [0, 13, H - SH];
    await t.eval(HIDE);
    await t.eval(DARK(true));
    for (const y of ys) for (const x of xs) {
        await t.eval(`$gameMap.setDisplayPos(${x}, ${y}); 0`);
        await t.frames(8);
        await t.shot(path.join(RAW, `mapa_${x}_${y}.png`));
    }
    await t.eval(SHOW);
    await t.eval(DARK(false));
    // the ride: shots by the distance on the way (A -> B)
    await t.go(213, 7, 32, 8, { fade: false });
    await t.frames(20);
    await t.eval("Kopalnia.ride('A', 'B'); 0");
    const marks = [1, 6, 14, 24, 30.4, 31.2, 36, 41, 45, 49, 60, 72, 85, 93];
    const log = [];
    let last = Date.now();
    for (let i = 0; i < marks.length; i++) {
        await t.until(`Kopalnia.state().ride && Kopalnia.state().ride.s >= ${marks[i]}`, 60, 20);
        await t.eval(HIDE);
        await t.shot(path.join(RAW, `jazda_${String(i).padStart(2, "0")}.png`));
        await t.eval(SHOW);
        log.push({ i, s: marks[i], ms: Date.now() - last }); last = Date.now();
    }
    fs.writeFileSync(path.join(RAW, "jazda.json"), JSON.stringify(log));
    await t.until("!Kopalnia.state().ride", 60, 200);
    await t.frames(30);
    await shot(t, "stacja_b_przyjazd");
    // a dense run for the GIF: round the first two corners (about 27..50 tiles of the way), back to back
    await t.go(213, 7, 32, 8, { fade: false });
    await t.frames(20);
    await t.eval("Kopalnia.ride('A', 'B'); 0");
    await t.until("Kopalnia.state().ride && Kopalnia.state().ride.s >= 27", 60, 20);
    await t.eval(HIDE);
    const gif = [];
    let prev = Date.now();
    for (let i = 0; i < 70; i++) {
        const s = await t.json("Kopalnia.state().ride ? Kopalnia.state().ride.s : -1");
        if (s < 0 || s > 52) break;
        await t.shot(path.join(RAW, `gif_${String(i).padStart(3, "0")}.png`));
        const now = Date.now(); gif.push(now - prev); prev = now;
    }
    await t.eval(SHOW);
    fs.writeFileSync(path.join(RAW, "gif.json"), JSON.stringify(gif));
    await t.eval("Kopalnia.brake(); 0");
    await t.until("!Kopalnia.state().ride", 80, 200);
    console.log("errors:", JSON.stringify(t.errors()));
    await t.b.close();
    process.exit(0);
})().catch(e => { console.log("ERR", e); process.exit(1); });
