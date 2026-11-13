# docs/budynki/zestaw.png: all eight buildings side by side on a cobble patch (the cobble sampled from a staged-map shot), 1:1 pixels
import json, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..')); T = 48
spis = json.load(open(os.path.join(HERE, 'spis.json'), encoding='utf-8'))
tex = Image.open(os.path.join(ROOT, 'docs', 'budynki', 'czesc_a1.png')).convert('RGB').crop((650, 150, 810, 310))
W, H = 40 * T, 22 * T; bg = Image.new('RGB', (W, H))
for y in range(0, H, 160):
    for x in range(0, W, 160): bg.paste(tex, (x, y))
bg = bg.convert('RGBA')
for by, names in ((9, ['Kamienica', 'Kuznia', 'Spichlerz', 'Rybak']), (20, ['Karczma', 'Wieza', 'Ciesla', 'Mieszczanin'])):
    x = 1
    for n in names:
        im = Image.open(os.path.join(HERE, 'wynik_%s.png' % n)); bg.alpha_composite(im, (x * T, (by + 1) * T - im.height)); x += spis[n]['tiles'][0] + 3
bg.convert('RGB').save(os.path.join(ROOT, 'docs', 'budynki', 'zestaw.png'))
