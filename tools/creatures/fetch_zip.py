# python tools/creatures/fetch_zip.py <key> <pixellab character id> [--list]
# Downloads the PixelLab character zip and unpacks the animation frames into tools/creatures/frames/<key>/<animation name>/<direction>/<i>.png
# (the input of build_creatures.py). --list: only print what the zip holds. (Same as tools/humans/fetch_zip.py.)
import os, re, sys, io, zipfile, urllib.request, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
def main():
    key, cid = sys.argv[1:3]
    req = urllib.request.Request("https://api.pixellab.ai/mcp/characters/%s/download" % cid, headers={"User-Agent": "curl/8.0"})
    data = urllib.request.urlopen(req, timeout=180).read()
    z = zipfile.ZipFile(io.BytesIO(data))
    names = z.namelist()
    if "--list" in sys.argv:
        for n in names: print(n)
        return
    anims = {}
    for n in names:
        parts = n.split("/")
        if "animations" in parts and n.endswith(".png"):
            i = parts.index("animations")
            rest = parts[i + 1:]
            if len(rest) >= 3:
                anim, d, f = rest[-3], rest[-2], rest[-1]
                anims.setdefault(anim, {}).setdefault(d, []).append((n, f))
    out = os.path.join(HERE, "frames", key)
    for anim, dirs in anims.items():
        for d, files in dirs.items():
            dst = os.path.join(out, anim, d)
            if os.path.isdir(dst): shutil.rmtree(dst)
            os.makedirs(dst)
            for n, f in files:
                open(os.path.join(dst, "%d.png" % int(re.sub(r"\D", "", f))), "wb").write(z.read(n))
        print(anim, {d: len(v) for d, v in dirs.items()})
main()
