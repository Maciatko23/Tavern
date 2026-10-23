# -*- coding: utf-8 -*-
"""PRZEPIĘCIE WSZYSTKIEGO NA NOWE PODGRODZIE (Map111) - jeden powtarzalny skrypt instalacji (2026-10-22).

Mapa Podgrodzia została przebudowana w kopii roboczej (tools/podgrodzie2/build.py -> tools/podgrodzie2/staging/Map111.json),
wnętrza nowych budynków w tools/podgrodzie2/wnetrza/ (Map201-212 + meta.json). Wszystko, co w grze jest przypięte do starych
współrzędnych mapy 111 (docs/podgrodzie/POWIAZANIA_MAP111.md: wtyczki A, przeniesienia z innych map B, testy i narzędzia C),
ten skrypt przepina naraz na nowe kratki. Nowe wartości biorą się WYŁĄCZNIE z plików czytanych w chwili uruchomienia:
  tools/podgrodzie2/mapowanie.json      (bloki z przesunięciami, zdarzenia stare -> nowe, miejsca TownLife, punkty wtyczek, strefy)
  tools/podgrodzie2/budynki.json        (drzwi: id, kratka, kratka przed drzwiami, wnętrze, kratka lądowania we wnętrzu)
  tools/podgrodzie2/wnetrza/meta.json   (nowe wnętrza 201-212: nazwy, wejścia, wyjścia, drzwi na mapie 111)
  tools/podgrodzie2/staging/Map111.json (nowa mapa: sprawdzanie przejść, pozycje zdarzeń)
Po zmianie układu wystarczy przebudować mapę (build.py) i uruchomić skrypt ponownie (na nietkniętym projekcie).

Każda zmiana ma warunek starej wartości: stary tekst / stare parametry muszą się zgadzać dokładnie (tyle wystąpień, ile
trzeba); jeśli nie - zmiana jest zgłaszana i pomijana (skrypt nie zgaduje). Jeśli zamiast starej wartości stoi już nowa,
zmiana jest liczona jako „już przepięta” (ponowne uruchomienie po instalacji = 0 zmian).

Użycie (przy ZAMKNIĘTYM edytorze RPG Maker MZ; koordynator):
  python tools/podgrodzie2/przepnij.py                 próba: nic nie zapisuje, wypisuje każdą zmianę (plik, linia, stare -> nowe)
                                                       i zapisuje raport tools/podgrodzie2/przepnij_raport.md
  python tools/podgrodzie2/przepnij.py --wykonaj       zapis: najpierw kopie zapasowe zmienianych plików do
                                                       ..\\Tawerna_archiwum_2026-10-18\\dane_przed_nowym_podgrodziem\\<czas>\\
  opcje: --katalog DIR   projekt (albo jego kopia) do przepięcia (domyślnie ten, w którym leży skrypt)
         --archiwum DIR  gdzie kopie zapasowe (domyślnie jak wyżej; przy --katalog innym niż projekt: DIR_archiwum obok kopii)
         --bez-testow    pomiń testy i narzędzia (tylko gra: mapy + wtyczki)
         --cicho         nie wypisuj każdej zmiany (tylko podsumowanie)
Kroki: (1) mapy: data/Map111.json <- staging (tylko gdy data/Map111.json ma sumę z tools/podgrodzie2/sha_przed.txt, czyli nie
zmieniła się od budowy), data/Map201-212.json <- tools/podgrodzie2/wnetrza/, MapInfos.json: 12 wpisów (rodzic 111, nazwy z
meta.json, order na końcu); sprawdzenie drzwi (mapa 111 -> wejście wnętrza) i wyjść (wnętrze -> przed drzwi z budynki.json);
(2) przeniesienia na mapę 111 z innych map (kod 201: wyjścia Map112-117, Map154, Map008, Map125, ...); (3) wtyczki js/plugins;
(4) narzędzia i testy (tests/podgrodzie_test.js dostaje nową wersję, która czyta tools/podgrodzie2/*.json); (5) ostrzeżenia na
górze starych generatorów tools/podgrodzie/* (tylko przy --wykonaj). Pliki zapisywane binarnie: końce linii (LF / CRLF) każdego
pliku zostają; mapy w układzie edytora (tools/mapy/popraw.py tekst_mapy) - plik w innym układzie dostaje tylko podmianę liczb
w miejscu.
"""
import os, sys, re, json, hashlib, datetime, argparse, subprocess, collections

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(PROJ, "tools", "mapy"))
import mapylib as L   # noqa: E402  (przejścia jak w grze - tylko do sprawdzania nowych kratek)

ARCHIWUM = os.path.abspath(os.path.join(PROJ, "..", "Tawerna_archiwum_2026-10-18", "dane_przed_nowym_podgrodziem"))
SHA_PLIK = os.path.join(HERE, "sha_przed.txt")
MAPA = 111
HOMES_KLUCZ = "chata_pod_lasem"      # drzwi chaty pod lasem obsługuje Homes.js (po nazwie), bez przeniesienia na mapie


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


def przeniesienia(e):
    """parametry kodów 201 wszystkich stron zdarzenia"""
    return [c["parameters"] for pg in (e["pages"] if e else []) for c in pg["list"] if c["code"] == 201]


# ================================================================================================ mapowanie stare -> nowe

class BladMapowania(Exception):
    pass


class Mapowanie:
    """czyta mapowanie.json, budynki.json, meta.json i nową mapę; P(x, y) = nowa kratka starej kratki"""

    def __init__(self):
        self.m = json_z(os.path.join(HERE, "mapowanie.json"))
        self.bud = json_z(os.path.join(HERE, "budynki.json"))["budynki"]
        self.meta = json_z(os.path.join(HERE, "wnetrza", "meta.json"))["mapy"]
        self.nowa_bajty = wczytaj(os.path.join(HERE, "staging", "Map%03d.json" % MAPA))
        self.nowa = json.loads(self.nowa_bajty.decode("utf-8"))
        self.bloki = self.m["a_bloki"]
        self.zd = {int(k): v for k, v in self.m["b_zdarzenia"]["zachowane"].items()}
        self.spots = self.m["c_miejsca"]["stare_miejsca"]            # TownLife „Miejsce:” starej mapy: stare -> nowe
        self.nowe_miejsca = self.m["c_miejsca"]["nowe_miejsca"]
        self.punkty = self.m["c_miejsca"]["punkty_wtyczek"]
        self.strefy = self.m["d_strefy"]
        self.old = self._old()                                          # Okolice OLD[111]: osada w palisadzie = „stara część”
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

    def _old(self):
        v = self.strefy.get("okolice_OLD_111")
        if isinstance(v, list) and len(v) == 2:
            return int(v[0]), int(v[1])
        m = re.search(r"\[(\d+),\s*(\d+)\]", str(v or ""))
        if not m:
            raise BladMapowania("mapowanie.json d_strefy: brak okolice_OLD_111 ([szerokość, pierwszy wiersz za osadą])")
        return int(m.group(1)), int(m.group(2))

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
        """pierwszy blok, którego prostokąt (stary) zawiera kratkę"""
        for b in self.bloki:
            for x0, y0, x1, y1 in (b.get("prostokaty") or [b["stary"]]):
                if x0 <= x <= x1 and y0 <= y <= y1:
                    return b
        return None

    def P(self, x, y):
        """nowa kratka starej (x, y): drzwi z budynki.json, zdarzenia, miejsca TownLife, punkty wtyczek, bloki; za osadą bez zmian"""
        k = (int(x), int(y)) if float(x).is_integer() and float(y).is_integer() else None
        if k is not None:
            for zrodlo, d in (("drzwi (budynki.json)", self.drzwi), ("zdarzenie", self.po_zd), ("miejsce TownLife", self.po_spot),
                              ("punkt wtyczki", self.po_pkt)):
                if k in d:
                    return d[k], zrodlo
        b = self.blok_dla(x, y)
        if b is not None:
            return (x + b["dx"], y + b["dy"]), "blok " + b["blok"]
        if y >= self.old[1]:
            return (x, y), "teren za osadą (bez zmian)"
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
            return None, tuple(v["nowe"][:2])
        v = self.spots.get(a)
        if v:
            return tuple(v["stare"][:2]), tuple(v["nowe"][:2])
        raise BladMapowania("nieznana kotwica „%s”" % a)

    def para(self, x, y, kotw=None):
        """nowa para dla starej (x, y): z kotwicą - przesunięcie kotwicy (bez starej kotwicy: jej nowa kratka), bez - P().
        Kotwica z dopiskiem „~dx,dy”: wynik przesunięty jeszcze o (dx, dy)."""
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

    def strefa(self, nazwa):
        v = self.strefy.get(nazwa)
        if v is None:
            raise BladMapowania("mapowanie.json d_strefy: brak „%s”" % nazwa)
        return v

    def w_starej(self, x, y, w=1, h=1):
        """czy prostokąt choć jedną kratką leży w „starej części” (Okolice OLD[111])"""
        ox, oy = self.old
        return x < ox and y < oy


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
    """spec ze znacznikami -> (stary tekst, nowy tekst, [opis par]). Znaczniki:
       «N» «N»          para (x, y) kolejnych znaczników -> M.P(x, y)
       «N@K» «N»        para przesunięta jak kotwica K (ev94, blok:..., bud:..., pt:..., nm:..., klucz TownLife)
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

    def caly(self, R, sha_stary, nowa, opis=""):
        """cały plik -> nowa treść; warunek: plik jest dokładnie tą wersją (suma sha256)"""
        nowa = nowa.replace("\n", self.nl) if self.nl == "\r\n" else nowa
        if self.tekst == nowa:
            R.zmiana(self.wzgl, None, "(cały plik)", "(nowa wersja)", "juz", "już przepięte; " + opis)
            return False
        if self.zmieniony or sha(self.bajty) != sha_stary:
            R.zmiana(self.wzgl, None, "(cały plik, sha %s)" % sha(self.bajty)[:12], "(nowa wersja)", "pominieta",
                     "plik nie jest wersją, z której zrobiono nową (oczekiwano sha %s) - nie nadpisuję; %s" % (sha_stary[:12], opis))
            return False
        R.zmiana(self.wzgl, 1, "(cały plik, sha %s)" % sha_stary[:12], "(nowa wersja, %d linii)" % (nowa.count("\n") + 1), "zmiana", opis)
        self.tekst = nowa
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
# CALY(plik, sha_stary, nowa_tresc, opis="")  cały plik (tylko gdy jest dokładnie wersją o tej sumie)

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


class CALY:
    def __init__(self, plik, sha_stary, tresc, opis=""):
        self.plik, self.sha_stary, self.tresc, self.opis = plik, sha_stary, tresc, opis


# ================================================================================================ (3) wtyczki js/plugins

PL = "js/plugins/"


def _squares(lst):
    return "[" + ", ".join("[%s]" % ", ".join(str(v) for v in r) for r in lst) + "]"


def _cells(lst):
    return "[" + ", ".join("[%d, %d]" % (c[0], c[1]) for c in lst) + "]"


GDZIE_STARE = "Podgrodzie: na samym dole, za lasem na końcu ścieżki od południowej drogi. Obok chaty ogrodzona działka (furtka od ścieżki)."
GDZIE_NOWE = "Podgrodzie: za palisadą, przy lesie, na południe od osady - wyjdź południową bramą i idź ścieżką na zachód. Obok chaty ogrodzona działka (furtka od ścieżki)."
SOLTYS_STARE = "Chata pod lasem na Podgrodziu - na samym dole, za lasem, na końcu ścieżki od południowej drogi."
SOLTYS_NOWE = "Chata pod lasem na Podgrodziu - za palisadą, przy lesie, na południe od osady. Wyjdź południową bramą i idź ścieżką na zachód."

# stare prostokąty paczki A na mapie 111 (Okolice_Data PLAN_SPOTS, Zasoby_Data) -> klucz strefy w mapowanie.json
PLAN_A = [("ogrodek_1", "plot", "Ogródek praczki", (55, 10, 4, 3)), ("ogrodek_2", "plot", "Ogródek Franka", (60, 10, 4, 3)),
          ("ogrodek_3", "plot", "Ogródek znachorki", (65, 8, 4, 3)), ("wysypisko", "dump", "Wysypisko", (50, 23, 6, 4)),
          ("glinianka", "claypit", "Glinianka", (54, 36, 5, 4))]
GARDENS_STARE = [("ogrodek_1", "praczka", (2205, 2206, 2207, 2208), [(55, 10), (57, 10), (56, 12), (58, 12)]),
                 ("ogrodek_2", "franek", (2209, 2210, 2211, 2212), [(60, 10), (62, 10), (61, 12), (63, 12)]),
                 ("ogrodek_3", "znachorka", (2213, 2214, 2215, 2216), [(65, 8), (67, 8), (66, 10), (68, 10)])]


def specs_wtyczki(M):
    S = []
    # ---------------------------------------------------------------- Homes: Chata pod lasem (front, opis położenia)
    f = PL + "Homes.js"
    S += [Z(f, "doorName: /Chata pod lasem/, front: [«6@pt:Homes.js:128», «41»]", opis="HOUSES.chata.front = przed drzwiami chaty (zdarzenie 94)"),
          T(f, 'where: "%s" },' % GDZIE_STARE, 'where: "%s" },' % GDZIE_NOWE, opis="opis położenia chaty (dziennik, akt kupna)"),
          T(f, SOLTYS_STARE, SOLTYS_NOWE, opis="sołtys o chacie na sprzedaż")]
    # ---------------------------------------------------------------- Debug F9
    S.append(Z(PL + "Debug.js", '["Chata pod lasem", 111, «6@pt:Debug.js:155», «41», 2,', opis="F9 Chata pod lasem"))
    # ---------------------------------------------------------------- Kantor_Data: w5_lada (Ludmiła idzie do miasta przez bramę)
    S.append(Z(PL + "Kantor_Data.js", "const SPOTS_PODGRODZIE = { w5_lada: [«44@pt:SPOTS_PODGRODZIE w5_lada», «17», 6] };",
               opis="na nowej mapie jest też „Miejsce: w5_lada” (mapa wygrywa)"))
    # ---------------------------------------------------------------- TownQuests_Data: W6 rekwizyty na mapie 111
    f = PL + "TownQuests_Data.js"
    S += [Z(f, "w6_tent2_o: { map: 111, id: 903, x: «41@pt:w6_tent2_o», y: «7»"),
          Z(f, "w6_bogdan_o: { map: 111, id: 906, x: «37@pt:w6_bogdan_o», y: «8»"),
          Z(f, "w6_halina_o: { map: 111, id: 907, x: «41@pt:w6_halina_o», y: «10»")]
    # ---------------------------------------------------------------- Garnizon_Data: przeszukanie Podgrodzia (D26)
    S.append(Z(PL + "Garnizon_Data.js", "const PODGRODZIE_EVENTS = [{ id: 660, x: «27@pt:PODGRODZIE_EVENTS 660», y: «19» }, "
                                        "{ id: 661, x: «36@pt:PODGRODZIE_EVENTS 661», y: «10» }];"))
    # ---------------------------------------------------------------- Underground_Data: epilog „oboz” poza miastem
    f = PL + "Underground_Data.js"
    S += [Z(f, 'cam: w => (w.camp === "outside" ? [«38@pt:oboz kamera», «11»] :'),
          Z(f, '{ ludmila: [«37@pt:oboz Ludmiła», «11», 6], ela: [«38@pt:oboz Ela», «12», 8], marek: [«39@pt:oboz Marek», «11», 4], '
               'rafal: [«41@pt:oboz Rafał», «12», 4] }')]
    # ---------------------------------------------------------------- Okolice_Data: OLD[111], ENTRY[111], PLAN_SPOTS paczki A
    f = PL + "Okolice_Data.js"
    ox, oy = M.old
    S.append(T(f, "111: [46, 56]", "111: [%d, %d]" % (ox, oy), blok=(r"const OLD = \{", r"\};"),
               opis="„stara część” mapy 111 = osada w palisadzie z pasem lasu i murem; od wiersza %d nowy teren" % oy))
    S.append(Z(f, "111: [«23@pt:ENTRY[111]», «28»]", blok=(r"const ENTRY = \{", r"\};"), opis="ENTRY[111] (start chodzenia kontroli)"))
    for key, kind, name, (x, y, w, h) in PLAN_A:
        n = M.strefa(key)
        stary = '{key: "%s", pkg: "A", map: 111, kind: "%s", name: "%s", mode: "reach", x: %d, y: %d, w: %d, h: %d}' % (key, kind, name, x, y, w, h)
        allow = ", allowOld: true" if M.w_starej(n["x"], n["y"], n["w"], n["h"]) else ""
        nowy = '{key: "%s", pkg: "A", map: 111, kind: "%s", name: "%s", mode: "reach", x: %d, y: %d, w: %d, h: %d%s}' % (
            key, kind, name, n["x"], n["y"], n["w"], n["h"], allow)
        S.append(T(f, stary, nowy, opis="PLAN_SPOTS" + (" (w osadzie = stara część: allowOld)" if allow else "")))
    # ---------------------------------------------------------------- Zasoby_Data: ogródki, wysypisko, glinianka, odkrycia
    f = PL + "Zasoby_Data.js"
    G = M.strefa("zasoby_GARDENS")
    for key, owner, ids, cells in GARDENS_STARE:
        S.append(T(f, '{ key: "%s", owner: "%s", ids: [%s], cells: %s' % (key, owner, ", ".join(map(str, ids)), _cells(cells)),
                   '{ key: "%s", owner: "%s", ids: [%s], cells: %s' % (key, owner, ", ".join(map(str, ids)), _cells(G[key]["uprawy"])),
                   opis="GARDENS (grządki)"))
    D = M.strefa("wysypisko")
    st = D["sterty"]
    if not (len(st) == 3 and "główna" in str(st[0][2:] if len(st[0]) > 2 else "")):
        raise BladMapowania("wysypisko.sterty: oczekiwano 3 sterty, pierwsza „główna”")
    S.append(T(f, 'const DUMP = { key: "wysypisko", map: 111, x: 50, y: 23, w: 6, h: 4, heaps: [{ id: 2217, x: 52, y: 25, main: true, pat: 0 }, '
                  '{ id: 2218, x: 54, y: 26, pat: 1 }, { id: 2219, x: 50, y: 23, pat: 2 }]',
               'const DUMP = { key: "wysypisko", map: 111, x: %d, y: %d, w: %d, h: %d, heaps: [{ id: 2217, x: %d, y: %d, main: true, pat: 0 }, '
               '{ id: 2218, x: %d, y: %d, pat: 1 }, { id: 2219, x: %d, y: %d, pat: 2 }]' % (
                   D["x"], D["y"], D["w"], D["h"], st[0][0], st[0][1], st[1][0], st[1][1], st[2][0], st[2][1]), opis="DUMP"))
    C = M.strefa("glinianka")
    S.append(T(f, 'const CLAYPIT = { key: "glinianka", map: 111, x: 54, y: 36, w: 5, h: 4, id: 2220, ex: 56, ey: 38,',
               'const CLAYPIT = { key: "glinianka", map: 111, x: %d, y: %d, w: %d, h: %d, id: 2220, ex: %d, ey: %d,' % (
                   C["x"], C["y"], C["w"], C["h"], C["ex"], C["ey"]), opis="CLAYPIT"))
    S += [Z(f, '{ key: "wysypisko", map: 111, x: «52@pt:odkrycie wysypisko», y: «25», near: 2', opis="odkrycie"),
          Z(f, '{ key: "glinianka", map: 111, x: «56@pt:odkrycie glinianka», y: «38», near: 2', opis="odkrycie")]
    S.append(Z(PL + "Zasoby.js", '["Ogródki Podgrodzia", 111, «56@pt:F9 Ogródki Podgrodzia», «13», 8], ["Wysypisko", 111, «52@pt:F9 Wysypisko», «27», 8], '
                                 '["Glinianka", 111, «56@pt:F9 Glinianka», «40», 8]', opis="F9"))
    # ---------------------------------------------------------------- Orzeł: place Podgrodzia do lądowania
    sq = M.strefa("orzel_TOWN_SQUARES_111")
    S.append(T(PL + "Orzel_Data.js",
               "111: [[1, 18, 41, 20], [2, 27, 28, 31], [15, 38, 34, 49]],       // the street, the lower lane, the field of the Chata pod lasem",
               "111: %s,   // (2026-10-22 the new Podgrodzie) the road through the settlement, the square, the field of the Chata pod lasem" % _squares(sq),
               opis="TOWN_SQUARES[111]"))
    # ---------------------------------------------------------------- sprawdzenia: bez kratek (zostają)
    S.append(T(PL + "TownLife_Data.js", "const SPOTS_BY_MAP = { 111: {},", "const SPOTS_BY_MAP = { 111: {},",
               opis="sprawdzenie: SPOTS_BY_MAP[111] bez kratek (miejsca z „Miejsce:” mapy); bloki NOWE PODGRODZIE i THE NEW TOWN nietknięte"))
    S.append(T(PL + "Motyle_Data.js", '111: { k: 0.8, name: "działka pod lasem", region: true }', '111: { k: 0.8, name: "działka pod lasem", region: true }',
               opis="sprawdzenie: motyle nad regionem 8 (działka przeniesiona razem z regionem)"))
    return S


# ================================================================================================ (4a) narzędzia

def specs_narzedzia(M):
    S = []
    f = "tools/domy/build.py"
    S += [Z(f, '"front": [«6@pt:Homes.js:128», «41»], "door_x": 4', opis="wyjście z Map154 przed drzwi chaty (jak Homes.js)"),
          Z(f, "the door (bottom) -> Map111 («6@pt:Homes.js:128»,«41»)", opis="komentarz")]
    ox, oy = M.old
    S.append(T("tools/powieksz/stan.json", '"111": {\n  "old": [\n   46,\n   56\n  ],', '"111": {\n  "old": [\n   %d,\n   %d\n  ],' % (ox, oy),
               opis="„stara część” mapy 111 jak Okolice_Data OLD[111]"))
    S.append(Z("tools/pomiar_czasu/pomiar2.js", '[111, «44|x@pt:Map008 ev237», «17|y@pt:Map008 ev237», 0, 19, "Podgrodzie: brama -> droga na przystań"]',
               opis="start = lądowanie z bramy miasta (Map008 ev237)"))
    f = "tools/newstart/layout.py"
    S += [Z(f, "(111, cells(«91@ev65», «17», «91@ev66», «18»), 4)", opis="sprawdzenie (brama miasta na brzegu)"),
          Z(f, "((111, cells(«0@ev92», «19», «0@ev92», «19»), 6)", opis="sprawdzenie (ścieżka do Przystani)")]
    return S


# ================================================================================================ (4b) testy

PODGRODZIE_TEST_SHA = "b92043f0715269df468b56e9e9067be92ec93a61c395c0e8ea5de13572df15ac"   # tests/podgrodzie_test.js przed przebudową


def specs_testy(M):
    S = [CALY("tests/podgrodzie_test.js", PODGRODZIE_TEST_SHA, NOWY_TEST_PODGRODZIE,
              opis="nowa wersja: czyta tools/podgrodzie2/budynki.json, wnetrza/meta.json, mapowanie.json (stary czytał nieistniejące "
                   "tools/podgrodzie/staging/*_meta.json); 18 drzwi z wnętrzami, MapInfos, palisada")]
    f = "tests/podgrodzie_life_test.js"
    S += [Z(f, "t.newGame({ map: 111, x: «1@pt:podgrodzie_life_test.js:16», y: «1»", opis="start (dalej skrypt idzie do „Miejsce: kram”)"),
          Z(f, "t.go(111, «1@pt:podgrodzie_life_test.js:16», «1», 2);", opis="powrót na Podgrodzie nocą")]
    S.append(Z("tests/podgrodzie_quests_test.js", "t.newGame({ map: 111, x: «26@pt:podgrodzie_quests_test.js:8», y: «17»", opis="start na placyku"))
    f = "tests/garnizon_test.js"
    S += [Z(f, "t.go(111, «10@pt:garnizon_test.js:220», «12», 8);", opis="przy drwalu"),
          Z(f, "t.go(111, «26@pt:garnizon_test.js:234», «18», 2);", opis="placyk (żołnierze 660-661)")]
    S.append(Z("tests/ludzie_test.js", "t.go(111, «23@pt:ludzie_test.js:117», «28»);", ile=2, opis="K63 u Zbycha"))
    S.append(Z("tests/w6_test.js", "t.go(111, «38@pt:w6_test.js:193», «12», 8);", opis="obóz W6 poza miastem"))
    S.append(Z("tests/przystan_test.js", "t.newGame({ map: 111, x: «2@pt:przystan_test.js:29», y: «19»", opis="ścieżka do Przystani"))
    S.append(Z("tests/wrak_test.js", "t.go(111, «20@pt:wrak_test.js:189», «20», 2);", opis="Józek Łata"))
    f = "tests/zasoby_test.js"
    S += [Z(f, "t.go(111, «56@pt:zasoby_test.js:264», «13», 8);", opis="ogródki"),
          Z(f, "t.go(111, «52@pt:odkrycie wysypisko», «27», 8);",
            opis="dwie kratki pod odkryciem wysypiska (near 2 - test sprawdza odkrycie przy podejściu; punkt mapowania 72,66 jest 4 kratki od niego)"),
          Z(f, "t.go(111, «56@pt:odkrycie glinianka», «39», 8);", opis="kratka pod glinianką (jak dotąd)")]
    f = "tests/field_loss_test.js"
    S += [Z(f, "t.go(111, «6@pt:Homes.js:128», «41», 8)", opis="przed chatą pod lasem"),
          Z(f, "'Chata pod lasem' («6@ev94»,«40») opens now", opis="opis"),
          Z(f, "for (let y = «41|dy@ev94»; y <= «49|dy@ev94» && !hut; y++) for (let x = «15|dx@ev94»; x <= «31|dx@ev94» && !hut; x++)",
            opis="działka (region 8) przeniesiona z chatą"),
          Z(f, "inPlot: Farming.whyNotBuild('chest_s', «20@ev94», «44»), outside: Farming.whyNotBuild('chest_s', «9@ev94», «46»)"),
          Z(f, "in front of the hut («6@pt:Homes.js:128»,«41»)", opis="opis"),
          Z(f, "outHut && P.x === «6@pt:Homes.js:128» && P.y === «41»"),
          Z(f, "Farming.build('chest_s', «20@ev94», «44»)"),
          Z(f, "t.locate(«13@ev94», «42», 6);", opis="zdjęcie chaty"),
          Z(f, "t.go(111, «20@pt:field_loss_test.js:242», «20», 2);", ile=2, opis="Józek i Marta (D21)")]
    return S


# ================================================================================================ (5) stare generatory tools/podgrodzie

OSTRZEZENIE = ("UWAGA (2026-10-22): NIE URUCHAMIAĆ na nowej mapie - Map111 przebudowana (tools/podgrodzie2, "
               "docs/podgrodzie/NOWE_PODGRODZIE.md); to narzędzie zna stary układ Podgrodzia.")


def stare_generatory(K):
    """pliki .py w tools/podgrodzie (bez podfolderów) - stary generator Podgrodzia 46x36 i jego wnętrz"""
    d = os.path.join(K, "tools", "podgrodzie")
    out = []
    if not os.path.isdir(d):
        return out
    for n in sorted(os.listdir(d)):
        p = os.path.join(d, n)
        if os.path.isfile(p) and n.endswith((".py", ".js")):
            out.append("tools/podgrodzie/" + n)
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
        if isinstance(sp, CALY):
            pt.caly(R, sp.sha_stary, sp.tresc, sp.opis)
            continue
        try:
            st, nw, op = sp.teksty(M)
        except BladMapowania as ex:
            R.zmiana(sp.plik, None, getattr(sp, "spec", getattr(sp, "stary", "")), "?", "pominieta", "mapowanie: %s" % ex)
            continue
        pt.podmien(R, st, nw, op, ile=sp.ile, blok=sp.blok)


def krok_mapy(plan, R, M, K):
    """(1) data/Map111.json <- staging (z kontrolą sumy), Map201-212 <- wnetrza, MapInfos.json; sprawdzenie drzwi i wyjść"""
    ok = True
    rel111 = "data/Map%03d.json" % MAPA
    b0 = wczytaj(os.path.join(K, rel111))
    if not os.path.exists(SHA_PLIK):
        R.uwaga("BŁĄD", "brak tools/podgrodzie2/sha_przed.txt (suma data/Map111.json z chwili budowy nowej mapy) - nic nie instaluję")
        return False
    sha0 = open(SHA_PLIK, encoding="utf-8").read().split()[0].strip()
    nowa = M.nowa_bajty
    if b0 == nowa:
        R.zmiana(rel111, None, "sha " + sha(b0)[:12], "staging", "juz", "nowa mapa już zainstalowana")
    elif sha(b0) == sha0:
        if tekst_mapy(json.loads(nowa.decode("utf-8"))) != nowa:
            R.uwaga("BŁĄD", "tools/podgrodzie2/staging/Map111.json nie jest w układzie edytora - nie instaluję")
            return False
        plan.zapis(rel111, b0, nowa)
        R.zmiana(rel111, None, "sha " + sha(b0)[:12] + " (stara mapa)", "sha " + sha(nowa)[:12] + " (staging)", "zmiana",
                 "instalacja nowej mapy Podgrodzia (%dx%d, %d zdarzeń)" % (M.nowa["width"], M.nowa["height"], len([e for e in M.nowa["events"] if e])))
    else:
        R.uwaga("BŁĄD", "data/Map111.json zmieniła się od budowy nowej mapy (sha %s, oczekiwano %s z sha_przed.txt) - ktoś edytował "
                        "mapę w edytorze? Przebuduj staging (tools/podgrodzie2/build.py) i zapisz sumę od nowa. Nic nie instaluję."
                % (sha(b0)[:12], sha0[:12]))
        return False
    # ---- drzwi na mapie 111 -> wejście wnętrza (sprawdzenie staging): nowe wnętrza (meta.json) i stare (budynki.json)
    ev = {e["id"]: e for e in M.nowa["events"] if e}
    for mid, mm in sorted(M.meta.items(), key=lambda kv: int(kv[0])):
        d = mm.get("drzwi_na_mapie_111") or {}
        e = ev.get(d.get("id"))
        we = mm.get("wejscie") or {}
        tr = przeniesienia(e)
        if not e or (e["x"], e["y"]) != (d.get("x"), d.get("y")):
            R.uwaga("BŁĄD", "Map%s %s: drzwi %s nie stoją na (%s,%s) nowej mapy" % (mid, mm["nazwa"], d.get("id"), d.get("x"), d.get("y")))
            ok = False
        elif not tr or any(t[0] != 0 or t[1] != int(mid) or (t[2], t[3]) != (we.get("x"), we.get("y")) for t in tr):
            R.uwaga("BŁĄD", "Map%s %s: drzwi %d przenoszą na %s zamiast (%s, %s, %s)" % (
                mid, mm["nazwa"], e["id"], [t[1:4] for t in tr], mid, we.get("x"), we.get("y")))
            ok = False
    for b in M.bud:
        e = ev.get(b["drzwi_id"])
        tr = przeniesienia(e)
        if b["klucz"] == HOMES_KLUCZ:
            if tr:
                R.uwaga("SPRAWDZENIE", "drzwi %d „%s” mają przeniesienie %s (Homes.js prowadzi do środka sam)" % (b["drzwi_id"], b["nazwa"], [t[1:4] for t in tr]))
            continue
        if not e or not tr or any(t[0] != 0 or t[1] != b["wnetrze"] or [t[2], t[3]] != list(b["wnetrze_xy"]) for t in tr):
            R.uwaga("BŁĄD", "drzwi %s „%s”: przeniesienia %s, a budynki.json mówi Map%s %s" % (
                b["drzwi_id"], b["nazwa"], [t[1:4] for t in tr], b["wnetrze"], b["wnetrze_xy"]))
            ok = False
        mm = M.meta.get(str(b["wnetrze"]))
        if mm and [mm["wejscie"]["x"], mm["wejscie"]["y"]] != list(b["wnetrze_xy"]):
            R.uwaga("BŁĄD", "„%s”: budynki.json wnetrze_xy %s, meta.json wejście %s" % (b["nazwa"], b["wnetrze_xy"], mm["wejscie"]))
            ok = False
    # ---- wnętrza 201-212
    for mid, mm in sorted(M.meta.items(), key=lambda kv: int(kv[0])):
        src = os.path.join(HERE, "wnetrza", mm["plik"])
        rel = "data/Map%03d.json" % int(mid)
        dst = os.path.join(K, rel)
        b = wczytaj(src)
        raw = json.loads(b.decode("utf-8"))
        cele = {tuple(x["przed_drzwiami"]) for x in M.bud if x.get("wnetrze") == int(mid)}
        zle, wyjsc = [], 0
        for e in raw["events"]:
            if not e:
                continue
            for t in przeniesienia(e):
                if t[0] == 0 and t[1] == MAPA:
                    wyjsc += 1
                    if (t[2], t[3]) not in cele:
                        zle.append((e["id"], t[2:4]))
        if zle or not wyjsc:
            R.uwaga("BŁĄD", "%s: wyjścia %s nie prowadzą przed drzwi z budynki.json %s - nie instaluję tej mapy" % (rel, zle or "(brak)", sorted(cele)))
            ok = False
            continue
        if tekst_mapy(raw) != b:
            R.uwaga("UWAGA", "%s: plik wnętrza nie jest w układzie edytora (kopiuję bez zmian)" % mm["plik"])
        if os.path.exists(dst):
            if wczytaj(dst) == b:
                R.zmiana(rel, None, "", mm["plik"], "juz", "wnętrze już zainstalowane")
            else:
                R.uwaga("BŁĄD", "%s już istnieje i różni się od tools/podgrodzie2/wnetrza/%s - nie nadpisuję" % (rel, mm["plik"]))
                ok = False
            continue
        plan.zapis(rel, None, b)
        R.zmiana(rel, None, "(brak)", "tools/podgrodzie2/wnetrza/" + mm["plik"], "zmiana", "nowe wnętrze „%s”" % mm["nazwa"])
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
    """nowa kratka przeniesienia z mapy mid na mapę 111 ze starej (x, y)"""
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
    raise BladMapowania("przeniesienie na (%d,%d): brak reguły (ani drzwi z budynki.json, ani punktu „Map%03d ...” w mapowaniu) - nie zgaduję" % (x, y, mid))


def krok_przeniesienia(plan, R, M, K):
    """(2) kod 201 na mapę 111 w innych mapach data/ (bez 111 i nowych wnętrz)"""
    nowe = {int(k) for k in M.meta}
    for n in sorted(os.listdir(os.path.join(K, "data"))):
        m = re.fullmatch(r"Map(\d{3})\.json", n)
        if not m or int(m.group(1)) in nowe or int(m.group(1)) == MAPA:
            continue
        mid, rel = int(m.group(1)), "data/" + n
        b = wczytaj(os.path.join(K, rel))
        if b'[0,111,' not in b and b'[0, 111,' not in b:
            continue
        raw = json.loads(b.decode("utf-8-sig"))
        edytor = tekst_mapy(raw) == b
        tekst = b.decode("utf-8-sig")
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
                        R.zmiana(rel, None, "", "[0,111,%d,%d]" % (ox, oy), "juz", "ev%d „%s”: już przepięte" % (e["id"], e["name"]))
                        continue
                    nx, ny = cel
                    opis = "ev%d „%s” s.%d: %s%s" % (e["id"], e["name"], pi + 1, zr, "" if M.stoi(nx, ny) else " (nowa kratka nieprzechodnia!)")
                    if (nx, ny) == (ox, oy):
                        R.zmiana(rel, None, "[0,111,%d,%d]" % (ox, oy), "[0,111,%d,%d]" % (nx, ny), "bez zmian", opis)
                        continue
                    if not edytor:
                        # plik nie w układzie edytora: tylko liczby tego przeniesienia, w miejscu (w linii zdarzenia)
                        stare_p = '"parameters":[0,111,%d,%d,%d,' % (ox, oy, c["parameters"][4])
                        nowe_p = '"parameters":[0,111,%d,%d,%d,' % (nx, ny, c["parameters"][4])
                        i0 = tekst.find('"id":%d,' % e["id"])
                        i1 = tekst.find(stare_p, i0) if i0 >= 0 else -1
                        if i1 < 0:
                            R.zmiana(rel, None, stare_p, nowe_p, "pominieta", opis + "; nie znalazłem parametrów w tekście pliku")
                            continue
                        tekst = tekst[:i1] + nowe_p + tekst[i1 + len(stare_p):]
                    c["parameters"][2], c["parameters"][3] = nx, ny
                    zm += 1
                    R.zmiana(rel, None, "[0,111,%d,%d]" % (ox, oy), "[0,111,%d,%d]" % (nx, ny), "zmiana", opis)
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
    miejsca = collections.defaultdict(list)
    for e in ev.values():
        m = re.match(r"Miejsce:\s*(\S+)", e["name"] or "")
        if m:
            miejsca[m.group(1)].append((e["x"], e["y"]))
    for k, v in list(M.spots.items()) + list(M.nowe_miejsca.items()):
        if k not in miejsca:
            R.uwaga("SPRAWDZENIE", "„Miejsce: %s” z mapowania nie stoi na nowej mapie" % k)
        elif miejsca[k] != [tuple(v["nowe"][:2])]:
            R.uwaga("SPRAWDZENIE", "„Miejsce: %s”: mapowanie %s, na mapie %s" % (k, v["nowe"][:2], miejsca[k]))
        elif not M.stoi(*v["nowe"][:2]):
            R.uwaga("SPRAWDZENIE", "„Miejsce: %s” %s - kratka nieprzechodnia" % (k, v["nowe"][:2]))
    for b in M.bud:
        e = ev.get(b["drzwi_id"])
        if not e or (e["x"], e["y"]) != tuple(b["drzwi"]):
            R.uwaga("SPRAWDZENIE", "drzwi %s „%s”: budynki.json %s, nowa mapa %s" % (b["drzwi_id"], b["nazwa"], b["drzwi"], e and (e["x"], e["y"])))
        if not M.stoi(*b["przed_drzwiami"]):
            R.uwaga("SPRAWDZENIE", "przed drzwiami „%s” %s - kratka nieprzechodnia" % (b["nazwa"], b["przed_drzwiami"]))
    for p in M.punkty:
        if p.get("stare_przechodnie") and not M.stoi(*p["nowe"]):
            R.uwaga("SPRAWDZENIE", "punkt „%s” %s: kratka nieprzechodnia na nowej mapie" % (p["co"], p["nowe"]))
    # region 8 = działka chaty pod lasem (Homes BUILD_REGION, Motyle)
    W, H, d = M.nowa["width"], M.nowa["height"], M.nowa["data"]
    r8 = [(x, y) for y in range(H) for x in range(W) if d[(5 * H + y) * W + x] == 8]
    want = M.strefy.get("dzialka_chaty_pod_lasem", {}).get("region8")
    got = [min(c[0] for c in r8), min(c[1] for c in r8), max(c[0] for c in r8), max(c[1] for c in r8)] if r8 else None
    if got != want or len(r8) != 240:
        R.uwaga("SPRAWDZENIE", "region 8: %d kratek w %s, mapowanie mówi %s (dotąd 240 kratek)" % (len(r8), got, want))
    else:
        R.uwaga("INFO", "region 8 (działka chaty pod lasem): 240 kratek x %d-%d, y %d-%d - jak w mapowaniu" % (got[0], got[2], got[1], got[3]))
    if M.old[0] != W:
        R.uwaga("SPRAWDZENIE", "OLD[111] = %s, a szerokość mapy %d" % (list(M.old), W))
    if "<BuildRegion:8>" not in (M.nowa.get("note") or ""):
        R.uwaga("SPRAWDZENIE", "notatka nowej mapy bez <BuildRegion:8>")


UWAGI_STALE = [
    "**Zapisy graczy**: pozycje zapisane na mapie 111 (bohater, a zwłaszcza to, co gracz postawił/zasiał na działce chaty pod lasem - "
    "Farming.farm().buildings[111], uprawy, kamienie, posadzone sosny Forestry) NIE są przepinane. Działka przesunęła się o (dx, dy) "
    "z mapowanie.json d_strefy.dzialka_chaty_pod_lasem.przesuniecie - stary zapis z budynkami na działce trzeba by przesunąć tak samo "
    "(do decyzji koordynatora; świeża gra nie ma problemu).",
    "**F9 „Wysypisko”** (Zasoby.js) wg punktu mapowania stoi 4 kratki nad główną stertą (odkrycie ma near 2, bohater patrzy w górę, "
    "od wysypiska) - zostawione jak w mapowaniu; tests/zasoby_test.js idzie dwie kratki pod odkrycie (jak dawniej), bo sprawdza odkrycie "
    "przy podejściu. Do decyzji budowniczego: punkt „Zasoby.js:1418 F9 Wysypisko” np. na kratkę pod stertą.",
    "**Underground_Data epilog „oboz”**: kamera i Marek wypadają na nieprzechodnich kratkach (jak na starej mapie - aktorzy sceny "
    "stoją, nie chodzą).",
    "**TownLife_Data SPOTS_BY_MAP[111] = {}** - bez kratek (miejsca z „Miejsce:” mapy); bloki NOWE PODGRODZIE i THE NEW TOWN nie "
    "ruszane. Nowi mieszkańcy (2950-2953) pojawią się sami, gdy mapa ma „Miejsce: <dom>_drzwi”.",
    "**Kantor_Data w5_lada**: nowa mapa ma też „Miejsce: w5_lada” (gra bierze miejsce z mapy); dane przepięte na tę samą kratkę.",
    "**Motyle_Data** (region 8), **Wrak.js RAID_MAPS** (losowe wolne kratki), **TownQuests.js** wilki przy obozie (TownLife.spot('namioty')), "
    "**Krawedzie.js** (przejścia na brzegu) - bez kratek, nic do przepięcia.",
    "**Okolice_Data OLD[111]** = [szerokość, pierwszy wiersz za osadą] z mapowanie.json (osada w palisadzie, pas lasu i mur = „stara "
    "część”; ogródki 1-3 dostały allowOld, wysypisko i glinianka są w nowej części). tools/powieksz/stan.json uzgodniony tak samo.",
    "**tests/podgrodzie_mieszkancy_test.js** (agent mieszkańców, pisany pod nowe Podgrodzie) - nie ruszany; start 20,18 leży na drodze "
    "nowej mapy.",
    "**Teksty Zasoby_Data** „wysypisko za chatami” (odkrycie, D31) zostawione - wysypisko jest teraz za palisadą, na południowym wschodzie.",
    "**tools/powieksz/miejsca_okolic.json** to zrzut z działającej gry - po instalacji odtworzyć (`CDP_PORT=9565 node tools/powieksz/miejsca_okolic.js`), "
    "tylko gdyby ktoś znów uruchamiał przerzedz.py na mapie 111. **tools/pomiar_czasu/graf_przejsc.json** - wygenerować od nowa "
    "(`node tools/pomiar_czasu/graf_przejsc.js`), jeśli potrzebny.",
    "**Dokumenty** docs/podgrodzie/POWIAZANIA_MAP111.md i MIEJSCA.md opisują stan sprzed przebudowy - nie zmieniane.",
    "**Jednorazowe skrypty** (znają stary układ, nie uruchamiać po przebudowie): tools/podgrodzie/* (dostają ostrzeżenie przy --wykonaj), "
    "tools/domy/podgrodzie_zagroda.py + tools/domy/install.py (instalują tylko na mapie 46x36 - odmówią), tools/przystan/install.py "
    "(dopisuje przejście na starą Map111).",
]


def raport_md(R, K, wykonaj, gen, czas, archiwum):
    poz = collections.OrderedDict()
    for plik, linia, st, nw, status, opis in R.wpisy:
        poz.setdefault(plik, collections.Counter())[status] += 1
    o = ["# Przepięcie na nowe Podgrodzie (Map111) - raport tools/podgrodzie2/przepnij.py", "",
         "%s, tryb: **%s**, katalog: `%s`." % (czas, "WYKONANIE (zapis)" if wykonaj else "próba (nic nie zapisano)", K)]
    if wykonaj and archiwum:
        o.append("Kopie zapasowe zmienionych plików: `%s`." % archiwum)
    o += ["", "Instalacja (edytor RPG Maker MZ zamknięty, w katalogu projektu): `python tools/podgrodzie2/przepnij.py --wykonaj`", ""]
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
    o += ["", "## Stare narzędzia tools/podgrodzie/* - NIE uruchamiać na nowej mapie", "",
          "Znają stary układ Map111 (46x36, chaty i wnętrza 112-117 ze starymi wyjściami); uruchomione nadpisałyby albo popsuły nowe "
          "Podgrodzie. Przy `--wykonaj` dostają na górze komentarz-ostrzeżenie.", ""]
    for g in gen:
        o.append("- `%s`" % g)
    o += ["", "## Wszystkie wpisy", "", "| status | plik:linia | stare | nowe | opis |", "|---|---|---|---|---|"]
    esc = lambda s: skroc(s, 160).replace("|", "\\|")
    for plik, linia, st, nw, status, opis in R.wpisy:
        o.append("| %s | `%s:%s` | `%s` | `%s` | %s |" % (status, plik, linia or "-", esc(st), esc(nw), esc(opis)))
    o.append("")
    return "\n".join(o)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Przepięcie wszystkiego na nowe Podgrodzie (Map111)")
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
    rap = os.path.join(HERE, "przepnij_raport.md") if wlasny else os.path.join(K, "tools", "podgrodzie2", "przepnij_raport.md")
    print("== przepięcie na nowe Podgrodzie: %s (%s)" % (K, "WYKONANIE" if a.wykonaj else "próba"))
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
    print("-- (2) przeniesienia na mapę 111")
    krok_przeniesienia(plan, R, M, K)
    print("-- (3) wtyczki")
    try:
        zastosuj_specs(plan, R, M, specs_wtyczki(M))
    except BladMapowania as ex:
        R.uwaga("BŁĄD", "wtyczki: %s - przerywam, nic nie zapisano" % ex)
        return 1
    if not a.bez_testow:
        print("-- (4) narzędzia i testy")
        zastosuj_specs(plan, R, M, specs_narzedzia(M))
        zastosuj_specs(plan, R, M, specs_testy(M))
    gen = stare_generatory(K)
    if a.wykonaj:
        print("-- (5) ostrzeżenia w starych narzędziach tools/podgrodzie")
        for g in gen:
            plan.plik(g).dopisz_na_gorze(R, ("// " if g.endswith(".js") else "# ") + OSTRZEZENIE, "NIE URUCHAMIAĆ na nowej mapie")
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


# ================================================================================================ nowa wersja tests/podgrodzie_test.js

NOWY_TEST_PODGRODZIE = r'''// Podgrodzie (Map111) - the poor suburb between the town's west wall and the forest, rebuilt 2026-10-22 (docs/podgrodzie/NOWE_PODGRODZIE.md,
// tools/podgrodzie2): a settlement in a palisade with a little square, the old cabins moved in, new houses with interiors (Map201-212),
// the Chata pod lasem behind the palisade. The cells come from tools/podgrodzie2/budynki.json, wnetrza/meta.json and mapowanie.json
// (read when the test starts). CDP_PORT=9461 node tests/podgrodzie_test.js
//   - the west gate on Map008 (x 0-1, rows 50-51): its four cells free, the towers beside it closed, two exits; walking left through
//     it -> Map111 in the town wall's gate (mapowanie: the landing of Map008 ev237) facing left; walking right off Map111's east
//     edge -> back in the town's gate (1,51)
//   - on Map111, by the game's own walking rules ($gameMap.isPassable both ways, RegionLayers, events and <Occupy>; TownLife's
//     residents left out - they walk about): every door front of budynki.json, every "Miejsce: <key>" of mapowanie.json (once,
//     below the characters, walk-through) and every exit reached from the gate
//   - no water of its own: no water tile on the map (Farming.isWaterTile, the game's own test) - its well is dry, water is
//     carried from the town (the user 2026-10-05: water is in the town and the tavern)
//   - RegionLayers: the town wall and the palisade level with the hero, their gates free, the roofs closed, the washing lines over him
//   - MapInfos: the new interiors (wnetrza/meta.json) under Podgrodzie with their names
//   - every door with an interior (the old cabins Map112-117 and the new houses Map201-212): by day in (the interior's landing,
//     facing up; its residents' spots there) and out again (in front of the door, facing down); at 23:00 "Zamknięte." and no
//     way in - except the houses open at any hour (budynki.json: zawsze_otwarte - the refugees' house, the almshouse)
//   (the Chata pod lasem is Homes.js's house - closed till bought: tests/field_loss_test.js)
// Shots: docs/podgrodzie/gra_*.png
const path = require("path");
const fs = require("fs");
const kit = require("./lib/kit.js");
const P2 = path.join(__dirname, "..", "tools", "podgrodzie2");
const SHOTS = path.join(__dirname, "..", "docs", "podgrodzie");
const readJson = p => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));

const BUD = readJson(path.join(P2, "budynki.json")).budynki;
const META = readJson(path.join(P2, "wnetrza", "meta.json")).mapy;
const MAPOWANIE = readJson(path.join(P2, "mapowanie.json"));
const point = what => {
    const p = MAPOWANIE.c_miejsca.punkty_wtyczek.find(q => q.co.indexOf(what) >= 0);
    if (!p) throw new Error("tools/podgrodzie2/mapowanie.json: brak punktu " + what);
    return p.nowe;
};
const IN_GATE = point("Map008 ev237"), IN_GATE2 = point("Map008 ev238");
const WALL = MAPOWANIE.d_strefy.mur_miasta, PAL = MAPOWANIE.d_strefy.palisada;
const SPOT_KEYS = Object.keys(MAPOWANIE.c_miejsca.stare_miejsca).concat(Object.keys(MAPOWANIE.c_miejsca.nowe_miejsca));
// the old cabins' residents: their "Miejsce: <key>_wnetrze" inside (data/Map112-117)
const OLD_RESIDENTS = { 112: ["praczka", "franek"], 113: ["drwal"], 114: ["klusownik"], 115: ["znachorka"], 116: ["szmaciarz"], 117: ["uchodzca"] };
const doors = BUD.filter(b => b.wnetrze && b.klucz !== "chata_pod_lasem").map(b => {
    const m = META[String(b.wnetrze)];
    const residents = m ? Object.entries(m.miejsca || {}).map(([k, v]) => ({ n: "Miejsce: " + k, x: v.x, y: v.y }))
        : (OLD_RESIDENTS[b.wnetrze] || []).map(k => ({ n: "Miejsce: " + k + "_wnetrze" }));
    return { map: b.wnetrze, name: b.nazwa, door: b.drzwi_id, at: b.drzwi, town: b.przed_drzwiami, landing: b.wnetrze_xy,
        always: !!b.zawsze_otwarte || !b.godziny, residents };
});

// TownLife's residents walk about: out of the way for the checks (erased on this map until it loads again)
const RESIDENTS_OFF = "(function(){ const TL = window.TownLife; if (TL && TL.residents) for (const e of TL.residents()) e.erase(); return 0; })()";

async function knock(t, d) {
    await t.locate(d.town[0], d.town[1], 8);
    await t.until("!SceneManager._scene.isFading() && !$gameMap.isEventRunning() && !$gameMessage.isBusy()", 10, 100);
    for (let i = 0; i < 3; i++) {
        await t.locate(d.town[0], d.town[1], 8);
        await t.frames(3);
        await t.eval("window.__doorRan = false; 0");
        await t.hold("up", 20);
        if (await t.until(`window.__doorRan || $gameMap.isEventRunning() || $gamePlayer.isTransferring() || !${t.onMap(111)}`, 2, 50)) return true;
    }
    return false;
}

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const walkOut = async (key, map) => {
        await t.eval(`(function(){ Input.clear(); Input._currentState["${key}"] = true; return 0; })()`);
        await t.until("$gamePlayer.isTransferring() || $gameMap.mapId() !== " + map, 10, 30);
        await t.eval(`(function(){ Input._currentState["${key}"] = false; return 0; })()`);
    };
    const toPod = async (x, y, d) => { const ok = await t.go(111, x, y, d); await t.eval(RESIDENTS_OFF); return ok; };
    const atSpot = async (key, d) => { const s = await t.json(`TownLife.spot(${JSON.stringify(key)})`); if (s) await t.locate(s[0], s[1], d); return !!s; };
    fs.mkdirSync(SHOTS, { recursive: true });
    t.check(`tools/podgrodzie2: ${doors.length} doors with interiors (budynki.json), ${SPOT_KEYS.length} spots (mapowanie.json)`, doors.length >= 18 && SPOT_KEYS.length > 19,
        doors.map(d => d.map));
    await t.newGame({ map: 8, x: 5, y: 50, dir: 4, hour: 12, quiet: true, minimap: false });
    await t.eval(`(function(){ const _s = Game_Event.prototype.start; Game_Event.prototype.start = function() { if (/^Drzwi/.test(this.event().name)) window.__doorRan = true; return _s.apply(this, arguments); }; return 0; })()`);

    // ---- the west gate on the town map
    const gate = await t.json(`(function(){ const p = (x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d));
        return { gate: [p(0, 50), p(1, 50), p(0, 51), p(1, 51), p(2, 50), p(2, 51)], towers: [p(0, 49), p(1, 49), p(0, 52), p(1, 52)],
                 exits: $gameMap.events().filter(e => /Podgrodzie/.test(e.event().name)).map(e => [e.x, e.y]),
                 sign: $gameMap.events().filter(e => /Drogowskaz \\(brama zachodnia\\)/.test(e.event().name)).length }; })()`);
    t.check("Map008's west gate: its cells and the street before it free, the towers beside it closed", gate.gate.every(Boolean) && !gate.towers.some(Boolean), gate);
    t.check("two exits at the town's west edge (0,50..51) and the signpost", JSON.stringify(gate.exits) === "[[0,50],[0,51]]" && gate.sign === 1, gate);
    await t.locate(4, 51, 4);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_brama_od_miasta.png"));

    // ---- out through the gate on foot
    await t.locate(2, 50, 4);
    await walkOut("left", 8);
    const out = await t.until(t.onMap(111), 10);
    const at111 = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check(`walking left through the gate leads to Podgrodzie (Map111 ${IN_GATE}, the town wall's gate, facing left)`,
        out && at111.x === IN_GATE[0] && at111.y === IN_GATE[1] && at111.d === 4, at111);
    await t.eval(RESIDENTS_OFF);
    await atSpot("brama_zach", 4);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_brama_od_podgrodzia.png"));

    // ---- the whole suburb, by the game's own rules (residents left out)
    const R = await t.json(`(function(){ const w = $gameMap.width(), h = $gameMap.height(), key = (x, y) => x + "," + y;
        const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && e.eventId() < 900);
        const step = (x, y, d) => { const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d);
            if (!$gameMap.isValid(nx, ny) || !$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) return null; return [nx, ny]; };
        const start = ${JSON.stringify(IN_GATE)}, seen = new Set([key(start[0], start[1])]), todo = [start.slice(0, 2)];
        while (todo.length) { const [x, y] = todo.pop(); for (const d of [2, 4, 6, 8]) { const n = step(x, y, d); if (n && !seen.has(key(...n))) { seen.add(key(...n)); todo.push(n); } } }
        const spots = {}; for (const e of $gameMap.events()) { const m = /^Miejsce: (\\S+)$/.exec(e.event().name); if (m) spots[m[1]] = { x: e.x, y: e.y, prio: e.event().pages[0].priorityType, through: e.event().pages[0].through, n: (spots[m[1]] ? spots[m[1]].n : 0) + 1 }; }
        const doors = ${JSON.stringify(BUD.map(b => ({ n: b.nazwa, id: b.drzwi_id, at: b.drzwi, front: b.przed_drzwiami })))}.map(b => {
            const e = $gameMap.event(b.id);
            return { n: b.n, id: b.id, ok: !!e && e.x === b.at[0] && e.y === b.at[1] && /^Drzwi/.test(e.event().name), front: seen.has(key(b.front[0], b.front[1])) }; });
        const exits = $gameMap.events().filter(e => /^Przejście/.test(e.event().name)).map(e => ({ n: e.event().name, x: e.x, y: e.y, reached: seen.has(key(e.x, e.y)) }));
        let water = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Farming.isWaterTile && Farming.isWaterTile(x, y)) water++;
        const RL = window.RegionLayers, WALL = ${JSON.stringify(WALL)}, PAL = ${JSON.stringify(PAL)}, drwal = ${JSON.stringify((BUD.find(b => b.klucz === "drwal") || BUD[0]).drzwi)};
        let lines = 0, linesAbove = 0;
        if (RL) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ($gameMap.regionId(x, y) === 3) { lines++; if (RL.kindAt(x, y) === "above") linesAbove++; }
        return { reached: seen.size, spots, doors, exits, water,
                 spotReached: Object.fromEntries(Object.entries(spots).map(([k, s]) => [k, seen.has(key(s.x, s.y))])),
                 regions: RL ? { wall: RL.kindAt(WALL.x[0], 5), gate: RL.kindAt(WALL.brama[0][0], WALL.brama[0][1]), palisade: RL.kindAt(PAL.pierscien[0], 10),
                                 palGate: RL.kindAt(PAL.bramy.zach[1][0], PAL.bramy.zach[1][1]), roof: RL.kindAt(drwal[0], drwal[1] - 2), lines, linesAbove } : null }; })()`);
    t.check(`Podgrodzie has no water tile of its own (Farming.isWaterTile) - ${R.reached} cells walkable from the gate`, R.water === 0, R.water);
    t.check("every exit (to the town, to the harbour) reached from the gate", R.exits.length >= 3 && R.exits.every(e => e.reached), R.exits);
    const missingSpots = SPOT_KEYS.filter(k => !R.spots[k] || R.spots[k].n !== 1 || R.spots[k].prio !== 0 || !R.spots[k].through);
    t.check(`all ${SPOT_KEYS.length} TownLife spots are there once, below the characters and walk-through`, missingSpots.length === 0, missingSpots);
    const farSpots = SPOT_KEYS.filter(k => R.spots[k] && !R.spotReached[k]);
    t.check("every spot can be walked to from the gate", farSpots.length === 0, farSpots);
    const badDoors = R.doors.filter(d => !d.ok || !d.front);
    t.check(`the ${R.doors.length} doors of budynki.json stand where it says and their fronts are reached`, badDoors.length === 0, badDoors);
    t.check("RegionLayers: the town wall and the palisade level with the hero, their gates free, the roofs closed, the washing lines over him",
        R.regions && R.regions.wall === "level" && R.regions.gate === null && R.regions.palisade === "level" && R.regions.palGate === null &&
        R.regions.roof === "level" && R.regions.lines > 0 && R.regions.linesAbove === R.regions.lines, R.regions);

    // ---- the new interiors in MapInfos
    const infos = await t.json(`(function(){ const o = {}; for (const id of ${JSON.stringify(Object.keys(META).map(Number))}) { const m = $dataMapInfos[id]; o[id] = m ? [m.name, m.parentId] : null; } return o; })()`);
    const badInfos = Object.keys(META).filter(id => !infos[id] || infos[id][0] !== META[id].nazwa || infos[id][1] !== 111);
    t.check(`MapInfos: the ${Object.keys(META).length} new interiors under Podgrodzie (111) with the names of wnetrza/meta.json`, badInfos.length === 0, { badInfos, infos });

    // ---- back into the town over the east edge
    await t.locate(IN_GATE2[0], IN_GATE2[1], 6);
    await walkOut("right", 111);
    const back = await t.until(t.onMap(8), 10);
    const at8 = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check("walking right off Podgrodzie's east edge lands in the town's west gate (Map008 1,51, facing right)", back && at8.x === 1 && at8.y === 51 && at8.d === 6, at8);

    // ---- the doors by day: in and out
    const shot = {};
    for (const d of doors) {
        if (!(await t.eval(t.onMap(111)))) await toPod(d.town[0], d.town[1], 8);
        await t.eval(RESIDENTS_OFF);
        await t.setHour(13);
        const knocked = await knock(t, d);
        const inOk = await t.until(t.onMap(d.map), 20);
        await t.frames(10);
        const at = await t.json("[$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), $gameMap.mapId()]");
        t.check(`${d.name}: its door by day -> Map${d.map} on the landing ${d.landing.slice(0, 2)} facing up`,
            inOk && at[0] === d.landing[0] && at[1] === d.landing[1] && at[2] === 8, { at, want: d.landing, knocked });
        if (!inOk) continue;
        if (!shot[d.map]) {
            shot[d.map] = true;
            if (d.residents.length) {
                const spots = await t.json(`$gameMap.events().filter(e => /^Miejsce: /.test(e.event().name)).map(e => ({ n: e.event().name, x: e.x, y: e.y, prio: e.event().pages[0].priorityType, through: e.event().pages[0].through }))`);
                t.check(`${d.name}: the residents' spots ${d.residents.map(w => w.n.slice(9)).join(", ")}`,
                    d.residents.every(w => spots.some(s => s.n === w.n && (w.x === undefined || (s.x === w.x && s.y === w.y)) && s.prio === 0 && s.through)), { want: d.residents, spots });
            }
            await t.frames(20);
            await t.shot(path.join(SHOTS, "gra_" + d.map + ".png"));
        }
        await t.locate(d.landing[0], d.landing[1], 2);
        await t.frames(2);
        await t.hold("down", 40);
        const outOk = await t.until(t.onMap(111), 20);
        await t.frames(10);
        const b = await t.json("[$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()]");
        t.check(`${d.name}: out through the doorway -> in front of its door ${d.town} facing down`, outOk && b[0] === d.town[0] && b[1] === d.town[1] && b[2] === 2, { b, want: d.town });
    }

    // ---- shots of the square, the woodcutter's yard and the laundry by day
    if (!(await t.eval(t.onMap(111)))) await toPod(IN_GATE[0], IN_GATE[1], 4);
    await t.eval(RESIDENTS_OFF);
    await atSpot("plac", 4); await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_plac.png"));
    await atSpot("drewutnia", 2); await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_drwal.png"));
    await atSpot("pranie", 8); await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_pranie.png"));

    // ---- at night (23:00): closed, the houses open at any hour open
    await t.setHour(23);
    await t.frames(20);
    await t.dismiss();
    await atSpot("namioty", 8); await t.frames(30);
    await t.shot(path.join(SHOTS, "gra_noc_obozowisko.png"));
    for (const d of doors) {
        if (!(await t.eval(t.onMap(111)))) await toPod(d.town[0], d.town[1], 2);
        await t.eval(RESIDENTS_OFF);
        await t.popups({ clear: true });
        await knock(t, d);
        if (d.always) {
            const ok = await t.until(t.onMap(d.map), 20);
            t.check(`${d.name} is open at night too`, ok);
            await toPod(d.town[0], d.town[1], 2);
        } else {
            await t.frames(40);
            const pops = await t.popups();
            const still = await t.json("[$gameMap.mapId(), $gamePlayer.isTransferring()]");
            t.check(`${d.name} at 23:00: "Zamknięte." and no way in`, still[0] === 111 && !still[1] && pops.some(p => /Zamknięte/.test(p)), { still, pops });
        }
    }
});
'''


if __name__ == "__main__":
    sys.exit(main())
