# -*- coding: utf-8 -*-
"""Questy pustelni 2026-11-11 - Map008 (Kruczogrod): TYLKO dopisane zdarzenia (nic nie jest przesuwane ani kasowane):
  - kruczarnia (wieza z izba w pn.-wsch. rogu): zerdz_1, zerdz_2 (markery "Miejsce:" starych zerdzi Kruk.js) + dwa zdarzenia-zerdzie (blokuja kratke,
    patrz na nie: Kruk.look) - mlody kruk z obraczka siedzi na zerdz_2 (D24); "Miejsce: widok_kruczarnia" - punkt widokowy D40 pod wieza
  - "Miejsce: rynna_1..4" - cztery zapchane rynny zakonu na starych murach (K53; zdarzenia 680-683 wstawia Cysterna.js przez Tawerna.inject)
Fundament strazy (K68) stawia Zakon.js sam (Zakon_Data: Map162 x 83, y 45, obok garnizonu) - mapy to nie dotyczy.
Map162 nie jest zmieniana (fundament to zdarzenie wstawiane przez Zakon.js, mapa zostaje).

Zrodlo: domyslnie data/Map008.json; po stagingu innego agenta: --from sciezka/do/Map008.json (zdarzenia dopisywane na koncu, id == indeks).
Zapis: tools/questy_pustelnia/staging/data/Map008.json (nic w data/).
   python tools/questy_pustelnia/miasto008.py [--from sciezka]"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

def stop(msg): raise SystemExit("STOP: " + msg)
src = "data/Map008.json"
if "--from" in sys.argv: src = sys.argv[sys.argv.index("--from") + 1]
raw = open(src, "rb").read()
if b"\r" in raw: stop("Map008 ma CR")
m = json.loads(raw.decode("utf-8"))
if W.map_text(m).encode("utf-8") != raw: stop("%s nie jest w ukladzie edytora (otworz i zapisz w edytorze)" % src)
for i, e in enumerate(m["events"]):
    if e is not None and e["id"] != i: stop("zdarzenie %d pod indeksem %d" % (e["id"], i))
if any(e and e["name"] in ("Miejsce: zerdz_2", "Miejsce: rynna_1") for e in m["events"]): stop("Map008 ma juz te zdarzenia")

BLANK = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1,
         "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}
def C(code, params, indent=0): return {"code": code, "indent": indent, "parameters": params}
def page(lst=None, priority=1):
    return {"conditions": dict(BLANK), "directionFix": False, "image": {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0},
            "list": lst or [C(0, [])], "moveFrequency": 3, "moveRoute": {"list": [C(0, [])], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": priority, "stepAnime": False, "through": False, "trigger": 0, "walkAnime": False}
def add(name, x, y, pg, note=""):
    i = len(m["events"]); m["events"].append({"id": i, "name": name, "note": note, "pages": [pg], "x": x, "y": y}); return i

def free(x, y): return not any(e and e["x"] == x and e["y"] == y and e["pages"][0]["priorityType"] == 1 and not e["pages"][0]["through"] and e["pages"][0]["image"]["characterName"] for e in m["events"])

ZERDZ = [(110, 8), (112, 8)]
VIEW = (106, 9)
RYNNY = [(117, 41), (117, 64), (2, 54), (2, 92)]
for (x, y) in ZERDZ + [VIEW] + RYNNY:
    if not free(x, y): stop("zajeta kratka %s" % ((x, y),))
add("Miejsce: zerdz_1", *ZERDZ[0], page())
add("Miejsce: zerdz_2", *ZERDZ[1], page())
add("Zerdz kruczarni (stara)", *ZERDZ[0], page([C(355, ['if (window.Kruk) Kruk.look(this, "baszta");']), C(0, [])]))
add("Zerdz kruczarni (mlody kruk)", *ZERDZ[1], page([C(355, ['if (window.Kruk) Kruk.look(this, "kruczarnia");']), C(0, [])]))
add("Miejsce: widok_kruczarnia", *VIEW, page())
for n, (x, y) in enumerate(RYNNY, 1): add("Miejsce: rynna_%d" % n, x, y, page())

txt = W.map_text(m).encode("utf-8")
if json.loads(txt.decode("utf-8")) != m: stop("round trip")
p = os.path.join(HERE, "staging", "data", "Map008.json"); os.makedirs(os.path.dirname(p), exist_ok=True)
open(p, "wb").write(txt)
print("staging: data/Map008.json (+%d zdarzen)" % (len(m["events"]) - 500))
