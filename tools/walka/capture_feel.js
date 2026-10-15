// Klatki do GIF-ów i zrzuty „walka przyjemniejsza” (Combat_Feel.js, 2026-10-14): miękkie namierzanie (krąg, F, cios do celu),
// zapowiedź ataku (czerwony obrys bandyty, biało-złoty niedźwiedzia), idealne parowanie wilka (zwolnienie, „Kontratak!”),
// manekin treningowy (zamach z zapowiedzią, „Idealne parowanie!”). Klatki (wycinki wokół bohatera) idą do <katalog>,
// GIF-y składa make_gif_feel.py do docs/walka/.
//   CDP_PORT=9492 node tools/walka/capture_feel.js <katalog na klatki> [ujęcie...]      (ujęcia: cel, zapowiedz, parowanie, manekin)
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const DIR = process.argv[2];
const want = process.argv.slice(3);
const on = name => !want.length || want.includes(name);
const DOCS = path.join(__dirname, "..", "..", "docs", "walka");
fs.mkdirSync(DIR, { recursive: true });

kit.test({ port: 9492, errorCheck: false }, async t => {
    t.check("nowa gra na łące (Map004), południe", await t.newGame({ map: 4, x: 20, y: 14, hour: 12, quiet: true }));
    await t.eval("$gameSystem.setStamina(100); $gameParty.leader().recoverAll(); Hunting.RAID.perHour = 0; $gameSystem._minimapHidden = true; $gameParty.gainItem($dataItems[156], 1); $gameParty.gainItem($dataItems[155], 1); 0");
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        let best = null;
        for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 8; x < $gameMap.width() - 8; x++) {
            let ok = true;
            for (let dx = -6; dx <= 6 && ok; dx++) for (let dy = -4; dy <= 4; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok && (!best || Math.abs(x - $gameMap.width() / 2) < Math.abs(best.x - $gameMap.width() / 2))) best = { x, y };
        }
        return best; })()`);
    const cx = room.x, cy = room.y;
    const clear = () => t.eval("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); Humans.clear(); Creatures.clear(); 0");
    const home = async dir => {
        await clear();
        await t.eval(`(function(){ Combat.resetAct(); $gamePlayer._toolSwing = null; $gamePlayer._swingEvent = null; $gamePlayer.locate(${cx}, ${cy}); $gamePlayer.center(${cx}, ${cy});
            $gamePlayer.setDirection(${dir || 2}); $gamePlayer._heroDir8 = ${dir || 2}; $gameParty.leader().recoverAll(); $gameSystem._combatMode = true; $gameSystem._combatHand = "m156"; return 0; })()`);
        await t.frames(8);
    };
    const clip = async (name, i, w, h, dy) => {
        const p = await t.json("(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gamePlayer); return { x: s.x, y: s.y }; })()");
        const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: Math.round(p.x - w / 2), y: Math.round(p.y - h / 2 - (dy || 30)), width: w, height: h, scale: 1 } });
        fs.writeFileSync(path.join(DIR, name + "_" + String(i).padStart(3, "0") + ".png"), Buffer.from(r.data, "base64"));
    };
    const record = async (name, n, every, w, h, dy, during) => { for (let i = 0; i < n; i++) { if (during) await during(i); await clip(name, i, w, h, dy); await t.frames(every); } };
    // keys pressed inside the game loop
    await t.eval(`(function(){ window.__ks = []; const _ui = SceneManager.updateInputData; SceneManager.updateInputData = function() { const now = Graphics.frameCount;
        for (const k of window.__ks) if (!k.done && now >= k.at) { k.done = true; if (k.up) Input._onKeyUp({ keyCode: k.code }); else Input._onKeyDown({ keyCode: k.code, preventDefault() {} }); }
        window.__ks = window.__ks.filter(k => !k.done); _ui.call(this); };
        window.__press = (code, after, hold) => { const t = Graphics.frameCount + (after || 0); window.__ks.push({ at: t, code }, { at: t + (hold || 3), code, up: true }); }; return 0; })()`);
    await t.frames(240);   // (the combat mode's notices fade first)

    if (on("cel")) {
        await home(6);
        await t.eval(`(function(){ for (const [dx, dy] of [[2, 0], [-2, 1], [0, -2]]) { const h = Humans.spawn("bandit", ${cx} + dx, ${cy} + dy, { engaged: true, noSurrender: true }); h._frozen = true; h._maxHp = h._hp = 900; } return 0; })()`);
        await t.frames(30);
        await t.shot(path.join(DOCS, "walka_cel.png"));
        await record("cel", 70, 2, 420, 300, 20, async i => {
            if (i === 12 || i === 30) await t.eval("__press(70, 0, 3); 0");          // F: the next target
            if (i === 46) await t.eval("__press(79, 0, 3); 0");                       // O: the blow turns to it
        });
        console.log("SHOT cel");
    }
    if (on("zapowiedz")) {
        await home(6);
        await t.eval(`(function(){ const h = Humans.spawn("bandit", ${cx + 2}, ${cy}, { engaged: true, noSurrender: true }); h._frozen = true; h._blow = "main"; h._feint = false; h.setMode("windup", 40); h._frozen = false; window.__h = h; return 0; })()`);
        await record("zapowiedz_bandyta", 34, 2, 360, 260, 20);
        await home(6);
        await t.eval(`(function(){ const a = Hunting.spawn("bear", ${cx + 2}, ${cy}); a._engaged = true; a._lock = [-1, 0]; a._f8 = 4; a.setMode("swipeWind", 40); window.__br = a;
            window.__rolled = false; const _u = Scene_Map.prototype.update; window.__restoreU = () => { Scene_Map.prototype.update = _u; };
            Scene_Map.prototype.update = function() { _u.call(this); const tl = __br.combatTell(); if (!__rolled && tl && tl.t <= 9) { __rolled = true; Input._currentState.up = true; __press(32, 0, 3); setTimeout(() => { Input._currentState.up = false; }, 120); } }; return 0; })()`);
        await record("zapowiedz_niedzwiedz", 40, 2, 360, 260, 20);
        await t.eval("__restoreU(); Input._currentState.up = false; 0");
        await t.frames(30);
        await home(6);
        await t.eval(`(function(){ const a = Hunting.spawn("bear", ${cx + 2}, ${cy}); a._frozen = true; a._engaged = true; a._lock = [-1, 0]; a._f8 = 4; a.setMode("swipeWind", 12); return 0; })()`);
        await t.frames(4);
        await t.shot(path.join(DOCS, "walka_zapowiedz_niedzwiedz.png"));
        console.log("SHOT zapowiedz");
    }
    if (on("parowanie")) {
        await home(6);
        await t.eval("$gameSystem._tw.combat.hintWolf = true; 0");   // (the first wolf's hint is shown once: not over this clip)
        await t.eval(`(function(){ window.__w = Hunting.spawnPack(${cx + 3}, ${cy}, 1).members[0]; __w._summoned = true; Hunting.wolfEngage(__w); __w._pack.nextAttack = 0;
            window.__parried = false; const _u = Scene_Map.prototype.update; window.__restoreU = () => { Scene_Map.prototype.update = _u; };
            Scene_Map.prototype.update = function() { _u.call(this); const w = __w; if (!__parried && w && w._mode === "lunge" && w.playerDistance() < 1.8) { __parried = true; __press(80, 0, 10); } }; return 0; })()`);
        for (let i = 0; i < 120 && !(await t.eval("__w._mode === 'windup'")); i++) await t.frames(2);
        await record("parowanie", 60, 2, 360, 260, 20, async i => { if (i === 36) await t.eval("__press(79, 0, 3); 0"); });
        await t.eval("__restoreU(); 0");
        console.log("SHOT parowanie");
    }
    if (on("manekin")) {
        await home(6);
        await t.eval(`Farming.placeFree("dummy", ${cx + 1}, ${cy}); 0`);
        await t.frames(30);
        await t.eval(`(function(){ window.__pp = false; const _u = Scene_Map.prototype.update; window.__restoreU = () => { Scene_Map.prototype.update = _u; };
            Scene_Map.prototype.update = function() { _u.call(this); const d = Combat.feel.dummies()[0]; if (d && d.mode === "wind" && d.t <= 6 && !__pp) { __pp = true; __press(80, 0, 12); } if (d && d.mode === "idle") __pp = false; }; return 0; })()`);
        for (let i = 0; i < 200 && (await t.eval("Combat.feel.dummies()[0].mode")) !== "wind"; i++) await t.frames(2);
        await record("manekin", 50, 2, 300, 240, 30);
        await t.eval("__restoreU(); 0");
        await t.shot(path.join(DOCS, "walka_manekin.png"));
        console.log("SHOT manekin");
    }
});
