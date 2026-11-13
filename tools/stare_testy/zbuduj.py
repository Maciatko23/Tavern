# Staging for the old-tests pass (2026-11-12). Builds tools/stare_testy/staging/data/Map111.json from the CURRENT data/Map111.json:
# the palisade posts (layer 1 tiles 3904 and 3905, "pionowe bale") lost their region 2 ("na rowni z bohaterem", RegionLayers) when Podgrodzie
# was moved onto the 3x3 board - 263 of 267 posts were level before (git HEAD), 3 of 263 now, so the hero is drawn over the posts instead of
# sorting with them. This puts region 2 back on every such cell. Nothing else is touched; data/ is not written.
# Run: python tools/stare_testy/zbuduj.py     (then review, install by copying staging/data/Map111.json over data/Map111.json)
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W

SRC = os.path.join(ROOT, "data", "Map111.json")
OUT = os.path.join(HERE, "staging", "data", "Map111.json")
raw = open(SRC, "rb").read()
assert b"\r" not in raw, "Map111.json has CRLF"
m = json.loads(raw.decode("utf-8"))
assert W.map_text(m).encode("utf-8") == raw, "Map111.json is not in the editor's layout (round trip failed) - STOP"
assert all(e is None or e["id"] == i for i, e in enumerate(m["events"])), "events index != id"
assert all(e["id"] < 500 for e in m["events"] if e), "an event id >= 500 in the map file"
Wd, H = m["width"], m["height"]
fixed = 0
for y in range(H):
    for x in range(Wd):
        if W.at(m, 1, x, y) in (3904, 3905) and W.at(m, 5, x, y) != 2:
            W.put(m, 5, x, y, 2); fixed += 1
out = W.map_text(m)
back = json.loads(out)
assert back == m
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "wb").write(out.encode("utf-8"))
print("Map111: region 2 put back on", fixed, "palisade cells; source sha1", W.sha1(SRC), "-> staging", W.sha1(OUT))
