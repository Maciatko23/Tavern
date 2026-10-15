# The before / after pictures of the interiors' polish (tools/wnetrza/build.py --compare): from the game's own shots
# (docs/wnetrza_poprawa/surowe/Map<id>_<przed|po>_<dzien|noc>.png + shots_<suffix>.json, the room's box on the 1280x720 screen)
# -> docs/wnetrza_poprawa/<id>_<name>.png (PRZED | PO, day above, night below) and zestawienie.png (every room, day, before | after).
import os, json
from PIL import Image, ImageDraw, ImageFont

NAMES = {100: "Chatka", 102: "Piekarnia", 103: "Kantor", 104: "Ratusz", 105: "Dom kowala", 106: "Dom garbarza",
         107: "Dom woziwody", 108: "Dzwonnica", 109: "Dom mieszczan", 110: "Izba pod skałą", 112: "Chata praczki",
         113: "Chata drwala", 114: "Chata kłusownika", 115: "Izba znachorki", 116: "Kram starzyzny", 117: "Dom uchodźców",
         121: "Wspólna izba", 122: "Chata tkaczki", 123: "Chata Najstarszego", 124: "Chata rzeźbiarza"}
FILE = {k: v.lower().replace(" ", "_").replace("ą", "a").replace("ę", "e").replace("ł", "l").replace("ó", "o").replace("ś", "s")
        .replace("ź", "z").replace("ż", "z").replace("ć", "c").replace("ń", "n") for k, v in NAMES.items()}


def font(size):
    for p in ("C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"):
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def crop(raw, mid, suffix, when, boxes):
    p = os.path.join(raw, "Map%d_%s_%s.png" % (mid, suffix, when))
    if not os.path.exists(p): return None
    x, y, w, h = boxes[suffix][str(mid)]
    im = Image.open(p).convert("RGB")
    return im.crop((max(0, x), max(0, y), min(im.width, x + w), min(im.height, y + h)))


def run(ids, docs):
    raw = os.path.join(docs, "surowe")
    boxes = {s: json.load(open(os.path.join(raw, "shots_%s.json" % s), encoding="utf-8")) for s in ("przed", "po")
             if os.path.exists(os.path.join(raw, "shots_%s.json" % s))}
    F, f2 = font(26), font(18)
    tiles = []
    for mid in ids:
        if str(mid) not in boxes.get("przed", {}) or str(mid) not in boxes.get("po", {}): continue
        a, b = crop(raw, mid, "przed", "dzien", boxes), crop(raw, mid, "po", "dzien", boxes)
        an, bn = crop(raw, mid, "przed", "noc", boxes), crop(raw, mid, "po", "noc", boxes)
        if not (a and b): continue
        W, H = max(a.width, b.width), max(a.height, b.height)
        pad, top = 16, 44
        S = Image.new("RGB", (W * 2 + pad * 3, top + (H + pad) * 2 + 8), (24, 22, 30))
        d = ImageDraw.Draw(S)
        d.text((pad, 8), "Map%d %s - PRZED" % (mid, NAMES.get(mid, "")), font=F, fill=(240, 200, 90))
        d.text((W + pad * 2, 8), "PO", font=F, fill=(140, 230, 140))
        S.paste(a, (pad, top)); S.paste(b, (W + pad * 2, top))
        if an and bn:
            S.paste(an, (pad, top + H + pad)); S.paste(bn, (W + pad * 2, top + H + pad))
            d.text((pad + 6, top + H + pad + 4), "noc 22:00", font=f2, fill=(220, 220, 255))
            d.text((W + pad * 2 + 6, top + H + pad + 4), "noc 22:00", font=f2, fill=(220, 220, 255))
        out = os.path.join(docs, "%d_%s.png" % (mid, FILE.get(mid, "mapa")))
        S.save(out)
        tiles.append((mid, a, b))
    if not tiles: return
    # zestawienie: every room, by day, before | after, scaled to one height
    th = 300
    rows = []
    for mid, a, b in tiles:
        sa = a.resize((int(a.width * th / a.height), th)); sb = b.resize((int(b.width * th / b.height), th))
        rows.append((mid, sa, sb))
    cw = max(sa.width + sb.width for _, sa, sb in rows) + 36
    cols = 2
    rh = th + 40
    S = Image.new("RGB", (cw * cols, rh * ((len(rows) + cols - 1) // cols) + 60), (24, 22, 30))
    d = ImageDraw.Draw(S)
    d.text((16, 14), "Wnętrza domków - przed (lewa) i po (prawa) poprawie, w grze w południe", font=F, fill=(240, 220, 160))
    for k, (mid, sa, sb) in enumerate(rows):
        x, y = (k % cols) * cw + 12, 60 + (k // cols) * rh
        d.text((x, y), "Map%d %s" % (mid, NAMES.get(mid, "")), font=f2, fill=(240, 200, 90))
        S.paste(sa, (x, y + 28)); S.paste(sb, (x + sa.width + 12, y + 28))
    S.save(os.path.join(docs, "zestawienie.png"))
    print("porównania ->", docs)
