import sys,json; sys.path.insert(0,'C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/tools/mapy')
import mapylib
def shot(mid,reg,out,scale,raw=None):
    mp=mapylib.Mapa(mid,raw=raw) if raw else mapylib.Mapa(mid)
    im=mapylib.render(mp,region=reg,scale=scale); im.convert('RGB').save(out); print(out,im.size)
if __name__=='__main__':
    mid=int(sys.argv[1]); reg=tuple(map(int,sys.argv[2].split(','))) if sys.argv[2]!='-' else None
    shot(mid,reg,sys.argv[3],float(sys.argv[4]))
