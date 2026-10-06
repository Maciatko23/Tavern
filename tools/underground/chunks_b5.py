# Band 5 "Warstwa Prawdy" (floors 76-99): the chunk library Map144 on tileset 10. Pale stone, ice and a violet mist; every flame
# here burns blue (still a flame). The places of the Truth Layer: <Szept> - a voice comes out of the dark from here (Underground.js
# barks a whisper), <Zjawa> - someone from up there is seen for a moment, then gone. The floor's note (<Zapiski>) is a truth -
# a page in the hero's own handwriting (Underground_Data NOTES 76-99, "who").
# Creature places (docs/PODZIEMIA.md "Stwory - kontrakt"): upior, cien.
from chunks_deep import *   # noqa: F401,F403

B5 = "76-99"


def b5_szepty(lib, ox, oy):
    """the hall of whispers: blue candelabra, the mist low on the floor, voices from three corners"""
    c = XChunk(lib, "Sala szeptów", ox, oy, full_rows(15, 11), W_PALE, F_BLUEGREY, weight=3, floors=B5)
    c.door("N", 11, 3); c.door("S", 6, 9); c.door("W", 1, 7); c.door("E", 13, 5)
    c.stairs(3)
    c.candle(5, 3, big=True, blue=True); c.candle(9, 3, big=True, blue=True)
    c.whisper(2, 4); c.whisper(12, 8); c.whisper(7, 6)
    c.vision(10, 6)
    c.piece("krysztal_nieb", 1, 8)
    c.loot("dzban", 13, 9, "dzbany")
    c.spawn("upior", 7, 8)
    c.note(4, 8, "kartki")
    c.film(FILM_MIST, [(x, y) for x in range(2, 13) for y in (7, 8, 9) if (x * 3 + y) % 4])
    return c


def b5_lodowa(lib, ox, oy):
    """an ice grotto: columns of ice, blue crystals, cold air - and someone standing between the columns"""
    rows = rows_of("##############",
                   "##############",
                   "##############",
                   "###........###",
                   "#............#",
                   "#............#",
                   "#............#",
                   "#............#",
                   "#............#",
                   "##..........##",
                   "##############")
    c = XChunk(lib, "Lodowa grota", ox, oy, rows, W_ICE, F_ICE, weight=2, floors=B5)
    c.door("N", 4, 3); c.door("S", 6, 9); c.door("W", 1, 5); c.door("E", 12, 7)
    c.stairs(9)
    c.piece("kolumna_lodu", 3, 5); c.piece("kolumna_lodu", 10, 4); c.piece("kolumna_lodu", 8, 7)
    c.piece("krysztaly_nieb", 1, 7); c.piece("krysztal_nieb", 11, 8)
    c.vision(6, 6)
    c.whisper(11, 4)
    c.candle(5, 4, blue=True)
    c.spawn("cien", 9, 6)
    c.note(3, 9, "papiery")
    c.film(FILM_MIST, [(4, 7), (5, 7), (6, 8), (7, 8), (9, 9)])
    return c


def b5_kregi(lib, ox, oy):
    """two carved circles in the floor, side by side, blue candles round them; a voice from the middle"""
    c = XChunk(lib, "Dwa kręgi", ox, oy, full_rows(15, 12), W_GOTHIC2, F_SLATE_SQ, weight=2, floors=B5)
    c.door("N", 7, 3); c.door("S", 7, 10); c.door("W", 1, 4); c.door("E", 13, 9)
    c.stairs(2)
    for dy in range(3):
        for dx in range(3):
            c.t("A5", 3 + dx, 11 + dy, 2 + dx, 6 + dy, z=1)
            c.t("A5", 0 + dx, 11 + dy, 10 + dx, 6 + dy, z=1)
    for (x, y) in ((2, 5), (4, 5), (10, 5), (12, 5), (2, 9), (4, 9), (10, 9), (12, 9)): c.candle(x, y, blue=True, chance=60)
    c.whisper(7, 7); c.whisper(1, 10)
    c.loot("relikwiarz", 12, 3, "relikwiarz")
    c.spawn("upior", 3, 7); c.spawn("cien", 11, 7)
    c.note(5, 3, "kartki")
    c.film(FILM_MIST, [(6, 6), (7, 6), (8, 7), (6, 8), (8, 9), (7, 9)])
    return c


def b5_posagi(lib, ox, oy):
    """an aisle of hooded statues facing each other; between them someone who should not be here"""
    c = XChunk(lib, "Aleja posągów", ox, oy, full_rows(16, 11), W_PALE, F_BLUEGREY, weight=2, floors=B5)
    c.door("N", 2, 3); c.door("S", 7, 9); c.door("W", 1, 7); c.door("E", 14, 4)
    c.stairs(12)
    for x in (4, 7, 10): c.piece("posag_kaptur", x, 3)
    for x in (5, 8, 11): c.piece("posag_kaptur2", x, 6)
    c.vision(8, 5)
    c.whisper(13, 8); c.whisper(2, 9)
    c.candle(13, 3, blue=True)
    c.spawn("upior", 6, 8); c.spawn("cien", 12, 8)
    c.note(3, 5, "kartki")
    c.film(FILM_MIST, [(6, 5), (7, 5), (9, 5), (10, 5), (4, 9), (5, 9), (10, 9)])
    return c


def b5_kartki(lib, ox, oy):
    """the room of pages: papers everywhere, some of them in the hero's hand; a blue flame on a stone lectern"""
    c = XChunk(lib, "Pokój kartek", ox, oy, full_rows(13, 10), W_PALE, F_SLATE_SQ, weight=2, floors=B5)
    c.door("N", 9, 3); c.door("S", 3, 8); c.door("W", 1, 5); c.door("E", 11, 6)
    c.stairs(4)
    c.pic(6, 3, "!$Altar", 0, 4, 0, "Pulpit z niebieskim płomieniem", step=True)
    c.lib.light(*c.L(6, 3), BLUE_LIGHT, "Niebieski płomień")
    for (x, y, a) in ((3, 5, "papiery"), (8, 6, "kartki"), (5, 7, "papiery"), (10, 8, "kartki"), (2, 7, "kartki")):
        c.pic(x, y, *ART[a], name="Rozrzucone kartki", priority=0)
    c.note(7, 5, "kartki"); c.note(9, 8, "papiery")
    c.whisper(1, 3); c.whisper(11, 8)
    c.spawn("cien", 6, 8)
    c.film(FILM_MIST, [(4, 6), (5, 6), (7, 7), (8, 7)])
    return c


def b5_ciemna(lib, ox, oy):
    """a dark hall: hardly a light, the mist knee-deep, shadows standing where the light does not reach"""
    c = XChunk(lib, "Ciemna sala", ox, oy, full_rows(14, 10), W_SPIKES, F_SLATE, weight=2, floors=B5)
    c.door("N", 2, 3); c.door("S", 9, 8); c.door("W", 1, 6); c.door("E", 12, 4)
    c.stairs(10)
    c.candle(6, 4, blue=True, chance=50)
    c.whisper(3, 7); c.whisper(10, 7)
    c.piece("kosci2", 5, 7); c.piece("czaszki", 8, 5)
    c.loot("kosci", 12, 8, "kosci")
    c.spawn("cien", 4, 5); c.spawn("cien", 9, 6); c.spawn("upior", 7, 8)
    c.note(1, 8, "kartki")
    c.film(FILM_MIST, [(x, y) for x in range(2, 12) for y in range(5, 9) if (x + 2 * y) % 3])
    return c


def b5_krypta_imion(lib, ox, oy):
    """the crypt of names: sarcophagi in a row, a name cut in each lid - names one knows from up there, or almost"""
    c = XChunk(lib, "Krypta imion", ox, oy, full_rows(15, 11), W_GOTHIC2, F_SLATE_SQ, weight=2, floors=B5)
    c.door("N", 11, 3); c.door("S", 6, 9); c.door("W", 1, 7); c.door("E", 13, 6)
    c.stairs(3)
    c.piece("sarkofag", 2, 5); c.piece("sarkofag", 6, 5); c.piece("sarkofag_pusty", 9, 4)
    c.piece("trumna_otwarta", 12, 3)
    c.candle(5, 4, blue=True); c.candle(8, 8, blue=True, chance=60)
    c.vision(4, 8)
    c.whisper(12, 9)
    c.loot("relikwiarz", 1, 9, "relikwiarz")
    c.spawn("upior", 7, 8)
    c.note(10, 8, "ksiega")
    c.film(FILM_MIST, [(2, 8), (3, 8), (5, 9), (11, 7), (12, 7)])
    return c


def b5_ogrod(lib, ox, oy):
    """a stone garden: blue crystals and glowing spores grown together like a garden someone tended; an ice column at its heart"""
    c = XChunk(lib, "Kamienny ogród", ox, oy, full_rows(15, 11), W_PALE, F_ICE, weight=2, floors=B5)
    c.door("N", 2, 3); c.door("S", 10, 9); c.door("W", 1, 7); c.door("E", 13, 4)
    c.stairs(8)
    c.piece("kolumna_lodu", 7, 5)
    c.piece("krysztaly_nieb", 3, 5); c.piece("krysztaly_ziel", 10, 5); c.piece("krysztal_nieb", 5, 8); c.piece("krysztal_ziel", 12, 7)
    c.piece("zarodniki", 4, 3); c.piece("zarodniki", 9, 8); c.piece("zarodniki_zolte", 12, 3)
    c.whisper(7, 9)
    c.vision(10, 3)
    c.loot("grzyby", 2, 9, "grzyby")
    c.spawn("cien", 5, 6)
    c.note(13, 9, "kartki")
    c.film(FILM_MIST, [(6, 8), (7, 8), (8, 9), (3, 8)])
    return c


def b5_stol(lib, ox, oy):
    """the table with no guests: stone slabs laid for a feast, jugs and bowls set out - and someone sitting at it, for a moment"""
    c = XChunk(lib, "Stół bez gości", ox, oy, full_rows(15, 10), W_PALE, F_BLUEGREY, weight=2, floors=B5)
    c.door("N", 2, 3); c.door("S", 7, 8); c.door("W", 1, 6); c.door("E", 13, 4)
    c.stairs(12)
    for x in (4, 6, 8, 10): c.piece("plyta", x, 5)
    c.t("E", 6, 13, 5, 5, z=3); c.t("E", 7, 13, 8, 5, z=3); c.t("E", 6, 4, 10, 5, z=3)
    c.piece("lawa_kamienna", 4, 3); c.piece("lawa_kamienna", 11, 6)
    c.vision(6, 4); c.vision(9, 6)
    c.candle(3, 5, big=True, blue=True); c.candle(12, 5, big=True, blue=True)
    c.whisper(1, 8)
    c.spawn("cien", 10, 7)
    c.note(13, 8, "kartki")
    c.film(FILM_MIST, [(4, 7), (5, 7), (6, 7), (9, 7)])
    return c


def b5_echo(lib, ox, oy):
    """the echo: an empty icy room where every step comes back - the voices answer from all four walls"""
    c = XChunk(lib, "Pokój echa", ox, oy, full_rows(13, 10), W_ICE, F_BLUEGREY, weight=1, floors=B5)
    c.door("N", 9, 3); c.door("S", 3, 8); c.door("W", 1, 5); c.door("E", 11, 6)
    c.stairs(5)
    c.candle(6, 5, blue=True)
    c.whisper(2, 3); c.whisper(11, 4); c.whisper(2, 8); c.whisper(10, 8)
    c.spawn("upior", 7, 7)
    c.note(7, 3, "kartki")
    c.film(FILM_MIST, [(5, 6), (6, 7), (7, 6), (8, 7)])
    return c


CHUNKS = [b5_szepty, b5_lodowa, b5_kregi, b5_posagi, b5_kartki, b5_ciemna, b5_krypta_imion, b5_ogrod, b5_stol, b5_echo]
LIBRARY = dict(map_id=144, title="Podziemia: kawałki (pasmo 5)", band=5, floors="76-99", tileset=TILESET, rock=102)
