# -*- coding: utf-8 -*-
# usage: rend.py MAP x0 y0 x1 y1 scale out.png [data|staging] [grid]
import sys, os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..'))
sys.path.insert(0,os.path.join(ROOT,'tools','mapy'))
import mapylib as L
from PIL import Image
mid=int(sys.argv[1]); x0,y0,x1,y1=map(int,sys.argv[2:6]); sc=float(sys.argv[6]); out=sys.argv[7]
src='staging' if 'staging' in sys.argv[8:] else 'data'
p=os.path.join(ROOT,'data','Map%03d.json'%mid) if src=='data' else os.path.join(HERE,'staging','data','Map%03d.json'%mid)
mp=L.Mapa(mid,path=p)
im=L.render(mp,region=(x0,y0,x1,y1),grid=('grid' in sys.argv))
if sc!=1: im=im.resize((int(im.width*sc),int(im.height*sc)),Image.LANCZOS)
im.convert('RGB').save(os.path.join(HERE,'tmp',out)); print(im.size)
