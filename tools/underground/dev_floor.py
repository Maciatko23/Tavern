# python tools/underground/dev_floor.py <floor 20-100> [...]
# While drawing a hand-made floor: builds it (places_deep.py) into staging/, checks it with check_places.js (Underground.js's own
# walk) and draws it (staging/floorNN.png, with a grid). Writes nothing to data/.
import os, sys, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import uglib as U            # noqa: E402
import places_deep as PD     # noqa: E402
import dev_band              # noqa: E402

STAGING = os.path.join(HERE, "staging")


def main():
    floors = [int(a) for a in sys.argv[1:]] or sorted(PD.FLOOR_BUILDERS)
    tpath = dev_band.tilesets_preview()
    for f in floors:
        mp = PD.FLOOR_BUILDERS[f]()
        path = os.path.join(STAGING, "Map%03d.json" % mp.id)
        mp.write_to(path)
        with open(path.replace(".json", "_spots.json"), "wb") as fh: fh.write(json.dumps(mp.spots).encode("utf-8"))
        res = subprocess.run(["node", os.path.join(HERE, "check_places.js"), STAGING, tpath, str(f)], capture_output=True, text=True,
                             encoding="utf-8", errors="replace")
        print(res.stdout.strip() or res.stderr.strip()[:1500])
        S = U.Sheets(tileset=mp.tileset)
        U.render(mp.to_json(), os.path.join(STAGING, "floor%d.png" % f), grid=True, sheets=S)
        if getattr(S, "missing", None): print("missing pictures:", S.missing)


if __name__ == "__main__":
    main()
