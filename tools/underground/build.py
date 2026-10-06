# python tools/underground/build.py [--preview DIR] [--seed N] [--install] [--force]
# The underground (docs/PODZIEMIA.md): stages every map into tools/underground/staging/ and checks it:
#   Map130        band 1's chunk library (chunks.py)                     } every chunk checked by Underground.js itself
#   Map141-144    the chunk libraries of bands 2-5 (chunks_b2..b5.py)    } (check_chunks.js)
#   Map009        the tavern's cellar with the order's grate (places.py; its event 1 kept as it is)
#   Map010        Ruiny Zamku (places.py)
#   Map131..139   the generated floors 1-9's shells (places.py)
#   Map140        floor 10, the watch of the tenth gate (places.py)
#   Map145        the shell of floors 11-99 (places_deep.py: each loads it as map 1000 + N)
#   Map146-153    the hand-made floors 20-90 (places_deep.py)           } the walks on them checked by Underground.js
#   Map011        floor 100, Komnata Serca (places_deep.py)             } (check_places.js)
#   Tilesets      tileset 10's passage flags (flags10.py), band 2's tileset 12 "Podziemia: kwatery zakonu" (flags12)
#   MapInfos      the new maps under Map010 "Ruiny Zamku" (Map011 moved there too)
#   System        the names of switches 11-14 (Podziemia_Zejscie, _Winda, _Skrot, _Brama10)
# Without arguments: a dry run (staging only; prints what it would write).
#   --preview DIR  pictures: the libraries, the hand-made maps, sample floors of every band of one seed (--seed, default 20261006)
#                  made by the game's own generator (preview.js in Node)
#   --install      writes data/: refuses while the RPG Maker MZ editor runs; checks that its writers reproduce MapInfos /
#                  Tilesets / System byte for byte first; copies everything it replaces to backup_art_2026-10-06/underground/.
#                  Run again: it builds the same maps again and replaces its own MapInfos entries (no duplicates).
#                  A map the author changed in the editor since the last install (tools/underground/installed.json keeps the
#                  hashes of what was written) is left as it is - --force replaces it anyway.
import os, sys, json, argparse, shutil, datetime, subprocess, re, importlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import uglib as U          # noqa: E402
import chunks as CH        # noqa: E402
import chunks_deep as CD   # noqa: E402
import places as P         # noqa: E402
import places_deep as PD   # noqa: E402
import flags10 as F        # noqa: E402

ROOT = U.ROOT
DATA = ROOT + "data/"
STAGING = os.path.join(HERE, "staging")
BACKUP = ROOT + "backup_art_2026-10-06/underground/"
BANDS = [2, 3, 4, 5]
LIB_IDS = [importlib.import_module("chunks_b%d" % b).LIBRARY["map_id"] for b in BANDS]
NEW_IDS = [130] + [130 + f for f in P.SHELLS] + [140] + LIB_IDS + [PD.SHELL] + [PD.FLOOR_MAPS[f] for f in sorted(PD.FLOOR_MAPS)]
NAMES = {130: "Podziemia: kawałki (pasmo 1)", 140: "Podziemia: piętro 10 (Strażnica)", PD.SHELL: "Podziemia: piętra 11-99 (skorupa)"}
NAMES.update({130 + f: "Podziemia: piętro %d" % f for f in P.SHELLS})
for b, mid in zip(BANDS, LIB_IDS): NAMES[mid] = "Podziemia: kawałki (pasmo %d)" % b
for f, mid in PD.FLOOR_MAPS.items():
    NAMES[mid] = "Komnata Serca" if f == 100 else "Podziemia: piętro %d (%s)" % (f, PD.FLOOR_BUILDERS[f]().props["displayName"].split("(")[-1].rstrip(")"))
SWITCH_NAMES = {11: "Podziemia_Zejscie", 12: "Podziemia_Winda", 13: "Podziemia_Skrot", 14: "Podziemia_Brama10"}
SAMPLE = {1: list(range(1, 10)), 2: [11, 15, 19, 25, 29], 3: [31, 35, 39, 45, 49], 4: [51, 57, 65, 71, 75], 5: [76, 79, 85, 95, 99]}


def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def read(path):
    with open(path, "rb") as f:
        return f.read()


def editor_running():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return False
    return any(l.lower().startswith("rpgmz") or "rpg maker" in l.lower() for l in out.splitlines())


# ---------------------------------------------------------------------------------------------------- the maps
def stage(out, mp, label=None):
    path = os.path.join(STAGING, "Map%03d.json" % mp.id)
    n = mp.write_to(path)
    out[mp.id] = read(path)
    with open(os.path.join(STAGING, "Map%03d_spots.json" % mp.id), "wb") as f:
        f.write(json.dumps(mp.spots, ensure_ascii=False, indent=1).encode("utf-8"))
    if label: print("Map%03d %s: %dx%d, %d events" % (mp.id, label, mp.W, mp.H, n))
    return path


def stage_maps():
    os.makedirs(STAGING, exist_ok=True)
    out = {}
    lib, chunks = CH.build()
    stage(out, lib, "%s (%d chunks)" % (lib.props["displayName"], len(chunks)))
    for b in BANDS:
        mod = importlib.import_module("chunks_b%d" % b)
        lib, chunks = CD.build(mod)
        stage(out, lib, "%s (%d chunks)" % (lib.props["displayName"], len(chunks)))
    for mid, fn in P.BUILDERS.items():
        mp = fn()
        stage(out, mp, mp.props["displayName"])
    for fl in P.SHELLS: stage(out, P.shell(fl))
    print("Map131-139: the shells of floors 1-9")
    stage(out, PD.shell_map(), "Podziemia - piętra 11-99 (skorupa)")
    for f in sorted(PD.FLOOR_BUILDERS):
        mp = PD.FLOOR_BUILDERS[f]()
        stage(out, mp, mp.props["displayName"])
    # (the editor's layout: what the writer wrote reads back and writes the same bytes)
    for mid, raw in out.items():
        m = json.loads(raw.decode("utf-8"))
        props = {k: v for k, v in m.items() if k not in ("data", "events")}
        lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(m["data"]) + ",", '"events":[']
        lines += [dump(e) + ("," if i < len(m["events"]) - 1 else "") for i, e in enumerate(m["events"])]
        lines += ["]", "}"]
        if "\n".join(lines).encode("utf-8") != raw:
            sys.exit("Map%03d: not in the editor's layout" % mid)
    return out


# ---------------------------------------------------------------------------------------------------- the database files
def patch_tilesets():
    raw = read(DATA + "Tilesets.json")
    lines = raw.decode("utf-8").split("\n")

    def at(tid):
        idx = next(i for i, l in enumerate(lines) if l.startswith('{"id":%d,' % tid))
        line = lines[idx]
        tail = "," if line.endswith(",") else ""
        obj = json.loads(line[:-1] if tail else line)
        if dump(obj) + tail != line:
            sys.exit("Tilesets.json: tileset %d's line does not round-trip - not touching it" % tid)
        return idx, obj, tail
    idx, obj, tail = at(10)
    flags, changed = F.flags10()
    obj["flags"] = flags
    lines[idx] = dump(obj) + tail
    print("Tilesets: tileset 10 '%s' - %d passage flags (the author's list, %d of our props made right)" % (obj["name"], len(flags), len(changed)))
    mode10 = obj["mode"]
    idx, obj, tail = at(U.TILESET2)
    if obj["name"] not in ("", U.TILESET2_NAME):
        sys.exit("Tilesets.json: tileset %d is '%s' already - pick another id for band 2 (uglib.TILESET2, Underground_Data BANDS)" % (U.TILESET2, obj["name"]))
    flags2, changed2 = F.flags12()
    new = {"id": U.TILESET2, "flags": flags2, "mode": mode10, "name": U.TILESET2_NAME, "note": obj.get("note", ""), "tilesetNames": U.TILESET2_NAMES}
    lines[idx] = dump(new) + tail
    print("Tilesets: tileset %d '%s' - band 2: the Dungeon set with the Interior set's furniture (%d of its pieces made right)" % (U.TILESET2, U.TILESET2_NAME, len(changed2)))
    return "\n".join(lines).encode("utf-8")


def patch_mapinfos():
    raw = read(DATA + "MapInfos.json")
    text = raw.decode("utf-8")
    lines = text.split("\n")
    assert lines[0] == "[" and lines[-1] == "]", "MapInfos.json: unexpected layout"
    body = [l[:-1] if l.endswith(",") else l for l in lines[1:-1]]
    infos = [None if l == "null" else json.loads(l) for l in body]
    if "\n".join(["["] + [("null" if o is None else dump(o)) + ("," if i < len(infos) - 1 else "") for i, o in enumerate(infos)] + ["]"]) != text:
        sys.exit("MapInfos.json: the writer does not reproduce it - not touching it")
    mine = set(NEW_IDS)
    for mid in NEW_IDS:
        old = infos[mid] if mid < len(infos) else None
        if old and mid not in (11,) and not old["name"].startswith("Podziemia"):
            sys.exit("MapInfos.json: map %d is '%s' already - pick other ids (Underground_Data MAPS / BANDS / FLOORS)" % (mid, old["name"]))
    top = max(o["order"] for o in infos if o and o["id"] not in mine)
    while len(infos) <= max(NEW_IDS): infos.append(None)
    for k, mid in enumerate(NEW_IDS):
        old = infos[mid]
        infos[mid] = {"id": mid, "expanded": False, "name": NAMES[mid], "order": old["order"] if old else top + 1 + k,
                      "parentId": 10, "scrollX": 0, "scrollY": 0}
    # (trailing empty ids dropped as the editor does)
    while infos and infos[-1] is None: infos.pop()
    out = "\n".join(["["] + [("null" if o is None else dump(o)) + ("," if i < len(infos) - 1 else "") for i, o in enumerate(infos)] + ["]"])
    print("MapInfos: %s under 10 'Ruiny Zamku'" % ", ".join("%d" % i for i in NEW_IDS))
    return out.encode("utf-8")


def patch_system():
    raw = read(DATA + "System.json")
    text = raw.decode("utf-8")
    m = re.search(r'"switches":\[(.*?)\]', text)
    names = json.loads("[" + m.group(1) + "]")
    while len(names) <= max(SWITCH_NAMES): names.append("")
    for k, v in SWITCH_NAMES.items():
        if names[k] not in ("", v):
            sys.exit("System.json: switch %d is already '%s' - pick other switches (Underground_Data.js SWITCHES)" % (k, names[k]))
        names[k] = v
    new = text[:m.start()] + '"switches":' + dump(names) + text[m.end():]
    print("System: switches " + ", ".join("%d %s" % kv for kv in SWITCH_NAMES.items()))
    return new.encode("utf-8")


def staged_tilesets():
    """Tilesets.json as it will be after the install (for the Node checks and the previews)"""
    path = os.path.join(STAGING, "Tilesets_preview.json")
    with open(path, "wb") as f: f.write(patch_tilesets_quiet())
    return path


def patch_tilesets_quiet():
    import io, contextlib
    with contextlib.redirect_stdout(io.StringIO()):
        return patch_tilesets()


# ---------------------------------------------------------------------------------------------------- pictures
def preview(out_dir, seed, tpath):
    os.makedirs(out_dir, exist_ok=True)
    S10 = U.Sheets(F.flags10()[0])
    S12 = U.Sheets(tileset=U.TILESET2)
    lib = json.loads(read(os.path.join(STAGING, "Map130.json")).decode("utf-8"))
    U.render(lib, os.path.join(out_dir, "kawalki_pasmo1.png"), scale=0.5, sheets=S10)
    U.render(lib, os.path.join(out_dir, "kawalki_pasmo1_siatka.png"), grid=True, sheets=S10)
    for b, mid in zip(BANDS, LIB_IDS):
        m = json.loads(read(os.path.join(STAGING, "Map%03d.json" % mid)).decode("utf-8"))
        U.render(m, os.path.join(out_dir, "kawalki_pasmo%d.png" % b), scale=0.5, sheets=S12 if b == 2 else S10)
    for mid, name in ((9, "piwnica_map009"), (10, "ruiny_zamku_map010"), (140, "pietro10_straznica_map140")):
        m = json.loads(read(os.path.join(STAGING, "Map%03d.json" % mid)).decode("utf-8"))
        U.render(m, os.path.join(out_dir, name + ".png"), grid=True, sheets=S10)
    for f, mid in sorted(PD.FLOOR_MAPS.items()):
        m = json.loads(read(os.path.join(STAGING, "Map%03d.json" % mid)).decode("utf-8"))
        U.render(m, os.path.join(out_dir, "pietro%d_map%03d.png" % (f, mid)), scale=0.5, sheets=S12 if m["tilesetId"] == U.TILESET2 else S10)
    # the floors, made by Underground.js in Node with the staged libraries and flags
    for b, mid in [(1, 130)] + list(zip(BANDS, LIB_IDS)):
        res = subprocess.run(["node", os.path.join(HERE, "preview.js"), str(seed), os.path.join(STAGING, "Map%03d.json" % mid), tpath,
                              os.path.join(STAGING, "floors"), str(b), ",".join(map(str, SAMPLE[b]))],
                             capture_output=True, text=True, encoding="utf-8", errors="replace")
        print(res.stdout.strip())
        if res.returncode: sys.exit(res.stderr)
        for f in SAMPLE[b]:
            m = json.loads(read(os.path.join(STAGING, "floors", "floor%d.json" % f)).decode("utf-8"))
            U.render(m, os.path.join(out_dir, "pietro%d_ziarno%d.png" % (f, seed)), scale=0.5, sheets=S12 if b == 2 else S10)
    print("pictures in", out_dir)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    ap.add_argument("--seed", type=int, default=20261006)
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    maps = stage_maps()
    tpath = staged_tilesets()
    bad = False
    for mid in [130] + LIB_IDS:
        chk = subprocess.run(["node", os.path.join(HERE, "check_chunks.js"), os.path.join(STAGING, "Map%03d.json" % mid), tpath],
                             capture_output=True, text=True, encoding="utf-8", errors="replace")
        print(chk.stdout.strip())
        bad = bad or chk.returncode != 0
    chk = subprocess.run(["node", os.path.join(HERE, "check_places.js"), STAGING, tpath], capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(chk.stdout.strip() or chk.stderr.strip())
    bad = bad or chk.returncode != 0
    if bad: sys.exit("the libraries / hand-made floors have problems (above)")
    files = {"Tilesets.json": patch_tilesets(), "MapInfos.json": patch_mapinfos(), "System.json": patch_system()}
    if a.preview:
        preview(a.preview, a.seed, tpath)
    if not a.install:
        print("(dry run - nothing written to data/)")
        return
    if editor_running():
        sys.exit("STOP: the RPG Maker MZ editor is running - close it first.")
    # a map changed in the editor since our last install (its bytes are neither ours then nor ours now) stays as the author left it,
    # unless --force: the author's chunks / rooms win over this script
    import hashlib
    sha = lambda b: hashlib.sha256(b).hexdigest()
    rec_path = os.path.join(HERE, "installed.json")
    rec = json.loads(read(rec_path).decode("utf-8")) if os.path.exists(rec_path) else {}
    skip = []
    for mid, b in list(maps.items()):
        n = "Map%03d.json" % mid
        if a.force or not os.path.exists(DATA + n) or n not in rec: continue
        cur = sha(read(DATA + n))
        if cur != rec[n] and cur != sha(b):
            skip.append(n)
            del maps[mid]
    if skip: print("kept as the author left them (changed in the editor since the last install; --force replaces them):", ", ".join(skip))
    os.makedirs(BACKUP, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%H%M%S")
    names = list(files) + ["Map%03d.json" % mid for mid in maps]
    for n in names:
        if os.path.exists(DATA + n):
            shutil.copy2(DATA + n, BACKUP + n.replace(".json", "_before_%s.json" % stamp))
    for n, b in files.items():
        with open(DATA + n, "wb") as f: f.write(b)
    for mid, b in maps.items():
        with open(DATA + "Map%03d.json" % mid, "wb") as f: f.write(b)
        rec["Map%03d.json" % mid] = sha(b)
    with open(rec_path, "wb") as f: f.write(json.dumps(rec, indent=1, sort_keys=True).encode("utf-8"))
    print("installed:", ", ".join(sorted(names)), "- backups in", BACKUP)


if __name__ == "__main__":
    main()
