# python render_town.py [A] [B] [C]  -> docs/miasteczko/koncepcja_<X>.png, koncepcja_<X>_blokady.png, koncepcja_<X>_czysta.png
# The concept pictures, drawn in Python from the staged maps (mzrender.py: the game's tile and sprite rules, no animation),
# so the same maps always give the same bytes:
#   koncepcja_X.png          the whole map at 1:1 with the buildings' names (gold = with an interior), numbered NPC spots, the
#                            exits and the tavern door, and a legend in Polish on the right
#   koncepcja_X_blokady.png  what closes the way: red = invisible blockers under solid tiles, orange = pictures that block
#                            (props, lamps, trees, doors), purple = tiles closed by the tileset's own flags; problems (should
#                            be none) in magenta (solid but open) and cyan (closed over nothing); green dots = reachable on
#                            foot from the south exit
#   koncepcja_X_czysta.png   the map alone (no labels), for comparing the concepts
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mzrender as R
from check_town import analyse
from townlib import CAST, STAGING, DOCS, ROOT, TILESETS

T = 48
FONT = os.path.join(ROOT, "fonts", "AlegreyaSans-Medium.ttf")
FONT_B = os.path.join(ROOT, "fonts", "AlegreyaSC-Bold.ttf")
def font(n, bold=False): return ImageFont.truetype(FONT_B if bold else FONT, n)

GOLD, WHITE, INK = (250, 214, 64), (240, 236, 226), (22, 18, 14)
NPC_COL = (90, 200, 250)

def tag(d, cx, cy, text, fnt, fill, fg=INK, pad=6, outline=INK):
    w = d.textlength(text, font=fnt)
    h = fnt.size + 4
    d.rounded_rectangle([cx - w / 2 - pad, cy - h / 2, cx + w / 2 + pad, cy + h / 2], radius=6, fill=fill, outline=outline, width=2)
    d.text((cx - w / 2, cy - h / 2 + 1), text, font=fnt, fill=fg)

def arrow(d, x0, y0, x1, y1, col, w=6):
    d.line([(x0, y0), (x1, y1)], fill=col, width=w)
    import math
    a = math.atan2(y1 - y0, x1 - x0)
    for s in (0.5, -0.5):
        d.line([(x1, y1), (x1 - 22 * math.cos(a + s), y1 - 22 * math.sin(a + s))], fill=col, width=w)

def wrap(text, fnt, width, d):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=fnt) <= width: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def labelled(concept, base, A):
    meta = A["meta"]
    W, H = base.size
    LEG = 820
    out = Image.new("RGB", (W + LEG, max(H, 1900)), (24, 22, 26))
    out.paste(base.convert("RGB"), (0, 0))
    d = ImageDraw.Draw(out)
    fb, fs, fl = font(26), font(21), font(19)
    # buildings
    for i, b in enumerate(meta["buildings"], 1):
        x0, y0, x1, y1 = b["rect"]
        cx, cy = (x0 + x1 + 1) / 2 * T, (y0 + 1.1) * T
        txt = "%d. %s" % (i, b.get("label") or b["name"])
        tag(d, cx, cy, txt, fb if b["kind"] in ("tawerna", "ratusz", "świątynia") else fs, GOLD if b["interior"] else WHITE)
        if b["interior"]:
            fx, fy = b["door"]
            d.rectangle([fx * T + 4, fy * T + 4, fx * T + T - 4, fy * T + T - 4], outline=GOLD, width=4)
    # other labels
    for text, x, y, kind in meta["labels"]:
        col = {"rynek": (255, 236, 150), "twierdza": (200, 205, 215), "uchodźcy": (240, 190, 150)}.get(kind, WHITE)
        tag(d, (x + 0.5) * T, (y + 0.5) * T, text, fb if kind == "rynek" else fs, col)
    # NPC spots
    for i, (key, x, y, dr) in enumerate(meta["npcs"], 1):
        cx, cy = x * T + T // 2, y * T + T // 2
        d.ellipse([cx - 17, cy - 17, cx + 17, cy + 17], fill=NPC_COL, outline=INK, width=3)
        t = str(i); tw = d.textlength(t, font=fl)
        d.text((cx - tw / 2, cy - 11), t, font=fl, fill=INK)
    # exits and the door
    sx = meta["south_exits"]; ey = meta["east_exits"]
    d.rectangle([sx[0] * T, (H // T - 1) * T, (sx[-1] + 1) * T, H], outline=(255, 90, 60), width=5)
    tag(d, (sx[1] + 0.5) * T, H - 1.6 * T, "↓ Polna droga (Map022)", fs, (255, 150, 120))
    d.rectangle([(W // T - 1) * T, ey[0] * T, W, (ey[-1] + 1) * T], outline=(255, 90, 60), width=5)
    tag(d, W - 4.2 * T, (ey[1] - 1.1) * T, "→ Posiadłość Lorda (Map024)", fs, (255, 150, 120))
    dx, dy = meta["door"]
    d.rectangle([(dx - 1) * T, dy * T, (dx + 2) * T, (dy + 1) * T], outline=(255, 90, 60), width=5)
    # the legend
    X = W + 24
    y = 18
    d.text((X, y), meta["title"], font=font(34, True), fill=GOLD); y += 50
    d.text((X, y), "Okolice Tawerny (Map008): %d x %d pól (dziś 30 x 24)" % (meta["width"], meta["height"]), font=fs, fill=WHITE); y += 34
    for l in wrap(meta.get("idea", ""), fs, LEG - 50, d):
        d.text((X, y), l, font=fs, fill=(210, 205, 195)); y += 26
    y += 10
    d.text((X, y), "Budynki (%d; złote = z wnętrzem, drzwi w złotej ramce)" % len(meta["buildings"]), font=font(24, True), fill=GOLD); y += 36
    for i, b in enumerate(meta["buildings"], 1):
        col = GOLD if b["interior"] else WHITE
        t = "%d. %s%s" % (i, b["name"], "  - wnętrze" if b["interior"] else "")
        d.text((X, y), t, font=fl, fill=col); y += 24
    y += 14
    d.text((X, y), "Postacie (miejsca; grafiki później - PixelLab)", font=font(24, True), fill=NPC_COL); y += 36
    for i, (key, x, yy, dr) in enumerate(meta["npcs"], 1):
        name, role, hook = CAST[key]
        d.ellipse([X, y + 2, X + 22, y + 24], fill=NPC_COL, outline=INK, width=2)
        t = str(i); tw = d.textlength(t, font=font(16))
        d.text((X + 11 - tw / 2, y + 3), t, font=font(16), fill=INK)
        d.text((X + 30, y), "%s - %s" % (name, role.split(",")[0].split(":")[0]), font=fl, fill=WHITE); y += 25
    y += 14
    d.text((X, y), "Przejścia", font=font(24, True), fill=(255, 150, 120)); y += 34
    for t in ["Południe (%d-%d, %d) <-> Polna droga" % (sx[0], sx[-1], meta["height"] - 1),
              "Wschód (%d, %d-%d) <-> Posiadłość Lorda" % (meta["width"] - 1, ey[0], ey[-1]),
              "Drzwi tawerny (%d, %d) <-> Tawerna (Map001)" % (dx, dy)]:
        d.text((X, y), t, font=fl, fill=WHITE); y += 25
    return out

def blocked(concept, base, A):
    W, H = base.size
    eng, by, solid, flagged, reach = A["eng"], A["by"], A["solid"], A["flagged"], A["reach"]
    dim = Image.blend(base.convert("RGB"), Image.new("RGB", base.size, (0, 0, 0)), 0.35).convert("RGBA")
    ov = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for (x, y) in sorted(eng.block):
        if not (0 <= x < W // T and 0 <= y < H // T): continue
        eid, name, pic = by.get((x, y), (0, "", False))
        ghost = not pic and (x, y) not in solid
        col = (0, 230, 255, 170) if ghost else (255, 150, 30, 120) if pic else (230, 40, 40, 120)
        d.rectangle([x * T + 1, y * T + 1, x * T + T - 2, y * T + T - 2], fill=col, outline=col[:3] + (230,), width=2)
    for (x, y) in sorted(flagged):
        d.rectangle([x * T + 1, y * T + 1, x * T + T - 2, y * T + T - 2], fill=(150, 60, 220, 120))
    for (x, y) in sorted(solid):
        if (x, y) not in eng.block and (x, y) not in flagged:
            d.rectangle([x * T + 1, y * T + 1, x * T + T - 2, y * T + T - 2], fill=(255, 0, 255, 200))
    for (x, y) in sorted(reach):
        d.ellipse([x * T + 20, y * T + 20, x * T + 28, y * T + 28], fill=(120, 255, 120, 200))
    dim.alpha_composite(ov)
    top = 96
    out = Image.new("RGB", (W, H + top), (24, 22, 26))
    out.paste(dim.convert("RGB"), (0, top))
    dd = ImageDraw.Draw(out)
    dd.text((16, 10), "%s - co zamyka drogę (kontrola blokad)" % A["meta"]["title"], font=font(30, True), fill=GOLD)
    items = [((230, 40, 40), "niewidoczna blokada pod murem / dachem / płotem (%d pól)" % sum(1 for c, v in by.items() if not v[2])),
             ((255, 150, 30), "obraz, który blokuje: rzecz, latarnia, drzewo, drzwi (%d pól)" % sum(1 for c, v in by.items() if v[2])),
             ((120, 255, 120), "osiągalne pieszo od wyjścia na południe (%d pól)" % len(reach)),
             ((255, 0, 255), "BŁĄD: widać mur, a da się przejść (%d)" % sum(1 for c in solid if c not in eng.block and c not in flagged)),
             ((0, 230, 255), "BŁĄD: blokada nad niczym (%d)" % sum(1 for c, v in by.items() if not v[2] and c not in solid))]
    x = 16
    for col, t in items:
        dd.rectangle([x, 56, x + 22, 78], fill=col, outline=INK)
        dd.text((x + 30, 54), t, font=font(19), fill=WHITE)
        x += 34 + int(dd.textlength(t, font=font(19))) + 26
    return out

def render(concept):
    A = analyse(concept)
    base = R.render(A["map"], tilesets=TILESETS)
    os.makedirs(DOCS, exist_ok=True)
    outs = {"czysta": base.convert("RGB"), "": labelled(concept, base, A), "blokady": blocked(concept, base, A)}
    paths = []
    for k, im in outs.items():
        p = os.path.join(DOCS, "koncepcja_%s%s.png" % (concept, "_" + k if k else ""))
        im.save(p, optimize=True)
        paths.append(p)
    return paths

def compare():
    """the three clean maps side by side at the same scale (porownanie_ABC.png)"""
    ims = [Image.open(os.path.join(DOCS, "koncepcja_%s_czysta.png" % c)).convert("RGB") for c in "ABC"]
    S = 0.4
    sm = [im.resize((int(im.width * S), int(im.height * S)), Image.LANCZOS) for im in ims]
    W = sum(i.width for i in sm) + 40 * 4
    H = max(i.height for i in sm) + 110
    out = Image.new("RGB", (W, H), (24, 22, 26))
    d = ImageDraw.Draw(out)
    d.text((40, 14), "Miasteczko wokół tawerny - trzy koncepcje (ta sama skala)", font=font(34, True), fill=GOLD)
    x = 40
    titles = {"A": "A - Rynek pod tawerną", "B": "B - Główna ulica", "C": "C - Tarasy na wzgórzu twierdzy"}
    for c, im, full in zip("ABC", sm, ims):
        out.paste(im, (x, 100))
        d.text((x, 64), "%s  (%d x %d pól)" % (titles[c], full.width // T, full.height // T), font=font(24), fill=WHITE)
        x += im.width + 40
    p = os.path.join(DOCS, "porownanie_ABC.png")
    out.save(p, optimize=True)
    return p

def main():
    which = [a for a in sys.argv[1:] if len(a) == 1] or ["A", "B", "C"]
    for c in which:
        for p in render(c): print("wrote", p)
    if all(os.path.exists(os.path.join(DOCS, "koncepcja_%s_czysta.png" % c)) for c in "ABC"):
        print("wrote", compare())

if __name__ == "__main__":
    main()
