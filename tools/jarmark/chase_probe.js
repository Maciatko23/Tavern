// the chase alone (quick): the state set, the ambush, the roofs, the bot; pictures to docs/zadania_nowe/jarmark_gra/poscig_*
const kit = require("../../tests/lib/kit.js"); const path = require("path");
const SH = path.resolve(__dirname, "../../docs/zadania_nowe/jarmark_gra");
kit.test({ port: Number(process.env.CDP_PORT) || 9462, overlay: "tools/jarmark/overlay", overlayJs: true, errorCheck: "bez błędów" }, async t => {
    const J = e => t.json(e), shot = n => t.shot(path.join(SH, n + ".png"));
    await t.newGame({ map: 8, x: 46, y: 108, dir: 8, hour: 23.6, quiet: true, minimap: false, day: 52 });
    await t.eval("(function(){ const s = Jarmark.S(); s.z = 1; s.otw = 1; s.przed.kradziez = 1; s.slady = { gablota: 1, cech: 1, laznia: 1 }; })()");
    await t.eval("$gamePlayer.requestMapReload(); 0"); await t.go(8, 46, 108, 8); await t.frames(60);
    await t.eval("Jarmark_Sceny.pogonStart(); 0");
    await t.until("Jarmark_Sceny.roof.on", 30, 200); await t.frames(90);
    const key = (n, on) => t.eval(`Input._currentState[${JSON.stringify(n)}] = ${on}; 0`);
    const rel = () => t.eval(`["up","down","left","right"].forEach(k => Input._currentState[k] = false); 0`);
    async function idz(tx, ty, max = 600) {
        for (let i = 0; i < max; i++) {
            const p = await J("({ rx: $gamePlayer._realX, ry: $gamePlayer._realY })");
            const dx = tx - p.rx, dy = ty - p.ry;
            if (Math.abs(dx) < 0.12 && Math.abs(dy) < 0.12) { await rel(); return true; }
            await t.eval(`["up","down","left","right"].forEach(k => Input._currentState[k] = false); ${dx > 0.12 ? 'Input._currentState.right = true;' : dx < -0.12 ? 'Input._currentState.left = true;' : ''} ${dy > 0.12 ? 'Input._currentState.down = true;' : dy < -0.12 ? 'Input._currentState.up = true;' : ''} 0`);
            await t.frames(1);
        }
        await rel(); return false;
    }
    const ok = async () => { await t.eval("Input._currentState.ok = true; Input._latestButton = 'ok'; Input._pressedTime = 0; 0"); await t.frames(2); await t.eval("Input._currentState.ok = false; 0"); };
    const st = () => J("({ x: $gamePlayer._x, y: $gamePlayer._y, roof: Jarmark_Sceny.roof.cells.has($gamePlayer._y * 1000 + $gamePlayer._x), u: Jarmark.S().pogon.upadki, ph: Jarmark_Sceny.roof.phase, sx: $gameMap.event(4882) && $gameMap.event(4882).x, sy: $gameMap.event(4882) && $gameMap.event(4882).y })");
    console.log("start", JSON.stringify(await st())); await shot("poscig_1_start");
    await idz(40, 98); await shot("poscig_2_duzy_dom");
    await idz(41, 97);
    await t.eval("Input._currentState.right = true; Input._currentState.up = true; 0"); await ok(); await t.frames(40); await rel();
    console.log("po skoku 1", JSON.stringify(await st())); await shot("poscig_3_kamienica1");
    await idz(46, 96); await shot("poscig_4_kamienica2");
    await idz(47, 96);
    await shot("poscig_4b_przed_skokiem");
    await t.eval("Input._currentState.down = true; 0"); await t.frames(1);
    await t.eval("Input._currentState.ok = true; Input._latestButton = 'ok'; Input._pressedTime = 0; 0"); await t.frames(2); await t.eval("Input._currentState.ok = false; Input._currentState.down = false; 0");
    for (let i = 1; i <= 6; i++) { await shot("skok_klatka_" + i); await t.frames(4); }
    await t.frames(30); await rel();
    console.log("po skoku 2", JSON.stringify(await st())); await shot("poscig_6_dzwonnica");
    await idz(46, 102);
    await t.frames(200);
    console.log("meta", JSON.stringify(await st()), JSON.stringify(await J("({ ph: Jarmark_Sceny.roof.phase, busy: $gameMessage.isBusy(), run: $gameMap.isEventRunning() })")));
    await shot("poscig_7_meta");
});
