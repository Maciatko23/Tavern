import sys,os
sys.path.insert(0,'../..')
import krajobraz as KJ
L=KJ.L
mp=L.Mapa(24,path=os.path.abspath('staging/data/Map024.json'))
reg=tuple(int(v) for v in sys.argv[1].split(','))
sc=float(sys.argv[3]) if len(sys.argv)>3 else 0.5
L.render(mp,region=reg,scale=sc).save(sys.argv[2])
