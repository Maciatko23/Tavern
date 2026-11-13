# -*- coding: utf-8 -*-
"""Szwy nowego Kruczogrodu z sąsiadami (tools/miasto5): pas przy krawędzi, który zmieniła paczka (mur paczki), wraca do stanu sprzed
paczki (../Tawerna_archiwum_2026-11-08/kruczogrod_miasto_20261108_154456), a na sam brzeg idzie kopia nowego muru Winlu z miasta
(te same rzędy bram), tak jak mur przy krawędzi Podgrodzia sprzed paczki:
  dwór 24: rzędy 115-119 <- miasto rzędy 0-4 (brama N x24-26);  Podgrodzie 111: kolumny 118-119 <- miasto 0-1 (bramy y50-51, y106-107);
  Łąka 4: kolumny 0-1 <- miasto 118-119 (bramy y16-17, y48-49; podłoże Łąki zostaje, zestaw 9 ma inne A2);
  Kruczy Jar 3: rzędy 0-2 <- miasto 117-119 (skarpa pod murem i schody bramy S x30-32; podłoże Jaru zostaje).
Zestaw kafli wraca do sprzed paczki, jeśli żaden kafel arkusza E paczki nie został. Zdarzenia paczki w pasie -> te sprzed paczki.
Pisze kopie do tools/miasto5/staging/data.   python tools/miasto5/szwy5.py"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
BAK = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "kruczogrod_miasto_20261108_154456", "data")
STG = os.path.join(HERE, "staging", "data")
town = json.load(open(os.path.join(STG, "Map008.json"), encoding="utf-8")); TD = town["data"]; TW = 120; TN = TW * 120
STRIP = {24: lambda x, y: y >= 104, 111: lambda x, y: x >= 110, 4: lambda x, y: x <= 9, 3: lambda x, y: y <= 9}
# (neighbour cell) <- (town cell)
BAND = {24: [((x, 115 + r), (x, r)) for r in range(5) for x in range(120)],
        111: [((118 + c, y), (c, y)) for c in range(2) for y in range(116)],     # (to the corner tower's foot, row 115: below it
        4: [((c, y), (118 + c, y)) for c in range(2) for y in range(116)],       #  the neighbour's own ground, no cliff stub)
        3: [((x, r), (x, 117 + r)) for r in range(3) for x in range(120)]}
OWN_GROUND = {4, 3}          # tileset 9: other A2 sheet - the neighbour keeps its own A2 ground under the copied wall
kind = lambda v: (v - 2048) // 48 if v >= 2048 else None
is_a2 = lambda v: v and 2816 <= v < 4352
# the north band: where the tavern's roof is the town's edge (A3 in rows 2-4) the manor sees plain wall (town column 8)
def roofed(x): return any(48 <= (kind(TD[y * TW + x]) or 0) < 80 for y in range(2, 5))
BAND[24] = [((x, 115 + r), ((8 if roofed(x) else x), r)) for r in range(5) for x in range(120)]
# the band's cells per map (events must not stand on them / have their sprite over them)
def in_band(mid, x, y, half=0, tall=1):
    if mid == 24: return y >= 115
    if mid == 3: return y <= 3 or (y <= 6 and wallish(D3[y * 120 + x]))      # (the cliff rows 0-2 and its foot row)
    if mid == 111: return x + half >= 118 and y - tall + 1 <= 115      # (a crown reaching up over the corner tower counts too)
    if mid == 4: return x - half <= 1 and y - tall + 1 <= 115
def wallish(v): return bool(v) and (1536 <= v < 2048 or (v >= 2048 and (v - 2048) // 48 >= 48))
from PIL import Image
_fw, _fh = {}, {}
def tall_of(name):
    if name not in _fh:
        p = os.path.join(ROOT, "img", "characters", name + ".png")
        if not name or not os.path.exists(p): _fh[name] = 1
        else:
            h = Image.open(p).size[1]; _fh[name] = max(1, round((h // 4 if "$" in name[:2] else h // 8) / 48))
    return _fh[name]
def half_w(name):
    if name not in _fw:
        p = os.path.join(ROOT, "img", "characters", name + ".png")
        if not name or not os.path.exists(p): _fw[name] = 0
        else:
            w = Image.open(p).size[0]; fw = w // 3 if "$" in name[:2] else w // 12; _fw[name] = max(0, int((fw / 48 - 1) / 2 + 0.5))
    return _fw[name]
D3 = None
for mid in (24, 111, 4, 3):
    cur = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
    bak = json.load(open(os.path.join(BAK, "Map%03d.json" % mid), encoding="utf-8"))
    W, H = cur["width"], cur["height"]; n = W * H; D, B = cur["data"], bak["data"]
    assert (W, H) == (bak["width"], bak["height"]) == (120, 120)
    inside = STRIP[mid]; restored = 0
    for y in range(H):
        for x in range(W):
            if not inside(x, y): continue
            for z in range(6):
                i = z * n + y * W + x
                if D[i] != B[i]: D[i] = B[i]; restored += 1
    touched = set()
    for (x, y), (tx, ty) in BAND[mid]:
        for z in range(6):
            v = TD[z * TN + ty * TW + tx]
            if mid in OWN_GROUND and z in (0, 1) and (is_a2(v) or (z == 0 and v == 0)): continue
            if mid in OWN_GROUND and z == 0 and not v: continue
            D[z * n + y * W + x] = v
        touched.add((x, y))
    # roads up to the gates on the neighbour's side
    A2 = lambda k: 2048 + k * 48
    if mid == 24:                                   # the manor's road (earth, x26-28) bends into the north gate x24-26
        for y in range(109, 115):
            for x in range(24, 29):
                D[y * W + x] = A2(17 if x <= 26 else 16); D[n + y * W + x] = 0; touched.add((x, y))
    if mid == 4:                                    # the meadow paths (overlay 39) through the NE gate (16-17) and from the E2 gate (48-49)
        for y in (16, 17):
            for x in range(0, 7): D[n + y * W + x] = A2(39); touched.add((x, y))
        for x in range(2, 5): D[n + 15 * W + x] = 0; touched.add((x, 15))
        for y in (48, 49):
            for x in range(0, 11): D[n + y * W + x] = A2(39); touched.add((x, y))
    # the copied wall's walkway / corner pockets: blocked (region 2) like in the town, the gate passages stay open
    if mid == 24:
        for x in range(120):
            if not 24 <= x <= 26: D[5 * n + 115 * W + x] = 2; D[5 * n + 116 * W + x] = 2
    if mid == 111:
        for x in (118, 119):
            for y in (0, 1): D[5 * n + y * W + x] = 2
    if mid == 4:
        for x in (0, 1):
            for y in range(116, 120): D[5 * n + y * W + x] = 2
    for z in (0, 1): WS.reshape(cur, z, WS.ring(touched, 1))
    # events: inside the strip as before the pack
    ev_cur = {e["id"]: e for e in cur["events"] if e}; ev_bak = {e["id"]: e for e in bak["events"] if e}
    gone = [i for i, e in ev_cur.items() if inside(e["x"], e["y"]) and (i not in ev_bak or ev_bak[i] != e)]
    back = [i for i, e in ev_bak.items() if inside(e["x"], e["y"]) and ev_cur.get(i) != e]
    for i in gone: cur["events"][i] = None
    for i in back:
        if i >= len(cur["events"]): cur["events"].extend([None] * (i - len(cur["events"]) + 1))
        if cur["events"][i] is not None and not inside(cur["events"][i]["x"], cur["events"][i]["y"]): raise SystemExit("STOP: id %d taken on Map%03d" % (i, mid))
        cur["events"][i] = ev_bak[i]
    while cur["events"] and cur["events"][-1] is None: cur["events"].pop()
    # events off the band: moved away from the wall / cliff to the nearest free cell (nothing else within one cell)
    if mid == 3: D3 = D
    taken = {(e["x"], e["y"]) for e in cur["events"] if e}
    away = {24: (0, -1), 3: (0, 1), 111: (-1, 0), 4: (1, 0)}[mid]
    for e in cur["events"]:
        if not e: continue
        img = e["pages"][0]["image"]["characterName"]
        nature = re.search(r"Pine|Tree|Big_Trees|Bush|Rock|Boulder|Ore|Stump|Log", img or "") or re.search(r"<(Tree|Rock|Bush|Stump|Log)", e["note"])
        if not img or not nature: continue          # (gate pictures, torches, transfers: part of the wall copy, they stay)
        hw, th = half_w(img), tall_of(img)
        if not in_band(mid, e["x"], e["y"], hw, th): continue
        x, y = e["x"], e["y"]; best = None
        for step in range(1, 16):
            nx, ny = x + away[0] * step, y + away[1] * step
            for side in (0, 1, -1, 2, -2):
                cx, cy = (nx, ny + side) if away[0] else (nx + side, ny)
                if not (0 <= cx < W and 0 <= cy < H) or in_band(mid, cx, cy, hw, th) or wallish(D[cy * W + cx]): continue
                if any((cx + i, cy + j) in taken for i in (-1, 0, 1) for j in (-1, 0, 1) if (cx + i, cy + j) != (x, y)): continue
                if any(D[z * n + cy * W + cx] for z in (2, 3)) or D[5 * n + cy * W + cx] == 2: continue
                best = (cx, cy); break
            if best: break
        taken.discard((x, y))
        if best: e["x"], e["y"] = best; taken.add(best); print("   Map%03d #%d %s %s -> %s" % (mid, e["id"], e["name"][:22], (x, y), best))
        else: print("   Map%03d #%d %s %s: brak miejsca - usunięte" % (mid, e["id"], e["name"][:22], (x, y))); cur["events"][e["id"]] = None
    # the tileset: back to the one before the pack when no tile of the pack's E sheet is left (E tiles = ids 768-1023)
    e_left = sum(1 for z in range(4) for i in range(n) if 768 <= D[z * n + i] < 1024 and D[z * n + i] != B[z * n + i])
    ts0 = cur["tilesetId"]
    if e_left == 0: cur["tilesetId"] = bak["tilesetId"]
    open(os.path.join(STG, "Map%03d.json" % mid), "wb").write(WS.map_text(cur).encode("utf-8"))
    print("Map%03d: przywrócone %d wartości, pas muru %d kratek, zdarzenia -%d +%d, zestaw %d -> %d (inne kafle E: %d)"
          % (mid, restored, len(touched), len(gone), len(back), ts0, cur["tilesetId"], e_left))
