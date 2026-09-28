# Installs the new tavern interior: the big ground floor (Map001 "Tawerna"), the upper floors (Map025 "Pokoje gości",
# Map026 "Apartamenty", parent 1 in MapInfos), the doors into it (Map008 event 7 -> the vestibule, Map009 event 1 -> in
# front of the loose brick), tileset 8's new passage flags and the Winlu character sheets the new maps use.
#
#   python tools/apply_tavern_interior.py --stage      record the data files as they are now (the base the install
#                                                     may overwrite) in tools/tavern/staging/apply_manifest.json
#   python tools/apply_tavern_interior.py --dry-run    show what would change, write nothing
#   python tools/apply_tavern_interior.py --out DIR    write full copies of every file that would change into DIR
#                                                     (DIR/data/..., DIR/img/characters/...) - for testing; data/ untouched
#   python tools/apply_tavern_interior.py              install (close the RPG Maker editor first)
#
# Safety: every data file it changes is backed up first into backup_art_2026-09-26/maps_before_tavern_interior/ (the
# first backup is kept, never overwritten); it refuses to run when a target file changed since --stage (the editor may
# have saved it) unless that file already holds the new content; running it twice changes nothing the second time.
# Each file keeps its own format: a one-line map stays one line, a map the editor wrote (one event per line) keeps that
# layout, MapInfos/Tilesets keep one entry per line, LF line ends, UTF-8 without BOM. New maps get the editor's layout.
import os, sys, json, hashlib, shutil, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
DATA = os.path.join(ROOT, "data")
CHARS = os.path.join(ROOT, "img", "characters")
TAVERN = os.path.join(HERE, "tavern")
STAGING = os.path.join(TAVERN, "staging")
MANIFEST = os.path.join(STAGING, "apply_manifest.json")
BACKUP = os.path.join(ROOT, "backup_art_2026-09-26", "maps_before_tavern_interior")
WINLU_CHARS = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "characters")

TILESET_ID = 8
GROUND = 1
ENTRANCE = (50, 82, 8)          # Map008's tavern door -> the vestibule, facing up (tools/tavern/parter_layout.py LANDING)
FROM_CELLAR = (4, 4, 2)         # Map009's way back -> in front of the loose brick, facing down
OUR_SHEETS = ["!Tavern_Props", "!Tavern_Props2", "!$Tavern_Board"]
TARGETS = ["Map001.json", "Map008.json", "Map009.json", "MapInfos.json", "Tilesets.json"]

# ------------------------------------------------------------------------------------------------ reading / writing
def read_bytes(p):
    with open(p, "rb") as f: return f.read()

def sha(b): return hashlib.sha256(b).hexdigest()

def load(b): return json.loads(b.decode("utf-8"))

def dumps(v): return json.dumps(v, ensure_ascii=False, separators=(",", ":"))

def map_style(b):
    return "editor" if b and b"\n" in b else "line"

def write_map(obj, style):
    """a map the way RPG Maker MZ's editor writes it ("editor": the header keys, "data", then one event per line) or
    all on one line ("line")"""
    if style == "line":
        return dumps(obj).encode("utf-8")
    head = {k: v for k, v in obj.items() if k not in ("data", "events")}
    lines = ["{", dumps(head)[1:-1] + ",", '"data":' + dumps(obj["data"]) + ",", '"events":[']
    evs = obj["events"]
    for i, e in enumerate(evs):
        lines.append(dumps(e) + ("," if i < len(evs) - 1 else ""))
    lines += ["]", "}"]
    return "\n".join(lines).encode("utf-8")

def write_list(arr):
    """MapInfos / Tilesets: one entry per line"""
    lines = ["["] + [dumps(v) + ("," if i < len(arr) - 1 else "") for i, v in enumerate(arr)] + ["]"]
    return "\n".join(lines).encode("utf-8")

def keeps_format(b, obj, kind):
    """the writer reproduces the untouched file byte for byte (else we would change its format)"""
    if kind == "map": return write_map(obj, map_style(b)) == b
    return write_list(obj) == b

# ------------------------------------------------------------------------------------------------ the new content
def links():
    p = os.path.join(TAVERN, "links.json")
    return load(read_bytes(p)) if os.path.exists(p) else {}

def staged_maps():
    """{map id: (file name, staged path, name, parent)} - the ground floor and the upper floors in links.json"""
    out = {GROUND: ("Map001.json", os.path.join(STAGING, "Map001.json"), None, None)}
    for k, v in (links().get("upper_maps") or {}).items():
        if not str(k).isdigit(): continue
        mid = int(k)
        src = v["file"] if os.path.isabs(v["file"]) else os.path.join(ROOT, v["file"])
        out[mid] = ("Map%03d.json" % mid, src, v.get("name") or "Map%03d" % mid, v.get("parent", GROUND))
    return out

def retarget(m, event_id, dest, to_map=GROUND):
    """every Transfer Player (201, direct) of the event that goes to `to_map` -> dest (x, y, direction); returns the
    changes [(page, old, new)]"""
    e = m["events"][event_id]
    if not e: raise SystemExit("event %d is missing" % event_id)
    changes = []
    for pi, page in enumerate(e["pages"]):
        for c in page["list"]:
            p = c["parameters"]
            if c["code"] == 201 and p[0] == 0 and p[1] == to_map:
                new = [0, to_map, dest[0], dest[1], dest[2], p[5] if len(p) > 5 else 0]
                if p != new: changes.append((pi, list(p), new)); c["parameters"] = new
    return changes

def sheets_used(maps):
    names = set()
    for m in maps:
        for e in m["events"]:
            if not e: continue
            for pg in e["pages"]:
                n = pg["image"]["characterName"]
                if n: names.add(n)
    return names

def plan():
    """[(kind, name, target path, new bytes or source path, note)] + problems"""
    items, problems, notes = [], [], []
    cur = {t: read_bytes(os.path.join(DATA, t)) for t in TARGETS}
    maps = staged_maps()
    new_maps = {}
    for mid, (fn, src, name, parent) in sorted(maps.items()):
        if not os.path.exists(src):
            problems.append("staged map missing: %s" % src); continue
        new_maps[mid] = load(read_bytes(src))
    if problems: return items, problems, notes, cur
    # ---- the maps
    for mid, (fn, src, name, parent) in sorted(maps.items()):
        tgt = os.path.join(DATA, fn)
        old = read_bytes(tgt) if os.path.exists(tgt) else None
        style = map_style(old) if old is not None else "editor"
        if old is not None and mid != GROUND and old != write_map(new_maps[mid], style):
            problems.append("%s already exists and is not ours (map id %d taken?)" % (fn, mid))
        b = write_map(new_maps[mid], style)
        m = new_maps[mid]
        items.append(("data", fn, tgt, b, "%s map %dx%d, %d events (%s)" % ("new" if old is None else "replaced",
                      m["width"], m["height"], sum(1 for e in m["events"] if e), style)))
    # ---- Map008: the tavern door; Map009: the way back from the cellar
    for fn, eid, dest in (("Map008.json", 7, ENTRANCE), ("Map009.json", 1, FROM_CELLAR)):
        b0 = cur[fn]; m = load(b0)
        if not keeps_format(b0, m, "map"): problems.append("%s: cannot keep its format (unknown layout)" % fn)
        ch = retarget(m, eid, dest)
        b = write_map(m, map_style(b0))
        items.append(("data", fn, os.path.join(DATA, fn), b, "event %d: %s" % (eid, "; ".join(
            "page %d transfer %s -> %s" % (pi + 1, o, n) for pi, o, n in ch) or "already there")))
    # ---- MapInfos: the new maps under the tavern
    b0 = cur["MapInfos.json"]; mi = load(b0)
    if not keeps_format(b0, mi, "list"): problems.append("MapInfos.json: cannot keep its format")
    order = max(v["order"] for v in mi if v)
    added = []
    for mid, (fn, src, name, parent) in sorted(maps.items()):
        if mid == GROUND: continue
        while len(mi) <= mid: mi.append(None)
        have = mi[mid]
        if have and have.get("name") != name:
            problems.append("MapInfos: id %d is already \"%s\"" % (mid, have.get("name")))
            continue
        if have and have.get("parentId") == parent: continue
        order += 1
        m = new_maps[mid]
        mi[mid] = {"id": mid, "expanded": False, "name": name, "order": order, "parentId": parent,
                   "scrollX": m["width"] * 24, "scrollY": m["height"] * 24}
        added.append("%d \"%s\" (parent %d)" % (mid, name, parent))
    items.append(("data", "MapInfos.json", os.path.join(DATA, "MapInfos.json"), write_list(mi),
                  "entries: " + (", ".join(added) or "already there")))
    # ---- Tilesets: tileset 8's passage flags
    b0 = cur["Tilesets.json"]; ts = load(b0)
    if not keeps_format(b0, ts, "list"): problems.append("Tilesets.json: cannot keep its format")
    flags = load(read_bytes(os.path.join(STAGING, "tileset8_flags.json")))
    have = ts[TILESET_ID]["flags"]
    if len(flags) != 8192: problems.append("tileset8_flags.json: %d flags, a tileset has 8192" % len(flags))
    # (today's array stops at 4928 entries: every tile past it - the A4 floors and walls - counts as passable)
    diff = sum(1 for a, b in zip(have, flags) if a != b)
    ts[TILESET_ID]["flags"] = flags
    items.append(("data", "Tilesets.json", os.path.join(DATA, "Tilesets.json"), write_list(ts),
                  "tileset %d \"%s\": %d passage flags changed, %d added (array %d -> %d)" % (TILESET_ID,
                  ts[TILESET_ID]["name"], diff, max(0, len(flags) - len(have)), len(have), len(flags))))
    # ---- character sheets
    used = sheets_used(new_maps.values())
    upper = [os.path.splitext(os.path.basename(p))[0] for p in (links().get("upper_maps") or {}).get("own_character_sheets", [])]
    for n in sorted(used | set(OUR_SHEETS) | set(upper)):
        tgt = os.path.join(CHARS, n + ".png")
        if os.path.exists(tgt): continue
        src = os.path.join(WINLU_CHARS, n + ".png")
        if os.path.exists(src):
            items.append(("image", n + ".png", tgt, src, "from the Winlu Interior pack (Remaster)"))
        else:
            problems.append("character sheet not found anywhere: %s" % n)
    notes.append("character sheets used by the new maps: %d (%d already in img/characters)" %
                 (len(used), sum(1 for n in used if os.path.exists(os.path.join(CHARS, n + ".png")))))
    return items, problems, notes, cur

# ------------------------------------------------------------------------------------------------ main
def main():
    args = sys.argv[1:]
    dry, stage = "--dry-run" in args, "--stage" in args
    out = args[args.index("--out") + 1] if "--out" in args else None
    if stage:
        base = {t: sha(read_bytes(os.path.join(DATA, t))) for t in TARGETS}
        man = {"base_sha256": base, "staged_at": datetime.datetime.now().isoformat(timespec="seconds"),
               "note": "the data files as they were when the tavern interior was staged; the install refuses to overwrite a file that changed since"}
        with open(MANIFEST, "wb") as f: f.write(json.dumps(man, indent=1).encode("utf-8"))
        print("staged: base hashes of %s written to %s" % (", ".join(TARGETS), os.path.relpath(MANIFEST, ROOT)))
        return 0
    if not os.path.exists(MANIFEST):
        print("no %s - run with --stage first" % os.path.relpath(MANIFEST, ROOT)); return 2
    base = load(read_bytes(MANIFEST))["base_sha256"]
    items, problems, notes, cur = plan()
    # the base check: a target that changed since --stage and does not already hold the new content
    for kind, name, tgt, new, note in items:
        if kind != "data" or name not in base: continue
        h = sha(cur[name])
        if h != base[name] and cur[name] != new:
            problems.append("%s changed since --stage (saved in the editor?) - refusing to overwrite it" % name)
    todo = []
    print("Tawerna: instalacja nowego wnętrza (%s)" % ("próba, nic nie zapisuję" if dry else "do katalogu " + out if out else "INSTALACJA"))
    for kind, name, tgt, new, note in items:
        if kind == "data":
            old = read_bytes(tgt) if os.path.exists(tgt) else None
            state = "bez zmian (już zainstalowane)" if old == new else ("nowy plik" if old is None else "zmiana")
            if old != new: todo.append((kind, name, tgt, new))
            print("  data/%-14s %-30s %s" % (name, state, note))
        else:
            todo.append((kind, name, tgt, new))
            print("  img/characters/%-26s kopiuję: %s" % (name, note))
    for n in notes: print("  " + n)
    if problems:
        print("PROBLEMY - nic nie zapisuję:")
        for p in problems: print("  - " + p)
        return 1
    if not todo:
        print("Nic do zrobienia: wszystko już zainstalowane."); return 0
    if dry:
        print("Próba: %d plików do zapisania. Uruchom bez --dry-run, żeby zainstalować." % len(todo)); return 0
    if out:
        for kind, name, tgt, new in todo:
            dst = os.path.join(out, os.path.relpath(tgt, ROOT))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if kind == "data":
                with open(dst, "wb") as f: f.write(new)
            else:
                shutil.copyfile(new, dst)
        print("Zapisano %d plików do %s (data/ nietknięte)." % (len(todo), out)); return 0
    os.makedirs(BACKUP, exist_ok=True)
    for kind, name, tgt, new in todo:
        if kind == "data" and os.path.exists(tgt):
            bk = os.path.join(BACKUP, name)
            if not os.path.exists(bk): shutil.copyfile(tgt, bk)
    for kind, name, tgt, new in todo:
        if kind == "data":
            tmp = tgt + ".tmp"
            with open(tmp, "wb") as f: f.write(new)
            os.replace(tmp, tgt)
        else:
            shutil.copyfile(new, tgt)
    print("Zainstalowano %d plików. Kopie zapasowe: %s" % (len(todo), os.path.relpath(BACKUP, ROOT)))
    print("Jeśli edytor RPG Maker był otwarty: zamknij go bez zapisywania i otwórz projekt ponownie.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
