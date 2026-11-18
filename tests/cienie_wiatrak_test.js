// The windmill's sails and the grain throw sun shadows (Wiatrak.js part 3, 2026-11-18, the user picked them: "1 i 3"): the sails' shadow
// turns with them and lies where Cienie.js leans the tower, the grain's pieces lean with the wind; none at night; what it costs.
// The miller's windmill and field on Podgrodzie (Map218). CDP_PORT=9551.
const kit = require("./lib/kit.js");

kit.test({ port: Number(process.env.CDP_PORT) || 9551, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, hour: 18, quiet: true, minimap: false });
    await t.eval("Tawerna.time.forceSeason(1); 0");   // (summer: the grain grown)
    await t.go(218, 12, 33, 2);
    await t.frames(90);
    const INFO = `(function(){
        const sp = SceneManager._scene._spriteset, out = { sails: null, field: null };
        for (const s of sp._characterSprites) {
            const b = s._sailsShadow;
            if (b) out.sails = { visible: b.visible, inLayer: !!b.parent && b.parent === Sky.layer(sp._tilemap), rot: b._s.rotation, sails: s._sails ? s._sails.rotation : null, hubX: b.worldTransform.tx, c: b.transform.localTransform.c };
            if (s._poleShadow && s._character.x === 9) { const m = s._poleShadow.mesh, n = s._poleShadow.pieces.length; out.field = { n, shown: m.visible && m.parent ? n : 0, rows: (s._poleRows || []).length, cs: Array.from(m.vertices.slice(0, 16)).map(v => +v.toFixed(3)) }; }
        }
        return out;
    })()`;
    const a = await t.json(INFO);
    t.check(`wieczorem skrzydła rzucają cień w warstwie cieni ${JSON.stringify(a.sails)}`, !!a.sails && a.sails.visible && a.sails.inLayer && Math.abs(a.sails.rot - a.sails.sails) < 1e-6);
    t.check("wieczorem cień skrzydeł idzie w prawo (słońce z lewej)", !!a.sails && a.sails.c < 0);
    const tower = await t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(x => x._character && x._character.characterName && x._character.characterName() === "!$1_Wiatrak_Wieza"); const sh = s && s._cienShadow; return sh ? { kids: sh.children ? sh.children.length : 0, ys: (sh.children || []).map(c => Math.round(c.transform.localTransform.ty)) } : null; })()`);
    t.check(`okrągła podstawa wieży: cień kładziony z całego koła u podstawy ${JSON.stringify(tower)}`, !!tower && tower.kids === 7 && Math.max(...tower.ys) - Math.min(...tower.ys) >= 35);
    t.check(`zboże rzuca cień (kawałków ${a.field && a.field.n}, widać ${a.field && a.field.shown}; rzędy pola jako ${a.field && a.field.rows} siatek)`, !!a.field && a.field.n > 10 && a.field.shown === a.field.n && a.field.rows >= 8);
    await t.frames(40);
    const b = await t.json(INFO);
    t.check("cień skrzydeł obraca się z nimi", !!b.sails && Math.abs(b.sails.rot - a.sails.rot) > 1e-4);
    t.check("cień zboża faluje z wiatrem (pochylenie kawałków się zmienia)", !!b.field && b.field.cs.some((c, i) => Math.abs(c - a.field.cs[i]) > 1e-5));

    await t.setHour(8);
    await t.frames(30);
    const m = await t.json(INFO);
    t.check("rano cień skrzydeł idzie w lewo", !!m.sails && m.sails.visible && m.sails.c > 0);

    await t.setHour(23);
    await t.frames(30);
    const n = await t.json(INFO);
    t.check("nocą nie ma cienia skrzydeł ani zboża", !!n.sails && !n.sails.visible && !!n.field && n.field.shown === 0);

    await t.setHour(13);
    await t.frames(30);
    const cost = await t.json(`(function(){
        const sp = SceneManager._scene._spriteset, R = Graphics.app.renderer;
        const time = n => { const a = performance.now(); for (let i = 0; i < n; i++) { sp.update(); R.render(Graphics.app.stage); R.gl.finish(); } return (performance.now() - a) / n; };
        Wiatrak.opts.shadows = false; time(20); const off = time(150);
        Wiatrak.opts.shadows = true; time(20); const on = time(150);
        return { off: +off.toFixed(3), on: +on.toFixed(3) };
    })()`);
    t.check(`koszt cieni wiatraka i zboża ${(cost.on - cost.off).toFixed(3)} ms/klatkę (bez ${cost.off}, z ${cost.on})`, cost.on - cost.off < 0.3);
});
