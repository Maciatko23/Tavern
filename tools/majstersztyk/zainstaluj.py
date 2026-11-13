# -*- coding: utf-8 -*-
"""W22 „Majstersztyk” - instalator (na bieżące żywe pliki, w chwili instalacji; idempotentny; bez zgadywania kotwic).

  python tools/majstersztyk/zainstaluj.py --do <katalog>   pełna nakładka do testów: kopie żywych plików ze zmianami + nowe pliki
                                                           (GAME_OVERLAY=<katalog względem projektu> GAME_OVERLAY_JS=1)
  python tools/majstersztyk/zainstaluj.py --wykonaj        zapis do gry (edytor MUSI być zamknięty); kopia przed zmianą do
                                                           ../Tawerna_archiwum_2026-11-08/majstersztyk_<czas>/
  python tools/majstersztyk/zainstaluj.py                  podgląd: co zostałoby zmienione

Co robi (wszystko ZA KAŻDYM RAZEM od bieżącej zawartości plików):
  1. data/Map215.json          nowa mapa „Cech” (wnętrze domu cechowego Map008 x87-93 y79-88) - z build_cech.py
  2. data/MapInfos.json        wpis 215 „Cech” pod Kruczogrodem (Map008); reszta bez zmian
  3. data/Map008.json          tylko zdarzenie 194 „Drzwi: Cech” (91,87): otwiera się, gdy Majster.drzwiOtwarte() (poręka, 8-17) i przenosi
                               do Map215 (7,17); inaczej popup. Zdarzenia dopisywać nie trzeba (numery 4510+ wstrzykuje Tawerna.inject)
  4. data/Items.json           „Młotek majstra” (notatka <Majster:mlotek>) pod pierwszym wolnym numerem (wtyczka szuka go po notatce)
  5. js/tawerna_wtyczki.js     Majster_Data pod Dezerter_Data, Majster pod Dezerter (przez tools/wtyczki.py)
Nowe pliki (zostają w miejscu, nie są podmieniane): js/plugins/Majster.js, Majster_Data.js, js/teksty/majster.txt,
img/characters/$Npc_Ostap|Ludwik|Jas.png i Npc_*_Walk8.png.
Pliki w formacie edytora (układ wierszy), zapis binarny, LF; mapa po zapisie czytana z powrotem (zdarzenia: indeks == id).
"""
import os, sys, json, shutil, time, datetime, copy, argparse, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wspolne as W                       # noqa: E402  (map_text, db_text, read_json, json_text, editor_closed)
import wtyczki                            # noqa: E402

ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08")
MAP_ID, TOWN, DOOR_EVENT = 215, 8, 194
NEW_FILES = ["js/plugins/Majster.js", "js/plugins/Majster_Data.js", "js/teksty/majster.txt"]
SHEETS = ["$Npc_Ostap.png", "$Npc_Ludwik.png", "$Npc_Jas.png", "Npc_Ostap_Walk8.png", "Npc_Ludwik_Walk8.png", "Npc_Jas_Walk8.png"]
DOOR_CODE = "Majster.drzwiOtwarte()"
ITEM_NOTE = "<Weight:2>\n<Majster:mlotek>"


def stop(msg): raise SystemExit("STOP: " + msg)


def rd(rel): return open(os.path.join(ROOT, rel), "rb").read()


# ------------------------------------------------------------------------------------------------ the map
def build_map():
    sys.path.insert(0, HERE)
    import build_cech as B
    mp = B.cech()
    tmp = os.path.join(HERE, "staging", "data")
    os.makedirs(tmp, exist_ok=True)
    path = os.path.join(tmp, "Map%03d.json" % MAP_ID)
    mp.write(path, os.path.join(HERE, "staging", "Map%03d_meta.json" % MAP_ID))
    raw = open(path, "rb").read()
    o = json.loads(raw.decode("utf-8"))
    if W.map_text(o).encode("utf-8") != raw:
        stop("Map215 ze build_cech.py nie jest w układzie edytora")
    for i, e in enumerate(o["events"]):
        if e is None:
            if i != 0: stop("Map215: puste zdarzenie %d" % i)
        elif e["id"] != i: stop("Map215: zdarzenie o indeksie %d ma id %d" % (i, e["id"]))
    return raw


def live_map215_ok(raw_new):
    """the live Map215 is absent, ours (the note <Majster:cech>) - or somebody else's (STOP)"""
    p = os.path.join(ROOT, "data", "Map%03d.json" % MAP_ID)
    if not os.path.exists(p): return True
    cur = open(p, "rb").read()
    if b"<Majster:cech>" in cur: return True
    stop("data/Map215.json istnieje i nie jest Cechem W22 - numer zajęty (zob. brief: 215 = Cech)")


# ------------------------------------------------------------------------------------------------ MapInfos, Items, Map008
def patch_mapinfos():
    o, lay = W.read_json("data/MapInfos.json")
    if lay != "db": stop("MapInfos.json w nieznanym układzie")
    if len(o) > MAP_ID and o[MAP_ID] and o[MAP_ID].get("name") == "Cech": return W.json_text(o, lay), False
    if len(o) > MAP_ID and o[MAP_ID]: stop("MapInfos: pozycja 215 zajęta przez „%s”" % o[MAP_ID].get("name"))
    while len(o) <= MAP_ID: o.append(None)
    order = max(e["order"] for e in o if e) + 1
    o[MAP_ID] = {"id": MAP_ID, "expanded": False, "name": "Cech", "order": order, "parentId": TOWN, "scrollX": 1104, "scrollY": 708}
    return W.json_text(o, lay), True


def patch_items():
    o, lay = W.read_json("data/Items.json")
    if lay != "db": stop("Items.json w nieznanym układzie")
    for it in o:
        if it and "<Majster:mlotek>" in (it.get("note") or ""): return W.json_text(o, lay), False, it["id"]
    base = copy.deepcopy(o[89])            # Młotek: the same icon family, a tool
    if base.get("name") != "Młotek": stop("Items.json: pozycja 89 to nie „Młotek” - zmieniona numeracja?")
    nid = max(i["id"] for i in o if i) + 1
    while len(o) < nid: o.append(None)
    base.update({"id": nid, "name": "Młotek majstra", "iconIndex": 345, "price": 0, "note": ITEM_NOTE,
                 "description": "Młotek z cechowego kowadła, z imieniem starego mistrza wybitym na obuchu. W kuźni skraca pracę o 15%, narzędzia w twoich rękach służą dłużej."})
    o.append(base)
    if o[nid]["id"] != nid: stop("Items.json: indeks != id po dopisaniu")
    return W.json_text(o, lay), True, nid


def door_list():
    SE = {"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}
    route = [{"code": 36, "indent": None}, {"code": 17, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}, {"code": 18, "indent": None},
             {"code": 15, "indent": None, "parameters": [3]}, {"code": 19, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}]
    l = [{"code": 111, "indent": 0, "parameters": [12, DOOR_CODE]}, {"code": 250, "indent": 1, "parameters": [SE]},
         {"code": 205, "indent": 1, "parameters": [0, {"list": route + [{"code": 0}], "repeat": False, "skippable": False, "wait": True}]}]
    l += [{"code": 505, "indent": 1, "parameters": [r]} for r in route]
    l += [{"code": 201, "indent": 1, "parameters": [0, MAP_ID, 7, 17, 8, 0]}, {"code": 0, "indent": 1, "parameters": []},
          {"code": 411, "indent": 0, "parameters": []},
          {"code": 355, "indent": 1, "parameters": ["Majster.drzwiZamkniete(this.eventId());"]}, {"code": 0, "indent": 1, "parameters": []},
          {"code": 412, "indent": 0, "parameters": []}, {"code": 0, "indent": 0, "parameters": []}]
    return l


def patch_town():
    o, lay = W.read_json("data/Map008.json")
    if lay != "map": stop("Map008.json w nieznanym układzie (otwórz i zapisz w edytorze)")
    e = o["events"][DOOR_EVENT]
    if not e or e["id"] != DOOR_EVENT or e["name"] != "Drzwi: Cech" or (e["x"], e["y"]) != (91, 87):
        stop("Map008: zdarzenie 194 to nie „Drzwi: Cech” (91,87) - kotwica zmieniona")
    pg = e["pages"][0]
    if any(DOOR_CODE in str(c.get("parameters")) for c in pg["list"]): return W.json_text(o, lay), False
    pg["list"] = door_list()
    pg["image"]["pattern"] = 0          # a closed door like the other houses' doors (pattern 0)
    e["note"] = "<Town:door=cech>"
    return W.json_text(o, lay), True


def patch_list(path):
    L = wtyczki.Plik(path, wtyczki.ZNACZNIK_LISTY)
    ch = False
    for nazwa, po in (("Majster_Data", "Dezerter_Data"), ("Majster", "Dezerter")):
        if nazwa in L.nazwy(): continue
        ch |= wtyczki.dodaj(L, wtyczki.wpis_z_pliku(nazwa), po=po)
    return L.tekst(), ch


# ------------------------------------------------------------------------------------------------ main
def plan():
    raw_map = build_map()
    live_map215_ok(raw_map)
    mi, mi_ch = patch_mapinfos()
    items, it_ch, it_id = patch_items()
    town, town_ch = patch_town()
    lst, lst_ch = patch_list(os.path.join(ROOT, "js", "tawerna_wtyczki.js"))
    out = {"data/Map215.json": (raw_map, True), "data/MapInfos.json": (mi, mi_ch), "data/Items.json": (items, it_ch),
           "data/Map008.json": (town, town_ch), "js/tawerna_wtyczki.js": (lst, lst_ch)}
    for rel in NEW_FILES:
        if not os.path.exists(os.path.join(ROOT, rel)): stop("brak nowego pliku " + rel)
    miss = [s for s in SHEETS if not os.path.exists(os.path.join(ROOT, "img", "characters", s))]
    return out, it_id, miss


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--do", dest="dir")
    ap.add_argument("--wykonaj", action="store_true")
    a = ap.parse_args()
    out, item_id, miss = plan()
    print("Młotek majstra: przedmiot %d" % item_id)
    if miss: print("UWAGA: brak arkuszy postaci: " + ", ".join(miss))
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
        # index.html (the overlay serves js/*, index.html is not needed - the live one stays)
        print("nakładka gotowa:", d)
        return
    if not a.wykonaj:
        print("(podgląd - nic nie zapisano; --do <katalog> albo --wykonaj)")
        return
    W.need_editor_closed()
    bak = os.path.join(ARCH, "majstersztyk_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel, (data, ch) in out.items():
        cur = os.path.join(ROOT, *rel.split("/"))
        if not ch and os.path.exists(cur): continue
        if os.path.exists(cur):
            b = os.path.join(bak, *rel.split("/"))
            os.makedirs(os.path.dirname(b), exist_ok=True)
            shutil.copy2(cur, b)
        open(cur, "wb").write(data)
        print("zapisano", rel)
    # read back (map events: index == id)
    o = json.loads(rd("data/Map215.json").decode("utf-8"))
    assert all((e is None and i == 0) or (e and e["id"] == i) for i, e in enumerate(o["events"]))
    print("kopia przed zmianą:", bak)


if __name__ == "__main__":
    main()
