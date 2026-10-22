"""Grafiki paczki B „Zwierzęta i łowy”: img/characters/!$Low_<Nazwa>.png + podgląd docs/rozszerzenia/B/obiekty.png.

Surowe obrazy PixelLab (Pro Flash, styl Winlu jako wzór) w tools/rozszerzenia/B/raw/ (zużycie: generacje.json):
  nora_proflash_1.png         144x96  wilcza nora pod korzeniami pnia
  gawra_proflash_1.png        96x96   wylot gawry w skale
  bloto_proflash_1.png        192x144 błotnisko dzików (płaskie, pod postaciami)
  lizawka_proflash_1.png      64x64   pieniek z bryłą soli (wariant bez soli robiony tutaj)
  zasiadka_proflash_1.png     96x64   zasłona z chrustu
  lesniczowka_proflash_1.png  240x208 leśniczówka gajowego (prosto z przodu, dach z góry)
  pasnik_proflash_1.png       96x96   paśnik
Bez generacji (0): tarcza i pusty stojak z Fantasy_Outside_C (Winlu) + łuki narysowane tutaj, cierń = !$Bush_Bare_Hedge (gry),
połamane gałęzie = Gather_Branch_0/1 (gry), sidła = pętla z Farm_Snare + kołek z gałęzi. Zrzucone poroże (!$Low_Poroze) rysuje
tools/rozszerzenia/B/ikony.py (rysunek ikony 481 w skali 1x).

Arkusz "!$": 3 x 4 komórek, wszystkie takie same (bez animacji), chyba że rzędy są wariantami (kierunek strony zdarzenia):
  !$Low_Lizawka: rząd 0 (kierunek 2) bez soli, rzędy 1-3 (kierunek 4) z solą;
  !$Low_Wylom:   rząd 0 (kierunek 2) połamane gałęzie, rzędy 1-3 (kierunek 4) cierń (wyłom zamknięty, przełącznik 23).
Obiekt szerszy niż pole zdarzenia leży w komórce tak, żeby trafił na swoje pola (opis przy każdym: OBJECTS[..]["pola"]).
Uruchom: python tools/rozszerzenia/B/art.py
"""
import colorsys
import os
import shutil

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
RAW = os.path.join(HERE, "raw")
CHARS = os.path.join(ROOT, "img", "characters")
SYSTEM = os.path.join(ROOT, "img", "system")
OUTSIDE_C = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "tilesets", "Fantasy_Outside_C.png")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-21", "rozszerzenia", "B")
PREVIEW = os.path.join(ROOT, "docs", "rozszerzenia", "B", "obiekty.png")
WINLU_DARK, WINLU_OUT2 = (47, 38, 45), (65, 52, 50)


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def alpha_clean(img):
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255 if a >= 128 else 0)
    return img


def winlu_tone(img, dark=52, sat=0.93):
    """the darkest pixels -> Winlu's dark brown outline, a little less saturation (as the island places' objects)"""
    img = img.copy()
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            L = lum((r, g, b))
            if L < dark:
                t = L / float(dark)
                px[x, y] = tuple(int(WINLU_DARK[i] + (WINLU_OUT2[i] - WINLU_DARK[i]) * t) for i in range(3)) + (a,)
                continue
            hh, ll, ss = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
            rr, gg, bb = colorsys.hls_to_rgb(hh, ll, ss * sat)
            px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
    return img


def cell_of(obj, cw, ch, x0=None, bottom=2):
    """the object in a cell cw x ch: its bottom `bottom` px over the cell's bottom, x0 = its left edge (None: centred)"""
    bb = obj.getbbox()
    o = obj.crop(bb) if bb else obj
    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    x = (cw - o.width) // 2 if x0 is None else x0
    out.alpha_composite(o, (max(0, x), max(0, ch - bottom - o.height)))
    return out


def sheet(rows):
    """rows: 4 cells (one per direction row 2/4/6/8), each repeated in the 3 columns"""
    cw, ch = rows[0].size
    out = Image.new("RGBA", (cw * 3, ch * 4), (0, 0, 0, 0))
    for r, c in enumerate(rows):
        for col in range(3):
            out.alpha_composite(c, (col * cw, r * ch))
    return out


def raw(name):
    return alpha_clean(Image.open(os.path.join(RAW, name)))


def lick_without_salt(img):
    """the salt lump taken out of the hollow: its pale pixels (high value, low saturation) in the top part -> the hollow's dark wood"""
    img = img.copy()
    px = img.load()
    bb = img.getbbox()
    top = bb[1] + (bb[3] - bb[1]) * 0.55
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if not a or y > top:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
            if l > 0.62 and s < 0.25:
                k = (l - 0.62) / 0.38
                px[x, y] = (int(58 + 20 * k), int(40 + 14 * k), int(28 + 10 * k), a)
    return img


def antler_from_lodge(lodge):
    """the antlers nailed over the lodge's door, laid flat on the ground (a little turned) with a soft shadow"""
    w, h = lodge.size
    best = None
    # (the antlers: the palest bone-coloured pixels in the middle band of the lodge's front)
    px = lodge.load()
    xs, ys = [], []
    for y in range(int(h * 0.35), int(h * 0.62)):
        for x in range(int(w * 0.15), int(w * 0.6)):
            r, g, b, a = px[x, y]
            if a and lum((r, g, b)) > 150 and abs(r - g) < 40 and r >= b:
                xs.append(x); ys.append(y)
    if xs:
        best = (min(xs) - 2, min(ys) - 2, max(xs) + 3, max(ys) + 3)
    ant = lodge.crop(best) if best else Image.new("RGBA", (30, 16), (0, 0, 0, 0))
    # only the bone-coloured pixels and their outline
    ap = ant.load()
    keep = Image.new("RGBA", ant.size, (0, 0, 0, 0))
    kp = keep.load()
    for y in range(ant.height):
        for x in range(ant.width):
            r, g, b, a = ap[x, y]
            if a and lum((r, g, b)) > 95 and r >= b:
                kp[x, y] = (r, g, b, 255)
    keep = keep.rotate(-12, resample=Image.NEAREST, expand=True)
    out = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    sh = Image.new("RGBA", keep.size, (0, 0, 0, 0))
    sh.putalpha(keep.getchannel("A").point(lambda v: 90 if v else 0))
    x, y = (48 - keep.width) // 2, 48 - keep.height - 6
    out.alpha_composite(sh, (x + 2, y + 2))
    out.alpha_composite(keep, (x, y))
    return out


def winlu_target():
    C = Image.open(OUTSIDE_C).convert("RGBA")
    return C.crop((48, 476, 96, 552))   # (the straw target on its three legs, 48 x 76)


def bow_rack():
    """the empty weapon rack of Fantasy_Outside_C with two bows and a quiver put on it"""
    C = Image.open(OUTSIDE_C).convert("RGBA")
    rack = C.crop((96, 400, 144, 460)).copy()
    d = ImageDraw.Draw(rack)
    for x0 in (14, 30):
        # a bow standing in the rack: a curved stave (dark outline, wood) and its string
        pts = [(x0 + 4, 4), (x0 + 1, 12), (x0, 22), (x0 + 1, 32), (x0 + 4, 40)]
        d.line(pts, fill=(47, 38, 45, 255), width=3)
        d.line(pts, fill=(150, 104, 58, 255), width=1)
        d.line([(x0 + 4, 4), (x0 + 4, 40)], fill=(214, 204, 176, 255), width=1)
    # a quiver with arrows at the right
    d.rectangle([40, 20, 45, 40], fill=(86, 52, 30, 255), outline=(47, 38, 45, 255))
    for i, x in enumerate((41, 43, 45)):
        d.line([(x, 12), (x, 20)], fill=(150, 112, 70, 255), width=1)
        d.point((x, 11), fill=(236, 230, 214, 255))
    return rack


def snares():
    """a poacher's wire snare: a stake (a branch of the game's) with a pale loop of cord on the ground (the loop of Farm_Snare)"""
    trap = Image.open(os.path.join(SYSTEM, "Farm_Snare.png")).convert("RGBA")
    loop = trap.crop((36, 38, 56, 52))
    stick = Image.open(os.path.join(SYSTEM, "Gather_Branch_1.png")).convert("RGBA")
    out = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    out.alpha_composite(stick.rotate(70, resample=Image.NEAREST, expand=True).crop((0, 0, 30, 30)), (16, 8))
    out.alpha_composite(loop, (12, 28))
    return out


def broken_branches():
    b0 = Image.open(os.path.join(SYSTEM, "Gather_Branch_0.png")).convert("RGBA")
    b1 = Image.open(os.path.join(SYSTEM, "Gather_Branch_1.png")).convert("RGBA")
    out = Image.new("RGBA", (144, 48), (0, 0, 0, 0))
    # (the gap is tiles 7-8 = the left 96 px of the cell: a few broken twigs across it, nothing on the third tile)
    out.alpha_composite(b0, (6, 22))
    out.alpha_composite(b1.transpose(Image.FLIP_LEFT_RIGHT), (40, 6))
    out.alpha_composite(b0.rotate(25, resample=Image.NEAREST, expand=True), (58, 18))
    return out


def hedge_thorns():
    h = Image.open(os.path.join(CHARS, "!$Bush_Bare_Hedge.png")).convert("RGBA")
    return h.crop((0, 0, 144, 48))


# name: (the 4 row cells, the cell size, where it stands)
def build():
    lodge = raw("lesniczowka_proflash_1.png")
    lick = winlu_tone(raw("lizawka_proflash_1.png"))
    OBJECTS = {
        "Nora": {"rows": [cell_of(winlu_tone(raw("nora_proflash_1.png")), 144, 96)] * 4,
                 "pola": "zdarzenie (65,50), nora na x 64-66, y 49-50 (<Occupy:left=1,right=1,up=1>)"},
        "Gawra": {"rows": [cell_of(winlu_tone(raw("gawra_proflash_1.png")), 144, 96, x0=0, bottom=0)] * 4,
                  "pola": "zdarzenie (100,46), wylot na x 99-100, y 45-46 (lewe 96 px komórki)"},
        "Bloto": {"rows": [cell_of(raw("bloto_proflash_1.png"), 240, 144, x0=0, bottom=0)] * 4,
                  "pola": "zdarzenie (67,48), pod postaciami, błoto na x 65-68, y 46-48 (lewe 192 px komórki)"},
        "Lizawka": {"rows": [cell_of(lick_without_salt(lick), 64, 64)] + [cell_of(lick, 64, 64)] * 3,
                    "pola": "zdarzenie (73,51); kierunek 2 bez soli, 4 z solą"},
        "Zasiadka": {"rows": [cell_of(winlu_tone(raw("zasiadka_proflash_1.png")), 96, 64)] * 4,
                     "pola": "zdarzenie (70,53), nad bohaterem (przechodnie)"},
        "Lesniczowka": {"rows": [cell_of(winlu_tone(lodge), 240, 208)] * 4,
                        "pola": "zdarzenie (61,4), chata na x 59-63, y 2-4 (<Occupy:left=2,right=2,up=2>)"},
        "Pasnik": {"rows": [cell_of(winlu_tone(raw("pasnik_proflash_1.png")), 144, 96, x0=0)] * 4,
                   "pola": "zdarzenie (60,22), paśnik na x 59-60 (lewe 96 px komórki, <Occupy:left=1>)"},
        "Wylom": {"rows": [broken_branches()] + [hedge_thorns()] * 3,
                  "pola": "zdarzenie (8,29) (+ niewidoczne (7,29)); kierunek 2 gałęzie, 4 cierń (przełącznik 23)"},
        "Sidla": {"rows": [snares()] * 4, "pola": "sidła D32: (20,46), (45,38), (66,12)"},
        "Tarcza": {"rows": [cell_of(winlu_target(), 48, 80, bottom=0)] * 4, "pola": "tarcze (79,51), (81,53), (83,51)"},
        "Stojak": {"rows": [cell_of(bow_rack(), 48, 64, bottom=0)] * 4, "pola": "stojak z łukami (73,50)"}
    }
    os.makedirs(BACKUP, exist_ok=True)
    made = []
    for name, o in OBJECTS.items():
        out = os.path.join(CHARS, "!$Low_" + name + ".png")
        if os.path.exists(out):
            shutil.copy2(out, os.path.join(BACKUP, "!$Low_" + name + ".png.przed"))
        sheet(o["rows"]).save(out)
        made.append((name, o["rows"]))
        print("zapisano", os.path.relpath(out, ROOT), o["rows"][0].size, "-", o["pola"])
    # the preview: every object's rows on a grass colour, x2
    pad = 8
    W = sum(max(c.width for c in rows) + pad for _, rows in made) + pad
    Hh = max(max(c.height for c in rows) * 2 + pad for _, rows in made) + pad
    pv = Image.new("RGBA", (W, Hh), (104, 132, 80, 255))
    x = pad
    for _, rows in made:
        cw, ch = rows[0].size
        pv.alpha_composite(rows[0], (x, pad))
        if rows[1] is not rows[0]:
            pv.alpha_composite(rows[1], (x, pad + ch))
        x += cw + pad
    os.makedirs(os.path.dirname(PREVIEW), exist_ok=True)
    pv.resize((pv.width * 2, pv.height * 2), Image.NEAREST).save(PREVIEW)
    print("podgląd", os.path.relpath(PREVIEW, ROOT))


if __name__ == "__main__":
    build()
