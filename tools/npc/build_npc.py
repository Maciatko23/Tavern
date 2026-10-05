# Builds the game sheets of one NPC from a PixelLab character (pro, 64x64, 8 directions, low top-down, made in the hero's
# style) and its "walking-8-frames" animation - the same template the hero's Hero_Walk.png was made from.
#
#   python tools/npc/build_npc.py --key Dziadek --id <pixellab character id> [options]
#
# Writes
#   img/characters/$Npc_<Key>.png       RPG Maker MZ single-character sheet: 3 x 4 cells of 64x64 (192x256).
#                                       Rows down, left, right, up; columns walk step A, STANDING, walk step B (MZ plays 0,1,2,1).
#   img/characters/Npc_<Key>_Walk8.png  the Hero_Walk.png layout: 8 rows (S, SW, W, NW, N, NE, E, SE) x 9 cells of 64x64,
#                                       column 0 = standing rotation, then the 8 walk frames.
#   docs/postacie/<key>_arkusz.png      both sheets x3 on mid-grey
#   docs/postacie/<key>_z_bohaterem.png the NPC standing beside the hero's standing frame, 4 directions, x3
#   tools/npc/npcs.json                 the entry of this NPC (added or replaced)
#   (--gif PATH: also the walk in all 8 directions, x3, at the hero's pace, as a GIF)
#
# Feet: every direction row is moved up/down as a whole (the walk keeps its own bob) so that the NPC's standing rotation
# stands on the same pixel row as the hero's standing frame of that direction in Hero_Walk.png (S 61, SW 62, W 62, NW 61,
# N 60, NE 61, E 62, SE 62 - measured, not assumed). No resizing: PixelLab's 64 canvas is the hero's scale (only children
# are made smaller, with --scale).
#
# Options
#   --zip PATH            use a downloaded PixelLab zip instead of downloading https://api.pixellab.ai/mcp/characters/<id>/download
#   --state NAME          state folder inside the zip (default: the first / only one)
#   --anim NAME           animation folder name (default: the one whose name contains "walk" and has 8 dirs x 8 frames)
#   --from DIR=ANIM       take direction DIR's walk from another animation of the zip (a re-rolled direction in its own group)
#   --mirror DIR=SRC      DIR (rotation + walk) = horizontal flip of SRC, e.g. --mirror west=east  (repeatable)
#   --mirror-walk DIR=SRC only the walk of DIR is the flip of SRC's walk (keeps DIR's own rotation)
#   --flip-frames DIR=F:G,F:G  single walk frames of DIR replaced by the horizontal flip of frame G of the same walk (a flip
#                         swaps the legs = the opposite phase, so F = G+4 fits a symmetric back/front view), e.g. a bad
#                         north walk frame 5-7: --flip-frames north=5:1,6:2,7:3   (repeatable)
#   --steps A,B           walk frames (0-7) used as the two steps of the $ sheet (default: auto, the widest opposite strides)
#   --name / --desc / --group / --gens   stored in npcs.json (Polish name, description used, animation group id, gens used)
#   --dx N                move every cell N px sideways (default 0; PixelLab centres the figure like the hero's)
#   --scale F             make the figure smaller (a CHILD: PixelLab pro draws every figure on the 64 canvas at the hero's ~60 px
#                         height, children too), e.g. --scale 0.75 (9 years), 0.7 (7), 0.62 (5). Not a resample: whole rows and
#                         columns are taken out (content-aware: those most like their neighbour, spread evenly - the count taken
#                         stays within 2 of the even share at every row - and never two neighbours while anything else fits), so
#                         the 1 px outline, a thin belt or an eye line and the fine pixels stay crisp. The same rows/columns go for
#                         the rotation and all 8 walk frames of a direction (walk frames are first lined up on the standing figure
#                         by their bob), so the details do not flicker. Feet keep their row, column 32 keeps its place; the usual
#                         feet shift to the hero's rows follows. Done after --mirror.
#   --head F              with --scale: the factor for the top third (the head) - a child's head is relatively big, e.g.
#                         --scale 0.75 --head 0.88. Default: the head shrinks like the rest.
#
# Fixing a bad walk direction (seen 2026-10-04 on 12 characters: a south walk turning its back in 2 frames, a shirt or a cloak
# vanishing, a braid flickering): delete just that direction from the group (delete_animation with animation_group_id +
# direction) and queue it again into the same group - 1 generation. If the template keeps losing a detail (braids, towel),
# animate that direction with mode "skeleton-v3" (same template, 2-4 gens): it moves the rotation's own pixels, so the look
# stays; its frames come on a 96 canvas, which to_cell crops around the centre. Check every sheet: tools/npc/lineup.py.
import argparse, io, json, os, sys, tempfile, time, urllib.error, urllib.request, zipfile
from PIL import Image, ImageDraw

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
CHARS = os.path.join(GAME, "img", "characters")
DOCS = os.path.join(GAME, "docs", "postacie")
NPCS_JSON = os.path.join(GAME, "tools", "npc", "npcs.json")
HERO_WALK = os.path.join(CHARS, "Hero_Walk.png")
DIRS = ["south", "south-west", "west", "north-west", "north", "north-east", "east", "south-east"]   # Hero_Walk row order
MZ_ROWS = ["south", "west", "east", "north"]                                                       # $ sheet: down, left, right, up
C = 64
HERO_PIXELLAB_ID = "bf29bbe1-35e0-4a01-b0e8-f8b502b9f196"   # the hero: every NPC is made with style_character_id = this


def log(*a):
    print(*a)
    sys.stdout.flush()


REMOVED = []   # (where, pixels) of every speck clean() took away - printed, so a detached hand or foot would be noticed


def clean(im, keep=6, where=""):
    """Alpha to 0/255 and stray specks (8-connected clusters of up to `keep` px apart from the figure) removed."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and a < 128:
                px[x, y] = (0, 0, 0, 0)
            elif a and a < 255:
                px[x, y] = (r, g, b, 255)
    seen, comps = set(), []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 or (x, y) in seen:
                continue
            stack, comp = [(x, y)], []
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3] > 0:
                            seen.add((nx, ny))
                            stack.append((nx, ny))
            comps.append(comp)
    if len(comps) > 1:
        big = max(len(c) for c in comps)
        for c in comps:
            if len(c) <= keep and len(c) < big:
                REMOVED.append((where, len(c), min(c)))
                for (x, y) in c:
                    px[x, y] = (0, 0, 0, 0)
    return im


def bottom(im):
    """Last opaque row (the feet), or None."""
    bb = im.getchannel("A").getbbox()
    return None if bb is None else bb[3] - 1


def to_cell(im):
    """Any PixelLab canvas -> a 64x64 cell. Bigger canvases are cropped around the centre keeping the bottom (feet) margin;
    when that would cut the figure's head off, around the canvas centre (skeleton-v3 walks come on a 96 canvas with the
    figure in the middle - the same crop for every frame, so the bob stays)."""
    if im.size == (C, C):
        return im
    w, h = im.size
    cell = Image.new("RGBA", (C, C), (0, 0, 0, 0))
    ox = (C - w) // 2
    oy = C - h if h > C else (C - h) // 2
    bb = im.getchannel("A").getbbox()
    if h > C and bb and bb[1] < -oy and bb[1] >= (h - C) // 2 and bb[3] <= (h - C) // 2 + C:
        oy = -((h - C) // 2)
    cell.alpha_composite(im, (max(ox, 0), max(oy, 0)), (max(-ox, 0), max(-oy, 0)))
    return cell


def shift(im, dx, dy):
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.alpha_composite(im, (max(dx, 0), max(dy, 0)), (max(-dx, 0), max(-dy, 0)))
    return out


def hero_baselines():
    hero = Image.open(HERO_WALK).convert("RGBA")
    return {d: bottom(hero.crop((0, r * C, C, (r + 1) * C))) for r, d in enumerate(DIRS)}, hero


def load_zip(args):
    if args.zip:
        return zipfile.ZipFile(args.zip)
    cache = os.path.join(tempfile.gettempdir(), "pixellab_npc")
    os.makedirs(cache, exist_ok=True)
    path = os.path.join(cache, args.id + ".zip")
    url = "https://api.pixellab.ai/mcp/characters/%s/download" % args.id
    log("download", url)
    data = None
    for attempt in range(20):   # (HTTP 423 while an animation of the character is still being generated)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "curl/8.0"})   # (the default Python agent is refused)
            with urllib.request.urlopen(req, timeout=180) as r:
                data = r.read()
            break
        except urllib.error.HTTPError as e:
            if e.code != 423:
                raise
            log("423: jobs still running, waiting 30 s")
            time.sleep(30)
    if data is None:
        raise SystemExit("the character stays locked (jobs running): try again later")
    with open(path, "wb") as f:
        f.write(data)
    log("saved", path, len(data), "bytes")
    return zipfile.ZipFile(path)


def index_zip(z, state_name):
    """-> (rotations {dir: path}, animations {name: {dir: [paths]}}, prompt)"""
    names = z.namelist()
    if "metadata.json" in names:
        meta = json.loads(z.read("metadata.json"))
        states = meta.get("states")
        if states:
            st = states[0]
            if state_name:
                st = [s for s in states if s.get("folder") == state_name or s["character"].get("name") == state_name][0]
            fr = st["frames"]
            return fr["rotations"], fr.get("animations", {}), st["character"].get("prompt", "")
        fr = meta.get("frames")
        if fr:
            return fr["rotations"], fr.get("animations", {}), meta.get("character", {}).get("prompt", "")
    # no usable metadata: scan [<state>/]rotations/<dir>.png and [<state>/]animations/<anim>/<dir>/frame_NNN.png
    rots, anims = {}, {}
    for n in sorted(names):
        p = n.split("/")
        if state_name and p[0] != state_name and "rotations" not in p[:1] and "animations" not in p[:1]:
            continue
        if "rotations" in p and n.endswith(".png"):
            rots[p[-1][:-4]] = n
        elif "animations" in p and n.endswith(".png"):
            i = p.index("animations")
            anims.setdefault(p[i + 1], {}).setdefault(p[i + 2], []).append(n)
    return rots, anims, ""


def pick_anim(anims, want):
    if want:
        return want
    good = [k for k, v in anims.items() if "walk" in k.lower() and len(v) >= 8 and all(len(f) == 8 for f in v.values())]
    if not good:
        good = [k for k, v in anims.items() if all(len(f) == 8 for f in v.values())]
    if not good:
        raise SystemExit("no 8-frame walk animation in the zip: %s" % {k: {d: len(f) for d, f in v.items()} for k, v in anims.items()})
    good.sort(key=lambda k: (-len(anims[k]), k))
    return good[0]


def stride(im):
    """Leg spread: opaque width in the lowest 9 rows of the figure."""
    b = bottom(im)
    if b is None:
        return 0
    bb = im.crop((0, max(b - 8, 0), C, b + 1)).getchannel("A").getbbox()
    return 0 if bb is None else bb[2] - bb[0]


def kv(items):
    out = {}
    for s in items or []:
        a, b = s.split("=")
        out[a.strip()] = b.strip()
    return out


# --- --scale: shrink a figure by taking out whole rows and columns (see the header) ---

def _diff(frames, i, rows):
    """how much row (rows=True) / column i differs from the one before it, summed over the frames (0 = a duplicate)"""
    t = 0
    for im in frames:
        px = im.load()
        for j in range(C):
            a, b = (px[j, i], px[j, i - 1]) if rows else (px[i, j], px[i - 1, j])
            if a[3] != b[3]:
                t += 1000
            elif a[3]:
                t += abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])
    return t


def _pick(lo, hi, n, cost, tol=2):
    """n indices in [lo, hi) with the least summed cost, spread evenly: after every index the number taken so far stays
    within `tol` of the even share (so a thin belt or an eye line can dodge, the shrink stays uniform); two neighbours
    only when nothing else fits (DP over (index, taken, last taken))."""
    L = hi - lo
    if n <= 0 or L <= 0:
        return []
    n = min(n, L)
    c = [cost(lo + j) for j in range(L)]
    INF = float("inf")
    # dp[k][d]: least cost with k taken so far, d = the previous index was taken; back[j][k][d] for the path
    dp = {(0, 0): (0.0, None)}
    hist = []
    for j in range(L):
        ideal = (j + 1) * n / L
        nd = {}
        for (k, d), (v, _) in dp.items():
            for take in (0, 1):
                k2 = k + take
                if k2 > n or abs(k2 - ideal) > tol:
                    continue
                v2 = v + (c[j] + (1e7 if d else 0) if take else 0) + 0.01 * abs(k2 - ideal)
                if v2 < nd.get((k2, take), (INF,))[0]:
                    nd[(k2, take)] = (v2, (k, d))
        hist.append(nd)
        dp = nd
    end = min((key for key in dp if key[0] == n), key=lambda key: dp[key][0])
    out, key = [], end
    for j in range(L - 1, -1, -1):
        v, prev = hist[j][key]
        if key[1]:
            out.append(lo + j)
        key = prev
    return sorted(out)


def _bob(stand, frame):
    """vertical offset (-2..2) of a walk frame against the standing figure, matched on the upper half of the body"""
    x0, y0, x1, y1 = stand.getchannel("A").getbbox()
    sp, fp = stand.load(), frame.load()
    best = None
    for d in (-2, -1, 0, 1, 2):
        t = 0
        for y in range(y0, y0 + (y1 - y0) // 2):
            for x in range(x0, x1):
                if not 0 <= y + d < C:
                    t += 1000
                    continue
                a, b = sp[x, y], fp[x, y + d]
                t += 300 if a[3] != b[3] else (abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) if a[3] else 0)
        if best is None or t < best[0]:
            best = (t, d)
    return best[1]


def _drop(im, rows, cols, dy=0, cx=C // 2):
    """im without rows (+dy, the frame's bob) and cols; what is below a dropped row moves nothing (feet stay), column cx stays"""
    src, out = im.load(), Image.new("RGBA", im.size, (0, 0, 0, 0))
    o = out.load()
    R, K = set(r + dy for r in rows), set(cols)
    ymap, sh = {}, 0
    for y in range(C - 1, -1, -1):
        if y in R:
            sh += 1
        else:
            ymap[y] = y + sh
    xmap, sh = {}, 0
    for x in range(cx, C):
        if x in K:
            sh += 1
        else:
            xmap[x] = x - sh
    sh = 0
    for x in range(cx - 1, -1, -1):
        if x in K:
            sh += 1
        else:
            xmap[x] = x + sh
    for y, Y in ymap.items():
        for x, X in xmap.items():
            p = src[x, y]
            if p[3] and 0 <= X < C and 0 <= Y < C:
                o[X, Y] = p
    return out


def shrink(stand, frames, s, head=None):
    """-> (stand, frames, info): the direction made smaller by the factor s (head: the factor of the top third)"""
    bobs = [_bob(stand, f) for f in frames]
    aligned = [shift(f, 0, -d) for f, d in zip(frames, bobs)]
    allf = [stand] + aligned
    x0, y0, x1, y1 = stand.getchannel("A").getbbox()
    H = y1 - y0
    n = round(H * (1 - s))
    rcost = lambda r: _diff(allf, r, True)
    if head is None:
        rows = _pick(y0 + 1, y1, n, rcost)
    else:
        hh = H // 3
        nh = min(n, round(hh * (1 - head)))
        rows = sorted(_pick(y0 + 1, y0 + hh, nh, rcost) + _pick(y0 + hh, y1, n - nh, rcost))
    boxes = [f.getchannel("A").getbbox() for f in allf]
    X0, X1 = min(b[0] for b in boxes if b), max(b[2] for b in boxes if b)
    cols = _pick(X0 + 1, X1, round((X1 - X0) * (1 - s)), lambda c: _diff(allf, c, False))
    return _drop(stand, rows, cols), [_drop(f, rows, cols, d) for f, d in zip(frames, bobs)], \
        {"rows": rows, "cols": cols, "bobs": bobs}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", required=True)
    ap.add_argument("--id", required=True)
    ap.add_argument("--zip")
    ap.add_argument("--state")
    ap.add_argument("--anim")
    ap.add_argument("--from", dest="from_", action="append")
    ap.add_argument("--mirror", action="append")
    ap.add_argument("--mirror-walk", dest="mirror_walk", action="append")
    ap.add_argument("--flip-frames", dest="flip_frames", action="append")
    ap.add_argument("--steps")
    ap.add_argument("--name", default="")
    ap.add_argument("--desc", default="")
    ap.add_argument("--group", default="")
    ap.add_argument("--gens", default="")   # a number, or JSON such as {"character": 20, "walk": 8}
    ap.add_argument("--dx", type=int, default=0)
    ap.add_argument("--scale", type=float, default=0)
    ap.add_argument("--head", type=float, default=0)
    ap.add_argument("--notes", default="")
    ap.add_argument("--gif", default="")
    args = ap.parse_args()
    key = args.key

    base, hero = hero_baselines()
    log("hero feet rows", base)
    z = load_zip(args)
    rots, anims, prompt = index_zip(z, args.state)
    anim = pick_anim(anims, args.anim)
    log("animation", anim, "| all:", {k: len(v) for k, v in anims.items()})
    src_anim = {d: anim for d in DIRS}
    src_anim.update(kv(args.from_))

    def read(path):
        return to_cell(clean(Image.open(io.BytesIO(z.read(path))).convert("RGBA"), where=path))

    rot = {d: read(rots[d]) for d in DIRS}
    walk = {}
    for d in DIRS:
        fl = anims[src_anim[d]].get(d)
        if not fl or len(fl) != 8:
            raise SystemExit("walk %s/%s: %s frames" % (src_anim[d], d, len(fl or [])))
        walk[d] = [read(p) for p in sorted(fl)]
    for where, n, at in REMOVED:
        log("speck removed: %s  %d px at %s" % (where, n, at))

    flip = lambda im: im.transpose(Image.FLIP_LEFT_RIGHT)
    for d, s in kv(args.mirror).items():
        rot[d] = flip(rot[s])
        walk[d] = [flip(f) for f in walk[s]]
        log("mirror", d, "<-", s)
    for d, s in kv(args.mirror_walk).items():
        walk[d] = [flip(f) for f in walk[s]]
        log("mirror walk", d, "<-", s)
    for d, spec in kv(args.flip_frames).items():
        src_frames = list(walk[d])
        for pair in spec.split(","):
            f, g = [int(x) for x in pair.split(":")]
            walk[d][f] = flip(src_frames[g])
        log("flip frames", d, spec)
    if args.scale and args.scale < 1:
        for d in DIRS:
            h0 = bottom(rot[d]) - rot[d].getchannel("A").getbbox()[1] + 1
            rot[d], walk[d], info = shrink(rot[d], walk[d], args.scale, args.head or None)
            h1 = bottom(rot[d]) - rot[d].getchannel("A").getbbox()[1] + 1
            log("scale %-10s height %d -> %d, %d rows + %d cols out, bobs %s" % (d, h0, h1, len(info["rows"]), len(info["cols"]), info["bobs"]))

    # feet: move each direction row as a whole so the standing figure stands on the hero's row for that direction
    report = {}
    for d in DIRS:
        dy = base[d] - bottom(rot[d])
        opaque = lambda im: sum(1 for a in im.getchannel("A").getdata() if a)
        before = [opaque(f) for f in walk[d]]
        rot[d] = shift(rot[d], args.dx, dy)
        walk[d] = [shift(f, args.dx, dy) for f in walk[d]]
        lost = [i for i, f in enumerate(walk[d]) if opaque(f) != before[i]]
        report[d] = {"dy": dy, "stand_bottom": bottom(rot[d]),
                     "walk_bottoms": [bottom(f) for f in walk[d]],
                     "height": bottom(rot[d]) - rot[d].getchannel("A").getbbox()[1] + 1}
        if lost:
            log("WARNING %s: frames %s lost pixels over the cell edge after the shift" % (d, lost))
    for d in DIRS:
        log("%-10s dy %+d  stand feet %d  height %d  walk feet %s" % (d, report[d]["dy"], report[d]["stand_bottom"],
                                                                       report[d]["height"], report[d]["walk_bottoms"]))

    # the two steps of the $ sheet: the pair of opposite frames (f, f+4) with the widest strides in the side views
    if args.steps:
        sa, sb = [int(x) for x in args.steps.split(",")]
    else:
        score = [stride(walk["east"][f]) + stride(walk["west"][f]) + stride(walk["east"][(f + 4) % 8]) + stride(walk["west"][(f + 4) % 8])
                 for f in range(4)]
        sa = max(range(4), key=lambda f: score[f])
        sb = sa + 4
        log("stride scores", score)
    log("steps A=%d B=%d" % (sa, sb))

    # Npc_<Key>_Walk8.png
    w8 = Image.new("RGBA", (C * 9, C * 8), (0, 0, 0, 0))
    for r, d in enumerate(DIRS):
        w8.alpha_composite(rot[d], (0, r * C))
        for f in range(8):
            w8.alpha_composite(walk[d][f], ((f + 1) * C, r * C))
    p8 = os.path.join(CHARS, "Npc_%s_Walk8.png" % key)
    w8.save(p8)
    # $Npc_<Key>.png
    mz = Image.new("RGBA", (C * 3, C * 4), (0, 0, 0, 0))
    for r, d in enumerate(MZ_ROWS):
        mz.alpha_composite(walk[d][sa], (0, r * C))
        mz.alpha_composite(rot[d], (C, r * C))
        mz.alpha_composite(walk[d][sb], (2 * C, r * C))
    pmz = os.path.join(CHARS, "$Npc_%s.png" % key)
    mz.save(pmz)
    log("saved", pmz, mz.size, "|", p8, w8.size)

    # previews
    os.makedirs(DOCS, exist_ok=True)
    S, GREY, GAP = 3, (128, 128, 128, 255), 24
    prev = Image.new("RGBA", (w8.width * S + GAP * 3 + mz.width * S, w8.height * S + GAP * 2), GREY)
    prev.alpha_composite(w8.resize((w8.width * S, w8.height * S), Image.NEAREST), (GAP, GAP))
    prev.alpha_composite(mz.resize((mz.width * S, mz.height * S), Image.NEAREST), (GAP * 2 + w8.width * S, GAP))
    prev.convert("RGB").save(os.path.join(DOCS, "%s_arkusz.png" % key.lower()))
    herorow = {d: r for r, d in enumerate(DIRS)}
    pair = Image.new("RGBA", (C * 8 * S + GAP * 5, C * S + GAP * 2), GREY)
    for i, d in enumerate(MZ_ROWS):
        h = hero.crop((0, herorow[d] * C, C, (herorow[d] + 1) * C))
        x = GAP + i * (C * 2 * S + GAP)
        pair.alpha_composite(h.resize((C * S, C * S), Image.NEAREST), (x, GAP))
        pair.alpha_composite(rot[d].resize((C * S, C * S), Image.NEAREST), (x + C * S - 8 * S, GAP))
    d = ImageDraw.Draw(pair)
    for i in range(4):   # the hero's feet row of each direction, as a thin ground line under both figures
        x = GAP + i * (C * 2 * S + GAP)
        y = GAP + (base[MZ_ROWS[i]] + 1) * S
        d.line([(x, y), (x + C * 2 * S - 8 * S, y)], fill=(96, 96, 96, 255), width=1)
    pair.convert("RGB").save(os.path.join(DOCS, "%s_z_bohaterem.png" % key.lower()))
    if args.gif:
        frames = []
        for f in range(8):
            fr = Image.new("RGBA", (C * S * 8, C * S), (74, 128, 62, 255))
            for r, dd in enumerate(DIRS):
                fr.alpha_composite(walk[dd][f].resize((C * S, C * S), Image.NEAREST), (r * C * S, 0))
            frames.append(fr.convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=255))
        frames[0].save(args.gif, save_all=True, append_images=frames[1:], duration=66, loop=0, disposal=2)
        log("gif", args.gif)
    log("previews in", DOCS)

    # npcs.json
    data = []
    if os.path.exists(NPCS_JSON):
        with open(NPCS_JSON, "rb") as f:
            data = json.loads(f.read().decode("utf-8"))
    old = next((e for e in data if e.get("key") == key), {})
    entry = {
        "key": key,
        "name": args.name or old.get("name", ""),
        "pixellab_id": args.id,
        "style_character_id": HERO_PIXELLAB_ID,
        "mode": "pro, 64x64, 8 directions, low top-down",
        "animation_group_id": args.group or old.get("animation_group_id", ""),
        "animation": anim,
        "description": args.desc or old.get("description", "") or prompt,
        "gens_used": json.loads(args.gens) if args.gens else old.get("gens_used", 0),
        "sheet": "$Npc_%s" % key,
        "walk8": "Npc_%s_Walk8" % key,
        "steps": [sa, sb],
        "fixes": {"from": kv(args.from_), "mirror": kv(args.mirror), "mirror_walk": kv(args.mirror_walk),
                  "flip_frames": kv(args.flip_frames)},
        "feet_dy": {d: report[d]["dy"] for d in DIRS},
        "scale": ({"body": args.scale, "head": args.head or args.scale} if args.scale and args.scale < 1 else None),
        "height_px": report["south"]["height"],
        "notes": args.notes or old.get("notes", ""),
    }
    data = [e for e in data if e.get("key") != key] + [entry]
    with open(NPCS_JSON, "wb") as f:   # (binary: LF endings on Windows too)
        f.write((json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    log("npcs.json:", key, "(%d characters)" % len(data))


if __name__ == "__main__":
    main()
