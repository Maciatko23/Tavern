import sys,json
sys.path.insert(0,'tools/poprawki_krok2'); import zaokraglij as Z, numpy as np
mid=int(sys.argv[1]); x,y=int(sys.argv[2]),int(sys.argv[3])
m=json.load(open(''+(sys.argv[4] if len(sys.argv)>4 else 'data')+'/Map%03d.json'%mid,encoding='utf-8'))
K0,nat0,nf=Z.ochronione(m,mid,())
W,H=m['width'],m['height']; n=W*H
for yy in range(y-4,y+5):
    print(''.join(('#' if nf[yy,xx] else '.')+('%2d'%K0[yy,xx]) +' ' for xx in range(x-5,x+6)), ' L1:',[ (m['data'][n+yy*W+xx]-2048)//48 if m['data'][n+yy*W+xx]>=2048 else m['data'][n+yy*W+xx] for xx in range(x-2,x+3)])
