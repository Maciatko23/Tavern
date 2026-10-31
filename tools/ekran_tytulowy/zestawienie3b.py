# Zestawienie makiet 27-36 -> docs/ekran_tytulowy/zestawienie_3b.png
import os, glob
from PIL import Image, ImageDraw
from tytul import OUT, font, text, hexc

NAMES = ["Biblioteka w głębi podziemi", "Noc Kupały", "Atlas na stole", "Szyld Pod Złotym Kuflem", "Garnizon o świcie", "Pustelnia na klifie", "Wiosna", "Pies przy chacie", "Krąg menhirów w mgle", "Dwór Lorda nocą"]
files = [f for f in sorted(glob.glob(os.path.join(OUT, "tytul_[23][0-9]_*.png"))) if 27 <= int(os.path.basename(f)[6:8]) <= 36]
TW, TH, GAP, COLS = 600, 338, 16, 2
rows = (len(files) + COLS - 1) // COLS
W = GAP + COLS * (TW + GAP)
H = 70 + rows * (TH + 44)
img = Image.new("RGBA", (W, H), hexc("#121316"))
text(img, (GAP, 16), "Tawerna · propozycje ekranu tytułowego 27-36", font("AlegreyaSans-Medium.ttf", 30), "#d08a5a")
d = ImageDraw.Draw(img)
for i, f in enumerate(files):
    c, r = i % COLS, i // COLS
    x, y = GAP + c * (TW + GAP), 70 + r * (TH + 44)
    text(img, (x, y), f"{i + 27}. {NAMES[i]}", font("AlegreyaSans-Bold.ttf", 19), "#ece6da")
    th = Image.open(f).convert("RGBA").resize((TW, TH), Image.LANCZOS)
    d.rectangle((x - 1, y + 27, x + TW, y + 28 + TH), outline=hexc("#d08a5a"))
    img.alpha_composite(th, (x, y + 28))
img.convert("RGB").save(os.path.join(OUT, "zestawienie_3b.png"), optimize=True)
print(img.size, len(files))
