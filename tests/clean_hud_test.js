// "Czysty widok" (CleanHUD.js, CleanHUD_Compass.js, MenuRing.js; the user's choice 2026-10-08, mock-ups docs/ui_pomysly/pomysl_4_*):
// the HUD without panels on the map - the parts in their corners, the old parts working but not drawn, the round goal compass in the
// top right corner (the goal on this map and on another one, through the exits) with the load and the minimap under it, the goal's
// title only, the gains, no bars under the hero and no experience line (the user, 2026-10-08), the breath as a fifth bar in the combat
// mode, the thoughts over the hero, the fade under him, the minimap on M; the P menu as a ring; the option "Wygląd" back to the
// classic look and again. CDP_PORT=9486.
// The plugins are put into the page while they are not in js/plugins.js yet.
"use strict";
const path = require("path");
const kit = require("./lib/kit.js");

kit.test({ port: 9486, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", plugins: ["CleanHUD", "CleanHUD_Compass", "MenuRing"] }, async t => {
    t.check("wtyczki wczytane", ["CleanHUD", "CleanHUD_Compass", "MenuRing"].every(n => t.plugins[n] === "injected" || t.plugins[n] === "registered"), t.plugins);
    t.check("czysty widok jest domyślny", await t.eval("ConfigManager.uiClean === true && CleanHUD.lookClean()"));
    const ok = await t.newGame({ story: true, skipIntro: true, hour: 10, quiet: true });
    t.check("nowa gra w domu dziadka", ok && (await t.eval("$gameMap.mapId()")) === 19);
    await t.frames(30);
    const dbg = () => t.json("CleanHUD.debug()");

    // ---------------------------------------------------------------- the parts in their places, the old ones not drawn
    let d = await dbg();
    const P = d.parts;
    t.check("lewy górny róg: godzina i cel", P.clock.visible && P.clock.x < 20 && P.clock.y < 20 && P.clock.h > 70, P.clock);
    t.check("cel: sam tytuł, bez drugiej linii (opis zostaje w dzienniku)", P.clock.h <= 112 && !!d.goal && !!d.goal.line, { h: P.clock.h, line: d.goal && d.goal.line });
    const cmp0 = await t.json("CleanCompass.info()");
    t.check("prawy górny róg: okrągły kompas", P.compass.visible && cmp0.centre.x > 1150 && cmp0.centre.y < 80 && P.compass.x + P.compass.w <= 1280 && P.compass.y >= 0, { box: P.compass, c: cmp0.centre });
    t.check("obciążenie pod kompasem (nie nachodzi na niego)", P.load.visible && P.load.x > 1100 && P.load.y >= cmp0.centre.y + cmp0.centre.r && P.load.y >= P.compass.y + P.compass.h - 2, { load: P.load, compass: P.compass });
    t.check("lewy dolny róg: paski potrzeb", P.needs.visible && P.needs.x < 30 && P.needs.y > 600, P.needs);
    t.check("bez paska doświadczenia (stary nierysowany, nowego nie ma)", !d.parts.xp && d.old.xpBar === false && !(await t.eval("!!SceneManager._scene._cleanXp")), d.old.xpBar);
    t.check("stare części działają, ale nie są rysowane", Object.values(d.old).every(v => v === false) && Object.keys(d.old).length >= 8, d.old);
    await t.eval("$gameSystem._minimapHidden = undefined; 0");   // (a game that never pressed M: kit's quiet hid it)
    await t.frames(5);
    const mm0 = (await dbg()).minimap;
    t.check("minimapa domyślnie ukryta", !!mm0 && mm0.visible === false && mm0.hidden === true, mm0);
    const clock = await t.eval("SceneManager._scene._cleanClock._key");
    t.check("zegar pokazuje godzinę gry (10:00)", /^10:0\d#/.test(clock), clock);
    t.check("cel z dziennika w lewym górnym rogu: Dojdź na pole dziadka", d.goal && d.goal.id === "story_field" && /pole dziadka/i.test(d.goal.title), d.goal);
    await t.shot(path.join(__dirname, "..", "docs", "ui_czysty", "test_dom_dziadka.png"));

    // ---------------------------------------------------------------- the compass: the goal on another map - through the exits
    const routed = await t.until("(function(){ const i = CleanCompass.info(); return !!(i && i.route && i.route.x !== undefined && !i.route.pending); })()", 30);
    let c = await t.json("CleanCompass.info()");
    t.check("kompas: cel na innej mapie (pole dziadka) - droga przez przejścia", routed && c.target && c.target.map === 3 && c.route.via > 0 && c.route.steps > 20, c);
    t.check("kompas: strzałka i podpis pod tarczą „Pole dziadka · N kroków”", !!c.marker && /^Pole dziadka · \d+ krok/.test(c.label || ""), c.label);
    const exitEv = await t.json(`(function(){ const i = CleanCompass.info(), e = $gameMap.event(i.route.exit); return e ? { x: e.x, y: e.y, to: CleanCompass.exitsHere().find(x => x.id === e.eventId()).to.map } : null; })()`);
    t.check("kompas: romb wskazuje prawdziwe przejście tej mapy", !!exitEv && exitEv.x === c.route.x && exitEv.y === c.route.y, exitEv);
    // the bearing: the hero west of the exit -> the arrow points east (right of N); east of it -> west
    const bearing = async dx => {
        await t.eval(`(function(){ const i = CleanCompass.info(); $gamePlayer.locate(Math.max(0, Math.min($gameMap.width() - 1, i.route.x + (${dx}))), i.route.y); CleanCompass.refresh(); return 0; })()`);
        await t.frames(40);
        return t.json("CleanCompass.info()");
    };
    const west = await bearing(-6), east = await bearing(6);
    t.check("kompas: cel na wschód - strzałka w prawo, na zachód - w lewo", west.marker && east.marker && west.angle > 45 && west.angle < 135 && east.angle < -45 && east.angle > -135
        && west.marker.x > west.centre.x + 30 && east.marker.x < east.centre.x - 30, { west: [west.angle, west.marker], east: [east.angle, east.marker] });
    // a person on this map: grandpa (the table's "person"), straight to him
    const gp = await t.json(`(function(){ const r = CleanCompass.resolve({ person: "grandpa" }), e = $gameMap.event(Story.NPCS.grandpa.id); return { r, ev: e ? [e.x, e.y] : null }; })()`);
    t.check("osoba na tej mapie: dziadek Stach tam, gdzie stoi", gp.r && gp.r.map === 19 && gp.ev && gp.r.x === gp.ev[0] && gp.r.y === gp.ev[1], gp);
    const direct = await t.json(`(function(){ $gamePlayer.locate(4, 6); return CleanCompass.route({ map: 19, x: 10, y: 6 }); })()`);
    t.check("cel na tej mapie: wprost, 6 kroków", direct && direct.direct && Math.round(direct.steps) === 6, direct);

    // ---------------------------------------------------------------- the map's name as one comes in, then it goes
    await t.go(20, 10, 12, 2);
    await t.frames(10);
    let top = (await dbg()).top;
    t.check("nazwa miejsca po wejściu u góry na środku", top.some(x => x.k === "name" && x.y < 30), top);
    await t.frames(260);
    top = (await dbg()).top;
    t.check("...i gaśnie po chwili", !top.some(x => x.k === "name"), top);
    await t.go(19, 4, 6, 2);
    await t.eval("CleanCompass.refresh(); 0");
    await t.frames(20);

    // ---------------------------------------------------------------- a town quest followed: its step's person
    const tq = await t.json(`(function(){ if (!window.TownQuests) return null; TownQuests.start("K1"); TownQuests.track("K1"); $gameSystem.setDayNightHour(10);
        return { track: TownQuests.state().track }; })()`);
    if (tq) {
        await t.frames(30);
        await t.eval("CleanCompass.refresh(); 0");
        await t.frames(10);
        const g = (await dbg()).goal, ct = await t.json("CleanCompass.info()");
        t.check("zadanie z miasteczka w lewym górnym rogu (K1, kowal)", g && g.source === "town" && g.id === "K1", g);
        t.check("kompas: krok zadania zna osobę - kowal w miasteczku (mapa 8)", ct.target && ct.target.map === 8 && /Tadek/.test(ct.target.name) && ct.target.x !== undefined, ct.target);
        await t.eval(`(function(){ TownQuests.track(null); return 0; })()`);
        await t.frames(20);
    }

    // ---------------------------------------------------------------- gains, thoughts, the arc, the experience
    await t.eval(`(function(){ $gamePlayer.locate(9, 9); $gameParty.gainItem($dataItems[64], 2); $gameParty.gainItem($dataItems[77], 3); return 0; })()`);
    await t.frames(30);
    const gains = await t.json(`(function(){ const g = SceneManager._scene._cleanGains; return { rows: g.children.length, plates: SceneManager._scene._gainFeed.children.length,
        right: Math.max.apply(null, g.children.map(r => r.x)), bottom: Math.max.apply(null, g.children.map(r => r.y)) }; })()`);
    t.check("zdobycze: tekst z ikoną w prawym dolnym rogu (tyle wierszy, ile tabliczek)", gains.rows === gains.plates && gains.rows >= 2 && gains.right > 1200 && gains.bottom > 560, gains);
    const fades = await t.json(`(function(){ const g = SceneManager._scene._cleanGains; const r = g.children.slice().sort((a, b) => b.y - a.y); return r.map(x => x.opacity); })()`);
    t.check("zdobycze: starsze bledną", fades.length >= 2 && fades[0] > fades[1], fades);
    await t.eval(`(function(){ Tawerna.popup.need($dataItems[60].iconIndex, "Potrzebujesz siekiery"); SpeechBubbles.say($gamePlayer, "Muszę się czegoś napić..."); return 0; })()`);
    await t.frames(12);
    const over = await t.json(`(function(){ const s = SceneManager._scene, p = s._lootLayer.children.slice(-1)[0]; let cry = null;
        for (const [b, sp] of s._barks._shown) if (b.ch === $gamePlayer) cry = { clean: sp._cleanKey === sp._key, visible: sp.visible };
        return { popup: p ? { clean: !!p._cleanDone, text: p._data.text } : null, cry }; })()`);
    const pops = await t.popups();
    t.check("brak narzędzia: komunikat nad bohaterem, tekst z obrysem bez tabliczki", over.popup && over.popup.clean && pops.includes("Potrzebujesz siekiery"), over.popup);
    t.check("myśl bohatera bez dymka", over.cry && over.cry.clean, over.cry);
    // no bars under the hero (the user, 2026-10-08): no arc of the needs, the breath's bar of Combat_UI not drawn - also after a run
    await t.eval("$gameSystem.changeStamina(-8); if (Combat.spendBreath) Combat.spendBreath(30); 0");
    await t.frames(10);
    const feetBars = await t.json(`(function(){ const s = SceneManager._scene, b = s._spriteset._combatLayer && s._spriteset._combatLayer._breath;
        return { arc: !!s._cleanArc, breath: b ? { renderable: b.renderable, opacity: b.opacity } : null }; })()`);
    t.check("pod bohaterem żadnych pasków (bez łuku, oddech niewidoczny)", !feetBars.arc && !!feetBars.breath && feetBars.breath.renderable === false, feetBars);

    // ---------------------------------------------------------------- the needs on: four bars; the fade under the hero
    await t.eval("Needs.setEnabled(true); 0");
    await t.frames(10);
    const needs = await t.json("CleanHUD.debug().parts.needs");
    t.check("z głodem i pragnieniem: cztery paski (szerzej)", needs.visible && needs.w > 450, needs);
    await t.eval("Needs.setEnabled(false); 0");
    const alphaAt = async (sx, sy) => {
        await t.eval(`(function(){ $gameMap.setDisplayPos(0, 0); $gamePlayer.locate(${sx}, ${sy}); $gameMap.setDisplayPos(0, 0); return 0; })()`);
        await t.frames(40);
        return t.json(`(function(){ const s = SceneManager._scene; return { clock: +s._cleanClock.alpha.toFixed(2), load: +s._cleanLoad.alpha.toFixed(2), compass: +s._cleanCompass.alpha.toFixed(2) }; })()`);
    };
    await t.go(20, 10, 12, 2);
    const under = await alphaAt(1, 1), away = await alphaAt(10, 8);
    t.check("bohater pod zegarem: lewy górny róg blednie, reszta nie", under.clock <= 0.35 && under.load === 1, under);
    t.check("...a gdy odejdzie, wraca", away.clock === 1 && away.compass === 1, away);

    // ---------------------------------------------------------------- the minimap on M, under the load
    await t.key("M");
    await t.frames(10);
    let mm = (await dbg()).minimap;
    const loadNow = (await dbg()).parts.load;
    t.check("M pokazuje minimapę pod obciążeniem (prawy górny róg)", mm && mm.visible && mm.y >= loadNow.y + loadNow.h - 4 && mm.y < 260, { mm, load: loadNow });
    await t.key("M");
    await t.frames(10);
    mm = (await dbg()).minimap;
    t.check("M znowu ją chowa", mm && !mm.visible, mm);

    // ---------------------------------------------------------------- the combat mode: the label under the compass, the weapon
    await t.eval("$gameParty.gainItem($dataItems[60], 1); 0");
    const needsW0 = (await dbg()).parts.needs.w;
    await t.key("Tab");
    await t.frames(20);
    d = await dbg();
    t.check("tryb walki: napis u góry na środku", d.top.some(x => x.k === "mode" && x.y < 80), d.top);
    const breath5 = await t.json(`(function(){ const v = CleanHUD.needValues(); return { breath: v.breath, w: CleanHUD.debug().parts.needs.w }; })()`);
    t.check("tryb walki: oddech jako kolejny pasek w lewym dolnym rogu", breath5.breath !== undefined && breath5.w >= needsW0 + 120, { breath5, needsW0 });
    t.check("tryb walki: broń w prawym dolnym rogu", d.parts.weapon.visible && d.parts.weapon.x > 900 && d.parts.weapon.y > 600, d.parts.weapon);
    await t.shot(path.join(__dirname, "..", "docs", "ui_czysty", "test_walka.png"));
    await t.key("Tab");
    await t.frames(10);

    // ---------------------------------------------------------------- P: the ring
    await t.eval("$gameTemp._ringFeet = null; 0");
    await t.key("P");
    t.check("P otwiera menu", await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10));
    await t.frames(20);
    let ring = await t.json("MenuRing.info()");
    t.check("menu jako pierścień: 6 poleceń, wybrany Plecak (na górze)", ring && ring.order.slice(0, 6).join() === "item,journal,options,gameEnd,save,hero" && ring.selected === "item"
        && ring.buttons[0].y < ring.centre.y - 100, ring);
    t.check("okno poleceń ukryte, panel MenuPanel niewidoczny", !ring.window.visible && !ring.window.active && !(await t.eval("SceneManager._scene._menuPanel.visible")));
    const back = await t.json("(function(){ const s = SceneManager._scene._backgroundSprite; return { filters: (s.filters || []).length, opacity: s.opacity }; })()");
    t.check("mapa widoczna (bez rozmycia), przyciemniona wokół", back.filters === 0 && back.opacity === 255, back);
    await t.shot(path.join(__dirname, "..", "docs", "ui_czysty", "test_menu_pierscien.png"));
    await t.key("ArrowRight");
    await t.frames(30);
    ring = await t.json("MenuRing.info()");
    const top1 = ring.buttons.find(b => b.sym === "journal");
    t.check("→ obraca pierścień: Dziennik na górze", ring.selected === "journal" && top1.y < ring.centre.y - 100 && Math.abs(top1.x - ring.centre.x) < 6, { sel: ring.selected, top1 });
    await t.key("Enter");
    t.check("Enter otwiera dziennik (zwykłe okno)", await t.until("SceneManager._scene instanceof Journal.Scene_Journal && !SceneManager.isSceneChanging()", 10));
    await t.frames(20);
    // (the journal lets the first Esc after it opens go by - the same in the classic look; a player presses again)
    let backToRing = false;
    for (let i = 0; i < 3 && !backToRing; i++) {
        await t.key("Escape");
        backToRing = await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 3);
    }
    t.check("Esc wraca do pierścienia", backToRing);
    ring = await t.json("MenuRing.info()");
    t.check("...z Dziennikiem wybranym", ring && ring.selected === "journal", ring && ring.selected);
    await t.key("ArrowLeft"); await t.key("ArrowLeft");
    await t.frames(10);
    ring = await t.json("MenuRing.info()");
    t.check("← dwa razy: Postać", ring.selected === "hero", ring.selected);
    await t.key("Enter");
    t.check("Postać otwiera ekran bohatera", await t.until("SceneManager._scene && /Scene_Hero/.test(SceneManager._scene.constructor.name) && !SceneManager.isSceneChanging()", 10),
        await t.scene());
    await t.frames(20);
    await t.key("Escape");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.key("Escape");
    t.check("Esc z pierścienia wraca do gry", await t.until(t.onMap(20), 10));
    await t.frames(10);

    // ---------------------------------------------------------------- Opcje: "Wygląd" - the classic look, and back
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.eval("SceneManager.push(Scene_Options); 0");
    await t.until("SceneManager._scene instanceof Scene_Options && !SceneManager.isSceneChanging()", 10);
    await t.frames(10);
    const opt = await t.json(`(function(){ const w = SceneManager._scene._optionsWindow, i = w.findSymbol("uiClean"); return { i, text: i >= 0 ? w.statusText(i) : null, name: i >= 0 ? w.commandName(i) : null }; })()`);
    t.check("Opcje: „Wygląd: Czysty widok”", opt.i >= 0 && opt.name === "Wygląd" && opt.text === "Czysty widok", opt);
    await t.shot(path.join(__dirname, "..", "docs", "ui_czysty", "test_opcje.png"));
    await t.eval(`(function(){ const w = SceneManager._scene._optionsWindow; w.select(w.findSymbol("uiClean")); return 0; })()`);
    await t.key("Enter");
    await t.frames(5);
    const opt2 = await t.json(`(function(){ const w = SceneManager._scene._optionsWindow; return { text: w.statusText(w.findSymbol("uiClean")), cfg: ConfigManager.uiClean, saved: ConfigManager.makeData().uiClean }; })()`);
    t.check("Enter zmienia na „Klasyczny” (i zapisuje w ustawieniach)", opt2.text === "Klasyczny" && opt2.cfg === false && opt2.saved === false, opt2);
    await t.key("Escape");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(10);
    t.check("klasyczny: menu P znowu jako panel", !(await t.eval("SceneManager._scene._ringOn")) && (await t.eval("SceneManager._scene._menuPanel.visible && SceneManager._scene._commandWindow.visible")));
    await t.key("Escape");
    await t.until(t.onMap(20), 10);
    await t.frames(10);
    d = await dbg();
    t.check("klasyczny: stare części znowu rysowane, czyste schowane", !d.clean && Object.values(d.old).every(v => v === true) && !d.parts.clock.visible && !d.parts.compass.visible && !d.parts.needs.visible, d.old);
    await t.shot(path.join(__dirname, "..", "docs", "ui_czysty", "test_klasyczny.png"));
    await t.eval("CleanHUD.setClean(true); 0");
    await t.frames(10);
    d = await dbg();
    t.check("i z powrotem czysty widok", d.clean && d.parts.clock.visible && Object.values(d.old).every(v => v === false), d.parts.clock);
});
