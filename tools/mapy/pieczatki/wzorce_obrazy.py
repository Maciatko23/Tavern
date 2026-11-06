# -*- coding: utf-8 -*-
"""Wycinki wielkości jednego ekranu gry (27x15 kratek, 1296x720) z 4 wzorców -> docs/mapy/wzorce/*.png"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import podglad, mapylib as L
OUT = os.path.join(L.ROOT, "docs", "mapy", "wzorce")
os.makedirs(OUT, exist_ok=True)
# (mapa, x, y, plik, opis)
WYCINKI = [
    (13, 20, 50, "013_wzgorze_pierscien", "wzgórze-pierścień z klifem (kafle A2-47), zakończenia po bokach, szczyt z wcięciami"),
    (13, 92, 66, "013_wzgorze_w_ziemi", "wzgórze w ziemi: poszarpana ściana od południa, przejście kafli A5 między trawą a ziemią"),
    (13, 44, 12, "013_kamieniolom_schody", "wyrobisko: dwie skalne półki i schody między nimi"),
    (13, 0, 38, "013_skraj_lasu", "skraj lasu: rząd sosen, podszyt, kamienie, ścieżka"),
    (13, 26, 33, "013_suche_koryto", "suche koryto: pas ciemnej ziemi (A2-36) z kamieniami i pniem, sosny na skraju"),
    (13, 52, 52, "013_plamy_ziemi", "łąka z plamami ziemi i rumoszu, pojedyncze sosny"),
    (159, 0, 12, "159_cypel", "cypel w morzu: trzy poziomy wzgórza, schody, szczyty płaskie"),
    (159, 50, 20, "159_brzeg_morza", "linia brzegu: schodki 1-5 kratek, sosny przy brzegu"),
    (159, 14, 50, "159_sciezka_rozwidlenie", "ścieżka ziemna z rozwidleniem, plamy ciemnej trawy"),
    (8, 20, 102, "008_podmiejska_laka", "teren za murem: ścieżki, plamy ziemi, kwiaty i sosny"),
    (8, 30, 88, "008_mur_z_basztami", "mur z basztami i bramą (A3/A4), schody na wale"),
    (3, 20, 33, "003_wzgorze_ruiny", "kamienne wzgórze-pierścień z wejściem, sosny i jabłonie wokół"),
    (3, 0, 0, "003_geste_sosny_plot", "gęsty las sosnowy, płot z furtką i mur zakończony słupami"),
    (3, 24, 14, "003_pole_skal", "pole skał i zarośli oraz ścieżka"),
    (3, 28, 6, "003_sciezka_zakret", "ścieżka o zakręcie i rozdzieleniu, plamy ciemnej trawy"),
]
if __name__ == "__main__":
    for mid, x, y, n, op in WYCINKI:
        mp = L.Mapa(mid)
        podglad.wycinek(mp, x, y, 27, 15, False).save(os.path.join(OUT, n + ".png"))
        print(n)
