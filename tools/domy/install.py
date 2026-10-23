# python tools/domy/install.py [--dry-run] [--force]   - puts the two homes after the field into the game (Homes.js v1.1.0,
# 2026-10-15, the user's "wszystko ok" to docs/strata_pola/KONCEPCJA_DOMY.md). The RPG Maker MZ editor must be CLOSED: it is
# checked with tasklist right before EVERY file written (the user's rule).
#   1. data/Map111.json   <- tools/domy/staging/Map111.json (podgrodzie_zagroda.py, made from data/Map111.json just before: 20 rows
#                           added at the bottom - Chata pod lasem and its plot, region 8, <BuildRegion:8>; nothing old moves)
#   2. data/Map154.json   <- Chata pod lasem (the room), Map168.json <- Spalona zagroda (ruina.py), Map169.json <- Dom Ługów (the
#                           rebuilt house's room) - build.py; data/Map170.json (the town house's yard of v1.0.0) removed
#   3. data/MapInfos.json   154 "Chata pod lasem" (child of 111), 168 "Spalona zagroda" (child of 23 Skraj lasu), 169 "Dom Ługów"
#                           (child of 168); 170 emptied (null). The rest of the lines as they were
#   4. js/tawerna_wtyczki.js Homes's line (the game's plugin list - since 2026-10-23 not js/plugins.js): the new description and
#                          parameters (priceHut, priceFarm); registered after TownQuests
#                           if the editor dropped it
# Map111 is the user's map: written only when it is still the 46 x 36 one this was staged from (the stage is checked against it).
# A map of ours changed in the editor since the last install (installed.json keeps the hashes) is left alone (--force replaces it).
# Everything replaced or removed is copied to backup_art_2026-10-15/strata_pola/install/ first. LF, UTF-8, the editor's layout.
import os, sys, json, shutil, datetime, hashlib, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
DATA = ROOT + "data/"
STAGING = os.path.join(HERE, "staging")
BACKUP = ROOT + "backup_art_2026-10-15/strata_pola/install/"
DRY = "--dry-run" in sys.argv
FORCE = "--force" in sys.argv
INSTALLED = os.path.join(HERE, "installed.json")

NAMES = {154: "Chata pod lasem", 168: "Spalona zagroda", 169: "Dom Ługów"}
PARENT = {154: 111, 168: 23, 169: 168}
GONE = [170]
PLUGIN = {"name": "Homes", "status": True,
          "description": "Ziemia: pole dziadka po stracie (ludzie Lorda, znak, dni na wyniesienie dobytku, straż), Chata pod lasem u sołtysa i Spalona zagroda Ługów do odbudowy (zadanie D21). v1.1.0",
          "parameters": {"priceHut": "600", "priceFarm": "350"}}
PLUGIN_AFTER = "TownQuests"
sha = lambda b: hashlib.sha256(b).hexdigest()


def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def load(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def editor_running():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return True   # (cannot tell: better not to write)
    return any(l.lower().startswith("rpgmz") or "rpg maker" in l.lower() for l in out.splitlines())


STAMP = datetime.datetime.now().strftime("%H%M%S")


def backup(path):
    if os.path.exists(path):
        os.makedirs(BACKUP, exist_ok=True)
        base, ext = os.path.splitext(os.path.basename(path))
        shutil.copy2(path, BACKUP + "%s_%s%s" % (base, STAMP, ext))


def stop_if_editor():
    if editor_running():
        print("STOP: RPG Maker MZ działa - nic więcej nie zapisuję (zapisane wcześniej: zobacz wyżej)."); sys.exit(2)


def write(path, data):
    """one file into the game: the editor checked right before it, a backup, bytes as given"""
    stop_if_editor()
    backup(path)
    with open(path, "wb") as f:
        f.write(data)
    print("  zapisano", os.path.relpath(path, ROOT))


def remove(path):
    stop_if_editor()
    backup(path)
    os.remove(path)
    print("  usunięto", os.path.relpath(path, ROOT), "(kopia w", os.path.relpath(BACKUP, ROOT) + ")")


def staged_map111():
    """the enlarged Podgrodzie - only while data/Map111.json is the very map it was made from (its old rows and events unchanged)"""
    cur, new = load(DATA + "Map111.json"), load(os.path.join(STAGING, "Map111.json"))
    if cur["height"] != 36:
        return None, "data/Map111.json ma już %d rzędów - bez zmian" % cur["height"]
    W, H0, H1 = cur["width"], cur["height"], new["height"]
    meta = load(os.path.join(STAGING, "Map111_zagroda_meta.json"))
    n = len(cur["events"])
    assert new["width"] == W and H1 == H0 + meta["rows_added"], "Map111: zły rozmiar etapu"
    if any(cur["events"][i] != new["events"][i] for i in range(n)):
        sys.exit("STOP: zdarzenia Map111 zmieniły się od przygotowania - uruchom najpierw tools/domy/podgrodzie_zagroda.py")
    changed = sum(1 for z in range(6) for y in range(H0) for x in range(W) if cur["data"][(z * H0 + y) * W + x] != new["data"][(z * H1 + y) * W + x])
    if changed > 120:
        sys.exit("STOP: kafelki Map111 różnią się od etapu w %d miejscach - uruchom najpierw tools/domy/podgrodzie_zagroda.py" % changed)
    return open(os.path.join(STAGING, "Map111.json"), "rb").read(), "powiększenie o %d rzędów (zmienione stare pola: %d)" % (H1 - H0, changed)


def patched_mapinfos():
    path = DATA + "MapInfos.json"
    raw = open(path, "rb").read()
    assert b"\r\n" not in raw
    infos = json.loads(raw.decode("utf-8"))
    lines = raw.decode("utf-8").split("\n")
    # the editor's layout: "[", then one line per id ("null," / "{...},"), the last without a comma, then "]"
    assert lines[0] == "[" and lines[1] == "null,", lines[:2]
    close = max(i for i, l in enumerate(lines) if l == "]")
    rows = [l.rstrip(",") for l in lines[1:close]]
    assert len(rows) == len(infos), (len(rows), len(infos))
    top = max(NAMES)
    while len(rows) <= top: rows.append("null")
    order = max(o["order"] for o in infos if o and o["id"] not in NAMES and o["id"] not in GONE) + 1
    for k, mid in enumerate(sorted(NAMES)):
        cur = rows[mid]
        o = json.loads(cur) if cur != "null" else None
        if o and o["name"] == NAMES[mid] and o["parentId"] == PARENT[mid]: continue
        if o: assert o["name"] in ("Chałupa z desek", "Ogródek za chałupą", "Dom z podwórzem"), "MapInfos: id %d zajęte przez %s" % (mid, o.get("name"))
        rows[mid] = dump({"id": mid, "expanded": False, "name": NAMES[mid], "order": o["order"] if o else order + k, "parentId": PARENT[mid],
                          "scrollX": o["scrollX"] if o else 0, "scrollY": o["scrollY"] if o else 0})
    for mid in GONE:
        if mid < len(rows) and rows[mid] != "null":
            o = json.loads(rows[mid])
            assert o["name"] == "Podwórze domu", "MapInfos: id %d to %s - nie ruszam" % (mid, o["name"])
            rows[mid] = "null"
    while rows and rows[-1] == "null" and len(rows) - 1 > max(i for i, r in enumerate(rows) if r != "null"): rows.pop()
    out_lines = ["["] + [r + ("," if i < len(rows) - 1 else "") for i, r in enumerate(rows)] + lines[close:]
    out = "\n".join(out_lines).encode("utf-8")
    js = json.loads(out.decode("utf-8"))
    for mid in NAMES: assert js[mid]["id"] == mid and js[mid]["parentId"] == PARENT[mid] and js[mid]["name"] == NAMES[mid]
    for i, o in enumerate(infos):   # (every other row that was there is there as it was)
        if o and i not in NAMES and i not in GONE: assert js[i] == o, i
    for mid in GONE: assert mid >= len(js) or js[mid] is None
    return out


def patched_plugins():
    path = ROOT + "js/tawerna_wtyczki.js"   # (the game's plugin list, one entry a line like js/plugins.js)
    raw = open(path, "rb").read()
    crlf = b"\r\n" in raw
    lines = raw.decode("utf-8").replace("\r\n", "\n").split("\n")
    line = dump(PLUGIN) + ","
    mine = [i for i, l in enumerate(lines) if l.startswith('{"name":"%s",' % PLUGIN["name"])]
    if mine:
        i = mine[0]
        if lines[i] == line or lines[i] == line[:-1]: return None
        lines[i] = line if lines[i].endswith(",") else line[:-1]
    else:
        idx = [i for i, l in enumerate(lines) if l.startswith('{"name":"%s",' % PLUGIN_AFTER)]
        assert len(idx) == 1, "lista gry (js/tawerna_wtyczki.js): brak %s" % PLUGIN_AFTER
        assert lines[idx[0]].endswith(","), "lista gry: %s jest ostatni?" % PLUGIN_AFTER
        lines.insert(idx[0] + 1, line)
    out = "\n".join(lines)
    return (out.replace("\n", "\r\n") if crlf else out).encode("utf-8")


def main():
    stop_if_editor()
    inst = load(INSTALLED) if os.path.exists(INSTALLED) else {}
    plan, keep, gone = [], [], []
    m111, why = staged_map111()
    print("Map111:", why)
    if m111: plan.append((DATA + "Map111.json", m111))
    for mid in sorted(NAMES):
        path, data = DATA + "Map%03d.json" % mid, open(os.path.join(STAGING, "Map%03d.json" % mid), "rb").read()
        name = os.path.basename(path)
        if os.path.exists(path) and not FORCE and (name not in inst or sha(open(path, "rb").read()) != inst[name]):
            keep.append(name); continue
        plan.append((path, data))
    for mid in GONE:
        path = DATA + "Map%03d.json" % mid
        name = os.path.basename(path)
        if not os.path.exists(path): continue
        if not FORCE and (name not in inst or sha(open(path, "rb").read()) != inst[name]): keep.append(name); continue
        gone.append(path)
    plan.append((DATA + "MapInfos.json", patched_mapinfos()))
    plug = patched_plugins()
    if plug: plan.append((ROOT + "js/tawerna_wtyczki.js", plug))
    if keep: print("POMINIĘTE (zmienione w edytorze albo cudze; --force zastąpi):", keep)
    print("do zapisu:", [os.path.relpath(p, ROOT) for p, _ in plan], "do usunięcia:", [os.path.relpath(p, ROOT) for p in gone])
    if DRY:
        print("próba: nic nie zapisano"); return
    for path, data in plan:
        if os.path.exists(path) and open(path, "rb").read() == data:
            print("  bez zmian", os.path.relpath(path, ROOT)); continue
        write(path, data)
    for path in gone: remove(path)
    for mid in list(NAMES) + [111]:
        p = DATA + "Map%03d.json" % mid
        if os.path.exists(p): inst["Map%03d.json" % mid] = sha(open(p, "rb").read())
    for mid in GONE: inst.pop("Map%03d.json" % mid, None)
    open(INSTALLED, "wb").write(json.dumps(inst, indent=1).encode("utf-8"))
    print("gotowe")


if __name__ == "__main__":
    main()
