"""Labelled contact sheet for docs/kafelki: textures x3 and edge zooms x4 (Winlu vs S2).
usage: python sheet_docs_s2.py ZOOMDIR OUT.png"""
import os, sys
from PIL import Image, ImageDraw
zd, out = sys.argv[1], sys.argv[2]
t = Image.open(os.path.join(zd, "tiled3x3_grass_dirt_mud_mudov_forest_x3_S2.png")).convert("RGB")
z1 = Image.open(os.path.join(zd, "zoom4_mud_edge_winlu_vs_S2.png")).convert("RGB")
z2 = Image.open(os.path.join(zd, "zoom4_forest_edge_winlu_vs_S2.png")).convert("RGB")
sc = Image.open(os.path.join(zd, "scene_winlu_vs_S2.png")).convert("RGB")
W = max(t.width, z1.width + z2.width + 20, sc.width)
H = 30 + t.height + 40 + z1.height + 40 + sc.height + 10
img = Image.new("RGB", (W, H), (20, 20, 20))
d = ImageDraw.Draw(img)
y = 6
d.text((8, y), "x3, 3x3 kafelki: trawa Winlu | ziemia Winlu | BLOTO (k24) | BLOTO nakladka (k39) na trawie | SCIOLKA nakladka (k46) na trawie", fill=(255, 230, 40))
img.paste(t, (0, 30)); y = 30 + t.height + 10
d.text((8, y + 8), "x4, brzeg: Winlu ziemia k39 | S2 bloto k39            x4, brzeg: Winlu ciemna trawa k46 | S2 sciolka k46", fill=(255, 230, 40))
img.paste(z1, (0, y + 30)); img.paste(z2, (z1.width + 20, y + 30)); y += 30 + z1.height + 10
d.text((8, y + 8), "x1, scena z tabela autokafelkow MZ: Winlu (lewo) | S2 (prawo)", fill=(255, 230, 40))
img.paste(sc, (0, y + 30))
img.save(out)
print(out, img.size)
