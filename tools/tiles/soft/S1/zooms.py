"""x3 / x4 zoom crops of the new S1 grounds next to Winlu grass (in-game before/after + the blocks themselves)."""
from PIL import Image, ImageDraw
from common import *

OUT = SCRATCH
crops = [  # spot, box (in the 1280x720 screenshots), zoom, label
    ("m003", (280, 280, 520, 440), 3, "Map003 path: Winlu k39 dirt (left) vs S1 mud (right)"),
    ("m020", (560, 330, 760, 500), 3, "Map020 yard path: dirt vs mud"),
    ("m021a", (860, 120, 1100, 300), 3, "Map021 road + forest floor"),
    ("m004", (420, 150, 660, 330), 3, "Map004 tree line: Winlu dark grass k46 vs S1 forest floor"),
    ("m023", (500, 60, 740, 240), 3, "Map023 forest edge"),
]
names = []
for spot, box, z, label in crops:
    a = Image.open("%s/%s_before.png" % (OUT, spot)).convert("RGB").crop(box)
    b = Image.open("%s/%s_after.png" % (OUT, spot)).convert("RGB").crop(box)
    w, h = a.size
    s = Image.new("RGB", (w * 2 * z + 12, h * z + 22), (16, 16, 16))
    s.paste(a.resize((w * z, h * z), Image.NEAREST), (0, 22))
    s.paste(b.resize((w * z, h * z), Image.NEAREST), (w * z + 12, 22))
    d = ImageDraw.Draw(s)
    d.text((4, 5), "BEFORE (Winlu)  |  " + label, fill=(255, 230, 0))
    d.text((w * z + 16, 5), "AFTER (Soft_S1_A2)", fill=(255, 230, 0))
    fn = "%s/zoom_x%d_%s.png" % (OUT, z, spot)
    s.save(fn)
    names.append(fn)

# the blocks at x4 over Winlu grass: Winlu k39 | S1 mud k39 | Winlu k46 | S1 forest k46 | S1 mud ground k24 tiled next to grass
S, N = a2(), Image.open(OUT_SHEET).convert("RGBA")
grass = body_tile(16, S)


def on_grass(blk):
    base = Image.new("RGBA", blk.size)
    for y in range(0, blk.size[1], 48):
        for x in range(0, blk.size[0], 48):
            base.paste(grass, (x, y))
    base.alpha_composite(blk)
    return base.convert("RGB")


panels = [("Winlu k39 dirt", on_grass(block(39, S))), ("S1 mud (k39)", on_grass(block(39, N))),
          ("Winlu k46 dark grass", on_grass(block(46, S))), ("S1 forest floor (k46)", on_grass(block(46, N)))]
g2 = Image.new("RGB", (96, 144))
for y in range(0, 144, 48):
    g2.paste(grass.convert("RGB"), (0, y))
    g2.paste(body_tile(24, N).convert("RGB"), (48, y))
panels.append(("Winlu grass | S1 mud ground k24", g2))
z = 4
s = Image.new("RGB", (len(panels) * (96 * z + 10), 144 * z + 22), (16, 16, 16))
d = ImageDraw.Draw(s)
for i, (lab, im) in enumerate(panels):
    s.paste(im.resize((96 * z, 144 * z), Image.NEAREST), (i * (96 * z + 10), 22))
    d.text((i * (96 * z + 10) + 4, 5), lab, fill=(255, 230, 0))
fn = "%s/zoom_x4_blocks.png" % OUT
s.save(fn)
names.append(fn)
print("\n".join(names))
