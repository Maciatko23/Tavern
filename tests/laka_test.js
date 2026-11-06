// „Łąka” (js/plugins/Laka.js, 2026-11-03, od 2026-11-05 na mapach wyspy): odcienie łąki, sucho przy brzegu / bujnie w głębi, kwietne łany, igliwie i wysoka trawa przy rzeczach -
// nie we wnętrzach, bez kwiatów w miasteczku, wyłącza się w Opcjach, leży pod drzewami (ich piksele bez zmian), koszt klatki, wczytania i pamięci w limitach (CPU 4x).
// Z wtyczką ze stagingu (przed instalacją): GAME_OVERLAY=tools/laka/staging GAME_OVERLAY_JS=1 CDP_PORT=9413 node tests/laka_test.js   (ZRZUTY=folder: zrzuty miejsc)
"use strict";
const kit = require("./lib/kit.js");
const THROTTLE = 4, FRAME_LIMIT = 0.1, LOAD_LIMIT = 60, MB_LIMIT = 16;
const SPOTS = [["brzeg", 44, 9], ["sosny", 22, 42], ["wzgorze", 50, 30]];
kit.test({ port: Number(process.env.CDP_PORT) || 9413, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    const loaded = await t.json("!!window.Laka");
    t.check("Laka.js jest na liście wtyczek (albo w nakładce)", loaded);
    if (!loaded) return;
    // 1. tylko mapa próbna A
    await t.newGame({ map: 1, x: 17, y: 20, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    t.check("wnętrze (tawerna): nieaktywna", !(await t.json("Laka.here()")));
    await t.eval("Laka.resetStats(); 0");
    await t.go(8, 13, 27, 2); await t.frames(60);
    let s8 = await t.json("Laka.stats()");
    t.check("miasteczko: aktywna, ale bez kwiatów", (await t.json("Laka.here()")) && s8.flowers === 0, s8);
    await t.eval("Laka.resetStats(); 0");
    await t.go(990, 22, 42, 2);
    await t.eval("$gamePlayer.setTransparent(true); 0");
    await t.frames(120);
    let s = await t.json("Laka.stats()");
    t.check("mapa próbna A: aktywna, kawałki upieczone, kwiaty i stopy drzew są", (await t.json("Laka.here()")) && s.pieces > 0 && s.flowers > 0 && s.feet > 10, s);
    t.check("pamięć w limicie (" + MB_LIMIT + " MB)", s.mb <= MB_LIMIT, s);
    const z = await t.json(`(() => { const sp = SceneManager._scene._spriteset, l = sp._laka; return { tint: l.z, deco: l._deco.z, mul: l._mul.blendMode, add: l._add.blendMode, M: PIXI.BLEND_MODES.MULTIPLY, A: PIXI.BLEND_MODES.ADD }; })()`);
    t.check("warstwy pod postaciami i cieniami (z < 1), mnożenie i dodawanie", z.tint < 1 && z.deco < 1 && z.mul === z.M && z.add === z.A, z);
    // 2. drzewa nietknięte: ten sam kadr z nakładką i bez niej - tam, gdzie jest drzewo (kadr bez drzew różni się od kadru z drzewami), piksele bez zmian
    const px = await t.json(`(() => { const app = Graphics._app, r = app.renderer, ss = SceneManager._scene._spriteset;
        const trees = ss._characterSprites.filter(s => s._character && /Pine|Tree|Big_Trees/.test(s._character.characterName()) && s.visible);
        r.render(app.stage); const a = r.extract.pixels(); window.LAKA = { off: true }; ss._laka.update(); r.render(app.stage); const b = r.extract.pixels();
        trees.forEach(s => { s._lkV = s.visible; s.visible = false; }); r.render(app.stage); const c = r.extract.pixels(); trees.forEach(s => { s.visible = s._lkV; });
        window.LAKA = undefined; ss._laka.update();
        const d3 = (x, y, i) => Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]);
        let tested = 0, bad = 0, diff = 0;
        for (let i = 0; i < a.length; i += 4) { if (d3(a, b, i) > 0) diff++; if (d3(b, c, i) > 60) { tested++; if (d3(a, b, i) > 12) bad++; } }
        return { trees: trees.length, tested, bad, diff }; })()`);
    t.check("nakładka widać na ekranie (różnica z / bez)", px.diff > 2000, px);
    t.check("drzewa nietknięte: piksele drzew bez zmian (najwyżej 0,5% - brzegi półprzezroczyste, poświata)", px.trees > 0 && px.tested > 10000 && px.bad <= px.tested * 0.005, px);
    // 3. przełącznik
    await t.eval("Laka.set(false); 0"); await t.frames(10);
    t.check("opcja Wył: ukryta", !(await t.json("SceneManager._scene._spriteset._laka.visible")));
    await t.eval("Laka.set(true); 0"); await t.frames(30);
    t.check("opcja Wł: widoczna", await t.json("SceneManager._scene._spriteset._laka.visible"));
    // 4. zrzuty miejsc z makiety (docs/laka)
    if (process.env.ZRZUTY) {
        for (const [name, x, y] of SPOTS) {
            await t.go(990, x, y, 2); await t.eval(`$gamePlayer.setTransparent(true); $gamePlayer.center(${x}, ${y}); 0`); await t.frames(420);
            await t.shot(process.env.ZRZUTY + "/" + name + ".png");
        }
    }
    // 5. koszt (CPU 4x): wejście na mapę (budowa + pieczenie ekranu) i własny koszt na klatkę
    await t.go(1, 17, 20, 2); await t.frames(30);
    await t.eval("Laka.redo(); Laka.resetStats(); 0");
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    await t.go(990, 30, 40, 2);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await t.frames(60);
    s = await t.json("Laka.stats()");
    console.log("   wejście na mapę A (CPU 4x): budowa " + s.geoMs + " ms, odcienie " + s.tintMs + " ms, kawałki " + s.baked + " w " + s.bakeMs + " ms, MB " + s.mb);
    t.check("wejście: budowa + odcienie + pieczenie ekranu <= " + LOAD_LIMIT + " ms (CPU 4x)", s.geoMs + s.tintMs + s.bakeMs <= LOAD_LIMIT, s);
    // (największa mapa: miasteczko; powrót na znaną mapę nic nie liczy od nowa)
    await t.go(1, 17, 20, 2); await t.frames(30);
    await t.eval("Laka.resetStats(); 0");
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    await t.go(990, 30, 40, 2);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await t.frames(30);
    const wr = await t.json("Laka.stats()");
    t.check("powrót na znaną mapę: odcienie nie są liczone od nowa", wr.tintMs === 0, wr);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    const own = await t.json(`(() => { const l = SceneManager._scene._spriteset._laka; for (let i = 0; i < 50; i++) l.update();
        const t0 = performance.now(); for (let i = 0; i < 400; i++) l.update(); return (performance.now() - t0) / 400; })()`);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    console.log("   własny koszt na klatkę (CPU 4x): " + own.toFixed(4) + " ms");
    t.check("własny koszt na klatkę <= " + FRAME_LIMIT + " ms (CPU 4x)", own <= FRAME_LIMIT, own);
});
