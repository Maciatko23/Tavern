# -*- coding: utf-8 -*-
"""Rendery mapy 218 (wspolne.render_map -> mzrender: reguly kafli i obrazkow gry, bez animacji).
python tools/nowy_swiat/podgrodzie/render.py  -> docs/NOWY_SWIAT/podgrodzie_cala.png + docs/NOWY_SWIAT/podgrodzie_ekrany/*.png"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
import wspolne as WS
OUT = WS.ROOT + "docs/NOWY_SWIAT/"
SHOTS = {   # name: (centre tile x, y)
    "01_dom_dziadka_i_dzialka": (24, 17),
    "02_wiatrak_i_chata_mlynarza": (11, 33),
    "03_droga_i_chalupy_polnoc": (33, 37),
    "04_kapliczka_i_skrzyzowanie": (46, 40),
    "05_przytulek": (42, 51),
    "06_koryto_i_kladka": (30, 60),
    "07_koryto_wschod_i_chalupy": (57, 52),
    "08_wschodnia_krawedz_i_szopa": (68, 25),
    "09_zachodnia_krawedz": (6, 48),
    "10_poludnie": (22, 69),
    "11_szopa_wroblow_i_laka": (64, 14),
    "12_gory_polnoc": (40, 8),
    "13_gory_poludnie_i_wschod": (66, 66),
    "14_szew_zachod_polnoc": (8, 12),
    "15_szew_wschod_poludnie": (72, 68),
}
if __name__ == "__main__":
    WS.render_map(os.path.join(HERE, "staging", "Map218.json"), OUT + "podgrodzie_cala.png", SHOTS, OUT + "podgrodzie_ekrany",
                  chars_dir=os.path.join(HERE, "staging", "characters"))
