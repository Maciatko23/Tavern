// Records Act III's siege of the tavern frame by frame (the game held still between the pictures) for the GIFs in docs/akt3/.
//   CDP_PORT=9470 node tools/act3/record.js <scene> <out folder> [frames] [every] [lead]
// scene: outside (the yard at night: the townsfolk, Grum, Rafał and Marek against wave 2, the fires on the front) |
//        inside (the tavern: the commander of the diggers through the front door, Grum by the hero, Borgar at the old door).
// Act3.js and Act3_Data.js are put into the page when js/plugins.js does not list them yet. Pictures <out>/f_000.png ... and
// info.json (the hero's place on the screen); tools/humans/make_gif.py crops and joins them.
const path = require("path"), fs = require("fs");
const kit = require(path.join(__dirname, "..", "..", "tests", "lib", "kit.js"));
const [scene, outDir, framesArg, everyArg, leadArg] = process.argv.slice(2);
const N = Number(framesArg) || 120, EVERY = Number(everyArg) || 3, LEAD = Number(leadArg) || 0;

kit.test({ port: 9470, plugins: ["Act3_Data", "Act3"] }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true });
    await t.eval(`(function(){ $gameSystem._minimapHidden = true; Underground.state().deepest = 50; Underground.open(); Combat.gainXp(6000, 'gif');
        const f = TownQuests.state().flags; Object.assign(f, { grumAlly: 1, ambrozyTrust: 1, marekSaved: 1, rafalAlly: 1 }); TownQuests.state().opinion = 72;
        window.__god = setInterval(() => $gameParty.leader() && $gameParty.leader().recoverAll(), 100); Act3.DATA.PACE.gap = 60; return 0; })()`);
    let cam;
    if (scene === "inside") {
        await t.go(1, 50, 43, 2);
        await t.setHour(22.5);
        await t.eval("Act3.debugStart({ wave: 3 }); 0");
        await t.until("Act3.live().some(h => !h._dead && h._label === 'Dowódca kopaczy')", 30);
        cam = [50, 45];
    } else {
        await t.go(8, 15, 19, 6, { calm: false });
        await t.setHour(22);
        await t.eval("Act3.debugStart(); Act3.damage(40); 0");
        await t.until("Act3.siege() && Act3.siege().wave === 1 && Act3.live().length > 0 && Act3.defenders().length >= 6", 60);
        cam = [23, 19];
    }
    await t.eval(`$gameMap.setDisplayPos(${cam[0]} - 13, ${cam[1]} - 7); 0`);
    if (LEAD) await t.frames(LEAD);
    fs.mkdirSync(outDir, { recursive: true });
    for (let i = 0; i < N; i++) {
        await t.eval(`$gameMap.setDisplayPos(${cam[0]} - 13, ${cam[1]} - 7); 0`);
        await t.shot(path.join(outDir, "f_" + String(i).padStart(3, "0") + ".png"));
        await t.frames(EVERY);
    }
    const hero = await t.json("[Math.round($gamePlayer.screenX()), Math.round($gamePlayer.screenY())]");
    fs.writeFileSync(path.join(outDir, "info.json"), JSON.stringify({ hero, scene }));
    console.log("frames", N, "hero", hero);
});
