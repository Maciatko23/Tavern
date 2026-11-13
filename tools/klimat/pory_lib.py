# -*- coding: utf-8 -*-
"""Kolory pór roku dla zieleni Winlu (tools/klimat/pory_roku.py): przekształcenie piksel -> piksel (czysta funkcja koloru, więc
autokafle zostają bez szwów). Zieleń = odcień 50-175°, nasycenie >= 0.15. Lato = oryginał."""
import numpy as np

def hsv(a):
    rgb = a[..., :3].astype(np.float32) / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1); d = mx - mn
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.zeros_like(mx)
    m = d > 1e-6
    hr = ((g - b) / np.where(m, d, 1)) % 6; hg = (b - r) / np.where(m, d, 1) + 2; hb = (r - g) / np.where(m, d, 1) + 4
    h = np.where(mx == r, hr, np.where(mx == g, hg, hb)) * 60.0
    h = np.where(m, h, 0)
    s = np.where(mx > 1e-6, d / np.where(mx > 1e-6, mx, 1), 0)
    return h, s, mx

def rgb_of(h, s, v):
    h = (h % 360) / 60.0
    i = np.floor(h).astype(int) % 6; f = h - np.floor(h)
    p = v * (1 - s); q = v * (1 - s * f); t = v * (1 - s * (1 - f))
    r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
    return np.stack([r, g, b], -1)

def veg_mask(a, smin=0.15):
    h, s, v = hsv(a)
    g = a[..., 1].astype(np.int32); rb = np.maximum(a[..., 0], a[..., 2]).astype(np.int32)
    # green, and green the strongest channel (a grey-green stone or a beige cobble is not grass)
    return (a[..., 3] > 0) & (h >= 62) & (h <= 175) & (s >= smin) & (v >= 0.06) & (g - rb >= 6), h, s, v

def winterize(a, mask):
    """any colour (the author's orange / pink crowns): dull, dark - for winter (like the leafy crowns' winter)"""
    out = a.copy(); h, s, v = hsv(a)
    rgb = rgb_of(h * 0 + 70, np.clip(s * 0.22, 0, 1), np.clip(v * 0.66 + 0.02, 0, 1))
    new = np.clip(np.round(rgb * 255), 0, 255).astype(np.uint8)
    out[..., :3] = np.where(mask[..., None], new, out[..., :3])
    return out

def recolour(a, season, kind="grass", tone=0, mask=None):
    """a: HxWx4 uint8; season 0 spring, 2 autumn, 3 winter; kind grass | leaves | conifer; tone: autumn leaves 0 gold, 1 orange, 2 rust.
    mask: extra bool mask (only these pixels). Returns a new array."""
    out = a.copy()
    m, h, s, v = veg_mask(a)
    if mask is not None: m &= mask
    if not m.any(): return out
    y = np.clip((112.0 - h) / 45.0, -1, 1)          # yellower greens +, bluer greens -
    if season == 0:                                  # spring: fresh, lighter, yellower green
        H = h - 9 * (kind != "conifer"); S = np.clip(s * 1.08, 0, 1); V = np.clip(v * 1.07 + 0.025, 0, 1)
    elif season == 2:
        if kind == "grass":                          # dry olive-ochre grass, rusty where it was yellow-green, browner in the shade
            # (2026-11-09: the first one was an even ochre - flat) the light grass golden-ochre, the shade and the darker grass olive
            # green (autumn grass is not dead yet): the meadow's own light/dark patches read as two colours
            H = 44 - 14 * y + 62 * np.clip(0.46 - v, 0, 0.32); S = np.clip(s * 0.78 + 0.1, 0, 0.64); V = np.clip(v * 0.97 + 0.015, 0, 1)
        elif kind == "foliage":                      # tile bushes / hedges / ivy: gold in the light, orange-rust in the shade
            H = 40 - 10 * y - 40 * np.clip(0.5 - v, 0, 0.35); S = np.clip(s * 0.6 + 0.42, 0, 0.88); V = np.clip(v * 1.02 + 0.02, 0, 1)
        elif kind == "conifer":
            H, S, V = h, s, v
        else:
            base = [46, 30, 14][tone]; sat = [0.80, 0.82, 0.74][tone]
            H = base - 8 * y; S = np.clip(s * 0.55 + sat * 0.55, 0, 0.92); V = np.clip(v * 1.02 + 0.03, 0, 1)
    elif season == 3:                                # winter: grass pale and dull; crowns dark and dull (conifers stay green, darker)
        if kind == "conifer":
            H = h; S = np.clip(s * 0.82, 0, 1); V = np.clip(v * 0.86, 0, 1)
        elif kind == "grass":
            H = h * 0.6 + 100 * 0.4; S = np.clip(s * 0.32, 0, 1); V = np.clip(v * 0.92 + 0.05, 0, 1)
        else:
            H = h * 0.5 + 75 * 0.5; S = np.clip(s * 0.38, 0, 1); V = np.clip(v * 0.74 + 0.02, 0, 1)
    else:
        return out
    rgb = rgb_of(H, S, V)
    if season == 3 and kind == "grass":              # frost: a pale cool film
        rgb = rgb * 0.86 + np.array([0.80, 0.84, 0.86]) * 0.14
    new = np.clip(np.round(rgb * 255), 0, 255).astype(np.uint8)
    out[..., :3] = np.where(m[..., None], new, out[..., :3])
    return out
