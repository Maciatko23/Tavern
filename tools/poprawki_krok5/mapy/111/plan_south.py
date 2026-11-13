
# ================================================================== B. POLUDNIE  x34-105, y98-116
WYBIEG = prostokat(33, 109, 57, 119) | prostokat(29, 108, 32, 119)                     # wybieg (krok 4) + margines: nie ruszac
glin = {(x, y) for x in range(62, 70) for y in range(101, 107) if K.kind(1, x, y) == 26}
wys = {(x, y) for x in range(85, 97) for y in range(100, 106) if K.kind(1, x, y) == 47}
for (x, y) in [(94, 101), (94, 102), (94, 104), (94, 105), (87, 104)]:
    K.kafel(x, y, 0, 2)                                  # luzne beczki, kola, skrzynie wysypiska precz
for y in range(98, 117):
    for x in range(27, 111):
        if x > 105 and y < 106: continue
        if x < 34 and y > 106: continue
        if (x, y) in WYBIEG or (x, y) in glin or (x, y) in wys: continue
        if K.kind(0, x, y) in (17, 24, 27, 26): K.ground(x, y, 16)
        if K.kind(1, x, y) in (21, 31, 36, 39, 47, 26, 29, 38) and K.kind(1, x, y) != 38: K.over(x, y, 0)
for (x, y) in glin | wys: K.ground(x, y, 17)
K.usun(432)                                              # lopata przy glinie

T1 = tor([(59.2, 96.4), (59.8, 99.4), (61.4, 101.8), (64.0, 103.2)], 3.4, 511)
T2 = tor([(60.4, 100.8), (51.0, 101.4), (42.0, 102.6), (36.0, 103.6), (32.6, 105.0), (31.4, 107.6)], 3.2, 512)
T3 = tor([(62.0, 100.6), (71.0, 100.2), (79.0, 101.2), (85.0, 102.4), (90.0, 103.2)], 3.0, 513)
T5 = plac((104.2, 116.2), 4.2, 2.6, 518, 0.1)
T4 = tor([(76.4, 100.8), (76.0, 105.0), (73.8, 108.8), (71.8, 112.0), (71.2, 114.0)], 2.9, 514)
Mglin = plac((66.2, 103.8), 5.2, 3.5, 515, 0.12)
Mwys = plac((90.8, 103.0), 6.6, 4.0, 516, 0.12)
Mhay = K.blob(71.3, 114.4, 3.2, 2.1, 517, 0.12)
M_T = {c for c in (T1 | T2 | T3 | T4 | T5 | Mglin | Mwys | Mhay) if 29 <= c[0] <= 110 and 98 <= c[1] <= 119 and c not in WYBIEG and not (c[1] >= 117)}
for (x, y) in M_T:
    K.ground(x, y, 17)
    if K.g(1, x, y) and (x, y) not in glin and (x, y) not in wys: K.over(x, y, 0)
ZS = set(); ZST = set()
def zajmij_s(S, m=0):
    global ZS
    ZS |= {(x + a, y + b) for (x, y) in S for a in range(-m, m + 1) for b in range(-m, m + 1)}
def pod_s(S, n=3):
    global ZST
    ZST |= {(x + a, y + b) for (x, y) in S for a in (-1, 0, 1) for b in range(-1, n + 1)}
zajmij_s(M_T, 1); zajmij_s(WYBIEG, 0)
ZS |= {(x, y) for y in range(117, 120) for x in range(0, 120)}
# zywoplot wzdluz toru zachodniego (od paddocku): ciagly, jedna przerwa
H_PD = zywoplot_ev([(40, 106)])
zajmij_s(H_PD, 1); pod_s(H_PD, 3)
UG1 = set()
# stogi
STG_S = [siano(77, 110), siano(60, 112)]
for S in STG_S: zajmij_s(S, 1); pod_s(S, 0)
# kepy poludnia
SOSNY2 = []
def kepa_s(c, rx, ry, bb, drzewa, krz, seed, polana=None, min_d=2.1):
    f = K.gestosc(c[0], c[1], rx, ry, seed, rough=0.3, spadek=0.5, polana=polana)
    K.sadz(drzewa, f, seed + 1, min_d=min_d, occ=K.zajete(), zakazane=ZS | ZST, bbox=bb, prog=0.03)
    K.plama(K.blob(c[0], c[1], rx - 0.8, ry - 0.4, seed + 2, 0.3) - M_T, 27, 0, tylko_na={16})
    fk = K.gestosc(c[0], c[1], rx + 2, ry + 1.3, seed + 3, polana=(polana[0], polana[1], polana[2] + .3, polana[3] + .2) if polana else None)
    K.sadz(krz, fk, seed + 4, min_d=2.2, occ=K.zajete(), zakazane=ZS | ZST, bbox=bb, kol_dy=0)
kepa_s((90.0, 113.2), 6.5, 3.3, (82, 109, 99, 116), [wzor_gr("!$Pine_A"), wzor_gr("!$Pine_B"), wzor_gr("!$Pine_C"), wzor_gr("!$Tree_Small"), wzor_gr("!$Tree_Small")], [wzor_gr("!$Bush_Bare_Thicket")], 611, polana=(90, 113.4, 1.8, 1.1))

# punkty: glaz Skala (78,105) zostaje; kamyki, kwiaty, paprocie
f_s = lambda x, y: 1.0 if (34 <= x <= 105 and 98 <= y <= 116) else 0.0
K.dekor(f_s, rodz_kw, 8, 631, (36, 99, 104, 116), occ=K.zajete(), zakazane=ZS, ile=(3, 4), promien=1.5, odstep=6.0)
K.dekor(f_s, [KAMYKI], 8, 632, (36, 99, 104, 116), occ=K.zajete(), zakazane=ZS, ile=(1, 2), promien=1.2, odstep=6.0)
K.dekor(f_s, [PAPROCIE], 8, 633, (36, 99, 104, 116), occ=K.zajete(), zakazane=ZS, ile=(1, 2), promien=1.2, odstep=5.0)
# zdarzenia z torow, ugoru, stogow, zywoplotu precz
K.zejdz_z(M_T | H_PD | UG1 | set().union(*STG_S))
