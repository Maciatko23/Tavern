# -*- coding: utf-8 -*-
"""Wzgórza jak na mapie próbnej A (gracz 2026-11-07: „ta mapa A już całkiem nieźle wygląda, czy na jej bazie można poprawić inne mapy?
żeby wzgórza nie były pocharatane”). Postrzępione pierścienie z kafli A5 (urwany obrys, dziury, zęby, kolumny lica różnej wysokości)
przebudowane w zamknięte wzgórza zbudowane tak, jak gracz zbudował swoje wzgórze nr 1 na Map990 (docs/MAPY_ZASADY.md rozdz. 12):
  górna krawędź (93 94..94 95), boki (101 / 103), środek z gruntem mapy, dolna krawędź wierzchu (109 110..110 111),
  lico z dwóch rzędów (117 118..118 119 / 125 126..126 127; co kilka kolumn odmiana 73/81 albo 74/82 - jak u gracza),
  schody w licu (2 szerokie: 32 34), lico przy schodach jak u gracza (rząd 1: 119 | schody | 117, rząd 2: 126 | schody | 126),
  nad schodami grunt (wejście na wierzch). Wszystko na warstwie 0; warstwa 1 (płaty kamieni) zostaje w środku, z obrysu i lica
  zdjęta, a jej brzegi przeliczone (autokafle). Kafle z zestawem z ziemią na wierzchu (Orla Grań: zestaw 11, kolumny 5-7 arkusza A5).
Mapa: kopia robocza w tools/wzgorza_popraw/staging/data (nic w grze), raport: co, gdzie; sprawdza, że miejsca zadań są na wierzchu,
wierzch jest osiągalny tylko schodami i poza wzgórzami żadna kratka nie przestała być osiągalna.
  python tools/wzgorza_popraw/popraw.py 175             (staging + raport)
  python tools/wzgorza_popraw/popraw.py 175 --wykonaj   (do data/ - TYLKO przy zamkniętym edytorze; kopie: kopie_zapasowe/<czas>)"""
import datetime, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import mapylib as L
import wspolne as W
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# the dirt-topped A5 block of tileset 11 (the grass one of the user's hill: the same places, 5 columns to the left)
DIRT = dict(rimL=93, rim=94, rimR=95, sideL=101, sideR=103, lipL=109, lip=110, lipR=111, f1L=117, f1=118, f1R=119, f2L=125, f2=126, f2R=127,
            v1=(73, 74), v2=(81, 82), stL=32, stR=34)
GRASS = {k: (v - 5 if isinstance(v, int) and v >= 88 else v) for k, v in DIRT.items()}   # (the grass-topped block: the user's own hill on Map990)
GRASS.update(stL=24, stR=26)
PLAIN = {76, 77, 78, 79, 84, 85, 86, 87}

# per map: the hills - clear: the box whose broken A5 pieces go; top: the hill's top (x0, y0, x1, y1: the rim row y0, the lip row y1);
# stairs: the two columns of the stairs in the face; keep: the places that must stay on the top (x0, y0, x1, y1)
MAPS = {
    175: {"set": DIRT, "hills": [
        {"name": "pierścień grzędy 1 (Zakon: orle_grzedy_1)", "clear": (61, 6, 72, 17), "top": (63, 8, 70, 14), "stairs": (66, 67), "keep": [(67, 11, 69, 13)]},
        {"name": "pierścień grzędy 3 (Zakon: orle_grzedy_3)", "clear": (60, 37, 72, 50), "top": (62, 39, 71, 46), "stairs": (66, 67), "keep": [(67, 43, 69, 45)]},
        {"name": "mały pierścień pośrodku", "clear": (31, 31, 39, 40), "top": (33, 33, 38, 37), "stairs": (35, 36), "keep": []},
    ]},
    # Pustelnia na klifie: the yard's side by its stairs had a gap of one cell (26,12) - one walked off the yard beside the stairs
    # (a right side, as on the two cells above it); and its east side (x 30) met the sea cliff's rim in the middle of a rim piece
    # (88 89 90 at 30-32): one walked round the side's top along the rim - the yard's corner is 90 at (30,3), the lower ground's
    # rim starts again at (31,3) with 88. "closed": a place on a top that must be reached only by its stairs
    155: {"set": GRASS, "hills": [], "cells": [(26, 12, 98), (30, 3, 90), (31, 3, 88)],
          "closed": [{"name": "podwórze pustelni", "inside": (20, 10), "outside": (28, 13), "stairs": [(25, 13), (26, 13), (25, 14), (26, 14)]}]},
}


def a5_of(t):
    return t - 1536 if 1536 <= t < 1664 else None


def is_cliff(t):
    i = a5_of(t)
    return i is not None and i >= 72 and i not in PLAIN


def hash2(x, y):
    h = (x * 374761393 + y * 668265263) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return (h ^ (h >> 16)) / 4294967296.0


def build(mid):
    cfg = MAPS[mid]
    path = os.path.join(ROOT, "data", "Map%03d.json" % mid)
    raw = open(path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map%03d nie jest w układzie edytora - nie ruszam" % mid)
    Wd, Hd, d, n = m["width"], m["height"], m["data"], m["width"] * m["height"]
    S = cfg["set"]
    at = lambda z, x, y: d[z * n + y * Wd + x]
    def put(z, x, y, v): d[z * n + y * Wd + x] = v
    before = L.Mapa(mid, raw=json.loads(raw.decode("utf-8")))
    reach0 = before.flood(before.starty())
    events = [e for e in m["events"] if e]
    changed0, changed1, report = set(), set(), []
    for h in cfg["hills"]:
        cx0, cy0, cx1, cy1 = h["clear"]
        x0, y0, x1, y1 = h["top"]
        sx = h["stairs"]
        # the ground of the map round the hill (layer 0): the commonest A2 floor in the box's ring that is not a cliff
        from collections import Counter
        ground = Counter(at(0, x, y) for y in range(cy0 - 1, cy1 + 2) for x in range(cx0 - 1, cx1 + 2)
                         if 0 <= x < Wd and 0 <= y < Hd and at(0, x, y) >= 2048 and not is_cliff(at(0, x, y)) and (x < cx0 or x > cx1 or y < cy0 or y > cy1))
        g = ground.most_common(1)[0][0]
        g = 2048 + ((g - 2048) // 48) * 48   # (the kind; its shape below)
        # 1. the broken pieces out: ground again
        gone = 0
        for y in range(cy0, cy1 + 1):
            for x in range(cx0, cx1 + 1):
                for z in (0, 1):
                    if is_cliff(at(z, x, y)) or (a5_of(at(z, x, y)) is not None and 32 <= a5_of(at(z, x, y)) <= 34):
                        put(z, x, y, g if z == 0 else 0); gone += 1
                        (changed0 if z == 0 else changed1).add((x, y))
                put(4, x, y, 0)   # (the editor's shadow pen there)
        # 2. the hill: rim, sides, the top's ground, lip, two rows of the face, stairs
        def tile(x, y):
            if y == y0: return S["rimL"] if x == x0 else S["rimR"] if x == x1 else S["rim"]
            if y < y1: return S["sideL"] if x == x0 else S["sideR"] if x == x1 else None
            if y == y1:
                if x in sx: return None
                return S["lipL"] if x == x0 else S["lipR"] if x == x1 else S["lip"]
            row = y - y1   # 1, 2: the face
            if x in sx: return S["stL"] if x == sx[0] else S["stR"]
            if row == 1:
                if x == x0: return S["f1L"]
                if x == x1: return S["f1R"]
                if x == sx[0] - 1: return S["f1R"]
                if x == sx[1] + 1: return S["f1L"]
            else:
                if x == x0: return S["f2L"]
                if x == x1: return S["f2R"]
                if x in (sx[0] - 1, sx[1] + 1): return S["f2"]
            # a middle of the face: now and then the user's variant (a pair down the column)
            k = hash2(mid * 1000 + x, h["top"][1])
            if 0 < x - x0 < x1 - x0 - 1 and x not in (sx[0] - 1, sx[1] + 1) and k < 0.18:
                return (S["v1"] if row == 1 else S["v2"])[0 if k < 0.09 else 1]
            return S["f1"] if row == 1 else S["f2"]
        laid = 0
        for y in range(y0, y1 + 3):
            for x in range(x0, x1 + 1):
                t = tile(x, y)
                outline = y == y0 or y >= y1 or x in (x0, x1)
                if t is None:
                    put(0, x, y, g); changed0.add((x, y))
                else:
                    put(0, x, y, 1536 + t); laid += 1
                if outline:
                    if at(1, x, y): changed1.add((x, y))
                    put(1, x, y, 0)
                put(4, x, y, 0)
        # what stands in the way: an event on the outline or the face (the top's middle is fine)
        for e in events:
            if x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1 + 2 and (e["y"] == y0 or e["y"] >= y1 or e["x"] in (x0, x1)):
                report.append("  UWAGA %s: zdarzenie %d '%s' na obrysie/licu (%d,%d)" % (h["name"], e["id"], e["name"], e["x"], e["y"]))
        report.append("  %-44s zdjęte %3d kafli A5, nowe wzgórze %dx%d (wierzch %d-%d x %d-%d), lico 2 rzędy, schody %d-%d, %d kafli" %
                      (h["name"], gone, x1 - x0 + 1, y1 - y0 + 3, x0, x1, y0, y1, sx[0], sx[1], laid))
    # single cells (a side, a lip piece): A5 on layer 0, the stone patch of layer 1 off it
    for (x, y, idx) in cfg.get("cells", []):
        report.append("  kratka (%d,%d): %s -> A5 %d" % (x, y, at(0, x, y), idx))
        put(0, x, y, 1536 + idx); put(1, x, y, 0); put(4, x, y, 0); changed1.add((x, y))
    # the autotiles round what changed (the ground of layer 0, the stone patches of layer 1)
    W.reshape(m, 0, W.ring(changed0, 1))
    W.reshape(m, 1, W.ring(changed1 | changed0, 1))
    after = L.Mapa(mid, raw=m)
    reach1 = after.flood(after.starty())
    # checks
    ok = True
    for h in cfg["hills"]:
        x0, y0, x1, y1 = h["top"]
        top = {(x, y) for y in range(y0 + 1, y1 + 1) for x in range(x0 + 1, x1)}
        for (kx0, ky0, kx1, ky1) in h["keep"]:
            cells = [(x, y) for y in range(ky0, ky1 + 1) for x in range(kx0, kx1 + 1)]
            bad = [c for c in cells if c not in reach1]
            on = all(c in top for c in cells)
            report.append("  %s: miejsce %s na wierzchu %s, osiągalne %s" % (h["name"], (kx0, ky0, kx1, ky1), "tak" if on else "NIE", "tak" if not bad else "NIE " + str(bad)))
            ok = ok and on and not bad
        # the top is reached only by the stairs: without them nothing of the top is reachable
        test = json.loads(json.dumps(m))
        mt = L.Mapa(mid, raw=test)
        for y in (y1 + 1, y1 + 2):
            for x in h["stairs"]: test["data"][(0 * Hd + y) * Wd + x] = 1536 + DIRT["f1"]
        r = mt.flood(mt.starty())
        leak = [c for c in top if c in r]
        report.append("  %s: wierzch bez schodów osiągalny w %d kratkach (ma być 0)" % (h["name"], len(leak)))
        ok = ok and not leak
    # a top closed all round: with its stairs walled up, walking from inside it never gets out (a door of a house landing on it
    # is no way off it)
    for c in cfg.get("closed", []):
        for label, mm in (("przed", json.loads(raw.decode("utf-8"))), ("po", m)):
            test = json.loads(json.dumps(mm))
            for (x, y) in c["stairs"]: test["data"][(0 * Hd + y) * Wd + x] = 1536 + DIRT["f1"]
            mt = L.Mapa(mid, raw=test)
            r = mt.flood([c["inside"]])
            out = c["outside"] in r
            report.append("  %s (%s): bez schodów da się z niego zejść: %s" % (c["name"], label, "TAK" if out else "nie"))
            if label == "po": ok = ok and not out
        r = after.flood([c["inside"]])
        report.append("  %s (po): ze schodami zejście jest: %s" % (c["name"], "tak" if c["outside"] in r else "NIE"))
        ok = ok and c["outside"] in r
    boxes = [h["clear"] for h in cfg["hills"]] + [(x, y, x, y) for (x, y, _) in cfg.get("cells", [])]
    inbox = lambda c: any(b[0] <= c[0] <= b[2] and b[1] <= c[1] <= b[3] for b in boxes)
    lost = sorted(c for c in reach0 - reach1 if not inbox(c))
    report.append("  poza wzgórzami: osiągalnych przed %d, po %d, utracone poza wzgórzami: %d %s" % (len(reach0), len(reach1), len(lost), lost[:10]))
    ok = ok and not lost
    return m, raw, report, ok


if __name__ == "__main__":
    mid = int(sys.argv[1])
    m, raw, report, ok = build(mid)
    print("Map%03d" % mid)
    for r in report: print(r)
    out = W.map_text(m).encode("utf-8")
    if "--wykonaj" in sys.argv:
        if not ok: raise SystemExit("sprawdzenia nie przeszły - nic nie zapisano")
        W.need_editor_closed()
        kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
        os.makedirs(kop, exist_ok=True)
        open(os.path.join(kop, "Map%03d.json" % mid), "wb").write(raw)
        open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "wb").write(out)
        print("zapisane do data/; kopia:", kop)
    else:
        os.makedirs(STG, exist_ok=True)
        open(os.path.join(STG, "Map%03d.json" % mid), "wb").write(out)
        print("WYNIK:", "ok" if ok else "BŁĄD", "- kopia w", STG)
