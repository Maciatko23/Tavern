// Teksty gry w plikach js/teksty/*.txt (docs/WATKI_DANE.md, rozdz. 3) - narzędzie do sprawdzania, porównania i wyciągania.
//
//   node tools/teksty.js sprawdz [nazwa...]            każdy plik (albo te): błędy zapisu, klucze, których kod nie używa, klucze,
//                                                       których kod szuka, a pliku nie ma, za długie słowa / linie, cudzysłowy „”
//   node tools/teksty.js porownaj <nazwa> <stary.js> [--obiekt TX] [--pod klucz] [--bez klucz,klucz]
//                                                       plik tekstów kontra obiekt z dawnej wtyczki (np. kopia sprzed przeniesienia):
//                                                       każdy tekst znak w znak; przeniesione klucze (ta sama wartość pod innym kluczem)
//   node tools/teksty.js wyciagnij <stary.js> [--obiekt TX] [--pod klucz]   obiekt z wtyczki jako plik tekstów (na ekran)
//   node tools/teksty.js migawka <stary.js> [--obiekt TX] [--obiekt NAZWA=klucz]   stare teksty jako JSON (tests/fixtures/teksty/
//                                                       <nazwa>_przed.json) - do `porownaj` po zmianie wtyczki
//   node tools/teksty.js lista                          pliki tekstów, ile kluczy, kto je czyta
// (--obiekt można dać kilka razy: NAZWA - w korzeniu, NAZWA=klucz - pod tym kluczem; porownaj / wyciagnij / migawka tak samo)
//
// Kod wyjścia 0 = bez błędów (ostrzeżenia nie psują). Parser jest ten sam co w grze (js/plugins/Watki.js - parse).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "js", "teksty");
const PLUGINS = path.join(ROOT, "js", "plugins");
const LINE = 46, PAGE = 3;

// ------------------------------------------------------------------ the game's parser (from Watki.js, run in a sandbox)
function gameParser() {
    const src = fs.readFileSync(path.join(PLUGINS, "Watki.js"), "utf8");
    const box = { window: {}, console };
    box.window = box;
    const stub = { time: { day: () => 1, hour: () => 0 }, state: Object.assign(() => ({}), { define: () => () => ({}) }), on() {}, onMapUpdate() {}, emit() {}, api: () => null,
        register: (n, a) => a, call() {}, popup() {} };
    box.Tawerna = stub;
    vm.createContext(box);
    vm.runInContext(src, box, { filename: "Watki.js" });
    return box.Watki.parse;
}
const parse = gameParser();

// ------------------------------------------------------------------ an object literal from a plugin's source
function findLiteral(src, name) {
    const re = new RegExp("(?:const|let|var)\\s+" + name + "\\s*=\\s*\\{|\\b" + name + "\\s*:\\s*\\{", "g");
    const m = re.exec(src);
    if (!m) return null;
    let i = m.index + m[0].length - 1, depth = 0;
    const start = i;
    for (; i < src.length; i++) {
        const c = src[i];
        if (c === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); if (i < 0) break; continue; }
        if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i + 2) + 1; continue; }
        if (c === '"' || c === "'" || c === "`") {
            for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++;
            continue;
        }
        if (c === "{") depth++;
        else if (c === "}") { depth--; if (!depth) return src.slice(start, i + 1); }
    }
    return null;
}
function evalLiteral(lit) {
    // unknown names (constants of the plugin) come out as ‹name›, so a text built from them shows it
    const proxy = new Proxy({}, { has: () => true, get: (t, k) => (k === Symbol.unscopables ? undefined : k in globalThis ? globalThis[k] : "‹" + String(k) + "›") });
    const box = { __p: proxy };
    vm.createContext(box);
    return vm.runInContext("with (__p) { (" + lit + ") }", box);
}
function oldObject(file, name, sub) {
    const src = fs.readFileSync(file, "utf8");
    if (/\.json$/i.test(file)) { let o = JSON.parse(src); if (sub) for (const k of sub.split(".")) o = o ? o[k] : undefined; return o; }   // (a snapshot)
    const lit = findLiteral(src, name || "TX");
    if (!lit) throw new Error("nie ma obiektu " + (name || "TX") + " w " + file);
    let obj = evalLiteral(lit);
    if (sub) for (const k of sub.split(".")) obj = obj ? obj[k] : undefined;
    return obj;
}

// ------------------------------------------------------------------ flat: key -> value (a string or an array of strings)
function flat(obj, pre, out, skipped) {
    out = out || {};
    skipped = skipped || [];
    for (const [k, v] of Object.entries(obj || {})) {
        const key = pre ? pre + "." + k : k;
        if (typeof v === "string") out[key] = v;
        else if (Array.isArray(v) && v.every(x => typeof x === "string")) out[key] = v;
        else if (v && typeof v === "object" && !Array.isArray(v)) flat(v, key, out, skipped);
        else if (Array.isArray(v) && v.length && v.every(x => x && typeof x === "object" && !Array.isArray(x))) flat(Object.assign({}, v), key, out, skipped);   // (a table of objects: key.0.name)
        else skipped.push({ key, what: typeof v === "function" ? "funkcja" : Array.isArray(v) ? "lista nie samych tekstów" : typeof v });
    }
    return out;
}
const show = v => (Array.isArray(v) ? "[" + v.length + "] " + JSON.stringify(v).slice(0, 140) : JSON.stringify(v).slice(0, 140));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function firstDiff(a, b) {
    const s = JSON.stringify(a), t = JSON.stringify(b);
    let i = 0;
    while (i < s.length && s[i] === t[i]) i++;
    return "znak " + i + ": …" + s.slice(Math.max(0, i - 20), i + 20) + "… ≠ …" + t.slice(Math.max(0, i - 20), i + 20) + "…";
}

// ------------------------------------------------------------------ writing a file of texts
const SEG = /^[\w\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/;
function quoteLine(s, inBlock) {
    const t = String(s).replace(/\n(?!\[)/g, "\\n");
    const need = t !== t.trim() || (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') || (inBlock && (t === "" || t[0] === "#"));
    return need ? '"' + t + '"' : t;
}
function toText(obj, title) {
    const out = [], skipped = [], bad = [];
    const f = flat(obj, "", {}, skipped);
    if (title) out.push("# " + title, "");
    for (const [k, v] of Object.entries(f)) {
        if (!k.split(".").every(x => SEG.test(x))) { bad.push(k); continue; }
        if (Array.isArray(v)) { out.push("[" + k + "]"); for (const l of v) out.push(quoteLine(l, true)); out.push(""); }
        else out.push((k + " = " + quoteLine(v, false)).replace(/ $/, ""));
    }
    for (const s of skipped) out.push("# (zostaje w kodzie: " + s.key + " - " + s.what + ")");
    for (const k of bad) out.push("# (klucz nie do zapisania: " + JSON.stringify(k) + ")");
    return out.join("\n") + "\n";
}

// ------------------------------------------------------------------ who reads a file of texts: the plugins naming it
function readersOf(name) {
    const out = [];
    for (const f of fs.readdirSync(PLUGINS)) {
        if (!f.endsWith(".js") || f === "Watki.js") continue;   // (the engine names them all in its comments)
        const src = fs.readFileSync(path.join(PLUGINS, f), "utf8");
        if (new RegExp("teksty\\(\\s*[\"']" + name + "[\"']\\s*[,)]|teksty\\s*:\\s*[\"']" + name + "[\"']|\\.get\\(\\s*[\"']" + name + "[\"']\\s*\\)|zTekstu\\([^)]*[\"']" + name + "[\"']\\s*\\)|scal\\(\\s*[\\w.$]+\\s*,\\s*[\"']" + name + "[\"']").test(src)) out.push(f);
    }
    // the data plugin's engine (X_Data.js -> X.js: it reads D.TX) and whoever reads the data's TX (Debug.js: RywalData.TX.f9Names)
    for (const f of out.slice()) { const e = f.replace(/_Data\.js$/, ".js"); if (e !== f && fs.existsSync(path.join(PLUGINS, e)) && !out.includes(e)) out.push(e); }
    const exp = out.filter(f => /_Data\.js$/.test(f)).map(f => f.replace(/_Data\.js$/, "Data"));
    if (exp.length) for (const f of fs.readdirSync(PLUGINS)) {
        if (!f.endsWith(".js") || out.includes(f)) continue;
        const src = fs.readFileSync(path.join(PLUGINS, f), "utf8");
        if (exp.some(x => new RegExp("\\b" + x + "\\.TX\\b").test(src))) out.push(f);
    }
    return out;
}
// the keys a plugin's source asks for: TX.a.b (TX[...] / TX.a[...]: everything under it), and quoted keys of the engine's data
function usedKeys(srcs, defined) {
    const used = new Set(), prefixes = new Set(), asked = new Set();
    for (const src of srcs) {
        for (const m of src.matchAll(/(?<!\b(?!D\.)\w+\.)\b(?:TX|TEXT|TK)((?:\.\w+)+)(\[|\s*\()?/g)) {   // (G.TX.x: another plugin's; D.TX: its own data's)   // (TEXT: Act3_Data's name of it; TK: tools/teksty.js kody)
            const p = m[1].slice(1);
            if (m[2] && m[2].trim() === "(") continue;   // (TX.post(lv): a function of the code, not a text)
            if (/\.(length|slice|concat|map|join|indexOf|includes|filter)$/.test(m[1])) { prefixes.add(m[1].slice(1).replace(/\.\w+$/, "")); continue; }   // (TX.list.length: the list itself)
            if (m[2]) prefixes.add(p); else { used.add(p); asked.add(p); }
        }
        for (const m of src.matchAll(/\b(?:TX|TEXT)\[/g)) prefixes.add("");
        for (const m of src.matchAll(/["']([\w-]+(?:\.[\w-]+)*)\.["']\s*\+/g)) prefixes.add(m[1]);   // ("tops." + how)
        if (/\bkroki\s*:\s*\[/.test(src)) prefixes.add("kroki");                                       // (the engine: kroki.<nazwa>)
        if (/\bf9\s*:\s*\{/.test(src)) prefixes.add("f9");                                             // (the engine: f9.naglowek...)
        if (/\bzadania\s*:\s*\{/.test(src)) prefixes.add("zadania");                                   // (the engine: zadania.<id> scalone w zadania wątku)
        for (const m of src.matchAll(/["']([\w-]+(?:\.[\w{}-]+)*)["']/g)) {
            const k = m[1];
            if (/\{\w+\}/.test(k)) { prefixes.add(k.split(/\.?\{/)[0]); continue; }
            used.add(k);
        }
        // the engine's text positions in the data (mow / losowo / etykieta / notatka ... and the bare strings of talks)
        if (/\b(?:Watki|W)\.watek\(/.test(src)) for (const m of src.matchAll(/\b(mow|losowo|etykieta|notatka|ogloszenie|info|mysl|tekst|naglowek|opis|brak|tytul)\s*:\s*["']([\w.-]+)["'](?!\s*\+)/g)) asked.add(m[2]);
    }
    const isUsed = k => used.has(k) || [...prefixes].some(p => p === "" || k === p || k.startsWith(p + ".")) || [...used].some(u => k.startsWith(u + "."));
    // (TX.cairnHit given as a function of the code - `cairnHit: (n, m) =>` - is no key of the file)
    const fnDefined = k => srcs.some(s => new RegExp("\\b" + k.split(".").pop() + "\\s*:\\s*(\\([^)]*\\)\\s*=>|\\w+\\s*=>|function\\b)").test(s));
    const missing = [...asked].filter(k => !defined.some(d => d === k || d.startsWith(k + ".")) && !fnDefined(k));
    return { isUsed, missing };
}

// ------------------------------------------------------------------ the checks of one file
function check(name) {
    const file = path.join(DIR, name + ".txt"), rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const res = { name, errors: [], warns: [], keys: 0 };
    if (!fs.existsSync(file)) { res.errors.push(rel + ": nie ma pliku"); return res; }
    const raw = fs.readFileSync(file, "utf8");
    const got = parse(raw, name);
    res.keys = got.keys.length;
    for (const e of got.errors) res.errors.push(rel + ", " + e);
    const lines = raw.replace(/^﻿/, "").split(/\r?\n/);
    const lineOf = k => { const x = got.keys.find(y => y.key === k); return x ? x.line : 0; };
    const fl = flat(got.tree);
    for (const [k, v] of Object.entries(fl)) {
        for (const s of [].concat(v)) {
            const text = String(s);
            for (const w of text.replace(/\\SPK\[\d+\]/g, "").split(/\s+/)) if (w.length > LINE) res.errors.push(rel + ":" + lineOf(k) + " " + k + ": słowo dłuższe niż linia okna (" + w.length + " > " + LINE + "): " + w.slice(0, 30) + "…");
            const open = (text.match(/„/g) || []).length, close = (text.match(/”/g) || []).length;
            if (open !== close) res.warns.push(rel + ":" + lineOf(k) + " " + k + ": cudzysłowy „” nie do pary (" + open + " / " + close + ")");
            if (/"/.test(text)) res.warns.push(rel + ":" + lineOf(k) + " " + k + ": cudzysłów prosty \" w tekście (po polsku: „...”)");
            const po = (text.match(/\(/g) || []).length, pc = (text.match(/\)/g) || []).length;
            if (po !== pc) res.warns.push(rel + ":" + lineOf(k) + " " + k + ": nawiasy ( ) nie do pary");
        }
    }
    // the code: keys nobody reads, keys asked for and missing
    const readers = readersOf(name);
    if (!readers.length) res.warns.push(rel + ": żadna wtyczka nie czyta tego pliku (Watki.teksty(\"" + name + "\") / teksty: \"" + name + "\")");
    else {
        const srcs = readers.map(f => fs.readFileSync(path.join(PLUGINS, f), "utf8"));
        const keys = Object.keys(fl);
        const u = usedKeys(srcs, keys);
        for (const k of keys) if (!u.isUsed(k)) res.warns.push(rel + ":" + lineOf(k) + " " + k + ": klucz, którego kod nie czyta (" + readers.join(", ") + ")");
        for (const k of u.missing) res.errors.push(rel + ": kod szuka klucza „" + k + "”, a w pliku go nie ma (" + readers.join(", ") + ")");
    }
    if (lines.length && /[ \t]+$/.test(lines.find(l => /[ \t]+$/.test(l)) || "")) res.warns.push(rel + ": spacje na końcu linii (gra je pomija - spacja na końcu tekstu tylko w cudzysłowie \"...\")");
    return res;
}
function wrapCount(text) {
    let n = 0, line = "";
    for (const w of String(text).split(/\s+/)) { if (!w) continue; if (line && (line + " " + w).length > LINE) { n++; line = w; } else line = line ? line + " " + w : w; }
    return n + (line ? 1 : 0);
}

// ------------------------------------------------------------------ the commands
function arg(name, dflt) { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : dflt; }
const args = name => process.argv.map((a, i) => (a === "--" + name ? process.argv[i + 1] : null)).filter(Boolean);
// the old texts of a plugin: --obiekt NAME (at the root) or NAME=klucz (under that key), as many as needed; --pod: one level of it
function oldTexts(file) {
    const specs = args("obiekt").length ? args("obiekt") : ["TX"], out = {};
    for (const sp of specs) {
        const [name, at] = sp.split("=");
        const o = oldObject(path.resolve(file), name, specs.length === 1 ? arg("pod", "") : "");
        if (at) { let t = out; const p = at.split("."); for (const k of p.slice(0, -1)) t = t[k] || (t[k] = {}); t[p[p.length - 1]] = o; }
        else Object.assign(out, o);
    }
    // --klucze <wyrażenie>: only the keys that match (texts out of a data table: "^(?!partie\.)|\.(name|kto)$")
    const only = arg("klucze", "");
    if (!only) return out;
    const re = new RegExp(only), keep = {}, skipped = [];
    for (const [k, v] of Object.entries(flat(out, "", {}, skipped))) {
        if (!re.test(k)) continue;
        let t = keep;
        const p = k.split(".");
        for (const x of p.slice(0, -1)) t = t[x] || (t[x] = {});
        t[p[p.length - 1]] = v;
    }
    return keep;
}
const cmd = process.argv[2] || "sprawdz";
const names = () => fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith(".txt")).map(f => f.slice(0, -4)) : [];
let bad = 0;
if (cmd === "sprawdz") {
    const list = process.argv.slice(3).filter(a => !a.startsWith("--"));
    for (const n of list.length ? list : names()) {
        const r = check(n);
        console.log((r.errors.length ? "BŁĄD " : "OK   ") + n + ".txt: " + r.keys + " kluczy, błędów " + r.errors.length + ", uwag " + r.warns.length);
        for (const e of r.errors) console.log("  błąd:  " + e);
        if (!process.argv.includes("--cicho")) for (const w of r.warns) console.log("  uwaga: " + w);
        bad += r.errors.length;
    }
} else if (cmd === "porownaj") {
    const name = process.argv[3], old = process.argv[4];
    if (!name || !old) { console.log("node tools/teksty.js porownaj <nazwa> <stary.js> [--obiekt TX] [--pod klucz] [--bez a,b]"); process.exit(2); }
    const got = parse(fs.readFileSync(path.join(DIR, name + ".txt"), "utf8"), name);
    for (const e of got.errors) { console.log("błąd zapisu: " + e); bad++; }
    const skip = (arg("bez", "") || "").split(",").filter(Boolean);
    const skipKey = k => skip.some(s => k === s || k.startsWith(s + "."));
    const skippedOld = [];
    const A = flat(oldTexts(old), "", {}, skippedOld), B = flat(got.tree);
    let okN = 0;
    const onlyA = [], onlyB = [];
    for (const [k, v] of Object.entries(A)) {
        if (skipKey(k)) continue;
        if (!(k in B)) { onlyA.push(k); continue; }
        if (same(v, B[k])) okN++;
        else { console.log("RÓŻNE   " + k + ": " + firstDiff(v, B[k])); bad++; }
    }
    for (const k of Object.keys(B)) if (!(k in A)) onlyB.push(k);
    const moved = [];
    for (const k of onlyA.slice()) {
        const j = onlyB.findIndex(b => same(A[k], B[b]));
        if (j >= 0) { moved.push(k + " → " + onlyB[j]); onlyB.splice(j, 1); onlyA.splice(onlyA.indexOf(k), 1); }
    }
    console.log("takie same (znak w znak): " + okN + ", przeniesione pod inny klucz: " + moved.length + ", tylko w starym: " + onlyA.length + ", tylko w nowym: " + onlyB.length);
    for (const m of moved) console.log("  przeniesione: " + m);
    for (const k of onlyA) { console.log("  BRAK w pliku: " + k + " = " + show(A[k])); bad++; }
    for (const k of onlyB) console.log("  nowe w pliku: " + k + " = " + show(B[k]));
    for (const s of skippedOld) console.log("  (w starym nie tekst, pominięte: " + s.key + " - " + s.what + ")");
} else if (cmd === "wyciagnij") {
    const old = process.argv[3];
    if (!old) { console.log("node tools/teksty.js wyciagnij <stary.js> [--obiekt TX] [--pod klucz]"); process.exit(2); }
    process.stdout.write(toText(oldTexts(old), "Teksty z " + path.basename(old) + " (" + (args("obiekt").join(", ") || "TX") + ")"));
} else if ((cmd === "migawka" && process.argv.includes("--kod")) || cmd === "wyjmij" || cmd === "napisy" || cmd === "zgodnosc" || cmd === "kody") {
    // (the code read by a JavaScript parser: tools/teksty_kod.js - acorn of Node, under --expose-internals)
    let kod = null;
    try { kod = require("./teksty_kod.js"); } catch (e) { kod = null; }
    if (!kod || !kod.acorn()) {
        if (process.execArgv.includes("--expose-internals")) { console.log("brak parsera acorn w tym Node"); process.exit(2); }
        const r = require("child_process").spawnSync(process.execPath, ["--expose-internals", __filename].concat(process.argv.slice(2)), { stdio: "inherit" });
        process.exit(r.status === null ? 1 : r.status);
    }
    if (cmd === "napisy") {   // (the texts still in a plugin's code: line, text)
        const file = process.argv[3];
        if (!file) { console.log("node tools/teksty.js napisy <wtyczka.js>"); process.exit(2); }
        const list = kod.literals(path.resolve(file));
        for (const l of list) console.log(String(l.line).padStart(5) + "  " + JSON.stringify(l.v).slice(0, 120));
        console.log("(" + list.length + " napisów w kodzie)");
        process.exit(0);
    }
    if (cmd === "kody") {   // (the texts of the code's functions -> kod.<funkcja>.<n> in the file; the old ones as a snapshot)
        const file = process.argv[3], name = arg("nazwa", "");
        if (!file || !name) { console.log("node tools/teksty.js kody <wtyczka.js> --nazwa <teksty> [--pod kod] [--bez /wyrażenie/] [--bez-funkcji f1,f2] [--tk TK] [--wykonaj]"); process.exit(2); }
        const pod = arg("pod", "kod"), r = kod.kluczuj(path.resolve(file), name, { bez: arg("bez", ""), tk: arg("tk", ""), pod, bezFunkcji: arg("bez-funkcji", "") });
        for (const l of r.left) console.log("  zostaje (" + l.why + ") " + String(l.line).padStart(5) + "  " + JSON.stringify(l.v).slice(0, 110));
        const dest = path.join(DIR, name + ".txt"), had = fs.existsSync(dest), base = path.basename(file), lines = [];
        if (had) {   // (a key already in the file: another --pod)
            const got = parse(fs.readFileSync(dest, "utf8"), name), have = new Set(got.keys.map(k => k.key));
            const clash = Object.keys(r.keys).filter(k => have.has(k) || [...have].some(h => h.startsWith(k + ".") || k.startsWith(h + ".")));
            if (clash.length) { console.log("klucze już są w js/teksty/" + name + ".txt: " + clash.slice(0, 5).join(", ") + " - podaj --pod <inny>"); process.exit(1); }
        }
        if (!had) lines.push("# Teksty z " + base, "#", "# Format: docs/WATKI_DANE.md, rozdz. 3. Po poprawkach: node tools/teksty.js sprawdz " + name, "");
        lines.push("", "# ======================================================================== z kodu " + base + " (" + pod + ".<funkcja>.<n>, w kolejności kodu)");
        for (const [own, list] of Object.entries(r.texts)) { lines.push("# " + own); list.forEach((v, i) => lines.push((pod + "." + own + "." + i + " = " + kod.textLines({ x: v }, "", [])[0].slice(4)).replace(/ $/, ""))); }
        const text = (had ? fs.readFileSync(dest, "utf8").replace(/\s*$/, "\n\n") : "") + lines.join("\n").replace(/^\n+/, "") + "\n";
        console.log((process.argv.includes("--wykonaj") ? "" : "(podgląd) ") + base + ": " + r.n + " napisów -> " + Object.keys(r.keys).length + " kluczy kod.* w js/teksty/" + name + ".txt, zostaje " + r.left.length);
        if (process.argv.includes("--wykonaj")) {
            const snap = {}; for (const [k, v] of Object.entries(r.keys)) { let t = snap; const p = k.split("."); for (const x of p.slice(0, -1)) t = t[x] || (t[x] = {}); t[p[p.length - 1]] = v; }
            snap._opis = "Napisy kodu " + base + " sprzed przeniesienia do js/teksty/" + name + ".txt (" + pod + ".*)";
            const snapF = path.join(ROOT, "tests", "fixtures", "teksty", name + "_kod_" + base.replace(/\.js$/, "") + "_przed.json");
            fs.writeFileSync(snapF, JSON.stringify(snap, null, 1) + "\n");
            fs.writeFileSync(dest, text.replace(/\r\n/g, "\n"));
            fs.writeFileSync(path.resolve(file), r.code);
            console.log("zapisano " + path.relative(ROOT, dest) + ", " + path.relative(ROOT, path.resolve(file)) + " i migawkę " + path.relative(ROOT, snapF));
        } else process.stdout.write(lines.slice(0, 40).join("\n") + "\n");
        process.exit(0);
    }
    if (cmd === "zgodnosc") {   // (every text of the old plugin is still there: in the new code, or in the files of texts)
        const [oldF, newF, list] = process.argv.slice(3);
        if (!oldF || !newF || !list) { console.log("node tools/teksty.js zgodnosc <stara.js> <nowa.js> <teksty[,teksty2]>"); process.exit(2); }
        const vals = [];
        for (const n of list.split(",")) { const f = flat(parse(fs.readFileSync(path.join(DIR, n + ".txt"), "utf8"), n).tree); for (const v of Object.values(f)) vals.push(...[].concat(v)); }
        const miss = kod.zgodnosc(path.resolve(oldF), path.resolve(newF), vals);
        for (const m of miss) console.log("NIE MA: " + path.basename(oldF) + ":" + m.line + " " + JSON.stringify(m.v).slice(0, 120));
        console.log(path.basename(newF) + ": napisy starego kodu - brakuje " + miss.length + " (w nowym kodzie albo w js/teksty/" + list + ")");
        process.exit(miss.length ? 1 : 0);
    }
    const file = process.argv[3], specs = args("obiekt").map(kod.specOf);
    if (!file || !specs.length) { console.log("node tools/teksty.js " + cmd + " <wtyczka.js> --obiekt NAZWA[=klucz][:rodzaj] [...]" + (cmd === "wyjmij" ? " --nazwa <teksty> [--naglowek \"...\"] [--wykonaj]" : " --kod")); process.exit(2); }
    if (cmd === "migawka") {
        const o = kod.oldTexts(path.resolve(file), specs);
        o.texts._opis = "Teksty sprzed przeniesienia do js/teksty (" + path.basename(file) + ": " + args("obiekt").join(", ") + ")" + (o.left.length ? "; w kodzie zostały: " + o.left.join(", ") : "");
        for (const l of o.left) console.error("zostaje w kodzie: " + l);
        process.stdout.write(JSON.stringify(o.texts, null, 1) + "\n");
    } else {
        const name = arg("nazwa", ""), dest = path.join(DIR, name + ".txt");
        if (!name) { console.log("--nazwa <teksty>: plik js/teksty/<teksty>.txt"); process.exit(2); }
        const r = kod.wyjmij(path.resolve(file), name, specs);
        const had = fs.existsSync(dest), lines = [];
        if (!had) lines.push(...(arg("naglowek", "") ? arg("naglowek", "").split("\\n").map(l => "# " + l) : ["# Teksty z " + path.basename(file)]), "#", "# Format: docs/WATKI_DANE.md, rozdz. 3. Po poprawkach: node tools/teksty.js sprawdz " + name, "");
        for (const sp of specs) {
            const sub = sp.key ? sp.key.split(".").reduce((o, k) => (o ? o[k] : undefined), r.texts) : (r.perSpec || {})[sp.name];
            if (!sub) continue;
            lines.push("", "# ======================================================================== " + sp.name + (sp.key ? " (" + sp.key + ")" : ""));
            kod.textLines(sub, sp.key, lines, (r.notes || {})[sp.name], sp.key);
        }
        const text = (had ? fs.readFileSync(dest, "utf8").replace(/\s*$/, "\n\n") : "") + lines.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "") + "\n";
        console.log((process.argv.includes("--wykonaj") ? "" : "(podgląd) ") + "teksty: " + r.removed + " pól -> " + path.relative(ROOT, dest) + (had ? " (dopisane)" : " (nowy)"));
        for (const l of r.left) console.log("  zostaje w kodzie: " + l);
        if (process.argv.includes("--wykonaj")) {
            if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
            fs.writeFileSync(dest, text.replace(/\r\n/g, "\n"));
            fs.writeFileSync(path.resolve(file), r.code);
            console.log("zapisano " + path.relative(ROOT, dest) + " i " + path.relative(ROOT, path.resolve(file)));
        } else process.stdout.write(text.split("\n").slice(-40).join("\n"));
    }
} else if (cmd === "migawka") {
    // the old texts as JSON (tests/fixtures/teksty/<nazwa>_przed.json): what `porownaj` checks the file against, after the plugin changed
    const old = process.argv[3];
    if (!old) { console.log("node tools/teksty.js migawka <stary.js> [--obiekt TX] [--obiekt NAZWA=klucz] > tests/fixtures/teksty/<nazwa>_przed.json"); process.exit(2); }
    const o = oldTexts(old), skipped = [], f = flat(o, "", {}, skipped), tree = {};
    for (const [k, v] of Object.entries(f)) { let t = tree; const p = k.split("."); for (const x of p.slice(0, -1)) t = t[x] || (t[x] = {}); t[p[p.length - 1]] = v; }
    tree._opis = "Teksty sprzed przeniesienia do js/teksty (" + path.basename(old) + ", " + (args("obiekt").join(", ") || "TX") + ")" + (skipped.length ? "; w kodzie zostały: " + skipped.map(x => x.key).join(", ") : "");
    process.stdout.write(JSON.stringify(tree, null, 1) + "\n");
} else if (cmd === "lista") {
    for (const n of names()) {
        const got = parse(fs.readFileSync(path.join(DIR, n + ".txt"), "utf8"), n);
        console.log(n + ".txt: " + got.keys.length + " kluczy (" + got.keys.filter(k => k.list).length + " list), czyta: " + (readersOf(n).join(", ") || "-"));
    }
} else {
    console.log("nie znam polecenia: " + cmd + " (sprawdz | porownaj | wyciagnij | migawka | lista)");
    bad = 1;
}
process.exitCode = bad ? 1 : 0;
module.exports = { parse, flat, toText, findLiteral, oldObject };
