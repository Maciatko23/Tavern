import json,sys
o=json.load(open('data/Map162.json',encoding='utf8'))['events'];n=json.load(open('tools/poprawki_krok5/mapy/162/staging/data/Map162.json',encoding='utf8'))['events']
def c(ev,x0,y0,t=False):
    return sum(1 for e in ev if e and x0<=e['x']<x0+27 and y0<=e['y']<y0+15 and (not t or 'Tree' in e['pages'][0]['image']['characterName']))
newt=[e for i,e in enumerate(n) if e and (i>=len(o) or o[i] is None)]
res=[]
for x0 in range(0,94):
    for y0 in range(0,106):
        res.append((c(n,x0,y0)-c(o,x0,y0),x0,y0))
res.sort(reverse=True);print('net worst',res[:5])
bt=max((sum(1 for e in newt if x0<=e['x']<x0+27 and y0<=e['y']<y0+15 and 'Tree' in e['pages'][0]['image']['characterName']),x0,y0) for x0 in range(94) for y0 in range(106));print('new trees',bt)
print(sum(1 for e in n if e)-sum(1 for e in o if e))
