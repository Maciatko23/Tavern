# Arkusz kontrolny pochodni w ręku: 8 kierunków x wszystkie klatki chodu, biegu i skradania (powiększone), z płomieniem
# narysowanym tam, gdzie gra go stawia (tips.json) - do obejrzenia każdej klatki: czy dłoń trzyma trzonek.
#   python tools/torch/control_sheet.py [plik.png] [powiększenie]
import json, sys
from PIL import Image, ImageDraw
GAME = __file__.replace("\\", "/").rsplit("/tools/", 1)[0] + "/"
OUT = sys.argv[1] if len(sys.argv) > 1 else GAME + "docs/pochodnia/kontrola_klatek.png"
Z = int(sys.argv[2]) if len(sys.argv) > 2 else 4
CELL = 64
ROWS = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"]
tips = json.load(open(GAME + "tools/torch/tips.json", encoding="utf8"))
# a still flame like the game's (the campfire's colours), drawn on the tip: behind him on the "behind" rows
FLAME = [(0, -11, 1, "#b8321a"), (0, -10, 2, "#b8321a"), (0, -8, 3, "#ee6a1a"), (0, -6, 3, "#ee6a1a"), (0, -4, 3, "#ffb43a"), (0, -2, 2, "#fff1a6"), (0, -1, 2, "#ffb43a")]


def flame(img, x, y):
    d = ImageDraw.Draw(img)
    for dx, dy, hw, col in FLAME:
        for k in range(2):
            d.rectangle([x - hw, y + dy + k, x + hw - 1, y + dy + k], fill=col)



sheets = ["Hero_TorchWalk", "Hero_TorchRun", "Hero_TorchSneak"]
blocks = []
for name in sheets:
    im = Image.open(GAME + "img/characters/%s.png" % name).convert("RGBA")
    cols = im.width // CELL
    t = tips[name]
    block = Image.new("RGBA", (cols * CELL * Z, 8 * CELL * Z + 24), (52, 72, 56, 255))
    dr = ImageDraw.Draw(block)
    dr.text((6, 4), name + "  (wiersze: " + ", ".join(ROWS) + "; kolumna 0 = stoi; [Z] = dłoń schowana, pochodnia za nim)", fill=(255, 240, 160, 255))
    for r in range(8):
        for c in range(cols):
            cell = im.crop((c * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL))
            x, y, behind = t["tips"][r][c]
            lay = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
            flame(lay, int(round(x)), int(round(y)))
            if behind:
                comp = lay.copy()
                comp.alpha_composite(cell)
            else:
                comp = cell.copy()
                comp.alpha_composite(lay)
            big = comp.resize((CELL * Z, CELL * Z), Image.NEAREST)
            bx, by = c * CELL * Z, 24 + r * CELL * Z
            block.alpha_composite(big, (bx, by))
            dr.rectangle([bx, by, bx + CELL * Z - 1, by + CELL * Z - 1], outline=(30, 40, 32, 255))
            dr.text((bx + 4, by + 3), "%s %d%s" % (ROWS[r], c, " [Z]" if behind else ""), fill=(255, 255, 255, 255))
    blocks.append(block)
W = max(b.width for b in blocks)
H = sum(b.height for b in blocks)
out = Image.new("RGBA", (W, H), (30, 30, 30, 255))
y = 0
for b in blocks:
    out.alpha_composite(b, (0, y))
    y += b.height
out.save(OUT)
print("arkusz", OUT, out.size)
