# Składa GIF-y „walka przyjemniejsza” (Combat_Feel.js) z klatek capture_feel.js do docs/walka/.
#   python tools/walka/make_gif_feel.py <katalog z klatkami>
import glob, os, sys
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "walka")
os.makedirs(OUT, exist_ok=True)


def gif(prefix, name, ms=50, scale=1):
    files = sorted(glob.glob(os.path.join(SRC, prefix + "_[0-9][0-9][0-9].png")))
    if not files:
        return
    frames = []
    for f in files:
        im = Image.open(f).convert("RGB")
        if scale != 1:
            im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        frames.append(im.convert("P", palette=Image.ADAPTIVE, colors=128))
    path = os.path.join(OUT, name + ".gif")
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=ms, loop=0, optimize=True)
    print("gif", path, len(frames), "klatek")


gif("cel", "walka_namierzanie")
gif("zapowiedz_bandyta", "walka_zapowiedz_bandyta")
gif("zapowiedz_niedzwiedz", "walka_zapowiedz_niedzwiedz")
gif("parowanie", "walka_idealne_parowanie")
gif("manekin", "walka_manekin")
