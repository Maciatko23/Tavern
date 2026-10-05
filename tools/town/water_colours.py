# python tools/town/water_colours.py
# The town's waterfall in the pond's colour (user 2026-10-04: "ujednolicić kolor wody w stawie i spadającej w wodospadzie").
# Tileset 11 (the town) draws its pond and stream with A1 water kind 0 (mean RGB 75,151,159, very flat) and its waterfall with the
# waterfall kind 9 (paler and greyer: its falling water ~25 red, ~10 green/blue higher). No waterfall of the sheet matches kind 0, so
# a copy of the sheet, Fantasy_Outside_A1_green_town.png next to the original, gets the waterfall blocks (kinds 5, 7, 9, 11) shifted
# so their falling water's mean is the pond's, the streaks around it 1.5x stronger, the dark rock edges (green < 100) stay as they are.
# Tileset 11 then uses the copy; tileset 9 (Map003, the meadows...) keeps the original. Run again: rebuilt from the original.
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
from PIL import Image

DIR = "Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/"
SRC, DST = DIR + "Fantasy_Outside_A1_green", DIR + "Fantasy_Outside_A1_green_town"
POND = (30, 78, 66, 114)                                    # the middle of kind 0's big autotile, frame 0
WATERFALLS = {5: (672, 0), 7: (672, 144), 9: (288, 288), 11: (288, 432)}   # (kind 13 is the swamp's: not water-coloured)
TILESET = 11
CONTRAST = 1.5          # the streaks around that mean a little stronger, so the falling water still reads against the stream

def mean(px):
    n = len(px)
    return [sum(p[i] for p in px) / n for i in range(3)]

def main():
    im = Image.open(ROOT + "img/tilesets/" + SRC + ".png").convert("RGBA")
    pond = mean([p for p in im.crop(POND).getdata() if p[3] > 200])
    pix = im.load()
    for kind, (x0, y0) in WATERFALLS.items():
        body = [pix[x, y] for y in range(y0, y0 + 144) for x in range(x0, x0 + 96) if pix[x, y][3] > 200 and pix[x, y][1] >= 100]
        m = mean(body)
        off = [pond[i] - m[i] for i in range(3)]
        for y in range(y0, y0 + 144):
            for x in range(x0, x0 + 96):
                p = pix[x, y]
                if p[3] == 0 or p[1] < 100: continue
                pix[x, y] = tuple(max(0, min(255, round(pond[i] + (p[i] - m[i]) * CONTRAST))) for i in range(3)) + (p[3],)
        print("waterfall kind %d: falling water %s -> pond %s (shift %s)" % (kind, [round(v) for v in m], [round(v) for v in pond], [round(v) for v in off]))
    im.save(ROOT + "img/tilesets/" + DST + ".png")
    # tileset 11 uses the copy (Tilesets.json: one tileset a line, as the editor writes it)
    path = ROOT + "data/Tilesets.json"
    raw = open(path, "rb").read().decode("utf-8")
    lines = raw.split("\n")
    for i, line in enumerate(lines):
        if line.startswith('{"id":%d,' % TILESET):
            ts = json.loads(line.rstrip(","))
            ts["tilesetNames"][0] = DST
            lines[i] = json.dumps(ts, ensure_ascii=False, separators=(",", ":")) + ("," if line.endswith(",") else "")
            break
    else:
        raise SystemExit("tileset %d not found" % TILESET)
    open(path, "wb").write("\n".join(lines).encode("utf-8"))
    print("tileset %d: A1 = %s" % (TILESET, DST))

if __name__ == "__main__":
    main()
