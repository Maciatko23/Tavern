# -*- coding: utf-8 -*-
"""Approach A: restyle the Winlu building sheets toward the Fantastic Buildings pack. Colour -> colour only (no resampling):
per-material luminance-quantile mapping onto ramps measured from the pack sheets, plus a clean 1 px dark-brown edge on transparent sheets."""
import os, sys, json, colorsys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
PACK = r"C:\Program Files (x86)\Steam\steamapps\common\RPG Maker MZ\dlc\Fantastic Buildings - Medieval\Tilesets"
OUT = os.path.join(HERE, "staging")
def hsv(a):  # a float RGB (...,3) 0..1
    mx = a.max(-1); mn = a.min(-1); d = mx - mn
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.zeros_like(mx)
    m = d > 1e-6
    rc = m & (mx == r); gc = m & (mx == g) & ~rc; bc = m & ~rc & ~gc
    h[rc] = ((g - b)[rc] / d[rc]) % 6; h[gc] = (b - r)[gc] / d[gc] + 2; h[bc] = (r - g)[bc] / d[bc] + 4
    return h * 60, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx
def luma(a): return a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
def classify(a, y_ok=True):
    h, s, v = hsv(a)
    warm = ((h <= 36) | (h >= 340)) & (s >= 0.30) & (v > 0.07)
    glow = (h > 36) & (h < 70) & (s > 0.5) & (v > 0.75)          # lamps, lit windows
    other = (s >= 0.22) & ~warm & (v > 0.07) & ((h >= 70) & (h < 335))  # greens, blues, reds of flowers handled by hue
    dkblue = other & (h >= 180) & (h < 275) & (v < 0.55)
    other = other & ~dkblue
    neutral = ~warm & ~glow & ~other
    # yellowish low-sat (h 36-70, s .22-.5): wood/straw tones -> warm too
    yel = (h > 36) & (h <= 70) & (s >= 0.34) & ~glow
    warm = warm | yel; other &= ~yel
    return warm, neutral, glow, other
def load_pack_ramps(nb=48):
    ys = {"warm": [], "neutral": []}
    for f in sorted(os.listdir(PACK)):
        im = np.array(Image.open(os.path.join(PACK, f)).convert("RGBA")).astype(float)
        a = im[..., :3] / 255; al = im[..., 3] > 250
        warm, neu, glow, oth = classify(a)
        hh = hsv(a)[0]; warm = warm & ((hh <= 34) | (hh >= 340))
        # neutral in the pack: low saturation (stone, plaster); skip near-black outline mush only if v<.05
        ch = a.max(-1) - a.min(-1); neu = ((ch < 0.085) | ((a.max(-1) > 0.72) & (ch < 0.15))) & ~glow & ~warm
        for k, m in (("warm", warm & al), ("neutral", neu & al & ~warm)):
            ys[k].append(a[m])
    ramps = {}
    for k, l in ys.items():
        px = np.concatenate(l); y = luma(px); o = np.argsort(y, kind="stable"); px = px[o]
        bins = np.array_split(px, nb); ramps[k] = np.array([b.mean(0) for b in bins])
    return ramps
RAMPS = None
THATCH = None
def load_thatch(nb=48):
    im = np.array(Image.open(os.path.join(ROOT, "img", "tilesets", "Kruczogrod", "Proba_D.png")).convert("RGBA")).astype(float)
    px = []
    for x0, y0, x1, y1 in ((385, 10, 575, 120), (385, 290, 700, 380), (580, 85, 768, 130)):
        r = im[y0:y1, x0:x1]; a = r[..., :3] / 255; h, sat, v = hsv(a)
        m = (r[..., 3] > 250) & (h > 30) & (h < 65) & (sat > 0.35); px.append(a[m])
    px = np.concatenate(px); px = px[np.argsort(luma(px), kind="stable")]
    return np.array([b.mean(0) for b in np.array_split(px, nb)])
def build_maps(sheets, slate_masks, thatch_masks={}):
    """sheets: name -> RGBA array. Returns per class sorted reference luminance so that source Y maps to quantile."""
    global RAMPS
    if RAMPS is None: RAMPS = load_pack_ramps()
    pops = {"warm": [], "neutral": [], "slate": [], "thatch": []}
    for n, im in sheets.items():
        a = im[..., :3] / 255; al = im[..., 3] > 250
        warm, neu, glow, oth = classify(a)
        sl = slate_masks.get(n)
        slate = (neu | (oth & (hsv(a)[0] > 140) & (hsv(a)[0] < 270))) & sl if sl is not None else np.zeros_like(neu)
        th = thatch_masks.get(n); th = th if th is not None else np.zeros_like(al)
        warm = warm & ~th; neu = neu & ~th
        pops["thatch"].append(luma(a[th & al]))
        pops["warm"].append(luma(a[warm & al])); pops["neutral"].append(luma(a[neu & al & ~slate])); pops["slate"].append(luma(a[slate & al]))
    return {k: np.sort(np.concatenate(v)) if v else np.zeros(1) for k, v in pops.items()}
def restyle(im, pops, slate=None, outline=True, darkness=0.72, thatch=None, tint=True):
    im = im.astype(float); a = im[..., :3] / 255; al = im[..., 3]
    warm, neu, glow, oth = classify(a)
    th = (thatch & (al > 250)) if thatch is not None else np.zeros_like(warm)
    warm = warm & ~th; neu = neu & ~th; oth = oth & ~th
    out = a.copy(); Y = luma(a); nb = len(RAMPS["warm"])
    def q(cls, m):
        p = pops[cls]; return np.searchsorted(p, Y[m], side="left") / max(len(p) - 1, 1)
    sl = ((neu | (oth & (hsv(a)[0] > 140) & (hsv(a)[0] < 270))) & slate) if slate is not None else np.zeros_like(neu)
    nn = neu & ~sl; oth = oth & ~sl
    for cls, ramp, m, scale in (("warm", "warm", warm, 1.0), ("neutral", "neutral", nn, 1.0), ("slate", "warm", sl, darkness)):
        if m.any():
            if cls == "neutral":
                ry = luma(RAMPS["neutral"]); idx = np.abs(ry[None, :] - (Y[m] * 0.97)[:, None]).argmin(1)
                col = RAMPS["neutral"][idx]; w = np.clip((Y[m] - 0.56) / 0.1, 0, 1)[:, None] * (0.95 if tint else 0.0)   # pale plaster -> warm cream like the pack's
                out[m] = np.clip(col * (1 + w * np.array([0.14, 0.07, -0.22])), 0, 1); continue
            else:
                idx = np.clip(((0.1 + 0.9 * q(cls, m) * scale if cls == "slate" else q(cls, m) ** 0.8) * (nb - 1)).round().astype(int), 0, nb - 1)
            out[m] = RAMPS[ramp][idx]
    global THATCH
    if th.any():
        if THATCH is None: THATCH = load_thatch()
        p = pops["thatch"]; qq = np.searchsorted(p, Y[th], side="left") / max(len(p) - 1, 1)
        out[th] = THATCH[np.clip((qq ** 0.9 * (len(THATCH) - 1)).round().astype(int), 0, len(THATCH) - 1)]
    # muted pack-like greens/blues: a little less saturated, a little darker
    h, s, v = hsv(a)
    mo = oth & ~sl
    if mo.any():
        g = np.where(mo[..., None], a, 0)
        gy = luma(a)[..., None]
        out[mo] = (gy[mo] + (a[mo] - gy[mo]) * 0.82) * 0.93
    res = np.dstack([np.clip(out, 0, 1) * 255, al]).round().astype(np.uint8)
    if outline:
        A = res[..., 3]; solid = A > 200; empty = A < 40
        pad = np.pad(empty, 1, constant_values=False)
        edge = solid & (pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:])
        # dark warm brown outline: blend 60% toward (38,26,20), only where the pixel is not already darker
        tgt = np.array([38, 26, 20.]); px = res[..., :3].astype(float)
        nu = px * 0.4 + tgt * 0.6; darker = luma(px / 255) * 255 > luma(nu / 255) * 255
        sel = edge & darker & ~glow
        res[..., :3][sel] = nu[sel].round().astype(np.uint8)
    return res
