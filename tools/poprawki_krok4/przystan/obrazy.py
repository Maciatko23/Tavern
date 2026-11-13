# -*- coding: utf-8 -*-
"""Pary z gry przed/po -> docs/audyt_map/poprawki/krok4/Map125/<id>.png + zestawienie_gra.png (wejscie: tmp/zdjecia/{before,after})"""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(HERE, "tmp", "zdjecia"); OUT = os.path.join(ROOT, "docs", "audyt_map", "poprawki", "krok4", "Map125"); os.makedirs(OUT, exist_ok=True)
F = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)
CAP = {
 "01_wedzarnia_skala_kwiaty": "Przystan 1+2+3: wedzarnia z dachem i kominem na dachu, ciemna skala przy krawedzi usunieta, plama kwiatow zdjeta",
 "03_kwiaty_wschod_i_skala": "Przystan 3: jaskrawa plama kwiatow (44-46) -> spokojne kwiaty z kafli",
 "03b_kwiaty_95_100": "Przystan 3: jaskrawa plama kwiatow (95-100) -> spokojne kwiaty z kafli, nic na samej krawedzi",
 "05_deski_drewutnia_bez_zmian": "Przystan 5: deski przy stosie drewna to czesc zatwierdzonej drewutni - BEZ ZMIAN",
 "06_polka_orla_a": "Przystan 6: polka orla (96-101 x 44-51) jako wzgorze z gramatyki, grunt w srodku, sosna zdjeta z lica",
 "07_polka_orla_b": "Przystan 7: polka orla (104-109 x 29-36) jako wzgorze z gramatyki, grunt w srodku",
 "08_nabrzeze_luki": "Przystan 8: bruk nabrzeza konczy sie lukiem na obu koncach (u znaku i przy pochylni)",
 "09_plotki_dzialek": "Przystan 9: jeden rowny plot wokol trzech dzialek, bramy 2-kratkowe przy drzwiach, bez kikutow",
 "10_wozki_lampa_stos": "Przystan 10: wozek, taczka i lampa zgrupowane przy stosie drewna",
 "13_naroznik_bruk": "Przystan 13: plama bruku w rogu zmiekczona (owal w trawie, bez ciecia przy wodzie)",
 "14_lodzie_z_gory": "Przystan 14: zaglowka i lodki z gory jak barka",
 "15_skrzynka_20_4": "Przystan 15: kratka (20,4) zablokowana - bohater nie wchodzi pod skrzynke",
 "16_komora_celna": "Przystan 16: chorągiew na scianie, okno przesuniete, lampa przy drzwiach",
}
def pair(a, b, cap, s):
    a = a.resize((a.width * s, a.height * s), Image.NEAREST); b = b.resize((b.width * s, b.height * s), Image.NEAREST)
    w = max(a.width * 2 + 8, 900)
    im = Image.new("RGB", (w, a.height + 60), (255, 255, 255)); d = ImageDraw.Draw(im); d.rectangle([0, 0, w, 29], fill=(24, 22, 30))
    d.text((8, 4), cap, font=F, fill=(255, 220, 90)); d.rectangle([0, 30, w, 55], fill=(60, 56, 70))
    d.text((8, 32), "LEWO: przed", font=F, fill=(255, 255, 255)); d.text((a.width + 16, 32), "PRAWO: po", font=F, fill=(255, 255, 255))
    im.paste(a, (0, 58)); im.paste(b, (a.width + 8, 58)); return im
sheet = []
for k, cap in CAP.items():
    a = Image.open(os.path.join(SRC, "before", k + ".png")).convert("RGB"); b = Image.open(os.path.join(SRC, "after", k + ".png")).convert("RGB")
    s = 2 if a.width < 700 else 1
    im = pair(a, b, cap, s); im.save(os.path.join(OUT, k + ".png")); sheet.append(im)
tw = 1700; rows = [i.resize((tw, int(i.height * tw / i.width)), Image.LANCZOS) for i in sheet]
S = Image.new("RGB", (tw, sum(r.height + 8 for r in rows)), (255, 255, 255)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.height + 8
S.save(os.path.join(OUT, "zestawienie_gra.png")); print(len(sheet), S.size)
