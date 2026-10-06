# python tools/creatures/build_creatures.py [key ...]
# Builds the game sheets of the creatures of the ruins (combat stage 4, js/plugins/Creatures.js) from the PixelLab frames that
# fetch_zip.py unpacked into tools/creatures/frames/<key>/<animation>/<direction>/<i>.png and the rotations of fetch_rot.py
# (tools/creatures/rot/<key>/). sheets.json says which animation makes which sheet. Writes
#   img/characters/anim8/Cr_<Look>_<Sheet>.png  8 rows (S, SW, W, NW, N, NE, E, SE) x columns of square cells (Hunting.js LOOK8 layout);
#                                               a "standing" sheet has the rotation in column 0, then the cycle
#   img/characters/$Cr_<Look>[_<Old>].png       the old 4-way sheet (3 x 4 cells: down, left, right, up) - drawn only with the 8-way
#                                               looks off (tests); a missing file would halt the game
#   tools/creatures/preview/<key>_<Sheet>.png   the sheet x2 on mid-grey
# Also the shadows' 4-way copies of the residents' sheets ($Cr_Face_<Name>.png from $Npc_<Name>.png).
# The west side (W, SW, NW) is the mirror of the east side (E, SE, NE). "rot_map" fixes a character whose rotations came out turned
# (the wraith: its "south" is its back) - the folder of the direction it really shows is used. Feet: the standing figure's lowest pixel
# on the row `cell - 3`; a frame on a bigger canvas (v3) is placed by the offset that puts its frame 0 (the reference rotation) where the
# rotation stands - the same offset for the whole row. "fill": a direction without frames takes another's (a pile is a pile).
# "nowhite": near-white pixels out (puffs of smoke v3 drew). "unpuddle": rows - the water under a drowned one's feet taken out of its lowest rows (not in a sheet with "keep_water": its sinking).
import os, sys, json, shutil
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", ".."))
CHARS = os.path.join(GAME, "img", "characters")
DIRS = ["south", "south-west", "west", "north-west", "north", "north-east", "east", "south-east"]
MIRROR = {"west": "east", "south-west": "south-east", "north-west": "north-east"}
OLD_ROWS = ["south", "west", "east", "north"]
FACES = ["Borgar", "Kowal", "Piekarka", "Dziadek", "Melia", "Soltys", "Wanda"]


def bbox(im):
    return im.getchannel("A").getbbox()


def clean(im, keep=10):
    """Alpha to 0/255, and stray specks (clusters of up to `keep` px apart from the figure: the debris v3 draws at a blow) taken out."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and a < 128:
                px[x, y] = (0, 0, 0, 0)
            elif a and a < 255:
                px[x, y] = (r, g, b, 255)
    seen, comps = set(), []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 or (x, y) in seen:
                continue
            stack, comp = [(x, y)], []
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3] > 0:
                            seen.add((nx, ny))
                            stack.append((nx, ny))
            comps.append(comp)
    if len(comps) > 1 and keep:
        big = max(len(c) for c in comps)
        for c in comps:
            if len(c) <= keep and len(c) < big:
                for (x, y) in c:
                    px[x, y] = (0, 0, 0, 0)
    return im


def unpuddle(im, rows):
    """The water a drowned one stands in (PixelLab paints a puddle under the boss of floor 50 in some frames): its grey-blue pixels and
    the light drops in the lowest `rows` rows of the figure taken out - the feet stay on the line, nothing flickers under them."""
    im = im.copy()
    px = im.load()
    bb = bbox(im)
    if not bb:
        return im
    for y in range(max(0, bb[3] - rows), bb[3]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if a and ((b > r + 35 and b > 150) or (max(r, g, b) <= 112 and r + g + b > 150 and b >= r - 6 and abs(g - b) <= 14)):
                px[x, y] = (0, 0, 0, 0)
    return clean(im, 12)


def nowhite(im):
    im = im.copy()
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if a and min(r, g, b) >= 232:
                px[x, y] = (0, 0, 0, 0)
    return clean(im, 12)


def steel(im):
    """The glowing cyan v3 sometimes paints on a swung blade, back to grey steel (same lightness)."""
    im = im.copy()
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if a and g - r > 10 and b - r > 10:   # (cool: the armour's own colours are warm - red over green over blue)
                v = (r + g + b) // 3
                px[x, y] = (min(255, int(v * 1.0)), int(v * 0.95), int(v * 0.88), a)
    return im


def src_dir(cfg, d):
    """The folder a direction's pictures come from: the east side for the west, then the character's own fix (rot_map)."""
    s = MIRROR.get(d, d)
    return (cfg.get("rot_map") or {}).get(s, s)


def rot(key, cfg, d):
    im = clean(Image.open(os.path.join(HERE, "rot", key, src_dir(cfg, d) + ".png")), cfg.get("keep", 10))
    if cfg.get("unpuddle"):
        im = unpuddle(im, cfg["unpuddle"])
    return im.transpose(Image.FLIP_LEFT_RIGHT) if MIRROR.get(d) else im


def frames_of(key, cfg, anim, d, spec):
    s = src_dir(cfg, d)
    if spec.get("fill_force") or not os.path.isdir(os.path.join(HERE, "frames", key, anim, s)):   # (fill_force: even over a made one that failed)
        s = (spec.get("fill") or {}).get(MIRROR.get(d, d), s)
    own = (spec.get("from") or {}).get(MIRROR.get(d, d))   # a direction taken from another animation (a re-roll in its own group)
    folder = os.path.join(HERE, "frames", key, own or anim, s)
    if not anim or not os.path.isdir(folder):
        return None, s
    files = sorted([f for f in os.listdir(folder) if f.endswith(".png")], key=lambda f: int(os.path.splitext(f)[0]))
    out = [clean(Image.open(os.path.join(folder, f)), cfg.get("keep", 10)) for f in files]
    if spec.get("nowhite"):   # (the white puffs v3 painted round the hood and the hem: the art has no near-white of its own)
        out = [nowhite(im) for im in out]
    if cfg.get("unpuddle") and not spec.get("keep_water"):
        out = [unpuddle(im, cfg["unpuddle"]) for im in out]
    if spec.get("steel"):
        out = [steel(im) for im in out]
    if MIRROR.get(d):
        out = [im.transpose(Image.FLIP_LEFT_RIGHT) for im in out]
    return out, s


def place(im, cell, ox, oy):
    c = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    c.alpha_composite(im, (max(ox, 0), max(oy, 0)), (max(-ox, 0), max(-oy, 0)))
    return c


def build_sheet(key, cfg, name, spec):
    cell = spec.get("cell", cfg.get("cell", 64))
    lift = spec.get("lift", cfg.get("lift", 3))
    rows = []
    for d in DIRS:
        r = rot(key, cfg, d)
        br = bbox(r)
        rx = (cell - r.size[0]) // 2   # the rotation's canvas centred in the cell
        feet = cell - lift
        ry = feet - (br[3] - 1)
        stand = place(r, cell, rx, ry)
        fr, used = frames_of(key, cfg, spec.get("anim"), d, spec)
        cells = [stand] if spec.get("standing", False) else []
        if fr:
            b0 = bbox(fr[0])
            ox, oy = rx + br[0] - b0[0], feet - (b0[3] - 1)
            if spec.get("align") == "center":
                low = max(bbox(f)[3] - 1 for f in fr if bbox(f))
                ox, oy = (cell - fr[0].size[0]) // 2, feet - low
            pick = spec.get("pick") or list(range(len(fr)))
            if isinstance(pick, dict):
                pick = pick.get(MIRROR.get(d, d), pick.get("*", list(range(len(fr)))))
            for i in pick:
                cells.append(place(fr[min(i, len(fr) - 1)], cell, ox, oy))
        else:
            cells += [stand] * spec.get("placeholder", 8)
        rows.append(cells)
    n = max(len(r) for r in rows)
    sheet = Image.new("RGBA", (cell * n, cell * 8), (0, 0, 0, 0))
    for y, cells in enumerate(rows):
        for x in range(n):
            sheet.alpha_composite(cells[min(x, len(cells) - 1)], (x * cell, y * cell))
    os.makedirs(os.path.join(CHARS, "anim8"), exist_ok=True)
    sheet.save(os.path.join(CHARS, "anim8", "Cr_" + cfg["look"] + "_" + name + ".png"))
    prev = Image.new("RGBA", sheet.size, (110, 110, 110, 255))
    prev.alpha_composite(sheet)
    os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
    prev.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(os.path.join(HERE, "preview", key + "_" + name + ".png"))
    old = spec.get("old")
    if old:
        cols = spec.get("old_cols", [0, 0, 0])
        im = Image.new("RGBA", (cell * 3, cell * 4), (0, 0, 0, 0))
        for r_i, d in enumerate(OLD_ROWS):
            row = rows[DIRS.index(d)]
            for c_i, c in enumerate(cols):
                im.alpha_composite(row[min(c, len(row) - 1)], (c_i * cell, r_i * cell))
        im.save(os.path.join(CHARS, old + ".png"))
    print(key, name, n, "x 8 cells of", cell, "" if any(len(r) > 1 for r in rows) else "(placeholder)")


def faces():
    for f in FACES:
        src = os.path.join(CHARS, "$Npc_" + f + ".png")
        if os.path.exists(src):
            shutil.copyfile(src, os.path.join(CHARS, "$Cr_Face_" + f + ".png"))
    print("faces", len(FACES))


def main():
    cfg = json.load(open(os.path.join(HERE, "sheets.json"), encoding="utf-8"))
    keys = sys.argv[1:] or [k for k in cfg if not k.startswith("_")] + ["faces"]
    for key in keys:
        if key == "faces":
            faces()
            continue
        c = cfg[key]
        if not os.path.isdir(os.path.join(HERE, "rot", key)):
            print(key, "no rotations yet")
            continue
        for name, spec in c["sheets"].items():
            build_sheet(key, c, name, spec)


main()
