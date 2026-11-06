# -*- coding: utf-8 -*-
"""Porządki w tawernie (gracz 2026-11-05: „napraw co się da”, „coś krzywo leży na krawędzi mebla”, „ma być ładnie i równo”): przedmioty na meblach Map001 i Map025.
Plan robi tools/mapy/popraw.py (każda zmiana przyjęta tylko, gdy kontrola potwierdza, że usuwa P2 i nie dodaje nowego problemu), tylko kod P2; mapy gracza odblokowane jego poleceniem.
  python tools/tavern/porzadki/plan_przedmiotow.py   -> tools/mapy/staging/Map001.json, Map025.json + raporty narzędzia"""
import os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
import popraw as P
P.KOLEJNOSC[:] = ["P2"]
P.UZYTKOWNIKA.discard(1)
for mid in (1, 25):
    wynik = P.plan_mapy(mid, verbose=True)
    print("---", mid, type(wynik).__name__, (wynik if isinstance(wynik, (int, str)) else ""))
