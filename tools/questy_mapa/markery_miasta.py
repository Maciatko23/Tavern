# -*- coding: utf-8 -*-
"""Znaczniki "Miejsce: <klucz>" przed drzwiami szesciu nowych budynkow Kruczogrodu (Map008; docs/questy_mapa/PLAN.md pkt 7) - JEDNO zrodlo:
czyta je tools/miasto5/build5.py (sekcja "questy_mapa", przy przebudowie miasta) i tools/questy_mapa/zastosuj.py (na biezacej data/Map008.json,
bo przebudowa z build5 cofnelaby pozniejsze zmiany w edytorze). key: (x, y, kierunek, kto/co tam stoi)"""
MARKERY = {
    "wiatrak_przed":    (97, 88, 2, "mlynarz przed wiatrakiem (maka, zboze: K6, D42)"),
    "cech_przed":       (91, 88, 2, "goscie cechu (podroznicy W-)"),
    "lazn_przed":       (97, 74, 2, "przed lazni (goscie)"),
    "przytulek_przed":  (97, 105, 2, "Ciotka Stefa z kotlem przed przytulkiem (W6)"),
    "garbarnia_przed":  (114, 89, 2, "przy suszarni skor (Ignac: K10, K20, K21, D1, D18)"),
    "sukiennice_przed": (51, 63, 2, "szwaczka i targ przed sukiennicami"),
}
