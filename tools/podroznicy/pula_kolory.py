# -*- coding: utf-8 -*-
"""Warianty kolorów ciał puli podróżnych (docs/PODROZNI.md 7.1) - 0 generacji PixelLab.

python tools/podroznicy/pula_kolory.py            -> img/characters/$Npc_Pula_<W>.png + img/pictures/Pula_<W>_Bust.png
python tools/podroznicy/pula_kolory.py --podglad  -> tylko stykówka (bez zapisu wariantów) w katalogu tymczasowym systemu

Cztery ciała puli to postacie PixelLab w stylu bohatera (tools/npc/build_npc.py: $Npc_Pula_M, _K, _S, _Z) i ich popiersia
(tools/busts/make_pula_*.py). Warianty to te same pliki przekolorowane: tylko piksele w paśmie barwy danego ubrania (płaszcz,
chusta i suknia, kubrak, kurtka z czapką) dostają nową barwę; nasycenie i jasność mnożone, więc cienie i światła zostają.
Skóra, włosy, broda, skóra wyprawiona (pasy, buty), len i kontur (bardzo ciemne piksele) się nie zmieniają. Pasma są osobno
dla arkusza (zmierzone na arkuszach PixelLab) i dla popiersia (barwy popiersi z make_pula_*.py) - wynik ten sam kolor.
Uruchamiać po przebudowie ciała (build_npc.py) albo jego popiersia (make_pula_*.py). Stykówka: docs/postacie/pula_warianty.png.
"""
import os, sys, colorsys, tempfile
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
CH = os.path.join(ROOT, "img", "characters")
PICS = os.path.join(ROOT, "img", "pictures")

# pasmo: (hue od, hue do - stopnie, od > do = przez czerwień), (sat od, do), (val od, do)
# ciało -> {ubranie: (pasmo arkusza, pasmo popiersia)}
PASMA = {
    "Pula_M": {"plaszcz": (((95, 135), (0.18, 1), (0.12, 1)), ((85, 125), (0.15, 1), (0.08, 1)))},
    "Pula_K": {"chusta": (((340, 6), (0.45, 1), (0.18, 0.66)), ((354, 8), (0.40, 1), (0.08, 1))),
               "suknia": (((188, 218), (0.15, 1), (0.18, 1)), ((198, 218), (0.12, 1), (0.08, 1)))},
    "Pula_S": {"kubrak": (((185, 216), (0.15, 1), (0.18, 1)), ((200, 216), (0.15, 1), (0.08, 1)))},
    "Pula_Z": {"kurtka": (((208, 236), (0.33, 1), (0.12, 1)), ((215, 232), (0.30, 1), (0.08, 1)))},
}
# wariant -> (ciało, {ubranie: (nowa barwa w stopniach, mnożnik nasycenia, mnożnik jasności)})
WARIANTY = {
    "Pula_M2": ("Pula_M", {"plaszcz": (20, 1.25, 1.12)}),                       # rdzawobrązowy płaszcz
    "Pula_M3": ("Pula_M", {"plaszcz": (212, 0.85, 1.12)}),                      # szaroniebieski płaszcz
    "Pula_K2": ("Pula_K", {"chusta": (40, 0.95, 1.30), "suknia": (95, 1.10, 0.95)}),     # musztardowa chusta, mszysta suknia
    "Pula_K3": ("Pula_K", {"chusta": (218, 0.70, 0.95), "suknia": (305, 0.85, 0.95)}),   # granatowa chusta, śliwkowa suknia
    "Pula_S2": ("Pula_S", {"kubrak": (80, 1.45, 1.00)}),                        # oliwkowy kubrak
    "Pula_Z2": ("Pula_Z", {"kurtka": (356, 0.95, 1.25)}),                       # bordowa kurtka i czapka
}


def _rgb_hsv(a):
    """(H, W, 3) 0..1 -> hue w stopniach, sat, val"""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    dd = np.maximum(d, 1e-6)
    h = np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60.0
    return np.where(d > 0, h, 0), s, mx


def _hsv_rgb(h, s, v):
    h = (h % 360.0) / 60.0
    c = v * s
    x = c * (1 - np.abs(h % 2 - 1))
    m = v - c
    z = np.zeros_like(h)
    i = np.floor(h).astype(int) % 6
    r = np.choose(i, [c, x, z, z, x, c])
    g = np.choose(i, [x, c, c, x, z, z])
    b = np.choose(i, [z, z, x, c, c, x])
    return np.stack([r + m, g + m, b + m], -1)


def maska(h, s, v, a, pasmo):
    (h0, h1), (s0, s1), (v0, v1) = pasmo
    mh = ((h >= h0) & (h <= h1)) if h0 <= h1 else ((h >= h0) | (h <= h1))
    return mh & (s >= s0) & (s <= s1) & (v >= v0) & (v <= v1) & (a > 0.02)


def przekoloruj(path, cialo, zmiany, ktore):
    """ktore: 0 = pasma arkusza, 1 = pasma popiersia"""
    im = np.asarray(Image.open(path).convert("RGBA")).astype(np.float64) / 255.0
    h, s, v = _rgb_hsv(im[..., :3])
    out = im.copy()
    for ubranie, (hue, sm, vm) in zmiany.items():
        m = maska(h, s, v, im[..., 3], PASMA[cialo][ubranie][ktore])
        rgb = _hsv_rgb(np.full_like(h, float(hue)), np.clip(s * sm, 0, 1), np.clip(v * vm, 0, 1))
        out[..., :3] = np.where(m[..., None], rgb, out[..., :3])
    return Image.fromarray(np.clip(out * 255.0 + 0.5, 0, 255).astype(np.uint8), "RGBA")


def main():
    podglad = "--podglad" in sys.argv
    klucze = ["Pula_M", "Pula_M2", "Pula_M3", "Pula_K", "Pula_K2", "Pula_K3", "Pula_S", "Pula_S2", "Pula_Z", "Pula_Z2"]
    W, H = 150, 250
    sheet = Image.new("RGBA", (len(klucze) * W, H), (128, 128, 128, 255))
    d = ImageDraw.Draw(sheet)
    for i, k in enumerate(klucze):
        if k in WARIANTY:
            cialo, zmiany = WARIANTY[k]
            ark = przekoloruj(os.path.join(CH, "$Npc_" + cialo + ".png"), cialo, zmiany, 0)
            bust = przekoloruj(os.path.join(PICS, cialo + "_Bust.png"), cialo, zmiany, 1)
            if not podglad:
                ark.save(os.path.join(CH, "$Npc_" + k + ".png"))
                bust.save(os.path.join(PICS, k + "_Bust.png"))
        else:
            ark = Image.open(os.path.join(CH, "$Npc_" + k + ".png")).convert("RGBA")
            bust = Image.open(os.path.join(PICS, k + "_Bust.png")).convert("RGBA")
        fr = ark.crop((64, 0, 128, 64)).resize((128, 128), Image.NEAREST)
        sheet.alpha_composite(fr, (i * W + 11, 2))
        bt = bust.copy()
        bt.thumbnail((140, 104))
        sheet.alpha_composite(bt, (i * W + 5, 132))
        d.text((i * W + 6, H - 14), k, fill=(255, 255, 255, 255))
    out = os.path.join(tempfile.gettempdir() if podglad else os.path.join(ROOT, "docs", "postacie"), "pula_warianty.png")
    sheet.convert("RGB").save(out)
    print("zapisano", len(WARIANTY), "wariantów" + (" (tylko podgląd)" if podglad else ""), "- stykówka:", out)


if __name__ == "__main__":
    main()
