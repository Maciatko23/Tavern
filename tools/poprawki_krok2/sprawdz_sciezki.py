# -*- coding: utf-8 -*-
"""Kontrola drog (ziemia 17) po kroku 2: 0 rozerwanych plam, 0 usunietych kratek cienkich czesci.
   python tools/poprawki_krok2/sprawdz_sciezki.py [Map008_bez_kroku10.json]"""
import json, os, sys
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
os.chdir(ROOT); sys.path.insert(0, HERE)
import zaokraglij as Z
def k17(path, mid):
    m = json.load(open(path, encoding="utf-8")); W, H = m["width"], m["height"]
    a = np.array(m["data"][:W * H]).reshape(H, W); K = np.where(a >= 2048, (a - 2048) // 48, -1)
    return K
bad_tot = thin_tot = 0
for mid in (162, 24, 13, 111, 8, 4, 125, 3, 20):
    base = sys.argv[1] if (mid == 8 and len(sys.argv) > 1) else "data/Map%03d.json" % mid
    K0 = k17(base, mid); K1 = k17(os.path.join(HERE, "staging", "data", "Map%03d.json" % mid), mid)
    keep = Z.keep_mask(K0)
    m0 = (K0 == 17).astype(np.uint8); m1 = (K1 == 17).astype(np.uint8)
    nl0, lab0, st0, _ = cv2.connectedComponentsWithStats(m0, connectivity=4)
    nl1, lab1 = cv2.connectedComponents(m1, connectivity=4)
    broken = 0; comps = 0
    for i in range(1, nl0):
        if Z.is_stray(st0[i]): continue
        comps += 1
        kept = (lab0 == i) & (K1 == 17)
        if len(set(np.unique(lab1[kept]).tolist())) > 1: broken += 1
    thin = int((keep & (K1 != 17)).sum())
    bad_tot += broken; thin_tot += thin
    print("Map%03d: plam ziemi (bez pojedynczych kratek/paskow): %d, rozerwanych %d, usunietych kratek cienkich czesci %d (kratek 17: %d -> %d)" % (mid, comps, broken, thin, int(m0.sum()), int(m1.sum())))
print("RAZEM: rozerwane %d, usuniete cienkie %d" % (bad_tot, thin_tot))
