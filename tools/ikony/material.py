# Ikony w kolorze materiału z mapy (2026-11-17): metal / skóra na ikonie przemalowane jasnością na rampę materiału z Ubior_Data.js
# (MATERIALY), żeby rzeczy jednego materiału wyglądały jak jeden komplet - zakonne: ciemnoniebieska stal, stalowe: jasna stal.
# Bez generowania w PixelLab. Kolorowe części (drewno trzonków, złoto, czerwień, klejnoty) i czarny kontur zostają.
#   python tools/ikony/material.py                 robi wszystko z listy PRZEMALUJ (wynik: proby/<id>_m.png + staging/<id>.png)
#   python tools/ikony/material.py --podglad PLIK  tylko arkusz przed/po (nic nie zapisuje w staging)
# Oryginał zostaje w proby/<id>_<n>.png; drugie uruchomienie bierze zawsze ten oryginał (opis.json "wybrana"), nie wynik.
import colorsys
import json
import os
import shutil
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OPIS = os.path.join(HERE, "opis.json")

RAMPY = {
    "zakon": ["#0e1018", "#1a1e2c", "#282e42", "#38405a", "#4c5674", "#66728f", "#8e9ab4", "#b4bed4"],
    "stal": ["#1c222a", "#2e3742", "#44505d", "#5d6b7a", "#7a8999", "#9cabb9", "#c4d0da", "#e4ecf2"],
    "plaszcz_zakonny": ["#0c0c10", "#16161c", "#212129", "#2d2d37", "#3a3a46", "#4a4a57", "#5e5e6e"],
    "zelazo_jasne": ["#565b62", "#6e747b", "#888e95", "#a4a9ae", "#c0c4c8"],   # (thin things: no room for a black outline - all of it lighter)
    "skora": ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f", "#bd8a55"],
}
# id -> (rampa, które piksele): "metal" = szare i chłodne (bez brązu, złota, czerwieni), "fiolet" = tylko fioletowe
PRZEMALUJ = {
    # zakonne (talizman 389, pierścień 482 i sztabka 486 mają swój wygląd)
    296: ("plaszcz_zakonny", "metal"), 303: ("zakon", "metal"), 311: ("zakon", "metal"), 319: ("zakon", "metal"), 325: ("zakon", "metal"),
    329: ("zakon", "metal"), 334: ("zakon", "metal"), 337: ("zakon", "metal"), 348: ("zakon", "metal"), 359: ("zakon", "metal"),
    365: ("zakon", "metal"), 370: ("zakon", "metal"), 374: ("zakon", "metal"), 380: ("zakon", "metal"), 426: ("zakon", "metal"),
    433: ("zakon", "metal"), 434: ("zakon", "metal"), 467: ("zakon", "metal"), 468: ("zakon", "metal"), 469: ("zakon", "metal"),
    470: ("zakon", "metal"),
    # stalowe z fioletem
    364: ("stal", "metal"), 441: ("stal", "metal"),
    # brązowe trzewiki: fioletowa skóra -> brązowa skóra (okucia z brązu zostają)
    444: ("skora", "fiolet"),
    # stalowa brygantyna: krój zwykłej brygantyny (355), cała w stali - jak na mapie (zbroja_brygantyna_stal)
    432: ("stal", "wszystko"),
    # żelazne szczypce: cienkie i prawie czarne - na ciemnym tle znikały; całe (z konturem) w jasnym żelazie
    144: ("zelazo_jasne", "cienkie"),
}
# id -> z której ikony brać kształt (gdy nie z własnej)
ZRODLO = {432: 355}


def hexrgb(h):
    n = int(h[1:], 16)
    return (n >> 16) & 255, (n >> 8) & 255, n & 255


def luma(r, g, b):
    return 0.299 * r + 0.587 * g + 0.114 * b


def kind(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hd = h * 360
    if s < 0.22:
        return "grey"
    if 200 <= hd <= 320:
        return "fiolet" if hd >= 245 else "cold"
    return "warm"


def outline(px, x, y, w, h):
    r, g, b, a = px[x, y]
    if max(r, g, b) > 40:
        return False
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if not (0 <= nx < w and 0 <= ny < h) or px[nx, ny][3] == 0:
            return True
    return False


def recolor(im, rampa, which):
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    R = [hexrgb(c) for c in RAMPY[rampa]]
    pick = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0 or (which != "cienkie" and outline(px, x, y, w, h)):
                continue
            k = kind(r, g, b)
            if which in ("wszystko", "cienkie") or (which == "metal" and k in ("grey", "cold", "fiolet")) or (which == "fiolet" and k == "fiolet"):
                pick.append((x, y, luma(r, g, b)))
    if not pick:
        return im
    ls = sorted(p[2] for p in pick)
    lo, hi = ls[int(len(ls) * 0.03)], ls[min(len(ls) - 1, int(len(ls) * 0.97))]
    span = max(1.0, hi - lo)
    out = im.copy()
    op = out.load()
    for x, y, l in pick:
        t = min(1.0, max(0.0, (l - lo) / span))
        c = R[min(len(R) - 1, int(round(t * (len(R) - 1))))]
        op[x, y] = (c[0], c[1], c[2], px[x, y][3])
    return out


def main():
    op = json.load(open(OPIS, encoding="utf-8"))
    pod = sys.argv[sys.argv.index("--podglad") + 1] if "--podglad" in sys.argv else None
    pairs = []
    for i, (rampa, which) in PRZEMALUJ.items():
        e = op.get(str(ZRODLO.get(i, i)))
        n = e.get("wybrana") if e else None
        z = ZRODLO.get(i, i)
        src = os.path.join(HERE, "proby", "%d_%s.png" % (z, n)) if n is not None else None
        if not src or not os.path.exists(src):
            src = os.path.join(HERE, "proby", "%d_orig.png" % z)
            if not os.path.exists(src):   # (a pilot icon without tries: keep its first look as the original)
                shutil.copy2(os.path.join(HERE, "staging", "%d.png" % z), src)
        im = Image.open(src).convert("RGBA")
        res = recolor(im, rampa, which)
        pairs.append((i, im, res))
        if not pod:
            res.save(os.path.join(HERE, "proby", "%d_m.png" % i))
            res.save(os.path.join(HERE, "staging", "%d.png" % i))
    if pod:
        S, W = 3, 8
        cw, ch = 2 * 32 * S + 14, 32 * S + 20
        rows = (len(pairs) + W - 1) // W
        sh = Image.new("RGB", (W * cw, rows * ch), (48, 48, 56))
        d = ImageDraw.Draw(sh)
        f = ImageFont.truetype("arial.ttf", 12)
        for n, (i, a, b) in enumerate(pairs):
            x, y = (n % W) * cw + 4, (n // W) * ch + 2
            for k, im in enumerate((a, b)):
                big = im.resize((32 * S, 32 * S), Image.NEAREST)
                sh.paste(big, (x + k * 32 * S, y), big)
            d.text((x, y + 32 * S + 2), str(i), fill=(255, 220, 120), font=f)
        sh.save(pod)
    print("przemalowane:", len(pairs), "(podgląd)" if pod else "")


if __name__ == "__main__":
    main()
