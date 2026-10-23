# -*- coding: utf-8 -*-
"""PRZEPIĘCIE WSZYSTKIEGO NA NOWE MIASTO (Map008) - jeden powtarzalny skrypt instalacji (2026-10-22).

Mapa miasta została przebudowana w kopii roboczej (tools/miasto2/build.py -> tools/miasto2/staging/Map008.json). Wszystko,
co w grze jest przypięte do starych współrzędnych mapy 8 (docs/miasteczko/POWIAZANIA_MAP008.md: wtyczki A, przeniesienia
z innych map B, testy i narzędzia C), ten skrypt przepina naraz na nowe kratki. Nowe wartości biorą się WYŁĄCZNIE z:
  tools/miasto2/mapowanie.json   (bloki z przesunięciami, zdarzenia stare -> nowe, SPOTS TownLife, punkty wtyczek, strefy)
  tools/miasto2/budynki.json     (drzwi: id, kratka, kratka przed drzwiami, wnętrze)
  tools/miasto2/wnetrza/meta.json (nowe wnętrza 178-190: nazwy, wyjścia)
  tools/miasto2/staging/Map008.json (sprawdzanie przejść, pozycje zdarzeń nowej mapy)
Po zmianie układu wystarczy przebudować mapę (build.py) i uruchomić skrypt ponownie (na nietkniętym projekcie).

Każda zmiana ma warunek starej wartości: stary tekst / stare parametry muszą się zgadzać dokładnie (tyle wystąpień, ile
trzeba); jeśli nie - zmiana jest zgłaszana i pomijana (skrypt nie zgaduje). Jeśli zamiast starej wartości stoi już nowa,
zmiana jest liczona jako „już przepięta” (ponowne uruchomienie po instalacji niczego nie psuje).

Użycie (przy ZAMKNIĘTYM edytorze RPG Maker MZ; koordynator):
  python tools/miasto2/przepnij.py                 próba: nic nie zapisuje, wypisuje każdą zmianę (plik, linia, stare -> nowe)
                                                   i zapisuje raport tools/miasto2/przepnij_raport.md
  python tools/miasto2/przepnij.py --wykonaj       zapis: najpierw kopie zapasowe zmienianych plików do
                                                   ..\\Tawerna_archiwum_2026-10-18\\dane_przed_nowym_miastem\\<czas>\\
  opcje: --katalog DIR   projekt (albo jego kopia) do przepięcia (domyślnie ten, w którym leży skrypt)
         --archiwum DIR  gdzie kopie zapasowe (domyślnie jak wyżej; przy --katalog innym niż projekt: DIR_archiwum obok kopii)
         --bez-testow    pomiń testy i narzędzia (tylko gra: mapy + wtyczki)
         --cicho         nie wypisuj każdej zmiany (tylko podsumowanie)
Kroki: (1) instaluj mapy: data/Map008.json <- staging (tylko gdy data/Map008.json ma sumę z tools/miasto2/sha_przed.txt, czyli
nie zmieniła się od budowy), data/Map178-190.json <- tools/miasto2/wnetrza/, MapInfos.json: 13 wpisów (rodzic 8);
(2) przeniesienia na mapę 8 z innych map (kod 201); (3) wtyczki js/plugins; (4) narzędzia i testy; (5) ostrzeżenia na górze
starych generatorów tools/town/*. Pliki zapisywane binarnie: końce linii (LF / CRLF) każdego pliku zostają; mapy w układzie
edytora (tools/mapy/popraw.py tekst_mapy) - plik w innym układzie dostaje tylko podmianę liczb w miejscu.
"""
import os, sys, re, json, hashlib, datetime, argparse, subprocess, collections

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(PROJ, "tools", "mapy"))
import mapylib as L   # noqa: E402  (przejścia jak w grze - tylko do sprawdzania nowych kratek)

ARCHIWUM = os.path.abspath(os.path.join(PROJ, "..", "Tawerna_archiwum_2026-10-18", "dane_przed_nowym_miastem"))
SHA_PLIK = os.path.join(HERE, "sha_przed.txt")
MAPA = 8


def wczytaj(p):
    with open(p, "rb") as f:
        return f.read()


def json_z(p):
    return json.loads(wczytaj(p).decode("utf-8-sig"))


def sha(b):
    return hashlib.sha256(b).hexdigest()


def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def tekst_mapy(raw):
    """układ edytora RPG Maker MZ (jak tools/mapy/popraw.py): własności w jednej linii, data, jedno zdarzenie w linii"""
    props = {k: v for k, v in raw.items() if k not in ("data", "events")}
    ev = raw["events"]
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(raw["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(ev) - 1 else "") for i, e in enumerate(ev)]
    lines += ["]", "}"]
    return "\n".join(lines).encode("utf-8")


def tekst_mapinfos(lst):
    return ("[\n" + ",\n".join(dump(e) for e in lst) + "\n]").encode("utf-8")


def edytor_otwarty():
    """RPG Maker MZ (RPGMZ.exe) działa? (tasklist; przy błędzie - na wszelki wypadek tak)"""
    try:
        out = subprocess.run(["tasklist", "/FO", "CSV", "/NH"], capture_output=True, text=True, timeout=30).stdout
    except Exception:
        return True
    return bool(re.search(r'"RPGMZ\.exe"', out, re.I))


# ================================================================================================ mapowanie stare -> nowe

class BladMapowania(Exception):
    pass


class Mapowanie:
    """czyta mapowanie.json, budynki.json, meta.json i nową mapę; P(x, y) = nowa kratka starej kratki"""

    def __init__(self):
        self.m = json_z(os.path.join(HERE, "mapowanie.json"))
        self.bud = json_z(os.path.join(HERE, "budynki.json"))["budynki"]
        self.meta = json_z(os.path.join(HERE, "wnetrza", "meta.json"))["mapy"]
        self.nowa_bajty = wczytaj(os.path.join(HERE, "staging", "Map008.json"))
        self.nowa = json.loads(self.nowa_bajty.decode("utf-8"))
        self.bloki = self.m["a_bloki"]
        self.zd = {int(k): v for k, v in self.m["b_zdarzenia"]["zachowane"].items()}
        self.spots = self.m["c_miejsca"]["TownLife_SPOTS"]
        self.nowe_miejsca = self.m["c_miejsca"]["nowe_miejsca"]
        self.punkty = self.m["c_miejsca"]["punkty_wtyczek"]
        self.strefy = self.m["d_strefy"]
        # wiersze za murem (od tego y w dół): teren zostaje jak był, stara kratka = nowa
        self.za_murem = max(b["nowy"][3] for b in self.bloki if "nowy" in b) + 1
        self._mp = None
        # jednoznaczne słowniki stare -> nowe
        self.drzwi = {}
        for b in self.bud:
            if b.get("stare_drzwi"):
                sx, sy = b["stare_drzwi"]
                self.drzwi[(sx, sy)] = tuple(b["drzwi"])
                self.drzwi[(sx, sy + 1)] = tuple(b["przed_drzwiami"])
        self.po_zd = self._jedn((tuple(v["stare"]), tuple(v["nowe"])) for v in self.zd.values())
        self.po_spot = self._jedn((tuple(v["stare"][:2]), tuple(v["nowe"][:2])) for v in self.spots.values())
        self.po_pkt = self._jedn((tuple(v["stare"]), tuple(v["nowe"])) for v in self.punkty)

    @staticmethod
    def _jedn(pary):
        d = collections.defaultdict(set)
        for s, n in pary:
            d[s].add(n)
        return {s: next(iter(n)) for s, n in d.items() if len(n) == 1}

    # ---- nowa mapa: przejścia
    def mp(self):
        if self._mp is None:
            self._mp = L.Mapa(MAPA, raw=self.nowa)
        return self._mp

    def stoi(self, x, y):
        try:
            return self.mp().stoi(int(x), int(y))
        except Exception:
            return None

    def blok(self, nazwa):
        for b in self.bloki:
            if b["blok"] == nazwa:
                return b
        raise BladMapowania("brak bloku „%s” w mapowanie.json" % nazwa)

    def blok_dla(self, x, y):
        for b in self.bloki:
            x0, y0, x1, y1 = b["stary"]
            if x0 <= x <= x1 and y0 <= y <= y1:
                return b
        return None

    def P(self, x, y):
        """nowa kratka starej (x, y): drzwi z budynki.json, zdarzenia, miejsca TownLife, punkty wtyczek, bloki, za murem bez zmian"""
        k = (int(x), int(y)) if float(x).is_integer() and float(y).is_integer() else None
        if k is not None:
            for zrodlo, d in (("drzwi (budynki.json)", self.drzwi), ("zdarzenie", self.po_zd), ("miejsce TownLife", self.po_spot),
                              ("punkt wtyczki", self.po_pkt)):
                if k in d:
                    return d[k], zrodlo
        b = self.blok_dla(x, y)
        if b is not None:
            return (x + b["dx"], y + b["dy"]), "blok " + b["blok"]
        if y >= self.za_murem:
            return (x, y), "za murem (bez zmian)"
        raise BladMapowania("kratka (%s,%s) nie ma nowego miejsca w mapowaniu" % (x, y))

    def kotwica(self, a, stara=None):
        """(stara kratka albo None, nowa kratka) kotwicy: ev<N> | blok:<nazwa> | bud:<drzwi_id> | pt:<tekst> | nm:<klucz> | <klucz TownLife>"""
        if re.fullmatch(r"ev\d+", a):
            v = self.zd.get(int(a[2:]))
            if not v:
                raise BladMapowania("zdarzenie %s nie przenosi się na nową mapę" % a)
            return tuple(v["stare"]), tuple(v["nowe"])
        if a.startswith("blok:"):
            b = self.blok(a[5:])
            return tuple(b["stary"][:2]), (b["stary"][0] + b["dx"], b["stary"][1] + b["dy"])
        if a.startswith("bud:"):
            for b in self.bud:
                if str(b.get("drzwi_id")) == a[4:]:
                    return (tuple(b["stare_drzwi"]) if b.get("stare_drzwi") else None), tuple(b["drzwi"])
            raise BladMapowania("brak budynku z drzwiami %s" % a)
        if a.startswith("pt:"):
            lst = [p for p in self.punkty if a[3:] in p["co"]]
            if stara is not None and len(lst) > 1:
                lst2 = [p for p in lst if tuple(p["stare"]) == tuple(stara)]
                lst = lst2 or lst
            if len(lst) != 1 and not (lst and len({tuple(p["nowe"]) for p in lst}) == 1 and len({tuple(p["stare"]) for p in lst}) == 1):
                raise BladMapowania("punkt „%s”: %d pasujących w mapowaniu" % (a[3:], len(lst)))
            return tuple(lst[0]["stare"]), tuple(lst[0]["nowe"])
        if a.startswith("nm:"):
            v = self.nowe_miejsca.get(a[3:])
            if not v:
                raise BladMapowania("brak nowego miejsca %s" % a)
            return None, tuple(v["nowe"])
        v = self.spots.get(a)
        if v:
            return tuple(v["stare"][:2]), tuple(v["nowe"][:2])
        raise BladMapowania("nieznana kotwica „%s”" % a)

    def para(self, x, y, kotw=None):
        """nowa para dla starej (x, y): z kotwicą - przesunięcie kotwicy (bez starej kotwicy: jej nowa kratka), bez - P().
        Kotwica z dopiskiem „~dx,dy” (np. pt:Kłos 659~0,1): wynik przesunięty jeszcze o (dx, dy) - gdy przesunięta kratka wypada
        w przeszkodzie nowej mapy, a obok jest wolna (opis zmiany to pokazuje)."""
        m = re.search(r"~(-?\d+),(-?\d+)$", kotw or "")
        if m:
            (nx, ny), zr = self.para(x, y, kotw[:m.start()] or None)
            return (nx + int(m.group(1)), ny + int(m.group(2))), zr + " ~" + m.group(1) + "," + m.group(2)
        if kotw:
            so, sn = self.kotwica(kotw, (x, y))
            if so is None:
                return sn, kotw
            return (sn[0] + (x - so[0]), sn[1] + (y - so[1])), kotw
        return self.P(x, y)

    def delta(self, kotw):
        so, sn = self.kotwica(kotw)
        if so is None:
            raise BladMapowania("kotwica %s nie ma starej kratki (brak przesunięcia)" % kotw)
        return sn[0] - so[0], sn[1] - so[1]

    def wejscie_wnetrza(self, mid):
        return self.meta.get(str(mid))


# ================================================================================================ znaczniki «»

ZN = re.compile(r"«([^»]*)»")


def _liczba(s):
    return float(s) if "." in s else int(s)


def _fmt(v, wzor):
    """liczba w formacie starej (tyle miejsc po przecinku)"""
    if "." in wzor:
        n = len(wzor.split(".")[1])
        return ("%." + str(n) + "f") % v
    return str(int(round(v)))


def rozwin(spec, M):
    """spec z znacznikami -> (stary tekst, nowy tekst, [opis par]). Znaczniki:
       «N» «N»          para (x, y) kolejnych znaczników -> M.P(x, y)
       «N@K» «N»        para przesunięta jak kotwica K (ev22, blok:taras_tawerna, bud:94, pt:..., nm:..., klucz TownLife)
       «N|dx@K» / «N|dy@K»   pojedyncza liczba przesunięta o dx / dy kotwicy
       «N|x@K» / «N|y@K»     pojedyncza liczba = x / y nowej kratki kotwicy (bez starej - absolutnie)"""
    toks = []
    for m in ZN.finditer(spec):
        t = m.group(1)
        if "|" in t:
            num, rest = t.split("|", 1)
            op, _, kotw = rest.partition("@")
        else:
            num, _, kotw = t.partition("@")
            op = ""
        toks.append({"s": num.strip(), "op": op.strip(), "k": kotw.strip() or None, "span": m.span()})
    nowe = [None] * len(toks)
    opisy = []
    oczekuje = []   # indeksy niesparowanych liczb
    for i, tk in enumerate(toks):
        if tk["op"]:
            v = _liczba(tk["s"])
            if tk["op"] in ("dx", "dy"):
                dx, dy = M.delta(tk["k"])
                nowe[i] = _fmt(v + (dx if tk["op"] == "dx" else dy), tk["s"])
            elif tk["op"] in ("x", "y"):
                so, sn = M.kotwica(tk["k"])
                nowe[i] = _fmt(sn[0] if tk["op"] == "x" else sn[1], tk["s"])
            else:
                raise BladMapowania("nieznany znacznik «%s»" % tk)
            opisy.append("%s%s %s -> %s" % (tk["op"], "@" + tk["k"] if tk["k"] else "", tk["s"], nowe[i]))
        else:
            oczekuje.append(i)
            if len(oczekuje) == 2:
                a, b = oczekuje
                oczekuje = []
                x, y = _liczba(toks[a]["s"]), _liczba(toks[b]["s"])
                (nx, ny), zr = M.para(x, y, toks[a]["k"] or toks[b]["k"])
                nowe[a], nowe[b] = _fmt(nx, toks[a]["s"]), _fmt(ny, toks[b]["s"])
                ok = M.stoi(nx, ny)
                opisy.append("(%s,%s) -> (%s,%s) [%s]%s" % (toks[a]["s"], toks[b]["s"], nowe[a], nowe[b], zr,
                                                            "" if ok or ok is None or isinstance(nx, float) else " (nowa kratka nieprzechodnia)"))
    if oczekuje:
        raise BladMapowania("nieparzysta liczba znaczników par w: %s" % spec)
    stary, nowy, pos = [], [], 0
    for i, tk in enumerate(toks):
        s, e = tk["span"]
        stary.append(spec[pos:s]); nowy.append(spec[pos:s])
        stary.append(tk["s"]); nowy.append(nowe[i])
        pos = e
    stary.append(spec[pos:]); nowy.append(spec[pos:])
    return "".join(stary), "".join(nowy), opisy


# ================================================================================================ raport

class Raport:
    def __init__(self, cicho=False):
        self.wpisy = []          # (plik, linia, stare, nowe, status, opis)
        self.uwagi = []          # (rodzaj, tekst)
        self.cicho = cicho

    def zmiana(self, plik, linia, stare, nowe, status, opis=""):
        self.wpisy.append((plik, linia, stare, nowe, status, opis))
        if not self.cicho:
            znak = {"zmiana": "+", "juz": "=", "pominieta": "!", "bez zmian": "."}.get(status, "?")
            print("%s %s:%s  %s  ->  %s%s" % (znak, plik, linia if linia else "-", skroc(stare), skroc(nowe),
                                              ("   [" + opis + "]") if opis else ""))

    def uwaga(self, rodzaj, tekst):
        self.uwagi.append((rodzaj, tekst))
        if not self.cicho or rodzaj in ("BŁĄD", "POMINIĘTE"):
            print("%s: %s" % (rodzaj, tekst))


def skroc(s, n=150):
    s = str(s).replace("\r", "").replace("\n", "⏎")
    return s if len(s) <= n else s[:n - 1] + "…"


# ================================================================================================ pliki tekstowe

class PlikTekstowy:
    """plik tekstowy (UTF-8, z BOM albo bez) czytany i zapisywany binarnie - końce linii zostają jak były"""

    def __init__(self, sciezka, wzgl):
        self.sciezka, self.wzgl = sciezka, wzgl
        self.bajty = wczytaj(sciezka)
        self.bom = self.bajty.startswith(b"\xef\xbb\xbf")
        self.tekst = self.bajty[3:].decode("utf-8") if self.bom else self.bajty.decode("utf-8")
        self.nl = "\r\n" if "\r\n" in self.tekst else "\n"
        self.zmieniony = False

    def bajty_po(self):
        b = self.tekst.encode("utf-8")
        return (b"\xef\xbb\xbf" + b) if self.bom else b

    def linia(self, pos):
        return self.tekst.count("\n", 0, pos) + 1

    @staticmethod
    def _wzorzec(s):
        p = re.escape(s)
        if re.match(r"[A-Za-z0-9_$]", s):
            p = r"(?<![A-Za-z0-9_$])" + p
        if re.search(r"[A-Za-z0-9_$]$", s):
            p = p + r"(?![A-Za-z0-9_$])"
        return re.compile(p)

    def obszar(self, blok):
        """(początek, koniec) obszaru: blok = (regex początku, regex końca po nim) albo None = cały plik"""
        if not blok:
            return 0, len(self.tekst)
        m0 = re.search(blok[0], self.tekst, re.M)
        if not m0:
            return None
        m1 = re.compile(blok[1], re.M).search(self.tekst, m0.end())
        return m0.start(), (m1.end() if m1 else len(self.tekst))

    def podmien(self, R, stary, nowy, opis="", ile=1, blok=None):
        stary = stary.replace("\n", self.nl) if "\r\n" == self.nl and "\r\n" not in stary else stary
        nowy = nowy.replace("\n", self.nl) if "\r\n" == self.nl and "\r\n" not in nowy else nowy
        ob = self.obszar(blok)
        if ob is None:
            R.zmiana(self.wzgl, None, stary, nowy, "pominieta", "nie znaleziono obszaru %s; %s" % (blok[0], opis))
            return False
        a, b = ob
        if stary == nowy:
            n = len(list(self._wzorzec(stary).finditer(self.tekst, a, b)))
            R.zmiana(self.wzgl, None, stary, nowy, "bez zmian" if n == ile or ile is None else "pominieta",
                     ("nowa wartość = stara; " if n == ile or ile is None else "stara wartość: %d wystąpień zamiast %s; " % (n, ile)) + opis)
            return False
        st = list(self._wzorzec(stary).finditer(self.tekst, a, b))
        if ile is None and st:
            ile = len(st)
        if len(st) != ile:
            nw = list(self._wzorzec(nowy).finditer(self.tekst, a, b))
            if not st and nw and (ile is None or len(nw) == ile):
                R.zmiana(self.wzgl, self.linia(nw[0].start()), stary, nowy, "juz", "już przepięte; " + opis)
                return False
            R.zmiana(self.wzgl, self.linia(st[0].start()) if st else None, stary, nowy, "pominieta",
                     "stara wartość: %d wystąpień zamiast %s - nie zgaduję; %s" % (len(st), ile, opis))
            return False
        for m in reversed(st):
            R.zmiana(self.wzgl, self.linia(m.start()), stary, nowy, "zmiana", opis)
            self.tekst = self.tekst[:m.start()] + nowy + self.tekst[m.end():]
        self.zmieniony = True
        return True

    def dopisz_na_gorze(self, R, linia_txt, znacznik):
        if znacznik in self.tekst[:2000]:
            R.zmiana(self.wzgl, 1, "", linia_txt, "juz", "ostrzeżenie już jest")
            return
        lines = self.tekst.split(self.nl)
        i = 0
        while i < len(lines) and (lines[i].startswith("#!") or re.match(r"#.*coding[:=]", lines[i])):
            i += 1
        lines.insert(i, linia_txt)
        self.tekst = self.nl.join(lines)
        self.zmieniony = True
        R.zmiana(self.wzgl, i + 1, "", linia_txt, "zmiana", "ostrzeżenie na górze")


# ================================================================================================ specyfikacje zmian
# Z(plik, spec, ile=1, blok=None, opis="")   tekst ze znacznikami «» (stary tekst = spec bez znaczników)
# T(plik, stary, nowy, ile=1, blok=None, opis="")  tekst dosłowny -> tekst policzony z mapowania

class Z:
    def __init__(self, plik, spec, ile=1, blok=None, opis=""):
        self.plik, self.spec, self.ile, self.blok, self.opis = plik, spec, ile, blok, opis

    def teksty(self, M):
        st, nw, op = rozwin(self.spec, M)
        return st, nw, "; ".join(([self.opis] if self.opis else []) + op)


class T:
    def __init__(self, plik, stary, nowy, ile=1, blok=None, opis=""):
        self.plik, self.stary, self.nowy, self.ile, self.blok, self.opis = plik, stary, nowy, ile, blok, opis

    def teksty(self, M):
        nw = self.nowy(M) if callable(self.nowy) else self.nowy
        return self.stary, nw, self.opis


# ================================================================================================ (3) wtyczki js/plugins

PL = "js/plugins/"


def _squares(lst):
    return "[" + ", ".join("[%s]" % ", ".join(str(v) for v in r) for r in lst) + "]"


def wolne_mapy(M, ile=2):
    """pierwsze wolne numery map po nowych wnętrzach (zapas Okolice_Data MAPS.spare)"""
    zajete = {int(k) for k in M.meta}
    n = max(zajete) + 1 if zajete else 191
    return list(range(n, n + ile))


def old_8(M):
    """Okolice_Data OLD[8]: „stara część” mapy 8 = całe miasto w murach (x 0..W-1, y 0..za_murem-1); na zewnątrz nowa ziemia"""
    return [M.nowa["width"], M.za_murem]


def w_starej(M, x, y):
    ox, oy = old_8(M)
    return x < ox and y < oy


def specs_wtyczki(M):
    S = []
    # ---------------------------------------------------------------- A1 TownLife_Data: SPOTS (35 miejsc; blok „THE NEW TOWN” bez zmian)
    f = PL + "TownLife_Data.js"
    for k, v in M.spots.items():
        a, b, c = v["stare"]
        nx, ny = v["nowe"][:2]
        nd = v["nowe"][2] if len(v["nowe"]) > 2 else c
        S.append(T(f, "%s: [%d, %d, %d]" % (k, a, b, c), "%s: [%d, %d, %d]" % (k, nx, ny, nd), blok=(r"const SPOTS = \{", r"^\s*\};"),
                   opis="TownLife SPOTS"))
    # ---------------------------------------------------------------- Garnizon_Data: werbownik na rynku, zdarzenia 656-659
    f = PL + "Garnizon_Data.js"
    S += [Z(f, "garnizon_werbownik: [«22@pt:garnizon_werbownik», «37», 2]"),
          Z(f, "{ id: 656, x: «20@pt:lista 656», y: «37» }"),
          Z(f, "{ id: 657, x: «32@pt:szukający 657», y: «50» }"),
          Z(f, "{ id: 658, x: «20@pt:szukający 658», y: «50» }"),
          Z(f, "{ id: 659, x: «9@pt:Kłos 659», y: «40», d: 6 }")]
    # ---------------------------------------------------------------- Zakon_Data: cmentarz, szubienica, odkrycia, grabarz
    f = PL + "Zakon_Data.js"
    C = M.strefy["zakon_CEMETERY"]
    G = M.strefy["szubienica"]
    S.append(T(f, "map: 8, x: 80, y: 12, w: 8, h: 6,", "map: 8, x: %d, y: %d, w: %d, h: %d," % (C["x"], C["y"], C["w"], C["h"]), opis="CEMETERY"))
    S.append(T(f, "gate: [[83, 17], [84, 17]], lamp: { id: 2821, x: 84, y: 12 }",
               "gate: [%s], lamp: { id: 2821, x: %d, y: %d }" % (", ".join("[%d, %d]" % tuple(g) for g in C["gate"]), C["lamp"][0], C["lamp"][1]),
               opis="CEMETERY furtka + lampka"))
    stare_groby = [(2830, 81, 13), (2831, 82, 13), (2832, 85, 13), (2833, 86, 13), (2834, 81, 15), (2835, 82, 15), (2836, 85, 15), (2837, 86, 15)]
    for (gid, gx, gy), (nx, ny) in zip(stare_groby, C["graves"]):
        S.append(T(f, "{ id: %d, x: %d, y: %d" % (gid, gx, gy), "{ id: %d, x: %d, y: %d" % (gid, nx, ny), opis="grób %d" % gid))
    S.append(T(f, "(x 80-87, y 12-17)", "(x %d-%d, y %d-%d)" % (C["x"], C["x"] + C["w"] - 1, C["y"], C["y"] + C["h"] - 1), opis="komentarz"))
    S.append(T(f, "the gate below (83-84, 17)", "the gate below (%d-%d, %d)" % (C["gate"][0][0], C["gate"][-1][0], C["gate"][0][1]), opis="komentarz"))
    S.append(T(f, "const GALLOWS = { map: 8, x: 93, y: 54, w: 3, h: 3, id: 2840, at: [94, 56]",
               "const GALLOWS = { map: 8, x: %d, y: %d, w: %d, h: %d, id: 2840, at: [%d, %d]" % (G["x"], G["y"], G["w"], G["h"], G["at"][0], G["at"][1]),
               opis="GALLOWS"))
    if w_starej(M, C["x"], C["y"]):
        S.append(T(f, 'mode: "reach", x: CEMETERY.x, y: CEMETERY.y, w: CEMETERY.w, h: CEMETERY.h });',
                   'mode: "reach", x: CEMETERY.x, y: CEMETERY.y, w: CEMETERY.w, h: CEMETERY.h, allowOld: true });',
                   opis="cmentarz w mieście (OLD[8] = miasto) - allowOld, żeby kontrola Okolice nie zgłaszała"))
    S += [Z(f, '{ key: "cmentarz", map: 8, x: «84@pt:odkrycie cmentarz», y: «16», near: 3'),
          Z(f, '{ key: "szubienica", map: 8, x: «94@pt:odkrycie szubienica», y: «57», near: 2'),
          Z(f, "grabarz_groby: [«82@pt:SPOTS_TOWN groby», «14», 8]"),
          Z(f, "grabarz_groby_2: [«85@pt:SPOTS_TOWN groby_2», «14», 8]"),
          Z(f, "grabarz_kopie: [«85@pt:SPOTS_TOWN kopie», «16», 8]"),
          Z(f, "grabarz_furtka: [«84@pt:SPOTS_TOWN furtka», «18», 2]"),
          Z(f, "grabarz_przerwa: [«86@pt:SPOTS_TOWN przerwa», «14», 4]"),
          Z(f, "grabarz_lampa: [«84@pt:SPOTS_TOWN lampa», «13», 8]"),
          Z(f, "grabarz_chata: [«84@pt:SPOTS_TOWN chata», «20», 2]")]
    f = PL + "Zakon.js"
    S += [Z(f, '["Stary cmentarz", 8, «84@pt:Zakon.js:1304 F9 cmentarz», «16»]'),
          Z(f, '["Szubienica", 8, «94@pt:Zakon.js:1304 F9 szubienica», «58»]')]
    # ---------------------------------------------------------------- Wrak_Data: miejsca Eryka, znak mapy
    f = PL + "Wrak_Data.js"
    S += [Z(f, "rozbitek_noc: [«24@pt:rozbitek_noc», «17», 8]"),
          Z(f, "rozbitek_rynek: [«28@pt:rozbitek_rynek», «35», 2]"),
          Z(f, "rozbitek_mury: [«3@pt:rozbitek_mury», «19», 4]"),
          Z(f, "rozbitek_studnia: [«25@pt:rozbitek_studnia», «34», 4]", opis="Wrak.js wellWatch porównuje dokładnie"),
          Z(f, '{ key: "tawerna", name: "Wzgórze tawerny", map: 8, x: «24@pt:znak mapy», y: «18» }')]
    # ---------------------------------------------------------------- Kantor (W5)
    f = PL + "Kantor_Data.js"
    S += [Z(f, "backDoor: [«10@ev94», «39»]", opis="Kantor.js backDoorEv szuka dokładnie tej kratki (zdarzenie 94)"),
          Z(f, "backFront: [«10@pt:PLACES.backFront», «40», 8]"),
          Z(f, "frontDoor: [«14@ev95», «38»]"),
          Z(f, "gateIn: [«25@pt:PLACES.gateIn», «66»]"),
          Z(f, "gateOut: [«25@pt:PLACES.gateOut», «67»]"),
          Z(f, "east: [«50@pt:PLACES.east», «50»]"),
          Z(f, "tavern: [«24@pt:PLACES.tavern», «18»]"),
          Z(f, "w5_piwnica: [«10@pt:w5_piwnica», «40», 8]"),
          Z(f, "w5_lada: [«14@pt:w5_lada», «39», 8]")]
    f = PL + "Kantor.js"
    S += [Z(f, "go: [M.town, «12@pt:Kantor.js:1286», «41», 8]", ile=4, opis="F9 W5"),
          Z(f, "go: [M.town, «8@pt:Kantor.js:1286», «37», 2]", opis="F9 W5"),
          Z(f, "go: [M.town, «10@pt:Kantor.js:1286», «41», 8]", opis="F9 W5")]
    # ---------------------------------------------------------------- TownQuests_Data: miejsca zadań 951-959, obóz W6 903-907
    f = PL + "TownQuests_Data.js"
    S += [Z(f, "bakery_window: { map: 8, id: 951, x: «6@pt:bakery_window», y: «39»"),
          Z(f, "notice_tavern: { map: 8, id: 952, x: «25@pt:notice_tavern», y: «16»"),
          Z(f, "notice_bakery: { map: 8, id: 953, x: «7@pt:notice_bakery», y: «39»"),
          Z(f, "notice_smithy: { map: 8, id: 954, x: «8@pt:notice_smithy», y: «48»"),
          Z(f, "notice_kantor: { map: 8, id: 955, x: «15@pt:notice_kantor», y: «39»"),
          Z(f, "south_gate: { map: 8, id: 956, x: «26@pt:south_gate», y: «54»"),
          Z(f, "watch_post: { map: 8, id: 957, x: «26@pt:watch_post», y: «20»"),
          Z(f, "east_brazier: { map: 8, id: 958, x: «49@pt:east_brazier», y: «49»"),
          Z(f, "w3_kupala: { map: 8, id: 959, x: «24@pt:w3_kupala», y: «51»"),
          Z(f, "w6_tent1: { map: 8, id: 903, x: «31@pt:namiot 903», y: «53»"),
          Z(f, "w6_fire: { map: 8, id: 905, x: «32@pt:ognisko 905», y: «51»"),
          Z(f, "w6_tent2: { map: 8, id: 904, x: «19@pt:namiot 904», y: «51»"),
          Z(f, "w6_bogdan: { map: 8, id: 906, x: «23@pt:Bogdan 906», y: «51»"),
          Z(f, "w6_halina: { map: 8, id: 907, x: «29@pt:Halina 907», y: «52»")]
    # ---------------------------------------------------------------- TownQuests.js: czapka K33, ogród rycerzy, wyrzucenie z ogrodu dworu
    f = PL + "TownQuests.js"
    cap = M.strefy["ogrod_rycerzy"]["CAP"]
    S.append(T(f, "const CAP = { statue: [5, 9], head: { x: 5.5, y: 7.15 }, ground: { x: 5.6, y: 16.3 }",
               "const CAP = { statue: [%d, %d], head: { x: %s, y: %s }, ground: { x: %s, y: %s }" % (
                   cap["posag"][0], cap["posag"][1], cap["glowa"][0], cap["glowa"][1], cap["czapka"][0], cap["czapka"][1]),
               opis="K33 posąg (zdarzenie 43 dokładnie na tej kratce), głowa, czapka; cokoły W3 = !Statue z y === CAP.statue[1]"))
    S += [Z(f, "(Map008 «5@ev43»,«9» - its head at y 7.15)", opis="komentarz"),
          Z(f, "if (sy < «15.5|dy@ev43» || !(e.y < sy - 0.3) || e.x < «1.5|dx@ev43» || e.x > «10.5|dx@ev43» || e.y < «6.5|dy@ev43») return false;",
            opis="strzał w czapkę"),
          Z(f, "p.x >= «4|dx@ev39» && p.x <= «8|dx@ev39» && p.y >= «16|dy@ev39» && p.y <= «19|dy@ev39» && p.direction() === 8", opis="podglądanie ogrodu"),
          Z(f, "p.x < «2|dx@ev246» || p.x > «10|dx@ev246» || p.y < «4|dy@ev246» || p.y > «13|dy@ev246»", ile=2, opis="ogród rycerzy: w2Garden i cienie o 12:00"),
          Z(f, "map: TOWN, x: «50@pt:manor.out», y: «51», dir: 4 }", opis="wyrzucenie z ogrodu dworu")]
    # ---------------------------------------------------------------- Act3_Data SPOTS[8]
    f = PL + "Act3_Data.js"
    G3 = "pt:Act3_Data.js:42 gate"
    S += [Z(f, "door: [«24@pt:Act3_Data.js:41 door», «17»], doorTile: [«24@pt:doorTile», «16»]"),
          Z(f, "gate: [[«24@%s», «23»], [«25@%s», «23»], [«24@%s», «22»], [«25@%s», «22»], [«23@%s», «22»], [«26@%s», «21»], [«23@%s», «21»], "
               "[«24@%s», «24»], [«25@%s», «24»]]" % ((G3,) * 9)),
          Z(f, "guard: [[«21@%s», «18»], [«27@%s», «18»], [«19@%s», «19»], [«29@%s», «19»], [«22@%s», «20»], [«26@%s», «20»], [«17@%s», «18»], "
               "[«31@%s», «18»]]" % (("pt:Act3_Data.js:43 guard",) * 8)),
          Z(f, "from: [[«24@%s», «24»], [«25@%s», «24»], [«24@%s», «23»], [«25@%s», «23»]]" % (("pt:Act3_Data.js:44 from",) * 4)),
          Z(f, "bell: [«47@pt:Act3_Data.js:45 bell», «29»], bellStand: [«47@pt:bellStand», «30»]"),
          Z(f, "fires: [[«21@%s», «15», 0.9], [«27@%s», «15», 1.0], [«18@%s», «16», 0.75], [«30@%s», «16», 0.8], [«24@%s», «14», 0.7]]"
            % (("pt:Act3_Data.js:46 fires",) * 5))]
    # ---------------------------------------------------------------- Kasztelan, Dwór
    S.append(Z(PL + "Kasztelan.js", "go: [MAP.town, «8@kowadlo», «50», 4]",
               opis="F9 rozdz. 3 = Tadek przy kowadle (punkt mapowania 8,50 „bez zmian” to dziś dom szwaczki; jak tests/w4_key)"))
    f = PL + "Dwor_Data.js"
    S += [Z(f, "out: [8, «50@pt:manor.out», «51», 4]"),
          Z(f, "town: { gate: [«48@pt:town.gate», «51»], f9: [«24@pt:town.f9», «33», 8] }"),
          Z(f, "(TLD.SPOTS.brama_wsch || [«48@brama_wsch», «51», 4])")]
    # ---------------------------------------------------------------- Zasoby: pola mieszczan
    f = PL + "Zasoby_Data.js"
    F = M.strefy["zasoby_FIELDS"]
    for key, (x, y, w, h) in (("pole_1", (5, 76, 8, 4)), ("pole_2", (5, 82, 8, 4)), ("pole_3", (31, 74, 8, 5))):
        n = F[key]
        S.append(T(f, '{ key: "%s", x: %d, y: %d, w: %d, h: %d,' % (key, x, y, w, h),
                   '{ key: "%s", x: %d, y: %d, w: %d, h: %d,' % (key, n["x"], n["y"], n["w"], n["h"]), opis="FIELDS"))
    S.append(Z(PL + "Zasoby.js", '["Pola mieszczan", 8, «9@pt:Zasoby.js:1420», «80», 8]', opis="F9"))
    # ---------------------------------------------------------------- Okolice_Data: OLD[8], ENTRY[8], PLAN_SPOTS mapy 8, zapas map
    f = PL + "Okolice_Data.js"
    ox, oy = old_8(M)
    S.append(T(f, "8: [52, 69]", "8: [%d, %d]" % (ox, oy), blok=(r"const OLD = \{", r"\};"),
               opis="„stara część” mapy 8 = całe miasto w murach; za murem (y >= %d) nowa ziemia" % oy))
    S.append(Z(f, "8: [«27@pt:ENTRY[8]», «34»]", blok=(r"const ENTRY = \{", r"\};"), opis="ENTRY[8] (start chodzenia kontroli)"))
    for key, (x, y, w, h) in (("pole_1", (5, 76, 8, 4)), ("pole_2", (5, 82, 8, 4)), ("pole_3", (31, 74, 8, 5))):
        n = F[key]
        S.append(T(f, '{key: "%s", pkg: "A", map: 8, kind: "field", name: "Pole mieszczan", mode: "reach", x: %d, y: %d, w: %d, h: %d}' % (key, x, y, w, h),
                   '{key: "%s", pkg: "A", map: 8, kind: "field", name: "Pole mieszczan", mode: "reach", x: %d, y: %d, w: %d, h: %d}' % (key, n["x"], n["y"], n["w"], n["h"]),
                   opis="PLAN_SPOTS"))
    S.append(T(f, '{key: "cmentarz", pkg: "D", map: 8, kind: "cemetery", name: "Stary cmentarz", mode: "reach", x: 80, y: 12, w: 8, h: 6}',
               '{key: "cmentarz", pkg: "D", map: 8, kind: "cemetery", name: "Stary cmentarz", mode: "reach", x: %d, y: %d, w: %d, h: %d%s}' % (
                   C["x"], C["y"], C["w"], C["h"], ", allowOld: true" if w_starej(M, C["x"], C["y"]) else ""), opis="PLAN_SPOTS"))
    S.append(T(f, '{key: "szubienica", pkg: "D", map: 8, kind: "gallows", name: "Wzgórze z szubienicą", mode: "reach", x: 93, y: 54, w: 3, h: 3}',
               '{key: "szubienica", pkg: "D", map: 8, kind: "gallows", name: "Wzgórze z szubienicą", mode: "reach", x: %d, y: %d, w: %d, h: %d}' % (
                   G["x"], G["y"], G["w"], G["h"]), opis="PLAN_SPOTS"))
    sp = wolne_mapy(M)
    S.append(T(f, "spare: [178, 179]", "spare: [%d, %d]" % tuple(sp), opis="178-190 to teraz wnętrza nowego miasta - zapas przesunięty"))
    # ---------------------------------------------------------------- Orzeł: place miasta do lądowania
    sq = M.strefy["orzel_TOWN_SQUARES_8"]
    S.append(T(PL + "Orzel_Data.js",
               "8: [[0, 18, 51, 21], [12, 29, 37, 40], [4, 47, 34, 51]],         // the street before the tavern, the well square, the south square",
               "8: %s,   // (2026-10-22 the new town) the tavern's yard, the market square, the street inside the south wall" % _squares(sq),
               opis="TOWN_SQUARES[8]"))
    # ---------------------------------------------------------------- Underground_Data: epilogi „rynek” i „oboz”
    f = PL + "Underground_Data.js"
    S += [Z(f, 'key: "rynek", map: 8, cam: [«24@pt:rynek kamera», «37»],'),
          Z(f, '[["soltys", «26@pt:rynek sołtys», «36», 4], ["hanka", «21@pt:rynek Hanka», «33», 6], ["kuba", «24@pt:rynek Kuba», «36», 8], '
               '["ambrozy", «20@blok:rynek (punkty wokół studni)», «36», 6]]',
            opis="Ambroży jak blok rynku (punkt mapowania 24,44 = blok kantoru, 30 kratek od kamery sceny)"),
          Z(f, 'cam: w => (w.camp === "outside" ? [38, 11] : [«30@pt:oboz kamera», «50»]),'),
          Z(f, ': { ludmila: [«30@pt:oboz Ludmiła», «51», 6], ela: [«31@pt:oboz Ela», «52», 8], marek: [«32@pt:oboz Marek», «51», 4], '
               'rafal: [«28@pt:oboz Rafał», «51», 6] };')]
    # ---------------------------------------------------------------- CleanHUD_Compass: przykład w dokumentacji
    S.append(Z(PL + "CleanHUD_Compass.js", 'where: { map: 8, x: «39@staw», y: «10», name: "Staw" }', opis="tylko przykład w pomocy"))
    return S


# ================================================================================================ (4a) narzędzia

def specs_narzedzia(M):
    S = []
    f = "tools/newstart/tavern_layout.py"
    S += [Z(f, "GATE = («24@ev22», «16»)", opis="drzwi tawerny (zdarzenie 22)"),
          Z(f, "GATE_TILES = [(«23@ev22», «16»), («24@ev22», «16»), («25@ev22», «16»)]"),
          Z(f, "EXITS = [((49, 54), («23@pt:Map001 ev10», «17»)), ((50, 54), («24@pt:Map001 ev11», «17»)), ((51, 54), («25@pt:Map001 ev12», «17»))]")]

    def kept(M):
        tr = sorted((e["x"], e["y"]) for e in M.nowa["events"] if e and any(
            c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 22 for p in e["pages"] for c in p["list"]))
        return "KEPT_TRANSFERS = [%s]" % ", ".join("(%d, %d)" % t for t in tr)
    S.append(T(f, "KEPT_TRANSFERS = [(24, 68), (25, 68), (26, 68)]", kept(M),
               opis="przejścia na Polną drogę na nowej mapie (BASE_SHA256 zostaje stara - stare generatory mają odmawiać pracy)"))
    f = "tools/interiors/build_interiors.py"
    for did, (x, y) in ((88, (6, 39)), (94, (10, 40)), (95, (14, 39)), (114, (41, 40)), (4, (47, 40)), (121, (9, 31)), (124, (12, 30)),
                        (134, (12, 47)), (137, (29, 47)), (141, (37, 50)), (236, (48, 31))):
        S.append(Z(f, "%d: («%d@bud:%d», «%d»)" % (did, x, did, y), blok=(r"^DOORS = \{", r"\}"), opis="DOORS: przed drzwiami %d" % did))
    S.append(Z("tools/interiors/install.py", 'BELL_DOOR = {"id": 236, "x": «48@ev236», "y": «30»', opis="drzwi dzwonnicy"))
    f = "tools/quest_places/places.py"
    S += [Z(f, "WELL_DOWN_AT = («25@ev245», «34»)"),
          Z(f, "WELL_OUT = («26@pt:Map118», «34», 4)"),
          Z(f, "SLAB_AT = («6@ev246», «12»)"),
          Z(f, "SLAB_OUT = («6@pt:Map119», «13», 2)")]
    # (sprawdzenie: krawędzie i drzwi dworu na mapie 8 zostają - wynik „bez zmian”)
    f = "tools/newstart/layout.py"
    S += [Z(f, "((24, 0, 16), (8, «102@pt:Map024 Posiadłość ev66», «51», 4))", opis="sprawdzenie"),
          Z(f, "(8, cells(«24», «137», «26», «137»), 8)", opis="sprawdzenie (za murem)"),
          Z(f, "((8, cells(«103@ev221», «50», «103@ev222», «51»), 4)", opis="sprawdzenie"),
          Z(f, "((8, cells(«0@ev237», «50», «0@ev238», «51»), 6)", opis="sprawdzenie")]
    return S


# ================================================================================================ (4b) testy (tests/*.js) i skrypty zrzutów

# ------------------------------------------------------------------------------------------------ grupa G1: east_gate, region_layers, tavern_interior, town_life, quest_places, knights_garden, zakon, w5
BRAMA_E = "blok:brama_wschodnia"
MUR_E = "blok:mur_E"
CMENTARZ = "blok:cmentarz Zakonu (punkty)"
SZUBIENICA = "blok:szubienica Zakonu (punkty)"
KAMERA = "pt:rynek kamera"
F9W5 = "pt:Kantor.js:1286"


def _testy_G1(M, Z, T):
    S = []
    # ---------------------------------------------------------------- east_gate_test: brama wschodnia (mury x 102-103, kosze 225/227, chorągwie)
    f = "tests/east_gate_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «46@%s», y: «50», dir: 6" % BRAMA_E, opis="ulica przed bramą wschodnią"),
          Z(f, "gate: [p(«50@{0}», «50»), p(«51@{0}», «50»), p(«50@{0}», «51»), p(«51@{0}», «51»)], pillars: [p(«49@ev225», «49»), p(«49@ev227», «53»)], "
               "towers: [p(«50@ev225», «49»), p(«50@ev227», «53»)]".format(MUR_E), opis="przejście w murze, słupy koszy, wieże obok"),
          Z(f, 'JSON.stringify(cells.exits) === "[[«51@%s»,«50»],[«51@%s»,«51»]]"' % (MUR_E, MUR_E), opis="przejścia 221/222 na krawędzi"),
          Z(f, "two exits at the map's edge («51@%s»,«50»..51)" % MUR_E, opis="opis"),
          Z(f, "t.locate(«48@%s», «50», 6);" % BRAMA_E, opis="przed bramą, w prawo przez nią"),
          Z(f, "lands in the gate (Map008 «50@%s»,«51», facing left)" % MUR_E, opis="opis"),
          Z(f, "at8.x === «50@%s» && at8.y === «51»" % MUR_E, opis="lądowanie z Map024 ev67 (102,51)")]
    # ---------------------------------------------------------------- region_layers_test: fasada hali (taras tawerny, +dx bloku)
    f = "tests/region_layers_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «19@ev22», y: «18», dir: 8", opis="ulica przed halą"),
          Z(f, "facade: [k(«19@ev22», «15»), p(«19@ev22», «15»)], arcade: [k(«20@ev22», «9»), p(«20@ev22», «9»)], street: [k(«19@ev22», «18»), p(«19@ev22», «18»)], "
               "gate: [k(«24@ev22», «17»), p(«24@ev22», «17»)]"),
          Z(f, "t.locate(«19@ev22», «18», 8);", ile=2),
          Z(f, "t.locate(«24@ev22», «17», 8);", opis="przed drzwiami tawerny"),
          Z(f, "t.go(8, «19@ev22», «17», 8);"),
          Z(f, "$dataMap.data[5 * W * H + «15|dy@ev22» * W + «20|dx@ev22»] = ${r};", opis="region na kratce fasady"),
          Z(f, "RegionLayers.kindAt(«20@ev22», «15»), walk: p(«20@ev22», «15»)", ile=2),
          Z(f, "t.locate(«20@ev22», «15», 2);"),
          Z(f, "t.locate(«19@ev22», «17», 8);"),
          Z(f, "(${walk})(«20@ev22», «15»)")]
    # ---------------------------------------------------------------- tavern_interior_test: drzwi tawerny i wyjścia Map001 10-12
    f = "tests/tavern_interior_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «24@bud:22», y: «17», dir: 8", opis="przed drzwiami tawerny"),
          Z(f, "o[1] === 8 && o[3] === «17|dy@bud:22») && yard.map === 8 && yard.x === «23@pt:Map001 ev10» && yard.y === «17»",
            opis="wyjście z tawerny (Map001 ev10)"),
          T(f, "in front of the gate (Map008 23..25,17)", "in front of the gate (Map008 %d..%d,%d)" % (
              M.kotwica("pt:Map001 ev10")[1][0], M.kotwica("pt:Map001 ev12")[1][0], M.kotwica("pt:Map001 ev10")[1][1]), opis="opis")]
    # ---------------------------------------------------------------- town_life_test: miejsca mieszkańców o 10:00 = klucze TownLife
    f = "tests/town_life_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «24@%s», y: «37», dir: 8, hour: 10" % KAMERA, opis="rynek (24,37 -> kratka pod studnią zajęta)"),
          Z(f, "const want = { piekarka: [«21@stragan1», «31»], woziwoda: [«23@studnia_rynek», «34»], kapral: [«48@brama_wsch», «51»], "
               "kowal: [«7@kowadlo», «49»], soltys: [«39@ratusz_przed», «40»], kupiec: [«12@kantor_przed», «40»], garbarz: [«16@garbarnia», «45»], "
               "feliks: [«40@ratusz_obok», «40»] };", opis="miejsca TownLife o 10:00"),
          Z(f, "Math.abs(amb.to[0] - «19@rynek_lawka») <= 3 && Math.abs(amb.to[1] - «35») <= 3", opis="Ambroży przy ławce"),
          Z(f, "t.locate(«21@stragan1», «33», 8);", opis="przy straganie Hanki"),
          Z(f, "t.locate(«21@stragan1», «32», 8);", opis="przy straganie Hanki"),
          Z(f, "after.x === «6@piekarnia_drzwi» && after.y === «39»", opis="Hanka wchodzi do piekarni")]
    # ---------------------------------------------------------------- quest_places_test: studnia (245, 241/242) i płyta w ogrodzie (246/247)
    f = "tests/quest_places_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «26@ev245», y: «34», dir: 4", opis="obok zejścia do studni"),
          Z(f, "well.down[1] === «25@ev245» && well.down[2] === «34»"),
          Z(f, "well.rations.every(r => r[2] === «35|dy@ev241»"),
          Z(f, "t.locate(«26@ev245», «34», 4);", ile=2),
          Z(f, "top.x === «26@pt:Map118» && top.y === «34»", opis="wyjście liny z Map118"),
          Z(f, "t.go(8, «6@ev246», «13», 8);"),
          Z(f, 'JSON.stringify(slab.at) === "[«6@ev246»,«12»]"'),
          Z(f, 'JSON.stringify(slab.marker) === "[«6@ev247»,«12»]"'),
          Z(f, "over.map === 8 && over.y <= «12|dy@ev246»"),
          Z(f, "t.locate(«6@ev246», «13», 8);", ile=2),
          Z(f, "t.locate(«8@ev246», «12», 4);"),
          Z(f, "$gameMap.setDisplayPos(«0|dx@ev246», «4|dy@ev246»); 0", opis="widok na płytę"),
          Z(f, "garden.x === «6@pt:Map119» && garden.y === «13»", opis="wyjście schodów z Map119")]
    # ---------------------------------------------------------------- knights_garden_test: furtka 39, ogród rycerzy
    f = "tests/knights_garden_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «6@ev39», y: «17», dir: 8", opis="przed furtką"),
          Z(f, "blocksSides: [«5|dx@ev39», «7|dx@ev39»].every(x => $gameMap.eventsXyNt(x, «16|dy@ev39»).includes(e)), "
               "region: [«5|dx@ev39», «6|dx@ev39», «7|dx@ev39»].map(x => $gameMap.regionId(x, «14|dy@ev39»))"),
          Z(f, "stay.y >= «17|dy@ev39»"),
          Z(f, "t.locate(«6@ev39», «17», 8);"),
          Z(f, "inside.y <= «13|dy@ev246» && inside.x >= «2|dx@ev246» && inside.x <= «10|dx@ev246»", opis="ogród rycerzy"),
          Z(f, "t.locate(«6@ev246», «12», 8);")]
    # ---------------------------------------------------------------- zakon_test: cmentarz i szubienica (przeniesione)
    f = "tests/zakon_test.js"
    S += [Z(f, "await go(8, «84@%s», «19», 10);" % CMENTARZ, opis="pod furtką cmentarza"),
          Z(f, "__near(«82@%s», «13»); 0" % CMENTARZ, opis="grób 2831 (kruk 1)"),
          Z(f, "__near(«85@%s», «15»); 0" % CMENTARZ, opis="grób 2836 (kruk 3)"),
          Z(f, "$gamePlayer.locate(«94@%s», «59»); 0" % SZUBIENICA, opis="pod szubienicą nocą")]
    # ---------------------------------------------------------------- w5_test: kantor, tylne drzwi 94, kurier 733, brama wsch., ratusz
    f = "tests/w5_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «12@%s», y: «41», quiet: true, day: 9" % F9W5, opis="przed kantorem (F9 W5)"),
          Z(f, "await go(8, «8@pt:Kłos 659~0,1», «40», 6);", opis="obok Kłosa przy tylnych drzwiach (kratka na lewo od niego zajęta - o rząd niżej)"),
          Z(f, "await go(8, «16@kantor_rog», «40», 4);", opis="róg kantoru - na drodze kuriera"),
          Z(f, "$gameMap.event(733).locate(«22@kantor_rog», «40»); 0", opis="kurier idzie od strony bramy"),
          Z(f, "await go(8, «8@%s», «37», 2);" % F9W5, opis="ukryty w zaułku (F9 W5 rozdz. 2)"),
          Z(f, "$gameMap.event(733).locate(«13@pt:PLACES.backFront», «40»); 0", opis="kurier przy tylnych drzwiach"),
          Z(f, "$gamePlayer.locate(«7@pt:PLACES.backFront», «40»); $gamePlayer.setDirection(6); 0", opis="trzy kroki od drzwi"),
          Z(f, "await go(8, «12@%s», «41», 8);" % F9W5, ile=4),
          Z(f, "await go(8, «10@pt:PLACES.backFront», «40», 8);", ile=2, opis="przed tylnymi drzwiami"),
          Z(f, "await go(8, «48@brama_wsch», «50», 6);", ile=2, opis="do kaprala przy bramie wschodniej"),
          Z(f, "await go(8, «14@bud:95», «39», 8);", opis="przed frontowymi drzwiami kantoru"),
          Z(f, "e.x === «14@ev95» && e.y === «38» && /door=kantor/", opis="frontowe drzwi kantoru (95)"),
          Z(f, "await go(8, «30@ratusz_przed», «40», 8);", ile=2, opis="w drodze do sołtysa (rozmowa stawia bohatera obok)")]
    return S


# ------------------------------------------------------------------------------------------------ grupa G2: story, town_quests, town_quests2, town_well, town_interiors, cysterna, podgrodzie, podgrodzie_life, orzel, act3, act2_quests
RYNEK = "blok:rynek (punkty wokół studni)"
TARAS = "blok:taras_tawerna"
ZACH = "blok:brama_zachodnia"
KAMERA = "pt:rynek kamera"   # (24,37) -> (53,55): blok rynku daje (51,53), a ta kratka jest zajęta (pod studnią)


def _testy_G2(M, Z, T):
    S = []
    # ---------------------------------------------------------------- story_test: drzwi tawerny (zdarzenie 22), wyjście z tawerny
    f = "tests/story_test.js"
    S += [Z(f, "$gamePlayer.locate(«24@bud:22», «17»); $gamePlayer.setDirection(8);", ile=2, opis="przed drzwiami tawerny"),
          Z(f, "at8.door === «24|x@ev22»", opis="x drzwi tawerny"),
          Z(f, "out8.x === «24@bud:22» && out8.y === «17»", opis="wyjście z tawerny (Map001 ev11)")]
    # ---------------------------------------------------------------- town_quests_test
    f = "tests/town_quests_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «8@kowadlo», y: «50», dir: 8, hour: 8, day: 2", opis="start przy kuźni (pod kowadłem)"),
          Z(f, "t.locate(«29@bud:137», «48», 8);", opis="W1: pod drzwiami Kuby"),
          Z(f, "t.locate(«6@bud:88», «40», 2);", ile=2, opis="W1: z dala od drzwi Kuby (przed piekarnią)"),
          Z(f, "await at(d8 + 3, 2.95, 5);\n    await t.locate(«24@%s», «37», 8);" % KAMERA, opis="W2: dzwon nocą - na rynku"),
          Z(f, "[[952, «25@pt:notice_tavern», «17»], [953, «7@pt:notice_bakery», «40»], [954, «8@pt:notice_smithy», «49»], "
               "[955, «15@pt:notice_kantor», «40»]]", opis="K17: kratka pod każdą ścianą z obwieszczeniem"),
          Z(f, "t.locate(«6@pt:bakery_window», «40», 8);", opis="K4: pod okienkiem piekarni (951)"),
          Z(f, "t.locate(«26@pt:south_gate», «55», 8);", opis="D5: ślady pod bramą południową (956)"),
          Z(f, "t.go(8, «46@brama_wsch», «51», 6);", opis="D5: z powrotem przy bramie wschodniej (kapral)"),
          Z(f, "t.locate(«25@%s», «33», 8);" % RYNEK, opis="dzień targowy: przy studni na rynku"),
          Z(f, "t.locate(«13@ulica_rzem», «51», 4);", opis="K19: Rafał nocą wędruje przy ulica_rzem"),
          Z(f, "w.locate(«48@brama_wsch», «51»)", opis="K29: kapral odchodzi do bramy wschodniej"),
          Z(f, "t.locate(«20@stragan1», «34», 8);", opis="D4: przy straganie Hanki (stragan1 < 7)"),
          Z(f, "t.go(8, «22@stragan1», «31», 8);", opis="K31: Feliks rano przy straganach")]
    # ---------------------------------------------------------------- town_quests2_test
    f = "tests/town_quests2_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «26@rynek_srodek», y: «36», dir: 8, hour: 10, day: 7", opis="start na rynku"),
          Z(f, "t.locate(«26@ev245», «34», 4);", opis="K26: obok zejścia do studni (245), twarzą do niej"),
          Z(f, "t.locate(«33@stragan2», «30», 4);", opis="K37: blisko Feliksa przy stragan2 (<= 9)"),
          Z(f, "t.go(8, «30@stragan_kosci», «33», 8);", opis="K39: przy kościach Lucjana"),
          T(f, "Math.hypot(z0.z[0] - z0.f[0], z0.z[1] - z0.f[1]) < 2 &&", "Math.hypot(z0.z[0] - z0.f[0], z0.z[1] - z0.f[1]) < 2.5 &&",
            opis="K37: na nowej mapie pierwszy krok ucieczki złodzieja (obok Feliksa) idzie po skosie - odczyt bywa już o krok dalej (2,24)")]
    # ---------------------------------------------------------------- town_well_test: studnia (241/242 <Studnia:2>)
    f = "tests/town_well_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «24@ev241», y: «36»", opis="pod studnią, twarzą do 241"),
          Z(f, "e[2] === «35|dy@ev241»", opis="dolny rząd studni (241/242)"),
          Z(f, "t.locate(«24@ev241», «36», 8);", ile=2, opis="pod studnią")]
    # ---------------------------------------------------------------- town_interiors_test (czyta nieistniejące tools/interiors/staging - nieaktualny)
    S.append(Z("tests/town_interiors_test.js", "t.newGame({ map: 8, x: «24@%s», y: «37»" % KAMERA, opis="start na rynku"))
    # ---------------------------------------------------------------- cysterna_test: studnia miejska
    S.append(Z("tests/cysterna_test.js", "t.go(8, «24@ev241», «36», 8);", opis="pod studnią miejską"))
    # ---------------------------------------------------------------- podgrodzie_test: brama zachodnia zostaje (sprawdzenie, bez zmian)
    f = "tests/podgrodzie_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «5@%s», y: «50»" % ZACH, opis="sprawdzenie"),
          Z(f, "gate: [p(«0@{0}», «50»), p(«1@{0}», «50»), p(«0@{0}», «51»), p(«1@{0}», «51»), p(«2@{0}», «50»), p(«2@{0}», «51»)], "
               "towers: [p(«0@{0}», «49»), p(«1@{0}», «49»), p(«0@{0}», «52»), p(«1@{0}», «52»)]".format(ZACH), opis="sprawdzenie"),
          Z(f, 'JSON.stringify(gate.exits) === "[[«0@ev237»,«50»],[«0@ev238»,«51»]]"', opis="sprawdzenie"),
          Z(f, "t.locate(«4@%s», «51», 4);" % ZACH, opis="sprawdzenie"),
          Z(f, "t.locate(«2@%s», «50», 4);" % ZACH, opis="sprawdzenie"),
          Z(f, "at8.x === «1@pt:Map111 Podgrodzie ev66» && at8.y === «51»", opis="sprawdzenie")]
    # ---------------------------------------------------------------- podgrodzie_life_test: liczenie mieszkańców miasta
    S.append(Z("tests/podgrodzie_life_test.js", "t.go(8, «24@%s», «37», 8);" % KAMERA, opis="na rynek"))
    # ---------------------------------------------------------------- orzel_test: lądowanie w mieście (TOWN_SQUARES[8])
    f = "tests/orzel_test.js"
    S += [Z(f, "await go(8, «25@%s», «19», 2);" % TARAS, opis="dziedziniec przed tawerną (plac TOWN_SQUARES[8])"),
          Z(f, "$gamePlayer.locate(«29@blok:mur_zamku», «25»); const b = OrzelLot.landingSpot(); $gamePlayer.locate(«25@%s», «19»);" % TARAS,
            opis="poza placami (mur zamku, region 2 - jak dawniej) / plac przed tawerną")]
    # ---------------------------------------------------------------- act3_test: oblężenie (drzwi tawerny + 3, lina dzwonu)
    f = "tests/act3_test.js"
    S += [Z(f, "t.go(8, «24@bud:22», «19», 8);", ile=4, opis="F9 oblężenia: drzwi + 3"),
          Z(f, 'started.ropeAt.join() === "«47@pt:Act3_Data.js:45 bell»,«29»"', opis="lina dzwonu (859) pod dzwonem"),
          Z(f, "heroAt(«10@%s», «19», 6);" % TARAS, ile=2, opis="z dala od drzwi na dziedzińcu"),
          Z(f, "t.go(8, «10@%s», «19», 6);" % TARAS, opis="z dala od drzwi na dziedzińcu"),
          Z(f, "their way to the tavern's door («24@pt:Act3_Data.js:41 door»,«17»)", opis="opis"),
          Z(f, "h.hx === «24@pt:Act3_Data.js:41 door» && h.hy === «17»", opis="cel fali 1 = Act3 SPOTS[8].door")]
    # ---------------------------------------------------------------- act2_quests_test: rynek
    f = "tests/act2_quests_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «24@%s», y: «37»" % KAMERA, opis="start na rynku"),
          Z(f, "t.go(8, «24@%s», «37», 8);" % KAMERA, opis="na rynek")]
    return S


# ------------------------------------------------------------------------------------------------ grupa G3: w1_chapters, w2_archive, w4_borgar, w4_key, w6, w7, garnizon, zasoby, wrak, regulars, regulars_quests
RYNEK = "blok:rynek (punkty wokół studni)"
OBOZ_Y = "pt:oboz kamera"      # wiersz ulicy przed obozem pod murem południowym (stary wiersz 50 -> nowy 89)


def _testy_G3(M, Z, T):
    S = []
    # ---------------------------------------------------------------- w1_chapters_test.js
    f = "tests/w1_chapters_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «24@nm:plac_studnia», y: «37», dir: 8, hour: 9, day: 4", opis="start na rynku przy studni (stara 24,37 -> pod studnią jest ława)"),
          Z(f, "t.locate(«26@ev245», «34», 4);", opis="przy studni, twarzą do zejścia (zdarzenie 245)"),
          Z(f, "t.go(8, «8@kowadlo», «50», 8);", opis="do Tadka przy kowadle"),
          Z(f, "out && thrown.x === «50@pt:manor.out» && thrown.y === «51»", opis="wyrzucony z ogrodu dworu (Dwor_Data manor.out)"),
          Z(f, "t.go(8, «36@ratusz_przed», «40», 8);", ile=4, opis="do sołtysa / Feliksa przy ratuszu"),
          Z(f, "t.go(8, «23@studnia_rynek», «36», 8);", opis="do Kuby przy studni")]
    # ---------------------------------------------------------------- w2_archive_test.js
    f = "tests/w2_archive_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «40|x@dzwonnica», y: «32|dy@dzwonnica», dir: 6",
            opis="start pod dzwonnicą (stara 40,32 przesunięta jak dzwonnica wypada w murze - x miejsca dzwonnica, y o 2 niżej)"),
          Z(f, "t.locate(«6@ev39», «15», 8);", opis="w otwartej furtce ogrodu"),
          Z(f, "t.locate(«6@ev246», «10», 2);", opis="w ogrodzie nad płytą"),
          Z(f, "t.locate(«6@ev246», «13», 8);", opis="pod płytą"),
          Z(f, "t.go(8, «20@rynek_lawka», «37», 8);", opis="do Ambrożego przy ławce"),
          Z(f, "t.go(8, «10@kantor_przed», «40», 6);", opis="do Baltazara przed kantorem")]
    # ---------------------------------------------------------------- w4_borgar_test.js
    f = "tests/w4_borgar_test.js"
    S += [Z(f, "t.go(8, «24@ev22», «17», 8);", opis="przed drzwiami tawerny"),
          Z(f, "$gamePlayer.locate(«24@ev22», «17»); $gamePlayer.setDirection(8); $gameMap.event(22).start();"),
          Z(f, "door.map === 8 && door.y >= «17|dy@ev22»")]
    # ---------------------------------------------------------------- w4_key_test.js
    S.append(Z("tests/w4_key_test.js", "t.go(8, «8@kowadlo», «50», 4);", opis="do Tadka przy kowadle"))
    # ---------------------------------------------------------------- w6_test.js
    f = "tests/w6_test.js"
    S += [Z(f, "t.newGame({ map: 8, x: «31|dx@blok:mur_S», y: «49|y@%s», dir: 2" % OBOZ_Y,
            opis="ulica przed obozem (stary wiersz 49 + przesunięcie muru = budynki stajni; wiersz ulicy z punktu kamery epilogu „oboz”)"),
          Z(f, "Math.abs(rs.x - «33@w6_ognisko») + Math.abs(rs.y - «51»)", opis="Rafał przy ognisku obozu"),
          Z(f, "w6_ognisko «33@w6_ognisko»,«51»)", opis="opis checka"),
          Z(f, "t.locate(«33|dx@blok:mur_S», «49|y@%s», 2);" % OBOZ_Y),
          Z(f, "t.go(8, «22|dx@blok:mur_S», «49|y@%s», 2);" % OBOZ_Y),
          Z(f, "t.go(8, «30|dx@blok:mur_S», «49|y@%s», 2);" % OBOZ_Y, ile=2, opis="do Ludmiły w obozie"),
          Z(f, "t.locate(«26|dx@blok:mur_S», «49|y@%s», 2);" % OBOZ_Y, opis="druga fala: namiot 904, Bogdan 906"),
          Z(f, "t.go(8, «20@%s», «33», 8);" % RYNEK, ile=2, opis="na rynek (Ludmiła, Marek)"),
          Z(f, "t.go(8, «12@kantor_przed», «42», 8);", opis="pod kantorem (znak „!” Baltazara)")]
    # ---------------------------------------------------------------- w7_test.js
    f = "tests/w7_test.js"
    S += [Z(f, "go(8, «24@ev241», «36», 8);", ile=3, opis="rynek przy studni (Feliks na targu, Kuba)"),
          Z(f, "t.locate(«24@schody_rzem», «44», 8);", opis="z dala od Feliksa"),
          Z(f, "go(8, «47@brama_wsch», «51», 4);", opis="myto przy bramie wschodniej"),
          Z(f, "go(8, «22@stragan1», «33», 8);", opis="do Hanki przy straganie")]
    # ---------------------------------------------------------------- garnizon_test.js
    f = "tests/garnizon_test.js"
    W = "pt:garnizon_werbownik"
    S += [Z(f, "t.newGame({ map: 8, x: «24@%s», y: «38», dir: 8, hour: 10, day: 11" % W, opis="rynek przy stole werbownika"),
          Z(f, "t.go(8, «24@%s», «38», 8);" % W),
          Z(f, "w miasteczku («22@%s»,«37»)" % W, opis="opis checka"),
          Z(f, "w.w && w.w[0] === «22@%s» && w.w[1] === «37»" % W, opis="werbownik na rynku (Garnizon_Data garnizon_werbownik)"),
          Z(f, "t.newGame({ map: 8, x: «31@blok:mur_S», y: «50», dir: 8, hour: 10, day: 30", opis="obóz pod murem (Ludmiła)"),
          Z(f, "t.go(8, «31@blok:mur_S», «50», 8);", ile=2),
          Z(f, "t.newGame({ map: 8, x: «10@pt:Kłos 659», y: «42», dir: 8, hour: 10, day: 3", opis="pod tylnymi drzwiami kantoru"),
          Z(f, "t.go(8, «10@pt:Kłos 659», «42», 8);"),
          Z(f, "kn1 && kn1[0] === «9@pt:Kłos 659» && kn1[1] === «40»", opis="Kłos (659) przy tylnych drzwiach kantoru")]
    # ---------------------------------------------------------------- zasoby_test.js
    S.append(Z("tests/zasoby_test.js", "t.go(8, «9@pt:Zasoby.js:1420», «81», 8);", opis="pod polem mieszczan pole_1 (F9 Zasoby + 1 wiersz)"))
    # ---------------------------------------------------------------- wrak_test.js
    S.append(Z("tests/wrak_test.js", "t.go(8, «30@pt:rozbitek_studnia», «34», 4);", opis="na wschód od studni (miejsce rozbitek_studnia)"))
    # ---------------------------------------------------------------- regulars_test.js
    f = "tests/regulars_test.js"
    S += [Z(f, "t.go(8, «16@garbarnia», «46», 8);", opis="do Ignaca w garbarni"),
          Z(f, "t.go(8, «6@ev39», «18», 8);", opis="przed furtką ogrodu rycerzy"),
          Z(f, "t.locate(«5@ev39», «17», 8);", ile=2, opis="w linii z lewym posągiem (strzał w czapkę K33)"),
          Z(f, "t.locate(«6@ev39», «17», 8);", opis="na osi furtki - pudło"),
          Z(f, "(from «6@ev39»,«17»)", opis="opis checka"),
          Z(f, "(from «5@ev39»,«17»)", opis="opis checka"),
          Z(f, "t.go(8, «31@blok:mur_S», «52», 8);", ile=2, opis="do Ludmiły w obozie")]
    # ---------------------------------------------------------------- regulars_quests_test.js
    f = "tests/regulars_quests_test.js"
    S += [Z(f, "t.go(8, «22@stragan1», «33», 8);", opis="do Hanki przy straganie"),
          Z(f, "t.locate(«46@brama_wsch», «51», 6);", opis="do kaprala przy bramie wschodniej"),
          Z(f, "t.newGame({ map: 8, x: «8@kowadlo», y: «50», dir: 4", opis="do Tadka przy kowadle"),
          Z(f, "t.go(8, «12@kantor_przed», «41», 8);", opis="do Baltazara przed kantorem"),
          Z(f, "t.go(8, «20@rynek_lawka», «36», 8);", opis="do Ambrożego przy ławce"),
          Z(f, "t.locate(«5@ev43», «10», 8);", opis="przed cokołem lewego posągu (zdarzenie 43)"),
          Z(f, "t.go(8, «24@pt:w3_kupala», «53», 8);", opis="pod ogniskiem Kupały (miejsce 959) przy bramie południowej")]
    return S


# ------------------------------------------------------------------------------------------------ grupa G4: light_shadow, talk_busts, tree_see_through, waterfall, kruk, latarnia, motyle, pustelnia, ludzie, field_loss + skrypty zrzutów i pomiarów
RYNEK = "blok:rynek (punkty wokół studni)"


def _testy_G4(M, Z, T):
    S = []
    # ---------------------------------------------------------------- light_shadow: nocą przy koszu żarowym (226 = pierwszy <Light: bez LightWhen)
    S.append(Z("tests/light_shadow_test.js", "await t.newGame({ map: 8, x: «46@blok:brama_wschodnia», y: «50», day: 3, hour: 23",
               opis="start przy bramie wschodniej; bohater staje 2 kratki na lewo od kosza 226"))
    # ---------------------------------------------------------------- talk_busts: rynek o 10:00, obok straganu piekarki
    S.append(Z("tests/talk_busts_test.js", "await t.newGame({ map: 8, x: «20@stragan1_obok», y: «30», hour: 10",
               opis="przy straganie Hanki (stragan1_obok; blok rynku dałby kratkę nieprzechodnią)"))
    # ---------------------------------------------------------------- tree_see_through: przed tawerną, potem pierwsze ozdobne drzewo z mapy
    S.append(Z("tests/tree_see_through_test.js", "await t.go(8, «24@ev22», «18», 2);", opis="przed drzwiami tawerny"))
    # ---------------------------------------------------------------- waterfall: stawu i wodospadu nie ma (usunięte 2026-10-12) - start w miejscu „staw”
    f = "tests/waterfall_test.js"
    S += [Z(f, "await t.newGame({ map: 8, x: «39@staw», y: «11», dir: 6", opis="miejsce TownLife „staw” (stawu nie ma; test sprawdza wtedy tylko zestaw kafli i studnię)"),
          Z(f, '"isWaterTile", «40@staw», «11»), events: $gameMap.eventsXy(«40@staw», «11»).length', ile=2, opis="dawny brzeg stawu (dziś bez wody)"),
          Z(f, "$gameMap.setDisplayPos(«31|dx@staw», 0);", opis="tylko gdy wodospad wróci"),
          Z(f, "x: $gameMap.adjustX(«40|dx@staw») * 48", opis="tylko gdy wodospad wróci")]
    # ---------------------------------------------------------------- kruk / latarnia / motyle / pustelnia: na rynek, potem rozmowa z mieszkańcem
    S.append(Z("tests/kruk_test.js", "await t.go(8, «30@%s», «30», 2);" % RYNEK, opis="rynek (rozmowa z kowalem)"))
    S.append(Z("tests/latarnia_test.js", "await t.go(8, «26@%s», «30», 2);" % RYNEK, ile=3, opis="rynek (Baltazar)"))
    S.append(Z("tests/motyle_test.js", "await t.go(8, «26@%s», «30», 2);" % RYNEK, opis="rynek (Ela)"))
    S.append(Z("tests/pustelnia_test.js", "await t.go(8, «30@rynek_rog», «40», 2);", ile=2,
               opis="róg rynku (blok rynku dałby kratkę nieprzechodnią 57,56); rozmowa z Ambrożym"))
    # ---------------------------------------------------------------- ludzie: do kowala (K63)
    S.append(Z("tests/ludzie_test.js", "await t.go(8, «8@kowadlo», «50»);", opis="przy kuźni (kowadło)"))
    # ---------------------------------------------------------------- field_loss: do sołtysa przed ratuszem
    S.append(Z("tests/field_loss_test.js", "await t.go(8, «38@ratusz_przed», «42», 8);", ile=2, opis="przed ratuszem (sołtys o 10:00/11:00)"))
    # ---------------------------------------------------------------- narzędzia: zrzuty
    f = "tools/ekran_tytulowy/capture.js"
    S += [Z(f, "map: 8, x: «24@ev22», y: «19», cx: «24@ev22», cy: «13», hour:", ile=4, opis="przed tawerną, kamera na fasadę"),
          Z(f, "map: 8, x: «24@ev22», y: «19», cx: «24@ev22», cy: «14.5», hour:", opis="przed tawerną, kamera na fasadę")]
    f = "tools/act3/record.js"
    S += [Z(f, "await t.go(8, «15@ev22», «19», 6, { calm: false });", opis="dziedziniec tawerny"),
          Z(f, "cam = [«23@ev22», «19»];", opis="kamera przed tawerną")]
    S.append(Z("tools/motyle/capture.js", "await t.go(8, «26@%s», «30», 2);" % RYNEK, opis="rynek (Ela)"))
    S.append(Z("tools/orzel/lot_zrzut.js", "[8, «26@rynek_srodek», «36», 38, 11.5,", opis="środek rynku (widok z lotu)"))
    # ---------------------------------------------------------------- pomiar_czasu (jednorazowe pomiary dróg; wyniki *.json zostają stare)
    f = "tools/pomiar_czasu/pomiar1.js"
    S += [Z(f, '[8, «24@ev22», «16», false, 1, "miasteczko (brama płd.) -> tawerna"]', opis="cel: drzwi tawerny (zdarzenie 22)"),
          Z(f, '[8, «51@blok:mur_E», «50», false, 24, "tawerna -> posiadłość Lorda"]', opis="cel: przejście na wschodniej krawędzi (221)")]
    f = "tools/pomiar_czasu/pomiar2.js"
    T1 = "«23@pt:Map001 ev10», «17»"
    S += [Z(f, '[8, %s, «0@ev237», «50», "miasteczko: tawerna -> brama zachodnia (Podgrodzie)"]' % T1),
          Z(f, '[8, %s, «25@ev245», «33», "miasteczko: tawerna -> studnia na rynku"]' % T1),
          Z(f, '[8, %s, «48@bud:236», «31», "miasteczko: tawerna -> dzwonnica"]' % T1),
          Z(f, '[8, %s, «47@bud:4», «40», "miasteczko: tawerna -> ratusz"]' % T1),
          Z(f, '[8, %s, «12@bud:134», «47», "miasteczko: tawerna -> dom kowala"]' % T1),
          Z(f, '[8, %s, «10@bud:94», «40», "miasteczko: tawerna -> kantor"]' % T1),
          Z(f, '[8, %s, «51@blok:mur_E», «50», "miasteczko: tawerna -> brama dworu"]' % T1)]
    # (pomiar2.js [8, 24, 67, 23, 17, "brama płd. -> tawerna"]: start 24,67 = stara brama sprzed powiększenia - poza mapowaniem, zostaje)
    # ---------------------------------------------------------------- powieksz/stan.json: „stara część” mapy 8 = miasto w murach (jak Okolice_Data OLD[8])
    S.append(T("tools/powieksz/stan.json", '"8": {\n  "old": [\n   52,\n   69\n  ],',
               '"8": {\n  "old": [\n   %d,\n   %d\n  ],' % (M.nowa["width"], M.za_murem),
               opis="nowa część = tylko rzędy za murem (przerzedz.py i kontrola --nowe nie ruszają nowego miasta); jak OkoliceData.OLD[8]"))
    return S


def specs_testy(M):
    S = []
    for f in (_testy_G1, _testy_G2, _testy_G3, _testy_G4):
        S += f(M, Z, T)
    return S


# ================================================================================================ (5) stare generatory tools/town

OSTRZEZENIE = "UWAGA (2026-10-22): NIE URUCHAMIAĆ na nowym mieście - Map008 przebudowana (tools/miasto2, docs/miasteczko/NOWE_MIASTO.md); ten generator zna stary układ."


def stare_generatory(K):
    """pliki .py / .js w tools/town (bez podfolderów), które czytają albo piszą Map008"""
    d = os.path.join(K, "tools", "town")
    out = []
    if not os.path.isdir(d):
        return out
    for n in sorted(os.listdir(d)):
        p = os.path.join(d, n)
        if not os.path.isfile(p) or not n.endswith((".py", ".js")):
            continue
        b = wczytaj(p)
        if b"Map008" in b or b"OUTSIDE_MAP" in b:
            out.append("tools/town/" + n)
    return out


# ================================================================================================ wykonanie

class Plan:
    """wszystkie zapisy: ścieżka względna -> (bajty przed albo None, bajty po)"""

    def __init__(self, K):
        self.K = K
        self.pliki = {}       # wzgl -> PlikTekstowy
        self.zapisy = {}

    def plik(self, wzgl):
        if wzgl not in self.pliki:
            p = os.path.join(self.K, wzgl)
            self.pliki[wzgl] = PlikTekstowy(p, wzgl) if os.path.exists(p) else None
        return self.pliki[wzgl]

    def zapis(self, wzgl, przed, po):
        if przed is not None and przed == po:
            return
        self.zapisy[wzgl] = (przed, po)


def zastosuj_specs(plan, R, M, specs):
    for sp in specs:
        pt = plan.plik(sp.plik)
        if pt is None:
            R.zmiana(sp.plik, None, "", "", "pominieta", "brak pliku")
            continue
        try:
            st, nw, op = sp.teksty(M)
        except BladMapowania as ex:
            R.zmiana(sp.plik, None, getattr(sp, "spec", getattr(sp, "stary", "")), "?", "pominieta", "mapowanie: %s" % ex)
            continue
        pt.podmien(R, st, nw, op, ile=sp.ile, blok=sp.blok)


def krok_mapy(plan, R, M, K):
    """(1) data/Map008.json <- staging (z kontrolą sumy), Map178-190 <- wnetrza, MapInfos.json; sprawdzenie drzwi i wyjść"""
    ok = True
    p8 = os.path.join(K, "data", "Map008.json")
    b8 = wczytaj(p8)
    if not os.path.exists(SHA_PLIK):
        R.uwaga("BŁĄD", "brak tools/miasto2/sha_przed.txt (suma data/Map008.json z chwili budowy nowej mapy) - nic nie instaluję")
        return False
    sha0 = open(SHA_PLIK, encoding="utf-8").read().split()[0].strip()
    nowa = M.nowa_bajty
    if b8 == nowa:
        R.zmiana("data/Map008.json", None, "sha " + sha(b8)[:12], "staging", "juz", "nowa mapa już zainstalowana")
    elif sha(b8) == sha0:
        if tekst_mapy(json.loads(nowa.decode("utf-8"))) != nowa:
            R.uwaga("BŁĄD", "tools/miasto2/staging/Map008.json nie jest w układzie edytora - nie instaluję")
            return False
        plan.zapis("data/Map008.json", b8, nowa)
        R.zmiana("data/Map008.json", None, "sha " + sha(b8)[:12] + " (stara mapa)", "sha " + sha(nowa)[:12] + " (staging)", "zmiana",
                 "instalacja nowej mapy miasta")
    else:
        R.uwaga("BŁĄD", "data/Map008.json zmieniła się od budowy nowej mapy (sha %s, oczekiwano %s z sha_przed.txt) - ktoś edytował "
                        "mapę w edytorze? Przebuduj staging (tools/miasto2/build.py) i zapisz sumę od nowa. Nic nie instaluję."
                % (sha(b8)[:12], sha0[:12]))
        return False
    # ---- drzwi nowych budynków na mapie 8 -> wejście wnętrza (sprawdzenie staging)
    ev8 = {e["id"]: e for e in M.nowa["events"] if e}
    for mid, mm in sorted(M.meta.items(), key=lambda kv: int(kv[0])):
        d = mm.get("drzwi_na_mapie_8") or {}
        e = ev8.get(d.get("id"))
        we = mm.get("wejscie") or {}
        tr = [c["parameters"] for pg in (e["pages"] if e else []) for c in pg["list"] if c["code"] == 201]
        if not e or (e["x"], e["y"]) != (d.get("x"), d.get("y")):
            R.uwaga("BŁĄD", "Map%s %s: drzwi %s nie stoją na (%s,%s) nowej mapy" % (mid, mm["nazwa"], d.get("id"), d.get("x"), d.get("y")))
            ok = False
        elif not tr or any(t[0] != 0 or t[1] != int(mid) or (t[2], t[3]) != (we.get("x"), we.get("y")) for t in tr):
            R.uwaga("BŁĄD", "Map%s %s: drzwi %d przenoszą na %s zamiast (%s, %s, %s)" % (
                mid, mm["nazwa"], e["id"], [t[1:4] for t in tr], mid, we.get("x"), we.get("y")))
            ok = False
    # ---- wnętrza 178-190
    for mid, mm in sorted(M.meta.items(), key=lambda kv: int(kv[0])):
        src = os.path.join(HERE, "wnetrza", mm["plik"])
        rel = "data/Map%03d.json" % int(mid)
        dst = os.path.join(K, rel)
        b = wczytaj(src)
        raw = json.loads(b.decode("utf-8"))
        cele = {tuple(x["przed_drzwiami"]) for x in M.bud if x.get("wnetrze") == int(mid)}
        zle = []
        for e in raw["events"]:
            if not e:
                continue
            for pg in e["pages"]:
                for c in pg["list"]:
                    if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == MAPA and (c["parameters"][2], c["parameters"][3]) not in cele:
                        zle.append((e["id"], c["parameters"][2:4]))
        if zle:
            R.uwaga("BŁĄD", "%s: wyjścia %s nie prowadzą przed drzwi z budynki.json %s - nie instaluję tej mapy" % (rel, zle, sorted(cele)))
            ok = False
            continue
        if tekst_mapy(raw) != b:
            R.uwaga("UWAGA", "%s: plik wnętrza nie jest w układzie edytora (kopiuję bez zmian)" % mm["plik"])
        if os.path.exists(dst):
            if wczytaj(dst) == b:
                R.zmiana(rel, None, "", mm["plik"], "juz", "wnętrze już zainstalowane")
            else:
                R.uwaga("BŁĄD", "%s już istnieje i różni się od tools/miasto2/wnetrza/%s - nie nadpisuję" % (rel, mm["plik"]))
                ok = False
            continue
        plan.zapis(rel, None, b)
        R.zmiana(rel, None, "(brak)", "tools/miasto2/wnetrza/" + mm["plik"], "zmiana", "nowe wnętrze „%s”" % mm["nazwa"])
    # ---- MapInfos.json
    rel = "data/MapInfos.json"
    bi = wczytaj(os.path.join(K, rel))
    infos = json.loads(bi.decode("utf-8"))
    zmiana = False
    order = max(e["order"] for e in infos if e)
    wzor = infos[-1] if infos[-1] else next(e for e in reversed(infos) if e)
    for mid, mm in sorted(M.meta.items(), key=lambda kv: int(kv[0])):
        i = int(mid)
        while len(infos) <= i:
            infos.append(None)
        cur = infos[i]
        if cur:
            if cur.get("name") == mm["nazwa"] and cur.get("parentId") == mm.get("rodzic", MAPA):
                R.zmiana(rel, None, "", "%d %s" % (i, mm["nazwa"]), "juz", "wpis już jest")
            else:
                R.uwaga("BŁĄD", "MapInfos: numer %d zajęty przez „%s” (rodzic %s) - nie nadpisuję" % (i, cur.get("name"), cur.get("parentId")))
                ok = False
            continue
        order += 1
        infos[i] = {"id": i, "expanded": False, "name": mm["nazwa"], "order": order, "parentId": mm.get("rodzic", MAPA),
                    "scrollX": wzor.get("scrollX", 0), "scrollY": wzor.get("scrollY", 0)}
        zmiana = True
        R.zmiana(rel, None, "", dump(infos[i]), "zmiana", "nowy wpis")
    if zmiana:
        if tekst_mapinfos(json.loads(bi.decode("utf-8"))) != bi:
            R.uwaga("BŁĄD", "MapInfos.json nie jest w układzie edytora - nie zapisuję wpisów")
            ok = False
        else:
            plan.zapis(rel, bi, tekst_mapinfos(infos))
    return ok


def cel_przeniesienia(M, mid, x, y):
    """nowa kratka przeniesienia z mapy mid na mapę 8 ze starej (x, y)"""
    for b in M.bud:
        if b.get("wnetrze") == mid and b.get("stare_drzwi"):
            sx, sy = b["stare_drzwi"][0], b["stare_drzwi"][1] + 1
            if abs(x - sx) <= 1 and y == sy:
                px, py = b["przed_drzwiami"]
                return (px + x - sx, py), "przed drzwiami „%s” (budynki.json)" % b["nazwa"]
    for p in M.punkty:
        if p["co"].startswith("Map%03d" % mid) and tuple(p["stare"]) == (x, y):
            return tuple(p["nowe"]), "punkt „%s”" % p["co"]
    # już przepięte? (cel jest jedną z nowych kratek tej mapy: przed drzwiami ±1 albo nowy punkt „MapNNN ...”)
    nowe = {(p["nowe"][0], p["nowe"][1]) for p in M.punkty if p["co"].startswith("Map%03d" % mid)}
    for b in M.bud:
        if b.get("wnetrze") == mid:
            px, py = b["przed_drzwiami"]
            nowe |= {(px - 1, py), (px, py), (px + 1, py)}
    if (x, y) in nowe:
        return None, "już przepięte"
    if y >= M.za_murem:
        return (x, y), "za murem (bez zmian)"
    raise BladMapowania("przeniesienie na (%d,%d): brak reguły (ani drzwi z budynki.json, ani punktu „Map%03d ...” w mapowaniu) - nie zgaduję" % (x, y, mid))


def krok_przeniesienia(plan, R, M, K):
    """(2) kod 201 na mapę 8 w innych mapach data/ (bez 8 i nowych wnętrz)"""
    nowe = {int(k) for k in M.meta}
    for n in sorted(os.listdir(os.path.join(K, "data"))):
        m = re.fullmatch(r"Map(\d{3})\.json", n)
        if not m or int(m.group(1)) in nowe or int(m.group(1)) == MAPA:
            continue
        mid, rel = int(m.group(1)), "data/" + n
        b = wczytaj(os.path.join(K, rel))
        if b'[0,8,' not in b and b'[0, 8,' not in b:
            continue
        raw = json.loads(b.decode("utf-8"))
        edytor = tekst_mapy(raw) == b
        tekst = b.decode("utf-8")
        zm = 0
        for e in raw["events"]:
            if not e:
                continue
            for pi, pg in enumerate(e["pages"]):
                for c in pg["list"]:
                    if c["code"] != 201 or c["parameters"][0] != 0 or c["parameters"][1] != MAPA:
                        continue
                    ox, oy = c["parameters"][2], c["parameters"][3]
                    try:
                        cel, zr = cel_przeniesienia(M, mid, ox, oy)
                    except BladMapowania as ex:
                        R.zmiana(rel, None, "ev%d (%d,%d)" % (e["id"], ox, oy), "?", "pominieta", str(ex))
                        continue
                    if cel is None:
                        R.zmiana(rel, None, "", "[0,8,%d,%d]" % (ox, oy), "juz", "ev%d „%s”: już przepięte" % (e["id"], e["name"]))
                        continue
                    nx, ny = cel
                    opis = "ev%d „%s” s.%d: %s%s" % (e["id"], e["name"], pi + 1, zr, "" if M.stoi(nx, ny) else " (nowa kratka nieprzechodnia!)")
                    if (nx, ny) == (ox, oy):
                        R.zmiana(rel, None, "[0,8,%d,%d]" % (ox, oy), "[0,8,%d,%d]" % (nx, ny), "bez zmian", opis)
                        continue
                    if not edytor:
                        # plik nie w układzie edytora: tylko liczby tego przeniesienia, w miejscu (w linii zdarzenia)
                        stare_p = '"parameters":[0,8,%d,%d,%d,' % (ox, oy, c["parameters"][4])
                        nowe_p = '"parameters":[0,8,%d,%d,%d,' % (nx, ny, c["parameters"][4])
                        i0 = tekst.find('"id":%d,' % e["id"])
                        i1 = tekst.find(stare_p, i0) if i0 >= 0 else -1
                        if i1 < 0:
                            R.zmiana(rel, None, stare_p, nowe_p, "pominieta", opis + "; nie znalazłem parametrów w tekście pliku")
                            continue
                        tekst = tekst[:i1] + nowe_p + tekst[i1 + len(stare_p):]
                    c["parameters"][2], c["parameters"][3] = nx, ny
                    zm += 1
                    R.zmiana(rel, None, "[0,8,%d,%d]" % (ox, oy), "[0,8,%d,%d]" % (nx, ny), "zmiana", opis)
        if zm:
            plan.zapis(rel, b, tekst_mapy(raw) if edytor else tekst.encode("utf-8"))


def kontrole(R, M):
    """spójność mapowania z nową mapą (tylko raport)"""
    ev = {e["id"]: e for e in M.nowa["events"] if e}
    for i, v in sorted(M.zd.items()):
        e = ev.get(i)
        if not e:
            R.uwaga("SPRAWDZENIE", "zdarzenie %d „%s” z mapowania nie istnieje na nowej mapie" % (i, v["nazwa"]))
        elif (e["x"], e["y"]) != tuple(v["nowe"]):
            R.uwaga("SPRAWDZENIE", "zdarzenie %d „%s”: mapowanie mówi %s, nowa mapa ma (%d,%d)" % (i, v["nazwa"], v["nowe"], e["x"], e["y"]))
    miejsca = {}
    for e in ev.values():
        m = re.match(r"Miejsce:\s*(\S+)", e["name"] or "")
        if m:
            miejsca[m.group(1)] = (e["x"], e["y"])
    for k, v in M.spots.items():
        if k in miejsca and miejsca[k] != tuple(v["nowe"][:2]):
            R.uwaga("SPRAWDZENIE", "TownLife %s: SPOTS %s, a „Miejsce: %s” na mapie stoi na %s (gra weźmie to z mapy)" % (k, v["nowe"][:2], k, miejsca[k]))
    for b in M.bud:
        e = ev.get(b["drzwi_id"])
        if not e or (e["x"], e["y"]) != tuple(b["drzwi"]):
            R.uwaga("SPRAWDZENIE", "drzwi %s „%s”: budynki.json %s, nowa mapa %s" % (b["drzwi_id"], b["nazwa"], b["drzwi"], e and (e["x"], e["y"])))
        if not M.stoi(*b["przed_drzwiami"]):
            R.uwaga("SPRAWDZENIE", "przed drzwiami „%s” %s - kratka nieprzechodnia" % (b["nazwa"], b["przed_drzwiami"]))
    # kratki, których kod szuka DOKŁADNIE
    cap = tuple(M.strefy["ogrod_rycerzy"]["CAP"]["posag"])
    posagi = [e for e in ev.values() if e["pages"] and (e["pages"][0]["image"].get("characterName") or "").startswith("!Statue")]
    if not [e for e in posagi if (e["x"], e["y"]) == cap]:
        R.uwaga("SPRAWDZENIE", "K33: na %s nie ma zdarzenia !Statue (TownQuests capStatueId)" % (cap,))
    R.uwaga("INFO", "W3 cokoły (!Statue z y = %d, TownQuests): %s" % (cap[1], sorted((e["id"], e["x"], e["y"]) for e in posagi if e["y"] == cap[1])))
    x, y = M.kotwica("ev94")[1]
    if not [d for d in ev.values() if (d["x"], d["y"]) == (x, y) and "<Town:door=kantor>" in (d["note"] or "")]:
        R.uwaga("SPRAWDZENIE", "Kantor backDoor: na (%d,%d) brak zdarzenia z <Town:door=kantor>" % (x, y))
    for p in M.punkty:
        if p.get("stare_przechodnie") and not M.stoi(*p["nowe"]):
            R.uwaga("SPRAWDZENIE", "punkt „%s” %s: kratka nieprzechodnia na nowej mapie" % (p["co"], p["nowe"]))


UWAGI_STALE = [
    "**Ambroży w epilogu „rynek”** (Underground_Data): punkt mapowania 20,36 -> 24,44 wpada w blok kantoru (30 kratek od kamery sceny 53,55); "
    "skrypt bierze przesunięcie bloku rynku (-> 47,52, przechodnie).",
    "**Kasztelan.js F9 rozdz. 3** (Tadek przy kuźni): mapowanie zostawia 8,50 („ręcznie”, dziś przed domem szwaczki); skrypt daje kratkę "
    "względem kowadła (-> 9,64), tak jak tests/w4_key.",
    "**Testy**: kotwice dobrane według sensu miejsca (TownLife, drzwi z budynki.json, zdarzenia, bloki), bo pierwszy pasujący blok bywa mylący "
    "(np. 46,50 -> mur_S zamiast bramy wschodniej, 38,42 -> dom garbarza). Kilka kratek przesuniętych o 1 („~dx,dy”), gdy przesunięta "
    "wypadała w przeszkodzie (w5: obok Kłosa). Start „na rynku” 24,37: blok rynku daje 51,53 (zajęte pod studnią) - testy biorą punkt "
    "kamery epilogu 53,55 albo plac_studnia 50,52.",
    "**tests/town_interiors_test.js** czyta tools/interiors/staging/Map1xx_meta.json, którego nie ma (test nieaktualny już przed przebudową) - "
    "przepięty tylko start.",
    "**tests/waterfall_test.js**: stawu i wodospadu nie ma (użytkownik usunął je 2026-10-12); kratki przepięte umownie przez miejsce „staw” "
    "(66,10 - ogródek piwny). Do decyzji: zostawić albo usunąć test.",
    "**tests/miasto_mieszkancy_test.js** (agent mieszkańców, pisany pod nowe miasto) - nie ruszany; jego start 24,37 jest na nowej mapie "
    "zajęty - niech agent mieszkańców ustawi start na placu (np. plac_studnia 50,52).",
    "**tests/town_quests_test.js W1 (staw)**: krok bierze TownLife.spot('staw') z mapy („Miejsce: staw” 66,10); stawu w mieście już nie ma - "
    "krok może wymagać zmiany fabularnej.",
    "**tools/pomiar_czasu/pomiar2.js** `[8, 24, 67, 23, 17, ...]`: start 24,67 to brama sprzed powiększenia 2026-10-19 (poza mapowaniem) - zostaje.",
    "**tools/powieksz/miejsca_okolic.json** to zrzut z działającej gry - po instalacji odtworzyć (`CDP_PORT=9565 node tools/powieksz/miejsca_okolic.js`), "
    "tylko gdyby ktoś znów uruchamiał przerzedz.py na mapie 8.",
    "**Okolice_Data OLD[8]** = [szerokość, pierwszy wiersz za murem]: „stara część” = całe miasto w murach (kontrola kolizji Okolice nie "
    "zgłasza miejsc w mieście; cmentarz dostał allowOld), nowa ziemia = rzędy za murem (Farming_Plots: tam połowa rzeczy do zbierania, "
    "w mieście pełna). tools/powieksz/stan.json uzgodniony tak samo. MAPS.spare przesunięte z 178/179 (dziś Kaplica, Dom grabarza) na pierwsze "
    "wolne numery.",
    "**tools/newstart/tavern_layout.py BASE_SHA256** celowo bez zmian (stare apply_tavern_area.py / build_tavern_area.py mają odmawiać pracy).",
    "**Zapisy graczy**: zapisane pozycje na mapie 8 (bohater, posadzone sosny Forestry 1000-1999, przełączniki self zasobów) nie są "
    "przepinane - stary zapis zrobiony na mapie 8 wczyta bohatera na starej kratce nowej mapy (może wypaść w budynku) - do decyzji koordynatora.",
    "**Jednorazowe skrypty** (nie uruchamiać po przebudowie, znają stary układ): tools/apply_newstart_maps.py, tools/apply_tavern_area.py, "
    "tools/apply_tavern_interior.py, tools/newstart/build_tavern_area.py, tools/newstart/build_newstart.py, tools/tavern/v2/install_v2.py, "
    "tools/interiors/install.py, tools/podgrodzie/build_podgrodzie.py + install.py. tools/quest_places/build.py --install tylko w razie "
    "potrzeby (kratki z places.py są przepięte).",
]


def raport_md(R, K, wykonaj, gen, czas, archiwum):
    poz = collections.OrderedDict()
    for plik, linia, st, nw, status, opis in R.wpisy:
        poz.setdefault(plik, collections.Counter())[status] += 1
    o = ["# Przepięcie na nowe miasto (Map008) - raport tools/miasto2/przepnij.py", "",
         "%s, tryb: **%s**, katalog: `%s`." % (czas, "WYKONANIE (zapis)" if wykonaj else "próba (nic nie zapisano)", K)]
    if wykonaj and archiwum:
        o.append("Kopie zapasowe zmienionych plików: `%s`." % archiwum)
    o += ["", "Instalacja (edytor RPG Maker MZ zamknięty, w katalogu projektu): `python tools/miasto2/przepnij.py --wykonaj`", ""]
    suma = collections.Counter()
    for d in poz.values():
        suma.update(d)
    o += ["Razem: zmian **%d**, już przepiętych %d, bez zmian (nowa = stara) %d, **pominiętych %d**." % (
        suma["zmiana"], suma["juz"], suma["bez zmian"], suma["pominieta"]), "", "## Zmiany per plik", "",
        "| plik | zmian | już | bez zmian | pominięte |", "|---|---|---|---|---|"]
    for plik, d in poz.items():
        o.append("| `%s` | %d | %d | %d | %d |" % (plik, d["zmiana"], d["juz"], d["bez zmian"], d["pominieta"]))
    o += ["", "## Pominięte (stara wartość się nie zgadza albo brak mapowania) - do decyzji", ""]
    pom = [w for w in R.wpisy if w[4] == "pominieta"]
    if not pom:
        o.append("Brak.")
    for plik, linia, st, nw, status, opis in pom:
        o.append("- `%s:%s` `%s` -> `%s` - %s" % (plik, linia or "-", skroc(st, 200), skroc(nw, 200), opis))
    o += ["", "## Uwagi i sprawdzenia", ""]
    if not R.uwagi:
        o.append("Brak.")
    for rodzaj, t in R.uwagi:
        o.append("- **%s**: %s" % (rodzaj, t))
    o += ["", "## Odstępstwa od mapowania i czego skrypt nie przepina sam", ""] + ["- " + u for u in UWAGI_STALE]
    o += ["", "## Stare generatory tools/town/* - NIE uruchamiać na nowej mapie", "",
          "Znają stary układ Map008 (kratki, przejścia, prefabrykaty starego miasta); uruchomione nadpisałyby albo popsuły nowe miasto. "
          "Przy `--wykonaj` dostają na górze komentarz-ostrzeżenie. Tak samo `tools/apply_tavern_area.py` i "
          "`tools/newstart/build_tavern_area.py` (pilnuje ich stara suma BASE_SHA256 w tools/newstart/tavern_layout.py - "
          "celowo NIE zmieniona, więc odmówią pracy na nowej mapie).", ""]
    for g in gen:
        o.append("- `%s`" % g)
    o += ["", "## Wszystkie wpisy", "", "| status | plik:linia | stare | nowe | opis |", "|---|---|---|---|---|"]
    esc = lambda s: skroc(s, 160).replace("|", "\\|")
    for plik, linia, st, nw, status, opis in R.wpisy:
        o.append("| %s | `%s:%s` | `%s` | `%s` | %s |" % (status, plik, linia or "-", esc(st), esc(nw), esc(opis)))
    o.append("")
    return "\n".join(o)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Przepięcie wszystkiego na nowe miasto (Map008)")
    ap.add_argument("--wykonaj", action="store_true", help="zapisz zmiany (bez tego: próba)")
    ap.add_argument("--katalog", default=PROJ, help="projekt albo jego kopia")
    ap.add_argument("--archiwum", default=None, help="folder kopii zapasowych")
    ap.add_argument("--bez-testow", action="store_true", help="pomiń testy i narzędzia")
    ap.add_argument("--cicho", action="store_true")
    a = ap.parse_args(argv)
    K = os.path.abspath(a.katalog)
    wlasny = os.path.normcase(K) == os.path.normcase(PROJ)
    archiwum = a.archiwum or (ARCHIWUM if wlasny else K.rstrip("\\/") + "_archiwum")
    R = Raport(a.cicho)
    M = Mapowanie()
    plan = Plan(K)
    czas = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    rap = os.path.join(HERE, "przepnij_raport.md") if wlasny else os.path.join(K, "tools", "miasto2", "przepnij_raport.md")
    print("== przepięcie na nowe miasto: %s (%s)" % (K, "WYKONANIE" if a.wykonaj else "próba"))
    if a.wykonaj and wlasny and edytor_otwarty():
        print("Edytor RPG Maker MZ jest otwarty - nic nie zapisuję. Zamknij edytor i uruchom ponownie.")
        return 2
    print("-- (1) mapy")
    if not krok_mapy(plan, R, M, K):
        R.uwaga("BŁĄD", "krok map nieudany - przerywam, nic nie zapisano (wtyczki bez nowej mapy byłyby niespójne)")
        os.makedirs(os.path.dirname(rap), exist_ok=True)
        with open(rap, "wb") as f:
            f.write(raport_md(R, K, False, [], czas, None).encode("utf-8"))
        return 1
    print("-- (2) przeniesienia na mapę 8")
    krok_przeniesienia(plan, R, M, K)
    print("-- (3) wtyczki")
    zastosuj_specs(plan, R, M, specs_wtyczki(M))
    if not a.bez_testow:
        print("-- (4) narzędzia i testy")
        zastosuj_specs(plan, R, M, specs_narzedzia(M))
        zastosuj_specs(plan, R, M, specs_testy(M))
    gen = stare_generatory(K)
    if a.wykonaj:
        print("-- (5) ostrzeżenia w starych generatorach tools/town")
        for g in gen:
            plan.plik(g).dopisz_na_gorze(R, ("// " if g.endswith(".js") else "# ") + OSTRZEZENIE, "NIE URUCHAMIAĆ na nowym mieście")
    print("-- sprawdzenia")
    kontrole(R, M)
    for wzgl, pt in plan.pliki.items():
        if pt is not None and pt.zmieniony:
            plan.zapis(wzgl, pt.bajty, pt.bajty_po())
    pom = sum(1 for w in R.wpisy if w[4] == "pominieta")
    print("== plików do zapisu: %d, zmian: %d, pominiętych: %d" % (len(plan.zapisy), sum(1 for w in R.wpisy if w[4] == "zmiana"), pom))
    kat = None
    if a.wykonaj:
        kat = os.path.join(archiwum, datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
        for wzgl, (przed, po) in sorted(plan.zapisy.items()):
            if przed is None:
                continue
            dst = os.path.join(kat, wzgl.replace("/", os.sep))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(dst, "wb") as f:
                f.write(przed)
        if wlasny and edytor_otwarty():
            print("Edytor otwarto w trakcie - nic nie zapisuję (kopie zapasowe są w %s)" % kat)
            return 2
        for wzgl, (przed, po) in sorted(plan.zapisy.items()):
            p = os.path.join(K, wzgl.replace("/", os.sep))
            teraz = wczytaj(p) if os.path.exists(p) else None
            if teraz != przed:
                R.uwaga("BŁĄD", "%s zmienił się od wczytania - nie zapisuję go" % wzgl)
                continue
            with open(p, "wb") as f:
                f.write(po)
        print("zapisano %d plików; kopie zapasowe: %s" % (len(plan.zapisy), kat))
    os.makedirs(os.path.dirname(rap), exist_ok=True)
    with open(rap, "wb") as f:
        f.write(raport_md(R, K, a.wykonaj, gen, czas, kat).encode("utf-8"))
    print("raport: %s" % rap)
    return 0 if not pom else 3


if __name__ == "__main__":
    sys.exit(main())
