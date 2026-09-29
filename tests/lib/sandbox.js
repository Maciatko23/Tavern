// Plugins loaded in Node, without the game (tests/unit/*.test.js): a fake window where every engine name the plugin touches
// while it loads (Scene_Map, PluginManager, Sprite...) is a harmless stand-in, so its pure functions can be called.
//
//   const { loadPlugins, loadData } = require("../lib/sandbox.js");
//   const w = loadPlugins(["TavernDice"]);                         // -> the fake window: w.TavernDice.score([1, 1, 1])
//   const w = loadPlugins(["QuestBoard"], { globals: { $dataItems: loadData("Items") } });
//
// A bare name the fake does not know (Scene_Map) is a stand-in: any property, call or `new` of it gives another one, what is
// set on it stays. window.X of a name nobody set is undefined (as in the game: `if (window.Hunting)`). opts.globals: real values
// ($dataItems, $gameMap, Graphics...); opts.params: { Plugin: { param: "value" } } for PluginManager.parameters.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const PLUGINS = path.join(ROOT, "js", "plugins");

// a stand-in: a function (so it can be called, extended and constructed) that makes more stand-ins
function standIn(name) {
    const store = new Map();
    const target = (function() { "use strict"; return function() {}; })();
    const proxy = new Proxy(target, {
        get(t, k, receiver) {
            if (k === Symbol.toPrimitive) return hint => (hint === "number" ? 0 : "");
            if (k === "then" || k === Symbol.iterator || k === Symbol.asyncIterator || k === "toJSON") return undefined;
            if (k === Symbol.toStringTag) return "StandIn";
            if (store.has(k)) return store.get(k);
            if (k === "name") return name;
            if (k === "length") return 0;
            if (k === "call" || k === "apply" || k === "bind") return Function.prototype[k];
            if (typeof k === "symbol") return undefined;
            const s = standIn(name + "." + String(k));
            store.set(k, s);
            return s;
        },
        set(t, k, v, receiver) {
            if (receiver !== proxy) return Reflect.defineProperty(receiver, k, { value: v, writable: true, enumerable: true, configurable: true });   // (an object made from it)
            store.set(k, v);
            return true;
        },
        has(t, k) { return store.has(k); },
        apply() { return standIn(name + "()"); },
        construct() { return standIn("new " + name); }
    });
    return proxy;
}

// the database files (data/<name>.json)
function loadData(name) {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "data", name.replace(/\.json$/, "") + ".json"), "utf8"));
}
// a <tag:value> note read as the engine does (DataManager.extractMetadata)
function withMeta(list) {
    for (const o of list || []) {
        if (!o || typeof o.note !== "string") continue;
        o.meta = {};
        const re = /<([^<>:]+)(:?)([^>]*)>/g;
        let m;
        while ((m = re.exec(o.note))) o.meta[m[1]] = m[2] === ":" ? m[3] : true;
    }
    return list;
}

function makeWindow(opts) {
    const win = {};
    const known = new Map();
    const params = opts.params || {};
    // the little of the engine a plugin calls while it loads
    Object.assign(win, {
        window: win, globalThis: win, self: win, console,
        PluginManager: Object.assign(standIn("PluginManager"), {}),
        document: standIn("document"), navigator: { userAgent: "node" }, location: { search: "", href: "" },
        addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 0,
        // (no timers: nothing of the plugin runs later or keeps Node alive; opts.timers: the real ones)
        setTimeout: opts.timers ? setTimeout : () => 0, clearTimeout: opts.timers ? clearTimeout : () => {}, setInterval: opts.timers ? setInterval : () => 0, clearInterval: opts.timers ? clearInterval : () => {},
        $plugins: []
    });
    win.PluginManager.parameters = name => Object.assign({}, params[name] || {});
    win.PluginManager.registerCommand = () => {};
    Object.defineProperties(win, Object.getOwnPropertyDescriptors(opts.globals || {}));   // (a getter stays a getter: a value the test changes later)
    // bare names: the window's own, the real built-ins, else a stand-in (kept, so what is set on it stays)
    const scope = new Proxy(win, {
        has: (t, k) => k !== Symbol.unscopables,
        get(t, k) {
            if (k === Symbol.unscopables) return undefined;
            if (k in t) return t[k];
            if (k in globalThis) return globalThis[k];
            if (typeof k === "symbol") return undefined;
            if (!known.has(k)) known.set(k, standIn(k));
            return known.get(k);
        },
        set(t, k, v) { t[k] = v; return true; }
    });
    win.__scope = scope;
    win.__standIns = known;
    return win;
}

// runs plugin files (js/plugins/<name>.js, in the order given) in one fake window; returns the window
function loadPlugins(names, opts = {}) {
    const win = opts.window || makeWindow(opts);
    for (const name of names) {
        const file = path.join(PLUGINS, name + ".js");
        const code = fs.readFileSync(file, "utf8");
        // (sloppy code round the plugin so `with` can hand every bare name to the scope; the plugin's own "use strict" stays. In
        // this realm: [] instanceof Array holds for what the plugin makes)
        const run = vm.compileFunction("with (__scope) {\n" + code + "\n}", ["__scope"], { filename: file });
        run(win.__scope);
    }
    return win;
}

module.exports = { loadPlugins, makeWindow, loadData, withMeta, standIn, ROOT, PLUGINS };
