// The graphics' quality (Wydajnosc.js, Opcje -> "Jakość grafiki", 2026-10-24 - the player: "ma być super wydajnie na średnim kompie";
// docs/WYDAJNOSC.md, "Jakość grafiki"): four choices kept in the config (ConfigManager.gfxQuality) and taken at once, without a
// restart. Wysoka is the picture as always; Średnia lighter effects (no bloom, half the grass, the rain, the birds and the
// butterflies, the night's layer at a third); Niska the fastest (no mood, no grass, no sun's shadows of the rocks and bushes, no
// shadows from the fires at night, no rays and mist, the least of the weather) - and the fires' lights stay at every level (every
// light is a fire). Automatycznie (the default) steps down a level when the frames slow down for a while, never up on the same
// map, up again after a change of map with room to spare, and a level that twice could not be kept is not tried again (no back and
// forth). The row in Opcje by the keys (A / D a level, O round, W / S over the line of text under it) in the Grafit menu. CDP_PORT=9494.
"use strict";
const kit = require("./lib/kit.js");

// the frozen frame drawn at a level (as wydajnosc_test's SAME): no clouds, no dust, no marker, no weather; the counters and Mood's
// look put back before each drawing; the grass laid again at once (GroundDetail follows gfx.version)
const DRAW = levels => `(function(){
    const W = Wydajnosc, scene = SceneManager._scene, set = scene._spriteset, app = Graphics._app, levels = ${JSON.stringify(levels)}, saved = W.quality.get();
    if (set._cloudSprites) { for (const c of set._cloudSprites) if (c.parent) c.parent.removeChild(c); set._cloudSprites.length = 0; }
    if (set._dustContainer) set._dustContainer.visible = false;
    const mk = set._targetMarker, mkUpdate = mk && mk.update;
    if (mk) { mk.update = function() {}; mk.visible = false; }
    app.ticker.stop();
    const F = Graphics.frameCount, A = set._tilemap.animationCount, sway = (set._swaySprites || []).map(s => s._phase);
    const draw = level => {
        W.quality.set(level);
        (set._swaySprites || []).forEach((s, i) => { s._phase = sway[i]; });
        for (let i = 0; i < 4; i++) { Graphics.frameCount = F; set._tilemap.animationCount = A; set.update(); if (window.Mood && Mood.snap) Mood.snap(); }
        W.settleFilters(scene);
        app.render();
        return app.renderer.extract.pixels();
    };
    const px = levels.map(draw);
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
    const out = { bytes: px[0].length, diffs: [] };
    for (let i = 1; i < px.length; i++) out.diffs.push(diff(px[0], px[i]));
    W.quality.set(saved);
    if (mk) mk.update = mkUpdate;
    app.ticker.start();
    return out;
})()`;
// what the levels switch (read on the page)
const STATE = `(function(){
    const W = Wydajnosc, set = SceneManager._scene._spriteset, M = window.Mood ? Mood.info() : null, nl = set._nightLight;
    const rocks = set._characterSprites.filter(s => s._rockPic && s._treeShadow), trees = set._characterSprites.filter(s => s._treeBody && s._treeShadow);
    return { setting: W.gfx.setting, level: W.gfx.level, version: W.gfx.version, gfx: Object.assign({}, W.gfx), grass: GroundDetail.count(), share: GroundDetail.share(),
        mood: M ? { on: M.on, enabled: M.enabled, quality: M.quality, bloom: Mood.wanted() ? +Mood.wanted().bloom.toFixed(3) : null } : null,
        rocks: rocks.length, rocksOn: rocks.filter(s => s._treeShadow.visible).length, trees: trees.length, treesOn: trees.filter(s => s._treeShadow.visible).length,
        weather: set._weather ? set._weather._sprites.length : -1, power: $gameScreen.weatherPower(),
        night: nl ? { k: nl._nightK, w: nl.bitmap.width, scale: nl.scale.x, visible: nl.visible, glow: nl._glow.visible, info: nl._nightInfo || null } : null,
        sky: set._skyFx || null, note: W.quality.note(), config: ConfigManager.gfxQuality, configAuto: ConfigManager.gfxAuto };
})()`;
// the levels' fields that are not Automatycznie's bookkeeping
const FIELDS = ["mood", "bloom", "particles", "grass", "critters", "lazyEvery", "smallShadows", "fireShadows", "nightScale", "skyFx"];
const same = (a, b) => FIELDS.every(k => a[k] === b[k]);

kit.test({ port: 9494, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const Q = await t.json("window.Wydajnosc && Wydajnosc.quality ? { levels: Wydajnosc.quality.LEVELS, names: Wydajnosc.quality.NAMES, presets: Wydajnosc.quality.PRESETS } : null");
    t.check("Wydajnosc.quality jest: Automatycznie, Wysoka, Średnia, Niska", Q && Q.levels.join() === "auto,high,medium,low" && Q.names.join() === "Automatycznie,Wysoka,Średnia,Niska", Q);
    if (!Q) return;
    const P = Q.presets;
    t.check("Wysoka = obraz jak dziś: każde pole presetu w pełni (nastrój, poświata, cienie, promienie; cząsteczki, trawa, ptaki 1; noc 1/2; dalekie co 4.)",
        P.high.mood === true && P.high.bloom === true && P.high.smallShadows === true && P.high.fireShadows === true && P.high.skyFx === true
        && P.high.particles === 1 && P.high.grass === 1 && P.high.critters === 1 && P.high.nightScale === 2 && P.high.lazyEvery === 4, P.high);
    t.check("Średnia: bez poświaty, lżejsze (trawa, cząsteczki, ptaki i motyle poniżej 1), nastrój i cienie zostają",
        P.medium.mood === true && P.medium.bloom === false && P.medium.grass < 1 && P.medium.grass > 0 && P.medium.particles < 1 && P.medium.critters < 1
        && P.medium.smallShadows === true && P.medium.fireShadows === true && P.medium.nightScale >= 2, P.medium);
    t.check("Niska: bez nastroju, bez trawy, bez cieni kamieni i od ognia, bez promieni; minimum cząsteczek",
        P.low.mood === false && P.low.bloom === false && P.low.grass === 0 && P.low.smallShadows === false && P.low.fireShadows === false && P.low.skyFx === false
        && P.low.particles > 0 && P.low.particles <= P.medium.particles && P.low.critters > 0, P.low);

    // ---------------------------------------------------------------- the config: the default, kept and read back
    const cfg = await t.json(`(function(){ const W = Wydajnosc.quality;
        ConfigManager.applyData({}); const def = { get: W.get(), level: W.level(), q: ConfigManager.gfxQuality, a: ConfigManager.gfxAuto };
        W.set("medium"); const m = ConfigManager.makeData();
        W.set("auto", { auto: "low" }); const al = ConfigManager.makeData();
        ConfigManager.applyData(al); const back = { get: W.get(), level: W.level() };
        ConfigManager.applyData({ gfxQuality: 7, gfxAuto: -2 }); const bad = { get: W.get(), level: W.level() };
        W.set("high"); return { def, m: m.gfxQuality, al: [al.gfxQuality, al.gfxAuto], back, bad, uiClean: ConfigManager.uiClean }; })()`);
    t.check("domyślnie Automatycznie na poziomie Wysoka (ConfigManager.gfxQuality 0, gfxAuto 1)", cfg.def.get === "auto" && cfg.def.level === "high" && cfg.def.q === 0 && cfg.def.a === 1, cfg.def);
    t.check("makeData zapisuje wybór (Średnia = 2) i poziom Automatycznie (Niska = 3); applyData czyta je z powrotem", cfg.m === 2 && cfg.al.join() === "0,3" && cfg.back.get === "auto" && cfg.back.level === "low", cfg);
    t.check("śmieci w zapisie -> domyślne (Automatycznie, Wysoka)", cfg.bad.get === "auto" && cfg.bad.level === "high", cfg.bad);

    // ---------------------------------------------------------------- Kruczy Jar at noon in the rain: what each level switches, at once
    t.check("nowa gra: Kruczy Jar, dzień 40, południe", await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 12, quiet: true, minimap: true }));
    await t.eval("$gameScreen.changeWeather('rain', 5, 0); 0");
    await t.frames(40);
    const at = async level => { await t.eval(`Wydajnosc.quality.set(${JSON.stringify(level)}); 0`); await t.frames(30); return t.json(STATE); };
    const hi = await at("high");
    console.log("   Wysoka:", JSON.stringify({ grass: hi.grass, weather: hi.weather, mood: hi.mood, rocks: hi.rocksOn + "/" + hi.rocks, trees: hi.treesOn + "/" + hi.trees, night: hi.night && hi.night.k }));
    t.check("Wysoka: cała trawa (ponad 1000 kępek i plam), deszcz 50 kropli (moc 5 x 10), nastrój z poświatą, cienie wszystkich kamieni i drzew, noc w 1/2 ekranu",
        hi.level === "high" && same(hi.gfx, P.high) && hi.grass > 1000 && hi.share === 1 && hi.weather === 50 && hi.mood && hi.mood.on && hi.mood.enabled && hi.mood.bloom > 0
        && hi.rocks > 50 && hi.rocksOn === hi.rocks && hi.trees > 50 && hi.treesOn === hi.trees && hi.night && hi.night.k === 2 && hi.night.w === Math.ceil(1280 / 2), hi);
    const md = await at("medium");
    console.log("   Średnia:", JSON.stringify({ grass: md.grass, weather: md.weather, mood: md.mood, rocks: md.rocksOn + "/" + md.rocks, night: md.night && md.night.k }));
    t.check("Średnia: przełączniki presetu; trawa o połowę rzadsza (ułożona od nowa od razu), 30 kropli, nastrój bez poświaty (barwy zostają), cienie kamieni zostają, noc w 1/3",
        md.level === "medium" && same(md.gfx, P.medium) && md.version === hi.version + 1 && md.grass > hi.grass * 0.4 && md.grass < hi.grass * 0.6 && md.weather === 30
        && md.mood.on && md.mood.enabled && md.mood.bloom === 0 && md.mood.quality.bloom === false && md.rocksOn === md.rocks && md.night.k === 3 && md.night.w === Math.ceil(1280 / 3), md);
    const lo = await at("low");
    console.log("   Niska:", JSON.stringify({ grass: lo.grass, weather: lo.weather, mood: lo.mood, rocks: lo.rocksOn + "/" + lo.rocks, trees: lo.treesOn + "/" + lo.trees, night: lo.night && lo.night.k }));
    t.check("Niska: przełączniki presetu; bez trawy, 15 kropli, nastrój wyłączony (filtr nieaktywny), kamienie i krzaki bez cienia - drzewa z cieniem, noc w 1/4",
        lo.level === "low" && same(lo.gfx, P.low) && lo.grass === 0 && lo.weather === 15 && lo.mood && !lo.mood.on && !lo.mood.enabled && lo.mood.quality.mood === false
        && lo.rocksOn === 0 && lo.rocks > 50 && lo.treesOn === lo.trees && lo.trees > 50 && lo.night.k === 4, lo);
    const hi2 = await at("high");
    t.check("z powrotem Wysoka: wszystko jak przedtem (trawa, deszcz, nastrój, cienie, noc)", hi2.grass === hi.grass && hi2.weather === 50 && hi2.mood.on && hi2.mood.enabled && hi2.mood.bloom > 0
        && hi2.rocksOn === hi2.rocks && hi2.night.k === 2, hi2);
    // the birds of a flyover and the butterflies wanted: fewer at Niska (never none)
    const critters = await t.json(`(function(){ const W = Wydajnosc.quality, out = {};
        for (const lv of ["high", "low"]) { W.set(lv); const f = Birds.startFlyover("sparrow"); out[lv] = { birds: f.birds.length, moths: Motyle.wanted().n }; Birds.reset(); }
        W.set("high"); return out; })()`);
    t.check("przelot wróbli: na Wysokiej 4-9 ptaków, na Niskiej około trzeciej części (co najmniej 1)", critters.high.birds >= 4 && critters.high.birds <= 9 && critters.low.birds >= 1 && critters.low.birds <= 3, critters);
    // the rays and the mist of the morning (5:30 on day 40: the sun just up - the mist thick, the rays full): none at Niska
    await t.eval("$gameScreen.changeWeather('none', 0, 0); Sky.forceMist(1); 0");
    await t.setHour(5.5);
    const mistHi = await at("high"), mistLo = await at("low");
    await at("high");
    t.check("poranna mgła (wymuszona) i promienie słońca na Wysokiej są, na Niskiej nie ma ani mgły, ani promieni", mistHi.sky && mistHi.sky.mist > 0.5 && mistHi.sky.rays > 0.5 && mistLo.sky && mistLo.sky.mist === 0 && mistLo.sky.rays === 0, { hi: mistHi.sky, lo: mistLo.sky });
    await t.eval("Sky.forceMist(0); 0");
    await t.setHour(12);
    await t.frames(30);
    // the frozen frame: Wysoka -> Niska -> Wysoka gives the same picture again; Niska and Średnia differ from it
    const frame = await t.json(DRAW(["high", "low", "high", "medium"]));
    console.log("   zamrożona klatka (różne bajty wobec Wysokiej): Niska " + frame.diffs[0] + ", Wysoka znów " + frame.diffs[1] + ", Średnia " + frame.diffs[2] + " z " + frame.bytes);
    t.check("Wysoka po Niskiej daje ten sam obraz (co najwyżej 0,05% bajtów - to, co rusza się samo); Niska i Średnia różnią się od Wysokiej wyraźnie",
        frame.diffs[1] <= frame.bytes * 0.0005 && frame.diffs[0] > frame.bytes * 0.01 && frame.diffs[2] > frame.diffs[1], frame);

    // ---------------------------------------------------------------- the harbour at night: the fires' shadows go at Niska, the lights stay
    await t.go(125, 24, 14, 2);
    await t.setHour(22);
    await t.frames(60);
    const nHi = await at("high"), nLo = await at("low"), nMd = await at("medium");
    await at("high");
    console.log("   Przystań nocą:", JSON.stringify({ high: nHi.night, low: nLo.night, medium: nMd.night }));
    t.check("Przystań 22:00, Wysoka: warstwa nocy widoczna, światła (latarnie, ognisko) i rzeczy rzucające od nich cienie", nHi.night.visible && nHi.night.info && nHi.night.info.lights >= 3 && nHi.night.info.things > 20 && nHi.night.glow, nHi.night);
    t.check("Niska: te same światła świecą (z poświatą ognia), ale nic nie rzuca od nich cieni; noc w 1/4 ekranu", nLo.night.visible && nLo.night.info.lights === nHi.night.info.lights && nLo.night.info.things === 0 && nLo.night.info.blockers === 0 && nLo.night.glow && nLo.night.k === 4, nLo.night);
    t.check("Średnia: cienie od ognia zostają, noc w 1/3 ekranu", nMd.night.info.things === nHi.night.info.things && nMd.night.k === 3 && nMd.night.w === Math.ceil(1280 / 3), nMd.night);

    // ---------------------------------------------------------------- Automatycznie: down under a slow frame, never up on the same map, up after a change, strikes
    await t.go(3, 22, 14, 2);
    await t.frames(30);
    const tuned = await t.json("Wydajnosc.quality.auto.tune({ window: 30, slow: 3, settle: 1, upWindows: 2 })");
    const defaults = { window: 60, clamp: 50, fps: 55, slow: 4, settle: 2, upWindows: 3, upFps: 58, upWork: 9, strikes: 2 };
    t.check("Automatycznie: okna, progi i serie do nastrojenia (test: krótsze okna)", tuned.window === 30 && tuned.slow === 3 && tuned.strikes === 2, tuned);
    await t.eval(`(function(){ Wydajnosc.quality.auto.reset(); Wydajnosc.quality.set("auto", { auto: "high" });
        window.__slow = 0; const um = SceneManager.updateMain; window.__um = um;
        SceneManager.updateMain = function() { um.apply(this, arguments); if (window.__slow > 0) { const a = performance.now(); while (performance.now() - a < window.__slow); } };
        return 0; })()`);
    await t.frames(40);
    const a0 = await t.json("Wydajnosc.quality.auto.state()");
    t.check("Automatycznie na Wysokiej, nic w dzienniku", a0.setting === "auto" && a0.level === "high" && a0.log.length === 0, a0);
    await t.eval("window.__slow = 30; 0");   // (every frame at least 30 ms: ~30 kl/s)
    const down1 = await t.until("Wydajnosc.quality.level() === 'medium'", 20);
    const a1 = await t.json("Wydajnosc.quality.auto.state()");
    t.check("klatka sztucznie spowolniona (~30 kl/s): po kilku oknach poziom niżej - Średnia („wolno: ... kl/s”)", down1 && a1.log.length === 1 && /^wolno/.test(a1.log[0].why) && a1.log[0].from === "high" && a1.log[0].to === "medium", a1.log);
    const down2 = await t.until("Wydajnosc.quality.level() === 'low'", 20);
    const a2 = await t.json("Wydajnosc.quality.auto.state()");
    t.check("dalej wolno: Niska (i tam koniec - niżej nie ma)", down2 && a2.log.length === 2 && a2.log[1].to === "low", a2.log);
    t.check("poziom Automatycznie zapamiętany w ustawieniach (gfxAuto = 3)", (await t.json("ConfigManager.makeData().gfxAuto")) === 3);
    await t.eval("window.__slow = 0; 0");
    await t.frames(240);   // (8 windows with room to spare)
    const a3 = await t.json("Wydajnosc.quality.auto.state()");
    t.check("klatka znów szybka, ta sama mapa: NIE wraca wyżej (bez migotania - wyżej dopiero po zmianie mapy)", a3.level === "low" && a3.downHere && a3.log.length === 2, a3);
    await t.go(8, 50, 53, 2);
    const up1 = await t.until("Wydajnosc.quality.level() === 'medium'", 15);
    const a4 = await t.json("Wydajnosc.quality.auto.state()");
    t.check("po zmianie mapy (miasteczko), gdy jest zapas: jeden poziom wyżej - Średnia („zapas: ... ms pracy”)", up1 && a4.log.length === 3 && /^zapas/.test(a4.log[2].why) && a4.log[2].to === "medium", a4.log);
    await t.frames(200);
    const a5 = await t.json("Wydajnosc.quality.auto.state()");
    t.check("na tej mapie tylko jedna próba w górę: zostaje Średnia (nie skacze dalej na Wysoką)", a5.level === "medium" && a5.upTried && a5.log.length === 3, a5);
    await t.eval("window.__slow = 30; 0");
    const down3 = await t.until("Wydajnosc.quality.level() === 'low'", 20);
    const a6 = await t.json("Wydajnosc.quality.auto.state()");
    t.check("Średnia nie utrzymała się na tej mapie: z powrotem Niska, Średnia ma 1 kreskę", down3 && a6.strikes.medium === 1 && a6.log.length === 4, { strikes: a6.strikes, log: a6.log });
    await t.eval("window.__slow = 0; 0");
    await t.go(3, 22, 14, 2);
    const up2 = await t.until("Wydajnosc.quality.level() === 'medium'", 15);
    await t.eval("window.__slow = 30; 0");
    const down4 = await t.until("Wydajnosc.quality.level() === 'low'", 20);
    const a7 = await t.json("Wydajnosc.quality.auto.state()");
    t.check("inna mapa: jeszcze raz w górę i w dół - 2 kreski", up2 && down4 && a7.strikes.medium === 2 && a7.log.length === 6, { strikes: a7.strikes });
    await t.eval("window.__slow = 0; 0");
    await t.go(8, 50, 53, 2);
    await t.frames(240);
    const a8 = await t.json("Wydajnosc.quality.auto.state()");
    t.check("po dwóch kreskach Średnia nie jest już próbowana w tej sesji: zostaje Niska mimo zapasu (koniec skakania)", a8.level === "low" && a8.log.length === 6, { level: a8.level, log: a8.log.length });
    t.check("opis pod wierszem przy Automatycznie mówi, jaki poziom gra wybrała teraz", /Teraz: Niska\.$/.test(await t.eval("Wydajnosc.quality.note()")), await t.eval("Wydajnosc.quality.note()"));
    await t.json(`(function(){ SceneManager.updateMain = window.__um; Wydajnosc.quality.auto.tune(${JSON.stringify(defaults)}); Wydajnosc.quality.auto.reset(); Wydajnosc.quality.set("auto", { auto: "high" }); return 0; })()`);

    // ---------------------------------------------------------------- Opcje by the keys: the row under Wygląd, A / D, O, the line of text passed over
    await t.go(3, 22, 14, 2);
    await t.eval("ConfigManager.uiClean = true; window.dispatchEvent(new Event('pointerdown')); 0");
    await t.frames(20);
    const info = () => t.json("MenuRing.info()");
    const key = async (k, n) => { await t.key(k); await t.frames(n || 4); return info(); };
    const inMenu = "SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()";
    await t.key("P");
    t.check("P otwiera menu", await t.until(inMenu, 10));
    await t.frames(40);
    let m = await info();
    for (let i = 0; i < 10 && m.active !== "options"; i++) m = await key("D", 12);
    m = await key("O", 6);
    t.check("Opcje: w środku, pierwsza „Wygląd”", m.level === 2 && m.options.symbol === "uiClean", m.options);
    const rows = await t.json("SceneManager._scene._views.options._win._list.map(c => c.symbol)");
    const at2 = rows.indexOf("gfxQuality");
    t.check("wiersz „Jakość grafiki” zaraz pod „Wygląd”, a pod nim wiersz opisu", at2 === rows.indexOf("uiClean") + 1 && rows[at2 + 1] === "gfxQualityNote", rows.slice(0, 5));
    const status = () => t.json("(function(){ const w = SceneManager._scene._views.options._win; return { symbol: w.currentSymbol(), text: w.statusText(w.index()), name: w.commandName(w.index()), cfg: ConfigManager.gfxQuality, level: Wydajnosc.gfx.level, note: Wydajnosc.quality.note() }; })()");
    m = await key("S");
    let s = await status();
    t.check("S: na „Jakość grafiki” - Automatycznie, opis: „Gra sama schodzi niżej... Teraz: Wysoka.”", s.symbol === "gfxQuality" && s.name === "Jakość grafiki" && s.text === "Automatycznie" && /^Gra sama schodzi/.test(s.note) && /Teraz: Wysoka\.$/.test(s.note), s);
    await key("D"); s = await status();
    t.check("D: Wysoka (zapisane w ustawieniach: 1)", s.text === "Wysoka" && s.cfg === 1 && s.level === "high" && /^Nic nie wyłącza/.test(s.note), s);
    await key("D"); s = await status();
    t.check("D: Średnia - poziom przełączony od razu (gfx.level medium), opis mówi, co wyłącza", s.text === "Średnia" && s.cfg === 2 && s.level === "medium" && /^Wyłącza poświatę/.test(s.note), s);
    await key("D"); await key("D"); s = await status();
    t.check("D, D: Niska i koniec (D nie zawija)", s.text === "Niska" && s.cfg === 3 && s.level === "low" && /^Wyłącza barwy nastroju/.test(s.note) && /Ogień świeci/.test(s.note), s);
    await key("A"); s = await status();
    t.check("A: z powrotem Średnia", s.text === "Średnia" && s.cfg === 2, s);
    await key("O"); await key("O"); s = await status();
    t.check("O, O: w kółko - Niska, potem Automatycznie", s.text === "Automatycznie" && s.cfg === 0, s);
    m = await key("S");
    t.check("S: kursor przeskakuje wiersz opisu (następna opcja, nie „gfxQualityNote”)", m.options.symbol !== "gfxQualityNote" && m.options.index === at2 + 2, m.options);
    m = await key("W");
    t.check("W: z powrotem na „Jakość grafiki” (opis pominięty)", m.options.symbol === "gfxQuality", m.options);
    await key("D"); await key("D"); s = await status();
    t.check("D, D: Średnia wybrana", s.cfg === 2, s);
    await key("P", 6);
    m = await key("P", 6);
    t.check("P, P: z powrotem na mapie", await t.until(t.onMap(3), 10));
    await t.frames(40);
    const after = await t.json(STATE);
    t.check("po wyjściu z menu: Średnia działa bez restartu (trawa o połowę, bez poświaty) i jest zapisana w pliku ustawień", after.level === "medium" && after.grass > hi.grass * 0.4 && after.grass < hi.grass * 0.6 && after.mood.bloom === 0
        && (await t.json("StorageManager.loadObject('config').then(c => c.gfxQuality)")) === 2, { level: after.level, grass: after.grass, hi: hi.grass });
    // back to the default by the keys, and the picture as always for whatever runs next
    await t.key("P");
    await t.until(inMenu, 10);
    await t.frames(30);
    m = await info();
    for (let i = 0; i < 10 && m.active !== "options"; i++) m = await key("D", 12);
    await key("O", 6);
    await key("S");
    await key("A"); await key("A"); s = await status();
    t.check("A, A: Automatycznie z powrotem (poziom Wysoka)", s.cfg === 0 && s.text === "Automatycznie" && s.level === "high", s);
    await key("P", 6);
    await key("P", 6);
    await t.until(t.onMap(3), 10);
    await t.eval("Wydajnosc.quality.set('high'); 0");
});
