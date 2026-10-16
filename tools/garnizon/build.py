# python tools/garnizon/build.py   -> tools/miejsca_wyspy/staging_D/data/Map162.json (+ tools/garnizon/staging/Map162_meta.json)
# GARNIZON NAD ZATOKĄ (Map162, 56x40, tileset 11 - autora Winlu, jak przystań i Podgrodzie). Pakiet D z docs/miejsca_wyspy/PAKIETY.md,
# koncepcja docs/miejsca_wyspy/KONCEPCJA.md (punkt 6, rzut_garnizon.png). Na południe od przystani, nad tą samą zatoką:
#   - MORZE po lewej (A1 rodzaj 10 = woda przy piaszczystym brzegu, przy krawędzi głębia), notatka <Water:salt>: czerwone i trujące
#     morze robi samo CzerwonaWoda.js; ŻADNEJ wody pitnej (beczki „z promu” są pilnowane: tylko dymek)
#   - ŁACHA w rzędach 20-21 od lewej krawędzi do brzegu: kafelki to morze; w odpływie (przełącznik 20) Garnizon.js pokazuje na niej
#     mokry piasek (img/system/Garnizon_Lacha.png - robi go ten skrypt z tych samych kafelków) i pozwala po niej chodzić; na końcu
#     przejście na wrak (Map165) tylko w odpływie, inaczej dymek „Łacha pod wodą.”; wrak okrętu w oddali na mieliźnie
#   - droga z przystani (góra, pola 21-23 <- Map125 21-23,39) pod bramę palisady
#   - PALISADA z zaostrzonych pali (tools/garnizon/art/palisada.py: odcinki czołowe 3 pola, boczne 2 pola) x 23..52, y 10..33,
#     brama od północy (35-37); w środku: koszary (dom z bali, wstęp tylko dla wojska), KWATERA ROTMISTRZA (kamienny dom autora,
#     chorągwie z feniksem, wnętrze Map163), SPICHLERZ Z REKWIZYCJI (prefabrykat autora), plac ćwiczeń (manekiny, tarcze, stojaki),
#     namioty żołnierzy i namiot kwatermistrza (skup), kuchnia polowa (kocioł na ogniu), dyby, wieża strażnicza (PixelLab),
#     kuźnia garnizonu (kowadło), beczki z wodą pod strażą
#   - przed bramą stół werbownika pod daszkiem z chorągwią; na brzegu pomost z łodzią ratowniczą
#   - światła: tylko płomienie (koksownik przy bramie, kosz ogniowy na pomoście, kuchnia, latarnie)
#   - znaczniki „Miejsce: <klucz>” dla TownLife (rotmistrz, kwatermistrz, werbownik) i dla żołnierzy Garnizon.js
# Nigdy nie zapisuje data/ (instaluje koordynator). Zapis: tools/miejsca_wyspy/staging_D/data/Map162.json.
import os, sys, json, copy, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
for p in ("tools/newstart", "tools/town", "tools/podgrodzie", "tools/mountains"):
    if ROOT + p not in sys.path: sys.path.insert(0, ROOT + p)
import plib                                                             # noqa: E402
from plib import Pod, THINGS, popup_cmds                                # noqa: E402
import mtlib                                                            # noqa: E402
from mtlib import MMap                                                  # noqa: E402
from nslib import B, C, D, noise, lowfreq, write_map, blank_page        # noqa: E402
import prefabs as PF                                                    # noqa: E402

STAGING_DATA = ROOT + "tools/miejsca_wyspy/staging_D/data/"
STAGING = os.path.join(HERE, "staging")
MAP_ID, HARBOUR, WRECK, QUARTERS = 162, 125, 165, 163
W, H = 56, 40
NOTE = "<Clouds:on>\n<Farm:off>\n<Water:salt>\n<Garnizon:mapa>"
T = 48
# A1 / A2 kinds of tileset 11
SEA_SAND, DEEP, PLANKS = 10, 1, 2
GRASS, DIRT, GRASS_LIGHT, TUFTS, STONES, EARTH, MUD = 16, 17, 27, 21, 23, 24, 26
DRY, PEBBLES, COBBLE = 39, 47, 40
# the compound
X0, X1, Y0, Y1 = 23, 52, 10, 33
GATE = (35, 37)
BAR_ROWS = (20, 21)
PAL = json.load(open(os.path.join(HERE, "art", "palisada.json"), encoding="utf-8"))


class Garrison(MMap, Pod):
    """the garrison's map: MMap (cells, the walking check) + Pod (houses, things, lights, spots)"""

    def __init__(self):
        MMap.__init__(self, MAP_ID, W, H, "Garnizon nad zatoką", NOTE, seed=MAP_ID)
        self.buildings, self.lights, self.doors, self.exits, self.notes = [], [], [], [], []
        self.sea_cells, self.bar = set(), set()
        self.palisade = []      # (x, y, kind) the events' cells
        self.objects = []

    def picture(self, x, y, char, index=0, direction=2, pattern=0, name="", priority=1, through=False, note="", cmds=None,
                trigger=0, step=False, dfix=True, freq=3, speed=3, cells=None):
        e = plib.event(name, x, y, plib.pic(char, index, direction, pattern), priority, through, trigger, cmds, note, step, dfix, freq, speed)
        if priority == 1 and not through: self.solid.add((x, y))
        return self.add(x, y, e, cells)

    def spot(self, key, x, y, d=2):
        img = {"tileId": 0, "characterName": "", "characterIndex": 0, "direction": d, "pattern": 0}
        e = plib.event("Miejsce: %s" % key, x, y, img, priority=0, through=True)
        self.events.append((x, y, e))
        self.spots[key] = [x, y, d]
        return e

    def look(self, x, y, name, text, priority=1, through=False, note=""):
        """something to look at: the action button pops its line up over the hero (once a second)"""
        e = plib.event(name, x, y, None, priority, through, 0, popup_cmds(text), note)
        if priority == 1 and not through: self.solid.add((x, y))
        return self.add(x, y, e)

    def script_ev(self, x, y, name, js, image=None, priority=1, through=False, trigger=0, note="", step=False):
        """an event whose page runs one script line (Garnizon.js)"""
        cmds = [{"code": 355, "indent": 0, "parameters": [js]}]
        e = plib.event(name, x, y, image, priority, through, trigger, cmds, note, step)
        if priority == 1 and not through: self.solid.add((x, y))
        return self.add(x, y, e)

    # ---- the ground
    def sea(self, cells):
        for c in cells:
            if self.inside(*c):
                self.layers[0][c] = ("k", SEA_SAND)
                for z in (1, 2, 3): self.layers[z].pop(c, None)
                self.sea_cells.add(c)
                self.solid.add(c)

    def lane(self, pts, width, kind=DIRT, z=0, wobble=0.3, seed=5):
        cells = set()
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            n = int(max(abs(bx - ax), abs(by - ay)) * 3) + 1
            for i in range(n + 1):
                t = i / n
                cx, cy = ax + (bx - ax) * t, ay + (by - ay) * t
                r = width / 2.0 + wobble * (noise(int(cx * 2), int(cy * 2), seed) - 0.5) * 2
                for y in range(int(cy - r - 1), int(cy + r + 2)):
                    for x in range(int(cx - r - 1), int(cx + r + 2)):
                        if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r and self.inside(x, y): cells.add((x, y))
        cells -= self.sea_cells
        self.kind(z, cells, kind)
        self.keep_free |= cells
        return cells

    def blob(self, cx, cy, rx, ry, seed=3, rough=0.25):
        out = set()
        for y in range(int(cy - ry - 2), int(cy + ry + 3)):
            for x in range(int(cx - rx - 2), int(cx + rx + 3)):
                a = math.atan2(y - cy, x - cx)
                k = 1 + rough * (lowfreq(int(20 + 6 * math.cos(a)), int(20 + 6 * math.sin(a)), seed, 2.0) - 0.5) * 2
                if ((x + 0.5 - cx) / (rx * k)) ** 2 + ((y + 0.5 - cy) / (ry * k)) ** 2 <= 1 and self.inside(x, y): out.add((x, y))
        return out

    def overlay(self, cells, kind, chance=1.0, seed=7):
        for (x, y) in cells:
            if (x, y) in self.sea_cells: continue
            if chance >= 1 or noise(x, y, seed) < chance: self.layers[1][(x, y)] = ("k", kind)

    def stamp(self, key, x, y, skip_events=None, events=None):
        """the author's prefab (tools/town/prefabs) without the events skip_events(name, image) says; events(name) -> extra note/cmds"""
        pf = PF.load(key)
        for z in range(4):
            for j, row in enumerate(pf["layers"][z]):
                for i, t in enumerate(row):
                    if not t: continue
                    if z < 2 and 2048 <= t < 2048 + 48 * 48: continue      # (the ground of the prefab stays ours)
                    self.tile(z, x + i, y + j, t)
        for j, row in enumerate(pf["layers"][4]):
            for i, v in enumerate(row):
                if v: self.shadow[(x + i, y + j)] = v
        out = []
        for ev in pf["events"]:
            img = ev["pages"][0]["image"]["characterName"] if ev["pages"] else ""
            if skip_events and skip_events(ev.get("name", ""), img): continue
            e = {k: copy.deepcopy(ev[k]) for k in ("name", "note", "pages")}
            self.add(x + ev["x"], y + ev["y"], e)
            out.append((x + ev["x"], y + ev["y"], e, img))
        for i in range(pf["w"]):
            for j in range(pf["h"]):
                self.keep_free.add((x + i, y + j))
        return pf, out

    def obj(self, x, y, sheet, name, occupy=None, priority=1, step=False, through=False, note="", cmds=None, trigger=0,
            index=0, direction=2, pattern=0, light=None):
        n = note + ("<Occupy:%s>" % occupy if occupy else "") + (light or "")
        e = plib.event(name, x, y, plib.pic(sheet, index, direction, pattern), priority, through, trigger, cmds, n, step, True,
                       5 if step else 3, 6 if step else 3)
        self.add(x, y, e)
        if priority == 1 and not through: self.solid.add((x, y))
        self.objects.append({"name": name, "x": x, "y": y, "sheet": sheet})
        if light: self.lights.append({"name": name, "x": x, "y": y, "note": light})
        return e


# ================================================================================================ the sea, the beach, the bar
def sea_edge(y):
    e = 15 - 0.16 * y + 1.6 * (lowfreq(0, y, 31, 3.0) - 0.5)
    if y > 29: e -= (y - 29) * 0.75
    if y <= 1: e = 15                 # (the harbour's bottom row: the sea x 0..14)
    return e


def ground(mp):
    mp.kind(0, mp.all, GRASS)
    for (x, y) in mp.all:
        if lowfreq(x, y, 31, 4.0) > 0.70: mp.layers[0][(x, y)] = ("k", GRASS_LIGHT)
    sea = {(x, y) for y in range(H) for x in range(W) if x < sea_edge(y)}
    mp.sea(sea)
    mp.kind(1, {(x, y) for (x, y) in sea if x < 3 and not (BAR_ROWS[0] <= y <= BAR_ROWS[1])}, DEEP)
    # the shoal far out with the warship's wreck (the same as from the harbour), half off the map
    shoal = mp.blob(1.5, 16.6, 3.2, 1.6, seed=8) - {(x, y) for x in range(W) for y in BAR_ROWS}
    for c in shoal:
        mp.layers[0][c] = ("k", DIRT); mp.layers[1].pop(c, None); mp.sea_cells.discard(c)
    mp.shoal = shoal
    # the sandbar to the wreck: sea tiles; at low tide Garnizon.js shows the sand and lets one walk on it
    mp.bar = {(x, y) for y in BAR_ROWS for x in range(0, W) if (x, y) in mp.sea_cells}
    # the beach (sand and pebbles) along the water, wider to the south
    beach = {(x, y) for (x, y) in mp.all if (x, y) not in mp.sea_cells and x < sea_edge(y) + 4 + 2 * noise(x, y, 5) + max(0, y - 30) * 0.4}
    beach |= {(x, 0) for x in range(15, 24)} | {(x, 1) for x in range(15, 23)}          # (the harbour's beach goes on: x 15..23)
    mp.kind(0, beach, DIRT)
    mp.overlay(beach, PEBBLES, 0.12, 12)
    mp.beach = beach


# ================================================================================================ the ways
def roads(mp):
    # the trodden yard inside the palisade
    inside = mp.rect(X0 + 1, Y0 + 1, X1 - 1, Y1 - 1)
    mp.kind(0, inside, EARTH)
    mp.overlay(inside, MUD, 0.07, 13)
    mp.inside_cells = inside
    mp.road = mp.lane([(22, -0.5), (22.2, 2.5), (24.0, 5.5), (28, 7.6), (33, 9.2), (36, 9.6), (36, 10.4)], 2.4, seed=51)
    lane = mp.rect(35, Y0 + 1, 37, 29)                     # (the cobbled lane from the gate: straight, three cells wide)
    mp.kind(0, lane, COBBLE)
    mp.keep_free |= lane
    mp.road |= lane
    for c in mp.road: mp.layers[1].pop(c, None)
    # from the road down the beach to the pier
    mp.road |= mp.lane([(21.5, 4.0), (19.5, 9.0), (18.0, 15.0), (16.5, 21.0), (15.5, 26.5)], 1.6, seed=53)
    # (the sand at the gate's foot, the yard of the training ground: a lighter earth)
    for (x, y) in mp.rect(26, 20, 33, 26):
        if noise(x, y, 77) < 0.25: mp.layers[1][(x, y)] = ("k", DRY)


# ================================================================================================ the palisade
def palisade(mp):
    fr, sd = PAL["front"], PAL["side"]

    def front(x, y, k, name="Palisada"):
        c = fr[k]
        e = plib.event(name, x, y, plib.pic("!Garnizon_Palisada", c["index"], c["direction"], c["pattern"]), 1, False, 0, None,
                       "<Occupy:left=1,right=1><Garnizon:palisada>")
        mp.add(x, y, e, [(x - 1, y), (x, y), (x + 1, y)])
        for dx in (-1, 0, 1): mp.solid.add((x + dx, y))
        mp.palisade.append((x, y, "front"))

    def side(x, y, k):
        c = sd[k % len(sd)]
        e = plib.event("Palisada", x, y, plib.pic("!Garnizon_Palisada_Bok", c["index"], c["direction"], c["pattern"]), 1, False, 0, None,
                       "<Occupy:up=1><Garnizon:palisada>")
        mp.add(x, y, e, [(x, y - 1), (x, y)])
        mp.solid |= {(x, y - 1), (x, y)}
        mp.palisade.append((x, y, "side"))

    n = 0
    # the north run: 23..34 (four segments, the last with the gate's post), the gate 35..37, then 38..52 (five, the first with the post)
    for i, cx in enumerate(range(X0 + 1, GATE[0], 3)):
        front(cx, Y0, 10 if cx + 1 == GATE[0] - 1 else n % 10); n += 1
    for i, cx in enumerate(range(GATE[1] + 2, X1 + 1, 3)):
        front(cx, Y0, 11 if i == 0 else n % 10); n += 1
    # the south run: 23..52 (ten)
    for cx in range(X0 + 1, X1 + 1, 3):
        front(cx, Y1, n % 10); n += 1
    # the sides: rows 11..32, two rows a segment (the event on the lower one)
    for k, yb in enumerate(range(Y0 + 2, Y1, 2)):
        side(X0, yb, k)
        side(X1, yb, k + 3)
    for c in mp.rect(X0, Y0, X1, Y0) | mp.rect(X0, Y1, X1, Y1) | mp.rect(X0, Y0, X0, Y1) | mp.rect(X1, Y0, X1, Y1):
        mp.layers[1].pop(c, None)
        mp.layers[0][c] = ("k", EARTH)
    for x in range(GATE[0], GATE[1] + 1):
        mp.solid.discard((x, Y0))
        mp.keep_free.add((x, Y0)); mp.keep_free.add((x, Y0 + 1)); mp.keep_free.add((x, Y0 - 1))
    # the ground under the palisade's foot and the gate: trodden earth
    mp.kind(0, mp.rect(GATE[0], Y0 - 1, GATE[1], Y0 + 1), EARTH)


# ================================================================================================ the buildings
def buildings(mp):
    # the barracks: a log house (the author's pieces), "wstęp tylko dla wojska"
    mp.koszary = mp.house("koszary", "Koszary", 25, 12, 8, 2, 2, "planks", "logs", door=4, windows=[(1, "wood"), (6, "wood_lit")],
                          chimney=6, chimney_style=3, lean="left", lean_fill="logs", hours=None,
                          closed_text="Koszary. Na drzwiach kartka: „Wstęp tylko dla wojska”.")
    # the captain's quarters: the author's stone house; his wolf banner out, two phoenix banners of the royal standard in
    pf, evs = mp.stamp("kamienica_choragiew", 39, 12, skip_events=lambda n, img: "Flags" in img)
    for (x, y, e, img) in evs:
        if img == "!Fantasy_door2":
            e["name"] = "Drzwi: Kwatera rotmistrza"
            e["note"] = "<Garnizon:drzwi_kwatery>"
            pg = e["pages"][0]
            pg["trigger"] = 1
            pg["list"] = [{"code": 355, "indent": 0, "parameters": ["Garnizon.door(this);"]}, {"code": 0, "indent": 0, "parameters": []}]
            mp.kwatera_door = (x, y)
        elif img == "!Decoration":
            e["name"] = "Latarnia kwatery"
            e["note"] = "<Light:140,90,62,22><LightWhen:night>"
            mp.lights.append({"name": e["name"], "x": x, "y": y, "note": e["note"]})
    mp.buildings.append({"key": "kwatera", "name": "Kwatera rotmistrza", "rect": [39, 12, 44, 17], "door": list(mp.kwatera_door),
                         "front": [mp.kwatera_door[0], mp.kwatera_door[1] + 1], "interior": QUARTERS, "hours": [7, 20]})
    mp.picture(40, 15, "!Flags_banner", 0, 2, 0, name="Chorągiew królewska (feniks)", priority=1)
    mp.picture(43, 15, "!Flags_banner", 0, 2, 1, name="Chorągiew królewska (feniks)", priority=1)
    # the requisition granary: the author's granary over the woodshed
    mp.stamp("spichlerz_drewutnia", 43, 21)
    mp.spichlerz_rect = [43, 22, 48, 30]
    mp.buildings.append({"key": "spichlerz", "name": "Spichlerz z rekwizycji", "rect": [43, 21, 48, 30], "door": [46, 30], "front": [46, 31],
                         "interior": None, "hours": None})
    # the watchtower in the north-east corner (PixelLab, tools/garnizon/art): the four legs on 3 cells
    mp.obj(49, 15, "!$Garnizon_Wieza", "Wieża strażnicza", occupy="left=1,right=1", note="<Garnizon:wieza>",
           cmds=[{"code": 355, "indent": 0, "parameters": ["Garnizon.look(this, \"wieza\");"]}])
    mp.solid |= {(48, 15), (50, 15)}


# ================================================================================================ things
def things(mp):
    T_ = lambda n, x, y: mp.thing(n, x, y)
    TP = lambda n, x, y, label=None, cmds=None: mp.town_prop(n, x, y, label=label, cmds=cmds)
    # the training ground
    for (x, y) in [(27, 21), (29, 21), (31, 21)]: TP("dummy", x, y, "Manekin do ćwiczeń")
    TP("target", 28, 25, "Tarcza strzelnicza"); TP("target", 31, 25, "Tarcza strzelnicza")
    TP("weapon_rack", 25, 19, "Stojak z bronią"); TP("weapon_rack_b", 33, 19, "Stojak z bronią")
    # the tents (soldiers'), the quartermaster's tent with his table (the buying)
    TP("tent_small", 25, 31, "Namiot żołnierzy"); TP("tent_small", 28, 31, "Namiot żołnierzy")
    TP("tent_hide", 32, 31, "Namiot kwatermistrza")
    TP("tent_small", 25, 28, "Namiot żołnierzy")
    T_("hay_low", 29, 28); T_("firewood", 39, 26); T_("chopping_block", 38, 27); T_("logs_small", 42, 26); T_("hay", 24, 25)
    T_("crate", 26, 17); T_("crate_b", 27, 17); T_("barrel", 32, 17); T_("crates_cloth", 47, 13)
    mp.picture(30, 19, "!Flags_banner", 0, 2, 1, name="Chorągiew królewska (feniks)", priority=1)
    T_("table", 32, 28); T_("stool", 34, 28)
    T_("sacks", 30, 28); T_("sacks_b", 30, 27); T_("crate", 34, 31)
    # the field kitchen: the cauldron on the fire (lit), a table, benches, barrels
    mp.obj(39, 28, "!Decoration", "Kuchnia polowa: kocioł", index=2, direction=6, step=True, note="<Garnizon:kuchnia>",
           light="<Light:160,120,60,18><LightFlicker:0.15>",
           cmds=[{"code": 355, "indent": 0, "parameters": ["Garnizon.look(this, \"kocioł\");"]}])
    T_("table", 37, 30); T_("log_bench", 40, 30); T_("barrel_pile", 40, 24)
    # the water barrels "from the ferry", guarded (a soldier stands by them): only a bubble, never water
    for (x, y) in [(50, 30), (50, 31)]:
        mp.town_prop("barrel_water" if y == 30 else "barrel_water_b", x, y, label="Beczka z wodą z promu",
                     cmds=[{"code": 355, "indent": 0, "parameters": ["Garnizon.look(this, \"beczki\");"]}])
    T_("barrels2", 49, 25)
    # the smithy corner of the garrison: anvil, grindstone, a rack of arrows
    TP("anvil", 34, 15, "Kowadło garnizonu"); TP("grindstone", 33, 14, "Szlifierka")
    T_("crate_open", 33, 16)
    # the stocks by the quarters (PixelLab) - for deserters and thieves
    mp.obj(46, 18, "!$Garnizon_Dyby", "Dyby", note="<Garnizon:dyby>",
           cmds=[{"code": 355, "indent": 0, "parameters": ["Garnizon.look(this, \"dyby\");"]}])
    # sacks of requisitioned grain by the granary, a cart
    T_("cart_sacks", 41, 20); T_("sacks", 42, 22); T_("sacks_b", 41, 22)
    # outside the gate: the recruiter's table under a cloth roof, the phoenix banner, the list on a board
    T_("table", 29, 7); T_("stool", 31, 7); T_("barrel", 27, 7)
    mp.script_ev(29, 7, "Stół werbownika", 'Garnizon.look(this, "stol");', priority=1)
    mp.picture(28, 7, "!Flags_banner", 0, 2, 2, name="Chorągiew królewska (feniks)", priority=1)
    mp.look(32, 7, "Lista poborowa", "Lista poborowa garnizonu. Pod pieczęcią z feniksem kolumny nazwisk. Kilka już przekreślonych.")
    T_("notice", 32, 7)
    # the pier with the rescue boat (soldiers fish the wreck's loot), the fire basket at its end
    pier = {(x, y) for x in range(4, 16) for y in (26, 27)}
    mp.kind(1, {c for c in pier if c in mp.sea_cells}, PLANKS)
    for c in pier:
        mp.solid.discard(c)
        mp.keep_free.add(c)
    mp.pier = pier
    mp.obj(9, 29, "!$Przystan_Lodz_Mala", "Łódź ratownicza garnizonu", step=True, note="<Garnizon:lodz>")
    mp.obj(4, 26, "!Decoration", "Kosz ogniowy na pomoście", step=True, light="<Light:170,120,60,18><LightFlicker:0.15>")
    T_("crate_sack", 14, 25); T_("rope", 13, 25)
    # the wreck far out on the shoal (the same as the harbour shows): background
    mp.obj(1, 17, "!$Przystan_Okret_Wrak", "Wrak okrętu na mieliźnie (w oddali)", note="<Garnizon:wrak>")
    # the signpost at the road's fork
    T_("signpost", 21, 6)
    mp.look(21, 7, "Drogowskaz", "Na północ: przystań. Na południe: garnizon wojsk królewskich.", priority=0, through=True)


# ================================================================================================ lights (flames only)
def lights(mp):
    mp.obj(34, 9, "!Decoration", "Koksownik przy bramie", index=0, direction=2, pattern=2, step=True,
           light="<Light:160,120,60,18><LightFlicker:0.15>")
    mp.thing("lantern_post", 38, 9)
    mp.obj(38, 8, "!Decoration", "Latarnia przy bramie", index=7, direction=2, priority=2, through=True,
           light="<Light:150,90,62,24><LightWhen:night>")
    mp.thing("lantern_post", 24, 17)
    mp.obj(24, 16, "!Decoration", "Latarnia koszar", index=7, direction=2, priority=2, through=True,
           light="<Light:140,90,62,22><LightWhen:night>")
    mp.obj(41, 31, "!Decoration", "Ognisko przy kuchni", index=2, direction=4, step=True,
           light="<Light:170,120,60,18><LightFlicker:0.15>")


# ================================================================================================ trees
def trees(mp):
    spots = [(53, 2), (49, 5), (54, 8), (45, 3), (54, 13), (54, 19), (54, 25), (54, 31), (53, 37), (47, 37), (41, 36), (34, 38),
             (27, 36), (20, 37), (42, 5), (29, 2), (35, 3), (55, 35), (50, 38), (38, 38), (24, 38), (31, 37), (44, 38),
             (26, 3), (32, 1), (39, 1), (46, 1), (51, 1)]
    kinds = ["pine", "pine_b", "pine", "leafy", "pine_b", "pine"]
    for i, (x, y) in enumerate(spots):
        if (x, y) in mp.taken or (x, y) in mp.keep_free or (x, y) in mp.sea_cells: continue
        mp.tree(x, y, kinds[i % len(kinds)])
        mp.solid.add((x, y))
    for (x, y, k) in [(48, 7, "fern"), (44, 7, "weed"), (52, 35, "fern_b"), (29, 35, "weed"), (39, 35, "white_fl"), (21, 31, "fern"),
                      (24, 35, "stones"), (19, 12, "weed"), (50, 34, "fern_c"), (46, 35, "weed")]:
        if (x, y) not in mp.taken and (x, y) not in mp.layers[2] and (x, y) not in mp.layers[3] and (x, y) not in mp.sea_cells:
            mp.clump(k, x, y)
    # black rocks along the bay's edge
    for (x, y) in [(12, 3), (13, 9), (11, 14), (9, 33), (8, 36), (12, 31)]:
        if (x, y) not in mp.sea_cells and (x, y) not in mp.taken: mp.clump("rock", x, y)


# ================================================================================================ the spots, the ways out
SPOTS = {   # TownLife's spots and the soldiers' posts (key: x, y, the way one faces there)
    # the captain: drill, the quarters' door, the round (gate, pier, tower), the kitchen, the fire
    "musztra": (30, 23, 2), "kwatera_drzwi": (42, 18, 8), "kuchnia": (38, 29, 6), "brama_wew": (36, 12, 2), "pomost": (14, 26, 4),
    "wieza": (49, 17, 8), "ognisko": (39, 31, 8), "brzeg": (17, 22, 4),
    # the quartermaster: the granary, his tent and table, the fire; sleeps in the tent
    "spichlerz": (46, 31, 8), "skup": (33, 29, 2), "namiot_kwat": (32, 32, 8), "ognisko_2": (42, 31, 8),
    # the recruiter: his table outside the gate; sleeps in the barracks
    "stol_werbownika": (30, 8, 2), "koszary_drzwi": (29, 15, 8), "przed_brama": (33, 10, 2),
    # the soldiers' posts (Garnizon.js): the gate, the pier, the tower, the barrels, the drill line, the fire, the boat
    "z_brama_l": (34, 11, 2), "z_brama_p": (38, 11, 2), "z_pomost": (12, 27, 4), "z_wieza": (48, 17, 2), "z_beczki": (49, 30, 4),
    "z_cwicz_1": (27, 22, 8), "z_cwicz_2": (29, 22, 8), "z_cwicz_3": (31, 22, 8), "z_ognisko_1": (38, 31, 8), "z_ognisko_2": (40, 32, 8),
    "z_lodz": (8, 27, 2), "z_namiot": (26, 32, 8), "z_koszary": (29, 15, 8), "z_kuznia": (34, 16, 8), "z_spichlerz": (45, 31, 6),
    "z_noc_brama": (36, 9, 2), "z_noc_pomost": (14, 27, 4),
}


def spots_and_exits(mp):
    for k, (x, y, d) in SPOTS.items():
        mp.spot(k, x, y, d)
    # the way back to the harbour: the top edge (21-23, 0) -> Map125 (21-23, 38) facing up
    for x in (21, 22, 23):
        mp.transfer(x, 0, HARBOUR, x, 38, 8, "Przejście -> Przystań")
        mp.exits.append({"x": x, "y": 0, "to": [HARBOUR, x, 38, 8]})
    # the sandbar's end (0, 20-21) -> the wreck (Map165 38, 20-21) - only at low tide and once the wreck's map is built (Garnizon.js)
    for y in BAR_ROWS:
        e = plib.event("Łacha -> Wrak", 0, y, None, 0, False, 1,
                       [{"code": 355, "indent": 0, "parameters": ["Garnizon.bar(this, %d);" % y]}], "<Garnizon:lacha>")
        mp.add(0, y, e)
        mp.exits.append({"x": 0, "y": y, "to": [WRECK, 38, y, 4], "tide": "low"})
    # the granary's door (a padlock; D27's night theft): Garnizon.granary(this)
    mp.script_ev(46, 30, "Drzwi spichlerza", "Garnizon.granary(this);", priority=1, note="<Garnizon:spichlerz>")


# ================================================================================================ the sandbar's picture (low tide)
def bar_picture(mp, data, events):
    """img/system/Garnizon_Lacha.png: the bar's cells drawn as wet sand on the sea - the difference between the map with the
    bar as sand and the map as it is (so the shore's edges of the autotiles come along); Garnizon.js lays it over the tilemap"""
    import mzrender as R
    from PIL import Image, ImageChops
    xs = [x for (x, y) in mp.bar]
    x0, x1 = 0, max(xs) + 1
    y0, y1 = BAR_ROWS[0] - 1, BAR_ROWS[1] + 1
    base = dict(mp.props); base["data"] = data; base["events"] = []
    S = R.Sheets(11); S.lenient = True
    a = R.render(base, S).crop((x0 * T, y0 * T, (x1 + 1) * T, (y1 + 1) * T))
    saved = {}
    for c in mp.bar:
        saved[c] = (mp.layers[0].get(c), mp.layers[1].get(c))
        mp.layers[0][c] = ("k", DIRT); mp.layers[1][c] = ("k", MUD)
    d2 = mp.resolve()
    for c, (l0, l1) in saved.items():
        if l0: mp.layers[0][c] = l0
        else: mp.layers[0].pop(c, None)
        if l1: mp.layers[1][c] = l1
        else: mp.layers[1].pop(c, None)
    alt = dict(mp.props); alt["data"] = d2; alt["events"] = []
    b = R.render(alt, S).crop((x0 * T, y0 * T, (x1 + 1) * T, (y1 + 1) * T))
    diff = ImageChops.difference(a.convert("RGB"), b.convert("RGB")).convert("L").point(lambda v: 255 if v > 6 else 0)
    # (only the sand and its wet rim: the alt render's water pixels - blue - stay out, the game's own sea (red in a drought) shows)
    px, dm = b.convert("RGB").load(), diff.load()
    for yy in range(b.height):
        for xx in range(b.width):
            r, g, bl = px[xx, yy]
            if dm[xx, yy] and bl > r + 12 and bl >= g - 6: dm[xx, yy] = 0
    out = b.copy(); out.putalpha(diff)
    p = ROOT + "img/system/Garnizon_Lacha.png"
    out.save(p)
    return {"file": "img/system/Garnizon_Lacha.png", "x": x0, "y": y0, "w": x1 - x0 + 1, "h": y1 - y0 + 1}


# ================================================================================================ regions, write
def paint_regions(mp, data, events):
    import paint_layers as PL
    flags = json.loads(open(ROOT + "data/Tilesets.json", "rb").read().decode("utf-8"))[11]["flags"]
    m = {"width": W, "height": H, "data": data, "events": events, "_id": MAP_ID}
    paint, keep, why = PL.plan(m, flags)
    keep |= {tuple(b["front"]) for b in mp.buildings}
    keep |= {(ex["x"], ex["y"]) for ex in mp.exits}
    base = 5 * W * H
    for (x, y) in paint:
        if (x, y) not in keep and data[base + y * W + x] == 0: data[base + y * W + x] = 2


def build():
    mp = Garrison()
    ground(mp)
    roads(mp)
    palisade(mp)
    buildings(mp)
    things(mp)
    lights(mp)
    trees(mp)
    spots_and_exits(mp)
    return mp


def write_staged(mp):
    data = mp.resolve()
    events = [None]
    for i, (x, y, e) in enumerate(mp.events, 1):
        e["_id"] = i
        events.append({"id": i, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": x, "y": y})
    paint_regions(mp, data, events)
    bar = bar_picture(mp, data, events)
    props = dict(mp.props)
    props["bgs"] = {"name": "Sea", "pan": 0, "pitch": 100, "volume": 35}
    props["autoplayBgs"] = False
    os.makedirs(STAGING_DATA, exist_ok=True)
    path = STAGING_DATA + "Map%03d.json" % MAP_ID
    write_map(path, props, data, events)
    bl = []
    for b in mp.buildings:
        r = {k: v for k, v in b.items() if k != "event"}
        if "event" in b: r["event_id"] = b["event"].get("_id")
        bl.append(r)
    meta = {"id": MAP_ID, "size": [W, H], "palisade": {"x0": X0, "x1": X1, "y0": Y0, "y1": Y1, "gate": list(GATE)},
            "bar": sorted([list(c) for c in mp.bar]), "bar_picture": bar, "shoal": sorted([list(c) for c in mp.shoal]),
            "buildings": bl, "spots": mp.spots, "lights": mp.lights, "exits": mp.exits, "objects": mp.objects,
            "pier": sorted([list(c) for c in mp.pier])}
    os.makedirs(STAGING, exist_ok=True)
    with open(os.path.join(STAGING, "Map%03d_meta.json" % MAP_ID), "wb") as f:
        f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    return path, data, events, meta


if __name__ == "__main__":
    mp = build()
    path, data, events, meta = write_staged(mp)
    print("Map162 Garnizon nad zatoką: %dx%d, %d zdarzeń -> %s" % (W, H, len(events) - 1, os.path.relpath(path, ROOT)))
