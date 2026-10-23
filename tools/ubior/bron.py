# tools/ubior/bron.py - broń na osi zamachu (js/plugins/Ubior_Bron.js, docs/ekwipunek/PLAN_BRON_ZBROJE.md).
#
# Dla arkuszy zamachów bohatera z bronią w ręku (Hero_Club, Hero_Axe, Hero_AxeSide, Hero_Pick, Hero_Spear) z maski części
# (img/system/Ubior_Maska_<arkusz>.png, część "narzędzie") wylicza w każdej klatce OŚ broni, robi arkusz BEZ starej broni i rysuje
# na tej osi każdy nowy rodzaj broni (szablon do przemalowania materiałem w grze):
#
#   1. Oś: piksele narzędzia leżące na jednej prostej (broń przecięta głową / dłonią to kilka plam; druga dłoń wzięta za narzędzie
#      - nie) -> prosta dopasowana do cienkiego trzonka (|odchylenie| <= 1,6 px, 3 razy). Koniec z GŁOWICĄ (metal - szare / białe
#      piksele -, szerokość) to czubek. Chwyt = dłoń przy broni najbliżej końca trzonka. Pewność: długość widocznej broni (>= 55%
#      najdłuższej) i dłoń przy niej; klatki niepewne biorą oś z sąsiednich pewnych klatek wiersza (kąt i punkty liniowo), ręczne
#      poprawki: POPRAWKI niżej. Skrót perspektywy: długość / najdłuższa (90. percentyl arkusza). Bok ostrza (topór, młot): w stronę
#      uderzenia (ruch czubka w klatce ciosu - HeroLook.js SWINGS hit).
#   2. Arkusz bez broni: piksele broni wewnątrz sylwetki (ciało po obu stronach w poprzek osi) -> kolor i część najbliższego piksela
#      ciała w poprzek osi, na zewnątrz -> przezroczyste; czarny kontur broni bez ciała obok - precz; ciało, które straciło brzeg pod
#      usuniętą bronią - nowy kontur 1 px. Dłonie i żółte smugi ruchu zostają.
#      -> img/system/Ubior_BezBroni_<arkusz>.png + maska img/system/Ubior_Maska_BezBroni_<arkusz>.png
#   3. Szablony broni: img/system/Ubior_Bron_<Arkusz>_<Rodzaj>.png (tej samej wielkości co arkusz, tylko piksele broni):
#      kontur (10,9,8); METAL = szarość r=g=b (ton = jasność) -> rampa materiału; DREWNO (trzonek) = zielonkawy (g > r = b, ton = g)
#      -> rampa drzewca; AKCENT (owijka rękojeści) = czerwonawy (r > g = b, ton = r) -> rampa akcentu. Rodzaj "własny" arkusza
#      (pałka, siekiera, kilof, oszczep) = stara broń przełożona na szablon (warianty materiału); nowe rodzaje narysowane tu, profilem
#      wzdłuż osi (przekrój: od końca rękojeści do czubka, światło z lewej góry, ostrze z jaśniejszą krawędzią), z widocznością starej
#      broni: na ciele tylko tam, gdzie stara broń była widać (inaczej za ciałem), na tle zawsze; dłoń zawsze przed bronią.
#
#   python tools/ubior/bron.py [--podglad KATALOG] [arkusz ...]
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from maski import KOD, KOLOR, hsv

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SYS = os.path.join(GAME, 'img', 'system')
CELL = 96
ROWS = ['S', 'W', 'E', 'N']
T_, H_, K_ = KOD['narzedzie'], KOD['dlonie'], KOD['kontur']
KONTUR = (10, 9, 8)
# klatka ciosu w każdym wierszu (HeroLook.js SWINGS: hit) - stąd strona ostrza
HIT = {'Hero_Club': [9, 7, 7, 11], 'Hero_Axe': [8, 7, 7, 10], 'Hero_AxeSide': [10, 10, 10, 9], 'Hero_Pick': [8, 9, 9, 9], 'Hero_Spear': [8, 10, 10, 11],
       'Hero_Sword': [9, 11, 11, 11]}
# arkusz -> jego własna broń i nowe rodzaje rysowane na nim
ARKUSZE = {
    'Hero_Club': dict(wlasna='palka', nowe=['miecz', 'dlugi_miecz', 'tasak', 'szabla', 'sztylet', 'buzdygan', 'kiscien', 'kostur', 'mlot']),
    'Hero_Axe': dict(wlasna='siekiera', nowe=['topor', 'czekan', 'bardysz']),
    'Hero_AxeSide': dict(wlasna='siekiera', nowe=['topor', 'czekan', 'bardysz']),
    'Hero_Pick': dict(wlasna='kilof', nowe=['mlot']),
    'Hero_Spear': dict(wlasna='wlocznia', nowe=['rohatyna', 'sulica']),
    # (2026-10-23: zamach mieczem z PixelLab - tools/ubior/miecz_arkusz.py - szerokie cięcie z wyciągniętą ręką)
    'Hero_Sword': dict(wlasna='miecz', nowe=['dlugi_miecz', 'tasak', 'szabla']),
}
# pięści: sztylet w dłoni, która uderza (bez starej broni - oś z przedramienia)
PIESC = 'Hero_Punch'
# (arkusz, wiersz, kolumna): poprawki - {'pewna': False} (oś z sąsiadów), {'odwroc': True} (czubek z drugiej strony), {'zmaz': [(x0, y0,
# x1, y1)]} (prostokąty w klatce, włącznie: wszystko poza dłońmi to broń - zostaje po niej ślad; głowę odmaluje wzór wiersza)
POPRAWKI = {
    # pałka w dół między nogami (klatka ciosu): maska wzięła ją za spodnie - zmazana, nogi z następnej klatki (ta sama postawa)
    ('Hero_Club', 0, 9): {'zmaz': [(42, 58, 62, 89)], 'z_klatki': (10, (28, 60, 68, 92))},
    # pałka za głową (z boku): koniec głowicy za włosami
    ('Hero_Club', 1, 1): {'zmaz': [(50, 25, 60, 37)]},
    ('Hero_Club', 1, 2): {'zmaz': [(50, 22, 68, 34)]},
    ('Hero_Club', 2, 1): {'zmaz': [(34, 28, 44, 38)]},
    ('Hero_Club', 2, 2): {'zmaz': [(28, 22, 44, 33)]},
}

# tony szablonu: metal 7 szarości, drewno 5 zielonkawych, akcent 4 czerwonawe
GREY = [52, 78, 106, 134, 162, 190, 214]
WOOD = [70, 100, 130, 160, 190]
ACC = [110, 150, 190, 230]


def tpl(cls, k):
    """kolor szablonu: klasa ('m' metal, 'w' drewno, 'a' akcent, 'k' kontur), ton k (indeks)"""
    if cls == 'k':
        return KONTUR
    if cls == 'm':
        v = GREY[max(0, min(len(GREY) - 1, k))]
        return (v, v, v)
    if cls == 'w':
        v = WOOD[max(0, min(len(WOOD) - 1, k))]
        return (v // 2, v, v // 2)
    v = ACC[max(0, min(len(ACC) - 1, k))]
    return (v, int(v * 0.3), int(v * 0.3))


def load(name):
    img = np.array(Image.open(os.path.join(SYS, name + '.png')).convert('RGBA'))
    m = np.array(Image.open(os.path.join(SYS, 'Ubior_Maska_' + name + '.png')).convert('RGBA'))
    lab = np.zeros(m.shape[:2], np.uint8)
    for k, c in KOLOR.items():
        sel = (m[:, :, 0] == c[0]) & (m[:, :, 1] == c[1]) & (m[:, :, 2] == c[2]) & (m[:, :, 3] > 0)
        lab[sel] = k
    return img, lab


def fit_line(xs, ys):
    pts = np.stack([xs, ys], 1).astype(float)
    c = pts.mean(0)
    q = pts - c
    ev, evec = np.linalg.eigh(q.T @ q)
    v = evec[:, 1]
    return c, v / np.linalg.norm(v)


def thin_fit(xs, ys, rounds=3, lim=1.6):
    """prosta przez piksele, dopasowana do cienkiego trzonka (piksele bliżej niż lim od prostej, kilka razy)"""
    px, py = xs + 0.5, ys + 0.5
    c, v = fit_line(px, py)
    for _ in range(rounds):
        perp = (px - c[0]) * v[1] - (py - c[1]) * v[0]
        sel = np.abs(perp) <= lim
        if sel.sum() < 5:
            break
        c, v = fit_line(px[sel], py[sel])
    return c, v


def components(mask):
    """spójne plamy (8-sąsiedztwo): lista (ys, xs), największa pierwsza"""
    H, W = mask.shape
    seen = np.zeros_like(mask)
    out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        stack = [(y0, x0)]
        seen[y0, x0] = True
        pts = []
        while stack:
            y, x = stack.pop()
            pts.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = True
                        stack.append((yy, xx))
        a = np.array(pts)
        out.append((a[:, 0], a[:, 1]))
    out.sort(key=lambda t: -len(t[0]))
    return out


def effect_pixels(cimg):
    """żółte smugi ruchu (zostają na arkuszu)"""
    rgb = cimg[:, :, :3].astype(float) / 255
    h, s, v = hsv(rgb)
    return (h >= 40) & (h <= 70) & (s > 0.45) & (v > 0.6) & (cimg[:, :, 3] > 0)


def weapon_pixels(cimg, clab):
    """piksele broni: plamy narzędzia na wspólnej prostej; osobne kawałki z boku - nie; smugi ruchu - nie"""
    T = (clab == T_) & ~effect_pixels(cimg)
    comps = [cp for cp in components(T) if len(cp[0]) >= 2]
    if not comps:
        return T & False
    ys = np.concatenate([cp[0] for cp in comps]); xs = np.concatenate([cp[1] for cp in comps])
    keep = np.zeros_like(T)
    if len(ys) < 6:
        keep[ys, xs] = True
        return keep
    c, v = thin_fit(xs, ys)
    for i, (cy, cx) in enumerate(comps):
        perp = np.abs((cx + 0.5 - c[0]) * v[1] - (cy + 0.5 - c[1]) * v[0])
        if i == 0 or np.median(perp) <= 3.5:
            keep[cy, cx] = True
    return keep


ENCLOSED = {KOD[k] for k in ('twarz_szyja', 'oczy_usta', 'wlosy', 'kontur_wlosow', 'skora', 'inne', 'kontur', 'spodnie')}
HEAD = {KOD[k] for k in ('wlosy', 'kontur_wlosow', 'twarz_szyja', 'oczy_usta')}
NOT_WEAPON = {KOD[k] for k in ('dlonie', 'twarz_szyja', 'oczy_usta', 'koszula', 'kontur_koszuli', 'stopy', 'kontur_stop', 'spodnie', 'pas', 'skora')}


def grow(cimg, clab, T, c, v, ref=None):
    """broń, której maska nie dała całej (głowica pałki wzięta za włosy, kontur broni): piksele w rurze wokół osi (szerokość starej
    broni + 1 px) w kolorze drewna / metalu albo kontur przy broni, o części innej niż ciało, dłoń, twarz, koszula, spodnie"""
    ys, xs = np.nonzero(T)
    px, py = xs + 0.5, ys + 0.5
    s = (px - c[0]) * v[0] + (py - c[1]) * v[1]
    u = (px - c[0]) * v[1] - (py - c[1]) * v[0]
    smin, smax = s.min(), s.max()
    st = np.round(s - smin).astype(int)
    nb = int(smax - smin) + 3
    lo = np.full(nb, 99.0); hi = np.full(nb, -99.0)
    for k in range(len(st)):
        for d in (-1, 0, 1):
            j = st[k] + d
            if 0 <= j < nb:
                lo[j] = min(lo[j], u[k]); hi[j] = max(hi[j], u[k])
    known = np.nonzero(lo < 90)[0]
    if len(known) >= 2:
        for j in range(nb):
            if lo[j] < 90:
                continue
            a_ = known[known < j]; b_ = known[known > j]
            if len(a_) and len(b_):
                lo[j] = min(lo[a_[-1]], lo[b_[0]]); hi[j] = max(hi[a_[-1]], hi[b_[0]])
    rgb = cimg[:, :, :3].astype(float) / 255
    h, sat, val = hsv(rgb)
    wood = (((h <= 50) | (h >= 330)) & (sat >= 0.25) & (val < 0.62)) | ((sat < 0.16) & (val >= 0.28)) | (val <= 0.14)
    out = T.copy()
    YY, XX = np.mgrid[0:CELL, 0:CELL]
    PX, PY = XX + 0.5, YY + 0.5
    S_ = (PX - c[0]) * v[0] + (PY - c[1]) * v[1]
    U_ = (PX - c[0]) * v[1] - (PY - c[1]) * v[0]
    J = np.clip(np.round(S_ - smin).astype(int), 0, nb - 1)
    inside = (S_ >= smin - 1) & (S_ <= smax + 1) & (U_ >= lo[J] - 1.2) & (U_ <= hi[J] + 1.2) & (lo[J] < 90)
    cand = inside & wood & (cimg[:, :, 3] > 0) & ~np.isin(clab, list(NOT_WEAPON)) & ~effect_pixels(cimg)
    # "hair" in the tube farther from the head's middle than a head is big: the weapon's dark wood behind the head
    hair = np.isin(clab, [KOD['wlosy'], KOD['kontur_wlosow']])
    if hair.sum() >= 20:
        hy, hx = np.nonzero(hair)
        my, mx = np.median(hy), np.median(hx)
        far = ((XX - mx) / 11.5) ** 2 + ((YY - my) / 9.0) ** 2 > 1.0
        cand |= inside & hair & far & (cimg[:, :, 3] > 0)
        # brown "hair" in the tube: the wood in front of the hair (the hair is a cold grey)
        cand |= inside & hair & ((h <= 50) | (h >= 330)) & (sat >= 0.2) & (val < 0.62) & (cimg[:, :, 3] > 0)
    # only what touches the weapon (grown step by step)
    for _ in range(4):
        near = np.zeros_like(out)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            near |= np.roll(np.roll(out, dy, 0), dx, 1)
        add = cand & near & ~out
        if not add.any():
            break
        out |= add
    # the dark weapon behind the head the mask took for hair (or its outline): head pixels outside the row's own head (moved onto
    # this frame's head, 1 px wider), joined to the weapon
    if ref is not None:
        ref = ref['mask']
        headish = np.isin(clab, [KOD['wlosy'], KOD['kontur_wlosow'], K_, KOD['inne']]) & (cimg[:, :, 3] > 0)
        cur = np.isin(clab, HEADP)
        moved = align(ref, cur | T)
        fit = (moved & (cur | T)).sum() / max(1, ref.sum())
        own = dilate(moved, 1)
        wide = (U_ >= lo[J] - 3.5) & (U_ <= hi[J] + 3.5) & (S_ >= smin - 2) & (S_ <= smax + 2) & (lo[J] < 90)
        extra = headish & ~own & ~effect_pixels(cimg) & wide if fit >= 0.75 else np.zeros_like(out)
        # (with the row's head to paint the hair back from, all the "hair" right in the weapon's tube is the weapon: what of it was
        # hair comes back from the reference)
        if fit >= 0.75:
            extra |= inside & np.isin(clab, [KOD['wlosy'], KOD['kontur_wlosow']]) & (cimg[:, :, 3] > 0)
        for _ in range(12):
            near = np.zeros_like(out)
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                near |= np.roll(np.roll(out, dy, 0), dx, 1)
            add = extra & near & ~out
            if not add.any():
                break
            out |= add
    # thin "hands" inside the weapon (a light streak of the wood the mask took for fingers): small pieces of hand mostly walled in by
    # the weapon, not the big blob of a real fist
    for cy, cx in components(clab == H_):
        if len(cy) > 14:
            continue
        cnt = 0
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy or dx:
                    yy = np.clip(cy + dy, 0, CELL - 1); xx = np.clip(cx + dx, 0, CELL - 1)
                    cnt += int(out[yy, xx].sum())
        if cnt >= 4.5 * len(cy):
            out[cy, cx] = True
    # single pixels inside the weapon the mask took for something else (a light knot of the wood "face", a dark one "hair"): most of
    # their neighbours are the weapon
    opaque = (cimg[:, :, 3] > 0) & np.isin(clab, list(ENCLOSED)) & ~effect_pixels(cimg) & (val < 0.75)
    for _ in range(2):
        cnt = np.zeros(out.shape, int)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy or dx:
                    cnt += np.roll(np.roll(out, dy, 0), dx, 1)
        add = opaque & ~out & (cnt >= 5)
        if not add.any():
            break
        out |= add
    return out


def axis_of(cimg, clab, flip=False, has_metal=True, ref=None, zmaz=()):
    """oś broni w jednej klatce: dict albo None (bez broni); zmaz - prostokąty (x0, y0, x1, y1 włącznie) z ręcznych poprawek:
    wszystko poza dłońmi jest tam bronią"""
    T = weapon_pixels(cimg, clab)
    for x0_, y0_, x1_, y1_ in zmaz:
        box = np.zeros_like(T)
        box[y0_:y1_ + 1, x0_:x1_ + 1] = True
        T |= box & (cimg[:, :, 3] > 0) & (clab != H_) & ~effect_pixels(cimg)
    n = int(T.sum())
    if n < 5:
        return None
    ys, xs = np.nonzero(T)
    c0, v0 = thin_fit(xs, ys)
    T = grow(cimg, clab, T, c0, v0, ref)
    n = int(T.sum())
    ys, xs = np.nonzero(T)
    px, py = xs + 0.5, ys + 0.5
    c, v = thin_fit(xs, ys)
    s = (px - c[0]) * v[0] + (py - c[1]) * v[1]
    perp = (px - c[0]) * v[1] - (py - c[1]) * v[0]
    smin, smax = s.min(), s.max()
    L = smax - smin
    rgb = cimg[ys, xs, :3].astype(float) / 255
    h, sat, val = hsv(rgb)
    metal = ((sat < 0.16) & (val >= 0.28)) | (val > 0.88)
    ends = []
    for sign in (-1, 1):
        reg = (s <= smin + 0.35 * L) if sign < 0 else (s >= smax - 0.35 * L)
        width = (perp[reg].max() - perp[reg].min()) if reg.any() else 0
        ends.append(2.0 * metal[reg].sum() + 1.5 * width + 0.3 * reg.sum())
    # which end is the head: clearly more metal there (the axe, the pick, the spear's head); else the hand is nearer the handle's end
    # (the club: all wood); else the wider end
    Hd = clab == H_
    near = np.zeros_like(Hd)
    for dy in (-2, -1, 0, 1, 2):
        for dx in (-2, -1, 0, 1, 2):
            near |= np.roll(np.roll(T, dy, 0), dx, 1)
    hy, hx = np.nonzero(Hd & near)
    hs = (hx + 0.5 - c[0]) * v[0] + (hy + 0.5 - c[1]) * v[1] if len(hy) else None
    mlo = metal[s <= smin + 0.35 * L].sum(); mhi = metal[s >= smax - 0.35 * L].sum()
    if has_metal and abs(int(mlo) - int(mhi)) >= 4:
        lower_is_head = mlo > mhi
    elif hs is not None:
        lower_is_head = hs.mean() > (smin + smax) / 2
    else:
        lower_is_head = ends[0] > ends[1]
    if lower_is_head != flip:
        v = -v
        s, perp = -s, -perp
        smin, smax = -smax, -smin
        if hs is not None:
            hs = -hs
    # chwyt = plama dłoni przy broni najbliżej końca trzonka
    grip = None
    if hs is not None:
        lo = hs.min()
        grip = float(hs[hs <= lo + 4].mean())
    return dict(c=c, v=v, smin=float(smin), smax=float(smax), L=float(L), grip=grip, n=n, T=T)


HEADP = [KOD[k] for k in ('wlosy', 'kontur_wlosow', 'twarz_szyja', 'oczy_usta')]


def dilate(m, k=1):
    out = m.copy()
    for _ in range(k):
        o2 = out.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                o2 |= np.roll(np.roll(out, dy, 0), dx, 1)
        out = o2
    return out


def head_refs(img, lab):
    """głowa każdego wiersza z klatki, w której broń jest najdalej od niej (włosy + twarz): wzór do odróżnienia ciemnej broni za
    głową, którą maska wzięła za włosy"""
    H, W = lab.shape
    rows, cols = H // CELL, W // CELL
    refs = []
    for r in range(rows):
        best, bscore = None, None
        for c in range(cols):
            cl = lab[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL]
            hair = np.isin(cl, HEADP[:2])
            if hair.sum() < 30:
                continue
            hy, hx = np.nonzero(hair)
            my, mx = hy.mean(), hx.mean()
            ty, tx = np.nonzero(cl == T_)
            near = int((((tx - mx) ** 2 + (ty - my) ** 2) < 16 ** 2).sum()) if len(ty) else 0
            score = near * 10 + abs(int(hair.sum()) - 150) * 0.1
            if bscore is None or score < bscore:
                bscore, best = score, dict(mask=np.isin(cl, HEADP), c=c, r=r)
        refs.append(best)
    return refs


def align(ref, cur, full=False):
    """przesunięcie wzoru głowy (dy, dx) na głowę klatki: największa wspólna część"""
    best, bs = (0, 0), -1
    for dy in range(-10, 11):
        for dx in range(-10, 11):
            sc = int((np.roll(np.roll(ref, dy, 0), dx, 1) & cur).sum())
            if sc > bs:
                bs, best = sc, (dy, dx)
    moved = np.roll(np.roll(ref, best[0], 0), best[1], 1)
    return (moved, best) if full else moved


def angle(v):
    return math.atan2(v[1], v[0])


def lerp_angle(a, b, t):
    d = (b - a + math.pi) % (2 * math.pi) - math.pi
    return a + d * t


# arkusze, na których broń to ostrze (miecz z PixelLab): oś z samego metalu, chwyt = dłoń najbliżej nasady ostrza (ręka wyciągnięta w tej
# samej linii co miecz - wschód - inaczej "przedłużała" broń aż do drugiej dłoni), długość odniesienia na sztywno (najdłuższa
# klatka ma rękę na tej samej prostej)
OSTRZE = {'Hero_Sword': dict(L=34.0)}


def blade_axis(cimg, clab, a):
    """oś miecza: prosta przez szare piksele broni, od dłoni (chwyt, 3 px rękojeści za nim) do końca ostrza; None - bez ostrza"""
    T = a['T']
    ys, xs = np.nonzero(T)
    rgb = cimg[ys, xs, :3].astype(float) / 255
    h, sat, val = hsv(rgb)
    # (metal ostrza: szare piksele, które maska dała broni - nie szary rękaw tuniki w tej samej linii)
    metal = (((sat < 0.16) & (val >= 0.28)) | (val > 0.88)) & (clab[ys, xs] == T_)
    if metal.sum() < 6:
        return None
    # (ostrze = największa spójna plama metalu; szary kawałek za dłonią to rękaw albo druga ręka)
    mm = np.zeros_like(T)
    mm[ys[metal], xs[metal]] = True
    comps = components(mm)
    my, mx = comps[0]
    if len(my) < 6:
        return None
    c, v = thin_fit(mx, my)
    sm = (mx + 0.5 - c[0]) * v[0] + (my + 0.5 - c[1]) * v[1]
    hy, hx = np.nonzero(clab == H_)
    grip = None
    if len(hy):
        hs = (hx + 0.5 - c[0]) * v[0] + (hy + 0.5 - c[1]) * v[1]
        hp = np.abs((hx + 0.5 - c[0]) * v[1] - (hy + 0.5 - c[1]) * v[0])
        near = hp <= 4
        if near.any():
            # (ostrze leży po tej stronie dłoni, po której jest więcej metalu)
            if (sm > hs[near].mean()).sum() < (sm < hs[near].mean()).sum():
                v, sm, hs = -v, -sm, -hs
            front = near & (hs <= sm.min() + 2)
            grip = float(hs[front].max()) if front.any() else float(hs[near].max())
    tip = float(sm.max())
    if grip is None:
        grip = float(sm.min()) - 1
    butt = grip - 3.0
    px, py = xs + 0.5, ys + 0.5
    st = (px - c[0]) * v[0] + (py - c[1]) * v[1]
    pp = np.abs((px - c[0]) * v[1] - (py - c[1]) * v[0])
    keep = (st >= butt - 1) & (st <= tip + 1) & (pp <= 3)
    T2 = np.zeros_like(T)
    T2[ys[keep], xs[keep]] = True
    return dict(c=c, v=v, smin=butt, smax=tip, L=tip - butt, grip=grip, n=int(keep.sum()), T=T2, ostrze=True)


def analyse(name):
    """osie wszystkich klatek arkusza (po wyrównaniu niepewnych z sąsiadów)"""
    img, lab = load(name)
    H, W = lab.shape
    rows, cols = H // CELL, W // CELL
    refs = head_refs(img, lab)
    ax = [[None] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            sl = (slice(r * CELL, (r + 1) * CELL), slice(c * CELL, (c + 1) * CELL))
            fix = POPRAWKI.get((name, r, c), {})
            a = axis_of(img[sl], lab[sl], flip=bool(fix.get('odwroc')), has_metal=name != 'Hero_Club', ref=refs[r], zmaz=fix.get('zmaz', ()))
            if a and name in OSTRZE:
                a = blade_axis(img[sl], lab[sl], a)
            if a:
                a['fix'] = fix
            ax[r][c] = a
    lens = [a['L'] for row in ax for a in row if a]
    Lref = float(np.percentile(lens, 90)) if lens else 1.0
    if name in OSTRZE:
        Lref = OSTRZE[name]['L']
    for r in range(rows):
        row = ax[r]
        for a in row:
            if not a:
                continue
            # (ostrze: krótsze w skrócie perspektywy, gdy miecz celuje w widza - i tak pewne, jeśli jest dłoń i kawałek metalu)
            a['pewna'] = a['L'] >= (0.3 if a.get('ostrze') else 0.55) * Lref and a['grip'] is not None and a['n'] >= (12 if a.get('ostrze') else 25)                 and a['fix'].get('pewna', True)
            # punkty w układzie klatki: koniec trzonka, chwyt, czubek
            a['butt'] = a['c'] + a['v'] * a['smin']
            a['tip'] = a['c'] + a['v'] * a['smax']
            a['gp'] = a['c'] + a['v'] * a['grip'] if a['grip'] is not None else None
        # niepewne klatki: z sąsiednich pewnych (kąt, chwyt, długości) - liniowo
        good = [i for i, a in enumerate(row) if a and a['pewna']]
        for i, a in enumerate(row):
            if not a or a['pewna'] or not good:
                continue
            before = [g for g in good if g < i]
            after = [g for g in good if g > i]
            if before and after:
                p, q = row[before[-1]], row[after[0]]
                t = (i - before[-1]) / (after[0] - before[-1])
            else:
                p = q = row[before[-1] if before else after[0]]
                t = 0
            ang = lerp_angle(angle(p['v']), angle(q['v']), t)
            v = np.array([math.cos(ang), math.sin(ang)])
            gp = p['gp'] * (1 - t) + q['gp'] * t
            L = p['L'] * (1 - t) + q['L'] * t
            gl = (p['grip'] - p['smin']) * (1 - t) + (q['grip'] - q['smin']) * t
            a['v'] = v
            a['gp'] = gp
            a['butt'] = gp - v * gl
            a['tip'] = a['butt'] + v * L
            a['L'] = L
            a['interp'] = True
            # (ostrze prawie niewidoczne - miecz przed ciałem, widziany z tyłu: nowy rodzaj też schowany, starą broń i tak wymazuje)
            if name in OSTRZE and a.get('n', 0) < 30:
                a['ukryta'] = True
            # the weapon's pixels again, along this axis (the pieces the first look took for something else)
            y0, x0 = r * CELL, i * CELL
            cim, cla = img[y0:y0 + CELL, x0:x0 + CELL], lab[y0:y0 + CELL, x0:x0 + CELL]
            YY, XX = np.mgrid[0:CELL, 0:CELL]
            PX, PY = XX + 0.5 - a['butt'][0], YY + 0.5 - a['butt'][1]
            S_ = PX * v[0] + PY * v[1]
            U_ = PX * v[1] - PY * v[0]
            T2 = (cla == T_) & ~effect_pixels(cim) & (np.abs(U_) <= 6) & (S_ >= -4) & (S_ <= L + 4)
            if T2.sum() >= 5:
                a['T'] = grow(cim, cla, T2 | a['T'], a['butt'], v, refs[r])
    # the row's own head moved onto each frame's (with what the weapon covers): the head behind the weapon is painted from it
    for r in range(rows):
        ref = refs[r]
        for c, a in enumerate(ax[r]):
            if not a or ref is None:
                continue
            cl = lab[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL]
            moved, off = align(ref['mask'], np.isin(cl, HEADP) | a['T'], full=True)
            fit = (moved & (np.isin(cl, HEADP) | a['T'])).sum() / max(1, ref['mask'].sum())
            a['ref'] = (ref['c'], off[0], off[1], moved) if fit >= 0.75 else None
    tips = [float(np.dot(a['tip'] - a['gp'], a['v'])) for row in ax for a in row if a and a['gp'] is not None]
    Gref = float(np.percentile(tips, 90)) if tips else Lref
    for row in ax:
        for a in row:
            if not a:
                continue
            a['f'] = max(0.25, min(1.0, a['L'] / Lref))
            a['fg'] = max(0.25, min(1.0, float(np.dot(a['tip'] - a['gp'], a['v'])) / Gref)) if a['gp'] is not None else a['f']
    # strona ostrza w wierszu: w stronę ruchu czubka w klatce ciosu
    for r in range(rows):
        hit = HIT.get(name, [8] * 4)[r]
        side = 1.0
        a1 = ax[r][hit] if hit < cols else None
        a0 = None
        for k in (hit - 1, hit - 2, hit - 3):
            if 0 <= k < cols and ax[r][k]:
                a0 = ax[r][k]
                break
        if a0 and a1:
            mv = a1['tip'] - a0['tip']
            n = np.array([-a1['v'][1], a1['v'][0]])
            side = 1.0 if np.dot(mv, n) >= 0 else -1.0
        for a in ax[r]:
            if a:
                a['side'] = side
    return img, lab, ax, Lref


# --------------------------------------------------------------------------- arkusz bez broni
def clean(img, lab, ax):
    out = img.copy()
    olab = lab.copy()
    H, W = lab.shape
    rows, cols = H // CELL, W // CELL
    erased = np.zeros((H, W), bool)
    for r in range(rows):
        for c in range(cols):
            a = ax[r][c]
            if not a:
                continue
            y0, x0 = r * CELL, c * CELL
            T = a['T']
            ci = out[y0:y0 + CELL, x0:x0 + CELL]
            cl = olab[y0:y0 + CELL, x0:x0 + CELL]
            # the real body (not the weapon, not an outline - the weapon's own outline is black too, not the empty air)
            body = (cl != T_) & (ci[:, :, 3] > 0) & (cl != 0) & (cl != K_) & (cl != KOD['inne'])
            v = a['v']
            n = np.array([-v[1], v[0]])
            ys, xs = np.nonzero(T)
            fills = []
            for y, x in zip(ys, xs):
                hits = []
                for sgn in (1, -1):
                    got = None
                    outl = 0
                    for k in range(1, 9):
                        xx = int(round(x + sgn * n[0] * k)); yy = int(round(y + sgn * n[1] * k))
                        if not (0 <= xx < CELL and 0 <= yy < CELL):
                            break
                        if T[yy, xx]:
                            continue
                        if cl[yy, xx] == K_ and ci[yy, xx, 3] > 0 and outl < 2:
                            outl += 1
                            continue
                        if body[yy, xx]:
                            got = (k, yy, xx, sgn)
                        break
                    hits.append(got)
                if hits[0] and hits[1]:
                    # inside the figure: the nearer side's body pixel (past an outline)
                    k, yy, xx, sgn = min(hits, key=lambda h: h[0])
                    fills.append((y, x, yy, xx))
                else:
                    fills.append((y, x, None, None))
            rf = a.get('ref')
            for y, x, yy, xx in fills:
                # (the head behind the weapon: the row's own head from its frame without the weapon near it)
                if rf is not None and rf[3][y, x]:
                    sy, sx = y - rf[1], x - rf[2]
                    if 0 <= sy < CELL and 0 <= sx < CELL:
                        Y, X = r * CELL + sy, rf[0] * CELL + sx
                        if lab[Y, X] in HEADP or (lab[Y, X] == K_ and img[Y, X, 3] > 0):
                            ci[y, x] = img[Y, X]
                            cl[y, x] = lab[Y, X]
                            continue
                if yy is None:
                    ci[y, x] = 0
                    cl[y, x] = 0
                    erased[y0 + y, x0 + x] = True
                else:
                    ci[y, x] = ci[yy, xx]
                    cl[y, x] = cl[yy, xx]
            # the weapon's outline left alone in the air (black, no body next to it) - away
            for _ in range(2):
                op = ci[:, :, 3] > 0
                for y, x in zip(*np.nonzero((cl == K_) & op)):
                    ok = False
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            yy, xx = y + dy, x + dx
                            if (dy or dx) and 0 <= yy < CELL and 0 <= xx < CELL and op[yy, xx] and cl[yy, xx] not in (K_, 0):
                                ok = True
                    if not ok:
                        ci[y, x] = 0
                        cl[y, x] = 0
                        erased[y0 + y, x0 + x] = True
            # bits of the old weapon left floating (not joined to the figure, not the yellow streaks): away
            eff = effect_pixels(ci)
            comps = components((ci[:, :, 3] > 0) & ~eff)
            for cy, cx in comps[1:]:
                if len(cy) <= 40:
                    ci[cy, cx] = 0
                    cl[cy, cx] = 0
                    erased[y0 + cy, x0 + cx] = True
            # the body that lost its edge under the weapon: a new outline pixel where the weapon was, next to the body
            op = ci[:, :, 3] > 0
            er = erased[y0:y0 + CELL, x0:x0 + CELL]
            add = []
            for y, x in zip(*np.nonzero(er & ~op)):
                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < CELL and 0 <= xx < CELL and op[yy, xx] and cl[yy, xx] not in (K_, KOD['kontur_koszuli'], KOD['kontur_wlosow'], KOD['kontur_stop']):
                        add.append((y, x))
                        break
            for y, x in add:
                ci[y, x] = KONTUR + (255,)
                cl[y, x] = K_
    # (a manual fix: a piece of another frame of the row, already without its weapon - the legs of the next frame where the weapon hid
    # them in this one)
    for r in range(rows):
        for c in range(cols):
            a = ax[r][c]
            zk = a.get('fix', {}).get('z_klatki') if a else None
            if not zk:
                continue
            sc, (bx0, by0, bx1, by1) = zk
            y0, x0, sx0 = r * CELL, c * CELL, sc * CELL
            out[y0 + by0:y0 + by1 + 1, x0 + bx0:x0 + bx1 + 1] = out[y0 + by0:y0 + by1 + 1, sx0 + bx0:sx0 + bx1 + 1]
            olab[y0 + by0:y0 + by1 + 1, x0 + bx0:x0 + bx1 + 1] = olab[y0 + by0:y0 + by1 + 1, sx0 + bx0:sx0 + bx1 + 1]
    return out, olab


def mask_image(lab):
    H, W = lab.shape
    m = np.zeros((H, W, 4), np.uint8)
    for k, col in KOLOR.items():
        sel = lab == k
        m[sel, :3] = col
        m[sel, 3] = 255
    return m


# --------------------------------------------------------------------------- the kinds: a profile along the axis
# part(s, u, Lk, side) -> (class, tone) or None; s: px from the end of the handle along the weapon (0..Lk), u: px across it (+ =
# the blade's side, times `side`). LEN: the kind's whole length (px, unforeshortened); GRIP: where the hand holds it (s);
# anchor 'trzonek': drawn from the old weapon's butt with its length (the long ones on their own swings), 'chwyt': from the hand
def blade_tone(u, half, lit):
    """ostrze: ciemniejszy środek (zbrocze), jasna krawędź, strona od światła ciemniejsza"""
    e = abs(u) / max(0.5, half)
    k = 3 + (1 if lit else -1)
    if e < 0.34:
        k -= 1
    if e > 0.7:
        k += 2
    return k


def p_miecz(s, u, L, side):
    if s < 0 or s > L:
        return None
    if s < 1.6:                                   # głowica
        return ('m', 3 + (u < 0)) if abs(u) <= 1.6 else None
    if s < 6.5:                                   # rękojeść (owijka)
        return ('a', 1 + (u < 0) + (int(s) % 2)) if abs(u) <= 1.0 else None
    if s < 8.0:                                   # jelec
        return ('m', 4 + (u < 0) - (abs(u) > 3)) if abs(u) <= 4.2 else None
    half = 1.6 if s < L - 5 else 1.6 * (L - s) / 5 + 0.25
    if abs(u) <= half:
        return ('m', blade_tone(u, half, u < 0))
    return None


def p_sztylet(s, u, L, side):
    if s < 0 or s > L:
        return None
    if s < 1.2:
        return ('m', 3) if abs(u) <= 1.2 else None
    if s < 4.2:
        return ('a', 1 + (u < 0)) if abs(u) <= 0.9 else None
    if s < 5.4:
        return ('m', 4 + (u < 0)) if abs(u) <= 2.6 else None
    half = 1.3 if s < L - 4 else 1.3 * (L - s) / 4 + 0.2
    return ('m', blade_tone(u, half, u < 0)) if abs(u) <= half else None


def p_buzdygan(s, u, L, side):
    if s < 0 or s > L:
        return None
    head = L - 8
    if s < 5:
        return ('a', 1 + (u < 0) + (int(s) % 2)) if abs(u) <= 1.1 else None
    if s < head:
        return ('w', 2 + (u < 0)) if abs(u) <= 1.0 else None
    if s < head + 1:
        return ('m', 3) if abs(u) <= 1.8 else None
    if s > L - 1:
        return ('m', 5) if abs(u) <= 1.2 else None
    # pióra: na przemian jasne / ciemne w poprzek, zarys jak liść
    t = (s - head - 1) / 7
    half = 2.2 + 1.6 * math.sin(math.pi * min(1, t * 1.15))
    if abs(u) > half:
        return None
    k = 4 if (int(round(u + 10)) % 2 == 0) else 2
    return ('m', k + (1 if u < 0 else 0))


def p_mlot(s, u, L, side):
    """młot bojowy: drzewce, głowa w poprzek - obuch po jednej stronie, dziób (kolec) w stronę ciosu"""
    if s < 0 or s > L:
        return None
    head0 = L - 6
    if s < 5:
        return ('a', 1 + (u < 0)) if abs(u) <= 1.0 else None
    if s < head0:
        return ('w', 2 + (u < 0)) if abs(u) <= 1.0 else None
    us = u * side
    if s <= L - 1:
        if -5.0 <= us <= 1.5:                     # obuch
            return ('m', 4 if s < head0 + 2 else 3 if us > -4 else 2)
        if us > 1.5:                              # dziób: zwęża się
            reach = 7.5 - (s - head0) * 0.9
            return ('m', 4 if s < head0 + 2 else 3) if us <= reach else None
        return None
    return ('m', 5) if abs(u) <= 1.2 else None     # szpic na górze


def p_topor(s, u, L, side):
    """topór bojowy: drzewce do góry, ostrze z brodą w stronę ciosu (rozszerza się od drzewca ku krawędzi, broda w dół), krótki
    obuch z tyłu"""
    if s < 0 or s > L + 2:
        return None
    us = u * side
    if abs(u) <= 1.0 and s <= L:
        return ('w', 2 + (u < 0)) if s < L - 7 else ('m', 3 + (u < 0))
    if us > 0.5 and us <= 8.5:
        t = us / 8.5
        lo = L - 6.5 - 6.0 * t ** 1.4          # broda schodzi w dół ku krawędzi
        hi = L - 1.0 + 2.5 * t                 # górny róg lekko w górę
        if lo <= s <= hi:
            edge = us > 7.0 or (us > 5.5 and (s < lo + 1.2 or s > hi - 1.2))
            return ('m', 6 if edge else (4 if s > (lo + hi) / 2 else 3))
        return None
    if us < -0.5 and us >= -3.2 and L - 5.5 <= s <= L - 1.5:   # obuch
        return ('m', 3 if us > -2.5 else 2)
    return None


def p_grot(kind):
    head = {'wlocznia': 9, 'rohatyna': 10, 'sulica': 7}[kind]

    def f(s, u, L, side):
        if s < 0 or s > L:
            return None
        h0 = L - head
        if s < h0:
            if kind == 'rohatyna' and h0 - 2 <= s < h0 - 0.5:   # poprzeczka
                return ('m', 3) if abs(u) <= 3.6 else None
            return ('w', 2 + (u < 0) - (1 if s < 6 else 0)) if abs(u) <= 0.9 else None
        t = (s - h0) / head
        if t < 0.18:                                   # tulejka
            return ('m', 2 + (u < 0)) if abs(u) <= 1.2 else None
        if kind == 'wlocznia':
            half = 2.6 * math.sin(math.pi * min(1, (t - 0.18) / 0.82)) ** 0.8 + 0.3
        elif kind == 'rohatyna':
            half = 3.4 * (1 - max(0, (t - 0.3) / 0.7)) ** 0.9 + 0.3 if t > 0.3 else 1.4 + (t - 0.18) * 16
        else:
            half = 1.2 * (1 - t) + 0.35
        if abs(u) > half:
            return None
        return ('m', blade_tone(u, half, u < 0))
    return f


def p_dlugi_miecz(s, u, L, side):
    if s < 0 or s > L:
        return None
    if s < 1.8:
        return ('m', 3 + (u < 0)) if abs(u) <= 1.7 else None
    if s < 9.0:                                   # długa rękojeść (na dwie dłonie)
        return ('a', 1 + (u < 0) + (int(s) % 2)) if abs(u) <= 1.0 else None
    if s < 10.6:                                  # jelec, szeroki
        return ('m', 4 + (u < 0) - (abs(u) > 3.5)) if abs(u) <= 5.0 else None
    half = 1.8 if s < L - 6 else 1.8 * (L - s) / 6 + 0.25
    return ('m', blade_tone(u, half, u < 0)) if abs(u) <= half else None


def p_tasak(s, u, L, side):
    """tasak: krótka rękojeść, szerokie ostrze z prostym grzbietem, ścięty sztych; ostrze (krawędź) w stronę ciosu"""
    if s < 0 or s > L:
        return None
    if s < 1.2:
        return ('m', 3) if abs(u) <= 1.3 else None
    if s < 6.0:
        return ('a', 1 + (u < 0) + (int(s) % 2)) if abs(u) <= 1.0 else None
    if s < 7.2:
        return ('m', 4) if abs(u) <= 2.6 else None
    us = u * side
    back = -1.3                                   # grzbiet
    edge = 2.4 + 1.2 * (s - 7.2) / max(1, L - 7.2)  # rozszerza się ku końcowi
    if s > L - 3:                                 # ścięty koniec
        edge -= (s - (L - 3)) * 1.1
    if back <= us <= edge:
        k = 6 if us > edge - 1.1 else 2 if us < back + 0.9 else 4 if us < 0.5 else 3
        return ('m', k)
    return None


def p_szabla(s, u, L, side):
    """szabla: lekka, zakrzywiona głownia (wygięta w stronę grzbietu), mały jelec"""
    if s < 0 or s > L:
        return None
    if s < 1.4:
        return ('m', 3) if abs(u) <= 1.4 else None
    if s < 6.0:
        return ('a', 1 + (u < 0) + (int(s) % 2)) if abs(u) <= 1.0 else None
    if s < 7.3:
        return ('m', 5) if abs(u) <= 3.0 else None
    t = (s - 7.3) / max(1, L - 7.3)
    c = -side * 4.5 * t * t                       # wygięcie
    half = 1.35 if t < 0.85 else 1.35 * (1 - t) / 0.15 + 0.2
    du = u - c
    if abs(du) <= half:
        return ('m', blade_tone(du, half, du < 0))
    return None


def p_kostur(s, u, L, side):
    """kostur: długi drąg, owinięty u dołu i pod głowicą, gałka na szczycie"""
    if s < 0 or s > L:
        return None
    if s > L - 3:
        return ('m', 4 + (u < 0)) if abs(u) <= 2.0 else None   # gałka (materiał)
    if abs(u) > 1.1:
        return None
    if s < 4 or L - 8 < s <= L - 3:
        return ('a', 1 + (u < 0) + (int(s) % 2))
    return ('w', 2 + (u < 0) + (1 if int(s) % 9 == 0 else 0))


def p_kiscien(s, u, L, side):
    """kiścień: rękojeść, łańcuch (ogniwa na przemian), kolczasta kula"""
    if s < 0 or s > L + 1:
        return None
    if s < 11:
        if abs(u) > 1.1:
            return None
        return ('a', 1 + (u < 0)) if s < 5 else ('w', 2 + (u < 0))
    if s < 11.8:
        return ('m', 3) if abs(u) <= 1.6 else None              # okucie
    if s < L - 6:                                                # łańcuch
        k = int(s) % 2
        return ('m', 4 if k else 2) if abs(u) <= (0.9 if k else 0.5) else None
    cs = L - 3.0                                                 # kula
    d = ((s - cs) ** 2 + u * u) ** 0.5
    if d <= 3.2:
        return ('m', 5 if (u < -0.5 and s > cs) else 3 if d > 2.2 else 4)
    # kolce: cztery
    for (ss, uu) in ((cs + 4.2, 0), (cs - 4.2, 0), (cs, 4.2), (cs, -4.2)):
        if abs(s - ss) <= 0.8 and abs(u - uu) <= 0.8:
            return ('m', 5)
    return None


def p_czekan(s, u, L, side):
    """czekan: drzewce, mały toporek w stronę ciosu, długi dziób z tyłu"""
    if s < 0 or s > L + 1:
        return None
    us = u * side
    if abs(u) <= 1.0 and s <= L:
        return ('w', 2 + (u < 0)) if s < L - 6 else ('m', 3 + (u < 0))
    if 0.5 < us <= 5.0:
        t = us / 5.0
        lo = L - 5.0 - 2.5 * t
        hi = L - 0.8 + 1.0 * t
        if lo <= s <= hi:
            return ('m', 6 if us > 4.0 else 4)
        return None
    if -7.5 <= us < -0.5:                                        # dziób
        reach = 7.5
        mid = L - 3.0 - (-us - 0.5) * 0.35                       # lekko w dół
        half = 1.4 * (1 - (-us) / reach) + 0.4
        return ('m', 3 if -us < 6 else 5) if abs(s - mid) <= half else None
    return None


def p_bardysz(s, u, L, side):
    """bardysz: długie drzewce, wielkie półksiężycowe ostrze przybite w dwóch miejscach, sztych u góry"""
    if s < 0 or s > L + 3:
        return None
    us = u * side
    if abs(u) <= 1.0 and s <= L:
        return ('w', 2 + (u < 0)) if s < L - 16 else ('m', 3 + (u < 0))
    if 0.5 < us <= 7.0:
        t = us / 7.0
        lo = L - 16 + 3.5 * (1 - (1 - t) ** 2) * 0          # (dół ostrza prawie na tej samej wysokości)
        lo = L - 16 + 2.0 * (1 - t)
        hi = L + 2.5 * t - 1.0 * (1 - t)
        if lo <= s <= hi:
            edge = us > 5.6
            return ('m', 6 if edge else 4 if s > (lo + hi) / 2 else 3)
        return None
    return None


KINDS = {
    'miecz': dict(part=p_miecz, LEN=30, GRIP=4.0, anchor='chwyt'),
    'dlugi_miecz': dict(part=p_dlugi_miecz, LEN=38, GRIP=5.0, anchor='chwyt'),
    'tasak': dict(part=p_tasak, LEN=24, GRIP=3.5, anchor='chwyt'),
    'szabla': dict(part=p_szabla, LEN=31, GRIP=3.6, anchor='chwyt'),
    'kostur': dict(part=p_kostur, LEN=46, GRIP=6.0, anchor='chwyt'),
    'kiscien': dict(part=p_kiscien, LEN=28, GRIP=3.0, anchor='chwyt'),
    'czekan': dict(part=p_czekan, LEN=None, GRIP=0, anchor='trzonek'),
    'bardysz': dict(part=p_bardysz, LEN=None, GRIP=0, anchor='trzonek'),
    'sztylet': dict(part=p_sztylet, LEN=14, GRIP=2.6, anchor='chwyt'),
    'buzdygan': dict(part=p_buzdygan, LEN=27, GRIP=3.0, anchor='chwyt'),
    'mlot': dict(part=p_mlot, LEN=None, GRIP=3.0, anchor='trzonek'),
    'topor': dict(part=p_topor, LEN=None, GRIP=0, anchor='trzonek'),
    'rohatyna': dict(part=p_grot('rohatyna'), LEN=None, GRIP=0, anchor='trzonek'),
    'sulica': dict(part=p_grot('sulica'), LEN=None, GRIP=0, anchor='trzonek'),
}
# (the war hammer on the club's swing: a short one from the hand)
MLOT_KROTKI = dict(part=p_mlot, LEN=28, GRIP=3.0, anchor='chwyt')


def render_kind(name, kind, img, lab, cimg, clab, ax, Lref):
    """szablon nowego rodzaju na wszystkich klatkach arkusza"""
    K = MLOT_KROTKI if (kind == 'mlot' and name == 'Hero_Club') else KINDS[kind]
    H, W = lab.shape
    rows, cols = H // CELL, W // CELL
    out = np.zeros((H, W, 4), np.uint8)
    for r in range(rows):
        for c in range(cols):
            a = ax[r][c]
            if not a or a.get('ukryta'):
                continue
            y0, x0 = r * CELL, c * CELL
            v = a['v']
            n = np.array([-v[1], v[0]])
            side = a['side']
            if K['anchor'] == 'chwyt' and a['gp'] is not None:
                Lk, f = K['LEN'], a['fg']
                base = a['gp'] - v * K['GRIP'] * f
            else:
                Lk, f = Lref, a['f']
                base = a['butt']
            oldT = a['T']
            # stacje osi, przy których stara broń była widać
            ys, xs = np.nonzero(oldT)
            st_old = (xs + 0.5 - base[0]) * v[0] + (ys + 0.5 - base[1]) * v[1]
            vis = set(int(round(q)) for q in st_old)
            vis |= {q + 1 for q in vis} | {q - 1 for q in vis}
            cl = clab[y0:y0 + CELL, x0:x0 + CELL]
            co = cimg[y0:y0 + CELL, x0:x0 + CELL]
            near_old = oldT.copy()
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                near_old |= np.roll(np.roll(oldT, dy, 0), dx, 1)
            cls = {}
            for yy in range(CELL):
                for xx in range(CELL):
                    px, py = xx + 0.5 - base[0], yy + 0.5 - base[1]
                    sa = px * v[0] + py * v[1]
                    if sa < -3 or sa > Lk * f + 9:
                        continue
                    u = px * n[0] + py * n[1]
                    p = K['part'](sa / f, u, Lk, side)
                    if p:
                        cls[(yy, xx)] = p
            ol = []
            for (yy, xx) in list(cls.keys()):
                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    q = (yy + dy, xx + dx)
                    if 0 <= q[0] < CELL and 0 <= q[1] < CELL and q not in cls:
                        ol.append(q)
            for q in ol:
                cls[q] = ('k', 0)
            # what is seen: never over the hand; over the body only where the old weapon was seen (or was there itself)
            for (yy, xx), (k, tone) in cls.items():
                if cl[yy, xx] == H_:
                    continue
                px, py = xx + 0.5 - base[0], yy + 0.5 - base[1]
                st = int(round(px * v[0] + py * v[1]))
                if co[yy, xx, 3] > 0 and not near_old[yy, xx] and (st not in vis or cl[yy, xx] in HEAD):
                    continue
                out[y0 + yy, x0 + xx, :3] = tpl(k, tone)
                out[y0 + yy, x0 + xx, 3] = 255
    return out


def punch_axes(img, lab):
    """pięści: w każdej klatce dłoń, która uderza (w wierszu ta sama strona ciała - ta, która w większości klatek jest dalej od
    tułowia), kierunek od przedramienia do pięści (bez przedramienia: od środka koszuli)"""
    H, W = lab.shape
    rows, cols = H // CELL, W // CELL
    ax = [[None] * cols for _ in range(rows)]
    for r in range(rows):
        blobs = []
        votes = 0
        for c in range(cols):
            cl = lab[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL]
            shirt = np.isin(cl, [KOD['koszula']])
            sy, sx = np.nonzero(shirt)
            body = np.array([sx.mean(), sy.mean()]) if len(sy) else np.array([48.0, 50.0])
            hands = [cp for cp in components(cl == H_) if len(cp[0]) >= 3]
            blobs.append((cl, body, hands))
            if len(hands) >= 2:
                far = max(hands, key=lambda h: np.hypot(h[1].mean() - body[0], h[0].mean() - body[1]))
                votes += 1 if far[1].mean() > body[0] else -1
        right_side = votes >= 0
        for c, (cl, body, hands) in enumerate(blobs):
            if not hands:
                continue
            if len(hands) == 1:
                hd = hands[0]
            else:
                hd = max(hands, key=lambda h: h[1].mean()) if right_side else min(hands, key=lambda h: h[1].mean())
            hc = np.array([hd[1].mean() + 0.5, hd[0].mean() + 0.5])
            # the forearm: bare skin within 6 px of this hand
            sk = cl == KOD['skora']
            yy, xx = np.nonzero(sk)
            near = [(x, y) for x, y in zip(xx, yy) if ((hd[1] - x) ** 2 + (hd[0] - y) ** 2).min() <= 36]
            if len(near) >= 3:
                f = np.array([np.mean([p[0] for p in near]) + 0.5, np.mean([p[1] for p in near]) + 0.5])
            else:
                f = body
            d = hc - f
            n = np.linalg.norm(d)
            if n < 0.5:
                continue
            v = d / n
            T = np.zeros(cl.shape, bool)
            ax[r][c] = dict(v=v, gp=hc, butt=hc - v * 3, tip=hc + v * 12, L=15.0, f=1.0, fg=1.0, side=1.0, T=T, pewna=True, punch=True)
    return ax


def render_punch(kind, img, lab, ax):
    """sztylet w pięści: od chwytu wzdłuż przedramienia; przed ciałem (pięść jest przed nim), dłoń przed sztyletem"""
    K = KINDS[kind]
    H, W = lab.shape
    out = np.zeros((H, W, 4), np.uint8)
    for r, row in enumerate(ax):
        for c, a in enumerate(row):
            if not a:
                continue
            y0, x0 = r * CELL, c * CELL
            v = a['v']
            n = np.array([-v[1], v[0]])
            base = a['gp'] - v * K['GRIP']
            cl = lab[y0:y0 + CELL, x0:x0 + CELL]
            cls = {}
            for yy in range(CELL):
                for xx in range(CELL):
                    px, py = xx + 0.5 - base[0], yy + 0.5 - base[1]
                    sa = px * v[0] + py * v[1]
                    if sa < -3 or sa > K['LEN'] + 3:
                        continue
                    pp = K['part'](sa, px * n[0] + py * n[1], K['LEN'], 1.0)
                    if pp:
                        cls[(yy, xx)] = pp
            for (yy, xx) in list(cls.keys()):
                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    q = (yy + dy, xx + dx)
                    if 0 <= q[0] < CELL and 0 <= q[1] < CELL and q not in cls:
                        cls[q] = ('k', 0)
            for (yy, xx), (k, tone) in cls.items():
                if cl[yy, xx] == H_:
                    continue
                out[y0 + yy, x0 + xx, :3] = tpl(k, tone)
                out[y0 + yy, x0 + xx, 3] = 255
    return out


def native_template(img, ax, name):
    """własna broń arkusza przełożona na szablon: kontur, metal (szare, białe), drewno (reszta); pałka: gruby koniec = metal"""
    H, W = img.shape[:2]
    rows, cols = H // CELL, W // CELL
    out = np.zeros((H, W, 4), np.uint8)
    for r in range(rows):
        for c in range(cols):
            a = ax[r][c]
            if not a:
                continue
            y0, x0 = r * CELL, c * CELL
            ys, xs = np.nonzero(a['T'])
            rgb = img[y0 + ys, x0 + xs, :3].astype(float) / 255
            h, s, v = hsv(rgb)
            lum = 0.299 * rgb[:, 0] + 0.587 * rgb[:, 1] + 0.114 * rgb[:, 2]
            st = (xs + 0.5 - a['butt'][0]) * a['v'][0] + (ys + 0.5 - a['butt'][1]) * a['v'][1]
            for i in range(len(ys)):
                if v[i] <= 0.14:
                    col = KONTUR
                elif (s[i] < 0.16 and v[i] >= 0.28) or v[i] > 0.88 or (name == 'Hero_Club' and st[i] > 0.45 * a['L']):
                    t = max(0, min(1, (lum[i] - 0.18) / 0.68))
                    col = tpl('m', int(round(t * 6)))
                else:
                    t = max(0, min(1, (lum[i] - 0.12) / 0.42))
                    col = tpl('w', int(round(t * 4)))
                out[y0 + ys[i], x0 + xs[i], :3] = col
                out[y0 + ys[i], x0 + xs[i], 3] = 255
    return out


# --------------------------------------------------------------------------- preview: a sample material over the sheet
RAMPS = {
    'm': [(27, 29, 32), (44, 47, 51), (64, 68, 74), (86, 91, 98), (110, 116, 123), (136, 142, 149), (164, 169, 174)],
    'w': [(36, 22, 12), (58, 36, 20), (82, 52, 29), (106, 69, 39), (131, 88, 51)],
    'a': [(42, 26, 16), (66, 42, 26), (92, 62, 40), (122, 86, 56)],
}


def colorize(tplimg):
    out = tplimg.copy()
    r, g, b, a = [tplimg[:, :, i].astype(int) for i in range(4)]
    for y, x in zip(*np.nonzero(a > 0)):
        R, G, B = r[y, x], g[y, x], b[y, x]
        if R < 20 and G < 20 and B < 20:
            continue
        if abs(R - G) < 8 and abs(G - B) < 8:
            col = RAMPS['m'][GREY.index(min(GREY, key=lambda q: abs(q - R)))]
        elif G > R:
            col = RAMPS['w'][WOOD.index(min(WOOD, key=lambda q: abs(q - G)))]
        else:
            col = RAMPS['a'][ACC.index(min(ACC, key=lambda q: abs(q - R)))]
        out[y, x, :3] = col
    return out


def preview(name, img, lab, ax, cimg, tpls, path):
    H, W = lab.shape
    rows, cols = H // CELL, W // CELL
    lines = [('oryginał', img), ('bez broni', cimg)] + [(k, None) for k in tpls]
    S = 2
    big = Image.new('RGBA', (W * S, H * S * len(lines)), (86, 110, 76, 255))
    for i, (k, im) in enumerate(lines):
        if im is None:
            base = Image.fromarray(cimg)
            base.alpha_composite(Image.fromarray(colorize(tpls[k])))
            im = np.array(base)
        big.alpha_composite(Image.fromarray(im).resize((W * S, H * S), Image.NEAREST), (0, i * H * S))
    d = ImageDraw.Draw(big)
    for r in range(rows):
        for c in range(cols):
            a = ax[r][c]
            if not a:
                continue
            ox, oy = c * CELL, r * CELL
            col = (255, 255, 0, 255) if a.get('pewna') else (255, 120, 0, 255)
            p0, p1 = a['butt'], a['tip']
            d.line([((ox + p0[0]) * S, (oy + p0[1]) * S), ((ox + p1[0]) * S, (oy + p1[1]) * S)], fill=col, width=1)
            if a['gp'] is not None:
                g = a['gp']
                d.ellipse([((ox + g[0]) * S - 3, (oy + g[1]) * S - 3), ((ox + g[0]) * S + 3, (oy + g[1]) * S + 3)], outline=(0, 255, 255, 255))
            d.text((ox * S + 2, oy * S + 2), '%d%s' % (c, '' if a.get('pewna') else '?'), fill=(255, 255, 255, 255))
    big.save(path)


def save(arr, name):
    Image.fromarray(arr, 'RGBA').save(os.path.join(SYS, name + '.png'), optimize=True)


def main(argv):
    names = [a for a in argv if a in ARKUSZE or a == PIESC] or list(ARKUSZE) + [PIESC]
    pv = argv[argv.index('--podglad') + 1] if '--podglad' in argv else None
    if PIESC in names:
        names.remove(PIESC)
        img, lab = load(PIESC)
        ax = punch_axes(img, lab)
        t = render_punch('sztylet', img, lab, ax)
        save(t, 'Ubior_Bron_Punch_Sztylet')
        print('%s: klatki ze sztyletem %d' % (PIESC, sum(1 for row in ax for a in row if a)))
        if pv:
            os.makedirs(pv, exist_ok=True)
            preview(PIESC, img, lab, ax, img, {'sztylet': t}, os.path.join(pv, PIESC + '_bron.png'))
    for name in names:
        img, lab, ax, Lref = analyse(name)
        cimg, clab = clean(img, lab, ax)
        short = name.replace('Hero_', '')
        save(cimg, 'Ubior_BezBroni_' + name)
        save(mask_image(clab), 'Ubior_Maska_BezBroni_' + name)
        tpls = {}
        own = ARKUSZE[name]['wlasna']
        tpls[own] = native_template(img, ax, name)
        for kind in ARKUSZE[name]['nowe']:
            tpls[kind] = render_kind(name, kind, img, lab, cimg, clab, ax, Lref)
        for kind, t in tpls.items():
            save(t, 'Ubior_Bron_' + short + '_' + kind[0].upper() + kind[1:])
        n = sum(1 for row in ax for a in row if a)
        unsure = sum(1 for row in ax for a in row if a and not a.get('pewna'))
        print('%s: klatki z bronią %d, z sąsiadów %d, długość %.1f px; rodzaje: %s' % (name, n, unsure, Lref, ', '.join(tpls)))
        if pv:
            os.makedirs(pv, exist_ok=True)
            preview(name, img, lab, ax, cimg, tpls, os.path.join(pv, name + '_bron.png'))


if __name__ == '__main__':
    main(sys.argv[1:])
