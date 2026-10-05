# Line-up picture of NPC sheets beside the hero: standing frames (S, W, E, N) from the Npc_<Key>_Walk8.png sheets, x3 on mid-grey.
#
#   python tools/npc/lineup.py docs/postacie/lineup_2026-10-04_b.png Borgar Melia Grum ...
#
# The hero comes first (img/characters/Hero_Walk.png, the same 8-row layout). A thin line marks the hero's feet row of each direction.
import os, sys
from PIL import Image, ImageDraw

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
CHARS = os.path.join(GAME, "img", "characters")
C, S, GAP, LABEL = 64, 3, 8, 22
ROWS = [("south", 0), ("west", 2), ("east", 6), ("north", 4)]   # Walk8 row of each direction


def main():
    out, keys = sys.argv[1], sys.argv[2:]
    sheets = [("Bohater", Image.open(os.path.join(CHARS, "Hero_Walk.png")).convert("RGBA"))]
    sheets += [(k, Image.open(os.path.join(CHARS, "Npc_%s_Walk8.png" % k)).convert("RGBA")) for k in keys]
    W = len(sheets) * (C * S + GAP) + GAP
    H = LABEL + len(ROWS) * C * S + GAP
    img = Image.new("RGB", (W, H), (128, 128, 128))
    d = ImageDraw.Draw(img)
    hero = sheets[0][1]
    for j, (name, row) in enumerate(ROWS):
        y0 = LABEL + j * C * S
        feet = hero.crop((0, row * C, C, (row + 1) * C)).getchannel("A").getbbox()[3]
        d.line([(0, y0 + feet * S), (W, y0 + feet * S)], fill=(112, 112, 112), width=1)
    for i, (key, sh) in enumerate(sheets):
        x0 = GAP + i * (C * S + GAP)
        d.text((x0 + 4, 4), key, fill=(255, 255, 255))
        for j, (name, row) in enumerate(ROWS):
            cell = sh.crop((0, row * C, C, (row + 1) * C)).resize((C * S, C * S), Image.NEAREST)
            img.paste(cell, (x0, LABEL + j * C * S), cell)
    img.save(out)
    print("saved", out, img.size)


if __name__ == "__main__":
    main()
