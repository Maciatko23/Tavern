# -*- coding: utf-8 -*-
"""Builds the horses' RMMZ sheets (wide: N frames x 4 rows = down, left, right, up) from PixelLab downloads (the zip of get_character:
Idle/animations/<name>/<direction>/frame_NNN.png). Crisp: no resizing, no blur - the frames are cropped as they are, west = east mirrored,
then the town's look (tools/styl/styl_b.py grade() B2) and nothing else.
  img/characters/$Kon_<Name>.png         walk: 8 frames, rows down / left / right / up      (animation "walk", east / south / north)
  img/characters/$Kon_<Name>_Pasie.png   grazing: 9 frames = the v3 clip "graze" (the head goes down to the ground), rows left / right only (east
                                         mirrored); Konie.js plays it down, a bobbing nibble on its last frames, and back up
  img/characters/$Kon_<Name>_Pije.png    the same aligned frames with one fixed shift so the muzzle of a horse standing east of the trough reaches the water
  Every frame of every clip is put on one body anchor per view (the hoof row and the rump column of the walk's first frame): only legs / head / tail move.
  python tools/konie/build_konie.py <Name> <downloaded folder> [kasztan | srokaty]   (a recolour of the bay's / the grey's frames: no PixelLab spend)"""
import os, sys, glob
import numpy as np
from PIL import Image, ImageOps
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "styl"))
import styl_b
MUZZLE_X = 7        # px from the cell's left edge (a west-facing horse): over the trough's water when it stands on the cell east of the trough


def frames(folder, anim, d):
    fs = sorted(glob.glob(os.path.join(folder, "Idle", "animations", anim, d, "frame_*.png")))
    return [Image.open(f).convert("RGBA") for f in fs]


def anchor(f, side):
    """where the BODY of a frame stands: (x, hoof row). x = the rump (the left edge of the solid torso) for side views, the middle of the torso
    for end-on views; the hoof row = the lowest opaque row. The torso is read in a band above the hooves (the legs move, the tail and the head
    swing; the barrel does not)."""
    a = np.asarray(f)[..., 3] > 128
    ys, xs = np.nonzero(a)
    bot = int(ys.max())
    band = a[bot - 36: bot - 23, :]
    cnt = band.sum(0)
    dense = cnt >= band.shape[0] * 0.9
    runs, start = [], None
    for x, v in enumerate(list(dense) + [False]):         # the longest solid run of columns = the barrel
        if v and start is None: start = x
        if not v and start is not None: runs.append((x - start, start, x - 1)); start = None
    if not runs: return int(xs.min()), bot
    _, l, r = max(runs)
    return (l if side else int(round((l + r) / 2.0))), bot


def put(f, dx, dy):
    c = Image.new("RGBA", f.size, (0, 0, 0, 0)); c.paste(f, (dx, dy)); return c


def aligned(fs, side, ref):
    out = []
    for f in fs:
        x, b = anchor(f, side)
        out.append(put(f, ref[0] - x, ref[1] - b))
    return out


def edge_of(a):
    pad = np.pad(a, 1)
    return a & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])


def lum_of(rgb):
    return rgb @ np.array([0.3, 0.59, 0.11], np.float32)


def mixc(c0, c1, t):
    t = np.clip(t, 0, 1)[..., None]
    return np.asarray(c0, np.float32) * (1 - t) + np.asarray(c1, np.float32) * t


def recolor(f, view, ref, mode):
    """a new coat from a finished horse's frames: a per-pixel colour mapping by the pixel's own tone (so the shading and every frame agree) plus FIXED masks
    in the aligned frame (the body does not move between frames; the legs, head and tail do). From the bay: 'kasztan' (a deep chestnut with a flaxen mane and
    tail); from the grey: 'srokaty' (a white horse with brown patches)."""
    a = np.asarray(f).astype(np.float32).copy()
    op = a[..., 3] > 128
    edge = edge_of(op)
    L = lum_of(a[..., :3])
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    bx, by = ref
    out = a[..., :3].copy()
    if mode == "kasztan":
        body = op & (L >= 62) & ~edge
        out[body] = np.clip(a[..., :3][body] * np.array([0.98, 0.66, 0.56], np.float32) + np.array([-4, 0, 2], np.float32), 0, 255)
        mid = op & (L >= 30) & (L < 62)
        if view == "east": maney = (yy < by - 16) & ((xx < bx + 2) | (yy < by - 34))
        else: maney = (yy < by - 40) | ((view == "north") & (abs(xx - bx) <= 9) & (yy < by - 12))
        mane = mid & maney & ~edge
        out[mane] = mixc((150, 108, 62), (216, 180, 120), (L[mane] - 30) / 32.0)
        leg = mid & ~maney
        out[leg] = np.clip(a[..., :3][leg] * np.array([1.0, 0.82, 0.72], np.float32), 0, 255)
        line = op & ((L < 30) | (edge & (L < 62)))
        out[line] = np.array([54, 28, 18], np.float32)
    elif mode == "srokaty":
        body = op & (L >= 70) & ~edge
        # white: the grey's tones lifted towards a warm white, the shading kept
        t = np.clip((L - 70) / 120.0, 0, 1)
        white = mixc((150, 144, 146), (238, 234, 228), t)
        out[body] = white[body]
        # the brown patches: fixed ellipses on the barrel / neck / rump of the aligned body (side) or on the head / rump (end-on)
        if view == "east": blobs = [(bx + 26, by - 36, 15, 11), (bx + 60, by - 38, 12, 9), (bx + 78, by - 56, 9, 12), (bx + 6, by - 50, 8, 9)]
        elif view == "south": blobs = [(bx - 7, by - 62, 7, 14), (bx + 6, by - 36, 7, 10)]
        else: blobs = [(bx + 6, by - 44, 11, 13), (bx - 8, by - 62, 6, 8)]
        m = np.zeros(op.shape, bool)
        for (cx, cy, rx, ry) in blobs: m |= (((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2) <= 1.0
        pm = body & m
        brown = mixc((96, 58, 34), (178, 122, 80), np.clip((L - 70) / 120.0, 0, 1))
        out[pm] = brown[pm]
        line = op & ((L < 70) | edge)
        out[line & ~body] = np.where((L[line & ~body] < 38)[..., None], np.array([44, 34, 30], np.float32), out[line & ~body])
    r = np.dstack([out, a[..., 3:]])
    return Image.fromarray(np.clip(r, 0, 255).astype(np.uint8), "RGBA")


def main():
    name, folder = sys.argv[1], sys.argv[2]
    mode = sys.argv[3] if len(sys.argv) > 3 else None
    walk = {d: frames(folder, "walk", d) for d in ("south", "east", "north")}
    assert all(len(v) == 8 for v in walk.values()), [len(v) for v in walk.values()]
    cw0 = walk["east"][0].width
    eat = frames(folder, "graze", "east")         # the v3 custom clip (9 frames, a bigger canvas): put on the 124 canvas by the standing reference
    assert len(eat) == 9, len(eat)
    rot = Image.open(os.path.join(folder, "Idle", "rotations", "east.png")).convert("RGBA").getbbox(); fb = eat[0].getbbox()
    ox, oy = rot[0] - fb[0], rot[3] - fb[3]
    eat = [put(f.crop((0, 0, f.width, f.height)), ox, oy).crop((0, 0, cw0, cw0)) for f in eat]
    # every frame of every clip onto ONE body anchor (per view): the hoof row and the rump / torso column of the walk's first frame. The legs, head and
    # tail move inside the frame; the body does not (the event's own movement carries it)
    ref = {d: anchor(walk[d][0], d == "east") for d in walk}
    for d in walk: walk[d] = aligned(walk[d], d == "east", ref[d])
    eat = aligned(eat, True, ref["east"])
    if mode:                                     # a recoloured coat: after the alignment, so the masks sit on the steady body
        for d in walk: walk[d] = [recolor(f, d, ref[d], mode) for f in walk[d]]
        eat = [recolor(f, "east", ref["east"], mode) for f in eat]
    print("anchors", ref)
    allf = [f for v in walk.values() for f in v] + eat
    xa = min(f.getbbox()[0] for f in allf); xb = max(f.getbbox()[2] for f in allf)
    ya = min(f.getbbox()[1] for f in allf)
    half = max(cw0 // 2 - xa, xb - cw0 // 2) + 2
    CW = half * 2
    bot = {d: ref[d][1] for d in walk}
    CH = max(bot.values()) - ya + 3
    print("cell", CW, "x", CH, "bottoms", bot)

    def cell(f, d, dx=0, flip=False):
        x0 = cw0 // 2 - half - dx
        c = f.crop((x0, bot[d] - (CH - 2), x0 + CW, bot[d] + 2))
        return ImageOps.mirror(c) if flip else c

    def sheet(cols, rows):            # rows: [(list of cells or None) x 4]
        sh = Image.new("RGBA", (CW * cols, CH * 4), (0, 0, 0, 0))
        for r, cells in enumerate(rows):
            for c, im in enumerate(cells or []):
                sh.paste(im, (c * CW, r * CH))
        return sh

    out = os.path.join(ROOT, "img", "characters")
    s = sheet(8, [[cell(f, "south") for f in walk["south"]], [cell(f, "east", flip=True) for f in walk["east"]],
                  [cell(f, "east") for f in walk["east"]], [cell(f, "north") for f in walk["north"]]])
    styl_b.grade(s).save(os.path.join(out, "$Kon_" + name + ".png"))
    s = sheet(len(eat), [None, [cell(f, "east", flip=True) for f in eat], [cell(f, "east") for f in eat], None])
    styl_b.grade(s).save(os.path.join(out, "$Kon_" + name + "_Pasie.png"))
    # the drink sheet: the SAME aligned frames with one fixed offset - the sipping head's muzzle MUZZLE_X from the left edge of the mirrored cell
    tip = max(cell(f, "east").getbbox()[2] for f in eat[-3:])          # the head tip (east: the right edge) in the unshifted cell
    dx = (CW - tip) - MUZZLE_X                                             # > 0: the content moves towards its head (the mirrored: left)
    print("muzzle shift", dx)
    s = sheet(len(eat), [None, [cell(f, "east", dx=dx, flip=True) for f in eat], [cell(f, "east", dx=dx) for f in eat], None])
    styl_b.grade(s).save(os.path.join(out, "$Kon_" + name + "_Pije.png"))
    print("done", name, "sheets", CW * 8, "x", CH * 4, "/", CW * len(eat), "x", CH * 4)


main()
