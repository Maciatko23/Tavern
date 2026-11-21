//=============================================================================
// Underground.js
//=============================================================================
// Load order: after TawernaCore and Underground_Data (anywhere below them; it only reads other plugins through Tawerna.api/call).
// The generator part (parseLibrary / generate / verify) is pure: tests/unit/underground.test.js runs it in Node.
// docs/PODZIEMIA.md describes the whole system.

/*:
 * @target MZ
 * @plugindesc Podziemia pod tawerną: 100 pięter - piętra-labirynty 80x60 z salami z kawałków pokoi (stałe ziarno zapisu), mapa odkrywana w czasie chodzenia, co 10. piętro ręcznie, schody, winda, bossowie, łupy, pułapki, zapiski zakonu, Warstwa Prawdy, Komnata Serca, Lord przy Sercu i zakończenia jako sceny. v2.2.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Underground_Data
 *
 * @command open
 * @text Otwórz zejście
 * @desc Otwiera starą kratę w piwnicy tawerny (przełącznik "Podziemia_Zejscie") - początek Aktu II.
 *
 * @command close
 * @text Zamknij zejście
 * @desc Zamyka kratę z powrotem (do testów).
 *
 * @command go
 * @text Idź na piętro
 * @desc Przenosi bohatera na wskazane piętro (0 = Ruiny Zamku, 1-99 = piętra, 100 = Komnata Serca).
 * @arg floor
 * @text Piętro
 * @type number
 * @min 0
 * @max 100
 * @default 1
 *
 * @command shortcut
 * @text Skrót z pieśni znany
 * @desc Włącza skrót "trzeci schodek pusty" (W3) na schodach w Ruinach Zamku.
 *
 * @help
 * ============================================================================
 * Underground.js - Podziemia (sto pięter pod tawerną)
 * ============================================================================
 * Pod tawerną leży sto pięter dawnej twierdzy, w pasmach:
 *   1-10 Piwnice zamku, 11-30 Kwatery i kaplica zakonu, 31-50 Jaskinie
 *   i podziemna rzeka, 51-75 Ruiny starsze niż zakon, 76-99 Warstwa Prawdy,
 *   100 Komnata Serca (Map011).
 *   - piętra pomiędzy to labirynty wielkości Kruczego Jaru (80x60): kręte
 *     korytarze (główne 2 kratki, boczne odnogi 1), ślepe zaułki - w każdym
 *     coś jest (skrzynka, szczątki, stwór w zasadzce, kolce, szept) - i kilka
 *     pętli; sale to gotowe kawałki pokoi narysowane na mapach
 *     „Podziemia: kawałki (pasmo N)” (Map130, Map141-144), schody w dół w sali
 *     w przeciwnym rogu niż schody w górę; minimapa (M) pokazuje tylko to, co
 *     bohater już zobaczył; każdy zapis ma swoje ziarno, więc piętro wygląda
 *     tak samo po powrocie. Piętra 1-9 mają własne puste mapy (131-139), piętra 11-99
 *     nie mają plików - wczytują wspólną skorupę (Map145) jako mapa 1000+N;
 *   - co 10. piętro jest zrobione ręcznie (Map140, Map146-153, Map011):
 *     zapiski zakonu, boss (etap 4 walki), przystanek windy;
 *   - winda kasztelana staje co 5 pięter (5, 10, 15 ... 95): na piętrach
 *     ręcznych klatka i kołowrót stoją na mapie, na generowanych (5, 15 ... 95)
 *     stawia je generator - w sali ze schodami w górę, przy ścianie obok schodów;
 *   - wejście: stara krata w piwnicy tawerny (Map009) - zamknięta, dopóki
 *     fabuła nie włączy przełącznika 11 „Podziemia_Zejscie” (Akt II);
 *     za nią Ruiny Zamku (Map010) ze schodami na piętro 1 i windą.
 *
 * PRZEŁĄCZNIKI: 11 zejście otwarte, 12 winda działa, 13 skrót z pieśni (W3),
 * 14 dziesiąta brama otwarta (strażnik przepuścił).
 *
 * KAWAŁKI (jak narysować nowy - docs/PODZIEMIA.md): zdarzenie „Kawałek: nazwa”
 * w lewym górnym rogu z notatką <Kawalek:w=14,h=11>, a w środku zdarzenia
 * z notatkami <Drzwi:N|S|E|W>, <Schody>, <Lup:rodzaj>, <Pochodnia>,
 * <Stwor:rodzaj>, <Pulapka:kolce>, <Zapiski>, <Losowo:50>, <Szept>, <Zjawa>.
 *
 * DLA INNYCH WTYCZEK: Tawerna.api("Underground") = window.Underground:
 *   floorOf(mapId), mapOf(piętro), info(), spawns(), registerCreature(rodzaj,
 *   build), bossDefeated(piętro), isOpen(), open(), deepest(), seed(),
 *   go(piętro), verify(piętro), locks(), truths(), ending().
 * Szyna: undergroundFloor { floor, mapId, spawns, first }, undergroundDeeper
 * { floor }, undergroundLoot, undergroundNote, undergroundTruth, undergroundBoss,
 * undergroundLift, undergroundLock, undergroundEnding.
 * Numery zdarzeń 860-899 są zarezerwowane dla stworów (etap 4 walki).
 * ============================================================================
 */

(() => {
    "use strict";
    const CZESCI = window.Tawerna && window.Tawerna.api("Underground_parts");
    if (!CZESCI || !CZESCI.gen) throw new Error("Underground.js: musi być pod Underground_Gen.js na liście wtyczek (Underground_Gen.js is missing or below)");
    // (2026-11-07: its first part - lines 80-879 - is Underground_Gen.js, word for word)
    const { TK, PLUGIN, T, D, GEN_VERSION, hash, rng, floorShape, wallShape, kindOf, tagsOf, parseLibrary, librarySig, bandOf,
        roomsOf, mazeOf, planMaze, generate, verifyMap, reachable, checkChunk, handmadeOf, mapOf, floorOf, isGenerated, isVirtual,
        isUnderground } = CZESCI.gen;

    // ======================================================================================================================
    // In the game
    // ======================================================================================================================
    const inGame = typeof DataManager !== "undefined" && typeof Scene_Map !== "undefined" && typeof window.$plugins !== "undefined";
    const libs = {};            // chunk map id -> parsed chunks
    const cache = new Map();    // "seed:floor" -> { map, info } (the last CACHE_MAX floors asked for)
    const CACHE_MAX = 24;
    const creatures = {};       // kind -> build(spawn, ctx) -> event data
    const DATA_NAME = id => "$dataUndergroundChunks" + id;

    const store = T.state.define("underground", () => ({ seed: 0, deepest: 0, visited: {}, notes: {}, lib: {}, gold: 0, found: 0,
        lifts: {}, bosses: {}, locks: {}, forceLocks: {}, truths: {}, ending: null, lord: null, forceWorld: null, forceLord: null, seen: {} }), { version: 1, owner: PLUGIN });
    const state = () => {
        const s = store();
        // (saves from band 1's days: the newer parts)
        if (!s.lifts) s.lifts = {};
        if (!s.bosses) s.bosses = {};
        if (!s.locks) s.locks = {};
        if (!s.forceLocks) s.forceLocks = {};
        if (!s.truths) s.truths = {};
        if (s.ending === undefined) s.ending = null;
        if (s.lord === undefined) s.lord = null;
        if (!s.seen) s.seen = {};   // (the tiles seen on each generated floor - the minimap's fog, since 2026-10-23)
        return s;
    };
    function seedOf() {
        const s = state();
        if (!s.seed) s.seed = ((Math.random() * 0xFFFFFFFF) >>> 0) || 1;
        return s.seed >>> 0;
    }
    function library(band) {
        if (!band || !band.chunkMap) return null;
        if (!libs[band.chunkMap]) {
            const raw = window[DATA_NAME(band.chunkMap)];
            if (!raw) return null;
            libs[band.chunkMap] = parseLibrary(raw);
        }
        return libs[band.chunkMap];
    }
    function flags(band) {
        const b = band || bandOf(1);
        const ts = window.$dataTilesets && $dataTilesets[(b || {}).tileset || 10];
        return ts ? ts.flags : null;
    }
    function floorData(floor) {
        const band = bandOf(floor), chunks = library(band);
        if (!chunks || handmadeOf(floor)) return null;
        const seed = seedOf(), k = seed + ":" + floor;
        if (!cache.has(k)) {
            cache.set(k, generate(floor, seed, chunks, { flags: flags(band) }));
            if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);   // (the oldest one: made again when it is needed)
        }
        return cache.get(k);
    }

    if (inGame) {
        // the chunk maps load with the database (the boot waits for them)
        const _loadDatabase = DataManager.loadDatabase;
        DataManager.loadDatabase = function() {
            const d = D();
            for (const b of (d ? d.BANDS : [])) {
                if (!b.chunkMap) continue;
                if (!this._databaseFiles.some(f => f.name === DATA_NAME(b.chunkMap))) {
                    this._databaseFiles.push({ name: DATA_NAME(b.chunkMap), src: "Map" + String(b.chunkMap).padStart(3, "0") + ".json" });
                }
            }
            _loadDatabase.apply(this, arguments);
        };
        // floors 11-99 have no file of their own: map 1000+N loads the shared shell (the core still sees the map id 1000+N)
        const _loadDataFile = DataManager.loadDataFile;
        DataManager.loadDataFile = function(name, src) {
            if (name === "$dataMap" && D()) {
                const m = /^Map(\d+)\.json$/.exec(String(src));
                if (m && isVirtual(Number(m[1]))) src = "Map" + String(D().MAPS.shell).padStart(3, "0") + ".json";
            }
            return _loadDataFile.call(this, name, src);
        };
        // ...and a name in the map list for them (only in memory - the editor never sees these ids)
        const _onLoad = DataManager.onLoad;
        DataManager.onLoad = function(object) {
            _onLoad.call(this, object);
            if (object && object === window.$dataMapInfos && D()) {
                const d = D();
                for (const b of d.BANDS) {
                    if (!b.virtual) continue;
                    for (let f = b.from; f <= b.to; f++) {
                        const id = mapOf(f);
                        if (handmadeOf(f) || object[id]) continue;
                        // (the name a getter: the words of js/teksty/podziemia.txt come in after the map list)
                        object[id] = { id, expanded: false, get name() { return d.TEXT.floorName(f); }, order: 10000 + f, parentId: d.MAPS.ruins, scrollX: 0, scrollY: 0 };
                    }
                }
            }
        };
        // a generated floor's map file is an empty shell: its data is made here as it loads (events the core put in stay);
        // on every underground map the creature makers fill their spawn places (ids 860-899)
        T.onMapData((data, mapId) => {
            if (!D()) return;
            if (isGenerated(mapId)) {
                const f = floorOf(mapId), got = floorData(f);
                if (!got) return;
                const m = got.map, keep = data.events || [];
                for (const k of Object.keys(m)) if (k !== "events") data[k] = Array.isArray(m[k]) ? m[k].slice() : m[k];
                const events = m.events.map(e => (e ? JSON.parse(JSON.stringify(e)) : null));
                for (let i = 1; i < keep.length; i++) if (keep[i] && i >= events.length) { while (events.length < i) events.push(null); events[i] = keep[i]; }
                addCreatures(events, got.info.spawns, f, mapId);
                data.events = events;
            } else if (isUnderground(mapId)) {
                // a hand-made map: its <Stwor:...> places (the markers "Stwór: ...") get the registered creatures too
                const f = floorOf(mapId), events = data.events || [];
                const spawns = events.filter(e => e && /^Stwór/.test(e.name || "") && /<Stwor:/.test(e.note || ""))
                    .map(e => ({ x: e.x, y: e.y, kind: String(tagsOf(e.note).Stwor || "dowolny").trim(), floor: f, room: "" }));
                addCreatures(events, spawns, f, mapId);
                if (mapId === D().MAPS.heart) heartData(events);
                data.events = events;
                // its darkness at least its band's (2026-11-20, "żeby w tych podziemiach było ciemno"; the map file keeps its own number)
                const band = f ? bandOf(f) : null;
                if (band && band.dark && typeof data.note === "string") {
                    data.note = data.note.replace(/<Dark(Day|Night):\s*(\d+)\s*>/gi, (all, k, v) => "<Dark" + k + ":" + Math.max(Number(v), band.dark) + ">");
                    // (and its lights fade out softly into that dark, as the generated floors' - "bardziej stopniowo przechodziło w ciemność")
                    if (!/<LightEdges:/i.test(data.note)) data.note += "\n<LightEdges:soft>";
                }
            } else return;
            // (2026-11-20, the user: "te domyślne cienie, które są dla murków, da się usunąć?"): no editor's wall shadows on the floors -
            // the dark left half of every floor cell beside a wall; the light and the walls make the shadows down here
            const N = data.width * data.height;
            if (floorOf(mapId) && Array.isArray(data.data) && data.data.length >= 5 * N) for (let i = 4 * N; i < 5 * N; i++) data.data[i] = 0;
            if (DataManager.extractMetadata) {
                DataManager.extractMetadata(data);
                for (const e of data.events) if (e && typeof e.note === "string") DataManager.extractMetadata(e);
            }
        }, { owner: PLUGIN });
        T.inject.reserve(PLUGIN, D() ? D().IDS.creatures[0] : 860, D() ? D().IDS.creatures[1] : 899, "stwory podziemi (piętra 1-100)");
    }
    // the creatures (stage 4): one event per spawn place whose kind has a maker, ids 860-899
    function addCreatures(events, spawns, f, mapId) {
        const [from, to] = D().IDS.creatures;
        let next = from;
        while (next <= to && events[next]) next++;
        for (const sp of spawns) {
            const make = creatures[sp.kind] || (sp.kind === "dowolny" ? creatures["*"] : null);
            if (!make || next > to) continue;
            let ev = null;
            try { ev = make(Object.assign({}, sp), { floor: f, mapId, seed: seedOf(), rng: rng(hash(seedOf(), "spawn", f, sp.x, sp.y)) }); }
            catch (e) { console.error("[Underground] creature " + sp.kind, e); }
            if (!ev) continue;
            ev.id = next++; ev.x = ev.x === undefined ? sp.x : ev.x; ev.y = ev.y === undefined ? sp.y : ev.y;
            while (events.length < ev.id) events.push(null);
            events[ev.id] = ev;
        }
    }

    // ---- the save: a floor saved under another library or generator is made again (the hero goes to its stairs up - also when the
    // engine moves him back to where he stood because the project changed since the save: Scene_Load.reloadMapIfUpdated; see
    // onMapLoaded below)
    let relocate = null;   // { mapId, spot } for the first map loaded after a load
    function sigNow(band) {
        const chunks = library(band);
        return chunks ? librarySig(chunks) : 0;
    }
    if (inGame) {
        T.on("load", () => {
            const s = state(), d = D();
            if (!d) return;
            if ($gameSwitches.value(d.SWITCHES.lift) && !Object.keys(s.lifts).length) s.lifts[10] = true;   // (a save from band 1's days)
            for (const b of d.BANDS) {
                const sig = sigNow(b);
                if (!sig) continue;
                const had = s.lib[b.id];
                s.lib[b.id] = sig;
                if (had === undefined || had === sig) continue;
                // the floors of this band changed: their searched containers, the tiles seen there and the hero's place are forgotten
                for (let f = b.from; f <= b.to; f++) {
                    if (!isGenerated(mapOf(f))) continue;
                    const mid = mapOf(f);
                    for (const k of Object.keys($gameSelfSwitches._data)) if (k.split(",")[0] === String(mid)) delete $gameSelfSwitches._data[k];
                    delete s.seen[f];
                }
                if (isGenerated($gameMap.mapId()) && bandOf(floorOf($gameMap.mapId())) === b) {
                    const f = floorOf($gameMap.mapId());
                    cache.clear();
                    const got = floorData(f), sp = got && got.info.spots.up;
                    if (sp) {
                        $gamePlayer.reserveTransfer($gameMap.mapId(), sp[0], sp[1], sp[2], 0);
                        $gamePlayer.requestMapReload();
                        relocate = { mapId: $gameMap.mapId(), spot: sp.slice() };
                    }
                }
            }
        }, { owner: PLUGIN });
        T.on("newGame", () => {
            const s = state(), d = D();
            for (const b of (d ? d.BANDS : [])) { const sig = sigNow(b); if (sig) s.lib[b.id] = sig; }
            cache.clear();
        }, { owner: PLUGIN });
    }

    // ---- back on a floor without a transfer (a menu closed, a save loaded): the map's events follow its data again - a creature
    // maker registered or dropped since (on any underground map), a library changed: the missing events come, the orphaned ones go
    if (inGame) {
        const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
        Scene_Map.prototype.onMapLoaded = function() {
            if (!this._transfer && window.$gameMap && window.$dataMap && D() && isUnderground($gameMap.mapId())) {
                const evs = $gameMap._events, data = $dataMap.events || [];
                for (let id = 1; id < Math.max(evs.length, data.length); id++) {
                    if (!data[id] && evs[id]) delete evs[id];
                    else if (data[id] && !evs[id]) evs[id] = new Game_Event($gameMap.mapId(), id);
                }
            }
            _Scene_Map_onMapLoaded.call(this);
            // a save made on a floor that is made anew now (another generator or library): the hero on its stairs up
            const moveTo = relocate;
            relocate = null;
            if (moveTo && window.$gameMap && $gameMap.mapId() === moveTo.mapId) {
                $gamePlayer.locate(moveTo.spot[0], moveTo.spot[1]);
                $gamePlayer.setDirection(moveTo.spot[2] || 2);
                return;
            }
            // a save from before the cellar was rebuilt (Map009 was one big floor then): a hero standing in what is now wall goes to
            // the foot of the stairs from the tavern (the same for the other hand-made maps, and a generated floor: its stairs up)
            if (!this._transfer && window.$gameMap && D()) {
                const d = D(), id = $gameMap.mapId(), x = $gamePlayer.x, y = $gamePlayer.y;
                const f = floorOf(id), hm = !isGenerated(id) && d.FLOORS[f], got = isGenerated(id) ? floorData(f) : null;
                const spot = { [d.MAPS.cellar]: [10, 8], [d.MAPS.ruins]: d.SPOTS.ruinsFromCellar }[id] || (hm ? hm.up : got ? got.info.spots.up : null);
                if (spot && ![2, 4, 6, 8].some(dir => $gameMap.isPassable(x, y, dir))) $gamePlayer.locate(spot[0], spot[1]);
            }
        };
    }

    // ---- arriving on a floor: the notice "Piętro N", the deepest floor, the first-visit line, the bus
    function infoOf(mapId) {
        const id = mapId === undefined ? $gameMap.mapId() : mapId, f = floorOf(id);
        if (!f) return null;
        if (isGenerated(id)) { const got = floorData(f); return got ? got.info : null; }
        const b = bandOf(f) || {};
        return { floor: f, band: b.id, bandName: b.name, handmade: true, spawns: spawnsOfMap(), spots: Object.assign({}, D().FLOORS[f] || {}),
            loot: {}, traps: [], notes: [], whispers: tagged("Szept"), visions: tagged("Zjawa") };
    }
    // the events of this map with a tag in the note (the ids kept per map: the Truth Layer asks every frame)
    const taggedCache = { mapId: -1, n: -1, lists: {} };
    function tagged(tag) {
        if (!window.$gameMap || !$gameMap.events) return [];
        if (taggedCache.mapId !== $gameMap.mapId() || taggedCache.n !== $gameMap._events.length) {
            taggedCache.mapId = $gameMap.mapId(); taggedCache.n = $gameMap._events.length; taggedCache.lists = {};
        }
        if (!taggedCache.lists[tag]) {
            const re = new RegExp("<" + tag + "[>:]");
            taggedCache.lists[tag] = $gameMap.events().filter(e => e.event() && re.test(e.event().note || "")).map(e => e.eventId());
        }
        return taggedCache.lists[tag].map(id => $gameMap.event(id)).filter(Boolean).map(e => ({ id: e.eventId(), x: e.x, y: e.y }));
    }
    function spawnsOfMap() {
        if (!window.$gameMap || !$gameMap.events) return [];
        return $gameMap.events().filter(e => e.event() && /<Stwor/.test(e.event().note || "") && !(e.eventId() >= D().IDS.creatures[0] && e.eventId() <= D().IDS.creatures[1]))
            .map(e => ({ x: e.x, y: e.y, kind: String((e.event().meta || {}).Stwor || "dowolny").trim(), floor: floorOf($gameMap.mapId()) }));
    }
    if (inGame) {
        T.on("mapReady", e => {
            const mapId = e.mapId, f = floorOf(mapId), d = D();
            fogStart(mapId);
            truth.reset(mapId);
            if (!f || !d) return;
            if (mapId === d.MAPS.heart) syncDoor();
            // the windlass of a working stop shows its lever down (also a stop turned on by F9, or a floor made anew since: its self switch A)
            if (d.LIFT.stops.indexOf(f) >= 0 && liftStops().indexOf(f) >= 0) {
                for (const ev of $gameMap.events()) {
                    const key = [mapId, ev.eventId(), "A"];
                    if (ev.event() && ev.event().name === TK.kod.liftOn[0] && !$gameSelfSwitches.value(key)) $gameSelfSwitches.setValue(key, true);
                }
            }
            const s = state(), band = bandOf(f), first = !s.visited[f];
            s.visited[f] = (s.visited[f] || 0) + 1;
            const deeper = f > (s.deepest || 0);
            if (deeper) s.deepest = f;
            if (e.transfer) {
                const hm = d.FLOORS[f] && !isGenerated(mapId) ? d.FLOORS[f].name : "";
                // (the clean look's map name - CleanHUD's „Kronika” - says the floor, its hall, its band and the deepest one itself:
                // no notice under it then)
                if (!T.call("CleanHUD", "saysFloor")) T.popup(d.TEXT.notice(f) + (hm ? " - " + hm : ""), { top: true, sub: d.TEXT.noticeSub(band.name, s.deepest) });
                if (first && d.TEXT.firstVisit[f]) T.call("SpeechBubbles", "say", $gamePlayer, d.TEXT.firstVisit[f], 260);
            }
            if (deeper) T.emit("undergroundDeeper", { floor: f });
            const info = infoOf(mapId);
            T.emit("undergroundFloor", { floor: f, mapId, spawns: info ? info.spawns : [], first });
        }, { owner: PLUGIN });
    }

    // ---- the stairs, the gate, the lift
    function landing(floor, side) {
        const d = D();
        if (floor <= 0) return [d.MAPS.ruins].concat(d.SPOTS.ruinsStairs);
        const mid = mapOf(floor);
        if (!mid) return null;
        if (!isGenerated(mid)) {
            const hm = d.FLOORS[floor] || {}, sp = (side === "down" ? hm.down : side === "lift" ? hm.lift : hm.up) || hm.up;
            return sp ? [mid].concat(sp) : null;
        }
        // (a generated floor is the same for the save's seed: its lift's place is known before one goes there - in front of its cage;
        // a floor the generator found no place for - none so far in thousands of seeds - its stairs up)
        const got = floorData(floor), sp = got && (got.info.spots[side] || (side === "lift" ? got.info.spots.up : null));
        return sp ? [mid].concat(sp) : null;
    }
    function travel(to, se) {
        if (!to) return false;
        if (se) AudioManager.playSe({ name: se, volume: 80, pitch: 90, pan: 0 });
        $gamePlayer.reserveTransfer(to[0], to[1], to[2], to[3] || 2, 0);
        if (to[0] === $gameMap.mapId()) $gamePlayer.requestMapReload();   // (the same floor again - F9, a new seed: its events made anew)
        return true;
    }
    function stairs(dir) {
        const d = D(), mapId = $gameMap.mapId();
        if (mapId === d.MAPS.ruins) return dir === "down" ? travel(landing(1, "up")) : false;
        const f = floorOf(mapId);
        if (!f) return false;
        const nf = dir === "down" ? f + 1 : f - 1;
        if (nf > 0 && !bandOf(nf)) { popupHere(d.TEXT.noFloor); return false; }
        if (dir === "down" && !bossCleared(f)) {
            const b = d.BOSSES[f];
            popupHere(d.TEXT.bossBlocks(b ? b.name : TK.kod.stairs[0]));
            return false;
        }
        return travel(landing(nf, dir === "down" ? "up" : "down"));
    }
    function say(key, extra) {
        const d = D(), text = typeof key === "string" && d.TEXT[key] !== undefined ? d.TEXT[key] : key;
        if (!text) return;
        $gameMessage.add(String(typeof text === "function" ? text(extra) : text));
    }
    function popupHere(text, icon) {
        T.popup(text, { icon: icon || 0, kind: "need" });
    }
    function go(floor) {
        const f = Math.max(0, Math.floor(Number(floor) || 0));
        if (f > 0 && !bandOf(f)) return false;
        return travel(landing(f, "up"));
    }
    const sw = (name, v) => {
        const id = D().SWITCHES[name];
        if (v === undefined) return !!$gameSwitches.value(id);
        $gameSwitches.setValue(id, !!v);
        return !!v;
    };

    // ---- the lift: a cage on every 5th floor 5-95 (the hand-made 10-90 drawn, the generated 5, 15 ... 95 from the generator) and in
    // Ruiny Zamku; a stop works once its windlass was turned
    function liftStops() {
        const s = state(), d = D();
        return d.LIFT.stops.filter(f => s.lifts[f] || (f === 10 && sw("lift") && !Object.keys(s.lifts).length));
    }
    function liftOn(floor) {
        const f = Number(floor) || 10, d = D(), s = state(), first = !s.lifts[f];
        s.lifts[f] = true;
        sw("lift", true);
        // (the windlass of this stop shows its lever down: its self switch A)
        if (window.$gameMap && floorOf($gameMap.mapId()) === f) {
            for (const ev of $gameMap.events()) if (ev.event() && ev.event().name === TK.kod.liftOn[0]) $gameSelfSwitches.setValue([$gameMap.mapId(), ev.eventId(), "A"], true);
        }
        T.popup(d.TEXT.liftOn(f), { top: true, sub: d.TEXT.liftSub });
        if (first) T.call("Combat", "discover", f === 10 ? "ug_lift" : "ug_lift_" + f, Watki.wstaw(TK.kod.liftOn[1], { f: f }), 40);
        T.emit("undergroundLift", { on: true, floor: f });
        return true;
    }
    // the choices of the cage (from an event's script: Underground.liftMenu(this)); where one is now is left out; the stops top down
    // (the place in front of a generated floor's cage is worked out only for the stop chosen - the floor made then, once)
    function liftMenu(interp) {
        const d = D(), here = floorOf($gameMap.mapId());
        const dest = [];
        if ($gameMap.mapId() !== d.MAPS.ruins) dest.push({ label: d.TEXT.liftRuins, to: () => [d.MAPS.ruins].concat(d.SPOTS.ruinsLift) });
        for (const f of liftStops()) if (f !== here && mapOf(f)) dest.push({ label: d.TEXT.liftStop(f), to: () => landing(f, "lift") });
        const names = dest.map(o => o.label).concat([d.TEXT.liftStay]);
        $gameMessage.add("\\SPK[0]" + d.TEXT.liftAsk);
        $gameMessage.setChoices(names, 0, names.length - 1);
        $gameMessage.setChoiceCallback(n => {
            const o = dest[n], to = o && o.to();
            if (!to) return;
            travel(to, "Chain");
            T.emit("undergroundLift", { ride: true, to: to[0] });
        });
        if (interp && interp.setWaitMode) interp.setWaitMode("message");
        return dest.length;
    }

    // the windlass of a stop (its event: Underground.windlass(this)) - turned once, the stop works for good
    function windlass(interp) {
        const d = D(), t = d.TEXT, f = floorOf($gameMap.mapId());
        if (liftStops().includes(f)) return runChild(interp, C.text(t.windlassOn, 0));
        const turn = C.se("Chain", 90, 90).concat([{ code: 225, indent: 0, parameters: [3, 5, 40, false] }], C.wait(40), C.se("Machine", 70, 70),
            C.text(t.windlassTurned, 0), C.script("Underground.liftOn(" + f + ")"));
        return runChild(interp, C.text(t.windlassLook, 0).concat(C.choice(t.windlassAsk, [t.windlassYes, t.windlassNo], [turn, []])));
    }
    // the cage of a stop or the shaft in Ruiny Zamku (Underground.cage(this)): the menu of the stops once this one works
    function cage(interp) {
        const d = D(), t = d.TEXT, ruins = $gameMap.mapId() === d.MAPS.ruins, f = floorOf($gameMap.mapId());
        const works = ruins ? liftStops().length > 0 : liftStops().includes(f);
        if (!works) return runChild(interp, C.text(ruins ? t.shaftEmpty : t.cageStuck, 0));
        return liftMenu(interp);
    }

    // ---- the bosses of the hand-made floors (stage 4): while a maker for "boss_NN" is registered, its stairs down wait for it
    function bossCleared(floor) {
        const d = D(), hm = d.FLOORS[floor];
        if (!hm || !hm.boss || isGenerated(mapOf(floor))) return true;
        return !creatures[hm.boss] || !!state().bosses[floor];
    }
    function bossDefeated(floor, v) {
        const f = Number(floor) || floorOf($gameMap.mapId()), d = D();
        if (!d.FLOORS[f] || !d.FLOORS[f].boss) return false;
        state().bosses[f] = v === undefined ? true : !!v;
        if (state().bosses[f]) {
            const b = d.BOSSES[f];
            if (b) T.popup(d.TEXT.bossDone(b.name), { top: true });
            T.emit("undergroundBoss", { floor: f, kind: d.FLOORS[f].boss });
        }
        return state().bosses[f];
    }

    // ---- searching a container: what the generator put in it (once; self switch A then shows it open)
    function search(eventId) {
        const d = D(), mapId = $gameMap.mapId(), info = infoOf(mapId), ev = $gameMap.event(eventId);
        const e = info && info.loot && info.loot[eventId];
        if (!e || !ev) return false;
        const key = [mapId, eventId, "A"];
        if ($gameSelfSwitches.value(key)) { if (d.TEXT.empty[e.kind]) $gameMessage.add(d.TEXT.empty[e.kind]); return false; }
        $gameSelfSwitches.setValue(key, true);
        if (!e.got.length) { if (d.TEXT.nothing[e.kind]) $gameMessage.add(d.TEXT.nothing[e.kind]); return false; }
        AudioManager.playSe({ name: e.kind === "skrzynia" || e.kind === "skrzynka" || e.kind === "relikwiarz" ? "Chest1" : "Item1", volume: 80, pitch: 100, pan: 0 });
        const s = state();
        for (const g of e.got) {
            if (g.gold) {
                $gameParty.gainGold(g.gold);   // (the gains feed shows it - its own line besides was a second "+15 G", 2026-11-19)
                s.gold += g.gold;
                T.emit("undergroundLoot", { kind: e.kind, gold: g.gold, floor: floorOf(mapId) });
            } else if (window.$dataItems && $dataItems[g.item]) {
                $gameParty.gainItem($dataItems[g.item], g.n);   // (the gains feed shows it, "+6 Strzały" - not a second line "Strzały ×6")
                T.emit("undergroundLoot", { kind: e.kind, item: g.item, n: g.n, floor: floorOf(mapId) });
            }
        }
        s.found++;
        return true;
    }
    // ---- an order's note: its text in the message window, kept in the journal the first time; a truth of the Truth Layer is
    // kept as a truth too (W9 ch. 6: the town's quests may let the hero tell it or keep it)
    // key: the floor (1-99) or a hand-made note ("10a"...)
    function read(key) {
        const d = D(), n = d.NOTES[key];
        if (!n) return false;
        const s = state(), floor = parseInt(key, 10) || floorOf($gameMap.mapId());
        $gameMessage.add("\\C[6]" + n.title + "\\C[0] (" + n.where + ")");
        for (const part of n.text.split("\n")) $gameMessage.add(part);
        if (!s.notes[key]) {
            s.notes[key] = true;
            const truthOf = n.who && n.who !== "straznik";
            T.call("Journal", "addNote", (truthOf ? TK.kod.read[0] : TK.kod.read[1]) + n.title, Watki.wstaw(TK.kod.read[2], { text: n.text, floor: floor }));
            T.call("Combat", "discover", "ug_note_" + key, (truthOf ? TK.kod.read[3] : TK.kod.read[4]) + n.title + ")", truthOf ? 40 : 20);
            T.emit("undergroundNote", { key: String(key), floor, title: n.title });
            if (n.who) {
                s.truths[key] = { who: n.who, floor };
                T.emit("undergroundTruth", { key: String(key), who: n.who, name: d.TRUTH_WHO[n.who] || n.who, floor, text: n.text });
            }
        }
        return true;
    }

    // ---- floor 10: the guardian of the tenth gate (Map140's events call these)
    // stage 4 of the fighting can take the guardian over: Underground.onGuardian(fn(eventId) -> true when it handles him)
    let guardianHook = null;
    function guardianHandled(eventId) {
        if (typeof guardianHook !== "function") return false;
        try { return !!guardianHook(eventId); } catch (e) { console.error("[Underground] guardian hook", e); return false; }
    }
    // the armour's pose: sleep (asleep), wake (the eye slit glowing), strike (the sword up), spent (the fire out - he let one by)
    function guardianPose(eventId, pose) {
        const ev = $gameMap.event(eventId);
        if (!ev) return false;
        const f = { sleep: [2, 0], wake: [2, 2], strike: [4, 0], spent: [6, 0] }[pose] || [2, 0];
        ev._directionFix = false;
        ev.setDirection(f[0]);
        ev._directionFix = true;
        ev.setPattern(f[1]);
        ev._originalPattern = f[1];
        return true;
    }
    // the blow of the armour's sword: from the guardian toward the hero (a roll dodges it, the shield takes some - Combat's rules)
    function guardianStrike(damage) {
        const g = $gameMap.events().find(e => e.event() && /<Stwor:zbroja_straznik>/.test(e.event().note || ""));
        return hurt(damage, { poise: damage >= 12 ? 40 : 10, knock: damage >= 12 ? 1.2 : 0.8, name: TK.kod.guardianStrike[0],
            from: g ? { x: g.x, y: g.y } : null });
    }
    // stepping on the line in front of the gate: the guardian's own talk starts (once at a time; not after he let one by)
    function wake(eventId) {
        const ev = $gameMap.event(eventId);
        if (!ev || sw("gate10") || ev.isStarting()) return false;
        ev.start();
        return true;
    }
    function gate10Opened() {
        T.call("Combat", "discover", "ug_gate10", TK.kod.gate10Opened[0], 80);
        T.emit("undergroundGate", { floor: 10 });
        return true;
    }
    // ---- a blow from the guardian armour or a trap: Combat's hit when it is there (rolls dodge it), else plain health
    function hurt(damage, opts) {
        const o = opts || {}, p = $gamePlayer;
        const res = T.call("Combat", "hitPlayer", { damage, poise: o.poise || 8, knock: o.knock !== undefined ? o.knock : 0.5,
            name: o.name || "", from: o.from || { x: p.x, y: p.y - 1 } });
        if (res !== undefined) return res;
        const a = $gameParty.leader();
        if (a) a.gainHp(-Math.max(1, Math.round(damage)));
        $gameScreen.startShake(5, 8, 12);
        $gameScreen.startFlash([255, 40, 30, 110], 12);
        return "hit";
    }

    // ---- the spikes: up and down in their own rhythm; standing on them while they are up hurts (once a rise)
    if (inGame) {
        T.onMapUpdate(scene => {
            if (!isGenerated($gameMap.mapId())) return;
            const info = infoOf();
            if (!info || !info.traps.length) return;
            const d = D(), S = d.SPIKES, now = Graphics.frameCount;
            for (const tr of info.traps) {
                const ev = $gameMap.event(tr.id);
                if (!ev) continue;
                const t = (now + tr.phase) % S.period;
                // holes most of the time; a quick rise (6 frames a step), up for a moment, a slower fall
                const rise = S.period - S.up - 18;
                let step = 0;
                if (t >= rise && t < rise + 18) step = 1 + Math.floor((t - rise) / 6);
                else if (t >= rise + 18) step = t < S.period - 12 ? 3 : 2;
                const dir = d.SPIKE_STEPS[Math.min(3, step)];
                if (ev.direction() !== dir) { ev._directionFix = false; ev.setDirection(dir); ev._directionFix = true; }
                if (step === 1 && t === rise && Math.abs(ev.x - $gamePlayer.x) + Math.abs(ev.y - $gamePlayer.y) < 9) T.audio.se("Sword1", { volume: 30, pitch: 140 });
                if (step >= 2 && $gamePlayer.x === tr.x && $gamePlayer.y === tr.y && (tr.hitAt || -9999) < now - S.period / 2 && !$gamePlayer.isTransferring()) {
                    tr.hitAt = now;
                    hurt(S.damage + S.perFloor * info.floor, { poise: S.poise, knock: S.knock, name: d.TEXT.trapHit, from: { x: tr.x, y: tr.y + 0.4 } });
                }
            }
        }, { owner: PLUGIN, name: "spikes" });
    }

    // ---- water down here is seen, not drunk (the drought rule): the action button on a water tile says so - Farming's water menu
    // (drink, the waterskin, the can) never opens underground. A spring made drinkable on purpose is an event in front of the water.
    function waterAt(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        for (let z = 0; z < 2; z++) { const id = $gameMap.tileId(x, y, z); if (id > 0 && Tilemap.isWaterTile(id)) return true; }
        return false;
    }
    if (inGame) {
        const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
        Game_Player.prototype.triggerButtonAction = function() {
            if (Input.isTriggered("ok") && D() && isUnderground($gameMap.mapId()) && !this.isInVehicle()) {
                const dir = this.direction(), x = $gameMap.roundXWithDirection(this.x, dir), y = $gameMap.roundYWithDirection(this.y, dir);
                const evThere = $gameMap.eventsXy(x, y).some(e => e.isNormalPriority() && e.isTriggerIn([0, 1, 2]));
                const evHere = $gameMap.eventsXy(this.x, this.y).some(e => e.isTriggerIn([0]) && e.page() && e.list().length > 1);
                if (waterAt(x, y) && !evThere && !evHere) {
                    popupHere(D().TEXT.water, 391);
                    return true;
                }
            }
            return _triggerButtonAction.call(this);
        };
    }

    // ======================================================================================================================
    // The floor found as one walks it (2026-10-23): on a generated floor the tiles the hero has seen - the floor round him up to
    // SIGHT steps along the ways (never through the rock), the walls beside it and the wall faces over it - are kept per floor in
    // the save (state().seen: { floor: { w, h, b } }, b - a bit a tile in base64); Minimap.js shows only them (Minimap.addFog).
    // ======================================================================================================================
    const SIGHT = 6;
    const fog = { mapId: 0, floor: 0, w: 0, h: 0, bits: null, open: null, rev: 0, at: -1 };
    const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    function bitsToText(bits) {
        let out = "";
        for (let i = 0; i < bits.length; i += 3) {
            const n = (bits[i] << 16) | ((bits[i + 1] || 0) << 8) | (bits[i + 2] || 0);
            out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
        }
        return out;
    }
    function textToBits(text, len) {
        const bits = new Uint8Array(len), s = String(text || "");
        for (let i = 0, j = 0; i + 4 <= s.length && j < len; i += 4) {
            const n = (B64.indexOf(s[i]) << 18) | (B64.indexOf(s[i + 1]) << 12) | (B64.indexOf(s[i + 2]) << 6) | B64.indexOf(s[i + 3]);
            if (n < 0) break;
            for (const sh of [16, 8, 0]) if (j < len) bits[j++] = (n >> sh) & 255;
        }
        return bits;
    }
    // the floor left: what was seen there goes into the save's state
    function fogSave() {
        if (!fog.bits || !fog.floor) return;
        state().seen[fog.floor] = { w: fog.w, h: fog.h, b: bitsToText(fog.bits) };
    }
    function fogForget() { fog.mapId = 0; fog.floor = 0; fog.bits = null; fog.open = null; fog.at = -1; fog.rev++; }
    // a map entered: its tiles seen so far (a generated floor only), the tiles one sees along (floor, water - not the rock)
    function fogStart(mapId) {
        fogSave();
        fogForget();
        fog.mapId = mapId;
        if (!D() || !isGenerated(mapId) || !window.$dataMap || !$dataMap.data) return;
        const f = floorOf(mapId), w = $dataMap.width, h = $dataMap.height, n = w * h, kept = state().seen[f];
        fog.floor = f; fog.w = w; fog.h = h;
        fog.bits = kept && kept.w === w && kept.h === h ? textToBits(kept.b, Math.ceil(n / 8)) : new Uint8Array(Math.ceil(n / 8));
        fog.open = new Uint8Array(n);
        for (let i = 0; i < n; i++) { const id = $dataMap.data[i], k = kindOf(id); fog.open[i] = id && !((k >= 48 && k < 80) || k >= 80) ? 1 : 0; }
    }
    const seenAt = (x, y) => { if (!fog.bits || x < 0 || y < 0 || x >= fog.w || y >= fog.h) return false; const i = y * fog.w + x; return !!(fog.bits[i >> 3] & (1 << (i & 7))); };
    // the hero looks round from (x0, y0): a walk of SIGHT steps along the open tiles; each one seen with its neighbours and the wall
    // face over it (three rows: the face and its top)
    function reveal(x0, y0, sight) {
        if (!fog.bits) return 0;
        const w = fog.w, h = fog.h, open = fog.open, bits = fog.bits, far = sight === undefined ? SIGHT : sight;
        let added = 0;
        const see = (x, y) => {
            if (x < 0 || y < 0 || x >= w || y >= h) return;
            const i = y * w + x;
            if (!(bits[i >> 3] & (1 << (i & 7)))) { bits[i >> 3] |= 1 << (i & 7); added++; }
        };
        if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return 0;
        const start = y0 * w + x0, dist = new Map([[start, 0]]), q = [start];
        for (let qi = 0; qi < q.length; qi++) {
            const i = q[qi], x = i % w, y = (i / w) | 0, dd = dist.get(i);
            for (let dy = -3; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dy >= -1 || !open[(y + dy) * w + x + dx]) see(x + dx, y + dy);
            if (dd >= far) continue;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy, j = ny * w + nx;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h || !open[j] || dist.has(j)) continue;
                dist.set(j, dd + 1);
                q.push(j);
            }
        }
        if (added) fog.rev++;
        return added;
    }
    // for Minimap.js: null off a generated floor, else { rev, seen(x, y) }
    function fogFor(mapId) {
        if (!fog.bits || fog.mapId !== mapId) return null;
        return { rev: fog.rev, seen: seenAt };
    }
    function fogHook() { const M = window.Minimap; if (M && M.addFog) M.addFog(fogFor); }
    if (inGame) {
        fogHook();
        T.on("save", () => fogSave(), { owner: PLUGIN });
        T.on("load", () => fogForget(), { owner: PLUGIN });       // (the state of the save loaded: the floor is read again on mapReady)
        T.on("newGame", () => fogForget(), { owner: PLUGIN });
        T.onMapUpdate(() => {   // (the map's fog is read on mapReady - fogStart)
            if (!fog.bits || fog.mapId !== $gameMap.mapId() || Graphics.frameCount % 4) return;
            const idx = $gamePlayer.y * fog.w + $gamePlayer.x;
            if (idx === fog.at) return;
            fog.at = idx;
            reveal($gamePlayer.x, $gamePlayer.y);
        }, { owner: PLUGIN, name: "fog" });
    }

    // ======================================================================================================================
    // The Truth Layer (band 5): whispers from the dark, someone from up there seen for a moment, the world tinted wrong
    // ======================================================================================================================
    const truth = {
        on: false, next: 0, moment: 0, seen: new Set(), vision: null, mapId: 0,
        reset(mapId) {
            const f = floorOf(mapId), b = bandOf(f);
            this.on = !!(b && b.whispers);
            this.mapId = mapId;
            this.seen = new Set();
            this.vision = null;
            this.next = (window.Graphics ? Graphics.frameCount : 0) + 600;
            this.moment = (window.Graphics ? Graphics.frameCount : 0) + 1500;
            endMoment();
        }
    };
    function calm() {
        return !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gamePlayer.isTransferring();
    }
    // a whisper: from the nearest <Szept> place (within 9 tiles) or, failing that, over the hero
    function whisper(text) {
        const d = D(), r = rng(hash(seedOf(), "whisper", Graphics.frameCount));
        const line = text || r.pick(d.WHISPERS);
        const near = tagged("Szept").map(o => $gameMap.event(o.id)).filter(e => e && Math.abs(e.x - $gamePlayer.x) + Math.abs(e.y - $gamePlayer.y) <= 9);
        const who = near.length ? r.pick(near) : $gamePlayer;
        T.call("SpeechBubbles", "say", who, line, 210);
        AudioManager.playSe({ name: "Darkness3", volume: 25, pitch: 150, pan: 0 });
        T.emit("undergroundWhisper", { text: line, from: who === $gamePlayer ? 0 : who.eventId() });
        return line;
    }
    // a moment: the screen goes cold and wrong for a breath (tint, a little shake, the colours turned round)
    let momentFilter = null, momentEnd = 0;
    function startMoment(frames) {
        const n = frames || 90;
        $gameScreen.startTint([-40, -70, 50, 110], 18);
        $gameScreen.startShake(2, 6, Math.min(40, n));
        AudioManager.playSe({ name: "Darkness5", volume: 30, pitch: 60, pan: 0 });
        momentEnd = Graphics.frameCount + n;
        try {
            const sp = SceneManager._scene && SceneManager._scene._spriteset;
            if (sp && window.PIXI && PIXI.filters && PIXI.filters.ColorMatrixFilter && !momentFilter) {
                momentFilter = new PIXI.filters.ColorMatrixFilter();
                sp.filters = (sp.filters || []).concat([momentFilter]);
            }
        } catch (e) { momentFilter = null; }
        return true;
    }
    function endMoment() {
        if (window.$gameScreen && momentEnd) $gameScreen.startTint([0, 0, 0, 0], 30);
        momentEnd = 0;
        try {
            const sp = SceneManager._scene && SceneManager._scene._spriteset;
            if (sp && momentFilter && sp.filters) sp.filters = sp.filters.filter(f => f !== momentFilter);
        } catch (e) { /* (the scene is gone) */ }
        momentFilter = null;
    }
    // someone from up there, at a <Zjawa> place: comes out of the dark, looks at the hero, says one thing, is gone
    function showVision(ev, who) {
        const d = D(), r = rng(hash(seedOf(), "vision", floorOf($gameMap.mapId()), ev.eventId()));
        const a = who || r.pick(d.APPARITIONS);
        ev.setImage(a.sheet, 0);
        ev.setOpacity(0);
        ev.setThrough(true);
        ev.turnTowardPlayer();
        truth.vision = { ev, a, t: 0 };
        truth.seen.add(ev.eventId());
        T.emit("undergroundVision", { name: a.name, sheet: a.sheet, id: ev.eventId() });
        return a;
    }
    if (inGame) {
        T.onMapUpdate(() => {
            const now = Graphics.frameCount;
            if (momentEnd && now >= momentEnd) endMoment();
            if (momentFilter) { try { momentFilter.hue(Math.sin(now / 9) * 35, false); } catch (e) { momentFilter = null; } }
            if (!truth.on || truth.mapId !== $gameMap.mapId()) return;
            // the vision's life: fade in, look, a word, fade out
            const v = truth.vision;
            if (v) {
                v.t++;
                const ev = v.ev;
                if (v.t <= 30) ev.setOpacity(Math.round(v.t / 30 * 210));
                if (v.t === 34) { T.call("SpeechBubbles", "say", ev, v.a.line, 150); startMoment(110); }
                if (v.t > 34 && v.t < 130) ev.turnTowardPlayer();
                if (v.t >= 140) ev.setOpacity(Math.max(0, 210 - Math.round((v.t - 140) / 26 * 210)));
                if (v.t >= 166) { ev.setImage("", 0); ev.setOpacity(255); truth.vision = null; }
                return;
            }
            if (!calm()) return;
            // a place of a vision within 6 tiles, not seen on this visit
            for (const o of tagged("Zjawa")) {
                if (truth.seen.has(o.id)) continue;
                if (Math.abs(o.x - $gamePlayer.x) + Math.abs(o.y - $gamePlayer.y) > 6) continue;
                const ev = $gameMap.event(o.id);
                if (ev) { showVision(ev); return; }
            }
            if (now >= truth.next) {
                whisper();
                truth.next = now + 1200 + (hash(seedOf(), now) % 1200);
            }
            if (now >= truth.moment) {
                startMoment(70);
                truth.moment = now + 2400 + (hash(seedOf(), "m", now) % 2400);
            }
        }, { owner: PLUGIN, name: "truthLayer" });
    }

    // ======================================================================================================================
    // Floor 100 - the Heart's chamber (Map011): the three locks, the Heart, the choice and the epilogue
    // ======================================================================================================================
    // the quest engine's state (TownQuests): W4 the castellan's key, W2 the signal "pytanie" (seven), W3 the song
    function questKnows(name) {
        const TQ = T.api("TownQuests");
        if (!TQ || !TQ.state) return false;
        let s = null;
        try { s = TQ.state(); } catch (e) { return false; }
        if (!s) return false;
        const fl = s.flags || {}, done = id => { try { return !!TQ.isDone(id); } catch (e) { return false; } };
        if (name === "key") {
            let n = 0;
            try { n = TQ.vcount ? TQ.vcount("klucz_kasztelana") : 0; } catch (e) { n = 0; }
            return n > 0 || done("W4");
        }
        if (name === "signal") {
            if (fl.signalBook || done("W2")) return true;
            const r = TQ.rec ? TQ.rec("W2") : null, q = TQ.Q && TQ.Q.W2;
            if (r && q && q.steps) {
                const ring = q.steps.findIndex(st => st.talk === "w2Ring");
                return ring >= 0 && (r.step || 0) >= ring;     // (the garden's shields told it: seven is the signal "pytanie")
            }
            return false;
        }
        if (name === "song") return !!fl.w3Shortcut || done("W3") || sw("song");
        return false;
    }
    function lockKnown(name) {
        const s = state();
        return !!s.forceLocks[name] || !!s.forceLocks.all || questKnows(name);
    }
    function locks() {
        const s = state(), d = D(), out = { open: 0 };
        for (const k of d.LOCKS.order) { out[k] = !!s.locks[k]; out[k + "Known"] = lockKnown(k); if (out[k]) out.open++; }
        out.door = out.open >= d.LOCKS.need;
        return out;
    }
    function forceLock(name, v) {
        const s = state();
        s.forceLocks[name || "all"] = v === undefined ? true : !!v;
        return s.forceLocks[name || "all"];
    }

    // event commands built in code, run as a child of the event's own interpreter (like a common event)
    const C = {
        text: (lines, spk) => [{ code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] }]
            .concat([].concat(lines).map((l, i) => ({ code: 401, indent: 0, parameters: [(i === 0 && spk !== undefined ? "\\SPK[" + spk + "]" : "") + String(l).replace(/^> /, "")] }))),
        plain: line => [{ code: 101, indent: 0, parameters: ["", 0, 1, 1, ""] }, { code: 401, indent: 0, parameters: ["\\SPK[-1]" + line] }],
        script: code => [{ code: 355, indent: 0, parameters: [code] }],
        wait: n => [{ code: 230, indent: 0, parameters: [n] }],
        se: (name, vol, pitch) => [{ code: 250, indent: 0, parameters: [{ name, volume: vol || 80, pitch: pitch || 100, pan: 0 }] }],
        me: (name, vol) => [{ code: 249, indent: 0, parameters: [{ name, volume: vol || 80, pitch: 100, pan: 0 }] }],
        fadeOut: () => [{ code: 221, indent: 0, parameters: [] }],
        fadeIn: () => [{ code: 222, indent: 0, parameters: [] }],
        flash: (rgba, n) => [{ code: 224, indent: 0, parameters: [rgba, n, false] }],
        indent: (list, by) => list.map(c => Object.assign({}, c, { indent: (c.indent || 0) + by })),
        choice(question, options, branches, cancel) {
            let out = question ? C.text(question, 0) : [];
            out.push({ code: 102, indent: 0, parameters: [options, cancel === undefined ? options.length - 1 : cancel, 0, 2, 0] });
            options.forEach((o, i) => {
                out.push({ code: 402, indent: 0, parameters: [i, o] });
                out = out.concat(C.indent(branches[i] || [], 1));
                out.push({ code: 0, indent: 1, parameters: [] });
            });
            out.push({ code: 404, indent: 0, parameters: [] });
            return out;
        }
    };
    function runChild(interp, list) {
        if (!interp || !interp.setupChild) return false;
        interp.setupChild(list.concat([{ code: 0, indent: 0, parameters: [] }]), interp.eventId ? interp.eventId() : 0);
        return true;
    }
    // a lock of the door (Map011's lock events: Underground.lock("key", this))
    function lock(name, interp) {
        const d = D(), t = d.TEXT, s = state();
        let list = [];
        if (s.locks[name]) list = C.text(t[{ key: "lockKeyDone", signal: "lockSignalDone", song: "lockSongDone" }[name]], 0);
        else if (!lockKnown(name)) list = C.text(t[{ key: "lockKeyNo", signal: "lockSignalNo", song: "lockSongNo" }[name]], 0);
        else if (name === "key") list = C.se("Open5", 85, 70).concat(C.text(t.lockKeyYes, 0), C.script("Underground.openLock(\"key\")"));
        else if (name === "signal") {
            const ring = [];
            for (let i = 0; i < 7; i++) ring.push(...C.se("Bell1", 70, 70), ...C.wait(22));
            list = C.choice(t.lockSignalAsk, [t.lockSignalOpt, t.lockSignalLeave],
                [ring.concat(C.se("Bell3", 55, 50), C.text(t.lockSignalYes, 0), C.script("Underground.openLock(\"signal\")")), []]);
        } else if (name === "song") {
            list = C.choice(t.lockSongAsk, [t.lockSongOpt, t.lockSignalLeave],
                [C.me("Inn1", 70).concat(C.wait(40), C.text(t.lockSongYes, 0), C.script("Underground.openLock(\"song\")")), []]);
        }
        return runChild(interp, list);
    }
    function openLock(name) {
        const s = state(), d = D();
        if (s.locks[name]) return false;
        s.locks[name] = true;
        const l = locks();
        T.popup(Watki.wstaw(TK.kod.openLock[0], { "1": d.TEXT.lockNames[name] }), { top: true, sub: Watki.wstaw(TK.kod.openLock[1], { open: l.open }) });
        T.call("Combat", "discover", "ug_lock_" + name, Watki.wstaw(TK.kod.openLock[2], { "1": d.TEXT.lockNames[name] }), 60);
        T.emit("undergroundLock", { lock: name, open: l.open, door: l.door });
        syncDoor();
        return true;
    }
    // the door event of Map011 ("Drzwi Komnaty Serca"): its self switch A (the page with the door open) follows locks().door
    function syncDoor() {
        if (!window.$gameMap || $gameMap.mapId() !== D().MAPS.heart) return false;
        const open = locks().door;
        for (const ev of $gameMap.events()) {
            if (!ev.event() || !/^Drzwi Komnaty Serca/.test(ev.event().name || "")) continue;
            const key = [$gameMap.mapId(), ev.eventId(), "A"];
            if (!!$gameSelfSwitches.value(key) !== open) $gameSelfSwitches.setValue(key, open);
        }
        return open;
    }
    // the door: shut (how many locks are open) or open - the page with the door open shows when locks().door (the event's script)
    function door(interp) {
        const d = D(), l = locks();
        return runChild(interp, C.text(l.door ? d.TEXT.doorOpen : d.TEXT.doorShut(l.open), 0));
    }
    const doorOpen = () => locks().door;

    // ======================================================================================================================
    // Floor 100 (v2.1): the world the endings read, the Lord at the Heart (W7 ch. 7), the endings as scenes - in the chamber and
    // up above (the manor, the market, the camp, grandpa's house, the tavern) - then the epilogue; the game goes on in the tavern
    // ======================================================================================================================
    const H = () => D().HEART;
    // the town's quest flags (TownQuests' state; {} without it)
    function questFlags() {
        const TQ = T.api("TownQuests");
        try { return (TQ && TQ.state && TQ.state() && TQ.state().flags) || {}; } catch (e) { return {}; }
    }
    // "Borgar, Grum i Tadek" from the keys other plugins use
    function namesOf(keys) {
        const n = H().NAMES, list = [].concat(keys || []).filter(Boolean).map(k => n[k] || (String(k).charAt(0).toUpperCase() + String(k).slice(1)));
        return list.length < 2 ? list.join("") : list.slice(0, -1).join(", ") + " i " + list[list.length - 1];
    }
    // what the endings read, every plugin asked defensively (each may be missing): Story (the debt), TownQuests (Opinia, the flags of
    // W1-W9; W6's TownQuests.w6()), TownLife (who is gone), Act III (Act3.outcome() - null until the siege is over). F9 and the tests
    // can lay a world over it (state().forceWorld) and choose the Lord's stance (state().forceLord).
    function world() {
        const s = state(), fl = questFlags(), TQ = T.api("TownQuests");
        let op = null, w6 = null, siege = null, ss = null;
        try { op = TQ && TQ.opinion ? TQ.opinion() : null; if (typeof op !== "number") op = null; } catch (e) { op = null; }
        try { w6 = TQ && typeof TQ.w6 === "function" ? TQ.w6() : null; } catch (e) { w6 = null; }
        try { const A = T.api("Act3"); siege = A && typeof A.outcome === "function" ? A.outcome() : null; } catch (e) { siege = null; }
        try { const St = T.api("Story"); ss = St && St.state ? St.state() : null; } catch (e) { ss = null; }
        if (typeof siege === "string") siege = { result: siege };
        if (!siege || !siege.result) siege = fl.act3Held ? { result: "held" } : fl.act3Costly ? { result: "costly" } : fl.act3Fallen ? { result: "fallen" } : null;
        const gone = k => { try { return !!(window.TownLife && TownLife.gone && TownLife.gone(k)); } catch (e) { return false; } };
        const sg = siege && siege.grum;
        const w = {
            story: !!ss, debtPaid: !!ss && (ss.paid >= ss.debt || !!ss.done),
            // (2026-10-15) the field lost to the Lord at the deadline, and bought back from him (Story.js)
            fieldLost: !!ss && !!ss.lost && !(ss.buy && ss.buy.done), fieldBack: !!ss && !!ss.lost && !!(ss.buy && ss.buy.done),
            opinion: op, locks: locks().open,
            // (2026-10-17, W4 ch. 7 - Kasztelan.js) Borgar comes down to the Heart (and may stay its guardian) once he went down with the
            // hero (flag borgarIdzie); his saying alone (borgarSaying, ch. 5) no longer brings him: told and kept by the grate, or never told
            borgar: !!fl.borgarIdzie, ambrozy: !!fl.ambrozyChronicles, book: !!(fl.signalBook || fl.ambrozyChronicles),
            melia: fl.w3Sung ? "public" : fl.w3Borgar ? "borgar" : fl.w3Burned ? "burned" : null,
            grum: ["ally", "enemy", "ferry", "gone", "dead"].includes(sg) ? sg
                : fl.grumDead ? "dead" : fl.grumGone ? "gone" : fl.grumAlly ? "ally" : (fl.w8Faction || fl.w8Lost) ? "faction" : null,
            rafal: (siege && ["ally", "enemy", "gone", "taken", "dead"].includes(siege.rafal) && siege.rafal) || (w6 && w6.rafal) || (fl.rafalAlly ? "ally" : (fl.rafalGiven || fl.rafalEnemy) ? "enemy" : fl.rafalSmuggled ? "gone" : fl.rafalTaken ? "taken" : null),
            marek: !!((w6 && w6.marekSaved) || fl.marekSaved),
            camp: (w6 && w6.camp) || (fl.campInside ? "inside" : fl.campOutside ? "outside" : null),
            water: !!fl.sluiceHalf,
            // (2026-10-17, W7 variant A - Dwor.js: Feliks arrested for his letters to the faction, or fled on the ferry with them)
            feliks: fl.w1Revealed || fl.w7FeliksZatrzymany ? "arrested" : fl.w7FeliksUciekl ? "fled" : fl.kubaResent || fl.lordAlly ? "sent"
                : fl.feliksPays ? "pays" : gone("feliks") ? "gone" : "here",
            // (2026-10-16) branch: the manor's branch of the Order's cistern shut (Cysterna.js, D28) - the Lord is no ally any more
            // (2026-10-17, W7) w7: the Lord learnt the truth of Feliks's letters (lordAlly is set with it); first: the hero tells him
            // everything found under the rocks (Act II - his men follow him down); lie: the hero lied about the ruins and it came out
            lordFlags: { ally: !!fl.lordAlly, cold: !!(fl.w1Revealed || fl.lordCold), truth: !!fl.lordTruth, branch: !!fl.galazDworskaZamknieta,
                w7: !!fl.w7Prawda, first: !!fl.w7LordFirst, lie: !!fl.w7KlamstwoWyszlo },
            // (2026-10-17) W7 "Dwór z kamieni twierdzy" (Dwor.js): { truth, how, fate, first, lie, spy, letters } or null
            w7: (() => { try { return T.call("Dwor", "forWorld") || null; } catch (e) { return null; } })(),
            island: islandOf(fl),
            // (2026-10-17) W9 ch. 3 "Rywal w ruinach" (Rywal.js): who went down for the Heart before the hero, and how it ended -
            // { key: grum | lord | baltazar | kopacze, outcome, deep (went down past the tenth gate), faction, floor, lordLine } or null
            rival: (() => { try { return T.call("Rywal", "forWorld") || null; } catch (e) { return null; } })(),
            // (2026-10-17) W4 "Krew kasztelana" (Kasztelan.js): { stance: idzie | pilnuje | niewie | null, told, closed, warned, fired, back,
            // clues, keyLock } or null
            w4: (() => { try { return T.call("Kasztelan", "forWorld") || null; } catch (e) { return null; } })(),
            siege
        };
        const f = s.forceWorld;
        if (f && typeof f === "object") for (const k of Object.keys(f)) w[k] = JSON.parse(JSON.stringify(f[k]));
        if (w.siege) w.siege = Object.assign({}, w.siege, { names: { defenders: namesOf(w.siege.defenders), lost: namesOf(w.siege.lost) } });
        w.butler = w.feliks === "here" || w.feliks === "pays" ? "feliks" : "teodor";
        const L = s.lord || {};
        w.lord = { stance: L.stance || lordStance(w), choice: L.choice || null, told: L.told || null, cold: !!(w.lordFlags && w.lordFlags.cold) };
        return w;
    }
    // (2026-10-16) what became of the six island places (their packages' flags and state, each asked defensively) - the epilogue's lines
    // (Underground_Data EPILOGUE.island): null = the hero never got there / nothing to say
    function islandOf(fl) {
        const safe = f => { try { return f(); } catch (e) { return null; } };
        const K = T.api("Kruk"), L = T.api("Latarnia"), G = T.api("Garnizon");
        const lat = safe(() => (L && L.info ? L.info() : null));
        const favor = safe(() => (G && G.favor ? Number(G.favor()) : null));
        return {
            pustelnia: fl.kleofasUfa ? "kroniki" : fl.sercePustelni ? "dzwon" : null,
            kruk: fl.krukTame ? (safe(() => (K && K.state ? K.state().name : null)) || "Kruk") : null,
            latarnia: !fl.latarnikMet ? null : fl.soczewkaRozbita ? "rozbita" : fl.soczewkaSprzedana ? "sprzedana"
                : (lat && lat.built && typeof lat.fuel === "number" && lat.fuel <= 0) ? "zgasla" : "stoi",
            garnizon: !fl.garnizonPoznany ? null : fl.klosWydany ? "klos" : favor !== null && favor >= 80 ? "nasz" : favor !== null && favor < 10 ? "wrog" : null,
            wrak: fl.ansgarAlly ? "ally" : fl.ansgarGiven ? "given" : fl.ansgarFled ? "fled" : null,
            cysterna: fl.galazDworskaZamknieta ? "galaz" : fl.rynnyCzyste ? "rynny" : fl.cysternaOtwarta ? "otwarta" : null
        };
    }
    // the Lord's stance at the Heart: ally (the quiet way of W1 - lordAlly - or his truth told, W9 ch. 6), rival (shamed at the market,
    // W1 a: "Mówiłem: najpierw do mnie"), absent (he never learnt the hero went down - or no story).
    // (2026-10-15) The field lost and not bought back: he holds the hero's grandfather's land and wants to be first under the tavern -
    // a rival, unless the hero made him an ally (W1's quiet way) or told him his truth (W9 ch. 6). Bought back: as if the debt was paid.
    // (2026-10-16) The manor's branch of the cistern shut (D28 - the coordinator's decision: it ALWAYS chills him, flag lordCold too):
    // an ally no more - a rival, unless his truth was told.
    // (2026-10-17, W7 variant A - Dwor.js) What comes first: 1) F9's force; 2) the hero lied to him about the ruins and it came out
    // (w7KlamstwoWyszlo) - a rival, whatever was before; 3) his own truth told (W9 ch. 6) - an ally; 4) the cistern's manor branch
    // shut - a rival (the coordinator's rule stays: even after W7's truth); 5) an ally: the truth of Feliks's letters (W7 - it sets
    // lordAlly), W1's quiet way, or the hero telling him all he finds underground (W7 ch. 6) - also with the field lost and not
    // bought back, also after W1 a's shame; 6) the field lost - a rival; 7) W1 a / lordCold - a rival; 8) else absent.
    function lordStance(w) {
        const f = state().forceLord;
        if (f === "ally" || f === "rival" || f === "absent") return f;
        if (!w.story) return "absent";
        const lf0 = w.lordFlags || {};
        if (lf0.lie) return "rival";
        const lf = lf0, ally = !!lf.truth || ((!!lf.ally || !!lf.w7 || !!lf.first) && !lf.branch);
        if (w.fieldLost) return ally ? "ally" : "rival";
        if (!w.debtPaid && !w.fieldBack) return "absent";
        if (ally) return "ally";
        if (lf.cold || lf.branch) return "rival";
        return "absent";
    }
    const plainWorld = w => JSON.parse(JSON.stringify(w));

    // ---- the cast: actor events on the chamber's map (always there, hidden till a scene needs them) and on the map of a scene up
    // above while it plays (film.next) - ids 800-827
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function actorEvent(id, key, x, y, dir, opts) {
        const o = opts || {}, a = H().ACTORS[key] || {}, name = a.name || key;
        const bust = o.bust !== undefined ? o.bust : a.bust;
        return { id, name, x, y, note: (bust ? "<Bust:" + bust + ">" : "") + "<BustName:" + name + "><Actor:" + key + ">",
            pages: [{ conditions: Object.assign({}, COND), directionFix: false,
                image: { tileId: 0, characterName: o.show ? (o.sheet || a.sheet || "") : "", characterIndex: 0, direction: dir || 2, pattern: 1 },
                list: [{ code: 0, indent: 0, parameters: [] }], moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
                moveSpeed: o.speed || 3, moveType: 0, priorityType: 1, stepAnime: false, through: true, trigger: 0, walkAnime: true }] };
    }
    const film = { next: null, pending: null, speed: 1, cinema: false, hidden: [], bars: null, log: [] };
    function chamberCast() {
        const c = H().IDS.chamber, sp = H().SPOTS, s = state(), out = [];
        for (const key of Object.keys(c)) {
            if (key === "asker") { const ev = actorEvent(c.asker, "lord", sp.door[0], sp.door[1], 8, { bust: "" }); ev.note = "<Actor:asker>"; out.push(ev); continue; }
            const [x, y, dir] = sp[key] || [sp.door[0], sp.door[1], 2];
            // after the "guardian" ending Borgar or Ambroży sits on the bench before the Heart (the order's watch: they come and go)
            const sits = s.ending && s.ending.kind === "straznik" && s.ending.guardian === key;
            const ev = sits ? actorEvent(c[key], key, sp.bench[0], sp.bench[1], sp.bench[2], { show: true }) : actorEvent(c[key], key, x, y, dir);
            if (sits) ev.pages[0].list = [{ code: 355, indent: 0, parameters: ["Underground.heart(this)"] }, { code: 0, indent: 0, parameters: [] }];
            out.push(ev);
        }
        return out;
    }
    if (inGame && D() && D().HEART) {
        const [from, to] = [D().HEART.IDS.chamber.lord, D().HEART.IDS.shots[1]];
        T.inject(mapId => mapId === D().MAPS.heart || !!(film.next && film.next.map === mapId), { ids: [from, to], owner: PLUGIN, fixSaved: true,
            build(data, mapId) {
                if (film.next && film.next.map === mapId) {
                    return film.next.actors.map(a => actorEvent(a.id, a.key, a.x, a.y, a.dir, { show: true, bust: "none", sheet: a.sheet }));
                }
                return mapId === D().MAPS.heart ? chamberCast() : [];
            } });
    }

    // ---- the event commands of a scene (HEART's steps -> commands); cast: actor key -> event id on the map the steps play on
    const W = n => Math.max(1, Math.round(n * film.speed));
    const clean = l => String(l).replace(/^> /, "");
    const F = {
        narr: (line, mid) => [{ code: 101, indent: 0, parameters: ["", 0, 1, mid ? 1 : 2, ""] }, { code: 401, indent: 0, parameters: ["\\SPK[-1]" + clean(line)] }],
        wait: n => [{ code: 230, indent: 0, parameters: [W(n)] }],
        tint: (tone, n) => [{ code: 223, indent: 0, parameters: [tone, W(n), false] }],
        shake: (p, s, n) => [{ code: 225, indent: 0, parameters: [p, s, W(n), false] }],
        transfer: (mapId, x, y, dir) => [{ code: 201, indent: 0, parameters: [0, mapId, x, y, dir || 2, 2] }],
        bgsOut: secs => [{ code: 246, indent: 0, parameters: [secs] }],
        bgmOut: secs => [{ code: 242, indent: 0, parameters: [secs] }],
        call: (fn, args) => C.script("Underground.film." + fn + "(this" + (args && args.length ? ", " + args.map(a => JSON.stringify(a)).join(", ") : "") + ")")
    };
    // the Heart's light in a scene: the commands of each effect (the light itself: heartFx, drawn by the updater below)
    function fxList(name) {
        switch (name) {
            case "pulse": return F.call("fx", ["pulse"]);
            case "flare": return C.se("Magic3", 75, 70).concat(C.flash([255, 250, 230, 170], W(20)), F.call("fx", ["flare"]), F.wait(30));
            case "overflow": return C.se("Darkness5", 70, 60).concat(F.call("fx", ["flare"]), F.shake(4, 8, 50), F.tint([50, 40, 90, 60], 20),
                F.call("barks", [3]), F.wait(80));
            case "calm": return F.tint([0, 0, 0, 0], 30).concat(F.call("fx", [null]), F.wait(20));
            case "whispers": return F.call("fx", ["pulse"]).concat(F.call("barks", [3]), F.wait(110));
            case "crack": return C.se("Blow3", 90, 70).concat(C.se("Crash", 90, 60), C.flash([255, 255, 255, 255], W(30)), F.shake(9, 9, 45),
                F.call("fx", ["crack"]), F.wait(45));
            case "montage": return F.tint([200, 200, 200, 0], 10).concat(C.se("Magic10", 70, 120), F.call("montage", []), F.wait(170));
            case "dark": return C.se("Thunder9", 70, 50).concat(F.call("fx", ["shards"]), F.tint([-220, -220, -220, 0], 40), F.bgsOut(2), F.wait(70),
                F.tint([-90, -90, -80, 40], 90), F.wait(60));
            case "rise": return C.se("Magic10", 85, 70).concat(F.call("fx", ["rise"]), C.flash([255, 255, 240, 200], W(30)), F.wait(30),
                C.flash([255, 255, 240, 220], W(30)), F.tint([180, 180, 170, 0], 90), F.wait(100));
            case "seal": return F.call("fx", ["seal"]).concat(F.tint([-50, -50, -40, 30], 70), F.wait(80));
            case "warm": return C.se("Saint3", 60, 80).concat(F.call("fx", ["warm"]), F.tint([30, 15, -10, 0], 60), F.wait(50));
            case "light": return F.tint([0, 0, 0, 0], 40).concat(F.wait(30));
            default: return [];
        }
    }
    function idOf(who, cast) {
        if (who === "hero") return -1;
        return cast[who] || 0;
    }
    function stepsList(steps, cast, ctx) {
        let out = [];
        for (const st of [].concat(steps || [])) {
            if (!st) continue;
            if (Array.isArray(st)) {
                const [who, raw] = st, text = clean(typeof raw === "function" ? raw(ctx.w, ctx.e, ctx.has) : raw);
                if (!text) continue;
                film.log.length < 400 && film.log.push(text);
                if (who === null) out = out.concat(F.narr(text));
                else if (who === "hero") out = out.concat(C.text([text], 0));
                else if (cast[who]) out = out.concat(C.text([text], cast[who]));
                else out = out.concat(F.narr(((H().ACTORS[who] || {}).name || who) + ": „" + text + "”"));
                continue;
            }
            if (st.fx) out = out.concat(fxList(st.fx));
            else if (st.walk) out = out.concat(F.call("walk", [idOf(st.walk[0], cast), st.walk[1], st.walk[2], st.walk[3] || 0]));
            else if (st.appear) {
                const [who, x, y, dir] = st.appear, id = idOf(who, cast);
                if (id) out = out.concat(F.call("appear", [id, (H().ACTORS[who] || {}).sheet || "", x, y, dir || 2]));
            } else if (st.leave) { const id = idOf(st.leave, cast); if (id) out = out.concat(F.call("leave", [id])); }
            else if (st.face) out = out.concat(F.call("face", [idOf(st.face[0], cast), st.face[1]]));
            else if (st.balloon) out = out.concat(F.call("balloon", [idOf(st.balloon[0], cast), st.balloon[1]]), F.wait(50));
            else if (st.wait) out = out.concat(F.wait(st.wait));
            else if (st.se) out = out.concat(C.se(st.se[0], st.se[1], st.se[2]));
            else if (st.me) out = out.concat(C.me(st.me[0], st.me[1]));
            else if (st.shake) out = out.concat(F.shake(st.shake[0], st.shake[1], st.shake[2]));
            else if (st.notice) out = out.concat(F.call("notice", [st.notice]), F.wait(28));
            else if (st.caption) out = out.concat(F.call("caption", [st.caption, st.frames || 46]), F.wait((st.frames || 46) - 6));
            else if (st.card) {
                out = out.concat(C.fadeOut(), F.wait(20));
                for (const l of st.card) out = out.concat(F.narr(l, true));
                out = out.concat(F.wait(10), C.fadeIn());
            } else if (st.asker) {
                const a = H().ASKERS.find(k => { try { return k.when(ctx.w, ctx.e); } catch (e) { return false; } }) || H().ASKERS[H().ASKERS.length - 1];
                const id = H().IDS.chamber.asker, sp = H().SPOTS;
                out = out.concat(F.call("appear", [id, (H().ACTORS[a.who] || {}).sheet || "", sp.door[0], sp.door[1], 8, (H().ACTORS[a.who] || {}).name || ""]),
                    F.call("walk", [id, sp.asker[0], sp.asker[1], sp.asker[2]]),
                    stepsList(a.lines, Object.assign({}, cast, { asker: id }), ctx));
                film.asker = a.who;
            } else if (st.heroIn) out = out.concat(F.call("heroIn", st.heroIn));
        }
        return out;
    }
    const chamberIds = () => Object.assign({}, H().IDS.chamber);

    // ---- the Lord at the Heart: his arrival, the hero's choice (let him ask / refuse / ask for him - and what to tell him), he goes
    function lordList(stance, w) {
        const L = H().LORD, cast = chamberIds(), ctx = { w, e: null, has: {} };
        const set = (choice, told) => F.call("lord", [stance, choice, told || null]);
        const leave = stepsList(L.leave, cast, ctx);
        const tell = C.choice(null, [L.tellOpts.truth, L.tellOpts.mercy, L.tellOpts.silent],
            ["truth", "mercy", "silent"].map(k => set("askFor", k).concat(stepsList(L.told[k], cast, ctx))), 2);
        const branches = [
            set("allow").concat(stepsList(L.allow, cast, ctx), stepsList(L.allowAfter[stance], cast, ctx), leave),
            set("refuse").concat(stepsList(L.refuse[stance], cast, ctx), leave),
            set("askFor").concat(stepsList(L.askFor, cast, ctx), tell, stance === "rival" ? stepsList(L.askForRival, cast, ctx) : [], leave)
        ];
        return F.call("start", []).concat(F.call("place", []), stepsList(L.arrive[stance], cast, ctx),
            C.choice(L.ask, [L.opts.allow, stance === "rival" ? L.opts.refuseRival : L.opts.refuseAlly, L.opts.askFor], branches, 1), F.call("end", []));
    }
    // the Heart's look and the choice of Act III (STORY.md); "Zostać strażnikiem" asks who when Borgar (W4) or Ambroży (W2) may stay
    function guardians() {
        const fl = questFlags(), s = state(), w = s.forceWorld || {};
        return { borgar: !!fl.borgarIdzie || !!w.borgar || !!s.forceLocks.all, ambrozy: !!fl.ambrozyChronicles || !!w.ambrozy || !!s.forceLocks.all };
    }
    function choiceList() {
        const t = D().TEXT, kinds = ["zniszczyc", "straznik", "uwolnic", "zapieczetowac"];
        const confirm = (kind, who) => C.choice(t.heartConfirm, [t.heartYes, t.heartNo], [C.script("Underground.ending(\"" + kind + "\", \"" + (who || "hero") + "\", this)"), []], 1);
        const g = guardians();
        const who = [["hero", t.guardianHero]].concat(g.borgar ? [["borgar", t.guardianBorgar]] : [], g.ambrozy ? [["ambrozy", t.guardianAmbrozy]] : []);
        const guardBranch = who.length > 1 ? C.choice(t.guardianWho, who.map(x => x[1]).concat([t.heartNo]), who.map(x => confirm("straznik", x[0])).concat([[]]))
            : confirm("straznik");
        const branches = kinds.map(k => (k === "straznik" ? guardBranch : confirm(k))).concat([[]]);
        return C.se("Magic3", 60, 60).concat(C.flash([255, 240, 200, 120], 30), C.text(t.heartLook, 0),
            C.choice(t.heartAsk, kinds.map(k => t.heartChoices[k]).concat([t.heartChoices.wait]), branches));
    }
    // the Heart (its event: Underground.heart(this)): after an ending what is left of it; else the Lord first (once, when he comes
    // down at all), then the look and the choice
    function heart(interp) {
        const t = D().TEXT, s = state();
        if (s.ending) {
            const g = s.ending.kind === "straznik" ? s.ending.guardian || "hero" : null, cast = chamberIds();
            if (g && t.heartAfterGuardian && t.heartAfterGuardian[g]) return runChild(interp, C.text(t.heartAfterGuardian[g], g === "hero" ? 0 : cast[g]));
            return runChild(interp, C.text(t.heartAfter[s.ending.kind] || t.heartLook.slice(0, 1), 0));
        }
        let list = [];
        if (!s.lord) {
            const w = world();
            if (w.lord.stance !== "absent") list = lordList(w.lord.stance, w);
        }
        return runChild(interp, list.concat(choiceList()));
    }

    // ---- an ending: the chamber, the black card, the scenes up above, the epilogue, KONIEC and the choice (the game goes on)
    function epilogueLines(kind, who) {
        const d = D(), e = d.ENDINGS[kind];
        if (!e) return [];
        return (kind === "straznik" ? (e.guardian[who] || e.guardian.hero) : e.lines).concat(epilogueExtras(kind, null, who));
    }
    function epilogueExtras(kind, w0, who) {
        const ep = D().EPILOGUE, out = [], w = w0 || world(), fl = questFlags();
        if (locks().open >= 3 || w.locks >= 3) out.push(ep.allLocks);
        if (w.opinion !== null && w.opinion >= 60) out.push(ep.opinionHigh);
        else if (w.opinion !== null && w.opinion < 20) out.push(ep.opinionLow);
        if (w.water) out.push(ep.water);
        if (kind === "zapieczetowac" && (w.book || fl.ambrozyChronicles || fl.signalBook)) out.push(ep.ambrozyBook);
        // (2026-10-17) the rival of the ruins (W9 ch. 3, Rywal.js): one line by how it ended
        let rl = null;
        try { rl = T.call("Rywal", "epilogue", kind, w); } catch (e) { rl = null; }
        if (typeof rl === "string" && rl) out.push(rl);
        // (2026-10-17) the manor of the fortress stones (W7, Dwor.js): one line - the ravens of the hall, the lie, Feliks
        let dl = null;
        try { dl = T.call("Dwor", "epilogue", kind, w); } catch (e) { dl = null; }
        if (typeof dl === "string" && dl) out.push(dl);
        // (2026-10-17) Borgar's blood (W4, Kasztelan.js): his fire at the tenth gate, his watch by the grate - or that he never knew
        let kl = null;
        try { kl = T.call("Kasztelan", "epilogue", kind, w, who); } catch (e) { kl = null; }
        if (typeof kl === "string" && kl) out.push(kl);
        // (2026-10-17) the mother's letters (W10, Przystan.js): one line - did the hero write back, did he send her anything
        let ml = null;
        try { ml = T.call("Przystan", "epilogue", kind, w); } catch (e) { ml = null; }
        if (typeof ml === "string" && ml) out.push(ml);
        // (2026-10-18) the white eagle (Orzel.js): one line - where it circles now, or that it never came back from the ridge
        let ol = null;
        try { ol = T.call("Orzel", "epilogue", kind, w); } catch (e) { ol = null; }
        if (typeof ol === "string" && ol) out.push(ol);
        // (2026-10-22) the new terrain's packages (docs/rozszerzenia/PLAN.md): a line or a list each - the springs (Zasoby), the friendly
        // pack and the Lord's game park (Lowy), the Ług graves and the smugglers' cave (Ludzie), the order's chamber and the grove (Zakon)
        for (const name of ["Zasoby", "Lowy", "Ludzie", "Zakon"]) {
            let pl = null;
            try { pl = T.call(name, "epilogue", kind, w); } catch (e) { pl = null; }
            for (const l of [].concat(pl || [])) if (typeof l === "string" && l) out.push(l);
        }
        return out.concat(islandLines(kind, w, who));
    }
    // (2026-10-16) the island places' lines (EPILOGUE.island), in the order of the places on the map: the cliff, the raven, the cape,
    // the garrison, the wreck, the cistern
    function islandLines(kind, w, who) {
        const L = D().EPILOGUE.island, is = (w && w.island) || {}, out = [];
        if (!L) return out;
        const one = (tab, key) => (tab && key && typeof tab[key] === "string" ? tab[key] : null);
        out.push(one(L.pustelnia, is.pustelnia));
        if (is.kruk) out.push((kind === "straznik" && (who || "hero") === "hero" ? L.krukStraznik : L.kruk).replace("{imie}", is.kruk));
        if (is.latarnia) out.push(one(L.latarnia, is.latarnia === "stoi" ? kind : is.latarnia));
        out.push(one(L.garnizon, is.garnizon), one(L.wrak, is.wrak), one(L.cysterna, is.cysterna));
        return out.filter(Boolean);
    }
    const valOf = (v, w) => (typeof v === "function" ? v(w) : v);
    // the scenes up above that play (HEART.SHOTS, each when its `when` holds), with their cast
    function shotsOf(w, e) {
        const out = [];
        let next = H().IDS.shots[0];
        for (const sh of H().SHOTS) {
            let ok = true;
            try { ok = !sh.when || !!sh.when(w, e); } catch (er) { ok = false; }
            if (!ok) continue;
            const map = valOf(sh.map, w), cam = valOf(sh.cam, w), cast = {}, actors = [];
            for (const a of sh.actors ? sh.actors(w, e) : []) {
                let [key, x, y, dir] = a;
                if (key === "butler") key = w.butler;
                if (next > H().IDS.shots[1] || cast[key]) continue;
                const id = next++;
                cast[key] = id;
                if (a[0] === "butler") cast.butler = id;
                actors.push({ id, key, x, y, dir, sheet: (H().ACTORS[key] || {}).sheet });
            }
            next = H().IDS.shots[0];   // (each scene its own map: the same ids again)
            out.push({ key: sh.key, map, cam, actors, cast, hero: sh.hero ? sh.hero(w, e) : null, last: !!sh.last, steps: sh.steps(w, e) });
        }
        return out;
    }
    function filmList(kind, who, w) {
        const d = D(), e = { kind, guardian: kind === "straznik" ? who : null }, has = { borgar: !!w.borgar, ambrozy: !!w.ambrozy };
        const ctx = { w, e, has }, cast = chamberIds(), sp = H().SPOTS;
        film.log = [];
        let list = F.call("start", []).concat(F.call("place", []));
        // who came down with the hero (W4 Borgar, W2 Ambroży)
        if (has.borgar || has.ambrozy) {
            list = list.concat(stepsList([H().COMPANIONS.arrive,
                has.borgar && { appear: ["borgar", sp.door[0], sp.door[1], 8] }, has.borgar && { walk: ["borgar"].concat(sp.borgar) },
                has.ambrozy && { appear: ["ambrozy", sp.door[0], sp.door[1] + 1, 8] }, has.ambrozy && { walk: ["ambrozy"].concat(sp.ambrozy) },
                has.borgar && H().COMPANIONS.borgar, has.ambrozy && H().COMPANIONS.ambrozy], cast, ctx));
        }
        list = list.concat(stepsList(H().CHAMBER[kind](w, e, has), cast, ctx));
        // the black card: the ending's own words, then up (or not: the hero who stays below sees the town in the Heart's light)
        const ends = d.ENDINGS[kind], words = kind === "straznik" ? (ends.guardian[who] || ends.guardian.hero) : ends.lines;
        list = list.concat(C.fadeOut(), F.wait(30), F.bgmOut(3), F.bgsOut(3));
        for (const l of words) list = list.concat(F.narr(l, true));
        film.log.push(...words);
        list = list.concat(F.narr(e.guardian === "hero" ? H().AFTER_GUARDIAN : H().AFTER, true), F.call("morning", []));
        // the scenes up above
        const shots = shotsOf(w, e);
        for (const sh of shots) {
            list = list.concat(F.call("prepare", [sh.key, sh.map, sh.actors]), F.transfer(sh.map, sh.cam[0], sh.cam[1], sh.hero ? sh.hero[2] : 2),
                F.call("arrive", [sh.key, sh.hero || null]), F.wait(10), C.fadeIn(), F.wait(24),
                stepsList(sh.steps, sh.cast, ctx), F.wait(40));
            if (!sh.last) list = list.concat(C.fadeOut(), F.wait(10));
        }
        // the epilogue (what the town did with the hero), KONIEC and the choice: the game goes on in the tavern, or the title screen
        const extras = epilogueExtras(kind, w, who);
        list = list.concat(F.tint([-110, -110, -110, 60], 60), F.wait(40));
        for (const l of extras) list = list.concat(F.narr(l, true));
        film.log.push(...extras);
        list = list.concat(C.me("Inn2", 60), F.narr(d.TEXT.endTitle + " - " + ends.title, true));
        list = list.concat(C.choice(null, [d.TEXT.endContinue, d.TEXT.endTitleScreen],
            [C.script("Underground.afterEnding()"), C.script("Underground.film.end(); SceneManager.goto(Scene_Title)")], 0));
        film.shots = shots.map(s => s.key);
        return list;
    }
    function ending(kind, who, interp) {
        const d = D(), s = state();
        if (!d.ENDINGS[kind] || s.ending) return false;
        const g = kind === "straznik" ? (who || "hero") : null, w = world();
        s.ending = { kind, guardian: g, locks: locks().open, day: T.call("Survival", "day") || T.time.day() || 0, lord: Object.assign({}, w.lord) };
        T.call("Combat", "discover", "ug_ending", Watki.wstaw(TK.kod.ending[0], { title: d.ENDINGS[kind].title }), 500);
        T.emit("undergroundEnding", Object.assign({}, s.ending));
        const list = filmList(kind, g || "hero", w);
        s.ending.world = plainWorld(Object.assign({}, w, { shots: film.shots }));
        return runChild(interp, list);
    }
    // back to the game after an ending: the scenes' cast goes, the hero stands at the bar of the tavern (the chamber keeps the ending)
    function afterEnding() {
        film.end();
        $gamePlayer.setTransparent(false);
        $gamePlayer.reserveTransfer(1, 16, 18, 8, 0);
        $gamePlayer.requestMapReload();
        $gameScreen.startTint([0, 0, 0, 0], 1);
        $gameScreen.startFadeIn(30);
        return true;
    }
    // the chamber after an ending: the Heart's light changes (the event "Serce Twierdzy (blask)" on Map011): dark shards (destroyed),
    // nothing (let out), a stone seal (sealed); it keeps shining over its new guardian (Borgar / Ambroży sit on the bench - the cast)
    function heartData(events) {
        const s = state();
        if (!s || !s.ending || s.ending.kind === "straznik") return;
        for (const e of events) {
            if (!e || e.name !== TK.kod.heartData[0]) continue;
            const img = e.pages[0].image;
            if (s.ending.kind === "zniszczyc") Object.assign(img, { characterName: "", tileId: 512 + 32 });   // (Dungeon D: crystal shards lying)
            else if (s.ending.kind === "uwolnic") Object.assign(img, { characterName: "", tileId: 0 });
            else if (s.ending.kind === "zapieczetowac") Object.assign(img, { characterName: "!Dungeon_Secrets", characterIndex: 0, direction: 2, pattern: 1 });
            e.pages[0].stepAnime = false;
            e.note = "";   // (no light any more)
        }
    }

    // ---- what the scenes' script calls do (Underground.film.*: `this` of the event's interpreter first)
    const charOf = id => (id < 0 ? $gamePlayer : id > 0 ? $gameMap.event(id) : null);
    const glowEvent = () => (window.$gameMap ? $gameMap.events().find(e => e.event() && e.event().name === TK.kod.glowEvent[0]) || null : null);
    const heartEvent = () => (window.$gameMap ? $gameMap.events().find(e => e.event() && e.event().name === TK.kod.heartEvent[0]) || null : null);
    // a path of 4-way steps on the map's passage (events left out: the cast walks through), [] when none
    function pathTo(sx, sy, tx, ty) {
        if (sx === tx && sy === ty) return [];
        // (the search: Tawerna.grid.bfs - 2026-11-07, one for all; the goal's own cell needs no passage)
        const r = T.grid.bfs({ w: $gameMap.width(), h: $gameMap.height(), sx, sy, dirs: [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]], atFind: true, seen: 2500,
            goal: (x, y) => x === tx && y === ty, can: (x, y, nx, ny, d) => (nx === tx && ny === ty) || $gameMap.isPassable(x, y, d) });
        if (r) return r.dirs;
        // (no way round: straight there, the route skips what blocks)
        const out = [];
        for (let i = 0; i < Math.abs(tx - sx); i++) out.push(tx > sx ? 6 : 4);
        for (let i = 0; i < Math.abs(ty - sy); i++) out.push(ty > sy ? 2 : 8);
        return out;
    }
    const MOVE = { 2: 1, 4: 2, 6: 3, 8: 4 }, TURN = { 2: 16, 4: 17, 6: 18, 8: 19 };
    // the Heart's light: an effect drawn by the map's updater (scale, light, shaking); shards / nothing / the seal when it ends
    const hfx = { mode: null, t: 0 };
    function heartFx(mode) {
        hfx.mode = mode || null;
        hfx.t = 0;
        const ev = glowEvent();
        if (!ev) return false;
        if (mode === "shards") { ev.setTileImage(512 + 32); ev.setStepAnime(false); ev.setOpacity(255); ev.setBlendMode(0); hfx.mode = null; }
        if (!mode) { ev.setOpacity(255); ev.setBlendMode(0); }
        return true;
    }
    function updateHeartFx() {
        if (!hfx.mode || !window.$gameMap || $gameMap.mapId() !== D().MAPS.heart) return;
        const ev = glowEvent(), sc = SceneManager._scene, set = sc && sc._spriteset;
        const sp = ev && set && set._characterSprites ? set._characterSprites.find(s => s._character === ev) : null;
        if (!ev || !sp) return;
        const t = ++hfx.t, m = hfx.mode;
        let scale = 1;
        if (m === "pulse") scale = 1 + 0.12 * Math.sin(t / 6);
        else if (m === "flare") { scale = 1 + Math.min(1, t / 20) * 0.6 + 0.06 * Math.sin(t / 3); ev.setBlendMode(1); }
        else if (m === "warm") { scale = 0.88 + 0.04 * Math.sin(t / 20); ev.setOpacity(Math.max(170, 255 - t * 2)); }
        else if (m === "crack") {
            scale = 1.2;
            sp.x += (t % 4 < 2 ? 3 : -3);
            ev.setOpacity(t % 6 < 3 ? 255 : 120);
            if (t >= 44) heartFx("shards");
        } else if (m === "rise") {
            scale = 1 + Math.min(1.5, t / 40);
            ev.setBlendMode(1);
            ev.setOpacity(Math.max(0, 255 - t * 3));
            sp.y -= Math.min(160, t * 2);
            if (t >= 90) { ev.setImage("", 0); hfx.mode = null; }
        } else if (m === "seal") {
            ev.setOpacity(Math.max(0, 255 - t * 5));
            scale = Math.max(0.3, 1 - t / 80);
            if (t >= 52) { ev.setImage("!Dungeon_Secrets", 0); ev.setDirection(2); ev.setPattern(1); ev.setStepAnime(false); ev.setOpacity(255); ev.setBlendMode(0); hfx.mode = null; }
        }
        if (hfx.mode) sp.scale.set(scale, scale);
        else sp.scale.set(1, 1);
    }
    // the cinema: black bars over the map and the HUD out of the way while an ending plays
    function updateCinema() {
        const sc = SceneManager._scene;
        if (!(sc instanceof Scene_Map)) return;
        if (film.cinema) {
            if (!film.bars || film.bars.parent !== sc) {
                const bars = new Sprite(), h = 54;
                for (const y of [0, Graphics.height - h]) {
                    const b = new Sprite(new Bitmap(Graphics.width, h));
                    b.bitmap.fillAll("#000000");
                    b.y = y;
                    bars.addChild(b);
                }
                bars.alpha = 0;
                const at = sc._spriteset ? sc.children.indexOf(sc._spriteset) + 1 : 0;
                sc.addChildAt(bars, Math.max(0, at));
                film.bars = bars;
            }
            film.bars.alpha = Math.min(1, film.bars.alpha + 0.06);
            for (const el of (sc.hudFadeElements ? sc.hudFadeElements() : [])) {
                if (!el) continue;
                if (el.visible && !film.hidden.includes(el)) film.hidden.push(el);
                el.visible = false;
            }
        }
        // a caption: a big line in the middle, rising a little as it fades in and out
        if (film.cap) {
            if (!film.capSprite || film.capSprite.parent !== sc) {
                const sp = new Sprite(new Bitmap(Graphics.width, 90));
                sc.addChildAt(sp, Math.max(0, sc._spriteset ? sc.children.indexOf(sc._spriteset) + 1 : 0));
                film.capSprite = sp;
            }
            const sp = film.capSprite, c = film.cap;
            if (sp._capText !== c.text) {
                const b = sp.bitmap;
                b.clear();
                b.fontFace = $gameSystem.mainFontFace();
                b.fontSize = 44;
                b.textColor = "#ffd866";
                b.outlineColor = TK.kod.updateCinema[0];
                b.outlineWidth = 7;
                b.drawText(c.text, 0, 10, Graphics.width, 70, "center");
                sp._capText = c.text;
            }
            c.t++;
            const k = Math.max(1, Math.round(c.life / 4));
            sp.alpha = Math.max(0, Math.min(1, c.t / k, (c.life - c.t) / k));
            sp.y = Math.round(Graphics.height / 2 - 45 - c.t * 0.6);
            if (c.t >= c.life) { film.cap = null; sp.alpha = 0; }
        } else if (film.capSprite && film.capSprite.alpha) film.capSprite.alpha = 0;
        if (!film.cinema && film.bars) {
            if (film.bars.parent) film.bars.parent.removeChild(film.bars);
            film.bars = null;
            for (const el of film.hidden) el.visible = true;
            film.hidden = [];
        }
    }
    if (inGame) {
        T.onMapUpdate(() => {
            updateHeartFx();
            updateCinema();
            if (film.fades.length) {
                for (const f of film.fades) {
                    const ev = charOf(f.id);
                    if (!ev) { f.done = true; continue; }
                    if (f.wait) { if (ev.isMoveRouteForcing()) continue; f.wait = false; }
                    const o = Math.max(0, Math.min(255, ev.opacity() + f.step));
                    ev.setOpacity(o);
                    if ((f.step > 0 && o >= 255) || (f.step < 0 && o <= 0)) { f.done = true; if (f.step < 0) { ev.setImage("", 0); ev.setOpacity(255); } }
                }
                film.fades = film.fades.filter(f => !f.done);
            }
        }, { owner: PLUGIN, name: "heartFilm" });
        // no autosave while an ending plays (the engine saves after every transfer - a save in the middle of a scene would load
        // into half of it); the night's sleep before the town's scenes is saved once the game goes on (Atmosphere)
        const _shouldAutosave = Scene_Map.prototype.shouldAutosave;
        Scene_Map.prototype.shouldAutosave = function() {
            return film.cinema ? false : _shouldAutosave.call(this);
        };
        // a new game / a loaded save: nothing of a scene is left over
        for (const ev of ["newGame", "load"]) T.on(ev, () => { film.end(); film.pending = null; }, { owner: PLUGIN });
        // F9's jump to an ending: on the chamber's map the scene starts by itself
        T.on("mapReady", e => {
            if (!film.pending || !D() || e.mapId !== D().MAPS.heart) return;
            const p = film.pending;
            film.pending = null;
            const w = world(), h = heartEvent();
            const list = (w.lord.stance !== "absent" && !state().lord ? lordList(w.lord.stance, w) : []).concat(F.call("place", []),
                C.script("Underground.ending(" + JSON.stringify(p.kind) + ", " + JSON.stringify(p.who) + ", this)"));
            $gameMap._interpreter.setup(list.concat([{ code: 0, indent: 0, parameters: [] }]), h ? h.eventId() : 0);
        }, { owner: PLUGIN });
    }
    Object.assign(film, {
        fades: [], shots: [], asker: null,
        // the hero before the Heart, facing it (a scene starts from there)
        place() {
            if (!window.$gameMap || $gameMap.mapId() !== D().MAPS.heart) return false;
            const [x, y, dir] = H().SPOTS.hero;
            $gamePlayer.locate(x, y);
            $gamePlayer.setDirection(dir);
            return true;
        },
        start() { film.cinema = true; return true; },
        end() {
            film.cinema = false;
            film.next = null;
            hfx.mode = null;
            if (window.$gameScreen) $gameScreen.startTint([0, 0, 0, 0], 1);
            return true;
        },
        walk(interp, id, x, y, dir) {
            const ch = charOf(id);
            if (!ch) return false;
            const list = pathTo(ch.x, ch.y, x, y).map(d => ({ code: MOVE[d], indent: null }));
            if (id < 0) { list.unshift({ code: 37, indent: null }); list.push({ code: 38, indent: null }); }   // (the hero through the cast)
            if (dir && TURN[dir]) list.push({ code: TURN[dir], indent: null });
            list.push({ code: 0 });
            ch.forceMoveRoute({ list, repeat: false, skippable: true, wait: false });
            if (interp && interp.setWaitMode) { interp._characterId = id; interp.setWaitMode("route"); }
            return true;
        },
        appear(interp, id, sheet, x, y, dir, name) {
            const ev = charOf(id);
            if (!ev) return false;
            if (name && ev.event()) ev.event().name = name;   // (the asker: the plate in the talk shows who came)
            ev.locate(x, y);
            if (sheet) ev.setImage(sheet, 0);
            ev.setDirection(dir || 2);
            ev.setThrough(true);
            ev.setOpacity(0);
            film.fades.push({ id, step: 17 });
            AudioManager.playSe({ name: "Move1", volume: 45, pitch: 80, pan: 0 });
            return true;
        },
        leave(interp, id) {
            const ev = charOf(id);
            if (!ev || !ev.characterName()) return false;
            const [x, y] = H().SPOTS.door, onHeart = $gameMap.mapId() === D().MAPS.heart;
            const list = (onHeart ? pathTo(ev.x, ev.y, x, y) : []).map(d => ({ code: MOVE[d], indent: null }));
            list.push({ code: 0 });
            ev.forceMoveRoute({ list, repeat: false, skippable: true, wait: false });
            if (interp && interp.setWaitMode) { interp._characterId = id; interp.setWaitMode("route"); }
            film.fades = film.fades.filter(f => f.id !== id);
            film.fades.push({ id, step: -12, wait: true });   // (the fade-out waits till the walk is over)
            return true;
        },
        face(interp, id, dir) { const ch = charOf(id); if (ch) ch.setDirection(dir); return !!ch; },
        balloon(interp, id, n) { const ch = charOf(id); if (ch) $gameTemp.requestBalloon(ch, n); return !!ch; },
        notice(interp, text) { T.popup(text, { top: true }); return true; },
        caption(interp, text, frames) { film.cap = { text: String(text), t: 0, life: W(frames || 46) }; return true; },
        fx(interp, mode) { return heartFx(mode); },
        // voices from the dark around the Heart (the Truth Layer's whispers), over the Heart or the hero
        barks(interp, n) {
            const d = D(), r = rng(hash(seedOf(), "heartBarks", Graphics.frameCount)), who = heartEvent() || $gamePlayer;
            for (let i = 0; i < (n || 3); i++) {
                const line = r.pick(d.WHISPERS);
                setTimeout(() => T.call("SpeechBubbles", "say", i % 2 ? $gamePlayer : who, line, 70), Math.round(i * 450 * film.speed));
            }
            AudioManager.playSe({ name: "Darkness3", volume: 30, pitch: 140, pan: 0 });
            return true;
        },
        // "for one moment you know everything": the truths of the Truth Layer, one after another, over the hero
        montage() {
            const d = D(), lines = Object.keys(d.NOTES).filter(k => d.NOTES[k].who && d.NOTES[k].who !== "hero").map(k => d.NOTES[k].text.split("\n")[0]);
            const r = rng(hash(seedOf(), "montage"));
            for (let i = 0; i < 7 && lines.length; i++) {
                const l = lines.splice(Math.floor(r() * lines.length), 1)[0];
                setTimeout(() => T.call("SpeechBubbles", "say", $gamePlayer, l, 40), Math.round(i * 360 * film.speed));
            }
            return true;
        },
        // the next morning (the hero climbed a hundred floors and slept): 11:00 - after the market's first hours
        morning() {
            if ($gameSystem.sleepUntilHour) $gameSystem.sleepUntilHour(11);
            else if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(11);
            return true;
        },
        lord(interp, stance, choice, told) {
            const s = state();
            s.lord = { stance, choice, told: told || null, day: T.time.day() };
            T.emit("undergroundLord", Object.assign({}, s.lord));
            return true;
        },
        // a scene up above: its cast goes onto that map as it loads
        prepare(interp, key, map, actors) {
            film.next = { key, map, actors: actors || [] };
            if (map === $gameMap.mapId()) $gamePlayer.requestMapReload();   // (the same map again: its data and events made anew)
            return true;
        },
        // ...arrived: the interpreter belongs to this map now (commands about events work), who lives here steps aside for the scene,
        // the hero is the camera (unseen) - or stands in the scene
        arrive(interp, key, hero) {
            const id = $gameMap.mapId();
            if (interp) interp._mapId = id;
            if ($gameMap._interpreter) $gameMap._interpreter._mapId = id;
            const mine = new Set((film.next ? film.next.actors : []).map(a => a.id));
            for (const ev of $gameMap.events()) {
                const n = ev.eventId();
                if (mine.has(n)) continue;
                if ((id === 1 && n >= 1 && n <= 4) || (n >= 900 && n <= 949) || (n >= 951 && n <= 959) || (n >= 2900 && n <= 2959)) ev.erase();   // (2900-2959: the new terrain's residents, the new town's, the new Podgrodzie's)
            }
            $gamePlayer.setTransparent(!hero);
            if (hero) { $gamePlayer.locate(hero[0], hero[1]); $gamePlayer.setDirection(hero[2] || 8); }
            $gamePlayer.refresh && $gamePlayer.refresh();
            film.at = key;
            return true;
        },
        heroIn(interp, x, y, dir) {
            $gamePlayer.setTransparent(false);
            $gamePlayer.locate(x, y);
            $gamePlayer.setDirection(dir || 8);
            AudioManager.playSe({ name: "Move1", volume: 50, pitch: 90, pan: 0 });
            return true;
        },
        // tests: how fast the scenes' waits go (1 = as written)
        setSpeed(v) { film.speed = Math.max(0.05, Number(v) || 1); return film.speed; }
    });

    // ---- F9: jump to an ending with a world chosen (Debug.js's menu: the row "Serce: zakończenie" of the thread "podziemia" below)
    function debugEnding(kind, who, worldKey, lordKey) {
        const d = D(), s = state(), dbg = H().DEBUG;
        if (!d.ENDINGS[kind]) return false;
        const wk = dbg.worlds.find(x => x.key === (worldKey || "")) || dbg.worlds[0];
        s.ending = null;
        s.lord = null;
        s.forceWorld = wk.world ? JSON.parse(JSON.stringify(wk.world)) : null;
        s.forceLord = lordKey || null;
        s.forceLocks.all = true;
        const n = wk.world && wk.world.locks ? wk.world.locks : 3;
        s.locks = {};
        for (const k of d.LOCKS.order.slice(0, Math.max(d.LOCKS.need, n))) s.locks[k] = true;
        film.end();
        film.pending = { kind, who: who || "hero" };
        const [x, y, dir] = H().SPOTS.hero;
        $gamePlayer.setTransparent(false);
        return travel([d.MAPS.heart, x, y, dir]);
    }
    // ---- F9 (Debug.js's first tab "Zdarzenia"): the rows are the data's - the thread "podziemia" (Underground_Data.js, the words
    // js/teksty/podziemia.txt); here their hooks: the words' {x} (f9Zmienne), ←→ (f9Wybierz: the row's floor; the ending, the world, the
    // Lord - kept between the menu's openings), OK (f9Ok: { back } - to the map; {} - the menu stays, the row read again)
    const f9Pick = { koniec: 0, swiat: 0, lord: 0 };
    const f9List = co => { const g = H().DEBUG; return co === "koniec" ? g.endings : co === "swiat" ? g.worlds : g.lords; };
    function f9Hooks() {
        const w = inGame && window.Watki && Watki.get ? Watki.get("podziemia") : null;
        if (!w || w.hooks.f9Ok) return;
        const t = key => w.tekst(key);
        w.haki({
            f9Zmienne(ctx) {
                const row = ctx.row || {}, g = H().DEBUG;
                if (row.co === "pietro") { const hm = D().FLOORS[row.floor]; return { f: row.floor, nazwa: row.floor === 0 ? t("f9.ruiny") : hm ? Watki.wstaw(t("f9.pietroNazwa"), { nazwa: hm.name }) : "" }; }
                if (row.co === "krata") return { stan: t(sw("gate") ? "f9.krataOtwarta" : "f9.krataZamknieta") };
                if (row.co === "zamki") return { stan: t(state().forceLocks.all ? "f9.zamkiWlaczone" : "f9.zamkiWylaczone") };
                if (row.co === "winda") return { juz: liftStops().length >= D().LIFT.stops.length ? t("f9.windaJuz") : "" };
                if (row.co === "koniec") { const [k, who] = g.endings[f9Pick.koniec]; return { "1": g.endingName(k, who) }; }
                if (row.co === "swiat" || row.co === "lord") return { name: f9List(row.co)[f9Pick[row.co]].name };
                return {};
            },
            f9Wybierz(ctx, delta) {
                const row = ctx.row;
                if (row.co === "pietro") { row.floor = (row.floor + delta * (Input.isPressed("shift") ? 10 : 1) + 101 * 10) % 101; return true; }
                if (f9Pick[row.co] === undefined) return false;
                const n = f9List(row.co).length;
                f9Pick[row.co] = (f9Pick[row.co] + delta + n * 10) % n;
                return true;
            },
            f9Ok(ctx) {
                const row = ctx.row;
                if (row.co === "pietro") { go(row.floor); return { back: true }; }
                if (row.co === "krata") { sw("gate", !sw("gate")); return {}; }
                if (row.co === "zamki") { forceLock("all", !state().forceLocks.all); return {}; }
                if (row.co === "winda") { for (const f of D().LIFT.stops) state().lifts[f] = true; sw("lift", true); return {}; }
                if (row.co === "koniec") {
                    const g = H().DEBUG, [k, who] = g.endings[f9Pick.koniec];
                    debugEnding(k, who, g.worlds[f9Pick.swiat].key, g.lords[f9Pick.lord].key);
                    return { back: true };
                }
                if (row.co === "swiat" || row.co === "lord") { f9Pick[row.co] = (f9Pick[row.co] + 1) % f9List(row.co).length; return {}; }
                return null;
            }
        });
    }
    f9Hooks();
    if (inGame) {   // (the data loaded after this file - Underground.js's own loadScript below: the hooks once the game boots)
        const _Scene_Boot_start = Scene_Boot.prototype.start;
        Scene_Boot.prototype.start = function() {
            _Scene_Boot_start.apply(this, arguments);
            f9Hooks();
        };
    }

    // ---- the debug / test helpers
    function verify(floor) {
        const got = floorData(floor);
        if (!got) return { ok: false, why: TK.kod.verify[0] };
        return verifyMap(got.map, got.info, flags(bandOf(floor)));
    }
    function setSeed(n) {
        state().seed = (Number(n) >>> 0) || 1;
        state().seen = {};   // (other floors now: nothing of them seen)
        fogForget();
        cache.clear();
        return state().seed;
    }

    if (inGame) {
        PluginManager.registerCommand(PLUGIN, "open", () => sw("gate", true));
        PluginManager.registerCommand(PLUGIN, "close", () => sw("gate", false));
        PluginManager.registerCommand(PLUGIN, "go", args => go(Number(args.floor)));
        PluginManager.registerCommand(PLUGIN, "shortcut", () => sw("song", true));
    }

    const api = {
        GEN_VERSION, hash, rng, floorShape, wallShape, parseLibrary, librarySig, planMaze, planFloor: planMaze, mazeOf, generate, verifyMap, reachable,
        checkChunk, tagsOf, roomsOf, floorOf, mapOf, bandOf, handmadeOf, isGenerated, isVirtual, isUnderground, library, floorData, flags,
        info: infoOf, spawns: mapId => { const i = infoOf(mapId); return i ? i.spawns : spawnsOfMap(); },
        registerCreature(kind, build) { creatures[String(kind)] = build; cache.clear(); return true; },
        hasCreature: kind => !!creatures[kind],
        isOpen: () => sw("gate"), open: () => sw("gate", true), close: () => sw("gate", false),
        lift: v => sw("lift", v), shortcut: v => sw("song", v), gate10: v => sw("gate10", v),
        liftOn, liftMenu, liftStops, windlass, cage,
        deepest: () => state().deepest || 0, seed: seedOf, setSeed, state, stairs, search, read, say, hurt, go, landing, verify,
        guardianHandled, guardianPose, guardianStrike, wake, gate10Opened, onGuardian: fn => { guardianHook = fn; return true; },
        bossCleared, bossDefeated, bosses: () => Object.assign({}, state().bosses),
        locks, lockKnown, lock, openLock, forceLock, door, doorOpen, syncDoor, heart, ending, afterEnding, epilogueLines,
        world, lordStance, film, heartFx, debugEnding, shotsOf: (kind, who) => shotsOf(world(), { kind, guardian: kind === "straznik" ? (who || "hero") : null }),
        filmLog: () => film.log.slice(), forceWorld: w => { state().forceWorld = w ? JSON.parse(JSON.stringify(w)) : null; return state().forceWorld; },
        forceLord: v => { state().forceLord = v || null; return state().forceLord; },
        truths: () => Object.assign({}, state().truths), whisper, startMoment, showVision: (id, i) => { const ev = $gameMap.event(id); return ev ? showVision(ev, i !== undefined ? D().APPARITIONS[i] : null) : null; },
        waterAt, clearCache: () => cache.clear(),
        fog: fogFor, reveal: (x, y, sight) => reveal(x, y, sight), seenCount: () => { let n = 0; if (fog.bits) for (const b of fog.bits) for (let k = b; k; k &= k - 1) n++; return n; },
        fogSave
    };
    window.Underground = T.register(PLUGIN, api);

    // the data part, when it is not on the plugin list (it must be listed right above this file - see docs/PODZIEMIA.md)
    if (inGame && !D() && PluginManager.loadScript) PluginManager.loadScript("Underground_Data");
})();
