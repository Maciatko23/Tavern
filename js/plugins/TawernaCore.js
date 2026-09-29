//=============================================================================
// TawernaCore.js
//=============================================================================
// Load order: the FIRST of the game's plugins (at the top of the list, before ActorPictures).
// Two kinds of hooks: the "prepare" ones (map data, saved states, saved events) go on at load time, so they are the innermost;
// the "tell" ones (newGame, load, save, mapLeave/mapEnter/mapReady, the map's frame runner, sleep/wake) go on at Scene_Boot.start,
// over every plugin, so a listener sees the world after all the old-style hooks have done their part.
// docs/ARCHITEKTURA.md describes the whole design.

/*:
 * @target MZ
 * @plugindesc Rdzeń gry (window.Tawerna): stan w zapisie z wersjami, szyna zdarzeń, wstawianie zdarzeń do map, jeden zegar aktualizacji ze „spokojem”, tagi, kalendarz, bezpieczne dźwięki, dymki. Musi być PIERWSZĄ wtyczką na liście. v1.0.0
 * @author Claude
 *
 * @help
 * ============================================================================
 * TawernaCore.js - rdzeń (window.Tawerna)
 * ============================================================================
 * Wspólna „hydraulika” dla wszystkich wtyczek gry. Sama niczego w grze nie
 * zmienia - daje narzędzia, z których korzystają inne wtyczki. Pełny opis:
 * docs/ARCHITEKTURA.md.
 *
 * KOLEJNOŚĆ: pierwsza na liście wtyczek (nad ActorPictures). Wtyczki, które
 * z niej korzystają, muszą stać niżej.
 *
 * CO DAJE (skrót):
 *  Tawerna.state(klucz, domyślne, { version, migrate, adopt })
 *      stan wtyczki w zapisie gry ($gameSystem._tw[klucz]), z wersjami
 *      i migracjami; adopt: "_stareMiejsce" przejmuje dawny klucz ze starych
 *      zapisów (i zostawia ukryty alias dla starego kodu).
 *  Tawerna.on / once / off / emit
 *      szyna zdarzeń: mapEnter, mapLeave, mapReady, newGame, load, save,
 *      dayStart, hourChange, sleep, wake (+ zdarzenia systemów).
 *  Tawerna.inject(mapy, { ids: [od, do], owner, build })
 *      zdarzenia dokładane do danych mapy przy wczytaniu; rejestr numerów
 *      (nakładające się zakresy = błąd), stare zapisy dostają brakujące
 *      zdarzenia, osierocone znikają. Tawerna.injected(mapa) - co wstawiono.
 *  Tawerna.onMapData(fn) - dane mapy zaraz po wczytaniu (np. notatki).
 *  Tawerna.onMapUpdate(fn, { calm, every, priority }) - jeden zegar mapy.
 *  Tawerna.isCalm(scena, opcje) - wspólne „czy teraz spokojnie”.
 *  Tawerna.tags(zdarzenie | dane | strona | tekst), Tawerna.tag(x, "Nazwa")
 *      odczyt <Tag>, <Tag:a,b>, <Tag:k=v k2="tekst"> z notatek i komentarzy.
 *  Tawerna.time - dzień, godzina, pora roku, noc, Wigilia, Wielkanoc.
 *  Tawerna.audio.se(nazwa, opcje) - dźwięk, który nigdy nie zatrzyma gry
 *      („Failed to load”); Tawerna.audio.bgsLayer(...) - warstwy tła.
 *  Tawerna.popup(tekst, opcje) - dymek nad bohaterem (braki: kind "need").
 *  Tawerna.has("Wtyczka"), Tawerna.api("Wtyczka"), Tawerna.call(...)
 *  Tawerna.debug - stany, wstawienia, zegary (czas na klatkę) dla F9.
 * ============================================================================
 */

(() => {
    "use strict";
    if (window.Tawerna && window.Tawerna.VERSION) return;   // (put into the page twice: a test and the plugin list)

    const T = window.Tawerna = { VERSION: "1.0.0" };

    // ------------------------------------------------------------------
    // Small helpers (also for the plugins: Tawerna.util)
    // ------------------------------------------------------------------
    const num = (v, d) => (v === undefined || v === null || v === "" || !isFinite(Number(v)) ? d : Number(v));
    const flag = (v, d) => (v === undefined || v === null || v === "" ? d : v === true || v === "true");
    const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
    const warned = new Set();
    function warnOnce(key, text) {
        if (warned.has(key)) return;
        warned.add(key);
        console.warn("[Tawerna] " + text);
    }
    function report(where, e) { console.error("[Tawerna] " + where + ":", e); }
    let seq = 0;   // registration order (stable sorts)
    T.util = { num, flag, clamp01, warnOnce };

    // ------------------------------------------------------------------
    // Plugins: Tawerna.has / api / call / register (instead of window.X && X.f ? X.f() : ...)
    // ------------------------------------------------------------------
    const apis = Object.create(null);
    const EXPORT_OF = { UITheme: "UIStyle", Fullscreen: "FullscreenPlugin", Skills_Data: "SkillData" };   // (plugins whose object has another name)
    function pluginListed(name) {
        const list = window.$plugins;
        return Array.isArray(list) && list.some(p => p && p.status && p.name === name);
    }
    T.register = function(name, api) {
        apis[name] = api;
        return api;
    };
    T.api = function(name) {
        if (apis[name]) return apis[name];
        const w = window[EXPORT_OF[name] || name];
        return w && (typeof w === "object" || typeof w === "function") ? w : null;
    };
    T.has = name => !!T.api(name) || pluginListed(name);
    // Tawerna.call("Farming", "seasonIndex", day) -> the result, or undefined when the plugin or the function is not there
    T.call = function(name, fn) {
        const a = T.api(name), f = a && a[fn];
        return typeof f === "function" ? f.apply(a, Array.prototype.slice.call(arguments, 2)) : undefined;
    };

    // ------------------------------------------------------------------
    // The event bus
    // ------------------------------------------------------------------
    const listeners = Object.create(null);   // name -> [{ fn, owner, once, priority, n, calls, errors }]
    T.on = function(name, fn, opts) {
        if (typeof fn !== "function") throw new Error("Tawerna.on('" + name + "'): the listener is not a function");
        const o = opts || {};
        const list = listeners[name] || (listeners[name] = []);
        list.push({ fn, owner: o.owner || "", once: !!o.once, priority: num(o.priority, 0), n: seq++, calls: 0, errors: 0 });
        list.sort((a, b) => a.priority - b.priority || a.n - b.n);
        return () => T.off(name, fn);
    };
    T.once = (name, fn, opts) => T.on(name, fn, Object.assign({}, opts, { once: true }));
    T.off = function(name, fn) {
        const list = listeners[name], i = list ? list.findIndex(l => l.fn === fn) : -1;
        if (i < 0) return false;
        list.splice(i, 1);
        return true;
    };
    // every listener in turn (priority, then the order they came); one that throws is reported and the others still run
    T.emit = function(name, payload) {
        const list = listeners[name];
        if (!list || !list.length) return 0;
        let n = 0;
        for (const l of list.slice()) {
            if (l.once) T.off(name, l.fn);
            l.calls++;
            n++;
            try { l.fn(payload === undefined ? {} : payload, name); }
            catch (e) { l.errors++; report("listener of '" + name + "'" + (l.owner ? " (" + l.owner + ")" : ""), e); }
        }
        return n;
    };
    // the events the core sends itself, and the ones the systems are to send (docs/ARCHITEKTURA.md: payloads)
    T.EVENTS = {
        core: ["newGame", "load", "save", "mapLeave", "mapEnter", "mapReady", "dayStart", "hourChange", "sleep", "wake"],
        systems: ["kill", "harvest", "craft", "build", "shiftDone", "diceWin", "diceLose", "questAccepted", "questDone", "debtPaid",
            "debtPayment", "served", "storyStep", "levelUp", "miniGameStart", "miniGameEnd",
            "heroHit", "heroDown", "attack", "shot", "chop", "stormStart", "stormEnd", "lightning"]
    };

    // ------------------------------------------------------------------
    // State in the save: $gameSystem._tw[key] (plain data), $gameSystem._tw._v[key] = its version
    // ------------------------------------------------------------------
    const specs = Object.create(null);   // key -> { key, defaults, version, migrate, adopt, adoptVersion, owner }
    let readySys = null, ready = new Set();   // (the keys already looked over on this $gameSystem)
    const KEY_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
    const copy = o => JSON.parse(JSON.stringify(o));
    function freshOf(spec) {
        const d = typeof spec.defaults === "function" ? spec.defaults() : copy(spec.defaults || {});
        return d && typeof d === "object" ? d : {};
    }
    function rootOf(sys) {
        let r = sys._tw;
        if (!r || typeof r !== "object") r = sys._tw = {};
        if (!r._v || typeof r._v !== "object") r._v = {};
        return r;
    }
    // the old key left on $gameSystem as a hidden way to the new place (never saved: not enumerable)
    function alias(sys, name, key) {
        const d = Object.getOwnPropertyDescriptor(sys, name);
        if (d && d.get && d.get._twKey === key) return;
        const get = function() { const r = this._tw; return r ? r[key] : undefined; };
        get._twKey = key;
        Object.defineProperty(sys, name, { configurable: true, enumerable: false, get, set(v) { rootOf(this)[key] = v; } });
    }
    function migrated(spec, data, from) {
        const m = spec.migrate;
        try {
            if (typeof m === "function") {
                const out = m(data, from, spec.version);
                return out && typeof out === "object" ? out : data;
            }
            if (m && typeof m === "object") {   // { 2: s => ..., 3: s => ... }: one step to each version
                for (let v = from + 1; v <= spec.version; v++) {
                    if (typeof m[v] !== "function") continue;
                    const out = m[v](data, v - 1);
                    if (out && typeof out === "object") data = out;
                }
            }
        } catch (e) { report("state '" + spec.key + "' migration " + from + " -> " + spec.version, e); }
        return data;
    }
    // one key on this $gameSystem: adopted from the old key, made, migrated, its missing fields filled
    function ensure(sys, key) {
        const spec = specs[key], r = rootOf(sys);
        let data = r[key];
        if (spec.adopt) {
            const own = Object.getOwnPropertyDescriptor(sys, spec.adopt);
            if (own && "value" in own) {   // (a plain field of an older save - not our alias)
                if ((!data || typeof data !== "object") && own.value && typeof own.value === "object") {
                    data = r[key] = own.value;
                    r._v[key] = spec.adoptVersion;
                } else if (own.value && data) warnOnce("adopt:" + key, "state '" + key + "': both " + spec.adopt + " and _tw." + key + " in the save - _tw kept");
                delete sys[spec.adopt];
            }
            alias(sys, spec.adopt, key);
        }
        if (!data || typeof data !== "object") {
            data = r[key] = freshOf(spec);
            r._v[key] = spec.version;
        }
        const v = num(r._v[key], 1);
        if (v < spec.version) {
            data = r[key] = migrated(spec, data, v);
            r._v[key] = spec.version;
        } else if (v > spec.version) warnOnce("newer:" + key, "state '" + key + "' is v" + v + " in the save, the plugin knows v" + spec.version + " - kept as it is");
        if (!Array.isArray(data)) {
            const fresh = freshOf(spec);
            for (const k of Object.keys(fresh)) if (data[k] === undefined) data[k] = fresh[k];
        }
        return data;
    }
    function ensureAll(sys) {
        if (!sys) return;
        readySys = sys;
        ready = new Set();
        for (const key of Object.keys(specs)) {
            ready.add(key);
            ensure(sys, key);
        }
    }
    function define(key, defaults, opts) {
        if (!KEY_RE.test(String(key))) throw new Error("Tawerna.state: a bad key '" + key + "' (letters, digits, _)");
        const o = opts || {}, had = specs[key];
        if (had && (defaults === undefined || defaults === had.defaults) && (opts === undefined || (num(o.version, 1) === had.version && (o.adopt || "") === had.adopt))) return;
        specs[key] = { key, defaults: defaults === undefined ? {} : defaults, version: Math.max(1, Math.floor(num(o.version, 1))), migrate: o.migrate || null,
            adopt: o.adopt || "", adoptVersion: Math.max(1, Math.floor(num(o.adoptVersion, 1))), owner: o.owner || "" };
        if (readySys && readySys === window.$gameSystem) ready.delete(key);   // (defined during a game: looked over on the next access)
    }
    // Tawerna.state(key) -> the live object; Tawerna.state(key, defaults, opts) defines it too (then the live object, or a throwaway
    // copy of the defaults while there is no game yet)
    T.state = function(key, defaults, opts) {
        if (defaults !== undefined || opts !== undefined || !specs[key]) define(key, defaults, opts);
        const sys = window.$gameSystem;
        if (!sys) return freshOf(specs[key]);
        if (sys !== readySys) { readySys = sys; ready = new Set(); }
        if (!ready.has(key)) {
            ready.add(key);
            return ensure(sys, key);
        }
        const data = sys._tw && sys._tw[key];
        if (data && typeof data === "object") return data;
        ready.delete(key);   // (replaced by something: made again)
        return T.state(key);
    };
    // defines at load time and gives back an accessor: const store = Tawerna.state.define("x", {...}); store().field
    T.state.define = function(key, defaults, opts) {
        define(key, defaults, opts);
        if (window.$gameSystem) T.state(key);   // (a plugin put in during a game: its alias at once)
        return () => T.state(key);
    };
    T.state.keys = () => Object.keys(specs);
    T.state.spec = key => (specs[key] ? Object.assign({}, specs[key]) : null);
    T.state.version = key => { const s = window.$gameSystem, r = s && s._tw; return r && r._v ? num(r._v[key], 0) : 0; };

    // ------------------------------------------------------------------
    // Map injection: events put into a map's data as it loads (the map files stay as they are)
    // ------------------------------------------------------------------
    // The id registry. Ids are game-wide (one id = one owner on every map). The old-style injectors are reserved here until they
    // move to Tawerna.inject; the editor's own events stay far below (the biggest map, Map025, ends at 354).
    const reserved = [
        { owner: "Story", from: 901, to: 902, what: "dziadek (mapa 19), Lord (dwór)" },
        { owner: "TavernLife", from: 950, to: 950, what: "sztaluga z planem karczmy (mapy 1, 25, 26)" },
        { owner: "HomeLife", from: 960, to: 979, what: "kot Mruczek (mapa 19)" },
        { owner: "HomeDecor", from: 980, to: 998, what: "ozdoby domu dziadka (mapa 19)" },
        { owner: "Forestry", from: 1000, to: Infinity, what: "posadzone sosny (każda mapa)" }
    ];
    const injectors = [];     // { owner, from, to, maps(id), mapsText, build, when, fixSaved, editorWins }
    const dataHooks = [];     // { fn, owner }
    const lastInjected = Object.create(null);   // mapId -> { owner: [ids] } of the map's latest load
    let loadingMapId = 0;
    const span = (a, b) => a + (b === a ? "" : "-" + (b === Infinity ? "..." : b));
    function mapsTest(m) {
        if (m === "*" || m === null || m === undefined) return { test: () => true, text: "*" };
        if (typeof m === "function") return { test: id => { try { return !!m(id); } catch (e) { return false; } }, text: "fn" };
        const ids = [].concat(m).map(Number), set = new Set(ids);
        return { test: id => set.has(id), text: ids.join(",") };
    }
    function overlapCheck(owner, from, to) {
        for (const o of reserved.concat(injectors)) {
            if (o.owner !== owner && from <= o.to && o.from <= to) {
                throw new Error("Tawerna.inject: ids " + span(from, to) + " of " + owner + " overlap " + span(o.from, o.to) + " of " + o.owner);
            }
        }
    }
    // Tawerna.inject(19, { ids: [980, 998], owner: "HomeDecor", build(data, mapId) { return [eventData, ...]; } })
    //   maps: a map id, a list, "*" (every map) or fn(mapId); when(mapId): false -> nothing put in, and at Game_Map.setup the owner's
    //   events are taken out of the data again (a story that did not start); fixSaved (true): a saved game on the map gets the missing
    //   events and loses the orphaned ones; editorWins (true): an editor's event on one of the ids is left alone (and told once)
    T.inject = function(maps, spec) {
        const s = spec || {}, ids = s.ids || [];
        const from = Math.floor(num(ids[0], NaN));
        const to = ids[1] === Infinity || ids[1] === "*" ? Infinity : Math.floor(num(ids[1], from));
        const owner = String(s.owner || "");
        if (!owner) throw new Error("Tawerna.inject: an owner is needed");
        if (!(from > 0) || !(to >= from)) throw new Error("Tawerna.inject: bad ids [" + ids + "] of " + owner);
        if (typeof s.build !== "function") throw new Error("Tawerna.inject: " + owner + " has no build(data, mapId)");
        overlapCheck(owner, from, to);
        const m = mapsTest(maps);
        const inj = { owner, from, to, maps: m.test, mapsText: m.text, build: s.build, when: typeof s.when === "function" ? s.when : null,
            fixSaved: s.fixSaved !== false, editorWins: s.editorWins !== false, n: seq++ };
        for (let i = injectors.length - 1; i >= 0; i--) {   // (the same one again - a plugin put into the page twice: the new one)
            const o = injectors[i];
            if (o.owner === owner && o.from === from && o.to === to && o.mapsText === inj.mapsText) injectors.splice(i, 1);
        }
        injectors.push(inj);
        return inj;
    };
    // a range kept for a plugin that injects in its own way (not through Tawerna.inject yet)
    T.inject.reserve = function(owner, from, to, what) {
        overlapCheck(owner, from, to === undefined ? from : to);
        reserved.push({ owner, from, to: to === undefined ? from : to, what: what || "" });
    };
    T.inject.list = () => reserved.map(r => ({ owner: r.owner, ids: span(r.from, r.to), maps: "", what: r.what, active: false }))
        .concat(injectors.map(i => ({ owner: i.owner, ids: span(i.from, i.to), maps: i.mapsText, what: "", active: true })));
    T.injected = function(mapId) {
        const id = mapId === undefined ? ($gameMap ? $gameMap.mapId() : 0) : mapId, got = lastInjected[id] || {};
        const out = {};
        for (const k of Object.keys(got)) out[k] = got[k].slice();
        return out;
    };
    // Tawerna.onMapData((data, mapId) => ...): every map's data right after it loads (after the injections) - notes, tiles
    T.onMapData = function(fn, opts) {
        dataHooks.push({ fn, owner: (opts && opts.owner) || "" });
        return fn;
    };
    const markOwner = (ev, owner) => Object.defineProperty(ev, "_twOwner", { value: owner, enumerable: false, configurable: true, writable: true });
    function processMap(data, mapId) {
        const got = lastInjected[mapId] = {};
        for (const inj of injectors) {
            if (!inj.maps(mapId)) continue;
            if (inj.when) {
                let ok = false;
                try { ok = !!inj.when(mapId); } catch (e) { report("inject " + inj.owner + " when()", e); }
                if (!ok) continue;
            }
            let list = null;
            try { list = inj.build(data, mapId); } catch (e) { report("inject " + inj.owner + " (map " + mapId + ")", e); continue; }
            for (const ev of [].concat(list || [])) {
                if (!ev) continue;
                if (!(ev.id >= inj.from && ev.id <= inj.to)) {
                    warnOnce("id:" + inj.owner + ":" + ev.id, "inject " + inj.owner + ": event id " + ev.id + " is outside " + span(inj.from, inj.to) + " - left out");
                    continue;
                }
                const had = data.events[ev.id];
                if (had && had._twOwner !== inj.owner && inj.editorWins) {
                    warnOnce("editor:" + mapId + ":" + ev.id, "inject " + inj.owner + ": map " + mapId + " has its own event " + ev.id + " - left alone");
                    continue;
                }
                for (let i = data.events.length; i < ev.id; i++) data.events[i] = null;   // (no holes: other code checks events for null)
                if (typeof ev.note === "string" && DataManager.extractMetadata) DataManager.extractMetadata(ev);
                markOwner(ev, inj.owner);
                data.events[ev.id] = ev;
                (got[inj.owner] = got[inj.owner] || []).push(ev.id);
            }
        }
        for (const h of dataHooks) {
            try { h.fn(data, mapId); } catch (e) { report("onMapData" + (h.owner ? " (" + h.owner + ")" : ""), e); }
        }
    }
    const _DataManager_loadMapData = DataManager.loadMapData;
    DataManager.loadMapData = function(mapId) {
        loadingMapId = mapId;
        _DataManager_loadMapData.call(this, mapId);
    };
    const _DataManager_onLoad = DataManager.onLoad;
    DataManager.onLoad = function(object) {
        _DataManager_onLoad.call(this, object);
        if (object && object === window.$dataMap && loadingMapId > 0 && Array.isArray(object.events)) processMap(object, loadingMapId);
    };
    // a map set up while an injector's when() is false: its events leave the data before the map makes its events
    const _Game_Map_setup_inner = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        if (window.$dataMap && Array.isArray($dataMap.events)) {
            for (const inj of injectors) {
                if (!inj.when || !inj.maps(mapId)) continue;
                let ok = true;
                try { ok = !!inj.when(mapId); } catch (e) { ok = false; }
                if (ok) continue;
                for (const id of ((lastInjected[mapId] || {})[inj.owner] || [])) {
                    const d = $dataMap.events[id];
                    if (d && d._twOwner === inj.owner) $dataMap.events[id] = null;
                }
            }
        }
        _Game_Map_setup_inner.call(this, mapId);
    };
    // a saved game on the map (loaded, not transferred): its saved events follow the data - the missing ones come, the orphaned go
    function fixSaved(mapId) {
        const evs = $gameMap._events, got = lastInjected[mapId] || {};
        for (const inj of injectors) {
            if (!inj.fixSaved || !inj.maps(mapId)) continue;
            const ids = new Set(got[inj.owner] || []);
            const last = Math.min(inj.to, evs.length - 1);
            for (let id = inj.from; id <= last; id++) if (evs[id]) ids.add(id);
            for (const id of ids) {
                const d = $dataMap.events[id], ev = evs[id];
                if (d && d._twOwner === inj.owner && !ev) evs[id] = new Game_Event(mapId, id);
                else if (!d && ev) delete evs[id];
            }
        }
    }
    const _Scene_Map_onMapLoaded_inner = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        if (!this._transfer && window.$gameMap && window.$dataMap && Array.isArray($dataMap.events)) fixSaved($gameMap.mapId());
        _Scene_Map_onMapLoaded_inner.call(this);
    };

    // ------------------------------------------------------------------
    // "Calm": the one shared check before doing something by itself (a talk, a bark, a spawn, a popup)
    // ------------------------------------------------------------------
    const CALM = {
        onMap: s => !!s && s === SceneManager._scene && s instanceof Scene_Map,
        sceneChange: () => !SceneManager.isSceneChanging(),
        transfer: () => !(window.$gamePlayer && $gamePlayer.isTransferring()),
        message: () => !(window.$gameMessage && $gameMessage.isBusy()),
        event: () => !(window.$gameMap && $gameMap.isEventRunning()),
        eventStarting: () => !(window.$gameMap && $gameMap.isAnyEventStarting()),
        farmMenu: () => !(window.$gameTemp && $gameTemp._farmMenuOpen),
        build: () => !(window.$gameTemp && $gameTemp._buildMode),
        miniGame: () => !T.miniGameRunning(),
        lock: () => !(window.$gameTemp && $gameTemp._farmLock > 0),
        tool: () => !(window.$gamePlayer && typeof $gamePlayer.isToolSwinging === "function" && $gamePlayer.isToolSwinging()),
        canMove: () => !!(window.$gamePlayer && $gamePlayer.canMove()),
        fade: s => !(window.$gameScreen && $gameScreen.brightness() < 250) && !(s && s.isFading && s.isFading()),
        summary: () => !(window.$gameTemp && $gameTemp._pendingSummary),
        combat: () => !(window.$gameSystem && $gameSystem._combatMode),
        talk: () => { const sb = T.api("SpeechBubbles"), t = sb && typeof sb.talk === "function" ? sb.talk() : null; return !(t && t.on); }
    };
    const PRESETS = {
        auto: ["onMap", "sceneChange", "transfer", "message", "event", "farmMenu", "build", "miniGame"],   // (the default)
        input: ["message", "event"],                                                                          // (a key the player pressed)
        strict: ["onMap", "sceneChange", "transfer", "message", "event", "farmMenu", "build", "miniGame", "tool", "fade", "summary", "lock"]
    };
    const checkLists = new WeakMap();
    function checksOf(opts) {
        if (opts === undefined || opts === null || opts === true) return PRESETS.auto;
        if (typeof opts === "string") return PRESETS[opts] || PRESETS.auto;
        let list = checkLists.get(opts);
        if (list) return list;
        const base = opts.only ? [].concat(opts.only) : (PRESETS[opts.preset] || PRESETS.auto).slice();
        for (const k of Object.keys(CALM)) {
            if (opts[k] === true && !base.includes(k)) base.push(k);
            if (opts[k] === false) { const i = base.indexOf(k); if (i >= 0) base.splice(i, 1); }
        }
        list = base.filter(k => CALM[k]);
        checkLists.set(opts, list);
        return list;
    }
    // Tawerna.isCalm(scene?, opts?) - opts: a preset name ("auto" | "input" | "strict"), or { preset, only: [...], <check>: true|false,
    // settle: frames the map must have been up }
    T.isCalm = function(scene, opts) {
        const s = scene || SceneManager._scene;
        for (const k of checksOf(opts)) if (!CALM[k](s)) return false;
        if (opts && typeof opts === "object" && opts.settle > 0 && !((s && s._twFrames) >= opts.settle)) return false;
        return true;
    };
    // what is not calm now (tests, the F9 menu)
    T.whyNotCalm = function(scene, opts) {
        const s = scene || SceneManager._scene;
        return checksOf(opts).filter(k => !CALM[k](s));
    };
    T.isCalm.CHECKS = Object.keys(CALM);
    T.isCalm.PRESETS = PRESETS;
    // a mini-game scene open (or its result still on the way back): TawernaUI's Scene_MiniGame and the old-style ones
    T.miniGameRunning = function() {
        if (T.ui && T.ui.running) return true;
        if (T.call("TavernShift", "isRunning") || T.call("TavernDice", "isRunning")) return true;
        return !!T.call("TavernLife", "gameState");
    };

    // ------------------------------------------------------------------
    // The map's frame runner: Tawerna.onMapUpdate(fn, { name, owner, calm, every, priority })
    // ------------------------------------------------------------------
    const updaters = [];
    T.onMapUpdate = function(fn, opts) {
        if (typeof fn !== "function") throw new Error("Tawerna.onMapUpdate: not a function");
        const o = opts || {};
        const u = { fn, name: o.name || fn.name || "update", owner: o.owner || "", calm: o.calm || false, every: Math.max(1, Math.floor(num(o.every, 1))),
            priority: num(o.priority, 0), n: seq++, count: 0, calls: 0, ms: 0, max: 0, errors: 0, on: true };
        u.off = () => { const i = updaters.indexOf(u); if (i >= 0) updaters.splice(i, 1); };
        updaters.push(u);
        updaters.sort((a, b) => a.priority - b.priority || a.n - b.n);
        return u;
    };
    // (the calm ones skip the frame; `every` counts the frames an updater could run; one that throws is told and turned off)
    function runUpdaters(scene) {
        for (const u of updaters.slice()) {
            if (!u.on) continue;
            if (u.calm && !T.isCalm(scene, u.calm === true ? undefined : u.calm)) continue;
            if (++u.count % u.every !== 0) continue;
            const t0 = performance.now();
            try { u.fn(scene, u.count); }
            catch (e) { u.errors++; u.on = false; report("map updater " + (u.owner ? u.owner + "." : "") + u.name + " (turned off)", e); }
            const ms = performance.now() - t0;
            u.calls++;
            u.ms += (ms - u.ms) / Math.min(u.calls, 60);
            u.max = Math.max(u.max * 0.995, ms);
        }
    }

    // ------------------------------------------------------------------
    // The calendar: Tawerna.time (DayNightCycle's clock, Farming's seasons)
    // ------------------------------------------------------------------
    const SEASONS = ["Wiosna", "Lato", "Jesień", "Zima"];
    let seasonLen = 0;
    const time = T.time = {
        SEASONS,
        day: () => (window.$gameSystem && typeof $gameSystem.dayNightDay === "function" ? $gameSystem.dayNightDay() : 1),
        hour: () => (window.$gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12),
        // Farming.js's seasonLength (28), read once: 0 spring, 1 summer, 2 autumn, 3 winter, seasonLength days each from day 1
        seasonLength() {
            if (!seasonLen) seasonLen = Math.max(1, num(PluginManager.parameters("Farming").seasonLength, 28));
            return seasonLen;
        },
        season: d => Math.floor(((Math.max(1, d === undefined ? time.day() : d) - 1) / time.seasonLength()) % 4),
        seasonName: d => SEASONS[time.season(d)],
        dayOfSeason: d => ((Math.max(1, d === undefined ? time.day() : d) - 1) % time.seasonLength()) + 1,
        year: d => Math.floor((Math.max(1, d === undefined ? time.day() : d) - 1) / (time.seasonLength() * 4)) + 1,
        // DayNightCycle's periods (dawn 5, morning 8, noon 11, afternoon 15, evening 18, night 21)
        period(h) {
            const hh = h === undefined ? time.hour() : h, D = T.api("DayNightCycle");
            if (D && typeof D.periodAt === "function") return D.periodAt(hh);
            return hh >= 21 || hh < 5 ? { id: "night", name: "Noc", from: 21 } : { id: "day", name: "Dzień", from: 5 };
        },
        isNight: h => { const hh = h === undefined ? time.hour() : h; return hh >= 21 || hh < 5; },
        // n days round the middle of the season (28 days: 4 -> 13-16, 5 -> 12-16)
        around(d, n) {
            const len = time.seasonLength(), mid = Math.round(len / 2), from = mid - Math.floor((n - 1) / 2), dd = time.dayOfSeason(d);
            return dd >= from && dd < from + n;
        },
        isEaster: (d, n) => time.season(d) === 0 && time.around(d === undefined ? time.day() : d, n === undefined ? 4 : n),
        isWigilia: (d, n) => time.season(d) === 3 && time.around(d === undefined ? time.day() : d, n === undefined ? 5 : n)
    };
    // dayStart / hourChange: the clock looked at every map frame and right after a sleep (a new game or a load starts it afresh)
    const clock = { sys: null, day: 0, hour: 0 };
    function resetClock() {
        clock.sys = window.$gameSystem || null;
        clock.day = time.day();
        clock.hour = Math.floor(time.hour());
    }
    function checkClock() {
        const sys = window.$gameSystem;
        if (!sys) return;
        if (clock.sys !== sys) { resetClock(); return; }
        const d = time.day(), h = Math.floor(time.hour());
        if (d !== clock.day) {
            const prev = clock.day, prevHour = clock.hour;
            clock.day = d;
            clock.hour = h;
            T.emit("dayStart", { day: d, prev });
            if (h !== prevHour) T.emit("hourChange", { hour: h, prev: prevHour, day: d });
        } else if (h !== clock.hour) {
            const prev = clock.hour;
            clock.hour = h;
            T.emit("hourChange", { hour: h, prev, day: d });
        }
    }

    // ------------------------------------------------------------------
    // Tags: <Name>, <Name:a,b>, <Name:k=v k2="some text">, <Name:a:b> from notes and page comments (108/408)
    // ------------------------------------------------------------------
    const TAG_RE = /<([A-Za-z][A-Za-z0-9_]*)\s*(?::\s*([^<>]*?))?\s*>/g;
    function value(t) {
        if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return Number(t);
        if (t === "true") return true;
        if (t === "false") return false;
        return t;
    }
    // "a=1,b=2" / "1.4,60" / "bed room=komnata name=\"Komnata z kominkiem\"" / "dice:grum" -> { raw, pos: [...], kv: {...} }
    // (separators: commas, spaces, colons; keys lowercased; numbers and true/false converted; quotes keep spaces and commas)
    T.parseArgs = function(raw) {
        const s = raw === undefined || raw === null ? "" : String(raw).trim();
        const out = { raw: s, pos: [], kv: {} };
        let i = 0;
        const sep = c => c === "," || c === ":" || c === ";" || /\s/.test(c);
        const token = stop => {
            const q = s[i];
            if (q === "\"" || q === "'") {
                const end = s.indexOf(q, i + 1), t = s.slice(i + 1, end < 0 ? s.length : end);
                i = end < 0 ? s.length : end + 1;
                return { t, quoted: true };
            }
            const a = i;
            while (i < s.length && !stop(s[i])) i++;
            return { t: s.slice(a, i), quoted: false };
        };
        while (i < s.length) {
            while (i < s.length && sep(s[i])) i++;
            if (i >= s.length) break;
            const k = token(c => sep(c) || c === "=");
            let j = i;
            while (j < s.length && /\s/.test(s[j])) j++;
            if (s[j] === "=" && !k.quoted && k.t) {
                i = j + 1;
                while (i < s.length && /\s/.test(s[i])) i++;
                const v = token(c => c === "," || c === ";" || /\s/.test(c));
                out.kv[k.t.toLowerCase()] = v.quoted ? v.t : value(v.t);
            } else if (k.t !== "" || k.quoted) {
                out.pos.push(k.quoted ? k.t : value(k.t));
            } else i++;
        }
        return out;
    };
    function commentText(list) {
        let t = "";
        if (Array.isArray(list)) for (const c of list) if (c && (c.code === 108 || c.code === 408)) t += "\n" + (c.parameters[0] || "");
        return t;
    }
    function parseList(text) {
        const list = [];
        TAG_RE.lastIndex = 0;
        let m;
        while ((m = TAG_RE.exec(text))) list.push({ name: m[1], key: m[1].toLowerCase(), args: T.parseArgs(m[2]) });
        return list;
    }
    function mapOf(list) {
        const out = {};
        for (const t of list) if (!(t.key in out)) out[t.key] = t.args;   // (the first one wins, as the plugins read them)
        return out;
    }
    const tagCache = new WeakMap();
    const strCache = new Map();
    function parsed(src) {
        if (src === undefined || src === null) return { list: [], map: {} };
        if (typeof src === "string") {
            let c = strCache.get(src);
            if (!c) {
                const list = parseList(src);
                c = { list, map: mapOf(list) };
                if (strCache.size > 400) strCache.clear();
                strCache.set(src, c);
            }
            return c;
        }
        if (typeof src !== "object") return { list: [], map: {} };
        // a Game_Event: its note and the comments of the page it is on now
        if (window.Game_Event && src instanceof Game_Event) {
            const data = src.event(), page = data ? src.page() : null, note = data ? data.note || "" : "";
            const c = tagCache.get(src);
            if (c && c.data === data && c.page === page && c.note === note) return c;
            const list = parseList(note + (page ? commentText(page.list) : ""));
            const fresh = { data, page, note, list, map: mapOf(list) };
            tagCache.set(src, fresh);
            return fresh;
        }
        // event data (every page's comments), a page (its comments), anything with a note (a map, an item...)
        const note = typeof src.note === "string" ? src.note : "";
        const c = tagCache.get(src);
        if (c && c.note === note) return c;
        let text = note;
        if (Array.isArray(src.pages)) for (const p of src.pages) text += p ? commentText(p.list) : "";
        else if (Array.isArray(src.list)) text += commentText(src.list);
        const list = parseList(text);
        const fresh = { note, list, map: mapOf(list) };
        tagCache.set(src, fresh);
        return fresh;
    }
    T.tags = src => parsed(src).map;
    T.tagList = src => parsed(src).list.map(t => ({ name: t.name, args: t.args }));
    T.tag = (src, name) => parsed(src).map[String(name).toLowerCase()] || null;
    T.hasTag = (src, name) => !!T.tag(src, name);
    // the current map's note: <Name:...> (the first one) and <Name:on|off> -> true / false / dflt. Only a plain on / off counts
    // (<X: on >, any case - as the plugins' old /<X:\s*on\s*>/i did). wins: which one counts when both are there - "on" (the
    // default, as the old copies of mapNoteFlag), "off" (<FreeMove>, <Weather:off>, <Polish:off>, <Clock:off>), "first" (<Farm>, <Build>)
    T.mapTag = name => T.tag(window.$dataMap ? $dataMap.note || "" : "", name);
    T.mapFlag = function(name, dflt, wins) {
        const key = String(name).toLowerCase();
        let on = false, off = false;
        for (const t of parsed(window.$dataMap ? $dataMap.note || "" : "").list) {
            if (t.key !== key) continue;
            const w = t.args.raw.toLowerCase();
            if (w === "on") on = true; else if (w === "off") off = true; else continue;
            if (wins === "first") break;
        }
        if (wins === "off") return off ? false : on ? true : dflt;
        return on ? true : off ? false : dflt;
    };

    // ------------------------------------------------------------------
    // Sound: SEs from a small preloaded pool (never AudioManager's own buffers: a file that fails to load there stops the game with
    // "Failed to load"; here it stays silent), and looping BGS layers beside the map's own BGS, faded in and out
    // ------------------------------------------------------------------
    const audio = T.audio = { seBudget: 6 };   // (SEs a frame: a turbo mini-game would pile them up)
    const sePool = new Map();
    let seFrame = -1, seLeft = 0;
    function sePlayer(name, size) {
        let pool = sePool.get(name);
        if (!pool) {
            pool = { i: 0, list: [] };
            for (let k = 0; k < Math.max(1, size || 3); k++) pool.list.push(AudioManager.createBuffer("se/", name));
            sePool.set(name, pool);
        }
        return pool.list[pool.i++ % pool.list.length];
    }
    // Tawerna.audio.se("Coin", { volume: 90, pitch: 100, pan: 0 }) - the volume is a share of the game's SE option
    audio.se = function(name, opts) {
        if (!name) return false;
        const o = typeof opts === "number" ? { volume: opts } : opts || {};
        if (Graphics.frameCount !== seFrame) { seFrame = Graphics.frameCount; seLeft = audio.seBudget; }
        if (seLeft <= 0) return false;
        try {
            const a = sePlayer(name, o.pool);
            if (a.isError()) { warnOnce("se:" + name, "the SE '" + name + "' did not load - silent"); return false; }
            seLeft--;
            a.volume = (AudioManager.seVolume * num(o.volume, 90)) / 10000;
            a.pitch = num(o.pitch, 100) / 100;
            a.pan = num(o.pan, 0) / 100;
            a.play(false, 0);
            return true;
        } catch (e) { return false; }
    };
    audio.preload = function(names, size) {
        for (const n of [].concat(names || [])) if (n) sePlayer(n, size);
    };
    audio.isMissing = name => { const p = sePool.get(name); return !!(p && p.list[0].isError()); };
    // every pooled SE quiet at once (AudioManager.stopSe calls it too, as it stops the engine's own SEs)
    audio.stopSe = function() { for (const p of sePool.values()) for (const a of p.list) { try { a.stop(); } catch (e) {} } };
    const _AudioManager_stopSe = AudioManager.stopSe;
    AudioManager.stopSe = function() {
        _AudioManager_stopSe.call(this);
        audio.stopSe();
    };
    // A looping layer: layer.set(target 0..100, pan -1..1); every map frame it moves toward the target (in over `fadeIn` frames,
    // out over `fadeOut`), plays while it is heard and stops when silent. Its volume: the game's BGS option x target% x scale().
    const layers = new Map();
    function AudioLayer(key, def) {
        this.key = key;
        this.vol = 0;
        this.target = 0;
        this.pan = 0;
        this.applied = -1;
        this.appliedPan = 9;
        this.buf = null;
        this.configure(def);
    }
    AudioLayer.prototype.configure = function(def) {
        const d = def || {};
        this.name = d.name || this.name || "";
        this.folder = (d.folder || this.folder || "bgs").replace(/\/$/, "");
        this.pitch = num(d.pitch, this.pitch || 100);
        this.max = num(d.max, this.max === undefined ? Infinity : this.max);
        this.fadeIn = num(d.fadeIn, this.fadeIn || 80);
        this.fadeOut = num(d.fadeOut, this.fadeOut || 55);
        if (d.scale !== undefined) this.scale = d.scale;
        if (d.owner) this.owner = d.owner;
        return this;
    };
    AudioLayer.prototype.set = function(target, pan) {
        this.target = Math.max(0, num(target, 0));
        if (pan !== undefined) this.pan = pan;
        return this;
    };
    const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
    AudioLayer.prototype.tick = function() {
        const target = Math.min(this.max, this.target), spanV = Math.max(target, this.vol);
        this.vol = approach(this.vol, target, target > this.vol ? Math.max(0.02, spanV / this.fadeIn) : Math.max(0.02, spanV / this.fadeOut));
        if (this.vol <= 0.05 && target === 0) {
            if (this.buf && this.buf.isPlaying()) this.buf.stop();
            this.applied = -1;
            return;
        }
        if (!this.buf) {
            this.buf = AudioManager.createBuffer(this.folder + "/", this.name);
            this.buf.pitch = this.pitch / 100;
        }
        if (this.buf.isError()) {   // (a file that did not load: silent, never asked to play again)
            warnOnce("layer:" + this.name, "the sound '" + this.folder + "/" + this.name + "' did not load - silent");
            if (this.buf.isPlaying()) this.buf.stop();
            return;
        }
        if (!this.buf.isPlaying()) {
            this.buf.volume = 0;
            this.buf.play(true, 0);
            this.applied = -1;
        }
        const scale = typeof this.scale === "function" ? num(this.scale(), 1) : num(this.scale, 1);
        const vol = (AudioManager.bgsVolume / 100) * (this.vol / 100) * scale;
        if (Math.abs(vol - this.applied) > this.applied * 0.02 + 1e-6) { this.buf.volume = vol; this.applied = vol; }
        if (Math.abs(this.pan - this.appliedPan) > 0.02) { this.buf.pan = this.pan; this.appliedPan = this.pan; }
    };
    // stop now (fade 0) or fade out over `fade` seconds and let go of it
    AudioLayer.prototype.stop = function(fade) {
        this.target = 0;
        this.vol = 0;
        this.applied = -1;
        const buf = this.buf;
        if (!buf || !buf.isPlaying()) return;
        if (fade > 0) {
            buf.fadeOut(fade);
            setTimeout(() => { if (!buf.isPlaying()) buf.stop(); }, fade * 1000 + 60);   // (silent now: let go of it)
        } else buf.stop();
    };
    AudioLayer.prototype.info = function() {
        return { key: this.key, name: this.name, playing: !!(this.buf && this.buf.isPlaying() && !this.buf.isError()), vol: Math.round(this.vol * 100) / 100,
            target: Math.round(this.target * 100) / 100, volume: this.buf ? this.buf.volume : 0, pan: this.pan };
    };
    audio.bgsLayer = function(key, def) {
        const L = layers.get(key);
        if (L) return L.configure(def);
        const made = new AudioLayer(key, def);
        layers.set(key, made);
        return made;
    };
    audio.layer = key => layers.get(key) || null;
    audio.layers = () => Array.from(layers.values()).map(L => L.info());
    audio.stopLayers = function(fade) { for (const L of layers.values()) L.stop(fade || 0); };
    function tickLayers() { for (const L of layers.values()) L.tick(); }
    // the title, a game over, a load: every sound stops, the layers too
    const _AudioManager_stopBgs = AudioManager.stopBgs;
    AudioManager.stopBgs = function() {
        _AudioManager_stopBgs.call(this);
        audio.stopLayers(0);
    };
    const _Scene_Base_fadeOutAll = Scene_Base.prototype.fadeOutAll;
    Scene_Base.prototype.fadeOutAll = function() {
        _Scene_Base_fadeOutAll.call(this);
        audio.stopLayers(this.slowFadeSpeed() / 60);
    };

    // ------------------------------------------------------------------
    // Popups over the hero (SurvivalHUD's loot popups), the top notice, the item menu's help line
    // ------------------------------------------------------------------
    const COLORS = { need: "#ff9f8f", bad: "#ff9f8f", good: "#9ff0a8", info: "#9fd4ff", gold: "#ffe27a", key: "#ffd866", plain: "#ffffff" };
    // Tawerna.popup(text, { icon, kind: "need"|"good"|"info"|"gold", color, gain, top, sub, menu })
    //   top: the notice at the top centre; menu: in a menu scene the help window says it (the item menu); gain: into the gains list
    T.popup = function(text, opts) {
        const o = typeof opts === "number" ? { icon: opts } : opts || {};
        const color = o.color || COLORS[o.kind] || null;
        const tmp = window.$gameTemp, scene = SceneManager._scene;
        if (!tmp || !text) return false;
        if (o.top) {
            if (typeof tmp.pushTopNotice !== "function") return false;
            tmp.pushTopNotice(text, color, o.sub ? { sub: o.sub, subColor: o.subColor } : null);
            return true;
        }
        if (!(scene instanceof Scene_Map)) {
            if (o.menu && scene && scene._helpWindow) { scene._helpWindow.setText(text); return true; }
            return false;
        }
        if (typeof tmp.pushLootPopup !== "function") return false;
        tmp.pushLootPopup(num(o.icon, 0), text, color || COLORS.plain, o.gain ? { gain: o.gain } : undefined);
        return true;
    };
    T.popup.need = (icon, text) => T.popup(text, { icon, kind: "need" });   // "Potrzebujesz siekiery" - the item's icon, nothing more
    T.popup.COLORS = COLORS;

    // ------------------------------------------------------------------
    // Saved-state hooks (inner): the states are looked over the moment a game object set exists
    // ------------------------------------------------------------------
    const _DataManager_createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        _DataManager_createGameObjects.call(this);
        ensureAll(window.$gameSystem);
    };
    const _DataManager_extractSaveContents_inner = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents_inner.call(this, contents);
        ensureAll(window.$gameSystem);
    };

    // ------------------------------------------------------------------
    // The "tell" hooks (outer): put on at Scene_Boot.start, over every plugin loaded before
    // ------------------------------------------------------------------
    let lateDone = false, booting = false;
    function installLate() {
        if (lateDone) return;
        lateDone = true;
        const _setupNewGame = DataManager.setupNewGame;
        DataManager.setupNewGame = function() {
            _setupNewGame.apply(this, arguments);
            resetClock();
            T.emit("newGame", { boot: booting });
        };
        const _extract = DataManager.extractSaveContents;
        DataManager.extractSaveContents = function(contents) {
            _extract.call(this, contents);
            resetClock();
            T.emit("load", { contents });
        };
        const _makeSave = DataManager.makeSaveContents;
        DataManager.makeSaveContents = function() {
            T.emit("save", {});
            return _makeSave.call(this);
        };
        const _setup = Game_Map.prototype.setup;
        Game_Map.prototype.setup = function(mapId) {
            const from = this._mapId || 0;
            T.emit("mapLeave", { mapId: from, to: mapId });
            _setup.call(this, mapId);
            T.emit("mapEnter", { mapId, from });
        };
        const _onMapLoaded = Scene_Map.prototype.onMapLoaded;
        Scene_Map.prototype.onMapLoaded = function() {
            const transfer = !!this._transfer;
            _onMapLoaded.call(this);
            T.emit("mapReady", { mapId: $gameMap.mapId(), transfer, scene: this });
        };
        const _update = Scene_Map.prototype.update;
        Scene_Map.prototype.update = function() {
            _update.call(this);
            this._twFrames = (this._twFrames || 0) + 1;
            checkClock();
            runUpdaters(this);
            tickLayers();
        };
        const _sleep = Game_System.prototype.sleepUntilHour;
        if (typeof _sleep === "function") {
            Game_System.prototype.sleepUntilHour = function(hour) {
                const from = { day: time.day(), hour: time.hour() };
                T.emit("sleep", { day: from.day, hour: from.hour, until: hour });
                const out = _sleep.apply(this, arguments);
                T.emit("wake", { day: time.day(), hour: time.hour(), from });
                checkClock();
                return out;
            };
        }
    }
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        installLate();
        booting = true;
        try { _Scene_Boot_start.call(this); } finally { booting = false; }
    };
    // (put into a running page - the tests: the boot is over, so at once)
    if (SceneManager._scene && !(SceneManager._scene instanceof Scene_Boot)) installLate();

    // ------------------------------------------------------------------
    // For the F9 menu and the tests: what the core holds and what it costs
    // ------------------------------------------------------------------
    const round = (v, n) => Math.round(v * Math.pow(10, n)) / Math.pow(10, n);
    T.debug = {
        states: () => Object.keys(specs).map(k => {
            const s = specs[k], sys = window.$gameSystem, data = sys && sys._tw ? sys._tw[k] : undefined;
            let size = 0;
            try { size = data ? JSON.stringify(data).length : 0; } catch (e) { size = -1; }
            return { key: k, version: s.version, saved: T.state.version(k), adopt: s.adopt, owner: s.owner, size };
        }),
        injections: () => T.inject.list(),
        injected: mapId => T.injected(mapId),
        updaters: () => updaters.map(u => ({ name: u.name, owner: u.owner, calm: u.calm === true ? "auto" : u.calm || false, every: u.every,
            priority: u.priority, ms: round(u.ms, 3), max: round(u.max, 2), calls: u.calls, errors: u.errors, on: u.on })),
        listeners: () => {
            const out = {};
            for (const k of Object.keys(listeners)) out[k] = listeners[k].map(l => l.owner || "?");
            return out;
        },
        layers: () => audio.layers(),
        frameMs: () => round(updaters.reduce((s, u) => s + (u.on ? u.ms : 0), 0), 3),
        // the lines the F9 menu shows (Debug.js, the "Rdzeń" tab): the time a frame, the states, the map's updaters, the id ranges,
        // what was put into this map, who listens on the bus
        lines() {
            const out = ["Tawerna " + T.VERSION + " - na klatkę: " + T.debug.frameMs() + " ms"];
            out.push("Stany: " + T.debug.states().map(s => s.key + " v" + s.saved + "/" + s.version).join(", "));
            out.push("Zegary mapy:");
            for (const u of T.debug.updaters()) out.push("  " + (u.owner ? u.owner + "." : "") + u.name + ": " + u.ms + " ms" + (u.every > 1 ? " (co " + u.every + ")" : "") + (u.on ? "" : " WYŁĄCZONY"));
            out.push("Numery zdarzeń:");
            const ranges = new Map();   // (a reserved range and the live injector on it: one line)
            for (const r of T.debug.injections()) {
                const k = r.owner + " " + r.ids, had = ranges.get(k) || {};
                ranges.set(k, { ids: r.ids, owner: r.owner, what: had.what || r.what, maps: had.maps || r.maps, active: had.active || r.active });
            }
            for (const r of Array.from(ranges.values()).sort((a, b) => parseInt(a.ids, 10) - parseInt(b.ids, 10))) {
                out.push("  " + r.ids + " " + r.owner + (r.active ? " (inject" + (r.maps && r.maps !== "*" ? ", mapy " + r.maps : "") + ")" : "") + (r.what ? ": " + r.what : ""));
            }
            const inj = T.injected();
            out.push("Wstawione tu: " + (Object.keys(inj).map(k => k + " " + inj[k].join(",")).join("; ") || "nic"));
            const ls = T.debug.listeners(), heard = Object.keys(ls).filter(k => ls[k].length);
            out.push("Szyna: " + (heard.map(k => k + " " + ls[k].length).join(", ") || "nikt nie słucha"));
            return out;
        }
    };
    T.ui = T.ui || { running: null };
})();
