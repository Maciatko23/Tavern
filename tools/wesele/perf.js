// the hall's frame time (ms per drawn frame) at 4x CPU throttle: the ordinary evening (Goscie_Sala's guests) vs the wedding (18 seated guests, decorations,
// candles) vs the brawl (8 fighters). The states are measured in turns (3 rounds, each best of 3 x 120 frames) - the machine's load drifts - and the best of each is told.
const kit = require("../../tests/lib/kit.js");
kit.test({ port: 9944, overlay: process.env.GAME_OVERLAY ? undefined : "tools/wesele/overlay", overlayJs: true }, async t => {
    const J = e => t.json(e);
    await t.newGame({ map: 1, x: 14, y: 40, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const meas = async () => { let best = 1e9; for (let r = 0; r < 3; r++) { await t.frames(30); const ms = await J("new Promise(res => { const t0 = performance.now(); let n = 0; const f = () => { if (++n >= 120) res((performance.now() - t0) / 120); else requestAnimationFrame(f); }; requestAnimationFrame(f); })"); best = Math.min(best, ms); } return best; };
    const best = { normal: 1e9, wedding: 1e9, brawl: 1e9 };
    await t.eval(kit.DRIVER + "; 0");
    for (let round = 0; round < 3; round++) {
        await t.setDay(24, 20.5); await t.calm(); await t.eval("$gamePlayer.requestMapReload(); 0"); await t.go(1, 14, 40, 8); await t.frames(150);
        best.normal = Math.min(best.normal, await meas());
        await t.eval("Wesele.stan().zmus = 1; 0");
        const g = await J("Watki.skocz('wesele', 5)");
        await t.eval("(function(){ const s = Wesele.stan(); s.plan = Object.assign(Wesele.planDobry(), { agata: 5, kuba: 4, mietek: 3, bartek: 2, stefa: 1, rm1: 0 }); s.iskry = -1; })(); $gamePlayer.requestMapReload(); 0"); await t.go(g[0], g[1], g[2], g[3]); await t.calm(); await t.frames(150);
        await t.eval("(function(){ const s = Wesele.stan(); s.iskry = 0; s.plan = Wesele.planDobry(); })(); 0");
        best.wedding = Math.min(best.wedding, await meas());
        await t.eval("Wesele.stan().iskry = -1; Wesele.stan().plan = Object.assign(Wesele.planDobry(), { agata: 5, kuba: 4, mietek: 3, bartek: 2, stefa: 1, rm1: 0 }); 0");
        await t.setDay(22, 22.02);
        await t.eval("window.__drv.on = true; window.__drv.picks = ['Nie robię']; 0");
        for (let i = 0; i < 40; i++) { await t.frames(60); if (await J("Wesele.fighters().length > 0 && !Wesele.scena().on && !$gameMap.isEventRunning()")) break; }
        best.brawl = Math.min(best.brawl, await meas());
    }
    for (const [k, v] of Object.entries(best)) console.log(k, v.toFixed(2), "ms/frame");
    console.log("wedding vs normal: " + ((best.wedding / best.normal - 1) * 100).toFixed(1) + "%, brawl vs normal: " + ((best.brawl / best.normal - 1) * 100).toFixed(1) + "%");
});
