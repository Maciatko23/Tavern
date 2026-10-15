# Skórka okien "Grafit i miedź" (UITheme.js ładuje ją w wyglądzie Grafit): img/system/Window_Grafit.png z obecnej img/system/Window.png.
#   python tools/ui_grafit/make_skin.py
# Tło grafitowe, ramka: jedna cienka zaokrąglona linia (bez żółtych narożników), kursor: ciemniejszy grafit z miedzianym lewym
# brzegiem, strzałki i znak pauzy miedziane, paleta tekstu: kremowy tekst, miedziane etykiety (kolor 16), stonowane szarości.
import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SRC = os.path.join(ROOT, "img", "system", "Window.png")
DST = os.path.join(ROOT, "img", "system", "Window_Grafit.png")

GRAPHITE = (20, 21, 24, 255)
LINE = (64, 66, 72, 255)
COPPER = (208, 138, 90, 255)
CURSOR = (40, 42, 47, 255)
CURSOR_LINE = (58, 60, 66, 255)
# the text palette (index -> colour), the rest as it was
PALETTE = {
    0: (236, 230, 218), 6: (208, 138, 90), 7: (154, 149, 140), 8: (94, 90, 84), 12: (214, 210, 202), 13: (232, 228, 220),
    16: (208, 138, 90), 17: (224, 160, 110), 26: (138, 90, 58), 27: (64, 66, 72), 28: (208, 138, 90), 29: (170, 110, 72),
    30: (240, 234, 222), 31: (154, 149, 140),
}


def is_yellowish(p):
    r, g, b, a = p
    return a > 40 and r > 180 and g > 140 and b < 120


def main():
    src = Image.open(SRC).convert("RGBA")
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    # back (0,0,96,96): plain graphite
    d.rectangle((0, 0, 95, 95), fill=GRAPHITE)
    # pattern (0,96,96,96): none
    # frame (96,0,96,96): the arrows of the original (recoloured), one thin rounded line on the border
    for y in range(0, 96):
        for x in range(96, 192):
            p = src.getpixel((x, y))
            inner = 112 <= x < 176 and 16 <= y < 80
            if inner and is_yellowish(p):
                out.putpixel((x, y), COPPER[:3] + (p[3],))
    d.rounded_rectangle((96, 0, 191, 95), radius=10, outline=LINE, width=1)
    # cursor (96,96,48,48): darker graphite, a thin line, the copper left edge (the 9-slice stretches it along the row)
    d.rounded_rectangle((96, 96, 143, 143), radius=4, fill=CURSOR, outline=CURSOR_LINE, width=1)
    d.rectangle((96, 100, 97, 139), fill=COPPER)
    # the small arrows and the pause sign (144..192, 96..144): copper
    for y in range(96, 144):
        for x in range(144, 192):
            p = src.getpixel((x, y))
            if p[3] > 0:
                out.putpixel((x, y), (COPPER[:3] + (p[3],)) if is_yellowish(p) else p)
    # the text palette (96..192, 144..192): 8 x 4 cells of 12 px
    for i in range(32):
        cx, cy = 96 + (i % 8) * 12, 144 + (i // 8) * 12
        col = PALETTE.get(i)
        for y in range(cy, cy + 12):
            for x in range(cx, cx + 12):
                out.putpixel((x, y), (col + (255,)) if col else src.getpixel((x, y)))
    out.save(DST)
    print(DST)


if __name__ == "__main__":
    main()
