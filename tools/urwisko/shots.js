// Zrzuty Urwiska Kruków i kruka do dokumentacji: docs/miejsca_wyspy/urwisko_*.png + klatki lotu do tools/urwisko/klatki/
// (GIF składa tools/urwisko/gif.py; klatki potem usunąć). Gra z nakładką staging_B, gdy data/Map157.json to jeszcze szkielet.
//   CDP_PORT=9502 node tools/urwisko/shots.js   (serwer: node tools/serve.js)
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const ROOT = path.join(__dirname, "..", "..");
const DOCS = path.join(ROOT, "docs", "miejsca_wyspy");
const FR = path.join(__dirname, "klatki");
const skeleton = /Wyspa:szkielet/.test(fs.readFileSync(path.join(ROOT, "data", "Map157.json"), "utf8"));
const OVERLAY = process.env.GAME_OVERLAY || (skeleton ? "tools/miejsca_wyspy/staging_B" : null);

kit.test({ port: Number(process.env.CDP_PORT) || 9502, overlay: OVERLAY, errorCheck: "bez błędów w konsoli" }, async t => {
    const shot = name => t.shot(path.join(DOCS, "urwisko_" + name + ".png"));
    const hideHud = on => t.eval(`(function(){ const s = SceneManager._scene; for (const k of ['_cleanLayer', '_hudLayer', '_mapNameWindow']) if (s[k]) s[k].visible = ${!on}; return 0; })()`);
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.eval("if (window.Creatures && Creatures.auto) Creatures.auto(false); 0");

    // ---- the ravenry by day: the young raven on the Order's old perch, the flock on the walls
    await t.setDay(9, 10);
    await t.go(157, 26, 14, 8);
    await t.frames(150);
    await hideHud(true);
    await shot("kruczarnia");
    // the grate of the cistern's overflow and the gutters (after rain)
    await t.locate(40, 18, 8);
    await t.frames(60);
    await shot("krata");
    // the west: the walls, the nest tower, the path from the hermitage
    await t.locate(12, 19, 8);
    await t.frames(60);
    await shot("zachod");

    // ---- the harbour at dawn: the raven on the cutter's mast (K51)
    await t.setDay(9, 5.6);
    await t.go(125, 16, 31, 2);
    await t.frames(120);
    await hideHud(true);
    await shot("maszt");

    // ---- the flight: in the ravenry the young raven hops down for the meat and goes back up (frames for the GIF)
    await t.setDay(10, 11);
    await t.go(157, 28, 13, 8);
    await t.frames(120);
    await hideHud(true);
    await t.give(94, 3);
    fs.mkdirSync(FR, { recursive: true });
    for (const f of fs.readdirSync(FR)) fs.unlinkSync(path.join(FR, f));
    await t.eval("Graphics._app.ticker.stop(); Kruk.feedYoung(); 0");
    const step = n => t.eval(`(function(){ for (let i = 0; i < ${n}; i++) Graphics._onTick(1); return 0; })()`);
    const box = await t.json(`(function(){ const tw = $gameMap.tileWidth(); return { x: Math.round(($gameMap.adjustX(28.5)) * tw), y: Math.round($gameMap.adjustY(12) * tw) }; })()`);
    fs.writeFileSync(path.join(FR, "box.json"), JSON.stringify(box));
    for (let i = 0; i < 150; i++) {
        await t.shot(path.join(FR, String(i).padStart(3, "0") + ".png"));
        await step(2);
        if (await t.eval("!!(Kruk.pet && Kruk.pet.state === 'sit' && !Kruk.pet.busy && Kruk.pet.z > 60 && Kruk.state().feeds.length && !Kruk.pet.anim)") && i > 40) break;
    }
    await t.eval("Graphics._app.ticker.start(); 0");
    await t.frames(30);

    // ---- tame: the name screen
    await t.eval("(function(){ const s = Kruk.state(); s.feeds = [8, 9]; return 0; })()");
    await t.setDay(11, 10);
    await t.frames(60);
    await t.eval("Kruk.tameNow(); 0");
    for (let i = 0; i < 12 && !(await t.eval("!!(Kruk.ravenScene() && SceneManager._scene instanceof Kruk.ravenScene())")); i++) { await t.press("ok"); await t.frames(15); }
    await t.frames(40);
    await t.eval("(function(){ const s = SceneManager._scene; s._name = Array.from('Węgielek'); s._dirty = true; return 0; })()");
    await t.frames(10);
    await shot("imie");
    await t.eval("SceneManager._scene.done(); 0");
    await t.until("SceneManager._scene instanceof Scene_Map", 20);
    await t.frames(60);

    // ---- the field: the perch, the raven on it, a trinket on the tray; the raven on the shoulder; the menu
    await t.go(3, 22, 21, 2);
    await t.frames(40);
    const spot = await t.json(`(function(){ for (let d = 0; d < 8; d++) for (let y = 21 - d; y <= 21 + d; y++) for (let x = 24 - d; x <= 24 + d; x++)
        if ($gameMap.checkPassage(x, y, 0x0f) && $gameMap.checkPassage(x, y + 1, 0x0f) && !$gameMap.eventsXy(x, y).length && !Farming.buildingAt(x, y)) return { x, y }; return null; })()`);
    await t.eval(`(function(){ const f = Farming.farm(), list = f.buildings[3] = f.buildings[3] || []; list.push({ id: f.nextId++, type: "grzeda", x: ${spot.x}, y: ${spot.y}, last: 1 }); f.rev++;
        Kruk.state().trinket = { kind: 'coins', n: 4 }; Kruk.setMode('guard'); return 0; })()`);
    await t.locate(spot.x - 1, spot.y + 2, 8);
    await t.frames(400);
    await hideHud(true);
    await shot("grzeda");
    await t.eval("Kruk.setMode('follow'); 0");
    await t.frames(60);
    await t.eval("(function(){ const p = Kruk.pet; if (p) { p.busy = false; p.state = 'shoulder'; p.anim = null; } return 0; })()");
    await t.frames(30);
    await shot("ramie");
    await hideHud(false);
    await t.key("K");
    await t.frames(20);
    await shot("menu");
    await t.eval("SceneManager._scene.closeFarmMenu(); 0");
    await t.frames(10);
    // the letter back from grandpa
    await t.eval("Kruk.sendLetter('grandpa'); 0");
    await t.frames(200);
    await t.eval("$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 2.1); 0");
    await t.until("!Kruk.state().away", 10);
    await t.until("Kruk.pet && (Kruk.pet.state === 'sit' || Kruk.pet.state === 'shoulder')", 20);
    await t.frames(6);
    await shot("list");   // (the HUD stays: the answer's bubble lives in its layer)
    await hideHud(true);
    // the scouting's marks on the field
    await t.eval("(function(){ Kruk.state().scout = { day: $gameSystem.dayNightDay(), map: 3, name: 'Pole' }; return 0; })()");
    await t.frames(80);
    await shot("zwiad");

    // ---- the Urwisko at night after D25: the strangers' camp
    await t.eval("(function(){ TownQuests.state().flags.dziennikOkretu = 12; if (window.Humans && Humans.auto) Humans.auto(true); return 0; })()");
    await t.setDay(14, 22.5);
    await t.go(157, 43, 21, 6, { calm: false });
    await t.eval("(function(){ Humans.auto(true); Kruk.campCheck(); Humans.campCheck(); return 0; })()");
    await t.frames(200);
    await hideHud(true);
    await shot("oboz");
    await t.eval("if (window.Humans) { Humans.auto(false); Humans.clear(); } 0");
});
