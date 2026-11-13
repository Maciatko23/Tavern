import sys,json
sys.path.insert(0,'tools/poprawki_krok2'); sys.path.insert(0,'tools/mapy')
import zaokraglij as Z, numpy as np, mapylib as L
ex=[e for e in json.load(open('tools/mapy/estetyka_wyjatki.json',encoding='utf-8')) if e['powod'].startswith('Krok 2')]
cache={}
out=[]
for e in ex:
    mid=e['mapa']; x,y=e['x'],e['y']
    if mid not in cache:
        m=json.load(open('tools/poprawki_krok2/staging/data/Map%03d.json'%mid,encoding='utf-8')); cache[mid]=(m,)
    m=cache[mid][0]; W,H=m['width'],m['height']; n=W*H; D=m['data']
    def T(z,xx,yy): return D[z*n+yy*W+xx] if 0<=xx<W and 0<=yy<H else 0
    c=set()
    for dy in (-1,0,1):
        for dx in (-1,0,1):
            xx,yy=x+dx,y+dy
            k1=(T(1,xx,yy)-2048)//48 if T(1,xx,yy)>=2048 else None
            if k1==47: c.add('klif')
            elif k1 in (22,30,38,23): c.add('plot/mur')
            elif k1 in (1,2) or (k1 is not None and k1<16): c.add('woda')
            elif k1 in (36,37,39): c.add('droga/bruk')
            elif k1 in (17,24,25,26,27): c.add('nakladka')
            k0=(T(0,xx,yy)-2048)//48 if T(0,xx,yy)>=2048 else None
            if k0 is not None and k0 not in Z.NAT: c.add('k0=%d'%k0)
            for z in (2,3):
                t=T(z,xx,yy)
                if t and t<2048: c.add('kafelB-E z%d'%z)
    if x<5 or y<5 or x>W-6 or y>H-6: c.add('krawedz')
    out.append((mid,x,y,sorted(c)))
    print(mid,x,y,sorted(c))
