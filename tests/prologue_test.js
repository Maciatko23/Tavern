// Prolog „Ostatni prom” (Prologue.js) i nowa rozmowa dziadka (Story.js): ekran imienia z polskimi literami (klawiatura i litery na
// ekranie), zapis imienia, sceny filmu po kolei (z ruchem i rozmową z popiersiami), pominięcie sceny i całości, powrót do tytułu,
// start w domu dziadka (Map019) z nową rozmową i imieniem, wisiorek w plecaku, notatka z listem matki.
//   CDP_PORT=9470 node tests/prologue_test.js
"use strict";
const kit = require("./lib/kit.js");

kit.test({ port: 9470, errorCheck: "bez błędów w konsoli" }, async t => {
    const info = () => t.json("window.Prologue ? Prologue.info() : null");
    const typeKey = async ch => {
        await t.b.send("Input.dispatchKeyEvent", { type: "keyDown", key: ch, text: ch, unmodifiedText: ch });
        await t.b.send("Input.dispatchKeyEvent", { type: "keyUp", key: ch });
        await t.frames(3);
    };
    const backspace = async () => {
        await t.b.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
        await t.b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
        await t.frames(3);
    };
    // a key held for ms (not frames: „Nowa gra” runs DataManager.setupNewGame, which sets Graphics.frameCount back to 0)
    const keyMs = async (code, id, key, ms) => {
        await t.b.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: id, key });
        await t.wait(ms || 80);
        await t.b.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: id, key });
        await t.wait(120);
    };
    const newGameKey = () => keyMs(79, "KeyO", "o");
    const titleReady = "(SceneManager._scene instanceof Scene_Title && TitleScreen.info() && TitleScreen.info().open && TitleScreen.info().active)";
    const onName = "(Prologue.info() && Prologue.info().screen === 'name')";
    const onFilm = "(Prologue.info() && Prologue.info().screen === 'film')";
    const onMap = "(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && $gameMap.mapId() === 19)";

    t.check("wtyczka Prologue na liście, pod TitleScreen i Story", await t.eval(`(function(){ const n = $plugins.filter(p => p.status).map(p => p.name); return n.includes("Prologue") && n.indexOf("Prologue") > n.indexOf("TitleScreen") && n.indexOf("Prologue") > n.indexOf("Story"); })()`));
    t.check("wisiorek z krukiem w bazie: przedmiot kluczowy, nie na sprzedaż, ikona 437", await t.eval("(function(){ const i = $dataItems[172]; return !!i && i.name === 'Wisiorek z krukiem' && i.itypeId === 2 && i.price === 0 && !i.consumable && i.iconIndex === 437; })()"));

    // ---- 1. „Nowa gra” -> ekran imienia; P przy pustym polu wraca do tytułu
    await t.until(titleReady, 20);
    await t.frames(20);
    await newGameKey();
    t.check("„Nowa gra” otwiera ekran „Jak masz na imię?”", await t.until(onName, 15));
    let n = await info();
    t.check("na ekranie są wszystkie polskie litery", ["Ą", "Ć", "Ę", "Ł", "Ń", "Ó", "Ś", "Ź", "Ż"].every(c => n.letters.includes(c)), n.letters);
    t.check("pole na starcie puste, kursor w polu", n.name === "" && n.focus === "field", n);
    await t.frames(15);
    await backspace();   // (Backspace jak Esc / P: cofnij literę, przy pustym polu - powrót. Pierwszy Esc po O nie dochodzi do strony w przeglądarce testów)
    t.check("cofnięcie przy pustym polu wraca do tytułu", await t.until(titleReady, 15));

    // ---- 2. imię z klawiatury i z liter na ekranie
    await t.wait(400);
    await newGameKey();
    await t.until(onName, 15);
    await t.frames(20);
    for (const ch of "Łukasz") await typeKey(ch);
    t.check("pisanie z klawiatury: „Łukasz” (także Ł; w polu W/A/S/D/O/P to zwykłe litery)", (await info()).name === "Łukasz", (await info()).name);
    await typeKey("ś");
    await backspace();
    t.check("Backspace cofa literę", (await info()).name === "Łukasz", (await info()).name);
    await t.key("ArrowDown");
    n = await info();
    t.check("↓ przenosi do liter na ekranie", n.focus === "grid" && n.index === 0, n);
    await t.key("D");
    await t.key("O");
    t.check("D w prawo i O wpisuje literę z ekranu (ą - małą, bo imię już ma pierwszą literę)", (await info()).name === "Łukaszą", (await info()).name);
    await t.key("P");
    t.check("P cofa literę", (await info()).name === "Łukasz", (await info()).name);
    await t.key("Enter");
    t.check("Enter: gotowe - zaczyna się film", await t.until(onFilm, 15));
    t.check("imię zapisane w aktorze 1", (await t.eval("$gameActors.actor(1).name()")) === "Łukasz");

    // ---- 3. film po kolei (przyspieszony), z ruchem i rozmową
    await t.eval("Prologue.speed(10); 0");
    const seen = {};
    for (let i = 0; i < 900 && !(await t.eval(onMap)); i++) {
        const f = await info();
        if (f && f.screen === "film" && f.scene) {
            const s = seen[f.scene] || (seen[f.scene] = { n: 0, glow: 0, rain: 0, mist: 0, rot: 0, bubble: 0, busts: 0, hero: 0, mother: 0 });
            s.n++;
            s.glow = Math.max(s.glow, f.fx.glows); s.rain = Math.max(s.rain, f.fx.rain); s.mist = Math.max(s.mist, f.fx.mist);
            if (f.fx.rot) s.rot++;
            if (f.bubble) s.bubble++;
            if (f.busts.on) s.busts++;
            if (f.busts.speaking === "hero") s.hero++;
            if (f.busts.speaking === "matka") s.mother++;
            for (const fl of f.flags || []) {   // (the banners: a waving mesh - how far its points are from flat, sample by sample)
                s.flags = s.flags || {};
                const v = s.flags[fl.pic] || (s.flags[fl.pic] = []);
                if (v.length < 40 && !v.includes(Math.round(fl.moved))) v.push(Math.round(fl.moved));
            }
            if (f.boy) {   // (the boy on the beach: his frames, his runs, where he is)
                const b = s.boy || (s.boy = { frames: [], played: [], x0: f.boy.x, x1: f.boy.x, last: null });
                if (!b.frames.includes(f.boy.frame)) b.frames.push(f.boy.frame);
                b.played = f.boy.played; b.x0 = Math.min(b.x0, f.boy.x); b.x1 = Math.max(b.x1, f.boy.x);
                b.last = { seq: f.boy.seq, frame: f.boy.frame };
                if (f.bubble && f.boy.seq === "stand") b.thinkStanding = true;
            }
        }
        await t.frames(4);
    }
    const run = await t.json("Prologue.lastRun");
    t.check("wszystkie sceny po kolei: kronika, wieś, chata, port, sztorm, plaża", run && JSON.stringify(run.log) === JSON.stringify(["kronika", "wies", "chata", "port", "sztorm", "plaza"]) && !run.all && run.skipped === 0, run);
    t.check("wieś: ogień miga (światła na planszy), dymki nad ludźmi", seen.wies && seen.wies.glow >= 5 && seen.wies.bubble > 0, seen.wies);
    t.check("chata: rozmowa z popiersiami matki i bohatera", seen.chata && seen.chata.busts > 0 && seen.chata.mother > 0 && seen.chata.hero > 0, seen.chata);
    t.check("port: deszcz i dymki (przemytnik)", seen.port && seen.port.rain > 0 && seen.port.bubble > 0, seen.port);
    t.check("sztorm: ulewa i kołysanie pokładu", seen.sztorm && seen.sztorm.rain >= 300 && seen.sztorm.rot > 0, seen.sztorm);
    t.check("plaża: mgła i myśli bohatera", seen.plaza && seen.plaza.mist === 2 && seen.plaza.bubble > 0, seen.plaza);
    const waves = (sc, pic) => { const v = seen[sc] && seen[sc].flags && seen[sc].flags[pic]; return !!v && v.length >= 4 && Math.max(...v) > 20; };
    t.check("wieś: chorągiew Straży Pewności to osobna warstwa i powiewa (siatka wygina się co chwilę inaczej)", waves("wies", "Prolog_Wies_Flaga"), seen.wies && seen.wies.flags);
    t.check("port: flaga z okiem na maszcie powiewa", waves("port", "Prolog_Port_Flaga"), seen.port && seen.port.flags);
    const boy = seen.plaza && seen.plaza.boy, order = boy ? ["lie", "getup", "walk", "stand", "walk", "stand", "fall"].every((q, i, a) => boy.played.indexOf(q) >= 0) : false;
    t.check("plaża: chłopiec leży, wstaje, idzie, myśli stojąc, idzie dalej i pada (zmienia klatki, przesuwa się ścieżką)",
        !!boy && order && boy.played.join(",").endsWith("walk,stand,walk,stand,fall") && boy.frames.length >= 12 && boy.x1 - boy.x0 >= 150 && boy.thinkStanding && boy.last.seq === "fall" && boy.last.frame === 29, boy);
    await t.eval("Prologue.speed(1); 0");

    // ---- 4. dom dziadka: nowa rozmowa z imieniem, wisiorek, notatka z listem
    t.check("po filmie gra startuje w domu dziadka (Map019)", await t.until(onMap, 30));
    await t.eval(kit.DRIVER + "; 0");
    t.check("rozmowa dziadka zaczyna się sama", await t.until("$gameSystem._story && $gameSystem._story.intro === 1 && $gameMessage.hasText()", 20));
    const first = await t.eval("SceneManager._scene._messageWindow.convertEscapeCharacters($gameMessage.allText())");
    t.check("pierwsze słowa: rybak Janek, trzy dni gorączki, imię bohatera", /Rybak Janek/.test(first) && /Trzy dni gorączki, Łukasz/.test(first), first);
    await t.eval("(function(){ const T = window.__drv; T.on = true; T.mark = T.log.length; return 0; })()");
    t.check("rozmowa do końca (O)", await t.until("$gameSystem._story.intro === 2 && !$gameMap.isEventRunning() && !$gameMessage.isBusy()", 90));
    await t.eval("window.__drv.on = false; 0");
    const talk = await t.json("window.__drv.log.slice(window.__drv.mark).map(l => l.t).join(' / ')");
    t.check("w rozmowie: list córki, dług 2500 do dnia 60, pole, Borgar, dwór, kapuśniak, wisiorek", /Moja córka/.test(talk) && /2500/.test(talk) && /Termin: dzień 60/.test(talk) && /stawiaj na nim/.test(talk) &&
        /Borgar/.test(talk) && /Dwór Lorda/.test(talk) && /kapuśniak/.test(talk) && /wisiorek/.test(talk) && /Kruk w tej rodzinie/.test(talk), talk.slice(0, 160));
    const after = await t.json("({ pendant: $gameParty.numItems($dataItems[172]), soup: $gameParty.numItems($dataItems[131]), notes: $gameSystem._journal.notes.map(n => n.title), letter: ($gameSystem._journal.notes.find(n => n.title === 'List od matki') || {}).text || '' })");
    t.check("wisiorek z krukiem w plecaku (od startu fabuły) i kapuśniak od dziadka", after.pendant === 1 && after.soup === 1, after);
    t.check("notatka „List od matki” (Straż Pewności, Brzozowa Wola, następny prom, rybak Janek) obok notatki o długu", after.notes.includes("List od matki") && after.notes.includes("Dług dziadka Stacha") &&
        /Straż Pewności/.test(after.letter) && /Czarne Oczy/.test(after.letter) && /Brzozow/.test(after.letter) && /następnym promem/.test(after.letter) && /Janek/.test(after.letter), after.notes);

    // ---- 5. pominięcie sceny (krótkie P) i całości (przytrzymane P); puste imię = Reid
    t.check("powrót do tytułu", await t.toTitle());
    await t.until(titleReady, 20);
    await t.frames(20);
    await t.eval("(function(){ const w = SceneManager._scene._commandWindow; w.select(0); return 0; })()");
    await newGameKey();
    await t.until(onName, 15);
    await t.frames(20);
    await t.key("Enter");
    await t.until(onFilm, 15);
    t.check("puste pole: imię z bazy „Reid”", (await t.eval("$gameActors.actor(1).name()")) === "Reid");
    await t.until("Prologue.info() && Prologue.info().scene === 'kronika' && Prologue.info().step >= 1", 15);
    await t.frames(30);
    await t.key("P", 4);
    t.check("krótkie P: następna scena (wieś)", await t.until("Prologue.info() && Prologue.info().scene === 'wies'", 10), await info());
    await t.frames(40);
    await t.key("P", 90);
    t.check("przytrzymane P: pominięty cały prolog -> dom dziadka", await t.until(onMap, 30), await info());
    const run2 = await t.json("Prologue.lastRun");
    t.check("...zapisane: jedna scena pominięta, potem całość", run2 && run2.all && run2.skipped === 1 && JSON.stringify(run2.log) === JSON.stringify(["kronika", "wies"]), run2);
    t.check("...i od razu wisiorek w plecaku", (await t.eval("$gameParty.numItems($dataItems[172])")) === 1);
});
