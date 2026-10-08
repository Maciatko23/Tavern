# python tools/osada/build.py [--preview [DIR]] [--overlay] [--install] [--force] [--props]
# The four hut interiors of Osada Milczących and the open doors of Map120 (docs/osada/CHATY.md):
#   Map120 "Osada Milczących"   tools/mountains/osada.py (the doors lead in, the Silent keep hours) - the same builder
#                               tools/mountains/build.py uses, so a rebuild there keeps the doors open
#   Map121 Wspólna izba, Map122 Chata tkaczki, Map123 Chata Najstarszego, Map124 Chata rzeźbiarza   huts.py
#   MapInfos                    121-124 as children of 120 (the other lines byte for byte as they are)
# Without arguments: builds everything into tools/osada/staging/ and runs the checks (the interiors' placement and walking
# checks of tools/interiors/check_interiors.py, the valley's reach check of tools/mountains/build.py) - writes nothing in data/.
#   --props         first rebuild img/characters/!Osada_Props.png from props/src (props.py)
#   --preview [DIR] pictures: each interior plain and with the walking overlay, the valley's huts (default docs/osada/)
#   --overlay       tools/osada/staging/overlay/data/ = the staged maps + the patched MapInfos, for the tests before the install:
#                   GAME_OVERLAY=tools/osada/staging/overlay CDP_PORT=9461 node tests/run.js osada_huts_test
#   --install       writes data/Map120-124.json + MapInfos.json: refuses while the RPG Maker MZ editor runs, copies what it
#                   replaces to backup_art_2026-10-07/osada/; a map of ours changed in the editor since our last install
#                   (tools/osada/installed.json, Map120 also tools/mountains/installed.json) is left alone - --force replaces it
import os, sys, json, argparse, shutil, datetime, hashlib, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
DATA = ROOT + "data/"
STAGING = os.path.join(HERE, "staging")
OVERLAY = os.path.join(STAGING, "overlay")
BACKUP = ROOT + "backup_art_2026-10-07/osada/"
REC = os.path.join(HERE, "installed.json")
MT_REC = ROOT + "tools/mountains/installed.json"
sys.path.insert(0, HERE)
sys.path.insert(0, ROOT + "tools/mountains")
import osada_data as OD     # noqa: E402
sha = lambda b: hashlib.sha256(b).hexdigest()


def read(p):
    with open(p, "rb") as f: return f.read()


def editor_running():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return False
    return any(l.lower().startswith("rpgmz") for l in out.splitlines())


def stage_valley():
    """Map120 from tools/mountains/osada.py, serialized like tools/mountains/build.py; its reach check"""
    import importlib.util
    spec = importlib.util.spec_from_file_location("mountains_build", ROOT + "tools/mountains/build.py")
    MB = importlib.util.module_from_spec(spec); spec.loader.exec_module(MB)      # tools/mountains/build.py (serialize, check)
    import osada
    j = osada.build().to_json()
    probs = MB.check(120, j)
    raw = MB.serialize(j)
    doors = [e for e in j["events"] if e and e["name"] in OD.HUT_OF_DOOR]
    if len(doors) != 4: probs.append("Map120: %d hut doors, not 4" % len(doors))
    for e in doors:
        mid = OD.HUT_OF_DOOR[e["name"]]
        tr = [c["parameters"] for c in e["pages"][0]["list"] if c["code"] == 201]
        if tr != [[0, mid, OD.LANDINGS[mid][0], OD.LANDINGS[mid][1], 8, 0]]: probs.append("Map120 %s -> %s" % (e["name"], tr))
    with open(os.path.join(STAGING, "Map120.json"), "wb") as f: f.write(raw)
    print("Map120 Osada Milczących: %d zdarzeń -> staging" % len([e for e in j["events"] if e]))
    return raw, probs


def stage_huts():
    import huts
    sys.path.insert(0, ROOT + "tools/interiors")
    import check_interiors as CI
    CI.STAGING = STAGING
    huts.stage()
    bad = 0
    for mid in sorted(OD.HUTS):
        bad += CI.check(mid)[0]
        m = json.loads(read(os.path.join(STAGING, "Map%03d.json" % mid)).decode("utf-8"))
        ex = [e for e in m["events"] if e and any(c["code"] == 201 for p in e["pages"] for c in p["list"])]
        tx, ty = OD.HUTS[mid][4]
        for e in ex:
            tr = [c["parameters"] for p in e["pages"] for c in p["list"] if c["code"] == 201]
            if tr != [[0, OD.MAP_OSADA, tx, ty, 2, 0]]: print("  PROBLEM Map%03d exit %s" % (mid, tr)); bad += 1
        ids = [e["id"] for e in m["events"] if e]
        if max(ids) >= 355: print("  PROBLEM Map%03d event ids up to %d" % (mid, max(ids))); bad += 1
    return {mid: read(os.path.join(STAGING, "Map%03d.json" % mid)) for mid in OD.HUTS}, bad


def patch_mapinfos(raw):
    """121-124 (children of 120) into the editor's MapInfos (one entry per line, LF); every other line stays as it is"""
    text = raw.decode("utf-8")
    assert "\r\n" not in text
    lines = text.split("\n")
    assert lines[0] == "[" and lines[-1] == "]", "MapInfos.json: unexpected layout"
    rows = [l[:-1] if l.endswith(",") else l for l in lines[1:-1]]
    infos = json.loads(text)
    ours = set(OD.HUTS)
    for mid in ours:
        if mid < len(infos) and infos[mid] and infos[mid]["name"] != OD.HUTS[mid][1]:
            sys.exit("MapInfos: id %d is already '%s' - not ours" % (mid, infos[mid]["name"]))
    order0 = max(o["order"] for o in infos if o and o["id"] not in ours) + 1
    for k, mid in enumerate(sorted(ours)):
        old = infos[mid] if mid < len(infos) and infos[mid] else None
        if old:                 # (a re-install: the editor's own entry, only the name and the parent are ours)
            o = dict(old); o["name"] = OD.HUTS[mid][1]; o["parentId"] = OD.MAP_OSADA
        else:
            o = {"id": mid, "expanded": False, "name": OD.HUTS[mid][1], "order": order0 + k, "parentId": OD.MAP_OSADA,
                 "scrollX": 0, "scrollY": 0}
        line = json.dumps(o, ensure_ascii=False, separators=(",", ":"))
        while len(rows) <= mid: rows.append("null")
        rows[mid] = line
    out = "\n".join(["["] + [r + ("," if i < len(rows) - 1 else "") for i, r in enumerate(rows)] + ["]"])
    js = json.loads(out)
    for mid in ours:
        assert js[mid]["id"] == mid and js[mid]["parentId"] == OD.MAP_OSADA
    assert [o for o in js if o and o["id"] not in ours] == [o for o in infos if o and o["id"] not in ours]
    return out.encode("utf-8")


def preview(out_dir, valley_raw):
    sys.path.insert(0, ROOT + "tools/interiors")
    import preview as PV
    import mtlib
    PV.STAGING = STAGING
    os.makedirs(out_dir, exist_ok=True)
    for mid, (key, name, *_r) in sorted(OD.HUTS.items()):
        PV.preview(mid, os.path.join(out_dir, "wnetrze_%d_%s.png" % (mid, key)), plain=True)
        PV.preview(mid, os.path.join(out_dir, "wnetrze_%d_%s_przejscia.png" % (mid, key)))
    j = json.loads(valley_raw.decode("utf-8"))
    mtlib.render(j, os.path.join(out_dir, "osada_chaty.png"), box=(3, 9, 35, 28), scale=0.75, grid=True)
    print("pictures ->", os.path.relpath(out_dir, ROOT))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", nargs="?", const=ROOT + "docs/osada")
    ap.add_argument("--overlay", action="store_true")
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--props", action="store_true")
    a = ap.parse_args()
    os.makedirs(STAGING, exist_ok=True)
    if a.props:
        import props
        props.build()
    if not os.path.exists(ROOT + "img/characters/!Osada_Props.png"):
        sys.exit("img/characters/!Osada_Props.png is missing - run with --props")
    valley, probs = stage_valley()
    for p in probs: print("  PROBLEM", p)
    huts_raw, bad = stage_huts()
    infos = patch_mapinfos(read(DATA + "MapInfos.json"))
    writes = {"Map120.json": valley, "MapInfos.json": infos}
    writes.update({"Map%03d.json" % mid: raw for mid, raw in huts_raw.items()})
    if a.preview: preview(a.preview, valley)
    if a.overlay:
        os.makedirs(os.path.join(OVERLAY, "data"), exist_ok=True)
        for n, b in writes.items():
            with open(os.path.join(OVERLAY, "data", n), "wb") as f: f.write(b)
        print("overlay -> %s (GAME_OVERLAY=tools/osada/staging/overlay)" % os.path.relpath(OVERLAY, ROOT))
    if probs or bad:
        sys.exit("STOP: %d problems (see above)" % (len(probs) + bad))
    if not a.install:
        print("checks OK - nothing written in data/ (--install writes)")
        return
    if editor_running():
        sys.exit("STOP: the RPG Maker MZ editor (RPGMZ.exe) is running - close it first (it would overwrite data/ on save).")
    rec = json.loads(read(REC).decode("utf-8")) if os.path.exists(REC) else {}
    mt = json.loads(read(MT_REC).decode("utf-8")) if os.path.exists(MT_REC) else {}
    for n in sorted(writes):
        if n == "MapInfos.json" or not os.path.exists(DATA + n) or a.force: continue
        cur = sha(read(DATA + n))
        known = {rec.get(n), mt.get(n) if n == "Map120.json" else None, sha(writes[n])}
        if cur not in known:
            print("SKIP %s: changed in the editor since the last install (--force replaces it)" % n)
            del writes[n]
    os.makedirs(BACKUP, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%H%M%S")
    for n in writes:
        if os.path.exists(DATA + n):
            shutil.copy2(DATA + n, BACKUP + n.replace(".json", "_before_%s.json" % stamp))
    for n, b in writes.items():
        with open(DATA + n, "wb") as f: f.write(b)
        if n != "MapInfos.json": rec[n] = sha(b)
    with open(REC, "wb") as f: f.write((json.dumps(rec, indent=1, sort_keys=True) + "\n").encode("utf-8"))
    if "Map120.json" in writes:          # (tools/mountains/build.py would otherwise take the new Map120 for an editor change)
        mt["Map120.json"] = rec["Map120.json"]
        with open(MT_REC, "wb") as f: f.write((json.dumps(mt, indent=1, sort_keys=True) + "\n").encode("utf-8"))
    print("installed:", ", ".join(sorted(writes)), "- backups in", os.path.relpath(BACKUP, ROOT))


if __name__ == "__main__":
    main()
