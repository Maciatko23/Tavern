# -*- coding: utf-8 -*-
"""Nowy świat w układzie świata (2026-11-13, gracz: „są przejścia pomiędzy Wybrzeżem i Podgrodziem?”): 5 map w jednej linii, z dala od
starej planszy 3x3 (y0 = 1000 kratek świata), przejścia krawędzią tam, gdzie po obu stronach szwu da się przejść (jak tools/plansza/swiat.py).
Pisze js/plugins/Swiat_Data_Nowy.js (dopisuje mapy i przejścia do window.SwiatData z Swiat_Data.js - tamten plik zostaje bez zmian).
Uruchomić znowu po każdej zmianie map 218-222 w edytorze (przejścia liczą się z kafli i zdarzeń przy krawędziach):
  python tools/nowy_swiat/swiat.py"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "js", "plugins", "Swiat_Data_Nowy.js")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

LINE = [219, 218, 220, 221, 222]          # west to east: Wybrzeże, Podgrodzie, Miasteczko, Posiadłość, Góry
Y0 = 1000                                  # (the old board lies in 0..360: no overlap)
TS = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))
maps = {m: json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % m), encoding="utf-8")) for m in LINE}


def passable(m, x, y, blockers):   # (as tools/plansza/swiat.py)
    if (x, y) in blockers: return False
    W, H = m["width"], m["height"]
    t, n = m["data"], W * H
    fl = TS[m["tilesetId"]]["flags"]
    i = y * W + x
    if 2048 <= t[i] < 2816: return False                       # (water)
    if t[5 * n + i] == 2: return False                          # (region 2)
    for z in (3, 2, 1, 0):
        v = t[z * n + i]
        if not v: continue
        f = fl[v] if v < len(fl) else 0
        if f & 0x10: continue
        if (f & 0x0f) == 0x0f: return False
        if (f & 0x0f) == 0: return True
    return True


def blockers_of(m):
    return {(e["x"], e["y"]) for e in m["events"] if e and e["pages"][0].get("priorityType", 0) == 1 and not e["pages"][0].get("through")}


pos, x0 = {}, 0
for m in LINE:
    pos[m] = [x0, Y0, maps[m]["width"], maps[m]["height"]]
    x0 += maps[m]["width"]
blk = {m: blockers_of(maps[m]) for m in LINE}
links = []
for a, b in zip(LINE, LINE[1:]):
    A, B = maps[a], maps[b]
    run = []
    def flush():
        if run and run[-1] - run[0] >= 1:   # (a single cell is no way through)
            links.append({"a": a, "side": "E", "from": run[0], "to": run[-1], "b": b})
            links.append({"a": b, "side": "W", "from": run[0], "to": run[-1], "b": a})
        run.clear()
    for k in range(min(A["height"], B["height"])):
        if passable(A, A["width"] - 1, k, blk[a]) and passable(B, 0, k, blk[b]): run.append(Y0 + k)
        else: flush()
    flush()
for l in links:
    if l["side"] == "E": print("  %d -> %d: wiersze %d-%d" % (l["a"], l["b"], l["from"] - Y0, l["to"] - Y0))

js = """//=============================================================================
// Swiat_Data_Nowy.js  (GENEROWANE: tools/nowy_swiat/swiat.py; nie edytuj ręcznie)
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Nowy świat w układzie świata: 5 map w jednej linii (Wybrzeże, Podgrodzie, Miasteczko, Posiadłość, Góry) i przejścia krawędzią między nimi. v1.0.0
 * @author Claude
 * @base Swiat_Data
 * @orderAfter Swiat_Data
 *
 * @help
 * Tylko dane: dopisuje mapy i przejścia do window.SwiatData (Swiat_Data.js zostaje bez zmian). Po zmianach map 218-222 w edytorze:
 * python tools/nowy_swiat/swiat.py
 */
(() => {
    "use strict";
    const S = window.SwiatData;
    if (!S) return;
    Object.assign(S.maps, %s);
    S.links = S.links.concat(%s);
})();
""" % (json.dumps({str(m): pos[m] for m in LINE}), json.dumps(links))
open(OUT, "wb").write(js.encode("utf-8"))
print("->", os.path.relpath(OUT, ROOT), "(%d przejść)" % (len(links) // 2))
