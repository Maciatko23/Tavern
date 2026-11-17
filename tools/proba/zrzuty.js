// Shots of the test map (Map027) through the overlay tools/proba/staging:
//   CDP_PORT=9610 node tools/proba/zrzuty.js     -> docs/proba/mapa_testowa.png (24 px/tile), mapa_stare_48.png, mapa_nowe_48.png; plus a walk check
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "proba"); fs.mkdirSync(OUT, { recursive: true });
const U = JSON.parse(fs.readFileSync(path.join(__dirname, "uklad_mapy.json"), "utf8"));
const W = U.w, H = U.h;
async function stitch(t, file, P, RX0, RY0, RX1, RY1) {
    await t.eval(`window.__pm = document.createElement("canvas"); __pm.width = ${(RX1 - RX0) * P}; __pm.height = ${(RY1 - RY0) * P}; 0`);
    const SW = 1280 / 48, SH = 720 / 48, MX = 1, MY = 1.5, cw = Math.floor(SW - 2 * MX), ch = Math.floor(SH - 2 * MY);
    const xs = [], ys = [];
    for (let x = RX0 - 1; x < RX1 - SW + cw + 1; x += cw) xs.push(Math.min(x, Math.max(0, W - SW)));
    for (let y = RY0 - 2; y < RY1 - SH + ch + 2; y += ch) ys.push(Math.min(y, Math.max(0, H - SH)));
    for (const y of [...new Set(ys)]) for (const x of [...new Set(xs)]) {
        await t.eval(`(function(){ $gamePlayer.locate(0, 0); $gameMap.setDisplayPos(${x}, ${y});
            const sp = SceneManager._scene; for (const k of ['_cleanLayer','_cleanTop','_windowLayer']) if (sp[k]) sp[k].visible = false;
            const ss = sp._spriteset; if (ss._cloudSprites) { for (const c of ss._cloudSprites) if (c.parent) c.parent.removeChild(c); ss._cloudSprites.length = 0; }
            return 0; })()`);
        await t.frames(20);
        await t.eval(`(function(){ const src = Graphics._canvas || document.querySelector("canvas"), dx = $gameMap.displayX(), dy = $gameMap.displayY();
            const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false;
            for (const c of sc._spriteset.children) if (/^(Sprite_CloudShadow|Weather|Sprite_StormSky|Sprite_StormLeaves|Sprite_SunRays)$/.test(c.constructor.name)) c.visible = false;
            if (Graphics._app && Graphics._app.renderer) Graphics._app.renderer.render(Graphics._app.stage);
            const l = dx <= 0.05 ? 0 : ${MX}, r = dx + ${SW} >= ${W} - 0.05 ? 0 : ${MX}, u = dy <= 0.05 ? 0 : ${MY}, b = dy + ${SH} >= ${H} - 0.05 ? 0 : ${MY};
            const x0 = Math.floor((dx + l) * ${P}), x1 = Math.ceil((dx + ${SW} - r) * ${P}), y0 = Math.floor((dy + u) * ${P}), y1 = Math.ceil((dy + ${SH} - b) * ${P});
            __pm.getContext("2d").drawImage(src, (x0 / ${P} - dx) * 48, (y0 / ${P} - dy) * 48, (x1 - x0) / ${P} * 48, (y1 - y0) / ${P} * 48, x0 - ${RX0 * P}, y0 - ${RY0 * P}, x1 - x0, y1 - y0); return 0; })()`);
    }
    const url = await t.eval("__pm.toDataURL('image/png')");
    fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
}
kit.test({ port: Number(process.env.CDP_PORT || 9610), overlay: "tools/proba/staging", lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000,
    beforeLoad: "window.WIDOK = false; window.BRZEG_ALL = true; window.LAKA_ALL = true;" }, async t => {
    await t.newGame({ map: 27, x: U.start[0], y: U.start[1], day: 40, hour: 12, quiet: true, minimap: false });
    t.check("map 27 loaded, tileset 17", await t.eval("$gameMap.mapId() === 27 && $dataMap.tilesetId === 17 && $gameMap.tileset().id === 17"));
    await t.eval("$gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); ConfigManager.moodVignette = false; 0");
    await t.frames(60);
    if (process.env.PHASE !== "walk") {
        const split = 74;
        await stitch(t, path.join(OUT, "mapa_testowa.png"), 24, 0, 0, W, H);
        await stitch(t, path.join(OUT, "mapa_stare_48.png"), 48, 0, 0, split, H);
        await stitch(t, path.join(OUT, "mapa_nowe_48.png"), 48, split, 0, W, H);
    }
    // walk check: flood fill of passable cells from the start (the engine's own passability), must reach every door-front cell
    const r = await t.eval(`(function(){ const W=$gameMap.width(),H=$gameMap.height(); const seen=new Set(); const st=[[${U.start[0]},${U.start[1]}]]; seen.add(${U.start[1]}*W+${U.start[0]});
        const ok=(x,y,d)=>$gamePlayer.isMapPassable(x,y,d);
        while(st.length){ const [x,y]=st.pop(); for(const d of [2,4,6,8]){ if(!ok(x,y,d)) continue; const nx=$gameMap.roundXWithDirection(x,d), ny=$gameMap.roundYWithDirection(y,d); const k=ny*W+nx; if(seen.has(k)) continue; seen.add(k); st.push([nx,ny]); } }
        let pass=0; for(let y=0;y<H;y++)for(let x=0;x<W;x++) if(ok(x,y,2)||ok(x,y,4)||ok(x,y,6)||ok(x,y,8)) pass++;
        const lbl=$gameMap.events().filter(e=>/^(Stare|Nowe)/.test(e.event().name)).map(e=>[e.event().name, seen.has(e.y*W+e.x)]);
        return JSON.stringify({reach:seen.size,pass,lbl}); })()`);
    console.log(r);
    const o = JSON.parse(r);
    t.check("every label cell reachable on foot", o.lbl.every(a => a[1]));
});
