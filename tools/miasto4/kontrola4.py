# -*- coding: utf-8 -*-
"""Kontrola staged Map008 (miasto4): osiągalność drzwi / miejsc / bram z głównej drogi (przejścia kafli + zdarzenia blokujące), kolizje.   python tools/miasto4/kontrola4.py"""
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/mapy")
import mapylib
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = HERE.replace("\\", "/") + "/staging/"


def mapa():
    ts = json.load(open(STG + "data/Tilesets.json", encoding="utf-8"))
    raw = json.load(open(STG + "data/Map008.json", encoding="utf-8"))
    t = ts[13]
    z = mapylib.Zestaw(11); z.id = 13; z.pliki = t["tilesetNames"]; z.flags = list(t["flags"]) + [0] * (8192 - len(t["flags"]))
    z._sheets = {}; z._tiles = {}; z._alpha = {}; z._bbox = {}
    mapylib.zestaw = lambda i: z
    mp = mapylib.Mapa(8, raw=raw); mp.zest = z
    return mp, raw


def main():
    mp, raw = mapa()
    N = 120
    ev = {e["id"]: e for e in raw["events"] if e}
    start = (51, 40)
    seen = set([start]); st = [start]
    D = [(2, 0, 1), (4, -1, 0), (6, 1, 0), (8, 0, -1)]; rev = {2: 8, 8: 2, 4: 6, 6: 4}
    blockers = set()
    for e in ev.values():
        pg = e["pages"][0]
        if pg["priorityType"] == 1 and not pg["through"] and (pg["image"]["characterName"] or pg["image"].get("tileId")):
            if not e["name"].startswith("Drzwi"): blockers.add((e["x"], e["y"]))
    while st:
        x, y = st.pop()
        for d, dx, dy in D:
            nx, ny = x + dx, y + dy
            if not (0 <= nx < N and 0 <= ny < N) or (nx, ny) in seen or (nx, ny) in blockers: continue
            if not (mp.przechodnia(x, y, d) and mp.przechodnia(nx, ny, rev[d])): continue
            seen.add((nx, ny)); st.append((nx, ny))
    bad = []
    for e in ev.values():
        nm = e["name"]
        if nm.startswith("Miejsce:") or nm.startswith("Drzwi") or nm.startswith("Studnia"):
            x, y = e["x"], e["y"]
            if nm.startswith("Drzwi") or nm.startswith("Studnia"):
                ok = (x, y + 1) in seen or (x - 1, y) in seen or (x + 1, y) in seen or (x, y - 1) in seen
            else:
                ok = (x, y) in seen
            if not ok: bad.append((e["id"], nm, x, y))
    print("osiągalne kratki:", len(seen), " nieosiągalne znaczniki/drzwi:", len(bad))
    for b in bad: print("  ", b)
    # przed drzwiami musi być kratka osiągalna
    for e in ev.values():
        if e["name"].startswith("Drzwi") and (e["x"], e["y"] + 1) not in seen: print("  BRAK dojścia przed drzwiami:", e["id"], e["name"], e["x"], e["y"] + 1)
    # bramy: kratki otwarte przy krawędziach osiągalne
    for nm, cells in (("N", [(x, 5) for x in range(22, 26)]), ("S", [(x, 113) for x in range(30, 34)]), ("W", [(3, y) for y in (50, 51, 105, 106)]), ("E", [(116, y) for y in (11, 12, 49, 50)])):
        print("brama", nm, [c in seen for c in cells])
    return seen


if __name__ == "__main__": main()
