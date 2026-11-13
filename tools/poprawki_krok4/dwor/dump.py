import json,sys
m=json.load(open(r'C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/data/Map024.json',encoding='utf-8'))
W,H=m['width'],m['height'];d=m['data']
x0,y0,x1,y1=[int(a) for a in sys.argv[1:5]]
zs=[int(a) for a in sys.argv[5].split(',')] if len(sys.argv)>5 else [0,1,2,3,4,5]
def f(t):
    if t==0: return '  .  '
    if t>=2048: return '%2d:%2d'%((t-2048)//48,(t-2048)%48) if 0 else '%2d.%02d'%((t-2048)//48,(t-2048)%48)
    if t>=1536: return 'A5-%03d'%(t-1536)
    return 'x%04d'%t if t>=0 else '?'
for z in zs:
    print('layer',z)
    print('     '+' '.join('%5d'%x for x in range(x0,x1+1)))
    for y in range(y0,y1+1):
        print('%3d: '%y+' '.join('%5s'%(f(d[(z*H+y)*W+x]) ) for x in range(x0,x1+1)))
