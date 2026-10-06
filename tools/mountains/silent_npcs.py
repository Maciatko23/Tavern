# python tools/mountains/silent_npcs.py [--lineup FILE]
# The Silent of Osada Milczących (Map120) as standing figures: PixelLab pro characters made in the hero's style
# (style_character_id = the hero bf29bbe1-...; 64 x 64, 8 rotations, no walk - they stand and do not talk), each a "$" sheet
# img/characters/$Npc_<Key>.png (3 x 4 cells of 64 x 64, rows down / left / right / up, the standing rotation in all three
# columns) with the feet moved to the hero's standing rows in Hero_Walk.png (S 61, W 62, E 62, N 60 - tools/npc/build_npc.py).
# The ids and descriptions: tools/mountains/silent.json. Downloads https://api.pixellab.ai/mcp/characters/<id>/download.
import os, io, sys, json, zipfile, argparse, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CHARS = os.path.join(ROOT, "img", "characters")
CACHE = os.path.join(HERE, "pixellab")
FEET = {"south": 61, "west": 62, "east": 62, "north": 60}
ROWS = ["south", "west", "east", "north"]


def rotations(cid):
    path = os.path.join(CACHE, "char_%s.zip" % cid[:8])
    if not os.path.exists(path):
        req = urllib.request.Request("https://api.pixellab.ai/mcp/characters/%s/download" % cid, headers={"User-Agent": "curl/8.0"})
        with urllib.request.urlopen(req, timeout=180) as r, open(path, "wb") as f:
            f.write(r.read())
    z = zipfile.ZipFile(path)
    out = {}
    for d in ROWS:
        name = next(n for n in z.namelist() if n.endswith("rotations/%s.png" % d))
        out[d] = Image.open(io.BytesIO(z.read(name))).convert("RGBA")
    return out


def feet_row(im):
    px = im.load()
    for y in range(im.height - 1, -1, -1):
        if any(px[x, y][3] > 100 for x in range(im.width)): return y
    return im.height - 1


def sheet(rots):
    out = Image.new("RGBA", (192, 256), (0, 0, 0, 0))
    for r, d in enumerate(ROWS):
        im = rots[d]
        dy = FEET[d] - feet_row(im)
        for c in range(3):
            out.alpha_composite(im, (c * 64, r * 64 + dy)) if dy >= 0 else out.alpha_composite(im.crop((0, -dy, 64, 64)), (c * 64, r * 64))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lineup")
    a = ap.parse_args()
    data = json.load(open(os.path.join(HERE, "silent.json"), encoding="utf-8"))
    made = []
    for e in data:
        if not e.get("pixellab_id"): continue
        sh = sheet(rotations(e["pixellab_id"]))
        sh.save(os.path.join(CHARS, "$Npc_%s.png" % e["key"]))
        made.append((e["key"], sh))
        print("wrote $Npc_%s.png" % e["key"])
    if a.lineup and made:
        hero = Image.open(os.path.join(CHARS, "Hero_Walk.png")).convert("RGBA")
        S = 3
        W = (len(made) + 1) * 64 * S
        pv = Image.new("RGBA", (W, 64 * 4 * S), (110, 110, 110, 255))
        for r, d in enumerate(ROWS):
            hr = {"south": 0, "west": 2, "east": 6, "north": 4}[d]
            pv.alpha_composite(hero.crop((0, hr * 64, 64, hr * 64 + 64)).resize((64 * S, 64 * S), Image.NEAREST), (0, r * 64 * S))
            for i, (k, sh) in enumerate(made):
                pv.alpha_composite(sh.crop((64, r * 64, 128, r * 64 + 64)).resize((64 * S, 64 * S), Image.NEAREST), ((i + 1) * 64 * S, r * 64 * S))
        pv.save(a.lineup)


if __name__ == "__main__":
    main()
