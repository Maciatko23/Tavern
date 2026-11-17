# -*- coding: utf-8 -*-
"""Odtworzenie wzoru gracza (obrazek 1, 2026-11-15: półka z wejściem do sztolni, taczka, beczka, dół z kilofem, most linowy nad
rozpadliną, drabina w dół urwiska, stalagmity w mroku) z naszych kafli Winlu Dungeon - BEZ wody. Tylko obraz podglądu.
  python tools/nowy_swiat/sztolnia_wzor1.py <plik.png>"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "kopalnia"))
import zbuduj as K
from zbuduj import W, uglib, DMap
from uglib import F_MOSSY, FILM_CRACKS, FILM_DIRT, FILM_RUBBLE, FILM_MOSS
from chunks_deep import W_CAVE_MOSS, FILM_HOLE

MW, MH = 24, 22


def build():
    mp = DMap(990226, MW, MH, "Sztolnia - wzór 1", K.NOTE, bgm="", seed=3, tileset=20)
    R = mp.rect
    inside = R(0, 3, 23, 21)
    # the upper ledge: its southern edge climbs to the right in steps (as in the picture), the right ledge beyond the chasm
    upper = R(0, 3, 12, 6) | R(0, 7, 10, 8) | R(0, 9, 7, 9) | R(11, 3, 13, 4)
    right = R(19, 3, 23, 7) | R(20, 8, 23, 9) | R(21, 10, 23, 11) | R(22, 12, 23, 13)   # its edge falls away to the right, step by step
    lower = R(0, 15, 9, 16) | R(0, 17, 6, 21) | R(7, 17, 11, 18)
    low2 = R(11, 20, 15, 21)
    ledges = upper | right | lower | low2
    hole = inside - ledges
    mp.shell(ledges | hole, F_MOSSY, W_CAVE_MOSS)
    mp.film(FILM_HOLE, hole)
    # the cliffs: four cells of rock under the upper ledges, two under the lower ones
    cliff = set()
    for (x, y) in sorted(ledges):
        if (x, y + 1) not in hole: continue
        deep = 4 if (x, y) in upper | right else 2
        for k in range(1, deep + 1):
            c = (x, y + k)
            if c not in hole: break
            cliff.add(c)
    # the same rock as the cave's walls (the A4 side of the mossy boulders, kind 89): its edges where the cliff ends
    for (x, y) in cliff:
        shape = (1 if (x - 1, y) not in cliff and (x - 1, y) not in ledges else 0) | (4 if (x + 1, y) not in cliff and (x + 1, y) not in ledges else 0)             | (8 if (x, y + 1) not in cliff else 0)
        mp.layers[1][(x, y)] = ("t", 2048 + 89 * 48 + shape)
    mp.film(FILM_RUBBLE, R(5, 6, 7, 7))                  # the dug pit: the rounded brown patch
    mp.film(FILM_CRACKS, {(11, 5), (2, 8), (21, 6), (3, 18), (22, 11)}); mp.film(FILM_MOSS, {(0, 4), (1, 4), (12, 4), (22, 4), (23, 4), (0, 16), (1, 16), (9, 16), (2, 20), (14, 21)})
    mp.shadows()
    P = mp.piece
    P("most_poziomy", 14, 2)                             # the rope bridge: its deck on row 3
    for y in (10, 12): P("drabina", 4, y)                # the ladder down the cliff to the lower ledge
    # the adit and the diggers' things
    P("wejscie_sztolni", 4, 1); P("kilof_oparty", 3, 2); K.lantern(mp, 7, 2)
    P("wozek_pusty", 6, 3); P("beczka_rozbita", 9, 3); P("gruz_szary", 7, 5); P("kamyki_br", 5, 5); P("gruz_belka", 5, 3); P("wozek_ruda", 11, 5)
    P("kilof_oparty", 8, 5); P("glaz_szary", 4, 7); P("kamien_okragly", 8, 8); P("skrzynka_otwarta", 2, 3); P("beczka", 1, 3); K.brazier(mp, 11, 3, "Kosz z ogniem")
    P("kupa_skal", 9, 6); P("skala_wysoka", 2, 5); P("skrzynka_plotno", 1, 7); P("worki_stos", 0, 8); P("deska_lezaca", 10, 4)
    # the right ledge, the lower ledges
    P("skala_wysoka", 22, 5); P("kamien_plaski", 20, 8); P("stalagmity_male", 22, 10); P("krysztaly_ziel", 21, 3); P("grzybki", 20, 6); K.lantern(mp, 21, 2)
    P("stempel_t", 2, 15); P("stempel_t", 7, 15); P("glaz_szary", 1, 19); P("kupa_skal", 12, 19); P("worki_stos", 5, 19); P("skrzynie_wysokie", 3, 18); P("krysztal_ziel", 9, 17)
    P("paprocie", 0, 17); P("grzyb_duzy", 10, 16); K.brazier(mp, 6, 17, "Ognisko")
    # stalagmites out of the dark, tall behind and smaller in front
    for n, x, y in (("stalagmit", 14, 9), ("stalagmit2", 16, 10), ("stalagmit", 12, 11), ("stalagmit2", 17, 13), ("stalagmit", 15, 13), ("stalagmit2", 13, 15),
                    ("stalagmit", 18, 16), ("stalagmit2", 16, 17), ("stalagmit", 20, 17)):
        P(n, x, y)
    return mp


if __name__ == "__main__":
    mp = build()
    text = W.map_text(mp.to_json())
    ts, _ = K.read_db("data/Tilesets.json")
    img = uglib.render(json.loads(text), None, sheets=K.KSheets(ts[20]))
    img.convert("RGB").save(sys.argv[1]); print(img.size)
