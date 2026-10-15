# The contact sheet of tools/mood/capture.js: every scene as a row, before (left) and after (right), half size, with a caption.
#   python tools/mood/zestawienie.py  ->  docs/klimat/zestawienie.png (the main scenes)
#   python tools/mood/zestawienie.py --out mroczny_las.png las_poludnie mroczny_las_dzien mroczny_las_noc  ->  just these rows
import os
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
DIR = os.path.join(ROOT, "docs", "klimat")
FONT = os.path.join(ROOT, "fonts", "AlegreyaSans-Bold.ttf")
SCENES = [
    ("las_poludnie", "Las w południe (lato)"),
    ("zloty_zachod", "Złota godzina przed zachodem (łąka, lato)"),
    ("noc_ognisko", "Noc: ognisko i pochodnia"),
    ("tawerna_wieczor", "Tawerna wieczorem (22:00)"),
    ("burza", "Burza w pełni"),
    ("zima", "Zima w południe, prószy śnieg"),
    ("podziemia", "Podziemia: Komnata Serca"),
    ("jaskinia", "Jaskinia: obóz kopaczy"),
    ("walka_noc", "Walka nocą (winieta w trybie walki)"),
]
EXTRA = {
    "mroczny_las_dzien": "Mroczny Las w południe (lato)",
    "mroczny_las_noc": "Mroczny Las nocą, z pochodnią",
}
SCALE, GAP, CAP, HEAD = 0.5, 12, 34, 56
BG, FG, MUTED = (22, 23, 26), (236, 230, 218), (208, 138, 90)

args, out_name = sys.argv[1:], "zestawienie.png"
if len(args) >= 2 and args[0] == "--out":
    out_name, args = args[1], args[2:]
if args:
    titles = dict(SCENES, **EXTRA)
    SCENES = [(k, titles.get(k, k)) for k in args]
rows = [(k, t) for k, t in SCENES if os.path.exists(os.path.join(DIR, k + "_przed.png")) and os.path.exists(os.path.join(DIR, k + "_po.png"))]
w0, h0 = Image.open(os.path.join(DIR, rows[0][0] + "_przed.png")).size
cw, ch = int(w0 * SCALE), int(h0 * SCALE)
W = GAP * 3 + cw * 2
H = HEAD + len(rows) * (CAP + ch + GAP) + GAP
sheet = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(sheet)
big, small = ImageFont.truetype(FONT, 26), ImageFont.truetype(FONT, 20)
d.text((GAP + cw // 2, HEAD // 2), "PRZED (bez efektów)", fill=MUTED, font=big, anchor="mm")
d.text((GAP * 2 + cw + cw // 2, HEAD // 2), "PO (Mood.js: poświata, barwy, winieta)", fill=MUTED, font=big, anchor="mm")
y = HEAD
for key, title in rows:
    d.text((GAP, y + CAP // 2), title, fill=FG, font=small, anchor="lm")
    y += CAP
    for i, side in enumerate(("przed", "po")):
        im = Image.open(os.path.join(DIR, key + "_" + side + ".png")).convert("RGB").resize((cw, ch), Image.LANCZOS)
        sheet.paste(im, (GAP + i * (cw + GAP), y))
    y += ch + GAP
out = os.path.join(DIR, out_name)
sheet.save(out, optimize=True)
print(out, sheet.size)
