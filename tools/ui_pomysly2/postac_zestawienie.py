import os
from PIL import Image, ImageDraw
from common2 import *
ROWS = [("A · Podzakładki: Statystyki / Ekwipunek / Umiejętności", ["postac_A.png", "postac_A_ekwipunek.png", "postac_A_umiejetnosci.png"]),
        ("B · Jeden ekran: statystyki | postać z ekwipunkiem | umiejętności", ["postac_B.png", "postac_B_ekwipunek.png", "postac_B_drzewko.png"]),
        ("C · „Co to daje”: podgląd +1 w miejscu", ["postac_C.png", "postac_C_ekwipunek.png", "postac_C_drzewko.png"])]
COLS = ["zaznaczony atrybut", "zaznaczona komórka ekwipunku", "drzewko umiejętności"]
TW_, TH_, GAP = 600, 338, 16
W_ = GAP + 3 * (TW_ + GAP)
H_ = 64 + 3 * (TH_ + 40)
img = Image.new("RGBA", (W_, H_), hexc("#121316"))
text(img, (GAP, 14), "Zakładka Postać · 3 układy (Grafit i miedź)", font("AlegreyaSans-Medium.ttf", 30), "#d08a5a")
for c, n in enumerate(COLS):
    text(img, (GAP + c * (TW_ + GAP) + TW_, 24), n, font("AlegreyaSans-Regular.ttf", 16), "#9aa0a6", anchor="ra")
d = ImageDraw.Draw(img)
for r, (name, files) in enumerate(ROWS):
    y = 64 + r * (TH_ + 40)
    text(img, (GAP, y + 4), name, font("AlegreyaSans-Bold.ttf", 20), "#ece6da")
    for c, f in enumerate(files):
        x = GAP + c * (TW_ + GAP)
        th = Image.open(os.path.join(OUT2, f)).convert("RGBA").resize((TW_, TH_), Image.LANCZOS)
        d.rectangle((x - 1, y + 31, x + TW_, y + 32 + TH_), outline=hexc("#d08a5a"))
        img.alpha_composite(th, (x, y + 32))
img.convert("RGB").save(os.path.join(OUT2, "postac_zestawienie.png"), optimize=True)
print(img.size)
