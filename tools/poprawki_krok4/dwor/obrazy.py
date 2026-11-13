import os
from PIL import Image, ImageDraw, ImageFont
OUT='../../../docs/audyt_map/poprawki/krok4/Map024'; os.makedirs(OUT,exist_ok=True)
F=ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf",18)
N={"04_05_bruk_i_droga":"Poprawka 4 + 5: luzne plytki bruku zdjete, droga stalej szerokosci",
"06_podworko_ze_studnia":"Poprawka 6: podworko ze studnia - plot zamkniety, brama, drzewa odsuniete",
"07_plat_trawy":"Poprawka 7: plat cienia trawy zaokraglony",
"08_ruina":"Poprawka 8: ruina z kolumn i plyty na rownym gruncie, bez czarnej dziury",
"09_gaje":"Poprawka 9: sosny osobno, sad w siatce",
"10_kwiaty":"Poprawka 10: kwiaty w kilku zagonach",
"02b_morze_polnoc_srodek":"Poprawka 2: morze polnoc - w grze brzeg juz zaokraglony, BEZ ZMIAN"}
sheet=[]
for k,t in N.items():
    a=Image.open('tmp/zdjecia/before/%s.png'%k).convert('RGB'); b=Image.open('tmp/zdjecia/after/%s.png'%k).convert('RGB')
    w=a.width*2+6; im=Image.new('RGB',(w,a.height+30),(255,255,255)); d=ImageDraw.Draw(im); d.rectangle([0,0,w,29],fill=(24,22,30))
    d.text((8,5),"%s   |   LEWO: przed   PRAWO: po"%t,font=F,fill=(255,220,90)); im.paste(a,(0,30)); im.paste(b,(a.width+6,30))
    im.save(OUT+'/gra_%s.png'%k); sheet.append(im)
tw=1600; rows=[i.resize((tw,int(i.height*tw/i.width)),Image.LANCZOS) for i in sheet]
S=Image.new('RGB',(tw,sum(r.height+8 for r in rows)),(255,255,255)); y=0
for r in rows: S.paste(r,(0,y)); y+=r.height+8
S.save(OUT+'/zestawienie_gra.png')
