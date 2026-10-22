# -*- coding: utf-8 -*-
"""Motyle: przedmioty 180 Siatka na motyle i 181 Rysunek Eli (data/Items.json) oraz wpisy Motyle_Data + Motyle w js/plugins.js
(zaraz pod Birds). Każdy krok osobno - przed każdym zapisem sprawdź osobnym poleceniem, że edytor RPG Maker jest zamknięty
(tasklist), nigdy w jednym łańcuchu z zapisem.

  python tools/motyle/install.py --stage     pliki do tools/motyle/staging/ (+ ZMIANY.txt z SHA256 oryginałów), nic w grze
  python tools/motyle/install.py --items     zapis data/Items.json   (kopia w backup_art_2026-10-18/motyle/)
  python tools/motyle/install.py --plugins   zapis js/plugins.js     (kopia w backup_art_2026-10-18/motyle/)

Nic nie nadpisuje: id 180/181 muszą być wolne (albo już te same), wpis wtyczki - nieobecny (albo już ten sam). Końcówki linii zostają.
"""
import hashlib, json, os, shutil, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "staging")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-18", "motyle")
ITEMS = os.path.join(ROOT, "data", "Items.json")
PLUGINS = os.path.join(ROOT, "js", "plugins.js")


def item(i, name, icon, desc, note):
    return {"id": i, "animationId": 0, "consumable": False,
            "damage": {"critical": False, "elementId": 0, "formula": "0", "type": 0, "variance": 20},
            "description": desc, "effects": [], "hitType": 0, "iconIndex": icon, "itypeId": 2, "name": name, "note": note,
            "occasion": 3, "price": 0, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0}


NEW_ITEMS = [
    item(180, "Siatka na motyle", 441, "Lekka siatka z lnianego włókna na długim kiju. Podejdź do motyla i naciśnij O.", "<Weight:1>"),
    item(181, "Rysunek Eli", 442, "Pawik z czterema oczkami, Ela w chustce i ty z siatką. Narysowane kredką, trochę krzywo, bardzo starannie.", "<Weight:0>\n<Pamiatka>"),
]
NEW_PLUGINS = [
    {"name": "Motyle_Data", "status": True, "description": "Dane motyli i ciem: gatunki, mapy, kafelki kwiatów, zapylanie, siatka, gablotka, zadanie K54 „Motyl z oczkami”. v1.0.0", "parameters": {}},
    {"name": "Motyle", "status": True, "description": "Motyle za dnia i ćmy nocą przy ogniu, siatka na motyle, gablotka w Dzienniku, zapylanie, bielinki na kapuście, K54. v1.0.0", "parameters": {"enabled": "true"}},
]


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def read_text(p):
    raw = open(p, "rb").read()
    return raw, b"\r\n" in raw


def items_text(raw, crlf):
    s = raw.decode("utf8").replace("\r\n", "\n")
    data = json.loads(s)
    while len(data) <= max(i["id"] for i in NEW_ITEMS):
        data.append(None)
    for it in NEW_ITEMS:
        old = data[it["id"]]
        if old and old != it:
            if old.get("name") not in ("", None):
                sys.exit("Items.json: id %d jest zajęte przez '%s' - przerwano" % (it["id"], old.get("name")))
        data[it["id"]] = it
    # RPG Maker's own layout: one item a line
    out = "[\n" + ",\n".join(json.dumps(x, ensure_ascii=False, separators=(",", ":")) for x in data) + "\n]"
    return (out.replace("\n", "\r\n") if crlf else out).encode("utf8")


def plugins_text(raw, crlf):
    s = raw.decode("utf8").replace("\r\n", "\n")
    lines = s.split("\n")
    names = [json.loads(l.rstrip(",")).get("name") if l.startswith("{\"name\"") else None for l in lines]
    if "Motyle_Data" in names or "Motyle" in names:
        for p in NEW_PLUGINS:
            if p["name"] in names:
                cur = json.loads(lines[names.index(p["name"])].rstrip(","))
                if cur != p:
                    print("plugins.js: wpis %s jest już (inny) - zostawiam" % p["name"])
        return None
    at = names.index("Birds")
    add = [json.dumps(p, ensure_ascii=False, separators=(",", ":")) + "," for p in NEW_PLUGINS]
    lines[at + 1:at + 1] = add
    out = "\n".join(lines)
    return (out.replace("\n", "\r\n") if crlf else out).encode("utf8")


def backup(p):
    os.makedirs(BACKUP, exist_ok=True)
    dst = os.path.join(BACKUP, os.path.basename(p) + ".przed_motylami")
    if not os.path.exists(dst):
        shutil.copy2(p, dst)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--stage"
    if mode == "--stage":
        os.makedirs(os.path.join(STAGE, "data"), exist_ok=True)
        os.makedirs(os.path.join(STAGE, "js"), exist_ok=True)
        raw, crlf = read_text(ITEMS)
        open(os.path.join(STAGE, "data", "Items.json"), "wb").write(items_text(raw, crlf))
        praw, pcrlf = read_text(PLUGINS)
        pt = plugins_text(praw, pcrlf)
        if pt:
            open(os.path.join(STAGE, "js", "plugins.js"), "wb").write(pt)
        with open(os.path.join(STAGE, "ZMIANY.txt"), "w", encoding="utf8", newline="\n") as f:
            f.write("Motyle - pliki do skopiowania przy zamkniętym edytorze RPG Maker\n")
            f.write("data/Items.json  oryginał sha256 %s  (dochodzą 180 Siatka na motyle, 181 Rysunek Eli)\n" % sha(ITEMS))
            f.write("js/plugins.js    oryginał sha256 %s  (Motyle_Data i Motyle zaraz pod Birds)\n" % sha(PLUGINS))
        print("staging ok:", STAGE)
    elif mode == "--items":
        raw, crlf = read_text(ITEMS)
        new = items_text(raw, crlf)
        if new == raw:
            print("Items.json: już jest"); return
        backup(ITEMS)
        open(ITEMS, "wb").write(new)
        print("Items.json zapisany (180, 181)")
    elif mode == "--plugins":
        raw, crlf = read_text(PLUGINS)
        new = plugins_text(raw, crlf)
        if not new:
            print("plugins.js: już jest"); return
        backup(PLUGINS)
        open(PLUGINS, "wb").write(new)
        print("plugins.js zapisany (Motyle_Data, Motyle pod Birds)")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
