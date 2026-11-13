# arkusze wycinków: python listki_w.py <mapa> [kod_filtr...]  -> wyc/_arkusze/<mapa>_<n>.png (6 wycinków po 640x360 z podpisem)
import os, sys, json, glob
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(HERE, 'wyc'); O = os.path.join(W, '_arkusze'); os.makedirs(O, exist_ok=True)
sys.path.insert(0, HERE)
import budowa as B
def main(maps, ids=None, sel=None, pref=''):
    rows = B.polacz()
    for m in maps:
        rr = [r for r in rows if r['mapa'] == m and (sel is None or sel(r))]
        for n in range(0, len(rr), 6):
            S = Image.new('RGB', (1280, 1080), (30, 0, 30))
            for k, r in enumerate(rr[n:n+6]):
                p = os.path.join(W, str(m), r['id'] + '.png')
                if not os.path.exists(p): continue
                im = Image.open(p).convert('RGB'); im.thumbnail((640, 360))
                d = ImageDraw.Draw(im); d.rectangle((0, im.height-16, im.width, im.height), fill=(0,0,0)); d.text((3, im.height-14), '%s|%s %s' % (r['id'], r['kod'] or 'oko', r['opis'][:70]), fill=(255,255,0))
                S.paste(im, ((k % 2) * 640, (k // 2) * 360))
            S.save(os.path.join(O, '%s%d_%02d.png' % (pref, m, n // 6)))
if __name__ == '__main__':
    if sys.argv[1] == 'oko':
        for f in glob.glob(os.path.join(O, 'oko*')): os.remove(f)
        main([3,4,8,13,20,24,111,125,162,168,175,120,213,1,102,183], sel=lambda r: 'oko' in r['zrodlo'], pref='oko')
    elif sys.argv[1] == 'kod':
        kods = sys.argv[2].split(',')
        rows = B.polacz(); import collections
        S = [r for r in rows if r['zrodlo'] == 'auto' and r['kod'] in kods]
        S = S[:int(sys.argv[3])] if len(sys.argv) > 3 else S
        for n in range(0, len(S), 6):
            Im = Image.new('RGB', (1280, 1080), (30, 0, 30))
            for k, r in enumerate(S[n:n+6]):
                p = os.path.join(W, str(r['mapa']), r['id'] + '.png')
                im = Image.open(p).convert('RGB'); im.thumbnail((640, 360))
                d = ImageDraw.Draw(im); d.rectangle((0, im.height-16, im.width, im.height), fill=(0,0,0)); d.text((3, im.height-14), '%s/%s|%s %s' % (r['mapa'], r['id'], r['kod'], r['opis'][:70]), fill=(255,255,0))
                Im.paste(im, ((k % 2) * 640, (k // 2) * 360))
            Im.save(os.path.join(O, 'k_%s_%02d.png' % (sys.argv[2].replace(',', '+'), n // 6)))
    else:
        main([int(a) for a in sys.argv[1:]])
