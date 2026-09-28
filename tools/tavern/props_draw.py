# The small props drawn in code (props_art.py puts them into the sheets). Every function returns a frame: 48x96 (the
# event's cell is the lower 48x48; things on a table top are centred round y 70) or 96x96 for two-cell wall pieces.
# Drawn with artlib.Canvas4 (4x larger, reduced: soft edges like Winlu), a dark brown outline and Winlu's colours.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artlib import *
import pixfont

OUT_C = (43, 29, 20, 255)
WOOD = [(62, 40, 28, 255), (88, 58, 38, 255), (116, 78, 50, 255), (148, 104, 68, 255), (178, 134, 92, 255)]
IRON = [(40, 40, 46, 255), (70, 72, 80, 255), (104, 108, 118, 255), (150, 156, 166, 255)]
BRASS = [(110, 74, 26, 255), (170, 124, 48, 255), (214, 170, 78, 255), (246, 214, 132, 255)]
LEATHER = [(70, 40, 26, 255), (104, 64, 38, 255), (138, 90, 54, 255), (170, 118, 74, 255)]
CREAM = (236, 226, 204, 255)
CHALK = (226, 228, 218, 255)

def frame(w=48, h=96):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))

def place(fr, img, cx, cy):
    """paste img centred on (cx, cy)"""
    fr.alpha_composite(img, (int(round(cx - img.size[0] / 2)), int(round(cy - img.size[1] / 2))))
    return fr

def with_shadow(img, dx=2, dy=1, alpha=0.35, blur=0.8):
    pad = 4
    big = Image.new("RGBA", (img.size[0] + pad * 2, img.size[1] + pad * 2), (0, 0, 0, 0))
    big.alpha_composite(img, (pad, pad))
    return drop_shadow(big, dx=dx, dy=dy, alpha=alpha, blur=blur)

# -------------------------------------------------------------------------------------------- gaming room
def die(c, x, y, s=5, pips=3, tilt=False):
    """a die seen from above and a little from the front: top face + a darker front strip"""
    c.rrect(x, y, x + s, y + s, 1, fill=(244, 240, 228, 255), outline=OUT_C, width=0.6)
    c.rect(x + 0.4, y + s - 1.2, x + s - 0.4, y + s - 0.4, fill=(196, 188, 170, 255))
    dots = {1: [(0.5, 0.45)], 2: [(0.28, 0.25), (0.72, 0.62)], 3: [(0.25, 0.22), (0.5, 0.45), (0.75, 0.66)],
            4: [(0.28, 0.25), (0.72, 0.25), (0.28, 0.62), (0.72, 0.62)], 5: [(0.25, 0.22), (0.75, 0.22), (0.5, 0.44), (0.25, 0.66), (0.75, 0.66)],
            6: [(0.28, 0.2), (0.72, 0.2), (0.28, 0.44), (0.72, 0.44), (0.28, 0.68), (0.72, 0.68)]}[pips]
    for (u, v) in dots:
        r = 0.55
        c.ellipse(x + u * s - r, y + v * s - r, x + u * s + r, y + v * s + r, fill=(30, 24, 22, 255))

def dice_cup():
    c = Canvas4(34, 22)
    # the leather cup, standing (open top: dark ellipse), a stitched band
    c.rrect(2, 5, 13, 19, 2, fill=LEATHER[1], outline=OUT_C, width=0.8)
    c.rect(3, 6, 5, 18, fill=LEATHER[2]); c.rect(3.5, 6.5, 4.2, 17, fill=LEATHER[3])
    c.rect(10.5, 6, 12.5, 18, fill=LEATHER[0])
    c.ellipse(2, 2.5, 13, 8, fill=LEATHER[2], outline=OUT_C, width=0.8)
    c.ellipse(3.5, 3.6, 11.5, 7, fill=(40, 24, 16, 255))
    c.line([(2.5, 14), (12.5, 14)], LEATHER[3], 0.7)
    for i in range(4): c.line([(3.5 + i * 2.5, 13.2), (4.4 + i * 2.5, 14.8)], LEATHER[0], 0.4)
    die(c, 16, 11, 6, 5); die(c, 24, 13, 6, 3); die(c, 20, 3, 5.5, 6)
    return c.done(t=70)

def card(c, x, y, w, h, ang, suit):
    cx, cy = x + w / 2, y + h / 2
    ca, sa = math.cos(ang), math.sin(ang)
    pts = [(cx + (px - cx) * ca - (py - cy) * sa, cy + (px - cx) * sa + (py - cy) * ca) for (px, py) in ((x, y), (x + w, y), (x + w, y + h), (x, y + h))]
    c.poly(pts, fill=(246, 242, 232, 255), outline=OUT_C)
    col = (176, 34, 30, 255) if suit in "hd" else (34, 30, 30, 255)
    sx, sy = cx + (-w * 0.18) * ca - (-h * 0.2) * sa, cy + (-w * 0.18) * sa + (-h * 0.2) * ca
    c.ellipse(sx - 0.9, sy - 0.9, sx + 0.9, sy + 0.9, fill=col)
    sx, sy = cx + (w * 0.18) * ca - (h * 0.22) * sa, cy + (w * 0.18) * sa + (h * 0.22) * ca
    c.ellipse(sx - 0.7, sy - 0.7, sx + 0.7, sy + 0.7, fill=col)

def cards():
    c = Canvas4(34, 24)
    # a deck (back pattern red) and a fan of five cards
    c.rrect(2, 6, 11, 19, 1, fill=(150, 40, 36, 255), outline=OUT_C, width=0.7)
    c.rect(3.2, 7.2, 9.8, 17.8, fill=(176, 58, 50, 255)); c.line([(3.5, 7.5), (9.5, 17.5)], (206, 150, 90, 255), 0.5); c.line([(9.5, 7.5), (3.5, 17.5)], (206, 150, 90, 255), 0.5)
    c.rect(2.5, 18.5, 11, 20, fill=(210, 204, 190, 255))
    for i, (a, s) in enumerate(((-0.55, "s"), (-0.25, "h"), (0.05, "c"), (0.35, "d"), (0.62, "h"))):
        card(c, 17 + i * 1.2, 5, 8, 12, a, s)
    return c.done(t=70)

def coin_stack(c, x, y, n):
    for i in range(n):
        yy = y - i * 1.3
        c.ellipse(x, yy, x + 6, yy + 3, fill=BRASS[1], outline=BRASS[0], width=0.5)
        c.ellipse(x + 0.8, yy + 0.3, x + 5.2, yy + 1.9, fill=BRASS[2])
    c.ellipse(x + 1.5, y - (n - 1) * 1.3 + 0.5, x + 3, y - (n - 1) * 1.3 + 1.3, fill=BRASS[3])

def coins():
    c = Canvas4(26, 18)
    coin_stack(c, 3, 11, 4); coin_stack(c, 11, 13, 2); coin_stack(c, 15, 9, 5)
    c.ellipse(9, 4, 13.5, 6.4, fill=BRASS[2], outline=BRASS[0], width=0.5)
    return c.done(t=70)

def checkers():
    c = Canvas4(30, 26)
    c.rrect(2, 2, 27, 23, 1.2, fill=WOOD[1], outline=OUT_C, width=0.8)
    x0, y0, s = 4, 4, 2.5
    for i in range(8):
        for j in range(8):
            col = (220, 196, 150, 255) if (i + j) % 2 == 0 else (92, 58, 38, 255)
            c.rect(x0 + i * s, y0 + j * s, x0 + (i + 1) * s - 0.01, y0 + (j + 1) * s - 0.01, fill=col)
    for (i, j, k) in ((1, 0, 0), (3, 0, 0), (5, 0, 0), (0, 1, 0), (2, 1, 0), (6, 1, 0), (4, 3, 0), (1, 6, 1), (3, 6, 1), (5, 6, 1), (7, 6, 1), (2, 7, 1), (4, 7, 1), (5, 4, 1)):
        px, py = x0 + i * s + s / 2, y0 + j * s + s / 2
        fill = (232, 226, 214, 255) if k == 0 else (60, 36, 30, 255)
        c.ellipse(px - 1.05, py - 0.9, px + 1.05, py + 0.9, fill=fill, outline=OUT_C, width=0.3)
    c.rect(3, 22, 27, 23.5, fill=WOOD[0])
    return c.done(t=70)

def dartboard():
    """a round log-slice board with painted rings and three darts; hung on a wall (drawn in the upper cell)"""
    c = Canvas4(30, 30)
    c.ellipse(1, 1, 29, 29, fill=(58, 40, 28, 255), outline=OUT_C, width=0.8)
    rings = [(12.6, (224, 206, 162, 255)), (11.2, (34, 30, 28, 255)), (9.6, (224, 206, 162, 255)), (8.2, (172, 38, 34, 255)),
             (6.8, (224, 206, 162, 255)), (5.2, (34, 30, 28, 255)), (3.6, (58, 128, 70, 255)), (1.8, (184, 40, 34, 255))]
    for r, col in rings: c.ellipse(15 - r, 15 - r, 15 + r, 15 + r, fill=col)
    for a in range(0, 360, 36):
        ra = math.radians(a)
        c.line([(15 + 2 * math.cos(ra), 15 + 2 * math.sin(ra)), (15 + 12.4 * math.cos(ra), 15 + 12.4 * math.sin(ra))], (120, 104, 84, 180), 0.35)
    for (x, y, dx, dy) in ((11, 12, 5, -4), (18, 16, 6, -3), (14, 19, 4, -5)):
        c.line([(x, y), (x + dx, y + dy)], (70, 60, 52, 255), 0.7)
        c.poly([(x + dx, y + dy), (x + dx + 2.2, y + dy - 1.6), (x + dx + 1.2, y + dy + 0.8)], fill=(186, 50, 40, 255))
    return c.done(t=60)

def tally_board():
    """the chalk tally board of the dice players: a slate in a wooden frame, names and tally marks (96x96, wall)"""
    w, h = 78, 38
    c = Canvas4(w, h)
    c.rrect(0.5, 0.5, w - 0.5, h - 0.5, 1.5, fill=WOOD[2], outline=OUT_C, width=0.9)
    c.rect(2.5, 2.5, w - 2.5, h - 2.5, fill=WOOD[1])
    c.rect(3.5, 3.5, w - 3.5, h - 3.5, fill=(44, 52, 50, 255))
    c.line([(1.5, 1.8), (w - 2, 1.8)], WOOD[4], 0.6)
    img = c.done(t=0)
    # smudges of old chalk on the slate
    a = np.array(img).astype(np.int32)
    rnd = np.random.RandomState(3)
    for _ in range(40):
        x, y = rnd.randint(6, w - 6), rnd.randint(6, h - 6)
        a[y, x, :3] = np.clip(a[y, x, :3] + 14, 0, 255)
    img = Image.fromarray(a.astype(np.uint8), "RGBA")
    rows = [("GRUM", 12), ("OZZY", 7), ("BORGAR", 4)]
    for i, (name, n) in enumerate(rows):
        y = 6 + i * 10
        pixfont.draw(img, 7, y, name, CHALK)
        x = 36
        px = img.load()
        for k in range(n):
            g, m = divmod(k, 5)
            if m < 4:
                xx = x + g * 12 + m * 2
                for yy in range(y, y + 6): px[xx, yy] = CHALK
            else:
                for t in range(9):
                    px[x + g * 12 - 1 + t, y + 5 - int(t * 0.62)] = CHALK
    # a stub of chalk and a rag on the ledge
    px = img.load()
    for xx in range(60, 64): px[xx, h - 4] = CHALK
    fr = frame(96, 96)
    fr.alpha_composite(with_shadow(img, 2, 2, 0.4, 0.8), (int((96 - w) / 2) - 4, 38 - 4))
    return fr

# -------------------------------------------------------------------------------------------- the bar
def price_board():
    """CENNIK: a dark board with the prices in cream letters, hung on the wall (96x96)"""
    items = [("PIWO", "3"), ("MIÓD PITNY", "5"), ("WINO", "6"), ("GULASZ", "8"), ("CHLEB", "2"), ("NOCLEG", "15")]
    w, h = 70, 64
    c = Canvas4(w, h)
    c.rrect(0.5, 0.5, w - 0.5, h - 0.5, 2, fill=WOOD[2], outline=OUT_C, width=0.9)
    c.rect(3, 3, w - 3, h - 3, fill=(52, 38, 30, 255))
    c.line([(2, 1.8), (w - 3, 1.8)], WOOD[4], 0.6)
    img = c.done(t=0)
    tw = pixfont.width("CENNIK", "5x7")
    pixfont.draw(img, (w - tw) // 2, 6, "CENNIK", (240, 206, 110, 255), "5x7", shadow=(20, 14, 10, 255))
    y = 17
    for name, price in items:
        pixfont.draw(img, 7, y, name, (232, 222, 196, 255))
        pw = pixfont.width(price)
        pixfont.draw(img, w - 8 - pw, y, price, (240, 206, 110, 255))
        px = img.load()
        x0 = 7 + pixfont.width(name) + 2
        for xx in range(x0, w - 10 - pw, 2): px[xx, y + 4] = (150, 130, 100, 255)
        y += 7
    fr = frame(96, 96)
    fr.alpha_composite(with_shadow(img, 2, 2, 0.4, 0.8), ((96 - w) // 2 - 4, 16))
    return fr

def bell():
    c = Canvas4(16, 14)
    c.ellipse(1, 9, 15, 13, fill=WOOD[2], outline=OUT_C, width=0.7)
    c.ellipse(2.5, 9.4, 13.5, 11.6, fill=WOOD[3])
    c.poly([(4, 10.2), (4.6, 5), (6.5, 2.6), (9.5, 2.6), (11.4, 5), (12, 10.2)], fill=BRASS[1], outline=OUT_C)
    c.ellipse(6.6, 3.6, 8.2, 7.6, fill=BRASS[3])
    c.ellipse(7, 0.6, 9, 2.6, fill=BRASS[2], outline=OUT_C, width=0.4)
    return c.done(t=70)

def cash_box():
    c = Canvas4(22, 18)
    c.rect(2, 7, 20, 16, fill=WOOD[2], outline=OUT_C, width=0.8)
    c.rect(2.8, 7.8, 19.2, 9.2, fill=WOOD[3])
    c.poly([(2, 7), (4, 2), (18, 2), (20, 7)], fill=WOOD[1], outline=OUT_C)          # the open lid leaning back
    c.rect(4.5, 3, 17.5, 6.2, fill=(120, 32, 30, 255))
    c.rect(3.5, 8.5, 18.5, 10.5, fill=(52, 34, 24, 255))                               # inside: coins
    for i in range(6): c.ellipse(4 + i * 2.4, 8.4, 6.4 + i * 2.4, 10.2, fill=BRASS[2 if i % 2 else 1])
    for x in (2, 17.5): c.rect(x, 7, x + 2.5, 16, fill=BRASS[1])
    c.rect(9.5, 11, 12.5, 13.5, fill=BRASS[1], outline=OUT_C, width=0.4)
    return c.done(t=70)

def recoloured_bottle(src, hue, sat=1.0, val=1.0):
    return recolour(src, hue, sat, val)

def bottles(cy=46):
    """three bottles of different colours (Winlu's bottle, recoloured), standing round (24, cy)"""
    b = cell("D", 4, 11)
    bb = b.crop(bbox(b))
    greens = recolour(bb, 70, 1.1, 1.0)
    reds = cell("D", 4, 12); reds = reds.crop(bbox(reds))
    blues = recolour(bb, 170, 0.8, 1.05)
    fr = frame()
    for img, x, dy in ((greens, 16, 0), (reds, 25, -2), (blues, 33, 2)):
        place(fr, img, x, cy + dy)
    return fr

def tankard_rack():
    """a wall rail with pegs and six tankards hanging by their handles (96x96, on a wall face)"""
    mug = cell("D", 3, 13)
    mug = mug.crop(bbox(mug))
    small = premul_resize(mug, (max(1, int(mug.size[0] * 0.78)), max(1, int(mug.size[1] * 0.78))))
    small = harden(small, 100)
    c = Canvas4(84, 12)
    c.rrect(1, 3, 83, 9, 1.2, fill=WOOD[2], outline=OUT_C, width=0.8)
    c.line([(2, 4.2), (82, 4.2)], WOOD[4], 0.6)
    for i in range(6):
        x = 8 + i * 13.6
        c.ellipse(x - 1.2, 5, x + 1.2, 7.4, fill=IRON[2], outline=OUT_C, width=0.4)
    rail = c.done(t=60)
    fr = frame(96, 96)
    fr.alpha_composite(with_shadow(rail, 2, 2, 0.35, 0.8), (2, 26))
    for i in range(6):
        x = 6 + 8 + i * 13.6
        place(fr, with_shadow(small, 1, 1, 0.3, 0.6), x, 42 + (i % 2))
    return fr

def beer_taps():
    """a tap tower of dark wood with four brass taps and a drip tray, for the back counter (96x96)"""
    c = Canvas4(70, 34)
    c.rrect(4, 4, 66, 20, 1.5, fill=WOOD[1], outline=OUT_C, width=0.9)
    c.line([(5, 5.4), (65, 5.4)], WOOD[3], 0.6)
    c.rect(5, 14, 65, 19, fill=WOOD[0])
    for i in range(4):
        x = 14 + i * 14
        c.rect(x - 1.1, -0.5, x + 1.1, 8, fill=(40, 30, 24, 255), outline=OUT_C, width=0.3)         # handle
        c.ellipse(x - 2, -1.5, x + 2, 1.5, fill=[(170, 40, 34, 255), (60, 110, 70, 255), (190, 150, 60, 255), (60, 70, 130, 255)][i])
        c.rect(x - 2.2, 8, x + 2.2, 11, fill=BRASS[1], outline=OUT_C, width=0.4)
        c.rect(x - 0.9, 11, x + 0.9, 16, fill=BRASS[2], outline=OUT_C, width=0.3)
        c.rect(x - 0.4, 11.4, x, 15, fill=BRASS[3])
    c.rrect(6, 23, 64, 28, 1, fill=IRON[1], outline=OUT_C, width=0.7)
    for i in range(12): c.line([(9 + i * 4.6, 24.2), (9 + i * 4.6, 27)], IRON[0], 0.4)
    fr = frame(96, 96)
    fr.alpha_composite(with_shadow(c.done(t=60), 2, 2, 0.35, 0.8), (9, 20))    # the drip tray ends at y ~50: on a counter top
    return fr

# -------------------------------------------------------------------------------------------- stage, vestibule, office
def flute():
    c = Canvas4(24, 10)
    c.line([(2, 7.5), (21, 2.5)], (72, 46, 28, 255), 2.8)
    c.line([(2, 7.5), (21, 2.5)], (150, 104, 62, 255), 1.9)
    c.line([(2.5, 7), (20.5, 2.2)], (186, 138, 86, 255), 0.6)
    for i in range(5):
        x = 7 + i * 2.6; y = 6.1 - (x - 2) * 5 / 19
        c.ellipse(x - 0.5, y - 0.45, x + 0.5, y + 0.45, fill=(40, 26, 18, 255))
    return c.done(t=70)

def key_rack():
    c = Canvas4(28, 20)
    c.rrect(1, 2, 27, 9, 1, fill=WOOD[2], outline=OUT_C, width=0.8)
    c.line([(2, 3.2), (26, 3.2)], WOOD[4], 0.5)
    for i, col in enumerate((BRASS, IRON, BRASS, IRON)):
        x = 5 + i * 6
        c.line([(x, 7), (x, 9.5)], IRON[1], 0.6)
        if i == 3: continue
        c.arc((x - 1.6, 9.2, x + 1.6, 12.4), 0, 360, col[1], 0.8)
        c.line([(x, 12.4), (x, 18)], col[1], 0.9)
        c.line([(x, 16.5), (x + 1.8, 16.5)], col[1], 0.8); c.line([(x, 18), (x + 1.4, 18)], col[1], 0.8)
    return c.done(t=60)

def ledger(cy=46):
    """an open ledger with columns of figures, a quill in an inkwell beside it (on a desk), centred round y cy"""
    c = Canvas4(34, 22)
    c.poly([(2, 6), (16, 4), (16, 19), (2, 20)], fill=(236, 226, 200, 255), outline=OUT_C)
    c.poly([(16, 4), (30, 6), (30, 20), (16, 19)], fill=(228, 216, 188, 255), outline=OUT_C)
    c.rect(1.4, 19.6, 30.6, 21.2, fill=(96, 40, 30, 255))
    for i in range(5):
        y = 7.5 + i * 2.4
        c.line([(4, y), (13.5, y - 0.2)], (120, 104, 90, 255), 0.45)
        c.line([(18.5, y - 0.2), (28, y)], (120, 104, 90, 255), 0.45)
    img = c.done(t=60)
    quill_ink = cell("D", 2, 13)
    qb = quill_ink.crop(bbox(quill_ink))
    ink = qb.crop((qb.size[0] // 2 - 2, 0, qb.size[0], qb.size[1]))
    fr = frame()
    place(fr, with_shadow(img, 1, 1, 0.3, 0.6), 21, cy)
    place(fr, ink, 38, cy - 6)
    return fr

def no_spit_sign():
    w, h = 44, 18
    c = Canvas4(w, h)
    c.rrect(0.5, 0.5, w - 0.5, h - 0.5, 1.5, fill=WOOD[2], outline=OUT_C, width=0.8)
    c.rect(2, 2, w - 2, h - 2, fill=WOOD[3])
    c.line([(3, 2.6), (w - 3, 2.6)], WOOD[4], 0.5)
    img = c.done(t=60)
    ink = (60, 30, 22, 255)
    for i, t in enumerate(("NIE PLUĆ", "NA PODŁOGĘ")):
        pixfont.draw(img, (w - pixfont.width(t)) // 2, 3 + i * 7, t, ink)
    px = img.load()
    px[w // 2, 0] = IRON[1]
    fr = frame()
    fr.alpha_composite(with_shadow(img, 1, 2, 0.35, 0.7), (0, 30))
    return fr

def mouse_hole():
    c = Canvas4(16, 12)
    c.poly([(1, 11.5), (1, 6), (3, 2.2), (8, 0.8), (13, 2.2), (15, 6), (15, 11.5)], fill=(36, 26, 22, 255))
    c.poly([(3, 11.5), (3, 6.5), (5, 3.5), (8, 2.6), (11, 3.5), (13, 6.5), (13, 11.5)], fill=(14, 10, 10, 255))
    c.line([(1.5, 6), (3.2, 2.6), (8, 1.2), (12.8, 2.6)], (120, 92, 70, 255), 0.5)
    c.ellipse(11.5, 9.5, 15.5, 12, fill=(236, 200, 96, 255), outline=OUT_C, width=0.3)
    return c.done(t=60)

def wall_map():
    """a hand-drawn map of the land pinned to the wall (96x96): coast, forest, hills, a river, a red X, a compass"""
    w, h = 64, 44
    rnd = np.random.RandomState(9)
    a = np.zeros((h, w, 4), np.float32); a[:, :, :3] = (222, 202, 160); a[:, :, 3] = 255
    a[:, :, :3] += rnd.normal(0, 5, (h, w, 1))
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy]).astype(np.float32)
    a[:, :, :3] *= (0.86 + 0.14 * np.clip(edge / 5, 0, 1))[:, :, None]
    base = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
    c = Canvas4(w, h)
    ink = (92, 70, 50, 255)
    sea = (150, 176, 180, 255)
    c.poly([(w, 0), (w, h), (44, h), (40, 34), (46, 24), (42, 14), (48, 6), (46, 0)], fill=sea)
    c.line([(46, 0), (48, 6), (42, 14), (46, 24), (40, 34), (44, h)], ink, 0.6)
    c.line([(6, 8), (14, 14), (18, 24), (28, 28), (40, 32)], (90, 130, 160, 255), 0.8)
    for (x, y) in ((8, 26), (11, 29), (14, 26), (9, 33), (13, 33), (17, 31), (20, 36), (6, 36)):
        c.ellipse(x - 1.6, y - 1.6, x + 1.6, y + 1.6, fill=(96, 128, 76, 255))
    for (x, y) in ((24, 10), (29, 8), (34, 11)):
        c.poly([(x - 3, y + 3), (x, y - 2), (x + 3, y + 3)], fill=(150, 130, 100, 255), outline=ink)
    c.line([(30, 20), (33, 23)], (180, 40, 34, 255), 0.9); c.line([(33, 20), (30, 23)], (180, 40, 34, 255), 0.9)
    c.arc((52, 34, 60, 42), 0, 360, ink, 0.5)
    c.line([(56, 33), (56, 43)], ink, 0.5); c.line([(51, 38), (61, 38)], ink, 0.5)
    ov = c.done(t=0)
    base.alpha_composite(ov)
    img = outline(harden(base, 10), (92, 72, 50, 255))
    px = img.load()
    for (x, y) in ((2, 2), (w - 3, 2)):
        px[x, y] = IRON[1]; px[x + 1, y] = IRON[3]
    fr = frame(96, 96)
    fr.alpha_composite(with_shadow(img, 2, 2, 0.35, 0.8), ((96 - w) // 2 - 4, 22))
    return fr

def crossed_spears():
    """two hunting spears crossed behind a round wooden shield (Winlu's shield), on the wall (96x96)"""
    c = Canvas4(80, 70)
    for (x0, y0, x1, y1) in ((10, 64, 70, 6), (70, 64, 10, 6)):
        c.line([(x0, y0), (x1, y1)], OUT_C, 3.2)
        c.line([(x0, y0), (x1, y1)], WOOD[2], 2.0)
        dx, dy = (x1 - x0), (y1 - y0); L = math.hypot(dx, dy); ux, uy = dx / L, dy / L
        tip = (x1 + ux * 9, y1 + uy * 9); side = (-uy, ux)
        base1 = (x1 + side[0] * 3, y1 + side[1] * 3); base2 = (x1 - side[0] * 3, y1 - side[1] * 3)
        c.poly([base1, tip, base2], fill=IRON[2], outline=OUT_C)
        c.line([(x1, y1), (x1 + ux * 7, y1 + uy * 7)], IRON[3], 0.6)
        c.line([(x1 - ux * 3 + side[0] * 1.8, y1 - uy * 3 + side[1] * 1.8), (x1 - ux * 3 - side[0] * 1.8, y1 - uy * 3 - side[1] * 1.8)], LEATHER[1], 1.4)
    img = c.done(t=60)
    shield = cell("D", 0, 0)
    shield = shield.crop(bbox(shield))
    fr = frame(96, 96)
    fr.alpha_composite(with_shadow(img, 2, 2, 0.35, 0.8), (4, 8))
    place(fr, shield, 48, 46)
    return fr

def music_stand():
    """a wooden music stand on three legs with an open sheet of music (48x96, stands on the floor)"""
    c = Canvas4(30, 58)
    c.line([(15, 26), (15, 52)], OUT_C, 2.4); c.line([(15, 26), (15, 52)], WOOD[2], 1.4)
    for (x1, y1) in ((7, 56), (23, 56), (15, 57.5)):
        c.line([(15, 50), (x1, y1)], OUT_C, 2.2); c.line([(15, 50), (x1, y1)], WOOD[2], 1.2)
    c.poly([(3, 4), (27, 4), (29, 25), (1, 25)], fill=WOOD[1], outline=OUT_C)
    c.poly([(4.5, 5.5), (25.5, 5.5), (27, 22), (3, 22)], fill=WOOD[2])
    c.rect(1, 24, 29, 27, fill=WOOD[3], outline=OUT_C, width=0.6)
    c.poly([(6, 7), (15, 8), (15, 23), (5, 22)], fill=(238, 228, 204, 255), outline=(120, 100, 80, 255))
    c.poly([(15, 8), (24, 7), (25, 22), (15, 23)], fill=(230, 218, 192, 255), outline=(120, 100, 80, 255))
    ink = (70, 60, 52, 255)
    for i in range(4):
        y = 10.5 + i * 3.2
        c.line([(7, y), (14, y + 0.2)], (150, 136, 118, 255), 0.35); c.line([(16, y + 0.2), (23.5, y)], (150, 136, 118, 255), 0.35)
        for k, x in enumerate((8.5, 11, 13, 17.5, 20, 22.5)):
            if (i + k) % 2 == 0: c.ellipse(x - 0.6, y - 0.8 + (k % 3) * 0.5, x + 0.6, y + 0.2 + (k % 3) * 0.5, fill=ink)
    img = c.done(t=60)
    fr = frame()
    fr.alpha_composite(drop_shadow(img, 3, 2, 0.3, 1.0), (9, 96 - 60))
    return fr

def spice_shelf():
    """Winlu's empty wall shelf (D 7,0..1) with a row of small spice jars and a mortar"""
    base = cell("D", 7, 0, 1, 2).copy()
    c = Canvas4(48, 96)
    cols = [(150, 60, 40, 255), (200, 160, 60, 255), (90, 120, 60, 255), (170, 110, 60, 255), (120, 60, 70, 255)]
    for i in range(5):
        x = 6 + i * 7.4
        c.rrect(x, 36, x + 5, 45.5, 1, fill=(210, 200, 180, 255), outline=OUT_C, width=0.5)
        c.rect(x + 0.8, 40, x + 4.2, 45, fill=cols[i])
        c.rect(x + 0.6, 34.8, x + 4.4, 37, fill=WOOD[1], outline=OUT_C, width=0.4)
    base.alpha_composite(c.done(t=60))
    return base

# -------------------------------------------------------------------------------------------- kitchen, brewery, life
def ladle():
    c = Canvas4(22, 26)
    c.line([(18, 2), (8, 17)], OUT_C, 2.4); c.line([(18, 2), (8, 17)], WOOD[3], 1.4)
    c.ellipse(2, 15, 12, 22, fill=WOOD[2], outline=OUT_C, width=0.7)
    c.ellipse(3.5, 16, 10.5, 19.6, fill=WOOD[0])
    return c.done(t=70)

def hop_cone(c, x, y):
    c.ellipse(x, y, x + 4, y + 5.4, fill=(112, 150, 70, 255), outline=(52, 70, 34, 255), width=0.4)
    c.line([(x + 1, y + 2), (x + 3, y + 2)], (150, 184, 96, 255), 0.4)
    c.line([(x + 1, y + 3.6), (x + 3, y + 3.6)], (150, 184, 96, 255), 0.4)

def sacks(kind="hops"):
    """two sacks from Winlu's sacks (D 8..9, 2..3), tinted: green-grey hop sacks with cones on top, or pale malt sacks
    with spilled grain (96x96 frame, two cells wide, standing on the lower row)"""
    src = cell("D", 8, 2, 2, 2)
    src = src.crop(bbox(src))
    s = recolour(src, 40, 0.8, 0.98) if kind == "hops" else recolour(src, 6, 0.6, 1.12)
    w, h = s.size
    pad = 8
    img = Image.new("RGBA", (w + pad * 2, h + pad), (0, 0, 0, 0))
    img.alpha_composite(s, (pad, 0))
    c = Canvas4(w + pad * 2, h + pad)
    if kind == "hops":        # hop cones spilling from the open sack mouths and a few on the floor
        for (x, y) in ((12, 6), (16, 9), (20, 5), (46, 12), (51, 9), (55, 13), (w + pad - 6, h - 3), (w + pad - 1, h - 1)):
            hop_cone(c, x, y)
    else:                     # malt grains spilled in front
        rnd = np.random.RandomState(4)
        for _ in range(34):
            x, y = w * 0.35 + rnd.rand() * w * 0.45, h - 4 + rnd.rand() * 6
            c.ellipse(x, y, x + 1.6, y + 1.1, fill=(222, 188, 120, 255), outline=(150, 112, 60, 255), width=0.25)
    img.alpha_composite(c.done(t=70))
    fr = frame(96, 96)
    fr.alpha_composite(drop_shadow(img, 3, 2, 0.3, 1.0), ((96 - img.size[0]) // 2, 93 - img.size[1]))
    return fr

def candle_frames(base=90):
    """a thick candle with wax drips on an iron dish: three frames of a flickering flame (48x96 each); `base` = the
    dish's lowest pixel row"""
    out = []
    for k, (fh, fx) in enumerate(((5.6, 0.0), (6.4, 0.4), (5.0, -0.3))):
        out.append(_candle(fh, fx))
    shift = base - 90
    return [f.transform(f.size, Image.AFFINE, (1, 0, 0, 0, 1, -shift)) for f in out]

def _candle(fh, fx):
    if True:
        fr = frame()
        c = Canvas4(48, 96)
        c.ellipse(16, 84, 32, 90, fill=IRON[1], outline=OUT_C, width=0.7)
        c.ellipse(17.5, 84.6, 30.5, 88, fill=IRON[2])
        c.rect(20, 66, 28, 86, fill=(232, 222, 196, 255), outline=OUT_C, width=0.6)
        c.rect(26, 67, 27.6, 85.4, fill=(206, 194, 166, 255))
        for (x, y0, y1) in ((20.6, 67, 74), (23.5, 67, 71), (26.4, 67, 77)):
            c.line([(x, y0), (x, y1)], (246, 240, 224, 255), 1.2)
            c.ellipse(x - 0.9, y1 - 0.9, x + 0.9, y1 + 0.9, fill=(246, 240, 224, 255))
        c.ellipse(19.5, 64.6, 28.5, 68, fill=(244, 236, 214, 255), outline=OUT_C, width=0.5)
        c.line([(24, 66), (24, 63.5)], (40, 30, 26, 255), 0.6)
        fr2 = c.done(t=70)
        glow = Canvas4(48, 96)
        glow.ellipse(24 + fx - 7, 60 - fh - 3, 24 + fx + 7, 60 + 5, fill=(255, 190, 90, 60))
        g = glow.done(t=0).filter(ImageFilter.GaussianBlur(2))
        fl = Canvas4(48, 96)
        fl.poly([(24 + fx - 1.6, 63.5), (24 + fx - 1.2, 60.5), (24 + fx * 1.6, 63.5 - fh), (24 + fx + 1.2, 60.5), (24 + fx + 1.6, 63.5)], fill=(255, 170, 60, 255))
        fl.poly([(24 + fx - 0.8, 63.4), (24 + fx * 1.4, 63.4 - fh * 0.6), (24 + fx + 0.8, 63.4)], fill=(255, 238, 150, 255))
        fr.alpha_composite(g); fr.alpha_composite(fr2); fr.alpha_composite(fl.done(t=40))
        return fr
