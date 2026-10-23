# Ubiór: instalacja danych przygotowanych w tools/ubior/staging/ - PRZY ZAMKNIĘTYM EDYTORZE RPG Maker MZ.
#   python tools/ubior/instaluj_dane.py           instaluje
#   python tools/ubior/instaluj_dane.py --proba   tylko mówi, co by zrobił (nic nie zapisuje)
# Co robi (i nic więcej):
#   - data/Items.json: dopisuje przedmioty 250+ (staging/Items_dopisek.json) za ostatnim (249) i dopisuje notatki <Ubior:...> do
#     starych 113 / 114 / 171 (staging/Items_notatki.json) - reszta pliku zostaje bajt w bajt;
#   - img/system/IconSet.png: dokleja rzędy ikon 528+ (staging/IconSet_nowe.png) pod ostatnim rzędem (527).
# Bezpieczniki: RPGMZ.exe nie może działać (tasklist); kopie obu plików do ..\Tawerna_archiwum_2026-10-18\dane_przed_ubiorem\;
# plik czytany z dysku w chwili zapisu (i sprawdzany jeszcze raz tuż przed zapisem - ktoś go zmienił: od nowa); gdy w Items.json są
# już przedmioty 250+ albo IconSet ma już coś w rzędach 528+, a to nie jest dokładnie to samo - przerywa, nic nie nadpisuje;
# drugie uruchomienie po udanej instalacji mówi „już zainstalowane”.
# Wtyczki: lista gry js/tawerna_wtyczki.js (od 2026-10-23; edytor może być otwarty): Ubior_Data (pod Equipment), Ubior (pod nim),
# Ubior_Sklepy (na końcu listy, pod TownQuests / Kantor / MenuRing).
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import time

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.environ.get("UBIOR_ROOT") or os.path.join(HERE, "..", ".."))   # (UBIOR_ROOT: a copy of the project - a dry test)
STAGING = os.path.join(HERE, "staging")
ITEMS = os.path.join(ROOT, "data", "Items.json")
ICONSET = os.path.join(ROOT, "img", "system", "IconSet.png")
BACKUP = os.path.normpath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-10-18", "dane_przed_ubiorem"))
FIRST_ID, FIRST_ICON, OLD_ICON_ROWS = 250, 528, 33
TRY = "--proba" in sys.argv


def say(*a):
    print(*a, flush=True)


def stop(msg):
    say("PRZERWANE: " + msg)
    sys.exit(1)


def editor_running():
    try:
        out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq RPGMZ.exe", "/NH"], capture_output=True, text=True, timeout=20).stdout
    except Exception as e:   # (no tasklist: not Windows - the user knows)
        say("UWAGA: nie da się sprawdzić tasklist (%s)" % e)
        return False
    return "rpgmz.exe" in out.lower()


def digest(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def backup(path):
    os.makedirs(BACKUP, exist_ok=True)
    name = os.path.basename(path)
    dest = os.path.join(BACKUP, name)
    if os.path.exists(dest):
        stem, ext = os.path.splitext(name)
        dest = os.path.join(BACKUP, "%s_%s%s" % (stem, time.strftime("%Y%m%d_%H%M%S"), ext))
    shutil.copy2(path, dest)
    return dest


def compact(obj):
    """the way RPG Maker MZ writes one entry: JSON.stringify - no spaces, letters as they are"""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


# ---------------------------------------------------------------- Items.json
def patch_items(raw):
    """raw bytes of data/Items.json -> (new bytes or None when nothing to do, report)"""
    text = raw.decode("utf-8")
    crlf = "\r\n" in text
    nl = "\r\n" if crlf else "\n"
    lines = text.split(nl)
    data = json.loads(text)
    fresh = json.load(open(os.path.join(STAGING, "Items_dopisek.json"), encoding="utf-8"))
    notes = json.load(open(os.path.join(STAGING, "Items_notatki.json"), encoding="utf-8"))
    ids = [it["id"] for it in fresh]
    if ids != list(range(FIRST_ID, FIRST_ID + len(ids))):
        stop("staging/Items_dopisek.json: numery nie idą po kolei od %d (%s)" % (FIRST_ID, ids[:3]))
    report = []
    # the new things: after 249 - or there already, exactly the same (a second run)
    have = len(data) - 1
    if have >= FIRST_ID:
        same = all(i < len(data) and data[i] == fresh[i - FIRST_ID] for i in ids)
        if not same:
            stop("data/Items.json ma już przedmioty od %d (ostatni %d), inne niż ubiór - nic nie ruszam" % (FIRST_ID, have))
        add = False
        report.append("przedmioty %d-%d: już są" % (ids[0], ids[-1]))
    elif have != FIRST_ID - 1:
        stop("data/Items.json kończy się na %d, oczekiwano %d" % (have, FIRST_ID - 1))
    else:
        add = True
    # the notes of the old things: the line of the item, its note with <Ubior:...> added (the rest of the line as the editor wrote it)
    changed = 0
    for sid, note in notes.items():
        idx = next((k for k, l in enumerate(lines) if l.startswith('{"id":%s,' % sid)), -1)
        if idx < 0:
            stop("nie znalazłem wiersza przedmiotu %s w data/Items.json" % sid)
        line = lines[idx]
        body = line[:-1] if line.endswith(",") else line
        obj = json.loads(body)
        if compact(obj) != body:
            stop("wiersz przedmiotu %s nie jest w zapisie edytora - nie ruszam" % sid)
        if note in obj["note"]:
            report.append("notatka %s: już jest" % sid)
            continue
        obj["note"] = (obj["note"] + "\n" + note) if obj["note"] else note
        lines[idx] = compact(obj) + ("," if line.endswith(",") else "")
        changed += 1
        report.append("notatka %s: + %s" % (sid, note))
    if not add and not changed:
        return None, report
    out = nl.join(lines)
    if add:
        tail = out.rstrip()
        if not tail.endswith("]"):
            stop("data/Items.json nie kończy się na ]")
        end = tail.rfind("]")
        body = tail[:end].rstrip()
        out = body + "," + nl + ("," + nl).join(compact(it) for it in fresh) + nl + "]" + out[len(tail):]
        report.append("przedmioty %d-%d: dopisane (%d)" % (ids[0], ids[-1], len(ids)))
    # (the result must read back as the same list plus the new things)
    check = json.loads(out)
    if len(check) != max(len(data), FIRST_ID + len(fresh)) or any(check[i] != fresh[i - FIRST_ID] for i in ids):
        stop("sprawdzenie po zmianie nie wyszło - nic nie zapisuję")
    return out.encode("utf-8"), report


# ---------------------------------------------------------------- IconSet.png
def patch_icons(raw):
    sheet = Image.open(io.BytesIO(raw)).convert("RGBA")
    new = Image.open(os.path.join(STAGING, "IconSet_nowe.png")).convert("RGBA")
    if sheet.width != 512 or new.width != 512:
        stop("IconSet.png albo IconSet_nowe.png nie ma 512 px szerokości")
    top = OLD_ICON_ROWS * 32
    if sheet.height < top:
        stop("IconSet.png ma mniej niż %d rzędów" % OLD_ICON_ROWS)
    if sheet.height > top:
        have = sheet.crop((0, top, 512, sheet.height))
        part = have.crop((0, 0, 512, min(have.height, new.height)))
        if part.tobytes() == new.crop((0, 0, 512, part.height)).tobytes() and have.height >= new.height:
            return None, ["ikony %d+: już są" % FIRST_ICON]
        if have.getbbox() is not None:
            stop("IconSet.png ma już coś w rzędach od %d - nic nie ruszam" % FIRST_ICON)
    out = Image.new("RGBA", (512, top + new.height), (0, 0, 0, 0))
    out.paste(sheet.crop((0, 0, 512, top)), (0, 0))
    out.paste(new, (0, top))
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    return buf.getvalue(), ["ikony %d-%d: doklejone (%d rzędy, IconSet %dx%d)" % (FIRST_ICON, FIRST_ICON + new.height // 32 * 16 - 1, new.height // 32, out.width, out.height)]


def apply(path, fn):
    """read the file from the disk, patch it, check it did not change meanwhile, keep a copy, write - up to 3 tries"""
    for attempt in range(3):
        with open(path, "rb") as f:
            raw = f.read()
        before = hashlib.sha256(raw).hexdigest()
        data, report = fn(raw)
        for r in report:
            say("  " + r)
        if data is None:
            return False
        if TRY:
            say("  (próba: nic nie zapisane)")
            return False
        if digest(path) != before:   # (someone wrote it meanwhile: again, from what is on the disk now)
            say("  plik zmienił się w trakcie - jeszcze raz")
            continue
        say("  kopia: " + backup(path))
        with open(path, "wb") as f:
            f.write(data)
        return True
    stop(os.path.basename(path) + " ciągle się zmienia - spróbuj później")


def main():
    for f in ("Items_dopisek.json", "Items_notatki.json", "IconSet_nowe.png"):
        if not os.path.exists(os.path.join(STAGING, f)):
            stop("brak staging/" + f + " (node tools/ubior/zrob_staging.js, python tools/ubior/ikony.py)")
    if editor_running():
        if not TRY:
            stop("edytor RPG Maker MZ (RPGMZ.exe) jest otwarty - zamknij go (zapisz projekt) i uruchom jeszcze raz")
        say("UWAGA: edytor jest otwarty (próba: nic nie zapisuję, więc liczę dalej)")
    say("data/Items.json:")
    a = apply(ITEMS, patch_items)
    say("img/system/IconSet.png:")
    b = apply(ICONSET, patch_icons)
    if TRY:
        say("Próba skończona.")
    elif a or b:
        say("Zainstalowane. Wtyczki na liście gry js/tawerna_wtyczki.js (python tools/wtyczki.py --sprawdz): Ubior_Data pod Equipment, Ubior pod nim, Ubior_Sklepy na końcu.")
    else:
        say("Nic do zrobienia - już zainstalowane.")


if __name__ == "__main__":
    main()
