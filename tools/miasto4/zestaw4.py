# -*- coding: utf-8 -*-
"""Zestaw 13 v2 dla nowego Kruczogrodu (miasto4): arkusze B-E = (a) kafle B-E budynków Winlu w stylu paczki (z mapy testowej Map027, zestaw 17)
+ (b) kawałki paczki Fantastic Buildings: Medieval użyte w mieście. A3/A4 zestawu 13 = Styl_FB/A3, A4; A1/A2/A5 bez zmian (Styl_B).
Pisze: img/tilesets/Kruczogrod/Miasto2_{B,C,D,E}.png (nowe pliki), tools/miasto4/uklad4.json, tools/miasto4/staging/data/Tilesets.json
(prawdziwy plik z podmienionym wpisem 13), docs/miasto3/ZESTAW_13.md + docs/miasto4/zestaw_13_v2.png.   python tools/miasto4/zestaw4.py"""
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/miasto3")
import kit                                   # rejestr kawałków paczki + obrazy
from PIL import Image, ImageDraw, ImageFont
import numpy as np
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

T = 48
SHEETS = ["B", "C", "D", "E"]
OUT_IMG = ROOT + "img/tilesets/Kruczogrod/"
STG = HERE.replace("\\", "/") + "/staging/"


def load(p): return json.load(open(p, encoding="utf-8"))


TS = load(ROOT + "data/Tilesets.json")
M27 = load(ROOT + "data/Map027.json")
OLDUK = load(ROOT + "tools/miasto3/uklad.json")
F17, F13 = TS[17]["flags"], TS[13]["flags"]
W27, H27 = M27["width"], M27["height"]


def t27(z, x, y): return M27["data"][(z * H27 + y) * W27 + x]


# ---------------------------------------------------------------- budynki Winlu z mapy testowej (prostokąty w Map027)
WINLU = {   # klucz: (x0, y0, x1, y1) w Map027
    "w_kamienica": (5, 24, 12, 35), "w_ratusz": (17, 24, 24, 33), "w_kuznia": (29, 24, 40, 30), "w_kantor": (47, 24, 56, 30),
    "w_piekarnia": (45, 40, 50, 49), "w_straznica": (36, 40, 40, 46), "w_dom15": (61, 23, 68, 32), "w_woziwoda": (4, 41, 9, 46),
    "w_izba": (14, 40, 19, 44), "w_grabarz": (25, 41, 29, 44), "w_studnia": (69, 14, 70, 17),
}
# zdarzenia mapy testowej, które należą do budynku, a leżą poza prostokątem (id: klucz)
WINLU_EXTRA_EV = {}
SKIP_EV = ("Stare", "Powr", "Nowe")


def sheet_img(name_idx, ts=TS[17]):
    return Image.open(ROOT + "img/tilesets/" + ts["tilesetNames"][name_idx] + ".png").convert("RGBA")


_s17 = {}


def tile17(t):
    s = t // 256
    if s not in _s17: _s17[s] = sheet_img(5 + s)
    w = t % 256
    c, r = (w // 128) * 8 + w % 8, (w % 128) // 8
    return _s17[s].crop((c * T, r * T, c * T + T, r * T + T))


def is_ground(t): return t >= 2048 and (t - 2048) // 48 == 19


class Block:
    """prostokąt w arkuszu: cells[(i, j)] = (obraz RGBA, flaga); mate = druga połówka (tych samych rzędów w drugiej połówce palety)"""
    def __init__(self, key, cells, what=""):
        self.key, self.cells, self.what = key, cells, what
        self.w = max(i for i, j in cells) + 1
        self.h = max(j for i, j in cells) + 1
        self.mate = None
        self.pos = None      # (arkusz, kolumna, wiersz)
        self.items = None    # mozaika: lista (obraz, flaga, źródło) - szerokość dobierana przy układaniu

    def reshape(self, w):
        self.cw = w
        self.cells = {(n % w, n // w): v for n, v in enumerate(self.items)}
        self.w = min(w, len(self.items)); self.h = (len(self.items) + w - 1) // w


def tid(sheet, c, r): return SHEETS.index(sheet) * 256 + (c // 8) * 128 + r * 8 + c % 8


def build_blocks(pack_keep):
    blocks, uk = [], {}
    # ---- kawałki paczki: kafle z oryginałów, flagi z dotychczasowego zestawu 13 (te same numery w uklad.json)
    for p in kit.REG:
        if p.key not in pack_keep: continue
        cells = {}
        old = OLDUK[p.key]["kafle"]
        for j, row in enumerate(p.cells):
            for i, cell in enumerate(row):
                if cell is None: continue
                sh, c, r, f = cell
                cells[(i, j)] = (kit.tile_img(sh, c, r, f), F13[old[j][i]], old[j][i])
        b = Block(p.key, cells, p.what)
        b.w, b.h = p.w, p.h
        blocks.append(b)
        uk[p.key] = {"w": p.w, "h": p.h, "drzwi": list(p.door) if p.door else None, "opis": p.what, "typ": "paczka", "stare": {"%d,%d" % ij: v[2] for ij, v in cells.items()}}
    # ---- Winlu
    for key, (x0, y0, x1, y1) in WINLU.items():
        w, h = x1 - x0 + 1, y1 - y0 + 1
        auto, tiles = {}, {}
        for z in range(4):
            for j in range(h):
                for i in range(w):
                    t = t27(z, x0 + i, y0 + j)
                    if t == 0: continue
                    if t < 1024: tiles[(z, i, j)] = t
                    elif not (z == 0 and is_ground(t)): auto["%d,%d,%d" % (z, i, j)] = t
        evs = []
        for e in M27["events"]:
            if not e: continue
            if any(e["name"].startswith(sk) for sk in SKIP_EV): continue
            if x0 - 1 <= e["x"] <= x1 + 1 and y0 - 1 <= e["y"] <= y1 + 1:
                evs.append({"i": e["x"] - x0, "j": e["y"] - y0, "ev": e})
        evt = []
        for q in evs:
            for pg in q["ev"]["pages"]:
                tt = pg["image"].get("tileId", 0)
                if 0 < tt < 1024 and tt not in evt: evt.append(tt)
        # jeden blok-mozaika z unikalnych kafli budynku (kolejność czytania); układ w mapie opisuje "kafle": [z, nowy numer] per kratka
        order = []
        for j in range(h):
            for i in range(w):
                for z in (0, 1, 2, 3):
                    t = tiles.get((z, i, j))
                    if t is not None and t not in order: order.append(t)
        order += [t for t in evt if t not in order]
        cw = min(8, len(order))
        cells = {(n % 8, n // 8): (tile17(t), F17[t], t) for n, t in enumerate(order)}
        bk = key
        mb = Block(bk, cells, "mozaika kafli budynku Winlu (kolejność czytania budynku od lewej-górnej)")
        mb.items = [(tile17(t), F17[t], t) for t in order]
        blocks.append(mb)
        gk = [{"blok": bk, "order": order, "tiles": {"%d,%d,%d" % zij: t for zij, t in tiles.items()}}]
        uk[key] = {"w": w, "h": h, "typ": "winlu", "auto": auto, "grupy": gk, "zdarzenia": evs, "_evt": evt, "opis": "budynek Winlu z mapy testowej Map027"}
    return blocks, uk


def split_wide(blocks):
    out = []
    for b in blocks:
        if b.w > 8:
            l = Block(b.key, {c: v for c, v in b.cells.items() if c[0] < 8}, b.what)
            r = Block(b.key + "~p", {(c[0] - 8, c[1]): v for c, v in b.cells.items() if c[0] >= 8}, b.what)
            l.h = r.h = b.h
            l.mate = r
            out += [l]
        else: out.append(b)
    return out


def layout(blocks, seed=0):
    import random
    rr = random.Random(seed)
    grids = {s: np.zeros((16, 16), bool) for s in SHEETS}
    grids["B"][0, 0] = True
    for b in blocks:
        if b.items is not None: b.reshape(rr.choice((4, 5, 6, 7, 8)) if seed else 8)
    order = sorted(blocks, key=lambda q: -(q.w * q.h) * (0.7 + 0.6 * rr.random() if seed else 1))
    for b in order:
        done = False
        for s in SHEETS:
            g = grids[s]
            xs = list(range(0, 9 - b.w)) + list(range(8, 17 - b.w))
            for y0 in range(0, 17 - b.h):
                for x0 in xs:
                    if g[y0:y0 + b.h, x0:x0 + b.w].any(): continue
                    if b.mate is not None:
                        if x0 + b.w > 8: continue
                        if g[y0:y0 + b.h, 8:8 + b.mate.w].any(): continue
                        g[y0:y0 + b.h, 8:8 + b.mate.w] = True
                        b.mate.pos = (s, 8, y0)
                    g[y0:y0 + b.h, x0:x0 + b.w] = True
                    b.pos = (s, x0, y0)
                    done = True
                    break
                if done: break
            if done: break
        if not done: return None
    return True


# zestaw kawałków paczki używanych w nowym mieście (reszta nie trafia do arkuszy)
PACK_KEEP = ["mur_h", "mur_h3", "wieza3", "mur_nadproze", "wieza", "mur_v_gora", "mur_v", "mur_v_dol",
             "gildia", "kamienica", "stajnia", "wozownia", "kosciol_l", "kosciol_p", "szubienica",
             "dom_kwiaty", "sklep", "dom_szachulec", "dom_wieza", "chata_a", "chata_b", "chata_c", "chata_bale",
             "dzwonnica", "kratki", "ratusz"]


DROP_ORDER = ['beczki', 'chata_bale', 'chata_e']


def main(write=True):
    keep = list(PACK_KEEP)
    while True:
        blocks, uk = build_blocks(keep)
        blocks = split_wide(blocks)
        # kaplica: lewa + prawa połówka w tych samych rzędach
        kl = next(b for b in blocks if b.key == "kosciol_l"); kp = next(b for b in blocks if b.key == "kosciol_p")
        kl.mate = kp
        blocks = [b for b in blocks if b.key != "kosciol_p"]
        for s in range(0, 6000):
            if layout(blocks, s): break
        else:
            drop = keep.pop(keep.index(DROP_ORDER.pop(0)))
            print("brak miejsca, odpada:", drop)
            continue
        break
    allb = list(blocks) + [b.mate for b in blocks if b.mate is not None]
    sheets = {s: Image.new("RGBA", (768, 768), (0, 0, 0, 0)) for s in SHEETS}
    flags = list(F13) + [0] * (8192 - len(F13))
    for i in range(0, 1024): flags[i] = 0
    flags[0] = 0x10
    for i in range(1536, 4352): pass
    for i in range(4352, 8192): flags[i] = F17[i]         # A3/A4: jak zestaw 17 (te same flagi co 11)
    newid = {}           # (blok, i, j) -> nowy numer kafla;  stare numery (uklad.json miasto3) -> nowe
    old2new = {}
    for b in allb:
        s, x0, y0 = b.pos
        for (i, j), (im, fl, src) in b.cells.items():
            sheets[s].alpha_composite(im, ((x0 + i) * T, (y0 + j) * T))
            t = tid(s, x0 + i, y0 + j)
            flags[t] = fl
            newid[(b.key, i, j)] = t
    # wyniki do uklad4.json
    out = {}
    for key, u in uk.items():
        if u["typ"] == "paczka":
            kafle = []
            for j in range(u["h"]):
                row = []
                for i in range(u["w"]):
                    row.append(newid.get((key, i, j), 0))
                kafle.append(row)
            if key == "kosciol_l":
                pass
            u = dict(u); u["kafle"] = kafle
            for ij, old in u.pop("stare").items():
                i, j = map(int, ij.split(","))
                old2new[old] = kafle[j][i]
            out[key] = u
        else:
            u = dict(u)
            g = u.pop("grupy")[0]
            b = next(bb for bb in allb if bb.key == g["blok"])
            n2 = {t: newid[(b.key, n % b.cw, n // b.cw)] for n, t in enumerate(g["order"])}
            u["kafle"] = {k: [int(k.split(",")[0]), n2[t]] for k, t in g["tiles"].items()}
            u["evtile"] = {str(t): n2[t] for t in u.pop("_evt")}
            out[key] = u
    kp_ = out["kosciol_p"]; kl_ = out["kosciol_l"]
    out["kosciol"] = {"w": kl_["w"] + kp_["w"], "h": kl_["h"], "drzwi": kl_["drzwi"], "typ": "paczka", "opis": "kaplica (dwie połówki arkusza)",
                      "kafle": [a + b for a, b in zip(kl_["kafle"], kp_["kafle"])]}
    # miejsce na arkuszach (do dokumentacji)
    pos = {b.key: b.pos for b in allb}
    if write:
        os.makedirs(OUT_IMG, exist_ok=True)
        for s in SHEETS: sheets[s].save(OUT_IMG + "Miasto2_%s.png" % s)
        json.dump({"uklad": out, "stare_na_nowe": {str(k): v for k, v in old2new.items()}, "pozycje": {k: list(v) for k, v in pos.items()}},
                  open(HERE + "/uklad4.json", "w", encoding="utf-8"), ensure_ascii=False)
        # Tilesets.json (staging): prawdziwy plik, wpis 13 zmieniony
        ts = copy.deepcopy(TS)
        e = ts[13]
        names = list(e["tilesetNames"])
        names[2], names[3] = "Styl_FB/A3", "Styl_FB/A4"
        for k, s in enumerate(SHEETS): names[5 + k] = "Kruczogrod/Miasto2_" + s
        e["tilesetNames"] = names
        e["flags"] = flags
        e["note"] = "Kruczogród v2: budynki Winlu w stylu paczki + paczka Fantastic Buildings (tools/miasto4/zestaw4.py)"
        os.makedirs(STG + "data", exist_ok=True)
        kit.dump(STG + "data/Tilesets.json", ts)
        mapa_obrazek(sheets, allb)
        opis(out, pos, allb)
    used = {s: int(sum(b.w * b.h for b in allb if b.pos[0] == s)) for s in SHEETS}
    print("bloków:", len(allb), "zajęte kratki:", used, "odpadły:", [k for k in PACK_KEEP if k not in keep])
    return out, old2new, flags


def mapa_obrazek(sheets, allb):
    f = ImageFont.truetype(ROOT + "fonts/AlegreyaSans-Bold.ttf", 14)
    W2 = 768 + 20
    out = Image.new("RGB", (2 * W2, 2 * (768 + 36)), (30, 32, 36))
    d = ImageDraw.Draw(out)
    for k, s_ in enumerate(SHEETS):
        ox, oy = (k % 2) * W2 + 10, (k // 2) * (768 + 36) + 26
        bg = Image.new("RGBA", (768, 768), (70, 72, 78, 255)); bg.alpha_composite(sheets[s_])
        out.paste(bg.convert("RGB"), (ox, oy))
        d.text((ox, oy - 22), "Arkusz %s" % s_, font=f, fill=(255, 220, 90))
        d.line([(ox + 8 * T, oy), (ox + 8 * T, oy + 768)], fill=(255, 220, 0), width=2)
        for b in allb:
            if b.pos[0] != s_: continue
            _, x0, y0 = b.pos
            d.rectangle([ox + x0 * T + 1, oy + y0 * T + 1, ox + (x0 + b.w) * T - 2, oy + (y0 + b.h) * T - 2], outline=(90, 255, 140), width=2)
            d.rectangle([ox + x0 * T + 2, oy + y0 * T + 2, ox + x0 * T + 8 + len(b.key) * 7, oy + y0 * T + 18], fill=(0, 0, 0))
            d.text((ox + x0 * T + 4, oy + y0 * T + 3), b.key, font=f, fill=(120, 255, 160))
    os.makedirs(ROOT + "docs/miasto4", exist_ok=True)
    out.save(ROOT + "docs/miasto4/zestaw_13_v2.png")




def opis(out, pos, allb):
    """docs/miasto3/ZESTAW_13.md - przewodnik do ręcznych poprawek w edytorze (generowany)"""
    L = ["# Zestaw 13 \"Kruczogród (średniowiecze)\" v2 - przewodnik do ręcznych poprawek w edytorze", "",
         "Wersja z przebudowy miasta (miasto4, 2026-11-08). Zestaw 13 = A1/A2/A5 jak zestaw 11 (Styl_B), **A3 i A4 = `Styl_FB/A3`, `Styl_FB/A4`** (dachy i ściany budynków Winlu w stylu paczki, jak na mapie testowej Map027 / zestaw 17) + cztery własne arkusze B, C, D, E: `img/tilesets/Kruczogrod/Miasto2_B..E.png`.",
         "Obraz z ramkami i nazwami: `docs/miasto4/zestaw_13_v2.png` (żółta kreska = granica połówek palety: w edytorze każdy arkusz to dwie połówki po 8 kolumn, jedna nad drugą).", "",
         "## Zasady", "",
         "- Kawałki paczki (Fantastic Buildings: Medieval) i budynki Winlu leżą w arkuszach w całości w jednej połówce (maks. 8 kolumn); kaplica to dwie części (`kosciol_l`, `kosciol_p`) w tych samych rzędach obu połówek; szeroka kuźnia (12 kolumn) tak samo (`w_kuznia` + `w_kuznia~p`).",
         "- **Budynki Winlu (`w_*`) to mozaiki**: w arkuszu leżą tylko kafle B-E użyte przez budynek (kolejność czytania budynku od lewej-górnej), bez powtórzeń; dachy i ściany tych budynków to autokafle A3/A4 (Styl_FB), więc budynek składa się z autokafli + kafli z mozaiki. Gotowe budynki najłatwiej kopiować z mapy (Map008 / Map027).",
         "- Flagi przejścia: kawałki paczki - dotychczasowe z zestawu 13 (korpusy blokują, drzwi przechodnie, nadproże bramy ma gwiazdkę); kafle Winlu - skopiowane z zestawu 17 (mapa testowa). Kratka 0 arkusza B jest pusta z gwiazdką.",
         "- Rodzaje podłoża: bruk = autokafel A2 rodzaj 19 (zawsze kształt 0, pełny środek, bez trawiastych brzegów); ogrody, sady, zieleńce = trawa (27) z miękkim brzegiem i kwiatami (28); podwórza warsztatów = ziemia (17); płoty: 22 (rygle), 38 (kłody).",
         "- Drzwi: zdarzenie przeniesienia stoi na kratce drzwi; drzwi budynków Winlu rysuje zdarzenie z obrazkiem `!Fantasy_door*_FB`, ozdoby (okna dachowe, szyldy, latarnie) to zdarzenia `*_FB`.",
         "- Źródło układu: `tools/miasto4/uklad4.json` (buduje `tools/miasto4/zestaw4.py`), mapa składana `tools/miasto4/build4.py`.", ""]
    by = {}
    for b in allb: by.setdefault(b.pos[0], []).append(b)
    for sh in SHEETS:
        L.append("## Arkusz %s" % sh); L.append("")
        for b in sorted(by.get(sh, []), key=lambda q: (q.pos[2], q.pos[1])):
            u = out.get(b.key.split("~")[0], {})
            d = u.get("drzwi")
            L.append("- `%s` - kol. %d, wiersz %d, %dx%d%s - %s" % (b.key, b.pos[1], b.pos[2], b.w, b.h, ("; drzwi: kolumna %d, wiersz %d" % tuple(d)) if d else "", u.get("opis", b.what)))
        L.append("")
    L.append("## Budynki w mieście (Map008) i ich wnętrza"); L.append("")
    open(ROOT + "docs/miasto3/ZESTAW_13.md", "w", encoding="utf-8", newline="\n").write("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
