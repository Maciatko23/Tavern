# The tavern's two upper floors: Map025 "Pokoje gości" and Map026 "Apartamenty" (tileset 8, Winlu Interior Remaster).
#   python build_upper.py plans       - the zone plans docs/tawerna_nowa/plan_pietro1.png, plan_pietro2.png
#   python build_upper.py             - both maps -> tools/tavern/staging/Map025.json, Map026.json (+ links.json keys)
#   python build_upper.py 25 | 26     - one map
# Never writes data/: the ground floor's apply script installs the staged maps (tools/apply_tavern_interior.py).
import sys, os, json
from upperlib import *

DOCS = os.path.abspath(os.path.join(HERE, "..", "..", "docs", "tawerna_nowa"))
LINKS = os.path.join(HERE, "links.json")

def _floor_note():
    """the ground floor's map note (links.json lighting.map001_note), so all three floors look the same at every hour"""
    try:
        with open(LINKS, "rb") as f:
            n = json.loads(f.read().decode("utf-8"))["lighting"]["map001_note"]
        if "<Dark:on>" in n: return n
    except Exception:
        pass
    return "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<DarkDay:30>\n<DarkNight:185>"
NOTE25 = NOTE26 = _floor_note()

def load_links():
    try:
        with open(LINKS, "rb") as f:
            return json.loads(f.read().decode("utf-8"))
    except Exception:
        return {}

def map001_from_above():
    """where coming down from Map025 lands on Map001: the ground floor's links.json key, else its layout table
    (tools/tavern/parter_layout.py FROM_ABOVE), else the concept's spot; (cells, direction, provisional?)"""
    L = load_links()
    k = L.get("map001_from_above")
    if k:
        cells = k.get("landing") or k.get("cells") or k
        return [tuple(c[:2]) for c in cells], (k.get("dir", 2) if isinstance(k, dict) else 2), False
    try:
        import parter_layout as P
        return [tuple(c) for c in P.FROM_ABOVE], 2, True
    except Exception:
        return [(59, 82), (60, 82), (61, 82)], 2, True

# ================================================================================================================ Map025
def plans():
    L = layout25()
    rows = ["#Pokoje (24 + komnata)"]
    for sp in sorted([s for s in L["spaces"] if s.number], key=lambda s: s.number):
        st = STYLES[sp.style]["pl"]
        t = "%2d  %-8s %s" % (sp.number, SIZE_PL[sp.size], st)
        if sp.rent: t += "  — wynajem %d G" % sp.rent[1]
        rows.append(t)
    rows += ["", "#Pozostałe",
             "Komnata: łoże, kominek — wynajem 30 G",
             "   od reputacji 60 (TavernLife)",
             "Hall schodowy: schody z sali tawerny,",
             "   księga gości, zegar, kandelabry",
             "Galeria: studnia nad salą, balustrada,",
             "   żyrandol sali widoczny z góry",
             "Salonik: kominek z kamienia, fotele",
             "Łazienka: balie za parawanami",
             "Bieliźniarka + pokój pokojówki",
             "Schody na górę -> Apartamenty,",
             "   złota krata (reputacja 80) i dzwonek"]
    s1 = draw_plan(L, os.path.join(DOCS, "plan_pietro1.png"),
                   "Układ H: dwa korytarze z drzwiami połączone Galerią; schody z sali na osi, na końcu osi salonik. "
                   "Żółte: do wynajęcia.", rows)
    L = layout26()
    rows = ["#Apartamenty (5)",
            "Lorda: salon na osi + sypialnia,",
            "   herb Zaleskich, chorągwie (czerwień i złoto)",
            "Różany, Błękitny (północ)",
            "Zielony, Złoty (południe)",
            "Złoty: do wynajęcia 50 G od reputacji 80",
            "każdy: salonik z kominkiem + sypialnia",
            "   z łożem z baldachimem, toaletka,",
            "   szafa, złoty kufer, dywany, obrazy",
            "", "#Pozostałe",
            "Wielka galeria: marmur, pilastry,",
            "   kolumny, posągi, klatka schodowa",
            "   z balustradą, miejsce strażnika",
            "Wielki salon: kominek, harfa, szpinet",
            "Jadalnia: długi stół, srebra, gobelin",
            "Biblioteka: ściana regałów, pulpit",
            "Kącik służby: srebra, łóżko, wózek",
            "Łazienka: miedziana wanna, toaletka",
            "Taras: balkon z balustradą, donice"]
    s2 = draw_plan(L, os.path.join(DOCS, "plan_pietro2.png"),
                   "Pałacowy układ osiowy: schody wychodzą na środek Wielkiej galerii; na osi apartament Lorda, "
                   "salon i jadalnia, za nimi taras.", rows, S=13)
    print("plans", s1, s2)

PINS25 = [("Przyjście z sali (schody)", 48, 62), ("Schody w dół -> Tawerna", 48, 65), ("Księga gości", 43, 61),
          ("Studnia nad salą", 48, 33), ("Salonik: kominek", 48, 4), ("Komnata: łoże (30 G, rep. 60)", 67, 4),
          ("Pokój 1: łóżko (8 G)", 38, 37), ("Pokój 2: łóżka (15 G)", 57, 37), ("Pokój 3: łóżko (20 G)", 27, 37),
          ("Złota krata (rep. 80)", 92, 16), ("Dzwonek na odźwiernego", 89, 16), ("Schody -> Apartamenty", 92, 6),
          ("Łazienka: balie", 9, 29), ("Bieliźniarka: wózek", 22, 29)]
PINS26 = [("Przyjście ze schodów", 40, 23), ("Schody w dół -> Pokoje gości", 40, 26), ("Herb Zaleskich, drzwi Lorda", 40, 18),
          ("Miejsce strażnika", 36, 23), ("Złoty: łoże (50 G, rep. 80)", 74, 35), ("Wielki salon: kominek", 30, 35),
          ("Harfa i szpinet", 23, 45), ("Jadalnia: stół na 14 osób", 50, 40), ("Biblioteka", 53, 10),
          ("Taras", 40, 50), ("Łazienka: miedziana wanna", 75, 23), ("Kącik służby", 4, 26)]

def docs_static():
    """plans + zone pictures (from the offline render of the tiles, no darkness)"""
    plans()
    for mid, L, pins, title, sub in (
            (25, layout25(), PINS25, "Piętro 1 — Pokoje gości (Map025): strefy",
             "24 pokoje (1-3 do wynajęcia), komnata do wynajęcia, salonik, galeria nad salą, hall schodowy, łazienka, bieliźniarka, pokój pokojówki"),
            (26, layout26(), PINS26, "Piętro 2 — Apartamenty (Map026): strefy",
             "5 apartamentów (Złoty do wynajęcia), Wielka galeria, salon, jadalnia, biblioteka, kącik służby, łazienka, taras")):
        m = json.load(open(os.path.join(STAGING, "Map%03d.json" % mid), encoding="utf-8"))
        plain = os.path.join(STAGING, "renders", "u%d_plain.png" % mid)
        render_offline(m, plain, flags=FLAGS_UP)
        size = strefy(L, plain, os.path.join(DOCS, "pietro%d_strefy.png" % (1 if mid == 25 else 2)), title, sub, pins)
        print("strefy", mid, size)

KINDS25 = {"nc": (52, 84), "sc": (52, 84), "gal": (None, 80), "hall": (52, 80), "lounge": (54, 80), "chamber": (63, 80),
           "up": (52, 84), "bath": (64, 99), "linen": (61, 81), "maid": (56, 81)}

def door_pic(n):
    """the numbered door of room n (my doors sheet: 8 blocks x 3 patterns = rooms 1..24)"""
    return (DOORS_SHEET, (n - 1) // 3, (n - 1) % 3)

def bays(openings, x0, x1):
    """the stretches of a wall face between its doors/arches: [(a, b)] inclusive, openings = [(xa, xb)]"""
    out, cur = [], x0
    for (a, b) in sorted(openings):
        if a - 1 >= cur: out.append((cur, a - 1))
        cur = b + 1
    if cur <= x1: out.append((cur, x1))
    return out

def bay_spots(a, b, gap=1):
    """evenly spaced spots in a bay (away from its ends by `gap`): one in the middle, three when it is wide"""
    n = b - a + 1
    c = (a + b) / 2.0
    if n < 3 + 2 * gap: return []
    if n >= 15:
        k = (n + 1) // 4
        return [int(c - k), int(c), int(c + k)] if c == int(c) else []
    return [int(c)] if c == int(c) else []

def build25():
    L = layout25()
    mp = UpperMap(25, L, "Pokoje gości", NOTE25, seed=2501)
    mp.props["bgm"] = {"name": "Town1", "pan": 0, "pitch": 100, "volume": 55}
    for sp in L["spaces"]:
        if sp.style:
            mp.wall_kind[sp.key], mp.floor_kind[sp.key] = STYLES[sp.style]["wall"], STYLES[sp.style]["floor"]
        else:
            mp.wall_kind[sp.key], mp.floor_kind[sp.key] = KINDS25[sp.key]
    mp.build_shell()
    S = mp.spaces
    # ---------------------------------------------------------------- openings through the walls
    mp.arch(46, 50, 13, 16, 80)                       # the lounge's arch from the north corridor
    mp.arch(46, 50, 53, 56, 80)                       # the stair hall's arch into the south corridor
    for x in range(90, 95):                           # the stairwell up: steps from the corridor's wall face upwards
        for y in range(5, 17): mp.tile(0, x, y, A5(1, 2))
        mp.tile(0, x, 4, A5(0, 0))
    # the stair hall: a 17x6 hall and the stairwell down between walls in the middle of its south side
    hall = S["hall"]
    for y in range(63, 70):
        for x in list(range(40, 46)) + list(range(51, 57)):
            mp.kind(0, {(x, y)}, mp.border); mp.room_of.pop((x, y), None)
    for y in range(63, 69):
        for x in range(46, 51): mp.tile(0, x, y, A5(1, 2))
    for x in range(46, 51): mp.tile(0, x, 69, A5(0, 0))
    for y in range(63, 70):
        mp.t("B", 14, 5 if y == 63 else 6, 45, y); mp.t("B", 12, 5 if y == 63 else 6, 51, y)
    # the well in the Galeria: a hole over the tavern's great hall, a balustrade round it
    wx0, wy0, wx1, wy1 = 46, 28, 50, 38
    for x in range(wx0, wx1 + 1):
        for y in range(wy0 + 1, wy1 + 1): mp.tile(0, x, y, A5(0, 0))
    for x in range(wx0, wx1 + 1):
        mp.t("B", 12 if x == wx0 else 14 if x == wx1 else 13, 4, x, wy0)
        mp.t("B", 12 if x == wx0 else 14 if x == wx1 else 13, 7, x, wy1)
    for y in range(wy0 + 1, wy1):
        mp.t("B", 12, 5 if y == wy0 + 1 else 6, wx0, y); mp.t("B", 14, 5 if y == wy0 + 1 else 6, wx1, y)
    mp.occupy([(x, y) for x in range(wx0, wx1 + 1) for y in range(wy0, wy1 + 1)], "Balustrada studni", "gal")
    # ---------------------------------------------------------------- doors and the guest rooms
    corr = lambda sp: "nc" if sp.y1 < 17 or 21 < sp.y0 < 33 else "sc"
    for sp in L["spaces"]:
        if not sp.door or sp.door[0] not in ("front", "gap"): continue
        dx = sp.door[1]
        if sp.number:
            pic = door_pic(sp.number)
        elif sp.key == "chamber":
            pic = ("!Fantasy_door1", 3, 0)
        else:
            pic = ("!Fantasy_door1", 1, 0)
        msg = "Zamknięte. Komnatę można wynająć u Borgara." if sp.key == "chamber" else None
        if sp.door[0] == "front":
            mp.door_front(sp, corr(sp), dx, pic, lock=sp.lock, lock_msg=msg)
        else:
            mp.door_gap(sp, corr(sp), dx, pic, lock=sp.lock, lock_msg=msg)
    for sp in L["spaces"]:
        if sp.kind != "guest": continue
        pillow = furnish_guest(mp, sp)
        if sp.rent and sp.rent[0] == "komnata": continue
        if sp.rent:
            rid, price = sp.rent
            bx, by = pillow
            # the bed for the night (TavernLife): on the pillow; <Occupy> reaches over the whole bed (and the space
            # between twin beds), so the action button works from the side or the foot
            spans = [x for (x, y) in mp.occ if mp.occ[(x, y)] == "Łóżko" and mp.room_of.get((x, y)) == sp.key]
            right = max(spans) - bx
            note = "<Occupy:right=%d,down=1>" % right if right else "<Occupy:down=1>"
            eid = mp.add_event(bx, by, "Łóżko do wynajęcia (%s)" % sp.label,
                               [page(1, 0, None, comment('<Tavern:bed room=%s price=%d name="Pokój nr %s">' % (rid, price, rid)))], note)
            mp.tags.append({"kind": "bed", "room": rid, "price": price, "name": "Pokój nr %s" % rid, "event": eid,
                            "x": bx, "y": by, "occupy": note})
    special25(mp)
    stairs25(mp)
    gate25(mp)
    return mp

UP_X = (90, 91, 92, 93, 94)            # Map025's stairs up (columns)
DOWN26_X = (38, 39, 40, 41, 42)        # Map026's stairs down (columns)
LAND25_FROM_ABOVE = (92, 17, 2)        # on Map025, coming down from Map026: below the stairs up, facing down
LAND26 = (40, 23, 8)                   # on Map026, coming up: on the landing above its stairs, facing up
LAND25_FROM_BELOW = (48, 62, 8)        # on Map025, coming up from the tavern: above the stairs down, facing up

def stairs_transfer(mp, x, y, to_map, tx, ty, d, name):
    return mp.add_event(x, y, name, [page(0, 1, None, [cmd(250, [SE_STAIRS]), cmd(201, [0, to_map, tx, ty, d, 0])])])

GATE_SHEET = "!$Tavern_Props_Upper_Gate"

def gate25(mp):
    """the gilded gate across the stairs up (Apartamenty from reputation 80): TavernLife opens it (self switch A);
    closed it stops the way over all five steps, open it lets him through; the doorman's bell on the wall beside it"""
    gx, gy = 92, 16
    tag = comment("<Tavern:gate minrep=80>")
    closed = {"characterName": GATE_SHEET, "characterIndex": 0, "direction": 2, "pattern": 0}
    opened = {"characterName": GATE_SHEET, "characterIndex": 0, "direction": 8, "pattern": 0}
    msg = show_text("Złota krata jest zamknięta. Na górę, do apartamentów, wpuszcza się tylko zacnych gości.")
    eid = mp.add_event(gx, gy, "Złota krata (schody do Apartamentów)",
                       [page(1, 1, closed, tag + [cmd(250, [SE_LOCKED])] + msg),
                        page(0, 0, opened, tag, self_switch="A")], "<Occupy:left=2,right=2>")
    mp.openable = getattr(mp, "openable", set()) | {(x, gy) for x in range(gx - 2, gx + 3)}
    bell = mp.add_event(89, gy, "Dzwonek na odźwiernego",
                        [page(1, 0, {"characterName": PROPS_SHEET, "characterIndex": 2, "direction": 2, "pattern": 0},
                              comment("<Tavern:bell>") + [cmd(250, [{"name": "Bell1", "volume": 70, "pitch": 110, "pan": 0}])]
                              + show_text("Mosiężny dzwonek na odźwiernego. Jego dźwięk niesie się po schodach."), through=True)])
    mp.wall_items.append(("nc", "bell", 89, gy - 1))
    mp.tags.append({"kind": "gate", "minrep": 80, "event": eid, "x": gx, "y": gy, "cells": [[x, gy] for x in range(gx - 2, gx + 3)],
                    "unlock": "self switch A", "bell_event": bell, "bell": [89, gy]})

def stairs25(mp):
    cells, prov = map001_from_above()[:2], map001_from_above()[2]
    land, d = map001_from_above()[0], map001_from_above()[1]
    down = []
    for i, x in enumerate(range(46, 51)):                 # 5 steps wide -> the ground floor's landing cells
        tx, ty = land[min(len(land) - 1, max(0, round((i / 4.0) * (len(land) - 1))))]
        down.append(stairs_transfer(mp, x, 65, 1, tx, ty, d, "Schody -> Tawerna (parter)"))
    up = []
    for x in UP_X:
        up.append(stairs_transfer(mp, x, 6, 26, DOWN26_X[x - UP_X[0]], LAND26[1], LAND26[2], "Schody -> Apartamenty"))
    mp.stairs = {"down": {"events": down, "cells": [[x, 65] for x in range(46, 51)], "target": [list(c) for c in land],
                          "target_dir": d, "provisional": prov},
                 "up": {"events": up, "cells": [[x, 6] for x in UP_X]}}

PICS = [(7, 6, 0), (7, 4, 1), (7, 6, 1), (6, 6, 2), (7, 6, 2), (7, 4, 2), (6, 8, 2), (7, 8, 2), (7, 8, 1)]

def special25(mp):
    S = mp.spaces
    nc, sc, gal, hall = S["nc"], S["sc"], S["gal"], S["hall"]
    # ---------------------------------------------------------------- the corridors
    n_doors = [S[k].door[1] for k in ("r23", "r22", "r21", "r20", "chamber", "r24")]
    dress_corridor(mp, nc, [(x, x) for x in n_doors] + [(46, 50), (88, 95)], n_doors, PICS,
                   windows=[(1, 3), (95, 95)])
    s_doors = [S[k].door[1] for k in ("r7", "r5", "r3", "r1", "r2", "r4", "r6", "r8")]
    dress_corridor(mp, sc, [(x, x) for x in s_doors] + [(43, 53)], s_doors, PICS[3:] + PICS[:3],
                   windows=[(1, 4), (92, 95)])
    # benches along the south walls of both corridors (between the doorways of the rooms behind them)
    benches_along(mp, "nc", nc.y1, nc.x0 + 1, nc.x1 - 1, [9, 22, 30, 41, 55, 64, 74, 94] + list(range(42, 55)))
    benches_along(mp, "sc", sc.y1, sc.x0 + 1, sc.x1 - 1, [2, 15, 37, 59, 81, 94] + list(range(44, 53)))
    # the arches: candelabras either side, on the corridor side
    for x in (45, 51):
        candelabra(mp, "nc", x, 17)
    for x in (45, 51):
        candelabra(mp, "sc", x, 52)
    # the corridor ends: a tall plant against each end wall
    for (x, y) in ((1, 18), (95, 18), (1, 51), (95, 51)):
        plant(mp, "nc" if y < 30 else "sc", x, y, "big")
    # ---------------------------------------------------------------- the Galeria round the well
    for (x, y) in ((44, 27), (52, 27), (44, 40), (52, 40)):
        column(mp, "gal", x, y, "wood")
    chandelier(mp, 48, 34)
    for (x, y) in ((43, 23), (53, 23)):
        plant(mp, "gal", x, y, "vase")
    bench_v(mp, "gal", 43, 31, 4, name="Ława przy balustradzie")
    bench_v(mp, "gal", 53, 31, 4, name="Ława przy balustradzie")
    rug(mp, 45, 42, 51, 45, 38)
    rug(mp, 46, 22, 50, 25, 38)
    # ---------------------------------------------------------------- the stair hall
    y0 = hall.y0
    clock(mp, "hall", 41, y0)
    plant(mp, "hall", 55, y0, "big")
    candelabra(mp, "hall", 44, y0)
    candelabra(mp, "hall", 52, y0)
    painting(mp, "hall", 42, hall, (6, 8, 1), name="Obraz: dolina rzeki")
    painting(mp, "hall", 54, hall, (7, 6, 0), name="Obraz: pejzaż")
    mp.pic_event(43, 61, "!Decoration_static", 6, 2, 1, "Księga gości", priority=1, solid=True,
                 trigger=0, cmds=show_text("Księga gości „Pod Złotym Kuflem”. Ostatni wpis: „Pokój 12 — kupiec z Brodów, trzy noce.”"))
    mp.occupy([(43, 61)], "Księga gości", "hall")
    bench_v(mp, "hall", 40, 59, 3, name="Ława")
    bench_v(mp, "hall", 56, 59, 3, name="Ława")
    rug(mp, 46, 57, 50, 62, 38)
    chandelier(mp, 48, 60)
    lounge25(mp, S["lounge"]); chamber25(mp, S["chamber"]); bath25(mp, S["bath"]); linen25(mp, S["linen"]); maid25(mp, S["maid"])

def lounge25(mp, sp):
    """Salonik gości: the fire in the middle of the panelled wall, bookcases either side, two armchairs and a little
    table with three candles on the rug before the fire, reading tables in the side parts, the chandelier"""
    r, y0 = sp.key, sp.y0
    mp.kind(0, mp.rect(46, y0 - 3, 50, y0 - 1), 71)          # the chimney breast of rough stone in the panelling
    fireplace(mp, r, 48, sp, kind=2, name="Kominek")
    mp.occupy([(48, y0)], "Kominek", r)
    for x in (44, 51): tall_bookcase(mp, r, x, y0)
    for x in (46, 50): firewood(mp, r, x, y0)
    for x in (41, 55): window(mp, r, x, sp, curtain=CURTAIN["red"])
    for x in (39, 57): plant(mp, r, x, y0, "big")
    rug(mp, 45, y0 + 2, 51, y0 + 5, 38)
    chair(mp, r, 46, y0 + 3, 6, arm=True); chair(mp, r, 50, y0 + 3, 4, arm=True)
    round_table(mp, r, 48, y0 + 2)
    candle_on(mp, 48, y0 + 2, "three", name="Świece")
    for tx in (42, 54):
        table_group(mp, r, tx, y0 + 5)
    mp.item(42, y0 + 5, "D", 6, 11, what="otwarta księga"); mp.item(54, y0 + 5, "D", 3, 12, what="kielichy")
    settee(mp, r, 40, y0 + 8); settee(mp, r, 55, y0 + 8)
    for x in (45, 51): candelabra(mp, r, x, sp.y1)
    chandelier(mp, 48, y0 + 7)

def bed_tag(mp, x, y, room, price, name, occupy, minrep=None, label="Łoże do wynajęcia"):
    """TavernLife's bed for the night: an invisible event on the pillow, <Occupy> over the rest of the bed so the
    action button works from the side or the foot"""
    rep = (" minrep=%d" % minrep) if minrep else ""
    tag = '<Tavern:bed room=%s price=%d%s name="%s">' % (room, price, rep, name)
    eid = mp.add_event(x, y, "%s (%s)" % (label, name), [page(1, 0, None, comment(tag))], occupy)
    mp.tags.append({"kind": "bed", "room": room, "price": price, "minrep": minrep, "name": name, "event": eid,
                    "x": x, "y": y, "occupy": occupy})
    return eid

def chamber25(mp, sp):
    """Komnata (to rent, reputation 60): the carved royal bed in the middle of the damask wall, a marble fireplace with
    two armchairs on the left, the vanity and a carved wardrobe on the right, gilded chest, purple rug"""
    r, y0 = sp.key, sp.y0
    bed(mp, r, 67, y0, "royal", name="Łoże")
    bed_tag(mp, 67, y0, "komnata", 30, "Komnata z kominkiem", "<Occupy:right=1,down=1>", minrep=60)
    nightstand(mp, r, 66, y0); nightstand(mp, r, 69, y0)
    candle_on(mp, 66, y0 - 1, "one", rent_room="komnata"); mp.item(69, y0 - 1, "D", 7, 11, what="księga")
    for x in (66, 69): window(mp, r, x, sp, curtain=CURTAIN["violet"])
    fireplace(mp, r, 62, sp, kind=4, name="Kominek")
    mp.occupy([(62, y0)], "Kominek", r)
    vanity(mp, r, 73, y0)
    wardrobe(mp, r, 75, y0, "ornate")
    tall_bookcase(mp, r, 59, y0)
    bench_h(mp, r, 67, y0 + 2, name="Ława w nogach łoża")
    rug(mp, 64, y0 + 2, 71, y0 + 5, 22)
    chair(mp, r, 61, y0 + 3, 8, arm=True); chair(mp, r, 63, y0 + 3, 8, arm=True)
    table_group(mp, r, 73, y0 + 4)
    mp.item(73, y0 + 4, "D", 4, 11, what="wino")
    chest(mp, r, 59, sp.y1 - 1, 3, name="Złoty kufer")
    for x in (61, 74): candelabra(mp, r, x, sp.y1 - 1)
    chandelier(mp, 67, y0 + 5)

def bath25(mp, sp):
    """Łazienka: the door in the middle of the back wall, a washstand under an oval mirror either side of it, two
    wooden tubs behind folding screens, water barrels in the corners, a bath mat down the middle"""
    r, y0 = sp.key, sp.y0
    for x in (5, 13):
        washstand(mp, r, x, y0)
        wall_tile(mp, r, x, y0 - 2, "D", 3, 4, "mirror"); mp.t("D", 3, 5, x, y0 - 1)
    for x in (1, 17): barrel(mp, r, x, y0, "water", name="Beczka z wodą")
    for x in (3, 15): window(mp, r, x, sp, curtain=CURTAIN["white"])
    big_prop(mp, r, 3, y0 + 4, 6, 0, "Balia", w=2)
    big_prop(mp, r, 14, y0 + 4, 6, 0, "Balia", w=2)
    screen(mp, r, 6, y0 + 4, "left"); screen(mp, r, 11, y0 + 4, "right")
    rug(mp, 9, y0 + 1, 9, sp.y1, 37)
    for x in (1, 17): bench_v(mp, r, x, y0 + 5, 2, name="Ława")
    for x in (2, 16):
        mp.t("D", 9, 5, x, y0 + 5); mp.occupy([(x, y0 + 5)], "Wiadro z wodą", r)
    sconce(mp, r, 9 - 2, sp); sconce(mp, r, 9 + 2, sp)

def linen25(mp, sp):
    """Bieliźniarka: two three-part linen cupboards either side of the door, laundry baskets, the maid's cart"""
    r, y0 = sp.key, sp.y0
    for x0 in (19, 23):
        for i in range(3):
            for dy in range(3): mp.t("E", 3 + i, 13 + dy, x0 + i, y0 - 2 + dy)
        mp.occupy([(x0 + i, y0) for i in range(3)], "Szafa na pościel", r)
    prop(mp, r, 22, y0 + 4, (PROPS_SHEET, 1, 2, 1), "Wózek pokojówki")
    for x in (19, 25): mp.t("D", 3, 10, x, sp.y1); mp.occupy([(x, sp.y1)], "Kosz na bieliznę", r)
    big_prop(mp, r, 20, sp.y1 - 1, 6, 0, "Balia do prania", w=2)
    mp.t("D", 10, 4, 24, sp.y1 - 1); mp.occupy([(24, sp.y1 - 1)], "Wiadro", r)

def maid25(mp, sp):
    """Pokój pokojówki: a plain bed and a wardrobe either side of the door, a little table, a chest"""
    r, y0 = sp.key, sp.y0
    nightstand(mp, r, 27, y0); candle_on(mp, 27, y0 - 1, "one")
    bed(mp, r, 28, y0, "straw", name="Łóżko pokojówki")
    wardrobe(mp, r, 32, y0, "plain"); washstand(mp, r, 33, y0)
    for x in (28, 32): window(mp, r, x, sp, curtain=CURTAIN["beige"])
    rug(mp, 29, y0 + 2, 31, y0 + 4, 21)
    table_group(mp, r, 28, sp.y1 - 2, chairs=(False, True))
    mp.item(28, sp.y1 - 2, "D", 2, 11, what="kubek")
    chest(mp, r, 33, sp.y1 - 1, 6)

def write_staged(mp, name):
    path = os.path.join(STAGING, name)
    n = mp.write_to(path)
    print("wrote", path, "events", n)
    return path

# ================================================================================================================ Map026
KINDS26 = {"hall": (72, 86), "serv": (51, 81), "bathlux": (64, 99), "lib": (54, 83), "salon": (63, 80),
           "dining": (52, 80), "terrace": (None, 100)}
SUITES = {   # wall, floor, canopy frame (dir, pattern) on the big sheet, curtain, rug, chest, candles
    "rozany":   {"wall": 55, "floor": 80, "canopy": (4, 0), "curtain": "violet", "rug": 22, "label": "Różany"},
    "blekitny": {"wall": 62, "floor": 83, "canopy": (2, 1), "curtain": "violet", "rug": 28, "label": "Błękitny"},
    "zielony":  {"wall": 72, "floor": 84, "canopy": (2, 2), "curtain": "green", "rug": 30, "label": "Zielony"},
    "zloty":    {"wall": 56, "floor": 80, "canopy": (4, 1), "curtain": "orange", "rug": 29, "label": "Złoty"},
    "lord":     {"wall": 60, "floor": 80, "canopy": (2, 0), "curtain": "red", "rug": 38, "label": "Lorda"},
}
SUITE_MSG = "Zamknięte. Apartament można wynająć u Borgara."
LORD_MSG = "Zamknięte. Apartament zarezerwowany dla gości Lorda Zaleskiego."
BANNER = (PROPS_SHEET, 1, 6, 0)          # the Zaleski banner (red, a gold beast)
CREST = (PROPS_SHEET, 1, 4, 2)           # the Zaleski shield

def fireplace_centered(mp, room, sp, name="Kominek"):
    """the marble fireplace in the middle of the back wall: Winlu's own frame on an odd wall, my half-shifted copy
    (big sheet dir 8) on an even one"""
    c = (sp.x0 + sp.x1) // 2
    if sp.w % 2 == 1:
        return fireplace(mp, room, c, sp, kind=4, name=name)
    mp.pic_event(c, sp.y0, PROPS_BIG, 0, 8, 0, name, priority=1, solid=True, step=True, note=L_FIRE + "<Occupy:right=1>")
    mp.occupy([(c, sp.y0), (c + 1, sp.y0)], name, room)
    mp.wall_items.append((room, "fireplace", c, sp.y0 - 1))

def banner(mp, wall, x, sp, mirror=False, name="Chorągiew Zaleskich"):
    """a hanging banner on the wall face: the event on the face's bottom row, the banner fills the face's lower rows"""
    s, i, d, p = BANNER
    mp.pic_event(x, sp.y0 - 1, s, i, d, 1 if mirror else 0, name, priority=1, through=True)
    mp.wall_items.append((wall, "banner", x, sp.y0 - 2))

def crest(mp, wall, x, sp, name="Herb Zaleskich"):
    s, i, d, p = CREST
    mp.pic_event(x, sp.y0 - 2, s, i, d, p, name, priority=1, through=True)
    mp.wall_items.append((wall, "crest", x, sp.y0 - 3))

def canopy_bed(mp, room, x, y0, frame, name="Łoże z baldachimem"):
    d, p = frame
    mp.pic_event(x, y0 + 1, PROPS_BIG, 0, d, p, name, priority=1, solid=True, note="<Occupy:right=1,up=1>")
    mp.occupy([(x, y0), (x + 1, y0), (x, y0 + 1), (x + 1, y0 + 1)], "Łóżko", room)
    return (x, y0)

def side_opening(mp, x, y, kind, h=1):
    for dy in range(h): mp.floor_at(x, y + dy, kind)

def pilaster(mp, wall, x, sp, variant=(1, 2, 1), name="Pilaster"):
    """a half-column against the wall face (!Fantasy_wandpillar, 48x144): the event on the face's bottom row"""
    i, d, p = variant
    mp.pic_event(x, sp.y0 - 1, "!Fantasy_wandpillar", i, d, p, name, priority=1, through=True)
    mp.wall_items.append((wall, "pilaster", x, sp.y0 - 3))

def statue(mp, room, x, y, variant=(0, 2, 1), name="Posąg"):
    i, d, p = variant
    mp.pic_event(x, y, "!Statue", i, d, p, name, priority=1, solid=True)
    mp.occupy([(x, y)], name, room)

def suite_bedchamber(mp, sp, st, door_side, rent_room=None):
    """a suite's bedchamber (10 wide): the canopy bed in the middle of the back wall, a bedside table each side with
    windows above them and pictures further out, the carved wardrobe and the vanity at the ends; a bench at the foot of
    the bed on a rug; the golden chest under the wardrobe, the guests' luggage under the vanity; a tea table with two
    armchairs in the middle of the lower part, a candelabra in each lower corner"""
    r, x0, x1, y0, y1 = sp.key, sp.x0, sp.x1, sp.y0, sp.y1
    c = x0 + sp.w // 2 - 1                                   # the left of the two middle columns
    pillow = canopy_bed(mp, r, c, y0, st["canopy"])
    nightstand(mp, r, c - 1, y0); nightstand(mp, r, c + 2, y0)
    candle_on(mp, c - 1, y0 - 1, "one", rent_room=rent_room); mp.item(c + 2, y0 - 1, *NS_ITEMS[1], what="na stoliku nocnym")
    for wx in (c - 1, c + 2): window(mp, r, wx, sp, curtain=CURTAIN[st["curtain"]])
    for i, px in enumerate((c - 2, c + 3)):
        painting(mp, r, px, sp, PAINTINGS[(x0 + i * 3) % len(PAINTINGS)])
    wardrobe(mp, r, x0, y0, "ornate")
    vanity(mp, r, x1, y0)
    bench_h(mp, r, c, y0 + 2, name="Ława w nogach łoża")
    rug(mp, c - 1, y0 + 2, c + 2, y0 + 4, st["rug"])
    chest(mp, r, x0, y0 + 2, 3, name="Złoty kufer")
    luggage(mp, r, x1, y0 + 2, 0)
    ty = y1 - 4
    square_table(mp, r, c, ty, "turned")
    mp.item(c, ty, "D", 3, 12, what="kielichy"); mp.item(c + 1, ty, "D", 4, 11, what="wino")
    chair(mp, r, c - 1, ty + 1, 6, arm=True); chair(mp, r, c + 2, ty + 1, 4, arm=True)
    rug(mp, c - 2, ty - 1, c + 3, ty + 2, st["rug"])
    for x in (x0, x1): candelabra(mp, r, x, y1)
    return pillow

def suite_sitting(mp, sp, st, door_x=None):
    """a suite's salonik: the marble fireplace in the middle of the back wall, bookcases either side, two armchairs
    facing the fire across a little table with three candles, the rug, a writing desk, a settee by the door"""
    r, x0, x1, y0, y1 = sp.key, sp.x0, sp.x1, sp.y0, sp.y1
    even = sp.w % 2 == 0
    c = (x0 + x1) // 2
    fireplace_centered(mp, r, sp)
    fl, fr = (c - 2, c + 3) if even else (c - 2, c + 2)       # the bookcases either side of the fire
    for x in (fl, fr):
        if door_x is not None and abs(x - door_x) <= 1: continue
        tall_bookcase(mp, r, x, y0, w=1)
    for x in (x0 + 1, x1 - 1):
        if door_x is not None and abs(x - door_x) <= 1: continue
        painting(mp, r, x, sp, PAINTINGS[(x * 7 + y0) % len(PAINTINGS)])
    # the armchairs facing the fire and the little table between them
    ty = y0 + 3
    if even:
        chair(mp, r, c - 1, ty + 1, 8, arm=True); chair(mp, r, c + 2, ty + 1, 8, arm=True)
        square_table(mp, r, c, ty, "turned")
        candle_on(mp, c, ty, "three")
        rug(mp, c - 2, y0 + 2, c + 3, y0 + 6, st["rug"])
    else:
        chair(mp, r, c - 1, ty + 1, 6, arm=True); chair(mp, r, c + 1, ty + 1, 4, arm=True)
        round_table(mp, r, c, ty)
        candle_on(mp, c, ty, "three")
        rug(mp, c - 2, y0 + 2, c + 2, y0 + 6, st["rug"])
    # the lower part: a writing desk and a settee, mirrored about the middle
    desk(mp, r, x0 + 1, y1 - 3); mp.item(x0 + 1, y1 - 3, "D", 2, 13, what="papier i kałamarz")
    chair(mp, r, x0 + 1, y1 - 1, 8)
    plant(mp, r, x1 - 1, y1 - 2, "big")
    candelabra(mp, r, x0, y1) if door_x != x0 else None

def build26():
    L = layout26()
    mp = UpperMap(26, L, "Apartamenty", NOTE26, seed=2601)
    mp.props["bgm"] = {"name": "Town1", "pan": 0, "pitch": 100, "volume": 45}
    for sp in L["spaces"]:
        if sp.style:
            mp.wall_kind[sp.key], mp.floor_kind[sp.key] = SUITES[sp.style]["wall"], SUITES[sp.style]["floor"]
        else:
            mp.wall_kind[sp.key], mp.floor_kind[sp.key] = KINDS26[sp.key]
    mp.build_shell()
    S = mp.spaces
    hall = S["hall"]
    # ---------------------------------------------------------------- the stairwell in the middle of the hall
    for y in range(24, 30):
        for x in range(38, 43): mp.tile(0, x, y, A5(1, 4))
    for x in range(38, 43): mp.tile(0, x, 30, A5(0, 0))
    for y in range(24, 31):
        mp.t("B", 14, 5 if y == 24 else 6, 37, y); mp.t("B", 12, 5 if y == 24 else 6, 43, y)
    mp.occupy([(37, y) for y in range(24, 31)] + [(43, y) for y in range(24, 31)], "Balustrada schodów", "hall")
    mp.occupy([(x, 30) for x in range(38, 43)], "Ciemność", "hall")
    # ---------------------------------------------------------------- openings between rooms (suites inside)
    for (x, y, k) in ((11, 13, S["s1a"]), (32, 13, S["lorda"]), (69, 13, S["s2a"]), (11, 40, S["s3a"]), (69, 40, S["s4a"]),
                      (8, 26, hall), (72, 26, hall)):
        side_opening(mp, x, y, mp.floor_kind[k.key], h=2)
    # ---------------------------------------------------------------- doors
    msgs = {"lorda": LORD_MSG, "lordb": LORD_MSG, "s4a": "Zamknięte. Apartament Złoty można wynająć u Borgara."}
    for sp in L["spaces"]:
        if not sp.door or sp.door[0] not in ("front", "gap", "gaps") or sp.key == "terrace": continue
        dx = sp.door[1]
        pic = ("!Fantasy_door1", 3, 0) if sp.lock else ("!Fantasy_door1", 0, 0)
        if sp.door[0] == "gaps":                        # the salon and the dining hall: two doors from the gallery
            for ddx in sp.door[1:]:
                mp.door_gap(sp, "hall", ddx, ("!Fantasy_door3", 2, 0), name=sp.label)
            continue
        if sp.key in ("salon", "dining"): pic = ("!Fantasy_door3", 2, 0)

        if sp.door[0] == "front":
            mp.door_front(sp, "hall", dx, pic, lock=sp.lock, lock_msg=msgs.get(sp.key, SUITE_MSG))
        else:
            mp.door_gap(sp, "hall" if sp.key != "terrace" else sp.key, dx, pic, lock=sp.lock, lock_msg=msgs.get(sp.key, SUITE_MSG))
    # the terrace: two open doorways from the salon and the dining hall (gaps in their south walls)
    for x in (30, 50):
        mp.floor_at(x, 47, 100); mp.mat(x, 47)
    # ---------------------------------------------------------------- the hall (Wielka galeria)
    pil = [12, 20, 28, 36, 44, 52, 60, 68]
    for x in pil: pilaster(mp, "hall", x, hall)
    for x in (32, 48): painting(mp, "hall", x, hall, BIG_PAINTINGS[0])
    crest(mp, "hall", 40, hall)
    for x in (16, 24, 32, 48, 56, 64):                     # candle sconces high over the doors and the pictures
        sconce(mp, "hall", x, hall)
    banner(mp, "hall", 38, hall); banner(mp, "hall", 42, hall, mirror=True)
    for x in (10, 70): statue(mp, "hall", x, 21, (0, 2, 1), name="Posąg rycerza")
    for x in (38, 42): candelabra(mp, "hall", x, 21)
    for x in (20, 28, 52, 60): column(mp, "hall", x, 29, "marble")
    rug(mp, 10, 21, 36, 22, 38); rug(mp, 44, 21, 70, 22, 38)
    for x in (24, 56):
        table_group(mp, "hall", x, 28, arm=True)
        mp.item(x, 28, "D", 3, 12, what="kielichy")
    for x in (24, 56): chandelier(mp, x, 26)
    mp.add_event(36, 23, "Miejsce strażnika", [page(0, 0, None, comment("<Guard>") + show_text("Tylko dla gości."))], "")
    mp.tags.append({"kind": "guard", "event": mp.next_id() - 1, "x": 36, "y": 23, "message": "Tylko dla gości."})
    # ---------------------------------------------------------------- suites
    for (bk, ak, side) in (("s1b", "s1a", "right"), ("s2b", "s2a", "left"), ("s3b", "s3a", "right"), ("s4b", "s4a", "left")):
        st = SUITES[S[bk].style]
        pillow = suite_bedchamber(mp, S[bk], st, side, rent_room="zloty" if bk == "s4b" else None)
        if bk == "s4b":
            bed_tag(mp, pillow[0], pillow[1], "zloty", 50, "Apartament Złoty", "<Occupy:right=1,down=1>", minrep=80,
                    label="Łoże do wynajęcia")
        suite_sitting(mp, S[ak], st, door_x={"s3a": 13, "s4a": 67}.get(ak))
    lord26(mp, S["lorda"], S["lordb"])
    library26(mp, S["lib"])
    salon26(mp, S["salon"])
    dining26(mp, S["dining"])
    serv26(mp, S["serv"])
    bath26(mp, S["bathlux"])
    terrace26(mp, S["terrace"])
    down = [stairs_transfer(mp, x, 26, 25, UP_X[x - DOWN26_X[0]], LAND25_FROM_ABOVE[1], LAND25_FROM_ABOVE[2],
                            "Schody -> Pokoje gości") for x in DOWN26_X]
    mp.stairs = {"down": {"events": down, "cells": [[x, 26] for x in DOWN26_X]}}
    return mp

def lord26(mp, salon, bedr):
    st = SUITES["lord"]
    r, y0 = salon.key, salon.y0
    fireplace(mp, r, 40, salon, kind=4, name="Kominek")
    crest(mp, r, 40, salon)
    banner(mp, r, 37, salon); banner(mp, r, 43, salon, mirror=True)
    for x in (35, 45): window(mp, r, x, salon, curtain=CURTAIN["red"])
    for x in (33, 46): tall_bookcase(mp, r, x, y0)
    rug(mp, 36, y0 + 2, 44, y0 + 8, 38)
    chair(mp, r, 38, y0 + 3, 6, arm=True); chair(mp, r, 42, y0 + 3, 4, arm=True)
    round_table(mp, r, 40, y0 + 2); candle_on(mp, 40, y0 + 2, "three")
    long_table(mp, r, 38, y0 + 6, 5, name="Stół Lorda")
    for i, it in enumerate((("D", 6, 13), ("D", 2, 13), None, ("D", 7, 11), ("D", 6, 11))):
        if it: mp.item(38 + i, y0 + 6, *it, what="na stole Lorda")
    candle_on(mp, 40, y0 + 6, "silver")
    for x in (38, 40, 42): chair(mp, r, x, y0 + 5, 2, arm=True)
    for x in (38, 40, 42): chair(mp, r, x, y0 + 8, 8, arm=True)
    for x in (34, 46): candelabra(mp, r, x, salon.y1 - 1)
    chandelier(mp, 40, y0 + 10)
    # the Lord's bedchamber
    r, y0, x0, x1 = bedr.key, bedr.y0, bedr.x0, bedr.x1
    c = x0 + bedr.w // 2 - 1
    canopy_bed(mp, r, c, y0, st["canopy"])
    nightstand(mp, r, c - 1, y0); nightstand(mp, r, c + 2, y0)
    candle_on(mp, c - 1, y0 - 1, "one"); mp.item(c + 2, y0 - 1, "D", 7, 11, what="księga")
    for x in (c - 1, c + 2): window(mp, r, x, bedr, curtain=CURTAIN["red"])
    banner(mp, r, x0 + 1, bedr); banner(mp, r, x1 - 1, bedr, mirror=True)
    vanity(mp, r, x0, y0)
    wardrobe(mp, r, x1, y0, "cabinet")
    bench_h(mp, r, c, y0 + 2, name="Ława w nogach łoża")
    rug(mp, c - 2, y0 + 2, c + 3, y0 + 6, st["rug"])
    chest(mp, r, x0 + 1, bedr.y1 - 1, 3, name="Złoty kufer")
    table_group(mp, r, x1 - 3, bedr.y1 - 3, arm=True); mp.item(x1 - 3, bedr.y1 - 3, "D", 3, 12, what="kielichy")
    candelabra(mp, r, x0, bedr.y1 - 4)

def library26(mp, sp):
    r, x0, x1, y0, y1 = sp.key, sp.x0, sp.x1, sp.y0, sp.y1
    for i, x in enumerate(range(x0, x1 + 1)):                 # the whole back wall is a built-in bookcase
        mp.tile(0, x, y0 - 2, A5(i % 6, 14)); mp.tile(0, x, y0 - 1, A5(i % 6, 15))
    c = (x0 + x1) // 2
    rug(mp, x0 + 2, y0 + 2, x1 - 2, y1 - 3, 21)
    desk(mp, r, c, y0 + 3); mp.item(c, y0 + 3, "D", 6, 11, what="otwarta księga")
    desk(mp, r, c + 1, y0 + 3); mp.item(c + 1, y0 + 3, "D", 2, 13, what="papier i kałamarz")
    chair(mp, r, c, y0 + 5, 8, arm=True); chair(mp, r, c + 1, y0 + 5, 8, arm=True)
    for x in (x0 + 1, x1 - 1):
        table_group(mp, r, x, y1 - 4, chairs=(x != x0 + 1, x == x0 + 1), arm=True)
        mp.item(x, y1 - 4, "D", 7, 11, what="księga")
    mp.pic_event(c, y1 - 1, "!Decoration_static", 6, 2, 1, "Pulpit z księgą", priority=1, solid=True)
    mp.occupy([(c, y1 - 1)], "Pulpit z księgą", r)
    for x in (x0, x1): candelabra(mp, r, x, y0 + 1)
    chandelier(mp, c, y0 + 8)

def salon26(mp, sp):
    """Wielki salon: two doors from the gallery, the marble fireplace between tall bookcases in the middle of the
    wall, armchairs round a low table with candles before the fire on a big rug, a sofa each side, the harp and the
    spinet in the lower corners (the music corner), tables for cards and wine"""
    r, x0, x1, y0, y1 = sp.key, sp.x0, sp.x1, sp.y0, sp.y1
    c = (x0 + x1) // 2                                       # 30
    fireplace(mp, r, c, sp, kind=4, name="Kominek")
    tall_bookcase(mp, r, c - 3, y0); tall_bookcase(mp, r, c + 2, y0)
    for x in (c - 7, c + 7): window(mp, r, x, sp, curtain=CURTAIN["violet"])
    for x in (x0, x1): plant(mp, r, x, y0, "big")
    rug(mp, c - 4, y0 + 2, c + 4, y0 + 7, 38)
    for dx in (-3, 3):
        chair(mp, r, c + dx, y0 + 4, 6 if dx < 0 else 4, arm=True)
    round_table(mp, r, c, y0 + 3)
    candle_on(mp, c, y0 + 3, "three")
    for x in (c - 2, c + 2): chair(mp, r, x, y0 + 6, 8, arm=True)
    settee(mp, r, x0 + 2, y0 + 5); settee(mp, r, x1 - 3, y0 + 5)
    prop(mp, r, x0 + 2, y1 - 1, (PROPS_SHEET, 1, 2, 0), "Harfa")
    big_prop(mp, r, x1 - 3, y1 - 1, 4, 2, "Szpinet", w=2, h=2)
    for x in (c - 4, c + 4):
        table_group(mp, r, x, y1 - 3, arm=True)
        mp.item(x, y1 - 3, "D", 3, 12, what="kielichy")
    for x in (x0, x1): candelabra(mp, r, x, y1 - 5)
    chandelier(mp, c, y0 + 9)

def dining26(mp, sp):
    """Jadalnia: one long table down the middle, twelve chairs and the two heads, silver candelabras and a plate with
    a goblet at every place"""
    r, x0, x1, y0, y1 = sp.key, sp.x0, sp.x1, sp.y0, sp.y1
    c = (x0 + x1) // 2                                       # 50
    top, n = y0 + 2, 7
    for i in range(n):
        row = 4 if i == 0 else 6 if i == n - 1 else 5
        mp.t("C", 8, row, c, top + i)
    mp.occupy([(c, top + i) for i in range(n)], "Stół jadalny", r)
    mp.surface({(c, top + i): TOPS.get(("C", 8, 5), (4, 0, 44, 48)) for i in range(1, n - 1)})
    for i in range(1, n - 1):
        chair(mp, r, c - 1, top + i, 6); chair(mp, r, c + 1, top + i, 4)
        if i in (2, n - 3): candle_on(mp, c, top + i, "silver", name="Srebrny kandelabr")
        else: mp.item(c, top + i, "D", 0, 13 if i % 2 else 14, what="nakrycie")
    chair(mp, r, c, top - 1, 2, arm=True); chair(mp, r, c, top + n, 8, arm=True)
    rug(mp, c - 3, top - 1, c + 3, top + n, 38)
    for x in (c - 8, c + 7):
        mp.t("C", 3, 9, x, y0 - 1); mp.t("C", 4, 9, x + 1, y0 - 1); mp.t("C", 3, 10, x, y0); mp.t("C", 4, 10, x + 1, y0)
        mp.occupy([(x, y0), (x + 1, y0)], "Kredens", r)
    for x in (c - 3, c + 3): window(mp, r, x, sp, curtain=CURTAIN["red"])
    mp.pic_event(c, y0 - 1, PROPS_BIG, 0, 6, 2, "Gobelin z jeleniem", priority=1, through=True)
    mp.wall_items.append((r, "tapestry", c, y0 - 2))
    for x in (x0, x1): plant(mp, r, x, y0, "big")
    for x in (x0 + 1, x1 - 1): candelabra(mp, r, x, y1 - 2)
    chandelier(mp, c, top + 2); chandelier(mp, c, top + 6)

def serv26(mp, sp):
    r, x0, x1, y0, y1 = sp.key, sp.x0, sp.x1, sp.y0, sp.y1
    shelf(mp, r, x0 + 1, y0, "glass"); shelf(mp, r, x0 + 3, y0, "jars"); shelf(mp, r, x0 + 5, y0, "open")
    window(mp, r, x0 + 2, sp, curtain=CURTAIN["beige"]); window(mp, r, x0 + 4, sp, curtain=CURTAIN["beige"])
    long_table(mp, r, x0 + 2, y0 + 3, 3, name="Stół do polerowania sreber")
    mp.item(x0 + 2, y0 + 3, "D", 3, 12, what="kielichy"); mp.item(x0 + 3, y0 + 3, "D", 0, 11, what="talerz"); mp.item(x0 + 4, y0 + 3, "D", 4, 11, what="butelka")
    stool(mp, r, x0 + 3, y0 + 5)
    prop(mp, r, x0 + 1, y1 - 1, (PROPS_SHEET, 1, 2, 1), "Wózek pokojówki")
    mp.t("D", 7, 6, x0 + 5, y1 - 1, z=2); mp.t("D", 7, 7, x0 + 5, y1); mp.occupy([(x0 + 5, y1)], "Miotła", r)
    barrel(mp, r, x0, y0, "water", name="Beczka z wodą")
    # the servant's own corner: a plain bed along the wall, a chest at its foot
    mp.t("C", 8, 11, x0, y1 - 3); mp.t("C", 9, 11, x0 + 1, y1 - 3)
    mp.t("C", 8, 10, x0, y1 - 4, z=3); mp.t("C", 9, 10, x0 + 1, y1 - 4, z=3)
    mp.occupy([(x0, y1 - 3), (x0 + 1, y1 - 3)], "Łóżko służącego", r)
    chest(mp, r, x0 + 2, y1 - 3, 6, name="Skrzynia służącego")

def bath26(mp, sp):
    r, x0, x1, y0, y1 = sp.key, sp.x0, sp.x1, sp.y0, sp.y1
    big_prop(mp, r, x0 + 2, y0 + 3, 6, 1, "Wanna miedziana", w=2)
    screen(mp, r, x0 + 4, y0 + 3, "left")
    vanity(mp, r, x0 + 1, y0)
    washstand(mp, r, x1 - 1, y0)
    wall_tile(mp, r, x1 - 1, y0 - 2, "D", 3, 4, "mirror"); mp.t("D", 3, 5, x1 - 1, y0 - 1)
    window(mp, r, x0 + 3, sp, curtain=CURTAIN["white"])
    rug(mp, x0 + 1, y0 + 5, x1 - 1, y0 + 7, 37)
    barrel(mp, r, x1, y1, "water", name="Beczka z wodą")
    candelabra(mp, r, x0, y1)

def terrace26(mp, sp):
    r, x0, x1, y0, y1 = sp.key, sp.x0, sp.x1, sp.y0, sp.y1
    for x in range(x0, x1 + 1):                              # the balustrade along the edge
        mp.t("B", 12 if x == x0 else 14 if x == x1 else 13, 4, x, y1)
    mp.occupy([(x, y1) for x in range(x0, x1 + 1)], "Balustrada tarasu", r)
    for x in (x0 + 2, x0 + 8, x1 - 8, x1 - 2): plant(mp, r, x, y1 - 1, "big")
    for x in (x0 + 5, 25 + 20):
        table_group(mp, r, x, y0 + 1, arm=True)
    for x in (33, 46): bench_h(mp, r, x, y1 - 1, name="Ława na tarasie")
    for x in (x0 + 9, x1 - 9): candelabra(mp, r, x, y0 + 1)

def finish(mp, name, start, skip_fill=(), min_gain=24):
    """fill lights, blockers, write, check: the common end of both maps"""
    nf = auto_fill(mp, reach=0.8, skip=skip_fill, min_gain=min_gain)
    nb, cells = seal_blockers(mp)
    p = write_staged(mp, name)
    m = json.load(open(p, encoding="utf-8"))
    rep = check_map(mp, m, start, name)
    ev = [e for e in m["events"] if e]
    lights = sum(1 for e in ev if "<Light" in (e.get("note") or ""))
    print("%s: events %d, lights %d (fill %d), blockers %d, reached %d, problems %d" % (name, len(ev), lights, nf, nb, rep["reached"], len(rep["problems"])))
    for line in rep["problems"]: print("   ", line)
    return m, rep

def update_links(m25=None, m26=None):
    L = load_links()
    if m25 is not None:
        mp, st = m25, m25.stairs
        L["map025_stairs_down"] = {"map": 25, "event_ids": st["down"]["events"], "cells": st["down"]["cells"],
                                   "landing": list(LAND25_FROM_BELOW), "landing_from_map001": list(LAND25_FROM_BELOW),
                                   "goes_to_map001": {"cells": st["down"]["target"], "dir": st["down"]["target_dir"],
                                                      "provisional": st["down"]["provisional"],
                                                      "note": "the transfer targets come from links.json map001_from_above when it exists, "
                                                              "else from parter_layout.FROM_ABOVE; rebuild with build_upper.py to refresh"}}
        L["map025_stairs_up"] = {"map": 25, "event_ids": st["up"]["events"], "cells": st["up"]["cells"],
                                 "landing": list(LAND25_FROM_ABOVE), "landing_from_map026": list(LAND25_FROM_ABOVE)}
        L.setdefault("tags", {})["map025"] = mp.tags
    if m26 is not None:
        mp, st = m26, m26.stairs
        L["map026_stairs_down"] = {"map": 26, "event_ids": st["down"]["events"], "cells": st["down"]["cells"],
                                   "landing": list(LAND26), "landing_from_map025": list(LAND26)}
        L.setdefault("tags", {})["map026"] = mp.tags
    L["upper_maps"] = {"25": {"name": "Pokoje gości", "file": "tools/tavern/staging/Map025.json", "parent": 1, "size": [W25, H25]},
                       "26": {"name": "Apartamenty", "file": "tools/tavern/staging/Map026.json", "parent": 1, "size": [W26, H26]},
                       "own_character_sheets": ["img/characters/!Tavern_Props_Upper.png", "img/characters/!$Tavern_Props_Upper_Big.png",
                                                "img/characters/!Tavern_Props_Upper_Doors.png"],
                       "winlu_character_sheets_used": sorted(winlu_sheets_used())}
    with open(LINKS, "wb") as f:
        f.write(json.dumps(L, ensure_ascii=False, indent=1).encode("utf-8"))
    print("links.json updated:", sorted(L.keys()))

def winlu_sheets_used():
    out = set()
    for name in ("Map025.json", "Map026.json"):
        p = os.path.join(STAGING, name)
        if not os.path.exists(p): continue
        m = json.load(open(p, encoding="utf-8"))
        for e in m["events"]:
            if not e: continue
            for pg in e["pages"]:
                n = pg["image"]["characterName"]
                if n and os.path.exists(os.path.join(WINLU_DIR, "characters", n + ".png")): out.add(n)
    return out

if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["plans"]:
        plans()
    elif args[:1] == ["docs"]:
        docs_static()
    else:
        todo = args or ["25", "26"]
        m25 = m26 = None
        if "25" in todo or "struct" in todo:
            m25 = build25(); finish(m25, "Map025.json", (48, 62), skip_fill=("linen",))
        if "26" in todo:
            m26 = build26(); finish(m26, "Map026.json", (40, 23), min_gain=12)
        update_links(m25, m26)
