# -*- coding: utf-8 -*-
"""Map027 'Mapa testowa: budynki' (tileset 17): left old Winlu buildings (from the backup Map008), right pack buildings (Proba_D.png). Run zestaw.py first."""
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, HERE)
import wspolne as W
from rects import OLD
sys.stdout.reconfigure(encoding="utf-8")
STG = os.path.join(HERE, "staging", "data")
MAPID = 27; GAP = 3
BACKUP = r"C:\Users\macie\OneDrive\Dokumenty\RMMZ\Tawerna_archiwum_2026-11-08\kruczogrod_miasto_20261108_154456\data\Map008.json"
old = json.load(open(BACKUP, encoding="utf-8")); OW, OH = old["width"], old["height"]; od = old["data"]
mp = json.load(open(os.path.join(HERE, "mapping.json"), encoding="utf-8"))
dmap = {int(k): v for k, v in mp["d"].items()}
NAMES = {"tawerna": "Karczma (duża)", "kaplica": "Kaplica z wieżyczką", "dom_grabarza": "Dom grabarza", "dom_ciesli": "Dom cieśli",
         "kamienica": "Kamienica", "dzwonnica": "Dzwonnica", "kantor": "Kantor", "kuznia": "Kuźnia", "dom_czerwony": "Dom z czerwonym dachem",
         "straznica": "Strażnica", "piekarnia": "Piekarnia", "dom_wodziarza": "Dom woziwody", "stajnia": "Stajnia", "dom_slomiany": "Chata kryta strzechą"}
WIDTH = 104


def shelves(items, x0, x1, y0):
    pos = {}; x = x0; y = y0; rowh = 0
    for k, w, h in items:
        if x + w > x1 + 1 and x > x0: x = x0; y += rowh + GAP; rowh = 0
        pos[k] = (x, y); x += w + GAP; rowh = max(rowh, h)
    return pos, y + rowh


oldit = [(k, r[2] - r[0] + 1, r[3] - r[1] + 1) for k, r in OLD.items()]
newit = [(k, v["w"], v["h"]) for k, v in mp["nowe"].items()]
oldit.sort(key=lambda a: (-(a[2] // 6), -a[1]))
newit.sort(key=lambda a: (-(a[2] // 4), -a[1]))
posO, endO = shelves(oldit, 3, 72, 4)
posN, endN = shelves(newit, 77, 100, 4)
HEIGHT = max(endO, endN) + 6
print("map", WIDTH, "x", HEIGHT, "old end", endO, "new end", endN)
N = WIDTH * HEIGHT
data = [0] * (6 * N)
def put(z, x, y, v): data[(z * HEIGHT + y) * WIDTH + x] = v
COBBLE = 2048 + 19 * 48
for y in range(HEIGHT):
    for x in range(WIDTH): put(0, x, y, COBBLE)
W.reshape({"width": WIDTH, "height": HEIGHT, "data": data}, 0, [(x, y) for x in range(WIDTH) for y in range(HEIGHT)])   # the cobble first (shapes), buildings over it
events = [None]
def page(img=None, lst=None, trigger=0, through=True, prio=0):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": False, "image": img or {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0},
            "list": lst or [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": prio, "stepAnime": False, "through": through, "trigger": trigger, "walkAnime": False}
def addev(name, x, y, lst=None, trigger=0, through=True):
    ev = {"id": len(events), "name": name, "note": "", "x": x, "y": y, "pages": [page(None, lst, trigger, through, 0)]}
    events.append(ev); return ev
SKIP_NAME = ("Miejsce", "Drzewo", "Sosna", "Dzika", "Studnia", "Brama", "Kantor", "Ska", "Suchy", "Sterta", "Wysoki", "Płaski", "Omsza", "Splot", "Kłoda")
SKIP_IMG = ("!$Tree", "!$Pine", "!$Big_Trees", "!$Boulder", "!$Bush", "Nature", "!$Rock", "!$Stump", "!$Smith")
cnt = {"tiles": 0, "events": 0}
for key, (x0, y0, x1, y1) in OLD.items():
    ox, oy = posO[key]
    for z in range(5):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                t = od[(z * OH + y) * OW + x]
                if t == 0: continue
                if z < 4 and 2048 <= t < 4352: continue          # A1/A2: ground, hedges, fences - not buildings
                if z == 0 and t < 4352 and not (1536 <= t < 2048 and key == "dzwonnica"): continue
                if z < 4 and 512 <= t < 768: t = dmap[t]
                put(z, ox + x - x0, oy + y - y0, t); cnt["tiles"] += 1
    for e in old["events"]:
        if not e or not (x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1): continue
        img = e["pages"][0]["image"]
        if e["name"].startswith(SKIP_NAME) or img.get("characterName", "").startswith(SKIP_IMG): continue
        ne = copy.deepcopy(e); ne["id"] = len(events); ne["x"] = ox + e["x"] - x0; ne["y"] = oy + e["y"] - y0
        ne["pages"] = [ne["pages"][0]]
        p = ne["pages"][0]
        p["conditions"].update({"selfSwitchValid": False, "switch1Valid": False, "switch2Valid": False, "variableValid": False, "itemValid": False, "actorValid": False})
        p["list"] = [{"code": 0, "indent": 0, "parameters": []}]
        p["trigger"] = 0
        im = p["image"]
        if 512 <= im.get("tileId", 0) < 768 and im["tileId"] in dmap: im["tileId"] = dmap[im["tileId"]]
        ne["note"] = ""
        events.append(ne); cnt["events"] += 1
    addev("Stare (Winlu): " + NAMES[key], ox + (x1 - x0) // 2, oy + (y1 - y0) + 1)
print("old:", cnt)
for key, w, h in newit:
    nx, ny = posN[key]; m = mp["nowe"][key]["id"]
    for pos, tid in m.items():
        i, j = map(int, pos.split(",")); put(2, nx + i, ny + j, tid)
    addev("Nowe (paczka): " + key, nx + (w - 1) // 2, ny + h)
m = {"autoplayBgm": False, "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90}, "autoplayBgs": False, "bgs": {"name": "", "pan": 0, "pitch": 100, "volume": 90},
     "disableDashing": False, "displayName": "Mapa testowa: budynki", "encounterList": [], "encounterStep": 30, "note": "<Clouds:off>\n<Farm:off>", "parallaxLoopX": False, "parallaxLoopY": False,
     "parallaxName": "", "parallaxShow": True, "parallaxSx": 0, "parallaxSy": 0, "scrollType": 0, "specifyBattleback": False, "width": WIDTH, "height": HEIGHT, "tilesetId": 17}
m["data"] = data; m["events"] = events
back = [{"code": 201, "indent": 0, "parameters": [0, 8, 51, 52, 0, 0]}, {"code": 0, "indent": 0, "parameters": []}]
for x in range(WIDTH // 2 - 2, WIDTH // 2 + 2):
    addev("Powrót do Kruczogrodu", x, HEIGHT - 1, lst=back, trigger=1, through=False)
START = (WIDTH // 2, HEIGHT - 3)
os.makedirs(STG, exist_ok=True)
open(os.path.join(STG, "Map%03d.json" % MAPID), "wb").write(W.map_text(m).encode("utf-8"))
json.dump({"start": START, "w": WIDTH, "h": HEIGHT, "posO": posO, "posN": posN}, open(os.path.join(HERE, "uklad_mapy.json"), "w"), indent=1)
mi, lay = W.read_json("data/MapInfos.json")
assert mi[MAPID] is None and len(mi) > MAPID
mi[MAPID] = {"id": MAPID, "expanded": False, "name": "Mapa testowa: budynki", "order": max(x["order"] for x in mi if x) + 1, "parentId": 0, "scrollX": 0, "scrollY": 0}
open(os.path.join(STG, "MapInfos.json"), "wb").write(W.json_text(mi, lay))
base = {"Tilesets.json": W.sha1(os.path.join(ROOT, "data", "Tilesets.json")), "MapInfos.json": W.sha1(os.path.join(ROOT, "data", "MapInfos.json"))}
json.dump(base, open(os.path.join(HERE, "staging", "baza.json"), "w"), indent=1)
print("start", START, "done")
