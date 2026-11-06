# -*- coding: utf-8 -*-
"""Wspólne drobiazgi narzędzi poprawy krawędzi: mapy świata, składowe spójne, odległość od krawędzi."""
import os, sys, re, json, collections
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import numpy as np
import mapylib as L

LIST = os.path.join(ROOT, "js", "plugins", "Swiat_Data.js")
STG = os.path.join(HERE, "staging")
GRACZ = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}


def mapy_swiata():
    txt = open(LIST, encoding="utf-8").read()
    return sorted(int(k) for k in json.loads(re.search(r"maps: (\{.*?\}),\s*\n\s*links", txt, re.S).group(1)))


def skladowe(maska, osiem=True):
    """[[(x, y)...]] spójne składowe maski bool (H, W)"""
    H, W = maska.shape; seen = np.zeros_like(maska, bool); out = []
    nb = [(dx, dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and (osiem or not (dx and dy))]
    for y in range(H):
        for x in range(W):
            if maska[y, x] and not seen[y, x]:
                st = [(x, y)]; seen[y, x] = True; c = []
                while st:
                    a, b = st.pop(); c.append((a, b))
                    for dx, dy in nb:
                        u, v = a + dx, b + dy
                        if 0 <= u < W and 0 <= v < H and maska[v, u] and not seen[v, u]: seen[v, u] = True; st.append((u, v))
                out.append(c)
    return out


def gleb(W, H, x, y):
    return min(x, y, W - 1 - x, H - 1 - y)
