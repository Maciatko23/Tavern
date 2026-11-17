# -*- coding: utf-8 -*-
"""Renders of map 219 (wspolne.render_map -> mzrender; "!$1_" pictures are one frame like in the game).
python tools/nowy_swiat/wybrzeze/render.py  -> docs/NOWY_SWIAT/wybrzeze_cala.png + docs/NOWY_SWIAT/wybrzeze_ekrany/*.png"""
import os, sys, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
import wspolne as WS
sys.path.insert(0, WS.ROOT + "tools/town")
import mzrender as R

_orig_frame = R.Sheets.frame
def frame(self, name, index, direction, pattern):          # TawernaCore.ONE_PICTURE: "!$1_..." is ONE frame (the whole file)
    if re.match(r"^[!]*\$1_", name):
        bm = self.char(name)
        return bm.copy() if bm is not None else None
    return _orig_frame(self, name, index, direction, pattern)
R.Sheets.frame = frame

OUT = WS.ROOT + "docs/NOWY_SWIAT/"
SHOTS = {   # name: (centre tile x, y)
    "01_wrak_od_dziobu": (14, 35),
    "02_wrak_rufa_i_plaza": (28, 36),
    "03_chata_jana_i_sieci": (35, 43),
    "04_molo_i_lodka": (26, 48),
    "05_warzelnia_hanny": (42, 53),
    "06_ujscie_koryta": (36, 61),
    "07_cypel_i_latarnia": (23, 17),
    "08_droga_i_droga_do_cypla": (44, 36),
    "09_wschodni_szew": (68, 48),
    "10_koryto_wschod": (64, 62),
    "11_skaly_poludnie": (30, 68),
    "12_gory_polnoc_i_las": (52, 12),
}
if __name__ == "__main__":
    WS.render_map(os.path.join(HERE, "staging", "Map219.json"), OUT + "wybrzeze_cala.png", SHOTS, OUT + "wybrzeze_ekrany")
