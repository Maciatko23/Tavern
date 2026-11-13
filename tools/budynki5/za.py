# -*- coding: utf-8 -*-
"""docs/budynki5/za_<Name>.png: the hero (Hero_Walk) behind the building, feet in the row of the roof's top edge (only his upper body shows), drawn
before the building picture (as the game draws a lower-y character under a building event), on the town's cobble.
Two heroes: behind the middle and behind the door column.   python tools/budynki5/za.py"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib5
from lib5 import Grid, T, render
from PIL import Image
sys.path.insert(0, os.path.join(lib5.ROOT, 'tools', 'rozszerzenia')); import wspolne as WS
import mapylib
spis = json.load(open(os.path.join(HERE, 'spis.json'), encoding='utf-8'))
hero = mapylib.frame('Hero_Walk', 0, 2, 1)          # the hero's walk sheet (HeroLook.js maps $Reid_Poor to it)
for n, s in spis.items():
    im = Image.open(os.path.join(HERE, 'wynik_%s.png' % n)).convert('RGBA')
    wt, ht = s['tiles']; gw, gh = wt + 4, ht + 3
    flat = [2048 + 40 * 48] * (gw * gh) + [0] * (5 * gw * gh)
    m = {'width': gw, 'height': gh, 'data': flat}; WS.reshape(m, 0, {(x, y) for y in range(gh) for x in range(gw)})
    g = Grid(gw, gh)
    for y in range(gh):
        for x in range(gw): g.L[0][y][x] = m['data'][y * gw + x]
    bg = render(g); ox, base = 2 * T, (ht + 1) * T           # building's left edge, bottom edge (event row = ht)
    a = im.split()[3]; top0 = base - im.height; last_free = ht - s['occupy']['up'] - 1
    for col in sorted({s['center_col'] - 1, s['door_col']}):
        band = a.crop((col * T + 4, 0, col * T + 44, im.height)).load()
        yy = next((y for y in range(im.height) if sum(1 for x in range(40) if band[x, y]) > 30), im.height)
        yt = top0 + yy                                            # the roof's top edge over this column (not a chimney or a spire)
        row = min(last_free, yt // T)                             # feet in the row of the roof edge -> upper body above it
        hx = ox + col * T + T // 2 - hero.width // 2; hy = (row + 1) * T - hero.height
        bg.alpha_composite(hero, (hx, hy))
    bg.alpha_composite(im, (ox, base - im.height))
    bg.save(os.path.join(lib5.ROOT, 'docs', 'budynki5', 'za_%s.png' % n)); print(n, bg.size)
