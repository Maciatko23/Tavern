import sys;sys.path.insert(0,'tools/mapy');import mapylib as L
mid=int(sys.argv[1]);x0,y0,x1,y1=map(int,sys.argv[2:6]); src=sys.argv[6] if len(sys.argv)>6 else None
mp=L.Mapa(mid,path=src) if src else L.Mapa(mid)
ch={}
def c(t):
    if t==0: return ' '
    if t>=2048: 
        k=(t-2048)//48
        return chr(ord('A')+k) if k<26 else chr(ord('a')+k-26) if k<52 else str(k%10)
    return '#'
print('    '+''.join(str(x//10%10) if x%10==0 else ' ' for x in range(x0,x1+1)))
for y in range(y0,y1+1):
    print('%3d '%y+''.join(c(mp.t(0,x,y)) for x in range(x0,x1+1)))
