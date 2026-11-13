# -*- coding: utf-8 -*-
"""Instalator wątku W20 „Kruczy listonosz” (docs/zadania_nowe/kruczy_listonosz.md). Stosuje zmiany NA AKTUALNYCH żywych plikach
(kotwice dokładne, idempotentnie, STOP z jasnym komunikatem, gdy kotwicy brak); nic nie wysyła gotowych kopii cudzych plików.

   python tools/listonosz/zainstaluj.py --do <katalog>   pełna nakładka do testów: <katalog>/data/..., <katalog>/js/tawerna_wtyczki.js,
                                                          <katalog>/img/characters/... (GAME_OVERLAY=<katalog względem projektu> GAME_OVERLAY_JS=1)
   python tools/listonosz/zainstaluj.py --wykonaj        zapis do gry (edytor zamknięty), kopia zmienianych plików do
                                                          ../Tawerna_archiwum_2026-11-08/listonosz_<czas>/

Co robi (kolejność):
  1. data/Map214.json  - nowa mapa „Kruczarnia” (tools/listonosz/kruczarnia.py: ta sama skorupa co wnętrza miasta); zapis układem edytora
  2. data/MapInfos.json - wpis 214 „Kruczarnia”, rodzic 8 (Okolice Tawerny), order = następny wolny
  3. data/Map008.json  - zdarzenie „Drzwi: Kruczarnia” (112,13): zamiast „Kruki śpią - zamknięte” woła Poczta.drzwi(this)
  4. (tylko z --z-ratuszem) data/Map104.json  - zdarzenie „Miejsce: cyryl_wnetrze” (pierwsze wolne id; wolne, osiągalne pole kancelarii) - Cyryl pracuje w Ratuszu
  5. js/tawerna_wtyczki.js - Poczta_Data (zaraz pod Dezerter_Data: nad TownLife i TownQuests_Data) i Poczta (zaraz pod Dezerter)
  6. img/characters/ - nowe arkusze (tools/listonosz/art/*.png): $Npc_Gawron, $Npc_Wicek, $Npc_Cyryl (kaptur: istniejący $Npc_Kurier), !$Kruczarnia_Zerdz, !$Kruczarnia_ZerdzPusta
Pliki wtyczek (js/plugins/Poczta*.js) i tekstów (js/teksty/poczta.txt) to nowe pliki projektu - nie są kopiowane."""
import os, sys, json, shutil, datetime, subprocess, importlib

MINE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(MINE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
sys.path.insert(0, os.path.join(ROOT, "tools"))
sys.path.insert(0, os.path.join(ROOT, "tools", "tavern"))
import wspolne as W          # noqa: E402
import wtyczki               # noqa: E402
from engine import Engine     # noqa: E402

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ART = os.path.join(MINE, "art")
ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08")
MAP_ID, DOOR_ID, PARENT = 214, 364, 8
PLUGINS = [("Poczta_Data", "Dezerter_Data"), ("Poczta", "Dezerter")]


def stop(msg): raise SystemExit("STOP: " + msg)


def blank_page(priority=0, through=True, direction=2):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
                           "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": False, "image": {"tileId": 0, "characterName": "", "direction": direction, "pattern": 0, "characterIndex": 0},
            "list": [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3,
            "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": priority, "stepAnime": False, "through": through, "trigger": 0, "walkAnime": False}


def check_events_index(m, name):
    for i, e in enumerate(m["events"]):
        if e is not None and e["id"] != i: stop("%s: zdarzenie %d pod indeksem %d" % (name, e["id"], i))


class Zmiany:
    """zbiera zapisy: ścieżka względem projektu -> bajty (nic nie pisze, dopóki apply() nie zawoła zapisu)"""
    def __init__(self): self.pliki = {}; self.raport = []
    def put(self, rel, data, note): self.pliki[rel] = data; self.raport.append("%s: %s" % (rel, note))


def patch_mapinfos(z):
    o, lay = W.read_json("data/MapInfos.json")
    if lay != "db": stop("MapInfos.json nie jest w układzie bazy")
    while len(o) <= MAP_ID: o.append(None)
    cur = o[MAP_ID]
    if cur is not None:
        if cur.get("name") == "Kruczarnia": z.raport.append("data/MapInfos.json: wpis 214 już jest"); return
        stop("MapInfos: id 214 zajęte przez „%s”" % cur.get("name"))
    if (m := os.path.join(ROOT, "data", "Map%03d.json" % MAP_ID)) and os.path.exists(m):
        pass   # (plik mapy jest nasz z poprzedniej instalacji bez wpisu: wpis i tak dopisujemy)
    order = max((e["order"] for e in o if e), default=0) + 1
    o[MAP_ID] = {"id": MAP_ID, "expanded": False, "name": "Kruczarnia", "order": order, "parentId": PARENT, "scrollX": 0, "scrollY": 0}
    z.put("data/MapInfos.json", W.json_text(o, lay), "wpis 214 Kruczarnia (rodzic %d, order %d)" % (PARENT, order))


def patch_map008(z):
    m, lay = W.read_json("data/Map008.json")
    check_events_index(m, "Map008")
    e = next((x for x in m["events"] if x and x["name"] == "Drzwi: Kruczarnia"), None)
    if not e or e["id"] != DOOR_ID or (e["x"], e["y"]) != (112, 13): stop("Map008: brak zdarzenia „Drzwi: Kruczarnia” 364 na (112,13)")
    lst = e["pages"][0]["list"]
    if any(c["code"] == 355 and "Poczta.drzwi" in "".join(map(str, c["parameters"])) for c in lst): z.raport.append("data/Map008.json: drzwi już podpięte"); return
    first = lst[0]
    if not (first["code"] == 355 and "_budDoorPop" in first["parameters"][0] and "Kruczarnia" in first["parameters"][0]):
        stop("Map008: drzwi kruczarni mają inną treść niż zamknięte drzwi z popupem (kotwica)")
    e["pages"][0]["list"] = [{"code": 355, "indent": 0, "parameters": ["Poczta.drzwi(this);"]}, {"code": 0, "indent": 0, "parameters": []}]
    z.put("data/Map008.json", W.json_text(m, lay), "drzwi kruczarni (364) wołają Poczta.drzwi")


def patch_map104(z):
    m, lay = W.read_json("data/Map104.json")
    check_events_index(m, "Map104")
    if any(e and e["name"] == "Miejsce: cyryl_wnetrze" for e in m["events"]): z.raport.append("data/Map104.json: miejsce Cyryla już jest"); return
    fl = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))[m["tilesetId"]]["flags"]
    evs = [e for e in m["events"] if e]
    eng = Engine(m["width"], m["height"], m["data"], fl, evs)
    land = [(e["x"], e["y"] - 1) for e in evs if e["name"].startswith("Drzwi") and e["y"] >= m["height"] - 2]
    blocked = {(e["x"], e["y"]) for e in evs if e["pages"][0]["priorityType"] == 1 and not e["pages"][0]["through"] and e["pages"][0]["image"]["characterName"]}
    base = eng.reach(land, ignore=[])
    cells = [(x, y) for y in range(5, 11) for x in range(15, 20) if (x, y) in base and (x, y) not in blocked and eng.tile_open(x, y)]
    pick = sorted(cells, key=lambda c: (abs(c[0] - 17) + abs(c[1] - 6), c))[0] if cells else None
    if not pick: stop("Map104: nie znalazłem wolnego, osiągalnego pola w kancelarii dla Cyryla")
    i = len(m["events"])
    m["events"].append({"id": i, "name": "Miejsce: cyryl_wnetrze", "note": "", "pages": [blank_page(priority=0, through=True, direction=2)], "x": pick[0], "y": pick[1]})
    z.put("data/Map104.json", W.json_text(m, lay), "miejsce Cyryla (%d,%d), id %d" % (pick[0], pick[1], i))


def build_map214(z):
    tmp = os.path.join(MINE, "staging")
    subprocess.check_call([sys.executable, os.path.join(MINE, "kruczarnia.py"), tmp], stdout=subprocess.DEVNULL)
    raw = open(os.path.join(tmp, "Map%03d.json" % MAP_ID), "rb").read()
    o = json.loads(raw.decode("utf-8"))
    check_events_index(o, "Map214")
    txt = W.map_text(o).encode("utf-8")
    if json.loads(txt.decode("utf-8")) != o: stop("Map214: nie wraca po zapisie (round trip)")
    z.put("data/Map%03d.json" % MAP_ID, txt, "nowa mapa Kruczarnia %dx%d, %d zdarzeń" % (o["width"], o["height"], len([e for e in o["events"] if e])))


def patch_plugins(z, root):
    """root: skąd czytać opisy wtyczek (@plugindesc) - katalog z js/plugins/Poczta*.js"""
    lista = wtyczki.czytaj_liste()
    zmiana = False
    for nazwa, po in PLUGINS:
        if not os.path.exists(os.path.join(root, "js", "plugins", nazwa + ".js")): stop("brak js/plugins/%s.js" % nazwa)
        if wtyczki.dodaj(lista, wtyczki.wpis_z_pliku(nazwa), po=po): zmiana = True
    if not zmiana: z.raport.append("js/tawerna_wtyczki.js: wtyczki już są"); return
    z.put("js/tawerna_wtyczki.js", lista.tekst(), "wpisy: " + ", ".join("%s pod %s" % p for p in PLUGINS))


# (--zastepcze: do testów, gdy arkusza postaci jeszcze nie ma - istniejący arkusz innego mieszkańca pod jej imieniem; NIGDY w --wykonaj)
ZASTEPCZE = {"$Npc_Gawron.png": "$Npc_Dzwonnik.png", "$Npc_Wicek.png": "$Npc_Dziecko.png", "$Npc_Cyryl.png": "$Npc_Kamerdyner.png"}


def patch_art(z, zastepcze=False):
    if not os.path.isdir(ART): stop("brak tools/listonosz/art (arkusze postaci)")
    have = {f for f in os.listdir(ART) if f.endswith(".png")}
    for f in sorted(have):
        z.put("img/characters/" + f, open(os.path.join(ART, f), "rb").read(), "arkusz")
    for f, src in ZASTEPCZE.items():
        if f in have: continue
        if not zastepcze: stop("brak arkusza postaci %s w tools/listonosz/art (--zastepcze tylko do testów nakładki)" % f)
        z.put("img/characters/" + f, open(os.path.join(ROOT, "img", "characters", src), "rb").read(), "ZASTĘPCZY (kopia %s)" % src)


def zbierz(zastepcze=False):
    z = Zmiany()
    build_map214(z); patch_mapinfos(z); patch_map008(z)
    if "--z-ratuszem" in sys.argv: patch_map104(z)   # (Cyryl visible at his desk 8-16: adds a spot to Map104 - town_interiors_test counts the spots, so only on request)
    patch_art(z, zastepcze)
    patch_plugins(z, ROOT)
    return z


def main():
    a = sys.argv[1:]
    if not a or a[0] not in ("--do", "--wykonaj"): print(__doc__); return
    zast = "--zastepcze" in a
    if zast and a[0] != "--do": stop("--zastepcze tylko z --do")
    z = zbierz(zast)
    if a[0] == "--do":
        if len(a) < 2: stop("--do <katalog>")
        dst = os.path.abspath(a[1])
        for rel, data in z.pliki.items():
            p = os.path.join(dst, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(data)
        print("nakładka w", dst); print("\n".join("  " + r for r in z.raport)); return
    # --wykonaj
    if wtyczki.edytor_dziala(): stop("edytor RPG Maker MZ działa - zamknij go (zmieniamy mapy)")
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    bk = os.path.join(ARCH, "listonosz_" + stamp)
    for rel in z.pliki:
        src = os.path.join(ROOT, rel)
        if os.path.exists(src):
            os.makedirs(os.path.dirname(os.path.join(bk, rel)), exist_ok=True); shutil.copy2(src, os.path.join(bk, rel))
    for rel, data in z.pliki.items():
        p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(data)
    print("zapisano; kopie w", bk); print("\n".join("  " + r for r in z.raport))


if __name__ == "__main__":
    main()
