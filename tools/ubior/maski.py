# tools/ubior/maski.py - maski części ciała bohatera dla ubioru (js/plugins/Ubior.js). Próba 2026-10-22, wszystkie arkusze 2026-10-22.
#
# Dla każdego arkusza bohatera (img/characters/Hero_Walk.png, img/system/Hero_Axe.png...) robi obraz tej samej wielkości, w którym
# każdy piksel postaci ma kolor swojej części: włosy, twarz i szyja, dłonie, stopy, reszta skóry, koszula, spodnie, pas, narzędzie,
# kontur... (tabela CZESCI niżej). Gra (Ubior.js) przemalowuje potem tylko piksele danej części (koszula -> rampa nowego materiału,
# stopy -> buty, dłonie -> rękawice, pas -> pasek) i kładzie kapelusz na głowie (górę włosów bierze z maski).
#
#   python tools/ubior/maski.py                      -> maski WSZYSTKICH arkuszy (ARKUSZE) do img/system/Ubior_Maska_<arkusz>.png
#   python tools/ubior/maski.py Hero_Run Hero_Pick   -> tylko te
#   python tools/ubior/maski.py --podglad KATALOG    -> do tego podgląd (arkusz | maska | maska na arkuszu, x3) w KATALOGU
#   python tools/ubior/maski.py --paleta             -> tabela kolor -> klasa (wszystkie arkusze bohatera), bez zapisu masek
#   python tools/ubior/maski.py --raport PLIK.json   -> do tego liczby części na klatkę (kontrola: tools/ubior/przeglad_masek.py)
#
# Jak dzieli (każda klatka osobno):
#   1. Klasa koloru (HSV): K kontur (prawie czarny), D ciemna szarość (włosy), G szarość (koszula / metal), S cielisty (skóra, sznurek,
#      jasne drewno; bardzo nasycone pomarańcze - płomień - już nie), B brąz (spodnie, trzonek, cień skóry), O inne (płomień, iskry).
#      Sam kolor nie wystarcza: ostrze siekiery ma te same szarości co koszula, trzonek te same brązy co spodnie i cień skóry.
#   2. Włosy: największa spójna plama D (+ jej kawałki przecięte trzonkiem). Głowa = prostokąt włosów + 3 piksele w dół.
#   3. Rdzeń ciała: sylwetka po "otwarciu" (erozja + dylatacja kołem r=2) - znika cienki trzonek, palce, kosmyki. Oś ciała: od środka
#      włosów do środka rdzenia (pionowa, gdy stoi; pozioma, gdy leży) - "dół" stóp i dziur w nogawkach liczy się wzdłuż niej.
#   4. Koszula: plamy G w rdzeniu ciała między brodą a kolanem, blisko osi tułowia; plama z białą krawędzią albo daleko w bok
#      (ostrze na końcu trzonka), nad głową albo niżej kolan -> narzędzie.
#   5. Pas: cieliste / brązowe piksele w wąskim (do 5 px) pasku, nad którym i pod którym w tej samej kolumnie jest koszula (sznurek
#      przez tunikę) + zwisający węzeł.
#   6. Skóra: plama blisko włosów (40%+ w 3 px od nich albo w głowie) -> twarz i szyja; plamy najdalej wzdłuż osi ciała, bez spodni
#      tuż za nimi (dziury w nogawkach to nie stopy) -> stopy; plama otoczona spodniami -> reszta skóry (kolano w dziurze); pozostałe:
#      ręka od rękawa (odległość wewnątrz plamy od koszuli) - ostatnie 4 px (co najmniej połowa) to dłoń, reszta to przedramię.
#   7. Brązy: w głowie (większe niż 4 px) i poza rdzeniem -> narzędzie; cienka długa kreska -> narzędzie (trzonek); nad pasem -> narzędzie
#      (trzonek na piersi); reszta w rdzeniu -> spodnie.
#   8. Kontur i ciemne piksele: część większości sąsiadów (kontur włosów, stóp, koszuli, narzędzia).
#   9. Ręczne poprawki (POPRAWKI): prostokąt w jednej klatce, część -> część (tam, gdzie reguły się mylą).
import sys, os, json
from collections import deque, Counter
import numpy as np
from PIL import Image

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))

# wszystkie arkusze bohatera: folder, komórka, kierunki wierszy (jak w HeroLook.js), czy coś trzyma w ręku
# (chód / bieg / skradanie: 8 wierszy po 64; ruchy w img/system: 4 wiersze po 96 - dół, lewo, prawo, góra)
W8 = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
W4 = ['S', 'W', 'E', 'N']
ARKUSZE = {
    'Hero_Walk': dict(folder='characters', cell=64, rows=W8, narzedzie=False),
    'Hero_Run': dict(folder='characters', cell=64, rows=W8, narzedzie=False),
    'Hero_Sneak': dict(folder='characters', cell=64, rows=W8, narzedzie=False),
    'Hero_TorchWalk': dict(folder='characters', cell=64, rows=W8, narzedzie=True),
    'Hero_TorchRun': dict(folder='characters', cell=64, rows=W8, narzedzie=True),
    'Hero_TorchSneak': dict(folder='characters', cell=64, rows=W8, narzedzie=True),
}
for _n, _t in [('Axe', 1), ('AxeSide', 1), ('Pick', 1), ('Shovel', 1), ('Rake', 1), ('Hoe', 1), ('Hammer', 1), ('Rod', 1), ('Sling', 1),
               ('Bow', 1), ('Spear', 1), ('Club', 1), ('Punch', 0), ('Crouch', 0), ('Sit', 0), ('Roast', 1), ('LieDown', 0), ('Roll', 0),
               ('Torch', 1), ('TorchCrouch', 1), ('Net', 1), ('Sword', 1)]:
    ARKUSZE['Hero_' + _n] = dict(folder='system', cell=96, rows=W4, narzedzie=bool(_t))
ARKUSZE['Hero_Roast']['szare'] = False     # (patyk z mięsem nie ma szarego metalu: każda szarość to koszula, także rozłożona na ziemi)
CHAR_SHEETS = {n for n, a in ARKUSZE.items() if a['folder'] == 'characters'}

# kod, nazwa, kolor w masce (Ubior.js czyta część po dokładnym kolorze - te same liczby są tam)
CZESCI = [
    (1, 'kontur', (0, 0, 0)),
    (2, 'wlosy', (60, 60, 220)),
    (3, 'kontur_wlosow', (20, 20, 110)),
    (4, 'skora', (255, 200, 150)),          # reszta skóry: przedramiona, kolana w dziurach nogawek
    (5, 'stopy', (255, 120, 0)),
    (6, 'kontur_stop', (130, 60, 0)),
    (7, 'koszula', (235, 235, 235)),
    (8, 'kontur_koszuli', (110, 110, 110)),
    (9, 'spodnie', (150, 90, 40)),
    (10, 'pas', (230, 210, 0)),
    (11, 'narzedzie', (255, 0, 255)),
    (12, 'oczy_usta', (255, 0, 0)),
    (13, 'inne', (0, 160, 160)),
    (14, 'dlonie', (255, 80, 160)),
    (15, 'twarz_szyja', (190, 150, 255)),
]
KOD = {n: k for k, n, _ in CZESCI}
KOLOR = {k: c for k, _, c in CZESCI}

# Ręczne poprawki tam, gdzie reguły się mylą (sprawdzone na oko: docs/ekwipunek/maski/<arkusz>.png):
#   (arkusz, kolumna, wiersz, gdzie, z części, na część); gdzie: prostokąt w klatce (x0, y0, x1, y1 - włącznie) albo punkt (x, y) -
#   wtedy cała plama tych części, w której leży
POPRAWKI = [
    ('Hero_Axe', 14, 3, (57, 51, 66, 68), ('koszula', 'kontur_koszuli'), 'narzedzie'),   # ostrze bokiem przy biodrze (tyłem)
    ('Hero_Axe', 14, 3, (37, 61, 60, 72), ('pas',), 'spodnie'),                          # (przez nie dół koszuli zjechał na nogi)
    ('Hero_Hoe', 7, 0, (52, 66), ('stopy',), 'narzedzie'),                               # motyka w ziemi i grudki przy stopach
    ('Hero_Hoe', 8, 0, (54, 52), ('stopy',), 'narzedzie'),
    ('Hero_Net', 12, 0, (53, 69, 66, 72), ('stopy',), 'narzedzie'),                      # obręcz siatki przy stopach
    ('Hero_Net', 12, 0, (60, 73, 66, 81), ('stopy',), 'narzedzie'),
    ('Hero_Net', 12, 0, (53, 73, 53, 77), ('stopy',), 'narzedzie'),
    ('Hero_Net', 12, 0, (54, 78, 57, 81), ('stopy',), 'narzedzie'),
    ('Hero_Net', 13, 0, (34, 63, 46, 72), ('stopy',), 'narzedzie'),
    ('Hero_Net', 11, 2, (34, 79, 41, 84), ('stopy',), 'narzedzie'),
    ('Hero_Net', 11, 2, (42, 71, 43, 80), ('stopy',), 'narzedzie'),
    ('Hero_Net', 12, 2, (16, 64, 29, 75), ('stopy',), 'narzedzie'),
    ('Hero_Sword', 11, 0, (53, 48, 66, 51), ('koszula', 'kontur_koszuli'), 'narzedzie'),   # ostrze w prawo na tle tuniki (cięcie, przodem)
]

K, D, G, S, B, O = 1, 2, 3, 4, 5, 6
KLASA = {K: 'K kontur', D: 'D ciemna szarość', G: 'G szarość', S: 'S cielisty', B: 'B brąz', O: 'O inne'}


def hsv(rgb):
    """rgb: ...x3 float 0..1 -> h (stopnie), s, v"""
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0.0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.zeros_like(mx)
    dd = np.maximum(d, 1e-6)
    h = np.where(mx == r, ((g - b) / dd) % 6, h)
    h = np.where(mx == g, (b - r) / dd + 2, h)
    h = np.where(mx == b, (r - g) / dd + 4, h)
    h = np.where(d == 0, 0, h) * 60
    return h, s, mx


def klasy(rgb):
    h, s, v = hsv(rgb)
    warm = (h <= 50) | (h >= 330)
    c = np.full(v.shape, O, np.uint8)
    c[(s < 0.40) & (v < 0.30)] = D
    c[(s < 0.12) & (v >= 0.30)] = G
    c[warm & (s >= 0.12) & (s <= 0.68) & (v >= 0.55)] = S     # (płomień pochodni: s > 0.68 - nie skóra)
    c[warm & (s >= 0.25) & (v < 0.55)] = B
    c[(v <= 0.05) | ((v <= 0.16) & (s >= 0.6))] = K
    return c, v, s


def shift(m, dy, dx):
    out = np.zeros_like(m)
    H, W = m.shape
    ys, yd = (slice(0, H - dy), slice(dy, H)) if dy >= 0 else (slice(-dy, H), slice(0, H + dy))
    xs, xd = (slice(0, W - dx), slice(dx, W)) if dx >= 0 else (slice(-dx, W), slice(0, W + dx))
    out[yd, xd] = m[ys, xs]
    return out


DISK2 = [(dy, dx) for dy in range(-2, 3) for dx in range(-2, 3) if dy * dy + dx * dx <= 5]
SQ1 = [(dy, dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)]
N4 = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def erode(m, ker):
    out = m.copy()
    for dy, dx in ker:
        out &= shift(m, dy, dx)
    return out


def dilate(m, ker, times=1):
    out = m
    for _ in range(times):
        o = out.copy()
        for dy, dx in ker:
            o |= shift(out, dy, dx)
        out = o
    return out


def neighbours(m):
    """ile z 8 sąsiadów ma m"""
    return sum(shift(m, dy, dx).astype(np.int16) for dy, dx in SQ1 if dy or dx)


def components(m, conn8=True):
    H, W = m.shape
    lab = np.zeros((H, W), np.int32)
    n = 0
    nb = SQ1 if conn8 else N4
    ys, xs = np.nonzero(m)
    for y0, x0 in zip(ys, xs):
        if lab[y0, x0]:
            continue
        n += 1
        lab[y0, x0] = n
        q = deque([(y0, x0)])
        while q:
            y, x = q.popleft()
            for dy, dx in nb:
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    q.append((yy, xx))
    return lab, n


def geodesic(m, seeds):
    """odległość (8-sąsiedztwo) wewnątrz plamy m od pikseli seeds; -1 poza / nieosiągalne"""
    H, W = m.shape
    d = np.full((H, W), -1, np.int32)
    q = deque()
    for y, x in zip(*np.nonzero(seeds & m)):
        d[y, x] = 0
        q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in SQ1:
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and d[yy, xx] < 0:
                d[yy, xx] = d[y, x] + 1
                q.append((yy, xx))
    return d


def thin_line(m):
    """cienka długa kreska (trzonek): mała grubość w poprzek, duża długość (PCA)"""
    ys, xs = np.nonzero(m)
    if len(ys) < 6:
        return False
    cov = np.cov(np.vstack([xs, ys]).astype(float))
    ev = np.sort(np.linalg.eigvalsh(cov))
    return ev[0] ** 0.5 < 1.1 and ev[1] ** 0.5 > 3.0


def segment(cell, tools=True, grey_tools=True):
    """cell: HxWx4 uint8 -> (HxW kody części, info); tools=False: arkusz bez narzędzia (chód) - nic nie jest narzędziem"""
    H, W = cell.shape[:2]
    op = cell[:, :, 3] > 0
    out = np.zeros((H, W), np.uint8)
    if not op.any():
        return out, None
    cls, val, sat = klasy(cell[:, :, :3].astype(float) / 255.0)
    cls[~op] = 0
    light = (val >= 0.80) & op
    TOOL = KOD['narzedzie'] if tools else KOD['inne']

    # --- 2. włosy i głowa (włosy to ciemne szarości przetykane czarnymi pasmami: najpierw domknięte, żeby były jedną plamą -
    # inaczej wygrywa ciemna fałda koszuli)
    dmask = cls == D
    if not dmask.any():
        return out, None
    closed = (erode(dilate(dmask, SQ1, 1), SQ1) & op) | dmask      # (szczeliny do 2 px: czarne pasma między szarymi)
    dl, dn = components(closed, True)
    sizes = np.bincount(dl.ravel())
    sizes[0] = 0
    main = int(sizes.argmax())
    hair = (dl == main) & ((cls == D) | (cls == K))
    ys, xs = np.nonzero(hair)
    if ys.max() - ys.min() > 24 or xs.max() - xs.min() > 30:
        # (za duża "głowa": domknięcie skleiło włosy z ciemnym narzędziem albo fałdą - bez domknięcia, sama największa plama)
        dl, dn = components(dmask, True)
        sizes = np.bincount(dl.ravel())
        sizes[0] = 0
        main = int(sizes.argmax())
        hair = dl == main
        ys, xs = np.nonzero(hair)
    if ys.max() - ys.min() > 22 or xs.max() - xs.min() > 28:
        # (nadal za duża: włosy sklejone z ciemnym narzędziem - zostaje najgęstsze okno 18 wierszy x 24 kolumny)
        rh = np.bincount(ys, minlength=H).astype(float)
        best_y = max(range(0, max(1, H - 17)), key=lambda y: rh[y:y + 18].sum())
        sel = (ys >= best_y) & (ys < best_y + 18)
        ch = np.bincount(xs[sel], minlength=W).astype(float)
        best_x = max(range(0, max(1, W - 23)), key=lambda x: ch[x:x + 24].sum())
        win = np.zeros((H, W), bool)
        win[best_y:best_y + 18, best_x:best_x + 24] = True
        hair &= win
        ys, xs = np.nonzero(hair)
    hx0, hx1, hy0, hy1 = xs.min(), xs.max(), ys.min(), ys.max()
    # (trzonek przecina włosy: druga plama obok, do 6 px przerwy - dokładane, dopóki coś przybywa)
    grew = True
    while grew:
        grew = False
        for i in range(1, dn + 1):
            if sizes[i] < 3 or hair[dl == i].any():
                continue
            cy, cx = np.nonzero(dl == i)
            nx0, nx1, ny0, ny1 = min(hx0, cx.min()), max(hx1, cx.max()), min(hy0, cy.min()), max(hy1, cy.max())
            if nx1 - nx0 > 26 or ny1 - ny0 > 20:
                continue      # (głowa nie rośnie ponad swoją miarę: to ciemne narzędzie obok, nie włosy)
            if cx.max() >= hx0 - 6 and cx.min() <= hx1 + 6 and cy.max() >= hy0 - 3 and cy.min() <= hy1 and cy.mean() <= hy1 - 2:
                hair |= (dl == i) & ((cls == D) | (cls == K))
                ys, xs = np.nonzero(hair)
                hx0, hx1, hy0, hy1 = xs.min(), xs.max(), ys.min(), ys.max()
                grew = True
    near_hair = dilate(hair, SQ1, 3)
    hcx, hcy = xs.mean(), ys.mean()

    # --- 3. rdzeń ciała i oś
    core = dilate(erode(op, DISK2), DISK2) & op
    cl, cn = components(core, True)
    over = np.bincount(cl[hair], minlength=cn + 1)
    over[0] = 0
    body = cl == int(over.argmax()) if cn and over.max() else core
    # (ciało rozcięte trzonkiem na dwie plamy rdzenia: nogi to plama w większości brązowo-cielista, pod głową, nie daleko w bok)
    hcx0 = xs.mean()
    for i in range(1, cn + 1):
        m = cl == i
        if (m & body).any():
            continue
        n = int(m.sum())
        if n < 20:
            continue
        warm = float((m & ((cls == B) | (cls == S))).sum()) / n
        if warm >= 0.4 and abs(np.nonzero(m)[1].mean() - hcx0) <= 14:
            body |= m
    bodyd = dilate(body, SQ1) & op
    bodyd3 = dilate(body, SQ1, 3) & op
    bys, bxs = np.nonzero(body & ~near_hair)
    if len(bys):
        ux, uy = bxs.mean() - hcx, bys.mean() - hcy
    else:
        ux, uy = 0.0, 1.0
    nrm = (ux * ux + uy * uy) ** 0.5 or 1.0
    ux, uy = ux / nrm, uy / nrm
    if uy > 0.82:      # (prawie pionowo - stoi, siedzi, kuca: pionowo; narzędzie z boku nie przekrzywia osi)
        ux, uy = 0.0, 1.0
    YY, XX = np.mgrid[0:H, 0:W]
    T = (XX - hcx) * ux + (YY - hcy) * uy          # wzdłuż osi ciała (od głowy w stronę stóp)
    step = (int(round(ux)), int(round(uy)))
    if step == (0, 0):
        step = (0, 1)
    t_top = float(T[hair].min())
    # głowa: prostokąt włosów + 1 px, i 3 px dalej w stronę ciała (pod brodę, gdy stoi; w bok, gdy leży)
    head = np.zeros((H, W), bool)
    head[max(0, hy0 - 1):min(H, hy1 + 2), max(0, hx0 - 1):min(W, hx1 + 2)] = True
    for _ in range(3):
        head |= shift(head, step[1], step[0])

    out[hair] = KOD['wlosy']

    # --- 4. koszula (plamy G)
    gl, gn = components((cls == G) & ~hair, False)
    info = []
    for i in range(1, gn + 1):
        m = gl == i
        n = int(m.sum())
        cy, cx = np.nonzero(m)
        info.append(dict(i=i, m=m, n=n, core=float((m & bodyd).sum()) / n, bright=int((m & light).sum()), cy=cy.mean(), y1=cy.max(), cx=cx.mean(),
                         xs=cx,
                         t=float(T[m].mean()), head=float((m & head).sum()) / n))
    # kolano: 3/4 długości od czubka głowy do najdalszej jasnej skóry (stóp) - dalej koszuli nie ma (rąbek tuniki jest pod pasem)
    sk = (cls == S) & light & ~head & bodyd3
    t_feet0 = float(T[sk].max()) if sk.any() else t_top + 50
    knee_t = t_top + 0.75 * (t_feet0 - t_top)
    chin_t = float(T[hair].max()) - 1
    # (bez narzędzia w ręku każda szarość poza głową to koszula - przy kucaniu i leżeniu kolana są przy piersi)
    torso = [g for g in info if (g['head'] < 0.5 or g['n'] > 12) and (not tools or not grey_tools or (g['core'] >= 0.5 and chin_t < g['t'] <= knee_t))]
    total = sum(g['n'] for g in torso) or 1
    # oś tułowia: środek szarości tułowia blisko środka włosów; plama daleko w bok (ostrze na końcu trzonka) nie jest koszulą
    near = [g for g in torso if abs(g['cx'] - hcx) <= 14]
    axis = sum(g['cx'] * g['n'] for g in near) / max(1, sum(g['n'] for g in near)) if near else hcx
    big = max([g['n'] for g in torso] or [1])

    def blade(g):
        if not tools or not grey_tools:
            return False
        if abs(uy) > 0.7 and np.abs(g['xs'] - axis).min() > 9 and not any(g is x for x in near):
            return True       # (cała plama daleko w bok od osi tułowia: ostrze, grot, obuch młotka...)
        return g['bright'] >= 2 and (g['bright'] >= 0.12 * g['n'] or g['n'] < 0.35 * total)
    shirt_list = [g for g in torso if not blade(g)]
    if os.environ.get('MASKI_DEBUG'):
        print('axis', ux, uy, 'chin', chin_t, 'knee', knee_t, 'axis_x', axis, 'total', total)
        for g in info:
            print('  G n=%d core=%.2f bright=%d t=%.1f cx=%.1f head=%.2f torso=%s blade=%s' % (g['n'], g['core'], g['bright'], g['t'], g['cx'], g['head'],
                  any(g is x for x in torso), blade(g) if any(g is x for x in torso) else '-'))
    for g in info:
        if g['n'] <= 4 and g['head'] >= 0.5:
            out[g['m']] = KOD['oczy_usta']   # (białka oczu)
        elif g['n'] <= 3 and not (g['m'] & bodyd3).any():
            out[g['m']] = KOD['inne']        # (zabłąkany piksel obok postaci)
        elif any(g is x for x in shirt_list) or not tools:
            out[g['m']] = KOD['koszula']
        else:
            out[g['m']] = TOOL
    shirt = out == KOD['koszula']

    # --- 5. pas: wąski pasek cielisty / brązowy, nad nim i pod nim koszula (ta sama kolumna)
    belt = np.zeros((H, W), bool)
    if shirt.any():
        cand = ((cls == S) | (cls == B)) & ~head & (out == 0)
        for x in range(W):
            col = shirt[:, x]
            if not col.any():
                continue
            sy = np.nonzero(col)[0]
            for y in np.nonzero(cand[:, x])[0]:
                above = sy[sy < y]
                below = sy[sy > y]
                if not len(above) or not len(below):
                    continue
                a, b = above.max(), below.min()
                if y - a <= 6 and b - y <= 7 and b - a - 1 <= 5:
                    belt[y, x] = True
        if belt.any():
            # pasek idzie w poprzek tułowia: kawałki węższe niż 5 px to światła na płótnie, nie sznurek
            bl_, bn_ = components(belt, True)
            for i in range(1, bn_ + 1):
                xs_ = np.nonzero((bl_ == i).any(0))[0]
                if xs_.max() - xs_.min() + 1 < 5:
                    belt[bl_ == i] = False
        if belt.any():
            # węzeł i końce sznurka: przyległe cieliste / brązowe piksele do 5 px poniżej paska, w jego szerokości - bez większych
            # jasnych plam (dłoń trzymająca coś przed pasem)
            byy = np.nonzero(belt.any(1))[0]
            by0, by1 = byy.min(), byy.max()
            sh_rows = shirt[max(0, by0 - 3):by1 + 4]
            bx = np.nonzero(sh_rows.any(0))[0] if sh_rows.any() else np.nonzero(belt.any(0))[0]   # (szerokość tułowia przy pasie)
            pl, pn = components(cand & ~belt & (cls == S), True)
            guard = np.zeros((H, W), bool)
            for i in range(1, pn + 1):
                pm = pl == i
                if int(pm.sum()) > 8 and int((pm & light).sum()) >= 4:
                    guard |= pm
            for _ in range(5):
                grow = dilate(belt, SQ1) & cand & ~belt & ~guard
                grow[:, :max(0, bx.min())] = False
                grow[:, bx.max() + 1:] = False
                grow[by1 + 6:, :] = False
                if not grow.any():
                    break
                belt |= grow
        out[belt] = KOD['pas']
    knot = np.zeros((H, W), bool)          # (okno węzła: pod paskiem, w szerokości tułowia)
    if belt.any():
        knot[by0:by1 + 7, bx.min():bx.max() + 1] = True
    belt_t = float(T[belt].mean()) if belt.any() else (float(T[shirt].max()) - 4 if shirt.any() else knee_t - 8)

    # --- 7. brązy (B): narzędzie / spodnie
    bl, bn = components((cls == B) & (out == 0), True)
    for i in range(1, bn + 1):
        m = bl == i
        n = int(m.sum())
        inh = float((m & head).sum()) / n
        incore = float((m & bodyd).sum()) / n
        if inh >= 0.5:
            out[m] = (TOOL if tools else KOD['spodnie']) if n >= 5 else KOD['oczy_usta']
        elif tools and thin_line(m):
            out[m] = KOD['narzedzie']
        elif tools:
            # piksel po pikselu: poza rdzeniem ciała - trzonek; w rdzeniu nad pasem - trzonek na piersi; w rdzeniu pod pasem - spodnie
            inside = m & bodyd
            below = T >= belt_t - 2
            out[m & ~inside] = KOD['narzedzie']
            out[inside & below] = KOD['spodnie']
            out[inside & ~below] = KOD['narzedzie']
        else:
            out[m] = KOD['spodnie']
    pants = out == KOD['spodnie']
    legs_near = dilate(out == KOD['spodnie'], SQ1, 3)
    # (nogawki to duże plamy; małe brązowe plamki przy stopie to cień skóry pięty)
    pants_big = np.zeros((H, W), bool)
    for i in range(1, bn + 1):
        m = (bl == i) & pants
        if int(m.sum()) >= 12:
            pants_big |= m

    # --- 6. skóra: twarz i szyja, stopy, dłonie, reszta
    sm = (cls == S) & (out == 0)
    sl, sn = components(sm, True)
    comps = []
    for i in range(1, sn + 1):
        m = sl == i
        n = int(m.sum())
        cyx = np.nonzero(m)
        comps.append(dict(m=m, n=n, light=int((m & light).sum()), l70=int((m & (val >= 0.70)).sum()), tmax=float(T[m].max()), tmean=float(T[m].mean()), tmin=float(T[m].min()),
                          cx=float(cyx[1].mean()),
                          head=float((m & head).sum()) / n, nearh=float((m & near_hair).sum()) / n,
                          core=float((m & bodyd).sum()) / n, core3=float((m & bodyd3).sum()) / n))
    # (szyja i dekolt pod brodą, osobno od twarzy: tuż pod głową, na środku)
    if os.environ.get('MASKI_DEBUG'):
        print('hair', (hx0, hy0, hx1, hy1), 'axis', round(ux, 2), round(uy, 2), 'chin_t', round(chin_t, 1), 'belt_t', round(belt_t, 1))
        for c in comps:
            yy_, xx_ = np.nonzero(c['m'])
            print('  S n=%d x%d-%d y%d-%d light=%d head=%.2f nearh=%.2f tmin=%.1f cx=%.1f core3=%.2f' % (c['n'], xx_.min(), xx_.max(), yy_.min(), yy_.max(),
                  c['light'], c['head'], c['nearh'], c['tmin'], c['cx'], c['core3']))
    # (twarz: plama najbardziej w głowie - jedna na klatkę - i inne w połowie w głowie)
    best = max(comps, key=lambda c: c['head'] * c['n'] + c['nearh'] * c['n'] * 0.5, default=None)
    faces = [c for c in comps if c['head'] >= 0.5 or c['nearh'] >= 0.4 or (c['tmin'] <= chin_t + 4 and abs(c['cx'] - hcx) <= 4 and c['n'] <= 40)
             or (c is best and (c['head'] >= 0.2 or c['nearh'] >= 0.2) and c['light'] >= 3)]
    rest = [c for c in comps if not any(c is f for f in faces)]
    lows = [c['tmax'] for c in rest if c['l70'] >= 2 and c['core3'] >= 0.5]
    t_feet = max(lows) if lows else t_feet0
    for c in faces:
        out[c['m']] = KOD['twarz_szyja']
    sx, sy = step
    for c in rest:
        m = c['m']
        # dziura w nogawce: wokół same spodnie
        ring = dilate(m, SQ1) & ~m & op
        ring_pants = float((ring & (pants | dilate(pants, SQ1) & (cls == K))).sum()) / max(1, int(ring.sum()))
        isfoot = c['l70'] >= 2 and c['core3'] >= 0.5 and c['tmax'] >= t_feet - 7 and c['tmean'] >= t_top + 0.72 * (t_feet - t_top)
        if isfoot:
            # dziura w nogawce przy stopie: tuż za plamą (wzdłuż osi) są spodnie
            ys_, xs_ = np.nonzero(m)
            edge = [(y, x) for y, x in zip(ys_, xs_) if not (0 <= y + sy < H and 0 <= x + sx < W and m[y + sy, x + sx])]
            seen = sum(1 for y, x in edge if any(0 <= y + k * sy < H and 0 <= x + k * sx < W and pants_big[y + k * sy, x + k * sx] for k in (1, 2, 3)))
            if edge and seen >= 0.5 * len(edge):
                isfoot = False
        if os.environ.get('MASKI_DEBUG') and c['n'] >= 8:
            print('  foot? n=%d l70=%d core3=%.2f tmax=%.1f t_feet=%.1f tmean=%.1f lim=%.1f -> %s' % (c['n'], c['l70'], c['core3'], c['tmax'], t_feet, c['tmean'],
                  t_top + 0.72 * (t_feet - t_top), isfoot))
        if isfoot:
            out[m] = KOD['stopy']
            continue
        if ring_pants >= 0.6:
            out[m] = KOD['skora']          # (kolano w dziurze nogawki)
            continue
        if c['light'] < 2 and (c['core'] < 0.5 or thin_line(m)) and tools:
            out[m] = KOD['narzedzie']      # (jasne drewno trzonka poza ciałem)
            continue
        if c['n'] <= 10 and not (m & ~knot).any():
            out[m] = KOD['pas']            # (węzeł sznurka pod pasem)
            continue
        if c['light'] < 1 and c['n'] <= 3:
            out[m] = KOD['skora']
            continue
        # (w ręku cienki drąg / sznur / żyłka w kolorze drewna, przyklejony do dłoni: kreski cieńsze niż 3 px odcięte - to narzędzie)
        if tools:
            CROSS = [(0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)]
            opened = dilate(erode(m, CROSS), CROSS) & m
            thin = m & ~opened
            if thin.any() and opened.any():
                tl, tn = components(thin, True)
                for i in range(1, tn + 1):
                    tm = tl == i
                    if int(tm.sum()) >= 4:
                        out[tm] = KOD['narzedzie']
                        m = m & ~tm
                if not m.any():
                    continue
        # ręka: od rękawa najdalej - dłoń. Rękaw: koszula do 2 px "nad" plamą (w stronę głowy, wzdłuż osi); gdy takiej nie ma -
        # piksele dotykające koszuli; bez rękawa w pobliżu mała plama to sama dłoń
        seeds = np.zeros((H, W), bool)
        for y, x in zip(*np.nonzero(m)):
            for k in (1, 2, 3):
                yy, xx = y - k * sy, x - k * sx
                if not (0 <= yy < H and 0 <= xx < W) or (m[yy, xx] and k == 1):
                    break
                if shirt[yy, xx]:
                    seeds[y, x] = True
                    break
        if not seeds.any():
            seeds = m & dilate(shirt, SQ1)
        if seeds.any():
            d = geodesic(m, seeds)
            md = int(d.max())
            if md <= 2:
                out[m] = KOD['skora'] if c['n'] >= 12 else KOD['dlonie']
            else:
                lim = max(md - 4, (md + 1) // 2)
                out[m & (d >= lim)] = KOD['dlonie']
                out[m & (d >= 0) & (d < lim)] = KOD['skora']
                out[m & (d < 0)] = KOD['dlonie']
        elif tools and (thin_line(m) or c['n'] > 30 and thin_line(m)):
            out[m] = KOD['narzedzie']      # (środek drąga / wędziska w kolorze skóry, bez rękawa w pobliżu)
        else:
            out[m] = KOD['dlonie'] if c['n'] <= 30 else KOD['skora']

    # --- spodnie tylko między stopami a pasem (w poziomie): brąz daleko w bok to pałka / trzonek przed ciałem
    if tools and uy == 1.0:
        fx = np.nonzero((out == KOD['stopy']).any(0))[0]
        bxs_ = np.nonzero((out == KOD['pas']).any(0))[0]
        sxs_ = np.nonzero((out == KOD['koszula']).any(0))[0]
        spans = [v for v in (fx, bxs_) if len(v)]
        if len(fx) and spans:      # (bez widocznych stóp - siedzi tyłem - nogi bywają szersze niż pas: nie ruszać)
            lo = min(v.min() for v in spans) - 3
            hi = max(v.max() for v in spans) + 3
            far = np.zeros((H, W), bool)
            far[:, :max(0, lo)] = True
            far[:, hi + 1:] = True
            out[(out == KOD['spodnie']) & far] = KOD['narzedzie']

    # --- dłoń wydłużona w kreskę (dłoń + kawałek drąga w kolorze skóry): zostaje gruba część, kreska to narzędzie
    if tools:
        hands = out == KOD['dlonie']
        hl, hn = components(hands, True)
        skinish = hands | (out == KOD['skora']) | (out == KOD['twarz_szyja'])
        nb = neighbours(skinish)
        for i in range(1, hn + 1):
            hm = hl == i
            ys_, xs_ = np.nonzero(hm)
            if len(ys_) < 6:
                continue
            long_ = max(ys_.max() - ys_.min(), xs_.max() - xs_.min()) + 1 > 7 or thin_line(hm)
            if not long_:
                continue
            core_h = hm & (nb >= 5)
            if not core_h.any():
                continue
            keep = dilate(core_h, SQ1) & hm
            out[hm & ~keep] = KOD['narzedzie']

    # --- inne kolory (płomień, iskry, grudki ziemi)
    om = (cls == O) & (out == 0)
    ol, on = components(om, True)
    for i in range(1, on + 1):
        m = ol == i
        n = int(m.sum())
        if float((m & head).sum()) / n >= 0.5 and n <= 4:
            out[m] = KOD['oczy_usta']
        else:
            out[m] = TOOL if n > 2 else KOD['inne']

    # --- poprawki: blade ciepłe odcienie w koszuli (#e7cec0 - światło na płótnie, nie skóra) -> koszula; kropki w włosach -> włosy
    for _ in range(2):
        nb = neighbours(out == KOD['koszula'])
        out[((out == KOD['skora']) | (out == KOD['dlonie'])) & (sat < 0.22) & (nb >= 3)] = KOD['koszula']
    nb = neighbours(out == KOD['wlosy'])
    out[(out == KOD['oczy_usta']) & (nb >= 5)] = KOD['wlosy']
    # ciemny brzeg ręki / stopy (brąz) wśród skóry, nie przy spodniach -> ta skóra
    skins = (KOD['skora'], KOD['dlonie'], KOD['stopy'], KOD['twarz_szyja'])
    nbp = neighbours(out == KOD['spodnie'])
    cnts = {k: neighbours(out == k) for k in skins}
    tot_s = sum(cnts.values())
    lone = (out == KOD['spodnie']) & (tot_s >= 3) & (nbp < 2)
    if lone.any():
        best_k = np.argmax(np.stack([cnts[k] for k in skins]), axis=0)
        for i, k in enumerate(skins):
            out[lone & (best_k == i)] = k

    # --- 8. kontur i ciemne: część większości sąsiadów
    restm = op & (out == 0)
    OUTLINE_OF = {KOD['wlosy']: KOD['kontur_wlosow'], KOD['stopy']: KOD['kontur_stop'], KOD['koszula']: KOD['kontur_koszuli'],
                  KOD['narzedzie']: KOD['narzedzie']}
    skip = (KOD['kontur'], KOD['inne'])
    newv = {}
    for y, x in zip(*np.nonzero(restm)):
        votes = Counter()
        for dy, dx in SQ1:
            yy, xx = y + dy, x + dx
            if (dy or dx) and 0 <= yy < H and 0 <= xx < W:
                v = out[yy, xx]
                if v and v not in skip:
                    votes[v] += 1
        if cls[y, x] == D and votes:
            top = votes.most_common(1)[0][0]
            # ciemny odcień koszuli (#464341...) wewnątrz koszuli: koszula; reszta ciemnych: kontur
            newv[(y, x)] = KOD['koszula'] if top == KOD['koszula'] and votes[top] >= 4 else OUTLINE_OF.get(top, KOD['kontur'])
        elif votes:
            top = votes.most_common(1)[0][0]
            newv[(y, x)] = OUTLINE_OF.get(top, KOD['kontur'])
        else:
            newv[(y, x)] = KOD['kontur']
    for (y, x), v in newv.items():
        out[y, x] = v
    return out, dict(hair=(int(hx0), int(hy0), int(hx1), int(hy1)), axis=(round(ux, 2), round(uy, 2)))


def sheet_path(name):
    a = ARKUSZE.get(name) or dict(folder='characters' if name in CHAR_SHEETS else 'system', cell=64 if name in CHAR_SHEETS else 96)
    return os.path.join(GAME, 'img', a['folder'], name + '.png'), a['cell']


# Arkusze z pochodnią w ręku to zwykłe arkusze z dorysowaną pochodnią (tools/torch/build_torch_walk.py, build_torch_crouch.py):
# maska = maska arkusza bazowego, a piksele, które się różnią, to pochodnia - poza pięścią (skóra bohatera: SKIN tamtych skryptów)
DERIVED = {'Hero_TorchWalk': 'Hero_Walk', 'Hero_TorchRun': 'Hero_Run', 'Hero_TorchSneak': 'Hero_Sneak', 'Hero_TorchCrouch': 'Hero_Crouch'}
FIST = {(249, 212, 182), (239, 181, 145), (209, 150, 118), (193, 122, 88)}


def build(name):
    if name in DERIVED:
        a, lab, cell, meta, fixes = build(DERIVED[name])
        path, _ = sheet_path(name)
        b = np.array(Image.open(path).convert('RGBA'))
        diff = (np.abs(a.astype(int) - b.astype(int)).sum(2) > 0) & (b[:, :, 3] > 0)
        rgb = b[:, :, :3].astype(int)
        key = (rgb[:, :, 0] << 16) | (rgb[:, :, 1] << 8) | rgb[:, :, 2]
        fist = np.isin(key, [(r << 16) | (g << 8) | bb for r, g, bb in FIST])
        lab = lab.copy()
        lab[diff] = KOD['narzedzie']
        lab[diff & fist] = KOD['dlonie']
        lab[diff & (key == 0x040101)] = KOD['kontur']
        lab[b[:, :, 3] == 0] = 0
        fixes += sum(1 for p in POPRAWKI if p[0] == name)
        return b, lab, cell, meta, fixes
    path, cell = sheet_path(name)
    tools = ARKUSZE.get(name, {}).get('narzedzie', True)
    a = np.array(Image.open(path).convert('RGBA'))
    H, W = a.shape[:2]
    lab = np.zeros((H, W), np.uint8)
    meta = {}
    fixes = 0
    for r in range(H // cell):
        for c in range(W // cell):
            sl = (slice(r * cell, (r + 1) * cell), slice(c * cell, (c + 1) * cell))
            m, info = segment(a[sl], tools, ARKUSZE.get(name, {}).get('szare', True))
            for (sh, pc, pr, where, z, na) in POPRAWKI:
                if sh != name or pc != c or pr != r:
                    continue
                codes = [KOD[zz] for zz in z]
                if len(where) == 2:      # punkt: cała plama (4-sąsiedztwo) tych części, w której leży
                    fl, _ = components(np.isin(m, codes), False)
                    k = fl[where[1], where[0]]
                    if k:
                        m[fl == k] = KOD[na]
                else:                    # prostokąt x0, y0, x1, y1 (włącznie)
                    x0, y0, x1, y1 = where
                    box = m[y0:y1 + 1, x0:x1 + 1]
                    box[np.isin(box, codes)] = KOD[na]
                fixes += 1
            lab[sl] = m
            meta['%d,%d' % (c, r)] = dict(info or {})
    if tools:
        # drugi przebieg: paleta skóry tego arkusza (kolory twarzy i stóp - te wykrywa się pewnie); "dłoń" albo "skóra" w kolorze spoza
        # niej to drewno trzymane w ręku (trzonek, wędzisko, proca) - narzędzie
        rgb = a[:, :, :3].astype(np.int64)
        key = (rgb[:, :, 0] << 16) | (rgb[:, :, 1] << 8) | rgb[:, :, 2]
        sk = (lab == KOD['twarz_szyja']) | (lab == KOD['stopy'])
        u, n = np.unique(key[sk], return_counts=True)
        pal = u[n >= 3]
        odd = ((lab == KOD['dlonie']) | (lab == KOD['skora'])) & ~np.isin(key, pal)
        lab[odd] = KOD['narzedzie']
        # spodnie: kolory nogawek są w (prawie) każdej klatce; brąz, który jest "spodniami" tylko w części klatek, to narzędzie
        # (głowica pałki, trzonek przy nogach)
        seen = Counter()
        ncells = 0
        for r in range(H // cell):
            for c in range(W // cell):
                sl = (slice(r * cell, (r + 1) * cell), slice(c * cell, (c + 1) * cell))
                pm = lab[sl] == KOD['spodnie']
                if pm.any():
                    ncells += 1
                    for u_ in np.unique(key[sl][pm]):
                        seen[int(u_)] += 1
        ppal = [k for k, v in seen.items() if v >= 0.4 * ncells]
        odd = (lab == KOD['spodnie']) & ~np.isin(key, ppal)
        lab[odd] = KOD['narzedzie']
    for r in range(H // cell):
        for c in range(W // cell):
            sl = (slice(r * cell, (r + 1) * cell), slice(c * cell, (c + 1) * cell))
            cnt = np.bincount(lab[sl].ravel(), minlength=len(CZESCI) + 1)
            meta['%d,%d' % (c, r)]['n'] = {n: int(cnt[k]) for k, n, _ in CZESCI if cnt[k]}
    return a, lab, cell, meta, fixes


def to_png(lab):
    H, W = lab.shape
    img = np.zeros((H, W, 4), np.uint8)
    for k, c in KOLOR.items():
        sel = lab == k
        img[sel, :3] = c
        img[sel, 3] = 255
    return Image.fromarray(img, 'RGBA')


def preview(a, lab, cell, out, scale=3):
    H, W = lab.shape
    bg = np.zeros((H, W, 4), np.uint8); bg[:] = (70, 110, 70, 255)
    base = Image.fromarray(bg, 'RGBA'); base.alpha_composite(Image.fromarray(a, 'RGBA'))
    mask = Image.fromarray(bg.copy(), 'RGBA'); mask.alpha_composite(to_png(lab))
    over = base.copy()
    lay = to_png(lab); arr = np.array(lay); arr[..., 3] = np.where(arr[..., 3] > 0, 150, 0); over.alpha_composite(Image.fromarray(arr, 'RGBA'))
    img = Image.new('RGBA', (W, H * 3 + 8), (30, 30, 30, 255))
    img.paste(base, (0, 0)); img.paste(mask, (0, H + 4)); img.paste(over, (0, 2 * H + 8))
    img.resize((img.width * scale, img.height * scale), Image.NEAREST).save(out)


def paleta():
    import glob
    files = sorted(glob.glob(os.path.join(GAME, 'img', 'characters', 'Hero_*.png')) + glob.glob(os.path.join(GAME, 'img', 'system', 'Hero_*.png')))
    tot = Counter()
    for f in files:
        a = np.array(Image.open(f).convert('RGBA'))
        px = a[a[:, :, 3] > 0][:, :3].astype(int)
        k = (px[:, 0] << 16) | (px[:, 1] << 8) | px[:, 2]
        for u, n in zip(*np.unique(k, return_counts=True)):
            tot[int(u)] += int(n)
    keys = sorted(tot, key=lambda k: -tot[k])
    rgb = np.array([[(k >> 16) / 255, ((k >> 8) & 255) / 255, (k & 255) / 255] for k in keys])
    c, v, s = klasy(rgb)
    by = Counter()
    for k, cc in zip(keys, c):
        by[int(cc)] += tot[k]
    print('%d kolorów w %d arkuszach' % (len(keys), len(files)))
    for cc in (K, D, G, S, B, O):
        sel = [keys[i] for i in range(len(keys)) if c[i] == cc]
        print('%-18s %4d kolorów, %7d pikseli; najczęstsze: %s' % (KLASA[cc], len(sel), by[cc], ' '.join('#%06x' % k for k in sel[:12])))


def main(argv):
    if '--paleta' in argv:
        paleta()
        return
    prev = rap = None
    if '--podglad' in argv:
        i = argv.index('--podglad'); prev = argv[i + 1]; argv = argv[:i] + argv[i + 2:]
    if '--raport' in argv:
        i = argv.index('--raport'); rap = argv[i + 1]; argv = argv[:i] + argv[i + 2:]
    names = argv or list(ARKUSZE)
    report = {}
    import time
    for name in names:
        t0 = time.time()
        a, lab, cell, meta, fixes = build(name)
        out = os.path.join(GAME, 'img', 'system', 'Ubior_Maska_%s.png' % name)
        to_png(lab).save(out, optimize=True)
        cnt = Counter(lab.ravel().tolist())
        print('%-16s -> %s  %.1f s  poprawek %d  %s' % (name, os.path.relpath(out, GAME).replace('\\', '/'), time.time() - t0, fixes,
              ' '.join('%s:%d' % (n, cnt.get(k, 0)) for k, n, _ in CZESCI)), flush=True)
        report[name] = dict(cell=cell, fixes=fixes, cells=meta, rows=ARKUSZE.get(name, {}).get('rows'))
        if prev:
            os.makedirs(prev, exist_ok=True)
            preview(a, lab, cell, os.path.join(prev, 'maska_%s.png' % name))
    if rap:
        old = {}
        if os.path.exists(rap):
            try:
                old = json.load(open(rap, encoding='utf-8'))
            except Exception:
                old = {}
        old.update(report)
        json.dump(old, open(rap, 'w', encoding='utf-8'), ensure_ascii=False)


if __name__ == '__main__':
    main(sys.argv[1:])
