# usage: dumpk.py MAP z x0 y0 x1 y1 [staging]   -> prints autotile kind (A) or tile id per cell
import sys, os, json
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..'))
mid=int(sys.argv[1]); z=int(sys.argv[2]); x0,y0,x1,y1=map(int,sys.argv[3:7])
p=os.path.join(HERE,'staging','data','Map%03d.json'%mid) if 'staging' in sys.argv[7:] else os.path.join(ROOT,'data','Map%03d.json'%mid)
m=json.load(open(p,encoding='utf8')); W,H=m['width'],m['height']
print('     '+' '.join('%4d'%x for x in range(x0,x1+1)))
for y in range(y0,y1+1):
    row=[]
    for x in range(x0,x1+1):
        t=m['data'][(z*H+y)*W+x]
        row.append('   .' if t==0 else ('k%-3d'%((t-2048)//48) if t>=2048 else '%4d'%t))
    print('%4d '%y+' '.join(row))
