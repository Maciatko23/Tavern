# -*- coding: utf-8 -*-
"""Rendery mapy 220 (wspolne.render_map -> mzrender). python tools/nowy_swiat/miasteczko/render.py"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
import wspolne as WS
OUT = WS.ROOT + "docs/NOWY_SWIAT/"
SHOTS = {
    "01_tawerna_i_ganek": (46, 34),
    "02_stajnia": (62, 33),
    "03_rynek_i_studnia": (47, 47),
    "04_strumien_i_rynna": (66, 48),
    "05_kaplica_i_dzwonnica": (14, 21),
    "06_cmentarz": (15, 12),
    "07_ratusz_i_kantor": (47, 22),
    "08_kuznia_i_domy": (24, 36),
    "09_zachodnia_krawedz": (8, 42),
    "10_wschodnia_krawedz": (71, 42),
    "11_piekarnia_i_browar": (66, 24),
    "12_cech_i_ciesla": (36, 64),
}
if __name__ == "__main__":
    WS.render_map(os.path.join(HERE, "staging", "Map220.json"), OUT + "miasteczko_cala.png", SHOTS, OUT + "miasteczko_ekrany",
                  chars_dir=os.path.join(HERE, "staging", "characters"))
