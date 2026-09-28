// node perf.js <jobs.json> [--gpu d3d11] [--out result.json]
// Frame-time measurement in the real game (headless Edge over CDP; CDP_PORT env, use 9372 for this tool). Each job:
//   { label, map: "<staged MapXXX.json>" | null (null = data/ as it is), id, spots: [[x, y, dir], ...], hour: 18,
//     frames: 240, over: { "MapNNN.json": "<path>" } (more staged maps), walk: true (also a walking pass) }
// For every spot: the hero stands there (the camera centred on him, zoom as the map says), then `frames` frames are timed:
//   update  - SceneManager's update (all game logic + plugins, RoomLighting's darkness redraw included)
//   render  - PIXI's render call (CPU side) + gl.finish() so the GPU work of the frame is inside the number
//   dark    - Spriteset_Map.redrawDarkness alone (RoomLighting)
//   frame   - the whole tick; fps = ticks per real second
// Prints a table and writes the numbers as JSON (--out).
const path = require("path"), fs = require("fs"), http = require("http"), os = require("os");
const { spawn } = require("child_process");
const ROOT = path.join(__dirname, "..", "..");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = Number(process.env.CDP_PORT) || 9372;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const GPU = opt("--gpu", "swiftshader");
const OUT = opt("--out", null);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJson = url => new Promise((res, rej) => { http.get(url, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on("error", rej); });
const WINLU_CHARS = "Winlu Fantasy Tileset - Interior/Remaster/characters/";
const winluNames = fs.readdirSync(path.join(ROOT, "img", "tilesets", WINLU_CHARS)).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4));
const ownNames = new Set(fs.readdirSync(path.join(ROOT, "img", "characters")).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4)));
const fromWinlu = winluNames.filter(n => !ownNames.has(n));

async function launch(w, h) {
    const profile = path.join(os.tmpdir(), "tawerna_perf_" + Date.now());
    const gl = GPU === "d3d11" ? ["--use-gl=angle", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"]
                               : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
    const proc = spawn(EDGE, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profile, `--window-size=${w},${h}`, ...gl,
        "--autoplay-policy=no-user-gesture-required", "--mute-audio", "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows", "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
    let targets;
    for (let i = 0; i < 50; i++) { try { targets = await getJson(`http://127.0.0.1:${PORT}/json`); if (targets.length) break; } catch (e) {} await sleep(200); }
    const page = targets.find(t => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const pending = new Map(); const logs = [];
    let api;
    ws.onmessage = ev => { const m = JSON.parse(ev.data);
        if (m.method === "Fetch.requestPaused") { if (api && api.onPaused) api.onPaused(m.params); return; }
        if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
        else if (m.method === "Runtime.consoleAPICalled") logs.push(m.params.args.map(a => a.value ?? a.description).join(" "));
        else if (m.method === "Runtime.exceptionThrown") logs.push("EXC: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); };
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    await send("Runtime.enable"); await send("Page.enable"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
    await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    const evaluate = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
    const close = async () => { try { await send("Browser.close"); } catch (e) {} await sleep(1500); try { proc.kill(); } catch (e) {}
        for (let i = 0; i < 5; i++) { try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch (e) { await sleep(300); } } };
    api = { send, evaluate, close, logs, onPaused: null };
    return api;
}

(async () => {
    const jobs = JSON.parse(fs.readFileSync(args[0], "utf8"));
    const b = await launch(1280, 720);
    const ev = b.evaluate;
    const results = [];
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}, t0 = Date.now(); const iv = setInterval(() => { if (Graphics.frameCount >= t || Date.now() - t0 > 60000) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    // job.plugins: { "RoomLighting.js": "<file>" } - serve another version of a plugin file (A/B runs in one browser)
    let pluginOver = {};
    await b.send("Fetch.enable", { patterns: [{ urlPattern: "*js/plugins/*" }] });
    b.onPaused = async (p) => {
        const name = decodeURIComponent(p.request.url.split("/").pop().split("?")[0]);
        if (pluginOver[name]) {
            const body = Buffer.from(fs.readFileSync(pluginOver[name])).toString("base64");
            await b.send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/javascript" }], body });
        } else await b.send("Fetch.continueRequest", { requestId: p.requestId });
    };
    for (const job of jobs) {
        pluginOver = job.plugins || {};
        const over = {};
        const id = job.id || 1;
        if (job.map) over["Map" + String(id).padStart(3, "0") + ".json"] = fs.readFileSync(job.map, "utf8");
        for (const [k, p] of Object.entries(job.over || {})) over[k] = fs.readFileSync(p, "utf8");
        for (let attempt = 0; attempt < 4; attempt++) {       // (the shared local server sometimes drops a file)
            await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
            await sleep(500);
            let ok = false;
            for (let i = 0; i < 120; i++) {
                if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) { ok = true; break; }
                if (await ev("(function(){ const e = document.getElementById('errorPrinter'); return !!(e && /Failed|Error/i.test(e.innerText || '')); })()").catch(() => false)) break;
                await sleep(400);
            }
            if (ok) break;
        }
        await ev(`(function(){ window.__over = ${JSON.stringify(over)}; const _load = DataManager.loadDataFile;
            DataManager.loadDataFile = function(name, src) { if (window.__over[src]) { window[name] = null; const t = window.__over[src]; setTimeout(() => this.onXhrLoad({ status: 200, responseText: t }, name, src, "data/" + src), 0); return; } return _load.call(this, name, src); };
            const Wn = new Set(${JSON.stringify(fromWinlu)}); const _lc = ImageManager.loadCharacter;
            ImageManager.loadCharacter = function(f) { return Wn.has(f) ? this.loadBitmap("img/tilesets/", ${JSON.stringify(WINLU_CHARS)} + f) : _lc.call(this, f); };
            // the timers
            window.__perf = { on: false, upd: [], ren: [], dark: [], frame: [], stamps: [] };
            const P = window.__perf;
            const th = Graphics._tickHandler;
            Graphics._tickHandler = function(dt) { const t0 = performance.now(); th(dt); if (P.on) P.upd.push(performance.now() - t0); };
            const app = Graphics._app, rnd = app.render.bind(app);
            app.render = function() { const t0 = performance.now(); rnd(); const gl = app.renderer.gl; if (P.on && gl && gl.finish) gl.finish();
                const t1 = performance.now(); if (P.on) { P.ren.push(t1 - t0); P.stamps.push(t1); } };
            const rd = Spriteset_Map.prototype.redrawDarkness;
            Spriteset_Map.prototype.redrawDarkness = function() { const t0 = performance.now(); rd.call(this); if (P.on) P.dark.push(performance.now() - t0); };
            return 0; })()`);
        const [sx, sy, sd] = job.spots[0];
        await ev(`(function(){ DataManager.setupNewGame(); $gameSystem._minimapHidden = true; if (window.Story && Story.skipIntro) Story.skipIntro();
            $gamePlayer.reserveTransfer(${id}, ${sx}, ${sy}, ${sd || 2}, 0); SceneManager.goto(Scene_Map); return 0; })()`);
        for (let i = 0; i < 150; i++) { if (await ev(`SceneManager._scene.constructor.name==='Scene_Map' && !!SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===${id}`).catch(() => false)) break; await sleep(300); }
        await frames(30);
        await ev(`(function(){ SceneManager._scene.startFadeIn(1, false); if (window.Birds) Birds.auto(false); if (window.Hunting) Hunting.auto(false);
            if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); $gameSystem.setDayNightHour(${job.hour == null ? 18 : job.hour});
            $gameScreen.changeWeather("none", 0, 0); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); return 0; })()`);
        await frames(90);
        if (job.tweak) await ev(`(function(){ ${job.tweak}; return 0; })()`);      // an experiment: e.g. hide the light sprites
        const info = await ev(`JSON.stringify({ events: $gameMap.events().length, lights: (SceneManager._scene._spriteset._roomHoles || []).length,
            sprites: SceneManager._scene._spriteset._characterSprites.length, size: $gameMap.width() + "x" + $gameMap.height() })`).then(JSON.parse);
        for (const spot of job.spots) {
            const [x, y, d] = spot;
            await ev(`(function(){ $gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d || 2}); return 0; })()`);
            await frames(40);
            const n = job.frames || 240;
            await ev(`(function(){ const P = window.__perf; P.upd = []; P.ren = []; P.dark = []; P.stamps = []; P.on = true; return 0; })()`);
            await frames(n);
            const r = await ev(`(function(){ const P = window.__perf; P.on = false;
                const st = a => { if (!a.length) return { mean: 0, p95: 0 }; const s = a.slice().sort((p, q) => p - q); return { mean: s.reduce((p, q) => p + q, 0) / s.length, p95: s[Math.floor(s.length * 0.95)] }; };
                const iv = []; for (let i = 1; i < P.stamps.length; i++) iv.push(P.stamps[i] - P.stamps[i - 1]);
                const holes = (SceneManager._scene._spriteset._roomHoles || []);
                return JSON.stringify({ upd: st(P.upd), ren: st(P.ren), dark: st(P.dark), interval: st(iv), n: P.upd.length,
                    onscreen: window.__rlVisible ? window.__rlVisible() : null }); })()`).then(JSON.parse);
            if (job.shot) {
                const s = await b.send("Page.captureScreenshot", { format: "png" });
                fs.writeFileSync(job.shot.replace(".png", "_" + spot.join("_") + ".png"), Buffer.from(s.data, "base64"));
            }
            const row = { label: job.label, spot: spot.join(","), ...info, ...r, fps: r.interval.mean ? 1000 / r.interval.mean : 0 };
            results.push(row);
            console.log(`${job.label.padEnd(22)} ${("(" + spot.join(",") + ")").padEnd(12)} ev ${String(info.events).padStart(4)} lights ${String(info.lights).padStart(3)} | ` +
                `update ${r.upd.mean.toFixed(2)} ms (p95 ${r.upd.p95.toFixed(2)}) dark ${r.dark.mean.toFixed(2)} ms | render+gpu ${r.ren.mean.toFixed(2)} ms (p95 ${r.ren.p95.toFixed(2)}) | frame ${r.interval.mean.toFixed(2)} ms = ${(1000 / (r.interval.mean || 1)).toFixed(1)} fps`);
        }
        const err = await ev("(function(){ const e = document.getElementById('errorPrinter'); return e && /Failed|Error/i.test(e.innerText || '') ? e.innerText.replace(/\\s+/g, ' ') : ''; })()");
        if (err) console.log("PAGE ERROR:", err);
    }
    const errs = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", errs.length ? errs.slice(-6) : "none", "| gpu:", GPU);
    if (OUT) fs.writeFileSync(OUT, JSON.stringify({ gpu: GPU, results }, null, 1));
    await b.close();
    process.exit(0);
})();
