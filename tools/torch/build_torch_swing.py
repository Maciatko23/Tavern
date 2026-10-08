# Builds the torch blow's sheet img/system/Hero_Torch.png (the swing sheets' format: 4 rows down / left / right / up, 17 cells of
# 96x96, the feet at (48, 79); left = right mirrored) from the PixelLab animation "torch_strike" of the hero's "Torch" state
# (character cf7f2ba0-94b8-4839-8053-3244045de8a2, group cf06c24d-9a3d-4e2a-b3f0-1b24c20e636c; frames downloaded into <dir>/s1_<dir>/N.png),
# and the table of where the flame is on every cell (Torch.js SWING_TIPS: the sparks fly from there).
# The flames PixelLab painted stay (they move with the blow - a smear of fire), but in the campfire's colours (Farming_Render.js
# FLAME_LAYERS), so the torch's fire is the same fire as everywhere else.
#   python tools/torch/build_torch_swing.py <frames dir> [preview.gif]
import colorsys, json, sys
from PIL import Image, ImageOps

GAME = __file__.replace("\\", "/").rsplit("/tools/", 1)[0] + "/"
SRC = sys.argv[1].rstrip("/\\") + "/"
GIF = sys.argv[2] if len(sys.argv) > 2 else None
C, FEET = 96, (48, 79)
# the campfire's fire: dark red, orange, yellow, the pale core
FIRE = [(0xb8, 0x32, 0x1a), (0xee, 0x6a, 0x1a), (0xff, 0xb4, 0x3a), (0xff, 0xf1, 0xa6)]
# which frames of each direction, in which order. South: all but 7 (the flame over his face), the blow lands on 8 (cell 7). East: the
# model swung it to and fro twice - raised behind the head, down behind, forward (the thrust, 11 = cell 7), low in front, back, up
# again. North: all; the torch passes in front of him (hidden by the body) on 9 = the blow. -> HeroLook SWINGS[20].hit [7, 7, 7, 9]
PICK = {"south": [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 0],
        "east": [0, 2, 3, 4, 8, 9, 10, 11, 11, 12, 13, 14, 15, 16, 2, 1, 0],
        "north": list(range(17))}


def is_fire(p):
    r, g, b, a = p
    if a < 100:
        return False
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if v > 0.93 and s < 0.12 and r > 235:   # the white core of the painted flame
        return "core"
    return s > 0.6 and v > 0.62 and (h < 0.17 or h > 0.97)


def recolour(im):
    """the painted fire in the campfire's four colours; where it is (the centre of its pixels, None without fire)"""
    px = im.load()
    w, h = im.size
    pts = []
    cores = []
    for y in range(h):
        for x in range(w):
            f = is_fire(px[x, y])
            if not f:
                continue
            if f == "core":
                cores.append((x, y))
                continue
            r, g, b, a = px[x, y]
            lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255
            c = FIRE[0] if lum < 0.45 else FIRE[1] if lum < 0.62 else FIRE[2] if lum < 0.82 else FIRE[3]
            px[x, y] = c + (255,)
            pts.append((x, y))
    near = set(pts)
    for (x, y) in cores:   # (white only inside a flame: else it is something else - an eye, a glint)
        if any((x + dx, y + dy) in near for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2)):
            px[x, y] = FIRE[3] + (255,)
            pts.append((x, y))
    if len(pts) < 4:
        return None
    # the flame's foot: of the fire's pixels, the middle of the biggest cluster (sparks flying off do not move it)
    sx = sorted(p[0] for p in pts)
    sy = sorted(p[1] for p in pts)
    return (sx[len(sx) // 2], sy[len(sy) // 2])


def feet(im):
    px = im.load()
    w, h = im.size
    bottom = max(y for y in range(h) for x in range(w) if px[x, y][3] > 0)
    xs = [x for y in range(bottom - 3, bottom + 1) for x in range(w) if px[x, y][3] > 0]
    return (min(xs) + max(xs)) / 2, bottom


def row_of(direction):
    frames = [Image.open(SRC + "s1_%s/%d.png" % (direction, i)).convert("RGBA") for i in PICK[direction]]
    fx, fy = feet(frames[0])
    dx, dy = round(FEET[0] - fx), FEET[1] - fy
    cells, tips = [], []
    for im in frames:
        tip = recolour(im)
        cell = Image.new("RGBA", (C, C), (0, 0, 0, 0))
        cell.paste(im, (dx, dy), im)
        cells.append(cell)
        tips.append([tip[0] + dx, tip[1] + dy] if tip else None)
    return cells, tips


def main():
    rows = {}
    rows["down"] = row_of("south")
    rows["right"] = row_of("east")
    rows["up"] = row_of("north")
    rc, rt = rows["right"]
    rows["left"] = ([ImageOps.mirror(c) for c in rc], [[C - 1 - t[0], t[1]] if t else None for t in rt])
    order = ("down", "left", "right", "up")
    n = max(len(rows[k][0]) for k in order)
    sheet = Image.new("RGBA", (C * n, C * 4), (0, 0, 0, 0))
    for r, k in enumerate(order):
        for i in range(n):
            sheet.alpha_composite(rows[k][0][min(i, len(rows[k][0]) - 1)], (i * C, r * C))
    sheet.save(GAME + "img/system/Hero_Torch.png")
    tips = [rows[k][1] for k in order]
    with open(GAME + "tools/torch/swing_tips.json", "w", encoding="utf8") as f:
        json.dump(tips, f)
    if GIF:
        S = 2
        gif = []
        for i in range(n):
            fr = Image.new("RGBA", (C * S * 4, C * S), (60, 80, 60, 255))
            for r, k in enumerate(order):
                im = rows[k][0][min(i, len(rows[k][0]) - 1)]
                fr.alpha_composite(im.resize((C * S, C * S), Image.NEAREST), (r * C * S, 0))
            gif.append(fr.convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=255))
        gif[0].save(GIF, save_all=True, append_images=gif[1:], duration=[70] * (n - 1) + [300], loop=0)
    print("Hero_Torch", n, "frames; tips", [sum(1 for t in row if t) for row in tips])


if __name__ == "__main__":
    main()
