// The map of the tests (tests/mapa_testow.json): which test runs which function of which plugin, and which of the game's files it
// loads - measured, not guessed. Each test is run once with V8's precise coverage on (tests/cdp.js TEST_COVERAGE: function by
// function, with call counts) and its requests to the game server noted; tests/run.js `mapa` (all, in parts) or
// `--odswiez-mape <test...>` (just these) measure, `zmiany` picks the tests for what changed (since the last commit, --od REF, or
// the files named). docs/TESTY.md, "Testy dobierane do zmian".
//
// The file:
//   testy:   { name: { id, kiedy, wynik, status, sek, niepewne? } }       id: the test's bit in the sets below (never reused)
//   wtyczki: { "js/plugins/X.js": { "<blob>": [[l0, l1, "name", "bits"], ...] } }
//            the functions of that version of the file (lines 1-based, the first and the last), bits: the tests that called it
//            (a base64 bit set of ids); the version is a git blob id - the measured text is kept in .git (git hash-object -w,
//            nothing staged or committed), so a change made later is mapped back onto the lines that were measured
//   pliki:   { "data/Map003.json": "bits", ... }     the files the page asked for
//   mapy:    { "data/Map003.json": "bits", ... }     the maps the game went onto (Game_Map.setup) - not the ones plugins read ahead
// A test is in exactly one version of each plugin it loaded (the file's own top-level function always runs).
// How a change picks tests (select): a changed line of code (comments and blank lines do not count) -> the innermost measured
// function round it in each version -> the tests that ran it; a function nearly every test runs (COMMON: the per-frame hooks) ->
// smoke; a line at the plugin's top level (run once as it loads: tables, constants) -> the names it declares or stands in -> the
// functions that use them, in this plugin and in the plugins that name it (a _Data table read by its plugin) -> their tests.
// A map file -> the tests that went onto it; a picture or a sound -> the tests that loaded it (a new one: the plugin lines and
// maps that name it). Markers (mark / markChanges): the files as they were when a session began.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const TESTS = path.join(ROOT, "tests");
const FILE = path.join(TESTS, "mapa_testow.json");
const LOCK = FILE + ".lock";
// a function called by this share of the tests that load its plugin runs in every game (the per-frame hooks, the menus every
// test opens): a change there is "broad" - the smoke set
const COMMON = 0.85;
const OPIS = "Mapa testów: która funkcja której wtyczki i który plik gry jest używany przez który test (pomiar pokrycia V8 + " +
    "żądania do serwera). Robi ją `node tests/run.js mapa` / `--odswiez-mape <test>`, czyta `node tests/run.js zmiany` - docs/TESTY.md.";

// ---------------------------------------------------------------- bit sets (base64, bit i = test id i)
function bitsPut(b64, i, on) {
    let buf = Buffer.from(b64 || "", "base64");
    const at = i >> 3;
    if (buf.length <= at) {
        if (!on) return b64 || "";
        const nb = Buffer.alloc(at + 1);
        buf.copy(nb);
        buf = nb;
    }
    if (on) buf[at] |= 1 << (i & 7); else buf[at] &= ~(1 << (i & 7));
    let n = buf.length;
    while (n && !buf[n - 1]) n--;
    return buf.subarray(0, n).toString("base64");
}
function bitsIds(b64) {
    const buf = Buffer.from(b64 || "", "base64"), out = [];
    for (let i = 0; i < buf.length * 8; i++) if (buf[i >> 3] & (1 << (i & 7))) out.push(i);
    return out;
}

// ---------------------------------------------------------------- git
function git(args, input) {
    const r = spawnSync("git", args, { cwd: ROOT, input, maxBuffer: 1 << 30, windowsHide: true });
    if (r.status !== 0) throw new Error("git " + args.join(" ") + ": " + String(r.stderr || r.error).trim());
    return r.stdout;
}
// files (paths in the project) kept as git objects - not staged, not committed; { path: blob id (12 hex) }
function storeBlobs(rels) {
    const out = {};
    if (!rels.length) return out;
    const ids = git(["hash-object", "-w", "--stdin-paths"], rels.join("\n") + "\n").toString().trim().split(/\r?\n/);
    rels.forEach((r, i) => { out[r] = ids[i].slice(0, 12); });
    return out;
}
// the texts of objects ("<blob>" or "<ref>:<path>"): Map spec -> text, null for what git does not have
function readBlobs(specs) {
    const uniq = [...new Set(specs)], res = new Map();
    if (!uniq.length) return res;
    const out = git(["cat-file", "--batch"], uniq.join("\n") + "\n");
    let p = 0;
    for (const s of uniq) {
        const nl = out.indexOf(10, p);
        if (nl < 0) { res.set(s, null); continue; }
        const head = out.subarray(p, nl).toString();
        p = nl + 1;
        const m = /^(\S+) (\S+) (\d+)$/.exec(head);
        if (!m) { res.set(s, null); continue; }   // ("<spec> missing")
        const n = Number(m[3]);
        res.set(s, m[2] === "blob" ? out.subarray(p, p + n).toString("utf8") : null);
        p += n + 1;
    }
    return res;
}
// what changed since `ref` (default HEAD): tracked changes (staged or not) and new files git does not ignore; [{ path, status }]
function gitChanges(ref) {
    const out = [];
    const parts = git(["diff", "--name-status", "-z", "--no-renames", ref || "HEAD", "--"]).toString().split("\0").filter(Boolean);
    for (let i = 0; i + 1 < parts.length; i += 2) out.push({ path: parts[i + 1], status: parts[i][0] });
    for (const p of git(["ls-files", "--others", "--exclude-standard", "-z"]).toString().split("\0").filter(Boolean)) out.push({ path: p, status: "?" });
    return out;
}
const sha1 = s => crypto.createHash("sha1").update(s).digest("hex");
// the plugin files as they are now: { "js/plugins/X.js": sha1 } (run.js notes them before a measured test: a file changed while
// the test ran is not mapped by lines)
function pluginHashes() {
    const dir = path.join(ROOT, "js", "plugins"), out = {};
    for (const f of fs.readdirSync(dir)) if (/\.js$/.test(f)) { try { out["js/plugins/" + f] = sha1(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) {} }
    return out;
}

// ---------------------------------------------------------------- lines and their diff
const splitLines = text => (text === null || text === undefined ? [] : String(text).split("\n"));
function lineStarts(text) {
    const s = [0];
    for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) s.push(i + 1);
    return s;
}
function lineAt(starts, offset) {   // 1-based
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= offset) lo = mid; else hi = mid - 1; }
    return lo + 1;
}
// Myers' diff of two line lists: the changed blocks [{ a0, a1, b0, b1 }] (0-based, ends excluded). Past 3000 edits the middle is
// one block (a whole rewrite - the same answer for picking tests).
function diffLines(a, b) {
    const n0 = a.length, m0 = b.length;
    let pre = 0;
    while (pre < n0 && pre < m0 && a[pre] === b[pre]) pre++;
    let suf = 0;
    while (suf < n0 - pre && suf < m0 - pre && a[n0 - 1 - suf] === b[m0 - 1 - suf]) suf++;
    const N = n0 - pre - suf, M = m0 - pre - suf;
    if (!N && !M) return [];
    if (!N || !M) return [{ a0: pre, a1: pre + N, b0: pre, b1: pre + M }];
    const ids = new Map(), id = s => { let v = ids.get(s); if (v === undefined) ids.set(s, v = ids.size); return v; };
    const A = new Int32Array(N), B = new Int32Array(M);
    for (let i = 0; i < N; i++) A[i] = id(a[pre + i]);
    for (let j = 0; j < M; j++) B[j] = id(b[pre + j]);
    const MAXD = Math.min(N + M, 3000), off = MAXD + 1, v = new Int32Array(2 * MAXD + 3), trace = [];
    let D = -1;
    outer: for (let d = 0; d <= MAXD; d++) {
        trace.push(v.slice(off - d - 1, off + d + 2));   // (the values of the round before: k from -d-1 to d+1)
        for (let k = -d; k <= d; k += 2) {
            let x = (k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])) ? v[off + k + 1] : v[off + k - 1] + 1, y = x - k;
            while (x < N && y < M && A[x] === B[y]) { x++; y++; }
            v[off + k] = x;
            if (x >= N && y >= M) { D = d; break outer; }
        }
    }
    if (D < 0) return [{ a0: pre, a1: pre + N, b0: pre, b1: pre + M }];
    const same = [];
    let x = N, y = M;
    for (let d = D; d > 0; d--) {
        const t = trace[d], at = k => t[k + d + 1], k = x - y;
        const down = k === -d || (k !== d && at(k - 1) < at(k + 1)), pk = down ? k + 1 : k - 1;
        const px = at(pk), py = px - pk, xs = down ? px : px + 1;
        while (x > xs) { x--; y--; same.push([x, y]); }
        x = px; y = py;
    }
    while (x > 0 && y > 0) { x--; y--; same.push([x, y]); }
    same.reverse();
    const hunks = [];
    let ax = 0, by = 0;
    for (const [sx, sy] of same) {
        if (sx > ax || sy > by) hunks.push({ a0: pre + ax, a1: pre + sx, b0: pre + by, b1: pre + sy });
        ax = sx + 1; by = sy + 1;
    }
    if (ax < N || by < M) hunks.push({ a0: pre + ax, a1: pre + N, b0: pre + by, b1: pre + M });
    return hunks;
}
// each line of b -> the lines of a it stands for: [lo, hi] (0-based); a changed line - the block it replaced (or the lines round
// the place where a was cut)
function mapBack(hunks, n0, m0) {
    const lo = new Int32Array(m0), hi = new Int32Array(m0);
    let ai = 0, bj = 0;
    const equal = upTo => { for (; bj < upTo; bj++, ai++) { lo[bj] = ai; hi[bj] = ai; } };
    for (const h of hunks) {
        equal(h.b0);
        const l = h.a1 > h.a0 ? h.a0 : Math.max(0, h.a0 - 1), r = h.a1 > h.a0 ? h.a1 - 1 : Math.min(n0 - 1, h.a0);
        for (; bj < h.b1; bj++) { lo[bj] = l; hi[bj] = Math.max(l, r); }
        ai = h.a1;
    }
    equal(m0);
    return { lo, hi };
}
// the lines of b that differ from a (0-based): a cut leaves the two lines round it
function changedLines(hunks, m0) {
    const out = new Set();
    for (const h of hunks) {
        if (h.b1 > h.b0) for (let j = h.b0; j < h.b1; j++) out.add(j);
        else { if (h.b0 - 1 >= 0) out.add(h.b0 - 1); if (h.b0 < m0) out.add(h.b0); }
    }
    return [...out].sort((p, q) => p - q);
}

// a place in a file as one number (line 1-based, column 0-based), and the innermost of ranges { a, b } (sorted: a up, b down) round [a, b]
const COLS = 100000;
const pos = (l, c) => l * COLS + Math.min(c, COLS - 1);
function innermostOf(list, a, b) {
    let lo = 0, hi = list.length - 1, at = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (list[mid].a <= a) { at = mid; lo = mid + 1; } else hi = mid - 1; }
    for (let i = at; i >= 0; i--) if (list[i].b >= b) return list[i];
    return null;
}

// ---------------------------------------------------------------- the map file
const now = () => { const d = new Date(), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
function empty() { return { opis: OPIS, zmierzono: null, bloki: true, testy: {}, pliki: {}, mapy: {}, wtyczki: {} }; }
function load() {
    try { const m = JSON.parse(fs.readFileSync(FILE, "utf8")), out = Object.assign(empty(), m); out.bloki = !!m.bloki; return out; } catch (e) { return null; }
}
// one test, one file, one function per line (git shows what a measurement changed)
function serialize(map) {
    const J = JSON.stringify, lines = ["{", `"opis": ${J(map.opis)},`, `"zmierzono": ${J(map.zmierzono)},`, `"bloki": ${J(!!map.bloki)},`];
    const block = (key, obj, last) => {
        lines.push(`${J(key)}: {`);
        const ks = Object.keys(obj).sort();
        ks.forEach((k, i) => lines.push(`${J(k)}: ${J(obj[k])}` + (i < ks.length - 1 ? "," : "")));
        lines.push("}" + (last ? "" : ","));
    };
    block("testy", map.testy);
    block("pliki", map.pliki);
    block("mapy", map.mapy || {});
    lines.push(`"wtyczki": {`);
    const rels = Object.keys(map.wtyczki).sort();
    rels.forEach((rel, ri) => {
        lines.push(`${J(rel)}: {`);
        const vers = Object.keys(map.wtyczki[rel]);
        vers.forEach((ver, vi) => {
            lines.push(`${J(ver)}: [`);
            const list = map.wtyczki[rel][ver];
            list.forEach((f, fi) => lines.push(J(f) + (fi < list.length - 1 ? "," : "")));
            lines.push("]" + (vi < vers.length - 1 ? "," : ""));
        });
        lines.push("}" + (ri < rels.length - 1 ? "," : ""));
    });
    lines.push("}", "}", "");
    return lines.join("\n");
}
function save(map) {
    const tmp = FILE + "." + process.pid + ".tmp";
    fs.writeFileSync(tmp, serialize(map));
    for (let i = 0; i < 20; i++) { try { fs.renameSync(tmp, FILE); return; } catch (e) { spawnSync(process.execPath, ["-e", "setTimeout(()=>{},150)"]); } }
    fs.copyFileSync(tmp, FILE);
    try { fs.unlinkSync(tmp); } catch (e) {}
}
// two measuring runs (two ports) write one file: a lock file round read-merge-write
function withLock(fn) {
    for (let i = 0; i < 400; i++) {
        try { fs.writeFileSync(LOCK, String(process.pid), { flag: "wx" }); break; }
        catch (e) {
            try { if (Date.now() - fs.statSync(LOCK).mtimeMs > 60000) { fs.unlinkSync(LOCK); continue; } } catch (e2) {}
            spawnSync(process.execPath, ["-e", "setTimeout(()=>{},150)"]);
        }
    }
    try { return fn(); } finally { try { fs.unlinkSync(LOCK); } catch (e) {} }
}
// a test's bit out of everything (before it is measured again, or when its file is gone)
function clearTest(map, id) {
    for (const rel of Object.keys(map.wtyczki)) {
        const vers = map.wtyczki[rel];
        for (const ver of Object.keys(vers)) {
            for (const f of vers[ver]) if (f[3]) f[3] = bitsPut(f[3], id, false);
            if (!vers[ver].some(f => f[3])) delete vers[ver];
        }
        if (!Object.keys(vers).length) delete map.wtyczki[rel];
    }
    for (const key of ["pliki", "mapy"]) {
        const o = map[key] || {};
        for (const p of Object.keys(o)) { o[p] = bitsPut(o[p], id, false); if (!o[p]) delete o[p]; }
    }
}

// ---------------------------------------------------------------- a measured test into the map
// name: the test (run.js's name), info: { wynik, status, sek }, coverFile: what tests/cdp.js wrote, before: pluginHashes() at the
// test's start. Returns { plugins, functions, files, maps, unsure } or null (no coverage written - the test crashed before its browser).
function merge(name, info, coverFile, before) {
    let cover;
    try { cover = JSON.parse(fs.readFileSync(coverFile, "utf8")); } catch (e) { return null; }
    return withLock(() => {
        let map = load() || empty();
        if (!map.bloki) map = empty();   // (a map of functions only, from before 2026-10-23 18:00: measured anew with the blocks)
        map.bloki = true;
        const old = map.testy[name];
        const id = old ? old.id : Object.values(map.testy).reduce((m, t) => Math.max(m, t.id + 1), 0);
        clearTest(map, id);
        // its functions and blocks, in the version of each file it ran: [l0, l1, name, bits, c0, c1] (lines 1-based, columns 0-based,
        // the last character's); a range the version did not have yet takes the other tests' bits of the innermost one round it (V8
        // leaves out a block whose count is its parent's), and this test's bit on every range is that of its own innermost range
        const rels = Object.keys(cover.scripts || {}).filter(r => /^js\/plugins\/[^/]+\.js$/.test(r) && fs.existsSync(path.join(ROOT, r)));
        const texts = {}, unsure = [];
        for (const r of rels) texts[r] = fs.readFileSync(path.join(ROOT, r), "utf8");
        const sure = rels.filter(r => { const ok = !before || !before[r] || sha1(texts[r]) === before[r]; if (!ok) unsure.push(r); return ok; });
        const blobs = storeBlobs(sure);
        let functions = 0;
        const order = (p, q) => p.a - q.a || q.b - p.b;
        for (const r of sure) {
            const starts = lineStarts(texts[r]), ver = blobs[r];
            const vers = map.wtyczki[r] || (map.wtyczki[r] = {}), list = vers[ver] || (vers[ver] = []);
            const at = off => { const l = lineAt(starts, off); return { l, c: off - starts[l - 1] }; };
            // this test's own ranges, by position
            const mine = [];
            for (const key of Object.keys(cover.scripts[r])) {
                const [s, e] = key.split(":").map(Number), [hit, fname] = cover.scripts[r][key];
                if (e > texts[r].length + 1 || e <= s) continue;
                const p0 = at(s), p1 = at(Math.max(s, e - 1));
                mine.push({ l0: p0.l, c0: p0.c, l1: p1.l, c1: p1.c, a: pos(p0.l, p0.c), b: pos(p1.l, p1.c), hit: hit > 0, name: String(fname || "").slice(0, 40) });
            }
            mine.sort(order);
            const have = list.map(f => ({ f, a: pos(f[0], f[4] || 0), b: pos(f[1], f[5] === undefined ? COLS - 1 : f[5]) })).sort(order);
            const index = new Map(have.map(h => [h.a + ":" + h.b, h]));
            const added = [];
            for (const m of mine) {
                if (index.has(m.a + ":" + m.b)) continue;
                const parent = innermostOf(have, m.a, m.b);
                const f = [m.l0, m.l1, m.name, parent ? parent.f[3] : "", m.c0, m.c1];
                const h = { f, a: m.a, b: m.b };
                added.push(h);
                index.set(m.a + ":" + m.b, h);
            }
            for (const h of added) list.push(h.f);
            const all = have.concat(added);
            for (const h of all) {
                const own = innermostOf(mine, h.a, h.b);
                if (own && own.hit) { h.f[3] = bitsPut(h.f[3], id, true); functions++; }
            }
            list.sort((p, q) => p[0] - q[0] || (p[4] || 0) - (q[4] || 0) || q[1] - p[1]);
        }
        const urls = Object.keys(cover.urls || {});
        for (const u of urls) map.pliki[u] = bitsPut(map.pliki[u] || "", id, true);
        const maps = Object.keys(cover.maps || {}).map(Number).filter(n => n > 0).map(n => "data/Map" + String(n).padStart(3, "0") + ".json");
        map.mapy = map.mapy || {};
        for (const p of maps) map.mapy[p] = bitsPut(map.mapy[p] || "", id, true);
        map.testy[name] = Object.assign({ id }, info, { kiedy: now() }, unsure.length ? { niepewne: unsure } : {}, cover.maps ? { zMapami: true } : {});
        map.zmierzono = now();
        map.opis = OPIS;
        save(map);
        return { plugins: sure.length, functions, files: urls.length, maps: maps.length, unsure };
    });
}
// the tests measured on a version of a plugin that is not the file as it is now (or while it changed): `mapa --nieaktualne`
// measures them again - fewer versions in the map, the newest lines
function staleTests(map) {
    const rels = Object.keys(map.wtyczki).filter(r => fs.existsSync(path.join(ROOT, r)));
    const ids = rels.length ? git(["hash-object", "--stdin-paths"], rels.join("\n") + "\n").toString().trim().split(/\r?\n/) : [];
    const cur = {};
    rels.forEach((r, i) => { cur[r] = ids[i].slice(0, 12); });
    const byId = new Map(Object.entries(map.testy).map(([n, t]) => [t.id, n])), out = new Set();
    for (const [rel, vers] of Object.entries(map.wtyczki)) {
        for (const [ver, list] of Object.entries(vers)) {
            if (ver === cur[rel]) continue;
            let top = null;
            for (const f of list) if (!top || (f[1] - f[0]) > (top[1] - top[0])) top = f;
            for (const id of bitsIds(top && top[3])) if (byId.has(id)) out.add(byId.get(id));
        }
    }
    for (const [n, t] of Object.entries(map.testy)) if (t.niepewne) out.add(n);
    return [...out].sort();
}
// a test that is gone (its file deleted) out of the map
function forget(map, name) {
    const t = map.testy[name];
    if (!t) return;
    clearTest(map, t.id);
    delete map.testy[name];
}

// ---------------------------------------------------------------- a marker: the files as they are now (zmiany --od znacznik)
// tests/znaczniki/<name>.json (not in git): each file's size, time and hash; the texts a change is read against (the plugins, the
// plugin lists, Items / Weapons / Armors) kept as git objects. A session sets one when it starts (node tests/run.js znacznik [name])
// and asks `zmiany --od znacznik[:name]` at its end: only what changed since, not the others' work before it.
const MARKS = path.join(TESTS, "znaczniki");
const needsText = p => /^js\/plugins\/[^/]+\.js$/.test(p) || p === "js/tawerna_wtyczki.js" || p === "js/plugins.js" || /^data\/(Items|Weapons|Armors)\.json$/.test(p) ||
    /^js\/teksty\/[^/]+\.txt$/.test(p);
function scanFiles() {
    const out = [];
    const walk = (dir, keep) => {
        let list;
        try { list = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }); } catch (e) { return; }
        for (const d of list) {
            const rel = dir + "/" + d.name;
            if (d.isDirectory()) walk(rel, keep);
            else if (keep(rel)) out.push(rel);
        }
    };
    for (const d of ["js", "data", "img", "audio", "fonts", "effects", "css"]) walk(d, () => true);
    walk("tests", rel => /^tests\/([^/]+_test\.js|smoke\/[^/]+\.js|unit\/[^/]+\.js|fixtures\/[^/]+\.json|lib\/[^/]+\.js|cdp\.js|run\.js)$/.test(rel));
    if (fs.existsSync(path.join(ROOT, "index.html"))) out.push("index.html");
    return out;
}
const markFile = name => path.join(MARKS, (name || "domyslny").replace(/[^\w.-]/g, "_") + ".json");
function mark(name) {
    const files = {}, texts = [];
    for (const rel of scanFiles()) {
        const st = fs.statSync(path.join(ROOT, rel));
        files[rel] = [st.size, Math.round(st.mtimeMs), sha1(fs.readFileSync(path.join(ROOT, rel))).slice(0, 16)];
        if (needsText(rel)) texts.push(rel);
    }
    const blobs = storeBlobs(texts);
    for (const rel of texts) files[rel].push(blobs[rel]);
    fs.mkdirSync(MARKS, { recursive: true });
    fs.writeFileSync(markFile(name), JSON.stringify({ kiedy: now(), pliki: files }));
    return { file: markFile(name), files: Object.keys(files).length };
}
// what changed since the marker: [{ path, status, baseSpec }] (baseSpec: the blob of the text then, null when it was not there)
function markChanges(name) {
    let m;
    try { m = JSON.parse(fs.readFileSync(markFile(name), "utf8")); } catch (e) { throw new Error("brak znacznika " + (name || "domyslny") + " - node tests/run.js znacznik" + (name ? " " + name : "")); }
    const out = [], seen = new Set();
    for (const rel of scanFiles()) {
        seen.add(rel);
        const was = m.pliki[rel], st = fs.statSync(path.join(ROOT, rel));
        if (!was) { out.push({ path: rel, status: "A", baseSpec: null }); continue; }
        if (was[0] === st.size && was[1] === Math.round(st.mtimeMs)) continue;
        if (sha1(fs.readFileSync(path.join(ROOT, rel))).slice(0, 16) === was[2]) continue;
        out.push({ path: rel, status: "M", baseSpec: was[3] || null });
    }
    for (const rel of Object.keys(m.pliki)) if (!seen.has(rel)) out.push({ path: rel, status: "D", baseSpec: m.pliki[rel][3] || null });
    return { changes: out, when: m.kiedy };
}

// ---------------------------------------------------------------- picking the tests for a change
// One measured version of a plugin: its functions and blocks (0-based lines; a, b: the places as numbers), the tests measured on it
// (those that ran its top level), line -> the innermost range round the line's first character of code; the map from a text as it
// is now back onto these lines is made when asked (backTo)
function makeVersion(rel, ver, list, text) {
    const fns = list.map(f => ({ l0: f[0] - 1, l1: f[1] - 1, name: f[2], ids: bitsIds(f[3]), a: pos(f[0], f[4] || 0), b: pos(f[1], f[5] === undefined ? COLS - 1 : f[5]) }));
    const lines = text === null || text === undefined ? null : splitLines(text), n = lines ? lines.length : 0;
    let top = null;
    for (const f of fns) if (!top || f.b - f.a > top.b - top.a) top = f;
    const inner = new Int32Array(Math.max(n, 1)).fill(-1);
    const first = l => { const L = lines ? lines[l] || "" : ""; return pos(l + 1, L.length - L.trimStart().length); };
    fns.map((f, i) => i).sort((p, q) => (fns[q].b - fns[q].a) - (fns[p].b - fns[p].a))
        .forEach(i => { for (let l = Math.max(0, fns[i].l0); l <= Math.min(n - 1, fns[i].l1); l++) { const P = first(l); if (P >= fns[i].a && P <= fns[i].b) inner[l] = i; } });
    // (a wrapper: the file's own function and the plugin's IIFE - half the file or more; a line whose innermost range is one is
    // "top level": run once as the plugin loads)
    const wrapper = i => i < 0 || fns[i].l1 - fns[i].l0 + 1 >= 0.5 * n;
    return { rel, ver, fns, lines, n, measured: top ? top.ids : [], inner, wrapper, back: null };
}
// a range's name for the reasons: a block (an if's branch, the rest after an early return) by its function
const shownName = n => (/#$/.test(n) ? (n.slice(0, -1) || "funkcja bez nazwy") + " (blok)" : n || "funkcja bez nazwy");
function backTo(V, nowLines) {
    if (!V.lines) return null;
    if (!V.back || V.backFor !== nowLines) { V.back = mapBack(diffLines(V.lines, nowLines), V.n, nowLines.length); V.backFor = nowLines; }
    return V.back;
}
// comment or blank: a change there changes nothing that runs
const trivial = s => { const t = String(s).trim(); return !t || t.startsWith("//") || t.startsWith("/*") || t.startsWith("*"); };
// the lines of b that changed against a and are code (0-based); a cut of code leaves the two lines round it
function codeChanges(aLines, bLines) {
    const out = new Set();
    for (const h of diffLines(aLines, bLines)) {
        let any = false;
        for (let j = h.b0; j < h.b1; j++) if (!trivial(bLines[j])) { out.add(j); any = true; }
        let cut = false;
        for (let i = h.a0; i < h.a1; i++) if (!trivial(aLines[i])) cut = true;
        if (cut && !any) { if (h.b0 - 1 >= 0) out.add(h.b0 - 1); if (h.b0 < bLines.length) out.add(h.b0); }
    }
    return [...out].sort((p, q) => p - q);
}
const ENGINE_NAMES = /^(window|this|self|T|Tawerna|Game_\w+|Scene_\w+|Window_\w+|Sprite\w*|Spriteset_\w+|Bitmap|Graphics|Input|TouchInput|\w+Manager)$/;
// the names a top-level line stands for: what it declares, the object it writes into, and the declaration it is inside (a table's
// line -> the table)
function namesAt(lines, j) {
    const names = new Set(), line = lines[j] || "";
    let m;
    const decl = /\b(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/g;
    while ((m = decl.exec(line))) names.add(m[1]);
    // (an assignment into an object of the plugin's own: BUSTS["$Npc_X:0"] = ..., D.SPEED = 3 - that object; not the engine's classes)
    const asg = /^\s*([A-Za-z_$][\w$]*)\s*(?:\.[\w$]+|\[[^\]]*\])+\s*=(?!=)/.exec(line);
    if (asg && !ENGINE_NAMES.test(asg[1])) names.add(asg[1]);
    const des = /\b(?:const|let|var)\s*[{[]([^}\]]*)[}\]]\s*=/.exec(line);
    if (des) for (const part of des[1].split(",")) { const k = part.split(":").pop().split("=")[0].trim(); if (/^[A-Za-z_$][\w$]*$/.test(k)) names.add(k); }
    const ind = s => s.length - s.trimStart().length;
    let cur = ind(line);
    for (let k = j - 1; k >= 0 && cur > 0; k--) {
        const L = lines[k];
        if (!L.trim() || trivial(L)) continue;
        const i = ind(L);
        if (i >= cur) continue;
        cur = i;
        const d = /^\s*(?:(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=|([A-Za-z_$][\w$]*)\s*:)/.exec(L);
        if (d) names.add(d[1] || d[2]);
        if (d && d[1]) break;
    }
    for (const n of [...names]) if (n.length < 2) names.delete(n);
    return names;
}

// The tests for a change. changes: [{ path, base, now }] - for a plugin (and the plugin lists, Items / Weapons / Armors) the texts
// before and now (null: not there), for the other files base / now undefined (now null: deleted). o.blobs (Map version -> text) and
// o.now ({ path: text }) instead of .git and the disk (tests/unit/mapa.test.js). Returns { tests: Map(name -> [reasons]),
// smoke: [what asks for the smoke set], notes: [lines to show] }.
function select(map, changes, o = {}) {
    const byId = new Map(Object.entries(map.testy).map(([n, t]) => [t.id, n]));
    const tests = new Map(), smoke = [], notes = [], allIds = [...byId.keys()];
    const add = (name, why) => { if (!tests.has(name)) tests.set(name, []); const l = tests.get(name); if (!l.includes(why) && l.length < 6) l.push(why); };
    const addIds = (ids, why) => { for (const id of ids) { const n = byId.get(id); if (n) add(n, why); } };
    const short = rel => rel.replace(/^js\/plugins\//, "");
    const range = ls => { const r = []; for (const l of ls) { const last = r[r.length - 1]; if (last && l === last[1] + 1) last[1] = l; else r.push([l, l]); } return r.map(([a, b]) => a === b ? `${a + 1}` : `${a + 1}-${b + 1}`).join(","); };

    // the measured versions, their texts out of .git once
    const blobIds = Object.values(map.wtyczki).flatMap(v => Object.keys(v));
    let blobs = null;
    const texts = () => blobs || (blobs = o.blobs || readBlobs(blobIds));   // (o.blobs: Map version -> text - tests/unit/mapa.test.js)
    const vcache = new Map();
    const versions = rel => {
        if (!vcache.has(rel)) { const vers = map.wtyczki[rel] || {}; vcache.set(rel, Object.keys(vers).map(v => makeVersion(rel, v, vers[v], texts().get(v)))); }
        return vcache.get(rel);
    };
    const nowCache = new Map();
    const nowOf = (rel, given) => {
        if (given !== undefined && given !== null) return splitLines(given);
        if (!nowCache.has(rel)) nowCache.set(rel, splitLines(o.now && o.now[rel] !== undefined ? o.now[rel] : readNow(rel)));
        return nowCache.get(rel);
    };
    // the tests that use a plugin at all: they ran one of its functions that fewer than USERS of the tests run
    const usersOf = rel => pluginUsers(versions(rel), nowOf(rel));

    // lines of a plugin as it is now -> the measured functions round them (not the wrappers): their tests, "common" when nearly
    // every test runs one
    function idsAt(rel, nowLines, lines) {
        const res = { ids: new Set(), common: false, found: 0 };
        for (const V of versions(rel)) {
            const back = backTo(V, nowLines);
            if (!back) continue;
            const seen = new Set();
            for (const j of lines) for (let l = back.lo[j]; l <= back.hi[j]; l++) {
                if (l < 0 || l >= V.n) continue;
                const i = V.inner[l];
                if (V.wrapper(i) || seen.has(i)) continue;
                seen.add(i);
                res.found++;
                if (V.fns[i].ids.length >= COMMON * Math.max(1, V.measured.length)) res.common = true;
                else for (const id of V.fns[i].ids) res.ids.add(id);
            }
        }
        return res;
    }
    // the functions that use one of these names - in this plugin as it is now (a new name too), and in the plugins that name this
    // one (a _Data table read by its plugin: distinctive names only) -> their tests
    function byNames(rel, nowLines, names, skip) {
        const res = { ids: new Set(), common: false, found: 0 };
        if (!names.size) return res;
        const base = path.basename(rel, ".js"), family = base.split("_")[0];
        const esc = n => n.replace(/\$/g, "\\$");
        const reOwn = new RegExp("(^|[^\\w$])(" + [...names].map(esc).join("|") + ")(?![\\w$])");
        const own = [];
        nowLines.forEach((L, j) => { if (!skip.has(j) && !trivial(L) && reOwn.test(L)) own.push(j); });
        const r0 = idsAt(rel, nowLines, own);
        for (const id of r0.ids) res.ids.add(id);
        res.common = r0.common; res.found = r0.found;
        const distinctive = [...names].filter(n => n.length >= 5 || /^[A-Z][A-Z0-9_]{2,}$/.test(n)).map(esc);
        if (!distinctive.length) return res;
        const reOther = new RegExp("(^|[^\\w$])(" + distinctive.join("|") + ")(?![\\w$])"), mentions = new RegExp("\\b(" + base + "|" + family + ")\\b");
        for (const other of Object.keys(map.wtyczki)) {
            if (other === rel) continue;
            for (const V of versions(other)) {
                if (!V.lines || !mentions.test(V.lines.join("\n"))) continue;
                const seen = new Set();
                V.lines.forEach((L, l) => {
                    if (trivial(L) || !reOther.test(L)) return;
                    const i = V.inner[l];
                    if (V.wrapper(i) || seen.has(i)) return;
                    seen.add(i);
                    res.found++;
                    if (V.fns[i].ids.length >= COMMON * Math.max(1, V.measured.length)) res.common = true;
                    else for (const id of V.fns[i].ids) res.ids.add(id);
                });
            }
        }
        return res;
    }
    // a top-level statement with no name (a call: T.inject(...), T.talk.takeover(...)): its own lines down to where it closes
    function statementLines(lines, j) {
        const ind = s => s.length - s.trimStart().length, base = ind(lines[j] || ""), out = [];
        for (let k = j + 1; k < lines.length && k < j + 300; k++) {
            const L = lines[k];
            if (!L.trim()) continue;
            out.push(k);
            if (ind(L) <= base) break;
        }
        return out;
    }
    // changed lines of a plugin (as it is now, 0-based) -> the tests; `what` names the change in the reasons
    function linesToTests(rel, nowLines, lines, what) {
        const Vs = versions(rel), name = short(rel);
        if (!Vs.length) return false;
        const exact = new Map(), uncovered = new Map(), common = [], top = [];
        let lost = Vs.every(V => !V.lines);
        for (const j of lines) {
            const ids = new Set();
            let measured = 0, fname = null, inFn = false, atTop = false;
            for (const V of Vs) {
                const back = backTo(V, nowLines);
                if (!back) continue;
                measured += V.measured.length;
                for (let l = back.lo[j]; l <= back.hi[j]; l++) {
                    if (l < 0 || l >= V.n) continue;
                    const i = V.inner[l];
                    if (V.wrapper(i)) { atTop = true; continue; }
                    inFn = true;
                    for (const id of V.fns[i].ids) ids.add(id);
                    if (fname === null || V.fns[i].name.replace(/#$/, "")) fname = V.fns[i].name;
                }
            }
            if (!measured) continue;
            if (atTop) top.push(j);
            if (!inFn) continue;
            const fn = shownName(fname || "");
            if (ids.size >= COMMON * measured) common.push(j);
            else if (ids.size) { if (!exact.has(fn)) exact.set(fn, { lines: [], ids: new Set() }); exact.get(fn).lines.push(j); for (const id of ids) exact.get(fn).ids.add(id); }
            else { if (!uncovered.has(fn)) uncovered.set(fn, []); uncovered.get(fn).push(j); }
        }
        for (const [fn, e] of exact) addIds(e.ids, `${what}${name}:${range(e.lines)} ${fn}`);
        for (const [fn, ls] of uncovered) notes.push(`${what}${name}:${range(ls)} ${fn} - żaden zmierzony test tego nie wykonuje`);
        if (common.length) smoke.push(`${name}:${range(common)} (kod wykonywany w każdej grze)`);
        if (top.length) {   // (top level: the names it declares or stands in -> the functions that use them; a call -> its own lines)
            const names = new Set(), calls = [], skip = new Set(top);
            for (const j of top) { const ns = namesAt(nowLines, j); if (ns.size) for (const n of ns) names.add(n); else calls.push(j); }
            const r = byNames(rel, nowLines, names, skip);
            const shown = [...names].slice(0, 4).join(", ");
            if (r.ids.size) addIds(r.ids, `${what}${name}:${range(top)} najwyżej w pliku (${shown}) - test wykonuje funkcję, która tego używa`);
            if (r.common) smoke.push(`${name}:${range(top)} (${shown} - używane w każdej grze)`);
            if (names.size && !r.found) { smoke.push(`${name}:${range(top)} (${shown})`); notes.push(`${what}${name}:${range(top)} ${shown} - żadna funkcja tego nie używa (smoke)`); }
            if (calls.length) {
                const lines2 = [...new Set(calls.flatMap(j => statementLines(nowLines, j)))];
                const r2 = idsAt(rel, nowLines, lines2);
                if (r2.ids.size) addIds(r2.ids, `${what}${name}:${range(calls)} wywołanie najwyżej w pliku - test wykonuje jego funkcje`);
                smoke.push(`${name}:${range(calls)} (wywołanie najwyżej w pliku)`);
            }
        }
        if (lost) { addIds(usersOf(rel), `${what}${name}: brak tekstu zmierzonej wersji - test używa ${name}`); notes.push(`${name}: zmierzona wersja nie ma tekstu w .git (git gc?) - wzięte testy używające wtyczki; odśwież mapę`); }
        return true;
    }

    for (const c of changes.filter(c => /^js\/plugins\/[^/]+\.js$/.test(c.path))) {
        const rel = c.path, name = short(rel);
        if (!map.wtyczki[rel]) {   // (not measured: a new plugin - the tests that name it)
            const base = path.basename(rel, ".js"), re = new RegExp("\\b" + base.replace(/[^\w]/g, "") + "\\b");
            const named = allTestFiles().filter(t => { try { return re.test(fs.readFileSync(path.join(TESTS, t + ".js"), "utf8")); } catch (e) { return false; } });
            for (const t of named) add(t, `${name}: wtyczka bez pomiaru, test ją wymienia`);
            smoke.push(`${name} (bez pomiaru)`);
            notes.push(`${name}: nie ma jej w mapie (nowa?) - testy, które ją wymieniają (${named.length}) + smoke; po dodaniu testu: --odswiez-mape <test>`);
            continue;
        }
        if (c.now === null) { addIds(usersOf(rel), `${name} usunięta`); smoke.push(`${name} usunięta`); continue; }
        const nowLines = nowOf(rel, c.now);
        linesToTests(rel, nowLines, codeChanges(splitLines(c.base), nowLines), "");
    }

    // the words of the threads (js/teksty/<name>.txt, Watki.js): the keys that changed -> in the plugins that read the file, a
    // Watki.scal(OBJECT, "<name>", "prefix") whose prefix holds the key (the object, as a table: the functions using it) and the
    // lines naming the key (or a part of it) in a string -> their tests; nothing found - the tests using those plugins
    for (const c of changes.filter(c => /^js\/teksty\/[^/]+\.txt$/.test(c.path))) {
        const tname = path.basename(c.path, ".txt"), q = `["'\`]`;
        const keys = c.now === undefined || c.base === undefined ? null : changedTextKeys(c.base, c.now);
        if (keys && !keys.length) continue;   // (comments, blank lines)
        const shownKeys = keys ? keys.slice(0, 3).join(", ") + (keys.length > 3 ? " …" : "") : "cały plik";
        const tie = new RegExp(`(Watki\\.\\w+\\([^)]*${q}${tname}${q}|teksty:\\s*${q}${tname}${q})`);
        const tied = pluginFiles().filter(rel => tie.test(nowOf(rel).join("\n")));
        for (const t of allTestFiles()) { try { if (new RegExp(`teksty/${tname}\\b|${q}${tname}\\.txt`).test(fs.readFileSync(path.join(TESTS, t + ".js"), "utf8"))) add(t, `${c.path}: test czyta ten plik`); } catch (e) {} }
        if (!tied.length) { notes.push(`${c.path}: żadna wtyczka nie czyta tego pliku (Watki.teksty / scal)`); continue; }
        const holds = prefix => !keys || !prefix || keys.some(k => k === prefix || k.startsWith(prefix + "."));
        const esc = s => s.replace(/[.$[\]()]/g, "\\$&");
        // (the key or a part of it in a string: "zadania.K52", "stan:clues.przeor", "clues." + id)
        const parts = new Set(), firsts = new Set();
        for (const k of keys || []) { const seg = k.split("."); firsts.add(seg[0]); for (let n = 1; n <= seg.length; n++) parts.add(seg.slice(0, n).join(".")); }
        const partRe = parts.size ? new RegExp(`${q}(?:[\\w]+:)?(${[...parts].map(esc).join("|")})(${q}|\\.)`) : null;
        let foundAny = false;
        // (a plugin merging the whole file into an object - Watki.scal(T, "name", "") - and handing it on: its first key segments read as
        // properties anywhere in the plugins reading the file, D.TEXT.found[kind])
        const whole = tied.some(rel => new RegExp(`Watki\\.scal\\(\\s*[A-Za-z_$][\\w$.]*\\s*,\\s*${q}${tname}${q}\\s*(,\\s*${q}${q})?\\s*\\)`).test(nowOf(rel).join("\n")));
        const propRe = whole && firsts.size ? new RegExp(`\\.(${[...firsts].map(esc).join("|")})\\b(?!\\s*[:(])`) : null;
        for (const rel of tied) {
            const L = nowOf(rel), names = new Set(), scalLines = new Set(), direct = [], vars = new Set();
            const scalRe = new RegExp(`Watki\\.scal\\(\\s*([A-Za-z_$][\\w$]*)[\\w$.]*\\s*,\\s*${q}${tname}${q}\\s*(?:,\\s*${q}([^"'\`]*)${q})?`);
            // (the words object itself: X = Watki.teksty("name"), X = w.tx of its thread, a scal of the whole file)
            const varRe = new RegExp(`([A-Za-z_$][\\w$]*)\\s*=\\s*(?:Watki\\.teksty\\(\\s*${q}${tname}${q}|[A-Za-z_$][\\w$]*\\.tx\\b)`);
            L.forEach(line => { const m = varRe.exec(line), s = scalRe.exec(line); if (m) vars.add(m[1]); if (s && !s[2]) vars.add(s[1]); });
            const memberRe = vars.size && firsts.size ? new RegExp(`\\b(${[...vars].map(esc).join("|")})(\\.(${[...firsts].map(esc).join("|")})\\b|\\[)`) : null;
            L.forEach((line, j) => {
                if (trivial(line)) return;
                const m = scalRe.exec(line);
                if (m) { scalLines.add(j); if (m[2] && holds(m[2])) names.add(m[1]); return; }
                if ((partRe && partRe.test(line)) || (memberRe && memberRe.test(line)) || (propRe && propRe.test(line))) direct.push(j);
            });
            if (!map.wtyczki[rel]) continue;
            if (names.size) {
                const r = byNames(rel, L, names, scalLines);
                if (r.ids.size) { addIds(r.ids, `${c.path} (${shownKeys}) -> ${short(rel)}: ${[...names].slice(0, 3).join(", ")}`); foundAny = true; }
                if (r.common) { smoke.push(`${c.path} (${[...names].slice(0, 2).join(", ")} używane w każdej grze)`); foundAny = true; }
            }
            if (direct.length) { linesToTests(rel, L, direct, `${c.path} (${shownKeys}) w `); foundAny = true; }
        }
        if (!foundAny) {   // (no code found reading these keys: every test that uses a plugin reading the file)
            for (const rel of tied) if (map.wtyczki[rel]) addIds(usersOf(rel), `${c.path}: czyta go ${short(rel)} - test używa wtyczki`);
            notes.push(`${c.path} (${shownKeys}): nie znalazłem kodu, który czyta te klucze (${tied.map(short).join(", ")}) - wzięte testy używające tych wtyczek`);
        }
    }

    // the plugin lists: the entries that changed (or moved) -> the tests that use those plugins
    for (const c of changes.filter(c => c.path === "js/tawerna_wtyczki.js" || c.path === "js/plugins.js")) {
        const entries = t => { try { const s = String(t || ""); return JSON.parse(s.slice(s.indexOf("["), s.lastIndexOf("]") + 1)); } catch (e) { return []; } };
        const a = entries(c.base), b = entries(c.now), key = e => JSON.stringify(e), names = new Set();
        const ia = new Map(a.map((e, i) => [e.name, key(e)])), ib = new Map(b.map((e, i) => [e.name, key(e)]));
        for (const [n, k] of ib) if (ia.get(n) !== k) names.add(n);
        for (const n of ia.keys()) if (!ib.has(n)) names.add(n);
        const order = l => l.map(e => e.name).filter(n => ia.has(n) && ib.has(n)), oa = order(a), ob = order(b);
        for (const h of diffLines(oa, ob)) { for (let i = h.a0; i < h.a1; i++) names.add(oa[i]); for (let j = h.b0; j < h.b1; j++) names.add(ob[j]); }
        for (const n of names) {
            const rel = "js/plugins/" + String(n).split("/").pop() + ".js";
            if (map.wtyczki[rel]) addIds(usersOf(rel), `${c.path}: wpis ${n}`);
            else if (!changes.some(x => x.path === rel)) notes.push(`${c.path}: wpis ${n} - wtyczki nie ma w mapie`);
        }
        if (names.size || c.now === null) { add("ladowacz_test", `${c.path} zmieniony`); smoke.push(c.path); }
    }

    const hasMaps = map.mapy && Object.keys(map.mapy).length > 0;
    for (const c of changes) {
        const p = c.path;
        if (/^js\/plugins\/[^/]+\.js$/.test(p) || p === "js/tawerna_wtyczki.js" || p === "js/plugins.js") continue;
        if (p === "index.html" || /^js\/[^/]+\.js$/.test(p) || /^js\/libs\//.test(p)) { add("ladowacz_test", `${p}: silnik / strona`); smoke.push(p); continue; }
        const mm = /^data\/Map(\d+)\.json$/.exec(p);
        if (mm && hasMaps) {   // (a map: the tests that went onto it; one every plugin reads ahead - also the tests that name it)
            const id = Number(mm[1]), entered = map.mapy[p] ? bitsIds(map.mapy[p]) : [], asked = map.pliki[p] ? bitsIds(map.pliki[p]).length : 0;
            addIds(entered, `${p}: test wchodzi na tę mapę`);
            if (asked >= COMMON * allIds.length || !entered.length) {
                const re = new RegExp(`(go\\(\\s*|reserveTransfer\\(\\s*|mapId\\(\\)\\s*===?\\s*|\\bmap:\\s*|Map0*)${id}\\b`);
                for (const t of allTestFiles()) { try { if (re.test(fs.readFileSync(path.join(TESTS, t + ".js"), "utf8"))) add(t, `${p}: test wymienia mapę ${id}`); } catch (e) {} }
                if (asked >= COMMON * allIds.length) smoke.push(`${p} (czytana z góry przez wtyczki)`);
                if (!entered.length && !asked) notes.push(`${p}: żaden zmierzony test nie wchodzi na tę mapę`);
            }
            continue;
        }
        if (/^(data|img|audio|fonts|effects|movies|css)\//.test(p)) {
            const ids = map.pliki[p] ? bitsIds(map.pliki[p]) : [];
            if (ids.length && ids.length >= COMMON * allIds.length) {   // (every test loads it: System, Items, MapInfos, the icon set...)
                smoke.push(p);
                if (/^data\/(Items|Weapons|Armors)\.json$/.test(p) && c.now !== undefined) for (const [t, why] of byIdNumbers(p, c)) add(t, why);
                continue;
            }
            if (ids.length) { addIds(ids, `${p}: test go ładuje`); continue; }
            // (no test asked for it: a new picture - the lines of the plugins that name it, the maps that name it)
            const refs = referencesOf(p);
            for (const { rel, lines } of refs.plugins) if (map.wtyczki[rel]) linesToTests(rel, nowOf(rel), lines, `${p} (nowy) w `);
            for (const d of refs.data) {
                const ids2 = hasMaps && map.mapy[d] ? bitsIds(map.mapy[d]) : map.pliki[d] ? bitsIds(map.pliki[d]) : [];
                if (ids2.length < COMMON * allIds.length) addIds(ids2, `${p}: nowy plik, wymienia go ${d}`);
            }
            if (!refs.plugins.length && !refs.data.length) { if (/\.(png|json|ogg)$/.test(p)) notes.push(`${p}: żaden test go nie ładuje i nic go nie wymienia`); }
            continue;
        }
        if (/^tests\/smoke\/[^/]+\.js$/.test(p) || /^tests\/[^/]+_test\.js$/.test(p)) {
            const n = p.replace(/^tests\//, "").replace(/\.js$/, "");
            if (c.now !== null && fs.existsSync(path.join(ROOT, p))) add(n, "sam test zmieniony");
            continue;
        }
        if (/^tests\/fixtures\/[^/]+\.json$/.test(p)) {
            const fx = path.basename(p, ".json"), re = new RegExp("[\"'`]" + fx + "[\"'`]");
            for (const t of allTestFiles()) { try { if (re.test(fs.readFileSync(path.join(TESTS, t + ".js"), "utf8"))) add(t, `zapis ${fx}`); } catch (e) {} }
            add("smoke/fixtures", `zapis ${fx}`);
            continue;
        }
        if (/^tests\/(lib\/[^/]+\.js|cdp\.js|run\.js)$/.test(p)) { smoke.push(p); continue; }
    }
    return { tests, smoke, notes };
}
const readNow = rel => { try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch (e) { return ""; } };
const pluginFiles = () => { try { return fs.readdirSync(path.join(ROOT, "js", "plugins")).filter(f => /\.js$/.test(f)).map(f => "js/plugins/" + f); } catch (e) { return []; } };
// a words file's lines (Watki.js's format, docs/WATKI_DANE.md): each line -> its key ("a.b = ..." or the [block] it is in), else null
function textKeysByLine(lines) {
    const out = new Array(lines.length).fill(null);
    let block = null;
    lines.forEach((raw, i) => {
        const t = raw.trim();
        if (block !== null) { if (!t) block = null; else if (t[0] !== "#") out[i] = block; return; }
        if (!t || t[0] === "#") return;
        let m = /^\[([^\]]*)\]/.exec(t);
        if (m) { block = m[1].trim(); out[i] = block; return; }
        m = /^([^\s=]+)\s*=/.exec(t);
        if (m) out[i] = m[1];
    });
    return out;
}
// the keys whose words changed between two texts of a words file
function changedTextKeys(base, now) {
    const a = splitLines(base), b = splitLines(now), ka = textKeysByLine(a), kb = textKeysByLine(b), keys = new Set();
    for (const h of diffLines(a, b)) {
        for (let j = h.b0; j < h.b1; j++) if (kb[j]) keys.add(kb[j]);
        for (let i = h.a0; i < h.a1; i++) if (ka[i]) keys.add(ka[i]);
    }
    return [...keys];
}
// the tests that use a plugin: they ran one of its functions that fewer than USERS of the tests run (the boot, the map's frame,
// the menus every test opens are not "using" it); versions measured with few tests judge by the biggest version (the function found
// there through the lines as they are now)
const USERS = 0.3;
function pluginUsers(Vs, nowLines) {
    const users = new Set();
    const big = Vs.filter(V => V.lines).sort((p, q) => q.measured.length - p.measured.length)[0];
    const rare = (V, i) => V.fns[i].ids.length < USERS * Math.max(1, V.measured.length);
    for (const V of Vs) {
        const own = V.measured.length >= 10 || !big || V === big;
        let fwd = null;
        if (!own && V.lines && big.lines) {   // (this version's line -> the line now -> the big version's innermost function)
            const back = backTo(V, nowLines), bigBack = backTo(big, nowLines);
            fwd = new Int32Array(V.n).fill(-1);
            for (let j = nowLines.length - 1; j >= 0; j--) if (back.lo[j] === back.hi[j]) fwd[back.lo[j]] = j;
            V.fns.forEach((f, i) => {
                if (!f.ids.length) return;
                const j = f.l0 >= 0 && f.l0 < V.n ? fwd[f.l0] : -1;
                const k = j >= 0 && bigBack.lo[j] === bigBack.hi[j] ? big.inner[bigBack.lo[j]] : -1;
                if (k >= 0 ? rare(big, k) && !big.wrapper(k) : rare(V, i) && !V.wrapper(i)) for (const id of f.ids) users.add(id);
            });
            continue;
        }
        V.fns.forEach((f, i) => { if (f.ids.length && rare(V, i) && !V.wrapper(i)) for (const id of f.ids) users.add(id); });
    }
    return users;
}
// the same by name (run.js affected)
function users(map, rel) {
    const byId = new Map(Object.entries(map.testy).map(([n, t]) => [t.id, n]));
    const vers = map.wtyczki[rel] || {}, texts = readBlobs(Object.keys(vers));
    const Vs = Object.keys(vers).map(v => makeVersion(rel, v, vers[v], texts.get(v)));
    const u = pluginUsers(Vs, splitLines(readNow(rel)));
    for (const t of Object.values(map.testy)) if (t.niepewne && t.niepewne.includes(rel)) u.add(t.id);
    return [...u].map(id => byId.get(id)).filter(Boolean);
}
function allTestFiles() {
    const out = fs.readdirSync(TESTS).filter(f => /_test\.js$/.test(f)).map(f => f.replace(/\.js$/, ""));
    const sm = path.join(TESTS, "smoke");
    if (fs.existsSync(sm)) for (const f of fs.readdirSync(sm)) if (/\.js$/.test(f)) out.push("smoke/" + f.replace(/\.js$/, ""));
    return out;
}
// Items / Weapons / Armors (every test loads them): the entries that changed -> the tests that give or count that thing
function byIdNumbers(p, c) {
    const out = [], kind = /Items/.test(p) ? "Items" : /Weapons/.test(p) ? "Weapons" : "Armors";
    let a = [], b = [];
    try { a = JSON.parse(c.base || "[]"); } catch (e) {}
    try { b = JSON.parse(c.now || "[]"); } catch (e) {}
    const ids = [];
    for (let i = 1; i < Math.max(a.length, b.length); i++) if (JSON.stringify(a[i] || null) !== JSON.stringify(b[i] || null)) ids.push(i);
    if (!ids.length || ids.length > 200) return out;
    const re = new RegExp(kind === "Items" ? `(\\$dataItems\\[|\\b(give|count)\\(\\s*)(${ids.join("|")})\\b` : `\\$data${kind}\\[(${ids.join("|")})\\]`);
    for (const t of allTestFiles()) { try { if (re.test(fs.readFileSync(path.join(TESTS, t + ".js"), "utf8"))) out.push([t, `${p}: zmieniony wpis ${ids.slice(0, 5).join(", ")}, test go używa`]); } catch (e) {} }
    return out;
}
// a new file's name in the plugins (the lines, 0-based) and in the data (a picture by its name without the extension)
let refTexts = null;
function referencesOf(p) {
    const base = path.basename(p).replace(/\.[^.]+$/, ""), out = { plugins: [], data: [] };
    if (base.length < 3) return out;
    if (!refTexts) {
        refTexts = { plugins: [], data: [] };
        const dir = path.join(ROOT, "js", "plugins");
        for (const f of fs.readdirSync(dir)) if (/\.js$/.test(f)) { try { refTexts.plugins.push(["js/plugins/" + f, fs.readFileSync(path.join(dir, f), "utf8")]); } catch (e) {} }
        const dd = path.join(ROOT, "data");
        for (const f of fs.readdirSync(dd)) if (/\.json$/.test(f)) { try { refTexts.data.push(["data/" + f, fs.readFileSync(path.join(dd, f), "utf8")]); } catch (e) {} }
    }
    const json = JSON.stringify(base).slice(1, -1);
    for (const [rel, text] of refTexts.plugins) {
        if (!text.includes(base)) continue;
        const lines = [];
        splitLines(text).forEach((L, j) => { if (L.includes(base) && !trivial(L)) lines.push(j); });
        if (lines.length) out.plugins.push({ rel, lines });
    }
    for (const [rel, text] of refTexts.data) if (text.includes(json)) out.data.push(rel);
    return out;
}

module.exports = { FILE, COMMON, load, save, merge, forget, staleTests, select, users, mark, markChanges, needsText, gitChanges, readBlobs, storeBlobs, pluginHashes, changedTextKeys,
    diffLines, mapBack, changedLines, codeChanges, namesAt, splitLines, bitsIds, bitsPut, serialize, allTestFiles };
