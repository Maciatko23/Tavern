R = "C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/tools/miasto3/"
p = R + "phase2.py"
s = open(p, "rb").read().decode("utf-8")

# --- rows at the square's north edge; PROTECT of the square starts at y40
s = s.replace("PROTECT.append((38, 39, 65, 59))", "PROTECT.append((38, 40, 65, 59))")
s = s.replace("(63, 38, 66), (45, 27, 37)", "(63, 38, 66), (39, 40, 48), (39, 54, 64), (45, 27, 37)")

# --- decor(): variety, setbacks, gaps, worn fronts
a = s.index("def decor(B, paths):"); b = s.index("def occupied(B):")
new = '''def decor(B, paths):
    """domy ozdobne bez drzwi: rzędy wzdłuż ulic, naprzemienne bryły (ten sam kawałek nie wcześniej niż 7 kratek dalej), odstępy 0-2, cofnięcia 0-1,
    wydeptana ziemia i małe bruki przed fasadami, płot z bramką i szopami od strony ulicy dla domów tyłem do niej"""
    L = B.L
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


'''
s = s[:a] + new + s[b:]
s = s.replace("    decor(B, paths)\n", "    decor(B, paths)\n    B.BACKS = back_fences(B)\n", 1)

# --- gardens: mixed
a = s.index("        bx, by = x0, y0 - 4"); b = s.index("    # adresowane domy:")
new = '''        bx, by = x0, y0 - 4
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
'''
s = s[:a] + new + s[b:]

# --- market: no braziers, irregular stalls, lamps, notice board; guard square props; back-fence sheds; pines out
s = s.replace("    stalls = [(41, 43), (44, 44), (42, 46), (59, 43), (62, 44), (60, 46), (42, 56), (45, 57), (60, 56), (63, 57)]",
              "    for i in (81, 130, 205, 483): B.EV.pop(i, None)\n    stalls = [(41, 42), (44, 44), (40, 46), (60, 43), (47, 57), (59, 55), (62, 57), (63, 50)]")
s = s.replace("    for sid, (x, y) in zip((41, 42, 46, 101, 495, 496, 497, 499), stalls):\n        keep(sid, x, y)\n    for (x, y) in stalls[8:]: clone(497, x, y, name=\"Stragan\")",
              "    for sid, (x, y) in zip((41, 42, 46, 101, 495, 496, 497, 499), stalls):\n        keep(sid, x, y)\n    keep(56, 57, 41)\n    for (x, y) in ((48, 45), (55, 54)): clone(48, x, y, name=\"Latarnia\")\n    for (x, y) in ((49, 54), (54, 45)): clone(190, x, y, name=\"Donica z kwiatami\", characterName=\"!Tavern_Yard\", characterIndex=3, direction=2, pattern=0)")
s = s.replace("    props = [(40, 45, \"crate\"), (46, 45, \"sack\"), (43, 47, \"barrel\"), (58, 45, \"crate\"), (63, 46, \"barrel\"), (61, 47, \"sack\"), (41, 57, \"sack\"), (47, 58, \"crate\"), (59, 58, \"barrel\"),\n             (63, 58, \"sack\"), (44, 59, \"barrel\"), (57, 59, \"crate\")]",
              "    props = [(42, 44, \"crate\"), (39, 47, \"sack\"), (43, 47, \"barrel\"), (62, 43, \"crate\"), (61, 45, \"barrel\"), (63, 52, \"sack\"), (49, 58, \"sack\"), (48, 56, \"crate\"), (58, 57, \"barrel\"), (61, 55, \"sack\")]")
s = s.replace("    keep(220, 96, 42); keep(255, 102, 42); keep(256, 99, 46); keep(138, 97, 38)",
              "    keep(220, 95, 41); keep(255, 103, 41); keep(256, 99, 47); keep(138, 99, 41)\n    clone(220, 95, 46, name=\"Stojak z bronią\"); clone(255, 103, 46, name=\"Stojak z bronią\"); clone(148, 97, 41, name=\"Poręcz do wiązania koni\")\n    clone(190, 94, 44, name=\"Beczka\"); clone(190, 104, 44, name=\"Beczka\")")
s = s.replace("    # adresowane domy:", '''    # od strony ulicy: szopy i stosy drewna przy płotach tyłów
    for (x0, y0, x1, y1) in getattr(B, "BACKS", []):
        for (tx, ty, k) in ((x0, y0 - 2, "wood"), (x1, y0 - 2, "barrel")):
            if okcell(B, tx, ty, occ) or (tx, ty) not in occ:
                if k == "wood": clone(190, tx, ty, name="Stos drewna", characterName="!Tavern_Yard", characterIndex=2, direction=2, pattern=0)
                else: clone(190, tx, ty, name="Beczka")
                occ.add((tx, ty))
    # adresowane domy:''', 1)
s += '''
    # ostatnie sosny wewnątrz murów (poza cmentarzem i błoniami) usuwamy
    for i in [i for i, e in B.EV.items() if "Pine" in e["pages"][0]["image"]["characterName"] and i not in B.KEEP]:
        x, y = B.EV[i]["x"], B.EV[i]["y"]
        if not (y >= 96 or (3 <= x <= 16 and 17 <= y <= 31)): B.EV.pop(i)
'''
open(p, "wb").write(s.encode("utf-8"))
print("ok")
