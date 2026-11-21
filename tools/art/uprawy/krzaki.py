# Gather_Bush_4 (blackberries: Bush_1's red berries recoloured black-purple, a quarter of the clusters left red = unripe) and
# Gather_Bush_5 (hazel: Bush_2's green bush + clusters of hazelnuts in frilly husks)
import os, colorsys
from PIL import Image
ROOT = "c:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/img/system/"
S = os.path.dirname(os.path.abspath(__file__))

def is_berry(p): return p[3] and p[0] > p[1] + 30 and p[0] > p[2] + 15
b1 = Image.open(ROOT + "Gather_Bush_1.png").convert("RGBA"); W, H = b1.size; px = b1.load()
# berry clusters (4-connected)
seen = set(); comps = []
for y in range(H):
    for x in range(W):
        if (x, y) in seen or not is_berry(px[x, y]): continue
        st = [(x, y)]; seen.add((x, y)); comp = []
        while st:
            cx, cy = st.pop(); comp.append((cx, cy))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in seen and is_berry(px[nx, ny]):
                    seen.add((nx, ny)); st.append((nx, ny))
        comps.append(comp)
comps.sort(key=lambda c: (min(p[1] for p in c), min(p[0] for p in c)))
out = b1.copy(); op = out.load()
for i, comp in enumerate(comps):
    if len(comp) >= 4 and i % 4 == 2: continue   # (unripe: stays red)
    for (x, y) in comp:
        r, g, b, a = px[x, y]
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s < 0.6 and v > 0.85:                  # the whitish highlight -> a cool lavender shine
            nr, ng, nb = 0.62, 0.58, 0.74
        else:
            nr, ng, nb = colorsys.hsv_to_rgb(0.78, 0.42, 0.07 + v * 0.27)
        op[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
out.save(ROOT + "Gather_Bush_4.png")
print("Bush_4 clusters", len(comps))

# hazel
b2 = Image.open(ROOT + "Gather_Bush_2.png").convert("RGBA"); hp = b2.load()
OUT = (58, 38, 22, 255); NUT = [(118, 72, 36, 255), (168, 108, 54, 255), (214, 160, 96, 255)]
HUSK = [(78, 128, 52, 255), (150, 198, 88, 255), (196, 228, 124, 255)]
NUT1 = [".oo.", "osno", "onDo", ".oo."]   # one round nut: outline (o), shine (s), nut (n), dark (D)
def put(p, x, y, c, img):
    if 0 <= x < img.width and 0 <= y < img.height: p[x, y] = c
def nut(img, x0, y0):
    p = img.load()
    for j, row in enumerate(NUT1):
        for i, ch in enumerate(row):
            if ch != ".": put(p, x0 + i, y0 + j, {"o": OUT, "n": NUT[1], "s": NUT[2], "D": NUT[0]}[ch], img)
def cluster(img, x, y, flip):
    p = img.load()
    # the frilly husks first (light green leaves round the top), then three nuts back to front
    for (dx, dy, c) in ((0, 0, 2), (1, -1, 1), (2, 0, 2), (4, -1, 1), (5, 0, 2), (6, 1, 1), (-1, 2, 1), (3, 1, 2)):
        put(p, x + (6 - dx if flip else dx), y + dy, HUSK[c], img)
    for (dx, dy) in ((1, 1), (4, 2), (2, 4)):
        nut(img, x + (5 - dx if flip else dx) - (1 if flip else 0), y + dy)
for k, (x, y) in enumerate(((8, 8), (25, 6), (16, 17), (31, 16), (5, 25), (21, 26), (32, 28))):
    cluster(b2, x, y, k % 2 == 1)
b2.save(ROOT + "Gather_Bush_5.png")
sheet = Image.new("RGBA", (W * 4 + 24, H), (70, 110, 60, 255))
for i, n in enumerate((1, 4, 2, 5)):
    sheet.alpha_composite(Image.open(ROOT + "Gather_Bush_%d.png" % n).convert("RGBA"), (i * (W + 6), 0))
sheet.resize((sheet.width * 5, sheet.height * 5), Image.NEAREST).save(S + "/krzaki_podglad.png")
