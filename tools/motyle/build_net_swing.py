# -*- coding: utf-8 -*-
"""Arkusz zamachu siatką na motyle: img/system/Hero_Net.png (format arkuszy zamachów: 4 wiersze dół / lewo / prawo / góra,
17 komórek 96x96, stopy w (48, 79); lewo = odbite prawo) z animacji PixelLab "net_swing" stanu "Butterfly net" bohatera
(postać 5cfc58f7-9bbe-4e8e-a6ec-bee454c62bdd, grupa f4a51d97-f86c-4611-b9dd-5a59ccb9f16c; klatki pobrane do <katalog>/<kierunek>/N.png).
Wypisuje też, w której klatce obręcz siatki jest najniżej przed bohaterem (moment złapania -> HeroLook SWINGS[...].hit).

  python tools/motyle/build_net_swing.py <katalog klatek> [podglad.gif]
"""
import colorsys, json, sys
from PIL import Image, ImageOps

GAME = __file__.replace("\\", "/").rsplit("/tools/", 1)[0] + "/"
SRC = sys.argv[1].rstrip("/\\") + "/"
GIF = sys.argv[2] if len(sys.argv) > 2 else None
C, FEET = 96, (48, 79)
DIRS = {"down": "south", "right": "east", "up": "north"}


def feet(im):
    px = im.load()
    w, h = im.size
    bottom = max(y for y in range(h) for x in range(w) if px[x, y][3] > 0)
    xs = [x for y in range(bottom - 3, bottom + 1) for x in range(w) if px[x, y][3] > 0]
    return (min(xs) + max(xs)) / 2, bottom


def mesh_centre(im):
    """the pale net bag: the middle of its pixels (None when hidden)"""
    px = im.load()
    pts = []
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if v > 0.82 and s < 0.14:
                pts.append((x, y))
    if len(pts) < 6:
        return None
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def row_of(direction):
    frames = [Image.open(SRC + "%s/%d.png" % (direction, i)).convert("RGBA") for i in range(17)]
    fx, fy = feet(frames[0])
    dx, dy = round(FEET[0] - fx), FEET[1] - fy
    cells, nets, lost = [], [], 0
    for im in frames:
        cell = Image.new("RGBA", (C, C), (0, 0, 0, 0))
        cell.paste(im, (dx, dy), im)
        a_in = sum(1 for p in cell.getdata() if p[3] > 0)
        a_all = sum(1 for p in im.getdata() if p[3] > 0)
        lost += a_all - a_in
        cells.append(cell)
        m = mesh_centre(cell)
        nets.append([round(m[0]), round(m[1])] if m else None)
    return cells, nets, lost


def main():
    rows = {}
    for k, d in DIRS.items():
        rows[k] = row_of(d)
        print(k, "pixels cut off by the cell:", rows[k][2])
    rc, rn, rl = rows["right"]
    rows["left"] = ([ImageOps.mirror(c) for c in rc], [[C - 1 - t[0], t[1]] if t else None for t in rn], rl)
    order = ("down", "left", "right", "up")
    sheet = Image.new("RGBA", (C * 17, C * 4), (0, 0, 0, 0))
    for r, k in enumerate(order):
        for i in range(17):
            sheet.alpha_composite(rows[k][0][i], (i * C, r * C))
    sheet.save(GAME + "img/system/Hero_Net.png")
    nets = {k: rows[k][1] for k in order}
    for k in order:
        lowest = max((i for i in range(2, 14) if nets[k][i]), key=lambda i: nets[k][i][1])
        print(k, "net lowest on frame", lowest, nets[k][lowest])
    with open(GAME + "tools/motyle/net_tips.json", "w", encoding="utf8") as f:
        json.dump([nets[k] for k in order], f)
    if GIF:
        S = 2
        gif = []
        for i in range(17):
            fr = Image.new("RGBA", (C * S * 4, C * S), (90, 120, 80, 255))
            for r, k in enumerate(order):
                fr.alpha_composite(rows[k][0][i].resize((C * S, C * S), Image.NEAREST), (r * C * S, 0))
            gif.append(fr.convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=255))
        gif[0].save(GIF, save_all=True, append_images=gif[1:], duration=[60] * 16 + [300], loop=0)


if __name__ == "__main__":
    main()
