# -*- coding: utf-8 -*-
"""docs/tawerna_przejscia/: dla każdego przejścia wycinek przed (obecna mapa, czerwone ramki = przywracane kratki) i po
(staging), z nazwą pomieszczenia, plus zestawienie.png."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "tavern", "v2"))
import render2
from PIL import Image, ImageDraw, ImageFont
from cells import CELLS
P = [("01_stare_mury_sklad", "Stare mury -> Skład (schowek z luźną cegłą, zejście do Map009)", [(9, 11)]),
     ("02_gabinet_magazyn", "Gabinet Borgara -> Magazyn", [(91, 11)]),
     ("03_browar_korytarz", "Browar -> Korytarz", [(21, 17), (22, 17)]),
     ("04_spizarnia_korytarz", "Spiżarnia -> Korytarz", [(32, 17), (32, 18), (32, 19)]),
     ("05_kuchnia_korytarz", "Kuchnia -> Korytarz (drzwi na zaplecze)", [(49, 17), (51, 17), (49, 18), (50, 18), (51, 18), (49, 19), (50, 19), (51, 19)]),
     ("06_piekarnia_korytarz", "Piekarnia -> Korytarz", [(59, 17), (59, 18), (59, 19)]),
     ("07_wedzarnia_korytarz", "Wędzarnia -> Korytarz", [(68, 17)]),
     ("08_sluzba_korytarz", "Pokój służby -> Korytarz", [(78, 17)]),
     ("09_korytarz_zachod", "Korytarz, zachodnie poprzeczne przejście (36,20-22)", [(36, 20), (36, 21), (36, 22)]),
     ("10_korytarz_srodek", "Korytarz, przejścia przy kuchni (48 i 52, 20-22)", [(48, 20), (48, 21), (48, 22), (52, 20), (52, 21), (52, 22)]),
     ("11_korytarz_wschod", "Korytarz, wschodnie poprzeczne przejście (64,20-22)", [(64, 20), (64, 21), (64, 22)]),
     ("12_korytarz_wielka_sala", "Korytarz -> Wielka sala za ladą (50,24-26)", [(50, 24), (50, 25), (50, 26)]),
     ("13_sala_biesiadna_wielka_sala", "Sala biesiadna <-> Wielka sala (zachodnia ściana: 36,30; 36,33-35; 36,43)", [(36, 30), (36, 33), (36, 34), (36, 35), (36, 43)]),
     ("14_wielka_sala_scena", "Wielka sala <-> Sala ze sceną (wschodnia ściana: 64,30; 64,33-35; 64,43)", [(64, 30), (64, 33), (64, 34), (64, 35), (64, 43)]),
     ("15_mysliwski_laznia", "Pokój myśliwski <-> Łaźnia (9-10,39-42)", [(10, 39), (9, 40), (10, 40), (9, 41), (10, 41), (9, 42), (10, 42)]),
     ("16_gry_rzutki", "Pokój gier <-> Sala rzutek (95-96,39-42)", [(96, 39), (95, 40), (96, 40), (95, 41), (96, 41), (95, 42), (96, 42)]),
     ("17_laznia_jadalnia", "Łaźnia <-> Jadalnia prywatna (24,46)", [(24, 46)]),
     ("18_palarnia_rzutki", "Palarnia i czytelnia <-> Sala rzutek (76,48)", [(76, 48)])]
P_EXTRA = [("19_bar_zaplecze", "Wielka sala -> zaplecze Borgara: przejścia przy ladzie (45 i 55, 29-30) i Borgar z powrotem w 52,28", [(45, 29), (45, 30), (55, 29), (55, 30), (52, 28)])]
assert sorted(c for p in P for c in p[2]) == sorted(CELLS), "podział na przejścia nie pokrywa wszystkich 61 kratek"
try: F = ImageFont.truetype("arial.ttf", 18)
except Exception: F = ImageFont.load_default()
def render(m):
    return render2.render(m).convert("RGB")
def main():
    n = json.load(open(os.path.join(ROOT, "data", "Map001.json"), encoding="utf-8"))
    f = json.load(open(os.path.join(HERE, "staging", "Map001.json"), encoding="utf-8"))
    A, B = render(n), render(f)
    out = os.path.join(ROOT, "docs", "tawerna_przejscia"); os.makedirs(out, exist_ok=True)
    sheets = []
    for key, name, cs in P + P_EXTRA:
        x0 = max(0, min(c[0] for c in cs) - 3); x1 = min(100, max(c[0] for c in cs) + 3)
        y0 = max(0, min(c[1] for c in cs) - 3); y1 = min(54, max(c[1] for c in cs) + 3)
        box = (x0 * 48, y0 * 48, (x1 + 1) * 48, (y1 + 1) * 48)
        a, b = A.crop(box), B.crop(box)
        d = ImageDraw.Draw(a)
        for x, y in cs: d.rectangle([(x - x0) * 48, (y - y0) * 48, (x - x0) * 48 + 47, (y - y0) * 48 + 47], outline=(255, 0, 0), width=3)
        w, h = a.size
        im = Image.new("RGB", (2 * w + 30, h + 40), (20, 16, 14)); dd = ImageDraw.Draw(im)
        dd.text((10, 8), name + "    [lewo: przed, czerwone ramki = przywracane kratki; prawo: po]", fill=(240, 200, 120), font=F)
        im.paste(a, (10, 34)); im.paste(b, (w + 20, 34))
        im.save(os.path.join(out, key + ".png")); sheets.append(im)
    W = max(i.width for i in sheets)
    cols = 2; rows = (len(sheets) + 1) // 2
    # zestawienie: miniatury po 1/2
    th = [i.resize((i.width // 2, i.height // 2), Image.LANCZOS) for i in sheets]
    cw = max(i.width for i in th); rh = [max(th[r * 2:r * 2 + 2], key=lambda i: i.height).height for r in range(rows)]
    Z = Image.new("RGB", (cols * cw + 10, sum(rh) + 10), (20, 16, 14)); y = 5
    for r in range(rows):
        for c in range(cols):
            k = r * 2 + c
            if k < len(th): Z.paste(th[k], (5 + c * cw, y))
        y += rh[r]
    Z.save(os.path.join(out, "zestawienie.png")); print("zapisano", len(sheets), "przejść + zestawienie.png w", out)
main()
