// Records a fight with a creature of the ruins frame by frame (the game held still between the pictures) for a GIF of its animations.
//   CDP_PORT=9465 node tools/creatures/record.js <scene> <out folder> [frames] [every]
// scene: a kind (szczur, pajak, zbroja, nietoperz, topielec, kamiennik, upior, cien), "zbroja_fall", "kamiennik_charge", or a boss
// (boss_20 ... boss_90, guardian). The hero cannot be hurt (the recording is about the creature). Pictures: <out>/f_000.png ...;
// tools/humans/make_gif.py crops and joins them.
const path = require("path");
const fs = require("fs");
const kit = require(path.join(__dirname, "..", "..", "tests", "lib", "kit.js"));
const [scene, outDir, framesArg, everyArg] = process.argv.slice(2);
const N = Number(framesArg) || 90, EVERY = Number(everyArg) || 2;

kit.test({ port: 9465 }, async t => {
    await t.newGame({ map: 4, x: 20, y: 14, hour: 10, quiet: true });
    await t.eval(`(function(){ $gameSystem._minimapHidden = true; Hunting.RAID.perHour = 0; Creatures.auto(false); $gameParty.leader().recoverAll(); $gameSystem._combatMode = true;
        const _hp = Combat.hitPlayer; Combat.hitPlayer = o => _hp(Object.assign({}, o, { damage: 0 })); return 0; })()`);
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        let best = null;
        for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 8; x < $gameMap.width() - 8; x++) {
            let ok = true;
            for (let dx = -7; dx <= 7 && ok; dx++) for (let dy = -3; dy <= 3; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok && (!best || Math.abs(x - $gameMap.width() / 2) < Math.abs(best.x - $gameMap.width() / 2))) best = { x, y };
        }
        return best || { x: $gamePlayer.x, y: $gamePlayer.y }; })()`);
    const cx = room.x, cy = room.y;
    await t.eval(`$gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(6); $gameMap.setDisplayPos(${cx} - 13, ${cy} - 7); 0`);
    // (no rain in the picture: a GIF of falling drops is many megabytes)
    await t.eval(`(function(){ if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.changeWeather('none', 0, 0); if ($gameTemp._topNotices) $gameTemp._topNotices.length = 0;
        for (const c of (SceneManager._scene._spriteset && SceneManager._scene._spriteset._cloudSprites) || []) { c.opacity = 0; c.update = function() {}; }   // (nor the clouds' shadows)
        return 0; })()`);
    const setups = {
        szczur: `window.__c = Creatures.spawn('szczur', ${cx + 3}, ${cy}, { level: 3, engaged: true, count: 4 });`,
        pajak: `window.__c = Creatures.spawn('pajak', ${cx + 5}, ${cy}, { level: 3, engaged: true }); __c._cd.web = 0; __c._gapT = 0;`,
        zbroja: `window.__c = Creatures.spawn('zbroja', ${cx + 2}, ${cy}, { level: 3, engaged: true }); __c._gapT = 30;`,
        zbroja_fall: `window.__c = Creatures.spawn('zbroja', ${cx + 2}, ${cy}, { level: 3, engaged: true }); __c._gapT = 99999; __c._hp = 1; window.__fall = 20;`,
        nietoperz: `window.__c = Creatures.spawn('nietoperz', ${cx + 2}, ${cy}, { level: 3, engaged: true, count: 4 });`,
        topielec: `window.__c = Creatures.spawn('topielec', ${cx + 2}, ${cy}, { level: 3, engaged: true }); __c._gapT = 10;`,
        kamiennik: `window.__c = Creatures.spawn('kamiennik', ${cx + 2}, ${cy}, { level: 3, engaged: true }); __c._gapT = 30; __c._cd.charge = 9999;`,
        kamiennik_charge: `window.__c = Creatures.spawn('kamiennik', ${cx + 6}, ${cy}, { level: 3, engaged: true }); __c._gapT = 30;`,
        upior: `window.__c = Creatures.spawn('upior', ${cx + 4}, ${cy}, { level: 3 }); __c.engage(); __c._modeT = 1;`,
        cien: `window.__c = Creatures.spawn('cien', ${cx + 5}, ${cy}, { level: 3 }); window.__walk = true;`,
        boss_90: `window.__c = Creatures.spawn('boss_90', ${cx + 5}, ${cy}, { level: 5 });`,
        boss_40: `window.__c = Creatures.spawn('boss_40', ${cx + 4}, ${cy}, { level: 5, engaged: true });`,
        boss_80: `window.__c = Creatures.spawn('boss_80', ${cx + 3}, ${cy}, { level: 5, engaged: true });`,
        boss_60: `window.__c = Creatures.spawn('boss_60', ${cx + 3}, ${cy}, { level: 5, engaged: true }); window.__slams = true;`
    };
    const setup = setups[scene] || `window.__c = Creatures.spawn('${scene}', ${cx + 4}, ${cy}, { level: 5, engaged: true });`;
    await t.eval(`(function(){ ${setup} return 0; })()`);
    if (scene === "kamiennik_charge") await t.eval("__c._cd.charge = 0; 0");
    await t.frames(scene === "nietoperz" ? 40 : 6);
    // the game held still between the pictures: SceneManager.updateMain runs only while __allow > 0 (the screen is drawn all the same)
    await t.eval(`window.__allow = 0; const _um = SceneManager.updateMain; SceneManager.updateMain = function() { if (window.__allow > 0) { window.__allow--; _um.call(this); } }; 0`);
    fs.mkdirSync(outDir, { recursive: true });
    const start = await t.json("({ hero: [$gamePlayer.screenX(), $gamePlayer.screenY()] })");
    for (let i = 0; i < N; i++) {
        await t.eval(`window.__allow = ${EVERY}; 0`);
        await t.until("window.__allow === 0", 5, 5);
        // scripted moments: the armour felled (it falls to pieces, then rises); the shadow approached
        if (scene === "zbroja_fall" && i === 6) await t.eval("Creatures.hit(__c, 50, 'melee', { heavy: true, poise: 90 }); __c._modeT = 120; 0");
        if ((scene === "cien" || scene === "boss_90") && i === 10) await t.eval(`$gamePlayer.locate(${cx + 2}, ${cy}); 0`);
        if (scene === "boss_90" && i === 40) await t.eval("__c._hp = Math.round(__c._maxHp * 0.6); 0");
        if (scene === "boss_40" && i === 4) await t.eval("__c._upT = 1; __c.setMode('chase'); 0");
        if (scene === "boss_40" && i === 18) await t.eval("(function(){ __c._pulling = true; const r = Creatures.rings.find(o => o.c === __c && (o.kind === 'shadow' || o.kind === 'thread')); if (r) { r.kind = 'thread'; r.r = 0.9; } return 0; })()");
        if (scene === "boss_80" && i === 4) await t.eval("__c._askT = 1; __c._cd.truth = 99999; __c._hidden = false; __c.setMode('shown', 999); 0");
        if (scene === "boss_60" && i === 4) await t.eval("__c._slams = 1; __c._gapT = 0; 0");
        if (scene === "boss_20" && i >= 8 && i <= 20 && i % 4 === 0) await t.eval("(function(){ const R = __c._circle; if (R) $gamePlayer.locate(Math.floor(R.x) + 2, Math.floor(R.y) + (($gamePlayer.y + 1) % 2)); return 0; })()");
        await t.wait(30);
        await t.shot(path.join(outDir, "f_" + String(i).padStart(3, "0") + ".png"));
    }
    const info = Object.assign(await t.json("({ end: [$gamePlayer.screenX(), $gamePlayer.screenY()], mode: window.__c ? __c._mode : null })"), start);
    fs.writeFileSync(path.join(outDir, "info.json"), JSON.stringify(info));
    console.log("recorded", N, "pictures", JSON.stringify(info));
});
