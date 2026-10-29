# Skórka okien w jednym wyglądzie gry (docs/UI_JEDEN_WYGLAD.md): img/system/Window.png - czarne tło, jedna cienka szara
# zaokrąglona ramka (bez żółtych narożników), zaznaczony wiersz ciemnożółty jak w menu P (MenuRing.js: K.accDim), strzałki i znak
# pauzy jasnożółte, tabela barw tekstu \C[n] taka jak była (0 jasny tekst #eceef0, 16 żółte etykiety #ffd23f ...).
#   python tools/ui_jeden_wyglad/make_skin.py
# Kolory = paleta UIStyle.C z js/plugins/UITheme.js. Strzałki, znak pauzy i tabelę barw bierze z obecnego Window.png (przepisuje je
# bez zmian), więc można go uruchomić ponownie. Poprzednie skórki (klasyczna z narożnikami i „Grafit” z miedzią) są w archiwum:
# ..\Tawerna_archiwum_2026-10-18\pliki\img\system\.
import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SKIN = os.path.join(ROOT, "img", "system", "Window.png")

SOLID = (11, 12, 15, 255)        # UIStyle.C.solid
LINE = (58, 62, 70, 255)         # UIStyle.C.line
ACCENT = (255, 210, 63)          # UIStyle.C.accent
CURSOR = (92, 76, 24, 255)       # UIStyle.C.accentDark (MenuRing: the chosen row's fill)


def is_yellowish(p):
    r, g, b, a = p
    return a > 40 and r > 180 and g > 140 and b < 120


def main():
    src = Image.open(SKIN).convert("RGBA")
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    # the back (0,0,96,96): plain black; the pattern under it (0,96,96,96): none
    d.rectangle((0, 0, 95, 95), fill=SOLID)
    # the frame (96,0,96,96): one thin rounded line on the border; the scroll arrows in the middle kept (bright yellow)
    for y in range(0, 96):
        for x in range(96, 192):
            p = src.getpixel((x, y))
            if 112 <= x < 176 and 16 <= y < 80 and is_yellowish(p):
                out.putpixel((x, y), ACCENT + (p[3],))
    d.rounded_rectangle((96, 0, 191, 95), radius=10, outline=LINE, width=1)
    # the cursor (96,96,48,48): the chosen row filled dark yellow, rounded like the P menu's rows (the 9-slice keeps 4 px corners)
    d.rounded_rectangle((96, 96, 143, 143), radius=4, fill=CURSOR)
    # the pause sign (144..192, 96..144) and the text colours (96..192, 144..192): as they are
    for y in range(96, 192):
        for x in range(96, 192):
            if x >= 144 or y >= 144:
                p = src.getpixel((x, y))
                if y < 144 and p[3] > 0 and is_yellowish(p):
                    p = ACCENT + (p[3],)
                out.putpixel((x, y), p)
    out.save(SKIN)
    print(SKIN)


if __name__ == "__main__":
    main()
