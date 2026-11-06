# -*- coding: utf-8 -*-
"""Składa docs/mapy/WZORCE.md z szablonu, liczb (wzorce_liczby.py), wyników sprawdzeń estetyka f-j na wzorcach i listy pieczątek."""
import os, sys, subprocess, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pieczatki as P
sys.path.insert(0, os.path.join(P.ROOT, "tools", "mapy")); sys.argv = ["x"]
import estetyka as E, mapylib as L

NL = chr(10)
sz = open(os.path.join(HERE, "wzorce_szablon.md"), encoding="utf-8").read()
liczby = subprocess.run([sys.executable, os.path.join(HERE, "wzorce_liczby.py")], capture_output=True).stdout.decode("utf-8")
rows = []
for n in P.wszystkie_pieczatki():
    p = P.wczytaj_pieczatke(n)
    rows.append("| `%s` | Map%03d | %dx%d | %d | %s |" % (n, p["zrodlo"].get("mapa", 0), p["w"], p["h"], len(p["zdarzenia"]), p["opis"]))


class _F:
    def krawedz(self, m, s_): return []


gracz990 = json.loads(open(os.path.join(P.ROOT, "tools", "mapa_probna", "gracz", "Map990_gracz_dc61145d.json"), "rb").read().decode("utf-8"))
wiersze = ["| mapa | a | b | c | d | e | f | g | h | i | j |", "|---|---|---|---|---|---|---|---|---|---|---|"]
for n, m in [("Map013", L.Mapa(13)), ("Map159", L.Mapa(159)), ("Map008", L.Mapa(8)), ("Map003", L.Mapa(3)), ("Map990 (wersja gracza dc61145d)", L.Mapa(990, raw=gracz990))]:
    r = E.wszystkie(_F(), m, "abcdefghij")
    wiersze.append("| %s | %s |" % (n, " | ".join(str(len(r.get(k, []))) for k in "abcdefghij")))
spr = NL.join(wiersze) + NL + NL + "(f: schodkowa/zębata linia lica, dziura 1 kratki, otwarta strona, urwany kawałek; g: drzewo przy wodzie; h: rama gruntu pod płotem/murem; i: zaokrąglony koniec lica przy schodach; j: kanciasta/prostokątna plama. Liczby na wzorcach to w większości dzieło gracza, nie błędy do poprawy; nic w nich nie zmieniono.)"
out = sz.replace("{SPRAWDZENIA}", spr).replace("{LICZBY}", liczby).replace("{PIECZATKI}", NL.join(rows))
open(os.path.join(P.ROOT, "docs", "mapy", "WZORCE.md"), "w", encoding="utf-8", newline="\n").write(out)
print("ok", len(out))
