# python tools/bear/fetch_frames.py <get_character dump.txt> <animation name> <motion folder> [direction ...]
# Downloads the frames of one animation of the bear (PixelLab character feebb09f, "Niedzwiedz (walka)") into
# tools/bear/frames/<motion folder>/<direction>/<i>.png - the input of build_bear.py (motions.json says which folders make which sheet).
# The dump is the text mcp__pixellab__get_character returns (saved to a file when it is too long): every animation as
#   "  <name> — N dir (...) ... [group: ...]" and under it "    <direction>: <url of frame 0>, <url of frame 1>, ..."
# (the frame URLs carry their ?t= token and are refused without a curl User-Agent)
import os, re, sys, io, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

def main():
    dump, anim, folder = sys.argv[1:4]
    only = set(sys.argv[4:])
    cur, urls = None, {}
    for line in open(dump, encoding="utf-8").read().splitlines():
        m = re.match(r"  (\S+) — ", line)
        if m: cur = m.group(1); continue
        m = re.match(r"    ([a-z-]+): (https://\S.*)$", line)
        if m and cur == anim: urls[m.group(1)] = [u.strip() for u in m.group(2).split(",")]
    if not urls: sys.exit("no animation %r in %s" % (anim, dump))
    for d, us in urls.items():
        if only and d not in only: continue
        out = os.path.join(HERE, "frames", folder, d)
        os.makedirs(out, exist_ok=True)
        for f in os.listdir(out):
            if f.endswith(".png"): os.remove(os.path.join(out, f))
        for i, u in enumerate(us):
            req = urllib.request.Request(u, headers={"User-Agent": "curl/8.0"})
            im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert("RGBA")
            im.save(os.path.join(out, "%d.png" % i))
        print(anim, d, len(us), "frames ->", out)

if __name__ == "__main__":
    main()
