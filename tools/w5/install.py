# python tools/w5/install.py [--check] [--force]
# Instalacja wątku W5 „Towary z kontynentu” (Kantor_Data.js, Kantor.js, mapa 171 „Piwnica kantoru”) do data/ i na listę wtyczek
# gry js/tawerna_wtyczki.js. TYLKO przy zamkniętym edytorze RPG Maker MZ (edytor przy zapisie nadpisuje pliki map). Skrypt:
#   1) sprawdza tasklist: działa RPGMZ.exe -> przerywa (nic nie zapisuje)
#   2) kopie zapasowe do backup_art_2026-10-17/w5/install/ (js/tawerna_wtyczki.js, data/MapInfos.json)
#   3) js/tawerna_wtyczki.js: dopisuje (jeśli ich nie ma) wpis Kantor_Data zaraz pod Cysterna_Data i Kantor zaraz pod Cysterna - na
#      AKTUALNYM pliku (wpisy dodane przez edytor zostają), końcówki linii jak w pliku
#   4) data/MapInfos.json: dopisuje wpis 171 „Piwnica kantoru” (rodzic 103) - na AKTUALNYM pliku
#   5) data/Map171.json: kopia z tools/w5/staging/data/Map171.json (gdy w data/ już jest inny plik 171: przerywa, chyba że --force)
#   --check: tylko mówi, co by zrobił (bez zapisu)
import os, sys, json, shutil, subprocess, hashlib, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STAGED_MAP = os.path.join(HERE, "staging", "data", "Map171.json")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-17", "w5", "install")
PLUGINS = os.path.join(ROOT, "js", "tawerna_wtyczki.js")   # (the game's plugin list since 2026-10-23)
INFOS = os.path.join(ROOT, "data", "MapInfos.json")
MAP171 = os.path.join(ROOT, "data", "Map171.json")
ENTRIES = [
    ("Cysterna_Data", {"name": "Kantor_Data", "status": True, "description": "[W5] Dane wątku „Towary z kontynentu”: Baltazar Vey, tylne drzwi kantoru, piwnica (mapa 171), obóz przemytników, noc promu. v1.0.0", "parameters": {}}),
    ("Cysterna", {"name": "Kantor", "status": True, "description": "[W5] Wątek „Towary z kontynentu”: trzy stuknięcia, obóz przemytników, nocny tragarz, rejestr Baltazara, noc promu, kantor w Akcie II. v1.0.0", "parameters": {}}),
]
INFO_171 = {"id": 171, "expanded": False, "name": "Piwnica kantoru", "order": 0, "parentId": 103, "scrollX": 1104, "scrollY": 708}


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
            raise SystemExit("js/tawerna_wtyczki.js: nie ma wpisu " + after + " - przerywam")
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
    if len(data) > 171 and data[171]:
        if data[171].get("name") != INFO_171["name"]:
            raise SystemExit("data/MapInfos.json: numer 171 zajęty przez „" + str(data[171].get("name")) + "” - przerywam")
        return None
    while len(data) <= 171:
        data.append(None)
    e = dict(INFO_171)
    e["order"] = max(x["order"] for x in data if x) + 1
    data[171] = e
    text = "[\n" + ",\n".join(json.dumps(x, ensure_ascii=False, separators=(",", ":")) for x in data) + "\n]"
    return (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    if editor_open():
        print("Edytor RPG Maker MZ (RPGMZ.exe) jest otwarty - nic nie zapisuję. Zamknij edytor i uruchom jeszcze raz.")
        return 1
    plug, added = plugins_new()
    infos = infos_new()
    if os.path.exists(MAP171) and sha(MAP171) != sha(STAGED_MAP) and not a.force:
        print("data/Map171.json już jest i różni się od tools/w5/staging/data/Map171.json - przerywam (--force, żeby nadpisać)")
        return 1
    print("js/tawerna_wtyczki.js: dopisze " + (", ".join(added) if added else "nic (wpisy już są)"))
    print("data/MapInfos.json: " + ("dopisze 171 „Piwnica kantoru”" if infos else "171 już jest"))
    print("data/Map171.json: " + ("skopiuje z tools/w5/staging" if sha(MAP171) != sha(STAGED_MAP) else "już taki sam"))
    if a.check:
        return 0
    os.makedirs(BACKUP, exist_ok=True)
    for p in (PLUGINS, INFOS):
        shutil.copy2(p, os.path.join(BACKUP, os.path.basename(p)))
    if os.path.exists(MAP171):
        shutil.copy2(MAP171, os.path.join(BACKUP, "Map171.json"))
    if editor_open():   # (checked once more right before writing)
        print("Edytor właśnie się otworzył - przerywam bez zapisu.")
        return 1
    if added:
        open(PLUGINS, "wb").write(plug)
    if infos:
        open(INFOS, "wb").write(infos)
    if sha(MAP171) != sha(STAGED_MAP):
        shutil.copy2(STAGED_MAP, MAP171)
    print("Zainstalowane. Kopie: " + os.path.relpath(BACKUP, ROOT))
    print("Po instalacji: przeładuj projekt w edytorze (mapy); wtyczki są na liście gry js/tawerna_wtyczki.js - edytor jej nie zapisuje.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
