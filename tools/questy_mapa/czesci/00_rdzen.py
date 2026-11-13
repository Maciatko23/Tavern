# -*- coding: utf-8 -*-
"""Questy a plansza 3x3 (docs/questy_mapa/PLAN.md + plan.json): STAGING. Nic nie trafia do data/ ani js/.
Czyta mapy z folderu wejsciowego (domyslnie data/, --z <folder>) i pliki JS / teksty z js/; pisze TYLKO do
tools/questy_mapa/staging/{data,js/plugins,js/teksty}/ (kasuje je na poczatku).
Zmiany JS i tekstow: zamiana dokladnego lancucha (P) - brak dopasowania = STOP. Mapy: tools/rozszerzenia/wspolne.py map_text,
sprawdzenie ukladu edytora przy czytaniu, zdarzenia: indeks == id.
  python tools/questy_mapa/zastosuj.py            (z data/)
  python tools/questy_mapa/zastosuj.py --z <dir>  (mapy z innego folderu)"""
import os, sys, json, shutil, argparse, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ap = argparse.ArgumentParser()
ap.add_argument("--z", default=os.path.join(ROOT, "data"), help="folder z mapami wejsciowymi (domyslnie data/)")
ARGS = ap.parse_args()
IN = os.path.abspath(ARGS.z)

# ------------------------------------------------------------------ tekst: pliki JS i teksty (binarnie, konce linii jak w pliku)
FILES = {}
def _get(rel):
    if rel not in FILES:
        raw = open(os.path.join(ROOT, *rel.split("/")), "rb").read()
        FILES[rel] = {"b": raw, "crlf": b"\r\n" in raw, "orig": raw}
    return FILES[rel]
def P(rel, old, new, n=1):
    """zamiana dokladnego lancucha (LF w argumentach; CRLF dopasowany do pliku); STOP gdy liczba dopasowan != n"""
    f = _get(rel)
    o, nw = old.encode("utf-8"), new.encode("utf-8")
    if f["crlf"]: o, nw = o.replace(b"\n", b"\r\n"), nw.replace(b"\n", b"\r\n")
    c = f["b"].count(o)
    if c != n: raise SystemExit("STOP: %s: %d dopasowan zamiast %d dla:\n%s" % (rel, c, n, old[:300]))
    f["b"] = f["b"].replace(o, nw)
def PR(rel, pairs):
    for a in pairs: P(rel, *a)
PLUG = lambda n: "js/plugins/%s.js" % n
TXT = lambda n: "js/teksty/%s.txt" % n

# ------------------------------------------------------------------ mapy
MAPS = {}; MAP_ORIG = {}
def lay_map(i): return os.path.join(IN, "Map%03d.json" % i)
def M(i):
    if i not in MAPS:
        raw = open(lay_map(i), "rb").read()
        m = json.loads(raw.decode("utf-8"))
        if W.map_text(m).encode("utf-8") != raw: raise SystemExit("STOP: Map%03d nie jest w ukladzie edytora" % i)
        for k, e in enumerate(m["events"]):
            if e is not None and e["id"] != k: raise SystemExit("STOP: Map%03d zdarzenie %d ma id %d" % (i, k, e["id"]))
        MAP_ORIG[i] = raw; MAPS[i] = m
    return MAPS[i]
BLANKC = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1,
          "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}
def cmd(code, params, indent=0): return {"code": code, "indent": indent, "parameters": params}
def page(img=None, d=2, pat=1, cmds=None, pri=1, through=False, trig=0, dirfix=False, walk=False, step=False):
    im = {"tileId": 0, "characterName": img or "", "direction": d, "pattern": pat, "characterIndex": 0}
    return {"conditions": dict(BLANKC), "directionFix": dirfix, "image": im, "list": (cmds or []) + [cmd(0, [])], "moveFrequency": 3,
            "moveRoute": {"list": [cmd(0, [])], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 3, "moveType": 0,
            "priorityType": pri, "stepAnime": step, "through": through, "trigger": trig, "walkAnime": walk}
def add_event(m, name, x, y, pages, note=""):
    """a new editor-side event: the HIGHEST free slot below 500 (ids 500+ belong to the plugins' injections; the editor's deleted events leave holes),
    else appended when that stays below 500; the list index is the id"""
    holes = [k for k in range(min(len(m["events"]), 500) - 1, 0, -1) if m["events"][k] is None]
    if holes: eid = holes[0]
    else:
        eid = len(m["events"])
        if eid >= 500: raise SystemExit("STOP: brak wolnego id < 500 w mapie")
        m["events"].append(None)
    m["events"][eid] = {"id": eid, "name": name, "note": note, "pages": pages, "x": x, "y": y}
    return eid
def find_ev(m, pred):
    return [e for e in m["events"] if e and pred(e)]
def transfer(map_id, x, y, d, fade=0): return cmd(201, [0, map_id, x, y, d, fade])
def del_events(m, ids):
    """kasuje zdarzenia (jak edytor: miejsce zostaje null); STOP gdy id nie istnieje"""
    for i in ids:
        if i >= len(m["events"]) or m["events"][i] is None: raise SystemExit("STOP: brak zdarzenia %d" % i)
        m["events"][i] = None
    while m["events"] and m["events"][-1] is None: m["events"].pop()
def set_transfer(e, map_id, x, y, d):
    n = 0
    for p in e["pages"]:
        for c in p["list"]:
            if c["code"] == 201: c["parameters"] = [0, map_id, x, y, d, 0]; n += 1
    if n != 1: raise SystemExit("STOP: zdarzenie %d ma %d poleceni 201" % (e["id"], n))
def popup_cmd(text): return cmd(355, ["Tawerna.popup(%s);" % json.dumps(text, ensure_ascii=False)])

LOG = []
def log(s): LOG.append(s); print(s)


# ====================================================================================================================
# 1. K3, D5, W1 (TownQuests*.js), W5 (Kantor*.js)
# ====================================================================================================================
def sec_towncquests():
    TQD, TQ = PLUG("TownQuests_Data"), PLUG("TownQuests")
    # K3: the horseshoe's glint on Kruczy Jar (the road east of the town's stairs), no longer on Polna droga (Map022)
    P(TQD, '        horseshoe: { map: 22, id: 951, x: 20, y: 14, name: "Polna droga", deco: "glint" },',
           '        horseshoe: { map: 3, id: 951, x: 74, y: 18, name: "Droga za bramą południową", deco: "glint" },   // (2026-11-11 plansza: was Map022 (20,14))')
    # D5: the scouts on Kruczy Jar, the pack's leader on Łąka (were Polna droga 22 / Skraj lasu 23)
    P(TQD, '{ nazwa: "d5Upoluj", type: "kill", kind: "wolf", map: 22, n: 2, night: true, spawn: 2 }',
           '{ nazwa: "d5Upoluj", type: "kill", kind: "wolf", map: 3, n: 2, night: true, spawn: 2 }')
    P(TQD, '{ nazwa: "d5Upoluj2", type: "kill", kind: "wolf", map: 23, n: 1, leader: true, night: true, spawn: 3 }',
           '{ nazwa: "d5Upoluj2", type: "kill", kind: "wolf", map: 4, n: 1, leader: true, night: true, spawn: 3 }')
    # W1 rozdz. 6c: the men of the butler wait on Kruczy Jar (was Polna droga, Map022)
    P(TQ, "    const TOWN = 8, ROAD = 22, MANOR = 24;   // the town, Polna droga, the Lord's manor (its garden and the orangery)",
          "    const TOWN = 8, ROAD = 3, MANOR = 24;   // the town, Kruczy Jar (the road behind the south gate; was Map022 Polna droga), the Lord's manor (its garden and the orangery)")

def sec_kantor():
    KD, K = PLUG("Kantor_Data"), PLUG("Kantor")
    P(KD, "const MAP = { town: 8, kantor: 103, piwnica: 171, droga: 22, skraj: 23, przystan: 125, ratusz: 104 };",
          "const MAP = { town: 8, kantor: 103, piwnica: 171, droga: 3, skraj: 3, przystan: 125, ratusz: 104 };   // (2026-11-11 plansza: Polna droga and Skraj lasu are places of Kruczy Jar now)")
    P(KD, "        // Map023 (Skraj lasu): the smugglers' fire, its seats, the cart, the courier\n"
          "        ognisko: [33, 4], seats: [[32, 4, \"sit\"], [34, 4, \"sit\"], [33, 2, \"sleep\"], [32, 3, \"sit\"]], wozOboz: [35, 2], skrzynieOboz: [37, 3], kurierOboz: [35, 4, 4],",
          "        // Kruczy Jar (Map003), the east edge of the forest (was Map023 Skraj lasu: the same shape moved by +63, +48): the smugglers' fire, its seats, the cart, the courier\n"
          "        ognisko: [96, 52], seats: [[95, 52, \"sit\"], [97, 52, \"sit\"], [96, 50, \"sleep\"], [95, 51, \"sit\"]], wozOboz: [98, 50], skrzynieOboz: [100, 51], kurierOboz: [98, 52, 4],")
    P(KD, "        // Map022 (Polna droga): the cart at the fork to the east, its guards, Rafał tied to it\n"
          "        wozProm: [29, 20], guards: [[28, 21, \"idle\"], [32, 19, \"idle\"]], rafal: [31, 21, 2], skrzynieProm: [27, 19], ogienProm: [32, 21]",
          "        // Kruczy Jar (Map003), the road north of the plot (was Map022 Polna droga: moved by +59, -4): the cart at the fork to the east, its guards, Rafał tied to it\n"
          "        wozProm: [88, 16], guards: [[87, 17, \"idle\"], [91, 15, \"idle\"]], rafal: [90, 17, 2], skrzynieProm: [86, 15], ogienProm: [91, 17]")
    P(KD, "const RAID = { after: [3, 6], kinds: [\"bandit\", \"knifer\", \"archer\"], maps: [3, 21, 22, 23], hours: [21, 4] };",
          "const RAID = { after: [3, 6], kinds: [\"bandit\", \"knifer\", \"archer\"], maps: [3, 4], hours: [21, 4] };")
    P(KD, "6: { ch: 6, krok: \"w5Prom\", godzina: 21.5, idz: [MAP.droga, 12, 2, 2] },",
          "6: { ch: 6, krok: \"w5Prom\", godzina: 21.5, idz: [MAP.droga, 76, 8, 2] },")
    # both places are on Map003 now: one map, two sets of events (the chain was if / else if)
    P(K, "        } else if (mapId === M.droga) {", "        }\n        if (mapId === M.droga) {")
