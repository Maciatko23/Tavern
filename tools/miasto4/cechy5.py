# -*- coding: utf-8 -*-
# Cechy nowego Kruczogrodu v2: zwarte jądro (rząd północny przy ulicy głównej, rząd południowy przy alejce), plac ze studnią, warsztaty przy domach,
# ogrody/sady/pola za domami, krawężniki ulic, latarnie w regularnych odstępach, kępy drzew, wypełnione zagrody Błoni (exec w build4.py)
import re


def deco(key, x0, y0, z=2):
    u = UK[key]
    for j, row in enumerate(u["kafle"]):
        for i, t in enumerate(row): L.tile(z, x0 + i, y0 + j, t)
    reserve(x0, y0, u["w"], u["h"], 0)


def garden(x0, y0, w, h, nbeds=None, gate=None, rows=None, fence=38):
    """ogród warzywny: trawa, płot z kłód, grządki (rzędy upraw); gate = kratka bramki w dolnym płocie"""
    x1, y1 = x0 + w - 1, y0 + h - 1
    if any((x, y) in OCC or solid0((x, y)) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)): ERR.append("ogród kolizja %d,%d" % (x0, y0))
    cells = rectc(x0, y0, x1, y1)
    grass(cells, 27)
    edge = {(x, y) for (x, y) in cells if x in (x0, x1) or y in (y0, y1)}
    gx = gate if gate is not None else x0 + w // 2
    edge -= {(gx, y1), (gx + 1, y1)}
    L.kind(1, edge, fence)
    OCC.update(edge)
    nb = nbeds if nbeds is not None else max(1, (w - 2) // 5)
    bx = x0 + 1 + max(0, (w - 2 - nb * 4 - (nb - 1)) // 2)
    nr = rows if rows is not None else ((h - 2) // 4 if h > 6 else 1)
    for k in range(nb):
        for r in range(nr):
            deco("kratki", bx + k * 5, y0 + 1 + r * 4)
    return cells


def green(cx, cy, rx, ry, seed, ntrees=4, bench=True, kinds=("apple", "pear"), flowers=True, tight=1.6):
    cells = {c for c in blobc(cx, cy, rx, ry, seed, 0.3) if c not in OCC and not solid0(c) and 4 <= c[0] <= 115}
    grass(cells, 27)
    r = random.Random(seed)
    cs = sorted(cells)
    pl = []
    cx0, cy0 = cx + r.uniform(-rx / 3, rx / 3), cy + r.uniform(-ry / 3, ry / 3)
    for _ in range(ntrees * 40):
        if len(pl) >= ntrees or not cs: break
        x, y = r.choice(cs)
        if (x - cx0) ** 2 / (rx * 0.6) ** 2 + (y - cy0) ** 2 / (ry * 0.6) ** 2 > 1.2: continue
        if any(abs(x - a) < tight and abs(y - b) < tight for a, b in pl): continue
        if tree(r.choice(kinds), x, y): pl.append((x, y))
    if flowers: L.kind(1, {c for c in cs if r.random() < 0.12 and c not in EVCELL}, 28)
    if bench and cs:
        bx, by = min(cs, key=lambda c: abs(c[0] - cx) + abs(c[1] - cy - 2))
        prop(72, bx, by)
    return cells


def lamp_row(x0, y0, x1, y1, step=8):
    n = max(abs(x1 - x0), abs(y1 - y0))
    for k in range(0, n + 1, step):
        lamp(x0 + (x1 - x0) * k // max(n, 1), y0 + (y1 - y0) * k // max(n, 1))


def curb(cells):
    """niski kamienny krawężnik (A2 rodzaj 32, płyty) wzdłuż ulicy"""
    L.kind(0, {c for c in cells if not solid0(c) and c not in OCC and L.L[0].get(c, ("k", 19)) == ("k", 19)}, 32)


# ------------------------------------------------------------------------------- plac: mały rynek (x50-70, y52-64), 3 skupiska straganów, ławki wokół studni
SQ = (50, 52, 70, 64)
# 3 skupiska: każde z własnym towarem (stare zdarzenia straganów), skrzynie/worki/beczki przy nich, wóz przy jednym
for sid, (x, y) in ((42, (52, 55)), (495, (55, 55)), (496, (65, 55)), (497, (68, 55)), (499, (56, 63)), (46, (59, 63)), (101, (62, 63))):
    mv(sid, x, y); EVCELL.add((x, y))
for tid, x, y in ((100, 50, 56), (98, 57, 56), (99, 51, 55), (75, 64, 56), (98, 70, 56), (99, 66, 56), (100, 54, 56), (100, 55, 64), (99, 64, 63), (98, 61, 64), (100, 58, 64)):
    prop(tid, x, y)
prop(109, 70, 59); prop(26, 52, 63)
for x, y in ((59, 55), (59, 62), (57, 58), (62, 58)): prop(72, x, y)          # ławki wokół studni
for x, y in ((50, 52), (70, 52), (50, 64), (70, 64)): lamp(x, y)
for x, y in ((53, 52), (67, 52)): prop(13, x, y)
prop(56, 61, 52)                                                         # tablica ogłoszeń na północnej krawędzi
# żywopłot wokół placu: dolna i boczne krawędzie (przejścia: W y58-59, E y58-59, S x58-62), północ otwarta na fasady
hedge = {(49, y) for y in range(52, 65) if y not in (58, 59)} | {(71, y) for y in range(52, 65) if y not in (58, 59)} | {(x, 65) for x in range(49, 72) if not 58 <= x <= 62}
hedge = {c for c in hedge if c not in OCC and not solid0(c) and c not in EVCELL}
grass(hedge, 27)
L.kind(1, hedge, 20)
SPLAC = [(52, 53), (56, 53), (62, 53), (66, 53), (69, 53), (52, 60), (55, 60), (64, 60), (67, 60), (53, 62), (66, 62), (68, 62)]
for k, (x, y) in enumerate(SPLAC): SP["plac_%d" % (k + 1)] = (x, y)
for k, c in enumerate(((54, 57), (63, 57), (54, 61), (65, 61), (53, 58), (67, 58))): SP["stragan_%d" % (k + 1)] = c
SP["stragan1"] = (53, 57); SP["stragan2"] = (66, 57); SP["stragan1_obok"] = (54, 58); SP["stragan_kosci"] = (55, 58)
SP["studnia_rynek"] = (58, 59); SP["rynek_srodek"] = (62, 61); SP["rynek_lawka"] = (58, 56); SP["rynek_rog"] = (68, 60); SP["plac_studnia"] = (59, 61)
SP["plac_tablica"] = (62, 53)
SP["schody_rzem"] = (58, 69)


def fr(n, k=0): return front(n, k)


# ------------------------------------------------------------------------------- miejsca przy budynkach
fx, fy = fr("kantor", 1)
SP["kantor_drzwi"] = (fx, fy); SP["kantor_przed"] = (fx - 2, fy + 1); SP["kantor_rog"] = (fx + 2, fy + 1)
fx, fy = fr("ratusz", 0)
SP["ratusz_drzwi"] = (fx, fy); SP["ratusz_przed"] = (fx - 2, fy + 1); SP["ratusz_obok"] = (fx - 1, fy + 1)
for key, n in (("piekarnia_drzwi", "piekarnia"), ("dom_mieszczan", "bronek"), ("dom1_drzwi", "agata"), ("dom2_drzwi", "dom2"), ("dom3_drzwi", "szwaczka"),
               ("dom4_drzwi", "wdowa"), ("dom5_drzwi", "dom5"), ("dom6_drzwi", "ciesla"), ("dom8_drzwi", "weteran"), ("dom9_drzwi", "dom9"), ("dom11_drzwi", "dom11"),
               ("kuznia_dom", "kuznia"), ("garbarz_dom", "garbarz"), ("woziwoda_dom", "woziwoda"), ("straznica_drzwi", "straz")):
    SP[key] = fr(n)
sx, sy = BUILD["dzwonnica"]["drzwi"][0]
SP["dzwonnica"] = (sx - 1, sy)
fx, fy = fr("straz")
SP["straznica_warta"] = (fx + 1, fy + 2)

# ------------------------------------------------------------------------------- warsztaty (otwarte, przy swoich domach, rząd południowy)
yard(21, 72, 30, 79, 17, 22, gaps=[(x, 79) for x in range(24, 28)] + [(21, 77), (21, 78)])
mv(142, 24, 75)
SP["kowadlo"] = (25, 75); SP["ulica_rzem"] = (25, 79)
for x, y in ((22, 73), (23, 73), (28, 77), (29, 77)): prop(100, x, y)
for x, y in ((22, 76), (29, 74)): prop(99, x, y)
prop(26, 27, 73); prop(151, 29, 76); prop(98, 22, 78)
yard(38, 72, 47, 79, 17, 22, gaps=[(x, 79) for x in range(41, 45)] + [(38, 77), (38, 78)])
for x in (40, 42, 44, 46): prop(128 if x % 4 else 131, x, 74)
for x, y in ((40, 77), (43, 76), (45, 77), (46, 76)): prop((125, 126, 127)[(x + y) % 3], x, y)
SP["garbarnia"] = (42, 78)
prop(136, 39, 73); prop(139, 47, 73)
yard(59, 70, 69, 79, 17, 22, gaps=[(x, 79) for x in range(62, 66)] + [(59, 76), (59, 77)])
for x, y in ((61, 72), (63, 72), (67, 72), (68, 74), (61, 74)): prop(151, x, y)
for x, y in ((64, 76), (66, 76), (67, 77)): prop(132, x, y)
prop(100, 68, 78); prop(26, 62, 77)
SP["ciesla_warsztat"] = (64, 77)
yard(100, 39, 112, 48, 17, 22, gaps=[(x, 48) for x in range(100, 113)] + [(100, 46), (100, 47)])
for x, y in ((102, 41), (105, 41)): clone(118, x, y)
clone(220, 109, 41); clone(255, 111, 41); clone(256, 101, 44); clone(138, 106, 40)
clone(122, 109, 46); clone(123, 111, 46)

# ------------------------------------------------------------------------------- ogrody i sady za domami rzędu północnego (y 34-40)
garden(4, 35, 15, 6, nbeds=3, gate=11)
garden(28, 35, 4, 4, nbeds=1, gate=29)
garden(33, 34, 12, 4, nbeds=2, gate=38)
garden(57, 34, 9, 5, nbeds=2, gate=61)
garden(68, 34, 9, 5, nbeds=2, gate=72)
orchard(44, 36, 5, 1.6, 21, 4)
garden(88, 34, 10, 4, nbeds=2, gate=92)
orchard(100, 36, 14, 2.2, 22, 8, sp=1.6)
orchard(96, 12, 12, 6.0, 24, 18, sp=1.5)
orchard(112, 14, 5, 6.0, 25, 7, sp=1.5)
garden(86, 22, 14, 9, nbeds=2, rows=2, gate=92)
garden(103, 22, 13, 9, nbeds=2, rows=2, gate=108)
for x, y in ((88, 33), (90, 33), (92, 33)): prop(156, x, y)
for x, y in ((100, 33), (102, 33)): prop(151, x, y)
prop(100, 104, 33)
green(8, 56, 5, 6, 41, 7)
green(30, 62, 7, 4, 42, 6)

# ------------------------------------------------------------------------------- strefa południowa za alejką (y 84-96): pola, sady, pastwisko
garden(4, 85, 24, 10, nbeds=4, rows=2, gate=14)
garden(36, 86, 14, 9, nbeds=2, rows=2, gate=42)
orchard(58, 90, 7, 4.5, 51, 8, sp=1.6)
garden(68, 86, 14, 9, nbeds=2, rows=2, gate=74)
garden(86, 86, 12, 9, nbeds=2, rows=2, gate=91)
green(106, 90, 8, 5, 52, 7)

# ------------------------------------------------------------------------------- strefa wschodnia i zachodnia wokół placu
garden(79, 54, 12, 7, nbeds=2, rows=1, gate=84)
garden(79, 62, 12, 5, nbeds=2, rows=1, gate=84)
green(104, 58, 9, 6, 53, 8)
green(20, 62, 7, 4, 54, 5)
garden(36, 55, 8, 5, nbeds=1, rows=1, gate=39)
garden(36, 62, 8, 5, nbeds=1, rows=1, gate=39)
SP["skwer"] = (76, 62)
green(76, 66, 4, 2, 55, 3)

# ------------------------------------------------------------------------------- krawężniki, latarnie, ławki
curb({(x, 52) for x in list(range(4, 46)) + list(range(75, 116))})
curb({(45, y) for y in range(34, 48)} | {(56, y) for y in range(34, 48)})
curb({(x, 84) for x in range(4, 116)})
curb({(29, y) for y in range(85, 97)} | {(34, y) for y in range(85, 97)})
curb({(21, y) for y in range(34, 42)} | {(26, y) for y in range(34, 42)})
lamp_row(6, 50, 44, 50, 8)
lamp_row(76, 50, 114, 50, 8)
lamp_row(46, 34, 46, 46, 6)
lamp_row(55, 34, 55, 46, 6)
lamp_row(8, 83, 112, 83, 8)
lamp_row(31, 86, 31, 96, 5)
for x, y in ((8, 52), (18, 52), (38, 52), (78, 52), (88, 52), (98, 52), (108, 52), (14, 83), (30, 83), (46, 83), (62, 83), (78, 83), (94, 83), (47, 45), (54, 45), (47, 38), (54, 38)): prop(72, x, y)
for x, y in ((46, 48), (55, 48), (74, 48), (78, 48)): prop(13, x, y)
for x, y in ((10, 51), (20, 51), (40, 51), (82, 51), (96, 51), (112, 51)): prop(75, x, y)


# ------------------------------------------------------------------------------- Błonia: zagrody wypełnione (pola / pastwisko), nic pustego
def fill_pens():
    cells = {c for c, v in L.L[1].items() if v[0] == "t" and v[1] >= 2048 and (v[1] - 2048) // 48 in (22, 38) and c[1] >= 97}
    seen, comps = set(), []
    for c in sorted(cells):
        if c in seen: continue
        st, cc = [c], [c]; seen.add(c)
        while st:
            x, y = st.pop()
            for n in cells:
                if n not in seen and abs(n[0] - x) <= 6 and abs(n[1] - y) <= 6: seen.add(n); st.append(n); cc.append(n)
        comps.append(cc)
    out = []
    for cc in comps:
        xs = [a for a, b in cc]; ys = [b for a, b in cc]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        if x1 - x0 < 6 or y1 - y0 < 3: continue
        out.append((x0, y0, x1, y1))
    return out


PENS = fill_pens()
evcells = {(e["x"], e["y"]) for e in EV.values()}
for (x0, y0, x1, y1) in PENS:
    inner = {(x, y) for x in range(x0 + 1, x1) for y in range(y0 + 1, y1 + 1) if (x, y) not in evcells}
    inner = {c for c in inner if L.L[0].get(c, ("k", 19)) == ("k", 19) and not any(c in L.L[z] for z in (1, 2, 3))}
    grass(inner, 27)
    w, h = x1 - x0 - 1, y1 - y0
    nb = max(1, (w - 1) // 5)
    if h >= 6:
        bx = x0 + 1 + max(1, (w - nb * 5) // 2)
        for k in range(nb):
            for r in range(max(1, (h - 2) // 4)):
                cells3 = [(bx + k * 5 + i, y0 + 1 + r * 4 + j) for i in range(4) for j in range(3)]
                if all(c in inner and not any(c in L.L[z] for z in (1, 2, 3)) for c in cells3): deco("kratki", bx + k * 5, y0 + 1 + r * 4)
    else:
        L.kind(1, {c for c in inner if (c[0] + c[1]) % 7 == 0}, 28)


# pas Błoni między sosnami: łąka (miękki brzeg), ścieżka do bramy południowej (x 29-34) zostaje brukiem
for (cx, cy, rx, ry, sd) in ((16, 102, 14, 5, 61), (58, 101, 24, 5, 62), (100, 100, 15, 3.5, 63)):
    cells = {c for c in blobc(cx, cy, rx, ry, sd, 0.35) if 98 <= c[1] <= 108 and not (29 <= c[0] <= 34) and L.L[0].get(c, ("k", 19)) == ("k", 19) and not any(c in L.L[z] for z in (2, 3))}
    grass(cells, 27)
    rr = random.Random(sd)
    L.kind(1, {c for c in cells if rr.random() < 0.08 and c not in L.L[1] and c not in evcells}, 28)


# ------------------------------------------------------------------------------- kępy drzew (w grupach, nie po równo)
def grove(cx, cy, n, r, seed, kinds=("apple", "pear", "pear")):
    rr = random.Random(seed)
    pl = []
    for _ in range(n * 50):
        if len(pl) >= n: break
        x, y = int(cx + rr.gauss(0, r)), int(cy + rr.gauss(0, r * 0.7))
        if (x, y) in OCC or (x, y) in EVCELL or not (4 <= x <= 115 and 4 <= y <= 114) or (kept(x, y) and not (x > 79 and y <= 33) and y < 97): continue
        if any(abs(x - a) < 1.5 and abs(y - b) < 1.5 for a, b in pl): continue
        if (x, y) in SPOTCELLS: continue
        if tree(rr.choice(kinds), x, y): pl.append((x, y))


SPOTCELLS = set(SP.values()) | {(d[0] + dx, d[1] + 1 + dy) for n in BUILD for d in BUILD[n]["drzwi"] for dx in (-1, 0, 1) for dy in (0, 1)}
for k, (cx, cy, n) in enumerate(((44, 44, 3), (8, 66, 5), (112, 68, 5), (6, 100, 3), (60, 94, 4))):
    grove(cx, cy, n, 1.8, 100 + k)

# ------------------------------------------------------------------------------- znaczniki "Miejsce: ..." (reszta zostaje tam, gdzie była)
DROP_SPOT = {"dom7_drzwi", "dom10_drzwi", "dom12_drzwi", "dom13_drzwi", "dom14_drzwi"}
DROPPED = []
for i in sorted(STRUCT):
    e = OLD[i]
    if i in EV: continue
    m = re.match(r"Miejsce:\s*(\S+)", e["name"])
    if not m:
        DROPPED.append((i, e["name"], e["x"], e["y"]))
        continue
    key = m.group(1)
    if key in DROP_SPOT: DROPPED.append((i, e["name"], e["x"], e["y"])); continue
    x, y = SP.get(key, (e["x"], e["y"]))
    mv(i, x, y)
