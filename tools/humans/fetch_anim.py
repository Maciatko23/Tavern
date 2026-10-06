# python tools/humans/fetch_anim.py <key> <character id> <animation name> <direction>=<animation id> ... [--n 9] [--into creatures]
# Downloads one animation's frames straight from PixelLab's file store (the ids get_character prints), while the character's zip is
# still locked by another animation being made: frames/<key>/<animation name>/<direction>/<i>.png (as fetch_zip.py lays them out).
import os, sys, io, urllib.request
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
n = 9
if "--n" in args:
    i = args.index("--n"); n = int(args[i + 1]); del args[i:i + 2]
root = HERE
if "--into" in args:
    i = args.index("--into"); root = os.path.join(HERE, "..", args[i + 1]); del args[i:i + 2]
key, cid, anim = args[:3]
base = "https://backblaze.pixellab.ai/file/pixellab-characters/028dbfa8-5f36-44f0-b776-f333514951f1/%s/animations/%s/%s/%d.png?t=1"
for pair in args[3:]:
    d, aid = pair.split("=")
    out = os.path.join(root, "frames", key, anim, d)
    os.makedirs(out, exist_ok=True)
    got = 0
    for k in range(n):
        try:
            req = urllib.request.Request(base % (cid, aid, d, k), headers={"User-Agent": "curl/8.0"})
            data = urllib.request.urlopen(req, timeout=60).read()
        except Exception:
            break
        Image.open(io.BytesIO(data)).save(os.path.join(out, "%d.png" % k)); got += 1
    print(anim, d, got)
