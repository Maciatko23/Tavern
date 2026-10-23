# -*- coding: utf-8 -*-
"""Lista wtyczek gry (js/tawerna_wtyczki.js) i część edytora (js/plugins.js) - od 2026-10-23, docs/ARCHITEKTURA.md, sekcja 2.

Gra wczytuje wtyczki z LISTY GRY (js/plugins/TawernaLoader.js, z index.html, zanim gra wystartuje: w kolejności listy, z jej
parametrami). js/plugins.js pisze edytor RPG Maker MZ; zostają w nim tylko TawernaLoader i wtyczki, których parametry ustawia się
w Menedżerze wtyczek (EDYTOR niżej) - ich włączenie i parametry z edytora mają pierwszeństwo. Nowa wtyczka = wiersz na liście gry,
edytor może być przy tym otwarty.

  python tools/wtyczki.py                          lista gry z numerami (E = stoi też w js/plugins.js)
  python tools/wtyczki.py --sprawdz                kontrola: pliki wtyczek, podwójne wpisy, index.html, js/plugins.js
  python tools/wtyczki.py --dodaj Nazwa --po X     nowy wpis zaraz pod X (albo --przed X; bez: na końcu); opis i parametry
                                                   (@plugindesc, @default) z nagłówka js/plugins/Nazwa.js; zapis z --wykonaj
  python tools/wtyczki.py --opis Nazwa [Nazwa...]  opisy wpisów na nowo z @plugindesc (zapis z --wykonaj)
  python tools/wtyczki.py --przenies               wpisy js/plugins.js, których lista nie ma, na listę - tam, gdzie gra je
                                                   i tak wczytuje (gdy listy jeszcze nie ma: cała js/plugins.js); zapis z --wykonaj
  python tools/wtyczki.py --plugins-js             js/plugins.js na nowo: TawernaLoader + EDYTOR (+ wtyczki tylko z edytora);
                                                   zapis z --wykonaj TYLKO przy zamkniętym edytorze (tasklist), kopia do archiwum

Bez --wykonaj nic się nie zapisuje (podgląd). Jako moduł (instalatory w tools/*):
    sys.path.insert(0, <ścieżka do tools>); import wtyczki
    lista = wtyczki.czytaj_liste(); wtyczki.dodaj(lista, wtyczki.wpis_z_pliku("Nowa"), po="Stara"); lista.zapisz()
Zapis binarnie, końce linii jak w pliku, jeden wpis w wierszu (tak jak edytor pisze js/plugins.js).
"""
import datetime, json, os, re, shutil, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
LISTA = os.path.join(ROOT, "js", "tawerna_wtyczki.js")
PLUGINS_JS = os.path.join(ROOT, "js", "plugins.js")
INDEX = os.path.join(ROOT, "index.html")
ZNACZNIK_LISTY = "var $tawernaWtyczki =\n[\n"
ZNACZNIK_EDYTORA = "var $plugins =\n[\n"
LADOWACZ = "TawernaLoader"
# obce wtyczki z parametrami, które gracz ustawia w Menedżerze wtyczek (OptionEx: domyślna głośność i nazwy; ActorPictures:
# obrazki aktorów; HDLayout: układ okien) - stoją i na liście gry (kolejność), i w js/plugins.js (parametry z edytora)
EDYTOR = ["ActorPictures", "OptionEx", "HDLayout"]
ARCHIWUM = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-10-18", "dane_przed_ladowaczem")

GLOWA_LISTY = (
    "// Lista wtyczek gry „Tawerna” - wczytuje ją js/plugins/TawernaLoader.js (z index.html), zanim gra wystartuje: w tej kolejności,\n"
    "// z tymi parametrami (docs/ARCHITEKTURA.md, sekcja 2). Edytor RPG Maker MZ tego pliku nie zna i go nie zapisuje.\n"
    "// Nowa wtyczka = nowy wiersz na swoim miejscu: python tools/wtyczki.py --dodaj Nazwa --po Poprzednia --wykonaj\n"
    "// Jeden wpis w wierszu, jak w js/plugins.js. Wtyczka, która stoi też w js/plugins.js (Menedżer wtyczek edytora), bierze\n"
    "// stamtąd włączenie i parametry (parametr po parametrze). W tych komentarzach bez nawiasów kwadratowych (czytniki szukają\n"
    "// pierwszego z nich).\n"
)


def dump(e):
    return json.dumps(e, ensure_ascii=False, separators=(",", ":"))


def rel(p):
    return os.path.relpath(p, ROOT).replace("\\", "/")


class Plik:
    """js/tawerna_wtyczki.js albo js/plugins.js: głowa, wpisy (słowniki), ogon; tekst() składa go z powrotem bajt w bajt"""

    def __init__(self, path, znacznik):
        self.path, self.znacznik = path, znacznik
        raw = open(path, "rb").read()
        self.crlf = b"\r\n" in raw
        self.bom = raw.startswith(b"\xef\xbb\xbf")
        s = raw.decode("utf-8-sig").replace("\r\n", "\n")
        self.head, sep, rest = s.partition(znacznik)
        if not sep:
            raise SystemExit("STOP: %s w nieznanym układzie (brak %r)" % (rel(path), znacznik.split("\n")[0]))
        body, sep2, self.tail = rest.rpartition("\n];")
        if not sep2:
            raise SystemExit("STOP: %s bez zamknięcia listy" % rel(path))
        self.wpisy = [json.loads(l) for l in body.split(",\n")] if body.strip() else []
        if ",\n".join(dump(e) for e in self.wpisy) != body:
            raise SystemExit("STOP: %s nie wraca do tej samej postaci po odczycie (inny układ wierszy?)" % rel(path))

    def nazwy(self):
        return [e["name"] for e in self.wpisy]

    def wpis(self, nazwa):
        return next((e for e in self.wpisy if e["name"] == nazwa), None)

    def tekst(self):
        s = self.head + self.znacznik + ",\n".join(dump(e) for e in self.wpisy) + "\n];" + self.tail
        b = (s.replace("\n", "\r\n") if self.crlf else s).encode("utf-8")
        return (b"\xef\xbb\xbf" if self.bom else b"") + b

    def zapisz(self):
        """zapisuje, gdy coś się zmieniło; True = zapisano"""
        data = self.tekst()
        if os.path.exists(self.path) and open(self.path, "rb").read() == data:
            return False
        open(self.path, "wb").write(data)
        return True


def czytaj_liste():
    return Plik(LISTA, ZNACZNIK_LISTY)


def czytaj_plugins_js():
    return Plik(PLUGINS_JS, ZNACZNIK_EDYTORA)


def nowa_lista(wpisy):
    """lista gry od zera (gdy pliku jeszcze nie ma) - nie zapisuje"""
    p = Plik.__new__(Plik)
    p.path, p.znacznik, p.crlf, p.bom = LISTA, ZNACZNIK_LISTY, False, False
    p.head, p.tail, p.wpisy = GLOWA_LISTY, "\n", list(wpisy)
    return p


def edytor_dziala():
    """RPG Maker MZ (RPGMZ.exe) działa? Gdy nie da się sprawdzić - tak (lepiej nie pisać)"""
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return True
    return any(l.lower().startswith("rpgmz") or "rpg maker" in l.lower() for l in out.splitlines())


def naglowek(nazwa):
    """główny blok /*: ... */ pliku js/plugins/<nazwa>.js (bez /*:ja i bloków ~struct~)"""
    src = open(os.path.join(ROOT, "js", "plugins", nazwa + ".js"), encoding="utf-8").read()
    m = re.search(r"/\*:(?![A-Za-z~])(.*?)\*/", src, re.S)
    return m.group(1) if m else ""


def plugindesc(nazwa):
    m = re.search(r"@plugindesc[ \t]+(.+)", naglowek(nazwa))
    if not m:
        raise SystemExit("STOP: %s.js bez @plugindesc" % nazwa)
    return m.group(1).strip()


def wpis_z_pliku(nazwa, wlaczona=True):
    """wpis jak z Menedżera wtyczek: opis z @plugindesc, parametry z @param/@default (bez @default - pusty napis)"""
    params, cur = {}, None
    for line in naglowek(nazwa).splitlines():
        line = line.strip().lstrip("*").strip()
        m = re.match(r"@param\s+(\S+)", line)
        if m:
            cur = m.group(1)
            params[cur] = ""
            continue
        m = re.match(r"@default(?:\s(.*))?$", line)
        if m and cur:
            params[cur] = (m.group(1) or "").strip()
    return {"name": nazwa, "status": bool(wlaczona), "description": plugindesc(nazwa), "parameters": params}


def dodaj(lista, wpis, po=None, przed=None):
    """wstawia wpis zaraz pod `po` / nad `przed` (bez obu: na końcu); False, gdy taka wtyczka już jest na liście"""
    nazwy = lista.nazwy()
    if wpis["name"] in nazwy:
        return False
    kotwica = po or przed
    if kotwica and kotwica not in nazwy:
        raise SystemExit("STOP: na liście gry nie ma %s - nie wiem, gdzie wpisać %s" % (kotwica, wpis["name"]))
    i = len(nazwy) if not kotwica else nazwy.index(kotwica) + (1 if po else 0)
    lista.wpisy.insert(i, wpis)
    return True


def gdzie_gra_wczytuje(lista_nazw, edytor_nazwy):
    """dla wpisów js/plugins.js, których lista nie ma: miejsce na liście tak, jak je wczytuje TawernaLoader.js (nad wpisem
    TawernaLoader - na początek, pod nim - na koniec; bez wpisu ładowacza - zaraz pod tym, co stoi nad nimi w js/plugins.js);
    -> [(nazwa, indeks na liście po wstawieniu poprzednich)]"""
    out, nazwy = [], list(lista_nazw)
    znane = set(nazwy) | {LADOWACZ}
    if LADOWACZ in edytor_nazwy:
        at = edytor_nazwy.index(LADOWACZ)
        przed, za = 0, None
        for i, n in enumerate(edytor_nazwy):
            if n in znane:
                continue
            znane.add(n)
            if i < at:
                nazwy.insert(przed, n); out.append((n, przed)); przed += 1
            else:
                nazwy.append(n); out.append((n, len(nazwy) - 1))
    else:
        pos = -1
        for n in edytor_nazwy:
            if n in znane:
                if n in nazwy:
                    pos = nazwy.index(n)
                continue
            znane.add(n)
            pos += 1
            nazwy.insert(pos, n); out.append((n, pos))
    return out


# ---------------------------------------------------------------------------------------------------------------- polecenia
def pokaz():
    lista = czytaj_liste()
    ed = set(czytaj_plugins_js().nazwy()) if os.path.exists(PLUGINS_JS) else set()
    for i, e in enumerate(lista.wpisy):
        print("%3d %s %s %s" % (i, "E" if e["name"] in ed else " ", e["name"] if e["status"] else e["name"] + " (wyłączona)",
                                "(%d parametrów)" % len(e["parameters"]) if e["parameters"] else ""))
    print("%d wpisów na liście gry (%s)" % (len(lista.wpisy), rel(LISTA)))


def sprawdz():
    bledy, uwagi = [], []
    lista = czytaj_liste()
    nazwy = lista.nazwy()
    if "[" in lista.head:
        bledy.append("głowa listy ma nawias kwadratowy - czytniki szukające pierwszego '[' się pomylą")
    pod = sorted({n for n in nazwy if nazwy.count(n) > 1})
    if pod:
        bledy.append("podwójne wpisy na liście: %s (gra wczyta tylko pierwszy)" % ", ".join(pod))
    for n in nazwy:
        if not os.path.exists(os.path.join(ROOT, "js", "plugins", n.split("/")[-1] + ".js")):
            bledy.append("brak pliku js/plugins/%s.js" % n)
    if LADOWACZ in nazwy:
        bledy.append("%s stoi na liście gry - nie powinna (wczytuje ją index.html)" % LADOWACZ)
    html = open(INDEX, encoding="utf-8").read()
    i_l, i_w, i_m = html.find('src="js/tawerna_wtyczki.js"'), html.find('src="js/plugins/TawernaLoader.js"'), html.find('src="js/main.js"')
    if not (0 <= i_l < i_w < i_m):
        bledy.append("index.html: brak wierszy listy i ładowacza nad js/main.js (gra wczyta tylko js/plugins.js + zapasowe wejście)")
    if not os.path.exists(os.path.join(ROOT, "js", "plugins", LADOWACZ + ".js")):
        bledy.append("brak js/plugins/%s.js" % LADOWACZ)
    ed = czytaj_plugins_js()
    en = ed.nazwy()
    if LADOWACZ not in en:
        uwagi.append("js/plugins.js bez wpisu %s (stary zapis edytora?) - gra działa (index.html), zapasowego wejścia brak" % LADOWACZ)
    stare = [n for n in en if n in nazwy and n not in EDYTOR]
    if stare:
        uwagi.append("js/plugins.js ma %d wtyczek z listy gry spoza EDYTOR (stara lista edytora?): %s%s - gra wczyta je raz, w kolejności "
                     "listy, ale ich parametry z edytora mają pierwszeństwo; posprzątać: --plugins-js --wykonaj przy zamkniętym edytorze"
                     % (len(stare), ", ".join(stare[:6]), "..." if len(stare) > 6 else ""))
    for n, i in gdzie_gra_wczytuje(nazwy, en):
        uwagi.append("tylko w edytorze: %s (gra wczytuje ją jako %d. - przenieść na listę: --przenies)" % (n, i))
    for e in ed.wpisy:
        m = lista.wpis(e["name"])
        rozne = [k for k in e["parameters"] if m and m["parameters"].get(k) != e["parameters"][k]]
        if m and (rozne or e["status"] != m["status"]):
            uwagi.append("%s: edytor ma inne %s niż lista gry (gra bierze z edytora)" % (
                e["name"], ", ".join((["włączenie"] if e["status"] != m["status"] else []) + rozne)))
    for u in uwagi:
        print("UWAGA " + u)
    for b in bledy:
        print("BŁĄD  " + b)
    print("lista gry: %d wpisów, js/plugins.js: %d wpisów - %s" % (len(nazwy), len(en), "w porządku" if not bledy else "%d błędów" % len(bledy)))
    return not bledy


def przenies(wykonaj):
    ed = czytaj_plugins_js()
    if not os.path.exists(LISTA):
        lista = nowa_lista(e for e in ed.wpisy if e["name"] != LADOWACZ)
        print("lista gry od zera z js/plugins.js: %d wpisów" % len(lista.wpisy))
    else:
        lista = czytaj_liste()
        nowe = gdzie_gra_wczytuje(lista.nazwy(), ed.nazwy())
        for n, i in nowe:
            lista.wpisy.insert(i, ed.wpis(n))
            print("+ %s (na liście jako %d.)" % (n, i))
        if not nowe:
            print("js/plugins.js nie ma wtyczek spoza listy gry")
        for e in ed.wpisy:
            m = lista.wpis(e["name"])
            if m and e is not m and (e["parameters"] != m["parameters"] or e["status"] != m["status"]):
                print("UWAGA %s: w js/plugins.js inne parametry/włączenie niż na liście (gra bierze z edytora; lista bez zmian)" % e["name"])
    if not wykonaj:
        print("(podgląd - nic nie zapisano; dodaj --wykonaj)")
        return
    print("zapisano %s" % rel(LISTA) if lista.zapisz() else "lista bez zmian")


def plugins_js(wykonaj):
    ed, lista = czytaj_plugins_js(), czytaj_liste()
    na_liscie = set(lista.nazwy())
    own = ed.wpis(LADOWACZ) or wpis_z_pliku(LADOWACZ)
    wpisy = [own]
    for n in EDYTOR:
        e = ed.wpis(n) or lista.wpis(n)
        if e and e not in wpisy:
            wpisy.append(e)
    # wtyczki tylko z edytora (nie z listy gry) zostają, każda po swojej stronie wpisu ładowacza
    en = ed.nazwy()
    at = en.index(LADOWACZ) if LADOWACZ in en else -1
    tylko = [e for e in ed.wpisy if e["name"] not in na_liscie and e["name"] != LADOWACZ]
    przed = [e for e in tylko if at >= 0 and en.index(e["name"]) < at]
    za = [e for e in tylko if e not in przed]
    wpisy = przed + wpisy + za
    zostaja = [e["name"] for e in wpisy]
    odpada = [n for n in en if n not in zostaja]
    print("js/plugins.js: zostaje %s; odpada %d (na liście gry): %s%s" % (", ".join(zostaja), len(odpada), ", ".join(odpada[:8]),
                                                                          "..." if len(odpada) > 8 else ""))
    brak = [n for n in odpada if n not in na_liscie]
    if brak:
        raise SystemExit("STOP: tych nie ma na liście gry - najpierw --przenies --wykonaj: %s" % ", ".join(brak))
    for e in ed.wpisy:
        m = lista.wpis(e["name"])
        if e["name"] in odpada and m and (e["parameters"] != m["parameters"] or e["status"] != m["status"]):
            raise SystemExit("STOP: %s ma w js/plugins.js inne parametry/włączenie niż na liście gry - zdecyduj, które są dobre "
                             "(lista: python tools/wtyczki.py --przenies), potem znowu" % e["name"])
    if not wykonaj:
        print("(podgląd - nic nie zapisano; dodaj --wykonaj przy zamkniętym edytorze)")
        return
    if edytor_dziala():
        raise SystemExit("STOP: RPG Maker MZ działa - js/plugins.js NIE zapisany (zamknij edytor i uruchom znowu)")
    ed.wpisy = wpisy
    data = ed.tekst()
    if open(PLUGINS_JS, "rb").read() == data:
        print("js/plugins.js bez zmian")
        return
    os.makedirs(ARCHIWUM, exist_ok=True)
    kopia = os.path.join(ARCHIWUM, "plugins_%s.js" % datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    shutil.copy2(PLUGINS_JS, kopia)
    open(PLUGINS_JS, "wb").write(data)
    print("zapisano js/plugins.js (%d wpisów; kopia poprzedniego: %s)" % (len(wpisy), kopia))


def main(argv):
    wykonaj = "--wykonaj" in argv
    arg = lambda n: argv[argv.index(n) + 1] if n in argv and argv.index(n) + 1 < len(argv) else None
    if "--sprawdz" in argv:
        sys.exit(0 if sprawdz() else 1)
    if "--dodaj" in argv:
        n = arg("--dodaj")
        lista = czytaj_liste()
        w = wpis_z_pliku(n)
        if not dodaj(lista, w, po=arg("--po"), przed=arg("--przed")):
            print("%s już jest na liście gry - nic do zrobienia" % n)
            return
        print("+ %s jako %d.: %s" % (n, lista.nazwy().index(n), dump(w)))
        if wykonaj:
            lista.zapisz()
            print("zapisano %s" % rel(LISTA))
        else:
            print("(podgląd - nic nie zapisano; dodaj --wykonaj)")
        return
    if "--opis" in argv:
        lista = czytaj_liste()
        for n in argv[argv.index("--opis") + 1:]:
            if n.startswith("--"):
                break
            e = lista.wpis(n)
            if not e:
                raise SystemExit("STOP: na liście gry nie ma %s" % n)
            e["description"] = plugindesc(n)
        print(("zapisano %s" % rel(LISTA) if lista.zapisz() else "opisy aktualne") if wykonaj else "(podgląd - dodaj --wykonaj)")
        return
    if "--przenies" in argv:
        return przenies(wykonaj)
    if "--plugins-js" in argv:
        return plugins_js(wykonaj)
    pokaz()


if __name__ == "__main__":
    main(sys.argv[1:])
