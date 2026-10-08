// Zrzuty i klatki do GIF-ów pochodni (Torch.js): nocą chód w 8 kierunkach, bieg, skradanie, atak pochodnią (dół, prawo, góra),
// praca z pochodnią wbitą w ziemię, deszcz. Klatki (wycinki wokół bohatera) idą do <katalog>, GIF-y składa make_gif.py.
//   CDP_PORT=9487 node tools/torch/capture.js <katalog na klatki> [ujęcie...]
// Ujęcia: chod, bieg, skradanie, atak, wbijanie, praca, deszcz, dzien (bez nazw: wszystkie). Pełne zrzuty: docs/pochodnia/*.png.
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const DIR = process.argv[2];
const want = process.argv.slice(3);
const on = name => !want.length || want.includes(name);
const DOCS = path.join(__dirname, "..", "..", "docs", "pochodnia");
fs.mkdirSync(DIR, { recursive: true });
fs.mkdirSync(DOCS, { recursive: true });

kit.test({ port: 9487, errorCheck: false }, async t => {
    t.check("nowa gra na łące (Map004)", await t.newGame({ map: 4, x: 20, y: 14, hour: 23, quiet: true }));
    await t.eval("$gameSystem.setStamina(100); $gameParty.leader().recoverAll(); Hunting.RAID.perHour = 0; $gameSystem._minimapHidden = true; 0");
    const cx = 20, cy = 14;
    const light = () => t.eval(`(function(){ if (!Torch.isLit()) { $gameParty.gainItem($dataItems[59], 1); const a = $gameParty.leader(), it = $dataItems[59]; a.useItem(it); const act = new Game_Action(a); act.setItemObject(it); act.applyGlobal(); } return 0; })()`);
    const home = async (dir, x, y) => { await t.eval(`(function(){ Combat.resetAct(); $gamePlayer._toolSwing = null; $gamePlayer._swingEvent = null; $gamePlayer.locate(${x || cx}, ${y || cy}); $gamePlayer.center(${x || cx}, ${y || cy}); $gamePlayer.setDirection(${dir || 2}); $gamePlayer._heroDir8 = ${dir || 2}; return 0; })()`); await t.frames(10); };
    // a clip round the hero (screen px), saved as <name>_<i>.png
    const clip = async (name, i, w, h, dy) => {
        const p = await t.json("(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gamePlayer); return { x: s.x, y: s.y }; })()");
        const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: Math.round(p.x - w / 2), y: Math.round(p.y - h / 2 - (dy || 30)), width: w, height: h, scale: 1 } });
        fs.writeFileSync(path.join(DIR, name + "_" + String(i).padStart(2, "0") + ".png"), Buffer.from(r.data, "base64"));
    };
    await light();
    await t.frames(30);
    await t.eval("Torch.state().left = 99; 0");
    if (on("atak")) {
        await t.eval("Combat.setCombatMode(true); $gameSystem._combatHand = 'm59'; 0");
        await t.frames(260);   // (the combat mode's notice at the top fades first)
        for (const [dir, ox, oy] of [[2, 0, 1], [6, 1, 0], [8, 0, -1]]) {
            await home(dir);
            await t.eval(`(function(){ for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); const w = Hunting.spawn("wolf", ${cx + ox}, ${cy + oy}); w._frozen = true; w._maxHp = w._hp = 400; return 0; })()`);
            await t.frames(6);
            await t.eval(`Combat.resetAct(); $gamePlayer.setDirection(${dir}); $gamePlayer._heroDir8 = ${dir}; 0`);
            await t.eval("Input._currentState.shoot = true; 0");
            await t.frames(1);
            await t.eval("Input._currentState.shoot = false; 0");
            for (let i = 0; i < 16; i++) { await clip("atak_" + dir, i, 220, 190, 24); await t.frames(2); }
            await t.frames(170);   // (the fire's numbers of this wolf gone before the next one)
            if (dir === 6) {
                await t.eval("Combat.resetAct(); Input._currentState.shoot = true; 0");
                await t.frames(1);
                await t.eval("Input._currentState.shoot = false; 0");
                await t.frames(12);
                await t.shot(path.join(DOCS, "atak_noc.png"));
                await t.frames(60);
            }
        }
        await t.eval("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); Combat.setCombatMode(false); 0");
        console.log("SHOT atak");
    }
    const KEYS = { 2: ["down"], 1: ["down", "left"], 4: ["left"], 7: ["up", "left"], 8: ["up"], 9: ["up", "right"], 6: ["right"], 3: ["down", "right"] };
    const move = async (name, mode, n, every) => {
        for (const d of [2, 1, 4, 7, 8, 9, 6, 3]) {
            await home(2);
            if (mode === "sneak") await t.eval("Hunting.setSneak(true); 0");
            await t.eval(`(function(){ ${mode === "run" ? "Input._currentState.shift = true;" : ""} for (const k of ${JSON.stringify(KEYS[d])}) Input._currentState[k] = true; return 0; })()`);
            await t.frames(4);
            for (let i = 0; i < n; i++) { await clip(name + "_" + d, i, 160, 150); await t.frames(every); }
            await t.eval(`(function(){ Input._currentState.shift = false; for (const k of ["up", "down", "left", "right"]) Input._currentState[k] = false; return 0; })()`);
            if (mode === "sneak") await t.eval("Hunting.setSneak(false); 0");
            await t.frames(6);
        }
        console.log("SHOT", name);
    };
    if (on("chod")) await move("chod", "walk", 12, 3);
    if (on("bieg")) await move("bieg", "run", 12, 2);
    if (on("skradanie")) await move("skradanie", "sneak", 12, 4);
    if (on("chod")) {   // a whole screen: standing at night with it
        await home(2);
        await t.frames(20);
        await t.shot(path.join(DOCS, "noc_z_pochodnia.png"));
    }
    if (on("wbijanie")) {   // stuck in the ground by hand: O, the line, the crouch; he walks off and back; O - taken up again
        await home(2);
        await t.eval("Torch.state().planted = []; $gamePlayer._torchCam = $gamePlayer.updateScroll; $gamePlayer.updateScroll = function(){}; 0");   // (the camera stays)
        const fixed = async (i) => {
            const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: 640 - 230, y: 378 - 150, width: 460, height: 230, scale: 1 } });
            fs.writeFileSync(path.join(DIR, "wbijanie_" + String(i).padStart(2, "0") + ".png"), Buffer.from(r.data, "base64"));
        };
        let k = 0;
        const run = async (n, every) => { for (let i = 0; i < n; i++) { await fixed(k++); await t.frames(every); } };
        await run(4, 4);
        await t.press("ok");               // the ground's menu
        await t.frames(10);
        await run(5, 4);
        await t.press("ok");               // "Wbij pochodnię w ziemię"
        await run(12, 3);
        await t.eval("Input._currentState.right = true; 0");
        await run(10, 3);
        await t.eval("Input._currentState.right = false; 0");
        await run(10, 4);
        await t.eval("Input._currentState.left = true; 0");
        await run(10, 3);
        await t.eval("Input._currentState.left = false; 0");
        await t.eval(`$gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(2); 0`);
        await run(4, 4);
        await t.press("ok");               // taken up
        await run(14, 3);
        await t.eval("$gamePlayer.updateScroll = $gamePlayer._torchCam; delete $gamePlayer._torchCam; 0");
        console.log("SHOT wbijanie", k);
    }
    if (on("praca")) {
        await home(2);
        await t.eval(`$gamePlayer.startToolSwing(ChoppableTree.swingKindOf("Swing_Crouch"), null, null); 0`);
        await t.frames(18);
        await t.shot(path.join(DOCS, "praca_pochodnia_wbita.png"));
        await t.until("!$gamePlayer._swingEvent", 5, 50);
        for (let i = 0; i < 12; i++) { await clip("praca", i, 200, 160); await t.frames(3); }
    }
    if (on("deszcz")) {
        await home(2);
        await t.eval("$gameScreen.changeWeather('rain', 6, 1); 0");
        await t.frames(30);
        await t.shot(path.join(DOCS, "deszcz_noc.png"));
        await t.eval("$gameScreen.changeWeather('none', 0, 1); 0");
        await t.frames(10);
    }
    if (on("dzien")) {
        await t.eval("Torch.state().left = 99; 0");
        await t.setHour(12);
        await home(3);
        await t.frames(20);
        await t.shot(path.join(DOCS, "dzien_z_pochodnia.png"));
    }
});
