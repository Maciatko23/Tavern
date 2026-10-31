# Sprawdza WSZYSTKIE pary połączonych krawędzi map plenerowych: czy przebieg wody (morza) po obu stronach zgadza się po przesunięciu
# (woda <-> woda, ląd <-> ląd), tak żeby idąc brzegiem gracz wychodził na brzeg (js/plugins/Krawedzie.js: miejsce przybycia =
# pozycja wzdłuż krawędzi + przesunięcie najbliższego przejścia). Pary: zdarzenia przejścia (201) na krawędziach map + EDGES i LINKS
# z js/plugins/Wyspa_Data.js (te wstawia Wyspa.js). Uruchom: python tools/brzeg/pary_krawedzi.py [numery map...] [--wszystko]
import json, sys, os, subprocess, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
MAPY = [8, 24, 111, 125, 22, 20, 21, 13, 120, 175, 23, 168, 3, 4, 17, 18, 162, 165, 155, 157, 159]

def is_water(t): return 2048 <= t < 2816 and not (2048 + 96 <= t < 2048 + 192)
_cache = {}
def mapa(mid):
    if mid not in _cache:
        m = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
        W, H, d = m["width"], m["height"], m["data"]
        wat = [[any(is_water(d[(z * H + y) * W + x]) for z in (0, 1)) for x in range(W)] for y in range(H)]
        _cache[mid] = (W, H, wat)
    return _cache[mid]
def line(mid, side, depth=0):
    W, H, wat = mapa(mid)
    if side == "E": return [wat[y][W - 1 - depth] for y in range(H)]
    if side == "W": return [wat[y][depth] for y in range(H)]
    if side == "N": return [wat[depth][x] for x in range(W)]
    return [wat[H - 1 - depth][x] for x in range(W)]
def side_of(mid, x, y):
    W, H, _ = mapa(mid)
    return "E" if x == W - 1 else "W" if x == 0 else "S" if y == H - 1 else "N" if y == 0 else None

def transfers():
    """(od, strona, komórka(x,y), do, ląd(x,y))"""
    out = []
    for mid in MAPY:
        m = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
        for e in m["events"]:
            if not e: continue
            for pg in e["pages"]:
                for c in pg["list"]:
                    if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] in MAPY:
                        s = side_of(mid, e["x"], e["y"])
                        if s: out.append((mid, s, (e["x"], e["y"]), c["parameters"][1], (c["parameters"][2], c["parameters"][3])))
    js = "global.window={};require(%s);console.log(JSON.stringify({E:window.WyspaData.EDGES,L:window.WyspaData.LINKS}))" % json.dumps(os.path.join(ROOT, "js", "plugins", "Wyspa_Data.js"))
    r = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    try: wd = json.loads(r.stdout)
    except Exception: wd = {"E": [], "L": []}
    for L in wd["L"]:
        if L["from"] in MAPY and L["to"] in MAPY:
            for c, l in zip(L["cells"], L["land"]):
                s = side_of(L["from"], *c)
                if s: out.append((L["from"], s, tuple(c), L["to"], tuple(l)))
    for E in wd["E"]:
        for c, l in zip(E["cells"], E["land"]):
            s = side_of(E["from"], *c)
            if s: out.append((E["from"], s, tuple(c), E["to"], tuple(l)))
    return out

def dest_side(b, l, s):
    """the edge of the target map the landing lies at (the nearest one; the straight opposite wins a tie)"""
    W, H, _ = mapa(b)
    d = {"W": l[0], "E": W - 1 - l[0], "N": l[1], "S": H - 1 - l[1]}
    opp = {"E": "W", "W": "E", "N": "S", "S": "N"}[s]
    return min(d, key=lambda k: (d[k], k != opp))

def pairs():
    """{(od, strona, do): przesunięcie wzdłuż krawędzi} - jedno na parę (najczęstsze)"""
    res = {}
    for (a, s, c, b, l) in transfers():
        if dest_side(b, l, s) != {"E": "W", "W": "E", "N": "S", "S": "N"}[s]: continue   # (a turn: 13 E -> 159 S - compared by hand)
        ax = 1 if s in "EW" else 0
        res.setdefault((a, s, b), []).append(l[ax] - c[ax])
    return {k: max(set(v), key=v.count) for k, v in res.items()}

def runs(flags):
    out, i = [], 0
    while i < len(flags):
        if flags[i]:
            j = i
            while j + 1 < len(flags) and flags[j + 1]: j += 1
            out.append((i, j)); i = j + 1
        else: i += 1
    return out

def porownaj(a, s, b, off, tol=1):
    """lista rozjazdów: pozycje wzdłuż krawędzi a, gdzie woda a != woda b (po przesunięciu), z tolerancją +-tol kratek"""
    la = line(a, s)
    opp = {"E": "W", "W": "E", "N": "S", "S": "N"}[s]
    lb = line(b, opp)
    bad = []
    for p, wa in enumerate(la):
        q = p + off
        if not (0 <= q < len(lb)): continue
        near = [lb[k] for k in range(max(0, q - tol), min(len(lb), q + tol + 1))]
        if wa not in near: bad.append(p)
    return bad

if __name__ == "__main__":
    only = [int(a) for a in sys.argv[1:] if a.isdigit()]
    P = pairs()
    seen = set()
    total = 0
    for (a, s, b), off in sorted(P.items()):
        opp = {"E": "W", "W": "E", "N": "S", "S": "N"}[s]
        if (b, opp, a) in seen or (a, s, b) in seen: continue
        seen.add((a, s, b))
        la, lb = line(a, s), line(b, opp)
        if "--wszystko" not in sys.argv and not (any(la) or any(lb)): continue
        if only and a not in only and b not in only: continue
        bad = porownaj(a, s, b, off)
        total += len(bad)
        print("%3d %s <-> %3d %s  przes. %+d  woda a=%d b=%d  rozjazdy: %d %s" % (a, s, b, opp, off, sum(la), sum(lb), len(bad), runs([i in bad for i in range(len(la))]) if bad else ""))
    print("RAZEM rozjazdów:", total)
