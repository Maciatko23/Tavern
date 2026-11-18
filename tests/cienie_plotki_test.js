// Fences' sun shadows (Cienie.js part 4, 2026-11-18, the user: "na przykład są płotki, możesz dorobić dla płotków ładnie?" + "a da się z
// płotka usunąć ten wbudowany cień?"): the A2 fences / hedges of layer 1 throw a shadow leaned from their foot, their painted shadow is
// taken out of the sheet the tilemap draws with (a copy), switched off the sheet is the loaded one again; what it costs.
// Grandpa's yard on Podgrodzie (Map218) and the manor's gardens (Map221: the red fences and the hedges). CDP_PORT=9549.
const kit = require("./lib/kit.js");

// painted-shadow pixels (black, see-through) in the A2 block of a kind (local 0..31) of a bitmap
const PAINTED = String.raw`(function(bm, k){
    const tw = 48, th = 48, x = (k % 8) * 2 * tw, y = Math.floor(k / 8) * 3 * th, c = document.createElement("canvas");
    c.width = 2 * tw; c.height = 3 * th;
    const ctx = c.getContext("2d");
    ctx.drawImage(bm.canvas || bm.image || bm._image, x, y, 2 * tw, 3 * th, 0, 0, 2 * tw, 3 * th);
    const p = ctx.getImageData(0, 0, 2 * tw, 3 * th).data;
    let n = 0;
    for (let i = 0; i < p.length; i += 4) if (p[i + 3] > 0 && p[i + 3] < 200 && p[i] + p[i + 1] + p[i + 2] < 30) n++;
    return n;
})`;

kit.test({ port: Number(process.env.CDP_PORT) || 9549, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, hour: 13, quiet: true, minimap: false });
    await t.go(218, 12, 18, 2);
    await t.frames(90);
    const a = await t.json(`(function(){
        const tm = SceneManager._scene._spriteset._tilemap, b = tm._bitmaps[1], P = ${PAINTED};
        const L = tm._lowerLayer.children[0];
        return { soft: !!b._cienSoft, orig: !!b._cienOrig, inCopy: P(b, 6), inLoaded: b._cienOrig ? P(b._cienOrig, 6) : -1, stats: Cienie.stats,
            drawn: !!L && L._images[1] === b.canvas, waiting: tm._needsBitmapsUpdate };   // (the upper layer draws from the same textures of the card)
    })()`);
    t.check("płotki: kafelki A2 z kopii arkusza (bez namalowanego cienia)", a.soft && a.orig);
    t.check(`mapa kafelków naprawdę rysuje z kopii (nic nie czeka: ${!a.waiting})`, a.drawn && !a.waiting);
    t.check(`namalowany cień płotka usunięty (w arkuszu ${a.inLoaded} px, w kopii ${a.inCopy})`, a.inLoaded > 0 && a.inCopy === 0);
    t.check(`płotki rzucają cień (odcinki ${a.stats.fenceRuns}, na ekranie ${a.stats.fences})`, a.stats.fenceRuns > 50 && a.stats.fences > 10);

    // night: no sun shadow, the sheet stays the copy
    await t.setHour(23);
    await t.frames(30);
    const n = await t.json("({ fences: Cienie.stats.fences, soft: !!SceneManager._scene._spriteset._tilemap._bitmaps[1]._cienSoft })");
    t.check("nocą arkusz dalej bez namalowanego cienia", n.soft);

    // switched off: the loaded sheet again, no fence shadows
    await t.setHour(13);
    await t.eval("Cienie.opts.fences = false; 0");
    await t.frames(30);
    const off = await t.json("(function(){ const tm = SceneManager._scene._spriteset._tilemap, b = tm._bitmaps[1]; return { fences: Cienie.stats.fences, soft: !!b._cienSoft, drawn: tm._lowerLayer.children[0]._images[1] === (b.image || b.canvas) }; })()");
    t.check("wyłączone: zwykły arkusz (też na karcie), bez cieni płotków", !off.soft && off.drawn && off.fences === 0);
    await t.eval("Cienie.opts.fences = true; 0");
    await t.frames(30);

    // the cost: frames with the fences' shadows on vs off (the same spot)
    const cost = await t.json(`(function(){
        const sp = SceneManager._scene._spriteset, R = Graphics.app.renderer;
        const time = n => { const a = performance.now(); for (let i = 0; i < n; i++) { sp.update(); R.render(Graphics.app.stage); R.gl.finish(); } return (performance.now() - a) / n; };
        Cienie.opts.fences = false; time(20); const off = time(150);
        Cienie.opts.fences = true; time(20); const on = time(150);
        return { off: +off.toFixed(3), on: +on.toFixed(3) };
    })()`);
    t.check(`koszt cieni płotków ${(cost.on - cost.off).toFixed(3)} ms/klatkę (bez ${cost.off}, z ${cost.on})`, cost.on - cost.off < 0.3);

    // a season's own sheet (PoryRoku: autumn) gets its own copy too
    await t.eval("Tawerna.time.forceSeason(2); 0");
    await t.frames(90);
    const au = await t.json(`(function(){ const tm = SceneManager._scene._spriteset._tilemap, b = tm._bitmaps[1], P = ${PAINTED}; return { soft: !!b._cienSoft, url: decodeURIComponent(b._url || "").split("/").pop(), n: P(b, 6), drawn: tm._lowerLayer.children[0]._images[1] === b.canvas }; })()`);
    t.check(`jesienią arkusz pory roku też bez namalowanego cienia (${au.url}, ${au.n} px, rysowany: ${au.drawn})`, au.soft && /jesien/.test(au.url) && au.n === 0 && au.drawn);
    await t.eval("Tawerna.time.forceSeason(null); 0");
    await t.frames(30);

    // the manor: the red fences and the hedges (other A2 kinds) get theirs too
    await t.go(221, 22, 26, 2);
    await t.frames(90);
    const d = await t.json(`(function(){
        const tm = SceneManager._scene._spriteset._tilemap, b = tm._bitmaps[1], P = ${PAINTED};
        return { soft: !!b._cienSoft, red: P(b, 14), stats: Cienie.stats, drawn: tm._lowerLayer.children[0]._images[1] === b.canvas };
    })()`);
    t.check(`dwór: czerwone płotki i żywopłoty z cieniem (na ekranie ${d.stats.fences}), bez namalowanego`, d.soft && d.drawn && d.red === 0 && d.stats.fences > 10);
});
