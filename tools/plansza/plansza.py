# -*- coding: utf-8 -*-
"""Plansza 3x3 (gracz 2026-11-08: „na powierzchni 9 map, coś na zasadzie złączonego screena”, wszystkie równe, brzeg wyspy równo
zaokrąglony; „Ty wybierz i tak działaj” -> 120 x 120 kratek, Łąka pod Gawrą na środku z prawej). Wspólne dane narzędzi tools/plansza:
  BOARD: mapa -> (kolumna, rząd, dx, dy) - pole planszy i przesunięcie starej treści mapy w jej nowym polu (dx, dy: stara kratka
         (x, y) leży teraz na (x + dx, y + dy); co wychodzi poza N x N - ucięte, tylko teren i przyroda, sprawdzone 2026-11-08).
Przesunięte są tylko mapy, których zabudowa leżałaby inaczej w morzu (Garnizon, Posiadłość Lorda, Góry, Podgrodzie, Przystań);
miasto, Łąka, Kruczy Jar i Dom dziadka zostają w swoich współrzędnych (rzeczy gracza na działce się nie ruszają)."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W   # (map_text, reshape, at, put, need_editor_closed ...)
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

N = 120
BOARD = {
    162: (0, 0, 22, 24),   # Garnizon: twierdza z dala od brzegu z północy i zachodu; ucięte 14 kolumn ze wschodu i 4 rzędy zatoki z południa
    24: (1, 0, 20, 60),    # Posiadłość Lorda: przy południowej krawędzi pola (nad miastem), na środku
    13: (2, 0, 0, 24),     # Góry: północna ściana skalna staje się klifem nad morzem; wschodnie ~22 kolumny pod brzeg
    111: (0, 1, 18, 33),   # Podgrodzie: brama zachodnia miasta (rzędy 50-51) na wprost bramy Podgrodzia (17-18); ucięte 25 rzędów pól z południa
    8: (1, 1, 0, 0),       # Kruczogród: bez przesunięcia; ucięte 18 pustych rzędów z południa (za murem)
    4: (2, 1, 0, 0),       # Łąka pod Gawrą
    125: (0, 2, 0, 0),     # Przystań: bez przesunięcia - jej basen otwiera się na zachód, na otwarte morze (gracz 2026-11-08: „statki mają mieć gdzie
                           # i jak wpływać”); ucięte 12 kolumn lasu ze wschodu
    3: (1, 2, 0, 0),       # Kruczy Jar - działka gracza: bez przesunięcia
    20: (2, 2, 0, 0),      # Dom dziadka
}
NAMES = {162: "Garnizon nad zatoką", 24: "Posiadłość Lorda", 13: "Góry i kamieniołom", 111: "Podgrodzie", 8: "Kruczogród", 4: "Łąka pod Gawrą",
         125: "Przystań", 3: "Kruczy Jar", 20: "Dom dziadka - Podwórze"}
STG = os.path.join(HERE, "staging")


def world_of(m):
    c, r, dx, dy = BOARD[m]
    return c * N, r * N


def read_map(m, src=None):
    p = os.path.join(src or os.path.join(ROOT, "data"), "Map%03d.json" % m)
    raw = open(p, "rb").read()
    return json.loads(raw.decode("utf-8")), raw

# places kept for a later step (teren.py lays no stamp there): the lighthouse on Przystań's cape (latarnia.py)
RESERWA = {125: [(72, 92, 106, 117)]}
