# Potrzeby (2026-11-18): img/system/Potrzeby.png - 160 x 32, five 32 x 32 icons of the needs: życie, kondycja, sytość, woda, oddech
# (CleanHUD.drawNeed - the HUD's row and the menu's Postać). Sources from PixelLab (create_image_pixen, 32 x 32, transparent, black
# outline, "highly detailed"): zrodla/zycie.png (a glossy red heart, seed 21), kondycja.png (a yellow-green lightning bolt, seed 21),
# sytosc.png (a roasted drumstick, seed 21), woda.png (a blue droplet, seed 21), oddech.png (a gust of wind, seed 7).
#   python tools/potrzeby/zrob_potrzeby.py
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
ORDER = ["zycie", "kondycja", "sytosc", "woda", "oddech"]


def main():
    sheet = Image.new("RGBA", (32 * len(ORDER), 32), (0, 0, 0, 0))
    for i, name in enumerate(ORDER):
        im = Image.open(os.path.join(HERE, "zrodla", name + ".png")).convert("RGBA")
        sheet.alpha_composite(im, (i * 32, 0))
    out = os.path.join(ROOT, "img", "system", "Potrzeby.png")
    sheet.save(out)
    print("zapisane", out)


if __name__ == "__main__":
    main()
