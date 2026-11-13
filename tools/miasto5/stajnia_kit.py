# -*- coding: utf-8 -*-
"""Stajnia A jako budynek-zdarzenie dla nowego Kruczogrodu: obrazek wyrównany do nieparzystej szerokości (13 x 6 kratek, budynek
12 x 6 od lewej) + arkusz otwierania drzwi.   python tools/miasto5/stajnia_kit.py
 -> img/characters/!$Stajnia_A_Bud.png, !$Stajnia_A_Drzwi.png, tools/miasto5/stajnia_kit.json"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'budynki'))
from lib import sheet3x4, door_frames, door_sheet
from PIL import Image
T = 48
src = Image.open(os.path.join(ROOT, 'img', 'characters', '!$Stajnia_Duza_A.png')).convert('RGBA')
fr = src.crop((0, 0, src.width // 3, src.height // 4))            # 576 x 288 = 12 x 6
im = Image.new('RGBA', (13 * T, fr.height)); im.alpha_composite(fr, (0, 0))   # 13 wide: the event sits on col 6
CX, FW, FH, BOX = 8 * T + 24, 96, 96, (25, 70, 12, 82)             # the door: col 8, arch 385..430 px, leaf rows 204..274
fs, mk = door_frames(im, CX, FW, FH, BOX)
assert fs is not None, 'door leaf not found'
out = os.path.join(ROOT, 'img', 'characters')
sheet3x4(im).save(os.path.join(out, '!$Stajnia_A_Bud.png')); door_sheet(fs).save(os.path.join(out, '!$Stajnia_A_Drzwi.png'))
spec = {'tiles': [13, 6], 'center_col': 6, 'door_col': 8, 'frame': [FW, FH], 'occupy': {'left': 6, 'right': 5, 'up': 2},
        'note': 'building 12 wide from the left edge (col 12 empty); walls = bottom 2 rows (stalls), roof above'}
json.dump(spec, open(os.path.join(HERE, 'stajnia_kit.json'), 'w'), indent=1)
prev = Image.new('RGBA', (FW * 4 + 30, FH), (90, 120, 70, 255))
for i, f in enumerate(fs): prev.alpha_composite(Image.fromarray(f, 'RGBA'), (i * (FW + 10), 0))
prev.save(os.path.join(HERE, 'stajnia_drzwi_podglad.png')); print('ok, leaf px', int(mk.sum()))
