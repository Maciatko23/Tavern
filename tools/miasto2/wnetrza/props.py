# python tools/miasto2/wnetrza/props.py  -> img/characters/!Miasto2_Wnetrza.png (NOWY plik) + tools/miasto2/wnetrza/props_index.json
# Rekwizyty wnętrz nowego miasta (mapy 178-190) jako arkusz postaci RPG Maker (klatki 144x144: 8 bloków x 3 wzory x 4 kierunki),
# ułożony tak samo jak !House_Town (tools/interiors/props.py): klatka jest wyśrodkowana na kratce zdarzenia; rzecz 1 kratki
# stoi w środkowej trzeciej części, 2 kratek - w prawych dwóch trzecich (zdarzenie stoi na LEWEJ kratce), 3 kratek - na całej
# szerokości (zdarzenie na środkowej); każda rzecz stoi na dole klatki (= dół kratki zdarzenia).
# Źródła (wszystko w wyglądzie Winlu):
#   - arkusz Winlu Fantasy_Inside_E_Cathedral (nie ma go w zestawie 8: krzyż ścienny, krzyż na ołtarz, ołtarz z czerwonym
#     obrusem, witraże), wycięty;
#   - arkusz Winlu Fantasy_Outside_C (stóg siana, słoma, koryto, koło od wozu, deski, pniak z siekierą, kłoda, stos drewna, lina);
#   - obrazki PixelLab Pro Flash w props_src/ (koń - na wzór osła !$Lud_Osiol, ikona, siodło, chomąto, kozioł ciesielski;
#     ZRODLA.txt), wykończone jak rekwizyty tawerny (tools/tavern/props_upper/make_props.py: zmniejszenie, twarda alfa,
#     ciemny kontur, cień na podłodze);
#   - narysowane tutaj: figurka na krzyżu, kula (laska weterana).
# Nic tu nie nadpisuje istniejących plików gry - arkusz ma nową nazwę.
import os, sys, json, colorsys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "tavern", "props_upper"))
import make_props as MP     # noqa: E402  (downscale, outline, with_shadow)

SRC = os.path.join(HERE, "props_src")
SHEET_NAME = "!Miasto2_Wnetrza"
SHEET = os.path.join(ROOT, "img", "characters", SHEET_NAME + ".png")
INDEX = os.path.join(HERE, "props_index.json")
PREVIEW = os.path.join(HERE, "rekwizyty.png")
WINLU_I = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "tilesets")
CAT = os.path.join(WINLU_I, "Fantasy_Inside_E_Cathedral.png")
EXT_C = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "tilesets",
                     "Fantasy_Outside_C.png")
F = 144


def crop(path, c, r, w=1, h=1, box=None):
    im = Image.open(path).convert("RGBA").crop((c * 48, r * 48, (c + w) * 48, (r + h) * 48))
    if box: im = im.crop(box)
    bb = im.getbbox()
    return im.crop(bb) if bb else im


def cat(c, r, w=1, h=1, box=None): return crop(CAT, c, r, w, h, box)
def ext(c, r, w=1, h=1, box=None): return crop(EXT_C, c, r, w, h, box)


def src(name):
    return Image.open(os.path.join(SRC, name)).convert("RGBA")


def frame_xy(idx, d, p):
    return (((idx % 4) * 3 + p) * F, ((idx // 4) * 4 + (d // 2 - 1)) * F)


class Sheet:
    def __init__(self):
        self.im = Image.new("RGBA", (12 * F, 8 * F), (0, 0, 0, 0))
        self.index = {}
        self.used = set()

    def put(self, key, idx, d, p, art, cells_w, place, name, dx=0, dy=0, occupy=None, extra=None):
        assert (idx, d, p) not in self.used, (key, idx, d, p)
        self.used.add((idx, d, p))
        fr = Image.new("RGBA", (F, F), (0, 0, 0, 0))
        left = {1: 48, 2: 48, 3: 0}[cells_w]
        span = cells_w * 48
        x = left + (span - art.width) // 2 + dx
        y = F - art.height + dy
        if y < 0:
            art = art.crop((0, -y, art.width, art.height)); y = 0
        fr.alpha_composite(art, (x, y))
        fx, fy = frame_xy(idx, d, p)
        self.im.alpha_composite(fr, (fx, fy))
        bb = fr.getbbox() or (0, 0, 1, 1)
        e = {"sheet": SHEET_NAME, "index": idx, "direction": d, "pattern": p, "place": place, "w": F, "h": F,
             "art": list(bb), "name": name}
        if occupy: e["occupy"] = occupy
        if extra: e.update(extra)
        self.index[key] = e

    def save(self):
        self.im.save(SHEET)
        with open(INDEX, "wb") as f:
            f.write(json.dumps(self.index, ensure_ascii=False, indent=1).encode("utf-8"))


# ---------------------------------------------------------------------------------------------------- przeróbki
def recolor(im, fn):
    """przemalowanie pikseli: fn(h, s, v) -> (h, s, v) albo None (bez zmian); h, s, v w 0..1"""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            n = fn(h, s, v)
            if n is None: continue
            rr, gg, bb = colorsys.hsv_to_rgb(*n)
            px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
    return out


def horse_grey(h, s, v):
    """siwek: brąz sierści -> szarość jabłkowita (grzywa ciemniejsza zostaje ciemnoszara)"""
    if 0.02 <= h <= 0.12 and s > 0.25:
        return (0.08, s * 0.10, min(1.0, v * 0.95 + 0.18))
    return None


def horse_black(h, s, v):
    """kary: brąz -> prawie czarny z niebieskawym połyskiem"""
    if 0.02 <= h <= 0.12 and s > 0.25:
        return (0.62, 0.18, v * 0.42)
    return None


def corpus_on_cross(im):
    """mała, jasna figurka na krzyżu ściennym z arkusza katedry (krzyż 38x46, belka pionowa x 15-22, pozioma y 12-19)"""
    im = im.copy()
    d = ImageDraw.Draw(im)
    light, mid, dark, cloth = (226, 210, 176, 255), (184, 160, 124, 255), (96, 72, 52, 255), (236, 232, 222, 255)
    cx = 19
    # ramiona wzdłuż belki poziomej
    d.line((6, 14, 31, 14), fill=light); d.line((6, 15, 31, 15), fill=mid)
    d.point((5, 14), fill=dark); d.point((32, 14), fill=dark)
    # głowa (lekko pochylona)
    d.rectangle((cx - 1, 9, cx + 1, 12), fill=light); d.point((cx - 1, 12), fill=mid); d.point((cx + 1, 9), fill=mid)
    d.line((cx - 2, 8, cx + 2, 8), fill=dark)        # cierniowa korona
    # tułów, przepaska, nogi
    d.rectangle((cx - 1, 13, cx + 1, 22), fill=light); d.line((cx + 1, 13, cx + 1, 22), fill=mid)
    d.rectangle((cx - 2, 23, cx + 2, 25), fill=cloth); d.line((cx - 2, 25, cx + 2, 25), fill=mid)
    d.line((cx - 1, 26, cx - 1, 33), fill=light); d.line((cx, 26, cx, 33), fill=mid)
    d.point((cx - 1, 34), fill=dark); d.point((cx, 34), fill=dark)
    return im


def crutch():
    """kula weterana oparta o ścianę: drewniany drąg z poprzeczką pod pachę i uchwytem, okuta stopka"""
    im = Image.new("RGBA", (20, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    wood, wood_l, dark, iron = (118, 82, 50, 255), (156, 114, 72, 255), (46, 32, 26, 255), (120, 124, 130, 255)
    # lekko pochylona: od (6,6) do (12,60)
    for i in range(55):
        x = 6 + i * 6 // 55; y = 6 + i
        im.putpixel((x, y), wood); im.putpixel((x + 1, y), wood_l); im.putpixel((x + 2, y), dark)
        im.putpixel((x - 1, y), dark)
    d.rectangle((1, 2, 13, 5), fill=wood); d.line((1, 2, 13, 2), fill=wood_l); d.rectangle((0, 1, 14, 6), outline=dark)
    d.rectangle((6, 30, 13, 32), fill=wood_l); d.rectangle((5, 29, 14, 33), outline=dark)          # uchwyt na rękę
    d.rectangle((10, 58, 14, 61), fill=iron); d.rectangle((9, 57, 15, 62), outline=dark)            # okucie
    return im


def shovel(lean=1):
    """łopata grabarza oparta o ścianę: trzonek z rączką w kształcie T, żelazne pióro (lekko zardzewiałe)"""
    im = Image.new("RGBA", (22, 66), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    wood, wood_l, dark = (122, 86, 52, 255), (160, 118, 76, 255), (44, 32, 26, 255)
    iron, iron_l, rust = (104, 108, 114, 255), (150, 154, 160, 255), (120, 78, 52, 255)
    x0 = 7 if lean > 0 else 13
    for i in range(46):
        x = x0 + lean * i * 4 // 46; y = 6 + i
        im.putpixel((x - 1, y), dark); im.putpixel((x, y), wood_l); im.putpixel((x + 1, y), wood); im.putpixel((x + 2, y), dark)
    d.rectangle((x0 - 4, 2, x0 + 5, 5), fill=wood); d.line((x0 - 4, 2, x0 + 5, 2), fill=wood_l)
    d.rectangle((x0 - 5, 1, x0 + 6, 6), outline=dark)
    bx = x0 + lean * 4
    d.polygon([(bx - 6, 51), (bx + 7, 51), (bx + 6, 61), (bx + 1, 65), (bx - 5, 61)], fill=iron, outline=dark)
    d.line((bx - 4, 53, bx - 4, 60), fill=iron_l)
    d.point((bx + 3, 59), fill=rust); d.point((bx + 4, 60), fill=rust); d.point((bx + 2, 62), fill=rust)
    return im


def two_shovels():
    a, b = shovel(1), shovel(-1)
    im = Image.new("RGBA", (36, 66), (0, 0, 0, 0))
    im.alpha_composite(b, (14, 0)); im.alpha_composite(a, (0, 0))
    return im


ROPE, ROPE_D, ROPE_L = (150, 118, 78, 255), (96, 72, 48, 255), (186, 156, 112, 255)
WOOD, WOOD_L, WOOD_D, DARK = (122, 86, 52, 255), (160, 118, 76, 255), (86, 58, 36, 255), (44, 32, 26, 255)


def net():
    """sieć rybacka na dwóch kołkach: oczka w romby, zwisa łukiem, trzy korkowe pławiki u góry"""
    W, H = 44, 46
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    import math
    def bottom(x):                       # dolna krawędź: łuk z frędzlami
        return int(34 + 8 * math.sin(math.pi * x / (W - 1)) + (2 if x % 7 in (2, 3) else 0))
    for x in range(2, W - 2):
        for y in range(5, bottom(x)):
            if (x + y) % 6 == 0 or (x - y) % 6 == 0:
                im.putpixel((x, y), ROPE if (x + y) % 12 else ROPE_L)
            elif ((x + y) % 6 == 1 or (x - y) % 6 == 1) and y % 3 == 0:
                im.putpixel((x, y), ROPE_D)
    d.line((2, 5, W - 3, 5), fill=ROPE_D); d.line((2, 4, W - 3, 4), fill=ROPE)
    for px in (3, W - 4):                # kołki
        d.rectangle((px - 2, 1, px + 1, 4), fill=WOOD); d.rectangle((px - 3, 0, px + 2, 5), outline=DARK)
    for fx in (12, 22, 32):              # pławiki
        d.ellipse((fx - 3, 3, fx + 3, 8), fill=(196, 120, 56, 255), outline=(92, 52, 30, 255))
    return im


def oar(lean=1):
    """wiosło oparte o ścianę: długi trzonek, szerokie pióro na dole"""
    im = Image.new("RGBA", (16, 74), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0 = 5 if lean > 0 else 10
    for i in range(50):
        x = x0 + lean * i * 3 // 50; y = 3 + i
        im.putpixel((x - 1, y), DARK); im.putpixel((x, y), WOOD_L); im.putpixel((x + 1, y), WOOD); im.putpixel((x + 2, y), DARK)
    bx = x0 + lean * 3
    d.ellipse((bx - 5, 50, bx + 6, 73), fill=WOOD, outline=DARK)
    d.line((bx - 2, 54, bx - 2, 69), fill=WOOD_L)
    d.rectangle((x0 - 2, 1, x0 + 3, 4), fill=WOOD_D, outline=DARK)
    return im


def two_oars():
    im = Image.new("RGBA", (26, 74), (0, 0, 0, 0))
    im.alpha_composite(oar(-1), (10, 0)); im.alpha_composite(oar(1), (0, 0))
    return im


def mortar():
    """kamienny moździerz z drewnianym tłuczkiem"""
    im = Image.new("RGBA", (20, 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.line((11, 1, 15, 9), fill=DARK, width=4); d.line((11, 1, 15, 9), fill=WOOD_L, width=2)
    d.pieslice((2, 4, 17, 19), 0, 180, fill=(132, 132, 128, 255), outline=(52, 52, 56, 255))
    d.ellipse((2, 7, 17, 13), fill=(70, 66, 60, 255), outline=(52, 52, 56, 255))
    d.ellipse((4, 8, 15, 12), fill=(96, 120, 70, 255))          # roztarte zioła
    d.line((4, 15, 7, 17), fill=(170, 170, 166, 255))
    return im


def slates():
    """dwie tabliczki łupkowe w drewnianych ramkach, z kredowymi literami"""
    im = Image.new("RGBA", (30, 18), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for (x, y) in ((1, 3), (14, 1)):
        d.rectangle((x, y, x + 13, y + 14), fill=WOOD, outline=DARK)
        d.rectangle((x + 2, y + 2, x + 11, y + 12), fill=(52, 58, 62, 255))
        for k in range(3):
            d.line((x + 3, y + 4 + 3 * k, x + 4 + (k * 3 + x) % 6, y + 4 + 3 * k), fill=(214, 214, 206, 255))
    return im


def chisels():
    """dłuta kamieniarskie i drewniany pobijak"""
    im = Image.new("RGBA", (30, 14), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    iron, iron_l = (110, 114, 122, 255), (170, 174, 182, 255)
    for (y, ln) in ((3, 14), (7, 12)):
        d.rectangle((1, y, 1 + ln, y + 1), fill=iron); d.line((1, y, 1 + ln, y), fill=iron_l)
        d.rectangle((2 + ln, y - 1, 7 + ln, y + 2), fill=WOOD, outline=DARK)
    d.rectangle((21, 2, 28, 7), fill=WOOD_L, outline=DARK)          # pobijak
    d.line((24, 8, 22, 13), fill=DARK, width=3); d.line((24, 8, 22, 13), fill=WOOD, width=1)
    return im


def soap():
    """kostki mydła przewiązane sznurkiem (sklepik z mydłem i świecami)"""
    im = Image.new("RGBA", (22, 14), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for (x, y, c) in ((1, 6, (226, 214, 176, 255)), (11, 6, (198, 214, 170, 255)), (6, 1, (232, 222, 196, 255))):
        d.rectangle((x, y, x + 9, y + 6), fill=c, outline=(110, 98, 72, 255))
        d.line((x + 1, y + 1, x + 8, y + 1), fill=(250, 246, 232, 255))
    d.line((11, 1, 11, 13), fill=ROPE_D)
    return im


def build():
    S = Sheet()
    # ======== blok 0: stajnia
    kon = MP.downscale(src("kon_gniady.png"), 1.0)          # (koń jest już w skali 1x: 77x67 px)
    variants = [("gniady", kon), ("siwy", recolor(kon, horse_grey)), ("kary", recolor(kon, horse_black))]
    for p, (n, im) in enumerate(variants):
        im = MP.with_shadow(im)
        S.put("kon_%s" % n, 0, 2, p, im, 2, "floor", "koń %s w boksie (głową w lewo)" % n, occupy="right=1")
        S.put("kon_%s_prawo" % n, 0, 4, p, MP.with_shadow(variants[p][1].transpose(Image.FLIP_LEFT_RIGHT)), 2, "floor",
              "koń %s w boksie (głową w prawo)" % n, occupy="right=1")
    if os.path.exists(os.path.join(SRC, "siodlo.png")):
        s = MP.outline(MP.downscale(src("siodlo.png"), 0.42))
        S.put("siodlo", 0, 6, 0, MP.with_shadow(s), 1, "floor", "siodło na stojaku")
    if os.path.exists(os.path.join(SRC, "chomato.png")):
        c = MP.outline(MP.downscale(src("chomato.png"), 0.5))
        S.put("chomato", 0, 6, 1, c, 1, "wall", "chomąto i lejce na kołku", dy=-14)
    S.put("stog_siana", 0, 6, 2, ext(13, 10, 3, 2), 3, "floor", "stóg siana", occupy="left=1,right=1")
    S.put("koryto", 0, 8, 0, MP.with_shadow(ext(9, 2, 2, 1)), 2, "floor", "koryto z wodą", occupy="right=1")
    S.put("kolo_wozu", 0, 8, 1, ext(14, 8), 1, "floor", "koło od wozu oparte o ścianę")
    S.put("sloma", 0, 8, 2, ext(14, 12), 1, "decal", "rozsypana słoma")
    # ======== blok 1: kaplica
    S.put("krucyfiks", 1, 2, 0, corpus_on_cross(cat(4, 5, 1, 2)), 1, "wall", "krucyfiks na ścianie", dy=-30)
    S.put("krzyz_oltarz", 1, 2, 1, cat(14, 3), 1, "table", "drewniany krzyż na ołtarzu", dy=-14)
    S.put("oltarz", 1, 2, 2, MP.with_shadow(cat(11, 2, 3, 2)), 3, "floor", "ołtarz z czerwonym obrusem",
          occupy="left=1,right=1")
    if os.path.exists(os.path.join(SRC, "ikona.png")):
        ik = MP.outline(MP.downscale(src("ikona.png"), 0.42))
        S.put("ikona", 1, 4, 0, ik, 1, "wall", "ikona świętej w złoconej ramie", dy=-12)
    for p, col in enumerate((5, 6)):
        S.put("witraz_%d" % (p + 1), 1, 4, p + 1, cat(col, 8, 1, 2), 1, "wall", "witraż", dy=-6)
    S.put("witraz_3", 1, 6, 0, cat(4, 8, 1, 2), 1, "wall", "witraż", dy=-6)
    # ======== blok 2: ciesla, weteran, różne
    if os.path.exists(os.path.join(SRC, "koziol.png")):
        k = MP.outline(MP.downscale(src("koziol.png"), 0.5))
        S.put("koziol", 2, 2, 0, MP.with_shadow(k), 2, "floor", "kozioł ciesielski z deską i piłą", occupy="right=1")
    S.put("deski_oparte", 2, 2, 1, ext(15, 7, 1, 2), 1, "floor", "deski oparte o ścianę")
    S.put("deska", 2, 2, 2, ext(14, 7), 1, "floor", "deska oparta o ścianę")
    S.put("pniak_siekiera", 2, 4, 0, ext(12, 4, 1, 2), 1, "floor", "pniak z wbitą siekierą")
    S.put("kloda", 2, 4, 1, ext(9, 3, 2, 1), 2, "floor", "kłoda do obróbki", occupy="right=1")
    S.put("stos_drewna", 2, 4, 2, ext(8, 4, 3, 2), 3, "floor", "stos drewna i desek", occupy="left=1,right=1")
    S.put("kula", 2, 6, 0, MP.with_shadow(crutch()), 1, "floor", "kula (laska) weterana")
    S.put("lina", 2, 6, 1, ext(15, 9), 1, "wall", "zwój liny na kołku", dy=-16)
    S.put("rozsypane_wiory", 2, 6, 2, ext(14, 12).transpose(Image.FLIP_LEFT_RIGHT), 1, "decal", "wióry / słoma na podłodze")
    S.put("lopata", 2, 8, 0, MP.with_shadow(shovel()), 1, "floor", "łopata oparta o ścianę")
    S.put("lopaty", 2, 8, 1, MP.with_shadow(two_shovels()), 1, "floor", "dwie łopaty grabarza")
    S.put("przegroda", 2, 8, 2, MP.with_shadow(ext(14, 0, 1, 3)), 1, "floor", "przegroda boksu (deski na kozłach)", occupy="up=1")
    # ======== blok 3: domy w pierzejach (rybak, zielarz, skryba, kamieniarz, sklepik)
    S.put("siec", 3, 2, 0, net(), 1, "wall", "sieć rybacka na kołkach", dy=-8)
    S.put("wioslo", 3, 2, 1, MP.with_shadow(oar()), 1, "floor", "wiosło oparte o ścianę")
    S.put("wiosla", 3, 2, 2, MP.with_shadow(two_oars()), 1, "floor", "para wioseł")
    S.put("mozdzierz", 3, 4, 0, mortar(), 1, "table", "moździerz z tłuczkiem")
    S.put("tabliczki", 3, 4, 1, slates(), 1, "table", "tabliczki łupkowe z kredą")
    S.put("dluta", 3, 4, 2, chisels(), 1, "table", "dłuta i pobijak kamieniarza")
    S.put("mydlo", 3, 6, 0, soap(), 1, "table", "kostki mydła")
    S.save()
    pv = Image.new("RGBA", S.im.size, (70, 60, 70, 255)); pv.alpha_composite(S.im)
    dr = ImageDraw.Draw(pv)
    for k, v in S.index.items():
        fx, fy = frame_xy(v["index"], v["direction"], v["pattern"])
        dr.rectangle((fx, fy, fx + F - 1, fy + F - 1), outline=(20, 20, 20))
        dr.text((fx + 3, fy + 3), k, fill=(255, 255, 0))
    pv.convert("RGB").save(PREVIEW)
    print("%s: %d rekwizytów -> %s" % (SHEET_NAME, len(S.index), os.path.relpath(SHEET, ROOT)))


if __name__ == "__main__":
    build()
