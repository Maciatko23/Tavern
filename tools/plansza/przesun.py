# -*- coding: utf-8 -*-
"""Krok 1a planszy: każda z 9 map dostaje rozmiar N x N (plansza.py), stara treść przesunięta o (dx, dy) z BOARD, co wychodzi poza
pole - ucięte (sprawdzone: tylko teren i przyroda). Nowe kratki: podstawowy grunt mapy (krok 1b robi na nich prawdziwy teren - ich
spis w staging/nowe_<id>.json). Do kopii próbnej (tools/plansza/staging/data), data/ nietknięte.
  - kafle (6 warstw) i zdarzenia przesunięte; kształty autokafli przeliczone na styku starej i nowej części;
  - zdarzenia przejść do map świata (stare krawędzie, sąsiadki) usunięte - przejścia między mapami planszy robi krok 3 (Krawedzie
    po współrzędnych świata); drzwi do wnętrz zostają;
  - polecenia w zdarzeniach z kratkami tej samej mapy (201 na tę mapę, 203 ustaw zdarzenie wprost) przesunięte;
  - polecenia 201 we WSZYSTKICH mapach i zdarzeniach wspólnych, które prowadzą na mapę planszy, przesunięte (wnętrza -> wyjście
    na dwór trafia w to samo miejsce);
  - spis linii wtyczek i testów z kratkami przesuniętych map (do poprawy w kroku 1c): staging/wspolrzedne.txt.
  python tools/plansza/przesun.py"""
import collections, json, os, re, sys
from plansza import ROOT, N, BOARD, STG, W, read_map
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(STG, "data")
os.makedirs(OUT, exist_ok=True)
uk = {int(k): v for k, v in json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"].items()}
WORLD = set(uk)
log = []


def base_ground(m):
    """the map's commonest plain ground (A2 kind on layer 0 with nothing on layer 1, not water)"""
    Wd, H, t = m["width"], m["height"], m["data"]; n = Wd * H
    c = collections.Counter()
    for i in range(n):
        v0, v1 = t[i], t[n + i]
        if v0 >= 2816 and v0 < 4352 and not v1: c[(v0 - 2048) // 48] += 1
    return c.most_common(1)[0][0] if c else 16


def transfer_targets(e):
    return [c["parameters"][1] for p in e["pages"] for c in p["list"] if c["code"] == 201 and c["parameters"][0] == 0]


changed_other = {}
# (the old seams' copies of a neighbour's wall: kept only where that neighbour still meets the map the same way - Podgrodzie | town)
from kopie import copies
KEEP_PAIRS = {(111, 8), (8, 111)}
revert = {}
for into, partner, cells in copies():
    if into in BOARD and (into, partner) not in KEEP_PAIRS: revert.setdefault(into, {}).update(cells)
for mid, (col, row, dx, dy) in BOARD.items():
    m, raw = read_map(mid)
    if mid in revert:   # the copied cells back to the ground of the cell behind them (as tools/mapy/kopie_murow.py), before the shift
        rc = revert[mid]
        for (x, y), (sx, sy) in rc.items():
            if not (0 <= x < m["width"] and 0 <= y < m["height"]): continue
            g0 = W.at(m, 0, sx, sy)
            W.put(m, 0, x, y, 2048 + W.kind_of(g0) * 48 if g0 >= 2048 else g0)
            for z in (1, 2, 3, 4): W.put(m, z, x, y, 0)
        W.reshape(m, 0, W.ring(rc.keys(), 1))
        m["events"] = [None if (e and (e["x"], e["y"]) in rc) else e for e in m["events"]]
        log.append("Map%03d: kopie murów dawnych sąsiadek cofnięte do gruntu: %d kratek" % (mid, len(rc)))
    Wd, H, old = m["width"], m["height"], m["data"]
    new = [0] * (6 * N * N)
    kept = set()
    for z in range(6):
        for y in range(H):
            ny = y + dy
            if not (0 <= ny < N): continue
            for x in range(Wd):
                nx = x + dx
                if 0 <= nx < N:
                    new[(z * N + ny) * N + nx] = old[(z * H + y) * Wd + x]
                    if z == 0: kept.add((nx, ny))
    fresh = [(x, y) for y in range(N) for x in range(N) if (x, y) not in kept]
    g = base_ground(m) if mid != 8 else 16   # (the town's commonest ground is the street's cobbles - outside its wall: grass)
    for (x, y) in fresh: new[y * N + x] = 2048 + g * 48
    m2 = dict(m); m2["width"], m2["height"], m2["data"] = N, N, new
    near = W.ring(fresh, 1)
    W.reshape(m2, 0, near); W.reshape(m2, 1, near)
    # the events
    gone_out, gone_tr, ev, gone_zap = [], [], [None], 0
    for e in m["events"][1:]:
        if not e: ev.append(None); continue
        nx, ny = e["x"] + dx, e["y"] + dy
        if not (0 <= nx < N and 0 <= ny < N): gone_out.append(e["name"]); ev.append(None); continue
        tg = transfer_targets(e)
        if tg and any(t in WORLD and t != mid for t in tg): gone_tr.append("%s(%d,%d)" % (e["name"][:30], e["x"], e["y"])); ev.append(None); continue
        if "Zapora:krawedz" in (e.get("note") or ""): gone_zap += 1; ev.append(None); continue   # (the old world edges' barriers: stage 3 decides anew)
        e = json.loads(json.dumps(e)); e["x"], e["y"] = nx, ny
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == mid: c["parameters"][2] += dx; c["parameters"][3] += dy
                if c["code"] == 203 and c["parameters"][1] == 0: c["parameters"][2] += dx; c["parameters"][3] += dy
        ev.append(e)
    m2["events"] = ev
    open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(W.map_text(m2).encode("utf-8"))
    json.dump({"map": mid, "dx": dx, "dy": dy, "old": [Wd, H], "ground": g, "fresh": fresh}, open(os.path.join(STG, "nowe_%d.json" % mid), "w"))
    log.append("Map%03d %-22s %3dx%-3d -> %dx%d, przesunięcie (%d,%d), nowych kratek %d (%d%%), grunt %d; ucięte zdarzenia %d, zapory starych krawędzi %d, usunięte przejścia do map świata %d: %s" % (
        mid, m.get("displayName", "")[:22], Wd, H, N, N, dx, dy, len(fresh), 100 * len(fresh) // (N * N), g, len(gone_out), gone_zap, len(gone_tr), ", ".join(gone_tr[:6]) + (" …" if len(gone_tr) > 6 else "")))

# the transfers INTO the shifted maps from every other map and the common events
SHIFT = {m: (dx, dy) for m, (c, r, dx, dy) in BOARD.items() if dx or dy}
def fix_list(lst, where):
    n = 0
    for c in lst:
        if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] in SHIFT:
            dx, dy = SHIFT[c["parameters"][1]]; c["parameters"][2] += dx; c["parameters"][3] += dy; n += 1
    return n
fixes = collections.Counter()
for f in sorted(os.listdir(DATA)):
    mm = re.match(r"Map(\d{3})\.json$", f)
    if not mm or int(mm.group(1)) in BOARD: continue
    raw = open(os.path.join(DATA, f), "rb").read(); m = json.loads(raw.decode("utf-8"))
    n = sum(fix_list(p["list"], f) for e in m["events"] if e for p in e["pages"])
    if n: fixes[f] = n; open(os.path.join(OUT, f), "wb").write(W.map_text(m).encode("utf-8"))
ce_raw = open(os.path.join(DATA, "CommonEvents.json"), "rb").read(); ce = json.loads(ce_raw.decode("utf-8"))
n = sum(fix_list(e["list"], "CE") for e in ce if e)
if n: fixes["CommonEvents.json"] = n; open(os.path.join(OUT, "CommonEvents.json"), "wb").write(W.db_text(ce).encode("utf-8"))
log.append("przejścia do przesuniętych map poprawione: %s" % (", ".join("%s %d" % kv for kv in sorted(fixes.items())) or "-"))

# the census of coordinates in the plugins and tests (step 1c)
rx = re.compile(r"(?:\bmap\s*:\s*|\bmapa\s*:\s*|\bm\s*:\s*|\[\s*|\bgo\(\s*|\bnewGame\(\{\s*map:\s*|mapId\(\)\s*===\s*|\b)(%s)\b" % "|".join(str(m) for m in SHIFT))
lines = []
for d_, pat in (("js/plugins", ".js"), ("tests", ".js")):
    for f in sorted(os.listdir(os.path.join(ROOT, d_))):
        if not f.endswith(pat): continue
        for i, l in enumerate(open(os.path.join(ROOT, d_, f), encoding="utf-8", errors="replace"), 1):
            if re.search(r"(?:\bmap\s*[:=]\s*|\bmapa\s*:\s*|\bm\s*:\s*|\bgo\(\s*|mapId\(\)\s*===\s*|\[\s*|\{\s*|,\s*)(%s)\b[^0-9]" % "|".join(str(m) for m in SHIFT), l) and re.search(r"\d+\s*,\s*\d+", l):
                lines.append("%s/%s:%d: %s" % (d_, f, i, l.strip()[:220]))
open(os.path.join(STG, "wspolrzedne.txt"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
log.append("linie wtyczek / testów do sprawdzenia (kratki przesuniętych map): %d -> staging/wspolrzedne.txt" % len(lines))
print("\n".join(log))
