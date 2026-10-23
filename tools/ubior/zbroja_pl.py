# tools/ubior/zbroja_pl.py - zbroja i hełmy z PixelLab na wszystkich arkuszach bohatera (próba 2026-10-23).
#
# Wejście: obroty (8 kierunków) stanów postaci PixelLab z założoną zbroją (tools/ubior/pixellab/<zestaw>/<kierunek>.png - ta sama
# postać "Wiesniak I pro", create_character_state) i zwykłe obroty bohatera (= kolumna 0 img/characters/Hero_Walk.png) z jego maską
# części ciała (img/system/Ubior_Maska_Hero_Walk.png, tools/ubior/maski.py).
#
#   1. Stan nakłada się na obrót bazowy (przesunięcie, przy którym najwięcej pikseli się zgadza - twarz, nogi).
#   2. Każdy piksel stanu dostaje część ciała: w sylwetce bazowej - część z maski (głowa, tułów, przedramię, łydka, stopa), poza nią
#      (naramienniki, dół kolczugi, rondo kapalinu) - najbliższą. Piksele różne od bazy = zbroja tej części.
#   3. Na każdą klatkę każdego arkusza (chód, bieg, skradanie, pochodnia, wszystkie zamachy, siedzenie, leżenie, przewrót) zbroja
#      przechodzi część po części z pozy stojącej (obrotu tego kierunku; arkusze 4-wierszowe: dół = S, lewo = W, prawo = E, góra = N)
#      na pozę klatki: tułów wg osi pas -> głowa, przedramię wg osi dłoń -> łokieć, łydka i stopa wg osi podeszwa -> kolano
#      (przesunięcie + obrót + skala wzdłuż osi). Każdy piksel części w klatce bierze kolor zbroi z miejsca, na które pada w pozie
#      stojącej (zachodzi też 1-2 px poza sylwetkę klatki - naramienniki, dół kolczugi, cholewy), a cieniowanie klatki (jaśniej /
#      ciemniej niż ten sam punkt w pozie stojącej) przesuwa kolor po palecie zbroi. Piksele części bez źródła (rękaw ręki uniesionej
#      nad głowę) biorą kolor najbliższego piksela zbroi o tej samej parzystości (wzór kolczugi się nie rozmywa). Broń / narzędzie,
#      dłonie, twarz zostają na wierzchu; brzeg nowej sylwetki dostaje kontur.
#   4. Wynik: warstwa na arkusz (img/system/Ubior_PL_<Rodzaj>_<arkusz>.png, tej samej wielkości co arkusz, kolory PixelLab), także na
#      arkusze bez broni (Ubior_BezBroni_*: pod nową broń z Ubior_Bron.js). Hełm / kaptur nie idzie w warstwę: to obrazek 8 widoków
#      (img/system/Ubior_HelmPL_<Rodzaj>.png: 255 - hełm, 64 - "okno": włosy klatki zostają, 0 - włosy klatki znikają), który
#      Ubior.js kładzie na górze włosów w każdej klatce jak dotychczasowe hełmy (pasek nad głową, obrót leżąc). Ubior.js: materiały
#      inne niż natywny = przemalowanie palety (rampy MATERIALY, zakresy jasności z --palety).
#
#   python tools/ubior/zbroja_pl.py                         -> wszystkie rodzaje, wszystkie arkusze (+ hełmy)
#   python tools/ubior/zbroja_pl.py --rodzaj skorznia Hero_Walk Hero_Axe
#   python tools/ubior/zbroja_pl.py --podglad KATALOG       -> do tego podglądy (arkusz | z zbroją, x2)
#   python tools/ubior/zbroja_pl.py --odniesienie KATALOG   -> tylko obroty: baza, stan, części, zbroja rodzajów (kontrola kroku 1-2)
#   python tools/ubior/zbroja_pl.py --palety                -> zakresy jasności rodzin kolorów (do tabeli PL w Ubior.js)
import sys, os, json, math, time
from collections import deque
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import maski as MK   # noqa: E402

GAME = MK.GAME
SYS = os.path.join(GAME, 'img', 'system')
PL = os.path.join(HERE, 'pixellab')
KOD = MK.KOD
DIRS = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east']   # = wiersze Hero_Walk
W8 = MK.W8
ROW_OF = {k: i for i, k in enumerate(DIRS)}
DIR_OF = dict(zip(W8, DIRS))   # S -> south ...
PAD = 16              # obrót 64x64 leży w płótnie odniesienia 96x96 od (16, 16) - zbroja może wystawać ponad / obok
REF = 64 + 2 * PAD

# części maski -> grupy (rodzaje zbroi)
G_HEAD, G_TORSO, G_ARM, G_LEG, G_FOOT = 1, 2, 3, 4, 5
GROUP_OF = {KOD['wlosy']: G_HEAD, KOD['kontur_wlosow']: G_HEAD, KOD['oczy_usta']: G_HEAD, KOD['twarz_szyja']: G_HEAD,
            KOD['koszula']: G_TORSO, KOD['kontur_koszuli']: G_TORSO, KOD['pas']: G_TORSO,
            KOD['dlonie']: G_ARM, KOD['spodnie']: G_LEG, KOD['stopy']: G_FOOT, KOD['kontur_stop']: G_FOOT}
HAIR = (KOD['wlosy'], KOD['kontur_wlosow'])
FACE = (KOD['twarz_szyja'], KOD['oczy_usta'])

# zestawy (stany PixelLab) i rodzaje z nich wycinane: grupa, plik, spodnica: dół kolczugi na udach
ZESTAWY = {
    'skora': dict(stan='b12a1a58-ad83-4b2c-a739-42a91bf96f63', nazwa='Zbroja skorzana'),
    'zelazo': dict(stan='27a409ea-121d-446a-bdee-ef8a42ea8a25', nazwa='Zbroja zelazna'),
    # (2026-10-23, drugi etap: reszta rodzajów)
    'przeszywanica': dict(stan='3a5332ce-96d3-4b76-a65a-6ddda5047594', nazwa='Przeszywanica'),
    'luska': dict(stan='23a34d61-a805-4c6b-96b0-3eb5e8b88c59', nazwa='Luska'),
    'napiersnik': dict(stan='7299a467-558a-4987-900d-e5c08221712e', nazwa='Napiersnik'),
    'zakonny': dict(stan='c2d16ef1-6fef-4949-8dad-27f0acdb86c8', nazwa='Helm zakonny'),
    'czepiec_kolczy': dict(stan='7d735706-f6f2-4418-872e-98ef2fe12d5c', nazwa='Czepiec kolczy'),
}
RODZAJE = {
    'kaptur': dict(zestaw='skora', grupa=G_HEAD, plik='Kaptur'),
    'skorznia': dict(zestaw='skora', grupa=G_TORSO, plik='Skorznia'),
    'karwasze': dict(zestaw='skora', grupa=G_ARM, plik='Karwasze'),
    'kapalin': dict(zestaw='zelazo', grupa=G_HEAD, plik='Kapalin'),
    'kolczuga': dict(zestaw='zelazo', grupa=G_TORSO, plik='Kolczuga', spodnica=True),
    'nagolenniki': dict(zestaw='zelazo', grupa=G_LEG, plik='Nagolenniki'),
    'buty': dict(zestaw='zelazo', grupa=G_FOOT, plik='Buty'),
    'czepiec': dict(zestaw='przeszywanica', grupa=G_HEAD, plik='Czepiec'),
    'przeszywanica': dict(zestaw='przeszywanica', grupa=G_TORSO, plik='Przeszywanica'),
    'nosal': dict(zestaw='luska', grupa=G_HEAD, plik='Nosal'),
    'luska': dict(zestaw='luska', grupa=G_TORSO, plik='Luska'),
    'otwarty': dict(zestaw='napiersnik', grupa=G_HEAD, plik='Otwarty'),
    # (napierśnik leży na tunice: piksele tuniki stanu - poza płytą - idą z alfą 254: gra nie przemalowuje ich materiałem)
    'napiersnik': dict(zestaw='napiersnik', grupa=G_TORSO, plik='Napiersnik', na_tunice=True),
    # (hełm zakonny zasłania całą twarz: na twarzy wszystko, co nie jest skórą - też ciemna szczelina wzroku i otwory)
    'zakonny': dict(zestaw='zakonny', grupa=G_HEAD, plik='Zakonny', twarz=True),
    'czepiec_kolczy': dict(zestaw='czepiec_kolczy', grupa=G_HEAD, plik='CzepiecKolczy'),
}
WARSTWY = [r for r, R in RODZAJE.items() if R['grupa'] != G_HEAD]
HELMY = [r for r, R in RODZAJE.items() if R['grupa'] == G_HEAD]
CHANGED = 34          # odległość koloru (suma |dR|+|dG|+|dB|), od której piksel stanu to "zmieniony" (zbroja)
NEAR_SKIN = 30        # ... do najbliższego koloru skóry bazy: tyle - to wciąż skóra (twarz, dłoń narysowane od nowa)
RING = {G_TORSO: 2, G_ARM: 1, G_LEG: 1, G_FOOT: 1}   # o ile px zbroja może wyjść poza sylwetkę klatki
SHADE = 0.7           # ile cieniowania klatki (różnica jasności klatki i pozy stojącej w tym miejscu) przechodzi na zbroję
OUT_DARK = 0.09       # jasność konturu

# arkusze: maski.ARKUSZE + arkusze bez broni (Ubior_Bron.js: pod nowy rodzaj broni)
BEZ_BRONI = ['Club', 'Axe', 'AxeSide', 'Pick', 'Spear', 'Sword']
PART_COLOURS = {tuple(c): k for k, _, c in MK.CZESCI}


def load_rgba(path):
    return np.array(Image.open(path).convert('RGBA'))


def labels_of(mask_rgba):
    H, W = mask_rgba.shape[:2]
    lab = np.zeros((H, W), np.uint8)
    rgb = mask_rgba[:, :, :3]
    a = mask_rgba[:, :, 3] > 0
    for c, k in PART_COLOURS.items():
        lab[a & (rgb[:, :, 0] == c[0]) & (rgb[:, :, 1] == c[1]) & (rgb[:, :, 2] == c[2])] = k
    lab[a & (lab == 0)] = KOD['inne']
    return lab


def luma(rgb):
    rgb = np.asarray(rgb, float)
    return (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]) / 255.0


def warm_of(rgb):
    """rodzina koloru: ciepły (skóra, brąz, rdza) albo szary (metal, kolczuga)"""
    rgb = np.asarray(rgb, float)
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    return (sat >= 0.18) & (rgb[..., 0] >= rgb[..., 2])


N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def nearest_fill(lab, valid):
    """etykieta najbliższego piksela z valid (BFS, 8-sąsiedztwo) dla każdego piksela płótna; i odległość"""
    H, W = lab.shape
    out = np.where(valid, lab, 0).astype(np.int32)
    dist = np.where(valid, 0, -1).astype(np.int32)
    q = deque(zip(*np.nonzero(valid)))
    while q:
        y, x = q.popleft()
        for dy, dx in N8:
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and dist[yy, xx] < 0:
                dist[yy, xx] = dist[y, x] + 1
                out[yy, xx] = out[y, x]
                q.append((yy, xx))
    return out, dist


def nearest_index(valid):
    """dla każdego piksela płótna: (y, x) najbliższego piksela valid (BFS, 8-sąsiedztwo); -1 gdy brak"""
    H, W = valid.shape
    ny = np.full((H, W), -1, np.int32)
    nx = np.full((H, W), -1, np.int32)
    q = deque()
    for y, x in zip(*np.nonzero(valid)):
        ny[y, x], nx[y, x] = y, x
        q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in N8:
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and ny[yy, xx] < 0:
                ny[yy, xx], nx[yy, xx] = ny[y, x], nx[y, x]
                q.append((yy, xx))
    return ny, nx


def labelled_geodesic(m, seeds):
    """wielu źródeł naraz: seeds - lista masek; każdy piksel m dostaje numer najbliższego (1..n) i odległość wewnątrz m"""
    H, W = m.shape
    lab = np.zeros((H, W), np.int32)
    d = np.full((H, W), -1, np.int32)
    q = deque()
    for k, s in enumerate(seeds, 1):
        for y, x in zip(*np.nonzero(s)):
            lab[y, x], d[y, x] = k, 0
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in N8:
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and d[yy, xx] < 0:
                d[yy, xx] = d[y, x] + 1
                lab[yy, xx] = lab[y, x]
                q.append((yy, xx))
    return lab, d


def dilate(m, r=1):
    out = m.copy()
    for _ in range(r):
        o = out.copy()
        for dy, dx in N8:
            o |= MK.shift(out, dy, dx)
        out = o
    return out


def centroid(m):
    ys, xs = np.nonzero(m)
    return np.array([xs.mean(), ys.mean()]) if len(ys) else None


def unit(v):
    n = math.hypot(v[0], v[1]) or 1.0
    return np.array([v[0] / n, v[1] / n])


def perp(u):
    return np.array([-u[1], u[0]])


# ---------------------------------------------------------------- poza: grupy, oś tułowia, ręce, nogi (klatka albo obrót bazowy)
class Pose:
    def __init__(self, lab, neck=False):
        self.lab = lab
        H, W = lab.shape
        G = np.zeros((H, W), np.uint8)
        for k, gr in GROUP_OF.items():
            G[lab == k] = gr
        self.ok = False
        self.G = G
        head, tors = G == G_HEAD, G == G_TORSO
        if head.sum() < 6 or tors.sum() < 6:
            return
        hc, tc = centroid(head), centroid(tors)
        up = unit(hc - tc)
        if up[1] < -0.82:
            up = np.array([0.0, -1.0])
        YY, XX = np.mgrid[0:H, 0:W]
        down = (XX - hc[0]) * -up[0] + (YY - hc[1]) * -up[1]
        # (poza stojąca) szyja - twarz / szyja dalej niż 4 px pod oczami i ustami, tyłem: pod włosami - to tułów: kołnierz zbroi.
        # W klatkach nie: z boku oczy bywają jedynym znakiem twarzy i "szyja" zjadłaby pół twarzy
        if neck:
            eyes = lab == KOD['oczy_usta']
            hair = np.isin(lab, HAIR)
            face = lab == KOD['twarz_szyja']
            lim = down[eyes].max() + 4 if eyes.sum() >= 2 else (down[hair].max() + 0.5 if hair.any() else 1e9)
            G[face & (down > lim)] = G_TORSO
        # skóra: przedramię (spójne z dłonią) albo noga (kolano w dziurze nogawki); kontur: najbliższa grupa
        skin = lab == KOD['skora']
        if skin.any():
            comp, n = MK.components(skin | (lab == KOD['dlonie']))
            hands = set(np.unique(comp[lab == KOD['dlonie']]).tolist()) - {0}
            arm = np.isin(comp, list(hands)) if hands else np.zeros((H, W), bool)
            # (skóra bez dłoni nad środkiem tułowia - przedramię za trzonkiem - to też ręka; niżej: kolano w dziurze nogawki)
            arm |= skin & (down < (tc - hc) @ -up)
            G[skin & arm] = G_ARM
            G[skin & ~arm] = G_LEG
        other = (lab > 0) & (G == 0) & (lab != KOD['narzedzie']) & (lab != KOD['inne'])
        if other.any():
            near, _ = nearest_fill(G, G > 0)
            G[other] = near[other]
        self.G = G
        head, tors = G == G_HEAD, G == G_TORSO
        hc, tc = centroid(head), centroid(tors)
        self.hc, self.tc = hc, tc
        # biodro: środek górnych 3 wierszy nogawek wzdłuż osi (pas bywa schowany za ręką, nogawki są w każdej klatce)
        legs = lab == KOD['spodnie']
        if legs.sum() >= 6:
            top = np.percentile(down[legs], 3)
            self.belt = centroid(legs & (down <= top + 2))
        else:
            self.belt = None
        self.up, self.down = up, down
        self.ok = True
        self.arms = self._arms()
        self.legs = self._legs()

    def torso(self, use_belt):
        a = self.belt if use_belt else self.tc
        u = unit(self.hc - a)
        return dict(a=a, u=u, L=max(2.0, math.hypot(*(self.hc - a))))

    def side(self, p, tor):
        return float((p - tor['a']) @ perp(tor['u']))

    def _arms(self):
        G, lab = self.G, self.lab
        comp, n = MK.components(G == G_ARM)
        out = []
        for i in range(1, n + 1):
            m = comp == i
            hm = m & (lab == KOD['dlonie'])
            if hm.sum() < 2 or m.sum() < 4:
                continue
            d = MK.geodesic(m, hm)
            dmax = int(d.max())
            far = m & (d >= max(1, int(math.ceil(dmax * 0.6))))
            if dmax < 1 or not far.any():
                continue
            h, e = centroid(hm), centroid(far)
            L = math.hypot(*(e - h))
            if L < 1.5:
                continue
            out.append(dict(mask=m, a=h, u=unit(e - h), L=L))
        return out

    def _legs(self):
        G = self.G
        footm = G == G_FOOT
        comp, n = MK.components(footm)
        blobs = [comp == i for i in range(1, n + 1) if (comp == i).sum() >= 4]
        if not blobs:
            return []
        lower = (G == G_LEG) | (G == G_FOOT)
        lab, d = labelled_geodesic(lower, blobs)
        out = []
        for k, bm in enumerate(blobs, 1):
            dn = self.down[bm]
            sole = bm & (self.down >= dn.max() - 1)
            s = centroid(sole)
            reg = lab == k
            mid = reg & (d >= 6) & (d <= 12)
            kn = centroid(mid) if mid.sum() >= 3 else centroid(reg)
            ax = kn - s
            L = math.hypot(*ax)
            u = unit(ax) if L >= 2 else self.up
            out.append(dict(mask=reg, foot=bm, a=s, u=u, L=max(L, 2.0)))
        return out


def limb_map(pts, src, dst, scale=True):
    """punkty klatki (N x 2: x, y) -> punkty pozy stojącej; a: współrzędna wzdłuż osi (w skali pozy stojącej)"""
    d = pts - src['a']
    a = d @ src['u']
    b = d @ perp(src['u'])
    s = min(1.33, max(0.75, dst['L'] / src['L'])) if scale else 1.0
    a = a * s
    q = dst['a'][None, :] + a[:, None] * dst['u'][None, :] + b[:, None] * perp(dst['u'])[None, :]
    return q, a


# ---------------------------------------------------------------- odniesienie: obrót bazowy + stan
_walk = {}


def base_rotation(d):
    if not _walk:
        _walk['img'] = load_rgba(os.path.join(GAME, 'img', 'characters', 'Hero_Walk.png'))
        _walk['lab'] = labels_of(load_rgba(os.path.join(SYS, 'Ubior_Maska_Hero_Walk.png')))
    r = ROW_OF[d]
    return _walk['img'][r * 64:(r + 1) * 64, :64], _walk['lab'][r * 64:(r + 1) * 64, :64]


def align_state(B, S):
    """przesunięcie (ox, oy) obrazka stanu w płótnie odniesienia: najwięcej pikseli prawie równych bazie (twarz, nogi, włosy)"""
    Bp = np.zeros((REF, REF, 4), np.uint8)
    Bp[PAD:PAD + 64, PAD:PAD + 64] = B
    h, w = S.shape[:2]
    ab = Bp[:, :, 3] > 0
    ys, xs = np.nonzero(S[:, :, 3] > 0)
    yb, xb = np.nonzero(ab)
    oy0 = int(yb.max() - ys.max())
    ox0 = int(round((xb.min() + xb.max()) / 2 - (xs.min() + xs.max()) / 2))
    best = None
    for oy in range(oy0 - 4, oy0 + 5):
        for ox in range(ox0 - 6, ox0 + 7):
            if ox < 0 or oy < 0 or ox + w > REF or oy + h > REF:
                continue
            Sp = np.zeros((REF, REF, 4), np.uint8)
            Sp[oy:oy + h, ox:ox + w] = S
            both = ab & (Sp[:, :, 3] > 0)
            dist = np.abs(Bp[:, :, :3].astype(int) - Sp[:, :, :3].astype(int)).sum(2)
            score = int((both & (dist < 12)).sum())
            if best is None or score > best[0]:
                best = (score, ox, oy)
    return best[1], best[2], best[0]


_skin = {}


def skin_palette():
    """kolory skóry bohatera (twarz, dłonie, stopy, przedramiona) ze wszystkich obrotów"""
    if 'p' not in _skin:
        cols = []
        for d in DIRS:
            B, L = base_rotation(d)
            sel = np.isin(L, (KOD['twarz_szyja'], KOD['oczy_usta'], KOD['dlonie'], KOD['stopy'], KOD['skora']))
            cols.append(B[sel][:, :3].astype(int))
        p = np.unique(np.concatenate(cols), axis=0)
        # (tylko jasne, ciepłe: w części "skóra" maski bywają brązy nogawek przy dziurach)
        _skin['p'] = p[(p.max(1) >= 140) & (p[:, 0] > p[:, 1]) & (p[:, 1] >= p[:, 2])]
    return _skin['p']


_face = {}


def face_palette():
    """kolory twarzy bohatera (skóra twarzy, oczy, usta) ze wszystkich obrotów"""
    if 'p' not in _face:
        cols = []
        for d in DIRS:
            B, L = base_rotation(d)
            cols.append(B[np.isin(L, FACE)][:, :3].astype(int))
        _face['p'] = np.unique(np.concatenate(cols + [skin_palette()]), axis=0)
    return _face['p']


def near_palette(rgb, pal, lim):
    """rgb: N x 3 -> czy kolor jest najwyżej lim od któregoś z palety"""
    if not len(rgb):
        return np.zeros(0, bool)
    d = np.abs(rgb[:, None, :].astype(int) - pal[None, :, :]).sum(2).min(1)
    return d <= lim


class Ref:
    """jeden kierunek jednego zestawu w płótnie odniesienia: baza B, maska L, poza P (grupy), stan S, zmienione C, grupa piksela stanu GS"""

    def __init__(self, zestaw, d):
        B, L = base_rotation(d)
        S = load_rgba(os.path.join(PL, zestaw, d + '.png'))
        ox, oy, score = align_state(B, S)
        self.d, self.zestaw, self.shift, self.score = d, zestaw, (ox - PAD, oy - PAD), score
        self.B = np.zeros((REF, REF, 4), np.uint8); self.B[PAD:PAD + 64, PAD:PAD + 64] = B
        self.L = np.zeros((REF, REF), np.uint8); self.L[PAD:PAD + 64, PAD:PAD + 64] = L
        self.S = np.zeros((REF, REF, 4), np.uint8); self.S[oy:oy + S.shape[0], ox:ox + S.shape[1]] = S
        self.P = Pose(self.L, neck=True)
        G = self.P.G
        ab, as_ = self.B[:, :, 3] > 0, self.S[:, :, 3] > 0
        dist = np.abs(self.B[:, :, :3].astype(int) - self.S[:, :, :3].astype(int)).sum(2)
        self.C = as_ & (~ab | (dist > CHANGED))
        # skóra narysowana od nowa (twarz, dłonie): nie zbroja
        sk = np.zeros((REF, REF), bool)
        ys, xs = np.nonzero(as_)
        sk[ys, xs] = near_palette(self.S[ys, xs, :3], skin_palette(), NEAR_SKIN)
        self.skin = sk
        near, _ = nearest_fill(G, G > 0)
        self.GS = np.where(as_, np.where(G > 0, G, near), 0).astype(np.uint8)
        # wysokości nóg: ziemia (najniższa stopa), góra butów (3 wiersze nad ziemią), góra nagolenników (2 pod dołem tuniki)
        fy = np.nonzero(G == G_FOOT)[0]
        self.ground = int(fy.max()) if len(fy) else PAD + 61
        tor = np.nonzero(np.isin(self.L, (KOD['koszula'], KOD['kontur_koszuli'])))[0]
        self.hem = int(np.percentile(tor, 97)) if len(tor) else self.ground - 18
        self.boot_top = self.ground - 3
        self.greave_top = self.hem + 2
        self.segs = {}
        self.keep = {}

    def plate(self, seg):
        """płyta na tunice: zmienione piksele tułowia domknięte (2 x 3 x 3) i z wypełnionymi dziurami - stal napierśnika bywa tak
        szara jak tunika, więc sama różnica dziurawi płytę"""
        ch = seg & self.C & ~self.skin
        m = dilate(dilate(ch, 1), 1)
        m = ~dilate(~m, 1)
        m = ~dilate(~m, 1)
        m &= seg
        out = np.zeros_like(m)
        q = deque([(0, 0)])
        out[0, 0] = True
        while q:
            y, x = q.popleft()
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < REF and 0 <= xx < REF and not out[yy, xx] and not m[yy, xx]:
                    out[yy, xx] = True
                    q.append((yy, xx))
        return ~out & seg

    def segment(self, rodzaj):
        """piksele zbroi rodzaju (maska w płótnie odniesienia)"""
        if rodzaj in self.segs:
            return self.segs[rodzaj]
        R = RODZAJE[rodzaj]
        gr, GS, C = R['grupa'], self.GS, self.C
        ys = np.arange(REF)[:, None] * np.ones((1, REF), int)
        lower = (GS == G_LEG) | (GS == G_FOOT)
        seg = np.zeros((REF, REF), bool)
        if gr == G_TORSO:
            seg = (GS == G_TORSO) & (self.S[:, :, 3] > 0)
            if R.get('na_tunice'):
                self.keep[rodzaj] = seg & ~self.plate(seg)
            if R.get('spodnica'):
                seg |= C & lower & (ys < self.greave_top) & ~self.skin
        elif gr == G_ARM:
            seg = C & (GS == G_ARM) & ~self.skin
        elif gr == G_LEG:
            seg = C & lower & (ys >= self.greave_top) & (ys < self.boot_top) & ~self.skin
        elif gr == G_FOOT:
            seg = C & lower & (ys >= self.boot_top) & ~self.skin
        self.segs[rodzaj] = seg
        return seg

    def helmet(self, rodzaj):
        """obrazek hełmu w płótnie odniesienia: alfa 255 hełm, 64 okno (włosy klatki zostają), 0 reszta; i punkt zaczepienia"""
        L, S, C, GS = self.L, self.S, self.C, self.GS
        as_ = S[:, :, 3] > 0
        hairB = np.isin(L, HAIR)
        faceB = np.isin(L, FACE) & (self.P.G == G_HEAD)
        emptyB = L == 0
        out = np.zeros((REF, REF, 4), np.uint8)
        head = GS == G_HEAD
        # na włosach i poza sylwetką: wszystko, co zmienione (hełm, skóra czoła spod kaptura); niezmienione włosy - okno
        sel = head & as_ & (hairB | emptyB) & C
        out[sel] = S[sel]
        win = head & as_ & hairB & ~C
        out[win, :3] = S[win, :3]
        out[win, 3] = 64
        # na twarzy: to, co spójne z hełmem i w jego kolorach (boki kaptura przy policzkach, rzemień kapalinu) - nie twarz narysowana
        # od nowa (skóra, oczy, usta)
        solid = out[:, :, 3] == 255
        lum = luma(S[:, :, :3])
        hp = np.unique(S[solid & (lum > 0.10)][:, :3].astype(int), axis=0)
        # (i na szyi / ramionach do wiersza podbródka: boki kaptura przy żuchwie)
        ylim = int(np.nonzero(self.P.G == G_HEAD)[0].max())
        rows_ok = (np.arange(REF)[:, None] <= ylim) & np.ones((1, REF), bool)
        fy, fx = np.nonzero(as_ & C & ((head & faceB) | ((GS == G_TORSO) & rows_ok)))
        cand = np.zeros((REF, REF), bool)
        if len(fy) and len(hp):
            cand[fy, fx] = near_palette(S[fy, fx, :3], hp, 24) & (lum[fy, fx] > 0.10)
        grown = solid.copy()
        q = deque(zip(*np.nonzero(solid & (lum > 0.10))))
        while q:
            y, x = q.popleft()
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                yy, xx = y + dy, x + dx
                if cand[yy, xx] and not grown[yy, xx]:
                    grown[yy, xx] = True
                    q.append((yy, xx))
        sel = grown & ~solid
        if RODZAJE[rodzaj].get('twarz'):
            # (cała głowa w hełmie: żadnego okna - włosów spod niego nie widać; niezmienione ciemne piksele to też hełm)
            sel |= as_ & ~self.skin & (head | ((GS == G_TORSO) & rows_ok & C))
            out[:, :, 3] = np.where(out[:, :, 3] == 64, 0, out[:, :, 3])
        out[sel] = S[sel]
        # (kontur hełmu na twarzy i ciemne brzegi na włosach: ciemne piksele stanu przy pikselach hełmu - pełne, nie okno)
        solid = out[:, :, 3] == 255
        dark = head & as_ & (faceB | hairB) & (luma(S[:, :, :3]) <= 0.10) & dilate(solid, 1) & ((out[:, :, 3] == 64) | (faceB & C))
        out[dark, :3] = S[dark, :3]
        out[dark, 3] = 255
        # punkt zaczepienia = góra włosów bazy (jak Ubior.js cellsOf: pierwszy wiersz z 6+ pikselami włosów, środek 5 wierszy)
        rows = hairB.sum(1)
        top = int(np.nonzero(rows >= 6)[0][0]) if (rows >= 6).any() else int(np.nonzero(rows)[0][0])
        xs = np.nonzero(hairB[top:top + 5])[1]
        ax = int(round(xs.mean()))
        return out, (ax, top)


_refs = {}


def ref(zestaw, d):
    k = (zestaw, d)
    if k not in _refs:
        _refs[k] = Ref(zestaw, d)
    return _refs[k]


# ---------------------------------------------------------------- palety rodzajów (rodziny kolorów, jasność)
_pal = {}


def palette(rodzaj):
    if rodzaj in _pal:
        return _pal[rodzaj]
    z = RODZAJE[rodzaj]['zestaw']
    cols = []
    for d in DIRS:
        rf = ref(z, d)
        if RODZAJE[rodzaj]['grupa'] == G_HEAD:
            pic, _ = rf.helmet(rodzaj)
            sel = pic[:, :, 3] == 255
            cols.append(pic[sel][:, :3].astype(int))
        else:
            seg = rf.segment(rodzaj)
            if rodzaj in rf.keep:
                seg = seg & ~rf.keep[rodzaj]      # (tunika pod napierśnikiem nie liczy się do palety)
            cols.append(rf.S[seg][:, :3].astype(int))
    cols = np.concatenate(cols)
    u, n = np.unique(cols, axis=0, return_counts=True)
    lum = luma(u)
    warm = warm_of(u)
    fam = {}
    for name, sel in (('cieply', warm & (lum > OUT_DARK)), ('szary', ~warm & (lum > OUT_DARK))):
        cs, ls, ns = u[sel], lum[sel], n[sel]
        order = np.argsort(ls)
        cs, ls, ns = cs[order], ls[order], ns[order]
        if len(ls):
            rep = np.repeat(ls, ns)
            lo, hi = float(np.percentile(rep, 3)), float(np.percentile(rep, 97))
        else:
            lo = hi = 0.0
        fam[name] = dict(cols=cs, luma=ls, n=ns, lo=lo, hi=hi, count=int(ns.sum()))
    index = {}
    for name, f in fam.items():
        for i, c in enumerate(f['cols']):
            index[tuple(int(v) for v in c)] = (name, i)
    _pal[rodzaj] = dict(fam=fam, index=index)
    return _pal[rodzaj]


def shade_colour(pal, c, k):
    """kolor c przesunięty o k stopni po swojej rodzinie (posortowanej wg jasności)"""
    if not k:
        return c
    hit = pal['index'].get(tuple(int(v) for v in c))
    if not hit:
        return c
    f = pal['fam'][hit[0]]
    j = max(0, min(len(f['cols']) - 1, hit[1] + k))
    return f['cols'][j]


# ---------------------------------------------------------------- jedna klatka
def ref_instances(rf):
    P = rf.P
    return P


def match(frame_list, ref_list, ftor, rtor, Pf, Pr):
    """pary (instancja klatki, instancja pozy stojącej): ta sama strona ciała (odległość w poprzek osi tułowia)"""
    out = []
    if not ref_list:
        return out
    rs = [Pr.side(r['a'], rtor) for r in ref_list]
    for f in frame_list:
        s = Pf.side(f['a'], ftor)
        j = int(np.argmin([abs(s - x) for x in rs]))
        out.append((f, ref_list[j], j))
    return out


def seg_parts(rf, rodzaj):
    """zbroja rodzaju w pozie stojącej podzielona na instancje (tułów: jedna; ręce, nogi: każda osobno) z tym, co klatki z niej biorą:
    pas wzdłuż osi i najbliższe piksele (wg parzystości x, y) - liczone raz na kierunek"""
    key = '_parts_' + rodzaj
    if key in rf.__dict__:
        return rf.__dict__[key]
    gr = RODZAJE[rodzaj]['grupa']
    seg = rf.segment(rodzaj)
    P = rf.P
    if gr == G_TORSO:
        insts = [(None, seg)]
    else:
        lst = P.arms if gr == G_ARM else P.legs
        lab_r = np.zeros((REF, REF), np.int32)
        for j, r in enumerate(lst, 1):
            lab_r[r['mask']] = j
        near_r, _ = nearest_fill(lab_r, lab_r > 0) if lst else (lab_r, None)
        insts = [(r, seg & (near_r == j)) for j, r in enumerate(lst, 1)]
    YY, XX = np.mgrid[0:REF, 0:REF]
    out = []
    for r, s in insts:
        e = dict(inst=r, seg=s, any=bool(s.any()))
        if e['any']:
            e['near'] = nearest_index(s)
            e['par'] = {}
            for py in (0, 1):
                for px in (0, 1):
                    pm = s & ((YY & 1) == py) & ((XX & 1) == px)
                    e['par'][(py, px)] = nearest_index(pm) if pm.any() else e['near']
        out.append(e)
    rf.__dict__[key] = out
    return out


def fit_torso(Pf, rf):
    """tułów klatki -> tułów pozy stojącej: oś od środka tułowia do środka głowy, potem przesunięcie (do 5 px) i skala wzdłuż osi
    (0,8-1,2), przy których najwięcej pikseli tułowia klatki pada na tułów pozy stojącej (pas, rąbek, ręka przed brzuchem - żaden
    pojedynczy punkt nie jest pewny w każdej klatce)"""
    cache = Pf.__dict__.setdefault('_fits', {})
    key = (rf.zestaw, rf.d)
    if key in cache:
        return cache[key]
    fi = dict(a=Pf.hc, u=unit(Pf.hc - Pf.tc), L=max(2.0, math.hypot(*(Pf.hc - Pf.tc))))
    r0 = dict(a=rf.P.hc, u=unit(rf.P.hc - rf.P.tc), L=max(2.0, math.hypot(*(rf.P.hc - rf.P.tc))))
    ys, xs = np.nonzero(Pf.G == G_TORSO)
    pts = np.stack([xs, ys], 1).astype(float)
    tgt = rf.P.G == G_TORSO
    nt = int(tgt.sum())
    best = None
    for sc in (0.8, 0.87, 0.94, 1.0, 1.07, 1.14, 1.2):
        ri = dict(a=r0['a'], u=r0['u'], L=fi['L'] * sc)
        q, _ = limb_map(pts, fi, ri, True)
        for dy in range(-5, 6):
            for dx in range(-5, 6):
                qx = np.round(q[:, 0] + dx).astype(int)
                qy = np.round(q[:, 1] + dy).astype(int)
                ok = (qx >= 0) & (qy >= 0) & (qx < REF) & (qy < REF)
                hit = int(tgt[qy[ok], qx[ok]].sum())
                iou = hit / max(1, len(pts) + nt - hit)
                score = iou - 0.004 * (abs(dx) + abs(dy)) - 0.05 * abs(sc - 1)
                if best is None or score > best[0]:
                    best = (score, sc, dx, dy)
    _, sc, dx, dy = best
    ri = dict(a=r0['a'] + np.array([dx, dy], float), u=r0['u'], L=fi['L'] * sc)
    cache[key] = (fi, ri)
    return fi, ri


def paint_kind(rodzaj, img, lab, Pf, rf, out):
    """warstwa rodzaju na jedną klatkę: out (cell x cell x 4) - kolory zbroi; img, lab - klatka i jej maska"""
    R = RODZAJE[rodzaj]
    gr = R['grupa']
    if not Pf.ok or not rf.P.ok:
        return 0
    if gr != G_TORSO:
        return paint_limb(rodzaj, img, lab, Pf, rf, out)
    parts = seg_parts(rf, rodzaj)
    if not any(e['any'] for e in parts):
        return 0
    H, W = lab.shape
    S, B = rf.S, rf.B
    Gf = Pf.G
    opaque = img[:, :, 3] > 0
    pal = palette(rodzaj)
    ftor, rtor = fit_torso(Pf, rf)
    pairs = []          # (obszar w klatce, dopełniany obszar, instancja klatki, instancja pozy, jej zbroja, skala wzdłuż osi)
    if gr == G_TORSO:
        region = Gf == G_TORSO
        fill = region.copy()
        if R.get('spodnica'):
            region = region | ((Gf == G_LEG) & (lab != KOD['stopy']))
        pairs.append((region, fill, ftor, rtor, parts[0], True))
    else:
        lst = Pf.arms if gr == G_ARM else Pf.legs
        reflst = [e['inst'] for e in parts]
        for f, r, j in match(lst, reflst, ftor, rtor, Pf, rf.P):
            region = f['mask'] & (lab != KOD['dlonie']) if gr == G_ARM else f['mask']
            pairs.append((region, region, f, r, parts[j], gr != G_FOOT))
    painted = 0
    for region, fill, fi, ri, e, scale in pairs:
        if not e['any'] or not region.any():
            continue
        segi = e['seg']
        ring = dilate(region, RING[gr]) & ~opaque
        todo = region | ring
        ys, xs = np.nonzero(todo)
        pts = np.stack([xs, ys], 1).astype(float)
        q, a = limb_map(pts, fi, ri, scale)
        qx = np.clip(np.round(q[:, 0]).astype(int), 0, REF - 1)
        qy = np.clip(np.round(q[:, 1]).astype(int), 0, REF - 1)
        inside = (q[:, 0] >= -0.5) & (q[:, 0] < REF - 0.5) & (q[:, 1] >= -0.5) & (q[:, 1] < REF - 0.5)
        exact = inside & segi[qy, qx]
        # pas wzdłuż osi, w którym ta zbroja leży w pozie stojącej (tułów: cały)
        if 'band' not in e:
            sy, sx = np.nonzero(segi)
            sa = (np.stack([sx, sy], 1) - ri['a']) @ ri['u']
            e['band'] = (float(sa.min()), float(sa.max()))
        band = (a >= e['band'][0] - 0.5) & (a <= e['band'][1] + 0.5)
        if gr == G_TORSO:
            band[:] = True
        isring = ring[ys, xs]
        fr = img[ys, xs, :3]
        dark = luma(fr) <= OUT_DARK
        dofill = ~exact & ~isring & fill[ys, xs] & ~dark & band
        # najbliższy piksel zbroi o tej samej parzystości (x, y) co źródło: wzór (kolczuga, nity) się nie rozmywa
        fy_, fx_ = qy.copy(), qx.copy()
        if dofill.any():
            for (py, px), (my, mx) in e['par'].items():
                sel = dofill & ((qy & 1) == py) & ((qx & 1) == px)
                if sel.any():
                    fy_[sel], fx_[sel] = my[qy[sel], qx[sel]], mx[qy[sel], qx[sel]]
        use = exact | dofill
        if not use.any():
            continue
        sy_, sx_ = np.where(exact, qy, fy_), np.where(exact, qx, fx_)
        keep = rf.keep.get(rodzaj)
        kept = keep[sy_, sx_] if keep is not None else np.zeros(len(sy_), bool)
        col = S[sy_, sx_, :3].astype(int)
        # cieniowanie klatki: jaśniej / ciemniej niż ten sam punkt w pozie stojącej (wygładzone 3 x 3, tylko na ciele)
        bsrc = B[sy_, sx_]
        lf, lb = luma(fr), luma(bsrc[:, :3])
        okd = use & ~isring & ~dark & (bsrc[:, 3] > 0) & (lb > OUT_DARK)
        grid = np.full((H, W), np.nan)
        grid[ys[okd], xs[okd]] = (lf - lb)[okd]
        acc = np.zeros((H, W)); cnt = np.zeros((H, W))
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                sh = np.full((H, W), np.nan)
                y0, y1 = max(0, dy), H + min(0, dy)
                x0, x1 = max(0, dx), W + min(0, dx)
                sh[y0:y1, x0:x1] = grid[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
                ok = ~np.isnan(sh)
                acc[ok] += sh[ok]; cnt[ok] += 1
        sm = np.where(cnt > 0, acc / np.maximum(cnt, 1), 0)[ys, xs]
        for i in np.nonzero(use)[0]:
            c = col[i]
            if okd[i] and luma(c) > OUT_DARK:
                hit = pal['index'].get((int(c[0]), int(c[1]), int(c[2])))
                if hit:
                    f = pal['fam'][hit[0]]
                    step = (f['hi'] - f['lo']) / max(1, len(f['cols']) - 1) if f['hi'] > f['lo'] else 0.05
                    k = int(round(sm[i] * SHADE / max(step, 0.02)))
                    c = shade_colour(pal, c, max(-3, min(3, k)))
            out[ys[i], xs[i], :3] = c
            out[ys[i], xs[i], 3] = 254 if kept[i] else 255
            painted += 1
    return painted


# jasność piksela względem zwykłego zakresu jego części (cień 0 .. światło 1); kontur: -1
RANGE_OF = {KOD['koszula']: (0.26, 0.62), KOD['kontur_koszuli']: (0.26, 0.62), KOD['spodnie']: (0.12, 0.40), KOD['pas']: (0.19, 0.80),
            KOD['stopy']: (0.37, 0.86), KOD['kontur_stop']: (0.37, 0.86), KOD['skora']: (0.41, 0.86), KOD['dlonie']: (0.41, 0.86)}


def tnorm(rgb, lab):
    l = luma(rgb)
    lo = np.full(l.shape, 0.2)
    hi = np.full(l.shape, 0.8)
    for k, (a, b) in RANGE_OF.items():
        lo[lab == k], hi[lab == k] = a, b
    t = np.clip((l - lo) / (hi - lo), 0, 1)
    return np.where(l <= OUT_DARK, -1.0, t)


def limb_sources(P, gr):
    """źródła odległości wzdłuż kończyny: podeszwy (najniższe piksele każdej stopy) albo dłonie; i obszar, po którym się liczy"""
    if gr == G_ARM:
        return P.lab == KOD['dlonie'], P.G == G_ARM
    src = np.zeros(P.G.shape, bool)
    for l in P.legs:
        bm = l['foot']
        src |= bm & (P.down >= P.down[bm].max() - 1)
    return src, (P.G == G_LEG) | (P.G == G_FOOT)


def limb_ref(rf, rodzaj):
    """zbroja kończyny w pozie stojącej jako tabela: odległość od podeszwy / dłoni -> piksele (jasność względna, kolor)"""
    key = '_limb_' + rodzaj
    if key in rf.__dict__:
        return rf.__dict__[key]
    gr = RODZAJE[rodzaj]['grupa']
    seg = rf.segment(rodzaj)
    src, area = limb_sources(rf.P, gr)
    d = MK.geodesic(area | seg, src)
    full = MK.geodesic(area, src)
    ys, xs = np.nonzero(seg & (d >= 0))
    t = tnorm(rf.B[ys, xs, :3], rf.L[ys, xs])
    t = np.where(rf.B[ys, xs, 3] > 0, t, -2.0)        # (poza sylwetką bazy: brzeg zbroi)
    dark = luma(rf.S[ys, xs, :3]) <= OUT_DARK
    res = dict(h=d[ys, xs], t=t, dark=dark, col=rf.S[ys, xs, :3].astype(int), H=max(1, int(full.max())), any=len(ys) > 0)
    rf.__dict__[key] = res
    return res


def paint_limb(rodzaj, img, lab, Pf, rf, out):
    """przedramiona, łydki, stopy: każdy piksel kończyny w klatce bierze piksel zbroi pozy stojącej z tej samej odległości od
    podeszwy / dłoni (skala: długość kończyny) o najbliższej jasności względnej - cień i światło klatki wybierają odcień zbroi"""
    gr = RODZAJE[rodzaj]['grupa']
    R = limb_ref(rf, rodzaj)
    if not R['any']:
        return 0
    src, area = limb_sources(Pf, gr)
    if not src.any():
        return 0
    d = MK.geodesic(area, src)
    if gr == G_ARM:
        area = area & (lab != KOD['dlonie'])
    ys, xs = np.nonzero(area & (d >= 0))
    if not len(ys):
        return 0
    Hf = max(1, int(d.max()))
    s = min(1.4, max(0.75, R['H'] / Hf))
    h = np.round(d[ys, xs] * s).astype(int)
    t = tnorm(img[ys, xs, :3], lab[ys, xs])
    painted = 0
    rh, rt, rdark, rcol = R['h'], R['t'], R['dark'], R['col']
    rl = luma(rcol)
    for hv in np.unique(h):
        cand = rh == hv
        if not cand.any():
            continue
        here = np.nonzero(h == hv)[0]
        # kontur klatki: najciemniejszy piksel zbroi na tej wysokości
        k = np.nonzero(cand)[0]
        darkest = rcol[k[np.argmin(rl[k])]]
        for i in here[t[here] < 0]:
            out[ys[i], xs[i], :3] = darkest
            out[ys[i], xs[i], 3] = 255
            painted += 1
        # reszta: ten sam udział odcieni co w pozie stojącej na tej wysokości - najciemniejsze piksele klatki dostają najciemniejsze
        # piksele zbroi (cień i światło klatki wybierają odcień; skórzana cholewa i żelazny nosek zostają w swoich proporcjach)
        k = np.nonzero(cand & ~rdark)[0]
        body = here[t[here] >= 0]
        if not len(k) or not len(body):
            continue
        tt = np.where(rt[k] >= 0, rt[k], 0.5)
        if gr == G_FOOT:
            k = k[np.argsort(tt + rl[k] * 0.01)]
            order = body[np.argsort(t[body], kind='stable')]
            pick = [(i, k[min(len(k) - 1, int(n * len(k) / len(order)))]) for n, i in enumerate(order)]
        else:
            pick = [(i, k[np.argmin(np.abs(tt - t[i]))]) for i in body]
        for i, j in pick:
            out[ys[i], xs[i], :3] = rcol[j]
            out[ys[i], xs[i], 3] = 255
            painted += 1
    return painted


def outline_fix(out, img):
    """brzeg nowej sylwetki (zbroja wyszła poza klatkę albo zastąpiła jej kontur): piksel zbroi z pustym sąsiadem -> kontur"""
    a = out[:, :, 3] > 0
    if not a.any():
        return
    full = a | (img[:, :, 3] > 0)
    edge = np.zeros_like(a)
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        edge |= ~MK.shift(full, dy, dx)
    edge &= a
    # (brzeg klatki - shift wypełnia zerami - to nie brzeg sylwetki, gdy sylwetka dochodzi do krawędzi; zostawione)
    out[edge, :3] = (10, 9, 8)


# ---------------------------------------------------------------- arkusze
def sheet_files(name):
    """(obrazek, maska, komórka, kierunki wierszy) arkusza albo arkusza bez broni (BezBroni_Hero_Club)"""
    if name.startswith('BezBroni_'):
        base = name[len('BezBroni_'):]
        return (os.path.join(SYS, 'Ubior_BezBroni_%s.png' % base), os.path.join(SYS, 'Ubior_Maska_BezBroni_%s.png' % base), 96, MK.W4)
    a = MK.ARKUSZE[name]
    return (os.path.join(GAME, 'img', a['folder'], name + '.png'), os.path.join(SYS, 'Ubior_Maska_%s.png' % name), a['cell'], a['rows'])


def all_sheets():
    out = list(MK.ARKUSZE)
    for b in BEZ_BRONI:
        if os.path.exists(os.path.join(SYS, 'Ubior_BezBroni_Hero_%s.png' % b)):
            out.append('BezBroni_Hero_' + b)
    return out


def build_sheet(name, kinds, prev=None):
    ip, mp, cell, rows = sheet_files(name)
    if not os.path.exists(ip) or not os.path.exists(mp):
        print('  (brak %s / maski - pominięty)' % name)
        return
    img = load_rgba(ip)
    lab = labels_of(load_rgba(mp))
    H, W = lab.shape
    outs = {k: np.zeros((H, W, 4), np.uint8) for k in kinds}
    t0 = time.time()
    for r in range(H // cell):
        d = DIR_OF[rows[r]]
        for c in range(W // cell):
            sl = (slice(r * cell, (r + 1) * cell), slice(c * cell, (c + 1) * cell))
            ci, cl = img[sl], lab[sl]
            if not (ci[:, :, 3] > 0).any():
                continue
            Pf = Pose(cl)
            if not Pf.ok:
                continue
            for k in kinds:
                rf = ref(RODZAJE[k]['zestaw'], d)
                o = np.zeros((cell, cell, 4), np.uint8)
                paint_kind(k, ci, cl, Pf, rf, o)
                outline_fix(o, ci)
                outs[k][sl] = o
    for k in kinds:
        path = os.path.join(SYS, 'Ubior_PL_%s_%s.png' % (RODZAJE[k]['plik'], name))
        Image.fromarray(outs[k], 'RGBA').save(path, optimize=True)
    print('%-24s %s  %.1f s' % (name, ' '.join(kinds), time.time() - t0), flush=True)
    if prev:
        os.makedirs(prev, exist_ok=True)
        base = Image.new('RGBA', (W, H), (70, 110, 70, 255))
        base.alpha_composite(Image.fromarray(img, 'RGBA'))
        sets = []
        for grp in (['skorznia', 'karwasze'], ['kolczuga', 'nagolenniki', 'buty'], ['przeszywanica'], ['luska'], ['napiersnik']):
            if any(k in outs for k in grp):
                after = base.copy()
                for k in grp:
                    if k in outs:
                        after.alpha_composite(Image.fromarray(outs[k], 'RGBA'))
                sets.append(after)
        both = Image.new('RGBA', (W, H * (1 + len(sets)) + 4 * len(sets)), (30, 30, 30, 255))
        both.paste(base, (0, 0))
        for i, a in enumerate(sets):
            both.paste(a, (0, (H + 4) * (i + 1)))
        both.resize((both.width * 2, both.height * 2), Image.NEAREST).save(os.path.join(prev, 'pl_%s.png' % name))


# ---------------------------------------------------------------- hełmy: obrazek 8 widoków
def build_helmet(rodzaj):
    z = RODZAJE[rodzaj]['zestaw']
    pics, anchors = [], []
    for d in DIRS:
        pic, an = ref(z, d).helmet(rodzaj)
        pics.append(pic)
        anchors.append(an)
    # wspólna ramka wokół punktu zaczepienia
    x0 = y0 = 10 ** 6
    x1 = y1 = -10 ** 6
    for pic, (ax, ay) in zip(pics, anchors):
        ys, xs = np.nonzero(pic[:, :, 3])
        x0, x1 = min(x0, xs.min() - ax), max(x1, xs.max() - ax)
        y0, y1 = min(y0, ys.min() - ay), max(y1, ys.max() - ay)
    fw = int(x1 - x0 + 1 + 2)
    fh = int(y1 - y0 + 1 + 2)
    fw += fw & 1
    AX, AY = int(-x0 + 1), int(-y0 + 1)
    sheet = np.zeros((fh, fw * 8, 4), np.uint8)
    for i, (pic, (ax, ay)) in enumerate(zip(pics, anchors)):
        ys, xs = np.nonzero(pic[:, :, 3])
        sheet[ys - ay + AY, xs - ax + AX + i * fw] = pic[ys, xs]
    path = os.path.join(SYS, 'Ubior_HelmPL_%s.png' % RODZAJE[rodzaj]['plik'])
    Image.fromarray(sheet, 'RGBA').save(path, optimize=True)
    print('%-10s -> %s  ramka %dx%d, zaczepienie (%d, %d)' % (rodzaj, os.path.relpath(path, GAME).replace('\\', '/'), fw, fh, AX, AY))
    return dict(w=fw, h=fh, anchor=[AX, AY])


def palety():
    out = {}
    for r in RODZAJE:
        p = palette(r)
        out[r] = {k: dict(lo=round(f['lo'], 3), hi=round(f['hi'], 3), n=f['count'], kolorow=len(f['cols'])) for k, f in p['fam'].items()}
        print(r, json.dumps(out[r]))
    return out


def ref_preview(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    cols = {G_HEAD: (220, 60, 60), G_TORSO: (60, 160, 230), G_ARM: (240, 200, 40), G_LEG: (80, 200, 90), G_FOOT: (200, 90, 220)}
    for zestaw in ZESTAWY:
        rows = []
        for d in DIRS:
            rf = ref(zestaw, d)
            print(zestaw, d, 'przesunięcie', rf.shift, 'zgodnych', rf.score, 'ziemia', rf.ground, 'buty od', rf.boot_top,
                  'nagolenniki od', rf.greave_top)
            tiles = [rf.B, rf.S]
            g = np.zeros((REF, REF, 4), np.uint8)
            for k, c in cols.items():
                g[rf.GS == k, :3] = c
                g[rf.GS == k, 3] = 255
            tiles.append(g)
            for rodzaj, R in RODZAJE.items():
                if R['zestaw'] != zestaw:
                    continue
                if R['grupa'] == G_HEAD:
                    pic, (ax, ay) = rf.helmet(rodzaj)
                    t = pic.copy()
                    t[pic[:, :, 3] == 64] = (255, 0, 255, 255)
                    t[ay, ax] = (255, 255, 0, 255)
                else:
                    seg = rf.segment(rodzaj)
                    t = np.zeros((REF, REF, 4), np.uint8)
                    t[seg] = rf.S[seg]
                tiles.append(t)
            row = np.zeros((REF, REF * len(tiles), 4), np.uint8)
            row[:, :, :3] = (60, 90, 60); row[:, :, 3] = 255
            for i, t in enumerate(tiles):
                im = Image.fromarray(row[:, i * REF:(i + 1) * REF].copy(), 'RGBA')
                im.alpha_composite(Image.fromarray(t, 'RGBA'))
                row[:, i * REF:(i + 1) * REF] = np.array(im)
            rows.append(row)
        img = np.concatenate(rows, 0)
        Image.fromarray(img, 'RGBA').resize((img.shape[1] * 3, img.shape[0] * 3), Image.NEAREST).save(os.path.join(out_dir, 'odniesienie_%s.png' % zestaw))


def main(argv):
    if '--odniesienie' in argv:
        ref_preview(argv[argv.index('--odniesienie') + 1])
        return
    if '--palety' in argv:
        palety()
        return
    prev = None
    if '--podglad' in argv:
        i = argv.index('--podglad'); prev = argv[i + 1]; argv = argv[:i] + argv[i + 2:]
    kinds = list(RODZAJE)
    if '--rodzaj' in argv:
        i = argv.index('--rodzaj'); kinds = argv[i + 1].split(','); argv = argv[:i] + argv[i + 2:]
    names = argv or all_sheets()
    for k in kinds:
        if k in HELMY:
            build_helmet(k)
    lay = [k for k in kinds if k in WARSTWY]
    if lay:
        for name in names:
            build_sheet(name, lay, prev)


if __name__ == '__main__':
    main(sys.argv[1:])
