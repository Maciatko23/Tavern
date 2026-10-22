# python tools/orzel/install.py [--install] [--force]
# Biały orzeł (etap 2): what goes into data/ and js/plugins.js and img/system/IconSet.png. Without --install: built into
# tools/orzel/staging/ (the files as they would be, ZMIANY.txt with their SHA-256) - nothing in the game changes.
#   data/Map175.json       "Orla Grań" (tools/orzel/gran.py)
#   data/MapInfos.json     + 175 "Orla Grań" under 13 "Góry i kamieniołom"
#   data/Items.json        + 182 Orle jajo, 183 Rękawica sokolnika, 184 Pióro białego orła
#   img/system/IconSet.png + icons 453-457 (tools/orzel/icons, from props.py)
#   js/plugins.js          + Orzel_Data (after Kruk_Data, above TownQuests_Data), Orzel and Orzel_Lot (after Starcia)
# --install writes them: refuses while the RPG Maker MZ editor runs (checked right before writing); backups to
# backup_art_2026-10-18/orzel/; repeatable (what is there already is left as it is, our entries are found by id / name).
# A Map175.json changed in the editor since the last install (tools/orzel/installed.json) is left alone unless --force.
import os, sys, json, hashlib, shutil, datetime, subprocess, io
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
DATA = ROOT + "data/"
STAGING = os.path.join(HERE, "staging")
BACKUP = ROOT + "backup_art_2026-10-18/orzel/"
sys.path.insert(0, HERE)
sha = lambda b: hashlib.sha256(b).hexdigest()

ITEMS = [
    {"id": 182, "name": "Orle jajo", "iconIndex": 453, "itypeId": 2, "note": "<Weight:3>\n<Pamiatka>",
     "description": "Ostatnie jajo białej orlicy z Orlej Grani. Ciepłe. Trzeba je ogrzać: przy ogniu, w domu albo śpiąc z nim przy sobie."},
    {"id": 183, "name": "Rękawica sokolnika", "iconIndex": 454, "itypeId": 2, "note": "<Weight:1>",
     "description": "Gruba skórzana rękawica do łokcia. Na niej usiądzie młody orzeł - pazury nie przebiją skóry."},
    {"id": 184, "name": "Pióro białego orła", "iconIndex": 455, "itypeId": 2, "note": "<Weight:0>\n<Pamiatka>",
     "description": "Długie na łokieć, białe jak sól. Zrzucił je twój orzeł. Brat Kleofas chciałby je zobaczyć."},
]
ITEM_BASE = {"animationId": 0, "consumable": False, "damage": {"critical": False, "elementId": 0, "formula": "0", "type": 0, "variance": 20},
             "effects": [], "hitType": 0, "occasion": 3, "price": 0, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0}
ITEM_KEYS = ["id", "animationId", "consumable", "damage", "description", "effects", "hitType", "iconIndex", "itypeId", "name", "note", "occasion",
             "price", "repeats", "scope", "speed", "successRate", "tpGain"]
PLUGINS = [
    ("Kruk_Data", {"name": "Orzel_Data", "status": True, "description": "Dane białego orła: etapy wzrostu, opieka, walka, lot, arkusze, teksty, zadania D29 „Jajo z grani” i W13 „Skrzydlata Straż”. v1.0.0", "parameters": {}}),
    ("Starcia", {"name": "Orzel", "status": True, "description": "Biały orzeł: jajo z Orlej Grani, pięć etapów wzrostu, opieka, gniazdo, walka szponami i dziobem, zadania D29 i W13. v1.0.0", "parameters": {}}),
    ("Orzel", {"name": "Orzel_Lot", "status": True, "description": "Lot na białym orle: oddalona kamera (x0,5 / x1), lot nad wszystkim, przeloty krawędziami map, lądowanie, nurkowanie. v1.0.0", "parameters": {}}),
]


def read(p):
    with open(p, "rb") as f:
        return f.read()


def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def serialize_map(mp):
    props = {k: v for k, v in mp.items() if k not in ("data", "events")}
    ev = mp["events"]
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(mp["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(ev) - 1 else "") for i, e in enumerate(ev)]
    lines += ["]", "}"]
    return "\n".join(lines).encode("utf-8")


def list_lines(raw):
    """the editor's arrays (Items.json, MapInfos.json): '[', 'null,', one object a line, ']' (LF)"""
    arr = json.loads(raw.decode("utf-8"))
    return arr


def write_list(arr):
    lines = ["["]
    for i, o in enumerate(arr):
        lines.append(("null" if o is None else dump(o)) + ("," if i < len(arr) - 1 else ""))
    lines.append("]")
    return "\n".join(lines).encode("utf-8")


def editor_running():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return False
    return any(l.lower().startswith("rpgmz") or "rpg maker" in l.lower() for l in out.splitlines())


def build_map():
    import gran
    j = gran.build().to_json()
    return serialize_map(j)


def patch_mapinfos(raw):
    arr = list_lines(raw)
    while len(arr) <= 175:
        arr.append(None)
    if arr[175] and arr[175].get("name") != "Orla Grań":
        sys.exit("MapInfos: 175 jest zajęta (%s) - nie ruszam" % arr[175].get("name"))
    if not arr[175]:
        order = max((m.get("order", 0) for m in arr if m), default=0) + 1
        arr[175] = {"id": 175, "expanded": False, "name": "Orla Grań", "order": order, "parentId": 13, "scrollX": 960, "scrollY": 720}
    out = write_list(arr)
    if raw.endswith(b"\n") and not out.endswith(b"\n"):
        out += b"\n"
    return out


def patch_items(raw):
    arr = list_lines(raw)
    for it in ITEMS:
        i = it["id"]
        while len(arr) <= i:
            arr.append(None)
        cur = arr[i]
        if cur and cur.get("name") and cur.get("name") != it["name"]:
            sys.exit("Items: %d jest zajęty (%s) - nie ruszam" % (i, cur.get("name")))
        full = dict(ITEM_BASE)
        full.update(it)
        arr[i] = {k: full[k] for k in ITEM_KEYS}
    out = write_list(arr)
    if raw.endswith(b"\n") and not out.endswith(b"\n"):
        out += b"\n"
    return out


def patch_iconset(raw):
    from PIL import Image
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    for idx in range(453, 458):
        p = os.path.join(HERE, "icons", "%d.png" % idx)
        if not os.path.exists(p):
            sys.exit("brak ikony %s - najpierw tools/orzel/props.py" % p)
        x, y = (idx % 16) * 32, (idx // 16) * 32
        cell = im.crop((x, y, x + 32, y + 32))
        new = Image.open(p).convert("RGBA")
        if cell.getbbox() and cell.tobytes() != new.tobytes():
            # (something else there: only ours may be replaced - ours have the same size and are compared by the staging's SHA)
            prev = os.path.join(HERE, "icons", "zainstalowane_%d.png" % idx)
            if not os.path.exists(prev) or Image.open(prev).convert("RGBA").tobytes() != cell.tobytes():
                sys.exit("IconSet: ikona %d jest zajęta przez coś innego - nie ruszam" % idx)
        im.paste(Image.new("RGBA", (32, 32), (0, 0, 0, 0)), (x, y))
        im.alpha_composite(new, (x, y))
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return buf.getvalue()


def patch_plugins(raw):
    text = raw.decode("utf-8")
    lines = text.split("\n")
    names = []
    for l in lines:
        if l.startswith('{"name":'):
            names.append(json.loads(l.rstrip(",")).get("name"))
    for after, entry in PLUGINS:
        if entry["name"] in names:
            continue
        idx = None
        for i, l in enumerate(lines):
            if l.startswith('{"name":"%s"' % after):
                idx = i
        if idx is None:
            sys.exit("plugins.js: nie ma %s - nie wiem, gdzie wpisać %s" % (after, entry["name"]))
        line = dump(entry)
        # (the list's lines end with "," except the last one before "];")
        lines.insert(idx + 1, line + ",")
        names.append(entry["name"])
    # the last entry has no comma
    out = "\n".join(lines)
    return out.encode("utf-8")


def main():
    install = "--install" in sys.argv
    force = "--force" in sys.argv
    files = {
        "data/Map175.json": build_map(),
        "data/MapInfos.json": patch_mapinfos(read(DATA + "MapInfos.json")),
        "data/Items.json": patch_items(read(DATA + "Items.json")),
        "img/system/IconSet.png": patch_iconset(read(ROOT + "img/system/IconSet.png")),
        "js/plugins.js": patch_plugins(read(ROOT + "js/plugins.js")),
    }
    os.makedirs(STAGING, exist_ok=True)
    report = []
    for rel, b in files.items():
        dst = os.path.join(STAGING, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "wb") as f:
            f.write(b)
        cur = ROOT + rel
        same = os.path.exists(cur) and read(cur) == b
        report.append("%s  %s  %s" % (sha(b), rel, "bez zmian" if same else "NOWY" if not os.path.exists(cur) else "zmieniony"))
    with open(os.path.join(STAGING, "ZMIANY.txt"), "w", encoding="utf-8") as f:
        f.write("Biały orzeł - pliki do instalacji (python tools/orzel/install.py --install, przy zamkniętym edytorze)\n")
        f.write("\n".join(report) + "\n")
    print("\n".join(report))
    if not install:
        print("-> tools/orzel/staging (bez instalacji)")
        return
    rec_path = os.path.join(HERE, "installed.json")
    rec = json.loads(read(rec_path).decode("utf-8")) if os.path.exists(rec_path) else {}
    if os.path.exists(DATA + "Map175.json") and "Map175.json" in rec and not force:
        cur = sha(read(DATA + "Map175.json"))
        if cur != rec["Map175.json"] and cur != sha(files["data/Map175.json"]):
            print("SKIP data/Map175.json: zmieniona w edytorze od ostatniej instalacji (--force zastępuje)")
            files.pop("data/Map175.json")
    if editor_running():
        sys.exit("STOP: edytor RPG Maker MZ jest otwarty - zamknij go i uruchom jeszcze raz.")
    os.makedirs(BACKUP, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%H%M%S")
    for rel, b in files.items():
        cur = ROOT + rel
        if os.path.exists(cur):
            if read(cur) == b:
                continue
            shutil.copy2(cur, BACKUP + os.path.basename(rel).replace(".", "_przed_%s." % stamp, 1))
        with open(cur, "wb") as f:
            f.write(b)
        print("zapisano", rel)
        if rel == "data/Map175.json":
            rec["Map175.json"] = sha(b)
    for idx in range(453, 458):
        shutil.copy2(os.path.join(HERE, "icons", "%d.png" % idx), os.path.join(HERE, "icons", "zainstalowane_%d.png" % idx))
    with open(rec_path, "wb") as f:
        f.write((json.dumps(rec, indent=1, sort_keys=True) + "\n").encode("utf-8"))
    print("zainstalowane - kopie w", BACKUP)


if __name__ == "__main__":
    main()
