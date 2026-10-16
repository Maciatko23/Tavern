// Zrzuty z gry do dokumentacji pakietu C (docs/miejsca_wyspy/latarnia_*.png):
//   latarnia_dzien.png    przylądek po południu: wieża latarni, izba, Bazyli przy drewutni, dzwon mgłowy, czerwone morze
//   latarnia_noc.png      ta sama noc: płomień w koszu, świecące szyby laterny, światło i snopy nad morzem
//   latarnia_z_dolu.png   noc z lasu pod przylądkiem: snopy latarni widać z daleka
//   latarnia_z_gor.png    noc w Górach (Map013) przy zejściu na przylądek: snop latarni zza krawędzi mapy
//   latarnia_mgla.png     mglista noc: pasma mgły, snop w mgle, dzwon mgłowy
//   latarnia_wizja.png    wizja w soczewce (biały ekran, okrągła plansza, jedno zdanie)
//   latarnia_laterna.png  laterna nocą: Bazyli przy koszu z ogniem, soczewka w mosiężnym pierścieniu
//   latarnia_izba.png     izba latarnika wieczorem: pierwsza rozmowa (popiersie, dymek)
// Przed instalacją map: nakładka tools/miejsca_wyspy/staging_C (sama się włącza).
// Uruchom (gra na 8765): CDP_PORT=9503 node tools/latarnia/shots.js
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "miejsca_wyspy");
const skeleton = /Wyspa:szkielet/.test(fs.readFileSync(path.join(ROOT, "data", "Map159.json"), "utf8"));
const OVERLAY = process.env.GAME_OVERLAY || (skeleton ? "tools/miejsca_wyspy/staging_C" : null);

kit.test({ port: 9503, overlay: OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const settle = async n => { await t.frames(n || 40); await t.until("!SceneManager._scene.isFading()", 5, 100); };
    const clearNotices = () => t.eval("(function(){ const q = $gameTemp; for (const k of Object.keys(q)) if (/top|notice|popup|loot/i.test(k) && Array.isArray(q[k])) q[k].length = 0; return 0; })()");
    const view = (x, y) => t.eval(`(function(){ $gameMap.setDisplayPos(${x}, ${y}); return 0; })()`);
    const shot = async name => { await clearNotices(); await t.frames(8); await t.shot(path.join(OUT, name)); console.log("zrzut " + name); };

    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.go(159, 22, 12, 8);
    await settle(240);
    await t.eval("(function(){ TownQuests.state().flags.latarnikMet = 1; Latarnia.state().met = 1; if (window.CloudShadows && CloudShadows.setEnabled) CloudShadows.setEnabled(false); return 0; })()");

    // ---------------------------------------------------------------- the day
    await t.setDay(10, 15.6);
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(22, 12, 8);
    await settle(200);
    await view(9, 3.6);
    await settle(30);
    await shot("latarnia_dzien.png");

    // ---------------------------------------------------------------- the night: the flame, the panes, the beams
    await t.setDay(10, 23.2);
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(23, 12, 8);
    await settle(90);
    await view(9, 3.6);
    await t.eval("Graphics.frameCount = Math.ceil(Graphics.frameCount / 1320) * 1320 + 150; 0");   // (the beams turned towards the sea)
    await settle(20);
    await shot("latarnia_noc.png");
    // from the forest below the cape
    await t.locate(22, 33, 8);
    await settle(30);
    await view(9, 23);
    await t.eval("Graphics.frameCount = Math.ceil(Graphics.frameCount / 1320) * 1320 + 420; 0");
    await settle(20);
    await shot("latarnia_z_dolu.png");
    // from the mountains (Map013), by the way down to the cape
    await t.go(13, 56, 12, 6);
    await t.setDay(10, 23.3);
    await settle(240);
    await t.eval("Graphics.frameCount = Math.ceil(Graphics.frameCount / 1320) * 1320 + 640; 0");
    await settle(20);
    await shot("latarnia_z_gor.png");

    // ---------------------------------------------------------------- the fog night
    await t.go(159, 28, 15, 8);
    await t.eval("(function(){ Sky.forceMist(0.95, 13); $gameSystem._dayNightDay = 12; $gameSystem.setDayNightHour(23.4); TownLife.placeAll(); return 0; })()");
    await settle(240);
    await view(13, 3.6);
    await t.eval("Graphics.frameCount = Math.ceil(Graphics.frameCount / 1320) * 1320 + 1150; 0");
    await settle(20);
    await shot("latarnia_mgla.png");

    // ---------------------------------------------------------------- up in the lantern room: Bazyli by the fire, the lens; the vision
    await t.eval("(function(){ $gamePlayer.locate(22, 10); $gamePlayer.setDirection(8); $gameMap.events().find(e => /<Latarnia:wieza>/.test(e.event().note)).start(); return 0; })()");
    await t.until(t.onMap(161), 20);
    await t.calm({ quiet: true });
    await t.locate(3, 6, 6);
    await settle(260);
    await shot("latarnia_laterna.png");
    await t.eval("(function(){ const q = TownQuests; if (!q.isActive('D22')) q.start('D22'); $gamePlayer.locate(4, 4); $gamePlayer.setDirection(6); $gameMap.events().find(e => /<Latarnia:soczewka>/.test(e.event().note)).start(); return 0; })()");
    await t.until("Latarnia.visionBusy()", 10);
    await t.frames(140);
    await t.shot(path.join(OUT, "latarnia_wizja.png"));
    console.log("zrzut latarnia_wizja.png");
    await t.press("ok");
    await t.until("!Latarnia.visionBusy()", 15);
    await t.finish();

    // ---------------------------------------------------------------- the keeper's room in the evening: the first talk
    await t.eval("(function(){ Latarnia.state().met = 0; return 0; })()");
    await t.go(160, 6, 8, 8);
    await t.setDay(14, 18);
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(6, 7, 4);
    await settle(120);
    await t.eval(kit.DRIVER + "; 0");
    await t.eval("(function(){ window.__drv.on = false; const e = TownLife.eventOf('latarnik'); e.start(); return 0; })()");
    await t.until("$gameMessage.isBusy()", 10);
    await t.frames(70);
    await shot("latarnia_izba.png");
    await t.finish();
});
