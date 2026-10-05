# python tools/town/waterfall_fx.py [--dry]
# The town's waterfall (Map008, x 43-44, rows 5-8, A1 waterfall over the cliff) made alive (user 2026-10-04: "the water splashing
# where it hits the pond", "the current should look real"), the way the Winlu author dresses his own waterfalls (his sample maps
# 12 and 16: !waterfall_animation, priority below, stepping, speed 6) widened to our two cells:
#   - the shining lip on the top cell: index 4 direction 2 (the left end) + index 5 direction 2 (the right end); the left one with
#     WaterFx.js's <Fall:w=2,h=4> (the falling water sliding down smoothly instead of the engine's 16 px steps)
#   - the foam on the pond's cell under the last one: index 0 direction 2 (left end) + direction 4 (right end), the left one with
#     WaterFx.js's <Splash:w=2,wave=110> (spray, mist, waves spreading over the pond)
#   - two invisible WaterFx <Flow> events: the stream above flowing down into the fall, the pond drifting to its outlet in the east
#     wall (rows 13-14); both stand in mid-water, away from the shore (a hero drinking there faces the water, not an event)
import os, sys, json, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
sys.path.insert(0, HERE)
from nslib import write_map
from east_gate import page, pic, load

PIECES = [  # (name, x, y, index, direction, note)
    ("Wodospad: krawędź (lewa)", 43, 5, 4, 2, "<Fall:w=2,h=4,speed=1.3>"),
    ("Wodospad: krawędź (prawa)", 44, 5, 5, 2, ""),
    ("Wodospad: piana (lewa)", 43, 9, 0, 2, "<Splash:w=2,wave=110>"),
    ("Wodospad: piana (prawa)", 44, 9, 0, 4, ""),
]
FLOWS = [
    ("Nurt: strumień", 44, 2, "<Flow:dx=-0.15,dy=1,w=4,h=5,ox=-1,oy=-2,speed=1.3,count=12,glint=0.4>"),
    ("Nurt: staw", 45, 11, "<Flow:dx=1,dy=0.35,w=12,h=6,ox=-5,oy=-2,speed=0.4,count=26,sx=-1,sy=-1.85,src=0.6,spread=1.1,glint=0.35>"),
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    mp = load(ROOT + "data/Map008.json")
    W, H, d = mp["width"], mp["height"], mp["data"]
    kind = lambda x, y: (d[y * W + x] - 2048) // 48 if d[y * W + x] >= 2048 else None
    problems = [("(%d,5..8) is not the waterfall" % x) for x in (43, 44) if any(kind(x, y) != 9 for y in range(5, 9))]
    taken = {(e["x"], e["y"]) for e in mp["events"] if e}
    problems += ["an event already stands on (%d,%d)" % (x, y) for _, x, y, *_ in PIECES + FLOWS if (x, y) in taken]
    if any(e and e["name"].startswith(("Wodospad:", "Nurt:")) for e in mp["events"]): problems.append("the waterfall's events are there already")
    if problems: sys.exit("Map008 is not as expected: " + "; ".join(problems))
    events = mp["events"]
    first = len(events)
    def add(name, x, y, pages, note):
        events.append({"id": len(events), "name": name, "note": note, "pages": pages, "x": x, "y": y})
    for name, x, y, index, direction, note in PIECES:
        p = page(pic("!waterfall_animation", index, direction, 1), [], priority=0, step=True)
        p["moveSpeed"], p["moveFrequency"] = 6, 5
        add(name, x, y, [p], note)
    for name, x, y, note in FLOWS:
        add(name, x, y, [page(pic(""), [], priority=0)], note)
    print("waterfall: events %d..%d" % (first, len(events) - 1))
    if not a.dry: write_map(ROOT + "data/Map008.json", mp, d, events)

if __name__ == "__main__":
    main()
