//=============================================================================
// TawernaLoader.js
//=============================================================================
// The game's plugins come from the game's own list, not from the editor. RPG Maker MZ's editor writes js/plugins.js on every save
// from the list it read when the project was opened, so a plugin added to that file while the editor was open got lost. Since
// 2026-10-23 the game's plugins stand in js/tawerna_wtyczki.js (the editor never reads nor writes it) and this file puts them into
// $plugins - in that order, with those parameters - before main.js hands $plugins to PluginManager.setup. From there on all is the
// engine's own: the script tags (in order, all run before Scene_Boot), PluginManager.parameters(name), "Failed to load: ..." for a
// missing file, window.$plugins with every plugin once.
//
// How (index.html, the two lines above js/main.js):
//   js/tawerna_wtyczki.js          var $tawernaWtyczki = the list: {name, status, description, parameters}, one a line
//   js/plugins/TawernaLoader.js    this file: window.$plugins becomes an accessor. js/plugins.js (the editor's part) runs later,
//                                  its own `var $plugins = ...` goes through the setter and comes out merged with the game's list.
// The merge: the game's list in its order, each plugin once (a second entry of the same name is skipped). A plugin that stands in
// js/plugins.js too (the editor's Plugin Manager) takes its on/off and its parameters from there - parameter by parameter, one the
// editor's entry lacks stays the list's. Entries of js/plugins.js the list does not have: above the TawernaLoader entry -> before
// the list, below it -> after the list; js/plugins.js without a TawernaLoader entry (an old save of the editor) -> each right after
// the plugin above it in js/plugins.js. The TawernaLoader entry stands in $plugins too (first, or where the editor has it) and
// PluginManager.setup skips it (it has run).
// A hook set on window.$plugins before this file (the tests: REGISTERED=1, GAME_PLUGINS_ADD, beforeLoad) gets the merged list, as
// it got the whole js/plugins.js before.
// No list (js/tawerna_wtyczki.js missing or broken): only js/plugins.js's plugins and the engine's "Failed to load:
// js/tawerna_wtyczki.js" at the start, as for any missing plugin.
// The fallback: an index.html without these lines (a stock one) - the editor's TawernaLoader entry loads this file as a plugin;
// it then reads the list itself and puts the rest in after js/plugins.js's plugins (each once, all before Scene_Boot; the order
// only roughly the list's - a console warning says so).
// TawernaLoader.info() -> { mode: "strona" | "wtyczka", list, editor, extra, overridden, twice }. Tests: tests/ladowacz_test.js.

/*:
 * @target MZ
 * @plugindesc Ładowacz wtyczek gry: wczytuje wszystkie wtyczki z listy gry js/tawerna_wtyczki.js, w jej kolejności i z jej parametrami. Nie wyłączaj. v1.0.0
 * @author Claude
 *
 * @help
 * ============================================================================
 * TawernaLoader.js - wtyczki gry z listy gry, nie z Menedżera wtyczek
 * ============================================================================
 * Wtyczki gry stoją w pliku js/tawerna_wtyczki.js (lista gry), nie tutaj.
 * Wczytuje je ten plik - z index.html, zanim gra wystartuje - dokładnie
 * w kolejności listy i z jej parametrami. Edytor tej listy nie zna i jej
 * nie zapisuje, więc nic z niej nie zginie.
 *
 * W Menedżerze wtyczek zostają tylko:
 *  - TawernaLoader (ten wpis; nie wyłączaj go i nie usuwaj - to zapasowe
 *    wejście, gdyby index.html go nie wczytał),
 *  - wtyczki, których parametry ustawia się w edytorze: ActorPictures,
 *    OptionEx, HDLayout.
 * Parametry ustawione w edytorze mają pierwszeństwo przed listą gry
 * (parametr po parametrze). Wyłączenie wtyczki w edytorze wyłącza ją w grze.
 *
 * Nowa wtyczka: wiersz w js/tawerna_wtyczki.js, na swoim miejscu:
 *   python tools/wtyczki.py --dodaj Nazwa --po Poprzednia
 * Wtyczka dodana tutaj, w edytorze, a nieobecna na liście gry, wczytuje się
 * przed listą gry, gdy stoi nad TawernaLoader, a po niej - gdy pod.
 *
 * Więcej: docs/ARCHITEKTURA.md, sekcja 2.
 */

(function() {
    "use strict";
    const NAME = "TawernaLoader", LIST_URL = "js/tawerna_wtyczki.js", VERSION = "1.0.0";
    const L = window.TawernaLoader || (window.TawernaLoader = {});
    if (L.ran) return;   // (once: run from index.html, the editor's entry is skipped - and if it is not, it ends here)
    L.ran = true;
    L.version = VERSION;
    L.info = () => ({ mode: L.mode, list: L.list || 0, editor: L.editor || [], extra: L.extra || [], overridden: L.overridden || [], twice: L.twice || [] });

    const fileName = name => String(name).split("/").pop();   // (Utils.extractFileName - rmmz_core.js is not there yet)
    const key = p => fileName(p.name);
    const isEntry = p => !!p && typeof p === "object" && typeof p.name === "string" && p.name !== "";
    const entries = v => (Array.isArray(v) ? v : []).filter(isEntry);
    const engine = () => typeof PluginManager !== "undefined";

    // the game's list (js/tawerna_wtyczki.js); null when it did not load
    function gameList() {
        const v = window.$tawernaWtyczki;
        return Array.isArray(v) ? entries(v) : null;
    }
    // a load error the engine shows at the start (SceneManager.checkPluginErrors), as for a missing plugin file
    function loadError(url) {
        L.missing = url;
        if (engine() && !PluginManager._errorUrls.includes(url)) PluginManager._errorUrls.push(url);
    }

    // merge(list, editor) -> { out: the plugin list for PluginManager.setup, info } (the rules: the top of this file)
    function merge(list, editor) {
        const info = { editor: editor.map(key), extra: [], overridden: [], twice: [] };
        const ed = new Map();
        for (const p of editor) if (!ed.has(key(p))) ed.set(key(p), p);
        const seen = new Set([NAME]), base = [];
        for (const m of list) {
            const k = key(m);
            if (seen.has(k)) { info.twice.push(k); continue; }
            seen.add(k);
            const e = ed.get(k);
            if (!e) { base.push(m); continue; }
            const mp = m.parameters || {}, ep = e.parameters || {};
            const diff = Object.keys(ep).filter(n => mp[n] !== ep[n]);
            if (diff.length || !!e.status !== !!m.status) info.overridden.push(k + (!!e.status !== !!m.status ? (e.status ? " (włączona)" : " (wyłączona)") : "") + (diff.length ? ": " + diff.join(", ") : ""));
            base.push(Object.assign({}, m, { status: !!e.status, parameters: Object.assign({}, mp, ep) }));
        }
        const own = ed.get(NAME) || { name: NAME, status: true, description: "Ładowacz wtyczek gry (z index.html)", parameters: {} };
        const at = editor.findIndex(p => key(p) === NAME);
        const extra = p => { const k = key(p); if (seen.has(k)) return false; seen.add(k); info.extra.push(k); return true; };
        let out;
        if (at >= 0) {
            out = editor.slice(0, at).filter(extra).concat([own], base, editor.slice(at + 1).filter(extra));
        } else {   // (an old save of the editor: each of its own right after the plugin above it there)
            out = [own].concat(base);
            let pos = 0;
            for (const p of editor) {
                if (extra(p)) { out.splice(++pos, 0, p); continue; }
                const i = out.findIndex(q => key(q) === key(p));
                if (i >= 0) pos = i;
            }
        }
        return { out, info };
    }
    function note(info, list) {
        Object.assign(L, info, { list: list.length });
        if (info.twice.length) console.warn("TawernaLoader: na liście gry dwa razy (drugi wpis pominięty): " + info.twice.join(", "));
        if (info.overridden.length) console.info("TawernaLoader: z edytora (js/plugins.js) zamiast listy gry: " + info.overridden.join("; "));
        if (info.extra.length) console.info("TawernaLoader: wtyczki tylko z edytora (js/plugins.js): " + info.extra.join(", "));
    }
    // the TawernaLoader entry: it has run - PluginManager.setup skips it (its parameters set as setup would)
    function claim(list) {
        if (!engine()) return;
        if (!PluginManager._scripts.includes(NAME)) PluginManager._scripts.push(NAME);
        const own = list.find(p => key(p) === NAME);
        PluginManager.setParameters(NAME, (own && own.parameters) || {});
    }

    // ------------------------------------------------------------------ from index.html (before main.js): the setter
    if (!engine()) {
        L.mode = "strona";
        const list = gameList();
        if (!list) L.missing = LIST_URL;
        const prev = Object.getOwnPropertyDescriptor(window, "$plugins");
        const hook = prev && (prev.get || prev.set) ? prev : null;   // (a test's hook, set before the page's scripts)
        let value = prev && !hook ? prev.value : undefined;
        Object.defineProperty(window, "$plugins", {
            configurable: true,
            enumerable: true,
            get() { return hook && hook.get ? hook.get.call(window) : value; },
            set(v) {
                let out = v;
                try {
                    const editor = entries(v);
                    if (list) {
                        const r = merge(list, editor);
                        out = r.out;
                        note(r.info, list);
                    } else {
                        out = editor;
                        loadError(LIST_URL);
                    }
                    claim(out);
                } catch (e) {
                    L.problem = String((e && e.stack) || e);
                    console.warn("TawernaLoader: lista nie połączona - " + L.problem);
                }
                value = out;
                if (hook && hook.set) hook.set.call(window, out);
            }
        });
        return;
    }

    // ------------------------------------------------------------------ the fallback: run as the editor's plugin (index.html without it)
    L.mode = "wtyczka";
    const go = () => {
        const list = gameList();
        if (!list) return loadError(LIST_URL);
        const editor = entries(window.$plugins);
        const r = merge(list, editor);
        const queued = new Set(PluginManager._scripts);   // (js/plugins.js's plugins: PluginManager.setup put them in already)
        const pos = new Map();
        editor.forEach((p, i) => { if (!pos.has(key(p))) pos.set(key(p), i); });
        const at = p => (pos.has(key(p)) ? pos.get(key(p)) : -1);
        const early = r.out.filter(p => queued.has(key(p))).sort((a, b) => at(a) - at(b));
        const late = r.out.filter(p => !queued.has(key(p)));
        for (const p of early) PluginManager.setParameters(key(p), p.parameters || {});   // (not run yet: the merged parameters)
        for (const p of late) {
            if (!p.status) continue;
            PluginManager.setParameters(key(p), p.parameters || {});
            PluginManager.loadScript(p.name);
            PluginManager._scripts.push(key(p));
        }
        window.$plugins = early.concat(late);
        note(r.info, list);
        console.warn("TawernaLoader: index.html nie wczytuje ładowacza - wtyczki z listy gry idą po wtyczkach z js/plugins.js, " +
            "kolejność tylko przybliżona (przywróć dwa wiersze w index.html: docs/ARCHITEKTURA.md, sekcja 2)");
    };
    if (gameList()) go();
    else {
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.src = LIST_URL;
        s.async = false;
        s._url = LIST_URL;
        s.onload = go;
        s.onerror = () => loadError(LIST_URL);
        document.body.appendChild(s);
    }
})();
