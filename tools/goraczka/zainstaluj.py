# -*- coding: utf-8 -*-
"""Instalator wątku W21 „Gorączka w przytułku” (docs/zadania_nowe/goraczka.md). Stosuje zmiany NA AKTUALNYCH żywych plikach
(kotwice dokładne, idempotentnie, STOP z jasnym komunikatem, gdy kotwicy brak); nie wysyła gotowych kopii cudzych plików.

   python tools/goraczka/zainstaluj.py --do <katalog>   pełna nakładka do testów: <katalog>/data/..., <katalog>/js/tawerna_wtyczki.js,
                                                         <katalog>/js/plugins/TawernaCore.js, <katalog>/img/characters/...
                                                         (GAME_OVERLAY=<katalog względem projektu> GAME_OVERLAY_JS=1)
   python tools/goraczka/zainstaluj.py --wykonaj        zapis do gry (edytor zamknięty), kopia zmienianych plików do
                                                         ../Tawerna_archiwum_2026-11-08/goraczka_<czas>/
   python tools/goraczka/zainstaluj.py                  podgląd: co by się zmieniło

Co robi (za każdym razem od bieżącej zawartości plików):
  1. data/Map216.json        nowa mapa „Przytułek” (wnętrze miejskiego przytułku, budynek Map008 x93-99 y96-104): kopia ŻYWEJ Map202 (Przytułek
                             Podgrodzia) z innymi zdarzeniami (wyjście na Map008 (97,105), miejsce Stefy „stefa_przytulek”); chorych i zapory dokłada Goraczka.js
  2. data/MapInfos.json      wpis 216 „Przytułek” pod Kruczogrodem (Map008), order = następny wolny
  3. data/Map008.json        tylko dwa zdarzenia: 435 „Drzwi: Przytułek” -> Goraczka.drzwiPrzytulek(this), 368 „Wózek z beczką” (Czerpalnia wschodnia)
                             -> Goraczka.beczka(this); reszta (wozy zapory, kocioł, osad, płyta) to Tawerna.inject 4610-4699
  4. data/Items.json         „Przepustka kwarantanny” (<Goraczka:przepustka>) i „Słoik osadu z rowu” (<Goraczka:sloik>) pod pierwszymi wolnymi numerami
  5. js/plugins/TawernaCore.js  dwa wiersze rejestru id: TownLife 4600-4609 (mieszkańcy W21), Goraczka 4610-4699
  6. js/tawerna_wtyczki.js   Goraczka_Data pod Majster_Data, Goraczka pod Majster (tools/wtyczki.py)
  7. img/characters/         arkusze z tools/goraczka/art (łóżka chorych, rynna z osadem, płyta rowu) i $Npc_Wawrzyn z img/characters
Nowe pliki wtyczek (js/plugins/Goraczka*.js) i tekstów (js/teksty/goraczka.txt) są w projekcie - nie są kopiowane.
Tilesety, Map202, Map111 i reszta Map008 nie są zmieniane. Po zmianie kafli Map008 trzeba by przepiec miasto, tu NIE zmieniamy kafli."""
import os, sys, json, shutil, datetime, copy, re

MINE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(MINE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wspolne as W          # noqa: E402
import wtyczki               # noqa: E402

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ART = os.path.join(MINE, "art")
ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08")
MAP_ID, SRC_MAP, PARENT = 216, 202, 8
DOOR_ID, BARREL_ID = 435, 368
PLUGINS = [("Goraczka_Data", "Majster_Data"), ("Goraczka", "Majster")]
ITEMS = [("przepustka", "Przepustka kwarantanny", 318,
          "Glejt siostry Stefy z pieczęcią kaprala. Wpuszcza do przytułku po dwudziestej, kiedy ulica jest zamknięta. Po gorączce traci ważność.", "<Weight:0>\n<Pamiatka>\n<Goraczka:przepustka>"),
         ("sloik", "Słoik osadu z rowu", 224,
          "Biały, zbity osad z rynny przy Czerpalni wschodniej. Wapno i ałun. Dowód dla Stefy i Kleofasa.", "<Weight:1>\n<Goraczka:sloik>")]
CORE_ANCHOR = "\n    ];\n    const injectors = [];"
CORE_LINES = (',\n        // (2026-11-12) W21 "Gorączka w przytułku" (Goraczka.js): Wawrzyn Płowy jako mieszkaniec (TownLife, zakres własny), chorzy w łóżkach przytułku (mapy 216, 202),\n'
              '        // wozy zapory, kocioł Stefy, osad w rynnie i płyta rowu (mapa 8)\n'
              '        { owner: "TownLife", from: 4600, to: 4609, what: "W21: Wawrzyn Płowy (piąty zakres mieszkańców)" },\n'
              '        { owner: "Goraczka", from: 4610, to: 4699, what: "W21 Gorączka w przytułku: chorzy w łóżkach (4610-4615), wozy zapory (4620-4621), kocioł (4622), osad w rynnie (4630-4632), płyta rowu (4633)" }')


def stop(msg): raise SystemExit("STOP: " + msg)


class Zmiany:
    def __init__(self): self.pliki = {}; self.raport = []
    def put(self, rel, data, note): self.pliki[rel] = data; self.raport.append("%s: %s" % (rel, note))


def check_events_index(m, name):
    for i, e in enumerate(m["events"]):
        if e is not None and e["id"] != i: stop("%s: zdarzenie %d pod indeksem %d" % (name, e["id"], i))


def script_page(page, code, trigger=0):
    page["list"] = [{"code": 355, "indent": 0, "parameters": [code]}, {"code": 0, "indent": 0, "parameters": []}]
    page["trigger"] = trigger


# ------------------------------------------------------------------------------------------------ Map216: from the live Map202
def build_map216(z):
    m, lay = W.read_json("data/Map%03d.json" % SRC_MAP)
    check_events_index(m, "Map%03d" % SRC_MAP)
    o = copy.deepcopy(m)
    o["displayName"] = "Przytułek"
    o["note"] = m["note"]
    evs = o["events"]
    names = {e["name"]: e["id"] for e in evs if e}
    # the exit: Map008 in front of the poorhouse door (97,105)
    exit_ev = next((e for e in evs if e and e["name"].startswith("Wyj") and "Podgrodzie" in e["name"]), None)
    if not exit_ev: stop("Map202: brak zdarzenia „Wyjście -> Podgrodzie” (kotwica)")
    exit_ev["name"] = "Wyjście -> Kruczogród (przytułek)"
    ok = False
    for c in exit_ev["pages"][0]["list"]:
        if c["code"] == 201: c["parameters"] = [0, 8, 97, 105, 2, 0]; ok = True
    if not ok: stop("Map202: wyjście nie ma polecenia przeniesienia (201)")
    # Stefa's place inside (the engine: resident "opiekunka", her TownLife alt, indoor spot "stefa_przytulek"); the Podgrodzie's key stays free
    sp = next((e for e in evs if e and e["name"] == "Miejsce: opiekunka_wnetrze"), None)
    if not sp: stop("Map202: brak „Miejsce: opiekunka_wnetrze”")
    sp["name"] = "Miejsce: stefa_przytulek"
    sp["pages"][0]["image"]["direction"] = 8
    # a different arrangement than the Podgrodzie's: the cauldron and the bucket swap sides of the hearth room (the stool beside the cauldron stays)
    kot = next((e for e in evs if e and e["name"] == "Kocioł"), None); wia = next((e for e in evs if e and e["name"].startswith("Wiadro")), None)
    if kot and wia: kot["x"], wia["x"] = 11, 6
    check_events_index(o, "Map216")
    txt = W.map_text(o).encode("utf-8")
    if json.loads(txt.decode("utf-8")) != o: stop("Map216: nie wraca po zapisie (round trip)")
    z.put("data/Map%03d.json" % MAP_ID, txt, "nowa mapa Przytułek %dx%d (kopia żywej Map202), %d zdarzeń" % (o["width"], o["height"], len([e for e in o["events"] if e])))


def patch_mapinfos(z):
    o, lay = W.read_json("data/MapInfos.json")
    if lay != "db": stop("MapInfos.json nie jest w układzie bazy")
    while len(o) <= MAP_ID: o.append(None)
    cur = o[MAP_ID]
    if cur is not None:
        if cur.get("name") == "Przytułek": z.raport.append("data/MapInfos.json: wpis 216 już jest"); return
        stop("MapInfos: id 216 zajęte przez „%s”" % cur.get("name"))
    order = max((e["order"] for e in o if e), default=0) + 1
    o[MAP_ID] = {"id": MAP_ID, "expanded": False, "name": "Przytułek", "order": order, "parentId": PARENT, "scrollX": 0, "scrollY": 0}
    z.put("data/MapInfos.json", W.json_text(o, lay), "wpis 216 Przytułek (rodzic %d, order %d)" % (PARENT, order))


def patch_map008(z):
    m, lay = W.read_json("data/Map008.json")
    check_events_index(m, "Map008")
    changed = []
    d = m["events"][DOOR_ID] if DOOR_ID < len(m["events"]) else None
    if not d or d["name"] != "Drzwi: Przytułek" or (d["x"], d["y"]) != (97, 104): stop("Map008: brak zdarzenia „Drzwi: Przytułek” 435 na (97,104)")
    lst = d["pages"][0]["list"]
    if not any(c["code"] == 355 and "Goraczka.drzwiPrzytulek" in "".join(map(str, c["parameters"])) for c in lst):
        if not (lst[0]["code"] == 355 and "_budDoorPop" in lst[0]["parameters"][0] and "Przytu" in lst[0]["parameters"][0]):
            stop("Map008: drzwi przytułku mają inną treść niż zamknięte drzwi z popupem (kotwica)")
        d["pages"][0]["list"] = [{"code": 355, "indent": 0, "parameters": ["Goraczka.drzwiPrzytulek(this);"]}, {"code": 0, "indent": 0, "parameters": []}]
        changed.append("drzwi 435")
    b = m["events"][BARREL_ID] if BARREL_ID < len(m["events"]) else None
    if not b or not b["name"].startswith("W") or (b["x"], b["y"]) != (115, 70): stop("Map008: brak „Wózek z beczką” 368 na (115,70) (Czerpalnia wschodnia)")
    blst = b["pages"][0]["list"]
    if not any(c["code"] == 355 and "Goraczka.beczka" in "".join(map(str, c["parameters"])) for c in blst):
        if len(blst) != 1 or blst[0]["code"] != 0: stop("Map008: wózek z beczką 368 ma już jakąś treść - nie nadpisuję")
        b["pages"][0]["list"] = [{"code": 355, "indent": 0, "parameters": ["Goraczka.beczka(this);"]}, {"code": 0, "indent": 0, "parameters": []}]
        b["pages"][0]["trigger"] = 0
        changed.append("wózek 368")
    if not changed: z.raport.append("data/Map008.json: zdarzenia już podpięte"); return
    z.put("data/Map008.json", W.json_text(m, lay), "podpięte: " + ", ".join(changed))


def patch_items(z):
    o, lay = W.read_json("data/Items.json")
    if lay != "db": stop("Items.json w nieznanym układzie")
    ids, add = {}, []
    for it in o:
        if it:
            for tag, *_ in ITEMS:
                if "<Goraczka:%s>" % tag in (it.get("note") or ""): ids[tag] = it["id"]
    nid = max(i["id"] for i in o if i) + 1
    for tag, name, icon, desc, note in ITEMS:
        if tag in ids: continue
        base = copy.deepcopy(o[204]) if len(o) > 204 and o[204] and o[204].get("name") else None
        if not base: stop("Items.json: pozycja 204 (Zezwolenie na odstrzał) jako wzór nie istnieje")
        base.update({"id": nid, "name": name, "iconIndex": icon, "price": 0, "note": note, "description": desc})
        while len(o) < nid: o.append(None)
        o.append(base); ids[tag] = nid; add.append((tag, nid)); nid += 1
    if not add: z.raport.append("data/Items.json: przedmioty już są (%s)" % ids); return
    for i, it in enumerate(o):
        if it and it["id"] != i: stop("Items.json: indeks != id po dopisaniu")
    z.put("data/Items.json", W.json_text(o, lay), "dopisane: " + ", ".join("%s=%d" % a for a in add))


def patch_core(z):
    rel = "js/plugins/TawernaCore.js"
    raw = open(os.path.join(ROOT, rel), "rb").read()
    txt = raw.decode("utf-8")
    crlf = "\r\n" in txt
    t = txt.replace("\r\n", "\n")
    if 'owner: "Goraczka"' in t: z.raport.append(rel + ": rejestr już ma Goraczka"); return
    if t.count(CORE_ANCHOR) != 1: stop("TawernaCore.js: brak kotwicy końca tablicy reserved (\"    ];\\n    const injectors = [];\")")
    t = t.replace(CORE_ANCHOR, CORE_LINES + CORE_ANCHOR)
    if crlf: t = t.replace("\n", "\r\n")
    z.put(rel, t.encode("utf-8"), "rejestr id: TownLife 4600-4609, Goraczka 4610-4699")


def patch_plugins(z):
    lista = wtyczki.czytaj_liste()
    zmiana = False
    for nazwa, po in PLUGINS:
        if not os.path.exists(os.path.join(ROOT, "js", "plugins", nazwa + ".js")): stop("brak js/plugins/%s.js" % nazwa)
        if wtyczki.dodaj(lista, wtyczki.wpis_z_pliku(nazwa), po=po): zmiana = True
    if not zmiana: z.raport.append("js/tawerna_wtyczki.js: wtyczki już są"); return
    z.put("js/tawerna_wtyczki.js", lista.tekst(), "wpisy: " + ", ".join("%s pod %s" % p for p in PLUGINS))


def patch_art(z):
    if not os.path.isdir(ART): stop("brak tools/goraczka/art")
    n = 0
    for f in sorted(os.listdir(ART)):
        if f.endswith(".png"): z.put("img/characters/" + f, open(os.path.join(ART, f), "rb").read(), "arkusz"); n += 1
    if not any(f.startswith("$Npc_Wawrzyn") for f in os.listdir(ART)):
        if "--zastepcze" in sys.argv: z.put("img/characters/$Npc_Wawrzyn.png", open(os.path.join(ROOT, "img", "characters", "$Npc_Garbarz.png"), "rb").read(), "ZASTĘPCZY (Garbarz)")
        else: stop("brak $Npc_Wawrzyn.png w tools/goraczka/art")


def zbierz():
    z = Zmiany()
    build_map216(z); patch_mapinfos(z); patch_map008(z); patch_items(z); patch_core(z); patch_plugins(z); patch_art(z)
    return z


def main():
    a = sys.argv[1:]
    z = zbierz()
    if not a or a[0] not in ("--do", "--wykonaj"):
        print("podgląd (nic nie zapisano):"); print("\n".join("  " + r for r in z.raport)); return
    if a[0] == "--do":
        if len(a) < 2: stop("--do <katalog>")
        dst = os.path.abspath(a[1])
        for rel, data in z.pliki.items():
            p = os.path.join(dst, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(data)
        print("nakładka w", dst); print("\n".join("  " + r for r in z.raport)); return
    if wtyczki.edytor_dziala(): stop("edytor RPG Maker MZ działa - zamknij go (zmieniamy mapy)")
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    bk = os.path.join(ARCH, "goraczka_" + stamp)
    for rel in z.pliki:
        src = os.path.join(ROOT, rel)
        if os.path.exists(src):
            os.makedirs(os.path.dirname(os.path.join(bk, rel)), exist_ok=True); shutil.copy2(src, os.path.join(bk, rel))
    for rel, data in z.pliki.items():
        p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(data)
    print("zapisano; kopie w", bk); print("\n".join("  " + r for r in z.raport))


if __name__ == "__main__":
    main()
