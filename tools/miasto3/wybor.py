# -*- coding: utf-8 -*-
"""Budynki i rzeczy z paczki Fantastic Buildings: Medieval wybrane dla Kruczogrodu (okna arkuszy w kratkach, włącznie) i ich drzwi
(kratki okna liczone od jego lewego górnego rogu). Podgląd wszystkich wycinków z siatką: python tools/miasto3/wybor.py <wyjście.png>"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

PACK = r"C:\Program Files (x86)\Steam\steamapps\common\RPG Maker MZ\dlc\Fantastic Buildings - Medieval\Tilesets"
T = 48
# name: (sheet, x0, y0, x1, y1, doors [(dx, dy)], what)
WYBOR = {
    "gildia": ("City_TileD", 8, 0, 12, 9, [(2, 9)], "dom cechowy z wieżyczkami i godłem - front tawerny"),
    "kamienica": ("City_TileC", 2, 0, 7, 8, [], "długa kamienica z lukarnami"),
    "dom_balkon": ("City_TileC", 8, 1, 11, 12, [(2, 8)], "wysoki dom z balkonem"),
    "dom_galeria": ("City_TileC", 12, 1, 15, 10, [(1, 6)], "dom z galerią i beczkami"),
    "dom_kwiaty": ("City_TileB", 3, 0, 7, 5, [(2, 5)], "dom z balkonem kwiatów"),
    "dom_waski": ("City_TileB", 0, 0, 2, 7, [(0, 7)], "wąski dom"),
    "kuznia": ("City_TileB", 8, 0, 15, 8, [(6, 6)], "kuźnia z paleniskiem i schodami"),
    "sklep": ("City_TileD", 0, 0, 3, 9, [(2, 9)], "dom z kramem w oknie (piekarnia, kupiec)"),
    "dom_wieza": ("City_TileD", 13, 0, 15, 9, [(1, 7)], "kamienny dom-wieża (strażnica, dzwonnica)"),
    "ratusz": ("City_TileC", 1, 9, 7, 15, [(4, 6)], "duża hala z gankiem i świecami (ratusz)"),
    "kosciol": ("City_TileE", 0, 0, 8, 11, [(4, 11)], "kościół z witrażami (kaplica)"),
    "stajnia_strzecha": ("Rural_TileE", 0, 12, 7, 15, [(6, 3)], "stajnia pod strzechą z końmi"),
    "stajnia_bale": ("Rural_TileD", 0, 11, 7, 15, [(4, 4)], "stajnia z bali z końmi"),
    "zajazd": ("Rural_TileE", 8, 0, 15, 7, [(1, 7)], "zajazd z arkadami i stołami"),
    "chata_a": ("Rural_TileE", 13, 8, 15, 15, [(1, 7)], "chata pod strzechą"),
    "chata_b": ("Rural_TileD", 8, 11, 11, 15, [(2, 4)], "mała chata pod strzechą"),
    "studnia": ("City_TileD", 8, 10, 11, 14, [], "studnia - ośmiokątna cembrowina"),
    "kramy": ("Rural_TileB", 0, 6, 7, 9, [], "trzy kramy targowe z towarem"),
    "mur_baszty": ("City_TileE", 9, 0, 15, 5, [], "mur z basztami"),
    "mur_pion": ("City_TileE", 9, 6, 10, 15, [], "mur w pionie"),
    "brama": ("City_TileE", 13, 12, 15, 15, [(1, 3)], "brama w murze z kratą"),
    "szyldy": ("City_TileB", 0, 8, 1, 15, [], "szyldy cechów"),
    "latarnie": ("City_TileB", 6, 13, 7, 15, [], "latarnie"),
    "szubienica": ("City_TileD", 14, 12, 15, 15, [], "szubienica"),
    "ogrodki": ("Rural_TileB", 0, 10, 7, 15, [], "grządki, zboże, beczki, koryto"),
    "dom_bale": ("Rural_TileB", 11, 8, 15, 15, [(2, 7)], "dom z bali"),
}


def crop(name):
    s, x0, y0, x1, y1, doors, what = WYBOR[name]
    return Image.open(os.path.join(PACK, s + ".png")).convert("RGBA").crop((x0 * T, y0 * T, (x1 + 1) * T, (y1 + 1) * T))


if __name__ == "__main__":
    out = sys.argv[1]
    ims = [(n, crop(n)) for n in WYBOR]
    W = 2400
    x = y = 0; rowh = 0; places = []
    for n, im in ims:
        if x + im.width > W: x = 0; y += rowh + 40; rowh = 0
        places.append((n, im, x, y)); x += im.width + 30; rowh = max(rowh, im.height)
    sheet = Image.new("RGBA", (W, y + rowh + 40), (52, 54, 58, 255))
    d = ImageDraw.Draw(sheet)
    font = ImageFont.truetype(os.path.join(os.path.dirname(__file__), "..", "..", "fonts", "AlegreyaSans-Bold.ttf"), 20)
    for n, im, x, y in places:
        sheet.alpha_composite(im, (x, y + 30))
        for gx in range(0, im.width + 1, T): d.line([(x + gx, y + 30), (x + gx, y + 30 + im.height)], fill=(255, 60, 60, 90))
        for gy in range(0, im.height + 1, T): d.line([(x, y + 30 + gy), (x + im.width, y + 30 + gy)], fill=(255, 60, 60, 90))
        for (dx, dy) in WYBOR[n][5]: d.rectangle([x + dx * T + 2, y + 30 + dy * T + 2, x + (dx + 1) * T - 2, y + 30 + (dy + 1) * T - 2], outline=(80, 255, 120, 255), width=3)
        d.text((x, y + 4), n, font=font, fill=(255, 230, 90, 255))
    sheet.convert("RGB").save(out)
    print(out, sheet.size)
