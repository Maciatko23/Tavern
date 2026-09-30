# python fidelity.py  -> docs/miasteczko/wiernosc_<n>.png + tools/town/staging/fidelity.json
# The fidelity test: every reference picture the user gave (the pack's store screenshots, shown at 2x) is found in the
# author's sample maps (tools/town/winlu_samples, rendered by mzrender.py with the author's tileset 1 from our copies of the
# sheets): the reference is brought to 1x (its 2x2 pixel blocks), matched against every sample render (OpenCV template
# matching), and the found region of OUR render is put beside the reference at the same scale, with a per-pixel score:
#   mean abs difference (0..255, lower is better) and the share of pixels within 24 levels of the reference.
# (Differences left: animation frames, the game's lights / clouds, the screenshot's own tone.)
import os, sys, json
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import winlu

ROOT = winlu.ROOT
REFS = os.environ.get("TOWN_REFS", os.path.join(HERE, "refs"))     # the user's reference pictures (the pack's store shots, 2x)
OUT = os.path.join(ROOT, "docs", "miasteczko")
NAMES = {"6": "ulica miasteczka", "7": "wioska z wodospadem", "8": "brama zamku", "9": "skały", "10": "chaty",
         "11": "młyn-karczma", "13": "skraj lasu"}
# references whose scene is not in the shipped demo maps (store screenshots of other maps): the closest map of the author
ANALOG = {"7": "Map012", "8": "Map008", "9": "Map012", "10": "Map015", "13": "Map016"}
FOUND = 1000.0      # the match score (squared difference per value) under which the scene is the same
FONT = os.path.join(ROOT, "fonts", "AlegreyaSans-Medium.ttf")

def to_1x(img):
    """a 2x screenshot back to 1x: find the phase of its 2x2 blocks, take one pixel of each"""
    a = np.array(img.convert("RGB")).astype(np.int32)
    px = min((0, 1), key=lambda p: np.abs(a[:, p:-1:2] - a[:, p + 1::2]).mean())
    py = min((0, 1), key=lambda p: np.abs(a[p:-1:2] - a[p + 1::2]).mean())
    return Image.fromarray(a[py::2, px::2].astype(np.uint8))

def main():
    renders = {}
    for f in sorted(os.listdir(winlu.OUT)):
        if f.endswith(".png"): renders[f[:-4]] = Image.open(os.path.join(winlu.OUT, f)).convert("RGB")
    results = {}
    font = ImageFont.truetype(FONT, 26)
    for n in NAMES:
        p = os.path.join(REFS, n + ".png")
        if not os.path.exists(p): continue
        ref = to_1x(Image.open(p))
        r = np.array(ref).astype(np.float32)
        best = None
        for name, im in renders.items():
            a = np.array(im).astype(np.float32)
            # the render padded by the reference's size on every side (a reference may show more than the map, or sit on its
            # edge): the best place is the one with the least squared difference over the whole reference
            ph, pw = r.shape[0], r.shape[1]
            pad = np.full((a.shape[0] + 2 * ph, a.shape[1] + 2 * pw, 3), 0, np.float32)
            pad[ph:ph + a.shape[0], pw:pw + a.shape[1]] = a
            res = cv2.matchTemplate(pad, r, cv2.TM_SQDIFF)
            mn, _, loc, _ = cv2.minMaxLoc(res)
            cand = (mn / r.size, name, (loc[0] - pw, loc[1] - ph))
            if best is None or cand[0] < best[0]: best = cand
        score, name, (ox, oy) = best
        if score > FOUND and n in ANALOG:
            results[n] = {"map": None, "closest_sample": ANALOG[n], "match": float(score)}
            an = renders[ANALOG[n]]
            H2 = ref.height * 2
            a2 = an.resize((round(an.width * H2 / an.height), H2), Image.LANCZOS)
            out = Image.new("RGB", (ref.width * 2 + 30 + a2.width, H2 + 60), (24, 22, 26))
            out.paste(ref.resize((ref.width * 2, H2), Image.NEAREST), (0, 60))
            out.paste(a2, (ref.width * 2 + 30, 60))
            dr = ImageDraw.Draw(out)
            dr.text((10, 14), "Wzór %s.png (%s) - tej sceny nie ma w mapach demo autora" % (n, NAMES[n]), font=font, fill=(250, 214, 64))
            dr.text((ref.width * 2 + 40, 14), "Najbliższa mapa autora: %s (cała, pomniejszona)" % ANALOG[n], font=font, fill=(250, 214, 64))
            path = os.path.join(OUT, "wiernosc_%s.png" % n)
            out.save(path, optimize=True)
            print("%s.png: not in the demo maps (best %s %.0f) -> closest %s -> %s" % (n, name, score, ANALOG[n], path))
            continue
        mine = Image.new("RGB", ref.size, (0, 0, 0))
        mine.paste(renders[name], (-ox, -oy))   # (ox, oy): where the reference's top-left lies on our render
        d = np.abs(np.array(mine).astype(np.int32) - np.array(ref).astype(np.int32))
        mad = float(d.mean())
        close = float((d.max(axis=2) <= 24).mean())
        results[n] = {"map": name, "offset_px": [ox, oy], "offset_tiles": [ox / 48, oy / 48], "match": float(score),
                      "mean_abs_diff": round(mad, 2), "close_24": round(close, 4), "size_1x": list(ref.size)}
        # the picture: reference | ours, both at 2x (as the user saw it), a caption
        S = 2
        W, H = ref.width * S, ref.height * S
        out = Image.new("RGB", (W * 2 + 30, H + 60), (24, 22, 26))
        out.paste(ref.resize((W, H), Image.NEAREST), (0, 60))
        out.paste(mine.resize((W, H), Image.NEAREST), (W + 30, 60))
        dr = ImageDraw.Draw(out)
        dr.text((10, 14), "Wzór %s.png (%s)" % (n, NAMES[n]), font=font, fill=(250, 214, 64))
        dr.text((W + 40, 14), "Nasz render: próbka autora %s, pole (%g, %g) - różnica %.1f/255, %d%% pikseli zgodnych"
                % (name, ox / 48, oy / 48, mad, round(close * 100)), font=font, fill=(250, 214, 64))
        path = os.path.join(OUT, "wiernosc_%s.png" % n)
        out.save(path, optimize=True)
        print("%s.png <- %s at (%d,%d) px  match %.4f  diff %.1f  close %.0f%%  -> %s" % (n, name, ox, oy, score, mad, close * 100, path))
    with open(os.path.join(HERE, "staging", "fidelity.json"), "wb") as f:
        f.write(json.dumps(results, indent=1).encode("utf-8"))

if __name__ == "__main__":
    main()
