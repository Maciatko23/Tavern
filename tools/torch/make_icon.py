# The torch's icon (32x32, the game's own icons' look: no background, a dark 1 px outline, light from the upper left) drawn in the
# colours of the torch in his hand (build_torch_walk.py) and the campfire's flame; put into img/system/IconSet.png at INDEX.
#   python tools/torch/make_icon.py [preview.png]
import math, sys
from PIL import Image
GAME = __file__.replace("\\", "/").rsplit("/tools/", 1)[0] + "/"
INDEX = 436   # (a free cell after the meats and the jacket)
OUTLINE = (24, 22, 21, 255)
STICK = [(150, 140, 132, 255), (120, 112, 107, 255), (95, 88, 83, 255), (69, 65, 63, 255)]
HEAD = [(151, 100, 76, 255), (116, 80, 59, 255), (82, 56, 42, 255)]
FIRE = [(0xb8, 0x32, 0x1a, 255), (0xee, 0x6a, 0x1a, 255), (0xff, 0xb4, 0x3a, 255), (0xff, 0xf1, 0xa6, 255)]

S = 32
im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
px = im.load()
core = {}
g = (8.5, 30.0)                      # the butt
ang = math.radians(35)               # leaning right
ux, uy = math.sin(ang), -math.cos(ang)
nx, ny = -uy, ux
for y in range(S):
    for x in range(S):
        vx, vy = x + 0.5 - g[0], y + 0.5 - g[1]
        u, w = vx * ux + vy * uy, vx * nx + vy * ny
        if 0 <= u <= 14 and abs(w) <= 1.5:
            core[(x, y)] = STICK[0] if w < -0.7 else STICK[1] if w < 0.2 else STICK[2] if w < 0.9 else STICK[3]
        elif 14 < u <= 19 and abs(w) <= 2.6:
            band = int(u * 1.3) % 2
            core[(x, y)] = HEAD[0] if w < -1.2 else HEAD[2] if band else HEAD[1]
# the flame over the head: tongues rising straight up from its top
top = (g[0] + ux * 19.5, g[1] + uy * 19.5)
flame = {}
for y in range(S):
    for x in range(S):
        dy = top[1] - (y + 0.5)          # height over the head's top
        if dy < -1.5 or dy > 11:
            continue
        p = max(0.0, dy) / 11
        half = 4.2 * (1 - p) ** 0.9 + 0.6 * math.sin(p * 9) * p
        dx = x + 0.5 - (top[0] + 1.2 * math.sin(p * 4.5) * p)
        if abs(dx) <= half:
            r = abs(dx) / max(half, 0.1)
            k = 3 if (r < 0.35 and p < 0.55) else 2 if r < 0.62 and p < 0.8 else 1 if r < 0.85 else 0
            flame[(x, y)] = FIRE[k]
core.update(flame)
for (x, y), c in core.items():
    px[x, y] = c
for (x, y) in list(core):
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        q = (x + dx, y + dy)
        if q not in core and 0 <= q[0] < S and 0 <= q[1] < S:
            px[q] = OUTLINE if q not in flame else px[q]
# the flame's outer edge in its dark red rather than black (fire has no black line)
for (x, y) in flame:
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        q = (x + dx, y + dy)
        if 0 <= q[0] < S and 0 <= q[1] < S and px[q] == OUTLINE and q not in core:
            vx, vy = q[0] + 0.5 - g[0], q[1] + 0.5 - g[1]
            if vx * ux + vy * uy > 19.6:
                px[q] = (0x8a, 0x22, 0x12, 255)
sheet = Image.open(GAME + "img/system/IconSet.png").convert("RGBA")
cols = sheet.width // S
x0, y0 = (INDEX % cols) * S, (INDEX // cols) * S
assert sheet.crop((x0, y0, x0 + S, y0 + S)).getbbox() is None, "the cell is not free"
sheet.paste(im, (x0, y0))
sheet.save(GAME + "img/system/IconSet.png")
if len(sys.argv) > 1:
    big = Image.new("RGBA", (S * 8, S * 8), (60, 60, 60, 255))
    big.alpha_composite(im.resize((S * 8, S * 8), Image.NEAREST))
    big.save(sys.argv[1])
print("icon", INDEX)
