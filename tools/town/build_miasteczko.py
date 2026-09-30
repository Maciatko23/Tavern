# python build_miasteczko.py  -> tools/town/staging/Map008_C2.json (+ _meta.json)
# The town around the tavern, layout C "Tarasy na wzgórzu twierdzy" (the user's choice, 2026-09-29), rebuilt from the tileset
# author's own pieces on the proposed town tileset 11 (town_tileset.py = his tileset 1, his passage flags):
#   - town walls all round (the author's fortress wall rows: merlons B(8..10,0), plank walkway A2 k33 + B(9,1), top A4 k97,
#     face A4 k105; the W / E walls as 2-wide k97 ramparts), round towers B(13..14,0..6) at the corners, beside the gates and
#     along the walls; the south town gate (the exit to Polna droga) and the east gate (the exit to the Lord's manor)
#   - the upper terrace = the fortress courtyard: today's tavern (tiles + events, door id 7 unchanged), the temple (the
#     author's keep front), two timber houses, the tower with the blue helmet, the order's graves
#   - the inner fortress wall with the author's castle gate (brama_zamkowa: towers, statues, the gatehouse), stairs through
#     the gate down the rock to the market terrace (in place of his drawbridge)
#   - the market terrace: the dry well, stalls, braziers, the town hall, the bakery, the shop, the shoemaker, a house
#   - the rock edge (the author's A5 cliff, stepped, never one straight line) with two stairs
#   - the crafts terrace: the herbalist, the old mill over the dry stream bed (its wheel stands still), the Lord's garrison
#     post, the smithy, a house, the refugee camp inside the south-east corner of the wall
# Every building is a prefab (prefabs.py: copied tile-for-tile from the author's maps). What looks solid blocks: the
# author's flags close his roofs, walls, towers and props; the A3 / A4 cells his flags leave open (timber upper storeys,
# wall tops) get invisible blockers exactly under them (close_solids); pictures close their own footprint.
# Nothing here writes data/.
import os, sys, json, copy, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "newstart"))
sys.path.insert(0, os.path.join(HERE, "..", "tavern"))
from townlib import Town, msg, picture_event, CAST, STAGING, load_json
from nslib import A5, B, C, D, E, noise, blob, patch, ring, write_map
from engine import Engine, occupy_cells
import prefabs as P
import check_miasteczko as CHK
import town_tileset as TT

W, H = 52, 59
SLOT = TT.SLOT
SIGNPOST = ["Drogowskaz. Na południe: brama miejska i Polna droga.", "Na wschód: brama wschodnia i Posiadłość Lorda."]
LORD_BANNER = ("!Flags_banner", 0, 4)      # red with the black horse: Lord Zaleski's colours (his manor: red roofs, red shield)
ORDER_BANNER = ("!Flags_banner", 1, 2)     # dark with a red ring: the old order of Krucze Skały (the Heart)

def flags():
    return load_json(os.path.join(STAGING, "Tilesets_town.json"))[SLOT]["flags"]

def is_star(fl, t):
    return 0 <= t < len(fl) and (fl[t] & 0x10) != 0

class Town11(Town):
    def __init__(self):
        TT.build()
        Town.__init__(self, "C2", W, H, "Miasteczko - koncepcja C z prefabrykatów autora", 5211)
        self.props["tilesetId"] = SLOT
        self.fl = flags()
        self.stamped = []           # (key, x0, y0, x1, y1)
        self.wall_cells = set()     # the walls' cells (the walkway included): all closed
        self.passages = set()       # gate passages and stairs: always walkable, nothing placed on them

    # ------------------------------------------------------------------------------------------------ prefabs
    def stamp(self, key, x, y, name=None, drop=None, dry=16):
        """a prefab put exactly as the author drew it (all layers of its rectangle replaced); its A1 / A2 ground becomes
        kinds (their edges follow the neighbours); water (A1, A2 k44 / k45) becomes dry ground (kind `dry`); its events
        come along (drop(ev) -> True leaves one out). Returns [(x, y, event)] of the events put."""
        pf = P.load(key)
        for z in range(4):
            for j, row in enumerate(pf["layers"][z]):
                for i, t in enumerate(row):
                    c = (x + i, y + j)
                    if not self.inside(*c): continue
                    if not t:
                        self.layers[z].pop(c, None); continue
                    if 2048 <= t < 2048 + 48 * 48:
                        k = (t - 2048) // 48
                        if k < 16 or k in (44, 45):
                            if z == 0: self.layers[z][c] = ("k", dry)
                            else: self.layers[z].pop(c, None)
                            continue
                        if z < 2:
                            self.layers[z][c] = ("k", k); continue
                    self.layers[z][c] = ("t", t)
        for j, row in enumerate(pf["layers"][4]):
            for i, v in enumerate(row):
                c = (x + i, y + j)
                if v: self.shadow[c] = v
                else: self.shadow.pop(c, None)
        put = []
        for ev in pf["events"]:
            if drop and drop(ev): continue
            e = {k: copy.deepcopy(ev[k]) for k in ("name", "note", "pages")}
            ex, ey = x + ev["x"], y + ev["y"]
            self.add(ex, ey, e, occupy_cells(ex, ey, e.get("note")))
            put.append((ex, ey, e))
        for c in self.rect(x, y, x + pf["w"] - 1, y + pf["h"] - 1):
            self.owner[c] = name or key
        self.keep_free |= self.rect(x, y, x + pf["w"] - 1, y + pf["h"] - 1)
        self.stamped.append((key, x, y, x + pf["w"] - 1, y + pf["h"] - 1))
        return put

    def building(self, key, x, y, bkey, name, kind="dom", interior=False, npc=None, note="", sign=None, banner=None,
                 add_door=None, drop=None, label=None, dry=16, door_event=None, clear=()):
        """a prefab as one of the town's buildings: its first door (!Fantasy_door*, !$Gate_*) becomes the building's door
        (interior: 'the interior comes in the next stage'; else closed), other doors closed; sign = a !Signs frame for its
        sign(s); banner = a !Flags_banner frame for its banners; add_door = (dx, dy) a door where the prefab has none"""
        put = self.stamp(key, x, y, name=name, drop=drop, dry=dry)
        doors = [(ex, ey, e) for ex, ey, e in put if e["pages"][0]["image"]["characterName"].startswith(("!Fantasy_door", "!$Gate"))]
        for (cx, cy) in clear:                  # (props the author put where the new door's front is)
            for z in (2, 3): self.layers[z].pop((x + cx, y + cy), None)
        if add_door:
            dx, dy = add_door
            for z in (2, 3): self.layers[z].pop((x + dx, y + dy), None)
            e = picture_event("Drzwi: " + name, "!Fantasy_door1", 2, 2, 1, priority=1, trigger=0, cmds=[])
            self.add(x + dx, y + dy, e, [(x + dx, y + dy)])
            doors.insert(0, (x + dx, y + dy, e))
        if door_event:                          # one of the prefab's own events is the way in (the smithy: behind the forge)
            ev = next(t for t in put if (t[0] - x, t[1] - y) == tuple(door_event))
            doors.insert(0, ev)
        text = self._door_text(name, interior)
        for i, (ex, ey, e) in enumerate(doors):
            e["name"] = "Drzwi: " + name if i == 0 else "Drzwi boczne: " + name
            e["note"] = (e.get("note") or "") + ("<Town:door=%s>" % bkey if i == 0 else "")
            lst = msg(*(text if i == 0 else ["Drzwi zamknięte."])) + [{"code": 0, "indent": 0, "parameters": []}]
            for pg in e["pages"]:
                pg["list"] = copy.deepcopy(lst); pg["trigger"] = 0
        for ex, ey, e in put:
            im = e["pages"][0]["image"]
            if sign and im["characterName"] == "!Signs":
                im["characterIndex"], im["direction"], im["pattern"] = sign
                e["name"] = "Szyld: " + name
            if banner and im["characterName"] == "!Flags_banner":
                im["characterName"], im["characterIndex"], im["direction"] = banner
                e["name"] = "Chorągiew: " + name
        pf = P.load(key)
        door = [doors[0][0], doors[0][1]] if doors else None
        b = {"key": bkey, "name": name, "kind": kind, "interior": interior, "rect": [x, y, x + pf["w"] - 1, y + pf["h"] - 1],
             "door": door, "front": [door[0], door[1] + 1] if door else None, "npc": npc, "note": note, "label": label or name, "prefab": key}
        self.buildings.append(b)
        return b, put

    # ------------------------------------------------------------------------------------------------ people
    def npc_near(self, key, tx, ty):
        """an NPC spot on the free cell nearest to (tx, ty) that is reachable on foot (the engine's own rules), not a door's
        front, not taken"""
        data, events = self.resolve(), self.build_events()
        eng = Engine(self.W, self.H, data, self.fl, events)
        start = (self.south_xs[1], self.H - 2)
        reach = eng.reach([start])
        fronts = {tuple(b["front"]) for b in self.buildings if b.get("front")}
        used = {(x, y) for (_, x, y, _) in self.npcs}
        best = None
        for (x, y) in reach:
            if (x, y) in fronts or (x, y) in used or (x, y) in self.passages: continue
            d = abs(x - tx) + abs(y - ty)
            if best is None or d < best[0] or (d == best[0] and (y, x) < best[1:]): best = (d, x, y)
        assert best and best[0] <= 4, "%s: no free spot near (%d,%d)" % (key, tx, ty)
        self.npcs.append((key, best[1], best[2], 2))

    # ------------------------------------------------------------------------------------------------ walls
    def wall_h(self, x0, x1, y, gates=(), towers=()):
        """a fortress wall along a row band y..y+4 (the author's castle gate recipe): merlons B(8..10,0) on the plank walkway
        (A2 k33), the walkway with the low merlons B(9,1), the wall top A4 k97, the face A4 k105 twice; `gates`: columns of a
        passage through all five rows (paved, the arch B(8..10,7) under the face's top); `towers`: left columns of round towers
        (B(13..14,0..6), the tower's top one row above the merlons)"""
        g = set(gates)
        for x in range(x0, x1 + 1):
            if x in g:
                for j in range(5):
                    self.layers[0][(x, y + j)] = ("k", 40)
                    for z in (1, 2, 3): self.layers[z].pop((x, y + j), None)
                    self.passages.add((x, y + j))
                continue
            left, right = (x - 1 in g) or x == x0, (x + 1 in g) or x == x1
            self.layers[0][(x, y)] = ("k", 33); self.layers[0][(x, y + 1)] = ("k", 33)
            self.tile(3, x, y, B(8 if left else 10 if right else 9, 0))
            self.tile(3, x, y + 1, B(9, 1))
            self.layers[0][(x, y + 2)] = ("k", 97)
            self.layers[0][(x, y + 3)] = ("k", 105); self.layers[0][(x, y + 4)] = ("k", 105)
            for j in range(5):
                self.owner[(x, y + j)] = "Mury miejskie"
                self.layers[1].pop((x, y + j), None)
                self.wall_cells.add((x, y + j))
        if g:
            gs = sorted(g)
            for i, x in enumerate(gs):
                self.tile(3, x, y + 3, B(8 if i == 0 else 10 if i == len(gs) - 1 else 9, 7))
        for tx in towers:
            self.tower(tx, y - 1)
        self.keep_free |= self.rect(x0, y, x1, y + 4)

    def wall_v(self, x, y0, y1, inner, gates=(), towers=()):
        """a wall along a map side: a rampart 2 columns wide (A4 k97 top) with low merlons on its town side (B(12,1) when
        the town is to the east, B(11,1) to the west); `gates`: rows of a passage through it; `towers`: top rows of round
        towers standing on it"""
        g = set(gates)
        for yy in range(y0, y1 + 1):
            for xx in (x, x + 1):
                if yy in g:
                    self.layers[0][(xx, yy)] = ("k", 40)
                    for z in (1, 2, 3): self.layers[z].pop((xx, yy), None)
                    self.passages.add((xx, yy))
                    continue
                self.layers[0][(xx, yy)] = ("k", 97)
                self.layers[1].pop((xx, yy), None)
                self.owner[(xx, yy)] = "Mury miejskie"
                self.wall_cells.add((xx, yy))
            if yy not in g:
                if inner == "east": self.tile(3, x + 1, yy, B(12, 1))
                else: self.tile(3, x, yy, B(11, 1))
        for ty in towers:
            self.tower(x, ty)
        self.keep_free |= self.rect(x, y0, x + 1, y1)

    def tower(self, x, y):
        """a round tower (B(13..14, 0..6), 7 rows from y): the top star tiles drawn over the hero, the base closed"""
        for j in range(7):
            for i in range(2):
                c = (x + i, y + j)
                if not self.inside(*c): continue
                self.tile(3, c[0], c[1], B(13 + i, j))
                if j >= 5: self.owner[c] = "Baszta"
        self.keep_free |= self.rect(x, y, x + 1, y + 6)

    # ------------------------------------------------------------------------------------------------ rock
    def cliff(self, x0, x1, y, stairs=(), low=(), name="Skała wzgórza"):
        """the author's A5 cliff: the rim A5(.,13) (walkable, not down), the faces A5(.,14)/(.,9) and A5(.,15)/(.,10)
        (closed), rounded ends; split at the stairs (A5(0..3,7): stone steps down, walkable) and at `steps`, where every
        other segment sits one row lower. Returns the first walkable row below each column."""
        segs, cur = [], None
        low = set(low)
        for x in range(x0, x1 + 1):
            if x in stairs:
                if cur: segs.append(cur); cur = None
                continue
            if cur and ((x in low) != (cur[0] in low)):
                segs.append(cur); cur = None
            if cur is None: cur = [x, x]
            else: cur[1] = x
        if cur: segs.append(cur)
        below = {}
        for i, (a, b) in enumerate(segs):
            dy = 1 if a in low else 0
            for x in range(a, b + 1):
                col = 0 if x == a else 2 if x == b else 1
                mid = (col, 14) if col != 1 or noise(x, y, 51) < 0.6 else ((0, 9) if noise(x, y, 52) < 0.5 else (1, 9))
                low = (col, 15) if col != 1 or noise(x, y, 53) < 0.6 else ((2, 10) if noise(x, y, 54) < 0.5 else (0, 10))
                for j, cr in enumerate(((col, 13), mid, low)):
                    c = (x, y + dy + j)
                    self.layers[0][c] = ("t", A5(*cr)); self.layers[1].pop(c, None)
                    if j: self.owner[c] = name
                below[x] = y + dy + 3
            self.keep_free |= self.rect(a, y + dy, b, y + dy + 2)
        runs = []
        for x in sorted(stairs):
            if runs and x == runs[-1][-1] + 1: runs[-1].append(x)
            else: runs.append([x])
        for ss in runs:
            for i, x in enumerate(ss):
                col = 3 if len(ss) == 1 else 0 if i == 0 else 2 if i == len(ss) - 1 else 1
                for j in range(3):
                    c = (x, y + j)
                    self.layers[0][c] = ("t", A5(col, 7)); self.layers[1].pop(c, None)
                    self.passages.add(c)
                below[x] = y + 3
        return below

    # ------------------------------------------------------------------------------------------------ blockers
    def solid_look(self, t):
        return CHK.solid_look(t, self.fl)

    def _old_solid_look(self, t):
        """a tile that looks like something one cannot walk through (A3 roofs / walls, A4 walls and wall tops, A5 cliff
        faces, B fortress pieces that are not drawn over the hero)"""
        if t >= 2048:
            k = (t - 2048) // 48
            return 48 <= k < 128
        if 1536 <= t < 2048:
            c, r = (t - 1536) % 8, (t - 1536) // 8
            return r in (9, 10, 14, 15) or (r in (2, 3, 4) and c < 4 and False)
        if 0 < t < 256:
            col, row = t % 8 + (8 if t >= 128 else 0), (t % 128) // 8
            return col >= 8 and row <= 8 and not is_star(self.fl, t) and not (col <= 10 and row in (7, 8))
        return False

    def close_solids(self):
        data = self.resolve()
        events = self.build_events()
        eng = Engine(self.W, self.H, data, self.fl, events)
        need = set()
        for y in range(self.H):
            for x in range(self.W):
                if (x, y) in self.passages: continue
                ts = [data[(z * self.H + y) * self.W + x] for z in range(4)]
                if (any(self.solid_look(t) for t in ts) or (x, y) in self.wall_cells) and eng.tile_open(x, y) and (x, y) not in eng.block:
                    need.add((x, y))
        by_owner = {}
        for c in sorted(need, key=lambda c: (c[1], c[0])):
            by_owner.setdefault(self.owner.get(c, "Przeszkoda"), set()).add(c)
        n = 0
        for owner in sorted(by_owner):
            left = by_owner[owner]
            while left:
                x0, y0 = min(left, key=lambda c: (c[1], c[0]))
                x1 = x0
                while (x1 + 1, y0) in left: x1 += 1
                y1 = y0
                while all((x, y1 + 1) in left for x in range(x0, x1 + 1)): y1 += 1
                self.blocker(x0, y0, x1, y1, owner)
                for c in self.rect(x0, y0, x1, y1): left.discard(c)
                n += 1
        return n

    # ------------------------------------------------------------------------------------------------ ground
    def ground_rect(self, cells, kind, z=0):
        for c in cells:
            if self.inside(*c) and c not in self.keep_free: self.layers[z][c] = ("k", kind)

    def kerb(self, cells):
        """the author's kerb: the A2 frame overlay k46 over a paved area (its outline gets the light stone border)"""
        for c in cells:
            if self.inside(*c) and c not in self.keep_free: self.layers[1][c] = ("k", 46)

    def greenery(self, cells, seed, plants=0.10, overlays=True):
        """grass that is never one flat colour: lighter / darker patches (A2 k27 / k31 overlays), flower carpets (k28 / k29),
        tall grass (k21), and the D sheet's small plants (flowers, ferns, mushrooms) scattered, walkable"""
        cells = {c for c in cells if c not in self.keep_free and self.layers[0].get(c) == ("k", 16) and c not in self.taken}
        r = random.Random(seed)
        order = sorted(cells)
        if overlays and order:
            for i in range(max(1, len(order) // 40)):
                cx, cy = order[r.randrange(len(order))]
                kind = r.choice([27, 27, 31, 21, 28, 29])
                for c in blob(self, cx, cy, 1.2 + r.random() * 2, 0.9 + r.random() * 1.2, seed + i) & cells:
                    if self.layers[1].get(c) is None: self.layers[1][c] = ("k", kind)
        PL = [(8, 7), (8, 8), (9, 8), (10, 8), (11, 8), (12, 8), (14, 8), (15, 8), (12, 9), (14, 9), (15, 9), (12, 10), (13, 10),
              (12, 11), (13, 11), (9, 7), (10, 7), (11, 7), (14, 11), (14, 12)]
        r.shuffle(order)
        for (x, y) in order[:int(len(order) * plants)]:
            if (x, y) not in self.layers[2]: self.tile(2, x, y, D(*PL[r.randrange(len(PL))]))


def concept():
    mp = Town11()
    mp.idea = ("Tawerna stoi na dziedzińcu dawnej twierdzy na szczycie wzgórza, obok świątyni (dawna kaplica zakonu), kamienic "
               "w murach i grobów strażników; pod murem twierdzy, przy świątyni, koczują uchodźcy. Brama twierdzy z basztami, "
               "posągami strażników i koszami żarowymi prowadzi schodami w dół na rynek z suchą studnią, straganami, ratuszem, "
               "piekarnią, kantorem i szewcem; stąd wschodnia brama do dworu Lorda. Skalna krawędź wzgórza ze schodami schodzi "
               "na dolny taras rzemieślników: zielarnia, stary młyn nad wyschniętym korytem, posterunek straży Lorda, kuźnia. "
               "Całe miasteczko otaczają mury z basztami; na Polną drogę prowadzi brama miejska na południu.")
    WALL_S = H - 5                                   # the south wall's first row (54)
    mp.kind(0, mp.all, 16)
    # ---- the edge exits (ids 1..6, today's commands) at the gates; the tavern (door id 7) on the fortress courtyard
    mp.exits([24, 25, 26], [30, 31, 32])
    mp.tavern(5, 4, {"behind": None, "lamps": None, "terrace": (29, -1), "backyard": (0, 0)}, signpost=SIGNPOST,
              place={43: (19, 17), 50: None, 51: (35, 30), 52: None, 53: (29, 39), 54: None})
    # ---- the town walls: north, south with the town gate, the west / east ramparts with the east gate, towers
    mp.wall_h(0, W - 1, 0, towers=(34,))
    mp.wall_h(0, W - 1, WALL_S, gates=(24, 25, 26), towers=(10, 22, 27, 40))
    mp.wall_v(0, 5, WALL_S - 1, inner="east", towers=(12, 29, 43))
    mp.wall_v(W - 2, 5, WALL_S - 1, inner="west", gates=(30, 31, 32), towers=(23, 33, 43))
    for (tx, ty) in ((0, 0), (W - 2, 0), (0, WALL_S - 2), (W - 2, WALL_S - 2)):
        mp.tower(tx, ty)
    mp.label("Mury miejskie", 25, 1, "twierdza")
    # ---- the upper terrace: the fortress courtyard
    mp.ground_rect(mp.rect(2, 5, W - 3, 20), 40)
    mp.building("twierdza_front", 3, 5, "swiatynia", "Świątynia", kind="świątynia", interior=True, npc="kaplan",
                banner=ORDER_BANNER, note="dawna kaplica zakonu; stare księgi o twierdzy")
    mp.building("kamienice_szachulec", 37, 5, "kamienice", "Kamienice w murach", kind="dom",
                note="dwa domy szachulcowe; dolne ściany z kamienia twierdzy")
    mp.stamp("wieza_helm", 46, 5, name="Wieża z hełmem")
    for i, gx in enumerate((46, 47, 48)):
        mp.tile(2, gx, 12, C(10 + i, 10)); mp.tile(2, gx, 13, C(10 + i, 11))
        mp.owner[(gx, 13)] = "Groby strażników"
    mp.label("groby strażników zakonu", 47, 11, "twierdza")
    mp.building("chata_strzecha", 44, 16, "grabarz", "Chata grabarza", kind="dom",
                drop=lambda ev: ev["pages"][0]["image"]["characterName"] == "!Signs", note="pilnuje grobów strażników")
    mp.stamp("kosze_zarowe", 15, 16, name="Kosze żarowe")
    mp.stamp("kosze_zarowe", 30, 16, name="Kosze żarowe")
    # the refugees' camp in the lee of the fortress wall, by the temple (the priest gives them shelter)
    mp.ground_rect(mp.rect(2, 15, 13, 20), 17)
    mp.prop("tent_hide", 3, 19, label="Namiot uchodźców"); mp.prop("tent_hide", 9, 20, label="Namiot uchodźców")
    mp.prop("tent_small", 12, 17, label="Szałas"); mp.prop("bedroll", 6, 17, label="Posłanie"); mp.prop("bedroll", 2, 16, label="Posłanie")
    mp.campfire(7, 19, pot=True)
    mp.prop("laundry", 11, 15, label="Sznur z praniem")
    mp.thing_c("sacks", 5, 20); mp.thing_c("crate_lid", 13, 20)
    mp.label("Obóz uchodźców", 7, 16, "uchodźcy")
    # ---- the inner fortress wall with the author's castle gate; stairs down the rock through it
    mp.stamp("brama_zamkowa", 20, 18, name="Brama twierdzy",
             drop=lambda ev: ev["pages"][0]["image"]["characterName"] == "!$Big_drawbridge_animated")
    mp.wall_h(2, 19, 21, towers=(10,))
    mp.wall_h(30, W - 3, 21, towers=(40,))
    for x in (20, 29):
        mp.tile(3, x, 21, B(9, 0))
    for x in (24, 25):
        for yy in range(18, 26):
            c = (x, yy)
            mp.layers[0][c] = ("k", 40)
            for z in (1, 2):
                mp.layers[z].pop(c, None)
            if yy != 24: mp.layers[3].pop(c, None)
            mp.passages.add(c)
    mp.tile(3, 24, 24, B(8, 7)); mp.tile(3, 25, 24, B(10, 7))
    mp.cliff(2, W - 3, 26, stairs=(24, 25))
    mp.label("Brama twierdzy i schody", 25, 27, "twierdza")
    # ---- the market terrace (y 29..40): fronts in one line (bottom rows at y 39), the lane y 40 in front of them
    mp.ground_rect(mp.rect(2, 29, W - 3, 40), 40)
    mp.kerb(mp.rect(24, 29, 37, 40))
    mp.building("spichlerz_drewutnia", 2, 30, "piekarnia", "Piekarnia", kind="rzemiosło", interior=True, npc="piekarka",
                add_door=(4, 8), clear=[(4, 9)], note="chleb drożeje - wojsko rekwiruje zboże; przy piecu drewutnia")
    mp.picture(7, 37, "!Signs", 2, 2, 0, name="Szyld: Piekarnia", priority=1, through=True)
    mp.building("dom_lukarny_czarny", 9, 33, "dom_czarny", "Dom z lukarnami", kind="dom", add_door=(1, 6))
    mp.building("sklep_waga", 13, 34, "kantor", "Kantor „Towary z kontynentu”", kind="handel", interior=True, npc="kupiec",
                note="towar z promu wnoszony na wzgórze")
    mp.building("chata_strzecha", 18, 36, "szewc", "Szewc i krawiec", kind="rzemiosło", interior=True, npc="szewc",
                sign=(0, 4, 0), note="buty, płaszcze, łaty")
    mp.building("karczma_szachulcowa", 38, 30, "ratusz", "Ratusz", kind="ratusz", interior=True, npc="soltys", sign=(3, 2, 0),
                note="sołtys, sprawy miasteczka, zlecenia")
    mp.building("dom_lukarny_czarny", 46, 33, "dom_wschodni", "Dom przy bramie", kind="dom", add_door=(1, 6))
    mp.yard("notice_board", 36, 40, "Tablica sołtysa",
            cmds=msg("Tablica sołtysa. Zarządzenia, zlecenia, listy gończe.", "(Zlecenia miasteczka - w następnym etapie.)"))
    mp.prop("well_dry", 30, 36, label="Sucha studnia", cmds=msg("Studnia. Na dnie tylko spękany muł i kamienie.", "Wyschła, zanim ktokolwiek pamięta."))
    mp.thing_c("barrel_water", 33, 36); mp.thing_c("barrel_water", 34, 36); mp.thing_c("barrel_ladle", 33, 37)
    mp.label("puste beczki wodziarza", 34, 38, "stragan")
    mp.prop("stall_orange", 26, 32, label="Stragan z warzywami", cmds=msg("Stragan przekupki. Targ w każdy piątek."))
    mp.prop("stall_purple", 35, 32, label="Stragan ze starzyzną", cmds=msg("Starocie, gliniane garnki i 'kamienie z twierdzy'."))
    mp.prop("stall_plain", 26, 38, label="Stragan z suknem", cmds=msg("Sukno i płótno z kontynentu. Targ w każdy piątek."))
    mp.thing_c("bench", 29, 31); mp.thing_c("sacks", 24, 32); mp.thing_c("crate", 37, 32); mp.thing_c("pots", 28, 39)
    mp.decor_tree(32, 31, "pine")
    for x, y in ((24, 29), (48, 29), (24, 36), (8, 40), (45, 40)):
        mp.lamp(x, y)
    mp.label("RYNEK", 31, 29, "rynek"); mp.label("targ w piątki", 27, 35, "rynek")
    # ---- the rock edge between the market and the crafts terrace, two stairs
    mp.cliff(2, W - 3, 41, stairs=(24, 25, 26, 45, 46), low=set(range(3, 9)) | set(range(33, 41)))
    mp.label("Skalna krawędź wzgórza", 14, 42, "twierdza")
    # ---- the crafts terrace (y 44..53): fronts in one line (doors at y 51), the lane y 52, the dry bed y 53 in the west
    lane = mp.rect(2, 52, 22, 52) | mp.rect(28, 52, W - 3, 53) | mp.rect(10, 44, 10, 52) | mp.rect(42, 44, 42, 51)
    mp.ground_rect(lane, 17)
    street = mp.rect(23, 44, 27, WALL_S - 1)
    mp.ground_rect(street, 40)
    mp.kerb(street)
    mp.building("chata_z_bali", 2, 45, "zielarnia", "Zielarnia", kind="rzemiosło", interior=True, npc="zielarka",
                note="zioła, maści; leczy uchodźców")
    mp.picture(4, 50, "!Signs", 1, 2, 2, name="Szyld: Zielarnia", priority=1, through=True)
    mp.building("mlyn_karczma", 11, 45, "mlyn", "Stary młyn", kind="młyn", interior=True, dry=36, clear=[(5, 7)],
                drop=lambda ev: ev["pages"][0]["image"]["characterName"] == "!Signs",
                note="koło stoi nad suchym korytem; wnętrze później")
    mp.blocker(13, 53, 13, 53, "Koło młyńskie (stoi)")
    bed = mp.rect(2, 53, 22, 53) | mp.rect(20, 44, 21, 52)
    for c in bed:
        if c not in mp.keep_free or c[1] == 53:
            mp.layers[0][c] = ("k", 36); mp.layers[1].pop(c, None)
    mp.label("wyschnięte koryto młyna", 21, 47, "kanał")
    mp.building("kamienica_choragiew", 28, 46, "posterunek", "Posterunek straży Lorda", kind="garnizon", interior=True,
                npc="kapral", banner=LORD_BANNER, note="straż Lorda Zaleskiego: kontrola przybyszów, rekwizycje")
    mp.building("kuznia_otwarta", 35, 45, "kuznia", "Kuźnia", kind="rzemiosło", interior=True, npc="kowal",
                door_event=(3, 5), note="narzędzia, okucia, zlecenia straży")
    mp.building("kantor_waga", 43, 47, "dom_kupiecki", "Dom kupiecki", kind="dom",
                drop=lambda ev: ev["pages"][0]["image"]["characterName"] == "!Signs")
    mp.thing_c("cart", 48, 44); mp.thing_c("barrel", 43, 45); mp.thing_c("crate_b", 44, 45)
    # ---- NPC spots (the nearest free cell reachable on foot to each target)
    for kk, (tx, ty) in [("kaplan", (7, 15)), ("soltys", (42, 40)), ("pisarz", (37, 40)), ("kowal", (38, 51)),
                         ("kupiec", (15, 40)), ("piekarka", (5, 40)), ("zielarka", (7, 52)), ("szewc", (22, 40)),
                         ("wodziarz", (35, 37)), ("przekupka", (27, 33)), ("starzyzna", (36, 33)), ("kapral", (32, 52)),
                         ("straznik", (23, 51)), ("uchodzczyni", (5, 18)), ("dezerter", (10, 17))]:
        mp.npc_near(kk, tx, ty)
    mp.shots = [(25, 30, 8, "brama twierdzy i schody"), (30, 34, 2, "rynek"), (19, 15, 8, "dziedziniec twierdzy z tawerną"),
                (25, 49, 2, "taras rzemieślników")]
    mp.ground_rect(mp.terrace_cells, 33)
    mp.greenery(mp.all, 5211)
    return mp


def main():
    mp = concept()
    n = mp.close_solids()
    path, ne = mp.write_staged()
    print("Map008_C2: %dx%d, %d events (%d blockers), %d buildings" % (mp.W, mp.H, ne, n, len(mp.buildings)))

if __name__ == "__main__":
    main()
