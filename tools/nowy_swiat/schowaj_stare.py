# -*- coding: utf-8 -*-
"""Edytor: widać tylko 5 map nowego świata - stare mapy schowane pod jedną zwiniętą pozycją „STARY ŚWIAT (archiwum)” (gracz 2026-11-13).
Zmienia TYLKO drzewko w edytorze (data/MapInfos.json: parentId starych map z najwyższego poziomu) + pusta mapa-folder 223. Gra działa tak samo.
  python tools/nowy_swiat/schowaj_stare.py              sprawdzenie
  python tools/nowy_swiat/schowaj_stare.py --wykonaj    schowanie (TYLKO przy zamkniętym edytorze)
  python tools/nowy_swiat/schowaj_stare.py --cofnij     przywrócenie dawnych rodziców (z tools/nowy_swiat/schowane_rodzice.json)"""
import datetime, importlib.util, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
SAVED = os.path.join(HERE, "schowane_rodzice.json")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

FOLDER_ID, FOLDER_NAME = 223, "STARY ŚWIAT (archiwum)"
NEW = {218, 219, 220, 221, 222}


def stop(msg): raise SystemExit("STOP: " + msg + " Nic nie zmieniono.")


def folder_map():
    """a tiny empty map (17x13) that only serves as the folder in the editor's tree"""
    proto, _ = RW.read_json("data/Map218.json")
    m = {k: v for k, v in proto.items() if k not in ("data", "events")}
    m.update({"width": 17, "height": 13, "displayName": "", "note": "Folder w edytorze na stare mapy (tools/nowy_swiat/schowaj_stare.py).",
              "autoplayBgm": False, "autoplayBgs": False, "encounters": [], "parallaxName": ""})
    m["data"] = [0] * (17 * 13 * 6)
    m["events"] = [None]
    return RW.json_text(m, "map")


def backup():
    bak = os.path.join(ARCH, "schowaj_stare_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "MapInfos.json"), bak)
    return bak


def main():
    mi, lay = RW.read_json("data/MapInfos.json")
    if lay != "db": stop("MapInfos.json w nieznanym układzie.")
    if "--cofnij" in sys.argv:
        if not os.path.exists(SAVED): stop("brak " + SAVED)
        RW.need_editor_closed()
        old = {int(k): v for k, v in json.load(open(SAVED, encoding="utf-8")).items()}
        for mid, pid in old.items():
            if len(mi) > mid and mi[mid]: mi[mid]["parentId"] = pid
        bak = backup()
        open(os.path.join(ROOT, "data", "MapInfos.json"), "wb").write(RW.json_text(mi, lay))
        print("Przywrócono rodziców %d map (mapa-folder %d zostaje, pusta). Kopia: %s" % (len(old), FOLDER_ID, bak)); return
    top = [e for e in mi if e and e["parentId"] == 0 and e["id"] not in NEW and e["id"] != FOLDER_ID]
    print("Do schowania (najwyższy poziom drzewka): %d map" % len(top))
    for e in sorted(top, key=lambda e: e["order"]): print("   %4d  %s" % (e["id"], e["name"]))
    if len(mi) > FOLDER_ID and mi[FOLDER_ID] and mi[FOLDER_ID]["name"] != FOLDER_NAME: stop("pozycja %d zajęta." % FOLDER_ID)
    fpath = os.path.join(ROOT, "data", "Map%03d.json" % FOLDER_ID)
    if os.path.exists(fpath) and not (len(mi) > FOLDER_ID and mi[FOLDER_ID]): stop("data/Map%d.json już jest." % FOLDER_ID)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    if not top: print("Nic do schowania."); return
    RW.need_editor_closed()
    saved = json.load(open(SAVED, encoding="utf-8")) if os.path.exists(SAVED) else {}
    for e in top: saved.setdefault(str(e["id"]), e["parentId"])
    while len(mi) <= FOLDER_ID: mi.append(None)
    if not mi[FOLDER_ID]:
        mi[FOLDER_ID] = {"id": FOLDER_ID, "expanded": False, "name": FOLDER_NAME, "order": max(e["order"] for e in mi if e) + 1,
                         "parentId": 0, "scrollX": 0, "scrollY": 0}
    mi[FOLDER_ID]["expanded"] = False
    for e in top: e["parentId"] = FOLDER_ID
    bak = backup()
    if not os.path.exists(fpath): open(fpath, "wb").write(folder_map())
    open(SAVED, "wb").write(json.dumps(saved, ensure_ascii=False, indent=1).encode("utf-8"))
    open(os.path.join(ROOT, "data", "MapInfos.json"), "wb").write(RW.json_text(mi, lay))
    print("Schowano %d map pod „%s” (Map%d). Kopia: %s" % (len(top), FOLDER_NAME, FOLDER_ID, bak))


if __name__ == "__main__":
    main()
