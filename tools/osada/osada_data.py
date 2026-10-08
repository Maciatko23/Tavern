# The four huts of Osada Milczących (Map120) and their interiors (Map121-124) - what both sides need:
#   - HUTS: which door on Map120 leads where, the cell in front of it (one comes out there, facing down), the interior's
#     landing (LANDINGS: the floor cell above the doorway, facing up);
#   - RESIDENTS: the four Silent - their figure, their name outside (Map120, osada.py) and inside (their hut), the hours they
#     are OUTSIDE (else they are at home), what one sees when one presses the action button by them;
#   - the hour script: a parallel event "Milczący: pora dnia" on Map120 and in every hut sets self switch A of each resident
#     event = "at home now" (Map120: page 2 = gone; the hut: page 2 = there), once a second; nothing else in the game reads it.
# Used by tools/mountains/osada.py (Map120) and tools/osada/huts.py (the interiors). Writes nothing.
import json

MAP_OSADA = 120

# map id -> (key, the hut's name, the door event on Map120 (name), the door cell, the cell in front of it)
HUTS = {
    121: ("wspolna", "Wspólna izba", "Drzwi chaty 1", (8, 16), (8, 17)),
    122: ("tkaczka", "Chata tkaczki", "Drzwi chaty 2", (29, 14), (29, 15)),
    123: ("starszy", "Chata Najstarszego", "Drzwi chaty 3", (29, 25), (29, 26)),
    124: ("rzezbiarz", "Chata rzeźbiarza", "Drzwi chaty 4", (8, 25), (8, 26)),
}
HUT_OF_DOOR = {v[2]: k for k, v in HUTS.items()}
SIDE_DOOR_TEXT = "Boczne drzwi komórki, zaparte kołkiem od środka."     # hut 3's second door (the lean-to): stays shut

# key -> (sheet, name outside (Map120), name inside, home map, hours OUTSIDE [[from, to), ...], what one sees inside)
RESIDENTS = {
    "rzezbiarz": ("$Npc_Milczacy1", "Milczący przy ścianie", "Milczący rzeźbiarz", 124, [[6, 12]],
                  ["Milczy. Odkłada dłuto i pokazuje ci deskę: krąg, a w nim kruk.",
                   "Potem dotyka palcem białego płótna na ustach - i wraca do pracy."]),
    "tkaczka": ("$Npc_Milczaca2", "Milcząca przy ścianie", "Milcząca tkaczka", 122, [[14, 19]],
                ["Milczy. Czółenko chodzi tam i z powrotem, ani na chwilę nie staje.",
                 "Wskazuje ci stojak z białymi pasami i kręci głową: jeszcze nie twój."]),
    "starszy": ("$Npc_Milczacy3", "Najstarszy z Milczących", "Najstarszy z Milczących", 123, [[6, 21]],
                ["Milczy. Kładzie przed tobą biały kamyk... i zabiera go z powrotem.",
                 "Jakby jeszcze nie był czas."]),
    "ogrodniczka": ("$Npc_Milczaca4", "Milcząca przy grządce", "Milcząca ogrodniczka", 121, [[6, 10], [16, 20]],
                    ["Milczy. Przesypuje nasiona z dłoni do dłoni i podaje ci jedno.",
                     "Suche jak pieprz. Po chwili ostrożnie zabiera je z powrotem."]),
}
SCHEDULE_EVENT = "Milczący: pora dnia"


def cmd(code, params, indent=0):
    return {"code": code, "indent": indent, "parameters": params}


def script(text, indent=0):
    lines = text.split("\n")
    return [cmd(355, [lines[0]], indent)] + [cmd(655, [l], indent) for l in lines[1:]]


def popups(lines):
    """one or more popups over the hero at once (Tawerna.popup; a second line stacks under the first) - one line each,
    the popup does not wrap: keep a line under ~80 characters"""
    if isinstance(lines, str): lines = [lines]
    for l in lines: assert len(l) <= 86, ("popup line too long", len(l), l)
    return script("\n".join("Tawerna.popup(%s);" % json.dumps(l, ensure_ascii=False) for l in lines))


def note_once(title, text, lines):
    """the first look: the popups and a journal note (Journal.addNote, if there); self switch B marks it read"""
    return popups(lines) + script("if (window.Journal && Journal.addNote) Journal.addNote(%s, %s);" % (
        json.dumps(title, ensure_ascii=False), json.dumps(text, ensure_ascii=False))) + [cmd(123, ["B", 0])]


def hours_table(map_id):
    """event name -> hours outside, for the residents whose events stand on this map"""
    out = {}
    for key, (sheet, out_name, in_name, home, hours, _) in RESIDENTS.items():
        if map_id == MAP_OSADA: out[out_name] = hours
        elif map_id == home: out[in_name] = hours
    return out


def schedule_list(map_id):
    """the parallel event's commands: A = at home now (the hour outside the resident's hours), set only when it changes;
    then a second's wait (the parallel event runs again)"""
    table = json.dumps(hours_table(map_id), ensure_ascii=False, separators=(",", ":"))
    js = ("const h = Math.floor($gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 12) % 24, T = TABLE;\n"
          "for (const ev of $gameMap.events()) { const r = T[ev.event().name]; if (!r) continue;\n"
          "  const home = !r.some(p => h >= p[0] && h < p[1]), k = [$gameMap.mapId(), ev.eventId(), \"A\"];\n"
          "  if ($gameSelfSwitches.value(k) !== home) $gameSelfSwitches.setValue(k, home); }").replace("TABLE", table)
    return script(js) + [cmd(230, [60])]


def schedule_event(blank_page):
    """the invisible parallel event (blank_page from nslib/mtlib: the page maker)"""
    p = blank_page(priority=0, trigger=4, through=True)
    return {"name": SCHEDULE_EVENT, "note": "", "pages": [p]}


# the door's commands on Map120 (as tools/interiors/install.py gives the town's doors, always open): Door1, the door picture
# swings open (it turns through directions 4, 6, 8), Transfer into the hut (fade black, facing up)
OPEN_ROUTE = [{"code": 36, "indent": None}, {"code": 17, "indent": None}, {"code": 15, "indent": None, "parameters": [3]},
              {"code": 18, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}, {"code": 19, "indent": None},
              {"code": 15, "indent": None, "parameters": [3]}]
DOOR_SE = {"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}


def door_list(mid, lx, ly):
    go = [cmd(250, [dict(DOOR_SE)]),
          cmd(205, [0, {"list": OPEN_ROUTE + [{"code": 0}], "repeat": False, "skippable": False, "wait": True}])]
    go += [cmd(505, [c]) for c in OPEN_ROUTE]
    go.append(cmd(201, [0, mid, lx, ly, 8, 0]))
    return go + [cmd(0, [])]


# the landing of each interior = the floor cell right above its doorway (huts.py builds them so and checks it)
LANDINGS = {121: (7, 9), 122: (6, 8), 123: (7, 9), 124: (6, 8)}
