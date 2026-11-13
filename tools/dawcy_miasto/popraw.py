# -*- coding: utf-8 -*-
"""Dawcy zadan w miescie i tawernie (docs/zadania_nowe/dawcy_w_miescie.md): STAGING. Nic nie trafia do data/ ani js/.
Czyta pliki JS / teksty z js/ (binarnie, konce linii jak w pliku); pisze TYLKO do tools/dawcy_miasto/staging/{js/plugins,js/teksty,data,tests}/
(kasuje je na poczatku). Zamiana dokladnego lancucha (P / T): brak dopasowania = STOP. Mapy: ten pakiet ich NIE rusza (miejsca gosci w
tawernie sa w TownLifeData.SPOTS_BY_MAP[1], a nie w znacznikach "Miejsce:"), wiec data/ zostaje puste.
  python tools/dawcy_miasto/popraw.py
Nakladka do testow: GAME_OVERLAY=tools/dawcy_miasto/staging GAME_OVERLAY_JS=1"""
import os, sys, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

FILES = {}
def _get(rel):
    if rel not in FILES:
        raw = open(os.path.join(ROOT, *rel.split("/")), "rb").read()
        FILES[rel] = {"b": raw, "crlf": b"\r\n" in raw}
    return FILES[rel]
def P(rel, old, new, n=1):
    """zamiana dokladnego lancucha (LF w argumentach; CRLF dopasowany do pliku); STOP gdy liczba dopasowan != n"""
    f = _get(rel)
    o, nw = old.encode("utf-8"), new.encode("utf-8")
    if f["crlf"]: o, nw = o.replace(b"\n", b"\r\n"), nw.replace(b"\n", b"\r\n")
    c = f["b"].count(o)
    if c != n: raise SystemExit("STOP: %s: %d dopasowan zamiast %d dla:\n%s" % (rel, c, n, old[:300]))
    f["b"] = f["b"].replace(o, nw)
def T(rel, key, old, new):
    """linia tekstu `key = ...`: musi byc dokladnie jedna i zawierac `old`; cala wartosc zamieniana na `new`"""
    f = _get(rel)
    pre = ("\n" + key + " = ").encode("utf-8")
    b = f["b"]
    if b.count(pre) != 1: raise SystemExit("STOP: %s: %d wystapien klucza %s" % (rel, b.count(pre), key))
    i = b.index(pre) + len(pre)
    j = b.index(b"\n", i)
    if b[j - 1:j] == b"\r": j -= 1
    cur = b[i:j].decode("utf-8")
    if old not in cur: raise SystemExit("STOP: %s: %s nie zawiera %r (jest %r)" % (rel, key, old, cur))
    f["b"] = b[:i] + new.encode("utf-8") + b[j:]
PL = lambda n: "js/plugins/%s.js" % n
TX = lambda n: "js/teksty/%s.txt" % n

# =========================================================================================================================
# 1. TownLife.js: a visitor with its own place in the tavern (resident.indoor.tawerna = "gosc_<key>", a spot of TownLifeData.SPOTS_BY_MAP[1])
#    does not take a number of the gosc_N places (the numbers of Janek, Eryk Sowa ... stay as they were) and its place wins over the number
# =========================================================================================================================
P(PL("TownLife"), 'const GUESTS = RES.filter(r => r.plan.some(p => p[2] === "tawerna")).map(r => r.key);',
  'const GUESTS = RES.filter(r => !(r.indoor && r.indoor.tawerna) && r.plan.some(p => p[2] === "tawerna")).map(r => r.key);   // (2026-11-11 dawcy_miasto: a visitor with its own place - indoor.tawerna - is not counted)')
P(PL("TownLife"), 'const indoorName = (res, e) => (res.away && res.away.includes(e.where) ? null : e.where === "tawerna" ? "gosc_" + (GUESTS.indexOf(res.key) + 1)\n        : res.indoor && res.indoor[e.where] ? res.indoor[e.where] : res.key + "_wnetrze");',
  'const indoorName = (res, e) => (res.away && res.away.includes(e.where) ? null : res.indoor && res.indoor[e.where] ? res.indoor[e.where]\n        : e.where === "tawerna" ? "gosc_" + (GUESTS.indexOf(res.key) + 1) : res.key + "_wnetrze");')

# Wrak.js counts the guests the same way (the castaway's number): the same exclusion
P(PL("Wrak"), 'const guests = L.RESIDENTS.filter(r => r.plan.some(p => p[2] === "tawerna")).map(r => r.key);',
  'const guests = L.RESIDENTS.filter(r => !(r.indoor && r.indoor.tawerna) && r.plan.some(p => p[2] === "tawerna")).map(r => r.key);   // (2026-11-11 dawcy_miasto: as TownLife\'s GUESTS)')

# =========================================================================================================================
# 2. TownLife_Data.js: the visits (plan entries "inside tawerna" in the evening) and the visitors' places in the tavern
# =========================================================================================================================
TLD = PL("TownLife_Data")
def indoor(spot): return 'indoor: { tawerna: "%s" },' % spot
# Marta Ługowa (the tavern's laundry): 17:30-20
P(TLD, 'key: "praczka", name: "", title: "", sheet: "$Npc_Praczka", map: 111,\n            plan: [[0, "inside", "praczka_drzwi"], [5, "work", "pranie"], [11, "wander", "plac"], [12.5, "work", "pranie"], [17, "wander", "studnia_sucha"],\n                   [19, "inside", "praczka_drzwi"]],',
  'key: "praczka", name: "", title: "", sheet: "$Npc_Praczka", map: 111, ' + indoor("gosc_praczka") + '\n            plan: [[0, "inside", "praczka_drzwi"], [5, "work", "pranie"], [11, "wander", "plac"], [12.5, "work", "pranie"], [16.5, "wander", "studnia_sucha"],\n                   [17.5, "inside", "tawerna"], [20, "inside", "praczka_drzwi"]],')
# Franek goes with his mother: 17:30-19:30
P(TLD, 'key: "franek", name: "", title: "", sheet: "$Npc_Franek", map: 111, speed: 4,\n            plan: [[0, "inside", "praczka_drzwi"], [7, "wander", "zabawa"], [10, "wander", "kram"], [12, "wander", "pranie"], [14, "wander", "brama_zach"],\n                   [16, "wander", "zabawa"], [19.5, "inside", "praczka_drzwi"]],',
  'key: "franek", name: "", title: "", sheet: "$Npc_Franek", map: 111, speed: 4, ' + indoor("gosc_franek") + '\n            plan: [[0, "inside", "praczka_drzwi"], [7, "wander", "zabawa"], [10, "wander", "kram"], [12, "wander", "pranie"], [14, "wander", "brama_zach"],\n                   [16, "wander", "zabawa"], [17.5, "inside", "tawerna"], [19.5, "inside", "praczka_drzwi"]],')
# Zbych Smolarz: 17:30-21:30 (on the kiln days his alt plan on Map004 stays as it was)
P(TLD, 'key: "drwal", name: "", title: "", sheet: "$Npc_Drwal", map: 111,\n            plan: [[0, "inside", "drwal_drzwi"], [5, "work", "drewutnia"], [10, "inside", "skraj_lasu"], [15, "work", "drewutnia"], [19, "wander", "namioty"],\n                   [21.5, "inside", "drwal_drzwi"]],',
  'key: "drwal", name: "", title: "", sheet: "$Npc_Drwal", map: 111, ' + indoor("gosc_drwal") + '\n            plan: [[0, "inside", "drwal_drzwi"], [5, "work", "drewutnia"], [10, "inside", "skraj_lasu"], [15, "work", "drewutnia"], [17.5, "inside", "tawerna"],\n                   [21.5, "inside", "drwal_drzwi"]],')
# Rysiek Sidło: 19:30-22:30 (the night in the woods by his snares afterwards)
P(TLD, 'key: "klusownik", name: "", title: "", sheet: "$Npc_Klusownik", map: 111, speed: 4,\n            plan: [[0, "inside", "skraj_lasu"], [4.5, "inside", "klusownik_drzwi"], [13, "wander", "plac"], [15, "wander", "kram"], [17, "wander", "namioty"],\n                   [20, "inside", "skraj_lasu"]],',
  'key: "klusownik", name: "", title: "", sheet: "$Npc_Klusownik", map: 111, speed: 4,\n            plan: [[0, "inside", "skraj_lasu"], [4.5, "inside", "klusownik_drzwi"], [13, "wander", "plac"], [15, "wander", "kram"], [17, "wander", "namioty"],\n                   [19.5, "inside", "tawerna"], [22.5, "inside", "skraj_lasu"]],')
P(TLD, 'indoor: { skraj_lasu: "klusownik_las" },', 'indoor: { skraj_lasu: "klusownik_las", tawerna: "gosc_klusownik" },')   # (he already has an indoor place: the woods)
# Babka Jadwiga: 18-21
P(TLD, 'key: "znachorka", name: "", title: "", sheet: "$Npc_Znachorka", map: 111, speed: 2,\n            plan: [[0, "inside", "znachorka_drzwi"], [6, "work", "ziola"], [10, "wander", "kapliczka"], [12, "work", "ziola"], [16, "stand", "kapliczka"],\n                   [18, "inside", "znachorka_drzwi"]],',
  'key: "znachorka", name: "", title: "", sheet: "$Npc_Znachorka", map: 111, speed: 2, ' + indoor("gosc_znachorka") + '\n            plan: [[0, "inside", "znachorka_drzwi"], [6, "work", "ziola"], [10, "wander", "kapliczka"], [12, "work", "ziola"], [15.5, "stand", "kapliczka"],\n                   [18, "inside", "tawerna"], [21, "inside", "znachorka_drzwi"]],')
# Józek Łata: 19-22
P(TLD, 'key: "szmaciarz", name: "", title: "", sheet: "$Npc_Szmaciarz", map: 111,\n            plan: [[0, "inside", "szmaciarz_drzwi"], [7, "stand", "kram"], [12, "wander", "brama_zach"], [13, "stand", "kram"], [18, "wander", "plac"],\n                   [20, "inside", "szmaciarz_drzwi"]],',
  'key: "szmaciarz", name: "", title: "", sheet: "$Npc_Szmaciarz", map: 111, ' + indoor("gosc_szmaciarz") + '\n            plan: [[0, "inside", "szmaciarz_drzwi"], [7, "stand", "kram"], [12, "wander", "brama_zach"], [13, "stand", "kram"], [18, "wander", "plac"],\n                   [19, "inside", "tawerna"], [22, "inside", "szmaciarz_drzwi"]],')
# Darin z Kontynentu: 17:30-21:30
P(TLD, 'key: "uchodzca", name: "", title: "", sheet: "$Npc_Uchodzca", map: 111,\n            plan: [[0, "inside", "uchodzcy_drzwi"], [6, "wander", "namioty"], [8, "wander", "brama_zach"], [12, "work", "drewutnia"], [15, "wander", "plac"],\n                   [18, "stand", "namioty"], [22, "inside", "uchodzcy_drzwi"]],',
  'key: "uchodzca", name: "", title: "", sheet: "$Npc_Uchodzca", map: 111, ' + indoor("gosc_uchodzca") + '\n            plan: [[0, "inside", "uchodzcy_drzwi"], [6, "wander", "namioty"], [8, "wander", "brama_zach"], [12, "work", "drewutnia"], [15, "wander", "plac"],\n                   [17.5, "inside", "tawerna"], [21.5, "inside", "uchodzcy_drzwi"]],')
# Sambor Kwit (the customs officer, off duty): 19:30-21:30
P(TLD, 'key: "celnik", name: "", title: "", sheet: "$Npc_Celnik", map: 125, speed: 2,\n            plan: [[0, "inside", "komora_drzwi"], [9, "stand", "molo_kontrola", () => !!(window.Przystan && Przystan.ferryNow())], [15, "inside", "komora_drzwi"],\n                   [18, "stand", "komora_przed"], [19.5, "wander", "nabrzeze"], [21, "inside", "komora_drzwi"]],',
  'key: "celnik", name: "", title: "", sheet: "$Npc_Celnik", map: 125, speed: 2, ' + indoor("gosc_celnik") + '\n            plan: [[0, "inside", "komora_drzwi"], [9, "stand", "molo_kontrola", () => !!(window.Przystan && Przystan.ferryNow())], [15, "inside", "komora_drzwi"],\n                   [18, "stand", "komora_przed"], [19.5, "inside", "tawerna"], [21.5, "inside", "komora_drzwi"]],')
# the other maps' "tavern door" spots (Map125's exists) and the visitors' places in the tavern, Map001 (standing: no seated sheets for them)
P(TLD, 'const SPOTS_BY_MAP = { 111: {}, 125: { tawerna: [53, 19, 6] },',
  '''// (2026-11-11 dawcy_miasto) 111: "tawerna" = the way out to the town (the west gate); 162: the garrison's front gate; 1 = the tavern's hall: the
    // places of the evening's visitors (resident.indoor.tawerna), all standing: the notice board's corner (Marta, Franek, Jadwiga), the hearth
    // of the entrance hall (Józek, Zbych, Darin, Rysiek), the front of the bar (Sambor, Bazyli, Kłos); dir 8 = facing the board / fire / bar
    const SPOTS_BY_MAP = { 111: { tawerna: [105, 51, 6] }, 125: { tawerna: [53, 19, 6] }, 162: { tawerna: [55, 34, 2] },
        1: { gosc_praczka: [6, 50, 8], gosc_franek: [5, 50, 8], gosc_znachorka: [8, 50, 8], gosc_szmaciarz: [20, 51, 8], gosc_uchodzca: [22, 51, 8],
             gosc_drwal: [23, 50, 8], gosc_klusownik: [23, 52, 8], gosc_celnik: [9, 31, 8], gosc_latarnik: [17, 31, 8], gosc_kwatermistrz: [19, 31, 8] },''')

# Bazyli: Latarnia_Data.js - the same array (Latarnia.js moves its hours by index [1] and [5]): entries 3 and 4 change in place
LAD = PL("Latarnia_Data")
P(LAD, '[15, "work", "drewutnia"], [17, "inside", "izba"], [20.3, "inside", "laterna"]];',
  '[14, "inside", "tawerna"], [17.5, "inside", "izba"], [20.3, "inside", "laterna"]];   // (2026-11-11 dawcy_miasto: 14-17:30 at the tavern for tran, ale and talk)')
P(LAD, 'key: "latarnik", id: 943, sheet: "$Npc_Latarnik", map: MAP, speed: 2,\n        away: ["izba_sen"],',
  'key: "latarnik", id: 943, sheet: "$Npc_Latarnik", map: MAP, speed: 2,\n        away: ["izba_sen"], indoor: { tawerna: "gosc_latarnik" },')
P(LAD, 'K49: { kind: "K", giver: "latarnik", icon: 176, offer: { cond: { day: 25, flags: ["latarnikMet"] } },\n                kroki: [{ nazwa: "k49Paliwo", type: "bring", to: "latarnik", need: [[177, 4], [61, 6]], haki: { hand: "k49Paliwo" } }],',
  'K49: { kind: "K", giver: "latarnik", icon: 176, offer: { cond: { day: 25, hours: [14, 17.5], flags: ["latarnikMet"] } },\n                kroki: [{ nazwa: "k49Paliwo", type: "bring", to: "latarnik", need: [[177, 4], [61, 6]], hours: [14, 17.5], haki: { hand: "k49Paliwo" } }],')

# Kłos: Garnizon_Data.js 17-19:30
GAD = PL("Garnizon_Data")
P(GAD, 'away: ["namiot_kwat"],\n            plan: [[0, "inside", "namiot_kwat"], [7, "work", "spichlerz"], [9, "stand", "skup"], [12, "stand", "kuchnia"], [13, "stand", "skup"],\n                   [16, "work", "spichlerz"], [18, "stand", "ognisko_2"], [22, "inside", "namiot_kwat"]],',
  'away: ["namiot_kwat"], indoor: { tawerna: "gosc_kwatermistrz" },\n            plan: [[0, "inside", "namiot_kwat"], [7, "work", "spichlerz"], [9, "stand", "skup"], [12, "stand", "kuchnia"], [13, "stand", "skup"],\n                   [16, "work", "spichlerz"], [17, "inside", "tawerna"], [19.5, "stand", "ognisko_2"], [22, "inside", "namiot_kwat"]],')
P(GAD, 'K52: { kind: "K", giver: "kwatermistrz", icon: 61, offer: { cond: { hours: [8, 18], day: 5, flags: ["garnizonPoznany"] } },\n                kroki: [{ nazwa: "k52Drewno", type: "bring", to: "kwatermistrz", need: [[61, 10], [79, 4]], hours: [7, 22] }],',
  'K52: { kind: "K", giver: "kwatermistrz", icon: 61, offer: { cond: { hours: [17, 19.5], day: 5, flags: ["garnizonPoznany"] } },\n                kroki: [{ nazwa: "k52Drewno", type: "bring", to: "kwatermistrz", need: [[61, 10], [79, 4]], hours: [17, 19.5] }],')

# =========================================================================================================================
# 3. The quests: the hours of the offers and of the hand-ins follow the visits
# =========================================================================================================================
TQD = PL("TownQuests_Data")
def hrs(rel, giver_line_old, giver_line_new): P(rel, giver_line_old, giver_line_new)
hrs(TQD, 'K40: {\n                kind: "K", giver: "praczka", icon: 138,\n                offer: {\n                    cond: { hours: [5, 17], day: 2 }\n                },\n                kroki: [\n                    { nazwa: "k40Przynies", type: "bring", to: "praczka", water: 2, hours: [5, 22] }',
         'K40: {\n                kind: "K", giver: "praczka", icon: 138,\n                offer: {\n                    cond: { hours: [17.5, 20], day: 2 }\n                },\n                kroki: [\n                    { nazwa: "k40Przynies", type: "bring", to: "praczka", water: 2, hours: [17.5, 20] }')
hrs(TQD, 'cond: { hours: [6, 18] }\n                },\n                kroki: [\n                    { nazwa: "k41Przynies", type: "bring", to: "znachorka", need: [[150, 3], [149, 2]], hours: [6, 22] }',
         'cond: { hours: [18, 21] }\n                },\n                kroki: [\n                    { nazwa: "k41Przynies", type: "bring", to: "znachorka", need: [[150, 3], [149, 2]], hours: [18, 21] }')
hrs(TQD, 'cond: { hours: [17, 22] }\n                },\n                kroki: [\n                    { nazwa: "k43Przynies", type: "bring", to: "uchodzca", need: [[61, 6]], hours: [6, 23] }',
         'cond: { hours: [17.5, 21.5] }\n                },\n                kroki: [\n                    { nazwa: "k43Przynies", type: "bring", to: "uchodzca", need: [[61, 6]], hours: [17.5, 21.5] }')
hrs(TQD, 'cond: { hours: [15, 21.5] }\n                },\n                kroki: [\n                    { nazwa: "k44Przynies", type: "bring", to: "drwal", need: [[93, 2]], hours: [5, 22] }',
         'cond: { hours: [17.5, 21.5] }\n                },\n                kroki: [\n                    { nazwa: "k44Przynies", type: "bring", to: "drwal", need: [[93, 2]], hours: [17.5, 21.5] }')
hrs(TQD, 'cond: { hours: [13, 20], day: 2 }\n                },\n                kroki: [\n                    { nazwa: "k45Przynies", type: "bring", to: "klusownik", need: [[92, 6]], hours: [5, 22] }',
         'cond: { hours: [19.5, 22.5], day: 2 }\n                },\n                kroki: [\n                    { nazwa: "k45Przynies", type: "bring", to: "klusownik", need: [[92, 6]], hours: [19.5, 22.5] }')
hrs(TQD, 'cond: { hours: [7, 19] }\n                },\n                kroki: [\n                    { nazwa: "k46Przynies", type: "bring", to: "franek", need: [[83, 1]], hours: [6, 22] }',
         'cond: { hours: [17.5, 19.5] }\n                },\n                kroki: [\n                    { nazwa: "k46Przynies", type: "bring", to: "franek", need: [[83, 1]], hours: [17.5, 19.5] }')

ZAD = PL("Zasoby_Data")
P(ZAD, 'K56: { kind: "K", giver: "znachorka", icon: ITEM.cabbage, offer: { cond: { hours: [6, 18], day: 4 } },',
       'K56: { kind: "K", giver: "znachorka", icon: ITEM.cabbage, offer: { cond: { hours: [18, 21], day: 4 } },')
P(ZAD, 'K58: { kind: "K", giver: "praczka", icon: ITEM.wildApple, offer: { cond: { hours: [5, 17], fn: "k58Gotowe" } }, oferta: "zrobione:D21",',
       'K58: { kind: "K", giver: "praczka", icon: ITEM.wildApple, offer: { cond: { hours: [17.5, 20], fn: "k58Gotowe" } }, oferta: "zrobione:D21",')
P(ZAD, '{ nazwa: "k58Marta", type: "talk", to: "praczka", hours: [5, 22] }', '{ nazwa: "k58Marta", type: "talk", to: "praczka", hours: [17.5, 20] }')
P(ZAD, 'D31: { kind: "D", giver: "szmaciarz", icon: ITEM.moneta, offer: { cond: { hours: [7, 20], day: 3 } },',
       'D31: { kind: "D", giver: "szmaciarz", icon: ITEM.moneta, offer: { cond: { hours: [19, 22], day: 3 } },')
P(ZAD, 'need: [["v:zas_medalik", 1], ["v:zas_klucz", 1], ["v:zas_moneta_kruk", 1]], hours: [7, 22], ch: 2 }',
       'need: [["v:zas_medalik", 1], ["v:zas_klucz", 1], ["v:zas_moneta_kruk", 1]], hours: [19, 22], ch: 2 }')
P(PL("Lowy_Data"), 'K62: { kind: "K", giver: "praczka", icon: 123, offer: { cond: { hours: [6, 19] } },',
                    'K62: { kind: "K", giver: "praczka", icon: 123, offer: { cond: { hours: [17.5, 20] } },')
HOM = PL("Homes")
P(HOM, '{ nazwa: "d21Jozek", type: "talk", to: "szmaciarz", hours: [7, 20] },\n                    { nazwa: "d21Marta", type: "talk", to: "praczka", hours: [6, 21] },',
       '{ nazwa: "d21Jozek", type: "talk", to: "szmaciarz", hours: [19, 22] },\n                    { nazwa: "d21Marta", type: "talk", to: "praczka", hours: [17.5, 20] },')
P(HOM, '{ nazwa: "d21Konik", type: "bring", to: "praczka", need: [["v:konik", 1]], hours: [6, 21], reward: { opinion: 2 } },',
       '{ nazwa: "d21Konik", type: "bring", to: "praczka", need: [["v:konik", 1]], hours: [17.5, 20], reward: { opinion: 2 } },')
PRD = PL("Przystan_Data")
P(PRD, 'cond: { hours: [8, 20], flags: ["janekMet"] },\n                    options:', 'cond: { hours: [19, 22.5], flags: ["janekMet"] },\n                    options:')
P(PRD, 'to: "janek", need: [[173, 2]], hours: [5, 21] }', 'to: "janek", need: [[173, 2]], hours: [19, 22.5] }')
P(PRD, 'cond: { hours: [9, 20], flags: ["janekMet"] }', 'cond: { hours: [19, 22.5], flags: ["janekMet"] }')
P(PRD, 'to: "janek", need: [[92, 6], [93, 2]], hours: [6, 21] }', 'to: "janek", need: [[92, 6], [93, 2]], hours: [19, 22.5] }')
P(PRD, 'cond: { hours: [8, 20], flags: ["janekMet"], day: 4 }', 'cond: { hours: [19, 22.5], flags: ["janekMet"], day: 4 }')
P(PRD, '{ nazwa: "d20Janek", type: "talk", to: "janek", hours: [8, 20] },', '{ nazwa: "d20Janek", type: "talk", to: "janek", hours: [19, 22.5] },')
P(PRD, '{ nazwa: "d20Smola", type: "bring", to: "drwal", need: [[61, 6]], hours: [6, 21], gives: [[176, 2]] },',
       '{ nazwa: "d20Smola", type: "bring", to: "drwal", need: [[61, 6]], hours: [17.5, 21.5], gives: [[176, 2]] },')
P(PRD, '{ nazwa: "d20Zagiel", type: "bring", to: "praczka", need: [[92, 10]], hours: [6, 18], vgives: { zagiel: 1 } },',
       '{ nazwa: "d20Zagiel", type: "bring", to: "praczka", need: [[92, 10]], hours: [17.5, 20], vgives: { zagiel: 1 } },')
LUD = PL("Ludzie_Data")
P(LUD, 'offer: { cond: { hours: [8, 18], fn: "ludJaskiniaOtwarta" } }, oferta: "jaskiniaOtwarta",',
       'offer: { cond: { hours: [19.5, 21.5], fn: "ludJaskiniaOtwarta" } }, oferta: "jaskiniaOtwarta",')
P(LUD, '{ kto: "celnik", gdy: "maSkrzynie", tresc: [{ rozmowa: "skrzynia", ustaw: { komu: "celnik" } }] },',
       '{ kto: "celnik", gdy: ["maSkrzynie", { godziny: [19.5, 21.5] }], tresc: [{ rozmowa: "skrzynia", ustaw: { komu: "celnik" } }] },')

# Bazyli's other offers (the lighthouse thread stays about the lighthouse and the eagle's ridge; only WHERE he says it moves): D22 (offer + the
# talk at its end), D29 and K69 (the offers: the work and K69's hand-in to Kleofas stay where they are)
P(LAD, 'D22: { kind: "D", giver: "latarnik", icon: 189, offer: { cond: { flags: ["latarnikMet"], fn: "d22Ready" } },',
       'D22: { kind: "D", giver: "latarnik", icon: 189, offer: { cond: { hours: [14, 17.5], flags: ["latarnikMet"], fn: "d22Ready" } },')
P(LAD, '{ nazwa: "d22Koniec", rozmowy: [{ kto: "latarnik", tresc: ["d22.pyta",', '{ nazwa: "d22Koniec", rozmowy: [{ kto: "latarnik", gdy: [{ godziny: [14, 17.5] }], tresc: ["d22.pyta",')
P(PL("Orzel_Data"), 'D29: { kind: "D", giver: "latarnik", icon: ITEM.jajo, offer: { cond: { hours: [14, 22], fn: "d29Pora" } },',
                    'D29: { kind: "D", giver: "latarnik", icon: ITEM.jajo, offer: { cond: { hours: [14, 17.5], fn: "d29Pora" } },')
P(PL("Zakon_Data"), 'offer: { cond: { hours: [14, 22], flags: ["orzelJajo"] } },', 'offer: { cond: { hours: [14, 17.5], flags: ["orzelJajo"] } },')
T(TX("latarnia"), "zadania.D22.where", "", "Tawerna (Bazyli po południu); laterna na przylądku, mgliste noce")
T(TX("latarnia"), "zadania.D22.when", "", "po pierwszej rozmowie z Bazylem; oferta i rozmowa końcowa 14–17:30")
T(TX("latarnia"), "zadania.D22.steps.1.text", "", "Bazyli pyta, co widziałeś (tawerna, po południu 14–17:30). Powiedz mu - albo zachowaj to dla siebie.")
T(TX("orzel"), "zadania.D29.where", "", "Tawerna (Bazyli po południu) → Góry → Orla Grań")
T(TX("zakon"), "zadania.K69.where", "", "Tawerna (Bazyli po południu) → Orla Grań → pustelnia na klifie")

# =========================================================================================================================
# 4. The notice board: five new givers from outside and their jobs (QuestBoard_Data.js + js/teksty/tablica.txt)
# =========================================================================================================================
QBD = PL("QuestBoard_Data")
P(QBD, '161: 5, 95: 7, 158: 9,', '161: 5, 95: 7, 158: 9, 173: 2.2, 177: 4,')
P(QBD, '        jozek: { pin: "red", gift: [[102, 4], [139, 3]] }\n    };',
  '''        jozek: { pin: "red", gift: [[102, 4], [139, 3]] },
        // (2026-11-11 dawcy_miasto) people from outside the town who post a job on the board instead of coming: the harbour, the lighthouse, the garrison, the pasture, the kiln
        janek: { pin: "nail", gift: [[106, 1]] },
        bazyli: { pin: "brass", gift: [[177, 1]] },
        klos: { pin: "brass", gift: [[79, 2]] },
        wawrzyn: { pin: "nail", gift: [[111, 1]] },
        zbych: { pin: "nail", gift: [[79, 2]] }
    };''')
P(QBD, '''        { id: "cones", type: "gather", giver: "jozek",
            req: [{ item: 147, n: [T(5, 6), T(8, 10), null, null, null] }] }
    ];''', '''        { id: "cones", type: "gather", giver: "jozek",
            req: [{ item: 147, n: [T(5, 6), T(8, 10), null, null, null] }] },
        // ---- the outside: Janek (harbour), Bazyli (lighthouse), Kłos (garrison), Wawrzyn (pasture), Zbych (kiln)
        { id: "herring_janek", type: "gather", giver: "janek", from: 4,
            req: [{ item: 173, n: [T(2, 3), T(4, 5), T(6, 8), null, null] }] },
        { id: "tran_bazyli", type: "deliver", giver: "bazyli", from: 12,
            req: [{ item: 177, n: [null, T(2, 3), T(4, 5), T(5, 6), null] }] },
        { id: "wood_klos", type: "gather", giver: "klos", from: 8,
            req: [{ item: 61, n: [null, null, T(10, 12), T(14, 18), T(20, 24)] }] },
        { id: "wool_wawrzyn", type: "deliver", giver: "wawrzyn", from: 10, seasons: [0, 1, 2],
            req: [{ item: 111, n: [null, T(2, 3), T(4, 5), T(5, 6), null] }] },
        { id: "kiln_zbych", type: "gather", giver: "zbych",
            req: [{ item: 61, n: [null, T(8, 10), T(12, 14), null, null] }] }
    ];''')

TAB = TX("tablica")
P(TAB, '''[szablony.cones.text]
Chłopaki z drugiego końca wsi wypowiedzieli nam wojnę na szyszki. Potrzebuję amunicji. Dużo amunicji.
''', '''[szablony.cones.text]
Chłopaki z drugiego końca wsi wypowiedzieli nam wojnę na szyszki. Potrzebuję amunicji. Dużo amunicji.

# herring_janek - pisze: Janek (przystań)
[szablony.herring_janek.title]
Śledzie do wędzarni

[szablony.herring_janek.text]
Wędzarnia pusta, a ławica poszła w drugą stronę. Przynieś śledzie do tawerny, to przy kuflu się rozliczymy - ja do miasta schodzę tylko wieczorem.

# tran_bazyli - pisze: Bazyli (latarnia)
[szablony.tran_bazyli.title]
Tran do latarni

[szablony.tran_bazyli.text]
Światła nie zostawię, więc sam nie przyjdę. Przynieś tran do tawerny, Borgar mi go podeśle. Bez tranu latarnia jest tylko wysoką wieżą.

# wood_klos - pisze: Kłos (garnizon)
[szablony.wood_klos.title]
Drewno dla kuchni polowej

[szablony.wood_klos.text]
Moi chłopcy rąbać nie umieją, tylko ciąć. Dostarcz drewno, wpiszę do księgi skupu. Gotówka od ręki - u Borgara, bo z garnizonu wozu nie wyślę.

# wool_wawrzyn - pisze: Wawrzyn (pastwisko)
[szablony.wool_wawrzyn.title]
Wełna po strzyży

[szablony.wool_wawrzyn.text]
Owiec nie zostawię, więc kartkę wieszam tu. Potrzebna wełna - przynieś ją Borgarowi, a on mi przekaże zapłatę. Owce rozpoznają dobrą rękę.

# kiln_zbych - pisze: Zbych (mielerz)
[szablony.kiln_zbych.title]
Drewno na wypał

[szablony.kiln_zbych.text]
Mielerz sam się nie napali. Drewna mi brakuje na ostatni wypał. Zostaw u Borgara, wieczorem odbiorę i się rozliczymy.
''')
P(TAB, '''zleceniodawcy.jozek.line = Biega szybciej niż plotki. Prawie.
''', '''zleceniodawcy.jozek.line = Biega szybciej niż plotki. Prawie.
zleceniodawcy.janek.name = Janek
zleceniodawcy.janek.short = Janek
zleceniodawcy.janek.role = rybak z przystani
zleceniodawcy.janek.line = Morze daje i morze zabiera. Częściej to drugie.
zleceniodawcy.bazyli.name = Bazyli Krzesiwo
zleceniodawcy.bazyli.short = Bazyli
zleceniodawcy.bazyli.role = latarnik
zleceniodawcy.bazyli.line = Pilnuje światła, o którym nikt nie myśli, dopóki nie zgaśnie.
zleceniodawcy.klos.name = Kwatermistrz Kłos
zleceniodawcy.klos.short = Kłos
zleceniodawcy.klos.role = kwatermistrz garnizonu
zleceniodawcy.klos.line = Liczy worki, liczy dni, liczy cudze grosze.
zleceniodawcy.wawrzyn.name = Wawrzyn Owczarz
zleceniodawcy.wawrzyn.short = Wawrzyn
zleceniodawcy.wawrzyn.role = pasterz
zleceniodawcy.wawrzyn.line = Zna każdą owcę po imieniu i po charakterze.
zleceniodawcy.zbych.name = Zbych Smolarz
zleceniodawcy.zbych.short = Zbych
zleceniodawcy.zbych.role = drwal i węglarz
zleceniodawcy.zbych.line = Pachnie dymem nawet w niedzielę.
''')

# =========================================================================================================================
# 5. The words: only where the place or the time changed
# =========================================================================================================================
ZK = TX("zadania_k")
T(ZK, "zadania.K40.where", "", "Tawerna, kącik przy tablicy zleceń (wieczorem); pranie na Podgrodziu")
T(ZK, "zadania.K40.when", "", "17:30–20, od dnia 2")
P(ZK, "[zadania.K40.offer.accept]\nNiech ci Bóg wynagrodzi. Będę przy sznurach.\n", "[zadania.K40.offer.accept]\nNiech ci Bóg wynagrodzi. Siedzę tu przy tablicy, aż skończę rachunek z Borgarem za obrusy.\n")
T(ZK, "zadania.K40.steps.0.text", "", "Daj Marcie 2 porcje swojej deszczówki (wiadro albo bukłak; tawerna, wieczorem, kącik przy tablicy zleceń).")
T(ZK, "zadania.K41.where", "", "Tawerna, stolik przy tablicy zleceń (wieczorem); ogródek ziół na Podgrodziu")
T(ZK, "zadania.K41.when", "", "18–21")
T(ZK, "zadania.K41.steps.0.text", "", "Przynieś babce Jadwidze 3× Krwawnik i 2× Pokrzywa (tawerna, wieczorem).")
T(ZK, "zadania.K43.where", "", "Tawerna, przy kominku w sieni (wieczorem); obóz uchodźców na Podgrodziu")
T(ZK, "zadania.K43.when", "", "17:30–21:30")
T(ZK, "zadania.K43.steps.0.text", "", "Przynieś Darinowi 6× Drewno na ognisko (tawerna, wieczorem; zaniesie je do obozu uchodźców).")
T(ZK, "zadania.K44.where", "", "Tawerna, przy kominku w sieni (wieczorem); drewutnia na Podgrodziu")
T(ZK, "zadania.K44.when", "", "17:30–21:30")
P(ZK, "[zadania.K44.offer.accept]\nDobrze. Rąbię do zmroku.\n", "[zadania.K44.offer.accept]\nDobrze. Rąbię od świtu do zmroku, a wieczorem mnie tu znajdziesz.\n")
T(ZK, "zadania.K44.steps.0.text", "", "Przynieś Zbychowi 2× Lina (tawerna, wieczorem).")
T(ZK, "zadania.K45.where", "", "Tawerna, ciemny kąt przy kominku (wieczorem); sidła na Podgrodziu i w lesie")
T(ZK, "zadania.K45.when", "", "19:30–22:30")
T(ZK, "zadania.K45.steps.0.text", "", "Przynieś Ryśkowi 6× Włókno na pętle (tawerna, wieczorem).")
T(ZK, "zadania.K46.where", "", "Tawerna, przy mamie w kąciku przy tablicy (wieczorem)")
T(ZK, "zadania.K46.when", "", "17:30–19:30")
T(ZK, "zadania.K46.steps.0.text", "", "Przynieś Frankowi 1× Chleb (tawerna, wieczorem, przy mamie).")
T(ZK, "zadania.K47.where", "", "Tawerna (Janek wieczorem); pomost rybacki na przystani")
T(ZK, "zadania.K47.when", "", "19–22:30")
T(ZK, "zadania.K47.steps.0.text", "", "Złów w morzu 2 śledzie (z pomostu albo z brzegu przystani) i przynieś je Jankowi do tawerny (wieczorem).")
T(ZK, "zadania.K48.where", "", "Tawerna (Janek wieczorem); sieci na przystani")
T(ZK, "zadania.K48.when", "", "19–22:30, po „Pierwszym połowie”")
T(ZK, "zadania.K48.steps.0.text", "", "Przynieś Jankowi 6× Włókno i 2× Lina na sieci (tawerna, wieczorem).")

ZA = TX("zasoby")
T(ZA, "zadania.K56.where", "", "Tawerna (zlecenie Jadwigi, wieczorem); ogródki Podgrodzia na północy (praca rano)")
T(ZA, "zadania.K56.when", "", "zlecenie 18–21; praca 6-12, trzy dni w tygodniu")
T(ZA, "zadania.K58.where", "", "Spalona zagroda, sad (praca); Marta w tawernie (wieczorem)")
T(ZA, "zadania.K58.when", "", "po odbudowie zagrody (D21); Marta 17:30–20")
T(ZA, "zadania.K58.steps.1.text", "", "Powiedz Marcie, że sad żyje (tawerna, wieczorem).")
T(ZA, "zadania.D31.where", "", "Tawerna (Józek wieczorem); wysypisko za chatami na Podgrodziu")
T(ZA, "zadania.D31.when", "", "19–22, od dnia 3")
T(ZA, "zadania.D31.steps.1.text", "", "Zanieś Józkowi znaleziska z wysypiska (tawerna, wieczorem).")
T(TX("lowy"), "zadania.K62.where", "", "Tawerna (Marta wieczorem) → Spalona zagroda: wschodnie łąki")
T(TX("lowy"), "zadania.K62.when", "", "zlecenie 17:30–20, praca za dnia")
T(TX("latarnia"), "zadania.K49.where", "", "Tawerna (Bazyli po południu); przylądek z latarnią")
T(TX("latarnia"), "zadania.K49.when", "", "od dnia 25, 14–17:30")
T(TX("latarnia"), "zadania.K49.steps.0.text", "", "Przynieś Bazylemu 4× Tran i 6× Drewno (tawerna, po południu 14–17:30; zawiezie na przylądek). Tran: 3 surowe ryby w kociołku albo od Janka na przystani (6 G).")
T(TX("garnizon"), "zadania.K52.where", "", "Tawerna (Kłos wieczorem); garnizon nad zatoką: kuchnia polowa")
T(TX("garnizon"), "zadania.K52.when", "", "od dnia 5, 17–19:30")
T(TX("garnizon"), "zadania.K52.steps.0.text", "", "Przynieś kwatermistrzowi Kłosowi 10× Drewno i 4× Węgiel drzewny (tawerna, wieczorem; wozem pojedzie do garnizonu).")
LU = TX("ludzie")
T(LU, "zadania.D34.where", "", "Tawerna (Sambor wieczorem); przystań: zatoczka przemytników, jaskinia (tylko w odpływie)")
T(LU, "zadania.D34.when", "", "od W5 rozdz. 4; Sambor w tawernie 19:30–21:30")
T(LU, "zadania.D34.steps.1.text", "", "Skrzynia przemytu jest ciężka. Oddaj ją celnikowi Samborowi (wieczorem w tawernie){balt}.")
T(TX("w10"), "zadania.W10.where", "", "Tawerna (Janek wieczorem); przystań: prom albo kuter Rocha")
T(TX("w10"), "zadania.W10.when", "", "od dnia 4, rozmowa o liście 19–22:30")
ZD = TX("zadania_d")
T(ZD, "zadania.D20.where", "", "Przystań (plaża, pochylnia), tawerna (wieczorem), Podgrodzie")
T(ZD, "zadania.D20.steps.0.text", "", "Poproś Janka o pomoc przy wraku (tawerna, wieczorem).")
T(ZD, "zadania.D20.steps.3.text", "", "Zanieś Zbychowi Smolarzowi 6× Drewno - napędzi smoły (tawerna, wieczorem).")
T(ZD, "zadania.D20.steps.4.text", "", "Zanieś praczce Marcie 10× Włókno - uszyje żagiel (tawerna, wieczorem).")
DO = TX("domy")
T(DO, "zadania.D21.steps.0.text", "", "Zapytaj Józka Łatę (wieczorem w tawernie), czyja to zagroda - handlarz starzyzną wie wszystko o wszystkich.")
T(DO, "zadania.D21.steps.1.text", "", "Porozmawiaj z Martą Ługową (praczka, wieczorem w tawernie) o zagrodzie.")
P(DO, "(Marta długo wyżyma koszulę.)", "(Marta długo obraca w dłoniach pusty kubek.)")
T(DO, "zadania.D21.steps.4.text", "", "Zanieś Marcie osmalonego konika, którego znalazłeś w popiele (tawerna, wieczorem).")
P(DO, "zadania.D21.where = Spalona zagroda (za północno-wschodnim rogiem Podgrodzia), Podgrodzie, ratusz", "zadania.D21.where = Spalona zagroda (za północno-wschodnim rogiem Podgrodzia), tawerna (wieczorem), ratusz")

# =========================================================================================================================
# 6. Existing tests that assert the old place of a moved quest (a staged copy in tests/ of the staging; the originals stay)
# =========================================================================================================================
PT = "tests/przystan_test.js"
P(PT, """    const k47 = await t.json("TownQuests.offerable('K47')");
    t.check("...and then has his quest for the hero (K47 „Pierwszy połów”)", k47, k47);
    const offer = await t.talkTo("TownLife.eventOf('janek')", ["Nie teraz"]);
    t.check("...offered first when he is spoken to (declined for today)", offer.done && /dwa śledzie/.test(offer.text), offer.text);
""", """    // (2026-11-11 dawcy_miasto: K47 is offered in the tavern in the evening, 19-22:30, where Janek sits - not at the pier by day)
    const k47day = await t.json("TownQuests.offerable('K47')");
    await t.setHour(20);
    await t.go(1, 14, 50, 8);
    await t.frames(40);
    const k47 = await t.json("TownQuests.offerable('K47')");
    t.check("...and then has his quest for the hero (K47 „Pierwszy połów”) - in the evening, in the tavern, not by day at the pier", k47 && !k47day, { k47, k47day });
    const offer = await t.talkTo("TownLife.eventOf('janek')", ["Nie teraz"]);
    t.check("...offered first when he is spoken to in the tavern (declined for today)", offer.done && /dwa śledzie/.test(offer.text), offer.text);
    await t.setHour(13.5);
    await t.go(125, 20, 7, 8);
    await t.frames(30);
""")

GT = "tests/garnizon_test.js"
P(GT, """        await quietTalk(ev("kwatermistrz"), []);   // (the first meeting)
        const offer = await quietTalk(ev("kwatermistrz"), ["Przyniosę"]);""", """        await quietTalk(ev("kwatermistrz"), []);   // (the first meeting, at the garrison)
        // (2026-11-11 dawcy_miasto: K52 is offered and handed in at the tavern in the early evening, 17-19:30, where Kłos stops off)
        await t.setHour(18.2); await t.go(1, 14, 50, 8); await t.frames(40);
        const offer = await quietTalk(ev("kwatermistrz"), ["Przyniosę"]);""")
P(GT, """        t.check("...i przychylność garnizonu +20 (20 -> 40)", fv0 === 20 && fv2 === 40, { fv0, fv1, fv2 });
""", """        t.check("...i przychylność garnizonu +20 (20 -> 40)", fv0 === 20 && fv2 === 40, { fv0, fv1, fv2 });
        await t.setHour(10); await t.go(162, 55, 54, 8); await t.frames(40);   // (back to the garrison for the buying)
""")
QT = "tests/podgrodzie_quests_test.js"
P(QT, """    // Franek: a loaf of bread
    const offer = await t.talkTo("TownLife.eventOf('franek')", ["Przyniosę ci chleb."]);""", """    // Franek: a loaf of bread (2026-11-11 dawcy_miasto: in the tavern, in the evening, with his mother)
    const eveMarks = await t.json("(function(){ $gameSystem.setDayNightHour(18.8); TownQuests.refreshMarkers(); return TownQuests.markers(); })()");
    t.check("at 18:50 the washerwoman, the healer, the junk dealer and Franek have an errand to offer ('!') - the evening visitors of the tavern",
        ["praczka", "znachorka", "szmaciarz", "franek"].every(k => eveMarks[k] === "new"), eveMarks);
    await t.go(1, 14, 50, 8);
    await t.frames(40);
    const offer = await t.talkTo("TownLife.eventOf('franek')", ["Przyniosę ci chleb."]);""")
P(QT, """    // Józek: the stall's roof (boards, nails, the hammer shown)
""", """    // Józek: the stall's roof (boards, nails, the hammer shown) - the stall is on Podgrodzie, so the stall and its daytime
    await t.setHour(10); await t.go(111, 61, 63, 2); await t.frames(40);
""")
P(QT, """    t.check("at 10:00 on day 4 the washerwoman, the healer, the junk dealer and Franek have an errand to offer ('!')",
        ["praczka", "znachorka", "szmaciarz", "franek"].every(k => marks[k] === "new"), marks);""", """    t.check("at 10:00 on day 4 only Józek (the stall, K42) has an errand to offer at Podgrodzie; the others come to the tavern in the evening",
        marks.szmaciarz === "new" && !["praczka", "znachorka", "franek"].some(k => marks[k] === "new"), marks);""")

LT = "tests/ludzie_test.js"
P(LT, """        await t.setHour(18.4);
        await t.go(125, 27, 20);
        await t.frames(40);
        const g0 = await t.gold();
        await talk(ev("celnik"), ["Oddaj skrzynię celnikowi"]);""", """        // (2026-11-11 dawcy_miasto: D34's crate goes to Sambor in the tavern in the evening, 19:30-21:30, where he sits after duty)
        await t.setHour(20.4);
        await t.go(1, 14, 50, 8);
        await t.frames(40);
        const g0 = await t.gold();
        await talk(ev("celnik"), ["Oddaj skrzynię celnikowi"]);""")

# =========================================================================================================================
# the end: write only what changed (LF as in the files)
# =========================================================================================================================
shutil.rmtree(STG, ignore_errors=True)
for d in ("js/plugins", "js/teksty", "data", "tests"): os.makedirs(os.path.join(STG, d))
n = 0
for rel, f in sorted(FILES.items()):
    orig = open(os.path.join(ROOT, *rel.split("/")), "rb").read()
    if orig == f["b"]: continue
    out = os.path.join(STG, *rel.split("/"))
    open(out, "wb").write(f["b"])
    n += 1
    print("staging:", rel)
tst = os.path.join(HERE, "dawcy_miasto_test.js")
if os.path.exists(tst): shutil.copyfile(tst, os.path.join(STG, "tests", "dawcy_miasto_test.js")); print("staging: tests/dawcy_miasto_test.js")
print("zmienionych plikow:", n)
