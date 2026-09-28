"""Measurements of new tiles vs Winlu (method S2).
Per 48x48 tile (overlays composited over Winlu grass k16 first):
  colours      unique RGB colours
  Lstd         luminance standard deviation (0-255)             - overall contrast
  grad         mean |dL| between 4-neighbours (0-255)           - mean gradient / softness
  p95          95th percentile of |dL|                            - how hard the hardest steps are
  hard%        share of neighbour steps with |dL| > 24           - crisp-edge share
  gradEMD      earth mover's distance of the |dL| histogram to the Winlu reference tile (0-255 units)
  colChi2      chi-square distance of 8x8x8 RGB histograms to the Winlu reference (0 same .. 1 disjoint)
Edges of the overlays (on the 96x96 island): alpha levels, share of semi-transparent pixels, fade width.
usage: python metrics_s2.py NEW_SHEET [CRISP_SHEET]  -> prints a table, writes metrics.json next to SCR
"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import *
from PIL import Image


def grads(rgb, periodic=True):
    L = lum(rgb) * 255.0
    if periodic:
        dx = np.abs(np.roll(L, -1, 1) - L); dy = np.abs(np.roll(L, -1, 0) - L)
    else:
        dx = np.abs(np.diff(L, axis=1)); dy = np.abs(np.diff(L, axis=0))
    return np.concatenate([dx.ravel(), dy.ravel()]), L


def stats(rgb, periodic=True):
    g, L = grads(rgb, periodic)
    q = np.clip(np.round(rgb * 255), 0, 255).astype(int).reshape(-1, 3)
    return {
        "colours": int(len(np.unique(q, axis=0))),
        "Lstd": float(L.std()),
        "grad": float(g.mean()),
        "p95": float(np.percentile(g, 95)),
        "hard%": float((g > 24).mean() * 100),
        "_g": g, "_rgb": rgb,
    }


def grad_emd(g1, g2):
    bins = np.arange(0, 257, 1)
    h1 = np.histogram(g1, bins)[0].astype(float); h1 /= h1.sum()
    h2 = np.histogram(g2, bins)[0].astype(float); h2 /= h2.sum()
    return float(np.abs(np.cumsum(h1) - np.cumsum(h2)).sum())


def col_chi2(a, b, n=8):
    def h(x):
        q = np.clip((x.reshape(-1, 3) * n).astype(int), 0, n - 1)
        idx = q[:, 0] * n * n + q[:, 1] * n + q[:, 2]
        hh = np.bincount(idx, minlength=n ** 3).astype(float)
        return hh / hh.sum()
    p, r = h(a), h(b)
    m = (p + r) > 0
    return float(0.5 * (((p - r) ** 2)[m] / (p + r)[m]).sum())


_PAL = None


def winlu_palette():
    """All opaque colours of the green edition's A2, A5, B and D sheets (A1 left out as a baseline)."""
    global _PAL
    if _PAL is None:
        cols = []
        for f in ("Fantasy_Outside_A2_2_green.png", "Fantasy_Outside_A5_green.png", "Fantasy_Outside_B_green.png", "Fantasy_Outside_D_green.png"):
            a = np.asarray(Image.open(os.path.join(WDIR, f)).convert("RGBA")).reshape(-1, 4)
            cols.append(a[a[:, 3] == 255][:, :3])
        _PAL = np.unique(np.concatenate(cols), axis=0).astype(np.float32)
    return _PAL


def palette_dist(rgb):
    """Per pixel: RGB distance (0-255 units) to the nearest Winlu colour; returns mean and p95."""
    pal = winlu_palette()
    px = np.unique(np.round(rgb.reshape(-1, 3) * 255).astype(np.float32), axis=0, return_inverse=True)
    u, inv = px
    best = np.full(len(u), 1e9, np.float32)
    for i in range(0, len(pal), 4096):
        c = pal[i:i + 4096]
        d = ((u[:, None, :] - c[None, :, :]) ** 2).sum(-1)
        best = np.minimum(best, d.min(1))
    d = np.sqrt(best)[inv.ravel()]
    return float(d.mean()), float(np.percentile(d, 95))


def over_grass(sheet, win, k, region="body"):
    g = block(win, 16)[:48, :48].copy()
    b = block(sheet, k)
    t = b[72:120, 24:72] if region == "body" else b[:48, :48]
    return over(g, t)[..., :3]


def alpha_edge(blk):
    a = blk[48:, :, 3]
    semi = (a > 0.02) & (a < 0.98)
    levels = len(np.unique(np.round(a * 255)))
    # fade width: along the 4 middle scanlines from the island border inward, px from alpha 0.1 to 0.9
    widths = []
    for line in (a[48, :], a[:, 48], a[47, ::-1], a[::-1, 47]):
        try:
            i1 = int(np.argmax(line > 0.1)); i9 = int(np.argmax(line > 0.9))
            if line.max() > 0.9:
                widths.append(i9 - i1)
        except Exception:
            pass
    return {"alpha_levels": levels, "semi%": float(semi.mean() * 100), "fade_px": float(np.mean(widths)) if widths else None}


def main():
    new = load(sys.argv[1])
    crisp = load(sys.argv[2]) if len(sys.argv) > 2 else None
    win = load(A2)
    rows = []
    # references
    W = {
        "Winlu grass k16": stats(block(win, 16)[:48, :48, :3]),
        "Winlu grass k27": stats(block(win, 27)[:48, :48, :3]),
        "Winlu dirt k24": stats(block(win, 24)[:48, :48, :3]),
        "Winlu dirt k39 body/grass": stats(over_grass(win, win, 39)),
        "Winlu dark k46 body/grass": stats(over_grass(win, win, 46)),
        "Winlu dark-dirt k26 body": stats(block(win, 26)[72:120, 24:72, :3]),
    }
    N = {
        "NEW mud k24": (stats(block(new, 24)[:48, :48, :3]), "Winlu dirt k24"),
        "NEW mud k39 body/grass": (stats(over_grass(new, win, 39)), "Winlu dirt k39 body/grass"),
        "NEW forest k46 body/grass": (stats(over_grass(new, win, 46)), "Winlu dark k46 body/grass"),
    }
    if crisp is not None:
        N["CRISP pilot A k24 dirt"] = (stats(block(crisp, 24)[:48, :48, :3]), "Winlu dirt k24")
        N["CRISP pilot A k16 grass"] = (stats(block(crisp, 16)[:48, :48, :3]), "Winlu grass k16")
    hdr = "%-28s %7s %6s %6s %6s %6s %8s %8s  %s" % ("tile", "colours", "Lstd", "grad", "p95", "hard%", "gradEMD", "colChi2", "vs")
    print(hdr); print("-" * len(hdr))
    out = {}
    for name, s in W.items():
        e = grad_emd(s["_g"], W["Winlu grass k16"]["_g"])
        c = col_chi2(s["_rgb"], W["Winlu grass k16"]["_rgb"])
        print("%-28s %7d %6.1f %6.2f %6.1f %6.2f %8.2f %8.3f  %s" % (name, s["colours"], s["Lstd"], s["grad"], s["p95"], s["hard%"], e, c, "Winlu grass k16"))
        out[name] = {k: v for k, v in s.items() if not k.startswith("_")}
        out[name].update({"gradEMD_vs_grass": e, "colChi2_vs_grass": c})
    print("-" * len(hdr))
    for name, (s, ref) in N.items():
        r = W[ref]
        e = grad_emd(s["_g"], r["_g"]); c = col_chi2(s["_rgb"], r["_rgb"])
        eg = grad_emd(s["_g"], W["Winlu grass k16"]["_g"])
        print("%-28s %7d %6.1f %6.2f %6.1f %6.2f %8.2f %8.3f  %s   (gradEMD vs Winlu grass %.2f)" % (name, s["colours"], s["Lstd"], s["grad"], s["p95"], s["hard%"], e, c, ref, eg))
        out[name] = {k: v for k, v in s.items() if not k.startswith("_")}
        out[name].update({"ref": ref, "gradEMD": e, "colChi2": c, "gradEMD_vs_grass": eg})
    print()
    print("distance to the nearest colour of Winlu's own palette (A2+A5+B+D, %d colours), RGB units:" % len(winlu_palette()))
    a1 = load(os.path.join(WDIR, "Fantasy_Outside_A1_green.png"))
    base = {"baseline: Winlu A1 swamp water": a1[350:398, 404:452, :3], "baseline: Winlu A1 lake water": a1[370:418, 20:68, :3]}
    for name, (s, ref) in N.items():
        base[name] = s["_rgb"]
    for name, rgb in base.items():
        m, p = palette_dist(rgb)
        print("  %-34s mean %5.2f  p95 %5.2f" % (name, m, p))
        out.setdefault(name, {})["palette_dist"] = [m, p]
    print()
    print("overlay edges (96x96 island):")
    for name, sh, k in (("Winlu k39 dirt", win, 39), ("NEW k39 mud", new, 39), ("Winlu k46 dark grass", win, 46), ("NEW k46 forest", new, 46)):
        e = alpha_edge(block(sh, k))
        print("  %-22s alpha levels %3d  semi-transparent %5.1f%%  fade 0.1->0.9 = %s px" % (name, e["alpha_levels"], e["semi%"], "%.1f" % e["fade_px"] if e["fade_px"] is not None else "n/a (never reaches 0.9)"))
        out["edge " + name] = e
    # the sheet differs from Winlu only in the 3 blocks
    diff = np.abs(new - win).sum(-1) > 1e-6
    changed = sorted({int(16 + (x // 96) + 8 * (y // 144)) for y, x in np.argwhere(diff)})
    print("\nchanged kinds vs Winlu A2:", changed)
    out["changed_kinds"] = changed
    json.dump(out, open(os.path.join(SCR, "metrics.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
