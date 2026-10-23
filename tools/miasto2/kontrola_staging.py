# -*- coding: utf-8 -*-
"""Kontrola kopii roboczej nowego miasta (tools/miasto2/staging/Map008.json) narzędziem tools/mapy/kontrola.py.

Przeniesienia z innych map na mapę 8 (data/) wskazują jeszcze stare kratki - tu są przeliczone przez mapowanie bloków
(tools/miasto2/mapowanie.json), tak jak zrobi to koordynator. Obrazek: tools/miasto2/kontrola_Map008.png (nie docs/mapy).
Dodatkowo: szczelność murów (z placu nie da się wyjść poza mury inaczej niż bramami) i dojście do drzwi, bram, studni,
płyty i furtki ogrodu rycerzy.
Użycie: python tools/miasto2/kontrola_staging.py
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/mapy")
import mapylib as L
import kontrola as K

MAP = json.load(open(os.path.join(HERE, "mapowanie.json"), encoding="utf-8"))
BLOKI = MAP["a_bloki"]
RECZNE = {tuple(p["stare"]): tuple(p["nowe"]) for p in MAP["c_miejsca"]["punkty_wtyczek"] if p["co"].startswith("Map")}


def nowe(x, y):
    if (x, y) in RECZNE: return RECZNE[(x, y)]
    for bl in BLOKI:
        x0, y0, x1, y1 = bl["stary"]
        if bl["blok"] == "kwietnik": continue
        if x0 <= x <= x1 and y0 <= y <= y1:
            return (x + bl["dx"], y + bl["dy"])
    return (x, y)


_orig = L.przeniesienia_do_map


def przeliczone():
    d = dict(_orig())
    d[8] = [(nowe(x, y) + (src,)) for (x, y, src) in d.get(8, [])]
    return d


L.przeniesienia_do_map = przeliczone


def main():
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    r = K.kontroluj(8, dane=os.path.join(HERE, "staging"), out_dir=HERE)
    print("  obrazek:", r["png"])
    mp = L.Mapa(8, path=os.path.join(HERE, "staging", "Map008.json"))
    # szczelność: zamknij bramy i schody za bramą południową, zalej od studni
    zamkniete = {(0, 50), (0, 51), (1, 50), (1, 51), (102, 50), (103, 50), (102, 51), (103, 51)}
    zamkniete |= {(x, y) for x in (51, 52, 53) for y in (93, 94, 95, 96, 97, 98)}
    orig = mp.mozna_wejsc
    mp.mozna_wejsc = lambda x, y, d: orig(x, y, d) and (x + L.DIRS[d][0], y + L.DIRS[d][1]) not in zamkniete
    zalane = mp.flood([(50, 47)])
    wyciek = sorted(c for c in zalane if c[1] >= 99 or c[0] in (0, 103))
    print("  szczelność murów:", "OK (z placu tylko przez bramy)" if not wyciek else "WYCIEK: %s" % wyciek[:10])
    mp.mozna_wejsc = orig
    # dojście do rzeczy z akcją
    reach = mp.flood(mp.starty())
    bud = json.load(open(os.path.join(HERE, "budynki.json"), encoding="utf-8"))["budynki"]
    zle = []
    for x in bud:
        if tuple(x["przed_drzwiami"]) not in reach: zle.append("drzwi %s %s" % (x["klucz"], x["drzwi"]))
    ev = {e.id: e for e in mp.zd}
    for eid, co in ((241, "studnia"), (242, "studnia"), (245, "zejście do studni"), (39, "furtka ogrodu rycerzy"),
                    (221, "brama wschodnia"), (222, "brama wschodnia"), (237, "brama zachodnia"), (238, "brama zachodnia"),
                    (229, "drogowskaz"), (240, "drogowskaz")):
        e = ev[eid]
        if not any((e.x + dx, e.y + dy) in reach for (dx, dy) in ((0, 1), (0, -1), (1, 0), (-1, 0), (0, 0))):
            zle.append("%s (ev %d %d,%d)" % (co, eid, e.x, e.y))
    g = ev[246]
    ogrod = mp.flood([(g.x, g.y + 1)])
    if not ({(32, 14), (33, 14), (34, 14)} & ogrod):
        zle.append("płyta 246 nie łączy się z furtką ogrodu")
    for (x, y) in ((51, 101), (52, 101), (53, 101), (52, 104)):
        if (x, y) not in reach: zle.append("brama południowa / droga %d,%d" % (x, y))
    for (x, y) in ((25, 136), (24, 137)):
        if (x, y) not in reach: zle.append("wyjście na Polną drogę %d,%d" % (x, y))
    print("  dojście (drzwi, bramy, studnia, płyta, furtka):", "OK" if not zle else "PROBLEMY: " + "; ".join(zle))
    # grunt dla wtyczek: cmentarz (Zakon), pola (Zasoby), szubienica (Zakon) - wolne kratki bez zdarzeń, dojście
    st = MAP["d_strefy"]
    zd = {(e.x, e.y) for e in mp.zd if e.widoczne or e.blokuje}
    zle = []
    def wolny_prost(nazwa, x, y, w, h, wejscie):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if (xx, yy) in zd or not mp.stoi(xx, yy): zle.append("%s: kratka %d,%d zajęta" % (nazwa, xx, yy))
        if not any(c in reach for c in wejscie): zle.append("%s: brak dojścia (%s)" % (nazwa, wejscie))
    c = st["zakon_CEMETERY"]
    wolny_prost("cmentarz", c["x"], c["y"], c["w"], c["h"], [(gx, gy + 1) for gx, gy in c["gate"]])
    for k, f in st["zasoby_FIELDS"].items():
        wolny_prost(k, f["x"], f["y"], f["w"], f["h"], [(f["x"] + i, f["y"] + f["h"]) for i in range(f["w"])] +
                    [(f["x"] + i, f["y"] - 1) for i in range(f["w"])])
    g = st["szubienica"]
    wolny_prost("szubienica", g["x"], g["y"], g["w"], g["h"], [(g["x"] + 1, g["y"] + g["h"]), (g["x"] + 1, g["y"] - 1)])
    miejsca = [(e.name, e.x, e.y) for e in mp.zd if e.name.startswith("Miejsce:")]
    for (n, x, y) in miejsca:
        if (x, y) not in reach: zle.append("%s (%d,%d) nieosiągalne" % (n, x, y))
    print("  grunt dla wtyczek i %d miejsc TownLife:" % len(miejsca), "OK" if not zle else "PROBLEMY: " + "; ".join(zle[:12]))


if __name__ == "__main__":
    main()
