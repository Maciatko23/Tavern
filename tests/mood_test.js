// The picture's mood (Mood.js, user 2026-10-12): bloom, colour grading by the time / weather / place, vignette - on the world only.
// The filter is first in the map spriteset's own list and nowhere else (the HUD, the windows, the bubbles, the menus untouched - also
// checked by pixels: every opaque HUD / window pixel is the same with the effects on and off), the options (both looks: Grafit's
// menu P and the classic Window_Options; Wł / Wył, the strength, each effect), the config round trip, the kinds of places, the
// time of day (smooth, no jumps over 24 h), rain / storm / flash / winter, the breathing vignette in combat mode, and the cost
// (frame render time with the GPU finished, on / off). CDP_PORT=9489. The plugin is put into the page while it is not registered.
"use strict";
const kit = require("./lib/kit.js");

const PIXELS = String.raw`(function(){
    // the world's / the HUD's / the windows' pixels: the scene drawn into a texture with the effects on and off; a mask from the HUD
    // and the window layer drawn alone (where they are opaque the screen must not change)
    window.__px = function() {
        const sc = SceneManager._scene, r = Graphics._app.renderer, W = Graphics.width, H = Graphics.height, f = Mood.filter();
        const rt = PIXI.RenderTexture.create({ width: W, height: H });
        const grab = (obj, skip) => { r.render(obj, rt, true, null, !!skip); return r.extract.pixels(rt); };
        const was = f.enabled;
        f.enabled = true; const on = grab(sc);
        f.enabled = false; const off = grab(sc);
        f.enabled = was;
        const hud = grab(sc._hudLayer, true), win = grab(sc._windowLayer, true);
        rt.destroy(true);
        let ui = 0, uiDiff = 0, uiMax = 0, world = 0, worldDiff = 0, lumOn = 0, lumOff = 0;
        const lum = (a, i) => 0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2];
        for (let i = 0; i < on.length; i += 4) {
            const d = Math.max(Math.abs(on[i] - off[i]), Math.abs(on[i + 1] - off[i + 1]), Math.abs(on[i + 2] - off[i + 2]));
            if (hud[i + 3] === 255 || win[i + 3] === 255) { ui++; if (d > 1) uiDiff++; uiMax = Math.max(uiMax, d); }
            else if (hud[i + 3] === 0 && win[i + 3] === 0) { world++; worldDiff += d; lumOn += lum(on, i); lumOff += lum(off, i); }
        }
        const n = Math.max(1, world);
        return { ui, uiDiff, uiMax, world, worldMean: +(worldDiff / n).toFixed(2), lumOn: +(lumOn / n).toFixed(1), lumOff: +(lumOff / n).toFixed(1) };
    };
    // every display object outside the spriteset that carries the mood filter (should be none)
    window.__outside = function() {
        const sc = SceneManager._scene, out = [];
        const walk = (o, path) => { if (o === sc._spriteset) return; if ((o.filters || []).some(x => x && x._moodFilter)) out.push(path);
            (o.children || []).forEach((c, i) => walk(c, path + "/" + (c.constructor && c.constructor.name) + i)); };
        walk(sc, "scene");
        return out;
    };
    // the frame's render time with the GPU finished (render + gl.finish), for the cost
    if (!window.__perf) {
        const P = window.__perf = { on: false, r: [] }, app = Graphics._app, gl = app.renderer.gl, render = app.render.bind(app);
        app.render = function() { if (!P.on) return render(); const t0 = performance.now(); render(); gl.finish(); P.r.push(performance.now() - t0); };
    }
    return 0;
})()`;
const stats = a => { const s = a.slice().sort((x, y) => x - y), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    return { n: s.length, mean: +(s.reduce((x, y) => x + y, 0) / Math.max(1, s.length)).toFixed(3), med: +q(0.5).toFixed(3), p95: +q(0.95).toFixed(3) }; };

kit.test({ port: 9489, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", plugins: ["Mood"] }, async t => {
    t.check("wtyczka jest (wpisana albo wstrzyknięta)", ["registered", "injected"].includes(t.plugins.Mood) && (await t.eval("!!(window.Mood && Tawerna.api('Mood'))")), t.plugins);
    await t.eval("window.dispatchEvent(new Event('pointerdown')); ConfigManager.uiClean = true; 0");   // (Fullscreen.js's one-shot request used up: Esc not eaten)

    // ---------------------------------------------------------------- the options: rows, texts, the slider, greying, the config
    const rows = await t.json(`(function(){ const w = new Window_Options(new Rectangle(0, 0, 600, 400)), L = w._list.map(c => c.symbol), i = s => w.findSymbol(s);
        const r = { list: L, texts: Mood.OPT ? ["moodFx", "moodBloom", "moodGrade", "moodVignette"].map(s => w.statusText(i(s))) : [], power: w.statusText(i("moodPower")),
            gauge: w.isGaugeSymbol("moodPower"), vol: w.isVolumeSymbol("moodPower"), names: ["moodFx", "moodPower", "moodBloom", "moodGrade", "moodVignette"].map(s => w.commandName(i(s))) };
        w.changeValue("moodFx", false); r.offEnabled = ["moodBloom", "moodGrade", "moodVignette", "moodPower"].map(s => w.isCommandEnabled(i(s))); r.offText = w.statusText(i("moodFx"));
        w.changeValue("moodFx", true); r.onEnabled = ["moodBloom", "moodGrade", "moodVignette", "moodPower"].map(s => w.isCommandEnabled(i(s)));
        w.cursorLeft && (w.select(i("moodPower")), w.cursorLeft()); r.powerLeft = ConfigManager.moodPower; w.cursorRight(); r.powerBack = ConfigManager.moodPower;
        w.destroy(); return r; })()`);
    const at = rows.list.indexOf("uiClean");
    t.check("opcje: 5 wierszy zaraz pod „Wygląd” (Efekty obrazu, Siła efektów, Poświata, Barwy pory dnia, Winieta)",
        rows.list.slice(at + 1, at + 6).join() === "moodFx,moodPower,moodBloom,moodGrade,moodVignette" && rows.names.join() === "Efekty obrazu,Siła efektów,Poświata,Barwy pory dnia,Winieta", rows);
    t.check("opcje: przełączniki piszą „Wł” / „Wył”, siła to suwak 0-100% (5% na krok)", rows.texts.every(x => x === "Wł") && rows.offText === "Wył" && rows.power === "100%" && rows.gauge && rows.vol
        && rows.powerLeft === 95 && rows.powerBack === 100, rows);
    t.check("opcje: wyłączone „Efekty obrazu” wyszarzają resztę wierszy, włączone przywracają", rows.offEnabled.every(x => !x) && rows.onEnabled.every(x => x), rows);
    const cfg = await t.json(`(function(){ const c = ConfigManager.makeData(), keep = Object.assign({}, c);
        ConfigManager.applyData(Object.assign({}, c, { moodFx: false, moodPower: 40, moodBloom: false, moodGrade: true, moodVignette: false }));
        const got = [ConfigManager.moodFx, ConfigManager.moodPower, ConfigManager.moodBloom, ConfigManager.moodGrade, ConfigManager.moodVignette];
        ConfigManager.applyData(Object.assign({}, keep, { moodFx: undefined, moodPower: undefined, moodBloom: undefined, moodGrade: undefined, moodVignette: undefined }));
        const dflt = [ConfigManager.moodFx, ConfigManager.moodPower, ConfigManager.moodBloom, ConfigManager.moodGrade, ConfigManager.moodVignette];
        ConfigManager.applyData(keep); return { saved: [c.moodFx, c.moodPower, c.moodBloom, c.moodGrade, c.moodVignette], got, dflt }; })()`);
    t.check("opcje: zapis w pliku ustawień i odczyt (stary plik bez nich: domyślnie wszystko Wł, 100%)", cfg.saved.join() === "true,100,true,true,true"
        && cfg.got.join() === "false,40,false,true,false" && cfg.dflt.join() === "true,100,true,true,true", cfg);

    // ---------------------------------------------------------------- on the map: the filter on the world only
    await t.newGame({ map: 3, x: 28, y: 12, dir: 6, day: 10, hour: 12, quiet: true, minimap: false });
    // (2026-10-24) the first visit to Kruczy Jar: the map's name "Kinowy" (CleanHUD) hides the HUD behind black bars for ~5 s - the
    // HUD's pixels are counted once it is over and the HUD is back
    await t.until("!(window.CleanHUD && CleanHUD.debug() && CleanHUD.debug().name) && !$gameTemp._hudCinema", 15, 100);
    await t.frames(45);
    await t.eval(PIXELS);
    await t.frames(5);
    let info = await t.json("Mood.info()");
    t.check("mapa: filtr pierwszy na liście filtrów spritesetu mapy (przed błyskiem / ściemnieniem MZ), włączony", info.inSpriteset && info.enabled && info.kind === "outdoor", info);
    t.check("mapa: żaden element poza światem (HUD, okna, dymki, napisy) nie ma tego filtra", (await t.json("__outside()")).length === 0, await t.json("__outside()"));
    await t.run(t.cmd.text(null, ["Próba okna wiadomości nad światem."]));
    await t.until("SceneManager._scene._messageWindow.isOpen()", 5);
    await t.frames(10);
    let px = await t.json("__px()");
    t.check("piksele: każdy nieprzezroczysty piksel HUD-u i okna wiadomości jest taki sam z efektami i bez", px.ui > 2000 && px.uiDiff === 0, px);
    await t.finish();
    await t.setHour(23);
    await t.eval("Mood.snap(); 0");
    px = await t.json("__px()");
    t.check("piksele: świat nocą się zmienia (średnio > 2/255 na piksel), HUD nie", px.worldMean > 2 && px.uiDiff === 0, px);

    // ---------------------------------------------------------------- the time of day: what it asks, smoothly
    const look = h => t.json(`(function(){ $gameSystem.setDayNightHour(${h}); const l = Mood.target().look; return l; })()`);
    const noon = await look(12), golden = await look(19.95), night = await look(23.5), morning = await look(7.5);
    t.check("pora dnia: w południe prawie nic (winieta ≤ 0,25, poświata ≤ 0,3, nasycenie ~1)", noon.vig <= 0.25 && noon.bloom <= 0.3 && Math.abs(noon.satHi - 1) < 0.1, noon);
    t.check("pora dnia: złota godzina cieplejsza w światłach i chłodniejsza w cieniach niż południe", golden.high[0] > noon.high[0] && golden.high[2] < noon.high[2] && golden.shadow[2] > noon.shadow[2], { golden, noon });
    t.check("pora dnia: noc niebieska w ciemnych, ogień ciepły w jasnych, silna poświata i ciemne rogi", night.shadow[2] > 1.1 && night.high[0] > 1 && night.high[2] < 1 && night.bloom >= 1 && night.vig >= 0.4, night);
    t.check("pora dnia: poranek chłodniejszy w cieniach niż popołudnie", morning.shadow[2] > (await look(16)).shadow[2], morning);
    const sweep = await t.json(`(function(){ const K = ["vig", "bloom", "satLo", "satHi", "con"], max = {}, d0 = $gameSystem._dayNightDay;
        for (const day of [10, 38, 66, 94]) { $gameSystem._dayNightDay = day; let last = null;
            for (let h = 0; h <= 24.001; h += 0.05) { $gameSystem.setDayNightHour(h % 24); const l = Mood.target().look;
                if (last) for (const k of K) max[k] = Math.max(max[k] || 0, Math.abs(l[k] - last[k]));
                for (const k of ["shadow", "high"]) for (let i = 0; i < 3; i++) if (last) max[k] = Math.max(max[k] || 0, Math.abs(l[k][i] - last[k][i]));
                last = l; } }
        $gameSystem._dayNightDay = d0; $gameSystem.setDayNightHour(23); return max; })()`);
    t.check("pora dnia: przez całą dobę (co 3 minuty, w każdej porze roku) bez skoków", Object.values(sweep).every(v => v < 0.1), sweep);
    await t.setHour(12);
    await t.eval("Mood.snap(); 0");
    const v0 = await t.json("SceneManager._scene._spriteset._moodCur.vig");
    await t.setHour(23);
    const want = await t.json("Mood.wanted().vig");
    await t.frames(2);
    const v1 = await t.json("SceneManager._scene._spriteset._moodCur.vig");
    await t.frames(150);
    const v2 = await t.json("SceneManager._scene._spriteset._moodCur.vig");
    const step = (v1 - v0) / (want - v0);
    t.check("przejścia: skok godziny wchodzi płynnie (po 2 klatkach 2-25% drogi, po 150 u celu)", step > 0.02 && step < 0.25 && Math.abs(v2 - want) < 0.01, { v0, v1, v2, want, step });

    // ---------------------------------------------------------------- the weather and the season
    const wx = await t.json(`(function(){ $gameSystem.setDayNightHour(15); const clear = Mood.target().look;
        $gameScreen.changeWeather("rain", 5, 0); const rain = Mood.target().look;
        Storm.state.level = 0.9; const storm = Mood.target().look; Storm.state.level = 0;
        const f0 = Storm.state.flash; Storm.state.flash = 1; const flash = Mood.target().look; Storm.state.flash = f0;
        $gameScreen.changeWeather("none", 0, 0);
        const d0 = $gameSystem._dayNightDay; $gameSystem._dayNightDay = 94; const winter = Mood.target().look; $gameSystem._dayNightDay = d0;
        return { clear, rain, storm, flash, winter }; })()`);
    t.check("pogoda: deszcz przygasza barwy (nasycenie -20% i więcej) i dodaje szarej mgiełki", wx.rain.satLo < wx.clear.satLo * 0.8 && wx.rain.lift[2] > wx.clear.lift[2] + 0.01, { clear: wx.clear.satLo, rain: wx.rain.satLo });
    t.check("pogoda: burza jeszcze szarsza, z mocniejszym kontrastem i ciemniejszymi rogami", wx.storm.satLo < wx.rain.satLo && wx.storm.con > wx.rain.con && wx.storm.vig > wx.rain.vig + 0.05, wx.storm);
    t.check("pogoda: błysk pioruna gasi poświatę (błysk sam jest światłem)", wx.flash.bloom < 0.02 && wx.storm.bloom >= 0, { flash: wx.flash.bloom });
    t.check("zima: bledsza (mniej nasycona, jaśniejsza mgiełka) i chłodniejsza w cieniach", wx.winter.satLo < wx.clear.satLo * 0.85 && wx.winter.lift[2] > wx.clear.lift[2] + 0.02 && wx.winter.shadow[2] > wx.clear.shadow[2], wx.winter);

    // ---------------------------------------------------------------- the options on the picture
    await t.setHour(23);
    await t.eval("Mood.snap(); 0");
    const full = await t.json("Mood.wanted()");
    const opt = async (o) => t.json(`(function(){ const keep = Object.assign({}, Mood.info().options); Object.assign(ConfigManager, ${JSON.stringify(o)});
        const w = Mood.wanted(); Mood.snap(); const u = Mood.filter().uniforms, r = { w, en: Mood.filter().enabled, uVig: Array.from(u.uVig) }; Object.assign(ConfigManager, keep); Mood.snap(); return r; })()`);
    const half = await opt({ moodPower: 50 }), noBloom = await opt({ moodBloom: false }), noVig = await opt({ moodVignette: false }), noGrade = await opt({ moodGrade: false }), off = await opt({ moodFx: false });
    t.check("siła 50%: winieta i poświata o połowę, barwy w pół drogi", Math.abs(half.w.vig - full.vig / 2) < 0.01 && Math.abs(half.w.bloom - full.bloom / 2) < 0.01 && Math.abs(half.w.satLo - (1 + full.satLo) / 2) < 0.01, { half: half.w, full });
    t.check("osobno: Poświata Wył = zero poświaty w filtrze", noBloom.w.bloom === 0 && noBloom.uVig[3] === 0 && noBloom.en, noBloom.uVig);
    t.check("osobno: Winieta Wył = zero winiety", noVig.w.vig === 0 && noVig.uVig[0] === 0, noVig.uVig);
    t.check("osobno: Barwy Wył = obraz bez korekcji (nasycenie, kontrast, balans = 1)", noGrade.w.satLo === 1 && noGrade.w.con === 1 && noGrade.w.shadow.every(v => v === 1), noGrade.w);
    t.check("Efekty obrazu Wył: filtr wyłączony (zero kosztu)", off.w === null && off.en === false, off);

    // ---------------------------------------------------------------- combat mode: the vignette breathes
    const base = await t.json("SceneManager._scene._spriteset._mood.vig");
    await t.eval("$gameSystem._combatMode = true; 0");
    await t.frames(60);
    const samples = [];
    for (let i = 0; i < 16; i++) { samples.push(await t.json("SceneManager._scene._spriteset._mood.vig")); await t.frames(6); }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length, spread = Math.max(...samples) - Math.min(...samples);
    t.check("walka: winieta mocniejsza i pulsuje (wahanie ≥ 0,04)", mean > base + 0.08 && spread >= 0.04, { base, mean, spread, samples });
    await t.eval("$gameSystem._combatMode = false; 0");
    await t.frames(150);
    const after = await t.json("SceneManager._scene._spriteset._mood.vig");
    t.check("walka: po wyjściu z trybu walki winieta wraca do zwykłej", Math.abs(after - base) < 0.01, { base, after });

    // ---------------------------------------------------------------- the cost: a night with a campfire and the torch's light (the heaviest)
    await t.eval(`(function(){ $gamePlayer.updateScroll = function(){}; $gameMap.setDisplayPos(13.4, 4); const F = $gameSystem._farm, L = (F.buildings[$gameMap.mapId()] = F.buildings[$gameMap.mapId()] || []);
        L.length = 0; L.push({ id: F.nextId++, type: "campfire", x: 31, y: 11, last: 1 }); F.rev++; return 0; })()`);
    await t.frames(30);
    const res = { on: [], off: [] };
    for (let rep = 0; rep < 3; rep++) for (const mode of ["off", "on"]) {
        await t.eval(`ConfigManager.moodFx = ${mode === "on"}; 0`);
        await t.frames(15);
        await t.eval("__perf.r = []; __perf.on = true; 0");
        await t.frames(150);
        res[mode] = res[mode].concat(await t.json("(function(){ __perf.on = false; return __perf.r; })()"));
    }
    await t.eval("ConfigManager.moodFx = true; 0");
    const f0 = await t.eval("Graphics.frameCount"), tt = Date.now();
    await t.wait(3000);
    const fps = ((await t.eval("Graphics.frameCount")) - f0) / ((Date.now() - tt) / 1000);
    const so = stats(res.on), sf = stats(res.off);
    console.log("COST frame render+GPU (ms): off " + JSON.stringify(sf) + " on " + JSON.stringify(so) + " fps(on) " + fps.toFixed(1));
    t.check("koszt: efekty dokładają < 1 ms na klatkę (średnio i w 95%), 60 kl./s się trzyma", so.mean - sf.mean < 1 && so.p95 - sf.p95 < 1.5 && fps >= 55, { off: sf, on: so, fps });

    // ---------------------------------------------------------------- the kinds of places
    const kindAt = async (map, x, y) => { await t.go(map, x, y, 8); await t.frames(5); return t.json("Mood.info()"); };
    const tav = await kindAt(1, 50, 31);
    t.check("miejsca: tawerna = wnętrze (ciepło-bursztynowe: jasne cieplejsze)", tav.kind === "interior" && tav.cur && tav.cur.high[0] > 1.03 && tav.cur.high[2] < 0.95 && tav.inSpriteset, tav.kind);
    const cave = await kindAt(14, 18, 18);
    t.check("miejsca: Jaskinia = jaskinia (mocniejsza winieta niż w tawernie)", cave.kind === "cave" && cave.cur.vig > tav.cur.vig, { kind: cave.kind, vig: cave.cur && cave.cur.vig });
    const deep = await kindAt(11, 15, 12);
    t.check("miejsca: Komnata Serca = podziemia (zielonkawe cienie, najmocniejsza winieta)", deep.kind === "underground" && deep.cur.shadow[1] > deep.cur.shadow[0] && deep.cur.vig > cave.cur.vig, { kind: deep.kind, cur: deep.cur });
    const offTag = await t.json(`(function(){ const n = $dataMap.note; $dataMap.note = n + " <Mood:off>"; Mood.refresh(); SceneManager._scene._spriteset.updateMood();
        const r = Mood.info(); $dataMap.note = n; Mood.refresh(); SceneManager._scene._spriteset.updateMood(); return { kind: r.kind, en: r.enabled, back: Mood.info().enabled }; })()`);
    t.check("miejsca: <Mood:off> w notatce mapy wyłącza efekty na tej mapie", offTag.kind === "off" && offTag.en === false && offTag.back === true, offTag);
    // the Dark Forest (Map012, user 2026-10-12): darker, muted, colder, green-livid darks, heavy corners also by day; lights warm, a torch glows
    const dfNight = await kindAt(12, 12, 10);
    const outNight = await t.json(`(function(){ const n = $dataMap.note; $dataMap.note = n + " <Mood:outdoor>"; Mood.refresh(); const l = Mood.wanted(); $dataMap.note = n; Mood.refresh(); return l; })()`);
    t.check("Mroczny Las: mapa 12 rozpoznana sama (bez tagu, mapa nietknięta)", dfNight.kind === "darkforest" && (await t.eval("!/Mood/.test($dataMap.note)")), dfNight.kind);
    t.check("Mroczny Las nocą: winieta mocniejsza niż w zwykłym lesie, ogień ciepły, poświata pochodni jak wszędzie", dfNight.cur.vig >= outNight.vig + 0.15 && dfNight.cur.high[0] > 1 && dfNight.cur.high[2] < 1
        && dfNight.cur.bloom >= outNight.bloom, { df: { vig: dfNight.cur.vig, high: dfNight.cur.high, bloom: dfNight.cur.bloom }, out: { vig: outNight.vig, bloom: outNight.bloom } });
    await t.setHour(12);
    await t.eval("Mood.snap(); 0");
    await t.frames(30);   // (the night layer redrawn for the day)
    const dfDay = await t.json("Mood.info().cur");
    const outDay = await t.json(`(function(){ const n = $dataMap.note; $dataMap.note = n + " <Mood:outdoor>"; Mood.refresh(); const l = Mood.wanted(); $dataMap.note = n; Mood.refresh(); return l; })()`);
    t.check("Mroczny Las w dzień: stłumiony (nasycenie ciemnych < 75% zwykłego lasu), ciemniejszy, mocna winieta (≥ 0,45)", dfDay.satLo < outDay.satLo * 0.75 && dfDay.gain < 1 && dfDay.vig >= 0.45 && outDay.vig < 0.3, { df: dfDay, out: { satLo: outDay.satLo, vig: outDay.vig } });
    t.check("Mroczny Las w dzień: cienie zielonkawo-sine (czerwień najbardziej ściszona), liście i trawa liczone jako ciemne tony, jasne ciepłe", dfDay.shadow[0] < dfDay.shadow[1] && dfDay.shadow[0] < dfDay.shadow[2]
        && dfDay.shadow[0] < outDay.shadow[0] - 0.2 && dfDay.lift[2] > dfDay.lift[0] && dfDay.split[2] > 0.25 && dfDay.high[0] > dfDay.high[2] && dfDay.bloom >= 0.5, { shadow: dfDay.shadow, lift: dfDay.lift, split: dfDay.split, high: dfDay.high, bloom: dfDay.bloom });
    px = await t.json("__px()");
    t.check("Mroczny Las w dzień: świat na ekranie wyraźnie ciemniejszy niż bez efektów, HUD bez zmian", px.lumOn < px.lumOff * 0.88 && px.uiDiff === 0, px);
    const dfTag = await t.json(`(function(){ const n = $dataMap.note; $dataMap.note = n + " <Mood:darkforest>"; const k = Mood.refresh(); $dataMap.note = n; Mood.refresh(); return k; })()`);
    await t.go(3, 28, 12, 2);
    const dfTag3 = await t.json(`(function(){ const n = $dataMap.note; $dataMap.note = n + " <Mood:darkforest>"; const k = Mood.refresh(); $dataMap.note = n; const back = Mood.refresh(); return { k, back }; })()`);
    t.check("Mroczny Las: tag <Mood:darkforest> działa też na innej mapie (Map003), bez niego zwykły las", dfTag === "darkforest" && dfTag3.k === "darkforest" && dfTag3.back === "outdoor", { dfTag, dfTag3 });
    await t.setHour(23);
    t.check("po przejściach między mapami filtr dalej tylko w świecie", (await t.json("__outside()")).length === 0 && (await t.json("Mood.info().inSpriteset")));

    // ---------------------------------------------------------------- the options in both looks: Grafit (menu P -> Opcje) and Klasyczny
    await t.go(3, 28, 12, 2);
    const inMenu = "SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()";
    await t.key("P");
    t.check("Grafit: P otwiera menu", await t.until(inMenu, 10));
    await t.frames(40);
    // (the menu's tabs since 2026-10-23: A / D along them - Postać, Ekwipunek, Umiejętności, Plecak, Dziennik, Opcje -, then O into Opcje)
    for (let i = 0; i < 5; i++) { await t.key("D"); await t.frames(12); }
    await t.key("O");
    await t.frames(6);
    const grafit = await t.json(`(function(){ const w = SceneManager._scene._views && SceneManager._scene._views.options && SceneManager._scene._views.options._win; if (!w) return null;
        const CH = Tawerna.api("CleanHUD"), texts = [], keep = CH.textOut; CH.textOut = function(b, text) { texts.push(String(text)); return keep.apply(this, arguments); };
        w.select(w.findSymbol("moodFx")); w.refresh(); CH.textOut = keep; return { active: MenuRing.info().active, sym: w.currentSymbol(), texts }; })()`);
    t.check("Grafit: zakładka Opcje ma „Efekty obrazu: Wł” (napis w stylu Grafit)", grafit && grafit.active === "options" && grafit.sym === "moodFx" && grafit.texts.includes("Efekty obrazu") && grafit.texts.includes("Wł") && !grafit.texts.includes("Tak"), grafit);
    await t.key("Enter");
    await t.frames(6);
    t.check("Grafit: Enter przełącza „Efekty obrazu” na Wył", (await t.eval("ConfigManager.moodFx")) === false);
    await t.key("Enter");
    await t.frames(6);
    t.check("Grafit: drugi Enter z powrotem Wł", (await t.eval("ConfigManager.moodFx")) === true);
    await t.key("Escape");   // (out of Opcje onto the menu's list, then out of the menu)
    await t.frames(8);
    await t.key("Escape");
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 10);
    await t.frames(20);
    await t.eval("ConfigManager.uiClean = false; SceneManager.push(Scene_Options); 0");
    await t.until("SceneManager._scene instanceof Scene_Options && SceneManager._scene._started", 10);
    await t.frames(10);
    const classic = await t.json(`(function(){ const w = SceneManager._scene._optionsWindow, drawn = [], keep = w.drawText; w.drawText = function(text) { drawn.push(String(text)); return keep.apply(this, arguments); };
        w.refresh(); w.drawText = keep; const i = w.findSymbol("moodFx"); return { i, status: w.statusText(i), drawn }; })()`);
    t.check("Klasyczny: okno Opcji ma „Efekty obrazu: Wł”, „Siła efektów: 100%”", classic.i >= 0 && classic.status === "Wł" && classic.drawn.includes("Efekty obrazu") && classic.drawn.includes("Wł") && classic.drawn.includes("100%"), classic);
    await t.eval("SceneManager.pop(); ConfigManager.uiClean = true; 0");
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 10);
    await t.frames(10);
    t.check("po menu: efekty dalej na mapie", (await t.json("Mood.info()")).enabled);
});
