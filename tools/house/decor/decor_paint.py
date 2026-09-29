# The decorations painted by hand for HomeDecor (used by make_decor.py): the wycinanki łowickie, the embroidered towel over the
# Holy Mother's picture, the rag rug (chodnik) and grandpa's table dressed for Christmas Eve. Colours from the cottage (Winlu
# linen, wood outline), the paper colours of real Łowicz cut-outs.
import math
import numpy as np
from PIL import Image
from artlib import Canvas4

LINEN, LINEN_L, LINEN_D, LINEN_DD = (232, 227, 212), (246, 242, 231), (199, 191, 174), (163, 152, 136)
CLOTH_EDGE = (104, 90, 80)
RED, RED_D = (172, 40, 38), (116, 26, 26)
STRAW, STRAW_D = (220, 180, 88), (164, 122, 50)

# ------------------------------------------------------------------------------------------------ wycinanki łowickie
PAPER = {"k": (34, 30, 36, 255), "g": (52, 128, 72, 255), "G": (34, 92, 54, 255), "r": (200, 44, 46, 255), "y": (240, 196, 58, 255),
         "b": (62, 96, 184, 255), "v": (132, 66, 156, 255), "p": (232, 118, 156, 255), "o": (234, 132, 48, 255)}

def symmetric(im):
    """the left half mirrored onto the right (a paper cut folded in two is exactly symmetric)"""
    a = np.array(im)
    W = a.shape[1]
    h = W // 2
    a[:, W - h:] = a[:, :h][:, ::-1]
    return Image.fromarray(a, "RGBA")

def gwiazda():
    """a round Łowicz star (gwiazda): a black cut base with 16 points, green leaves, red petals with a yellow stripe, a blue
    ring, a pink flower in the middle (layers of coloured paper glued one on another)"""
    S = 25
    c = Canvas4(S, S, k=8)
    m = S / 2.0
    def star(n, r_out, r_in, rot, fill):
        pts = []
        for i in range(n * 2):
            a = rot + math.pi * i / n
            r = r_out if i % 2 == 0 else r_in
            pts.append((m + r * math.sin(a), m - r * math.cos(a)))
        c.poly(pts, fill=fill)
    def petals(n, r0, r1, wdt, rot, fill):
        for i in range(n):
            a = rot + 2 * math.pi * i / n
            fwd, back = [], []
            for t in range(0, 11):
                u = t / 10.0
                r = r0 + (r1 - r0) * u
                off = wdt * math.sin(math.pi * u)
                fwd.append((m + r * math.sin(a) + off * math.cos(a), m - r * math.cos(a) + off * math.sin(a)))
                back.append((m + r * math.sin(a) - off * math.cos(a), m - r * math.cos(a) - off * math.sin(a)))
            c.poly(fwd + back[::-1], fill=fill)
    star(16, 12.4, 9.8, 0, PAPER["k"])                      # the black base, serrated
    petals(8, 3.5, 11.2, 2.2, math.pi / 8, PAPER["g"])      # green leaves between the petals
    petals(8, 3.0, 10.6, 2.6, 0, PAPER["r"])                # red petals
    petals(8, 5.2, 9.2, 1.0, 0, PAPER["y"])                 # a yellow stripe in each
    c.ellipse(m - 5.8, m - 5.8, m + 5.8, m + 5.8, fill=PAPER["k"])
    c.ellipse(m - 5.0, m - 5.0, m + 5.0, m + 5.0, fill=PAPER["b"])
    petals(6, 0.6, 4.4, 1.6, 0, PAPER["p"])                 # the pink flower
    c.ellipse(m - 1.5, m - 1.5, m + 1.5, m + 1.5, fill=PAPER["y"])
    return symmetric(c.done(t=110))

def leluja():
    """a tall Łowicz cut-out (leluja): a pot, a stem with leaves, two side flowers on curled stems, a big tulip on top; every
    coloured shape lies on a slightly bigger black one"""
    W, H = 19, 27
    c = Canvas4(W, H, k=8)
    m = W / 2.0
    k, g, G, r, y, b, v, p = (PAPER[q] for q in "kgGrybvp")
    def stem(gr, col):
        c.rect(m - 0.9 - gr, 6, m + 0.9 + gr, 21, fill=col or g)
    def pot(gr, col):
        c.poly([(m - 4.2 - gr, 20.4 - gr), (m + 4.2 + gr, 20.4 - gr), (m + 3.2 + gr, 26.3), (m - 3.2 - gr, 26.3)], fill=col or r)
        if not col: c.rect(m - 3.4, 22.2, m + 3.4, 23.2, fill=y)
    def leaves(gr, col):
        c.ellipse(m - 4.6 - gr, 15.0 - gr, m - 0.6 + gr, 19.0 + gr, fill=col or G)
        c.ellipse(m + 0.6 - gr, 15.0 - gr, m + 4.6 + gr, 19.0 + gr, fill=col or G)
    def curls(gr, col):
        for s in (-1, 1):
            c.line([(m, 14.5), (m + s * 3.4, 12.6), (m + s * 5.8, 10.4)], fill=col or g, width=1.1 + gr * 2)
    def sideflowers(gr, col):
        for s in (-1, 1):
            cx, cy = m + s * 6.3, 9.4
            c.ellipse(cx - 2.6 - gr, cy - 2.6 - gr, cx + 2.6 + gr, cy + 2.6 + gr, fill=col or b)
            if not col:
                c.ellipse(cx - 1.4, cy - 1.4, cx + 1.4, cy + 1.4, fill=p)
                c.ellipse(cx - 0.5, cy - 0.5, cx + 0.5, cy + 0.5, fill=y)
    def tulip(gr, col):
        c.poly([(m - 4.6 - gr, 1.6 - gr), (m - 2.2, 4.4 - gr), (m, 0.4 - gr), (m + 2.2, 4.4 - gr), (m + 4.6 + gr, 1.6 - gr),
                (m + 4.2 + gr, 6.6 + gr * 0.5), (m, 8.6 + gr), (m - 4.2 - gr, 6.6 + gr * 0.5)], fill=col or r)
        if not col:
            c.poly([(m - 2.4, 4.8), (m, 2.6), (m + 2.4, 4.8), (m + 2.2, 6.4), (m, 7.4), (m - 2.2, 6.4)], fill=y)
            c.ellipse(m - 0.9, 4.6, m + 0.9, 6.4, fill=v)
    for fn in (stem, curls, leaves, pot, sideflowers, tulip):
        fn(0.9, k)
        fn(0.0, None)
    return symmetric(c.done(t=110))

# ------------------------------------------------------------------------------------------------ cloth
def towel():
    """the embroidered linen towel (ręcznik) over the Holy Mother's picture: a band laid over the frame's top edge, its two ends
    hanging down beside the frame, red cross-stitch and fringes at the ends. On a 48x50 canvas whose (7, 5) is the frame's
    top-left corner (the frame is 34 x 31)"""
    W, H = 48, 50
    a = np.zeros((H, W, 4), np.uint8)
    def put(x, y, col):
        if 0 <= x < W and 0 <= y < H: a[y, x] = tuple(col[:3]) + (255,)
    for x0 in (1, 41):                       # the hanging ends: outline, light, cloth, cloth, shade, outline
        for y in range(4, 44):
            for i in range(6):
                x = x0 + i
                col = CLOTH_EDGE if i in (0, 5) else LINEN_L if i == 1 else LINEN_D if i == 4 else LINEN
                if 0 < i < 5:
                    if y in (35, 42): col = LINEN_D
                    if y in (36, 41): col = RED
                    if y in (37, 40) and i in (1, 3): col = RED
                    if y in (38, 39) and i in (2, 4): col = RED if y == 38 else RED_D
                    if i == 3 and 12 <= y <= 30 and y % 6 < 4: col = LINEN_D           # a soft fold down the middle
                if y == 43: col = CLOTH_EDGE
                put(x, y, col)
        for i in (1, 2, 3, 4):               # the fringe: threads of two lengths
            for y in range(44, 47 if i % 2 else 48):
                put(x0 + i, y, LINEN_D if y < 46 else LINEN_DD)
    for x in range(1, 47):                   # the band over the frame's top, sagging a pixel in the middle
        sag = 1 if 14 <= x <= 33 else 0
        top, bot = 2, 7 + sag
        for y in range(top, bot + 1):
            if y in (top, bot) or x in (1, 46): col = CLOTH_EDGE
            elif y == top + 1: col = LINEN_L
            elif y == bot - 1: col = LINEN_D
            else: col = LINEN
            put(x, y, col)
        if sag and x % 6 == 2: put(x, bot - 2, LINEN_D)                                # soft folds
    for x in (6, 41):                        # where the band turns down over the frame's corners
        put(x, 8, CLOTH_EDGE)
    return Image.fromarray(a, "RGBA")

def chodnik(L=112, Wd=26):
    """a hand-woven rag rug (chodnik): cross stripes of faded rag colours in a mirrored run, each weft row a strip of cloth with
    flecks of the next colours, light from the upper left, a soft dark edge, fringes on the short ends"""
    rnd = np.random.RandomState(5)
    cream, red, blue, ochre, sage, rose = (204, 192, 166), (146, 82, 70), (98, 104, 126), (178, 146, 90), (122, 128, 98), (164, 118, 110)
    half = [(cream, 5), (red, 3), (cream, 2), (blue, 4), (cream, 3), (ochre, 2), (sage, 3), (cream, 4), (rose, 2), (cream, 2),
            (blue, 2), (cream, 5), (red, 4), (cream, 6)]
    run = []
    for col, n in half: run += [col] * n
    body = L - 8
    run = (run + [cream] * body)[:body // 2]
    stripes = run + run[::-1]
    if len(stripes) < body: stripes.insert(len(stripes) // 2, cream)
    pool = [cream, red, blue, ochre, sage, rose]
    a = np.zeros((Wd, L, 4), np.float32)
    x0 = 4
    for i, col in enumerate(stripes):
        x = x0 + i
        for y in range(1, Wd - 1):
            c = np.array(col, np.float32)
            if rnd.rand() < 0.10: c = c * 0.6 + np.array(pool[rnd.randint(len(pool))], np.float32) * 0.4     # a fleck of another rag
            weft = 1.0 + (0.05 if (y // 2) % 2 == 0 else -0.05)
            if (x + (y // 2) * 3) % 5 == 0: weft -= 0.04
            light = 1.05 - 0.12 * ((x - x0) / body * 0.45 + y / Wd * 0.55)
            a[y, x, :3] = c * weft * light + rnd.normal(0, 3, 3)
            a[y, x, 3] = 255
    edge = (88, 72, 62)
    xe = x0 + len(stripes) - 1
    for x in range(x0, xe + 1):
        a[0, x] = edge + (255,); a[Wd - 1, x] = edge + (255,)
        a[1, x, :3] *= 0.9; a[Wd - 2, x, :3] *= 0.84
    for y in range(Wd):
        a[y, x0] = edge + (255,); a[y, xe] = edge + (255,)
    for y in range(2, Wd - 2, 2):                                                 # the fringes
        for k in range(1, 4 if (y // 2) % 2 else 3):
            col = (196, 184, 158) if k < 3 else (150, 136, 112)
            a[y, x0 - k] = col + (255,); a[y, xe + k] = col + (255,)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")

def wigilia_table(plate, top=(96, 456, 287, 503), plate_at=(221, 479)):
    """Christmas Eve on grandpa's table (Winlu table C 9..12,4..5; its top covers map pixels 98..284 x 458..502): a linen cloth
    over the top (light from the upper left, soft creases where it was folded, darker towards the back edge), a red cross-stitch
    hem hanging over the front edge, tufts of straw peeking out from under it at the corners and along the hem, the wafer on its
    plate. -> (picture, left, top) in map pixels"""
    x0, y0, x1, y1 = top
    hang = 9
    W, Ht = x1 - x0 + 1, y1 - y0 + 1
    H = Ht + hang + 6
    rnd = np.random.RandomState(24)
    base = np.array((226, 220, 203), np.float32)
    a = np.zeros((H, W, 4), np.float32)
    creases = [W // 4, W // 2, 3 * W // 4]                                        # where the cloth was folded (lengthwise)
    for y in range(Ht):                                                           # the top
        for x in range(W):
            light = 1.035 - 0.075 * (x / W * 0.5 + y / Ht * 0.5)
            if y < 3: light -= 0.05 * (3 - y) / 3                                 # the far edge a little in shadow
            for cx in creases:
                d = x - cx
                if d == 0: light -= 0.045
                elif d == 1: light += 0.03
            if y == Ht // 2 and x % 2 == 0: light -= 0.02                         # the crosswise fold
            col = base * light + rnd.normal(0, 1.8, 3)
            a[y, x, :3] = col; a[y, x, 3] = 255
    a[0, :, :3] = CLOTH_EDGE; a[1, :, :3] *= 0.97
    for y in range(Ht, Ht + hang):                                                # the hang over the front edge
        k = y - Ht
        for x in range(W):
            fold = 0.92 if (x % 13) in (0, 1) else (0.97 if (x % 13) == 6 else 1.0)
            col = np.array(LINEN_D, np.float32) * fold * (1.0 - 0.01 * k) + rnd.normal(0, 1.6, 3)
            if k == 0: col = base * 0.93
            if k in (3, 7): col = np.array(RED, np.float32) * fold
            if k in (4, 5, 6):                                                    # a row of little red crosses
                m = (x + 1) % 4
                if (k == 5 and m == 1) or (k != 5 and m in (0, 2)): col = np.array(RED_D if k == 5 else RED, np.float32) * fold
            a[y, x, :3] = col; a[y, x, 3] = 255
    a[:Ht + hang, 0, :3] = CLOTH_EDGE; a[:Ht + hang, W - 1, :3] = CLOTH_EDGE
    yb = Ht + hang
    a[yb, :, :3] = CLOTH_EDGE; a[yb, :, 3] = 255
    def strand(x, y, dx, n):
        for k in range(1, n + 1):
            xx, yy = x + int(round(dx * k)), y + k
            if 0 <= xx < W and yy < H:
                a[yy, xx, :3] = STRAW if k < n else STRAW_D; a[yy, xx, 3] = 255
    for cx in (4, W - 5):                                                         # tufts at the front corners
        for dx in (-0.8, -0.3, 0.2, 0.7):
            strand(cx + int(dx * 3), yb, dx, 4 + int(rnd.rand() * 2))
    for x in range(10, W - 10, 9):                                                # and a few along the hem
        if rnd.rand() < 0.7:
            strand(x + int(rnd.randint(0, 5)), yb, rnd.uniform(-0.5, 0.5), int(rnd.randint(2, 4)))
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
    out = Image.new("RGBA", (W + 8, H), (0, 0, 0, 0))
    out.alpha_composite(im, (4, 0))
    po = out.load()
    for y in range(5, Ht, 4):                                                     # straw out of the two short ends
        for side in (0, 1):
            if rnd.rand() < 0.75:
                n = int(rnd.randint(2, 4))
                for k in range(1, n + 1):
                    x = 4 - k if side == 0 else W + 3 + k
                    po[x, y + (1 if k > 2 else 0)] = STRAW + (255,) if k < n else STRAW_D + (255,)
    sh = Image.new("RGBA", plate.size, (40, 34, 40, 60)); sh.putalpha(plate.getchannel("A").point(lambda v: 60 if v else 0))
    px0, py0 = int(round(plate_at[0] - x0 + 4 - plate.width / 2)), int(round(plate_at[1] - y0 - plate.height / 2))
    out.alpha_composite(sh, (px0 + 2, py0 + 1)); out.alpha_composite(plate, (px0, py0))
    return out, x0 - 4, y0

def folk_plate(plate):
    """one of Winlu's pewter plates made a white glazed one with a blue rim (the good plate for Christmas Eve)"""
    a = np.array(plate).astype(np.float32)
    H, W = a.shape[:2]
    op = a[:, :, 3] > 100
    ys, xs = np.nonzero(op)
    cy, cx = (ys.min() + ys.max()) / 2.0, (xs.min() + xs.max()) / 2.0
    R = (xs.max() - xs.min()) / 2.0
    lum = a[:, :, :3].mean(axis=2)
    mean = lum[op & (lum > 70)].mean()
    for y, x in zip(ys, xs):
        l = lum[y, x]
        if l < 70: continue
        r = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
        if r > R - 2.6: a[y, x, :3] = np.array((74, 100, 164), np.float32) * (l / mean)
        else: a[y, x, :3] = np.array((236, 232, 218), np.float32) * min(1.06, l / mean)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
