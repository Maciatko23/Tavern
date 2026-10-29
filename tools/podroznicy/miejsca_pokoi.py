# -*- coding: utf-8 -*-
"""Miejsca podróżnych w pokojach gości (Map025, pokoje 4-24) - docs/PODROZNI.md 6.3.

python tools/podroznicy/miejsca_pokoi.py        -> wypisuje tabelę POKOJE dla js/plugins/Podroznicy_Data.js

Dla każdego pokoju z planu karczmy (TavernLife_Plan.js, PLAN_DATA, piętro Map025) szuka kratki, na której da się stać (kafle
przechodnie, podłoże, bez blokującego zdarzenia - tools/mapy/mapylib.py), osiągalnej od drzwi pokoju, jak najbliżej kufra
podróżnego albo świecy (podróżny „u siebie”: przy swoich rzeczach). Kierunek: twarzą do kufra / świecy.
Map025 to mapa gracza - nic tu nie zapisuje; gracz może przesunąć miejsce zdarzeniem „Miejsce: pokoj_<n>”.
"""
import os, re, json, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "mapy"))
import mapylib as M

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))


def plan_floor(map_id):
    src = open(os.path.join(ROOT, "js", "plugins", "TavernLife_Plan.js"), encoding="utf-8").read()
    m = re.search(r"const PLAN_DATA = (\{.*?\});\n", src, re.S)
    data = json.loads(m.group(1))
    return [f for f in data["floors"] if f["map"] == map_id][0]


def main():
    mp = M.Mapa(25)
    floor = plan_floor(25)
    evs = [e for e in json.load(open(os.path.join(ROOT, "data", "Map025.json"), encoding="utf-8"))["events"] if e]
    out = {}
    for room in floor["rooms"]:
        m = re.match(r"^r(\d+)$", room["k"])
        if not m:
            continue
        n = int(m.group(1))
        rects = room["r"]
        cells = [(x, y) for (a, b, c, d) in rects for y in range(b, d + 1) for x in range(a, c + 1)]
        inside = lambda x, y: any(a <= x <= c and b <= y <= d for (a, b, c, d) in rects)
        near = [e for e in evs if inside(e["x"], e["y"]) and re.search(r"Kufer podr|Torba podr|wieca", e["name"])]
        near.sort(key=lambda e: 0 if "Kufer" in e["name"] else 1 if "Torba" in e["name"] else 2)
        target = (near[0]["x"], near[0]["y"]) if near else tuple(room["c"])
        ok = [(x, y) for (x, y) in cells if mp.stoi(x, y)]
        if not ok:
            print("# pokój", n, "- brak kratki", file=sys.stderr)
            continue
        best = min(ok, key=lambda c: (abs(c[0] - target[0]) + abs(c[1] - target[1]), abs(c[0] - room["c"][0]) + abs(c[1] - room["c"][1])))
        dx, dy = target[0] - best[0], target[1] - best[1]
        d = (6 if dx > 0 else 4) if abs(dx) > abs(dy) else (2 if dy > 0 else 8) if dy else 2
        out[n] = (best[0], best[1], d, room.get("sub", ""))
    print("    // (tools/podroznicy/miejsca_pokoi.py) Map025: pokój -> [x, y, kierunek] przy kufrze / świecy")
    for n in sorted(out):
        x, y, d, sub = out[n]
        print("        %d: [%d, %d, %d],   // %s" % (n, x, y, d, sub))


if __name__ == "__main__":
    main()
