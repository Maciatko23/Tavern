import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v2lib import *
from kit import Kit
import render2
from PIL import ImageDraw
m = Map2(); k = Kit(m)
m.room("test", 2, 5, 60, 14, 97, 75, wall_h=3)
L = []
# A5 hearths in the wall (rows 2..4 = wall rows), bookshelves
m.stamp(0, 4, 2, "A5", 2, 11, 2, 3); L.append((4, "A5 2,11"))
m.stamp(0, 8, 2, "A5", 4, 11, 2, 3); L.append((8, "A5 4,11"))
m.stamp(0, 12, 3, "A5", 0, 14, 6, 2); L.append((12, "A5 0..5,14"))
m.stamp(0, 20, 2, "A5", 6, 9, 2, 4); L.append((20, "A5 6,9"))
m.stamp(0, 24, 2, "A5", 6, 13, 2, 3); L.append((24, "A5 6,13"))
m.stamp(1, 28, 6, "A5", 0, 8, 3, 3); L.append((28, "A5 0,8 rug"))
m.stamp(1, 32, 6, "A5", 3, 8, 3, 3); L.append((32, "A5 3,8 rug"))
m.stamp(2, 37, 3, "B", 12, 8, 1, 5); L.append((37, "B12,8"))
m.stamp(2, 39, 3, "B", 11, 8, 1, 3); m.stamp(2, 41, 3, "B", 13, 8, 1, 3); m.stamp(2, 43, 3, "B", 14, 8, 1, 3)
m.stamp(2, 45, 2, "B", 8, 8, 3, 2); L.append((45, "B8,8"))
m.stamp(2, 49, 5, "E", 8, 10, 7, 2); L.append((49, "E8,10"))
k.ev(6, 9, "!Decoration", 0, 2, 0); k.ev(8, 9, "!Decoration", 1, 4, 0); k.ev(10, 9, "!Decoration", 2, 4, 0); k.ev(12, 9, "!Decoration", 2, 6, 0)
k.ev(14, 9, "!$Fireplace", 0, 2, 0); k.ev(18, 9, "!$Fireplace", 0, 4, 0)
k.ev(22, 9, "!Statue", 0, 2, 1); k.ev(24, 9, "!Statue", 0, 2, 2); k.ev(26, 9, "!Tavern_Props", 3, 2, 2)
k.ev(28, 11, "!Tavern_Props", 0, 4, 2); k.ev(30, 11, "!Tavern_Props", 1, 4, 0); k.ev(32, 11, "!Tavern_Props2", 0, 4, 0)
k.ev(36, 11, "!Tavern_Props2", 3, 2, 2); k.ev(40, 11, "!Tavern_Props2", 1, 2, 0); k.ev(44, 11, "!Tavern_Props", 2, 2, 0)
k.ev(46, 11, "!Tavern_Props", 2, 2, 1); k.ev(48, 11, "!Tavern_Props", 2, 2, 2); k.ev(50, 11, "!Tavern_Props", 3, 4, 2)
k.ev(52, 11, "!Tavern_Props", 2, 6, 0); k.ev(54, 11, "!Tavern_Props", 2, 6, 1); k.ev(56, 11, "!Tavern_Props", 3, 6, 1)
k.ev(58, 11, "!Tavern_Props", 2, 8, 2)
k.ev(16, 13, "!Decoration_static", 2, 8, 0, priority=2); k.ev(18, 13, "!Decoration_static", 3, 8, 0, priority=2); k.ev(20, 13, "!Decoration_static", 3, 6, 1)
k.ev(22, 13, "!Decoration_static", 6, 2, 0); k.ev(24, 13, "!Decoration_static", 7, 2, 0)
mp = m.write(os.path.join(HERE, "staging", "showroom2.json"))
im = render2.render({**mp["props"], "data": mp["data"], "events": mp["events"]}, box=(0, 0, 62, 15))
d = ImageDraw.Draw(im)
for (x, s) in L: d.text((x * 48 + 2, 15 * 48 - 14), s, fill=(255, 255, 0))
im.save(os.path.join(HERE, "out", "showroom2.png"))
im.crop((0, 0, 31 * 48, 15 * 48)).save(os.path.join(HERE, "out", "showroom2_L.png"))
im.crop((31 * 48, 0, 62 * 48, 15 * 48)).save(os.path.join(HERE, "out", "showroom2_R.png"))
