# -*- coding: utf-8 -*-
"""Refaktor 2026-11-07 (gracz: „z czym można zrobić refaktor?”, „lecę po kolei, ma być dobrze i ładnie”), krok 3: zajęte kratki zdarzeń
liczone jednym kodem - Tawerna.eventCells() w TawernaCore.js - zamiast trzech kopii (GroundDetail, Puddles, Farming_Plots).
Kopie do tools/porzadki/staging/js/plugins (próby: GAME_OVERLAY=tools/porzadki/staging GAME_OVERLAY_JS=1).
  python tools/porzadki/zajete_kratki.py"""
import os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
D = os.path.join(HERE, "staging", "js", "plugins")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
os.makedirs(D, exist_ok=True)

RING = """        for (const e of $gameMap.events()) {
            // ring by ring round the event (a footprint is one rectangle with the event in it: the first empty ring ends it)
            for (let r = 0; r <= 12; r++) {
                let hit = false;
                for (let y = e.y - r; y <= e.y + r; y++) for (let x = e.x - r; x <= e.x + r; x++) {
                    if ((Math.abs(x - e.x) !== r && Math.abs(y - e.y) !== r) || x < 0 || y < 0 || x >= W || y >= H) continue;
                    if (e.pos(x, y)) { occ[y * W + x] = 1; hit = true; }
                }
                if (!hit && r > 0) break;
            }
        }"""
RING_BARE = "\n".join(l for l in RING.split("\n") if "ring by ring" not in l)   # (Farming_Plots's copy had no comment line)
OLD_FN ="""    // the cells the map's events stand on (a tree or a wide bush covers several - ChoppableTree.js's pos), asked once for all the cells
    // (2026-11-03: eventsXy for every cell of the map went through all its events each time - ~260 ms of a change of map at CPU 4x)
    function eventCells() {
        const W = $gameMap.width(), H = $gameMap.height(), occ = new Uint8Array(W * H);
""" + RING + """
        return { has: (x, y) => x >= 0 && y >= 0 && x < W && y < H && occ[y * W + x] === 1 };
    }"""


def edit(name, pairs):
    src = os.path.join(ROOT, "js", "plugins", name)
    raw = open(src, "rb").read()
    crlf = b"\r\n" in raw
    s = raw.decode("utf-8").replace("\r\n", "\n")
    for a, b in pairs:
        if s.count(a) != 1:
            raise SystemExit("nie pasuje w " + name + ": " + a[:90])
        s = s.replace(a, b)
    open(os.path.join(D, name), "wb").write((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))


edit("TawernaCore.js", [(
"""        if (wins === "off") return off ? false : on ? true : dflt;
        return on ? true : off ? false : dflt;
    };""",
"""        if (wins === "off") return off ? false : on ? true : dflt;
        return on ? true : off ? false : dflt;
    };
    // the cells the map's events stand on now, worked out once for a batch of cells: { has(x, y) } (a tree or a wide bush covers
    // several - ChoppableTree.js's pos). eventsXy walks all the map's events for every cell asked (~260 ms of a change of map at CPU
    // 4x when GroundDetail, Puddles and Farming each asked it per cell, 2026-11-03/06). The answer is for that moment: ask again for
    // the next batch. (2026-11-07: one copy here instead of three)
    T.eventCells = function() {
        const W = $gameMap.width(), H = $gameMap.height(), occ = new Uint8Array(W * H);
""" + RING + """
        return { has: (x, y) => x >= 0 && y >= 0 && x < W && y < H && occ[y * W + x] === 1 };
    };""")])

edit("GroundDetail.js", [(OLD_FN,
"""    // the cells the map's events stand on, asked once for all the cells (Tawerna.eventCells, TawernaCore.js)
    const eventCells = () => T.eventCells();""")])

edit("Puddles.js", [(OLD_FN,
"""    // the cells the map's events stand on, asked once for all the cells (Tawerna.eventCells, TawernaCore.js)
    const eventCells = () => Tawerna.eventCells();""")])

edit("Farming_Plots.js", [(
"""    let evBatch = null;
    function eventCellsNow() {
        const W = $gameMap.width(), H = $gameMap.height(), occ = new Uint8Array(W * H);
""" + RING_BARE + """
        return { W, H, occ };
    }
    function withEventCells(fn) {
        if (evBatch) return fn();
        evBatch = eventCellsNow();
        try { return fn(); } finally { evBatch = null; }
    }
    const eventOn = (x, y) => (evBatch ? x >= 0 && y >= 0 && x < evBatch.W && y < evBatch.H && evBatch.occ[y * evBatch.W + x] === 1 : $gameMap.eventsXy(x, y).length > 0);""",
"""    let evBatch = null;
    function withEventCells(fn) {
        if (evBatch) return fn();
        evBatch = T.eventCells();   // (TawernaCore.js: the ring walk of the events' footprints)
        try { return fn(); } finally { evBatch = null; }
    }
    const eventOn = (x, y) => (evBatch ? evBatch.has(x, y) : $gameMap.eventsXy(x, y).length > 0);""")])
print("kopie w", D)
