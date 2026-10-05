# python tools/podgrodzie/render_podgrodzie.py [out_dir] [--grid]
# Pictures of the staged Podgrodzie (tools/town/mzrender.py: the game's tile and sprite rules, no animation):
#   podgrodzie_cala_mapa.png      the whole map at 1:1
#   podgrodzie_opisana.png        the same with the houses' names (gold = with an interior), TownLife's spots and the exits
#   podgrodzie_blokady.png        what the hero can walk on (check_podgrodzie.py's engine: tiles, regions, events): green dots =
#                                 reachable from the gate, red = closed cells, magenta = open but not reachable
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import plib
sys.path.insert(0, plib.ROOT + "tools/town")
import mzrender as R

T = 48
FONT = plib.ROOT + "fonts/AlegreyaSans-Medium.ttf"
FONT_B = plib.ROOT + "fonts/AlegreyaSC-Bold.ttf"
def font(n, bold=False): return ImageFont.truetype(FONT_B if bold else FONT, n)
GOLD, INK, WHITE, CYAN = (250, 214, 64), (22, 18, 14), (240, 236, 226), (90, 220, 250)

def staged(mid=plib.MAP_ID):
    mp = R.load_json(os.path.join(plib.STAGING, "Map%03d.json" % mid))
    meta = R.load_json(os.path.join(plib.STAGING, "Map%03d_meta.json" % mid)) if mid == plib.MAP_ID else None
    return mp, meta

def render(mp):
    S = R.Sheets(mp["tilesetId"]); S.lenient = True
    return R.render(mp, sheets=S).convert("RGB"), S

def tag(d, cx, cy, text, fnt, fill, fg=INK):
    w = d.textlength(text, font=fnt); h = fnt.size + 4
    d.rounded_rectangle([cx - w / 2 - 6, cy - h / 2, cx + w / 2 + 6, cy + h / 2], radius=6, fill=fill, outline=INK, width=2)
    d.text((cx - w / 2, cy - h / 2 + 1), text, font=fnt, fill=fg)

def labelled(img, meta):
    out = img.copy()
    d = ImageDraw.Draw(out)
    fb, fs = font(24, True), font(18)
    for b in meta["buildings"]:
        x0, y0, x1, y1 = b["rect"]
        tag(d, (x0 + x1 + 1) / 2 * T, (y0 + 1.2) * T, b["name"], fb, GOLD if b["interior"] else WHITE)
    for k, (x, y, dd) in meta["spots"].items():
        cx, cy = x * T + T / 2, y * T + T / 2
        d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=CYAN, outline=INK, width=2)
        d.text((cx + 11, cy - 10), k, font=fs, fill=WHITE, stroke_width=2, stroke_fill=INK)
    for ex in meta["exits"]:
        d.rectangle([ex["x"] * T + 4, ex["y"] * T + 4, ex["x"] * T + T - 5, ex["y"] * T + T - 5], outline=(255, 80, 80), width=4)
    return out

def grid(img, every=1):
    out = img.copy(); d = ImageDraw.Draw(out)
    for y in range(out.height // T):
        for x in range(out.width // T):
            d.rectangle((x * T, y * T, x * T + T - 1, y * T + T - 1), outline=(60, 60, 60))
            if x % every == 0 and y % every == 0: d.text((x * T + 2, y * T + 2), "%d,%d" % (x, y), fill=(255, 255, 0))
    return out

def blockers(img, mp, meta):
    import check_podgrodzie as CK
    eng = CK.engine(mp)
    starts = [(44, r) for r in plib.GATE_ROWS]
    seen = eng.reach(starts)
    out = img.copy().convert("RGBA")
    lay = Image.new("RGBA", out.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for y in range(mp["height"]):
        for x in range(mp["width"]):
            if (x, y) in seen: d.ellipse((x * T + 20, y * T + 20, x * T + 28, y * T + 28), fill=(60, 255, 60, 230))
            elif eng.standable(x, y): d.rectangle((x * T + 3, y * T + 3, x * T + T - 4, y * T + T - 4), outline=(255, 0, 255, 230), width=3)
            else: d.rectangle((x * T + 1, y * T + 1, x * T + T - 2, y * T + T - 2), fill=(230, 40, 40, 70))
    out.alpha_composite(lay)
    return out.convert("RGB")

def gate_crops(out_dir, before=plib.ROOT + "backup_art_2026-10-05/podgrodzie/Map008_original.json"):
    """the town's west end before and after tools/town/west_gate.py (Map008 x 0..21, rows 42..56)"""
    for name, src in (("przed", before), ("po", plib.ROOT + "data/Map008.json")):
        if not os.path.exists(src): continue
        img, _ = render(R.load_json(src))
        img.crop((0, 42 * T, 22 * T, 57 * T)).save(os.path.join(out_dir, "brama_zachodnia_%s.png" % name), optimize=True)

def main():
    out_dir = next((a for a in sys.argv[1:] if not a.startswith("--")), plib.DOCS)
    os.makedirs(out_dir, exist_ok=True)
    if "--brama" in sys.argv:
        gate_crops(out_dir)
    mp, meta = staged()
    img, S = render(mp)
    if "--grid" in sys.argv:
        grid(img).save(os.path.join(out_dir, "podgrodzie_siatka.png"))
    img.save(os.path.join(out_dir, "podgrodzie_cala_mapa.png"), optimize=True)
    labelled(img, meta).save(os.path.join(out_dir, "podgrodzie_opisana.png"), optimize=True)
    blockers(img, mp, meta).save(os.path.join(out_dir, "podgrodzie_blokady.png"), optimize=True)
    print("rendered to", out_dir, "missing sheets:", sorted(getattr(S, "missing", set())))

if __name__ == "__main__":
    main()
