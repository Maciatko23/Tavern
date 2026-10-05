# python tools/tavern/v2/install_v2.py --preview   -> tools/tavern/v2/overlay/ (data/Map001.json and the maps whose ways in
#                                                    were moved, the character sheets the map needs) for GAME_OVERLAY runs
# python tools/tavern/v2/install_v2.py --install   -> the same into data/ and img/characters (the RPG Maker editor CLOSED),
#                                                    backups in backup_art_2026-10-04/tavern_rebuild/, links.json updated
# The staged ground floor (build_v2.py -> staging/Map001.json, 101 x 55: the old frame's empty top DY rows cut off) replaces
# data/Map001.json. Before that the kept vestibule (design x 36..64, y 74..83: all six layers and its events) is compared with
# the map on disk: if the user changed it in the editor since the build's base was taken, the install stops (rebuild from a
# fresh base: copy data/Map001.json to base/Map001_start.json and run build_v2.py again).
# Every way into Map001 moves up with the map (y - DY): Map008's gate (event 22), Map025's stairs down (288..292); Map009's
# way back up lands in front of the loose brick's new place.
import os, sys, json, shutil, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from v2lib import ROOT, KEEP, W, H, load_json, in_keep
import v2layout as LY

STAGED = os.path.join(HERE, "staging", "Map001.json")
BASE = os.path.join(HERE, "base", "Map001_start.json")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-04", "tavern_rebuild")
PACK_CHARS = ROOT + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/characters/"
TRANSFER = re.compile(r'"parameters":\[0,1,(\d+),(\d+),(\d),0\]')

def keep_zone(mp, dy=0):
    """the vestibule's cells and events of a map whose top dy rows were cut (0: the old frame)"""
    d, w, h = mp["data"], mp["width"], mp["height"]
    cells = [d[(z * h + y - dy) * w + x] for z in range(6) for y in range(KEEP[1], KEEP[3] + 1) for x in range(KEEP[0], KEEP[2] + 1)]
    evs = []
    for e in mp["events"]:
        if e and in_keep(e["x"], e["y"] + dy):
            e = dict(e, y=e["y"] + dy)
            evs.append(json.dumps(e, sort_keys=True, ensure_ascii=False))
    return cells, sorted(evs)

def shift_ins(text, mapping):
    """transfers into Map001 in another map's file moved by mapping (x, y, d) -> (x, y, d) or None"""
    n = 0
    def rep(mm):
        nonlocal n
        x, y, d = int(mm.group(1)), int(mm.group(2)), int(mm.group(3))
        t = mapping(x, y, d)
        if t is None: return mm.group(0)
        n += 1
        return '"parameters":[0,1,%d,%d,%d,0]' % t
    return TRANSFER.sub(rep, text), n

def main(mode):
    staged = load_json(STAGED)
    base, now = load_json(BASE), load_json(ROOT + "data/Map001.json")
    already = now["height"] == H - LY.DY
    if keep_zone(base) != keep_zone(now, LY.DY if already else 0):
        raise SystemExit("the vestibule on data/Map001.json differs from the build's base: rebuild first (see the header)")
    out = os.path.join(HERE, "overlay") if mode == "--preview" else ROOT.rstrip("/")
    os.makedirs(os.path.join(out, "data"), exist_ok=True)
    os.makedirs(os.path.join(out, "img", "characters"), exist_ok=True)
    if mode == "--install":
        os.makedirs(BACKUP, exist_ok=True)
        for f in ("data/Map001.json", "data/Map008.json", "data/Map009.json", "data/Map025.json", "tools/tavern/links.json",
                  "js/plugins/TavernLife_Plan.js", "tools/newstart/tavern_layout.py"):
            dst = os.path.join(BACKUP, os.path.basename(f).replace(".", "_before_rebuild.", 1))
            if not os.path.exists(dst): shutil.copyfile(ROOT + f, dst)
    shutil.copyfile(STAGED, os.path.join(out, "data", "Map001.json"))
    brick = staged["events"][9]
    bx, by = brick["x"], brick["y"] + 1
    report = {}
    # the maps that lead into Map001: their landings move up DY rows with the map
    # (the old landings are all on design row 82 - the vestibule's bottom floor row; an installed map's are on 82 - DY)
    for (name, fn) in (("Map008", lambda x, y, d: (x, y - LY.DY, d) if y == 82 else None),
                       ("Map025", lambda x, y, d: (x, y - LY.DY, d) if y == 82 else None),
                       ("Map009", lambda x, y, d: (bx, by, d))):
        with open(ROOT + "data/%s.json" % name, "rb") as f:
            raw = f.read()
        text = raw.decode("utf-8")
        # (only the transfers into Map001: TRANSFER matches "[0,1,..." = map 1)
        new, n = shift_ins(text, fn)
        report[name] = n
        with open(os.path.join(out, "data", "%s.json" % name), "wb") as f:
            f.write(new.encode("utf-8"))
    copied = []
    for e in staged["events"]:
        if not e: continue
        for pg in e["pages"]:
            n = pg["image"]["characterName"]
            if n and not os.path.exists(ROOT + "img/characters/" + n + ".png") and os.path.exists(PACK_CHARS + n + ".png"):
                shutil.copyfile(PACK_CHARS + n + ".png", os.path.join(out, "img", "characters", n + ".png")); copied.append(n)
    print("%s: Map001 %dx%d (%d events), ways in moved %s, the brick's way back (%d,%d), sheets %s" % (
        mode, staged["width"], staged["height"], len([e for e in staged["events"] if e]), report, bx, by, sorted(set(copied))))
    if mode == "--install":
        links_update(staged, bx, by)
        newstart_layout()

def newstart_layout():
    """tools/newstart/tavern_layout.py keeps both ends of the tavern's front door (the gate on Map008, the landing and the
    doorway on Map001) for the town's own generator and tests: its Map001 ends move up with the map (coordinates only)"""
    p = ROOT + "tools/newstart/tavern_layout.py"
    with open(p, "rb") as f:
        s = f.read().decode("utf-8")
    pairs = [("INSIDE_LANDING = (50, 82, 8)", "INSIDE_LANDING = (50, %d, 8)" % (82 - LY.DY)),
             ("EXITS = [((49, 83), (23, 17)), ((50, 83), (24, 17)), ((51, 83), (25, 17))]",
              "EXITS = [((49, %d), (23, 17)), ((50, %d), (24, 17)), ((51, %d), (25, 17))]" % ((83 - LY.DY,) * 3)),
             ("#   Map001: the doorway in the bottom wall (49..51, 83) of the big tavern (101x84 since 2026-09-28, tools/tavern/parter_layout.py);",
              "#   Map001: the doorway in the bottom wall (49..51, %d) of the big tavern (101x55 since 2026-10-05, tools/tavern/v2);" % (83 - LY.DY))]
    n = 0
    for a, b in pairs:
        if a in s: s = s.replace(a, b); n += 1
    with open(p, "wb") as f:
        f.write(s.encode("utf-8"))
    print("tools/newstart/tavern_layout.py: %d lines moved" % n)

def links_update(staged, bx, by):
    sys.path.insert(0, os.path.join(HERE, ".."))
    import links
    data = links.read()
    tags = data.get("tags", {})
    rows = []
    for e in staged["events"]:
        if not e: continue
        txt = (e.get("note") or "") + "".join(str(c["parameters"][0]) for c in e["pages"][0]["list"] if c["code"] in (108, 408))
        mm = re.search(r"<Tavern:\s*([A-Za-z]+)[^>]*>", txt)
        if mm: rows.append({"kind": mm.group(1).lower(), "event": e["id"], "x": e["x"], "y": e["y"], "tag": mm.group(0), "name": e["name"]})
    tags["map001"] = sorted(rows, key=lambda r: (r["kind"], r["event"]))
    sy = lambda cells: [[c[0], c[1] - LY.DY] + list(c[2:]) for c in cells]
    up = data.get("map001_stairs_up", {})
    if up and up.get("west", [[0, 76]])[0][1] >= LY.DY:
        up["west"], up["east"] = sy(up["west"]), sy(up["east"])
    fa = data.get("map001_from_above", {})
    if fa and fa.get("landing", [[0, 82]])[0][1] >= LY.DY:
        fa["landing"] = sy(fa["landing"])
    d25 = data.get("map025_stairs_down", {})
    g = d25.get("goes_to_map001", {})
    if g and g.get("cells", [[0, 82]])[0][1] >= LY.DY:
        g["cells"] = sy(g["cells"])
    spots = [{"name": e["name"], "event": e["id"], "x": e["x"], "y": e["y"], "dir": e["pages"][0]["image"]["direction"]}
             for e in staged["events"] if e and e["name"].startswith("Miejsce: ")]
    links.merge(tags=tags, map001_stairs_up=up, map001_from_above=fa, map025_stairs_down=d25,
                map001_frame={"width": staged["width"], "height": staged["height"], "cut_top": LY.DY,
                              "note": "2026-10-05: the second build of the ground floor; the old 101x84 frame's empty top rows cut "
                                      "off - map y = design y - cut_top (tools/tavern/v2)",
                              "landing_from_map008": [50, 82 - LY.DY, 8], "exits_to_map008": [[49, 83 - LY.DY], [50, 83 - LY.DY], [51, 83 - LY.DY]]},
                map001_guest_spots=spots,
                map001_people={str(i): [staged["events"][i]["x"], staged["events"][i]["y"]] for i in (1, 2, 3, 4, 172)},
                map001_loose_brick={"event": 9, "at": [staged["events"][9]["x"], staged["events"][9]["y"]], "stand": [bx, by],
                                    "map009_return": [bx, by, 2]})

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "--preview"
    if mode not in ("--preview", "--install"): raise SystemExit("--preview | --install")
    main(mode)
