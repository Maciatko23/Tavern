# a tileset sheet with a numbered 48 px grid (columns on top, rows at the left) for reading tile coordinates
import sys, os
from PIL import Image, ImageDraw
P = "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/tilesets/"
def grid(name, out, scale=1.0, half=False):
    im = Image.open(P + name + ".png").convert("RGBA")
    T = 48
    W, H = im.size
    pad = 22
    bg = Image.new("RGBA", (W + pad, H + pad), (40, 40, 48, 255))
    bg.alpha_composite(im, (pad, pad))
    d = ImageDraw.Draw(bg)
    for c in range(W // T + 1):
        d.line([(pad + c * T, pad), (pad + c * T, pad + H)], fill=(255, 0, 255, 140))
        if c < W // T: d.text((pad + c * T + 16, 4), str(c), fill=(255, 255, 0, 255))
    for r in range(H // T + 1):
        d.line([(pad, pad + r * T), (pad + W, pad + r * T)], fill=(255, 0, 255, 140))
        if r < H // T: d.text((2, pad + r * T + 18), str(r), fill=(255, 255, 0, 255))
    if scale != 1.0:
        bg = bg.resize((int(bg.width * scale), int(bg.height * scale)), Image.NEAREST)
    bg.save(out)
if __name__ == "__main__":
    for n in sys.argv[1:]:
        grid(n, "tools/tavern/v2/out/grid_%s.png" % n.split("_")[-1])
