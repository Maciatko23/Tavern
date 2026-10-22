// Pomiar 1 (realny zegar, zwykła prędkość gry): film prologu bez pomijania, rozmowa dziadka na start, prawdziwe przejście
// dom dziadka -> pole -> tawerna (Borgar) -> dwór -> tawerna, prędkość chodu i biegu, koszt przejścia między mapami.
//   CDP_PORT=9540 node tools/pomiar_czasu/pomiar1.js        (wyniki: tools/pomiar_czasu/pomiar1.json)
// Niczego w grze nie zmienia (nowa gra w przeglądarce testów, bez zapisu).
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tests/lib/kit.js");
const WALKER = fs.readFileSync(path.join(__dirname, "walker.js"), "utf8");
const OUT = path.join(__dirname, "pomiar1.json");
const R = { when: new Date().toISOString() };
const save = () => fs.writeFileSync(OUT, JSON.stringify(R, null, 1));

(async () => {
    const t = await kit.open({ port: Number(process.env.CDP_PORT) || 9540 });
    try {
        // ---- 1. prolog: „Nowa gra” (O na tytule) -> imię (Enter = „Reid”) -> film bez pomijania -> dom dziadka
        const titleReady = "(SceneManager._scene instanceof Scene_Title && TitleScreen.info() && TitleScreen.info().open && TitleScreen.info().active)";
        await t.until(titleReady, 30);
        await t.wait(500);
        await t.b.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: 79, nativeVirtualKeyCode: 79, code: "KeyO", key: "o" });
        await t.wait(80);
        await t.b.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 79, nativeVirtualKeyCode: 79, code: "KeyO", key: "o" });
        const onName = await t.until("(Prologue.info() && Prologue.info().screen === 'name')", 20);
        await t.wait(600);
        await t.key("Enter");
        const filmOn = await t.until("(Prologue.info() && Prologue.info().screen === 'film')", 20, 50);
        const t0 = Date.now(), scenes = [];
        let last = null;
        while (Date.now() - t0 < 15 * 60 * 1000) {
            const s = await t.json("(function(){ const i = Prologue.info(); return { scene: i ? i.scene : null, map: SceneManager._scene instanceof Scene_Map && SceneManager._scene._started ? $gameMap.mapId() : 0 }; })()").catch(() => ({}));
            if (s.scene && s.scene !== last) { scenes.push([s.scene, Math.round((Date.now() - t0) / 100) / 10]); last = s.scene; }
            if (s.map === 19) break;
            await t.wait(250);
        }
        R.prolog = { onName, filmOn, sekundy: Math.round((Date.now() - t0) / 100) / 10, sceny: scenes };
        console.log("prolog:", JSON.stringify(R.prolog));
        save();

        // ---- 2. rozmowa dziadka na start (słowa i strony; O co 4 klatki - tu liczy się tekst, nie tempo)
        await t.eval(kit.DRIVER);
        await t.eval("window.__drv.on = true; 0");
        await t.until("$gameMap.isEventRunning() || $gameMessage.isBusy()", 15);
        const tt = Date.now();
        await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 120, 300);
        const talk = await t.json("window.__drv.log.map(l => l.t)");
        await t.eval("window.__drv.on = false; window.__drv.log = []; 0");
        const words = talk.reduce((a, s) => a + s.split(/\s+/).filter(w => /[a-ząćęłńóśźż]/i.test(w)).length, 0);
        R.dziadek = { strony: talk.length, slowa: words, sekundyAutomatem: Math.round((Date.now() - tt) / 100) / 10 };
        console.log("rozmowa dziadka:", JSON.stringify(R.dziadek));
        save();

        // ---- 3. prawdziwe chodzenie (8:00, wszystko, co rusza się samo, wyłączone - bez zwierząt i potrzeb)
        await t.eval("if (window.Story) { Story.setDeadlineOn(false); } 0");
        await t.setHour(8);
        await t.quiet();
        await t.eval(WALKER);
        const legs = [];
        // [mapa, cel x, cel y, bieg?, następna mapa (0 = cel na tej mapie), opis]
        const ROUTE = [
            [19, 9, 12, false, 20, "dom dziadka: izba -> drzwi"],
            [20, 14, 21, false, 21, "podwórze -> Leśna droga"],
            [21, 0, 19, false, 22, "Leśna droga -> Polna droga"],
            [22, 23, 29, false, 23, "Polna droga -> Skraj lasu"],
            [23, 0, 12, false, 3, "Skraj lasu -> pole dziadka"],
            [3, 22, 14, false, 0, "wejście na pole -> środek pola"],
            [3, 39, 12, true, 23, "pole -> Skraj lasu (bieg)"],
            [23, 23, 0, true, 22, "Skraj lasu -> Polna droga (bieg)"],
            [22, 11, 0, false, 8, "Polna droga -> miasteczko"],
            [8, 24, 16, false, 1, "miasteczko (brama płd.) -> tawerna"],
            [1, 50, 30, false, 0, "wejście tawerny -> Borgar przy ladzie"],
            [1, 49, 54, false, 8, "Borgar -> wyjście z tawerny"],
            [8, 51, 50, false, 24, "tawerna -> posiadłość Lorda"],
            [24, 20, 13, false, 0, "brama dworu -> drzwi dworu"]
        ];
        for (const [map, x, y, run, next, name] of ROUTE) {
            const cur = await t.eval("$gameMap.mapId()");
            if (cur !== map) { legs.push({ name, skip: "jestem na mapie " + cur }); console.log("SKIP", name, cur); break; }
            await t.eval("$gamePlayer._toolSwing = null; if (window.Combat && Combat.setStamina) {} $gameSystem.setStamina && $gameSystem.setStamina(100); 0");
            const from = await t.json("[$gamePlayer.x, $gamePlayer.y]");
            const dist = await t.eval(`WALK.dist(${x}, ${y})`);
            const tw = Date.now();
            await t.eval(`WALK.go(${x}, ${y}, ${run})`);
            const doneExpr = next ? t.onMap(next) + " && $gamePlayer.canMove()" : "!WALK.busy";
            const ok = await t.until(doneExpr, 240, 50);
            const ms = Date.now() - tw;
            const res = await t.json("WALK.state().res");
            const leg = { name, map, from, to: [x, y], run, dist, ok, sekundy: Math.round(ms / 100) / 10, res };
            if (dist && res && res.frames) leg.polaNaSek = Math.round(dist / (res.ms / 1000) * 100) / 100;
            legs.push(leg);
            console.log(JSON.stringify(leg));
            if (next) { await t.frames(10); await t.quiet(); await t.eval(WALKER); }
            R.drogi = legs; save();
        }
        // ---- 4. czysta prędkość: chód i bieg po prostej na polu dziadka (3 s każdy)
        await t.go(3, 10, 20, 6);
        await t.quiet();
        const sp = await t.json(`new Promise(res => {
            const p = $gamePlayer, out = {}; let phase = 0, f = 0, x0 = 0, t0 = 0;
            const tick = () => {
                if (phase === 0) { p.locate(5, 18); Input._currentState.right = true; phase = 1; f = 0; }
                else if (phase === 1 && ++f === 30) { x0 = p._realX; t0 = performance.now(); phase = 2; f = 0; }
                else if (phase === 2 && ++f === 120) { out.walk = (p._realX - x0) / ((performance.now() - t0) / 1000); Input._currentState.right = false; p.locate(5, 18); phase = 3; f = 0; }
                else if (phase === 3 && ++f === 10) { Input._currentState.right = true; Input._currentState.shift = true; phase = 4; f = 0; }
                else if (phase === 4 && ++f === 30) { x0 = p._realX; t0 = performance.now(); phase = 5; f = 0; }
                else if (phase === 5 && ++f === 120) { out.run = (p._realX - x0) / ((performance.now() - t0) / 1000); Input._currentState.right = false; Input._currentState.shift = false; out.fps = 120 / ((performance.now() - t0) / 1000); return res(out); }
                requestAnimationFrame(tick);
            };
            tick();
        })`, 30000);
        R.predkosc = sp;
        console.log("prędkość (pola/s):", JSON.stringify(sp));
        save();
    } catch (e) { console.log("ERR", e && e.stack); R.blad = String(e && e.message); save(); }
    await t.b.close();
    process.exit(0);
})();
