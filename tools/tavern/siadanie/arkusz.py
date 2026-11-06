# -*- coding: utf-8 -*-
"""Arkusze siedzących gości z klatek PixelLab (animate_with_skeleton_v3, płótno 96x96, rig.py): img/characters/Przytulna_Siedzi_<Klucz>.png w formacie Przytulna.js
(komórki 88x88; wiersz 0 zwrot na wschód, wiersz 1 na zachód; kolumna 0 siedzi, 1-8 pije; wiersze 2-3 to samo z jedzeniem; wiersz 76 komórki leży na ev.screenY()).
Biodra (wiersz 80, kolumna 47 płótna) mają wypaść na środku okrągłego siedziska krzesła z Map001 (kafel 390: siedzisko wiersze 9-33 kratki, środek ~ wiersz 24-26):
screenY to wiersz 42 kratki, więc wiersz 96 płótna = wiersz 76 komórki, czyli wycinek płótna: x od 3, y od 20.
Klatki: tools/tavern/siadanie/klatki/<Klucz>/f0..f4.png (pije), j0..j4.png (je).
Warianty kolorów (Pula_M2...) to te same arkusze przekolorowane pasmami z tools/podroznicy/pula_kolory.py (0 generacji).
  python tools/tavern/siadanie/arkusz.py                 wszystkie do tools/tavern/siadanie/staging/img/characters
  python tools/tavern/siadanie/arkusz.py Kowal Pula_K    tylko te (wariant przebudowuje się z ciałem)"""
import os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "podroznicy"))
import pula_kolory as pk

KL = os.path.join(HERE, "klatki")
WY = os.path.join(HERE, "staging", "img", "characters")
CELL = 88
X0, Y0 = 3, 20
UKLAD = [0, 1, 2, 3, 4, 4, 3, 2, 1]   # kolumna 0 siedzi, 1-8 unosi, przy ustach, odkłada
UKLAD_JE = [1, 1, 2, 3, 4, 4, 3, 2, 1]   # (jedzenie: klatka j0 bywa o kilka px wyższa od reszty - odpoczynkiem jest j1)
BAZOWE = ["Kowal", "Woziwoda", "Kupiec", "Soltys", "Garbarz", "Bartek", "Woznica", "Janek", "Rozbitek", "Pula_M", "Pula_K", "Pula_S", "Pula_Z"]
WARIANTY = {k: v for k, v in pk.WARIANTY.items() if k in ("Pula_M2", "Pula_M3", "Pula_K2", "Pula_K3", "Pula_S2", "Pula_Z2")}


def komorka(f):
    out = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    out.alpha_composite(f.crop((X0, Y0, min(96, X0 + CELL), 96)), (0, 0))
    return out


def klatki(klucz, lit):
    p = [os.path.join(KL, klucz, "%s%d.png" % (lit, i)) for i in range(5)]
    return [Image.open(x).convert("RGBA") for x in p] if all(os.path.exists(x) for x in p) else None


def arkusz(klucz):
    pije, je = klatki(klucz, "f"), klatki(klucz, "j")
    if not pije: return None
    wiersze = [pije] + ([je] if je else [])
    prz = [os.path.join(KL, klucz, n + ".png") for n in ("stoi", "p0", "p1")]   # wiersze 4-5: przejście stoi -> siedzi (przejscie.py)
    ma_prz = bool(je) and all(os.path.exists(x) for x in prz)
    sh = Image.new("RGBA", (CELL * len(UKLAD), CELL * 2 * (len(wiersze) + (1 if ma_prz else 0))), (0, 0, 0, 0))
    for r, kl in enumerate(wiersze):
        for c, i in enumerate(UKLAD if r == 0 else UKLAD_JE):
            k = komorka(kl[i])
            sh.alpha_composite(k, (c * CELL, r * 2 * CELL))
            sh.alpha_composite(k.transpose(Image.FLIP_LEFT_RIGHT), (c * CELL, (r * 2 + 1) * CELL))
    if ma_prz:
        for c, x in enumerate(prz):
            k = komorka(Image.open(x).convert("RGBA"))
            sh.alpha_composite(k, (c * CELL, 4 * CELL))
            sh.alpha_composite(k.transpose(Image.FLIP_LEFT_RIGHT), (c * CELL, 5 * CELL))
    return sh


def main():
    os.makedirs(WY, exist_ok=True)
    chce = sys.argv[1:] or BAZOWE
    for klucz in BAZOWE:
        if klucz not in chce: continue
        sh = arkusz(klucz)
        if sh is None: print("BRAK klatek:", klucz); continue
        p = os.path.join(WY, "Przytulna_Siedzi_%s.png" % klucz)
        sh.save(p)
        print(klucz, sh.size, "z przejściem" if sh.height >= CELL * 6 else "BEZ PRZEJŚCIA")
        for w, (cialo, zmiany) in WARIANTY.items():
            if cialo != klucz: continue
            pk.przekoloruj(p, cialo, zmiany, 0).save(os.path.join(WY, "Przytulna_Siedzi_%s.png" % w))
            print(" ", w, "<-", cialo)


if __name__ == "__main__":
    main()
