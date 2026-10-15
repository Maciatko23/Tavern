# Zestawienie 10 makiet ekranu tytułowego -> docs/ekran_tytulowy/zestawienie.png
import os, glob
from PIL import Image, ImageDraw
from tytul import OUT, font, text, hexc

NAMES = ["Tawerna w deszczu", "Kufel przy kominku", "Przekrój do Serca", "Chata dziadka o świcie", "Ognisko i wilki",
         "Kruk na szyldzie", "Burza nad tawerną", "Atlas Kruczej Wyspy", "Zima", "Komnata Serca"]
files = sorted(glob.glob(os.path.join(OUT, "tytul_*.png")))
TW, TH, GAP, COLS = 480, 270, 16, 4
rows = (len(files) + COLS - 1) // COLS
W = GAP + COLS * (TW + GAP)
H = 70 + rows * (TH + 44)
img = Image.new("RGBA", (W, H), hexc("#121316"))
text(img, (GAP, 16), "Tawerna · 10 propozycji ekranu tytułowego", font("AlegreyaSans-Medium.ttf", 30), "#d08a5a")
d = ImageDraw.Draw(img)
for i, f in enumerate(files):
    c, r = i % COLS, i // COLS
    x, y = GAP + c * (TW + GAP), 70 + r * (TH + 44)
    text(img, (x, y), f"{i + 1}. {NAMES[i]}", font("AlegreyaSans-Bold.ttf", 19), "#ece6da")
    th = Image.open(f).convert("RGBA").resize((TW, TH), Image.LANCZOS)
    d.rectangle((x - 1, y + 27, x + TW, y + 28 + TH), outline=hexc("#d08a5a"))
    img.alpha_composite(th, (x, y + 28))
img.convert("RGB").save(os.path.join(OUT, "zestawienie.png"), optimize=True)
print(img.size, len(files))
