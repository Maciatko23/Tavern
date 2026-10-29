//=============================================================================
// Watki.js
//=============================================================================
// The threads' engine (docs/WATKI_DANE.md - the refactor "zadania i wątki jako dane, teksty z kodu do plików", 2026-10-23):
//   1. TEXTS - js/teksty/<nazwa>.txt: files a person reads and corrects without code (keys, blocks of lines, "> " the hero), read
//      with the game's database (DataManager.loadDatabase / isDatabaseLoaded: before the title; a missing file - the engine's own
//      "Failed to load" with Retry). A plugin asks Watki.teksty("nazwa") while it loads: the object it gets is filled in place once
//      the file is read (Watki.poTekstach(fn) for what has to wait for the words). The format: docs/WATKI_DANE.md, section 3.
//   2. TALKS - one builder of event commands (101/401 with \SPK[n] - SpeechBubbles shows them -, 102/402/404 choices, 355 script
//      calls): the copies of wrap / sayTo / linesTo / choiceTo in each thread's plugin come here (Watki.mowa).
//   3. THREADS - Watki.watek(def): a thread as data - its state (Tawerna.state: version, migrations), its chapters (steps of a
//      TownQuests quest - the journal, the markers, the rewards stay TownQuests'; or, with no quest, its own record and its own
//      journal source "watki"), conditions (gdy), actions (zrob, named: Watki.act(this, [id, akcja, ...])), talks (trees of text
//      keys: lines, choices, branches), topics at Borgar's bar, the F9 jumps to a chapter (Debug.js asks Watki.f9). What only code
//      can do (scenes, fights, walking, mini-games, the map's events) stays in the thread's plugin as named hooks (w.haki({...})).
// Bus: watekAkcja { watek, akcja, args } after a named action; watekStart / watekKrok / watekKoniec { watek, krok } (own records).
// API: window.Watki (Tawerna.api("Watki")).

/*:
 * @target MZ
 * @plugindesc Silnik wątków i zadań: wątek jako dane (rozdziały, warunki, akcje, rozmowy, skoki F9), teksty z plików js/teksty/*.txt czytane przy starcie gry, jeden budowniczy rozmów. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Journal
 *
 * @help
 * ============================================================================
 * Watki.js - silnik wątków (docs/WATKI_DANE.md)
 * ============================================================================
 * Teksty wątków leżą w js/teksty/<nazwa>.txt (czyta je człowiek, poprawia
 * w Notatniku; gra czyta je przy starcie, razem z bazą danych). Sprawdzanie:
 *   node tools/teksty.js sprawdz          wszystkie pliki: klucze, długość, „”
 * Wątek = dane w swojej wtyczce (Watki.watek({...})): rozdziały, warunki,
 * akcje, rozmowy, skoki F9; kod specjalny zostaje w wtyczce jako haki.
 * F9, zakładka „Wyspa i fabuła”: wiersze wątków silnika (przeskok do
 * rozdziału).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Watki.js: brak TawernaCore.js - musi być wyżej na liście wtyczek");
    const PLUGIN = "Watki";
    const DIR = "js/teksty/";
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const report = (where, e) => console.error("[Watki] " + where + ":", e);
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const SB = () => T.api("SpeechBubbles") || window.SpeechBubbles || null;

    // ==================================================================
    // 1. Texts: js/teksty/<nazwa>.txt
    // ==================================================================
    // The format (docs/WATKI_DANE.md 3):
    //   # ...                  a comment (a line of its own)
    //   klucz = tekst          one string; the key: letters, digits, _ - . (a dot: a level deeper - greet.baltazar.intro)
    //   [klucz]  # ...         a list: every line below it is one element, up to the first empty line
    //   "  tekst "             ASCII quotes keep the spaces at the ends (a text beginning or ending with a space)
    //   \n                     a new line inside the text (not before "[": \N[1] is the engine's code of a name)
    // The values come out as the code had them: a string, or an array of strings. Anything else is a mistake, told with its line.
    const KEY_RE = /^[\w.ąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]+$/;   // (a key of the code may have a Polish letter: looks.kocioł)
    function parse(src, name) {
        const tree = {}, errors = [], keys = [];
        const lines = String(src === undefined || src === null ? "" : src).replace(/^﻿/, "").split(/\r?\n/);
        const value = s => {
            let t = s.trim();
            if (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') t = t.slice(1, -1);
            return t.replace(/\\n(?!\[)/g, "\n");
        };
        const put = (key, v, n) => {
            const path = key.split(".");
            if (path.some(p => !p)) { errors.push("linia " + n + ": zły klucz „" + key + "”"); return; }
            let o = tree;
            for (let i = 0; i < path.length - 1; i++) {
                const p = path[i];
                if (o[p] === undefined) o[p] = {};
                else if (typeof o[p] !== "object" || Array.isArray(o[p])) { errors.push("linia " + n + ": „" + path.slice(0, i + 1).join(".") + "” jest już tekstem - „" + key + "” nie może być pod nim"); return; }
                o = o[p];
            }
            const last = path[path.length - 1];
            if (o[last] !== undefined) { errors.push("linia " + n + ": klucz „" + key + "” drugi raz (zostaje pierwszy)"); return; }
            o[last] = v;
            keys.push({ key, line: n, list: Array.isArray(v) });
        };
        let block = null;
        for (let i = 0; i <= lines.length; i++) {
            const raw = i < lines.length ? lines[i] : "", t = raw.trim(), n = i + 1;
            if (block) {
                if (!t) { put(block.key, block.list, block.line); block = null; continue; }
                if (t[0] === "#") continue;
                block.list.push(value(t));
                continue;
            }
            if (!t || t[0] === "#") continue;
            let m = /^\[([^\]]*)\]\s*(#.*)?$/.exec(t);
            if (m) {
                if (!KEY_RE.test(m[1])) { errors.push("linia " + n + ": zły klucz „" + m[1] + "”"); continue; }
                block = { key: m[1], list: [], line: n };
                continue;
            }
            m = /^([^\s=]+)\s*=(.*)$/.exec(t);
            if (m && KEY_RE.test(m[1])) { put(m[1], value(m[2]), n); continue; }
            errors.push("linia " + n + ": nie rozumiem: „" + t.slice(0, 60) + "”");
        }
        return { tree, errors, keys, name: name || "" };
    }
    // the files: name -> { url, obj (filled in place), st: new | loading | ok | error, errors, keys }
    const files = new Map();
    const afterTexts = [];
    let started = false, textsIn = false;
    // extra: what is not a text but has to sit in the same object (functions building a line from a template: "towerFound(n)") -
    // kept there through every reading of the file
    function teksty(name, extra) {
        const key = String(name);
        let f = files.get(key);
        if (!f) {
            f = { name: key, url: DIR + key + ".txt", obj: {}, st: "new", errors: [], keys: [], extra: {} };
            files.set(key, f);
            if (started) loadFile(f);
        }
        if (extra) { Object.assign(f.extra, extra); Object.assign(f.obj, extra); }
        return f.obj;
    }
    function applyText(f, src) {
        const got = parse(src, f.name);
        for (const k of Object.keys(f.obj)) delete f.obj[k];
        Object.assign(f.obj, got.tree, f.extra);
        f.errors = got.errors;
        f.keys = got.keys;
        f.st = "ok";
        for (const e of got.errors) console.error("[Watki] " + f.url + ", " + e);
        if (textsIn) for (const m of merges) if (m.name === f.name) { try { m.apply(); } catch (e) { report("scal " + m.prefix, e); } }   // (read again: merged again)
    }
    // the words of a data object (a quest, a table of residents, notes) in the file under a key: merged into the object once the words
    // are in, and again after every reading (F9) - the object keeps its identity, its code no texts. Watki.scal(Q_K55, "zasoby",
    // "zadania.K55"): steps.0.text, offer.say... of the file land on the same paths of the object (a list: replaced; numbers: an index)
    const merges = [];
    function mergeInto(target, src) {
        for (const [k, v] of Object.entries(src)) {
            if (typeof v === "string") target[k] = v;
            else if (Array.isArray(v)) { if (Array.isArray(target[k])) target[k].splice(0, target[k].length, ...v); else target[k] = v.slice(); }   // (a list kept in place: whoever holds it sees the words)
            else if (v && typeof v === "object") {
                if (!target[k] || typeof target[k] !== "object") target[k] = Object.keys(v).every(x => /^\d+$/.test(x)) ? [] : {};
                mergeInto(target[k], v);
            }
        }
    }
    // poKluczu ("id"): a list whose elements the file names by that field - zadania.K1.title lands on the element with id "K1"
    // (the order of the list may change, the words stay with their quest)
    function scal(obj, name, prefix, poKluczu) {
        const t = teksty(name), m = { obj, name: String(name), prefix: prefix || "" };
        m.apply = () => {
            const sub = m.prefix ? lookup(t, m.prefix) : t;
            if (!sub || typeof sub !== "object") return;
            if (!poKluczu || !Array.isArray(m.obj)) { mergeInto(m.obj, sub); return; }
            for (const [k, v] of Object.entries(sub)) {
                const el = m.obj.find(e => e && String(e[poKluczu]) === k);
                if (el && v && typeof v === "object") mergeInto(el, v);
                else if (!el) console.error("[Watki] js/teksty/" + m.name + ".txt, " + m.prefix + "." + k + ": nie ma takiego " + poKluczu + " w liście");
            }
        };
        merges.push(m);
        poTekstach(m.apply);
        return obj;
    }
    // fields of a data object read from the words: Watki.zTekstu(PARTIES.grum, { name: "partie.grum.name" }, "rywal") - a getter each,
    // so the object (made while the plugin loads) shows the file's words in the game (and after F9 "Wczytaj teksty od nowa")
    function zTekstu(obj, map, name) {
        const t = teksty(name);
        for (const [field, key] of Object.entries(map || {})) {
            Object.defineProperty(obj, field, { get: () => lookup(t, key), set: v => { Object.defineProperty(obj, field, { value: v, writable: true, enumerable: true, configurable: true }); },
                enumerable: true, configurable: true });
        }
        return obj;
    }
    function loadFile(f) {
        if (f.st === "loading" || f.st === "ok") return;
        f.st = "loading";
        const xhr = new XMLHttpRequest();
        xhr.open("GET", f.url);
        xhr.overrideMimeType("text/plain; charset=utf-8");
        xhr.onload = () => { if (xhr.status < 400) applyText(f, xhr.responseText); else f.st = "error"; };
        xhr.onerror = () => { f.st = "error"; };
        xhr.send();
    }
    function loadAll() {
        started = true;
        for (const f of files.values()) loadFile(f);
    }
    // all files in: the waiting ones run once (before the title - before any game is set up)
    function textsReady() {
        for (const f of files.values()) {
            if (f.st === "error") { f.st = "new"; throw ["LoadError", f.url, () => loadFile(f)]; }
            if (f.st !== "ok") return false;
        }
        if (!textsIn) {
            textsIn = true;
            for (const fn of afterTexts.splice(0)) { try { fn(); } catch (e) { report("po tekstach", e); } }
        }
        return true;
    }
    function poTekstach(fn) {
        if (typeof fn !== "function") return;
        if (textsIn) { try { fn(); } catch (e) { report("po tekstach", e); } } else afterTexts.push(fn);
    }
    // (tests and tools: the words from a string instead of the file - the same object filled in place)
    function wczytaj(name, src) {
        teksty(name);
        const f = files.get(String(name));
        applyText(f, src);
        if (!textsIn) {
            let all = true;
            for (const g of files.values()) if (g.st !== "ok") all = false;
            if (all) textsReady();
        }
        return f.obj;
    }
    // every file read again from the disk while the game runs (F9 "Wczytaj teksty od nowa"): cb({ n, files, error, text, bad }) once
    // all came back - error: the first mistake with its file and line, or a file that could not be read (its old words stay)
    const plural = n => (n === 1 ? "plik" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "pliki" : "plików");
    let lastReload = null;
    function przeladuj(cb) {
        const list = Array.from(files.values()), res = { n: 0, files: list.length, error: "", missing: [] };
        let left = list.length;
        const done = () => {
            res.bad = !!(res.error || res.missing.length);
            res.text = res.error ? "Teksty: błąd - " + res.error : res.missing.length ? "Teksty: brak pliku " + res.missing[0] + " (zostały stare)"
                : "Teksty wczytane od nowa: " + res.n + " " + plural(res.n);
            lastReload = Object.assign({ day: has() ? day() : 0 }, res);
            T.emit("tekstyWczytane", res);
            if (typeof cb === "function") { try { cb(res); } catch (e) { report("przeladuj", e); } }
        };
        if (!left) { done(); return; }
        for (const f of list) {
            const xhr = new XMLHttpRequest();
            const back = ok => {
                if (ok) { applyText(f, xhr.responseText); res.n++; if (f.errors.length && !res.error) res.error = f.url.replace(DIR, "") + ", " + f.errors[0]; }
                else res.missing.push(f.url);
                if (!--left) done();
            };
            xhr.open("GET", f.url);
            xhr.overrideMimeType("text/plain; charset=utf-8");
            xhr.onload = () => back(xhr.status < 400);
            xhr.onerror = () => back(false);
            xhr.send();
        }
    }
    if (window.DataManager) {
        const _loadDatabase = DataManager.loadDatabase;
        DataManager.loadDatabase = function() {
            _loadDatabase.apply(this, arguments);
            loadAll();
        };
        const _isDatabaseLoaded = DataManager.isDatabaseLoaded;
        DataManager.isDatabaseLoaded = function() {
            if (!_isDatabaseLoaded.apply(this, arguments)) return false;
            return textsReady();
        };
    }
    // a key's value: "a.b.c" in a file's tree ({x} in the key: from vars - "again.{partia}")
    function lookup(obj, key, vars) {
        const path = fill(key, vars).split(".");
        let o = obj;
        for (const p of path) {
            if (o === null || o === undefined || typeof o !== "object") return undefined;
            o = o[p];
        }
        return o;
    }

    // ==================================================================
    // 2. Talks: the event commands (one builder for every thread)
    // ==================================================================
    // o.akapity: "\n" starts a new line (TownQuests); o.kto(key): the speaker of a "@key: text" line (TownQuests' residents);
    // o.twardaG: "5 G" kept on one line (TownQuests); o.szer: the line's width (46)
    const LINE = 46, PAGE = 3, HERO = { id: 0, name: "" };
    // o.px: the line's width in pixels as the message window shows it (Story.js's talks: 540) - measured with the game's font, \N[n]
    // as the actor's name, the words split on single spaces, an empty paragraph kept as an empty line (Story's own wrap, as it was)
    let probe = null;
    const shownNames = text => String(text).replace(/\\N\[(\d+)\]/gi, (m, n) => (window.$gameActors && $gameActors.actor(Number(n)) ? $gameActors.actor(Number(n)).name() : ""));
    function wrapPx(text, px) {
        if (!probe) probe = new Bitmap(8, 8);
        probe.fontFace = $gameSystem.mainFontFace();
        probe.fontSize = $gameSystem.mainFontSize();
        const lines = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const word of para.split(" ")) {
                const trial = line ? line + " " + word : word;
                if (line && probe.measureTextWidth(shownNames(trial)) > px) { lines.push(line); line = word; } else line = trial;
            }
            lines.push(line);
        }
        return lines;
    }
    function wrap(text, o) {
        if (o && o.px) return wrapPx(text, o.px);
        const out = [], width = (o && o.szer) || LINE;
        for (const para of o && o.akapity ? String(text).split("\n") : [String(text)]) {
            let line = "";
            for (const w of para.split(/\s+/)) {
                if (!w) continue;
                if (line && (line + " " + w).length > width) { out.push(line); line = w; } else line = line ? line + " " + w : w;
            }
            if (line) out.push(line);
        }
        return out;
    }
    function sayTo(out, spk, text, ind, o) {
        const lines = wrap(o && o.twardaG ? String(text).replace(/(\d) G\b/g, "$1 G") : text, o);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, [spk.twarz ? spk.twarz[0] : "", spk.twarz ? spk.twarz[1] : 0, 0, 2, spk.name || ""], ind));   // (twarz: [face, index] - Story's plain window)
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l], ind)));
        }
        return out;
    }
    function linesTo(out, spk, arr, vars, ind, o) {
        for (const raw of [].concat(arr === undefined || arr === null ? [] : arr)) {
            if (!raw) continue;
            const s = fill(raw, vars);
            if (s.startsWith("> ")) { sayTo(out, HERO, s.slice(2), ind, o); continue; }
            const m = o && o.kto ? /^@(\w+):\s*([\s\S]*)$/.exec(s) : null;
            if (m) sayTo(out, o.kto(m[1]) || spk, m[2], ind, o);
            else sayTo(out, spk, s, ind, o);
        }
        return out;
    }
    // labels + branches (each a list of commands at indent 0); cancel: the option Esc / P picks (-1: none)
    function choiceTo(out, labels, branches, cancel, ind) {
        const i0 = ind || 0;
        out.push(C(102, [labels, cancel === undefined ? labels.length - 1 : cancel, 0, 2, 0], i0));
        labels.forEach((l, i) => {
            out.push(C(402, [i, l], i0));
            for (const c of branches[i] || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + i0 + 1 }));
            out.push(C(0, [], i0 + 1));
        });
        out.push(C(404, [], i0));
        return out;
    }
    const script = (out, code, ind) => (out.push(C(355, [code], ind)), out);
    // a plain message, nobody's (the notes read, the cards, a post): a title line in \C[6] and the text wrapped at 52 ("\n": a new
    // line), four lines a window; o.spk: \SPK[n] before the first line (-1: no bubble - the window at the bottom)
    function plain(out, title, lines, o) {
        const all = (title ? ["\\C[6]" + title + "\\C[0]"] : []).concat(...[].concat(lines).map(l => wrap(l, { akapity: true, szer: 52 })));
        for (let i = 0; i < all.length; i += 4) {
            out.push(C(101, ["", 0, 0, 2, ""]));
            all.slice(i, i + 4).forEach((l, j) => out.push(C(401, [(o && o.spk !== undefined && i === 0 && j === 0 ? "\\SPK[" + o.spk + "]" : "") + l])));
        }
        return out;
    }
    // the commands as a child of the running event (the talk goes on in the same interpreter)
    // (no interpreter - a plugin's call from code, a test: the map's own interpreter runs them)
    function uruchom(interp, list) {
        if (!list || !list.length) return;
        if (!interp) { if (window.$gameMap && $gameMap._interpreter) $gameMap._interpreter.setup(list.concat([C(0, [])]), 0); return; }
        const ev = $gameMap.event(interp.eventId());
        interp.setupChild(list.concat([C(0, [])]), ev ? ev.eventId() : 0);
    }
    const mowa = { C, HERO, LINE, PAGE, fill, wrap, sayTo, linesTo, choiceTo, script, plain, uruchom };

    // ==================================================================
    // 3. Threads
    // ==================================================================
    const threads = new Map();
    const order = [];
    // the own records of the threads with no TownQuests quest (their journal source "watki") - the state only once such a thread is
    // registered (while the plugins load): a game without one keeps no "watki" in its saves
    let recDef = null;
    const defineRec = () => recDef || (recDef = T.state.define("watki", () => ({ w: {}, track: null }), { version: 1, owner: PLUGIN }));
    const recStore = () => defineRec()();
    const ownThreads = () => order.map(k => threads.get(k)).filter(w => !w.def.zadanie && !w.def.zadania && w.def.dziennik);

    function watek(def) {
        if (!def || !def.id) throw new Error("Watki.watek: wątek bez id");
        if (threads.has(def.id)) throw new Error("Watki.watek: wątek „" + def.id + "” już jest (" + threads.get(def.id).owner + ")");
        const w = makeThread(def);
        threads.set(def.id, w);
        order.push(def.id);
        if (!def.zadanie && !def.zadania && def.dziennik) { defineRec(); hookJournal(); }   // (the state and the journal's source "watki": only with such a thread)
        return w;
    }

    function makeThread(def) {
        const id = def.id, owner = def.wtyczka || id;
        const tx = teksty(def.teksty || id);
        const hooks = {};
        const say = Object.assign({}, def.mowa || {});
        const st = def.stan || null;
        const store = st ? T.state.define(st.klucz || id, st.domyslne || (() => ({})),
            Object.assign({ version: st.wersja || 1, owner }, st.migracje ? { migrate: st.migracje } : {}, st.adopt ? { adopt: st.adopt } : {})) : null;
        const S = () => (store ? store() : null);
        const missing = new Set();
        const w = { id, owner, def, tx, S, hooks };

        // ---------------------------------------------------------- the words
        function tekst(key, vars) {
            const v = lookup(tx, key, vars);
            if (v === undefined && !missing.has(key)) { missing.add(key); if (textsIn) console.error("[Watki] " + id + ": brak tekstu „" + fill(key, vars) + "” (js/teksty/" + (def.teksty || id) + ".txt)"); }
            return v;
        }
        // a [title, text] pair of a note / a notice
        const pair = (key, vars) => { const p = tekst(key, vars); return Array.isArray(p) ? [fill(p[0], vars), fill(p[1], vars)] : null; };
        // (a text that may be left out of the file - F9's header, description: no complaint)
        const tekstMoze = key => lookup(tx, key);

        // ---------------------------------------------------------- the hooks
        w.haki = obj => { Object.assign(hooks, obj || {}); bindQuest(); return w; };   // (the thread's plugin stands under TownQuests: its FX at once)
        function hook(name, ctx, args) {
            const f = hooks[name];
            if (typeof f !== "function") { if (!missing.has("hak:" + name)) { missing.add("hak:" + name); console.error("[Watki] " + id + ": brak haka „" + name + "”"); } return undefined; }
            return f.apply(w, [ctx || {}].concat(args || []));
        }
        w.hak = (name, ctx, ...args) => hook(name, ctx, args);

        // ---------------------------------------------------------- TownQuests (the record of the quest the chapters belong to)
        // def.zadanie: one quest whose steps the thread adds (W4: chapters 6-8); def.zadania: the thread's own quests, whole (a
        // package's K / D quests - the engine makes them and puts them into window.TownQuestsPacks); with neither: its own record
        const zids = () => (def.zadanie ? [def.zadanie] : Object.keys(def.zadania || {}));
        const quest = zid => { const q = TQ(), k = zid || zids()[0]; return q && q.Q && k ? q.Q[k] || null : null; };
        const qstate = () => { const q = TQ(); try { return q && q.state ? q.state() : null; } catch (e) { return null; } };
        const flags = () => { const s = qstate(); return (s && s.flags) || {}; };
        const flag = k => !!flags()[k];
        function setFlag(k) { const s = qstate(); if (s && s.flags && k && !s.flags[k]) s.flags[k] = day(); }
        const vcount = k => { const s = qstate(); return s && s.v ? s.v[k] || 0 : 0; };
        const vgive = (k, n) => { const s = qstate(); if (s && s.v) s.v[k] = (s.v[k] || 0) + (n || 1); };
        const vtake = (k, n) => { const s = qstate(); if (!s || !s.v) return; s.v[k] = Math.max(0, (s.v[k] || 0) - (n || 1)); if (!s.v[k]) delete s.v[k]; };
        const onQuests = () => zids().length > 0;
        const rec = zid => (zid || onQuests() ? (TQ() && TQ().rec ? TQ().rec(zid || zids()[0]) : null) : own());   // (a quest named: always TownQuests' record)
        const stepName = s => (s ? s.nazwa || s.talk || s.check || s.vars || "" : "");
        const steps = zid => { const q = quest(zid); return q ? q.steps : onQuests() ? [] : def.kroki || []; };
        // a step's place by its name: { zid, i } - in whichever of the thread's quests it is
        function where(name) {
            const find = z => steps(z).findIndex(s => stepName(s) === name || s.talk === name || s.check === name || s.vars === name);
            for (const z of zids()) { const i = find(z); if (i >= 0) return { zid: z, i }; }
            for (const k of def.obce || []) if (k.nazwa === name && k.zadanie) { const i = find(k.zadanie); if (i >= 0) return { zid: k.zadanie, i }; }
            if (!onQuests()) { const i = (def.kroki || []).findIndex(s => s.nazwa === name); if (i >= 0) return { zid: null, i }; }
            return null;
        }
        // the current step's name (of the quest zid; with several quests and no zid: the first active one's)
        function cur(zid) {
            if (!onQuests()) { const r = own(), list = def.kroki || []; return r && r.s === "active" && list[r.krok] ? list[r.krok].nazwa || "" : ""; }
            for (const z of zid ? [zid] : zids()) {
                const r = rec(z), list = steps(z);
                if (r && r.s === "active" && list[r.step]) return stepName(list[r.step]);
            }
            return "";
        }
        function atOne(name) {
            if (!onQuests()) return cur() === name;
            const p = where(name), r = p && rec(p.zid);
            return !!r && r.s === "active" && r.step === p.i;
        }
        const at = name => (Array.isArray(name) ? name.some(atOne) : atOne(name));
        const stepOf = name => { const p = where(name); return p ? p.i : -1; };
        const autoChecks = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); if (q && q.refreshMarkers) q.refreshMarkers(); };
        // the step done: TownQuests' completeStep (to a step by name; the reward; the notice) - only while that step is the current one
        function complete(names, o) {
            const name = [].concat(names).find(n => atOne(n));
            if (!name) return false;
            const opts = Object.assign({}, o || {});
            if (typeof opts.to === "string") opts.to = stepOf(opts.to);
            if (onQuests()) { const q = TQ(), p = where(name); if (q && q.completeStep && p) q.completeStep(p.zid, opts); }
            else ownNext(opts);
            return true;
        }
        Object.assign(w, { flags, flag, setFlag, vcount, vgive, vtake, qstate, rec, cur, at, stepOf, where, complete, autoChecks, tekst, tekstMoze, pair, quest, zadania: zids,
            ile: p => ile(S(), p), done: z => tqDone(z), active: z => tqActive(z) });

        // ---------------------------------------------------------- conditions (gdy)
        // a string: "nazwa" - a hook; "!..." - not; "flaga:x", "stan:a.b" (truthy) / "stan:a.b=wartość" (also != >= <= > <: numbers),
        // "ile:a.b>=3" (how many truthy values the object / list at a.b has - or the listed paths "ile:a+b+c"), "ctx:x" / "ctx:x=wartość",
        // "krok:nazwa" (the current chapter), "v:klucz" (a thing in the bag), "zrobione:K53" / "aktywne:K53" (a TownQuests quest),
        // "mapa:167" (the hero's map now); an array - all of them; an object: { nie }, { lub: [] }, { i: [] }, { hak, args },
        // { godziny: [a, b] }, { mapa: [ids] }
        const path = (o, p) => { let v = o; for (const k of String(p).split(".")) { if (v === null || v === undefined) return undefined; v = v[k]; } return v; };
        const eqv = (v, want) => String(v === undefined || v === null ? "" : v) === want;
        const OP_RE = /^([^<>=!]*)(>=|<=|!=|=|>|<)([\s\S]*)$/;
        // how many: an object's truthy values, a list's truthy elements; "a+b+c" - how many of these paths are truthy
        const ile = (o, p) => {
            if (String(p).includes("+")) return String(p).split("+").filter(x => !!path(o, x)).length;
            const v = path(o, p);
            if (Array.isArray(v)) return v.filter(Boolean).length;
            if (v && typeof v === "object") return Object.keys(v).filter(k => v[k]).length;
            return typeof v === "number" ? v : v ? 1 : 0;
        };
        function compare(v, op, want) {
            if (op === null) return !!v;
            const n = Number(want), num = want !== "" && !isNaN(n);
            if (op === "=") return eqv(v, want);
            if (op === "!=") return !eqv(v, want);
            const x = Number(v === undefined || v === null || v === false ? 0 : v === true ? 1 : v);
            if (!num) return false;
            return op === ">=" ? x >= n : op === "<=" ? x <= n : op === ">" ? x > n : x < n;
        }
        const tqDone = zid => { const q = TQ(); return !!(q && q.isDone && q.isDone(zid)); };
        const tqActive = zid => { const q = TQ(), r = q && q.rec ? q.rec(zid) : null; return !!r && r.s === "active"; };
        const mapNow = () => (window.$gameMap && $gameMap.mapId ? $gameMap.mapId() : 0);
        function ok(c, ctx) {
            ctx = ctx || {};
            if (c === undefined || c === null || c === true) return true;
            if (c === false) return false;
            if (Array.isArray(c)) return c.every(x => ok(x, ctx));
            if (typeof c === "string") {
                if (c[0] === "!") return !ok(c.slice(1), ctx);
                const i = c.indexOf(":");
                if (i < 0) return !!hook(c, ctx);
                const kind = c.slice(0, i), rest = c.slice(i + 1), m = OP_RE.exec(rest);
                const p = m ? m[1] : rest, op = m ? m[2] : null, want = m ? m[3] : null;
                if (kind === "flaga") return flag(rest);
                if (kind === "stan") return compare(path(S(), p), op, want);
                if (kind === "ile") return op === null ? ile(S(), p) > 0 : compare(ile(S(), p), op, want);
                if (kind === "ctx") return compare(path(ctx, p), op, want);
                if (kind === "krok") return at(rest);
                if (kind === "v") return op === null ? vcount(p) > 0 : compare(vcount(p), op, want);
                if (kind === "zrobione") return tqDone(rest);
                if (kind === "aktywne") return tqActive(rest);
                if (kind === "mapa") return mapNow() === Number(rest);
                console.error("[Watki] " + id + ": nie znam warunku „" + c + "”");
                return false;
            }
            if (c.nie !== undefined) return !ok(c.nie, ctx);
            if (c.lub) return c.lub.some(x => ok(x, ctx));
            if (c.i) return c.i.every(x => ok(x, ctx));
            if (c.hak) return !!hook(c.hak, ctx, c.args);
            if (c.godziny) return inHours(hour(), c.godziny);
            if (c.mapa) return [].concat(c.mapa).map(Number).includes(mapNow());
            console.error("[Watki] " + id + ": nie znam warunku", c);
            return false;
        }
        w.ok = ok;
        // a value in the data: "dzis" - today; { hak, args } - a hook's; { arg: i } - the action's i-th argument; { ctx: "x" };
        // { stan: "a.b" } - the state's; { ile: "a.b" | "a+b", najwyzej: n } - how many (see "ile:" above), at most n
        function val(v, ctx) {
            if (v === "dzis") return day();
            if (v && typeof v === "object" && !Array.isArray(v)) {
                if (v.hak) return hook(v.hak, ctx, v.args);
                if (v.arg !== undefined) return ctx && ctx.args ? ctx.args[v.arg] : undefined;
                if (v.ctx !== undefined) return path(ctx, v.ctx);
                if (v.stan !== undefined) return path(S(), v.stan);
                if (v.ile !== undefined) { const n = ile(S(), v.ile); return v.najwyzej !== undefined ? Math.min(v.najwyzej, n) : n; }
            }
            return v;
        }
        // the words of a step's text: a hook's name, or an object of values ({ n: { ile: "read" } })
        const wordsOf = (z, ctx) => (!z ? {} : typeof z === "string" ? hook(z, ctx) || {} : Object.fromEntries(Object.entries(z).map(([k, v]) => [k, val(v, ctx)])));

        // ---------------------------------------------------------- actions (zrob): one effect each, in order
        //   { gdy, zrob: [...] }   a block (gdy false: skipped)        { gdy, koniec: true }   the action ends here (gdy true)
        //   { stan: { pole: v } }  the thread's state ("a.b" deeper)   { flaga: "x" } / { flagi: [...] }   TownQuests' flags (not overwritten)
        //   { v: [klucz, n] }       a thing (TownQuests' v:)            { przedmiot: [id, n] }   an item into the bag
        //   { notatka: klucz }      a journal note ([title, text])      { ogloszenie: klucz, kolor }   the notice at the top ([title, sub])
        //   { info: klucz }         a popup over the hero               { mysl: klucz }   the hero's thoughts (bubbles, one by one)
        //   { xp: n, za }           experience                          { krok: nazwa | [nazwy], do: nazwa, nagroda }   the chapter done
        //   { hak: nazwa, args }    code                                { emit: nazwa, dane }   the bus     { sprawdz: true }   the quests' checks
        function reward(rw, ctx) {
            if (!rw) return rw;
            const out = {};
            for (const [k, v] of Object.entries(rw)) {
                if (k === "notatka") { const p = pair(val(v, ctx), ctx && ctx.vars); if (p) out.note = p; }
                else out[k] = val(v, ctx);
            }
            return out;
        }
        function wykonaj(list, ctx) {
            ctx = ctx || {};
            for (const a of [].concat(list === undefined || list === null ? [] : list)) {
                if (!a) continue;
                if (typeof a === "string") { hook(a, ctx); continue; }
                if (a.gdy !== undefined && !ok(a.gdy, ctx)) continue;
                if (a.koniec) return false;
                if (a.zrob) { if (wykonaj(a.zrob, ctx) === false) return false; }
                else if (a.stan) { const s = S(); for (const [k, v] of Object.entries(a.stan)) { const p = k.split("."), last = p.pop(); let o = s; for (const x of p) o = o[x] || (o[x] = {}); o[last] = val(v, ctx); } }
                else if (a.flaga) setFlag(val(a.flaga, ctx));
                else if (a.flagi) for (const k of a.flagi) setFlag(k);
                else if (a.v) vgive(a.v[0], a.v[1]);
                else if (a.przedmiot) { const it = window.$dataItems && $dataItems[a.przedmiot[0]]; if (it) $gameParty.gainItem(it, a.przedmiot[1] || 1); }
                else if (a.notatka) { const p = pair(val(a.notatka, ctx), vars(a, ctx)); if (p) T.call("Journal", "addNote", p[0], p[1]); }
                else if (a.ogloszenie) { const p = pair(val(a.ogloszenie, ctx), vars(a, ctx)); if (p) T.popup(p[0], { top: true, color: a.kolor || "#ffe27a", sub: p[1] }); }
                else if (a.info) { const t = tekst(val(a.info, ctx), vars(a, ctx)); if (t) T.popup(fill(t, vars(a, ctx)), { kind: "info" }); }
                else if (a.napis) {   // a popup of its own look: { napis: klucz, ikona, kolor, rodzaj, gora: true, pod: klucz }
                    const vs = vars(a, ctx), t = tekst(val(a.napis, ctx), vs), o = {};
                    if (a.ikona !== undefined) o.icon = val(a.ikona, ctx);
                    if (a.kolor) o.color = a.kolor;
                    if (a.rodzaj) o.kind = a.rodzaj;
                    if (a.gora) o.top = true;
                    if (a.pod) o.sub = fill(tekst(a.pod, vs) || "", vs);
                    if (t) T.popup(fill(t, vs), o);
                }
                else if (a.mysl) mysl(tekst(val(a.mysl, ctx), vars(a, ctx)));
                else if (a.xp) T.call("Combat", "gainXp", a.xp, a.za ? fill(a.za, vars(a, ctx)) : owner, true);
                else if (a.krok) complete(a.krok, { to: a.do, reward: reward(a.nagroda, ctx) });
                else if (a.hak) hook(a.hak, ctx, (a.args || []).map(x => val(x, ctx)));
                else if (a.emit) T.emit(a.emit, Object.assign({}, a.dane || {}));
                else if (a.sprawdz) autoChecks();
                else console.error("[Watki] " + id + ": nie znam akcji", a);
            }
            return true;
        }
        // the words of an entry: zmienne - a hook's name, { hak, args }, or an object of values (val: { ile }, { stan }, "dzis"...);
        // else the talk's own (ctx.vars)
        const vars = (e, ctx) => (e && e.zmienne ? (e.zmienne.hak ? hook(e.zmienne.hak, ctx, e.zmienne.args) : wordsOf(e.zmienne, ctx)) : ctx && ctx.vars);
        // a named action (def.akcje) - from a talk's script call or the plugin's code
        function akcja(name, args, interp) {
            const list = def.akcje && def.akcje[name];
            if (!list) { console.error("[Watki] " + id + ": brak akcji „" + name + "”"); return; }
            const ctx = { args: args || [], interp: interp || null };
            wykonaj(list, ctx);
            T.emit("watekAkcja", { watek: id, akcja: name, args: args || [] });
        }
        Object.assign(w, { wykonaj, akcja, val });

        // ---------------------------------------------------------- talks (def.rozmowy): a list of entries
        //   "klucz"                      the lines of the key (a string or a list) - said by the one spoken to, "> " by the hero
        //   { mow: klucz, zmienne, kto }  the same with words filled in ({...}: a hook's object) / kto: "bohater"
        //   { losowo: klucz }             one line of the list, at random
        //   { hak: nazwa, args }          lines from code (an array of strings)
        //   { gdy, ... }                  only when the condition holds; with koniec: true - the list ends after this entry
        //   { jesli, to: [...], inaczej: [...] }
        //   { rozmowa: nazwa, ustaw: { k: v } }   another talk of the thread (ustaw: more of the context - ctx.k)
        //   { wybor: [{ etykieta: klucz, gdy, tresc: [...] }], anuluj: n | -1 | "ostatnia" }
        //   { zrob: akcja, args }         the script call Watki.act(this, [id, akcja, ...args]) at this point (args: values, hooks)
        //   { skrypt: "kod" }             a script call of the plugin's own (e.g. Kasztelan.grateDown(this))
        function speakerOf(e, ctx) { return e && e.kto === "bohater" ? HERO : ctx.spk || HERO; }
        // (a key with {x}: x from the talk's words or its context - "again.{partia}")
        const kv = ctx => Object.assign({}, ctx.vars || {}, ctx);
        function build(entries, ctx, out) {
            out = out || [];
            for (const e of [].concat(entries === undefined || entries === null ? [] : entries)) {
                if (e === null || e === undefined) continue;
                if (typeof e === "string") { linesTo(out, speakerOf(null, ctx), tekst(e, kv(ctx)), ctx.vars, 0, say); continue; }
                if (e.gdy !== undefined && !ok(e.gdy, ctx)) continue;
                const vs = vars(e, ctx);
                if (e.mow) linesTo(out, speakerOf(e, ctx), tekst(e.mow, kv(ctx)), vs, 0, say);
                else if (e.losowo) { const l = tekst(e.losowo, kv(ctx)); if (l && l.length) linesTo(out, speakerOf(e, ctx), [pick([].concat(l))], vs, 0, say); }
                else if (e.hak) { const r = hook(e.hak, ctx, e.args); if (Array.isArray(r)) linesTo(out, speakerOf(e, ctx), r, vs, 0, say); }
                else if (e.jesli !== undefined) build(ok(e.jesli, ctx) ? e.to : e.inaczej, ctx, out);
                else if (e.rozmowa) {
                    const sub = Object.assign({}, ctx);
                    for (const [k, v] of Object.entries(e.ustaw || {})) sub[k] = val(v, ctx);
                    build(def.rozmowy && def.rozmowy[e.rozmowa], sub, out);
                } else if (e.wybor) {
                    const opts = e.wybor.filter(o => ok(o.gdy, ctx));
                    const labels = opts.map(o => fill(tekst(o.etykieta, kv(ctx)), vs));
                    const branches = opts.map(o => build(o.tresc, ctx, []));
                    const cancel = e.anuluj === undefined || e.anuluj === "ostatnia" ? labels.length - 1 : e.anuluj;
                    choiceTo(out, labels, branches, cancel);
                } else if (e.zrob) script(out, "Watki.act(this, " + JSON.stringify([id, e.zrob].concat((e.args || []).map(x => val(x, ctx)))) + ")");
                else if (e.skrypt) script(out, e.skrypt);
                else if (e.polecenie !== undefined) out.push(C(e.polecenie, (e.parametry || []).slice()));   // (a raw command: 221 fade out, 222 in...)
                if (e.koniec) break;
            }
            return out;
        }
        // a talk by name (ctx: { spk: { id, name }, ev, key, vars, ... }) -> the commands
        function rozmowa(name, ctx) {
            const list = def.rozmowy && def.rozmowy[name];
            if (!list) { console.error("[Watki] " + id + ": brak rozmowy „" + name + "”"); return []; }
            return build(list, ctx || {}, []);
        }
        const linie = (out, spk, keyOrList, vs) => linesTo(out, spk || HERO, typeof keyOrList === "string" ? tekst(keyOrList, vs) : keyOrList, vs, 0, say);
        Object.assign(w, { rozmowa, build, linie, uruchom, mowa });

        // ---------------------------------------------------------- the hero's thoughts (bubbles over him, one by one)
        const M = Object.assign({ klatki: 230, odstep: 240, czekaj: true }, def.mysli || {});
        const thoughts = [];
        let thoughtAt = 0;
        function mysl(lines, whoCh) {
            for (const l of [].concat(lines || [])) if (l) thoughts.push({ who: /^> /.test(l) ? null : whoCh || null, text: String(l).replace(/^> /, "") });
        }
        function thoughtsTick() {
            if (!thoughts.length || Graphics.frameCount < thoughtAt || !(SceneManager._scene instanceof Scene_Map)) return;
            // czekaj: true - not while an event or a message runs; "wiadomosc" - only not while a message is shown
            if (M.czekaj === "wiadomosc" ? $gameMessage.isBusy() : M.czekaj && ($gameMap.isEventRunning() || $gameMessage.isBusy())) return;
            const t = thoughts.shift(), sb = SB();
            const ch = t.who && t.who.eventId && $gameMap.event(t.who.eventId()) === t.who ? t.who : $gamePlayer;
            if (sb && sb.say) sb.say(ch, t.text, M.klatki); else T.popup(t.text, { color: "#eceef0" });
            thoughtAt = Graphics.frameCount + M.odstep;
        }
        const thoughtsReset = () => { thoughts.length = 0; thoughtAt = 0; };
        Object.assign(w, { mysl, thoughtsTick, thoughtsReset, mysli: () => thoughts.slice() });

        // ---------------------------------------------------------- the chapters as TownQuests steps
        // def.kroki: [{ nazwa, indeks, ch, tekst (key), gotowe (a condition: the step done by itself), zmienne (a hook: the words of the
        // step's text), nagroda, nagrodaFx: { nazwa, hak }, rozmowy: [{ kto, gdy, tresc }] (the residents / Story's people: TownQuests
        // asks them), temat: { kto: "borgar", etykieta, gdy, gotowy, tresc } (a topic at Borgar's bar) }] - in the quest's steps at
        // `indeks` (an old save's step number stays its step); the handlers go into TownQuests.FX under the step's name.
        // haki: { hand: "nazwaHaka", tick, enter, blocked, post, reward, spot, wanted, ch, say, act, ... } - TownQuests' other handlers
        // of the step, each a hook (ctx { w, q, r, st }, then TownQuests' own arguments); the step's field that names them is set
        // (hand / post -> fx, tick / enter -> tick, blocked -> guard...). Any other field of a krok is TownQuests' own (type, to,
        // need, say, done, remind, early, choice, deadline, end, hours...) and goes to the step as it is.
        // obcy: "watek" (2026-10-29) - a step of this thread's quest whose handlers another thread gives (its `obce`: W2's rozdz. 7 is
        // Pustelnia's) - its handler fields stay as written (talk / tick / vars...), this thread binds nothing under its name
        // pola: { NAZWA: wartość } (2026-10-29) - plain values on the handler's FX entry besides the hooks (K16's GOODS: others read it)
        const KROK = new Set(["nazwa", "indeks", "tekst", "gotowe", "zmienne", "nagroda", "nagrodaFx", "rozmowy", "temat", "typ", "haki", "obcy", "pola"]);
        const SLOT = { hand: "fx", post: "fx", tick: "tick", enter: "tick", blocked: "guard", reward: "rewardFx", spot: "spotFx", wanted: "spotFx", ch: "chFx", say: "sayFx",
            talk: "talk", ready: "talk", topic: "talk", topicList: "talk", borgarTopic: "talk", borgarList: "talk", check: "check", vars: "vars" };
        function stepData(k) {
            const s = {};
            for (const [f, v] of Object.entries(k)) if (!KROK.has(f)) s[f] = v;
            s.type = k.typ || k.type || "custom";
            s.nazwa = k.nazwa;
            if (k.rozmowy || k.temat) s.talk = k.nazwa;
            if (k.gotowe !== undefined) s.check = k.nazwa;
            if (k.zmienne) s.vars = k.nazwa;
            for (const f of Object.keys(k.haki || {})) if (SLOT[f]) s[SLOT[f]] = k.nazwa;
            if (k.nagrodaFx) s.rewardFx = k.nagrodaFx.nazwa;
            if (k.nagroda) s.reward = Object.assign({}, k.nagroda);
            return s;
        }
        function fxOf(k) {
            const fx = Object.assign({}, k.pola || {});
            const ctxOf = (q, r, st, extra) => Object.assign({ w, q, r, st }, extra || {});
            if (k.zmienne) fx.vars = (q, r) => wordsOf(k.zmienne, ctxOf(q, r)) || {};
            if (k.gotowe !== undefined) fx.check = (q, r, st) => ok(k.gotowe, ctxOf(q, r, st));
            if (k.rozmowy) {
                // { kto, gdy, tresc, gotowa: false (said, but the step not ready: TownQuests' { ready: false }), znacznik (one more
                // condition for the marker over the head) }
                fx.talk = (q, r, st, key, spk) => {
                    for (const e of k.rozmowy) {
                        if (!whoIs(e.kto, key)) continue;
                        const ctx = ctxOf(q, r, st, { key, spk });
                        if (!ok(e.gdy, ctx)) continue;
                        return { ready: e.gotowa !== false, list: build(e.tresc, ctx, []) };
                    }
                    return null;
                };
                fx.ready = (q, r, st, key) => {
                    const mine = k.rozmowy.filter(e => whoIs(e.kto, key));
                    if (!mine.length) return k.temat && whoIs(k.temat.kto, key) ? topicReady(k.temat, ctxOf(q, r, st, { key })) : null;
                    return mine.some(e => e.gotowa !== false && ok(e.gdy, ctxOf(q, r, st, { key })) && ok(e.znacznik, ctxOf(q, r, st, { key })));
                };
            }
            if (k.temat) {
                const t = k.temat, topic = (q, r, st) => (ok(t.gdy, ctxOf(q, r, st)) ? tekst(t.etykieta) || null : null);
                if (t.kto === "borgar") {
                    fx.borgarTopic = topic;
                    fx.borgarList = (q, r, st, spk) => (ok(t.gdy, ctxOf(q, r, st, { spk })) ? build(t.tresc, ctxOf(q, r, st, { spk, key: "borgar" }), []) : []);
                } else {
                    fx.topic = (q, r, st, key) => (whoIs(t.kto, key) ? topic(q, r, st) : null);
                    fx.topicList = (q, r, st, key, spk) => (whoIs(t.kto, key) && ok(t.gdy, ctxOf(q, r, st, { spk, key })) ? build(t.tresc, ctxOf(q, r, st, { spk, key }), []) : null);
                }
                if (!fx.ready) fx.ready = (q, r, st, key) => (whoIs(t.kto, key) ? topicReady(t, ctxOf(q, r, st, { key })) : null);
            }
            // (the hooks last: they may take over what the talks made - a step's own ready)
            for (const [f, h] of Object.entries(k.haki || {})) fx[f] = (...a) => hook(h, ctxOf(a[0], a[1], a[2]), a);
            return fx;
        }
        const whoIs = (kto, key) => (Array.isArray(kto) ? kto.includes(key) : kto === key);
        const topicReady = (t, ctx) => !!ok(t.gotowy !== undefined ? t.gotowy : t.gdy, ctx);
        // ---------------------------------------------------------- the thread's own quests (def.zadania: a package's K / D quests)
        // { K53: { kind, giver, icon, offer, reward, repeat, ... (TownQuests' fields, as they are), kroki: [...] (the steps, in order),
        //   start: a condition (the quest starts by itself: TownQuests' autoStart - its name: autoStart or "k53Start"),
        //   oferta: a condition (the offer's cond.fn - its name: offer.cond.fn or "k53Oferta") } } - made while the plugin loads, put
        // into window.TownQuestsPacks with def.paczka ({ remarks, gossip, spots, vitems }) - the data plugin stands above
        // TownQuests_Data; their words: the thread's file under "zadania.<id>" (Watki.scal, as before)
        const startName = zid => { const z = def.zadania[zid]; return z.autoStart || zid.charAt(0).toLowerCase() + zid.slice(1) + "Start"; };
        const offerName = zid => { const z = def.zadania[zid]; return (z.offer && z.offer.cond && z.offer.cond.fn) || zid.charAt(0).toLowerCase() + zid.slice(1) + "Oferta"; };
        const made = {};
        function makeQuests() {
            if (!def.zadania) return;
            const ZQ = new Set(["kroki", "start", "oferta", "teksty"]);
            for (const [zid, z] of Object.entries(def.zadania)) {
                const q = { id: zid };
                for (const [f, v] of Object.entries(z)) if (!ZQ.has(f)) q[f] = v;
                q.steps = (z.kroki || []).map(stepData);
                if (z.start !== undefined) q.autoStart = startName(zid);
                if (z.oferta !== undefined) q.offer = Object.assign({}, q.offer, { cond: Object.assign({}, q.offer && q.offer.cond, { fn: offerName(zid) }) });
                made[zid] = q;
                if (def.tekstyZadan !== false) scal(q, z.teksty || def.teksty || id, "zadania." + zid);   // (a quest's own file: z.teksty)
            }
            // (paczka: false - the quests go into the list by their owner's hand: TownQuests_Data's own, at their places)
            if (def.paczka === false) return;
            const pack = Object.assign({ owner }, def.paczka || {}, { quests: Object.values(made) });
            (window.TownQuestsPacks = window.TownQuestsPacks || []).push(pack);
        }
        w.Q = made;
        // def.obce: [{ zadanie: "W2", nazwa: "w2Pytanie", gotowe, zmienne, rozmowy, haki... }] - the handlers of a step of someone
        // else's quest (its fields stay where they are - TownQuests_Data.js names the step's handlers by this name)
        const bindFx = (q, k) => {
            q.FX[k.nazwa] = fxOf(k);
            if (k.nagrodaFx) q.FX[k.nagrodaFx.nazwa] = { reward: (qq, r, st) => reward(hook(k.nagrodaFx.hak, { w, q: qq, r, st }), { r }) };
        };
        let bound = false;
        function bindQuest() {
            if (bound) return bound;
            if (def.zadania || def.obce) {
                const q = TQ();
                if (!q || !q.FX) return false;
                for (const [zid, z] of Object.entries(def.zadania || {})) {
                    if (q.Q && q.Q[zid] && q.Q[zid] !== made[zid]) console.error("[Watki] " + id + ": zadanie " + zid + " ma już ktoś inny");
                    // (a thread under TownQuests - Homes' D21: its pack came too late for TownQuests_Data - the quest goes in at once)
                    else if (q.Q && !q.Q[zid] && Array.isArray(q.QUESTS)) { q.QUESTS.push(made[zid]); q.Q[zid] = made[zid]; }
                    for (const k of z.kroki || []) if (!k.obcy) bindFx(q, k);
                    if (z.start !== undefined) q.FX[startName(zid)] = () => has() && ok(z.start, { w, zid });
                    if (z.oferta !== undefined) q.FX[offerName(zid)] = { cond: () => has() && ok(z.oferta, { w, zid }) };
                }
                for (const k of def.obce || []) bindFx(q, k);
                if (!def.zadanie) { bound = true; return true; }
            }
            if (!def.zadanie || !def.kroki) return bound;
            const q = TQ(), Q = quest();
            if (!q || !q.FX || !Q) return false;
            bound = true;
            for (const k of def.kroki) {
                const i = Q.steps.findIndex(s => stepName(s) === k.nazwa);
                let s = stepData(k);
                if (i >= 0) { s = Object.assign(Q.steps[i], s); if (k.indeks !== undefined && i !== k.indeks) console.error("[Watki] " + id + ": krok " + k.nazwa + " stoi na " + i + ", a ma na " + k.indeks); }
                else if (k.indeks === undefined || Q.steps.length === k.indeks) Q.steps.push(s);
                else console.error("[Watki] " + id + ": " + def.zadanie + " ma " + Q.steps.length + " kroków - krok " + k.nazwa + " ma stać na " + k.indeks + " (stare zapisy!)");
                // (the step's text read from the words each time - the journal, the notices: what the file says now)
                const key = k.tekst || "kroki." + k.nazwa;
                Object.defineProperty(s, "text", { get: () => { const v = tekst(key); return typeof v === "string" ? v : ""; }, enumerable: true, configurable: true });
                q.FX[k.nazwa] = fxOf(k);
                if (k.nagrodaFx) q.FX[k.nagrodaFx.nazwa] = { reward: (qq, r, st) => reward(hook(k.nagrodaFx.hak, { w, q: qq, r, st }), { r }) };
            }
            return true;
        }
        w.bindQuest = bindQuest;

        // ---------------------------------------------------------- own records (a thread with no TownQuests quest)
        // a krok of an own record: { nazwa, tytul (its title: the journal's heading, the goal window's line, the list of what is done),
        // tekst (the words: a key, { klucz, zmienne }, { hak }, { jesli, to, inaczej } - default "kroki.<nazwa>"), gotowe (done by
        // itself), pomin (a condition: the step is passed over, not done - another way of the chapter), gdzie (the compass: { person } |
        // { map, name } | { hak }), licznik (a hook: { have, need, unit } - the goal window's bar), prowadzi (a condition: with
        // dziennik.prowadzi the thread leads the goal window by itself while nothing is pinned by hand), nagroda ({ xp, za, gold, ... }) }
        function own() { if (!has()) return null; const s = recStore(); return s.w[id] || null; }
        // the words of a spec: a key | { klucz, zmienne } | { hak, args } | { jesli, to, inaczej }
        function slowa(spec, ctx) {
            if (spec === undefined || spec === null) return "";
            if (typeof spec === "string") { const v = tekst(spec); return typeof v === "string" ? v : ""; }
            if (spec.jesli !== undefined) return slowa(ok(spec.jesli, ctx) ? spec.to : spec.inaczej, ctx);
            if (spec.klucz) return fill(tekst(spec.klucz) || "", wordsOf(spec.zmienne, ctx));
            if (spec.hak) { const v = hook(spec.hak, ctx || {}, spec.args); return v === undefined || v === null ? "" : String(v); }
            return "";
        }
        const krokOf = r => (r ? (def.kroki || [])[r.krok] : null);
        const stepTitle = k => (k && k.tytul !== undefined ? slowa(k.tytul, { w }) : "");
        function ownStart(step) {
            if (onQuests() || !has()) return false;
            const s = recStore(), k = Math.max(0, typeof step === "string" ? stepOf(step) : step || 0);
            s.w[id] = { s: "active", krok: k, dzien: day(), sday: day(), sh: hour(), t: { done: {} } };
            const d = def.dziennik || {};
            // (dogon: what the game shows done already - an older save's chapter - is marked done at once, quietly: no reward, no notice;
            // the day it was done from a hook of the thread when it knows it: dziennik.dzienKroku)
            if (d.dogon && !(typeof step === "number" && step > 0)) catchUp();
            if (d.tytul && !(def.cicho && def.cicho.start)) T.popup("Nowy wątek: " + (tekst(d.tytul) || id), { top: true, color: "#ffe27a", sub: stepTitle(krokOf(own())) || stepText() });
            T.emit("watekStart", { watek: id, krok: s.w[id].krok });
            return true;
        }
        function catchUp() {
            const r = own(), list = def.kroki || [], d = def.dziennik || {};
            if (!r) return;
            for (let guard = 0; guard < list.length + 1 && r.s === "active"; guard++) {
                const k = list[r.krok];
                if (!k) break;
                if (k.pomin !== undefined && ok(k.pomin, { w, r })) { r.krok++; continue; }
                if (k.gotowe === undefined || !ok(k.gotowe, { w, r })) break;
                const when = d.dzienKroku ? hook(d.dzienKroku, { w, r }, [k.nazwa]) : undefined;
                r.t.done[r.krok] = typeof when === "number" && when > 0 ? when : day();
                r.krok++;
            }
            if (r.krok >= list.length) { r.s = "done"; r.end = day(); }
        }
        function ownNext(o) {
            const r = own();
            if (!r || r.s !== "active") return;
            const list = def.kroki || [], k = list[r.krok];
            r.t.done[r.krok] = day();
            const rw = reward(k && k.nagroda, {});
            if (rw) giveOwn(rw);
            if (o && o.reward) giveOwn(o.reward);
            let to = o && o.to !== undefined && o.to >= 0 ? o.to : r.krok + 1;
            while (to < list.length && list[to].pomin !== undefined && ok(list[to].pomin, { w, r })) to++;   // (another way of the chapter)
            if (to >= list.length || (k && k.koniec)) return ownFinish();
            r.krok = to; r.sday = day(); r.sh = hour();
            T.emit("watekKrok", { watek: id, krok: to });
            const d = def.dziennik || {};
            T.popup(tekst(d.tytul) || id, { top: true, color: "#ffe27a", sub: stepTitle(list[to]) || stepText() });
        }
        function giveOwn(rw) {
            if (rw.xp) T.call("Combat", "gainXp", rw.xp, rw.za || owner, true);
            if (rw.gold) $gameParty.gainGold(rw.gold);
            if (rw.note) T.call("Journal", "addNote", rw.note[0], rw.note[1]);
            if (rw.flag) setFlag(rw.flag);
        }
        function ownFinish() {
            const r = own();
            if (!r) return;
            r.s = "done"; r.end = day();
            if (recStore().track === id) recStore().track = null;
            const d = def.dziennik || {};
            if (d.nagroda) giveOwn(reward(d.nagroda, {}));
            T.popup("Wątek: " + (tekst(d.tytul) || id), { top: true, color: "#9ff0a8", sub: "Wykonane" });
            T.emit("watekKoniec", { watek: id });
        }
        function stepText() {
            const r = rec(), list = steps();
            if (!r || !list) return "";
            const k = onQuests() ? list[r.step] : list[r.krok];
            return k ? krokText(k, r) : "";
        }
        function krokText(k, r) {
            if (onQuests()) return k.text ? fill(k.text, null) : "";
            if (k.tekst && typeof k.tekst === "object") return slowa(k.tekst, { w, r });
            const t = tekst(k.tekst || "kroki." + k.nazwa);
            const vs = k.zmienne ? wordsOf(k.zmienne, { w, r }) : null;
            return t ? fill(t, vs) : "";
        }
        // the own records' checks: autoStart (dziennik.start: a condition) and gotowe of the current step (pomin: passed over)
        function ownChecks() {
            if (onQuests() || !has()) return;
            const r = own();
            if (!r) { if (def.start !== undefined && ok(def.start, { w })) ownStart(0); return; }
            for (let guard = 0; guard < 8 && r.s === "active"; guard++) {
                const list = def.kroki || [], k = list[r.krok];
                if (k && k.pomin !== undefined && ok(k.pomin, { w, r })) {
                    let to = r.krok + 1;
                    while (to < list.length && list[to].pomin !== undefined && ok(list[to].pomin, { w, r })) to++;
                    if (to >= list.length) { ownFinish(); break; }
                    r.krok = to; r.sday = day(); r.sh = hour();
                    continue;
                }
                if (!k || k.gotowe === undefined || !ok(k.gotowe, { w, r })) break;
                ownNext({});
            }
        }
        // the goal window: does the thread lead by itself now (nothing pinned by hand - Watki's tracker source asks)
        function leads() {
            const r = own(), d = def.dziennik || {};
            if (!d.prowadzi || !r || r.s !== "active") return false;
            const k = krokOf(r);
            return !!k && (k.prowadzi === undefined || !!ok(k.prowadzi, { w, r }));
        }
        // the compass's place and the bar of the current step
        const krokWhere = k => (!k || !k.gdzie ? null : k.gdzie.hak ? hook(k.gdzie.hak, { w }, k.gdzie.args) || null : k.gdzie);
        const krokCount = k => (k && k.licznik ? hook(k.licznik, { w }) || null : null);
        Object.assign(w, { start: ownStart, next: ownNext, finish: ownFinish, stepText, stepTitle: () => stepTitle(krokOf(own())), krokText, slowa, ownChecks, leads,
            krokWhere, krokCount, catchUp });

        // ---------------------------------------------------------- F9: straight to a chapter (def.skoki)
        // { wymaga: a condition (else the jump says no), przed: [actions of every jump], lista: { 1: { ch, krok: index | name, godzina,
        //   idz: [map, x, y, dir], zrob: [actions] }, ... } }
        function skocz(i) {
            const sk = def.skoki, j = sk && sk.lista ? sk.lista[i] : null;
            if (!j || !has()) return null;
            const ctx = { w, skok: Number(i), j };
            if (!ok(sk.wymaga, ctx)) return null;
            if (onQuests() && !TQ()) return null;
            if (wykonaj(sk.przed, ctx) === false) return null;
            const zid = j.zadanie || (typeof j.krok === "string" && where(j.krok) ? where(j.krok).zid : zids()[0]);
            const idx = typeof j.krok === "string" ? stepOf(j.krok) : j.krok;
            if (idx < 0) return null;
            if (wykonaj(j.zrob, ctx) === false) return null;
            if (onQuests()) {
                const q = TQ(), r = q.rec(zid);
                if (!r || r.s !== "active") q.start(zid, idx);
                else { r.step = idx; r.sday = day(); }
            } else {
                const r = own();
                if (!r || r.s !== "active") ownStart(idx);
                else { r.krok = idx; r.sday = day(); }
            }
            if (j.godzina !== undefined) $gameSystem.setDayNightHour(j.godzina);
            const q = TQ();
            if (q && q.refreshMarkers) q.refreshMarkers();
            return j.idz || null;
        }
        // (the chapter's name in the words: <f9.nazwy>.<jump> - by default "f9.nazwy.N"; a file whose "f9" is a word of its own names
        // another key: Dwor_Data "f9names", Kantor_Data "f9Nazwy")
        const skokNazwa = i => { const v = lookup(tx, ((def.f9 && def.f9.nazwy) || "f9.nazwy") + "." + i); return v === undefined ? "" : v; };
        Object.assign(w, { skocz, skokNazwa });

        makeQuests();
        bindQuest();
        return w;
    }

    // ------------------------------------------------------------------
    // The script calls of the talks: Watki.act(this, [id, akcja, ...args])
    // ------------------------------------------------------------------
    function act(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const w = threads.get(args[0]);
        if (!w) { console.error("[Watki] act: nie ma wątku „" + args[0] + "”"); return; }
        try { w.akcja(args[1], args.slice(2), interp); } catch (e) { report("act " + JSON.stringify(args), e); }
    }

    // ------------------------------------------------------------------
    // The frame: the thoughts of every thread; the own records' checks; the late binding to TownQuests
    // ------------------------------------------------------------------
    T.onMapUpdate((scene, n) => {
        if (!has()) return;
        for (const w of threads.values()) {
            try { w.thoughtsTick(); } catch (e) { report("myśli " + w.id, e); }
        }
        if (n % 60) return;
        for (const w of ownThreads()) { try { w.ownChecks(); } catch (e) { report("sprawdzanie " + w.id, e); } }
    }, { owner: PLUGIN, name: "watki" });
    T.on("load", () => { for (const w of threads.values()) w.thoughtsReset(); }, { owner: PLUGIN });
    T.on("newGame", () => { for (const w of threads.values()) w.thoughtsReset(); }, { owner: PLUGIN });
    T.on("mapReady", () => { for (const w of threads.values()) w.bindQuest(); }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The journal: the threads with their own records (no TownQuests quest) - FABUŁA / POBOCZNE / UKOŃCZONE, one pinned
    // ------------------------------------------------------------------
    function journalRows() {
        if (!has()) return [];
        const out = [], s = recStore();
        for (const w of ownThreads()) {
            const r = s.w[w.id], d = w.def.dziennik;
            if (!r) continue;
            const k = (w.def.kroki || [])[r.krok];
            if (r.s === "active") out.push({ id: "watek:" + w.id, watek: w.id, group: d.grupa || "story", label: w.tekst(d.tytul) || w.id, icon: d.ikona || 0,
                mark: s.track === w.id ? "pin" : "todo", right: k && k.ch ? "rozdz. " + k.ch : "" });
            else out.push({ id: "watek:" + w.id, watek: w.id, group: "done", label: w.tekst(d.tytul) || w.id, icon: d.ikona || 0, mark: "done", dim: true, day: r.end, right: "dz. " + r.end });
        }
        return out;
    }
    function journalDetail(it) {
        const w = it && threads.get(it.watek);
        if (!w) return [];
        const d = w.def.dziennik, r = w.rec(), ops = [{ k: "title", text: w.tekst(d.tytul) || w.id, icon: d.ikona || 0 },
            { k: "sub", text: "Wątek" + (r ? "  ·  od dnia " + r.dzien : "") }, { k: "rule" }];
        if (d.opis) ops.push({ k: "p", text: w.tekst(d.opis) || "" });
        if (r && r.s === "active") {
            const k = (w.def.kroki || [])[r.krok], title = w.stepTitle();
            ops.push({ k: "gap", n: 8 }, { k: "h", text: title || (k && k.ch ? "Rozdział " + k.ch : "Teraz") }, { k: "p", text: w.stepText() });
            const cnt = w.krokCount(k);
            if (cnt && cnt.need > 0) ops.push({ k: "gap", n: 4 }, { k: "bar", ratio: Math.min(1, (cnt.have || 0) / cnt.need), text: (cnt.have || 0) + " / " + cnt.need + (cnt.unit ? " " + cnt.unit : "") });
            const done = Object.keys(r.t.done || {}).map(Number).sort((a, b) => a - b);
            if (done.length) {
                ops.push({ k: "gap", n: 6 }, { k: "h", text: "Zrobione" });
                for (const i of done) {
                    const kk = w.def.kroki[i];
                    if (!kk) continue;
                    const t = kk.tytul !== undefined ? w.slowa(kk.tytul, { w }) : fill(w.krokText(kk, r), {}).split(/(?<=[.!?])\s/)[0];
                    if (t) ops.push({ k: "muted", text: "✓ " + t + (kk.tytul !== undefined ? "  ·  dz. " + r.t.done[i] : "") });
                }
            }
        } else if (r) ops.push({ k: "gap", n: 8 }, { k: "p", text: "Wykonane w dniu " + r.end + "." });
        return ops;
    }
    // the goal window's row of a thread (pinned, or leading by itself)
    function trackerRow(w, r) {
        const k = (w.def.kroki || [])[r.krok], title = w.stepTitle(), line = title || w.stepText().split(/(?<=[.!?])\s/)[0];
        const row = { label: "WĄTEK", title: w.tekst(w.def.dziennik.tytul) || w.id, line, sub: line, needs: [], key: "watek|" + w.id + "|" + r.krok, source: "watki", id: w.id,
            icon: w.def.dziennik.ikona || 0 };
        const where = w.krokWhere(k), cnt = w.krokCount(k);
        if (where) row.where = where;
        if (cnt) row.count = cnt;
        return row;
    }
    function hookJournal() {
        const J = T.api("Journal");
        if (!J || hookJournal.done) return;
        hookJournal.done = true;
        if (J.addQuestSource) J.addQuestSource({
            name: "watki",
            items: () => journalRows(),
            detail: it => journalDetail(it),
            canPin: it => { const w = it && threads.get(it.watek), r = w && w.rec(); return !!(r && r.s === "active"); },
            pinned: () => (has() && recStore().track ? "watek:" + recStore().track : null),   // (the rows' own ids: OK on the pinned row unpins it)
            pin: wid => { if (has()) recStore().track = wid && threads.has(String(wid).replace(/^watek:/, "")) ? String(wid).replace(/^watek:/, "") : null; }
        });
        if (J.addTrackerSource) {
            // a thread pinned by hand
            J.addTrackerSource(() => {
                if (!has()) return null;
                const s = recStore(), w = s.track ? threads.get(s.track) : null, r = w && w.rec();
                if (w && (!r || r.s !== "active")) { s.track = null; return null; }
                return w && r ? trackerRow(w, r) : null;
            });
            // a thread that leads by itself (Story's chapter 1) - asked only when no other source has a line, before the journal's goal
            // (Journal's fallback), and only while nothing is pinned by hand
            J.addTrackerSource(() => {
                if (!has()) return null;
                let other = null;
                try { other = J.pinnedNow ? J.pinnedNow() : null; } catch (e) { other = null; }
                if (other) return null;
                const w = ownThreads().find(x => x.leads()), r = w && w.rec();
                return w && r ? trackerRow(w, r) : null;
            }, { fallback: true });
        }
    }

    // ------------------------------------------------------------------
    // F9 (Debug.js): one section per thread - its chapter jumps (def.skoki: ←→ the chapter, OK goes there) and / or rows of its own
    // ------------------------------------------------------------------
    // def.f9: { rodzaj (the jump row's kind), ikona; the keys of the words - naglowek, etykieta, opis, brak, nazwy (the chapters'
    // names <nazwy>.<jump>) - by default "f9.naglowek", "f9.etykieta", "f9.opis", "f9.brak", "f9.nazwy"; (2026-10-29) zakladka: "wyspa"
    // ("Wyspa i fabuła", the default - a header and the rows with their descriptions) | "zdarzenia" (the first tab: the rows only);
    // kolejnosc: the sections without it first, as the plugins come, then by it (W5 5, W7 7, W9 9); wiersze / wybierz / ok - below }
    const f9Last = {};
    const f9Keys = w => Object.keys((w.def.skoki && w.def.skoki.lista) || {}).map(Number).filter(n => n > 0).sort((a, b) => a - b);
    // (the {x} of a jump's label and description: ch, nazwa (= name), zadanie, n - the jump's number)
    function f9Vars(w, i) {
        const j = w.def.skoki.lista[i] || {}, nazwa = w.skokNazwa(i);
        return { ch: j.ch === undefined ? i : j.ch, nazwa, name: nazwa, zadanie: w.def.zadanie || w.id, n: i };
    }
    function f9Label(w, i) {
        return fill(w.tekstMoze((w.def.f9 || {}).etykieta || "f9.etykieta") || "{zadanie}: rozdział {ch} - {nazwa}", f9Vars(w, i));
    }
    const f9Desc = (w, i) => fill(w.tekstMoze((w.def.f9 || {}).opis || "f9.opis") || "", f9Vars(w, i));
    // A thread's own rows besides the jumps, two ways:
    //  - (2026-10-28, Podroznicy) f9.wiersze() -> [{ co, label, icon, desc, pick, ... }], ←→ f9.wybierz(row, delta) (changes row.label /
    //    row.pick), OK f9.ok(row);
    //  - (2026-10-29, Act3 / Underground / Rywal) f9.wiersze: [...] - the rows as data: { co, rodzaj (the row's kind; else
    //    "isleWatek:<co>"), etykieta / opis (keys of the thread's words - their {x} from the hook `zmienne` (ctx { w, row }) -> { x }),
    //    ikona, pola ({...}: the row's own fields from the start - the underground's floor), gdy (a condition: the row only then),
    //    wybierz (a hook (ctx { w, row }, delta): ←→; false - nothing to change), ok (a hook (ctx { w, row }): OK) } - the label and the
    //    description read again after ←→ and OK.
    // OK's answer: { go: [name, map, x, y, dir] } | { back: true } (the menu closes, back to the map) | { say, bad } | {} (the menu stays,
    // the row read again). Debug.js keeps every field of a row: the thread in `watek`, the row's `co` (the old way: in the kind too)
    const OWN = "isleWatek:";
    const coOf = row => (!row ? null : row.co !== undefined && row.co !== null ? String(row.co)
        : typeof row.kind === "string" && row.kind.indexOf(OWN) === 0 ? row.kind.slice(OWN.length) : null);
    const ownRow = row => coOf(row) !== null;
    const rowDefs = w => (Array.isArray((w.def.f9 || {}).wiersze) ? w.def.f9.wiersze : null);
    const rowDef = (w, co) => (rowDefs(w) || []).find(d => String(d.co) === co) || null;
    // a data row's words: its label and description, the {x} from the thread's hook
    function rowWords(w, d, row) {
        let vars = {};
        if (d.zmienne) { try { vars = w.hak(d.zmienne, { w, row }) || {}; } catch (e) { report("f9 " + w.id, e); } }
        row.label = fill(w.tekst(d.etykieta) || String(d.co), vars);
        row.desc = d.opis ? fill(w.tekstMoze(d.opis) || "", vars) : "";
        return row;
    }
    function ownRows(w, k, f) {
        const defs = rowDefs(w);
        if (!defs) {
            let rows = [];
            try { rows = f.wiersze.call(w) || []; } catch (e) { report("f9 " + k, e); }
            return rows.map(r => Object.assign({}, r, { kind: OWN + r.co, watek: k, co: r.co, label: r.label, icon: r.icon || f.ikona || 189, desc: r.desc || "", pick: r.pick }));
        }
        const out = [];
        for (const d of defs) {
            try {
                if (d.gdy !== undefined && !w.ok(d.gdy, { w })) continue;
                out.push(rowWords(w, d, Object.assign({}, d.pola || {}, { kind: d.rodzaj || OWN + d.co, watek: k, co: String(d.co), icon: d.ikona || f.ikona || 189 })));
            } catch (e) { report("f9 " + k, e); }
        }
        return out;
    }
    const f9 = {
        sekcje() {
            const out = [];
            for (const k of order) {
                const w = threads.get(k), f = w.def.f9;
                if (!f) continue;
                const where = { watek: k, zakladka: f.zakladka || "wyspa", kolejnosc: Number(f.kolejnosc) || 0 };
                if (f.wiersze) {
                    const rows = ownRows(w, k, f);
                    if (rows.length) out.push(Object.assign({ head: w.tekstMoze(f.naglowek || "f9.naglowek") || "Wątek " + k + ":", rows }, where));
                }
                if (!w.def.skoki || !f9Keys(w).length) continue;
                const keys = f9Keys(w), pickI = keys.includes(f9Last[k]) ? f9Last[k] : keys[0];
                out.push(Object.assign({ head: w.tekstMoze(f.naglowek || "f9.naglowek") || "Wątek " + (w.def.zadanie || k) + ":",
                    rows: [{ kind: f.rodzaj || "isleWatek", watek: k, label: f9Label(w, pickI), icon: f.ikona || 189, desc: f9Desc(w, pickI), pick: pickI }] }, where));
            }
            // (the sections without kolejnosc first, in the plugins' order, then by it - the sort keeps the order of equal ones)
            return out.map((s, i) => [s, i]).sort((a, b) => a[0].kolejnosc - b[0].kolejnosc || a[1] - b[1]).map(x => x[0]);
        },
        wybierz(row, delta) {
            const w = row && threads.get(row.watek);
            if (!w) return false;
            if (ownRow(row)) {
                const f = w.def.f9 || {}, co = row.co = coOf(row);
                if (!rowDefs(w)) {
                    if (typeof f.wybierz !== "function") return false;
                    try { return f.wybierz.call(w, row, delta) !== false; } catch (e) { report("f9 " + w.id, e); return false; }
                }
                const d = rowDef(w, co);
                if (!d || !d.wybierz) return false;
                try { const r = w.hak(d.wybierz, { w, row }, delta) !== false; rowWords(w, d, row); return r; } catch (e) { report("f9 " + w.id, e); return false; }
            }
            const keys = f9Keys(w), i = Math.max(0, keys.indexOf(row.pick));
            row.pick = f9Last[w.id] = keys[(i + delta + keys.length * 10) % keys.length];
            row.label = f9Label(w, row.pick);
            row.desc = f9Desc(w, row.pick);
            return true;
        },
        ok(row) {
            const w = row && threads.get(row.watek);
            if (!w) return { say: "Brak wątku " + (row && row.watek), bad: true };
            const f = w.def.f9 || {}, brak = otherwise => w.tekstMoze(f.brak || "f9.brak") || otherwise;
            if (ownRow(row)) {
                const co = row.co = coOf(row);
                let r = null;
                if (!rowDefs(w)) {
                    try { r = typeof f.ok === "function" ? f.ok.call(w, row) : null; } catch (e) { report("f9 " + w.id, e); }
                } else {
                    const d = rowDef(w, co);
                    try { r = d && d.ok ? w.hak(d.ok, { w, row }) : null; if (d) rowWords(w, d, row); } catch (e) { report("f9 " + w.id, e); }
                }
                return r || { say: brak("Nie da się"), bad: true };
            }
            const g = w.skocz(row.pick);
            if (!g) return { say: brak("Nie da się tam przeskoczyć"), bad: true };
            return { go: [w.def.zadanie || w.id, g[0], g[1], g[2], g[3]] };
        }
    };

    window.Watki = T.register(PLUGIN, {
        // texts
        teksty, zTekstu, scal, poTekstach, parse, wczytaj, przeladuj, ostatnieWczytanie: () => lastReload, tekst: (name, key, vars) => lookup(teksty(name), key, vars),
        wstaw: fill,   // (a text of the files with its {miejsca} filled: Watki.wstaw(TK.kod.f[2], { n: 3 }) - tools/teksty.js kody)
        pliki: () => Array.from(files.values()).map(f => ({ name: f.name, url: f.url, st: f.st, errors: f.errors.slice(), keys: f.keys.length })),
        gotowe: () => textsIn,
        // talks
        mowa,
        // threads
        watek, act, f9, watki: () => order.slice(), get: k => threads.get(k) || null,
        stan: k => { const w = threads.get(k); return w ? w.S() : null; }, krok: k => { const w = threads.get(k); return w ? w.cur() : ""; },
        skocz: (k, i) => { const w = threads.get(k); return w ? w.skocz(i) : null; }, rekordy: () => (has() && recDef ? recStore() : null)
    });
})();
