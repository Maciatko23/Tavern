# -*- coding: utf-8 -*-
"""Liczy zadania w miescie / tawernie przed i po (klasyfikacja reczna, z tools/dawcy_miasto/zrzut.json: dawca i mapa dawcy) i pisze
docs/zadania_nowe/dawcy_w_miescie.md. Uzycie: python tools/dawcy_miasto/tabela.py"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.stdout.reconfigure(encoding="utf-8")
Q = json.load(open(os.path.join(HERE, "zrzut.json"), encoding="utf8"))["quests"]
IDS = list(Q.keys())
# kod: (oferta, oddanie): T = tawerna / miasto (Map001, Map008 i jego wnetrza), O = poza nimi, "-" = zadanie bez oddania (kres to praca / odkrycie)
# domyslnie (T, T); wyjatki PRZED zmiana:
PRZED = {
    "K32": ("O", "T"), "K57": ("O", "O"),
    "K40": ("O", "O"), "K41": ("O", "O"), "K42": ("O", "O"), "K43": ("O", "O"), "K44": ("O", "O"), "K45": ("O", "O"), "K46": ("O", "O"),
    "K47": ("O", "O"), "K48": ("O", "O"), "D20": ("O", "O"), "W10": ("O", "O"),
    "K49": ("O", "O"), "D22": ("O", "O"), "D29": ("O", "O"), "K69": ("O", "O"), "W11": ("T", "O"), "W13": ("O", "O"),
    "K52": ("O", "O"), "D26": ("T", "O"), "D27": ("T", "O"), "K61": ("O", "-"), "K66": ("O", "O"),
    "D25": ("O", "O"), "K70": ("T", "O"), "D28": ("O", "O"),
    "K56": ("O", "-"), "K58": ("O", "O"), "K62": ("O", "-"), "D30": ("O", "O"), "D31": ("O", "O"), "D21": ("O", "O"),
    "K59": ("O", "-"), "K60": ("O", "-"), "D33": ("O", "-"), "D35": ("O", "-"), "D36": ("O", "-"), "D38": ("O", "-"),
    "K64": ("O", "O"), "K65": ("O", "O"), "D32": ("O", "O"), "D34": ("O", "O"),
    "W4": ("T", "O"), "W5": ("T", "O"), "W8": ("T", "O"), "W9": ("O", "T"),
    "D43": ("T", "O"),
    # ukladane przez drugiego agenta (pustelnia): zostaja, jak sa
    "K50": ("O", "O"), "D23": ("O", "O"), "K51": ("O", "O"), "D24": ("O", "O"), "K53": ("O", "O"), "D40": ("T", "O"), "K68": ("O", "O"),
}
# PO zmianie (tylko to, co sie rusza; reszta jak przed)
PO = {
    "K40": ("T", "T"), "K41": ("T", "T"), "K43": ("T", "T"), "K44": ("T", "T"), "K45": ("T", "T"), "K46": ("T", "T"),
    "K47": ("T", "T"), "K48": ("T", "T"), "W10": ("T", "O"),
    "K49": ("T", "T"), "K52": ("T", "T"),
    "K56": ("T", "-"), "K58": ("T", "T"), "K62": ("T", "-"), "D31": ("T", "T"), "D21": ("T", "T"), "D34": ("T", "T"),
    "D20": ("O", "O"), "D22": ("T", "T"), "D29": ("T", "O"), "K69": ("T", "O"),
}
def count(m):
    town = [i for i in IDS if (m.get(i, ("T", "T"))[0] == "T" and m.get(i, ("T", "T"))[1] in ("T", "-"))]
    mixed = [i for i in IDS if (m.get(i, ("T", "T"))[0] == "T" and m.get(i, ("T", "T"))[1] == "O") or (m.get(i, ("T", "T"))[0] == "O" and m.get(i, ("T", "T"))[1] == "T")]
    out = [i for i in IDS if m.get(i, ("T", "T"))[0] == "O" and m.get(i, ("T", "T"))[1] in ("O", "-")]
    offer = [i for i in IDS if m.get(i, ("T", "T"))[0] == "T"]
    return town, mixed, out, offer
A = dict((i, PRZED.get(i, ("T", "T"))) for i in IDS)
B = dict(A); B.update(PO)
a, b = count(A), count(B)
if __name__ == "__main__":
    print("przed: miasto+tawerna (oferta i oddanie)", len(a[0]), "| mieszane", len(a[1]), "| poza", len(a[2]), "| oferta w miescie", len(a[3]), "z", len(IDS))
    print("po:    miasto+tawerna (oferta i oddanie)", len(b[0]), "| mieszane", len(b[1]), "| poza", len(b[2]), "| oferta w miescie", len(b[3]))
    print("poza po:", b[2]); print("mieszane po:", b[1])
