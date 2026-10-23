// Zbroja i hełmy z PixelLab na bohaterze (Ubior.js 1.2, tools/ubior/zbroja_pl.py) i zamach mieczem (img/system/Hero_Sword.png, HeroLook
// SWINGS 21, ChoppableTree "sword") - próba 2026-10-23 (docs/ekwipunek/METODA.md "Zbroja z PixelLab", PLAN_BRON_ZBROJE.md):
//   1. każda warstwa PL (5 rodzajów x wszystkie arkusze bohatera i arkusze bez broni) i oba hełmy PL wczytują się (brak brakujących plików);
//   2. zestaw skórzany (kaptur, skórznia, karwasze) i żelazny (kapalin, kolczuga, nagolenniki, buty okute) w tych samych ujęciach:
//      stary wygląd (Ubior.pl(false)) i nowy - chód 8 kierunków, bieg, praca, walka, miecz, siedzi, leży, przewrót, pochodnia;
//      inne materiały (przemalowanie palety PixelLab);
//   3. miecz: rodzaj zamachu "sword" (21) zarejestrowany, HeroLook daje Hero_Sword, arkusz 17 x 4 klatek, maska; broń na nim (miecz
//      w swoim materiale = zwykły arkusz, inne materiały, długi miecz, szabla, tasak - z bron.py) w kluczowych klatkach;
//   4. zrzuty z mapy (duszek bohatera, pasek nad głową) w obu zestawach, zamach mieczem w 4 kierunkach;
//   5. czas składania, błędy w konsoli; obrazki docs/ekwipunek/pixellab_proba_*.png (tools/ubior/zloz_pl.py).
//   node tests/ubior_pl_test.js          (port CDP 9587)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "ubior_pl");
const SHOTS = path.join(OUT, "shots");
fs.mkdirSync(SHOTS, { recursive: true });
const NONE = { glowa: "", tors: "", nogi: "", stopy: "", pas: "", rece: "", plecy: "" };
const SETS = {
    skora: { glowa: "helm_kaptur_skora", tors: "zbroja_skorznia_skora", rece: "karwasze_skora" },
    zelazo: { glowa: "helm_kapalin_zelazo", tors: "zbroja_kolczuga_zelazo", nogi: "nagolenniki_zelazo", stopy: "buty_okute_zelazo" }
};
// (the second stage, 2026-10-23: the rest of the kinds - every helm_* and zbroja_* key on PixelLab's drawing)
const SETS2 = {
    przeszywanica: { glowa: "helm_czepiec_len", tors: "zbroja_przeszywanica_len" },
    luska: { glowa: "helm_nosal_zelazo", tors: "zbroja_luska_zelazo" },
    napiersnik: { glowa: "helm_otwarty_stal", tors: "zbroja_napiersnik_stal" },
    zakonny: { glowa: "helm_zakonny_zelazo", tors: "zbroja_kolczuga_zelazo", nogi: "nagolenniki_zelazo", stopy: "buty_okute_zelazo" },
    czepiec_kolczy: { glowa: "helm_czepiec_stal", tors: "zbroja_luska_stal" }
};
const MATERIALS2 = [
    ["przeszywanica wełniana, czepiec skórzany", { glowa: "helm_czepiec_skora", tors: "zbroja_przeszywanica_welna" }],
    ["przeszywanica skórzana", { glowa: "", tors: "zbroja_przeszywanica_skora" }],
    ["przeszywanica jedwabna", { glowa: "helm_czepiec_len", tors: "zbroja_przeszywanica_jedwab" }],
    ["brąz: nosal, łuska", { glowa: "helm_nosal_braz", tors: "zbroja_luska_braz" }],
    ["zakonne: nosal, łuska", { glowa: "helm_nosal_zakon", tors: "zbroja_luska_zakon" }],
    ["brąz: otwarty, napierśnik", { glowa: "helm_otwarty_braz", tors: "zbroja_napiersnik_braz" }],
    ["żelazo / skóra: napierśnik, otwarty", { glowa: "helm_otwarty_skora", tors: "zbroja_napiersnik_zelazo" }],
    ["zakonne: hełm zakonny, napierśnik", { glowa: "helm_zakonny_zakon", tors: "zbroja_napiersnik_zakon" }],
    ["hełm zakonny stalowy, kolczuga zakonna", { glowa: "helm_zakonny_stal", tors: "zbroja_kolczuga_zakon" }],
    ["czepiec kolczy zakonny", { glowa: "helm_czepiec_zakon", tors: "" }]];
const VIEWS = [["chód S", "Hero_Walk", 0, 0], ["chód SW", "Hero_Walk", 3, 1], ["chód W", "Hero_Walk", 3, 2], ["chód NW", "Hero_Walk", 6, 3],
    ["chód N", "Hero_Walk", 0, 4], ["chód NE", "Hero_Walk", 3, 5], ["chód E", "Hero_Walk", 7, 6], ["chód SE", "Hero_Walk", 6, 7],
    ["bieg S", "Hero_Run", 3, 0], ["bieg E", "Hero_Run", 5, 6], ["siekiera", "Hero_Axe", 3, 0], ["siekiera: cios", "Hero_Axe", 8, 0],
    ["siekiera z boku", "Hero_AxeSide", 10, 2], ["pałka", "Hero_Club", 9, 1], ["włócznia", "Hero_Spear", 10, 2], ["miecz", "Hero_Sword", 11, 2],
    ["miecz S", "Hero_Sword", 9, 0], ["kilof N", "Hero_Pick", 9, 3], ["siedzi", "Hero_Sit", 16, 0], ["leży", "Hero_LieDown", 16, 1],
    ["przewrót", "Hero_Roll", 6, 1], ["pochodnia", "Hero_TorchWalk", 3, 6]];
const MATERIALS = [
    ["skóra czarna", { glowa: "helm_kaptur_skora_czarna", tors: "zbroja_skorznia_skora_czarna", rece: "karwasze_skora_czarna" }],
    ["kaptur lniany / wełniany", { glowa: "helm_kaptur_len", tors: "zbroja_skorznia_skora", rece: "karwasze_braz" }],
    ["kaptur wełniany, karwasze żelazne", { glowa: "helm_kaptur_welna", tors: "zbroja_skorznia_skora", rece: "karwasze_zelazo" }],
    ["stal", { glowa: "helm_kapalin_stal", tors: "zbroja_kolczuga_stal", nogi: "nagolenniki_stal", stopy: "buty_okute_stal" }],
    ["brąz", { glowa: "helm_kapalin_braz", tors: "zbroja_kolczuga_zelazo", nogi: "nagolenniki_braz", stopy: "buty_okute_zelazo" }],
    ["zakonne", { glowa: "helm_kapalin_zakon", tors: "zbroja_kolczuga_zakon", nogi: "nagolenniki_zakon", stopy: "buty_okute_zakon" }],
    ["skórzane nagolenniki", { glowa: "", tors: "zbroja_skorznia_skora", nogi: "nagolenniki_skora", stopy: "buty_okute_zelazo" }]];
const MAT_VIEWS = [["chód S", "Hero_Walk", 0, 0], ["chód W", "Hero_Walk", 3, 2], ["chód N", "Hero_Walk", 0, 4], ["siekiera z boku", "Hero_AxeSide", 10, 2]];
const SWORD_KEYS = ["bron_miecz_zelazo", "bron_miecz_stal", "bron_miecz_braz", "bron_dlugi_miecz_stal", "bron_szabla_stal", "bron_tasak_zelazo"];
const SWORD_FRAMES = [[0, 4], [0, 9], [0, 13], [2, 6], [2, 9], [2, 11], [2, 14], [3, 11]];
const CLIP = { left: 56, up: 100, w: 112, h: 112 };

kit.test({ port: 9587, plugins: ["Ubior_Bron"], evalTimeout: 120000 }, async t => {
    const ok = await t.newGame({ hour: 10, quiet: true, minimap: false });
    t.check("nowa gra", ok);
    if (!ok) return;
    const [HX, HY] = [29, 13];
    await t.eval(`(function(){ $gamePlayer.locate(${HX}, ${HY}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${HX} - 13, ${HY} - 7); return 0; })()`);
    await t.calm();
    await t.eval("(function(){ $gameScreen.clearWeather(); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); return 0; })()");
    await t.frames(30);
    t.clearErrors();
    const ver = await t.json("({ u: Ubior.VERSION, pl: Object.keys(Ubior.PL), helm: Object.keys(Ubior.PL_HELM), on: Ubior.pl() })");
    t.check("Ubior 1.2: zbroja z PixelLab (8 rodzajów warstw, 7 hełmów), włączona", ver.u === "1.2.0" && ver.pl.length === 8 && ver.helm.length === 7 && ver.on, ver);
    // every helm_* and zbroja_* key of Ubior_Data (and karwasze, nagolenniki, buty okute) drawn by PixelLab
    const old = await t.json(`Object.keys(Ubior_Data.WZORY_ZBROI).filter(k => { const w = Ubior.patterns()[k]; if (!w) return true;
        return /^helm_/.test(k) ? !/^helmpl_/.test(w.nakladka) : !w.pl; })`);
    t.check("wszystkie klucze zbroi i hełmów (Ubior_Data.WZORY_ZBROI) na grafice PixelLab", old.length === 0, old);
    const before = await t.eval("Ubior.stats().length");

    // ---- 1. the files: every layer on every sheet (and the sheets without their weapon), the helmets
    const files = await t.json(`(function(){ const out = [], bez = ["Club", "Axe", "AxeSide", "Pick", "Spear", "Sword"];
        for (const k of Object.keys(Ubior.PL)) { const d = Ubior.PL[k];
            for (const s of Object.keys(Ubior.SHEETS)) out.push(Ubior.plFile(d, s, null));
            for (const b of bez) out.push(Ubior.plFile(d, "Hero_" + b, "Ubior_Maska_BezBroni_Hero_" + b)); }
        for (const k of Object.keys(Ubior.PL_HELM)) out.push("Ubior_HelmPL_" + Ubior.PL_HELM[k].plik);
        out.push("Hero_Sword", "Ubior_Maska_Hero_Sword", "Ubior_BezBroni_Hero_Sword", "Ubior_Maska_BezBroni_Hero_Sword", "Ubior_Bron_Sword_Miecz",
            "Ubior_Bron_Sword_Dlugi_miecz", "Ubior_Bron_Sword_Szabla", "Ubior_Bron_Sword_Tasak");
        for (const f of out) Ubior.loadSystemPlain(f); window.__plFiles = out; return out; })()`);
    await t.until("window.__plFiles.every(f => { const b = Ubior.loadSystemPlain(f); return b.isReady() || (b.isError && b.isError()); })", 60, 200);
    const missing = await t.json("window.__plFiles.filter(f => { const b = Ubior.loadSystemPlain(f); return !b.isReady(); })");
    t.check("pliki: " + files.length + " (warstwy PL na " + (files.length - 8 - ver.helm.length) / ver.pl.length + " arkuszach, hełmy PL, miecz) - wszystkie są", missing.length === 0, missing);
    const sizes = await t.json(`(function(){ const bad = []; for (const k of Object.keys(Ubior.PL)) for (const s of Object.keys(Ubior.SHEETS)) {
        const a = Ubior.loadSystemPlain(Ubior.plFile(Ubior.PL[k], s, null)), b = Ubior.SHEETS[s].folder === "characters" ? ImageManager.loadCharacter(s) : ImageManager.loadSystem(s);
        if (b.isReady() && (a.width !== b.width || a.height !== b.height)) bad.push(s + ":" + k); } return bad; })()`);
    t.check("warstwy PL tej samej wielkości co arkusze", sizes.length === 0, sizes);

    // a crop: the cell with what is over its head (Ubior.cellWithHead), 96 x 108
    const crop = (name, c, r) => t.eval(`(function(){ const b = Ubior.sheet(${JSON.stringify(name)}), cell = Ubior.SHEETS[${JSON.stringify(name)}].cell;
        const src = Ubior.cellWithHead(b, ${JSON.stringify(name)}, ${c}, ${r}); const cv = document.createElement("canvas"); cv.width = 96; cv.height = 108;
        const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false; cx.drawImage(src, (96 - cell) / 2, cell === 64 ? 28 : 0); return cv.toDataURL("image/png"); })()`);
    const save = (file, url) => fs.writeFileSync(path.join(SHOTS, file), Buffer.from(url.split(",")[1], "base64"));
    const ready = sheet => t.until(`(function(){ const b = Ubior.sheet(${JSON.stringify(sheet)}); return !!(b && b.isReady() && b._ubiorDressed && Ubior.liveKey(${JSON.stringify(sheet)}) === Ubior.key()); })()`, 20, 50);
    const meta = { views: VIEWS.map(v => v[0]), sets: {}, materials: [], matViews: MAT_VIEWS.map(v => v[0]), sword: [], swordFrames: SWORD_FRAMES, mapa: [], miecz_mapa: [] };

    // ---- 2. the sets, old look and new, the same views (stage 1: leather, iron; stage 2: the rest)
    let setOk = true, differs = 0, compared = 0;
    const compare = async (sets, into) => {
        for (const [name, set] of Object.entries(sets)) {
            into[name] = { old: [], new: [] };
            for (const on of [false, true]) {
                await t.eval(`Ubior.pl(${on}); Ubior.set(${JSON.stringify(Object.assign({}, NONE, set))}); 0`);
                for (const [label, sheet, c, r] of VIEWS) {
                    if (!await ready(sheet)) { setOk = false; continue; }
                    const f = `z_${name}_${on ? "new" : "old"}_${sheet}_${c}_${r}.png`;
                    save(f, await crop(sheet, c, r));
                    into[name][on ? "new" : "old"].push(f);
                }
            }
            for (let i = 0; i < VIEWS.length; i++) {
                const a = into[name].old[i], b = into[name].new[i];
                if (!a || !b) continue;
                compared++;
                if (!fs.readFileSync(path.join(SHOTS, a)).equals(fs.readFileSync(path.join(SHOTS, b)))) differs++;
            }
        }
    };
    meta.sets2 = {};
    await compare(SETS, meta.sets);
    await compare(SETS2, meta.sets2);
    t.check("zestawy (" + Object.keys(SETS).concat(Object.keys(SETS2)).join(", ") + ") we wszystkich " + VIEWS.length + " ujęciach, stary i nowy wygląd", setOk);
    t.check("nowy wygląd (PixelLab) inny niż stary w każdym ujęciu (" + differs + "/" + compared + ")", compared > 0 && differs === compared, { differs, compared });
    // the PL layer really drawn: a jerkin's pixel colours come from the state (the old texture is the shirt's ramp)
    const used = await t.json(`(function(){ Ubior.pl(true); Ubior.set(${JSON.stringify(Object.assign({}, NONE, SETS.zelazo))});
        const L = Ubior.loadSystemPlain(Ubior.plFile(Ubior.PL.kolczuga, "Hero_Walk", null)), b = Ubior.sheet("Hero_Walk");
        if (!b || !b.isReady() || !L.isReady()) return null; const d = b.context.getImageData(0, 0, 64, 64).data, l = Ubior.pixels(L).data;
        let n = 0, same = 0; for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const p = (y * L.width + x) * 4, q = (y * 64 + x) * 4;
            if (!l[p + 3]) continue; n++; if (d[q] === l[p] && d[q + 1] === l[p + 1] && d[q + 2] === l[p + 2]) same++; } return { n, same }; })()`);
    t.check("warstwa kolczugi w klatce stojącej: piksele z PixelLab (" + (used && used.same) + "/" + (used && used.n) + ")", !!used && used.n > 150 && used.same >= used.n * 0.95, used);

    // ---- the other materials (the palette repainted)
    let matOk = true;
    for (const [label, set] of MATERIALS) {
        await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE, set))}); 0`);
        const fl = [];
        for (const [, sheet, c, r] of MAT_VIEWS) {
            if (!await ready(sheet)) matOk = false;
            const f = `m_${meta.materials.length}_${sheet}_${c}_${r}.png`;
            save(f, await crop(sheet, c, r));
            fl.push(f);
        }
        meta.materials.push({ label, set, files: fl });
    }
    meta.materials2 = [];
    for (const [label, set] of MATERIALS2) {
        await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE, set))}); 0`);
        const fl = [];
        for (const [, sheet, c, r] of MAT_VIEWS) {
            if (!await ready(sheet)) matOk = false;
            const f = `m2_${meta.materials2.length}_${sheet}_${c}_${r}.png`;
            save(f, await crop(sheet, c, r));
            fl.push(f);
        }
        meta.materials2.push({ label, set, files: fl });
    }
    t.check("inne materiały (" + (MATERIALS.length + MATERIALS2.length) + " zestawów) - przemalowana paleta", matOk);

    // ---- 3. the sword's swing
    const sw = await t.json(`(function(){ const CT = Tawerna.api("ChoppableTree"), k = CT.swingKindOf("sword"), d = k >= 0 ? CT.swingKind(k) : null,
        b = ImageManager.loadSystem("Hero_Sword"); return { k, sheet: d && d.sheet, hit: d && d.hit, frames: d && d.frames, impact: d && d.impact, reach: d && d.reach,
        w: b.width, h: b.height, ubior: !!Ubior.SHEETS.Hero_Sword, bron: UbiorBron.SHEETS_OF.miecz, native: UbiorBron.NATIVE.Hero_Sword }; })()`);
    t.check("zamach mieczem: rodzaj 21 \"sword\", HeroLook -> Hero_Sword (1632 x 384), ciosy [9, 11, 11, 11]", sw.k === 21 && sw.sheet === "Hero_Sword" && sw.w === 1632 && sw.h === 384 &&
        JSON.stringify(sw.hit) === "[9,11,11,11]", sw);
    t.check("Hero_Sword w Ubior (maska) i Ubior_Bron (miecz, długi miecz, szabla, tasak: najpierw Hero_Sword)", sw.ubior && sw.native === "miecz" && sw.bron[0] === "Hero_Sword", sw);
    // the blade's reach: in the blow's frame (right row) the blade's tip far from the body - from the middle of the shirt (the club's
    // swing, where the swords were drawn till now: the club's head by the body)
    const reach = await t.json(`(function(){ const m = Ubior.maskOf("Hero_Sword"), mc = Ubior.maskOf("Hero_Club"); if (!m || !mc) return null;
        const far = (mk, c, r) => { let tip = 0, sx = 0, n = 0; for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) { const L = mk.parts[(r * 96 + y) * mk.w + c * 96 + x];
            if (L === Ubior.PARTS.narzedzie) tip = Math.max(tip, x); if (L === Ubior.PARTS.koszula) { sx += x; n++; } } return Math.round(tip - sx / Math.max(1, n)); };
        return { sword: far(m, 11, 2), club: far(mc, 7, 2) }; })()`);
    t.check("cios mieczem z boku: czubek ostrza dalej od tułowia niż przy pałce (" + (reach && reach.sword) + " px vs " + (reach && reach.club) + " px)",
        !!reach && reach.sword >= reach.club + 8 && reach.sword >= 40, reach);
    await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE, SETS.zelazo))}); 0`);
    let swOk = true;
    for (const key of SWORD_KEYS) {
        await t.eval(`UbiorBron.set({ Hero_Sword: ${JSON.stringify(key)} }); 0`);
        const want = await t.eval(`UbiorBron.key("Hero_Sword")`);
        const r = await t.until(`(function(){ const b = Ubior.sheet("Hero_Sword"); if (!b || !b.isReady()) return false; const k = Ubior.liveFullKey("Hero_Sword");
            if (k === null || Ubior.liveKey("Hero_Sword") !== Ubior.key()) return false; return ${JSON.stringify(want)} ? k.indexOf(${JSON.stringify(want)}) >= 0 : k.indexOf("#bron") < 0; })()`, 20, 50);
        if (!r) swOk = false;
        const fl = [];
        for (const [row, c] of SWORD_FRAMES) {
            const f = `s_${key}_${row}_${c}.png`;
            save(f, await crop("Hero_Sword", c, row));
            fl.push(f);
        }
        meta.sword.push({ key, own: !want, files: fl });
    }
    t.check("broń na zamachu mieczem (" + SWORD_KEYS.length + " kluczy; żelazny miecz = zwykły arkusz)", swOk && meta.sword[0].own, meta.sword.map(s => s.key + (s.own ? " (własny)" : "")));
    await t.eval("UbiorBron.set(null); 0");

    // ---- 4. the map: the hero's sprite (and its child over the head)
    await t.eval(`(function(){ const sc = SceneManager._scene; sc.__updateMain = sc.updateMain; sc.updateMain = function(){};
        const hide = s => { s.update = function(){ this.visible = false; }; s.visible = false; };
        for (const c of sc._spriteset._cloudSprites || []) hide(c);
        const walk = o => { for (const ch of o.children || []) { if (ch.constructor && ch.constructor.name === "Sprite_TargetMarker") hide(ch); walk(ch); } };
        walk(sc._spriteset); return 0; })()`);
    const look = () => t.json(`(function(){ const p = $gamePlayer, s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === p);
        const g = s.getGlobalPosition(), b = s._swingBody, sw = !!(b && b.visible), owner = sw ? b : s, h = owner._ubiorHead;
        return { x: g.x, y: g.y, swing: sw, head: !!(h && h.renderable && h.visible) }; })()`);
    const clipShot = async (file, at) => {
        const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: at.x - CLIP.left, y: at.y - CLIP.up, width: CLIP.w, height: CLIP.h, scale: 1 } });
        fs.writeFileSync(path.join(SHOTS, file), Buffer.from(r.data, "base64"));
    };
    const pose = o => t.eval(`(function(){ const p = $gamePlayer; p._swingEvent = null; p._toolSwing = null;
        ${o.swing ? `p.setDirection(${o.dir}); p._swingEvent = { _swingT: ${o.t}, _swingKind: ${o.kind}, opts: null, _waiting: false };`
        : `p.setDirection(${o.dir4}); p._heroDir8 = ${o.d8}; p._heroStill = 0; p._heroStep = HeroLook.STRIDE.walk * ${o.phase || 0.3125};`} return 0; })()`);
    const MAP = [{ d8: 2, d4: 2, label: "chód: dół" }, { d8: 3, d4: 6, label: "chód: prawo-dół", phase: 0.6 }, { d8: 6, d4: 6, label: "chód: prawo" },
        { d8: 8, d4: 8, label: "chód: góra" }, { kind: 3, dir: 6, label: "siekiera z boku" }, { kind: 11, dir: 2, label: "siedzi", t: 60 }, { kind: 14, dir: 6, label: "leży", t: 50 }];
    let headOk = true;
    meta.mapa2 = [];
    for (const [name, set] of Object.entries(SETS).concat(Object.entries(SETS2))) {
        const into = SETS[name] ? meta.mapa : meta.mapa2;
        for (const on of [false, true]) {
            await t.eval(`Ubior.pl(${on}); Ubior.set(${JSON.stringify(Object.assign({}, NONE, set))}); 0`);
            await t.until(`Ubior.liveKey("Hero_Walk") === Ubior.key()`, 20, 50);
            for (const [i, m] of MAP.entries()) {
                if (m.kind !== undefined) {
                    const tt = m.t || await t.eval(`Tawerna.api("ChoppableTree").swingKind(${m.kind}).impact`);
                    await pose({ swing: true, kind: m.kind, dir: m.dir, t: tt });
                } else await pose(m);
                await t.frames(6);
                const at = await look();
                const f = `map_${name}_${on ? "new" : "old"}_${i}.png`;
                await clipShot(f, at);
                into.push({ set: name, on, label: m.label, file: f, head: at.head });
            }
        }
    }
    // (the PixelLab helmets are small: they fit in the walking cell - nothing over its top, the child over the head is not needed)
    for (const [k, set] of [["kaptur", SETS.skora], ["kapalin", SETS.zelazo], ["czepiec", SETS2.przeszywanica], ["nosal", SETS2.luska], ["otwarty", SETS2.napiersnik],
        ["zakonny", SETS2.zakonny], ["czepiec kolczy", SETS2.czepiec_kolczy]]) {
        await t.eval(`Ubior.pl(true); Ubior.set(${JSON.stringify(Object.assign({}, NONE, set))}); 0`);
        for (const sheet of ["Hero_Walk", "Hero_Run", "Hero_Axe", "Hero_LieDown"]) {
            await ready(sheet);
            const pr = await t.json(`(function(){ const p = Ubior.problems(${JSON.stringify(sheet)}); return p ? { clipped: p.list.filter(x => /ucięte/.test(x.what)).length,
                cells: p.cells } : null; })()`);
            if (!pr || pr.clipped) headOk = false;
            meta.mapa_helm = (meta.mapa_helm || []).concat([{ k, sheet, pr }]);
        }
    }
    t.check("hełmy PL (7) nieucięte krawędzią klatki w chodzie, biegu, pracy, leżąc", headOk, meta.mapa_helm.filter(h => !h.pr || h.pr.clipped));
    // the sword's swing on the map: the iron set, a steel sword, 4 ways, before / the blow / after
    await t.eval(`Ubior.pl(true); Ubior.set(${JSON.stringify(Object.assign({}, NONE, SETS.zelazo))}); UbiorBron.set({ Hero_Sword: "bron_miecz_stal" }); 0`);
    const def = await t.json(`Tawerna.api("ChoppableTree").swingKind(21)`);
    let swMap = true;
    for (const dir of [2, 4, 6, 8]) {
        for (const [lab, tt] of [["zamach", Math.round(def.impact * 0.6)], ["cios", def.impact], ["po", def.impact + def.hold + 5]]) {
            await pose({ swing: true, kind: 21, dir, t: tt });
            await t.frames(6);
            const at = await look();
            if (!at.swing) swMap = false;
            const f = `miecz_${dir}_${lab}.png`;
            await clipShot(f, at);
            meta.miecz_mapa.push({ dir, label: lab, file: f });
        }
    }
    t.check("zamach mieczem na mapie (4 kierunki): arkusz Hero_Sword na duszku", swMap);
    await t.eval("(function(){ UbiorBron.set(null); $gamePlayer._swingEvent = null; const sc = SceneManager._scene; sc.updateMain = sc.__updateMain; Ubior.set(null); return 0; })()");

    // ---- 5. the cost, the errors, the pictures
    const stats = (await t.json("Ubior.stats()")).slice(before);
    const worst = stats.length ? Math.max(...stats.map(s => s.ms)) : 0;
    const per = {};
    for (const s of stats) (per[s.sheet] = per[s.sheet] || []).push(s.ms);
    meta.ms = {};
    for (const [n, v] of Object.entries(per)) meta.ms[n] = { n: v.length, max: +Math.max(...v).toFixed(1), avg: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) };
    console.log("składanie: " + stats.length + " razy, najdłużej " + worst.toFixed(1) + " ms; " + Object.entries(meta.ms).map(([n, m]) => n + " " + m.avg + " ms").join(", "));
    t.check("składanie z warstwami PL: każdy arkusz poniżej 60 ms", worst < 60, worst);
    fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 1));
    try {
        const log = execFileSync(process.env.PYTHON || "python", [path.join(__dirname, "..", "tools", "ubior", "zloz_pl.py"), OUT], { encoding: "utf8" });
        console.log(log.trim());
        t.check("obrazki docs/ekwipunek/pixellab_proba_*.png złożone", /pixellab_proba_zbroje/.test(log) && /pixellab_proba_mapa/.test(log));
    } catch (e) {
        t.check("obrazki docs/ekwipunek/pixellab_proba_*.png złożone", false, String(e.message).slice(0, 300));
    }
});
