# Builds img/system/Hero_TorchCrouch.png: the hero's crouch (Hero_Crouch - picking up, gathering, sowing, harvesting, drawing water:
# 4 rows down / left / right / up, 33 cells of 96x96: the way down 0-16, the same back up 17-32) WITH THE BURNING TORCH IN HAND, and
# the table of where its head is on each cell (Torch.js CROUCH_TIPS: [x, y, behind]).
#   python tools/torch/build_torch_crouch.py
#
# The user (2026-10-08): stooping for something he keeps the torch in his hand (it is put down only for the work of both hands - the
# axe, the pick...). The same way as the walking sheets (build_torch_walk.py): the hand that holds it is the one he holds it in walking
# (his right facing down, up and right; the left facing left = the right row mirrored), its place measured on every frame (key frames
# read by eye from the sheet, the skin blob nearest to them on each frame - HAND_KEYS), the stick in front of him with the fist over
# it, the lean that keeps the stick and the flame off his body (free_lean). Bending down he brings it low - to light the ground he looks at.
import json, math, sys
from PIL import Image, ImageOps
sys.path.insert(0, __file__.replace("\\", "/").rsplit("/", 1)[0])
from measure_hands import GAME, blobs
import build_torch_walk as W

C = 96
DOWN = 17   # cells of the way down (0..16); then back up: cell c > 16 shows cell 32 - c
# the torch hand at key cells (x, y of the 96 cell), read off the sheet (tools: a grid of cells 0, 4, 8, 12, 16 with a ruler)
HAND_KEYS = {
    "down":  {0: (37, 57), 4: (37, 59), 8: (39, 72), 12: (39, 72), 16: (39, 72)},
    "right": {0: (46, 57), 4: (56, 66), 8: (54, 74), 12: (59, 74), 16: (58, 72)},
    "up":    {0: (58, 57), 4: (59, 62), 8: (60, 72), 12: (61, 70), 16: (60, 70)},
}
# the row's own lean (degrees, + = right): out to his side facing down (his right hand: on the left of the picture) and up, ahead of
# him facing right; FREE: how far a frame may lean off it to keep the torch off his body
LEAN = {"down": -40, "right": 50, "up": 30}
FREE = 40
ROW_OF = {"down": 0, "left": 1, "right": 2, "up": 3}


def prior(row, c):
    keys = sorted(HAND_KEYS[row])
    for a, b in zip(keys, keys[1:]):
        if a <= c <= b:
            t = (c - a) / (b - a)
            (x0, y0), (x1, y1) = HAND_KEYS[row][a], HAND_KEYS[row][b]
            return x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
    return HAND_KEYS[row][keys[-1]]


def hand_on(cell, px, py):
    """the hand's skin blob nearest the expected place (the fist's grip: its middle, a little low), or the expected place itself"""
    best = None
    for comp in blobs(cell):
        if len(comp) < 4 or len(comp) > 60:
            continue
        cx = sum(p[0] for p in comp) / len(comp)
        cy = sum(p[1] for p in comp) / len(comp)
        d = math.hypot(cx - px, cy - py)
        if d <= 4 and cy < py + 3 and (best is None or d < best[0]):   # (not a foot below the hand)
            best = (d, cx, min(max(p[1] for p in comp) - 2, cy + 1.5))
    return (round(best[1]), round(best[2])) if best else (round(px), round(py))


def put(img, pixels):
    p = img.load()
    for (x, y), col in pixels.items():
        if 0 <= x < C and 0 <= y < C:
            p[x, y] = col


def overlap(cell, gx, gy, ux, uy):
    a = cell.load()
    n = 0
    for (x, y) in W.torch_pixels(gx, gy, ux, uy):
        if 0 <= x < C and 0 <= y < C and a[x, y][3] > 0 and W.axis(x, y, gx, gy, ux, uy)[0] > 3:
            n += 1
    fx, fy = gx + ux * W.FLAME_AT, gy + uy * W.FLAME_AT
    for y in range(int(fy) - 11, int(fy) + 1):
        for x in range(int(fx) - 3, int(fx) + 4):
            if 0 <= x < C and 0 <= y < C and a[x, y][3] > 0:
                n += 0.5
    return n


def free_lean(cell, gx, gy, base, prev):
    best = None
    for d in range(-FREE, FREE + 1, 5):
        ang = max(-80, min(80, base + d))
        ux, uy = W.lean_vec(ang)
        cost = overlap(cell, gx, gy, ux, uy) + 0.12 * abs(ang - base) + 0.2 * abs(ang - prev)   # (steady: no swings frame to frame)
        if best is None or cost < best[0]:
            best = (cost, ang)
    return best[1]


def build_row(src, row):
    cells, tips, hands = [], [], []
    prev = LEAN[row]
    r = ROW_OF[row]
    for c in range(DOWN):
        cell = src.crop((c * C, r * C, (c + 1) * C, (r + 1) * C))
        hx, hy = hand_on(cell, *prior(row, c))
        gx, gy = hx + 0.5, hy + 0.5
        prev = free_lean(cell, gx, gy, LEAN[row], prev)
        ux, uy = W.lean_vec(prev)
        frame = cell.copy()
        torch = Image.new("RGBA", (C, C), (0, 0, 0, 0))
        put(torch, W.torch_pixels(gx, gy, ux, uy))
        frame.alpha_composite(torch)                 # in his hand on our side: in front of him
        put(frame, W.fist_pixels(gx, gy, ux, uy))    # the fingers round the stick
        cells.append(frame)
        tips.append([round(gx + ux * W.FLAME_AT, 1), round(gy + uy * W.FLAME_AT, 1), 0])
        hands.append([hx, hy, prev])
    return cells, tips, hands


def main():
    src = Image.open(GAME + "img/system/Hero_Crouch.png").convert("RGBA")
    n = src.width // C
    rows = {}
    for row in ("down", "right", "up"):
        rows[row] = build_row(src, row)
    rc, rt, rh = rows["right"]
    rows["left"] = ([ImageOps.mirror(im) for im in rc], [[C - t[0], t[1], t[2]] for t in rt], [[C - 1 - h[0], h[1], -h[2]] for h in rh])
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    table = []
    for row in ("down", "left", "right", "up"):
        cells, tips, _ = rows[row]
        r = ROW_OF[row]
        line = []
        for c in range(n):
            k = c if c < DOWN else max(0, 2 * (DOWN - 1) - c)   # (back up: the way down backwards)
            out.alpha_composite(cells[k], (c * C, r * C))
            line.append(tips[k])
        table.append(line)
    out.save(GAME + "img/system/Hero_TorchCrouch.png")
    with open(GAME + "tools/torch/crouch_tips.json", "w", encoding="utf8") as f:
        json.dump({"tips": table, "hands": {k: v[2] for k, v in rows.items()}}, f)
    print("Hero_TorchCrouch", n, "cells; hands", {k: [h[:2] for h in v[2]][::4] for k, v in rows.items()})


if __name__ == "__main__":
    main()
