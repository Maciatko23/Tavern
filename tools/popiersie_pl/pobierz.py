# Download PixelLab job results: python tools/popiersie_pl/pobierz.py <out_dir> name=job_id [name=job_id ...]
# Each result is saved as <out_dir>/<name>.png (the edit / portrait as PixelLab returned it). Appends to <out_dir>/zlecenia.json.
import json
import os
import sys
import urllib.request

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
log_path = os.path.join(out, 'zlecenia.json')
log = json.load(open(log_path, encoding='utf-8')) if os.path.exists(log_path) else {}
for arg in sys.argv[2:]:
    name, job = arg.split('=', 1)
    url = job if job.startswith('http') else 'https://api.pixellab.ai/mcp/images/%s/download' % job
    req = urllib.request.Request(url, headers={'User-Agent': 'tawerna-tools'})
    data = urllib.request.urlopen(req, timeout=60).read()
    p = os.path.join(out, name + '.png')
    open(p, 'wb').write(data)
    log[name] = job
    print('ok', name, len(data))
json.dump(log, open(log_path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
