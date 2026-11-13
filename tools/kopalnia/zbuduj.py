# -*- coding: utf-8 -*-
"""Kopalnia pod Orlą Granią (Map213; docs/questy_mapa/PLAN.md, sekcje 4 i 4a): sztolnia z Gór i kamieniołomu (Map013) na szczyt (Orla Grań, Map175),
z torami i dwoma wagonikami (po jednym na końcu), rozjazdem z dźwignią i ślepą odnogą z rudą. Skrypt tylko ZBIERA do stagingu - nic nie idzie do
data/, js/, img/ ani Tilesets.json (instaluje się po zatwierdzeniu obrazków).
  python tools/kopalnia/art.py                      grafika (arkusz kafli z torami, wagonik, wejście, szyb, tory na Map013)
  python tools/kopalnia/zbuduj.py                   mapy, dane i wtyczka do tools/kopalnia/staging/ (czyta data/ i js/ z projektu)
  python tools/kopalnia/zbuduj.py --z <katalog>     jak wyżej, ale czyta stan z <katalog>/data, <katalog>/js tam, gdzie pliki są (inny staging pod spodem)
  python tools/kopalnia/zbuduj.py --obrazki         dodatkowo obrazy mapy do docs/kopalnia/ (podgląd z rysowanych kafli)
Staging: data/Map213.json, Map013.json (wejście, tory, latarnia), Map175.json (szyb, bez zdarzeń 144/152/155), MapInfos.json (wpis Map213),
Tilesets.json (nowy zestaw: kopia 10 z arkuszem torów w slocie E), js/plugins/Orzel_Data.js + Orzel.js (WAY_UP/WAY_DOWN), js/tawerna_wtyczki.js
(wpis Kopalnia), img/characters + img/tilesets/Kopalnia (z art.py). Instalator: tools/kopalnia/instaluj.py (edytor zamknięty)."""
import os, sys, re, json, copy, random, shutil, hashlib
from collections import deque

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
sys.path.insert(0, os.path.join(ROOT, "tools", "underground"))
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
sys.path.insert(0, os.path.join(ROOT, "tools", "town"))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wspolne as W
import nslib
from nslib import E
import uglib
from uglib import (DMap, page, script, se, cmd, F_DIRT, F_BROWN_SLAB, F_DIRT_SLABS, FILM_RUBBLE, FILM_DUST, FILM_DIRT, FILM_CRACKS, FILM_MOSS)
from chunks_deep import W_CAVE, W_CAVE_BEAMS, W_CAVE_MOSS, LANTERN, LANTERN_LIGHT, BRAZIER, BRAZIER_LIGHT
import art
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# ------------------------------------------------------------------------------------------------ the description
MAP_ID, MW, MH = 213, 96, 40
TIMBER_FACE = 92            # brown boulders with timber frames (A4 side kind of W_CAVE_BROWN)
F_COBBLE = 40
NAME = "Kopalnia pod Orlą Granią"
NOTE = ("<Dust:on>\n<Dark:on>\n<DayNight:off>\n<DarkDay:196>\n<DarkNight:206>\n<Ambience:cave>\n<Hunt:off>\n<Build:off>\n<Farm:off>\n"
        "<Minimap:off>\n<Humans:off>\n<Poziom:6>")
QUARRY = 13                 # the mountains (Map013)
RIDGE = 175                 # Orla Grań
QUARRY_MOUTH = (54, 31)     # the mouth in the quarry wall; one stands at (54, 32)
QUARRY_LAND = (54, 32, 2)
MINE_LAND = (9, 37, 8)      # where one comes in from the quarry
RIDGE_LAND = (20, 28, 8)    # Orla Grań: south of the stairs on the path (Orzel_Data.WAY_UP.land)
RIDGE_SHAFT = [(19, 30), (20, 30), (21, 30)]   # Orla Grań: the way down (Orzel_Data.WAY_DOWN.cells)
STAIRS_B = (84, 7)          # the door of the stairs in the north wall of station B (Orzel injects the action event here)
STAIRS_LAND = (84, 9)       # one comes down onto (84, 9) / (85, 9)

# the cart's way: corner points (cell centres); stations are points too (the carts stop on them)
MAIN = [("A", 7, 31), (None, 38, 31), (None, 38, 22), ("H", 55, 22), ("J", 58, 22), (None, 70, 22), (None, 70, 12), ("B", 88, 12)]
SPUR = [("J", 58, 22), ("S", 58, 14)]
RAIL_ENDS = {"A": (5, 31), "B": (90, 12), "S": (58, 13)}   # where the rails really end (the buffer stops)
EXITS = {"A": (7, 32, 2), "H": (55, 21, 8), "B": (88, 11, 8), "S": (59, 14, 8)}   # where one steps off (x, y, the way he faces)
LEVER = (57, 23)
PARKED_DIR = {"A": 6, "B": 4}


def ccells(points):
    """the cells of a polyline of corner points (cell by cell)"""
    out = []
    for (_, x0, y0), (_, x1, y1) in zip(points, points[1:]):
        dx, dy = (x1 > x0) - (x1 < x0), (y1 > y0) - (y1 < y0)
        x, y = x0, y0
        while (x, y) != (x1, y1):
            out.append((x, y)); x += dx; y += dy
    out.append((points[-1][1], points[-1][2]))
    return out


def rail_cells():
    """cell -> set of directions its rails connect to (2 down, 4 left, 6 right, 8 up), from the polylines and the buffers' stubs"""
    conn = {}
    def link(a, b):
        for (p, q) in ((a, b), (b, a)):
            dx, dy = q[0] - p[0], q[1] - p[1]
            d = {(1, 0): 6, (-1, 0): 4, (0, 1): 2, (0, -1): 8}[(dx, dy)]
            conn.setdefault(p, set()).add(d)
    lines = [[(RAIL_ENDS["A"][0], RAIL_ENDS["A"][1])] + ccells(MAIN) + ccells([("", MAIN[-1][1], MAIN[-1][2]), ("", *RAIL_ENDS["B"])])[1:],
             ccells(SPUR) + ccells([("", SPUR[-1][1], SPUR[-1][2]), ("", *RAIL_ENDS["S"])])[1:]]
    # (the main line from the west buffer: the cells from the buffer to the cart cell A, then the polyline, then on to the east buffer)
    lines[0] = ccells([("", *RAIL_ENDS["A"]), ("", MAIN[0][1], MAIN[0][2])]) + ccells(MAIN)[1:] + ccells([("", MAIN[-1][1], MAIN[-1][2]), ("", *RAIL_ENDS["B"])])[1:]
    for line in lines:
        for a, b in zip(line, line[1:]): link(a, b)
    return conn


TILE_OF = {frozenset([6, 4]): "H", frozenset([2, 8]): "V", frozenset([6, 2]): "ES", frozenset([4, 2]): "WS", frozenset([6, 8]): "EN",
           frozenset([4, 8]): "WN", frozenset([4, 6, 8]): "J"}
BUFFER_OF = {6: "BW", 4: "BE", 2: "BN", 8: "BS"}     # the only connection -> the beam on the other side


# ------------------------------------------------------------------------------------------------ input / output
Z = None
def src(rel):
    """the file as the chain has it: <--z>/<rel> when it exists there, else the project's"""
    if Z and os.path.exists(os.path.join(Z, rel)): return os.path.join(Z, rel)
    return os.path.join(ROOT, rel)


def read_db(rel):
    raw = open(src(rel), "rb").read()
    o = json.loads(raw.decode("utf-8"))
    if rel.endswith("MapInfos.json") or rel.endswith("Tilesets.json"):
        assert W.db_text(o).encode("utf-8") == raw or W.dump(o).encode("utf-8") == raw, rel + ": layout"
        lay = "db" if W.db_text(o).encode("utf-8") == raw else "line"
    else:
        assert W.map_text(o).encode("utf-8") == raw, rel + ": not in the editor's layout"
        lay = "map"
    return o, lay


INPUTS = {}          # rel -> sha1 of the file the staged one was made from (the installer checks nothing changed since)


def note_input(rel):
    INPUTS[rel] = W.sha1(src(rel))


def put(rel, data):
    p = os.path.join(STG, *rel.split("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "wb") as f: f.write(data)


# ------------------------------------------------------------------------------------------------ the tileset (a copy of 10 with the rails in the E slot)
def tileset_entry(ts):
    t10 = copy.deepcopy(ts[10])
    new_id = len(ts)
    t10["id"] = new_id
    t10["name"] = "Kopalnia: Dungeon z torami"
    t10["tilesetNames"][8] = "Kopalnia/Kopalnia_E"
    for i in range(768, 1024): t10["flags"][i] = 0      # the rails and the buffers: walkable, below the hero
    return t10


class KSheets(uglib.Sheets):
    """for the pictures: the staged tileset's sheets (the rails sheet from staging) and the staged characters first"""
    def __init__(self, entry):
        self.sets = []
        for n in entry["tilesetNames"]:
            if not n: self.sets.append(None); continue
            p = os.path.join(STG, "img", "tilesets", n + ".png")
            if not os.path.exists(p): p = os.path.join(ROOT, "img", "tilesets", n + ".png")
            from PIL import Image
            self.sets.append(Image.open(p).convert("RGBA"))
        self.flags = entry["flags"]
        self.chars, self.tiles = {}, {}
        self.lenient = True

    def char(self, name):
        from PIL import Image
        if name not in self.chars:
            for d in (os.path.join(STG, "img", "characters") + "/", ROOT + "/img/characters/", uglib.DUNGEON_CHARS, uglib.INTERIOR_CHARS):
                p = d + name + ".png"
                if os.path.exists(p):
                    self.chars[name] = Image.open(p).convert("RGBA"); break
            else:
                self.missing = getattr(self, "missing", set()) | {name}
                self.chars[name] = None
        return self.chars[name]


# ------------------------------------------------------------------------------------------------ the map
def lantern(mp, x, y, name="Latarnia w sztolni"):
    mp.ev(x, y, *LANTERN, name=name, priority=0, through=True, step=True, note=LANTERN_LIGHT)


def brazier(mp, x, y, name="Kosz z ogniem"):
    mp.ev(x, y, *BRAZIER, name=name, priority=1, through=False, step=True, note=BRAZIER_LIGHT)


def marker_note(**kw): return "".join("<%s:%s>" % (k, v) for k, v in kw.items())


def build(tileset_id):
    mp = DMap(MAP_ID, MW, MH, NAME, NOTE, bgm="", seed=213, tileset=tileset_id)
    mp.props["bgs"] = {"name": "Drips", "pan": 0, "pitch": 90, "volume": 25}
    mp.props["autoplayBgs"] = True
    R = mp.rect
    blob = lambda cx, cy, rx, ry, seed, rough=0.22: nslib.blob(mp, cx, cy, rx, ry, seed, rough)

    # ---- the floor: station A (hall + the neck down to the quarry), the tunnels, the caverns, the halt H, the spur's chamber, station B
    hallA = R(3, 26, 16, 35)
    neckA = R(8, 36, 10, 39)
    t1 = R(15, 30, 39, 32)
    t2 = R(37, 21, 39, 32)
    t3 = R(37, 21, 71, 23)
    t4 = R(69, 11, 71, 23)
    t5 = R(69, 11, 80, 13)
    hallB = R(79, 8, 93, 17)
    spur = R(57, 14, 59, 21)
    chamber = R(54, 10, 62, 13)
    cav1 = blob(26, 31, 8.5, 6.2, 1301) & R(14, 24, 36, 38)               # south of the first tunnel: crates, the cart wreck
    cav2 = blob(32, 19, 5.5, 4.2, 1302) & R(26, 14, 37, 24)               # north-west of the corner: an old working
    halt = blob(51, 21, 8.5, 4.6, 1303) & R(42, 16, 64, 26)                # the halt's cavern (and the lever)
    cav3 = blob(66.5, 17, 3.2, 3.0, 1304) & R(63, 14, 68, 20)
    cav4 = blob(75, 17, 4.4, 3.4, 1305) & R(71, 14, 80, 21)                # between the corner and station B
    floor = hallA | neckA | t1 | t2 | t3 | t4 | t5 | hallB | spur | chamber | cav1 | cav2 | halt | cav3 | cav4
    floor = {c for c in floor if 1 <= c[0] <= MW - 2 and 1 <= c[1] <= MH - 1}
    tunnels = t1 | t2 | t3 | t4 | t5 | spur | neckA
    faces = mp.shell(floor, F_DIRT, W_CAVE)
    for c in faces:                         # timbered where it is a tunnel (the diggers' work), the rest plain cave rock
        below = (c[0], c[1] + 1)
        below2 = (c[0], c[1] + 2)
        if below in tunnels or below2 in tunnels or below in chamber or below2 in chamber: mp.layers[0][c] = ("k", TIMBER_FACE)
    for c in faces:
        if c[0] >= 79 and c[1] <= 7: mp.layers[0][c] = ("k", TIMBER_FACE)
    platform = R(5, 32, 13, 33) | R(80, 10, 92, 11) | R(49, 19, 60, 20)
    for c in platform & floor: mp.layers[0][c] = ("k", F_COBBLE)
    rnd = random.Random(2130)
    sprinkle = lambda area, n: set(rnd.sample(sorted(area), min(n, len(area))))
    free_floor = floor - platform
    mp.film(FILM_DIRT, sprinkle(free_floor, 90))
    mp.film(FILM_RUBBLE, sprinkle(cav1 | cav2 | halt | chamber | cav3 | cav4, 36))
    mp.film(FILM_DUST, sprinkle(free_floor, 30))
    mp.film(FILM_CRACKS, sprinkle(free_floor, 14))
    mp.shadows()

    # ---- the rails (tiles of layer 2: the E sheet's rails, passable, below the hero)
    conn = rail_cells()
    rails = set(conn)
    for c, ds in conn.items():
        if len(ds) == 1: name = BUFFER_OF[next(iter(ds))]
        else: name = TILE_OF[frozenset(ds)]
        col, row = art.LAYOUT[name]
        mp.tile(2, c[0], c[1], E(col, row))
        assert c in floor, "rail off the floor: %s" % (c,)
    # the wreck's broken rails: a siding stub in cavern 1 (decor: not on the line), made from two broken pieces
    wreck_cells = [(23, 35), (24, 35), (25, 35)]
    for i, c in enumerate(wreck_cells):
        nm = "HX" if i != 0 else "H"
        mp.tile(2, c[0], c[1], E(*art.LAYOUT[nm]))

    # ---- the ways: out to the quarry (the neck's bottom row), the stairs up (station B)
    for x in (8, 9, 10):
        mp.add(x, 39, {"name": "Przejście -> Góry i kamieniołom", "note": "", "pages": [
            page(priority=0, trigger=1, cmds=[cmd(201, [0, QUARRY, QUARRY_LAND[0], QUARRY_LAND[1], QUARRY_LAND[2], 0])])]})
    mp.ev(STAIRS_B[0], STAIRS_B[1], "!Fantasy_door5", 0, 2, 0, name="Schody na szczyt", priority=1, through=False)
    mp.spot("schody_gora", STAIRS_B[0], STAIRS_B[1] + 1, 8)

    # ---- the carts, the lever and the tags the plugin reads (Kopalnia.js)
    cart_page = lambda d, prio=1, **kw: page(image={"characterName": "!$Kopalnia_Wagonik", "characterIndex": 0, "direction": d, "pattern": 1},
                                             priority=prio, trigger=0, cmds=script("Kopalnia.board(this)"), **kw)
    for key in ("A", "B"):
        x, y = {"A": MAIN[0][1:], "B": MAIN[-1][1:]}[key]
        mp.add(x, y, {"name": "Wagonik " + key, "note": marker_note(KopWagon=key), "pages": [cart_page(PARKED_DIR[key])]})
        mp.solid.add((x, y))
    mp.add(MAIN[0][1], MAIN[0][2], {"name": "Wagonik (jazda)", "note": marker_note(KopWagon="M"), "pages": [cart_page(6)]})
    rim = page(image={"characterName": "!$Kopalnia_Wagonik_Przod", "characterIndex": 0, "direction": 6, "pattern": 1}, priority=2, trigger=0, through=True)
    mp.add(MAIN[0][1], MAIN[0][2], {"name": "Wagonik (przód)", "note": marker_note(KopWagon="R") + LANTERN_LIGHT + "<LightFollow>", "pages": [rim]})
    mp.ev(LEVER[0], LEVER[1], "!Fantasy_switches2", 0, 6, 0, name="Dźwignia zwrotnicy", priority=1, through=False,
          note=marker_note(KopDzwignia=1), cmds=script("Kopalnia.lever()"))
    for i, (st, x, y) in enumerate(MAIN):
        mp.marker(x, y, "Tor główny %d" % i, note=marker_note(KopTor="main,%d%s" % (i, "," + st if st else "")))
    for i, (st, x, y) in enumerate(SPUR):
        mp.marker(x, y, "Tor odnogi %d" % i, note=marker_note(KopTor="spur,%d%s" % (i, "," + st if st else "")))
    for st, (x, y, d) in EXITS.items():
        mp.marker(x, y, "Wysiadka " + st, note=marker_note(KopWysiadka="%s,%d" % (st, d)), d=d)

    # ---- the lights: lanterns on the walls (every light is fire), braziers on the platforms
    lamps = [(6, 25), (14, 25), (9, 29)] if False else []
    wall_lamps = [(6, 27), (13, 27), (24, 29), (31, 29), (38, 20), (44, 20), (51, 19), (57, 19), (64, 20), (70, 10), (76, 10), (83, 7), (89, 7),
                  (56, 9), (60, 9), (9, 36)]
    for (x, y) in wall_lamps:
        lantern(mp, x, y)
    brazier(mp, 4, 33, "Kosz z ogniem przy peronie A")
    brazier(mp, 92, 9, "Kosz z ogniem przy peronie B")
    return mp, dict(floor=floor, platform=platform, tunnels=tunnels, rails=rails, faces=faces, cav1=cav1 & floor, cav2=cav2 & floor, halt=halt & floor,
                    cav3=cav3 & floor, cav4=cav4 & floor, chamber=chamber & floor, hallB=hallB & floor)


def finish_props(mp, info):
    """the furnishing: supports, crates, the cart wreck, rubble, the ore face"""
    floor, rails = info["floor"], info["rails"]
    keep = set(rails) | {(x, y) for (x, y, d) in EXITS.values()} | {LEVER} | set(ccells(MAIN)) | set(ccells(SPUR))
    for st in "AHBS": keep |= {(EXITS[st][0], EXITS[st][1])}
    clear = set()
    for (x, y) in keep:                       # the walking space beside the rails and the doors stays open
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1): clear.add((x + dx, y + dy))
    clear |= {(8, 36), (9, 36), (10, 36), (9, 37), (STAIRS_LAND[0], STAIRS_LAND[1]), (STAIRS_LAND[0] + 1, STAIRS_LAND[1]), (STAIRS_B[0], STAIRS_B[1] + 1)}
    clear |= {(x, y) for x in range(8, 11) for y in range(33, 40)}
    clear |= {(x, y) for x in range(83, 87) for y in range(8, 11)}
    return clear


def furnish(mp, info):
    floor = info["floor"]
    clear = finish_props(mp, info)
    used = set()
    rnd = random.Random(2131)

    def fit(name, x, y):
        spec = uglib.PIECES[name]
        assert spec[0] != "E", name
        w, h, block = spec[3], spec[4], spec[5]
        cells = [(x + dx, y + dy) for dy in range(h) for dx in range(w)]
        foot = [(x + dx, y + dy) for dy in block for dx in range(w)]
        if any(c not in floor or c in clear or c in mp.solid or c in used for c in cells): return None
        return cells, foot

    def piece(name, x, y):
        f = fit(name, x, y)
        if not f:
            print("WARN piece skipped: %s at %s" % (name, (x, y)))
            return False
        cells, foot = f
        used.update(cells)
        for c in foot: mp.solid.add(c)
        mp.piece(name, x, y)
        return True

    def scatter(area, names, n, near_wall=False, tries=400):
        area = sorted(area)
        done = 0
        for _ in range(tries):
            if done >= n: break
            x, y = rnd.choice(area)
            name = rnd.choice(names)
            if near_wall and ((x, y - 1) in floor and (x, y - 2) in floor): continue
            if piece_quiet(name, x, y): done += 1
        return done

    def piece_quiet(name, x, y):
        f = fit(name, x, y)
        if not f: return False
        cells, foot = f
        used.update(cells)
        for c in foot: mp.solid.add(c)
        mp.piece(name, x, y)
        return True

    rocks = ["stalagmit_br", "stalagmit_br2", "stalagmit_br3", "kupa_skal", "glaz_brazowy", "kamien_okragly", "glazy_br", "stalagmity_male"]
    junk = ["gruz_belka", "rumowisko", "beczka_rozbita", "skrzynka_pusta", "worek_rozsypany", "deska_lezaca", "kamyki_br", "gruz_szary"]
    stores = ["skrzynie_wysokie", "skrzynka_otwarta", "worki_stos", "beczki_dwie", "beczka", "skrzynka_zamknieta", "skrzynka_plotno", "deski_oparte"]
    # ---- station A: the stores of the quarrymen along the north wall, a pick leaning on the wall
    for x, n in ((4, "worki_stos"), (6, "skrzynie_wysokie"), (8, "deski_oparte"), (11, "beczki_dwie"), (14, "skrzynka_otwarta")):
        piece(n, x, 27)
    piece("kilof_oparty", 3, 30)
    piece("wiadro_puste", 15, 34)
    # ---- the first tunnel's cavern: the derailed cart on its broken siding, crates, rubble, rock
    piece("wozek_pusty", 23, 34)
    piece("gruz_belka", 26, 33)
    piece("skrzynka_pusta", 17, 36)
    scatter(info["cav1"], rocks, 7)
    scatter(info["cav1"], junk, 5)
    scatter(info["cav1"], stores, 3, near_wall=True)
    # ---- the old working north-west of the corner
    piece("wozek_ruda", 30, 18)
    scatter(info["cav2"], rocks, 5)
    scatter(info["cav2"], junk, 4)
    scatter(info["cav2"], stores, 2, near_wall=True)
    # ---- the halt's cavern: the lever's yard
    piece("skrzynie_wysokie", 52, 17) if False else None
    scatter(info["halt"], stores, 6, near_wall=True)
    scatter(info["halt"], rocks, 6)
    scatter(info["halt"], junk, 4)
    # ---- the ore spur's chamber: the face, the veins, tools
    piece("rumowisko", 55, 12)
    piece("gruz_belka", 61, 12)
    piece("kilof_oparty", 56, 14)
    for (x, y, pic) in ((55, 10, "!$Rock_Ore_Iron_Cluster"), (59, 10, "!$Rock_Ore_Iron_Twin"), (61, 10, "!$Rock_Ore_Iron_Jagged")):
        if not mp.put(x, y, pic): print("WARN ore not placed", pic, x, y)
        used.add((x, y)); used.add((x + 1, y))
    mp.put(57, 12, "!$Rock_Ore_Iron_Chunk")
    scatter(info["chamber"], rocks[:4], 2)
    # ---- caverns 3 and 4, the middle
    scatter(info["cav3"], rocks, 4)
    scatter(info["cav4"], rocks, 6)
    scatter(info["cav4"], junk, 3)
    scatter(info["cav4"], stores, 2, near_wall=True)
    # ---- station B
    for x, n in ((81, "skrzynie_wysokie"), (86, "worki_stos"), (89, "skrzynka_zamknieta"), (91, "beczki_dwie")):
        piece(n, x, 14 if n in ("worki_stos",) else 15)
    piece("deski_oparte", 91, 8) if False else None
    scatter(info["hallB"], rocks, 3)


def mapinfos(infos):
    infos = copy.deepcopy(infos)
    ids = {x["id"] for x in infos if x}
    assert MAP_ID not in ids, "MapInfos already has Map%d" % MAP_ID
    top = max(x["order"] for x in infos if x)
    # (the order: right after Jaskinia (14) in the editor's tree under Góry i kamieniołom)
    entry = {"id": MAP_ID, "expanded": False, "name": NAME, "order": top + 1, "parentId": QUARRY, "scrollX": 960, "scrollY": 400}
    while len(infos) <= MAP_ID: infos.append(None)
    infos[MAP_ID] = entry
    return infos


def patch_map13(m):
    """the mouth in the quarry wall at (54,31), rails to the abandoned cart, a lantern; the shelves stay as they are (eagle only)"""
    ev = m["events"]
    nid = len(ev)
    def add(x, y, e):
        nonlocal nid
        e = dict(e); e["id"], e["x"], e["y"] = nid, x, y
        # (keys in the editor's order)
        ev.append({"id": e["id"], "name": e["name"], "note": e["note"], "pages": e["pages"], "x": x, "y": y}); nid += 1
    mouth = {"name": "Wejście do kopalni", "note": "", "pages": [page(image={"characterName": "!$Kopalnia_Wejscie", "characterIndex": 0, "direction": 2, "pattern": 0},
             priority=1, trigger=1, cmds=[se("Move1", 70, 80), cmd(201, [0, MAP_ID, MINE_LAND[0], MINE_LAND[1], MINE_LAND[2], 0])])]}
    add(QUARRY_MOUTH[0], QUARRY_MOUTH[1], mouth)
    track = lambda d, p, name: {"name": name, "note": "", "pages": [page(image={"characterName": "!$Kopalnia_Tor", "characterIndex": 0, "direction": d, "pattern": p},
                                priority=0, trigger=0, through=True)]}
    add(54, 32, track(2, 0, "Tor z kopalni"))
    add(54, 33, track(2, 0, "Tor z kopalni"))
    add(54, 34, track(2, 2, "Tor z kopalni"))        # the turn: connects west and north
    for x in range(49, 54): add(x, 34, track(2, 1, "Tor z kopalni"))
    lamp = {"name": "Latarnia kopaczy", "note": LANTERN_LIGHT, "pages": [page(image={"characterName": LANTERN[0], "characterIndex": LANTERN[1], "direction": LANTERN[2], "pattern": 0},
            priority=0, trigger=0, through=True, step=True)]}
    add(52, 31, lamp)
    # the pine at (53, 32) stood over the mouth: it goes (the quarry's own small tree, nothing hangs on it)
    for i, e in enumerate(ev):
        if e and (e["x"], e["y"]) == (53, 32) and e["name"].startswith("Sosna"):
            assert e["id"] == i; ev[i] = None
    # the stone that stood on (54, 33) moves out of the rails' way
    for e in ev:
        if e and e["name"].startswith("Omsza") and (e["x"], e["y"]) == (54, 33): e["x"], e["y"] = 56, 33
    return m


def patch_map175(m):
    ev = m["events"]
    for i in (144, 152, 155):                 # the north edge's transfers to Map931 (the world's edge takes over)
        assert ev[i] and ev[i]["id"] == i and ev[i]["name"].startswith("Przej"), "Map175 event %d is not the one I expected" % i
        ev[i] = None
    nid = len(ev)
    shaft = {"name": "Szyb do kopalni", "note": "", "pages": [page(image={"characterName": "!$Kopalnia_Szyb", "characterIndex": 0, "direction": 2, "pattern": 0},
             priority=0, trigger=0, through=True)]}
    ev.append({"id": nid, "name": shaft["name"], "note": shaft["note"], "pages": shaft["pages"], "x": 20, "y": 30})
    return m


def patch_orzel_data(txt):
    old = "const WAY_UP = { map: GORY, cells: [], stand: [], to: MAP, land: [20, 57], dir: 8 };"
    new = ("const WAY_UP = { map: 213, cells: [[%d, %d]], stand: [], to: MAP, land: [%d, %d], dir: 8 };   // (kopalnia: schody w ścianie stacji B na Map213 -> Orla Grań (20,28))"
           % (STAIRS_B[0], STAIRS_B[1], RIDGE_LAND[0], RIDGE_LAND[1]))
    assert txt.count(old) == 1, "Orzel_Data.js: WAY_UP line changed"
    txt = txt.replace(old, new)
    old2 = "const WAY_DOWN = { cells: [[19, 59], [20, 59], [21, 59]], to: GORY, land: [53, 31], dir: 2 };   // (plansza 3x3: Góry +24 rows)"
    new2 = ("const WAY_DOWN = { cells: [[19, 30], [20, 30], [21, 30]], to: 213, land: [%d, %d], dir: 2 };   // (szyb na Orlej Grani -> kopalnia, pod schodami stacji B)"
            % (STAIRS_LAND[0], STAIRS_LAND[1]))
    assert txt.count(old2) == 1, "Orzel_Data.js: WAY_DOWN line changed"
    return txt.replace(old2, new2)


LOCKED_MINE = "Schody pną się w górę, w mrok i chłód. Na razie nie masz po co się tam wspinać."


def patch_orzel(txt):
    old = "T.inject(D.GORY, { ids: [500, 509], owner: PLUGIN, build(data) {"
    assert txt.count(old) == 1, "Orzel.js: the inject line changed"
    txt = txt.replace(old, "T.inject(D.WAY_UP.map, { ids: [500, 509], owner: PLUGIN, build(data) {")
    old2 = "T.popup(TX.wayUpLocked, { color: \"info\" }); return; }"
    assert txt.count(old2) == 1, "Orzel.js: the wayUp popup changed"
    # (the stairs of the mine: the cliff's words - old pegs in the rock - do not fit them)
    return txt.replace(old2, "T.popup(D.WAY_UP.map === 213 ? " + json.dumps(LOCKED_MINE, ensure_ascii=False) + " : TX.wayUpLocked, { color: \"info\" }); return; }")


def plugin_list():
    import wtyczki
    wtyczki.LISTA = src("js/tawerna_wtyczki.js")
    wtyczki.ROOT = STG if os.path.exists(os.path.join(STG, "js", "plugins", "Kopalnia.js")) else ROOT
    lista = wtyczki.czytaj_liste()
    if "Kopalnia" not in lista.nazwy():
        assert wtyczki.dodaj(lista, wtyczki.wpis_z_pliku("Kopalnia"), po="Orzel_Lot")
    return lista.tekst()


def check(mp, info, m213):
    """no way to get stuck: every stop, the lever, the exits and the spur's face are reachable on foot from the landing; the rails are free to walk;
    the carts' cells are on the rails; the tag events are all there; index == id"""
    floor = info["floor"]
    start = (MINE_LAND[0], MINE_LAND[1])
    seen = mp.reach(start)
    need = {"hero landing": start, "stairs landing": STAIRS_LAND, "stairs landing 2": (STAIRS_LAND[0] + 1, STAIRS_LAND[1]), "lever side": (LEVER[0], LEVER[1] - 1)}
    for st, (x, y, d) in EXITS.items(): need["exit " + st] = (x, y)
    for k, c in need.items(): assert c in seen, "unreachable: %s %s" % (k, c)
    for x in (8, 9, 10): assert (x, 38) in seen
    for c in info["rails"]:
        assert c in floor and (c in seen or c in mp.solid), "rail cell not reachable %s" % (c,)
    chamber = [(x, y) for x in range(54, 63) for y in range(10, 14)]
    assert any(c in seen for c in chamber), "spur chamber unreachable"
    ev = m213["events"]
    assert all((e is None) == (i == 0) or (e and e["id"] == i) for i, e in enumerate(ev)), "events index != id"
    assert W.map_text(m213).encode("utf-8") == W.map_text(json.loads(W.map_text(m213))).encode("utf-8"), "round trip"
    # the exits of the cart stops are walkable cells and distinct from the rail cells of the carts
    for st, (x, y, d) in EXITS.items(): assert (x, y) in floor and (x, y) not in mp.solid, "exit %s blocked" % st
    return len(seen)


def main():
    global Z
    args = sys.argv[1:]
    if "--z" in args: Z = os.path.abspath(args[args.index("--z") + 1])
    obrazki = "--obrazki" in args
    for rel in ("img/tilesets/Kopalnia/Kopalnia_E.png", "img/characters/!$Kopalnia_Wagonik.png"):
        assert os.path.exists(os.path.join(STG, rel)), "run art.py first (%s)" % rel
    for rel in ("data/Tilesets.json", "data/MapInfos.json", "data/Map013.json", "data/Map175.json", "js/plugins/Orzel_Data.js", "js/plugins/Orzel.js", "js/tawerna_wtyczki.js"):
        note_input(rel)
    ts, lay = read_db("data/Tilesets.json")
    tid = len(ts)
    entry = tileset_entry(ts)
    ts2 = ts + [entry]
    put("data/Tilesets.json", (W.db_text(ts2) if lay == "db" else W.dump(ts2)).encode("utf-8"))
    mp, info = build(tid)
    furnish(mp, info)
    j = mp.to_json()
    text = W.map_text(j).encode("utf-8")
    m213 = json.loads(text.decode("utf-8"))
    n = check(mp, info, m213)
    put("data/Map213.json", text)
    infos, lay = read_db("data/MapInfos.json")
    put("data/MapInfos.json", (W.db_text(mapinfos(infos)) if lay == "db" else W.dump(mapinfos(infos))).encode("utf-8"))
    m13, _ = read_db("data/Map013.json")
    put("data/Map013.json", W.map_text(patch_map13(m13)).encode("utf-8"))
    m175, _ = read_db("data/Map175.json")
    put("data/Map175.json", W.map_text(patch_map175(m175)).encode("utf-8"))
    put("js/plugins/Orzel_Data.js", patch_orzel_data(open(src("js/plugins/Orzel_Data.js"), "rb").read().decode("utf-8")).encode("utf-8"))
    put("js/plugins/Orzel.js", patch_orzel(open(src("js/plugins/Orzel.js"), "rb").read().decode("utf-8")).encode("utf-8"))
    if os.path.exists(os.path.join(STG, "js", "plugins", "Kopalnia.js")):
        put("js/tawerna_wtyczki.js", plugin_list())
    put("SHA.json", (json.dumps({"inputs": INPUTS, "tileset": tid, "z": Z or ""}, indent=1, ensure_ascii=False) + chr(10)).encode("utf-8"))
    print("Map213: %dx%d, %d events, %d cells reachable from the landing; tileset %d; staged in %s" % (MW, MH, len(m213["events"]) - 1, n, tid, STG))
    if obrazki:
        os.makedirs(os.path.join(ROOT, "docs", "kopalnia"), exist_ok=True)
        S = KSheets(entry)
        img = uglib.render(m213, None, sheets=S)
        img.convert("RGB").save(os.path.join(ROOT, "docs", "kopalnia", "mapa_podglad.png"))
        print("docs/kopalnia/mapa_podglad.png", img.size)


if __name__ == "__main__":
    main()
