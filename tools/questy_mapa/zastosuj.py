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


# ------------------------------------------------------------------ Farming.hash2 (Farming.js) - which cells hold a random dry bush
def _imul(a, b):
    r = (a * b) & 0xFFFFFFFF
    return r
def _i32(v): return v if v < 0x80000000 else v - 0x100000000
def hash2(x, y, s):
    h = _imul(x & 0xFFFFFFFF, 374761393) ^ _imul(y & 0xFFFFFFFF, 668265263) ^ _imul(s & 0xFFFFFFFF, 1103515245)
    h = _imul(h ^ (h >> 13), 1274126177)
    return ((h ^ (h >> 16)) & 0xFFFFFFFF) / 4294967296.0
BUSH_SHARE = 0.02
def bush_cells(x, y, w, h): return [[xx, yy] for yy in range(y, y + h) for xx in range(x, x + w) if hash2(xx, yy, 811) < BUSH_SHARE]


# ====================================================================================================================
# 2. Ludzie (K63 mielerz, K64 owca, K65 juk, handlarz, pastwisko przy menhirach): Leśna droga / Omszała łąka / Polna droga -> Łąka (4)
# ====================================================================================================================
def sec_ludzie():
    LD, L = PLUG("Ludzie_Data"), PLUG("Ludzie")
    PR(LD, [
        ("    const MAP = { droga: 21, polna: 22, laka: 4, domek: 3, menhiry: 18, omszala: 17, gory: 13, przystan: 125, jaskinia: 177, zagroda: 168,\n",
         "    // (2026-11-11 plansza: the kiln, the pedlar's home stop and the lost sheep are on Łąka (4); menhiry 18 is only the key of the second pasture)\n"
         "    const MAP = { droga: 4, polna: 4, laka: 4, domek: 3, menhiry: 18, omszala: 4, gory: 13, przystan: 125, jaskinia: 177, zagroda: 168,\n"),
        # the places (Okolice.registerSpots): the kiln, the shed, the lost pack, the second pasture
        ('        { key: "mielerz", map: 21, kind: "kiln", mode: "reach", x: 48, y: 17, w: 3, h: 3 },\n'
         '        { key: "szalas_wegl", map: 21, kind: "shed", mode: "reach", x: 52, y: 20, w: 3, h: 2 },\n'
         '        { key: "postoj_021", map: 21, kind: "wagon", mode: "reach", x: 54, y: 16, w: 2, h: 2 },\n'
         '        { key: "juk_021", map: 21, kind: "pack", mode: "reach", cells: [[55, 12], [61, 11], [67, 8]] },\n'
         '        { key: "postoj_handlarza", map: 22, kind: "wagon", mode: "reach", x: 49, y: 19, w: 6, h: 4 },\n',
         '        { key: "mielerz", map: 4, kind: "kiln", mode: "reach", x: 45, y: 22, w: 3, h: 3 },\n'
         '        { key: "szalas_wegl", map: 4, kind: "shed", mode: "reach", x: 49, y: 23, w: 3, h: 2 },\n'
         '        { key: "postoj_021", map: 21, kind: "wagon", mode: "reach", x: 54, y: 16, w: 2, h: 2 },   // (parked since 2026-11-11: the pedlar keeps two stops, Łąka and Kruczy Jar; its words stay)\n'
         '        { key: "juk_021", map: 4, kind: "pack", mode: "reach", cells: [[52, 15], [64, 14], [66, 16]] },\n'
         '        { key: "postoj_handlarza", map: 22, kind: "wagon", mode: "reach", x: 49, y: 19, w: 6, h: 4 },   // (parked, as above)\n'),
        ('        { key: "pastwisko_018", map: 18, kind: "pasture", mode: "reach", x: 65, y: 29, w: 7, h: 5 },\n'
         '        { key: "owca_017", map: 17, kind: "sheep", mode: "reach", cells: [[40, 40], [60, 38], [72, 30]] },\n',
         '        { key: "pastwisko_018", map: 4, kind: "pasture", mode: "reach", x: 44, y: 61, w: 7, h: 5 },\n'
         '        { key: "owca_017", map: 4, kind: "sheep", mode: "reach", cells: [[40, 50], [62, 45], [31, 54]] },\n'),
        ('        { key: "lud_mielerz", map: 21, x: 49, y: 20, near: 2, icon: 334 },\n', '        { key: "lud_mielerz", map: 4, x: 46, y: 25, near: 2, icon: 334 },\n'),
        ('        { key: "lud_postoj", map: 22, x: 51, y: 21, near: 2, icon: 496 },\n', '        { key: "lud_postoj", map: 4, x: 61, y: 13, near: 2, icon: 496 },\n'),
        # the pedlar: two stops (Łąka, Kruczy Jar)
        ('        stops: [22, 21, 4, 3], dawn: 6,                          // the pedlar: d % 4 -> the map (a "day" from 6:00)\n',
         '        stops: [4, 3], dawn: 6,                                  // the pedlar: d % 2 -> the map (a "day" from 6:00); 2026-11-11: Polna droga and Leśna droga are gone\n'),
        # the shepherd with the flock by the menhirs: the same map now (a second pasture on Łąka); the menhirs stand on Łąka too
        ('                map: MAP.menhiry, when: "ludPasterz018",\n', '                map: MAP.laka, when: "ludPasterz018",\n'),
        # the spots of the residents
        ("        21: { mielerz_praca: [51, 19, 4], mielerz_obchod: [50, 21, 8], szalas_przed: [53, 22, 2], szalas_drzwi: [53, 22, 8],\n"
         "              handlarz_lada: [54, 17, 2], handlarz_sen: [54, 16, 6], handlarz_woz: [54, 16, 6] },\n"
         "        22: { handlarz_lada: [53, 21, 2], handlarz_sen: [54, 22, 4], handlarz_woz: [52, 21, 8] },\n"
         "        4: { koszar_brama: [52, 44, 8], pastwisko: [46, 46, 2], pastwisko_cien: [44, 44, 2], pastwisko_brzeg: [50, 45, 4],\n",
         "        4: { mielerz_praca: [48, 24, 4], mielerz_obchod: [47, 26, 8], szalas_przed: [50, 26, 2], szalas_drzwi: [50, 26, 8],   // (the kiln, 2026-11-11: was Map021 (51,19))\n"
         "             pastwisko_018: [47, 63, 2], pastwisko_018_kamien: [45, 62, 6],   // (the second pasture by the menhirs, Łąka (44,61))\n"
         "             koszar_brama: [52, 44, 8], pastwisko: [46, 46, 2], pastwisko_cien: [44, 44, 2], pastwisko_brzeg: [50, 45, 4],\n"),
        ("        18: { pastwisko_018: [68, 31, 2], pastwisko_018_kamien: [66, 30, 6] },\n", ""),
        # the quests' places
        ("    const JUK_SPOTS = [[55, 12], [61, 11], [67, 8]];\n    const SHEEP_SPOTS = [[40, 40], [60, 38], [72, 30]];\n",
         "    const JUK_SPOTS = [[52, 15], [64, 14], [66, 16]];   // (Łąka, east of the kiln; was Map021)\n    const SHEEP_SPOTS = [[40, 50], [62, 45], [31, 54]];   // (Łąka, round the fold; was Map017)\n"),
        ("    const PASTURE = { 4: { x: 43, y: 44, w: 7, h: 6 }, 18: { x: 65, y: 29, w: 7, h: 5 } };\n",
         "    const PASTURE = { 4: { x: 43, y: 44, w: 7, h: 6 }, 18: { x: 44, y: 61, w: 7, h: 5 } };   // (18: the second pasture on Łąka (44,61), by the menhirs; the key is only a name)\n"),
        ("    const KILN_AT = { x: 49, y: 19 }, SHED_AT = { x: 53, y: 21 };\n", "    const KILN_AT = { x: 46, y: 24 }, SHED_AT = { x: 50, y: 24 };   // (Łąka; was Map021 (49,19), (53,21))\n"),
        ("        22: { woz: [51, 20], osiol: [49, 20], ogien: [53, 22] },\n        21: { ogien: [55, 16], tobol: [55, 17] },\n", ""),
        ("    const KILN_AMBUSH = { map: 21, r: 14, kinds:", "    const KILN_AMBUSH = { map: 4, r: 14, kinds:"),
    ])
    PR(L, [
        ("    const stopIndex = () => ((workDay(D.CYCLE.dawn) % 4) + 4) % 4;\n",
         "    const stopIndex = () => ((workDay(D.CYCLE.dawn) % D.CYCLE.stops.length) + D.CYCLE.stops.length) % D.CYCLE.stops.length;\n"),
        # the flock: always on Łąka; "by the menhirs" = the second pasture there
        ('    // where the flock is now: 18 (by the menhirs) or 4; "pasture" / "fold"\n    const flockMap = () => (pasterz018() ? M.menhiry : M.laka);\n',
         '    // where the flock is now: always Łąka (4); on the shepherd\'s third day on the second pasture by the menhirs; "pasture" / "fold"\n'
         "    const flockMap = () => M.laka;\n"
         "    const pastureNow = () => D.PASTURE[pasterz018() ? M.menhiry : M.laka];\n"),
        ('        const id = $gameMap.mapId(), fm = flockMap();\n        if (id === M.menhiry) return fm === M.menhiry ? "pasture" : "";\n        if (id !== M.laka) return "";\n        if (fm === M.menhiry) return "";\n        return flockOut() ? "pasture" : "fold";\n',
         '        const id = $gameMap.mapId();\n        if (id !== flockMap()) return "";\n        return flockOut() || pasterz018() ? "pasture" : "fold";\n'),
        ('            const n = flockSize(), z = D.PASTURE[sheepMap], cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();\n            for (let i = 0; i < n && cells.length; i++) {',
         '            const n = flockSize(), z = pastureNow(), cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();\n            flockZone = z;\n            for (let i = 0; i < n && cells.length; i++) {'),
        ('    let sheep = [], flockMode = "", sheepMap = 0;\n', '    let sheep = [], flockMode = "", sheepMap = 0, flockZone = null;\n'),
        ('        const want = flockWanted();\n        if (want === flockMode) return;\n        const flock = sheep.filter(a => a._lud.role === "flock");\n',
         '        const want = flockWanted();\n        if (want === flockMode && (want !== "pasture" || flockZone === pastureNow())) return;   // (the shepherd\'s third day: the flock walks over to the second pasture)\n        const flock = sheep.filter(a => a._lud.role === "flock");\n'),
        ('        const z = D.PASTURE[sheepMap], cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();\n        flock.forEach((a, i) => {',
         '        const z = pastureNow(), cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();\n        flockZone = z;\n        flock.forEach((a, i) => {'),
        # the kiln's and the pedlar's stop events: two plain ifs (Łąka has both now); the pedlar's old Leśna droga fire and bundle are gone
        ('            out.push(fireEv(EV.ogien021, D.STOPS[21].ogien, "ogien"));\n'
         '            out.push(eventData(EV.tobol021, TK.kod.build[2], D.STOPS[21].tobol[0], D.STOPS[21].tobol[1], { key: "tobol", img: ["!$Lud_Juk", 0, 2, 1] }));\n', ""),
        ("        } else if (mapId === M.polna || mapId === M.laka || mapId === M.domek) {\n",
         "        }\n        if (mapId === M.polna || mapId === M.laka || mapId === M.domek) {   // (Łąka has the kiln AND the pedlar's stop since 2026-11-11)\n"),
        ("            setShown(evOf(EV.ogien021), stop === M.droga && night);\n            setShown(evOf(EV.tobol021), stop === M.droga);\n", ""),
        ("        } else if (D.STOPS[id] && id !== M.droga) {\n", "        }\n        if (D.STOPS[id]) {\n"),
        # F9
        ("        [21, 49, 21, 8], [21, 53, 23, 8], [22, 52, 23, 8],\n        [21, 54, 18, 8], [4, 62, 12, 8], [3, 61, 12, 8],\n        [4, 52, 45, 8], [18, 68, 34, 8], [17, 60, 40, 8],\n        [21, 55, 13, 8], [13, 101, 101, 8], [13, 105, 97, 8],\n",
         "        [4, 46, 26, 8], [4, 50, 26, 8], [4, 62, 13, 8],\n        [3, 62, 13, 8], [4, 62, 12, 8], [3, 61, 12, 8],\n        [4, 52, 45, 8], [4, 47, 64, 8], [4, 62, 46, 8],\n        [4, 52, 16, 8], [13, 101, 101, 8], [13, 105, 97, 8],\n"),
        ('return { go: ["Mielerz", 21, 49, 21, 8] }; }', 'return { go: ["Mielerz", 4, 46, 26, 8] }; }'),
        ("jumpDay(d => ((d % 4) + 4) % 4 === i, 10); const p = PLACES.find(x => x[1] === m && /Postój/.test(x[0])); return { go: p || [TK.kod.ok[1], m, 50, 20, 2] }; }",
         "jumpDay(d => ((d % D.CYCLE.stops.length) + D.CYCLE.stops.length) % D.CYCLE.stops.length === i, 10); const p = PLACES.find(x => x[1] === m && /Postój/.test(x[0])); return { go: p || [TK.kod.ok[1], m, 62, 13, 2] }; }"),
        ("return { go: [TK.kod.ok[2], 18, 68, 34, 8] }; }", "return { go: [TK.kod.ok[2], 4, 47, 64, 8] }; }"),
        ("f9Stop = row.pick = ((row.pick || 0) + delta + 4) % 4;", "f9Stop = row.pick = ((row.pick || 0) + delta + D.CYCLE.stops.length) % D.CYCLE.stops.length;"),
    ])


# ====================================================================================================================
# 3. Zakon (K67 kapliczki, K68 strażnice i kopce, D36 krąg menhirów): Polna droga / Leśna droga / Omszała łąka / Skraj lasu / Łąka pod Gawrą
# ====================================================================================================================
def _line(rel, start):
    """the whole line of a file beginning with `start` (STOP unless exactly one)"""
    t = _get(rel)["b"].decode("utf-8").split("\n")
    hit = [l for l in t if l.startswith(start)]
    if len(hit) != 1: raise SystemExit("STOP: %s: %d linii zaczynajacych sie od %r" % (rel, len(hit), start))
    return hit[0]

def sec_zakon():
    ZD, Z = PLUG("Zakon_Data"), PLUG("Zakon")
    # the five moved places and their 6x6 / 2x2 areas (x, y = the top left cell); Farming's random dry bushes under them: computed with its hash
    def bushes(x, y, w, h, skip=()): return json.dumps([c for c in bush_cells(x, y, w, h) if tuple(c) not in skip]).replace(" ", "").replace(",", ", ")
    old_t = _line(ZD, '        { key: "straznica_022", map: 22, x: 71, y: 36,')
    P(ZD, old_t, '        { key: "straznica_022", map: 3, x: 59, y: 13, card: true, ids: { ring: 2700, slab: 2701, blank: 2702 }, bushes: %s },   // (Kruczy Jar, the road north of the plot; 2026-11-11, was Map022 (71,36))' % bushes(59, 13, 6, 6, [(61, 16)]))
    P(ZD, _line(ZD, '        { key: "kapliczka_022", map: 22, x: 72, y: 16,'),
          '        { key: "kapliczka_022", map: 3, x: 69, y: 13, id: 2710, at: [69, 14], bushes: %s },   // (Kruczy Jar; was Map022 (72,16))' % bushes(69, 13, 2, 2, [(69, 14)]))
    P(ZD, _line(ZD, '        { key: "kapliczka_021", map: 21, x: 58, y: 12,'),
          '        { key: "kapliczka_021", map: 4, x: 42, y: 14, id: 2712, at: [42, 15], bushes: %s },   // (Łąka, the north-west copses, just east of the old part; was Map021 (58,12); id 2712: Łąka has kapliczka_004 = 2710)' % bushes(42, 14, 2, 2, [(42, 15)]))
    P(ZD, _line(ZD, '        { key: "kopiec_017", map: 17, x: 50, y: 36,'),
          '        { key: "kopiec_017", map: 3, x: 8, y: 78, ids: { cairn: 2750, stone: 2751 }, at: [8, 79] },   // (Kruczy Jar, Omszała łąka in the south-west; was Map017 (50,36))')
    P(ZD, _line(ZD, '        { key: "kopiec_023", map: 23, x: 58, y: 51,'),
          '        { key: "kopiec_023", map: 3, x: 92, y: 25, ids: { cairn: 2755, stone: 2756 }, at: [92, 26] },   // (Kruczy Jar, Skraj lasu in the east; was Map023 (58,51); ids 2755/2756: Kruczy Jar has kopiec_017 = 2750/2751)')
    # D36: the ring of menhirs on Łąka under the Gawra, its centre (50,78); every cell moved by (-3, +33) from the old Map018 ring
    P(ZD, "        map: 18, centre: [53, 45], r: 4,\n"
          "        stones: [[53, 41], [56, 42], [57, 45], [56, 48], [53, 49], [50, 48], [49, 45]], stoneIds: 2760,\n"
          '        watchman: { x: 50, y: 42, id: 2767, img: "!$Rock_Spire" }, stoneImg: "!$Rock_Column",\n'
          "        plate: { x: 53, y: 45, id: 2768 }, hole: { x: 52, y: 43, id: 2769 },\n",
          "        map: 4, centre: [50, 78], r: 4,   // (2026-11-11: Łąka under the Gawra; was Map018 centre (53,45), every cell moved by (-3, +33))\n"
          "        stones: [[50, 74], [53, 75], [54, 78], [53, 81], [50, 82], [47, 81], [46, 78]], stoneIds: 2760,\n"
          '        watchman: { x: 47, y: 75, id: 2767, img: "!$Rock_Spire" }, stoneImg: "!$Rock_Column",\n'
          "        plate: { x: 50, y: 78, id: 2768 }, hole: { x: 49, y: 76, id: 2769 },\n")
    P(ZD, "        back: [53, 46]   // where the steps of the chamber come out\n", "        back: [50, 79]   // where the steps of the chamber come out\n")
    P(ZD, '    SPOTS.push({ key: "menhiry_krag", map: 18, kind: "ring", mode: "reach",\n', '    SPOTS.push({ key: "menhiry_krag", map: RING.map, kind: "ring", mode: "reach",\n')
    P(ZD, '        { key: "menhiry_krag", map: 18, x: 53, y: 45, near: 4, icon: ICON.plyta, xp: 30 },\n'
          '        { key: "cien_straznika", map: 18, x: 52, y: 43, near: -1, icon: ICON.klucz, xp: 60 },\n',
          '        { key: "menhiry_krag", map: 4, x: 50, y: 78, near: 4, icon: ICON.plyta, xp: 30 },\n'
          '        { key: "cien_straznika", map: 4, x: 49, y: 76, near: -1, icon: ICON.klucz, xp: 60 },\n')
    # the discoveries of the moved places
    PR(ZD, [
        ('        { key: "straznica_022", map: 22, x: 73, y: 38, near: 3, icon: ICON.plyta, xp: 30 },\n', '        { key: "straznica_022", map: 3, x: 61, y: 15, near: 3, icon: ICON.plyta, xp: 30 },\n'),
        ('        { key: "kapliczka_022", map: 22, x: 72, y: 17, near: 2, icon: ICON.kapliczka, xp: 20 },\n', '        { key: "kapliczka_022", map: 3, x: 69, y: 15, near: 2, icon: ICON.kapliczka, xp: 20 },\n'),
        ('        { key: "kapliczka_021", map: 21, x: 58, y: 13, near: 2, icon: ICON.kapliczka, xp: 20 },\n', '        { key: "kapliczka_021", map: 4, x: 42, y: 16, near: 2, icon: ICON.kapliczka, xp: 20 },\n'),
        ('        { key: "kopiec_017", map: 17, x: 50, y: 37, near: 2, icon: ICON.kruk, xp: 20 },\n', '        { key: "kopiec_017", map: 3, x: 8, y: 80, near: 2, icon: ICON.kruk, xp: 20 },\n'),
        ('        { key: "kopiec_023", map: 23, x: 58, y: 52, near: 2, icon: ICON.kruk, xp: 20 },\n', '        { key: "kopiec_023", map: 3, x: 92, y: 27, near: 2, icon: ICON.kruk, xp: 20 },\n'),
        ("    const MAPS = { polna: 22, gory: 13, urwisko: 157, lesna: 21, laka: 4, omszala: 17, skraj: 23, pustelnia: 155, menhiry: 18,\n",
         "    // (2026-11-11: the places of Polna droga, Leśna droga, Omszała łąka, Skraj lasu and the menhirs are on Kruczy Jar (3) and Łąka (4) now)\n"
         "    const MAPS = { polna: 3, gory: 13, urwisko: 157, lesna: 4, laka: 4, omszala: 3, skraj: 3, pustelnia: 155, menhiry: 4,\n"),
    ])
    # F9: the ring (the map and the cell beside the plate)
    P(Z, "        [[TK.f9.krag, 18, 52, 44], [TK.f9.komora, 176,", "        [[TK.f9.krag, D.RING.map, D.RING.plate.x - 1, D.RING.plate.y - 1], [TK.f9.komora, 176,")


# ====================================================================================================================
# 4. Zasoby (D30 Jagna, polanka, kręgi grzybów, źródełka 017 / 021): Omszała łąka -> Kruczy Jar (3), Leśna droga spring -> Łąka (4)
# ====================================================================================================================
def sec_zasoby():
    ZD, Z, OD = PLUG("Zasoby_Data"), PLUG("Zasoby"), PLUG("Okolice_Data")
    R1 = [[43, 71], [45, 72], [46, 74], [45, 76], [43, 77], [41, 76], [40, 74], [41, 72]]
    R2 = [[52, 71], [54, 72], [55, 74], [54, 76], [52, 77], [50, 76], [49, 74], [50, 72]]
    j = lambda c: json.dumps(c).replace(" ", "").replace(",", ", ")
    # --- Zasoby_Data.js
    PR(ZD, [
        ("        17: [2100, 2129], 21: [2130, 2139], 13: [2140, 2154], 155: [2155, 2164], 168: [2165, 2184], 3: [2185, 2204],\n",
         "        // (2026-11-11 plansza: Omszała łąka (17) is built on Kruczy Jar (3) now - its ids 2100-2129 join Map003's; the spring of Leśna droga (21) is on Łąka (4))\n"
         "        17: [2100, 2129], 21: [2130, 2139], 4: [2130, 2139], 13: [2140, 2154], 155: [2155, 2164], 168: [2165, 2184], 3: [2100, 2204],\n"),
        ('        { key: "zrodlo_017", map: 17, x: 70, y: 54, w: 3, h: 2, sx: 71, sy: 54, id: 2100,',
         '        { key: "zrodlo_017", map: 3, x: 39, y: 79, w: 3, h: 2, sx: 40, sy: 79, id: 2100,'),
        ('        { key: "zrodlo_021", map: 21, x: 23, y: 42, w: 3, h: 2, sx: 24, sy: 42, id: 2130,',
         '        { key: "zrodlo_021", map: 4, x: 41, y: 28, w: 3, h: 2, sx: 42, sy: 28, id: 2130,'),
        ("        { key: \"grzyby_krag1\", centre: [54, 44], ids: [2107, 2108, 2109, 2110, 2111, 2112, 2113, 2114],\n"
         "          cells: [[54, 41], [56, 42], [57, 44], [56, 46], [54, 47], [52, 46], [51, 44], [52, 42]] },\n"
         "        { key: \"grzyby_krag2\", centre: [63, 44], ids: [2115, 2116, 2117, 2118, 2119, 2120, 2121, 2122],\n"
         "          cells: [[63, 41], [65, 42], [66, 44], [65, 46], [63, 47], [61, 46], [60, 44], [61, 42]] }\n",
         "        { key: \"grzyby_krag1\", centre: [43, 74], ids: [2107, 2108, 2109, 2110, 2111, 2112, 2113, 2114],\n"
         "          cells: %s },\n"
         "        { key: \"grzyby_krag2\", centre: [52, 74], ids: [2115, 2116, 2117, 2118, 2119, 2120, 2121, 2122],\n"
         "          cells: %s }\n" % (j(R1), j(R2))),
        ('    const GLADE = { map: 17, x: 65, y: 12, w: 5, h: 3, stand: [67, 15],\n'
         '        herbs: [{ id: 2104, kind: "arcydziegiel", x: 66, y: 12 }, { id: 2105, kind: "dziurawiec", x: 68, y: 13 }, { id: 2106, kind: "kozlek", x: 66, y: 14 }] };\n',
         '    // (2026-11-11 plansza: Omszała łąka is the south-west of Kruczy Jar (3); the glade was Map017 (65,12))\n'
         '    const GLADE = { map: 3, x: 18, y: 72, w: 5, h: 3, stand: [20, 75],\n'
         '        herbs: [{ id: 2104, kind: "arcydziegiel", x: 19, y: 72 }, { id: 2105, kind: "dziurawiec", x: 21, y: 73 }, { id: 2106, kind: "kozlek", x: 19, y: 74 }] };\n'),
        ('    const JAGNA_SPOTS = { jagna_polanka: [67, 15, 8], jagna_krag: [58, 44, 2], jagna_las: [69, 16, 2] };\n',
         '    const JAGNA_SPOTS = { jagna_polanka: [20, 75, 8], jagna_krag: [47, 74, 2], jagna_las: [22, 76, 2] };\n'),
        ('        key: "jagna", id: 2900, sheet: "$Npc_Jagna", map: 17, speed: 2,\n', '        key: "jagna", id: 2900, sheet: "$Npc_Jagna", map: 3, speed: 2,\n'),
        ('    const JAGNA_SPOT = { key: "jagna_miejsce", map: 17, kind: "npc", mode: "zone", x: 67, y: 15, w: 1, h: 1 };\n',
         '    const JAGNA_SPOT = { key: "jagna_miejsce", map: 3, kind: "npc", mode: "zone", x: 20, y: 75, w: 1, h: 1 };\n'),
        ('        { key: "grzyby_krag1", map: 17, x: 54, y: 44, near: -1 },\n        { key: "grzyby_krag2", map: 17, x: 63, y: 44, near: -1 },\n        { key: "ziola_jagny", map: 17, x: 67, y: 13, near: 2 },\n',
         '        { key: "grzyby_krag1", map: 3, x: 43, y: 74, near: -1 },\n        { key: "grzyby_krag2", map: 3, x: 52, y: 74, near: -1 },\n        { key: "ziola_jagny", map: 3, x: 20, y: 73, near: 2 },\n'),
        ("        TLD.SPOTS_BY_MAP[17] = Object.assign({}, TLD.SPOTS_BY_MAP[17] || {}, JAGNA_SPOTS);\n",
         "        TLD.SPOTS_BY_MAP[3] = Object.assign({}, TLD.SPOTS_BY_MAP[3] || {}, JAGNA_SPOTS);\n"),
    ])
    # --- Zasoby.js: Map017's events are built with Map003's; the spring of Map021 goes to Map004
    PR(Z, [
        ("    // ---- Map017: the spring, Jagna's glade, the fairy rings\n    T.inject(17, { ids: D.IDS[17], owner: PLUGIN, build: () => {\n        const out = springEvents(springOf(17));\n",
         "    // ---- Omszała łąka (2026-11-11 plansza: the south-west of Kruczy Jar, Map003): the spring, Jagna's glade, the fairy rings - built with Map003's events\n"
         "    const omszalaEvents = () => {\n        const out = springEvents(springOf(3));\n"),
        ('            reg(17, h.id, "herb", { kind: h.kind, glade: true, x: h.x, y: h.y });\n', '            reg(3, h.id, "herb", { kind: h.kind, glade: true, x: h.x, y: h.y });\n'),
        ('            reg(17, id, "mushroom", { ring: r.key, i, look: [2 + 2 * ((i + ri) % 2), (i * 2 + ri) % 3] });\n',
         '            reg(3, id, "mushroom", { ring: r.key, i, look: [2 + 2 * ((i + ri) % 2), (i * 2 + ri) % 3] });\n'),
        ("        return withBlanks(17, out);\n    } });\n    T.inject(21, { ids: D.IDS[21], owner: PLUGIN, build: () => withBlanks(21, springEvents(springOf(21))) });\n",
         "        return out;\n    };\n    // (Leśna droga's spring is on Łąka (4) now)\n    T.inject(4, { ids: D.IDS[4], owner: PLUGIN, build: () => withBlanks(4, springEvents(springOf(4))) });\n"),
        ("        return withBlanks(3, out);\n    } });\n\n    // ---- Map111: the gardens", "        return withBlanks(3, out.concat(omszalaEvents()));\n    } });\n\n    // ---- Map111: the gardens"),
        ("        if (!has() || mapId() !== 17 || !night(hour())) return;\n", "        if (!has() || mapId() !== 3 || !night(hour())) return;\n"),
        ('["polanka", 17, 67, 16, 8],\n        ["krag", 17, 54, 45, 8],', '["polanka", 3, 20, 76, 8],\n        ["krag", 3, 43, 75, 8],'),
    ])
    # --- Okolice_Data.js: the plan's places of package A (until the package registers its own)
    PR(OD, [
        ('        {key: "zrodlo_017", pkg: "A", map: 17, kind: "spring", name: "Źródełko w mchu", mode: "reach", x: 70, y: 54, w: 3, h: 2},\n',
         '        {key: "zrodlo_017", pkg: "A", map: 3, kind: "spring", name: "Źródełko w mchu", mode: "reach", x: 39, y: 79, w: 3, h: 2},   // (2026-11-11 plansza: Omszała łąka = Kruczy Jar south-west; was Map017)\n'),
        ('        {key: "zrodlo_021", pkg: "A", map: 21, kind: "spring", name: "Źródełko w lesie", mode: "reach", x: 23, y: 42, w: 3, h: 2},\n',
         '        {key: "zrodlo_021", pkg: "A", map: 4, kind: "spring", name: "Źródełko w lesie", mode: "reach", x: 41, y: 28, w: 3, h: 2},   // (Leśna droga = Łąka north-west; was Map021)\n'),
        ('        {key: "grzyby_krag1", pkg: "A", map: 17, kind: "ring", name: "Czarci krąg", mode: "reach", cells: [[54, 41], [56, 42], [57, 44], [56, 46], [54, 47], [52, 46], [51, 44], [52, 42], [54, 44]]},\n'
         '        {key: "grzyby_krag2", pkg: "A", map: 17, kind: "ring", name: "Czarci krąg (drugi)", mode: "reach", cells: [[63, 41], [65, 42], [66, 44], [65, 46], [63, 47], [61, 46], [60, 44], [61, 42], [63, 44]]},\n'
         '        {key: "ziola_jagny", pkg: "A", map: 17, kind: "herbs", name: "Polanka Jagny", mode: "reach", x: 65, y: 12, w: 5, h: 3},\n',
         '        {key: "grzyby_krag1", pkg: "A", map: 3, kind: "ring", name: "Czarci krąg", mode: "reach", cells: %s},\n'
         '        {key: "grzyby_krag2", pkg: "A", map: 3, kind: "ring", name: "Czarci krąg (drugi)", mode: "reach", cells: %s},\n'
         '        {key: "ziola_jagny", pkg: "A", map: 3, kind: "herbs", name: "Polanka Jagny", mode: "reach", x: 18, y: 72, w: 5, h: 3},\n' % (j(R1 + [[43, 74]]), j(R2 + [[52, 74]]))),
    ])


# ====================================================================================================================
# 5. Lowy (K59 wilcza nora, D33 obóz CzO, kontrakty tablicy, obóz rabusiów): Skraj lasu -> Kruczy Jar (3), Leśna droga -> Łąka (4)
# ====================================================================================================================
def sec_lowy():
    LD, L = PLUG("Lowy_Data"), PLUG("Lowy")
    PR(LD, [
        # --- B1 the den: Kruczy Jar, the east edge of the forest (was Map023 (65,50): moved by +30, -20)
        ("        map: 23, x: 65, y: 50, cells: { x: 64, y: 49, w: 3, h: 2 }, zone: 6, rest: [65, 52], restNear: 2.5,\n"
         "        bounty: [66, 51], gift: [66, 52], dayHours: [5, 20], adults: 2, pups: [2, 3], pupScale: 0.55,\n"
         "        meatR: 3, meatDays: 3, emptyDays: 28, giftEvery: 7, friendMaps: [21, 23], discoverNear: 8\n",
         "        // (2026-11-11 plansza: Skraj lasu is the east edge of Kruczy Jar - the den was Map023 (65,50), moved by +30, -20)\n"
         "        map: 3, x: 95, y: 30, cells: { x: 94, y: 29, w: 3, h: 2 }, zone: 6, rest: [95, 32], restNear: 2.5,\n"
         "        bounty: [96, 31], gift: [96, 32], dayHours: [5, 20], adults: 2, pups: [2, 3], pupScale: 0.55,\n"
         "        meatR: 3, meatDays: 3, emptyDays: 28, giftEvery: 7, friendMaps: [3, 4], discoverNear: 8\n"),
        # --- B5 the fixed camps: the robbers on Łąka (was Map021 (60,41)), the hunters of the CzO on Kruczy Jar (was Map023 (66,21))
        ("        rabusie: { map: 21, x: 60, y: 41, area: { x: 58, y: 39, w: 6, h: 5 }, tent: [62, 39], tag: \"camp\", every: 4, mielerz: [50, 21],\n",
         "        rabusie: { map: 4, x: 87, y: 39, area: { x: 85, y: 37, w: 6, h: 5 }, tent: [89, 37], tag: \"camp\", every: 4, mielerz: [46, 26],\n"),
        ("        czo: { map: 23, x: 66, y: 21, area: { x: 64, y: 18, w: 6, h: 5 }, tent: [68, 19], tag: \"lowCzo\", hours: [6, 20],\n",
         "        czo: { map: 3, x: 96, y: 42, area: { x: 94, y: 40, w: 6, h: 5 }, tent: [98, 41], tag: \"lowCzo\", hours: [6, 20],\n"),
        # --- the places
        ('        { key: "nora_wilcza", map: 23, kind: "den", mode: "reach", x: 64, y: 49, w: 3, h: 2 },\n'
         '        { key: "szary_kiel", map: 23, kind: "bounty", mode: "reach", cells: [[66, 51]] },\n'
         '        { key: "oboz_czo", map: 23, kind: "camp", mode: "reach", x: 64, y: 18, w: 6, h: 5 },\n'
         '        { key: "oboz_bandytow", map: 21, kind: "camp", mode: "reach", x: 58, y: 39, w: 6, h: 5 },\n',
         '        { key: "nora_wilcza", map: 3, kind: "den", mode: "reach", x: 94, y: 29, w: 3, h: 2 },\n'
         '        { key: "szary_kiel", map: 3, kind: "bounty", mode: "reach", cells: [[96, 31]] },\n'
         '        { key: "oboz_czo", map: 3, kind: "camp", mode: "reach", x: 94, y: 40, w: 6, h: 5 },\n'
         '        { key: "oboz_bandytow", map: 4, kind: "camp", mode: "reach", x: 85, y: 37, w: 6, h: 5 },\n'),
        ('        { key: "nora", map: 23, x: 65, y: 51, near: 8, icon: 481, xp: 30, day: true },\n', '        { key: "nora", map: 3, x: 95, y: 31, near: 8, icon: 481, xp: 30, day: true },\n'),
        ('        { key: "oboz_rabusiow", map: 21, x: 60, y: 41, near: 7, icon: 156, xp: 20, camp: "rabusie" },\n'
         '        { key: "oboz_czo", map: 23, x: 66, y: 21, near: 8, icon: 485, xp: 30, camp: "czo" },\n',
         '        { key: "oboz_rabusiow", map: 4, x: 87, y: 39, near: 7, icon: 156, xp: 20, camp: "rabusie" },\n'
         '        { key: "oboz_czo", map: 3, x: 96, y: 42, near: 8, icon: 485, xp: 30, camp: "czo" },\n'),
        # --- the board's contracts: the robbers on Łąka, the hunters on Kruczy Jar
        ('req: [{ kill: "bandit", maps: [21], n:', 'req: [{ kill: "bandit", maps: [4], n:'),
        ('req: [{ kill: "archer", maps: [23], n:', 'req: [{ kill: "archer", maps: [3], n:'),
    ])
    PR(L, [
        # the events by the map (Map003 has the den and the hunters' tent; Łąka the robbers' tent)
        ("        23: () => [\n            ev(IDS.nora,", "        3: () => [\n            ev(IDS.nora,"),
        ('            ev(IDS.bloto, TK.kod.n21[0], BLOTO.ev[0], BLOTO.ev[1], [page({ image: img("!$Low_Bloto"), priority: 0, through: true, list: look("bloto") })]),\n'
         '            ev(IDS.rabNamiot, TK.kod.n21[1], OBOZY.rabusie.tent[0], OBOZY.rabusie.tent[1], [hidden(), pageW("campRab", { image: img("!$Mt_Tent"), list: look("namiotRab") })])\n        ],\n',
         '            ev(IDS.bloto, TK.kod.n21[0], BLOTO.ev[0], BLOTO.ev[1], [page({ image: img("!$Low_Bloto"), priority: 0, through: true, list: look("bloto") })])\n        ],\n'),
        ('            ev(IDS.poroze, TK.kod.n4[0], LIZAWKA.antler[0], LIZAWKA.antler[1], [hidden(), pageW("antler", { image: img("!$Low_Poroze"), list: scr("Lowy.pickAntler(this)") })])\n',
         '            ev(IDS.poroze, TK.kod.n4[0], LIZAWKA.antler[0], LIZAWKA.antler[1], [hidden(), pageW("antler", { image: img("!$Low_Poroze"), list: scr("Lowy.pickAntler(this)") })]),\n'
         '            // (2026-11-11 plansza: the robbers\' camp is on Łąka now, was Map021)\n'
         '            ev(IDS.rabNamiot, TK.kod.n21[1], OBOZY.rabusie.tent[0], OBOZY.rabusie.tent[1], [hidden(), pageW("campRab", { image: img("!$Mt_Tent"), list: look("namiotRab") })])\n'),
        ("        nora: [23, 65, 55, 8], gawra: [13, 99, 73, 8],", "        nora: [3, 95, 34, 8], gawra: [13, 99, 73, 8],"),
        ("        oboz_rabusiow: [21, 60, 45, 8], oboz_czo: [23, 66, 24, 8],", "        oboz_rabusiow: [4, 87, 43, 8], oboz_czo: [3, 96, 46, 8],"),
    ])


# ====================================================================================================================
# 6. Homes (D21 / K58 / K62 Spalona zagroda, strażnicy zamkniętej działki): kieszeń 168/169 przez Podgrodzie, strażnicy przy bramach płotu działki
# ====================================================================================================================
GATE111 = (110, 20)          # Podgrodzie, the north-east corner: the cell of the passage of the gate (Mt_Gate, 3 wide; posts at x-1 and x+1)
SIGN111 = (112, 22)          # the signpost beside it
FARM_IN = (1, 25)            # the burnt farm (Map168): the landing beside its west exit (0,24..26)
PLOT_GUARD_N = (67, 33)      # the plot's fence on Kruczy Jar: the north gate (x 68-71, y 34), the south gate (x 48-51, y 59)
PLOT_GUARD_S = (47, 60)
PLOT_OUT = (40, 47)          # outside the west gate (x 42, y 46-48): where the escort / the hut's door lets the hero out when the field is shut
PLOT_RECT = (42, 34, 77, 59)

def sec_homes():
    H = PLUG("Homes")
    PR(H, [
        ("    const FIELD = 3, HUT_MAP = 100, EDGE = 23, MEADOW = 4, PODGRODZIE = 111, ZAGRODA = 168;\n",
         "    // (2026-11-11 plansza: EDGE is Podgrodzie (111) now - the gate to the burnt farm is in its north-east corner; the two guards of the shut field stand\n"
         "    // at the gates of the plot's fence on Kruczy Jar (PLOT), not on Skraj lasu / Łąka any more)\n"
         "    const FIELD = 3, HUT_MAP = 100, EDGE = 111, MEADOW = 4, PODGRODZIE = 111, ZAGRODA = 168;\n"
         "    const PLOT = { rect: [%d, %d, %d, %d], guardN: [%d, %d], guardS: [%d, %d], out: [%d, %d] };\n"
         "    const inPlot = (x, y) => x >= PLOT.rect[0] && y >= PLOT.rect[1] && x <= PLOT.rect[2] && y <= PLOT.rect[3];\n"
         % (PLOT_RECT + PLOT_GUARD_N + PLOT_GUARD_S + PLOT_OUT)),
        # the cast on the field + the two guards (ids 704, 705 are in the field's range now)
        ("    T.inject([FIELD], { ids: [CAST.butler, SIGN], owner: PLUGIN, when: () => storyGame(), build() {\n",
         "    T.inject([FIELD], { ids: [CAST.butler, GUARD_MEADOW], owner: PLUGIN, when: () => storyGame(), build() {\n"),
        ("            shownOnA(SIGN, TK.kod.build[1], sx, sy, { characterName: \"!$Lord_Sign\", direction: 2, pattern: 1 },\n"
         "                stub(\"Tawerna.popup(\" + JSON.stringify(WORDS.znak) + \", { color: \\\"info\\\" })\"), { stepAnime: true, walkAnime: false, moveSpeed: 2, moveFrequency: 2 })\n        ];\n",
         "            shownOnA(SIGN, TK.kod.build[1], sx, sy, { characterName: \"!$Lord_Sign\", direction: 2, pattern: 1 },\n"
         "                stub(\"Tawerna.popup(\" + JSON.stringify(WORDS.znak) + \", { color: \\\"info\\\" })\"), { stepAnime: true, walkAnime: false, moveSpeed: 2, moveFrequency: 2 }),\n"
         "            // the guards of the shut field, at the gates of the plot's fence (shown from the dawn that shuts it)\n"
         "            shownOnA(GUARD_EDGE, TK.kod.build[0], PLOT.guardN[0], PLOT.guardN[1], { characterName: \"$Npc_Straznik\", direction: 2 }, stub(GUARD_TALK)),\n"
         "            shownOnA(GUARD_MEADOW, TK.kod.build[0], PLOT.guardS[0], PLOT.guardS[1], { characterName: \"$Npc_Straznik\", direction: 8 }, stub(GUARD_TALK))\n        ];\n"),
        # the old guards' injections are gone: Łąka's, and Skraj lasu's (the way west and the signpost go to Podgrodzie below)
        ("    // the guards at the two ways onto the field (shown once it is shut)\n    const GUARD_TALK = \"Tawerna.call(\\\"Homes\\\", \\\"guardTalk\\\", this)\";\n"
         "    T.inject([MEADOW], { ids: [GUARD_MEADOW, GUARD_MEADOW], owner: PLUGIN, when: () => storyGame(), build: () => [\n"
         "        // (2026-10-18) Łąka (Map004) doubled to 80x60: its south exit to the field moved from row 29 to row 59 - he stands beside it\n"
         "        shownOnA(GUARD_MEADOW, TK.kod.build[0], 27, 58, { characterName: \"$Npc_Straznik\", direction: 4 }, stub(GUARD_TALK))] });\n",
         "    // the guards at the gates of the plot (shown once the field is shut; they are built with the field's events above)\n"
         "    const GUARD_TALK = \"Tawerna.call(\\\"Homes\\\", \\\"guardTalk\\\", this)\";\n"),
    ])
    # the way to the burnt farm: a pocket - one gate in the north-east corner of Podgrodzie (the old way was three strips of the west edge of Map023)
    old = _get(H)["b"].decode("utf-8")
    i0 = old.index("    // Skraj lasu: the guard (story), the way west to the burnt farm")
    i1 = old.index("    // the burnt farm: the chimney's smoke once the house is rebuilt")
    block = old[i0:i1]
    new = ("    // (2026-11-11 plansza) the way to the burnt farm is a pocket (Map168, its other exits are closed) through ONE gate in the north-east corner of\n"
           "    // Podgrodzie: the gate, its posts and the signpost are EVENTS OF Map111 (tools/questy_mapa/zastosuj.py; so the compass knows the way), not injected\n")
    P(H, block, new)
    PR(H, [
        ("        sw(EDGE, GUARD_EDGE, true); sw(MEADOW, GUARD_MEADOW, true);\n", "        sw(FIELD, GUARD_EDGE, true); sw(FIELD, GUARD_MEADOW, true);\n"),
        ("        sw(EDGE, GUARD_EDGE, false); sw(MEADOW, GUARD_MEADOW, false);\n", "        sw(FIELD, GUARD_EDGE, false); sw(FIELD, GUARD_MEADOW, false);\n"),
        ("const here = window.$gameMap ? $gameMap.mapId() : 0, there = here === FIELD || here === HUT_MAP ? EDGE : here;",
         "const here = window.$gameMap ? $gameMap.mapId() : 0, there = here === FIELD || here === HUT_MAP ? FIELD : here;"),
        # the shut field: only the plot itself is refused (Kruczy Jar is open land)
        ("        if (mapId === FIELD && fieldLocked() && !($gameTemp && $gameTemp._homesLetIn) && window.$gameMap && $gameMap.mapId() !== FIELD) {\n"
         "            if ($gameMap.mapId() === HUT_MAP) return _reserveTransfer.call(this, EDGE, 1, 13, 6, fadeType);\n",
         "        if (mapId === FIELD && fieldLocked() && !($gameTemp && $gameTemp._homesLetIn) && window.$gameMap && $gameMap.mapId() !== FIELD && inPlot(x, y)) {\n"
         "            if ($gameMap.mapId() === HUT_MAP) return _reserveTransfer.call(this, FIELD, PLOT.out[0], PLOT.out[1], 4, fadeType);\n"),
    ])
    # Story.js: the escort of the shut field - out of the plot, onto Kruczy Jar beside the west gate (was Map023 (1,13))
    P(PLUG("Story"), "        o.push(C(201, [0, 23, 1, 13, 6, 0]));   // (Skraj lasu, where the way from the field comes out)\n",
      "        o.push(C(201, [0, 3, %d, %d, 4, 0]));   // (Kruczy Jar, outside the west gate of the plot's fence; was Skraj lasu, Map023 (1,13))\n" % PLOT_OUT)


# ====================================================================================================================
# 7. Pockets as part of the world: SwiatData.extra (F9 pickers, ...), Debug.js, the island map's interiors, K51's raven (Kruk.js)
# ====================================================================================================================
POCKET_MAPS = [120, 121, 122, 123, 124, 155, 156, 157, 168, 169]   # (Osada Milczących + its four rooms, Pustelnia + Skryptorium + Urwisko, Spalona zagroda + Dom Ługów)
MINE_MAPS = [175, 213]                                              # (Orla Grań and the mine: the mine agent builds them; they belong to the world from here on)
GATE125 = (101, 95)          # Przystań, beside the lighthouse hill (x 86-98, y 98-110) on the cliff path: the gate "Ścieżka na klif" (posts at x-1, x+1)
SIGN125 = (104, 96)          # its signpost
HERMIT_IN = (22, 70)         # Pustelnia (Map155): the landing beside the south edge (21-23,71)
GATE13 = (6, 27)             # Góry: the Silent's gate (it exists: event 6); the cell below it is the landing back
OSADA_IN = (46, 65)          # Map120: the landing at the south edge (45-47,67), the old way in

def sec_swiat():
    ext = POCKET_MAPS + MINE_MAPS
    SW = PLUG("Swiat_Data")
    P(SW, "        // id mapy: [x0, y0, szerokość, wysokość] w kratkach świata\n        maps: {",
      "        // (2026-11-11 questy_mapa) maps that are not on the board but are part of the world: the three pockets (Osada Milczących, Pustelnia + Urwisko,\n"
      "        // Spalona zagroda: each through one gate of a board map) and the mine with Orla Grań - no seams, no world position; the F9 pickers read it\n"
      "        extra: %s,\n        // id mapy: [x0, y0, szerokość, wysokość] w kratkach świata\n        maps: {" % json.dumps(ext))
    D = PLUG("Debug")
    PR(D, [
        ("    const inWorld = map => !window.SwiatData || !SwiatData.maps || !!SwiatData.maps[map] || WORLD_EXTRA.includes(Number(map));\n",
         "    // (2026-11-11) SwiatData.extra: the pockets (Osada Milczących, Pustelnia + Urwisko, Spalona zagroda) and the mine with Orla Grań belong to the world too\n"
         "    const inWorld = map => !window.SwiatData || !SwiatData.maps || !!SwiatData.maps[map] || (SwiatData.extra || []).includes(Number(map)) || WORLD_EXTRA.includes(Number(map));\n"),
        ('    const OFF_ORZEL = ["kradziez", "gran"];\n    const OFF_CHAPTERS = { kantor: [6] };\n',
         '    const OFF_ORZEL = (window.SwiatData && (SwiatData.extra || []).includes(175)) ? [] : ["kradziez", "gran"];   // (the Orla Grań is in the world now: through the mine)\n'
         '    const OFF_CHAPTERS = {};   // (2026-11-11: W5 chapter 6, the ferry night, is on Kruczy Jar now)\n'),
        ('"Lowy:den": false,', '"Lowy:den": [FIGHT_TAB, "lowy", 1],'),
        ('"Lowy:rab": false, "Lowy:czo": false,', '"Lowy:rab": [FIGHT_TAB, "lowy", 5], "Lowy:czo": [FIGHT_TAB, "lowy", 6],'),
        ('"Lowy:strays": false,', '"Lowy:strays": [FIGHT_TAB, "lowy", 9],'),
        ('"Ludzie:kiln": false, "Ludzie:stop": false, "Ludzie:p018": false,',
         '"Ludzie:kiln": [STORY_TAB, "ludziePaczka", 1], "Ludzie:stop": [STORY_TAB, "ludziePaczka", 2], "Ludzie:p018": [STORY_TAB, "ludziePaczka", 3],'),
        ('"Zakon:grove": false,', '"Zakon:grove": [STORY_TAB, "zakon", 5],'),
    ])
    # the island map's list of interiors: the pockets' rooms and the mine
    P(PLUG("MapaWyspy_Data"), '        210: [111, "Chałupa z desek"], 211: [111, "Szopa"], 212: [111, "Komórka"]\n',
      '        210: [111, "Chałupa z desek"], 211: [111, "Szopa"], 212: [111, "Komórka"],\n'
      '        // (2026-11-11 questy_mapa) the pockets: Osada Milczących (through the gate in Góry), Pustelnia + Urwisko (the gate on Przystań), Spalona zagroda (Podgrodzie)\n'
      '        120: [13, "Osada Milczących"], 121: [13, "Wspólna izba"], 122: [13, "Chata tkaczki"], 123: [13, "Chata Najstarszego"], 124: [13, "Chata rzeźbiarza"],\n'
      '        155: [125, "Pustelnia na klifie"], 156: [125, "Skryptorium"], 157: [125, "Urwisko Kruków"], 168: [111, "Spalona zagroda"], 169: [111, "Dom Ługów"],\n'
      '        175: [13, "Orla Grań"], 213: [13, "Kopalnia"]\n')
    # K51: the raven waits at the harbour's gate of the cliff path (was the harbour's north edge)
    PR(PLUG("Kruk"), [
        ("            { map: HARBOUR, at: mastPoint, near: 4.5, go: () => ({ x: 15.5, y: 2.6, z: 0 }), dawn: true },\n"
         "            { map: HARBOUR, at: () => ({ x: 15.5, y: 2.6, z: 0 }), near: 4, go: () => ({ x: 15.5, y: -3, z: 90, off: true }) },\n",
         "            // (2026-11-11 questy_mapa: the way to Pustelnia is the gate of the cliff path beside the lighthouse hill, Przystań (%d,%d))\n"
         "            { map: HARBOUR, at: mastPoint, near: 4.5, go: () => ({ x: %d.5, y: %d.7, z: 0 }), dawn: true },\n"
         "            { map: HARBOUR, at: () => ({ x: %d.5, y: %d.7, z: 0 }), near: 4, go: () => ({ x: %d.5, y: %d, z: 90, off: true }) },\n"
         % (GATE125[0], GATE125[1], GATE125[0], GATE125[1] + 1, GATE125[0], GATE125[1] + 1, GATE125[0], GATE125[1] - 5)),
    ])


# ====================================================================================================================
# 8. The maps: three pockets (gates, edges), nothing else (the places of the quests are plugin events at data coordinates)
# ====================================================================================================================
def gate_events(m, name, x, y, tr_cmd, left=2, right=2):
    """an open wooden gate (Mt_Gate, 3 x 3 tiles, the arch above the hero): the passage cell (x, y) with a touch trigger and two posts (x-1, x+1) that block"""
    g = add_event(m, name, x, y, [page("!$Mt_Gate", 4, 0, [tr_cmd], pri=2, through=True, trig=1, dirfix=True)])
    pl = add_event(m, "Słup bramy", x - 1, y, [page(pri=1)])
    pr = add_event(m, "Słup bramy", x + 1, y, [page(pri=1)])
    # a palisade run on each side (Garnizon art, 3-tile fronts, as the Silent's palisade of Map120): the gate is a gap in a stockade, not a lone frame
    for side, n in (("L", left), ("R", right)):
        for k in range(n):
            cx = x - 3 - 3 * k if side == "L" else x + 3 + 3 * k
            add_event(m, "Palisada przy bramie", cx, y, [page("!Garnizon_Palisada", (2, 4, 6)[(k + (side == "R")) % 3] if False else 2, (k + (side == "R")) % 3, pri=1, dirfix=True)], "<Occupy:left=1,right=1>")
    return g, pl, pr

def sec_maps():
    # ---- Pocket 1: Osada Milczących (120-124): the gate of Góry (6,27) -> the south edge of Map120 (the old way in); the other edges of 120 closed
    m = M(13)
    e = m["events"][6]
    if e["name"] != "Brama Milczących" or e["x"] != 6 or e["y"] != 27: raise SystemExit("STOP: Map013 zdarzenie 6 to nie brama")
    e["note"] = ""      # (it blocked three cells with <Occupy:left=1,right=1>: now the posts below do, the middle is the passage)
    e["pages"] = [page("!$Mt_Gate", 4, 0, [transfer(120, OSADA_IN[0], OSADA_IN[1], 8)], pri=2, through=True, trig=1, dirfix=True)]
    add_event(m, "Słup bramy", 5, 27, [page(pri=1)])
    add_event(m, "Słup bramy", 7, 27, [page(pri=1)])
    m = M(120)
    for i in (146, 150, 154): set_transfer(m["events"][i], 13, GATE13[0], GATE13[1] + 1, 2)
    del_events(m, [155, 156, 157, 158, 165, 172])
    # ---- Pocket 2: Pustelnia + Urwisko (155, 156, 157): the gate "Ścieżka na klif" on Przystań beside the lighthouse hill; 155's south edge leads out to it
    m = M(125)
    g, pl, pr = gate_events(m, "Brama: Ścieżka na klif", GATE125[0], GATE125[1], transfer(155, HERMIT_IN[0], HERMIT_IN[1], 8))
    add_event(m, "Drogowskaz: Ścieżka na klif", SIGN125[0], SIGN125[1],
              [page("!$Drogowskaz", 2, 1, [popup_cmd("Ścieżka na klif. W górę, do pustelni na skale.")], dirfix=True)])
    m = M(155)
    for i in (66, 67, 68): set_transfer(m["events"][i], 125, GATE125[0], GATE125[1] + 1, 2)
    m = M(157)
    del_events(m, [93, 94, 95])
    # ---- Pocket 3: Spalona zagroda (168, 169): the gate in the north-east corner of Podgrodzie is Homes.js's; 168's west edge leads out to it, the others are closed
    m = M(168)
    for i in (33, 56, 57): set_transfer(m["events"][i], 111, GATE111[0], GATE111[1] + 1, 2)
    del_events(m, [58, 261, 262])
    # the gate in the north-east corner of Podgrodzie (a map event: the compass reads the exits from the map's file) and its signpost
    m = M(111)
    gate_events(m, "Brama: Spalona zagroda", GATE111[0], GATE111[1], transfer(168, FARM_IN[0], FARM_IN[1], 6), left=0, right=2)
    add_event(m, "Drogowskaz: Spalona zagroda", SIGN111[0], SIGN111[1],
              [page("!$Drogowskaz", 2, 1, [cmd(355, ['Tawerna.call("Homes", "signpost");'])], dirfix=True)])


# ====================================================================================================================
# 8b. The town (Map008): markers before the doors of the six new buildings (tools/questy_mapa/markery_miasta.py; the same table is a section of
# tools/miasto5/build5.py) + the seamstress goes to the cloth hall's front in the mornings (TownLife_Data.js)
# ====================================================================================================================
sys.path.insert(0, HERE)
import markery_miasta as QM
def sec_miasto():
    m = M(8)
    have = {e["name"] for e in m["events"] if e}
    for key, (x, y, d, what) in QM.MARKERY.items():
        if "Miejsce: " + key in have: raise SystemExit("STOP: Map008 ma juz znacznik " + key)
        add_event(m, "Miejsce: " + key, x, y, [page(None, d, 0, None, pri=0, through=True)])
    TD = PLUG("TownLife_Data")
    P(TD, "        // (2026-10-05, the quests' new people) Lucjan's dice by the right stall;",
          "        // (2026-11-11 questy_mapa) the fronts of the six new buildings (Map008 markers \"Miejsce: <key>\": tools/questy_mapa/markery_miasta.py)\n"
          + "        " + ", ".join('%s: [%d, %d, %d]' % (k, v[0], v[1], v[2]) for k, v in QM.MARKERY.items()) + ",\n"
          "        // (2026-10-05, the quests' new people) Lucjan's dice by the right stall;")
    P(TD, '[[0, "inside", "dom3_drzwi"], [9.5, "wander", "stragan_4"], [11, "wander", "plac_2"]',
          '[[0, "inside", "dom3_drzwi"], [9.5, "wander", "sukiennice_przed"], [11, "wander", "plac_2"]')


# ====================================================================================================================
# 9. Texts (js/teksty/*.txt): ONLY wording where a place moved; no key is deleted or renamed
# ====================================================================================================================
def TL(name, start, *subs):
    """one line of js/teksty/<name>.txt (found by its first characters): the substrings replaced inside it (each must occur)"""
    rel = TXT(name)
    t = _get(rel)["b"].decode("utf-8").split("\n")
    hit = [l for l in t if l.startswith(start)]
    if len(hit) != 1: raise SystemExit("STOP: %s: %d linii zaczynajacych sie od %r" % (rel, len(hit), start))
    line = hit[0]; new = line
    for a, b in subs:
        if a not in new: raise SystemExit("STOP: %s: brak %r w linii %r" % (rel, a, start))
        new = new.replace(a, b)
    P(rel, "\n" + line + "\n", "\n" + new + "\n")

def sec_teksty():
    DROGA = "drodze za bramą południową"
    # K3 (the horseshoe: Kruczy Jar, the road behind the south gate)
    TL("zadania_k", "zadania.K3.where = ", ("Polna droga", "droga za bramą południową (Kruczy Jar)"))
    TL("zadania_k", "zadania.K3.desc = ", ("na Polnej drodze", "na " + DROGA))
    TL("zadania_k", "Wiesiek wiózł mi podkowy", ("na Polnej drodze", "na " + DROGA))
    TL("zadania_k", "Polna droga, między kamieniami.", ("Polna droga, między", "Droga za bramą południową, między"))
    TL("zadania_k", "zadania.K3.steps.0.text = ", ("na Polnej drodze", "na " + DROGA))
    # D5 (the scouts on Kruczy Jar, the leader on Łąka)
    TL("zadania_d", "zadania.D5.where = ", ("Polna droga + Skraj lasu", "Kruczy Jar + Łąka"))
    TL("zadania_d", "zadania.D5.desc = ", ("na Polnej drodze, a potem przewodnik watahy na Skraju lasu", "na Kruczym Jarze, a potem przewodnik watahy na Łące"))
    TL("zadania_d", "> Tropy. Duże.", ("Idą od Polnej drogi.", "Idą od strony Kruczego Jaru."))
    TL("zadania_d", "zadania.D5.steps.1.text = ", ("na Polnej drodze", "na Kruczym Jarze"))
    TL("zadania_d", "zadania.D5.steps.2.text = ", ("na Skraju lasu", "na Łące"))
    # W1 (the ambush)
    t = _get(TXT("w1"))["b"].decode("utf-8")
    P(TXT("w1"), "Napad na Polnej drodze\n", "Napad na Kruczym Jarze\n", t.count("Napad na Polnej drodze\n"))
    for start in ("Dwa tygodnie po umowie z Feliksem napadli mnie na Polnej drodze jego ludzie w kapturach", "Dwa tygodnie po umowie z Feliksem napadli mnie na Polnej drodze jego ludzie - ",
                  "Jeden z ludzi, którzy napadli mnie na Polnej drodze", "> I jeszcze jedno: ludzie Feliksa napadli mnie na Polnej drodze.", "zadania.W1.steps.8.text = "):
        TL("w1", start, ("na Polnej drodze", "na Kruczym Jarze"))
    # W5 (the smugglers' camp and the ferry night's cart: Kruczy Jar)
    TL("kantor", "zadania.W5.where = ", ("Skraj lasu, Polna droga", "Kruczy Jar (Skraj lasu na wschodzie, droga na północ od działki)"))
    TL("kantor", "zadania.W5.steps.2.text = ", ("przez Polną drogę na Skraj lasu:", "przez Kruczy Jar na jego wschodni Skraj lasu:"))
    TL("kantor", "zadania.W5.steps.8.text = ", ("na Polnej drodze, przy rozwidleniu", "na Kruczym Jarze, na drodze na północ od działki, przy rozwidleniu"))
    TL("kantor", "W noc promu pobiłem ludzi Baltazara", ("na Polnej drodze", "na Kruczym Jarze"))
    TL("kantor", "Ludzie Baltazara pobili mnie przy wozie", ("na Polnej drodze", "na Kruczym Jarze"))
    TL("kantor", "promFirst = ", ("na Polnej drodze", "na Kruczym Jarze, na drodze na północ od działki"))
    # K64 (the lost sheep: Łąka behind the fold) and the shepherd's words
    TL("ludzie", "zadania.K64.where = ", ("Łąka (koszar), Omszała łąka", "Łąka (koszar i łąka za nim)"))
    TL("ludzie", "zadania.K64.desc = ", ("na Omszałą łąkę", "na łąkę za koszarem"))
    TL("ludzie", "Pewnie na Omszałej łące, tam zawsze ucieka.", ("Pewnie na Omszałej łące, tam", "Pewnie gdzieś na łące za koszarem, tam"))
    TL("ludzie", "zadania.K64.steps.0.text = ", ("na Omszałej łące", "na łące za koszarem"))
    TL("ludzie", "na północnym wschodzie, pod lasem", ("na północnym wschodzie, pod lasem", "na zachodnim skraju łąki, pod lasem"))
    # the pedlar's two stops
    TL("ludzie", "Rano rozkładam towar. Cztery drogi,", ("Cztery drogi, cztery postoje - Polna, Leśna, Łąka i Kruczy Jar przy", "Dwa postoje - Łąka i Kruczy Jar przy"))
    TL("ludzie", "odkrycia.lud_postoj.text = ", ("ognisko przy Polnej drodze. Szymon Juczny krąży czterema postojami: Polna droga, Leśna droga, Łąka, Kruczy Jar - dzień tu",
                                                "ognisko przy drodze na Łące. Szymon Juczny krąży dwoma postojami: Łąka i Kruczy Jar - dzień tu"))
    TL("ludzie", "Postój handlarza (Polna droga)", ("(Polna droga)", "(Łąka, przy ognisku)"))
    TL("ludzie", "Postój handlarza (Leśna droga)", ("(Leśna droga)", "(Kruczy Jar, przy ognisku)"))
    TL("ludzie", "Omszała łąka (owca K64)", ("Omszała łąka (owca K64)", "Łąka za koszarem (owca K64)"))
    # the burnt farm: behind the north-east corner of Podgrodzie (a gate), not "east of Skraj lasu"
    TL("domy", "domy.zagroda.where = ", ("na wschód od Skraju lasu (ścieżka przy drogowskazie, nad drogą do Kruczego Jaru)", "za północno-wschodnim rogiem Podgrodzia (brama przy drogowskazie)"))
    TL("domy", "zadania.D21.where = ", ("na wschód od Skraju lasu", "za północno-wschodnim rogiem Podgrodzia"))
    TL("domy", "zadania.D21.desc = ", ("Za Skrajem lasu stoją", "Za północno-wschodnim rogiem Podgrodzia stoją"))
    TL("domy", "> Józku, za Skrajem lasu stoi", ("za Skrajem lasu stoi", "za północno-wschodnim rogiem Podgrodzia stoi"))
    TL("domy", "kod.soltysList.3 = ", ("za Skrajem lasu", "za północno-wschodnim rogiem Podgrodzia"))
    # the wreck (Map165): reached by Janek's boat from Przystań only - there is no sandbar from the garrison (Wyspa_Data: 162 <-> 165 cut)
    TL("wrak", "zadania.D25.where = ", ("łódź Janka z przystani albo łacha od garnizonu w odpływie", "łódź Janka z przystani"))
    TL("wrak", "Janek cię podwiezie, za dnia. Albo idź", ("Janek cię podwiezie, za dnia. Albo idź po łasze od garnizonu, kiedy morze odejdzie. Tylko nie daj się złapać żołnierzom bez glejtu.",
                                                           "Janek cię podwiezie, za dnia, z przystani. Tylko nie siedź tam do zmroku - woda wraca szybko."))
    TL("wrak", "zadania.D25.steps.0.text = ", ("łodzią Janka (przystań, za dnia) albo pieszo po łasze od garnizonu, w odpływie.", "łodzią Janka (przystań, za dnia)."))
    TL("wrak", "janekTide = ", ("Wtedy łacha od garnizonu wychodzi z wody.", "Wtedy mielizna przy wraku wychodzi z wody."))
    TL("wrak", "janekGone = ", ("Zostaje łacha w odpływie... albo czekanie.", "Zostaje czekać na niego na przystani."))
    TL("wrak", "lowEnding = ", ("Łacha do garnizonu zaraz zniknie.", "Mielizna przy wraku zaraz zniknie."))
    TL("garnizon", "Ta łacha w odpływie... Kto chce", ("Ta łacha w odpływie... Kto chce, przejdzie do wraku suchą nogą. Pilnować.", "Ten wrak na mieliźnie... Kto chce, dopłynie do niego łodzią z przystani. Pilnować."))
    TL("garnizon", "Z wieży widać wrak. W odpływie", ("W odpływie łacha wychodzi z wody aż pod jego burtę. Rotmistrz nie pozwala chodzić - chyba że masz glejt.", "Rotmistrz nie pozwala do niego pływać - chyba że masz glejt."))


# ====================================================================================================================
# 10. Tests (staged copies in staging/tests/, same names; they go to tests/ at install): the old maps / coordinates -> the new homes
# ====================================================================================================================
def PT(name, pairs):
    for a in pairs:
        P("tests/%s.js" % name, *a)

def sec_tests():
    PT("zakon_test", [
        ("    const MAPS = [22, 13, 157, 21, 4, 17, 23, 155, 18, 125, 168, 175, 8, 120, 165];", "    const MAPS = [3, 13, 157, 4, 155, 125, 168, 175, 8, 120, 165];   // (2026-11-11 plansza: 22, 21, 17, 23, 18 are places of Kruczy Jar (3) and Łąka (4))"),
        ("    await go(22, 73, 41, 10);\n    await t.eval(`__near(73, 39); 0`);", "    await go(3, 61, 18, 10);\n    await t.eval(`__near(61, 16); 0`);"),
        ('$gameSelfSwitches.value([22, 2701, "B"])', '$gameSelfSwitches.value([3, 2701, "B"])'),
        ("    await go(22, 72, 18, 10);", "    await go(3, 69, 16, 10);"),
        ("    await go(17, 50, 39, 10);\n    await t.eval(`__near(50, 37); 0`);", "    await go(3, 8, 81, 10);\n    await t.eval(`__near(8, 79); 0`);"),
        ('$gameSelfSwitches.value([17, 2751, "B"])', '$gameSelfSwitches.value([3, 2751, "B"])'),
        ("    await go(18, 52, 45, 12);\n    await t.eval(`__near(52, 43); window.__kit.pops.length = 0; 0`);", "    await go(4, 49, 78, 12);\n    await t.eval(`__near(49, 76); window.__kit.pops.length = 0; 0`);"),
        ("$gameScreen.clearWeather(); __near(52, 43); return 0;", "$gameScreen.clearWeather(); __near(49, 76); return 0;"),
        ('$gameSelfSwitches.value([18, 2769, "B"])', '$gameSelfSwitches.value([4, 2769, "B"])'),
        ("$gamePlayer.locate(53, 46); 0", "$gamePlayer.locate(50, 79); 0"),
        ("    const up = await t.until(t.onMap(18), 30);\n    t.check(\"schody komory wyprowadzają na Łąkę menhirów (53,46)\", up && (await t.json(`[$gamePlayer.x, $gamePlayer.y]`)).join() === \"53,46\");",
         "    const up = await t.until(t.onMap(4), 30);\n    t.check(\"schody komory wyprowadzają na Łąkę menhirów (50,79)\", up && (await t.json(`[$gamePlayer.x, $gamePlayer.y]`)).join() === \"50,79\");"),
    ])
    PT("zasoby_test", [
        ('JSON.stringify([[2900, 17, "$Npc_Jagna"]])', 'JSON.stringify([[2900, 3, "$Npc_Jagna"]])'),
        ("mieszkanka TownLife 2900 na Map017", "mieszkanka TownLife 2900 na Map003 (Omszała łąka)"),
        ("out.push([17, h.id, h.x, h.y])", "out.push([3, h.id, h.x, h.y])"),
        ("out.push([17, r.ids[i], c[0], c[1]])", "out.push([3, r.ids[i], c[0], c[1]])"),
        ("    const MAPS = [17, 21, 13, 155, 168, 3, 111, 125, 162, 8];", "    const MAPS = [4, 13, 155, 168, 3, 111, 125, 162, 8];   // (2026-11-11: Map017 is built with Map003, Map021's spring is on Map004)"),
        ("    await t.go(17, 71, 55, 8);", "    await t.go(3, 40, 80, 8);"),
        ("$gameSelfSwitches.value([17, id, 'A'])", "$gameSelfSwitches.value([3, id, 'A'])"),
        ("    await t.locate(54, 42, 8);", "    await t.locate(43, 72, 8);"),
        ("$gameSelfSwitches.value([17, 2107, 'A'])", "$gameSelfSwitches.value([3, 2107, 'A'])"),
        ("    await t.locate(54, 44, 2);", "    await t.locate(43, 74, 2);"),
        ("Zasoby.herbState(17, 2104, 'arcydziegiel')", "Zasoby.herbState(3, 2104, 'arcydziegiel')"),
        ("    await t.go(17, 67, 17, 8);", "    await t.go(3, 20, 76, 8);"),
        ("    await t.go(21, 20, 15);", "    await t.go(4, 20, 15);"),
        ("przy swojej polance (67,15)\", !!jg && jg.x === 67 && jg.y === 15", "przy swojej polance (20,75)\", !!jg && jg.x === 20 && jg.y === 75"),
    ])
    PT("lowy_test", [
        ("fixed: [!!Humans.fixedCamp(21), !!Humans.fixedCamp(23)]", "fixed: [!!Humans.fixedCamp(4), !!Humans.fixedCamp(3)]"),
        ("stałe obozy na Map021 i Map023", "stałe obozy na Łące (4) i Kruczym Jarze (3)"),
        ("        23: [[2300, 65, 50], [2301, 68, 19]], 13: [[2320, 100, 46], [2321, 99, 46]], 21: [[2340, 67, 48], [2341, 62, 39]],\n        4: [[2360, 73, 51], [2361, 70, 53], [2362, 74, 52]],",
         "        3: [[2300, 95, 30], [2301, 98, 41]], 13: [[2320, 100, 46], [2321, 99, 46]], 21: [[2340, 67, 48]],\n        4: [[2341, 89, 37], [2360, 73, 51], [2361, 70, 53], [2362, 74, 52]],"),
        ("__put(65, 55, 4, 7);", "__put(95, 35, 4, 7);"),
        ("__put(65, 50, 7, 10);", "__put(95, 30, 7, 10);"),
        ("    await t.eval(\"(function(){ Lowy.state().camps.forceRab", "    await go(4, 6);\n    await t.eval(\"(function(){ Lowy.state().camps.forceRab"),
        ("__put(64, 51, 1, 3);", "__put(94, 31, 1, 3);"),
        ("Math.hypot(c.x - 66.5, c.y - 52.5) < 1", "Math.hypot(c.x - 96.5, c.y - 32.5) < 1"),
        ("__put(66, 26, 5, 8);", "__put(96, 47, 5, 8);"),
        ("__put(60, 46, 5, 8);", "__put(87, 44, 5, 8);"),
        ("na swoim miejscu (60,41) nocą, 2-4 ludzi, namiot widać\", rab && rab.fixed && rab.x === 60 && rab.y === 41", "na swoim miejscu (87,39) nocą, 2-4 ludzi, namiot widać\", rab && rab.fixed && rab.x === 87 && rab.y === 39"),
        ("    await go(23, 10);", "    await go(3, 10);", 3),
        ("Czarnych Oczu za dnia na (66,21):", "Czarnych Oczu za dnia na (96,42):"),
        ("czo.fixed && czo.x === 66 && czo.y === 21", "czo.fixed && czo.x === 96 && czo.y === 42"),
        ("__put(66, 21, 2, 4);", "__put(96, 42, 2, 4);"),
    ])
    PT("ludzie_test", [
        ("homes: [3, 4, 18, 21, 22, 159, 162].filter(m => TownLife.HOMES.has(m)),", "homes: [3, 4, 18, 21, 22, 159, 162].filter(m => TownLife.HOMES.has(m)),   // (2026-11-11: the pedlar stops on 4 and 3 only)"),
        ("ma „alt” na Map021 w dni mielerza", "ma „alt” na Łące (Map004) w dni mielerza"),
        ('JSON.stringify([21, "ludMielerz", true])', 'JSON.stringify([4, "ludMielerz", true])'),
        ("postoje handlarza (3, 4, 21, 22), menhiry (18), przylądek (159), garnizon (162)\", d.homes.length === 7", "postoje handlarza (3, 4), przylądek (159), garnizon (162)\", d.homes.length === 4"),
        ("        for (const m of [21, 22, 4, 3, 13, 125, 168]) {", "        for (const m of [4, 3, 13, 125, 168]) {"),
        ("        await t.go(21, 51, 21, 8);", "        await t.go(4, 48, 26, 8);", 2),
        ("        await t.go(21, 50, 21, 8, { calm: false });", "        await t.go(4, 47, 26, 8, { calm: false });"),
        ("mieszka wtedy na Leśnej drodze (alt) i stoi przy kopcu\", k.home === 21 && zb && !zb.hidden && zb.map === 21", "mieszka wtedy na Leśnej drodze (alt, Łąka) i stoi przy kopcu\", k.home === 4 && zb && !zb.hidden && zb.map === 4"),
        ("const stops = [[12, 22, [52, 23]], [13, 21, [54, 19]], [14, 4, [62, 13]], [15, 3, [61, 13]]], seen = [];", "const stops = [[12, 4, [62, 13]], [13, 3, [61, 13]], [14, 4, [62, 13]], [15, 3, [61, 13]]], seen = [];"),
        ("const wagon = m === 21 ? true : await shown({ 22: 2520, 4: 2554, 3: 2570 }[m]);", "const wagon = await shown({ 4: 2554, 3: 2570 }[m]);"),
        ("handlarz krąży: dzień % 4 = 0 Polna droga, 1 Leśna droga, 2 Łąka, 3 Kruczy Jar", "handlarz krąży: dzień % 2 = 0 Łąka, 1 Kruczy Jar"),
        ("spots = [[55, 12], [61, 11], [67, 8]], at = spots[k.spot];\n        await t.go(21, at[0], at[1] + 1, 8);", "spots = [[52, 15], [64, 14], [66, 16]], at = spots[k.spot];\n        await t.go(4, at[0], at[1] + 1, 8);"),
        ("spot = { 22: [52, 23], 21: [54, 19], 4: [62, 13], 3: [61, 13] }[m];", "spot = { 4: [62, 13], 3: [61, 13] }[m];"),
        ("        await t.go(18, 68, 34, 8);", "        await t.go(4, 47, 64, 8);"),
        ("at = [[40, 40], [60, 38], [72, 30]][k.spot];", "at = [[40, 50], [62, 45], [31, 54]][k.spot];"),
        ("        await t.go(stop.o.go[1], stop.o.go[2], stop.o.go[3], stop.o.go[4]);\n        const here = await resHere(\"handlarz\");", "        await t.go(8, 60, 60, 2);\n        await t.go(stop.o.go[1], stop.o.go[2], stop.o.go[3], stop.o.go[4]);\n        await t.frames(40);\n        const here = await resHere(\"handlarz\");"),
        ("pastwisku przy menhirach (Map018)\", c.home === 18 &&", "pastwisku przy menhirach (Łąka, drugie pastwisko)\", c.home === 4 &&"),
        ('        const e17 = await t.json("OkoliceData.ENTRY[17]");\n        await t.go(17, e17[0], e17[1], 8);', '        const e17 = await t.json("OkoliceData.ENTRY[4]");\n        await t.go(4, e17[0], e17[1], 8);'),
        ("przenosi na miejsce paczki (mielerz, Map021)\", row.go[1] === 21 && (await t.eval(\"$gameMap.mapId()\")) === 21", "przenosi na miejsce paczki (mielerz, Łąka)\", row.go[1] === 4 && (await t.eval(\"$gameMap.mapId()\")) === 4"),
    ])
    PT("w5_test", [
        ("    await go(23, 24, 1, 2);", "    await go(3, 87, 49, 2);", 3),
        ("    await go(22, 12, 2, 2);", "    await go(3, 76, 8, 2);", 5),
        ("obóz przemytników na Skraju lasu (Map023, noc)", "obóz przemytników na Skraju lasu (Kruczy Jar, noc)"),
        ("Hunting.setSneak(true); $gamePlayer.locate(30, 4);", "Hunting.setSneak(true); $gamePlayer.locate(93, 52);"),
        ("$gamePlayer.locate(25, 20); Kantor.promMen()", "$gamePlayer.locate(84, 16); Kantor.promMen()"),
        ("$gamePlayer.locate(31, 22);", "$gamePlayer.locate(90, 18);", 1),
        ("$gamePlayer.locate(29, 19);", "$gamePlayer.locate(88, 15);", 2),
    ])
    PT("field_loss_test", [
        ("    await t.until(t.onMap(23), 20);\n    await t.frames(40);\n    const D = await J(", "    await t.until(t.onMap(3), 20);\n    await t.frames(40);\n    const D = await J("),
        ("guard: ${shown(23, 704)}", "guard: ${shown(3, 704)}"),
        ("to Skraj lasu (1,13); 'Działka należy teraz do Lorda.' over the hero\",\n        escort && D.map === 23 && D.x === 1 && D.y === 13 &&", "out of the plot onto Kruczy Jar (40,47); 'Działka należy teraz do Lorda.' over the hero\",\n        escort && D.map === 3 && D.x === 40 && D.y === 47 &&"),
        ("D.dog.map === 23 && D.dog.mode", "D.dog.map === 3 && D.dog.mode"),
        ("    await t.eval(\"$gamePlayer.reserveTransfer(3, 78, 13, 4, 0); 0\");   // (2026-10-18: the field doubled to 80x60)\n    await t.frames(20);\n    await t.eval(\"$gamePlayer.locate(1, 13); $gameMap.event(99).start(); 0\");\n    await t.frames(30);",
         "    await t.go(8, 60, 60, 2);   // (2026-11-11: only the plot is refused now - a transfer from another map onto a cell inside its fence)\n    await t.eval(\"$gamePlayer.reserveTransfer(3, 60, 45, 8, 0); 0\");\n    await t.frames(30);"),
        ("the way onto the field refused (a transfer and the passage event): still Skraj lasu, the popup over the hero\", (await t.eval(\"$gameMap.mapId()\")) === 23", "the way onto the plot refused (a transfer onto a cell inside the fence): still the town, the popup over the hero\", (await t.eval(\"$gameMap.mapId()\")) === 8"),
        ("    await t.locate(2, 13, 4);", "    await t.go(3, 40, 47, 4);"),
        ("// ---- the burnt farm: the way from Skraj lasu", "// ---- the burnt farm: the way from Podgrodzie"),
        ("    await t.go(23, 77, 28, 6);", "    await t.go(111, 110, 22, 8);"),
        ("const way = await J(\"({ sign: ($gameMap.event(709) || { characterName: () => '' }).characterName(), way: [706, 707, 708].map(id => { const e = $gameMap.event(id); return e ? e.x + ',' + e.y : null; }) })\");",
         "const way = await J(\"(function(){ const f = re => $gameMap.events().find(e => e.event() && re.test(e.event().name)); const s = f(/^Drogowskaz: Spalona/), g = f(/^Brama: Spalona/); return { sign: s ? s.characterName() : '', gate: g ? [g.x, g.y] : null, gid: g ? g.eventId() : 0 }; })()\");"),
        ("    await t.locate(78, 28, 6);\n    await t.frames(10);\n    await t.shot(path.join(SHOTS, \"zagroda_wejscie.png\"));\n    await t.eval(\"$gameMap.event(707).start(); 0\");",
         "    await t.locate(110, 21, 8);\n    await t.frames(10);\n    await t.shot(path.join(SHOTS, \"zagroda_wejscie.png\"));\n    await t.eval(`$gameMap.event(${way.gid}).start(); 0`);"),
        ("E7 Skraj lasu's east edge (rows 27-29, Homes' events with the signpost) -> the burnt farm (Map168, 1,72 - its west edge, the world)", "E7 the gate in the north-east corner of Podgrodzie (110,20, with the signpost) -> the burnt farm (Map168, 1,25 - its west edge)"),
        ("way.way.join() === \"79,27,79,28,79,29\" && onFarm && Z0.x === 1 && Z0.y === 72", "way.gate.join() === \"110,20\" && onFarm && Z0.x === 1 && Z0.y === 25"),
        ("guard: $gameSelfSwitches.value([23, 704, 'A'])", "guard: $gameSelfSwitches.value([3, 704, 'A'])"),
        ("await t.go(23, 2, 13, 4) && (await t.go(3, 77, 44, 4))", "await t.go(3, 40, 47, 4) && (await t.go(3, 77, 44, 4))"),
    ])
    PT("okolice_integracja_test", [
        ("    await t.go(17, 66, 16);", "    await t.go(3, 20, 76);"),
    ])


def sec_tests2():
    PT("w1_chapters_test", [
        ("const toRoad = async () => { await t.go(22, 12, 2, 2, { calm: false }); return band(); };", "const toRoad = async () => { await t.go(3, 76, 8, 2, { calm: false }); return band(); };"),
        ("Napad na Polnej drodze", "Napad na Kruczym Jarze", 2),
    ])
    PT("pustelnia_test", [
        ("ways.south.every(s => s[1] && s[1][0] === 950)", "ways.south.every(s => s[1] && s[1][0] === 125)"),
        ("dół (21-23, 71) -> Zbocze pod Pustelnią 950 (od 2026-10-30, nie do przystani)", "dół (21-23, 71) -> przystań, brama Ścieżki na klif (2026-11-11 kieszeń)"),
    ])
    PT("kruk_test", [
        ("    await t.locate(15, 5, 8);\n    await t.until(\"Kruk.state().k51.leg >= 2\", 30);", "    await t.locate(101, 97, 8);\n    await t.until(\"Kruk.state().k51.leg >= 2\", 30);"),
        ("kruk czeka przy górnej krawędzi przystani, potem leci nad klif", "kruk czeka przy bramie Ścieżki na klif (przystań), potem leci nad klif"),
    ])
    PT("debug_menu_test", [
        ("rows.filter(r => r.sec === \"lowy\" && !r.head).length === 5 &&", "rows.filter(r => r.sec === \"lowy\" && !r.head).length === 9 &&"),
        ("world = n => !!SwiatData.maps[n] || n === 1;", "world = n => !!SwiatData.maps[n] || (SwiatData.extra || []).includes(n) || n === 1;"),
        ("const OUT = [12, 17, 18, 21, 22, 23, 27, 120, 155, 156, 157, 159, 165, 166, 167, 168, 169, 175, 176, 177, 990, 991]", "const OUT = [12, 17, 18, 21, 22, 23, 27, 159, 165, 166, 167, 176, 177, 990, 991]"),
        ("the rows that went: Łowy", "the rows that came back (2026-11-11 pockets): Łowy"),
        ("!(await everyRow()).some(r => /Wataha", "(await everyRow()).filter(r => /Wataha"),
        ("Orlą Grań/.test(r.label)));", "Orlą Grań/.test(r.label)).length >= 8);"),
    ])
    PT("mountain_places_test", [
        ("    t.check(\"...and switch 16 does not open it\", still === true, still);", "    t.check(\"...and switch 16 does not matter: since 2026-11-11 the gate (6,27) is the open way into the Osada pocket (a passage under the arch, not a normal-priority block)\", still === false, still);"),
    ])


# ====================================================================================================================
# main: run every section, write ONLY to tools/questy_mapa/staging/
# ====================================================================================================================
def write_all():
    for sub in ("data", "js", "tests"):
        d = os.path.join(STG, sub)
        if os.path.isdir(d): shutil.rmtree(d)
    changed = []
    for i, m in sorted(MAPS.items()):
        raw = W.map_text(m).encode("utf-8")
        back = json.loads(raw.decode("utf-8"))
        if W.map_text(back).encode("utf-8") != raw: raise SystemExit("STOP: Map%03d nie wraca w petli" % i)
        for k, e in enumerate(back["events"]):
            if e is not None and e["id"] != k: raise SystemExit("STOP: Map%03d zdarzenie %d ma id %d" % (i, k, e["id"]))
        if raw == MAP_ORIG[i]: continue
        out = os.path.join(STG, "data", "Map%03d.json" % i)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "wb").write(raw); changed.append("data/Map%03d.json" % i)
    for rel, f in sorted(FILES.items()):
        if f["b"] == f["orig"]: continue
        out = os.path.join(STG, *rel.split("/"))
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "wb").write(f["b"]); changed.append(rel)
    return changed

if __name__ == "__main__":
    for fn in (sec_towncquests, sec_kantor, sec_ludzie, sec_zakon, sec_zasoby, sec_lowy, sec_homes, sec_swiat, sec_maps, sec_miasto, sec_teksty, sec_tests, sec_tests2):
        fn()
    ch = write_all()
    os.makedirs(os.path.join(STG, "tests"), exist_ok=True)
    shutil.copyfile(os.path.join(HERE, "questy_mapa_test.js"), os.path.join(STG, "tests", "questy_mapa_test.js")); ch.append("tests/questy_mapa_test.js")
    print("\n".join("  zapisano staging/" + c for c in ch))
    print("%d plikow w %s" % (len(ch), STG))
