# python screens.py <staged map.json> <out prefix> <hour> [name:x:y:dir ...]
# In-game screens (1280x720, the map's own zoom 1.5, the hero standing at the spot) through render.js, with the staged
# tileset-8 flags. Default spots: the key places of the ground floor.
import os, sys, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
src, prefix, hour = os.path.abspath(sys.argv[1]), sys.argv[2], int(sys.argv[3])
SPOTS = {"bar": (50, 69, 8), "scena": (73, 38, 8), "kominek": (27, 58, 8), "kosci": (92, 40, 8),
         "sien": (50, 81, 8), "kuchnia": (44, 52, 8), "biesiadna": (27, 40, 8), "mysliwski": (8, 37, 8)}
spots = SPOTS
if len(sys.argv) > 4:
    spots = {}
    for a in sys.argv[4:]:
        n, x, y, d = a.split(":"); spots[n] = (int(x), int(y), int(d))
jobs = []
for n, (x, y, d) in spots.items():
    jobs.append({"map": src, "id": 1, "out": os.path.abspath("%s_%s.png" % (prefix, n)), "mode": "screen", "hour": hour,
                 "player": [x, y, d], "wait": 150, "flags8": os.path.join(HERE, "staging", "tileset8_flags.json")})
jf = os.path.join(HERE, "staging", "renders", "_screens_jobs.json")
json.dump(jobs, open(jf, "w"))
env = dict(os.environ); env.setdefault("CDP_PORT", "9372")
for attempt in range(3):
    subprocess.run(["node", os.path.join(HERE, "render.js"), jf], cwd=ROOT, env=env, check=True)
    todo = [j for j in jobs if not os.path.exists(j["out"])]
    if not todo: break
    json.dump(todo, open(jf, "w"))
