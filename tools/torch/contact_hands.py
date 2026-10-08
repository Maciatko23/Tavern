# A contact sheet of the tracked torch hand on a walking sheet (x4, a red cross on the grip) - to check the measurement by eye.
#   python tools/torch/contact_hands.py Hero_Walk out.png
import sys
from PIL import Image, ImageDraw
sys.path.insert(0, __file__.replace("\\", "/").rsplit("/", 1)[0])
from measure_hands import GAME, CELL, ROWS, track

name, out = sys.argv[1], sys.argv[2]
im = Image.open(GAME + "img/characters/%s.png" % name).convert("RGBA")
Z = 4
cols = im.width // CELL
sheet = Image.new("RGBA", (cols * CELL * Z, 8 * CELL * Z), (110, 150, 110, 255))
big = im.resize((im.width * Z, im.height * Z), Image.NEAREST)
sheet.alpha_composite(big)
d = ImageDraw.Draw(sheet)
for r in range(8):
    for c, (x, y, n) in enumerate(track(im, r)):
        X, Y = (c * CELL + x) * Z, (r * CELL + y) * Z
        col = (255, 0, 0, 255) if n > 0 else (0, 0, 255, 255)
        d.line([(X - 6, Y), (X + 6, Y)], fill=col, width=2)
        d.line([(X, Y - 6), (X, Y + 6)], fill=col, width=2)
        d.text((c * CELL * Z + 3, r * CELL * Z + 3), "%s %d" % (ROWS[r], c), fill=(255, 255, 255, 255))
sheet.save(out)
