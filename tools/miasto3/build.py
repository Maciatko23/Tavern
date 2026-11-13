# -*- coding: utf-8 -*-
"""Kruczogród (Map008) w stylu Fantastic Buildings: Medieval - budowa od zera, FAZA 1: zestaw 13, mur na krawędziach + 6 bram, trakt, uliczki,
grunt, taras zamkowy, dzielnica 1 "Wzgórze zamkowe" (tawerna, zajazd z przeniesioną stajnią, ogród rycerzy, schody zamkowe).
Pisze TYLKO do tools/miasto3/staging (data/Map008.json); stan wyjściowy = tools/miasto3/staging/base_Map008.json (kopia data/Map008.json z 2026-11-08).
  python tools/miasto3/kit.py && python tools/miasto3/build.py [--podglad]"""
import os, sys, json, copy, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mlib import *   # noqa: F401,F403
import mlib
from nslib import line_dist, noise, lowfreq

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

BASE = load(STAGING + "base_Map008.json")
OLD = {e["id"]: e for e in BASE["events"] if e}
L = Layers()
ALL = [(x, y) for y in range(H) for x in range(W)]
rnd = random.Random(8008)

# ------------------------------------------------------------------------------------------------ zdarzenia
KEEP = set()          # id zdarzeń zostających (nazwa, id i grafika bez zmian, miejsce wg przepięcia)
for i, e in OLD.items():
    nm = e["name"]
    cmds = [c for pg in e["pages"] for c in pg["list"] if c["code"] == 201]
    if nm.startswith("Miejsce:") or nm.startswith("Drzwi") or cmds or nm.startswith("Studnia miejska") or nm.startswith("Furtka ogrodu") or nm.startswith("Płyta w ścieżce"):
        KEEP.add(i)
KEEP |= {43, 44, 45, 20, 21, 30, 31, 148, 149, 150, 153, 155, 162, 163, 165, 167, 169, 170, 174, 181, 189, 190,
         142, 195, 196, 47, 49, 41, 42, 46, 101, 495, 496, 497, 499, 56, 81, 130, 205, 483, 220, 255, 256, 138, 272}   # posągi ogrodu rycerzy, rekwizyty tawerny, ogródek piwny
EV = {}               # id -> zdarzenie (słownik MZ)
MOVED = {}            # id -> (stare x, y, nowe x, y)


def keep(i, x=None, y=None, **kw):
    e = copy.deepcopy(OLD[i])
    if x is not None:
        MOVED[i] = (e["x"], e["y"], x, y)
        e["x"], e["y"] = x, y
    e.update(kw)
    EV[i] = e
    return e


_free = [i for i in range(1, 500) if i not in KEEP]


def new_id():
    return _free.pop(0)


def clone(tid, x, y, name=None, note=None, **img):
    """nowe zdarzenie wg wzoru ze starej Map008 (grafika, notatka, strony); image: nadpisuje pola obrazu pierwszej strony"""
    e = copy.deepcopy(OLD[tid])
    e["id"] = new_id()
    e["x"], e["y"] = x, y
    if name is not None: e["name"] = name
    if note is not None: e["note"] = note
    for pg in e["pages"]:
        pg["image"].update(img)
    EV[e["id"]] = e
    return e


TAKEN = set()         # kratki zajęte przez zdarzenia (do rozmieszczania ozdób)


def tree(kind, x, y, name=None):
    if kind in ("small", "pine_a", "pine_b", "big_g", "big_s") and y < 96 and not (3 <= x <= 16 and 17 <= y <= 31): kind = "pear" if (x + y) % 3 else "apple"   # w murach: tylko drzewa liściaste i owocowe
    t = {"pine_a": 2, "pine_b": 1, "small": 5, "big_s": 55, "big_g": 78, "apple": 67, "pear": 151}[kind]
    return clone(t, x, y, name=name or "Drzewo")


# ------------------------------------------------------------------------------------------------ pomocnicze kształty
def smooth(points, n=8):
    """Catmull-Rom przez punkty -> gęsta łamana"""
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * ((2 * p1[a]) + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t * t + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t ** 3) for a in (0, 1)))
    out.append(points[-1])
    return out


def band(points, width, wobble=0.0, seed=1, inner=True):
    """kratki w odległości <= width/2 od gładkiej krzywej; wobble: lekkie falowanie brzegu"""
    pts = smooth(points)
    cells = set()
    for (x, y) in ALL:
        if inner and not (2 <= x <= 117 and 4 <= y <= 115): continue
        d = line_dist(x + 0.5, y + 0.5, pts)
        r = width / 2 + wobble * (lowfreq(x, y, seed, 5.0) - 0.5) * 2
        if d <= r: cells.add((x, y))
    return cells


def rectc(x0, y0, x1, y1):
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}


def blobc(cx, cy, rx, ry, seed, rough=0.3):
    return {(x, y) for (x, y) in ALL if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + rough * (noise(x, y, seed) - 0.5) * 2}


# ------------------------------------------------------------------------------------------------ grunt
def ground():
    L.kind(0, ALL, 16)
    # miękkie plamy trawy innego odcienia i kwiaty - poza drogami (dopiero po nich odejmujemy)


# ------------------------------------------------------------------------------------------------ mur
def kafel(key, i, j): return UK[key]["kafle"][j][i]


def hwall_cell(x, y0, key="mur_h"):
    n = UK[key]["h"]
    for j in range(n): L.tile(2, x, y0 + j, kafel(key, x % 2, j))


def hwall(y0, x0, x1, towers=(), gaps=(), lintel_gaps=(), key="mur_h", tkey="wieza", tw=2):
    """mur poziomy w wierszach y0.. od x0 do x1 (włącznie); towers: lewe x baszt (2 szer.); gaps: otwarte przedziały (a, b); lintel: nadproże w gap"""
    tset = set()
    for t in towers:
        L.put(tkey, t, y0)
        tset |= {t, t + 1}
    gset = set()
    for a, b in gaps: gset |= set(range(a, b + 1))
    for x in range(x0, x1 + 1):
        if x in tset: continue
        if x in gset:
            if (x, "l") in lintel_gaps or any(a <= x <= b for a, b in lintel_gaps if isinstance(a, int)):
                for j in range(2): L.tile(2, x, y0 + j, kafel("mur_nadproze", x % 2, j))
            continue
        hwall_cell(x, y0, key)


VROWS = [8, 9, 10, 11, 12]


def vwall(x0, y0, y1, towers=(), top="mid", bottom="mid"):
    """mur pionowy 2 kolumny od y0 do y1 (włącznie): top/bottom: 'mid' (jak środek), 'cap' (zwieńczenie baszty u góry), 'tower' (front baszty u dołu);
    towers: y, w których wstawiamy przerwę z basztą (dol + gora = 5 rzędów, środek w y)"""
    cells = {}
    ys = list(range(y0, y1 + 1))
    seq = []
    k = 0
    skip_to = -1
    for y in ys:
        seq.append(("v", VROWS[(y - y0) % 5]))
    # nadpisania: wieże wewnątrz
    for t in towers:
        for dy, r in zip(range(-2, 3), (13, 14, 15, 6, 7)):
            yy = t + dy
            if y0 <= yy <= y1: seq[yy - y0] = ("v", r)
    if top == "cap":
        for dy, r in enumerate((6, 7)):
            if y0 + dy <= y1: seq[dy] = ("v", r)
    if bottom == "tower":
        for dy, r in zip((-2, -1, 0), (13, 14, 15)):
            if y1 + dy >= y0: seq[y1 + dy - y0] = ("v", r)
    for y, (_, r) in zip(ys, seq):
        for i, tx in enumerate((x0, x0 + 1)):
            L.tile(2, tx, y, vtile(r, i))


def vtile(row, i):
    """kafel mur_v dla wiersza paczki row (6..15) i kolumny i (0, 1)"""
    for key, rws in (("mur_v_gora", (6, 7)), ("mur_v", (8, 9, 10, 11, 12)), ("mur_v_dol", (13, 14, 15))):
        if row in rws: return UK[key]["kafle"][rws.index(row)][i]
    raise KeyError(row)


# bramy: (strona, od, do) kratki otwarte
GATES = {"N": [(22, 25)], "S": [(30, 33)], "W": [(50, 51), (104, 107)], "E": [(10, 12), (48, 50)]}
GATE_NAMES = {("N", 24): "Brama Dworska", ("W", 50): "Brama Zachodnia", ("W", 104): "Brama Rybacka", ("E", 10): "Brama Wschodnia", ("E", 48): "Brama Łąkowa", ("S", 30): "Brama Południowa"}


def town_wall():
    # wieże: narożniki, flanki bram, co kilkanaście kratek
    nt = [0, 118, 20, 26, 8, 40, 54, 68, 82, 96, 108]
    st = [0, 118, 28, 34, 12, 46, 60, 74, 88, 102]
    hwall(0, 2, 117, towers=[t for t in nt], gaps=[(22, 25)], lintel_gaps=[(22, 25)])
    hwall(116, 2, 117, towers=[t for t in st], gaps=[(30, 33)], lintel_gaps=[(30, 33)])
    # pionowe: W (x 0-1) i E (x 118-119) od y4 do y115; luki bram
    for x0, gaps in ((0, [(50, 51), (104, 107)]), (118, [(10, 12), (48, 50)])):
        segs, y = [], 4
        for a, b in gaps:
            segs.append((y, a - 1, "cap" if y > 4 else "mid", "tower"))
            y = b + 1
        segs.append((y, 115, "cap", "mid"))
        for (ya, yb, top, bot) in segs:
            tw = [t for t in range(ya + 14, yb - 8, 15)]
            vwall(x0, ya, yb, towers=tw, top=top, bottom=bot)


# ------------------------------------------------------------------------------------------------ drogi
ROADS = {
    "wsch_zach": [(1, 51), (12, 51), (22, 50), (36, 50), (51, 50), (72, 50), (96, 50), (106, 49), (117, 49)],
    "pn_pld": [(31.5, 116), (33, 108), (38, 101), (47, 92), (51, 82), (52, 66), (51.5, 50), (51.5, 38), (51, 32), (51, 18)],
    "rybacka": [(1, 105.5), (14, 104), (24, 106), (32, 109)],
    "ne": [(117, 11), (100, 12), (92, 14), (80, 14), (72, 14)],
    "dwor": [(23.5, 4), (23.5, 10), (24.5, 15), (28.5, 19), (38, 22), (46, 22), (50, 22)],
}
LANES = [[(8, 30), (12, 40), (9, 52), (13, 62), (10, 75), (7, 88)],
         [(20, 33), (24, 45), (21, 58), (26, 72), (33, 86)],
         [(36, 72), (44, 76), (52, 74), (60, 76), (70, 73), (80, 76), (95, 75)],
         [(30, 88), (40, 90), (48, 88), (60, 91), (72, 88), (85, 90), (96, 88)],
         [(84, 14), (88, 22), (85, 31), (90, 40), (85, 48)],
         [(84, 52), (88, 58), (84, 64), (95, 64)]]


def roads_and_lanes():
    road = set()
    for k, pts in ROADS.items():
        w = 4 if k in ("pn_pld",) else 3
        road |= band(pts, w, wobble=0.08, seed=hash(k) & 0xffff)
    lane = set()
    for pts in LANES: lane |= band(pts, 2.4, wobble=0.35, seed=99)
    return road, lane




# ------------------------------------------------------------------------------------------------ dzielnica 1: Wzgórze zamkowe
A5 = lambda c, r: 1536 + r * 8 + c
PAVE = 42          # bruk dziedzińca (cegła piaskowa, pasuje do ciepłego kamienia paczki)
ROAD = 19          # trakt: okrągły bruk z trawiastym brzegiem
LANE = 17          # uliczki: ubita ziemia z trawiastym brzegiem
YARD = 17


def castle():
    # południowy mur zamku y29-32, x28-81; brama 49-53 (5 szerokości, oś 51); baszty: końce, flanki bramy, środki
    hwall(29, 28, 79, towers=[28, 38, 47, 54, 66, 78], gaps=[(49, 53)], lintel_gaps=[(49, 53)])
    # wschodni mur zamku x80-81 od y4 do y28 z bramą zajazdu y13-15
    vwall(80, 4, 12, towers=[], top="mid", bottom="tower")
    vwall(80, 16, 28, towers=[22], top="cap", bottom="mid")
    L.put("wieza", 80, 29)
    # schody z tarasu na rynek: własne kamienne (kit.py "schody"), 5 szerokości, y33-34; brama zamku wybrukowana
    for j, y in enumerate((33, 34)):
        for i, x in enumerate(range(49, 54)):
            L.tile(1, x, y, kafel("schody", 0 if i == 0 else 2 if i == 4 else 1, j))
    L.kind(1, rectc(49, 29, 53, 32), PAVE)


def garden():
    # ogród rycerzy x29-37, y4-13; wejście furtką (33,16); mur: wschód x38-39 (2 szer.), południe y14-16 z furtką x32-34, zachód: żywopłot x28
    vwall(38, 4, 16, towers=[], top="mid", bottom="tower")
    vwall(27, 4, 16, towers=[], top="mid", bottom="tower")
    for x in range(29, 38):
        if 32 <= x <= 34:
            L.tile(2, x, 14, kafel("mur_nadproze", x % 2, 1))
            continue
        for j in range(3): L.tile(2, x, 14 + j, kafel("mur_h3", x % 2, j))
    L.region.update({(x, 14): 3 for x in (32, 33, 34)})
    # ścieżka od furtki do posągów i płyta; trawnik z kwietnikami
    path = rectc(32, 9, 34, 16) | rectc(31, 10, 35, 11) | rectc(30, 8, 36, 8)
    L.kind(1, path - {(x, 14) for x in (32, 33, 34)}, PAVE)
    L.kind(1, {(33, 12)}, 43)
    for cx, cy in ((30, 5), (36, 5), (30, 12), (36, 12)):
        L.kind(1, blobc(cx, cy, 1.9, 1.5, cx * 7 + cy, 0.6) & rectc(29, 4, 37, 13) - path, 28)


SDOOR = (69, 8)       # drzwi stajni (zajazd): wyjścia z Map181 lądują w (69, 9)
TABLES = [(56, 23), (60, 23), (58, 26)]


def tavern():
    for y in range(11, 17): L.kind(0, [(49, y), (53, y)], 35)      # ciemny kamień pod szczelinami między gildią a skrzydłami (nie wyżej: dach)
    L.kind(0, rectc(50, 16, 52, 16), 35)
    L.put("gildia", 51, 16, anchor="door")
    L.put("kamienica", 43, 8)
    L.put("kamienica", 54, 8)
    # przed drzwiami: miękki plac z okrągłego bruku (brzeg w trawie), stopień z cegły, aleja do bramy zamku (3 szerokości)
    L.kind(0, blobc(51, 18.3, 8.5, 1.6, 12, 0.35) | rectc(49, 16, 53, 16), ROAD)
    L.kind(1, rectc(49, 17, 53, 18) | rectc(50, 19, 52, 28), PAVE)
    # ścieżka od alei do zajazdu (wschód): bruk okrągły z trawiastym brzegiem
    L.kind(0, band([(53.5, 20.5), (57, 19.2), (60, 16), (62.5, 13.8)], 2.2, 0.1, 41), ROAD)


def inn_yard():
    """podwórze zajazdu: stajnia i wozownia wzdłuż północy, wspólne podwórze z ubitej ziemi (wiersze 9-18), zagroda z trawą na południu, płot z bramami"""
    L.put("stajnia", 63, 5)
    L.put("wozownia", 71, 4)
    yard = blobc(71, 13.5, 8.6, 4.8, 31, 0.4) & rectc(63, 9, 79, 18)
    L.kind(0, yard | band([(62, 13.5), (66, 13.5), (72, 13.5)], 2.4, 0.15, 7) | band([(72, 14), (79, 14)], 3, 0.15, 8), YARD)
    fence = {(62, y) for y in range(5, 27) if y not in (13, 14)} | {(x, 26) for x in range(62, 80)} | {(79, y) for y in range(9, 13)} | {(79, y) for y in range(16, 26)}
    fence |= {(x, 19) for x in range(63, 79) if x not in (70, 71)}      # płot między podwórzem a zagrodą (brama x70-71)
    L.kind(1, fence, 22)
    L.kind(0, blobc(58, 25, 4.6, 3.6, 33, 0.45) & rectc(54, 21, 62, 28), 32)
    L.put("beczki", 65, 10); L.put("beczki", 75, 15)


def herb_garden():
    L.put("kratki", 35, 25)


def places_and_events():
    for i in KEEP: keep(i)
    for i in (22, 209):
        for pg in EV[i]["pages"]: pg["image"].update({"characterName": "", "tileId": 0})
    keep(209, SDOOR[0], SDOOR[1]); keep(446, SDOOR[0], SDOOR[1] + 1)
    keep(415, 70, 12)
    keep(323, 116, 49); keep(324, 31, 114); keep(412, 32, 114)
    for i in (332, 334, 343, 344): keep(i, OLD[i]["x"] - 10, OLD[i]["y"] + 22)
    keep(275, 58, 28)                                     # staw (praca woziwody): teraz w ogródku piwnym
    # ogródek piwny: stoły w łuku, ławy, beczki wokół słupa z latarnią, donice z kwiatami
    keep(150, *TABLES[0]); keep(165, *TABLES[1]); clone(150, *TABLES[2], name="Stół w ogródku piwnym")
    for i in (153, 155, 167, 169, 170, 174, 181, 162, 163, 190): EV.pop(i, None)
    for (x, y) in TABLES:
        clone(153, x, y - 1, name="Ława", direction=2, pattern=0); clone(153, x, y + 1, name="Ława", direction=2, pattern=0)
    clone(48, 58, 24, name="Latarnia")
    for (x, y) in ((57, 24), (59, 24), (58, 23)): clone(190, x, y, name="Beczka")
    keep(189, 69, 20)
    for (x, y) in ((54, 22), (62, 22), (54, 26)):
        clone(71, x, y, name="Donica z kwiatami", characterName="!Tavern_Yard", characterIndex=3, direction=2, pattern=0)
    tree("pear", 54, 28); tree("small", 61, 27)
    # tawerna: posągi, banery, donice z kwiatami przy drzwiach (zamiast turkusowych krzewów)
    keep(20, 45, 18); keep(21, 57, 18); keep(30, 53, 17); keep(31, 49, 17)
    for x in (50, 52): clone(71, x, 19, name="Donica z kwiatami", characterName="!Tavern_Yard", characterIndex=3, direction=2, pattern=0)
    keep(148, 31, 18)
    # podwórze stajenne: stogi, wozy, skrzynie, worki, beczki, poręcze do koni, latarnie
    clone(190, 77, 11, name="Stóg siana", note="<Occupy:left=1,right=1>", characterName="!Tavern_Yard", characterIndex=2, direction=4, pattern=2)
    clone(190, 77, 16, name="Stóg siana", note="<Occupy:left=1,right=1>", characterName="!Tavern_Yard", characterIndex=2, direction=4, pattern=2)
    keep(149, 67, 15); clone(272, 74, 12, name="Wóz z sianem"); clone(272, 72, 17, name="Wóz z sianem")
    clone(190, 66, 12, name="Skrzynie i beczka", characterName="!Tavern_Yard", characterIndex=1, direction=2, pattern=0)
    clone(190, 68, 17, name="Worki", characterName="!Tavern_Yard", characterIndex=1, direction=8, pattern=0)
    clone(190, 79, 13, name="Worki", characterName="!Tavern_Yard", characterIndex=1, direction=8, pattern=1)
    clone(189, 64, 17, name="Beczki piwa")
    clone(190, 78, 18, name="Beczka"); clone(190, 63, 12, name="Beczka")
    clone(148, 66, 10, name="Poręcz do wiązania koni"); clone(148, 73, 10, name="Poręcz do wiązania koni"); clone(148, 65, 15, name="Poręcz do wiązania koni")
    for (x, y) in ((79, 17), (62, 15), (67, 12)): clone(48, x, y, name="Latarnia")
    # dziedziniec: grupy drzew z przerwami, ławki, rabaty, beczki i skrzynie przy bokach tawerny, latarnie przy ścieżkach (nie w siatce)
    for (k, x, y) in (("big_g", 33, 26), ("pine_b", 31, 23), ("pear", 43, 26), ("small", 46, 25), ("pine_a", 41, 28), 
                      ("small", 40, 5), ("small", 61, 6), ("apple", 40, 8), ("pear", 60, 5), ("pear", 41, 14), ("apple", 38, 19)):
        tree(k, x, y)
    for (x, y) in ((53, 21), (48, 24), (54, 26), (41, 21), (60, 18), (35, 19), (47, 27)): clone(48, x, y, name="Latarnia")
    for (x, y) in ((46, 23), (56, 23), (36, 21)): clone(153, x, y, name="Ławka", direction=2, pattern=0)
    clone(189, 41, 16, name="Beczki"); clone(190, 60, 14, name="Skrzynie i beczka", characterName="!Tavern_Yard", characterIndex=1, direction=2, pattern=0)
    clone(190, 42, 10, name="Skrzynie", characterName="!Tavern_Yard", characterIndex=1, direction=4, pattern=0)
    L.kind(1, blobc(47, 27.6, 2.2, 0.8, 5, 0.2) | blobc(33, 28, 1.8, 0.7, 6, 0.2) | blobc(39, 20.5, 1.2, 0.8, 9, 0.2), 28)
    # okna tawerny świecą nocą
    for (x, y) in ((45, 12), (47, 12), (45, 14), (47, 14), (55, 12), (57, 12), (55, 14), (57, 14), (51, 12), (51, 14)):
        clone(327, x, y, name="Okno tawerny (światło)", note="<Light:210,150,70,26><LightWhen:night>")


def gate_floor():
    for side, gl in GATES.items():
        for a, b in gl:
            if side in "NS":
                y0, y1 = (0, 3) if side == "N" else (116, 119)
                L.kind(0, rectc(a, y0, b, y1), ROAD)
            else:
                x0, x1 = (0, 1) if side == "W" else (118, 119)
                L.kind(0, rectc(x0, a, x1, b), ROAD)


def wild():
    """plamy wysokiej trawy i kwiatów na trawnikach poza drogami (miękkie, nie w rzędach)"""
    r = random.Random(5)
    for k in range(70):
        cx, cy = r.uniform(3, 116), r.uniform(5, 114)
        L.kind(1, blobc(cx, cy, r.uniform(1.2, 2.6), r.uniform(0.9, 1.7), r.randrange(1 << 30), 0.4), r.choice((21, 21, 28, 29)))


def finish():
    # kratki, na których nic nie ma rysować się trawą/kwiatami: drogi, bruk, mury, budynki
    n = [dict(l) for l in L.L]
    busy = set(L.L[2]) | set(L.L[3])
    for c in list(L.L[1]):
        k = L.L[1][c]
        if k in (("k", 21), ("k", 28), ("k", 29)) and (c in busy or L.L[0].get(c) in (("k", ROAD), ("k", LANE)) or c in PAVED): L.L[1].pop(c)


PAVED = set()


import phase2


def build():
    ground()
    r0 = random.Random(27)
    for k in range(26):
        L.kind(0, blobc(r0.uniform(4, 116), r0.uniform(6, 112), r0.uniform(2.5, 5), r0.uniform(2, 3.5), r0.randrange(1 << 30), 0.5), 27)
    road, lane = roads_and_lanes()
    L.kind(0, lane - road, LANE)
    L.kind(0, road, ROAD)
    gate_floor()
    wild()
    plaza = rectc(30, 35, 73, 64)
    L.kind(1, plaza, PAVE)
    town_wall()
    castle()
    garden()
    tavern()
    inn_yard()
    herb_garden()
    phase2.run(sys.modules[__name__], road, lane)
    for c, k in list(L.L[1].items()):
        if k[0] == "k" and k[1] == PAVE: PAVED.add(c)
    # (kwiaty i trawa wysoka nie wchodzą na bruk, drogi ani pod budynki)
    for c in list(L.L[1]):
        k = L.L[1][c]
        if k in (("k", 21), ("k", 28), ("k", 29)):
            if c in PAVED or c in L.L[2] or L.L[0].get(c) in (("k", ROAD), ("k", LANE), ("k", YARD)): L.L[1].pop(c)
    places_and_events()
    phase2.events(sys.modules[__name__])
    old31 = set(getattr(sys.modules[__name__], 'SQUARE_CELLS', set()))
    for c in old31: L.region[c] = 31
    data = L.resolve()
    evs = [None] * (max(EV) + 1)
    for i, e in EV.items(): evs[i] = {"id": i, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": e["x"], "y": e["y"]}
    props = {k: v for k, v in BASE.items() if k not in ("data", "events")}
    props["tilesetId"] = 13
    write_map(STAGING + "data/Map008.json", props, data, evs)
    return data, evs


def preview(out, region=None, scale=1.0, marks=True):
    raw = load(STAGING + "data/Map008.json")
    mp = mapa_z(raw)
    return mapylib.render(mp, region=region, scale=scale)


if __name__ == "__main__":
    build()
    print("zapisano", STAGING + "data/Map008.json", "zdarzeń:", len(EV))
    if "--podglad" in sys.argv:
        preview(None, region=(26, 0, 84, 36), scale=0.5).convert("RGB").save(ROOT + "tools/miasto3/_pod/p1.png")
        preview(None, scale=0.1).convert("RGB").save(ROOT + "tools/miasto3/_pod/p_all.png")


def stable_interior():
    """Map181 (staging): wyjścia -> (74,8), znaczniki stryszku i tablicy zmian"""
    m = load(ROOT + "data/Map181.json")
    for e in m["events"]:
        if not e: continue
        for pg in e["pages"]:
            for c in pg["list"]:
                if c["code"] == 201 and c["parameters"][1] == 8:
                    c["parameters"][2], c["parameters"][3] = SDOOR[0], SDOOR[1] + 1
    tmpl = next(e for e in m["events"] if e and e["name"] == "Miejsce: kolodziej_wnetrze")
    ids = [i for i in range(1, 100) if i >= len(m["events"]) or not m["events"][i]]
    for nm, x, y in (("stryszek", 13, 3), ("stajnia_zmiana", 9, 3)):
        e = copy.deepcopy(tmpl); i = ids.pop(0)
        e["id"], e["name"], e["x"], e["y"] = i, "Miejsce: " + nm, x, y
        while len(m["events"]) <= i: m["events"].append(None)
        m["events"][i] = e
    write_map(STAGING + "data/Map181.json", {k: v for k, v in m.items() if k not in ("data", "events")}, m["data"], m["events"])


if __name__ == "__main__":
    stable_interior()
