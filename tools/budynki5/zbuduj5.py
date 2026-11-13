# -*- coding: utf-8 -*-
"""Batch 1 of the new Kruczogród buildings in the Winlu style of the old town (tileset 11 tiles + the town's own prop sheets,
PixelLab only for props Winlu lacks, in tools/budynki5/czesci/).  Each building is a small tile grid (lib5.Grid) rendered to one
picture; the door is a Winlu door (!Fantasy_door1/2) whose four opening frames are drawn over the building's own wall.
  python tools/budynki5/zbuduj5.py [Name ...]
-> img/characters/!$Bud5_<Name>.png (3x4 sheet of the picture), !$Bud5_<Name>_Drzwi.png (door opening, 3x4 big-character layout,
   rows = closed..open), tools/budynki5/wynik_<Name>.png, tools/budynki5/spis.json"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib5
from lib5 import Grid, rect_wall, rect_floor, roof, render, B, C, D, E, T
import mapylib
from PIL import Image
ROOT = lib5.ROOT
CZ = os.path.join(HERE, 'czesci')
def spr(name, ci, d, p):
    return mapylib.frame(name, ci, d, p).copy()
def place(g, img, cx, cy, dx=0, dy=0, under=False):
    """an event-like sprite: bottom centre on cell (cx, cy) (+ pixel nudge)"""
    g.sprite(img, cx * T + T // 2 - img.width // 2 + dx, (cy + 1) * T - img.height + dy, under)
def part(n):
    p = os.path.join(CZ, n + '.png')
    return Image.open(p).convert('RGBA') if os.path.exists(p) else None
DOORS = {}
def door(g, name, ci, cx, cy):
    """remember the door (cell, sheet, index); the closed frame is drawn into the picture"""
    DOORS[id(g)] = (name, ci, cx, cy)

def win(g, x, y, top, z=1):
    """a 2-tile window from sheet B: `top` on row y, top+8 on row y+1"""
    g.set(z, x, y, B(top)); g.set(z, x, y + 1, B(top + 8))
def shade(g, x0, y0, x1, y1, k=0.62):
    """darkened copy of cells (interior under a roof): drawn as a sprite of the rendered cells, multiplied"""
    sub = Grid(x1 - x0 + 1, y1 - y0 + 1)
    for z in range(4):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): sub.L[z][y - y0][x - x0] = g.L[z][y][x]; g.L[z][y][x] = 0
    im = render(sub); px = im.load()
    for yy in range(im.height):
        f = k * (0.78 + 0.22 * yy / im.height)
        for xx in range(im.width):
            r_, g_, b_, a_ = px[xx, yy]
            if a_: px[xx, yy] = (int(r_ * f), int(g_ * f), int(b_ * f * 1.04), a_)
    g.sprite(im, x0 * T, y0 * T, under=True)

# ---------------------------------------------------------------- 1. Browar i słodownia
def browar():
    g = Grid(11, 9)
    gab = lib5.cut(29, 78, 34, 86, events=False)                       # the town's gable-front house type (the carpenter's, 6 wide)
    for z in (1, 2, 3):
        for y in range(gab.h):
            for x in range(gab.w):
                t = gab.L[z][y][x]
                if t in (B(83), B(91)) or (x in (0, 5) and t in (C(197), C(205), C(52), C(60), C(19), C(125))): gab.L[z][y][x] = 0
    gab.L[3][7][4] = 0                                                  # small window by the old door
    g.paste(gab, 0, 0)
    for x in range(1, 6):                                               # stone ground floor carried on under the right eave to the malt hall
        for y in (7, 8): g.L[0][y][x] = 2048 + 76 * 48 + lib5.wall_shape(x == 1, y == 7, False, y == 8)
    g.set(2, 1, 7, B(18)); g.set(2, 1, 8, B(26))                       # lit window with shutters
    # malt hall (right, 5 wide): the tavern's red roof, timber upper floor with windows, timber ground floor
    roof(g, 55, 6, 2, 10, 4)
    rect_floor(g, 0, 81, 6, 5, 10, 6)
    rect_wall(g, 0, 88, 6, 7, 10, 8)
    win(g, 7, 5, 4); win(g, 9, 5, 4)
    place(g, spr('!Roof_Windows', 1, 8, 1), 8, 3, 0, 18)               # red dormer
    g.set(1, 10, 1, B(84)); g.set(1, 10, 2, B(92))                     # malt kiln chimney
    g.set(1, 6, 2, B(57))                                               # kiln vent
    place(g, spr('!Signs', 2, 2, 1), 4, 7, 0, -6)                      # tankard sign
    place(g, spr('!Tavern_Yard', 0, 8, 1), 7, 8, 0, 6)                 # beer barrels
    k = part('kociol')
    if k: place(g, k, 9, 8, 22, 4)                                      # copper brewing kettle (PixelLab)
    door(g, '!Fantasy_door2', 4, 3, 8)
    return g, 'Browar i słodownia', {'up': 3}

# ---------------------------------------------------------------- 2. Kruczarnia
def kruczarnia():
    g = Grid(5, 10)
    for r in range(7): g.set(1, 0, 3 + r, B(141 + 8 * r)); g.set(1, 1, 3 + r, B(142 + 8 * r))     # round stone tower
    g.set(2, 0, 6, B(34)); g.set(2, 0, 7, B(42))                       # narrow arched openings (ravens fly in and out)
    g.set(2, 1, 5, B(49))
    place(g, spr('!Town_Props', 2, 8, 2), 0, 3, 24, 30)                # the conical slate roof
    # keeper's room against the tower: dark roof, timber walls
    roof(g, 71, 2, 5, 4, 6)
    rect_floor(g, 0, 101, 2, 7, 4, 8)
    rect_wall(g, 0, 110, 2, 9, 4, 9)
    win(g, 4, 7, 2)
    place(g, spr('!House_Town', 2, 2, 1), 1, 8, 6, 8)                  # black banner with the white bird
    place(g, part('kruk_L'), 3, 4, 10, 4)                                # ravens (PixelLab) on the keeper's roof and the tower's ledge
    place(g, part('kruk_R'), 0, 6, 2, -30)
    door(g, '!Fantasy_door1', 0, 3, 9)
    return g, 'Kruczarnia', {'up': 4}

# ---------------------------------------------------------------- 3. Kuźnia podkuwacza
def podkuwacz():
    g = Grid(9, 7)
    roof(g, 67, 0, 1, 3, 3)                                             # forge room: golden thatch like the big stable
    rect_wall(g, 0, 110, 0, 4, 3, 6)                                    # stone walls
    g.set(1, 1, 0, B(84)); g.set(1, 1, 1, B(92))                       # forge chimney
    win(g, 0, 4, 2)
    roof(g, 67, 4, 1, 8, 3)                                             # open shoeing shed under the same thatch
    rect_wall(g, 0, 64, 4, 4, 8, 6)                                     # plank back wall
    shade(g, 4, 4, 8, 6, 0.55)
    for x in range(4, 9): g.set(2, x, 4, B(177))                        # beam with the shade under the eave
    g.set(2, 4, 4, B(176)); g.set(2, 8, 4, B(179))
    for y in (5, 6): g.set(2, 4, y, B(168)); g.set(2, 8, y, B(170))     # corner posts
    place(g, spr('!Decoration', 0, 2, 1), 5, 5, 0, 10)                 # forge fire basket
    place(g, spr('!Town_Props', 0, 2, 1), 6, 6, 0, 0)                  # anvil
    place(g, spr('!Signs', 0, 4, 1), 3, 4, 20, 6)                      # horseshoe sign
    g.set(3, 0, 6, C(53))                                               # water bucket
    place(g, part('dyby'), 7, 6, 0, 2)                                  # shoeing stocks (PixelLab)
    door(g, '!Fantasy_door1', 1, 2, 6)
    return g, 'Kuźnia podkuwacza', {'up': 2}

# ---------------------------------------------------------------- 4. Szopa handlarza bydła
def handlarz():
    g = Grid(11, 7)
    roof(g, 59, 0, 1, 4, 3)                                             # dark thatch house
    rect_wall(g, 0, 74, 0, 4, 4, 6)                                     # grey log walls
    g.set(1, 3, 0, B(87))                                               # clay chimney pots
    win(g, 0, 4, 18); win(g, 4, 4, 18)
    roof(g, 66, 5, 2, 10, 3)                                            # lower shingle roof of the open shed
    rect_wall(g, 0, 64, 5, 4, 10, 6)
    shade(g, 5, 4, 10, 6, 0.5)
    place(g, part('uzdy'), 9, 4, -8, 40, under=True)                    # halters and ropes on the back wall (PixelLab)
    for x in range(5, 11): g.set(2, x, 4, B(177))
    g.set(2, 5, 4, B(176)); g.set(2, 10, 4, B(179))
    for y in (5, 6): g.set(2, 5, y, B(168)); g.set(2, 10, y, B(170))
    for (t, x, y) in [(213, 6, 5), (214, 7, 5), (215, 8, 5), (221, 6, 6), (222, 7, 6), (223, 8, 6)]:
        g.set(3, x, y, C(t))                                            # haystack inside (its scattered-straw foot left out)
    g.set(3, 9, 6, C(53))                                               # bucket
    place(g, part('szyld_krowa'), 4, 5, 18, -10)                       # cow sign (PixelLab)
    door(g, '!Fantasy_door1', 2, 2, 6)
    return g, 'Szopa handlarza bydła', {'up': 2}

BUILD = {'Browar': browar, 'Kruczarnia': kruczarnia, 'Podkuwacz': podkuwacz, 'Handlarz': handlarz}

def door_frames(g, name, ci, cx, cy, pad):
    """4 frames (closed .. open), each the wall behind the door + the Winlu door frame; size 48 x 96"""
    wall = render(g, pad)
    x0, y1 = cx * T, (cy + 1) * T + pad; fr = []
    for d in (2, 4, 6, 8):
        f = wall.crop((x0, y1 - 96, x0 + 48, y1)); f.alpha_composite(spr(name, ci, d, 1)); fr.append(f)
    return fr
def sheet3x4(fr):
    w, h = fr[0].size; s = Image.new('RGBA', (w * 3, h * 4))
    for r, f in enumerate(fr):
        for c in range(3): s.paste(f, (c * w, r * h))
    return s
def build(n):
    g, label, extra = BUILD[n]()
    dn, ci, cx, cy = DOORS[id(g)]
    pad = 0
    # the picture: odd width in tiles centred on the event cell; sprites over the top edge -> extra rows on top
    top = min([0] + [s['y'] for s in g.sprites])
    if top < 0: pad = -(top // T) * T if top % T == 0 else (-top // T + 1) * T
    wt = g.w + (1 if g.w % 2 == 0 else 0)
    if wt != g.w: g.insert_cols(g.w, g.w - 1, 1); g.clear(g.w - 1, 0, g.w - 1, g.h - 1, (0, 1, 2, 3))
    fr = door_frames(g, dn, ci, cx, cy, pad)
    im = render(g, pad); im.alpha_composite(fr[0], (cx * T, (cy + 1) * T + pad - 96))
    H = im.height; c = wt // 2
    return im, fr, {'label': label, 'w': im.width, 'h': H, 'tiles': [wt, H // T], 'center_col': c, 'door_col': cx, 'door_sheet': dn, 'door_index': ci,
                    'frame': [48, 96], 'occupy': {'left': c, 'right': wt - 1 - c, 'up': extra['up']}}
if __name__ == '__main__':
    only = sys.argv[1:] or list(BUILD)
    sp = os.path.join(HERE, 'spis.json'); spis = json.load(open(sp, encoding='utf-8')) if os.path.exists(sp) else {}
    out = os.path.join(ROOT, 'img', 'characters')
    for n in only:
        im, fr, info = build(n)
        im.save(os.path.join(HERE, 'wynik_%s.png' % n))
        sheet3x4([im]*4).save(os.path.join(out, '!$Bud5_%s.png' % n))
        sheet3x4(fr).save(os.path.join(out, '!$Bud5_%s_Drzwi.png' % n))
        spis[n] = info; print(n, info['tiles'], 'door col', info['door_col'], 'occupy', info['occupy'])
    open(sp, 'wb').write(json.dumps(spis, indent=1, ensure_ascii=False).encode('utf-8'))
