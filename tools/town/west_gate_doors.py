# python tools/town/west_gate_doors.py [--dry] [--preview DIR]
# Puts the wooden gate (img/characters/!$West_Gate.png, drawn by tools/town/west_gate_art.py) into the town's west gate on both
# maps it is seen from (user 2026-10-05: the plain gap in the wall -> "jak prawdziwa brama miejska"):
#   Map008 (the town, the gap x 0-1, rows 50-51):
#     - "Brama zachodnia: dach i słupy"      (1,52) the front - posts, barge boards, roof, the lantern under the gable;
#                                             over the characters, walk-through
#     - "Brama zachodnia: skrzydło i cień"   (1,51) the back - the north leaf folded against the tower, the roof's shade on the
#                                             tower's foot and on the passage; under the characters, walk-through
#     - "Latarnia na baszcie" (west_gate.py's lantern on the tower over the gap, now under the gate's roof) keeps its light but
#       loses its picture: the gate's own lantern (the same picture of the author's) hangs under the gable
#   Map111 (Podgrodzie, the town wall on its east edge, the gap x 44-45, rows 17-18):
#     - the same front (45,19) and back (44,18 - (45,18) holds the exit; the sheet's row 3 is the back moved one cell right)
#     - "Brama zachodnia: światło latarni" (45,16): the lantern's light (<Light> as on Map008), no picture
#     - "Pochodnia na baszcie" (the torch on the north tower, under the new roof) moved up the tower, (44,15) -> (44,13)
# Nothing about walking changes: the cells keep their tiles and regions, the new events are walk-through and never block
# (priority under / over the characters); the exits are untouched. Idempotent: run again, it updates its own events (found by
# name) instead of adding more. Refuses to write while the RPG Maker MZ editor runs, checks that its writer reproduces the map
# files byte for byte, and copies both maps to backup_art_2026-10-05/west_gate_art/ first.
# Map111 comes from tools/podgrodzie/install.py (staging): after a re-install, run this again.
import os, sys, json, copy, argparse, shutil, datetime, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
BACKUP = ROOT + "backup_art_2026-10-05/west_gate_art/"
SHEET = "!$West_Gate"
FRONT_NAME, BACK_NAME, LIGHT_NAME = "Brama zachodnia: dach i słupy", "Brama zachodnia: skrzydło i cień", "Brama zachodnia: światło latarni"
LIGHT_NOTE = "<Light:150,90,62,24><LightWhen:night>"
# per map: the front event's cell + sheet direction, the back's, the light's (None: an existing event gives it), the tweaks
PLAN = {
    8: {"front": ((1, 52), 2), "back": ((1, 51), 4), "light": None,
        "blank": {"name": "Latarnia na baszcie", "at": (1, 49)}, "move": None},
    111: {"front": ((45, 19), 2), "back": ((44, 18), 8), "light": (45, 16),
          "blank": None, "move": {"name": "Pochodnia na baszcie", "from": (44, 15), "to": (44, 13)}},
}


def load_bytes(path):
    with open(path, "rb") as f:
        return f.read()


def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def serialize(mp):
    """the editor's layout: '{', the properties on one line, the data on one line, then one event per line (LF, UTF-8)"""
    props = {k: v for k, v in mp.items() if k not in ("data", "events")}
    ev = mp["events"]
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(mp["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(ev) - 1 else "") for i, e in enumerate(ev)]
    lines += ["]", "}"]
    return "\n".join(lines).encode("utf-8")


def page(image, priority, note_list=None):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
                           "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": True, "image": image, "list": (note_list or []) + [{"code": 0, "indent": 0, "parameters": []}],
            "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": priority, "stepAnime": False, "through": True, "trigger": 0, "walkAnime": False}


def pic(name, direction):
    return {"tileId": 0, "characterName": name, "direction": direction, "pattern": 1, "characterIndex": 0}


def editor_running():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return False
    return any(l.lower().startswith("rpgmz") or "rpg maker" in l.lower() for l in out.splitlines())


def apply(mp, mid):
    """mp changed in place; -> a list of what was done"""
    plan, done = PLAN[mid], []
    events = mp["events"]
    by_name = {}
    for e in events:
        if e:
            by_name.setdefault(e["name"], []).append(e)

    def upsert(name, xy, pg, note=""):
        olds = by_name.get(name, [])
        if len(olds) > 1:
            sys.exit("Map%03d: %d events named %r - fix by hand" % (mid, len(olds), name))
        if olds:
            e = olds[0]
            e.update({"x": xy[0], "y": xy[1], "pages": [pg], "note": note})
            done.append("updated %d %s %s" % (e["id"], name, xy))
        else:
            e = {"id": len(events), "name": name, "note": note, "pages": [pg], "x": xy[0], "y": xy[1]}
            events.append(e)
            done.append("added %d %s %s" % (e["id"], name, xy))
        return e

    (fxy, fdir), (bxy, bdir) = plan["front"], plan["back"]
    upsert(FRONT_NAME, fxy, page(pic(SHEET, fdir), 2))
    upsert(BACK_NAME, bxy, page(pic(SHEET, bdir), 0))
    if plan["light"]:
        upsert(LIGHT_NAME, plan["light"], page(pic("", 2), 0), LIGHT_NOTE)
    if plan["blank"]:
        b = plan["blank"]
        olds = [e for e in by_name.get(b["name"], []) if (e["x"], e["y"]) == b["at"]]
        if len(olds) != 1:
            sys.exit("Map%03d: the lantern %r on %s is not there" % (mid, b["name"], b["at"]))
        for pg in olds[0]["pages"]:
            pg["image"]["characterName"] = ""
            pg["image"]["characterIndex"] = 0
        done.append("picture taken off %d %s (its light stays)" % (olds[0]["id"], b["name"]))
    if plan["move"]:
        m = plan["move"]
        olds = by_name.get(m["name"], [])
        if len(olds) != 1 or (olds[0]["x"], olds[0]["y"]) not in (m["from"], m["to"]):
            sys.exit("Map%03d: the event %r is not on %s" % (mid, m["name"], m["from"]))
        olds[0]["x"], olds[0]["y"] = m["to"]
        done.append("moved %d %s %s -> %s" % (olds[0]["id"], m["name"], m["from"], m["to"]))
    return done


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="only say what would change")
    ap.add_argument("--preview", help="write the changed maps into this folder instead of data/ (no backup)")
    a = ap.parse_args()
    out = {}
    for mid in (8, 111):
        path = ROOT + "data/Map%03d.json" % mid
        raw = load_bytes(path)
        mp = json.loads(raw.decode("utf-8"))
        if serialize(mp) != raw:
            sys.exit("Map%03d.json: the writer does not reproduce the file byte for byte - not touching it" % mid)
        done = apply(mp, mid)
        print("Map%03d:" % mid, *done, sep="\n  ")
        out[mid] = (path, serialize(mp))
    if a.dry:
        return
    if a.preview:
        os.makedirs(a.preview, exist_ok=True)
        for mid, (path, data) in out.items():
            with open(os.path.join(a.preview, "Map%03d.json" % mid), "wb") as f:
                f.write(data)
        print("preview maps in", a.preview)
        return
    if editor_running():
        sys.exit("STOP: the RPG Maker MZ editor is running - close it first.")
    os.makedirs(BACKUP, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%H%M%S")
    for mid, (path, data) in out.items():
        shutil.copy2(path, BACKUP + "Map%03d_before_gate_%s.json" % (mid, stamp))
        with open(path, "wb") as f:
            f.write(data)
    print("written; backups in", BACKUP)


if __name__ == "__main__":
    main()
