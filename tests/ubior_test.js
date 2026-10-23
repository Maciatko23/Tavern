// Ubiór bohatera - pełny system (js/plugins/Ubior.js + Ubior_Data.js; obu nie ma jeszcze w js/plugins.js - test wkłada je do strony):
//   1. każdy wzór z Ubior_Data.WZORY założony osobno - wycinki z przebranych arkuszy gry: chód (dół, prawo, góra), pochodnia,
//      siekiera z boku, łuk, siedzenie, leżenie -> docs/ekwipunek/wzory_*.png (zestawienie wszystkich wzorów),
//   2. cztery pełne stroje na mapie w dzień (zrzuty z ekranu gry: chód, zamach, siedzenie) -> docs/ekwipunek/stroje_w_grze.png,
//   3. Ekwipunek w menu P (lista, 2026-10-22) w stroju -> docs/ekwipunek/karta_postaci.png,
//   4. popiersie w rozmowach w czterech strojach (i czy zestaw rozmów bierze przebrane) -> docs/ekwipunek/popiersia.png,
//   5. jazda na orle (arkusz, który bierze Orzel_Lot), czas składania, Equipment -> strój, błędy w konsoli.
//   node tests/ubior_test.js          (port CDP 9575)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "ubior");
const SHOTS = path.join(OUT, "shots");
fs.mkdirSync(SHOTS, { recursive: true });
const PLACES = ["glowa", "tors", "nogi", "stopy", "pas", "rece", "plecy"];
const NONE = Object.fromEntries(PLACES.map(p => [p, ""]));
// the views of every pattern: [label, sheet, col, row]
const VIEWS = [["chód: dół", "Hero_Walk", 3, 0], ["chód: prawo", "Hero_Walk", 3, 6], ["chód: góra", "Hero_Walk", 0, 4], ["z pochodnią", "Hero_TorchWalk", 3, 7],
    ["siekiera z boku", "Hero_AxeSide", 10, 2], ["łuk", "Hero_Bow", 14, 0], ["siedzi", "Hero_Sit", 16, 0], ["leży", "Hero_LieDown", 16, 0]];
const OUTFITS = [
    { key: "A", label: "słomkowy kapelusz, lniana koszula, płócienne spodnie, łapcie, skórzany pas",
        o: { glowa: "kapelusz_slomkowy", tors: "koszula_lniana_biala", nogi: "spodnie_plocienne_brazowe", stopy: "lapcie", pas: "pas_skorzany_braz", rece: "", plecy: "" } },
    { key: "B", label: "filcowa czapka, czerwony kaftan, wełniane spodnie, buty, rękawice, plecak",
        o: { glowa: "czapka_filc_zielona", tors: "kaftan_czerwony", nogi: "spodnie_welniane_brazowe", stopy: "buty_brazowe", pas: "", rece: "rekawice_brazowe", plecy: "plecak" } },
    { key: "C", label: "czerwona chusta, odświętna koszula, niebieskie spodnie, czarne buty, pas z sakiewką, skórzana torba",
        o: { glowa: "chusta_czerwona", tors: "koszula_odswietna", nogi: "spodnie_plocienne_niebieskie", stopy: "buty_czarne", pas: "pas_sakiewka", rece: "", plecy: "torba_skorzana" } },
    { key: "D", label: "czarna opaska, skórzana kurta, skórzane spodnie, łapcie, szare rękawice, płócienna torba",
        o: { glowa: "opaska_czarna", tors: "kurta_brazowa", nogi: "spodnie_skorzane_czarne", stopy: "lapcie", pas: "pas_skorzany_czarny", rece: "rekawice_szare", plecy: "torba_plocienna" } }
];
const WALK = [[2, 2, "chód: dół"], [6, 6, "chód: prawo"], [8, 8, "chód: góra"], [4, 4, "chód: lewo"]];
const CLIP = { left: 48, up: 80, w: 96, h: 92 };

kit.test({ port: 9575, plugins: ["Ubior_Data", "Ubior"], evalTimeout: 90000 }, async t => {
    t.check("Ubior_Data.js i Ubior.js w stronie", ["injected", "registered"].includes(t.plugins.Ubior) && ["injected", "registered"].includes(t.plugins.Ubior_Data), t.plugins);
    const ok = await t.newGame({ hour: 10, quiet: true, minimap: false });
    t.check("nowa gra", ok);
    if (!ok) return;
    const [HX, HY] = [29, 13];
    await t.eval(`(function(){ $gamePlayer.locate(${HX}, ${HY}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${HX} - 13, ${HY} - 7); return 0; })()`);
    await t.calm();
    await t.eval("(function(){ $gameScreen.clearWeather(); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); return 0; })()");
    await t.frames(40);
    t.clearErrors();
    const pats = await t.json(`(function(){ const P = Ubior.patterns(), D = Tawerna.api("Ubior_Data"); const keys = D && D.WZORY ? Object.keys(D.WZORY) : Object.keys(P);
        return keys.filter(k => P[k]).map(k => ({ key: k, miejsce: P[k].miejsce, nakladka: P[k].nakladka || "", fromData: !!(D && D.WZORY && D.WZORY[k]) })); })()`);
    t.check("wzory z Ubior_Data.js (" + pats.length + ")", pats.length >= 35 && pats.every(p => p.fromData), pats.length);
    const before = await t.eval("Ubior.stats().length");

    // ---- 1. every pattern alone, cut out of the dressed sheets
    const crop = (name, c, r) => t.eval(`(function(){ const b = Ubior.sheet(${JSON.stringify(name)}), cell = Ubior.SHEETS[${JSON.stringify(name)}].cell;
        const cv = document.createElement("canvas"); cv.width = 96; cv.height = 96; const cx = cv.getContext("2d");
        const ox = (96 - cell) / 2, oy = 96 - cell; cx.drawImage(b.canvas, ${c} * cell, ${r} * cell, cell, cell, ox, oy, cell, cell);
        return cv.toDataURL("image/png"); })()`);
    // (ready: the sheet shows exactly the outfit set now - its live copy redrawn for this key)
    const ready = (name, k) => t.until(`(function(){ const b = Ubior.sheet(${JSON.stringify(name)}); if (!b || !b.isReady()) return false;
        return ${k ? "!!b._ubiorDressed && Ubior.liveKey(" + JSON.stringify(name) + ") === Ubior.key()" : "!b._ubiorDressed"}; })()`, 20, 50);
    const meta = { views: VIEWS.map(v => v[0]), patterns: [], outfits: OUTFITS.map(o => ({ key: o.key, label: o.label })), cells: {}, shots: {} };
    let allOk = true;
    const plainRow = { key: "_bez", miejsce: "-", label: "bez stroju (łachman)" };
    for (const p of [plainRow].concat(pats)) {
        await t.eval(`Ubior.set(${JSON.stringify(p.key === "_bez" ? NONE : Object.assign({}, NONE, { [p.miejsce]: p.key }))}); 0`);
        const row = [];
        for (const [label, sheet, c, r] of VIEWS) {
            if (!(await ready(sheet, p.key !== "_bez"))) { allOk = false; row.push(null); continue; }
            const url = await crop(sheet, c, r);
            const file = `w_${p.key}_${sheet}_${c}_${r}.png`;
            fs.writeFileSync(path.join(SHOTS, file), Buffer.from(url.split(",")[1], "base64"));
            row.push(file);
        }
        meta.patterns.push({ key: p.key, miejsce: p.miejsce, nakladka: p.nakladka || "", files: row });
    }
    t.check("każdy wzór: arkusze przebrane we wszystkich ujęciach", allOk);

    // ---- 2. full outfits on the map, from the screen
    await t.eval(`(function(){ const sc = SceneManager._scene; sc.__updateMain = sc.updateMain; sc.updateMain = function(){};
        const hide = s => { s.update = function(){ this.visible = false; }; s.visible = false; };
        for (const c of sc._spriteset._cloudSprites || []) hide(c);
        const walk = o => { for (const ch of o.children || []) { if (ch.constructor && ch.constructor.name === "Sprite_TargetMarker") hide(ch); walk(ch); } };
        walk(sc._spriteset); return 0; })()`);
    const pose = o => t.eval(`(function(){ const p = $gamePlayer; p._swingEvent = null; p._toolSwing = null;
        ${o.swing ? `p.setDirection(${o.dir}); p._swingEvent = { _swingT: ${o.t}, _swingKind: ${o.kind}, opts: null, _waiting: false };`
        : `p.setDirection(${o.dir4}); p._heroDir8 = ${o.d8}; p._heroStill = 0; p._heroStep = HeroLook.STRIDE.walk * 0.3125;`} return 0; })()`);
    const look = () => t.json(`(function(){ const p = $gamePlayer, s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === p);
        const g = s.getGlobalPosition(), b = s._swingBody, sw = !!(b && b.visible), bm = sw ? b.bitmap : s.bitmap; return { x: g.x, y: g.y, swing: sw, dressed: !!(bm && bm._ubiorDressed) }; })()`);
    const clipShot = async (file, at) => {
        const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: at.x - CLIP.left, y: at.y - CLIP.up, width: CLIP.w, height: CLIP.h, scale: 1 } });
        fs.writeFileSync(path.join(SHOTS, file), Buffer.from(r.data, "base64"));
    };
    const swingT = (kind, dir) => t.eval(`(function(){ return ChoppableTree.swingKind(${kind}).impact; })()`);
    const SW = [{ kind: 3, dir: 6, label: "siekiera z boku" }, { kind: 11, dir: 2, label: "siedzi przy ognisku" }, { kind: 6, dir: 4, label: "kuca" }];
    for (const s of SW) s.t = await swingT(s.kind, s.dir);
    let screenOk = true;
    for (const of of OUTFITS) {
        await t.eval(`Ubior.set(${JSON.stringify(of.o)}); 0`);
        for (const [d8, d4, label] of WALK) {
            await pose({ d8, dir4: d4 });
            await t.frames(4);
            const at = await look();
            if (!at.dressed) screenOk = false;
            const file = `s_${of.key}_walk${d8}.png`;
            await clipShot(file, at);
            (meta.shots[of.key] = meta.shots[of.key] || []).push({ label, file });
        }
        for (const s of SW) {
            await pose({ swing: true, kind: s.kind, dir: s.dir, t: s.t });
            await t.frames(4);
            const at = await look();
            if (!at.swing || !at.dressed) screenOk = false;
            const file = `s_${of.key}_k${s.kind}.png`;
            await clipShot(file, at);
            meta.shots[of.key].push({ label: s.label, file });
        }
    }
    t.check("stroje na mapie: na każdym zrzucie przebrany arkusz", screenOk);
    await t.eval("(function(){ const sc = SceneManager._scene; sc.updateMain = sc.__updateMain; $gamePlayer._swingEvent = null; return 0; })()");

    // ---- the eagle's rider (Orzel_Lot takes Hero_Walk once and keeps it: the live sheet follows the outfit)
    const rider = await t.json(`(function(){ const b = ImageManager.loadCharacter("Hero_Walk"); Ubior.set(${JSON.stringify(OUTFITS[2].o)});
        const b2 = ImageManager.loadCharacter("Hero_Walk"); return { same: b === b2, dressed: !!b2._ubiorDressed }; })()`);
    t.check("jazda na orle: ten sam (żywy) arkusz chodu, już w nowym stroju", rider.same && rider.dressed, rider);
    {
        const url = await t.eval(`(function(){ const b = Ubior.sheet("Hero_Walk"); const cv = document.createElement("canvas"); cv.width = 32; cv.height = 36;
            cv.getContext("2d").drawImage(b.canvas, 16, 4 * 64 + 2, 32, 36, 0, 0, 32, 36); return cv.toDataURL("image/png"); })()`);
        fs.writeFileSync(path.join(SHOTS, "rider_C.png"), Buffer.from(url.split(",")[1], "base64"));
    }

    // ---- 4. the bust in four outfits (the picture the talks show), then a talk
    meta.busts = [];
    for (const of of OUTFITS) {
        await t.eval(`Ubior.set(${JSON.stringify(of.o)}); 0`);
        const want = ["glowa", "tors", "nogi", "stopy", "pas", "rece", "plecy"].map(k => (k === "glowa" || k === "tors") ? of.o[k] || "" : "").join("|");
        const okB = await t.until(`(function(){ const b = Ubior.bust(); return !!(b && b.isReady() && Ubior.bustKey() === ${JSON.stringify(want)}); })()`, 20, 100);
        await t.frames(3);
        const url = await t.eval("Ubior.bust().canvas.toDataURL('image/png')");
        const file = `bust_${of.key}.png`;
        fs.writeFileSync(path.join(SHOTS, file), Buffer.from(url.split(",")[1], "base64"));
        meta.busts.push({ key: of.key, file, ok: okB });
    }
    t.check("popiersie: przebrane w każdym stroju", meta.busts.every(b => b.ok), meta.busts.map(b => b.ok));
    await t.eval(`Ubior.set(${JSON.stringify(OUTFITS[0].o)}); 0`);
    await t.frames(5);
    // (a talk: someone's line, then the hero's - his bust on his side of the screen, from the talks' kit: Tawerna.ui.loadBust)
    // (the one speaking to him: the nearest thing on the map, so the talk is on the screen)
    const near = await t.eval(`(function(){ let best = 0, bd = 1e9; for (const e of $gameMap.events()) { const d = Math.abs(e.x - $gamePlayer.x) + Math.abs(e.y - $gamePlayer.y);
        if (d > 0 && d < bd) { bd = d; best = e.eventId(); } } return best; })()`);
    await t.run(t.cmd.text(["People3", 4], [`\\SPK[${near}]Nowy kapelusz? Pokaż się.`]).concat(t.cmd.text(null, ["\\SPK[0]Ładnie mi w nim, co?"]), t.cmd.end()), near);
    await t.frames(40);
    for (let i = 0; i < 6 && !(await t.eval("$gameMessage.allText().indexOf('Ładnie') >= 0")); i++) { await t.press("ok"); await t.frames(15); }
    await t.frames(60);
    await t.shot(path.join(SHOTS, "talk_A.png"));
    const talk = await t.json(`(function(){ const b = Ubior.bust(), kit = Tawerna.ui && Tawerna.ui.loadBust ? Tawerna.ui.loadBust("Hero_Bust") === b : null;
        const L = SceneManager._scene._talkBusts; let shown = false;
        const walk = o => { if (!o) return; if (o.bitmap === b) shown = true; for (const ch of o.children || []) walk(ch); };
        walk(L); return { kit, shown }; })()`);
    meta.talk = talk;
    t.check("popiersie w rozmowie: zestaw rozmów (Tawerna.ui.loadBust) daje przebrane popiersie", talk.kit === true, talk);
    if (!talk.shown) console.log("NOTE the bust is not on the screen in this talk (the one speaking has no bust of his own) - the picture is the dressed one");
    await t.finish();

    // ---- 3. the P menu's Ekwipunek (MenuRing.js "Lista", 2026-10-22: the whole 64 x 64 cell of the live sheet, 4 x) in outfit B
    await t.eval(`Ubior.set(${JSON.stringify(OUTFITS[1].o)}); 0`);
    await t.frames(5);
    await t.eval(`(function(){ $gameTemp._menuTab = "equip"; $gameTemp._menuLevel = 2; SceneManager.push(Scene_Menu); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Menu && SceneManager._scene._started && !SceneManager.isSceneChanging()", 20, 100);
    await t.frames(60);
    await t.shot(path.join(SHOTS, "karta_B.png"));
    const card = await t.json(`(function(){ const sc = SceneManager._scene, eq = sc._views && sc._views.equip, s = eq && eq._fig;
        return { view: !!eq, w: s && s.bitmap ? s.bitmap.width : 0, key: eq ? eq._figKey || "" : "" }; })()`);
    meta.card = card;
    t.check("Ekwipunek w menu P: figura przebrana (cała klatka arkusza, 5 ×)", card.view && card.w === 320 && /kaftan_czerwony/.test(card.key), card);
    await t.eval("SceneManager.goto(Scene_Map); 0");
    await t.until(t.onMap(3), 20);

    // ---- 5. Equipment -> outfit (an item with <Ubior:...>: the boots 113 are known without a note too)
    const eq = await t.json(`(function(){ Ubior.set(null); $gameParty.gainItem($dataItems[113], 1); const o = Ubior.outfit(); $gameParty.loseItem($dataItems[113], 1); return { stopy: o.stopy || "", after: Ubior.outfit().stopy || "" }; })()`);
    t.check("Equipment: założone skórzane buty (113) widać (buty_brazowe), wyjęte - znikają", eq.stopy === "buty_brazowe" && eq.after === "", eq);

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
        const log = execFileSync(process.env.PYTHON || "python", [path.join(__dirname, "..", "tools", "ubior", "zloz_wzory.py"), OUT], { encoding: "utf8" });
        console.log(log.trim());
        t.check("obrazki docs/ekwipunek złożone", /wzory_glowa/.test(log) && /stroje_w_grze/.test(log));
    } catch (e) {
        t.check("obrazki docs/ekwipunek złożone", false, String(e.message).slice(0, 300));
    }
});
