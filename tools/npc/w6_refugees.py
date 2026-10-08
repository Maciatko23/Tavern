# python tools/npc/w6_refugees.py [--lineup FILE]
# W6 "Ludzie z promu" (2026-10-06): the two refugees of the second wave (day 24) - Bogdan and Halina - as standing figures. PixelLab
# pro characters in the hero's style (style_character_id = the hero bf29bbe1-...; 64 x 64, 8 rotations, no walk: they stand by their
# tent in the camp and work on grandpa's field during the work week - TownQuests "props", not TownLife residents). Each a "$" sheet
# img/characters/$Npc_<Key>.png (3 x 4 cells of 64 x 64, rows down / left / right / up, the standing rotation in all three columns),
# the feet on the hero's standing rows (the same as tools/mountains/silent_npcs.py). 40 generations.
import os, io, sys, json, zipfile, argparse, tempfile, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CHARS = os.path.join(ROOT, "img", "characters")
CACHE = os.path.join(tempfile.gettempdir(), "w6_pixellab")   # (the downloads: not kept in the project)
FEET = {"south": 61, "west": 62, "east": 62, "north": 60}
ROWS = ["south", "west", "east", "north"]
NPCS = [
    {"key": "Bogdan", "name": "Bogdan (uchodźca z drugiej fali)", "pixellab_id": "f5e6c4e7-adc4-41c5-b0f5-0940d5ff5f94", "gens": 20,
     "description": "Bogdan, a refugee farmhand about 45 who fled a war, broad tired face with a short greying brown beard, balding head with short grey hair at the sides, faded patched rust-brown wool tunic with the sleeves rolled up, a coarse rope belt, a rolled empty sack strapped across his back, grey trousers tied at the calves with cloth strips, worn bark sandals, dusty and weary, poor, empty hands, full body, standing, facing the viewer"},
    {"key": "Halina", "name": "Halina (uchodźczyni z drugiej fali)", "pixellab_id": "ed134a55-f0d8-44c2-92c8-e08f7f4be24e", "gens": 20,
     "description": "Halina, a refugee peasant woman about 50 who fled a war, weathered kind face with wrinkles and tired eyes, a faded dark-red headscarf tied under the chin, a long patched undyed grey-brown wool dress, a dirty off-white apron, a dark green knitted shawl crossed over the chest, worn brown shoes, poor and weary, empty hands, full body, standing, facing the viewer"},
]


def rotations(cid):
    os.makedirs(CACHE, exist_ok=True)
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
            if dy >= 0: out.alpha_composite(im, (c * 64, r * 64 + dy))
            else: out.alpha_composite(im.crop((0, -dy, 64, 64)), (c * 64, r * 64))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lineup")
    a = ap.parse_args()
    made = []
    for e in NPCS:
        sh = sheet(rotations(e["pixellab_id"]))
        sh.save(os.path.join(CHARS, "$Npc_%s.png" % e["key"]))
        made.append((e["key"], sh))
        print("wrote $Npc_%s.png" % e["key"])
    if a.lineup and made:
        hero = Image.open(os.path.join(CHARS, "Hero_Walk.png")).convert("RGBA")
        others = [k for k in ("Ludmila", "Rafal", "Marek") if os.path.exists(os.path.join(CHARS, "$Npc_%s.png" % k))]
        S = 3
        cols = 1 + len(others) + len(made)
        pv = Image.new("RGBA", (cols * 64 * S, 64 * 4 * S), (110, 110, 110, 255))
        for r, d in enumerate(ROWS):
            hr = {"south": 0, "west": 2, "east": 6, "north": 4}[d]
            pv.alpha_composite(hero.crop((0, hr * 64, 64, hr * 64 + 64)).resize((64 * S, 64 * S), Image.NEAREST), (0, r * 64 * S))
            for i, k in enumerate(others):
                o = Image.open(os.path.join(CHARS, "$Npc_%s.png" % k)).convert("RGBA")
                pv.alpha_composite(o.crop((64, r * 64, 128, r * 64 + 64)).resize((64 * S, 64 * S), Image.NEAREST), ((i + 1) * 64 * S, r * 64 * S))
            for i, (k, sh) in enumerate(made):
                pv.alpha_composite(sh.crop((64, r * 64, 128, r * 64 + 64)).resize((64 * S, 64 * S), Image.NEAREST), ((i + 1 + len(others)) * 64 * S, r * 64 * S))
        os.makedirs(os.path.dirname(os.path.abspath(a.lineup)), exist_ok=True)
        pv.save(a.lineup)
        print("lineup", a.lineup)


if __name__ == "__main__":
    main()
