# Zestawienie makiet 11-16 -> docs/ekran_tytulowy/zestawienie_2.png
import os, glob
from PIL import Image, ImageDraw
from tytul import OUT, font, text, hexc

NAMES = ["Prom o świcie", "Latarnia w morskiej mgle", "Susza", "Wisiorek z krukiem", "Biały orzeł nad granią", "Kronika zakonu"]
files = sorted(glob.glob(os.path.join(OUT, "tytul_1[1-6]_*.png")))
TW, TH, GAP, COLS = 600, 338, 16, 2
rows = (len(files) + COLS - 1) // COLS
W = GAP + COLS * (TW + GAP)
H = 70 + rows * (TH + 44)
img = Image.new("RGBA", (W, H), hexc("#121316"))
text(img, (GAP, 16), "Tawerna · propozycje ekranu tytułowego 11-16", font("AlegreyaSans-Medium.ttf", 30), "#d08a5a")
d = ImageDraw.Draw(img)
for i, f in enumerate(files):
    c, r = i % COLS, i // COLS
    x, y = GAP + c * (TW + GAP), 70 + r * (TH + 44)
    text(img, (x, y), f"{i + 11}. {NAMES[i]}", font("AlegreyaSans-Bold.ttf", 19), "#ece6da")
    th = Image.open(f).convert("RGBA").resize((TW, TH), Image.LANCZOS)
    d.rectangle((x - 1, y + 27, x + TW, y + 28 + TH), outline=hexc("#d08a5a"))
    img.alpha_composite(th, (x, y + 28))
img.convert("RGB").save(os.path.join(OUT, "zestawienie_2.png"), optimize=True)
print(img.size, len(files))
