# -*- coding: utf-8 -*-
"""Kruczogród faza 2 (wersja 2: gęste miasto): adresy, rynek 26x18 w obstawie domów, rzędy domów ozdobnych wzdłuż ulic, podwórka, ogródki, cmentarz z murkiem,
plac strażnicy, pola i pastwisko w błoniach. run(B, road, lane): kafle; events(B): zdarzenia (po places_and_events)."""
import math, random, json, copy

BOXES = []          # (nazwa, x0, y0, x1, y1) budynki z adresami i ozdobne
PROTECT = []        # prostokąty bez ozdób i drzew (cmentarz, pola, obóz, rynek, dziedziniec dzielnicy 1...)
DECOR = []          # ozdobne budynki (bez drzwi): (klucz, x0, y0, x1, y1)
SQUARE = set()
R = random.Random(2)

HOUSES = [
    ("Kaplica", "kosciol", 8, 16), ("Dom grabarza", "chata_a", 20, 12), ("Dom 1", "dom_kwiaty", 85, 12), ("Kamienica", "dom_pietrowy", 96, 28),
    ("Dzwonnica", "dzwonnica", 86, 31), ("Dom mieszczan", "chata_a", 36, 38), ("Izba pod skałą", "izba", 39, 37), ("Dom 15", "chata_b", 21, 33),
    ("Kantor front", "sklep", 18, 46), ("Kantor tył", "chata_e", 14, 47), ("Szwaczka", "dom_waski", 7, 48), ("Kowal", "chata_bale", 13, 60),
    ("Ratusz", "ratusz", 85, 47), ("Strażnica", "dom_wieza", 98, 47), ("Dom 4", "chata_c", 84, 63), ("Dom 5", "chata_b", 95, 62),
    ("Piekarnia", "sklep", 38, 72), ("Dom 10", "chata_e", 31, 73), ("Dom 11", "dom_szachulec", 45, 73), ("Woziwoda", "chata_bale2", 59, 73),
    ("Dom 13", "chata_a", 79, 74), ("Cieśla", "chata_bale", 33, 86), ("Dom 7", "chata_a", 42, 87), ("Dom 12", "chata_e", 45, 87),
    ("Szopa woźniców", "wozownia", None, None), ("Dom 14", "chata_b", 78, 88), ("Weteran", "dom_szachulec", 84, 88), ("Dom 9", "chata_b", 95, 88),
    ("Garbarz", "chata_bale2", 6, 88),
]
EXTRA = [("Kancelaria ratusza", "chata_c", 91, 47)]
# rzędy domów ozdobnych: (y dolnego rzędu, x od, x do)
ROWS = [(47, 2, 12), (47, 20, 34), (58, 2, 30), (70, 3, 29), (84, 3, 30), (96, 3, 32), (43, 94, 116), (57, 76, 116), (70, 84, 116), (86, 80, 116), (96, 40, 116),
        (24, 84, 116), (9, 84, 116), (37, 84, 116), (70, 34, 70), (86, 36, 75), (96, 3, 116), (37, 42, 47), (37, 55, 64), (63, 38, 66), (39, 40, 48), (39, 54, 64), (45, 27, 37), (52, 27, 37), (59, 27, 37), (45, 66, 72), (52, 66, 72), (59, 66, 72), (47, 66, 81), (58, 66, 80), (40, 66, 80)]
FIELD_KEYS = ["dom_waski", "dom_kwiaty", "sklep", "dom_szachulec", "dom_wieza", "dom_pietrowy", "chata_a", "chata_b", "chata_c", "chata_e", "chata_bale", "chata_bale2"]
TALL_OK = {"dom_waski": 8, "dom_kwiaty": 6, "sklep": 10, "dom_szachulec": 8, "dom_wieza": 8, "dom_pietrowy": 10, "chata_a": 4, "chata_b": 6, "chata_c": 5, "chata_e": 6, "chata_bale": 6, "chata_bale2": 4}


def box_of(B, key, dx, dy):
    u = B.UK[key]
    ddx, ddy = u["drzwi"] if u["drzwi"] else (0, u["h"] - 1)
    x0, y0 = dx - ddx, dy - ddy
    return x0, y0, x0 + u["w"] - 1, y0 + u["h"] - 1


def nearest(cells, p):
    best, bd = None, 1e9
    for c in cells:
        d = abs(c[0] - p[0]) + abs(c[1] - p[1])
        if d < bd: best, bd = c, d
    return best


def square_cells():
    """rynek ~26x18: prostokąt ze ściętymi rogami, krawędź prosta wzdłuż fasad"""
    cells = set()
    for y in range(40, 59):
        for x in range(39, 65):
            cut = 3
            dx = min(x - 39, 64 - x); dy = min(y - 40, 58 - y)
            if dx + dy < cut: continue
            cells.add((x, y))
    return cells


def in_protect(x, y):
    return any(a <= x <= c and b <= y <= d for a, b, c, d in PROTECT)


def run(B, road, lane):
    L = B.L
    rectc, blobc, band = B.rectc, B.blobc, B.band
    paths = set(road) | set(lane)
    # rynek: miękki brzeg (okrągły bruk z trawą) + cegła w środku; stara prostokątna płyta znika
    for c in list(L.L[1]):
        if L.L[1][c] == ("k", B.PAVE) and 30 <= c[0] <= 73 and 35 <= c[1] <= 64: del L.L[1][c]
    outer = square_cells()
    inner = {c for c in outer if all((c[0] + a, c[1] + b) in outer for a in (-1, 0, 1) for b in (-1, 0, 1))}
    L.kind(0, outer, B.ROAD)
    L.kind(1, inner, B.PAVE)
    # aleja od schodów zamku do rynku
    L.kind(1, rectc(50, 35, 52, 39), B.PAVE)
    SQUARE.update(inner)
    B.SQUARE_CELLS = inner
    L.put("studnia", 50, 46)
    BOXES.append(("studnia", 50, 46, 53, 50))
    PROTECT.append((38, 40, 65, 59))
    PROTECT.append((26, 3, 83, 34))
    PROTECT.append((3, 21, 16, 30))
    # budynki z adresami
    for nm, key, dx, dy in HOUSES + EXTRA:
        if dx is None:
            x0, y0 = 57, 83
            L.put(key, x0, y0)
            BOXES.append((nm, x0, y0, x0 + 7, y0 + 4)); continue
        L.put(key, dx, dy, anchor="door")
        BOXES.append((nm,) + box_of(B, key, dx, dy))
        L.kind(0, blobc(dx, dy + 1.6, 2.0, 1.1, dx * 31 + dy, 0.15), B.YARD)
        t = nearest(paths | inner, (dx, dy + 1))
        if t and abs(t[0] - dx) + abs(t[1] - dy - 1) > 1:
            L.kind(0, band([(dx + 0.5, dy + 1.5), (t[0] + 0.5, t[1] + 0.5)], 1.9, 0.0, 3, inner=True), B.YARD)
    # cmentarz: murek z kamieni (płot kamienny) z furtką, ścieżka z kaplicy; teren (5,23)-(12,28) wolny dla wtyczki Zakon
    L.kind(0, band([(8.5, 17.5), (8.5, 22), (8.5, 30)], 1.8, 0.1, 5), B.LANE)
    wall = {(x, 21) for x in range(3, 17)} | {(x, 30) for x in range(3, 17)} | {(3, y) for y in range(21, 31)} | {(16, y) for y in range(21, 31)}
    wall -= {(8, 21), (9, 21), (8, 30), (9, 30)}
    L.kind(1, wall, 38)
    # pola mieszczan, pastwisko, szubienica, obóz
    for (fx, fy, w, h) in ((6, 108, 8, 4), (74, 108, 8, 4), (62, 108, 8, 5)):
        L.kind(0, rectc(fx, fy, fx + w - 1, fy + h - 1), 24)
        ring = rectc(fx - 1, fy - 1, fx + w, fy + h) - rectc(fx, fy, fx + w - 1, fy + h - 1)
        L.kind(1, {c for c in ring if not (c[1] == fy - 1 and fx + 3 <= c[0] <= fx + 4)}, 38)
        PROTECT.append((fx - 2, fy - 2, fx + w + 1, fy + h + 1))
    pf = rectc(93, 99, 113, 112)
    ring = rectc(92, 98, 114, 113) - pf
    L.kind(1, {c for c in ring if not (c[0] == 92 and 105 <= c[1] <= 106)}, 22)
    L.kind(0, blobc(103, 106, 10, 5, 91, 0.6) & pf, 27)
    L.put("kratki", 96, 100)
    PROTECT.append((92, 98, 114, 113))
    L.kind(0, blobc(88, 108, 5, 3.5, 12, 0.35), 24)
    L.put("szubienica", 88, 105)
    PROTECT.append((84, 103, 93, 112))
    PROTECT.append((34, 109, 52, 115))
    PROTECT.append((92, 38, 106, 50))     # plac strażnicy
    # plac strażnicy: bruk z cegły (nieregularny), trawa wokół
    L.kind(0, blobc(99, 44.5, 6.5, 4.5, 21, 0.3), B.ROAD)
    L.kind(1, blobc(99, 44.5, 5, 3.3, 22, 0.25), B.PAVE)
    PROTECT.append((86, 44, 100, 50))     # przed ratuszem
    for nm, x0, y0, x1, y1 in BOXES: PROTECT.append((x0, y0 - 1, x1, y1 + 2)) if False else None
    for e in B.OLD.values():
        if e["name"].startswith("Miejsce:"): PROTECT.append((e["x"] - 1, e["y"] - 1, e["x"] + 1, e["y"] + 1))
    decor(B, paths)
    B.BACKS = back_fences(B)


def free_rect(B, x0, y0, x1, y1, pad=0):
    L = B.L
    for y in range(y0 - pad, y1 + 1 + pad):
        for x in range(x0 - pad, x1 + 1 + pad):
            if not (3 <= x <= 116 and 5 <= y <= 114): return False
            if in_protect(x, y): return False
            for z in (2, 3):
                if (x, y) in L.L[z]: return False
            k1 = L.L[1].get((x, y))
            if k1 and k1[1] not in (21, 28, 29): return False
            k0 = L.L[0].get((x, y))
            if k0 not in (("k", 16), ("k", 27), None): return False
    for nm, a, b, c, d in BOXES:
        if not (x1 + pad < a or c < x0 - pad or y1 + pad < b - 1 or d + 1 < y0 - pad): return False
    return True


def decor(B, paths):
    """domy ozdobne bez drzwi: rzędy wzdłuż ulic, naprzemienne bryły (ten sam kawałek nie wcześniej niż 7 kratek dalej), odstępy 0-2, cofnięcia 0-1,
    wydeptana ziemia i małe bruki przed fasadami, płot z bramką i szopami od strony ulicy dla domów tyłem do niej"""
    L = B.L
    band = B.band
    W_ = {"chata_a": 0.35, "chata_c": 0.6, "chata_b": 0.8}
    for (yb, xa, xb) in list(ROWS):
        x = xa
        recent = []          # (klucz, x1)
        row_cells = []
        while x <= xb:
            keys = FIELD_KEYS[:]
            R.shuffle(keys)
            keys.sort(key=lambda k: -R.random() * W_.get(k, 1.0))
            placed = False
            for key in keys:
                if any(k == key and x - x1 < 7 for k, x1 in recent): continue
                u = B.UK[key]
                h = u["h"]
                back = 1 if R.random() < 0.3 else 0
                y1_ = yb - back
                if h > TALL_OK[key] or y1_ - h + 1 < 5: continue
                x1 = x + u["w"] - 1
                if x1 > xb + 6: continue
                if not free_rect(B, x, y1_ - h + 1, x1, y1_): continue
                L.put(key, x, y1_ - h + 1)
                DECOR.append((key, x, y1_ - h + 1, x1, y1_))
                BOXES.append(("decor_" + key, x, y1_ - h + 1, x1, y1_))
                recent.append((key, x1)); recent[:] = recent[-6:]
                row_cells.append((x, x1, y1_))
                x = x1 + 1 + R.choice((0, 0, 1, 1, 2))
                placed = True
                break
            if not placed: x += 1
        # wydeptana ziemia / mały bruk przed fasadami rzędu
        for (xa_, xb_, yf) in row_cells:
            if R.random() < 0.3:
                L.kind(0, band([(xa_ - 0.5, yf + 1.6), (xb_ + 1.5, yf + 1.6)], 1.8, 0.1, 5), B.ROAD)
            else:
                L.kind(0, band([(xa_ - 0.5, yf + 1.5), (xb_ + 1.5, yf + 1.5)], 1.7, 0.15, 6), B.YARD)
            fx = (xa_ + xb_) // 2
            t = nearest(paths, (fx, yf + 1))
            if t and abs(t[0] - fx) + abs(t[1] - yf - 1) > 2:
                L.kind(0, band([(fx + 0.5, yf + 1.5), (t[0] + 0.5, t[1] + 0.5)], 1.7, 0.0, 3), B.YARD)


def back_fences(B):
    """domy tyłem do ulicy (ścieżka tuż nad dachem): płot z bramką, szopa i stos drewna przy płocie"""
    L = B.L
    out = []
    for key, x0, y0, x1, y1 in DECOR:
        n = sum(1 for x in range(x0, x1 + 1) for yy in (y0 - 2, y0 - 3) if L.L[0].get((x, yy)) in (("k", B.ROAD), ("k", B.LANE)))
        if n < max(2, (x1 - x0 + 1) // 2): continue
        cells = [(x, y0 - 1) for x in range(x0 - 1, x1 + 2) if L.L[0].get((x, y0 - 1)) in (("k", 16), ("k", 27)) and (x, y0 - 1) not in L.L[2]]
        mid = (x0 + x1) // 2
        cells = [c for c in cells if c[0] not in (mid, mid + 1)]
        L.kind(1, set(cells), 38)
        out.append((x0, y0, x1, y1))
    return out


def occupied(B):
    s = set()
    for e in B.EV.values():
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1): s.add((e["x"] + dx, e["y"] + dy))
    return s


def okcell(B, x, y, occ):
    if not (3 <= x <= 116 and 5 <= y <= 114): return False
    if in_protect(x, y) or (x, y) in occ: return False
    for z in (1, 2, 3):
        if (x, y) in B.L.L[z] and B.L.L[z][(x, y)][1] not in (21, 28, 29): return False
    k = B.L.L[0].get((x, y))
    if k not in (("k", 16), ("k", 27), None): return False
    for nm, a, b, c, d in BOXES:
        if a - 1 <= x <= c + 1 and b - 1 <= y <= d + 1: return False
    return True


def horse(B, i, x, y):
    m = json.load(open(B.ROOT + "data/Map181.json", encoding="utf-8"))
    e = copy.deepcopy(m["events"][i])
    e["id"] = B.new_id(); e["x"], e["y"] = x, y; e["name"] = "Koń przy płocie"
    B.EV[e["id"]] = e


def events(B):
    clone, tree, keep = B.clone, B.tree, B.keep
    occ = occupied(B)
    r = random.Random(11)
    # --- rynek: znaczniki na nowy plac, stragany w gromadkach po 2-3 ze skrzyniami, workami, beczkami, wozem; ławki przy studni; dwa lipy/dęby w rogach
    for i, (x, y) in {284: (49, 50), 288: (48, 46), 345: (50, 51), 346: (57, 41), 348: (41, 47), 355: (62, 47), 356: (41, 54), 360: (62, 54), 373: (45, 47), 375: (58, 47),
                      376: (45, 54), 379: (58, 54), 383: (42, 43), 384: (61, 43), 387: (43, 55), 388: (61, 56), 392: (43, 45), 393: (60, 45), 396: (62, 45), 397: (43, 57),
                      401: (60, 57), 406: (60, 58), 276: (41, 58), 281: (41, 44), 339: (40, 57), 341: (44, 45), 335: (62, 50), 287: (53, 52)}.items():
        keep(i, x, y)
    for i in (81, 130, 205, 483): B.EV.pop(i, None)
    stalls = [(41, 42), (44, 44), (40, 46), (60, 43), (47, 57), (59, 55), (62, 57), (63, 50)]
    for sid, (x, y) in zip((41, 42, 46, 101, 495, 496, 497, 499), stalls):
        keep(sid, x, y)
    keep(56, 58, 40)
    for (x, y) in ((48, 45), (55, 54)): clone(48, x, y, name="Latarnia")
    for (x, y) in ((49, 54), (54, 45)): clone(190, x, y, name="Donica z kwiatami", characterName="!Tavern_Yard", characterIndex=3, direction=2, pattern=0)
    props = [(42, 44, "crate"), (39, 47, "sack"), (43, 47, "barrel"), (62, 43, "crate"), (61, 45, "barrel"), (63, 52, "sack"), (49, 58, "sack"), (48, 56, "crate"), (58, 57, "barrel"), (61, 55, "sack")]
    for (x, y, k) in props:
        if k == "barrel": clone(190, x, y, name="Beczka")
        elif k == "crate": clone(190, x, y, name="Skrzynie", characterName="!Tavern_Yard", characterIndex=1, direction=2, pattern=0)
        else: clone(190, x, y, name="Worki", characterName="!Tavern_Yard", characterIndex=1, direction=8, pattern=0)
    clone(272, 56, 57, name="Wóz kupca")
    for (x, y) in ((48, 49), (55, 49), (49, 53), (54, 53), (47, 51)):
        clone(153, x, y, name="Ławka", direction=2, pattern=0)
    tree("big_g", 40, 41, name="Lipa"); tree("big_g", 63, 41, name="Lipa")
    for (x, y) in ((54, 47), (49, 52), (54, 52), (49, 47)): pass
    # --- strażnica: stojaki i kukła na placu
    keep(220, 95, 41); keep(255, 103, 41); keep(256, 99, 47); keep(138, 99, 41)
    clone(220, 95, 46, name="Stojak z bronią"); clone(255, 103, 46, name="Stojak z bronią"); clone(148, 97, 41, name="Poręcz do wiązania koni")
    clone(190, 94, 44, name="Beczka"); clone(190, 104, 44, name="Beczka")
    # --- warsztaty: kuźnia (animowany palenisko przy ulicy), garbarnia: wanny i suszarnie, cieśla: stosy desek, woziwoda: beczki z wodą
    keep(142, 10, 62)
    for (x, y) in ((16, 84), (17, 85), (18, 83)): clone(190, x, y, name="Kadź garbarska")
    for (x, y) in ((14, 85), (19, 85)): clone(190, x, y, name="Suszarnia skór", characterName="!Town_Props", characterIndex=1, direction=2, pattern=2)
    for (x, y) in ((36, 90), (37, 90), (38, 90)): clone(190, x, y, name="Stos desek", characterName="!Tavern_Yard", characterIndex=2, direction=2, pattern=r.choice((0, 1, 2)))
    for (x, y) in ((61, 76), (62, 76), (60, 76)): clone(190, x, y, name="Beczka z wodą")
    # --- stajnia: konie przy płocie i w zagrodzie
    for i, (x, y) in ((1, (70, 22)), (6, (74, 22)), (10, (66, 23))): horse(B, i, x, y)
    horse(B, 6, 64, 13); horse(B, 1, 76, 18)
    # --- domy ozdobne: ławki, beczki, donice, latarnie co kilka domów, ogródki i stosy drewna z tyłu, pranie
    last_lamp = -99
    for n, (key, x0, y0, x1, y1) in enumerate(DECOR):
        fx = (x0 + x1) // 2
        # latarnia co 3 dom
        if n - last_lamp >= 3 and okcell(B, x1 + 1, y1 + 1, occ):
            clone(48, x1 + 1, y1 + 1, name="Latarnia"); occ.add((x1 + 1, y1 + 1)); last_lamp = n
        c = r.random()
        if c < 0.35 and okcell(B, x0 + 1, y1 + 1, occ):
            clone(190, x0 + 1, y1 + 1, name="Beczka"); occ.add((x0 + 1, y1 + 1))
        elif c < 0.6 and okcell(B, x1 - 1, y1 + 1, occ):
            clone(190, x1 - 1, y1 + 1, name="Donica z kwiatami", characterName="!Tavern_Yard", characterIndex=3, direction=2, pattern=0); occ.add((x1 - 1, y1 + 1))
        # tył: ogródek warzywny, stos drewna, pranie, drzewko owocowe
        cand = [(x0, y0 - 4)] if False else []
        bx, by = x0, y0 - 4
        kind_g = r.random()
        if by >= 5 and kind_g < 0.5 and free_rect(B, bx, by, bx + 3, by + 2):
            B.L.put("kratki", bx, by)
            for yy in range(by, by + 3):
                for xx in range(bx, bx + 4): occ.add((xx, yy))
        elif by >= 6 and kind_g < 0.8:
            gw, gh = r.choice((2, 3, 4)), r.choice((2, 2, 3))
            gx = x0 + r.choice((0, 1))
            gy = y0 - 1 - gh
            if free_rect(B, gx, gy, gx + gw - 1, gy + gh - 1):
                for yy in range(gy, gy + gh):
                    for xx in range(gx, gx + gw):
                        B.L.kind(0, [(xx, yy)], 24)
                        if (yy - gy) % 2 == 0: B.L.kind(1, [(xx, yy)], r.choice((21, 28, 29)))
                        occ.add((xx, yy))
        else:
            for (tx, ty) in ((x0, y0 - 1), (x1, y0 - 1), (fx, y0 - 2)):
                if okcell(B, tx, ty, occ):
                    k = r.random()
                    if k < 0.4: clone(190, tx, ty, name="Stos drewna", characterName="!Tavern_Yard", characterIndex=2, direction=2, pattern=0)
                    elif k < 0.7: clone(190, tx, ty, name="Pranie", characterName="!Town_Props", characterIndex=1, direction=2, pattern=2)
                    else: tree(r.choice(("pear", "apple", "small")), tx, ty)
                    occ.add((tx, ty)); break
    # od strony ulicy: szopy i stosy drewna przy płotach tyłów
    for (x0, y0, x1, y1) in getattr(B, "BACKS", []):
        for (tx, ty, k) in ((x0, y0 - 2, "wood"), (x1, y0 - 2, "barrel")):
            if okcell(B, tx, ty, occ) or (tx, ty) not in occ:
                if k == "wood": clone(190, tx, ty, name="Stos drewna", characterName="!Tavern_Yard", characterIndex=2, direction=2, pattern=0)
                else: clone(190, tx, ty, name="Beczka")
                occ.add((tx, ty))
    # adresowane domy: beczka / skrzynie / donica przy domu
    for nm, x0, y0, x1, y1 in BOXES:
        if nm.startswith("decor_") or nm == "studnia": continue
        cx, cy = x1 + 1, y1 + 1
        if okcell(B, cx, cy, occ):
            kind = r.choice(("barrel", "crate", "flower"))
            if kind == "barrel": clone(190, cx, cy, name="Beczka")
            elif kind == "crate": clone(190, cx, cy, name="Skrzynie", characterName="!Tavern_Yard", characterIndex=1, direction=2, pattern=0)
            else: clone(190, cx, cy, name="Donica z kwiatami", characterName="!Tavern_Yard", characterIndex=3, direction=2, pattern=0)
            occ.add((cx, cy))
    # drzewa: owocowe i liściaste w podwórkach i na skwerach; sosny tylko na błoniach i przy cmentarzu
    for _ in range(140):
        x, y = r.randint(4, 115), r.randint(6, 113)
        if y >= 98 or (3 <= x <= 16 and 17 <= y <= 31):
            kinds = ("pine_a", "pine_b", "small", "pear")
        else:
            kinds = ("pear", "apple", "small", "big_g")
        if okcell(B, x, y, occ):
            tree(r.choice(kinds), x, y)
            for dx in (-3, -2, -1, 0, 1, 2, 3):
                for dy in (-2, -1, 0, 1): occ.add((x + dx, y + dy))
    # błonia: zagajniki sosnowe na południu
    for (cx, cy, n, rad) in ((20, 100, 5, 5), (56, 103, 5, 5), (100, 118, 4, 3), (8, 97, 3, 3)):
        placed = []
        for _ in range(n * 25):
            if len(placed) >= n: break
            x = int(cx + r.uniform(-rad, rad)); y = int(cy + r.uniform(-rad, rad) * 0.8)
            if not okcell(B, x, y, occ) or y < 97 or any(math.hypot(x - a, y - b) < 3.2 for a, b in placed): continue
            tree(r.choice(("pine_a", "pine_b")), x, y); placed.append((x, y))
            for dx in (-2, -1, 0, 1, 2):
                for dy in (-1, 0, 1): occ.add((x + dx, y + dy))

    # ostatnie sosny wewnątrz murów (poza cmentarzem i błoniami) usuwamy
    for i in [i for i, e in B.EV.items() if "Pine" in e["pages"][0]["image"]["characterName"] and i not in B.KEEP]:
        x, y = B.EV[i]["x"], B.EV[i]["y"]
        if not (y >= 96 or (3 <= x <= 16 and 17 <= y <= 31)): B.EV.pop(i)
