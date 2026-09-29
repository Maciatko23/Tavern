// The test runner: the tests one at a time (several browsers at once overload the local server), a retry for a boot or a server
// failure, a table at the end and tests/results.txt (the same sections as tests/run.sh writes, then the table).
// With --port other than 9396 the files get the port: out_<name>_p<port>.txt, results_p<port>.txt.
//
//   node tests/run.js smoke                 the quick set (SMOKE below, ~6 min): every main system once
//   node tests/run.js full                  every tests/*_test.js (not the ones in SKIP_FULL)
//   node tests/run.js unit                  tests/unit/*.test.js - pure logic in Node, no browser, seconds
//   node tests/run.js needs bubbles_test    just these (the name with or without _test; smoke/<name> for tests/smoke/)
//   node tests/run.js affected Farming Dog  the tests that use these plugins (their parts too) + the smoke set
//   node tests/run.js changed               the same for the plugins changed since the last "full" run (else: git's changes)
//   options: --port N (CDP port, default CDP_PORT or 9396), --retry N (default 1), --timeout S (a test's limit, default 420),
//            --list (only print what would run), --reuse / --no-reuse (one shared browser for the run: a tab per test)
// Each test's whole output goes to tests/out_<name>.txt (as with run.sh). The game server on 127.0.0.1:8765 is started by itself
// (tools/serve.js) when nothing answers there. tests/last_results.json keeps every test's last result: the table's "before".
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const os = require("os");
const crypto = require("crypto");
const { spawn, execSync } = require("child_process");
const { freePort } = require("./lib/kit.js");
const cdp = require("./cdp.js");

const TESTS = __dirname;
const UNIT = path.join(TESTS, "unit");

// the quick set: boot + new game + save/load (fixtures), story start, farming/building, hunting/combat, needs, journal, menu,
// tavern interior, a mini-game, bubbles/busts, grandpa's house
const SMOKE = [
    "smoke/fixtures",          // boot, every fixture loads and plays, save -> load round trip
    "smoke/story",             // a new story game in grandpa's house, the intro, the journal's chapter, the way out
    "smoke/farm",              // the build menu, a building site hammered up, the workbench makes a tool, crops
    "combat_test",             // the combat keys, the attributes, levels, the club and the shield
    "wolves_test",             // a wolf pack at night: the ring, one attacker at a time, the fight
    "needs_test",
    "journal_test",
    "menu_panel_test",
    "tavern_interior_test",
    "quest_board_test",
    "bubbles_test",
    "home_decor_test"
];
// not in "full": long runs that are not pass / fail tests (the marathon plays days and messages the phone)
const SKIP_FULL = ["marathon_test"];

// ---------------------------------------------------------------- the command line
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf("--" + name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = name => { const i = args.indexOf("--" + name); if (i < 0) return false; args.splice(i, 1); return true; };
const PORT = Number(opt("port", process.env.CDP_PORT || 9396));
const RETRY = Number(opt("retry", 1));
const TIMEOUT = Number(opt("timeout", 420));
const LIST = flag("list");
const REUSE_DEFAULT = true;   // (a shared browser for the run - see cdp.js CDP_ATTACH)
const NO_REUSE = flag("no-reuse"), REUSE = !NO_REUSE && (flag("reuse") || REUSE_DEFAULT);
if (!args.length) { console.log("usage: node tests/run.js smoke|full|unit|affected <Plugin...>|changed|<name...> [--port N] [--retry N] [--timeout S] [--list] [--reuse|--no-reuse]"); process.exit(2); }
const ROOT = path.join(TESTS, "..");
const LAST = path.join(TESTS, "last_results.json");
function readLast() { try { return JSON.parse(fs.readFileSync(LAST, "utf8")); } catch (e) { return { tests: {}, plugins: null }; } }
function writeLast(update) {   // (read, merge, write through a temp file: two runs on two ports may write at nearly the same time)
    const last = readLast();
    update(last);
    const tmp = LAST + "." + process.pid + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(last, null, 1));
    try { fs.renameSync(tmp, LAST); } catch (e) { try { fs.unlinkSync(tmp); } catch (e2) {} }
}
const LAST_BEFORE = readLast();
// the plugins in js/plugins.js; a part belongs to its main plugin (Farming_Build -> Farming)
function pluginNames() {
    const s = fs.readFileSync(path.join(ROOT, "js", "plugins.js"), "utf8");
    return JSON.parse(s.slice(s.indexOf("["), s.lastIndexOf("]") + 1)).map(p => p.name);
}
const pluginHash = n => { try { return crypto.createHash("sha1").update(fs.readFileSync(path.join(ROOT, "js", "plugins", n + ".js"))).digest("hex").slice(0, 12); } catch (e) { return null; } };
function changedPlugins() {
    const snap = LAST_BEFORE.plugins;
    if (snap) return pluginNames().filter(n => pluginHash(n) !== snap[n]);
    try {   // (no full run noted yet: what git sees changed)
        const out = execSync("git status --porcelain -- js/plugins", { cwd: ROOT, encoding: "utf8" });
        return out.split(/\r?\n/).map(l => /js\/plugins\/([^/]+)\.js$/.exec(l.trim())).filter(Boolean).map(m => m[1]);
    } catch (e) { return pluginNames(); }
}
function testsFor(plugins) {
    const words = new Set();
    for (const n of plugins) { words.add(n); words.add(n.split("_")[0]); }
    const re = new RegExp("\\b(" + [...words].map(w => w.replace(/[^\w]/g, "")).filter(Boolean).join("|") + ")\\b");
    const all = e2eAll().concat(unitAll(), fs.existsSync(path.join(TESTS, "smoke")) ? fs.readdirSync(path.join(TESTS, "smoke")).filter(f => f.endsWith(".js")).map(f => "smoke/" + f.replace(/\.js$/, "")) : []);
    return all.filter(n => { try { return re.test(fs.readFileSync(path.join(TESTS, n + ".js"), "utf8")); } catch (e) { return false; } });
}

const e2eAll = () => fs.readdirSync(TESTS).filter(f => /_test\.js$/.test(f)).map(f => f.replace(/\.js$/, "")).filter(n => !SKIP_FULL.includes(n)).sort();
const unitAll = () => (fs.existsSync(UNIT) ? fs.readdirSync(UNIT).filter(f => /\.test\.js$/.test(f)).sort().map(f => "unit/" + f.replace(/\.js$/, "")) : []);
// a name -> { name, file, unit }
function resolve(n) {
    n = n.replace(/\\/g, "/").replace(/^tests\//, "").replace(/\.js$/, "");
    const cands = [n, n + "_test", "smoke/" + n, "unit/" + n, "unit/" + n + ".test"];
    for (const c of cands) {
        const file = path.join(TESTS, c + ".js");
        if (fs.existsSync(file)) return { name: c, file, unit: c.startsWith("unit/") };
    }
    return { name: n, file: null, unit: false };
}
let names = [];
const FULL = args.includes("full");
for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "smoke") names.push(...SMOKE);
    else if (a === "full") names.push(...e2eAll());
    else if (a === "unit") names.push(...unitAll());
    else if (a === "affected" || a === "changed") {
        let plugins = [];
        if (a === "changed") plugins = changedPlugins();
        else while (i + 1 < args.length && !["smoke", "full", "unit", "affected", "changed"].includes(args[i + 1])) plugins.push(args[++i]);
        const t = testsFor(plugins);
        console.log(`${a}: ${plugins.length ? plugins.join(", ") : "(no plugin changed)"} -> ${t.length} test(s) + smoke`);
        names.push(...SMOKE, ...t);
    }
    else names.push(a);
}
const list = [];
for (const n of names) { const r = resolve(n); if (!list.some(x => x.name === r.name)) list.push(r); }
if (LIST) { for (const r of list) console.log((r.file ? "" : "(missing) ") + r.name); process.exit(0); }

// ---------------------------------------------------------------- helpers
const sleep = ms => new Promise(r => setTimeout(r, ms));
const serverUp = () => new Promise(res => {
    const rq = http.get("http://127.0.0.1:8765/index.html", r => { r.resume(); res(r.statusCode === 200); });
    rq.on("error", () => res(false));
    rq.setTimeout(5000, () => { rq.destroy(); res(false); });
});
async function waitServer(secs) {
    for (let i = 0; i < secs; i++) { if (await serverUp()) return true; await sleep(1000); }
    return false;
}
// nothing on 8765: our own server (tools/serve.js) is started, left running for the next runs
async function ensureServer() {
    if (await serverUp()) return true;
    const srv = path.join(ROOT, "tools", "serve.js");
    if (fs.existsSync(srv)) {
        const c = spawn(process.execPath, [srv], { cwd: ROOT, detached: true, stdio: "ignore", windowsHide: true });
        c.unref();
        console.log("the game server did not answer - started tools/serve.js on 127.0.0.1:8765");
    }
    return waitServer(15);
}
// --reuse: one browser on the port for the whole run; each test opens its own tab in it (cdp.js CDP_ATTACH=1)
let shared = null;
const alive = () => cdp.getJson(`http://127.0.0.1:${PORT}/json/version`).then(() => true, () => false);
async function sharedBrowser() {
    if (await alive()) return true;
    const profile = path.join(os.tmpdir(), "tawerna_run_" + PORT + "_" + Date.now());
    shared = { proc: cdp.spawnBrowser(PORT, profile, 1280, 720), profile };
    for (let i = 0; i < 60; i++) { if (await alive()) return true; await sleep(200); }
    return false;
}
// after a test: every tab but one blank one closed (a killed test leaves its game running in its tab)
async function closeStrayTabs() {
    let pages = [];
    try { pages = (await cdp.getJson(`http://127.0.0.1:${PORT}/json`)).filter(t => t.type === "page"); } catch (e) { return; }
    const keep = pages.find(t => t.url === "about:blank") || null;
    if (!keep) { try { await cdp.request("PUT", `http://127.0.0.1:${PORT}/json/new?about:blank`); } catch (e) {} }
    for (const t of pages) if (t !== keep) { try { await cdp.request("GET", `http://127.0.0.1:${PORT}/json/close/${t.id}`); } catch (e) {} }
}
async function closeShared() {
    await freePort(PORT);
    if (shared) for (let i = 0; i < 5; i++) { try { fs.rmSync(shared.profile, { recursive: true, force: true }); break; } catch (e) { await sleep(300); } }
}
// (a port other than the default gets its own files: two threads running the same test do not write into one file)
const PORT_TAG = PORT === 9396 ? "" : "_p" + PORT;
const outFile = name => path.join(TESTS, "out_" + name.replace(/\//g, "_") + PORT_TAG + ".txt");
const killTree = pid => { try { execSync(process.platform === "win32" ? `taskkill /PID ${pid} /T /F` : `kill -9 ${pid}`, { stdio: "ignore" }); } catch (e) {} };

// one run of one test: its output into out_<name>.txt; { code, timedOut, secs, text }
function runOnce(t) {
    return new Promise(res => {
        const out = outFile(t.name), fd = fs.openSync(out, "w"), t0 = Date.now();
        const env = Object.assign({}, process.env, { CDP_PORT: String(PORT) });
        if (REUSE && !t.unit) env.CDP_ATTACH = "1"; else delete env.CDP_ATTACH;
        const child = spawn(process.execPath, [t.file], { cwd: TESTS, stdio: ["ignore", fd, fd], env });
        let timedOut = false;
        const limit = t.unit ? 120 : TIMEOUT;
        const timer = setTimeout(() => { timedOut = true; killTree(child.pid); }, limit * 1000);
        child.on("exit", code => {
            clearTimeout(timer);
            fs.closeSync(fd);
            if (timedOut) fs.appendFileSync(out, `\nERR timeout: the test ran longer than ${limit} s and was stopped\n`);
            res({ code, timedOut, secs: Math.round((Date.now() - t0) / 1000), text: fs.readFileSync(out, "utf8") });
        });
    });
}
// what the output says
function parse(text) {
    const lines = text.split(/\r?\n/);
    const pass = lines.filter(l => /^PASS /.test(l)).length, fail = lines.filter(l => /^FAIL/.test(l)).length, err = lines.filter(l => /^ERR/.test(l)).length;
    const sum = lines.map(l => /^\s*(\d+)\/(\d+) passed/.exec(l)).filter(Boolean).pop();
    return { pass, fail, err, sum: sum ? [Number(sum[1]), Number(sum[2])] : null, lines };
}
// a failure of the boot or of the server, not of the game: worth one more go
const INFRA = /BOOT FAILED|^FAIL the game boots|ECONNREFUSED|ECONNRESET|socket hang up|reading 'webSocketDebuggerUrl'|Failed to load:|Scene_Boot is not defined|Utils is not defined/m;
function status(r, p) {
    if (r.timedOut) return "TIMEOUT";
    if (!p.sum) return "CRASH";
    if (p.fail || p.err || p.sum[0] < p.sum[1]) return p.err && !p.fail ? "ERR" : "FAIL";
    return "ok";
}

(async () => {
    const t0 = Date.now(), rows = [], sections = [];
    const needsBrowser = list.some(t => t.file && !t.unit);
    if (needsBrowser && !(await ensureServer())) { console.log("the game server does not answer on 127.0.0.1:8765 (node tools/serve.js)"); process.exit(2); }
    console.log(`${list.length} test(s), CDP port ${PORT}, one at a time${REUSE && needsBrowser ? ", one shared browser" : ""}\n`);
    if (REUSE && needsBrowser) { await freePort(PORT); if (!(await sharedBrowser())) { console.log("the shared browser did not start"); process.exit(2); } }
    for (const t of list) {
        if (!t.file) { rows.push({ name: t.name, res: "-", status: "MISSING", secs: 0, tries: 0 }); sections.push(`=== ${t.name} : no such file`); console.log(`${t.name.padEnd(34)} MISSING`); continue; }
        let r, p, st, tries = 0;
        for (;;) {
            tries++;
            if (!t.unit && REUSE) await sharedBrowser();
            else if (!t.unit) await freePort(PORT);
            r = await runOnce(t);
            if (!t.unit && REUSE) await closeStrayTabs();
            else if (!t.unit) await freePort(PORT);   // (a browser left behind by a killed test)
            p = parse(r.text);
            st = status(r, p);
            const infra = st !== "ok" && !t.unit && (INFRA.test(r.text) || !(await serverUp()) || (st === "CRASH" && p.pass === 0));
            if (!infra || tries > RETRY) break;
            console.log(`${t.name.padEnd(34)} ${st} (boot / server) - again`);
            if (!(await serverUp())) await ensureServer();
            await waitServer(60);
            await sleep(3000);
        }
        const res = p.sum ? p.sum.join("/") : `${p.pass}/${p.pass + p.fail}`;
        const was = LAST_BEFORE.tests[t.name];
        const before = was ? `${was.res} ${was.status}` : "-";
        rows.push({ name: t.name, res, status: st, secs: r.secs, tries, before });
        writeLast(L => { L.tests[t.name] = { res, status: st, secs: r.secs, when: new Date().toISOString().slice(0, 16).replace("T", " "), port: PORT }; });
        console.log(`${t.name.padEnd(34)} ${res.padStart(7)}  ${st.padEnd(7)} ${String(r.secs).padStart(4)} s   before: ${before}${tries > 1 ? "  (" + tries + " tries)" : ""}`);
        if (st !== "ok") for (const l of p.lines.filter(l => /^(FAIL|ERR)/.test(l)).slice(0, 6)) console.log("    " + l.slice(0, 200));
        // (the run.sh section: the FAIL / ERR / summary / console lines, the last 12)
        sections.push(`=== ${t.name}\n` + p.lines.filter(l => /^FAIL|^ERR|passed|console errors/.test(l)).slice(-12).join("\n"));
    }
    if (REUSE && needsBrowser) await closeShared();
    const clean = rows.filter(r => r.status === "ok").length, secs = Math.round((Date.now() - t0) / 1000);
    // a full run notes the plugins as they were (what "changed" compares with next time)
    if (FULL) writeLast(L => { L.plugins = {}; for (const n of pluginNames()) L.plugins[n] = pluginHash(n); L.fullRun = new Date().toISOString().slice(0, 16).replace("T", " "); });
    const table = ["test".padEnd(34) + " result   status   time  tries  before", "-".repeat(84)]
        .concat(rows.map(r => `${r.name.padEnd(34)} ${r.res.padStart(7)}  ${r.status.padEnd(7)} ${String(r.secs).padStart(4)} s  ${r.tries}      ${r.before || "-"}`));
    const total = `SUITES: ${clean} clean, ${rows.length - clean} with a FAIL/ERR line`;
    const took = `time: ${Math.floor(secs / 60)} min ${secs % 60} s`;
    console.log("\n" + table.join("\n") + "\n\n" + total + "  (" + took + ")");
    fs.writeFileSync(path.join(TESTS, "results" + PORT_TAG + ".txt"), sections.join("\n") + "\n" + total + "\n\n" + table.join("\n") + "\n" + took + "\nALL DONE\n");
    process.exit(clean === rows.length ? 0 : 1);
})();
