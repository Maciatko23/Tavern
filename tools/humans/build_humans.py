# python tools/humans/build_humans.py [key ...]
# Builds the game sheets of the human enemies (combat stage 3, js/plugins/Humans.js) from the PixelLab frames that fetch_zip.py
# unpacked into tools/humans/frames/<key>/<animation>/<direction>/<i>.png and the rotations of fetch_rot.py (tools/humans/rot/<key>/).
# sheets.json says which animation makes which sheet. Writes
#   img/characters/anim8/<Look>_<Sheet>.png   8 rows (S, SW, W, NW, N, NE, E, SE) x columns of square cells (Hunting.js LOOK8 layout);
#                                             a "standing" sheet has the rotation in column 0, then the cycle
#   img/characters/$Human_<Look>[_<Old>].png  the old 4-way sheet (3 x 4 cells: down, left, right, up) - only drawn when the 8-way
#                                             looks are off (tests); a missing file would halt the game
#   tools/humans/preview/<key>_<Sheet>.png    the sheet x2 on mid-grey
# The west side (W, SW, NW) is always the mirror of the east side (E, SE, NE): the weapon stays in the same hand as in the mirrored
# blows. Feet: each row moved as a whole so the standing figure's feet are on the hero's row for that way (Hero_Walk.png: S 61, SW 62,
# W 62, NW 61, N 60, NE 61, E 62, SE 62); a bigger cell keeps the same margin under the feet. A frame on a bigger canvas (v3) is placed
# by the offset that puts its frame 0 (the reference rotation) where the rotation stands - the same offset for the whole row, so a
# lunge or a step stays in the picture. Missing frames: the rotation stands in (a placeholder - the game never lacks a file); "fill":
# a direction made from another's frames (sheets.json: {"south-east": "south"}).
import os, sys, json
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", ".."))
CHARS = os.path.join(GAME, "img", "characters")
DIRS = ["south", "south-west", "west", "north-west", "north", "north-east", "east", "south-east"]
MIRROR = {"west": "east", "south-west": "south-east", "north-west": "north-east"}
BASE = {"south": 61, "south-west": 62, "west": 62, "north-west": 61, "north": 60, "north-east": 61, "east": 62, "south-east": 62}
OLD_ROWS = ["south", "west", "east", "north"]


def bbox(im):
    return im.getchannel("A").getbbox()


def clean(im, keep=10):
    """Alpha to 0/255, and stray specks (8-connected clusters of up to `keep` px apart from the figure: the debris and sparks v3
    draws at a blow) taken out."""
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
    if len(comps) > 1:
        big = max(len(c) for c in comps)
        for c in comps:
            if len(c) <= keep and len(c) < big:
                for (x, y) in c:
                    px[x, y] = (0, 0, 0, 0)
    return im


def steel(im):
    """The glowing cyan v3 sometimes paints on a swung blade, back to the blade's grey steel (same lightness)."""
    im = im.copy()
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if a and b - r > 35 and g - r > 15:
                v = (r + g + b) // 3
                px[x, y] = (int(v * 0.9), int(v * 0.93), v, a)
    return im


def rot(key, d):
    src = MIRROR.get(d)
    im = clean(Image.open(os.path.join(HERE, "rot", key, (src or d) + ".png")))
    return im.transpose(Image.FLIP_LEFT_RIGHT) if src else im


def frames_of(key, anim, d, spec):
    src = MIRROR.get(d, d)
    own = (spec.get("from") or {}).get(src)   # a direction taken from another animation (a re-roll in its own group)
    folder = os.path.join(HERE, "frames", key, own or anim, src)
    fill = (spec.get("fill") or {}).get(src)   # a direction not made: another's frames (a pose that hardly turns - kneeling, sitting)
    if fill and (not os.path.isdir(folder) or spec.get("fill_force")):   # (fill_force: even when that direction was made - and failed)
        folder = os.path.join(HERE, "frames", key, own or anim, fill)
    if not anim or not os.path.isdir(folder):
        return None
    files = sorted([f for f in os.listdir(folder) if f.endswith(".png")], key=lambda f: int(os.path.splitext(f)[0]))
    out = [clean(Image.open(os.path.join(folder, f))) for f in files]
    if src in (spec.get("steel") or []):
        out = [steel(im) for im in out]
    if MIRROR.get(d):
        out = [im.transpose(Image.FLIP_LEFT_RIGHT) for im in out]
    return out


def place(im, cell, ox, oy):
    c = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    c.alpha_composite(im, (max(ox, 0), max(oy, 0)), (max(-ox, 0), max(-oy, 0)))
    return c


def rotation_cell(key, d, cell):
    r = rot(key, d)
    b = bbox(r)
    feet = BASE[d] + (cell - 64)
    return place(r, cell, (cell - 64) // 2, feet - (b[3] - 1)), r


def lie_cell(key, d, cell, spec):
    # lying on his side: a picture of its own (spec "image": tools/humans/<file>, facing east) or the side view turned a quarter (lossless)
    east = d in ("east", "north-east", "south-east", "south", "north")
    if spec.get("image") and os.path.exists(os.path.join(HERE, spec["image"].replace("<key>", key))):
        im = clean(Image.open(os.path.join(HERE, spec["image"].replace("<key>", key))))
        if not east:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
    else:
        r = rot(key, "east" if east else "west")
        im = r.rotate(-90 if east else 90, expand=True)
    im = im.crop(bbox(im))
    w, h = im.size
    return place(im, cell, (cell - w) // 2, cell - 3 - h)


def build_sheet(key, look, name, spec):
    cell = spec.get("cell", 64)
    rows = []
    for d in DIRS:
        if spec.get("lie"):
            rows.append([lie_cell(key, d, cell, spec)])
            continue
        stand, r = rotation_cell(key, d, cell)
        fr = frames_of(key, spec.get("anim"), d, spec) if spec.get("anim") else None
        if not fr and spec.get("fallback"):   # (no run made yet: the walk's frames)
            fr = frames_of(key, spec["fallback"], d, {"from": spec.get("fallback_from") or {}})
        cells = [stand] if spec.get("standing", False) else []
        if fr:
            f0, b0, br = fr[0], bbox(fr[0]), bbox(r)
            feet = BASE[d] + (cell - 64)
            rx0 = (cell - 64) // 2 + br[0]   # where frame 0 has to go so it stands where the rotation stands in this cell
            ox, oy = rx0 - b0[0], feet - (b0[3] - 1)
            if (spec.get("align_dirs") or {}).get(MIRROR.get(d, d), spec.get("align")) == "center":   # (no reference frame - a template's run: the canvas centred, the lowest foot on the line)
                low = max(bbox(f)[3] - 1 for f in fr)
                ox, oy = (cell - f0.size[0]) // 2, feet - low
            pick = spec.get("pick") or list(range(len(fr)))
            if isinstance(pick, dict):
                pick = pick.get(d, pick.get(MIRROR.get(d, d), pick.get("*", list(range(len(fr))))))
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
    sheet.save(os.path.join(CHARS, "anim8", look + "_" + name + ".png"))
    prev = Image.new("RGBA", sheet.size, (110, 110, 110, 255))
    prev.alpha_composite(sheet)
    os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
    prev.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(os.path.join(HERE, "preview", key + "_" + name + ".png"))
    if spec.get("old"):
        cols = spec.get("old_cols", [0, 0, 0])
        old = Image.new("RGBA", (cell * 3, cell * 4), (0, 0, 0, 0))
        for r_i, d in enumerate(OLD_ROWS):
            row = rows[DIRS.index(d)]
            for c_i, c in enumerate(cols):
                old.alpha_composite(row[min(c, len(row) - 1)], (c_i * cell, r_i * cell))
        old.save(os.path.join(CHARS, spec["old"] + ".png"))
    print(key, name, n, "x 8 cells of", cell, "(placeholder)" if not any(len(r) > 1 and spec.get("anim") for r in rows) else "")


def main():
    cfg = json.load(open(os.path.join(HERE, "sheets.json"), encoding="utf-8"))
    keys = sys.argv[1:] or [k for k in cfg if not k.startswith("_")]
    for key in keys:
        c = cfg[key]
        for name, spec in c["sheets"].items():
            build_sheet(key, c["look"], name, spec)


main()
