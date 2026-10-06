// Records a fight with the men frame by frame (the game held still between the pictures) for a GIF of their animations.
//   CDP_PORT=9465 node tools/humans/record.js <scene> <out folder> [frames] [every]
// scene: bandit | knifer | archer | merc | camp | surrender | raid. Pictures: <out>/f_000.png ... (the whole screen); tools/humans/make_gif.py crops and joins.
const path = require("path");
const kit = require(path.join(__dirname, "..", "..", "tests", "lib", "kit.js"));
const [scene, outDir, framesArg, everyArg] = process.argv.slice(2);
const N = Number(framesArg) || 90, EVERY = Number(everyArg) || 2;

kit.test({ port: 9465 }, async t => {
    const night = scene === "camp";
    await t.newGame({ map: night ? 21 : 4, x: 20, y: 13, hour: night ? 23 : 10, quiet: true });
    await t.eval("$gameSystem._minimapHidden = true; Hunting.RAID.perHour = 0; $gameParty.leader().recoverAll(); 0");
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        let best = null;
        for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 8; x < $gameMap.width() - 8; x++) {
            let ok = true;
            for (let dx = -6; dx <= 6 && ok; dx++) for (let dy = -2; dy <= 2; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok && (!best || Math.abs(x - $gameMap.width() / 2) < Math.abs(best.x - $gameMap.width() / 2))) best = { x, y };
        }
        return best || { x: $gamePlayer.x, y: $gamePlayer.y }; })()`);
    const cx = room.x, cy = room.y;
    await t.eval(`$gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(6); $gameMap.setDisplayPos(${cx} - 13, ${cy} - 7); 0`);
    const setups = {
        bandit: `window.__h = Humans.spawn('bandit', ${cx + 2}, ${cy}, { level: 1, engaged: true }); __h._band.gapT = 20; __h._def = JSON.parse(JSON.stringify(__h._def)); __h._def.feint = 0;`,
        archer: `window.__h = Humans.spawn('archer', ${cx + 5}, ${cy}, { level: 1, engaged: true }); __h._gapT = 10;`,
        knifer: `window.__h = Humans.spawn('knifer', ${cx + 2}, ${cy}, { level: 1, engaged: true }); __h._band.gapT = 20; __h._def = JSON.parse(JSON.stringify(__h._def)); __h._def.feint = 0; __h._def.blow.combo = 1;`,
        raid: `window.__b = Humans.raidBand(false, { kinds: ['knifer', 'bandit'] }); window.__h = __b && __b.members[0];`,
        merc: `window.__h = Humans.spawn('mercenary', ${cx + 2}, ${cy}, { level: 1, engaged: true }); __h._band.gapT = 20;`,
        surrender: `window.__h = Humans.spawn('bandit', ${cx + 2}, ${cy}, { level: 1 }); __h._def = JSON.parse(JSON.stringify(__h._def)); __h._def.surrender.chance = 1; __h.engage(false); __h._hp = 12; Humans.hit(__h, 2, 'melee', { poise: 1 });`,
        camp: `window.__c = Humans.camp({ size: 4, kinds: ['mercenary', 'archer', 'bandit', 'bandit'], far: 3, near: 6 });`
    };
    await t.eval(`(function(){ ${setups[scene]} return 0; })()`);
    if (scene === "camp") await t.eval("const c = window.__c; if (c) { $gamePlayer.locate(c.x + 3, c.y + 2); $gameMap.setDisplayPos(c.x - 13, c.y - 7); } 0");
    await t.frames(scene === "bandit" || scene === "merc" ? 10 : 4);
    // the game held still between the pictures: SceneManager.updateMain runs only while __allow > 0 (the screen is drawn all the same)
    await t.eval(`window.__allow = 0; const _um = SceneManager.updateMain; SceneManager.updateMain = function() { if (window.__allow > 0) { window.__allow--; _um.call(this); } }; 0`);
    const fs = require("fs");
    fs.mkdirSync(outDir, { recursive: true });
    const start = await t.json("({ hero: [$gamePlayer.screenX(), $gamePlayer.screenY()] })");
    for (let i = 0; i < N; i++) {
        await t.eval(`window.__allow = ${EVERY}; 0`);
        await t.until("window.__allow === 0", 5, 5);
        await t.wait(30);
        await t.shot(path.join(outDir, "f_" + String(i).padStart(3, "0") + ".png"));
    }
    const info = Object.assign(await t.json("({ end: [$gamePlayer.screenX(), $gamePlayer.screenY()], mode: window.__h ? __h._mode : null })"), start);
    fs.writeFileSync(path.join(outDir, "info.json"), JSON.stringify(info));
    console.log("recorded", N, "pictures", JSON.stringify(info));
});
