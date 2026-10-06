# python tools/humans/fetch_rot.py <key> <pixellab character id>
# Downloads the 8 standing rotations of a PixelLab character into tools/humans/rot/<key>/<direction>.png and writes a preview
# (x4, on mid-grey, beside the hero's standing frames) to tools/humans/preview/<key>_rot.png.
import os, sys, io, urllib.request
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", ".."))
DIRS = ["south", "south-west", "west", "north-west", "north", "north-east", "east", "south-east"]
def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.0"})
    return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert("RGBA")
def main():
    key, cid = sys.argv[1:3]
    out = os.path.join(HERE, "rot", key); os.makedirs(out, exist_ok=True)
    base = "https://backblaze.pixellab.ai/file/pixellab-characters/028dbfa8-5f36-44f0-b776-f333514951f1/%s/rotations/%s.png?t=1"
    ims = []
    for d in DIRS:
        im = get(base % (cid, d)); im.save(os.path.join(out, d + ".png")); ims.append(im)
    hero = Image.open(os.path.join(GAME, "img", "characters", "Hero_Walk.png")).convert("RGBA")
    W = 64 * 8; sheet = Image.new("RGBA", (W, 128), (110, 110, 110, 255))
    for i, im in enumerate(ims):
        sheet.alpha_composite(im.crop((0, 0, 64, 64)), (i * 64, 0))
        sheet.alpha_composite(hero.crop((0, i * 64, 64, i * 64 + 64)), (i * 64, 64))
    os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
    sheet.resize((W * 3, 128 * 3), Image.NEAREST).save(os.path.join(HERE, "preview", key + "_rot.png"))
    print("ok", [im.size for im in ims][:1])
main()
