# -*- coding: utf-8 -*-
# usage: python -I det.py [live|staging] out.json   -> detectors (tools/przeglad_ekranow/detektory.py) for 111 and 162
import sys, os, json
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..'))
mode=sys.argv[1]; out=sys.argv[2]
sys.argv=[sys.argv[0]]+(['--zywe'] if mode=='live' else ['--staging',HERE+os.sep+'staging'])
sys.path.insert(0,os.path.join(ROOT,'tools','przeglad_ekranow'))
import detektory as D
import estetyka as E_, swiat_styki as S
sw=S.Swiat(); allh=[]
for mid in (111,162):
    h,err=D.przetworz(mid,E_,sw); allh+=h; print(mid,len(h),err)
json.dump(allh,open(os.path.join(HERE,'tmp',out),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
