# -*- coding: utf-8 -*-
"""zdjecia_tmp/{before,after} -> docs/questy_mapa/zdjecia/: <id>_przed.png, <id>_po.png, <id>_para.png (obok siebie) + zestawienie.png (wszystko)"""
import os, json, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
TMP = os.path.join(HERE, "zdjecia_tmp"); OUT = os.path.join(ROOT, "docs", "questy_mapa", "zdjecia")
os.makedirs(OUT, exist_ok=True)
CAP = {
 "przystan_brama": "Przystań: brama „Ścieżka na klif” obok wzgórza latarni (101,95) -> Pustelnia (kieszeń 155-157)",
 "gory_brama": "Góry: Brama Milczących (6,27) otwarta -> Osada Milczących (kieszeń 120-124)",
 "podgrodzie_brama": "Podgrodzie, północno-wschodni róg: brama (110,20) -> Spalona zagroda (kieszeń 168-169)",
 "laka_menhiry": "Łąka pod Gawrą: krąg menhirów (50,78) - D36; pastwisko przy menhirach (44,61)",
 "jar_polna_droga": "Kruczy Jar, Polna droga: podkowa K3 (74,18), kapliczka 022 K67 (69,14), strażnica 022 K68 (59,13)",
 "jar_prom": "Kruczy Jar: wóz promu W5 (88,16) - nocą 21-3, dziś dzień",
 "jar_skraj_lasu": "Kruczy Jar, Skraj lasu: nora K59 (95,30), kopiec 023 K68 (92,26), obóz CzO D33 (96,42), obóz przemytników W5 (96,52)",
 "jar_omszala_laka": "Kruczy Jar, Omszała łąka: polanka Jagny D30 (18,72), źródełko (40,79), kręgi grzybów, kopiec 017 K68 (8,79)",
 "laka_lesna_droga": "Łąka, Leśna droga: mielerz K63 (46,24), kapliczka 021 K67 (42,15), źródełko (42,28), juk K65",
 "laka_owce_oboz": "Łąka: zabłąkana owca K64 (3 miejsca), obóz rabusiów (87,39)",
 "miasto_wiatrak_cech": "Miasto: Wiatrak i Cech - znaczniki przed drzwiami",
 "miasto_lazn": "Miasto: Łaźnia - znacznik przed drzwiami",
 "miasto_przytulek": "Miasto: Przytułek - znacznik (Ciotka Stefa)",
 "miasto_garbarnia": "Miasto: Garbarnia - znacznik (Ignac)",
 "miasto_sukiennice": "Miasto: Sukiennice - znacznik (szwaczka Dorota idzie tu rano)",
 "kieszen_osada": "W kieszeni: Osada Milczących, tuż po wejściu bramą z Gór",
 "kieszen_pustelnia": "W kieszeni: Pustelnia na klifie, tuż po wejściu bramą z Przystani",
 "kieszen_zagroda": "W kieszeni: Spalona zagroda, tuż po wejściu bramą z Podgrodzia",
}
def font(n):
    for f in ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf"):
        if os.path.exists(f): return ImageFont.truetype(f, n)
    return ImageFont.load_default()
F, FS = font(20), font(15)
sheets = []
for pid, cap in CAP.items():
    a = os.path.join(TMP, "after", pid + ".png"); b = os.path.join(TMP, "before", pid + ".png")
    if not os.path.exists(a): continue
    A = Image.open(a).convert("RGB"); A.save(os.path.join(OUT, pid + "_po.png"))
    if os.path.exists(b):
        B = Image.open(b).convert("RGB"); B.save(os.path.join(OUT, pid + "_przed.png"))
    else: B = None
    w = A.width + (B.width + 12 if B else 0); h = max(A.height, B.height if B else 0) + 56
    S = Image.new("RGB", (w, h), (24, 24, 24)); d = ImageDraw.Draw(S)
    d.text((8, 6), cap, font=F, fill=(255, 225, 74))
    x = 0
    if B: d.text((8, 32), "PRZED", font=FS, fill=(200, 200, 200)); S.paste(B, (0, 56)); x = B.width + 12
    d.text((x + 8, 32), "PO" if B else "PO (nowe miejsce, wnętrze kieszeni)", font=FS, fill=(120, 255, 140)); S.paste(A, (x, 56))
    S.save(os.path.join(OUT, pid + "_para.png")); sheets.append(S)
W = max(s.width for s in sheets); W = min(W, 1500)
sc = [s.resize((int(s.width * min(1, W / s.width)), int(s.height * min(1, W / s.width)))) for s in sheets]
H = sum(s.height + 10 for s in sc)
Z = Image.new("RGB", (W, H), (12, 12, 12)); y = 0
for s in sc: Z.paste(s, (0, y)); y += s.height + 10
Z.save(os.path.join(OUT, "zestawienie.png")); print("zestawienie", Z.size, len(sheets), "par")
