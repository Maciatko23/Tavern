# Stach w kapeluszu na mapie (2026-11-17, gracz wybrał popiersie „1 kapelusz z piórkiem”): wszystkie arkusze dziadka dostają filcowy
# kapelusz z piórkiem i długie białe włosy do ramion jak na popiersiu - bez przerysowywania ciała.
#   python tools/busts_pl/stach_kapelusz.py <katalog_z_klatkami> [--podglad]
# W katalogu: d0..d7.png (pierwsza klatka każdego z 8 kierunków Npc_Dziadek_Walk8, oryginał) i e0..e7.png (to samo po edycji PixelLab
# edit_image - kapelusz i włosy). Z różnicy e - d powstaje warstwa kierunku: do wiersza 23 wszystko, co się zmieniło (kapelusz, włosy,
# twarz pod rondem); od 24 do 34 tylko jasne włosy (kurtki niżej PixelLab też lekko przemalował - ta zostaje oryginalna). Warstwa
# idzie na każdą klatkę tego kierunku, przesunięta do czubka głowy klatki (chód, ukłony). Oryginały: ..\Tawerna_archiwum_2026-11-08\.
import os
import shutil
import sys
import time

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", ".."))
CH = os.path.join(GAME, "img", "characters")
C = 64
SRC = sys.argv[1]
PREVIEW = "--podglad" in sys.argv
CUT, HAIR_TO = 23, 34


def load(n):
    return Image.open(os.path.join(SRC, n)).convert("RGBA")


def anchor(im, box=None):
    """(centre x of the head's top 5 rows, the top row) of a 64x64 frame"""
    p = im.load()
    top = None
    for y in range(C):
        if any(p[x, y][3] > 0 for x in range(C)):
            top = y
            break
    if top is None:
        return None
    xs = [x for y in range(top, min(C, top + 5)) for x in range(C) if p[x, y][3] > 0]
    return (sum(xs) / len(xs), top)


def hairlike(c):
    r, g, b, a = c
    return a > 0 and 0.299 * r + 0.587 * g + 0.114 * b > 140 and max(r, g, b) - min(r, g, b) < 60


def luma(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def layer(i):
    """the hat (everything changed down to the brim's lower edge) and the long hair that falls outside the face (over the jacket or the
    background) - never the face or the beard: in a step the head sits a little otherwise and a pasted face came out smeared"""
    d, e = load("d%d.png" % i), load("e%d.png" % i)
    pd, pe = d.load(), e.load()
    changed = lambda x, y: (pd[x, y][3] > 0) != (pe[x, y][3] > 0) or (pd[x, y][3] > 0 and sum(abs(pd[x, y][k] - pe[x, y][k]) for k in range(3)) > 40)
    top = anchor(e)[1]
    # the brim: the row of the most dark-brown changed pixels near the top (the hat's widest line)
    def hatpx(x, y):
        c = pe[x, y]
        return c[3] > 0 and changed(x, y) and luma(c) < 110 and c[0] >= c[2]
    rows = [(sum(1 for x in range(C) if hatpx(x, y)), y) for y in range(top, min(C, top + 16))]
    brim = max(rows)[1] + 1
    put, erase = {}, set()
    # (the side views: the long hair hangs behind the head only - in front of the face it was the longer beard of the edit, floating
    # in the air in the frames of a step; the face's side by the direction: 1 SW, 2 W left, 6 E, 7 SE right)
    front = {1: -1, 2: -1, 3: -1, 5: 1, 6: 1, 7: 1}.get(i, 0)
    ax = anchor(d)[0]
    for y in range(0, HAIR_TO + 1):
        for x in range(C):
            if not changed(x, y):
                continue
            b, a = pe[x, y], pd[x, y]
            if y > brim and front and (x - ax) * front > 1:
                continue
            if y <= brim:
                if b[3] > 0:
                    put[(x, y)] = b
                else:
                    erase.add((x, y))
            elif hairlike(b) and (a[3] == 0 or (luma(a) < 120 and a[0] >= a[2] and a[0] - a[2] > 15)):
                put[(x, y)] = b   # (hair over the background or the brown jacket)
    # the hair's own dark outline where it meets the background
    for y in range(brim + 1, HAIR_TO + 1):
        for x in range(C):
            b, a = pe[x, y], pd[x, y]
            if (x, y) in put or b[3] == 0 or a[3] > 0 or luma(b) > 70:
                continue
            if any((x + ex, y + ey) in put for ex, ey in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                put[(x, y)] = b
    return {"put": put, "erase": erase, "anchor": anchor(d), "d": d, "brim": brim}


def shift_of(frame, L):
    """(dx, dy) that lays the direction's original head (its top 14 rows) best over this frame's - pixel by pixel, within 5 px of the
    rough anchors (a centroid is off by one px in a step and left the old cap's peak showing)"""
    a, ad = anchor(frame), L["anchor"]
    if not a:
        return None
    pf, pd = frame.load(), L["d"].load()
    bx, by = round(a[0] - ad[0]), a[1] - ad[1]
    best, bs = (bx, by), -1
    for dy in range(by - 3, by + 4):
        for dx in range(bx - 3, bx + 4):
            s = 0
            for y in range(ad[1], min(C, ad[1] + 14)):
                for x in range(C):
                    c = pd[x, y]
                    if c[3] == 0:
                        continue
                    X, Y = x + dx, y + dy
                    if 0 <= X < C and 0 <= Y < C and pf[X, Y] == c:
                        s += 1
            if s > bs:
                best, bs = (dx, dy), s
    return best


def apply(frame, L):
    sh = shift_of(frame, L)
    if sh is None:
        return frame
    dx, dy = sh
    out = frame.copy()
    po = out.load()
    # the old cap of this frame: brown (and its dark outline) in the head's top 8 rows - whatever of it the hat does not cover goes
    # (in a step the head turns a little and its peak stuck out in front of the brim)
    a = anchor(frame)
    pf = frame.load()
    covered = {(x + dx, y + dy) for (x, y) in L["put"]}
    def brown(c):
        r, g, b, al = c
        return al > 0 and r >= g >= b and r - b > 25 and 0.299 * r + 0.587 * g + 0.114 * b < 150
    cap = set()
    for Y in range(a[1], min(C, a[1] + 8)):
        for X in range(C):
            if brown(pf[X, Y]):
                cap.add((X, Y))
    for Y in range(a[1], min(C, a[1] + 8)):
        for X in range(C):
            c = pf[X, Y]
            if c[3] > 0 and max(c[:3]) < 50 and any((X + ex, Y + ey) in cap for ex, ey in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                cap.add((X, Y))
    for (X, Y) in cap:
        if (X, Y) not in covered:
            po[X, Y] = (0, 0, 0, 0)
    for (x, y) in L["erase"]:
        X, Y = x + dx, y + dy
        if 0 <= X < C and 0 <= Y < C:
            po[X, Y] = (0, 0, 0, 0)
    for (x, y), c in L["put"].items():
        X, Y = x + dx, y + dy
        if 0 <= X < C and 0 <= Y < C:
            po[X, Y] = c
    # the old cap round the new hat: lone pixels left by it (no opaque neighbour) and its peak sticking out of the brim's line - cap
    # coloured pixels at the hat's rows that the hat does not cover and that touch no face/hair pixel of the layer
    top = min(y for (x, y) in L["put"]) + dy if L["put"] else 0
    for _ in range(2):
        for Y in range(max(0, top - 2), min(C, top + 14)):
            for X in range(C):
                if po[X, Y][3] == 0:
                    continue
                n = sum(1 for ex, ey in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= X + ex < C and 0 <= Y + ey < C and po[X + ex, Y + ey][3] > 0)
                if n == 0:
                    po[X, Y] = (0, 0, 0, 0)
    return out


def head_dir(frame, layers):
    """the direction whose original head (the top 20 rows, aligned) is most like this frame's"""
    a = anchor(frame)
    if not a:
        return 0
    pf = frame.load()
    best, bs = 0, 1e9
    for i in range(8):
        d = load("d%d.png" % i)
        ad = anchor(d)
        dx, dy = round(a[0] - ad[0]), a[1] - ad[1]
        pd = d.load()
        s = 0
        for y in range(ad[1], ad[1] + 20):
            for x in range(C):
                X, Y = x + dx, y + dy
                fa = pf[X, Y][3] > 0 if 0 <= X < C and 0 <= Y < C else False
                if (pd[x, y][3] > 0) != fa:
                    s += 1
        if s < bs:
            best, bs = i, s
    return best


def sheet(name, rowdir):
    """rowdir: row -> direction, or None for each frame by its head"""
    path = os.path.join(CH, name)
    im = Image.open(path).convert("RGBA")
    cols, rows = im.width // C, im.height // C
    out = im.copy()
    used = []
    for r in range(rows):
        for c in range(cols):
            f = im.crop((c * C, r * C, c * C + C, r * C + C))
            if not f.getbbox():
                continue
            dr = rowdir[r] if rowdir else head_dir(f, LAYERS)
            used.append(dr)
            out.paste(apply(f, LAYERS[dr]), (c * C, r * C))
    return path, im, out, used


LAYERS = [layer(i) for i in range(8)]
JOBS = [("Npc_Dziadek_Walk8.png", list(range(8))), ("$Npc_Dziadek.png", [0, 2, 6, 4]), ("$Cr_Face_Dziadek.png", [0, 2, 6, 4]),
        ("Npc_Dziadek_Home.png", None)]
arch = os.path.normpath(os.path.join(GAME, "..", "Tawerna_archiwum_2026-11-08", "stach_kapelusz_" + time.strftime("%Y%m%d_%H%M%S")))
for name, rd in JOBS:
    path, before, after, used = sheet(name, rd)
    if PREVIEW:
        w, h = before.size
        pv = Image.new("RGBA", (w * 2, h * 2 * 2 + 8), (60, 60, 70, 255))
        pv.paste(before.resize((w * 2, h * 2), Image.NEAREST), (0, 0), before.resize((w * 2, h * 2), Image.NEAREST))
        a2 = after.resize((w * 2, h * 2), Image.NEAREST)
        pv.paste(a2, (0, h * 2 + 8), a2)
        pv.save(os.path.join(SRC, "_pv_" + name.replace("$", "")))
        print(name, "podgląd", "kierunki:", used if rd is None else rd)
    else:
        os.makedirs(arch, exist_ok=True)
        shutil.copy2(path, os.path.join(arch, name))
        after.save(path)
        print(name, "zapisany")
if not PREVIEW:
    print("kopie:", arch)
