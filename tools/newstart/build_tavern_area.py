# The tavern's surroundings, generated: Map008 "Okolice Tawerny" becomes the yard in front of the tavern "Pod Złotym Kuflem".
#   python build_tavern_area.py            - writes tools/newstart/staging/Map008.json (NOT data/: the editor may be open)
#   python build_tavern_area.py --rebase   - builds even if data/Map008.json changed since the map was designed
# tools/apply_tavern_area.py installs it (and adds the way out to Map001) while the editor is closed.
#
# What is on the map (30x24, tileset 9 like the other outdoor maps):
#   - the tavern's front (17 tiles wide, like the room inside, Map001): an orange shingle roof with two lit dormers and two
#     smoking chimneys, a timber-framed upper floor with windows, a stone ground floor with shuttered lit windows and flower
#     boxes, the inn sign (a mug of beer) over a big arched double gate, lanterns either side of it
#   - the gate (13..15, 9): walking up into it opens it (Door1) and takes the player inside Map001 (8, 11)
#   - a flagstone forecourt, a dirt road to the south edge (the lane to "Polna droga", its transfers kept as they are) and one
#     to the east edge (to "Posiadłość Lorda", transfers kept), a signpost at the fork, lamp posts
#   - a wooden terrace with tables, benches and stools (a beer garden) west of the forecourt; benches against the wall
#   - east of the tavern its back yard: a woodshed, a chopping block, barrels, a cart; a hitching rail with hay by the road
#   - a notice board by the gate; trees at the edges (Map003's pines, small and fruit trees), leafless thickets, stones, flowers
# The yard's things are pictures of the Winlu C sheet on !Tavern_Yard (build_tavern_props.py): events that block their tiles
# with <Occupy:...>. The building is closed by invisible events named "Tawerna" (tileset 9 has no passability flags): if the
# building is moved in the editor, move them with it. Nature is Map003's own events (they chop / mine / fruit like there).
# No water anywhere (the drought is part of the game).
import sys, os, json, hashlib, copy
from nslib import *
from tavern_layout import *
import build_tavern_props as P

HERE = os.path.dirname(os.path.abspath(__file__))
STAGING = os.path.join(HERE, "staging")
SRC = ROOT + "data/Map008.json"

def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()

# ------------------------------------------------------------------ small builders
def msg(*lines):
    out = [{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]}]
    out += [{"code": 401, "indent": 0, "parameters": [l]} for l in lines]
    return out

def prop(mp, x, y, name, label, cmds=None, trigger=0, force=False):
    """one of the yard's things (!Tavern_Yard) standing on (x, y); it blocks the tiles its <Occupy> covers"""
    i = P.INDEX[name]
    k, d, p = P.image_of(i)
    o = P.PROPS[i][4]
    cells = [(x + dx, y + dy) for dy in range(-o.get("up", 0), o.get("down", 0) + 1) for dx in range(-o.get("left", 0), o.get("right", 0) + 1)]
    bad = [c for c in cells if not mp.inside(*c) or c in mp.taken or c in mp.keep_free]
    if bad and not force:
        raise SystemExit("%s at (%d,%d) would stand on taken/kept tiles %s" % (name, x, y, bad))
    e = {"name": label, "note": P.occupy_note(name),
         "pages": [blank_page(priority=1, trigger=trigger, image={"characterName": P.SHEET, "characterIndex": k, "direction": d, "pattern": p},
                              cmds=cmds, direction_fix=True)]}
    mp.add(x, y, e, cells)
    return e

def route(*cmds, repeat=False, skippable=False, wait=True):
    lst = []
    for c in cmds:
        code, *par = c if isinstance(c, tuple) else (c,)
        lst.append({"code": code, "indent": None, **({"parameters": list(par)} if par else {})})
    lst.append({"code": 0})
    return {"list": lst, "repeat": repeat, "skippable": skippable, "wait": wait}

def set_route(r):
    """Set Movement Route (this event) as the editor writes it: the 205 command and one 505 line per step"""
    return [{"code": 205, "indent": 0, "parameters": [0, r]}] + [{"code": 505, "indent": 0, "parameters": [c]} for c in r["list"][:-1]]

TURN_DOWN, TURN_LEFT, TURN_RIGHT, TURN_UP, WAIT, DIRFIX_OFF = 16, 17, 18, 19, 15, 36

def chimney(mp, x, y, index, pattern, phase=0):
    """an animated chimney with smoke (the pack's !Fantasy_chimney: the smoke rises through the four rows, there and back);
    phase: how many steps into the loop it starts (two chimneys side by side do not puff together)"""
    e = {"name": "Komin", "note": "", "pages": [blank_page(priority=1, through=True, image={"characterName": "!Fantasy_chimney",
         "characterIndex": index, "direction": 2, "pattern": pattern})]}
    pg = e["pages"][0]
    steps = [(TURN_DOWN, (WAIT, 9)), (TURN_LEFT, (WAIT, 9)), (TURN_RIGHT, (WAIT, 9)), (TURN_UP, (WAIT, 18)), (TURN_RIGHT, (WAIT, 9)), (TURN_LEFT, (WAIT, 9))]
    steps = steps[phase:] + steps[:phase]
    r = route(*[c for st in steps for c in st], repeat=True, skippable=True, wait=False)
    r["list"][-1]["parameters"] = []
    pg.update({"moveType": 3, "moveRoute": r, "moveFrequency": 5, "moveSpeed": 3, "directionFix": False})
    mp.events.append((x, y, e))
    return e

def picture(mp, x, y, char, index, direction, pattern, name, through=True, priority=1):
    e = {"name": name, "note": "", "pages": [blank_page(priority=priority, through=through, direction_fix=True,
         image={"characterName": char, "characterIndex": index, "direction": direction, "pattern": pattern})]}
    mp.events.append((x, y, e))
    return e

# ------------------------------------------------------------------ the map
def design(base):
    mp = NewMap(OUTSIDE_MAP, 30, 24, 9, base["displayName"], "<Clouds:on>\n<Farm:off>", 808, bgm="Town1")
    # the map's own properties stay (music, name...): only the tileset and the note change
    props = {k: v for k, v in base.items() if k not in ("data", "events")}
    props.update({"tilesetId": 9, "note": "<Clouds:on>\n<Farm:off>"})
    mp.props = props
    W, H = mp.W, mp.H

    # --- the transfers already there, first, so they keep their ids 1..6
    kept = [e for e in base["events"] if e]
    assert [(e["x"], e["y"]) for e in kept] == KEPT_TRANSFERS, "Map008's events are not the six transfers of the new start"
    for e in kept:
        mp.events.append((e["x"], e["y"], {k: copy.deepcopy(e[k]) for k in ("name", "note", "pages")}))
        mp.taken.add((e["x"], e["y"]))

    # --- ways: the flagstone forecourt and the walk along the front; dirt roads south and east (the lanes of the road maps)
    court = mp.rect(10, 10, 18, 12) | mp.rect(6, 10, 22, 10)
    south = path(mp, [(14, 12), (14, 16), (14.4, 19.5), (14, 24)], 3.0)
    east = path(mp, [(17, 11), (22, 11.2), (26, 10.9), (30, 11)], 3.0)
    south |= mp.rect(13, 21, 15, 23)                     # the exit tiles stay road whatever the curve does
    east |= mp.rect(27, 10, 29, 12)
    roads = (south | east) - court
    terrace = mp.rect(2, 12, 9, 16)
    mp.keep_free |= court | roads | terrace
    for (x, y) in KEPT_TRANSFERS:
        for dy in (-2, -1, 0, 1, 2):
            for dx in (-2, -1, 0, 1, 2):
                if mp.inside(x + dx, y + dy): mp.keep_free.add((x + dx, y + dy))

    # --- the tavern: 17 tiles wide like the room inside; roof 1..4, timber-framed upper floor 5..6, stone ground floor 7..9
    X0, X1 = 6, 22
    ROOF, UPPER, LOWER = 63, 77, 76
    mp.kind(0, mp.rect(X0, 1, X1, 4), ROOF)
    mp.kind(0, mp.rect(X0, 5, X1, 6), UPPER)
    mp.kind(0, mp.rect(X0, 7, X1, 9), LOWER)
    building = mp.rect(X0, 0, X1, 9)
    # windows: shuttered and lit below (2x2) with flower boxes under them; small lit ones upstairs
    for wx in (7, 10, 17, 20):
        mp.tile(2, wx, 7, B(2, 2)); mp.tile(2, wx + 1, 7, B(3, 2))
        mp.tile(2, wx, 8, B(2, 3)); mp.tile(2, wx + 1, 8, B(3, 3))
    for wx, box in ((7, B(7, 0)), (10, B(7, 1)), (17, B(7, 1)), (20, B(7, 0))):
        mp.tile(2, wx, 9, box); mp.tile(2, wx + 1, 9, box)
    for wx in (8, 10, 12, 16, 18, 20):                           # (a window is two B tiles: its top and its bottom half)
        mp.tile(2, wx, 5, B(2, 0)); mp.tile(2, wx, 6, B(2, 1))
    # the gate: the pack's arched double door (the one in the old castle's style); walking into it opens it and leads inside
    gx, gy = GATE
    tx, ty, td = INSIDE_LANDING
    gate_cmds = ([{"code": 250, "indent": 0, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]}]
                 + set_route(route(DIRFIX_OFF, TURN_LEFT, (WAIT, 3), TURN_RIGHT, (WAIT, 3), TURN_UP, (WAIT, 3)))
                 + [{"code": 201, "indent": 0, "parameters": [0, TAVERN_MAP, tx, ty, td, 0]}])
    gate = {"name": "Drzwi tawerny -> Tawerna", "note": "<Occupy:left=1,right=1>",
            "pages": [blank_page(priority=1, trigger=1, direction_fix=True, cmds=gate_cmds,
                                 image={"characterName": "!$Gate_Wood1", "characterIndex": 0, "direction": 2, "pattern": 1})]}
    mp.add(gx, gy, gate, GATE_TILES)
    # the sign over the gate (a mug of beer), lanterns either side, dormers and chimneys on the roof
    picture(mp, gx, 6, "!Signs", 2, 2, 1, "Szyld: Pod Złotym Kuflem")
    for lx in (12, 16):
        picture(mp, lx, 9, "!Decoration", 7, 2, 0, "Latarnia na ścianie")
    for dx in (9, 19):
        picture(mp, dx, 4, "!Roof_Windows", 0, 8, 1, "Okno na dachu")
    chimney(mp, 11, 2, 1, 1)
    chimney(mp, 18, 1, 1, 2, phase=3)
    # closed by invisible events (the gate closes its own three tiles)
    mp.blocker(X0, 0, X1, 8, "Tawerna")
    mp.blocker(X0, 9, gx - 2, 9, "Tawerna")
    mp.blocker(gx + 2, 9, X1, 9, "Tawerna")
    mp.keep_free |= building
    # a few pines behind the roof (only their lower branches show above the ridge)
    for x in (7, 13, 20):
        mp.put(x, 0, PINE["B"][0], name=PINE["B"][1], force=True)

    # --- against the front wall: benches, the notice board, barrels
    mp.keep_free -= mp.rect(6, 10, 22, 10)
    prop(mp, 8, 10, "bench", "Ława")
    prop(mp, 19, 10, "bench_b", "Ława")
    prop(mp, 11, 10, "notice_board", "Tablica ogłoszeń", trigger=0,
         cmds=msg("Tablica ogłoszeń. Przybita gwoździem kartka:",
                  "„Karczma Pod Złotym Kuflem przyjmie do pracy",
                  "chętne ręce. Pytać Borgara.”"))
    prop(mp, 17, 10, "barrel", "Beczka piwa")
    prop(mp, 6, 10, "barrel_three", "Beczki")
    prop(mp, 22, 10, "crate_jug", "Skrzynka z dzbanem")
    mp.keep_free |= mp.rect(6, 10, 22, 10)

    # --- the beer garden: a wooden terrace with two tables
    prop(mp, 3, 15, "bench_long_l", "Ława", force=True)
    prop(mp, 4, 15, "table_long", "Długi stół", force=True)
    prop(mp, 5, 15, "bench_long_r", "Ława", force=True)
    prop(mp, 7, 14, "table", "Stół", force=True)
    prop(mp, 6, 14, "stool", "Stołek", force=True)
    prop(mp, 9, 13, "stool_b", "Stołek", force=True)
    prop(mp, 7, 16, "bench", "Ława", force=True)
    prop(mp, 2, 13, "barrel", "Beczka piwa", force=True)
    prop(mp, 9, 16, "planter_flowers", "Donica z kwiatami", force=True)

    # --- the back yard east of the tavern: firewood under a roof, a chopping block, barrels, a cart, crates
    prop(mp, 25, 4, "woodshed", "Drewutnia")
    prop(mp, 27, 5, "chopping_block", "Pniak z siekierą")
    prop(mp, 27, 3, "logs_small", "Polana")
    prop(mp, 24, 7, "barrel_pile", "Beczki")
    prop(mp, 25, 9, "cart", "Wózek")
    prop(mp, 23, 6, "crate_lid", "Skrzynia")
    prop(mp, 23, 3, "sacks", "Worki")

    # --- by the roads: the signpost at the fork, lamp posts, the hitching rail with hay, a cart of hay's worth of sacks
    prop(mp, 17, 13, "signpost", "Drogowskaz", cmds=msg("Drogowskaz. Na południe: Polna droga.", "Na wschód: Posiadłość Lorda."))
    for x, y in [(12, 13), (16, 13), (23, 9), (26, 13), (12, 20), (16, 20)]:
        e = {"name": "Latarnia", "note": "", "pages": [blank_page(priority=1, direction_fix=True,
             image={"characterName": "!lamp", "characterIndex": 0, "direction": 2, "pattern": 0})]}
        mp.add(x, y, e)
    prop(mp, 20, 13, "hitching_rail", "Palik do uwiązania koni")
    prop(mp, 23, 15, "hay", "Siano")
    prop(mp, 19, 15, "sack", "Worek")
    prop(mp, 11, 17, "barrel_apples", "Beczka jabłek")
    prop(mp, 10, 17, "crate", "Skrzynia")

    # --- nature at the edges: Map003's own events
    rnd = mp.rnd
    west = {(x, y) for (x, y) in mp.all if x <= 1 + int(2 * noise(0, y, 811)) and y <= 21}
    westn = {(x, y) for (x, y) in mp.all if x <= 4 and y <= 9}
    eastn = {(x, y) for (x, y) in mp.all if x >= 28 and y <= 8}
    easts = {(x, y) for (x, y) in mp.all if x >= 27 + int(2 * noise(0, y, 812)) and y >= 15}
    southb = {(x, y) for (x, y) in mp.all if y >= 21 + int(2 * noise(x, 0, 813))}
    edge = (west | westn | eastn | easts | southb) - building - terrace - court - roads - ring(mp, roads, 1)
    mp.forest_var(edge, 2.2, 3.2, small=0.2, seed=814)
    for x, y, pic in [(3, 19, "!$Tree_Apple"), (8, 20, "!$Tree_Pear"), (20, 18, "!$Tree_Small"), (24, 20, "!$Tree_Apple"),
                      (10, 22, "!$Bush_Bare_Wide"), (18, 22, "!$Bush_Bare_B"), (5, 22, "!$Bush_Bare_Tall"), (25, 17, "!$Bush_Bare_A"),
                      (19, 20, "!$Rock_Flat"), (6, 18, "!$Rock_Mossy"), (22, 22, "!$Rock_Pile"), (4, 11, "!$Rock_Chunk"),
                      (2, 7, "!$Bush_Bare_Thicket"), (27, 16, "!$Rock_Mound")]:
        mp.put(x, y, pic)

    # --- flowers by the tavern and in the grass (the D sheet's, as on the other built maps)
    for x, y, t in [(5, 10, D(8, 7)), (5, 9, D(14, 8)), (23, 10, D(12, 10)), (10, 14, D(8, 8)), (11, 15, D(12, 9)), (12, 16, D(14, 8)),
                    (16, 15, D(8, 7)), (17, 16, D(12, 10)), (21, 17, D(14, 11)), (9, 18, D(8, 8)), (4, 17, D(12, 9)), (22, 19, D(8, 7))]:
        if mp.free(x, y):
            mp.tile_event(x, y, t, "Kwiaty")

    # --- the ground: Map003's grass kinds, the roads, the court and the terrace
    light = blob(mp, 14, 16, 7, 4, 821) | blob(mp, 24, 12, 4, 3, 822)
    flowers = (patch(mp, 11, 15.5, 1.2, 831) | patch(mp, 20, 17.5, 1.3, 832) | patch(mp, 4, 18, 1.0, 833)) - court - roads - terrace
    keep = building | court | terrace
    ground(mp, paths=roads, woods=edge, light=light, flowers=flowers, tall_n=10, keep=keep)
    mp.kind(0, court, 19)                      # flagstones
    mp.kind(0, terrace, 33)                    # the terrace's boards
    for c in court | terrace: mp.layers[1].pop(c, None)
    for c in building: mp.layers[1].pop(c, None)
    for c in mp.rect(X0, 0, X1, 0): mp.layers[0][c] = ("k", 16)     # grass behind the roof
    # region 7 (Farming: never farmland, nothing grows) on the ways and where the player arrives
    for c in court | roads | terrace:
        mp.region[c] = 7
    for (x, y) in KEPT_TRANSFERS:
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if mp.inside(x + dx, y + dy): mp.region[(x + dx, y + dy)] = 7
    return mp

def main():
    base_hash = sha(SRC)
    if base_hash != BASE_SHA256["Map008.json"] and "--rebase" not in sys.argv:
        raise SystemExit("data/Map008.json changed since the tavern area was designed (was it edited in the editor?). "
                         "Look at the change first; --rebase builds on the file as it is now.")
    base = json.load(open(SRC, encoding="utf-8"))
    mp = design(base)
    os.makedirs(STAGING, exist_ok=True)
    data, events = mp.resolve(), mp.build_events()
    out = os.path.join(STAGING, "Map%03d.json" % OUTSIDE_MAP)
    write_map(out, mp.props, data, events)
    # the file it was built on: the apply script replaces data/Map008.json only while it is still this one
    with open(os.path.join(STAGING, "Map%03d.base.json" % OUTSIDE_MAP), "wb") as f:
        f.write(json.dumps({"Map008.json": base_hash}, indent=1).encode("utf-8"))
    kinds = {}
    for x, y, e in mp.events:
        p = e["pages"][0]["image"]
        k = p["characterName"] or ("tile%d" % p["tileId"] if p["tileId"] else ("transfer" if any(c["code"] == 201 for c in e["pages"][0]["list"]) else e["name"]))
        kinds[k] = kinds.get(k, 0) + 1
    print("staged %s: %dx%d tileset %d, %d events (built on data/Map008.json %s)" % (out, mp.W, mp.H, mp.props["tilesetId"], len(events) - 1, base_hash[:12]))
    print("   ", ", ".join("%s x%d" % (k.replace("!$", "").replace("!", ""), v) for k, v in sorted(kinds.items())))

if __name__ == "__main__":
    main()
