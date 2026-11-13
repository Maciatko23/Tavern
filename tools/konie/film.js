// Frame captures of the horses from the game (the ticker stopped, Graphics._onTick stepped by hand): the drinking at the trough, a walk, a graze.
// Writes the full-screen frames to OUT/<clip>_NNN.png; tools/konie/film.py crops them into strips and GIFs.
//   CDP_PORT=9601 OUT=<dir> node tools/konie/film.js
const kit = require("../../tests/lib/kit.js");
const fs = require("fs");
const OUT = process.env.OUT || "C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/docs/konie/film";
fs.mkdirSync(OUT, { recursive: true });
kit.test({ port: Number(process.env.CDP_PORT) || 9601, bootCheck: "gra startuje", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    await t.newGame({ map: 8, x: 69, y: 18, dir: 2, day: 40, hour: 12, quiet: true, minimap: false });
    await t.eval("$gameScreen.clearWeather(); $gamePlayer.setOpacity(0); for (const e of Konie.horses()) e._k && 0; 0");
    await t.frames(90);
    await t.eval(`(function(){ Konie.setAuto(false); const F = [[2, 76, 20], [0, 76, 22], [1, 76, 16]]; return 0; })()`);
    await t.eval("Graphics._app.ticker.stop(); 0");
    const step = k => t.eval(`(() => { for (let i = 0; i < ${k}; i++) Graphics._onTick(1); })(); 0`);
    const clip = async (name, n, k) => { for (let i = 0; i < n; i++) { await t.shot(OUT + "/" + name + "_" + String(i).padStart(3, "0") + ".png"); await step(k); } };
    const park = async keep => { for (let i = 0; i < 5; i++) if (i !== keep) await t.eval(`Konie.pose(${i}, 76, ${12 + i * 2}, 6, "stand"); 0`); await step(2); };
    // drinking: the siwy at the trough, from the head going down to the head up again
    await park(1);
    await t.eval("Konie.pose(1, 63, 18, 4, 'drink'); 0");
    await step(10);
    await clip("pije", 46, 7);
    // the step back after drinking (auto on for this horse only, the others stand parked): the clip's last frames, then the step east still facing the trough
    await park(1);
    await t.eval("(function(){ Konie.pose(1, 63, 18, 4, 'drink'); const e = Konie.horses()[1]; e._k.si = e._k.seq.length - 9; e._k.mode = 'drink'; Konie.setAuto(true); })(); 0");
    await step(2);
    await clip("cofa", 44, 5);
    await t.eval("Konie.setAuto(false); 0");
    // grazing: the bay
    await park(0);
    await t.eval("Konie.pose(0, 68, 18, 6, 'graze'); 0");
    await step(6);
    await clip("pasie", 34, 8);
    // walking: the black, 4 cells east (auto on for the one horse only: its walk is driven by the mind, so a plain walk command)
    await park(2);
    await t.eval("(function(){ Konie.pose(2, 66, 18, 6, 'stand'); const e = Konie.horses()[2]; e._k.mode = 'walk'; e._k.steps = 4; e._k.heading = 6; Konie.setAuto(true); })(); 0");
    await clip("idzie", 36, 6);
    await t.eval("Graphics._app.ticker.start(); 0");
});
