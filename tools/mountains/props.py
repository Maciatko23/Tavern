# The things standing on the mountain maps as events (pictures of tools/mountains/art.py and of the Winlu sets), shared by
# gory.py (Map013), jaskinia.py (Map014) and osada.py (Map120). Messages that are not talk are popups over the hero
# (Tawerna.popup - the user's rule for "you need..." and plain remarks).
import json
from mtlib import blank_page, ring   # noqa: F401

PROPS = "!Mt_Props"
OSADA_LAND = (20, 31)          # where one comes into Osada Milczących from the ravine (osada.py: the south edge's middle - 1 row)
LANTERN_WALL = ("!Decoration", 7, 4, 0)      # a lantern on an iron bracket (fire inside, flickers)
LANTERN_LIGHT = "<Light:140,255,180,100><LightFlicker:0.08><LightHeight:50>"
CAMPFIRE = ("!Decoration", 2, 4, 0)          # stones round a burning fire (step animation)
CAMPFIRE_OUT = ("!Decoration", 1, 4, 0)      # the same, cold: ash and black logs
CAMPFIRE_LIGHT = "<Light:190,255,150,70><LightFlicker:0.18,255,110,40><LightHeight:20>"
BRAZIER = ("!Decoration", 0, 2, 0)
BRAZIER_LIGHT = "<Light:170,255,150,70><LightFlicker:0.16,255,110,40><LightHeight:26>"


def cmd(code, params, indent=0):
    return {"code": code, "indent": indent, "parameters": params}


def script(text):
    lines = text.split("\n")
    return [cmd(355, [lines[0]])] + [cmd(655, [l]) for l in lines[1:]]


def popup(text):
    return script("Tawerna.popup(%s);" % json.dumps(text, ensure_ascii=False))


def se(name, vol=80, pitch=100):
    return cmd(250, [{"name": name, "volume": vol, "pitch": pitch, "pan": 0}])


def page(image=None, priority=0, trigger=0, through=False, cmds=None, step=False, cond=None, direction_fix=True):
    p = blank_page(priority=priority, trigger=trigger, image=image, through=through, cmds=cmds, step=step, direction_fix=direction_fix)
    if cond: p["conditions"].update(cond)
    return p


def img(char, index=0, direction=2, pattern=0):
    return {"characterName": char, "characterIndex": index, "direction": direction, "pattern": pattern}


def sw(switch_id):
    return {"switch1Valid": True, "switch1Id": switch_id}


# ------------------------------------------------------------------------------------------------ Map013 (and the others)
def lantern_wall(mp, x, y, name="Latarnia"):
    """a lantern on a bracket (on a rock face or a wall): a flame, lit day and night"""
    mp.ev(x, y, *LANTERN_WALL, name=name, priority=0, through=True, step=True, note=LANTERN_LIGHT)


def lantern_post(mp, x, y, name="Latarnia"):
    lantern_wall(mp, x, y, name)


def campfire(mp, x, y, name="Ognisko", lit=True):
    art = CAMPFIRE if lit else CAMPFIRE_OUT
    mp.ev(x, y, *art, name=name, priority=1, through=False, step=lit, note=CAMPFIRE_LIGHT if lit else "")


def old_fire_ring(mp, x, y):
    """the quarrymen's old fire ring: cold ash in a ring of stones (a place to camp - the hero's own fire goes beside it)"""
    mp.ev(x, y, *CAMPFIRE_OUT, name="Stare palenisko kamieniarzy", priority=1, through=False,
          cmds=popup("Stare palenisko. Popiół dawno zimny - ktoś tu kiedyś nocował."))


def raven_carving(mp, x, y, name):
    """the order's raven cut in the quarry wall: a decal on the two face cells (x, y-1)-(x, y), looked at from below"""
    mp.ev(x, y, PROPS, 1, 2, 0, name=name, priority=1, through=False,
          cmds=popup("Kruk wykuty w skale, w kręgu. Ten sam znak co na kamieniach twierdzy."))


def crane_ruin(mp, x, y):
    """the ruin of the quarry's crane (3 x 4 cells of picture, its foot blocks 2 cells)"""
    mp.ev(x, y, "!$Mt_Crane", 0, 2, 0, name="Ruina dźwigu", priority=1, through=False, note="<Occupy:right=1>",
          cmds=popup("Stary dźwig kamieniarzy. Drewno spróchniałe, lina przetarta."), cells=[(x + 1, y)])
    mp.solid.add((x + 1, y))


BLOCK = {   # kind -> (sheet, index, direction, pattern): the PixelLab blocks (!$Mt_Blocks) when they are there, else the drawn ones
    "kruk": ("!$Mt_Blocks", 0, 2, 0), "kruk2": ("!$Mt_Blocks", 0, 2, 1), "plain": ("!$Mt_Blocks", 0, 4, 1),
    "split": ("!$Mt_Blocks", 0, 4, 0), "half": ("!$Mt_Blocks", 0, 4, 1), "pair": ("!$Mt_Blocks", 0, 2, 1)}
BLOCK_DRAWN = {"plain": (0, 2, 0), "kruk": (0, 2, 1), "kruk2": (0, 4, 0), "half": (0, 2, 2), "pair": (0, 4, 0), "split": (0, 4, 1)}
BLOCK_TEXT = {"kruk": "Ciosane bloki. Na boku jednego wyryty mały kruk - znak kamieniarzy zakonu.",
              "kruk2": "Ciosane bloki, a na jednym kruk. Takie same kamienie są w murach twierdzy.",
              "pair": "Ciosane bloki, a na jednym kruk. Takie same kamienie są w murach twierdzy.",
              "plain": "Ciosany blok wapienia. Nikt go już nie zabierze.",
              "half": "Blok do połowy w ziemi.", "split": "Blok rozłupany klinami. Kliny zostały w szczelinie."}


def stone_block(mp, x, y, kind):
    if have("!$Mt_Blocks"):
        char, idx, d, p = BLOCK[kind]
    else:
        char, (idx, d, p) = PROPS, BLOCK_DRAWN[kind]
    raven = kind in ("kruk", "kruk2", "pair")
    mp.ev(x, y, char, idx, d, p, name="Ciosane bloki z krukiem" if raven else "Ciosany blok", priority=1, through=False,
          cmds=popup(BLOCK_TEXT[kind]))


def dry_pond(mp, cx, cy):
    """the quarry's pond, dry: reeds round it, a fish's bones on the cracked mud; no water (the drought)"""
    mp.ev(cx - 2, cy, PROPS, 2, 2, 0, name="Suche trzciny", priority=0, through=True)
    mp.ev(cx + 2, cy - 1, PROPS, 2, 2, 2, name="Suche łodygi", priority=0, through=True)
    mp.ev(cx, cy, PROPS, 2, 2, 1, name="Suchy staw w kamieniołomie", priority=0, through=True, trigger=0,
          cmds=popup("Suchy staw. Spękany muł i ości - woda zeszła stąd dawno."))


def broken_cart(mp, x, y):
    """a broken cart of the diggers left before the cave (Outside C sheet tiles, 2 x 2, the lower row blocks)"""
    from mtlib import C
    for dx in (0, 1):
        for dy in (0, 1):
            mp.tile(3 if dy == 0 else 2, x + dx, y + dy, C(10 + dx, 6 + dy))
    mp.blocker(x, y + 1, x + 1, y + 1, "Porzucony wózek")


def switch_transfer(mp, x, y, to_map, tx, ty, d, switch_id, name):
    """an edge exit that works only with the switch on (page 1: nothing; page 2: a touch transfer)"""
    e = {"name": name, "note": "", "pages": [
        page(priority=0, through=True),
        page(priority=0, trigger=1, cond=sw(switch_id), cmds=[cmd(201, [0, to_map, tx, ty, d, 0])])]}
    mp.add(x, y, e)
    mp.region[(x, y)] = 7
    return e


def osada_gate(mp, x, y, switch_id):
    """the gate of the Silent across the ravine (3 cells: x-1..x+1): closed (blocks) until the switch, then open; a cairn of
    silence beside it"""
    closed = img("!$Mt_Gate", 0, 2, 0) if have("!$Mt_Gate") else img("!$Gate_Wood1", 0, 2, 0)
    opened = img("!$Mt_Gate", 0, 4, 0) if have("!$Mt_Gate") else img("!$Gate_Wood1", 0, 8, 1)
    e = {"name": "Brama Milczących", "note": "<Occupy:left=1,right=1>", "pages": [
        page(image=closed, priority=1, trigger=0, cmds=popup("Brama z pali, zamknięta od środka. Ani głosu po drugiej stronie.")),
        page(image=opened, priority=0, through=True, cond=sw(switch_id))]}
    mp.add(x, y, e, [(x - 1, y), (x + 1, y)])
    for c in ((x - 1, y), (x, y), (x + 1, y)): mp.solid.add(c)


# ------------------------------------------------------------------------------------------------ pictures that may not exist yet
import os as _os
_CHARS = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "..", "img", "characters")


def have(sheet):
    return _os.path.exists(_os.path.join(_CHARS, sheet + ".png"))


CAVE_LAND = (20, 27)           # where one comes into the cave (Map014) from the mountains, facing up (jaskinia.py)


def cave_mouth(mp, x, y):
    """the mouth of the diggers' cave in the mountain's face (the face's lowest row): touched from below -> Map014"""
    go = [se("Move1", 70, 80), cmd(201, [0, 14, CAVE_LAND[0], CAVE_LAND[1], 8, 0])]
    if have("!$Mt_Cave"):
        mp.ev(x, y, "!$Mt_Cave", 0, 2, 0, name="Wejście do jaskini", priority=1, through=False, trigger=1, cmds=go)
    else:
        from mtlib import D
        mp.tile(2, x, y - 1, D(8, 3)); mp.tile(2, x, y, D(8, 4))
        mp.ev(x, y, "", name="Wejście do jaskini", priority=1, through=False, trigger=1, cmds=go)


def carving(mp, x, y, pattern, name):
    """a decal cut in a cliff face (index 1 of the props: the raven, masons' marks, seven notches)"""
    text = {0: "Kruk wykuty w skale.", 1: "Znaki kamieniarzy: krzyżyki, strzałki, cyfry. Ktoś liczył bloki.",
            2: "Siedem równych nacięć w skale, jedno pod drugim."}[pattern]
    mp.ev(x, y, PROPS, 1, 2, pattern, name=name, priority=1, through=False, cmds=popup(text))


SILENT_TEXT = {0: "Kopczyk z płaskich kamieni, owinięty białym pasem płótna.",
               1: "Słup z wyciętą twarzą. Usta zaszyte nacięciami, na szyi biały pas.",
               2: "Kamień z kredowymi kreskami. Ktoś liczy dni - albo lata."}


def silent(mp, x, y, pattern):
    """a sign of the Silent (index 5 of the props): a cairn with a white strip | a post with a sewn mouth | a stone with chalk"""
    mp.ev(x, y, PROPS, 5, 2, pattern, name={0: "Kopczyk milczenia", 1: "Słup z zaszytymi ustami", 2: "Kamień z kreskami"}[pattern],
          priority=1, through=False, cmds=popup(SILENT_TEXT[pattern]))


def dry_stalks(mp, x, y):
    mp.ev(x, y, PROPS, 2, 2, 2, name="Uschnięte łodygi", priority=0, through=True)
