# Nowe ikony przedmiotów (PixelLab, 32x32) do gry - PRZY ZAMKNIĘTYM EDYTORZE RPG Maker MZ.
#   python tools/ikony/instaluj.py           instaluje
#   python tools/ikony/instaluj.py --proba   tylko mówi, co by zrobił (nic nie zapisuje)
# Co robi (i nic więcej):
#   - img/system/IconSet.png: każdą ikonę tools/ikony/staging/<id>.png dokleja jako nową komórkę 32x32 na końcu arkusza - od
#     pierwszego pustego rzędu pod ostatnim zajętym (512 px = 16 komórek w rzędzie; arkusz rośnie w dół). Istniejące komórki zostają
#     bajt w bajt (wiele ikon interfejsu jest wskazanych numerem w kodzie). Ikona, która już leży w arkuszu (ta sama zawartość, np.
#     po drugim uruchomieniu), nie jest doklejana drugi raz - przedmiot dostaje tamtą komórkę.
#   - data/Items.json: przedmiot <id> dostaje iconIndex swojej nowej komórki. Zmieniany jest tylko jego wiersz (zapis jak w edytorze),
#     reszta pliku zostaje bajt w bajt. Przedmiot bez ikony w staging zostaje ze starą ikoną; ikona przedmiotu, którego jeszcze nie ma
#     w Items.json (np. nowe z docs/ekwipunek/NOWE_80.md przed ich instalacją), jest pomijana - wystarczy uruchomić jeszcze raz później.
# Bezpieczniki: RW.need_editor_closed() (tools/rozszerzenia/wspolne.py); kopie obu plików do
# ..\Tawerna_archiwum_2026-11-08\ikony_<czas>\; plik czytany z dysku w chwili zapisu i sprawdzany tuż przed zapisem (zmienił się
# w międzyczasie - od nowa); wynik Items.json czytany z powrotem i porównany z oczekiwanym, zanim cokolwiek zostanie zapisane.
import hashlib
import io
import json
import os
import shutil
import sys
import time

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.environ.get("IKONY_ROOT") or os.path.join(HERE, "..", ".."))   # (IKONY_ROOT: a copy of the project - a dry test)
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "rozszerzenia")))
import wspolne as RW   # noqa: E402

STAGING = os.path.join(HERE, "staging")
ITEMS = os.path.join(ROOT, "data", "Items.json")
ICONSET = os.path.join(ROOT, "img", "system", "IconSet.png")
BACKUP = os.path.normpath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08", "ikony_" + time.strftime("%Y%m%d_%H%M%S")))
CELL, COLS = 32, 16
TRY = "--proba" in sys.argv


def say(*a):
    print(*a, flush=True)


def stop(msg):
    say("PRZERWANE: " + msg)
    sys.exit(1)


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def compact(obj):
    """one entry the way RPG Maker MZ writes it: JSON.stringify - no spaces, letters as they are"""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def staged():
    """{id: 32x32 RGBA image} from tools/ikony/staging/<id>.png"""
    out = {}
    for f in sorted(os.listdir(STAGING)):
        stem, ext = os.path.splitext(f)
        if ext.lower() != ".png" or not stem.isdigit():
            continue
        im = Image.open(os.path.join(STAGING, f)).convert("RGBA")
        if im.size != (CELL, CELL):
            stop("staging/%s ma %dx%d, a nie %dx%d" % (f, im.width, im.height, CELL, CELL))
        out[int(stem)] = im
    return out


def cells(sheet):
    """cell bytes of the sheet -> list (index = icon index)"""
    rows = sheet.height // CELL
    return [sheet.crop(((k % COLS) * CELL, (k // COLS) * CELL, (k % COLS + 1) * CELL, (k // COLS + 1) * CELL)).tobytes()
            for k in range(rows * COLS)]


# ---------------------------------------------------------------- IconSet.png
def plan_icons(raw, icons, ids):
    """-> (new png bytes or None, {id: icon index}, report)"""
    sheet = Image.open(io.BytesIO(raw)).convert("RGBA")
    if sheet.width != COLS * CELL:
        stop("IconSet.png nie ma %d px szerokości (%d)" % (COLS * CELL, sheet.width))
    if sheet.height % CELL:
        stop("wysokość IconSet.png (%d) nie dzieli się przez %d" % (sheet.height, CELL))
    have = cells(sheet)
    empty = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0)).tobytes()
    where = {}
    for k, b in enumerate(have):
        if b != empty:
            where.setdefault(b, k)
    # the first free row: under the last row that has anything in it
    last = max((k for k, b in enumerate(have) if b != empty), default=-1)
    start = (last // COLS + 1) * COLS
    index, fresh, reused = {}, [], 0
    for i in ids:
        b = icons[i].tobytes()
        if b in where:
            index[i] = where[b]
            reused += 1
        else:
            index[i] = start + len(fresh)
            where[b] = index[i]
            fresh.append(icons[i])
    report = []
    if reused:
        report.append("ikony już w arkuszu (bez doklejania): %d" % reused)
    if not fresh:
        return None, index, report
    rows = (start + len(fresh) + COLS - 1) // COLS
    out = Image.new("RGBA", (COLS * CELL, max(sheet.height, rows * CELL)), (0, 0, 0, 0))
    out.paste(sheet, (0, 0))
    for n, im in enumerate(fresh):
        k = start + n
        out.paste(im, ((k % COLS) * CELL, (k // COLS) * CELL))
    # (the old cells must stay as they were: everything before the first new cell the same, everything after it was empty)
    after = cells(out)
    if after[:start] != have[:start] or any(b != empty for b in have[start:]):
        stop("sprawdzenie arkusza nie wyszło - stare komórki by się zmieniły")
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    report.append("doklejone komórki %d-%d (%d ikon), IconSet %dx%d -> %dx%d"
                  % (start, start + len(fresh) - 1, len(fresh), sheet.width, sheet.height, out.width, out.height))
    return buf.getvalue(), index, report


# ---------------------------------------------------------------- Items.json
def plan_items(raw, index):
    """-> (new bytes or None, report)"""
    text = raw.decode("utf-8")
    nl = "\r\n" if "\r\n" in text else "\n"
    lines = text.split(nl)
    data = json.loads(text)
    by_id = {}
    for k, l in enumerate(lines):
        if l.startswith('{"id":'):
            sid = l[6:l.index(",")]
            if sid.isdigit():
                by_id[int(sid)] = k
    changed, same, report = 0, 0, []
    expect = {}
    for i, ic in sorted(index.items()):
        k = by_id.get(i)
        if k is None:
            stop("wiersz przedmiotu %d nie znaleziony w data/Items.json" % i)
        line = lines[k]
        body = line[:-1] if line.endswith(",") else line
        obj = json.loads(body)
        if compact(obj) != body:
            stop("wiersz przedmiotu %d nie jest w zapisie edytora - nie ruszam" % i)
        expect[i] = ic
        if obj.get("iconIndex") == ic:
            same += 1
            continue
        obj["iconIndex"] = ic
        lines[k] = compact(obj) + ("," if line.endswith(",") else "")
        changed += 1
    if same:
        report.append("przedmioty z tą ikoną już ustawioną: %d" % same)
    if not changed:
        return None, report
    out = nl.join(lines)
    check = json.loads(out)
    if len(check) != len(data):
        stop("sprawdzenie Items.json nie wyszło (liczba wpisów) - nic nie zapisuję")
    for n, (a, b) in enumerate(zip(data, check)):
        if n in expect:
            a = dict(a, iconIndex=expect[n])
        if a != b:
            stop("sprawdzenie Items.json nie wyszło (przedmiot %d) - nic nie zapisuję" % n)
    report.append("iconIndex zmieniony: %d przedmiotów" % changed)
    return out.encode("utf-8"), report


def write(path, raw_before, data):
    with open(path, "rb") as f:
        now = f.read()
    if digest(now) != digest(raw_before):
        return False
    os.makedirs(BACKUP, exist_ok=True)
    shutil.copy2(path, os.path.join(BACKUP, os.path.basename(path)))
    with open(path, "wb") as f:
        f.write(data)
    return True


def main():
    if not TRY and not os.environ.get("IKONY_ROOT"):   # (a copy: the editor does not hold it)
        RW.need_editor_closed()
    icons = staged()
    if not icons:
        stop("tools/ikony/staging/ jest puste")
    for attempt in range(3):
        items_raw = open(ITEMS, "rb").read()
        sheet_raw = open(ICONSET, "rb").read()
        items = json.loads(items_raw.decode("utf-8"))
        named = {it["id"] for it in items if it and it.get("name", "").strip()}
        ids = sorted(i for i in icons if i in named)
        skipped = sorted(i for i in icons if i not in named)
        new_sheet, index, rep_icons = plan_icons(sheet_raw, icons, ids)
        new_items, rep_items = plan_items(items_raw, index)
        say("ikony w staging: %d, do przedmiotów z Items.json: %d" % (len(icons), len(ids)))
        if skipped:
            say("pominięte (brak przedmiotu w Items.json - uruchom jeszcze raz po jego instalacji): %d: %s"
                % (len(skipped), " ".join(map(str, skipped))))
        say("img/system/IconSet.png:")
        for r in rep_icons:
            say("  " + r)
        say("data/Items.json:")
        for r in rep_items:
            say("  " + r)
        if TRY:
            say("Próba: nic nie zapisane.")
            return
        if new_sheet is None and new_items is None:
            say("Nic do zrobienia - już zainstalowane.")
            return
        # the sheet first (the items point into it), each file checked right before it is written
        if new_sheet is not None and not write(ICONSET, sheet_raw, new_sheet):
            say("IconSet.png zmienił się w trakcie - jeszcze raz")
            continue
        if new_items is not None and not write(ITEMS, items_raw, new_items):
            say("Items.json zmienił się w trakcie - jeszcze raz (doklejone ikony zostaną użyte ponownie)")
            continue
        say("Kopie: " + BACKUP)
        say("Zainstalowane: %d przedmiotów ma nowe ikony." % len(ids))
        return
    stop("pliki ciągle się zmieniają - spróbuj później")


if __name__ == "__main__":
    main()
