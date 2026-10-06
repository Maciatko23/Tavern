# python tools/underground/make_props.py -> img/characters/!Underground_Props.png
# Small floor things for the underground, cut out of the Winlu Fantasy INTERIOR Remaster D sheet (the same painter and look as
# the dungeon set, which has no papers or loose coins): an "!" sheet of 48x48 frames (12 x 8), index 0 only.
#   direction 2: papers | a scroll | an open book        direction 4: old coins (three heaps)
#   direction 6: a quill and paper | loose pages | a page  direction 8: a skull | a stack of scrolls | pages
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "tilesets", "Fantasy_Inside_D.png")
OUT = os.path.join(ROOT, "img", "characters", "!Underground_Props.png")
FRAMES = {2: [(13, 9), (6, 13), (6, 11)], 4: [(4, 15), (6, 15), (3, 15)], 6: [(2, 13), (14, 9), (10, 9)], 8: [(5, 13), (7, 14), (9, 9)]}

def main():
    src = Image.open(SRC).convert("RGBA")
    out = Image.new("RGBA", (576, 384), (0, 0, 0, 0))
    for d, cells in FRAMES.items():
        row = (d - 2) // 2
        for p, (c, r) in enumerate(cells):
            out.alpha_composite(src.crop((c * 48, r * 48, c * 48 + 48, r * 48 + 48)), (p * 48, row * 48))
    out.save(OUT)
    print("wrote", OUT)

if __name__ == "__main__":
    main()


# ---- the guardian of the tenth gate: the knight statue of the Winlu Interior set (!Statue index 0) as an empty suit of dark
# iron on its pedestal -> img/characters/!$Ug_Guardian.png (one character, 48x144 frames):
#   direction 2: asleep | the eye slit glowing | glowing brighter      direction 4: the sword raised (to strike), glowing
#   direction 6: spent (the fire in the helmet out, darker)            direction 8: = direction 2 (unused)
STATUE = os.path.join(ROOT, "img", "characters", "!Statue.png")
GUARD_OUT = os.path.join(ROOT, "img", "characters", "!$Ug_Guardian.png")


def iron(fr, dark=1.0):
    px = fr.load()
    for y in range(fr.height):
        for x in range(fr.width):
            r, g, b, a = px[x, y]
            if not a: continue
            L = (r * 0.3 + g * 0.59 + b * 0.11)
            if a < 200:                      # (the pedestal's soft shadow stays a shadow)
                px[x, y] = (0, 0, 0, a); continue
            k = 0.62 * dark
            px[x, y] = (int(min(255, L * k + 8)), int(min(255, L * (k + 0.02) + 9)), int(min(255, L * (k + 0.1) + 14)), a)
    return fr


def glow(fr, strength):
    """the eye slit of the helmet lit from inside (dark pixels in the visor box turn to embers) and a faint halo"""
    from PIL import ImageFilter
    px = fr.load()
    halo = Image.new("RGBA", fr.size, (0, 0, 0, 0))
    hp = halo.load()
    for y in range(21, 25):
        for x in range(16, 33):
            r, g, b, a = px[x, y]
            if a and (r + g + b) < 132:
                c = (255, int(120 + 80 * strength), int(40 * strength), 255)
                px[x, y] = c
                hp[x, y] = (255, 150, 60, int(150 * strength))
    halo = halo.filter(ImageFilter.GaussianBlur(2.2))
    out = Image.new("RGBA", fr.size, (0, 0, 0, 0))
    out.alpha_composite(halo)
    out.alpha_composite(fr)
    return out


def guardian():
    st = Image.open(STATUE).convert("RGBA")
    stand = st.crop((48, 0, 96, 144))           # index 0, direction 2, pattern 1 (the sword point-down)
    raise_ = st.crop((48, 288, 96, 432))        # index 0, direction 6, pattern 1 (the sword up)
    out = Image.new("RGBA", (144, 576), (0, 0, 0, 0))
    a = iron(stand.copy())
    rows = {
        0: [a, glow(iron(stand.copy()), 0.7), glow(iron(stand.copy()), 1.0)],
        1: [glow(iron(raise_.copy()), 1.0)] * 3,
        2: [iron(stand.copy(), 0.8)] * 3,
        3: [a] * 3,
    }
    for r, frames in rows.items():
        for p, f in enumerate(frames):
            out.alpha_composite(f, (p * 48, r * 144))
    out.save(GUARD_OUT)
    print("wrote", GUARD_OUT)


if __name__ == "__main__":
    guardian()


# ---- the deeper bands (2026-10-06): pictures made with PixelLab in the Winlu look (sources in tools/underground/art/, as they came)
#   !Ug_Reliefs      three carved panels for the walls of band 4 (index 0: two kneeling before the light, 1: one lying, one pouring
#                    water into a bowl, 2: one standing alone among the faceless) - 96x96 frames, the panel in every frame
#   !$Ug_Bell        the stone bell of the Heart's door (the signal lock): 96x96, standing on the frame's foot
#   !$Ug_SongStone   the stone of empty verses (the song lock): 48x96
#   !$Ug_Heart       the Heart of the fortress, deliberately without a shape (STORY.md leaves its form open): a light that
#                    breathes - 96x96, three frames (walk the pattern with step animation), drawn here, not by PixelLab
# and two sheets of the Winlu Dungeon set copied into img/characters: !Decoration2_blue (blue flames), !wagon (the diggers' carts)
ART = os.path.join(HERE, "art")
CHARS = os.path.join(ROOT, "img", "characters")
DUNGEON_CHARS = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Dungeon", "characters")


def _fit(img, w, h, bottom=2):
    """the picture's content put in a w x h frame: centred, its foot `bottom` px over the frame's bottom"""
    box = img.getbbox()
    c = img.crop(box)
    fr = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fr.alpha_composite(c, ((w - c.width) // 2, h - bottom - c.height))
    return fr


def _single(frame, out):
    """a "$" sheet: the same frame in all 3 x 4 places"""
    w, h = frame.size
    sheet = Image.new("RGBA", (w * 3, h * 4), (0, 0, 0, 0))
    for r in range(4):
        for p in range(3): sheet.alpha_composite(frame, (p * w, r * h))
    sheet.save(out)
    print("wrote", out)


def reliefs():
    out = Image.new("RGBA", (96 * 12, 96 * 8), (0, 0, 0, 0))
    for i in range(3):
        src = Image.open(os.path.join(ART, "pixellab_relief%d.png" % i)).convert("RGBA")
        fr = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        c = src.crop(src.getbbox())
        fr.alpha_composite(c, ((96 - c.width) // 2, (96 - c.height) // 2))
        bx, by = (i % 4) * 3, (i // 4) * 4
        for r in range(4):
            for p in range(3): out.alpha_composite(fr, ((bx + p) * 96, (by + r) * 96))
    path = os.path.join(CHARS, "!Ug_Reliefs.png")
    out.save(path)
    print("wrote", path)


def heart():
    """a breathing light: a warm white core, a soft halo, thin rays - three frames, a little bigger each, alpha in steps (pixel look)"""
    import math
    frames = []
    for k, grow in enumerate((0.0, 0.5, 1.0)):
        fr = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        px = fr.load()
        cx, cy = 48, 40
        for y in range(96):
            for x in range(96):
                dx, dy = x - cx + 0.5, y - cy + 0.5
                d = math.hypot(dx, dy)
                core = 10 + grow * 1.5
                ang = math.atan2(dy, dx)
                ray = max(0.0, math.cos(ang * 6 + k * 0.35)) ** 14 * max(0.0, 1 - d / (42 + grow * 4))
                halo = max(0.0, 1 - d / (34 + grow * 3)) ** 1.6
                a = 1.0 if d < core else max(halo * 0.85, ray * 0.9)
                if d < core + 3: a = max(a, 0.9 - (d - core) * 0.2)
                a = round(a * 6) / 6                      # (steps, not a smooth blur)
                if a <= 0: continue
                warm = max(0.0, min(1.0, d / 30))
                r, g, b = 255, int(250 - 40 * warm), int(225 - 120 * warm)
                px[x, y] = (r, g, b, int(255 * min(1, a)))
        frames.append(fr)
    sheet = Image.new("RGBA", (96 * 3, 96 * 4), (0, 0, 0, 0))
    for r in range(4):
        for p, fr in enumerate(frames): sheet.alpha_composite(fr, (p * 96, r * 96))
    path = os.path.join(CHARS, "!$Ug_Heart.png")
    sheet.save(path)
    print("wrote", path)


def lock():
    """the raven's keyhole of the Heart's door (the key lock): the PixelLab plaque set on the front of a stone pedestal (Dungeon E)"""
    E = Image.open(os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Dungeon", "tilesets", "Fantasy_Dungeon_E.png")).convert("RGBA")
    post = E.crop((3 * 48, 12 * 48, 4 * 48, 14 * 48))
    plaque = Image.open(os.path.join(ART, "pixellab_lock.png")).convert("RGBA")
    plaque = plaque.crop(plaque.getbbox())
    post = post.crop(post.getbbox())
    fr = Image.new("RGBA", (48, 96), (0, 0, 0, 0))
    px, py = (48 - post.width) // 2, 96 - post.height
    fr.alpha_composite(post, (px, py))
    fr.alpha_composite(plaque, ((48 - plaque.width) // 2, py + 10))
    _single(fr, os.path.join(CHARS, "!$Ug_Lock.png"))


def deep():
    import shutil
    reliefs()
    lock()
    _single(_fit(Image.open(os.path.join(ART, "pixellab_bell.png")).convert("RGBA"), 96, 96, bottom=4), os.path.join(CHARS, "!$Ug_Bell.png"))
    _single(_fit(Image.open(os.path.join(ART, "pixellab_songstone.png")).convert("RGBA"), 48, 96, bottom=4), os.path.join(CHARS, "!$Ug_SongStone.png"))
    heart()
    for n in ("!Decoration2_blue.png", "!wagon.png"):
        dst = os.path.join(CHARS, n)
        if not os.path.exists(dst):
            shutil.copy2(os.path.join(DUNGEON_CHARS, n), dst)
            print("copied", n)


if __name__ == "__main__":
    deep()
