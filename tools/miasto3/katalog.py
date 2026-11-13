# -*- coding: utf-8 -*-
"""Kruczogród w stylu Fantastic Buildings: Medieval (gracz 2026-11-08: „idziemy w styl tej paczki”, budynki w oryginale). Krok 1:
katalog kawałków arkuszy paczki - każdy spójny kawałek nieprzezroczystych kratek (sąsiedztwo 8, kratka 48 px z co najmniej 2% pikseli
nieprzezroczystych) to kandydat na budynek / rekwizyt; obraz z ramką i numerem do przejrzenia (docs/miasto3/katalog_<arkusz>.png),
spis w tools/miasto3/katalog.json: { arkusz, id, x0, y0, x1, y1 (kratki arkusza, włącznie), w, h, pokrycie }.
  python tools/miasto3/katalog.py"""
import json, os
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PACK = r"C:\Program Files (x86)\Steam\steamapps\common\RPG Maker MZ\dlc\Fantastic Buildings - Medieval\Tilesets"
SHEETS = ["City_TileB", "City_TileC", "City_TileD", "City_TileE", "City_TileE-2", "Rural_TileB", "Rural_TileC", "Rural_TileD", "Rural_TileE"]
T = 48
OUT = os.path.join(ROOT, "docs", "miasto3")
os.makedirs(OUT, exist_ok=True)


def pieces(name):
    a = np.asarray(Image.open(os.path.join(PACK, name + ".png")).convert("RGBA"))[..., 3] > 16
    H, W = a.shape[0] // T, a.shape[1] // T
    occ = np.array([[a[y * T:(y + 1) * T, x * T:(x + 1) * T].mean() >= 0.02 for x in range(W)] for y in range(H)])
    seen = np.zeros_like(occ)
    out = []
    for y in range(H):
        for x in range(W):
            if not occ[y, x] or seen[y, x]: continue
            st = [(x, y)]; seen[y, x] = True; cells = []
            while st:
                cx, cy = st.pop(); cells.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < W and 0 <= ny < H and occ[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; st.append((nx, ny))
            xs, ys = [c[0] for c in cells], [c[1] for c in cells]
            out.append({"x0": min(xs), "y0": min(ys), "x1": max(xs), "y1": max(ys), "n": len(cells)})
    out.sort(key=lambda p: (p["y0"], p["x0"]))
    return out


def main():
    cat = []
    for name in SHEETS:
        im = Image.open(os.path.join(PACK, name + ".png")).convert("RGBA")
        bg = Image.new("RGBA", im.size, (66, 66, 70, 255)); bg.alpha_composite(im)
        d = ImageDraw.Draw(bg)
        for i, p in enumerate(pieces(name)):
            w, h = p["x1"] - p["x0"] + 1, p["y1"] - p["y0"] + 1
            e = {"arkusz": name, "id": "%s_%02d" % (name.replace("_Tile", "").replace("-", ""), i), "x0": p["x0"], "y0": p["y0"], "x1": p["x1"], "y1": p["y1"],
                 "w": w, "h": h, "pokrycie": round(p["n"] / (w * h), 2)}
            cat.append(e)
            d.rectangle([p["x0"] * T + 1, p["y0"] * T + 1, (p["x1"] + 1) * T - 2, (p["y1"] + 1) * T - 2], outline=(255, 60, 60, 255), width=2)
            d.rectangle([p["x0"] * T + 2, p["y0"] * T + 2, p["x0"] * T + 30, p["y0"] * T + 14], fill=(0, 0, 0, 200))
            d.text((p["x0"] * T + 4, p["y0"] * T + 3), str(i), fill=(255, 230, 80, 255))
        bg.convert("RGB").save(os.path.join(OUT, "katalog_%s.png" % name))
    json.dump(cat, open(os.path.join(HERE, "katalog.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("kawałków: %d -> tools/miasto3/katalog.json, obrazy docs/miasto3/katalog_*.png" % len(cat))


if __name__ == "__main__":
    main()
