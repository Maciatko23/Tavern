"""Study the Winlu A2 blocks the test replaces (k39 dirt overlay, k46 dark-grass overlay, k24 plain dirt, k16 grass).
Writes x4 zooms and prints the measurements used as targets."""
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, __file__.rsplit("\\", 1)[0].rsplit("/", 1)[0])
from common import *

S = a2()
for k in (16, 17, 21, 24, 27, 39, 46):
    b = block(k, S)
    zoom(b, 4).save(WORK + "/winlu_k%d_x4.png" % k)
    bt = body_tile(k, S)
    g = gradient_stats(bt)
    print("k%d body: colours %d  mean_grad %.2f  hard%% %.2f  p90 %.1f  lab mean %s std %s  alpha %s" % (
        k, colours_per_tile(bt), g["mean_grad"], g["hard_steps_pct"], g["p90_grad"],
        np.round(lab_stats(bt)[0], 1), np.round(lab_stats(bt)[1], 1), alpha_stats(b)))

# overlays over grass: composite onto k16 grass to see them as in the game
grass = block(16, S)
for k in (39, 46, 21):
    b = block(k, S)
    base = Image.new("RGBA", b.size)
    # tile the grass body under
    gt = body_tile(16, S)
    for y in range(0, 144, 48):
        for x in range(0, 96, 48):
            base.paste(gt, (x, y))
    base.alpha_composite(b)
    zoom(base, 4).save(WORK + "/winlu_k%d_on_grass_x4.png" % k)
# alpha channel map of the overlays
for k in (39, 46):
    a = np.asarray(block(k, S))[..., 3]
    zoom(Image.fromarray(a), 4).save(WORK + "/winlu_k%d_alpha_x4.png" % k)
    print("k%d alpha levels:" % k, np.unique(a)[:40], "...", len(np.unique(a)))
