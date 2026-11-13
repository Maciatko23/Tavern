# -*- coding: utf-8 -*-
"""writes tools/tawerna2/uklad.txt: the facts of the staged maps (positions of everything the code looks for)"""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, check
out = ["UKLAD NOWYCH MAP (druga metoda: wyciete kawalki starych map). Pliki: tools/tawerna2/staging/data/Map001|025|026.json, polozenia.json, layout025.json, layout026.json."]
m = check.load(1)
out.append("Map001 63x55. Stary blok x36..98,y23..54 przesuniety o -36 w x (y bez zmian): wejscie z miasta: ladowanie (14,53) kier 8; wyjscia (13..15,54); wielka sala (stare 37..63,27..44) = x1..27,y27..44; bar z Borgarem; scena (stare 65..83) = x29..47,y27..38; pokoj gier (kosci/silowanie) x48..62,y24..38; rzutki/palarnia x28..62,y40..53; schody w gore: zachodnie (1..3,47), wschodnie (25..27,47) -> Map025 (48,52,8).")
out.append("Gorny rzad: kuchnia (stara piekarnia? nie: stara kuchnia) x0..18,y0..17; piekarnia x18..28; SPIZARNIA x28..36 y0..17 (drzwi x32, obrazek 'Stare drzwi' ev209 (32,19), cegla ev9 w spizarni); sluzba x36..48; magazyn x48..62,y11..23; POKOJ BORGARA (stary gabinet) x48..62,y0..11 (wejscie z magazynu); korytarz y17..23 x0..48.")
for e in m["events"]:
    if not e: continue
    n = e["name"]; tag = re.findall(r"<Tavern:[^>]*>", json.dumps([c["parameters"][0] for p in e["pages"] for c in p["list"] if c["code"] in (108, 408)], ensure_ascii=False))
    if e["id"] in (1, 2, 3, 4, 9, 52, 209, 349, 360, 19, 21) or tag or n.startswith(("Luźna", "Stare drzwi", "Miejsce: podr", "Miejsce: komp", "Miejsce: graj", "Miejsce: med", "Wyjście", "Schody", "Lada")):
        out.append("  Map001 ev%d %s (%d,%d) %s" % (e["id"], n, e["x"], e["y"], tag[:1]))
out.append("  Map001 'Gosc stolowy': %d zdarzen ids %s" % (len([e for e in m["events"] if e and e["name"].startswith("Gość")]), sorted(e["id"] for e in m["events"] if e and e["name"].startswith("Gość"))))
m = check.load(25)
out.append("Map025 63x55 (pietro gosci) = ten sam prostokat co Map001; prostokaty wnetrz pokoi: " + open(os.path.join(lib.STAGING, "layout025.json")).read().replace("\n", " "))
out.append("  Szkielet: pasmo N1 (drzwi w dol, y0..12): pokoje 3,1,2,4,5,12; korytarz C1 y12..20 (podloga y17..19); S1 (drzwi w gore, y20..32): 6 | 10 | lazienka,9 (halle laczace x11..17 i x30..33); N2 (drzwi w dol, y32..45): 8 | 7 | komnata,11; dol: hol schodowy x0..28 (skrzynie schodowe x0..4 i x24..28, y45..53) + korytarz wschodni x28..62 y45..54. Schody: Map001 gora (1..3,47)/(25..27,47) -> Map025 (x,53); Map025 zach. skrzynia (1..3,47) = w gore do Map026 (zlota krata (2,49)), wsch. skrzynia (25..27,47) = w dol do Map001 (x,53,2); Map026 obie skrzynie w dol do Map025 (x,53,2).")
for e in m["events"]:
    if e and re.match(r"(Drzwi|Wejście) -> |Schody|Złota|Dzwonek", e["name"]) or (e and e["id"] >= 360): out.append("  Map025 ev%d %s (%d,%d) %s" % (e["id"], e["name"], e["x"], e["y"], e["note"][:30]))
out.append("Map026 63x55: N1 (y0..18) lordb,lorda,lib,s2a,s2b; C1 y18..26; S1 (y26..45) s3a | s4a(Zloty salonik),s4b(sypialnia),salon; hol schodowy i taras na dole. " + open(os.path.join(lib.STAGING, "layout026.json")).read().replace("\n", " "))
m = check.load(26)
for e in m["events"]:
    if e and re.match(r"(Drzwi|Wejście|Schody)", e["name"]): out.append("  Map026 ev%d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
out.append("polozenia.json: " + open(os.path.join(lib.STAGING, "polozenia.json")).read().replace("\n", " "))
open(os.path.join(lib.HERE, "uklad.txt"), "w", encoding="utf-8").write("\n".join(out))
print("\n".join(out)[:200])
