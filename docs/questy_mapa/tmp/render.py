import json,sys
from PIL import Image, ImageDraw, ImageFont
mid=sys.argv[1]; S=int(sys.argv[2]) if len(sys.argv)>2 else 6
d=json.load(open(f'mapdump_{mid}.json',encoding='utf-8'))
w,h=d['w'],d['h']
im=Image.new('RGB',(w*S+20,h*S+20),(30,30,30))
dr=ImageDraw.Draw(im)
for y,row in enumerate(d['rows']):
    for x,c in enumerate(row):
        col={'#':(40,50,70),'.':(120,170,100),'e':(200,150,60)}[c]
        dr.rectangle([20+x*S,20+y*S,20+x*S+S-1,20+y*S+S-1],fill=col)
import re
occ=set((e[2],e[3]) for e in d['ev'] if not re.match(r'^(Miejsce|Znacznik)',e[1]))
for (x,y) in occ:
    if d['rows'][y][x]=='.': dr.rectangle([20+x*S,20+y*S,20+x*S+S-1,20+y*S+S-1],fill=(40,110,60))
nat=re.compile(r'^(Sosna|Małe drzewo|Splot|Wysoki|Pieniek|Kłoda|Dzika|Omszały|Pęknięty|Płaski|Ruda|Zasiek|Skała|Skalna|Wielki|Martwe|Ostry|Sterta|Dwie|Ogromny|Kamienny|Poszarpana|Drzewo|Gruz|Skupisko|Szeroki|Kolczaste|Suchy|Kłąb|Gęste|Menhir|Stos|Długa|Wysoka|Duże)')
for e in d['ev']:
    if nat.match(e[1]) or e[1]=='' : continue
    x,y=e[2],e[3]
    dr.rectangle([20+x*S,20+y*S,20+x*S+S-1,20+y*S+S-1],fill=(220,40,40))
for k in range(0,w,10):
    dr.line([20+k*S,18,20+k*S,20+h*S],fill=(255,255,255),width=1); dr.text((20+k*S+1,4),str(k),fill=(255,255,255))
for k in range(0,h,10):
    dr.line([18,20+k*S,20+w*S,20+k*S],fill=(255,255,255),width=1); dr.text((1,20+k*S+1),str(k),fill=(255,255,255))
im.save(f'render_{mid}.png')
