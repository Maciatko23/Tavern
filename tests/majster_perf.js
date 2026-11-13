// W22 "Majstersztyk": the heaviest scenes at 4x CPU throttle, best of 3 (frames in 3 s): the market on a normal day, the market on the exam day
// (the tribune's 4 props + the commission and 5 residents held), the Cech interior by day, the Cech at night (Ludwik with a lamp), the mini-game.
// Run: CDP_PORT=9932 node tests/majster_perf.js [--base]   (--base: no overlay, the live game; the exam day then needs no Majster)
const kit = require("./lib/kit.js");
const BASE = process.argv.includes("--base");
kit.test({ port: 9932, overlay: BASE ? null : "tools/majstersztyk/overlay", overlayJs: !BASE, bootCheck: "gra się uruchamia" }, async t => {
    const fps = async label => {
        const best = [];
        for (let i = 0; i < 3; i++) {
            const n0 = await t.eval("Graphics.frameCount");
            const c0 = Date.now();
            await t.wait(3000);
            const n1 = await t.eval("Graphics.frameCount");
            best.push((n1 - n0) / ((Date.now() - c0) / 1000));
        }
        const r = Math.max(...best);
        console.log("PERF " + label + ": " + r.toFixed(1) + " fps (best of 3: " + best.map(x => x.toFixed(1)).join(", ") + ")");
        return r;
    };
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await t.newGame({ story: true, skipIntro: true, map: 8, x: 60, y: 50, dir: 8, day: 27, hour: 12.5, quiet: true, minimap: false });
    await t.frames(120);
    await fps("rynek, zwykły dzień");
    if (!BASE) {
        await t.eval("Majster.debugGo(3); Majster.stan().egz.dzien = $gameSystem._dayNightDay; 0");
        await t.go(8, 60, 49, 8);
        await t.frames(240);
        await fps("rynek, dzień egzaminu (trybuna + komisja trzymana)");
        await t.go(215, 7, 12, 8);
        await t.frames(100);
        await fps("Cech, dzień");
        await t.setHour(22.5);
        await t.eval("Majster.debugGo(2); Majster.stan().sab.stan = 1; Majster.stan().polka = { etap: 3, dzien: $gameSystem._dayNightDay - 1, godz: 9 }; Majster.stan().ludwik.przyjazd = 3; 0");
        await t.go(215, 8, 10, 8);
        await t.frames(300);
        await fps("Cech, noc (Ludwik z lampą)");
        await t.eval("Tawerna.ui.open(Majster.Scene_Szlify, { seed: 3 }); 0");
        await t.frames(60);
        await fps("mini-gra Ostatnie szlify");
    }
});
