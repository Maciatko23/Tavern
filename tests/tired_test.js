// Tired out (Combat.js): below 20% of the strength the hero says "Zmęczyłem się..." (once, again only after being above it), walks and
// runs at half the speed and works (chops, digs, mines, builds) at half the speed; back above 20% all is as before.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const S = () => J(`({ tired: Combat.tired(), walk: $gamePlayer.realMoveSpeed(), work: Math.round(Combat.workSpeed() * 100) / 100, said: SpeechBubbles.log.filter(t => t === "Zmęczyłem się...").length })`);
        // a free row to walk along
        const R = await J(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.isPassable(x, y, 6) && $gameMap.isPassable(x, y, 4) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y);
            for (let y = 3; y < $gameMap.height() - 3; y++) for (let x = 2; x < $gameMap.width() - 12; x++) {
                let ok = true;
                for (let i = 0; i < 10 && ok; i++) ok = free(x + i, y) && free(x + i, y - 1) && free(x + i, y + 1);
                if (ok) return { x, y };
            }
            return null; })()`);
        const walk = async () => {
            await ev(`$gamePlayer.locate(${R.x + 1}, ${R.y}); 0`); await frames(4);
            const x0 = await ev("$gamePlayer._realX");
            await ev("Input._currentState.right = true; 0"); await frames(60); await ev("Input._currentState.right = false; 0"); await frames(4);
            return (await ev("$gamePlayer._realX")) - x0;
        };

        await frames(60);
        const s0 = await S();
        check("rested (100%): not tired, the usual speeds, nothing said", !s0.tired && s0.walk === 3.75 && s0.work === 1 && s0.said === 0, s0);
        const d0 = await walk();

        await ev("$gameSystem.setStamina(15); 0");
        await frames(30);
        const s1 = await S();
        check("below 20% (15): 'Zmęczyłem się...' in a bubble over him", s1.tired && s1.said === 1, s1);
        await b.shot("tired.png");
        check("...he walks at half the speed (3.75 -> 2.75) and works at half the speed", s1.walk === 2.75 && s1.work === 0.5, s1);
        const d1 = await walk();
        check("...really: 60 frames of walking take him half as far", Math.abs(d1 - d0 / 2) < 0.2, { rested: d0, tired: d1 });
        await frames(60);
        check("it is said once, not again while he stays tired", (await S()).said === 1);

        await ev("$gameSystem.setStamina(50); 0");
        await frames(20);
        const s2 = await S();
        check("rested again (50%): the usual speeds", !s2.tired && s2.walk === 3.75 && s2.work === 1, s2);
        await ev("$gameSystem.setStamina(10); 0");
        await frames(20);
        check("tired out once more: he says it again", (await S()).said === 2);
        await ev("$gameSystem.setStamina(100); 0");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
