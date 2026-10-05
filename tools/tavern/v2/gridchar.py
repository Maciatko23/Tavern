# a character sheet with its 8 characters (or 1 for $) outlined and numbered, frames 3 x 4 each, scaled 2x
import sys, os, re
from PIL import Image, ImageDraw
D1 = "img/characters/"
D2 = "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/characters/"
def grid(name, out, scale=2):
    p = D1 + name + ".png"
    if not os.path.exists(p): p = D2 + name + ".png"
    im = Image.open(p).convert("RGBA")
    big = "$" in re.match(r"^[!$]*", name).group(0)
    W, H = im.size
    cw, ch = (W // 3, H // 4) if big else (W // 12, H // 8)
    bg = Image.new("RGBA", (W, H), (40, 40, 48, 255)); bg.alpha_composite(im)
    bg = bg.resize((W * scale, H * scale), Image.NEAREST)
    d = ImageDraw.Draw(bg)
    for i in range(0 if big else 8):
        x0, y0 = (i % 4) * 3 * cw * scale, (i // 4) * 4 * ch * scale
        d.rectangle([x0, y0, x0 + 3 * cw * scale - 1, y0 + 4 * ch * scale - 1], outline=(255, 0, 255, 255), width=2)
        d.text((x0 + 4, y0 + 2), str(i), fill=(255, 255, 0, 255))
    for r in range(4 if big else 8):
        d.text((2, r * ch * scale + ch * scale // 2), "d%d" % (2 + 2 * (r % 4)), fill=(0, 255, 255, 255))
    bg.save(out)
    print(name, W, H, "frame", cw, ch)
if __name__ == "__main__":
    for n in sys.argv[1:]:
        grid(n, "tools/tavern/v2/out/char_%s.png" % n.replace("!", "").replace("$", "S"))
