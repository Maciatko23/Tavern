# python tools/podgrodzie/install.py [--dry-run]   - puts the staged Podgrodzie into the game (the RPG Maker MZ editor must be CLOSED)
#   1. data/Map111.json        <- tools/podgrodzie/staging/Map111.json with the six interiors' doors filled in: player touch;
#                                 open hours (the town's homes, 6-21; the refugees' house always) -> Door1, the door swings
#                                 open, Transfer into the interior facing up; else Tawerna.popup("Zamknięte.") (once a second)
#                                 - the very commands tools/interiors/install.py gives the town's doors
#   2. data/Map112..117.json   <- the staged interiors (already in the editor's file layout)
#   3. data/MapInfos.json      111 "Podgrodzie" (a child of 8 "Okolice Tawerny") and 112-117 (children of 111) appended; the
#                                 other lines untouched
# The west gate on Map008 is tools/town/west_gate.py (run once, before this); this checks it is there.
# Everything replaced is copied to backup_art_2026-10-05/podgrodzie/ first. LF, UTF-8, the editor's one-line-per-entry layout.
import os, sys, json, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import plib
ROOT = plib.ROOT
DATA = ROOT + "data/"
STAGING = plib.STAGING
BACKUP = ROOT + "backup_art_2026-10-05/podgrodzie/"
DRY = "--dry-run" in sys.argv
TD = plib.TOWN_DOORS            # tools/interiors/install.py: door_list, editor_running, dump

NAMES = {111: "Podgrodzie", 112: "Chata praczki", 113: "Chata drwala", 114: "Chata kłusownika", 115: "Izba znachorki",
         116: "Kram starzyzny", 117: "Dom uchodźców"}
PARENT = {111: 8, 112: 111, 113: 111, 114: 111, 115: 111, 116: 111, 117: 111}

def load(p):
    with open(p, "rb") as f: return json.loads(f.read().decode("utf-8"))

def patched_map111():
    """the staged Podgrodzie with the interiors' doors given their commands (the staged file's lines, only the door lines changed)"""
    raw = open(os.path.join(STAGING, "Map111.json"), "rb").read()
    assert b"\r\n" not in raw
    lines = raw.decode("utf-8").split("\n")
    meta = load(os.path.join(STAGING, "Map111_meta.json"))
    by_door = {}
    for mid in range(112, 118):
        im = load(os.path.join(STAGING, "Map%03d_meta.json" % mid))
        for ex in im["exits"]:
            by_door[ex["door"]] = (mid, ex["landing"][0], ex["landing"][1], ex["town"])
    hours = {b["event_id"]: (tuple(b["hours"]) if b["hours"] else None) for b in meta["buildings"] if b["interior"]}
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
        pg["list"] = TD.door_list(mid, lx, ly, hours[e["id"]], picture=bool(pg["image"]["characterName"]))
        pg["trigger"] = 1
        lines[i] = TD.dump(e) + ("," if comma else "")
        done.append((e["id"], e["name"], mid))
    assert len(done) == 6, done
    out = "\n".join(lines).encode("utf-8")
    json.loads(out.decode("utf-8"))
    return out, done

def patch_mapinfos():
    path = DATA + "MapInfos.json"
    raw = open(path, "rb").read()
    assert b"\r\n" not in raw
    lines = raw.decode("utf-8").split("\n")
    infos = json.loads(raw.decode("utf-8"))
    rows = []
    for l in lines[1:-1]:
        t = l.rstrip(",")
        if t == "null": rows.append(("null", None)); continue
        o = json.loads(t)
        rows.append((t, o["id"]))
    rows = [r for r in rows if r[1] not in NAMES]            # (a re-install drops our own old entries)
    while rows and rows[-1][0] == "null": rows.pop()
    if len(rows) > min(NAMES):
        sys.exit("MapInfos already has maps from %d on - pick other ids" % min(NAMES))
    order0 = max(o["order"] for o in infos if o and o["id"] not in NAMES) + 1
    have = len(rows)
    for k, mid in enumerate(sorted(NAMES)):
        while have < mid:
            rows.append(("null", None)); have += 1
        rows.append((TD.dump({"id": mid, "expanded": mid == 111, "name": NAMES[mid], "order": order0 + k, "parentId": PARENT[mid],
                              "scrollX": 0, "scrollY": 0}), mid))
        have += 1
    out_lines = [lines[0]] + [t + ("," if k < len(rows) - 1 else "") for k, (t, _) in enumerate(rows)] + [lines[-1]]
    out = "\n".join(out_lines).encode("utf-8")
    js = json.loads(out.decode("utf-8"))
    for mid in NAMES: assert js[mid]["id"] == mid and js[mid]["parentId"] == PARENT[mid]
    return path, out

def town_gate_ok():
    m8 = load(DATA + "Map008.json")
    return sorted((e["x"], e["y"]) for e in m8["events"] if e and any(c["code"] == 201 and c["parameters"][1] == 111
                                                                   for p in e["pages"] for c in p["list"]))

def main():
    if TD.editor_running():
        print("STOP: the RPG Maker MZ editor is running - close it first (it would overwrite data/ on save)."); sys.exit(2)
    m111, doors = patched_map111()
    mi_path, mi_out = patch_mapinfos()
    gate = town_gate_ok()
    print("doors filled on Map111:", ", ".join("%d %s -> Map%d" % d for d in doors))
    print("Map008 exits to Map111:", gate or "NONE - run tools/town/west_gate.py")
    if DRY:
        print("dry run: nothing written"); return
    os.makedirs(BACKUP, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%H%M%S")
    for p in [mi_path] + [DATA + "Map%03d.json" % m for m in NAMES]:
        if os.path.exists(p):
            shutil.copy2(p, BACKUP + os.path.basename(p).replace(".json", "_%s.json" % stamp))
    with open(DATA + "Map111.json", "wb") as f: f.write(m111)
    for mid in range(112, 118):
        shutil.copy2(os.path.join(STAGING, "Map%03d.json" % mid), DATA + "Map%03d.json" % mid)
    with open(mi_path, "wb") as f: f.write(mi_out)
    print("installed maps %s -> data/, MapInfos; backups in %s" % (sorted(NAMES), os.path.relpath(BACKUP, ROOT)))

if __name__ == "__main__":
    main()
