// (2026-11-25, the player: "po zmianie ekwipunku i potem rozmowa nadal jest chwilowe potężne spowolnienie") the frames after a change
// of clothes, the map made again (as after the menu) and a talk opened: how long each frame takes and which sheets were dressed then.
// Run: CDP_PORT=9763 node tests/ubior_lag_probe.js
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const JP = async e => JSON.parse(await ev("(" + e + ").then(r => JSON.stringify(r))"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(218, 27, 26, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===218").catch(() => false)) break; await sleep(500); }
        await sleep(4000);
        for (const round of [1, 2]) {
            const r = await JP(`new Promise(res => {
                // a shirt and trousers of the clothes (Ubior notes), on and off by turns
                const items = $dataItems.filter(it => it && /<Ubior:(tors|nogi)/.test(it.note || ""));
                const tors = items.find(it => /<Ubior:tors/.test(it.note)), nogi = items.find(it => /<Ubior:nogi/.test(it.note));
                for (const it of [tors, nogi]) if (it) $gameParty.gainItem(it, 1);
                const slotOf = it => (Equipment.SLOTS.find(s => (it.note || "").includes("<Ubior:" + (s.part || s.key || s.id))) || {}).key;
                const s0 = Ubior.stats().length;
                const on = ${round} === 1;
                try { if (tors) Equipment.equip("torso", on ? tors.id : 0); if (nogi) Equipment.equip("legs", on ? nogi.id : 0); } catch (e) { console.error(e); }
                // the map made again, as after the menu
                SceneManager.push(Scene_Menu);
                setTimeout(() => {
                    SceneManager.pop();
                    const wait = setInterval(() => {
                        if (SceneManager._scene.constructor.name !== "Scene_Map" || SceneManager.isSceneChanging()) return;
                        clearInterval(wait);
                        // a talk
                        setTimeout(() => {
                            $gameMessage.add("Próba rozmowy po zmianie ubrania - czy coś się zacina?");
                            const times = []; let last = performance.now(), n = 0;
                            const tick = now => { times.push(+(now - last).toFixed(1)); last = now; if (++n < 150) requestAnimationFrame(tick); else done(); };
                            requestAnimationFrame(tick);
                            const done = () => {
                                const st = Ubior.stats().slice(s0);
                                res({ tors: tors && tors.name, nogi: nogi && nogi.name, worn: Equipment.worn ? Equipment.worn() : null, max: Math.max(...times), over20: times.filter(t => t > 20).length, over34: times.filter(t => t > 34).length,
                                    times: times.join(" "), dressed: st.map(s => s.sheet + ":" + s.ms).join(" "), sum: +st.reduce((a, s) => a + s.ms, 0).toFixed(1), steps: (window.__ubiorSteps || []).map(x => x.n + " d" + x.dressed + " max " + Math.max(...x.steps) + " [" + x.steps.join(",") + "]").join(" | ") }); window.__ubiorSteps = [];
                                $gameMessage.clear();
                            };
                        }, 300);
                    }, 16);
                }, 600);
            })`);
            console.log("ROUND " + round, JSON.stringify(r, null, 1));
            await sleep(3000);
        }
    } catch (e) { console.log("ERR " + e.message); }
    finally { await b.close(); process.exit(0); }
})();
