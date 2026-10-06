# Map014 "Jaskinia" (W8 ch3 "Obóz kopaczy", W6 ch7 Marek; docs/QUESTY.md): the cave in the mountain wall above the quarry
# (Map013) - the camp of the diggers of the faction that seeks the Heart: tents, a fire, bedrolls, carts of ore, crates, lanterns
# (every light a flame), the guard of the camp (a mercenary in the look of Humans.js, standing - no fight by default: the quests
# decide, Humans.spawn at the markers), diggers (PixelLab, the hero's style), Marek in a niche staring at the wall, and the
# tunnel the diggers drive west towards Kruche Skały: its far end fallen in. Behind the rubble is the underground's floor 50
# (Map149 "Przekop kopaczy", its eastern tunnel's own rubble) - a closed passage both sides until switch 15 "Gory_TunelKopaczy"
# (a quest opens it); then the dug passage leads from one to the other.
# Tileset 10 (the Winlu Dungeon set of the underground's caves; tools/underground/uglib.py DMap and its catalogue of pieces).
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "underground"))
from uglib import (DMap, blank_page, page, script, text, se, cmd, sw_cond, F_DIRT, F_DIRT_SLABS, FILM_RUBBLE, FILM_DIRT,   # noqa: F401
                   FILM_MOSS, FILM_DUST, render as ug_render)
from chunks_deep import W_CAVE, W_CAVE_BEAMS, W_CAVE_MOSS, LANTERN, LANTERN_LIGHT, BRAZIER, BRAZIER_LIGHT   # noqa: F401
import props as PR

MAP_ID, W, H = 14, 40, 30
NOTE = ("<Dust:on>\n<Dark:on>\n<DayNight:off>\n<DarkDay:200>\n<DarkNight:210>\n<Ambience:cave>\n<Hunt:off>\n<Build:off>\n"
        "<Farm:off>\n<Minimap:off>\n<Humans:off>\n<Poziom:6>")
TUNNEL_SWITCH = 15
EXIT = [(19, 29), (20, 29), (21, 29)]            # the bottom edge: out to the mountains
EXIT_TO = (13, 44, 8, 2)                          # Map013 before the cave's mouth, facing down
LAND = PR.CAVE_LAND                               # (20, 27) where one comes in from the mountains
PASSAGE = (3, 9)                                  # the tunnel's fallen-in end: a hole in the face of its north wall; one stands below it (3, 10)
UG_MAP, UG_LAND = 149, (37, 9)                    # floor 50: below the hole in its tunnel's north wall, facing down
UG_PASSAGE = (37, 8)                              # floor 50: the passage event on the face (patches.py)


def build():
    mp = DMap(MAP_ID, W, H, "Jaskinia", NOTE, bgm="", seed=1414)
    mp.props["bgs"] = {"name": "Drips", "pan": 0, "pitch": 90, "volume": 25}
    mp.props["autoplayBgs"] = True
    from mtlib import blob
    cavern = (blob(mp, 20.5, 15.5, 13.2, 7.4, 1401, 0.22) | mp.rect(10, 11, 31, 20)) & mp.rect(8, 9, 33, 22)
    cavern -= mp.rect(31, 9, 33, 10)
    alcove = mp.rect(27, 5, 32, 8)                 # Marek's niche (north-east)
    neck = mp.rect(18, 23, 22, 25) | mp.rect(19, 26, 21, 29)
    tunnel = mp.rect(2, 12, 9, 14) | mp.rect(2, 10, 4, 11)
    floor = cavern | alcove | neck | tunnel
    mp.shell(floor, F_DIRT, W_CAVE)
    for c in mp.faces:                              # the tunnel and the camp's north wall: timbered by the diggers
        if c[0] <= 8 or (c[1] <= 8 and 12 <= c[0] <= 26): mp.layers[0][c] = ("k", W_CAVE_BEAMS[1])
    for c in mp.faces:
        if c[0] >= 27 and c[1] <= 4: mp.layers[0][c] = ("k", W_CAVE_MOSS[1])
    mp.layers[0].update({c: ("k", F_DIRT_SLABS) for c in tunnel})
    mp.film(FILM_DIRT, {(14, 15), (15, 16), (22, 19), (25, 14), (30, 16), (19, 24), (20, 26)})
    mp.film(FILM_RUBBLE, {(3, 10), (4, 11), (2, 12), (5, 13), (29, 6), (31, 7)})
    mp.film(FILM_DUST, {(12, 18), (26, 20), (16, 12)})
    mp.shadows()

    # ------------------------------------------------------------------------------------------ the ways out
    for (x, y) in EXIT:
        mp.add(x, y, {"name": "Przejście -> Góry i kamieniołom", "note": "", "pages": [
            page(priority=0, trigger=1, cmds=[cmd(201, [0, EXIT_TO[0], EXIT_TO[1], EXIT_TO[2], EXIT_TO[3], 0])])]})
    mp.add(PASSAGE[0], PASSAGE[1], {"name": "Zawał przekopu", "note": "", "pages": [
        page(image=PR.img("!$Mt_Cave", 0, 4, 0), priority=1, trigger=0,
             cmds=PR.popup("Zawał. Belki pękły, kamienie aż pod strop. Za nimi coś szumi - albo woda, albo echo.")),
        page(image=PR.img("!$Mt_Cave", 0, 2, 0), priority=1, trigger=1, cond=sw_cond(TUNNEL_SWITCH),
             cmds=[se("Move1", 70, 70), cmd(201, [0, UG_MAP, UG_LAND[0], UG_LAND[1], 2, 0])])]})
    mp.solid.add(PASSAGE)

    # ------------------------------------------------------------------------------------------ the tunnel west (the diggers' cut)
    for x in (5, 8): mp.piece("stempel_t", x, 10)
    mp.piece("kilof_oparty", 2, 10)
    mp.ev(6, 14, "!wagon", 0, 2, 0, name="Pusty wózek", priority=1, through=False)
    mp.piece("gruz_belka", 4, 10)
    PR.lantern_wall(mp, 7, 11, "Latarnia w przekopie")

    # ------------------------------------------------------------------------------------------ the camp
    PR.campfire(mp, 18, 16, "Ognisko kopaczy")
    for (x, y) in ((15, 17), (21, 17), (14, 14), (22, 14)):
        mp.piece("poslanie", x, y)
    tent = lambda x, y, pat, name: mp.add(x, y, {"name": name, "note": "<Occupy:left=1,right=1,up=1>", "pages": [
        page(image=PR.img("!$Mt_Tent", 0, 2, pat), priority=1, trigger=0, cmds=PR.popup("Namiot kopaczy. W środku koce i worki."))]},
        [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0)])
    tent(13, 11, 0, "Namiot kopaczy")
    tent(17, 11, 2, "Namiot kopaczy")
    mp.add(25, 11, {"name": "Namiot dowódcy", "note": "<Occupy:left=1,right=1,up=1>", "pages": [
        page(image=PR.img("!$Mt_Tent", 0, 2, 1), priority=1, trigger=0, cmds=PR.popup("Namiot dowódcy. Zasznurowany od środka."))]},
        [(25 + dx, 11 + dy) for dx in (-1, 0, 1) for dy in (-1, 0)])
    for x in (12, 13, 14, 16, 17, 18, 24, 25, 26): mp.solid.add((x, 10)); mp.solid.add((x, 11))
    mp.piece("skrzynka_zamknieta", 27, 10)
    mp.piece("in_stolek" if False else "beczka", 28, 11)
    mp.piece("worki_stos", 29, 13)
    mp.piece("skrzynie_wysokie", 31, 12)
    mp.piece("skrzynka_otwarta", 22, 10)
    mp.piece("deski_oparte", 30, 9)
    mp.ev(27, 18, "!wagon", 3, 2, 0, name="Wózek z rudą", priority=1, through=False)
    mp.ev(29, 19, "!wagon", 6, 2, 0, name="Wózek z węglem", priority=1, through=False)
    mp.ev(25, 20, PR.PROPS, 4, 2, 1, name="Worek rudy", priority=1, through=False)
    mp.ev(23, 21, PR.PROPS, 4, 2, 1, name="Worek rudy", priority=1, through=False)
    mp.piece("beczki_dwie", 12, 19)
    mp.piece("kupa_skal", 30, 15)
    mp.piece("stalagmit_br", 33, 14); mp.piece("stalagmit_br2", 9, 19); mp.piece("glaz_brazowy", 32, 17)
    mp.piece("stalagmity_male", 14, 21)
    for (x, y) in ((11, 8), (21, 8), (29, 4)):     # lanterns on the walls (fire), the guard's fire basket by the tunnel
        PR.lantern_wall(mp, x, y, "Latarnia kopaczy")
    mp.ev(9, 15, *BRAZIER, name="Kosz z ogniem", priority=1, through=False, step=True, note=BRAZIER_LIGHT)

    # ------------------------------------------------------------------------------------------ Marek's niche
    mp.piece("krysztaly_nieb", 30, 3)
    mp.piece("krysztal_maly", 28, 3)
    mp.film(FILM_DUST, {(29, 7), (30, 6)})

    # ------------------------------------------------------------------------------------------ the people (standing; the quests talk)
    people = [
        ("Strażnik obozu", "$Human_Merc", 9, 13, 6, ["Obóz jest zamknięty dla obcych.", "Kopiesz z nami albo idziesz stąd."]),
        ("Kopacz", "$Npc_Kopacz", 2, 12, 8, ["Nie przeszkadzaj. Płacą od sążnia."]),
        ("Kopacz", "$Npc_Kopacz", 20, 18, 8, ["Szóstego dnia skończył się chleb...", "Nie pytaj, kto płaci. My też nie pytamy."]),
        ("Kopacz", "$Npc_Kopacz", 27, 17, 6, ["Ruda jak ruda. Ciężka, jakby ktoś ją dociskał od spodu."]),
        ("Marek", "$Npc_Marek", 30, 5, 8, None),
    ]
    for name, sheet, x, y, d, lines in people:
        sheet = sheet if PR.have(sheet) else "$Npc_Uchodzca"
        if lines:
            cmds = []
            for l in lines: cmds += text([l])
        else:
            cmds = PR.popup("Marek stoi twarzą do ściany. Nie odwraca się. Tylko kiwa głową - nie wiadomo do kogo.")
        mp.add(x, y, {"name": name, "note": "<BustName:%s>" % name, "pages": [
            page(image={"characterName": sheet, "characterIndex": 0, "direction": d, "pattern": 1}, priority=1, trigger=0,
                 cmds=cmds, direction_fix=(name == "Marek"))]})
        mp.solid.add((x, y))

    # daylight from the mouth (a soft fill by day - not a fire, no flicker)
    mp.light(20, 29, "<Light:120,150,150,140><LightSoft><LightWhen:day>", name="Światło dnia u wylotu")

    # ------------------------------------------------------------------------------------------ the quest markers
    for key, x, y, d in MARKERS:
        mp.marker(x, y, "Miejsce: " + key, d=d)
    return mp


MARKERS = [
    ("jaskinia_wyjscie", 20, 27, 2),         # where one comes in from the mountains (and goes out, down)
    ("oboz_kopaczy", 18, 18, 8),             # the middle of the camp, before the fire (W8 ch3)
    ("straz_obozu", 9, 13, 6),               # the guard of the camp (Humans.spawn("mercenary", ...) when a quest wants a fight)
    ("kopacz_przodek", 2, 12, 8),            # a digger at the fallen-in end of the tunnel
    ("kopacz_ognisko", 20, 18, 8),           # a digger by the fire
    ("kopacz_wozek", 27, 17, 6),             # a digger at the carts
    ("marek", 30, 5, 8),                     # Marek (W6 ch7, W8 ch3): silent, staring at the wall
    ("namiot_dowodcy", 25, 12, 8),           # before the commander's tent
    ("list_kryjowka", 27, 11, 8),            # the commander's crate (orders, the letter "Świadków nie zostawiać" - W8 ch4)
    ("tunel_wejscie", 8, 13, 4),             # the mouth of the tunnel west (W8 ch6: the fight with Grum "at the entrance of the tunnels")
    ("tunel_brama", 3, 10, 8),               # before the fallen-in end (the closed passage to floor 50; switch 15)
]

if __name__ == "__main__":
    mp = build()
    j = mp.to_json()
    out = sys.argv[1] if len(sys.argv) > 1 else "jaskinia.png"
    ug_render(j, out, scale=float(sys.argv[2]) if len(sys.argv) > 2 else 0.75, grid=True)
