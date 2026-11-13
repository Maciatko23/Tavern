# -*- coding: utf-8 -*-
"""Mapa wyspy w menu P dla planszy 3x3 (krok przed instalacją): staging/js/plugins/MapaWyspy_Data.js z tej samej planszy, co gra.
  - MIEJSCA: 9 map planszy (nazwy z obecnych danych mapy wyspy), punkt w środku mapy (równa siatka 3 x 3), napisy pod punktem;
  - DROGI: pary map z przejściami (staging Swiat_Data.js links) + podziemia pod miastem;
  - BRZEG: kontur lądu planszy (staging/lad.json), wygładzony; bez wysepek, koryta i puszczy (odstawione);
  - WNETRZA: wnętrza miejsc planszy (latarnia: 160 / 161 -> Przystań), wnętrza odstawionych miejsc pominięte; LUDZIE_FABULY bez zmian;
  - SWIAT_BOX / MAPY_OBRAZY: pudełko planszy w kratkach świata, obrazy prawdziwej mapy tylko 9 map (img/mapa_wyspy - tools/plansza/obrazy).
  python tools/plansza/mapa_wyspy.py   (po wszystko.py)"""
import json, os, re
import numpy as np
import cv2
from plansza import ROOT, N, STG, BOARD
CUR = os.path.join(ROOT, "js", "plugins", "MapaWyspy_Data.js")
OUT = os.path.join(STG, "js", "plugins", "MapaWyspy_Data.js")
PAD = 10
S = 3 * N
BOX = [-PAD, -PAD, S + 2 * PAD, S + 2 * PAD]
PUNKT = {}                                  # (a place's point in its map, else the middle - all in the middle: the sketch an even 3 x 3 grid)
PODZ = (120 + 60 - 36, 120 + 60 - 48)        # (the underground: north of the town's middle, under the castle hill - as on the old sketch)
cur = open(CUR, encoding="utf-8").read()
names = {int(m.group(1)): m.group(2) for m in re.finditer(r'\{ id: (\d+), nazwa: "([^"]+)"', cur)}
nx = lambda X: round((X - BOX[0]) / BOX[2], 3)
ny = lambda Y: round((Y - BOX[1]) / BOX[3], 3)
# ---- the places
miejsca = []
for mid, (c, r, _dx, _dy) in BOARD.items():
    lx, ly = PUNKT.get(mid, (N // 2, N // 2))
    X, Y = c * N + lx, r * N + ly
    x, y = nx(X), ny(Y)
    miejsca.append('        { id: %d, nazwa: "%s", x: %.3f, y: %.3f, at6: [%.3f, %.3f, "l", 0], at: [%.3f, %.3f, "c", 0], lab: "s" }'
                   % (mid, names[mid], x, y, x + 0.004, y, x, y + 0.045))
# ---- the roads: the pairs of maps with an open crossing
sw = open(os.path.join(STG, "js", "plugins", "Swiat_Data.js"), encoding="utf-8").read()
pary = sorted({tuple(sorted((int(a), int(b)))) for a, b in re.findall(r'"a": (\d+), "side": "[NSEW]", "from": \d+, "to": \d+, "b": (\d+)', sw)})
drogi = ", ".join("[%d, %d]" % p for p in pary) + ', ["podziemia", 8]'
# ---- the shore: the land of the board, smoothed
lad = json.load(open(os.path.join(STG, "lad.json")))
mask = np.zeros((S, S), np.uint8)
for k, cells in lad.items():
    c, r = BOARD[int(k)][0], BOARD[int(k)][1]
    for (x, y) in cells: mask[r * N + y, c * N + x] = 255
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
big = max(cs, key=cv2.contourArea)
ap = cv2.approxPolyDP(big, 2.2, True).reshape(-1, 2)
brzeg = ", ".join("[%.3f, %.3f]" % (nx(x + 0.5), ny(y + 0.5)) for x, y in ap)
# ---- the interiors: those of the board's places (the lighthouse's moved to the harbour)
PRZENIES = {160: 125, 161: 125}
wn = []
for m in re.finditer(r'(\d+): \[("podziemia"|\d+), "([^"]+)"\]', cur[cur.index("const WNETRZA"):cur.index("const LUDZIE_FABULY")]):
    i, place, nm = int(m.group(1)), m.group(2), m.group(3)
    if i in PRZENIES: place = str(PRZENIES[i])
    if place == '"podziemia"' or int(place) in BOARD: wn.append('%d: [%s, "%s"]' % (i, place, nm))
wnetrza = ""
line = "        "
for k, e in enumerate(wn):
    piece = e + (", " if k < len(wn) - 1 else "")
    if len(line) + len(piece) > 150: wnetrza += line.rstrip() + "\n"; line = "        "
    line += piece
wnetrza += line.rstrip()
ludzie = re.search(r"const LUDZIE_FABULY = (\{[^;]*\});", cur).group(1)
obrazy = ", ".join(str(m) for m in BOARD)
podz = (nx(PODZ[0]), ny(PODZ[1]))
js = """//=============================================================================
// MapaWyspy_Data.js  (GENEROWANE: tools/plansza/mapa_wyspy.py - plansza 3x3; nie edytuj ręcznie)
//=============================================================================
// The island's places for the P menu's "Mapa" tab (MapaWyspy.js): the board of nine maps (2026-11-08) - the places in their maps,
// the roads where the maps join, the shore of the board's land; the parked places, islets and the old forest are not on it.

/*:
 * @target MZ
 * @plugindesc Dane mapy wyspy: miejsca na zewnątrz i ich położenie na schemacie, drogi między nimi, wnętrza przypisane do miejsc. Plansza 3x3. v3.0.0
 * @author Claude
 * @help Same dane - czyta je MapaWyspy.js (ma stać pod tym plikiem na liście).
 * x, y - położenie na schemacie (0..1 szerokości i wysokości pudełka wyspy, y w dół); ASPEKT - stosunek szerokości do wysokości pudełka;
 * lab - strona etykiety (n/s/e/w); drogi - pary numerów map, między którymi jest przejście (droga na schemacie).
 */

(() => {
    "use strict";

    // the proportion of the island's box (the board is square)
    const ASPEKT = 1.0000;
    // the outdoor places: the map, its name, the place on the sketch, the names' places (at: the sketch, at6: the real map)
    const MIEJSCA = [
%s
    ];
    // the underground as one point (all its floors): under the castle hill, north of the town's middle
    const PODZIEMIA = { id: "podziemia", nazwa: "Podziemia", x: %.3f, y: %.3f, at6: [%.3f, %.3f, "l", 0], at: [%.3f, %.3f, "c", 0], lab: "n", wejscie: 8 };
    // the roads: the maps with an open crossing between them (both ways)
    const DROGI = [%s];
    // the island's shore on the sketch (0..1), drawn as a smooth shape; no islets on the board
    const BRZEG = [%s];
    const BRZEGI = [];
    const KORYTO = [];
    const LAS = [];
    // every other map -> the place it belongs to ("podziemia": a floor, the cellar's ruins, the cistern)
    const WNETRZA = {
%s
    };
    // the people of the story who are not TownLife residents: their place (the card's "Ludzie")
    const LUDZIE_FABULY = %s;

    // the board's box in the world's tiles (the places' x, y are on it), the maps that have their picture (img/mapa_wyspy/<id>.png, 4 px a tile)
    const SWIAT_BOX = [%d, %d, %d, %d];
    const MAPY_OBRAZY = [%s];

    window.MapaWyspyData = { ASPEKT, MIEJSCA, PODZIEMIA, DROGI, BRZEG, BRZEGI, KORYTO, LAS, WNETRZA, LUDZIE_FABULY, SWIAT_BOX, MAPY_OBRAZY };
})();
""" % (",\n".join(miejsca), podz[0], podz[1], podz[0] + 0.004, podz[1], podz[0], podz[1] - 0.04, drogi, brzeg, wnetrza, ludzie,
       BOX[0], BOX[1], BOX[2], BOX[3], obrazy)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "wb").write(js.encode("utf-8"))
print("mapa wyspy planszy: miejsc %d, dróg %d, punktów brzegu %d, wnętrz %d -> %s" % (len(miejsca), len(pary) + 1, len(ap), len(wn), OUT))
