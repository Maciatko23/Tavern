# python tools/domy/podgrodzie_zagroda.py [--check] [--render]
#   -> tools/domy/staging/Map111.json (+ Map111_zagroda_meta.json); renders docs/strata_pola/podgrodzie_przed.png / _po.png / _zagroda.png
# The house for sale in Podgrodzie WITH ITS LAND ON THE MAP (the user 2026-10-15: "gdzie tam miejsce na pole z tyłu" - the land must
# be seen, by the house, fenced; "jak trzeba, to powiększ mapę"). Map111 grows by ROWS rows at the BOTTOM (the south forest), so the
# x / y of everything already there stays the same (doors, spots "Miejsce: ...", the west gate, the way to the harbour at 0,19,
# TownLife / TownQuests / Przystan / tests: nothing moves). Below the south forest band a clearing: a log hut with a thatched roof
# ("Chata pod lasem", its door -> the poor room Map154) and beside it a fenced plot (inner 20 x 12) - region 8, the map's note
# <BuildRegion:8>: only there may the owner build and farm (Farming), the rest of Podgrodzie stays as it is (<Farm:off>).
# A trodden path from the south lane through the forest band (between two tree trunks) down to the clearing.
# Everything else of Map111 is kept exactly: its tiles are read back as the generator's kinds (tools/podgrodzie wrote them so - the
# map equals its staging), --check proves the read-back gives the same data before anything is added. No data/ is written.
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/podgrodzie")
import plib                                                                                  # noqa: E402
from plib import Pod, GRASS, GRASS_LIGHT, DIRT, TUFTS, SOFT, DRY, HEDGE, FENCE, event, pic  # noqa: E402
from nslib import NewMap, B, C, D, write_map, noise, lowfreq                                # noqa: E402

STAGING = os.path.join(HERE, "staging")
DOCS = ROOT + "docs/strata_pola/"
SRC = ROOT + "data/Map111.json"
ROWS = 20                        # rows added at the bottom (the user 2026-10-15: the plot about 3x bigger - 20 x 12)
BUILD_REGION = 8                 # the plot (Farming: <BuildRegion:8> in the map's note)
HUT = dict(x=3, y=36, w=6, roof=3, wall=2, door=3)                  # "Chata pod lasem": roof rows 36-38, walls 39-40, door (6,40)
PLOT = (14, 37, 35, 50)          # the fence ring; inner 15..34 x 38..49 (20 x 12 = 240)
GATE = (14, 43)                  # the gap in the fence, on the side of the path
PATH_X = (11, 12)                # through the forest band (tree trunks at 10,35 and 13,34)


class PodX(Pod):
    """Pod (tools/podgrodzie) of any size, its tiles read from a map file"""
    def __init__(self, src, rows):
        m = json.loads(open(src, "rb").read().decode("utf-8"))
        W, H = m["width"], m["height"]
        NewMap.__init__(self, 111, W, H + rows, 11, m.get("displayName", "Podgrodzie"), m["note"], seed=111, bgm="Town1", autoplay=False)
        self.props = {k: copy.deepcopy(v) for k, v in m.items() if k not in ("data", "events")}
        self.props["height"] = H + rows
        self.buildings, self.spots, self.lights, self.doors, self.exits, self.notes = [], {}, [], [], [], []
        self.src, self.H0, self.events0 = m, H, m["events"]
        at = lambda z, x, y: m["data"][(z * H + y) * W + x]
        for z in range(4):
            for y in range(H):
                for x in range(W):
                    v = at(z, x, y)
                    if v: self.layers[z][(x, y)] = ("k", (v - 2048) // 48) if v >= 2048 else ("t", v)
        for y in range(H):
            for x in range(W):
                if at(4, x, y): self.shadow[(x, y)] = at(4, x, y)
                if at(5, x, y): self.region[(x, y)] = at(5, x, y)
        self.added = set()            # cells changed / added (the docs mark them)

    def put(self, z, cells, k):
        for c in cells:
            if self.inside(*c): self.layers[z][c] = ("k", k); self.added.add(c)

    def clear_layers(self, cells, zs=(1, 2, 3)):
        for c in cells:
            for z in zs: self.layers[z].pop(c, None)
            self.added.add(c)


def check():
    """the read-back reproduces Map111's data exactly (before anything is added)"""
    mp = PodX(SRC, 0)
    data = mp.resolve()
    src = mp.src["data"]
    bad = [i for i, (a, b) in enumerate(zip(data, src)) if a != b]
    print("odczyt Map111: %d różnic na %d pól" % (len(bad), len(src)))
    return not bad


def build():
    mp = PodX(SRC, ROWS)
    W, H0, H = mp.W, mp.H0, mp.H
    new = mp.rect(0, H0, W - 1, H - 1)
    # ---- the new rows: grass under a forest (the south band's hedge goes on down), lighter patches
    mp.put(0, new, GRASS)
    for c in new:
        if lowfreq(c[0], c[1], 31, 4.0) > 0.70: mp.layers[0][c] = ("k", GRASS_LIGHT)
    mp.put(1, new, HEDGE)
    # the clearing below the band (x 2..37, rows H0..H0+15): open ground, tufts at its rim
    clearing = mp.rect(2, H0, 37, H0 + 15)
    mp.clear_layers(clearing, zs=(1,))
    for c in sorted(clearing):
        x, y = c
        rim = x in (2, 3, 36, 37) or y == H0 + 15
        if rim and noise(x, y, 121) < 0.55: mp.layers[1][c] = ("k", TUFTS if noise(x, y, 7) < 0.6 else SOFT)
    # ---- the path: from the south lane (row 28, trodden earth) through the band, down into the clearing, to the hut and the gate
    path = mp.rect(PATH_X[0], 29, PATH_X[1], GATE[1]) | mp.rect(6, H0 + 5, PATH_X[1], H0 + 6) | mp.rect(PATH_X[1], GATE[1], GATE[0] - 1, GATE[1])
    for c in path:
        for z in (1, 2, 3): mp.layers[z].pop(c, None)
    mp.put(0, path, DIRT)
    # ---- the hut "Chata pod lasem": logs under a thatch, a window each side of the door, a chimney with smoke, a lean-to of firewood
    h = HUT
    rec = mp.house("zagroda", "Chata pod lasem", h["x"], h["y"], h["w"], h["roof"], h["wall"], "thatch", "logs", door=h["door"],
                   door_pic=("!Fantasy_door1", 2), windows=[(1, "wood"), (5, "wood")], chimney=1, chimney_style=3, lean="right",
                   lean_fill="logs", closed_text="Na sprzedaż.")
    mp.added |= mp.rect(h["x"] - 1, h["y"] - 1, h["x"] + h["w"], h["y"] + h["roof"] + h["wall"])
    # ---- the plot: a wooden fence (the gap on the path's side), inside bare earth to dig and build on, region 8
    x0, y0, x1, y1 = PLOT
    inner = mp.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1)
    ring = mp.rect(x0, y0, x1, y1) - inner - {GATE}
    mp.clear_layers(mp.rect(x0, y0, x1, y1))
    mp.put(1, ring, FENCE)
    mp.put(0, inner, DIRT)
    for c in inner:   # (a garden left alone: weeds and dry patches over the earth - layer 1, nothing that stands)
        v = noise(c[0], c[1], 211)
        if v < 0.28: mp.layers[1][c] = ("k", TUFTS)
        elif v > 0.86: mp.layers[1][c] = ("k", DRY)
        mp.region[c] = BUILD_REGION
    mp.put(0, {GATE}, DIRT)
    # ---- a few things of a poor homestead, on the hut's side of the path (nothing inside the plot)
    mp.thing("chopping_block", 9, H0 + 8)
    mp.thing("log_bench", 2, H0 + 6)
    mp.thing("barrel", 10, H0 + 3)
    mp.thing("sticks", 8, H0 + 8)
    # ---- trees: the forest closing round the clearing (decorative: their trunks in the hedge, never on the path)
    # (their crowns are 4 x 6 cells: none over the plot or the path - the flanks, the bottom band, the forest east of the plot)
    for (x, y, k) in [(1, H0 + 3, "pine"), (0, H0 + 9, "pine_b"), (1, H0 + 15, "leafy"), (4, H - 1, "leafy"), (9, H - 1, "pine"),
                      (16, H - 1, "pine_b"), (22, H - 1, "leafy"), (28, H - 1, "pine"), (34, H - 1, "pine_b"), (39, H0 + 3, "pine"),
                      (42, H0 + 7, "leafy"), (45, H0 + 11, "pine"), (39, H0 + 13, "pine_b"), (43, H0 + 16, "leafy"), (40, H - 1, "pine"),
                      (45, H - 1, "leafy")]:
        mp.tree(x, y, k)
        mp.added.add((x, y))
    # the region of the new roofs / walls (level with the hero), as tools/town/paint_layers.py paints them - only on new cells
    import paint_layers as PL
    data = mp.resolve()
    events = [None] + [None] * 0
    flags = json.loads(open(ROOT + "data/Tilesets.json", "rb").read().decode("utf-8"))[11]["flags"]
    paint, keep, why = PL.plan({"width": W, "height": H, "data": data, "events": [], "_id": 111}, flags)
    keep |= {tuple(b["front"]) for b in mp.buildings}
    for c in paint:
        if c in mp.added and c not in keep and c not in mp.region: mp.region[c] = 2
    return mp, rec


def write(mp, rec):
    data = mp.resolve()
    W, H, H0 = mp.W, mp.H, mp.H0
    events = [copy.deepcopy(e) for e in mp.events0]
    nid = len(events)
    added = []
    for (x, y, e) in mp.events:
        ev = {"id": nid, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": x, "y": y}
        events.append(ev)
        added.append((nid, e["name"], x, y))
        if e is rec["event"]: rec["event_id"] = nid
        nid += 1
    props = dict(mp.props)
    props["note"] = (props.get("note") or "").rstrip() + "\n<BuildRegion:%d>" % BUILD_REGION
    os.makedirs(STAGING, exist_ok=True)
    path = os.path.join(STAGING, "Map111.json")
    write_map(path, props, data, events)
    # every old cell is as it was (rows 0..H0-1, except the cells this script changed)
    src = mp.src["data"]
    W0 = W
    moved = [(x, y) for z in range(4) for y in range(H0) for x in range(W)
             if data[(z * H + y) * W + x] != src[(z * H0 + y) * W0 + x] and (x, y) not in mp.added]
    meta = {"rows_added": ROWS, "size": [W, H], "build_region": BUILD_REGION, "hut": {"door": rec["door"], "front": rec["front"], "event_id": rec.get("event_id")},
            "plot": {"ring": list(PLOT), "gate": list(GATE)}, "events_added": added, "old_cells_changed_beside_plan": len(moved)}
    open(os.path.join(STAGING, "Map111_zagroda_meta.json"), "wb").write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    print("Map111 %dx%d -> %dx%d, zdarzeń dodanych: %d, drzwi chaty %s, inne zmienione stare pola: %d" % (W, H0, W, H, len(added), rec["door"], len(moved)))
    return path


def render():
    sys.path.insert(0, ROOT + "tools/town")
    import mzrender
    from PIL import Image, ImageDraw
    os.makedirs(DOCS, exist_ok=True)
    before = mzrender.render(mzrender.load_json(SRC))
    after_map = mzrender.load_json(os.path.join(STAGING, "Map111.json"))
    after = mzrender.render(after_map)
    # the whole maps side by side, scaled down, the new part outlined
    s = 0.25
    b2 = before.resize((int(before.width * s), int(before.height * s)))
    a2 = after.resize((int(after.width * s), int(after.height * s)))
    canvas = Image.new("RGB", (b2.width + a2.width + 60, a2.height + 70), (24, 24, 28))
    canvas.paste(b2, (20, 50)); canvas.paste(a2, (b2.width + 40, 50))
    from PIL import ImageFont
    F = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
    d = ImageDraw.Draw(canvas)
    d.text((20, 15), "PRZED: Podgrodzie 46 x 36", fill=(255, 230, 120), font=F)
    d.text((b2.width + 40, 15), "PO: 46 x %d (+%d rzędów na dole, nic nie przesunięte)" % (after_map["height"], ROWS), fill=(255, 230, 120), font=F)
    H0 = after_map["height"] - ROWS
    oy = 50 + int(H0 * 48 * s)
    d.rectangle((b2.width + 40, oy, b2.width + 40 + a2.width - 1, 50 + a2.height - 1), outline=(255, 210, 63), width=3)
    canvas.save(DOCS + "podgrodzie_przed_po.png")
    # the new homestead at full size (1280 x 720 around it), with labels
    x0, y0 = 0 * 48, (H0 - 6) * 48
    crop = after.crop((x0, y0, x0 + 1280, y0 + 720)).convert("RGB")
    d = ImageDraw.Draw(crop)
    from PIL import ImageFont
    F = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 17)
    def tag(cx, cy, text):
        px, py = cx * 48 - x0, cy * 48 - y0
        w = int(d.textlength(text, font=F)) + 14
        d.rectangle((px, py, px + w, py + 26), fill=(16, 16, 20)); d.text((px + 7, py + 4), text, fill=(255, 210, 63), font=F)
    tag(HUT["x"], HUT["y"] + 5, "Chata pod lasem (600 G) - drzwi do izby")
    tag(PLOT[0] + 1, PLOT[1] + 1, "działka 20 x 12 pól (region 8) - tylko tu wolno budować")
    tag(PATH_X[0] - 3, 30, "ścieżka od południowej drogi")
    crop.save(DOCS + "podgrodzie_zagroda.png")
    print("render:", DOCS + "podgrodzie_przed_po.png", DOCS + "podgrodzie_zagroda.png")


if __name__ == "__main__":
    _m = json.loads(open(SRC, "rb").read().decode("utf-8"))
    if _m["height"] != 36 or "<BuildRegion:" in (_m.get("note") or ""):   # (installed already: the rows would be added twice)
        print("STOP: data/Map111.json jest już powiększona (%dx%d, %r) - generator działa tylko na mapie 46x36 sprzed instalacji." % (_m["width"], _m["height"], _m.get("note")))
        sys.exit(2)
    if "--check" in sys.argv:
        sys.exit(0 if check() else 1)
    ok = check()
    mp, rec = build()
    write(mp, rec)
    if "--render" in sys.argv: render()
