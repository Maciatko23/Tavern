# Obrazy porównawcze "Czystego widoku": makieta obok zrzutu z gry, stary wygląd obok nowego, jasne tła.
#   python tools/ui_czysty/porownanie.py
# Wejście: docs/ui_pomysly/pomysl_4_czysty_*.png (makiety) i docs/ui_czysty/*.png (zrzuty z tools/ui_czysty/capture.js).
# Wyjście: docs/ui_czysty/porownanie_hud.png, porownanie_menu.png, przed_po.png, jasne_tla.png.
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MOCK = os.path.join(ROOT, "docs", "ui_pomysly")
OUT = os.path.join(ROOT, "docs", "ui_czysty")
FONT = os.path.join(ROOT, "fonts", "AlegreyaSans-Medium.ttf")


def font(size):
    try:
        return ImageFont.truetype(FONT, size)
    except OSError:
        return ImageFont.load_default()


def tile(path, w):
    im = Image.open(path).convert("RGB")
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def sheet(cells, cols, w, out, title):
    """cells: [(path, label)] - a grid with a label over each picture"""
    pics = [(tile(p, w), lab) for p, lab in cells if os.path.exists(p)]
    if not pics:
        return None
    ph = max(p.height for p, _ in pics)
    rows = (len(pics) + cols - 1) // cols
    pad, head, lab = 16, 54, 34
    im = Image.new("RGB", (pad + cols * (w + pad), head + rows * (lab + ph + pad)), (16, 18, 22))
    d = ImageDraw.Draw(im)
    d.text((pad, 12), title, font=font(28), fill=(255, 210, 63))
    for i, (p, label) in enumerate(pics):
        x = pad + (i % cols) * (w + pad)
        y = head + (i // cols) * (lab + ph + pad)
        d.text((x, y + 4), label, font=font(20), fill=(236, 238, 240))
        im.paste(p, (x, y + lab))
    path = os.path.join(OUT, out)
    im.save(path)
    return path


def compass_closeup(out):
    """the round compass (top right corner) of two shots, magnified x2: the goal on another map, a person on this map"""
    shots = [("czysty_hud.png", "Cel na innej mapie: strzałka do przejścia"), ("czysty_miasteczko.png", "Cel na tej mapie: osoba (kowal)")]
    crops = []
    for name, label in shots:
        f = os.path.join(OUT, name)
        if os.path.exists(f):
            im = Image.open(f).convert("RGB").crop((1080, 0, 1280, 180))
            crops.append((im.resize((im.width * 2, im.height * 2), Image.NEAREST), label))
    if not crops:
        return None
    pad, head, lab = 16, 54, 34
    w = sum(c.width for c, _ in crops) + pad * (len(crops) + 1)
    h = head + lab + max(c.height for c, _ in crops) + pad
    sheet_im = Image.new("RGB", (w, h), (16, 18, 22))
    d = ImageDraw.Draw(sheet_im)
    d.text((pad, 12), "Okrągły kompas w prawym górnym rogu (x2)", font=font(28), fill=(255, 210, 63))
    x = pad
    for c, label in crops:
        d.text((x, head + 4), label, font=font(20), fill=(236, 238, 240))
        sheet_im.paste(c, (x, head + lab))
        x += c.width + pad
    path = os.path.join(OUT, out)
    sheet_im.save(path)
    return path


if __name__ == "__main__":
    print(compass_closeup("czysty_kompas.png"))
    W = 900
    print(sheet([(os.path.join(MOCK, "pomysl_4_czysty_hud.png"), "Makieta (pomysl_4_czysty_hud.png)"),
                 (os.path.join(OUT, "czysty_hud.png"), "W grze: okrągły kompas, bez paska doświadczenia i bez łuku (zmiany użytkownika)")],
                2, W, "porownanie_hud.png", "Czysty widok - mapa: makieta i gra"))
    print(sheet([(os.path.join(MOCK, "pomysl_4_czysty_okno.png"), "Makieta (pomysl_4_czysty_okno.png)"),
                 (os.path.join(OUT, "czysty_menu.png"), "W grze (MenuRing.js)")],
                2, W, "porownanie_menu.png", "Czysty widok - menu P: makieta i gra"))
    print(sheet([(os.path.join(OUT, "klasyczny_hud.png"), "Przed: Klasyczny (Opcje → Wygląd)"),
                 (os.path.join(OUT, "czysty_hud.png"), "Po: Czysty widok (domyślny)")],
                2, W, "przed_po.png", "Przed i po"))
    print(sheet([(os.path.join(OUT, "czysty_burza_blysk.png"), "Błysk burzy (przyciemnienie krawędzi rośnie)"),
                 (os.path.join(OUT, "czysty_miasteczko.png"), "Jasny bruk miasteczka, kompas do osoby"),
                 (os.path.join(OUT, "czysty_walka.png"), "Tryb walki: oddech jako piąty pasek, nic pod bohaterem"),
                 (os.path.join(OUT, "czysty_noc.png"), "Noc: księżyc na łuku")],
                2, 620, "jasne_tla.png", "Czytelność na różnym tle"))
