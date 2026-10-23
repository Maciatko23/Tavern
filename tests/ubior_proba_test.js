// Próba ubioru (js/plugins/Ubior.js - pilot, nie ma go w js/plugins.js: test wkłada go do strony): nowa gra, bohater na zwykłej
// mapie w dzień, kolejno bez stroju, trzy koszule, buty, kapelusz i wszystko razem - dla każdego chód w 8 kierunkach i zamach
// siekierą (z góry: zamach nad głową i uderzenie, z boku: uderzenie) - zrzuty z gry w kluczowych klatkach. Do tego: przemalowane
// arkusze (z gry, canvas), czas składania (ms na arkusz), klatki, w których kapelusz siedzi źle (Ubior.problems), w ruchu (chód
// po klawiszu i prawdziwy zamach w nowym stroju), błędy w konsoli. Na końcu tools/ubior/zloz_proba.py składa
// docs/ekwipunek/proba_ubioru.png i proba_arkusze.png.
//   node tests/ubior_proba_test.js          (port CDP 9575; CDP_PORT=... inny)
// (2026-10-22: próba zastąpiona pełnym systemem - tests/ubior_test.js, tests/ubior_maski_test.js; tu wzory pełnej wersji o tych
// samych rolach: lniana koszula, czerwony kaftan, zielona kurta, buty - teraz z cholewką, kapelusz. Obrazki docs/ekwipunek/proba_*
// są z próby: składa je tylko UBIOR_PROBA_OBRAZKI=1.)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "ubior_proba");
const SHOTS = path.join(OUT, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

// the outfits of the rows (Ubior.set: a missing slot = nothing there, Equipment has nothing in a new game)
const OUTFITS = [
    { key: "bez", label: "bez stroju", o: { glowa: "", tors: "", stopy: "" } },
    { key: "len", label: "lniana koszula", o: { glowa: "", tors: "koszula_lniana_biala", stopy: "" } },
    { key: "welna", label: "czerwony wełniany kaftan", o: { glowa: "", tors: "kaftan_czerwony", stopy: "" } },
    { key: "ziel", label: "zielona skórzana kurta", o: { glowa: "", tors: "kurta_zielona", stopy: "" } },
    { key: "buty", label: "skórzane buty", o: { glowa: "", tors: "", stopy: "buty_brazowe" } },
    { key: "kapelusz", label: "słomkowy kapelusz", o: { glowa: "kapelusz_slomkowy", tors: "", stopy: "" } },
    { key: "wszystko", label: "wszystko: kapelusz + kaftan + buty", o: { glowa: "kapelusz_slomkowy", tors: "kaftan_czerwony", stopy: "buty_brazowe" } }
];
// the columns: the walk (numpad facing, its 4-way direction) at a frame of the stride, then the axe
const WALK = [[2, 2, "dół"], [1, 2, "dół-lewo"], [4, 4, "lewo"], [7, 8, "góra-lewo"], [8, 8, "góra"], [9, 8, "góra-prawo"], [6, 6, "prawo"], [3, 2, "dół-prawo"]];
const STEP_PHASE = 0.3125;   // (col 1 + floor(0.3125 * 8) = 3: legs apart)
const SWINGS = [
    { kind: 0, dir: 2, at: "col7", label: "siekiera z góry: nad głową" },
    { kind: 0, dir: 2, at: "hit", label: "siekiera z góry: uderzenie (dół)" },
    { kind: 0, dir: 4, at: "hit", label: "uderzenie (lewo)" },
    { kind: 0, dir: 8, at: "hit", label: "uderzenie (góra)" },
    { kind: 3, dir: 6, at: "hit", label: "siekiera z boku: uderzenie (prawo)" },
    { kind: 3, dir: 2, at: "hit", label: "z boku (dół)" }
];
const CLIP = { left: 48, up: 80, w: 96, h: 92 };   // around the feet: the 96 swing cell's figure fits

kit.test({ port: 9575, plugins: ["Ubior"], evalTimeout: 60000 }, async t => {
    t.check("Ubior.js w stronie", ["injected", "registered"].includes(t.plugins.Ubior), t.plugins);
    const ok = await t.newGame({ hour: 10, quiet: true, minimap: false });
    t.check("nowa gra: mapa w dzień", ok);
    if (!ok) return;
    // a free spot: the hero alone on the grass, the camera on him
    // (Kruczy Jar: 22,14 is in the wood - the trees go see-through over him; 29,13 is open grass)
    const [HX, HY] = (process.env.UBIOR_XY || "29,13").split(",").map(Number);
    await t.eval(`(function(){ $gamePlayer.locate(${HX}, ${HY}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${HX} - 13, ${HY} - 7); return 0; })()`);
    await t.frames(30);
    await t.calm();
    await t.eval("(function(){ $gameScreen.clearWeather(); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); return 0; })()");
    await t.frames(60);
    await t.shot(path.join(SHOTS, "_mapa.png"));
    t.check("HeroLook: nowa postać", await t.eval("!!(window.HeroLook && HeroLook.active())"));

    // ---- the game's logic stopped (the sprites still update): the hero stays exactly in the pose we give him
    // (the passing cloud shadows and the corner brackets of the tile in front hidden too: the same light in every shot)
    await t.eval(`(function(){ const sc = SceneManager._scene; sc.__updateMain = sc.updateMain; sc.updateMain = function(){};
        const hide = s => { s.__update = s.update; s.update = function(){ this.visible = false; }; s.visible = false; };
        for (const c of sc._spriteset._cloudSprites || []) hide(c);
        const walk = o => { for (const ch of o.children || []) { if (ch.constructor && ch.constructor.name === "Sprite_TargetMarker") hide(ch); walk(ch); } };
        walk(sc._spriteset);
        return 0; })()`);
    const ROW = { 2: 0, 4: 1, 6: 2, 8: 3 };
    // the swing time t that shows a sheet column (the game's own frame function)
    const swingT = (kind, dir, at) => t.eval(`(function(){ const S = Tawerna.api("ChoppableTree_parts").swing, d = ChoppableTree.swingKind(${kind});
        const bm = ImageManager.loadSystem(d.sheet), frames = Math.floor(bm.width / 96), row = ${ROW[dir]};
        if (${JSON.stringify(at)} === "hit") return { t: d.impact, col: S.swingSheetFrame(${kind}, frames, row, d.impact), sheet: d.sheet };
        const want = Number(${JSON.stringify(at)}.slice(3));
        for (let tt = 0; tt < d.frames; tt++) if (S.swingSheetFrame(${kind}, frames, row, tt) === want) return { t: tt, col: want, sheet: d.sheet };
        return { t: 0, col: 0, sheet: d.sheet }; })()`);
    const swingTimes = [];
    for (const s of SWINGS) swingTimes.push(await swingT(s.kind, s.dir, s.at));
    console.log("swing frames:", JSON.stringify(swingTimes));

    const pose = o => t.json(`(function(){ const p = $gamePlayer, s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === p);
        p._swingEvent = null; p._toolSwing = null;
        ${o.swing ? `p.setDirection(${o.dir}); p._swingEvent = { _swingT: ${o.t}, _swingKind: ${o.kind}, opts: null, _waiting: false };`
        : `p.setDirection(${o.dir4}); p._heroDir8 = ${o.d8}; p._heroStill = 0; p._heroStep = HeroLook.STRIDE.walk * ${STEP_PHASE};`}
        return 0; })()`);
    const look = () => t.json(`(function(){ const p = $gamePlayer, s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === p);
        const g = s.getGlobalPosition(), b = s._swingBody, sw = !!(b && b.visible), bm = sw ? b.bitmap : s.bitmap, f = sw ? b._frame : s._frame;
        return { x: g.x, y: g.y, scale: s.worldTransform.a, swing: sw, dressed: !!(bm && bm._ubiorDressed), col: Math.round(f.x / f.width), row: Math.round(f.y / f.height),
            w: f.width }; })()`);
    const clipShot = async (file, at) => {
        const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: at.x - CLIP.left, y: at.y - CLIP.up, width: CLIP.w, height: CLIP.h, scale: 1 } });
        fs.writeFileSync(file, Buffer.from(r.data, "base64"));
    };

    const meta = { outfits: OUTFITS.map(o => ({ key: o.key, label: o.label })), cols: [], cells: {} };
    for (const [d8, , name] of WALK) meta.cols.push({ key: "walk" + d8, label: "chód: " + name });
    SWINGS.forEach((s, i) => meta.cols.push({ key: "swing" + i, label: s.label }));
    let dressedOk = true, scaleOk = true, rowsOk = true;
    for (const of of OUTFITS) {
        await t.eval(`Ubior.set(${JSON.stringify(of.o)}); 0`);
        const empty = !of.o.glowa && !of.o.tors && !of.o.stopy;
        for (const [d8, d4] of WALK) {
            await pose({ d8, dir4: d4 });
            await t.frames(3);
            const at = await look();
            const file = `${of.key}_walk${d8}.png`;
            await clipShot(path.join(SHOTS, file), at);
            meta.cells[of.key + "/walk" + d8] = { file, col: at.col, row: at.row };
            if (at.dressed === empty) dressedOk = false;
            if (Math.abs(at.scale - 1) > 0.001) scaleOk = false;
            if (at.row !== HeroLookRow(d8)) rowsOk = false;
        }
        for (let i = 0; i < SWINGS.length; i++) {
            const s = SWINGS[i];
            await pose({ swing: true, kind: s.kind, dir: s.dir, t: swingTimes[i].t });
            await t.frames(3);
            const at = await look();
            const file = `${of.key}_swing${i}.png`;
            await clipShot(path.join(SHOTS, file), at);
            meta.cells[of.key + "/swing" + i] = { file, col: at.col, row: at.row, sheet: swingTimes[i].sheet };
            if (!at.swing || at.dressed === empty) dressedOk = false;
        }
    }
    t.check("zrzuty: w każdym stroju arkusz przebrany (bez stroju - zwykły), postać 1:1", dressedOk && scaleOk, { dressedOk, scaleOk });
    t.check("chód: wiersz arkusza zgodny z kierunkiem", rowsOk);
    function HeroLookRow(d8) { return { 2: 0, 1: 1, 4: 2, 7: 3, 8: 4, 9: 5, 6: 6, 3: 7 }[d8]; }

    // ---- the sheets themselves (the dressed copies out of the game) and the problems of the hat
    const sheetsOut = {};
    for (const of of OUTFITS.filter(o => ["bez", "len", "welna", "ziel", "wszystko"].includes(o.key))) {
        await t.eval(`Ubior.set(${JSON.stringify(of.o)}); 0`);
        for (const name of ["Hero_Walk", "Hero_Axe", "Hero_AxeSide"]) {
            await t.until(`!!Ubior.sheet(${JSON.stringify(name)}) && Ubior.sheet(${JSON.stringify(name)}).isReady()`, 10, 100);
            const url = await t.eval(`(function(){ const b = Ubior.sheet(${JSON.stringify(name)}); return (b._canvas ? b.canvas : (function(){ const c = document.createElement("canvas"); c.width = b.width; c.height = b.height; c.getContext("2d").drawImage(b._image, 0, 0); return c; })()).toDataURL("image/png"); })()`);
            const file = `sheet_${of.key}_${name}.png`;
            fs.writeFileSync(path.join(SHOTS, file), Buffer.from(url.split(",")[1], "base64"));
            sheetsOut[of.key + "/" + name] = file;
        }
    }
    meta.sheets = sheetsOut;
    await t.eval(`Ubior.set(${JSON.stringify(OUTFITS[6].o)}); 0`);
    for (const name of ["Hero_Walk", "Hero_Axe", "Hero_AxeSide"]) await t.eval(`Ubior.sheet(${JSON.stringify(name)}) ? 0 : 0`);
    const probs = {};
    for (const name of ["Hero_Walk", "Hero_Axe", "Hero_AxeSide"]) probs[name] = await t.json(`Ubior.problems(${JSON.stringify(name)})`);
    meta.problems = probs;
    for (const [name, p] of Object.entries(probs)) {
        if (!p) { console.log("problems", name, "none (no report)"); continue; }
        const bad = p.list.filter(x => !x.note);
        console.log(`kapelusz ${name}: ${p.cells} klatek, zwykle ${Math.round(p.median * 100)}% kapelusza nad włosami; problemy ${bad.length}, uwagi ${p.list.length - bad.length}`);
        for (const x of p.list) console.log("   " + (x.note ? "uwaga " : "PROBLEM ") + x.where + ": " + x.what);
    }
    const noneOrClip = Object.values(probs).reduce((n, p) => n + (p ? p.list.filter(x => /brak włosów|ucięty/.test(x.what)).length : 1), 0);
    t.check("kapelusz: w każdej klatce chodu i zamachu znaleziona głowa, nic nie ucięte krawędzią klatki", noneOrClip === 0, noneOrClip);

    // ---- the cost: every sheet composed anew, for each outfit
    await t.eval("Ubior.clear(); 0");
    const before = await t.eval("Ubior.stats().length");
    for (const of of OUTFITS.slice(1)) {
        await t.eval(`Ubior.set(${JSON.stringify(of.o)}); 0`);
        for (const name of ["Hero_Walk", "Hero_Axe", "Hero_AxeSide"]) await t.eval(`(Ubior.sheet(${JSON.stringify(name)}), 0)`);
    }
    const stats = (await t.json("Ubior.stats()")).slice(before);
    meta.stats = stats;
    const per = {};
    for (const s of stats) (per[s.sheet] = per[s.sheet] || []).push(s.ms);
    for (const [name, v] of Object.entries(per)) console.log(`składanie ${name}: ${v.length}x, ${Math.min(...v).toFixed(1)}-${Math.max(...v).toFixed(1)} ms (średnio ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)} ms)`);
    t.check("składanie: każdy arkusz w każdym stroju, poniżej 100 ms", stats.length === (OUTFITS.length - 1) * 3 && stats.every(s => s.ms < 100), stats.map(s => s.ms));

    // ---- in motion: the game runs again, he walks by the keys in the full outfit and swings the axe for real; the outfit changes
    // while he walks
    await t.eval("(function(){ const sc = SceneManager._scene; sc.updateMain = sc.__updateMain; delete sc.__updateMain; $gamePlayer._swingEvent = null; return 0; })()");
    const x0 = await t.eval("$gamePlayer._realX");
    await t.eval(`Ubior.set(${JSON.stringify(OUTFITS[6].o)}); 0`);
    t.clearErrors();
    await t.eval("Input._currentState.left = true; 0");
    await t.frames(25);
    await t.eval(`Ubior.set(${JSON.stringify(OUTFITS[1].o)}); 0`);
    await t.frames(5);
    const walking = await look();
    walking.moved = +(x0 - (await t.eval("$gamePlayer._realX"))).toFixed(2);
    await t.eval("Input._currentState.left = false; 0");
    t.check("w ruchu: zmiana stroju w marszu - przebrany arkusz od razu", walking.dressed && !walking.swing && walking.moved > 0.5, walking);
    await t.eval(`Ubior.set(${JSON.stringify(OUTFITS[6].o)}); 0`);
    await t.frames(10);
    await t.eval("$gamePlayer.setDirection(2); window.__hit = 0; $gamePlayer.startToolSwing(0, () => { window.__hit = 1; }); 0");
    let seen = false;
    for (let i = 0; i < 40 && !seen; i++) {
        const at = await look();
        if (at.swing && at.dressed) { seen = true; await clipShot(path.join(SHOTS, "_w_ruchu_zamach.png"), at); }
        else await t.frames(1);
    }
    await t.until("!$gamePlayer._swingEvent", 10, 100);
    t.check("w ruchu: prawdziwy zamach siekierą w nowym stroju (przebrany arkusz, uderzenie doszło)", seen && (await t.eval("window.__hit")) === 1);
    await t.eval(`Ubior.set({ glowa: "", tors: "", stopy: "" }); 0`);
    await t.frames(5);
    const plainAgain = await look();
    t.check("zdjęte wszystko: zwykły arkusz wraca", !plainAgain.dressed, plainAgain);

    // ---- Equipment.js: the leather boots (113) put on there are seen (zEkwipunku), off again when they leave the bag
    const eq = await t.json(`(function(){ if (!window.Equipment) return { none: true }; Ubior.set({});
        $gameParty.gainItem($dataItems[113], 1); const worn = Equipment.worn(113), o = Ubior.outfit();
        $gameParty.loseItem($dataItems[113], 1); const after = Ubior.outfit();
        return { worn, stopy: o.stopy || "", after: after.stopy || "" }; })()`);
    if (eq.none) console.log("NOTE Equipment.js not in the page - the link not checked");
    else t.check("Equipment: skórzane buty (113) założone - widać je; wyjęte z plecaka - znikają", eq.worn && eq.stopy === "buty_brazowe" && eq.after === "", eq);

    fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 1));
    // ---- the pictures for docs/ekwipunek (only on demand: they are the pilot's)
    if (process.env.UBIOR_PROBA_OBRAZKI !== "1") { console.log("NOTE obrazki próby nie składane (UBIOR_PROBA_OBRAZKI=1)"); return; }
    try {
        const py = process.env.PYTHON || "python";
        const log = execFileSync(py, [path.join(__dirname, "..", "tools", "ubior", "zloz_proba.py"), OUT], { encoding: "utf8" });
        console.log(log.trim());
        t.check("obrazki docs/ekwipunek złożone", /proba_ubioru\.png/.test(log) && /proba_arkusze\.png/.test(log));
    } catch (e) {
        t.check("obrazki docs/ekwipunek złożone", false, String(e.message).slice(0, 300));
    }
});
