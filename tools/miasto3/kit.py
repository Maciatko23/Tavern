# -*- coding: utf-8 -*-
"""Kruczogród (Map008) w stylu Fantastic Buildings: Medieval - zestaw kafli "Kruczogród (średniowiecze)" (tileset 13).
Rejestr KAWAŁKÓW (budynki, mur, rekwizyty) pocięty z arkuszy paczki, ułożony na czterech arkuszach 768x768 (B, C, D, E), z flagami przejścia.
  python tools/miasto3/kit.py            -> img/tilesets/Kruczogrod/Miasto_{B,C,D,E}.png + tools/miasto3/staging/data/Tilesets.json
                                            + tools/miasto3/uklad.json (kawałek -> arkusz, kolumna, wiersz, numery kafli) + podgląd docs/miasto3/zestaw_*.png
Zasady flag: kratka z >=12% nieprzezroczystych pikseli blokuje (0x0F), reszta przechodnia; drzwi i `walk` przechodnie; `star` = rysowane nad bohaterem.
Kawałki układane deterministycznie (kolejność w REG): dopisanie nowych na końcu nie przesuwa starych."""
import os, sys, json
from PIL import Image, ImageDraw
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
PACK = r"C:\Program Files (x86)\Steam\steamapps\common\RPG Maker MZ\dlc\Fantastic Buildings - Medieval\Tilesets"
T = 48
TS_ID = 13
TS_NAME = "Kruczogród (średniowiecze)"
OUT_IMG = ROOT + "img/tilesets/Kruczogrod/"
STAGING = HERE.replace("\\", "/") + "/staging/"
SHEETS = ["B", "C", "D", "E"]                   # sloty B..E tilesetu 13 (indeksy 5-8 w tilesetNames)

_src = {}


def src(name):
    if name not in _src: _src[name] = Image.open(os.path.join(PACK, name + ".png")).convert("RGBA")
    return _src[name]


def tile_img(sheet, c, r, flip=False):
    im = src(sheet).crop((c * T, r * T, c * T + T, r * T + T))
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im


# ------------------------------------------------------------------------------------------------ kawałki
# cells[y][x] = (arkusz paczki, kolumna, wiersz, odbicie) albo None
def rect(sheet, x0, y0, x1, y1, flip=False):
    xs = list(range(x0, x1 + 1))
    if flip: xs = xs[::-1]
    return [[(sheet, x, y, flip) for x in xs] for y in range(y0, y1 + 1)]


def rows(sheet, cols, rws, flip=False):
    cols = list(cols)
    if flip: cols = cols[::-1]
    return [[(sheet, c, r, flip) for c in cols] for r in rws]


def stack(*parts):
    out = []
    for p in parts: out += p
    return out


class P:
    def __init__(self, key, cells, door=None, walk=(), star=(), block=(), what="", status="ok", paint=None):
        self.key, self.cells, self.door, self.paint = key, cells, door, paint
        self.walk, self.star, self.block, self.what, self.status = set(walk), set(star), set(block), what, status
        self.h, self.w = len(cells), len(cells[0])


REG = []


def paint_schody(img, x0, y0):
    """kamienne schody w kolorze paczki: 3 kolumny (lewa, środek, prawa) x 2 rzędy po dwa stopnie"""
    from PIL import ImageDraw
    base = tile_img("City_TileE", 12, 1)
    for i in range(3):
        for j in range(2):
            t = base.copy()
            d = ImageDraw.Draw(t, "RGBA")
            for k in range(2):
                y = k * 24
                d.rectangle([0, y, 47, y + 2], fill=(255, 244, 214, 120))
                d.rectangle([0, y + 15, 47, y + 23], fill=(30, 24, 18, 105))
            if i == 0: d.rectangle([0, 0, 3, 47], fill=(30, 24, 18, 150))
            if i == 2: d.rectangle([44, 0, 47, 47], fill=(30, 24, 18, 150))
            img.alpha_composite(t, ((x0 + i) * T, (y0 + j) * T))


def add(*a, **k):
    REG.append(P(*a, **k))


# ---- mur miejski (City_TileE): poziomy 4 rzędy, wieże 2x4, pionowy 2 kolumny
add("schody", [[None] * 3, [None] * 3], walk=[(i, j) for i in range(3) for j in range(2)], paint=paint_schody, what="kamienne schody (lewa, środek, prawa) x 2 rzędy")
add("mur_h", rows("City_TileE", (12, 13), (1, 2, 3, 5)), what="mur poziomy, 4 rzędy, powtarzać co 2 kratki (kolumny 12,13)")
add("mur_h3", rows("City_TileE", (12, 13), (2, 3, 5)), what="mur niski 3 rzędy (ogród rycerzy)")
add("mur_nadproze", rows("City_TileE", (12, 13), (1, 2)), star=[(0, 0), (1, 0), (0, 1), (1, 1)], what="nadproże bramy (2 rzędy: chodnik + blanki), przechodnie pod spodem (gwiazdka)")
add("wieza", rows("City_TileE", (9, 10), (1, 2, 3, 5)), what="baszta 2x4 ze strzelnicą")
add("wieza3", rows("City_TileE", (9, 10), (2, 3, 5)), what="baszta 2x3 (narożnik ogrodu)")
add("mur_v_gora", rows("City_TileE", (9, 10), (6, 7)), what="mur pionowy: zwieńczenie baszty u góry (2 rzędy)")
add("mur_v", rows("City_TileE", (9, 10), (8, 9, 10, 11, 12)), what="mur pionowy: odcinek środkowy 5 rzędów, powtarzać")
add("mur_v_dol", rows("City_TileE", (9, 10), (13, 14, 15)), what="mur pionowy: dół odcinka z wieżą (3 rzędy)")

# ---- budynki
# tawerna: gildia (dom cechowy z godłem) + dwa skrzydła z kamienicy (to samo po obu stronach)
add("gildia", rect("City_TileD", 8, 0, 12, 9), door=(2, 9), what="front tawerny: dom cechowy z czerwonym godłem, podwójne drzwi")
add("kamienica", rect("City_TileC", 2, 0, 7, 8), what="skrzydło tawerny (długa kamienica z lukarnami), bez drzwi")
add("stajnia", rect("Rural_TileE", 0, 12, 7, 15), door=(6, 3), what="stajnia pod strzechą z końmi w boksach, drzwi z prawej")
add("wozownia", rect("Rural_TileD", 0, 11, 7, 15), what="wozownia z bali z zagrodą dla konia (bez drzwi, tło podwórza)")
add("kosciol_l", rect("City_TileE", 0, 0, 4, 11), door=(4, 11), what="kaplica: lewa część (5 kolumn), prawa część stoi w drugiej połówce arkusza w tych samych rzędach")
add("kosciol_p", rect("City_TileE", 5, 0, 8, 11), what="kaplica: prawa część (4 kolumny)")
# domy (wstępny przydział, drzwi do sprawdzenia w fazie 2)
add("dom_waski", rect("City_TileB", 0, 0, 2, 7), door=(0, 7), status="sprawdzić", what="wąski dom z lukarną")
add("dom_kwiaty", rect("City_TileB", 3, 0, 7, 5), door=(2, 5), status="sprawdzić", what="dom z balkonem pełnym kwiatów")
add("sklep", rect("City_TileD", 0, 0, 3, 9), door=(2, 9), status="sprawdzić", what="dom z kramem w oknie (piekarnia, szwaczka)")
add("dom_szachulec", rect("City_TileD", 4, 0, 7, 7), door=(1, 7), status="sprawdzić", what="szachulec z kamienną parterową izbą")
add("dom_wieza", rect("City_TileD", 13, 0, 15, 7), door=(1, 7), status="sprawdzić", what="kamienny dom-wieża (strażnica, izba pod skałą)")
add("dom_pietrowy", stack(rect("City_TileC", 8, 1, 11, 7), rect("City_TileC", 8, 13, 11, 15)), door=(2, 9), status="sprawdzić", what="dom piętrowy: szachulec nad parterem z podwójnymi drzwiami")
add("chata_a", rect("Rural_TileD", 8, 11, 11, 14), door=(2, 3), status="sprawdzić", what="mała chata pod strzechą z lukarną")
add("chata_b", rect("Rural_TileD", 12, 10, 15, 15), door=(2, 5), status="sprawdzić", what="chata pod strzechą z oknami")
add("chata_c", rect("Rural_TileD", 8, 0, 11, 4), door=(1, 4), status="sprawdzić", what="mała chata z kwiatami w oknie")
add("chata_e", rect("Rural_TileE", 0, 0, 2, 5), door=(1, 5), status="sprawdzić", what="wąska chata pod strzechą na słupach")
add("chata_bale", rect("Rural_TileC", 4, 10, 8, 15), door=(2, 5), status="sprawdzić", what="chata z bali z czerwonymi kwiatami")
add("chata_bale2", rect("Rural_TileC", 8, 5, 13, 8), door=(1, 3), status="sprawdzić", what="długa chata z bali z słonecznikami")
add("izba", rect("City_TileD", 13, 4, 15, 7), door=(1, 3), status="sprawdzić", what="kamienna izba przy murze (Izba pod skałą)")
add("ratusz", rect("Rural_TileE", 8, 0, 15, 7), door=(1, 7), walk=[(6, 7)], status="sprawdzić", what="ratusz: hala z arkadami, drzwi (1,7) i kancelaria (6,7)")
add("szubienica", rect("City_TileD", 14, 12, 15, 15), what="szubienica na pagórku")
add("dzwonnica", rect("Rural_TileE", 0, 0, 5, 5), door=(3, 5), walk=[(2, 5)], status="sprawdzić", what="drewniana dzwonnica z dzwonem (lina i dzwonnik w lewej kratce drzwi)")
add("znaki", rect("City_TileB", 0, 8, 2, 15), what="szyldy cechów (kowal, piekarz, karczma, apteka...)")
add("latarnie", rect("City_TileB", 6, 13, 7, 15), star=[(0, 0), (1, 0)], what="latarnie uliczne (górna kratka nad bohaterem)")
add("komin", rect("City_TileB", 3, 0, 4, 1), what="komin z dachem")
add("drzwi_kamienne", rect("City_TileD", 5, 6, 5, 7), door=(0, 1), what="drzwi w kamiennej ścianie")
add("drzwi_luk", rect("City_TileD", 2, 8, 2, 9), door=(0, 1), what="drzwi w łuku z oknami")
add("schody_drewniane", rect("City_TileB", 1, 10, 2, 12), walk=[(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2)], what="schody drewniane z poręczą")
# bramy / studnia / kramy / rekwizyty
add("studnia", rect("City_TileD", 8, 10, 11, 14), what="ośmiokątna cembrowina studni")
add("kratki", rect("Rural_TileB", 0, 10, 3, 12), what="grządki warzywne w płotku")
add("beczki", rect("Rural_TileB", 0, 13, 2, 14), what="balie i beczki, skrzynia")


def cov(cell):
    s, c, r, f = cell
    a = np.asarray(src(s).crop((c * T, r * T, c * T + T, r * T + T)))[..., 3]
    return float((a > 16).mean())


B_KEYS = {"kamienica", "dom_pietrowy", "dom_waski", "dom_kwiaty", "sklep", "dom_szachulec", "dom_wieza", "izba", "znaki", "komin", "drzwi_kamienne", "drzwi_luk", "schody_drewniane"}
C_KEYS = {"gildia", "kosciol_l", "kosciol_p", "ratusz"}
D_KEYS = {"dzwonnica", "stajnia", "wozownia", "chata_a", "chata_b", "chata_c", "chata_e", "chata_bale", "chata_bale2", "studnia", "kratki", "beczki", "szubienica"}


def wall(p):
    """mury, baszty i schody leżą na arkuszu E (wspólnym z tilesetami sąsiednich map: 14 = zestaw 11 + E, 15 = zestaw 9 + E)"""
    return p.key.startswith("mur_") or p.key.startswith("wieza") or p.key == "schody"


def pref(p):
    if wall(p): return "E"
    if p.key in B_KEYS: return "B"
    if p.key in C_KEYS: return "C"
    if p.key in D_KEYS: return "D"
    return "E"


def _try_layout(seed):
    import random as _r
    rr = _r.Random(seed)
    grids = {s: np.zeros((16, 16), bool) for s in SHEETS}
    grids['B'][0, 0] = True      # kratka 0 arkusza B to pusty kafel (id 0)
    pos = {}
    grp = {"E": 0, "B": 1, "C": 2, "D": 3}
    order = sorted(REG, key=lambda q: (grp[pref(q)], -q.w * q.h * (0.6 + 0.8 * rr.random()) if seed else -q.w * q.h))
    for p in order:
        if p.key == "kosciol_p": continue
        done = False
        for s in [pref(p)] + [t for t in "BCDE" if t != pref(p)]:
            g = grids[s]
            xs = list(range(0, 9 - p.w)) + list(range(8, 17 - p.w))
            mate = next((q for q in REG if q.key == "kosciol_p"), None) if p.key == "kosciol_l" else None
            for y0 in range(0, 17 - p.h):
                for x0 in xs:
                    if g[y0:y0 + p.h, x0:x0 + p.w].any(): continue
                    if mate is not None:
                        if g[y0:y0 + p.h, 8:8 + mate.w].any() or x0 + p.w > 8: continue
                        g[y0:y0 + p.h, 8:8 + mate.w] = True
                        pos[mate.key] = (s, 8, y0)
                    g[y0:y0 + p.h, x0:x0 + p.w] = True
                    pos[p.key] = (s, x0, y0)
                    done = True
                    break
                if done: break
            if done: break
        if not done: return None
    return pos


def layout():
    """B: domy, C: duże i publiczne, D: wiejskie / stajnia, E: mury i drobne części (kolejność grup, w grupie losowe poszukiwanie ułożenia - ziarno deterministyczne).
    Każdy kawałek leży w jednej połówce arkusza (8 kolumn); kaplica = dwie części w tych samych rzędach, po jednej w każdej połówce"""
    for seed in range(0, 4000):
        pos = _try_layout(seed)
        if pos: return pos
    raise SystemExit("brak miejsca na kawałki")


def tid(sheet, c, r):
    """numer kafla B-E (jak w MZ)"""
    return SHEETS.index(sheet) * 256 + (c // 8) * 128 + r * 8 + c % 8


def build(write=True):
    pos = layout()
    sheets = {s: Image.new("RGBA", (768, 768), (0, 0, 0, 0)) for s in SHEETS}
    flags = [0] * 8192
    flags[0] = 0x10          # pusty kafel (id 0): gwiazdka, jak w domyślnych zestawach - inaczej każda kratka byłaby przechodnia
    uklad = {}
    for p in REG:
        s, x0, y0 = pos[p.key]
        ids = []
        if p.paint: p.paint(sheets[s], x0, y0)
        for j, rowc in enumerate(p.cells):
            idr = []
            for i, cell in enumerate(rowc):
                t = tid(s, x0 + i, y0 + j)
                idr.append(t)
                if cell is None: continue
                sh, c, r, f = cell
                sheets[s].alpha_composite(tile_img(sh, c, r, f), ((x0 + i) * T, (y0 + j) * T))
                fl = 0
                walk = (i, j) in p.walk or (p.door is not None and (i, j) == p.door)
                if (i, j) in p.block or (cov(cell) >= 0.12 and not walk): fl = 0x0F
                if (i, j) in p.star: fl = 0x10
                flags[t] = fl
            ids.append(idr)
        uklad[p.key] = {"arkusz": s, "kol": x0, "wiersz": y0, "w": p.w, "h": p.h, "drzwi": list(p.door) if p.door else None,
                        "kafle": ids, "opis": p.what, "status": p.status}
    if "kosciol_l" in uklad:
        l_, r_ = uklad["kosciol_l"], uklad["kosciol_p"]
        uklad["kosciol"] = {"arkusz": l_["arkusz"], "kol": l_["kol"], "wiersz": l_["wiersz"], "w": l_["w"] + r_["w"], "h": l_["h"], "drzwi": l_["drzwi"],
                            "kafle": [a + b for a, b in zip(l_["kafle"], r_["kafle"])], "opis": "kaplica (kościół) - w arkuszu dwie połówki", "status": "sprawdzić"}
    if write:
        os.makedirs(OUT_IMG, exist_ok=True)
        for s in SHEETS: sheets[s].save(OUT_IMG + "Miasto_%s.png" % s)
        ts = json.load(open(ROOT + "data/Tilesets.json", encoding="utf-8"))
        base = ts[11]
        fl11 = list(base["flags"]) + [0] * (8192 - len(base["flags"]))
        for i in range(1024, 8192): flags[i] = fl11[i]
        new = dict(base)
        new.update({"id": TS_ID, "name": TS_NAME, "note": "Kruczogród: budynki z paczki Fantastic Buildings: Medieval (tools/miasto3/kit.py)", "flags": flags})
        names = list(base["tilesetNames"])
        for k, s in enumerate(SHEETS): names[5 + k] = "Kruczogrod/Miasto_" + s
        new["tilesetNames"] = names
        os.makedirs(STAGING + "data", exist_ok=True)
        # staged Tilesets.json = real file with entry 13 replaced (the real file stays untouched)
        ts = list(ts) + [None] * (TS_ID + 1 - len(ts))
        ts[TS_ID] = new
        # 14 = zestaw 11 (Map024, Map111) z arkuszem E = Miasto_E, 15 = zestaw 9 (Map003, Map004) z arkuszem E = Miasto_E: ten sam mur, te same numery kafli
        for nid, bid, nm in ((14, 11, "Mur Kruczogrodu na zestawie 11 (sąsiedzi)"), (15, 9, "Mur Kruczogrodu na zestawie 9 (sąsiedzi)")):
            b = ts[bid]
            f0 = list(b["flags"]) + [0] * (8192 - len(b["flags"]))
            for i in range(768, 1024): f0[i] = flags[i]
            nn = dict(b)
            nn.update({"id": nid, "name": nm, "flags": f0})
            names2 = list(b["tilesetNames"]); names2[8] = "Kruczogrod/Miasto_E"
            nn["tilesetNames"] = names2
            ts[nid] = nn
        # 16 = zestaw 11 dla Podgrodzia (Map111): jego arkusz E (dachy Winlu) zostaje tylko z 24 używanymi kaflami, a mur z Miasto_E ląduje w prawej połówce (+128 do numeru)
        b = ts[11]
        ro = Image.open(ROOT + "img/tilesets/" + b["tilesetNames"][8] + ".png").convert("RGBA")
        used = [25, 26, 27, 33, 34, 35, 41, 42, 43, 44, 45, 49, 50, 51, 52, 53, 57, 58, 59, 60, 61, 66, 68, 69]
        e111 = Image.new("RGBA", (768, 768), (0, 0, 0, 0))
        for u in used:
            c, r = u % 8, u // 8
            e111.alpha_composite(ro.crop((c * T, r * T, c * T + T, r * T + T)), (c * T, r * T))
        f16 = list(b["flags"]) + [0] * (8192 - len(b["flags"]))
        for i in range(768, 1024):
            if (i - 768) not in used: f16[i] = 0
        for p_ in REG:
            if not wall(p_): continue
            s_, x0, y0 = pos[p_.key]
            sh_ = 8 if x0 < 8 else 0
            for j in range(p_.h):
                for i in range(p_.w):
                    e111.alpha_composite(sheets["E"].crop(((x0 + i) * T, (y0 + j) * T, (x0 + i + 1) * T, (y0 + j + 1) * T)), ((sh_ + x0 + i) * T, (y0 + j) * T))
                    f16[768 + 128 + (y0 + j) * 8 + (x0 + i) % 8] = flags[tid("E", x0 + i, y0 + j)]
        e111.save(OUT_IMG + "Mury_Podgrodzie.png")
        nn = dict(b)
        nn.update({"id": 16, "name": "Mur Kruczogrodu na zestawie 11 dla Podgrodzia", "flags": f16})
        nm = list(b["tilesetNames"]); nm[8] = "Kruczogrod/Mury_Podgrodzie"
        nn["tilesetNames"] = nm
        ts = list(ts) + [None] * (17 - len(ts))
        ts[16] = nn
        dump(STAGING + "data/Tilesets.json", ts)
        json.dump(uklad, open(HERE + "/uklad.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return uklad, flags, sheets, pos


def dump(path, obj):
    """JSON jak edytor: tablica, jeden element w linii (LF)"""
    lines = ["["] + [json.dumps(o, ensure_ascii=False, separators=(",", ":")) + ("," if i < len(obj) - 1 else "") for i, o in enumerate(obj)] + ["]"]
    with open(path, "wb") as f: f.write("\n".join(lines).encode("utf-8"))


def mapa_obrazek(sheets, pos):
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


def preview(sheets, pos):
    os.makedirs(ROOT + "docs/miasto3", exist_ok=True)
    for s in SHEETS:
        bg = Image.new("RGBA", (768 + 24, 768 + 14), (60, 62, 66, 255)); bg.alpha_composite(sheets[s], (24, 14))
        d = ImageDraw.Draw(bg)
        for i in range(16):
            d.line([(24 + i * T, 14), (24 + i * T, 782)], fill=(255, 60, 60, 80)); d.line([(24, 14 + i * T), (792, 14 + i * T)], fill=(255, 60, 60, 80))
            d.text((24 + i * T + 18, 1), str(i), fill=(255, 255, 0, 255)); d.text((6, 14 + i * T + 18), str(i), fill=(255, 255, 0, 255))
        for k, (ss, x0, y0) in pos.items():
            if ss == s: d.text((24 + x0 * T + 3, 14 + y0 * T + 2), k, fill=(120, 255, 160, 255))
        bg.convert("RGB").save(ROOT + "docs/miasto3/zestaw_%s.png" % s)


if __name__ == "__main__":
    uk, fl, sh, pos = build()
    preview(sh, pos)
    mapa_obrazek(sh, pos)
    print({s: sum(1 for k, v in pos.items() if v[0] == s) for s in SHEETS}, "kawałków:", len(REG))
