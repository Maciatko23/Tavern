"""Arkusze obiektów przystani: img/characters/!$Przystan_<Nazwa>.png + objects.json + podgląd docs/przystan/obiekty.png.

Surowe obrazy (PixelLab) leżą w raw/:
  janka_proflash_1.png   Pro Flash 160x96, wzór stylu = wóz z Fantasy_Outside_C (Winlu)
  kuter_proflash_1.png   Pro Flash 240x124, wzór stylu = łódź Janka
  wrak_edit_1.png        edit Pro Flash kutra (240x144): wrak na plaży
  okret_proflash_1.png   Pro Flash 256x176, wzór stylu = wrak kutra
  prom_collage.png       prom złożony w kodzie (prom_collage.py) z kadłuba kutra + skrzynie/worki Winlu
  prom_final.png         (jeśli jest) wybrana wersja promu, inaczej prom_collage.png; od 2026-10-17 to barka z PixelLab
                         wydłużona przez build_prom.py (prom_pixellab_1.png)
Łódź mała powstaje w kodzie z łodzi Janka (krótsza, bez sieci/masztu/kosza, z beczułką).

Poprawki stylu (jak przy kamieniach/grzybach): obwódka i najciemniejsze piksele -> ciemny brąz Winlu
(56,45,47 .. 47,38,45), lekko mniejsze nasycenie; łodzie: zanurzony dół kadłuba + półprzezroczysty cień
na wodzie; wraki na lądzie: płaski cień Winlu (0,0,0,100) w prawo-dół.

Arkusz: 3 kolumny x 4 wiersze, komórka = rozmiar obiektu. Łodzie: klatki 0/1/2 = kołysanie (0/1/2 px w dół,
klatka 2 także 1 px w prawo), wiersze 1-3 = kopie wiersza 0. Nieruchome: 12 takich samych komórek.
"""
import colorsys
import json
import os
import shutil
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
RAW = os.path.join(HERE, "raw")
CHARS = os.path.join(ROOT, "img", "characters")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-14", "przystan", "obiekty")
PREVIEW = os.path.join(ROOT, "docs", "przystan", "obiekty.png")
JSON_OUT = os.path.join(HERE, "objects.json")
TILE = 48

WINLU_DARK = (47, 38, 45)
WINLU_OUT = (56, 45, 47)
WINLU_OUT2 = (65, 52, 50)


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


# ---------------------------------------------------------------- poprawki stylu
def winlu_tone(img, dark=52, sat=0.93):
    """Najciemniejsze piksele (obwódka PixelLab ~ (36,20,36)) -> ciemny brąz Winlu, nasycenie x sat."""
    img = img.copy()
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            L = lum((r, g, b))
            if L < dark:
                t = L / float(dark)
                c = tuple(int(WINLU_DARK[i] + (WINLU_OUT2[i] - WINLU_DARK[i]) * t) for i in range(3))
                px[x, y] = c + (a,)
                continue
            hh, ll, ss = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
            rr, gg, bb = colorsys.hls_to_rgb(hh, ll, ss * sat)
            px[x, y] = (int(rr * 255 + 0.5), int(gg * 255 + 0.5), int(bb * 255 + 0.5), a)
    return img


def crop_bbox(img):
    bb = img.getbbox()
    return img.crop(bb) if bb else img


def drop_specks(img, min_size=6):
    """Usuwa małe oderwane grupki pikseli (okruchy po generacji)."""
    w, h = img.size
    px = img.load()
    seen = set()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 or (x, y) in seen:
                continue
            comp, stack = [], [(x, y)]
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3] > 0:
                            seen.add((nx, ny))
                            stack.append((nx, ny))
            if len(comp) < min_size:
                for (cx, cy) in comp:
                    px[cx, cy] = (0, 0, 0, 0)
    return img


def column_bottoms(img):
    w, h = img.size
    px = img.load()
    out = {}
    for x in range(w):
        for y in range(h - 1, -1, -1):
            if px[x, y][3] > 0:
                out[x] = y
                break
    return out


def waterline(img, depth=4, water=(58, 112, 120), pad=3):
    """Łódź na wodzie: dolne `depth` rzędy kadłuba lekko w kolorze wody (zanurzenie),
    pod spodem 2 rzędy półprzezroczystego cienia na wodzie (przesunięte 2 px w prawo)."""
    w, h = img.size
    out = Image.new("RGBA", (w, h + pad), (0, 0, 0, 0))
    out.alpha_composite(img, (0, 0))
    px = out.load()
    bottoms = column_bottoms(img)
    # cień na wodzie
    for x, yb in bottoms.items():
        for k, a in ((1, 70), (2, 34)):
            xx, yy = x + 2, yb + k
            if 0 <= xx < w and yy < h + pad and px[xx, yy][3] == 0:
                px[xx, yy] = (10, 30, 40, a)
    # zanurzenie
    for x, yb in bottoms.items():
        for k in range(depth):
            y = yb - k
            if y < 0:
                break
            r, g, b, a = px[x, y]
            if a < 255:
                continue
            f = 0.42 - 0.09 * k
            px[x, y] = (int(r + (water[0] - r) * f), int(g + (water[1] - g) * f), int(b + (water[2] - b) * f), 255)
    return out


def ground_shadow(img, dx=7, dy=2, squash=0.45, alpha=100):
    """Płaski cień Winlu (czarny, alfa 100): sylwetka spłaszczona i przesunięta w prawo-dół, tylko pod obiektem."""
    w, h = img.size
    a = img.split()[3].point(lambda v: 255 if v > 0 else 0)
    sh_h = max(1, int(h * squash))
    sil = a.resize((w, sh_h), Image.NEAREST)
    out = Image.new("RGBA", (w + dx + 2, h + dy + 2), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (w, sh_h), (0, 0, 0, alpha))
    layer = Image.new("RGBA", out.size, (0, 0, 0, 0))
    layer.paste(shadow, (dx, h - sh_h + dy), sil)
    out.alpha_composite(layer)
    out.alpha_composite(img, (0, 0))
    return out


# ---------------------------------------------------------------- łódź mała z łodzi Janka
def keg():
    O, T, t, R = WINLU_OUT, (178, 152, 116), (152, 126, 96), (98, 78, 64)
    S, s, d = (148, 120, 92), (120, 94, 72), (86, 66, 54)
    H_, h_ = (126, 142, 144), (80, 96, 100)
    pal = {"O": O, "T": T, "t": t, "R": R, "S": S, "s": s, "d": d, "H": H_, "h": h_}
    rows = [
        "...OOOOOOOO...",
        ".OORTTTTTTROO.",
        "ORTTTtTTTtTTRO",
        "ORTtTTTTTTTtRO",
        "ORRTTTTTTTTRRO",
        "OhRRRRRRRRRRhO",
        "OHHHHHHHHHhhhO",
        "OSSSsSSSsSSddO",
        "OSSSsSSSsSsddO",
        "OSSSsSSSsSsddO",
        "OHHHHHHHHHhhhO",
        "OSSSsSSSsSsddO",
        "OsSSsSSSsSsddO",
        ".OsssssssssdO.",
        "..OOOOOOOOOO..",
    ]
    img = Image.new("RGBA", (14, len(rows)), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != ".":
                px[x, y] = pal[ch] + (255,)
    return img


def build_mala(janka):
    """Łódź Janka skrócona o 30 px (ława + kosz), bez masztu i sieci, z beczułką, odrobinę cieplejsze drewno."""
    src = janka.convert("RGBA")
    W, H = src.size
    a, b, dy = 82, 112, 2              # wycinek; prawa część 2 px wyżej, żeby burty się zeszły
    out = Image.new("RGBA", (W - (b - a), H), (0, 0, 0, 0))
    out.alpha_composite(src.crop((0, 0, a, H)), (0, 0))
    out.alpha_composite(src.crop((b, 0, W, H)), (a, -dy))
    px = out.load()
    for y in range(8, 26):             # czubek masztu nad burtą -> burta z sąsiednich kolumn
        for x in range(55, 64):
            px[x, y] = px[x + 9, y]
    for y in range(25, 51):            # sieć i stopa masztu -> deski dna spod rufy
        for x in range(50, 81):
            px[x, y] = px[96 + (x - 50) % 15, y - 2]
    # beczułka z cieniem w prawo
    k = keg()
    kx, ky = 60, 31
    for yy in range(k.size[1]):
        for xx in range(3):
            X, Y = kx + k.size[0] - 1 + xx, ky + 3 + yy
            r, g, bb, al = px[X, Y]
            if al:
                px[X, Y] = (int(r * 0.7), int(g * 0.7), int(bb * 0.7), al)
    out.alpha_composite(k, (kx, ky))
    # cieplejsze drewno, żeby łodzie się różniły
    for y in range(out.size[1]):
        for x in range(out.size[0]):
            r, g, bb, al = px[x, y]
            if al and lum((r, g, bb)) > 60:
                px[x, y] = (min(255, r + 9), g + 1, max(0, bb - 6), al)
    return crop_bbox(out)


# ---------------------------------------------------------------- arkusze
def sheet(img, cell_w, cell_h, bob=None):
    """3x4 komórek; obiekt wyśrodkowany w poziomie, dołem przy dole komórki (minus zapas na kołysanie)."""
    w, h = img.size
    frames = bob or [(0, 0)] * 3
    max_dy = max(d for _, d in frames)
    max_dx = max(d for d, _ in frames)
    assert w + max_dx <= cell_w and h + max_dy <= cell_h, (w, h, cell_w, cell_h)
    out = Image.new("RGBA", (cell_w * 3, cell_h * 4), (0, 0, 0, 0))
    x0 = (cell_w - w - max_dx) // 2
    y0 = cell_h - h - max_dy
    for row in range(4):
        for col, (dx, dy) in enumerate(frames):
            out.alpha_composite(img, (col * cell_w + x0 + dx, row * cell_h + y0 + dy))
    return out, (x0, y0)


def tiles_of(cell_w, cell_h, bbox):
    """Pola zajęte przez widoczną część klatki 0 względem pola zdarzenia (0,0); x w prawo, y w dół (ujemne = wyżej).
    Komórka jest wyśrodkowana na środku pola (x 24) i stoi dołem na dole pola (y 48)."""
    left = 24 - cell_w / 2.0
    top = 48 - cell_h
    bx0, by0, bx1, by1 = bbox
    X0, X1 = left + bx0, left + bx1
    Y0, Y1 = top + by0, top + by1
    import math
    return {
        "x_od": int(math.floor(X0 / TILE)), "x_do": int(math.ceil(X1 / TILE)) - 1,
        "y_od": int(math.floor(Y0 / TILE)), "y_do": int(math.ceil(Y1 / TILE)) - 1,
        "px_wzgledem_dolu_srodka_pola": [round(X0 - 24), round(Y0 - 48), round(X1 - 24), round(Y1 - 48)],
    }


BOB = [(0, 0), (0, 1), (1, 2)]
BOB_HEAVY = [(0, 0), (0, 1), (0, 1)]
BOB_NODX = [(0, 0), (0, 1), (0, 2)]

SPEC = {
    "Lodz_Janka": {"cell": (144, 72), "where": "woda", "bob": BOB_NODX,
                   "opis": "łódź rybacka Janka: sieć, kosz, wiosła, kikut masztu",
                   "stawiaj": "pole wody pod środkiem kadłuba przy pomoście rybackim; kadłub dokładnie na 3 polach "
                              "(x-1..x+1), dno 2 px nad dołem pola; bez przesunięcia w bok (pełna szerokość komórki)"},
    "Lodz_Mala": {"cell": (120, 64), "where": "woda", "bob": BOB,
                  "opis": "mniejsza łódka: wiosła, beczułka",
                  "stawiaj": "pole wody pod środkiem łódki; 114 px szerokości, mieści się w x-1..x+1"},
    "Kuter": {"cell": (240, 120), "where": "woda", "bob": BOB,
              "opis": "kuter po naprawie: łaty z jasnych desek, maszt, zwinięty łatany żagiel, zgaszona latarnia na rufie",
              "stawiaj": "pole wody pod środkiem kadłuba przy pochylni; szybka latarni (klatka 0) jest ok. +103 px w prawo "
                         "i -53 px w górę od dołu-środka pola zdarzenia - tam światło"},
    "Kuter_Wrak": {"cell": (240, 144), "where": "ląd", "bob": None,
                   "opis": "wrak kutra na plaży: przechył, złamany maszt, podarty szary żagiel, lina, deski obok",
                   "stawiaj": "pole piasku pod środkiem kadłuba; płaski cień Winlu w prawo-dół, deski i lina leżą w dolnym rzędzie; "
                              "nieruchomy (12 równych komórek)"},
    "Okret_Wrak": {"cell": (288, 192), "where": "woda (mielizna)", "bob": None,
                   "opis": "wrak okrętu wojennego do połowy w wodzie, złamane maszty, ciemne strzępy żagli, 3 kruki",
                   "stawiaj": "daleko w zatoce na polu wody; dół obrazu = linia wody (półprzezroczysty pas); nieruchomy; "
                              "lekka mgiełka (10%) już w obrazie"},
    "Prom": {"cell": (384, 168), "where": "woda", "bob": BOB_HEAVY,
             "opis": "prom: płaska barka z burtami i poręczą, wiosło sterowe na rufie, skrzynie i zwój liny na dziobie, beczki na rufie",
             "stawiaj": "pole wody pod środkiem kadłuba, górną burtą tuż pod molem; ciężki, kołysze się tylko 0/1/1 px"},
}


def load_sources():
    def raw(name):
        return Image.open(os.path.join(RAW, name)).convert("RGBA")
    janka = crop_bbox(raw("janka_proflash_1.png"))
    prom_name = "prom_final.png" if os.path.exists(os.path.join(RAW, "prom_final.png")) else "prom_collage.png"
    if prom_name == "prom_collage.png" and not os.path.exists(os.path.join(RAW, prom_name)):
        sys.path.insert(0, HERE)
        import prom_collage
        prom_collage.build(os.path.join(RAW, "kuter_proflash_1.png"), os.path.join(RAW, prom_name))
    return {
        "Lodz_Janka": janka,
        "Lodz_Mala": build_mala(raw("janka_proflash_1.png")),
        "Kuter": crop_bbox(rope_recolor(drop_specks(raw("kuter_proflash_1.png")))),
        "Kuter_Wrak": crop_bbox(drop_specks(raw("wrak_edit_1.png"))),
        "Okret_Wrak": crop_bbox(haze(drop_light_specks(drop_specks(raw("okret_proflash_1.png"))))),
        "Prom": crop_bbox(raw(prom_name)),
    }, prom_name


def rope_recolor(img, light=205, rope=(150, 116, 82)):
    """Jasne (białe) kreski na linach -> kolor liny; tylko w cienkich pionowo ciągach (<= 3 px), czyli w linach."""
    img = img.copy()
    px = img.load()
    w, h = img.size
    for x in range(w):
        for y in range(h):
            c = px[x, y]
            if c[3] == 0 or lum(c) < light:
                continue
            up = sum(1 for k in (1, 2) if y - k >= 0 and px[x, y - k][3] > 0)
            dn = sum(1 for k in (1, 2) if y + k < h and px[x, y + k][3] > 0)
            if up + dn <= 2:
                px[x, y] = rope + (255,)
    return img


def drop_light_specks(img, light=190):
    """Pojedyncze jasne piksele otoczone ciemnymi (iskry po generacji) -> średnia sąsiadów."""
    img = img.copy()
    px = img.load()
    w, h = img.size
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            c = px[x, y]
            if c[3] == 0 or lum(c) < light:
                continue
            nb = [px[x + dx, y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            if all(n[3] > 0 and lum(n) < light - 70 for n in nb):
                px[x, y] = tuple(sum(n[i] for n in nb) // 4 for i in range(3)) + (255,)
    return img


def haze(img, f=0.10, tint=(104, 138, 146)):
    """Lekka mgiełka dla obiektu daleko w zatoce."""
    img = img.copy()
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (int(r + (tint[0] - r) * f), int(g + (tint[1] - g) * f), int(b + (tint[2] - b) * f), a)
    return img


def okret_fix(img):
    """Linia wody na dole wraku okrętu: turkusowe piksele w dolnych 4 rzędach -> półprzezroczysty ciemny pas."""
    img = img.copy()
    px = img.load()
    w, h = img.size
    for y in range(max(0, h - 5), h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and b > r + 8 and g > r:
                px[x, y] = (20, 44, 52, 120)
    return img


def quantize_opaque(img, colors=112):
    """Ogranicza paletę pełnych pikseli (prom z kolażu miał ~400 odcieni), półprzezroczyste zostają."""
    rgb = img.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT,
                                      dither=Image.Dither.NONE).convert("RGB")
    out = img.copy()
    op, qp = out.load(), rgb.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            a = op[x, y][3]
            if a == 255:
                op[x, y] = qp[x, y] + (255,)
    return out


def finish(name, img):
    img = winlu_tone(img)
    if name == "Prom":
        img = quantize_opaque(img)
    where = SPEC[name]["where"]
    if name == "Okret_Wrak":
        img = okret_fix(img)
    elif where == "woda":
        img = waterline(img)
    elif where == "ląd":
        img = ground_shadow(img)
    return crop_bbox(img)


def compact_json(obj, indent=2, level=0):
    """JSON z wcięciami, ale krótkie listy liczb i małe słowniki liczb w jednej linii."""
    pad = " " * (indent * level)
    pad1 = " " * (indent * (level + 1))
    if isinstance(obj, dict):
        if obj and all(isinstance(v, (int, float)) for v in obj.values()) and len(obj) <= 3:
            return "{" + ", ".join("%s: %s" % (json.dumps(k, ensure_ascii=False), json.dumps(v)) for k, v in obj.items()) + "}"
        items = ["%s%s: %s" % (pad1, json.dumps(k, ensure_ascii=False), compact_json(v, indent, level + 1))
                 for k, v in obj.items()]
        return "{\n" + ",\n".join(items) + "\n" + pad + "}"
    if isinstance(obj, list):
        if all(isinstance(v, (int, float)) for v in obj) or all(isinstance(v, dict) and len(v) <= 3 for v in obj):
            return "[" + ", ".join(compact_json(v, indent, level + 1) for v in obj) + "]"
        return "[\n" + ",\n".join(pad1 + compact_json(v, indent, level + 1) for v in obj) + "\n" + pad + "]"
    return json.dumps(obj, ensure_ascii=False)


def _ours():
    """Pliki zrobione wcześniej przez ten skrypt (wg objects.json) - ich nie kopiujemy do backupu."""
    if not os.path.exists(JSON_OUT):
        return set()
    with open(JSON_OUT, "rb") as f:
        meta = json.loads(f.read().decode("utf8"))
    out = {os.path.normcase(os.path.join(ROOT, o["arkusz"])) for o in meta.get("obiekty", {}).values()}
    out.add(os.path.normcase(PREVIEW))
    return out


OURS = _ours()


def backup(path):
    """Kopia zapasowa istniejącego pliku przed nadpisaniem (tylko obcego, nie z poprzedniego przebiegu)."""
    if os.path.exists(path) and os.path.normcase(path) not in OURS:
        os.makedirs(BACKUP, exist_ok=True)
        dst = os.path.join(BACKUP, os.path.basename(path))
        if not os.path.exists(dst):
            shutil.copy2(path, dst)


def main():
    srcs, prom_name = load_sources()
    meta = {"_opis": "Arkusze pojedynczej postaci MZ (!$ = bez podniesienia o 6 px, 3x4 komórek). "
                     "Komórka wyśrodkowana w poziomie na polu zdarzenia, dołem na dole pola. "
                     "Pola: x/y względem pola zdarzenia (0,0), y ujemne = wyżej. "
                     "Łodzie: wzór kroków 0/1/2 = kołysanie (włącz 'animacja w miejscu'/stepping, wolna prędkość). "
                     "Zrobione przez tools/przystan/art/build_objects.py.",
            "obiekty": {}}
    finals = {}
    for name, spec in SPEC.items():
        img = finish(name, srcs[name])
        cw, ch = spec["cell"]
        bob = spec["bob"]
        # komórka nie mniejsza niż obiekt (+ zapas kołysania)
        mdx = max(d for d, _ in bob) if bob else 0
        mdy = max(d for _, d in bob) if bob else 0
        cw = max(cw, img.size[0] + mdx + (img.size[0] + mdx) % 2)
        ch = max(ch, img.size[1] + mdy)
        sh, (x0, y0) = sheet(img, cw, ch, bob)
        out = os.path.join(CHARS, "!$Przystan_%s.png" % name)
        backup(out)
        sh.save(out)
        finals[name] = (img, cw, ch, x0, y0)
        bb = (x0, y0, x0 + img.size[0], y0 + img.size[1])
        t = tiles_of(cw, ch, bb)
        meta["obiekty"][name] = {
            "arkusz": "img/characters/!$Przystan_%s.png" % name,
            "rozmiar_arkusza": list(sh.size),
            "komorka": [cw, ch],
            "obraz_w_komorce": list(bb),
            "gdzie": spec["where"],
            "kolysanie": [{"dx": d[0], "dy": d[1]} for d in bob] if bob else None,
            "pola": t,
            "szerokosc_w_polach": round(img.size[0] / TILE, 2),
            "wysokosc_w_polach": round(img.size[1] / TILE, 2),
            "sugerowane_przesuniecie_px": {"x": 0, "y": 0},
            "gdzie_postawic": spec["stawiaj"],
            "opis": spec["opis"],
        }
    meta["obiekty"]["Prom"]["zrodlo"] = "raw/" + prom_name
    if prom_name == "prom_collage.png":
        meta["obiekty"]["Prom"]["cumy"] = ("liny cumownicze wychodzą ok. 1 pole nad burtę przy dziobie i rufie "
                                           "(postaw pachołki na molo nad tymi miejscami)")
    with open(JSON_OUT, "wb") as f:
        f.write((compact_json(meta) + "\n").encode("utf8"))
    preview(finals)
    for name in SPEC:
        o = meta["obiekty"][name]
        print("%-11s komórka %dx%d  obraz %s  pola x %d..%d y %d..%d" % (
            name, o["komorka"][0], o["komorka"][1], o["obraz_w_komorce"],
            o["pola"]["x_od"], o["pola"]["x_do"], o["pola"]["y_od"], o["pola"]["y_do"]))


# ---------------------------------------------------------------- podgląd
def preview(finals):
    sys.path.insert(0, HERE)
    from tiles import backdrop, rect
    # 34 x 15 pól: u góry woda rodzaju 6 (basen portu) z pomostem, na dole brązowa ziemia/plaża
    TW, TH = 34, 15
    water = rect(0, 0, TW, 9)
    pier = rect(0, 1, 13, 2)
    bg = backdrop(TW, TH, water=water, pier=pier).convert("RGBA")
    hero = Image.open(os.path.join(CHARS, "Hero_Walk.png")).convert("RGBA")
    hw, hh = hero.size[0] // 9 if hero.size[0] % 9 == 0 else 64, 64
    hero0 = hero.crop((0, 0, 64, 64))

    def put(name, tx, ty, frame=0):
        img, cw, ch, x0, y0 = finals[name]
        sheet_img = Image.open(os.path.join(CHARS, "!$Przystan_%s.png" % name)).convert("RGBA")
        cell = sheet_img.crop((frame * cw, 0, frame * cw + cw, ch))
        X = tx * TILE + 24 - cw // 2
        Y = (ty + 1) * TILE - ch
        bg.alpha_composite(cell, (X, Y))
        return X, Y, cw, ch

    labels = []
    labels.append(("Prom", put("Prom", 5, 5)))
    labels.append(("Okret_Wrak", put("Okret_Wrak", 26, 4)))
    labels.append(("Lodz_Janka", put("Lodz_Janka", 15, 3)))
    labels.append(("Lodz_Mala", put("Lodz_Mala", 15, 7)))
    labels.append(("Kuter", put("Kuter", 20, 7)))
    labels.append(("Kuter_Wrak", put("Kuter_Wrak", 8, 13)))
    # bohater dla skali: na pomoście i na ziemi
    for (tx, ty) in ((11, 1), (13, 12), (19, 12)):
        bg.alpha_composite(hero0, (tx * TILE + 24 - 32, (ty + 1) * TILE - 64))
    # podpisy
    d = ImageDraw.Draw(bg)
    try:
        font = ImageFont.truetype("arialbd.ttf", 13)
    except Exception:
        font = ImageFont.load_default()
    for name, (X, Y, cw, ch) in labels:
        txt = "%s (%dx%d)" % (name, cw, ch)
        tw = d.textlength(txt, font=font)
        d.rectangle([X, Y + ch + 1, X + tw + 6, Y + ch + 17], fill=(20, 18, 22, 200))
        d.text((X + 3, Y + ch + 2), txt, fill=(255, 214, 102), font=font)
    # ikony przedmiotów (32x32, tu x2) w prawym dolnym rogu
    names = (("sledz", "Śledź"), ("dorsz", "Dorsz"), ("chusta", "Chusta matki"), ("smola", "Smoła"))
    ix, iy = 1120, 520
    d.rectangle([ix - 10, iy - 30, ix + 4 * 110 - 10, iy + 96], fill=(20, 18, 22, 210))
    d.text((ix, iy - 24), "Ikony 32x32 (powiększone x2)", fill=(255, 214, 102), font=font)
    for k, (fn, label) in enumerate(names):
        p = os.path.join(HERE, "icons", fn + ".png")
        if not os.path.exists(p):
            continue
        ic = Image.open(p).convert("RGBA").resize((64, 64), Image.NEAREST)
        bg.alpha_composite(ic, (ix + k * 110 + 14, iy))
        d.text((ix + k * 110 + 4, iy + 70), label, fill=(240, 236, 226), font=font)
    os.makedirs(os.path.dirname(PREVIEW), exist_ok=True)
    backup(PREVIEW)
    bg.convert("RGB").save(PREVIEW)
    print("podgląd:", PREVIEW, bg.size)


if __name__ == "__main__":
    main()
