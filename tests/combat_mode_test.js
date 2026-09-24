// The two modes (Combat.js): normal - O = OK / action, P = cancel / menu, Enter and Esc as well, [ ] nothing; combat (Tab) - on the map O attacks
// like "[" and P guards like "]", Enter and Esc do nothing; in messages and menus all four work as always; the mode is saved.
const { launch, sleep } = require("./cdp.js");
const OUT = process.argv[2] || "";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(4, 29, 9, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===4").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); Hunting.auto(false); if (window.Birds) Birds.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameSystem.setDayNightHour(12); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const down = code => ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`);
        const up = code => ev(`Input._onKeyUp({ keyCode: ${code} }); 0`);
        const key = async (code, hold = 3) => { await down(code); await frames(hold); await up(code); await frames(4); };
        const O = 79, P = 80, TAB = 9, ENTER = 13, ESC = 27, LB = 219, RB = 221, R = 82;
        const scene = () => ev("SceneManager._scene.constructor.name");
        // what a key held down means this frame
        const reads = async code => { await down(code); await frames(2); const r = await J(`({ ok: Input.isPressed("ok"), escape: Input.isPressed("escape"), shoot: Input.isPressed("shoot"), block: Input.isPressed("block") })`); await up(code); await frames(4); return r; };

        // ================= normal mode =================
        check("a new game starts in the normal mode", (await ev("Combat.combatMode()")) === false);
        await ev("$gameSystem.disableMenu(); 0");   // (only reading the keys here: no menu opening in between)
        const nO = await reads(O), nP = await reads(P), nE = await reads(ENTER), nS = await reads(ESC);
        await ev("$gameSystem.enableMenu(); 0");
        await frames(10);
        check("normal mode on the map: O and Enter are OK, P and Esc cancel / menu; none of them attacks or guards", nO.ok && !nO.shoot && nP.escape && !nP.block && nE.ok && nS.escape, { nO, nP, nE, nS });
        await key(P);
        await frames(20);
        check("P opens the menu", (await scene()) === "Scene_Menu");
        await key(P);
        for (let i = 0; i < 30 && (await scene()) !== "Scene_Map"; i++) await frames(3);
        await frames(20);

        // ================= Tab: combat mode =================
        await key(TAB);
        await frames(4);
        const on = await J("({ mode: Combat.combatMode(), badge: SceneManager._scene._modeBadge.visible })");
        const badgeY = await ev("SceneManager._scene._modeBadge.y");
        const op = []; for (let i = 0; i < 6; i++) { op.push(await ev("SceneManager._scene._modeBadge.opacity")); await frames(8); }
        check("Tab: combat mode on, the 'Tryb walki' label at the top of the screen, pulsing", on.mode === true && on.badge === true && badgeY < 60 && Math.max(...op) - Math.min(...op) > 60, { on, badgeY, op });
        if (OUT) await b.shot(OUT + "combat_mode.png");
        const cO = await reads(O), cP = await reads(P), cE = await reads(ENTER), cS = await reads(ESC);
        check("combat mode on the map: O attacks, P guards; neither is OK or cancel; Enter and Esc do nothing", cO.shoot && !cO.ok && cP.block && !cP.escape && !cE.ok && !cS.escape && !cE.shoot, { cO, cP, cE, cS });
        await ev("Combat.resetAct(); 0");
        await key(O, 4);
        const blow = await J("({ mode: Combat.act.mode, swinging: $gamePlayer.isToolSwinging(), hand: Combat.hand() })");
        check("O swings (the fists here: no weapon)", blow.mode === "attack" && blow.swinging && blow.hand === "m0", blow);
        await frames(40);
        await ev("Combat.resetAct(); 0");
        await down(P); await frames(6);
        const guard = await J("({ mode: Combat.act.mode })");
        await up(P); await frames(6);
        check("P held: the guard is up", guard.mode === "block", guard);
        await key(ESC); await key(ENTER);
        await frames(20);
        check("Esc and Enter: no menu opens, nothing happens", (await scene()) === "Scene_Map" && (await ev("Combat.act.mode")) === "idle");
        // [ and ] switch the weapon (here: the club and the fists), R does nothing; the plate in the corner shows in this mode
        await ev("$gameParty.gainItem($dataItems[156], 1); 0");
        await frames(4);
        const h0 = await ev("Combat.hand()");
        await key(R);
        const hR = await ev("Combat.hand()");
        await key(RB);
        const h1 = await ev("Combat.hand()");
        await key(LB);
        const h2 = await ev("Combat.hand()");
        const plateOn = await ev("SceneManager._scene._weaponPlate.visible");
        check("] and [ switch the weapon in the combat mode, R does nothing; the weapon plate shows", hR === h0 && h1 !== h0 && [h0, h1].sort().join() === "m0,m156" && h2 === h0 && plateOn, { h0, hR, h1, h2, plateOn });

        // ================= a message in combat mode: O and P, Enter and Esc work as always =================
        // (each key is read while the message is on screen; then it is pressed until the message is gone)
        const inMessage = async code => {
            await ev("$gameMessage.add('Test'); 0");
            for (let i = 0; i < 40 && !(await ev("$gameMessage.isBusy() && !!SceneManager._scene._messageWindow && SceneManager._scene._messageWindow.isOpen()")); i++) await frames(2);
            await down(code); await frames(2);
            const r = await J(`({ busy: $gameMessage.isBusy(), ok: Input.isPressed("ok"), shoot: Input.isPressed("shoot"), mode: Combat.act.mode })`);
            await up(code); await frames(4);
            for (let i = 0; i < 20 && (await ev("$gameMessage.isBusy()")); i++) await key(code, 3);
            r.closed = !(await ev("$gameMessage.isBusy()"));
            await frames(10);
            return r;
        };
        const mE = await inMessage(ENTER), mO = await inMessage(O);
        check("during a message Enter and O are OK again (O does not attack) and they close it", mE.busy && mE.ok && mE.closed && mO.busy && mO.ok && !mO.shoot && mO.closed && mO.mode === "idle", { mE, mO });

        // ================= back to normal, and the mode is saved =================
        await key(TAB);
        check("Tab again: the normal mode, the label gone", (await ev("Combat.combatMode()")) === false && !(await ev("SceneManager._scene._modeBadge.visible")));
        const hN = await ev("Combat.hand()");
        await key(RB); await key(LB);
        const nLB = await reads(LB), nRB = await reads(RB);
        check("in the normal mode [ and ] do nothing (no switch, no attack, no guard) and the plate is hidden", (await ev("Combat.hand()")) === hN && !nLB.shoot && !nLB.block && !nRB.shoot && !nRB.block && !(await ev("SceneManager._scene._weaponPlate.visible")), { nLB, nRB });
        await key(TAB);
        await ev("$gameSystem.onBeforeSave(); window.__save = JsonEx.stringify(DataManager.makeSaveContents()); $gameSystem._combatMode = false; DataManager.extractSaveContents(JsonEx.parse(window.__save)); 0");
        check("the mode is kept in a save", (await ev("Combat.combatMode()")) === true);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
