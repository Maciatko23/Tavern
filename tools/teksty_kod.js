// Teksty z kodu wtyczek do plików js/teksty/*.txt (docs/WATKI_DANE.md, rozdz. 3 i 6) - część narzędzia tools/teksty.js, która czyta
// kod jak parser JavaScriptu (acorn z Node - uruchamiane z --expose-internals; tools/teksty.js robi to samo).
//
//   node tools/teksty.js migawka <wtyczka.js> --obiekt SPEC [--obiekt SPEC...]          stare teksty jako JSON (tests/fixtures/teksty/)
//   node tools/teksty.js wyjmij <wtyczka.js> --nazwa <teksty> --obiekt SPEC [...] [--naglowek "..."] [--wykonaj]
//        teksty obiektów do js/teksty/<teksty>.txt (dopisane na końcu, gdy plik jest), w kodzie tylko dane i jedno wywołanie
//        Watki.scal(OBIEKT, "<teksty>", "<klucz>") za obiektem (główny TX: Watki.teksty("<teksty>", { funkcje }))
//
// SPEC = NAZWA[=klucz][:rodzaj] - stała (const) z wtyczki; klucz - gdzie w pliku tekstów (bez: w korzeniu); rodzaj - które napisy
// to teksty: wszystko (domyślnie: każdy napis i lista napisów), zadanie (pola zadania TownQuests: title, where, when, desc, text, say,
// done, remind, hero, early, wet, ask, label, note, yes, no, accept, decline, lines.*, react.*, mozna podac /wyrazenie/ na ścieżkę).
// Napis złożony z kodu ("Noce: " + SHIFTS) albo z funkcji zostaje w kodzie (wypisane). Dopiski: ":zostaw" - pola zostają w kodzie
// puste ("" / []); ":pary" - także kwestie scen [kto, "tekst"] (klucz ...N.1, w kodzie "" na miejscu tekstu).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "js", "teksty");
let acorn = null;
try { acorn = require("internal/deps/acorn/acorn/dist/acorn"); } catch (e) { acorn = null; }

const PRESET = {
    wszystko: () => true,
    zadanie: p => /(^|\.)(title|where|when|desc|text|say|done|remind|hero|early|wet|ask|label|note|yes|no|accept|decline)$/.test(p) || /(^|\.)(lines|react)\./.test(p),
    nazwy: p => /(^|\.)(name|title)$/.test(p),
    // the quests of TownQuests_Data: every string but the fields of the engine (step types, residents' keys, flags, hooks, sounds...)
    // (a field with an engine's name keeps its words when they are words: talk: [lines], late: "Turniej odbył się bez ciebie.")
    miasto: (p, v) => !MIASTO_KOD.has(p.split(".").filter(x => !/^\d+$/.test(x)).pop()) || (v !== undefined && [].concat(v).some(x => isText(String(x))))
};
const MIASTO_KOD = new Set(["type", "to", "kind", "id", "talk", "giver", "flag", "tick", "then", "late", "check", "vars", "fx", "clue", "spotFx", "spots",
    "key", "spot", "fn", "flags", "repeat", "targets", "se", "custom", "guard", "rewardFx", "signers", "clues", "autoStart", "bust", "sayFx", "chFx", "ch",
    "who", "need", "item", "style", "sheet", "face", "img", "map", "dir", "pose", "anim", "music", "bgm", "bgs", "me", "sound", "icon"]);
function specOf(s) {
    const m = /^([A-Za-z_$][\w$]*)(?:=([\w.-]*))?(?::(.+))?$/.exec(s);
    if (!m) throw new Error("zły --obiekt: " + s);
    // (":zostaw" at the end: the fields stay in the code, empty - "" / [] - for whoever copies them by key while the plugins load)
    const keep = /(^|:)zostaw(:|$)/.test(m[3] || ""), pairs = /(^|:)pary(:|$)/.test(m[3] || ""), byId = /(^|:)id(:|$)/.test(m[3] || "");
    const kind = (m[3] || "wszystko").replace(/(^|:)(zostaw|pary|id)(?=:|$)/g, "").replace(/^:+|:+$/g, "") || "wszystko";
    let test = PRESET[kind];
    if (!test && /^\/.*\/$/.test(kind)) { const re = new RegExp(kind.slice(1, -1)); test = p => re.test(p); }
    // "miasto+/^K\d+\./": both (a rodzaj and a filter of the paths)
    if (!test && /\+\//.test(kind)) {
        const [a, b] = [kind.slice(0, kind.indexOf("+/")), kind.slice(kind.indexOf("+/") + 1)], t1 = PRESET[a], re = /^\/.*\/$/.test(b) ? new RegExp(b.slice(1, -1)) : null;
        if (t1 && re) test = (p, v) => t1(p, v) && re.test(p);
    }
    if (!test) throw new Error("nie znam rodzaju " + kind + " (wszystko | zadanie | nazwy | /wyrażenie/)");
    return { name: m[1], key: m[2] || "", kind, test, keep, pairs, byId };
}

// ------------------------------------------------------------------ the code: where a const's literal is, its text leaves
function parse(src, file) {
    if (!acorn) throw new Error("brak parsera (uruchom: node --expose-internals ...)");
    return acorn.parse(src, { ecmaVersion: 2022, sourceType: "script", ranges: true, locations: true, allowHashBang: true, sourceFile: file });
}
function findConst(ast, name) {
    let found = null;
    (function walk(n) {
        if (!n || found || typeof n !== "object") return;
        if (n.type === "VariableDeclaration") for (const d of n.declarations) if (d.id && d.id.name === name && d.init && !found) found = { decl: n, d };
        for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === "string") walk(v); }
    })(ast);
    return found;
}
const strOf = n => (n && n.type === "Literal" && typeof n.value === "string" ? n.value : n && n.type === "TemplateLiteral" && !n.expressions.length ? n.quasis[0].value.cooked : null);
// leaves: { path, value, prop (the Property node), parent (the ObjectExpression) } of the strings / lists of strings the test takes;
// left: those it would take but cannot (built from code)
function leaves(node, test, pairs, byId) {
    const out = [], left = [], notes = {};
    if (node.type === "ArrayExpression" && node.elements.length && node.elements.every(e => e && strOf(e) !== null)) {   // (a list of its own: a note's pair)
        out.push({ path: "", value: node.elements.map(strOf), root: node });
        return { out, left, notes };
    }
    // (an element of a table with an id / who / title: a comment over its words in the file)
    const label = n => { const f = k => { const p = n.properties.find(x => x.type === "Property" && !x.computed && (x.key.name || x.key.value) === k); return p ? strOf(p.value) : null; };
        const id = f("id"), who = f("who"), title = f("title"); return [id, who && "mówi: " + who, title && "„" + title + "”"].filter(Boolean).join(", "); };
    // (a line of a scene: [who, "text"] - who a key or null (the narration); the text is path.1, the code keeps "" in its place)
    const pairOf = e => (e && e.type === "ArrayExpression" && e.elements.length === 2 && e.elements[0] && (strOf(e.elements[0]) !== null || (e.elements[0].type === "Literal" && e.elements[0].value === null))
        && strOf(e.elements[1]) !== null ? e : null);
    const pairLeaf = (e, path) => {
        if (!test(path + ".1", strOf(e.elements[1])) || strOf(e.elements[1]) === "") return false;   // ("": its words are in the file already)
        const who = strOf(e.elements[0]);
        notes[path + ".1"] = who ? "mówi: " + who : "(opis)";
        out.push({ path: path + ".1", value: strOf(e.elements[1]), lit: e.elements[1] });
        return true;
    };
    (function walk(n, p) {
        if (n.type === "ObjectExpression") { const l = label(n); if (l) notes[p] = l; }
        if (n.type === "ObjectExpression") {
            for (const pr of n.properties) {
                if (pr.type !== "Property" || pr.computed || pr.kind !== "init" || pr.method) continue;
                const k = pr.key.type === "Identifier" ? pr.key.name : String(pr.key.value), path = p ? p + "." + k : k, v = pr.value;
                const s = strOf(v);
                if (s !== null) { if (test(path, s)) out.push({ path, value: s, prop: pr, parent: n }); continue; }
                if (pairs && pairOf(v)) { pairLeaf(v, path); continue; }
                if (pairs && v.type === "ArrayExpression" && v.elements.length && v.elements.every(e => pairOf(e))) { walk(v, path); continue; }   // (a scene of lines only)
                if (v.type === "ArrayExpression" && v.elements.length && v.elements.every(e => strOf(e) !== null)) {
                    if (test(path, v.elements.map(strOf))) out.push({ path, value: v.elements.map(strOf), prop: pr, parent: n });
                    continue;
                }
                // (a list of lists of lines - rochNews: [[...], [...]]: each inner list is path.N in the file; the code keeps [] in its place)
                if (v.type === "ArrayExpression" && v.elements.length && v.elements.every(e => e && e.type === "ArrayExpression" && e.elements.length && e.elements.every(x => strOf(x) !== null))) {
                    if (test(path, [].concat(...v.elements.map(e => e.elements.map(strOf))))) v.elements.forEach((e, i) => out.push({ path: path + "." + i, value: e.elements.map(strOf), elem: e, parent: n }));
                    continue;
                }
                if (v.type === "ObjectExpression" || v.type === "ArrayExpression") { walk(v, path); continue; }
                if (v.type === "BinaryExpression" && test(path) && /Literal/.test(v.left.type + v.right.type)) left.push(path);
            }
        } else if (n.type === "ArrayExpression") {
            n.elements.forEach((e, i) => {
                const idOf = () => { const pr = e && e.type === "ObjectExpression" && e.properties.find(x => x.type === "Property" && !x.computed && (x.key.name || x.key.value) === "id"); return pr ? strOf(pr.value) : null; };
                const path = p ? p + "." + i : byId && n === node && idOf() ? idOf() : String(i);   // (":id" - a list of quests: zadania.K1, not zadania.0)
                if (pairs && pairOf(e)) { pairLeaf(e, path); return; }
                if (e && (e.type === "ObjectExpression" || e.type === "ArrayExpression")) walk(e, path);
            });
        }
    })(node, "");
    return { out, left, notes };
}

// ------------------------------------------------------------------ the old values: the plugin run in a sandbox, the consts caught
function runCaught(file, names, texts) {
    const src = fs.readFileSync(file, "utf8"), ast = parse(src, file);
    const ins = [];
    for (const n of names) {
        const f = findConst(ast, n);
        if (!f) throw new Error("nie ma stałej " + n + " w " + file);
        ins.push({ at: f.decl.end, code: ";(globalThis.__kod = globalThis.__kod || {})[" + JSON.stringify(n) + "] = " + n + ";" });
    }
    let code = src;
    for (const i of ins.sort((a, b) => b.at - a.at)) code = code.slice(0, i.at) + i.code + code.slice(i.at);
    const sandbox = require(path.join(ROOT, "tests", "lib", "sandbox.js"));
    const win = sandbox.makeWindow({});
    const load = n => { const c = fs.readFileSync(path.join(ROOT, "js", "plugins", n + ".js"), "utf8"); vm.compileFunction("with (__scope) {\n" + c + "\n}", ["__scope"], { filename: n })(win.__scope); };
    for (const n of ["TawernaCore", "Watki"]) { try { load(n); } catch (e) { /* (a plugin without the core still runs) */ } }
    win.globalThis = win;
    vm.compileFunction("with (__scope) {\n" + code.replace(/globalThis\.__kod/g, "__scope.__kod") + "\n}", ["__scope"], { filename: file })(win.__scope);
    // (the words of the files, as the game reads them when it starts: what Watki.teksty / scal gave the plugin)
    if (texts && win.Watki) for (const [n, t] of Object.entries(texts)) win.Watki.wczytaj(n, t);
    return win.__kod || {};
}
function tree(list) {
    if (list.length === 1 && list[0].path === "") return list[0].value;
    const t = {};
    for (const l of list) { let o = t; const p = l.path.split("."); for (const x of p.slice(0, -1)) o = o[x] || (o[x] = {}); o[p[p.length - 1]] = l.value; }
    return t;
}
// the texts of the specs from the plugin's code (the values the code itself would make)
function oldTexts(file, specs) {
    const src = fs.readFileSync(file, "utf8"), ast = parse(src, file), out = {}, left = [];
    let vals = null;
    try { vals = runCaught(file, specs.map(s => s.name)); } catch (e) { vals = null; console.error("(piaskownica: " + e.message + " - wartości z kodu literałów)"); }
    for (const sp of specs) {
        const f = findConst(ast, sp.name), L = leaves(f.d.init, sp.test, sp.pairs, sp.byId);
        left.push(...L.left.map(p => sp.name + "." + p));
        // (the run value, when the sandbox ran it: the same as the literal for a plain string - the check of the parser)
        const list = L.out.map(l => ({ path: l.path, value: l.value }));
        if (vals && vals[sp.name] !== undefined) for (const l of list) {
            let v = vals[sp.name];
            for (const k of l.path ? l.path.split(".") : []) v = v === undefined || v === null ? v : Array.isArray(v) && sp.byId && !/^\d+$/.test(k) ? v.find(e => e && e.id === k) : v[k];
            if (JSON.stringify(v) !== JSON.stringify(l.value)) left.push(sp.name + "." + l.path + " (w grze inaczej niż w kodzie: " + JSON.stringify(v).slice(0, 60) + ")");
        }
        const t = tree(list);
        if (sp.key) { let o = out; const p = sp.key.split("."); for (const x of p.slice(0, -1)) o = o[x] || (o[x] = {}); o[p[p.length - 1]] = Array.isArray(t) ? t : Object.assign(o[p[p.length - 1]] || {}, t); }
        else Object.assign(out, t);
    }
    return { texts: out, left };
}

// ------------------------------------------------------------------ the file of texts
const SEG = /^[\w\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/;
function quoteLine(s, inBlock) {
    const t = String(s).replace(/\n(?!\[)/g, "\\n");
    const need = t !== t.trim() || (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') || (inBlock && (t === "" || t[0] === "#"));
    return need ? '"' + t + '"' : t;
}
function textLines(obj, pre, out, notes, base) {
    if (Array.isArray(obj) && pre) { out.push("[" + pre + "]"); for (const l of obj) out.push(quoteLine(l, true)); out.push(""); return out; }
    for (const [k, v] of Object.entries(obj)) {
        const key = pre ? pre + "." + k : k, rel = base !== undefined ? (base ? key.slice(base.length + 1) : key) : null;
        if (notes && rel !== null && notes[rel]) out.push("# " + notes[rel]);
        if (!key.split(".").every(x => SEG.test(x))) { out.push("# (klucz nie do zapisania: " + JSON.stringify(key) + ")"); continue; }
        if (typeof v === "string") out.push((key + " = " + quoteLine(v, false)).replace(/ $/, ""));
        else if (Array.isArray(v)) { out.push("[" + key + "]"); for (const l of v) out.push(quoteLine(l, true)); out.push(""); }
        else if (v && typeof v === "object") textLines(v, key, out, notes, base);
    }
    return out;
}

// ------------------------------------------------------------------ taking the texts out of the code
function lineStart(src, i) { const j = src.lastIndexOf("\n", i - 1); return j + 1; }
function cut(src, from, to) {
    // a line left with only spaces (and maybe a comma) goes whole
    const a = lineStart(src, from), e = src.indexOf("\n", to), b = e < 0 ? src.length : e;
    const rest = src.slice(a, from) + src.slice(to, b);
    if (/^\s*$/.test(rest)) return src.slice(0, a) + src.slice(b + 1);
    return src.slice(0, from) + src.slice(to);
}
function removeLeaves(src, list) {
    // per object: which properties go; a gone one takes its comma (the one after it, or - the last one - the one before it)
    const cuts = [];
    const byParent = new Map();
    for (const l of list) { if (!byParent.has(l.parent)) byParent.set(l.parent, new Set()); byParent.get(l.parent).add(l.prop); }
    for (const [parent, gone] of byParent) {
        const props = parent.properties;
        props.forEach((pr, i) => {
            if (!gone.has(pr)) return;
            const next = props.slice(i + 1).find(x => !gone.has(x));
            if (next) {
                let j = pr.end;
                while (j < src.length && /\s/.test(src[j])) j++;
                if (src[j] === ",") j++;
                while (j < src.length && src[j] === " ") j++;
                cuts.push([pr.start, j]);
            } else {
                const prev = props.slice(0, i).reverse().find(x => !gone.has(x));
                if (prev) {
                    // ", prop" after the last kept one (once for a run of gone ones at the end)
                    const firstGone = props.slice(props.indexOf(prev) + 1)[0];
                    if (firstGone === pr) cuts.push([prev.end, props[props.length - 1].end]);
                } else if (i === 0) {
                    // all gone: the inside of the braces
                    let j = props[props.length - 1].end;
                    while (j < src.length && /[\s,]/.test(src[j]) && src[j] !== "\n") j++;
                    cuts.push([pr.start, j]);
                }
            }
        });
    }
    let out = src;
    for (const [a, b] of cuts.sort((x, y) => y[0] - x[0])) out = cut(out, a, b);
    return out;
}
// a literal of texts only (strings, lists of strings, objects of them): the whole object can be the file's (Watki.teksty)
function textsOnly(n) {
    if (strOf(n) !== null) return true;
    if (n.type === "ArrayExpression") return n.elements.every(e => e && strOf(e) !== null);
    if (n.type === "ObjectExpression") return n.properties.every(p => p.type === "Property" && !p.computed && p.kind === "init" && !p.method && textsOnly(p.value));
    return false;
}
function wyjmij(file, name, specs, o) {
    const src0 = fs.readFileSync(file, "utf8"), crlf = /\r\n/.test(src0), src = src0.replace(/\r\n/g, "\n");
    const ast = parse(src, file), res = { texts: {}, left: [], removed: 0 };
    const all = [];
    const inserts = [], whole = new Set();
    for (const sp of specs) {
        const f = findConst(ast, sp.name);
        if (!f) throw new Error("nie ma stałej " + sp.name);
        const L = leaves(f.d.init, sp.test, sp.pairs, sp.byId);
        // (a key the file cannot hold - "4+2" - would lose its words: stop before anything changes)
        const bad = L.out.filter(l => !(sp.key ? sp.key + "." + l.path : l.path).split(".").filter(Boolean).every(x => SEG.test(x)));
        if (bad.length) throw new Error(sp.name + ": klucze nie do zapisania w pliku: " + bad.slice(0, 5).map(l => l.path).join(", "));
        res.left.push(...L.left.map(p => sp.name + "." + p));
        all.push(...L.out);
        res.removed += L.out.length;
        (res.notes = res.notes || {})[sp.name] = L.notes;
        const t = tree(L.out);
        (res.perSpec = res.perSpec || {})[sp.name] = t;
        if (sp.key) { let o2 = res.texts; const p = sp.key.split("."); for (const x of p.slice(0, -1)) o2 = o2[x] || (o2[x] = {}); o2[p[p.length - 1]] = Array.isArray(t) ? t : Object.assign(o2[p[p.length - 1]] || {}, t); }
        else Object.assign(res.texts, t);
        if (L.out.length === 1 && L.out[0].root) {   // (a list of its own: [] in the code, its words merged in)
            if (!sp.key) throw new Error(sp.name + ": lista sama w sobie - podaj klucz (NAZWA=klucz)");
            whole.add(sp.name);
            inserts.push({ at: f.d.init.start, end: f.d.init.end, code: "[]" });
            const ind0 = /^\s*/.exec(src.slice(lineStart(src, f.decl.start), f.decl.start))[0];
            inserts.push({ at: f.decl.end, code: "\n" + ind0 + "Watki.scal(" + sp.name + ", " + JSON.stringify(name) + ", " + JSON.stringify(sp.key) + ");   // (its words: js/teksty/" + name + ".txt, " + sp.key + ")" });
            continue;
        }
        // (the main object of texts, nothing else in it: Watki.teksty(name) - the file's own object)
        if (!sp.key && sp.kind === "wszystko" && f.d.init.type === "ObjectExpression" && textsOnly(f.d.init)) { whole.add(sp.name); inserts.push({ at: f.d.init.start, end: f.d.init.end, code: "Watki.teksty(" + JSON.stringify(name) + ")" }); continue; }
        const ind = /^\s*/.exec(src.slice(lineStart(src, f.decl.start), f.decl.start))[0];
        inserts.push({ at: f.decl.end, code: "\n" + ind + "Watki.scal(" + sp.name + ", " + JSON.stringify(name) + ", " + JSON.stringify(sp.key) + (sp.byId ? ", \"id\"" : "") + ");   // (its words: js/teksty/" + name + ".txt" + (sp.key ? ", " + sp.key : "") + (sp.byId ? ", by the id" : "") + ")" });
    }
    // the inserts first (they are after the literals or replace them), then the cuts inside the literals - both from the end
    let code = src;
    for (const i of inserts.sort((a, b) => b.at - a.at)) code = code.slice(0, i.at) + i.code + code.slice(i.end !== undefined ? i.end : i.at);
    // (":zostaw": the values emptied in place - "" / [] - the keys stay)
    const astK = parse(code, file), reps = [];
    for (const sp of specs) if (!whole.has(sp.name)) for (const l of leaves(findConst(astK, sp.name).d.init, sp.test, sp.pairs, sp.byId).out) {
        if (l.elem) reps.push([l.elem.start, l.elem.end, "[]"]);   // (an inner list of a list of lists: emptied in place)
        else if (l.lit) reps.push([l.lit.start, l.lit.end, '""']);   // (a scene's line [who, "text"]: "" in place)
        else if (sp.keep) reps.push([l.prop.value.start, l.prop.value.end, Array.isArray(l.value) ? "[]" : '""']);
    }
    for (const [a, b, t] of reps.sort((x, y) => y[0] - x[0])) code = code.slice(0, a) + t + code.slice(b);
    const ast2 = parse(code, file), all2 = [];
    for (const sp of specs) if (!whole.has(sp.name) && !sp.keep) all2.push(...leaves(findConst(ast2, sp.name).d.init, sp.test, sp.pairs, sp.byId).out.filter(x => x.prop));
    code = removeLeaves(code, all2);
    // the new code still parses, and no text the specs take is left in it
    const ast3 = parse(code, file);
    const empty = v => (Array.isArray(v) ? !v.length : v === "");
    for (const sp of specs) {
        const f3 = findConst(ast3, sp.name), L = leaves(f3.d.init, sp.test, sp.pairs, sp.byId), rest = L.out.filter(x => !((sp.keep || x.lit) && empty(x.value)));
        if (rest.length && !(whole.has(sp.name) && f3.d.init.type !== "ObjectExpression" && f3.d.init.type !== "ArrayExpression")) throw new Error("zostały teksty w " + sp.name + ": " + rest.map(x => x.path).slice(0, 5).join(", "));
    }
    res.code = crlf ? code.replace(/\n/g, "\r\n") : code;
    return res;
}

// ------------------------------------------------------------------ the texts left in the code; the old code's texts all still there
const isText = s => (/\s/.test(s) && /[a-ząćęłńóśźż]{3}/i.test(s)) || /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(s);
function literals(file, all) {
    const src = fs.readFileSync(file, "utf8"), out = [], ast = parse(src, file);
    (function walk(n) {
        if (!n || typeof n !== "object") return;
        const cal = n.type === "CallExpression" || n.type === "NewExpression" ? n.callee : null;
        if (!all && cal && ((cal.type === "MemberExpression" && cal.object.type === "Identifier" && cal.object.name === "console") || (cal.type === "Identifier" && /Error|warnOnce|report/.test(cal.name)))) return;
        if (n.type === "Literal" && typeof n.value === "string" && isText(n.value)) out.push({ v: n.value, line: n.loc.start.line });
        if (n.type === "TemplateLiteral") for (const q of n.quasis) if (isText(q.value.cooked)) out.push({ v: q.value.cooked, line: q.loc.start.line });
        for (const k of Object.keys(n)) { if (k === "loc") continue; const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === "string") walk(v); }
    })(ast);
    return out;
}
// (the old texts: in the new code, or inside a text of the files - a fragment of a template counts)
function zgodnosc(oldFile, newFile, treeValues) {
    const newLits = new Set(literals(newFile, true).map(x => x.v)), miss = [];
    for (const l of literals(oldFile, true)) {
        if (newLits.has(l.v) || treeValues.some(v => v.includes(l.v) || v.includes(l.v.trim()))) continue;
        miss.push(l);
    }
    return miss;
}

// ------------------------------------------------------------------ the texts of the code itself (not of a data const) to the file
// kluczuj(file, name, { bez, obiekt }): every text literal inside a function that runs after the game started becomes
// TK.kod.<function>[n] (TK = Watki.teksty(name), one line put after "use strict"); the words go to js/teksty/<name>.txt as
// kod.<function>.<n> (in the order of the code, one key per text of a function). Left in the code: what runs while the plugins load
// (the top of the file, a function called there, a callback of forEach/map... there - the words are not read yet), a template with
// ${...}, a call of console / Error / report, and what `bez` (a regex) matches.
const ITER = new Set(["forEach", "map", "filter", "some", "every", "reduce", "find", "findIndex", "sort", "flatMap", "concat"]);
function kluczuj(file, name, o) {
    o = o || {};
    const src0 = fs.readFileSync(file, "utf8"), crlf = /\r\n/.test(src0), src = src0.replace(/\r\n/g, "\n");
    // (never texts: a call of an event's script "Kruk.act(this, ...)", a canvas font "bold 36px ...", a map marker "Miejsce: x",
    // a note tag "<Light:...>")
    const BEZ = /\b\w+\.\w+\(this\b|^\s*(?:if\s*\(|[A-Za-z_$][\w$]*(?:\.[\w$]+)+\()|^(bold |italic )*\d+px|^Miejsce: |^<\w+[:>]/;
    const ast = parse(src, file), own = o.bez ? new RegExp(o.bez) : null, bez = { test: t => BEZ.test(t) || !!(own && own.test(t)) };
    const skipOwn = new Set(String(o.bezFunkcji || "").split(",").filter(Boolean));   // (functions of the code's own checks: their words stay)
    const isFn = n => n && (n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression" || n.type === "FunctionDeclaration");
    const segOf = s => (String(s).replace(/[^\w]/g, "_").replace(/^_+|_+$/g, "") || "x").replace(/^\d/, d => "n" + d);   // (TK.kod.<it>: a name, 23 -> n23)
    // the functions called while the file loads: called by name from the top (outside every function but the IIFEs)
    const loadCalled = new Set();
    (function scan(n, top) {
        if (!n || typeof n !== "object") return;
        if (top && n.type === "CallExpression" && n.callee.type === "Identifier") loadCalled.add(n.callee.name);
        const iife = n.type === "CallExpression" && isFn(n.callee);
        for (const k of Object.keys(n)) {
            if (k === "loc") continue;
            const v = n[k], kids = Array.isArray(v) ? v : v && typeof v.type === "string" ? [v] : [];
            for (const c of kids) scan(c, top && (!isFn(c) || (iife && c === n.callee)));
        }
    })(ast, true);
    // ... and what those call in turn (by name, outside their own inner functions): the whole chain runs while loading
    const bodies = new Map();
    (function named(n) {
        if (!n || typeof n !== "object") return;
        if (n.type === "FunctionDeclaration" && n.id) bodies.set(n.id.name, n.body);
        if (n.type === "VariableDeclarator" && n.id && n.id.type === "Identifier" && isFn(n.init)) bodies.set(n.id.name, n.init.body);
        for (const k of Object.keys(n)) { if (k === "loc") continue; const v = n[k]; if (Array.isArray(v)) v.forEach(named); else if (v && typeof v.type === "string") named(v); }
    })(ast);
    const callsIn = body => {
        const out = new Set();
        (function c(n, inner) {
            if (!n || typeof n !== "object") return;
            if (!inner && n.type === "CallExpression" && n.callee.type === "Identifier") out.add(n.callee.name);
            const iife = n.type === "CallExpression" && isFn(n.callee);
            for (const k of Object.keys(n)) {
                if (k === "loc") continue;
                const v = n[k], kids = Array.isArray(v) ? v : v && typeof v.type === "string" ? [v] : [];
                for (const x of kids) c(x, inner || (isFn(x) && !(iife && x === n.callee)));
            }
        })(body, false);
        return out;
    };
    for (const todo = [...loadCalled]; todo.length;) {
        const b = bodies.get(todo.pop());
        if (b) for (const nm of callsIn(b)) if (!loadCalled.has(nm)) { loadCalled.add(nm); todo.push(nm); }
    }
    const left = [], TK = o.tk || "TK", POD = o.pod || "kod", keys = {}, texts = {};
    let count = 0;
    if (new RegExp("\\b" + TK + "\\b").test(src)) throw new Error(TK + " już jest w " + path.basename(file) + " - podaj inną nazwę (--tk)");
    const strLit = n => (n && n.type === "Literal" && typeof n.value === "string" ? n.value : n && n.type === "TemplateLiteral" && !n.expressions.length ? n.quasis[0].value.cooked : null);
    // a key of the file: kod.<owner>.<n> - the same text twice in one function: one key
    const keyOf = (owner, v) => {
        const t = texts[owner] || (texts[owner] = []);
        let i = t.indexOf(v);
        if (i < 0) { i = t.length; t.push(v); }
        keys[POD + "." + owner + "." + i] = v;
        count++;
        return TK + "." + POD + "." + owner + "[" + i + "]";
    };
    // the source of a node with the replacements inside it made
    const render = (n, reps) => {
        let out = src.slice(n.start, n.end);
        for (const [x, y, t] of reps.slice().sort((p, q) => q[0] - p[0])) out = out.slice(0, x - n.start) + t + out.slice(y - n.start);
        return out;
    };
    // the name of a {place} in a template: the variable / the field it shows, else its number
    const placeName = (e, used) => {
        let nm = e.type === "Identifier" ? e.name : e.type === "MemberExpression" && !e.computed ? e.property.name : "";
        if (!/^\w+$/.test(nm)) nm = "";
        let k = nm || String(used.size + 1), j = 2;
        while (used.has(k) && used.get(k) !== src.slice(e.start, e.end)) k = (nm || "x") + j++;
        used.set(k, src.slice(e.start, e.end));
        return k;
    };
    // walk: owner - the nearest named function; late - the code runs after the start (inside a function not run while loading).
    // Returns the replacements [start, end, code] of the subtree.
    function walk(n, owner, late, parent, key) {
        if (!n || typeof n !== "object") return [];
        if (n.type === "ExpressionStatement" && n.directive) return [];
        const cal = n.type === "CallExpression" || n.type === "NewExpression" ? n.callee : null;
        if (cal && ((cal.type === "MemberExpression" && cal.object.type === "Identifier" && cal.object.name === "console") || (cal.type === "Identifier" && /Error|warnOnce|report/.test(cal.name)))) return [];
        if (n.type === "NewExpression" && cal.type === "Identifier" && /Error$/.test(cal.name)) return [];
        let own = owner, lt = late;
        if (isFn(n)) {
            const nm = n.id ? n.id.name : parent && parent.type === "VariableDeclarator" ? parent.id.name : parent && (parent.type === "Property" || parent.type === "MethodDefinition") && !parent.computed ? (parent.key.name || parent.key.value)
                : parent && parent.type === "AssignmentExpression" && parent.left.type === "MemberExpression" && !parent.left.computed ? parent.left.property.name : null;
            if (nm) own = segOf(nm);
            const iife = parent && parent.type === "CallExpression" && parent.callee === n;
            const iterCb = parent && parent.type === "CallExpression" && parent.callee.type === "MemberExpression" && ITER.has(parent.callee.property.name) && !late;
            lt = late || !(iife || iterCb || (nm && loadCalled.has(nm) && !late));
        }
        const isKey = parent && (parent.type === "Property" || parent.type === "MethodDefinition") && key === "key" && !parent.computed;
        const text = isKey ? null : strLit(n);
        if (text !== null && isText(text)) {
            if (bez.test(text) || skipOwn.has(own)) { left.push({ v: text, line: n.loc.start.line, why: "bez" }); return []; }
            if (!lt) { left.push({ v: text, line: n.loc.start.line, why: "przy wczytaniu" }); return []; }
            return [[n.start, n.end, keyOf(own || "glowna", text)]];
        }
        // "Karmienia: " + n + " (każde innego dnia)." and `...${x}...`: one text with {miejsca} - Watki.wstaw(TK.kod.f[i], { n: n })
        const chainRoot = n.type === "BinaryExpression" && n.operator === "+" && !(parent && parent.type === "BinaryExpression" && parent.operator === "+" && key === "left");
        if (chainRoot || (n.type === "TemplateLiteral" && n.expressions.length)) {
            let parts = null;   // [{ s: text } | { e: node }]
            if (n.type === "TemplateLiteral") {
                parts = [];
                n.quasis.forEach((q, i) => { if (q.value.cooked) parts.push({ s: q.value.cooked }); if (n.expressions[i]) parts.push({ e: n.expressions[i] }); });
            } else {
                const ops = [], spine = [];   // (spine[j]: the "+" over ops[0..j+1] - its range has the brackets of (a ? b : c) + n)
                (function flat(x) { if (x.type === "BinaryExpression" && x.operator === "+") { flat(x.left); ops.push(x.right); spine.push(x); } else ops.push(x); })(n);
                const k0 = ops.findIndex(x => strLit(x) !== null);
                if (k0 >= 0) {
                    parts = [];
                    if (k0 > 0) parts.push({ e: k0 === 1 ? ops[0] : { type: "Group", start: spine[k0 - 2].start, end: spine[k0 - 2].end, ops: ops.slice(0, k0) } });
                    for (const x of ops.slice(k0)) parts.push(strLit(x) !== null ? { s: strLit(x) } : { e: x });
                }
            }
            if (parts && parts.some(x => x.s !== undefined && isText(x.s)) && parts.some(x => x.e)) {
                const where = n.loc.start.line, tmpl = parts.map(x => (x.s !== undefined ? x.s : null));
                if (bez.test(tmpl.filter(x => x !== null).join("")) || skipOwn.has(own)) { left.push({ v: tmpl.map(x => (x === null ? "{}" : x)).join(""), line: where, why: "bez" }); return [].concat(...parts.filter(x => x.e).map(x => walkPart(x.e, own, lt, n))); }
                if (!lt) { left.push({ v: tmpl.map(x => (x === null ? "{}" : x)).join(""), line: where, why: "przy wczytaniu" }); return []; }
                const used = new Map(), vars = [];
                let t = "";
                for (const x of parts) {
                    if (x.s !== undefined) { t += x.s; continue; }
                    const nm = x.e.type === "Group" ? String(used.size + 1) : placeName(x.e, used);
                    if (x.e.type === "Group") used.set(nm, "group");
                    t += "{" + nm + "}";
                    const inner = walkPart(x.e, own, lt, n);
                    const code = render(x.e, inner);
                    if (!vars.some(v => v[0] === nm)) vars.push([nm, x.e.type === "SequenceExpression" ? "(" + code + ")" : code]);
                }
                if (/\{\w+\}/.test(parts.filter(x => x.s !== undefined).map(x => x.s).join(""))) { left.push({ v: t, line: where, why: "{ w tekście" }); return []; }
                return [[n.start, n.end, "Watki.wstaw(" + keyOf(own || "glowna", t) + ", { " + vars.map(([k, c]) => (/^\d/.test(k) ? JSON.stringify(k) : k) + ": " + c).join(", ") + " })"]];
            }
        }
        if (n.type === "TemplateLiteral" && n.quasis.some(q => isText(q.value.cooked))) { left.push({ v: n.quasis.map(q => q.value.cooked).join("${}"), line: n.loc.start.line, why: "szablon" }); }
        const out = [];
        for (const k of Object.keys(n)) {
            if (k === "loc") continue;
            const v = n[k];
            if (Array.isArray(v)) v.forEach(c => out.push(...walk(c, own, lt, n, k))); else if (v && typeof v.type === "string") out.push(...walk(v, own, lt, n, k));
        }
        return out;
    }
    // a part of a chain: a node, or a group of the first operands (a + b + "x": a + b stays as it is)
    function walkPart(e, own, lt, parent) {
        if (e.type !== "Group") return walk(e, own, lt, parent, "right");
        const out = [];
        for (const x of e.ops) out.push(...walk(x, own, lt, parent, "right"));
        return out;
    }
    const reps = walk(ast, null, false, null, null);
    let code = src;
    for (const [a, b, t] of reps.sort((x, y) => y[0] - x[0])) code = code.slice(0, a) + t + code.slice(b);
    // TK after the first "use strict" (the IIFE's), else on top
    const us = /^(\s*)(["'])use strict\2;?[^\n]*\n/m.exec(code);
    const line = (us ? us[1].replace(/\n/g, "") : "") + "const " + TK + " = Watki.teksty(" + JSON.stringify(name) + ");   // (the words of this file: js/teksty/" + name + ".txt, " + POD + ".*)\n";
    if (reps.length) code = us ? code.slice(0, us.index + us[0].length) + line + code.slice(us.index + us[0].length) : line + code;
    try { parse(code, file); } catch (e) { e.message += "\n(nowy kod) " + (e.loc ? code.split("\n")[e.loc.line - 1] : ""); throw e; }
    return { code: crlf ? code.replace(/\n/g, "\r\n") : code, keys, texts, left, n: count };
}

module.exports = { acorn: () => !!acorn, specOf, oldTexts, wyjmij, textLines, PRESET, _run: runCaught, parse, findConst, leaves, literals, zgodnosc, kluczuj };
