# -*- coding: utf-8 -*-
"""docs/questy_pustelnia/{before,after}/NN_nazwa.png -> docs/questy_pustelnia/NN_nazwa.png (przed | po, podpisane) + zestawienie.png (siatka)."""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
D = os.path.join(ROOT, "docs", "questy_pustelnia")
LABEL = {
    "01_kaplica_pulpit": "K50/D23: pulpit w kaplicy (Map178), Kleofas czyta z bohaterem",
    "02_kruczarnia_zerdz": "D24/K51: zerdzie kruczarni pod wieza (Map008), mlody kruk",
    "03_kruk_przystan_droga": "K51 przystanek 1: wschodnia droga przystani (Map125)",
    "04_kruk_kruczy_jar": "K51 przystanek 2: Kruczy Jar, droga do bramy miasta (Map003)",
    "05_kruk_brama_miasta": "K51 przystanek 3: za poludniowa brama miasta (Map008)",
    "06_rynna_1": "K53: rynna 1 na murze (Map008, 117,41)", "07_rynna_2": "K53: rynna 2 (117,64)",
    "08_rynna_3": "K53: rynna 3 (2,54)", "09_rynna_4": "K53: rynna 4 (2,92)",
    "10_widok_dzwonnica": "D40: schody dzwonnicy (Map108)", "11_widok_kruczarnia": "D40: pod wieza kruczarni (Map008)",
    "12_kopiec_orla_gran": "K68: kopiec z krukiem na szczycie Orlej Grani (Map175)", "13_fundament_garnizon": "K68: fundament strazy obok garnizonu (Map162)",
}
def font(n):
    for f in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        if os.path.exists(f): return ImageFont.truetype(f, n)
    return ImageFont.load_default()
names = sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(D, "after", "*.png")))
pairs = []
for n in names:
    b, a = os.path.join(D, "before", n + ".png"), os.path.join(D, "after", n + ".png")
    if not os.path.exists(b): continue
    ib, ia = Image.open(b).convert("RGB"), Image.open(a).convert("RGB")
    w, h = ib.size
    im = Image.new("RGB", (w * 2 + 12, h + 40), (20, 20, 24))
    d = ImageDraw.Draw(im)
    im.paste(ib, (0, 40)); im.paste(ia, (w + 12, 40))
    d.text((8, 6), "PRZED", fill=(200, 200, 200), font=font(22)); d.text((w + 20, 6), "PO   " + LABEL.get(n, n), fill=(255, 226, 122), font=font(22))
    im.save(os.path.join(D, n + ".png")); pairs.append(im)
if pairs:
    tw = 640; cols = 2
    th = [int(p.height * tw / p.width) for p in pairs]
    rows = (len(pairs) + cols - 1) // cols
    rh = max(th) + 6
    sheet = Image.new("RGB", (cols * (tw + 6) + 6, rows * rh + 6), (12, 12, 14))
    for i, p in enumerate(pairs):
        sheet.paste(p.resize((tw, th[i]), Image.LANCZOS), (6 + (i % cols) * (tw + 6), 6 + (i // cols) * rh))
    sheet.save(os.path.join(D, "zestawienie.png")); print("zestawienie.png", sheet.size)
print(len(pairs), "par")
