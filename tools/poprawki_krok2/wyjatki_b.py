# -*- coding: utf-8 -*-
"""Dopisuje do tools/mapy/estetyka_wyjatki.json pozostale trafienia testu b, ktore leza w chronionej okolicy (krok 2 ich nie rusza)."""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
os.chdir(ROOT); sys.path.insert(0, HERE)
import zaokraglij as Z
OCHR = {3: [(40, 32, 79, 61)]}
def powod(mm, mid, x, y):
    m, last = mm; W, H = m["width"], m["height"]; n = W * H; D = m["data"]
    def T(z, xx, yy): return D[z * n + yy * W + xx] if 0 <= xx < W and 0 <= yy < H else 0
    c = []
    sl = lambda a: a[max(0, y - 1):y + 2, max(0, x - 1):x + 2].any()
    ks = set()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            t1 = T(1, x + dx, y + dy); k1 = (t1 - 2048) // 48 if t1 >= 2048 else None
            if k1 is not None: ks.add(k1)
            if any(T(z, x + dx, y + dy) and T(z, x + dx, y + dy) < 2048 for z in (2, 3)): ks.add("b")
    if 47 in ks: c.append("obok kafla klifu/skały (wzgórze zostaje)")
    if ks & {22, 30, 38, 23}: c.append("wzdłuż płotu/muru")
    if ks & {36, 37, 39}: c.append("przy drodze/bruku z nakładki")
    if ks & {17, 24, 25, 26, 27}: c.append("pod nakładką gruntu warstwy 1")
    if "b" in ks: c.append("pod/obok kafla konstrukcji (zagon z kwiatami, płot, dach)")
    if sl(last["water"]): c.append("w pasie brzegu wody (3 kratki)")
    if sl(last["ev"]): c.append("pod zdarzeniem budynku/płotu/bramy")
    if x < 5 or y < 5 or x > W - 6 or y > H - 6: c.append("przy krawędzi mapy")
    if mid == 3 and 40 <= x <= 79 and 32 <= y <= 61: c.append("działka dziadka")
    t0 = [(T(0, x + dx, y + dy) - 2048) // 48 for dx in (-1, 0, 1) for dy in (-1, 0, 1) if T(0, x + dx, y + dy) >= 2048]
    if any(k not in Z.NAT for k in t0): c.append("przy bruku/murze/podłodze (inny grunt)")
    return "Krok 2: pozostawione celowo - " + ("; ".join(c) if c else "chroniona okolica") + "; zmiana gruntu tu naruszyłaby ten element"


out = subprocess.run([sys.executable, "tools/mapy/estetyka.py", "162", "24", "13", "111", "4", "125", "3", "20", "--test", "b", "--lista", "--staging", "tools/poprawki_krok2/staging"], capture_output=True, text=True, encoding="utf-8").stdout
P = "tools/mapy/estetyka_wyjatki.json"
ex = json.load(open(P, encoding="utf-8")); have = {(e["mapa"], e["x"], e["y"], e["sprawdzenie"]) for e in ex}
nfc = {}; m_by = {}; added = 0
for l in out.splitlines():
    mm = re.match(r"\s+b Map(\d+) \((\d+),(\d+)\)", l)
    if not mm or "[wyjątek" in l: continue
    mid, x, y = map(int, mm.groups())
    if mid not in nfc:
        m = json.load(open("tools/poprawki_krok2/staging/data/Map%03d.json" % mid, encoding="utf-8"))
        nfc[mid] = Z.ochronione(m, mid, OCHR.get(mid, ()))[2]; m_by[mid] = (m, dict(Z.ochronione.last))
    if not nfc[mid][y, x] or (mid, x, y, "b") in have: continue
    ex.append({"mapa": mid, "x": x, "y": y, "sprawdzenie": "b", "powod": powod(m_by[mid], mid, x, y)})
    added += 1
raw = json.dumps(ex, ensure_ascii=False, indent=1)
open(P, "wb").write(raw.replace("\r\n", "\n").encode("utf-8"))
print("dopisano", added)
