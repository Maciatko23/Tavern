# tools/ubior/bron_w_rece.py - broń w ręku na chodzie, biegu i skradaniu (js/plugins/Ubior_Bron.js, 2026-11-25).
#
# Gracz: „jak gracz wyciągnie broń, to nie widać, że trzyma ją w ręce, i podczas chodzenia i biegania również”. Na zamachach broń
# była (tools/ubior/bron.py), na chodzie (Hero_Walk / Hero_Run / Hero_Sneak: komórki 64, 8 wierszy kierunków) - nie. Tu, dla każdego
# rodzaju broni, szablon tej samej wielkości co arkusz (te same klasy kolorów co bron.py: szary metal, zielonkawe drewno, czerwonawa
# owijka, kontur), w każdej klatce:
#   - chwyt = dłoń z maski części (img/system/Ubior_Maska_<arkusz>.png, „dlonie”) - która dłoń: po kierunku wiersza (WIERSZE niżej),
#     klatka bez widocznej dłoni bierze miejsce z sąsiednich klatek wiersza;
#   - oś: broń w gotowości - głowicą / ostrzem w górę, lekko na zewnątrz (krótka broń), drzewcowa i kostur prawie pionowo, chwyt na
#     dole drzewca; lekkie kołysanie z ruchem ręki w cyklu;
#   - rysunek: profile rodzajów z bron.py (ta sama skala - postać na chodzie jest tak wysoka jak na zamachach) i własne dla broni,
#     które dotąd miały tylko starą grafikę (pałka, siekiera, kilof, włócznia);
#   - widoczność: przodem do nas (S, SW, SE, W, E) broń przed ciałem (nigdy na dłoni i na twarzy / włosach), tyłem (N, NW, NE) za
#     ciałem (tylko na tle).
# -> img/system/Ubior_Bron_<Walk|Run|Sneak>_<Rodzaj>.png
#
#   python tools/ubior/bron_w_rece.py [--podglad KATALOG] [rodzaj ...]
import sys, os, math
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bron
from maski import KOD, KOLOR

GAME = bron.GAME
SYS, CHARS = bron.SYS, os.path.join(GAME, 'img', 'characters')
CELL = 64
ARKUSZE = ['Hero_Walk', 'Hero_Run', 'Hero_Sneak']
# (2026-11-26) z zapaloną pochodnią: pochodnia w ręce, którą broń brała na zwykłych arkuszach - broń w DRUGIEJ, wolnej ręce (dłoń nie
# dotykająca pochodni - część „narzedzie” maski); z boku wolna ręka jest dalsza: broń za ciałem
POCHODNIA = ['Hero_TorchWalk', 'Hero_TorchRun', 'Hero_TorchSneak']
T_ = KOD['narzedzie']
ODWROT = {'lewa': 'prawa', 'prawa': 'lewa', 'wieksza': 'wieksza'}
ROWS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
H_ = KOD['dlonie']
HEAD = bron.HEAD

# wiersz -> (która dłoń: 'lewa' = najbardziej z lewej na ekranie, 'prawa', 'wieksza' = ta lepiej widoczna; strona, w którą broń
# się odchyla i w którą patrzy ostrze: -1 w lewo, +1 w prawo; przed ciałem?)
WIERSZE = {
    'S': ('lewa', -1, True), 'SW': ('lewa', -1, True), 'W': ('wieksza', -1, True), 'NW': ('lewa', -1, False),
    'N': ('prawa', 1, False), 'NE': ('prawa', 1, False), 'E': ('wieksza', 1, True), 'SE': ('prawa', 1, True),
}


# ---- profile broni, które dotąd były tylko starą grafiką arkusza
def p_palka(s, u, L, side):
    """pałka: drewniany drąg grubiejący ku górze, sęki"""
    if s < 0 or s > L:
        return None
    half = 0.9 + 1.7 * (s / L) ** 1.6
    if s > L - 1.2:
        half *= 0.75
    if abs(u) > half:
        return None
    knot = int(s) in (int(L * 0.55), int(L * 0.8)) and abs(u) > half - 1.0
    return ('w', (1 if knot else 2) + (u < 0) - (1 if s < 5 else 0))


def p_siekiera(s, u, L, side):
    """siekiera: trzonek, mały klin ostrza w stronę ciosu, obuch z tyłu"""
    if s < 0 or s > L + 1:
        return None
    us = u * side
    if abs(u) <= 1.0 and s <= L:
        return ('w', 2 + (u < 0)) if s < L - 5 else ('m', 3 + (u < 0))
    if us > 0.5 and us <= 5.5:
        t = us / 5.5
        lo = L - 5.0 - 2.5 * t
        hi = L - 0.5 + 1.0 * t
        if lo <= s <= hi:
            return ('m', 6 if us > 4.5 else (4 if s > (lo + hi) / 2 else 3))
        return None
    if us < -0.5 and us >= -2.2 and L - 4.0 <= s <= L - 0.8:
        return ('m', 2)
    return None


def p_kilof(s, u, L, side):
    """kilof: trzonek, głowa w poprzek - dwa zakrzywione groty"""
    if s < 0 or s > L + 2:
        return None
    if abs(u) <= 1.0 and s <= L - 1:
        return ('w', 2 + (u < 0))
    a = abs(u)
    if a <= 7.0:
        top = L + 0.5 - 0.22 * a * a / 7.0 * 3      # głowa wygięta w dół ku końcom
        bot = top - (2.6 - 1.6 * a / 7.0)
        if bot <= s <= top:
            return ('m', 5 if s > top - 0.8 else 3 + (u < 0))
    return None


def p_wlocznia(s, u, L, side):
    return bron.p_grot('wlocznia')(s, u, L, side)


# rodzaj -> profil, długość (od końca rękojeści / drzewca do czubka), chwyt (od końca), odchylenie od pionu (rad, na zewnątrz)
RODZAJE = {
    'miecz': (bron.p_miecz, 30, 4.0, 0.30), 'dlugi_miecz': (bron.p_dlugi_miecz, 38, 5.0, 0.22), 'tasak': (bron.p_tasak, 24, 3.5, 0.32),
    'szabla': (bron.p_szabla, 31, 3.6, 0.30), 'sztylet': (bron.p_sztylet, 14, 2.6, 0.40), 'buzdygan': (bron.p_buzdygan, 27, 3.0, 0.30),
    'kiscien': (bron.p_kiscien, 28, 3.0, 0.30), 'mlot': (bron.p_mlot, 30, 4.0, 0.28), 'palka': (p_palka, 26, 4.0, 0.32),
    'siekiera': (p_siekiera, 26, 4.0, 0.30), 'topor': (bron.p_topor, 34, 6.0, 0.24), 'czekan': (bron.p_czekan, 32, 6.0, 0.26),
    'kilof': (p_kilof, 28, 4.0, 0.30), 'kostur': (bron.p_kostur, 46, 15.0, 0.10), 'bardysz': (bron.p_bardysz, 50, 18.0, 0.08),
    'wlocznia': (p_wlocznia, 50, 18.0, 0.08), 'rohatyna': (bron.p_grot('rohatyna'), 52, 18.0, 0.08), 'sulica': (bron.p_grot('sulica'), 46, 16.0, 0.08),
}


def load(name):
    img = np.array(Image.open(os.path.join(CHARS, name + '.png')).convert('RGBA'))
    m = np.array(Image.open(os.path.join(SYS, 'Ubior_Maska_' + name + '.png')).convert('RGBA'))
    lab = np.zeros(m.shape[:2], np.uint8)
    for k, c in KOLOR.items():
        sel = (m[:, :, 0] == c[0]) & (m[:, :, 1] == c[1]) & (m[:, :, 2] == c[2]) & (m[:, :, 3] > 0)
        lab[sel] = k
    return img, lab


def pieces(mask):
    """kawałki maski (8-sąsiedztwo): lista list (y, x)"""
    H, W = mask.shape
    seen = np.zeros_like(mask, bool)
    out = []
    for y in range(H):
        for x in range(W):
            if mask[y, x] and not seen[y, x]:
                st, pc = [(y, x)], []
                seen[y, x] = True
                while st:
                    cy, cx = st.pop()
                    pc.append((cy, cx))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                                seen[ny, nx] = True
                                st.append((ny, nx))
                out.append(pc)
    return out


def grips(lab, name):
    torch = name in POCHODNIA
    """chwyt w każdej klatce: {(r, c): (x, y)} - dłoń wybrana po kierunku wiersza; brak dłoni -> z sąsiednich klatek wiersza"""
    H, W = lab.shape
    rows, cols = H // CELL, W // CELL
    out = {}
    for r in range(rows):
        kto = WIERSZE[ROWS[r]][0]
        if torch:
            kto = ODWROT[kto]
        got = {}
        for c in range(cols):
            cl = lab[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL]
            ps = [p for p in pieces(cl == H_) if len(p) >= 2]
            if torch:   # (the hand on the torch is not free)
                tool = cl == T_
                def on_torch(pc):
                    return any(tool[max(0, y + dy), max(0, min(CELL - 1, x + dx))] for y, x in pc for dy in (-1, 0, 1) for dx in (-1, 0, 1) if y + dy < CELL)
                ps = [p for p in ps if not on_torch(p)]
            if not ps:
                continue
            if kto == 'lewa':
                p = min(ps, key=lambda q: np.mean([x for _, x in q]))
            elif kto == 'prawa':
                p = max(ps, key=lambda q: np.mean([x for _, x in q]))
            else:
                p = max(ps, key=len)
            ys = [y for y, _ in p]
            xs = [x for _, x in p]
            got[c] = (float(np.mean(xs)) + 0.5, float(np.mean(ys)) + 0.5)
        # (a hand that jumps away from its neighbours in the cycle - the other hand taken, the hand hidden: the neighbours' middle;
        # the cycle is columns 1..cols-1, the standing figure in column 0 has its own)
        cyc = list(range(1, cols))
        def nb(c):
            i = cyc.index(c)
            return [cyc[(i - 1) % len(cyc)], cyc[(i + 1) % len(cyc)]]
        fixed = dict(got)
        for c in cyc:
            ns = [k for k in nb(c) if k in got]
            if len(ns) < 2:
                continue
            m = np.mean([got[k] for k in ns], axis=0)
            if c not in got or math.hypot(got[c][0] - m[0], got[c][1] - m[1]) > 4.5:
                fixed[c] = tuple(m)
        got = fixed
        for c in range(cols):
            if c in got:
                out[(r, c)] = got[c]
                continue
            near = sorted(got, key=lambda k: abs(k - c))[:2]
            if near:
                out[(r, c)] = tuple(np.mean([got[k] for k in near], axis=0))
        if not got:
            print('  %s: wiersz %s bez dłoni' % (name, ROWS[r]))
    return out


def render(name, kind, img, lab, gr):
    part, L, GRIP, lean = RODZAJE[kind]
    H, W = lab.shape
    rows, cols = H // CELL, W // CELL
    out = np.zeros((H, W, 4), np.uint8)
    for r in range(rows):
        _, side, front = WIERSZE[ROWS[r]]
        if name in POCHODNIA:   # (the other hand: the other side; seen from the side it is the far hand - behind him)
            if ROWS[r] in ('E', 'W'):
                front = False
            else:
                side = -side
        xs_row = [gr[(r, c)][0] for c in range(cols) if (r, c) in gr]
        mx = float(np.mean(xs_row)) if xs_row else 0
        for c in range(cols):
            if (r, c) not in gr:
                continue
            gx, gy = gr[(r, c)]
            # w górę, odchylone na zewnątrz; kołysanie: dłoń dalej w przód cyklu -> czubek lekko w tył
            sway = max(-0.14, min(0.14, 0.03 * (gx - mx))) * (1 if L < 40 else 0.4)
            # (seen from the side: leaning further forward, out of the figure - over the body it was lost)
            lk = lean * (1.9 if ROWS[r] in ('E', 'W') and L < 40 else 1.0)
            a = -math.pi / 2 + side * lk - sway
            v = np.array([math.cos(a), math.sin(a)])
            n = np.array([-v[1], v[0]])
            sd = 1 if n[0] * side >= 0 else -1          # (ostrze / dziób w stronę odchylenia)
            base = np.array([gx, gy]) - v * GRIP
            y0, x0 = r * CELL, c * CELL
            cl = lab[y0:y0 + CELL, x0:x0 + CELL]
            co = img[y0:y0 + CELL, x0:x0 + CELL]
            cls = {}
            for yy in range(CELL):
                for xx in range(CELL):
                    px, py = xx + 0.5 - base[0], yy + 0.5 - base[1]
                    s = px * v[0] + py * v[1]
                    if s < -3 or s > L + 9:
                        continue
                    u = px * n[0] + py * n[1]
                    p = part(s, u, L, sd)
                    if p:
                        cls[(yy, xx)] = p
            for (yy, xx) in list(cls.keys()):
                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    q = (yy + dy, xx + dx)
                    if 0 <= q[0] < CELL and 0 <= q[1] < CELL and q not in cls:
                        cls[q] = ('k', 0)
            for (yy, xx), (k, tone) in cls.items():
                body = co[yy, xx, 3] > 0
                if cl[yy, xx] == H_ or cl[yy, xx] in HEAD:
                    continue                            # (dłoń przed bronią, twarz i włosy zawsze widać)
                if body and not front:
                    continue                            # (tyłem do nas: broń za ciałem)
                # (the outline on the body too: a grey blade on the grey shirt vanished without it - the run to the side)
                out[y0 + yy, x0 + xx, :3] = bron.tpl(k, tone)
                out[y0 + yy, x0 + xx, 3] = 255
    return out


def preview(name, img, tpls, path):
    """podgląd: arkusz z każdym rodzajem (szablon pokolorowany jak w grze - bron.colorize), 2x"""
    H, W = img.shape[:2]
    strips = []
    for kind, t in tpls.items():
        o = img.copy()
        col = bron.colorize(t)
        a = t[:, :, 3] > 0
        o[a] = col[a]
        strips.append(o)
    full = np.concatenate(strips, axis=0)
    bg = np.zeros_like(full)
    bg[:, :, :3] = (96, 120, 80)
    bg[:, :, 3] = 255
    al = full[:, :, 3:4] / 255.0
    comp = (full[:, :, :3] * al + bg[:, :, :3] * (1 - al)).astype(np.uint8)
    Image.fromarray(comp).resize((W * 2, full.shape[0] * 2), Image.NEAREST).save(path)


def main(argv):
    kinds = [a for a in argv if a in RODZAJE] or list(RODZAJE)
    pv = argv[argv.index('--podglad') + 1] if '--podglad' in argv else None
    for name in ARKUSZE + POCHODNIA:
        img, lab = load(name)
        gr = grips(lab, name)
        tpls = {}
        for kind in kinds:
            t = render(name, kind, img, lab, gr)
            tpls[kind] = t
            if not pv:
                bron.save(t, 'Ubior_Bron_' + name.replace('Hero_', '') + '_' + kind[0].upper() + kind[1:])
        print('%s: %d klatek z chwytem, rodzaje: %s' % (name, len(gr), ', '.join(tpls)))
        if pv:
            os.makedirs(pv, exist_ok=True)
            preview(name, img, tpls, os.path.join(pv, name + '_w_rece.png'))


if __name__ == '__main__':
    main(sys.argv[1:])
