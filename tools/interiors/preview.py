# python preview.py <id> [out.png] [--plain]  - a static picture of a staged interior (irender), with the grid and the
# engine's walking overlay (red = blocked by tiles/events, green dots = reachable from the landing, cyan = resident spots)
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import irender as IR
from check_interiors import load, flags8, STAGING
sys.path.insert(0, os.path.join(IR.ROOT, "tools", "tavern"))
from engine import Engine
from PIL import Image, ImageDraw

def preview(mid, out, plain=False, scale=1):
    m = load(os.path.join(STAGING, "Map%03d.json" % mid))
    meta = load(os.path.join(STAGING, "Map%03d_meta.json" % mid))
    img = IR.render(m).convert("RGB")
    if not plain:
        eng = Engine(m["width"], m["height"], m["data"], flags8(), [e for e in m["events"] if e])
        seen = eng.reach([tuple(meta["exits"][0]["landing"][:2])], ignore=[(r["x"], r["y"]) for r in meta["residents"]])
        ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        floor = {(c[0], c[1]) for c in meta["floor"]}
        for (x, y) in floor:
            if (x, y) in seen: d.ellipse((x * 48 + 21, y * 48 + 21, x * 48 + 27, y * 48 + 27), fill=(60, 255, 60, 200))
            else: d.rectangle((x * 48 + 2, y * 48 + 2, x * 48 + 45, y * 48 + 45), outline=(255, 40, 40, 220), width=2)
        for r in meta["residents"]:
            d.rectangle((r["x"] * 48 + 4, r["y"] * 48 + 4, r["x"] * 48 + 43, r["y"] * 48 + 43), outline=(0, 230, 255, 255), width=3)
        img = img.convert("RGBA"); img.alpha_composite(ov); img = IR.grid(img, lines=False)
    if scale != 1: img = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    img.save(out)
    return img

if __name__ == "__main__":
    mid = int(sys.argv[1])
    out = next((a for a in sys.argv[2:] if a.endswith(".png")), os.path.join(STAGING, "preview_%03d.png" % mid))
    preview(mid, out, plain="--plain" in sys.argv)
    print(out)
