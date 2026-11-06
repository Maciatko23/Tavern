# -*- coding: utf-8 -*-
"""Orle miejsca znów tylko z orła (2026-11-03): pas gęstych liści, który je odcinał na Map125 (Przystań, „Skrytka w gąszczu”, „Stare gniazdo”)
i Map168 (Spalona zagroda, „Skarpa nad zagrodą”), zniknął 2026-11-01 (gracz: „te gęste liście, które blokują ruch, wywal ze wszystkich map”) -
zakon_test: „dostępne pieszo (ma być tylko z orła)”. Zamiast liści: mała kwadratowa skarpa (A5 zestawu 11, jak wzgórza gracza na mapie A:
krawędź dookoła, dwa rzędy ściany od dołu), na niej orle miejsce, jego rzeczy i zejście (Zakon_Data.js EAGLE: rzeczy i zejścia przeniesione
na skarpę; zejście po ścianie w dół albo tylną stroną).
  python tools/orle_skarpy/zbuduj.py --dry-run    (domyślnie: staging tools/orle_skarpy/staging, sprawdzenie dojść, obrazki docs/orle_skarpy/)
  python tools/orle_skarpy/zbuduj.py --wykonaj    (edytor zamknięty! kopie zapasowe tools/orle_skarpy/kopie_zapasowe/<czas>)
W mapach zmieniają się tylko liczby kafli w prostokątach skarp (warstwy 0-4; regiony bez zmian), zdarzenia i reszta pliku bajt w bajt te same."""
import os, sys, re, json, hashlib, datetime, shutil
from collections import deque

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
sys.path.insert(0, os.path.join(ROOT, "tools", "za_wzgorzem"))
import mapylib as ml
import maluj
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

A5 = 1536
# rzędy skarpy (numery w arkuszu A5): góra krawędzi, środek, dół krawędzi, ściana 1, ściana 2 - (lewy, środek, prawy)
RZEDY = {"gora": (88, 89, 90), "srodek": (96, 97, 98), "dol": (104, 105, 106), "sciana1": (112, 113, 114), "sciana2": (120, 121, 122)}
# skarpa: mapa, prostokąt szczytu z krawędzią (x0, y0, x1, y1; pod y1 dwa rzędy ściany), orle miejsce (klucz), wejście mapy (Okolice_Data ENTRY)
SKARPY = [
    {"map": 168, "rect": (50, 24, 55, 28), "key": "orzel_168", "entry": (25, 17)},
    {"map": 125, "rect": (104, 29, 109, 34), "key": "orzel_125_b", "entry": (27, 20)},
    {"map": 125, "rect": (96, 44, 101, 49), "key": "orzel_125_a", "entry": (27, 20)},
]
# Zakon_Data.js: rzeczy i zejścia na skarpę (stary tekst -> nowy)
ZAKON = [
    ('down: { id: 2782, at: [81, 63], to: [81, 68], dir: 2 },', 'down: { id: 2782, at: [99, 49], to: [99, 52], dir: 2 },   // (2026-11-03: na skarpie - dawniej korytarz w liściach do 81,63)'),
    ('things: [{ id: 2780, kind: "stash", x: 95, y: 48 }, { id: 2781, kind: "warzucha", x: 101, y: 46 }] },', 'things: [{ id: 2780, kind: "stash", x: 97, y: 48 }, { id: 2781, kind: "warzucha", x: 101, y: 46 }] },'),
    ('down: { id: 2784, at: [109, 24], to: [109, 21], dir: 8 },', 'down: { id: 2784, at: [108, 34], to: [108, 37], dir: 2 },   // (2026-11-03: po ścianie skarpy w dół)'),
    ('things: [{ id: 2783, kind: "nest", x: 103, y: 36, feathers: 3 }] },', 'things: [{ id: 2783, kind: "nest", x: 104, y: 33, feathers: 3 }] },'),
]
ZAKON_PLIK = os.path.join(ROOT, "js", "plugins", "Zakon_Data.js")
PRZED = {"Map125.json": "f9221589b469f0d9", "Map168.json": "a6ac69edd4ea57bc", "Zakon_Data.js": "bbc4730a5fad2eec"}


def sha(b): return hashlib.sha256(b).hexdigest()


def kafle(rect):
    """{(x, y): [warstwy 0-4]} skarpy: szczyt z krawędzią + dwa rzędy ściany"""
    x0, y0, x1, y1 = rect
    out = {}
    for y in range(y0, y1 + 3):
        rz = "gora" if y == y0 else "dol" if y == y1 else "sciana1" if y == y1 + 1 else "sciana2" if y == y1 + 2 else "srodek"
        for x in range(x0, x1 + 1):
            k = 0 if x == x0 else 2 if x == x1 else 1
            out[(x, y)] = [A5 + RZEDY[rz][k], 0, 0, 0, 0]
    return out


def zakon_dane(src):
    """EAGLE z Zakon_Data.js (tekst JS -> json) dla kluczy skarp"""
    out = {}
    for s in SKARPY:
        m = re.search(r'\{ key: "%s".*?things: \[(.*?)\] \}' % s["key"], src, re.S)
        blk = m.group(0)
        seed = tuple(map(int, re.search(r"seed: \[(\d+), (\d+)\]", blk).groups()))
        at = tuple(map(int, re.search(r"at: \[(\d+), (\d+)\]", blk).groups()))
        to = tuple(map(int, re.search(r"to: \[(\d+), (\d+)\]", blk).groups()))
        things = [tuple(map(int, t)) for t in re.findall(r"x: (\d+), y: (\d+)", m.group(1))]
        x, y, w, h = map(int, re.search(r"x: (\d+), y: (\d+), w: (\d+), h: (\d+)", blk).groups())
        out[s["key"]] = {"seed": seed, "at": at, "to": to, "things": things, "place": [(x + i, y + j) for i in range(w) for j in range(h)]}
    return out


def zapisz_kafle(b, W, H, zmiany):
    i = b.find(b'"data":[') + 8
    j = b.find(b"]", i)
    vals = b[i:j].split(b",")
    assert len(vals) == 6 * W * H
    for (x, y), warstwy in zmiany.items():
        for z, t in enumerate(warstwy): vals[(z * H + y) * W + x] = str(t).encode()
    return b[:i] + b",".join(vals) + b[j:]


def kawalek(r, start):
    seen = {start}; q = deque([start])
    while q:
        c = q.popleft()
        for d in (2, 4, 6, 8):
            s = r.krok(c[0], c[1], d)
            if s and s not in seen: seen.add(s); q.append(s)
    return seen


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    os.makedirs(os.path.join(STG, "data"), exist_ok=True); os.makedirs(os.path.join(STG, "js", "plugins"), exist_ok=True)
    stop = False
    for plik, przed in PRZED.items():
        p = ZAKON_PLIK if plik.endswith(".js") else os.path.join(ROOT, "data", plik)
        if sha(open(p, "rb").read())[:16] != przed: print("STOP %s: zmieniony od przygotowania (inna sesja?)" % plik); stop = True
    if stop: sys.exit("nic nie zapisano")
    # Zakon_Data.js
    zsrc = open(ZAKON_PLIK, "rb").read().decode("utf-8")
    nowy_z = zsrc
    for old, new in ZAKON:
        assert nowy_z.count(old) == 1, old
        nowy_z = nowy_z.replace(old, new)
    open(os.path.join(STG, "js", "plugins", "Zakon_Data.js"), "wb").write(nowy_z.encode("utf-8"))
    orly = zakon_dane(nowy_z)
    # mapy
    nowe = {}
    for mid in sorted({s["map"] for s in SKARPY}):
        p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        b = open(p, "rb").read()
        raw = json.loads(b.decode("utf-8"))
        zm = {}
        for s in SKARPY:
            if s["map"] == mid: zm.update(kafle(s["rect"]))
        nb = zapisz_kafle(b, raw["width"], raw["height"], zm)
        open(os.path.join(STG, "data", "Map%03d.json" % mid), "wb").write(nb)
        nowe[mid] = (p, b, nb)
    # sprawdzenie: miejsce, rzeczy i zejście w kawałku od ziarna, nie pieszo od wejścia; dół zejścia pieszo; żadne zdarzenie na krawędzi/ścianie
    ok = True
    for s in SKARPY:
        mid = s["map"]
        mp = ml.Mapa(mid, path=os.path.join(STG, "data", "Map%03d.json" % mid))
        r = maluj.Ruch(mp, {})
        o = orly[s["key"]]
        wej = kawalek(r, s["entry"]); od_ziarna = kawalek(r, o["seed"])
        cele = o["place"] + o["things"] + [o["at"]]
        zle = [c for c in cele if c in wej]
        poza = [c for c in cele if c not in od_ziarna]
        dol = o["to"] in wej
        x0, y0, x1, y1 = s["rect"]
        na_skarpie = [(e.id, e.name, e.x, e.y) for e in mp.zd if e.blokuje and x0 <= e.x <= x1 and y0 <= e.y <= y1 + 2]
        good = not zle and not poza and dol and not na_skarpie
        ok = ok and good
        print("Map%03d %-12s skarpa %s: %s; od wejścia pieszo %d kratek, kawałek orła %d; pieszo do miejsca/rzeczy/zejścia: %s; poza kawałkiem orła: %s; dół zejścia %s pieszo: %s; zdarzenia na skarpie: %s" % (
            mid, s["key"], s["rect"], "OK" if good else "ŹLE", len(wej), len(od_ziarna), zle or "nic", poza or "nic", o["to"], "tak" if dol else "NIE", na_skarpie or "brak"))
        # obrazki przed / po
        os.makedirs(os.path.join(ROOT, "docs", "orle_skarpy"), exist_ok=True)
        reg = (max(0, x0 - 7), max(0, y0 - 7), min(mp.W - 1, x1 + 7), min(mp.H - 1, y1 + 8))
        marks = [(x, y, (255, 200, 0), "M") for (x, y) in [o["seed"]]] + [(x, y, (255, 200, 0), "r") for (x, y) in o["things"]] + [(o["at"][0], o["at"][1], (255, 120, 0), "Z"), (o["to"][0], o["to"][1], (90, 200, 255), "D")]
        stara = ml.Mapa(mid)
        ml.render(stara, region=reg).convert("RGB").save(os.path.join(ROOT, "docs", "orle_skarpy", "%s_przed.png" % s["key"]))
        ml.render(mp, region=reg, marks=marks).convert("RGB").save(os.path.join(ROOT, "docs", "orle_skarpy", "%s_po.png" % s["key"]))
    print("\nobrazki: docs/orle_skarpy/<klucz>_przed.png / _po.png (M miejsce, r rzeczy, Z zejście, D dół zejścia)")
    if not ok: sys.exit("coś się nie zgadza - nic nie zapisano")
    if not wykonaj:
        print("(dry-run: nic nie zapisano w grze; przy zamkniętym edytorze: python tools/orle_skarpy/zbuduj.py --wykonaj)")
        return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(os.path.join(kop, "data"), exist_ok=True); os.makedirs(os.path.join(kop, "js", "plugins"), exist_ok=True)
    for mid, (p, b, nb) in nowe.items():
        open(os.path.join(kop, "data", os.path.basename(p)), "wb").write(b)
        open(p, "wb").write(nb)
        print("Map%03d.json  sha256 %s -> %s" % (mid, sha(b)[:16], sha(nb)[:16]))
    open(os.path.join(kop, "js", "plugins", "Zakon_Data.js"), "wb").write(zsrc.encode("utf-8"))
    open(ZAKON_PLIK, "wb").write(nowy_z.encode("utf-8"))
    print("Zakon_Data.js sha256 %s -> %s" % (sha(zsrc.encode("utf-8"))[:16], sha(nowy_z.encode("utf-8"))[:16]))
    print("zapisano; kopie zapasowe:", kop)


if __name__ == "__main__":
    main()
