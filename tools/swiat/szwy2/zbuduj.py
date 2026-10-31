# -*- coding: utf-8 -*-
"""SZWY ŚWIATA, RUNDA 2: buduje w tools/swiat/szwy2/staging/ kopie map poprawione na szwach (data/ i js/ nie są ruszane).
Punkt wyjścia: ZAINSTALOWANE data/ (pierwsza runda szwów już w nim jest).
  1. GRUNT W KRATCE KRAWĘDZI: arkusze A2 zestawów 9 i 11 są w większości identyczne piksel w piksel (mapa_a2.json); różnią się rodzaje 34, 35, 46, 47
     (i blokada lasów 20, 22, 30, 38 w zestawie 11). Na każdym chodliwym odcinku szwu obie kratki krawędzi dostają TEN SAM grunt (para warstw 0-1):
     wzór (wzory.json pierwszej rundy) ma pierwszeństwo; rodzaje spoza wspólnych zastępowane po kolorze tylko tam, gdzie brak odpowiednika.
  2. PAS PRZEJŚCIA 5 kratek (razem z krawędzią 6): grunt wzoru wnika w głąb drugiej mapy z rosnącym prawdopodobieństwem malejącym w głąb (szum świata, bez linii).
  3. LAS / PODSZYT: ciemny rząd koron przy krawędzi naprzeciw drzew (kratka zablokowana zdarzeniem przyrody): pod drzewami po drugiej stronie ten sam podszyt.
  4. SKRAJE: drzewa i zdarzenia przyrody przecięte krawędzią, urwane drogi (patrz zbuduj.py: poprawki_szwow).
Tylko kafle (zdarzeń nie przybywa). Mapy 13 i 120 zostają bez zmian (szwy z nimi pomijane).
Nigdy: nowa woda, rośliny na murze/dachu/bruku, ruszanie zdarzeń z treścią, przejść, korytarzy przed bramami, zabudowy mapy gracza.
  python tools/swiat/szwy2/zbuduj.py            (od zera z data/ -> staging)
  python tools/swiat/szwy2/zbuduj.py --powtorz  (drugi przebieg NA WYNIKU stagingu: ma dać 0 zmian)"""
import os, sys, json, copy, math, random, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ARGV = list(sys.argv); sys.argv = sys.argv[:1]          # (szwy/zbuduj_szwy.py czyta sys.argv przy imporcie)
for p in (os.path.join(ROOT, "tools", "mapy"), os.path.join(ROOT, "tools", "rozszerzenia"), os.path.join(ROOT, "tools", "swiat", "szwy")): sys.path.insert(0, p)
import numpy as np
import mapylib as L
import wspolne as W
import zbuduj_szwy as Z
sys.argv = ARGV
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

STG = os.path.join(HERE, "staging"); DATA = os.path.join(STG, "data")
POWTORZ = "--powtorz" in sys.argv
ZRODLO = DATA if POWTORZ else os.path.join(ROOT, "data")
PL = Z.PL
POMIN = {13, 120}                       # maps being reworked by someone else: their seams stay as they are
GLEB_PAS = 6                            # kratki: krawędź + 5 w głąb
PAS_P = (1.0, 1.0, 0.75, 0.5, 0.3, 0.12)   # prawdopodobieństwo gruntu wzoru na głębokości 0..5 (przy szumie ~0.5)

# ------------------------------------------------------------------ rodzaje A2 zestawów 9 i 11
z9, z11 = L.zestaw(9), L.zestaw(11)
ZEST = {9: z9, 11: z11}


def _sig(z, k): return [np.asarray(z.tile(2048 + k * 48 + s)).tobytes() for s in (0, 46, 47)]


def _kol(z, k):
    im = np.asarray(z.tile(2048 + k * 48 + 47).convert("RGBA"), float); a = im[..., 3] > 0
    return im[..., :3][a].mean(0) if a.any() else None


def mapa_rodzajow():
    """{k: rodzaj w zestawie 11 o identycznych obrazkach, albo None}"""
    return {k: next((k2 for k2 in range(16, 48) if _sig(z9, k) == _sig(z11, k2)), None) for k in range(16, 48)}


M_A2 = mapa_rodzajow()
# wspólne: te same obrazki piksel w piksel w obu arkuszach I przechodnie w obu zestawach (w zestawie 11 lasy 20, 22, 30, 38 blokują)
WSPOLNE = {k for k in range(16, 48) if M_A2[k] == k and not (z9.flag(2048 + k * 48) & 0x0f) and not (z11.flag(2048 + k * 48) & 0x0f)}
# rodzaje bez odpowiednika (inny obrazek albo inna przejezdność): najbliższy kolor ze wspólnych (liczone raz, patrz wynik w mapa_a2.json)
ZAST = {}
for ts, z in ((9, z9), (11, z11)):
    for k in range(16, 48):
        if k in WSPOLNE: continue
        c = _kol(z, k)
        if c is None: continue
        best = sorted((float(np.linalg.norm(c - _kol(z11, k2))), k2) for k2 in WSPOLNE if _kol(z11, k2) is not None)[0]
        ZAST[(ts, k)] = best
NIE_RUSZAJ = {22, 30, 38}               # płoty / palisada (kolor nic nie mówi): kratek z nimi nie dopasowujemy
ZAST_DOPUSZCZ = 45.0                    # odległość koloru, do której zastępnik jest uczciwy (reszta: kratka zostaje)


SAME = False                    # styk dwóch map tego samego zestawu kafli: wszystkie rodzaje A2 są wspólne (bez zastępowania)


def klucz_kafla(ts, t):
    """(klucz, ok): klucz = rodzaj wspólny (po ewentualnym zastąpieniu) albo ('t', id) dla A5; ok False = kafla nie da się przenieść"""
    if t == 0: return 0, True
    if SAME:
        if 2816 <= t < 2816 + 32 * 48: return (t - 2048) // 48, True
        if 1536 <= t < 1664: return ("t", t), True
        return None, False
    if 2816 <= t < 4352:
        k = (t - 2048) // 48
        if k in WSPOLNE: return k, True
        if k in NIE_RUSZAJ: return None, False
        z = ZAST.get((ts, k))
        if z is None or z[0] > ZAST_DOPUSZCZ: return None, False
        return z[1], True
    if 1536 <= t < 1664 and z9.flag(t) == z11.flag(t): return ("t", t), True
    return None, False


def tile_z_klucza(k):
    if k == 0: return 0
    if isinstance(k, tuple): return k[1]
    return 2048 + k * 48


def surowy(t):
    """rodzaj kafla bez zastępowania: 0, rodzaj A2 albo ('t', id) dla pozostałych"""
    if t == 0: return 0
    if 2816 <= t < 4352: return (t - 2048) // 48
    return ("t", t)


# ------------------------------------------------------------------ szum
def szum2(wx, wy, seed):
    """dwuoktawowy szum świata 0..1 (ciągły przez styk)"""
    return (4.0 * Z.szum(wx, wy, seed, 4.5) + 2.3 * Z.szum(wx, wy, seed + 5, 2.2)) % 1.0


# ------------------------------------------------------------------ pomocnicze
def zd_komorki(M, x, y): return [z for z in M.zd if (x, y) in z.komorki()]


def tylko_przyroda(M, x, y):
    return all(z.natura and not z.przenosi for z in zd_komorki(M, x, y))


def para_kafli(M, x, y):
    """(klucz0, klucz1) gruntu kratki (warstwy 0 i 1) albo None, gdy czegoś nie da się przenieść"""
    k0, o0 = klucz_kafla(M.tsid, M.t(0, x, y)); k1, o1 = klucz_kafla(M.tsid, M.t(1, x, y))
    if not (o0 and o1) or k0 == 0: return None
    return (k0, k1)


def kratka_gruntu(M, x, y, gracz, kor):
    """zwykła chodliwa kratka z gruntem (bez muru, wody, budynku, regionu, zdarzeń z treścią, korytarza przed bramą na mapie gracza)"""
    if not M.inside(x, y): return False
    i = Z.info(M, x, y)
    if i["woda"] or i["blk"] or i["struct"] or i["las"] or i["reg"] in (1, 2, 3) or Z.zabudowa(M, x, y): return False
    if M.t(2, x, y) >= 4352 or M.t(3, x, y) >= 4352: return False
    if not tylko_przyroda(M, x, y): return False
    if gracz and (x, y) in kor: return False
    if (x, y) in M.ev_block() and not all(z.natura for z in M.ev_block()[(x, y)]): return False
    return para_kafli(M, x, y) is not None


def zaloz(M, x, y, para):
    """ustawia grunt (warstwy 0-1) kratki (kształt autokafla poprawia reshape na końcu); True, gdy coś się zmieniło"""
    zm = False
    for z_, k in ((0, para[0]), (1, para[1])):
        if surowy(M.t(z_, x, y)) == k: continue
        W.put(M.raw, z_, x, y, tile_z_klucza(k)); zm = True
    return zm


BRUK = {18, 19, 23, 32, 33, 39, 40, 41, 42, 43, 44, 45}     # rodzaje A2: bruk, deski, kamień (droga, nie grunt płatu)
ZIEMIA = {17, 24, 26}                                       # ziemia: płat (duża plama) zamieniamy, wąską drogę zostawiamy
_zk = {}


def wierzch(M, x, y):
    """rodzaj A2 na wierzchu kratki (warstwa 1, potem 0) albo ('t', id) dla A5 / 0"""
    for z_ in (1, 0):
        t = M.t(z_, x, y)
        if 2816 <= t < 2816 + 32 * 48: return (t - 2048) // 48
        if t >= 1536 and t < 1664: return ("t", t)
    return 0


def plama_ziemi(M, x, y):
    """rozmiar 4-spójnej plamy ziemi (rodzaje 17, 24, 26 na wierzchu), do której należy kratka (z wejścia budowy: stały)"""
    key = M.id
    if key not in _zk:
        d = {}; seen = set()
        for yy in range(M.H):
            for xx in range(M.W):
                if (xx, yy) in seen or wierzch(M, xx, yy) not in ZIEMIA: continue
                st_ = [(xx, yy)]; seen.add((xx, yy)); comp = []
                while st_:
                    cx, cy = st_.pop(); comp.append((cx, cy))
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        q = (cx + dx, cy + dy)
                        if q not in seen and M.inside(*q) and wierzch(M, *q) in ZIEMIA: seen.add(q); st_.append(q)
                for q in comp: d[q] = len(comp)
        _zk[key] = d
    return _zk[key].get((x, y), 0)


def wymienialna(M, x, y):
    """zwykły grunt płatu: trawa, krzaki, kwiaty albo ziemia z dużej plamy (nie bruk, nie wąska droga, nie A5)"""
    w = wierzch(M, x, y)
    if isinstance(w, tuple) or w in BRUK: return False
    if w in ZIEMIA: return plama_ziemi(M, x, y) >= 40
    return True


def przejezdnosc_ok(M, x, y):
    """kratka po zmianie dalej chodliwa (kafle jak checkPassage)"""
    return M.kratka_wolna(x, y)


# ------------------------------------------------------------------ jeden styk
def styk(a, b, kier, lo, hi, maps, MM, wzory, st, dirty):
    ax, ay, aw, ah = maps[a]; bx, by, bw, bh = maps[b]
    n = hi - lo; key = "%d|%d" % (a, b)
    wz = wzory.get(key)
    def koord(strona, k, d):
        if kier == "EW":
            y = lo + k - (ay if strona == "a" else by)
            return (aw - 1 - d, y) if strona == "a" else (d, y)
        x = lo + k - (ax if strona == "a" else bx)
        return (x, ah - 1 - d) if strona == "a" else (x, d)
    def swiat(strona, k, d):
        c = koord(strona, k, d); o = maps[a if strona == "a" else b]
        return (c[0] + o[0], c[1] + o[1])
    global SAME
    SAME = MM[a].tsid == MM[b].tsid
    mp = {"a": MM[a], "b": MM[b]}; kor = {"a": Z.korytarze(MM[a]) if a in PL else set(), "b": Z.korytarze(MM[b]) if b in PL else set()}
    mid = {"a": a, "b": b}
    # --- 1. krawędź: ten sam grunt po obu stronach
    T = {}
    for k in range(n):
        ca, cb = koord("a", k, 0), koord("b", k, 0)
        Ma, Mb = mp["a"], mp["b"]
        if not (Ma.inside(*ca) and Mb.inside(*cb)): continue
        if not (Ma.stoi(*ca) and Mb.stoi(*cb)): continue
        if not (kratka_gruntu(Ma, *ca, a in PL, kor["a"]) and kratka_gruntu(Mb, *cb, b in PL, kor["b"])): continue
        pa, pb = para_kafli(Ma, *ca), para_kafli(Mb, *cb)
        ra = (surowy(Ma.t(0, *ca)), surowy(Ma.t(1, *ca))); rb = (surowy(Mb.t(0, *cb)), surowy(Mb.t(1, *cb)))
        P = (wz[k] if wz and k < len(wz) else ("a" if (a in PL, -a) > (b in PL, -b) else "b"))
        pw = pa if P == "a" else pb
        T[k] = pw
        if ra == rb == pw: continue                 # już ten sam grunt (rodzaje wspólne)
        for s_ in ("a", "b"):
            M = mp[s_]; c = koord(s_, k, 0)
            stare = [M.t(z_, *c) for z_ in range(4)]
            if not zaloz(M, *c, pw): continue
            if not przejezdnosc_ok(M, *c):
                for z_ in range(4): W.put(M.raw, z_, c[0], c[1], stare[z_])
                T.pop(k, None); continue
            dirty[mid[s_]].add(c); st.kr(mid[s_])
    # --- 2. pas przejścia: płat gruntu wzoru wnika w mapę Q na głębokość 2-6 kratek (zmienną wzdłuż szwu), granica z szumu świata
    ziemne = {17, 24, 26}                          # rodzaje ziemi: płat tylko gdy ciąg >= 5 kratek wzdłuż szwu (krótszy to droga, nie płat)
    def klasa(t): return "z" if t[0] in ziemne else "t"
    dlugosc = {}
    k = 0
    while k < n:
        if k not in T: k += 1; continue
        j = k
        while j + 1 < n and (j + 1) in T and klasa(T[j + 1]) == klasa(T[k]): j += 1
        for q in range(k, j + 1): dlugosc[q] = j - k + 1
        k = j + 1
    # pasy jednorzędowe u wzoru (własny grunt krawędzi różny od rzędów 1 i 2, ciąg > 3): wzór też dostaje płat w głąb, inaczej zostaje prosta linia
    def para_(M, c): return tuple(klucz_kafla(M.tsid, M.t(z_, *c))[0] for z_ in (0, 1))
    pas = {}
    for k in range(n):
        P_ = (wz[k] if wz and k < len(wz) else ("a" if (a in PL, -a) > (b in PL, -b) else "b"))
        cs = [koord(P_, k, d) for d in range(3)]
        if all(mp[P_].inside(*c_) and mp[P_].stoi(*c_) for c_ in cs):
            p0, p1, p2 = (para_(mp[P_], c_) for c_ in cs)
            pas[k] = p0 != p1 and p1 == p2
    pas_k = set()
    k = 0
    while k < n:
        if not pas.get(k): k += 1; continue
        j = k
        while j + 1 < n and pas.get(j + 1): j += 1
        if j - k + 1 > 3: pas_k.update(range(k, j + 1))
        k = j + 1
    for k in range(n):
        if k not in T: continue
        P = (wz[k] if wz and k < len(wz) else ("a" if (a in PL, -a) > (b in PL, -b) else "b"))
        t = T[k]
        if t[0] == 0 or isinstance(t[0], tuple) or isinstance(t[1], tuple): continue
        if klasa(t) == "z" and dlugosc.get(k, 0) < 5: continue
        if wierzch(mp[P], *koord(P, k, 0)) in BRUK or t[1] in BRUK: continue
        wk = lo + k
        g = min(1.0, max(0.0, (Z.szum(wk, 40.5, 23 + a + b, 4.0) - 0.2) / 0.6))
        glebia = 1.8 + 3.2 * g
        for Q in (("a", "b") if k in pas_k else (("b",) if P == "a" else ("a",))):
          M = mp[Q]
          for d in range(1, GLEB_PAS):
              c = koord(Q, k, d)
              if not M.inside(*c): break
              wx, wy = swiat(Q, k, d)
              nz = szum2(wx, wy, 11 + (a % 7) + (b % 5))      # szum świata (skala 4 i 2 kratki): ten sam po obu stronach
              if d >= 2 and nz >= PAS_P[d]: continue
              if not kratka_gruntu(M, *c, mid[Q] in PL, kor[Q]): continue
              if not wymienialna(M, *c): continue
              cur = para_kafli(M, *c)
              if cur == t: continue
              stare = [M.t(z_, *c) for z_ in range(4)]
              zaloz(M, *c, t)
              if not przejezdnosc_ok(M, *c):
                  for z_ in range(4): W.put(M.raw, z_, c[0], c[1], stare[z_])
                  continue
              if [M.t(z_, *c) for z_ in range(4)] != stare: dirty[mid[Q]].add(c); st.kr(mid[Q])
    # --- 3. las-podszyt wzoru pod drzewami po drugiej stronie (ten sam ciemny podszyt zamiast gołej trawy)
    for k in range(n):
        for (P, Q) in (("a", "b"), ("b", "a")):
            for d in (0, 1):
                cp, cq = koord(P, k, d), koord(Q, k, d)
                Mp, Mq = mp[P], mp[Q]
                if not (Mp.inside(*cp) and Mq.inside(*cq)): continue
                ip = Z.info(Mp, *cp)
                if not ip["las"] or d == 1 and not Z.info(Mp, *koord(P, k, 0))["las"]: continue
                if Mq.stoi(*cq) or Mq.kratka_wolna(*cq) is None: continue
                iq = Z.info(Mq, *cq)
                if iq["woda"] or iq["blk"] or iq["struct"] or iq["las"] or iq["reg"] in (1, 2, 3) or Z.zabudowa(Mq, *cq): continue      # chodzi o kratki zablokowane TYLKO zdarzeniem przyrody (drzewo)
                zq = [z for z in Mq.ev_block().get(cq, [])]
                if not zq or not all(z.natura and not z.przenosi for z in zq): continue
                if mid[Q] in PL and cq in kor[Q]: continue
                if d == 1 and Z.h2(*cq, 77) > 0.7: continue
                pq = para_kafli(Mp, *cp)
                if pq is None: continue
                stare = [Mq.t(z_, *cq) for z_ in range(4)]
                if zaloz(Mq, *cq, pq):
                    dirty[mid[Q]].add(cq); st.kr(mid[Q])


class Zm:
    def __init__(self): self.kratki = {}
    def kr(self, mid, n=1): self.kratki[mid] = self.kratki.get(mid, 0) + n


def main():
    maps = {k: v for k, v in Z.mapy_swiata().items() if os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % k))}
    os.makedirs(DATA, exist_ok=True)
    if not POWTORZ:
        for f in os.listdir(DATA):
            if f.startswith("Map") and f.endswith(".json"): os.remove(os.path.join(DATA, f))
    wzory = json.load(open(os.path.join(ROOT, "tools", "swiat", "szwy", "staging", "wzory.json")))
    work, orig, sumy = {}, {}, {}
    for mid in maps:
        p = os.path.join(ZRODLO, "Map%03d.json" % mid)
        if not os.path.exists(p): p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        raw = open(p, "rb").read(); work[mid] = json.loads(raw.decode("utf-8"))
        assert W.map_text(work[mid]).encode("utf-8") == raw, "Map%03d nie w układzie edytora" % mid
        orig[mid] = copy.deepcopy(work[mid])
        sumy[str(mid)] = hashlib.sha256(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "rb").read()).hexdigest()
    from poprawki import przed_szwami, poprawki_szwow
    st = Zm()
    for przebieg in range(6):
        # kilka przebiegów aż do stanu ustalonego (rogi dwóch styków zależą od kolejności): wynik jest punktem stałym, więc powtórka daje 0 zmian
        przed = copy.deepcopy(work)
        _zk.clear()
        MM = {mid: L.Mapa(mid, raw=work[mid]) for mid in maps}
        dirty = {mid: set() for mid in maps}
        przed_szwami(maps, MM, work, dirty, st)
        for (a, b, kier, lo, hi) in Z.pary(maps):
            if a in POMIN or b in POMIN: continue
            styk(a, b, kier, lo, hi, maps, MM, wzory, st, dirty)
        poprawki_szwow(maps, MM, work, orig, dirty, st)
        for mid in maps:
            for z_ in (0, 1):
                if dirty[mid]: W.reshape(work[mid], z_, W.ring(dirty[mid], 1))
        if work == przed: break
    print("przebiegów do stanu ustalonego:", przebieg + 1)
    zmienione = sorted(m for m in maps if work[m] != orig[m])
    roznych = 0
    for mid in zmienione:
        pl_ = os.path.join(DATA, "Map%03d.json" % mid); nowy = W.json_text(work[mid], "map")
        if POWTORZ and (not os.path.exists(pl_) or open(pl_, "rb").read() != nowy): roznych += 1
        open(pl_, "wb").write(nowy)
    base = os.path.join(ROOT, "tools", "swiat", "szwy", "staging")
    for f in ("uklad.json", "swiat_uklad.json", "ogon_styki.json"):
        if os.path.exists(os.path.join(base, f)): open(os.path.join(STG, f), "wb").write(open(os.path.join(base, f), "rb").read())
    rap = []
    def log(s): rap.append(s); print(s)
    if not POWTORZ:
        json.dump(sumy, open(os.path.join(STG, "sumy.json"), "w"), indent=1)
        json.dump({"zmienione": zmienione, "nowe": []}, open(os.path.join(STG, "zmienione.json"), "w"))
    json.dump({"identyczne_9_11": {str(k): v for k, v in M_A2.items()}, "wspolne_przechodnie": sorted(WSPOLNE),
               "zastepniki": {"%d:%d" % kk: {"na": v[1], "odleglosc_koloru": round(v[0], 1)} for kk, v in ZAST.items()}},
              open(os.path.join(STG, "mapa_a2.json"), "w"), indent=1)
    log("zmienione mapy (%d): %s" % (len(zmienione), zmienione))
    for mid in zmienione:
        ile = lambda m: sum(1 for e in m["events"] if e)
        roznica = sum(1 for i, v in enumerate(work[mid]["data"]) if v != orig[mid]["data"][i])
        log("  mapa %d%s: pól danych zmienionych %d, zdarzeń %d -> %d" % (mid, " [gracz]" if mid in PL else "", roznica, ile(orig[mid]), ile(work[mid])))
    open(os.path.join(STG, "raport_budowy.txt"), "w", encoding="utf-8").write("\n".join(rap))
    if POWTORZ: print("POWTÓRZENIE: map zmienionych względem stagingu z poprzedniego przebiegu (ma być 0):", roznych)


if __name__ == "__main__":
    main()
