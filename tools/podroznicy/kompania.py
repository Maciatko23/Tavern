# -*- coding: utf-8 -*-
"""Wolna Kompania (docs/PODROZNI.md 2.13, D47): cztery arkusze $Npc_Kompania_<n>.png z grafik ludzi z Humans.js - 0 generacji.

python tools/podroznicy/kompania.py            -> img/characters/$Npc_Kompania_1..4.png + stykówka docs/postacie/kompania.png
python tools/podroznicy/kompania.py --podglad  -> tylko stykówka (w katalogu tymczasowym systemu)

Najemnicy w szarych płaszczach: każdy z innego arkusza ludzi z Humans.js (żeby czwórka była naprawdę różna, a Ruda Hela była
kobietą - arkusz $Human_Merc ma tylko jednego brodatego mężczyznę w kapalinie):
  1 Hubert Szary   - $Human_Merc   (kapalin, tarcza): przeszywanica szara, broda siwa
  2 Jasiek Brzytwa - $Human_Knife  (nożownik): kamizelka i koszula szare, chusta na twarzy ciemnoszara
  3 Kazik Kołek    - $Human_Archer (łucznik): kaptur z peleryną szary (tunika, łuk i buty bez zmian), broda ciemniejsza
  4 Ruda Hela      - $Human_Bandit (kaptur, gładka twarz): kaptur z peleryną szary, rude włosy spod kaptura, tunika szara
Pasma barw jak w pula_kolory.py: (hue od, do), (sat od, do), (val od, do), (wiersz klatki od, do) -> (nowa barwa, mnożnik
nasycenia, mnożnik jasności). Popiersia: tools/busts/make_kompania_<n>.py.
"""
import os, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CH = os.path.join(ROOT, "img", "characters")
sys.path.insert(0, HERE)
from pula_kolory import _rgb_hsv, _hsv_rgb, maska   # noqa: E402

GREY = 214          # (szarość płaszczy: chłodna, prawie bez nasycenia)
KOMPANIA = {
    "Kompania_1": ("$Human_Merc", "Hubert Szary", [
        (((0, 40), (0.22, 1), (0.10, 0.70), (27, 64)), (GREY, 0.16, 1.15)),     # przeszywanica, tarcza, pas
        (((0, 40), (0.25, 1), (0.10, 0.66), (12, 27)), (32, 0.10, 1.55)),       # broda i wąsy pod kapalinem: siwe
    ]),
    "Kompania_2": ("$Human_Knife", "Jasiek Brzytwa", [
        (((0, 40), (0.30, 1), (0.10, 0.66), (20, 50)), (GREY, 0.14, 1.05)),     # skórzana kamizelka (i opaska na głowie)
        (((20, 50), (0.08, 0.32), (0.30, 0.80), (28, 50)), (GREY, 0.30, 0.82)), # płócienna koszula
        (((345, 10), (0.40, 1), (0.10, 0.70), (0, 34)), (GREY, 0.16, 0.85)),    # czerwona chusta na głowie i twarzy
    ]),
    "Kompania_3": ("$Human_Archer", "Kazik Kołek", [
        (((60, 130), (0.12, 1), (0.10, 1), (0, 40)), (GREY, 0.40, 1.05)),       # zielony kaptur z peleryną
    ]),
    "Kompania_4": ("$Human_Bandit", "Ruda Hela", [
        (((0, 40), (0.40, 1), (0.30, 0.70), (0, 36)), (GREY, 0.16, 1.15)),      # brązowy kaptur z peleryną (jaśniejsze tony)
        (((0, 40), (0.40, 1), (0.10, 0.30), (0, 36)), (GREY, 0.18, 1.00)),      # ciemne fałdy kaptura i peleryny
        (((30, 75), (0.10, 0.45), (0.15, 0.70), (30, 54)), (GREY, 0.35, 1.00)), # khaki tunika
    ]),
}


def przemaluj(src, zmiany):
    im = np.asarray(Image.open(src).convert("RGBA")).astype(np.float64) / 255.0
    h, s, v = _rgb_hsv(im[..., :3])
    wiersze = (np.arange(im.shape[0])[:, None] * np.ones((1, im.shape[1]))) % 64
    out = im.copy()
    for pasmo, (hue, sm, vm) in zmiany:
        m = maska(h, s, v, im[..., 3], pasmo, wiersze)
        rgb = _hsv_rgb(np.full_like(h, float(hue)), np.clip(s * sm, 0, 1), np.clip(v * vm, 0, 1))
        out[..., :3] = np.where(m[..., None], rgb, out[..., :3])
    return Image.fromarray(np.clip(out * 255.0 + 0.5, 0, 255).astype(np.uint8), "RGBA")


RUDE = ((104, 30, 18), (160, 58, 28), (204, 96, 46))   # rude włosy: cień, środek, blask


def rude_wlosy(src, im):
    """Ruda Hela: grzywka nad twarzą i kosmyki po bokach twarzy (spod kaptura), rude - w klatkach S, W, E (bez widoku od tyłu).
    Twarz = piksele skóry w wierszach 8-21 klatki; włosy = ciemne piksele tuż nad nią (grzywka) i 1-2 px obok niej po bokach
    (w W tylko z tyłu głowy - po prawej, w E po lewej)."""
    a = np.asarray(Image.open(src).convert("RGBA")).astype(np.float64) / 255.0
    h, s, v = _rgb_hsv(a[..., :3])
    op = a[..., 3] > 0.5
    skin = op & (h >= 5) & (h <= 40) & (s >= 0.2) & (s <= 0.7) & (v >= 0.5)
    out = np.asarray(im).copy()
    dark = op & ~skin & (v < 0.45)

    def put(x, y, tone):
        out[y, x, :3] = RUDE[tone]

    for row in range(3):                      # 0 = S, 1 = W, 2 = E (wiersze arkusza $)
        sides = {0: (True, True), 1: (False, True), 2: (True, False)}[row]
        for col in range(3):
            x0, y0 = col * 64, row * 64
            ys = [y for y in range(8, 22) if skin[y0 + y, x0:x0 + 64].any()]
            if not ys:
                continue
            top = ys[0]
            for y in ys[:9]:
                xs = np.nonzero(skin[y0 + y, x0:x0 + 64])[0]
                xl, xr = x0 + xs.min(), x0 + xs.max()
                for x, on in ((xl - 1, sides[0]), (xl - 2, sides[0] and y > top + 2), (xr + 1, sides[1]), (xr + 2, sides[1] and y > top + 2)):
                    if on and dark[y0 + y, x]:
                        put(x, y0 + y, 1 if v[y0 + y, x] > 0.12 else 0)
            # grzywka: ciemne piksele nad twarzą i w jej dwóch górnych wierszach - tylko tam, gdzie tuż pod nimi jest skóra twarzy
            xs = np.nonzero(skin[y0 + top:y0 + top + 3, x0:x0 + 64].any(axis=0))[0]
            m = 1 if row == 0 else 0
            for y in range(top - 2, top + 2):
                for x in range(x0 + xs.min() - m, x0 + xs.max() + 1 + m):
                    if dark[y0 + y, x] and skin[y0 + y + 1:y0 + y + 4, x].any():
                        put(x, y0 + y, 2 if y < top else 1)
    return Image.fromarray(out, "RGBA")


def main():
    podglad = "--podglad" in sys.argv
    S = 3
    prev = Image.new("RGBA", (len(KOMPANIA) * (3 * 64 * S + 16) + 16, 4 * 64 * S + 40), (128, 128, 128, 255))
    d = ImageDraw.Draw(prev)
    for i, (key, (base, kto, zmiany)) in enumerate(KOMPANIA.items()):
        im = przemaluj(os.path.join(CH, base + ".png"), zmiany)
        if key == "Kompania_4":
            im = rude_wlosy(os.path.join(CH, base + ".png"), im)
        if not podglad:
            im.save(os.path.join(CH, "$Npc_" + key + ".png"))
        x = 16 + i * (3 * 64 * S + 16)
        prev.alpha_composite(im.resize((im.width * S, im.height * S), Image.NEAREST), (x, 30))
        d.text((x, 8), "%s - %s (%s)" % (key, kto, base), fill=(255, 255, 255, 255))
    where = tempfile.gettempdir() if podglad else os.path.join(ROOT, "docs", "postacie")
    out = os.path.join(where, "kompania.png")
    prev.convert("RGB").save(out)
    print("Wolna Kompania:", len(KOMPANIA), "arkuszy" + (" (tylko podgląd)" if podglad else ""), "- stykówka:", out)


if __name__ == "__main__":
    main()
