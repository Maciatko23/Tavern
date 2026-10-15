# Obrazy porównawcze "Grafit i miedź": makieta obok zrzutu z gry.
#   python tools/ui_grafit/porownanie.py
# Wejście: docs/ui_pomysly2/ (makiety) i docs/ui_grafit/grafit_*.png (zrzuty z tools/ui_grafit/capture.js).
import os
import sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "ui_czysty"))
from porownanie import sheet, OUT as _OUT   # noqa: E402  (the same sheet maker as the clean look's)

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MOCK = os.path.join(ROOT, "docs", "ui_pomysly2")
OUT = os.path.join(ROOT, "docs", "ui_grafit")

import porownanie as P   # noqa: E402
P.OUT = OUT

PAIRS = [
    ("luki_zegar_A.png", "grafit_hud.png", "porownanie_hud.png", "Grafit - mapa (łuki wokół zegara, wariant A)"),
    ("luki_zegar_A.png", "luki_hud.png", "porownanie_luki.png", "Łuki wokół zegara - wariant A"),
    ("postac_A.png", "postac_statystyki.png", "porownanie_postac_statystyki.png", "Postać (makieta A) - Statystyki"),
    ("postac_A_ekwipunek.png", "postac_ekwipunek.png", "porownanie_postac_ekwipunek.png", "Postać (makieta A) - Ekwipunek"),
    ("postac_A_umiejetnosci.png", "postac_umiejetnosci.png", "porownanie_postac_umiejetnosci.png", "Postać (makieta A) - Umiejętności"),
    ("pomysl_3_grafit_dziennik.png", "grafit_dziennik.png", "porownanie_dziennik.png", "Grafit - dziennik"),
    ("pomysl_3_grafit_plecak.png", "grafit_plecak.png", "porownanie_plecak.png", "Grafit - plecak"),
]

def zoom_game():
    """the game's corner in the three states of the mock-up's close-up (luki_zegar_A_zblizenie.png): 2 x, side by side"""
    from PIL import Image
    crop, states = (0, 0, 470, 240), ("luki_hud", "luki_niska_woda", "luki_walka")
    cw, ch = (crop[2] - crop[0]) * 2, (crop[3] - crop[1]) * 2
    out = Image.new("RGB", (cw * 3 + 40, ch + 20), (18, 19, 22))
    for i, n in enumerate(states):
        im = Image.open(os.path.join(OUT, n + ".png")).convert("RGB").crop(crop).resize((cw, ch), Image.NEAREST)
        out.paste(im, (10 + i * (cw + 10), 10))
    path = os.path.join(OUT, "luki_zblizenie_gra.png")
    out.save(path)
    return path


if __name__ == "__main__":
    print(sheet([(os.path.join(MOCK, "luki_zegar_A_zblizenie.png"), "Makieta A: zwykły stan, niskie nawodnienie, tryb walki"),
                 (zoom_game(), "W grze: te same trzy stany")], 1, 1400, "porownanie_luki_zblizenie.png", "Łuki wokół zegara - zbliżenie"))
    for mock, game, out, title in PAIRS:
        print(sheet([(os.path.join(MOCK, mock), "Makieta (" + mock + ")"), (os.path.join(OUT, game), "W grze")], 2, 900, out, title))
    print(sheet([(os.path.join(OUT, n + ".png"), lab) for n, lab in (("grafit_opcje", "Opcje"), ("grafit_zapis", "Zapis gry"), ("grafit_postac", "Postać (drzewka)"),
                 ("grafit_rozmowa", "Rozmowa i wybór"), ("grafit_budowa", "Menu budowy (Q)"), ("grafit_walka", "Tryb walki: oddech jako 5. łuk"))],
                3, 600, "okna_grafit.png", "Grafit - pozostałe okna"))
