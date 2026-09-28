"""Deliverable pictures for S3:
  pair_<spot>.png         before (Winlu) above, after (Soft_S3_A2) below, 1:1 in-game shots
  zoom_<spot>_x3.png      x3 crop of the new ground meeting Winlu grass, before | after
  zoom_synth_<g>_x4.png   x4: a small patch drawn with MZ's table on Winlu grass - Winlu block | S3 block
  python zooms.py <scratch>
"""
import os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "..", ".."))
import wang_to_a2_a as W
from refs import block

SCR = sys.argv[1]
SH = os.path.join(SCR, "shots")
OUT = SCR

CROPS = {   # spot: (x, y, w, h) at 1:1 (a place where the new ground meets Winlu grass)
    "m4_meadow": (600, 300, 320, 200),
    "m3_house": (180, 420, 320, 220),
    "m21_forest": (60, 170, 320, 220),
    "m21_forest2": (0, 0, 320, 220),
    "m20_yard": (560, 60, 320, 330),
    "m3_north": (0, 0, 320, 220),
}


def pair(spot):
    b = Image.open(os.path.join(SH, "before_%s.png" % spot)).convert("RGB")
    a = Image.open(os.path.join(SH, "after_%s.png" % spot)).convert("RGB")
    im = Image.new("RGB", (b.width, b.height * 2 + 6), (255, 0, 255))
    im.paste(b, (0, 0)); im.paste(a, (0, b.height + 6))
    im.save(os.path.join(OUT, "pair_%s.png" % spot))
    x, y, w, h = CROPS[spot]
    cb = b.crop((x, y, x + w, y + h)).resize((w * 3, h * 3), Image.NEAREST)
    ca = a.crop((x, y, x + w, y + h)).resize((w * 3, h * 3), Image.NEAREST)
    z = Image.new("RGB", (w * 6 + 8, h * 3), (255, 0, 255))
    z.paste(cb, (0, 0)); z.paste(ca, (w * 3 + 8, 0))
    z.save(os.path.join(OUT, "zoom_%s_x3.png" % spot))


def synth(name, kind, ours_path):
    table = W.mz_table()
    grid = [[False] * 6 for _ in range(5)]
    for (x, y) in [(1, 1), (2, 1), (3, 1), (1, 2), (2, 2), (3, 2), (4, 2), (2, 3), (4, 3), (4, 1)]:
        grid[y][x] = True
    grid[3][0] = True           # an isolated cell
    base = block(16).crop((24, 72, 72, 120)).convert("RGBA")
    ims = [W.render_mz(grid, b, base, table) for b in (block(kind).convert("RGBA"), Image.open(ours_path).convert("RGBA"))]
    w, h = ims[0].size
    z = Image.new("RGB", (w * 8 + 8, h * 4), (255, 0, 255))
    for i, im in enumerate(ims):
        z.paste(im.convert("RGB").resize((w * 4, h * 4), Image.NEAREST), (i * (w * 4 + 8), 0))
    z.save(os.path.join(OUT, "zoom_synth_%s_x4.png" % name))


if __name__ == "__main__":
    for s in CROPS:
        if os.path.exists(os.path.join(SH, "after_%s.png" % s)):
            pair(s)
    synth("mud_k39", 39, os.path.join(SCR, "a2", "k39_w6.png"))
    synth("forest_k46", 46, os.path.join(SCR, "a2", "k46_w6.png"))
    print("ok")
