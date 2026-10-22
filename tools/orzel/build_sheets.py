# python tools/orzel/build_sheets.py [--preview]
#   -> img/system/Orzel1..5.png       arkusze na ziemi: 8 wierszy (S, SW, W, NW, N, NE, E, SE) x komórki:
#                                     0 stoi, potem chód, atak, machanie (podloty) - co jest dla danego etapu
#   -> img/system/Orzel4_Lot.png, Orzel5_Lot.png   w locie, z góry: 9 klatek w rzędzie (kod je obraca)
#   -> tools/orzel/sheets.json        układ (komórka, linia stóp, kolumny) - przepisany do Orzel_Data.js SHEETS / AIR
#   -> docs/orzel/arkusze_*.png       (--preview) podglądy arkuszy na trawie
# Biały orzeł, etap 2. Surowe klatki z PixelLab (tools/orzel/pobierz.py): tools/orzel/raw2/<etap>/Idle/rotations/<kierunek>.png i
# .../animations/<id>/<kierunek>/<n>.png (nazwy animacji po ich opisie - patrz ANIMS). Zachód, południowy zachód i północny zachód
# to lustra wschodu, południowego wschodu i północnego wschodu (jak u zwierząt w grze). Nic tu nie generuje.
import json, os, sys, glob
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RAW = os.path.join(HERE, "raw2")
OUT = os.path.join(ROOT, "img", "system")
ROWS = ["south", "south-west", "west", "north-west", "north", "north-east", "east", "south-east"]
MIRROR = {"south-west": "south-east", "west": "east", "north-west": "north-east"}

# stage -> the raw folder, the animations to take (key -> words found in the animation's folder of frames, by its order in the zip)
STAGES = {
    1: {"raw": "piskle", "anims": ["walk"]},
    2: {"raw": "mlody", "anims": ["walk", "flap"]},
    # the young's feathers are grey-brown and whiten with age (KONCEPCJA, like a real white-tailed eagle): PixelLab drew him nearly
    # white, so the sheet is tinted (the beak, the feet and the dark outline stay)
    3: {"raw": "podrostek", "anims": ["walk", "atk", "flap"], "tint": 0.72},
    4: {"raw": "prawie25", "anims": ["walk", "atk"]},
    5: {"raw": "dorosly", "anims": ["walk", "atk"],
        # the back views of the attack turn round half way (PixelLab v3): north-east takes the east's strike, north only its first frames
        # there and back (frame numbers of the raw animation, 0 = the rotation)
        "from": {"atk": {"north-east": "east"}}, "pick": {"atk": {"north": [1, 2, 3, 4, 5, 4, 3, 2]}}},
}
AIR = {
    4: [os.path.join(RAW, "lot5_flap_%d.png" % i) for i in range(9)],
    5: [os.path.join(RAW, "lot5b_flap_%d.png" % i) for i in range(9)],
}


def load(p):
    return Image.open(p).convert("RGBA")


def anim_dirs(stage_raw):
    """the animations of a character as PixelLab's zip has them: {anim folder: {direction: [frames]}}"""
    base = os.path.join(RAW, stage_raw, "Idle", "animations")
    out = {}
    if not os.path.isdir(base):
        return out
    for a in sorted(os.listdir(base)):
        d = {}
        for dr in os.listdir(os.path.join(base, a)):
            files = sorted(glob.glob(os.path.join(base, a, dr, "*.png")), key=lambda f: int("".join(c for c in os.path.basename(f) if c.isdigit()) or 0))
            if files:
                d[dr] = [load(f) for f in files]
        out[a] = d
    return out


def anim_by_key(stage):
    """the stage's animations named by sheets.map.json (the zip's folder names are the action's words): {key: {dir: frames}}"""
    m = json.load(open(os.path.join(HERE, "anim_map.json"), encoding="utf-8")) if os.path.exists(os.path.join(HERE, "anim_map.json")) else {}
    raw = STAGES[stage]["raw"]
    found = anim_dirs(raw)
    out = {}
    for key in STAGES[stage]["anims"]:
        want = (m.get(raw) or {}).get(key)
        hit = None
        for folder, dirs in found.items():
            if (want and want.lower() in folder.lower()) or (not want and key in folder.lower()):
                hit = dirs
                break
        if hit:
            out[key] = hit
    return out


def deswoosh(im):
    """the strike's white smears (PixelLab draws a claw's arc in the air): every opaque part not joined to the bird itself is taken out
    when it is small or mostly pale - the bird is the biggest part"""
    w, h = im.size
    px = im.load()
    seen = [[False] * w for _ in range(h)]
    parts = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or px[x, y][3] < 40:
                continue
            stack, part = [(x, y)], []
            seen[y][x] = True
            while stack:
                cx, cy = stack.pop()
                part.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and px[nx, ny][3] >= 40:
                            seen[ny][nx] = True
                            stack.append((nx, ny))
            parts.append(part)
    if len(parts) <= 1:
        return im
    parts.sort(key=len, reverse=True)
    out = im.copy()
    op = out.load()
    for part in parts[1:]:
        pale = sum(1 for (x, y) in part if min(px[x, y][:3]) > 170) / len(part)
        if len(part) < 400 or pale > 0.5:
            for (x, y) in part:
                op[x, y] = (0, 0, 0, 0)
    return out


BROWN = [(46, 36, 30), (88, 70, 54), (128, 104, 80), (166, 142, 112), (204, 186, 158)]


def tint(im, k):
    """grey-brown juvenile feathers: every feather pixel (not the yellow beak/feet, not the near-black outline) goes towards a
    brown ramp of the same lightness by k; the lightest down keeps a little of its white"""
    if not k:
        return im
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            if mx - mn > 48 and r >= b + 40:      # yellow/orange beak and feet
                continue
            L = (r * 30 + g * 59 + b * 11) / 100.0
            if L < 40:                              # the outline
                continue
            t = min(1.0, max(0.0, (L - 40) / 215.0)) * (len(BROWN) - 1)
            i = min(len(BROWN) - 2, int(t))
            f = t - i
            c = [BROWN[i][j] + (BROWN[i + 1][j] - BROWN[i][j]) * f for j in range(3)]
            kk = k * (0.8 if L > 235 else 1.0)
            px[x, y] = (int(r + (c[0] - r) * kk), int(g + (c[1] - g) * kk), int(b + (c[2] - b) * kk), a)
    return out


def feet_row(im):
    bb = im.getbbox()
    return bb[3] - 1 if bb else im.height - 1


def build_stage(stage):
    cfg = STAGES[stage]
    rot = {d: load(os.path.join(RAW, cfg["raw"], "Idle", "rotations", d + ".png")) for d in ROWS}
    anims = anim_by_key(stage)
    canvas = max([im.width for im in rot.values()] + [f.width for a in anims.values() for fr in a.values() for f in fr])
    char = rot["south"].width
    cell = int((canvas + 7) // 8 * 8)
    off_char = (cell - char) // 2
    feet = off_char + max(feet_row(rot[d]) for d in ROWS) + 1
    cols = [("stand", 1)]
    for key in cfg["anims"]:
        n = 0
        a = anims.get(key) or {}
        for d in ("south", "east", "north", "south-east", "north-east"):
            if d in a:
                n = max(n, len(a[d]) - 1)   # (frame 0 is the reference: the rotation itself)
        if n:
            cols.append((key, n))
    width = sum(n for _, n in cols)
    sheet = Image.new("RGBA", (cell * width, cell * len(ROWS)), (0, 0, 0, 0))
    layout = {"file": "Orzel%d" % stage, "cell": cell, "feet": feet}
    c0 = 0
    for key, n in cols:
        layout[key] = [c0, n]
        for r, d in enumerate(ROWS):
            src_dir = MIRROR.get(d, d)
            if key == "stand":
                frames = [rot[src_dir]]
            else:
                a = anims.get(key) or {}
                use = ((cfg.get("from") or {}).get(key) or {}).get(src_dir, src_dir)
                raw = a.get(use) or a.get("south") or [rot[src_dir]] * (n + 1)
                pick = ((cfg.get("pick") or {}).get(key) or {}).get(src_dir)
                frames = [raw[min(i, len(raw) - 1)] for i in pick] if pick else raw[1:n + 1]
                if key == "atk":
                    frames = [deswoosh(f) for f in frames]
                while len(frames) < n:
                    frames.append(frames[-1])
            for i, fr in enumerate(frames):
                fr = tint(fr, cfg.get("tint"))
                if d in MIRROR:
                    fr = fr.transpose(Image.FLIP_LEFT_RIGHT)
                ox = (c0 + i) * cell + (cell - fr.width) // 2
                oy = r * cell + (cell - fr.height) // 2
                sheet.alpha_composite(fr, (ox, oy))
        c0 += n
    sheet.save(os.path.join(OUT, "Orzel%d.png" % stage))
    print("Orzel%d.png" % stage, sheet.size, layout)
    return layout, sheet


def build_air(stage):
    files = AIR[stage]
    frames = [load(f) for f in files if os.path.exists(f)]
    if not frames:
        return None, None
    cell = max(f.width for f in frames)
    sheet = Image.new("RGBA", (cell * len(frames), cell), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (i * cell + (cell - f.width) // 2, (cell - f.height) // 2))
    sheet.save(os.path.join(OUT, "Orzel%d_Lot.png" % stage))
    print("Orzel%d_Lot.png" % stage, sheet.size)
    return {"file": "Orzel%d_Lot" % stage, "cell": cell, "frames": len(frames)}, sheet


def preview(name, sheet, cell):
    from PIL import ImageDraw
    bg = Image.new("RGBA", sheet.size, (96, 128, 84, 255))
    d = ImageDraw.Draw(bg)
    for x in range(0, sheet.width, cell):
        d.line((x, 0, x, sheet.height), fill=(70, 96, 62, 255))
    for y in range(0, sheet.height, cell):
        d.line((0, y, sheet.width, y), fill=(70, 96, 62, 255))
    bg.alpha_composite(sheet)
    k = 1 if sheet.width > 2400 else 2
    if k > 1:
        bg = bg.resize((bg.width * k, bg.height * k), Image.NEAREST)
    dst = os.path.join(ROOT, "docs", "orzel", "arkusze_%s.png" % name)
    bg.convert("RGB").save(dst)
    print("  podgląd", dst)


# (2026-10-18, the nests) the poses seen from the front - img/system/Orzel<n>_Poza.png, one row: sitting down (held at its last frame),
# asleep, lying hurt, preening; each pose a list of (the raw animation, its frame) - PixelLab's tries kept only where they work (the chick's
# "hurt" is its fall onto its side from "sleep", the young one's the end of its "sit"); base: what the animation's frame 0 is - the
# rotation ("rot") or a frame of another animation (the ones started from the sitting pose) - its frames are put where that one is
POSES = {
    1: {"sit": ("sit", range(1, 7), "rot"), "sleep": ("sleep2", range(1, 5), ("sit", 6)), "hurt": ("sleep", range(1, 7), "rot"),
        "preen": ("preen", range(1, 7), "rot"), "preenFrom": "stand"},
    2: {"sit": ("sit", range(1, 5), "rot"), "sleep": ("sleep2", [1, 2], ("sit", 4)), "hurt": ("sit", range(3, 7), "rot"),
        "preen": ("preen", range(1, 7), "rot"), "preenFrom": "stand"},
    3: {"sit": ("sit", range(1, 5), "rot"), "sleep": ("sleep2", range(1, 5), ("sit", 4)), "hurt": ("hurt", range(1, 5), ("sit", 4)),
        "preen": ("preen", range(1, 5), ("sit", 4)), "preenFrom": "sit"},
    # (the big ones' "sleep2" kept the eyes open: "sen" is the sitting frame and the same with the head from a PixelLab edit, eyes shut -
    # raw3/glowy; the adult's "hurt" stayed on its feet: "lezy" is the sitting frame and an edit of it lying - raw3/lezy_dorosly.png)
    4: {"sit": ("sit", range(1, 5), "rot"), "sleep": ("sen", [1, 2], "rot"), "hurt": ("hurt", range(1, 5), ("sit", 4)),
        "preen": ("preen", range(1, 5), ("sit", 4)), "preenFrom": "sit"},
    # (the user: "największy orzeł niech jakoś inaczej w gnieździe siedzi lub leży" - the adult lies in its nest like a brooding bird:
    # "wysiad" = it crouches (sit 1-2) and lies down belly to the ground (a PixelLab edit, raw3/poza5); asleep and hurt from that; it
    # does not preen lying - preenFrom "none")
    5: {"sit": ("wysiad", [1, 2, 3], "rot"), "sleep": ("wysiad_sen", [1, 2], "rot"), "hurt": ("wysiad_ranny", [1, 2], "rot"),
        "preen": ("preen", range(1, 5), ("sit", 4)), "preenFrom": "none"},
}


def raw_frames(stage_raw, anim):
    d = os.path.join(RAW, stage_raw, "Idle", "animations", anim, "south")
    files = sorted(glob.glob(os.path.join(d, "*.png")), key=lambda f: int("".join(c for c in os.path.basename(f) if c.isdigit()) or 0))
    return [load(f) for f in files]


def build_pose(stage, cell, feet):
    """the front poses' row: every frame put so that its animation's frame 0 lies exactly on what it started from (the standing
    rotation, centred in the cell like the ground sheet's, or the sitting frame it was made from)"""
    cfg, raw = POSES[stage], STAGES[stage]["raw"]
    rot = load(os.path.join(RAW, raw, "Idle", "rotations", "south.png"))
    placed = {"rot": ((cell - rot.width) // 2, (cell - rot.height) // 2, rot)}
    def where(base):
        if base == "rot":
            return placed["rot"]
        anim, k = base
        fr = raw_frames(raw, anim)
        ox, oy = offset(anim, "rot")   # (the sit animations start from the rotation)
        return (ox, oy, fr[k])
    def offset(anim, base):
        f0 = raw_frames(raw, anim)[0]
        bx, by, bim = where(base)
        b0, bb = f0.getbbox(), bim.getbbox()
        return (bx + bb[0] - b0[0], by + bb[1] - b0[1])
    cols, layout = [], {"file": "Orzel%d_Poza" % stage, "cell": cell, "feet": feet, "preenFrom": cfg["preenFrom"]}
    for key in ("sit", "sleep", "hurt", "preen"):
        anim, idx, base = cfg[key]
        frames = raw_frames(raw, anim)
        ox, oy = offset(anim, base)
        layout[key] = [len(cols), len(list(idx))]
        for i in idx:
            cols.append((frames[min(i, len(frames) - 1)], ox, oy))
    sheet = Image.new("RGBA", (cell * len(cols), cell), (0, 0, 0, 0))
    for c, (fr, ox, oy) in enumerate(cols):
        fr = tint(fr, STAGES[stage].get("tint"))
        # (a frame reaching out of the cell - a wing stretched - is cut at its edges)
        layer = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
        layer.alpha_composite(fr.crop((max(0, -ox), max(0, -oy), fr.width, fr.height)), (max(0, ox), max(0, oy)))
        sheet.alpha_composite(layer, (c * cell, 0))
    sheet.save(os.path.join(OUT, "Orzel%d_Poza.png" % stage))
    print("Orzel%d_Poza.png" % stage, sheet.size, layout)
    return layout, sheet


def main():
    out = {"sheets": {}, "air": {}}
    for st in STAGES:
        try:
            lay, sheet = build_stage(st)
            out["sheets"][st] = lay
            if "--preview" in sys.argv:
                preview("Orzel%d" % st, sheet, lay["cell"])
            if st in POSES:
                pl, ps = build_pose(st, lay["cell"], lay["feet"])
                lay["pose"] = pl
                if "--preview" in sys.argv:
                    preview("Orzel%d_Poza" % st, ps, lay["cell"])
        except FileNotFoundError as e:
            print("Orzel%d: brak surowych klatek (%s)" % (st, e))
    for st in AIR:
        lay, sheet = build_air(st)
        if lay:
            out["air"][st] = lay
            if "--preview" in sys.argv:
                preview("Orzel%d_Lot" % st, sheet, lay["cell"])
    with open(os.path.join(HERE, "sheets.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1)
    print("-> tools/orzel/sheets.json")


if __name__ == "__main__":
    main()
