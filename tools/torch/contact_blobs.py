# Every skin blob between the belt and the knees on one row of a walking sheet, numbered (x6) - to pick the torch hand by eye
# where the tracking goes wrong.   python tools/torch/contact_blobs.py Hero_Run 1 out.png
import sys
from PIL import Image, ImageDraw
sys.path.insert(0, __file__.replace("\\", "/").rsplit("/", 1)[0])
from measure_hands import GAME, CELL, ROWS, hand_blobs

name, row, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
LO, HI = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (22, 47)
im = Image.open(GAME + "img/characters/%s.png" % name).convert("RGBA")
Z = 6
cols = im.width // CELL
sheet = Image.new("RGBA", (cols * CELL * Z, CELL * Z), (110, 150, 110, 255))
strip = im.crop((0, row * CELL, im.width, (row + 1) * CELL))
sheet.alpha_composite(strip.resize((strip.width * Z, CELL * Z), Image.NEAREST))
d = ImageDraw.Draw(sheet)
for c in range(cols):
    cell = im.crop((c * CELL, row * CELL, (c + 1) * CELL, (row + 1) * CELL))
    d.text((c * CELL * Z + 4, 4), "%s %d" % (ROWS[row], c), fill=(255, 255, 255, 255))
    for i, b in enumerate([b for b in hand_blobs(cell, LO, HI) if b[3] >= 3]):
        X, Y = (c * CELL + b[0]) * Z, b[1] * Z
        d.rectangle([X - 9, Y - 9, X + 9, Y + 9], outline=(255, 0, 0, 255), width=2)
        d.text((X + 11, Y - 8), "%d" % i, fill=(255, 255, 0, 255))
        d.text((c * CELL * Z + 4, 20 + i * 12), "%d: %.0f,%.0f n%d" % (i, b[0], b[1], b[3]), fill=(255, 255, 0, 255))
sheet.save(out)
