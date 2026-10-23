# -*- coding: utf-8 -*-
"""W9 rozdz. 3 „Rywal w ruinach” - wpis wtyczek na listę gry js/tawerna_wtyczki.js (od 2026-10-23; edytor jej nie zapisuje).

  python tools/w9_rywal/install.py          -> dopisuje Rywal_Data i Rywal tuż pod Kantor (jeśli ich nie ma)

Robi kopię do backup_art_2026-10-17/w9_rywal/install/, zachowuje końcówki linii
pliku, zapisuje tools/w9_rywal/ZMIANY.txt (SHA-256 przed i po). Można uruchomić drugi raz - nic nie zmieni.
"""
import hashlib
import os
import shutil
import subprocess
import sys
import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PLUGINS = os.path.join(ROOT, "js", "tawerna_wtyczki.js")   # (the game's plugin list)
BACKUP = os.path.join(ROOT, "backup_art_2026-10-17", "w9_rywal", "install")
LOG = os.path.join(os.path.dirname(__file__), "ZMIANY.txt")
ENTRIES = [
    '{"name":"Rywal_Data","status":true,"description":"[W9 rozdz. 3] Dane „Rywal w ruinach”: kto schodzi po Serce przed bohaterem (Grum, ludzie Lorda, ludzie Baltazara, kopacze Czarnych Oczu), ślady na piętrach 1-10, spotkanie. v1.0.0","parameters":{}},',
    '{"name":"Rywal","status":true,"description":"[W9 rozdz. 3] „Rywal w ruinach”: ktoś z zewnątrz schodzi po Serce przed bohaterem - ślady na piętrach 1-10, pułapki, puste skrzynie, wyrwane zapiski, spotkanie (rozmowa albo walka), skutki w Akcie III i przy Sercu. v1.0.0","parameters":{}},',
]


def editor_open():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception as e:
        print("tasklist nie działa:", e)
        return True
    return any(n.lower() in out.lower() for n in ("RPGMZ.exe", "RPG Maker MZ"))


def sha(b):
    return hashlib.sha256(b).hexdigest()


def main():
    raw = open(PLUGINS, "rb").read()   # (the game's list: the editor does not write it - no need to close it)
    crlf = b"\r\n" in raw
    text = raw.decode("utf8").replace("\r\n", "\n")
    lines = text.split("\n")
    if any('"name":"Rywal"' in l for l in lines):
        print("Rywal już jest na liście gry - nic do zrobienia.")
        return 0
    at = next((i for i, l in enumerate(lines) if l.startswith('{"name":"Kantor",')), -1)
    if at < 0:
        print("Nie ma wpisu Kantor na liście gry - nie wiem, gdzie dopisać.")
        return 1
    os.makedirs(BACKUP, exist_ok=True)
    shutil.copy2(PLUGINS, os.path.join(BACKUP, "tawerna_wtyczki.js"))
    lines[at + 1:at + 1] = ENTRIES
    new = "\n".join(lines)
    data = (new.replace("\n", "\r\n") if crlf else new).encode("utf8")
    open(PLUGINS, "wb").write(data)
    with open(LOG, "ab") as f:
        f.write(("%s  js/tawerna_wtyczki.js  przed %s  po %s  (+Rywal_Data, +Rywal pod Kantor)\n" % (datetime.datetime.now().isoformat(timespec="seconds"), sha(raw), sha(data))).encode("utf8"))
    print("Dopisane: Rywal_Data, Rywal (pod Kantor). Kopia:", os.path.join(BACKUP, "tawerna_wtyczki.js"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
