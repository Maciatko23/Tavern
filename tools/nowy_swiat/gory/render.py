# -*- coding: utf-8 -*-
"""python tools/nowy_swiat/gory/render.py -> docs/NOWY_SWIAT/gory_cala.png + gory_ekrany/*.png (1280x720 at 1:1)"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
import wspolne as WS
OUT = WS.ROOT + "docs/NOWY_SWIAT/"
SHOTS = {
    "01_zachodni_szew_droga_i_rzeka": (8, 45),
    "02_las_gorski_i_polana": (15, 24),
    "03_rozdroze_i_rampa_do_kamieniolomu": (36, 38),
    "04_kamieniolom": (38, 31),
    "05_kopalnia_i_chata_sztygara": (40, 15),
    "06_chaty_gornikow": (32, 20),
    "07_pustelnia_i_jaskinia": (54, 15),
    "08_zrodlo_i_jezioro": (66, 15),
    "09_wodospady_i_kanal": (61, 30),
    "10_most_drogowy": (62, 42),
    "11_schody_wschod": (69, 30),
    "12_poludnie_rzeka_i_laka": (40, 58),
}
if __name__ == "__main__":
    WS.render_map(os.path.join(HERE, "staging", "Map222.json"), OUT + "gory_cala.png", SHOTS, OUT + "gory_ekrany",
                  chars_dir=os.path.join(HERE, "staging", "characters"))
