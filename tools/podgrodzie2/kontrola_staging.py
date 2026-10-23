# -*- coding: utf-8 -*-
"""Kontrola kopii roboczej nowego Podgrodzia (tools/podgrodzie2/staging/Map111.json) narzędziem tools/mapy/kontrola.py.

Przeniesienia z innych map na mapę 111 (data/) wskazują jeszcze stare kratki - tu są przeliczone przez mapowanie
(tools/podgrodzie2/mapowanie.json: punkty „Map...” i bloki), tak jak zrobi to koordynator. Obrazek:
tools/podgrodzie2/kontrola_Map111.png (nie docs/mapy). Dodatkowo:
  - szczelność palisady (z placyku nie da się wyjść poza palisadę inaczej niż bramami) i muru miasta (z pasa pod murem
    nie przejdzie się na wschód inaczej niż bramą),
  - dojście do wszystkich drzwi (budynki.json), bram (palisada: zachodnia, wschodnia, południowa; brama miasta; wyjście
    do Przystani), studni, napisów, wszystkich „Miejsce:”, działki gracza (region 8), ogródków / wysypiska / glinianki
    (Zasoby), punktów wtyczek,
  - przejścia przy drzwiach: kratka przed drzwiami i co najmniej jedna z kratek obok niej wolne (2 kratki szerokości).
Użycie: python tools/podgrodzie2/kontrola_staging.py
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
        for (x0, y0, x1, y1) in bl["prostokaty"]:
            if x0 <= x <= x1 and y0 <= y <= y1:
                return (x + bl["dx"], y + bl["dy"])
    return (x, y)


_orig = L.przeniesienia_do_map


def przeliczone():
    d = dict(_orig())
    d[111] = [(nowe(x, y) + (src,)) for (x, y, src) in d.get(111, [])]
    return d


L.przeniesienia_do_map = przeliczone


def main():
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    r = K.kontroluj(111, dane=os.path.join(HERE, "staging"), out_dir=HERE)
    print("  obrazek:", r["png"])
    bledy = [p for p in r["problemy"] if p["waga"] == "błąd" and not p.get("ukryj")]
    mp = L.Mapa(111, path=os.path.join(HERE, "staging", "Map111.json"))
    st = MAP["d_strefy"]
    wynik = {"bledy_kontroli": len(bledy)}
    # ---- szczelność palisady: bramy zamknięte, zalewanie od placyku
    x0, y0, x1, y1 = st["palisada"]["pierscien"]
    bramy = {tuple(c) for v in st["palisada"]["bramy"].values() for c in v}
    orig = mp.mozna_wejsc
    mp.mozna_wejsc = lambda x, y, d: orig(x, y, d) and (x + L.DIRS[d][0], y + L.DIRS[d][1]) not in bramy
    zalane = mp.flood([(43, 36)])
    wyciek = sorted(c for c in zalane if not (x0 < c[0] < x1 and y0 < c[1] < y1))
    print("  szczelność palisady:", "OK (z osady tylko przez 3 bramy)" if not wyciek else "WYCIEK: %s" % wyciek[:10])
    # ---- szczelność muru miasta: brama miasta zamknięta, zalewanie od pasa pod murem
    brama_m = {tuple(c) for c in st["mur_miasta"]["brama"]}
    mp.mozna_wejsc = lambda x, y, d: orig(x, y, d) and (x + L.DIRS[d][0], y + L.DIRS[d][1]) not in brama_m
    zalane = mp.flood([(87, 30), (87, 5), (88, 60)])
    wyciek_m = sorted(c for c in zalane if c[0] >= 90 and c[1] <= st["mur_miasta"]["rzedy"][1])
    print("  szczelność muru miasta:", "OK (na wschód tylko bramą)" if not wyciek_m else "WYCIEK: %s" % wyciek_m[:10])
    mp.mozna_wejsc = orig
    wynik["wyciek"] = len(wyciek) + len(wyciek_m)
    # ---- dojście
    reach = mp.flood(mp.starty())
    bud = json.load(open(os.path.join(HERE, "budynki.json"), encoding="utf-8"))["budynki"]
    zle = []
    waskie = []
    for x in bud:
        fx, fy = x["przed_drzwiami"]
        if (fx, fy) not in reach: zle.append("drzwi %s %s" % (x["klucz"], x["drzwi"]))
        elif not ((fx - 1, fy) in reach or (fx + 1, fy) in reach) or (fx, fy + 1) not in reach:
            waskie.append("%s %s" % (x["klucz"], [fx, fy]))
    ev = {e.id: e for e in mp.zd}
    akcje = [(27, "sucha studnia"), (67, "drogowskaz"), (68, "obwieszczenie"), (69, "kapliczka"), (65, "brama miasta"),
             (66, "brama miasta"), (92, "wyjście do Przystani")]
    for eid, co in akcje:
        e = ev[eid]
        if not any((e.x + dx, e.y + dy) in reach for (dx, dy) in ((0, 1), (0, -1), (1, 0), (-1, 0), (0, 0))):
            zle.append("%s (ev %d %d,%d)" % (co, eid, e.x, e.y))
    for k, cells in st["palisada"]["bramy"].items():
        if not all(tuple(c) in reach for c in cells): zle.append("brama palisady %s %s" % (k, cells))
    # działka gracza (region 8): wszystkie kratki osiągalne (budowanie), furtka
    r8 = [(x, y) for y in range(mp.H) for x in range(mp.W) if mp.region(x, y) == 8]
    nie8 = [c for c in r8 if c not in reach]
    if not r8: zle.append("brak regionu 8")
    if nie8: zle.append("działka: %d z %d kratek regionu 8 nieosiągalnych, np. %s" % (len(nie8), len(r8), nie8[:4]))
    # Zasoby: ogródki (każda wolna kratka kwatery), wysypisko i glinianka (kratka obok)
    for k, g in st["zasoby_GARDENS"].items():
        cells = [(g["x"] + i, g["y"] + j) for i in range(g["w"]) for j in range(g["h"])]
        if not any(c in reach for c in cells): zle.append("ogródek %s nieosiągalny" % k)
        upr = [tuple(c) for c in g["uprawy"]]
        zaj = [c for c in upr if not mp.stoi(*c)]
        if zaj: zle.append("ogródek %s: kratki upraw zajęte %s" % (k, zaj))
    w = st["wysypisko"]
    if not any((w["x"] + i, w["y"] + j) in reach for i in range(w["w"]) for j in range(w["h"])): zle.append("wysypisko nieosiągalne")
    zd = {(e.x, e.y) for e in mp.zd if e.widoczne or e.blokuje}
    for i in range(w["w"]):
        for j in range(w["h"]):
            c = (w["x"] + i, w["y"] + j)
            if c in zd or not mp.stoi(*c): zle.append("wysypisko: kratka %s zajęta" % (c,))
    g = st["glinianka"]
    for i in range(g["w"]):
        for j in range(g["h"]):
            c = (g["x"] + i, g["y"] + j)
            if c in zd or not mp.stoi(*c): zle.append("glinianka: kratka %s zajęta" % (c,))
    if not any((g["ex"] + dx, g["ey"] + dy) in reach for dx, dy in ((0, 1), (-2, 0), (2, 0), (0, 2), (-1, 1), (1, 1))):
        zle.append("glinianka: brak dojścia do dołu %s" % ((g["ex"], g["ey"]),))
    miejsca = [(e.name, e.x, e.y) for e in mp.zd if e.name.startswith("Miejsce:")]
    for (n, x, y) in miejsca:
        if (x, y) not in reach: zle.append("%s (%d,%d) nieosiągalne" % (n, x, y))
    for p in MAP["c_miejsca"]["punkty_wtyczek"]:
        if "kamera" in p["co"] or "Underground" in p["co"] or "w6_tent" in p["co"]: continue   # (ustawiane skryptem / rekwizyt)
        if tuple(p["nowe"]) not in reach: zle.append("punkt %s %s nieosiągalny" % (p["co"], p["nowe"]))
    print("  dojście (%d budynków, bramy, studnia, napisy, %d miejsc, działka %d kratek, ogródki, wysypisko, glinianka, punkty "
          "wtyczek):" % (len(bud), len(miejsca), len(r8)), "OK" if not zle else "PROBLEMY: " + "; ".join(zle[:16]))
    print("  przejścia przy drzwiach (2 kratki):", "OK" if not waskie else "WĄSKO: " + "; ".join(waskie))
    wynik["dojscie"] = len(zle)
    wynik["waskie"] = len(waskie)
    wynik["licznik_kontroli"] = r["licznik"]
    json.dump(wynik, open(os.path.join(HERE, "kontrola_wynik.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return wynik


if __name__ == "__main__":
    main()
