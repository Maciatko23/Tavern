# What tools/quest_places/build.py changes on the existing maps (docs/miasta_miejsca_zadan.md has the table):
#   Map008 (the town, the user's map - only these three events, nothing else):
#     "Studnia miejska: zejście"          (25,34) the well's east stones: action -> with 2x Lina a question, then Map118;
#                                         without, a popup over the hero. The ration events 241/242 stay as they are.
#     "Płyta w ścieżce (ogród rycerzy)"   (6,12)  page 1: nothing (just the garden's ground); page 2 (self-switch A, set by the
#                                         quest): the opened slab with the stairs down, action -> Map119
#     "Miejsce: plyta"                    (6,12)  the marker
#   Map024 (the Lord's manor): the orangery in the south-west of the garden, built against the estate's west hedge (x 5-9,
#     rows 19-23: the manor's red roof A3 kind 56, its stone ground floor A4 kind 105, region 2), glazed arched windows with
#     orange trees behind them and a glazed door (pictures), a stove chimney; a paved terrace in front with the hand pump on the
#     order's raven hatch, the gardener's table with its drawer and potted orange trees; a path to the garden's plaza; the back
#     gate in the west hedge (5,25) - the woods' strip outside it reaches the road; markers for the quests and a guard's round.
#     The two garden trees that stood there (events 96, 98) go (the east side keeps its pair).
#   MapInfos: 118 "Dno studni" and 119 "Archiwum zakonu", children of Map008.
# Every function changes the parsed map in place and says what it did; events are found by name (run again: updated, not
# doubled). Nothing here touches files.
import json, copy
from places import *        # noqa: F401,F403  the constants, ART, SHEET, say_choice, se, transfer, blank_page, B C D E

POPUP_LOCKED = 'Tawerna.popup("Zamknięte.", { color: "info" });'
POPUP_GATE = 'Tawerna.popup("Furtka jest zamknięta.", { color: "info" });'
POPUP_ROPE = 'Tawerna.popup.need($dataItems[%d].iconIndex, "Potrzebujesz 2× Lina, żeby zejść do studni.");' % LINA


def script(js, indent=0):
    return {"code": 355, "indent": indent, "parameters": [js]}


def pic_page(key=None, priority=1, trigger=0, through=False, cmds=None, step=False, sw=None, char=None, idx=0, d=2, p=0):
    """an event page: our sheet's frame `key` (or another picture), on self-switch `sw` when given"""
    if key:
        idx, d, p = ART[key]
        char = SHEET
    img = {"characterName": char or "", "characterIndex": idx, "direction": d, "pattern": p}
    pg = blank_page(priority=priority, trigger=trigger, image=img, through=through, cmds=cmds, step=step, direction_fix=True)
    if sw:
        pg["conditions"]["selfSwitchValid"] = True
        pg["conditions"]["selfSwitchCh"] = sw
    return pg


def marker_event(key, d):
    return {"name": "Miejsce: %s" % key, "note": "", "pages": [blank_page(priority=0, through=True, image={"direction": d})]}


class Events:
    """the map's events, our own found by name (one each) - added at the end (id = index) or updated where they are"""
    def __init__(self, mp, mid):
        self.mp, self.mid, self.done = mp, mid, []

    def find(self, name):
        hits = [e for e in self.mp["events"] if e and e["name"] == name]
        if len(hits) > 1:
            raise SystemExit("Map%03d: %d events named %r - fix by hand" % (self.mid, len(hits), name))
        return hits[0] if hits else None

    def upsert(self, name, x, y, pages, note=""):
        e = self.find(name)
        if e:
            e.update({"x": x, "y": y, "pages": pages, "note": note})
            self.done.append("updated %d %s (%d,%d)" % (e["id"], name, x, y))
        else:
            ev = self.mp["events"]
            e = {"id": len(ev), "name": name, "note": note, "pages": pages, "x": x, "y": y}
            ev.append(e)
            self.done.append("added %d %s (%d,%d)" % (e["id"], name, x, y))
        assert e["id"] < 355, e["id"]
        return e

    def remove(self, eid, name, at):
        ev = self.mp["events"]
        e = ev[eid] if eid < len(ev) else None
        if e is None:
            return
        if e["name"] != name or (e["x"], e["y"]) != at:
            raise SystemExit("Map%03d: event %d is not %r at %s any more - not removing it" % (self.mid, eid, name, at))
        ev[eid] = None
        self.done.append("removed %d %s %s" % (eid, name, at))


# =================================================================================================== Map008
def patch_town(mp):
    E = Events(mp, TOWN)
    # the way down the well: the east stones of the well (a blocked cell; one faces it from (26,34) or (25,33))
    down = [{"code": 111, "indent": 0, "parameters": [12, "$gameParty.numItems($dataItems[%d]) >= 2" % LINA]}]
    down += say_choice("Zejść po linie na dno studni?", "Zejść", "Zostać",
                       [se("Move3", 80, 80), transfer(WELL, WELL_LAND[0], WELL_LAND[1], WELL_LAND[2])], indent=1)
    down += [{"code": 0, "indent": 1, "parameters": []},
             {"code": 411, "indent": 0, "parameters": []},
             script(POPUP_ROPE, 1),
             {"code": 0, "indent": 1, "parameters": []},
             {"code": 412, "indent": 0, "parameters": []}]
    E.upsert("Studnia miejska: zejście", WELL_DOWN_AT[0], WELL_DOWN_AT[1], [pic_page(priority=1, cmds=down)])
    # the slab in the knights' garden: page 1 nothing at all, page 2 (self-switch A) the opened slab - action -> the archive
    stairs = [se("Move1", 80, 90), transfer(ARCHIVE, ARCH_LAND[0], ARCH_LAND[1], ARCH_LAND[2])]
    E.upsert("Płyta w ścieżce (ogród rycerzy)", SLAB_AT[0], SLAB_AT[1],
             [pic_page(priority=0, through=True), pic_page("plyta_otwarta", priority=1, cmds=stairs, sw="A")])
    E.upsert("Miejsce: plyta", SLAB_AT[0], SLAB_AT[1], marker_event("plyta", 2)["pages"])
    return E.done


# =================================================================================================== Map024
ORANGERY = (5, 19, 9, 23)          # x0, y0, x1, y1: roof rows 19-21, the front wall rows 22-23
ROOF, WALL_STONE, COBBLE, HEDGE = 56, 105, 40, 20
DOOR_X = 7
GATE = (5, 25)
TERRACE = [(x, y) for y in (24, 25, 26, 27) for x in (6, 7, 8, 9)] + [(x, 24) for x in range(10, 16)]
PATROL = [("straz_1", 10, 19, 6), ("straz_2", 19, 19, 2), ("straz_3", 19, 28, 4), ("straz_4", 10, 28, 8)]
TREES_OUT = {96: (9, 21), 98: (9, 27)}


def _rect(x0, y0, x1, y1):
    return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]


class Grid:
    """the map's data array addressed by layer and cell"""
    def __init__(self, mp):
        self.mp, self.W, self.H, self.d = mp, mp["width"], mp["height"], mp["data"]

    def i(self, z, x, y):
        return (z * self.H + y) * self.W + x

    def get(self, z, x, y):
        return self.d[self.i(z, x, y)]

    def set(self, z, x, y, v):
        self.d[self.i(z, x, y)] = v

    def kind(self, z, x, y):
        if not (0 <= x < self.W and 0 <= y < self.H):
            return None
        t = self.get(z, x, y)
        return (t - 2048) // 48 if t >= 2048 else None

    def part(self, z, x0, y0, x1, y1, kind):
        """a rectangle of one building autotile with its own edges (a lone block, as tools/manor/build_manor.py)"""
        cells = set(_rect(x0, y0, x1, y1))
        for (x, y) in cells:
            same = lambda dx, dy, x=x, y=y: (x + dx, y + dy) in cells
            self.set(z, x, y, 2048 + kind * 48 + (wall_shape(same) if is_wall_kind(kind) else floor_shape(same)))

    def reshape(self, z, cells):
        """the ground autotiles (A2 floors) on and round the given cells take the shapes their neighbours give them - what
        the editor does when one paints; walls and roofs are left as they are"""
        todo = set()
        for (x, y) in cells:
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if 0 <= x + dx < self.W and 0 <= y + dy < self.H:
                        todo.add((x + dx, y + dy))
        for (x, y) in sorted(todo):
            k = self.kind(z, x, y)
            if k is None or k < 16 or is_wall_kind(k):
                continue
            def same(dx, dy, x=x, y=y, k=k):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < self.W and 0 <= ny < self.H):
                    return True
                return self.kind(z, nx, ny) == k
            self.set(z, x, y, 2048 + k * 48 + floor_shape(same))


def patch_manor(mp):
    g = Grid(mp)
    done = []
    x0, y0, x1, y1 = ORANGERY
    body = _rect(x0, y0, x1, y1)
    # ---- the building: the roof (3 rows) and the stone front (2 rows) on layer 0; nothing of the garden left on 1-3; region 2
    for (x, y) in body:
        for z in (1, 2, 3):
            g.set(z, x, y, 0)
        g.set(5, x, y, 2)
    g.part(0, x0, y0, x1, y0 + 2, ROOF)
    g.part(0, x0, y0 + 3, x1, y1, WALL_STONE)
    # the stove's chimney on the roof (B(2,10..11), as the manor's) - its smoke is an event
    g.set(3, 8, y0, B(2, 10)); g.set(3, 8, y0 + 1, B(2, 11))
    # its shade on the grass east of it (the left half of each cell)
    for y in range(y0, y1 + 1):
        g.set(4, x1 + 1, y, 5)
    done.append("orangery x %d-%d, rows %d-%d (roof A3 k%d, front A4 k%d, region 2)" % (x0, x1, y0, y1, ROOF, WALL_STONE))
    # ---- the terrace before it and the path to the plaza (cobbles), the garden's flower tufts there taken up
    for (x, y) in TERRACE:
        g.set(0, x, y, 2048 + COBBLE * 48)
        g.set(2, x, y, 0)
    # ---- the back gate: a gap in the hedge
    g.set(1, GATE[0], GATE[1], 0)
    g.reshape(0, set(body) | set(TERRACE))
    g.reshape(1, set(body) | {GATE})
    done.append("terrace %d cells, back gate gap at %s" % (len(TERRACE), GATE))

    E = Events(mp, MANOR)
    for eid, at in TREES_OUT.items():
        E.remove(eid, "Drzewo w ogrodzie Lorda", at)
    # the front: windows with orange trees behind the glass, the glazed door (locked: a popup), the chimney's smoke
    for n, x in enumerate((5, 6, 8, 9), 1):
        E.upsert("Oranżeria: okno %d" % n, x, y1, [pic_page("okno_oranzerii" if x < DOOR_X else "okno_oranzerii_l", priority=0, through=True)])
    E.upsert("Drzwi oranżerii", DOOR_X, y1, [pic_page("drzwi_oranzerii", priority=1, cmds=[script(POPUP_LOCKED)])],
             note="<Light:130,90,62,24><LightWhen:night>")      # (the lantern by the door, in its picture)
    E.upsert("Dym z komina (oranżeria)", 8, y0, [pic_page(priority=2, through=True, step=True, char="!Fantasy_chimney", idx=0, d=2, p=0)])
    # the terrace: the pump on the raven hatch beside the gate, the gardener's table (2 wide; its drawer faces south), orange trees
    E.upsert("Pompa na włazie z krukiem", 6, 26, [pic_page("pompa", priority=1)])
    E.upsert("Stół ogrodnika (szuflada)", 8, 26, [pic_page("stol_ogrodnika", priority=1)], note="<Occupy:right=1,up=1>")
    for n, (x, y) in enumerate(((6, 24), (8, 24), (9, 27)), 1):
        E.upsert("Drzewko pomarańczy %d" % n, x, y, [pic_page("drzewko_pomaranczy", priority=1)])
    # the back gate: closed (a popup) / open on self-switch A (walk through, under the hero)
    E.upsert("Tylna furtka", GATE[0], GATE[1], [pic_page("furtka_zamknieta", priority=1, cmds=[script(POPUP_GATE)]),
                                                pic_page("furtka_otwarta", priority=0, through=True, sw="A")])
    # ---- the quest spots
    for (key, x, y, d) in [("oranzeria_wejscie", DOOR_X, y1 + 1, 8), ("pompa_oranzeria", 7, 26, 4), ("szuflada_ogrodnika", 8, 27, 8),
                           ("tylna_furtka", GATE[0], GATE[1], 4), ("woz_furtka", 3, 24, 6)] + PATROL:
        E.upsert("Miejsce: %s" % key, x, y, marker_event(key, d)["pages"])
    return done + E.done


# =================================================================================================== MapInfos
NEW_MAPS = [(WELL, "Dno studni"), (ARCHIVE, "Archiwum zakonu")]


def patch_mapinfos(raw):
    """the editor's file: one entry a line; ours replaced or appended (ids = indexes), the others' lines kept as they are"""
    text = raw.decode("utf-8")
    lines = text.split("\n")
    assert lines[0] == "[" and lines[-1] == "]", "MapInfos.json: unexpected layout"
    rows = [l[:-1] if l.endswith(",") else l for l in lines[1:-1]]
    ours = dict(NEW_MAPS)
    infos = json.loads(text)
    order0 = max(o["order"] for o in infos if o and o["id"] not in ours) + 1
    for k, (mid, name) in enumerate(NEW_MAPS):
        line = json.dumps({"id": mid, "expanded": False, "name": name, "order": order0 + k, "parentId": TOWN, "scrollX": 0, "scrollY": 0},
                          ensure_ascii=False, separators=(",", ":"))
        while len(rows) < mid:
            rows.append("null")
        if len(rows) == mid:
            rows.append(line)
        else:
            rows[mid] = line
    while rows and rows[-1] == "null":
        rows.pop()
    out = "\n".join(["["] + [r + ("," if i < len(rows) - 1 else "") for i, r in enumerate(rows)] + ["]"])
    js = json.loads(out)
    for mid, name in NEW_MAPS:
        assert js[mid]["id"] == mid and js[mid]["parentId"] == TOWN
    return out.encode("utf-8")
