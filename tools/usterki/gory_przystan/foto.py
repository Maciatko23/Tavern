# -*- coding: utf-8 -*-
"""wycinki ze zdjęć ekranów (zrzuty.js, skala 0.5: 24 px na kratkę): wycinek(katalog, mapa, x0, y0, x1, y1) -> obraz PIL (48 px na kratkę)
   para(mapa, region, podpis, plik): lewy = przed (zrzuty_przed), prawy = po (zrzuty_po)"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
SW, SH = 27, 15
T = 24

def ekrany(mid, W=120, H=120):
    def osie(L, S):
        out = []
        x = 0
        while True:
            xx = max(0, min(x, L - S)); out.append(xx)
            if x + S >= L: break
            x += S - 2
        return sorted(set(out))
    return osie(W, SW), osie(H, SH)

def wycinek(kat, mid, x0, y0, x1, y1, skala=2):
    xs, ys = ekrany(mid)
    w, h = x1 - x0 + 1, y1 - y0 + 1
    out = Image.new("RGB", (w * T, h * T), (0, 0, 0))
    # compose from all screens covering the region (the later screen wins on overlap - the same picture anyway)
    for sy in ys:
        for sx in xs:
            if sx + SW <= x0 or sx > x1 or sy + SH <= y0 or sy > y1: continue
            p = os.path.join(HERE, kat, str(mid), "%d_%d.png" % (sx, sy))
            if not os.path.exists(p): continue
            im = Image.open(p).convert("RGB")
            ax0, ay0 = max(x0, sx), max(y0, sy); ax1, ay1 = min(x1, sx + SW - 1), min(y1, sy + SH - 1)
            piece = im.crop(((ax0 - sx) * T, (ay0 - sy) * T, (ax1 - sx + 1) * T, (ay1 - sy + 1) * T))
            mask = Image.new("L", piece.size, 255)           # (the screen's own label in its corner: 96 x 17 px - not pasted)
            (lambda *a, **k: None)((0 - (ax0 - sx) * T, 0 - (ay0 - sy) * T, 96 - (ax0 - sx) * T, 17 - (ay0 - sy) * T), fill=0)
            out.paste(piece, ((ax0 - x0) * T, (ay0 - y0) * T), mask)
    return out.resize((out.width * skala // 1, out.height * skala // 1), Image.LANCZOS) if skala != 1 else out

def para(mid, region, podpis, plik, skala=2):
    x0, y0, x1, y1 = region
    a = wycinek("zrzuty_przed", mid, x0, y0, x1, y1, skala); b = wycinek("zrzuty_po", mid, x0, y0, x1, y1, skala)
    cap = 34
    im = Image.new("RGB", (a.width * 2 + 12, a.height + cap), (20, 20, 20))
    im.paste(a, (0, cap)); im.paste(b, (a.width + 12, cap))
    d = ImageDraw.Draw(im)
    try: f = ImageFont.truetype("arial.ttf", 16)
    except Exception: f = ImageFont.load_default()
    d.text((6, 8), "PRZED   " + podpis, fill=(255, 230, 80), font=f)
    d.text((a.width + 18, 8), "PO", fill=(120, 255, 120), font=f)
    os.makedirs(os.path.dirname(plik), exist_ok=True)
    im.save(plik)
    return im

if __name__ == "__main__":
    kat, mid = sys.argv[1], int(sys.argv[2]); r = [int(v) for v in sys.argv[3].split(",")]
    wycinek(kat, mid, *r).save(sys.argv[4])
