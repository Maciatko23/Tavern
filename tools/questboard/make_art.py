# The art of the quest board scene (QuestBoard.js): the background (tavern wall, the carved board with its small roof and
# the "ZLECENIA" sign, the slate for the side panel), the parchment sheets the notices are cut from and the small parts
# (nails, tacks, wax seals, a coin, the stamp ink mask). Procedural (numpy + PIL), seeded: the same files every run.
#   python tools/questboard/make_art.py [outdir]      (default: img/system of the project)
import os
import sys
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
from qblib import (hexrgb, fbm, stretched, norm01, ramp_map, wood_field, paste_rgb, to_image, value_noise)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "img", "system")
FONTS = os.path.join(ROOT, "fonts")
SC_BOLD = os.path.join(FONTS, "AlegreyaSC-Bold.ttf")
HAND = os.path.join(FONTS, "Caveat-Bold.ttf")

W, H = 1280, 720
# the layout (QuestBoard.js reads the same numbers from its LAYOUT table)
BOARD = (18, 76, 790, 678)          # the frame's outer edge
FRAME = 30
FACE = (BOARD[0] + FRAME, BOARD[1] + FRAME, BOARD[2] - FRAME, BOARD[3] - FRAME)
ROOF = (4, 4, 804, 86)          # shingles, the fascia and the carved eaves trim under it
SIGN = (290, 32, 518, 92)
SLATE = (812, 500, 1258, 678)

RAMP_WALL = ["#0c0806", "#110b08", "#160f0b", "#1c130e", "#221812", "#291d15", "#302219", "#38291e"]
RAMP_FRAME = ["#140b06", "#1d110a", "#27170e", "#321e12", "#3e2617", "#4a2f1c", "#573822", "#654229", "#744d31", "#85593a", "#976745"]
RAMP_FACE = ["#2a190e", "#352013", "#412818", "#4e311e", "#5b3a24", "#68442a", "#764e31", "#845938", "#936541", "#a2724b", "#b08056"]
RAMP_ROOF = ["#120d0a", "#19120e", "#211913", "#2a2019", "#342820", "#3f3127", "#4a3a2f", "#574538", "#655142"]
RAMP_SIGN = ["#0f0906", "#160d08", "#1e120b", "#27180f", "#301e13", "#3a2517", "#452c1c"]
RAMP_SLATE = ["#0e1012", "#121518", "#161a1d", "#1b1f23", "#212529", "#272c30"]
RAMP_SLATE_FRAME = ["#3a2716", "#4a331e", "#5b3f26", "#6c4b2f", "#7e5838", "#906543", "#a2734e"]
RAMP_IRON = ["#101112", "#1d1f21", "#2c2f32", "#3e4246", "#555a5f", "#6f757b", "#8d949a", "#b3b9be"]


def rgb_img(a):
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB")


def rng_for(tag):
    return np.random.default_rng(abs(hash_str(tag)) % (2 ** 32))


def hash_str(s):
    h = 2166136261
    for ch in s.encode("utf8"):
        h = ((h ^ ch) * 16777619) & 0xFFFFFFFF
    return h


# ----------------------------------------------------------------------------------------------------------------------
# the wall behind the board: dark walnut boards standing upright
# ----------------------------------------------------------------------------------------------------------------------
def make_wall(canvas):
    rng = rng_for("wall")
    x = -30
    while x < W:
        pw = int(rng.integers(92, 128))
        f = wood_field(pw, H, rng, vertical=True, ring=0.06, warp=4.0, fiber=0.25, streak=0.35,
                       knots=[(rng.uniform(20, pw - 20), rng.uniform(40, H - 40), rng.uniform(9, 15), rng.choice([-1, 1]))] if rng.random() < 0.6 else ())
        v = norm01(f, 0.05, 1.05) * 0.8 + rng.uniform(-0.06, 0.06)
        rgb = ramp_map(v, RAMP_WALL, ox=x)
        paste_rgb(canvas, rgb, x, 0)
        canvas[:, max(0, x):max(0, x + 2)] = hexrgb("#070504")        # the gap between boards
        if x + 2 < W:
            canvas[:, max(0, x + 2):max(0, x + 3)] *= 1.25            # the lit edge of the next board
        x += pw
    # a rail across the wall behind the board's feet
    rail_y = 690
    f = wood_field(W, 30, rng, vertical=False, ring=0.07, warp=3, fiber=0.3)
    rgb = ramp_map(norm01(f) * 0.75 + 0.1, RAMP_WALL)
    paste_rgb(canvas, rgb, 0, rail_y)
    canvas[rail_y:rail_y + 2] *= 1.4
    canvas[rail_y - 3:rail_y] *= 0.6


# ----------------------------------------------------------------------------------------------------------------------
# light: a warm lamp over the board and a softer one over the right column; a vignette
# ----------------------------------------------------------------------------------------------------------------------
def light_map():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    l1 = np.exp(-(((xx - 404) / 620) ** 2 + ((yy - 10) / 560) ** 2))
    l2 = np.exp(-(((xx - 1035) / 330) ** 2 + ((yy - 230) / 420) ** 2))
    vign = 1 - 0.35 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.3
    return np.clip(0.55 + 0.5 * l1 + 0.28 * l2, 0, 1.2) * np.clip(vign, 0.55, 1)


def warm(canvas, lm):
    tint = np.stack([1.0 + 0.10 * lm, 1.0 + 0.02 * lm, 1.0 - 0.10 * lm], axis=-1)
    canvas *= lm[..., None] * tint


# ----------------------------------------------------------------------------------------------------------------------
# a soft drop shadow of a rectangle
# ----------------------------------------------------------------------------------------------------------------------
def drop_shadow(canvas, box, off=(9, 13), blur=16, alpha=0.7):
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).rectangle([box[0] + off[0], box[1] + off[1], box[2] + off[0], box[3] + off[1]], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(m, dtype=np.float32) / 255.0 * alpha
    canvas *= (1 - a)[..., None]


# ----------------------------------------------------------------------------------------------------------------------
# the face of the board: upright planks of lighter oak with knots, nail heads, old pin holes and sun-faded patches
# ----------------------------------------------------------------------------------------------------------------------
def nail_head(canvas, cx, cy, r=3.2, rust=0.0, rng=None):
    rng = rng or np.random.default_rng(1)
    s = int(r * 2 + 6)
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    dx, dy = xx - s / 2 + 0.5, yy - s / 2 + 0.5
    d = np.sqrt(dx ** 2 + dy ** 2)
    inside = np.clip(r + 0.5 - d, 0, 1)
    lit = np.clip(0.55 - (dx + dy) / (r * 2.4), 0, 1)                   # a dome lit from the top left
    spec = np.exp(-(((dx + r * 0.35) ** 2 + (dy + r * 0.35) ** 2) / (r * 0.45) ** 2))
    v = np.clip(0.25 + 0.55 * lit + 0.35 * spec, 0, 1)
    rgb = ramp_map(v, RAMP_IRON, dither=False)
    if rust > 0:
        rn = value_noise(s, s, 2, rng)
        rust_c = hexrgb("#6b3a1e")
        t = np.clip((rn - (1 - rust)) * 3, 0, 1)[..., None] * 0.8
        rgb = rgb * (1 - t) + rust_c * t
    # its shadow on the wood (down right)
    sh = np.clip(r + 1.2 - np.sqrt((dx - 1.6) ** 2 + (dy - 2.0) ** 2), 0, 1) * 0.55
    x0, y0 = int(round(cx - s / 2)), int(round(cy - s / 2))
    region = canvas[y0:y0 + s, x0:x0 + s]
    if region.shape[:2] != (s, s):
        return
    region *= (1 - sh * (1 - inside))[..., None]
    region[:] = region * (1 - inside[..., None]) + rgb * inside[..., None]


def make_face(canvas):
    rng = rng_for("face")
    x0, y0, x1, y1 = FACE
    fw, fh = x1 - x0, y1 - y0
    widths = []
    left = fw
    while left > 0:
        w = int(rng.integers(92, 116))
        if left - w < 70:
            w = left
        widths.append(w)
        left -= w
    x = x0
    face = np.zeros((fh, fw, 3), np.float32)
    for i, pw in enumerate(widths):
        knots = []
        for _ in range(int(rng.integers(0, 3))):
            knots.append((rng.uniform(18, pw - 18), rng.uniform(30, fh - 30), rng.uniform(8, 14), rng.choice([-1, 1])))
        f = wood_field(pw, fh, rng, vertical=True, ring=rng.uniform(0.07, 0.1), warp=rng.uniform(4, 7), fiber=0.32, streak=0.4, knots=knots)
        v = norm01(f, -0.05, 1.05) * 0.78 + 0.14 + rng.uniform(-0.05, 0.05)
        rgb = ramp_map(v, RAMP_FACE, ox=x)
        face[:, x - x0:x - x0 + pw] = rgb
        if i > 0:
            face[:, x - x0:x - x0 + 2] = hexrgb("#1a0f08")               # the joint
            face[:, x - x0 + 2:x - x0 + 3] *= 1.18
            face[:, max(0, x - x0 - 1):x - x0] *= 0.8
        x += pw
    # sun-faded patches where old notices hung for a long time
    for _ in range(9):
        pw_, ph_ = int(rng.integers(120, 210)), int(rng.integers(110, 200))
        px, py = int(rng.integers(-40, fw - 80)), int(rng.integers(-30, fh - 80))
        m = Image.new("L", (fw, fh), 0)
        ImageDraw.Draw(m).rectangle([px, py, px + pw_, py + ph_], fill=255)
        m = m.filter(ImageFilter.GaussianBlur(6))
        a = np.asarray(m, dtype=np.float32) / 255.0 * rng.uniform(0.05, 0.10)
        face *= (1 + a)[..., None]
    # old pin holes and nail holes (tiny dark dots, some in pairs)
    for _ in range(260):
        hx, hy = int(rng.integers(3, fw - 3)), int(rng.integers(3, fh - 3))
        face[hy, hx] *= 0.35
        if rng.random() < 0.5:
            face[hy + 1, hx] *= 0.6
        if rng.random() < 0.2:
            face[hy, hx + 1] *= 0.55
    # scratches: thin lighter lines
    img = rgb_img(face)
    d = ImageDraw.Draw(img, "RGBA")
    for _ in range(26):
        sx, sy = rng.uniform(0, fw), rng.uniform(0, fh)
        ang, ln = rng.uniform(0, math.pi), rng.uniform(8, 38)
        d.line([sx, sy, sx + math.cos(ang) * ln, sy + math.sin(ang) * ln], fill=(214, 170, 120, int(rng.integers(26, 60))), width=1)
    # a few tally marks and a small scratched crow, low right (the kind of thing bored guests carve)
    tx, ty = fw - 120, fh - 34
    for k in range(4):
        d.line([tx + k * 6, ty, tx + k * 6 + 1, ty + 16], fill=(30, 16, 8, 150), width=2)
    d.line([tx - 3, ty + 12, tx + 24, ty + 3], fill=(30, 16, 8, 150), width=2)
    cx, cy = 26, fh - 40
    crow = [(0, 8), (6, 4), (12, 5), (16, 2), (20, 3), (17, 6), (22, 9), (14, 10), (10, 14), (11, 18), (8, 14), (4, 12), (0, 8)]
    d.line([(cx + px_, cy + py_) for px_, py_ in crow], fill=(28, 15, 8, 140), width=1)
    face = np.asarray(img, dtype=np.float32).copy()
    # the frame's shadow on the face (light from the top left: the top and left inner edges)
    yy, xx = np.mgrid[0:fh, 0:fw].astype(np.float32)
    sh = np.clip(1 - yy / 16, 0, 1) ** 1.6 * 0.55 + np.clip(1 - xx / 12, 0, 1) ** 1.6 * 0.4
    sh = np.clip(sh, 0, 0.6)
    face *= (1 - sh)[..., None]
    face[fh - 2:] *= 0.75
    face[:, fw - 2:] *= 0.8
    canvas[y0:y1, x0:x1] = face
    # the planks are nailed to the battens behind: two nails at the top and bottom of every plank
    x = x0
    for i, pw in enumerate(widths):
        for yy_ in (y0 + 14, y1 - 14):
            for xx_ in (x + 14, x + pw - 14):
                nail_head(canvas, xx_ + rng.uniform(-2, 2), yy_ + rng.uniform(-2, 2), r=2.6, rust=rng.uniform(0.1, 0.5), rng=rng)
        x += pw
    return widths


# ----------------------------------------------------------------------------------------------------------------------
# the carved frame: four rails with a profile (bead, a band of small carved notches, a cove, the lip), mitred corners,
# corner blocks with rosettes
# ----------------------------------------------------------------------------------------------------------------------
PROFILE = [0.38, 0.55, 0.92, 1.28, 1.38, 1.22, 0.86, 0.58, 0.96, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98,
           0.98, 0.96, 0.92, 0.58, 0.52, 0.66, 0.82, 0.98, 1.3, 1.12, 0.5, 0.34]
BAND = (8, 21)   # the rows of the profile with the carved notches


def make_frame(canvas):
    rng = rng_for("frame")
    x0, y0, x1, y1 = BOARD
    bw, bh = x1 - x0, y1 - y0
    frame = np.zeros((bh, bw, 3), np.float32)
    mask = np.zeros((bh, bw), np.float32)
    horiz = wood_field(bw, FRAME, rng, vertical=False, ring=0.05, warp=4, fiber=0.35, streak=0.3)
    horiz2 = wood_field(bw, FRAME, rng, vertical=False, ring=0.05, warp=4, fiber=0.35, streak=0.3)
    vert = wood_field(FRAME, bh, rng, vertical=True, ring=0.05, warp=4, fiber=0.35, streak=0.3)
    vert2 = wood_field(FRAME, bh, rng, vertical=True, ring=0.05, warp=4, fiber=0.35, streak=0.3)
    prof = np.array(PROFILE, np.float32)
    yy, xx = np.mgrid[0:bh, 0:bw]

    def rail(field, profile_axis, length, flip, light):
        v = norm01(field, -0.05, 1.05) * 0.62 + 0.18
        p = prof[::-1] if flip else prof
        if profile_axis == 0:   # profile runs down the rows (a horizontal rail)
            v = v * p[:, None]
            k = np.arange(length)
            notch = ((k % 9) < 4).astype(np.float32)
            band = np.zeros_like(v)
            rows = slice(BAND[0] + 2, BAND[1] - 2) if not flip else slice(FRAME - BAND[1] + 2, FRAME - BAND[0] - 2)
            band[rows, :] = notch[None, :]
            v = v * (1 - 0.42 * band)
            edge = np.roll(band, 1, axis=1) - band
            v = v * (1 + 0.45 * np.clip(edge, 0, 1)) * (1 - 0.25 * np.clip(-edge, 0, 1))
        else:
            v = v * p[None, :]
            k = np.arange(length)
            notch = ((k % 9) < 4).astype(np.float32)
            band = np.zeros_like(v)
            cols = slice(BAND[0] + 2, BAND[1] - 2) if not flip else slice(FRAME - BAND[1] + 2, FRAME - BAND[0] - 2)
            band[:, cols] = notch[:, None]
            v = v * (1 - 0.42 * band)
            edge = np.roll(band, 1, axis=0) - band
            v = v * (1 + 0.45 * np.clip(edge, 0, 1)) * (1 - 0.25 * np.clip(-edge, 0, 1))
        return np.clip(v * light, 0, 1.2)

    top = rail(horiz, 0, bw, False, 1.12)
    bottom = rail(horiz2, 0, bw, True, 0.78)
    left = rail(vert, 1, bh, False, 1.02)
    right = rail(vert2, 1, bh, True, 0.82)
    lum = np.zeros((bh, bw), np.float32)
    # mitred: a pixel belongs to the rail it is nearest to
    dt, db, dl, dr = yy, bh - 1 - yy, xx, bw - 1 - xx
    near = np.argmin(np.stack([dt, db, dl, dr]), axis=0)
    inside = (np.minimum(np.minimum(dt, db), np.minimum(dl, dr)) < FRAME)
    for idx, (arr, sl) in enumerate([(top, (slice(0, FRAME), slice(0, bw))), (bottom, (slice(bh - FRAME, bh), slice(0, bw))),
                                      (left, (slice(0, bh), slice(0, FRAME))), (right, (slice(0, bh), slice(bw - FRAME, bw)))]):
        m = (near == idx) & inside
        full = np.zeros((bh, bw), np.float32)
        full[sl] = arr
        lum = np.where(m, full, lum)
    rgb = ramp_map(np.clip(lum, 0, 1), RAMP_FRAME)
    # the mitre lines
    img = rgb_img(rgb)
    d = ImageDraw.Draw(img, "RGBA")
    for (ax, ay, bx, by) in [(0, 0, FRAME, FRAME), (bw - 1, 0, bw - 1 - FRAME, FRAME), (0, bh - 1, FRAME, bh - 1 - FRAME), (bw - 1, bh - 1, bw - 1 - FRAME, bh - 1 - FRAME)]:
        d.line([ax, ay, bx, by], fill=(10, 6, 3, 200), width=1)
    rgb = np.asarray(img, dtype=np.float32).copy()
    m = inside.astype(np.float32)
    region = canvas[y0:y1, x0:x1]
    region[:] = region * (1 - m[..., None]) + rgb * m[..., None]
    # corner blocks with carved rosettes
    for (cx, cy) in [(x0, y0), (x1 - 36, y0), (x0, y1 - 36), (x1 - 36, y1 - 36)]:   # (48 px blocks, 6 px over the edge)
        corner_block(canvas, cx - 6, cy - 6, 48, rng)


def corner_block(canvas, bx, by, s, rng):
    f = wood_field(s, s, rng, vertical=False, ring=0.06, warp=3, fiber=0.3)
    v = norm01(f) * 0.55 + 0.22
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    # a raised square with bevelled edges
    e = np.minimum(np.minimum(xx, yy), np.minimum(s - 1 - xx, s - 1 - yy))
    bevel = np.where(e < 4, np.where((xx < 4) | (yy < 4), 1.35, 0.6), 1.0)
    bevel = np.where((e < 4) & (xx < 4) & (yy > s - 5 - xx), 0.8, bevel)
    v = v * bevel
    # the rosette: 8 petals round a boss
    cx, cy = s / 2 - 0.5, s / 2 - 0.5
    dx, dy = xx - cx, yy - cy
    r = np.sqrt(dx ** 2 + dy ** 2)
    ang = np.arctan2(dy, dx)
    petal_r = 13 + 3.5 * np.cos(ang * 8)
    in_petal = r < petal_r
    carve = np.where(in_petal & (r > 5.5), 0.82 + 0.35 * np.clip(-(dx + dy) / (r + 1e-3), -1, 1) * 0.5 * np.sign(np.cos(ang * 8) + 0.3), 1.0)
    groove = np.exp(-((r - petal_r) ** 2) / 1.2) * 0.45
    boss = np.clip(5.5 - r, 0, 1)
    v = v * carve * (1 - groove)
    v = v * (1 - boss) + boss * np.clip(0.55 + 0.4 * np.clip(-(dx + dy) / 6, -1, 1), 0, 1)
    rgb = ramp_map(np.clip(v, 0, 1), RAMP_FRAME)
    # its shadow
    region = canvas[by:by + s + 4, bx:bx + s + 4]
    if region.shape[0] == s + 4 and region.shape[1] == s + 4:
        region[4:, 4:] *= 0.55
    paste_rgb(canvas, rgb, bx, by)


# ----------------------------------------------------------------------------------------------------------------------
# the small roof: three rows of shingles over a fascia board, two brackets under it
# ----------------------------------------------------------------------------------------------------------------------
def make_roof(canvas):
    rng = rng_for("roof")
    x0, y0, x1, y1 = ROOF
    rw, rh = x1 - x0, y1 - y0
    trim_h, fascia_h = 11, 14
    shingle_h = rh - fascia_h - trim_h
    roof = np.zeros((shingle_h + fascia_h, rw, 3), np.float32)
    rows = 3
    row_h = shingle_h / rows
    for r in range(rows):
        ry0 = int(round(r * row_h)) - (3 if r else 0)
        ry1 = int(round((r + 1) * row_h))
        sh_ = ry1 - ry0
        x = -int(rng.integers(0, 24)) - (r % 2) * 13
        while x < rw:
            sw = int(rng.integers(20, 31))
            f = wood_field(sw, sh_, rng, vertical=True, ring=0.16, warp=2.5, fiber=0.5, streak=0.2)
            base = rng.uniform(0.32, 0.62)
            v = norm01(f) * 0.32 + base
            yy = np.arange(sh_, dtype=np.float32)[:, None]
            v = v * (0.62 + 0.55 * (yy / sh_) ** 1.4)      # the covered top is dark, the exposed butt lighter
            v[-3:-1] = np.clip(v[-3:-1] * 1.18, 0, 1)      # the lit thickness of the butt
            v[-1:] *= 0.35                                 # and its shadow line
            xx = np.arange(sw)[None, :]
            v = v * np.where(xx < 1, 0.25, np.where(xx < 2, 1.2, np.where(xx > sw - 2, 0.8, 1.0)))
            if rng.random() < 0.3:                         # a crack
                cx_ = int(rng.integers(4, sw - 4))
                v[int(sh_ * 0.35):, cx_] *= 0.45
            rgb = ramp_map(np.clip(v, 0, 1), RAMP_ROOF, ox=x)
            if rng.random() < 0.22:                        # moss on the exposed part
                mn = value_noise(sw, sh_, 3, rng)
                t = np.clip((mn - 0.5) * 2.5, 0, 1)[..., None] * 0.55 * ((yy / sh_) ** 2)[..., None]
                rgb = rgb * (1 - t) + hexrgb("#44512a") * t
            paste_rgb(roof, rgb, x, ry0)
            x += sw
        if r > 0:   # the row above throws a shadow on this one
            roof[ry0:ry0 + 5] *= np.linspace(0.45, 1, 5)[:, None, None]
    # the fascia board
    f = wood_field(rw, fascia_h, rng, vertical=False, ring=0.05, warp=3, fiber=0.3)
    v = norm01(f) * 0.5 + 0.3
    prof = np.array([0.35, 1.3, 1.3, 1.12, 1, 1, 1, 0.98, 0.98, 0.95, 0.9, 0.85, 0.6, 0.4], np.float32)
    v = v * prof[:, None]
    roof[shingle_h:] = ramp_map(np.clip(v, 0, 1), RAMP_FRAME)
    roof[:shingle_h] *= np.linspace(0.8, 1.0, shingle_h)[:, None, None]
    # the carved eaves trim under the fascia (a scalloped board with small round holes, like on old wooden houses)
    tw = rw
    f = wood_field(tw, trim_h, rng, vertical=False, ring=0.05, warp=3, fiber=0.3)
    tv = norm01(f) * 0.45 + 0.3
    yy, xx = np.mgrid[0:trim_h, 0:tw].astype(np.float32)
    period = 16
    cxs = (xx % period) - period / 2 + 0.5
    scallop = np.sqrt(cxs ** 2 + (yy - 1) ** 2) < 7.8           # each tongue: a half disc hanging down
    hole = np.sqrt(cxs ** 2 + (yy - 3.5) ** 2) < 1.9
    keep = scallop & ~hole
    edge_dark = (np.abs(np.sqrt(cxs ** 2 + (yy - 1) ** 2) - 7.3) < 0.8) & (yy > 3)
    tv = tv * np.where(yy < 2, 1.2, 1.0) * np.where(edge_dark, 0.55, 1.0)
    trgb = ramp_map(np.clip(tv, 0, 1), RAMP_FRAME)
    # drop shadow of the roof on the frame and the wall under it
    drop_shadow(canvas, (x0 + 6, y1 - 34, x1 - 6, y1 - 4), off=(4, 12), blur=8, alpha=0.8)
    paste_rgb(canvas, roof, x0, y0)
    # the trim casts a small scalloped shadow too
    sh = np.zeros((trim_h + 4, tw), np.float32)
    sh[3:3 + trim_h, 2:] = keep[:, :-2]
    region = canvas[y1 - trim_h:y1 + 4, x0:x0 + tw]
    region *= (1 - 0.5 * sh[:region.shape[0], :region.shape[1]])[..., None]
    region2 = canvas[y1 - trim_h:y1, x0:x0 + tw]
    k = keep.astype(np.float32)[..., None]
    region2[:] = region2 * (1 - k) + trgb * k
    # the roof's ends: the side boards (barge boards) of the gable-less canopy
    for bx in (x0, x1 - 6):
        f = wood_field(6, rh - trim_h, rng, vertical=True, ring=0.1, warp=2, fiber=0.3)
        bv = norm01(f) * 0.45 + 0.28
        bv[:, :1] *= 1.3 if bx == x0 else 0.6
        paste_rgb(canvas, ramp_map(np.clip(bv, 0, 1), RAMP_FRAME), bx, y0)


def bracket(canvas, bx, by, rng):
    w, h = 18, 34
    f = wood_field(w, h, rng, vertical=True, ring=0.1, warp=2, fiber=0.3)
    v = norm01(f) * 0.5 + 0.28
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # a corbel: full width at the top, curving in towards the bottom
    edge = w - (w - 5) * (yy / h) ** 0.7
    inside = (xx < edge).astype(np.float32)
    v = v * np.where(xx < 2, 1.3, 1) * np.where(np.abs(xx - edge) < 1.5, 0.55, 1)
    rgb = ramp_map(np.clip(v, 0, 1), RAMP_FRAME)
    region = canvas[by:by + h, bx:bx + w]
    if region.shape[:2] != (h, w):
        return
    sh = np.roll(np.roll(inside, 3, 0), 3, 1) * 0.5
    region *= (1 - sh)[..., None]
    region[:] = region * (1 - inside[..., None]) + rgb * inside[..., None]


# ----------------------------------------------------------------------------------------------------------------------
# the sign: a dark board nailed to the fascia, "ZLECENIA" carved and gilded
# ----------------------------------------------------------------------------------------------------------------------
def make_sign(canvas):
    rng = rng_for("sign")
    x0, y0, x1, y1 = SIGN
    sw, sh = x1 - x0, y1 - y0
    drop_shadow(canvas, SIGN, off=(5, 8), blur=7, alpha=0.8)
    f = wood_field(sw, sh, rng, vertical=False, ring=0.05, warp=4, fiber=0.35, streak=0.3)
    v = norm01(f) * 0.55 + 0.25
    yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32)
    e = np.minimum(np.minimum(xx, yy), np.minimum(sw - 1 - xx, sh - 1 - yy))
    v = v * np.where(e < 3, np.where((yy < 3) | (xx < 3), 1.45, 0.55), 1.0)
    # the corners cut off (a plank with its corners trimmed)
    cut = 7
    corner = (xx + yy < cut) | ((sw - 1 - xx) + yy < cut) | (xx + (sh - 1 - yy) < cut) | ((sw - 1 - xx) + (sh - 1 - yy) < cut)
    rgb = ramp_map(np.clip(v, 0, 1), RAMP_SIGN)
    img = rgb_img(rgb)
    # the carved, gilded letters
    fnt = ImageFont.truetype(SC_BOLD, 36)
    text = "ZLECENIA"
    spacing = 5
    widths = [fnt.getlength(ch) for ch in text]
    total = sum(widths) + spacing * (len(text) - 1)
    tx = (sw - total) / 2
    ty = 6
    layer_dark = Image.new("L", (sw, sh), 0)
    layer_lit = Image.new("L", (sw, sh), 0)
    layer_fill = Image.new("L", (sw, sh), 0)
    x = tx
    for ch, cw in zip(text, widths):
        ImageDraw.Draw(layer_dark).text((x - 1, ty - 1), ch, font=fnt, fill=255)
        ImageDraw.Draw(layer_lit).text((x + 1, ty + 1), ch, font=fnt, fill=255)
        ImageDraw.Draw(layer_fill).text((x, ty), ch, font=fnt, fill=255)
        x += cw + spacing
    a = np.asarray(img, dtype=np.float32).copy()
    dk = np.asarray(layer_dark, dtype=np.float32)[..., None] / 255
    lt = np.asarray(layer_lit, dtype=np.float32)[..., None] / 255
    fl = np.asarray(layer_fill, dtype=np.float32)[..., None] / 255
    a = a * (1 - lt * 0.6) + np.array([120, 90, 60], np.float32) * lt * 0.6
    a = a * (1 - dk * 0.85)
    # the gold: a vertical gradient, worn in places
    gold_top, gold_bot = hexrgb("#ffe27a"), hexrgb("#b8861c")
    g = (yy / sh)[..., None]
    gold = gold_top * (1 - g) + gold_bot * g
    wear = value_noise(sw, sh, 3, rng)[..., None]
    gold = gold * (0.82 + 0.25 * wear)
    worn = (value_noise(sw, sh, 2, rng) > 0.86)[..., None].astype(np.float32) * 0.6
    a = a * (1 - fl * (1 - worn)) + gold * fl * (1 - worn) + a * fl * worn * 0.0
    img = rgb_img(a)
    arr = np.asarray(img, dtype=np.float32)
    m = (~corner).astype(np.float32)
    region = canvas[y0:y1, x0:x1]
    region[:] = region * (1 - m[..., None]) + arr * m[..., None]
    for nx in (x0 + 12, x1 - 13):
        nail_head(canvas, nx, y0 + sh / 2, r=3.2, rust=0.3, rng=rng)


# ----------------------------------------------------------------------------------------------------------------------
# the slate for the side panel (reputation, contracts in hand, the purse): a dark slate in a light wooden frame
# ----------------------------------------------------------------------------------------------------------------------
def make_slate(canvas):
    rng = rng_for("slate")
    x0, y0, x1, y1 = SLATE
    sw, sh = x1 - x0, y1 - y0
    drop_shadow(canvas, SLATE, off=(8, 11), blur=12, alpha=0.75)
    fr = 10
    # frame
    f = wood_field(sw, sh, rng, vertical=False, ring=0.06, warp=3, fiber=0.35)
    v = norm01(f) * 0.6 + 0.25
    yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32)
    e = np.minimum(np.minimum(xx, yy), np.minimum(sw - 1 - xx, sh - 1 - yy))
    lit = np.where((yy < fr) | (xx < fr), 1.12, 0.86)
    v = v * lit * np.where(e < 1, 0.5, 1) * np.where((e >= fr - 2) & (e < fr), 0.55, 1)
    rgb = ramp_map(np.clip(v, 0, 1), RAMP_SLATE_FRAME)
    # slate
    s = fbm(sw, sh, 40, 5, rng)
    streaks = stretched(sw, sh, 20, 3, rng, sx=6, sy=1)
    sv = norm01(s) * 0.5 + 0.25 + 0.15 * (streaks - 0.5)
    srgb = ramp_map(np.clip(sv, 0, 1), RAMP_SLATE)
    # old chalk smudges
    sm = fbm(sw, sh, 60, 4, rng)
    t = np.clip((sm - 0.55) * 2.2, 0, 1) * 0.16
    srgb = srgb * (1 - t[..., None]) + np.array([200, 205, 205], np.float32) * t[..., None]
    inner = (e >= fr).astype(np.float32)
    # inner shadow of the frame on the slate
    ish = np.clip(1 - (e - fr) / 7, 0, 1) * 0.5 * inner
    srgb = srgb * (1 - ish[..., None])
    out = rgb * (1 - inner[..., None]) + srgb * inner[..., None]
    canvas[y0:y1, x0:x1] = out
    for (nx, ny) in [(x0 + 5, y0 + 5), (x1 - 6, y0 + 5), (x0 + 5, y1 - 6), (x1 - 6, y1 - 6)]:
        nail_head(canvas, nx, ny, r=2.4, rust=0.2, rng=rng)


# ----------------------------------------------------------------------------------------------------------------------
# faded paper scraps left under old nails (the board has been in use for years)
# ----------------------------------------------------------------------------------------------------------------------
def scraps(canvas):
    rng = rng_for("scraps")
    x0, y0, x1, y1 = FACE
    spots = [(x0 + 30, y0 + 250, -0.3), (x1 - 40, y0 + 160, 0.4), (x0 + 360, y1 - 22, 0.1), (x1 - 150, y1 - 30, -0.2), (x0 + 250, y0 + 20, 0.2)]
    for (sx, sy, rot) in spots:
        w, h = int(rng.integers(22, 40)), int(rng.integers(16, 30))
        pts = [(0, 0), (w, rng.uniform(0, 6)), (w - rng.uniform(0, 12), h), (rng.uniform(0, 10), h - rng.uniform(0, 8))]
        img = Image.new("RGBA", (w + 8, h + 8), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        col = tuple(int(c) for c in hexrgb("#b9a27c") * rng.uniform(0.85, 1.0)) + (230,)
        d.polygon([(p[0] + 4, p[1] + 4) for p in pts], fill=col)
        # a few faded ink marks
        for _ in range(3):
            lx = rng.uniform(6, w - 4)
            d.line([lx, rng.uniform(8, h), lx + rng.uniform(4, 10), rng.uniform(8, h)], fill=(90, 70, 50, 120), width=1)
        img = img.rotate(math.degrees(rot), resample=Image.BICUBIC, expand=True)
        arr = np.asarray(img, dtype=np.float32)
        a = arr[..., 3:4] / 255
        px, py = int(sx - img.width / 2), int(sy - img.height / 2)
        region = canvas[py:py + img.height, px:px + img.width]
        if region.shape[:2] != arr.shape[:2]:
            continue
        # shadow
        region[2:, 2:] *= (1 - a[:-2, :-2] * 0.35)
        region[:] = region * (1 - a) + arr[..., :3] * a
        nail_head(canvas, sx + rng.uniform(-3, 3), py + 8, r=2.6, rust=0.6, rng=rng)


def make_back():
    canvas = np.zeros((H, W, 3), np.float32)
    make_wall(canvas)
    drop_shadow(canvas, BOARD, off=(10, 14), blur=18, alpha=0.8)
    make_face(canvas)
    scraps(canvas)
    make_frame(canvas)
    make_roof(canvas)
    make_sign(canvas)
    make_slate(canvas)
    warm(canvas, light_map())
    return to_rgb(canvas)


def to_rgb(canvas):
    return Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), "RGB")


# ----------------------------------------------------------------------------------------------------------------------
# parchment sheets: four shades in one 1024 x 1024 atlas (the notices and the big card are cut out of them at run time)
# ----------------------------------------------------------------------------------------------------------------------
PAPER_SHADES = [("#efe2c0", "#d9c296"), ("#ecd7a6", "#cfb27a"), ("#e6dfcf", "#c9bda2"), ("#e2c996", "#c2a26b")]


def make_paper():
    atlas = np.zeros((1024, 1024, 3), np.float32)
    for i, (light, dark) in enumerate(PAPER_SHADES):
        rng = rng_for("paper%d" % i)
        s = 512
        big = fbm(s, s, 120, 4, rng)
        mid = fbm(s, s, 26, 4, rng)
        fine = fbm(s, s, 2, 2, rng)
        fib = stretched(s, s, 3, 2, rng, sx=5, sy=1)
        v = 0.62 + 0.28 * (big - 0.5) + 0.16 * (mid - 0.5) + 0.07 * (fine - 0.5) + 0.05 * (fib - 0.5)
        laid = (np.sin(np.arange(s, dtype=np.float32) * (math.tau / 3.2)) * 0.5 + 0.5)[:, None] * 0.012
        v = v - laid
        lc, dc = hexrgb(light), hexrgb(dark)
        rgb = dc[None, None, :] * (1 - v[..., None]) * 0.0 + (dc + (lc - dc) * np.clip(v, 0, 1.2)[..., None])
        img = rgb_img(rgb)
        d = ImageDraw.Draw(img, "RGBA")
        # fibres
        for _ in range(420):
            x, y = rng.uniform(0, s), rng.uniform(0, s)
            ang, ln = rng.uniform(0, math.pi), rng.uniform(3, 11)
            c = (120, 95, 60, int(rng.integers(10, 28))) if rng.random() < 0.6 else (255, 250, 235, int(rng.integers(14, 34)))
            d.line([x, y, x + math.cos(ang) * ln, y + math.sin(ang) * ln], fill=c, width=1)
        # foxing: small brown spots
        for _ in range(int(rng.integers(30, 60))):
            x, y, r = rng.uniform(0, s), rng.uniform(0, s), rng.uniform(0.6, 2.2)
            d.ellipse([x - r, y - r, x + r, y + r], fill=(120, 80, 40, int(rng.integers(20, 60))))
        # one or two old stains: a ring with a darker edge
        for _ in range(int(rng.integers(1, 3))):
            x, y, r = rng.uniform(60, s - 60), rng.uniform(60, s - 60), rng.uniform(22, 44)
            pts = []
            for k in range(28):   # a wobbly outline
                a = k / 28 * math.tau
                rr = r * (1 + 0.16 * math.sin(a * 3 + rng.uniform(0, 6)) + 0.1 * math.sin(a * 7 + rng.uniform(0, 6)))
                pts.append((x + math.cos(a) * rr, y + math.sin(a) * rr * rng.uniform(0.8, 0.95)))
            layer = Image.new("L", (s, s), 0)
            ImageDraw.Draw(layer).line(pts + [pts[0]], fill=255, width=2)
            layer = layer.filter(ImageFilter.GaussianBlur(1.8))
            fill = Image.new("L", (s, s), 0)
            ImageDraw.Draw(fill).polygon(pts, fill=255)
            fill = fill.filter(ImageFilter.GaussianBlur(7))
            arr = np.asarray(img, dtype=np.float32)
            ring = np.asarray(layer, dtype=np.float32)[..., None] / 255 * 0.1
            inner = np.asarray(fill, dtype=np.float32)[..., None] / 255 * 0.045
            arr = arr * (1 - ring - inner) + np.array([140, 100, 55], np.float32) * (ring + inner)
            img = rgb_img(arr)
            d = ImageDraw.Draw(img, "RGBA")
        ox, oy = (i % 2) * 512, (i // 2) * 512
        atlas[oy:oy + 512, ox:ox + 512] = np.asarray(img, dtype=np.float32)
    return rgb_img(atlas)


# ----------------------------------------------------------------------------------------------------------------------
# the parts atlas (64 x 64 cells): 0 iron nail, 1 brass tack, 2 red tack, 3 red wax seal (tankard), 4 dark red wax seal
# (the manor's Z), 5 green wax seal (a leaf), 6 coin, 7 small coin, row 1: the stamp ink mask (512 x 128) and the
# twine knot
# ----------------------------------------------------------------------------------------------------------------------
def make_parts():
    atlas = Image.new("RGBA", (512, 256), (0, 0, 0, 0))
    rng = rng_for("parts")

    def dome(size, ramp, r, spec=0.35, rust=0.0):
        s = size
        yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
        dx, dy = xx - s / 2 + 0.5, yy - s / 2 + 0.5
        d = np.sqrt(dx ** 2 + dy ** 2)
        inside = np.clip(r + 0.5 - d, 0, 1)
        lit = np.clip(0.55 - (dx + dy) / (r * 2.4), 0, 1)
        sp = np.exp(-(((dx + r * 0.35) ** 2 + (dy + r * 0.38) ** 2) / (r * 0.42) ** 2))
        v = np.clip(0.22 + 0.58 * lit + spec * sp, 0, 1)
        rgb = ramp_map(v, ramp, dither=False)
        if rust:
            rn = value_noise(s, s, 2, rng)
            t = np.clip((rn - (1 - rust)) * 3, 0, 1)[..., None] * 0.8
            rgb = rgb * (1 - t) + hexrgb("#6b3a1e") * t
        out = np.zeros((s, s, 4), np.float32)
        out[..., :3] = rgb
        out[..., 3] = inside * 255
        return Image.fromarray(out.astype(np.uint8), "RGBA")

    iron = dome(22, RAMP_IRON, 7.5, rust=0.25)
    brass = dome(22, ["#3a2708", "#5e420f", "#86621a", "#ad8526", "#d2a93a", "#ecc95a", "#fbe7a0"], 7)
    red = dome(22, ["#2a0706", "#4a0e0b", "#6e1712", "#94231a", "#b93426", "#d9543e", "#f3a08b"], 7)
    for k, im in enumerate([iron, brass, red]):
        atlas.alpha_composite(im, (k * 64 + 21, 21))
    # wax seals
    for k, (ramp, emblem) in enumerate([
        (["#2b0404", "#4a0807", "#6c0f0b", "#8e1812", "#ad241b", "#c83a2b", "#e0624c"], "tankard"),
        (["#1a0304", "#300609", "#470b10", "#601219", "#7a1b23", "#942833", "#b04150"], "Z"),
        (["#07140c", "#0d2215", "#15321f", "#1f4429", "#2b5736", "#3a6c45", "#528659"], "leaf")]):
        atlas.alpha_composite(wax_seal(48, ramp, emblem, rng), (192 + k * 64 + 8, 8))
    # coins
    atlas.alpha_composite(coin(28), (384 + 18, 18))
    atlas.alpha_composite(coin(18), (448 + 23, 23))
    # the stamp ink mask: white = ink stays; speckles and worn streaks take it away
    s = np.ones((128, 512), np.float32)
    n = fbm(512, 128, 5, 3, rng)
    s -= (n > 0.68) * 0.85
    sp = rng.random((128, 512)) > 0.965
    s -= sp * 0.7
    st = stretched(512, 128, 10, 2, rng, sx=10, sy=1)
    s -= np.clip((st - 0.64) * 6, 0, 1) * 0.45
    s -= (fbm(512, 128, 40, 2, rng) - 0.5) * 0.35
    s = np.clip(s, 0, 1)
    m = np.zeros((128, 512, 4), np.uint8)
    m[..., :3] = 255
    m[..., 3] = (s * 255).astype(np.uint8)
    atlas.alpha_composite(Image.fromarray(m, "RGBA"), (0, 64))
    # twine: a short piece with a knot (for the rules tag)
    tw = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(tw)
    for i in range(0, 60, 2):
        c = (150, 118, 72, 255) if (i // 2) % 2 else (116, 88, 50, 255)
        d.line([31, i, 32, i + 2], fill=c, width=2)
    d.ellipse([27, 28, 36, 36], fill=(122, 92, 54, 255), outline=(80, 58, 32, 255))
    atlas.alpha_composite(tw, (0, 192))
    return atlas


def wax_seal(s, ramp, emblem, rng):
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    cx = cy = s / 2 - 0.5
    dx, dy = xx - cx, yy - cy
    ang = np.arctan2(dy, dx)
    r = np.sqrt(dx ** 2 + dy ** 2)
    edge = s / 2 - 3 + 2.2 * np.sin(ang * 7 + 1.3) + 1.4 * np.sin(ang * 13 + 0.4)
    inside = np.clip(edge - r, 0, 1)
    rim = np.exp(-((r - (s / 2 - 9)) ** 2) / 3.5)                       # the raised ring
    lit = np.clip(0.5 - (dx + dy) / (s * 0.9), 0, 1)
    v = 0.35 + 0.45 * lit + 0.25 * rim * np.clip(-(dx + dy) / (r + 1), -1, 1)
    v = np.clip(v, 0, 1)
    img_v = v.copy()
    # the emblem, pressed in: drawn as a mask, shaded as a hollow (dark at the top left, light at the bottom right)
    em = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(em)
    c = s / 2
    if emblem == "tankard":
        d.rectangle([c - 7, c - 7, c + 4, c + 9], fill=255)
        d.rectangle([c - 8, c - 9, c + 5, c - 6], fill=255)
        d.arc([c + 1, c - 4, c + 11, c + 6], -90, 90, fill=255, width=3)
        d.rectangle([c - 5, c - 5, c + 2, c + 7], fill=0)
        for k in range(3):
            d.line([c - 4 + k * 3, c - 3, c - 4 + k * 3, c + 6], fill=255, width=1)
    elif emblem == "Z":
        f = ImageFont.truetype(SC_BOLD, 24)
        d.text((c, c + 1), "Z", font=f, fill=255, anchor="mm")
        d.polygon([(c - 9, c - 13), (c - 6, c - 17), (c - 3, c - 13), (c, c - 18), (c + 3, c - 13), (c + 6, c - 17), (c + 9, c - 13)], fill=255)
    elif emblem == "leaf":
        d.ellipse([c - 5, c - 10, c + 5, c + 9], fill=255)
        d.line([c, c - 9, c, c + 11], fill=0, width=1)
        for k in range(-6, 8, 4):
            d.line([c, c + k, c - 4, c + k - 3], fill=0, width=1)
            d.line([c, c + k, c + 4, c + k - 3], fill=0, width=1)
    ema = np.asarray(em, dtype=np.float32) / 255
    sh_dark = np.roll(np.roll(ema, 1, 0), 1, 1) - ema
    sh_lit = np.roll(np.roll(ema, -1, 0), -1, 1) - ema
    img_v = img_v * (1 - 0.18 * ema) - 0.28 * np.clip(-sh_dark, 0, 1) * 0 + 0.0
    img_v = img_v - 0.3 * np.clip(sh_lit, 0, 1) + 0.3 * np.clip(sh_dark, 0, 1)
    img_v = np.clip(img_v, 0, 1)
    rgb = ramp_map(img_v, ramp, dither=False)
    spec = np.exp(-(((dx + s * 0.18) ** 2 + (dy + s * 0.2) ** 2) / (s * 0.12) ** 2)) * 0.5
    rgb = rgb + (255 - rgb) * spec[..., None] * 0.6
    out = np.zeros((s, s, 4), np.float32)
    out[..., :3] = rgb
    out[..., 3] = inside * 255
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def coin(s):
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    c = s / 2 - 0.5
    dx, dy = xx - c, yy - c
    r = np.sqrt(dx ** 2 + dy ** 2)
    R = s / 2 - 1
    inside = np.clip(R + 0.5 - r, 0, 1)
    rim = (r > R - 2.2).astype(np.float32)
    lit = np.clip(0.55 - (dx + dy) / (s * 0.9), 0, 1)
    v = 0.3 + 0.55 * lit
    v = np.where(rim > 0, v * 0.8 + 0.1 * np.clip(-(dx + dy) / (r + 1), -1, 1), v)
    ramp = ["#4a2e05", "#6e470a", "#946310", "#b98018", "#d9a124", "#f0c040", "#ffe27a", "#fff3c0"]
    rgb = ramp_map(np.clip(v, 0, 1), ramp, dither=False)
    img = Image.fromarray(np.dstack([rgb, inside * 255]).astype(np.uint8), "RGBA")
    d = ImageDraw.Draw(img)
    if s >= 24:
        f = ImageFont.truetype(SC_BOLD, int(s * 0.55))
        d.text((c + 1.5, c + 1.5), "G", font=f, fill=(120, 76, 8, 255), anchor="mm")
        d.text((c + 0.5, c + 0.5), "G", font=f, fill=(255, 226, 122, 255), anchor="mm")
    else:
        d.ellipse([c - 3, c - 3, c + 3, c + 3], outline=(150, 100, 20, 255))
    return img


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    back = make_back()
    back.save(os.path.join(OUT, "QuestBoard_Back.png"), optimize=True)
    make_paper().save(os.path.join(OUT, "QuestBoard_Paper.png"), optimize=True)
    make_parts().save(os.path.join(OUT, "QuestBoard_Parts.png"), optimize=True)
    for n in ("QuestBoard_Back.png", "QuestBoard_Paper.png", "QuestBoard_Parts.png"):
        print(n, os.path.getsize(os.path.join(OUT, n)))
