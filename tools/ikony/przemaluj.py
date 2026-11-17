# Ikony pochodne: nowa próba przedmiotu przemalowana z gotowej ikony PixelLab (bez nowej generacji) - gdy trzy próby nie trafiły,
# a inna ikona ma dobry kształt. Wynik: tools/ikony/proby/<id>_<n>.png (+ staging/<id>.png), wpis w opis.json z job "pochodna:...".
#   python tools/ikony/przemaluj.py            robi wszystkie z listy POCHODNE (drugie uruchomienie: już są - nic)
import colorsys
import os
import shutil
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import partia as A   # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def outline_px(px, x, y):
    """the black outline: dark pixels touching the transparent outside"""
    r, g, b, a = px[x, y]
    if a == 0 or max(r, g, b) > 60:
        return False
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if not (0 <= nx < 32 and 0 <= ny < 32) or px[nx, ny][3] == 0:
            return True
    return False


def recolor(src, fn):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    out = im.copy()
    op = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0 or outline_px(px, x, y):
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            nr, ng, nb = fn(h, s, v)
            op[x, y] = (int(max(0, min(1, nr)) * 255), int(max(0, min(1, ng)) * 255), int(max(0, min(1, nb)) * 255), a)
    return out


def steel(h, s, v):
    """gold -> bright blue-silver steel (shading kept)"""
    v2 = 0.30 + 0.72 * v
    return colorsys.hsv_to_rgb(0.58, 0.10 + 0.08 * (1 - v), min(1, v2))


def fur_brown(h, s, v):
    """red cloth -> dark brown bear fur"""
    return colorsys.hsv_to_rgb(0.07, min(0.62, s * 0.7), v * 0.72)


def black_wood(h, s, v):
    """light wood -> black wood; the pale string stays pale"""
    if s < 0.18 and v > 0.7:
        return colorsys.hsv_to_rgb(h, s, v)
    return colorsys.hsv_to_rgb(0.62, 0.14, 0.24 + v * 0.62)


# id: (source try file in proby/, transform, note)
POCHODNE = {
    143: ("485_2.png", steel, "sztabka brązu 485 (próba 2) przemalowana na stal"),
    295: ("295_2.png", fur_brown, "płaszcz 295 (próba 2, czerwony) przemalowany na brązowe futro"),
    337: ("335_2.png", black_wood, "łuk długi 335 (próba 2) przemalowany na czarne drewno"),
}


def main():
    op = A.load()
    for i, (src, fn, note) in POCHODNE.items():
        rec = op[i]
        job = "pochodna:" + src
        if any(p["job"] == job for p in rec["proby"]):
            print("%d: już jest" % i)
            continue
        n = rec["tries"] + 1
        dest = os.path.join(A.PROBY, "%d_%d.png" % (i, n))
        recolor(os.path.join(A.PROBY, src), fn).save(dest)
        rec["tries"] = n
        rec["proby"].append({"n": n, "job": job, "prompt": note})
        rec["wybrana"] = n
        rec["job"] = job
        rec["prompt"] = note
        shutil.copyfile(dest, os.path.join(A.STAGING, "%d.png" % i))
        print("%d (%s): próba %d - %s" % (i, rec["name"], n, note))
    A.save(op)


if __name__ == "__main__":
    main()
