# a test room with pieces in the map's empty top (rows 0..28) to see how they stand, face and stack
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v2lib import *
import render2
from PIL import ImageDraw
m = Map2()
m.room("test", 2, 4, 98, 27, 84, 52, wall_h=3)
labels = []
def L(x, y, s): labels.append((x, y, s))
# chairs around round tables
x = 4
for c in range(8, 14):
    m.stamp(2, x, 6, "C", c, 0, 1, 2); L(x, 6, "C%d" % c); x += 2
for c in range(8, 14):
    m.stamp(2, x, 6, "C", c, 2, 1, 2); L(x, 6, "C%d,2" % c); x += 2
# a round table with 4 chairs
m.stamp(2, 30, 6, "E", 0, 9, 1, 2); m.stamp(2, 29, 6, "C", 11, 0, 1, 2); m.stamp(2, 31, 6, "C", 10, 0, 1, 2)
m.stamp(2, 30, 4, "C", 8, 0, 1, 2); m.stamp(2, 30, 8, "C", 9, 0, 1, 2)
# long tables + benches
m.stamp(2, 34, 7, "C", 9, 4, 3, 2); m.stamp(2, 34, 6, "C", 14, 1, 2, 1); m.stamp(2, 34, 9, "C", 14, 1, 2, 1)
m.stamp(2, 38, 7, "C", 9, 6, 3, 2); m.stamp(2, 42, 7, "C", 12, 4, 2, 2); m.stamp(2, 45, 7, "C", 12, 6, 2, 2)
m.stamp(2, 48, 7, "C", 12, 8, 2, 2); m.stamp(2, 51, 7, "C", 14, 8, 2, 2); m.stamp(2, 54, 5, "C", 8, 4, 1, 3)
m.stamp(2, 56, 7, "C", 15, 4, 1, 2); m.stamp(2, 58, 7, "C", 14, 5, 1, 2); m.stamp(2, 60, 7, "C", 15, 6, 1, 2)
m.stamp(2, 62, 6, "C", 14, 0, 2, 2); m.stamp(2, 65, 5, "C", 14, 2, 1, 3)
# counter
m.stamp(2, 68, 6, "E", 0, 0, 1, 2); 
for i in range(5): m.stamp(2, 69 + i, 6, "E", 1, 0, 1, 2)
m.stamp(2, 74, 6, "E", 2, 0, 1, 2)
m.stamp(2, 76, 4, "E", 3, 0, 1, 4); m.stamp(2, 78, 4, "E", 5, 0, 1, 4); m.stamp(2, 80, 4, "E", 4, 0, 1, 2)
m.stamp(2, 82, 6, "E", 1, 6, 2, 1); m.stamp(2, 85, 6, "E", 3, 4, 3, 1); m.stamp(2, 85, 7, "E", 3, 5, 3, 1)
# against the wall (first floor row 4): tall pieces
x = 4
for (sh, c, r, w, h) in [("C", 0, 0, 1, 3), ("C", 1, 0, 1, 3), ("C", 3, 0, 1, 2), ("C", 0, 3, 1, 2), ("C", 4, 4, 2, 2), ("C", 6, 4, 2, 2),
                         ("C", 6, 2, 2, 2), ("C", 3, 2, 1, 2), ("C", 0, 6, 2, 3), ("C", 2, 6, 1, 3), ("C", 3, 6, 2, 3), ("C", 5, 6, 1, 3),
                         ("C", 6, 6, 1, 3), ("C", 7, 6, 1, 3), ("C", 2, 9, 1, 2), ("C", 3, 9, 2, 2), ("C", 5, 9, 1, 2), ("C", 6, 9, 1, 2),
                         ("C", 7, 9, 1, 2), ("C", 6, 10, 2, 3), ("C", 3, 11, 2, 2), ("C", 5, 11, 1, 2), ("E", 6, 3, 2, 3), ("E", 1, 13, 2, 3),
                         ("E", 3, 13, 2, 3), ("E", 0, 7, 4, 2), ("E", 4, 7, 1, 2), ("E", 5, 7, 1, 2), ("E", 6, 7, 1, 2), ("E", 7, 7, 1, 2)]:
    m.stamp(2, x, 4 + 12 - h + 1 - 12 + 0 + 12 - 12 + 12 - 12 + 0 if False else 13 - h + 1, sh, c, r, w, h); L(x, 13, "%s%d,%d" % (sh, c, r)); x += w + 1
# beds and others row 2 of the room
x = 4
for (sh, c, r, w, h) in [("C", 12, 10, 1, 3), ("C", 13, 10, 2, 3), ("C", 15, 10, 1, 3), ("C", 8, 10, 2, 1), ("C", 8, 11, 2, 1), ("C", 10, 10, 2, 1),
                         ("C", 9, 13, 1, 3), ("C", 11, 12, 2, 4), ("C", 13, 13, 1, 3), ("C", 14, 13, 2, 3), ("C", 8, 13, 1, 2), ("C", 2, 14, 1, 2),
                         ("C", 3, 14, 1, 2), ("C", 0, 15, 2, 1), ("C", 4, 13, 4, 3), ("C", 3, 12, 1, 2), ("C", 2, 12, 1, 2), ("C", 0, 9, 2, 4),
                         ("D", 8, 0, 2, 2), ("D", 10, 0, 3, 2), ("D", 13, 0, 1, 2), ("D", 14, 0, 1, 2), ("D", 15, 0, 1, 2), ("D", 13, 2, 1, 2),
                         ("D", 14, 2, 1, 2), ("D", 15, 2, 1, 2), ("D", 8, 2, 2, 2), ("D", 11, 3, 1, 2), ("D", 12, 3, 1, 2), ("D", 13, 3, 1, 2), ("D", 14, 3, 1, 2)]:
    m.stamp(2, x, 22 - h + 1, sh, c, r, w, h); L(x, 22, "%s%d,%d" % (sh, c, r)); x += w + 1
mp = m.write(os.path.join(HERE, "staging", "showroom.json"))
im = render2.render({**mp["props"], "data": mp["data"], "events": [None]}, box=(0, 0, 100, 28))
d = ImageDraw.Draw(im)
for (x, y, s) in labels: d.text((x * 48 + 2, (y + 1) * 48 + 2), s, fill=(255, 255, 0))
im.save(os.path.join(HERE, "out", "showroom.png"))
im.crop((0, 0, 50 * 48, 28 * 48)).save(os.path.join(HERE, "out", "showroom_L.png"))
im.crop((50 * 48, 0, 100 * 48, 28 * 48)).save(os.path.join(HERE, "out", "showroom_R.png"))
