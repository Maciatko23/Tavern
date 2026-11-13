# -*- coding: utf-8 -*-
"""Kontrola dostępności Map008 (staging): flood fill po przejściach jak w grze (kafle, regiony, zdarzenia blokujące) od traktu/bram;
każde drzwi (zdarzenie z przeniesieniem) ma dojście od strony kratki pod drzwiami, każdy znacznik 'Miejsce:' stoi na kratce osiągalnej.
  python tools/miasto3/kontrola.py"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_pod"))
from mlib import *      # noqa: F401,F403
import rend


def main():
    raw = load(STAGING + "data/Map008.json")
    mp = rend.mz(raw, 8)
    starts = [(51, 40), (25, 5), (31, 114), (117, 11), (117, 49), (1, 51), (1, 105), (51, 35), (51, 60)]
    starts = [s for s in starts if mp.stoi(*s)]
    reach = mp.flood(starts)
    bad = []
    door_n = mark_n = 0
    for e in mp.zd:
        nm = e.raw["name"] if hasattr(e, "raw") else e.name
        tr = [c for pg in e.raw["pages"] for c in pg["list"] if c["code"] == 201] if hasattr(e, "raw") else []
    for e in raw["events"]:
        if not e: continue
        nm = e["name"]
        cm = [c for pg in e["pages"] for c in pg["list"] if c["code"] == 201]
        x, y = e["x"], e["y"]
        if nm.startswith("Miejsce:"):
            mark_n += 1
            if (x, y) not in reach: bad.append(("znacznik", e["id"], nm, x, y))
        elif cm and e["pages"][0]["trigger"] == 1:
            door_n += 1
            # kratka przed drzwiami (south) osiągalna i wejście w drzwi (x,y) możliwe z niej
            front = (x, y + 1)
            if front not in reach: bad.append(("drzwi: kratka przed", e["id"], nm, x, y))
    # wyjście z wnętrza ląduje w kratce przed drzwiami: osiągalne
    print("startów:", starts, "osiągalnych kratek:", len(reach))
    print("drzwi:", door_n, "znaczników:", mark_n, "NIEOSIĄGALNE:", len(bad))
    for b in bad: print("  ", b)
    return bad


if __name__ == "__main__":
    main()
