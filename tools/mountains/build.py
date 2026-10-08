# python tools/mountains/build.py [--preview DIR] [--install] [--force]
# The mountain world of W8 "Żelazna Pięść" (docs/QUESTY.md; places and markers: docs/miasta_miejsca_zadan.md "Góry"):
#   Map013 "Góry i kamieniołom"   gory.py      the foothills, the shelf, the order's old quarry, the high shelf, the cave's mouth,
#                                              the ravine with the Silent's gate (switch 16)
#   Map014 "Jaskinia"             jaskinia.py  the diggers' camp, Marek, the tunnel to floor 50 (switch 15)
#   Map120 "Osada Milczących"     osada.py     the hidden valley of the Silent (Act II); its hut doors lead into Map121-124,
#                                              which tools/osada/build.py builds and installs (with Map120 and their MapInfos
#                                              entries) - after a Map120 install from here, run that one too if the huts are new
#   Map021, Map149, MapInfos, System           patches.py (the way in from Leśna droga, the passage on floor 50, names)
# The pictures first: python tools/mountains/art.py.
# Without arguments: builds into tools/mountains/staging/ and patches in memory (a dry run: prints what it would do).
#   --preview DIR   pictures of the staged maps
#   --install       writes data/: refuses while the RPG Maker MZ editor runs; checks that the writer reproduces the patched
#                   maps byte for byte first; copies what it replaces to backup_art_2026-10-06/mountains/. A map of ours changed
#                   in the editor since the last install (tools/mountains/installed.json keeps the hashes) is left as it is -
#                   --force replaces it anyway. Run again: our events on other maps are found by name, nothing is doubled.
import os, sys, json, argparse, shutil, datetime, subprocess, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mtlib as L          # noqa: E402
import gory, jaskinia, osada, patches   # noqa: E402

ROOT = L.ROOT
DATA = ROOT + "data/"
STAGING = os.path.join(HERE, "staging")
BACKUP = ROOT + "backup_art_2026-10-06/mountains/"
BUILDERS = {13: gory.build, 14: jaskinia.build, 120: osada.build}
sha = lambda b: hashlib.sha256(b).hexdigest()


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


def editor_running():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return False
    return any(l.lower().startswith("rpgmz") or "rpg maker" in l.lower() for l in out.splitlines())


def read(path):
    with open(path, "rb") as f:
        return f.read()


def check(mid, j):
    """the walking checks before anything is written: every marker standable or beside reach, the ways out reachable"""
    probs = []
    W, H = j["width"], j["height"]
    starts = {13: gory.ENTRY[1], 14: jaskinia.LAND, 120: osada.EXIT[1]}
    start = starts[mid]
    if mid == 120: start = (start[0], start[1] - 2)
    if mid == 13: start = (start[0] + 1, start[1])
    seen = L.reach(j, start)
    named = {e["name"]: e for e in j["events"] if e}
    for e in j["events"]:
        if not e or not e["name"].startswith("Miejsce: "): continue
        x, y = e["x"], e["y"]
        if (x, y) not in seen:
            near = any((x + dx, y + dy) in seen for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)))
            if not near: probs.append("%s (%d,%d) not reachable" % (e["name"], x, y))
    if mid == 13:
        for c in ((44, 8), (56, 19), (22, 34), (21, 13), (6, 4), (40, 18)):
            if c not in seen: probs.append("Map013 %s not reachable" % (c,))
        n = len(seen); print("  Map013 reach from the west edge: %d cells" % n)
    if mid == 14:
        for c in ((3, 10), (30, 6), (18, 18), (20, 28)):
            if c not in seen: probs.append("Map014 %s not reachable" % (c,))
        print("  Map014 reach: %d cells" % len(seen))
    if mid == 120:
        for c in ((19, 22), (15, 10), (21, 25)):
            if c not in seen: probs.append("Map120 %s not reachable" % (c,))
        print("  Map120 reach: %d cells" % len(seen))
    ids = [e["id"] for e in j["events"] if e]
    if max(ids) >= 355: probs.append("Map%03d: event ids up to %d (the core keeps 355+ for injected events)" % (mid, max(ids)))
    return probs


def stage():
    os.makedirs(STAGING, exist_ok=True)
    out = {}
    for mid, fn in BUILDERS.items():
        mp = fn()
        j = mp.to_json()
        probs = check(mid, j)
        for p in probs: print("  PROBLEM", p)
        raw = serialize(j)
        with open(os.path.join(STAGING, "Map%03d.json" % mid), "wb") as f: f.write(raw)
        print("Map%03d %s: %dx%d, %d events -> staging" % (mid, mp.props["displayName"], mp.W, mp.H, len([e for e in j["events"] if e])))
        out[mid] = (raw, j, probs)
    return out


def patched():
    out = {}
    for mid, fn in ((21, patches.patch_road), (149, patches.patch_floor50)):
        raw = read(DATA + "Map%03d.json" % mid)
        mp = json.loads(raw.decode("utf-8"))
        if serialize(mp) != raw:
            sys.exit("Map%03d.json: the writer does not reproduce the file byte for byte - not touching it" % mid)
        done = fn(mp)
        print("Map%03d:" % mid, *done, sep="\n  ")
        out["Map%03d.json" % mid] = serialize(mp)
    out["MapInfos.json"] = patches.patch_mapinfos(read(DATA + "MapInfos.json"))
    out["System.json"] = patches.patch_system(read(DATA + "System.json"))
    print("MapInfos: 13 'Góry i kamieniołom', 14 'Jaskinia', 120 'Osada Milczących'; System: switches 15, 16 named")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    staged = stage()
    files = patched()
    if a.preview:
        os.makedirs(a.preview, exist_ok=True)
        for mid, (raw, j, _) in staged.items():
            L.render(j, os.path.join(a.preview, "Map%03d.png" % mid), scale=0.5)
            print("preview Map%03d" % mid)
    if not a.install:
        return
    if any(p for (_, _, p) in staged.values()):
        sys.exit("STOP: the staged maps have problems (see above)")
    if editor_running():
        sys.exit("STOP: the RPG Maker MZ editor is running - close it first.")
    os.makedirs(BACKUP, exist_ok=True)
    rec_path = os.path.join(HERE, "installed.json")
    rec = json.loads(read(rec_path).decode("utf-8")) if os.path.exists(rec_path) else {}
    stamp = datetime.datetime.now().strftime("%H%M%S")
    writes = dict(files)
    for mid, (raw, _, _) in staged.items():
        n = "Map%03d.json" % mid
        if os.path.exists(DATA + n) and n in rec and not a.force:
            cur = sha(read(DATA + n))
            if cur != rec[n] and cur != sha(raw):
                print("SKIP %s: changed in the editor since the last install (--force replaces it)" % n)
                continue
        writes[n] = raw
    for n in writes:
        if os.path.exists(DATA + n):
            shutil.copy2(DATA + n, BACKUP + n.replace(".json", "_before_%s.json" % stamp))
    for n, b in writes.items():
        with open(DATA + n, "wb") as f: f.write(b)
        if n[:3] == "Map" and n[3:6].isdigit() and int(n[3:6]) in BUILDERS: rec[n] = sha(b)
    with open(rec_path, "wb") as f: f.write((json.dumps(rec, indent=1, sort_keys=True) + "\n").encode("utf-8"))
    print("installed:", ", ".join(sorted(writes)), "- backups in", BACKUP)


if __name__ == "__main__":
    main()
