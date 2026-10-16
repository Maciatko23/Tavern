// Zrzuty z gry do dokumentacji pakietu A (docs/miejsca_wyspy/pustelnia_*.png):
//   pustelnia_mapa.png       cała Map155 w południe (sklejona z ekranów, bez HUD-u)
//   pustelnia_kleofas.png    pierwsze spotkanie z bratem Kleofasem (popiersie, dymek)
//   pustelnia_czytanie.png   czytanie karty kroniki przy pulpicie w skryptorium
//   pustelnia_noc_pytania.png Noc Pytania przy wieży skryptorium (wybór pytania)
//   pustelnia_zachod.png     Kleofas przy ławce nad urwiskiem o zachodzie, czerwone morze
// Przed instalacją map: nakładka tools/miejsca_wyspy/staging_A (sama się włącza).
// Uruchom (gra na 8765): CDP_PORT=9501 node tools/pustelnia/shots.js
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const kit = require("../../tests/lib/kit.js");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "miejsca_wyspy");
const TMP = path.join(__dirname, "staging", "shots");
const skeleton = /Wyspa:szkielet/.test(fs.readFileSync(path.join(ROOT, "data", "Map155.json"), "utf8"));
const OVERLAY = process.env.GAME_OVERLAY || (skeleton ? "tools/miejsca_wyspy/staging_A" : null);

kit.test({ port: 9501, overlay: OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    fs.mkdirSync(TMP, { recursive: true });
    const hideHud = on => t.eval(`(function(){ const s = SceneManager._scene, ss = s._spriteset, on = ${on ? "true" : "false"};
        s.children.forEach(c => { if (c !== ss) c.visible = !on; });
        if (on) { ss._prKeep = ss.filters; ss.filters = null; } else if (ss._prKeep !== undefined) { ss.filters = ss._prKeep; }
        (ss._cloudSprites || []).forEach(c => { if (on) { c._prUpd = c.update; c.update = function(){}; c.visible = false; } else if (c._prUpd) { c.update = c._prUpd; } });
        return 0; })()`);
    const settle = async n => { await t.frames(n || 40); await t.until("!SceneManager._scene.isFading()", 5, 100); };
    const clearNotices = () => t.eval("(function(){ const q = $gameTemp; for (const k of Object.keys(q)) if (/top|notice/i.test(k) && Array.isArray(q[k])) q[k].length = 0; return 0; })()");

    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.go(155, 24, 30, 8);
    await t.setDay(6, 12.3);
    await t.eval("TownLife.placeAll(); 0");
    // ---------------------------------------------------------------- the whole map
    await t.eval("$gamePlayer.setTransparent(true); 0");
    await settle(60);
    await hideHud(true);
    const W = 48, H = 36, SW = 1280 / 48, SH = 720 / 48;
    const xs = [0, W - SW], ys = [0, 11, H - SH];
    const parts = [];
    for (const y of ys) for (const x of xs) {
        await t.eval(`$gameMap.setDisplayPos(${x}, ${y}); 0`);
        await t.frames(12);
        const f = path.join(TMP, `part_${x}_${y}.png`);
        await t.shot(f);
        parts.push([f, x, y]);
    }
    await hideHud(false);
    await t.eval("$gamePlayer.setTransparent(false); 0");
    execFileSync("python", [path.join(__dirname, "shots_stitch.py"), JSON.stringify(parts), String(W), String(H), path.join(OUT, "pustelnia_mapa.png")], { stdio: "inherit" });

    // ---------------------------------------------------------------- the first meeting (13:30, the garden)
    await t.setDay(6, 13.5);
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(16, 10, 2);
    await t.eval("$gamePlayer.center($gamePlayer.x, $gamePlayer.y); 0");
    await settle(40);
    await clearNotices();
    await t.eval(kit.DRIVER ? kit.DRIVER + "; 0" : "0");
    const talkShot = async (evExpr, file, lineN, pick) => {
        await t.eval(`(function(){ const e = ${evExpr}; if (window.__standBy) __standBy(e.eventId()); e.start(); return 0; })()`);
        await t.until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.isOpen()", 15);
        for (let i = 0; i < (lineN || 0); i++) { await t.frames(50); await t.press("ok"); }
        await t.frames(110);
        await t.shot(file);
        await t.finish(40);
        await t.frames(30);
    };
    await talkShot("TownLife.eventOf('pustelnik')", path.join(OUT, "pustelnia_kleofas.png"), 4);

    // ---------------------------------------------------------------- the reading at the lectern
    await t.eval("(function(){ const s = TownQuests.state(); s.q.K50 = { s: 'done', step: 0, day: 6, sday: 6, end: 6, t: { done: {} }, times: 1 }; s.q.D23 = { s: 'active', step: 0, day: 6, sday: 6, sh: 10, t: { done: {} }, times: 0 }; Pustelnia.giveCard(2); return 0; })()");
    await t.go(156, 6, 7, 8);
    await t.setHour(9.5);
    await settle(60);
    await clearNotices();
    await t.eval("(function(){ const e = $gameMap.events().find(e => e.event().name === 'Pulpit z księgą'); $gamePlayer.locate(6, 6); $gamePlayer.setDirection(8); e.start(); return 0; })()");
    for (let i = 0; i < 8; i++) {
        await t.until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.isOpen()", 15);
        const txt = await t.eval("$gameMessage.allText()");
        if (/dzwon woła/.test(txt)) break;
        await t.frames(40); await t.press("ok");
    }
    await t.frames(110);
    await t.shot(path.join(OUT, "pustelnia_czytanie.png"));
    await t.finish(40);

    // ---------------------------------------------------------------- the Night of the Question
    await t.eval("(function(){ const s = TownQuests.state(); s.flags.sercePustelni = 6; return 0; })()");
    const wig = await t.eval("Pustelnia.wigDay(6)");
    await t.go(155, 20, 11, 8);
    await t.setDay(wig + 1, 0.2);
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(20, 12, 8);
    await t.eval("$gamePlayer.center($gamePlayer.x, $gamePlayer.y); 0");
    await settle(80);
    await clearNotices();
    await t.eval("(function(){ const e = TownLife.eventOf('pustelnik'); e.start(); return 0; })()");
    await t.until("!!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)", 30);
    await t.frames(40);
    await t.shot(path.join(OUT, "pustelnia_noc_pytania.png"));
    await t.finish(40);

    // ---------------------------------------------------------------- the sunset at the bench over the cliff
    await t.setDay(wig + 3 - 56, 19.4);   // (a summer evening: in the winter the sun is down by then)
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(8, 7, 6);
    await t.eval("$gamePlayer.center(11, 8); 0");
    await settle(120);
    await clearNotices();
    await t.frames(200);
    await t.shot(path.join(OUT, "pustelnia_zachod.png"));
});
