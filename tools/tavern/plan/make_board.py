# The plan boards on the maps ("Plan karczmy", TavernLife.js): an oak easel holding a framed parchment with the floor's
# plan in miniature (reduced from img/pictures/TavernPlan_N.png) under a red sign "PLAN KARCZMY" in gold, painted to sit
# with the Winlu Interior set and the quest board (!$Tavern_Board.png): soft 4x-drawn shapes, a dark brown outline,
# light from the upper left, Winlu's grey shadow to the lower right.
#   python tools/tavern/plan/make_board.py   (after make_plan.py) ->
#     img/characters/!$Tavern_Plan.png         96 x 96 frames: the ground floor's big easel (vestibule of Map001)
#     img/characters/!$Tavern_Plan_Small.png   48 x 96 frames: direction 2 = Pokoje gości (Map025), 4 = Apartamenty (Map026)
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
TAV = os.path.abspath(os.path.join(HERE, ".."))
sys.path.insert(0, TAV)
from artlib import Canvas4, drop_shadow, harden, premul_resize   # noqa: E402
import pixfont   # noqa: E402

ROOT = os.path.abspath(os.path.join(TAV, "..", ".."))
OUT = os.path.join(ROOT, "img", "characters")
LINE = (38, 24, 16, 255)
WOOD = {"d2": (56, 35, 23, 255), "d1": (74, 47, 32, 255), "m": (104, 68, 46, 255), "l": (134, 92, 62, 255), "hl": (164, 120, 82, 255)}
OAK = {"d": (112, 74, 40, 255), "m": (150, 104, 58, 255), "l": (186, 138, 82, 255), "hl": (214, 170, 110, 255)}
RED, RED_D, RED_L = (100, 30, 20, 255), (70, 16, 12, 255), (132, 50, 32, 255)
GOLD, GOLD_D = (238, 196, 92, 255), (122, 78, 26, 255)
PAPER = (232, 218, 184, 255)

MINI_WASH = {"guest": (226, 178, 104), "service": (170, 186, 132), "private": (206, 150, 140), "hall": (236, 222, 190), "stairs": (214, 198, 166)}

def miniature(i, w, h):
    """the floor's plan in miniature, drawn from the plan's own rooms (plan_data.json): flat washes, one ink line round
    every room, a heavier line round the building - a plan that still reads at a few dozen pixels"""
    from PIL import ImageDraw
    data = json.load(open(os.path.join(HERE, "plan_data.json"), encoding="utf-8"))
    fl = data["floors"][i]
    xs, ys = [], []
    for r in fl["rooms"]:
        for (x0, y0, x1, y1) in r["r"]:
            xs += [x0, x1 + 1]; ys += [y0, y1 + 1]
    bx0, by0, bx1, by1 = min(xs) - 1, min(ys) - 1, max(xs) + 1, max(ys) + 1
    k = min(w / (bx1 - bx0), h / (by1 - by0))
    W, H = max(1, round((bx1 - bx0) * k)), max(1, round((by1 - by0) * k))
    S = 6
    im = Image.new("RGB", (W * S, H * S), (232, 218, 184))
    d = ImageDraw.Draw(im)
    P = lambda x, y: ((x - bx0) * k * S, (y - by0) * k * S)
    d.rectangle([P(bx0 + 0.5, by0 + 0.5), P(bx1 - 0.5, by1 - 0.5)], fill=(64, 44, 30))    # the walls: all that is not a room
    for r in fl["rooms"]:
        for (x0, y0, x1, y1) in r["r"]:
            d.rectangle([P(x0, y0), P(x1 + 1, y1 + 1)], fill=MINI_WASH.get(r["t"], (232, 218, 184)))
    for r in fl["rooms"]:   # an ink line round each room, about a pixel wide once reduced
        for (x0, y0, x1, y1) in r["e"]:
            d.line([P(x0, y0), P(x1, y1)], fill=(64, 44, 30), width=int(S * 0.8))
    return im.resize((W, H), Image.LANCZOS)

def framed_parchment(c, x0, y0, x1, y1, bevel=3):
    """an oak frame with a bevel (light top/left, dark bottom/right) and a little grain round a parchment, the paper's edge
    a shade darker"""
    c.rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1, fill=LINE)
    c.rect(x0, y0, x1, y1, fill=OAK["m"])
    c.poly([(x0, y0), (x1, y0), (x1 - bevel, y0 + bevel), (x0 + bevel, y0 + bevel)], fill=OAK["hl"])
    c.poly([(x0, y0), (x0 + bevel, y0 + bevel), (x0 + bevel, y1 - bevel), (x0, y1)], fill=OAK["l"])
    c.poly([(x1, y0), (x1, y1), (x1 - bevel, y1 - bevel), (x1 - bevel, y0 + bevel)], fill=OAK["d"])
    c.poly([(x0, y1), (x1, y1), (x1 - bevel, y1 - bevel), (x0 + bevel, y1 - bevel)], fill=(96, 62, 34, 255))
    # grain: short darker streaks along the rails and the stiles
    for k, (ax, bx) in enumerate(((0.12, 0.34), (0.52, 0.7), (0.78, 0.92))):
        yy = y0 + bevel * (0.45 if k % 2 else 0.7)
        c.line([(x0 + (x1 - x0) * ax, yy), (x0 + (x1 - x0) * bx, yy)], (170, 122, 70, 255), 0.35)
        yy = y1 - bevel * (0.5 if k % 2 else 0.75)
        c.line([(x0 + (x1 - x0) * ax, yy), (x0 + (x1 - x0) * bx, yy)], (82, 52, 28, 255), 0.35)
    for (xx, col) in ((x0 + bevel * 0.55, (160, 112, 64, 255)), (x1 - bevel * 0.55, (84, 54, 30, 255))):
        c.line([(xx, y0 + (y1 - y0) * 0.25), (xx, y0 + (y1 - y0) * 0.6)], col, 0.35)
    c.line([(x0 - 0.2, y0 - 0.2), (x1 - 0.4, y0 - 0.2)], (226, 184, 122, 255), 0.4)       # the lit outer edge
    c.rect(x0 + bevel, y0 + bevel, x1 - bevel, y1 - bevel, fill=LINE)
    c.rect(x0 + bevel + 0.6, y0 + bevel + 0.6, x1 - bevel - 0.6, y1 - bevel - 0.6, fill=(214, 196, 158, 255))
    c.rect(x0 + bevel + 1.2, y0 + bevel + 1.2, x1 - bevel - 1.0, y1 - bevel - 1.0, fill=PAPER)
    return (x0 + bevel + 0.6, y0 + bevel + 0.6, x1 - bevel - 0.6, y1 - bevel - 0.6)

def leg(c, top, bottom, w, colour, light, dark):
    """a squared leg: the outline, the wood, a lit left edge and a shaded right edge, a dark cap at the foot"""
    (tx, ty), (bx, by) = top, bottom
    c.poly([(tx - w / 2 - 0.6, ty), (tx + w / 2 + 0.6, ty), (bx + w / 2 + 0.6, by + 0.6), (bx - w / 2 - 0.6, by + 0.6)], fill=LINE)
    c.poly([(tx - w / 2, ty), (tx + w / 2, ty), (bx + w / 2, by), (bx - w / 2, by)], fill=colour)
    e = min(1.2, w * 0.3)
    c.poly([(tx - w / 2, ty), (tx - w / 2 + e, ty), (bx - w / 2 + e, by), (bx - w / 2, by)], fill=light)
    c.poly([(tx + w / 2 - e, ty), (tx + w / 2, ty), (bx + w / 2, by), (bx + w / 2 - e, by)], fill=dark)
    c.poly([(bx - w / 2 - 0.2, by - 1.6), (bx + w / 2 + 0.2, by - 1.6), (bx + w / 2 + 0.2, by), (bx - w / 2 - 0.2, by)], fill=WOOD["d2"])

def scroll(c, x, y, w):
    """a rolled paper lying on the ledge"""
    c.rrect(x - 0.5, y - 0.5, x + w + 0.5, y + 3.4, 1.6, fill=LINE)
    c.rrect(x, y, x + w, y + 2.9, 1.3, fill=(226, 210, 172, 255))
    c.line([(x + 0.8, y + 0.7), (x + w - 1.2, y + 0.7)], (246, 236, 208, 255), 0.5)
    c.ellipse(x + w - 2.4, y + 0.2, x + w - 0.2, y + 2.7, fill=(196, 176, 134, 255))
    c.rect(x + w * 0.45, y - 0.2, x + w * 0.45 + 0.9, y + 3.1, fill=(150, 44, 30, 255))      # the ribbon round it

def easel(fw, fh, frame, sign_text, font, plan_i):
    """one easel frame: frame = (x0, y0, x1, y1) of the picture frame; the sign sits on its top rail, the legs below"""
    c = Canvas4(fw, fh)
    x0, y0, x1, y1 = frame
    cx = (x0 + x1) / 2
    foot = fh - 2.5
    big = fw > 60
    lw = 4.4 if big else 3.4
    # the back leg (behind, darker), the two front legs splayed a little
    leg(c, (cx, y0 + 4), (cx, foot - 5), lw - 1.0, WOOD["d2"], WOOD["d1"], WOOD["d2"])
    leg(c, (x0 + 7, y1 - 2), (x0 + 3.5, foot), lw, WOOD["m"], WOOD["hl"], WOOD["d1"])
    leg(c, (x1 - 7, y1 - 2), (x1 - 3.5, foot), lw, WOOD["m"], WOOD["l"], WOOD["d1"])
    # the ledge the picture stands on (a lip in front), a rolled paper on it
    c.rect(x0 - 2.5, y1 - 0.5, x1 + 2.5, y1 + 3.8, fill=LINE)
    c.rect(x0 - 1.8, y1, x1 + 1.8, y1 + 3.1, fill=WOOD["m"])
    c.rect(x0 - 1.8, y1, x1 + 1.8, y1 + 0.9, fill=WOOD["hl"])
    c.rect(x0 - 1.8, y1 + 2.3, x1 + 1.8, y1 + 3.1, fill=WOOD["d1"])
    inner = framed_parchment(c, x0, y0, x1, y1, bevel=3 if big else 2.2)
    if big: scroll(c, x1 - 17, y1 - 3.2, 12)
    img = c.done(t=90)
    # the sign on the top rail: red board, gold letters with their dark shadow, two gold nails
    tw = pixfont.width(sign_text, font)
    th = 7 if font == "5x7" else 5
    sw, sh = tw + 8, th + 5
    sx, sy = int(round(cx - sw / 2)), int(round(y0 - sh + 2))
    px = img.load()
    for yy in range(sy, sy + sh):
        for xx in range(sx, sx + sw):
            edge = xx in (sx, sx + sw - 1) or yy in (sy, sy + sh - 1)
            px[xx, yy] = LINE if edge else (RED_L if yy == sy + 1 else RED_D if yy == sy + sh - 2 else RED)
    pixfont.draw(img, sx + 4, sy + 3 if font == "5x7" else sy + 2, sign_text, GOLD, font, shadow=RED_D)
    for nx in (sx + 2, sx + sw - 3):
        px[nx, sy + sh // 2] = GOLD
        px[nx, sy + sh // 2 + 1] = GOLD_D
    # the plan in the frame: soaked into the parchment (multiply)
    ix0, iy0, ix1, iy1 = [int(round(v)) for v in inner]
    iw, ih = ix1 - ix0 - 4, iy1 - iy0 - 4
    mini = miniature(plan_i, iw, ih)
    mx, my = ix0 + (ix1 - ix0 - mini.width) // 2 + 1, iy0 + (iy1 - iy0 - mini.height) // 2 + 1
    arr = np.asarray(img, np.float32)
    m = np.asarray(mini, np.float32) / 255.0
    region = arr[my:my + mini.height, mx:mx + mini.width, :3]
    arr[my:my + mini.height, mx:mx + mini.width, :3] = region * (0.3 + 0.7 * m)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    return drop_shadow(img, dx=3, dy=2, alpha=0.36, blur=1.0)

def sheet(frame_img, fw, fh, dirs):
    """a !$ sheet (3 patterns x 4 directions): dirs = {direction: picture}, every pattern the same"""
    out = Image.new("RGBA", (fw * 3, fh * 4), (0, 0, 0, 0))
    for d in (2, 4, 6, 8):
        pic = dirs.get(d, dirs[2])
        for p in range(3):
            out.alpha_composite(pic, (p * fw, (d // 2 - 1) * fh))
    return out

def main():
    big = easel(96, 96, (13, 17, 83, 67), "PLAN KARCZMY", "5x7", 0)
    sheet(big, 96, 96, {2: big}).save(os.path.join(OUT, "!$Tavern_Plan.png"))
    s1 = easel(48, 96, (6, 34, 42, 66), "PLAN", "5x7", 1)
    s2 = easel(48, 96, (6, 34, 42, 66), "PLAN", "5x7", 2)
    sheet(s1, 48, 96, {2: s1, 4: s2, 6: s1, 8: s2}).save(os.path.join(OUT, "!$Tavern_Plan_Small.png"))
    # a look at both, 4x on the vestibule's wall colour
    prev = Image.new("RGBA", (96 + 48 * 2 + 40, 110), (112, 86, 60, 255))
    prev.alpha_composite(big, (6, 6)); prev.alpha_composite(s1, (120, 6)); prev.alpha_composite(s2, (176, 6))
    prev.resize((prev.width * 4, prev.height * 4), Image.NEAREST).save(os.path.join(HERE, "board_preview.png"))
    print("img/characters/!$Tavern_Plan.png, !$Tavern_Plan_Small.png; preview tools/tavern/plan/board_preview.png")

if __name__ == "__main__":
    main()
