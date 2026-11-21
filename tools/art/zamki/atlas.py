# 2026-11-19: the lockpicking mini-game's pictures (PixelLab, tools/art/zamki/raw) into one sheet img/system/Zamki_Gra.png and their
# rectangles into tools/art/zamki/atlas.json (pasted into js/plugins/Zamki_Gra.js, ART). Run: python tools/art/zamki/atlas.py
import json, os
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..")
RAW = os.path.join(os.path.dirname(__file__), "raw")
body = Image.open(os.path.join(RAW, "zamek_korpus.png")).convert("RGBA")
pins = Image.open(os.path.join(RAW, "zapadki.png")).convert("RGBA")
tools = Image.open(os.path.join(RAW, "wytrych.png")).convert("RGBA")
gauge = Image.open(os.path.join(RAW, "manometr.png")).convert("RGBA")
bell = Image.open(os.path.join(RAW, "dzwonek.png")).convert("RGBA")

# ---- the body: the chambers (dark runs across row 36), the line (the housing's bottom), the plug, the keyway
a = body.load()
dark = lambda x, y: a[x, y][3] > 0 and sum(a[x, y][:3]) < 110
runs, x = [], 60
while x < 200:
    if dark(x, 36):
        s = x
        while x < 200 and dark(x, 36): x += 1
        if x - s >= 6: runs.append((s, x))
    x += 1
assert len(runs) == 6, runs
centres = [(s + e - 1) / 2 for s, e in runs]
print("chambers", runs)
# the housing's bottom edge (the shear line) and the keyway's top, under the second chamber
cx = int(centres[1])
col = [(y, sum(a[cx, y][:3]) if a[cx, y][3] else -1) for y in range(15, 95)]
# the line: the dark seam running right across under the chambers; the keyway: the next wide dark band in the plug
line = next(y for y in range(45, 66) if sum(1 for x in range(70, 190) if dark(x, y)) > 100)
key_top = next(y for y in range(line + 6, 90) if sum(1 for x in range(70, 180) if dark(x, y)) > 90)
print("line", line, "keyway top", key_top)
# a hole drilled in the plug under every chamber (the key pins sit in it): the chamber's own dark, a darker rim
for (s, e) in runs:
    inner = a[(s + e) // 2, 40]
    for y in range(line + 1, key_top):
        for x in range(s + 1, e - 1):
            a[x, y] = inner
        a[s, y] = (28, 20, 12, 255); a[e - 1, y] = (28, 20, 12, 255)
bb = body.getbbox()
L0, R1 = bb[0], bb[2]
seg = int(round(centres[2] - centres[1]))
cut1 = int(round((centres[0] + centres[1]) / 2))             # the left end keeps the first chamber
cut2 = cut1 + seg                                             # one chamber's segment (the second)
cutR = int(round((centres[4] + centres[5]) / 2)) + seg        # the right end after the sixth
parts = {
    "bodyL": body.crop((L0, bb[1], cut1, bb[3])),
    "bodySeg": body.crop((cut1, bb[1], cut2, bb[3])),
    "bodyR": body.crop((cutR - 0, bb[1], R1, bb[3])),
}
geo = { "top": bb[1], "chamberTop": None, "line": line, "keyTop": key_top, "firstCx": centres[0] - L0, "seg": seg,
        "cut1": cut1 - L0, "chamberW": runs[0][1] - runs[0][0] }
# the chamber's top (where the spring hangs from): the first dark row from the top in the chamber's middle
seen_light = False
for y in range(bb[1], line):
    d = dark(int(centres[0]), y)
    if not d: seen_light = True
    elif seen_light: geo["chamberTop"] = y; break

# ---- the pins: the short key pin (top cap, a middle row to stretch, the pointed foot), a driver pin, the spring
def crop(im, box): return im.crop(box)
kp = (15, 24, 21, 46)
k = pins.crop(kp)
kh = k.size[1]
parts["keyTop"] = k.crop((0, 0, k.size[0], 3))
parts["keyMid"] = k.crop((0, 8, k.size[0], 9))
parts["keyTip"] = k.crop((0, kh - 7, k.size[0], kh))
parts["driver"] = pins.crop((41, 27, 49, 46))
parts["spring"] = pins.crop((71, 12, 79, 48))
# ---- the pick: its handle, one column of its shaft, its hooked tip; the wrench's bent end (mirrored: the bend to the left)
p = tools.load()
parts["pickHandle"] = tools.crop((35, 10, 78, 22))
parts["pickShaft"] = tools.crop((100, 10, 101, 22))
parts["pickTip"] = tools.crop((139, 10, 150, 22))
parts["wrench"] = tools.crop((96, 27, 127, 40)).transpose(Image.FLIP_LEFT_RIGHT)
parts["gauge"] = gauge.crop(gauge.getbbox())
parts["bell"] = bell.crop(bell.getbbox())
gb = gauge.getbbox()
geo["gaugeHub"] = [47 - gb[0], 44 - gb[1]]

# ---- the sheet: a row each
W = max(im.size[0] for im in parts.values()) + 4
y, rects = 0, {}
order = list(parts)
sheetW = 0
for n in order: sheetW = max(sheetW, parts[n].size[0])
H = sum(parts[n].size[1] + 2 for n in order)
sheet = Image.new("RGBA", (sheetW, H), (0, 0, 0, 0))
for n in order:
    im = parts[n]
    sheet.alpha_composite(im, (0, y))
    rects[n] = [0, y, im.size[0], im.size[1]]
    y += im.size[1] + 2
out = os.path.join(ROOT, "img", "system", "Zamki_Gra.png")
sheet.save(out)
json.dump({"rects": rects, "geo": geo}, open(os.path.join(os.path.dirname(__file__), "atlas.json"), "w"), indent=1)
print(json.dumps({"rects": rects, "geo": geo}))
