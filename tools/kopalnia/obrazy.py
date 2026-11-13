# -*- coding: utf-8 -*-
"""Sklejanie obrazów kopalni (po tools/kopalnia/obrazy.js): mapa z gry zszyta z ekranów, klatki i GIF przejazdu, zestawienie.
  python tools/kopalnia/obrazy.py"""
import os, sys, json, shutil
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "docs", "kopalnia")
RAW = os.path.join(OUT, "surowe")
W, H, SW, SH = 96, 40, 26, 15


def font(size):
    for p in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def raw(name): return Image.open(os.path.join(RAW, name + ".png")).convert("RGB")


def main():
    # ---- the map as the game draws it (screens at whole tiles, hero and HUD hidden)
    xs, ys = [0, 26, 52, W - SW], [0, 13, H - SH]
    big = Image.new("RGB", (W * 48, H * 48), (10, 10, 16))
    for y in ys:
        for x in xs:
            im = raw("mapa_%d_%d" % (x, y)).crop((0, 0, SW * 48, SH * 48))
            big.paste(im, (x * 48, y * 48))
    big.save(os.path.join(OUT, "mapa_calosc_w_grze.png"))
    big.resize((W * 24, H * 24), Image.LANCZOS).save(os.path.join(OUT, "mapa_calosc_w_grze_mala.png"))
    # ---- the ride: a frame strip and a GIF
    log = json.load(open(os.path.join(RAW, "jazda.json")))
    pick = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13]
    cols, tw, th = 4, 480, 270
    rows = (len(pick) + cols - 1) // cols
    strip = Image.new("RGB", (cols * tw, rows * (th + 26)), (14, 14, 20))
    d = ImageDraw.Draw(strip)
    for k, i in enumerate(pick):
        im = raw("jazda_%02d" % i).resize((tw, th), Image.LANCZOS)
        x, y = (k % cols) * tw, (k // cols) * (th + 26)
        strip.paste(im, (x, y))
        d.text((x + 8, y + th + 2), "jazda: %d. kratka toru" % round(log[i]["s"]), fill=(230, 210, 120), font=font(16))
    strip.save(os.path.join(OUT, "jazda_klatki.png"))
    gifd = json.load(open(os.path.join(RAW, "gif.json")))
    frames = []
    for i in range(len(gifd)):
        p = os.path.join(RAW, "gif_%03d.png" % i)
        if os.path.exists(p): frames.append(Image.open(p).convert("RGB").resize((640, 360), Image.LANCZOS).quantize(colors=128, method=Image.MEDIANCUT))
    if frames:
        dur = [max(40, min(400, v)) for v in gifd[:len(frames)]]
        frames[0].save(os.path.join(OUT, "jazda.gif"), save_all=True, append_images=frames[1:], duration=dur, loop=0, optimize=True)
    # ---- the named pictures (1280 x 720, no HUD)
    names = {"wejscie_przed": "wejscie_gory_przed", "wejscie_po": "wejscie_gory_po", "stacja_a": "stacja_a", "stacja_a_wagonik": "stacja_a_wagonik",
             "rozjazd_dzwignia": "rozjazd_dzwignia", "odnoga_ruda": "odnoga_ruda", "odnoga_tory": "odnoga_tory", "stacja_b": "stacja_b",
             "stacja_b_przyjazd": "stacja_b_przyjazd", "gran_przyjazd": "gran_przyjazd", "gran_szyb": "gran_szyb"}
    for src, dst in names.items(): raw(src).save(os.path.join(OUT, dst + ".png"))
    # before / after of the entrance side by side
    a, b = raw("wejscie_przed"), raw("wejscie_po")
    box = (320, 40, 960, 520)
    both = Image.new("RGB", (1280 + 12, 480 + 34), (14, 14, 20))
    both.paste(a.crop(box), (0, 34)); both.paste(b.crop(box), (652, 34))
    d = ImageDraw.Draw(both)
    d.text((8, 6), "PRZED: ściana kamieniołomu (Góry i kamieniołom)", fill=(230, 210, 120), font=font(20))
    d.text((660, 6), "PO: wejście do kopalni, tory do starego wózka", fill=(230, 210, 120), font=font(20))
    both.save(os.path.join(OUT, "wejscie_przed_po.png"))
    # ---- the summary
    tiles = [("wejscie_gory_przed", "Góry: ściana przed zmianą"), ("wejscie_gory_po", "Góry: wejście do kopalni"), ("stacja_a_wagonik", "Stacja A i wagonik"),
             ("rozjazd_dzwignia", "Rozjazd z dźwignią"), ("odnoga_ruda", "Odnoga z rudą"), ("stacja_b", "Stacja B: schody na szczyt"),
             ("gran_przyjazd", "Orla Grań: wyjście ze schodów"), ("gran_szyb", "Orla Grań: szyb do kopalni")]
    cw, ch = 640, 360
    cols = 3
    rows = (len(tiles) + 1 + cols - 1) // cols
    zest = Image.new("RGB", (cols * cw, 70 + rows * (ch + 30) + 20 + 800 + 40), (14, 14, 20))
    d = ImageDraw.Draw(zest)
    d.text((16, 14), "Kopalnia pod Orlą Granią - zestawienie (Map213, tory i wagoniki, wejście z Gór, wyjście na Orlą Grań)", fill=(255, 220, 90), font=font(28))
    for k, (f, cap) in enumerate(tiles):
        x, y = (k % cols) * cw, 70 + (k // cols) * (ch + 30)
        zest.paste(Image.open(os.path.join(OUT, f + ".png")).convert("RGB").resize((cw, ch), Image.LANCZOS), (x, y))
        d.text((x + 8, y + ch + 4), cap, fill=(230, 230, 230), font=font(18))
    k = len(tiles)
    x, y = (k % cols) * cw, 70 + (k // cols) * (ch + 30)
    zest.paste(Image.open(os.path.join(OUT, "jazda_klatki.png")).convert("RGB").resize((cw, ch), Image.LANCZOS), (x, y))
    d.text((x + 8, y + ch + 4), "Przejazd: klatki (jazda.gif obok)", fill=(230, 230, 230), font=font(18))
    y0 = 70 + rows * (ch + 30) + 10
    ov = Image.open(os.path.join(OUT, "mapa_calosc_w_grze_mala.png")).convert("RGB")
    zest.paste(ov.resize((cols * cw, 800), Image.LANCZOS), (0, y0))
    d.text((8, y0 + 810), "Cała mapa (96 x 40) z gry, ekran po ekranie; tory: stacja A (zachód) - mijanka - rozjazd - stacja B (północny wschód) i ślepa odnoga z rudą", fill=(230, 230, 230), font=font(18))
    zest.save(os.path.join(OUT, "zestawienie.png"))
    print("ok", OUT)


if __name__ == "__main__":
    main()
