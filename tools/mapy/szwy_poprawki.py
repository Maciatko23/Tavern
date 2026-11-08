# -*- coding: utf-8 -*-
"""Poprawki łączeń map w kaflach (B; gracz 2026-11-07: „przejścia pomiędzy mapami mają być super naturalne i płynne” -> „B po
kolei”, każde łączenie z obrazem przed / po do zgody). Ranking: docs/mapy/szwy (tools/mapy/szwy_przeglad.py). Każde łączenie to
funkcja poniżej: zmienia jak najmniej kratek, tymi samymi kaflami co sąsiadka, kształty autokafli przeliczone (tools/rozszerzenia/
wspolne.py reshape). Przejścia (zdarzenia przejść) zostają na ziemi, po której da się chodzić.
  python tools/mapy/szwy_poprawki.py <nr> [<nr> ...]            (kopie map w tools/mapy/staging_szwy/data)
  python tools/mapy/szwy_poprawki.py <nr> [<nr> ...] --wykonaj  (do data/ przy zamkniętym edytorze; kopie: tools/mapy/kopie_zapasowe/<czas>_szwy)"""
import datetime, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging_szwy", "data")
A1, A2 = 2048, 2816
kid = lambda k: A2 + (k - 16) * 48 if k >= 16 else A1 + k * 48   # (an autotile kind's first id; the shape is set by reshape)
maps = {}


def mapa(mid):
    if mid not in maps:
        p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        raw = open(p, "rb").read()
        m = json.loads(raw.decode("utf-8"))
        if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map%03d nie w układzie edytora" % mid)
        maps[mid] = (m, raw)
    return maps[mid][0]


def ring(cells, r=1):
    out = set()
    for (x, y) in cells:
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1): out.add((x + dx, y + dy))
    return out


def ground(m, cells, l0, l1):
    """cells become the ground: layer 0 kind l0, layer 1 kind l1 (or nothing), the shapes worked out with their neighbours"""
    for (x, y) in cells:
        W.put(m, 0, x, y, kid(l0))
        W.put(m, 1, x, y, kid(l1) if l1 is not None else 0)
    near = ring(cells, 1)
    W.reshape(m, 0, near)
    W.reshape(m, 1, near)   # (reshape leaves out the cells off the map and those with no autotile on that layer)


# ------------------------------------------------------------------ the seams, numbered in the order they were fixed (2026-11-07: 1 = the
# first of the ranking then; 2-3 = the batch after it - docs/mapy/szwy/szwy_2_6_przed_po.png)
def szew_1():
    """910 Sosnowy Klif | 950 Zbocze pod Pustelnią: 910 has land at its east edge from y 221 (its rows 76-79), 950 water there down to
    its row 4 - the bay was cut by the border. 950's shore by the border moves two rows up (land from its row 3, like 910) and runs
    down the diagonal into its own shore by column 5; the same ground as on both maps (A2 kind 17, the stony shore kind 39 over it)."""
    m = mapa(950)
    # (x: the first land row) - from 910's line at the border to 950's own (row 8 by x 5)
    first = {0: 3, 1: 4, 2: 5, 3: 6, 4: 7}
    cells = [(x, y) for x, y0 in first.items() for y in range(y0, 9) if 2048 <= W.at(m, 0, x, y) < 2816]
    ground(m, cells, 17, 39)
    return [950], "950: %d kratek wody -> brzeg (%s)" % (len(cells), ", ".join("%d,%d" % c for c in cells))


def szew_2():
    """3 Kruczy Jar | 20 Dom dziadka - Podwórze (both tileset 9, the same grass on both sides):
    - 20's top row was a strip of dense leaves (A4 kind 119 + A2 kind 20 over it, x 11-79) - the copy of the barrier 3 had at its
      bottom before the leaves were taken off every map (2026-11-01; the player: no dense-leaf strips at edges, plain grass);
      it becomes 3's last row's ground (grass, kind 16, and the earth patches, kind 27, where 3 has them), nothing over it;
    - 3's row 58 was a raised ground's top rim (A5 89, with its corners 97 / 77) across the whole map, 2 rows over the border -
      the old frame of the doubled map, an invisible wall since the world joined 3 and 20 (passable only on the path and at two
      cells): grass (kind 16) like the rows round it; the rim down 3's east side (x 78, the border with 23) stays."""
    m3, m20 = mapa(3), mapa(20)
    k = lambda m, z, x, y: (W.at(m, z, x, y) - 2048) // 48 if W.at(m, z, x, y) >= 2048 else None
    cells20 = [(x, 0) for x in range(m20["width"]) if k(m20, 0, x, 0) == 119 or k(m20, 1, x, 0) == 20]
    for (x, y) in cells20:
        W.put(m20, 0, x, y, kid(k(m3, 0, x, m3["height"] - 1)))
        if k(m20, 1, x, y) == 20: W.put(m20, 1, x, y, 0)
    # (the leaves' slivers left under that strip - rows 1-2, one cell thick along the border - go too: the patch below starts
    # with its own round outline at row 3, not with a straight edge under the border)
    slivers = [(x, y) for y in (1, 2) for x in range(m20["width"]) if k(m20, 1, x, y) == 20]
    for (x, y) in slivers: W.put(m20, 1, x, y, 0)
    cells20 += slivers
    near = ring(cells20, 1); W.reshape(m20, 0, near); W.reshape(m20, 1, near)
    y58 = m3["height"] - 2
    cells3 = [(x, y58) for x in range(1, m3["width"] - 2) if 1536 <= W.at(m3, 0, x, y58) < 2048]
    for (x, y) in cells3: W.put(m3, 0, x, y, kid(16))
    W.reshape(m3, 0, ring(cells3, 1))
    return [3, 20], "20: %d kratek gęstych liści przy granicy (1. rząd + %d resztek w rzędach 2-3) -> grunt jak ostatni rząd 3; 3: %d kratek progu w rzędzie %d -> trawa" % (len(cells20), len(slivers), len(cells3), y58)


def szew_3():
    """24 Posiadłość Lorda | 901 Sady pod dworem: under the estate's south wall (24's row 58, a gate on the road) 901 had a hedge row
    along its whole top edge - 31 trees and 17 bushes in rows 0-2 (x 5-75) over a strip of tall grass (A2 kind 21 on its row 0):
    a dense band of crowns on the border (the player: no rows of trees as edge barriers - open both sides to grass; the wall in 24
    is the barrier). The trees and bushes of that row go (stones and the lone <Zapora:krawedz> pines / rocks stay), the tall-grass
    strip goes - the ground continues 24's last row (plain grass, the road)."""
    m = mapa(901)
    gone = []
    for i, e in enumerate(m["events"]):
        if not e or e["y"] > 2 or not (2 <= e["x"] <= 77): continue
        pic = e["pages"][0]["image"]["characterName"]
        row = not (e.get("note") and "Zapora" in e["note"]) and (pic.startswith("!$Big_Trees") or pic.startswith("!$Bush_") or pic.startswith("!$Pine"))
        cut = e["y"] == 0 and pic.startswith("!$Pine")   # (a pine on the top row: its crown is over the map's edge - only a trunk is ever seen)
        if row or cut: gone.append("%d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"])); m["events"][i] = None
    k = lambda z, x, y: (W.at(m, z, x, y) - 2048) // 48 if W.at(m, z, x, y) >= 2048 else None
    cells = [(x, 0) for x in range(m["width"]) if k(1, x, 0) == 21]
    # (the dense-leaf patches - A2 kind 20 - that hung under the trees from the border: with the trees gone they would show as a dark
    # band with a straight top along it; every patch that touches rows 0-2 goes, the others in the orchard stay)
    seen, leaves = set(), []
    for x0 in range(m["width"]):
        for y0 in (0, 1, 2):
            if (x0, y0) in seen or k(1, x0, y0) != 20: continue
            comp, st = [], [(x0, y0)]; seen.add((x0, y0))
            while st:
                x, y = st.pop(); comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < m["width"] and 0 <= ny < m["height"] and (nx, ny) not in seen and k(1, nx, ny) == 20: seen.add((nx, ny)); st.append((nx, ny))
            leaves += comp
    for (x, y) in cells + leaves: W.put(m, 1, x, y, 0)
    W.reshape(m, 1, ring(cells + leaves, 1))
    return [901], "901: %d zdarzeń (drzewa, krzaki, sosny ucięte krawędzią) zdjętych przy granicy, %d kratek wysokiej trawy w 1. rzędzie i %d kratek gęstych liści przy granicy -> nic: %s" % (len(gone), len(cells), len(leaves), "; ".join(gone))


def szew_4():
    """111 Podgrodzie | 917 Wyspa Kormoranów (the colours: Laka.js + CzerwonaWoda.js with the neighbours' water, not tiles - the tiles
    on both sides are the same): 917's land under the border is only 5 rows deep (the sea from its row 5 for x 40-110), and on its
    row 2 stood a line of 9 trees 6-14 cells apart, 3 cells off the water - a row along the border, on the shore's dry strip (the
    player: no rows of trees at edges; by the shore nothing on the dry band, trees only a few cells - 4-6+ - off the water). They go;
    the cape's other trees (the beach and the islets further south, the clump at its west end) stay."""
    m = mapa(917)
    gone = []
    for i, e in enumerate(m["events"]):
        if e and e["y"] == 2 and e["x"] >= 40 and e["pages"][0]["image"]["characterName"].startswith("!$Big_Trees"):
            gone.append("%d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"])); m["events"][i] = None
    return [917], "917: %d drzew z rzędu przy granicy zdjętych: %s" % (len(gone), "; ".join(gone))


def szew_5():
    """175 Orla Grań | 13 Góry i kamieniołom (both tileset 11, x0 404 in the world: the same x on both maps; the player: „popraw
    ładnie”): the ridge ended in a cliff of two A5 rows (175's rows 58-59) dead straight for 107 cells, cut in pieces every 8 (a
    left / right end piece each), with a 3-cell gap stopped by a row of ornaments, the bay's water lying right on its top; 13's top
    showed a copy of it on x 12-28 (on the island's map a double cliff) and open grass on x 29-118 - an invisible wall in game.
    Now ONE cliff over the border: the plateau's stone rim (A5 dirt 109-111 / grass 104-106 by the ground there) on 175, the face's
    top (117-119) under it, plain rock in the middle (73, now and then 81 / 83 / the tufted 72 / 74), its foot (dirt 125-127 / grass
    120-122 by the ground below) on 13's row 0 or 1 - seen from both maps. The top line steps between 175's rows 57 and 59 and the
    foot between 13's rows 0 and 1 in long stretches (6-18 cells, the rim's corners and the face's ends set at every step); the ends
    by the climbing path (x 12) and at x 118 taper to the old two rows on 175; by the bay the top drops a row and a strip of shore
    is made land (the water's corners rounded). x 0-11 (the gated climb: the path, region 7, the ornaments) is not touched."""
    a, b = mapa(175), mapa(13)
    A5 = lambda i: 1536 + i
    X0, X1 = 12, 118
    LIP = {}   # x -> the face's top row on 175
    for lo, hi, v in ((12, 19, 58), (20, 27, 57), (28, 40, 58), (41, 52, 57), (53, 72, 58), (73, 82, 57), (83, 100, 59), (101, 108, 58), (109, 114, 57), (115, 118, 58)):
        for x in range(lo, hi + 1): LIP[x] = v
    FOOT = {}  # x -> the foot's row: -1 = 175's row 59 (the ends: the old two rows), 0 / 1 = 13's row
    for lo, hi, v in ((12, 13, -1), (14, 61, 0), (62, 108, 1), (109, 116, 0), (117, 118, -1)):
        for x in range(lo, hi + 1): FOOT[x] = v
    k = lambda m, z, x, y: (W.at(m, z, x, y) - 2048) // 48 if W.at(m, z, x, y) >= 2048 else None
    GRASS = (16, 17, 25, 27)
    h = lambda x, y: ((x * 73856093) ^ (y * 19349663) ^ 0x5bd1e995) % 1000 / 1000.0
    def rock(x, y):
        r = h(x, y)
        return A5(81) if r < 0.14 else A5(83) if r < 0.24 else A5(72) if r < 0.28 else A5(74) if r < 0.32 else A5(73)
    # (gy: a cell of the cliff in one column, top to bottom - 175's rows then 13's: 0..59 on 175, 60.. on 13)
    cells, gone = [], []
    def put(gy, x, v):
        m, y = (a, gy) if gy < 60 else (b, gy - 60)
        W.put(m, 0, x, y, v)
        for z in (1, 2, 3): W.put(m, z, x, y, 0)
        cells.append((m is a, x, y))
    foot_gy = lambda x: 59 if FOOT[x] < 0 else 60 + FOOT[x]
    # the bay: the land the top's rim needs, the water's corners rounded
    land = [(x, y) for (x, y) in ((86, 58), (87, 58), (88, 58), (89, 58), (90, 58), (91, 58)) + tuple((x, 57) for x in range(85, 93)) +
            ((84, 56), (85, 56), (86, 56), (96, 56), (97, 56), (98, 56), (84, 55), (99, 55)) if k(a, 0, x, y) is not None and k(a, 0, x, y) < 16]
    for (x, y) in land:
        W.put(a, 0, x, y, kid(24)); W.put(a, 1, x, y, 0)
    W.reshape(a, 0, ring(land, 1))
    for x in range(X0, X1 + 1):
        L, F = LIP[x], foot_gy(x)
        Lp, Ln = LIP.get(x - 1, 99), LIP.get(x + 1, 99)
        Fp, Fn = (foot_gy(x - 1) if x - 1 in FOOT else -99), (foot_gy(x + 1) if x + 1 in FOOT else -99)
        # the rim (175, row L-1): the plateau's ground there decides dirt or grass
        g = k(a, 0, x, L - 1)
        grass = g in GRASS
        if Ln < L: rim = 106 if grass else 111         # (the next column's face is higher: the rim turns up at its right)
        elif Lp < L: rim = 104 if grass else 109
        else: rim = 105 if grass else 110
        put(L - 1, x, A5(rim))
        # the face's top
        put(L, x, A5(117 if (Lp > L or x == X0) else 119 if (Ln > L or x == X1) else 118))
        for gy in range(L + 1, F): put(gy, x, rock(x, gy))
        # the foot: the ground under it decides dirt or grass
        below = k(b, 0, x, F - 60 + 1) if F >= 60 else k(b, 0, x, 0)
        gb = below in GRASS
        left = Fp < F or x == X0
        right = Fn < F or x == X1
        put(F, x, A5((120 if left else 122 if right else 121) if gb else (125 if left else 127 if right else 126)))
        # 13's cells under the foot that were the old copy of the cliff: the plateau's ground (dirt)
        for y in range(max(0, F - 60 + 1), 2):
            v = W.at(b, 0, x, y)
            if 1536 <= v < 2048 and v - 1536 in (117, 118, 119, 125, 126, 127):
                W.put(b, 0, x, y, kid(24)); cells.append((False, x, y))
    # the ornaments that stopped the old gap (they stood on what is now rock)
    on_rock = {(x, y) for (on_a, x, y) in cells if on_a}
    for i, e in enumerate(a["events"]):
        if e and (e["x"], e["y"]) in on_rock and 1536 <= W.at(a, 0, e["x"], e["y"]) < 2048 and W.at(a, 0, e["x"], e["y"]) - 1536 not in (104, 105, 106, 109, 110, 111):
            gone.append("%d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"])); a["events"][i] = None
    for i, e in enumerate(b["events"]):
        if e and X0 <= e["x"] <= X1 and e["y"] <= max(0, foot_gy(e["x"]) - 60) and foot_gy(e["x"]) >= 60:
            gone.append("13: %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"])); b["events"][i] = None
    W.reshape(b, 0, ring([(x, y) for (on_a, x, y) in cells if not on_a], 1))
    W.reshape(a, 0, ring([(x, y) for (on_a, x, y) in cells if on_a], 1))
    n175 = sum(1 for c in cells if c[0]); n13 = len(cells) - n175
    return [175, 13], "175: %d kratek urwiska (krawędź, ściana) + %d kratek wody zatoki -> ląd; 13: %d kratek (podnóże ściany, dawna kopia -> grunt); zdjęte zdarzenia: %s" % (n175, len(land), n13, "; ".join(gone) or "-")


def szew_6():
    """17 Omszała łąka | 933 Zatoka Kłód (both tileset 9; 17's x 79 | 933's x 0, 933's rows = 17's rows - 4): 17's bay reached the
    border from its row 60, while 933 is land down to its row 72 (its sea from row 73 at x 0) - the water stood straight against the
    land along the border for 13 rows (the ranking's „urwany teren”), and on 933's side a hedge of 26 trees, bushes and rocks in its
    two first columns walled it. 17's bay gets a north-east shore of its own (the land grows, no land is lost): from its tip at (72, 64)
    down to the border at row 73, where 933's sea begins; the new land is the grass of its row (kind 16 / 27, nothing over it), the
    water's shapes worked out again. The hedge on 933's x 0-1 goes (a few things further in stay)."""
    a, b = mapa(17), mapa(933)
    k = lambda m, z, x, y: (W.at(m, z, x, y) - 2048) // 48 if W.at(m, z, x, y) >= 2048 else None
    water = lambda x, y: k(a, 0, x, y) is not None and k(a, 0, x, y) < 16
    land = []
    for y in range(60, 73):
        e = int(72 + (y - 63) * 0.75)   # (the new east shore: water only west of it)
        for x in range(60, 80):
            if water(x, y) and x > e: land.append((x, y))
    # (a lone water cell left at the bay's tip: land too)
    for y in range(60, 73):
        for x in range(60, 80):
            if water(x, y) and (x, y) not in land and sum(1 for dx in (-1, 1) if water(x + dx, y) and (x + dx, y) not in land) == 0: land.append((x, y))
    for (x, y) in land:
        g = next((k(a, 0, xx, y) for xx in range(x - 1, 49, -1) if not water(xx, y) and k(a, 0, xx, y) in (16, 27)), 16)
        W.put(a, 0, x, y, kid(g)); W.put(a, 1, x, y, 0)
    W.reshape(a, 0, ring(land, 1)); W.reshape(a, 1, ring(land, 1))
    gone = []
    for i, e in enumerate(b["events"]):
        if e and e["x"] <= 1 and 56 <= e["y"] <= 72:
            gone.append("%d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"])); b["events"][i] = None
    return [17, 933], "17: %d kratek wody zatoki -> ląd (nowy brzeg do granicy w rzędzie 73); 933: %d zdarzeń żywopłotu przy granicy zdjętych" % (len(land), len(gone))


def szew_7():
    """4 Łąka pod Gawrą | 3 Kruczy Jar (both the player's maps, tileset 9; 3's x = 4's x + 5): 3's own cliff at its top (row 0 the
    grass plateau's rim, 105 / corners 104-106, row 1 the face with its grass foot, 121 / ends 120-122) had a copy on 4's last two rows
    (the seams of 2026-10-31: rim + foot again) - two thin cliffs one over the other, on the island's map a double line. Now ONE
    cliff three rows high over the border, as on Orla Grań | Góry: 4's row 58 stays the rim, 4's row 59 becomes the face's top (113,
    the ends by the road 112 / 114), 3's row 0 the rock in its middle (73, now and then 81 / 83 / 72 / 74), 3's row 1 stays its foot.
    Only where both cliffs lie (4's x 0-22 and 27-34; the road between them and the slope at x 35+ are not touched)."""
    a, b = mapa(4), mapa(3)
    A5 = lambda i: 1536 + i
    h = lambda x, y: ((x * 73856093) ^ (y * 19349663) ^ 0x5bd1e995) % 1000 / 1000.0
    def rock(x, y):
        r = h(x, y)
        return A5(81) if r < 0.14 else A5(83) if r < 0.24 else A5(72) if r < 0.28 else A5(74) if r < 0.32 else A5(73)
    done = []
    for lo, hi in ((0, 22), (27, 34)):
        for x in range(lo, hi + 1):
            top, mid = W.at(a, 0, x, 59) - 1536, W.at(b, 0, x + 5, 0) - 1536
            if top not in (120, 121, 122) or mid not in (104, 105, 106): continue   # (only where the copy and the rim are as read)
            W.put(a, 0, x, 59, A5(112 if top == 120 else 114 if top == 122 else 113))
            W.put(b, 0, x + 5, 0, rock(x + 5, 0))
            done.append(x)
    return [4, 3], "4: %d kratek (rząd 59: podnóże kopii -> góra ściany); 3: %d kratek (rząd 0: krawędź -> skała); x %s" % (len(done), len(done), ",".join(map(str, done)))


SZWY = {1: szew_1, 2: szew_2, 3: szew_3, 4: szew_4, 5: szew_5, 6: szew_6, 7: szew_7}

if __name__ == "__main__":
    nrs = [int(a) for a in sys.argv[1:] if a.isdigit()]
    if not nrs: raise SystemExit(__doc__)
    touched = set()
    for n in nrs:
        ids, info = SZWY[n]()
        touched |= set(ids)
        print("łączenie %d: %s" % (n, info))
    do = "--wykonaj" in sys.argv
    if do:
        W.need_editor_closed()
        kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_szwy"); os.makedirs(kop, exist_ok=True)
    os.makedirs(STG, exist_ok=True)
    for mid in sorted(touched):
        m, raw = maps[mid]
        out = W.map_text(m).encode("utf-8")
        if do:
            open(os.path.join(kop, "Map%03d.json" % mid), "wb").write(raw)
            open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "wb").write(out)
        else:
            open(os.path.join(STG, "Map%03d.json" % mid), "wb").write(out)
    print(("zapisane do data/ (kopie: %s)" % kop) if do else ("kopie w %s" % STG))
