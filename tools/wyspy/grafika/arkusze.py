# -*- coding: utf-8 -*-
"""Arkusze obiektów wysp (img/characters) z obrazków PixelLab (tools/wyspy/grafika/surowe, 96x96, 2026-11-07):
  !$Wys_Kormoran.png - kormoran na gnieździe: rząd 1 (kierunek 2) z jajami, rząd 2 (4) bez jaj (jaja zamalowane gniazdem - ten sam
                       kształt), rząd 3 (6) samo gniazdo bez ptaka (wzięty z drugiego obrazka, jaja też zamalowane)
  !$Wys_Sol.png      - głaz z solą: rząd 1 z grubą skorupą soli, rząd 2 po zeskrobaniu (biel przyciemniona do szarości kamienia,
                       zostają cienkie ślady) - ten sam głaz
Każdy rząd: 3 takie same klatki (wzór 0-2). Klatka 96x96; stopa obiektu przy dolnej krawędzi klatki.
  python tools/wyspy/grafika/arkusze.py"""
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(HERE, "surowe")
OUT = os.path.join(ROOT, "img", "characters")
F = 96


def foot(im):
    """the picture moved down so its lowest solid row is 2 px above the frame's bottom (RPG Maker stands it on the cell's foot)"""
    a = im.split()[3]
    rows = [y for y in range(im.height) if any(a.getpixel((x, y)) > 40 for x in range(im.width))]
    dy = (im.height - 3) - rows[-1]
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.alpha_composite(im, (0, dy))
    return out


def no_eggs(im, fill_from):
    """the pale eggs (light, bluish or white, within the nest) painted with the nest's own browns, taken from the pixel just left of
    each egg run - the shape stays"""
    px = im.load()
    W, H = im.size
    out = im.copy(); po = out.load()
    def egg(c):   # (pale blue-green or white: the eggs - not the bird's dark plumage, not the nest's browns and greens)
        r, g, b, a = c
        if a <= 200: return False
        cyan = b > 130 and g > 120 and b > r + 25
        white = min(r, g, b) > 150 and max(r, g, b) - min(r, g, b) < 60
        return cyan or white
    for y in range(int(H * 0.35), int(H * 0.85)):
        for x in range(int(W * 0.15), int(W * 0.85)):
            if egg(px[x, y]):
                # the nearest non-egg pixel to the left / right, darker of the two (the nest's twigs)
                k = 1
                cand = []
                while k < 12 and len(cand) < 2:
                    for xx in (x - k, x + k):
                        if 0 <= xx < W and not egg(px[xx, y]) and px[xx, y][3] > 200: cand.append(px[xx, y])
                    k += 1
                if cand:
                    c = min(cand, key=lambda c: sum(c[:3]))
                    po[x, y] = c
    return out


def scraped(im):
    """the salt taken: the white crust darkened to the stone's grey-blue, a faint trace left"""
    out = im.copy(); po = out.load()
    W, H = im.size
    for y in range(H):
        for x in range(W):
            r, g, b, a = po[x, y]
            if a < 10: continue
            lum = (r + g + b) / 3
            if lum > 150 and max(r, g, b) - min(r, g, b) < 60:   # (white / pale blue salt)
                t = min(1.0, (lum - 150) / 90)
                # towards the rock's mid grey-blue (92, 96, 110), a little of the white kept as a trace
                k = 0.78 * t
                po[x, y] = (int(r * (1 - k) + 92 * k), int(g * (1 - k) + 96 * k), int(b * (1 - k) + 112 * k), a)
    # the loose flakes round the base (small white blobs on the ground below the rock) go
    return out


def sheet(rows, name):
    s = Image.new("RGBA", (F * 3, F * 4), (0, 0, 0, 0))
    for r, im in enumerate(rows):
        for c in range(3): s.alpha_composite(im, (c * F, r * F))
    s.save(os.path.join(OUT, name))
    print(name, s.size)


k = foot(Image.open(os.path.join(SRC, "kormoran.png")).convert("RGBA"))
g = foot(Image.open(os.path.join(SRC, "gniazdo.png")).convert("RGBA"))
sheet([k, no_eggs(k, None), no_eggs(g, None)], "!$Wys_Kormoran.png")
s = foot(Image.open(os.path.join(SRC, "sol.png")).convert("RGBA"))
sheet([s, scraped(s)], "!$Wys_Sol.png")
