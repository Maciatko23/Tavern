# usage: evl.py MAP x0 y0 x1 y1 [staging]  -> events in the rectangle
import sys, os, json
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..'))
mid=int(sys.argv[1]); x0,y0,x1,y1=map(int,sys.argv[2:6])
p=os.path.join(HERE,'staging','data','Map%03d.json'%mid) if 'staging' in sys.argv[6:] else os.path.join(ROOT,'data','Map%03d.json'%mid)
m=json.load(open(p,encoding='utf8'))
for e in m['events']:
    if not e or not (x0<=e['x']<=x1 and y0<=e['y']<=y1): continue
    im=e['pages'][0]['image']
    print(e['id'],e['x'],e['y'],repr(e['name']),im['characterName'],im['tileId'],'|',(e.get('note') or '')[:60].replace('\n',' '),'| pages',len(e['pages']))
