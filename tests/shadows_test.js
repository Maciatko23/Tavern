// Shadows lie on the ground (user 2026-10-08: "jeśli cień jednego drzewa wchodzi na inne drzewo, to powinien być za tym drzewem" +
// "i ogólnie wszystkie cienie tak"). At night the dark lies over everything, so a fire's shadows are kept off what stands by hand
// (Sky.js: standing, keepOffStanding): a tree, a bush, a rock, a man, a building in a fire's light is lit by the light where it stands -
// a shadow passing behind it on the screen is hidden by it; one that reaches its foot climbs it (darkens it). By day the sun's shadows
// lie in one layer under every standing thing; the clouds' over everything. And what it costs. CDP_PORT=9489.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "cienie");

// in the page: the night canvas read with the shadows on and off in the same frame (same flicker), the old cut (before 2026-10-08:
// straight out of the light, over everything) for comparison, and what a stand covers at a screen point
const HELPERS = String.raw`(function(){
    const H = window.__sh = {};
    const N = () => SceneManager._scene._spriteset._nightLight;
    const imgData = new Map();
    function alphaImg(img, x, y) {
        let d = imgData.get(img);
        if (!d) { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const g = c.getContext("2d"); g.drawImage(img, 0, 0); d = { w: img.width, h: img.height, a: g.getImageData(0, 0, img.width, img.height).data }; imgData.set(img, d); }
        x = Math.round(x); y = Math.round(y);
        return x < 0 || y < 0 || x >= d.w || y >= d.h ? 0 : d.a[(y * d.w + x) * 4 + 3] / 255;
    }
    // how solid a stand is at a screen point (its own picture or silhouette)
    H.cover = (st, X, Y) => { const m = st.m, ly = (Y - m.ty) / m.d, lx = (X - m.tx - m.c * ly) / m.a, u = lx - st.lx, v = ly - st.ly;
        return u < 0 || v < 0 || u >= st.sw || v >= st.sh ? 0 : alphaImg(st.img, st.sx + u, st.sy + v); };
    const OLD = function(c, blockers, k, ox, oy) { const S = Sky; c.globalCompositeOperation = "destination-out";
        for (const b of blockers) { const o = b.o, sharp = o.bmp.canvas, soft = S.soft(o.bmp), e = soft._pad, band = Math.ceil(o.cy / 8);
            for (const pass of [0, 1]) { const img = pass ? soft.canvas : sharp, Hh = img.height, W = img.width, shift = pass ? e : 0;
                for (let top = 0; top < Hh; top += band) { const rows = Math.min(band, Hh - top), y0 = top - shift, mid = Math.max(0, Math.min(1, (o.cy - y0 - rows / 2) / (o.cy - 1)));
                    const blur = Math.max(0, Math.min(1, (mid - 0.12) / 0.45)), share = pass ? blur : 1 - blur; if (share <= 0.01) continue;
                    c.globalAlpha = 0.85 * o.alpha * share * Math.pow(1 - 0.65 * mid, 1.3);
                    const m = S.matrix(o, b.ux, b.uy, b.len, 1.05 + Math.min(0.8, (b.L * mid) / (b.d + 90)), b.m);
                    c.setTransform(m.a * k, m.b * k, m.c * k, m.d * k, m.tx * k - ox, m.ty * k - oy); c.drawImage(img, 0, top, W, rows + 1, -o.cx - shift, y0 - o.cy, W, rows + 1); } } }
        c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; };
    // the night's dark (alpha 0..255) at screen points: shadows off / on (now) / on the old way - the same frame of the flame
    H.dark = points => { const L = N(), a0 = L._age, cut = Sky.cutLightShadows, read = () => { const g = L.bitmap.context; return points.map(([x, y]) => g.getImageData(Math.round(x / 2), Math.round(y / 2), 1, 1).data[3]); };
        Sky.shadows = false; L._age = a0; L.update(); const off = read();
        Sky.shadows = true; Sky.cutLightShadows = OLD; L._age = a0; L.update(); const old = read();
        Sky.cutLightShadows = cut; L._age = a0; L.update(); const on = read();
        return { off, on, old }; };
    // the lights of the night layer with shadows, their blockers and the stands (as the layer makes them this frame)
    H.scene = () => { const set = SceneManager._scene._spriteset, L = N(), things = Sky.occluders(set);
        const lights = L.lights().filter(l => l.gy !== undefined).map(l => ({ l, bl: Sky.lightBlockers(l, things, L._age + 1, 1) })).filter(x => x.bl.length);
        return { set, lights, stands: Sky.standing(set, L.standingSprites()) }; };
    // the shadow at a stand's foot from the others (as keepOffStanding samples it)
    // (a wide one - a building - along its whole foot: the darkest spot)
    H.footShade = (st, bl) => { let lit = 1; const w = st.o ? 4 * Math.abs(st.o.sx) : Math.min(8, (st.x1 - st.x0) / 6);
        for (const b of bl) { if (b.o === st.o) continue; const sh = Sky.shadeOf(b); let s = 0;
            if (st.wide) for (let x = st.x0; x <= st.x1; x += 4) s = Math.max(s, Sky.shadeAt(sh, x, st.base));
            else s = (Sky.shadeAt(sh, st.fx - w, st.base) + Sky.shadeAt(sh, st.fx, st.base) + Sky.shadeAt(sh, st.fx + w, st.base)) / 3;
            lit *= 1 - s; }
        return 1 - lit; };
    // points inside a stand (its picture solid there, nothing in front of it), at heights k of it, in a light's round
    H.inside = (st, stands, l, ks) => { const out = [];
        for (const k of ks) for (const dx of [-0.2, 0, 0.2]) {
            const X = st.fx + dx * (st.x1 - st.x0), Y = st.base - k * st.h;
            if (Math.hypot(X - l.x, Y - l.y) > l.r * 0.8 || H.cover(st, X, Y) < 0.95) continue;
            if (stands.some(f => f !== st && Sky.standOrder(f, st) > 0 && H.cover(f, X, Y) > 0.05)) continue;
            out.push([X, Y]); }
        return out; };
    return 0;
})()`;

kit.test({ port: 9489, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    require("fs").mkdirSync(SHOTS, { recursive: true });
    await t.newGame({ map: 3, x: 13, y: 12, day: 10, hour: 23, quiet: true, minimap: false });
    const calm = () => t.eval("(function(){ Survival.calmWeather(); $gameScreen.clearWeather(); for (const c of SceneManager._scene._spriteset._cloudSprites || []) { c._baseOpacity = 0; c.opacity = 0; } return 0; })()");
    await calm();
    await t.eval(HELPERS);
    const camp = (x, y, extra) => t.eval(`(function(){ const F = $gameSystem._farm, L = (F.buildings[$gameMap.mapId()] = F.buildings[$gameMap.mapId()] || []); L.length = 0;
        L.push({ id: F.nextId++, type: "campfire", x: ${x}, y: ${y}, last: 1 }); ${extra || ""} F.rev++; return 0; })()`);
    const view = (x, y) => t.eval(`(function(){ $gamePlayer.updateScroll = function(){}; $gameMap.setDisplayPos(${x}, ${y}); return 0; })()`);

    // ---- a campfire among the pines of the wood (Map003) and the hero with a lit torch: every thing standing in the light
    await view(1, 4);
    await camp(16, 12);
    await t.eval(`(function(){ $gameParty.gainItem($dataItems[59], 1); const a = $gameParty.leader(), it = $dataItems[59]; a.useItem(it); const act = new Game_Action(a); act.setItemObject(it); act.applyGlobal(); return 0; })()`);
    await t.until("Torch.isLit()", 10);
    await t.frames(40);
    await calm();
    // stands whose foot is lit (no other's shadow there) and points on them: as dark as with no shadows at all
    const survey = () => t.json(`(function(){ const H = __sh, sc = H.scene(), lit = [], shaded = [];
        for (const st of sc.stands) {
            // its foot in every light that reaches it: lit in all of them, or in one of them in another's shadow
            const near = sc.lights.filter(({ l }) => Math.hypot(st.fx - l.x, st.base - l.y) < l.r);
            if (!near.length || st.alpha < 0.98) continue;   // (a tree the hero is behind is half see-through: what is behind it shows)
            const f = near.map(({ bl }) => H.footShade(st, bl)), l = near[0].l;
            if (f.every(v => v < 0.02)) { for (const p of H.inside(st, sc.stands, l, [0.3, 0.5, 0.7])) if (sc.lights.every(({ l: q }) => Math.hypot(p[0] - q.x, p[1] - q.y) > q.r || near.some(n => n.l === q))) lit.push(p); }
            else if (Math.max(...f) > 0.3) { const k = f.indexOf(Math.max(...f)); for (const p of H.inside(st, sc.stands, near[k].l, [0.15, 0.3])) shaded.push(p); }
        }
        const dl = H.dark(lit), ds = H.dark(shaded);
        const diff = (a, b) => a.map((v, i) => v - b[i]);
        return { lights: sc.lights.length, stands: sc.stands.length, lit: lit.length, shaded: shaded.length,
            litNow: diff(dl.on, dl.off), litOld: diff(dl.old, dl.off), shadedNow: diff(ds.on, ds.off) }; })()`);
    const s1 = await survey();
    const maxNow = Math.max(0, ...s1.litNow), oldHits = s1.litOld.filter(d => d > 12).length;
    t.check("in the wood at night (a campfire and a torch): " + s1.lit + " points on " + s1.stands + " standing things whose foot is lit - no other thing's shadow on any of them (as dark as with no shadows: at most " + maxNow + "/255 more)",
        s1.lights >= 2 && s1.lit >= 20 && maxNow <= 8, { lights: s1.lights, lit: s1.lit, maxNow });
    t.check("...the old way (shadows cut out of the light over everything) left a dark wedge on " + oldHits + " of those points", oldHits >= 3, { oldHits, worst: Math.max(...s1.litOld) });
    const darker = s1.shadedNow.filter(d => d > 8).length;
    t.check("a thing whose foot lies in another's shadow from the fire is in its shadow too: " + darker + " of " + s1.shaded + " points on such things darker than with no shadows",
        s1.shaded >= 4 && darker >= 0.8 * s1.shaded, { shaded: s1.shaded, darker, d: s1.shadedNow.slice(0, 12) });
    await t.shot(path.join(SHOTS, "stojace_las_noc.png"));

    // ---- the hero behind a tree from the fire: in its shadow (dark); in front of the fire: lit (no shadow over him)
    await t.eval("Torch.douse(''); $gameSwitches.setValue(2, false); 0");
    const tf = await t.json(`(function(){ const trees = SceneManager._scene._spriteset._characterSprites.filter(o => o._character instanceof Game_Event && o.isTreeSprite && o.isTreeSprite() && !o._character._treeGone).map(o => o._character);
        const free = (x, y) => $gameMap.isPassable(x, y, 2) && !$gameMap.eventsXy(x, y).length && !Farming.buildingAt(x, y);
        // (nothing standing in front of the hero's spot - below it on the screen - to hide him)
        const open = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ($gameMap.eventsXy(x, y).length) return false; return true; };
        for (const e of trees) { const fx = e.x - 2, y = e.y; if ([[fx, y], [fx - 1, y], [e.x + 2, y], [e.x + 1, y], [fx, y + 1], [fx - 2, y]].every(([x, yy]) => free(x, yy)) && open(e.x + 1, e.x + 3, y + 1, y + 4) && open(e.x - 4, e.x - 2, y + 1, y + 4) && e.x > 6 && e.x < 32 && y > 6 && y < 22) return { id: e.eventId(), x: e.x, y }; }
        return null; })()`);
    t.check("a pine with room for a campfire two tiles to its left and the hero two to its right", !!tf, tf);
    if (tf) {
        await view(tf.x - 13, tf.y - 7);
        await camp(tf.x - 2, tf.y);
        const heroAt = async x => { await t.eval(`(function(){ $gamePlayer.locate(${x}, ${tf.y}); $gamePlayer.setDirection(2); return 0; })()`); await t.frames(12); await calm();
            return t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer), o = s._occluder, h = (o.bmp._footRow + 1) * o.sy;
                const sc = __sh.scene(), st = sc.stands.find(x => x.o === o), pts = [[o.fx, o.fy - 0.35 * h], [o.fx, o.fy - 0.6 * h]];
                const hidden = pts.some(([X, Y]) => sc.stands.some(f => f !== st && Sky.standOrder(f, st) > 0 && __sh.cover(f, X, Y) > 0.05));
                const d = __sh.dark(pts); return { on: d.on, off: d.off, old: d.old, hidden }; })()`); };
        const behind = await heroAt(tf.x + 2), front = await heroAt(tf.x - 3);
        t.check("the hero behind the pine from the fire stands in its shadow: dark all over (his body darker than with no shadows)",
            !behind.hidden && behind.on.every((v, i) => v > behind.off[i] + 15), behind);
        t.check("...on the fire's other side, in its light, nothing's shadow lies on him", !front.hidden && front.on.every((v, i) => Math.abs(v - front.off[i]) <= 8), front);
        await heroAt(tf.x + 2);
        await t.shot(path.join(SHOTS, "stojace_bohater_w_cieniu_sosny.png"));
    }

    // ---- a man's shadow on a building (Farming's hut): it climbs the wall only where it reaches the wall's foot, not over the roof
    const hutSpot = await t.json(`(function(){ const free = (x, y) => $gameMap.isPassable(x, y, 2) && !$gameMap.eventsXy(x, y).length;
        for (let y = 8; y < 26; y++) for (let x = 4; x < 32; x++) { let ok = true;
            for (let yy = y - 3; yy <= y + 4 && ok; yy++) for (let xx = x - 3; xx <= x + 5; xx++) if (!free(xx, yy)) { ok = false; break; }
            if (ok) return { x, y }; } return null; })()`);
    t.check("open ground for a hut with a campfire in front of it", !!hutSpot, hutSpot);
    if (hutSpot) {
        const { x, y } = hutSpot;   // the hut x..x+4, y-2..y; the fire two tiles in front of its left part; the hero between
        await view(x - 11, y - 8);
        await camp(x + 1, y + 3, `L.push({ id: F.nextId++, type: "hut", x: ${x}, y: ${y}, last: 1 });`);
        await t.eval(`(function(){ $gamePlayer.locate(${x + 1}, ${y + 1}); $gamePlayer.setDirection(2); return 0; })()`);
        await t.frames(20);
        await calm();
        const wall = await t.json(`(function(){ const H = __sh, sc = H.scene(), L = SceneManager._scene._spriteset._nightLight;
            const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "hut"), hut = sc.stands.find(st => st.img === (e.sprite.bitmap._canvas || e.sprite.bitmap._image) && Math.abs(st.fx - e.sprite.x) < 1);
            const hero = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer)._occluder;
            const lt = sc.lights.find(x => x.bl.some(b => b.o === hero)); if (!hut || !lt) return { hut: !!hut, light: !!lt };
            const b = lt.bl.find(b => b.o === hero), sh = Sky.shadeOf(b);
            // along the wall's foot: where his shadow reaches it and where not
            let inX = null, best = 0, outX = null;
            for (let X = hut.x0 + 4; X < hut.x1 - 4; X += 2) { const s = Sky.shadeAt(sh, X, hut.base); if (s > best) { best = s; inX = X; } }
            for (let X = hut.x1 - 6; X > hut.x0; X -= 2) if (Sky.shadeAt(sh, X, hut.base) < 0.005 && H.cover(hut, X, hut.base - 20) > 0.95) { outX = X; break; }
            // (on the wall itself: not where the hero stands in front of it)
            const free = (X, Y) => X !== null && !sc.stands.some(f => f !== hut && Sky.standOrder(f, hut) > 0 && H.cover(f, X, Y) > 0.05);
            let inY = null; for (let dy = 16; dy <= 60 && inY === null; dy += 4) if (free(inX, hut.base - dy) && H.cover(hut, inX, hut.base - dy) > 0.95) inY = hut.base - dy;
            const pts = [[inX, inY === null ? hut.base - 14 : inY], [outX, hut.base - 14], [inX, hut.y0 + 10]];
            const solid = pts.map(([X, Y]) => X === null ? 0 : H.cover(hut, X, Y));
            const d = H.dark(pts.map(p => [p[0] || 0, p[1]]));
            return { hut: true, light: true, reach: +best.toFixed(2), inX, inY, outX, base: Math.round(hut.base), top: Math.round(hut.y0), solid, on: d.on, off: d.off, old: d.old }; })()`);
        t.check("the hero by a campfire in front of the hut throws his shadow onto its wall (it reaches the wall's foot)", wall.hut && wall.light && wall.reach > 0.15 && wall.inX !== null, wall);
        t.check("...it climbs the wall there: darker than with no shadows", wall.inY !== null && wall.solid && wall.solid[0] > 0.9 && wall.on[0] > wall.off[0] + 8, wall);
        t.check("...not where it does not reach the wall's foot (the wall there as lit as with no shadows)", wall.outX !== null && Math.abs(wall.on[1] - wall.off[1]) <= 8, wall);
        t.check("...and not up on the roof (a man is not as tall as the hut)", Math.abs(wall.on[2] - wall.off[2]) <= 8, wall);
        await t.shot(path.join(SHOTS, "stojace_chata_noc.png"));
    }

    // ---- by day: the sun's shadows in one layer under every standing thing; the clouds' over everything
    await t.setHour(9);
    await t.eval(`(function(){ const F = $gameSystem._farm, L = F.buildings[$gameMap.mapId()]; L.length = 0; L.push({ id: F.nextId++, type: "kiln", x: 24, y: 13, last: 1 }); F.rev++;
        $gameParty.gainItem($dataItems[59], 1); const a = $gameParty.leader(), it = $dataItems[59]; a.useItem(it); const act = new Game_Action(a); act.setItemObject(it); act.applyGlobal(); return 0; })()`);
    await t.until("Torch.isLit()", 10);
    await t.eval(`(function(){ for (const [x, y] of [[21, 12], [22, 12], [21, 11], [24, 11], [26, 12], [27, 13]]) if (Torch.canPlantAt(x, y)) { $gamePlayer.locate(x - 1, y); Torch.plantTorch(x, y, { instant: true, quiet: true }); return [x, y]; } return null; })()`);
    await view(8, 5);
    await t.frames(20);
    const day = await t.json(`(function(){ const set = SceneManager._scene._spriteset, tm = set._tilemap, layer = Sky.layer(tm);
        const shadows = [], strays = [];
        for (const s of set._characterSprites) for (const sh of [s._treeShadow, s._sunShadow]) if (sh && sh.visible) (sh.parent === layer ? shadows : strays).push(s._characterName);
        const standZ = [];
        for (const s of set._characterSprites) if (s.visible && s.z >= 3) standZ.push(s.z);
        for (const e of set._buildingSprites._sprites) standZ.push(e.sprite.z);
        const torchZ = Torch.layer() ? [...Torch.layer()._pool.values()].map(g => g.box.z) : [];
        const clouds = set._cloudSprites || [];
        return { layerZ: layer.z, shadows: shadows.length, strays, minStandZ: Math.min(...standZ), torchZ, buildings: set._buildingSprites._sprites.length,
            cloudsOver: clouds.length > 0 && clouds.every(c => c.parent === set && set.children.indexOf(c) > set.children.indexOf(tm)) }; })()`);
    t.check("by day every sun shadow (" + day.shadows + ") lies in the one shadow layer (z " + day.layerZ + ")", day.shadows >= 20 && day.strays.length === 0, day);
    t.check("...under every thing that stands: characters, trees, rocks, buildings (z >= " + day.minStandZ + "), a torch stuck in the ground", day.layerZ < day.minStandZ && day.buildings >= 1 && day.torchZ.length >= 1 && day.torchZ.every(z => z > day.layerZ), day);
    t.check("a cloud's shadow lies over everything (over the whole map)", day.cloudsOver, day);
    await t.eval("for (const p of Torch.stuck()) { const q = Torch.stuckAt(p.map, p.x, p.y); if (q) Torch.state().planted.splice(Torch.state().planted.indexOf(q), 1); } 0");

    // ---- the cost: the night layer in the wood with a campfire and a torch, keeping the shadows off what stands and not
    await t.setHour(23);
    await view(1, 4);
    await camp(16, 12);
    await t.eval(`(function(){ $gamePlayer.locate(13, 12); $gameParty.gainItem($dataItems[59], 1); const a = $gameParty.leader(), it = $dataItems[59]; a.useItem(it); const act = new Game_Action(a); act.setItemObject(it); act.applyGlobal(); return 0; })()`);
    await t.until("Torch.isLit()", 10);
    await t.frames(30);
    const cost = JSON.parse(await t.eval(`new Promise(res => {
        const S = Sky, N = SceneManager._scene._spriteset._nightLight, up = N.update, times = [], st = S.standing;
        N.update = function() { const a = performance.now(); up.apply(this, arguments); times.push(performance.now() - a); };
        const measure = (stand, n) => new Promise(done => { S.standing = stand ? st : () => []; const from = times.length + 10; const iv = setInterval(() => { if (times.length >= from + n) { clearInterval(iv); const x = times.slice(from, from + n).sort((p, q) => p - q); done(x[Math.floor(n / 2)]); } }, 20); });
        (async () => { const without = await measure(false, 120), withIt = await measure(true, 120); N.update = up; S.standing = st; res(JSON.stringify({ without: +without.toFixed(3), with: +withIt.toFixed(3) })); })();
    })`));
    console.log("   the night layer's update (median ms) in the wood, the shadows on what stands kept off: no / yes", cost);
    t.check("keeping the fire's shadows off what stands costs little (under 1 ms a frame more in the densest wood)", cost.with - cost.without < 1, cost);
});
