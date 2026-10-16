# python tools/garnizon/art/werbownik_beben.py   - the recruiter's drum put back into his walk (img/characters/Npc_Werbownik_Walk8.png,
# $Npc_Werbownik.png). PixelLab's walk template drew the drum at his left hip only in the standing rotations: walking south and
# north-east it was gone (it flickered on and off in the game). Here the drum is cut from the standing frame of that direction (its
# box) and pasted behind every walk frame at the same place, moved with the walk's
# bob (the top of the hat). Run it after tools/npc/build_npc.py --key Werbownik (it rebuilds both sheets from the zip). Idempotent:
# a frame that already shows the drum is left alone.
import os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
WALK = os.path.join(ROOT, "img", "characters", "Npc_Werbownik_Walk8.png")
SHEET = os.path.join(ROOT, "img", "characters", "$Npc_Werbownik.png")
C = 64
ROWS = {"south": 0, "north-east": 5}
BOX = {"south": (38, 35, 52, 52), "north-east": (12, 29, 25, 46)}     # where the drum is in the standing frame
STEPS = (2, 6)                                                       # the $ sheet's steps (build_npc: A=2, B=6)


def red(p):
    return p[3] and p[0] > 150 and p[1] < 100 and p[2] < 100


def drum_of(cell, box):
    """the drum: every pixel of the standing frame inside box (it is pasted only where the walk frame is empty - behind the body)"""
    x0, y0, x1, y1 = box
    out = Image.new("RGBA", cell.size, (0, 0, 0, 0))
    out.paste(cell.crop(box), (x0, y0))
    return out if any(red(p) for p in out.getdata()) else None


def top_of(cell):
    a = cell.getchannel("A")
    for y in range(C):
        if any(a.getpixel((x, y)) for x in range(C)): return y
    return 0


def main():
    walk = Image.open(WALK).convert("RGBA")
    sheet = Image.open(SHEET).convert("RGBA")
    for d, row in ROWS.items():
        rot = walk.crop((0, row * C, C, row * C + C))
        drum = drum_of(rot, BOX[d])
        if drum is None: continue
        t0 = top_of(rot)
        for f in range(8):
            cx = (1 + f) * C
            cell = walk.crop((cx, row * C, cx + C, row * C + C))
            if sum(1 for y in range(C) for x in range(C) if red(cell.getpixel((x, y)))) >= 6: continue
            dy = top_of(cell) - t0
            layer = Image.new("RGBA", (C, C), (0, 0, 0, 0))
            layer.alpha_composite(drum, (0, max(-4, min(4, dy))))
            cell = Image.alpha_composite(layer, cell)          # (behind the body: the hand and the leg stay in front)
            walk.paste(cell, (cx, row * C))
        if d == "south":   # the $ sheet's down row: step A, stand, step B
            for col, f in ((0, STEPS[0]), (2, STEPS[1])):
                sheet.paste(walk.crop(((1 + f) * C, 0, (2 + f) * C, C)), (col * C, 0))
    walk.save(WALK)
    sheet.save(SHEET)
    print("bęben dorysowany:", WALK, SHEET)


if __name__ == "__main__":
    main()
