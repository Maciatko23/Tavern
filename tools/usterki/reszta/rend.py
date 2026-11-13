import sys,os;sys.path.insert(0,'tools/mapy');import mapylib as L
mid=int(sys.argv[1]);x0,y0,x1,y1=map(int,sys.argv[2:6]);out=sys.argv[6];src=sys.argv[7] if len(sys.argv)>7 else None
sc=float(os.environ.get('SC','0.5'))
mp=L.Mapa(mid,path=src) if src else L.Mapa(mid)
im=L.render(mp,region=(x0,y0,x1,y1),scale=sc)
im.convert('RGB').save(out)
