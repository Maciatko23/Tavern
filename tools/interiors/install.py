# python install.py [--dry-run]   - puts the staged town interiors into the game (the RPG Maker MZ editor must be CLOSED)
#   1. data/Map102..110.json   <- tools/interiors/staging (already in the editor's file layout)
#   2. data/MapInfos.json      entries 102..110 appended (children of Map008 "Okolice Tawerny"), the other lines untouched
#   3. data/Map008.json        the door events' pages only: player touch (walk into the door; the action button facing
#                              it works too); open hours -> the door opens (Door1, the door picture turns open) and
#                              Transfer Player into the interior facing up; else Tawerna.popup("Zamknięte.") (once a second)
#                              + one new event: "Drzwi: Dzwonnica" (236) on the bell (48,30), the tower had no door
# Everything replaced is copied to backup_art_2026-10-04/interiors/ first. Lines of Map008/MapInfos that are not
# ours are written back byte for byte (the editor's one-event-per-line layout, LF).
import os, sys, json, shutil, subprocess, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(ROOT, "data")
STAGING = os.path.join(HERE, "staging")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-04", "interiors")
DRY = "--dry-run" in sys.argv

NAMES = {102: "Piekarnia", 103: "Kantor", 104: "Ratusz", 105: "Dom kowala", 106: "Dom garbarza", 107: "Dom woziwody",
         108: "Dzwonnica", 109: "Dom mieszczan", 110: "Izba pod skałą"}
# open hours by building (from TownLife_Data.js: the resident is up and about); None = always open
HOURS = {102: (6, 21), 103: (8, 21), 104: (8, 18), 105: (6, 21), 106: (6, 21), 107: (6, 21), 108: None, 109: (6, 21), 110: (6, 21)}
BELL_DOOR = {"id": 236, "x": 48, "y": 30, "name": "Drzwi: Dzwonnica", "note": "<Town:door=dzwonnica>"}

def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))

def editor_running():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return False
    return any(l.lower().startswith("rpgmz") for l in out.splitlines())

def staged():
    out = {}
    for mid in NAMES:
        p = os.path.join(STAGING, "Map%03d.json" % mid)
        meta = json.load(open(os.path.join(STAGING, "Map%03d_meta.json" % mid), encoding="utf-8"))
        out[mid] = (p, meta)
    return out

OPEN_ROUTE = [{"code": 36, "indent": None}, {"code": 17, "indent": None}, {"code": 15, "indent": None, "parameters": [3]},
              {"code": 18, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}, {"code": 19, "indent": None},
              {"code": 15, "indent": None, "parameters": [3]}]

# closed: the popup over the hero, at most once a second per door (the door is walked into: a bump starts it every frame)
CLOSED_SCRIPT = ("const t = $gameTemp, k = this.eventId(); t._townDoorPop = t._townDoorPop || {}; "
                 "if (!(t._townDoorPop[k] > Graphics.frameCount - 60)) { t._townDoorPop[k] = Graphics.frameCount; "
                 "Tawerna.popup(\"Zamknięte.\", { color: \"info\" }); }")

def door_list(mid, lx, ly, hours, picture=True):
    """the door's commands: [if open hours] Door1, the door swings open, Transfer (fade black, facing up) [else] popup"""
    go = [{"code": 250, "indent": 1, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]}]
    if picture:
        go.append({"code": 205, "indent": 1, "parameters": [0, {"list": OPEN_ROUTE + [{"code": 0}], "repeat": False, "skippable": False, "wait": True}]})
        go += [{"code": 505, "indent": 1, "parameters": [c]} for c in OPEN_ROUTE]
    go.append({"code": 201, "indent": 1, "parameters": [0, mid, lx, ly, 8, 0]})
    if hours is None:
        return [dict(c, indent=0) for c in go] + [{"code": 0, "indent": 0, "parameters": []}]
    h0, h1 = hours
    cond = "(function(h){ return h >= %d && h < %d; })($gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 12)" % (h0, h1)
    return ([{"code": 111, "indent": 0, "parameters": [12, cond]}] + go + [{"code": 0, "indent": 1, "parameters": []},
            {"code": 411, "indent": 0, "parameters": []},
            {"code": 355, "indent": 1, "parameters": [CLOSED_SCRIPT]},
            {"code": 0, "indent": 1, "parameters": []},
            {"code": 412, "indent": 0, "parameters": []},
            {"code": 0, "indent": 0, "parameters": []}])

def blank_page():
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
                           "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": True, "image": {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0},
            "list": [], "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": 1, "stepAnime": False, "through": False, "trigger": 0, "walkAnime": False}

def doors_plan(st):
    """door event id -> (interior id, landing x, y)"""
    plan = {}
    for mid, (p, meta) in st.items():
        for ex in meta["exits"]:
            plan[ex["door"]] = (mid, ex["landing"][0], ex["landing"][1])
    return plan

def patch_map008(plan):
    path = os.path.join(DATA, "Map008.json")
    raw = open(path, "rb").read()
    assert b"\r\n" not in raw
    lines = raw.decode("utf-8").split("\n")
    done, seen_ids = [], set()
    for i, l in enumerate(lines):
        if not l.startswith('{"id":'): continue
        comma = l.endswith(",")
        e = json.loads(l[:-1] if comma else l)
        seen_ids.add(e["id"])
        if e["id"] in plan and e["id"] != BELL_DOOR["id"]:
            mid, lx, ly = plan[e["id"]]
            assert len(e["pages"]) == 1, e["id"]
            e["pages"][0]["list"] = door_list(mid, lx, ly, HOURS[mid], picture=bool(e["pages"][0]["image"]["characterName"]))
            e["pages"][0]["trigger"] = 1
            lines[i] = dump(e) + ("," if comma else "")
            done.append(e["id"])
        elif e["id"] == BELL_DOOR["id"]:
            mid, lx, ly = plan[e["id"]]
            ne = new_bell_door(mid, lx, ly)
            lines[i] = dump(ne) + ("," if comma else "")
            done.append(e["id"])
    if BELL_DOOR["id"] not in seen_ids:
        # the events array: ids are array indexes - fill the gap with nulls, then the new event, before "]"
        end = len(lines) - 1 - lines[::-1].index("]")
        last = end - 1
        max_id = max(seen_ids)
        assert BELL_DOOR["id"] > max_id, (BELL_DOOR["id"], max_id)
        new = ["null"] * (BELL_DOOR["id"] - max_id - 1)
        mid, lx, ly = plan[BELL_DOOR["id"]]
        new.append(dump(new_bell_door(mid, lx, ly)))
        lines[last] = lines[last] + ","
        lines[end:end] = [n + ("," if k < len(new) - 1 else "") for k, n in enumerate(new)]
        done.append(BELL_DOOR["id"])
    missing = set(plan) - set(done)
    assert not missing, "doors not found on Map008: %s" % sorted(missing)
    out = "\n".join(lines).encode("utf-8")
    json.loads(out.decode("utf-8"))           # still valid JSON
    return path, out, sorted(done)

def new_bell_door(mid, lx, ly):
    pg = blank_page()
    pg["list"] = door_list(mid, lx, ly, HOURS[mid], picture=False)
    pg["trigger"] = 1
    return {"id": BELL_DOOR["id"], "name": BELL_DOOR["name"], "note": BELL_DOOR["note"], "pages": [pg], "x": BELL_DOOR["x"], "y": BELL_DOOR["y"]}

def patch_mapinfos():
    path = os.path.join(DATA, "MapInfos.json")
    raw = open(path, "rb").read()
    lines = raw.decode("utf-8").split("\n")
    infos = json.loads(raw.decode("utf-8"))
    keep = [l for l in lines]
    # drop our own old entries (re-install), keep everything else as it is
    body = keep[1:-1]
    rows = []
    for l in body:
        t = l.rstrip(",")
        if t == "null": rows.append(("null", None)); continue
        o = json.loads(t)
        rows.append((t, o["id"]))
    rows = [r for r in rows if r[1] not in NAMES]
    while rows and rows[-1][0] == "null": rows.pop()
    order0 = max(o["order"] for o in infos if o and o["id"] not in NAMES) + 1
    have = len(rows)                        # next index
    for k, mid in enumerate(sorted(NAMES)):
        while have < mid:
            rows.append(("null", None)); have += 1
        rows.append((dump({"id": mid, "expanded": False, "name": NAMES[mid], "order": order0 + k, "parentId": 8, "scrollX": 0, "scrollY": 0}), mid))
        have += 1
    out_lines = [keep[0]] + [t + ("," if k < len(rows) - 1 else "") for k, (t, _) in enumerate(rows)] + [keep[-1]]
    out = "\n".join(out_lines).encode("utf-8")
    js = json.loads(out.decode("utf-8"))
    for mid in NAMES: assert js[mid]["id"] == mid
    return path, out

def main():
    if editor_running():
        print("STOP: the RPG Maker MZ editor is running - close it first (it would overwrite data/ on save).")
        sys.exit(2)
    st = staged()
    plan = doors_plan(st)
    m8_path, m8_out, doors = patch_map008(plan)
    mi_path, mi_out = patch_mapinfos()
    print("doors patched on Map008:", doors)
    if DRY:
        print("dry run: nothing written"); return
    os.makedirs(BACKUP, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%H%M%S")
    for p in [m8_path, mi_path] + [os.path.join(DATA, "Map%03d.json" % m) for m in NAMES]:
        if os.path.exists(p):
            shutil.copy2(p, os.path.join(BACKUP, os.path.basename(p).replace(".json", "_%s.json" % stamp)))
    for mid, (p, meta) in st.items():
        shutil.copy2(p, os.path.join(DATA, "Map%03d.json" % mid))
    with open(m8_path, "wb") as f: f.write(m8_out)
    with open(mi_path, "wb") as f: f.write(mi_out)
    print("installed maps", sorted(NAMES), "-> data/, MapInfos + Map008 doors; backups in", os.path.relpath(BACKUP, ROOT))

if __name__ == "__main__":
    main()
