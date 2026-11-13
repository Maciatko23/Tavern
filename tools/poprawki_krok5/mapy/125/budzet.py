import json,sys
a=json.load(open('data/Map125.json',encoding='utf-8'));b=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'tools/poprawki_krok5/mapy/125/staging/data/Map125.json',encoding='utf-8'))
ea=[e for e in a['events'] if e]; eb=[e for e in b['events'] if e]
ids=set(e['id'] for e in ea)
def tree(e): return e['pages'][0]['image']['characterName'].startswith(('!$Pine','!$Tree','!$Big'))
best=(-9,None);bt=(-9,None)
for x0 in range(0,120-26):
    for y0 in range(0,120-14):
        f=lambda e:x0<=e['x']<x0+27 and y0<=e['y']<y0+15
        net=sum(map(f,eb))-sum(map(f,ea))
        nt=sum(1 for e in eb if f(e) and tree(e) and e['id'] not in ids)
        nt2=sum(1 for e in eb if f(e) and tree(e))-sum(1 for e in ea if f(e) and tree(e))
        if net>best[0]: best=(net,(x0,y0))
        if max(nt,nt2)>bt[0]: bt=(max(nt,nt2),(x0,y0))
print('max net events',best,'max new/net trees',bt)
