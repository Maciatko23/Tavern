# -*- coding: utf-8 -*-
"""Refaktor 2026-11-07, krok wydajności (gracz: „pamiętaj, chodzi priorytetowo o wydajność zawsze”): zbędna praca w każdej klatce,
te same wyniki:
  - Wydajnosc.js opts.startSet: Game_Map.isAnyEventStarting ze zbioru startujących zdarzeń (start / clearStartingFlag), nie przez
    przeglądanie wszystkich zdarzeń mapy przy każdym isEventRunning (pytają o to dziesiątki miejsc na klatkę)
  - Equipment.js ensure: przegląd rzeczy do noszenia tylko po zmianie plecaka (gainItem / loseItem) albo stanu (nowa gra, wczytanie)
  - ChoppableTree_Objects.js isCharred: klucz przełącznika „D” jako gotowy tekst, bez składania tablicy w tekst dwa razy na drzewo na klatkę
Kopie do tools/porzadki/staging/js/plugins.
  python tools/porzadki/wydajnosc_1107.py"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
D = os.path.join(HERE, "staging", "js", "plugins")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
os.makedirs(D, exist_ok=True)


def edit(name, pairs):
    raw = open(os.path.join(ROOT, "js", "plugins", name), "rb").read()
    crlf = b"\r\n" in raw
    s = raw.decode("utf-8").replace("\r\n", "\n")
    for a, b in pairs:
        if s.count(a) != 1:
            raise SystemExit("nie pasuje w " + name + " (" + str(s.count(a)) + "x): " + a[:90])
        s = s.replace(a, b)
    open(os.path.join(D, name), "wb").write((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))


edit("Wydajnosc.js", [
("lightGpu: true, still: true, sameSheets: true, quickFade: true, transferSnap: true };",
 "lightGpu: true, still: true, sameSheets: true, quickFade: true, transferSnap: true, startSet: true };"),
("""    window.Wydajnosc = T.register(PLUGIN, {""",
"""    // ---- is an event starting? (2026-11-07) Game_Map.isEventRunning asks it, and dozens of places ask isEventRunning every frame
    // (Tawerna.isCalm, the plugins' own checks): the engine walked all the map's events each time. The ones starting now are kept in
    // a small set instead - an event is put in by start() (the engine's only place that sets _starting) and taken out by
    // clearStartingFlag(); one that left the map (a spawned animal removed, a map changed) drops out when asked. _starting is in the
    // save, so after a load the set is made again from the map's events, once. The same answer (opts.startSet false: the engine's walk).
    const starting = new Set();
    let startingMap = null;
    const syncStarting = map => { starting.clear(); startingMap = map; for (const e of map.events()) if (e._starting) starting.add(e); };
    const _eventStart = Game_Event.prototype.start, _clearStarting = Game_Event.prototype.clearStartingFlag;
    Game_Event.prototype.start = function() {
        _eventStart.apply(this, arguments);
        if (this._starting) starting.add(this);
    };
    Game_Event.prototype.clearStartingFlag = function() {
        _clearStarting.apply(this, arguments);
        starting.delete(this);
    };
    const _anyStarting = Game_Map.prototype.isAnyEventStarting;
    Game_Map.prototype.isAnyEventStarting = function() {
        if (!opts.startSet) return _anyStarting.call(this);
        if (startingMap !== this) syncStarting(this);
        for (const e of starting) {
            if (e._starting && this._events[e._eventId] === e) return true;
            starting.delete(e);
        }
        return false;
    };
    const _mapSetup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function() { _mapSetup.apply(this, arguments); syncStarting(this); };
    T.on("load", () => { if (window.$gameMap) syncStarting($gameMap); }, { owner: PLUGIN });

    window.Wydajnosc = T.register(PLUGIN, {"""),
])

edit("Equipment.js", [
("""    // ---- the bag and the parts kept in step: new things go on by themselves where the part is free, the gone ones come off
    function ensure() {
        if (!window.$gameSystem || !window.$gameParty || !window.$dataItems) return null;
        readNotes();
        const s = store();""",
"""    // ---- the bag and the parts kept in step: new things go on by themselves where the part is free, the gone ones come off
    // (2026-11-07, wydajność: asked many times a frame - the walking hero's picture, the HUD -, it walked every wearable thing each
    // time; the answer changes only when the bag does (gainItem: loseItem and consumeItem go through it) or the state is another one -
    // a new game, a load - so the walk is done only then)
    let bagRev = 0, ensuredRev = -1, ensuredStore = null, ensuredItems = null;
    const _gainItem = Game_Party.prototype.gainItem;
    // (counted after the change too: an answer worked out while the bag was changing - a wrapper asking in the middle - is not kept)
    Game_Party.prototype.gainItem = function() { bagRev++; try { return _gainItem.apply(this, arguments); } finally { bagRev++; } };
    function ensure() {
        if (!window.$gameSystem || !window.$gameParty || !window.$dataItems) return null;
        readNotes();
        const s = store();
        if (s === ensuredStore && ensuredRev === bagRev && ensuredItems === $gameParty._items) return s;
        ensuredStore = s; ensuredRev = bagRev; ensuredItems = $gameParty._items;"""),
])

edit("ChoppableTree_Objects.js", [
("""    const charredKeys = new WeakMap();
    const charredKey = event => { let k = charredKeys.get(event); if (k === undefined) charredKeys.set(event, (k = [event._mapId, event._eventId, "D"])); return k; };
    const isCharred = event => !!event && !!treeConfig(event) && $gameSelfSwitches.value(charredKey(event));""",
"""    // (2026-11-07: the key as the text the engine makes of it - Game_SelfSwitches keeps "map,event,D" - read straight, no array turned
    // into text twice a tree a frame; no plugin changes Game_SelfSwitches.value)
    const charredKeys = new WeakMap();
    const charredKey = event => { let k = charredKeys.get(event); if (k === undefined) charredKeys.set(event, (k = event._mapId + "," + event._eventId + ",D")); return k; };
    const isCharred = event => !!event && !!treeConfig(event) && !!$gameSelfSwitches._data[charredKey(event)];"""),
])
print("kopie w", D)
