# -*- coding: utf-8 -*-
"""W19 „Sygnały z młyna” - instalator (na bieżące żywe pliki, w chwili instalacji; idempotentny; bez zgadywania kotwic).

  python tools/sygnaly/zainstaluj.py --do <katalog>   pełna nakładka do testów: kopie żywych plików ze zmianami + nowe pliki
                                                      (GAME_OVERLAY=<katalog względem projektu> GAME_OVERLAY_JS=1)
  python tools/sygnaly/zainstaluj.py --wykonaj        zapis do gry (edytor MUSI być zamknięty); kopia przed zmianą do
                                                      ../Tawerna_archiwum_2026-11-08/sygnaly_<czas>/
  python tools/sygnaly/zainstaluj.py                  podgląd: co zostałoby zmienione

Co robi (wszystko ZA KAŻDYM RAZEM od bieżącej zawartości plików):
  1. data/Map217.json          nowa mapa „Młyn” (jedno wnętrze wiatraka Map008) - z build_mlyn.py
  2. data/MapInfos.json        wpis 217 „Młyn” pod Kruczogrodem (Map008); reszta bez zmian
  3. data/Map008.json          tylko zdarzenie „Drzwi: Wiatrak” (97,87; szukane po nazwie i miejscu): otwiera się, gdy Mlyn.drzwiOtwarte(),
                               i przenosi do Map217; inaczej popup. Zdarzenia wątku (numery 2970-2999) wstrzykuje Tawerna.inject
  3b. js/plugins/Morze.js      trzy jednoliniowe straże (arm, nightTick, markSeen) przez Mlyn.blocksSea: w nocy przemytników i w scenach W19 na Map125 potwory z morza nie lądują
  4. js/plugins/TawernaCore.js jedna linia w spisie zakresów numerów: Mlyn 2970-2999 (TownLife 2960-2969 dopisuje Mlyn_Data)
  5. js/tawerna_wtyczki.js     Mlyn_Data pod Majster_Data, Mlyn pod Majster (przez tools/wtyczki.py)
Nowe pliki (zostają w miejscu, nie są podmieniane): js/plugins/Mlyn.js, Mlyn_Data.js, js/teksty/mlyn.txt,
img/characters/$Npc_Walenty|Jasiek|Lasica|Szyper.png i Npc_*_Walk8.png, !$Mlyn_Kamien|Os|Dzwignia.png.
Pliki w formacie edytora (układ wierszy), zapis binarny, LF; mapa po zapisie czytana z powrotem (zdarzenia: indeks == id).
"""
import os, sys, json, shutil, datetime, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wspolne as W                       # noqa: E402  (map_text, db_text, read_json, json_text, need_editor_closed)
import wtyczki                            # noqa: E402

ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08")
MAP_ID, TOWN = 217, 8
DOOR_NAME, DOOR_XY = "Drzwi: Wiatrak", (97, 87)
LANDING = (7, 13, 8)
NEW_FILES = ["js/plugins/Mlyn.js", "js/plugins/Mlyn_Data.js", "js/teksty/mlyn.txt"]
SHEETS = ["$Npc_Walenty.png", "$Npc_Jasiek.png", "$Npc_Lasica.png", "$Npc_Szyper.png", "Npc_Walenty_Walk8.png", "Npc_Jasiek_Walk8.png", "Npc_Lasica_Walk8.png",
          "Npc_Szyper_Walk8.png", "!$Mlyn_Kamien.png", "!$Mlyn_Os.png", "!$Mlyn_Dzwignia.png"]
DOOR_CODE = "Mlyn.drzwiOtwarte()"
CORE = "js/plugins/TawernaCore.js"
CORE_ROW = ('        // (2026-11-12) W19 "Sygnały z młyna" (Mlyn.js): the lookout, the cove\'s boat and people (Map125), the book page (Map119); TownLife 2960-2969 are the miller and his helper\n'
            '        { owner: "Mlyn", from: 2970, to: 2999, what: "W19: wypatrywacz (mapa 8), łódź, szyper i zasadzka w zatoczce (mapa 125), strona księgi (mapa 119) (Mlyn.js)" }')


def stop(msg): raise SystemExit("STOP: " + msg)


def rd(rel): return open(os.path.join(ROOT, rel), "rb").read()


# ------------------------------------------------------------------------------------------------ the map
def build_map():
    sys.path.insert(0, HERE)
    import build_mlyn as B
    mp = B.mlyn()
    tmp = os.path.join(HERE, "staging", "data")
    os.makedirs(tmp, exist_ok=True)
    path = os.path.join(tmp, "Map%03d.json" % MAP_ID)
    mp.write(path, os.path.join(HERE, "staging", "Map%03d_meta.json" % MAP_ID))
    raw = open(path, "rb").read()
    o = json.loads(raw.decode("utf-8"))
    if W.map_text(o).encode("utf-8") != raw:
        stop("Map217 z build_mlyn.py nie jest w układzie edytora")
    for i, e in enumerate(o["events"]):
        if e is None:
            if i != 0: stop("Map217: puste zdarzenie %d" % i)
        elif e["id"] != i: stop("Map217: zdarzenie o indeksie %d ma id %d" % (i, e["id"]))
    if len(o["events"]) > 500: stop("Map217: ponad 500 zdarzeń")
    return raw


def live_map_ok():
    """the live Map217 is absent, ours (the note <Mlyn:mlyn>) - or somebody else's (STOP)"""
    p = os.path.join(ROOT, "data", "Map%03d.json" % MAP_ID)
    if not os.path.exists(p): return True
    if b"<Mlyn:mlyn>" in open(p, "rb").read(): return True
    stop("data/Map217.json istnieje i nie jest Młynem W19 - numer zajęty (zob. brief: 217 = Młyn)")


# ------------------------------------------------------------------------------------------------ MapInfos, Map008, Core, plugin list
def patch_mapinfos():
    o, lay = W.read_json("data/MapInfos.json")
    if lay != "db": stop("MapInfos.json w nieznanym układzie")
    if len(o) > MAP_ID and o[MAP_ID] and o[MAP_ID].get("name") == "Młyn": return W.json_text(o, lay), False
    if len(o) > MAP_ID and o[MAP_ID]: stop("MapInfos: pozycja 217 zajęta przez „%s”" % o[MAP_ID].get("name"))
    while len(o) <= MAP_ID: o.append(None)
    order = max(e["order"] for e in o if e) + 1
    o[MAP_ID] = {"id": MAP_ID, "expanded": False, "name": "Młyn", "order": order, "parentId": TOWN, "scrollX": 1104, "scrollY": 708}
    return W.json_text(o, lay), True


def door_list():
    SE = {"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}
    route = [{"code": 36, "indent": None}, {"code": 17, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}, {"code": 18, "indent": None},
             {"code": 15, "indent": None, "parameters": [3]}, {"code": 19, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}]
    l = [{"code": 111, "indent": 0, "parameters": [12, DOOR_CODE]}, {"code": 250, "indent": 1, "parameters": [SE]},
         {"code": 205, "indent": 1, "parameters": [0, {"list": route + [{"code": 0}], "repeat": False, "skippable": False, "wait": True}]}]
    l += [{"code": 505, "indent": 1, "parameters": [r]} for r in route]
    l += [{"code": 201, "indent": 1, "parameters": [0, MAP_ID, LANDING[0], LANDING[1], LANDING[2], 0]}, {"code": 0, "indent": 1, "parameters": []},
          {"code": 411, "indent": 0, "parameters": []},
          {"code": 355, "indent": 1, "parameters": ["Mlyn.drzwiZamkniete(this.eventId());"]}, {"code": 0, "indent": 1, "parameters": []},
          {"code": 412, "indent": 0, "parameters": []}, {"code": 0, "indent": 0, "parameters": []}]
    return l


def patch_town():
    o, lay = W.read_json("data/Map008.json")
    if lay != "map": stop("Map008.json w nieznanym układzie (otwórz i zapisz w edytorze)")
    found = [e for e in o["events"] if e and e["name"] == DOOR_NAME and (e["x"], e["y"]) == DOOR_XY]
    if len(found) != 1:
        stop("Map008: nie ma jednego zdarzenia „%s” na %s (znaleziono %d) - kotwica zmieniona" % (DOOR_NAME, DOOR_XY, len(found)))
    e = found[0]
    pg = e["pages"][0]
    if any(DOOR_CODE in str(c.get("parameters")) for c in pg["list"]): return W.json_text(o, lay), False
    pg["list"] = door_list()
    pg["image"]["pattern"] = 0          # a closed door like the other houses' doors
    if "<Town:door=wiatrak>" not in e["note"]: e["note"] = (e["note"] + "<Town:door=wiatrak>")
    return W.json_text(o, lay), True


def patch_core():
    raw = rd(CORE).decode("utf-8")
    if 'owner: "Mlyn"' in raw: return raw.encode("utf-8"), False
    anchor = "}\n    ];\n    const injectors = [];"
    if raw.count(anchor) != 1: stop("TawernaCore.js: nie ma kotwicy końca spisu zakresów numerów (jedno wystąpienie) - zmieniona")
    out = raw.replace(anchor, "},\n" + CORE_ROW + "\n    ];\n    const injectors = [];")
    return out.encode("utf-8"), True


MORZE = "js/plugins/Morze.js"
MORZE_FN = ("    // W19: on the smugglers' night in the cove (and in every W19 scene there) no sea-monster roll, landing or sign (Mlyn.blocksSea)\n"
            "    const mlynBlok = () => { try { return !!(window.Mlyn && window.Mlyn.blocksSea && window.Mlyn.blocksSea(mapId())); } catch (e) { return false; } };\n")


def patch_morze():
    """Morze.js (W23, installed): three one-line guards through mlynBlok() - the roll (arm), the night's tick, the first sign"""
    raw = rd(MORZE).decode("utf-8")
    if "mlynBlok" in raw: return raw.encode("utf-8"), False
    pairs = [("    function arm() {\n", "    function arm() {\n        if (mlynBlok()) return;\n", MORZE_FN),
             ("    function nightTick() {\n        if (!has() || !P()) return;\n",
              "    function nightTick() {\n        if (!has() || !P()) return;\n        if (mlynBlok()) { landing = null; return; }\n", ""),
             ("    function markSeen() {\n", "    function markSeen() {\n        if (mlynBlok()) return;\n", "")]
    for old, new, pre in pairs:
        if raw.count(old) != 1: stop("Morze.js: kotwica %r nie wystepuje dokladnie raz - zmieniona" % old.strip()[:40])
        raw = raw.replace(old, pre + new)
    return raw.encode("utf-8"), True


def patch_list(path):
    L = wtyczki.Plik(path, wtyczki.ZNACZNIK_LISTY)
    ch = False
    for nazwa, po in (("Mlyn_Data", "Majster_Data"), ("Mlyn", "Majster")):
        if nazwa in L.nazwy(): continue
        if po not in L.nazwy(): stop("lista wtyczek: brak „%s” - kotwica zmieniona" % po)
        ch |= wtyczki.dodaj(L, wtyczki.wpis_z_pliku(nazwa), po=po)
    return L.tekst(), ch


# ------------------------------------------------------------------------------------------------ main
def plan():
    raw_map = build_map()
    live_map_ok()
    mi, mi_ch = patch_mapinfos()
    town, town_ch = patch_town()
    core, core_ch = patch_core()
    morze, morze_ch = patch_morze()
    lst, lst_ch = patch_list(os.path.join(ROOT, "js", "tawerna_wtyczki.js"))
    out = {"data/Map217.json": (raw_map, True), "data/MapInfos.json": (mi, mi_ch), "data/Map008.json": (town, town_ch),
           CORE: (core, core_ch), MORZE: (morze, morze_ch), "js/tawerna_wtyczki.js": (lst, lst_ch)}
    for rel in NEW_FILES:
        if not os.path.exists(os.path.join(ROOT, rel)): stop("brak nowego pliku " + rel)
    miss = [s for s in SHEETS if not os.path.exists(os.path.join(ROOT, "img", "characters", s))]
    return out, miss


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--do", dest="dir")
    ap.add_argument("--wykonaj", action="store_true")
    a = ap.parse_args()
    out, miss = plan()
    if miss: print("UWAGA: brak arkuszy: " + ", ".join(miss))
    for rel, (data, ch) in out.items():
        print("  %-28s %s" % (rel, "ZMIANA" if ch else "bez zmian"))
    if a.dir:
        d = os.path.abspath(os.path.join(ROOT, a.dir)) if not os.path.isabs(a.dir) else a.dir
        for rel, (data, ch) in out.items():
            p = os.path.join(d, *rel.split("/"))
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, "wb").write(data)
        for rel in NEW_FILES + ["img/characters/" + s for s in SHEETS if s not in miss]:
            p = os.path.join(d, *rel.split("/"))
            os.makedirs(os.path.dirname(p), exist_ok=True)
            shutil.copy2(os.path.join(ROOT, *rel.split("/")), p)
        print("nakładka gotowa:", d)
        return
    if not a.wykonaj:
        print("(podgląd - nic nie zapisano; --do <katalog> albo --wykonaj)")
        return
    W.need_editor_closed()
    bak = os.path.join(ARCH, "sygnaly_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel, (data, ch) in out.items():
        cur = os.path.join(ROOT, *rel.split("/"))
        if not ch and os.path.exists(cur): continue
        if os.path.exists(cur):
            b = os.path.join(bak, *rel.split("/"))
            os.makedirs(os.path.dirname(b), exist_ok=True)
            shutil.copy2(cur, b)
        open(cur, "wb").write(data)
        print("zapisano", rel)
    o = json.loads(rd("data/Map217.json").decode("utf-8"))
    assert all((e is None and i == 0) or (e and e["id"] == i) for i, e in enumerate(o["events"]))
    print("kopia przed zmianą:", bak)


if __name__ == "__main__":
    main()
