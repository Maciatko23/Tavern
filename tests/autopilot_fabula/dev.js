// Narzędzie do pracy nad autopilotem fabuły: przeglądarka bez okna zostaje włączona między poleceniami (DEV_PORT, domyślnie 9752).
//   node tests/autopilot_fabula/dev.js start            Edge bez okna + gra (tytuł)
//   node tests/autopilot_fabula/dev.js newgame          tytuł → „Nowa gra” → imię → prolog pominięty (P) → dom dziadka
//   node tests/autopilot_fabula/dev.js load <zapis>     zapis kontrolny z tests/autopilot_fabula/zapisy/<zapis>.json
//   node tests/autopilot_fabula/dev.js save <zapis>     stan gry (i FAB.rep) jako zapis kontrolny
//   node tests/autopilot_fabula/dev.js inject [×]       graf + ap.js + fab.js, start autopilota (szybkość, domyślnie 6)
//   node tests/autopilot_fabula/dev.js reinject         fab.js od nowa (po zmianie kodu), autopilot dalej
//   node tests/autopilot_fabula/dev.js status [n]       FAB.status() + ostatnie n wpisów
//   node tests/autopilot_fabula/dev.js eval "<js>"      wyrażenie w stronie (wynik jako JSON)
//   node tests/autopilot_fabula/dev.js shot <plik.png>  zrzut ekranu
//   node tests/autopilot_fabula/dev.js close
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const { spawnBrowser } = require("../cdp.js");
const PORT = Number(process.env.DEV_PORT) || 9752;
const HERE = __dirname, TESTS = path.join(__dirname, "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJson = url => new Promise((res, rej) => { const q = http.get(url, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }); q.on("error", rej); q.setTimeout(3000, () => q.destroy(new Error("timeout"))); });

async function connect() {
    const targets = await getJson(`http://127.0.0.1:${PORT}/json`);
    const page = targets.find(t => t.type === "page" && /8765/.test(t.url)) || targets.find(t => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const pending = new Map();
    ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
    const J = async e => { const s = await ev("Promise.resolve(" + e + ").then(v => JSON.stringify(v))"); return s === undefined ? undefined : JSON.parse(s); };
    const until = async (expr, secs) => { for (let i = 0; i < secs * 5; i++) { if (await ev(expr).catch(() => false)) return true; await sleep(200); } return false; };
    const key = async (type, code, idk, k) => send("Input.dispatchKeyEvent", { type, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: idk, key: k });
    return { ws, send, ev, J, until, key };
}
const onMap = id => `(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring()${id ? " && $gameMap.mapId() === " + id : ""})`;
async function inject(c, speed) {
    await c.ev("window.FAB_GRAPH = " + JSON.stringify(require("./graf.js").build()) + "; 0");
    await c.ev(fs.readFileSync(path.join(TESTS, "autopilot", "ap.js"), "utf8"));
    await c.ev("if (window.FAB) { FAB.started = false; FAB.stop(); } 0");
    return c.ev(fs.readFileSync(path.join(HERE, "fab.js"), "utf8"));
}

(async () => {
    const [cmd, ...args] = process.argv.slice(2);
    if (cmd === "start") {
        const profile = path.join(os.tmpdir(), "tawerna_fab_dev_" + PORT);
        const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
        const p = require("child_process").spawn(EDGE, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profile, "--window-size=1280,720",
            "--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required", "--mute-audio",
            "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--no-first-run", "--hide-scrollbars",
            "about:blank"], { stdio: "ignore", detached: true });
        p.unref();
        for (let i = 0; i < 50; i++) { try { await getJson(`http://127.0.0.1:${PORT}/json/version`); break; } catch (e) { await sleep(200); } }
        const c = await connect();
        await c.send("Page.enable"); await c.send("Network.enable"); await c.send("Emulation.setFocusEmulationEnabled", { enabled: true }); await c.send("Network.setCacheDisabled", { cacheDisabled: true });
        await c.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
        await c.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        console.log("tytuł:", await c.until("!!(window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && DataManager.isGlobalInfoLoaded())", 60));
        process.exit(0);
    }
    if (cmd === "close") {
        try { const v = await getJson(`http://127.0.0.1:${PORT}/json/version`); const ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise(r => { ws.onopen = r; }); ws.send(JSON.stringify({ id: 1, method: "Browser.close" })); await sleep(500); } catch (e) {}
        console.log("zamknięte"); process.exit(0);
    }
    const c = await connect();
    try {
        if (cmd === "newgame") {
            await c.ev("(function(){ if (!(SceneManager._scene instanceof Scene_Title)) SceneManager.goto(Scene_Title); return 0; })()");
            await c.until("(SceneManager._scene instanceof Scene_Title && window.TitleScreen && TitleScreen.info() && TitleScreen.info().open && TitleScreen.info().active)", 30);
            await sleep(500);
            for (let i = 0; i < 6 && (await c.ev("TitleScreen.info() && TitleScreen.info().symbol")) !== "newGame"; i++) { await c.key("rawKeyDown", 38, "ArrowUp", "ArrowUp"); await sleep(60); await c.key("keyUp", 38, "ArrowUp", "ArrowUp"); await sleep(250); }
            await c.key("rawKeyDown", 79, "KeyO", "o"); await sleep(80); await c.key("keyUp", 79, "KeyO", "o");
            await c.until("(window.Prologue && Prologue.info() && Prologue.info().screen === 'name')", 15);
            for (let i = 0; i < 4; i++) { await sleep(500); await c.key("rawKeyDown", 13, "Enter", "Enter"); await sleep(60); await c.key("keyUp", 13, "Enter", "Enter"); if (await c.until("(window.Prologue && Prologue.info() && Prologue.info().screen === 'film')", 5)) break; }
            let landed = false;
            for (let i = 0; i < 6 && !landed; i++) { await c.key("rawKeyDown", 80, "KeyP", "p"); await sleep(2600); await c.key("keyUp", 80, "KeyP", "p"); landed = await c.until(onMap(19), 8); }
            await c.ev("$gameSystem._minimapHidden = true; 0");
            console.log("dom dziadka:", landed);
        } else if (cmd === "load") {
            const fx = JSON.parse(fs.readFileSync(path.join(HERE, "zapisy", args[0].replace(/\.json$/, "") + ".json"), "utf8"));
            await c.ev("(function(){ if (!(SceneManager._scene instanceof Scene_Title)) SceneManager.goto(Scene_Title); return 0; })()");
            await c.until("SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && !SceneManager.isSceneChanging()", 30);
            await c.ev(`(async function(){ const zip = await StorageManager.jsonToZip(${JSON.stringify(JSON.stringify(fx.save))}); await StorageManager.saveZip(DataManager.makeSavename(1), zip);
                DataManager._globalInfo[1] = Object.assign(${JSON.stringify(fx.info || {})}, { timestamp: Date.now() }); DataManager.saveGlobalInfo();
                await DataManager.loadGame(1); $gameSystem.onAfterLoad(); $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 0); $gamePlayer.requestMapReload();
                SceneManager.goto(Scene_Map); return 0; })()`);
            console.log("wczytane:", await c.until(onMap(), 40));
            if (fx.rep) await c.ev("window.__fabRep0 = " + JSON.stringify(fx.rep) + "; 0");
        } else if (cmd === "save") {
            const r = await c.J(`(async function(){ $gameSystem.onBeforeSave(); await DataManager.saveGame(2); const text = await StorageManager.zipToJson(await StorageManager.loadZip(DataManager.makeSavename(2)));
                return { text, info: DataManager.savefileInfo(2), summary: { day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), map: $gameMap.mapId(), gold: $gameParty.gold() }, rep: window.FAB ? FAB.rep : null }; })()`);
            const out = { name: args[0], made: new Date().toISOString(), summary: r.summary, info: r.info, rep: r.rep, save: "__SAVE__" };
            fs.mkdirSync(path.join(HERE, "zapisy"), { recursive: true });
            fs.writeFileSync(path.join(HERE, "zapisy", args[0] + ".json"), JSON.stringify(out).replace('"__SAVE__"', () => r.text));
            console.log("zapisane:", args[0], r.summary);
        } else if (cmd === "reload") {
            await c.send("Page.reload", { ignoreCache: true });
            await sleep(1500);
            console.log("tytuł:", await c.until("!!(window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && DataManager.isGlobalInfoLoaded())", 60));
        } else if (cmd === "inject") {
            console.log(await inject(c));
            const sp = Number(args[0]) || 6;
            await c.ev(`if (window.__fabRep0) { FAB.rep = window.__fabRep0; window.__fabRep0 = null; } FAB.start({ mode: "test" }); FAB.setSpeed(${sp}); 0`);
            console.log("start ×" + sp);
        } else if (cmd === "reinject") {
            await c.ev("if (window.FAB) FAB.started = false; 0");
            console.log(await c.ev(fs.readFileSync(path.join(HERE, "fab.js"), "utf8")));
            await c.ev("FAB.restart(); 0");
        } else if (cmd === "status") {
            const n = Number(args[0]) || 25;
            const s = await c.J(`({ st: FAB.status(), scene: SceneManager._scene.constructor.name, needs: window.Needs ? Needs.state() : null, stamina: $gameSystem.stamina(), ap: AP.curName, log: FAB.log.slice(-${n}), aplog: AP.log.slice(-8) })`);
            console.log(JSON.stringify(s.st));
            console.log("scena", s.scene, "| AP", s.ap, "| jedzenie", Math.round(s.needs && s.needs.food), "woda", Math.round(s.needs && s.needs.water), "wytrz.", Math.round(s.stamina));
            for (const l of s.log) console.log("  " + l);
            console.log("  -- AP:"); for (const l of s.aplog) console.log("  " + l);
        } else if (cmd === "eval") {
            console.log(JSON.stringify(await c.J(args.join(" ")), null, 1));
        } else if (cmd === "shot") {
            const r = await c.send("Page.captureScreenshot", { format: "png" });
            fs.writeFileSync(args[0], Buffer.from(r.data, "base64"));
            console.log("zrzut:", args[0]);
        } else console.log("polecenia: start | newgame | load <z> | save <z> | inject [×] | reinject | status [n] | eval <js> | shot <plik> | close");
    } catch (e) { console.log("BŁĄD", e.message); }
    process.exit(0);
})();
