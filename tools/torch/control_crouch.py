# Arkusz kontrolny kucania z pochodnią (Hero_TorchCrouch: 4 kierunki x 17 klatek w dół; powrót to te same klatki wspak), powiększony,
# z płomieniem tam, gdzie stawia go gra (crouch_tips.json) -> docs/pochodnia/kontrola_kucanie.png
#   python tools/torch/control_crouch.py [plik.png] [powiększenie]
import json, sys
from PIL import Image, ImageDraw
sys.path.insert(0, __file__.replace("\\", "/").rsplit("/", 1)[0])
from control_sheet import flame, GAME
OUT = sys.argv[1] if len(sys.argv) > 1 else GAME + "docs/pochodnia/kontrola_kucanie.png"
Z = int(sys.argv[2]) if len(sys.argv) > 2 else 3
C = 96
ROWS = ["dół", "lewo", "prawo", "góra"]
t = json.load(open(GAME + "tools/torch/crouch_tips.json", encoding="utf8"))["tips"]
im = Image.open(GAME + "img/system/Hero_TorchCrouch.png").convert("RGBA")
cols = list(range(17))
y0, y1 = 22, 88   # (the figure's band of the cell)
out = Image.new("RGBA", (len(cols) * C * Z, 4 * (y1 - y0) * Z + 24), (52, 72, 56, 255))
d = ImageDraw.Draw(out)
d.text((6, 4), "Hero_TorchCrouch - kucanie z pochodnią (wiersze: " + ", ".join(ROWS) + "; klatki 0-16 w dół, potem to samo wspak)", fill=(255, 240, 160, 255))
for r in range(4):
    for k, c in enumerate(cols):
        cell = im.crop((c * C, r * C, (c + 1) * C, (r + 1) * C))
        x, y, behind = t[r][c]
        lay = Image.new("RGBA", (C, C), (0, 0, 0, 0))
        flame(lay, int(round(x)), int(round(y)))
        comp = cell.copy()
        comp.alpha_composite(lay)
        big = comp.crop((0, y0, C, y1)).resize((C * Z, (y1 - y0) * Z), Image.NEAREST)
        bx, by = k * C * Z, 24 + r * (y1 - y0) * Z
        out.alpha_composite(big, (bx, by))
        d.rectangle([bx, by, bx + C * Z - 1, by + (y1 - y0) * Z - 1], outline=(30, 40, 32, 255))
        d.text((bx + 4, by + 3), "%s %d" % (ROWS[r], c), fill=(255, 255, 255, 255))
out.save(OUT)
print("arkusz", OUT, out.size)
