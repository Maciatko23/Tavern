import sys,json
sys.path.insert(0,'../..')
import krajobraz as KJ
old=json.load(open(KJ.ROOT+'/data/Map024.json',encoding='utf-8'))
new=json.load(open('staging/data/Map024.json',encoding='utf-8'))
oi={e['id']:e for e in old['events'] if e}; ni={e['id']:e for e in new['events'] if e}
nw=[e for i,e in ni.items() if i not in oi]
mv=[(i,oi[i]['x'],oi[i]['y'],ni[i]['x'],ni[i]['y']) for i in ni if i in oi and (oi[i]['x'],oi[i]['y'])!=(ni[i]['x'],ni[i]['y'])]
print('events',len(oi),'->',len(ni),'new',len(nw),'moved',mv,'removed',[i for i in oi if i not in ni])
tr=[e for e in nw if e['pages'][0]['image']['characterName'].startswith(('!$Pine','!$Tree'))]
best=0
for x0 in range(0,94):
  for y0 in range(0,106):
    c=sum(1 for e in tr if x0<=e['x']<x0+27 and y0<=e['y']<y0+15)
    if c>best: best=c;bx=(x0,y0)
print('new trees',len(tr),'densest',best,bx)
# tree touching
T=[e for e in ni.values() if e['pages'][0]['image']['characterName'].startswith(('!$Pine','!$Tree'))]
print('touching',[(a['id'],b['id'],a['x'],a['y']) for i,a in enumerate(T) for b in T[i+1:] if abs(a['x']-b['x'])<=1 and abs(a['y']-b['y'])<=1])
