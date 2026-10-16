# python tools/garnizon/art/recolor.py   -> img/characters/$Npc_Zolnierz_B.png + Npc_Zolnierz_B_Walk8.png
# The royal soldier in a second colour (KONCEPCJA.md: "żołnierze jednym arkuszem w dwóch kolorach") - 0 PixelLab generations:
#   - the tabard's sky blue -> a deeper cornflower blue (hue 200-215 -> 222, a little darker)
#   - the brown beard and the hair under the helmet (only in the upper part of each 64x64 cell: the boots stay brown) -> black-brown
# The same man otherwise; the garrison shows A and B side by side so the drill line is not one face eight times.
import os, colorsys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
CH = os.path.join(ROOT, "img", "characters")
PAIRS = [("$Npc_Zolnierz.png", "$Npc_Zolnierz_B.png"), ("Npc_Zolnierz_Walk8.png", "Npc_Zolnierz_B_Walk8.png")]
C = 64
HAIR_ROWS = 30          # rows of a cell where brown is hair / beard (the head), not boots


def shift(p, y):
    r, g, b, a = p
    if not a: return p
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hd = h * 360
    if 190 <= hd <= 215 and s > 0.35:                       # the tabard's blue
        h, s, v = 222 / 360, min(1, s * 1.08), v * 0.86
    elif (y % C) < HAIR_ROWS and 8 <= hd <= 30 and s > 0.45 and 0.2 < v < 0.6:   # the beard / hair
        h, s, v = 20 / 360, s * 0.45, v * 0.55
    else:
        return p
    rr, gg, bb = colorsys.hsv_to_rgb(h, s, v)
    return (int(round(rr * 255)), int(round(gg * 255)), int(round(bb * 255)), a)


def main():
    for src, dst in PAIRS:
        im = Image.open(os.path.join(CH, src)).convert("RGBA")
        px = im.load()
        for y in range(im.height):
            for x in range(im.width):
                px[x, y] = shift(px[x, y], y)
        im.save(os.path.join(CH, dst))
        print("zapisano", dst)


if __name__ == "__main__":
    main()
