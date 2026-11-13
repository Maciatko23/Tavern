# -*- coding: utf-8 -*-
"""Tileset 17 'Proba: Winlu + Fantastic Buildings': builds img/tilesets/Kruczogrod/Proba_D.png, the tile map (mapping.json) and the staged Tilesets.json."""
import os, sys, json, hashlib
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, HERE)
import wspolne as W
from pack import pack
from rects import OLD
sys.stdout.reconfigure(encoding="utf-8")
STG = os.path.join(HERE, "staging")
NEW_PIECES = ["dom_wieza", "dom_waski", "dom_kwiaty", "chata_bale", "stajnia", "dom_szachulec", "chata_b", "chata_c", "izba"]
U = json.load(open(os.path.join(ROOT, "tools", "miasto3", "uklad.json"), encoding="utf-8"))
ts, lay = W.read_json("data/Tilesets.json")
assert len(ts) == 17, "Tilesets.json: unexpected length"
t11, t13 = ts[11], ts[13]
SHEET0 = {"B": 0, "C": 256, "D": 512, "E": 768}
def cell(n):   # sheet-local tile number -> (col,row) on the 16x16 image
    half = n // 128; return (n % 8 + 8 * half, (n % 128) // 8)
def num(col, row):  # inverse
    half = col // 8; return half * 128 + row * 8 + (col % 8)
src = {k: Image.open(os.path.join(ROOT, "img", "tilesets", "Kruczogrod", "Miasto_%s.png" % k)).convert("RGBA") for k in "BCDE"}
wd = Image.open(os.path.join(ROOT, "img", "tilesets", t11["tilesetNames"][7] + ".png")).convert("RGBA")
# which Winlu D tiles the chosen old buildings use
old = json.load(open(r"C:\Users\macie\OneDrive\Dokumenty\RMMZ\Tawerna_archiwum_2026-11-08\kruczogrod_miasto_20261108_154456\data\Map008.json", encoding="utf-8"))
OW = old["width"]; OH = old["height"]; od = old["data"]
dtiles = set()
for n, (x0, y0, x1, y1) in OLD.items():
    for z in range(4):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                t = od[(z * OH + y) * OW + x]
                if 512 <= t < 768: dtiles.add(t - 512)
dtiles = sorted(dtiles)
TRIM = {"chata_bale": 4}   # sheet bbox included a neighbour piece in the last column
items = {k: (TRIM.get(k, U[k]["w"]), U[k]["h"]) for k in NEW_PIECES}
res = pack(items, seed=1, tries=4000)
assert res, "no packing"
used = [[[0] * 8 for _ in range(16)] for _ in range(2)]
for k, (b, x, y) in res.items():
    for j in range(items[k][1]):
        for i in range(items[k][0]): used[b][y + j][x + i] = 1
free = [(b, x, y) for b in range(2) for y in range(16) for x in range(8) if not used[b][y][x]]
assert len(free) >= len(dtiles), "no room for the Winlu D tiles"
sheet = Image.new("RGBA", (768, 768), (0, 0, 0, 0))
flags = list(t11["flags"]); flags[512:768] = [0] * 256
mapping = {"nowe": {}, "d": {}}
def paste(img, scol, srow, dcol, drow):
    sheet.paste(img.crop((scol * 48, srow * 48, scol * 48 + 48, srow * 48 + 48)), (dcol * 48, drow * 48))
for k, (b, px, py) in res.items():
    kaf = U[k]["kafle"]; m = {}
    for j, row in enumerate(kaf):
        for i, t in enumerate(row):
            if i >= items[k][0]: continue
            dcol, drow = b * 8 + px + i, py + j
            newid = 512 + num(dcol, drow)
            if t == 0: continue
            sh = "BCDE"[t // 256]; n = t % 256; scol, srow = cell(n)
            paste(src[sh], scol, srow, dcol, drow)
            flags[newid] = t13["flags"][t]
            m["%d,%d" % (i, j)] = newid
    mapping["nowe"][k] = {"id": m, "w": items[k][0], "h": items[k][1], "drzwi": U[k]["drzwi"], "opis": U[k]["opis"]}
for t, (b, x, y) in zip(dtiles, free):
    scol, srow = cell(t); dcol, drow = b * 8 + x, y
    paste(wd, scol, srow, dcol, drow)
    newid = 512 + num(dcol, drow); flags[newid] = t11["flags"][512 + t]; mapping["d"][str(512 + t)] = newid
out = os.path.join(ROOT, "img", "tilesets", "Kruczogrod", "Proba_D.png")
sheet.save(out)
json.dump(mapping, open(os.path.join(HERE, "mapping.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
names = list(t11["tilesetNames"]); names[7] = "Kruczogrod/Proba_D"
new = {"id": 17, "flags": flags, "mode": 1, "name": "Próba: Winlu + Fantastic Buildings", "note": "Zestaw próbny: budynki Winlu (A3/A4, B, C, E) + 9 budynków paczki Fantastic Buildings na arkuszu D (Proba_D.png) + 21 kafli Winlu D. Do porównania w edytorze.", "tilesetNames": names}
ts2 = ts + [new]
os.makedirs(os.path.join(STG, "data"), exist_ok=True)
open(os.path.join(STG, "data", "Tilesets.json"), "wb").write(W.db_text(ts2).encode("utf-8"))
print("packed", {k: res[k] for k in res}, "D tiles", len(dtiles), "free", len(free))
