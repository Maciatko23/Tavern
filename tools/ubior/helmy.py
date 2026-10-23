# tools/ubior/helmy.py - nakrycia głowy dla zbroi (js/plugins/Ubior.js, docs/ekwipunek/PLAN_BRON_ZBROJE.md, rozdz. 5):
#   kaptur, czepiec, kapalin, hełm otwarty, hełm z nosalem, hełm zakonny (garnczkowy).
#
#   img/system/Ubior_Helm_<rodzaj>.png       gra: 5 klatek 32x32 w rzędzie (160x32): S, SW, W, NW, N (W = profil w LEWO;
#                                            SE / E / NE gra robi lustrem). KOTWICA (16, 10) = środek góry włosów.
#   img/system/Ubior_Bust_Helm_<rodzaj>.png  popiersie w rozmowach (330x350 jak Ubior_Bust_Czapka.png, malowane gładko)
#
# Jak rysuje: każdy hełm to prosta bryła 3D (pola odległości: kula głowy, kopuła, stożek, walec, rondo, nosal...) oglądana
# z 5 stron (obrót 0 / 45 / 90 / 135 / 180°) z lekka z góry (16°, jak cała gra) - promień na każdy podpiksel (4 x 4 na piksel),
# cieniowanie światłem z lewej góry, potem piksele: 7 tonów szarości, czarny kontur 1 px dookoła i linie między częściami
# (rondo / kopuła, opaska / dzwona, nosal). Dzięki bryle 5 widoków jest spójnych (to samo rondo, ta sama opaska z każdej strony).
#
# Kolory (gra przemalowuje, Ubior.js):
#   KONTUR (10, 9, 8)            zostaje czarny (obrys, wizjer, otwory oddechowe, linie podziału)
#   szarości r = g = b           MATERIAŁ - jasność 0.20-0.84 -> rampa materiału (skóra, żelazo, stal, zakon...)
#   czerwonawe (r > g = b)       AKCENT - 4 tony -> rampa akcentu (skórzany pasek, nity, krzyż zakonu, podszewka)
#   alfa 64 (dokładnie)          OTWÓR - tu przez kaptur / czepiec widać twarz i grzywkę bohatera (włosy zostają)
#   alfa 0                       nic (włosy nad CUT poza hełmem gra usuwa)
# CUT (wiersze klatki od góry, w których gra zdejmuje włosy wystające spod hełmu) - tabela CUT niżej.
#
#   python tools/ubior/helmy.py [--podglad KATALOG] [--bez-popiersia]
import sys, os
import numpy as np
from PIL import Image, ImageFilter

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RODZAJE = ['kaptur', 'czepiec', 'kapalin', 'otwarty', 'nosal', 'zakonny']
WIDOKI = ['S', 'SW', 'W', 'NW', 'N']
YAW = {'S': 0, 'SW': 25, 'W': 90, 'NW': 155, 'N': 180}   # (3/4 bohatera są obrócone mniej niż o 45°: twarz prawie na środku)
FW, FH = 32, 32
KOTWICA = (16, 10)
PITCH = np.radians(16)           # widok lekko z góry
TRYB = {'pitch': PITCH, 'bust': False}   # (popiersie: prawie na wprost i własne wymiary twarzy - render_bust)
HEAD_R = 10.0                    # głowa bohatera: kula r=10 (włosy x[-10,10]), środek 9.5 px pod górą włosów
HEAD_DY = 9.5
KONTUR = (10, 9, 8)
GREY = [(52, 52, 52), (78, 78, 78), (106, 106, 106), (134, 134, 134), (162, 162, 162), (190, 190, 190), (214, 214, 214)]
AKCENT = [(110, 30, 30), (150, 45, 45), (190, 60, 60), (230, 80, 80)]
OTWOR = 64
# wiersze klatki od góry, w których włosy poza hełmem są zdejmowane (kaptur, czepiec, garnczkowy - wszystkie)
CUT = {'kaptur': 32, 'czepiec': 32, 'kapalin': 21, 'otwarty': 21, 'nosal': 21, 'zakonny': 32}
MA_OTWOR = {'kaptur', 'czepiec'}
SWIATLO = np.array([-0.62, -0.72, 0.52])
SWIATLO = SWIATLO / np.linalg.norm(SWIATLO)


# ---------------------------------------------------------------------------------------------------------------------------
# pola odległości (p: tablica [..., 3] w układzie głowy: x w prawo, y w dół, z do przodu - w stronę twarzy; środek głowy = 0)
# ---------------------------------------------------------------------------------------------------------------------------
def length(*a):
    return np.sqrt(sum(v * v for v in a))


def sphere(p, c, r):
    return length(p[..., 0] - c[0], p[..., 1] - c[1], p[..., 2] - c[2]) - r


def ellipsoid(p, c, rad):
    x, y, z = (p[..., 0] - c[0]) / rad[0], (p[..., 1] - c[1]) / rad[1], (p[..., 2] - c[2]) / rad[2]
    return (length(x, y, z) - 1.0) * min(rad)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def frustum(p, y0, y1, r0, r1, cz=0.0):
    """pionowy ścięty stożek: od y0 (promień r0) do y1 (promień r1); cz - przesunięcie w tył / przód"""
    y = p[..., 1]
    t = np.clip((y - y0) / (y1 - y0), 0, 1)
    rr = r0 + (r1 - r0) * t
    side = (length(p[..., 0], p[..., 2] - cz) - rr) * 0.95
    cap = np.maximum(y0 - y, y - y1)
    return np.maximum(side, cap)


def above(p, y):   # półprzestrzeń nad płaszczyzną y (y w dół: mniejsze y = wyżej)
    return p[..., 1] - y


def ell_tube(p, cx, cy, ax, ay, z0):
    """eliptyczny tunel wzdłuż osi z (otwór twarzy), od z0 do przodu"""
    d = (length((p[..., 0] - cx) / ax, (p[..., 1] - cy) / ay) - 1.0) * min(ax, ay)
    return np.maximum(d, z0 - p[..., 2])


def box(p, c, half):
    q = np.abs(p - np.array(c)) - np.array(half)
    out = length(np.maximum(q[..., 0], 0), np.maximum(q[..., 1], 0), np.maximum(q[..., 2], 0))
    return out + np.minimum(np.maximum(q[..., 0], np.maximum(q[..., 1], q[..., 2])), 0)


def angle_xz(p):
    return np.arctan2(p[..., 0], p[..., 2])   # 0 = przód (twarz), +90° = prawy bok bohatera (lewo na ekranie przy widoku S? patrz niżej)


# ---------------------------------------------------------------------------------------------------------------------------
# bryły hełmów: lista (etykieta, odległość); 'glowa' = głowa bohatera (przez otwór ją widać)
# ---------------------------------------------------------------------------------------------------------------------------
def side_tube(p, cy, z0, ay, az):
    """otwór twarzy oglądany z boku: eliptyczny tunel wzdłuż osi x (przez oba boki kaptura), od z0 do przodu"""
    d = (length((p[..., 1] - cy) / ay, (p[..., 2] - (z0 + az)) / az) - 1.0) * min(ay, az)
    return d


def scena(rodzaj, p, yaw=None):
    head = sphere(p, (0, 0, 0), HEAD_R) if not TRYB['bust'] else ellipsoid(p, (0, 2.6, 0.0), (9.6, 13.0, 9.3))
    out = [('glowa', head)]
    side = yaw is not None and 60 <= yaw <= 150     # (z boku: otwór widać jako wycięcie z przodu - twarz z profilu)
    if rodzaj == 'kaptur':
        outer = smin(sphere(p, (0, -0.4, -0.6), 11.7), frustum(p, -1.0, (14.0 if TRYB['bust'] else 9.6), 11.0, 13.4, -2.0), 2.5)
        outer = smin(outer, sphere(p, (0, -9.4, -6.6), 3.0), 3.0)            # szpic z tyłu na czubku
        inner = np.minimum(sphere(p, (0, -0.4, -0.6), 10.6), frustum(p, -1.0, (15.5 if TRYB['bust'] else 11.0), 10.0, 12.4, -2.0))
        hole = ell_tube(p, 0, 1.0, 7.3, 5.9, 2.0) if not side else side_tube(p, 1.6, -0.6, 6.4, 10.5)
        if TRYB['bust']:
            hole = ell_tube(p, 0, 4.4, 7.0, 8.6, 2.0)
        shell = np.maximum(np.maximum(outer, -inner), -hole)
        if side:   # (z boku pod brodą kaptur przylega do szyi - nie wystaje do przodu jak dziób)
            shell = np.maximum(shell, np.minimum(p[..., 2] - 6.8 + 0.25 * np.clip(p[..., 1] - 6, 0, None), p[..., 1] - 5.0))
        out.append(('kaptur', shell))
    elif rodzaj == 'czepiec':
        outer = smin(sphere(p, (0, -0.3, -0.4), 11.1), frustum(p, 0.0, (13.0 if TRYB['bust'] else 9.0), 10.6, 12.2, -1.5), 2.0)
        inner = np.minimum(sphere(p, (0, -0.3, -0.4), 10.3), frustum(p, 0.0, (14.5 if TRYB['bust'] else 10.5), 9.9, 11.4, -1.5))
        hole = ell_tube(p, 0, 1.3, 6.3, 5.3, 2.0) if not side else side_tube(p, 1.6, 0.2, 5.8, 10.0)
        if TRYB['bust']:
            hole = ell_tube(p, 0, 4.4, 6.5, 8.2, 2.0)
        shell = np.maximum(np.maximum(outer, -inner), -hole)
        if side:
            shell = np.maximum(shell, np.minimum(p[..., 2] - 6.6 + 0.25 * np.clip(p[..., 1] - 6, 0, None), p[..., 1] - 5.5))
        out.append(('czepiec', shell))
    elif rodzaj == 'kapalin':
        yr = -2.4
        dome = np.maximum(ellipsoid(p, (0, yr, 0), (9.7, 10.0, 9.7)), p[..., 1] - yr)
        r = length(p[..., 0], p[..., 2])
        yb = yr + 0.30 * np.clip(r - 9.0, 0, None)
        brim = np.maximum(np.maximum(np.abs(p[..., 1] - yb - 0.55) - 0.55, r - 13.4), 8.6 - r) * 0.9
        band = np.maximum(np.maximum(np.abs(p[..., 1] - (yr - 1.0)) - 1.0, length(p[..., 0], p[..., 2]) - 9.95), 9.0 - r)
        out += [('kopula', dome), ('rondo', brim), ('pasek', band)]
    elif rodzaj in ('otwarty', 'nosal'):
        yr = -1.6
        if rodzaj == 'otwarty':
            ya, pw, rb = -13.8, 0.40, 10.3                   # zaokrąglona dzwona z lekkim szpicem
        else:
            ya, pw, rb = (-13.4 if TRYB['bust'] else -16.0), 0.55, 10.2   # stożek (na popiersiu niższy - mieści się w obrazku)
        t = np.clip((p[..., 1] - ya) / (yr - ya), 0, 1)
        rad = rb * np.power(t, pw)
        dome = np.maximum((length(p[..., 0], p[..., 2]) - rad) * 0.5, np.maximum(p[..., 1] - yr, ya - p[..., 1]))
        rim = np.maximum(np.maximum(np.abs(p[..., 1] - (yr - 0.8)) - 0.95, length(p[..., 0], p[..., 2]) - 10.8), 9.3 - length(p[..., 0], p[..., 2]))
        out += [('dzwona', dome), ('opaska', rim)]
        if rodzaj == 'nosal':
            # nosal: sztabka przed twarzą, lekko wygięta wzdłuż twarzy
            zc = 10.6 - 0.06 * np.clip(p[..., 1] - yr, 0, None) ** 2
            nasal = np.maximum(np.maximum(np.abs(p[..., 0]) - 0.95, np.abs(p[..., 2] - zc) - 0.6), np.maximum(yr - 1.0 - p[..., 1], p[..., 1] - (yr + (9.6 if TRYB['bust'] else 6.4))))
            out.append(('nosal', nasal))
    elif rodzaj == 'zakonny':
        yt, yb = -10.6, (13.8 if TRYB['bust'] else 7.6)   # (popiersie: twarz dłuższa - garniec do brody)
        r = length(p[..., 0], p[..., 2] * 1.04)
        taper = 10.4 - 0.025 * np.clip(p[..., 1] - yt, 0, None) * 0 + 0.0
        side = r - (10.0 + 0.6 * np.clip((p[..., 1] - yt) / 4.0, 0, 1))   # górna krawędź lekko zaokrąglona
        cyl = np.maximum(side, np.maximum(yt - p[..., 1], p[..., 1] - yb))
        out.append(('garniec', cyl))
    return out


# ---------------------------------------------------------------------------------------------------------------------------
# widok: obrót wokół pionu (yaw) i lekko z góry (pitch); ekran: x w prawo, y w dół, głębia w stronę patrzącego
# ---------------------------------------------------------------------------------------------------------------------------
def view_to_model(vx, vy, vz, yaw):
    a = np.radians(yaw)
    c, s = np.cos(TRYB['pitch']), np.sin(TRYB['pitch'])
    yw = vy * c - vz * s
    zw = vy * s + vz * c
    xw = vx
    x = xw * np.cos(a) + zw * np.sin(a)
    z = -xw * np.sin(a) + zw * np.cos(a)
    return np.stack([x, yw, z], axis=-1)


def vec_to_view(n, yaw):
    a = np.radians(yaw)
    x, y, z = n[..., 0], n[..., 1], n[..., 2]
    xw = x * np.cos(a) - z * np.sin(a)
    zw = x * np.sin(a) + z * np.cos(a)
    c, s = np.cos(TRYB['pitch']), np.sin(TRYB['pitch'])
    vy = y * c + zw * s
    vz = -y * s + zw * c
    return np.stack([xw, vy, vz], axis=-1)


def total(rodzaj, p, yaw=None):
    parts = scena(rodzaj, p, yaw)
    d = parts[0][1]
    for _, v in parts[1:]:
        d = np.minimum(d, v)
    return d, parts


def march(rodzaj, vx, vy, yaw, steps=260):
    """promienie z przodu ekranu w głąb; zwraca: trafienie, punkt (model), głębia"""
    n = vx.size
    vx, vy = vx.ravel(), vy.ravel()
    t = np.zeros(n)
    hit = np.zeros(n, bool)
    alive = np.arange(n)
    Z0 = 40.0
    for _ in range(steps):
        if not len(alive):
            break
        p = view_to_model(vx[alive], vy[alive], Z0 - t[alive], yaw)
        d, _ = total(rodzaj, p, yaw)
        h = d < 0.012
        hit[alive[h]] = True
        t[alive] += np.maximum(d * 0.6, 0.006)
        alive = alive[~h & (t[alive] < 2 * Z0)]
    p = view_to_model(vx, vy, Z0 - t, yaw)
    return hit, p, Z0 - t


def shade_at(rodzaj, p, yaw):
    e = 0.04
    d0, parts = total(rodzaj, p, yaw)
    names = [nm for nm, _ in parts]
    lab = np.argmin(np.stack([v for _, v in parts], -1), -1)
    g = []
    for k in range(3):
        dp = np.zeros_like(p)
        dp[..., k] = e
        g.append(total(rodzaj, p + dp, yaw)[0] - total(rodzaj, p - dp, yaw)[0])
    nrm = np.stack(g, -1)
    nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True) + 1e-9
    nv = vec_to_view(nrm, yaw)
    return nv, lab, names


# ---------------------------------------------------------------------------------------------------------------------------
# klatka gry (32x32): render z nadpróbkowaniem, potem piksele
# ---------------------------------------------------------------------------------------------------------------------------
SS = 4


def render_frame(rodzaj, widok):
    yaw = YAW[widok]
    us = (np.arange(FW * SS) + 0.5) / SS
    vs = (np.arange(FH * SS) + 0.5) / SS
    U, V = np.meshgrid(us, vs)
    ox, oy = KOTWICA[0] + 0.5, KOTWICA[1] + HEAD_DY      # ekran (ciągły) środka głowy
    vx, vy = U - ox, V - oy
    hit, p, depth = march(rodzaj, vx, vy, yaw)
    nv, lab, names = shade_at(rodzaj, p, yaw)
    lab = np.where(hit, lab, -1)
    sh = SS * SS
    L = lab.reshape(FH, SS, FW, SS).transpose(0, 2, 1, 3).reshape(FH, FW, sh)
    N = nv.reshape(FH, SS, FW, SS, 3).transpose(0, 2, 1, 3, 4).reshape(FH, FW, sh, 3)
    P = p.reshape(FH, SS, FW, SS, 3).transpose(0, 2, 1, 3, 4).reshape(FH, FW, sh, 3)
    D = depth.reshape(FH, SS, FW, SS).transpose(0, 2, 1, 3).reshape(FH, FW, sh)
    head = names.index('glowa')
    helm = (L >= 0) & (L != head)
    hf = helm.mean(-1)
    gf = (L == head).mean(-1)
    pix = hf >= 0.45
    # etykieta piksela: najczęstsza część hełmu; normalna, punkt i głębia - średnia z jej podpikseli
    out_lab = np.full((FH, FW), -1)
    out_n = np.zeros((FH, FW, 3))
    out_p = np.zeros((FH, FW, 3))
    out_d = np.full((FH, FW), -99.0)
    for y in range(FH):
        for x in range(FW):
            if not pix[y, x]:
                continue
            ls = L[y, x][helm[y, x]]
            k = np.bincount(ls).argmax()
            sel = L[y, x] == k
            out_lab[y, x] = k
            nn = N[y, x][sel].mean(0)
            out_n[y, x] = nn / (np.linalg.norm(nn) + 1e-9)
            out_p[y, x] = P[y, x][sel].mean(0)
            out_d[y, x] = D[y, x][sel].mean()
    opening = (~pix) & (gf >= 0.5) & (rodzaj in MA_OTWOR)
    return dict(lab=out_lab, n=out_n, p=out_p, d=out_d, pix=pix, opening=opening, names=names, yaw=yaw)


def tone_of(n, gloss=0.0):
    lam = np.clip((n * SWIATLO).sum(-1), 0, 1)
    v = 0.16 + 0.84 * lam ** 0.9
    k = np.clip(np.round(v * 6.2 - 0.35), 0, 6).astype(int)
    if gloss:
        hv = SWIATLO + np.array([0, 0, 1.0])
        hv = hv / np.linalg.norm(hv)
        spec = (n * hv).sum(-1)
        k = np.where(spec > 1 - gloss, 6, k)
    return k


# linie konturu między częściami: (bliższa, dalsza) - kontur idzie na dalszą
LINIE = {('rondo', 'kopula'), ('kopula', 'rondo'), ('pasek', 'rondo'), ('rondo', 'pasek'), ('opaska', 'dzwona'), ('dzwona', 'opaska'),
         ('nosal', 'opaska'), ('nosal', 'dzwona'), ('opaska', 'nosal')}


def frame_pixels(rodzaj, widok):
    r = render_frame(rodzaj, widok)
    lab, n, p, d, pix, names = r['lab'], r['n'], r['p'], r['d'], r['pix'], r['names']
    img = np.zeros((FH, FW, 4), np.uint8)
    kind = np.full((FH, FW), '', object)
    for y in range(FH):
        for x in range(FW):
            if pix[y, x]:
                kind[y, x] = names[lab[y, x]]
    gloss = {'kaptur': 0, 'czepiec': 0.0, 'kapalin': 0.035, 'otwarty': 0.035, 'nosal': 0.035, 'zakonny': 0.03}[rodzaj]
    k = tone_of(n, gloss)
    tone = np.where(pix, k, -1)
    acc = np.full((FH, FW), -1)           # >=0: ton akcentu
    black = np.zeros((FH, FW), bool)
    px, py, pz = p[..., 0], p[..., 1], p[..., 2]
    ang = np.degrees(np.arctan2(px, pz))   # 0 = przód
    # ---- ozdoby i części
    for y in range(FH):
        for x in range(FW):
            if not pix[y, x]:
                continue
            kd, a = kind[y, x], ang[y, x]
            X, Y, Z = px[y, x], py[y, x], pz[y, x]
            if kd == 'pasek':
                acc[y, x] = min(3, max(0, tone[y, x] - 2))
            if kd == 'opaska':
                tone[y, x] = min(6, tone[y, x] + 1)
                # nity co 30° na opasce
                if abs(((a + 15) % 30) - 15) < 2.6 and abs(Y - (-2.4)) < 0.6:
                    acc[y, x] = 3 if tone[y, x] >= 4 else 2
            if kd == 'nosal':
                tone[y, x] = min(6, tone[y, x] + 1)
            if kd == 'dzwona' and rodzaj == 'otwarty':
                # spangi: 4 pasy od czubka (przód, boki, tył), jaśniejsze, z cieniem po prawej (światło z lewej)
                for c in (0, 90, -90, 180, -180):
                    if -2.0 < a - c < 6.5 and Y < -2.8:
                        tone[y, x] = min(6, tone[y, x] + 1) if a - c < 4.0 else max(0, tone[y, x] - 1)
            if kd == 'dzwona' and rodzaj == 'nosal':
                # grzbiet od czubka do nosala (przód) i do karku (tył)
                if (abs(a) < 5 or abs(abs(a) - 180) < 5) and Y < -2.6:
                    tone[y, x] = min(6, tone[y, x] + 1)
            if kd == 'garniec':
                top = Y < -10.2 + 0.4
                if top:
                    tone[y, x] = min(6, tone[y, x] + 1)
                front = Z > 3.0 and abs(a) < 62
                # krzyż: pionowe wzmocnienie na środku + pas na brwiach (akcent)
                if front and abs(X) < 1.25 and Y > -9.8:
                    acc[y, x] = 2 if tone[y, x] < 4 else 3
                if front and -2.9 < Y < -1.3 and abs(X) < 8.2:
                    acc[y, x] = 2 if tone[y, x] < 4 else 3
                # wizjer: szczelina po obu stronach wzmocnienia
                if front and -0.9 < Y < 0.9 and 1.25 <= abs(X) < 7.6:
                    black[y, x] = True
                # otwory oddechowe (prawa dolna część przedniej płyty)
                if front and 2.4 < Y < 6.6 and 2.6 < X < 7.2:
                    if (round(X * 1.0) % 2 == 0) and (round(Y) % 2 == 1):
                        black[y, x] = True
                # nity: wieniec pod górną krawędzią i przy dolnej
                if (abs(Y - (-8.6)) < 0.55 or abs(Y - 6.3) < 0.55) and abs(((a + 11.25) % 22.5) - 11.25) < 3.0 and not (front and abs(X) < 1.3):
                    acc[y, x] = 3
                # szew z tyłu
                if abs(abs(a) - 180) < 3.5 and Y > -9.5:
                    tone[y, x] = max(0, tone[y, x] - 2)
    # ---- linie między częściami (na dalszej)
    for y in range(FH):
        for x in range(FW):
            if not pix[y, x]:
                continue
            for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < FH and 0 <= xx < FW and pix[yy, xx] and (kind[yy, xx], kind[y, x]) in LINIE and d[yy, xx] > d[y, x] + 0.3:
                    black[y, x] = True
    # ---- kontur wewnętrzny przy otworze (brzeg kaptura / czepca) i jasny wywinięty brzeg obok
    opening = r['opening']
    edge = np.zeros((FH, FW), bool)
    for y in range(FH):
        for x in range(FW):
            if pix[y, x] and any(0 <= y + dy < FH and 0 <= x + dx < FW and opening[y + dy, x + dx] for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0))):
                edge[y, x] = True
    for y in range(FH):
        for x in range(FW):
            if edge[y, x]:
                black[y, x] = True
            elif pix[y, x] and any(0 <= y + dy < FH and 0 <= x + dx < FW and edge[y + dy, x + dx] for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0))):
                tone[y, x] = min(6, tone[y, x] + 1)
    # ---- piksele
    for y in range(FH):
        for x in range(FW):
            if not pix[y, x]:
                if opening[y, x]:
                    img[y, x] = (0, 0, 0, OTWOR)
                continue
            if black[y, x]:
                c = KONTUR
            elif acc[y, x] >= 0:
                c = AKCENT[int(acc[y, x])]
            else:
                c = GREY[int(tone[y, x])]
            img[y, x, :3] = c
            img[y, x, 3] = 255
    # ---- kontur zewnętrzny: przezroczysty piksel obok kształtu (nie w otworze)
    shape = img[:, :, 3] == 255
    add = []
    for y in range(FH):
        for x in range(FW):
            if shape[y, x] or img[y, x, 3] == OTWOR:
                continue
            if any(0 <= y + dy < FH and 0 <= x + dx < FW and shape[y + dy, x + dx] for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0))):
                add.append((y, x))
    for y, x in add:
        # (nosal: bez obrysu po oświetlonej, lewej stronie - inaczej sztabka 2 px w czarnej ramce zlewa się w ciemną plamę)
        nb = [kind[y + dy, x + dx] for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)) if 0 <= y + dy < FH and 0 <= x + dx < FW and pix[y + dy, x + dx]]
        if nb and all(k == 'nosal' for k in nb) and x + 1 < FW and kind[y, x + 1] == 'nosal':
            continue
        img[y, x, :3] = KONTUR
        img[y, x, 3] = 255
    return img


def sheet(rodzaj):
    return np.concatenate([frame_pixels(rodzaj, w) for w in WIDOKI], axis=1)


# ---------------------------------------------------------------------------------------------------------------------------
# popiersie (330x350, malowany portret 3/4 w lewo): ta sama bryła w dużej skali, gładkie cieniowanie, obrys, zmniejszenie z 4x
# ---------------------------------------------------------------------------------------------------------------------------
BUST_SRC = os.path.join(GAME, 'img', 'pictures', 'Hero_Bust.png')
BUST = dict(cx=171.0, cy=104.0, sx=7.9, sy=7.1, yaw=16, pitch=6)     # środek głowy na portrecie, skala (piksele popiersia na piksel gry), obrót
BUST_SS = 3


def render_bust(rodzaj, W=330, H=350):
    S = BUST_SS
    x0, x1, y0, y1 = 20, 320, 0, 300                      # obszar głowy
    us = (np.arange((x1 - x0) * S) + 0.5) / S + x0
    vs = (np.arange((y1 - y0) * S) + 0.5) / S + y0
    U, V = np.meshgrid(us, vs)
    vx = (U - BUST['cx']) / BUST['sx']
    vy = (V - BUST['cy']) / BUST['sy']
    TRYB.update(pitch=np.radians(BUST['pitch']), bust=True)
    try:
        hit, p, depth = march(rodzaj, vx, vy, BUST['yaw'], steps=300)
        nv, lab, names = shade_at(rodzaj, p, BUST['yaw'])
    finally:
        TRYB.update(pitch=PITCH, bust=False)
    lab = np.where(hit, lab, -1).reshape(V.shape)
    nv = nv.reshape(V.shape + (3,))
    p = p.reshape(V.shape + (3,))
    head = names.index('glowa')
    helm = (lab >= 0) & (lab != head)
    lam = np.clip((nv * SWIATLO).sum(-1), 0, 1)
    v = 0.18 + 0.78 * lam ** 0.85
    hv = SWIATLO + np.array([0, 0, 1.0])
    hv /= np.linalg.norm(hv)
    spec = np.clip((nv * hv).sum(-1), 0, 1) ** 40
    metal = rodzaj not in ('kaptur',)
    if metal:
        v = np.clip(v + 0.35 * spec, 0, 1)
    g = (40 + v * 190).astype(np.uint8)
    big = np.zeros(V.shape + (4,), np.uint8)
    big[helm, 0] = g[helm]
    big[helm, 1] = g[helm]
    big[helm, 2] = g[helm]
    big[helm, 3] = 255
    kind = np.array(names, object)[np.clip(lab, 0, None)]
    px, py, pz = p[..., 0], p[..., 1], p[..., 2]
    ang = np.degrees(np.arctan2(px, pz))
    dark = np.zeros(V.shape, bool)
    accm = np.zeros(V.shape, bool)
    lighter = np.zeros(V.shape, bool)
    if rodzaj == 'kapalin':
        accm |= helm & (kind == 'pasek')
    if rodzaj in ('otwarty', 'nosal'):
        lighter |= helm & (kind == 'opaska')
        lighter |= helm & (kind == 'nosal')
        riv = helm & (kind == 'opaska') & (np.abs(((ang + 15) % 30) - 15) < 2.2) & (np.abs(py + 2.4) < 0.45)
        accm |= riv
        if rodzaj == 'otwarty':
            for c in (0, 90, -90, 180, -180):
                band = helm & (kind == 'dzwona') & (np.abs(ang - c) < 7.0) & (py < -2.8)
                lighter |= band
                dark |= helm & (kind == 'dzwona') & (np.abs(np.abs(ang - c) - 7.0) < 0.6) & (py < -2.8)
        else:
            lighter |= helm & (kind == 'dzwona') & ((np.abs(ang) < 4) | (np.abs(np.abs(ang) - 180) < 4)) & (py < -2.6)
    if rodzaj == 'zakonny':
        front = helm & (pz > 3.0) & (np.abs(ang) < 62)
        accm |= front & (np.abs(px) < 1.25) & (py > -9.8)
        accm |= front & (py > -2.9) & (py < -1.3) & (np.abs(px) < 8.2)
        dark |= front & (py > -0.8) & (py < 0.8) & (np.abs(px) >= 1.25) & (np.abs(px) < 7.6)
        holes = front & (py > 2.4) & (py < 6.6) & (px > 2.6) & (px < 7.2)
        holes &= (np.abs(((px + 0.5) % 1.6) - 0.8) < 0.32) & (np.abs(((py + 0.5) % 1.6) - 0.8) < 0.32)
        dark |= holes
        riv = helm & ((np.abs(py + 8.6) < 0.4) | (np.abs(py - 6.3) < 0.4)) & (np.abs(((ang + 11.25) % 22.5) - 11.25) < 2.0) & ~(front & (np.abs(px) < 1.3))
        accm |= riv
        lighter |= helm & (py < -10.0)
    # otwór (twarz widoczna przez kaptur / czepiec) i dolny brzeg hełmu na środku twarzy - dla gry (BUST_CUT, BUST_OTWOR)
    S_ = BUST_SS
    info = {}
    gl = (lab == head)
    if rodzaj in MA_OTWOR:
        rows_h = np.where(helm.any(1))[0]
        enc = gl.copy()
        enc &= np.maximum.accumulate(helm, axis=1) & np.maximum.accumulate(helm[:, ::-1], axis=1)[:, ::-1] & np.maximum.accumulate(helm, axis=0)
        ys, xs = np.nonzero(enc)
        if len(ys):
            info['otwor'] = (round(x0 + (xs.min() + xs.max()) / 2 / S_), round(y0 + (ys.min() + ys.max()) / 2 / S_),
                             round((xs.max() - xs.min()) / 2 / S_), round((ys.max() - ys.min()) / 2 / S_))
    cxs = int((BUST['cx'] - x0) * S_)
    colh = helm[:, max(0, cxs - 12 * S_):cxs + 12 * S_].any(1)
    info['dol'] = round(y0 + np.nonzero(colh)[0].max() / S_) if colh.any() else 0
    big[lighter, :3] = np.clip(big[lighter, :3].astype(int) + 28, 0, 255).astype(np.uint8)
    # akcent: czerwonawy szablon wg jasności
    if accm.any():
        gg = g[accm].astype(float) / 255
        big[accm, 0] = (90 + gg * 160).astype(np.uint8)
        big[accm, 1] = (24 + gg * 60).astype(np.uint8)
        big[accm, 2] = (24 + gg * 60).astype(np.uint8)
    big[dark, :3] = (26, 22, 20)
    # linie między częściami: tam, gdzie sąsiad (o 1-2 px w 4x) ma inną część i jest bliżej
    lab2 = np.where(helm, lab, -1)
    edge = np.zeros(V.shape, bool)
    for dy, dx in ((0, 2), (2, 0), (0, -2), (-2, 0)):
        sh = np.roll(np.roll(lab2, dy, 0), dx, 1)
        edge |= helm & (sh >= 0) & (sh != lab2)
    big[edge, :3] = (26, 22, 20)
    # obrys zewnętrzny i zmniejszenie (jak popiersie.py: finish)
    im = Image.fromarray(big, 'RGBA')
    a = im.split()[3]
    grown = a.filter(ImageFilter.MaxFilter(5))
    ol = Image.new('RGBA', im.size, (26, 22, 20, 0))
    ol.putalpha(grown)
    # (otwór kaptura / czepca: obrys tylko po stronie nakrycia - twarz zostaje)
    ol.alpha_composite(im)
    small = ol.resize(((x1 - x0), (y1 - y0)), Image.LANCZOS)
    res = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # cień pod brzegiem nakrycia na twarzy (miękki)
    sh_mask = Image.fromarray((helm * 255).astype(np.uint8), 'L').resize(((x1 - x0), (y1 - y0)), Image.BILINEAR)
    shadow = Image.new('RGBA', ((x1 - x0), (y1 - y0)), (20, 12, 8, 0))
    sm = np.array(sh_mask).astype(float)
    sm2 = np.roll(sm, 6, 0)
    sa = np.clip(sm2 - sm, 0, 255) * 0.30
    shadow.putalpha(Image.fromarray(sa.astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(3)))
    if rodzaj != 'zakonny':
        res.alpha_composite(shadow, (x0, y0))
    res.alpha_composite(small, (x0, y0))
    return res, info


# ---------------------------------------------------------------------------------------------------------------------------
# podglądy
# ---------------------------------------------------------------------------------------------------------------------------
RAMPY = {
    'skora': ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f", "#bd8a55"],
    'zelazo': ["#1b1d20", "#2c2f33", "#40444a", "#565b62", "#6e747b", "#888e95", "#a4a9ae"],
    'stal': ["#1c222a", "#2e3742", "#44505d", "#5d6b7a", "#7a8999", "#9cabb9", "#c4d0da"],
}
AKC = {'skora': ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"], 'zelazo': ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"],
       'stal': ["#5a3c10", "#8a6420", "#b88c34", "#e0bc5c"]}


def hx(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def recolor(img, ramp, acc):
    out = img.copy()
    rp = [hx(c) for c in ramp]
    ap = [hx(c) for c in acc]
    for y in range(img.shape[0]):
        for x in range(img.shape[1]):
            r, g, b, a = [int(v) for v in img[y, x]]
            if a != 255 or (r < 20 and g < 20 and b < 20):
                continue
            if r > g + 15:
                k = int(np.argmin([abs(r - c[0]) for c in AKCENT]))
                out[y, x, :3] = ap[k]
            else:
                lum = r / 255.0
                t = np.clip((lum - 0.18) / 0.68, 0, 1)
                out[y, x, :3] = rp[int(round(t * (len(rp) - 1)))]
    return out


def compose_walk(fr, rodzaj, i, walk, hair, C=64):
    """klatka chodu (kolumna 0, wiersz i) z hełmem: kotwica jak w Ubior.js, włosy nad CUT poza hełmem zdjęte, otwór - oryginał"""
    cell = walk[i * C:(i + 1) * C, 0:C].copy()
    hm = hair[i * C:(i + 1) * C, 0:C]
    rws = hm.sum(1)
    top = next(y for y in range(C) if rws[y] >= 6)
    xs = [x for y in range(top, top + 5) for x in range(C) if hm[y, x]]
    ax = int(round(sum(xs) / len(xs)))
    ox, oy = ax - KOTWICA[0], top - KOTWICA[1]
    cut = CUT[rodzaj]
    for y in range(C):
        for x in range(C):
            fy, fx = y - oy, x - ox
            a = fr[fy, fx, 3] if (0 <= fy < FH and 0 <= fx < FW) else 0
            if hm[y, x] and fy < cut and a == 0:
                cell[y, x, 3] = 0
    big = np.zeros((C + 12, C, 4), np.uint8)          # (12 px zapasu nad klatką - jak pasek nad głową w grze)
    big[12:] = cell
    for fy in range(FH):
        for fx in range(FW):
            y, x = oy + fy + 12, ox + fx
            if 0 <= y < C + 12 and 0 <= x < C and fr[fy, fx, 3] == 255:
                big[y, x] = fr[fy, fx]
    return big


def preview_game(sheets, d):
    walk = np.array(Image.open(os.path.join(GAME, 'img', 'characters', 'Hero_Walk.png')).convert('RGBA'))
    mask = np.array(Image.open(os.path.join(GAME, 'img', 'system', 'Ubior_Maska_Hero_Walk.png')).convert('RGBA'))
    hair = ((mask[:, :, 0] == 0x3c) & (mask[:, :, 1] == 0x3c) & (mask[:, :, 2] == 0xdc)) | ((mask[:, :, 0] == 0x14) & (mask[:, :, 1] == 0x14) & (mask[:, :, 2] == 0x6e))
    hair &= mask[:, :, 3] > 0
    CW, CH = 40, 50                                   # wycinek: głowa i ramiona
    for mat in RAMPY:
        out = Image.new('RGBA', (CW * 6, CH * len(RODZAJE)), (78, 108, 72, 255))
        for j, rodzaj in enumerate(RODZAJE):
            sh = recolor(sheets[rodzaj], RAMPY[mat], AKC[mat])
            for i in range(5):
                big = compose_walk(sh[:, i * FW:(i + 1) * FW], rodzaj, i, walk, hair)
                out.alpha_composite(Image.fromarray(big).crop((12, 0, 12 + CW, CH)), (i * CW, j * CH))
            out.alpha_composite(Image.fromarray(sheets[rodzaj]).crop((0, 0, 32, 32)), (5 * CW + 4, j * CH + 8))
        out.resize((out.width * 5, out.height * 5), Image.NEAREST).save(os.path.join(d, 'helmy_na_glowie_' + mat + '.png'))


def preview_sheets(sheets, path):
    rows = []
    for rodzaj in RODZAJE:
        s = sheets[rodzaj].copy()
        bg = np.zeros_like(s)
        bg[:] = (78, 108, 72, 255)
        op = s[:, :, 3] == OTWOR
        s2 = s.copy()
        s2[op] = (255, 0, 255, 255)
        rows.append(np.array(Image.alpha_composite(Image.fromarray(bg), Image.fromarray(s2))))
    out = Image.fromarray(np.concatenate(rows, axis=0))
    out.resize((out.width * 8, out.height * 8), Image.NEAREST).save(path)


def preview_bust(busts, path):
    base = Image.open(BUST_SRC).convert('RGBA')
    bm = np.array(Image.open(os.path.join(GAME, 'img', 'system', 'Ubior_Maska_Hero_Bust.png')).convert('RGBA'))
    hair = (bm[:, :, 0] == 0x3c) & (bm[:, :, 1] == 0x3c) & (bm[:, :, 2] == 0xdc) & (bm[:, :, 3] > 0)
    tiles = []
    for rodzaj in RODZAJE:
        ov = busts[rodzaj]
        oa = np.array(ov)
        b = np.array(base).copy()
        cy = BUST_CUT[rodzaj]
        hole = BUST_OTWOR.get(rodzaj)
        YY, XX = np.mgrid[0:b.shape[0], 0:b.shape[1]]
        inhole = np.zeros(hair.shape, bool)
        if hole:
            inhole = ((XX - hole[0]) / hole[2]) ** 2 + ((YY - hole[1]) / hole[3]) ** 2 <= 1
        kill = hair & (YY < cy) & (oa[:, :, 3] < 128) & ~inhole
        b[kill, 3] = 0
        im = Image.fromarray(b)
        mat = 'stal' if rodzaj != 'kaptur' else 'skora'
        rp = [hx(c) for c in RAMPY[mat]]
        o2 = oa.copy()
        for y, x in zip(*np.nonzero(oa[:, :, 3] > 0)):
            r, g, bb = [int(v) for v in oa[y, x, :3]]
            if r < 40 and g < 40 and bb < 40:
                continue
            if r > g + 15:
                o2[y, x, :3] = (int(150 + (r - 90) * 0.5), int(110 + (r - 90) * 0.45), 40)
            else:
                t = np.clip((r / 255 - 0.15) / 0.75, 0, 1) * (len(rp) - 1)
                k = int(t)
                f = t - k
                k2 = min(len(rp) - 1, k + 1)
                o2[y, x, :3] = [int(rp[k][c] + (rp[k2][c] - rp[k][c]) * f) for c in range(3)]
        im.alpha_composite(Image.fromarray(o2))
        tiles.append(im)
    W, H = base.size
    sheet = Image.new('RGBA', (W * 3, H * 2), (66, 100, 62, 255))
    for i, t in enumerate(tiles):
        sheet.alpha_composite(t, ((i % 3) * W, (i // 3) * H))
    sheet.save(path)


# popiersie: wiersz, nad którym włosy poza nakryciem znikają, i elipsa otworu (cx, cy, rx, ry), w której włosy zostają
BUST_CUT = {'kaptur': 350, 'czepiec': 350, 'kapalin': 108, 'otwarty': 98, 'nosal': 98, 'zakonny': 350}
BUST_OTWOR = {'kaptur': (154, 142, 52, 60), 'czepiec': (153, 142, 49, 58)}   # (z render_bust: info['otwor'])


def main(argv):
    sheets = {}
    for rodzaj in RODZAJE:
        s = sheet(rodzaj)
        sheets[rodzaj] = s
        p = os.path.join(GAME, 'img', 'system', 'Ubior_Helm_' + rodzaj[0].upper() + rodzaj[1:] + '.png')
        Image.fromarray(s, 'RGBA').save(p)
        print('->', os.path.relpath(p, GAME).replace('\\', '/'), s.shape[1], 'x', s.shape[0], 'CUT', CUT[rodzaj])
    busts = {}
    if '--bez-popiersia' not in argv:
        for rodzaj in RODZAJE:
            b, info = render_bust(rodzaj)
            busts[rodzaj] = b
            print('   popiersie', rodzaj, info)
            p = os.path.join(GAME, 'img', 'system', 'Ubior_Bust_Helm_' + rodzaj[0].upper() + rodzaj[1:] + '.png')
            b.save(p, optimize=True)
            print('->', os.path.relpath(p, GAME).replace('\\', '/'), b.size)
    if '--podglad' in argv:
        d = argv[argv.index('--podglad') + 1]
        os.makedirs(d, exist_ok=True)
        preview_sheets(sheets, os.path.join(d, 'helmy_szablony.png'))
        preview_game(sheets, d)
        if busts:
            preview_bust(busts, os.path.join(d, 'helmy_popiersie.png'))


if __name__ == '__main__':
    main(sys.argv[1:])
