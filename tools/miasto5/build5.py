# -*- coding: utf-8 -*-
"""Kruczogród w czterech dzielnicach (gracz 2026-11-09, szkic docs/miasto5_szkic.png): stara mapa Winlu (kopia sprzed paczki,
../Tawerna_archiwum_2026-11-08/kruczogrod_miasto_20261108_154456/data/Map008.json) jako baza, tileset 11.
  - zostają na miejscu: Zamek i tawerna (x0-78 y0-33 + ulica x79-81), Rynek z ratuszem (x0-101 y34-66), stare kwartały (x0-74 y67-92);
  - stary mur wschodni i południowy znikają; nowy mur zewnętrzny na krawędzi mapy złożony z jednostek starego muru
    (odcinek, wieża, brama drewniana, brama między wieżami, brama z wieżami nad schodami, narożniki);
    przejścia: N x24-26, W y50-51, W2 y106-107, E y12-14, E2 y48-49, S x30-32;
  - 6 starych domów ze wschodu przeniesionych w całości (kafle budynku + ozdoby + zdarzenia) do rzędu nad murem południowym;
  - nowe dzielnice: Stajnie i targi (x82-117 y5-66: podwórze ze stajnią A, miejsca na browar, targ zwierząt, podkuwacza, zajazd),
    Pola i młyn (x75-117 y67-105) - na razie ulice, kwartały, płoty i miejsca (budynki z PixelLab dojdą jako zdarzenia).
Nic nie instaluje: zapisuje tools/miasto5/staging/data/Map008.json (+ spis zmian zdarzeń staging/zdarzenia.json).
  python tools/miasto5/build5.py"""
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
OLDP = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "kruczogrod_miasto_20261108_154456", "data", "Map008.json")
old = json.load(open(OLDP, encoding="utf-8"))
V2 = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "miasto5_20261109_164803", "data", "Map008.json")   # (town v2, before this install)
cur = json.load(open(V2 if os.path.exists(V2) else os.path.join(ROOT, "data", "Map008.json"), encoding="utf-8"))   # (only for the stable door's pages and yard decor)
m = copy.deepcopy(old)
W, H = m["width"], m["height"]; n = W * H; D = m["data"]; OD = old["data"]
assert (W, H) == (120, 120) and m["tilesetId"] == 11
GRASS, ROAD, KERB, EARTH, FENCE = 16, 40, 43, 24, 22
touched = set()

def g(z, x, y): return D[z * n + y * W + x]
def s(z, x, y, v): D[z * n + y * W + x] = v; touched.add((x, y))
def og(z, x, y): return OD[z * n + y * W + x]
def kind(v): return (v - 2048) // 48 if v >= 2048 else None
def A2(k): return 2048 + k * 48
def rect(x0, y0, x1, y1): return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
def wipe(x0, y0, x1, y1, k=GRASS):
    for x, y in rect(x0, y0, x1, y1):
        s(0, x, y, A2(k))
        for z in range(1, 6): s(z, x, y, 0)
def paint(x0, y0, x1, y1, k):
    for x, y in rect(x0, y0, x1, y1): s(0, x, y, A2(k))
def copy_cell(sx, sy, x, y, zs=range(6)):
    for z in zs: s(z, x, y, og(z, sx, sy))

# ------------------------------------------------------------------ events
ev = m["events"]
def E(i): return ev[i]
moved, deleted, added, repl = [], [], [], []
def move_ev(i, x, y):
    e = ev[i]; moved.append((i, e["name"], (e["x"], e["y"]), (x, y))); e["x"], e["y"] = x, y
def events_in(x0, y0, x1, y1):
    return [e["id"] for e in ev if e and x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1]
def move_box(x0, y0, x1, y1, dx, dy, done):
    for i in events_in(x0, y0, x1, y1):
        if i in done: continue
        move_ev(i, ev[i]["x"] + dx, ev[i]["y"] + dy); done.add(i)
def new_id():
    for i in range(1, 500):
        if i >= len(ev): ev.extend([None] * (i - len(ev) + 1))
        if ev[i] is None and i not in reserved: return i
    raise SystemExit("no free event id < 500")
reserved = set()
def page(img="", idx=0, trigger=0, prio=1, lst=None, fix=True, through=False, pattern=1, direction=2):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
            "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": fix, "image": {"tileId": 0, "characterName": img, "direction": direction, "pattern": pattern if img else 0,
            "characterIndex": idx}, "list": (lst or []) + [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3,
            "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 3,
            "moveType": 0, "priorityType": prio, "stepAnime": False, "through": through, "trigger": trigger, "walkAnime": False}
def add_ev(name, x, y, pages, note=""):
    i = new_id(); reserved.add(i)
    ev[i] = {"id": i, "name": name, "note": note, "pages": pages, "x": x, "y": y}; added.append((i, name, (x, y))); return i
def popup_cmd(text):
    return [{"code": 355, "indent": 0, "parameters": ["const t = $gameTemp, k = this.eventId(); t._budDoorPop = t._budDoorPop || {}; "
             "if (!(t._budDoorPop[k] > Graphics.frameCount - 60)) { t._budDoorPop[k] = Graphics.frameCount; Tawerna.popup(%s, { color: \"info\" }); }"
             % json.dumps(text, ensure_ascii=False)]}]

done = set()     # events already placed (moved / kept on purpose)

# ================================================================== 1. relocate the six old east houses (before the east is wiped)
# (name, old tile box x0,y0,x1,y1, new x0, door row in the old map) - every door lands on row 104/105 of the south row
HOUSES = [("Dom Agaty", (80, 5, 89, 13), 5, 13), ("Kamienica", (91, 20, 100, 28), 17, 28), ("Dom 13", (75, 66, 82, 74), 35, 74),
          ("Dzwonnica", (84, 26, 88, 32), 44, 32), ("Dom 14 + Dom weterana", (76, 83, 88, 88), 50, 88), ("Izba do wynajęcia", (91, 83, 100, 88), 64, 88)]
staged_houses = []
for name, (x0, y0, x1, y1), nx0, bottom in HOUSES:
    dx, dy = nx0 - x0, 105 - bottom
    cells = []
    for sy in range(y0, y1 + 1):
        for sx in range(x0, x1 + 1):
            cells.append((sx, sy, sx + dx, sy + dy))
    staged_houses.append((name, cells, (x0, y0, x1, y1 + 1), dx, dy))

# ================================================================== 2. wipe the parts that change
wipe(82, 5, 117, 33)                 # the old north-east block (Agata, Kamienica, bell tower, the dark plot)
wipe(102, 0, 119, 119)               # the old east wall and the meadow beyond it
wipe(75, 67, 101, 105)               # the old south-east block
wipe(0, 92, 119, 119)                # the old south wall, its cliff and the meadow
wipe(0, 89, 1, 91)                   # (the west wall's last rows: the old corner tower's top is rebuilt lower)

# ================================================================== 3. the outer wall
# 3a. south wall: new rows 106..119 <- old rows 89..102, column units
S_UNITS = [("SW", [0, 1, 2]), ("P", [3] * 8), ("T", [11, 12, 13, 14]), ("P", [3] * 12), ("G", list(range(48, 57))), ("P", [3] * 11),
           ("T", [11, 12, 13, 14]), ("P", [3] * 12), ("T", [11, 12, 13, 14]), ("P", [3] * 12), ("T", [11, 12, 13, 14]), ("P", [3] * 12),
           ("T", [11, 12, 13, 14]), ("P", [3] * 6), ("T", [11, 12, 13, 14]), ("P", [3] * 8), ("SE", [101, 102, 103])]
src_cols = [c for _, cols in S_UNITS for c in cols]
assert len(src_cols) == 120, len(src_cols)
gate_x0 = sum(len(c) for _, c in S_UNITS[:4])          # where the gate unit starts (old col 48)
assert gate_x0 + 3 == 30, gate_x0                       # old passage 51..53 -> new 30..32
for x, sx in enumerate(src_cols):
    for y in range(106, 120): copy_cell(sx, y - 17, x, y)
move_box(48, 89, 56, 102, gate_x0 - 48, 17, done)       # the gate's torches / decorations

# 3b. east wall: cols 118..119 <- old cols 102..103, row units (rows 0..105; below: the south wall's corner)
TOWER, GATE = list(range(65, 72)), list(range(43, 59))
E_ROWS = list(range(0, 7)) + [59, 60] + GATE + [59, 60, 61, 62] + TOWER + [59, 60, 61, 62, 63] + GATE + [59, 60, 61, 62] + TOWER \
         + list(range(59, 65)) + TOWER + list(range(59, 65)) + TOWER + [59, 60] + TOWER + [59, 60, 61]
assert len(E_ROWS) == 106, len(E_ROWS)
assert E_ROWS[16] == 50 and E_ROWS[48] == 50, (E_ROWS[16], E_ROWS[48])   # passages: NE gate 16-17, E2 gate 48-49
for y, sy in enumerate(E_ROWS):
    for x, sx in ((118, 102), (119, 103)): copy_cell(sx, sy, x, y)
# (the old roofed NE gate's pictures 330/333/336 go: the NE gate is now the towers' gate with copies of the E2 gate's braziers)
move_box(101, 47, 104, 54, 16, 48 - 50, done)           # the E2 gate's braziers and the Lord's banners (old passage 50 -> 48)

for i in (225, 226, 227, 228):                          # braziers + posts: old rows 48/49 and 52/53 round the passage 50-51
    e = copy.deepcopy(old["events"][i])
    add_ev(e["name"], 117, e["y"] - 34, e["pages"], e["note"])
# 3c. north wall x102..117 (rows 0..4) <- old plain col 2 / tower cols 91,92; the corner (118,119) came with the east wall
N_COLS = [2] * 6 + [91, 92] + [2] * 8
for i, sx in enumerate(N_COLS):
    for y in range(0, 5): copy_cell(sx, y, 102 + i, y)

# 3d. west wall rows 89..108: plain, then the W2 gate (old rows 43..52: tower + roofed gate, passage 50-51 -> 106-107)
W_ROWS = [59, 60, 61, 62, 63, 64, 72, 73, 74, 75] + list(range(43, 53))
for i, sy in enumerate(W_ROWS):
    y = 89 + i
    for x in (0, 1): copy_cell(x, sy, x, y)
    if 47 <= sy <= 49: copy_cell(2, sy, 2, y)           # the gate roof's overhang (region 2 at x2)
assert 89 + W_ROWS.index(50) == 106

# the wall's walkway (rows 0-1) is passable by the tiles' flags - nobody may stand on it once the neighbours carry copies of the wall:
# region 2 (blocks, the wall is drawn there) except the north gate's passage; the same for the south-east corner's cliff pocket
for x in range(120):
    if not 24 <= x <= 26: s(5, x, 0, 2); s(5, x, 1, 2)
for x, y in rect(117, 116, 119, 119): s(5, x, y, 2)
for x, y in rect(0, 116, 1, 119): s(5, x, y, 2)          # (the south-west corner's wall strip at the cliff's end)
# ================================================================== 4. streets and blocks of the new parts
# south row (y93..105) between the old street (y89-92) and the street along the wall (y106-109)
paint(2, 92, 74, 92, KERB); paint(2, 93, 2, 105, KERB); paint(74, 92, 74, 105, KERB)   # the south row's kerb (street rows 90-91)
paint(29, 92, 33, 105, KERB); paint(30, 90, 32, 105, ROAD)   # the lane from the south gate
paint(2, 104, 3, 105, ROAD)                              # (under the W2 gate's overhang: the gate's apron)
# east half: the spine road x102-104 and the cross streets
paint(102, 5, 104, 105, ROAD)
paint(105, 15, 117, 18, ROAD)                            # from the NE gate (passage 16-17)
s(0, 101, 46, A2(KERB)); s(0, 101, 50, A2(ROAD))          # (the old E gate's tower foot / threshold by the Strażnica)
for z in (1, 2, 3, 5): s(z, 101, 46, 0); s(z, 101, 50, 0)
paint(102, 34, 117, 36, ROAD)                            # the old street y34-36 carried on to the wall
paint(102, 47, 117, 52, ROAD)                            # the avenue to the E2 gate
paint(102, 64, 117, 65, ROAD)                            # the old street y64-65 carried on
paint(75, 75, 117, 77, ROAD)                             # the old street y75-77 carried on (farm track)
paint(75, 90, 117, 92, ROAD)                             # the old street y90-92 carried on
# (the old street along the south wall: the thatched lean-tos and the barrels stood half on rows 90-91 - their rows 92-93 are gone)
for x in range(2, 75):
    for y in (90, 91):
        if kind(g(0, x, y)) != ROAD: s(0, x, y, A2(ROAD))
        for z in (1, 2, 3, 5): s(z, x, y, 0)
# NE west block x81..101 y5..33 on the old block's kerb x81 (Agata's garden fence stood on x80-83: gone), stable yard, brewery lot
for y in range(5, 34):
    for z in (1, 2, 3, 5): s(z, 80, y, 0); s(z, 81, y, 0)
    s(0, 80, y, A2(ROAD))
paint(81, 5, 81, 33, KERB); paint(101, 5, 101, 33, KERB); paint(81, 33, 101, 33, KERB)
paint(83, 5, 99, 23, EARTH)                              # the yard's packed earth
for x, y in rect(82, 5, 82, 24) + rect(100, 5, 100, 24) + rect(82, 24, 100, 24):
    if x == 100 and 13 <= y <= 15: continue              # the yard gate onto the spine road
    s(1, x, y, A2(FENCE))
# NE east block x105..117: two lots (north of the gate road, and y15..33), the E strip lots y37..46, y53..63
for (x0, y0, x1, y1) in [(105, 5, 117, 14), (105, 19, 117, 33), (105, 37, 117, 46), (105, 53, 117, 63)]:
    paint(x0, y0, x1, y0, KERB); paint(x0, y1, x1, y1, KERB); paint(x0, y0, x0, y1, KERB); paint(x1, y0, x1, y1, KERB)
# south-east lots: fields x76..101 (y67-75, y79-88), barn + pasture y93-105; east of the spine: mill, granary, orchard, camp
for (x0, y0, x1, y1) in [(75, 66, 101, 74), (75, 78, 101, 89), (75, 93, 101, 105), (105, 66, 117, 74), (105, 78, 117, 89), (105, 93, 117, 105)]:
    paint(x0, y0, x1, y0, KERB); paint(x0, y1, x1, y1, KERB); paint(x0, y0, x0, y1, KERB); paint(x1, y0, x1, y1, KERB)

# ================================================================== 5. the six houses into the south row
for name, cells, ebox, dx, dy in staged_houses:
    for sx, sy, x, y in cells:
        v0 = og(0, sx, sy); k = kind(v0)
        if v0 and (v0 < 2048 or k >= 48): s(0, x, y, v0)          # the building itself (A3/A4) or a picture tile on layer 0
        for z in (1, 2, 3, 4, 5):
            v = og(z, sx, sy)
            if z == 1 and kind(v) in (21, 46): continue           # (no loose grass tufts / path overlays from the old lot)
            if z == 1 and kind(v) in (22, 38) and sy == ebox[1]: continue   # (the old field's fence ran along the Izba's roof top row)
            if v: s(z, x, y, v)
    move_box(*ebox, dx, dy, done)
# back gardens behind the low houses (fence ring with a gate at the bottom, dug earth, cabbage heads as in the old plots)
CAB = (256 + 22, 256 + 23)
def plot(x0, y0, x1, y1, gate_x):
    for x, y in rect(x0, y0, x1, y1):
        if x in (x0, x1) or y in (y0, y1):
            if not (y == y1 and x == gate_x): s(1, x, y, A2(FENCE))
        else:
            s(0, x, y, A2(17))
            if (x - x0) % 2 == 1 and (y - y0) % 2 == 1: s(2, x, y, CAB[(x + y) % 2])
plot(50, 93, 55, 99, 52); plot(57, 93, 62, 99, 59); plot(64, 93, 69, 99, 66)
# trees from the old north-east and south-east lots, replanted behind the houses (their <Tree> notes kept)
for i, (x, y) in {211: (4, 96), 219: (13, 95), 214: (17, 96), 215: (25, 95), 286: (36, 96), 283: (41, 96), 217: (47, 95),
                  285: (72, 98)}.items():
    move_ev(i, x, y); done.add(i)
# the old fields (x2..25 y66..74, fenced cabbage plots) copied as the new fields' pattern into the SE lots
def copy_block(sx0, sy0, sx1, sy1, x0, y0, zs=range(6)):
    for sy in range(sy0, sy1 + 1):
        for sx in range(sx0, sx1 + 1): copy_cell(sx, sy, x0 + sx - sx0, y0 + sy - sy0, zs)
copy_block(2, 66, 25, 73, 76, 66)       # fields row 1 (the old fenced plots with their top fence, 24 x 8)
copy_block(2, 66, 25, 73, 76, 78)       # fields row 2
for x, y in rect(77, 67, 83, 72) + rect(86, 67, 91, 72) + rect(77, 79, 83, 84):
    s(2, x, y, 0)                       # (the plots of the day-labour fields pole_1/2/3: bare dug earth, Zasoby grows the crops)

# ================================================================== 6. the stable yard: stable A (picture) + door 209 + decor
STABLE_LEFT, STABLE_Y = 84, 10
reserved.update({209, 210, 415, 446})
stable_pic = add_ev("Budynek: Stajnia", STABLE_LEFT + 6, STABLE_Y, [page("!$Stajnia_A_Bud", 0, 0, 1)], "<Occupy:left=6,right=5,up=1>")
d209 = copy.deepcopy(cur["events"][209])
for p in d209["pages"]: p["image"].update({"characterName": "!$Stajnia_A_Drzwi", "characterIndex": 0, "direction": 2, "pattern": 1})
d209["x"], d209["y"] = STABLE_LEFT + 8, STABLE_Y; ev[209] = d209; repl.append((209, "Drzwi: Stajnia", (92, 10))); done.add(209)
move_ev(210, 101, 12); done.add(210)                    # the stable's sign by the yard gate
move_ev(446, STABLE_LEFT + 8, STABLE_Y + 1); done.add(446)
move_ev(415, 103, 18); done.add(415)                    # where the cart stops by the stable (the spine road)
wagon = copy.deepcopy(cur["events"][26]); rail = copy.deepcopy(cur["events"][35])
add_ev(wagon["name"], 97, 23, wagon["pages"], wagon["note"])
add_ev(rail["name"], 83, 12, rail["pages"], rail["note"])
# the old stable building (x57-62 y79-88, kept) becomes a locked wagon shed
old209 = old["events"][209]
shed = add_ev("Drzwi: Wozownia (zamknięta)", 61, 87,
              [dict(page(old209["pages"][0]["image"]["characterName"], old209["pages"][0]["image"]["characterIndex"], 1, 1,
                         popup_cmd("Wozownia. Zamknięte na skobel."), True))])

# ================================================================== 7. markers that follow the gates / the camp
for i, (x, y) in {323: (116, 49), 412: (31, 108), 324: (31, 109), 332: (89, 98), 334: (79, 98), 343: (35, 108), 344: (91, 98)}.items():
    move_ev(i, x, y); done.add(i)

# ================================================================== 7b. new buildings: old Winlu houses copied as a whole (structure tiles + their
# ornament events), roofs recoloured (same autotile shape, another A3 kind), a locked door of their own (no interior yet)
def struct_cell(sx, sy, src=None):
    v0 = og(0, sx, sy) if src is None else sog(src, 0, sx, sy); k = kind(v0)
    return bool(v0) and (v0 < 2048 or k >= 48)
def sog(src, z, x, y): return src["data"][z * src["width"] * src["height"] + y * src["width"] + x]
def stamp(name, box, dest, roof=None, cut_rows=(), skip_ev=(), door=None, extra_cells=(), src=None, tile_ev=False):
    """box: old x0,y0,x1,y1; dest: new top-left; roof: {old A3 kind: new kind}; cut_rows: old rows left out (identical roof rows);
    door: (old door event id, door event name, popup text)"""
    x0, y0, x1, y1 = box; rows = [y for y in range(y0, y1 + 1) if y not in cut_rows]
    S = old if src is None else src; Og = (lambda z, x, y: og(z, x, y)) if src is None else (lambda z, x, y: sog(src, z, x, y))
    ymap = {sy: dest[1] + i for i, sy in enumerate(rows)}; dx = dest[0] - x0
    for sy in rows:
        for sx in range(x0, x1 + 1):
            x, y = sx + dx, ymap[sy]
            if struct_cell(sx, sy, src) or (sx, sy) in extra_cells:
                v0 = Og(0, sx, sy)
                if roof and v0 >= 2048 and kind(v0) in roof: v0 = 2048 + roof[kind(v0)] * 48 + (v0 - 2048) % 48
                s(0, x, y, v0)
            for z in (1, 2, 3, 4, 5):
                v = Og(z, sx, sy)
                if z == 1 and kind(v) in (21, 31, 46): continue
                if v: s(z, x, y, v)
    for e in S["events"]:
        if not e or not (x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1) or e["y"] in cut_rows: continue
        if e["name"].startswith("Miejsce:") or e["name"].startswith("==") or e["id"] in skip_ev: continue
        if door and e["id"] == door[0]: continue
        if tile_ev and len(e["pages"]) == 1 and e["pages"][0]["image"]["tileId"] and not e["note"] and len(e["pages"][0]["list"]) <= 1:
            x, y = e["x"] + dx, ymap[e["y"]]                                  # a tile shown by an event: the tile itself (one event less on the screen)
            if tile_ev != "drop" and not (g(2, x, y) and g(3, x, y)):         # ("drop": left out; a cell with both layers taken keeps what it has)
                s(3 if g(2, x, y) else 2, x, y, e["pages"][0]["image"]["tileId"]); s(5, x, y, 2)
            continue
        c = copy.deepcopy(e); add_ev(c["name"], e["x"] + dx, ymap[e["y"]], c["pages"], c["note"])
    if door:
        de = S["events"][door[0]]; img = de["pages"][0]["image"]
        add_ev(door[1], de["x"] + dx, ymap[de["y"]], [page(img["characterName"], img["characterIndex"], 1, 1, popup_cmd(door[2]), True)])
    print("budynek %-22s -> x%d-%d y%d-%d" % (name, x0 + dx, x1 + dx, ymap[rows[0]], ymap[rows[-1]]))

# the farrier next to the stable yard: the old smithy (open forge), golden thatch like the stable
stamp("Kuźnia podkuwacza", (3, 55, 15, 62), (85, 25), roof={71: 67}, skip_ev=(72, 260, 240, 243),
      door=(134, "Drzwi: Kuźnia podkuwacza", "Kuźnia podkuwacza. Mistrz wyszedł do koni - zamknięte."))
# the brewery on the avenue by the E2 gate: Dom 11's half-timbered body, red tiles, one roof row less
stamp("Browar i słodownia", (41, 65, 47, 73), (106, 38), roof={71: 56}, cut_rows=(66,), skip_ev=(88,),
      door=(235, "Drzwi: Browar", "Browar i słodownia. Kadzie stygną - zamknięte."))
# the carters' inn: Dom 15 with its two dormers, orange tiles
stamp("Zajazd dla woźniców", (17, 25, 23, 33), (106, 54), roof={60: 48},
      door=(259, "Drzwi: Zajazd dla woźniców", "Zajazd dla woźniców. Gospodarz liczy worki - zamknięte."))
# the cattle merchant's log house at the animal market, dark thatch
stamp("Dom handlarza bydła", (93, 57, 97, 62), (106, 20), roof={71: 59},
      door=(197, "Drzwi: Dom handlarza bydła", "Handlarz bydła jest przy zagrodach."))
# the granary: the water-carrier's stone house, plank roof
stamp("Spichlerz", (57, 68, 62, 73), (106, 68), roof={53: 57}, skip_ev=(277, 363),
      door=(137, "Drzwi: Spichlerz", "Spichlerz miejski. Zamknięte na dwie kłódki."))
# the barn with the cowshed: the old stable (gable with the hay loft)
stamp("Stodoła z oborą", (57, 79, 62, 88), (106, 79), door=(209, "Drzwi: Stodoła", "Stodoła z oborą. Zamknięte."))
# the raven post: a gate tower with its cone roof + the grave-digger's small house, black slate
stamp("Kruczarnia (wieża)", (49, 92, 50, 98), (107, 7))
stamp("Kruczarnia (izba)", (17, 9, 21, 12), (109, 10), roof={59: 53},
      skip_ev=(195, 196, 54, 369), door=(57, "Drzwi: Kruczarnia", "Kruczarnia. Kruki śpią - zamknięte."))
# pens of the animal market (log fence, gate at the bottom) and the barn's paddock
def pen(x0, y0, x1, y1, gate_x):
    for x, y in rect(x0, y0, x1, y1):
        if x in (x0, x1) or y in (y0, y1):
            if not (y == y1 and x == gate_x): s(1, x, y, A2(FENCE))
pen(106, 27, 110, 32, 108); pen(112, 27, 116, 32, 114); pen(112, 80, 116, 88, 114)
for x, y in rect(107, 28, 109, 31) + rect(113, 28, 115, 31) + rect(113, 81, 115, 87): s(0, x, y, A2(EARTH))
# barrels by the brewery (the old wall street's three-barrel stacks: tops C67/C68 on layer 3, bodies C75/C76 on layer 2)
for bx, by in ((113, 44), (113, 41)):
    for i, (t, b) in enumerate(((256 + 67, 256 + 75), (256 + 68, 256 + 76), (256 + 67, 256 + 75))):
        s(3, bx + i, by - 1, t); s(2, bx + i, by, b)
for i, (x, y) in {277: (115, 70), 195: (115, 12), 272: (114, 61)}.items():     # a barrel cart by the granary, a barrow, a hay wagon
    e = copy.deepcopy(old["events"][i]); add_ev(e["name"], x, y, e["pages"], e["note"])

# decor in the new lots (copies of the old town's own trees, wagons and scarecrow, notes kept)
for src, spots in {72: [(115, 7), (114, 22), (115, 56), (114, 67), (99, 27), (83, 27)], 272: [(113, 24)], 273: [(99, 70), (99, 82)]}.items():
    for (x, y) in spots:
        e = copy.deepcopy(old["events"][src]); add_ev(e["name"], x, y, e["pages"], e["note"])
# the orchard in the south-east corner lot (apple and pear trees of the old meadow, in rows; the gallows hill goes to x113-116 y95-99)
# (audit 5: one even 4 x 3 grid - columns every 2 cells x106-112, rows every 3 cells y97/100/103, apple and pear in a chequer; the gallows (Zakon: x113-115
# y96-98) stands east of it and stays clear)
for r, y in enumerate((97, 100, 103)):
    for c, x in enumerate((106, 108, 110, 112)):
        k = (r + c) % 2; e = copy.deepcopy(old["events"][(67, 151)[k]]); add_ev(("Jabłoń", "Grusza")[k], x, y, e["pages"], e["note"])
# the chapel lawn's big trees stood with their crowns on the west wall: one / two cells off it
for i, x in ((198, 4), (201, 4), (203, 4)): move_ev(i, x, ev[i]["y"]); done.add(i)
# ================================================================== 7c. ozdoby pustych miejsc (gracz 2026-11-09: „dużo pustych miejsc - ładnie, równo,
# nie kanciasto”; pomysły 1-5 zatwierdzone „wszystkie”, potem „zagęść i zaokrąglij”). Everything aligned on axes / in rows, mirrored
# where formal; the ground patches organic (an ellipse with a gentle wobble, no spurs or notches), the props drawn level with the people.
import math
C, Dd = 256, 512
FLOWERS, EDGING, GRAVEL, PLANKS = 28, 23, 17, 64
def clear_layers(x0, y0, x1, y1, zs=(1, 2, 3)):
    for x, y in rect(x0, y0, x1, y1):
        for z in zs:
            if g(z, x, y): s(z, x, y, 0)
def clear_kind(x0, y0, x1, y1, kinds, z=1):
    for x, y in rect(x0, y0, x1, y1):
        if kind(g(z, x, y)) in kinds: s(z, x, y, 0)
def bench_h(x, y):              # Winlu's bench (C130 / C131 seat) and its legs + shadow under it (C138 / C139)
    s(2, x, y, C + 130); s(2, x + 1, y, C + 131); s(2, x, y + 1, C + 138); s(2, x + 1, y + 1, C + 139)
def grave(x, y, top, bottom):   # a grave: the cross / headstone (y) over its mound (y + 1), both solid
    s(2, x, y, C + top); s(2, x, y + 1, C + bottom)
def haystack(x, y):             # the big haystack 3 x 3: its top over the hero, its body solid, straw at its foot
    for i, t in enumerate((213, 214, 215)): s(3, x + i, y, C + t)
    for i, t in ((0, 221), (2, 223)): s(3, x + i, y + 1, C + t)
    s(2, x + 1, y + 1, C + 222); s(3, x + 1, y + 1, 751)   # (the solid middle under an empty star tile: Cienie.js took it for a box and cast a hard dark rectangle; the stack has straw at its foot of its own)
def copy_event(src, x, y, name=None):
    e = copy.deepcopy(old["events"][src]); return add_ev(name or e["name"], x, y, e["pages"], e["note"])
def level(x, y, t, z=2):        # a small ground prop (a plant, a trough): drawn under the people, nobody steps on it (region 2)
    s(z, x, y, t); s(5, x, y, 2)
def pot(x, y):                  # a clipped bush in a stone pot (the tavern front's own: the bush C5 over the pot C13)
    s(3, x, y, C + 5); s(2, x, y + 1, C + 13)
def organic(cx, cy, rx, ry, seed, wob=0.08):
    """the cells of a rounded patch: an ellipse whose edge wavers a little; no 1-cell spurs, no 1-cell notches"""
    cells = set()
    for y in range(int(cy - ry - 2), int(cy + ry + 3)):
        for x in range(int(cx - rx - 2), int(cx + rx + 3)):
            dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
            a = math.atan2(dy, dx)
            lim = 1 + wob * math.sin(3 * a + seed) + wob * 0.6 * math.sin(5 * a + 2.1 * seed)
            if dx * dx + dy * dy <= lim * lim: cells.add((x, y))
    for _ in range(6):
        def nb(c): return sum((c[0] + a, c[1] + b) in cells for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        drop = {c for c in cells if nb(c) < 2}
        add = {c for c in {(x + a, y + b) for (x, y) in cells for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))} - cells if nb(c) >= 3}
        if not drop and not add: break
        cells = (cells - drop) | add
    return cells
def patch(cells, k):
    for (x, y) in cells: s(0, x, y, A2(k)); s(1, x, y, 0)
def lean_to(x0, y, w, under):   # a plank roof on two posts (the tannery's own: A3 planks, posts B168 / B170), things under it
    for x, yy in rect(x0, y, x0 + w - 1, y + 1):   # (the roof autotile's wall shapes: 1 left edge, 2 top, 4 right, 8 bottom)
        sh = (1 if x == x0 else 0) + (2 if yy == y else 0) + (4 if x == x0 + w - 1 else 0) + (8 if yy == y + 1 else 0)
        s(0, x, yy, 2048 + PLANKS * 48 + sh); s(1, x, yy, 0); s(2, x, yy, 0); s(3, x, yy, 0); s(5, x, yy, 2)
    s(3, x0, y + 2, 168); s(3, x0 + w - 1, y + 2, 170)
    for i, t in enumerate(under): level(x0 + 1 + i, y + 2, t)
    s(5, x0, y + 2, 2); s(5, x0 + w - 1, y + 2, 2)

# ---- 1. the churchyard (gracz 2026-11-10: „cały cmentarz do poprawy: ziemia kwadratowa, metalowy stojak brzydki, mur ładniejszy, wszystko
# ładniejsze”): one walled yard on the chapel's own axis (the door x 8: mirror x <-> 16 - x), built like the author's knights' garden: a slate
# coping (A3 49) on a stone face (A4 109), the Winlu iron gate open in the south wall onto the kerb, a paved alley (the forecourt's stone)
# from the gate to the Order's statue, three mirrored rows of graves (two of Zakon.js's, one of tiles), pines outside the wall.
CEMETERY_X0, CEMETERY_X1, CEMETERY_N, CEMETERY_S, CEMETERY_GATE = 4, 12, 23, 31, (7, 8, 9)
COPING, STONE_FACE, PAVING = 49, 109, KERB
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
import nslib as NS
clear_kind(2, 20, 16, 32, (FLOWERS, 37, 39, 21, 31))
for x, y in rect(2, 19, 16, 32):                                  # (one even lawn: the old dark-grass blob and the earth path go)
    if kind(g(0, x, y)) == 27: s(0, x, y, A2(GRASS))
for x, y in rect(2, 20, 16, 32):
    if Dd <= g(2, x, y) < Dd + 256: s(2, x, y, 0)
for x, y in rect(12, 20, 14, 21): s(2, x, y, 0)                  # (the old bench askew on the flowers, both halves)
bench_h(5, 21); bench_h(10, 21)                                  # (mirrored about the door)
move_ev(419, 10, 22); done.add(419)                              # (kaplica_lawka: by the right bench)
for i, x in ((198, 3), (203, 3), (201, 3)): move_ev(i, x, ev[i]["y"]); done.add(i)
for i, (x, y) in {200: (13, 21), 202: (13, 31)}.items(): move_ev(i, x, y); done.add(i)
t3 = copy.deepcopy(ev[203]); add_ev(t3["name"], 13, 26, t3["pages"], t3["note"])
PINE_NOTE = "<Tree:hits=17,sway=0.6,scale=0.85,dropmin=5,dropmax=7><TreeSize:1>"
for e in ev:                                                     # (the six pines one size: the pairs mirror each other)
    if e and e["name"].startswith("Drzewo") and e["x"] in (3, 13) and 20 <= e["y"] <= 32: e["note"] = PINE_NOTE
# the wall: the coping's ring, the stone face under its north and south runs (one row: a low wall), all of it solid
top = {(x, CEMETERY_N) for x in range(CEMETERY_X0, CEMETERY_X1 + 1)} | {(x, CEMETERY_S) for x in range(CEMETERY_X0, CEMETERY_X1 + 1) if x not in CEMETERY_GATE} | \
      {(x, y) for y in range(CEMETERY_N, CEMETERY_S + 1) for x in (CEMETERY_X0, CEMETERY_X1)}
faceN = {(x, CEMETERY_N + 1) for x in range(CEMETERY_X0 + 1, CEMETERY_X1)}
faceS = {(x, CEMETERY_S + 1) for x in range(CEMETERY_X0, CEMETERY_X1 + 1) if x not in CEMETERY_GATE}
for (x, y) in top:
    sh = NS.wall_shape(lambda a, b, x=x, y=y: (x + a, y + b) in top)
    s(0, x, y, 2048 + COPING * 48 + sh); s(1, x, y, 0); s(2, x, y, 0); s(3, x, y, 0); s(5, x, y, 2)
for run in (faceN, faceS):
    for (x, y) in run:
        sh = NS.wall_shape(lambda a, b, x=x, y=y: (x + a, y + b) in run or (b == 0 and (x + a, y + b) in top))   # (no end line where it meets the side walls)
        s(0, x, y, 2048 + STONE_FACE * 48 + sh); s(1, x, y, 0); s(2, x, y, 0); s(3, x, y, 0); s(5, x, y, 2)
# the alley and the kerb under the gate in one stone
for x, y in rect(7, 25, 9, 33):
    s(0, x, y, A2(PAVING)); s(1, x, y, 0); s(2, x, y, 0); s(3, x, y, 0); s(5, x, y, 0)
for x, y in rect(2, 33, 15, 33): s(1, x, y, 0)
copy_event(47, 8, 25, "Posąg zakonu na cmentarzu")               # (the chapel's own knight at the alley's end, on the axis)
add_ev("Brama cmentarza (otwarta)", 8, 32, [page("!$SF_Gate3", 0, 0, 1, None, True, True, 2, 6)])   # (the overgrown iron gate, open: its leaves at the sides)
# the third row of graves, of the tiles (Zakon.js's two rows stand at y 26 and 28), mirrored; low flowers in the corners behind the first row
for x, (a, b2) in ((5, (212, 220)), (6, (210, 218)), (10, (210, 218)), (11, (212, 220))):
    grave(x, 29, a, b2)
for x, t in ((5, 184), (11, 184), (6, 196), (10, 196)): level(x, 25, Dd + t)

# ---- 1b. the chapel's side tower and the gravedigger's front yard (gracz 2026-11-10: „budynek ucięty, trawa kwadratowa, sztywna”): the
# tower's picture was drawn to stand against a wall on its RIGHT - it stood free, its flat side cut off: mirrored, it now leans on the chapel.
# The straight cobble band from the door goes: an earth path with a soft edge that bends once, a kerb along the street like every other lot,
# dark grass in rounded patches, a small tree and bushes; the haystack behind the tower goes.
ev[54]["pages"][0]["image"].update({"characterName": "!$Kaplica_Dobudowka", "direction": 2, "pattern": 1, "characterIndex": 0}); done.add(54)
for x, y in rect(14, 10, 16, 12):
    for z in (1, 2, 3): s(z, x, y, 0)
for x, y in rect(14, 13, 23, 16):
    s(0, x, y, A2(GRASS)); s(1, x, y, 0); s(2, x, y, 0); s(3, x, y, 0)
for x in (17, 18, 19, 20, 21, 22, 23): s(0, x, 17, A2(KERB)); s(1, x, 17, 0)
for (x, y) in {(19, 13), (20, 13), (21, 13), (19, 14), (20, 14), (21, 14), (18, 15), (19, 15), (20, 15), (18, 16), (19, 16), (20, 16)}:
    s(0, x, y, A2(GRAVEL))
patch({c for c in organic(15.5, 14.5, 2.2, 1.9, 2.4) if c[1] <= 16 and c[0] >= 14}, 27)
patch({c for c in organic(22.6, 14.6, 1.6, 2.0, 5.1) if c[0] <= 23 and c[1] <= 16 and (c[0], c[1]) not in {(21, 13), (21, 14)}}, 27)
for x, y, t in ((17, 13, 193), (17, 14, 196), (22, 13, 193), (23, 13, 196)): level(x, y, Dd + t)
for x, y in ((23, 16), (21, 16)): level(x, y, Dd + 186)
copy_event(72, 22, 15, "Małe drzewo przy chacie grabarza")
for x, y in rect(14, 10, 16, 13):                                # (behind the tower: a soft tuft patch instead of the hay)
    if (x + y) % 2 == 0 and not g(5, x, y): s(1, x, y, A2(21))

# ---- 2. the castle courtyard: two lawns as one mirrored formal garden (axis x 51.5 between the gate's lamps), each lawn mirrored in itself
# (x 38.5): a flower bed at the top centre between two potted bushes, a bench under it facing the gate road, low flower troughs either side
# of the bench, red roses in the bottom corners, a tree at each end, lamps at the far corners
for x, y in rect(73, 21, 74, 26):                                # (the east lawn two cells longer than the west one: cut to its mirror)
    s(0, x, y, A2(ROAD)); s(1, x, y, 0); s(2, x, y, 0); s(3, x, y, 0); s(5, x, y, 0)
for y in range(21, 27): s(1, 72, y, A2(EDGING))
mir = lambda x: 103 - x
both = lambda x: (x, mir(x))
clear_kind(31, 21, 46, 26, (FLOWERS,)); clear_kind(57, 21, 72, 26, (FLOWERS,))
for x, y in rect(31, 20, 47, 27) + rect(56, 20, 74, 27):
    if g(2, x, y) in (C + 130, C + 131, C + 138, C + 139): s(2, x, y, 0)
for i in (112, 118): ev[i] = None; deleted.append((i, "Drzewo (ozdobne)", "dziedziniec"))
for i, (x, y) in {86: (33, 24), 102: (44, 24), 111: (mir(33), 24), 109: (mir(44), 24)}.items():
    if i != 86: ev[i]["pages"] = copy.deepcopy(ev[86]["pages"]); ev[i]["note"] = ev[86]["note"]
    if "<TreeSize:" not in ev[i]["note"]: ev[i]["note"] += "<TreeSize:1>"
    move_ev(i, x, y); done.add(i)
for X in (38, 39):
    for x in both(X):
        for y in (22, 23): s(1, x, y, A2(FLOWERS))
for X in (36, 41):
    for x in both(X): pot(x, 22)
bench_h(38, 24); bench_h(mir(39), 24)
for X in (34, 35, 36, 41, 42, 43):                                 # two low flower strips either side of the bench
    for x in both(X): s(1, x, 25, A2(FLOWERS))
for X in (32, 45):
    for x in both(X): s(2, x, 25, Dd + 184)
for (x, y) in ((31, 21), (31, 26), (mir(31), 21), (mir(31), 26)): copy_event(127, x, y)

# ---- 3. the herb garden by the town hall (the old plot with the weapon racks): a rounded bed of earth, two rows of herbs mirrored about
# its middle (x 96), the path between them; a potted bush at each end of the lawn
for i in (220, 255, 256): deleted.append((i, old["events"][i]["name"], "ogrod ziol")); ev[i] = None
for x, y in rect(91, 37, 101, 41):
    if kind(g(0, x, y)) in (GRAVEL, EARTH): s(0, x, y, A2(GRASS))
    for z in (2, 3):
        if C <= g(z, x, y) < Dd: s(z, x, y, 0)
patch({c for c in organic(96.5, 39.5, 4.6, 2.35, 1.3, 0.05) if kind(g(0, *c)) == GRASS}, GRAVEL)
HERB = {38: (188, 196, 187, 185, 187, 196, 188), 40: (193, 187, 196, 188, 196, 187, 193)}
for y, row in HERB.items():
    for i, t in enumerate(row): level(93 + i, y, Dd + t)
pot(91, 38); pot(101, 38)

# ---- 4. the water carrier's yard + the little square: water barrels in a row, the cart, a trough; the square: one tree in a ring of
# flowers in the middle of a round gravel patch, a bench either side of it (the haystack, the flower carpet and the tall-grass box go)
for x, y in rect(57, 64, 64, 66): s(2, x, y, 0); s(3, x, y, 0); s(5, x, y, 0)
for x in (56, 57, 58): s(3, x, 65, C + 67); s(2, x, 66, C + 75)
s(2, 63, 66, C + 146); s(2, 64, 66, C + 147)                       # (the water trough, by the cart)
clear_layers(63, 67, 73, 73, zs=(2, 3)); clear_kind(63, 64, 73, 73, (FLOWERS, 21, 29, 31, 36, 37))
ev[279] = None; deleted.append((279, "Drzewo (ozdobne)", "skwer"))
move_ev(278, 69, 70); done.add(278)
if "<TreeSize:" not in ev[278]["note"]: ev[278]["note"] += "<TreeSize:2>"
patch({c for c in organic(69.5, 70.6, 3.9, 2.5, 2.2, 0.06) if kind(g(0, *c)) == GRASS}, GRAVEL)
bench_h(66, 70); bench_h(71, 70)
for (x, y) in ((68, 70), (70, 70), (68, 71), (69, 71), (70, 71)): level(x, y, Dd + (196 if (x + y) % 2 else 193))
move_ev(411, 69, 72); done.add(411)                              # (skwer: on the gravel in front of the tree, the people wander round it)

# ---- 5. the field by the south wall: the W6 camp's place (x 77-91, y 97-100) stays open grass; north - three haystacks in a row; south - a
# rounded threshing floor with the hay wagon between two hay lean-tos; four bushes at the corners; east - a fenced pasture with a lean-to,
# a trough, a closed gate and sheep
for x, y in rect(76, 100, 92, 104):
    if kind(g(0, x, y)) in (GRAVEL, EARTH): s(0, x, y, A2(GRASS))
for hx in (78, 83, 88): haystack(hx, 94)
lean_to(76, 102, 5, (C + 221, C + 222, C + 223)); lean_to(88, 102, 5, (C + 221, C + 222, C + 223))
patch({c for c in organic(84.5, 102.6, 3.3, 1.9, 0.7, 0.05) if kind(g(0, *c)) == GRASS and 81 <= c[0] <= 87}, GRAVEL)
copy_event(272, 84, 103)
for (x, y) in ((76, 94), (92, 94), (76, 99), (92, 99)): level(x, y, Dd + 186)
pen(93, 94, 100, 104, None)                                        # (closed: the sheep stay in; the hero has nothing to do inside)
for x, t_top, t_bot in ((96, 208, 216), (97, 209, 217)):           # the gate, shut, in the bottom fence
    s(1, x, 104, 0); s(3, x, 103, C + t_top); s(2, x, 104, C + t_bot); s(5, x, 103, 2)
lean_to(94, 95, 4, (C + 229, C + 230))                              # (the sheep's shelter: straw under it)
s(2, 98, 98, C + 146); s(2, 99, 98, C + 147)
SHEEP = {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
         "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
         "directionFix": False, "image": {"tileId": 0, "characterName": "$Animal_Sheep", "direction": 2, "pattern": 1, "characterIndex": 0},
         "list": [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 2,
         "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 2,
         "moveType": 1, "priorityType": 1, "stepAnime": False, "through": False, "trigger": 0, "walkAnime": True}
for (x, y) in ((95, 99), (97, 101), (95, 102), (98, 100)): add_ev("Owca na pastwisku", x, y, [copy.deepcopy(SHEEP)])
# ================================================================== 7d. audit fixes 2026-11-10 (docs/audyt_map/Map008.json, numbers = its list order)
# 1. the stepped Dom 11 (the author's own design, kept) lost its lean-to's two roof stubs + brace (they ended in mid-air) on its own lot and on the
#    moved Kamienica; the Kamienica's full-cell dark shadow column beside it goes too
for (x, ys, shadow) in ((48, range(67, 72), ()), (25, range(99, 104), range(98, 106))):
    for y in ys:
        for z in (2, 3, 5): s(z, x, y, 0)
    s(2, x, max(ys) + 1, 0); s(5, x, max(ys) + 1, 0)        # (the third roof piece, 1020, over the crates)
    for y in shadow: s(4, x, y, 0)
# 2. the stable yard: a paddock - grass, with trodden earth in rounded patches round the troughs (x83), the stable door, the yard gate and along the
#    fence; props only outside the horses' rectangle (x84-98 y11-22)
paint(83, 5, 99, 23, GRASS)
for x, y in rect(83, 5, 99, 23): s(1, x, y, 0)
trodden = set()
# (one smooth oval by the troughs, a worn path of overlapping small ovals from the door to the gate, an oval at the wagon: no stepped blobs)
_ovals = [(85.4, 19.0, 2.4, 4.0, 1.1), (97.4, 22.4, 2.3, 1.4, 4.1)] + [(92.0 + 7.5 * k / 6, 11.8 + 2.3 * k / 6, 1.8, 1.4, 0.3 * k) for k in range(7)]
for cx, cy, rx, ry, sd in _ovals:
    trodden |= {c for c in organic(cx, cy, rx, ry, sd, 0.04) if 83 <= c[0] <= 99 and 5 <= c[1] <= 23}
patch(trodden, GRAVEL)
haystack(97, 6)                                          # (north-east corner, outside the horses' rectangle)
# 3. the west gate: the canopy + door-leaf pictures (cut by the tower above, posts on the tower's foot) go - a plain opening between the towers like
#    the W2 gate; the dark shadow cell beside both openings goes
for i in (243, 244): deleted.append((i, ev[i]["name"], (ev[i]["x"], ev[i]["y"]))); ev[i] = None
for y in (49, 105): s(4, 2, y, 0)
# 4. the front garden of the house at x9-: a closed fence ring with the gate at the bottom, an even bed (3 x 5 inside, cabbages in rows)
for x, y in rect(4, 98, 8, 105):
    for z in (1, 2): s(z, x, y, 0)
plot(4, 99, 8, 105, 6)
# 6. the cabbage plots: the third plot's top fence on the same line (y66) as the other two, its soil starting on the same row
for x in range(19, 25): s(0, x, 66, A2(GRASS)); s(1, x, 66, A2(FENCE))
for x in range(19, 24): s(1, x, 67, 0)
for x in range(20, 24): s(0, x, 67, A2(17))
# 7. the wall's inner edge: the dashed tile (B139 / B140, white blocks every second cell) on layer 3 goes - the wall's own face runs on unbroken
for y in range(H):
    if g(3, 118, y) == 139: s(3, 118, y, 0)
    if g(3, 1, y) == 140: s(3, 1, y, 0)
# 12. the south-east corner: the wall's stub under the tower (a notched cap on a one-cell column) goes, the cliff takes the column and the fence
#     ends in a post against it
for z in (2, 3): s(z, 119, 115, 0)
s(3, 118, 115, 0); s(1, 118, 115, 0); s(1, 119, 115, 0)
for y in range(116, 120): s(0, 119, y, g(0, 118, y))
s(1, 118, 116, 0)
# 14. the tree by the tavern with its crown over the wall top
deleted.append((194, ev[194]["name"], (ev[194]["x"], ev[194]["y"]))); ev[194] = None

# ================================================================== 7e. the six new buildings 2026-11-11 (docs/NASTEPNYM_RAZEM.md part 2; they only stand: a locked
# door with a short popup, no interior yet). Pieces of Winlu's own palette (Map101, tileset 11) and of the old Winlu town, copied whole with a roof
# recoloured, like 7b; TAWERNA_NO_NEW6=1 builds the town without them (the "before" pictures).
#   Wiatrak (stone mill, thatch cap, sails)  lot of the south fields, x 95-99 y 80-88    Cech (guild house)  same lot, x 87-93 y 79-88
#   Łaźnia (bathhouse, chimney)           field lot north of the track, x 94-99 y 68-73   Przytułek (almshouse) by the camp, x 93-99 y 96-104
#   Garbarnia (tannery + hide rack)       the barn's paddock, x 112-116 y 79-88           Sukiennice (cloth hall)  south side of the market square
if not os.environ.get("TAWERNA_NO_NEW6"):
    pal = json.load(open(os.path.join(ROOT, "data", "Map101.json"), encoding="utf-8"))
    def clear_plot(x0, y0, x1, y1, ground=GRASS):
        """a plot freed for a building: ground, every layer and the loose events on it go (a Miejsce: marker would stop the build)"""
        for x, y in rect(x0, y0, x1, y1):
            if ground is not None: s(0, x, y, A2(ground))
            for z in range(1, 6): s(z, x, y, 0)
        for i in events_in(x0, y0, x1, y1):
            e = ev[i]
            if e["name"].startswith("Miejsce:"): raise SystemExit("STOP: a marker on a new building's plot: %d %s %s" % (i, e["name"], (e["x"], e["y"])))
            deleted.append((i, e["name"], (e["x"], e["y"]))); ev[i] = None
    # -- Cech + Wiatrak + Łaźnia: the south field lots (the day-labour field pole_3 at x 77-83 stays; plots 2 and 3 of the lot make room)
    clear_plot(85, 78, 100, 88); paint(85, 78, 100, 78, KERB)
    clear_plot(93, 67, 99, 73)
    stamp("Cech (dwie kamienice)", (34, 3, 40, 12), (87, 79), roof={71: 50}, src=pal, tile_ev=True,
          door=(27, "Drzwi: Cech", "Dom cechowy. Mistrzowie obradują za zamkniętymi drzwiami."))
    # the bathhouse: the thatched cottage's plastered walls with a dark red roof (its bow sign stays behind), a chimney on the roof slope, a plain wooden door
    stamp("Łaźnia miejska", (2, 43, 7, 46), (94, 70), roof={59: 56}, src=pal, skip_ev=(121,),
          door=(120, "Drzwi: Łaźnia miejska", "Łaźnia miejska. Piec dopiero się rozgrzewa - zamknięte."))
    # -- Przytułek: the sheep pasture by the camp goes, the almshouse (the healer's house with the potion sign) takes its place
    clear_plot(92, 93, 100, 104)
    stamp("Przytułek", (30, 18, 36, 26), (93, 96), roof={60: 59}, src=pal,
          door=(64, "Drzwi: Przytułek", "Przytułek. Siostra karmi chorych - zamknięte."))
    # -- Garbarnia: the barn's paddock (decor of mine) gives room to a log house and a hide rack
    clear_plot(112, 79, 116, 88)
    stamp("Garbarnia (chata)", (93, 57, 97, 62), (112, 83), roof={71: 68}, tile_ev="drop",
          door=(197, "Drzwi: Garbarnia", "Garbarnia. Skóry moczą się w kadziach - zamknięte."))
    # the hide rack: two posts and a rail, a tanned hide hanging from it (the washing line's own tiles, C233-C255), nobody walks through it
    for x, y, t in ((112, 79, 232), (113, 79, 234), (114, 79, 233), (115, 79, 234), (116, 79, 239), (112, 80, 240), (113, 80, 242), (115, 80, 242),
                    (116, 80, 247), (112, 81, 248), (116, 81, 255)):
        level(x, y, C + t)
    # -- the shadows the palette's pieces carried (layer 4) go; Cienie.js casts the real ones. The palette has no regions: every cell of the piece that
    # carries a roof, a wall or a thing is region 2 (blocks, level) - no pocket of standable cells inside a house, no walking into a potted bush
    for (x0, y0, x1, y1) in ((87, 79, 93, 88), (94, 70, 99, 73), (93, 96, 100, 104)):
        for x, y in rect(x0, y0, x1, y1):
            s(4, x, y, 0)
            if (kind(g(0, x, y)) or 0) >= 48 or g(2, x, y) or g(3, x, y): s(5, x, y, 2)
    paint(92, 93, 100, 93, KERB)                                   # (the pasture's top kerb was cleared with it)
    s(0, 99, 66, A2(KERB))
    # -- the bathhouse's chimney: on the roof slope, two cells (a stone top and its stack), smoke from Klimat_Miasta
    s(3, 97, 70, 83); s(3, 97, 71, 91); s(5, 97, 70, 2); s(5, 97, 71, 2)
    # -- the almshouse's thatch: the top row's ridge beam (a dark rail with posts) goes - the top edge shape without its top bit is plain thatch
    for x in range(93, 100):
        v = g(0, x, 96)
        if kind(v) == 59: s(0, x, 96, v - ((v - 2048) % 48 & 2))
    # -- Wiatrak: a stone body 5 x 5 (A4 grey stone, region 2; two slit windows, a wooden door in the middle), a thatch cap
    # (a picture of its own, !$Wiatrak_Czapa, tools/miasto5/wiatrak_czapa.py) and the sails (!$Wiatrak_Skrzydla*, 5 tiles across) turning in front of the
    # cap's foot: twelve frames over a quarter turn (3 sheets x 4 direction rows, the middle column), changed by a move route (the way the town's water
    # wheel turns): picture, direction, wait. Three events: the cap, the sails, the door.
    clear_plot(94, 80, 100, 88)
    MX, MY0, MY1 = 95, 83, 87
    for x in range(MX, MX + 5):
        for y in range(MY0, MY1 + 1):
            s(0, x, y, 2048 + 105 * 48 + (1 if x == MX else 0) + (2 if y == MY0 else 0) + (4 if x == MX + 4 else 0) + (8 if y == MY1 else 0)); s(5, x, y, 2)
    for x in (MX + 1, MX + 3): s(3, x, 85, 42)
    add_ev("Drzwi: Wiatrak", 97, 87, [page("!Fantasy_door1", 5, 1, 1, popup_cmd("Wiatrak. Młynarz mieli zboże na jutro - zamknięte."), True)])
    cap = page("!$Wiatrak_Czapa", 0, 0, 2, None, True, True, 1, 2)
    add_ev("Czapa wiatraka", 97, 83, [cap])
    SAILS = ["!$Wiatrak_Skrzydla", "!$Wiatrak_Skrzydla_2", "!$Wiatrak_Skrzydla_3"]
    route = []
    for f in range(12):
        route += [{"code": 41, "parameters": [SAILS[f // 4], 0]}, {"code": (16, 17, 18, 19)[f % 4], "parameters": []}, {"code": 15, "parameters": [7]}]
    sp = page(SAILS[0], 0, 0, 2, None, False, True, 1, 2)
    sp.update({"moveType": 3, "moveFrequency": 5, "moveSpeed": 3, "moveRoute": {"list": route + [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False}})
    add_ev("Skrzydła wiatraka", 97, 86, [sp])
    # -- Sukiennice: the castle's own arcade (a gallery of arches on posts, slice x 41-50 of the old map: post - arch - post - arch - post - arch - post),
    # a red roof over it and the ground floor under it, 10 wide on the axis of the well and the avenue (x 47-56, the axis at x 52.0); two door leaves in the
    # middle, a pair of lit windows each side. South of the well's plaza, between the two planters; nothing of the square's markers stands on it.
    clear_plot(47, 55, 56, 62, None)
    SX0, SY0, SROOF = 47, 55, 63
    for c in range(10):
        x = SX0 + c
        for r in range(3):
            s(0, x, SY0 + r, 2048 + SROOF * 48 + (1 if c == 0 else 0) + (2 if r == 0 else 0) + (4 if c == 9 else 0) + (8 if r == 2 else 0))
        for r, sy in ((3, 8), (4, 9)):
            s(0, x, SY0 + r, A2(43))
            for z in (2, 3): s(z, x, SY0 + r, og(z, 41 + c, sy))
        for r in range(3): s(0, x, SY0 + 5 + r, A2(97))
        for r in range(8): s(5, x, SY0 + r, 2)
    for c in (1, 2, 7, 8): s(3, SX0 + c, SY0 + 5, 55); s(3, SX0 + c, SY0 + 6, 63)
    for x in (51, 52):
        add_ev("Drzwi: Sukiennice", x, 62, [page("!Fantasy_door1", 3, 1, 1, popup_cmd("Sukiennice. Kramarze rozstawią się w dzień targowy - zamknięte."), True)])

# ================================================================== 7b. questy_mapa (2026-11-11): markers "Miejsce: <key>" before the doors of the six new buildings
# (docs/questy_mapa/PLAN.md point 7: the places the miller / the guild guests / Ciotka Stefa / Ignac / the seamstress stand at). The table is
# tools/questy_mapa/markery_miasta.py (shared with tools/questy_mapa/zastosuj.py, which puts the same markers on the CURRENT data/Map008.json:
# a rebuild from this script would undo the editor changes made since the install). A marker is a no-picture, through, below-the-hero event.
sys.path.insert(0, os.path.join(ROOT, "tools", "questy_mapa"))
import markery_miasta as QM
for key, (mx, my, md, what) in QM.MARKERY.items():
    add_ev("Miejsce: " + key, mx, my, [page("", 0, 0, 0, None, False, True, 1, md)])

# ================================================================== 8. delete what stood in the wiped parts and was not moved
for zone in [(82, 5, 117, 33), (102, 0, 119, 119), (75, 67, 101, 119), (0, 92, 119, 119)]:
    for i in events_in(*zone):
        if i in done or i in reserved: continue
        e = ev[i]
        if e["name"].startswith("Miejsce:"): raise SystemExit("STOP: a marker would be deleted: %d %s %s" % (i, e["name"], (e["x"], e["y"])))
        if i in {a for a, *_ in added}: continue
        deleted.append((i, e["name"], (e["x"], e["y"]))); ev[i] = None
while ev and ev[-1] is None: ev.pop()

# ================================================================== 8b. chimneys (gracz 2026-11-09: „źle dopasowane elementy i komin”)
# a chimney top (B83) stuck on a gable's timber wall with a stack (B91) on the plaster below it: out - the house has its chimney on the
# roof (the author's gable houses: the bakery, the carpenter's, the old stable, its copy the barn); the pots chimney (B87, a light
# stone base) on a dark stack (B94): the light stack with the same roof cut (B92)
for y in range(H - 1):
    for x in range(W):
        if g(3, x, y) == 83 and (kind(g(0, x, y)) or 0) >= 80 and g(3, x, y + 1) == 91:
            s(3, x, y, 0); s(3, x, y + 1, 0)
        if g(3, x, y) == 87 and g(3, x, y + 1) == 94: s(3, x, y + 1, 92)
# a lone barrel (Winlu's C67 / C68 / C125: the whole barrel in one tile, flagged ☆ and passable - the hero walked into it, gracz
# 2026-11-09 „gracz wchodzi na beczkę”): region 2 - blocks and stands level with the people (RegionLayers); a barrel's top over its
# own lower half (C75 / C76, solid) too - standing on the top's cell put the hero inside the barrel
for y in range(H):
    for x in range(W):
        if g(3, x, y) in (256 + 67, 256 + 68, 256 + 125): s(5, x, y, 2)     # (a barrel's top over its lower half too: behind it = inside it)
# the bakery (gable roof, its only chimney was the one on the gable): the carpenter's chimney on its roof - two rows under the ridge
# on the left slope, the roof's tile moved down a layer under it (as the carpenter's own: E177 on layer 2, pots B87 + stack B92 on 3)
for (x, y) in ((35, 66), (35, 67)):
    if g(3, x, y) == 768 + 177 and not g(2, x, y): s(2, x, y, 768 + 177); s(3, x, y, 0)
if not g(3, 35, 66) and not g(3, 35, 67): s(3, 35, 66, 87); s(3, 35, 67, 92)
# leftovers of the moved houses on the wiped lots (the old Dom 13's roof row 66 was kept by the wipe): no star tile on bare street
for x in range(75, 102):
    if kind(g(0, x, 66)) in (ROAD, KERB, GRASS):
        for z in (2, 3): s(z, x, 66, 0)
# ================================================================== 9. autotile shapes round everything touched
ring = WS.ring(touched, 1)
for z in (0, 1): WS.reshape(m, z, ring)
# ================================================================== 10. step 2 of the map polish (2026-11-10): round angular lawn / earth / dark-grass patches
#   (tools/poprawki_krok2/zaokraglij.py: only near stray cells, rectangles and straight runs; fences, walls, paving, roads, doors, shore untouched)
sys.path.insert(0, os.path.join(ROOT, "tools", "poprawki_krok2"))
import zaokraglij as ZK
ZK_STATS = ZK.zaokraglij(m, 8) if not os.environ.get("TAWERNA_NO_ZK") else {"zmienione": 0, "klastry": 0}   # (TAWERNA_NO_ZK=1: build without this step, for the path check)
print("ground rounding (step 2): %d cells, %d clusters" % (ZK_STATS["zmienione"], ZK_STATS["klastry"]))
assert all(e is None or e["id"] == i for i, e in enumerate(ev))

out = os.path.join(HERE, "staging", "data"); os.makedirs(out, exist_ok=True)
open(os.path.join(out, "Map008.json"), "wb").write(WS.map_text(m).encode("utf-8"))
json.dump({"moved": moved, "deleted": deleted, "added": added, "replaced": repl}, open(os.path.join(HERE, "staging", "zdarzenia.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print("events: moved %d, deleted %d, added %d; total %d" % (len(moved), len(deleted), len(added), sum(1 for e in ev if e)))
print("staged", os.path.join(out, "Map008.json"))
