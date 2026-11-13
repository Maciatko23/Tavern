R = "C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/tools/miasto3/"
p = R + "kit.py"
s = open(p, "rb").read().decode("utf-8")
# church split into two halves
old = s[s.index('add("kosciol"'):s.index("\n", s.index('add("kosciol"'))]
s = s.replace(old, 'add("kosciol_l", rect("City_TileE", 0, 0, 4, 11), door=(4, 11), what="kaplica: lewa część (5 kolumn), prawa część stoi w drugiej połówce arkusza w tych samych rzędach")\nadd("kosciol_p", rect("City_TileE", 5, 0, 8, 11), what="kaplica: prawa część (4 kolumny)")')
# small parts
small = '''add("znaki", rect("City_TileB", 0, 8, 2, 15), what="szyldy cechów (kowal, piekarz, karczma, apteka...)")
add("latarnie", rect("City_TileB", 6, 13, 7, 15), star=[(0, 0), (1, 0)], what="latarnie uliczne (górna kratka nad bohaterem)")
add("kramy", rect("Rural_TileB", 0, 6, 7, 9), what="trzy kramy targowe z towarem")
add("namiot", rect("Rural_TileB", 0, 0, 2, 5), what="namiot okrągły")
add("palisada", rect("Rural_TileC", 12, 12, 15, 15), what="palisada z bramką")
add("plotek", rect("Rural_TileB", 3, 13, 7, 15), what="płotek z kwiatami i beczką")
add("komin", rect("City_TileB", 3, 0, 4, 1), what="komin z dachem")
add("drzwi_kamienne", rect("City_TileD", 5, 6, 5, 7), door=(0, 1), what="drzwi w kamiennej ścianie")
add("drzwi_luk", rect("City_TileD", 2, 8, 2, 9), door=(0, 1), what="drzwi w łuku z oknami")
add("schody_drewniane", rect("City_TileB", 1, 10, 2, 12), walk=[(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2)], what="schody drewniane z poręczą")
add("kwiaty_okno", rect("City_TileE", 11, 10, 13, 11), what="okno z skrzynką kwiatów")
add("dach_szachulec", rect("City_TileB", 3, 6, 7, 7), what="dach z lukarnami (pas)")
add("dach_czerwony", rect("City_TileD", 0, 0, 3, 3), what="dach dwuspadowy czerwony")
'''
s = s.replace('# bramy / studnia', small + '# bramy / studnia', 1)
# groups + layout
a = s.index("def wall(p):"); b = s.index("def tid(sheet, c, r):")
new = '''B_KEYS = {"dom_waski", "dom_kwiaty", "sklep", "dom_szachulec", "dom_wieza", "izba", "znaki", "komin", "drzwi_kamienne", "drzwi_luk", "schody_drewniane", "dach_szachulec"}
C_KEYS = {"gildia", "kamienica", "kosciol_l", "kosciol_p", "ratusz", "dzwonnica", "dom_pietrowy", "kwiaty_okno", "dach_czerwony"}
D_KEYS = {"stajnia", "wozownia", "chata_a", "chata_b", "chata_c", "chata_e", "chata_bale", "chata_bale2", "studnia", "kratki", "beczki", "szubienica", "kramy", "namiot", "palisada", "plotek"}


def wall(p):
    """mury, baszty i schody leżą na arkuszu E (wspólnym z tilesetami sąsiednich map: 14 = zestaw 11 + E, 15 = zestaw 9 + E)"""
    return p.key.startswith("mur_") or p.key.startswith("wieza") or p.key == "schody"


def pref(p):
    if wall(p): return "E"
    if p.key in B_KEYS: return "B"
    if p.key in C_KEYS: return "C"
    if p.key in D_KEYS: return "D"
    return "E"


def layout():
    """B: domy, C: duże i publiczne, D: wiejskie / stajnia / targ, E: mury, bramy, schody i drobne części. Każdy kawałek w jednej połówce arkusza (8 kolumn);
    kaplica = dwie części w tych samych rzędach, po jednej w każdej połówce"""
    grids = {s: np.zeros((16, 16), bool) for s in SHEETS}
    grids['B'][0, 0] = True      # kratka 0 arkusza B to pusty kafel (id 0)
    pos = {}
    for p in sorted(REG, key=lambda q: (0 if wall(q) else 1, -q.h, -q.w)):
        if p.key == "kosciol_p": continue
        done = False
        for s in [pref(p)] + [t for t in SHEETS if t != pref(p)]:
            g = grids[s]
            xs = list(range(0, 9 - p.w)) + list(range(8, 17 - p.w))
            mate = next((q for q in REG if q.key == "kosciol_p"), None) if p.key == "kosciol_l" else None
            for y0 in range(0, 17 - p.h):
                for x0 in xs:
                    if g[y0:y0 + p.h, x0:x0 + p.w].any(): continue
                    if mate is not None:
                        x1 = 8
                        if g[y0:y0 + p.h, x1:x1 + mate.w].any() or x0 + p.w > 8: continue
                        g[y0:y0 + p.h, x1:x1 + mate.w] = True
                        pos[mate.key] = (s, x1, y0)
                    g[y0:y0 + p.h, x0:x0 + p.w] = True
                    pos[p.key] = (s, x0, y0)
                    done = True
                    break
                if done: break
            if done: break
        if not done: raise SystemExit("brak miejsca na kawałek " + p.key)
    return pos


'''
s = s[:a] + new + s[b:]
# composite church entry in uklad
s = s.replace("    if write:\n        os.makedirs(OUT_IMG, exist_ok=True)", '''    if "kosciol_l" in uklad:
        l_, r_ = uklad["kosciol_l"], uklad["kosciol_p"]
        uklad["kosciol"] = {"arkusz": l_["arkusz"], "kol": l_["kol"], "wiersz": l_["wiersz"], "w": l_["w"] + r_["w"], "h": l_["h"], "drzwi": l_["drzwi"],
                            "kafle": [a + b for a, b in zip(l_["kafle"], r_["kafle"])], "opis": "kaplica (kościół) - w arkuszu dwie połówki", "status": "sprawdzić"}
    if write:
        os.makedirs(OUT_IMG, exist_ok=True)''', 1)
# map image 2x2 labelled
s = s.replace("def preview(sheets, pos):", '''def mapa_obrazek(sheets, pos):
    """docs/miasto3/zestaw_13_mapa.png: cztery arkusze (B, C, D, E) w siatce 2x2, każdy kawałek w ramce z nazwą, żółta kreska = granica połówek palety"""
    from PIL import ImageFont
    f = ImageFont.truetype(ROOT + "fonts/AlegreyaSans-Bold.ttf", 14)
    W2 = 768 + 20
    out = Image.new("RGB", (2 * W2, 2 * (768 + 36)), (30, 32, 36))
    d = ImageDraw.Draw(out)
    sz = {p.key: (p.w, p.h) for p in REG}
    for k, s_ in enumerate(SHEETS):
        ox, oy = (k % 2) * W2 + 10, (k // 2) * (768 + 36) + 26
        bg = Image.new("RGBA", (768, 768), (70, 72, 78, 255)); bg.alpha_composite(sheets[s_])
        out.paste(bg.convert("RGB"), (ox, oy))
        d.text((ox, oy - 22), "Arkusz %s (%s)" % (s_, {"B": "domy", "C": "duże i publiczne", "D": "wiejskie, stajnia, targ", "E": "mury, bramy, schody, drobne części"}[s_]), font=f, fill=(255, 220, 90))
        d.line([(ox + 8 * T, oy), (ox + 8 * T, oy + 768)], fill=(255, 220, 0), width=2)
        for key, (ss, x0, y0) in pos.items():
            if ss != s_: continue
            w, h = sz[key]
            d.rectangle([ox + x0 * T + 1, oy + y0 * T + 1, ox + (x0 + w) * T - 2, oy + (y0 + h) * T - 2], outline=(90, 255, 140), width=2)
            d.rectangle([ox + x0 * T + 2, oy + y0 * T + 2, ox + x0 * T + 8 + len(key) * 7, oy + y0 * T + 18], fill=(0, 0, 0))
            d.text((ox + x0 * T + 4, oy + y0 * T + 3), key, font=f, fill=(120, 255, 160))
    out.save(ROOT + "docs/miasto3/zestaw_13_mapa.png")


def preview(sheets, pos):''', 1)
s = s.replace("    preview(sh, pos)\n", "    preview(sh, pos)\n    mapa_obrazek(sh, pos)\n")
open(p, "wb").write(s.encode("utf-8"))

p = R + "mlib.py"
s = open(p, "rb").read().decode("utf-8")
a = s.index("def piece_cov(key, i, j):"); b = s.index("def zestaw13():")
new = '''def piece_cov(key, i, j):
    """czy kratka kawałka ma jakiekolwiek piksele (z arkusza zestawu; pozycja z numeru kafla, więc też dla kawałków z dwóch połówek)"""
    from PIL import Image
    import numpy as np
    t = UK[key]["kafle"][j][i]
    s = kit.SHEETS[t // 256]
    w = t % 256
    c, r = (w // 128) * 8 + w % 8, (w % 128) // 8
    if s not in _pc: _pc[s] = np.asarray(Image.open(kit.OUT_IMG + "Miasto_%s.png" % s).convert("RGBA"))[..., 3]
    a = _pc[s]
    return float((a[r * 48:(r + 1) * 48, c * 48:(c + 1) * 48] > 16).mean())


'''
s = s[:a] + new + s[b:]
open(p, "wb").write(s.encode("utf-8"))
print("ok")
