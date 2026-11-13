import sys; sys.path.insert(0,'C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/tools/miasto3')
from mlib import *
import mapylib, json
ts=load(ROOT+"data/Tilesets.json")
raw=load(r'C:\Users\macie\OneDrive\Dokumenty\RMMZ\Tawerna_archiwum_2026-11-08\kruczogrod_miasto_20261108_154456\data\Map008.json')
t=ts[11]
z=mapylib.Zestaw(11); z.id=11; z.pliki=t['tilesetNames']; z.flags=list(t['flags'])+[0]*(8192-len(t['flags'])); z._sheets={};z._tiles={};z._alpha={};z._bbox={}
mapylib.zestaw=lambda i: z
mp=mapylib.Mapa(8,raw=raw); mp.zest=z
x0,y0,x1,y1=map(int,sys.argv[1:5]); sc=float(sys.argv[5])
im=mapylib.render(mp,region=(x0,y0,x1,y1),scale=sc); im.convert("RGB").save(sys.argv[6]); print(im.size)
