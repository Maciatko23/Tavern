# -*- coding: utf-8 -*-
"""Drzwi do wnętrz na mapie 8: kafle B-E na kratce drzwi i 2 kratkach nad nią (warstwy 0-3) - podgląd do wycięcia obrazków drzwi."""
import json, os, sys
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
T = 48
m = json.load(open(os.path.join(ROOT, "data", "Map008.json"), encoding="utf-8")); W, H = m["width"], m["height"]; n = W * H; d = m["data"]
ts = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))[m["tilesetId"]]
sheets = [Image.open(os.path.join(ROOT, "img", "tilesets", nm + ".png")).convert("RGBA") for nm in ts["tilesetNames"][5:9]]
A2 = Image.open(os.path.join(ROOT, "img", "tilesets", ts["tilesetNames"][1] + ".png")).convert("RGBA")
def tile_img(v):
    if 0 < v < 1024:
        s, i = v // 256, v % 256
        sx = (i % 8 + (8 if i >= 128 else 0)) * T; sy = ((i % 128) // 8) * T
        return sheets[s].crop((sx, sy, sx + T, sy + T))
    return None
doors = []
for e in m["events"]:
    if e and any(c["code"] == 201 for pg in e["pages"] for c in pg["list"]) and e["pages"][0]["trigger"] in (0, 1):
        doors.append(e)
out = Image.new("RGBA", (len(doors) * 60, 3 * T + 40), (40, 40, 44, 255)); dr = ImageDraw.Draw(out)
info = []
for k, e in enumerate(doors):
    x, y = e["x"], e["y"]; cols = []
    for j, yy in enumerate((y - 2, y - 1, y)):
        ids = [d[z * n + yy * W + x] for z in range(4)] if 0 <= yy < H else []
        cols.append([v for v in ids if 0 < v < 1024])
        for v in ids:
            ti = tile_img(v)
            if ti: out.alpha_composite(ti, (k * 60, 20 + j * T))
    dr.text((k * 60 + 2, 2), str(e["id"]), fill=(255, 230, 90, 255))
    info.append({"id": e["id"], "x": x, "y": y, "name": e["name"], "pic": e["pages"][0]["image"]["characterName"], "tiles": cols})
out.save(os.path.join(os.path.dirname(__file__), "drzwi_podglad.png"))
json.dump(info, open(os.path.join(os.path.dirname(__file__), "drzwi_spis.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(doors))
