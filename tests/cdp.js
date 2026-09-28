// Minimal CDP driver: launches headless Edge on the local game server, evaluates JS, takes screenshots.
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");
const os = require("os");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = Number(process.env.CDP_PORT) || 9333;   // (another port lets a long run - the marathon - go beside the other tests)
// GAME_OVERLAY=<folder in the project>: its data/*.json and img/characters/*.png are served instead of (or beside) the game's own -
// a test of files not installed yet (e.g. tools/apply_tavern_interior.py --out tools/tavern/staging/install_preview)
const OVERLAY = process.env.GAME_OVERLAY ? path.resolve(__dirname, "..", process.env.GAME_OVERLAY) : null;

function getJson(url) {
    return new Promise((res, rej) => {
        http.get(url, r => {
            let d = "";
            r.on("data", c => d += c);
            r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
        }).on("error", rej);
    });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch(opts = {}) {
    const w = opts.width || 1280, h = opts.height || 720;
    // the browser profile lives in the system temp folder (not in the synced project) and is removed on close(); opts.profile: an
    // existing profile (its saves - e.g. the watched game's) that is kept
    const profile = opts.profile || path.join(os.tmpdir(), "tawerna_edge_" + Date.now());
    const proc = spawn(EDGE, [
        "--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profile,
        `--window-size=${w},${h}`, "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
        "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required", "--mute-audio",
        "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows", "--no-first-run", "--hide-scrollbars",
        "about:blank"
    ], { stdio: "ignore" });
    let targets;
    for (let i = 0; i < 50; i++) {
        try { targets = await getJson(`http://127.0.0.1:${PORT}/json`); if (targets.length) break; } catch (e) {}
        await sleep(200);
    }
    const page = targets.find(t => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const pending = new Map(); const logs = [];
    ws.onmessage = ev => {
        const m = JSON.parse(ev.data);
        if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
        else if (m.method === "Runtime.consoleAPICalled") logs.push(m.params.args.map(a => a.value ?? a.description).join(" "));
        else if (m.method === "Runtime.exceptionThrown") logs.push("EXC: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
        else if (m.method === "Fetch.requestPaused") overlay(m.params);
    };
    function overlay(p) {
        const rel = decodeURIComponent(new URL(p.request.url).pathname).replace(/^\/+/, "");
        const f = OVERLAY && path.join(OVERLAY, rel);
        if (f && fs.existsSync(f) && fs.statSync(f).isFile()) {
            send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 200, body: fs.readFileSync(f).toString("base64"),
                responseHeaders: [{ name: "Content-Type", value: rel.endsWith(".json") ? "application/json" : "image/png" }, { name: "Cache-Control", value: "no-store" }] }).catch(() => {});
        } else send("Fetch.continueRequest", { requestId: p.requestId }).catch(() => {});
    }
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    await send("Runtime.enable"); await send("Page.enable"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
    if (OVERLAY) await send("Fetch.enable", { patterns: [{ urlPattern: "*/data/*", requestStage: "Request" }, { urlPattern: "*/img/characters/*", requestStage: "Request" }] });
    // never the browser's cache: a kept profile (the watched game's) served old plugin files - the day 100-110 run played an old Dog.js
    await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: opts.dpr || 1, mobile: false });
    const evaluate = async (expr) => {
        const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
    };
    const shot = async (file) => {
        const r = await send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(file, Buffer.from(r.data, "base64"));
    };
    const exited = new Promise(r => proc.once("exit", r));
    const close = async () => {
        try { await send("Browser.close"); } catch (e) {}
        await Promise.race([exited, sleep(3000)]);
        try { proc.kill(); } catch (e) {}
        if (!opts.profile) for (let i = 0; i < 5; i++) { try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch (e) { await sleep(300); } }
    };
    return { send, evaluate, shot, close, logs, sleep };
}
module.exports = { launch, sleep };
