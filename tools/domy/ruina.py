# python tools/domy/ruina.py  -> tools/domy/staging/Map168.json (+ Map168_meta.json); docs/strata_pola/ruina_mapa.png (1280 x 720),
#                               ruina_cala.png (the whole map, the house at stage 0 / 5: ruina_cala.png, zagroda_po.png)
# "Spalona zagroda" (Map168): the burnt farm of the Ług family west of Skraj lasu - the quest D21 (TownQuests) buys it, Homes.js
# rebuilds the house in stages (the user 2026-10-15: lots of land to build on, ~700-800 cells, overgrown, some of it to be cleared
# of bushes and stumps as on grandpa's field). Tileset 11 (the town's: the author's flags close walls and fences by themselves).
#   - the way in: the east edge (49, 11..13) <- Map023 Skraj lasu's west edge (0, 6..8): transfer events put in by Homes.js at
#     runtime and a signpost (Map023's tiles untouched); back: the transfer events here -> Map023 (1, 6..8) facing right
#   - the house: NOT tiles - one picture event "!$Zagroda_Dom" (tools/domy/art/compose_etapy.py), its frame = the stage
#     (Homes.js), standing on (20, 9): 5 x 3 cells (x 18..22, rows 7..9) closed by <Occupy:left=2,right=2,up=2>
#   - the barn's remains, the dry well (to dig out: dry), a broken fence, Jan Ług's cross at the forest's edge (Marta comes there)
#   - region 8 (<BuildRegion:8>): the yard and the field below it - the land to build on, dig and sow once bought (Farming); the
#     field overgrown (weeds and dry patches: layer 1, nothing that stands) with bushes, tall stumps, dead trunks and stones to clear
#     (Map003's own events: they chop / dig / mine as there); two wild apple trees of the old orchard
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/podgrodzie")
sys.path.insert(0, ROOT + "tools/town")
import plib                                                                                     # noqa: E402
from plib import Pod, GRASS, GRASS_LIGHT, DIRT, TUFTS, SOFT, DRY, PEBBLES, MUD, HEDGE, FENCE, event, pic, popup_cmds   # noqa: E402
from nslib import NewMap, B, C, D, E, write_map, noise, lowfreq                               # noqa: E402
import mzrender                                                                                 # noqa: E402
from PIL import Image, ImageDraw, ImageFont                                                     # noqa: E402

STAGING = os.path.join(HERE, "staging")
DOCS = ROOT + "docs/strata_pola/"
MAP_ID = 168
W, H = 50, 36
BUILD_REGION = 8
HOUSE = dict(ev=(20, 9), cells=(18, 7, 22, 9))      # the picture's event (bottom centre) and the cells it closes
ENTRY_ROWS = (11, 12, 13)                            # the east edge (the yard's rows) <-> Map023 (1, 6..8)
EDGE_MAP, EDGE_ROW0 = 23, 6
NOTE = "<Clouds:on>\n<Farm:off>\n<BuildRegion:%d>" % BUILD_REGION
FONT = "C:/Windows/Fonts/arial.ttf"
SHEET = ROOT + "img/characters/!$Zagroda_Dom.png"


class Small(Pod):
    """Pod (the author's pieces on tileset 11) of any size"""
    def __init__(self, map_id, w, h, display, note, seed=168):
        NewMap.__init__(self, map_id, w, h, 11, display, note, seed=seed, bgm="Field1", autoplay=False)
        self.buildings, self.spots, self.lights, self.doors, self.exits, self.notes = [], {}, [], [], [], []

    def staged(self):
        data = self.resolve()
        events = [None]
        for i, (x, y, e) in enumerate(self.events, 1):
            events.append({"id": i, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": x, "y": y})
        return {**{k: v for k, v in self.props.items()}, "data": data, "events": events}


def look(text):
    return popup_cmds(text, "info")


def build_map():
    mp = Small(MAP_ID, W, H, "Spalona zagroda", NOTE)
    mp.kind(0, mp.all, GRASS)
    for c in mp.all:
        if lowfreq(c[0], c[1], 41, 4.0) > 0.68: mp.layers[0][c] = ("k", GRASS_LIGHT)
    # the forest round it (the hedge band), open on the east at the way in
    forest = set()
    for (x, y) in mp.all:
        t = 1.4 + 1.2 * lowfreq(x, y, 61, 3.0)
        if x < t or y < t + 0.6 or y > H - 2.4 - t or (x > W - 1.4 - t and not (ENTRY_ROWS[0] - 1 <= y <= ENTRY_ROWS[-1] + 1)):
            forest.add((x, y))
    mp.kind(1, forest, HEDGE)
    for c in mp.all - forest:                                   # (the old yard's grass gone wild)
        if noise(c[0], c[1], 17) < 0.07: mp.layers[1][c] = ("k", TUFTS)
    hx0, hy0, hx1, hy1 = HOUSE["cells"]
    ex, ey = HOUSE["ev"]
    # the lane from the east edge to the yard (trodden earth)
    lane = {(x, y) for x in range(hx1 + 12, W) for y in ENTRY_ROWS}
    for c in lane: mp.layers[1].pop(c, None)
    mp.kind(0, lane, DIRT)
    # the yard before the house (trodden earth, pebbles), the house's ground (bare: the picture stands on it)
    yard = mp.rect(hx0 - 6, hy1 + 1, hx1 + 12, hy1 + 4)
    mp.kind(0, yard, DIRT)
    for c in yard:
        if noise(c[0], c[1], 9) < 0.15: mp.layers[1][c] = ("k", PEBBLES)
    hcells = mp.rect(hx0, hy0, hx1, hy1)
    mp.kind(0, mp.rect(hx0, hy1 - 1, hx1, hy1), DIRT)
    # the barn's remains (right of the house): posts, fallen planks, a rotten haystack, a cart wheel
    bx, by = hx1 + 4, hy1 - 2
    barn = mp.rect(bx, by - 1, bx + 5, by + 2)
    mp.kind(0, barn, DIRT)
    mp.tl(bx, by, B(8, 11), 2); mp.tl(bx, by + 1, B(8, 12), 2)
    mp.tl(bx + 4, by, B(8, 11), 2); mp.tl(bx + 4, by + 1, B(8, 12), 2)
    mp.tl(bx + 1, by + 2, D(14, 5), 2); mp.tl(bx + 2, by + 2, D(15, 5), 2)
    mp.tl(bx + 2, by + 1, D(12, 6), 2)
    mp.thing("hay_low", bx + 1, by)
    mp.thing("wheel", bx + 5, by + 2)
    mp.ev(bx + 3, by + 2, event("Resztki stodoły", bx + 3, by + 2, None, priority=1, cmds=look("Resztki stodoły Ługów: dwa słupy, zgniłe siano, deski czarne od dymu. Ogień nie oszczędził niczego.")))
    # the dry well at the yard's left (filled with rubble: dug out it is dry - Homes.js), a broken fence along the yard's south edge
    well = mp.town_prop("well_dry", hx0 - 5, hy1 + 1, label="Stara studnia (zasypana)", cmds=[{"code": 355, "indent": 0, "parameters": ["Tawerna.call(\"Homes\", \"well\", this)"]}])
    fy = hy1 + 5
    fence = {(x, fy) for x in range(hx0 - 8, hx1 + 16) if x not in (hx0 - 4, hx0 + 1, hx0 + 2, hx1 + 4, hx1 + 9, hx1 + 10, 33, 34, 35)}
    mp.kind(1, fence, FENCE)
    # Jan Ług's cross at the edge of the forest, north-east of the yard (Marta's place: Homes.js shows her there)
    cx, cy = hx1 + 12, hy0 - 2
    for c in mp.rect(cx - 2, cy - 1, cx + 1, cy + 1): mp.layers[1].pop(c, None)
    mp.town_prop("grave_cross_fl", cx, cy, label="Krzyż: Jan Ług", cmds=[{"code": 355, "indent": 0, "parameters": ["Tawerna.call(\"Homes\", \"cross\", this)"]}])
    # the field below the fence: earth under weeds and dry patches, overgrown for years; a few clear grass stretches
    field = mp.rect(4, fy + 1, W - 5, H - 6)
    mp.kind(0, field, DIRT)
    for c in field:
        v = noise(c[0], c[1], 211)
        mp.layers[1][c] = ("k", TUFTS if v < 0.45 else SOFT if v < 0.62 else DRY if v > 0.88 else TUFTS)
        if lowfreq(c[0], c[1], 99, 2.5) > 0.72: mp.layers[1].pop(c, None)
    field -= forest
    # region 8: the land - the field, the yard round the house (not the house, the barn, the well, the lane's mouth, the cross)
    land = (field | yard | mp.rect(hx0 - 7, hy0 - 1, hx0 - 2, hy1)) - hcells - barn - mp.rect(hx0 - 6, hy1 - 1, hx0 - 4, hy1 + 1) - forest
    land -= {(x, fy) for x in range(W)}
    for c in land: mp.region[c] = BUILD_REGION
    # to clear (Map003's events: bushes chopped, stumps dug, trunks cut, stones mined) - on the field, never on the lane
    rnd = mp.rnd
    put_at = []
    cand = sorted(c for c in field if c not in lane and c[1] > fy + 1)
    rnd.shuffle(cand)
    kinds = (["!$Bush_Bare_A"] * 7 + ["!$Bush_Bare_B"] * 5 + ["!$Bush_Bare_Tall"] * 3 + ["!$Bush_Bare_Wide"] * 3 + ["!$Stump_Tall"] * 6 +
             ["!$Trunk_Dead"] * 3 + ["!$Rock_Flat", "!$Rock_Mound", "!$Rock_Pile", "!$Rock_Mossy", "!$Rock_Cracked"])
    for k in kinds:
        for (x, y) in cand:
            if any(abs(x - a) + abs(y - b) < 3 for (a, b) in put_at): continue
            if mp.put(x, y, k):
                put_at.append((x, y)); cand.remove((x, y)); break
    # the old orchard: two wild apple trees by the forest's edge (Map003's: pick, then chop)
    for (x, y) in [(6, fy - 2), (W - 7, fy + 2)]:
        mp.layers[1].pop((x, y), None)
        mp.put(x, y, "!$Tree_Apple", force=True)
    # trees in the forest (decorative), their crowns off the land
    for (x, y, k) in [(2, 3, "pine"), (7, 1, "leafy"), (12, 2, "pine_b"), (30, 1, "leafy"), (36, 2, "pine"), (43, 3, "pine_b"),
                      (48, 7, "leafy"), (1, 12, "pine_b"), (0, 19, "pine"), (1, 27, "leafy"), (48, 24, "pine"), (47, 31, "leafy"),
                      (7, H - 1, "pine"), (15, H - 1, "pine_b"), (23, H - 1, "leafy"), (31, H - 1, "pine"), (39, H - 1, "pine_b")]:
        mp.tree(x, y, k)
    # the house: one picture event, its frame the stage (Homes.js); it closes its 5 x 3 cells
    pg = plib.blank_page(priority=1, trigger=0, image={"characterName": "!$Zagroda_Dom", "characterIndex": 0, "direction": 2, "pattern": 0},
                         cmds=[{"code": 355, "indent": 0, "parameters": ["Tawerna.call(\"Homes\", \"ruin\", this)"]}], direction_fix=True)
    mp.ev(ex, ey, {"name": "Dom Ługów", "note": "<Zagroda:dom><Occupy:left=2,right=2,up=2>", "pages": [pg]}, mp.rect(hx0, hy0, hx1, hy1))
    # the way back east
    for i, r in enumerate(ENTRY_ROWS):
        mp.transfer(W - 1, r, EDGE_MAP, 1, EDGE_ROW0 + i, 6, "Przejście -> Skraj lasu")
    meta = {"id": MAP_ID, "size": [W, H], "house_event": [ex, ey], "house_cells": list(HOUSE["cells"]), "entry_rows": list(ENTRY_ROWS),
            "cross": [cx, cy], "marta": [cx - 1, cy], "well": [hx0 - 5, hy1 + 1], "land_cells": len(land), "to_clear": len(put_at)}
    return mp, meta


def main():
    os.makedirs(STAGING, exist_ok=True)
    os.makedirs(DOCS, exist_ok=True)
    mp, meta = build_map()
    m = mp.staged()
    path = os.path.join(STAGING, "Map%03d.json" % MAP_ID)
    write_map(path, m, m["data"], m["events"])
    open(os.path.join(STAGING, "Map%03d_meta.json" % MAP_ID), "wb").write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    # renders: the house's frame 0 (the ruin) and 5 (rebuilt) pasted where its event stands
    sh = mzrender.Sheets(11)
    sh.lenient = True
    base = mzrender.render(m, sh, hide=lambda e: e.get("note", "").startswith("<Zagroda:dom>")).convert("RGBA")
    out = {}
    if os.path.exists(SHEET):
        sheet = Image.open(SHEET).convert("RGBA")
        fw, fh = sheet.width // 3, sheet.height // 4
        ex, ey = meta["house_event"]
        for st, name in ((0, "ruina_cala.png"), (5, "zagroda_po.png")):
            img = base.copy()
            fr = sheet.crop(((st % 3) * fw, (st // 3) * fh, (st % 3 + 1) * fw, (st // 3 + 1) * fh))
            img.alpha_composite(fr, (ex * 48 + 24 - fw // 2, (ey + 1) * 48 - fh))
            img.convert("RGB").save(DOCS + name)
            out[st] = img
    img = out.get(0, base)
    F2 = ImageFont.truetype(FONT, 17)
    x0, y0 = 8 * 48, 3 * 48
    crop = img.crop((x0, y0, x0 + 1280, y0 + 720)).convert("RGB")
    d = ImageDraw.Draw(crop)
    def tag(cx, cy, text):
        px, py = cx * 48 - x0, cy * 48 - y0
        w = int(d.textlength(text, font=F2)) + 14
        d.rectangle((px, py, px + w, py + 26), fill=(16, 16, 20)); d.text((px + 7, py + 4), text, fill=(255, 210, 63), font=F2)
    tag(17, 4, "zgliszcza domu Ługów")
    tag(25, 9, "resztki stodoły")
    tag(10, 11, "stara studnia")
    tag(31, 6, "krzyż: Jan Ług")
    tag(10, 16, "zarośnięte pole: krzaki, pnie, kamienie do usunięcia (region 8)")
    crop.save(DOCS + "ruina_mapa.png")
    print("Map168: %dx%d, ziemia: %d pól, do oczyszczenia: %d" % (W, H, meta["land_cells"], meta["to_clear"]))


if __name__ == "__main__":
    main()
