// Fast forward the watched game (the user, 2026-09-26: "w tle uruchomić 4 razy szybciej, jak będzie dzień 40 - zapisać, i wtedy
// odpalić w oknie zapis"): the save in slot 0 of the watched game's browser profile is loaded in a browser with no window, the
// autopilot plays it SPEED times faster (more updates a drawn frame - the same rules) up to DAY, and the game is saved there (slot 0,
// and a copy in slot 1). Killed on the way: the last autosave is loaded again and it goes on (the deaths are counted).
// Run: CDP_PORT=9334 node fastforward.js [day] [speed]      (the window must be closed: the profile is the same)
const { launch, sleep } = require("../cdp.js");
const { notify } = require("../notify.js");   // (to the phone, when tests/marathon/notify.json is there)
const fs = require("fs"), path = require("path");
const DAY = Number(process.argv[2]) || 40, SPEED = Number(process.argv[3]) || 4;
const PROFILE = process.env.LIVE_PROFILE || "C:/Users/macie/AppData/Local/Temp/claude/c--Users-macie-OneDrive-Dokumenty-RMMZ-Tawerna/23b787ed-862a-4302-9351-932ca8a916ca/scratchpad/edge_live_profile";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1, profile: PROFILE });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout")), 60000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const t0 = Date.now(), mins = () => Math.round((Date.now() - t0) / 60000);
    const loadSave = async slot => {
        await ev(`DataManager.loadGame(${slot}).then(() => { SceneManager._scene && SceneManager._scene.fadeOutAll && SceneManager._scene.fadeOutAll(); $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 0); $gamePlayer.requestMapReload(); SceneManager.goto(Scene_Map); }); 0`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && !SceneManager.isSceneChanging() && !!$gameMap.mapId()").catch(() => false)) break; await sleep(500); }
        await sleep(1000);
    };
    let deaths = 0;
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && SceneManager._scene._commandWindow)").catch(() => false)) break; await sleep(500); }
        if (!(await ev("DataManager.savefileExists(0)"))) throw new Error("no save in slot 0 of the watched game's profile");
        await loadSave(0);
        const start = await J("({ day: $gameSystem.dayNightDay(), hour: +$gameSystem.dayNightHour().toFixed(1), map: $gameMap.mapId() })");
        console.log(`loaded: day ${start.day} ${start.hour}:00 (map ${start.map}) -> playing up to day ${DAY} at x${SPEED}`);
        notify(`Przewijanie: od dnia ${start.day} do dnia ${DAY}, x${SPEED}`, { title: "Tawerna", tags: ["fast_forward"] });
        await ev(fs.readFileSync(path.join(__dirname, "ap.js"), "utf8"));
        await ev(`(function(){ const N = ${SPEED}, orig = SceneManager.determineRepeatNumber; SceneManager.determineRepeatNumber = function(dt) { return orig.call(this, dt) * N; }; return 0; })()`);
        await ev(`$gameSystem._minimapHidden = true; AP.run([["play"]]); 0`);
        let lastDay = start.day, lastFrame = 0, stallAt = Date.now(), dayNote = 0, lastBlds = {}, firstNote = false;
        while (true) {
            await sleep(5000);
            const s = await J(`({ day: $gameSystem.dayNightDay(), hour: +$gameSystem.dayNightHour().toFixed(1), f: Graphics.frameCount, scene: SceneManager._scene && SceneManager._scene.constructor.name,
                err: (document.getElementById("errorPrinter") || {}).innerText || "", free: $gamePlayer.canMove() && !$gamePlayer._toolSwing && !$gameMessage.isBusy() && !$gameTemp._farmMenuOpen,
                bld: ((Farming.farm().buildings || {})[3] || []).filter(b => !b.site).length, lvl: window.Combat && Combat.hero ? Combat.hero().level : 0 })`).catch(e => ({ fail: e.message }));
            if (s.fail) { console.log("the page does not answer:", s.fail); break; }
            if (s.err) { console.log("the game's error:", s.err.slice(0, 300)); break; }
            if (s.scene === "Scene_Gameover") {   // killed: the last autosave again
                deaths++;
                console.log(`  killed on day ${s.day} ${s.hour}:00 - the last autosave again (${deaths})`);
                notify(`Bohater zginął: dzień ${s.day}, ${Math.floor(s.hour)}:00 - wczytuję autozapis (${deaths})`, { title: "Tawerna", tags: ["skull"], priority: 4 });
                await loadSave(0);
                await ev(`AP.stop(); AP.wantPlay = true; AP.queue = [["play"]]; 0`);
                continue;
            }
            if (s.day !== lastDay) {
                console.log(`  day ${s.day} (${mins()} min, ${s.bld} buildings, level ${s.lvl})`); lastDay = s.day;
                dayNote = s.day;   // (the day's message waits for the map: after the night and the day's summary)
            }
            if (dayNote && s.scene === "Scene_Map" && s.free) {
                const d = await J(`({ day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), lvl: window.Combat && Combat.hero ? Combat.hero().level : 0,
                    hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, needs: window.Needs ? [Math.round(Needs.state().food), Math.round(Needs.state().water)] : null,
                    dog: window.Dog && Dog.state().tame ? [Math.round(Dog.state().hp), Math.round(Dog.state().food), Math.round(Dog.state().water), Dog.state().hurtUntil > 0] : null,
                    blds: ((Farming.farm().buildings || {})[3] || []).filter(b => !b.site).map(b => (Farming.BUILDINGS[b.type] || {}).name || b.type),
                    goal: window.AP ? AP.goal || "" : "" })`).catch(() => null);
                if (d) {
                    const fresh = d.blds.filter((n, i) => (lastBlds[n] || 0) < d.blds.slice(0, i + 1).filter(m => m === n).length);
                    lastBlds = {}; for (const n of d.blds) lastBlds[n] = (lastBlds[n] || 0) + 1;
                    const hh = Math.floor(d.hour) + ":" + String(Math.floor((d.hour % 1) * 60)).padStart(2, "0");
                    const text = [`Dzień ${d.day}/${DAY} (${hh}) · poziom ${d.lvl} · życie ${d.hp}/${d.mhp}`,
                        d.needs ? `jedzenie ${d.needs[0]} · woda ${d.needs[1]}` : "",
                        d.dog ? `pies: życie ${d.dog[0]}, jedzenie ${d.dog[1]}, woda ${d.dog[2]}${d.dog[3] ? " (ranny)" : ""}` : "",
                        `budynki (${d.blds.length}): ` + Object.entries(d.blds.reduce((o, n) => (o[n] = (o[n] || 0) + 1, o), {})).map(([n, k]) => k > 1 ? n + " ×" + k : n).join(", "),
                        fresh.length && firstNote ? `nowe: ${fresh.join(", ")}` : "",
                        (d.goal ? `cel: ${d.goal} · ` : "") + `śmierci ${deaths} · ${mins()} min`].filter(Boolean).join("\n");
                    firstNote = true;
                    let file = null;
                    try { const r = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 70 }); file = path.join(__dirname, "day.jpg"); fs.writeFileSync(file, Buffer.from(r.data, "base64")); } catch (e) { file = null; }
                    notify(text, { title: `Tawerna - dzień ${d.day}`, tags: ["calendar"], priority: 2, file });
                }
                dayNote = 0;
            }
            if (s.f !== lastFrame) { lastFrame = s.f; stallAt = Date.now(); } else if (Date.now() - stallAt > 90000) { console.log("the game stopped (no frames for 90 s)"); break; }
            if (s.day >= DAY && s.scene === "Scene_Map" && s.free) {
                await ev(`AP.stop(); 0`);
                await sleep(500);
                const saved = await ev(`(async function(){ $gameSystem.onBeforeSave(); await DataManager.saveGame(0); $gameSystem.onBeforeSave(); await DataManager.saveGame(1); return "saved day " + $gameSystem.dayNightDay() + " " + $gameSystem.dayNightHour().toFixed(1); })()`);
                console.log(saved + " (slot 0 and a copy in slot 1)");
                await notify(`Gotowe: ${saved.replace("saved day", "zapisany dzień")} (slot 0 i kopia w slocie 1) - można otwierać w oknie`, { title: "Tawerna", tags: ["floppy_disk"], priority: 4 });
                break;
            }
        }
        const end = await J(`({ day: $gameSystem.dayNightDay(), hour: +$gameSystem.dayNightHour().toFixed(1), lvl: window.Combat && Combat.hero ? Combat.hero().level : 0,
            buildings: ((Farming.farm().buildings || {})[3] || []).filter(b => !b.site).map(b => b.type), needs: window.Needs ? [Math.round(Needs.state().food), Math.round(Needs.state().water)] : null,
            dog: window.Dog && Dog.state().tame ? { hp: Math.round(Dog.state().hp), food: Math.round(Dog.state().food), water: Math.round(Dog.state().water) } : null })`).catch(() => null);
        if (end) console.log(`end: day ${end.day} ${end.hour}:00, level ${end.lvl}, ${end.buildings.length} buildings (${end.buildings.join(", ")}), food/water ${end.needs}, dog ${JSON.stringify(end.dog)}, killed ${deaths}x, ${mins()} min`);
    } catch (e) { console.log("ERR", e.message); }
    await b.close();
    process.exit(0);
})();
