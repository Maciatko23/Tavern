# python tools/house/decor/wigilia_stol2.py [--proba]
# (2026-10-23) The Christmas Eve cloth for grandpa's table as it is since the user's edit of 2026-10-17: Map019's corner (1..3, 9..11)
# holds two round stools (the candle on the right one, 2,10) and a table two cells wide (Winlu C 454/455 over 462/463 at 1..2, 10..11;
# its top covers map pixels 51..143 x 508..551). The same painter as make_decor.py (decor_paint.wigilia_table, the wafer on its plate),
# the cloth for this top; written into frame 0 of img/characters/!$House_Decor_Big.png (the old three-cell cloth's frame - that table
# is gone) for the slot's event at CELL. Prints the look's line for HomeDecor.js's DECOR_ART ("wigilia").
# make_decor.py itself is not run: HomeDecor.js's DECOR_ART was set by hand after it (the cells of 2026-09-29).
import os, sys, json
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import make_decor as MD          # (its main() runs only as a script)
import decor_paint as DP

TOP = (51, 508, 143, 551)        # the table's top in map pixels (x0, y0, x1, y1)
PLATE_AT = (121, 528)            # the wafer's plate: on the right half, a little behind the middle
CELL = (2, 11)                   # the slot's event cell (wigilia, id 995)

def main():
    P = MD.pixellab_pieces()
    cloth, left, top = DP.wigilia_table(MD.wafer_on_plate(P["wafer"]), top=TOP, plate_at=PLATE_AT)
    ox, oy = CELL[0] * 48 + 24 - MD.BW // 2, (CELL[1] + 1) * 48 - MD.BH
    fx, fy = left - ox, top - oy
    assert fx >= 0 and fy >= 0 and fx + cloth.width <= MD.BW and fy + cloth.height <= MD.BH, (fx, fy, cloth.size)
    fr = Image.new("RGBA", (MD.BW, MD.BH), (0, 0, 0, 0))
    fr.alpha_composite(cloth, (fx, fy))
    box = MD.solid_box(fr)
    line = ["!$House_Decor_Big", 0, 2, 0, CELL[0], CELL[1], box, []]
    print("wigilia:", json.dumps(line, separators=(",", ":")), "cloth", cloth.size, "at map", (left, top))
    if "--proba" in sys.argv:
        fr.save(os.path.join(HERE, "wigilia_stol2_proba.png")); return
    path = os.path.join(MD.CHARS, MD.BIG + ".png")
    big = Image.open(path).convert("RGBA")
    big.paste(Image.new("RGBA", (MD.BW, MD.BH), (0, 0, 0, 0)), (0, 0))   # (frame 0 cleared, then the new cloth)
    big.alpha_composite(fr, (0, 0))
    big.save(path)
    print("zapisano", os.path.relpath(path, MD.ROOT))

if __name__ == "__main__":
    main()
