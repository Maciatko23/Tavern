# Installs the tavern's surroundings (tools/newstart/staging/Map008.json, made by tools/newstart/build_tavern_area.py) and the
# way out of the tavern. RUN IT ONLY WITH THE RPG MAKER EDITOR CLOSED (the editor rewrites the maps on save), then open the
# project again.
#
#   python tools/apply_tavern_area.py --dry-run     only prints what it would change
#   python tools/apply_tavern_area.py               changes the files (backups first)
#   python tools/apply_tavern_area.py --out DIR     writes the changed files into DIR instead (data/ untouched; for tests)
#   --allow-changed-map001                           add the way out even if Map001 was edited since (its doorway must be free)
#
# What it changes:
#   data/Map008.json - "Okolice Tawerny" becomes the yard in front of the tavern (tileset 9 instead of the old RTP one): the
#                      tavern's front with a big gate at (13..15, 9) that leads inside (Map001, 8,11), a forecourt, roads to the
#                      south and east edges (the six transfers already there stay as they are, with their ids 1..6), a terrace
#                      with tables, the back yard, trees at the edges. The whole file is replaced by the staged one.
#   data/Map001.json - "Tawerna": three touch transfers on the doorway in the bottom wall (7..9, 12) -> Map008 in front of the
#                      gate (13..15, 10), facing down, with the door sound. Nothing else in the tavern changes.
# Safe to run twice: what is already there is left alone. It refuses (and changes nothing) when data/Map008.json or
# data/Map001.json changed since the map was made (the user may have edited them), or when a tile it needs is taken.
# Every file is written in its own format (UTF-8, LF) and backed up first to backup_art_2026-09-26/maps_before_tavern_area/.
import json, os, sys, shutil, copy, datetime, hashlib

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
from tavern_layout import TAVERN_MAP, OUTSIDE_MAP, GATE, INSIDE_LANDING, EXITS, EXIT_DIRECTION, BASE_SHA256, KEPT_TRANSFERS, PICTURES

DATA = os.path.join(ROOT, "data")
STAGED = os.path.join(ROOT, "tools", "newstart", "staging", "Map%03d.json" % OUTSIDE_MAP)
BACKUP = os.path.join(ROOT, "backup_art_2026-09-26", "maps_before_tavern_area")
DRY = "--dry-run" in sys.argv
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else None
ALLOW_M1 = "--allow-changed-map001" in sys.argv
DOORWAY_TILE = 2863            # Map001's floor planks on the doorway when the way out was designed
changes = []

def say(msg):
    changes.append(msg)
    print(("[dry-run] " if DRY else "") + msg)

def fail(msg):
    print("STOP: " + msg)
    print("Nothing was changed.")
    sys.exit(1)

def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))

def read(name):
    raw = open(os.path.join(DATA, name), "rb").read()
    return raw, json.loads(raw.decode("utf-8"))

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def map_text(raw, m):
    """a map in the layout it had: the editor's single line, or properties / data / one event per line (LF)"""
    if b"\n" not in raw.strip():
        return dump(m)
    props = {k: v for k, v in m.items() if k not in ("data", "events")}
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(m["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(m["events"]) - 1 else "") for i, e in enumerate(m["events"])]
    lines += ["]", "}"]
    return "\n".join(lines)

def goes_to(e, map_id):
    return any(c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == map_id for p in e["pages"] for c in p["list"])

pending = []     # (name, raw before, bytes after) - written only after every check passed

# ------------------------------------------------------------------ the staged map: there, ours, and its pictures exist
if not os.path.exists(STAGED):
    fail("%s is missing - run tools/newstart/build_tavern_area.py first." % STAGED)
staged_raw = open(STAGED, "rb").read()
staged = json.loads(staged_raw.decode("utf-8"))
gate = [e for e in staged["events"] if e and (e["x"], e["y"]) == GATE and goes_to(e, TAVERN_MAP)]
if (staged["width"], staged["height"], staged["tilesetId"]) != (30, 24, 9) or not gate:
    fail("the staged Map008 is not the generated tavern yard (size/tileset/gate) - run tools/newstart/build_tavern_area.py again.")
# the data/Map008.json the staged map was built on (build_tavern_area.py records it; --rebase builds on a newer one)
base_file = STAGED.replace(".json", ".base.json")
STAGED_BASE = json.load(open(base_file, encoding="utf-8"))["Map008.json"] if os.path.exists(base_file) else BASE_SHA256["Map008.json"]
used = {p["image"]["characterName"] for e in staged["events"] if e for p in e["pages"] if p["image"]["characterName"]}
missing = sorted(n for n in used | set(PICTURES) if not os.path.exists(os.path.join(ROOT, "img", "characters", n + ".png")))
if missing:
    fail("img/characters is missing %s%s." % (", ".join(missing), " (python tools/newstart/build_tavern_props.py makes/copies the tavern's)"
                                               if any(n in PICTURES for n in missing) else ""))

# ------------------------------------------------------------------ Map008: the tavern's surroundings
m8_raw, m8 = read("Map008.json")
installed = m8.get("tilesetId") == 9 and any(e and (e["x"], e["y"]) == GATE and goes_to(e, TAVERN_MAP) for e in m8["events"])
if m8_raw == staged_raw:
    print("Map008.json: the tavern's surroundings are already installed")
elif installed:
    print("Map008.json: the tavern's surroundings are already installed (changed in the editor since) - left as it is")
elif sha(m8_raw) != STAGED_BASE:
    fail("data/Map008.json changed since the tavern's surroundings were made (was it edited in the editor?). Installing would "
         "throw that change away. Look at it, then build again on it: python tools/newstart/build_tavern_area.py --rebase")
else:
    # the six transfers of the new start must come over unchanged (ids, places, targets)
    old = [e for e in m8["events"] if e]
    new = [e for e in staged["events"] if e][:len(old)]
    if [(e["id"], e["x"], e["y"]) for e in old] != [(e["id"], e["x"], e["y"]) for e in new] or \
       [dump(e["pages"]) for e in old] != [dump(e["pages"]) for e in new] or [(e["x"], e["y"]) for e in old] != KEPT_TRANSFERS:
        fail("the staged Map008 does not carry Map008's six transfers unchanged - build it again.")
    n = len([e for e in staged["events"] if e])
    say("Map008.json: replace the empty meadow (tileset 2) with the tavern's surroundings (tileset 9, %dx%d, %d events): "
        "the tavern's front with the gate at (%d..%d,%d) -> Map%03d (%d,%d), forecourt, roads south and east, terrace, back yard, "
        "trees; transfers 1-6 kept" % (staged["width"], staged["height"], n, GATE[0] - 1, GATE[0] + 1, GATE[1], TAVERN_MAP,
                                       INSIDE_LANDING[0], INSIDE_LANDING[1]))
    pending.append(("Map008.json", m8_raw, staged_raw))

# ------------------------------------------------------------------ Map001: the way out through the doorway
m1_raw, m1 = read("Map001.json")
events = m1["events"]
done = [((x, y), t) for (x, y), t in EXITS if any(e and (e["x"], e["y"]) == (x, y) and goes_to(e, OUTSIDE_MAP) for e in events)]
if len(done) == len(EXITS):
    print("Map001.json: the way out to Map%03d is already there" % OUTSIDE_MAP)
else:
    if sha(m1_raw) != BASE_SHA256["Map001.json"] and not ALLOW_M1:
        fail("data/Map001.json changed since the way out was designed (edited in the editor?). If the doorway (7..9,12) is still "
             "as it was, run again with --allow-changed-map001.")
    bad = [i for i, e in enumerate(events) if e and e["id"] != i]
    if bad:
        fail("Map001: event ids do not match their places in the list (%s) - open and save the map in the editor first" % bad[:5])
    W, H = m1["width"], m1["height"]
    if (W, H) != (17, 13):
        fail("Map001 is %dx%d, not 17x13 as when the way out was designed" % (W, H))
    for (x, y), t in EXITS:
        if ((x, y), t) in done: continue
        here = [e for e in events if e and (e["x"], e["y"]) == (x, y)]
        if here:
            fail("Map001 (%d,%d) already has event %d '%s'" % (x, y, here[0]["id"], here[0]["name"]))
        if m1["data"][y * W + x] != DOORWAY_TILE or any(m1["data"][z * W * H + y * W + x] for z in (1, 2, 3)):
            fail("Map001's doorway tile (%d,%d) is not the floor it was (was the wall changed?)" % (x, y))
    lx, ly, _d = INSIDE_LANDING
    if any(e and (e["x"], e["y"]) == (lx, ly) for e in events):
        fail("Map001 (%d,%d), where the player lands coming in, has an event now" % (lx, ly))
    # the author's own edge transfer (Map003's first picture-less 201 event) as the model: only target, direction and sound change
    m3 = json.load(open(os.path.join(DATA, "Map003.json"), encoding="utf-8"))
    tmpl = next(e for e in m3["events"] if e and not e["pages"][0]["image"]["characterName"] and not e["pages"][0]["image"]["tileId"]
                and any(c["code"] == 201 for c in e["pages"][0]["list"]))
    for (x, y), (tx, ty) in EXITS:
        if ((x, y), (tx, ty)) in done: continue
        e = copy.deepcopy(tmpl)
        eid = len(events)
        e.update({"id": eid, "name": "Wyjście -> Okolice Tawerny", "note": "", "x": x, "y": y})
        e["pages"] = e["pages"][:1]
        e["pages"][0]["list"] = [{"code": 250, "indent": 0, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]},
                                 {"code": 201, "indent": 0, "parameters": [0, OUTSIDE_MAP, tx, ty, EXIT_DIRECTION, 0]},
                                 {"code": 0, "indent": 0, "parameters": []}]
        events.append(e)
        say("Map001.json: add event %d at (%d,%d) on the doorway: touch transfer -> Map%03d 'Okolice Tawerny' (%d,%d), facing down, "
            "door sound" % (eid, x, y, OUTSIDE_MAP, tx, ty))
    pending.append(("Map001.json", m1_raw, map_text(m1_raw, m1).encode("utf-8")))

# ------------------------------------------------------------------ write (every check passed)
for name, before, after in pending:
    if OUT:
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(after)
        continue
    if DRY or after == before:
        continue
    os.makedirs(BACKUP, exist_ok=True)
    dest = os.path.join(BACKUP, name)
    if os.path.exists(dest):     # a second run keeps the first backup and adds a dated one
        dest = os.path.join(BACKUP, name.replace(".json", datetime.datetime.now().strftime("_%Y%m%d_%H%M%S.json")))
    shutil.copyfile(os.path.join(DATA, name), dest)
    with open(os.path.join(DATA, name), "wb") as f:
        f.write(after)

print()
if not changes:
    print("Nothing to do: everything is already in place.")
elif DRY:
    print("Dry run: %d changes listed above, no file was written." % len(changes))
elif OUT:
    print("%d changes written to %s (data/ untouched)." % (len(changes), OUT))
else:
    print("Done: %d changes. Backups in %s" % (len(changes), BACKUP))
    print("Open the project in RPG Maker again (the editor must re-read Map001 and Map008 before its next save).")
