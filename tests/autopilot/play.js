// Controller for the watched game (Edge on CDP 9334) + the in-game autopilot (ap.js).
// node play.js close                 close the game window
// node play.js setup                 title -> all sound 5% -> New game -> minimap off -> autopilot in
// node play.js inject                (re)load ap.js into the page
// node play.js run '<json tasks>'    queue tasks, e.g. '[["gather","branch",10],["build","workbench"]]'
// node play.js status | stop | shot <file>
// node play.js watch <seconds>       print the autopilot log as it goes, until the queue is empty or the time is up
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = Number(process.env.PLAY_PORT) || 9334;   // (PLAY_PORT: another browser, e.g. the marathon's)
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJson = url => new Promise((res, rej) => http.get(url, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on("error", rej));

async function connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const pending = new Map();
    ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    return { ws, send };
}

(async () => {
    const [cmd, ...args] = process.argv.slice(2);
    if (cmd === "close") {
        try { const v = await getJson(`http://127.0.0.1:${PORT}/json/version`); const b = await connect(v.webSocketDebuggerUrl); await b.send("Browser.close").catch(() => 0); console.log("closed"); }
        catch (e) { console.log("no browser", e.message); }
        process.exit(0);
    }
    const targets = await getJson(`http://127.0.0.1:${PORT}/json`);
    const page = targets.find(t => t.type === "page" && /127\.0\.0\.1:8765/.test(t.url)) || targets.find(t => t.type === "page");
    const { ws, send } = await connect(page.webSocketDebuggerUrl);
    const ev = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const inject = () => ev(fs.readFileSync(path.join(__dirname, "ap.js"), "utf8"));
    try {
        if (cmd === "setup") {
            for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && SceneManager._scene._commandWindow)").catch(() => false)) break; await sleep(500); }
            await ev(`(function(){ for (const k of ["bgmVolume", "bgsVolume", "meVolume", "seVolume"]) ConfigManager[k] = 5; ConfigManager.save(); return 0; })()`);
            await sleep(600);
            if (args[0] === "continue" && await ev("DataManager.savefileExists(0)")) {
                await ev("DataManager.loadGame(0).then(() => { SceneManager._scene.fadeOutAll(); if ($gameSystem.versionId() !== $dataSystem.versionId) { $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y); $gamePlayer.requestMapReload(); } SceneManager.goto(Scene_Map); }); 0");
            } else await ev("SceneManager._scene.commandNewGame(); 0");
            for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && !SceneManager.isSceneChanging() && !!$gameMap.mapId()").catch(() => false)) break; await sleep(500); }
            await sleep(1000);
            await ev("$gameSystem._minimapHidden = true; 0");
            console.log("inject:", await inject());
            console.log(JSON.stringify(await J("({ map: $gameMap.mapId(), pos: [$gamePlayer.x, $gamePlayer.y], vol: [ConfigManager.bgmVolume, ConfigManager.seVolume], mini: $gameSystem._minimapHidden })")));
        } else if (cmd === "reload") {   // a hard reload: changed plugins are fetched again, not taken from the cache
            await send("Page.reload", { ignoreCache: true });
            console.log("reloaded");
        } else if (cmd === "inject") {
            console.log(await inject());
        } else if (cmd === "run") {
            console.log("queued:", await ev(`AP.run(${args.join(" ")})`));
        } else if (cmd === "status") {
            console.log(JSON.stringify(await J("AP.status()"), null, 1));
        } else if (cmd === "stop") {
            console.log(await ev("AP.stop()"));
        } else if (cmd === "eval") {
            console.log(JSON.stringify(await ev(args.join(" "))));
        } else if (cmd === "shot") {
            const r = await send("Page.captureScreenshot", { format: "png" });
            fs.writeFileSync(args[0], Buffer.from(r.data, "base64"));
            console.log("saved");
        } else if (cmd === "watch") {
            const until = Date.now() + Number(args[0] || 60) * 1000;
            let seen = 0;
            while (Date.now() < until) {
                const s = await J("({ log: AP.log, cur: AP.curName, left: AP.queue.length, n: AP.log.length })");
                const lines = s.log;
                // print what is new (the log keeps the last 80 lines)
                const fresh = lines.slice(Math.max(0, lines.length - Math.max(0, lines.length - seen)));
                if (lines.length !== seen) { for (const l of lines.slice(seen >= lines.length ? lines.length : seen)) console.log(l); seen = lines.length; }
                if (!s.cur && !s.left) break;
                if (seen >= 80) { await ev("AP.log.splice(0, 40); 0"); seen -= 40; }
                await sleep(1500);
            }
            const st = await J("AP.status()");
            console.log("--", st.time, "dzień", st.day, "| wytrz.", st.st, "sytość", st.food, "woda", st.water, "| teraz:", st.cur || "-", "| w kolejce:", st.left);
            console.log("--", st.items);
        } else console.log("unknown", cmd);
    } catch (e) { console.log("ERR", e.message); }
    ws.close();
    process.exit(0);
})();
