# -*- coding: utf-8 -*-
"""Map001: Dziadek Ozzy (zdarzenie 4) stał na krześle (46,39) i zasłaniał gościa nad sobą - staje kratkę obok, na podłodze (47,39). Zmienia tylko jego x. Gracz zgodził się 2026-11-05.
  python tools/poprawki/ozzy_obok_krzesla.py   (przy zamkniętym edytorze)"""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
P = os.path.join(ROOT, "data", "Map001.json")
b = open(P, "rb").read()
i = b.find(b'"id":4,"name":"Dziadek Ozzy"')
assert i >= 0 and b.count(b'"name":"Dziadek Ozzy"') == 1
stare = b'"x":46,"y":39},'
j = b.find(stare, i)
assert 0 < j - i < 4000, "Ozzy nie stoi już na (46,39)"
n = b[:j] + b'"x":47,"y":39},' + b[j + len(stare):]
m = json.loads(n.decode("utf-8"))
assert m["events"][4]["x"] == 47 and m["events"][4]["y"] == 39
assert not [e for e in m["events"] if e and e["id"] != 4 and e["x"] == 47 and e["y"] == 39], "kratka zajęta"
open(P, "wb").write(n)
print("Ozzy: (46,39) -> (47,39)")
