# -*- coding: utf-8 -*-
"""Łaty gruntu bez schodków i prostych boków na mapie GRY (gracz 2026-11-08: „tak” - wygładzić kanciaste ciemne łaty błota z kamieniami
pod południowym murem Kruczogrodu; tools/plansza/gladz.py robi to samo w stagingu planszy). W prostokącie OBSZAR każdy podany rodzaj
A2 (warstwa 0: --l0, warstwa 1: --l1) dostaje brzeg zaokrąglony i lekko falisty: maska rodzaju rozmyta (Gauss) z szumem, próg 0,5.
Nie rusza kratek pod kaflami warstw 2-3 i pod zdarzeniami z obrazkiem; nakładka warstwy 1 rośnie tylko na wolnej warstwie 1 nad
gruntem 16 / 17 / 27, grunt warstwy 0 tylko na trawie 16. Kształty autokafli przeliczone na styku. Edytor zamknięty, blokada zapisów,
kopia do ../Tawerna_archiwum_2026-11-08/gladz_<mapa>_<czas>/.
  python tools/mapy/gladz_laty.py --mapa 8 --obszar 0,103,119,119 --l0 27 --l1 21,31,36,37,39 [--wykonaj]"""
import datetime, json, math, os, shutil, sys
import numpy as np
import cv2
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
MID = int(arg("--mapa"))
X0, Y0, X1, Y1 = map(int, arg("--obszar").split(","))
L0 = [int(v) for v in arg("--l0", "").split(",") if v]
L1 = [int(v) for v in arg("--l1", "").split(",") if v]
DO = "--wykonaj" in sys.argv
SIGMA, AMP, SC = 1.5, 0.22, 4.5
W.need_editor_closed()
p = os.path.join(ROOT, "data", "Map%03d.json" % MID)
m = json.load(open(p, encoding="utf-8")); Wd, Hd = m["width"], m["height"]; n = Wd * Hd
a = np.array(m["data"], dtype=np.int64).reshape(6, Hd, Wd)


def h2(x, y, s):
    v = math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453
    return v - math.floor(v)


nz = np.zeros((Hd, Wd), np.float32)
for y in range(Hd):
    for x in range(Wd):
        fx, fy = x / SC, y / SC; ix, iy = math.floor(fx), math.floor(fy); ax, ay = fx - ix, fy - iy
        ax, ay = ax * ax * (3 - 2 * ax), ay * ay * (3 - 2 * ay)
        q = [h2(ix, iy, MID), h2(ix + 1, iy, MID), h2(ix, iy + 1, MID), h2(ix + 1, iy + 1, MID)]
        nz[y, x] = (q[0] * (1 - ax) + q[1] * ax) * (1 - ay) + (q[2] * (1 - ax) + q[3] * ax) * ay - 0.5
kind = lambda v: (int(v) - 2048) // 48 if 2816 <= v < 4352 else -1
ev = {(e["x"], e["y"]) for e in m["events"] if e and (e["pages"][0]["image"]["characterName"] or e["pages"][0]["image"]["tileId"])}
region = np.zeros((Hd, Wd), bool); region[Y0:Y1 + 1, X0:X1 + 1] = True
changed = {0: set(), 1: set()}
for z, kinds in ((0, L0), (1, L1)):
    for k in kinds:
        cur = np.vectorize(lambda v: kind(v) == k)(a[z]).astype(np.float32)
        if not cur[region].any(): continue
        want = (cv2.GaussianBlur(cur, (0, 0), SIGMA) + AMP * nz * 2) > 0.5
        for y, x in zip(*np.where(region & (want != (cur > 0)))):
            if a[2, y, x] or a[3, y, x] or (x, y) in ev: continue
            k0 = kind(a[0, y, x])
            if z == 0:
                if want[y, x] and k0 == 16: a[0, y, x] = 2048 + k * 48; changed[0].add((int(x), int(y)))
                elif not want[y, x] and k0 == k: a[0, y, x] = 2048 + 16 * 48; changed[0].add((int(x), int(y)))
            else:
                if want[y, x] and not a[1, y, x] and k0 in (16, 17, 27): a[1, y, x] = 2048 + k * 48; changed[1].add((int(x), int(y)))
                elif not want[y, x] and kind(a[1, y, x]) == k: a[1, y, x] = 0; changed[1].add((int(x), int(y)))
print("Map%03d (%d,%d)-(%d,%d): grunt %d kratek, nakładki %d kratek" % (MID, X0, Y0, X1, Y1, len(changed[0]), len(changed[1])))
if not DO: print("(próba - nic nie zmieniono; --wykonaj zapisuje)"); raise SystemExit(0)
W.take_lock("gladz_laty Map%03d" % MID)
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "gladz_%03d_%s" % (MID, datetime.datetime.now().strftime("%Y%m%d_%H%M%S")))
    os.makedirs(bak, exist_ok=True); shutil.copy2(p, bak)
    m = json.load(open(p, encoding="utf-8"))   # (read again just before the change)
    m["data"] = [int(v) for v in a.reshape(-1)]
    for z in (0, 1):
        if changed[z]: W.reshape(m, z, W.ring(changed[z], 1))
    open(p, "wb").write(W.map_text(m).encode("utf-8"))
    print("zapisane (kopia: %s)" % bak)
finally:
    W.drop_lock()
