# -*- coding: utf-8 -*-
"""SZWY ŚWIATA: buduje w tools/swiat/szwy/staging/ KOPIE map, w których wygląd przy krawędzi jest ciągły przez styk (data/ i js/ nie są ruszane).
Dla każdego odcinka styku dwóch map jedna strona jest WZOREM (wyraźniejszy element: mur/klif/budynek > droga/bruk > las > trawa; przy równych: mapa gracza,
potem starsza), druga się dopasowuje (po 4 kratki w głąb, lustrzanie względem styku):
  - MUR/KLIF/palisada/budynek (kratka zablokowana kaflami) wzoru w 2 rzędach przy krawędzi: te same kafle, region i zdarzenia przyrody po drugiej stronie (autokafle z poprawnymi kształtami),
  - GRUNT (trawa, ziemia, droga, bruk, podszyt) w pasie 4 kratek: ten sam rodzaj co u wzoru, im głębiej, tym rzadziej (szum, bez prostokątów); drogi dłużej,
  - PRZYRODA (drzewa, krzaki, kamienie): zdarzenia wzoru kopiowane tam, gdzie sąsiad ma ich mniej; obce rodzaje zamieniane na rodzaj wzoru (bez usuwania nadmiaru: drugi przebieg ma dać 0 zmian).
Zestawy kafli 9 i 11: A3/A4/A5/B/D są wspólne, A2 mapowany po kolorze (z zachowaniem przejezdności); C/E (tylko zestaw 11) nie przechodzą do zestawu 9.
Nigdy: nowa woda, rośliny na murze/dachu/bruku, ruszanie zdarzeń z treścią, przejść, korytarzy przed bramami, zabudowy mapy gracza.
  python tools/swiat/szwy/zbuduj_szwy.py            (od zera z data/ -> staging, zapisuje wzory.json)
  python tools/swiat/szwy/zbuduj_szwy.py --powtorz  (drugi przebieg NA WYNIKU stagingu z zapisanymi wzorami: ma dać 0 zmian)"""
import os, sys, json, copy, math, random, re, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
for p in (os.path.join(ROOT, "tools", "mapy"), os.path.join(ROOT, "tools", "rozszerzenia")): sys.path.insert(0, p)
import numpy as np
import mapylib as L
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

STG = os.path.join(HERE, "staging"); DATA = os.path.join(STG, "data")
POWTORZ = "--powtorz" in sys.argv
ZRODLO = DATA if POWTORZ else os.path.join(ROOT, "data")
PL = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}
GRUNT_ZAB = {19, 40, 41}
LASY = (20, 22, 30, 38)                 # blokujące rodzaje A2 zestawu 11 (las koron)
GLEB = 4                                  # głębokość pasa gruntu (kratki)
GLEB_MUR = 2                              # głębokość muru / klifu
NAT_OK = ("!$Pine_", "!$Tree_Small", "!$Big_Trees", "!$Bush_", "!$Rock_", "!$Boulder_")   # kopiowane rodzaje przyrody
NAT_NIE = ("Ore", "Apple")                # rudy i jabłonie to zasoby gry: nie powielamy
ZDARZ_MAX = 458


def h2(x, y, seed):
    return random.Random((x * 73856093) ^ (y * 19349663) ^ (seed * 83492791)).random()


def szum(wx, wy, seed, skala=3.0):
    """gładki szum 0..1 po współrzędnych świata (bez prostych linii i prostokątów)"""
    fx, fy = wx / skala, wy / skala
    x0, y0 = math.floor(fx), math.floor(fy); tx, ty = fx - x0, fy - y0
    tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
    a, b, c, d = h2(x0, y0, seed), h2(x0 + 1, y0, seed), h2(x0, y0 + 1, seed), h2(x0 + 1, y0 + 1, seed)
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty


# ------------------------------------------------------------------ dane
def wczytaj(mid):
    p = os.path.join(ZRODLO, "Map%03d.json" % mid)
    if not os.path.exists(p): p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
    raw = open(p, "rb").read(); o = json.loads(raw.decode("utf-8"))
    assert W.map_text(o).encode("utf-8") == raw, "Map%03d nie w układzie edytora" % mid
    return o


def mapy_swiata():
    src = open(os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"), encoding="utf-8").read()
    i = src.index("maps:") + 5
    return {int(k): v for k, v in json.loads(src[i:src.index("},", i) + 1]).items()}


def pary(maps):
    out = []
    for a, (ax, ay, aw, ah) in maps.items():
        for b, (bx, by, bw, bh) in maps.items():
            if a == b: continue
            if ax + aw == bx:
                lo, hi = max(ay, by), min(ay + ah, by + bh)
                if hi > lo: out.append((a, b, "EW", lo, hi))
            if ay + ah == by:
                lo, hi = max(ax, bx), min(ax + aw, bx + bw)
                if hi > lo: out.append((a, b, "NS", lo, hi))
    return sorted(out)


# ------------------------------------------------------------------ rodzaje gruntu między zestawami
_kol = {}


def kolor_rodzaju(ts, k):
    key = (ts, k)
    if key not in _kol:
        z = L.zestaw(ts); t = 2048 + k * 48
        im = np.asarray(z.tile(t).convert("RGBA"), float); a = im[..., 3] > 0
        _kol[key] = (im[..., :3][a].mean(0) if a.any() else None, bool((z.flag(t) & 0x0f) == 0x0f))
    return _kol[key]


_mapk = {}


def mapuj_rodzaj(k, src, dst):
    """(rodzaj w zestawie dst, 'trzeba drzewa'): ten sam kolor i ta sama przejezdność"""
    if src == dst: return k, False
    key = (k, src, dst)
    if key in _mapk: return _mapk[key]
    c0, b0 = kolor_rodzaju(src, k)
    if c0 is None: _mapk[key] = (None, False); return _mapk[key]
    best = None
    for k2 in range(16, 46):
        c2, b2 = kolor_rodzaju(dst, k2)
        if c2 is None or b2 != b0: continue
        d = float(np.sqrt(((c0 - c2) ** 2).sum()))
        if best is None or d < best[0]: best = (d, k2)
    need = False
    if best is None or best[0] > 40:
        # brak takiego samego (np. las-podszyt blokujący w zestawie 9 nie istnieje): najbliższy kolor bez blokady (+ drzewo, gdy źródło blokuje)
        for k2 in range(16, 46):
            c2, b2 = kolor_rodzaju(dst, k2)
            if c2 is None or b2: continue
            d = float(np.sqrt(((c0 - c2) ** 2).sum()))
            if best is None or d < best[0] or (best[1] is not None and kolor_rodzaju(dst, best[1])[1]): best = (d, k2)
        need = b0
    _mapk[key] = (best[1] if best else None, need)
    return _mapk[key]


def tx(t, src, dst):
    """kafel zestawu src -> zestawu dst; (nowy, trzeba_drzewa) albo (None, False): nie da się przenieść"""
    if t == 0: return 0, False
    if 2048 <= t < 2816: return None, False                        # A1 (woda): nie ruszamy
    if 2816 <= t < 4352:
        k = (t - 2048) // 48; sh = (t - 2048) % 48
        k2, need = mapuj_rodzaj(k, src, dst)
        if k2 is None: return None, False
        return 2048 + k2 * 48 + sh, need
    if src != dst and (256 <= t < 512 or 768 <= t < 1024): return None, False        # C, E: tylko zestaw 11
    return t, False


# ------------------------------------------------------------------ opis kratki
def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def woda(t): return 2048 <= t < 2816


def zabudowa(M, x, y):
    for z in (0, 1):
        t = M.t(z, x, y)
        if t >= 2816:
            k = (t - 2048) // 48
            if k >= 48 or k in GRUNT_ZAB: return True
    return False


def trawa_kolor(c):
    return c is not None and c[1] > c[0] + 25 and c[1] > c[2] + 25


def info(M, x, y):
    """opis kratki z kafli: woda / blk (blokują kafle) / struct (mur, klif, budynek) / las-kafel / droga / zwykły grunt"""
    t = [M.t(z, x, y) for z in range(4)]
    r = {"t": t, "reg": M.t(5, x, y)}
    r["woda"] = woda(t[0]) or woda(t[1]) or not M.teren(x, y)
    r["blk"] = not M.kratka_wolna(x, y)
    k1 = kind(t[1]) if t[1] >= 2816 else None
    r["las"] = r["blk"] and k1 in LASY and not t[2] and not t[3]
    r["struct"] = r["blk"] and not r["woda"] and not r["las"]
    k0 = kind(t[0]) if 2816 <= t[0] < 4352 else None
    top = k1 if k1 is not None and 16 <= k1 < 48 else k0
    r["zwykly"] = (not r["blk"]) and not t[2] and not t[3] and t[0] >= 2816 and t[0] < 4352 and (t[1] == 0 or 2816 <= t[1] < 4352) \
        and not (set(filter(lambda v: v is not None, (kind(t[0]), kind(t[1]) if t[1] else None))) & GRUNT_ZAB)
    c = kolor_rodzaju(M.tsid, top)[0] if top is not None and 16 <= top < 48 else None
    r["droga"] = (not r["blk"]) and ((top is not None and not trawa_kolor(c)) or (t[0] and t[0] < 2048 and 1536 <= t[0] < 1664) or zabudowa(M, x, y))
    return r


def przechodni(zest, t4, reg=0):
    """czy kratka o takich kaflach (warstwy 0-3) i regionie da się przejść (jak Game_Map.checkPassage z RegionLayers, bez zdarzeń)"""
    r = L.RL.get(reg)
    if r == "pod": return True
    if r == "rowno": return False
    for t in reversed(t4):
        f = zest.flag(t)
        if f & 0x10: continue
        return (f & 0x0f) != 0x0f
    return False


def widoczny_mur(i, za=False):
    """kratka z licem muru / dachem / budynkiem (A3, A4 na warstwach 0-1) albo z ozdobami nad podłożem, choć można po niej przejść (górna część muru, blanki)"""
    for z in (0, 1):
        t = i["t"][z]
        if t >= 4352 and kind(t) >= 48: return True
    if za and (i["t"][2] or i["t"][3]): return True            # blanki / ozdoby na przechodnim pasie tuż przed murem (za = mur z blokadą w 1-2 kratkach dalej)
    return i["reg"] in (1, 2, 3) and bool(i["t"][2] or i["t"][3] or i["t"][0] >= 4352 or i["t"][1] >= 4352)


def nat_ok(z):
    return z.natura and not z.przenosi and z.char.startswith(NAT_OK) and not any(n in z.char for n in NAT_NIE)


def sila(M, x, y):
    """0 grunt / 1 las i drzewa / 2 droga, bruk / 3 mur, klif, budynek / -1 woda"""
    i = info(M, x, y)
    if i["woda"]: return -1
    if i["struct"]: return 3
    if i["droga"]: return 2
    if i["las"] or any(z.blokuje and z.natura for z in M.zd if (x, y) in z.komorki()): return 1
    return 0


class Zmiany:
    def __init__(self): self.kratki = {}; self.zd_plus = {}; self.zd_minus = {}
    def kr(self, mid, n=1): self.kratki[mid] = self.kratki.get(mid, 0) + n
    def zp(self, mid, n=1): self.zd_plus[mid] = self.zd_plus.get(mid, 0) + n
    def zm(self, mid, n=1): self.zd_minus[mid] = self.zd_minus.get(mid, 0) + n


def wolne_id(m):
    ev = m["events"]
    i = next((k for k in range(1, min(ZDARZ_MAX, len(ev))) if ev[k] is None), None)
    if i is None and len(ev) < ZDARZ_MAX: i = len(ev)
    return i


def dodaj_zd(m, e, x, y):
    if "--trace" in sys.argv:
        import traceback; print('DODAJ', x, y, e['pages'][0]['image']['characterName'], traceback.extract_stack()[-2].lineno)
    i = wolne_id(m)
    if i is None: return False
    e = copy.deepcopy(e); e["id"] = i; e["x"], e["y"] = x, y
    while len(m["events"]) <= i: m["events"].append(None)
    m["events"][i] = e
    return True


def korytarze(M):
    """kratki przed przejściami na krawędzi (5 w głąb): nie wolno ich zasłaniać"""
    IN = {"N": (0, 1), "S": (0, -1), "W": (1, 0), "E": (-1, 0)}
    out = set()
    for e in M.raw["events"]:
        if not e or not any(c["code"] == 201 for p in e["pages"] for c in p["list"]): continue
        sides = [s for s, on in (("W", e["x"] == 0), ("E", e["x"] == M.W - 1), ("N", e["y"] == 0), ("S", e["y"] == M.H - 1)) if on]
        for s in sides:
            dx, dy = IN[s]
            for j in range(6 if len(sides) == 1 else 2): out.add((e["x"] + dx * j, e["y"] + dy * j))
    return out


# ------------------------------------------------------------------ jeden styk
def przetworz(mid_a, mid_b, kier, lo, hi, maps, work, zrodlo, wzory, zm, log, dotkniete):
    a, b = mid_a, mid_b
    ax, ay, aw, ah = maps[a]; bx, by, bw, bh = maps[b]
    n = hi - lo
    key = "%d|%d" % (a, b)
    MA, MB = L.Mapa(a, raw=work[a]), L.Mapa(b, raw=work[b])          # stan roboczy (strona dopasowywana)
    FA, FB = L.Mapa(a, raw=zrodlo[a]), L.Mapa(b, raw=zrodlo[b])      # stan wyjściowy z data/ (wzór: czytany zawsze z oryginału, więc drugi przebieg daje to samo)
    def koord(M, strona, k, d):
        """kratka k odcinka (wzdłuż styku) na głębokości d od styku, w mapie M (strona 'a' = zachodnia/północna)"""
        if kier == "EW":
            y = lo + k - (ay if strona == "a" else by)
            return (aw - 1 - d, y) if strona == "a" else (d, y)
        x = lo + k - (ax if strona == "a" else bx)
        return (x, ah - 1 - d) if strona == "a" else (x, d)
    # --- wybór wzoru dla każdej kratki odcinka (okno +-1, potem remis: gracz, starsza)
    sa = [sila(FA, *koord(MA, "a", k, 0)) for k in range(n)]
    sb = [sila(FB, *koord(MB, "b", k, 0)) for k in range(n)]
    def pierwsza(): return "a" if (a in PL, -a) > (b in PL, -b) else "b"
    if key in wzory: wz = wzory[key]
    else:
        wz = []
        for k in range(n):
            ra = sum(max(sa[j], 0) ** 2 for j in range(max(0, k - 1), min(n, k + 2)))
            rb = sum(max(sb[j], 0) ** 2 for j in range(max(0, k - 1), min(n, k + 2)))
            wz.append(pierwsza() if ra == rb else ("a" if ra > rb else "b"))
        wzory[key] = wz
    ochr = {a: korytarze(MA), b: korytarze(MB)}
    dirty = {a: set(), b: set()}
    nowe_zd = {a: [], b: []}
    tspec = {a: MA.tsid, b: MB.tsid}
    # ---- pula drzew do uzupełnień i zdarzenia przyrody wzorca
    for k in range(n):
        P, Q = (a, b) if wz[k] == "a" else (b, a)
        MP, MQ = (FA, MB) if wz[k] == "a" else (FB, MA)
        sP, sQ = wz[k], ("b" if wz[k] == "a" else "a")
        mq = work[Q]
        # ludzie / twarda woda: kratki z wodą zostawiamy
        zrobione = {}
        for d in range(GLEB):
            pc, qc = koord(MP, sP, k, d), koord(MQ, sQ, k, d)
            if not (0 <= pc[0] < MP.W and 0 <= pc[1] < MP.H and 0 <= qc[0] < MQ.W and 0 <= qc[1] < MQ.H): break
            ip, iq = info(MP, *pc), info(MQ, *qc)
            if ip["woda"] or iq["woda"]: break
            zdarz_q = [z for z in MQ.zd if qc in z.komorki()]
            tw = [z for z in zdarz_q if not (z.natura and not z.przenosi)]
            chron = qc in ochr[Q] or bool(tw)
            zab_q = zabudowa(MQ, *qc) and Q in PL
            # --- MUR / KLIF (d <= 1): te same kafle po drugiej stronie
            def mur_za(dd):
                """mur z blokadą w kratkach dd..dd+2 wzoru na tym odcinku"""
                for q in range(dd, dd + 3):
                    c_ = koord(MP, sP, k, q)
                    if 0 <= c_[0] < MP.W and 0 <= c_[1] < MP.H and info(MP, *c_)["struct"]: return True
                return False
            vis = lambda i_, dd: i_["struct"] or widoczny_mur(i_, mur_za(dd))
            if vis(ip, d) and d < GLEB_MUR:
                if chron or zab_q: break
                # mur 2 rzędy grubości: przesunięcie (a nie odbicie), żeby baszty i blanki nie rozpadały się na połówki: [P0 P1 | P0 P1]
                ipS = ip
                if GLEB_MUR == 2:
                    ps1 = koord(MP, sP, k, 1 - d)
                    if 0 <= ps1[0] < MP.W and 0 <= ps1[1] < MP.H:
                        i1 = info(MP, *ps1)
                        if vis(i1, 1 - d) and vis(ip, d): ipS = i1
                nt, ok = [], True
                for z_, t in enumerate(ipS["t"]):
                    t2, need = tx(t, MP.tsid, MQ.tsid)
                    if t2 is None: ok = False; break
                    nt.append(t2)
                if not ok: break
                if d == 0 and (not MQ.stoi(*qc)) != (not przechodni(MQ.zest, nt, ipS["reg"])): break       # przejezdność przy styku musi zostać (brama, furtka, drzewo w kratce)
                zmieniony = False
                for z_ in range(4):
                    if W.at(mq, z_, *qc) != nt[z_]: W.put(mq, z_, qc[0], qc[1], nt[z_]); zmieniony = True
                if W.at(mq, 5, *qc) != ipS["reg"]: W.put(mq, 5, qc[0], qc[1], ipS["reg"]); zmieniony = True
                for z in zdarz_q:
                    if z.natura and not z.przenosi and mq["events"][z.id]: mq["events"][z.id] = None; zm.zm(Q); zmieniony = True
                dirty[Q].add(qc)
                if zmieniony: zm.kr(Q)
                zrobione[d] = True
                continue
            # --- LAS-KAFEL wzoru (d <= 1): ten sam podszyt (w zestawie bez blokady: dodatkowo drzewo)
            if ip["las"] and d < GLEB_MUR:
                if chron or zab_q or (d == 0 and not iq["blk"]): break
                nt, drzewo = [], False
                for z_, t in enumerate(ip["t"]):
                    t2, need = tx(t, MP.tsid, MQ.tsid)
                    if t2 is None: nt = None; break
                    nt.append(t2); drzewo = drzewo or need
                if nt is None: break
                zmieniony = False
                for z_ in range(4):
                    if W.at(mq, z_, *qc) != nt[z_]: W.put(mq, z_, qc[0], qc[1], nt[z_]); zmieniony = True
                dirty[Q].add(qc)
                if zmieniony: zm.kr(Q)
                zrobione[d] = True
                if drzewo and przechodni(MQ.zest, nt) and not zdarz_q:
                    # drzewo z puli STAŁEJ (zdarzenia wejściowe tej mapy, potem wzoru; sosny przed innymi): wybór nie zależy od przebiegu
                    pula = []
                    for zr in (zrodlo[Q], zrodlo[P]):
                        pula = [e for e in zr["events"] if e and e["pages"][0]["image"]["characterName"].startswith("!$Pine_") and not any(c["code"] == 201 for p in e["pages"] for c in p["list"])]
                        if pula: break
                    if pula and dodaj_zd(mq, pula[int(h2(qc[0], qc[1], 5) * len(pula))], qc[0], qc[1]): zm.zp(Q)
                continue
            # --- GRUNT: ten sam rodzaj co u wzoru, rzadziej w głąb (szum)
            if not (ip["zwykly"] and iq["zwykly"]): continue
            droga = ip["droga"] or iq["droga"]
            prob = (1.0, 1.0, 1.0, 0.7)[d] if droga else (1.0, 0.9, 0.65, 0.35)[d]
            nz = szum(lo + k + (0 if kier == "NS" else 100 * d), d * 7 + (a % 13), 17 + a + b)
            if d > 0 and nz > prob: continue
            nt = []
            for z_ in (0, 1):
                t2, need = tx(ip["t"][z_], MP.tsid, MQ.tsid)
                if t2 is None: nt = None; break
                nt.append(t2)
            if nt is None: continue
            zmieniony = False
            for z_ in (0, 1):
                if W.at(mq, z_, *qc) != nt[z_]: W.put(mq, z_, qc[0], qc[1], nt[z_]); zmieniony = True
            dirty[Q].add(qc)
            if zmieniony: zm.kr(Q)
    MA, MB = L.Mapa(a, raw=work[a]), L.Mapa(b, raw=work[b])      # świeży stan po zmianach kafli (spójnie z ponownym przebiegiem)
    # ---- przyroda: zamiana obcych rodzajów, dosadzanie tam, gdzie sąsiad ma więcej, nadmiar usuwany
    for k in range(n):
        P, Q = (a, b) if wz[k] == "a" else (b, a)
        MP, MQ = (FA, MB) if wz[k] == "a" else (FB, MA)
        MQf = FB if wz[k] == "a" else FA
        sP, sQ = wz[k], ("b" if wz[k] == "a" else "a")
        mq = work[Q]
        for d in range(GLEB):
            pc, qc = koord(MP, sP, k, d), koord(MQ, sQ, k, d)
            if not (0 <= pc[0] < MP.W and 0 <= pc[1] < MP.H and 0 <= qc[0] < MQ.W and 0 <= qc[1] < MQ.H): break
            ip, iq = info(MP, *pc), info(MQ, *qc)
            if ip["woda"] or iq["woda"] or ip["struct"] or iq["struct"] or iq["droga"]: continue
            if qc in dirty[Q] and d < GLEB_MUR and (ip["las"] or ip["struct"]): continue
            ep = [z for z in MP.zd if nat_ok(z) and (z.x, z.y) == pc]
            eq = [z for z in MQ.zd if (z.x, z.y) == qc]
            eq_n = [z for z in eq if nat_ok(z)]
            if len(eq) != len(eq_n): continue                 # w kratce zdarzenie z treścią: nie ruszamy
            if qc in korytarze(MQ): continue
            if d >= 1 and (qc[0] in (0, MQ.W - 1) or qc[1] in (0, MQ.H - 1)): continue     # kratka krawędzi innego styku: jej przejezdność zostaje
            if ep and not eq:
                if d == 0 and not iq["blk"]: continue         # wolna kratka po drugiej stronie styku: bez przeszkód
                # dosadzenie, gdy u sąsiada jest wyraźnie mniej przyrody w oknie
                okno = [(j, dd) for j in range(max(0, k - 5), min(n, k + 6)) for dd in range(GLEB)]
                cp = sum(1 for (j, dd) in okno for z in MP.zd if nat_ok(z) and (z.x, z.y) == koord(MP, sP, j, dd))
                cq = sum(1 for (j, dd) in okno for z in MQf.zd if nat_ok(z) and (z.x, z.y) == koord(MQf, sQ, j, dd))      # gęstość wejściowa sąsiada (stała między przebiegami)
                if cq < cp * 0.8 and h2(qc[0], qc[1], 31 + Q) < 0.75 and not zabudowa(MQ, *qc):
                    if dodaj_zd(mq, ep[0].e, qc[0], qc[1]): zm.zp(Q)
            elif ep and eq_n:
                z = eq_n[0]
                if z.char.split("_")[0] != ep[0].char.split("_")[0] and mq["events"][z.id] is not None:
                    mq["events"][z.id] = None
                    if dodaj_zd(mq, ep[0].e, qc[0], qc[1]): pass
                    else: zm.zm(Q)
    for mid_ in (a, b): dotkniete.setdefault(mid_, set()).update(dirty[mid_])
    # ---- kontrola: przejezdność przy samym styku musi dalej się zgadzać
    MA2, MB2 = L.Mapa(a, raw=work[a]), L.Mapa(b, raw=work[b])
    zle = 0
    for k in range(n):
        ca, cb = koord(MA2, "a", k, 0), koord(MB2, "b", k, 0)
        if info(MA2, *ca)["woda"] or info(MB2, *cb)["woda"]: continue
        if MA2.stoi(*ca) != MB2.stoi(*cb):
            before = (MA.stoi(*ca), MB.stoi(*cb))
            if before[0] == before[1]:
                zle += 1
                if "--diag" in sys.argv:
                    for (M0, M1, c, mm) in ((MA, MA2, ca, a), (MB, MB2, cb, b)):
                        log("   %d %s przed %s po %s kafle %s -> %s zd %s -> %s" % (mm, c, M0.stoi(*c), M1.stoi(*c), [M0.t(z, *c) for z in range(4)], [M1.t(z, *c) for z in range(4)],
                            [(e.id, e.char) for e in M0.zd if c in e.komorki()], [(e.id, e.char) for e in M1.zd if c in e.komorki()]))
    if zle: log("  UWAGA styk %d|%d: %d kratek zmieniło przejezdność względem stanu wejściowego" % (a, b, zle))


def cofnij_zmiany_przejezdnosci(work, orig, maps, log):
    """kratki krawędzi, których przejezdność zmieniła się względem wejścia (narożniki dwóch styków): cofnięte do stanu wejściowego (kafle, region, zdarzenia)"""
    ile = 0
    for mid in maps:
        if work[mid] == orig[mid]: continue
        M1, M0 = L.Mapa(mid, raw=work[mid]), L.Mapa(mid, raw=orig[mid])
        W_, H_ = M1.W, M1.H
        kr = [(x, y) for y in range(H_) for x in range(W_) if (x in (0, W_ - 1) or y in (0, H_ - 1)) and M1.stoi(x, y) != M0.stoi(x, y)]
        if not kr: continue
        m = work[mid]
        for (x, y) in kr:
            for z_ in range(4): W.put(m, z_, x, y, W.at(orig[mid], z_, x, y))
            W.put(m, 5, x, y, W.at(orig[mid], 5, x, y))
            for e in M1.zd:
                if (x, y) in e.komorki() and not (e.id < len(orig[mid]["events"]) and orig[mid]["events"][e.id] == m["events"][e.id]): m["events"][e.id] = None
            for e in M0.zd:
                if (x, y) in e.komorki() and not (e.id < len(m["events"]) and m["events"][e.id] == orig[mid]["events"][e.id]):
                    while len(m["events"]) <= e.id: m["events"].append(None)
                    if m["events"][e.id] is None: m["events"][e.id] = copy.deepcopy(orig[mid]["events"][e.id])
                    else: dodaj_zd(m, orig[mid]["events"][e.id], e.x, e.y)
        ile += len(kr)
        log("  cofnięto %d kratek krawędzi mapy %d (narożnik dwóch styków zmieniał przejezdność)" % (len(kr), mid))
    return ile


def main():
    maps = {k: v for k, v in mapy_swiata().items() if os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % k))}
    os.makedirs(DATA, exist_ok=True)
    if not POWTORZ:
        for f in os.listdir(DATA):
            if f.startswith("Map") and f.endswith(".json"): os.remove(os.path.join(DATA, f))
    wzp = os.path.join(STG, "wzory.json")
    wzory = json.load(open(wzp)) if (POWTORZ and os.path.exists(wzp)) else {}
    work, orig, sumy, zrodlo = {}, {}, {}, {}
    for mid in maps:
        work[mid] = wczytaj(mid)
        zrodlo[mid] = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
        orig[mid] = copy.deepcopy(work[mid])
        sumy[str(mid)] = hashlib.sha256(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "rb").read()).hexdigest()
    zm = Zmiany(); rap = []; dotkniete = {}
    def log(s): rap.append(s); print(s)
    for (a, b, kier, lo, hi) in pary(maps):
        przetworz(a, b, kier, lo, hi, maps, work, zrodlo, wzory, zm, log, dotkniete)
    cofnij_zmiany_przejezdnosci(work, orig, maps, log)
    # kształty autokafli podłoża wokół kratek dotkniętych (jedno przejście na końcu po kratkach dotkniętych przez budowę: wynik zależy tylko od rodzajów, więc powtórzenie nic nie zmienia)
    for mid in maps:
        m, z0 = work[mid], zrodlo[mid]
        Wd, Hd = m["width"], m["height"]
        zm_ = dotkniete.get(mid, set())
        if zm_:
            for z_ in (0, 1): W.reshape(m, z_, W.ring(zm_, 1))
    zmienione = sorted(m for m in maps if work[m] != orig[m])
    # zapis (binarnie, w układzie edytora)
    roznych = 0
    for mid in zmienione:
        pl_ = os.path.join(DATA, "Map%03d.json" % mid); nowy = W.json_text(work[mid], "map")
        if POWTORZ and (not os.path.exists(pl_) or open(pl_, "rb").read() != nowy): roznych += 1
        open(pl_, "wb").write(nowy)
    # kopie plików, na których opiera się kontrakt krawędzi (z poprzedniego stagingu; bez zmian)
    base = os.path.join(ROOT, "tools", "swiat", "styki", "staging")
    for f in ("uklad.json", "swiat_uklad.json", "ogon_styki.json"):
        if os.path.exists(os.path.join(base, f)): open(os.path.join(STG, f), "wb").write(open(os.path.join(base, f), "rb").read())
    if not POWTORZ:
        json.dump(wzory, open(wzp, "w"))
        json.dump(sumy, open(os.path.join(STG, "sumy.json"), "w"), indent=1)
        json.dump({"zmienione": zmienione, "nowe": []}, open(os.path.join(STG, "zmienione.json"), "w"))
    log("zmienione mapy (%d): %s" % (len(zmienione), zmienione))
    for mid in zmienione:
        ile_zd = lambda m: sum(1 for e in m["events"] if e)
        log("  mapa %d%s: kratek zmienionych (z powtórzeniami przy styku) %d, zdarzeń +%d -%d (łącznie %d -> %d)" % (
            mid, " [gracz]" if mid in PL else "", zm.kratki.get(mid, 0), zm.zd_plus.get(mid, 0), zm.zd_minus.get(mid, 0), ile_zd(orig[mid]), ile_zd(work[mid])))
    open(os.path.join(STG, "raport_budowy.txt"), "w", encoding="utf-8").write("\n".join(rap))
    if POWTORZ: print("POWTÓRZENIE: map zmienionych względem stagingu z poprzedniego przebiegu (ma być 0):", roznych)


if __name__ == "__main__":
    main()
