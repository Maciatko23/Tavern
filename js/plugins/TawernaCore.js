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
 *  Tawerna.state.oldFields(klucz, { _staraNazwa: "pole" })
 *      dawne proste pola $gameSystem jako pola stanu (stara nazwa prowadzi
 *      do pola; pole starego zapisu przechodzi przy wczytaniu).
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
 *  Tawerna.talk - rozmowy z postaciami: przejęcia rozmowy z nazwanym
 *      priorytetem (takeover), opcje dopisywane do menu postaci (option),
 *      run / rows / menu; pożegnanie zawsze na końcu (docs/ROZMOWY.md).
 *  Tawerna.onEventStart / onEventList - start zdarzenia i jego polecenia:
 *      jeden hak rdzenia z priorytetami zamiast haków każdej wtyczki.
 *  Tawerna.has("Wtyczka"), Tawerna.api("Wtyczka"), Tawerna.call(...)
 *  Tawerna.debug - stany, wstawienia, zegary (czas na klatkę) dla F9.
 *  <Px:dx,dy> w notatce zdarzenia - jego obrazek przesunięty o piksele
 *      (np. przedmiot na środku blatu stołu).
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
    // The view (2026-10-18, the white eagle's flight - Orzel_Lot.js): how much of the map WORLD the screen shows, in the world's own
    // pixels. Normally the screen itself (Graphics.width x Graphics.height, scale 1 - every number exactly as before); while the world is
    // drawn smaller (flying high: scale 0.5) the screen shows 1/scale times more of it. Whatever lives INSIDE the map's spriteset (a layer
    // the size of the screen - the night, the rain -, a cull "is it on the screen", a count by the screen's area) asks Tawerna.view.w() /
    // .h(), not Graphics; the interface on the scene (the HUD, the windows, the bubbles) keeps Graphics.
    //   Tawerna.view() -> { w, h, s }; Tawerna.view.w() / .h() / .scale(); Tawerna.view.setScale(s) (Orzel_Lot only; "viewScale" on the bus)
    // ------------------------------------------------------------------
    let viewScale = 1;
    T.view = () => ({ w: Graphics.width / viewScale, h: Graphics.height / viewScale, s: viewScale });
    T.view.w = () => Graphics.width / viewScale;
    T.view.h = () => Graphics.height / viewScale;
    T.view.scale = () => viewScale;
    // (2026-10-24, wydajność) the part of the map world the screen shows now, in the tilemap's own px - where the characters' sprites
    // and the layers in the tilemap stand: { x0, y0, x1, y1 }, read from the tilemap's place on the last drawn frame (the eagle's
    // flight, a zoom, a shake are in it); the screen itself while there is no map. T.view.sees(x0, y0, x1, y1): a box of the tilemap
    // touches it - a thing off it need not be drawn (culling: "is it on the screen").
    const viewBox = { f: -1, x0: 0, y0: 0, x1: 0, y1: 0 };
    T.view.rect = function() {
        if (viewBox.f === Graphics.frameCount) return viewBox;
        viewBox.f = Graphics.frameCount;
        const s = SceneManager._scene, tm = s && s._spriteset && s._spriteset._tilemap, wt = tm && tm.worldTransform;
        const W = Graphics.width, H = Graphics.height;
        if (wt && wt.b === 0 && wt.c === 0 && wt.a > 0 && wt.d > 0) {
            viewBox.x0 = -wt.tx / wt.a; viewBox.x1 = (W - wt.tx) / wt.a;
            viewBox.y0 = -wt.ty / wt.d; viewBox.y1 = (H - wt.ty) / wt.d;
        } else if (wt && (wt.b !== 0 || wt.c !== 0 || !(wt.a > 0) || !(wt.d > 0))) {
            viewBox.x0 = viewBox.y0 = -Infinity; viewBox.x1 = viewBox.y1 = Infinity;   // (turned or mirrored: everything counts as seen)
        } else {
            viewBox.x0 = 0; viewBox.y0 = 0; viewBox.x1 = W / viewScale; viewBox.y1 = H / viewScale;
        }
        return viewBox;
    };
    T.view.sees = function(x0, y0, x1, y1) {
        const r = T.view.rect();
        return x1 >= r.x0 && x0 <= r.x1 && y1 >= r.y0 && y0 <= r.y1;
    };
    T.view.setScale = function(s) {
        const v = s > 0 && isFinite(s) ? s : 1;
        if (v === viewScale) return viewScale;
        viewScale = v;
        if (typeof T.emit === "function") T.emit("viewScale", viewScale);
        return viewScale;
    };

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
        // (Tawerna.state.oldFields: an older save's own plain fields - and those a constructor wrote before this was the live game's
        // $gameSystem - move into the state's fields; the prototype's getter / setter takes over the old names)
        if (spec.oldFields) for (const [name, field] of spec.oldFields) {
            const own = Object.getOwnPropertyDescriptor(sys, name);
            if (!own || !("value" in own)) continue;
            delete sys[name];
            if (own.value !== undefined) data[field] = own.value;
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
            adopt: o.adopt || "", adoptVersion: Math.max(1, Math.floor(num(o.adoptVersion, 1))), owner: o.owner || "", oldFields: had ? had.oldFields : null };
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
    // Old plain fields of $gameSystem (a flag, a number, a record) kept now in a state's fields:
    //   Tawerna.state.oldFields("clock", { _dayNightHour: "hour", _dayNightDay: "day" })
    // The old names lead to the fields - a getter / setter on Game_System.prototype, never saved - so older code, other plugins and
    // the tests read and write them as before; an older save's own fields move in when the state is looked over (ensure, right after
    // the save is read). Another Game_System than the live game's (a save being read, a test's own) keeps plain own fields.
    // (`delete $gameSystem._x` does nothing now: set it to null instead.)
    T.state.oldFields = function(key, map) {
        const spec = specs[key];
        if (!spec) throw new Error("Tawerna.state.oldFields: the state '" + key + "' is not defined");
        const pairs = Object.entries(map || {});
        spec.oldFields = (spec.oldFields || []).filter(p => !pairs.some(q => q[0] === p[0])).concat(pairs);
        for (const [name, field] of pairs) {
            Object.defineProperty(Game_System.prototype, name, { configurable: true, enumerable: false,
                get() {
                    const r = this._tw, s = r && r[key];   // (the quick way first: some are read many times a frame)
                    if (s && typeof s === "object") return s[field];
                    return this === window.$gameSystem ? T.state(key)[field] : undefined;
                },
                set(v) {
                    if (this === window.$gameSystem) T.state(key)[field] = v;
                    else Object.defineProperty(this, name, { value: v, writable: true, enumerable: true, configurable: true });
                } });
        }
        if (window.$gameSystem && ready.has(key) && readySys === window.$gameSystem) ensure(window.$gameSystem, key);   // (put in during a game)
    };
    T.state.keys = () => Object.keys(specs);
    T.state.spec = key => (specs[key] ? Object.assign({}, specs[key]) : null);
    T.state.version = key => { const s = window.$gameSystem, r = s && s._tw; return r && r._v ? num(r._v[key], 0) : 0; };

    // ------------------------------------------------------------------
    // The map's drawing order: the tilemap sorts its sprites by z, then y. A sprite put into it without a z (a plugin's controller
    // layer that draws nothing itself - Humans', Creatures') made the engine's sort inconsistent: undefined - 3 is NaN, which the
    // sort takes as "equal" to everything, and a sprite added after such a layer stayed where it was - the bear was drawn over
    // every tree, even the ones in front of it (user 2026-10-07: "niedźwiedź wchodzi na drzewa"). A missing z counts as 0 now.
    // ------------------------------------------------------------------
    Tilemap.prototype._compareChildOrder = function(a, b) {
        const za = a.z === undefined ? 0 : a.z, zb = b.z === undefined ? 0 : b.z;
        if (za !== zb) return za - zb;
        if (a.y !== b.y) return a.y - b.y;
        return a.spriteId - b.spriteId;
    };
    // <Px:dx,dy> in an event's note: its picture drawn that many pixels off its cell (2026-10-22, user: "książki leżą na krawędzi
    // stołu" - an item tile on a two-row table stands half off it in either cell; tools/mapy/popraw.py puts such an item as an
    // event with its tile's picture, moved onto the middle of the table top)
    const pxOff = new WeakMap();
    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        const ch = this._character;
        if (!(ch instanceof Game_Event)) return;
        if (!pxOff.has(ch)) {
            const d = ch.event(), m = d && /<Px:(-?\d+),(-?\d+)>/i.exec(d.note || "");
            pxOff.set(ch, m ? [Number(m[1]), Number(m[2])] : null);
        }
        const o = pxOff.get(ch);
        if (o) { this.x += o[0]; this.y += o[1]; }
    };

    // ------------------------------------------------------------------
    // Map injection: events put into a map's data as it loads (the map files stay as they are)
    // ------------------------------------------------------------------
    // The id registry. Ids are game-wide (one id = one owner on every map). The old-style injectors are reserved here until they
    // move to Tawerna.inject; the editor's own events stay far below (the biggest map, Map025, ends at 354).
    const reserved = [
        // (2026-10-16) the six island places (docs/miejsca_wyspy/PAKIETY.md): one owner per package, the same name in its Tawerna.inject
        { owner: "Pustelnia", from: 600, to: 609, what: "pustelnia na klifie i skryptorium (mapy 155, 156)" },
        { owner: "Kruk", from: 610, to: 629, what: "Urwisko Kruków, kruczarnia, oswojony kruk (mapa 157 i inne)" },
        { owner: "Latarnia", from: 630, to: 639, what: "przylądek z latarnią (mapy 159-161)" },
        { owner: "Garnizon", from: 640, to: 669, what: "garnizon nad zatoką (mapy 162, 163; werbownik na rynku)" },
        { owner: "Wrak", from: 670, to: 679, what: "wrak na mieliźnie, pod pokładem (mapy 165, 166), rozbitek" },
        { owner: "Cysterna", from: 680, to: 689, what: "stara cysterna zakonu (mapa 167, zasuwa na 147, krata na 157)" },
        { owner: "Wyspa", from: 690, to: 699, what: "przejścia do nowych miejsc na mapach użytkownika (125, 13) - wspólny rdzeń Wyspa.js" },
        // (2026-10-17) W7 "Dwór z kamieni twierdzy" (Dwor.js): the Lord showing the hero round the hall and the library, Feliks
        // coming up the study's trapdoor, his letters on the desk (maps 172-174), Feliks and Kuba at the hatch at night (Map024)
        { owner: "Dwor", from: 570, to: 599, what: "W7: dwór Lorda - Lord w holu i bibliotece, Feliks i listy w gabinecie (mapy 172-174), Feliks i Kuba przy włazie nocą (mapa 24)" },
        // (2026-10-17) W4 "Krew kasztelana" ch. 6-8 (Kasztelan.js): Borgar by the grate in the cellar with his fire basket (Map009), his
        // post at the tenth gate - Borgar, the fire, the basket (Map140)
        { owner: "Kasztelan", from: 540, to: 559, what: "W4: Borgar przy kracie w piwnicy (mapa 9), posterunek Borgara przy dziesiątej bramie (mapa 140)" },
        { owner: "Story", from: 901, to: 902, what: "dziadek (mapa 19), Lord (dwór)" },
        // (2026-10-18) the white eagle (Orzel.js): the climbers' path on the user's Map013, the ridge's things on Map175 (Orla Grań)
        { owner: "Orzel", from: 500, to: 539, what: "biały orzeł: ścieżka na Orlą Grań (mapa 13), gniazdo, orlica, misa, obóz i klatka (mapa 175)" },
        { owner: "Homes", from: 700, to: 729, what: "działka po stracie: ludzie Lorda, znak, straż (mapy 3, 4, 23); droga i drogowskaz do Spalonej zagrody (mapa 23); dym z komina i Marta przy grobie (mapa 168)" },
        // (2026-10-17) W5 "Towary z kontynentu" (Kantor.js): the kantor's trapdoor, stack and counter (Map103), the night visitors of
        // the back door (Map008), the cellar (Map171), the smugglers' camp (Map023), the ferry night's cart (Map022)
        { owner: "Kantor", from: 730, to: 759, what: "W5: kantor nocą (klapa, skrzynie, lada - mapa 103), goście tylnych drzwi (mapa 8), piwnica kantoru (mapa 171), obóz przemytników (mapa 23), wóz w noc promu (mapa 22)" },
        // (2026-10-17) W9 ch. 3 "Rywal w ruinach" (Rywal.js): the rival's traces on floors 1-10 (maps 131-140), Ruiny Zamku, their
        // camp at the meeting, the witnesses before the Heart's door (Map011)
        { owner: "Rywal", from: 828, to: 839, what: "W9 rozdz. 3: ślady i obóz rywala na piętrach 1-10 (mapy 131-140), Ruiny Zamku (10), świadkowie przed Komnatą Serca (11)" },
        { owner: "TownLife", from: 910, to: 949, what: "mieszkańcy miasteczka (mapa 8)" },
        { owner: "TavernLife", from: 950, to: 950, what: "sztaluga z planem karczmy (mapy 1, 25, 26)" },
        { owner: "TownQuests", from: 951, to: 959, what: "miejsca questów miasteczka (mapy 8, 22)" },
        { owner: "HomeLife", from: 960, to: 979, what: "kot Mruczek (mapa 19)" },
        { owner: "HomeDecor", from: 980, to: 998, what: "ozdoby domu dziadka (mapa 19)" },
        // (2026-10-21) the planted pines end at 1999 (Forestry.js gives out the first free id of 1000-1999), the land above is the new
        // terrain's packages' (docs/rozszerzenia/PLAN.md, pakiet 0): one owner per package, the same name in its Tawerna.inject
        { owner: "Forestry", from: 1000, to: 1999, what: "posadzone sosny (każda mapa)" },
        { owner: "Okolice", from: 2000, to: 2099, what: "nowy teren: rdzeń (pakiet 0)" },
        { owner: "Zasoby", from: 2100, to: 2299, what: "nowy teren: paczka A „Woda i zasoby”" },
        { owner: "Lowy", from: 2300, to: 2499, what: "nowy teren: paczka B „Zwierzęta i łowy”" },
        { owner: "Ludzie", from: 2500, to: 2699, what: "nowy teren: paczka C „Ludzie”" },
        { owner: "Zakon", from: 2700, to: 2899, what: "nowy teren: paczka D „Tajemnice i zakon”" },
        { owner: "TownLife", from: 2900, to: 2949, what: "mieszkańcy paczek nowego terenu (drugi zakres)" },
        // (2026-10-22) the new Podgrodzie's residents (docs/podgrodzie/NOWE_PODGRODZIE.md): 2900-2949 is given out (packages A-D,
        // the new town 2940-2947, 2948-2949 the tests' and spare) - a third range of the same owner
        { owner: "TownLife", from: 2950, to: 2959, what: "nowi mieszkańcy Podgrodzia (trzeci zakres; 2950-2953 dane)" },
        // (2026-10-28) the ferry's travellers (docs/PODROZNI.md 6.6): their scenes' actors and props (Podroznicy.js), and the
        // travellers themselves as residents of the town - TownLife's fourth range (Podroznicy_Data.js)
        { owner: "Podroznicy", from: 3002, to: 3019, what: "podróżni z promu: aktorzy scen na przystani (3002-3008), trap i rekwizyty (3010-3017)" },
        { owner: "TownLife", from: 3020, to: 3049, what: "podróżni z promu jako mieszkańcy (czwarty zakres: obsada 3020-3033, Kompania 3034-3037, pula 3038-3041, Ksenia 3042, trójka 3043)" },
        { owner: "Lancuchy", from: 3050, to: 3069, what: "łańcuchy podróżnych: W15 „Święte kości” - kurier Baltazara na piętrze gości (3050; SwieteKosci.js), W16 „Dezerter” - Tymon w kryjówce, garnizonie, obozie (3060; Dezerter.js)" }
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
    const lastData = {};   // mapId -> { id: the event data put in last time }
    function processMap(data, mapId) {
        const got = lastInjected[mapId] = {}, before = lastData[mapId] || {}, now = lastData[mapId] = {};
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
                now[ev.id] = ev;
                (got[inj.owner] = got[inj.owner] || []).push(ev.id);
            }
        }
        // a transfer within the same map: the engine keeps the map's live events (no Game_Map.setup) but takes the new data - an
        // injected event the new data no longer has (its when() went false, its build left it out) keeps its old data till the map is
        // set up again; else it would be a live event without data, and whatever reads its note fails (WaterFx: Act3 found it 2026-10-07).
        // Not with a reload asked for (requestMapReload: the map is set up again from the new data - the Heart's endings send the scenes'
        // cast away so; keeping it would bring it back)
        const P = window.$gamePlayer, M = window.$gameMap;
        if (P && M && P.isTransferring() && !P._needsMapReload && P.newMapId() === mapId && M.mapId() === mapId && Array.isArray(M._events)) {
            for (const key of Object.keys(before)) {
                const id = Number(key), ev = before[key];
                if (data.events[id] || !M._events[id]) continue;
                for (let i = data.events.length; i < id; i++) data.events[i] = null;
                data.events[id] = ev;
                now[id] = ev;
                (got[ev._twOwner] = got[ev._twOwner] || []).push(id);
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
        combat: () => { const r = window.$gameSystem && $gameSystem._tw, c = r && r.combat; return !(c && c.mode); },   // (Combat.js's state; the old name _combatMode leads there)
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
    // Talks with characters (2026-10-23, docs/ROZMOWY.md, docs/ARCHITEKTURA.md section 16): ONE service for every system that speaks
    // through a character. Before it each plugin hooked TownLife's talk (addTalkHook, "first" = put at the front) or another plugin's
    // menu (addMenu) in its own way, and the order of the plugin list decided who spoke - a shop once took Kłos's whole talk and his
    // lines were gone. Now:
    //   - a talk = the character's own lines (the `base` of whoever starts the talk: TownLife's line of the hour, Story's grandpa...),
    //     unless a TAKEOVER wants it: Tawerna.talk.takeover({ owner, who, priority, run(ctx) -> commands | null }). The takeovers are
    //     asked from the highest priority down (named levels: Tawerna.talk.PRIORITY), the first with commands has the talk;
    //   - a character's MENU (Kłos's, Tadek's, a shopkeeper's...) = its own rows + the OPTIONS other systems add:
    //     Tawerna.talk.option({ owner, who, when(ctx), label, order, cmds(ctx) | run(ctx), say }), merged by `order`
    //     (Tawerna.talk.ORDER), the farewell always last (Tawerna.talk.menu);
    //   - at equal priority / order: the owner's name, then the order of its own calls - never the plugin list.
    // who: a character's key ("kwatermistrz" - TownLife's residents; "zolnierz:beczki", "borgar", "grandpa"...), a list of keys, "*",
    // a RegExp or fn(key, ctx). ctx: { who, ev, interp, eventId, skip }. The commands are the engine's (101/401 with \SPK[n], 102/402/404),
    // so SpeechBubbles shows them as before (bubbles over the speaker; O picks, P - the last row - goes back).
    // ------------------------------------------------------------------
    // (2026-10-23, the user's rule: a shop is one more row of a character's menu and never takes its lines) a shop opens by itself
    // only when nobody above has anything to say: the quests' content, the owners' errands, the letters, the hermitage... - below
    // "quest", above the greeting of the day (a shop's menu says its own greeting)
    const TALK_PRIORITY = {
        scene: 1000,     // a scene of a quest or of the story that must have the talk whatever else is there
        errand: 900,     // another system's short errand at someone's talk ("Nie, w innej sprawie" lets the rest speak)
        owner: 700,      // the system that owns the character or the place: its first meeting, its menu, its errands
        handBack: 650,   // something to hand back to its owner (the raven's letters)
        meet: 600,       // the harbour's and the hermitage's people: first meetings, their own menus
        wrap: 550,       // the usual talk with one more item after it
        quest: 500,      // the town's quests: hand-ins, offers, reminders, the steps' talks, remarks
        shop: 450,       // a trade menu of a character without one of its own: only when all the above have nothing
        greet: 400,      // the greeting of the day (TownQuests, by the town's opinion)
        after: 300       // only when the quests have nothing and no greeting is due
    };
    const TALK_ORDER = { first: 0, own: 100, extra: 500, chat: 800 };
    const END = () => ({ code: 0, indent: 0, parameters: [] });
    const takeovers = [], talkOptions = [];
    let talkLast = { who: "", by: "", frame: -1 };
    function whoTest(who) {
        if (who === undefined || who === null || who === "*") return () => true;
        if (typeof who === "function") return (key, ctx) => { try { return !!who(key, ctx); } catch (e) { report("talk who()", e); return false; } };
        if (who instanceof RegExp) return key => who.test(String(key));
        const set = new Set([].concat(who).map(String));
        return key => set.has(String(key));
    }
    const whoText = who => (who === undefined || who === null || who === "*" ? "*" : typeof who === "function" ? "fn" : who instanceof RegExp ? String(who) : [].concat(who).join(","));
    const bandOf = p => { let best = ""; for (const k of Object.keys(TALK_PRIORITY)) if (p >= TALK_PRIORITY[k] && (!best || TALK_PRIORITY[k] > TALK_PRIORITY[best])) best = k; return best || "base"; };
    const byPriority = (a, b) => b.priority - a.priority || (a.owner < b.owner ? -1 : a.owner > b.owner ? 1 : 0) || a.n - b.n;
    function priorityOf(p, what) {
        if (typeof p === "string" && TALK_PRIORITY[p] !== undefined) return TALK_PRIORITY[p];
        const v = num(p, NaN);
        if (!isFinite(v)) throw new Error("Tawerna.talk." + what + ": a priority is needed (a number or a name of Tawerna.talk.PRIORITY)");
        return v;
    }
    const skipSet = s => new Set(s === undefined || s === null || s === "" ? [] : [].concat(s).map(String));
    const talk = T.talk = { PRIORITY: TALK_PRIORITY, ORDER: TALK_ORDER };
    // Tawerna.talk.takeover({ owner, who, priority, run, name }) -> off()
    talk.takeover = function(spec) {
        const s = spec || {}, owner = String(s.owner || "");
        if (!owner) throw new Error("Tawerna.talk.takeover: an owner is needed");
        if (typeof s.run !== "function") throw new Error("Tawerna.talk.takeover: " + owner + " has no run(ctx)");
        const name = String(s.name || "");
        for (let i = takeovers.length - 1; i >= 0; i--) if (takeovers[i].owner === owner && takeovers[i].name === name) takeovers.splice(i, 1);   // (the same one again: the new one)
        const t = { owner, name, who: s.who, whoText: whoText(s.who), test: whoTest(s.who), priority: priorityOf(s.priority, "takeover"), run: s.run, n: seq++ };
        takeovers.push(t);
        takeovers.sort(byPriority);
        return () => { const i = takeovers.indexOf(t); if (i >= 0) takeovers.splice(i, 1); };
    };
    // Tawerna.talk.option({ owner, who, when, label, order, cmds | run, say, id }) -> off(); label / cmds / say may be fn(ctx)
    //   or { owner, who, when, order, rows(ctx) -> [{ label, cmds, say }] } - several rows at once (a list that changes: a shop's goods)
    talk.option = function(spec) {
        const s = spec || {}, owner = String(s.owner || "");
        if (!owner) throw new Error("Tawerna.talk.option: an owner is needed");
        if (!s.label && typeof s.rows !== "function") throw new Error("Tawerna.talk.option: " + owner + " has no label (nor rows)");
        const id = owner + ":" + (s.id !== undefined ? s.id : whoText(s.who) + ":" + (typeof s.label === "string" ? s.label : seq));
        for (let i = talkOptions.length - 1; i >= 0; i--) if (talkOptions[i].id === id) talkOptions.splice(i, 1);
        const o = { id, owner, who: s.who, whoText: whoText(s.who), test: whoTest(s.who), when: typeof s.when === "function" ? s.when : null, label: s.label,
            rows: typeof s.rows === "function" ? s.rows : null,
            order: num(s.order, TALK_ORDER.extra), cmds: s.cmds || null, run: typeof s.run === "function" ? s.run : null, say: s.say || "", n: seq++ };
        talkOptions.push(o);
        return () => { const i = talkOptions.indexOf(o); if (i >= 0) talkOptions.splice(i, 1); };
    };
    function ctxOf(interp, who, o) {
        const ev = o.ev || (interp && window.$gameMap && typeof interp.eventId === "function" ? $gameMap.event(interp.eventId()) : null) || null;
        return { who, ev, interp: interp || null, eventId: ev ? ev.eventId() : interp && typeof interp.eventId === "function" ? interp.eventId() : 0, skip: skipSet(o.skip) };
    }
    // the commands of the talk now: the first takeover's, else base(ctx) -> { list, by } (nothing is played)
    talk.resolve = function(interp, who, opts) {
        const o = opts || {}, ctx = ctxOf(interp, who, o);
        for (const t of takeovers.slice()) {
            if (ctx.skip.has(t.owner) || !t.test(who, ctx)) continue;
            let list = null;
            try { list = t.run(ctx); } catch (e) { report("talk: takeover of " + t.owner + (t.name ? "." + t.name : "") + " (" + who + ")", e); }
            if (list && list.length) return { list, by: t.owner, ctx };
        }
        if (typeof o.base === "function") {
            let list = null;
            try { list = o.base(ctx); } catch (e) { report("talk: the own lines of " + who, e); }
            if (list && list.length) return { list, by: o.owner || "", ctx };
        }
        return { list: null, by: "", ctx };
    };
    // Tawerna.talk.run(interp, who, { ev, base(ctx), owner, skip }) - plays the talk in a child of the interpreter; -> who had it ("" none)
    //   skip: an owner (or a list) left out this time - "Porozmawiaj" / "Nie, w innej sprawie": the same talk without that one
    talk.run = function(interp, who, opts) {
        const r = talk.resolve(interp, who, opts);
        talkLast = { who: String(who), by: r.by, frame: Graphics.frameCount };
        if (r.list && interp) interp.setupChild(r.list.concat([END()]), r.ctx.eventId);
        return r.by;
    };
    talk.last = () => Object.assign({}, talkLast);
    // a menu's rows: own rows ({ label, cmds, say, order } - order Tawerna.talk.ORDER.own unless given) and the options for this
    // character, in order; opts.owner: only that owner's options (its own rows then too: none)
    talk.rows = function(who, ctx, own, opts) {
        const o = opts || {}, c = Object.assign({ who, ev: null, interp: null, eventId: 0, skip: skipSet() }, ctx || {}, { who });
        if (!(c.skip instanceof Set)) c.skip = skipSet(c.skip);
        const rows = [];
        (own || []).forEach((r, i) => { if (r && r.label) rows.push({ label: r.label, cmds: r.cmds || [], say: r.say || "", order: num(r.order, TALK_ORDER.own), owner: "", k: i }); });
        for (const opt of talkOptions) {
            if ((o.owner && opt.owner !== o.owner) || c.skip.has(opt.owner) || !opt.test(who, c)) continue;
            try {
                if (opt.when && !opt.when(c)) continue;
                if (opt.rows) {
                    let j = 0;
                    for (const r of opt.rows(c) || []) {
                        if (r && r.label) rows.push({ label: r.label, cmds: r.cmds || [], say: r.say || "", order: opt.order, owner: opt.owner, k: 1e9 + opt.n + (j++) / 1000 });
                    }
                    continue;
                }
                const label = typeof opt.label === "function" ? opt.label(c) : opt.label;
                if (!label) continue;
                const cmds = opt.run ? [{ code: 355, indent: 0, parameters: ["Tawerna.talk.pick(this, " + JSON.stringify(opt.id) + ", " + JSON.stringify(String(who)) + ")"] }]
                    : typeof opt.cmds === "function" ? opt.cmds(c) || [] : (opt.cmds || []).map(x => Object.assign({}, x));
                rows.push({ label, cmds, say: typeof opt.say === "function" ? opt.say(c) || "" : opt.say, order: opt.order, owner: opt.owner, k: 1e9 + opt.n });
            } catch (e) { report("talk: option " + opt.id, e); }
        }
        rows.sort((a, b) => a.order - b.order || (a.owner < b.owner ? -1 : a.owner > b.owner ? 1 : 0) || a.k - b.k);
        return rows;
    };
    // a choice of labels and branches (as the plugins' own choiceTo): 102, one 402 + its commands each, 404
    talk.choice = function(out, labels, branches, cancel, indent) {
        const i0 = indent || 0;
        out.push({ code: 102, indent: i0, parameters: [labels, cancel === undefined ? labels.length - 1 : cancel, 0, 2, 0] });
        labels.forEach((l, i) => {
            out.push({ code: 402, indent: i0, parameters: [i, l] });
            for (const c of (branches && branches[i]) || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + i0 + 1 }));
            out.push({ code: 0, indent: i0 + 1, parameters: [] });
        });
        out.push({ code: 404, indent: i0, parameters: [] });
        return out;
    };
    // a menu: the rows, then the farewell (always last; P picks it): bye = "Bywaj." or { label, cmds }
    talk.menu = function(out, rows, bye, indent) {
        const b = typeof bye === "object" && bye ? bye : { label: bye || "Bywaj.", cmds: [] };
        const labels = rows.map(r => r.label).concat([b.label]), branches = rows.map(r => r.cmds || []).concat([b.cmds || []]);
        return talk.choice(out, labels, branches, labels.length - 1, indent);
    };
    // a row given as run(ctx): Tawerna.talk.pick(this, id, who) in its branch; the commands it gives back play in a child
    talk.pick = function(interp, id, who) {
        const opt = talkOptions.find(o => o.id === id);
        if (!opt || !opt.run) return false;
        const ctx = ctxOf(interp, who, {});
        let list = null;
        try { list = opt.run(ctx); } catch (e) { report("talk: option " + id, e); return false; }
        if (list && list.length && interp) interp.setupChild(list.concat([END()]), ctx.eventId);
        return true;
    };
    // who would be asked for this character, from the first (F9, the tests, docs/ROZMOWY.md)
    talk.takeovers = who => takeovers.filter(t => who === undefined || t.test(who, { who, skip: skipSet() }))
        .map(t => ({ owner: t.owner, name: t.name, who: t.whoText, priority: t.priority, band: bandOf(t.priority) }));
    talk.options = who => talkOptions.filter(o => who === undefined || o.test(who, { who, skip: skipSet() }))
        .map(o => ({ id: o.id, owner: o.owner, who: o.whoText, order: o.order }));

    // ------------------------------------------------------------------
    // An event about to start, and the commands an event runs: one hook each for every system (2026-10-23; before - 8 plugins wrapped
    // Game_Event.start and 10 wrapped Game_Event.list, and the plugin list decided which wrapper was asked first)
    //   Tawerna.onEventStart(fn(ev) -> true: taken - the event does not start, { owner, priority })   (Tawerna.onEventStart.PRIORITY)
    //   Tawerna.onEventList(fn(ev) -> a list of commands instead of the page's | null, { owner, priority })   (.PRIORITY)
    // From the highest priority down; equal: the owner's name, then the order of its calls.
    // ------------------------------------------------------------------
    const startGates = [], listHooks = [];
    function gate(store, what) {
        const f = function(fn, opts) {
            if (typeof fn !== "function") throw new Error("Tawerna." + what + ": not a function");
            const o = opts || {}, owner = String(o.owner || "");
            const g = { fn, owner, name: String(o.name || ""), priority: num(typeof o.priority === "string" ? f.PRIORITY[o.priority] : o.priority, 0), n: seq++, errors: 0 };
            for (let i = store.length - 1; i >= 0; i--) if (owner && store[i].owner === owner && store[i].name === g.name) store.splice(i, 1);
            store.push(g);
            store.sort(byPriority);
            return () => { const i = store.indexOf(g); if (i >= 0) store.splice(i, 1); };
        };
        f.list = () => store.map(g => ({ owner: g.owner, name: g.name, priority: g.priority }));
        return f;
    }
    T.onEventStart = gate(startGates, "onEventStart");
    // hidden: a character or a thing its system hides never starts; instead: something else happens instead of the page;
    // before: told before any event starts (never takes it)
    T.onEventStart.PRIORITY = { hidden: 900, instead: 500, before: 100 };
    T.onEventList = gate(listHooks, "onEventList");
    // closed: a place shut now (its door, its counter); scene: a quest's or the story's scene at a door, a prop, a person;
    // own: a system's own use of an event (a hearth, the tavern's tagged places and its regulars, the board); person: a character's talk
    // of the story (the last asked)
    T.onEventList.PRIORITY = { closed: 900, scene: 800, own: 500, person: 300 };
    const _Game_Event_start_core = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        for (const g of startGates.slice()) {
            let taken = false;
            try { taken = g.fn(this) === true; } catch (e) { report("onEventStart" + (g.owner ? " (" + g.owner + ")" : ""), e); }
            if (taken) return;
        }
        _Game_Event_start_core.call(this);
    };
    const _Game_Event_list_core = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        for (let i = 0; i < listHooks.length; i++) {
            const h = listHooks[i];
            let l = null;
            try { l = h.fn(this); } catch (e) { if (!h.errors++) report("onEventList" + (h.owner ? " (" + h.owner + ")" : "") + " - told once", e); l = null; }
            if (l) return l;
        }
        return _Game_Event_list_core.call(this);
    };
    // the page's own commands, past every hook (a story gone: the character's own talk)
    T.onEventList.own = ev => _Game_Event_list_core.call(ev);

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
        // (2026-10-23) the talks' service: who takes a talk, what menus get, the start and list hooks
        talks: () => ({ takeovers: talk.takeovers(), options: talk.options(), start: T.onEventStart.list(), list: T.onEventList.list() }),
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
            // (2026-10-22) the ids in runs (2185-2198), so the line fits the F9 list with the new terrain's many events
            const runs = ids => { const s = ids.slice().sort((a, b) => a - b), out2 = []; for (let i = 0; i < s.length; i++) { let j = i; while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++; out2.push(j > i ? s[i] + "-" + s[j] : String(s[i])); i = j; } return out2.join(","); };
            out.push("Wstawione tu: " + (Object.keys(inj).map(k => k + " " + runs(inj[k])).join("; ") || "nic"));
            const ls = T.debug.listeners(), heard = Object.keys(ls).filter(k => ls[k].length);
            out.push("Szyna: " + (heard.map(k => k + " " + ls[k].length).join(", ") || "nikt nie słucha"));
            const tk = T.debug.talks();
            out.push("Rozmowy: przejęcia " + tk.takeovers.length + ", opcje " + tk.options.length + ", start zdarzeń " + tk.start.length + ", polecenia zdarzeń " + tk.list.length);
            out.push("  przejęcia od pierwszego: " + (tk.takeovers.map(t => t.owner + (t.name ? "." + t.name : "") + " " + t.priority).join(", ") || "brak"));
            return out;
        }
    };
    T.ui = T.ui || { running: null };
})();
