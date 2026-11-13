# usage: gaps.py MAP [staging]  -> fence gaps (1-4 cells) in rows/columns with / without gate posts
import sys, os, json
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..'))
mid=int(sys.argv[1])
p=os.path.join(HERE,'staging','data','Map%03d.json'%mid) if 'staging' in sys.argv[2:] else os.path.join(ROOT,'data','Map%03d.json'%mid)
m=json.load(open(p,encoding='utf8')); W,H=m['width'],m['height']; D=m['data']
def t(z,x,y): return D[(z*H+y)*W+x] if 0<=x<W and 0<=y<H else 0
def fence(x,y):
    return any(t(z,x,y)>=2048 and (t(z,x,y)-2048)//48==22 for z in (0,1))
# posts
posts={}
for y in range(H):
    for x in range(W):
        for z in (2,3):
            v=t(z,x,y)
            if v in (208,209,216,217): posts[(x,y)]=v
print('posts',len(posts))
res=[]
def run_h(x,y): return fence(x,y) and (fence(x-1,y) or fence(x+1,y))
def run_v(x,y): return fence(x,y) and (fence(x,y-1) or fence(x,y+1))
for y in range(H):
    for x in range(W):
        for dx,dy,pa,pb,rn in ((1,0,209,208,run_h),(0,1,216,217,run_v)):
            if not rn(x,y) or fence(x-dx,y-dy) or not fence(x-dx*0,y-dy*0): pass
            if not fence(x,y) or fence(x-dx,y-dy) is False and False: pass
            if not fence(x,y): continue
            if fence(x+dx,y+dy): continue
            if not fence(x-dx,y-dy): continue      # (a run needs >=2 cells ending here)
            for gap in range(1,6):
                x2,y2=x+dx*(gap+1),y+dy*(gap+1)
                if fence(x2,y2):
                    if not fence(x2+dx,y2+dy): break
                    mid_=[(x+dx*i,y+dy*i) for i in range(1,gap+1)]
                    ok=(posts.get((x,y))==pa, posts.get((x2,y2))==pb)
                    res.append(((x,y),(x2,y2),gap,ok)); break
                if any(fence(x+dx*i+dy,y+dy*i+dx) and fence(x+dx*i-dy,y+dy*i-dx) for i in (gap+1,)): pass
bad=[r for r in res if not all(r[3])]
print('gaps',len(res),'without both posts',len(bad))
for r in res: print(r[0],r[1],'gap',r[2],'posts',r[3],'' if all(r[3]) else '  <<<')
