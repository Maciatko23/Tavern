# python tools/w7/install.py [--check] [--force]
# Instalacja wątku W7 „Dwór z kamieni twierdzy” (Dwor_Data.js, Dwor.js, mapy 172 „Dwór - Hol”, 173 „Dwór - Biblioteka”,
# 174 „Dwór - Gabinet”) do data/ i js/plugins.js. TYLKO przy zamkniętym edytorze RPG Maker MZ (edytor przy zapisie nadpisuje
# js/plugins.js i pliki map). Skrypt:
#   1) sprawdza tasklist: działa RPGMZ.exe -> przerywa (nic nie zapisuje); sprawdza jeszcze raz tuż przed zapisem
#   2) kopie zapasowe do backup_art_2026-10-17/w7/install/ (js/plugins.js, data/MapInfos.json, mapy 172-174, jeśli były)
#   3) js/plugins.js: dopisuje (jeśli ich nie ma) wpis Dwor_Data zaraz pod Kantor_Data i Dwor zaraz pod Rywal - na AKTUALNYM
#      pliku (wpisy dodane przez edytor zostają), końcówki linii jak w pliku
#   4) data/MapInfos.json: dopisuje wpisy 172 (rodzic 24), 173 i 174 (rodzic 172) - na AKTUALNYM pliku; numer zajęty przez inną
#      mapę -> przerywa
#   5) data/Map172-174.json: kopie z tools/w7/staging/data (gdy w data/ jest już inny plik: przerywa, chyba że --force)
#   6) tools/w7/staging/ZMIANY.txt: co zmienione, SHA-256 przed i po
#   --check: tylko mówi, co by zrobił (bez zapisu)
import os, sys, json, shutil, subprocess, hashlib, argparse, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STAGED = os.path.join(HERE, "staging", "data")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-17", "w7", "install")
PLUGINS = os.path.join(ROOT, "js", "plugins.js")
INFOS = os.path.join(ROOT, "data", "MapInfos.json")
MAPS = {172: ("Dwór - Hol", 24), 173: ("Dwór - Biblioteka", 172), 174: ("Dwór - Gabinet", 172)}
ENTRIES = [
    ("Kantor_Data", {"name": "Dwor_Data", "status": True, "description": "[W7] Dane wątku „Dwór z kamieni twierdzy” (wariant A: Lord nic nie wie, Feliks sprzedaje frakcji): hol, biblioteka, gabinet (mapy 172-174). v1.0.0", "parameters": {}}),
    ("Rywal", {"name": "Dwor", "status": True, "description": "[W7] Wątek „Dwór z kamieni twierdzy” (wariant A): zaproszenie, hol z krukami, kronika rodu, dwa życia Feliksa, gabinet nocą, prawda dla Lorda, Akt II. v1.0.0", "parameters": {}}),
]


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest() if os.path.exists(p) else "-"


def editor_open():
    try:
        out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq RPGMZ.exe"], capture_output=True, text=True).stdout
    except Exception:
        return True   # (can not tell: treat as open)
    return "RPGMZ.exe" in out


def plugins_new():
    raw = open(PLUGINS, "rb").read()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8").replace("\r\n", "\n")
    lines = text.split("\n")
    names = [json.loads(l.rstrip(",")).get("name") if l.startswith("{\"name\"") else None for l in lines]
    added = []
    for after, entry in ENTRIES:
        if entry["name"] in names:
            continue
        if after not in names:
            raise SystemExit("js/plugins.js: nie ma wpisu " + after + " - przerywam")
        i = names.index(after)
        lines.insert(i + 1, json.dumps(entry, ensure_ascii=False, separators=(",", ":")) + ",")
        names.insert(i + 1, entry["name"])
        added.append(entry["name"])
    out = "\n".join(lines)
    return (out.replace("\n", "\r\n") if crlf else out).encode("utf-8"), added


def infos_new():
    raw = open(INFOS, "rb").read()
    crlf = b"\r\n" in raw
    data = json.loads(raw.decode("utf-8"))
    added = []
    for mid, (name, parent) in MAPS.items():
        if len(data) > mid and data[mid]:
            if data[mid].get("name") != name:
                raise SystemExit("data/MapInfos.json: numer %d zajęty przez „%s” - przerywam" % (mid, data[mid].get("name")))
            continue
        while len(data) <= mid:
            data.append(None)
        data[mid] = {"id": mid, "expanded": False, "name": name, "order": max(x["order"] for x in data if x) + 1, "parentId": parent,
                     "scrollX": 1104, "scrollY": 708}
        added.append(mid)
    if not added:
        return None, added
    text = "[\n" + ",\n".join(json.dumps(x, ensure_ascii=False, separators=(",", ":")) for x in data) + "\n]"
    return (text.replace("\n", "\r\n") if crlf else text).encode("utf-8"), added


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    if editor_open():
        print("Edytor RPG Maker MZ (RPGMZ.exe) jest otwarty - nic nie zapisuję. Zamknij edytor i uruchom jeszcze raz.")
        return 1
    plug, added = plugins_new()
    infos, infos_added = infos_new()
    copy = []
    for mid in MAPS:
        dst, src = os.path.join(ROOT, "data", "Map%03d.json" % mid), os.path.join(STAGED, "Map%03d.json" % mid)
        if sha(dst) == sha(src):
            continue
        if os.path.exists(dst) and not a.force:
            print("data/Map%03d.json już jest i różni się od tools/w7/staging - przerywam (--force, żeby nadpisać)" % mid)
            return 1
        copy.append(mid)
    print("js/plugins.js: dopisze " + (", ".join(added) if added else "nic (wpisy już są)"))
    print("data/MapInfos.json: " + ("dopisze " + ", ".join(str(m) for m in infos_added) if infos_added else "wpisy już są"))
    print("data/Map172-174.json: " + ("skopiuje " + ", ".join(str(m) for m in copy) if copy else "już takie same"))
    if a.check:
        return 0
    before = {p: sha(p) for p in [PLUGINS, INFOS] + [os.path.join(ROOT, "data", "Map%03d.json" % m) for m in MAPS]}
    os.makedirs(BACKUP, exist_ok=True)
    for p in (PLUGINS, INFOS):
        shutil.copy2(p, os.path.join(BACKUP, os.path.basename(p)))
    for mid in MAPS:
        dst = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        if os.path.exists(dst):
            shutil.copy2(dst, os.path.join(BACKUP, "Map%03d.json" % mid))
    if editor_open():   # (checked once more right before writing)
        print("Edytor właśnie się otworzył - przerywam bez zapisu.")
        return 1
    if added:
        open(PLUGINS, "wb").write(plug)
    if infos:
        open(INFOS, "wb").write(infos)
    for mid in copy:
        shutil.copy2(os.path.join(STAGED, "Map%03d.json" % mid), os.path.join(ROOT, "data", "Map%03d.json" % mid))
    lines = ["W7 „Dwór z kamieni twierdzy” - instalacja " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), "",
             "js/plugins.js: dopisane " + (", ".join(added) or "nic") + " (Dwor_Data pod Kantor_Data, Dwor pod Rywal)",
             "data/MapInfos.json: dopisane " + (", ".join(str(m) for m in infos_added) or "nic"),
             "data/Map172.json, Map173.json, Map174.json: nowe mapy z tools/w7/staging/data (tools/w7/build_dwor.py)", "",
             "SHA-256 (przed -> po):"]
    for p, b in before.items():
        lines.append("  %s: %s -> %s" % (os.path.relpath(p, ROOT), b, sha(p)))
    lines += ["", "Kopie: " + os.path.relpath(BACKUP, ROOT)]
    open(os.path.join(HERE, "staging", "ZMIANY.txt"), "wb").write(("\n".join(lines) + "\n").encode("utf-8"))
    print("Zainstalowane. Kopie: " + os.path.relpath(BACKUP, ROOT))
    print("Po instalacji: w edytorze otwórz Menedżer wtyczek przed zapisem (żeby edytor nie zgubił nowych wpisów) i przeładuj projekt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
