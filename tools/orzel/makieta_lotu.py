# python tools/orzel/makieta_lotu.py <katalog ze zrzutami z lot_zrzut.js>
#   -> docs/orzel/makieta_lotu.png          bohater na grzbiecie orła nad miasteczkiem (Map008, zoom 0,5), HUD gry + panel lotu
#   -> docs/orzel/lot_zoom_porownanie.png   ten sam widok: zwykły (x1) i z orła (x0,5), oraz pole dziadka x0,5 (problem krawędzi)
#   -> docs/orzel/dorosly_ziemia_lot.png    dorosły orzeł na ziemi i w locie (z jeźdźcem i bez), obok bohater, x2
#   -> docs/orzel/jajo_gniazdo.png          jajo w gnieździe, obok bohater, x4
#   -> docs/orzel/ryzyko_noc_deszcz.png     (gdy są zrzuty "ryzyka") noc i deszcz przy x0,5 bez poprawek warstw
#
# Biały orzeł, ETAP 1 (koncepcja). Zrzut mapy to prawdziwa gra oddalona prototypem w samej stronie (lot_zrzut.js); orzeł, jeździec,
# cień, chmury, znacznik lądowania i panel lotu są doklejone tutaj (tak będą rysowane w grze: orzeł w skali 1 nad światem w skali 0,5).
# Jeździec = bohater z img/characters/Hero_Walk.png (wiersz N, góra postaci) na grzbiecie orła z tools/orzel/raw/dorosly_lot.png.
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RAW = os.path.join(HERE, "raw")
DOCS = os.path.join(ROOT, "docs", "orzel")
SHOTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "zrzuty")
FONT = os.path.join(ROOT, "fonts", "AlegreyaSans-Medium.ttf")
FONT_B = os.path.join(ROOT, "fonts", "AlegreyaSans-Bold.ttf")
HERO = os.path.join(ROOT, "img", "characters", "Hero_Walk.png")
GRASS_SRC = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior",
                         "Fantasy_Tileset_Green_Edition_upgrade", "tilesets", "Fantasy_Outside_A2_2_green.png")
FLY = "dorosly_lot256.png"   # orzeł w locie 256x256 (rozpiętość 205 px); dorosly_lot.png = pierwsza, za mała próba 192x192
YELLOW = (255, 214, 64)
WHITE = (240, 236, 224)
PANEL = (0, 0, 0, 185)


def font(bold, size):
    return ImageFont.truetype(FONT_B if bold else FONT, size)


def trimmed(im):
    return im.crop(im.getbbox())


def hero_frame(row):
    return Image.open(HERO).convert("RGBA").crop((0, row * 64, 64, row * 64 + 64))


def rider_on(eagle):
    """bohater od tyłu (wiersz N) do pasa na barkach orła; zwraca orła z jeźdźcem i punkt środka grzbietu"""
    e = eagle.copy()
    hero = trimmed(hero_frame(4))                      # 27 x 59, patrzy w górę ekranu
    top = hero.crop((0, 0, hero.width, 35))            # głowa + tunika do pasa (nogi schowane za skrzydłami)
    bb = eagle.getbbox()
    bx, by = (bb[0] + bb[2]) // 2 - top.width // 2, bb[1] + 30   # głowa orła widać nad głową jeźdźca
    # cień jeźdźca na piórach grzbietu
    sh = Image.new("RGBA", e.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((bx - 4, by + 22, bx + top.width + 4, by + 42), fill=(70, 80, 100, 110))
    e.alpha_composite(sh.filter(ImageFilter.GaussianBlur(2)))
    # dół tuniki wtopiony w pióra (2 ostatnie wiersze półprzezroczyste)
    t = top.copy()
    px = t.load()
    for y in range(t.height - 3, t.height):
        for x in range(t.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, a // (2 + y - (t.height - 3)))
    e.alpha_composite(t, (bx, by))
    return e


def silhouette(im, alpha):
    a = im.split()[3].point(lambda v: alpha if v > 40 else 0)
    s = Image.new("RGBA", im.size, (0, 0, 0, 0))
    s.putalpha(a)
    return s


def cloud(w, h, alpha, seed):
    """miękka chmura z kilku rozmytych elips"""
    import random
    rnd = random.Random(seed)
    c = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    for _ in range(9):
        rw, rh = rnd.randint(w // 8, w // 5), rnd.randint(h // 7, h // 4)
        cx, cy = rnd.randint(w // 3, w - w // 3), rnd.randint(h // 3, h - h // 3)
        d.ellipse((cx - rw, cy - rh, cx + rw, cy + rh), fill=(255, 255, 255, alpha))
    c = c.filter(ImageFilter.GaussianBlur(min(w, h) // 12))
    return c


def panel(img, box, radius=10):
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).rounded_rectangle(box, radius=radius, fill=PANEL)
    img.alpha_composite(ov)


def bar(d, x, y, w, h, frac, col):
    d.rectangle((x, y, x + w, y + h), fill=(30, 30, 30, 255))
    d.rectangle((x + 1, y + 1, x + 1 + int((w - 2) * frac), y + h - 1), fill=col)


def mockup():
    shot = Image.open(os.path.join(SHOTS, "m008_z050_linear.png")).convert("RGBA")
    W, H = shot.size
    eagle = Image.open(os.path.join(RAW, FLY)).convert("RGBA")
    ride = trimmed(rider_on(eagle))
    img = shot.copy()

    ex, ey = 735, 455                                   # środek orła na ekranie (leci w górę ekranu)
    # znacznik lądowania przed orłem: otwarty plac (świat w skali 0,5: pole = 24 px)
    lx, ly = 600, 395
    ring = Image.new("RGBA", img.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    for i, a in ((0, 210), (3, 90)):
        rd.ellipse((lx - 40 - i, ly - 20 - i, lx + 40 + i, ly + 20 + i), outline=(120, 230, 120, a), width=3)
    img.alpha_composite(ring)
    # cień orła na ziemi: sylwetka w skali świata (0,5), w południe słońce z góry -> pod orłem, przesunięty o wysokość lotu
    sil = silhouette(eagle, 130).resize((eagle.width // 2, eagle.height // 2), Image.NEAREST).filter(ImageFilter.GaussianBlur(1.2))
    img.alpha_composite(sil, (ex - sil.width // 2 + 30, ey - sil.height // 2 + 150))
    # chmury pod orłem (między nim a ziemią) i jedna nad wszystkim przy krawędzi
    img.alpha_composite(cloud(360, 170, 150, 3), (60, 470))
    img.alpha_composite(cloud(300, 140, 120, 8), (960, 360))
    # orzeł z jeźdźcem w skali 1 (ostre piksele), lekki cień konturu
    glow = silhouette(ride, 60).filter(ImageFilter.GaussianBlur(3))
    img.alpha_composite(glow, (ex - ride.width // 2 + 2, ey - ride.height // 2 + 4))
    img.alpha_composite(ride, (ex - ride.width // 2, ey - ride.height // 2))
    img.alpha_composite(cloud(420, 200, 95, 21), (900, 560))

    # panel lotu (styl gry: czarny + żółty, Alegreya Sans), na dole pośrodku
    d = ImageDraw.Draw(img)
    px0, py0, px1, py1 = 330, 640, 950, 708
    panel(img, (px0, py0, px1, py1))
    d = ImageDraw.Draw(img)
    d.text((px0 + 16, py0 + 8), "Lot: Śnieżny", font=font(True, 22), fill=YELLOW)
    d.text((px0 + 150, py0 + 12), "Siła skrzydeł", font=font(False, 17), fill=WHITE)
    bar(d, px0 + 250, py0 + 15, 180, 12, 0.78, (240, 240, 255, 255))
    d.text((px0 + 440, py0 + 11), "78%   wysoko", font=font(False, 17), fill=WHITE)
    d.text((px0 + 16, py0 + 40), "WASD / strzałki: lot   Shift: szybciej   Spacja: nurkuj   Q: wyżej / niżej   L: ląduj",
           font=font(False, 17), fill=(220, 214, 196))
    # podpis znacznika
    panel(img, (lx - 70, ly + 26, lx + 70, ly + 50), radius=6)
    d = ImageDraw.Draw(img)
    d.text((lx, ly + 29), "L: tu wylądujesz", font=font(True, 16), fill=(150, 240, 150), anchor="ma")

    out = img.convert("RGB").resize((W * 3 // 2, H * 3 // 2), Image.NEAREST)   # jak pełny ekran 1920x1080
    out.save(os.path.join(DOCS, "makieta_lotu.png"))
    print("makieta_lotu.png", out.size)


def zoom_compare():
    a = Image.open(os.path.join(SHOTS, "m008_z100.png")).convert("RGB")
    b = Image.open(os.path.join(SHOTS, "m008_z050_linear.png")).convert("RGB")
    c = Image.open(os.path.join(SHOTS, "m003_z050_linear.png")).convert("RGB")
    w, h = a.size
    s = 0.5
    tw, th = int(w * s), int(h * s)
    out = Image.new("RGB", (tw * 3 + 40, th + 70), (16, 16, 16))
    d = ImageDraw.Draw(out)
    for i, (im, t1, t2) in enumerate([
            (a, "Pieszo: zoom x1", "26,7 x 15 pól na ekranie"),
            (b, "Z orła: zoom x0,5", "53 x 30 pól - całe miasteczko wszerz"),
            (c, "Pole dziadka 40 x 30 przy x0,5", "mapa mniejsza niż widok: czarne pasy (do wypełnienia)")]):
        x = 10 + i * (tw + 10)
        out.paste(im.resize((tw, th), Image.LANCZOS), (x, 60))
        d.text((x, 6), t1, font=font(True, 22), fill=YELLOW)
        d.text((x, 33), t2, font=font(False, 17), fill=WHITE)
    out.save(os.path.join(DOCS, "lot_zoom_porownanie.png"))
    print("lot_zoom_porownanie.png", out.size)


def grass_tile():
    a2 = Image.open(GRASS_SRC).convert("RGBA")
    t = Image.new("RGBA", (48, 48))
    for i, (qx, qy) in enumerate([(2, 4), (1, 4), (2, 3), (1, 3)]):
        t.paste(a2.crop((qx * 24, qy * 24, qx * 24 + 24, qy * 24 + 24)), ((i % 2) * 24, (i // 2) * 24))
    return t


def ground_and_flight():
    stand = trimmed(Image.open(os.path.join(RAW, "dorosly.png")).convert("RGBA"))
    fly = trimmed(Image.open(os.path.join(RAW, FLY)).convert("RGBA"))
    ride = trimmed(rider_on(Image.open(os.path.join(RAW, FLY)).convert("RGBA")))
    hero = trimmed(hero_frame(6))
    W, H = 48 * 15, 48 * 6
    g = grass_tile()
    img = Image.new("RGBA", (W, H))
    for y in range(0, H, 48):
        for x in range(0, W, 48):
            img.paste(g, (x, y))
    ground = H - 22
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.ellipse((14, ground - 4, 14 + hero.width, ground + 4), fill=(0, 0, 0, 70))
    sd.ellipse((50, ground - 10, 50 + stand.width, ground + 10), fill=(0, 0, 0, 70))
    img.alpha_composite(sh)
    img.alpha_composite(hero, (14, ground - hero.height))
    img.alpha_composite(stand, (50, ground - stand.height))
    # w locie: cień na ziemi pod spodem (w skali świata), sylwetki w skali 1
    for k, (sprite, cx) in enumerate([(fly, 50 + stand.width + 40 + fly.width // 2), (ride, 50 + stand.width + 70 + fly.width + ride.width // 2)]):
        sil = silhouette(sprite, 55).filter(ImageFilter.GaussianBlur(1.5))
        img.alpha_composite(sil, (cx - sil.width // 2 + 10, ground - sil.height + 6))
        img.alpha_composite(sprite, (cx - sprite.width // 2, 20))
    big = img.resize((W * 2, H * 2), Image.NEAREST)
    d = ImageDraw.Draw(big)
    panel(big, (0, 0, W * 2, 40), radius=0)
    d = ImageDraw.Draw(big)
    d.text((16, 8), "Dorosły orzeł: na ziemi (ok. 3 x 3 pola)   |   w locie (rozpiętość ok. 4,3 pola)   |   w locie z bohaterem na grzbiecie   (x2)",
           font=font(True, 22), fill=YELLOW)
    big.convert("RGB").save(os.path.join(DOCS, "dorosly_ziemia_lot.png"))
    print("dorosly_ziemia_lot.png", big.size)


def egg():
    nest = trimmed(Image.open(os.path.join(RAW, "jajo_gniazdo.png")).convert("RGBA"))
    hero = trimmed(hero_frame(0))
    W, H = 48 * 3, 48 * 2
    a3 = os.path.join(os.path.dirname(GRASS_SRC), "Fantasy_Outside_A2_2_green.png")
    g = grass_tile()
    img = Image.new("RGBA", (W, H))
    for y in range(0, H, 48):
        for x in range(0, W, 48):
            img.paste(g, (x, y))
    ground = H - 8
    img.alpha_composite(hero, (8, ground - hero.height))
    img.alpha_composite(nest, (W - nest.width - 14, ground - nest.height + 2))
    big = img.resize((W * 4, H * 4), Image.NEAREST)
    d = ImageDraw.Draw(big)
    panel(big, (0, 0, W * 4, 34), radius=0)
    d = ImageDraw.Draw(big)
    d.text((10, 6), "Jajo w gnieździe (x4, obok bohater)", font=font(True, 20), fill=YELLOW)
    big.convert("RGB").save(os.path.join(DOCS, "jajo_gniazdo.png"))
    print("jajo_gniazdo.png", big.size)


def risks():
    """noc i deszcz przy x0,5 bez poprawek: warstwa nocy i deszcz mają rozmiar ekranu, więc kryją tylko lewą górną ćwiartkę"""
    files = [("noc_m003_z050_linear.png", "Noc przy x0,5 bez poprawki", "ciemność nocy (Farming_Render) kryje tylko ćwierć widoku"),
             ("deszcz_m003_z050_linear.png", "Deszcz przy x0,5 bez poprawki", "krople (Weather) też tylko w lewej górnej ćwiartce")]
    if not all(os.path.exists(os.path.join(SHOTS, f)) for f, *_ in files):
        return
    tw, th = 640, 360
    out = Image.new("RGB", (tw * 2 + 30, th + 70), (16, 16, 16))
    d = ImageDraw.Draw(out)
    for i, (f, t1, t2) in enumerate(files):
        x = 10 + i * (tw + 10)
        out.paste(Image.open(os.path.join(SHOTS, f)).convert("RGB").resize((tw, th), Image.LANCZOS), (x, 60))
        d.text((x, 6), t1, font=font(True, 22), fill=YELLOW)
        d.text((x, 33), t2, font=font(False, 17), fill=WHITE)
    out.save(os.path.join(DOCS, "ryzyko_noc_deszcz.png"))
    print("ryzyko_noc_deszcz.png", out.size)


if __name__ == "__main__":
    os.makedirs(DOCS, exist_ok=True)
    mockup()
    zoom_compare()
    ground_and_flight()
    egg()
    risks()
