import json,sys
src=sys.argv[6] if len(sys.argv)>6 else 'data/Map162.json'
m=json.load(open(src,encoding='utf-8'));W=m['width'];d=m['data'];n=W*m['height']
x0,y0,x1,y1=map(int,sys.argv[1:5]);z=int(sys.argv[5])
print('    '+' '.join('%3d'%x for x in range(x0,x1+1)))
for y in range(y0,y1+1):
    r=[]
    for x in range(x0,x1+1):
        t=d[z*n+y*W+x]
        r.append('  .' if not t else '%3d'%((t-2048)//48) if t>=2048 else ' T%d'%t if False else '  t')
    print('%3d '%y+' '.join(r))
