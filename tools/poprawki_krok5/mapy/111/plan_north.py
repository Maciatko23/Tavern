# ================================================================== A. POLNOC  x26-101, y3-29
ID_SOSNY = [48, 52, 53, 54, 55, 57, 61]               # luzne sosny polnocy -> grupy
ID_JABLONIE = [58, 62, 63, 64, 65, 66, 60]            # sad (6 jablon + grusza)
ID_KRZAKI = [42, 51, 56, 92]
czysc(26, 3, 101, 29)
for y in range(3, 30):
    for x in range(26, 102):
        if K.kind(0, x, y) in (17, 24, 27): K.ground(x, y, 16)

# --- tory: glowny od drogi polnocnej do przerwy w plocie (73-75, 30), odnoga do pastwiska
M_GL = tor([(105.6, 20.6), (97.0, 21.8), (89.0, 23.2), (82.0, 25.6), (77.0, 28.2), (74.4, 30.8)], 3.4, 211)
M_BR = tor([(79.0, 27.2), (64.0, 27.0), (50.0, 25.8), (42.0, 23.6), (37.0, 20.4), (34.9, 17.0)], 3.2, 212)
M_PL = K.blob(34.8, 17.2, 3.1, 2.0, 214, 0.12)          # wydeptany placyk przed brama pastwiska
M_TOR = {c for c in (M_GL | M_BR | M_PL) if 26 <= c[0] <= 105 and 3 <= c[1] <= 30}
for (x, y) in M_TOR:
    K.ground(x, y, 17)
    if K.g(1, x, y): K.over(x, y, 0)
ZK = set(); ZT = set()
def zajmij(S, m=0):
    global ZK
    ZK |= {(x + a, y + b) for (x, y) in S for a in range(-m, m + 1) for b in range(-m, m + 1)}
def pod_plotem(S, n=3):
    global ZT
    ZT |= {(x + a, y + b) for (x, y) in S for a in (-1, 0, 1) for b in range(-1, n + 1)}
zajmij(M_TOR, 1)

rodz_kw0 = [696, 704, 716]
# --- pastwisko: plot z brama od toru, slupki bramy
PAST = (28, 5, 41, 15)
brama = [(34, PAST[3]), (35, PAST[3])]
K.plot(*PAST, bramy=brama)
K.kafel(33, PAST[3], 209, z=3); K.kafel(36, PAST[3], 208, z=3)
PLOT_C = {(x, y) for x in range(PAST[0], PAST[2] + 1) for y in (PAST[1], PAST[3])} | {(x, y) for y in range(PAST[1], PAST[3] + 1) for x in (PAST[0], PAST[2])}
zajmij(PLOT_C, 1); pod_plotem(PLOT_C, 3)
K.dekor(lambda x, y: 1.0 if (PAST[0] + 1 <= x <= PAST[2] - 1 and PAST[1] + 1 <= y <= PAST[3] - 1) else 0.0, [PAPROCIE, [734, 735], KAMYKI, rodz_kw0], 7, 471, (PAST[0] + 1, PAST[1] + 1, PAST[2] - 1, PAST[3] - 1), occ=K.zajete(), zakazane=PLOT_C, ile=(1, 3), promien=1.2, odstep=3.5)
zajmij(prostokat(PAST[0], PAST[1], PAST[2], PAST[3]), 0)
K.plama(K.blob(32.5, 8.8, 3.4, 2.0, 221, 0.3), 27, 0, tylko_na={16})
K.plama(K.blob(38.2, 11.2, 2.6, 1.7, 222, 0.3), 27, 0, tylko_na={16})

# --- sad: 7 drzew w dwoch rzedach, zywoplot od polnocy i zachodu (z przerwami)
rzad = [(46, 16), (50, 16), (54, 16), (58, 16), (48, 20), (52, 20), (56, 20)]
for eid, (x, y) in zip(ID_JABLONIE, rzad):
    K.przenies(eid, x, y)
H_SAD_N = zywoplot_ev([(46, 12), (50, 12)])
H_SAD_W = set()
zajmij(H_SAD_N | H_SAD_W, 1); pod_plotem(H_SAD_N | H_SAD_W, 3)
K.plama(K.blob(52, 18, 7.0, 3.6, 231, 0.3) - M_TOR, 27, 0, tylko_na={16})

# --- pola: pasy upraw (rozna dlugosc, nie siatka), miedze 2 kratki
POLA = []
for (spec, uprawa, sd) in [((63, 10, 79, 14), [278, 279, 278, 279], 301), ((61, 16, 77, 20), [285, 286, 287, 286], 302),
                           ((83, 10, 93, 14), [277, 285, 277], 303), ((81, 16, 96, 20), [], 304)]:
    M, cr = pole_ornej(*spec, uprawa, sd, rzedy=[spec[1] + 1, spec[1] + 3])
    POLA.append((M, cr)); zajmij(M, 1); ZT |= {(x + a, y + b) for (x, y) in M for a in (-1, 0, 1) for b in range(-1, 3)}
H_POLA = zywoplot_ev([(66, 8), (75, 8)])
zajmij(H_POLA, 1); pod_plotem(H_POLA, 3)

# --- stogi siana
STOGI = [siano(97, 9), siano(98, 15)]
for S in STOGI: zajmij(S, 1)
ZT |= set().union(*STOGI)

# --- kepy
SOSNY_ID = list(ID_SOSNY); KR_ID = list(ID_KRZAKI)
def sosny(n): return [SOSNY_ID.pop(0) for _ in range(min(n, len(SOSNY_ID)))]
def krzaki(n, nowe=()): return [KR_ID.pop(0) for _ in range(min(n, len(KR_ID)))] + [wzor_gr(g) for g in nowe]
ZKD = lambda: ZK | ZT
def kepa(nazwa, c, rx, ry, bb, drzewa, krz, seed, polana=None, min_d=2.1):
    f = K.gestosc(c[0], c[1], rx, ry, seed, rough=0.3, spadek=0.5, polana=polana)
    K.sadz(drzewa, f, seed + 1, min_d=min_d, occ=K.zajete(), zakazane=ZKD(), bbox=bb, prog=0.03)
    K.plama(K.blob(c[0], c[1], rx - 0.8, ry - 0.5, seed + 2, 0.3) - M_TOR, 27, 0, tylko_na={16})
    fk = K.gestosc(c[0], c[1], rx + 2, ry + 1.3, seed + 3, polana=(polana[0], polana[1], polana[2] + .3, polana[3] + .2) if polana else None)
    K.sadz(krz, fk, seed + 4, min_d=2.2, occ=K.zajete(), zakazane=ZKD(), bbox=bb, kol_dy=0)
kepa("C1", (56.5, 6.8), 6.6, 3.4, (48, 3, 65, 11), sosny(2) + [wzor_gr("!$Pine_A"), wzor_gr("!$Pine_C"), wzor_gr("!$Tree_Small"), wzor_gr("!$Tree_Small")], krzaki(1, ("!$Bush_Bare_Big",)), 411, polana=(57, 7.0, 1.8, 1.2))
kepa("C2", (90.5, 6.0), 7.0, 3.3, (80, 3, 100, 10), sosny(3) + [wzor_gr("!$Pine_B"), wzor_gr("!$Pine_C"), wzor_gr("!$Tree_Small")], krzaki(1, ("!$Bush_Bare_Thicket",)), 421, polana=(91, 6.4, 2.0, 1.2), min_d=1.9)
kepa("C3", (29.5, 25.2), 4.6, 3.6, (26, 20, 36, 29), sosny(2) + [wzor_gr("!$Pine_B"), wzor_gr("!$Pine_C"), wzor_gr("!$Tree_Small")], krzaki(1, ("!$Bush_Bare_Vines",)), 431, polana=(30, 25.6, 1.8, 1.4))
for i_ in KR_ID: pass
# punkt orientacyjny przy torze: glazy + martwe drzewo (66-70, 21-24)
for (g, x, y) in [("!$Rock_Huge", 66, 23), ("!$Rock_Mound", 69, 24)]:
    K.zdarzenie_z(wzor_gr(g), x, y)
K.plama(K.blob(67.5, 23.2, 4.4, 2.0, 441, 0.3) - M_TOR, 27, 0, tylko_na={16})
zajmij({(66, 23), (69, 24)}, 1)

# --- drobiazgi z kafli
rodz_kw = lambda r: KWIATY[r.choice(list(KWIATY))]
f_all = lambda x, y: 1.0 if (26 <= x <= 100 and 3 <= y <= 29) else 0.0
K.dekor(f_all, rodz_kw, 14, 451, (27, 4, 100, 28), occ=K.zajete(), zakazane=ZK, ile=(3, 4), promien=1.5, odstep=5.5)
K.dekor(f_all, [KAMYKI], 8, 452, (27, 4, 100, 28), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.2, odstep=6.0)
K.dekor(f_all, [PAPROCIE], 10, 453, (27, 4, 100, 28), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.2, odstep=5.0)
# zdarzenia z toru / zywoplotow / pol precz
K.zejdz_z(M_TOR | H_SAD_N | H_SAD_W | H_POLA)
