# Fetch NPC bust edits: python tools/busts_pl/odbierz.py Key=job_id [Key=job_id ...]
# -> surowe/<Key>.png (as PixelLab returned it; an older one is kept as surowe/<Key>_v<n>.png) and
#    staging/<Key>_Bust.png (128x128, the light 1-2 px strip at the bottom edge cut away: rows 126-127 = row 125)
import json
import os
import shutil
import sys
import urllib.request

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RAW, STG = os.path.join(HERE, 'surowe'), os.path.join(HERE, 'staging')
os.makedirs(RAW, exist_ok=True)
os.makedirs(STG, exist_ok=True)
jp = os.path.join(RAW, 'zlecenia.json')
log = json.load(open(jp, encoding='utf-8')) if os.path.exists(jp) else {}


def finish(key, src):
    a = np.array(Image.open(src).convert('RGBA'))
    a[126:128] = a[125]
    Image.fromarray(a, 'RGBA').save(os.path.join(STG, key + '_Bust.png'))


args = sys.argv[1:]
if args and args[0] == '--kolejka':      # every Key=job of the queue files not fetched yet (skipped quietly while not ready)
    args = []
    for fn in sorted(os.listdir(RAW)):
        if fn.startswith('kolejka_b') and fn.endswith('.txt'):
            for ln in open(os.path.join(RAW, fn), encoding='utf-8'):
                ln = ln.strip()
                if '=' in ln and not ln.startswith('#'):
                    k, j = ln.split('=', 1)
                    if j not in log.get(k, []):
                        args.append(ln)
for arg in args:
    key, job = arg.split('=', 1)
    url = job if job.startswith('http') else 'https://api.pixellab.ai/mcp/images/%s/download' % job
    try:
        data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'tawerna-tools'}), timeout=60).read()
        Image.open(__import__('io').BytesIO(data)).verify()
    except Exception as e:
        print('not ready', key, e.__class__.__name__)
        continue
    p = os.path.join(RAW, key + '.png')
    if os.path.exists(p):
        n = 1
        while os.path.exists(os.path.join(RAW, '%s_v%d.png' % (key, n))):
            n += 1
        shutil.move(p, os.path.join(RAW, '%s_v%d.png' % (key, n)))
    open(p, 'wb').write(data)
    log.setdefault(key, []).append(job)
    finish(key, p)
    print('ok', key)
json.dump(log, open(jp, 'w', encoding='utf-8'), indent=1)
