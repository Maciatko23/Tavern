# Popiersie bohatera "sprzed sztormu" (prolog, sceny na lądzie: chata z matką): ta sama twarz i ten sam krój co Hero_Bust
# (People1_3 przemalowany w make_hero.py), ale ubranie całe - bez łat, dziur, postrzępionych brzegów i bez brudu na policzku.
# Koszula z jaśniejszego, czystego lnu, kamizelka z ciepłej brązowej wełny (jeszcze nie sprana). Bez PixelLab.
# Run: python tools/busts/make_hero_lad.py [out.png]
import os
import runpy
import sys
import tempfile

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from bustlib import *  # noqa: E402,F401

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Hero_Bust_Lad.png')

# make_hero.py robi przekolorowanie (base_a) i dopiero potem niszczy ubranie; uruchamiamy go z wyjściem do pliku tymczasowego
# (Hero_Bust.png zostaje nietknięty) i bierzemy jego base_a oraz maski - ta sama twarz co do piksela
tmp = os.path.join(tempfile.gettempdir(), 'hero_bust_tmp_%d.png' % os.getpid())
argv = sys.argv[:]
sys.argv = [os.path.join(HERE, 'make_hero.py'), tmp]
try:
    g = runpy.run_path(os.path.join(HERE, 'make_hero.py'), run_name='make_hero_lad_base')
finally:
    sys.argv = argv
    if os.path.exists(tmp):
        os.remove(tmp)

out = g['base_a'].copy()
v = g['v']
vest, shirt, shirt_lines = g['vest'], g['shirt'], g['shirt_lines']


def hsvset(m, h, sat, val):
    rgb = hsv_to_rgb(np.stack([np.full_like(v, h / 360.0), np.full_like(v, sat), np.clip(val, 0, 1)], -1))
    out[..., :3] = np.where(m[..., None], rgb, out[..., :3])


hsvset(vest, 27, 0.30, 0.13 + v * 0.47)      # ciepła brązowa wełna, jeszcze nie sprana
hsvset(shirt, 38, 0.07, v * 0.88)            # czysty, jaśniejszy len
hsvset(shirt_lines, 30, 0.12, v * 0.74)      # fałdy koszuli

save(out, OUT)
print('ok', OUT)
