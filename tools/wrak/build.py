# python tools/wrak/build.py   -> tools/miejsca_wyspy/staging_E/data/Map165.json, Map166.json (+ *_meta.json)
#                                  docs/miejsca_wyspy/wrak/rzut_165_*.png, rzut_166.png (rysunki kontrolne)
# PAKIET E (docs/miejsca_wyspy/PAKIETY.md, koncepcja: docs/miejsca_wyspy/KONCEPCJA.md punkt 7): Wrak na mieliźnie i pod pokładem.
#
# Map165 „Wrak na mieliźnie” (40x30, tileset 11 jak przystań, <Clouds:on><Farm:off><Water:salt>):
#   - morze: A1 rodzaj 10 (woda przy piaszczystym brzegu), głębia A1 1 na warstwie 1 dalej od piachu
#   - łacha: piach A2 24; rdzeń wyspy nigdy nie tonie; pierścienie pływu w regionach (Wrak.js czyta je z WrakData.FLOOD):
#       63 - zalewa od poziomu 0.75 (tylko w największym przypływie), 62 - od 0.45, 61 - poza odpływem (przełącznik 20);
#     w regionie 61 jest też łacha do garnizonu: pola (39, 20-21) -> Map162 (1, 20-21), lądowanie stamtąd (38, 20-21)
#     (kontrakt WyspaData.LINKS). Mokry piach (A2 36) na pierścieniach 61/62.
#   - kadłub „Białej Źrenicy” przełamany na pół (PixelLab, tools/wrak/art): dziób (11,14), rufa (17,15) z dziurą w burcie
#     na (17,15) = przejście pod pokład (Map166); pola kadłubów zamknięte niewidzialnymi blokadami
#   - podarta bandera z białym okiem, skrzynie z ładunku, złamany maszt, kamienie na cyplu
#   - znaczniki „Miejsce: wrak_*” dla zdarzeń wstawianych w kodzie (Wrak.js, numery 670-679): łódź Janka i Janek (przybicie
#     (35,18) z kontraktu), łódź ratownicza i dwaj żołnierze garnizonu (9-15)
# Map166 „Wrak - pod pokładem” (22x13, tileset 8 jak wnętrza przystani): ładownia (dolna część w regionach 64/65 - woda
#   w przypływie), szkielet bosmana z kluczem, kajuta kapitana za zamkniętymi drzwiami (biurko z tubą i dziennikiem,
#   skrzynia z monetami i kamieniami z krukiem), smugi dnia przez szczeliny w pokładzie (nie ogień: <LightCone> dnia)
#   Wyjście: dziura w dole (4,12) -> Map165 (17,16) w dół; wejście z Map165 ląduje na (4,11) w górę.
# Nigdy nie pisze do data/ (instaluje koordynator). Kontrola przejść: mtlib.reach przy odpływie i w przypływie.
import os, sys, json, copy, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/miejsca_wyspy")
from szkic_lib import Szkic, SEA_SAND, DEEP, PEBBLES, B, C, D   # noqa: E402
import szkic_lib as SL                                          # noqa: E402
import plib                                                     # noqa: E402
from plib import popup_cmds                                     # noqa: E402
import nslib                                                    # noqa: E402
from nslib import blank_page, noise, write_map                  # noqa: E402
import mtlib                                                    # noqa: E402

E_ROOT = ROOT
E_STAGING = ROOT + "tools/miejsca_wyspy/staging_E/data/"
E_META = ROOT + "tools/miejsca_wyspy/staging_E/meta/"
E_DOCS = ROOT + "docs/miejsca_wyspy/wrak/"
# (the star imports of the interiors' tools below bring their own ROOT / STAGING / DOCS - ours have E_ names)
W, H = 40, 30
NOTE165 = "<Clouds:on>\n<Farm:off>\n<Water:salt>"
SAND, WET = 24, 36
R_LOW, R_MID, R_HIGH = 61, 62, 63           # pierścienie pływu (Wrak.js / WrakData.FLOOD)
BOW, STERN, BREACH = (11, 14), (17, 15), (17, 15)
EDGE = [(39, 20), (39, 21)]
GARRISON = 162
UNDER, UNDER_EXIT, UNDER_LAND = 166, (4, 12), (4, 11)
MARKERS = {   # znaczniki zdarzeń z kodu (x, y, kierunek)
    "wrak_lodz": (35, 17, 4), "wrak_janek": (36, 18, 4), "wrak_przybicie": (35, 18, 2),
    "wrak_lodz_ratownicza": (23, 26, 4), "wrak_zolnierz_1": (21, 18, 8), "wrak_zolnierz_2": (25, 18, 4),
}


def ellipse(cx, cy, rx, ry, seed, rough=0.18):
    out = set()
    for y in range(H):
        for x in range(W):
            a = math.atan2(y + 0.5 - cy, x + 0.5 - cx)
            k = 1 + rough * (nslib.lowfreq(int(20 + 6 * math.cos(a)), int(20 + 6 * math.sin(a)), seed, 2.0) - 0.5) * 2
            if ((x + 0.5 - cx) / (rx * k)) ** 2 + ((y + 0.5 - cy) / (ry * k)) ** 2 <= 1: out.add((x, y))
    return out


def rect(x0, y0, x1, y1):
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if 0 <= x < W and 0 <= y < H}


def ev_page(cmds=None, priority=0, trigger=0, through=True, image=None, cond=None):
    pg = blank_page(priority=priority, trigger=trigger, through=through, cmds=cmds, image=image, direction_fix=True)
    if cond: pg["conditions"].update(cond)
    return pg


def script(js):
    return {"code": 355, "indent": 0, "parameters": [js]}


# ================================================================================================ Map165
def zones():
    core = (rect(9, 12, 20, 16) | ellipse(18.5, 16.5, 9.5, 3.2, 12) | ellipse(26.0, 17.5, 4.0, 2.0, 13) | ellipse(8.0, 15.5, 2.0, 1.6, 14)
            | rect(28, 18, 36, 19))
    high = (ellipse(18.5, 16.8, 11.0, 4.2, 21) | ellipse(27.0, 18.0, 5.5, 2.6, 22) | rect(30, 17, 36, 20)) - core
    mid = (ellipse(18.5, 17.2, 12.5, 5.2, 31) | ellipse(29.0, 18.5, 7.0, 3.2, 32)) - core - high
    low = ellipse(18.5, 17.6, 14.0, 6.2, 41) - core - high - mid
    bar = set()
    for x in range(30, W):
        cy = 19.4 + (x - 30) * 0.14
        for y in range(H):
            if abs(y + 0.5 - cy - 0.5) <= 1.35 + 0.35 * (noise(x, y, 5) - 0.5): bar.add((x, y))
    bar |= {(38, 20), (38, 21), (39, 20), (39, 21), (37, 20), (37, 21)}
    low |= bar - core - high - mid
    # behind the hulls (rows <= 11, x 5..22) stays sea at every tide (nobody walks unseen behind the wreck); Janek's boat's water
    behind = rect(5, 0, 22, 11)
    boat = rect(33, 15, 37, 17)
    for s in (high, mid, low):
        s -= behind
        s -= boat
    core -= boat
    return core, high, mid, low


def build165():
    mp = Szkic(165, W, H, "Wrak na mieliźnie", NOTE165, seed=165)
    core, high, mid, low = zones()
    land = core | high | mid | low
    sea = mp.all - land
    mp.sea(sea, SEA_SAND)
    # the deep water: 3+ cells from any sand
    deep = {(x, y) for (x, y) in sea if all((x + dx, y + dy) not in land for dx in range(-3, 4) for dy in range(-3, 4))}
    mp.deep(deep)
    mp.kind(0, land, SAND)
    for c in land: mp.solid.discard(c)
    # wet sand on the rings the tide covers most of the time, pebbles here and there on the dry core
    for (x, y) in core:
        v = noise(x, y, 47)
        if v > 0.93 or v < 0.04: mp.layers[1][(x, y)] = ("k", PEBBLES)
        elif nslib.lowfreq(x, y, 77, 2.5) > 0.74: mp.layers[1][(x, y)] = ("k", 39)     # (lighter, dry sand in patches)
    for (x, y), r in [(c, R_HIGH) for c in high] + [(c, R_MID) for c in mid] + [(c, R_LOW) for c in low]:
        mp.region[(x, y)] = r
    mp.zones = {"core": sorted(core), "high": sorted(high), "mid": sorted(mid), "low": sorted(low)}

    # ---- the wreck: two halves of the hull (pictures, through - the blockers close the hull's cells)
    BOW_POP = "Dziób „Białej Źrenicy”. Okręt Czarnych Oczu pękł na mieliźnie na pół. Na burcie zdrapane białe oko."
    STERN_POP = "Rufa „Białej Źrenicy”. Wysoki kasztel, wybite okna kajuty. Nisko w burcie czarna dziura."
    mp.picture(BOW[0], BOW[1], "!$Wrak_Dziob", 0, 2, 0, name="Wrak: dziób", priority=1, through=True, cmds=popup_cmds(BOW_POP),
               note="<Wrak:dziob>")
    mp.picture(STERN[0], STERN[1], "!$Wrak_Rufa", 0, 2, 0, name="Wrak: rufa", priority=1, through=True, cmds=popup_cmds(STERN_POP),
               note="<Wrak:rufa>")
    hull = rect(9, 12, 13, 14) | rect(14, 12, 14, 14) | rect(15, 12, 19, 15)
    hull.discard(BREACH)
    for (x, y) in sorted(hull):
        e = {"name": "Blokada: kadłub", "note": "", "pages": [blank_page(priority=1)]}
        mp.add(x, y, e)
        mp.solid.add((x, y))
    # the breach: walking up into it -> under the deck
    cmds = [{"code": 250, "indent": 0, "parameters": [{"name": "Door5", "volume": 70, "pitch": 80, "pan": 0}]},
            {"code": 201, "indent": 0, "parameters": [0, UNDER, UNDER_LAND[0], UNDER_LAND[1], 8, 0]}]
    mp.add(BREACH[0], BREACH[1], {"name": "Dziura w burcie -> Pod pokładem", "note": "<Wrak:dziura>",
                                  "pages": [ev_page(cmds, priority=0, trigger=1, through=True)]})

    # ---- the torn ensign of the Black Eyes, stuck in the sand by the bow
    mp.picture(7, 15, "!$Wrak_Bandera", 0, 2, 0, name="Podarta bandera", priority=1,
               cmds=popup_cmds("Podarta bandera: białe otwarte oko na czerni. Znak Straży Pewności - Czarnych Oczu."))
    mp.solid.add((7, 15))
    # ---- the cargo the garrison's soldiers carry off: crates and barrels by the stern, a torn sack, a coil of rope
    for (n, x, y) in [("crate", 21, 16), ("crate_b", 22, 16), ("barrel_open", 24, 15), ("crate_open", 23, 15), ("sack_torn", 24, 17),
                      ("rope", 20, 17)]:
        mp.thing(n, x, y)
        mp.solid.add((x, y))
    mp.add(22, 17, {"name": "Skrzynie z ładunku", "note": "", "pages": [ev_page(popup_cmds(
        "Skrzynie z wypalonym okiem. Puste - ktoś je już wybrał. Na wiekach odciski żołnierskich butów."), priority=0, through=True)]})
    # ---- the broken mast lying on the sand (a raven sits on it at dawn)
    mp.picture(26, 17, "!$Logs_Big", 0, 2, 0, name="Złamany maszt", priority=1,
               cmds=popup_cmds("Złamany maszt. Na drzewcu świeże ślady pazurów - kruk siada tu co rano."))
    mp.solid |= {(26, 17), (27, 17)}
    mp.add(27, 17, {"name": "Blokada: maszt", "note": "", "pages": [blank_page(priority=1)]})
    # (no rock tiles: the D sheet's clumps are green moss, wrong on wet sand)
    mp.picture(13, 19, "!$Trunk_Dead", 0, 2, 0, name="Reja w piachu", priority=1,
               cmds=popup_cmds("Złamana reja, do połowy w piachu. Lina wciąż owinięta wokół drzewca."))
    mp.solid.add((13, 19))
    mp.add(12, 17, {"name": "Kości w piachu", "note": "", "pages": [ev_page(popup_cmds(
        "Kości w piachu. Ktoś z załogi nie dopłynął nawet do łachy."), priority=0, through=True)]})

    # ---- the way to the garrison over the sandbar (only at low water; the place behind built: Wyspa.isReady(162))
    for (x, y) in EDGE:
        ty = y
        land_cmds = [{"code": 111, "indent": 0, "parameters": [12, "Wyspa.isReady(%d)" % GARRISON]},
                     {"code": 250, "indent": 1, "parameters": [{"name": "Move1", "volume": 60, "pitch": 90, "pan": 0}]},
                     {"code": 201, "indent": 1, "parameters": [0, GARRISON, 1, ty, 6, 0]},
                     {"code": 0, "indent": 1, "parameters": []},
                     {"code": 411, "indent": 0, "parameters": []},
                     script("Tawerna.popup(\"Dalej łacha ginie w mule. Tędy nie przejdziesz.\", { color: \"info\" });"),
                     {"code": 0, "indent": 1, "parameters": []},
                     {"code": 412, "indent": 0, "parameters": []}]
        # (fix: the else branch's script sits at indent 1)
        land_cmds[5]["indent"] = 1
        pg1 = ev_page(popup_cmds("Łacha pod wodą."), priority=0, trigger=1, through=True)
        pg2 = ev_page(land_cmds, priority=0, trigger=1, through=True, cond={"switch1Valid": True, "switch1Id": 20})
        mp.add(x, y, {"name": "Przejście -> Garnizon (łacha w odpływie)", "note": "<Wyspa:wrak_garnizon>", "pages": [pg1, pg2]})
        mp.exits.append({"x": x, "y": y, "to": [GARRISON, 1, ty, 6]})

    # ---- the markers of the events put in by the code (Wrak.js)
    for k, (x, y, d) in MARKERS.items():
        mp.spot(k, x, y, d)
    return mp


def stage165(mp):
    data = mp.resolve()
    events = mp.build_events()
    props = dict(mp.props)
    props["bgs"] = {"name": "Sea", "pan": 0, "pitch": 100, "volume": 40}
    props["bgm"] = {"name": "", "pan": 0, "pitch": 100, "volume": 90}
    props["autoplayBgm"] = False
    os.makedirs(E_STAGING, exist_ok=True)
    write_map(E_STAGING + "Map165.json", props, data, events)
    m = dict(props); m["data"], m["events"] = data, events
    meta = {"id": 165, "size": [W, H], "zones": {k: len(v) for k, v in mp.zones.items()}, "regions": {"low": R_LOW, "mid": R_MID, "high": R_HIGH},
            "markers": MARKERS, "breach": list(BREACH), "edge": [list(c) for c in EDGE], "bow": list(BOW), "stern": list(STERN),
            "under": {"map": UNDER, "landing": list(UNDER_LAND), "exit": list(UNDER_EXIT)}}
    os.makedirs(E_META, exist_ok=True)
    with open(E_META + "Map165_meta.json", "wb") as f:
        f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    return m, meta


# ================================================================================================ Map166
sys.path.insert(0, E_ROOT + "tools/wnetrza")
sys.path.insert(0, E_ROOT + "tools/interiors")
import rooms as RM            # noqa: E402
from rooms import *           # noqa: F401,F403,E402
import ilib                   # noqa: E402

B_WOOD = 24
W_PLANKS, W_PLANKS_V, W_RAW = 48, 49, 71
F_DARK, F_PLANKS = 83, 84
NOTE166 = "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:150>\n<DarkNight:215>"
R_HOLD, R_DEEP = 64, 65


class WInterior(ilib.Interior):
    def exit_to_wreck(self, x, name):
        cmds = [{"code": 250, "indent": 0, "parameters": [{"name": "Door5", "volume": 70, "pitch": 90, "pan": 0}]},
                {"code": 201, "indent": 0, "parameters": [0, 165, BREACH[0], BREACH[1] + 1, 2, 0]}]
        e = {"name": name, "note": "", "pages": [blank_page(priority=0, trigger=1, cmds=cmds)]}
        self.add(x, self.H - 1, e)
        self.exits.append({"x": x, "y": self.H - 1, "town": [BREACH[0], BREACH[1] + 1], "landing": [x, self.H - 2, 8], "name": name})
        self.spots["landing"] = [x, self.H - 2, 8]
        return e

    def look(self, x, y, name, text, floor=False, note=""):
        cmds = [script("Tawerna.popup(%s, { color: \"info\" });" % json.dumps(text, ensure_ascii=False))]
        e = {"name": name, "note": note, "pages": [blank_page(priority=1 if floor else 0, trigger=0, cmds=cmds, through=not floor)]}
        self.add(x, y, e)
        return e

    def act(self, x, y, name, what, floor=False, note="", image=None, priority=None):
        """a thing of the wreck that Wrak.js answers: Wrak.act(this, [what])"""
        pr = priority if priority is not None else (1 if floor else 0)
        cmds = [script("Wrak.act(this, %s);" % json.dumps([what]))]
        e = {"name": name, "note": note + "<Wrak:%s>" % what, "pages": [blank_page(priority=pr, trigger=0, cmds=cmds, through=pr != 1, image=image)]}
        self.add(x, y, e)
        return e


def build166():
    Wd, Hd = 22, 13
    mp = WInterior(166, Wd, Hd, "Wrak - pod pokładem", "wrak", note=NOTE166)
    mp.shell([("Ładownia", [(9, 3, 20, 11), (1, 10, 8, 11)], F_DARK, W_PLANKS_V),
              ("Kajuta", [(1, 3, 7, 6)], F_PLANKS, W_PLANKS)],
             openings=[("Kajuta", (4, 7, 4, 9))], border=B_WOOD, exit_x=UNDER_EXIT[0], exit_room="Ładownia")
    mp.shadows()
    # ---- the cabin: the captain's desk (the map case, the log), his chest, the bunk, the stern windows (day only)
    g = "Kajuta"
    window2(mp, 2, 0, curtain=None, length=110, style="small", name="okno rufowe (dzień)")
    window2(mp, 6, 0, curtain=None, length=110, style="small", name="okno rufowe (dzień)")
    table_h(mp, 3, 3, 2, style=6, group=g + " biurko")
    on_top(mp, 3, 3, "D", 6, 11)                      # papers
    on_top(mp, 4, 3, "D", 4, 14)                      # a book (the log)
    mp.act(3, 4, "Biurko kapitana", "biurko", priority=1)
    mp.act(4, 4, "Biurko kapitana", "biurko", priority=1)
    bed(mp, (9, 13), 1, 3, group=g, kind="koja kapitana")
    mp.look(1, 4, "Koja kapitana", "Koja kapitana. Siennik zgnił, a pod nim nic. Ktoś przeszukał ją przed tobą... albo morze.", floor=True)
    chest = mp.act(7, 3, "Skrzynia kapitana", "skrzynia", priority=1,
                   image={"characterName": "!Fantasy_chest", "characterIndex": 6, "direction": 2, "pattern": 0})
    pg_open = copy.deepcopy(chest["pages"][0])
    pg_open["conditions"].update({"selfSwitchValid": True, "selfSwitchCh": "A"})
    pg_open["image"]["direction"] = 8
    chest["pages"].append(pg_open)
    stool(mp, 5, 5, group=g)
    # the cabin's door: locked till the boatswain's key (Wrak.js: page 2 on the self switch A - open)
    door_closed = [script("Wrak.act(this, [\"drzwi\"]);")]
    pg1 = blank_page(priority=1, trigger=0, cmds=door_closed, image={"characterName": "!Door1", "characterIndex": 0, "direction": 2, "pattern": 0})
    pg2 = blank_page(priority=0, trigger=0, cmds=[], through=True, image={"characterName": "!Door1", "characterIndex": 0, "direction": 8, "pattern": 0})
    pg2["conditions"].update({"selfSwitchValid": True, "selfSwitchCh": "A"})
    mp.add(4, 9, {"name": "Drzwi kajuty kapitana", "note": "<Wrak:drzwi>", "pages": [pg1, pg2]})
    # ---- the hold: broken cargo against the walls; the lower part floods (regions 64, 65)
    barrel(mp, 9, 3, "plain"); barrel(mp, 10, 3, "red"); crate(mp, 13, 3, "two"); crate(mp, 20, 3, "tall")
    sacks(mp, 18, 3, wide=True)
    barrel(mp, 1, 10, "plain"); crate(mp, 8, 10, "tall")
    barrel(mp, 16, 3, "plain"); crate(mp, 11, 8, "tall"); crate(mp, 10, 8, "jug"); sacks(mp, 9, 8, wide=False)
    barrel(mp, 20, 7, "red"); crate(mp, 15, 6, "two")
    mp.look(13, 3, "Skrzynie z okiem", "Skrzynie z wypalonym okiem. Pootwierane, puste. Żołnierze z garnizonu wybrali, co się dało.", floor=True)
    mp.look(20, 3, "Skrzynia z okiem", "Pusta skrzynia. Na desce wydrapane: „ANSG. W.” i mała mapka wybrzeża.", floor=True)
    # the boatswain in the lowest corner (the water comes there first)
    mp.act(19, 10, "Szkielet bosmana", "szkielet", priority=1,
           image={"characterName": "!$Wrak_Szkielet", "characterIndex": 0, "direction": 2, "pattern": 0})
    # daylight through the cracks of the deck (not a fire: <LightCone> by day only)
    for (x, ln) in ((12, 150), (17, 170)):
        mp.light(x, 3, nslib_cone(ln), "szczelina w pokładzie (dzień)")
    # the water: regions of the lower hold (Wrak.js floods them by the tide)
    # (the ship lies on its side: the water line runs aslant across the hold, deeper towards the low corner)
    hold_low = {(x, y) for (x, y) in mp.rect(9, 5, 20, 11) if (x - 13) + (y - 8) * 1.7 >= 0}
    deep = {(x, y) for (x, y) in mp.rect(12, 7, 20, 11) if (x - 17) + (y - 9) * 1.7 >= 0}
    for c in hold_low:
        if c in mp.floor_cells: mp.region[c] = R_HOLD
    for c in deep:
        if c in mp.floor_cells: mp.region[c] = R_DEEP
    mp.exit_to_wreck(UNDER_EXIT[0], "Dziura w burcie -> Wrak na mieliźnie")
    for k, (x, y, d) in {"wrak_szczury": (14, 6, 2)}.items():
        mp.spots[k] = [x, y, d]
        img = {"tileId": 0, "characterName": "", "characterIndex": 0, "direction": d, "pattern": 0}
        mp.add(x, y, {"name": "Miejsce: %s" % k, "note": "", "pages": [blank_page(priority=0, through=True, image=img)]})
    return mp


def nslib_cone(length):
    return "<LightCone:length=%d,angle=26,dir=90,width=20,anchor=top,offsety=-8,blur=6,dust=14,dustsize=1,r=226,g=232,b=226,when=day>" % length


def stage166(mp):
    os.makedirs(E_STAGING, exist_ok=True)
    os.makedirs(E_META, exist_ok=True)
    n = mp.write(E_STAGING + "Map166.json", E_META + "Map166_meta.json")
    m = json.loads(open(E_STAGING + "Map166.json", "rb").read().decode("utf-8"))
    return m, n


# ================================================================================================ checks and pictures
def blocked_by_tide(m, regions):
    W_, H_ = m["width"], m["height"]
    base = 5 * W_ * H_
    return {(i % W_, i // W_) for i in range(W_ * H_) if m["data"][base + i] in regions}


def check(m165, m166):
    out = {}
    low = mtlib.reach(m165, (35, 18))
    high = mtlib.reach(m165, (35, 18), extra_block=blocked_by_tide(m165, (R_LOW, R_MID, R_HIGH)))
    out["165_low_to_edge"] = all(c in low for c in [(38, 20), (38, 21)])
    out["165_low_to_breach_front"] = (17, 16) in low
    out["165_high_to_breach_front"] = (17, 16) in high
    out["165_high_edge_cut"] = not any(c in high for c in [(38, 20), (38, 21)])
    out["165_high_markers"] = all((x, y) in high for k, (x, y, d) in MARKERS.items() if k in ("wrak_janek", "wrak_przybicie", "wrak_zolnierz_1", "wrak_zolnierz_2"))
    r = mtlib.reach(m166, UNDER_LAND)
    rh = mtlib.reach(m166, UNDER_LAND, extra_block=blocked_by_tide(m166, (R_HOLD, R_DEEP)))
    out["166_low_skeleton_front"] = any(c in r for c in [(18, 10), (19, 9), (19, 11), (20, 10)])
    out["166_high_skeleton_cut"] = not any(c in rh for c in [(18, 10), (19, 9), (19, 11), (20, 10)])
    out["166_door_front"] = (4, 10) in r
    return out


def pictures(m165, m166):
    os.makedirs(E_DOCS, exist_ok=True)
    from PIL import Image, ImageDraw
    full = SL.render_map(m165, 11)
    full.convert("RGB").save(E_DOCS + "rzut_165_odplyw.png")
    # the high tide drawn over: the flooded rings in the sea's colour
    hi = full.copy()
    ov = Image.new("RGBA", hi.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for (x, y) in blocked_by_tide(m165, (R_LOW, R_MID, R_HIGH)):
        d.rectangle([x * 48, y * 48, x * 48 + 47, y * 48 + 47], fill=(64, 132, 140, 220))
    hi.alpha_composite(ov)
    hi.convert("RGB").save(E_DOCS + "rzut_165_przyplyw.png")
    sys.path.insert(0, E_ROOT + "tools/town")
    import mzrender as R
    S = R.Sheets(8); S.lenient = True
    im = R.render(m166, S)
    im.convert("RGB").save(E_DOCS + "rzut_166.png")


def main():
    assert NOTE165.startswith("<Clouds:on>") and (W, H) == (40, 30), "a star import shadowed our constants"
    mp = build165()
    m165, meta = stage165(mp)
    mi = build166()
    m166, n = stage166(mi)
    res = check(m165, m166)
    pictures(m165, m166)
    print("Map165: %d zdarzeń, Map166: %d zdarzeń" % (len([e for e in m165["events"] if e]), n))
    print(json.dumps(res, ensure_ascii=False))
    if not all(res.values()):
        print("UWAGA: kontrola przejść nie przeszła")
        sys.exit(1)


if __name__ == "__main__":
    main()
