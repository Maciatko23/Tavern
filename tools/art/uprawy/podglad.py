# docs/uprawy/podglad.png: everything new for the crops and wild plants, x3 on dark green, labelled
import json
from PIL import Image, ImageDraw, ImageFont
ROOT = "c:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/"
SYS, CH = ROOT + "img/system/", ROOT + "img/characters/"
BG = (44, 70, 40, 255); K = 3; W = 1240
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 13); big = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 17)
TS = ROOT + "img/tilesets/Styl_B/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/"
grass = Image.open(TS + "Fantasy_Outside_A2_green.png").convert("RGBA").crop((0, 0, 48, 48))
stump = Image.open(TS + "Fantasy_Outside_D_green.png").convert("RGBA").crop((192, 0, 240, 48))
items = json.load(open(ROOT + "data/Items.json", encoding="utf-8"))
iconset = Image.open(SYS + "IconSet.png").convert("RGBA")
sheet = Image.new("RGBA", (W, 3000), BG); d = ImageDraw.Draw(sheet); y = 10

def up(im): return im.resize((im.width * K, im.height * K), Image.NEAREST)
def title(t):
    global y
    d.text((10, y), t, font=big, fill=(255, 226, 120)); y += 28
def tiles(entries, cell=48):
    """entries: (picture or None, label, background tile or None, (x, y) or None); x3, wrapping, a label under each"""
    global y
    x = 10
    for pic, lab, bg, pos in entries:
        if x + cell * K > W: x = 10; y += cell * K + 24
        t = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
        if bg is not None: t.alpha_composite(bg)
        if pic is not None:
            px, py = pos if pos else ((cell - pic.width) // 2, cell - pic.height - 4)
            t.alpha_composite(pic, (px, py))
        sheet.alpha_composite(up(t), (x, y))
        d.text((x, y + cell * K + 3), lab, font=font, fill=(235, 235, 220))
        x += cell * K + 8
    y += cell * K + 30

crops = Image.open(SYS + "Farm_Crops.png").convert("RGBA")
title("Farm_Crops.png: rows 4-9 (stages 0-3), on grass")
for r0 in (0, 2, 4):
    ents = []
    for r in (r0, r0 + 1):
        name = ["len", "owies", "buraki", "cebula", "czosnek", "groch"][r]
        ents += [(crops.crop((s * 48, (4 + r) * 48, s * 48 + 48, (5 + r) * 48)), "%s %d" % (name, s), grass, (0, 0)) for s in range(4)]
    tiles(ents)

title("Ground plants (img/system/Gather_*)")
g = []
for n in ("Strawberry", "WildOat", "WildPea", "WildBeet", "WildOnion"):
    for v in (0, 1):
        g.append((Image.open(SYS + "Gather_%s_%d.png" % (n, v)).convert("RGBA"), "%s_%d" % (n, v), grass, None))
tiles(g)

title("Bushes (Gather_Bush_4 blackberry, _5 hazel; _0/_1 old for comparison) and oyster mushrooms on the stump tile")
b = [(Image.open(SYS + "Gather_Bush_%d.png" % n).convert("RGBA"), "Bush_%d" % n, grass, None) for n in (0, 1, 4, 5)]
st = Image.new("RGBA", (48, 48)); st.alpha_composite(grass); st.alpha_composite(stump)
for v in (0, 1):
    m = Image.open(SYS + "Gather_Boczniak_%d.png" % v).convert("RGBA")
    b.append((m, "Boczniak_%d" % v, st, ((48 - m.width) // 2, 48 - 10 - m.height)))
tiles(b)

title("Apple saplings (!$Sapling_Apple, _2, _3) next to the pine ones")
s = []
for nm in ("!$Sapling", "!$Sapling_2", "!$Sapling_3", "!$Sapling_Apple", "!$Sapling_Apple_2", "!$Sapling_Apple_3"):
    s.append((Image.open(CH + nm + ".png").convert("RGBA").crop((48, 0, 96, 48)), nm.replace("!$", ""), grass, (0, 0)))
tiles(s)

title("Icons 493-513")
ic = []
for i in range(493, 514):
    idx = items[i]["iconIndex"]
    cellpic = iconset.crop(((idx % 16) * 32, (idx // 16) * 32, (idx % 16) * 32 + 32, (idx // 16) * 32 + 32))
    ic.append((cellpic, str(i), None, (0, 0)))
tiles(ic, cell=32)
d.text((10, y - 18), "  ".join("%d %s" % (i, items[i]["name"]) for i in range(493, 503)), font=font, fill=(200, 200, 190)); y += 2
d.text((10, y - 2), "  ".join("%d %s" % (i, items[i]["name"]) for i in range(503, 514)), font=font, fill=(200, 200, 190)); y += 22

sheet = sheet.crop((0, 0, W, y + 10))
sheet.convert("RGB").save(ROOT + "docs/uprawy/podglad.png")
print("docs/uprawy/podglad.png", sheet.size)
