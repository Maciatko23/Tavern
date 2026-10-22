# docs/rozszerzenia/C/grafika_podglad.png: cała grafika paczki C obok bohatera (Hero_Walk, kadr stojący) na trawie z kafla
# mapy (Map004: A2 rodzaj 0, Winlu), wszystko x2 (nearest); popiersia osobno w skali 1:1 (330x350) obok Hero_Bust.
#   python tools/rozszerzenia/C/art/podglad.py [out.png]
import os
import sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", "..", "..", ".."))
CH = os.path.join(GAME, "img", "characters")
PICS = os.path.join(GAME, "img", "pictures")
A2 = os.path.join(GAME, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "tilesets",
                  "Fantasy_Outside_A2_2_green.png")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(GAME, "docs", "rozszerzenia", "C", "grafika_podglad.png")
Z = 2


def font(sz):
    for f in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def cell(name, c, r, cols=3, rows=4):
    im = Image.open(os.path.join(CH, name + ".png")).convert("RGBA")
    w, h = im.width // cols, im.height // rows
    return im.crop((c * w, r * h, c * w + w, r * h + h))


def hero(row=0):
    im = Image.open(os.path.join(CH, "Hero_Walk.png")).convert("RGBA")
    return im.crop((0, row * 64, 64, row * 64 + 64))


GRASS = Image.open(A2).convert("RGBA").crop((24, 72, 72, 120))

# groups: (title, [(label, image), ...]) - everything at 1x here, drawn x2
G = [
    ("Postacie (arkusz $: dół / lewo / prawo / góra, kadr stojący) i osioł", [
        ("bohater", hero(0)),
        ("pasterz", cell("$Npc_Pasterz", 1, 0)), ("", cell("$Npc_Pasterz", 1, 1)), ("", cell("$Npc_Pasterz", 1, 2)), ("", cell("$Npc_Pasterz", 1, 3)),
        ("handlarz", cell("$Npc_Handlarz", 1, 0)), ("", cell("$Npc_Handlarz", 1, 1)), ("", cell("$Npc_Handlarz", 1, 2)),
        ("", cell("$Npc_Handlarz", 1, 3)),
        ("osioł k0", cell("!$Lud_Osiol", 0, 0)), ("k1 ogon", cell("!$Lud_Osiol", 1, 0)), ("k2 ucho", cell("!$Lud_Osiol", 2, 0)),
    ]),
    ("Węglarz: mielerz (wiersz 0 zimny / 1 tlący się, k0-k2 / 2 gotowy) i szałas; wóz handlarza", [
        ("bohater", hero(0)),
        ("mielerz w0", cell("!$Lud_Mielerz", 0, 0)), ("w1 k0", cell("!$Lud_Mielerz", 0, 1)), ("w1 k1", cell("!$Lud_Mielerz", 1, 1)),
        ("w1 k2", cell("!$Lud_Mielerz", 2, 1)), ("w2 gotowy", cell("!$Lud_Mielerz", 0, 2)),
        ("szałas", cell("!$Lud_Szalas", 0, 0)), ("wóz", cell("!$Lud_Woz", 0, 0)),
    ]),
    ("Koszar 5x4 (wnętrze przezroczyste), szyb (w0 / w1 zasypany), wylot jaskini", [
        ("bohater", hero(0)),
        ("koszar", cell("!$Lud_Koszar", 0, 0)), ("szyb w0", cell("!$Lud_Szyb", 0, 0)), ("szyb w1", cell("!$Lud_Szyb", 0, 1)),
        ("jaskinia", cell("!$Lud_Jaskinia", 0, 0)),
    ]),
    ("Groby Ługów (w0 zarośnięte / w1 oczyszczone), ławka; juk, skrzynia (w0 / w1 otwarta), stół w jaskini", [
        ("bohater", hero(0)),
        ("krzyż k0", cell("!$Lud_KrzyzStary", 0, 0)), ("k1", cell("!$Lud_KrzyzStary", 1, 0)), ("k2", cell("!$Lud_KrzyzStary", 2, 0)),
        ("w1 k0", cell("!$Lud_KrzyzStary", 0, 1)), ("w1 k1", cell("!$Lud_KrzyzStary", 1, 1)), ("w1 k2", cell("!$Lud_KrzyzStary", 2, 1)),
        ("ławka", cell("!$Lud_Lawka", 0, 0)), ("juk", cell("!$Lud_Juk", 0, 0)),
        ("skrzynia", cell("!$Lud_Skrzynia", 0, 0)), ("otwarta", cell("!$Lud_Skrzynia", 0, 1)), ("stół", cell("!$Lud_Stol", 0, 0)),
    ]),
]

GAP = 10            # px (1x) between pieces
PAD = 12
TITLE = 34          # px (2x) for a group's title
LABEL = 22          # px (2x) under the pieces

rows = []
for title, items in G:
    w = PAD + sum(im.width + GAP for _, im in items)
    h = max(im.height for _, im in items)
    rows.append((title, items, w, h))
W1 = max(r[2] for r in rows) + PAD
busts = [("Hero_Bust", "bohater"), ("Pasterz_Bust", "Pasterz_Bust"), ("Handlarz_Bust", "Handlarz_Bust")]
BW = 3 * 330 + 4 * 20
W = max(W1 * Z, BW)
H = sum(TITLE + (r[3] + 8) * Z + LABEL + 8 for r in rows) + TITLE + 350 + 20
sheet = Image.new("RGBA", (W, H), (40, 42, 50, 255))
d = ImageDraw.Draw(sheet)
F1, F2 = font(20), font(14)
y = 0
for title, items, w, h in rows:
    d.text((10, y + 6), title, fill=(255, 220, 90, 255), font=F1)
    y += TITLE
    # the grass strip (1x, then x2)
    strip = Image.new("RGBA", (W1, h + 8), (0, 0, 0, 255))
    for gy in range(0, strip.height, 48):
        for gx in range(0, strip.width, 48):
            strip.alpha_composite(GRASS, (gx, gy))
    x = PAD
    labels = []
    for lab, im in items:
        strip.alpha_composite(im, (x, h + 4 - im.height))
        labels.append((x, im.width, lab))
        x += im.width + GAP
    big = strip.resize((strip.width * Z, strip.height * Z), Image.NEAREST)
    sheet.alpha_composite(big, (0, y))
    y += big.height
    for x0, wd, lab in labels:
        if lab:
            tw = d.textlength(lab, font=F2)
            d.text((x0 * Z + (wd * Z - tw) / 2, y + 2), lab, fill=(230, 230, 236, 255), font=F2)
    y += LABEL + 8
d.text((10, y + 6), "Popiersia (1:1, jak pliki; w grze ok. 0,78) - bohater dla porównania", fill=(255, 220, 90, 255), font=F1)
y += TITLE
for i, (name, lab) in enumerate(busts):
    im = Image.open(os.path.join(PICS, name + ".png")).convert("RGBA")
    if name == "Hero_Bust":
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    x = 20 + i * (330 + 20)
    sheet.alpha_composite(im, (x, y))
    d.text((x + 4, y + 352 - 20), lab, fill=(230, 230, 236, 255), font=F2)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
sheet.convert("RGB").save(OUT)
print("ok", OUT, sheet.size)
