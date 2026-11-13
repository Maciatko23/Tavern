# -*- coding: utf-8 -*-
"""Contact sheet: the batch's buildings at 1:1 on the old town's cobble + grass, next to an old Winlu house (Dom Haliny).
  python tools/budynki5/podglad.py [out.png] [Name ...]"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib5
from lib5 import Grid, T, render
from PIL import Image, ImageDraw
import mapylib
sys.path.insert(0, os.path.join(lib5.ROOT, "tools", "rozszerzenia"))
spis = json.load(open(os.path.join(HERE, 'spis.json'), encoding='utf-8'))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(lib5.ROOT, 'docs', 'budynki5', 'partia1.png')
names = sys.argv[2:] or list(spis)
ims = [Image.open(os.path.join(HERE, 'wynik_%s.png' % n)).convert('RGBA') for n in names]
old = render(lib5.cut(80, 53, 90, 64))                     # Dom Haliny with its props
ims.append(old); names = names + ['(stary dom Winlu)']
GAP = 2 * T
W = sum(i.width for i in ims) + GAP * (len(ims) + 1); H = max(i.height for i in ims) + 4 * T
gw, gh = W // T + 1, H // T + 1
g = Grid(gw, gh); base = 2048 + 40 * 48                     # the town's street cobble (A2 kind 40) + a grass verge at the back
grass = 2048 + 16 * 48
for y in range(gh):
    for x in range(gw): g.L[0][y][x] = grass if y < 2 else base
mp = {'width': gw, 'height': gh, 'data': sum(g.L, [])}
import wspolne as WS
flat = [g.L[z][y][x] for z in range(4) for y in range(gh) for x in range(gw)] + [0] * (2 * gw * gh)
m = {'width': gw, 'height': gh, 'data': flat}; WS.reshape(m, 0, {(x, y) for y in range(gh) for x in range(gw)})
for y in range(gh):
    for x in range(gw): g.L[0][y][x] = m['data'][y * gw + x]
bg = render(g).convert('RGBA'); d = ImageDraw.Draw(bg); f = mapylib.font(16, True)
x = GAP; base_y = H - T
for n, im in zip(names, ims):
    bg.alpha_composite(im, (x, base_y - im.height))
    d.text((x, base_y + 6), n, font=f, fill=(255, 255, 255), stroke_width=3, stroke_fill=(0, 0, 0))
    x += im.width + GAP
bg.save(out); print(out, bg.size)
