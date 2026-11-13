# -*- coding: utf-8 -*-
"""Obrazy kroku 3 -> docs/audyt_map/poprawki/krok3/: gra_<miejsce>.png (z gry: lewo przed, prawo po, pasek z podpisem),
render_<miejsce>.png (mapylib: przed / po), zestawienie_gra.png (wszystkie pary z gry w jednym arkuszu).
Wejscie: tools/poprawki_krok3/tmp/zdjecia/{before,after}/<miejsce>.png (gra_test.js)   python tools/poprawki_krok3/obrazy.py"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as L
OUT = os.path.join(ROOT, "docs", "audyt_map", "poprawki", "krok3"); os.makedirs(OUT, exist_ok=True)
SRC = os.path.join(HERE, "tmp", "zdjecia")
try: F = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
except Exception: F = ImageFont.load_default()
NAMES = {
    "13_a_brama_zachodni_koniec": ("Gory i kamieniolom: brama i zachodni koniec polnocnego klifu", 13, (0, 20, 27, 36)),
    "13_b_wschodni_koniec_klifu": ("Gory i kamieniolom: wschodni koniec polnocnego klifu", 13, (44, 20, 66, 36)),
    "13_c_kamieniolom_mury": ("Gory i kamieniolom: mury kamieniolomu", 13, (28, 36, 62, 58)),
    "13_d_wzgorza_3_zachod_wschod": ("Gory i kamieniolom: dwa poludniowe wzgorza (wschodnie = polka orla b, zamkniete)", 13, (10, 91, 47, 107)),
    "13_e_wzgorze_4_i_ruiny_5": ("Gory i kamieniolom: wzgorze 4 (ruiny 5 usuniete)", 13, (44, 94, 90, 116)),
    "13_f_wzgorze_6": ("Gory i kamieniolom: wzgorze 6", 13, (90, 88, 112, 106)),
    "13_g_wzgorze_7_polka_orla": ("Gory i kamieniolom: wzgorze 7 = polka orla a (zamkniete, bez schodow)", 13, (92, 57, 114, 74)),
    "13_h_ruina_8": ("Gory i kamieniolom: ruina 8 usunieta", 13, (12, 72, 36, 96)),
    "13_i_morze_przy_krawedzi": ("Gory i kamieniolom: morze przy prawej krawedzi (bez zmian, patrz raport)", 13, (100, 66, 119, 86)),
    "13_j_morze_poludnie": ("Gory i kamieniolom: morze na poludniu (bez zmian)", 13, (100, 106, 119, 119)),
    "125_a_latarnia": ("Przystan: wzgorze latarni, dwa pietra", 125, (77, 86, 102, 113)),
    "125_b_bruk_nad_latarnia": ("Przystan: plama bruku nad latarnia usunieta", 125, (80, 82, 102, 100)),
}


def pair(a, b, title, tag):
    w = a.width * 2 + 6
    im = Image.new("RGB", (w, a.height + 30), (255, 255, 255)); d = ImageDraw.Draw(im); d.rectangle([0, 0, w, 29], fill=(24, 22, 30))
    d.text((8, 5), "%s   |   %s   LEWO: przed   PRAWO: po" % (title, tag), font=F, fill=(255, 220, 90))
    im.paste(a, (0, 30)); im.paste(b, (a.width + 6, 30)); return im


def main():
    sheet = []
    for key, (title, mid, box) in NAMES.items():
        pa, pb = os.path.join(SRC, "before", key + ".png"), os.path.join(SRC, "after", key + ".png")
        if os.path.exists(pa) and os.path.exists(pb):
            im = pair(Image.open(pa).convert("RGB"), Image.open(pb).convert("RGB"), title, "W GRZE")
            im.save(os.path.join(OUT, "gra_%s.png" % key)); sheet.append(im)
        # mapylib render before / after
        sa = L.Mapa(mid); sb = L.Mapa(mid, raw=json.load(open(os.path.join(HERE, "staging", "data", "Map%03d.json" % mid), encoding="utf-8")))
        ra = L.render(sa, region=box, scale=0.667).convert("RGB"); rb = L.render(sb, region=box, scale=0.667).convert("RGB")
        pair(ra, rb, title, "RENDER (mapylib)").save(os.path.join(OUT, "render_%s.png" % key))
    if sheet:
        W = max(i.width for i in sheet); scale = 1.0
        # a sheet: the pairs stacked, each scaled to a common width
        tw = 1600; rows = [i.resize((tw, int(i.height * tw / i.width)), Image.LANCZOS) for i in sheet]
        H = sum(r.height + 8 for r in rows)
        S = Image.new("RGB", (tw, H), (255, 255, 255)); y = 0
        for r in rows: S.paste(r, (0, y)); y += r.height + 8
        S.save(os.path.join(OUT, "zestawienie_gra.png")); print("zestawienie:", S.size)
    print(len(sheet), "par z gry")


if __name__ == "__main__": main()
