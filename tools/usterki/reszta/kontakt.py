# kontakt.py MAP minwaga out : arkusz wycinkow z przegladu (docs/przeglad_ekranow/<map>/<id>.png) wierszy o wadze >= minwaga
import sys, os, json
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
mid, minw, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
rows = [r for r in json.load(open(os.path.join(ROOT, "docs/przeglad_ekranow/lista.json"), encoding="utf-8")) if r["mapa"] == mid and r["waga"] >= minw]
ims = []
for r in rows:
    p = os.path.join(ROOT, "docs/przeglad_ekranow", str(mid), r["id"] + ".png")
    if not os.path.exists(p): continue
    im = Image.open(p).convert("RGB"); im.thumbnail((380, 260)); ims.append((r["id"], r["kod_detektora"], im))
cols = 3; cw, ch = 390, 285
rows_n = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cw, rows_n * ch), (30, 30, 30)); d = ImageDraw.Draw(sheet)
for i, (id_, code, im) in enumerate(ims):
    x, y = (i % cols) * cw, (i // cols) * ch
    sheet.paste(im, (x + 5, y + 22)); d.text((x + 6, y + 5), "%d/%s %s" % (mid, id_, code), fill=(255, 255, 0))
sheet.save(out); print(sheet.size, len(ims))
