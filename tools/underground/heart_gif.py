"""The GIF of the destroying blow (docs/podziemia/serce_zniszczenie.gif) from the frames tests/heart_test.js keeps in
tools/underground/staging/heart_gif/ (fNNN.png, 1280x720): cropped to the middle of the chamber, scaled to half, 8 colours less noise.

    python tools/underground/heart_gif.py [--src DIR] [--out FILE]
"""
import argparse
import glob
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.path.join(ROOT, "tools", "underground", "staging", "heart_gif"))
    ap.add_argument("--out", default=os.path.join(ROOT, "docs", "podziemia", "serce_zniszczenie.gif"))
    ap.add_argument("--ms", type=int, default=90)
    ap.add_argument("--frames", type=int, default=22, help="the first N frames (later ones hold the same line)")
    a = ap.parse_args()
    files = sorted(glob.glob(os.path.join(a.src, "f*.png")))[:a.frames]
    if not files:
        raise SystemExit("no frames in " + a.src)
    frames = []
    for f in files:
        im = Image.open(f).convert("RGB")
        w, h = im.size
        box = (w // 2 - 400, h // 2 - 250, w // 2 + 400, h // 2 + 250)   # (the hero and the Heart in the middle)
        frames.append(im.crop(box).resize((560, 350), Image.LANCZOS).quantize(colors=128, method=Image.MEDIANCUT))
    frames[0].save(a.out, save_all=True, append_images=frames[1:], duration=a.ms, loop=0, optimize=True)
    print(a.out, len(frames), "frames", os.path.getsize(a.out), "bytes")


if __name__ == "__main__":
    main()
