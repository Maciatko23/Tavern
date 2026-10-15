// Ekran tytułowy „Kufel przy kominku” (TitleScreen.js): tło, cztery pozycje, szare „Kontynuuj” bez zapisu i aktywne z zapisem (z
// opisem zapisu i listą zapisów), Opcje i powrót, Wyjdź, nowa gra myszą, żywe tło (iskry, płomień świecy, blask ognia, para).
//   CDP_PORT=9470 node tests/title_test.js
"use strict";
const kit = require("./lib/kit.js");

kit.test({ port: 9470, errorCheck: "bez błędów w konsoli" }, async t => {
    const info = () => t.json("window.TitleScreen ? TitleScreen.info() : null");
    const onTitle = "(SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && !SceneManager.isSceneChanging())";
    const pick = async label => {   // W/S do pozycji (prawdziwe klawisze), potem O
        for (let i = 0; i < 6; i++) {
            const s = await info();
            if (s.items[s.index].label === label) break;
            await t.key("S");
            await t.frames(4);
        }
        return (await info()).items[(await info()).index].label;
    };

    t.check("wtyczka TitleScreen jest na liście", await t.eval("$plugins.some(p => p.name === 'TitleScreen' && p.status)"));
    await t.until(`${onTitle} && TitleScreen.info() && TitleScreen.info().ready && TitleScreen.info().named`, 20);
    await t.frames(90);
    let s = await info();
    t.check("ekran tytułowy z nowym tłem (Tawerna_Title_Kufel, 1280 x 720)", !!s && /Tawerna_Title_Kufel\.png$/.test(s.image) && s.ready && s.size[0] === 1280 && s.size[1] === 720, s && s.image);
    t.check("stary ekran UITheme nie działa obok (brak jego efektów)", await t.eval("!SceneManager._scene._titleFx"));
    t.check("napis narysowany własnymi czcionkami", s.named && s.fonts.gothic === "ok" && s.fonts.serif === "ok", JSON.stringify(s.fonts));
    t.check("4 pozycje: Nowa gra, Kontynuuj, Opcje, Wyjdź", JSON.stringify(s.items.map(i => i.label)) === JSON.stringify(["Nowa gra", "Kontynuuj", "Opcje", "Wyjdź"]), s.items.map(i => i.label));
    t.check("bez zapisu „Kontynuuj” jest szare (nieaktywne) i ma podpis „brak zapisanej gry”", s.items[1].enabled === false && s.save.ok === false && /brak/.test(s.save.text), s.save);
    t.check("na starcie wybrane „Nowa gra”", s.symbol === "newGame");
    t.check("napis i menu wyłoniły się z ciemności", s.nameOpacity === 255 && s.menuOpacity === 255, [s.nameOpacity, s.menuOpacity]);

    // klawisze: S przeskakuje szare „Kontynuuj”, W wraca
    await t.key("S"); await t.frames(6);
    s = await info();
    t.check("S (w dół) przeskakuje szare „Kontynuuj” na „Opcje”", s.symbol === "options", s.symbol);
    await t.frames(20);
    t.check("miedziana kreska dojechała do „Opcje”", (await info()).barY === s.rows[2], (await info()).barY);
    await t.key("W"); await t.frames(6);
    t.check("W (w górę) wraca na „Nowa gra”", (await info()).symbol === "newGame");

    // żywe tło: kilka odczytów w odstępach
    const samples = [];
    for (let i = 0; i < 6; i++) { samples.push(await info()); await t.frames(9); }
    const differ = key => new Set(samples.map(x => JSON.stringify(key(x)))).size > 2;
    t.check("animacja biegnie (licznik klatek rośnie)", samples[5].t > samples[0].t + 30, [samples[0].t, samples[5].t]);
    t.check("iskry lecą z paleniska", samples.every(x => x.sparks > 0) && differ(x => x.sparks), samples.map(x => x.sparks));
    t.check("płomień świecy drga (jasność i wysokość)", differ(x => [x.candle.opacity, x.candle.sy]), samples.map(x => x.candle));
    t.check("blask ognia migocze, światło na ścianie faluje", differ(x => x.fire) && differ(x => x.room), samples.map(x => [x.fire, x.room]));
    t.check("para nad kociołkiem i kuflem", samples.some(x => x.steam > 0), samples.map(x => x.steam));

    // Opcje i powrót (bez ponownego wyłaniania)
    t.check("wybrane „Opcje”", (await pick("Opcje")) === "Opcje");
    await t.key("O");
    t.check("O otwiera Opcje", await t.until("SceneManager._scene instanceof Scene_Options && !SceneManager.isSceneChanging()", 10));
    await t.frames(10);
    await t.key("P");
    t.check("P wraca z Opcji na ekran tytułowy", await t.until(onTitle, 10));
    await t.frames(3);
    s = await info();
    t.check("po powrocie menu od razu widoczne, wybrane „Opcje”", s.menuOpacity === 255 && s.symbol === "options", [s.menuOpacity, s.symbol]);

    // Wyjdź: zamyka grę (tu podmienione SceneManager.exit, żeby nie zamknąć przeglądarki)
    await t.eval("window.__exit = 0; SceneManager.__exitOrig = SceneManager.exit; SceneManager.exit = function(){ window.__exit++; }; 0");
    t.check("wybrane „Wyjdź”", (await pick("Wyjdź")) === "Wyjdź");
    await t.key("Enter");
    t.check("Wyjdź: ekran gaśnie i gra się zamyka (SceneManager.exit)", await t.until("window.__exit === 1", 10));
    await t.eval("SceneManager.exit = SceneManager.__exitOrig; Window_TitleCommand._lastCommandSymbol = null; 0");

    // z zapisem: Kontynuuj aktywne, opis zapisu, lista zapisów z zaznaczonym najnowszym
    t.check("nowa gra (do zapisu)", await t.newGame({ story: true, skipIntro: true, hour: 11 }));
    const day = await t.eval("$gameSystem.dayNightDay()");
    await t.saveTo(2);
    t.check("powrót na ekran tytułowy", await t.toTitle());
    await t.until(`${onTitle} && TitleScreen.info() && TitleScreen.info().named`, 20);
    await t.frames(100);
    s = await info();
    t.check("z zapisem „Kontynuuj” jest aktywne i wybrane", s.items[1].enabled === true && s.symbol === "continue", [s.items[1], s.symbol]);
    t.check("pod „Kontynuuj” opis zapisu: dzień, pora roku, miejsce", s.save.ok && s.save.text.startsWith("Dzień " + day) && s.save.text.split(" · ").length >= 3, s.save.text);
    await t.key("O");
    t.check("Kontynuuj otwiera listę zapisów", await t.until("SceneManager._scene instanceof Scene_Load && !SceneManager.isSceneChanging()", 10));
    await t.frames(10);
    t.check("na liście zaznaczony najnowszy zapis (plik 2)", (await t.eval("SceneManager._scene.savefileId ? SceneManager._scene.savefileId() : -1")) === 2, await t.eval("SceneManager._scene.savefileId ? SceneManager._scene.savefileId() : -1"));
    await t.key("P");   // (P = „wróć”, jak w menu P; pierwszy Esc po klawiszu O nie dochodzi do strony w przeglądarce testów)
    t.check("P wraca z listy zapisów na ekran tytułowy", await t.until(onTitle, 10));
    await t.frames(5);

    // mysz: najechanie wybiera, kliknięcie „Nowa gra” zaczyna grę
    await t.until("TitleScreen.info() && TitleScreen.info().open && TitleScreen.info().active", 10);   // (the mouse works once the menu is open)
    const rows = (await info()).rows;
    await t.mouseMove(130, rows[2]);
    await t.frames(4);
    t.check("mysz nad „Opcje” je wybiera", (await info()).symbol === "options", (await info()).symbol);
    await t.mouseMove(130, rows[0]);   // (najpierw najechanie - zaznacza; kliknięcie w tej samej klatce co ruch MZ bierze tylko za wybór)
    await t.frames(6);
    t.check("mysz nad „Nowa gra” ją wybiera", (await info()).symbol === "newGame");
    // (the click by hand with waits in ms: a new game sets Graphics.frameCount back to 0, so t.click's frame waits would hang)
    await t.b.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 130, y: rows[0], button: "left", clickCount: 1 });
    await t.wait(80);
    await t.b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 130, y: rows[0], button: "left", clickCount: 1 });
    // since the prologue (Prologue.js, 2026-10-12) „Nowa gra” opens the name screen first; the film and the map are prologue_test's
    const named = await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_HeroName' && !SceneManager.isSceneChanging()", 30);
    t.check("kliknięcie „Nowa gra” zaczyna nową grę (ekran imienia przed prologiem)", named, named ? "" : await t.json("({ scene: SceneManager._scene.constructor.name, info: window.TitleScreen.info() && [TitleScreen.info().symbol, TitleScreen.info().open, TitleScreen.info().active], tx: [TouchInput.x, TouchInput.y] })"));
    t.check("w nowej grze ekran tytułowy już nie rysuje (info = null)", (await info()) === null);
});
