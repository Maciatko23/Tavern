"""Winlu style references for PixelLab (small PNGs, base64 written to .b64 files next to them).
  dirt48      k24 plain dirt, island centre (48x48)
  grass48     k16 grass, island centre
  dark48      k46 dark-grass overlay composited on the k16 grass (what the player sees)
  mudref96    2x2 of dirt48 (a 96x96 ref for Pro Flash), palette-quantised so the base64 stays small
  forestref96 2x2 of dark48, quantised"""
import base64, io, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from refs import block

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

def centre(k):
    return block(k).crop((24, 72, 72, 120))

def save(im, name, quant=None):
    im = im.convert("RGB")
    if quant:
        im = im.quantize(quant, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    p = os.path.join(OUT, name + ".png")
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True); data = buf.getvalue()
    open(p, "wb").write(data)
    b = base64.b64encode(data)
    open(os.path.join(OUT, name + ".b64"), "wb").write(b)
    print(name, im.size, "png %d bytes, b64 %d" % (len(data), len(b)))

dirt, grass = centre(24), centre(16)
dark = grass.copy(); dark.alpha_composite(centre(46))
save(dirt, "dirt48"); save(grass, "grass48"); save(dark, "dark48")
def tile2(im):
    o = Image.new("RGBA", (96, 96))
    for y in (0, 48):
        for x in (0, 48):
            o.paste(im, (x, y))
    return o
save(tile2(dirt), "mudref96", 96); save(tile2(dark), "forestref96", 96)
