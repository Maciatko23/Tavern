# -*- coding: utf-8 -*-
"""Krok 4 planszy: świat = 9 map planszy (po drogi.py). Pisze do kopii próbnej:
  - staging/swiat_uklad.json - układ (ten sam format co docs/mapy/swiat_uklad.json: mapy -> x0, y0, szer, wys);
  - staging/js/plugins/Swiat_Data.js - położenia map i przejścia (links: odcinki granicy, gdzie da się przejść po obu stronach -
    kratka graniczna mapy a i pierwsza kratka mapy b przechodnie; tak samo jak tools/mapy/swiat_do_gry.py, tylko z planszy).
Mapy spoza planszy (odstawione) nie są w świecie: nikt do nich nie przejdzie krawędzią.
  python tools/plansza/swiat.py"""
import json, os
from plansza import ROOT, N, BOARD, STG, NAMES
OUT = os.path.join(STG, "data")
TS = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))
maps = {m: json.load(open(os.path.join(OUT, "Map%03d.json" % m), encoding="utf-8")) for m in BOARD}
uk = {"opis": "Plansza 3x3 (tools/plansza/swiat.py, 2026-11-08): 9 map po %d x %d kratek." % (N, N),
      "mapy": {str(m): {"x0": c * N, "y0": r * N, "szer": N, "wys": N, "nazwa": NAMES[m]} for m, (c, r, dx, dy) in BOARD.items()}}
json.dump(uk, open(os.path.join(STG, "swiat_uklad.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def passable(m, x, y, blockers):
    if (x, y) in blockers: return False
    t, n = m["data"], N * N
    fl = TS[m["tilesetId"]]["flags"]
    i = y * N + x
    if 2048 <= t[i] < 2816: return False                       # (water)
    if t[5 * n + i] == 2: return False                          # (region 2: the game's "no way here")
    for z in (3, 2, 1, 0):
        v = t[z * n + i]
        if not v: continue
        f = fl[v] if v < len(fl) else 0
        if f & 0x10: continue                                    # (a star tile: over the character)
        if (f & 0x0f) == 0x0f: return False
        if (f & 0x0f) == 0: return True
    return True


def blockers_of(m):
    out = set()
    for e in m["events"]:
        if e and e["pages"][0].get("priorityType", 0) == 1 and not e["pages"][0].get("through"): out.add((e["x"], e["y"]))
    return out


blk = {m: blockers_of(maps[m]) for m in BOARD}
links = []
for a, (ca, ra, _, _) in BOARD.items():
    for b, (cb, rb, _, _) in BOARD.items():
        if (cb, rb) == (ca + 1, ra): side, ob, sb = "E", "W", None
        elif (cb, rb) == (ca, ra + 1): side, ob, sb = "S", "N", None
        else: continue
        run = []
        def flush():
            if run:
                lo, hi = run[0], run[-1]
                links.append({"a": a, "side": side, "from": lo, "to": hi, "b": b})
                links.append({"a": b, "side": ob, "from": lo, "to": hi, "b": a})
                run.clear()
        for k in range(N):
            if side == "E": okA, okB, w = passable(maps[a], N - 1, k, blk[a]), passable(maps[b], 0, k, blk[b]), ra * N + k
            else: okA, okB, w = passable(maps[a], k, N - 1, blk[a]), passable(maps[b], k, 0, blk[b]), ca * N + k
            if okA and okB: run.append(w)
            else: flush()
        flush()
links = [l for l in links if l["to"] - l["from"] >= 1]   # (a single cell is no way through)
mp = ", ".join('"%d": [%d, %d, %d, %d]' % (m, c * N, r * N, N, N) for m, (c, r, dx, dy) in BOARD.items())
js = """//=============================================================================
// Swiat_Data.js  (GENEROWANE: tools/plansza/swiat.py - plansza 3x3; nie edytuj ręcznie)
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Świat w kratkach: położenia map (x0, y0, szer., wys.) i przejścia danych; czyta je Krawedzie.js. Plansza 3x3. v2.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * Tylko dane (window.SwiatData). Kratka świata = początek mapy + kratka lokalna. links: otwarte przejścia {a, side, from, to, b} -
 * kratki ŚWIATA wzdłuż krawędzi mapy a (x dla N/S, y dla E/W).
 */
(() => {
    "use strict";
    window.SwiatData = {
        enabled: true,
        // (2026-11-11 questy_mapa) maps that are not on the board but are part of the world: the three pockets (Osada Milczących, Pustelnia + Urwisko,
        // Spalona zagroda: each through one gate of a board map) and the mine with Orla Grań - no seams, no world position; the F9 pickers read it
        extra: [120, 121, 122, 123, 124, 155, 156, 157, 168, 169, 175, 213],
        // id mapy: [x0, y0, szerokość, wysokość] w kratkach świata
        maps: {%s},
        links: [
%s
        ]
    };
    // (plansza 3x3, 2026-11-08) a save made before the board: on a map whose content moved (tools/plansza/plansza.py BOARD dx, dy) the
    // hero is put on the same spot of the new map and the map is read again (its events from the file, as when the editor changed it)
    const T = window.Tawerna;
    const SHIFT = %s;
    if (T && T.state && T.on) {
        const st = () => T.state("plansza", { v: 0 }, { owner: "Swiat_Data" });
        T.on("newGame", () => { st().v = 1; });
        T.on("load", () => {
            const s = st();
            if (s.v >= 1) return;
            s.v = 1;
            const id = $gameMap.mapId(), d = SHIFT[id];
            if (!d) return;
            const nx = $gamePlayer.x + d[0], ny = $gamePlayer.y + d[1];
            $gamePlayer.locate(nx, ny);   // (Scene_Load's own reload after an editor save reads the hero's x, y: already the new ones)
            $gamePlayer.reserveTransfer(id, nx, ny, $gamePlayer.direction(), 0);
        });
    }
})();
""" % (mp, ",\n".join("            " + json.dumps(l, ensure_ascii=False) for l in links), json.dumps({str(m): [dx, dy] for m, (c, r, dx, dy) in BOARD.items() if dx or dy}))
os.makedirs(os.path.join(STG, "js", "plugins"), exist_ok=True)
open(os.path.join(STG, "js", "plugins", "Swiat_Data.js"), "wb").write(js.encode("utf-8"))
from collections import Counter
c = Counter((l["a"], l["b"]) for l in links)
print("przejść: %d odcinków; pary: %s" % (len(links), ", ".join("%d-%d:%d" % (a, b, n) for (a, b), n in sorted(c.items()) if a < b)))
