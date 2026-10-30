// Tryb oglądania autopilota fabuły (2026-10-28, gracz: „ja potem będę chciał go włączyć i patrzeć, jak gra się sama przechodzi”).
// Jedno polecenie (albo ogladaj.bat w głównym folderze projektu):
//   node tools/autopilot/ogladaj.js [--od <zapis>] [--szybkosc 1|2|4] [--port 9753]
// - serwer gry: tools/serve.js na 8765 (uruchamiany, gdy nie działa; kopii gracza na 8770 nie dotyka),
// - widoczne okno Edge na pełnym ekranie bez ramek, na monitorze z VS Code (tools/autopilot/ekran.ps1), własny profil
//   %LOCALAPPDATA%\TawernaAutopilot\edge_profile (zapisy gracza z kopii 8770 zostają nietknięte),
// - dźwięk 5% (muzyka, tło, efekty), minimapa schowana, prędkość ×1 (F7 zmienia),
// - nowa gra od tytułu (prolog pominięty klawiszem P) albo zapis kontrolny tests/autopilot_fabula/zapisy/<zapis>.json,
// - autopilot (tests/autopilot/ap.js + tests/autopilot_fabula/fab.js) i pasek (tests/autopilot_fabula/pasek.js) wstrzykiwane tylko
//   tutaj - lista wtyczek gry się nie zmienia.
// W oknie gry: F6 pauza, F7 prędkość ×1/×2/×4, F8 pasek, Esc (albo zamknięcie okna) - koniec. Gdy utknie - pasek „utknąłem: …”,
// czeka na F6 (spróbuj dalej) albo Esc. Na koniec raport: tests/autopilot_fabula/raport_ogladanie.md.
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn, execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const FAB_DIR = path.join(ROOT, "tests", "autopilot_fabula");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const GAME = "http://127.0.0.1:8765/index.html";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const OD = arg("od", "");
const SPEED = [1, 2, 4].includes(Number(arg("szybkosc", 1))) ? Number(arg("szybkosc", 1)) : 1;
const PORT = Number(arg("port", 9753));
const PROFILE = path.join(process.env.LOCALAPPDATA || path.join(require("os").homedir(), "AppData", "Local"), "TawernaAutopilot", "edge_profile");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const say = t => console.log("[autopilot] " + t);
const getJson = url => new Promise((res, rej) => { const q = http.get(url, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }); q.on("error", rej); q.setTimeout(3000, () => q.destroy(new Error("timeout"))); });
const httpOk = url => new Promise(res => { const q = http.get(url, r => { r.resume(); res(r.statusCode < 400); }); q.on("error", () => res(false)); q.setTimeout(2000, () => { q.destroy(); res(false); }); });

async function ensureServer() {
    if (await httpOk(GAME)) return true;
    say("uruchamiam serwer gry (tools/serve.js, port 8765)");
    const p = spawn(process.execPath, [path.join(ROOT, "tools", "serve.js")], { cwd: ROOT, detached: true, stdio: "ignore" });
    p.unref();
    for (let i = 0; i < 40; i++) { await sleep(250); if (await httpOk(GAME)) return true; }
    return false;
}
function screenOfCode() {
    try {
        const out = execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(__dirname, "ekran.ps1")], { encoding: "utf8", timeout: 15000 });
        return JSON.parse(out.trim().split(/\r?\n/).pop());
    } catch (e) { return { x: 0, y: 0, w: 1920, h: 1080, src: "domyślny" }; }
}
async function connect(port) {
    const targets = await getJson(`http://127.0.0.1:${port}/json`);
    const page = targets.find(t => t.type === "page" && /8765/.test(t.url)) || targets.find(t => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0, closed = false; const pending = new Map();
    ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
    ws.onclose = () => { closed = true; for (const p of pending.values()) p.rej(new Error("okno zamknięte")); pending.clear(); };
    const send = (method, params = {}) => new Promise((res, rej) => { if (closed) return rej(new Error("okno zamknięte")); const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
    const J = async e => { const s = await ev("Promise.resolve(" + e + ").then(v => JSON.stringify(v))"); return s === undefined ? undefined : JSON.parse(s); };
    const until = async (expr, secs) => { for (let i = 0; i < secs * 5; i++) { if (await ev(expr).catch(() => false)) return true; await sleep(200); } return false; };
    const key = (type, code, idk, k) => send("Input.dispatchKeyEvent", { type, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: idk, key: k });
    return { ws, send, ev, J, until, key, get closed() { return closed; } };
}
const onMap = id => `(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring()${id ? " && $gameMap.mapId() === " + id : ""})`;

(async () => {
    if (!(await ensureServer())) { say("serwer gry nie wstał - przerwane"); process.exit(1); }
    // a browser of this tool left open from before: closed first
    try { const v = await getJson(`http://127.0.0.1:${PORT}/json/version`); const ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise(r => { ws.onopen = r; }); ws.send(JSON.stringify({ id: 1, method: "Browser.close" })); await sleep(1500); } catch (e) {}
    const scr = screenOfCode();
    say(`ekran: ${scr.w}x${scr.h} na ${scr.x},${scr.y} (${scr.src === "vscode" ? "monitor z VS Code" : "monitor główny"})`);
    fs.mkdirSync(PROFILE, { recursive: true });
    const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, `--window-position=${scr.x},${scr.y}`, `--window-size=${scr.w},${scr.h}`,
        "--start-fullscreen", `--app=${GAME}`, "--autoplay-policy=no-user-gesture-required", "--no-first-run", "--no-default-browser-check",
        "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"], { detached: true, stdio: "ignore" });
    edge.unref();
    let c = null;
    for (let i = 0; i < 60 && !c; i++) { await sleep(500); try { c = await connect(PORT); } catch (e) { c = null; } }
    if (!c) { say("okno Edge nie odpowiada - przerwane"); process.exit(1); }
    // (anything that fails from here on: the window closed too, not left behind)
    const fail = async msg => { say(msg); try { await c.send("Browser.close"); } catch (e) {} process.exit(1); };
    await c.send("Network.enable").catch(() => 0);
    await c.send("Network.setCacheDisabled", { cacheDisabled: true }).catch(() => 0);   // (always the current plugin files)
    if (!(await c.until("!!(window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && DataManager.isGlobalInfoLoaded())", 90))) await fail("ekran tytułowy nie przyszedł");
    // the player's habit: all sound at 5%
    await c.ev(`(function(){ for (const k of ["bgmVolume", "bgsVolume", "meVolume", "seVolume"]) ConfigManager[k] = 5; ConfigManager.save(); if (window.AudioManager) { AudioManager.bgmVolume = 5; AudioManager.bgsVolume = 5; AudioManager.meVolume = 5; AudioManager.seVolume = 5; } return 0; })()`);
    let rep0 = null;
    if (OD) {
        const file = path.join(FAB_DIR, "zapisy", OD.replace(/\.json$/, "") + ".json");
        if (!fs.existsSync(file)) await fail("nie ma zapisu " + file);
        const fx = JSON.parse(fs.readFileSync(file, "utf8"));
        rep0 = fx.rep || null;
        say("wczytuję zapis „" + OD + "”" + (fx.summary ? " (dzień " + fx.summary.day + ")" : ""));
        await c.ev(`(async function(){ const zip = await StorageManager.jsonToZip(${JSON.stringify(JSON.stringify(fx.save))}); await StorageManager.saveZip(DataManager.makeSavename(19), zip);
            DataManager._globalInfo[19] = Object.assign(${JSON.stringify(fx.info || {})}, { timestamp: Date.now() }); DataManager.saveGlobalInfo();
            await DataManager.loadGame(19); $gameSystem.onAfterLoad(); $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 0); $gamePlayer.requestMapReload();
            SceneManager.goto(Scene_Map); return 0; })()`);
        if (!(await c.until(onMap(), 60))) await fail("zapis się nie wczytał");
    } else {
        say("nowa gra: tytuł → imię → prolog (pominięty klawiszem P)");
        await c.until("(SceneManager._scene instanceof Scene_Title && window.TitleScreen && TitleScreen.info() && TitleScreen.info().open && TitleScreen.info().active)", 30);
        await sleep(600);
        // (the profile keeps its saves: the menu may stand on „Kontynuuj” - the arrows to „Nowa gra” first)
        for (let i = 0; i < 6 && (await c.ev("TitleScreen.info() && TitleScreen.info().symbol")) !== "newGame"; i++) {
            await c.key("rawKeyDown", 38, "ArrowUp", "ArrowUp"); await sleep(60); await c.key("keyUp", 38, "ArrowUp", "ArrowUp"); await sleep(250);
        }
        await c.key("rawKeyDown", 79, "KeyO", "o"); await sleep(80); await c.key("keyUp", 79, "KeyO", "o");
        await c.until("(window.Prologue && Prologue.info() && Prologue.info().screen === 'name')", 20);
        for (let i = 0; i < 4; i++) { await sleep(500); await c.key("rawKeyDown", 13, "Enter", "Enter"); await sleep(60); await c.key("keyUp", 13, "Enter", "Enter"); if (await c.until("(window.Prologue && Prologue.info() && Prologue.info().screen === 'film')", 5)) break; }
        let landed = false;
        for (let i = 0; i < 6 && !landed; i++) { await c.key("rawKeyDown", 80, "KeyP", "p"); await sleep(2600); await c.key("keyUp", 80, "KeyP", "p"); landed = await c.until(onMap(19), 10); }
        if (!landed) await fail("dom dziadka się nie pokazał");
    }
    await c.ev("$gameSystem._minimapHidden = true; 0");
    await c.ev("window.FAB_GRAPH = " + JSON.stringify(require(path.join(FAB_DIR, "graf.js")).build()) + "; 0");
    await c.ev(fs.readFileSync(path.join(ROOT, "tests", "autopilot", "ap.js"), "utf8"));
    const v = await c.ev(fs.readFileSync(path.join(FAB_DIR, "fab.js"), "utf8"));
    if (rep0) await c.ev("FAB.rep = " + JSON.stringify(rep0) + "; 0");
    await c.ev(`FAB.start({ mode: "watch" }); FAB.setSpeed(${SPEED}); 0`);
    say("autopilot " + v + ", pasek: " + await c.ev(fs.readFileSync(path.join(FAB_DIR, "pasek.js"), "utf8")));
    say("W oknie gry: F6 pauza · F7 prędkość ×1/×2/×4 · F8 pasek · Esc koniec");

    let last = "", why = "";
    for (;;) {
        await sleep(2000);
        if (c.closed) { why = "okno zamknięte"; break; }
        let s;
        try { s = await c.J("Object.assign(FAB.status(), { quit: !!window.__fabQuit, err: (document.getElementById('errorPrinter') || {}).innerText || '' })"); }
        catch (e) { why = c.closed ? "okno zamknięte" : "strona nie odpowiada: " + e.message; break; }
        if (s.quit) { why = "Esc"; break; }
        if (s.err) say("błąd gry: " + s.err.slice(0, 200));
        const line = s.doing + (s.stuck ? " · UTKNĄŁEM (F6 / Esc)" : s.paused ? " · pauza" : "");
        if (line !== last) { last = line; say(`dzień ${s.day} ${s.clock} · ${line}`); }
    }
    say("koniec (" + why + ")");
    if (!c.closed) {
        try {
            const fin = await c.J("({ rep: FAB.rep, st: FAB.status(), log: FAB.log.slice(-60), tracked: FAB.trackedInfo(), talk: FAB.talkLog.slice(-20) })");
            const md = require(path.join(FAB_DIR, "raport.js")).write(fin, { od: OD, speed: SPEED, etap: 3, stopWhy: "oglądanie: " + why, realMin: 0 });
            fs.writeFileSync(path.join(FAB_DIR, "raport_ogladanie.md"), md);
            say("raport: tests/autopilot_fabula/raport_ogladanie.md");
        } catch (e) { say("raport nieudany: " + e.message); }
        try { await c.send("Browser.close"); } catch (e) {}
    }
    process.exit(0);
})();
