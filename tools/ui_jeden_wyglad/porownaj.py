# Zrzuty przed / po obok siebie (docs/ui_jeden_wyglad/porownanie_<ujęcie>.png, po połowie wielkości) i ile pikseli się zmieniło.
#   python tools/ui_jeden_wyglad/porownaj.py [ujęcie...]
# Zrzuty robi tools/ui_jeden_wyglad/zrzuty.js (przed / po). Wynik: tabela ujęć z udziałem zmienionych pikseli (różnica > 24 na kanał).
import os
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
DIR = os.path.join(ROOT, "docs", "ui_jeden_wyglad")


def font(size):
    for f in ("AlegreyaSans-Medium.ttf",):
        p = os.path.join(ROOT, "fonts", f)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def changed(a, b):
    d = ImageChops.difference(a.convert("RGB"), b.convert("RGB")).convert("L").point(lambda v: 255 if v > 24 else 0)
    hist = d.histogram()
    return hist[255] / float(a.width * a.height)


def main():
    want = sys.argv[1:]
    names = sorted(f[6:-4] for f in os.listdir(DIR) if f.startswith("przed_") and f.endswith(".png"))
    rows = []
    f = font(22)
    for n in names:
        if want and n not in want:
            continue
        pa, pb = os.path.join(DIR, "przed_" + n + ".png"), os.path.join(DIR, "po_" + n + ".png")
        if not os.path.exists(pb):
            continue
        a, b = Image.open(pa), Image.open(pb)
        k = changed(a, b)
        w, h = a.width // 2, a.height // 2
        out = Image.new("RGB", (w * 2 + 12, h + 36), (16, 17, 20))
        out.paste(a.convert("RGB").resize((w, h), Image.LANCZOS), (0, 36))
        out.paste(b.convert("RGB").resize((w, h), Image.LANCZOS), (w + 12, 36))
        dr = ImageDraw.Draw(out)
        dr.text((8, 6), "przed: " + n, fill=(236, 238, 240), font=f)
        dr.text((w + 20, 6), "po (jeden wygląd)", fill=(255, 210, 63), font=f)
        out.save(os.path.join(DIR, "porownanie_" + n + ".png"))
        rows.append((n, k))
    for n, k in rows:
        print("%-22s %5.1f%% pikseli inaczej" % (n, k * 100))


if __name__ == "__main__":
    main()
