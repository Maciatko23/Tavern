# python tools/underground/dev_band.py <band 2-5> [--floors] [--seed N]
# While drawing a band's chunks: builds its library (chunks_bN.py) into staging/, checks every chunk with Underground.js's own
# checkChunk (check_chunks.js), draws the library (staging/lib_bN.png, with a grid: lib_bN_grid.png) and, with --floors, a few
# floors of one seed made by the game's generator (preview.js) - staging/bN_floorF.png. Writes nothing to data/.
import os, sys, json, argparse, subprocess, importlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import uglib as U          # noqa: E402
import chunks_deep as CD   # noqa: E402
import flags10 as F        # noqa: E402

STAGING = os.path.join(HERE, "staging")
SAMPLE = {1: "1,5,9", 2: "11,15,19,25,29", 3: "31,35,39,45,49", 4: "51,57,65,71,75", 5: "76,79,85,95,99"}


def tilesets_preview():
    """data/Tilesets.json with tileset 10's flags and band 2's tileset as build.py will install them (staging copy)"""
    path = os.path.join(STAGING, "Tilesets_preview.json")
    ts = U.load_json(U.ROOT + "data/Tilesets.json")
    ts[10]["flags"] = F.flags10()[0]
    while len(ts) <= U.TILESET2: ts.append(None)
    t2 = dict(ts[10])
    t2.update({"id": U.TILESET2, "name": U.TILESET2_NAME, "tilesetNames": U.TILESET2_NAMES, "flags": F.flags12()[0], "note": ""})
    ts[U.TILESET2] = t2
    with open(path, "wb") as f: f.write(json.dumps(ts, ensure_ascii=False).encode("utf-8"))
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("band", type=int)
    ap.add_argument("--floors", action="store_true")
    ap.add_argument("--seed", type=int, default=20261006)
    a = ap.parse_args()
    os.makedirs(STAGING, exist_ok=True)
    mod = importlib.import_module("chunks_b%d" % a.band)
    lib, chunks = CD.build(mod)
    mid = mod.LIBRARY["map_id"]
    path = os.path.join(STAGING, "Map%03d.json" % mid)
    lib.write_to(path)
    tpath = tilesets_preview()
    res = subprocess.run(["node", os.path.join(HERE, "check_chunks.js"), path, tpath], capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(res.stdout.strip())
    S = U.Sheets(tileset=mod.LIBRARY["tileset"])
    U.render(lib.to_json(), os.path.join(STAGING, "lib_b%d.png" % a.band), scale=0.5, sheets=S)
    U.render(lib.to_json(), os.path.join(STAGING, "lib_b%d_grid.png" % a.band), grid=True, sheets=S)
    if getattr(S, "missing", None): print("missing pictures:", S.missing)
    if a.floors:
        res = subprocess.run(["node", os.path.join(HERE, "preview.js"), str(a.seed), path, tpath, os.path.join(STAGING, "floors_b%d" % a.band),
                              str(a.band), SAMPLE[a.band]], capture_output=True, text=True, encoding="utf-8", errors="replace")
        print(res.stdout.strip(), res.stderr.strip()[:2000])
        d = os.path.join(STAGING, "floors_b%d" % a.band)
        for n in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            if n.endswith(".json"):
                m = U.load_json(os.path.join(d, n))
                U.render(m, os.path.join(STAGING, "b%d_%s.png" % (a.band, n[:-5])), scale=0.5, sheets=S)


if __name__ == "__main__":
    main()
