// Gotowe obrazki nazw map (CleanHUD „Kinowy”; gracz 2026-11-06: „po prostu miej gotowe obrazki dostosowane już”, „chodzi
// priorytetowo o wydajność zawsze”; „niech zawsze będzie ten mniejszy opis”): nazwa z podpisem i kreską to jeden PNG z img/nazwy_map (robi je
// tools/nazwa_mapy/obrazki.js); gra go tylko wczytuje - przy kolejnych pokazach nie powstaje żadne płótno; bez pliku (nowa mapa,
// zmieniony tekst) gra rysuje sama, jednym obrazkiem i bez błędów; każda mapa i piętro ma swój aktualny obrazek, plik to piksel
// w piksel to, co gra by narysowała; w folderze nic zbędnego. CDP_PORT=9467.
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("./lib/kit.js");
const DIR = path.join(__dirname, "..", "img", "nazwy_map");
kit.test({ port: Number(process.env.CDP_PORT) || 9467, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 240000 }, async t => {
    const spis = JSON.parse(fs.readFileSync(path.join(DIR, "spis.json"), "utf8"));
    await t.newGame({ story: true, skipIntro: true, hour: 11, quiet: true, minimap: false });   // (grandpa's house: as clean_hud_test, no talk in the way)
    await t.frames(60);
    t.check("gra wczytała spis gotowych obrazków (ta sama wersja wyglądu)", (await t.json("Object.keys(CleanHUD.nameArt.list() || {}).length")) === Object.keys(spis.obrazki).length
        && (await t.json("CleanHUD.nameArt.ver")) === spis.wersja, spis.wersja);
    // canvases made while the name shows (its update: the build, the small line)
    await t.eval(`(function(){ window.__kan = 0; let inside = false; const C = SceneManager._scene._cleanCinema.constructor.prototype, u = C.update, cc = Bitmap.prototype._createCanvas;
        Bitmap.prototype._createCanvas = function() { if (inside) __kan++; return cc.apply(this, arguments); };
        C.update = function() { inside = true; try { return u.apply(this, arguments); } finally { inside = false; } }; return 0; })()`);
    const nm = () => t.json("(function(){ const d = CleanHUD.debug(); return d && d.name; })()");
    const pieces = () => t.json("(function(){ const c = SceneManager._scene._cleanCinema, P = c._parts; return P ? c.children.filter(s => s !== P.shade && s !== P.top && s !== P.bottom && s !== P.hint).length : -1; })()");
    const show = async (id, x, y) => {
        await t.eval(`window.__kan = 0; $gamePlayer.reserveTransfer(${id}, ${x}, ${y}, 2, 0); 0`);
        await t.until(`(function(){ const d = ${t.onMap(id)} && CleanHUD.debug(); return !!(d && d.name && d.name.mapId === ${id} && d.name.t >= 3); })()`, 30, 30);
        return { n: await nm(), pieces: await pieces(), kan: await t.json("__kan") };
    };
    const s1 = await show(20, 10, 12);
    t.check("pierwsza wizyta (podwórze): mała nazwa z gotowego pliku (bez zdania, nic pod nią), jeden obrazek", s1.n && s1.n.first && s1.n.mode === "again" && s1.n.file && !s1.n.opis
        && !s1.n.hint && s1.pieces === 1 && !!spis.obrazki[s1.n.key], s1);
    await show(19, 4, 6);
    await show(20, 10, 12);
    const s4 = await show(19, 4, 6);
    t.check("kolejny pokaz (wnętrze, wszystko już znane): z pliku i ani jednego płótna rysowanego w grze", s4.n && s4.n.mode === "inside" && s4.n.file && s4.kan === 0 && s4.pieces === 1, s4);
    // no file for it (a changed text): drawn here, one picture, no error
    const k22 = Object.keys(spis.skad).find(k => /^22 again [^n]/.test(spis.skad[k]));
    await t.eval(`window.__k22 = CleanHUD.nameArt.list()[${JSON.stringify(k22)}]; delete CleanHUD.nameArt.list()[${JSON.stringify(k22)}]; 0`);
    const s5 = await show(22, 12, 10);
    await t.eval(`CleanHUD.nameArt.list()[${JSON.stringify(k22)}] = window.__k22; 0`);
    t.check("bez pliku (np. zmieniony tekst): gra rysuje sama - jeden obrazek, bez błędów", !!k22 && s5.n && s5.n.key === k22 && !s5.n.file && s5.n.mode === "again" && s5.pieces === 1, s5);
    await t.frames(30);

    // every map and floor: its pictures there, the files the same pixels as the game draws (the page's clock stops here: the maps' data are loaded one by one)
    await t.eval(require("../tools/nazwa_mapy/warianty.js"));
    const ids = await t.json("__nazwy.ids()"), floors = await t.json("__nazwy.floors()"), want = [];
    await t.eval("window.__vs = {}; window.__one = v => { __vs[v.key] = v; return { key: v.key, what: v.info.id + ' ' + v.mode + (v.night ? ' noc' : '') + ' ' + v.info.title }; }; 0");
    for (const id of ids) want.push(...await t.json(`__nazwy.map(${id}).then(vs => vs.map(__one))`));
    for (const f of floors) want.push(...await t.json(`__nazwy.floor(${f}).map(__one)`));
    const missing = want.filter(v => !spis.obrazki[v.key] || !fs.existsSync(path.join(DIR, v.key + ".png")));
    t.check("każda mapa i piętro ma swój aktualny obrazek (inaczej: node tools/nazwa_mapy/obrazki.js)", want.length > 100 && missing.length === 0, { want: want.length, missing: missing.slice(0, 12) });
    const files = fs.readdirSync(DIR).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4)), wanted = new Set(want.map(v => v.key));
    const extra = files.filter(k => !wanted.has(k)), noFile = Object.keys(spis.obrazki).filter(k => !files.includes(k));
    t.check("w folderze nic zbędnego, w spisie nic bez pliku", extra.length === 0 && noFile.length === 0 && Object.keys(spis.obrazki).length === wanted.size, { extra: extra.slice(0, 8), noFile: noFile.slice(0, 8) });
    // the same pixels: a first visit by day and at night, a room, a guardian's floor (red), a generated floor
    const pick = re => (want.find(v => re.test(v.what)) || {}).key;
    const sample = [pick(/^20 again [^n]/), pick(/^20 again noc/), pick(/ inside /), pick(/^146 again/), pick(/^10\d\d again Piętro/)].filter(Boolean);
    const cmp = await t.json(`(async function(){
        const out = [];
        for (const k of ${JSON.stringify(sample)}) {
            const v = __vs[k];
            const lay = CleanHUD.nameArt.layout(v.info, v.mode, v.night), b = CleanHUD.nameArt.draw(lay);
            const img = new Image(); img.src = CleanHUD.nameArt.dir + k + ".png"; await img.decode();
            const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height; const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
            const a = b.context.getImageData(0, 0, b.width, b.height).data, f = cx.getImageData(0, 0, cv.width, cv.height).data;
            let bad = 0;
            if (a.length === f.length) for (let i = 0; i < a.length; i += 4) { const pa = a[i + 3], pf = f[i + 3]; if (Math.abs(pa - pf) > 1 || [0, 1, 2].some(c => Math.abs(a[i + c] * pa - f[i + c] * pf) / 255 > 2)) bad++; }
            out.push({ k, w: b.width, h: b.height, fw: img.width, fh: img.height, bad });
            b.destroy();
        }
        return out; })()`);
    t.check("plik to piksel w piksel to, co gra by narysowała (dzień, noc, wnętrze, strażnik, piętro składane)", sample.length === 5 && cmp.length === 5
        && cmp.every(c => c.w === c.fw && c.h === c.fh && c.bad === 0), { sample, cmp });
});
