# Measures where the hero's hands are on the walking sheets (img/characters/Hero_Walk / Hero_Run / Hero_Sneak: 8 rows
# S, SW, W, NW, N, NE, E, SE x cells of 64x64): the skin-coloured blobs between the belt and the knees.
#   python tools/torch/measure_hands.py [sheet] -> prints every frame's blobs (centre x, y, lowest y, size)
import sys
from PIL import Image

GAME = __file__.replace("\\", "/").rsplit("/tools/", 1)[0] + "/"
CELL = 64
ROWS = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"]

def is_skin(p):
    r, g, b, a = p
    if a < 128:
        return False
    # the hero's skin: warm, light (f9d4b6 .. a26a4f): red well over blue, green in between, not grey, not the brown trousers
    return r >= 150 and r - b >= 45 and g > b and r > g and (r - g) >= 18 and (r - g) <= 75

def blobs(cell):
    w, h = cell.size
    px = cell.load()
    seen = set()
    out = []
    for y in range(h):
        for x in range(w):
            if (x, y) in seen or not is_skin(px[x, y]):
                continue
            st, comp = [(x, y)], []
            seen.add((x, y))
            while st:
                cx, cy = st.pop()
                comp.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and is_skin(px[nx, ny]):
                            seen.add((nx, ny))
                            st.append((nx, ny))
            out.append(comp)
    return out

def hand_blobs(cell, lo=25, hi=47):
    res = []
    for comp in blobs(cell):
        cy = sum(p[1] for p in comp) / len(comp)
        if lo <= cy <= hi and len(comp) >= 3:
            cx = sum(p[0] for p in comp) / len(comp)
            res.append((round(cx, 1), round(cy, 1), max(p[1] for p in comp), len(comp)))
    return sorted(res)

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "Hero_Walk"
    im = Image.open(GAME + "img/characters/%s.png" % name).convert("RGBA")
    cols = im.width // CELL
    for r in range(8):
        print("==", ROWS[r])
        for c in range(cols):
            cell = im.crop((c * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL))
            print("  ", c, hand_blobs(cell))

# ---- which hand holds the torch, per row: the one nearer the camera (his right facing east-ish, south and north, his left
# facing west-ish) and where it starts (the standing frame)
HOLD = {"S": (21, 38), "SW": (38, 39), "W": (33, 39), "NW": (24, 39), "N": (41, 37), "NE": (39, 38), "E": (29, 39), "SE": (24, 38)}

def track(im, row, fix=None):
    """the torch hand on every frame of a row: [(x, y, size)] - the blob nearest the hand of the frame before (feet left out);
    fix: {col: (x, y)} measured by eye where the blobs mislead"""
    cols = im.width // CELL
    prev = HOLD[ROWS[row]]
    out = []
    for c in range(cols):
        if fix and c in fix:
            prev = fix[c]
            out.append((prev[0], prev[1], -1))
            continue
        cell = im.crop((c * CELL, row * CELL, (c + 1) * CELL, (row + 1) * CELL))
        cand = [b for b in hand_blobs(cell, 26, 44) if b[3] >= 6]
        best = None
        for b in cand:
            d = ((b[0] - prev[0]) ** 2 + (b[1] - prev[1]) ** 2) ** 0.5
            if d <= 13 and (best is None or d < best[0]):
                best = (d, b)
        if best:
            b = best[1]
            prev = (b[0], min(b[2] - 2, b[1] + 1.5))
            out.append((prev[0], prev[1], b[3]))
        else:
            out.append((prev[0], prev[1], 0))
    return out
