"""Make a square pixel-art texture tile wrap seamlessly, without resampling.

A band of rows at the bottom (or columns at the right) that does not match the opposite edge -
PixelLab's plain grass has a dark 'shadow' band on its last rows - is replaced by a strip copied
from elsewhere in the same tile (wrapping, any horizontal shift), chosen so that both of its new
neighbours (the row above the band and the tile's first row, which follows it when tiled) fit best.
Only existing pixels are moved; no new colours appear.

usage: python seamfix.py in.png out.png [--rows N] [--cols N] [--avoid A-B]
"""
import argparse
import numpy as np
from PIL import Image


def fix_rows(a, n, avoid=()):
    """Replace the last n rows of a (H x W x C) with the best-fitting strip of n rows from a
    (never taking rows listed in avoid - e.g. another dark band)."""
    H, W = a.shape[:2]
    above, below = a[H - n - 1].astype(int), a[0].astype(int)    # below = the next tile's first row
    best = None
    for r in range(0, H):                           # the strip starts at row r (wrapping)
        rows = [(r + i) % H for i in range(n)]
        if any(H - n <= rr or rr in avoid for rr in rows):   # never copy the bad band itself
            continue
        prev_row, next_row = a[(r - 1) % H].astype(int), a[(r + n) % H].astype(int)
        for sx in range(W):
            # the strip's natural neighbours are prev_row / next_row; compare them with the real ones
            e = np.abs(np.roll(prev_row, -sx, axis=0) - above).sum() + np.abs(np.roll(next_row, -sx, axis=0) - below).sum()
            if best is None or e < best[0]:
                best = (e, r, sx)
    _, r, sx = best
    out = a.copy()
    for i in range(n):
        out[H - n + i] = np.roll(a[(r + i) % H], -sx, axis=0)
    return out, best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("dst")
    ap.add_argument("--rows", type=int, default=0); ap.add_argument("--cols", type=int, default=0)
    ap.add_argument("--avoid", default="", help="rows not to copy from, e.g. 17-24")
    a = ap.parse_args()
    img = np.asarray(Image.open(a.src).convert("RGBA")).copy()
    if a.rows:
        avoid = set()
        if a.avoid:
            lo, hi = map(int, a.avoid.split("-"))
            avoid = set(range(lo, hi + 1))
        img, info = fix_rows(img, a.rows, avoid)
        print("rows: strip from row %d shifted %d (error %d)" % (info[1], info[2], info[0]))
    if a.cols:
        t, info = fix_rows(img.transpose(1, 0, 2), a.cols)
        img = t.transpose(1, 0, 2)
        print("cols: strip from col %d shifted %d (error %d)" % (info[1], info[2], info[0]))
    Image.fromarray(img).save(a.dst)


if __name__ == "__main__":
    main()
