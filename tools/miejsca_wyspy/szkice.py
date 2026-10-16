# python tools/miejsca_wyspy/szkice.py [nazwa ...]   -> docs/miejsca_wyspy/rzut_*.png
# SZKICE sześciu nowych miejsc (koncepcja docs/miejsca_wyspy/KONCEPCJA.md). Mapy powstają tylko w pamięci, z prawdziwych kafelków
# tilesetu 11 (cysterna: tileset 12 podziemi), i lądują jako rysunki 1280x720 z numerami i legendą. Nic nie trafia do data/.
# Numery map (155...) są propozycją z koncepcji. Obrysy przerywaną linią = grafika do zrobienia (PixelLab albo w kodzie).
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from szkic_lib import *   # noqa: F401,F403
import szkic_lib as L

YEL, WHITE, BLUE, RED, GREEN = (255, 216, 102), (255, 255, 255), (150, 210, 255), (255, 150, 140), (160, 240, 170)


def ring(cells):
    out = set()
    for (x, y) in cells:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                out.add((x + dx, y + dy))
    return out - set(cells)


# =============================================================================================== 1. Pustelnia na klifie
def pustelnia():
    W, H = 48, 36
    mp = Szkic(155, W, H, "Pustelnia na klifie", "<Clouds:on>\n<Farm:off>", seed=155)
    sea = set()
    for x in range(W):
        top = 3 + (1 if noise(x // 3, 0, 11) > 0.6 else 0) + (1 if x < 9 else 0)
        for y in range(0, top): sea.add((x, y))
    for y in range(H):
        left = 6 + (1 if noise(0, y // 2, 12) > 0.55 else 0) - (2 if y > 27 else 0) - (1 if y > 31 else 0)
        for x in range(0, left): sea.add((x, y))
    l2 = {(x, y) for x in range(7, 31) for y in range(3, 13)} - sea - {(x, y) for x in range(27, 31) for y in range(10, 13)}
    l1 = ({(x, y) for x in range(7, W) for y in range(3, 22)} - sea - {(x, y) for x in range(7, 11) for y in range(14, 22)})
    mp.raise_to(l1, 1)
    mp.raise_to(l2, 2)
    mp.terraces()
    mp.stairs(23, 25, 21, "stone")
    mp.stairs(25, 26, 12, "stone")
    mp.sea(sea)
    mp.deep({(x, y) for (x, y) in sea if x < 3 or y < 1})
    # grunt: kamienista plaża na zachodzie i na dole, trawa wyżej
    shore = {(x, y) for y in range(13, H) for x in range(0, 12) if (x, y) not in sea and mp.lv(x, y) == 0}
    mp.kind(0, {c for c in shore if c[0] < 9 + (1 if noise(*c, 3) > 0.6 else 0)}, DIRT)
    mp.overlay({c for c in shore if c[0] < 9}, PEBBLES, 0.25, 4)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 2}, DRY, 0.10, 5)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 1}, TUFTS, 0.12, 6)
    # ścieżki
    mp.lane([(24, 35.5), (24.2, 30), (24.4, 25.5)], 2.2, seed=21)
    mp.lane([(24.2, 20.8), (24.6, 18.5), (25.6, 16)], 2.0, seed=22)
    mp.lane([(26, 11.5), (24, 10.5), (16, 10.5), (12.5, 11)], 1.8, seed=23)
    mp.lane([(26, 18.4), (33, 18.0), (40, 17.6), (47.5, 17.6)], 2.0, seed=24)
    mp.lane([(22.5, 10.5), (22.5, 9.2)], 1.2, seed=25)
    # skryptorium (kamienna kaplica zakonu), wieża, cela
    mp.house("skryptorium", "Skryptorium", 10, 4, 8, 3, 3, "slate", WALL_FACE, door=4, windows=[(1, "wood_lit"), (6, "wood")],
             chimney=6, chimney_style=4, ivy=(0, 7), interior="skryptorium", hours=(6, 20))
    mp.picture(20, 9, "!$Big_Decoration", 0, 6, 0, name="Wieża skryptorium (dawna strażnica)", priority=1)
    mp.house("cela", "Cela brata Kleofasa", 21, 4, 4, 2, 2, "thatch", "grey_logs", door=1, windows=[(3, "tiny")], chimney=2,
             chimney_style=3, closed_text="Cela pustelnika. Zamknięte.")
    # ogródek: suche grządki, ule (obrys), cysterna na deszczówkę (pusta), groby, ławka nad urwiskiem
    for (x, y) in [(13, 12), (14, 12), (15, 12), (17, 12), (18, 12), (19, 12)]:
        mp.thing(["sprout_a", "sprout_d", "sprout_b", "sprout_e", "sprout_c", "sprout_f"][(x + y) % 6], x, y)
    mp.kind(0, {(x, 12) for x in range(13, 20)}, EARTH)
    mp.town_prop("well_dry", 8, 9, label="Cysterna na deszczówkę (pusta)")
    for i, x in enumerate((27, 28, 29)):
        mp.town_prop("grave_cross" if i % 2 else "grave_cross_fl", x, 6, label="Grób kronikarza")
    mp.thing("bench", 8, 5)
    mp.thing("basket_jugs", 25, 6)
    mp.thing("log_bench", 18, 13 - 1)
    mp.light(15, 7, "<Light:140,90,62,22><LightWhen:night>", "Latarenka u drzwi skryptorium")
    mp.picture(15, 7, "!Decoration", 7, 2, 0, name="Latarenka u drzwi", priority=2, through=True)
    mp.outline(26, 8, 29, 9, "ule", "rect", YEL)
    # niżej: kopiec z krukiem, sosny, skały, wyrzucone drewno
    mp.put(27, 19, "!$Rock_Cairn", name="Kopiec z krukiem (znak zakonu)", force=True)
    for (x, y) in [(33, 6), (37, 4), (41, 7), (45, 5), (36, 11), (43, 12), (39, 14), (46, 14), (34, 21), (41, 21), (31, 13),
                   (45, 20), (14, 27), (18, 31), (29, 29), (33, 26), (38, 30), (43, 27), (46, 33), (31, 34), (16, 34), (37, 24)]:
        mp.pine(x, y)
    for (x, y, r) in [(12, 16, "!$Rock_Mossy"), (14, 20, "!$Rock_Pile"), (30, 6, "!$Rock_Flat"), (44, 9, "!$Rock_Mound"),
                      (8, 25, "!$Boulder_A"), (6, 33, "!$Rock_Slab"), (20, 28, "!$Rock_Chunk"), (35, 15, "!$Rock_Cracked")]:
        mp.put(x, y, r, force=True)
    mp.put(7, 19, "!$Logs_Big", name="Drewno wyrzucone przez morze", force=True)
    mp.thing("crate_open", 5, 29)
    mp.clump("rock", 3, 30); mp.clump("stones", 4, 27); mp.clump("rock", 5, 15); mp.clump("stones", 6, 22)
    for c in [(16, 28), (21, 33), (35, 33), (11, 25), (28, 24), (40, 25)]: mp.clump("fern", *c)
    for (x, y, p) in [(4, 6, 2), (9, 2, 3), (30, 2, 2), (6, 12, 0), (22, 1, 3)]: mp.crow(x, y, p)
    mp.marker(24, 34, "pustelnia_wejscie", 8)
    # numery
    mp.label(1, 25, 31, "Ścieżka z przystani", "wejście z Map125 (pola 14-16 górnej krawędzi)")
    mp.label(2, 24, 23, "Schody na skałę", "kamienne stopnie w licu skały")
    mp.label(3, 27, 18, "Kopiec z krukiem", "znak zakonu na rozstaju dróg")
    mp.label(4, 25, 14, "Schody na klif", "drugi taras, wyżej nad morzem")
    mp.label(5, 14, 6, "Skryptorium", "kamienna kaplica zakonu, z wnętrzem")
    mp.label(6, 20, 6, "Wieża skryptorium", "dawna strażnica, dzwon bez serca")
    mp.label(7, 23, 5, "Cela brata Kleofasa", "tu śpi (20-4)")
    mp.label(8, 16, 12, "Suchy ogródek i ule", "miód i wosk na świece")
    mp.label(9, 8, 8, "Pusta cysterna", "„Pusta. Od lat.”")
    mp.label(10, 28, 4, "Groby kronikarzy", "trzy krzyże, imiona do odczytania")
    mp.label(11, 8, 4, "Ławka nad urwiskiem", "Kleofas tu siedzi o zachodzie")
    mp.label(12, 6, 24, "Kamienista plaża", "drewno i szczątki po sztormach")
    mp.label(13, 45, 17, "Ścieżka na wschód", "dalej Urwisko Kruków (Map157)")
    mp.arrow(24, 35, 2, "z przystani")
    mp.arrow(47, 17, 6, "Urwisko Kruków")
    mp.outline(26, 8, 29, 9, "", "rect", YEL)
    return mp, dict(title="Pustelnia na klifie", sub="Map155 · 48 × 36 · tileset 11 · szkic\nwnętrze: Map156 Skryptorium",
                    extra=[("--- obrys: grafika do zrobienia", WHITE), ("taras 2 = klif, taras 1 = zbocze, dół = plaża", MUTED)])


# =============================================================================================== 2. Urwisko Kruków
def urwisko():
    W, H = 56, 36
    mp = Szkic(157, W, H, "Urwisko Kruków", "<Clouds:on>\n<Farm:off>", seed=157)
    sea = set()
    for x in range(W):
        top = 4 + (1 if noise(x // 3, 1, 21) > 0.55 else 0) + (1 if 18 < x < 27 else 0)
        for y in range(0, top): sea.add((x, y))
    l3 = {(x, y) for x in range(0, W) for y in range(4, 14)} - sea - {(x, y) for x in range(0, 6) for y in range(10, 14)} \
        - {(x, y) for x in range(49, W) for y in range(10, 14)}
    l2 = {(x, y) for x in range(0, W) for y in range(4, 26)} - sea
    mp.raise_to(l2, 1)
    mp.raise_to(l3, 2)
    mp.terraces()
    mp.stairs(29, 30, 13, "stone")
    mp.stairs(8, 10, 25, "moss")
    mp.sea(sea)
    mp.deep({(x, y) for (x, y) in sea if y < 2})
    # resztki muru twierdzy na krawędzi klifu (lico widać od lądu) i dwie baszty, w tym kruczarnia
    mp.wall_run(2, 13, 5, broken=(6, 7))
    mp.wall_run(16, 24, 6, broken=(20,))
    mp.wall_run(34, 47, 5, broken=(39, 40, 41))
    mp.crenels(2, 5, 5); mp.crenels(16, 19, 6); mp.crenels(42, 47, 5)
    mp.tower(14, 4)
    mp.tower(25, 5)
    mp.town_prop("tower_ruin_top", 26, 8, label="Kruczarnia (ruina baszty)")
    mp.town_prop("tower_ruin_top", 15, 7, label="Ruina baszty")
    for (x, y) in [(6, 7), (7, 8), (20, 8), (39, 7), (40, 8), (41, 7)]:
        mp.clump("rock" if (x + y) % 2 else "stones", x, y)
    # przelew cysterny z kratą w licu górnego tarasu, rynny zakonu do niego
    mp.picture(41, 15, "!Quest_Places", 0, 2, 0, name="Przelew cysterny (krata z krukiem)", priority=1)
    mp.kind(0, {(41, y) for y in range(9, 14)} | {(x, 9) for x in range(36, 42)}, COBBLE)
    # ścieżka: z zachodu wzdłuż dolnego tarasu na wschód, w górę do ruin, w dół na stok tawerny
    mp.lane([(-0.5, 19.5), (10, 19.8), (20, 20.2), (30, 19.6), (40, 19.4), (50, 19.5), (56.5, 19.5)], 2.2, seed=31)
    mp.lane([(29.5, 18.5), (29.5, 16)], 2.0, seed=32)
    mp.lane([(29.5, 12.5), (27.5, 11.2), (20, 10.5), (12, 10.2)], 1.8, seed=33)
    mp.lane([(29.5, 12.5), (33, 11), (38, 10.5), (44, 11)], 1.6, seed=34)
    mp.lane([(9, 21), (9, 24.6)], 2.0, seed=35)
    mp.lane([(9, 28), (9, 35.5)], 2.0, seed=36)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 2}, STONES, 0.18, 7)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 1}, TUFTS, 0.10, 8)
    # kruczarnia: żerdzie, gniazda (obrys), kruki; kamienie z krukiem w gruzie
    mp.thing("hide_rack", 23, 11); mp.thing("hide_rack_b", 28, 11)
    mp.outline(22, 9, 29, 12, "żerdzie i gniazda", "rect", YEL)
    for (x, y, p) in [(14, 3, 0), (15, 3, 2), (25, 4, 1), (26, 4, 0), (3, 4, 2), (12, 4, 0), (35, 4, 1), (46, 4, 0), (24, 9, 1),
                      (27, 10, 0), (18, 9, 2), (44, 7, 3), (33, 2, 3), (8, 1, 3), (52, 3, 2), (22, 2, 3)]:
        mp.crow(x, y, p)
    for (x, y) in [(5, 9), (37, 8), (47, 9)]:
        mp.put(x, y, "!$Rock_Rubble", name="Gruz z kamieniem z krukiem", force=True)
    # stok: sosny, krzaki; na dole widok na tył wzgórza tawerny (poza mapą)
    for (x, y) in [(3, 18), (15, 17), (22, 23), (36, 16), (45, 23), (52, 17), (2, 23), (17, 22), (48, 21), (54, 23),
                   (13, 30), (20, 33), (28, 29), (35, 32), (42, 30), (49, 33), (3, 31), (24, 34), (53, 29), (38, 27)]:
        mp.pine(x, y)
    for (x, y, r) in [(33, 22, "!$Rock_Mossy"), (6, 21, "!$Rock_Flat"), (44, 17, "!$Rock_Chunk"), (16, 29, "!$Bush_Bare_Big"),
                      (31, 31, "!$Bush_Bare_Wide"), (46, 27, "!$Bush_Bare_Thicket")]:
        mp.put(x, y, r, force=True)
    mp.outline(14, 28, 50, 34, "zbocze wzgórza tawerny (tył miasteczka; mapa 8 bez zmian)", "rect", MUTED)
    for (x, y, r) in [(12, 22, "!$Rock_Column"), (37, 23, "!$Rock_Rubble"), (24, 17, "!$Rock_Long"), (50, 24, "!$Boulder_A"),
                      (19, 23, "!$Bush_Bare_Hedge"), (41, 23, "!$Trunk_Dead")]:
        mp.put(x, y, r, force=True)
    mp.outline(44, 20, 51, 24, "nocny obóz kopaczy kamieni", "rect", RED)
    mp.label(11, 47, 22, "Nocny obóz obcych", "Czarne Oczy kopią w gruzie (Humans.js)")
    # numery
    mp.label(1, 1, 19, "Ścieżka od pustelni", "wejście z Map155 (wschodnia krawędź)")
    mp.label(2, 29, 15, "Schody do ruin", "w licu górnego tarasu")
    mp.label(3, 9, 6, "Resztki muru twierdzy", "wyrwy z widokiem na morze")
    mp.label(4, 21, 10, "Kruczarnia", "ruina baszty, żerdzie, młody kruk")
    mp.label(5, 15, 12, "Baszta z gniazdami", "dziesiątki kruków")
    mp.label(6, 41, 17, "Przelew cysterny", "krata z krukiem: woda za nią po deszczu")
    mp.label(7, 38, 9, "Rynny zakonu", "kanały w skale do przelewu (K53)")
    mp.label(8, 5, 11, "Kamienie z krukiem", "w gruzie; szukają ich Czarne Oczy")
    mp.label(9, 9, 27, "Zejście na zbocze", "ścieżka w dół, ku tyłom miasteczka")
    mp.label(10, 54, 19, "Ścieżka na wschód", "dalej Przylądek z latarnią (Map159)")
    mp.arrow(0, 19, 4, "Pustelnia")
    mp.arrow(55, 19, 6, "Przylądek")
    return mp, dict(title="Urwisko Kruków", sub="Map157 · 56 × 36 · tileset 11 · szkic\nmorska ściana wzgórza tawerny",
                    extra=[("--- obrys: grafika do zrobienia", WHITE), ("kruki na rysunku: arkusz Bird_Crow (ozdoba)", MUTED),
                           ("wnętrze kruczarni: bez (otwarta ruina)", MUTED)])


# =============================================================================================== 3. Przylądek z latarnią
def latarnia():
    W, H = 44, 40
    mp = Szkic(159, W, H, "Przylądek z latarnią", "<Clouds:on>\n<Farm:off>\n<Water:salt>", seed=159)
    cape = mp.blob(22, 14, 13, 13, seed=4, rough=0.18) | {(x, y) for x in range(9, 36) for y in range(18, 30)}
    land = cape | {(x, y) for x in range(0, W) for y in range(27, H)}
    land -= {(x, y) for x in range(0, 4) for y in range(27, 33)}
    sea = mp.all - land
    l1 = {c for c in cape if c[1] < 26}
    l2 = mp.blob(22, 9, 7, 5, seed=6, rough=0.1)
    mp.raise_to(l1, 1)
    mp.raise_to(l2 & l1, 2)
    mp.terraces()
    mp.stairs(21, 23, 25, "stone")
    mp.stairs(22, 23, 13, "stone")
    mp.sea(sea)
    mp.deep({(x, y) for (x, y) in sea if y < 2 or x < 2 or x > W - 3})
    for (x, y) in [(5, 6), (8, 3), (38, 5), (40, 10), (6, 15), (39, 20), (3, 24), (41, 25)]:
        if (x, y) in sea: mp.clump("rock", x, y, 1)
    mp.overlay({c for c in mp.all if mp.lv(*c) >= 1}, STONES, 0.16, 9)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 0 and c not in sea}, TUFTS, 0.15, 10)
    # ścieżki: z Urwiska (zachód), z gór (dół, opcja), na górę do latarni
    mp.lane([(-0.5, 33.5), (10, 33.2), (18, 32), (22, 30), (22, 26.5)], 2.2, seed=41)
    mp.lane([(30.5, 39.5), (30, 35), (26, 32), (22.5, 30.5)], 1.8, seed=42)
    mp.lane([(22.4, 22.8), (22.6, 18), (22.6, 14.6)], 2.0, seed=43)
    mp.lane([(22.6, 12.5), (22.5, 11)], 1.6, seed=44)
    mp.lane([(22.5, 19), (16, 19.5), (13.5, 20.5)], 1.6, seed=45)
    # latarnia na fundamencie strażnicy zakonu: kamienna wieża (kafelki muru) + korona + ogień (docelowo grafika)
    for x in range(20, 25):
        for y in range(4, 10):
            mp.layers[0][(x, y)] = ("k", WALL_FACE)
            mp.solid.add((x, y))
        mp.layers[0][(x, 3)] = ("k", WALL_TOP)
    mp.kind(0, mp.rect(20, 3, 24, 3), WALL_TOP)
    mp.town_prop("tower_ruin_top", 22, 4, label="Laterna (galeria z soczewką)")
    mp.picture(22, 3, "!Decoration", 0, 2, 0, name="Ogień latarni", priority=2, step=True,
               note="<Light:220,140,64,26><LightFlicker:0.12>")
    mp.picture(22, 9, "!Fantasy_door2", 0, 2, 0, name="Drzwi latarni", priority=1)
    mp.outline(19, 0, 25, 10, "latarnia (grafika do zrobienia)", "rect", WHITE)
    # izba latarnika, drewutnia, tran, dzwon mgłowy, ławka, maszt z flagą
    mp.house("latarnik", "Izba latarnika", 13, 15, 6, 2, 2, "shingle_dark", "boards_stone", door=2, windows=[(4, "wood_lit")],
             chimney=4, chimney_style=4, lean="left", lean_fill="logs", interior="latarnik", hours=(15, 20))
    mp.thing("firewood", 26, 17); mp.thing("woodshed", 27, 21)
    mp.thing("barrel_pile", 17, 21); mp.thing("barrels2", 19, 21)
    mp.picture(29, 13, "!$Ug_Bell", 0, 2, 0, name="Dzwon mgłowy", priority=1)
    mp.outline(28, 11, 30, 13, "", "rect", WHITE)
    mp.thing("bench", 15, 8)
    mp.put(28, 7, "!$Rock_Column", name="Słup strażnicy zakonu (kruk wykuty w kamieniu)", force=True)
    mp.put(16, 11, "!$Rock_Slab", name="Płyta strażnicy", force=True)
    # zatoczka ze szczątkami po sztormach (zachód), szczątki
    mp.kind(0, {(x, y) for x in range(4, 9) for y in range(27, 34) if (x, y) in land}, DIRT)
    mp.thing("crate_open", 6, 30); mp.thing("barrel", 5, 32); mp.put(7, 33, "!$Logs_Big", name="Szczątki po sztormie", force=True)
    for (x, y) in [(3, 36), (9, 37), (14, 36), (35, 33), (40, 36), (38, 29), (11, 29), (32, 28), (27, 37), (18, 38), (42, 31)]:
        mp.pine(x, y)
    for (x, y, p) in [(10, 4, 3), (33, 2, 2), (36, 13, 3)]: mp.crow(x, y, p)
    for (x, y, r) in [(12, 6, "!$Rock_Flat"), (31, 20, "!$Rock_Mossy"), (11, 23, "!$Rock_Pile"), (33, 24, "!$Rock_Cracked")]:
        mp.put(x, y, r, force=True)
    for c in [(14, 10), (29, 17), (12, 20), (25, 21)]: mp.clump("white_fl", *c)
    mp.dash([(2, 13), (8, 17), (14, 26)], (210, 220, 235), "mgła morska nocą")
    # numery
    mp.label(1, 1, 33, "Ścieżka z Urwiska", "wejście z Map157 (wschodnia krawędź)")
    mp.label(2, 32, 36, "Ścieżka z gór (opcja)", "z Map013, wschodnia krawędź 59,11-13")
    mp.label(3, 22, 24, "Schody na przylądek", "wykute w skale")
    mp.label(4, 22, 1, "Latarnia", "wieża na fundamencie strażnicy zakonu")
    mp.label(5, 25, 4, "Laterna z soczewką", "ogień + soczewka; wnętrze Map161")
    mp.label(6, 15, 18, "Izba latarnika", "wnętrze Map160: łóżko, Księga mgieł")
    mp.label(7, 28, 18, "Drewutnia i opał", "drewno, węgiel")
    mp.label(8, 18, 22, "Beczki tranu", "paliwo latarni (zapas na noce)")
    mp.label(9, 31, 12, "Dzwon mgłowy", "Bazyli bije w niego w mgle")
    mp.label(10, 28, 8, "Słup strażnicy", "kruk wykuty w kamieniu")
    mp.label(11, 6, 29, "Zatoczka szczątków", "co morze wyrzuci po sztormie")
    mp.arrow(0, 33, 4, "Urwisko Kruków")
    mp.arrow(30, 39, 2, "Góry (opcja)")
    return mp, dict(title="Przylądek z latarnią", sub="Map159 · 44 × 40 · tileset 11 · szkic\nwnętrza: Map160 Izba latarnika, Map161 Laterna",
                    extra=[("--- obrys: grafika do zrobienia", WHITE), ("jasne kreski: mgła morska (noce po mglistym", MUTED),
                           ("ranku, Sky.mistOfDay)", MUTED)])


# =============================================================================================== 4. Garnizon nad zatoką
def garnizon():
    W, H = 56, 40
    mp = Szkic(162, W, H, "Garnizon nad zatoką", "<Clouds:on>\n<Farm:off>\n<Water:salt>", seed=162)
    sea = set()
    for y in range(H):
        edge = 15 - y * 0.18 + 2 * (noise(0, y // 2, 31) - 0.5)
        if y > 30: edge -= (y - 30) * 0.6
        for x in range(0, int(edge)): sea.add((x, y))
    shoal = mp.blob(3, 18, 3, 5, seed=8)
    sea -= shoal
    mp.terraces()
    mp.sea(sea, SEA_SAND)
    mp.deep({(x, y) for (x, y) in sea if x < 2})
    beach = {(x, y) for (x, y) in mp.all if (x, y) not in sea and x < 15 - y * 0.18 + 4 + 2 * noise(x, y, 5)} | shoal
    mp.kind(0, beach, DIRT)
    mp.overlay(beach, PEBBLES, 0.12, 12)
    # piaszczysta łacha do wraku (w odpływie): na zachód, poza mapę
    bar = {(x, y) for x in range(0, 12) for y in range(20, 22)} & sea
    mp.outline(0, 19, 11, 22, "łacha w odpływie (do wraku)", "rect", BLUE)
    # droga z przystani (góra), pod bramę
    mp.lane([(22, -0.5), (23, 4), (25, 7), (32, 8.5), (36, 9.6)], 2.4, seed=51)
    # palisada: ściana z bali dookoła (szkic; docelowo palisada z zaostrzonych pali), brama na północy
    x0, y0, x1, y1 = 24, 10, 51, 33
    pal = set()
    for x in range(x0, x1 + 1):
        pal |= {(x, y0), (x, y0 + 1), (x, y1 - 1), (x, y1)}
    for y in range(y0, y1 + 1):
        pal |= {(x0, y), (x1, y)}
    gate = {(35, y0), (36, y0), (37, y0), (35, y0 + 1), (36, y0 + 1), (37, y0 + 1)}
    pal -= gate
    mp.kind(0, pal, LOGS)
    for c in pal: mp.solid.add(c)
    inside = {(x, y) for x in range(x0 + 1, x1) for y in range(y0 + 2, y1 - 1)}
    mp.kind(0, inside, EARTH)
    mp.overlay(inside, MUD, 0.08, 13)
    mp.outline(x0, y0, x1, y1, "palisada (docelowo pale, nie bale)", "rect", WHITE)
    mp.lane([(36, 10), (36, 16), (36, 30)], 2.2, kind=COBBLE, seed=52)
    # wieża strażnicza (obrys), koszary, kwatera rotmistrza, spichlerz z rekwizycji, plac ćwiczeń, namioty, kuchnia, dyby
    mp.outline(48, 11, 50, 15, "wieża strażnicza", "rect", WHITE)
    mp.thing("ladder", 49, 15)
    mp.house("koszary", "Koszary", 26, 13, 8, 2, 2, "planks", "logs", door=4, windows=[(1, "wood"), (6, "wood_lit")],
             chimney=6, chimney_style=3, closed_text="Koszary. „Wstęp tylko dla wojska.”")
    mp.stamp("kamienica_choragiew", 39, 12, skip_events=lambda n, img: "Flags" in img)
    mp.picture(40, 15, "!Flags_banner", 0, 2, 0, name="Chorągiew królewska (feniks)", priority=1)
    mp.picture(43, 15, "!Flags_banner", 0, 2, 1, name="Chorągiew królewska (feniks)", priority=1)
    mp.stamp("spichlerz_drewutnia", 43, 22)
    for (x, y) in [(28, 22), (30, 22), (32, 22)]: mp.town_prop("dummy", x, y, label="Manekin do ćwiczeń")
    mp.town_prop("target", 29, 25, label="Tarcza strzelnicza"); mp.town_prop("target", 31, 25, label="Tarcza strzelnicza")
    mp.town_prop("weapon_rack", 26, 19, label="Stojak z bronią"); mp.town_prop("weapon_rack_b", 34, 19, label="Stojak z bronią")
    mp.town_prop("tent_small", 26, 30, label="Namiot żołnierzy"); mp.town_prop("tent_small", 29, 30, label="Namiot żołnierzy")
    mp.town_prop("tent_hide", 33, 30, label="Namiot kwatermistrza")
    mp.picture(40, 28, "!Decoration", 0, 4, 0, name="Kuchnia polowa (ogień)", priority=1, step=True, note="<Light:160,120,60,18><LightFlicker:0.15>")
    mp.thing("table", 38, 29); mp.thing("barrel_pile", 41, 30)
    mp.town_prop("barrel_water", 47, 30, label="Beczki z wodą z promu (pilnowane)")
    mp.town_prop("barrel_water_b", 48, 30, label="Beczki z wodą z promu (pilnowane)")
    mp.thing("hide_rack", 45, 18)
    mp.outline(44, 17, 46, 18, "dyby", "rect", RED)
    mp.thing("cart_sacks", 40, 20); mp.thing("sacks", 42, 20); mp.thing("sacks_b", 41, 21)
    # przed bramą: stół werbownika pod daszkiem, chorągiew; pomost z łodzią ratowniczą
    mp.thing("table", 31, 8); mp.thing("stool", 33, 8); mp.thing("notice", 30, 8)
    mp.picture(29, 8, "!Flags_banner", 0, 2, 2, name="Chorągiew królewska (feniks)", priority=1)
    mp.outline(29, 6, 34, 8, "stół werbownika", "rect", YEL)
    pier = {(x, 26) for x in range(2, 15)} | {(x, 27) for x in range(2, 15)}
    mp.planks({c for c in pier if c in sea} | {c for c in pier if c not in sea})
    mp.picture(8, 29, "!$Przystan_Lodz_Mala", 0, 2, 0, name="Łódź ratownicza garnizonu", priority=1)
    mp.lane([(16, 26.5), (22, 25), (24.5, 22)], 1.6, seed=53)
    mp.picture(16, 25, "!Decoration", 0, 2, 1, name="Kosz ogniowy na pomoście", priority=1, step=True)
    # wrak w oddali (ten sam, który widać z przystani)
    mp.picture(3, 17, "!$Przystan_Okret_Wrak", 0, 2, 0, name="Wrak okrętu na mieliźnie (w oddali)", priority=1)
    for (x, y) in [(53, 3), (49, 6), (54, 9), (45, 3), (53, 15), (54, 22), (53, 28), (54, 35), (47, 37), (40, 36), (33, 37),
                   (26, 36), (19, 37), (41, 5), (17, 4), (12, 2), (28, 2), (35, 3)]:
        mp.pine(x, y)
    mp.light(36, 9, "<Light:170,120,60,18><LightFlicker:0.15>", "Koksownik przy bramie")
    mp.picture(34, 9, "!Decoration", 0, 2, 2, name="Koksownik przy bramie", priority=1, step=True)
    # numery
    mp.label(1, 25, 3, "Droga z przystani", "wejście z Map125 (dolna krawędź, pola 21-23)")
    mp.label(2, 31, 6, "Stół werbownika", "pobór w dni fal; bęben i lista")
    mp.label(3, 36, 11, "Brama garnizonu", "wartownik, koksownik")
    mp.label(4, 29, 12, "Koszary", "żołnierze śpią 22-6")
    mp.label(5, 42, 11, "Kwatera rotmistrza", "kancelaria; wnętrze Map163")
    mp.label(6, 45, 21, "Spichlerz z rekwizycji", "zboże z D14; skup u kwatermistrza")
    mp.label(7, 30, 21, "Plac ćwiczeń", "manekiny i tarcze strzelnicze")
    mp.label(8, 30, 29, "Namioty", "kwatermistrz Kłos: skup wojskowy")
    mp.label(9, 41, 27, "Kuchnia polowa", "kocioł; wieczorem żołnierze przy ogniu")
    mp.label(10, 45, 16, "Dyby", "kara dla dezerterów i złodziei")
    mp.label(11, 49, 10, "Wieża strażnicza", "widok na zatokę i wrak")
    mp.label(12, 10, 25, "Pomost i łódź ratownicza", "żołnierze łowią łup z wraku")
    mp.label(13, 5, 20, "Łacha w odpływie", "nocą pieszo do wraku (Map165)")
    mp.label(14, 3, 14, "Wrak na mieliźnie", "widok; mapa wraku osobno")
    mp.arrow(22, 0, 8, "przystań")
    mp.arrow(0, 21, 4, "wrak (odpływ)")
    return mp, dict(title="Garnizon nad zatoką", sub="Map162 · 56 × 40 · tileset 11 · szkic\nwnętrze: Map163 Kwatera rotmistrza",
                    extra=[("--- obrys: grafika do zrobienia", WHITE), ("chorągwie z feniksem: !Flags_banner (już są)", MUTED)])


# =============================================================================================== 5. Wrak na mieliźnie
def wrak():
    W, H = 40, 30
    mp = Szkic(165, W, H, "Wrak na mieliźnie", "<Clouds:on>\n<Farm:off>\n<Water:salt>", seed=165)
    sand = mp.blob(19, 15, 14, 7, seed=12, rough=0.25) | mp.blob(31, 21, 7, 3, seed=13) | {(x, y) for x in range(33, W) for y in range(20, 23)}
    sea = mp.all - sand
    mp.terraces()
    mp.sea(sea, SEA_SAND)
    mp.deep({(x, y) for (x, y) in sea if x < 3 or y < 2 or y > H - 3})
    mp.kind(0, sand, EARTH)
    mp.overlay(sand, PEBBLES, 0.10, 14)
    low = mp.blob(19, 15, 17, 9, seed=12, rough=0.25) - sand
    mp.outline(3, 5, 36, 25, "linia odpływu: więcej piachu, odsłonięta łacha", "ellipse", BLUE)
    # wrak: kadłub przechylony na łasze (docelowo duża grafika; tu obrys + obraz tła z przystani)
    mp.outline(9, 7, 25, 15, "kadłub (grafika do zrobienia)", "rect", WHITE)
    mp.picture(17, 14, "!$Przystan_Okret_Wrak", 0, 2, 0, name="Wrak okrętu", priority=1)
    mp.picture(17, 15, "!Fantasy_door6", 0, 2, 0, name="Dziura w burcie (zejście pod pokład)", priority=1)
    mp.picture(12, 13, "!Flags_banner", 1, 2, 0, name="Podarta bandera Czarnych Oczu", priority=1)
    # szczątki: skrzynie, beczki, maszt, lina
    for (n, x, y) in [("crate", 23, 18), ("crate_b", 25, 19), ("barrel", 8, 17), ("barrel_open", 27, 13), ("crate_open", 11, 19),
                      ("rope", 21, 19), ("sack_torn", 14, 19)]:
        mp.thing(n, x, y)
    mp.put(28, 16, "!$Logs_Big", name="Złamany maszt", force=True)
    mp.put(6, 14, "!$Trunk_Dead", name="Reja w piachu", force=True)
    mp.clump("rock", 33, 12); mp.clump("stones", 30, 9); mp.clump("rock", 6, 20)
    # miejsce łodzi Janka (przybicie) i łacha od strony garnizonu
    mp.picture(36, 19, "!$Przystan_Lodz_Janka", 0, 2, 0, name="Łódź Janka (czeka)", priority=1)
    mp.arrow(39, 21, 6, "łacha do garnizonu (odpływ)")
    for (x, y, p) in [(30, 6, 3), (14, 4, 2), (24, 10, 0), (9, 9, 1)]: mp.crow(x, y, p)
    mp.label(1, 35, 18, "Przybicie łodzi", "Janek czeka 2 godziny")
    mp.label(2, 38, 23, "Łacha od garnizonu", "tylko w odpływie, nocą")
    mp.label(3, 17, 10, "Kadłub okrętu", "„Biała Źrenica”, Straż Pewności")
    mp.label(4, 20, 17, "Dziura w burcie", "zejście pod pokład (Map166)")
    mp.label(5, 12, 11, "Podarta bandera", "białe oko na czerni")
    mp.label(6, 24, 20, "Skrzynie z ładunku", "żołnierze garnizonu wynoszą łup")
    mp.label(7, 28, 15, "Złamany maszt", "kruk siada tu co rano")
    mp.label(8, 4, 24, "Głębia", "przypływ zalewa łachę")
    mp.arrow(39, 21, 6, "")
    return mp, dict(title="Wrak na mieliźnie", sub="Map165 · 40 × 30 · tileset 11 · szkic\npod pokładem: Map166 (ładownia, kajuta)",
                    extra=[("--- obrys: grafika do zrobienia", WHITE), ("niebieski: linia odpływu (pływy z zegara)", BLUE)])


# =============================================================================================== 6. Stara cysterna zakonu
def cysterna():
    import uglib as U
    from chunks_deep import WATER, W_GREYBRICK
    W, H = 40, 28
    mp = U.DMap(167, W, H, "Stara cysterna zakonu", "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<DarkDay:226>\n<DarkNight:226>\n<Ambience:cave>",
                tileset=U.TILESET2 if hasattr(U, "TILESET2") else 12)
    hall = mp.rect(3, 6, 36, 23)
    corridor = mp.rect(1, 20, 3, 21)
    intake = mp.rect(33, 2, 34, 6)
    floor = hall | corridor | intake
    mp.shell(floor, U.F_GREEN_BRICK, U.W_MOSSY)
    basin = mp.rect(7, 9, 32, 19) - mp.rect(18, 9, 21, 19)
    mp.shadows()
    water = set()
    for c in basin:
        mp.layers[0][c] = ("k", WATER)
        water.add(c)
    for c in water: mp.shadow.pop(c, None)
    # grobla przez środek (chodnik po koronie zapory), słupy wyrastające z wody
    mp.layers[0].update({c: ("k", U.F_SLATE) for c in mp.rect(18, 9, 21, 19)})
    for (x, y) in [(10, 11), (14, 15), (25, 11), (29, 15), (10, 17), (29, 9)]:
        mp.piece("kolumna", x, y - 2)
    # słup miary, cela wodnego, zasuwa deszczowa, gałąź dworska, przejście do piętra 30, kanał od urwiska
    from places import torch, brazier, note_event
    mp.piece("filar", 20, 6)
    mp.piece("lancuch", 24, 7, z=3); mp.piece("wiadro_puste", 24, 8)
    mp.piece("dzbany_grupa", 4, 21); mp.piece("beczka", 7, 22); mp.piece("beczka_pusta", 8, 23); mp.piece("wiadro_puste", 10, 23)
    mp.piece("worki_stos", 12, 22)
    note_event(mp, 5, 23, "c1", "ksiega", "Księga racji wodnego")
    note_event(mp, 22, 8, "c2", "kartki", "Zasada czerpania")
    mp.ev(34, 7, "!Fantasy_door6", 2, 2, 0, name="Zasuwa deszczowa (kanał od Urwiska)", priority=1, through=False)
    mp.ev(36, 14, "!Fantasy_door6", 1, 2, 0, name="Zasuwa gałęzi dworskiej", priority=1, through=False)
    mp.ev(2, 20, "!Fantasy_door5", 0, 2, 0, name="Przejście do Wielkiej cysterny (piętro 30)", priority=1, through=False)
    for (x, y) in [(5, 5), (13, 5), (28, 5), (31, 5)]: torch(mp, x, y)
    brazier(mp, 16, 21); brazier(mp, 23, 21)
    mp.piece("kosci", 30, 21); mp.piece("kosci2", 26, 22)
    m = mp.to_json()

    class Wrap:          # (to samo API rysunku co Szkic)
        pass
    w = Wrap()
    w.crows, w.dashes = [], []
    w.outlines = [(7, 9, 32, 19, "rect", "zbiornik: zapas wody zakonu (deszczówka sprzed stuleci)", BLUE),
                  (19, 6, 21, 8, "rect", "", YEL)]
    w.arrows = [(1, 20, 4, "piętro 30 (Map147)"), (33, 2, 8, "kanał do kraty na Urwisku")]
    w.labels = [(1, 2, 21, "Przejście z piętra 30", "za Zasuwą główną, po W1 rozdz. 7"),
                (2, 20, 6, "Słup miary", "znaki poziomu: zapas wody (0-100)"),
                (3, 20, 14, "Grobla", "chodnik przez środek zbiornika"),
                (4, 34, 5, "Zasuwa deszczowa", "wpuszcza wodę z rynien Urwiska"),
                (5, 35, 14, "Gałąź dworska", "kanał pod dwór Lorda (W1: Feliks)"),
                (6, 6, 21, "Kąt wodnego", "księga racji: „jedno wiadro na strażnika”"),
                (7, 24, 9, "Czerpak zakonu", "kubeł na łańcuchu: 1 nabranie dziennie"),
                (8, 33, 3, "Kanał przelewu", "do kraty z krukiem na Urwisku")]
    return w, m, dict(title="Stara cysterna zakonu", sub="Map167 · 40 × 28 · tileset 12 (podziemia) · szkic\npod wzgórzem tawerny, obok piętra 30",
                      extra=[("niebieski obrys: woda w zbiorniku (do picia", BLUE), ("tylko przy czerpaku, 1 raz dziennie)", BLUE)])


MAPS = {"pustelnia": pustelnia, "urwisko": urwisko, "latarnia": latarnia, "garnizon": garnizon, "wrak": wrak, "cysterna": cysterna}


def main(names):
    os.makedirs(L.DOCS, exist_ok=True)
    for n in names:
        if n == "cysterna":
            w, m, info = cysterna()
            L.draw_doc(w, m, L.DOCS + "rzut_cysterna.png", info["title"], info["sub"], info["extra"], tileset=12)
        else:
            mp, info = MAPS[n]()
            m = mp.to_map()
            L.draw_doc(mp, m, L.DOCS + "rzut_%s.png" % n, info["title"], info["sub"], info["extra"])
        print("ok", n)


if __name__ == "__main__":
    main(sys.argv[1:] or list(MAPS))
