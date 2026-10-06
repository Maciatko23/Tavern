# python tools/mountains/art.py [--preview FILE]
# The pictures of the mountain maps (tools/mountains/build.py), drawn here pixel by pixel in the Winlu look (the dressed-stone
# colours of tools/quest_places/art.py, the order's raven glyph from the well's keystone), 1 px dark outline on solid things,
# none on decals; and the PixelLab pieces (tools/mountains/pixellab/: the crane's ruin, the Silent's gate) cut into sheets.
#   img/characters/!Mt_Props.png   "!" sheet, 48 x 96 frames (the event's cell is the frame's bottom 48 x 48)
#     index 0 cut stone   dir 2: block | block with the raven mark | half-sunk block     dir 4: two blocks stacked | split block
#                                                                                        with wedges | chips (decal)
#     index 1 carvings    dir 2: the raven cut in the rock face (2 cells tall, a decal over the cliff's face) | masons' marks | seven notches
#     index 2 the dry pond dir 2: dead reeds | cracked mud with a fish's bones | a few dry stalks
#     index 3 the tunnel  dir 2: rubble up to the roof (closed) | the passage dug through (a timbered hole)
#                         dir 4: the diggers' plank barricade (closed) | the barricade pulled aside (open)
#     index 4 the camp    dir 2: a bedroll | a sack of ore | a pick leaning on the wall
#     index 5 the Silent  dir 2: a cairn of flat stones with a white strip | a post with a carved closed mouth | a stone with chalk lines
#   img/characters/!$Mt_Tent.png   144 x 144 frames: dir 2 the game's hide tent (Farm_Tent_L) | the diggers' canvas tent | mirrored
#   img/characters/!$Mt_Crane.png  144 x 192 frames: dir 2 the crane's ruin (PixelLab)
#   img/characters/!$Mt_Gate.png   144 x 144 frames: dir 2 the Silent's gate closed, dir 4 open (PixelLab)
import os, sys, argparse
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CHARS = os.path.join(ROOT, "img", "characters")
PL = os.path.join(HERE, "pixellab")
FW, FH = 48, 96

OUT = (38, 32, 38)
CUT = {"dk": (84, 79, 78), "md": (104, 99, 95), "lt": (122, 117, 110), "hi": (140, 135, 126), "edge": (60, 55, 58), "top": (150, 145, 136), "tophi": (166, 160, 150)}
ROCK = {"cut": (44, 42, 46), "lip": (128, 126, 120), "shade": (62, 60, 64)}
WOOD = {"o": (44, 32, 30), "d": (78, 58, 48), "m": (100, 76, 60), "l": (122, 94, 72), "h": (142, 112, 84)}
MUD = {"d": (70, 58, 46), "m": (96, 80, 62), "l": (122, 104, 80), "crack": (52, 42, 34)}
REED = {"d": (104, 92, 58), "m": (138, 124, 78), "l": (170, 156, 102)}
BONE = (214, 206, 186)
CLOTH = {"d": (176, 172, 160), "m": (214, 212, 202), "l": (238, 236, 228)}
VOID = (14, 12, 16)
SACK = {"o": (58, 44, 34), "d": (118, 96, 68), "m": (150, 126, 90), "l": (176, 152, 110)}
ORE = {"d": (92, 60, 46), "m": (138, 86, 58), "l": (176, 116, 76)}
IRON = {"o": (26, 28, 34), "d": (56, 62, 70), "m": (84, 94, 104), "h": (124, 136, 146)}
CHALK = (226, 224, 214)

RAVEN = ["......####......",
         "....######......",
         "..#########.....",
         "#####.#######...",
         "....##########..",
         ".....#########..",
         "......########..",
         ".......#######..",
         "........####.##.",
         ".........#.#..##",
         "........##.##..."]


def h32(*a):
    v = 2166136261
    for ch in repr(a).encode():
        v = ((v ^ ch) * 16777619) & 0xFFFFFFFF
    return v


class Fr:
    def __init__(self, w=FW, h=FH):
        self.im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        self.px = self.im.load()
        self.w, self.h = w, h

    def put(self, x, y, c, a=255):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = (c[0], c[1], c[2], a)

    def get(self, x, y):
        return self.px[x, y] if 0 <= x < self.w and 0 <= y < self.h else (0, 0, 0, 0)

    def outline(self, col=OUT):
        src = self.im.copy(); sp = src.load()
        for y in range(self.h):
            for x in range(self.w):
                if sp[x, y][3]: continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < self.w and 0 <= ny < self.h and sp[nx, ny][3] > 200:
                        self.put(x, y, col); break

    def shadow(self, x0, x1, y, depth=3, alpha=70):
        """a soft ground shadow under a thing (to the lower left, like the Winlu props)"""
        for d in range(depth):
            for x in range(x0 - 2 - d, x1 - d):
                if not self.get(x, y + d)[3]: self.put(x, y + d, (0, 0, 0), alpha - d * 18)


def block(fr, x0, y0, w, h, top, mark=None, tilt=0):
    """a dressed block: the top face (top rows, lighter), the front face, the right side in shade; tool marks"""
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if y < y0 + top:
                c = CUT["tophi"] if y == y0 or x == x0 else CUT["top"]
            elif x >= x0 + w - 3:
                c = CUT["dk"]
            else:
                c = CUT["lt"] if (h32(x // 3, y // 2, x0) % 7) else CUT["md"]
                if y == y0 + top: c = CUT["hi"]
                if (x - x0 + (y - y0) * 2) % 9 == 0 and y > y0 + top + 1: c = CUT["md"]      # the chisel's lines
            fr.put(x, y, c)
    if mark == "raven":
        rx0, ry0 = x0 + (w - 3 - 16) // 2, y0 + top + max(1, (h - top - 11) // 2)
        for j, row in enumerate(RAVEN):
            for i, ch in enumerate(row):
                if ch == "#":
                    fr.put(rx0 + i, ry0 + j, (58, 54, 58))
                    below = RAVEN[j + 1][i] if j + 1 < len(RAVEN) else "."
                    if below != "#": fr.put(rx0 + i, ry0 + j + 1, CUT["hi"])
        fr.put(rx0 + 5, ry0 + 1, (150, 146, 136))
    if mark == "split":
        cx = x0 + w // 2
        for y in range(y0, y0 + h):
            fr.put(cx + (y - y0) % 2, y, CUT["edge"])
        for wy in (y0 + top + 2, y0 + h - 6):
            for k in range(3):
                fr.put(cx - 1 + k, wy, IRON["m"]); fr.put(cx - 1 + k, wy - 1, IRON["h"])


def f_block(kind):
    fr = Fr()
    if kind == "plain":
        block(fr, 5, 64, 38, 28, 9)
    elif kind == "raven":
        block(fr, 4, 62, 40, 30, 9, "raven")
    elif kind == "sunk":
        block(fr, 6, 70, 34, 18, 7)
        for x in range(4, 44):                                  # earth heaped round its foot
            for y in range(86, 92):
                if (x - 24) ** 2 / 400 + (y - 88) ** 2 / 9 <= 1: fr.put(x, y, MUD["m"] if (x + y) % 3 else MUD["d"])
    elif kind == "stack":
        block(fr, 3, 66, 42, 26, 8)
        block(fr, 9, 44, 32, 24, 8, "raven")
    elif kind == "split":
        block(fr, 4, 62, 40, 30, 9, "split")
    elif kind == "chips":
        for i in range(26):
            x, y = 6 + h32(i, 1) % 36, 78 + h32(i, 2) % 14
            s = 1 + h32(i, 3) % 3
            for dy in range(s):
                for dx in range(s + 1):
                    fr.put(x + dx, y + dy, CUT["hi"] if dy == 0 else CUT["md"])
        return fr.im
    fr.outline()
    fr.shadow(6, 44, 93)
    return fr.im


def f_carving(kind):
    """decals on a cliff face cell pair (48 x 96): cut lines in shade with a lit lower lip, no outline"""
    fr = Fr()
    if kind == "raven":
        # a big raven (the glyph x2), cut into the stone, with a ring round it
        cx, cy = 24, 44
        for y in range(cy - 19, cy + 20):
            for x in range(cx - 19, cx + 20):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                if 17.2 <= d <= 18.6: fr.put(x, y, ROCK["cut"], 230)
                elif 18.6 < d <= 19.6 and y > cy: fr.put(x, y, ROCK["lip"], 200)
        rx0, ry0 = cx - 16, cy - 11
        for j, row in enumerate(RAVEN):
            for i, ch in enumerate(row):
                if ch == "#":
                    for a in range(2):
                        for b in range(2):
                            fr.put(rx0 + i * 2 + a, ry0 + j * 2 + b, ROCK["cut"], 235)
                    below = RAVEN[j + 1][i] if j + 1 < len(RAVEN) else "."
                    if below != "#":
                        fr.put(rx0 + i * 2, ry0 + j * 2 + 2, ROCK["lip"], 210); fr.put(rx0 + i * 2 + 1, ry0 + j * 2 + 2, ROCK["lip"], 210)
        fr.put(rx0 + 11, ry0 + 3, ROCK["lip"], 220)
        # lichen over a corner of it (it is old)
        for i in range(30):
            x, y = cx + 6 + h32(i, 9) % 14, cy + 8 + h32(i, 10) % 10
            fr.put(x, y, (120, 132, 92), 180)
    elif kind == "marks":
        for k, (x, y) in enumerate(((10, 30), (30, 36), (16, 56), (34, 60))):
            for t in range(7):
                fr.put(x + t, y + (t if k % 2 else 0), ROCK["cut"], 220); fr.put(x + t, y + 1 + (t if k % 2 else 0), ROCK["lip"], 180)
            for t in range(5):
                fr.put(x + 3, y - 2 + t, ROCK["cut"], 220)
    elif kind == "notches":
        for n in range(7):
            x = 9 + n * 5
            for t in range(10):
                fr.put(x, 38 + t, ROCK["cut"], 230); fr.put(x + 1, 38 + t, ROCK["shade"], 200)
            fr.put(x, 48, ROCK["lip"], 200); fr.put(x + 1, 48, ROCK["lip"], 200)
    return fr.im


def f_pond(kind):
    fr = Fr()
    if kind == "reeds":
        for i in range(9):
            x = 10 + i * 3 + h32(i) % 3
            top = 52 + h32(i, 5) % 18
            for y in range(top, 90):
                lean = (90 - y) // (8 + h32(i, 6) % 6) * (1 if i % 2 else -1)
                fr.put(x + lean, y, REED["m"] if y > top + 2 else REED["l"])
                fr.put(x + lean + 1, y, REED["d"])
        fr.outline((70, 60, 40))
    elif kind == "bones":
        for x in range(8, 42):                                 # a plate of dried mud, cracked
            for y in range(76, 92):
                if (x - 25) ** 2 / 290 + (y - 84) ** 2 / 64 <= 1:
                    fr.put(x, y, MUD["l"] if (h32(x // 4, y // 3) % 5) else MUD["m"])
        for (x, y, dx, dy, n) in ((14, 80, 1, 1, 9), (24, 77, 1, 1, 10), (30, 84, 1, -1, 7), (19, 88, 1, 0, 12)):
            for t in range(n): fr.put(x + t * dx, y + (t // 2) * dy, MUD["crack"])
        # a fish's bones
        for t in range(14): fr.put(18 + t, 83, BONE)
        for t in range(0, 12, 2):
            fr.put(20 + t, 81, BONE); fr.put(20 + t, 85, BONE)
        for p in ((16, 82), (16, 84), (15, 83), (33, 82), (34, 81), (34, 85), (33, 84)): fr.put(*p, BONE)
    elif kind == "stalks":
        for i in range(5):
            x = 14 + i * 5
            for y in range(70 + h32(i) % 10, 90):
                fr.put(x + (90 - y) // 9, y, REED["m"]); fr.put(x + 1 + (90 - y) // 9, y, REED["d"])
        fr.outline((70, 60, 40))
    return fr.im


def stones_heap(fr, x0, x1, ytop, ybot, seed, cap=True):
    """a heap of broken stones from the floor up to ytop (in the tunnel: up to the roof)"""
    for y in range(ytop, ybot):
        for x in range(x0, x1):
            k = h32(x // 5 + (y // 4) % 2, y // 4, seed)
            c = CUT["md"] if k % 3 else CUT["dk"]
            if (x % 5 == 0 and k % 2) or y % 4 == 0: c = OUT if (y > ytop + 2) else CUT["dk"]
            elif k % 7 == 0: c = CUT["lt"]
            fr.put(x, y, c)


def f_tunnel(kind):
    fr = Fr()
    if kind == "rubble":
        stones_heap(fr, 2, 46, 10, 94, 31)
        for x in range(6, 42):                                # a broken beam across it
            fr.put(x, 40 + (x - 6) // 6, WOOD["m"]); fr.put(x, 41 + (x - 6) // 6, WOOD["d"]); fr.put(x, 39 + (x - 6) // 6, WOOD["l"])
        fr.outline()
    elif kind == "dug":
        for y in range(8, 94):                                # a dark hole, timbered: two posts and a cap
            for x in range(4, 44):
                fr.put(x, y, VOID if 9 < x < 39 else WOOD["d"])
        for y in range(8, 94):
            for x in (4, 5, 6, 7, 8): fr.put(x, y, WOOD["m"] if x in (5, 6) else WOOD["d"])
            for x in (39, 40, 41, 42, 43): fr.put(x, y, WOOD["m"] if x in (40, 41) else WOOD["d"])
        for y in range(8, 15):
            for x in range(2, 46): fr.put(x, y, WOOD["l"] if y in (9, 10) else WOOD["m"] if y < 13 else WOOD["d"])
        stones_heap(fr, 0, 9, 70, 94, 77); stones_heap(fr, 40, 48, 76, 94, 78)
        fr.outline()
    elif kind == "barricade":
        for k in range(6):                                    # planks nailed across two posts
            y = 26 + k * 11
            for x in range(3, 45):
                for t in range(8):
                    fr.put(x, y + t, WOOD["l"] if t == 0 else WOOD["m"] if t < 6 else WOOD["d"])
            fr.put(8, y + 3, IRON["h"]); fr.put(39, y + 3, IRON["h"])
        for y in range(18, 94):
            for x in (5, 6, 7, 40, 41, 42): fr.put(x, y, WOOD["d"] if x in (5, 42) else WOOD["m"])
        fr.outline()
    elif kind == "barricade_open":
        for y in range(18, 94):
            for x in (5, 6, 7, 40, 41, 42): fr.put(x, y, WOOD["d"] if x in (5, 42) else WOOD["m"])
        for k in range(4):                                    # the planks leaning against the left post
            for t in range(60):
                y = 92 - t
                x = 9 + k * 3 + t // 10
                fr.put(x, y, WOOD["m"]); fr.put(x + 1, y, WOOD["d"])
        fr.outline()
    return fr.im


def f_camp(kind):
    fr = Fr()
    if kind == "bedroll":
        for y in range(60, 92):
            for x in range(10, 38):
                fr.put(x, y, SACK["d"] if x in (10, 37) else (SACK["m"] if (y // 3) % 2 else SACK["l"]))
        for y in range(60, 68):
            for x in range(11, 37): fr.put(x, y, (176, 168, 150))       # a rolled blanket for the head
        fr.outline()
    elif kind == "sack":
        for y in range(66, 92):
            w = 13 - abs(y - 80) // 3
            for x in range(24 - w, 24 + w):
                fr.put(x, y, SACK["l"] if x < 20 else SACK["m"] if x < 30 else SACK["d"])
        for i in range(9):
            fr.put(19 + h32(i) % 10, 64 + h32(i, 2) % 4, ORE["m"]); fr.put(20 + h32(i, 3) % 8, 65, ORE["l"])
        fr.outline(); fr.shadow(12, 36, 92)
    elif kind == "pick":
        for t in range(56):                                   # the handle leaning to the left
            fr.put(28 - t // 6, 92 - t, WOOD["m"]); fr.put(29 - t // 6, 92 - t, WOOD["d"])
        for t in range(-12, 13):                              # the iron head
            y = 37 + abs(t) // 4
            fr.put(19 + t, y, IRON["m"]); fr.put(19 + t, y + 1, IRON["d"]); fr.put(19 + t, y - 1, IRON["h"] if abs(t) < 8 else IRON["m"])
        fr.outline()
    return fr.im


def f_silent(kind):
    fr = Fr()
    if kind == "cairn":
        y = 92
        for k, w in enumerate((16, 14, 12, 10, 8, 6)):
            hgt = 6 - (k > 3)
            for yy in range(y - hgt, y):
                for x in range(24 - w, 24 + w):
                    fr.put(x, yy, CUT["top"] if yy == y - hgt else CUT["lt"] if x < 24 + w - 3 else CUT["dk"])
            y -= hgt
        for t in range(16):                                   # a white strip tied round it, its end lying in the wind
            fr.put(14 + t, 70 + t // 5, CLOTH["l"]); fr.put(14 + t, 71 + t // 5, CLOTH["m"])
        for t in range(10): fr.put(30 + t, 74 + t // 2, CLOTH["m"]); fr.put(30 + t, 75 + t // 2, CLOTH["d"])
        fr.outline(); fr.shadow(8, 40, 93)
    elif kind == "post":
        for y in range(20, 94):
            for x in range(18, 30): fr.put(x, y, WOOD["l"] if x < 21 else WOOD["m"] if x < 27 else WOOD["d"])
        # a face cut in it: two eyes, the mouth a sewn line
        for x in (21, 26): fr.put(x, 34, OUT); fr.put(x, 35, WOOD["d"])
        for x in range(20, 28): fr.put(x, 42, OUT)
        for x in range(20, 28, 2): fr.put(x, 41, OUT); fr.put(x, 43, OUT)
        for t in range(12): fr.put(18 + t, 52, CLOTH["l"]); fr.put(18 + t, 53, CLOTH["m"])
        fr.outline(); fr.shadow(16, 32, 93)
    elif kind == "chalk":
        for y in range(66, 92):
            for x in range(8, 40):
                if (x - 24) ** 2 / 256 + (y - 80) ** 2 / 160 <= 1:
                    fr.put(x, y, CUT["top"] if y < 72 else CUT["lt"] if x < 34 else CUT["dk"])
        for x in range(14, 34, 3):
            for t in range(6): fr.put(x, 74 + t, CHALK)
        for t in range(16): fr.put(14 + t, 82, CHALK)
        fr.outline(); fr.shadow(8, 40, 92)
    return fr.im


SHEET = {   # index -> {direction: [pattern 0, 1, 2]}
    0: {2: [("block", "plain"), ("block", "raven"), ("block", "sunk")], 4: [("block", "stack"), ("block", "split"), ("block", "chips")]},
    1: {2: [("carving", "raven"), ("carving", "marks"), ("carving", "notches")]},
    2: {2: [("pond", "reeds"), ("pond", "bones"), ("pond", "stalks")]},
    3: {2: [("tunnel", "rubble"), ("tunnel", "dug"), ("tunnel", "rubble")], 4: [("tunnel", "barricade"), ("tunnel", "barricade_open"), ("tunnel", "barricade")]},
    4: {2: [("camp", "bedroll"), ("camp", "sack"), ("camp", "pick")]},
    5: {2: [("silent", "cairn"), ("silent", "post"), ("silent", "chalk")]},
}
DRAW = {"block": f_block, "carving": f_carving, "pond": f_pond, "tunnel": f_tunnel, "camp": f_camp, "silent": f_silent}


def props_sheet():
    sheet = Image.new("RGBA", (FW * 12, FH * 8), (0, 0, 0, 0))
    for idx, dirs in SHEET.items():
        cx, cy = (idx % 4) * 3, (idx // 4) * 4
        for d, pats in dirs.items():
            for p, (kind, arg) in enumerate(pats):
                sheet.alpha_composite(DRAW[kind](arg), ((cx + p) * FW, (cy + (d - 2) // 2) * FH))
    return sheet


def single(frames, fw, fh, foot=0):
    """a "$" sheet (3 x 4 frames of fw x fh) from {direction: [pictures]} (missing patterns repeat the first); each picture is
    cut to its content and stands on the frame's bottom (foot: px left empty below it), centred"""
    sheet = Image.new("RGBA", (fw * 3, fh * 4), (0, 0, 0, 0))
    for d, pics in frames.items():
        for p in range(3):
            pic = pics[p] if p < len(pics) else pics[0]
            bb = pic.getbbox()
            if bb:
                cx = (bb[0] + bb[2]) / 2.0
                pic = pic.crop(bb)
                x = p * fw + int(round(fw / 2.0 - (cx - bb[0])))
            else:
                x = p * fw
            y = (d - 2) // 2 * fh + (fh - pic.height - foot)
            sheet.alpha_composite(pic, (max(p * fw, x), max((d - 2) // 2 * fh, y)))
    return sheet


def cut(pic, box):
    return pic.crop(box)


def tent_sheet():
    tent = Image.open(os.path.join(ROOT, "img", "system", "Farm_Tent_L.png")).convert("RGBA")
    canvas = tent.copy(); px = canvas.load()
    for y in range(canvas.height):                         # the hides as weathered canvas: browns -> grey-beige
        for x in range(canvas.width):
            r, g, b, a = px[x, y]
            if not a: continue
            L = 0.3 * r + 0.59 * g + 0.11 * b
            if r > g + 8 and L > 60:                       # (the hide's warm browns; the wooden poles stay)
                px[x, y] = (int(L * 1.02 + 22), int(L * 1.0 + 18), int(L * 0.9 + 10), a)
    pad = lambda im: im
    return single({2: [pad(tent), pad(canvas), canvas.transpose(Image.FLIP_LEFT_RIGHT)],
                   4: [tent.transpose(Image.FLIP_LEFT_RIGHT), canvas.transpose(Image.FLIP_LEFT_RIGHT)]}, 144, 144)


def pl(name):
    p = os.path.join(PL, name)
    return Image.open(p).convert("RGBA") if os.path.exists(p) else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    a = ap.parse_args()
    out = {"!Mt_Props.png": props_sheet(), "!$Mt_Tent.png": tent_sheet()}
    crane = pl("crane.png")
    if crane is not None:
        out["!$Mt_Crane.png"] = single({2: [crane]}, 144, 192, foot=4)
    cave, rubble = pl("cave.png"), pl("rubble.png")
    if cave is not None and rubble is not None:
        # dir 2: the mouth (the cave's, or a passage dug through) | dir 4: the same fallen in
        out["!$Mt_Cave.png"] = single({2: [cave], 4: [rubble]}, 96, 96)
    blocks, singles = pl("blocks.png"), pl("blocks3.png")
    if blocks is not None:
        fr = {2: [blocks, blocks.transpose(Image.FLIP_LEFT_RIGHT)]}
        if singles is not None:
            parts = split_parts(singles)
            fr[4] = parts[:3] if len(parts) >= 2 else [singles]
        out["!$Mt_Blocks.png"] = single(fr, 96, 96, foot=2)
    gate, gate_open = pl("gate_closed.png"), pl("gate_open.png")
    if gate is not None:
        out["!$Mt_Gate.png"] = single({2: [gate], 4: [gate_open or gate]}, 144, 144)
    for n, im in out.items():
        im.save(os.path.join(CHARS, n))
        print("wrote", n, im.size)
    if a.preview:
        ims = list(out.values())
        W = max(i.width for i in ims); H = sum(i.height for i in ims)
        pv = Image.new("RGBA", (W, H), (120, 116, 108, 255)); y = 0
        for i in ims: pv.alpha_composite(i, (0, y)); y += i.height
        pv.resize((W * 2, H * 2), Image.NEAREST).save(a.preview)


def split_parts(im):
    """the separate things of a picture (columns with nothing in them part them), left to right"""
    px = im.load()
    cols = [any(px[x, y][3] > 40 for y in range(im.height)) for x in range(im.width)]
    parts, x = [], 0
    while x < im.width:
        if not cols[x]: x += 1; continue
        x0 = x
        while x < im.width and cols[x]: x += 1
        if x - x0 >= 8: parts.append(im.crop((x0, 0, x, im.height)))
    return parts


if __name__ == "__main__":
    main()
