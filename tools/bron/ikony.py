# Broń i zbroje: ikony przedmiotów 300-406 (rzędy IconSet od 576) - rysowane kodem, bez PixelLab.
#   python tools/bron/ikony.py [--podglad PLIK.png]
# Czyta tools/bron/staging/ikony.json (node tools/bron/zrob_staging.js), pisze tools/bron/staging/IconSet_nowe.png: tylko nowe rzędy
# (512 x 32*n), ikona k na miejscu (k - 576).
# Broń: w stylu ikon narzędzi gry (siekiera 371, kilof 372, oszczep 416): rysunek 32x32 po przekątnej - trzonek z lewego dołu, ostrze
# / głowica w prawym górnym rogu, obrys #2c1e1e, światło z lewej góry. Kształt = rodzaj (jeden kształt na rodzaj, liczony w osi
# przekątnej), kolor = rampa materiału (Bron_Data.js MATERIALY.kolor) - warianty materiału to ten sam kształt w innej rampie.
# Zbroje, tarcze, dodatki: w stylu ikon ubioru (tools/ubior/ikony.py - „grube piksele” 16x16 x2): rysunek znakami, tony z rampy.
#   znaki: '.' pusto, '#' materiał (ton wg położenia: jaśniej u góry z lewej), 'h' światło, 'd' fałd / szew, 's' cień, 'a' akcent,
#   'm' / 'n' metal jasny / ciemny, 'k' plecionka kolcza (szachownica tonów), 'w' drewno, 'o' obrys.
import json
import math
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
STAGING = os.path.join(HERE, "staging")
OUTLINE = (0x2C, 0x1E, 0x1E, 255)
METAL = {"m": (0xC8, 0xC2, 0xB4, 255), "n": (0x6E, 0x6A, 0x62, 255)}
WOOD = ["#2a1a0e", "#43291a", "#5e3c24", "#7a5232", "#966a42", "#b08458"]
LEATHER = ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f"]
FIRST = 576


def hexrgb(s):
    return (int(s[1:3], 16), int(s[3:5], 16), int(s[5:7], 16), 255)


def outline(img, size):
    px = img.load()
    out = img.copy()
    op = out.load()
    for y in range(size):
        for x in range(size):
            if px[x, y][3]:
                continue
            if any(0 <= x + dx < size and 0 <= y + dy < size and px[x + dx, y + dy][3] and px[x + dx, y + dy] != OUTLINE
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                op[x, y] = OUTLINE
    return out


# ---------------------------------------------------------------- the weapons: shapes along the diagonal
# u: along the weapon (0 at the bottom left end, ~32 at the top right tip), v: across it (+ to the bottom right, - to the top left -
# the light side). A shape gives the role of a point: "b" the material (blade, head), "w" wood (the haft, the grip), "g" the guard /
# the fittings (the material, darker), "l" leather (a wrap), "f" the fuller (darker line), "e" the edge (lighter), "s" the string,
# "a" the accent (a unique's stone), None - empty.
A = (2.5, 29.5)
B = (29.5, 2.5)
L = math.hypot(B[0] - A[0], B[1] - A[1])
UX, UY = (B[0] - A[0]) / L, (B[1] - A[1]) / L
VX, VY = -UY, UX   # (+v: to the bottom right)
K = 33.94 / L      # (the shapes are drawn for a diagonal of 33.94 px: the icon's whole diagonal makes them a size bigger)


def taper(u, u0, u1, w0, w1, p=1.0):
    t = max(0.0, min(1.0, (u - u0) / max(0.001, u1 - u0)))
    return w0 + (w1 - w0) * (t ** p)


def sh_sztylet(u, v):
    if 2.5 <= u < 4.5 and abs(v) <= 1.7: return "g"
    if 4.5 <= u < 10.5 and abs(v) <= 1.1: return "l"
    if 10.5 <= u < 12.2 and abs(v) <= 3.6: return "g"
    if 12.2 <= u < 26.5:
        h = 2.0 * (1 - (u - 12.2) / 14.3) ** 0.55
        if abs(v) <= h: return "f" if abs(v) < 0.35 and u < 22 else "b"
    return None


def sh_miecz(u, v, long=False):
    gl = 9.6 if long else 8.2
    if 0.3 <= u < 2.4 and abs(v) <= 1.8: return "g"
    if 2.4 <= u < gl and abs(v) <= 1.1: return "l"
    if gl <= u < gl + 1.8 and abs(v) <= (5.2 if long else 4.6): return "g"
    if gl + 1.8 <= u < 32.5:
        h = 2.3 if u < 28.5 else taper(u, 28.5, 32.5, 2.3, 0.0)
        if abs(v) <= h: return "f" if abs(v) < 0.4 and u < 27 else "b"
    return None


def sh_dlugi_miecz(u, v):
    return sh_miecz(u, v, True)


def sh_tasak(u, v):
    if 0.5 <= u < 2.3 and abs(v) <= 1.6: return "g"
    if 2.3 <= u < 9 and abs(v) <= 1.1: return "l"
    if 9 <= u < 10.2 and abs(v) <= 2.4: return "g"
    if 10.2 <= u < 30.5:
        lo, hi = -1.8, 3.8
        if u > 27.5: hi = taper(u, 27.5, 30.5, 3.8, -1.0)
        if lo <= v <= hi: return "e" if v > hi - 0.9 else "b"
    return None


def sh_szabla(u, v):
    if 0.3 <= u < 2.2 and abs(v) <= 1.6: return "g"
    if 2.2 <= u < 8.4 and abs(v) <= 1.1: return "l"
    if 8.4 <= u < 9.9 and abs(v) <= 3.4: return "g"
    if 9.9 <= u < 32.5:
        c = -0.010 * (u - 9.9) ** 2
        h = 1.8 if u < 29 else taper(u, 29, 32.5, 1.8, 0.0)
        if abs(v - c) <= h: return "e" if v - c > h - 0.8 else "b"
    return None


def sh_palka(u, v, studs=False):
    if 0 <= u < 13 and abs(v) <= 1.3: return "w"
    if 13 <= u < 31.5:
        h = taper(u, 13, 28, 1.6, 4.0)
        if u > 28.5: h = taper(u, 28.5, 31.5, 4.0, 1.5)
        if abs(v) <= h:
            if studs and int(round(u)) % 4 == 0 and abs(abs(v) - h * 0.55) < 0.6: return "m"
            return "b"
    return None


def sh_kostur(u, v):
    if 0 <= u < 29 and abs(v) <= 1.15: return "w"
    if 27.5 <= u < 32.5 and abs(v) <= 2.0: return "b"
    return None


def sh_kiscien(u, v):
    if 0 <= u < 12.5 and abs(v) <= 1.3: return "w"
    if 12.5 <= u < 13.6 and abs(v) <= 1.7: return "g"
    for c in (15.0, 17.3, 19.6):
        if abs(u - c) <= 0.75 and abs(v) <= 0.75: return "g"
    du, r = u - 25.0, math.hypot(u - 25.0, v)
    if r <= 4.3: return "b"
    ang = math.atan2(v, du)
    for k in range(6):
        a = k * math.pi / 3 + 0.3
        if abs(math.atan2(math.sin(ang - a), math.cos(ang - a))) < 0.16 and r <= 6.0: return "g"
    return None


def sh_buzdygan(u, v):
    if 0 <= u < 18.5 and abs(v) <= 1.2: return "w"
    if 18.5 <= u < 29.5:
        t = (u - 24.0) / 5.5
        h = 3.9 * math.sqrt(max(0.0, 1 - t * t))
        if abs(v) <= h: return "f" if int(math.floor(u)) % 3 == 0 else "b"
    if 29.5 <= u < 31.8 and abs(v) <= 1.0: return "b"
    return None


def sh_topor(u, v, long=False):
    top = 33.0 if long else 32.0
    if 0 <= u < top and abs(v) <= 1.15: return "w"
    u0, u1, wmax = (15.0, 33.0, 7.0) if long else (19.5, 32.5, 8.0)
    if u0 <= u <= u1:
        w = wmax * math.sin(math.pi * (u - u0) / (u1 - u0)) ** 0.7
        if -(1.1 + w) <= v <= -1.1: return "e" if v < -(1.1 + w) + 1.0 else "b"
    return None


def sh_bardysz(u, v):
    return sh_topor(u, v, True)


def sh_czekan(u, v):
    if 0 <= u < 32 and abs(v) <= 1.15: return "w"
    if 24.5 <= u <= 31.0:
        w = 5.5 * math.sin(math.pi * (u - 24.5) / 6.5) ** 0.7
        if -(1.1 + w) <= v <= -1.1: return "e" if v < -(1.1 + w) + 1.0 else "b"
        sp = 5.5 * (1 - abs(u - 27.7) / 3.3)
        if 1.1 <= v <= 1.1 + max(0.0, sp): return "b"
    return None


def sh_mlot(u, v):
    if 0 <= u < 25 and abs(v) <= 1.25: return "w"
    if 24 <= u < 31.5 and -6.2 <= v <= 4.8: return "f" if v < -5.0 else "b"
    if 26 <= u < 29.5 and 4.8 < v <= 4.8 + 2.8 * (1 - abs(u - 27.75) / 1.75): return "b"
    return None


def sh_wlocznia(u, v, lugs=False):
    if 0 <= u < 27 and abs(v) <= 0.95: return "w"
    if 26 <= u < 28.2 and abs(v) <= 1.35: return "g"
    if lugs and 25.6 <= u < 26.8 and abs(v) <= 3.4: return "g"
    if 28.2 <= u < 33.8:
        h = (3.0 if lugs else 2.6) * math.sin(math.pi * min(1, (u - 28.2) / 5.6)) ** 0.8
        if u > 31.5: h = min(h, taper(u, 31.5, 33.8, 2.0, 0.0))
        if abs(v) <= h: return "f" if abs(v) < 0.35 else "b"
    return None


def sh_rohatyna(u, v):
    return sh_wlocznia(u, v, True)


def sh_luk(u, v):
    c = -5.8 * math.sin(math.pi * u / 32.0)
    half = 0.95 + 0.45 * math.sin(math.pi * u / 32.0)
    if 0.5 <= u <= 31.5 and abs(v - c) <= half: return "l" if 14.5 <= u <= 17.5 else "b"
    if 1.0 <= u <= 31.0 and abs(v - 0.2) <= 0.42: return "s"
    return None


def sh_proca(u, v):
    if 0 <= u < 14 and abs(v) <= 1.25: return "w"
    for sgn in (-1, 1):
        c = sgn * (u - 13.5) * 0.55
        if 13.5 <= u <= 24.5 and abs(v - c) <= 1.05: return "w"
    if 22.0 <= u <= 25.5:
        tipv = 0.55 * 11.0
        sag = 2.2 * (1 - (v / tipv) ** 2) if abs(v) <= tipv else 0
        if abs(u - (24.8 - sag)) <= 0.55 and abs(v) <= tipv: return "b"
        if abs(v) <= 1.6 and abs(u - (24.8 - 2.2)) <= 1.3: return "b"
    return None


def sh_siekiera(u, v):
    # (the tool: a shorter haft, a narrow blade with a straight edge, like the game's axe 371)
    if 0 <= u < 30.5 and abs(v) <= 1.15: return "w"
    if 22.5 <= u <= 31.5:
        w = 6.0 * min(1.0, (u - 22.5) / 3.0) if u < 25.5 else 6.0
        if -(1.1 + w) <= v <= -1.1: return "e" if v < -(1.1 + w) + 1.0 else "b"
    if 27.0 <= u <= 31.0 and 1.1 <= v <= 2.6: return "b"
    return None


def sh_kilof(u, v):
    # (the tool: a haft and a head across it, pointed on both ends, a little bent - like the game's pickaxe 372)
    if 0 <= u < 26.0 and abs(v) <= 1.2: return "w"
    if abs(v) <= 8.5:
        c = 25.0 - 0.04 * v * v
        h = 1.7 * (1 - abs(v) / 9.5) + 0.5
        if abs(u - c) <= h: return "e" if abs(v) > 7.5 else "b"
    return None


SHAPES = {"siekiera": sh_siekiera, "kilof": sh_kilof, "sztylet": sh_sztylet, "miecz": sh_miecz, "dlugi_miecz": sh_dlugi_miecz, "tasak": sh_tasak, "szabla": sh_szabla,
          "palka": sh_palka, "kostur": sh_kostur, "kiscien": sh_kiscien, "buzdygan": sh_buzdygan, "topor": sh_topor, "bardysz": sh_bardysz,
          "czekan": sh_czekan, "mlot": sh_mlot, "wlocznia": sh_wlocznia, "rohatyna": sh_rohatyna, "luk": sh_luk, "proca": sh_proca}


def weapon(kind, ramp, material, accent=None):
    tones = [hexrgb(c) for c in ramp]
    wood = [hexrgb(c) for c in WOOD]
    leather = [hexrgb(c) for c in LEATHER]
    n = len(tones)
    shape = SHAPES[kind]
    studs = material == "okute"
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    px = img.load()
    roles = {}
    for y in range(32):
        for x in range(32):
            dx, dy = x + 0.5 - A[0], y + 0.5 - A[1]
            u, v = (dx * UX + dy * UY) * K, (dx * VX + dy * VY) * K
            r = sh_palka(u, v, True) if (kind == "palka" and studs) else shape(u, v)
            if r:
                roles[(x, y)] = (r, u, v)
    if not roles:
        return img
    for (x, y), (r, u, v) in roles.items():
        # the light from the top left: the -v side brighter, the far end a little brighter, the edges of the shape darker
        up = (x, y - 1) in roles and (x - 1, y) in roles
        down = (x, y + 1) in roles and (x + 1, y) in roles
        t = 2.6 - v * 0.55 + (0.6 if not up else 0) - (0.8 if not down else 0)
        if r in ("w", "l"):
            ramp_ = leather if r == "l" else wood
            k = max(1, min(5, int(round(t))))
            col = ramp_[k]
            if r == "l" and int(math.floor(u)) % 2 == 0:
                col = ramp_[max(0, k - 1)]
        elif r == "s":
            col = (0xD8, 0xD0, 0xB8, 255)
        elif r == "m":
            col = METAL["m"]
        elif r == "a":
            col = hexrgb(accent) if accent else tones[n - 1]
        else:
            k = int(round(t + 0.6))
            if r == "g":
                k -= 1
            elif r == "f":
                k -= 1
            elif r == "e":
                k = n - 1
            k = max(1, min(n - 1, k))
            col = tones[k]
        px[x, y] = col
    if accent:   # (a unique: a stone on the guard / the pommel)
        for (x, y), (r, u, v) in roles.items():
            if r == "g" and abs(v) < 0.8:
                px[x, y] = hexrgb(accent)
                break
    return outline(img, 32)


# ---------------------------------------------------------------- armour, shields, trinkets: 16 x 16 drawings, doubled
RYSUNKI = {
    "kaptur": [
        "................",
        "......####......",
        "....##hhhh##....",
        "...#hh####d##...",
        "..#h##ssss##d#..",
        "..#h#ssssss#d#..",
        ".#h##ssssss##d#.",
        ".#h#ssssssss#d#.",
        ".#h#ssssssss#d#.",
        ".##h#ssssss#d##.",
        ".###h######d###.",
        "..###hhhhhhd##..",
        "...##########...",
        "....dddddddd....",
        "................",
        "................",
    ],
    "kaptur_futro": [
        "................",
        "......####......",
        "....##hhhh##....",
        "...#hh####d##...",
        "..#haaaaaaaad#..",
        "..#ha.ssss.ad#..",
        ".#h#a.ssss.a#d#.",
        ".#h#assssssa#d#.",
        ".#h#assssssa#d#.",
        ".##h#aassaa#d##.",
        ".###haaaaaad###.",
        "..###hhhhhhd##..",
        "...##########...",
        "....dddddddd....",
        "................",
        "................",
    ],
    "czepiec": [
        "................",
        "................",
        "......####......",
        "....##hhhh##....",
        "...#h#d##d##d...",
        "..#h##d##d###d..",
        "..#h##d##d###d..",
        "..#hhhhhhhhhhd..",
        "..#h#.....#d#d..",
        "..#h#.....#d#d..",
        "..#h#.....#d#d..",
        "..#hd.....##d...",
        "...a.......a....",
        "...a.......a....",
        "................",
        "................",
    ],
    "czepiec_kolczy": [
        "................",
        "......####......",
        "....##kkkk##....",
        "...#kkkkkkkk#...",
        "..#kkkkkkkkkk#..",
        "..#kkkkkkkkkk#..",
        "..#kk......kk#..",
        "..#kk......kk#..",
        "..#kk......kk#..",
        "..#kk......kk#..",
        ".#kkkk....kkkk#.",
        ".#kkkkkkkkkkkk#.",
        "..#kkkkkkkkkk#..",
        "...##########...",
        "................",
        "................",
    ],
    "kapalin": [
        "................",
        "................",
        "................",
        "......####......",
        ".....#hh###.....",
        "....#h#####d....",
        "....#h#####d....",
        "....#h#####d....",
        "....#hm####d....",
        "..hhhhhhhhhhhh..",
        ".h############d.",
        "..dddddddddddd..",
        "................",
        "................",
        "................",
        "................",
    ],
    "helm_nosal": [
        "................",
        "................",
        ".......##.......",
        "......#hh#......",
        ".....#hh##d.....",
        ".....#h###d.....",
        "....#h#####d....",
        "....#h#####d....",
        "...#h#######d...",
        "...hhhhhhhhhhh..",
        "...#d...#...d#..",
        "...#d...#...d#..",
        "...#d...#...d#..",
        "....d...d...d...",
        "................",
        "................",
    ],
    "szyszak": [
        "................",
        ".......#........",
        "......#h#.......",
        ".....#hh#d......",
        "....#h####d.....",
        "...#h######d....",
        "...#h######d....",
        "..hhhhhhhhhhhd..",
        "..#h#..#..#d#...",
        "..#h#..#..#d#...",
        "..#h#..#..#d#...",
        "..#h#.....#d#...",
        "...##.....##....",
        "................",
        "................",
        "................",
    ],
    "helm_zakonny": [
        "................",
        ".....######.....",
        "....#hhhhhd#....",
        "...#hh####dd#...",
        "...#h######d#...",
        "...#h######d#...",
        "...ssssssssss...",
        "...#h##a###d#...",
        "...#h#aaa##d#...",
        "...#h##a###d#...",
        "...#h#s#s#sd#...",
        "...#hd#####dd...",
        "....#h####d#....",
        ".....######.....",
        "................",
        "................",
    ],
    "przeszywanica": [
        "................",
        ".....##..##.....",
        "...####..####...",
        ".#####dddd#####.",
        ".#h#d#####d#d##.",
        ".#h#d#d#d#d#d##.",
        ".#h#d#####d#d##.",
        "..##d#d#d#d#d#..",
        "....#d#####d....",
        "....#d#d#d#d....",
        "....#d#####d....",
        "....#d#d#d#d....",
        "....#d#####d....",
        "....dddddddd....",
        "................",
        "................",
    ],
    "skorznia": [
        "................",
        "....hh....hh....",
        "...#hh#..#hh#...",
        "..##h######d##..",
        "..#h#######d#d..",
        "..#h#dddddd#d#..",
        "..#h########d#..",
        "...#h######d#...",
        "...#ddddddddd...",
        "...#h######d#...",
        "...#h######d#...",
        "...#ddddddddd...",
        "...#h######d#...",
        "...dddddddddd...",
        "................",
        "................",
    ],
    "skorznia_cwieki": [
        "................",
        "....hh....hh....",
        "...#hh#..#hh#...",
        "..##h######d##..",
        "..#h#m##m##d#d..",
        "..#h#######d#d..",
        "..#h#m##m##m#d..",
        "...#h######d#...",
        "...#m##m##m#d...",
        "...#h######d#...",
        "...#m##m##m#d...",
        "...#h######d#...",
        "...#h######d#...",
        "...dddddddddd...",
        "................",
        "................",
    ],
    "luska": [
        "................",
        ".....##..##.....",
        "...####..####...",
        ".#####hhhh#####.",
        ".#hd#d#d#d#d#d#.",
        ".#h#d#d#d#d#d##.",
        ".##d#d#d#d#d#d#.",
        "..#h#d#d#d#d#d..",
        "....#d#d#d#d....",
        "....d#d#d#d#....",
        "....#d#d#d#d....",
        "....d#d#d#d#....",
        "....#d#d#d#d....",
        "....dddddddd....",
        "................",
        "................",
    ],
    "kolczuga": [
        "................",
        ".....kk..kk.....",
        "...kkkk..kkkk...",
        ".kkkkkkkkkkkkkk.",
        ".kkkkkkkkkkkkkk.",
        ".kkkkkkkkkkkkkk.",
        ".kkkkkkkkkkkkkk.",
        "..kkkkkkkkkkkk..",
        "....kkkkkkkk....",
        "....kkkkkkkk....",
        "....kkkkkkkk....",
        "....kkkkkkkk....",
        "....kkkkkkkk....",
        "....dddddddd....",
        "................",
        "................",
    ],
    "brygantyna": [
        "................",
        "....hh....hh....",
        "...#hh#..#hh#...",
        "..##h######d##..",
        "..#hm#m#m#m#d#..",
        "..#h#######d#d..",
        "..#hm#m#m#m#d#..",
        "...#h######d#...",
        "...#m#m#m#m#d...",
        "...#h######d#...",
        "...#m#m#m#m#d...",
        "...#h######d#...",
        "...#aaaaaaaa#...",
        "...dddddddddd...",
        "................",
        "................",
    ],
    "napiersnik": [
        "................",
        "................",
        "...##......##...",
        "..#hh#....#dd#..",
        "..#hhh####ddd#..",
        "..#hhhh###dd##..",
        "...#hhh####d#...",
        "...#hh#####d#...",
        "...#h######d#...",
        "...#h###d##d#...",
        "....#h##d#d#....",
        "....#h##d##d....",
        ".....##dd##.....",
        "......####......",
        "................",
        "................",
    ],
    "karwasze": [
        "................",
        "................",
        "..##......##....",
        ".#hh#....#hh#...",
        ".#h#d#...#h#d#..",
        ".#hd#d#..#hd#d#.",
        ".#h#d#d..#h#d#d.",
        "..#hd#d#..#hd#d#",
        "..#h#d#d..#h#d#d",
        "...#hd#d#..#hd#d",
        "...#h#dd#..#h#dd",
        "....####....####",
        "................",
        "................",
        "................",
        "................",
    ],
    "rekawice": [
        "................",
        "......k.k.k.....",
        ".....kkkkkkk....",
        ".....kkkkkkk....",
        "...k.kkkkkkk....",
        "...kkkkkkkkk....",
        "....kkkkkkkk....",
        "....kkkkkkkk....",
        ".....kkkkkk.....",
        ".....######.....",
        ".....#hhhhd.....",
        ".....######.....",
        "......dddd......",
        "................",
        "................",
        "................",
    ],
    "rekawice_plyty": [
        "................",
        "......h.h.h.....",
        ".....#d#d#d#....",
        ".....#h#h#h#....",
        "...h.#d#d#d#....",
        "...#d########...",
        "....#hhhhhhd....",
        "....#h#####d....",
        ".....#h###d.....",
        ".....#hhhhd.....",
        ".....#h##d#.....",
        ".....######.....",
        "......dddd......",
        "................",
        "................",
        "................",
    ],
    "nagolenniki": [
        "................",
        "..####....####..",
        "..#hhd....#hhd..",
        "..#h#d....#h#d..",
        "..#hd#....#hd#..",
        "..#h#d....#h#d..",
        "..#h#d....#h#d..",
        "..#h#d....#h#d..",
        "..#hd#....#hd#..",
        "..#h#d....#h#d..",
        "..#h#d....#h#d..",
        "...dd......dd...",
        "................",
        "................",
        "................",
        "................",
    ],
    "buty_wysokie": [
        "................",
        "..####....####..",
        "..#hhd....#hhd..",
        "..#h#d....#h#d..",
        "..#h#d....#h#d..",
        "..#h#d....#h#d..",
        "..#h#d....#h#d..",
        "..#h#d....#h#d..",
        "..#h##d...#h##d.",
        "..#h###d..#h###d",
        "..#h####d.#h####",
        "..dddddddd.ddddd",
        "................",
        "................",
        "................",
        "................",
    ],
    "buty_okute": [
        "................",
        "................",
        "................",
        "..####....####..",
        "..#hhd....#hhd..",
        "..#h#d....#h#d..",
        "..#h#d....#h#d..",
        "..#h##d...#h##d.",
        "..#h###d..#h###d",
        "..#h##mmm.#h##mm",
        "..nnnnnnn.nnnnnn",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "tarcza_okragla": [
        "................",
        ".....######.....",
        "...##hhhhhd##...",
        "..#hwwwwwwwwd#..",
        ".#hwwwdwwwdwwd#.",
        ".#hwwwdwwwdwwd#.",
        "#hwwwdwmmwdwwwd#",
        "#hwwwdmhmnwwwwd#",
        "#hwwwdwnnwdwwwd#",
        "#hwwwdwwwwdwwwd#",
        ".#hwwdwwwwdwwd#.",
        ".#dwwdwwwwdwwd#.",
        "..#dwwwwwwwwd#..",
        "...##ddddddd#...",
        ".....######.....",
        "................",
    ],
    "puklerz": [
        "................",
        "................",
        "................",
        "......####......",
        "....##hhhh##....",
        "...#hh####dd#...",
        "...#h##mm##d#...",
        "..#h##mhmn##d#..",
        "..#h##nnnn##d#..",
        "...#h##nn##d#...",
        "...#hd####dd#...",
        "....##dddd##....",
        "......####......",
        "................",
        "................",
        "................",
    ],
    "tarcza_migdalowa": [
        "................",
        "..############..",
        "..#hhhhhhhhhd#..",
        "..#h###aa###d#..",
        "..#h###aa###d#..",
        "..#h#aaaaaa#d#..",
        "..#h###aa###d#..",
        "...#h##aa##d#...",
        "...#h##aa##d#...",
        "....#h#aa#d#....",
        "....#h####d#....",
        ".....#h##d#.....",
        "......#hd#......",
        ".......##.......",
        "................",
        "................",
    ],
    "amulet": [
        "................",
        "....dd....dd....",
        "...d........d...",
        "..d..........d..",
        "..d..........d..",
        "...d........d...",
        "....d......d....",
        ".....d....d.....",
        "......d##d......",
        "......#aa#......",
        ".....#aaaa#.....",
        ".....#ahaa#.....",
        "......#aa#......",
        ".......##.......",
        "................",
        "................",
    ],
    "pierscien": [
        "................",
        "................",
        "................",
        "......#aa#......",
        ".....#ahaa#.....",
        ".....#aaaa#.....",
        "....##h##d##....",
        "...#h#....#d#...",
        "..#h#......#d#..",
        "..#h#......#d#..",
        "..#h#......#d#..",
        "...#h#....#d#...",
        "....##dddd##....",
        "................",
        "................",
        "................",
    ],
    "talizman": [
        "................",
        ".......dd.......",
        "......d..d......",
        ".......dd.......",
        ".....######.....",
        "....#hhhhhd#....",
        "...#hh#aa#dd#...",
        "...#h#a##a#d#...",
        "...#h#aaaa#d#...",
        "...#h#a##a#d#...",
        "...#hd#aa#dd#...",
        "....#dddddd#....",
        ".....######.....",
        "................",
        "................",
        "................",
    ],
    "oko": [
        "................",
        "................",
        ".......##.......",
        "......#hh#......",
        ".....#haaa#.....",
        "....#haaaaa#....",
        "...#haaddaaa#...",
        "..#haadssdaaa#..",
        "...#aaaddaaa#...",
        "....#aaaaaa#....",
        ".....#aaaa#.....",
        "......#aa#......",
        ".......##.......",
        "................",
        "................",
        "................",
    ],
}
# the drawings' own accent when the item has none: the fur, the cross, the ties, the shield's sign
AKCENT = {"kaptur_futro": "#cdbb94", "helm_zakonny": "#e8e2d0", "czepiec": "#b0a68e", "brygantyna": "#7a2a24", "tarcza_migdalowa": "#e8e2d0"}


def draw(name, ramp, accent):
    grid = [row.ljust(16, ".")[:16].replace(" ", ".") for row in RYSUNKI[name]]
    assert len(grid) == 16, name
    tones = [hexrgb(c) for c in ramp]
    wood = [hexrgb(c) for c in WOOD]
    n = len(tones)
    acc = hexrgb(accent) if accent else tones[max(0, n - 2)]
    filled = [[grid[y][x] != "." for x in range(16)] for y in range(16)]
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    for y in range(16):
        for x in range(16):
            ch = grid[y][x]
            if ch == ".":
                continue
            t = 4.4 - (x * 0.10 + y * 0.14)
            if y == 0 or not filled[y - 1][x]:
                t += 1
            if x == 15 or not filled[y][x + 1] or y == 15 or not filled[y + 1][x]:
                t -= 0.8
            if ch == "h":
                t = n - 1
            elif ch == "d":
                t -= 1.6
            elif ch == "s":
                t = 0
            elif ch == "k":
                t += 0.6 if (x + y) % 2 == 0 else -1.2
            k = max(0, min(n - 1, int(round(t))))
            if ch in "#hdk":
                k = max(1, min(n - 1 if ch == "h" else n - 2, k))
            col = tones[k]
            if ch == "a":
                col = acc
            elif ch == "w":
                col = wood[max(1, min(4, int(round(t))))]
            elif ch in METAL:
                col = METAL[ch]
            elif ch == "o":
                col = OUTLINE
            px[x, y] = col
    return outline(img, 16).resize((32, 32), Image.NEAREST)


def main():
    data = json.load(open(os.path.join(STAGING, "ikony.json"), encoding="utf-8"))
    last = max(d["ikona"] for d in data)
    rows = (last - FIRST) // 16 + 1
    sheet = Image.new("RGBA", (512, rows * 32), (0, 0, 0, 0))
    missing = []
    for d in data:
        k = d["ikona"] - FIRST
        name = d["rysunek"]
        accent = d.get("akcent") or (("#d84a3a" if d.get("unikat") else None) if d["typ"] == "bron" else AKCENT.get(name))
        if d["typ"] == "bron" and name in SHAPES:
            ic = weapon(name, d["rampa"], d["material"], accent if d.get("unikat") else None)
        elif name in RYSUNKI:
            ic = draw(name, d["rampa"], accent)
        else:
            missing.append(name)
            continue
        sheet.alpha_composite(ic, ((k % 16) * 32, (k // 16) * 32))
    if missing:
        print("BRAK RYSUNKU:", sorted(set(missing)))
        sys.exit(1)
    out = os.path.join(STAGING, "IconSet_nowe.png")
    sheet.save(out)
    print("IconSet_nowe.png: %dx%d, ikony %d-%d" % (sheet.width, sheet.height, FIRST, last))
    if "--podglad" in sys.argv:
        dest = sys.argv[sys.argv.index("--podglad") + 1]
        big = Image.new("RGBA", (512 * 3, rows * 32 * 3), (58, 60, 66, 255))
        big.alpha_composite(sheet.resize((512 * 3, rows * 32 * 3), Image.NEAREST))
        big.save(dest)
        print("podgląd:", dest)


if __name__ == "__main__":
    main()
