// The test runner: the tests one at a time (several browsers at once overload the local server), a retry for a boot or a server
// failure, a table at the end and tests/results.txt (the same sections as tests/run.sh writes, then the table).
// With --port other than 9396 the files get the port: out_<name>_p<port>.txt, results_p<port>.txt.
//
//   node tests/run.js smoke                 the quick set (SMOKE below, ~6 min): every main system once
//   node tests/run.js full                  every tests/*_test.js (not the ones in SKIP_FULL)
//   node tests/run.js unit                  tests/unit/*.test.js - pure logic in Node, no browser, seconds
//   node tests/run.js needs bubbles_test    just these (the name with or without _test; smoke/<name> for tests/smoke/)
//   node tests/run.js zmiany                the tests for what changed since the last commit (tests/mapa_testow.json - measured: the
//                                           functions each test runs, the files it loads) + unit (+ smoke when the change is in
//                                           code every game runs); `zmiany --od REF`: since REF; `zmiany Bron data/Map003.json`:
//                                           for these files / plugins only; `zmiany --od znacznik[:name]`: since the marker
//   node tests/run.js znacznik [name]       the marker: the files as they are now (tests/znaczniki/, not in git) - set it when a
//                                           session begins, ask `zmiany --od znacznik` at its end (only what this session changed)
//   node tests/run.js mapa [names]        measures the map: every test (or these) once with the coverage on - not a pass/fail run,
//                                           long; `--czesc 1/2` (any list): half of it, balanced by time (two ports in parallel)
//   node tests/run.js --odswiez-mape <names>  the same for these tests (after a test or the code it tests changed a lot)
//   node tests/run.js affected Farming Dog  the tests that use these plugins (their parts too) + the smoke set
//   node tests/run.js changed               the same for the plugins changed since the last "full" run (else: git's changes)
//   options: --port N (CDP port, default CDP_PORT or 9396), --retry N (default 1), --timeout S (a test's limit, default 420; 900
//            when measuring), --list (only print what would run; with zmiany: why), --reuse / --no-reuse (one shared browser for
//            the run: a tab per test), --turbo N / --bez-turbo (N game updates a drawn frame - the list TURBO below), --czesc k/n
// The unit tests go all at once (several Node processes): the whole set in the time of the longest.
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
// not in "full": long runs that are not pass / fail tests (the marathon plays days and messages the phone), and the whole game in one
// go (przejscie_ciagiem_test, ~10-15 min: the prologue to the Heart's chamber - only on request, with --timeout 1500)
const SKIP_FULL = ["marathon_test", "przejscie_ciagiem_test"];
// turbo (tests/cdp.js TEST_TURBO): these run N game updates for each drawn frame - the same frames, the clock time divided (checked
// green both ways, 2026-10-23); --turbo N: every test so (to try one before it goes on this list), --bez-turbo: none
// (tried and left off: tavern_shift_test - P and the abort by the clock, heart_test - stops, creatures_test, birds_test - the aim's
// circle; underground_test is slower with it - the floors' generator is the work, not the frames)
const TURBO = { tavern_dice_test: 3, story_test: 3, tavern_life_test: 3, home_life_test: 3, forest_fight_test: 3, survival_test: 3 };

// ---------------------------------------------------------------- the command line
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf("--" + name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = name => { const i = args.indexOf("--" + name); if (i < 0) return false; args.splice(i, 1); return true; };
const PORT = Number(opt("port", process.env.CDP_PORT || 9396));
const RETRY = Number(opt("retry", 1));
const LIST = flag("list");
const REUSE_DEFAULT = true;   // (a shared browser for the run - see cdp.js CDP_ATTACH)
const NO_REUSE = flag("no-reuse"), REUSE = !NO_REUSE && (flag("reuse") || REUSE_DEFAULT);
const OD = opt("od", null);                       // zmiany --od REF
const TURBO_ALL = Number(opt("turbo", 0)) || 0;    // --turbo N: every test with N game updates a frame
const NO_TURBO = flag("bez-turbo");
const PART = opt("czesc", null);                  // --czesc k/n: the k-th of n parts of the list (balanced by the last times)
const REFRESH = flag("odswiez-mape");             // --odswiez-mape <names>: measure these into the map
const STALE = flag("nieaktualne");                // mapa --nieaktualne: the tests measured on an older plugin version
const MEASURE = REFRESH || args.includes("mapa");
const TIMEOUT = Number(opt("timeout", MEASURE ? 900 : 420));
if (!args.length && !REFRESH) { console.log("usage: node tests/run.js smoke|full|unit|zmiany [files] [--od REF|znacznik[:name]]|znacznik [name]|mapa [names]|affected <Plugin...>|changed|<name...> [--odswiez-mape <names>] [--czesc k/n] [--port N] [--retry N] [--timeout S] [--list] [--reuse|--no-reuse]"); process.exit(2); }
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
// the game's plugins (the game's list js/tawerna_wtyczki.js merged with js/plugins.js - tests/lib/wtyczki.js); a part belongs to
// its main plugin (Farming_Build -> Farming)
function pluginNames() {
    return require("./lib/wtyczki.js").nazwy();
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
// the tests that name these plugins in their code (and, with the map measured, the ones that run their functions - tests/lib/mapa.js)
function testsFor(plugins) {
    const words = new Set();
    for (const n of plugins) { words.add(n); words.add(n.split("_")[0]); }
    const re = new RegExp("\\b(" + [...words].map(w => w.replace(/[^\w]/g, "")).filter(Boolean).join("|") + ")\\b");
    const all = e2eAll().concat(unitAll(), smokeAll());
    const out = all.filter(n => { try { return re.test(fs.readFileSync(path.join(TESTS, n + ".js"), "utf8")); } catch (e) { return false; } });
    const M = require("./lib/mapa.js"), map = M.load();
    if (map) for (const p of plugins) for (const n of M.users(map, "js/plugins/" + p + ".js")) if (!out.includes(n) && all.includes(n)) out.push(n);
    return out;
}

const e2eAll = () => fs.readdirSync(TESTS).filter(f => /_test\.js$/.test(f)).map(f => f.replace(/\.js$/, "")).filter(n => !SKIP_FULL.includes(n)).sort();
const unitAll = () => (fs.existsSync(UNIT) ? fs.readdirSync(UNIT).filter(f => /\.test\.js$/.test(f)).sort().map(f => "unit/" + f.replace(/\.js$/, "")) : []);
const smokeAll = () => (fs.existsSync(path.join(TESTS, "smoke")) ? fs.readdirSync(path.join(TESTS, "smoke")).filter(f => f.endsWith(".js")).sort().map(f => "smoke/" + f.replace(/\.js$/, "")) : []);
// a test's usual time (the last run, else the map's measurement): for the estimate and for --czesc
const secsOf = n => { const l = LAST_BEFORE.tests[n]; if (l && l.secs) return l.secs; const m = mapCache().testy[n]; return m && m.sek ? m.sek : 30; };
let _map;
const mapCache = () => _map || (_map = require("./lib/mapa.js").load() || { testy: {} });

// ---------------------------------------------------------------- zmiany: the tests for what changed (tests/lib/mapa.js)
const why = new Map();   // name -> why it runs (printed with the list)
const isChangeArg = x => fs.existsSync(path.join(ROOT, x)) || fs.existsSync(path.join(ROOT, "js", "plugins", x.replace(/\.js$/, "") + ".js")) || /^(js|data|img|audio|tests)[\\/]/.test(x);
const toPath = x => {
    x = x.replace(/\\/g, "/").replace(/^\.\//, "");
    if (!x.includes("/") && fs.existsSync(path.join(ROOT, "js", "plugins", x.replace(/\.js$/, "") + ".js"))) return "js/plugins/" + x.replace(/\.js$/, "") + ".js";
    const abs = path.resolve(ROOT, x);
    return path.relative(ROOT, abs).replace(/\\/g, "/");
};
function pickForChanges(files) {
    const M = require("./lib/mapa.js"), mark = /^znacznik(?::(.+))?$/.exec(OD || ""), ref = mark ? null : OD || "HEAD";
    let changes, since;
    try {
        if (mark) { const r = M.markChanges(mark[1]); since = `od znacznika ${mark[1] || "domyslny"} (${r.when})`; changes = r.changes; if (files.length) { const want = new Set(files.map(toPath)); changes = changes.filter(c => want.has(c.path)); } }
        else { since = files.length ? "(podane pliki, od " + ref + ")" : "od " + ref; changes = files.length ? files.map(f => ({ path: toPath(f), status: "M" })) : M.gitChanges(ref); }
        for (const c of changes) if (c.baseSpec === undefined) c.baseSpec = ref + ":" + c.path;
    } catch (e) { console.log("zmiany: " + e.message); process.exit(2); }
    const game = changes.filter(c => /^(js|data|img|audio|fonts|effects|movies|css)\/|^index\.html$|^tests\/([^/]+_test\.js|smoke\/[^/]+\.js|fixtures\/[^/]+\.json|lib\/[^/]+\.js|cdp\.js|run\.js|unit\/.+)$/.test(c.path));
    const base = M.readBlobs(game.filter(c => M.needsText(c.path) && c.baseSpec).map(c => c.baseSpec));
    for (const c of game) {
        const f = path.join(ROOT, c.path), here = fs.existsSync(f);
        if (M.needsText(c.path)) { const b = c.baseSpec ? base.get(c.baseSpec) : null; c.base = b === undefined ? null : b; c.now = here ? fs.readFileSync(f, "utf8") : null; }
        else c.now = here ? undefined : null;
    }
    console.log(`zmiany ${since}: ${changes.length} plik(ów), ${game.length} dotyczy gry / testów`);
    const out = unitAll();
    const map = M.load();
    if (!map) {   // (no map yet: the old way - the tests that name the changed plugins, and smoke)
        const plugins = game.map(c => /^js\/plugins\/([^/]+)\.js$/.exec(c.path)).filter(Boolean).map(m => m[1]);
        console.log("  uwaga: brak tests/mapa_testow.json (node tests/run.js mapa) - testy wymieniające zmienione wtyczki + smoke");
        for (const n of SMOKE.concat(testsFor(plugins))) if (!out.includes(n)) out.push(n);
        return out;
    }
    const r = M.select(map, game);
    if (r.smoke.length) for (const n of SMOKE) { out.push(n); why.set(n, "smoke: " + r.smoke.slice(0, 3).join("; ") + (r.smoke.length > 3 ? "; …" : "")); }
    for (const [n, reasons] of r.tests) {
        if (SKIP_FULL.includes(n) || out.includes(n) || !resolve(n).file) continue;
        out.push(n);
        why.set(n, reasons.join("; "));
    }
    const shown = LIST ? r.notes : r.notes.slice(0, 12);
    for (const n of shown) console.log("  uwaga: " + n);
    if (shown.length < r.notes.length) console.log(`  (i ${r.notes.length - shown.length} uwag więcej - wszystkie: --list)`);
    const browser = out.filter(n => !n.startsWith("unit/")), secs = browser.reduce((s, n) => s + secsOf(n), 0), all = e2eAll().length + smokeAll().length;
    console.log(`  -> ${browser.length} test(ów) w przeglądarce z ${all} (+ ${out.length - browser.length} unit), ${browser.length ? "~" + Math.max(1, Math.round(secs / 60)) + " min" : "tylko unit (~10 s)"}` +
        (browser.length > 0.6 * all ? "  - to prawie pełny przebieg: zapytaj gracza" : "") + (map.zmierzono ? `  [mapa z ${map.zmierzono}]` : ""));
    return out;
}
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
const KEYWORDS = ["smoke", "full", "unit", "affected", "changed", "zmiany", "mapa", "znacznik"];
for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "smoke") names.push(...SMOKE);
    else if (a === "full") names.push(...e2eAll());
    else if (a === "unit") names.push(...unitAll());
    else if (a === "affected" || a === "changed") {
        let plugins = [];
        if (a === "changed") plugins = changedPlugins();
        else while (i + 1 < args.length && !KEYWORDS.includes(args[i + 1])) plugins.push(args[++i]);
        const t = testsFor(plugins);
        console.log(`${a}: ${plugins.length ? plugins.join(", ") : "(no plugin changed)"} -> ${t.length} test(s) + smoke`);
        names.push(...SMOKE, ...t);
    }
    else if (a === "zmiany") {
        const files = [];
        while (i + 1 < args.length && !KEYWORDS.includes(args[i + 1]) && isChangeArg(args[i + 1])) files.push(args[++i]);
        names.push(...pickForChanges(files));
    }
    else if (a === "znacznik") {   // (the files as they are now: zmiany --od znacznik[:name] later)
        const name = i + 1 < args.length && !KEYWORDS.includes(args[i + 1]) ? args[++i] : null;
        const r = require("./lib/mapa.js").mark(name);
        console.log(`znacznik ${name || "domyslny"}: ${r.files} plików zapamiętanych (${path.relative(ROOT, r.file)}); później: node tests/run.js zmiany --od znacznik${name ? ":" + name : ""}`);
    }
    else if (a === "mapa") {
        const own = [];
        while (i + 1 < args.length && !KEYWORDS.includes(args[i + 1])) own.push(args[++i]);
        if (STALE) {   // (--nieaktualne: the tests measured on an older version of a plugin, or while one changed)
            const M = require("./lib/mapa.js"), map = M.load(), stale = map ? M.staleTests(map) : [];
            console.log(`mapa --nieaktualne: ${stale.length} test(ów) zmierzonych na starszej wersji wtyczki`);
            names.push(...stale.filter(n => resolve(n).file));
        } else names.push(...(own.length ? own : e2eAll().concat(smokeAll())));
    }
    else names.push(a);
}
if (!names.length && args.includes("znacznik")) process.exit(0);
let list = [];
for (const n of names) { const r = resolve(n); if (!list.some(x => x.name === r.name)) list.push(r); }
if (MEASURE) {   // (the unit tests run in Node: nothing to measure in the browser)
    const u = list.filter(t => t.unit);
    if (u.length) console.log(`mapa: ${u.length} test(ów) unit pominiętych (bez przeglądarki)`);
    list = list.filter(t => !t.unit);
}
if (PART) {   // --czesc k/n: the longest first, each into the part that is the shortest so far; the k-th part
    const [k, n] = PART.split("/").map(Number);
    if (!(n >= 1 && k >= 1 && k <= n)) { console.log("--czesc k/n, e.g. 1/2"); process.exit(2); }
    const bins = Array.from({ length: n }, () => ({ secs: 0, items: [] }));
    for (const t of list.slice().sort((p, q) => secsOf(q.name) - secsOf(p.name))) { const b = bins.reduce((m, x) => (x.secs < m.secs ? x : m)); b.items.push(t); b.secs += secsOf(t.name); }
    list = bins[k - 1].items;
    console.log(`część ${k}/${n}: ${list.length} test(ów), ~${Math.round(bins[k - 1].secs / 60)} min`);
}
if (LIST) { for (const r of list) console.log((r.file ? "" : "(missing) ") + r.name + (why.has(r.name) ? "   <- " + why.get(r.name) : "")); process.exit(0); }

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
        // (measuring: tests/cdp.js writes the coverage and the requested files there; the plugins as they were at the start)
        const cover = MEASURE && !t.unit ? path.join(os.tmpdir(), `tawerna_mapa_${PORT}_${t.name.replace(/\//g, "_")}.json`) : null;
        if (cover) { try { fs.unlinkSync(cover); } catch (e) {} env.TEST_COVERAGE = cover; } else delete env.TEST_COVERAGE;
        const turbo = NO_TURBO ? 1 : TURBO_ALL || TURBO[t.name] || 0;
        if (turbo && !t.unit) env.TEST_TURBO = String(turbo); else if (!process.env.TEST_TURBO) delete env.TEST_TURBO;
        const before = cover ? require("./lib/mapa.js").pluginHashes() : null;
        const child = spawn(process.execPath, [t.file], { cwd: TESTS, stdio: ["ignore", fd, fd], env });
        let timedOut = false;
        const limit = t.unit ? 120 : TIMEOUT;
        const timer = setTimeout(() => { timedOut = true; killTree(child.pid); }, limit * 1000);
        child.on("exit", code => {
            clearTimeout(timer);
            fs.closeSync(fd);
            if (timedOut) fs.appendFileSync(out, `\nERR timeout: the test ran longer than ${limit} s and was stopped\n`);
            res({ code, timedOut, secs: Math.round((Date.now() - t0) / 1000), text: fs.readFileSync(out, "utf8"), cover, before });
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
    // the unit tests (Node, no browser) all at once, several at a time: the whole set in the time of the longest
    const early = new Map(), units = list.filter(t => t.unit && t.file);
    if (units.length > 1) {
        let next = 0;
        const worker = async () => { while (next < units.length) { const t = units[next++]; early.set(t.name, await runOnce(t)); } };
        await Promise.all(Array.from({ length: Math.min(units.length, Math.max(2, os.cpus().length - 2)) }, worker));
    }
    for (const t of list) {
        if (!t.file) { rows.push({ name: t.name, res: "-", status: "MISSING", secs: 0, tries: 0 }); sections.push(`=== ${t.name} : no such file`); console.log(`${t.name.padEnd(34)} MISSING`); continue; }
        let r, p, st, tries = 0;
        for (;;) {
            tries++;
            if (!t.unit && REUSE) await sharedBrowser();
            else if (!t.unit) await freePort(PORT);
            r = tries === 1 && early.has(t.name) ? early.get(t.name) : await runOnce(t);
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
        // (a measuring run is not a verdict: the "before" column stays as it was; the map notes the result)
        if (!MEASURE) writeLast(L => { L.tests[t.name] = { res, status: st, secs: r.secs, when: new Date().toISOString().slice(0, 16).replace("T", " "), port: PORT }; });
        console.log(`${t.name.padEnd(34)} ${res.padStart(7)}  ${st.padEnd(7)} ${String(r.secs).padStart(4)} s   before: ${before}${tries > 1 ? "  (" + tries + " tries)" : ""}`);
        if (r.cover) {
            let m = null;
            try { m = require("./lib/mapa.js").merge(t.name, { wynik: res, status: st, sek: r.secs }, r.cover, r.before); } catch (e) { console.log("    mapa: " + e.message); }
            console.log(m ? `    mapa: ${m.plugins} wtyczek, ${m.functions} wykonanych funkcji / bloków, ${m.files} plików, ${m.maps} map${m.unsure.length ? ", zmienione w trakcie: " + m.unsure.join(" ") : ""}` : "    mapa: brak pomiaru (test nie otworzył przeglądarki?)");
            try { fs.unlinkSync(r.cover); } catch (e) {}
        }
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
