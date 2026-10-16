# python tools/kruk/art/build_sheet.py [--preview]
#   -> img/system/Kruk.png        arkusz kruka (komórki 48x48, kruk patrzy w prawo; lewo = lustro w kodzie)
#   -> img/system/Farm_Grzeda.png grzęda kruka (budynek pola 1x1, Farming_Data.js "grzeda")
#   -> img/system/Kruk_Grzeda_Stara.png  stara żerdź zakonu w kruczarni (ta sama grzęda bez daszku i misek, szara)
#   -> tools/kruk/art/preview_*.png (--preview: powiększone podglądy)
#
# PAKIET B (docs/miejsca_wyspy/PAKIETY.md). Surowe klatki z PixelLab leżą w tools/kruk/art/raw/ (pobrane 2026-10-16):
#   small_a.png   kruk stojący (create_image_pro_flash 36x32, wzór: wrona z Bird_Crow + większy kruk z pierwszej próby)
#   stand48.png   ten sam kruk na płótnie 48x48 (stopy w wierszu 44)
#   caw_0..8      animate_image: kracze (dziób otwarty), rozgląda się
#   peck_0..8     animate_image: dziobie ziemię
#   takeoff_0..8  animate_image: przysiad, skrzydła, start (odwrócony = lądowanie)
#   fly_pose.png  create_image_pro_flash: kruk w locie (skrzydła w górze)
#   fly_0..8      animate_image: machanie skrzydłami w miejscu (pętla)
#   grzeda_a.png  create_image_pro_flash 64x96: grzęda (słup, poprzeczka, daszek, miska, korytko) - wzór stylu: buda psa
#   sleep_1..4    animate_image: nastroszony kruk chowa łeb pod skrzydło (sen na grzędzie)
#   gniazda.png   create_image_pro_flash 128x64: dwa gniazda kruków na gruzie (-> img/characters/!$Urwisko_Gniazda.png)
#   icon_179.png  create_image_pro_flash 32x32: ikona „Obrączka z krukiem” (wzór: ikona wisiorka 437)
# Ten skrypt nic nie generuje w PixelLab: tylko składa, czyści i przyciąga kolory do palety stojącego kruka.
#
# Wiersze arkusza (KrukData.SHEET w Kruk_Data.js musi się zgadzać):
#   0 stoi / kracze:     0 stoi, 1-8 kracze i rozgląda się
#   1 dziobie:           0-8
#   2 start:             0-6 (przysiad -> w powietrzu); lądowanie = 6..0
#   3 lot:               0-7 pętla machania (0 skrzydła w górze, 2 poziomo, 4 w dole, 6 poziomo)
#   4 z listem:          0 stoi z listem w dziobie, 1-8 lot z listem (pętla jak w wierszu 3)
#   5 na ramieniu:       0 stoi (mniejszy cień), 1 kracze, 2 dziobie (czyści pióra) - te same klatki co 0/1, osobno dla porządku
#   6 śpi:               0 stoi, 1-4 nastroszony chowa łeb pod skrzydło (4 = śpi) - animate_image sleep_1..4
import os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..")) + os.sep
RAW = os.path.join(HERE, "raw")
CELL = 48
FEET = 45            # stopy stojącego kruka: wiersz 44 -> kotwica 45/48 w kodzie
PARCH = [(0xEA, 0xDC, 0xB4), (0xC9, 0xB4, 0x86), (0x5A, 0x3E, 0x26)]   # list: jasny, cień, obrys/sznurek


def load(name):
    return Image.open(os.path.join(RAW, name + ".png")).convert("RGBA")


def palette():
    im = load("small_a")
    cols = sorted({p[:3] for p in im.getdata() if p[3] > 128})
    return cols


PAL = palette()


def snap(im, pal=PAL):
    """every opaque pixel to the nearest colour of the standing raven (the flight frames came out bluer)"""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a < 100:
                px[x, y] = (0, 0, 0, 0)
                continue
            if r > 200 and g > 200 and b > 200:      # (the eye's glint stays)
                px[x, y] = (r, g, b, 255)
                continue
            best = min(pal, key=lambda c: (c[0] - r) ** 2 * 0.8 + (c[1] - g) ** 2 + (c[2] - b) ** 2 * 0.7)
            px[x, y] = best + (255,)
    return out


def clean(im, keep=6):
    """drop specks: connected pieces smaller than `keep` pixels (the caw's 'sound' dots, loose feather pixels)"""
    w, h = im.size
    px = im.load()
    seen = set()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 or (x, y) in seen: continue
            comp, stack = [], [(x, y)]
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
            if len(comp) < keep:
                for c in comp: px[c] = (0, 0, 0, 0)
    return im


def beak_tip(im):
    """the beak's tip: the rightmost opaque pixel of the bird (it faces right; the wings never reach further than the beak),
    the highest of them"""
    bb = im.getbbox()
    if not bb: return None
    px = im.load()
    x = bb[2] - 1
    ys = [y for y in range(im.height) if px[x, y][3] > 0]
    return (x, ys[0]) if ys else None


def with_letter(im):
    """a rolled letter held across the beak: 6x3 parchment, its middle just under the beak's tip"""
    out = im.copy()
    tip = beak_tip(out)
    if not tip: return out
    px = out.load()
    tx, ty = tip
    x0, y0 = tx - 4, ty + 1
    for j in range(4):
        for i in range(7):
            x, y = x0 + i, y0 + j
            if not (0 <= x < out.width and 0 <= y < out.height): continue
            edge = i in (0, 6) or j in (0, 3)
            c = PARCH[2] if edge else (PARCH[0] if j == 1 else PARCH[1])
            if (i, j) in ((0, 0), (6, 0), (0, 3), (6, 3)): continue    # (rounded ends)
            px[x, y] = c + (255,)
    # the seal's red dot and the string
    if 0 <= x0 + 3 < out.width and 0 <= y0 + 2 < out.height: px[x0 + 3, y0 + 2] = (0xA8, 0x2A, 0x22, 255)
    return out


def row(frames):
    return [clean(snap(f)) for f in frames]


def build_sheet():
    stand = load("stand48")
    caw = [load("caw_%d" % i) for i in range(1, 9)]
    peck = [load("peck_%d" % i) for i in range(0, 9)]
    take = [load("takeoff_%d" % i) for i in range(0, 7)]
    fly = [load("fly_%d" % i) for i in range(0, 8)]
    rows = [row([stand] + caw), row(peck), row(take), row(fly)]
    rows.append([with_letter(rows[0][0])] + [with_letter(f) for f in rows[3]])
    rows.append([rows[0][0], rows[0][4], rows[1][4]])
    rows.append(row([stand] + [load("sleep_%d" % i) for i in range(1, 5)]))
    cols = max(len(r) for r in rows)
    sheet = Image.new("RGBA", (cols * CELL, len(rows) * CELL), (0, 0, 0, 0))
    for j, r in enumerate(rows):
        for i, f in enumerate(r):
            sheet.alpha_composite(f, (i * CELL, j * CELL))
    return sheet, rows


def build_grzeda():
    """the perch: the roof raised 16 px (room for the raven on the bar under it), cropped, an even width"""
    g = load("grzeda_a")
    w, h = g.size
    out = Image.new("RGBA", (w, h + 16), (0, 0, 0, 0))
    out.alpha_composite(g.crop((0, 0, w, 19)), (0, 0))
    for k in range(4):
        out.alpha_composite(g.crop((0, 19, w, 23)), (0, 19 + 4 * k))
    out.alpha_composite(g.crop((0, 19, w, h)), (0, 35))
    bb = out.getbbox()
    out = out.crop((bb[0], bb[1], bb[2], bb[3]))
    if out.width % 2:
        pad = Image.new("RGBA", (out.width + 1, out.height), (0, 0, 0, 0))
        pad.alpha_composite(out, (0, 0))
        out = pad
    return out


def old_perch(grz):
    """the Order's old perch in the ruin: the same post and bar, no roof, no bowls, greyed and weathered"""
    g = load("grzeda_a")
    w, h = g.size
    out = g.copy()
    px = out.load()
    for y in range(0, 23):          # (the roof and its posts away)
        for x in range(w): px[x, y] = (0, 0, 0, 0)
    for y in range(int(h * 0.80), h):   # (the bowl and the tray at the foot away)
        for x in range(w):
            if x < 24 or x > 40: px[x, y] = (0, 0, 0, 0)
    for y in range(int(h * 0.86), h):   # (and what is left of the tray right of the foot)
        for x in range(36, w): px[x, y] = (0, 0, 0, 0)
    for y in range(h):
        for x in range(w):
            r, g_, b, a = px[x, y]
            if a == 0: continue
            l = int(0.3 * r + 0.59 * g_ + 0.11 * b)
            px[x, y] = (int(l * 0.78 + r * 0.22), int(l * 0.8 + g_ * 0.2), int(l * 0.84 + b * 0.16), a)
    clean(out, 8)
    bb = out.getbbox()
    return out.crop(bb)


def build_nests():
    """img/characters/!$Urwisko_Gniazda.png: two nests from one PixelLab picture (gniazda.png), cut at the empty column between
    them; frames 64x64, 3 x 4 (direction 2: pattern 0 nest A, 1 nest B, 2 nest A mirrored; the other rows the same)"""
    g = load("gniazda")
    px = g.load()
    cols = [x for x in range(g.width) if any(px[x, y][3] > 0 for y in range(g.height))]
    gaps = [x for x in range(cols[0], cols[-1]) if x not in cols]
    cut = gaps[len(gaps) // 2] if gaps else g.width // 2
    a = g.crop((0, 0, cut, g.height)); a = a.crop(a.getbbox())
    b = g.crop((cut, 0, g.width, g.height)); b = b.crop(b.getbbox())
    frames = [a, b, a.transpose(Image.FLIP_LEFT_RIGHT)]
    F = 64
    sheet = Image.new("RGBA", (F * 3, F * 4), (0, 0, 0, 0))
    for r in range(4):
        for i, f in enumerate(frames):
            sheet.alpha_composite(f, (i * F + (F - f.width) // 2, r * F + F - f.height - 2))
    return sheet


def main():
    nests = build_nests()
    nests.save(ROOT + "img/characters/!$Urwisko_Gniazda.png")
    os.makedirs(os.path.join(HERE, "icons"), exist_ok=True)
    load("icon_179").save(os.path.join(HERE, "icons", "obraczka_179.png"))
    print("!$Urwisko_Gniazda.png", nests.size, "icons/obraczka_179.png (32x32 -> IconSet 440 przy integracji)")
    sheet, rows = build_sheet()
    sheet.save(ROOT + "img/system/Kruk.png")
    grz = build_grzeda()
    grz.save(ROOT + "img/system/Farm_Grzeda.png")
    old = old_perch(grz)
    old.save(ROOT + "img/system/Kruk_Grzeda_Stara.png")
    print("Kruk.png", sheet.size, "rows", [len(r) for r in rows], "palette", len(PAL))
    print("Farm_Grzeda.png", grz.size, "Kruk_Grzeda_Stara.png", old.size)
    # the perch's bar: the first opaque row under the roof gap in the middle column
    px = grz.load()
    mid = grz.width // 2
    ys = [y for y in range(grz.height) if px[mid, y][3] > 0]
    gaps = [ys[i] for i in range(1, len(ys)) if ys[i] - ys[i - 1] > 3]
    print("grzęda: belka (górna krawędź) w wierszu", gaps[0] if gaps else "?", "od dołu", grz.height - (gaps[0] if gaps else 0))
    if "--preview" in sys.argv:
        bg = Image.new("RGBA", sheet.size, (96, 140, 70, 255))
        bg.alpha_composite(sheet)
        bg.resize((bg.width * 4, bg.height * 4), Image.NEAREST).save(os.path.join(HERE, "preview_sheet.png"))
        p = Image.new("RGBA", (grz.width + old.width + 70, max(grz.height, old.height)), (96, 140, 70, 255))
        p.alpha_composite(grz, (0, p.height - grz.height))
        p.alpha_composite(rows[0][0], (grz.width // 2 - 24, (gaps[0] if gaps else 40) - FEET + (p.height - grz.height)))
        p.alpha_composite(old, (grz.width + 20, p.height - old.height))
        p.resize((p.width * 4, p.height * 4), Image.NEAREST).save(os.path.join(HERE, "preview_grzeda.png"))


if __name__ == "__main__":
    main()
