# python tools/quest_places/build.py [--preview DIR] [--install]
# The places of the town's quest threads (docs/QUESTY.md W1, W2, K26) - maps, ways in and out, pictures and invisible markers
# only; the quest logic (TownQuests' injected events 951-959) comes later and finds everything by name ("Miejsce: <key>",
# docs/miasta_miejsca_zadan.md):
#   Map118 "Dno studni"       - the bottom of the market well (K26 / W1)                         places.py
#   Map119 "Archiwum zakonu"  - the order's archive under the knights' garden (W2)               places.py
#   Map008, Map024, MapInfos  - the way down the well, the garden's slab, the manor's orangery    patches.py
# The pictures: img/characters/!Quest_Places.png and !$Altar.png (art.py - run it first).
# Without arguments: builds 118/119 into tools/quest_places/staging/ and applies the patches in memory (a dry run - it prints
# what it would do; nothing in data/ changes).
#   --preview DIR   pictures of the staged maps and of the changed parts of Map008 / Map024 (static render) into DIR
#   --install       writes data/: refuses while the RPG Maker MZ editor runs, checks that its writer reproduces Map008 /
#                   Map024 byte for byte first, copies everything it replaces to backup_art_2026-10-05/quest_places/.
#                   Run again: it rebuilds 118/119 and updates its own events (found by name) instead of adding more.
import os, sys, json, argparse, shutil, datetime, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import places as P          # noqa: E402
import patches as PT        # noqa: E402

ROOT = P.ROOT
DATA = ROOT + "data/"
STAGING = os.path.join(HERE, "staging")
BACKUP = ROOT + "backup_art_2026-10-05/quest_places/"


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


def stage():
    os.makedirs(STAGING, exist_ok=True)
    out = {}
    for mid, fn in P.BUILDERS.items():
        mp = fn()
        path = os.path.join(STAGING, "Map%03d.json" % mid)
        n = mp.write(path, os.path.join(STAGING, "Map%03d_meta.json" % mid))
        raw = read(path)
        if serialize(json.loads(raw.decode("utf-8"))) != raw:
            sys.exit("Map%03d: the staged file is not in the editor's layout" % mid)
        print("Map%03d %s: %dx%d, %d events -> staging" % (mid, mp.display, mp.W, mp.H, n))
        out[mid] = raw
    return out


def patched():
    """the patched Map008 / Map024 / MapInfos (bytes) after checking the writer on the files as they are"""
    out = {}
    for mid, fn in ((P.TOWN, PT.patch_town), (P.MANOR, PT.patch_manor)):
        path = DATA + "Map%03d.json" % mid
        raw = read(path)
        mp = json.loads(raw.decode("utf-8"))
        if serialize(mp) != raw:
            sys.exit("Map%03d.json: the writer does not reproduce the file byte for byte - not touching it" % mid)
        done = fn(mp)
        print("Map%03d:" % mid, *done, sep="\n  ")
        out["Map%03d.json" % mid] = serialize(mp)
    raw = read(DATA + "MapInfos.json")
    out["MapInfos.json"] = PT.patch_mapinfos(raw)
    print("MapInfos: 118 'Dno studni', 119 'Archiwum zakonu' (parent 8)")
    return out


def render(mp, out, box=None, scale=1.0):
    sys.path.insert(0, os.path.join(ROOT, "tools", "interiors"))
    import irender as IR
    S = IR.Sheets(mp["tilesetId"])
    img = IR.R.render(mp, S)
    if box:
        x0, y0, x1, y1 = box
        img = img.crop((x0 * 48, y0 * 48, (x1 + 1) * 48, (y1 + 1) * 48))
        img = IR.grid(img, x0, y0, lines=False)
    else:
        img = IR.grid(img, lines=False)
    if scale != 1.0:
        from PIL import Image
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.NEAREST)
    img.save(out)
    return getattr(S, "missing", None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    ap.add_argument("--install", action="store_true")
    a = ap.parse_args()
    staged = stage()
    files = patched()
    if a.preview:
        os.makedirs(a.preview, exist_ok=True)
        for mid, raw in staged.items():
            print("preview Map%03d" % mid, render(json.loads(raw.decode("utf-8")), os.path.join(a.preview, "Map%03d.png" % mid), scale=2.0))
        m24 = json.loads(files["Map024.json"].decode("utf-8"))
        print("preview Map024", render(m24, os.path.join(a.preview, "Map024_oranzeria.png"), (2, 16, 21, 29), 1.5))
        print("preview Map024 (all)", render(m24, os.path.join(a.preview, "Map024.png"), None, 0.5))
        m8 = json.loads(files["Map008.json"].decode("utf-8"))
        for e in m8["events"]:                      # (the slab shown open in the picture)
            if e and e["name"].startswith("Płyta w ścieżce"):
                e["pages"] = e["pages"][1:]
                e["pages"][0]["conditions"]["selfSwitchValid"] = False
        print("preview Map008 well", render(m8, os.path.join(a.preview, "Map008_studnia.png"), (19, 29, 31, 38), 1.5))
        print("preview Map008 garden", render(m8, os.path.join(a.preview, "Map008_ogrod.png"), (0, 3, 12, 17), 1.5))
    if not a.install:
        return
    if editor_running():
        sys.exit("STOP: the RPG Maker MZ editor is running - close it first.")
    os.makedirs(BACKUP, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%H%M%S")
    names = list(files) + ["Map%03d.json" % mid for mid in staged]
    for n in names:
        if os.path.exists(DATA + n):
            shutil.copy2(DATA + n, BACKUP + n.replace(".json", "_before_%s.json" % stamp))
    for n, b in files.items():
        with open(DATA + n, "wb") as f:
            f.write(b)
    for mid, b in staged.items():
        with open(DATA + "Map%03d.json" % mid, "wb") as f:
            f.write(b)
    print("installed:", ", ".join(sorted(names)), "- backups in", BACKUP)


if __name__ == "__main__":
    main()
