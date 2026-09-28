# python render_full.py <staged map.json> <out.png> [--hour 18] [--id 1] [--nodark] [--tile 26x21] [--flags8 staging/tileset8_flags.json]
# The whole map at 1:1 in the real game: rendered in regions by render.js (mode "region") and stitched together.
import os, sys, json, subprocess, math
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
args = sys.argv[1:]
def opt(k, d=None):
    return args[args.index(k) + 1] if k in args else d
src, out = os.path.abspath(args[0]), os.path.abspath(args[1])
hour = int(opt("--hour", 18)); mid = int(opt("--id", 1)); nodark = "--nodark" in args
tw, th = [int(v) for v in opt("--tile", "26x21").split("x")]
flags8 = opt("--flags8", os.path.join(HERE, "staging", "tileset8_flags.json"))
m = json.load(open(src, encoding="utf-8"))
W, H = m["width"], m["height"]
tmp = os.path.join(HERE, "staging", "renders", "_tiles_" + os.path.splitext(os.path.basename(out))[0])   # (one per output: two renders may run at once)
os.makedirs(tmp, exist_ok=True)
jobs, parts = [], []
for ty in range(0, H, th):
    for tx in range(0, W, tw):
        w, h = min(tw, W - tx), min(th, H - ty)
        p = os.path.join(tmp, "t_%d_%d.png" % (tx, ty))
        jobs.append({"map": src, "id": mid, "out": p, "mode": "region", "region": [tx, ty, w, h], "hour": hour,
                     "nodark": nodark, "wait": 70, "flags8": flags8})
        parts.append((tx, ty, p))
jf = os.path.join(tmp, "jobs.json")
env = dict(os.environ); env.setdefault("CDP_PORT", "9372")
for p in [j["out"] for j in jobs]:
    if os.path.exists(p): os.remove(p)
todo = jobs
for attempt in range(3):             # (a region whose page stalled is rendered again)
    json.dump(todo, open(jf, "w"))
    subprocess.run(["node", os.path.join(HERE, "render.js"), jf], cwd=ROOT, env=env, check=True)
    todo = [j for j in jobs if not os.path.exists(j["out"])]
    if not todo: break
img = Image.new("RGB", (W * 48, H * 48), (0, 0, 0))
for tx, ty, p in parts:
    if os.path.exists(p):
        img.paste(Image.open(p).convert("RGB"), (tx * 48, ty * 48))
    else:
        print("missing", p)
img.save(out)
print("saved", out, img.size)
