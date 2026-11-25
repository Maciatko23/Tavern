# python tools/bear2/fetch.py <character id> <animation display name> <motion folder>   (or: rot)
# The new bear's frames from its PixelLab zip (/mcp/characters/<id>/download): <state>/rotations/<dir>.png -> rot/<dir>.png,
# <state>/animations/<name>/<dir>/frame_NNN.png -> frames/<folder>/<dir>/<i>.png (the input of build_bear.py).
import io, os, sys, zipfile, urllib.request, re
HERE = os.path.dirname(os.path.abspath(__file__))
cid = sys.argv[1]
zpath = os.path.join(HERE, "char.zip")
if "--fresh" in sys.argv or not os.path.exists(zpath):
    req = urllib.request.Request("https://api.pixellab.ai/mcp/characters/%s/download" % cid, headers={"User-Agent": "curl/8.0"})
    open(zpath, "wb").write(urllib.request.urlopen(req, timeout=120).read())
z = zipfile.ZipFile(zpath)
names = z.namelist()
if sys.argv[2] == "rot":
    out = os.path.join(HERE, "rot"); os.makedirs(out, exist_ok=True)
    for n in names:
        m = re.search(r"rotations/([a-z-]+)\.png$", n)
        if m: open(os.path.join(out, m.group(1) + ".png"), "wb").write(z.read(n))
    print("rot:", sorted(os.listdir(out)))
else:
    anim, folder = sys.argv[2], sys.argv[3]
    got = {}
    for n in names:
        m = re.search(r"animations/([^/]+)/([a-z-]+)/frame_(\d+)\.png$", n)
        if m and (m.group(1) == anim or re.fullmatch(re.escape(anim) + r"-[0-9a-f]{8}", m.group(1))): got.setdefault(m.group(2), []).append((int(m.group(3)), n))   # (one direction a group: "<name>-<group id>")
    if not got: sys.exit("no animation %r; there are: %s" % (anim, sorted({re.search(r'animations/([^/]+)/', n).group(1) for n in names if '/animations/' in n})))
    for d, fs in got.items():
        out = os.path.join(HERE, "frames", folder, d); os.makedirs(out, exist_ok=True)
        for f in os.listdir(out): os.remove(os.path.join(out, f))
        for i, (_, n) in enumerate(sorted(fs)): open(os.path.join(out, "%d.png" % i), "wb").write(z.read(n))
    print(anim, "->", folder, {d: len(v) for d, v in got.items()})
