# -*- coding: utf-8 -*-
"""Dowody: pary przed/po z gry (zrzuty_przed / zrzuty_po, ta sama kamera), przegląd całej mapy przed/po i zestawienie.
   python tools/usterki/gory_przystan/dowody.py          -> docs/usterki/Map013 i Map125 (png)"""
import os, sys, json, importlib.util
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)
import foto
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("gp", os.path.join(HERE, "popraw.py")); gp = importlib.util.module_from_spec(spec); spec.loader.exec_module(gp)
OUT = os.path.join(ROOT, "docs", "usterki")
FONT = None
def font(sz=16):
    try: return ImageFont.truetype("arial.ttf", sz)
    except Exception: return ImageFont.load_default()


def para(mid, region, podpis, plik, skala=2, mark=None):
    """para przed|po; mark = [(x, y, w, h)] ramki na obu obrazach"""
    x0, y0, x1, y1 = region
    a = foto.wycinek("zrzuty_przed", mid, x0, y0, x1, y1, skala); b = foto.wycinek("zrzuty_po", mid, x0, y0, x1, y1, skala)
    for im in (a, b):
        if mark:
            d = ImageDraw.Draw(im)
            for (mx, my, mw, mh) in mark:
                d.rectangle(((mx - x0) * 24 * skala, (my - y0) * 24 * skala, (mx - x0 + mw) * 24 * skala, (my - y0 + mh) * 24 * skala), outline=(255, 60, 60), width=2)
    cap = 56
    im = Image.new("RGB", (a.width * 2 + 12, a.height + cap), (22, 22, 22))
    im.paste(a, (0, cap)); im.paste(b, (a.width + 12, cap))
    d = ImageDraw.Draw(im)
    d.text((8, 6), podpis, fill=(255, 235, 120), font=font(17))
    d.text((8, 32), "PRZED", fill=(255, 150, 150), font=font(15)); d.text((a.width + 20, 32), "PO", fill=(140, 255, 140), font=font(15))
    os.makedirs(os.path.dirname(plik), exist_ok=True)
    im.save(plik)
    return plik


def klastry(cells, gap=4):
    cells = set(cells); out = []
    while cells:
        c = cells.pop(); comp = [c]; st = [c]
        while st:
            x, y = st.pop()
            for q in [q for q in cells if abs(q[0] - x) <= gap and abs(q[1] - y) <= gap]:
                cells.discard(q); comp.append(q); st.append(q)
        out.append(comp)
    return out


def region_wokol(cx, cy, w=30, h=18, W=120, H=120):
    x0 = max(0, min(W - w, cx - w // 2)); y0 = max(0, min(H - h, cy - h // 2))
    return (x0, y0, x0 + w - 1, y0 + h - 1)


def przeglad(mid, plik, tytul):
    xs, ys = foto.ekrany(mid)
    a = foto.wycinek("zrzuty_przed", mid, 0, 0, 119, 119, 1); b = foto.wycinek("zrzuty_po", mid, 0, 0, 119, 119, 1)
    sc = 0.42
    a = a.resize((int(a.width * sc), int(a.height * sc)), Image.LANCZOS); b = b.resize((int(b.width * sc), int(b.height * sc)), Image.LANCZOS)
    im = Image.new("RGB", (a.width * 2 + 12, a.height + 40), (22, 22, 22))
    im.paste(a, (0, 40)); im.paste(b, (a.width + 12, 40))
    d = ImageDraw.Draw(im); d.text((8, 10), tytul + "   PRZED (lewo)  |  PO (prawo)", fill=(255, 235, 120), font=font(18))
    im.save(plik)


def main():
    import json as J
    wyn = []
    for mid in (13, 125):
        K, _ = gp.zbuduj(mid)
        d0 = J.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
        d1 = J.load(open(os.path.join(HERE, "staging", "data", "Map%03d.json" % mid), encoding="utf-8"))
        W, H = d0["width"], d0["height"]; n = W * H
        boxes = [h["old"] for h in gp.HILLS.get(mid, [])]
        base = os.path.join(OUT, "Map%03d" % mid)
        os.makedirs(base, exist_ok=True)
        pairs = []
        # hills
        for h in gp.HILLS.get(mid, []):
            x0, y0, x1, y1 = h["old"]
            reg = (max(0, x0 - 4), max(0, y0 - 4), min(119, x1 + 4), min(119, y1 + 3))
            pairs.append(("wzgorze_%d_%d.png" % (x0, y0), reg, "Mapa %d, półka/plateau (%d,%d): prostokąt -> nieregularny, zaokrąglony obrys, zamknięty ze wszystkich stron" % (mid, x0, y0), [(x0, y0, x1 - x0 + 1, y1 - y0 + 1)]))
        if mid == 125:
            pairs.append(("plot_nad_dachami.png", (42, 16, 82, 32), "Mapa 125, wiersze 24/25 (waga 3): płot na kalenicy trzech dachów -> górny płot o rząd wyżej", [(47, 19, 31, 2)]))
            pairs.append(("bramki_podworzy.png", (44, 26, 78, 32), "Mapa 125, wiersze 31-33: wejścia w płotach podwórzy bez słupków -> słupki bramy (209/208)", [(50, 29, 4, 1), (60, 29, 4, 1), (69, 29, 4, 1)]))
            pairs.append(("zagroda.png", (34, 56, 52, 68), "Mapa 125, wiersz 54: zagroda z dwoma gruntami w środku -> jedna trawa", [(38, 59, 12, 8)]))
        if mid == 13:
            pairs.append(("linia_x16.png", (8, 28, 28, 40), "Mapa 13, wiersz 06: samotna cienka ściana A5 (x=16, y 32-52) bez wzgórza -> trawa (góra odcinka)", [(16, 32, 1, 8)]))
            pairs.append(("linia_x16_dol.png", (8, 44, 28, 56), "Mapa 13, wiersz 06: ta sama linia, dolny koniec", [(16, 44, 1, 9)]))
            pairs.append(("plama_wstega_29.png", (22, 52, 44, 72), "Mapa 13, wiersz 29: ciemna wstęga (5x15) -> zdjęta", [(31, 57, 5, 15)]))
            pairs.append(("plama_47.png", (28, 84, 46, 94), "Mapa 13, wiersz 47: ciemny prostokąt z zaokrąglonymi rogami -> zdjęty", [(34, 87, 5, 3)]))
            pairs.append(("plama_53.png", (94, 83, 110, 93), "Mapa 13, wiersz 53: ciemny krzyż -> zdjęty", [(99, 87, 3, 3)]))
            pairs.append(("schody_lico_21_55.png", (14, 50, 32, 60), "Mapa 13, wiersz 27 (ES-i): lico przy schodach prosto (113/121)", [(21, 55, 4, 2)]))
            pairs.append(("schody_lico_53_110.png", (46, 105, 62, 115), "Mapa 13, wiersz 65 (ES-i): lico przy schodach prosto (113/121)", [(53, 110, 4, 1)]))
            pairs.append(("plama_36_77_64.png", (68, 58, 88, 72), "Mapa 13, wiersz 36: kwadratowa łacha ziemi na trawie -> obrys łamany", [(75, 64, 6, 6)]))
        # trees
        for (eid, a, b) in getattr(K, "tree_moves", []):
            pairs.append(("drzewo_%d_stare.png" % eid, region_wokol(a[0], a[1]), "Mapa %d, drzewo %d (%d,%d): za blisko wody / na gruncie brzegu -> przesunięte dalej od brzegu na (%d,%d) [kamera na starym miejscu]" % (mid, eid, a[0], a[1], b[0], b[1]), [(a[0], a[1], 1, 1)]))
            pairs.append(("drzewo_%d_nowe.png" % eid, region_wokol(b[0], b[1]), "Mapa %d, drzewo %d: nowe miejsce (%d,%d) [kamera na nowym miejscu]" % (mid, eid, b[0], b[1]), [(b[0], b[1], 1, 1)]))
        # ground clusters (layer 0 natural ground changed outside the hills' boxes and not under moved trees)
        ch = []
        for i in range(n):
            if d0["data"][i] != d1["data"][i] and 1 <= i % W <= W - 2:
                x, y = i % W, i // W
                if any(b[0] - 3 <= x <= b[2] + 3 and b[1] - 3 <= y <= b[3] + 3 for b in boxes): continue
                if mid == 125 and 47 <= x <= 77 and 18 <= y <= 20: continue
                if mid == 125 and 38 <= x <= 49 and 59 <= y <= 66: continue
                if mid == 13 and x == 16 and 30 <= y <= 56: continue
                ch.append((x, y))
        cl = sorted(klastry(ch, 5), key=lambda c: -len(c))[:8]
        for k, c in enumerate(cl):
            cx = sum(p[0] for p in c) // len(c); cy = sum(p[1] for p in c) // len(c)
            pairs.append(("grunt_%d.png" % (k + 1), region_wokol(cx, cy, 26, 15), "Mapa %d, wiersze ES-j/ES-b: proste obrysy plam gruntu łamane (skupisko %d kratek wokół (%d,%d))" % (mid, len(c), cx, cy), [(min(p[0] for p in c), min(p[1] for p in c), max(p[0] for p in c) - min(p[0] for p in c) + 1, max(p[1] for p in c) - min(p[1] for p in c) + 1)]))
        for (fn, reg, cap, mk) in pairs:
            para(mid, reg, cap, os.path.join(base, fn), 2, mk)
            wyn.append((mid, fn))
        przeglad(mid, os.path.join(base, "przeglad_calej_mapy.png"), "Mapa %d" % mid)
        print("Map%03d: %d par" % (mid, len(pairs)))
    # zestawienie: a contact sheet of the main pairs
    main_files = [(13, "wzgorze_98_60.png"), (13, "wzgorze_95_93.png"), (13, "wzgorze_14_96.png"), (13, "wzgorze_32_96.png"),
                  (125, "wzgorze_104_29.png"), (125, "wzgorze_96_44.png"), (125, "plot_nad_dachami.png"), (125, "bramki_podworzy.png"), (125, "zagroda.png"),
                  (13, "linia_x16.png"), (13, "plama_wstega_29.png"), (13, "schody_lico_21_55.png")]
    ims = []
    for mid, fn in main_files:
        p = os.path.join(OUT, "Map%03d" % mid, fn)
        if os.path.exists(p): ims.append(Image.open(p).convert("RGB"))
    if ims:
        w = 960
        ims = [i.resize((w, int(i.height * w / i.width)), Image.LANCZOS) for i in ims]
        cols = 2; rows = (len(ims) + 1) // 2
        hs = [max(i.height for i in ims[r * cols:(r + 1) * cols]) for r in range(rows)]
        sh = Image.new("RGB", (w * cols + 10, sum(hs) + 10 * rows + 50), (12, 12, 12)); y = 50
        ImageDraw.Draw(sh).text((10, 12), "Mapy 13 (Góry i kamieniołom) i 125 (Przystań): najważniejsze poprawki, przed (lewo) / po (prawo)", fill=(255, 235, 120), font=font(20))
        for r in range(rows):
            for c in range(cols):
                k = r * cols + c
                if k < len(ims): sh.paste(ims[k], (c * (w + 10), y))
            y += hs[r] + 10
        os.makedirs(OUT, exist_ok=True)
        sh.save(os.path.join(OUT, "zestawienie_Map013_Map125.png"))
        for mid in (13, 125): sh.save(os.path.join(OUT, "Map%03d" % mid, "zestawienie.png"))
    print("gotowe")


if __name__ == "__main__":
    main()
