// Nowy świat (2026-11-14): fabuła w chatce dziadka (Map224) i wezwanie króla na podwórku przed chatką (Map218).
// Gra zaczęta w chatce jest grą nowego świata (Story.js, WORLDS.nowy): pierwsza rozmowa w łóżku małej izby, dziadek przy kotle;
// dnia 3 scena wezwania przed chatką - posłaniec, kamerdyner i straż przychodzą ścieżką, dziadek wychodzi z chatki, na koniec odchodzi.
const kit = require("./lib/kit.js");
const path = require("path");
const SHOTS = process.env.SHOTS || "";
kit.test({ port: Number(process.env.CDP_PORT) || 9396, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    // ---------------------------------------------------------------- pierwsza rozmowa
    await t.newGame({ story: true, map: 224, x: 1, y: 4, deadline: false, quiet: true, minimap: false, settle: 60 });
    const a = await t.json(`(function(){ const g = Story.npc("grandpa"), s = Tawerna.state ? null : null; return { map: $gameMap.mapId(), hero: [$gamePlayer.x, $gamePlayer.y], active: Story.active(), g: g ? [g.x, g.y] : null, run: $gameMap._interpreter.isRunning(), world: Story.state().world }; })()`);
    t.check("gra zaczęta w chatce: świat „nowy”, bohater w łóżku (1,4), dziadek w izbie, scena rozmowy idzie", a.map === 224 && a.world === "nowy" && a.hero.join() === "1,4" && !!a.g && a.run, a);
    if (SHOTS) await t.shot(path.join(SHOTS, "chatka_rozmowa.png"));
    // the talk through (OK on every message), then the hero stands beside the bed and grandpa is back at his pot
    for (let i = 0; i < 400 && (await t.json("$gameMap._interpreter.isRunning()")); i++) {
        await t.eval("Input._currentState.ok = !Input._currentState.ok; 0"); await t.frames(6);
    }
    await t.eval("Input._currentState.ok = false; 0"); await t.frames(30);
    const b = await t.json(`(function(){ const g = Story.npc("grandpa"); return { hero: [$gamePlayer.x, $gamePlayer.y], g: g ? [g.x, g.y, g.direction()] : null, intro: Story.state().intro }; })()`);
    t.check("po rozmowie: bohater obok łóżka (2,5), dziadek przy kotle (pod paleniskiem 5,4)", b.hero.join() === "2,5" && b.intro === 2 && !!b.g && Math.abs(b.g[0] - 5) <= 1 && b.g[1] >= 5 && b.g[1] <= 6, b);
    // ---------------------------------------------------------------- wezwanie króla przed chatką
    await t.setDay(3, 9);
    // (the scene's words, as the message window gets them - 2026-11-17: the king's letter, the daughter, „Dbaj o prawdę”)
    await t.eval("window.__msgs = []; if (!Game_Message.prototype.__msgWrap) { const a = Game_Message.prototype.add; Game_Message.prototype.add = function(x) { window.__msgs.push(String(x)); return a.apply(this, arguments); }; Game_Message.prototype.__msgWrap = true; } 0");
    await t.go(218, 14, 22, 8);
    const bgm0 = await t.json("(AudioManager._currentBgm || {}).name || ''");
    const started = await t.until("$gameMap._interpreter.isRunning()", 20);
    await t.frames(90);
    const c = await t.json(`(function(){ const g = $gameMap.event(3245), h = $gameMap.event(3240); const vis = e => !!e && e.characterName() !== ""; return { g: g ? [g.x, g.y, vis(g)] : null, herald: h ? [h.x, h.y, vis(h)] : null, hero: [$gamePlayer.x, $gamePlayer.y], called: Story.wezwanie().called }; })()`);
    t.check("dnia 3 przed chatką zaczyna się wezwanie: dziadek wychodzi przed drzwi (14,21), bohater obok niego (13,21)",
        started && c.called === 3 && c.g && c.g[2] && c.g[0] === 14 && c.g[1] === 21 && c.hero.join() === "13,21", c);
    if (SHOTS) await t.shot(path.join(SHOTS, "chatka_wezwanie.png"));
    let seenButler = false, seenLetter = false, bgmScene = "";
    for (let i = 0; i < 1500 && (await t.json("$gameMap._interpreter.isRunning()")); i++) {   // (the scene takes about 910 turns)
        await t.eval("Input._currentState.ok = !Input._currentState.ok; 0"); await t.frames(6);
        if (!seenLetter && SHOTS && (await t.json("window.__msgs.some(m => /łamie królewską pieczęć/.test(m)) && $gameMessage.isBusy()"))) { seenLetter = true; await t.frames(20); await t.shot(path.join(SHOTS, "chatka_wezwanie_list.png")); }
        if (!bgmScene && (await t.json("$gameMessage.isBusy()"))) bgmScene = await t.json("(AudioManager._currentBgm || {}).name || ''");
        if (!seenButler) { seenButler = await t.json("(function(){ const e = $gameMap.event(3241); return !!e && e.characterName() !== '' && e.x === 15 && e.y === 23; })()"); if (seenButler && SHOTS) await t.shot(path.join(SHOTS, "chatka_wezwanie_straz.png")); }
    }
    await t.eval("Input._currentState.ok = false; 0"); await t.frames(30);
    const d = await t.json(`(function(){ const vis = id => { const e = $gameMap.event(id); return !!e && e.characterName() !== ""; }; const w = Story.wezwanie(); return { run: $gameMap._interpreter.isRunning(), away: w.away, letter: w.letter, left: [3240, 3241, 3242, 3243, 3245].filter(vis), map: $gameMap.mapId() }; })()`);
    t.check("scena do końca: kamerdyner stanął na podwórku (15,23), dziadek odszedł (na lądzie), list do Szczepana u bohatera, nikt nie został na podwórku",
        !d.run && seenButler && d.away && d.letter && d.left.length === 0 && d.map === 218, d);
    await t.frames(200);
    const bgmAfter = await t.json("(AudioManager._currentBgm || {}).name || ''");
    t.check("muzyka: na Podgrodziu „Podgrodzie”, w scenie „Wezwanie_Dziadka”, po scenie znowu „Podgrodzie”", bgm0 === "Podgrodzie" && bgmScene === "Wezwanie_Dziadka" && bgmAfter === "Podgrodzie", { bgm0, bgmScene, bgmAfter });
    const said = await t.json("window.__msgs.join(' | ')");
    t.check("w scenie: list od króla do rąk własnych, dziadek czyta i się zgadza („pamięta przysięgę”), cieszy się na córkę, na odchodne „Dbaj o prawdę”",
        /List od Jego Królewskiej Mości/.test(said) && /łamie królewską pieczęć/.test(said) && /pamięta przysięgę/.test(said) && /Moja córka/.test(said) && /Dbaj o prawdę/.test(said) && /Zrozumiesz, kiedy przyjdzie czas/.test(said), said.slice(0, 600));
    // dusk: the seal - the hut's door does not let in
    await t.setDay(3, 20.5); await t.frames(60);
    await t.eval("$gamePlayer.locate(14, 20); $gamePlayer.setDirection(8); $gamePlayer.reserveTransfer(224, 5, 7, 8, 0); 0");
    await t.frames(60);
    const e = await t.json(`(function(){ const s = $gameMap.event(3244); return { map: $gameMap.mapId(), sealed: Story.wezwanie().sealed, sign: !!s && s.characterName() !== "", at: s ? [s.x, s.y] : null }; })()`);
    t.check("o zmierzchu chatka pod pieczęcią Lorda: znak przy drzwiach (13,20), do środka się nie wejdzie", e.sealed && e.map === 218 && e.sign && e.at.join() === "13,20", e);
});
