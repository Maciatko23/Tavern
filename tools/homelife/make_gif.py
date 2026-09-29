# Builds a GIF from CDP frame captures: python tools/homelife/make_gif.py <frames dir> <out.gif> [scale, default 2]
# The frames dir holds f_000.png ... and frames.json = [game frame count at each capture]; each GIF frame lasts as long as the game
# showed it. One palette for all the frames (taken from all of them): only what moves is stored again, the file stays small.
import json, os, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
scale = int(sys.argv[3]) if len(sys.argv) > 3 else 2   # (whole pixels bigger: the pixel art stays sharp)
counts = json.load(open(os.path.join(src, "frames.json")))
rgb, durations = [], []
for i, n in enumerate(counts):
    im = Image.open(os.path.join(src, "f_%03d.png" % i)).convert("RGB")
    if scale > 1:
        im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    rgb.append(im)
    nxt = counts[i + 1] if i + 1 < len(counts) else n + (counts[1] - counts[0] if len(counts) > 1 else 4)
    durations.append(max(20, round((nxt - n) * 1000 / 60)))
# the shared palette: from a sheet of every 4th frame side by side
sample = Image.new("RGB", (rgb[0].width * ((len(rgb) + 3) // 4), rgb[0].height))
for k, im in enumerate(rgb[::4]):
    sample.paste(im, (k * im.width, 0))
pal = sample.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
frames = [im.quantize(palette=pal, dither=Image.Dither.NONE) for im in rgb]
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
frames[0].save(out, save_all=True, append_images=frames[1:], duration=durations, loop=0, optimize=True, disposal=1)
print("wrote", out, len(frames), "frames,", sum(durations), "ms,", os.path.getsize(out) // 1024, "KB")
