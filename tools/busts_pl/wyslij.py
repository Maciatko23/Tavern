# Upload the front frames (x2, 128x128) for PixelLab references: python tools/busts_pl/wyslij.py <upload_url> Key [Key ...]
# The refs (upload:<id>, kept 3 days) are stored in tools/busts_pl/surowe/wyslane.json
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from klatki import frame, OUT  # noqa: E402
from PIL import Image  # noqa: E402

url, keys = sys.argv[1], sys.argv[2:]
jp = os.path.join(HERE, 'surowe', 'wyslane.json')
data = json.load(open(jp, encoding='utf-8')) if os.path.exists(jp) else {}
os.makedirs(OUT, exist_ok=True)
for k in keys:
    p = os.path.join(OUT, k + '_przod.png')
    frame(k, 0).resize((128, 128), Image.NEAREST).save(p)
    r = subprocess.run(['curl', '-sS', '-F', 'file=@' + p, url], capture_output=True, text=True)
    ref = json.loads(r.stdout)['ref']
    data[k] = ref
    print(k, ref)
json.dump(data, open(jp, 'w', encoding='utf-8'), indent=1)
