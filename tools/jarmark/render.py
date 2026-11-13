import sys; sys.path.insert(0,'tools/mapy')
import mapylib
x0,y0,x1,y1,out=sys.argv[1:6]; ov=sys.argv[6] if len(sys.argv)>6 else 'tools/jarmark/overlay/data/Map008.json'
mp=mapylib.Mapa(int(sys.argv[7]) if len(sys.argv)>7 else 8,path=ov)
im=mapylib.render(mp,region=(int(x0),int(y0),int(x1),int(y1)))
im.save(out); print(im.size)
