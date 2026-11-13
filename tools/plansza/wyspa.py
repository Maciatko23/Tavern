# -*- coding: utf-8 -*-
"""Krok 2 planszy - brzeg wyspy (gracz 2026-11-08: „brzegi ładnie równo zaokrąglić”, rysunek: linia ok. 1/5 pola w głąb zewnętrznych
map, łagodnie falista, mocno zaokrąglone narożniki). Na mapach z kopii próbnej (po przesun.py):
  - linia: zaokrąglony kwadrat INSET kratek od krawędzi planszy, promień R, fale +-WAVE wzdłuż obwodu;
  - chronione (budynki, mury, ważne zdarzenia - nie przyroda): brzeg je omija - ląd dookoła nich z zapasem MARGIN, wygładzony (łagodne
    wybrzuszenia, nie schodki);
  - poza linią: morze (A1, ten sam rodzaj co na mapach wybrzeża), kształty przeliczone; zdarzenia przyrody na morzu usunięte,
    notka mapy dostaje <Water:salt> (CzerwonaWoda rysuje pas brzegu i odcień);
  - spis lądu planszy: staging/lad.json (krok 1b robi teren tylko na nowym lądzie), podgląd staging/wyspa_podglad.png.
  python tools/plansza/wyspa.py"""
import json, math, os, re
import numpy as np
import cv2
from PIL import Image
from plansza import ROOT, N, BOARD, STG, W
OUT = os.path.join(STG, "data")
S = 3 * N
INSET, R, WAVE, MARGIN = 22, 36, 4.5, 5
SEA_KIND = 6
NATURE = re.compile(r"^!\$(Pine|Tree|Big_Trees|Bush|Rock|Boulder|Trunk|Stump|Log|Sapling|Fern|Flower|Grass|Mushroom|Reed|Pebble)", re.I)

# ---- the line (the same as tools/mapy/plansza_szkic.py, in board tiles)
def shore_poly():
    a0, a1 = INSET, S - INSET
    side = a1 - a0 - 2 * R
    L = 4 * side + 2 * math.pi * R
    segs = [("l", a0 + R, a0, 1, 0, 0, -1), ("c", a1 - R, a0 + R, -90), ("l", a1, a0 + R, 0, 1, 1, 0), ("c", a1 - R, a1 - R, 0),
            ("l", a1 - R, a1, -1, 0, 0, 1), ("c", a0 + R, a1 - R, 90), ("l", a0, a1 - R, 0, -1, -1, 0), ("c", a0 + R, a0 + R, 180)]
    def at(t):
        for sg in segs:
            n = side if sg[0] == "l" else math.pi * R / 2
            if t <= n:
                if sg[0] == "l": return sg[1] + sg[3] * t, sg[2] + sg[4] * t, sg[5], sg[6]
                ang = math.radians(sg[3]) + t / R
                return sg[1] + R * math.cos(ang), sg[2] + R * math.sin(ang), math.cos(ang), math.sin(ang)
            t -= n
        return at(0)
    pts = []
    for k in range(1440):
        t = L * k / 1440
        x, y, nx, ny = at(t)
        w = WAVE * (0.6 * math.sin(2 * math.pi * t / L * 9 + 0.7) + 0.4 * math.sin(2 * math.pi * t / L * 14 + 2.1))
        pts.append((x + nx * w, y + ny * w))
    return pts

SC = 4   # (the mask drawn 4x finer, then sampled at the tiles' middles: a smooth line)
big = np.zeros((S * SC, S * SC), np.uint8)
cv2.fillPoly(big, [np.array([[int(x * SC), int(y * SC)] for x, y in shore_poly()], np.int32)], 1)

# ---- the protected cells of the board (built tiles and the events that are not nature)
maps = {}
prot = np.zeros((S, S), np.uint8)
for mid, (c, r, dx, dy) in BOARD.items():
    m = json.load(open(os.path.join(OUT, "Map%03d.json" % mid), encoding="utf-8")); maps[mid] = m
    t, n = m["data"], N * N
    ox, oy = c * N, r * N
    for y in range(N):
        for x in range(N):
            i = y * N + x
            if 2048 <= t[i] < 2816: continue   # (on the water - piers, boats: they stay on the water, no land round them)
            if t[2 * n + i] or t[3 * n + i] or t[i] >= 4352 or t[n + i] >= 4352: prot[oy + y, ox + x] = 1
    for e in m["events"]:
        if not e: continue
        pic = e["pages"][0]["image"]["characterName"] or ""
        if NATURE.match(pic) or "Zapora" in (e.get("note") or ""): continue
        if 2048 <= t[e["y"] * N + e["x"]] < 2816: continue
        prot[oy + e["y"], ox + e["x"]] = 1
# (the plugins' places on the board's maps - the bear's den, the spring, the quarry's blocks, camps, spots: staging/miejsca.json from the
# coordinates census, in the new cells - a few cells round each: they are areas, not single cells)
MIEJSCA = os.path.join(STG, "miejsca.json")
if os.path.exists(MIEJSCA):
    for mid, x, y in json.load(open(MIEJSCA)):
        c, r, dx, dy = BOARD[mid]
        X, Y = c * N + x, r * N + y
        prot[max(0, Y - 3):Y + 4, max(0, X - 3):X + 4] = 1
prot[:10, :] = 0; prot[-10:, :] = 0; prot[:, :10] = 0; prot[:, -10:] = 0   # (the old world edges' leftovers at the board's rim: sea anyway)
# land round the protected cells: a disc of MARGIN, the union smoothed (round bulges)
grow = cv2.dilate(prot, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * MARGIN + 1, 2 * MARGIN + 1)))
growbig = cv2.resize(grow, (S * SC, S * SC), interpolation=cv2.INTER_NEAREST)
# (a bulge round what is built is wide and gentle: the land round the protected discs is grown further and blurred broadly, so the
# shore swings out and back in a long arc - never a step or a notch where the bulge meets the even line)
wide = cv2.dilate(grow, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
widebig = cv2.resize(wide, (S * SC, S * SC), interpolation=cv2.INTER_NEAREST).astype(np.float32)
land_big = np.maximum(big.astype(np.float32), cv2.GaussianBlur(widebig, (0, 0), 6 * SC) * 1.15)
land_big = cv2.GaussianBlur(land_big, (0, 0), 3.5 * SC)
land_big = (land_big > 0.5).astype(np.uint8)
land_big = np.maximum(land_big, growbig)   # (the protected discs stay land whatever the blur did)
# (never land on the world's rim: 3-7 cells of sea before the end of the map, the line wavy there too - then smoothed again)
yy, xx = np.mgrid[0:S * SC, 0:S * SC].astype(np.float32) / SC
rimd = np.minimum(np.minimum(xx, S - xx), np.minimum(yy, S - yy))
wob = 5.0 + 2.0 * np.sin(xx / 9.0 + 1.3) * np.cos(yy / 11.0 + 0.4)
land_big[rimd < wob] = 0
land_big = (cv2.GaussianBlur(land_big.astype(np.float32), (0, 0), 2.5 * SC) > 0.5).astype(np.uint8)
land_big = np.maximum(land_big, growbig * (rimd >= 3))
land = land_big[SC // 2::SC, SC // 2::SC][:S, :S]
# no lone cells / one-cell bays: an opening and a closing of the tiles' mask
k3 = np.ones((3, 3), np.uint8)
land = cv2.morphologyEx(cv2.morphologyEx(land, cv2.MORPH_CLOSE, k3), cv2.MORPH_OPEN, k3)
land = np.maximum(land, prot)
# (gracz 2026-11-08: „na dole po prawo, na wystającym cypelku latarnia morska”) the lighthouse cape: a rounded tongue of land out of
# Przystań's south coast - its root wide on the coast, its tip round, a gentle bend; CYPEL in board cells: centre line x, from the coast
# (y0) to the tip (y1), half widths at the root and the tip
CYPEL = {"x": 87, "y0": 326, "y1": 354, "w0": 17, "w1": 11, "bend": 2.5}
for y in range(CYPEL["y0"] - 6, CYPEL["y1"] + 1):
    k = max(0.0, min(1.0, (y - CYPEL["y0"]) / float(CYPEL["y1"] - CYPEL["y0"])))
    hw = CYPEL["w0"] + (CYPEL["w1"] - CYPEL["w0"]) * k
    if y > CYPEL["y1"] - CYPEL["w1"]:   # (the round tip)
        dy = y - (CYPEL["y1"] - CYPEL["w1"]); hw = (CYPEL["w1"] ** 2 - dy ** 2) ** 0.5 if dy < CYPEL["w1"] else 0
    cx = CYPEL["x"] + CYPEL["bend"] * math.sin(k * math.pi)
    for x in range(int(cx - hw - 1), int(cx + hw + 2)):
        if abs(x + 0.5 - cx) <= hw: land[y, x] = 1
land = cv2.morphologyEx(land, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))   # (the cape's root flows into the coast, no notch)
land[:4, :] = 0; land[-4:, :] = 0; land[:, :4] = 0; land[:, -4:] = 0
land[:4, :] = 0; land[-4:, :] = 0; land[:, :4] = 0; land[:, -4:] = 0

# ---- the sea into the maps; the old water INSIDE the island (bays of the old coasts: Garnizon's, the sea under grandpa's yard) becomes
# land - only the harbour keeps its basin (it opens on the new sea), and no ponds anywhere (the drought rule)
KEEP_WATER = {125}
stats = []
lad = {}
for mid, (c, r, dx, dy) in BOARD.items():
    m = maps[mid]; t, n = m["data"], N * N
    ox, oy = c * N, r * N
    if mid not in KEEP_WATER:
        inner = [(x, y) for y in range(N) for x in range(N) if land[oy + y, ox + x] and 2048 <= t[y * N + x] < 2816]
        if inner:
            gk = json.load(open(os.path.join(STG, "nowe_%d.json" % mid)))["ground"]
            innerset = set(inner)
            for (x, y) in inner:
                i = y * N + x
                t[i] = 2048 + gk * 48
                for z in (1, 2, 3): t[z * n + i] = 0
                t[4 * n + i] = 0; t[5 * n + i] = 0
            # (the shore's earth band of the old coast, the piers' and boats' events on the old water: gone with the water)
            boats = 0
            for k, e in enumerate(m["events"]):
                if e and (e["x"], e["y"]) in innerset: m["events"][k] = None; boats += 1
            W.reshape(m, 0, W.ring(inner, 1)); W.reshape(m, 1, W.ring(inner, 1))
            stats.append("Map%03d: dawna woda w środku wyspy -> ląd: %d kratek (zdarzenia na niej: %d)" % (mid, len(inner), boats))
    sea = [(x, y) for y in range(N) for x in range(N) if not land[oy + y, ox + x] and not (2048 <= t[y * N + x] < 2816)]   # (water already there - the harbour's shallows - stays as it is)
    if sea:
        for (x, y) in sea:
            i = y * N + x
            t[i] = 2048 + SEA_KIND * 48
            for z in (1, 2, 3): t[z * n + i] = 0
            t[4 * n + i] = 0; t[5 * n + i] = 0
        W.reshape(m, 0, W.ring(sea, 1)); W.reshape(m, 1, W.ring(sea, 1))
        seaset = set(sea)
        gone = 0
        for k, e in enumerate(m["events"]):
            if e and (e["x"], e["y"]) in seaset: m["events"][k] = None; gone += 1
        if "<Water:salt>" not in (m.get("note") or ""): m["note"] = ((m.get("note") or "").rstrip() + "\n<Water:salt>").lstrip()
    else:
        gone = 0
    lad[mid] = [[x, y] for y in range(N) for x in range(N) if land[oy + y, ox + x]]
    open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(W.map_text(m).encode("utf-8"))
    stats.append("Map%03d: morze %d kratek (%d%%), usunięte zdarzenia przyrody %d" % (mid, len(sea), 100 * len(sea) // n, gone))
json.dump({str(k): v for k, v in lad.items()}, open(os.path.join(STG, "lad.json"), "w"))
# the preview: land green, the protected red, the sea blue, the cells' borders
img = np.zeros((S, S, 3), np.uint8)
img[land == 1] = (90, 160, 80); img[land == 0] = (60, 120, 160); img[prot == 1] = (200, 70, 60)
pv = Image.fromarray(img).resize((S * 3, S * 3), Image.NEAREST)
from PIL import ImageDraw
d = ImageDraw.Draw(pv)
for k in range(1, 3): d.line((k * N * 3, 0, k * N * 3, S * 3), fill=(255, 255, 255)); d.line((0, k * N * 3, S * 3, k * N * 3), fill=(255, 255, 255))
pv.save(os.path.join(STG, "wyspa_podglad.png"))
print("\n".join(stats)); print("ląd planszy: %d%%" % (100 * int(land.sum()) // (S * S)))
