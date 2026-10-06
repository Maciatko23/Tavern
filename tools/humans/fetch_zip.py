# python tools/humans/fetch_zip.py <key> <pixellab character id> [--list]
# Downloads the PixelLab character zip (every state, rotation and animation; refused while an animation of it is still being made) and
# unpacks the animation frames into tools/humans/frames/<key>/<animation name>/<direction>/<i>.png (the input of build_humans.py).
# --list: only print what the zip holds.
import os, re, sys, io, json, zipfile, urllib.request, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
def main():
    key, cid = sys.argv[1:3]
    req = urllib.request.Request("https://api.pixellab.ai/mcp/characters/%s/download" % cid, headers={"User-Agent": "curl/8.0"})
    data = urllib.request.urlopen(req, timeout=120).read()
    z = zipfile.ZipFile(io.BytesIO(data))
    names = z.namelist()
    if "--list" in sys.argv:
        for n in names: print(n)
        return
    meta = [n for n in names if n.endswith("metadata.json")]
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
    if meta:
        open(os.path.join(out, "metadata.json"), "wb").write(z.read(meta[0]))
main()
