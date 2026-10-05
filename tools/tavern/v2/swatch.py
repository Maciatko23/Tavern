# every A3 wall kind of tileset 8 as a 3-row wall over a floor, and every A4 floor - for choosing the rooms' looks
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v2lib import *
import render2
from PIL import ImageDraw
m = Map2()
x = 1
for i, k in enumerate(range(48, 80)):
    col, row = i % 8, i // 8
    x0, y0 = 1 + col * 6, 1 + row * 8
    m.room("w%d" % k, x0, y0 + 4, x0 + 4, y0 + 6, 84, k, wall_h=3)
for i, k in enumerate([80, 81, 82, 83, 84, 85, 86, 87, 96, 97, 98, 99, 100, 101, 102, 103, 112, 113, 114, 115, 116, 117, 118, 119]):
    col, row = i % 8, i // 8
    x0, y0 = 52 + col * 6, 1 + row * 8
    m.room("f%d" % k, x0, y0 + 2, x0 + 4, y0 + 6, k, 52, wall_h=2)
mp = m.write(os.path.join(HERE, "staging", "swatch.json"))
im = render2.render({**mp["props"], "data": mp["data"], "events": [None]}, box=(0, 0, 100, 33))
d = ImageDraw.Draw(im)
for i, k in enumerate(range(48, 80)):
    col, row = i % 8, i // 8
    d.text(((1 + col * 6) * 48 + 4, (1 + row * 8) * 48 + 4), "w%d" % k, fill=(255, 255, 0))
for i, k in enumerate([80, 81, 82, 83, 84, 85, 86, 87, 96, 97, 98, 99, 100, 101, 102, 103, 112, 113, 114, 115, 116, 117, 118, 119]):
    col, row = i % 8, i // 8
    d.text(((52 + col * 6) * 48 + 4, (1 + row * 8) * 48 + 4), "f%d" % k, fill=(255, 255, 0))
im.save(os.path.join(HERE, "out", "swatch.png"))
im.crop((0, 0, 49 * 48, 33 * 48)).resize((49 * 24, 33 * 24)).save(os.path.join(HERE, "out", "swatch_walls.png"))
im.crop((51 * 48, 0, 100 * 48, 26 * 48)).resize((49 * 24, 26 * 24)).save(os.path.join(HERE, "out", "swatch_floors.png"))
