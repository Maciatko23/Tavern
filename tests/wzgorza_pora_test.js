// Warstwa zasłaniająca ma być pikselowo identyczna z tym, co leży pod nią (ta sama pora dnia, Mood, cienie, pogoda): przy bohaterze za krawędzią,
// bez bohatera (jego sprite i cienie ukryte w obu kadrach), kadr z warstwą i kadr bez niej mają się nie różnić w pasie.
// GAME_OVERLAY=tools/wzgorza/staging GAME_OVERLAY_JS=1 CDP_PORT=9413 node tests/wzgorza_pora_test.js
"use strict";
const kit = require("./lib/kit.js");
const POS = process.env.POS ? JSON.parse(process.env.POS) : [[1900, 880], [1760, 880], [2090, 880], [2040, 896], [2110, 890]];
const FRAC = Number(process.env.FRAC) || 0;   // fractional scroll in px (0.37 = like a walk)
const CONDS = [["rano 7:00", 7, false], ["południe", 12, false], ["noc 22:00", 22, false], ["południe, deszcz", 12, true], ["wieczór 19:30", 19.5, false]];
const PAGE = (hour, rain, pos, FR) => `(async () => {
    const W = window.Wzgorza, app = Graphics._app, r = app.renderer, ss = SceneManager._scene._spriteset, P = $gamePlayer;
    const sp = ss._characterSprites.find(s => s._character === P);
    const hide = [sp, sp._groundShadow, sp._sunShadow].filter(Boolean);
    const wait = n => new Promise(res => { const t = Graphics.frameCount + n; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(); } }, 4); });
    $gameSystem.setDayNightHour(${hour}); ${rain ? "$gameScreen.changeWeather('rain', 6, 0);" : "$gameScreen.changeWeather('none', 0, 0);"}
    await wait(90);
    const grab = () => { r.render(app.stage); return r.extract.pixels(); };
    const out = [];
    for (const [fx, fy] of ${JSON.stringify(pos)}) {
        P.setTransparent(false); P._wzUp = false; P._realX = fx / 48; P._realY = fy / 48; P._x = Math.round(P._realX); P._y = Math.round(P._realY);
        $gameMap.setDisplayPos((fx - 640 + ${FR}) / 48, (fy - 360 + ${FR}) / 48);   // (FR: a fractional scroll like walking gives - the layer must stay in step with the tilemap, which rounds its origin up)
        await wait(8);
        const pieces = Array.from(ss._wzgorzaLip._pieces.values()).filter(Boolean);
        const on = pieces.filter(p => p.visible), ov = hide.map(h => h.visible);   // (the visibility the game left: the covered character's shadows are off)
        const back = () => hide.forEach((h, i) => { h.visible = ov[i]; });
        hide.forEach(h => { h.visible = false; });
        const a = grab();
        on.forEach(p => { p.visible = false; });
        const b = grab();
        on.forEach(p => { p.visible = true; });
        back();
        const ox = Math.ceil($gameMap.displayX() * 48), oy = Math.ceil($gameMap.displayY() * 48), rh = Math.floor(r.height), rw = Math.floor(r.width);
        let bad = 0, n = 0, maxd = 0;
        for (const p of on) for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) {
            const sx = p.x + i - ox, sy = p.y + j - oy;
            if (sx < 0 || sy < 0 || sx >= rw || sy >= rh) continue;
            const q = ((rh - 1 - sy) * rw + sx) * 4, d = Math.abs(a[q] - b[q]) + Math.abs(a[q + 1] - b[q + 1]) + Math.abs(a[q + 2] - b[q + 2]);
            // (only the pixels the piece really draws: it is opaque there; elsewhere the two frames are the same)
            if (d > 0) { n++; if (d > 9) bad++; if (d > maxd) maxd = d; }
        }
        // the shadows of the covered character (its own and the sun's) must not lie on the plateau either: only the sprite hidden, shadows left, against all hidden
        back(); sp.visible = false;
        const sh = grab();
        back();
        let shadowOn = 0;
        for (let sy = 0; sy < rh; sy += 1) { if (Math.abs(sy - (sp.y - 20)) > 60) continue; for (let sx = Math.max(0, Math.round(sp.x) - 70); sx < Math.min(rw, Math.round(sp.x) + 70); sx++) {
            const q = ((rh - 1 - sy) * rw + sx) * 4;
            if (Math.abs(sh[q] - a[q]) + Math.abs(sh[q + 1] - a[q + 1]) + Math.abs(sh[q + 2] - a[q + 2]) > 6 && W.edgeState(sx + ox + 0.5, sy + oy + 0.5).inn) shadowOn++; } }
        // (the test's own power: the pieces moved by 1 px must differ from the world - else the zero above says nothing)
        hide.forEach(h => { h.visible = false; }); on.forEach(p => { p.x += 1; });
        const c = grab();
        on.forEach(p => { p.x -= 1; }); back();
        let sens = 0;
        for (const p of on) for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) { const sx = p.x + i - ox, sy = p.y + j - oy; if (sx < 0 || sy < 0 || sx >= rw || sy >= rh) continue; const q = ((rh - 1 - sy) * rw + sx) * 4; if (Math.abs(c[q] - b[q]) + Math.abs(c[q + 1] - b[q + 1]) + Math.abs(c[q + 2] - b[q + 2]) > 9) sens++; }
        out.push({ fx, fy, kawalki: on.length, roznych: n, zlych: bad, maks: maxd, czulosc: sens, cien: shadowOn });
    }
    return JSON.stringify(out);
})()`;
kit.test({ port: Number(process.env.CDP_PORT) || 9413, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: 990, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    for (const [name, hour, rain] of CONDS) {
        const r = JSON.parse(await t.eval(PAGE(hour, rain, POS, FRAC), 300000));
        const bad = r.reduce((s, x) => s + x.zlych, 0), pcs = r.reduce((s, x) => s + x.kawalki, 0);
        console.log("   " + name + ": " + JSON.stringify(r.map(x => [x.kawalki, x.roznych, x.zlych, x.maks, x.czulosc, x.cien])));
        t.check(name + ": warstwa zasłaniająca pikselowo taka sama jak świat pod nią (żadnego prostokąta)", pcs > 0 && bad === 0 && r.every(x => x.kawalki === 0 || (x.czulosc > 5 && x.cien === 0)), r);
    }
});
