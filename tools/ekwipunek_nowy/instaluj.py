# -*- coding: utf-8 -*-
"""Nowy ekwipunek (docs/ekwipunek/NOWE_80.md, 2026-11-17): instalacja przedmiotów z tools/ekwipunek_nowy/staging/ - PRZY ZAMKNIĘTYM EDYTORZE.

  node tools/ekwipunek_nowy/zrob_staging.js         najpierw: staging z Bron_Data.js / Ubior_Data.js
  python tools/ekwipunek_nowy/instaluj.py --proba   tylko mówi, co by zrobił (nic nie zapisuje)
  python tools/ekwipunek_nowy/instaluj.py           instaluje

Co robi (i nic więcej) w data/Items.json:
  - 284-299: wiersze rezerwy ubioru (<Rezerwa:ubior>, puste) zamienia na ubrania, płaszcze i pasy (staging/Items_284_299.json);
  - 419-491: dopisuje za ostatnim przedmiotem (418) broń, zbroje, tarcze, dodatki i nowe surowce (staging/Items_419_491.json).
Reszta pliku zostaje bajt w bajt (wiersz na przedmiot, jak zapisuje edytor; końce linii jak w pliku).
Bezpieczniki: RPGMZ.exe nie może działać (tools/rozszerzenia/wspolne.py need_editor_closed); kopia pliku przed zapisem do
../Tawerna_archiwum_2026-11-08/ekwipunek_nowy_<czas>/; plik czytany z dysku w chwili zapisu i sprawdzany jeszcze raz tuż przed nim; miejsce
zajęte czymś innym (nie rezerwa, nie to samo) - przerywa, nic nie nadpisuje; drugie uruchomienie po udanej instalacji: „już zainstalowane”.
Ikony: zastępcze (ikona najbardziej podobnej rzeczy); docelowe - staging/ikony_plan.json (wpisze je skrypt, który doklei narysowane ikony).
"""
import hashlib
import json
import os
import shutil
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as RW   # noqa: E402  (need_editor_closed)

STAGING = os.path.join(HERE, "staging")
ITEMS = os.path.join(ROOT, "data", "Items.json")
ARCH = os.path.normpath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
RESERVE = "<Rezerwa:ubior>"
TRY = "--proba" in sys.argv

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def say(*a):
    print(*a, flush=True)


def stop(msg):
    say("PRZERWANE: " + msg)
    sys.exit(1)


def compact(obj):
    """the way RPG Maker MZ writes one entry: JSON.stringify - no spaces, letters as they are"""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def load(name):
    with open(os.path.join(STAGING, name), encoding="utf-8") as f:
        return json.load(f)


def patch(raw):
    """raw bytes of data/Items.json -> (new bytes or None when nothing to do, report)"""
    text = raw.decode("utf-8")
    nl = "\r\n" if "\r\n" in text else "\n"
    lines = text.split(nl)
    data = json.loads(text)
    clothes, rest = load("Items_284_299.json"), load("Items_419_491.json")
    if [it["id"] for it in clothes] != list(range(284, 300)):
        stop("staging/Items_284_299.json: numery nie idą 284-299")
    first = rest[0]["id"] if rest else 0
    if first != 419 or [it["id"] for it in rest] != list(range(419, 419 + len(rest))):
        stop("staging/Items_419_491.json: numery nie idą po kolei od 419")
    report, changed = [], 0
    # ---- 284-299 on the reserve's places
    for it in clothes:
        i = it["id"]
        idx = next((k for k, l in enumerate(lines) if l.startswith('{"id":%d,' % i)), -1)
        if idx < 0:
            stop("nie znalazłem wiersza przedmiotu %d w data/Items.json" % i)
        line = lines[idx]
        comma = line.endswith(",")
        body = line[:-1] if comma else line
        cur = json.loads(body)
        if cur == it:
            continue
        if compact(cur) != body:
            stop("wiersz przedmiotu %d nie jest w zapisie edytora - nie ruszam" % i)
        if cur.get("name") or cur.get("note") != RESERVE:
            stop("przedmiot %d to już „%s” (nie rezerwa ubioru) - nic nie nadpisuję" % (i, cur.get("name") or cur.get("note")))
        lines[idx] = compact(it) + ("," if comma else "")
        changed += 1
    report.append("284-299: " + ("wpisane na miejsca rezerwy (%d)" % changed if changed else "już są"))
    # ---- 419+ after the last
    have = len(data) - 1
    add = []
    if have >= first:
        same = all(i < len(data) and data[i] == rest[i - first] for i in range(first, min(len(data), first + len(rest))))
        if not same or have > first + len(rest) - 1:
            stop("data/Items.json ma już przedmioty od %d (ostatni %d), inne niż ten staging - nic nie ruszam" % (first, have))
        add = rest[have - first + 1:]
        report.append("%d-%d: już są" % (first, have) + (" (brakujące dopiszę: %d)" % len(add) if add else ""))
    elif have == first - 1:
        add = rest
    else:
        stop("data/Items.json kończy się na %d, a nowe zaczynają się od %d - przerwa w numerach" % (have, first))
    if not changed and not add:
        return None, report
    out = nl.join(lines)
    if add:
        tail = out.rstrip()
        if not tail.endswith("]"):
            stop("data/Items.json nie kończy się na ]")
        end = tail.rfind("]")
        body = tail[:end].rstrip()
        out = body + "," + nl + ("," + nl).join(compact(it) for it in add) + nl + "]" + out[len(tail):]
        report.append("%d-%d: dopisane (%d)" % (add[0]["id"], add[-1]["id"], len(add)))
    check = json.loads(out)
    want = {it["id"]: it for it in clothes + rest}
    if any(check[i] != it for i, it in want.items()) or any(check[i]["id"] != i for i in range(1, len(check))) or len(check) != first + len(rest):
        stop("sprawdzenie po zmianie nie wyszło - nic nie zapisuję")
    if any(check[i] != data[i] for i in range(1, len(data)) if i not in want):
        stop("zmieniłoby się coś poza 284-299 i 419+ - nic nie zapisuję")
    return out.encode("utf-8"), report


def backup(path):
    dest_dir = os.path.join(ARCH, "ekwipunek_nowy_" + time.strftime("%Y%m%d_%H%M%S"), "data")
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, os.path.basename(path))
    shutil.copy2(path, dest)
    return dest


def main():
    for f in ("Items_284_299.json", "Items_419_491.json"):
        if not os.path.exists(os.path.join(STAGING, f)):
            stop("brak staging/" + f + " (node tools/ekwipunek_nowy/zrob_staging.js)")
    if TRY:
        if not RW.editor_closed():
            say("UWAGA: edytor jest otwarty (próba: nic nie zapisuję, więc liczę dalej)")
    else:
        RW.need_editor_closed()
    say("data/Items.json:")
    for attempt in range(3):
        with open(ITEMS, "rb") as f:
            raw = f.read()
        before = hashlib.sha256(raw).hexdigest()
        data, report = patch(raw)
        for r in report:
            say("  " + r)
        if data is None:
            say("Nic do zrobienia - już zainstalowane.")
            return
        if TRY:
            say("  (próba: nic nie zapisane)")
            return
        with open(ITEMS, "rb") as f:
            if hashlib.sha256(f.read()).hexdigest() != before:
                say("  plik zmienił się w trakcie - jeszcze raz")
                continue
        say("  kopia: " + backup(ITEMS))
        with open(ITEMS, "wb") as f:
            f.write(data)
        say("Zainstalowane. Pamiętaj: wersja zapisu (System.json versionId) nie musi rosnąć - mapy się nie zmieniły.")
        return
    stop("data/Items.json ciągle się zmienia - spróbuj później")


if __name__ == "__main__":
    main()
