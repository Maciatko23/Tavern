"""Pixel-exact recolouring of tiles: every distinct colour is moved in HSV, no pixel moves and
nothing is resampled. Greens (hue 50-190) and browns (hue 0-50) are handled separately so grass and
earth can be tuned on their own.

usage: python recolor.py in.png out.png [--green-hue DEG] [--green-sat F] [--green-val F]
                                        [--brown-hue DEG] [--brown-sat F] [--brown-val F]
  --green-hue: target median hue for the greens (the whole green ramp is rotated by the same amount)
  --*-sat / --*-val: multipliers
Several input files can share one transform: in1.png,in2.png out_dir/ (a folder as the output).
"""
import argparse, colorsys, os
import numpy as np
from PIL import Image


def median_hue(imgs, lo, hi):
    hs = []
    for im in imgs:
        a = np.asarray(im.convert("RGBA")).reshape(-1, 4)
        for r, g, b, al in a[::3]:
            if al == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255., g / 255., b / 255.)
            if lo <= h * 360 < hi and s > 0.08:
                hs.append(h * 360)
    return float(np.median(hs)) if hs else None


def transform(imgs, a):
    gh = median_hue(imgs, 50, 190) if a.green_hue is not None else None
    bh = median_hue(imgs, 0, 50) if a.brown_hue is not None else None
    dg = (a.green_hue - gh) if gh is not None else 0.0
    db = (a.brown_hue - bh) if bh is not None else 0.0
    cache = {}
    def conv(c):
        r, g, b = c
        h, s, v = colorsys.rgb_to_hsv(r / 255., g / 255., b / 255.)
        hd = h * 360
        if 50 <= hd < 190 and s > 0.08:
            hd, s, v = hd + dg, s * a.green_sat, v * a.green_val
        elif hd < 50 and s > 0.08:
            hd, s, v = hd + db, s * a.brown_sat, v * a.brown_val
        else:
            return c
        r2, g2, b2 = colorsys.hsv_to_rgb((hd % 360) / 360., min(1, max(0, s)), min(1, max(0, v)))
        return (round(r2 * 255), round(g2 * 255), round(b2 * 255))
    outs = []
    for im in imgs:
        arr = np.asarray(im.convert("RGBA")).copy()
        H, W = arr.shape[:2]
        for y in range(H):
            for x in range(W):
                if arr[y, x, 3] == 0:
                    continue
                c = tuple(int(v) for v in arr[y, x, :3])
                if c not in cache:
                    cache[c] = conv(c)
                arr[y, x, :3] = cache[c]
        outs.append(Image.fromarray(arr))
    return outs, (gh, dg, bh, db)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("dst")
    ap.add_argument("--green-hue", type=float); ap.add_argument("--green-sat", type=float, default=1.0)
    ap.add_argument("--green-val", type=float, default=1.0)
    ap.add_argument("--brown-hue", type=float); ap.add_argument("--brown-sat", type=float, default=1.0)
    ap.add_argument("--brown-val", type=float, default=1.0)
    a = ap.parse_args()
    srcs = a.src.split(",")
    imgs = [Image.open(p) for p in srcs]
    outs, info = transform(imgs, a)
    print("greens: median hue %s rotated %+.1f; browns: median hue %s rotated %+.1f" % info)
    if len(srcs) == 1 and not a.dst.endswith(("/", "\\")):
        outs[0].save(a.dst)
    else:
        os.makedirs(a.dst, exist_ok=True)
        for p, o in zip(srcs, outs):
            o.save(os.path.join(a.dst, os.path.basename(p)))


if __name__ == "__main__":
    main()
