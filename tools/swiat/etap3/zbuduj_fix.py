# -*- coding: utf-8 -*-
"""Poprawka po instalacji etapu 3 (czesc map): przejscia niezgodne ze swiatem wykryte testem tests/swiat_przejscia_test.js.
 13: #9-11 (N -> Osada) usuniete (N sasiaduje z 175; Osada = 13 E <-> 120 W przez Swiat_Data); #1-3 (W) wszystkie -> 157 (120, 14-16)
 21: #109-111 (W -> 22) usuniete (W sasiaduje z 914); 22: #59-61 (E -> 21) usuniete (E sasiaduje z 4/900); 120: #83-85 (S -> 13) usuniete (S sasiaduje z 22);
 157: #59-60 (skrypt -> 159, srodek mapy) usuniete; 159: #36-37 (skrypt -> 157) i #38-40 (S -> 13) usuniete (S sasiaduje z 4 / 900 bez przejscia)
Baza: data/ po instalacji etapu 3; wynik: staging_fix/data + sumy.json. python tools/swiat/etap3/zbuduj_fix.py"""
import os, sys, json, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "swiat", "etap1")); sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import zbuduj as Z
W = Z.W
OUT = os.path.join(HERE, "staging_fix", "data"); os.makedirs(OUT, exist_ok=True)
sumy = {}
def praca(mid, usun, f=None):
    m = Z.wczytaj(mid); sumy[mid] = Z.sha(mid)
    for i in usun: m["events"][i] = None
    if f: f(m)
    open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(W.json_text(m, "map")); print("Map%03d: usuniete %s" % (mid, usun))
def gory_w(m):
    for i, ev in enumerate([m["events"][1], m["events"][2], m["events"][3]]):
        c = ev["pages"][0]["list"][0]; assert c["code"] == 201
        c["parameters"] = [0, 157, 120, 14 + i, 4, 0]; ev["name"] = "Przejście -> Urwisko Kruków"
praca(13, (9, 10, 11), gory_w); praca(21, (109, 110, 111)); praca(22, (59, 60, 61)); praca(120, (83, 84, 85)); praca(159, (36, 37, 38, 39, 40))   # 36-37: skrypt reserveTransfer(157, 110, 19-20): 159 W sasiaduje z 120
praca(157, (59, 60))   # skrypt reserveTransfer(159, 1, 33-34) w SRODKU mapy po rozszerzeniu
json.dump(sumy, open(os.path.join(HERE, "staging_fix", "sumy.json"), "w"), indent=1)
