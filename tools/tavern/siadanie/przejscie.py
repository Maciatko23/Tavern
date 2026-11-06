# -*- coding: utf-8 -*-
"""Klatki przejścia stoi -> siedzi na stołku (2026-11-05; gracz: „idąc postacie wchodzą na stołek i wtedy przejście na siedzenie”).
Wejście dla PixelLab: stojąca postać z własnego arkusza $Npc_<Klucz>.png (wiersz „w prawo”, klatka środkowa) na płótnie 96x96 w (16,28), czyli dokładnie to, co widać, gdy idzie.
  python tools/tavern/siadanie/przejscie.py wejscia     -> klatki/<Klucz>/stoi.png i kosci_przejscie.json (3 pozy: 35%, 70%, siedzi)"""
import json, os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)
import rig
BAZOWE = ["Kowal", "Woziwoda", "Kupiec", "Soltys", "Garbarz", "Bartek", "Woznica", "Janek", "Rozbitek", "Pula_M", "Pula_K", "Pula_S", "Pula_Z"]


def wejscia():
    for k in BAZOWE:
        sh = Image.open(os.path.join(ROOT, "img", "characters", "$Npc_%s.png" % k)).convert("RGBA")
        c = sh.width // 3
        kl = sh.crop((c, c * 2, c * 2, c * 3))
        pl = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        pl.alpha_composite(kl, (rig.OX, rig.OY))
        pl.save(os.path.join(HERE, "klatki", k, "stoi.png"))
        print(k, sh.size, kl.getbbox())
    S, R = rig.stoi(), rig.siedzi()
    pozy = [rig.mix(S, R, 0.35), rig.mix(S, R, 0.7), R]
    open(os.path.join(HERE, "kosci_przejscie.json"), "w").write(json.dumps([rig.poza(p) for p in pozy], separators=(",", ":")))


if __name__ == "__main__":
    wejscia()
