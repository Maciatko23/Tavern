# python regions.py <staged map.json> <out prefix> <hour> name:x:y:w:h [...]
# Parts of a staged map at 1:1 through render.js (mode "region"), each saved as <prefix>_<name>.png and a half-size
# copy <prefix>_<name>_half.png for a quick look.
import os, sys, json, subprocess
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
src, prefix, hour = os.path.abspath(sys.argv[1]), sys.argv[2], int(sys.argv[3])
jobs = []
for a in sys.argv[4:]:
    n, x, y, w, h = a.split(":")
    jobs.append({"map": src, "id": 1, "out": os.path.abspath("%s_%s.png" % (prefix, n)), "mode": "region",
                 "region": [int(x), int(y), int(w), int(h)], "hour": hour, "wait": 70,
                 "flags8": os.path.join(HERE, "staging", "tileset8_flags.json")})
jf = os.path.join(HERE, "staging", "renders", "_regions_jobs.json")
env = dict(os.environ); env.setdefault("CDP_PORT", "9372")
for j in jobs:
    if os.path.exists(j["out"]): os.remove(j["out"])
todo = jobs
for attempt in range(3):
    json.dump(todo, open(jf, "w"))
    subprocess.run(["node", os.path.join(HERE, "render.js"), jf], cwd=ROOT, env=env, check=True)
    todo = [j for j in jobs if not os.path.exists(j["out"])]
    if not todo: break
for j in jobs:
    if os.path.exists(j["out"]):
        im = Image.open(j["out"])
        im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(j["out"][:-4] + "_half.png")
