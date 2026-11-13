import sys, os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..','..'))
sys.path.insert(0,os.path.join(ROOT,'tools','mapy'))
import mapylib as L
x0,y0,x1,y1=map(int,sys.argv[1:5]); sc=float(sys.argv[5]); out=sys.argv[6]
src=sys.argv[7] if len(sys.argv)>7 else os.path.join(HERE,'staging','data','Map162.json')
mp=L.Mapa(162,path=src)
im=L.render(mp,region=(x0,y0,x1,y1),scale=sc); im.convert('RGB').save(os.path.join(HERE,'tmp',out)); print(im.size)
