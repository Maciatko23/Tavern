# -*- coding: utf-8 -*-
"""Próba stylu sztolni (gracz 2026-11-15, dwa obrazki wzorcowe: półki skalne nad przepaścią, most linowy, drabina, sztolnia z belkami,
stalagmity w mroku, kryształy): jeden fragment 40 x 30 z kafli Winlu Dungeon (zestaw 20), TYLKO obraz podglądu - nic nie idzie do gry.
  python tools/nowy_swiat/sztolnia_proba_stylu.py <plik.png>"""
import json, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "kopalnia"))
import zbuduj as K
from zbuduj import W, uglib, DMap
from uglib import F_MOSSY, FILM_CRACKS, FILM_MOSS, FILM_RUBBLE
from chunks_deep import W_CAVE_MOSS, FILM_HOLE, WATER

MW, MH = 40, 30


def rough(cells, inside, rnd, grow=0.45, cut=0.25, passes=2):
    """an organic outline: bumps grown on the edge, bites taken out of it"""
    S = set(cells)
    nb = lambda c: [(c[0] + 1, c[1]), (c[0] - 1, c[1]), (c[0], c[1] + 1), (c[0], c[1] - 1)]
    for _ in range(passes):
        edge = {n for c in S for n in nb(c) if n not in S and n in inside}
        S |= {c for c in sorted(edge) if sum(n in S for n in nb(c)) >= 2 and rnd.random() < grow}
        rim = [c for c in sorted(S) if sum(n in S for n in nb(c)) <= 2]
        S -= {c for c in rim if rnd.random() < cut}
    return S


def build():
    mp = DMap(990225, MW, MH, "Sztolnia - próba stylu", K.NOTE, bgm="", seed=7, tileset=20)
    R = mp.rect
    rnd = random.Random(23)
    inside = R(1, 4, 38, 28)
    blob = lambda cx, cy, rx, ry: {(x, y) for (x, y) in inside if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1}
    keepU = R(3, 4, 20, 8) | R(6, 9, 13, 10) | R(19, 5, 23, 7)          # the adit's ledge, the step's top, the tongue to the bridge
    keepL = R(6, 13, 13, 15)
    upper = (rough(blob(11, 7, 10.5, 3.4) | keepU, inside, rnd) - R(1, 11, 38, 28)) | keepU
    lower = (rough(blob(10, 17, 8.5, 3.6) | keepL, inside, rnd) - R(1, 4, 38, 12)) | keepL
    east = rough(blob(34, 9, 4.4, 5.6) | R(29, 5, 33, 7), inside, rnd) | R(29, 5, 33, 7)
    south = rough(blob(30, 24, 7.5, 3.2), inside, rnd) - R(1, 4, 38, 19)
    isle = rough(blob(20, 22, 2.6, 1.8), inside, rnd)                    # a lone rock in the chasm
    ledges = upper | east | lower | south | isle
    # the north wall is no ruler line: rock outcrops push into the ledges (the shell draws their faces lower)
    outcrop = R(11, 4, 13, 4) | R(16, 4, 19, 5) | R(22, 4, 23, 4) | R(29, 4, 30, 4) | R(35, 4, 37, 5) | R(1, 4, 2, 6)
    ledges -= outcrop
    # calmer southern edges: single notches filled, single teeth cut (the cliffs under them step in longer runs)
    for _ in range(2):
        ledges |= {(x, y) for (x, y) in inside - outcrop if (x, y) not in ledges and (x, y - 1) in ledges and (x - 1, y) in ledges and (x + 1, y) in ledges}
        ledges -= {(x, y) for (x, y) in ledges if (x, y + 1) not in ledges and (x - 1, y) not in ledges and (x + 1, y) not in ledges and (x, y) not in keepU | keepL}
    # the stream: from the fall in the north wall across the east ledge to its southern edge, and over it into the dark
    SX = (33, 34)
    stream, off = set(), 0                               # it winds: a slow drift left and right on its way south
    for y in range(4, 30):
        if y > 6 and y % 2 == 0: off = max(-2, min(1, off + rnd.choice((-1, 0, 0, 1))))
        stream |= {(x + off, y) for x in SX if (x + off, y) in ledges} | ({(SX[0] + off - 1, y)} if y % 3 == 0 and (SX[0] + off - 1, y) in ledges else set())
    pool = {c for c in R(32, 4, 35, 6) | R(31, 5, 36, 5) if c in ledges}
    fall = lambda x, y: (x - 1, y) in stream or (x + 1, y) in stream     # (a fall's column: its neighbour decides the edge shape)
    hole = inside - ledges - outcrop
    floor = ledges | hole
    near = lambda c, d=1: any((c[0] + dx, c[1] + dy) in ledges for dx in range(-d, d + 1) for dy in range(-1, 4))
    mp.shell(floor, F_MOSSY, W_CAVE_MOSS)
    mp.film(FILM_HOLE, hole)
    for c in stream | pool: mp.layers[0][c] = ("k", WATER)
    for y in (2, 3):
        for x in SX: mp.layers[0][(x, y)] = ("t", 2048 + 9 * 48 + ((0 if x > SX[0] else 1) | (0 if x < SX[1] else 2)))
    # the cliffs: under every ledge's southern edge the rock drops two cells into the dark
    cliff = set()
    for (x, y) in sorted(ledges):
        if (x, y + 1) in hole:
            for k in (1, 2):
                c = (x, y + k)
                if c not in hole: continue
                cliff.add(c)
                if (x, y) in stream: mp.layers[1][c] = ("t", 2048 + 9 * 48 + ((0 if (x - 1, y) in stream else 1) | (0 if (x + 1, y) in stream else 2)))
                else: mp.t("A5", 4 + x % 4, 6 + k, x, y + k, z=1)
            if (x, y + 3) in ledges or (x, y + 2) in ledges: continue
    pick = lambda area, n: set(rnd.sample(sorted(area), min(n, len(area))))
    dry = ledges - stream - pool
    mp.film(FILM_CRACKS, pick(dry, 16)); mp.film(FILM_MOSS, pick(dry, 40)); mp.film(FILM_RUBBLE, pick(dry, 12))
    mp.shadows()
    used = set(cliff) | stream | pool
    def P(name, x, y, anywhere=False):
        spec = uglib.PIECES[name]; w, h = spec[3], spec[4]
        cells = [(x + dx, y + dy) for dy in range(h) for dx in range(w)]
        foot = [(x + dx, y + h - 1) for dx in range(w)]
        if not anywhere and (any(c in used for c in cells) or any(c not in ledges for c in foot)): return False
        used.update(cells); mp.piece(name, x, y); return True
    P("most_poziomy", 24, 5, True)
    P("drabina", 9, 11, True)
    # the adit: one scene of the diggers' work
    P("wejscie_sztolni", 6, 2, True); P("kilof_oparty", 4, 3, True); K.lantern(mp, 8, 3); K.lantern(mp, 14, 3); K.lantern(mp, 26, 3); K.lantern(mp, 31, 3)
    for n, x, y in (("wozek_ruda", 8, 5), ("wozek_pusty", 10, 6), ("gruz_belka", 5, 5), ("rumowisko", 12, 4), ("beczka_rozbita", 14, 5), ("skrzynka_otwarta", 14, 7),
                    ("worki_stos", 15, 6), ("deska_lezaca", 11, 8), ("kamyki_br", 7, 7), ("stempel_t", 20, 5), ("deski_oparte", 3, 5), ("beczka", 17, 7),
                    ("skrzynka_pusta", 13, 8), ("gruz_szary", 15, 8)):
        P(n, x, y)
    K.brazier(mp, 21, 4, "Kosz przy moście")
    # across the bridge: a camp by the water
    K.brazier(mp, 30, 9, "Ognisko przy wodzie")
    for n, x, y in (("poslanie", 29, 9), ("poslanie", 31, 10), ("skrzynka_zamknieta", 30, 6), ("beczka", 31, 6), ("wiadro_puste", 32, 8), ("worki_stos", 29, 6), ("kilof_oparty", 36, 7)): P(n, x, y)
    # stalagmites out of the dark
    deep = sorted(c for c in hole if c not in cliff and not near(c, 2) and not near((c[0], c[1] - 2), 2) and (c[0], c[1] + 1) in hole and (c[0], c[1] - 3) in hole)
    n = 0
    for _ in range(40):                                   # in loose groups of two to four, never in a row
        if n >= 16 or not deep: break
        cx, cy = rnd.choice(deep)
        for k in range(rnd.randint(2, 4)):
            x, y = cx + rnd.randint(-2, 2), cy + rnd.randint(-2, 2)
            if (x, y) not in deep or any(abs(x - u[0]) < 2 and abs(y - 2 - u[1]) < 3 for u in used): continue
            if P(("stalagmit", "stalagmit2")[rnd.randint(0, 1)], x, y - 2, True): n += 1
    # crystals, fungi, ferns, rock: clusters on the lower ledges
    for n_, x, y in (("krysztaly_ziel", 4, 16), ("krysztal_ziel", 6, 18), ("krysztal_maly", 3, 18), ("krysztaly_nieb", 33, 23), ("krysztal_nieb", 35, 24), ("krysztal_maly", 31, 25),
                     ("skala_wysoka", 16, 16), ("kupa_skal", 12, 18), ("grzyb_duzy", 8, 17), ("grzyb_duzy2", 16, 18), ("stalagmity_male", 36, 11), ("skala_wysoka", 36, 9),
                     ("kupa_skal", 32, 11), ("grzyb_slup", 27, 22), ("kamien_plaski", 20, 22), ("stalagmit", 37, 12)):
        P(n_, x, y)
    small = ["grzybki", "grzybek", "paprocie", "mech_kepy", "kamien_okragly", "glaz_szary", "zarodniki", "kamien_plaski", "stalagmity_male"]
    spots = sorted(ledges - keepU); done = 0
    for _ in range(500):
        if done >= 26: break
        x, y = rnd.choice(spots)
        if P(rnd.choice(small), x, y): done += 1
    K.brazier(mp, 11, 16, "Ognisko kopaczy")
    return mp


if __name__ == "__main__":
    mp = build()
    j = mp.to_json(); text = W.map_text(j)
    ts, _ = K.read_db("data/Tilesets.json")
    img = uglib.render(json.loads(text), None, sheets=K.KSheets(ts[20]))
    img.convert("RGB").save(sys.argv[1]); print(img.size)
