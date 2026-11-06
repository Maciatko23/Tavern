// Próba "zaokrąglone wzgórza" (js/plugins/Wzgorza.js): działa tylko na mapach pilota (990, 13), wyłącza się przełącznikiem i jakością "Niska",
// zasłania postać za tylną krawędzią (nie na szczycie, nie przed licem), koszt klatki i wczytania mieści się w limitach (CPU 4x wolniejszy).
// Z wtyczką ze stagingu (przed instalacją): GAME_OVERLAY=tools/wzgorza/staging GAME_OVERLAY_JS=1 CDP_PORT=9413 node tests/wzgorza_test.js
"use strict";
const kit = require("./lib/kit.js");
const wejscia = require("./lib/wzgorza_wejscia.js");
const THROTTLE = 4, FRAMES = 150, RUNS = 3, FRAME_LIMIT = 0.3, LOAD_LIMIT = 40, MB_LIMIT = 16;   // (limit klatki: 0,1 ms w zamierzeniu, 0,3 na szum pomiaru)
const MEASURE = walk => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { if (!${walk}) return; const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([ups ? u / ups : 0, performance.now() - a]); u = 0; ups = 0; step();
        if (fr.length < ${FRAMES} + 20) return;
        SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false;
        const f = fr.slice(20); res(f.reduce((s, x) => s + x[0] + x[1], 0) / f.length); };
})`;
kit.test({ port: Number(process.env.CDP_PORT) || 9413, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    const loaded = await t.eval("!!window.Wzgorza");
    t.check("Wzgorza.js jest na liście wtyczek (albo w nakładce)", loaded);
    if (!loaded) return;
    const st = () => t.json("Wzgorza.stats()");
    const vis = () => t.json("!!SceneManager._scene._spriteset._wzgorza.visible");
    // 1. tylko mapy pilota
    await t.newGame({ map: 3, x: 22, y: 14, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(120);
    let s = await st();
    t.check("Kruczy Jar (nie pilot): nakładka nieaktywna, żadnych rogów", !(await t.json("Wzgorza.active()")) && s.pieces === 0, s);
    await t.go(990, 40, 18, 8);
    await t.frames(200);
    s = await st();
    t.check("Map990: aktywna, rogi wypieczone (>= 20)", (await t.json("Wzgorza.active()")) && s.baked >= 20 && s.pieces >= 20 && s.todo === 0, s);
    t.check("pamięć atlasów w limicie", s.mb <= MB_LIMIT, s);
    // 2. przełączniki
    await t.eval("window.WZGORZA = { off: true }; 0"); await t.frames(10);
    t.check("window.WZGORZA = { off: true }: wyłączona, warstwa ukryta", !(await t.json("Wzgorza.active()")) && !(await vis()));
    await t.eval("window.WZGORZA = undefined; Wzgorza.set(false); 0"); await t.frames(10);
    t.check("opcja Wył: ukryta", !(await vis()));
    await t.eval("Wzgorza.set(true); 0"); await t.frames(10);
    t.check("opcja Wł: widoczna", await vis());
    await t.eval("Wydajnosc.quality.set('low'); 0"); await t.frames(10);
    t.check('jakość "Niska": nakładka wyłączona', !(await t.json("Wzgorza.active()")) && !(await vis()));
    await t.eval("Wydajnosc.quality.set('high'); 0"); await t.frames(10);
    t.check('jakość "Wysoka": wraca', (await t.json("Wzgorza.active()")) && (await vis()));
    // 3. wchodzenie za wzgórze po MASCE krawędzi (runda 3; Map990, wzgórze z kafli na x 37-47, y 19-28; tył do 32 px, górny bok do 20 px)
    await t.eval("ConfigManager.wzgorzaLip = true; 0");
    const pos = () => t.json("({ x: $gamePlayer._realX, y: $gamePlayer._realY })");
    const place = async (x, y) => { await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer.locate(${x}, ${y}); 0`); await t.frames(10); };
    const bands = () => t.json("Wzgorza.bandsOn()");
    const fpos = async () => { const p = await pos(); return [Math.round(p.x * 48), Math.round(p.y * 48)]; };
    const stand = async () => { const [fx, fy] = await fpos(); return t.json(`({ st: Wzgorza.standing(${fx}, ${fy}), md: Wzgorza.maxDepth(${fx}, ${fy}), bad: Wzgorza.bodyBad(${fx}, ${fy}) })`); };
    await place(40, 16);
    await t.hold("down", 90); await t.frames(10);
    let sd = await stand();
    t.check("z dołu od tyłu: stopy za krawędzią (maska), głębiej niż 12 px i nie więcej niż jedna kratka (48 px); warstwa zasłaniająca włączona", sd.st === 1 && sd.md >= 12 && sd.md <= 48.5 && !sd.bad && (await bands()) >= 1, sd);
    const md1 = sd.md;
    await t.hold("down", 60); await t.frames(10);
    sd = await stand();
    t.check("dalej w dół nie wejdzie (na szczyt nie przechodzi)", sd.md <= md1 + 0.6 && sd.st === 1, { sd, md1 });
    await t.hold("up", 70); await t.frames(10);
    sd = await stand();
    t.check("a wychodzi z powrotem: stopy na zewnątrz, warstwa wyłączona (wszystko albo nic)", sd.st === 0 && (await bands()) === 0, sd);
    // bok: znajdź piksel górnej części boku (kind 2) i dolnej (kind 0, krawędź pionowa) na wzgórzu 2
    const sides = await t.json(`(() => { let up = null, low = null; for (const [tx, ty] of Wzgorza.bandTiles()) { if (tx < 36 || tx > 38) continue;
        for (let y = ty * 48; y < ty * 48 + 48; y += 4) for (let x = tx * 48; x < tx * 48 + 48; x += 2) { const s = Wzgorza.edgeState(x + 0.5, y + 0.5), w = Wzgorza.edgeState(x - 2.5, y + 0.5), e = Wzgorza.edgeState(x - 8.5, y + 0.5); if (s.inn && !w.inn && !e.inn && s.lim === 0 && !up) up = [x, y]; } }
        for (let y = 24 * 48; y < 27 * 48 && !low; y += 4) for (let x = 36 * 48; x < 38 * 48; x += 2) { const s = Wzgorza.edgeState(x + 0.5, y + 0.5), w = Wzgorza.edgeState(x - 2.5, y + 0.5); if (s.inn && s.kind === 0 && !w.inn) { low = [x, y]; break; } }
        return { up, low }; })()`);
    t.check("jest prosty bok wzgórza (dolna część)", !!sides.low, sides);
    if (sides.low) {
        await place(Math.floor(sides.low[0] / 48) - 3, Math.round((sides.low[1] - 20) / 48));
        await t.hold("right", 80); await t.frames(10);
        sd = await stand();
        t.check("z dołu od dolnej części boku: ani piksela za krawędź, bez warstwy", sd.md === 0 && (await bands()) === 0, sd);
    }
    await place(40, 23);
    await t.hold("up", 100); await t.frames(10);
    sd = await stand();
    t.check("z góry (szczyt): dochodzi do narysowanej linii, nie wychodzi za nią, nie jest zasłaniany", sd.md >= 20 && sd.md <= 30 && sd.st !== 0 && (await bands()) === 0, sd);
    // regiony gracza (Map990: 3 na kratkach tylnej krawędzi środkowego wzgórza, 2 na szczycie i licu): przejście wzdłuż pasa z lewej na prawą i z powrotem bez zatrzymania
    const walk = async (dir, fx, fy) => {
        await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer._realX = ${fx} / 48; $gamePlayer._realY = ${fy} / 48; $gamePlayer._x = Math.round(${fx} / 48); $gamePlayer._y = Math.round(${fy} / 48); 0`);
        await t.frames(6);
        let seen1 = false;
        for (let k = 0; k < 16; k++) { await t.hold(dir, 20); const q = await t.json("[Math.round($gamePlayer._realX * 48), Math.round($gamePlayer._realY * 48)]"); if ((await t.json(`Wzgorza.standing(${q[0]}, ${q[1]})`)) === 1) seen1 = true; }
        const e = await t.json("[Math.round($gamePlayer._realX * 48), Math.round($gamePlayer._realY * 48)]");
        return { x: e[0], y: e[1], zaKrawedzia: seen1 };
    };
    const reg = await t.json("(() => { const g = Wzgorza.geo(); return g.rm[19 * g.W + 40] }) ()");
    t.check("środkowe wzgórze Map990 jest w trybie regionów gracza", reg === 1, reg);
    let w1 = await walk("right", 1700, 880);
    t.check("z lewej na prawą wzdłuż pasu regionu 3 (głębokość 16 px, pas ma jedną kratkę = 48 px): bez zatrzymania, stopy bywają za krawędzią", w1.x > 2150 && w1.zaKrawedzia, w1);
    w1 = await walk("left", 2400, 880);
    t.check("z prawej na lewą wzdłuż pasu regionu 3: bez zatrzymania", w1.x < 1720 && w1.zaKrawedzia, w1);
    w1 = await walk("right", 1600, 1160);
    t.check("bok poza korytarzem (niżej niż region 3): zatrzymuje się na narysowanej linii boku, nie przed nią i nie za nią", w1.x > 1660 && w1.x < 1700 && !w1.zaKrawedzia, w1);
    w1 = await walk("right", 1700, 975);
    t.check("lewy bok pod górnym rogiem: nie wpuszcza (przejście pasem tylko od tyłu), staje na linii, nigdy za krawędzią", w1.x > 1720 && w1.x < 1760 && !w1.zaKrawedzia, w1);
    // schody (wzgórze gracza: schody w x 12-13, y 18-19): dołem wchodzi się na szczyt i schodzi z niego
    await place(12, 22);
    await t.hold("up", 160); await t.frames(10);
    let p = await pos();
    t.check("schodami wchodzi na szczyt (y < 18)", p.y < 18, p);
    await t.hold("down", 160); await t.frames(10);
    p = await pos();
    t.check("i schodami schodzi", p.y > 19.5, p);
    // przejście wzdłuż CAŁEJ tylnej i górno-bocznej krawędzi (maska pikseli): kadr z bohaterem i bez na szczycie wzgórza taki sam
    const ob = require("./lib/wzgorza_obwiednia.js");
    for (const m of [990, 991]) {
        await t.go(m, 40, 22, 2); await t.frames(60);
        for (let i = 0; i < 60 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
        const r = await ob.sprawdz(t, { krok: 12 });
        console.log("   Map" + m + ": wzdłuż krawędzi " + r.pozycje + " pozycji (maks. głębokość + co 5.), z zewnątrz " + r.naZewnatrz + ", błędów " + r.bledowLacznie);
        t.check("Map" + m + ": w żadnej pozycji za krawędzią nic bohatera (nogi, cień) nie leży na szczycie wzgórza", r.pozycje > 20 && r.bledowLacznie === 0 && r.bezWarstwy === 0, r);
        t.check("Map" + m + ": poza krawędzią (stopy na zewnątrz) warstwa jest wyłączona", r.naZewnatrzZWarstwa === 0, r);
    }
    // resztki starego obrzeża i łączenia łuków (Map990, 991, 013)
    await t.eval("window.WZGORZA_AUDIT = true; 0");
    for (const m of [990, 991, 13]) {
        await t.go(m === 13 ? 13 : m, 40, 22, 2); await t.frames(30);
        await t.newGame({ map: m, x: m === 13 ? 24 : 40, y: m === 13 ? 59 : 22, day: 12, hour: 11, quiet: true, minimap: false });
        for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
        const au = await t.json("Wzgorza.audit()");
        console.log("   Map" + m + ": rogów " + au.corners + ", resztek starego obrzeża w " + au.strays.length + " rogach, połączeń łuk-prosta " + au.joinCount + ", złych " + au.joins.length);
        t.check("Map" + m + ": po nałożeniu żaden kawałek starego obrzeża poza nową linią nie został", au.strays.length === 0, au.strays.slice(0, 5));
        t.check("Map" + m + ": w promieniu 2 kratek od łuku żadnego prostokątnego kawałka kamieni obrzeża" + (m === 13 ? " (na 013 dopuszczone 3 bloki grubych kamieni ziemnych kafli: grafika)" : ""), au.blocks.length <= (m === 13 ? 3 : 0), au.blocks.slice(0, 5));
        t.check("Map" + m + ": łączenia łuku z prostym obrzeżem (start linii, grubość, jasność) w tolerancji", au.joins.length <= Math.ceil(au.joinCount * 0.05), au.joins.slice(0, 5));
        // nikt z dołu nie wchodzi na szczyt poza schodami (ani przez rogi, ani ślizgiem), nikt ze szczytu nie schodzi (2026-11-01, błąd gracza: "przez zaokrąglone wchodzi się na wzgórze")
        if (m === 13) continue;   // (013: the walk-behind logic is off there - the map's own passability rules; only the picture is rounded)
        const wej = JSON.parse(await t.eval(wejscia(3, 60, false), 600000)), zej = JSON.parse(await t.eval(wejscia(3, 60, true), 600000));
        console.log("   Map" + m + ": wejścia z dołu: " + wej.runs + " marszów, na szczyt " + wej.fails + "; ze szczytu: " + zej.runs + " marszów, na dół " + zej.fails);
        t.check("Map" + m + ": z żadnej kratki dołu (promień 3) w 8 kierunkach, także ślizgiem, nie da się wejść na szczyt poza pasem", wej.runs > 100 && wej.movedRuns > wej.runs / 2 && wej.fails === 0, wej.sample);
        t.check("Map" + m + ": ze szczytu nie da się zejść nigdzie poza schodami", zej.fails === 0, zej.sample);
    }
    await t.eval("window.WZGORZA_AUDIT = false; 0");
    await t.go(990, 40, 22, 2); await t.frames(60);
    const ev = await t.json("(() => { const e = $gameMap._events.find(e => e && e.event() && e._characterName); return e ? e.eventId() : 0; })()");
    if (ev) {
        await t.eval(`const e = $gameMap.event(${ev}); e.setTransparent(false); e.update = function() {}; e._realX = e._x = 40; e._y = 18; e._realY = 18.6; $gamePlayer.locate(40, 24); 0`); await t.frames(40);
        t.check("inna postać (zdarzenie) w pasie za krawędzią jest zasłaniana tak samo", (await bands()) >= 1);
    }
    // 4. koszt (CPU 4x wolniejszy): wczytanie (budowa + ekran) i klatka z nakładką i bez, na 013 (największa) i 990
    const near = (x, y) => t.eval(`(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
        if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return 1; } } return 0; })()`);
    const frameCost = async label => {
        await t.frames(60);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        await t.frames(20);
        const runs = [];
        for (let r = 0; r < RUNS; r++) runs.push(await t.eval(MEASURE(true), 300000));
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const m = Math.min(...runs);
        console.log("   " + label + ": klatka (chodzenie, CPU " + THROTTLE + "x wolniejszy) " + m.toFixed(2) + " ms, serie " + runs.map(r => r.toFixed(2)).join(" / "));
        return m;
    };
    for (const [map, x, y] of [[13, 24, 59], [990, 40, 22]]) {
        const res = {};
        for (const mode of ["bez", "z"]) {
            await t.eval(`window.WZGORZA = ${mode === "bez" ? "{ off: true }" : "undefined"}; Wzgorza.redo(); 0`);
            await t.go(map === 13 ? 990 : 13, 10, 10, 2);   // (z innej mapy: czysty start)
            await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
            await t.go(map, x, y, 2);
            await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
            await near(x, y);
            await t.frames(120);
            const s0 = await st();
            res[mode] = await frameCost("Map" + map + " " + mode + " nakładki");
            if (mode === "z") {
                const load = s0.buildMs + s0.prepMs;
                console.log("   Map" + map + ": wczytanie nakładki (CPU 4x): budowa " + s0.buildMs + " ms + wypiek ekranu " + s0.prepMs + " ms; reszta " + s0.bakeMs + " ms rozłożona na klatki; rogi " + s0.corners + ", MB " + s0.mb);
                t.check("Map" + map + ": wczytanie (budowa + ekran) <= " + LOAD_LIMIT + " ms przy CPU 4x", load <= LOAD_LIMIT, s0);
                t.check("Map" + map + ": pamięć <= " + MB_LIMIT + " MB", s0.mb <= MB_LIMIT, s0);
            }
        }
        // (różnica dwóch pomiarów całej klatki ma szum 1-3 ms, więcej niż limit: sam koszt wtyczki mierzymy bezpośrednio - jej update'y, 400 wywołań, CPU 4x)
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        const own = await t.json(`(() => { const sp = SceneManager._scene._spriteset, a = sp._wzgorza, b = sp._wzgorzaLip; for (let i = 0; i < 50; i++) { a.update(); b.update(); }
            const t0 = performance.now(); for (let i = 0; i < 400; i++) { a.update(); b.update(); } return (performance.now() - t0) / 400; })()`);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        console.log("   Map" + map + ": własny koszt wtyczki na klatkę (update obu warstw, CPU 4x): " + own.toFixed(3) + " ms; różnica całych klatek " + (res.z - res.bez).toFixed(2) + " ms (szum pomiaru 1-3 ms)");
        t.check("Map" + map + ": własny koszt wtyczki na klatkę <= " + FRAME_LIMIT + " ms (CPU 4x; cel 0,1)", own <= FRAME_LIMIT, { own, res });
    }
    // 5. postać za wzgórzem, czas gry płynie (kopie świata pod pasem się odnawiają): średni koszt warstwy i jej najdłuższa klatka, CPU 4x
    // (2026-11-03: odnawianie wszystkich kawałków naraz co 0,6 s dawało klatkę 12-15 ms dwa razy na sekundę - pomiar wyżej tego nie widzi, czas w nim stoi)
    await t.eval("window.WZGORZA = undefined; Wzgorza.redo(); 0");
    await t.go(990, 40, 22, 2);
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer._wzUp = false; $gamePlayer._realX = 1700 / 48; $gamePlayer._realY = 905 / 48; $gamePlayer._x = Math.round(1700 / 48); $gamePlayer._y = Math.round(905 / 48); $gamePlayer.setDirection(6); 0`);
    await t.frames(30);
    let at = null;
    for (let k = 0; k < 200; k++) {
        await t.eval("window.__iv = setInterval(() => { Input._currentState.right = true; }, 4); 0"); await t.frames(4);
        await t.eval("clearInterval(window.__iv); Input._currentState.right = false; 0");
        at = await t.json("(() => { const x = Math.round($gamePlayer._realX * 48), y = Math.round($gamePlayer._realY * 48); return [x, y, Wzgorza.standing(x, y)]; })()");
        if (at[2] === 1 && at[0] > 1900) break;
    }
    await t.frames(30);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    await t.frames(30);
    const lm = await t.json(`new Promise(res => {
        const app = Graphics._app, rr = app.render, lip = SceneManager._scene._spriteset._wzgorzaLip, lu = lip.update, h0 = $gameSystem.dayNightHour(), ms = [];
        let l = 0;
        lip.update = function() { const a = performance.now(); lu.apply(this, arguments); l += performance.now() - a; };
        app.render = function() { rr.apply(this, arguments); ms.push(l); l = 0;
            if (ms.length < 600) return;
            lip.update = lu; app.render = rr;
            res({ hours: +($gameSystem.dayNightHour() - h0).toFixed(3), mean: +(ms.reduce((x, y) => x + y, 0) / ms.length).toFixed(3), max: +Math.max(...ms).toFixed(2), bands: Wzgorza.bandsOn() }); };
    })`);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    console.log("   za wzgórzem, czas płynie (" + lm.hours + " h gry, CPU 4x): warstwa średnio " + lm.mean + " ms, najdłużej " + lm.max + " ms");
    t.check("za wzgórzem z płynącym czasem: warstwa średnio <= " + FRAME_LIMIT + " ms, żadna jej klatka > 8 ms (CPU 4x)", at && at[2] === 1 && lm.bands > 0 && lm.hours > 0.05 && lm.mean <= FRAME_LIMIT && lm.max <= 8, { at, lm });
});
