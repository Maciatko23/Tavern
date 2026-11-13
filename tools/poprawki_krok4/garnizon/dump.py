import json,sys
m=json.load(open('data/Map162.json',encoding='utf-8')) if len(sys.argv)<6 else json.load(open(sys.argv[5],encoding='utf-8'))
W,H=m['width'],m['height'];d=m['data'];n=W*H
x0,y0,x1,y1=map(int,sys.argv[1:5])
for z in range(6):
    cells=[(x,y) for y in range(y0,y1+1) for x in range(x0,x1+1) if d[z*n+y*W+x]]
    if not cells: continue
    print('--- layer',z)
    print('     '+' '.join('%5d'%x for x in range(x0,x1+1)))
    for y in range(y0,y1+1):
        print('%4d '%y+' '.join('%5s'%(d[z*n+y*W+x] or '.') for x in range(x0,x1+1)))
