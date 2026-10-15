# python tools/przystan/install.py [--dry-run] [--force]   - puts the harbour into the game (the RPG Maker MZ editor must be CLOSED:
# it is checked with tasklist right before EVERY file written - the user's rule)
#   1. data/Map125.json        <- tools/przystan/staging/Map125.json (build.py) with the three interiors' doors filled in: player touch;
#                                 open hours -> Door1, the door swings open, Transfer into the interior facing up; else the popup
#                                 over the hero with the building's own "closed" line (once a second)
#   2. data/Map126..128.json   <- the staged interiors (build_wnetrza.py)
#   3. data/Map111.json        <- ONE event appended: "Przejście -> Przystań" on (0,19), the end of Podgrodzie's forest trail
#                                 (player touch -> Map125 (54,19) facing left). Its tiles and every other event stay as they are.
#   4. data/MapInfos.json      125 "Przystań" (a child of 111 "Podgrodzie"), 126-128 (children of 125) in the free rows
#   5. data/Items.json         173 Śledź, 174 Dorsz, 175 Chusta matki (a keepsake: <Weight:0><Pamiatka>), 176 Smoła - appended
#                                 (ids checked free); their icons into free cells of img/system/IconSet.png (tools/przystan/art/icons)
#   6. js/plugins.js           Przystan.js registered after Act3 (before CleanHUD) - the editor drops entries it has not seen
# A map of ours changed in the editor since the last install (tools/przystan/installed.json keeps the hashes) is left alone
# (--force replaces it). Everything replaced is copied to backup_art_2026-10-14/przystan/ first. Files keep their line endings
# (all of these are LF), UTF-8, the editor's one-line-per-entry layout.
import os, sys, json, shutil, datetime, hashlib, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
DATA = ROOT + "data/"
STAGING = os.path.join(HERE, "staging")
BACKUP = ROOT + "backup_art_2026-10-14/przystan/"
ICONS = os.path.join(HERE, "art", "icons")
DRY = "--dry-run" in sys.argv
FORCE = "--force" in sys.argv
INSTALLED = os.path.join(HERE, "installed.json")

NAMES = {125: "Przystań", 126: "Chata Janka", 127: "Szopa przy pochylni", 128: "Komora celna"}
PARENT = {125: 111, 126: 125, 127: 125, 128: 125}
PODGRODZIE, ENTRY_CELL, LANDING = 111, (0, 19), (54, 19)
TRANSFER_NAME = "Przejście -> Przystań"
CLOSED = {126: "Chata Janka. Zamknięte - Janek albo na morzu, albo śpi.", 127: "Szopa przy pochylni. Zamknięte od środka.",
          128: "Komora celna. Zamknięte - celnik przyjmuje od 8 do 18."}
ITEMS = [   # id, name, description, icon file, itypeId, price, note
    (173, "Śledź", "Srebrny śledź z morza. Najlepiej upiec albo uwędzić. Janek z przystani go skupuje.", "sledz", 1, 6, "<Weight:1>"),
    (174, "Dorsz", "Tłusty dorsz z morza, rzadszy od śledzia. Upieczony starczy na dwa posiłki.", "dorsz", 1, 10, "<Weight:1>"),
    (175, "Chusta matki", "Chusta mamy w czerwone kwiaty. Haftowała ją całą zimę. Morze ją oddało - wciąż pachnie domem.", "chusta", 2, 0,
     "<Weight:0>\n<Pamiatka>"),
    (176, "Smoła", "Gęsta, czarna smoła z sosnowej karpiny. Uszczelnia łodzie i beczki.", "smola", 1, 8, "<Weight:1>"),
]
PLUGIN_ENTRY = {"name": "Przystan", "status": True,
                "description": "Przystań (mapa 125): Janek i chusta matki, Roch Szkwał i jego kuter, celnik Lorda, prom w dni promu, skup ryb, list do matki. v1.0.0",
                "parameters": {}}
PLUGIN_AFTER = "Act3"
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
        name = os.path.basename(path)
        base, ext = os.path.splitext(name)
        shutil.copy2(path, BACKUP + "%s_%s%s" % (base, STAMP, ext))


def write(path, data):
    """one file into the game: the editor checked right before it, a backup, bytes as given"""
    if editor_running():
        print("STOP: RPG Maker MZ działa - nic więcej nie zapisuję (zapisane wcześniej: zobacz wyżej)."); sys.exit(2)
    backup(path)
    with open(path, "wb") as f:
        f.write(data)
    print("  zapisano", os.path.relpath(path, ROOT))


# ------------------------------------------------------------------------------------------------ the doors of Map125
OPEN_ROUTE = [{"code": 36, "indent": None}, {"code": 17, "indent": None}, {"code": 15, "indent": None, "parameters": [3]},
              {"code": 18, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}, {"code": 19, "indent": None},
              {"code": 15, "indent": None, "parameters": [3]}]


def closed_script(text):
    return ("const t = $gameTemp, k = this.eventId(); t._townDoorPop = t._townDoorPop || {}; "
            "if (!(t._townDoorPop[k] > Graphics.frameCount - 60)) { t._townDoorPop[k] = Graphics.frameCount; "
            "Tawerna.popup(%s, { color: \"info\" }); }" % json.dumps(text, ensure_ascii=False))


def door_list(mid, lx, ly, hours, text, picture=True):
    go = [{"code": 250, "indent": 1, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]}]
    if picture:
        go.append({"code": 205, "indent": 1, "parameters": [0, {"list": OPEN_ROUTE + [{"code": 0}], "repeat": False, "skippable": False, "wait": True}]})
        go += [{"code": 505, "indent": 1, "parameters": [c]} for c in OPEN_ROUTE]
    go.append({"code": 201, "indent": 1, "parameters": [0, mid, lx, ly, 8, 0]})
    h0, h1 = hours
    cond = "(function(h){ return h >= %d && h < %d; })($gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 12)" % (h0, h1)
    return ([{"code": 111, "indent": 0, "parameters": [12, cond]}] + go + [{"code": 0, "indent": 1, "parameters": []},
            {"code": 411, "indent": 0, "parameters": []},
            {"code": 355, "indent": 1, "parameters": [closed_script(text)]},
            {"code": 0, "indent": 1, "parameters": []},
            {"code": 412, "indent": 0, "parameters": []},
            {"code": 0, "indent": 0, "parameters": []}])


def patched_map125():
    raw = open(os.path.join(STAGING, "Map125.json"), "rb").read()
    assert b"\r\n" not in raw
    lines = raw.decode("utf-8").split("\n")
    meta = load(os.path.join(STAGING, "Map125_meta.json"))
    by_door = {}
    for mid in (126, 127, 128):
        im = load(os.path.join(STAGING, "Map%03d_meta.json" % mid))
        for ex in im["exits"]:
            by_door[ex["door"]] = (mid, ex["landing"][0], ex["landing"][1], ex["town"])
    hours = {b["event_id"]: tuple(b["hours"]) for b in meta["buildings"] if b["interior"]}
    done = []
    for i, l in enumerate(lines):
        if not l.startswith('{"id":'): continue
        comma = l.endswith(",")
        e = json.loads(l[:-1] if comma else l)
        if e["id"] not in by_door: continue
        mid, lx, ly, town = by_door[e["id"]]
        assert e["name"].startswith("Drzwi: "), e["name"]
        assert [e["x"], e["y"] + 1] == town, (e["id"], town)
        pg = e["pages"][0]
        pg["list"] = door_list(mid, lx, ly, hours[e["id"]], CLOSED[mid], picture=bool(pg["image"]["characterName"]))
        pg["trigger"] = 1
        lines[i] = dump(e) + ("," if comma else "")
        done.append((e["id"], e["name"], mid))
    assert len(done) == 3, done
    out = "\n".join(lines).encode("utf-8")
    json.loads(out.decode("utf-8"))
    return out, done


# ------------------------------------------------------------------------------------------------ Map111: the one transfer event
def patched_map111():
    path = DATA + "Map111.json"
    raw = open(path, "rb").read()
    assert b"\r\n" not in raw
    m = json.loads(raw.decode("utf-8"))
    if any(e and e.get("name") == TRANSFER_NAME for e in m["events"]):
        return None, "już jest"
    x, y = ENTRY_CELL
    others = [e for e in m["events"] if e and e["x"] == x and e["y"] == y and not e["name"].startswith("Miejsce:")]
    assert not others, "na (0,19) Map111 stoi już inne zdarzenie: %s" % [e["name"] for e in others]
    lines = raw.decode("utf-8").split("\n")
    close = max(i for i, l in enumerate(lines) if l == "]")
    last = close - 1
    assert lines[last].startswith("{") and lines[last].endswith("}"), lines[last][:40]
    new_id = max(e["id"] for e in m["events"] if e) + 1
    page = {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
                           "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": False, "image": {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0},
            "list": [{"code": 201, "indent": 0, "parameters": [0, 125, LANDING[0], LANDING[1], 4, 0]}, {"code": 0, "indent": 0, "parameters": []}],
            "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": 0, "stepAnime": False, "through": False, "trigger": 1, "walkAnime": True}
    ev = {"id": new_id, "name": TRANSFER_NAME, "note": "", "pages": [page], "x": x, "y": y}
    lines[last] = lines[last] + ","
    lines.insert(close, dump(ev))
    out = "\n".join(lines).encode("utf-8")
    js = json.loads(out.decode("utf-8"))
    assert js["events"][new_id]["name"] == TRANSFER_NAME
    assert js["data"] == m["data"], "kafelki Map111 nie mogą się zmienić"
    return out, "zdarzenie %d na (%d,%d)" % (new_id, x, y)


# ------------------------------------------------------------------------------------------------ MapInfos
def patched_mapinfos():
    path = DATA + "MapInfos.json"
    raw = open(path, "rb").read()
    assert b"\r\n" not in raw
    lines = raw.decode("utf-8").split("\n")
    infos = json.loads(raw.decode("utf-8"))
    order = max(o["order"] for o in infos if o and o["id"] not in NAMES) + 1
    for k, mid in enumerate(sorted(NAMES)):
        line = mid + 1
        cur = lines[line].rstrip(",")
        if cur != "null":
            o = json.loads(cur)
            assert o["id"] == mid and o["name"] == NAMES[mid], "MapInfos: id %d zajęte przez %s" % (mid, o.get("name"))
            continue
        row = {"id": mid, "expanded": mid == 125, "name": NAMES[mid], "order": order + k, "parentId": PARENT[mid], "scrollX": 0, "scrollY": 0}
        lines[line] = dump(row) + ("," if lines[line].endswith(",") else "")
    out = "\n".join(lines).encode("utf-8")
    js = json.loads(out.decode("utf-8"))
    for mid in NAMES: assert js[mid]["id"] == mid and js[mid]["parentId"] == PARENT[mid]
    return out


# ------------------------------------------------------------------------------------------------ Items + icons
def free_icon_cells(img, n):
    from PIL import Image
    W, H = img.size
    cols = W // 32
    free = []
    for i in range(cols * (H // 32) - 1, 0, -1):          # from the end: the cells others pick first stay free
        x, y = (i % cols) * 32, (i // cols) * 32
        if img.crop((x, y, x + 32, y + 32)).getbbox() is None: free.append(i)
        if len(free) >= n: break
    return sorted(free)


def patched_items_and_icons():
    from PIL import Image
    path = DATA + "Items.json"
    raw = open(path, "rb").read()
    assert b"\r\n" not in raw
    items = json.loads(raw.decode("utf-8"))
    have = {it["id"]: it for it in items if it}
    todo = [t for t in ITEMS if not (t[0] in have and have[t[0]]["name"] == t[1])]
    for t in todo:
        assert t[0] == len(items) + todo.index(t), "Items.json: id %d nie jest kolejnym wolnym (ostatnie %d)" % (t[0], len(items) - 1)
    if not todo:
        return None, None, {t[0]: have[t[0]]["iconIndex"] for t in ITEMS}
    ipath = ROOT + "img/system/IconSet.png"
    icon_img = Image.open(ipath).convert("RGBA")
    cells = free_icon_cells(icon_img, len(todo))
    assert len(cells) == len(todo), "za mało wolnych pól w IconSet.png"
    icons = {}
    cols = icon_img.size[0] // 32
    for t, cell in zip(todo, cells):
        pic = Image.open(os.path.join(ICONS, t[3] + ".png")).convert("RGBA")
        assert pic.size == (32, 32), (t[3], pic.size)
        icon_img.paste(pic, ((cell % cols) * 32, (cell // cols) * 32))
        icons[t[0]] = cell
    lines = raw.decode("utf-8").split("\n")
    close = max(i for i, l in enumerate(lines) if l == "]")
    last = close - 1
    assert lines[last].startswith("{"), lines[last][:40]
    new = []
    for t in todo:
        iid, name, desc, _, itype, price, note = t
        it = {"id": iid, "animationId": 0, "consumable": False, "damage": {"critical": False, "elementId": 0, "formula": "0", "type": 0, "variance": 20},
              "description": desc, "effects": [], "hitType": 0, "iconIndex": icons[iid], "itypeId": itype, "name": name, "note": note,
              "occasion": 3, "price": price, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0}
        new.append(dump(it))
    lines[last] = lines[last] + ","
    lines[close:close] = [l + ("," if k < len(new) - 1 else "") for k, l in enumerate(new)]
    out = "\n".join(lines).encode("utf-8")
    js = json.loads(out.decode("utf-8"))
    for t in ITEMS: assert js[t[0]]["name"] == t[1]
    import io
    buf = io.BytesIO()
    icon_img.save(buf, format="PNG")
    return out, buf.getvalue(), icons


# ------------------------------------------------------------------------------------------------ plugins.js
def patched_plugins():
    path = ROOT + "js/plugins.js"
    raw = open(path, "rb").read()
    crlf = b"\r\n" in raw
    s = raw.decode("utf-8").replace("\r\n", "\n")
    if '"name":"Przystan"' in s:
        return None
    lines = s.split("\n")
    idx = [i for i, l in enumerate(lines) if l.startswith('{"name":"%s",' % PLUGIN_AFTER)]
    assert len(idx) == 1, "plugins.js: brak %s" % PLUGIN_AFTER
    i = idx[0]
    assert lines[i].endswith(","), "plugins.js: %s jest ostatni?" % PLUGIN_AFTER
    lines.insert(i + 1, dump(PLUGIN_ENTRY) + ",")
    out = "\n".join(lines)
    return (out.replace("\n", "\r\n") if crlf else out).encode("utf-8")


# ------------------------------------------------------------------------------------------------ main
def main():
    if editor_running():
        print("STOP: RPG Maker MZ działa - zamknij edytor (zapis w edytorze nadpisałby data/)."); sys.exit(2)
    inst = load(INSTALLED) if os.path.exists(INSTALLED) else {}
    plan = []
    m125, doors = patched_map125()
    plan.append((DATA + "Map125.json", m125))
    for mid in (126, 127, 128):
        plan.append((DATA + "Map%03d.json" % mid, open(os.path.join(STAGING, "Map%03d.json" % mid), "rb").read()))
    # our maps changed in the editor since the last install stay (unless --force)
    keep = []
    for path, data in list(plan):
        name = os.path.basename(path)
        if os.path.exists(path) and name in inst and sha(open(path, "rb").read()) != inst[name] and not FORCE:
            keep.append(name); plan.remove((path, data))
    m111, why111 = patched_map111()
    if m111: plan.append((DATA + "Map111.json", m111))
    plan.append((DATA + "MapInfos.json", patched_mapinfos()))
    items, iconset, icons = patched_items_and_icons()
    if items:
        plan.append((ROOT + "img/system/IconSet.png", iconset))
        plan.append((DATA + "Items.json", items))
    plug = patched_plugins()
    if plug: plan.append((ROOT + "js/plugins.js", plug))
    print("drzwi Map125:", ", ".join("%d %s -> Map%d" % d for d in doors))
    print("Map111:", why111)
    print("ikony przedmiotów:", icons)
    if keep: print("POMINIĘTE (zmienione w edytorze; --force zastąpi):", keep)
    print("do zapisu:", [os.path.relpath(p, ROOT) for p, _ in plan])
    if DRY:
        print("próba: nic nie zapisano"); return
    for path, data in plan:
        if os.path.exists(path) and open(path, "rb").read() == data:
            print("  bez zmian", os.path.relpath(path, ROOT)); continue
        write(path, data)
    for mid in NAMES:
        p = DATA + "Map%03d.json" % mid
        if os.path.exists(p): inst["Map%03d.json" % mid] = sha(open(p, "rb").read())
    with open(INSTALLED, "wb") as f:
        f.write(json.dumps(inst, indent=1).encode("utf-8"))
    print("gotowe; kopie w", os.path.relpath(BACKUP, ROOT))


if __name__ == "__main__":
    main()
