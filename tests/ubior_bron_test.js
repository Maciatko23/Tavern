// Broń, hełmy, zbroje i tarcze na bohaterze (js/plugins/Ubior.js 1.1 + Ubior_Bron.js; docs/ekwipunek/PLAN_BRON_ZBROJE.md):
//   1. każdy klucz broni z Ubior_Data.WZORY_BRONI na swoim zamachu (kluczowe klatki: przed ciosem, cios, po ciosie; dół i bok) - nowe
//      rodzaje na osi starej broni, materiały, własna broń arkusza w swoim materiale = zwykły arkusz -> docs/ekwipunek/bron_*.png
//   2. każdy hełm (WZORY_ZBROI helm_*) w chodzie (5 kierunków), biegu, pracy, walce, siedząc, leżąc, w przewrocie i jako jeździec na
//      orle (wycinek Orzel_Lot: wiersz N, od y = 2) - z tym, co wystaje nad klatkę (pasek nad głową); popiersie, karta postaci w menu,
//      zrzut z ekranu (duszek nad głową w grze) -> docs/ekwipunek/helmy_*.png
//   3. zbroje, karwasze, nagolenniki, buty okute (WZORY_ZBROI), tarcze (WZORY_TARCZ: z przodu, z boku, w gardzie na mapie)
//      -> docs/ekwipunek/zbroje_*.png
//   4. czas składania arkusza, błędy w konsoli.
//   node tests/ubior_bron_test.js          (port CDP 9585)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "ubior_bron");
const SHOTS = path.join(OUT, "shots");
fs.mkdirSync(SHOTS, { recursive: true });
const NONE = { glowa: "", tors: "", nogi: "", stopy: "", pas: "", rece: "", plecy: "" };
// the swing's frame of the blow in each row (HeroLook.js SWINGS hit) - the key frames: before, the blow, after; rows S and W
const HIT = { Hero_Club: [9, 7], Hero_Axe: [8, 7], Hero_AxeSide: [10, 10], Hero_Pick: [8, 9], Hero_Spear: [8, 10], Hero_Punch: [12, 13], Hero_Bow: [14, 14], Hero_Sling: [9, 11] };
const keyFrames = sheet => {
    const out = [];
    for (const r of [0, 1]) { const h = HIT[sheet][r]; for (const c of [Math.max(0, h - 5), h, Math.min(16, h + 4)]) out.push([r, c]); }
    return out;
};
const HELM_VIEWS = [["chód S", "Hero_Walk", 0, 0], ["chód SW", "Hero_Walk", 0, 1], ["chód W", "Hero_Walk", 3, 2], ["chód N", "Hero_Walk", 0, 4], ["chód E", "Hero_Walk", 3, 6],
    ["bieg", "Hero_Run", 3, 7], ["siekiera", "Hero_AxeSide", 10, 1], ["pałka", "Hero_Club", 9, 0], ["siedzi", "Hero_Sit", 16, 0], ["leży (dół)", "Hero_LieDown", 16, 0],
    ["leży (bok)", "Hero_LieDown", 16, 1], ["leży (góra)", "Hero_LieDown", 16, 3], ["przewrót", "Hero_Roll", 5, 0], ["przewrót", "Hero_Roll", 6, 1], ["przewrót", "Hero_Roll", 7, 2]];
const ARMOUR_VIEWS = [["chód S", "Hero_Walk", 0, 0], ["chód W", "Hero_Walk", 3, 2], ["chód N", "Hero_Walk", 0, 4], ["siekiera", "Hero_AxeSide", 10, 2], ["pałka", "Hero_Club", 7, 1],
    ["siedzi", "Hero_Sit", 16, 0], ["leży", "Hero_LieDown", 16, 0]];
const CLIP = { left: 48, up: 92, w: 96, h: 104 };

kit.test({ port: 9585, plugins: ["Ubior_Bron"], evalTimeout: 120000 }, async t => {
    t.check("Ubior_Bron.js w stronie, Ubior.js 1.1", ["injected", "registered"].includes(t.plugins.Ubior_Bron), t.plugins);
    const ok = await t.newGame({ hour: 10, quiet: true, minimap: false });
    t.check("nowa gra", ok);
    if (!ok) return;
    const [HX, HY] = [29, 13];
    await t.eval(`(function(){ $gamePlayer.locate(${HX}, ${HY}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${HX} - 13, ${HY} - 7); return 0; })()`);
    await t.calm();
    await t.eval("(function(){ $gameScreen.clearWeather(); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); return 0; })()");
    await t.frames(30);
    t.clearErrors();
    const ver = await t.json("({ u: Ubior.VERSION, b: UbiorBron.VERSION, layers: Ubior.layers().map(l => l.name) })");
    t.check("Ubior 1.1 z warstwą broni", ver.u === "1.1.0" && ver.layers.includes("bron"), ver);
    const before = await t.eval("Ubior.stats().length");
    // a crop: the cell with what is over its head (Ubior.cellWithHead), 96 x 108, the feet about the same height in every sheet
    const crop = (name, c, r) => t.eval(`(function(){ const b = Ubior.sheet(${JSON.stringify(name)}), cell = Ubior.SHEETS[${JSON.stringify(name)}].cell;
        const src = Ubior.cellWithHead(b, ${JSON.stringify(name)}, ${c}, ${r}); const cv = document.createElement("canvas"); cv.width = 96; cv.height = 108;
        const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false; cx.drawImage(src, (96 - cell) / 2, cell === 64 ? 28 : 0); return cv.toDataURL("image/png"); })()`);
    const save = (file, url) => fs.writeFileSync(path.join(SHOTS, file), Buffer.from(url.split(",")[1], "base64"));
    const meta = { bron: [], helmy: [], zbroje: [], tarcze: [], helmViews: HELM_VIEWS.map(v => v[0]), armourViews: ARMOUR_VIEWS.map(v => v[0]), shots: {} };

    // ---- 1. the weapons
    const data = await t.json(`(function(){ const D = Ubior_Data, B = UbiorBron; return Object.keys(D.WZORY_BRONI).map(k => { const l = B.lookOf(k);
        return { key: k, rodzaj: l ? l.rodzaj : null, material: l ? l.material : null, sheets: l ? B.SHEETS_OF[l.rodzaj] : [] }; }); })()`);
    t.check("klucze broni z Ubior_Data.WZORY_BRONI (" + data.length + "), każdy rozpoznany", data.length >= 60 && data.every(d => d.rodzaj), data.filter(d => !d.rodzaj).map(d => d.key));
    await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE, { glowa: "helm_nosal_stal", tors: "zbroja_przeszywanica_len" }))}); 0`);
    let weapOk = true, plainOk = true;
    const bad = [];
    for (const w of data) {
        const sheet = w.sheets[0];
        await t.eval(`UbiorBron.set({ ${sheet}: ${JSON.stringify(w.key)} }); 0`);
        const want = await t.eval(`UbiorBron.key(${JSON.stringify(sheet)})`);
        const ready = await t.until(`(function(){ const b = Ubior.sheet(${JSON.stringify(sheet)}); if (!b || !b.isReady()) return false;
            const k = Ubior.liveFullKey(${JSON.stringify(sheet)}); if (k === null || Ubior.liveKey(${JSON.stringify(sheet)}) !== Ubior.key()) return false;
            return ${JSON.stringify(want)} ? k.indexOf(${JSON.stringify(want)}) >= 0 : k.indexOf("#bron") < 0; })()`, 20, 50);
        if (!ready) { weapOk = false; bad.push(w.key); }
        if (!want) plainOk = plainOk && ready;   // (its own weapon in its own material: the plain sheet)
        const files = [];
        for (const [r, c] of keyFrames(sheet)) {
            const f = `b_${w.key}_${r}_${c}.png`;
            save(f, await crop(sheet, c, r));
            files.push(f);
        }
        meta.bron.push({ key: w.key, rodzaj: w.rodzaj, material: w.material, sheet, own: !want, files, frames: keyFrames(sheet) });
    }
    t.check("każdy klucz broni: arkusz zamachu złożony z tą bronią (" + data.length + ")", weapOk, bad);
    t.check("własna broń w swoim materiale (pałka, żelazna siekiera, kilof, oszczep, łuk, proca) = zwykły arkusz", plainOk);
    await t.eval("UbiorBron.set(null); 0");
    // the tool he works with drives the look on the work's sheets (no forcing): the stone axe -> stone on the axe's swing
    const hand = await t.json(`(function(){ $gameParty.gainItem($dataItems[60], 1); return { axe: UbiorBron.key("Hero_AxeSide"), pick: UbiorBron.key("Hero_Pick") }; })()`);
    t.check("narzędzie do pracy: kamienna siekiera (60) - kamień na zamachu siekierą", /bron_siekiera_kamien/.test(hand.axe), hand);

    // ---- 2. the helmets
    const helms = await t.json("Object.keys(Ubior_Data.WZORY_ZBROI).filter(k => /^helm_/.test(k))");
    let helmOk = true;
    for (const h of helms) {
        await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE, { glowa: h }))}); 0`);
        const files = [];
        for (const [label, sheet, c, r] of HELM_VIEWS) {
            const ready = await t.until(`(function(){ const b = Ubior.sheet(${JSON.stringify(sheet)}); return !!(b && b.isReady() && b._ubiorDressed && Ubior.liveKey(${JSON.stringify(sheet)}) === Ubior.key()); })()`, 20, 50);
            if (!ready) helmOk = false;
            const f = `h_${h}_${sheet}_${c}_${r}.png`;
            save(f, await crop(sheet, c, r));
            files.push(f);
        }
        // the eagle's rider: Orzel_Lot's own frame of the walk (north row, from y = 2) with a sprite and its child over the head
        const rider = await t.eval(`(function(){ const s = new Sprite(ImageManager.loadCharacter("Hero_Walk")); s.anchor.set(0.5, 1); s.setFrame(16, 4 * 64 + 2, 32, 36);
            const head = s._ubiorHead; if (!head) return ""; head.follow(); const st = s.bitmap._ubiorStrip;
            const cv = document.createElement("canvas"); cv.width = 32; cv.height = 36 + 14; const cx = cv.getContext("2d");
            if (head.renderable) cx.drawImage(st.bmp.canvas, head._frame.x, head._frame.y, head._frame.width, head._frame.height, 0, 50 - 36 - head._frame.height, head._frame.width, head._frame.height);
            cx.drawImage(s.bitmap.canvas, 16, 4 * 64 + 2, 32, 36, 0, 14, 32, 36); return cv.toDataURL("image/png"); })()`);
        if (rider) { save(`h_${h}_rider.png`, rider); files.push(`h_${h}_rider.png`); } else { files.push(null); helmOk = false; }
        const pr = await t.json(`(function(){ const p = Ubior.problems("Hero_Walk"); return p ? { clipped: p.list.filter(x => /ucięte/.test(x.what)).length } : null; })()`);
        meta.helmy.push({ key: h, files, clipped: pr ? pr.clipped : -1 });
    }
    t.check("każdy hełm (" + helms.length + ") we wszystkich ujęciach, także leżąc, w przewrocie i na orle", helmOk);
    t.check("hełmy w chodzie nieucięte krawędzią klatki (pasek nad głową)", meta.helmy.every(h => h.clipped === 0), meta.helmy.filter(h => h.clipped).map(h => h.key));
    // over the head on the screen: the child sprite of the walking hero draws the helmet's crown over his frame
    await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE, { glowa: "helm_zakonny_zakon", tors: "zbroja_napiersnik_zakon", rece: "karwasze_zakon", nogi: "nagolenniki_zakon", stopy: "buty_okute_stal" }))}); 0`);
    await t.until(`Ubior.liveKey("Hero_Walk") === Ubior.key()`, 20, 50);
    await t.eval(`(function(){ const sc = SceneManager._scene; sc.__updateMain = sc.updateMain; sc.updateMain = function(){};
        const hide = s => { s.update = function(){ this.visible = false; }; s.visible = false; };
        for (const c of sc._spriteset._cloudSprites || []) hide(c);
        const walk = o => { for (const ch of o.children || []) { if (ch.constructor && ch.constructor.name === "Sprite_TargetMarker") hide(ch); walk(ch); } };
        walk(sc._spriteset); return 0; })()`);
    const look = () => t.json(`(function(){ const p = $gamePlayer, s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === p);
        const g = s.getGlobalPosition(), b = s._swingBody, sw = !!(b && b.visible), owner = sw ? b : s, h = owner._ubiorHead;
        return { x: g.x, y: g.y, swing: sw, head: !!(h && h.renderable && h.visible), hh: h ? h._frame.height : 0 }; })()`);
    const clipShot = async (file, at) => {
        const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: at.x - CLIP.left, y: at.y - CLIP.up, width: CLIP.w, height: CLIP.h, scale: 1 } });
        fs.writeFileSync(path.join(SHOTS, file), Buffer.from(r.data, "base64"));
    };
    const pose = o => t.eval(`(function(){ const p = $gamePlayer; p._swingEvent = null; p._toolSwing = null;
        ${o.swing ? `p.setDirection(${o.dir}); p._swingEvent = { _swingT: ${o.t}, _swingKind: ${o.kind}, opts: null, _waiting: false };`
        : `p.setDirection(${o.dir4}); p._heroDir8 = ${o.d8}; p._heroStill = 0; p._heroStep = HeroLook.STRIDE.walk * 0.3125;`} return 0; })()`);
    meta.shots.mapa = [];
    let screenOk = true;
    for (const [d8, d4, label] of [[2, 2, "chód: dół"], [6, 6, "chód: prawo"], [8, 8, "chód: góra"]]) {
        await pose({ d8, dir4: d4 });
        await t.frames(4);
        const at = await look();
        if (!at.head) screenOk = false;
        await clipShot(`s_walk${d8}.png`, at);
        meta.shots.mapa.push({ label, file: `s_walk${d8}.png`, head: at.head });
    }
    for (const s of [{ kind: 3, dir: 6, label: "siekiera z boku" }, { kind: 14, dir: 2, label: "leży", t: 40 }]) {
        const tt = s.t || await t.eval(`ChoppableTree.swingKind(${s.kind}).impact`);
        await pose({ swing: true, kind: s.kind, dir: s.dir, t: tt });
        await t.frames(4);
        const at = await look();
        await clipShot(`s_k${s.kind}.png`, at);
        meta.shots.mapa.push({ label: s.label, file: `s_k${s.kind}.png`, head: at.head });
    }
    t.check("na mapie: duszek nad głową bohatera rysuje koronę hełmu nad klatką (chód 3 kierunki)", screenOk, meta.shots.mapa);
    // the shield in the guard: its picture instead of the icon (forced look; Combat_UI's guard)
    meta.shots.tarcza = [];
    const shieldKeys = await t.json("Object.keys(Ubior_Data.WZORY_TARCZ)");
    let guardOk = true;
    // (the guard held: the fight's own update lets go of it every frame without the key - here it is held for the shots)
    await t.eval(`(function(){ const L = Tawerna.api("Combat_parts").ui.Sprite_CombatLayer; L.prototype.__us = L.prototype.updateShield;
        L.prototype.updateShield = function(){ Combat.act.mode = "block"; Combat.act.blockT = 99; this.__us(); }; return 0; })()`);
    for (const [i, k] of ["tarcza_okuta", "tarcza_zakonna", "tarcza_migdalowa"].entries()) {
        await t.eval(`(function(){ UbiorBron.shield(${JSON.stringify(k)}); const p = $gamePlayer; p._swingEvent = null; p.setDirection(${i === 1 ? 4 : 2}); p._heroDir8 = ${i === 1 ? 4 : 2};
            p._heroStill = 9; Combat.act.mode = "block"; Combat.act.blockT = 99; return 0; })()`);
        await t.frames(6);
        const at = await look();
        const sh = await t.json(`(function(){ let s = null; const walk = o => { for (const ch of o.children || []) { if (ch._ubiorShield !== undefined && ch.visible) s = ch; walk(ch); } };
            walk(SceneManager._scene._spriteset); return s ? { key: s._ubiorShield, w: s.bitmap ? s.bitmap.width : 0 } : null; })()`);
        if (!sh || sh.key !== k) guardOk = false;
        await clipShot(`s_tarcza_${k}.png`, at);
        meta.shots.tarcza.push({ label: k, file: `s_tarcza_${k}.png`, ok: !!(sh && sh.key === k) });
    }
    await t.eval("(function(){ const L = Tawerna.api('Combat_parts').ui.Sprite_CombatLayer; L.prototype.updateShield = L.prototype.__us; Combat.act.mode = 'idle'; UbiorBron.shield(null); const sc = SceneManager._scene; sc.updateMain = sc.__updateMain; $gamePlayer._swingEvent = null; return 0; })()");
    t.check("tarcza w gardzie: jej rysunek (z przodu / z boku) zamiast ikony", guardOk, meta.shots.tarcza);
    for (const k of shieldKeys) {
        const files = [];
        for (const v of ["front", "side"]) {
            await t.until(`!!UbiorBron.shieldBitmap(${JSON.stringify(k)}, ${JSON.stringify(v)})`, 10, 50);
            const url = await t.eval(`(function(){ const b = UbiorBron.shieldBitmap(${JSON.stringify(k)}, ${JSON.stringify(v)}); const cv = document.createElement("canvas"); cv.width = 48; cv.height = 48;
                const cx = cv.getContext("2d"); cx.drawImage(b.canvas, (48 - b.width) / 2, (48 - b.height) / 2); return cv.toDataURL("image/png"); })()`);
            save(`t_${k}_${v}.png`, url);
            files.push(`t_${k}_${v}.png`);
        }
        meta.tarcze.push({ key: k, files });
    }
    t.check("każda tarcza (" + shieldKeys.length + "): obrazek z przodu i z boku", meta.tarcze.length === shieldKeys.length && meta.tarcze.length >= 8);

    // ---- 3. the armour
    const armour = await t.json("Object.keys(Ubior_Data.WZORY_ZBROI).filter(k => !/^helm_/.test(k))");
    let armOk = true;
    for (const a of armour) {
        const place = await t.eval(`Ubior.patterns()[${JSON.stringify(a)}].miejsce`);
        await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE))}); Ubior.wear(${JSON.stringify(a)}); 0`);
        const files = [];
        for (const [label, sheet, c, r] of ARMOUR_VIEWS) {
            const ready = await t.until(`(function(){ const b = Ubior.sheet(${JSON.stringify(sheet)}); return !!(b && b.isReady() && b._ubiorDressed && Ubior.liveKey(${JSON.stringify(sheet)}) === Ubior.key()); })()`, 20, 50);
            if (!ready) armOk = false;
            const f = `z_${a}_${sheet}_${c}_${r}.png`;
            save(f, await crop(sheet, c, r));
            files.push(f);
        }
        meta.zbroje.push({ key: a, miejsce: place, files });
    }
    t.check("każda zbroja, karwasze, nagolenniki, buty okute (" + armour.length + ") na wszystkich ujęciach", armOk);

    // ---- the bust and the P menu's card in a helmet
    meta.busts = [];
    for (const h of ["helm_kaptur_skora", "helm_czepiec_zelazo", "helm_kapalin_stal", "helm_otwarty_braz", "helm_nosal_zelazo", "helm_zakonny_zakon"]) {
        await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE, { glowa: h, tors: h === "helm_zakonny_zakon" ? "zbroja_napiersnik_zakon" : "zbroja_kolczuga_zelazo" }))}); 0`);
        const want = [h, h === "helm_zakonny_zakon" ? "zbroja_napiersnik_zakon" : "zbroja_kolczuga_zelazo", "", "", "", "", ""].join("|");
        const okB = await t.until(`(function(){ const b = Ubior.bust(); return !!(b && b.isReady() && Ubior.bustKey() === ${JSON.stringify(want)}); })()`, 20, 100);
        await t.frames(2);
        save(`p_${h}.png`, await t.eval("Ubior.bust().canvas.toDataURL('image/png')"));
        meta.busts.push({ key: h, file: `p_${h}.png`, ok: okB });
    }
    t.check("popiersie w każdym rodzaju hełmu", meta.busts.every(b => b.ok), meta.busts.map(b => b.ok));
    await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE, { glowa: "helm_nosal_stal", tors: "zbroja_kolczuga_stal", nogi: "nagolenniki_stal", stopy: "buty_okute_stal", rece: "karwasze_stal" }))}); 0`);
    await t.frames(5);
    await t.eval(`(function(){ $gameTemp._menuTab = "equip"; $gameTemp._menuLevel = 2; SceneManager.push(Scene_Menu); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Menu && SceneManager._scene._started && !SceneManager.isSceneChanging()", 20, 100);
    await t.frames(60);
    await t.shot(path.join(SHOTS, "karta.png"));
    const card = await t.json(`(function(){ const sc = SceneManager._scene, eq = (sc._views && sc._views.equip) || sc._view, s = eq && eq._fig;
        if (!s) return null; const b = s.bitmap, d = b.context.getImageData(0, 0, b.width, 60).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
        return { w: b.width, h: b.height, y: s.y, over: n, x: s.x }; })()`);
    meta.card = card;
    t.check("karta postaci (menu P -> Ekwipunek): figura wyższa o pasek nad głową, korona hełmu nad klatką", !!card && card.h === 320 + 60 && card.over > 50, card);
    if (card) {
        const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: card.x, y: card.y, width: card.w, height: card.h, scale: 1 } });
        fs.writeFileSync(path.join(SHOTS, "karta_figura.png"), Buffer.from(r.data, "base64"));
    }
    await t.eval("SceneManager.goto(Scene_Map); 0");
    await t.until(t.onMap(3), 20);

    // ---- the cost
    const stats = (await t.json("Ubior.stats()")).slice(before);
    const per = {};
    for (const s of stats) (per[s.sheet] = per[s.sheet] || []).push(s.ms);
    meta.ms = {};
    for (const [n, v] of Object.entries(per)) meta.ms[n] = { n: v.length, min: +Math.min(...v).toFixed(1), max: +Math.max(...v).toFixed(1), avg: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) };
    const worst = stats.length ? Math.max(...stats.map(s => s.ms)) : 0;
    console.log("składanie: " + stats.length + " razy, najdłużej " + worst.toFixed(1) + " ms; " + Object.entries(meta.ms).map(([n, m]) => n + " " + m.avg + " ms").join(", "));
    t.check("składanie: każdy arkusz poniżej 60 ms", worst < 60, worst);
    fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 1));
    try {
        const log = execFileSync(process.env.PYTHON || "python", [path.join(__dirname, "..", "tools", "ubior", "zloz_bron.py"), OUT], { encoding: "utf8" });
        console.log(log.trim());
        t.check("obrazki docs/ekwipunek (bron_*, helmy_*, zbroje_*) złożone", /bron_/.test(log) && /helmy_/.test(log) && /zbroje_/.test(log));
    } catch (e) {
        t.check("obrazki docs/ekwipunek złożone", false, String(e.message).slice(0, 300));
    }
});
