# -*- coding: utf-8 -*-
"""Rendery mapy 221 -> docs/NOWY_SWIAT/posiadlosc_cala.png + docs/NOWY_SWIAT/posiadlosc_ekrany/*.png"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
import wspolne as WS
OUT = WS.ROOT + "docs/NOWY_SWIAT/"
SHOTS = {
    "01_dwor_i_dziedziniec": (40, 20),
    "02_brama_i_wartownia": (42, 30),
    "03_ogrod_i_oranzeria": (15, 20),
    "04_ogrod_posag": (15, 31),
    "05_sluzba_i_stajnia": (62, 22),
    "06_sad_i_pastwisko": (70, 16),
    "07_droga_i_most_do_lasu": (30, 46),
    "08_jaz_i_sluza": (53, 52),
    "09_zbiornik_i_rzeka": (68, 55),
    "10_chata_straznika_i_kanal": (46, 62),
    "11_las_lorda_brama": (22, 62),
    "12_dziura_w_plocie": (8, 62),
    "13_strumyk_zachod": (8, 46),
    "14_gory_polnoc": (40, 8),
}
if __name__ == "__main__":
    WS.render_map(os.path.join(HERE, "staging", "Map221.json"), OUT + "posiadlosc_cala.png", SHOTS, OUT + "posiadlosc_ekrany",
                  chars_dir=os.path.join(HERE, "staging", "characters"))
