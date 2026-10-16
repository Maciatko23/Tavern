# python tools/cysterna/build.py [--preview]
# PAKIET F „Stara cysterna zakonu” (docs/miejsca_wyspy/PAKIETY.md, koncepcja: docs/miejsca_wyspy/KONCEPCJA.md punkt 8).
# Buduje mapę 167 (40x28, tileset 12 „Podziemia: kwatery zakonu”, jak piętra 11-30) z zatwierdzonego szkicu
# (tools/miejsca_wyspy/szkice.py, cysterna()), na tych samych narzędziach co ręczne piętra podziemi (tools/underground/uglib.py).
#   - zapis TYLKO do tools/miejsca_wyspy/staging_F/data/Map167.json (instaluje koordynator; data/ i js/plugins.js bez zmian)
#   - poziom wody: zbiornik jest zagłębiony, przy niskim zapasie odsłania się jego północna ściana (1-4 rzędy). Plik mapy ma poziom
#     startowy (zapas 55 = pas 1); pozostałe pasy to różnice kafelków liczone tutaj i wpisywane do js/plugins/Cysterna_Data.js
#     (blok POZIOMY: [indeks, kafelek w pliku, kafelek w tym pasie] - Cysterna.js podmienia je przy wczytaniu mapy, a w razie
#     zmiany pasa na miejscu odświeża tilemapę; kafelek, którego ktoś w edytorze zmienił, zostaje)
#   - kontrakt pól (WyspaData.LINKS): powrót (2,20) -> Map147 (20,6), lądowanie z piętra 30 (3,20); kanał przelewu (33,2) ->
#     Urwisko 157 (41,16), lądowanie z kraty (33,3)
#   - podgląd: tools/cysterna/out/*.png (--preview: wszystkie pasy wody)
# Pliki zapisuję binarnie, LF, układem edytora (nslib.write_map).
import os, sys, json, hashlib, re
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/underground")
from uglib import (DMap, TILESET2, F_GREEN_BRICK, F_SLATE, F_SLATE_SQ, F_DIRT_SLABS, W_MOSSY, FILM_DUST, FILM_MOSS, FILM_RUBBLE,   # noqa: E402
                   FILM_CRACKS, cmd, script, se, page, sw_cond, self_cond, render, write_map, A5, C)
from places import UG_NOTE, torch, brazier                                                                                      # noqa: E402
from chunks_deep import CANDLE, CANDLE_LIGHT                                                                                      # noqa: E402

MAP_ID, W, H = 167, 40, 28
STAGING = ROOT + "tools/miejsca_wyspy/staging_F/data/"
OUT = HERE + "/out/"
DATA_JS = ROOT + "js/plugins/Cysterna_Data.js"
NOTE = UG_NOTE % (226, 226) + "\n<Poziom:18>\n<Cysterna:mapa>"

WATER_KIND = 0             # A1 rodzaj 0: woda o kamiennych, omszałych brzegach (zbiornik z kamienia)
BASIN = (7, 9, 32, 19)     # zbiornik (z groblą w środku)
CAUSEWAY = (18, 21)        # grobla: kolumny x
FACE_ROWS = [0, 1, 2, 3, 4]  # pas wody -> ile rzędów północnej ściany zbiornika widać (pas 0: pełny ... pas 4: prawie pusty)
BASE_BAND = 1              # pas zapisany w pliku mapy (zapas startowy 55)
BANDS = [75, 50, 30, 15, 0]  # dolne granice pasów (zapas >= BANDS[b] -> pas b)

CZERPAK = (24, 8)          # kołowrót na krawędzi zbiornika
LANCUCH = (24, 11)         # łańcuch z kubłem (obrazek 48x192: rzędy 8-11)
SLUP = (22, 13)            # słup miary w wodzie, przy grobli
KRATA, DZWIGNIA = (33, 2), (34, 2)
DESZCZ = (31, 5)           # zasuwa deszczowa (w ścianie północnej, obok kanału)
GALAZ = (38, 14)           # zasuwa gałęzi dworskiej (wnęka wschodnia)
DRZWI = (2, 20)            # przejście do piętra 30


def basin_cells():
    x0, y0, x1, y1 = BASIN
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if not (CAUSEWAY[0] <= x <= CAUSEWAY[1])}


def build(band=BASE_BAND):
    mp = DMap(MAP_ID, W, H, "Stara cysterna zakonu", NOTE, tileset=TILESET2)
    mp.props["autoplayBgs"] = False
    hall = mp.rect(3, 6, 36, 23)
    west = mp.rect(1, 20, 2, 21)
    channel = mp.rect(33, 2, 34, 5)
    east = mp.rect(37, 14, 38, 16)
    floor = hall | west | channel | east
    mp.shell(floor, F_GREEN_BRICK, W_MOSSY)
    # ---- the basin: water (A1), the causeway, the north wall of the basin shown by the band
    water = basin_cells()
    x0, y0, x1, y1 = BASIN
    face = {(x, y) for (x, y) in water if y < y0 + FACE_ROWS[band]}
    for c in water:
        mp.layers[0][c] = ("k", W_MOSSY[1] if c in face else WATER_KIND)
        mp.solid.add(c)
    mp.floor -= water
    for c in mp.rect(CAUSEWAY[0], y0, CAUSEWAY[1], y1):
        mp.layers[0][c] = ("k", F_SLATE)
    mp.layers[0].update({c: ("k", F_SLATE_SQ) for c in mp.rect(33, 2, 34, 5)})
    mp.layers[0].update({c: ("k", F_SLATE_SQ) for c in east})
    mp.shadows()
    for c in water: mp.shadow.pop(c, None)
    for (x, y) in list(mp.shadow):   # (the wall's shadow only by a wall: not on the causeway and the walk east of the water)
        if (x - 1, y) in water: mp.shadow.pop((x, y), None)
    # films: dust, moss at the water's edge, cracks
    edge = {(x, y) for (x, y) in mp.floor if any((x + dx, y + dy) in water for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))}
    mp.film(FILM_MOSS, {c for c in edge if (c[0] * 7 + c[1] * 3) % 4 == 0})
    mp.film(FILM_DUST, {(5, 7), (6, 8), (12, 7), (27, 7), (35, 9), (34, 17), (13, 22), (25, 22), (30, 23), (4, 15), (5, 12)})
    mp.film(FILM_CRACKS, {(9, 7), (29, 21), (35, 20), (4, 9), (19, 14), (20, 17)})
    mp.film(FILM_RUBBLE, {(36, 7), (3, 7), (36, 22), (33, 23)})
    # drains: the rain gate's gutter down to the basin, the manor branch under the floor to the east alcove
    for y in (6, 7, 8): mp.t("A5", 2, 0, DESZCZ[0], y, z=1)
    for x in range(33, 38): mp.t("A5", 3, 0, x, GALAZ[1], z=1)
    # columns standing in the water (their feet always under water: rows >= 14)
    for (x, y) in [(10, 16), (14, 15), (12, 19), (27, 15), (30, 17), (25, 18), (16, 18)]:
        mp.piece("kolumna", x, y - 2)
    # ---- the way back to floor 30 (contract: (2,20) -> Map147 (20,6); landing (3,20))
    mp.ev(*DRZWI, "!Fantasy_door5", 0, 2, 0, name="Przejście do Wielkiej cysterny (piętro 30)", priority=1, through=False, trigger=1,
          cmds=[se("Move1", 80, 95), cmd(201, [0, 147, 20, 6, 2, 0])], note="<Cysterna:powrot>")
    torch(mp, 1, 19)
    # ---- the overflow channel to the raven grate on the Urwisko (contract: (33,2) -> Map157 (41,16); landing (33,3))
    grate = {"characterName": "!Fantasy_door6", "characterIndex": 2, "direction": 2, "pattern": 0}
    mp.add(*KRATA, {"name": "Kanał przelewu (krata na Urwisko)", "note": "<Cysterna:krata>", "pages": [
        page(image=grate, priority=1, trigger=1, cmds=script("Cysterna.grate(this)")),
        page(image=dict(grate, direction=8), priority=1, trigger=1, cond=sw_cond(17), cmds=script("Cysterna.grate(this)"))]})
    mp.solid.add(KRATA)
    lever = {"characterName": "!Fantasy_switches2", "characterIndex": 0, "direction": 2, "pattern": 0}
    mp.add(*DZWIGNIA, {"name": "Dźwignia kraty", "note": "<Cysterna:dzwignia>", "pages": [
        page(image=lever, priority=1, cmds=script("Cysterna.lever(this)")),
        page(image=dict(lever, direction=6), priority=1, cond=sw_cond(17), cmds=script("Cysterna.lever(this)"))]})
    mp.solid.add(DZWIGNIA)
    torch(mp, 34, 1)
    # ---- the rain gate (shut by the centuries; K53 / the hero opens it - self switch A)
    gate = {"characterName": "!Fantasy_door6", "characterIndex": 3, "direction": 2, "pattern": 0}
    mp.add(*DESZCZ, {"name": "Zasuwa deszczowa", "note": "<Cysterna:deszcz>", "pages": [
        page(image=gate, priority=1, cmds=script("Cysterna.rainGate(this)")),
        page(image=dict(gate, direction=8), priority=1, cond=self_cond("A"), cmds=script("Cysterna.rainGate(this)"))]})
    # ---- the manor branch (half open since W1; closed: self switch A)
    mp.add(*GALAZ, {"name": "Zasuwa gałęzi dworskiej", "note": "<Cysterna:galaz>", "pages": [
        page(image=dict(gate, direction=4), priority=1, cmds=script("Cysterna.branch(this)")),
        page(image=gate, priority=1, cond=self_cond("A"), cmds=script("Cysterna.branch(this)"))]})
    mp.solid.add(GALAZ)
    torch(mp, 37, 13)
    # ---- the ladle of the order: the windlass on the rim, the chain and the bucket over the basin (frames: Cysterna.js)
    mp.ev(*CZERPAK, "!Fantasy_switches2", 0, 4, 0, name="Czerpak zakonu (kołowrót)", priority=1, through=False,
          cmds=script("Cysterna.ladle(this)"), note="<Cysterna:czerpak>")
    mp.ev(*LANCUCH, "!$Cysterna_Czerpak", 0, 2, 0, name="Czerpak zakonu (łańcuch i kubeł)", priority=2, through=True, note="<Cysterna:lancuch>")
    mp.ev(CZERPAK[0], 5, "!Cysterna_Rzeczy", 0, 2, 0, name="Tablica nad czerpakiem", priority=1, through=False,
          cmds=script('Cysterna.read("tablica", this)'), note="<Cysterna:tablica>")
    # ---- the measuring post in the water, by the causeway
    mp.ev(*SLUP, "!$Cysterna_Slup", 0, 2, 0, name="Słup miary", priority=1, through=False, cmds=script("Cysterna.post(this)"), note="<Cysterna:slup>")
    # ---- the water-keeper's corner (south-west): his desk and the Book of Rations, jars, barrels, the buckets of the guards
    mp.piece("in_biurko", 6, 20)
    mp.ev(6, 21, "!Underground_Props", 0, 2, 2, name="Księga racji wodnego", priority=1, through=False,
          cmds=script('Cysterna.read("ksiega", this)'), note="<Cysterna:ksiega>")
    mp.ev(7, 20, *CANDLE, name="Świeca wodnego", priority=0, through=True, step=True, note=CANDLE_LIGHT)
    mp.piece("in_stolek", 6, 22)
    mp.piece("szkielet", 7, 22)
    mp.piece("dzbany_grupa", 3, 22)
    mp.piece("beczka", 9, 21)
    mp.piece("beczka_pusta", 10, 23)
    for x in (11, 12, 13): mp.piece("wiadro_puste", x, 23)
    mp.piece("worki_stos", 14, 22)
    mp.piece("in_regal_k2", 4, 20)
    # ---- the hall: torches on the north wall, two braziers by the south walk, bones and rubble
    for x in (5, 12, 27, 36): torch(mp, x, 5)
    torch(mp, 19, 5)
    brazier(mp, 17, 21)
    brazier(mp, 22, 21)
    brazier(mp, 22, 8)          # (by the ladle)
    brazier(mp, 21, 12)         # (on the causeway, by the measuring post)
    brazier(mp, 18, 17)
    mp.piece("kosci", 30, 21); mp.piece("kosci2", 26, 22); mp.piece("czaszki", 35, 18)
    mp.piece("kamyki_c", 35, 7); mp.piece("bloki", 4, 8); mp.piece("bloki", 36, 21)
    mp.piece("dzban_bialy", 21, 6); mp.piece("wiadro_puste", 26, 6)
    mp.piece("pajeczyna_rog", 3, 6, z=3); mp.piece("pajeczyna", 35, 6, z=3)
    # ---- where the drowned come out (markers: the editor may move them)
    for i, (x, y) in enumerate([(10, 20), (29, 20), (33, 11)], 1):
        mp.marker(x, y, "Miejsce: topielec_%d" % i, d=2)
    return mp


def resolve(mp):
    return mp.resolve()


def level_diffs():
    """for every band but the file's one: [index, tile in the file, tile in that band] of the cells that differ"""
    base = resolve(build(BASE_BAND))
    out = {}
    for b in range(len(BANDS)):
        if b == BASE_BAND: continue
        other = resolve(build(b))
        assert len(other) == len(base)
        out[b] = [[i, base[i], other[i]] for i in range(len(base)) if base[i] != other[i]]
    return out


def write_levels(diffs):
    """the block POZIOMY in js/plugins/Cysterna_Data.js (binary, the file's own line endings)"""
    raw = open(DATA_JS, "rb").read()
    crlf = b"\r\n" in raw
    s = raw.decode("utf-8").replace("\r\n", "\n")
    lines = ["    // <POZIOMY> (tools/cysterna/build.py - nie zmieniaj ręcznie)",
             "    const LEVEL_TILES = {"]
    keys = sorted(diffs)
    for k, b in enumerate(keys):
        flat = ",".join("%d,%d,%d" % tuple(t) for t in diffs[b])
        lines.append("        %d: [%s]%s" % (b, flat, "," if k < len(keys) - 1 else ""))
    lines.append("    };")
    lines.append("    // </POZIOMY>")
    block = "\n".join(lines)
    new, n = re.subn(r"    // <POZIOMY>.*?// </POZIOMY>", lambda m: block, s, flags=re.S)
    if n != 1: raise SystemExit("Cysterna_Data.js: brak bloku <POZIOMY> ... </POZIOMY>")
    if new != s:
        open(DATA_JS, "wb").write((new.replace("\n", "\r\n") if crlf else new).encode("utf-8"))
    return n


def check(mp):
    """the contract cells and that every place is reachable from the landing"""
    reach = mp.reach((3, 20))
    need = {"lądowanie z piętra 30 (3,20)": (3, 20), "lądowanie z kraty (33,3)": (33, 3), "przy kracie (33,3)": (33, 3),
            "przy dźwigni (34,3)": (34, 3), "przy czerpaku (23,8)": (23, 8), "przy słupie (21,13)": (21, 13),
            "przy księdze (6,22)?": (5, 21), "pod zasuwą deszczową (31,6)": (31, 6), "przy gałęzi dworskiej (38,15)": (38, 15),
            "pod tablicą (24,6)": (24, 6), "przy drzwiach (3,20)": (3, 20)}
    bad = [k for k, c in need.items() if c not in reach]
    if bad: raise SystemExit("nieosiągalne: " + ", ".join(bad))
    return len(reach)


def main(preview=False):
    os.makedirs(STAGING, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    mp = build(BASE_BAND)
    n = check(mp)
    path = STAGING + "Map%03d.json" % MAP_ID
    mp.write_to(path)
    diffs = level_diffs()
    write_levels(diffs)
    sha = hashlib.sha256(open(path, "rb").read()).hexdigest()
    print("Map167 -> %s (%d pól osiągalnych, %d zdarzeń), sha256 %s" % (path, n, len(mp.events), sha))
    print("pasy wody: " + ", ".join("%d: %d pól" % (b, len(d)) for b, d in sorted(diffs.items())))
    if preview:
        for b in range(len(BANDS)):
            m = build(b).to_json()
            render(m, OUT + "pas_%d.png" % b, scale=0.5)
        print("podgląd: " + OUT)
    return path


if __name__ == "__main__":
    main("--preview" in sys.argv)
