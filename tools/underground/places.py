# The hand-made maps of the underground's band 1 (tools/underground/build.py stages and installs them; docs/PODZIEMIA.md):
#   Map009 "Piwnica Tawerny"     - rebuilt on tileset 10: Borgar's beer cellar under the tavern and, behind it, the oldest wall of
#                                  the fortress with the order's grate - the way down (closed until switch 11, Act II).
#                                  Event 1 (the stairs up to the tavern, its first-visit lines) is kept as it is, at (10, 8).
#   Map010 "Ruiny Zamku"         - the fortress's gate hall under the cellar: the narrow stairs up, the great stairs down to
#                                  floor 1 (and the song's shortcut, W3), the lift shaft from floor 10.
#   Map131..139                  - the generated floors' shells ("Podziemia: piętro N"): empty - Underground.js fills them.
#   Map140 "Strażnica"           - floor 10, made by hand: the order's notes, the guardian (an empty armour) and the tenth gate,
#                                  the lift up.
# Nothing here writes data/.
import os, sys, copy, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from uglib import *   # noqa: F401,F403

CELLAR, RUINS, FLOOR10 = 9, 10, 140
SW_GATE, SW_LIFT, SW_SONG, SW_GATE10 = 11, 12, 13, 14
TAVERN_BACK = (1, 9, 5, 2)          # where the stairs up lead (Map001, in front of the loose brick, facing down) - as event 1

# where one arrives (keep in step with Underground_Data.js SPOTS)
CELLAR_GATE = (15, 3)               # Map009: in front of the grate (15,2)
RUINS_FROM_CELLAR = (3, 7)          # Map010: below the narrow stairs (3,6)
RUINS_STAIRS = (14, 7)              # Map010: in front of the great stairs (14,6)
RUINS_LIFT = (24, 8)                # Map010: in front of the lift (24,7)
F10_ARRIVE = (5, 13)                # Map140: below the stairs up (5,12)
F10_LIFT = (21, 5)                  # Map140: in front of the cage (21,4)

UG_NOTE = "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<DarkDay:%d>\n<DarkNight:%d>\n<Ambience:cave>\n<Hunt:off>\n<Build:off>\n<Farm:off>\n<Minimap:off>"
TORCH = ("!Decoration", 3, 4, 0)
TORCH_OUT = ("!Decoration", 3, 2, 0)
TORCH_LIGHT = "<Light:150,255,160,90><LightFlicker:0.13,255,130,55><LightHeight:40>"
BRAZIER = ("!Decoration", 0, 2, 0)
BRAZIER_LIGHT = "<Light:170,255,150,70><LightFlicker:0.16,255,110,40><LightHeight:26>"


def load_json(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def torch(mp, x, y, lit=True):
    if lit: mp.ev(x, y, *TORCH, name="Pochodnia", priority=0, through=True, step=True, note=TORCH_LIGHT)
    else: mp.ev(x, y, *TORCH_OUT, name="Wypalona pochodnia", priority=0, through=True)


def brazier(mp, x, y):
    mp.ev(x, y, *BRAZIER, name="Kosz z ogniem", priority=1, through=False, step=True, note=BRAZIER_LIGHT)


def note_event(mp, x, y, key, art, name):
    """an order's note (Underground_Data NOTES[key]): a picture under the characters; the action button reads it"""
    a = {"zwoj": ("!Underground_Props", 0, 2, 1), "ksiega": ("!Underground_Props", 0, 2, 2), "kartki": ("!Underground_Props", 0, 6, 1),
         "papiery": ("!Underground_Props", 0, 2, 0), "none": ("", 0, 2, 0)}[art]
    return mp.ev(x, y, *a, name="Zapiski: " + name, priority=1, through=False,
                 cmds=script('Underground.read("%s")' % key), note="<Zapiski:%s>" % key)


def say_lines(lines, spk=None):
    pre = "\\SPK[%d]" % spk if spk is not None else ""
    out = []
    for block in lines:
        out += text([pre + block[0]] + list(block[1:]))
    return out


# ======================================================================================================== Map009
def piwnica():
    """Borgar's cellar (light brick, left) and the oldest part of the fortress behind it (rough stone, right) with the grate"""
    old = load_json(ROOT + "data/Map009.json")
    W, H = 20, 15
    mp = DMap(CELLAR, W, H, "Piwnica Tawerny", UG_NOTE % (165, 165), bgm="Dungeon1")
    for k in ("autoplayBgm", "bgm", "autoplayBgs", "bgs", "displayName", "encounterList", "encounterStep", "disableDashing"):
        mp.props[k] = copy.deepcopy(old[k])
    floor = mp.rect(1, 3, 18, 13) - mp.rect(9, 0, 10, 7)
    mp.shell(floor, F_BROWN_SLAB, W_LIGHT)
    # the right part is the old fortress: rough stone faces, a stone floor
    for c in mp.faces:
        if c[0] >= 11: mp.layers[0][c] = ("k", W_ROUGH[1])
    for c in mp.all - mp.faces - floor:
        if c[0] >= 11: mp.layers[0][c] = ("k", W_ROUGH[0])
    for c in floor:
        if c[0] >= 12: mp.layers[0][c] = ("k", F_DIRT_SLABS)
    mp.shadows()
    # ---- event 1 kept as it is (the arrival from the loose brick and the way back up), at (10, 8)
    ev1 = next(e for e in old["events"] if e and e["id"] == 1)
    mp.add(10, 8, {"name": ev1["name"], "note": ev1["note"], "pages": copy.deepcopy(ev1["pages"])})
    # the narrow stairs from the tavern come down through the middle block; walking into them: up as event 1 does
    mp.ev(10, 7, "!Fantasy_door5", 0, 6, 0, name="Schody do tawerny", priority=1, through=False, trigger=1,
          cmds=[se("Move1", 80, 100), transfer(*TAVERN_BACK)], note="<Light:105,255,175,110><LightFlicker:0.05>")
    mp.ev(9, 7, "!Decoration", 7, 2, 0, name="Latarnia Borgara", priority=0, through=True, step=True,
          note="<Light:150,255,180,110><LightFlicker:0.07><LightHeight:56>")
    # ---- Borgar's beer: barrels along the north wall and the west wall, sacks, crates
    mp.piece("beczki_dwie", 1, 3); mp.piece("beczki_dwie", 4, 3); mp.piece("beczka", 7, 3)
    mp.piece("beczki_dwie", 1, 7); mp.piece("beczki_piramida", 1, 12)
    mp.piece("worki_stos", 6, 12); mp.piece("skrzynka_zamknieta", 8, 12)
    mp.piece("skrzynka_plotno", 15, 12); mp.piece("deski_oparte", 18, 11)
    mp.ev(4, 9, "!Decoration_static_2", 0, 2, 1, name="Beczka piwa (Borgara)", priority=1, through=False,
          cmds=text(["Piwo Borgara. Lepiej nie ruszać - liczy każdą beczkę."]))
    mp.film(FILM_DUST, {(3, 6), (4, 6), (7, 7), (12, 9), (13, 9), (14, 10), (16, 7), (17, 7), (13, 4)})
    # ---- the oldest wall: rubble at its foot, cobwebs, roots - and the order's grate (the way down)
    mp.piece("kamyki", 17, 5); mp.piece("korzenie", 17, 3)
    mp.piece("pajeczyna_rog", 18, 1)
    mp.piece("kosci", 13, 7)
    mp.piece("beczka_rozbita", 17, 8); mp.piece("skrzynka_pusta", 12, 10); mp.piece("kamyki2", 14, 11)
    mp.piece("glazy", 12, 3)
    mp.ev(13, 2, *TORCH_OUT, name="Wypalona pochodnia", priority=0, through=True)
    mp.ev(17, 2, *TORCH_OUT, name="Wypalona pochodnia", priority=0, through=True)
    closed = page(image={"characterName": "!Fantasy_door6", "characterIndex": 2, "direction": 2, "pattern": 0}, priority=1, trigger=0,
                  cmds=say_lines([["Stara krata, wpuszczona w mur dawnej twierdzy. Za nią schody znikają w ciemności."],
                                  ["Zamek ma wyryty znak kruka i zardzewiał na kamień. Krata ani drgnie."]]))
    opened = page(image={"characterName": "!Fantasy_door6", "characterIndex": 2, "direction": 8, "pattern": 0}, priority=1, trigger=1,
                  cmds=[se("Move1", 80, 90), transfer(RUINS, RUINS_FROM_CELLAR[0], RUINS_FROM_CELLAR[1], 2)], cond=sw_cond(SW_GATE))
    mp.add(CELLAR_GATE[0], CELLAR_GATE[1] - 1, {"name": "Stara krata zakonu (zejście)", "note": "", "pages": [closed, opened]})
    mp.spot("gate", *CELLAR_GATE, 8)
    mp.spot("arrive", 10, 8, 8)
    return mp


# ======================================================================================================== Map010
def ruiny():
    """the fortress's gate hall: rough old stone, broken columns, the great stairs down in the middle of the north wall"""
    W, H = 28, 19
    mp = DMap(RUINS, W, H, "Ruiny Zamku", UG_NOTE % (205, 205))
    hall = mp.rect(6, 7, 21, 16)
    alcove = mp.rect(2, 7, 5, 10)                    # the narrow stairs from the cellar come down here
    shaft = mp.rect(22, 8, 25, 11)                   # the lift's shaft
    floor = hall | alcove | shaft
    mp.shell(floor, F_DIRT_SLABS, W_ROUGH)
    mp.shadows()
    mp.film(FILM_RUBBLE, {(7, 15), (8, 15), (8, 16), (19, 15), (20, 16), (6, 12), (21, 9)})
    mp.film(FILM_DUST, {(10, 9), (11, 9), (17, 10), (18, 10), (13, 13), (14, 13), (3, 9), (4, 9)})
    # ---- the narrow stairs up to the cellar (walking into them)
    mp.ev(3, 6, "!Fantasy_door5", 0, 2, 0, name="Wąskie schody do piwnicy", priority=1, through=False, trigger=1,
          cmds=[se("Move1", 80, 100), transfer(CELLAR, CELLAR_GATE[0], CELLAR_GATE[1], 2)])
    # ---- the great stairs down (3 wide: the gate frame of the set, open), braziers on both sides
    down_plain = [se("Move1", 80, 85), *script('Underground.stairs("down")')]
    shortcut = [*text(["Trzeci stopień od góry brzmi pusto. Pod nim - wąskie przejście, prosto w dół."]),
                se("Move1", 80, 70), *script("Underground.go(10)")]
    with_song = choice("", ["Zejść schodami (piętro 1)", "Trzeci stopień... (skrót na dziesiąte piętro)", "Zostać"], [down_plain, shortcut, []])
    stairs_cmds = [cmd(111, [0, SW_SONG, 0])] + indent(with_song, 1) + [cmd(0, [], 1), cmd(411, [])] + indent(down_plain, 1) + [cmd(0, [], 1), cmd(412, [])]
    mp.ev(14, 6, "!Gate_Dungeon1", 1, 8, 0, name="Wielkie schody w dół", priority=1, through=False, trigger=1, cmds=stairs_cmds)
    for x in (13, 15):
        mp.ev(x, 6, "", 0, 2, 0, name="Wielkie schody w dół (bok)", priority=1, through=False, trigger=1, cmds=stairs_cmds)
    brazier(mp, 11, 7); brazier(mp, 17, 7)
    # the order's sign beside it: the raven and the words carved under it (the action button reads them)
    mp.ev(10, 6, "!House_Town", 2, 2, 0, name="Kruk i napis w kamieniu", priority=1, through=False,
          cmds=say_lines([["Kruk wykuty w kamieniu, a pod nim litery - starsze niż tawerna, starsze niż dwór:"],
                          ["KTO SCHODZI, TEN PYTA. KTO PYTA, TEN PŁACI."]]))
    # ---- the lift: the shaft with chains; the cage once the windlass on floor 10 turned
    mp.ev(23, 7, "!Fantasy_switches2", 3, 2, 0, name="Łańcuch", priority=0, through=True)
    mp.ev(25, 7, "!Fantasy_switches2", 3, 2, 1, name="Łańcuch", priority=0, through=True)
    # (2026-10-06, floors 11-100: the cage takes one to any stop whose windlass was turned - Underground.cage / liftMenu)
    empty = page(priority=1, trigger=0, cmds=script("Underground.cage(this)"))
    cage = page(image={"characterName": "!Fantasy_hanging_cage", "characterIndex": 0, "direction": 2, "pattern": 0}, priority=1, trigger=0,
                cond=sw_cond(SW_LIFT), cmds=script("Underground.cage(this)"))
    mp.add(24, 7, {"name": "Winda (szyb)", "note": "", "pages": [empty, cage]})
    # ---- what lies about: broken columns, stones, bones
    mp.piece("kolumna", 8, 9); mp.piece("kolumna", 19, 9)
    mp.piece("pniak_kolumny", 8, 13); mp.piece("kolumna_lezaca", 19, 12)
    mp.piece("glazy", 6, 15); mp.piece("gruz", 20, 16); mp.piece("kamyki", 12, 15); mp.piece("kamyki2", 16, 11)
    mp.piece("szkielet", 15, 14)
    mp.piece("pajeczyna", 20, 5, z=3)
    torch(mp, 7, 6); torch(mp, 21, 6, lit=False); torch(mp, 4, 6)
    mp.marker(12, 12, "Stwór: szczur", "<Stwor:szczur>")
    mp.spot("fromCellar", *RUINS_FROM_CELLAR, 2)
    mp.spot("stairs", *RUINS_STAIRS, 2)
    mp.spot("lift", *RUINS_LIFT, 2)
    return mp


# ======================================================================================================== Map140
def straznica():
    """floor 10, the watch of the tenth gate: the antechamber with the rule of the watch and the warden's journal, the hall of the
    guardian (an empty armour by the tenth gate), the lift chamber behind the gate (the windlass, the cage, the stairs down - fallen
    in for now)"""
    W, H = 30, 24
    mp = DMap(FLOOR10, W, H, "Podziemia - piętro 10 (Strażnica)", UG_NOTE % (215, 215) + "\n<Poziom:9>")
    ante = mp.rect(2, 13, 10, 19)
    link = mp.rect(11, 16, 13, 17)
    hall = mp.rect(14, 13, 25, 20)
    gate = mp.rect(18, 8, 20, 12)
    lift = mp.rect(15, 3, 23, 7)
    floor = ante | link | hall | gate | lift
    mp.shell(floor, F_SLATE_SQ, W_ARCHES)
    for c in ante | link: mp.layers[0][c] = ("k", F_GREY_TILE)
    for c in lift | gate: mp.layers[0][c] = ("k", F_SLATE)
    mp.shadows()
    mp.film(FILM_DUST, {(3, 18), (4, 18), (9, 14), (15, 19), (16, 19), (24, 14), (16, 4), (22, 6)})
    # ---- the antechamber: the stairs up to floor 9, the rule of the watch on a stone, the warden's journal on the lectern
    mp.ev(5, 12, "!Fantasy_door5", 0, 2, 0, name="Schody w górę (piętro 9)", priority=1, through=False, trigger=1,
          cmds=[se("Move1", 80, 95), *script('Underground.stairs("up")')])
    mp.piece("oltarz", 3, 13)
    note_event(mp, 3, 14, "10a", "zwoj", "Reguła straży")
    mp.ev(8, 13, "!$Altar", 0, 2, 0, name="Pulpit z dziennikiem", priority=1, through=False, step=True,
          cmds=script('Underground.read("10b")'), note="<Light:120,255,190,120><LightFlicker:0.06><Zapiski:10b>")
    mp.ev(2, 12, "!$Dungeon_Statue1", 0, 2, 0, name="Posąg z płomieniem", priority=0, through=True, step=True)
    mp.ev(10, 12, "!$Dungeon_Statue1", 0, 6, 0, name="Posąg z płomieniem", priority=0, through=True, step=True)
    mp.light(2, 12, "<Light:150,255,160,80><LightFlicker:0.1>", "Płomień posągu")
    mp.light(10, 12, "<Light:150,255,160,80><LightFlicker:0.1>", "Płomień posągu")
    mp.piece("dzbany_grupa", 9, 18); mp.piece("kosci", 4, 17)
    mp.marker(6, 17, "Stwór: szczur", "<Stwor:szczur>")
    # ---- the hall of the guardian: the armour on its pedestal left of the tenth gate, braziers, the last entry
    brazier(mp, 16, 13); brazier(mp, 22, 13)
    torch(mp, 15, 12); torch(mp, 24, 12)
    guard_id = len(mp.events) + 1
    g_sleep = {"characterName": "!$Ug_Guardian", "characterIndex": 0, "direction": 2, "pattern": 0}
    wake = [*script('Underground.guardianPose(this.eventId(), "wake")'), se("Darkness3", 85, 70), cmd(225, [4, 6, 20, False]), cmd(230, [20])]
    talk = say_lines([["Pusta zbroja unosi głowę. W szczelinie hełmu zapala się blady ogień."]])
    talk += say_lines([["KTO SCHODZI, TEN PYTA. KTO PYTA, TEN PŁACI."], ["Czego szukasz pod dziesiątą bramą?"]], spk=guard_id)
    wrong_truth = say_lines([["PRAWDY NIE BIERZE SIĘ GARŚCIAMI."]], spk=guard_id) + \
        [*script('Underground.guardianPose(this.eventId(), "strike")'), se("Sword4", 90, 80), cmd(230, [12]),
         *script("Underground.guardianStrike(18)"), cmd(230, [30]), *script('Underground.guardianPose(this.eventId(), "sleep")')] + \
        say_lines([["To nie te słowa. Zapiski zakonu coś o nich mówiły..."]])
    wrong_way = say_lines([["DROGA NA GÓRĘ JEST ZA TOBĄ. TĘDY - TYLKO Z WŁAŚCIWYMI SŁOWAMI."]], spk=guard_id) + \
        [*script('Underground.guardianPose(this.eventId(), "strike")'), se("Blow3", 80, 90), cmd(230, [10]),
         *script("Underground.guardianStrike(6)"), cmd(230, [24]), *script('Underground.guardianPose(this.eventId(), "sleep")')]
    right = say_lines([["...SŁOWA KASZTELANA."], ["PRZEJDŹ. I NIE WRACAJ PO WIĘCEJ, NIŻ CI TRZEBA."]], spk=guard_id) + \
        [se("Gate1", 90, 70), cmd(225, [3, 6, 30, False]), cmd(121, [SW_GATE10, SW_GATE10, 0]),
         *script('Underground.guardianPose(this.eventId(), "spent"); Underground.gate10Opened()')] + \
        say_lines([["Zbroja opuszcza miecz. Brama za nią drga i powoli się otwiera."]])
    riddle = wake + talk + choice("", ["Prawdy.", "Drogi na górę.", "Nie pytam o to, czego nie chcę wiedzieć."],
                                  [wrong_truth, wrong_way, right], cancel=1)
    first = [cmd(111, [12, "Underground.guardianHandled(this.eventId())"])] + [cmd(0, [], 1), cmd(411, [])] + indent(riddle, 1) + \
        [cmd(0, [], 1), cmd(412, [])]
    p1 = page(image=g_sleep, priority=1, trigger=0, cmds=first)
    p2 = page(image=dict(g_sleep, direction=6), priority=1, trigger=0, cond=sw_cond(SW_GATE10),
              cmds=say_lines([["Zbroja stoi bez ruchu. Ogień w hełmie przygasł."]]))
    mp.add(17, 13, {"name": "Pusta zbroja strażnika", "note": "<Stwor:zbroja_straznik>", "pages": [p1, p2]})
    assert mp.events[-1][2]["name"] == "Pusta zbroja strażnika" and len(mp.events) == guard_id
    # the line in front of the gate: stepping on it wakes the guardian (the same talk as the action button)
    for x in range(17, 22):
        mp.add(x, 15, {"name": "Próg dziesiątej bramy", "note": "",
                       "pages": [page(priority=0, trigger=1, through=True, cmds=script("Underground.wake(%d)" % guard_id)),
                                 page(priority=0, through=True, cond=sw_cond(SW_GATE10))]})
    # the tenth gate (3 wide, standing in the opening of the wall): closed (blocks) until switch 14, then open (walk through)
    g_closed = page(image={"characterName": "!Gate_Dungeon1", "characterIndex": 0, "direction": 6, "pattern": 0}, priority=1, trigger=0,
                    cmds=say_lines([["Dziesiąta brama. Złote znaki na kamieniu tlą się jak żar. Nie ma tu klamki ani zamka."]]))
    g_open = page(image={"characterName": "!Gate_Dungeon1", "characterIndex": 1, "direction": 8, "pattern": 0}, priority=0, through=True,
                  cond=sw_cond(SW_GATE10))
    mp.add(19, 12, {"name": "Dziesiąta brama", "note": "", "pages": [g_closed, g_open]})
    for x in (18, 20):
        mp.add(x, 12, {"name": "Dziesiąta brama (bok)", "note": "",
                       "pages": [page(priority=1, trigger=0), page(priority=0, through=True, cond=sw_cond(SW_GATE10))]})
    note_event(mp, 24, 19, "10d", "kartki", "Ostatni wpis")
    mp.piece("szkielet", 23, 18); mp.piece("czaszki", 15, 17)
    mp.marker(21, 18, "Stwór: pająk", "<Stwor:pajak>")
    # ---- the lift chamber: the windlass, the cage, the words over it; the stairs down (fallen in); the watch's chest
    # (2026-10-06: the windlass and the cage of every stop work the same - Underground.windlass / cage, the stops in its state)
    lever = {"characterName": "!Fantasy_switches2", "characterIndex": 0, "direction": 2, "pattern": 0}
    l1 = page(image=lever, priority=1, trigger=0, cmds=script("Underground.windlass(this)"))
    l2 = page(image=dict(lever, direction=6), priority=1, trigger=0, cond=self_cond("A"), cmds=script("Underground.windlass(this)"))
    mp.add(18, 3, {"name": "Kołowrót windy", "note": "", "pages": [l1, l2]})
    cage_img = {"characterName": "!Fantasy_hanging_cage", "characterIndex": 0, "direction": 2, "pattern": 0}
    mp.add(21, 4, {"name": "Winda kasztelana", "note": "", "pages": [page(image=cage_img, priority=1, trigger=0, cmds=script("Underground.cage(this)"))]})
    note_event(mp, 22, 2, "10c", "none", "Napis nad windą")
    mp.ev(20, 2, "!Fantasy_switches2", 3, 2, 0, name="Łańcuch", priority=0, through=True)
    mp.ev(23, 2, "!Fantasy_switches2", 3, 2, 1, name="Łańcuch", priority=0, through=True)
    mp.ev(16, 2, "!Fantasy_door5", 1, 2, 0, name="Schody w dół (piętro 11)", priority=1, through=False, trigger=1,
          cmds=[se("Move1", 80, 85), *script('Underground.stairs("down")')])
    mp.spot("down", 16, 3, 2)
    mp.piece("gruz", 15, 4); mp.piece("kamyki", 17, 5)
    chest = page(image={"characterName": "!Dungeon_chest", "characterIndex": 0, "direction": 2, "pattern": 0}, priority=1, trigger=0,
                 cmds=[se("Chest1", 80, 100), cmd(126, [152, 0, 0, 2]), cmd(126, [59, 0, 0, 2]), cmd(125, [0, 0, 25]),
                       *text(["Skrzynia straży: dwa opatrunki, dwie pochodnie i garść starych monet."]), cmd(123, ["A", 0])])
    chest_open = page(image={"characterName": "!Dungeon_chest", "characterIndex": 0, "direction": 8, "pattern": 0}, priority=1, trigger=0,
                      cond=self_cond("A"), cmds=text(["Pusta."]))
    mp.add(15, 6, {"name": "Skrzynia straży", "note": "", "pages": [chest, chest_open]})
    torch(mp, 17, 2); torch(mp, 22, 2, lit=False)
    mp.spot("arrive", *F10_ARRIVE, 2)
    mp.spot("up", *F10_ARRIVE, 2)
    mp.spot("lift", *F10_LIFT, 2)
    mp.spot("guardian", 17, 13, 2)
    return mp


# ======================================================================================================== the shells
def shell(floor):
    """a generated floor's map file: empty rock with a note - Underground.js makes the floor as the map loads"""
    mp = DMap(130 + floor, 17, 13, "Podziemia - piętro %d" % floor,
              "Piętro składane przez Underground.js z kawałków mapy 130 (ziarno zapisu).\n"
              "Tu nic nie rysuj - gra i tak tego nie użyje. Opis: docs/PODZIEMIA.md")
    for c in mp.all: mp.layers[0][c] = ("k", 99)
    return mp


BUILDERS = {CELLAR: piwnica, RUINS: ruiny, FLOOR10: straznica}
SHELLS = list(range(1, 10))
