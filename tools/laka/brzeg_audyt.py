# -*- coding: utf-8 -*-
"""Które mapy mają wodę, a nie mają zaokrąglonego brzegu (CzerwonaWoda.js BRZEG_MAPS; 2026-11-05, gracz: „kanciaste wybrzeże, mapa Leśna droga - czy inne mapy mają podobnie?”).
Wypisuje mapy i zapisuje tools/laka/brzegi.json: [mapa, x, y] - środek kadru 27 x 15 z najdłuższą linią brzegu."""
import json, glob, re, os
import numpy as np
try:
    import sys; sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
src = open("js/plugins/CzerwonaWoda.js", encoding="utf-8").read()
BRZEG = set(map(int, re.search(r"BRZEG_MAPS = \[([^\]]*)\]", src).group(1).replace(" ", "").split(",")))
infos = {m["id"]: m for m in json.load(open("data/MapInfos.json", encoding="utf-8")) if m}
tss = json.load(open("data/Tilesets.json", encoding="utf-8"))
out, brak, ok = [], [], []
for f in sorted(glob.glob("data/Map[0-9][0-9][0-9].json")):
    mid = int(os.path.basename(f)[3:6])
    m = json.load(open(f, encoding="utf-8"))
    if m["tilesetId"] not in (9, 11) or mid == 101: continue
    W, H, d = m["width"], m["height"], m["data"]
    # woda: A1 na warstwie 0 lub 1 (2048-2815; 2048-2815 to rodzaje 0-15 arkusza A1)
    wod = np.zeros((H, W), dtype=np.uint8)
    for y in range(H):
        for x in range(W):
            if 2048 <= d[y * W + x] < 2816 or 2048 <= d[W * H + y * W + x] < 2816: wod[y, x] = 1
    n = int(wod.sum())
    if not n: continue
    # brzeg: kratka wody obok kratki lądu
    br = np.zeros((H, W), dtype=np.uint8)
    br[:-1, :] |= wod[:-1, :] & (1 - wod[1:, :]); br[1:, :] |= wod[1:, :] & (1 - wod[:-1, :])
    br[:, :-1] |= wod[:, :-1] & (1 - wod[:, 1:]); br[:, 1:] |= wod[:, 1:] & (1 - wod[:, :-1])
    salt = bool(re.search(r"<Water:\s*salt\s*>", m.get("note") or "", re.I))
    row = (mid, infos.get(mid, {}).get("name", "?"), n, int(br.sum()), salt, mid in BRZEG)
    (ok if mid in BRZEG else brak).append(row)
    if mid not in BRZEG and br.sum():
        I = np.zeros((H + 1, W + 1), dtype=int); I[1:, 1:] = br.cumsum(0).cumsum(1)
        bw, bh = min(27, W), min(15, H); best, bx, by = -1, 0, 0
        for y in range(0, H - bh + 1):
            for x in range(0, W - bw + 1):
                v = I[y + bh, x + bw] - I[y, x + bw] - I[y + bh, x] + I[y, x]
                if v > best: best, bx, by = v, x, y
        out.append([mid, int(bx + bw // 2), int(by + bh // 2)])
print("BEZ zaokrąglonego brzegu:")
for r in brak: print("  Map%03d %-30s woda %5d, linia brzegu %4d, sól %s" % (r[0], r[1][:30], r[2], r[3], "tak" if r[4] else "NIE"))
print("Z zaokrąglonym brzegiem:", ", ".join("%d %s" % (r[0], r[1]) for r in ok))
json.dump(out, open("tools/laka/brzegi.json", "w"))
