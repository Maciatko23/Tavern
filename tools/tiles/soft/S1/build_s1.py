"""Build the S1 test sheet img/tilesets/Soft_S1_A2.png = Winlu A2 (Fantasy_Outside_A2_2_green) with
  k39 (dirt overlay)       -> 'bloto' (wet mud) overlay
  k46 (dark-grass overlay) -> 'lesna sciolka' (forest floor) overlay
  k24 (plain dirt ground)  -> mud ground
plus previews, the MZ-table self-test and demo renders.

METHOD S1 ("generate big, then downscale"):
  1. PixelLab create_image_pro_flash, 192x192, no_background=false, style image = a 24x24 Winlu crop upscaled
     x2 (bicubic) and quantised to 48 colours (~2.4 KB base64: k26 damp soil for mud, k16 grass for the forest
     floor), style_options color_palette=false; prompts ask for a seamless soft painterly top-down texture.
     PixelLab snaps its output to a 2-3 px grid (i.e. it is a ~64-96 px pixel-art image drawn at 192).
     Sources used (in ./gen): mud_a (lumpy mud, glints, footprints; seed 11), mud_b (fine mud with wet streaks;
     seed 31), forest_a (moss + rusty needles; seed 21), forest_b (smooth moss + scattered needles; seed 41).
  2. texture.soft_mix: each source downscaled 192 -> 96 (box to 192, Lanczos to 96: the pixel grid melts into
     gradients), cut to a 60x60 window whose opposite borders agree best and cross-faded (variance-preserving)
     into a 48-periodic tile; two sources mixed (the second turned 90 degrees so no direction dominates);
     low frequencies damped and the mid-frequency spectrum evened out (the 48 px repeat stops reading as a
     lattice); CIE-Lab mean/std transfer to Winlu-derived targets; 0.35 px wrap-around Gaussian + a faint grain;
     mud gets soft cool wet glints on its own bumps (add_sheen).
  3. a2soft: soft overlay edges drawn by a per-quarter field (see a2soft.py) - alpha 0 at the cell border,
     ~14-16 px ramp, Winlu-like cut outer corners / filled inner corners, warped periodic noise, darker rim.
Settings: s1_cfg.json next to this file (the defaults below are the same final values).

usage: python build_s1.py [--no-sheet]
"""
import os, sys, json, random
import numpy as np
from PIL import Image, ImageDraw
from common import *
from texture import add_sheen, soft_tile, soft_mix, tile_preview, lab_transfer, blur_wrap, flatten_low
import a2soft

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = {
    "mud": {
        "src": [["gen/mud_a.png", 0.6, 0], ["gen/mud_b.png", 0.4, 1]], "down": 96, "method": "area+lanczos",
        "flatten": (6.0, 0.3), "even": (14, 0.8), "target": ((37.0, 2.2, 12.5), (3.0, 1.0, 2.0)),
        "blur": 0.35, "grain": 1.0, "seed": 5, "sheen": {"amount": 16, "share": 0.03, "sigma": 0.8, "follow": 0.6},
    },
    "forest": {
        "src": [["gen/forest_a.png", 0.6, 0], ["gen/forest_b.png", 0.4, 1]], "down": 96, "method": "area+lanczos",
        "flatten": (6.0, 0.3), "even": (14, 0.8), "target": ((40.0, -10.0, 19.0), (3.4, 4.2, 3.2)),
        "blur": 0.35, "grain": 1.0, "seed": 6,
    },
}
FIELD = {
    "mud": dict(amp=1.0, sigma=7, warp=4, lo=-1.02, hi=0.3, detail=0.1, bulge=-0.4, seed=7, n_clip=0.7, corner_k=1.0),
    "forest": dict(amp=1.0, sigma=7, warp=4, lo=-1.04, hi=0.45, detail=0.1, bulge=-0.3, seed=9, n_clip=0.7, corner_k=0.6),
}
DRAW = {
    "mud": dict(body_alpha=255, rim=0.22, rim_at=-0.8, rim_w=0.25, rim_tint=(18, 12, 6)),
    "forest": dict(body_alpha=250, rim=0.12, rim_at=-0.7, rim_w=0.35, rim_tint=(10, 22, 10)),
}


def src_path(p):
    """A source image: next to this script (./gen) first, else in the scratch folder."""
    for base in (HERE, SCRATCH):
        q = os.path.join(base, p)
        if os.path.exists(q):
            return q
    raise FileNotFoundError(p)


def load_cfg():
    for p in (os.path.join(HERE, "s1_cfg.json"), os.path.join(WORK, "s1_cfg.json")):
        if os.path.exists(p):
            over = json.load(open(p, encoding="utf8"))
            for sec, d in (("tex", CFG), ("field", FIELD), ("draw", DRAW)):
                for k, v in over.get(sec, {}).items():
                    d[k].update(v)


def make_textures():
    tex = {}
    for name, c in CFG.items():
        if isinstance(c["src"], list):     # a mix of several generated images: [[path, weight, quarter-turns], ...]
            srcs = [(Image.open(src_path(p)).convert("RGB"), w, r) for p, w, r in c["src"]]
            t, info = soft_mix(srcs, down=c["down"], method=c["method"], target=c["target"], blur=c["blur"],
                               grain_amt=c["grain"], seed=c["seed"], flatten=tuple(c["flatten"]) if c.get("flatten") else None,
                               even=tuple(c["even"]) if c.get("even") else None)
            if c.get("sheen"):
                t = add_sheen(t, **c["sheen"])
            tex[name] = t
            Image.fromarray(t).save(os.path.join(WORK, "tex_%s.png" % name))
            print("texture %-6s from %s: %s" % (name, c["src"], info))
            continue
        img = Image.open(src_path(c["src"])).convert("RGB")
        t, info = soft_tile(img, down=c["down"], method=c["method"], target=c["target"], blur=c["blur"],
                            grain_amt=c["grain"], seed=c["seed"], flatten=tuple(c["flatten"]) if c.get("flatten") else None,
                            window=tuple(c["window"]) if c.get("window") else None)
        tex[name] = t
        Image.fromarray(t).save(os.path.join(WORK, "tex_%s.png" % name))
        print("texture %-6s from %s: %s" % (name, c["src"], info))
    return tex


def blocks(tex):
    out = {}
    for name in ("mud", "forest"):
        f = a2soft.SoftField(**FIELD[name])
        out[name] = (f, a2soft.build_overlay(f, tex[name], **DRAW[name]))
    out["mud_ground"] = (None, a2soft.build_ground(tex["mud"]))
    return out


def make_sheet(bl, path):
    sheet = a2()
    for kind, key in ((39, "mud"), (46, "forest"), (24, "mud_ground")):
        x, y = block_xy(kind)
        sheet.paste(Image.new("RGBA", (96, 144)), (x, y))
        sheet.paste(bl[key][1], (x, y))
    sheet.save(path)
    return sheet


def demo_map(sheet_blocks, grass):
    """A small map: grass everywhere, a mud road + puddle-like blobs (k39 slot) and forest-floor patches (k46)."""
    table = a2soft.W.mz_table()
    Wd, H = 18, 10
    rnd = random.Random(4)
    mud = [[False] * Wd for _ in range(H)]
    ff = [[False] * Wd for _ in range(H)]
    for x in range(Wd):                      # a winding road
        yc = 4 + int(round(1.5 * np.sin(x / 3.0)))
        for y in (yc, yc + 1):
            mud[y][x] = True
    for (x, y) in ((3, 8), (14, 1), (15, 1)):
        mud[y][x] = True
    for (x0, y0, w, h) in ((0, 0, 5, 3), (9, 7, 6, 3), (12, 0, 2, 2)):
        for y in range(y0, min(H, y0 + h)):
            for x in range(x0, min(Wd, x0 + w)):
                if rnd.random() < 0.85:
                    ff[y][x] = True
    ff[5][16] = True
    base = sheet_blocks["grass"]
    img = a2soft.W.render_mz(ff, sheet_blocks["forest"], base, table)
    # the second overlay: render with a transparent base and composite
    over = a2soft.W.render_mz(mud, sheet_blocks["mud"], Image.new("RGBA", (48, 48)), table)
    img.alpha_composite(over)
    return img


def main():
    load_cfg()
    tex = make_textures()
    bl = blocks(tex)
    for k, (f, b) in bl.items():
        b.save(os.path.join(WORK, "block_%s.png" % k))
        zoom(b, 4).save(os.path.join(WORK, "block_%s_x4.png" % k))
    S = a2()
    grass = body_tile(16, S)
    # self-test: MZ table drawing == global field drawing, for both overlays
    for name in ("mud", "forest"):
        d, _ = a2soft.self_test(bl[name][0], tex[name], grass, None, **DRAW[name])
        print("self-test %-6s: MZ table vs field over the whole map: %d pixels differ -> %s" % (name, d, "PASS" if d == 0 else "FAIL"))
    if "--no-sheet" not in sys.argv:
        make_sheet(bl, OUT_SHEET)
        print("sheet ->", OUT_SHEET)
    new = demo_map({"grass": grass, "mud": bl["mud"][1], "forest": bl["forest"][1]}, grass)
    old = demo_map({"grass": grass, "mud": block(39, S), "forest": block(46, S)}, grass)
    both = Image.new("RGBA", (new.size[0], new.size[1] * 2 + 8), (20, 20, 20, 255))
    both.paste(old, (0, 0)); both.paste(new, (0, new.size[1] + 8))
    both.save(os.path.join(WORK, "demo_old_new.png"))
    zoom(new.crop((0, 96, 432, 336)), 3).save(os.path.join(WORK, "demo_new_x3.png"))


if __name__ == "__main__":
    main()
