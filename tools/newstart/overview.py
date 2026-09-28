# python overview.py <map003.png> <map008.png> <map019 game view.png> <out.png>
# One picture of the new start: every map as a small picture where it lies, the exits joined by lines (from layout.py).
import sys, os
from PIL import Image, ImageDraw, ImageFont
from layout import MAPS, transfers
HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, "..", "..", "docs", "nowy_start")
m3, m8, m19, out = sys.argv[1:5]
PX = 8     # pixels per tile in the overview
SIZE = {k: v["size"] for k, v in MAPS.items()}
SIZE.update({3: (40, 30), 8: (30, 24)})
NAME = {k: v["name"] for k, v in MAPS.items()}
NAME.update({3: "Domek - Zewnętrze (pole dziadka)", 8: "Okolice Tawerny (pusta mapa)"})
G = 6
POS = {22: (0, 0), 21: (40 + G, 0), 23: (0, 30 + G), 3: (-40 - G, 30 + G)}
POS[20] = (POS[21][0] + 19 - 14, -22 - G)
POS[8] = (11 - 13, -24 - G - 30)
POS[24] = (POS[8][0] + 30 + G, POS[8][1] + 10 - 14)
POS[19] = (POS[20][0] + 30 + G, POS[20][1])
PIC = {20: os.path.join(DOCS, "20_dom_dziadka_podworze.png"), 21: os.path.join(DOCS, "21_lesna_droga.png"),
       22: os.path.join(DOCS, "22_polna_droga.png"), 23: os.path.join(DOCS, "23_skraj_lasu.png"),
       24: os.path.join(DOCS, "24_posiadlosc_lorda.png"), 3: m3, 8: m8}
minx = min(x for x, y in POS.values()) - 2
miny = min(y for x, y in POS.values()) - 5
maxx = max(POS[k][0] + SIZE[k][0] for k in POS) + 26
maxy = max(POS[k][1] + SIZE[k][1] for k in POS) + 5
W, H = (maxx - minx) * PX, (maxy - miny) * PX
img = Image.new("RGB", (W, H), (24, 26, 30))
d = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 15)
    small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 12)
except Exception:
    font = small = ImageFont.load_default()
def at(mid, x, y):
    px, py = POS[mid]
    return ((px + x - minx) * PX + PX // 2, (py + y - miny) * PX + PX // 2)
for mid, (px, py) in POS.items():
    w, h = SIZE[mid]
    box = ((px - minx) * PX, (py - miny) * PX)
    if mid == 19:
        pic = Image.open(m19).convert("RGB").crop((244, 0, 1036, 720))
    else:
        pic = Image.open(PIC[mid]).convert("RGB")
    img.paste(pic.resize((w * PX, h * PX), Image.LANCZOS), box)
    d.rectangle([box[0] - 1, box[1] - 1, box[0] + w * PX, box[1] + h * PX], outline=(230, 200, 60), width=2)
    label = "%s  (Map%03d%s)" % (NAME[mid], mid, ", nowa" if mid in MAPS else "")
    d.text((box[0] + 2, box[1] - 19), label, fill=(255, 235, 120), font=font)
seen = set()
for fm, x, y, tm, tx, ty, dr, kind in transfers():
    key = tuple(sorted([fm, tm]))
    if key in seen: continue
    seen.add(key)
    # the middle tile of this exit and of the matching one
    a = [(xx, yy) for f2, xx, yy, t2, *_ in transfers() if f2 == fm and t2 == tm]
    b = [(xx, yy) for f2, xx, yy, t2, *_ in transfers() if f2 == tm and t2 == fm]
    ax, ay = a[len(a) // 2]; bx, by = b[len(b) // 2]
    p, q = at(fm, ax, ay), at(tm, bx, by)
    d.line([p, q], fill=(255, 90, 60), width=4)
    for c in (p, q): d.ellipse([c[0] - 6, c[1] - 6, c[0] + 6, c[1] + 6], fill=(255, 90, 60))
d.text((8, H - 20), "Czerwone linie: przejścia (w obie strony). Gra zaczyna się w Domu dziadka (wnętrze), obok posłania bohatera.", fill=(220, 220, 220), font=small)
img.save(out)
print("saved", out, img.size)
