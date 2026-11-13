# -*- coding: utf-8 -*-
"""Eight town buildings in the style of the pack (hybrid: pack parts + PixelLab panels in czesci/), 1:1 pixels, pack palette.
python tools/budynki/zbuduj.py  ->  img/characters/!$Bud_<Nazwa>.png (3x4 sheet of one picture), !$Bud_<Nazwa>_Drzwi.png (door-opening sheet),
tools/budynki/spis.json (size in tiles, door cell, door frame), docs/budynki/zestaw.png"""
import json, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
T = 48
def new(w, h): return Image.new('RGBA', (w, h))
def put(dst, src, xy): dst.alpha_composite(src, xy)
def bbox_crop(im): return im.crop(im.getbbox())

R = {}   # name -> dict(img, door=(cx, fw, fh, box), label)

def kamienica():
    up = vcut(crop('City_TileC', 96, 0, 384, 336), [(4, 40), (105, 141)])
    base = crop('City_TileC', 96, 336, 384, 432)
    H = up.height + base.height; im = new(288, H); put(im, up, (0, 0)); put(im, base, (0, up.height))
    shop = part('kamienica_sklep'); put(im, shop, (35, H - 96))
    for y in range(0, 22):
        for x in range(250, 288): im.putpixel((x, y), (0, 0, 0, 0))
    return im, (216, 48, 96, (4, 44, 20, 92)), 'Kamienica kupiecka'
def kuznia():
    W = 432; im = new(W, 240)
    st = crop('City_TileB', 384, 600, 624, 672)
    roof = new(W, 112); put(roof, tile_w(st.crop((0, 0, 240, 24)), W), (0, 0))
    for y in (24, 48, 72): put(roof, tile_w(st.crop((0, 24, 240, 48)), W), (0, y))
    put(roof, tile_w(st.crop((0, 48, 240, 72)), W), (0, 88)); put(im, roof, (0, 0))
    # dark back wall under the roof, then the forge panel (its beam meets the roof)
    bk = new(W, 132); ImageDraw.Draw(bk).rectangle([0, 0, W, 132], fill=(44, 34, 28, 255)); put(im, bk, (0, 108))
    put(im, part('kuznia_palenisko'), (48, 108)); 
    stone = crop('City_TileD', 624, 192, 768, 288)
    sl = stone.crop((0, 8, 48, 8 + 92)); put(im, sl, (0, 240 - 92 - 0)); put(im, stone.crop((0, 0, 48, 40)).crop((0, 0, 48, 40)), (0, 108))
    put(im, crop('City_TileD', 640, 288, 736, 384), (312, 240 - 96))             # stone wall with the arched door
    put(im, tile_w(stone.crop((0, 0, 96, 40)), 128).crop((0, 0, 128, 36)), (304, 108)); put(im, stone.crop((0, 40, 96, 48 + 0)).crop((0, 0, 96, 8)), (312, 144))
    put(im, crop('City_TileB', 392, 215, 416, 350).crop((0, 0, 24, 132)), (296 - 24 + 24, 108))
    put(im, crop('City_TileB', 392, 215, 416, 350).crop((0, 0, 24, 132)), (36, 108))
    for x in range(48, 304, 8): pass
    return im, (360, 48, 96, (8, 40, 12, 94)), 'Kuznia'
def spichlerz():
    st = crop('Rural_TileC', 0, 484, 190, 625); roof = tile_w(st, 240).crop((0, 0, 240, 141))
    fr = part('spichlerz_front'); fw = fr.crop((11, 5, 242, 120))
    im = new(240, 141 + 115); put(im, roof, (0, 0)); put(im, fw, (4, 141))
    return im, (120, 96, 96, (4, 92, 22, 92)), 'Spichlerz'
def rybak():
    c = crop('Rural_TileD', 384, 28, 576, 236); im = new(288, 240); put(im, c, (96, 240 - 208))
    put(im, part('rybak_rekwizyty'), (0, 240 - 96))
    return im, (168, 48, 96, (4, 44, 8, 86)), 'Dom rybaka'
def karczma():
    im = crop('Rural_TileC', 0, 0, 288, 264)
    sign = crop('Rural_TileC', 294, 98, 336, 140)
    return im, (168, 48, 144, (2, 46, 26, 98)), 'Karczma przydrozna'
def wieza():
    im = new(240, 384)
    t = crop('City_TileD', 624, 0, 768, 384); put(im, t, (48, 0))
    s = crop('City_TileD', 624, 296, 672, 384)
    put(im, s, (0, 384 - 88)); put(im, s.transpose(Image.FLIP_LEFT_RIGHT), (192, 384 - 88))
    return im, (120, 48, 96, (4, 44, 8, 92)), 'Wieza strazDnicza'
def ciesla():
    h = crop('Rural_TileC', 0, 480, 192, 768); im = new(384, 288); put(im, h, (0, 0))
    sh = part('ciesla_wiata'); put(im, sh, (176, 288 - 138 - 6))
    return im, (120, 48, 96, (4, 44, 40, 92)), 'Warsztat ciesli'
def mieszczanin():
    c = crop('City_TileB', 144, 12, 384, 288); im = new(240, 288); put(im, c, (0, 12))
    return im, (120, 48, 96, (2, 44, 46, 92)), 'Dom mieszczanina'

BUILD = {'Kamienica': kamienica, 'Kuznia': kuznia, 'Spichlerz': spichlerz, 'Rybak': rybak, 'Karczma': karczma, 'Wieza': wieza, 'Ciesla': ciesla, 'Mieszczanin': mieszczanin}
WALL_UP = {'Kamienica': 4, 'Kuznia': 1, 'Spichlerz': 2, 'Rybak': 1, 'Karczma': 2, 'Wieza': 5, 'Ciesla': 2, 'Mieszczanin': 2}
def pad(im):
    """odd width in tiles (the picture is centred on the event's cell) and a height in whole tiles (transparent, door and feet unchanged)"""
    W, H = im.size; wt = -(-W // T); wt += (wt % 2 == 0)
    ph = (-H) % T; o = new(wt * T, H + ph); o.alpha_composite(im, (0, ph)); return o
if __name__ == '__main__':
    only = sys.argv[1:] or list(BUILD)
    spis = {}
    out = os.path.join(ROOT, 'img', 'characters')
    for n in only:
        im, (cx, fw, fh, box), label = BUILD[n]()
        im = pad(snap(im)); H = im.height; W = im.width
        im.save(os.path.join(HERE, 'wynik_%s.png' % n)); sheet3x4(im).save(os.path.join(out, '!$Bud_%s.png' % n))
        fr, mk = door_frames(im, cx, fw, fh, box)
        if fr is None: print(n, 'DOOR LEAF NOT FOUND')
        else: door_sheet(fr).save(os.path.join(out, '!$Bud_%s_Drzwi.png' % n))
        wt = W // T; c = wt // 2
        spis[n] = {'label': label, 'w': W, 'h': H, 'tiles': [wt, H // T], 'center_col': c, 'door_col': cx // T, 'frame': [fw, fh],
                   'occupy': {'left': c, 'right': wt - 1 - c, 'up': WALL_UP[n]}}
        print(n, W, H, '%dx%d tiles' % (wt, H // T), 'door col', cx // T, 'centre col', c, 'leaf px', None if mk is None else int(mk.sum()))
    json.dump(spis, open(os.path.join(HERE, 'spis.json'), 'w'), indent=1, ensure_ascii=False)
