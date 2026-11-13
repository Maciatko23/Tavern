import json,sys
m=json.load(open(sys.argv[6] if len(sys.argv)>6 else r'C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/data/Map024.json',encoding='utf-8'))
W,H=m['width'],m['height'];d=m['data']
x0,y0,x1,y1=[int(a) for a in sys.argv[1:5]]
z=int(sys.argv[5])
sym={16:'.',17:'d',27:'#',24:'s',25:'s',26:'s',40:'=',39:'=',43:'B',21:'o',28:'~'}
ev={}
for e in m['events']:
    if e: ev[(e['x'],e['y'])]='E'
print('    '+''.join(str(x%10) for x in range(x0,x1+1)))
for y in range(y0,y1+1):
    r=''
    for x in range(x0,x1+1):
        t=d[(z*H+y)*W+x]
        c=' ' if t==0 else (sym.get((t-2048)//48,'?') if t>=2048 else ('a' if t>=1536 else 't'))
        if z==0 and (x,y) in ev: c='E' if c in '.#' else c
        r+=c
    print('%3d '%y+r)
