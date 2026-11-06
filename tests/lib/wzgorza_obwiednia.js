// Przejście bohatera wzdłuż CAŁEJ tylnej i górnej-bocznej krawędzi wzgórz (Wzgorza.js, runda 3): na maksymalnej głębokości pasa (i na losowych płytszych
// pozycjach) sprawdza, że żaden piksel bohatera (z cieniem) nie leży na szczycie wzgórza (w masce zaokrąglonej krawędzi): kadr z bohaterem i bez
// bohatera na obszarze szczytu ma być taki sam. Do tego: warstwa zasłaniająca jest włączona, gdy stopy są za krawędzią (wszystko albo nic).
// Użycie: const r = await require("./lib/wzgorza_obwiednia.js").sprawdz(t, { krok: 6 }); r = { pozycje, bledy: [...], bezWarstwy: n }
"use strict";

const PAGE = step => `(async () => {
    const W = window.Wzgorza, app = Graphics._app, r = app.renderer, ss = SceneManager._scene._spriteset, P = $gamePlayer;
    const sp = ss._characterSprites.find(s => s._character === P);
    const hide = [sp, sp._groundShadow, sp._sunShadow, sp._polishOutline].filter(Boolean);
    const wait = n => new Promise(res => { const t = Graphics.frameCount + n; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(); } }, 4); });
    const grab = () => { r.render(app.stage); return r.extract.pixels(); };
    const g = W.geo(), tiles = W.bandTiles(), seen = new Set(), cand = [];
    const STEP = ${step};
    for (const [tx, ty] of tiles) for (let fy = ty * 48 - 48; fy < ty * 48 + 48; fy += STEP) for (let fx = tx * 48 - 24; fx < tx * 48 + 72; fx += STEP) {
        const k = fy * 100000 + fx;
        if (seen.has(k)) continue;
        seen.add(k);
        if (W.standing(fx, fy) !== 1 || W.bodyBad(fx, fy)) continue;
        cand.push([fx, fy, W.maxDepth(fx, fy)]);
    }
    // the deepest positions all, the shallower every 5th
    const lim = Math.max(W.DEPTH_N, W.DEPTH_S);
    const pick = cand.filter((c, i) => c[2] >= Math.min(W.DEPTH_S, W.DEPTH_N) - 6 || i % 5 === 0);
    const bad = [];
    let noLayer = 0, n = 0;
    const sx0 = 640, sy0 = 360;   // (the sprite's top-left is put at the middle of the screen)
    for (const [fx, fy] of pick) {
        P.setTransparent(false); P._wzUp = false;   // (a position behind the edge is a lower character's: the hero's level carries on from where he was, and the test jumps)
        P._realX = fx / 48; P._realY = fy / 48; P._x = Math.round(P._realX); P._y = Math.round(P._realY);
        $gameMap.setDisplayPos((fx - sx0) / 48, (fy - sy0) / 48);
        await wait(3);
        const ox = Math.ceil($gameMap.displayX() * 48), oy = Math.ceil($gameMap.displayY() * 48);
        const ov = hide.map(h => h.visible);   // (as the game left it: the shadows of a covered character are hidden)
        sp.visible = true;
        const a = grab();
        const layer = W.bandsOn();
        for (const h of hide) h.visible = false;
        const b = grab();
        hide.forEach((h, i) => { h.visible = ov[i]; }); sp.visible = true;
        n++;
        if (!layer) noLayer++;
        const rw = r.width, rh = r.height, res = r.resolution || 1;
        let hit = 0, first = null;
        const cx = Math.round(sp.x), cy = Math.round(sp.y);   // (the sprite's feet on the screen; the hero is not in the middle when the map's edge stops the scroll)
        for (let sy = cy - 80; sy < cy + 20; sy++) for (let sx = cx - 40; sx < cx + 40; sx++) {
            if (sx < 0 || sy < 0 || sx >= 1280 || sy >= 720) continue;
            const i = ((Math.floor(rh) - 1 - Math.floor(sy * res)) * Math.floor(rw) + Math.floor(sx * res)) * 4;   // (extract.pixels of the screen is bottom-up)
            const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
            if (d < 60) continue;
            const s = W.edgeState(sx + ox + 0.5 - 0, sy + oy + 0.5 - 0);
            if (s.inn) { hit++; if (!first) first = [sx + ox, sy + oy, Math.round(s.d), s.kind]; }
        }
        if (hit) bad.push({ fx, fy, hit, first, depth: +W.maxDepth(fx, fy).toFixed(1) });
    }
    // the other half of "all or nothing": feet OUTSIDE the plateau (in front of / beside the edge) - the band is not drawn at all
    const outs = [];
    for (const [tx, ty] of tiles) for (let fy = ty * 48 - 48; fy < ty * 48 + 48; fy += 12) for (let fx = tx * 48 - 40; fx < tx * 48 + 88; fx += 12) if (W.standing(fx, fy) === 0 && outs.length < 4000) outs.push([fx, fy]);
    let outOn = 0, outN = 0;
    for (let i = 0; i < outs.length; i += Math.max(1, Math.floor(outs.length / 120))) {
        const [fx, fy] = outs[i];
        P._realX = fx / 48; P._realY = fy / 48; P._x = Math.round(P._realX); P._y = Math.round(P._realY);
        $gameMap.setDisplayPos((fx - sx0) / 48, (fy - sy0) / 48);
        await wait(3);
        outN++;
        if (W.bandsOn()) outOn++;
    }
    return JSON.stringify({ pozycje: n, naZewnatrz: outN, naZewnatrzZWarstwa: outOn, kandydaci: cand.length, bledy: bad.slice(0, 40), bledowLacznie: bad.length, bezWarstwy: noLayer });
})()`;

async function sprawdz(t, o = {}) {
    await t.eval("$gamePlayer.setTransparent(false); 0");
    return JSON.parse(await t.eval(PAGE(o.krok || 6), 900000));
}
module.exports = { sprawdz };
