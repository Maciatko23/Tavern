# python tools/przystan/build.py   -> tools/przystan/staging/Map125.json (+ Map125_meta.json)
# Przystań (Map125, 56x40, tileset 11 - the town's, the Winlu author's tileset with full passage flags): the harbour on the
# island's west coast, behind Podgrodzie (docs/przystan/KONCEPCJA.md, approved by the user 2026-10-14). Built cell by cell in
# the manner of Podgrodzie (tools/podgrodzie/plib.py: the author's houses, things of the C sheet, decorative trees):
#   - the sea: the harbour basin = A1 kind 6 (deep water with a hard, quay-like edge), the beach bay = A1 kind 10 (water on a
#     sandy shore); the two never touch (an autotile edge would cut the water) - a rocky spit runs between them to the map's
#     west edge. Planks over the water (A1 kind 2 on layer 1, the author's own bridges) = the ferry pier and Janek's jetty.
#     The map's note <Water:salt>: no drinking here (Farming_Plots.js), only fishing - sea fish (herring, cod)
#   - the way in: one trail from the east edge (55,19) <- Podgrodzie's west edge (0,19), through the pines
#   - the Lord's post: the barrier (two posts) and the guard, the customs house with the Lord's red banners (interior 128),
#     the harbour store (closed, the customs officer has the key)
#   - Janek: his log hut (interior 126), the smokehouse, net racks and the fish table, his jetty and two boats
#   - Roch Szkwał: the shed by the slipway (interior 127); his cutter: a wreck on the beach -> dragged onto the slipway (D20)
#     -> afloat by the slipway; Przystan.js shows the one that fits (the events "Kuter: ..." found by name)
#   - the ferry ("Prom") at the pier on ferry days (Przystan.js), a warship's wreck on the shoal far out in the bay (background)
#   - lights: flames only (lanterns on posts, fire baskets, the customs brazier, the fire in a barrel)
#   - TownLife's spots "Miejsce: <key>" for Janek, Roch, the customs officer and the guard; TownQuests' marker for D20
# Never writes data/ (install.py does, with the editor closed).
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
for p in ("tools/newstart", "tools/town", "tools/podgrodzie"):
    sys.path.insert(0, ROOT + p)
import plib                                                      # noqa: E402
from plib import (Pod, event, pic, popup_cmds, GRASS, DIRT, GRASS_LIGHT, TUFTS, DRY, PEBBLES, STONES, HEDGE, FENCE_DARK,   # noqa: E402
                  COBBLE, B, C, D)
from nslib import NewMap, noise, lowfreq, write_map                # noqa: E402

STAGING = os.path.join(HERE, "staging")
MAP_ID, PODGRODZIE = 125, 111
W, H = 56, 40
NOTE = "<Clouds:on>\n<Farm:off>\n<Water:salt>"
SEA, SEA_BEACH, DEEP, PLANKS = 6, 10, 1, 2           # A1 kinds (tileset 11)
ENTRY = (55, 19)                                     # the one way in (Podgrodzie's (0,19) lands on (54,19))
INTERIORS = {"janek": 126, "szopa": 127, "komora": 128}
HOURS = {"janek": (6, 21), "szopa": (6, 22), "komora": (8, 18)}


class Harbour(Pod):
    def __init__(self, seed=125):
        NewMap.__init__(self, MAP_ID, W, H, 11, "Przystań", NOTE, seed=seed, bgm="", autoplay=False)
        self.buildings, self.spots, self.lights, self.doors, self.exits, self.notes = [], {}, [], [], [], []
        self.objects = []

    def obj(self, x, y, sheet, name, occupy=None, priority=1, step=False, through=False, note="", cmds=None, trigger=0, pattern=0):
        """a picture event of the harbour's own art (tools/przystan/art: boats, the ferry, the wrecks)"""
        n = note + ("<Occupy:%s>" % occupy if occupy else "")
        e = event(name, x, y, pic(sheet, 0, 2, pattern), priority, through, trigger, cmds, n, step, True, 3 if not step else 2, 3)
        self.add(x, y, e)
        self.objects.append({"name": name, "x": x, "y": y, "sheet": sheet})
        return e

    def look(self, x, y, name, text, color="info", priority=0, through=True):
        """an invisible thing to look at: the action button pops its line up over the hero"""
        e = event(name, x, y, None, priority, through, 0, popup_cmds(text, color), "")
        return self.add(x, y, e)


def lane(mp, pts, width, kind=DIRT, z=0, wobble=0.3, seed=5):
    cells = set()
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = int(max(abs(bx - ax), abs(by - ay)) * 3) + 1
        for i in range(n + 1):
            t = i / n
            cx, cy = ax + (bx - ax) * t, ay + (by - ay) * t
            r = width / 2.0 + wobble * (noise(int(cx * 2), int(cy * 2), seed) - 0.5) * 2
            for y in range(int(cy - r - 1), int(cy + r + 2)):
                for x in range(int(cx - r - 1), int(cx + r + 2)):
                    if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r and mp.inside(x, y): cells.add((x, y))
    mp.kind(z, cells, kind)
    return cells


# ================================================================================================ the ground and the sea
def coast(y):
    """the harbour basin's shore: land from this x on (rows 0-27)"""
    if y <= 8: return 13 + (1 if noise(0, y, 7) > 0.6 else 0) - (1 if y <= 2 else 0)
    if y <= 24: return 19            # the quay
    return 15                        # by the slipway


def bay_edge(y):
    return 7 + (y - 31) * 0.8


def ground(mp):
    mp.kind(0, mp.all, GRASS)
    for (x, y) in mp.all:
        if lowfreq(x, y, 31, 4.0) > 0.70: mp.layers[0][(x, y)] = ("k", GRASS_LIGHT)
    harbour = {(x, y) for y in range(0, 28) for x in range(W) if x < coast(y)}
    bay = {(x, y) for y in range(31, H) for x in range(W) if x < bay_edge(y) + (1 if noise(x, y, 9) > 0.7 else 0)}
    spit = {(x, y) for y in range(28, 31) for x in range(0, 18)}
    beach = set()
    for y in range(26, H):
        for x in range(W):
            if (x, y) in bay or (x, y) in harbour or (x, y) in spit: continue
            if y >= 31 and x < bay_edge(y) + 10 + 2 * noise(x, y, 4): beach.add((x, y))
            elif 25 <= y <= 30 and x < 23 + 2 * noise(x, y, 6): beach.add((x, y))
    shore_n = {(x, y) for y in range(0, 9) for x in range(W) if (x, y) not in harbour and x < coast(y) + 2}
    mp.kind(0, beach | spit | shore_n, DIRT)
    mp.kind(0, harbour, SEA)
    mp.kind(0, bay, SEA_BEACH)
    mp.kind(1, {(x, y) for (x, y) in harbour if x < 3 and 2 < y < 25}, DEEP)
    mp.kind(1, {(x, y) for (x, y) in bay if x < 3 and y > 33}, DEEP)
    for (x, y) in beach | shore_n:
        v = noise(x, y, 41)
        if v > 0.92 or v < 0.03: mp.layers[1][(x, y)] = ("k", PEBBLES)
    for (x, y) in spit:
        if noise(x, y, 51) < 0.3: mp.layers[1][(x, y)] = ("k", PEBBLES)
    mp.harbour, mp.bay, mp.spit, mp.beach = harbour, bay, spit, beach
    # the quay (cobbles) and the boatyard's floor by the slipway (planks on dry ground: A1 kind 2 over earth - no water there)
    quay = mp.rect(19, 9, 21, 24)
    mp.kind(0, quay, COBBLE)
    for c in quay: mp.layers[1].pop(c, None)
    mp.quay = quay
    # the piers: planks over the water (layer 1 over the sea)
    pier = mp.rect(5, 16, 18, 17) | mp.rect(4, 14, 6, 19)
    jetty = mp.rect(7, 6, 12, 7)
    slip = mp.rect(13, 25, 21, 27)
    for c in slip: mp.layers[1].pop(c, None)
    mp.kind(1, pier | jetty | slip, PLANKS)
    mp.pier, mp.jetty, mp.slip = pier, jetty, slip
    # the lanes (trodden earth)
    roads = set()
    roads |= lane(mp, [(55.5, 19.5), (50, 19.5), (46, 19.4), (42, 19.3), (37, 19.4), (30, 19.0), (24, 18.0), (21.5, 17.5)], 2.6, seed=11)
    roads |= lane(mp, [(21.5, 9.0), (21.6, 7.4), (24.5, 6.6), (31.5, 6.4)], 1.8, seed=12)          # quay -> Janek's hut -> smokehouse
    roads |= lane(mp, [(13.5, 7.0), (17, 7.2), (21, 8.0)], 1.6, seed=13)                          # jetty -> quay
    roads |= lane(mp, [(22, 25.6), (22.8, 28.5), (20.5, 31.5), (19, 34.5)], 1.8, seed=14)        # the shed -> the beach
    roads |= lane(mp, [(32.5, 18.0), (32.5, 17.6)], 1.2, seed=15)
    roads -= quay
    roads -= slip
    mp.roads = roads
    # the trail through the pines: one cell wide at the edge (Podgrodzie's side is one cell too)
    for x in range(50, 56):
        for y in (17, 18, 20, 21):
            if (x, y) in mp.roads: mp.layers[0][(x, y)] = ("k", GRASS)
        mp.roads.discard((x, 18)); mp.roads.discard((x, 20))
    for (x, y) in mp.all:
        if (x, y) in roads or (x, y) in beach or (x, y) in harbour or (x, y) in bay or (x, y) in spit or (x, y) in shore_n: continue
        if (x, y) in quay or (x, y) in slip: continue
        if lowfreq(x, y, 77, 2.0) > 0.82: mp.layers[1][(x, y)] = ("k", DRY)
        elif lowfreq(x, y, 91, 2.5) > 0.72: mp.layers[1][(x, y)] = ("k", TUFTS)


# ================================================================================================ the forest (east), the trees
def forest(mp):
    band = set()
    for (x, y) in mp.all:
        t = 46 + 2.5 * (lowfreq(x, y, 61, 3.0) - 0.5) * 2
        edge = (x >= t) or (y <= 0 and x >= 34)
        if edge and (x, y) not in mp.roads: band.add((x, y))
    band -= {(x, 19) for x in range(42, 56)}
    band |= {(x, y) for x in range(50, 56) for y in (18, 20)}
    mp.kind(1, band, HEDGE)
    mp.band = band
    trees = [(44, 2, "pine"), (47, 1, "pine_b"), (50, 3, "leafy"), (53, 1, "pine"), (55, 4, "pine_b"), (40, 1, "leafy"), (36, 0, "pine"),
             (45, 7, "leafy"), (49, 8, "pine"), (52, 9, "pine_b"), (55, 12, "pine"), (44, 12, "pine_b"), (47, 14, "leafy"), (51, 15, "pine"),
             (54, 16, "pine_b"), (43, 16, "pine"), (48, 17, "pine_b"),
             (44, 23, "pine"), (48, 23, "leafy"), (52, 23, "pine_b"), (55, 22, "pine"), (46, 28, "pine_b"), (50, 29, "pine"), (54, 30, "leafy"),
             (42, 31, "pine"), (45, 34, "leafy"), (49, 35, "pine_b"), (53, 36, "pine"), (39, 37, "pine_b"), (35, 38, "leafy"), (31, 37, "pine"),
             (37, 25, "leafy"), (33, 30, "pine"), (28, 34, "pine_b"), (40, 9, "leafy"), (36, 6, "pine_b"), (26, 38, "bush"), (38, 31, "bush")]
    for (x, y, k) in trees:
        if (x, y) not in mp.roads and (x, y) not in mp.taken: mp.tree(x, y, k)
    for (x, y, k) in [(25, 36, "fern"), (22, 38, "weed"), (27, 31, "fern_b"), (17, 38, "weed"), (30, 26, "stones"), (34, 9, "fern"),
                      (38, 13, "weed"), (42, 26, "fern_c"), (24, 33, "white_fl"), (29, 22, "fern"), (36, 22, "weed"), (34, 3, "white_fl")]:
        if (x, y) not in mp.taken and (x, y) not in mp.layers[2] and (x, y) not in mp.layers[3]: mp.clump(k, x, y)
    # black rocks on the spit and along the bay (the ravens' perches)
    for (x, y) in [(0, 29), (1, 28), (2, 30), (3, 29), (4, 28), (5, 30), (6, 29), (8, 28), (9, 30), (10, 29), (12, 28), (13, 30), (15, 29),
                   (16, 28)]:
        mp.clump("rock" if (x + y) % 3 else "stones", x, y)


# ================================================================================================ the buildings
def houses(mp):
    mp.house("janek", "Chata Janka", 22, 1, 6, 3, 2, "thatch", "logs", door=2, windows=[(4, "wood_lit")],
             chimney=4, chimney_style=3, lean="right", lean_fill="barrel", interior="janek", hours=HOURS["janek"])
    mp.house("wedzarnia", "Wędzarnia Janka", 30, 2, 3, 2, 2, "planks", "dark_boards", door=1, chimney=1, chimney_style=5,
             closed_text="Wędzarnia Janka. W środku dym i ryby na żerdziach.")
    mp.house("sklad", "Skład portowy", 23, 9, 6, 3, 2, "shingle_dark", "planks", door=3, windows=[(1, "board")],
             closed_text="Skład portowy. Zamknięte - klucz ma celnik.")
    mp.house("komora", "Komora celna", 30, 13, 6, 3, 2, "slate", "boards_stone", door=2, windows=[(4, "shut_lit")],
             chimney=0, chimney_style=4, interior="komora", hours=HOURS["komora"],
             closed_text="Komora celna. Zamknięte - celnik przyjmuje od 8 do 18.")
    mp.house("szopa", "Szopa przy pochylni", 22, 21, 5, 2, 2, "planks_b", "dark_boards", door=1, windows=[(3, "tiny")],
             lean="left", lean_fill="logs", interior="szopa", hours=HOURS["szopa"],
             closed_text="Szopa przy pochylni. Zamknięte od środka.")
    # the Lord's red banners with the black horse on the customs house's wall
    mp.picture(30, 17, "!Flags_banner", 0, 4, 1, name="Chorągiew Lorda", priority=1)
    mp.picture(35, 17, "!Flags_banner", 0, 4, 0, name="Chorągiew Lorda", priority=1)


# ================================================================================================ things
def things(mp):
    T_ = lambda n, x, y: mp.thing(n, x, y)
    # the quay: the ferry's cargo, the requisitioned grain before the store
    T_("crate", 20, 12); T_("crate_b", 20, 14); T_("barrel_pile", 22, 15); T_("barrels2", 26, 15)
    T_("sacks", 28, 15); T_("sacks_b", 29, 16); T_("cart_sacks", 27, 22)
    T_("crate_sack", 21, 21); T_("rope", 20, 23)
    # Janek's yard: net racks (stand-ins until the art), the fish table, baskets, a bench
    T_("hide_rack", 16, 3); T_("hide_rack_b", 17, 3); T_("hide_rack", 19, 3)
    T_("table", 14, 3); T_("basket_jugs", 21, 4); T_("basket_apples", 20, 4); T_("bench", 16, 8)
    # the shed and the slipway: ropes, a barrel of tar, crates, a ladder against the wall
    T_("barrel", 27, 24); T_("crate_open", 27, 25); T_("logs_small", 21, 26)
    T_("signpost", 41, 21)
    T_("weapon_rack", 36, 16); T_("notice", 38, 16)
    # the barrier on the road: two posts either side of it
    mp.kind(1, {(39, 17), (39, 21)}, FENCE_DARK)


# ================================================================================================ the harbour's own objects (art agent)
def objects(mp):
    # the ferry: moored on the pier's south side (shown on ferry days only - Przystan.js)
    mp.obj(11, 21, "!$Przystan_Prom", "Prom", step=True)
    # Janek's boats by his jetty (his own is away at sea in the morning - Przystan.js)
    mp.obj(9, 5, "!$Przystan_Lodz_Janka", "Łódź Janka", step=True)
    mp.obj(10, 9, "!$Przystan_Lodz_Mala", "Łódka", step=True)
    # Roch's cutter: the wreck on the beach -> on the slipway (being mended) -> afloat by the slipway
    mp.obj(15, 35, "!$Przystan_Kuter_Wrak", "Kuter: wrak na plaży", occupy="left=2,right=2,up=1",
           cmds=popup_cmds("Kuter przemytnika. Burta rozbita, maszt złamany."))
    mp.obj(18, 27, "!$Przystan_Kuter_Wrak", "Kuter: na pochylni", occupy="left=2,right=2,up=1",
           cmds=popup_cmds("Kuter na pochylni. Roch łata burtę."))
    mp.obj(10, 25, "!$Przystan_Kuter", "Kuter: na wodzie", step=True)
    # the warship on the shoal, far out in the bay (half off the map)
    mp.obj(2, 39, "!$Przystan_Okret_Wrak", "Wrak okrętu na mieliźnie", priority=1)
    # things to look at
    mp.look(28, 5, "Beczka na deszczówkę", "Pusta. Deszcz dawno nie padał.", priority=1, through=False)
    mp.look(41, 20, "Drogowskaz", "Na wschód: Podgrodzie i miasteczko.")
    mp.look(38, 16, "Tablica celna", "„Opłata portowa: dwa grosze od tobołka. Kamienie z krukiem do zgłoszenia. Rozkaz dworu.”",
            priority=1, through=False)


# ================================================================================================ lights (flames only)
LANTERN = "<Light:150,90,62,24><LightWhen:night>"
BASKET = "<Light:170,120,60,18><LightFlicker:0.15>"     # (a smaller ring: the warm glow fills more of it over the water)
BRAZIER = "<Light:160,120,60,18><LightFlicker:0.15>"
BARREL_FIRE = "<Light:150,120,60,16><LightFlicker:0.15>"


def lights(mp):
    mp.thing("lantern_post", 21, 9)
    mp.light(21, 8, "!Decoration", 7, 2, 0, "Latarnia na nabrzeżu", LANTERN, priority=2, through=True)
    mp.thing("lantern_post", 18, 23)
    mp.light(18, 22, "!Decoration", 7, 2, 0, "Latarnia przy pochylni", LANTERN, priority=2, through=True)
    mp.light(4, 14, "!Decoration", 0, 2, 0, "Kosz ogniowy na końcu mola", BASKET, priority=1, step=True)
    mp.light(7, 6, "!Decoration", 0, 2, 1, "Kosz ogniowy na pomoście", BASKET, priority=1, step=True)
    mp.light(37, 17, "!Decoration", 0, 2, 2, "Koksownik przy szlabanie", BRAZIER, priority=1, step=True)
    mp.light(26, 5, "!Decoration", 7, 4, 0, "Latarnia u Janka", "<Light:140,90,62,22><LightWhen:night>", priority=2, through=True)
    mp.light(26, 26, "!Decoration", 2, 4, 0, "Ognisko w beczce przy szopie", BARREL_FIRE, priority=1, step=True)
    mp.light(34, 17, "!Decoration", 7, 4, 0, "Latarnia komory celnej", "<Light:140,90,62,22><LightWhen:night>", priority=2, through=True)


# ================================================================================================ the spots, the way out
SPOTS = {   # TownLife's spots (key: x, y, the way the resident faces) - docs/przystan/MIEJSCA.md
    "janek_drzwi": (24, 6, 8), "lodz": (9, 6, 8), "na_morze": (7, 7, 4), "pomost": (11, 7, 2), "wedzarnia": (31, 6, 8),
    "lawka": (18, 8, 4), "sieci": (18, 5, 8), "stol_ryb": (16, 4, 4), "nabrzeze": (20, 16, 4), "tawerna": (53, 19, 6),
    "szopa_drzwi": (23, 25, 8), "wrak": (18, 34, 4), "pochylnia": (21, 27, 4), "nabrzeze_rog": (20, 10, 4), "beczka_ogien": (25, 26, 6),
    "plaza": (21, 33, 2), "molo": (13, 17, 2), "molo_kontrola": (18, 16, 4), "komora_drzwi": (32, 18, 8), "komora_przed": (34, 19, 2),
    "szlaban": (38, 17, 2), "molo_wejscie": (21, 17, 4),
    # TownQuests' D20 marker: where the hero stands to drag the wreck off the beach
    "d20_wrak": (18, 35, 4),
}


def spots_and_exits(mp):
    for k, (x, y, d) in SPOTS.items():
        mp.spot(k, x, y, d)
    mp.transfer(ENTRY[0], ENTRY[1], PODGRODZIE, 1, 19, 6, "Przejście -> Podgrodzie")


# ================================================================================================ regions, write
def paint_regions(mp, data, events):
    import paint_layers as PL
    flags = json.loads(open(ROOT + "data/Tilesets.json", "rb").read().decode("utf-8"))[11]["flags"]
    m = {"width": W, "height": H, "data": data, "events": events, "_id": MAP_ID}
    paint, keep, why = PL.plan(m, flags)
    keep |= {tuple(b["front"]) for b in mp.buildings}
    keep |= {(ex["x"] - 1, ex["y"]) for ex in mp.exits}
    base = 5 * W * H
    for (x, y) in paint:
        if (x, y) not in keep and data[base + y * W + x] == 0: data[base + y * W + x] = 2


def build():
    mp = Harbour()
    ground(mp)
    houses(mp)
    things(mp)
    objects(mp)
    lights(mp)
    forest(mp)
    spots_and_exits(mp)
    return mp


def write_staged(mp):
    data = mp.resolve()
    events = [None]
    for i, (x, y, e) in enumerate(mp.events, 1):
        e["_id"] = i
        events.append({"id": i, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": x, "y": y})
    paint_regions(mp, data, events)
    props = dict(mp.props)
    props["bgs"] = {"name": "Sea", "pan": 0, "pitch": 100, "volume": 40}
    os.makedirs(STAGING, exist_ok=True)
    path = os.path.join(STAGING, "Map%03d.json" % MAP_ID)
    write_map(path, props, data, events)
    bl = []
    for b in mp.buildings:
        r = {k: v for k, v in b.items() if k != "event"}
        r["event_id"] = b["event"].get("_id")
        bl.append(r)
    meta = {"id": MAP_ID, "size": [W, H], "entry": list(ENTRY), "buildings": bl, "spots": mp.spots, "lights": mp.lights,
            "exits": mp.exits, "objects": mp.objects, "interiors": INTERIORS, "hours": {k: list(v) for k, v in HOURS.items()}}
    with open(os.path.join(STAGING, "Map%03d_meta.json" % MAP_ID), "wb") as f:
        f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    return path, data, events, meta


if __name__ == "__main__":
    mp = build()
    path, data, events, meta = write_staged(mp)
    print("Map125 Przystań: %dx%d, %d zdarzeń -> %s" % (W, H, len(events) - 1, os.path.relpath(path, ROOT)))
