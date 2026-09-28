"""Measurements of the S1 tiles vs Winlu (printed + saved as JSON in the scratch folder).
  colours per 48x48 tile, mean luma gradient / share of hard steps (>24 luma) / p90 gradient,
  histogram distance (8^3 RGB bins, chi-square/2: 0 same .. 1 disjoint) to the matching Winlu tile,
  Lab mean/std, and for the overlays: share of semi-transparent pixels, alpha levels and edge-ramp width."""
import json
import numpy as np
from PIL import Image
from common import *

S = a2()
N = Image.open(OUT_SHEET).convert("RGBA")
grass = body_tile(16, S)


def over_grass(tile):
    t = grass.copy()
    t.alpha_composite(tile)
    return t


def ramp_width(blk):
    """Mean length (px) of the semi-transparent run (8 < alpha < 247) met when walking from the transparent
    outside into the island (rows and columns of the 96x96 island that cross it)."""
    a = np.asarray(blk)[48:144, :, 3].astype(int)
    full = int(a.max() * 0.97)            # Winlu's k46 is at most 236 (92 %) - 'inside' is relative to the block's own top
    runs = []
    for line in list(a) + list(a.T):
        inside = np.where(line >= full)[0]
        if len(inside) == 0:
            continue
        first = inside[0]
        part = np.where((line[:first] > 8) & (line[:first] < full))[0]
        if len(part):
            runs.append(len(part))
    return float(np.mean(runs)) if runs else 0.0


def row(name, im, ref):
    g = gradient_stats(im)
    m, s = lab_stats(im)
    return {"name": name, "colours": round(colours_per_tile(im)), "mean_grad": round(g["mean_grad"], 2),
            "hard_steps_pct": round(g["hard_steps_pct"], 2), "p90_grad": round(g["p90_grad"], 1),
            "hist_dist_to_ref": round(hist_distance(im, ref[1]), 3), "ref": ref[0],
            "hist_dist_to_winlu_grass": round(hist_distance(im, grass), 3),
            "lab_mean": [round(float(v), 1) for v in m], "lab_std": [round(float(v), 1) for v in s]}


k24 = ("winlu k24 dirt", body_tile(24, S))
k26 = ("winlu k26 damp soil", S.crop((block_xy(26)[0] + 24, block_xy(26)[1] + 72, block_xy(26)[0] + 72, block_xy(26)[1] + 120)))
k46g = ("winlu k46 on grass", over_grass(body_tile(46, S)))
k39g = ("winlu k39 on grass", over_grass(body_tile(39, S)))
rows = [
    row("winlu k16 grass", grass, ("winlu k16 grass", grass)),
    row("winlu k24 dirt", k24[1], k24),
    row("winlu k26 damp soil", k26[1], k26),
    row("winlu k39 dirt ovl on grass", k39g[1], k39g),
    row("winlu k46 dark ovl on grass", k46g[1], k46g),
    row("S1 mud ground (k24 slot)", body_tile(24, N), k26),
    row("S1 mud ovl on grass (k39)", over_grass(body_tile(39, N)), k26),
    row("S1 forest ovl on grass (k46)", over_grass(body_tile(46, N)), k46g),
]
# the raw PixelLab images (crisp pixel art at their own size) - what the pipeline started from
for src in ("mud_a", "mud_b", "forest_a", "forest_b"):
    raw = Image.open(SCRATCH + "/gen/%s.png" % src).convert("RGBA").crop((48, 48, 144, 144))
    rows.append(row("raw PixelLab %s (1:1 crop)" % src, raw, k26 if src.startswith("mud") else k46g))
for r in rows:
    print("%-32s colours %4d  grad %5.2f  hard%% %5.2f  p90 %5.1f  hist->%-20s %.3f  hist->grass %.3f  Lab %s/%s" % (
        r["name"], r["colours"], r["mean_grad"], r["hard_steps_pct"], r["p90_grad"], r["ref"], r["hist_dist_to_ref"],
        r["hist_dist_to_winlu_grass"], r["lab_mean"], r["lab_std"]))
ov = []
for label, blk in (("winlu k39 dirt", block(39, S)), ("winlu k46 dark grass", block(46, S)),
                   ("S1 mud (k39)", block(39, N)), ("S1 forest (k46)", block(46, N))):
    a = alpha_stats(blk)
    ov.append({"name": label, **a, "edge_ramp_px": round(ramp_width(blk), 1)})
    print("%-22s semi-transparent %5.1f%%  alpha levels %3d  edge ramp %.1f px" % (label, a["partial_alpha_pct"], a["alpha_levels"], ramp_width(blk)))
json.dump({"tiles": rows, "overlays": ov}, open(SCRATCH + "/metrics_S1.json", "w"), indent=1)
