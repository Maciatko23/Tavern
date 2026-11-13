import subprocess, os, sys
from PIL import Image, ImageDraw
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..'))
OUT=os.path.join(ROOT,'docs','usterki','miasto'); os.makedirs(OUT,exist_ok=True)
# (file, map, camx, camy, caption)
P=[('w43_farrier_roof',8,76,22,'wiersz 43: plot/belka na dachu kuznii podkuwacza - dach strzechy gladki'),
   ('w96_102_barn_roofs',8,47,74,'wiersze 96, 102: plot przez dach stodoly; dziura w polaci dachu (kafel) - dach zamkniety'),
   ('w61_street_shadow',8,90,43,'wiersz 61, 07/40/51/90/94/106...: czarne prostokaty (warstwa 4) usuniete; pozostaly cien to Cienie.js (JS, nie ruszany)'),
   ('w05_garden',8,0,0,'wiersz 05: luka w plocie ogrodka - domknieta'),
   ('w77_78_garden',8,0,60,'wiersze 77/78/86/87/98/109/111/115: luki w plotach dostaly slupki bramek; ogrod: przejscie przy plocie, pojedyncze przegrody'),
   ('w70_grass_strip',8,17,50,'wiersz 70: prostokatny pas trawy w brukowej ulicy - nieregularny'),
   ('w85_yard',8,50,58,'wiersz 85: prostokatny plac pod beczkami - zaokraglony'),
   ('w18_22_35_38_trees',8,0,19,'wiersze 18/22/35/38: korony drzew na dachu/murze - mniejsze, odsuniete'),
   ('w41_tree_wall',8,21,31,'wiersz 41: korona zielonego drzewa na murze za domkiem - usunieta'),
   ('w97_lone_fence',8,64,76,'wiersz 97: samotny plot 5 kratek - usuniety'),
  ]
cams=lambda ps:";".join("%d,%d"%(p[2],p[3]) for p in ps)
def run(tag,overlay,port):
    env=dict(os.environ,MAP='8',CAMS=cams(P),OUT=os.path.join(HERE,tag),TAG='p',CDP_PORT=str(port),S='0.75')
    if overlay: env['OVERLAY']='tools/usterki/miasto/staging'
    subprocess.run(['node','shot.js'],cwd=HERE,env=env,capture_output=True,timeout=400)
run('przed/pary',False,9800); run('po/pary',True,9801)
for f,m,x,y,c in P:
    a=Image.open(os.path.join(HERE,'przed/pary','p_%d_%d.png'%(x,y))).convert('RGB'); b=Image.open(os.path.join(HERE,'po/pary','p_%d_%d.png'%(x,y))).convert('RGB')
    im=Image.new('RGB',(a.width*2+10,a.height+28),(20,20,20)); im.paste(a,(0,28)); im.paste(b,(a.width+10,28))
    d=ImageDraw.Draw(im); d.text((6,8),'PRZED   |   '+c+'   |   PO (po prawej)',fill=(255,255,0)); im.save(os.path.join(OUT,f+'.png'))
print('ok')
