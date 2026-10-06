# python tools/humans/make_gif.py <folder of f_*.png> <out.gif> [cx cy w h] [scale] [ms]   (scale 1 keeps a GIF to a few MB)
# Joins the pictures of record.js into a GIF: cropped round (cx, cy) (screen px, default the hero from info.json), w x h, scaled.
import os, sys, json
from PIL import Image

def main():
    folder, out = sys.argv[1:3]
    rest = [int(v) for v in sys.argv[3:]]
    info = json.load(open(os.path.join(folder, "info.json"))) if os.path.exists(os.path.join(folder, "info.json")) else {"hero": [640, 360]}
    cx, cy, w, h = rest[:4] if len(rest) >= 4 else (info["hero"][0] + 60, info["hero"][1] - 30, 420, 240)
    scale = rest[4] if len(rest) >= 5 else 2
    ms = rest[5] if len(rest) >= 6 else 66
    files = sorted(f for f in os.listdir(folder) if f.startswith("f_") and f.endswith(".png"))
    frames = []
    for f in files:
        im = Image.open(os.path.join(folder, f)).convert("RGB")
        im = im.crop((cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2))
        frames.append(im.resize((w * scale, h * scale), Image.NEAREST).quantize(colors=160, method=Image.MEDIANCUT))
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=ms, loop=0, optimize=True)
    print(out, len(frames), "frames")

main()
