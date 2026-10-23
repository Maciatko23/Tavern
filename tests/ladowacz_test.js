// Ładowacz wtyczek (js/plugins/TawernaLoader.js, od 2026-10-23): wtyczki gry z listy gry js/tawerna_wtyczki.js, nie z edytora.
// Kilka startów gry w jednej przeglądarce; js/plugins.js (i index.html) podmienione przez nakładkę (GAME_OVERLAY_JS), pliki gry
// nietknięte. W każdym: każda wtyczka w stronie raz, w kolejności $plugins, wszystkie przed Scene_Boot; $plugins jak z reguł
// scalania (tests/lib/wtyczki.js - druga ręka); PluginManager.parameters(nazwa) jak z listy (+ edytor parametr po parametrze);
// tytuł bez błędów w konsoli.
//   A  dzisiejsze pliki (+ porównanie z js/plugins.js sprzed ładowacza: tests/fixtures/wtyczki/plugins_2026-10-23.js)
//   B1 edytor zapisał starą listę (148 wpisów, bez ładowacza)      B2 js/plugins.js z samym ładowaczem
//   B3 edytor po swojemu: obca wtyczka nad ładowaczem i pod nim, podwójny wpis, zmienione parametry, wtyczka wyłączona
//   B4 index.html bez ładowacza (zapasowe wejście - wpis TawernaLoader w js/plugins.js)
//   B5 brak listy gry: ekran błędu silnika „Failed to load: js/tawerna_wtyczki.js”
// Migawka: gdy na liście gry z rozmysłem zmienią się parametry albo zniknie wtyczka, check A2 to pokaże - wtedy nowa migawka:
//   node tests/ladowacz_test.js --migawka      (zapisuje dzisiejszą listę jako tests/fixtures/wtyczki/plugins_2026-10-23.js)
// Uruchom: node tests/run.js ladowacz_test (port 9605: CDP_PORT=9605 node tests/ladowacz_test.js)
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const kit = require("./lib/kit.js");
const W = require("./lib/wtyczki.js");

const SNAP = path.join(kit.FIXTURES, "wtyczki", "plugins_2026-10-23.js");
if (process.argv.includes("--migawka")) {
    const out = W.merge(W.lista(), W.edytor()).filter(p => p.name !== W.LOADER);
    fs.writeFileSync(SNAP, W.plikEdytora(out));
    console.log("migawka: " + out.length + " wtyczek -> " + SNAP);
    process.exit(0);
}

const GAME = "http://127.0.0.1:8765/index.html";
const OVER = fs.mkdtempSync(path.join(os.tmpdir(), "tawerna_ladowacz_"));
const INDEX = fs.readFileSync(path.join(W.ROOT, "index.html"), "utf8");
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// in the page before the game: every script's run noted (its load event comes right after it ran), then the window's load and
// the start of Scene_Boot (how many had run by then)
const TRACE = `(function(){
    const T = window.__lt = { ran: [], atLoad: -1, atBoot: -1 };
    document.addEventListener("load", e => { const s = e.target; if (s && s.tagName === "SCRIPT" && s.src) T.ran.push(decodeURIComponent(new URL(s.src).pathname).replace(/^\\/+/, "")); }, true);
    window.addEventListener("load", () => {
        T.atLoad = T.ran.length;
        if (window.Scene_Boot) { const c = Scene_Boot.prototype.create; Scene_Boot.prototype.create = function() { if (T.atBoot < 0) T.atBoot = T.ran.length; return c.apply(this, arguments); }; }
    });
})();`;
const TITLE = "!!(window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && DataManager.isGlobalInfoLoaded())";
const STATE = `(function(){
    const pl = window.$plugins || [], name = p => Utils.extractFileName(p.name);
    return { info: window.TawernaLoader && TawernaLoader.info ? TawernaLoader.info() : null,
        names: pl.map(p => p.name), status: pl.map(p => !!p.status),
        params: pl.map(p => PluginManager.parameters(name(p))),
        ran: __lt.ran.filter(u => /^js\\/plugins\\//.test(u)).map(u => u.replace(/^js\\/plugins\\//, "").replace(/\\.js$/, "")),
        last: Math.max(-1, ...__lt.ran.map((u, i) => /^js\\/plugins\\//.test(u) ? i : -1)), atLoad: __lt.atLoad, atBoot: __lt.atBoot,
        tags: Array.from(document.querySelectorAll("script[src]")).map(s => s.getAttribute("src")).filter(s => /^js\\/plugins\\//.test(s)).map(s => s.replace(/^js\\/plugins\\//, "").replace(/\\.js.*$/, "")) };
})()`;

// the overlay: files served instead of the game's own (none: the game as it is)
function overlay(files) {
    fs.rmSync(OVER, { recursive: true, force: true });
    for (const [rel, text] of Object.entries(files || {})) {
        fs.mkdirSync(path.dirname(path.join(OVER, rel)), { recursive: true });
        fs.writeFileSync(path.join(OVER, rel), text);
    }
}
const count = (arr, x) => arr.filter(y => y === x).length;

kit.test({ port: 9605, overlay: OVER, overlayJs: true, beforeLoad: TRACE, bootCheck: "A: gra startuje z dzisiejszymi plikami (lista gry + js/plugins.js)", errorCheck: false, evalTimeout: 20000 }, async t => {
    // one start: the files, the page, the title (or false)
    async function start(files) {
        overlay(files);
        t.clearErrors();
        await t.b.send("Page.navigate", { url: GAME });
        return t.until(TITLE, 60, 300);
    }
    // the checks of one start: `want` = the $plugins the page should have, `mode` = "strona" / "wtyczka"
    async function verify(tag, want, mode, o = {}) {
        const s = await t.json(STATE);
        const on = want.filter(p => p.status).map(p => p.name);
        t.check(tag + ": ładowacz w trybie " + mode, s.info && s.info.mode === mode,
            s.info && Object.assign({}, s.info, { editor: s.info.editor.length > 8 ? s.info.editor.length + " wpisów" : s.info.editor }));
        t.check(tag + ": $plugins jak z reguł scalania (" + want.length + " wpisów)", deepEq(s.names, want.map(p => p.name)) && deepEq(s.status, want.map(p => !!p.status)),
            deepEq(s.names, want.map(p => p.name)) ? undefined : { page: s.names.slice(0, 8), want: want.map(p => p.name).slice(0, 8), n: [s.names.length, want.length] });
        const bad = want.map((p, i) => [p, s.params[i]]).filter(([p, got]) => p.status && !deepEq(got, p.parameters || {})).map(([p]) => p.name);
        t.check(tag + ": PluginManager.parameters jak z listy (+ edytor)", bad.length === 0, bad.slice(0, 6));
        const order = o.order || on;
        const ran = s.ran.filter(n => n !== W.LOADER), wantRan = order.filter(n => n !== W.LOADER);
        t.check(tag + ": każda włączona wtyczka wykonana raz, w kolejności " + (mode === "strona" ? "listy" : "wczytania"),
            deepEq(ran, wantRan) && count(s.ran, W.LOADER) === 1 && on.every(n => count(s.tags, n) === 1),
            deepEq(ran, wantRan) ? { twice: on.filter(n => count(s.tags, n) !== 1) } : { ran: ran.slice(0, 10), want: wantRan.slice(0, 10), n: [ran.length, wantRan.length] });
        t.check(tag + ": wszystkie wykonane przed końcem ładowania strony i przed Scene_Boot", s.last >= 0 && s.atLoad > s.last && s.atBoot >= s.atLoad,
            { last: s.last, atLoad: s.atLoad, atBoot: s.atBoot });
        const errs = t.errors();
        t.check(tag + ": bez błędów w konsoli", errs.length === 0, errs.slice(-4));
        return s;
    }

    const list = W.lista(), snap = W.parse(SNAP);
    const minimal = ["TawernaLoader", "ActorPictures", "OptionEx", "HDLayout"].map(n => n === W.LOADER
        ? { name: W.LOADER, status: true, description: "Ładowacz wtyczek gry", parameters: {} } : snap.find(p => p.name === n));

    // ---------------------------------------------------------------- A: the files as they are
    const a = await verify("A", W.merge(list, W.edytor()), "strona");
    const pos = snap.map(p => a.names.indexOf(p.name));
    t.check("A2: każda wtyczka z js/plugins.js sprzed ładowacza (" + snap.length + ") jest raz, w tej samej kolejności",
        pos.every(i => i >= 0) && pos.every((i, k) => k === 0 || i > pos[k - 1]) && snap.every(p => count(a.names, p.name) === 1),
        snap.filter((p, k) => pos[k] < 0).map(p => p.name));
    const changed = snap.filter(p => { const i = a.names.indexOf(p.name); return i >= 0 && !deepEq(a.params[i], p.parameters); }).map(p => p.name);
    t.check("A2: ... i z tymi samymi parametrami (różnica z rozmysłem? nowa migawka: node tests/ladowacz_test.js --migawka)", changed.length === 0, changed);

    // ---------------------------------------------------------------- B1: the editor saved the old list (148, no loader entry)
    t.check("B1: stara lista edytora - gra startuje", await start({ "js/plugins.js": fs.readFileSync(SNAP, "utf8") }));
    await verify("B1", W.merge(list, snap), "strona");

    // ---------------------------------------------------------------- B2: js/plugins.js with the loader only
    const onlyLoader = [minimal[0]];
    t.check("B2: sam ładowacz w js/plugins.js - gra startuje", await start({ "js/plugins.js": W.plikEdytora(onlyLoader) }));
    const b2 = await verify("B2", W.merge(list, onlyLoader), "strona");
    t.check("B2: parametry wszystkich wtyczek jak w js/plugins.js sprzed ładowacza", snap.every(p => deepEq(b2.params[b2.names.indexOf(p.name)], p.parameters)));

    // ---------------------------------------------------------------- B3: the editor's own way
    const optionEx = snap.find(p => p.name === "OptionEx"), farming = snap.find(p => p.name === "Farming");
    const own = [
        { name: "TextPicture", status: true, description: "(nad ładowaczem)", parameters: {} },
        minimal[0],
        Object.assign({}, optionEx, { parameters: Object.assign({}, optionEx.parameters, { defaultVolume: "7" }) }),
        Object.assign({}, optionEx, { parameters: Object.assign({}, optionEx.parameters, { defaultVolume: "1" }) }),   // (twice: the first counts)
        { name: "Farming", status: true, description: "", parameters: { seedChance: "0.5" } },                           // (one key only)
        { name: "AltSaveScreen", status: false, description: "", parameters: {} },                                         // (off in the editor)
        { name: "ButtonPicture", status: true, description: "(pod ładowaczem)", parameters: {} }
    ];
    t.check("B3: edytor po swojemu - gra startuje", await start({ "js/plugins.js": W.plikEdytora(own) }));
    const w3 = W.merge(list, own), b3 = await verify("B3", w3, "strona");
    const P = n => b3.params[b3.names.indexOf(n)] || {};
    t.check("B3: obca wtyczka nad ładowaczem przed listą, pod nim - po liście",
        b3.names[0] === "TextPicture" && b3.names[1] === W.LOADER && b3.names[2] === list[0].name && b3.names[b3.names.length - 1] === "ButtonPicture", b3.names.slice(0, 3));
    t.check("B3: parametry z edytora mają pierwszeństwo (OptionEx 7 z pierwszego wpisu; Farming: seedChance z edytora, reszta z listy)",
        P("OptionEx").defaultVolume === "7" && P("Farming").seedChance === "0.5" &&
        Object.keys(farming.parameters).every(k => k === "seedChance" || P("Farming")[k] === farming.parameters[k]), { opt: P("OptionEx").defaultVolume, farm: P("Farming").seedChance });
    t.check("B3: wyłączona w edytorze nie wczytana (AltSaveScreen)", !b3.ran.includes("AltSaveScreen") && b3.status[b3.names.indexOf("AltSaveScreen")] === false);

    // ---------------------------------------------------------------- B4: index.html without the loader (the stock one)
    const stock = INDEX.replace(/[ \t]*<!--[^\n]*-->\r?\n/, "").replace(/[ \t]*<script[^>]*tawerna_wtyczki\.js[^>]*><\/script>\r?\n/, "").replace(/[ \t]*<script[^>]*TawernaLoader\.js[^>]*><\/script>\r?\n/, "");
    t.check("B4: index.html bez ładowacza - gra startuje (wpis TawernaLoader w js/plugins.js)", !/TawernaLoader|tawerna_wtyczki/.test(stock) &&
        await start({ "index.html": stock, "js/plugins.js": W.plikEdytora(minimal) }));
    const m4 = W.merge(list, minimal), ed4 = minimal.map(p => p.name);
    const early = m4.filter(p => p.status && ed4.includes(p.name)).sort((x, y) => ed4.indexOf(x.name) - ed4.indexOf(y.name));
    const want4 = early.concat(m4.filter(p => !early.includes(p)));
    await verify("B4", want4, "wtyczka", { order: want4.filter(p => p.status).map(p => p.name) });
    t.check("B4: ostrzeżenie w konsoli (kolejność przybliżona)", t.b.logs.some(l => /index\.html nie wczytuje ładowacza/.test(l)));

    // ---------------------------------------------------------------- B5: no game list - the engine's error screen
    overlay({ "index.html": INDEX.replace("js/tawerna_wtyczki.js", "js/brak_listy_gry.js") });
    await t.b.send("Page.navigate", { url: GAME });
    const shown = await t.until(`(function(){ const e = document.getElementById("errorPrinter"); return !!e && /Failed to load: js\\/tawerna_wtyczki\\.js/.test(e.textContent); })()`, 30, 300);
    t.check("B5: bez listy gry - ekran błędu „Failed to load: js/tawerna_wtyczki.js”", shown,
        await t.eval(`(document.getElementById("errorPrinter") || {}).textContent || (SceneManager._scene && SceneManager._scene.constructor.name)`).catch(() => null));
    t.clearErrors();   // (the 404 and the thrown error of B5 are the point of it)
    overlay({});
    fs.rmSync(OVER, { recursive: true, force: true });
});
