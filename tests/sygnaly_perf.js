// W19 "Sygnały z młyna": the heaviest scenes at 4x CPU throttle, best of 3 (frames in 3 s), interleaved A/B in ONE page:
//   A = the same moment without the thread (Mlyn.debugGo(0): the sails turn on their own, nobody in the cove), B = with it.
//   scenes: the town at the mill at 19:35 (the sails held in a pose, the lookout's yard), the cove at night (the boat, the people, 5 lights),
//   the mill interior, the lantern mini-game, the pose mini-game.
// Run: CDP_PORT=9442 node tests/sygnaly_perf.js [--base]   (--base: no overlay, the live game; only the A rows)
const kit = require("./lib/kit.js");
const BASE = process.argv.includes("--base");
kit.test({ port: 9442, overlay: BASE ? null : "tools/sygnaly/overlay", overlayJs: !BASE, bootCheck: "gra się uruchamia" }, async t => {
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
    await t.newGame({ story: true, skipIntro: true, map: 8, x: 97, y: 91, dir: 8, day: 28, hour: 19.6, quiet: true, minimap: false });
    await t.frames(120);
    const rows = [];
    const scene = async (label, setup, withThread) => {
        if (!BASE) await t.eval(withThread ? "Mlyn.debugGo(5); Mlyn.stan().ch4.soj = 'wit'; 0" : "Mlyn.debugGo(0); Mlyn.forced(null); 0");
        await setup(withThread);
        return fps(label + (withThread ? " (B: z wątkiem)" : " (A: bez)"));
    };
    const scenes = [
        ["miasto przy młynie, 19:35 (skrzydła w pozie)", async () => { await t.go(8, 97, 91, 8); await t.setDay(28, 19.6); await t.frames(150); }],
        ["zatoczka nocą (łódź, ludzie, światła)", async w => { await t.eval("Wyspa.forceTide('high'); 0"); if (!BASE && w) await t.eval("Mlyn.stan().ch4.set = $gameSystem._dayNightDay; 0"); await t.go(8, 97, 92, 8); await t.setDay(29, 1.6); await t.go(125, 19, 66, 4); await t.frames(200); }],
        ["wnętrze młyna", async () => { await t.go(217, 7, 13, 8).catch(() => 0); await t.setDay(28, 19.6); await t.frames(100); }]
    ];
    const res = [];
    for (const [label, setup] of scenes) {
        if (BASE && label.indexOf("wnętrze") >= 0) continue;
        const a = await scene(label, setup, false);
        const b = BASE ? a : await scene(label, setup, true);
        const a2 = await scene(label, setup, false);
        const b2 = BASE ? a : await scene(label, setup, true);
        const A = Math.max(a, a2), B = Math.max(b, b2);
        res.push({ label, A, B, d: (B / A - 1) * 100 });
        console.log("PERF A/B " + label + ": A " + A.toFixed(1) + " fps, B " + B.toFixed(1) + " fps, " + ((B / A - 1) * 100).toFixed(1) + "%");
    }
    if (!BASE) {
        await t.eval("Mlyn.debugGo(5); 0");
        await t.go(125, 19, 66, 4);
        await t.eval("Tawerna.ui.open(Mlyn.Scene_Latarnia, { szanse: 2 }); 0");
        await t.frames(60);
        await fps("mini-gra Rozmowa światłami");
        await t.eval("SceneManager._scene.end({ ok: false }); 0");
        await t.frames(20);
        await t.go(217, 22, 10, 4);
        await t.setDay(41, 19.6);
        await t.eval("Mlyn.stan().ch4.walenty = 1; Mlyn.stan().ch4.jasiek = 'pomoc'; Mlyn.stan().ch4.soj = 'wit'; Mlyn.stan().ch4.noc = Mlyn.wieczorDzien(); 0");
        await t.eval("Tawerna.ui.open(Mlyn.Scene_Poza, {}); 0");
        await t.frames(60);
        await fps("mini-gra Hamulec skrzydeł");
    }
    const worst = Math.min(...res.map(r => r.d));
    console.log("PERF worst B vs A: " + worst.toFixed(1) + "%");
});
