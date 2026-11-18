# Monety (2026-11-17): img/system/Monety.png - 96 x 32, three 32 x 32 coins: złoty, srebrnik, miedziak (Monety.js draws them by the
# numbers of a sum). Sources from PixelLab (create_image_pixen, 32 x 32, transparent): zrodla/moneta_korona.png (seed 5, a gold coin
# with a crown) and zrodla/moneta_kruk.png (seed 11, a gold coin with a raven). The three are those two recoloured by brightness onto
# a gradient: the gold bright yellow (the crown), the silver (the raven), the copper (the crown).
#   python tools/monety/zrob_monety.py
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
GOLD = [(0.0, (34, 20, 2)), (0.25, (140, 92, 10)), (0.5, (222, 170, 30)), (0.72, (255, 218, 80)), (1.0, (255, 248, 200))]
SILVER = [(0.0, (14, 16, 22)), (0.25, (70, 78, 92)), (0.5, (140, 150, 164)), (0.75, (204, 212, 222)), (1.0, (250, 252, 255))]
COPPER = [(0.0, (24, 8, 4)), (0.25, (104, 40, 18)), (0.5, (172, 78, 36)), (0.75, (220, 120, 64)), (1.0, (255, 190, 140))]


def recolour(im, stops):
    out = im.copy()
    px = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            for i in range(len(stops) - 1):
                l0, c0 = stops[i]
                l1, c1 = stops[i + 1]
                if lum <= l1 or i == len(stops) - 2:
                    t = 0 if l1 == l0 else max(0.0, min(1.0, (lum - l0) / (l1 - l0)))
                    px[x, y] = tuple(int(c0[k] + (c1[k] - c0[k]) * t) for k in range(3)) + (a,)
                    break
    return out


def main():
    crown = Image.open(os.path.join(HERE, "zrodla", "moneta_korona.png")).convert("RGBA")
    raven = Image.open(os.path.join(HERE, "zrodla", "moneta_kruk.png")).convert("RGBA")
    sheet = Image.new("RGBA", (96, 32), (0, 0, 0, 0))
    for i, c in enumerate([recolour(crown, GOLD), recolour(raven, SILVER), recolour(crown, COPPER)]):
        sheet.alpha_composite(c, (i * 32, 0))
    out = os.path.join(ROOT, "img", "system", "Monety.png")
    sheet.save(out)
    print("zapisane", out)


if __name__ == "__main__":
    main()
