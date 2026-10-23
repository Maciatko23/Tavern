# -*- coding: utf-8 -*-
"""POPRAWKI MAP - ETAP 2 (tools/mapy/popraw.py)

Poprawia mapy agentów na miejscu, jak w edytorze: numery zdarzeń, drzwi, znaczniki „Miejsce:” i wszystko, czego
poprawka nie dotyczy, zostają bez zmian. Każda poprawka to lista operacji z warunkiem (stara wartość):
  kafel z,x,y: stary -> nowy        region x,y: stary -> nowy        zdarzenie id: przesunięcie / priorytet / notatka
Instalacja nakłada te operacje na plik z dysku W CHWILI ZAPISU i tylko wtedy, gdy każda stara wartość nadal się zgadza
(zmiany użytkownika z edytora nie zostaną nadpisane; mapa z niezgodnością jest pomijana i zgłaszana).

Kolejność poprawek (zlecenie użytkownika): O1 obiekty rozcięte, G1 gwiazdka nad wolną kratką, P2/P3 przedmioty na
krawędzi / poza blatem, D4 rzeczy z akcją nieosiągalne, D1 miejsca nieosiągalne (tylko gdy to błąd).
Każdy kandydat na poprawkę jest sprawdzany kontrolą (kontrola.py): przyjęty tylko, gdy usuwa problem i nie dodaje
żadnego nowego (porównanie kod + kratka) oraz nie odcina kratek, które były osiągalne i mają zdarzenia.

Użycie:
  python tools/mapy/popraw.py plan [ids]       plan + kopia robocza tools/mapy/staging/MapNNN.json + raport
  python tools/mapy/popraw.py obrazy [ids]     zrzuty przed / po -> docs/mapy/poprawki_MapNNN.png
  python tools/mapy/popraw.py instaluj [ids] [--czekaj MIN]   zapis do data/ (edytor zamknięty, kopia w archiwum)
  python tools/mapy/popraw.py stan             co jest w planach, co zainstalowane
Mapy użytkownika (Map001, stare części plenerów, 102/103/117 itd.) nie są poprawiane - tylko wypisywane.
"""
import os, sys, re, json, copy, hashlib, subprocess, datetime, time, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mapylib as L
import kontrola as K
import katalog as KAT
from mapylib import T

HERE = L.HERE
STAGING = os.path.join(HERE, "staging")
PLANY = os.path.join(HERE, "poprawki")
ARCHIWUM = os.path.abspath(os.path.join(L.ROOT, "..", "Tawerna_archiwum_2026-10-18", "dane_przed_poprawkami_map"))

# wnętrza agentów do poprawy (z przeglądu); 104: tylko to, co dodał agent (świeca), reszta map użytkownika nie
DO_POPRAWY = [104, 105, 106, 108, 109, 110, 113, 114, 115, 116, 121, 122, 123, 126, 127, 128, 160, 163, 166, 169,
              171, 172, 173, 176, 177]
# mapy i części map użytkownika: tylko raport (Map001 tawerna, wnętrza z jego pracą pod spodem, plenery)
UZYTKOWNIKA = {1, 3, 4, 8, 13, 19, 23, 24, 102, 103, 117, 111}
KOLEJNOSC = ["O1", "G1", "P2", "P3", "D4", "W1", "G3", "D1"]


# ================================================================================================ zapis jak edytor

def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def tekst_mapy(raw):
    """układ edytora RPG Maker MZ: własności w jednej linii, data, jedno zdarzenie w linii (LF, UTF-8 bez BOM)"""
    props = {k: v for k, v in raw.items() if k not in ("data", "events")}
    ev = raw["events"]
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(raw["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(ev) - 1 else "") for i, e in enumerate(ev)]
    lines += ["]", "}"]
    return "\n".join(lines).encode("utf-8")


def wczytaj_bajty(path):
    with open(path, "rb") as f:
        return f.read()


# ================================================================================================ operacje

class Niezgodne(Exception):
    pass


def _ev(raw, eid):
    evs = raw["events"]
    return evs[eid] if 0 <= eid < len(evs) else None


def zastosuj(raw, op, sprawdz=True):
    """nakłada jedną operację na słownik mapy; z sprawdz=True najpierw porównuje starą wartość"""
    W, H = raw["width"], raw["height"]
    k = op["op"]
    if k in ("kafel", "region"):
        z = op["z"] if k == "kafel" else 5
        i = (z * H + op["y"]) * W + op["x"]
        if sprawdz and raw["data"][i] != op["stary"]:
            raise Niezgodne("%s (%d,%d) warstwa %d: jest %d, oczekiwano %d" % (k, op["x"], op["y"], z, raw["data"][i], op["stary"]))
        raw["data"][i] = op["nowy"]
        return
    if k == "dodaj_zd":
        evs = raw["events"]
        if sprawdz and _ev(raw, op["id"]) is not None:
            raise Niezgodne("numer zdarzenia %d jest już zajęty" % op["id"])
        while len(evs) <= op["id"]: evs.append(None)
        evs[op["id"]] = copy.deepcopy(op["zd"])
        return
    e = _ev(raw, op["id"])
    if e is None:
        raise Niezgodne("brak zdarzenia %d" % op["id"])
    if sprawdz and e.get("name") != op["nazwa"]:
        raise Niezgodne("zdarzenie %d ma nazwę '%s', oczekiwano '%s'" % (op["id"], e.get("name"), op["nazwa"]))
    if k == "przesun":
        if sprawdz and [e["x"], e["y"]] != op["stary"]:
            raise Niezgodne("zdarzenie %d stoi w %s, oczekiwano %s" % (op["id"], [e["x"], e["y"]], op["stary"]))
        e["x"], e["y"] = op["nowy"]
    elif k == "prio":
        for pi, (st, nw) in op["strony"].items():
            pg = e["pages"][int(pi)]
            if sprawdz and pg["priorityType"] != st:
                raise Niezgodne("zdarzenie %d strona %s: priorytet %d, oczekiwano %d" % (op["id"], pi, pg["priorityType"], st))
            pg["priorityType"] = nw
    elif k == "notatka":
        if sprawdz and e.get("note", "") != op["stary"]:
            raise Niezgodne("zdarzenie %d: notatka zmieniona" % op["id"])
        e["note"] = op["nowy"]
    else:
        raise ValueError(k)


class Edycja:
    """mapa w pamięci + lista operacji (każda zapisuje starą wartość)"""

    def __init__(self, mid, raw):
        self.mid = mid
        self.raw = raw
        self.ops = []
        self.opis = []

    def kopia(self):
        e = Edycja(self.mid, copy.deepcopy(self.raw))
        e.ops = list(self.ops)
        e.opis = list(self.opis)
        return e

    @property
    def W(self): return self.raw["width"]

    @property
    def H(self): return self.raw["height"]

    def t(self, z, x, y):
        if not (0 <= x < self.W and 0 <= y < self.H): return None
        return self.raw["data"][(z * self.H + y) * self.W + x]

    def _op(self, op):
        zastosuj(self.raw, op)
        self.ops.append(op)

    def kafel(self, z, x, y, nowy):
        st = self.t(z, x, y)
        if st is None: raise Niezgodne("poza mapą")
        if st == nowy: return
        self._op({"op": "kafel", "z": z, "x": x, "y": y, "stary": st, "nowy": nowy})

    def region(self, x, y, nowy):
        st = self.t(5, x, y)
        if st == nowy: return
        self._op({"op": "region", "x": x, "y": y, "stary": st, "nowy": nowy})

    def przesun(self, eid, x, y):
        e = _ev(self.raw, eid)
        self._op({"op": "przesun", "id": eid, "nazwa": e["name"], "stary": [e["x"], e["y"]], "nowy": [x, y]})

    def prio(self, eid, nowy, tylko_akcja=True):
        e = _ev(self.raw, eid)
        strony = {str(i): [pg["priorityType"], nowy] for i, pg in enumerate(e["pages"])
                  if pg["priorityType"] != nowy and (not tylko_akcja or pg["trigger"] == 0)}
        if strony:
            self._op({"op": "prio", "id": eid, "nazwa": e["name"], "strony": strony})

    def wolny_numer(self):
        """numer nowego zdarzenia: za ostatnim (luki po usuniętych zostają - wtyczki mogły znać stare numery); 1-499"""
        evs = self.raw["events"]
        i = max([e["id"] for e in evs if e] + [0]) + 1
        if i >= 500: raise Niezgodne("brak wolnego numeru zdarzenia (1-499)")
        return i

    def dodaj_zd(self, zd):
        self._op({"op": "dodaj_zd", "id": zd["id"], "nazwa": zd["name"], "zd": copy.deepcopy(zd)})

    def notatka(self, eid, nowa):
        e = _ev(self.raw, eid)
        self._op({"op": "notatka", "id": eid, "nazwa": e["name"], "stary": e.get("note", ""), "nowy": nowa})

    def mapa(self):
        return L.Mapa(self.mid, raw=self.raw)


# ================================================================================================ kontrola w pamięci

def problemy(raw, mid):
    mp = L.Mapa(mid, raw=raw)
    k = K.Kontrola(mp)
    probs = k.run()
    return probs, k


def klucze(probs):
    return {(p["kod"], p["x"], p["y"]) for p in probs if p["waga"] != "info" and not p.get("ukryj")}


def chronione(mp, k):
    """kratki, które nie mogą stać się blokujące: zdarzenia, miejsca przybycia, kratki przed wyjściami"""
    out = set()
    for e in mp.zd:
        out.add((e.x, e.y))
        if e.przenosi or e.drzwi:
            for (dx, dy) in L.DIRS.values(): out.add((e.x + dx, e.y + dy))
    for (x, y, src) in mp.przybycia():
        out.add((x, y))
    return out


def nowe_klucze(stare, nowe, mp_stara):
    """nowe problemy (kod, x, y) bez drobnych martwych kratek (kieszeń do 2 kratek bez zdarzeń)"""
    ev_cells = {(e.x, e.y) for e in mp_stara.zd}
    drobne = set()
    for p in nowe:
        if p["kod"] == "D1" and not p.get("ukryj"):
            m = re.search(r"nieosiągalne miejsce: (\d+) kratek", p["opis"])
            grupa = [(q["x"], q["y"]) for q in nowe if q["kod"] == "D1" and q.get("grupa") == p.get("grupa")]
            if m and int(m.group(1)) <= 2 and not any(c in ev_cells for c in grupa):
                drobne.add((p["kod"], p["x"], p["y"]))
    return (klucze(nowe) - drobne) - klucze(stare)


def lepiej(stare, nowe, k_stary, k_nowy, mp_stara, cel=None):
    """nowy stan jest lepszy: znika problem cel (albo ubywa uwag), nie ma żadnego nowego problemu,
    żadna kratka ze zdarzeniem, która była osiągalna, nie przestała być osiągalna"""
    ks, kn = klucze(stare), klucze(nowe)
    # nowa martwa kratka za meblem (kieszeń do 2 kratek bez zdarzeń) nie przeszkadza - takie są i w mapach wzorcowych
    drobne = set()
    ev_cells = {(e.x, e.y) for e in mp_stara.zd}
    for p in nowe:
        if p["kod"] == "D1" and not p.get("ukryj"):
            m = re.search(r"nieosiągalne miejsce: (\d+) kratek", p["opis"])
            grupa = [(q["x"], q["y"]) for q in nowe if q["kod"] == "D1" and q.get("grupa") == p.get("grupa")]
            if m and int(m.group(1)) <= 2 and not any(c in ev_cells for c in grupa):
                drobne.add((p["kod"], p["x"], p["y"]))
    kn = kn - drobne
    if kn - ks: return False, "nowe problemy: " + ", ".join("%s(%d,%d)" % c for c in sorted(kn - ks)[:5])
    if cel is not None and cel in kn: return False, "problem nie zniknął"
    if len(kn) >= len(ks): return False, "nic nie ubyło"
    ev_cells = {(e.x, e.y) for e in mp_stara.zd}
    for c in ev_cells:
        near = [c] + [(c[0] + dx, c[1] + dy) for (dx, dy) in L.DIRS.values()]
        if any(n in k_stary.reach for n in near) and not any(n in k_nowy.reach for n in near):
            return False, "odcięte zdarzenie w (%d,%d)" % c
    return True, ""


# ================================================================================================ O1: obiekty rozcięte

D = {"N": (0, -1), "S": (0, 1), "W": (-1, 0), "E": (1, 0)}


def instancja(ed, kat, x, y, t):
    """kafle tego samego obiektu arkusza ułożone razem na mapie (sąsiedzi = dokładnie te kafle co na arkuszu)"""
    seen = {(x, y): t}
    stack = [(x, y, t)]
    while stack:
        cx, cy, tt = stack.pop()
        for side, n in kat.laczy(tt).items():
            dx, dy = D[side]
            nx, ny = cx + dx, cy + dy
            if (nx, ny) in seen: continue
            if n in (ed.t(2, nx, ny), ed.t(3, nx, ny)):
                seen[(nx, ny)] = n
                stack.append((nx, ny, n))
    return seen


def brakujace(ed, kat, inst, kierunek):
    """kafle, których brakuje instancji w kierunku 'N' albo 'S' (łańcuch do 3 kafli): {(x, y): tid}"""
    out = {}
    for (cx, cy), tt in inst.items():
        cur, x, y = tt, cx, cy
        for _ in range(3):
            n = kat.laczy(cur).get(kierunek)
            if n is None or not kat.pewne_polaczenie(cur, kierunek): break
            dx, dy = D[kierunek]
            x, y = x + dx, y + dy
            if (x, y) in inst or n in (ed.t(2, x, y), ed.t(3, x, y)): break
            out[(x, y)] = n
            cur = n
    return out


def warstwa_dla(ed, x, y, zwolnione=()):
    """wolna warstwa B-E (2, potem 3) w kratce; zwolnione: kratki/warstwy, które właśnie czyścimy"""
    for z in (2, 3):
        if ed.t(z, x, y) == 0 or (z, x, y) in zwolnione: return z
    return None


def kratka_pusta(ed, mp, x, y, nowy=None):
    """w kratce nie ma innych kafli B-E (ozdoby ścienne, okna, meble) ani widocznego zdarzenia - można postawić część mebla;
    kafel przechodni ('O') nie może trafić na ścianę (otworzyłby przejście przez mur)"""
    if ed.t(2, x, y) or ed.t(3, x, y): return False
    if nowy is not None and mp.zest.przejscie(nowy) == "O" and not mp.stoi(x, y): return False
    for e in mp.zd:
        if not e.widoczne or not e.page: continue
        bb = e.bbox(mp.zest)
        if not bb: continue
        ox = max(0, min(bb[2], x * T + T - 1) - max(bb[0], x * T) + 1)
        oy = max(0, min(bb[3], y * T + T - 1) - max(bb[1], y * T) + 1)
        if ox * oy > 0.08 * T * T: return False
    return True


def warstwa_kafla(ed, x, y, t):
    for z in (3, 2):
        if ed.t(z, x, y) == t: return z
    return None


def kandydaci_O1(ed, kat, p, mp, k):
    """lista (opis, funkcja(ed)) poprawek obiektu rozciętego"""
    m = re.search(r"kafel (\d+) .* - (dół bez góry|góra bez dołu)", p["opis"])
    if not m: return []
    t = int(m.group(1))
    x, y = p["x"], p["y"]
    inst = instancja(ed, kat, x, y, t)
    chr_ = chronione(mp, k)
    out = []
    kier = "N" if m.group(2) == "dół bez góry" else "S"
    brak = brakujace(ed, kat, inst, kier)
    nazwa = "%s (%d,%d) %d kafli" % (L.arkusz(t), *L.kol_wiersz(t), len(inst))

    def dopisz(e2, cells):
        for (cx, cy), nt in cells.items():
            if not (0 <= cx < e2.W and 0 <= cy < e2.H): raise Niezgodne("poza mapą")
            if not kratka_pusta(e2, mp, cx, cy, nt): raise Niezgodne("kratka (%d,%d) zajęta przez inną rzecz" % (cx, cy))
            if e2.t(0, cx, cy) == 0 and e2.t(1, cx, cy) == 0: raise Niezgodne("poza pomieszczeniem")
            e2.kafel(2, cx, cy, nt)

    if brak:
        # nowe kafle blokujące nie mogą stanąć na chronionych kratkach (zdarzenia, przybycia, przed drzwiami)
        def blokuje(cells):
            return any(c in chr_ and mp.zest.przejscie(nt) != "*" for c, nt in cells.items())
        if kier == "S":
            kk = max(c[1] for c in brak) - max(c[1] for c in inst)
            # A) przesuń w górę i dołóż dół na miejscu dawnego dołu (mebel stoi przy ścianie, podłoga zostaje)
            def przesun_gora(e2, kk=kk):
                zwol = set()
                stare = []
                for (cx, cy), tt in inst.items():
                    z = warstwa_kafla(e2, cx, cy, tt)
                    stare.append((z, cx, cy, tt))
                for (z, cx, cy, tt) in stare:
                    e2.kafel(z, cx, cy, 0); zwol.add((z, cx, cy))
                nowe = {(cx, cy - kk): tt for (cx, cy), tt in inst.items()}
                nowe.update({(cx, cy - kk): nt for (cx, cy), nt in brak.items()})
                for (cx, cy), nt in nowe.items():
                    if cy < 0: raise Niezgodne("poza mapą")
                    if (cx, cy) not in inst and not kratka_pusta(e2, mp, cx, cy, nt):
                        raise Niezgodne("kratka (%d,%d) zajęta przez inną rzecz" % (cx, cy))
                    if (cx, cy) in inst and (e2.t(2, cx, cy) or e2.t(3, cx, cy)):
                        raise Niezgodne("kratka (%d,%d) zajęta przez inną rzecz" % (cx, cy))
                    if mp.zest.przejscie(nt) == "O" and not mp.stoi(cx, cy):
                        raise Niezgodne("kafel przechodni na ścianie (%d,%d)" % (cx, cy))
                    e2.kafel(2, cx, cy, nt)
            out.append(("przesunięto obiekt %s o %d w górę i dołożono dół" % (nazwa, kk), przesun_gora))
            if not blokuje(brak):
                out.append(("dołożono dół obiektu %s" % nazwa, lambda e2, b=brak: dopisz(e2, b)))
        else:
            out.append(("dołożono górę obiektu %s" % nazwa, lambda e2, b=brak: dopisz(e2, b)))

    def usun(e2):
        for (cx, cy), tt in inst.items():
            z = warstwa_kafla(e2, cx, cy, tt)
            if z is not None: e2.kafel(z, cx, cy, 0)
    if len(inst) <= 2:           # większych mebli nie usuwamy automatycznie (decyzja ręczna, RECZNE)
        out.append(("usunięto resztkę obiektu %s" % nazwa, usun))
    return out


# ================================================================================================ G1: gwiazdka nad wolną kratką

def kandydaci_G1(ed, kat, p, mp, k):
    m = re.search(r"kafel (\d+) ", p["opis"])
    if not m: return []
    t = int(m.group(1))
    x, y = p["x"], p["y"]
    chr_ = chronione(mp, k)
    out = []
    if (x, y) not in chr_ and ed.t(5, x, y) in (0, None):
        out.append(("kratka pod kaflem %d zablokowana regionem 2 (RegionLayers: mebel stoi na niej)" % t,
                    lambda e2: e2.region(x, y, 2)))
    z = warstwa_kafla(ed, x, y, t)

    def usun(e2):
        if z is not None: e2.kafel(z, x, y, 0)
    out.append(("usunięto kafel %d z gwiazdką" % t, usun))
    return out


# ================================================================================================ P2 / P3: przedmioty

def _item_check(raw, mid, x, y, kto_rx):
    """problemy P* w kratce (x, y) dotyczące przedmiotu (po nazwie / kaflu)"""
    probs, k = problemy(raw, mid)
    return [p for p in probs if p["kod"] in ("P1", "P2", "P3") and (p["x"], p["y"]) == (x, y) and re.search(kto_rx, p["opis"])]


def klucz_oceny_problemu(p):
    m = re.search(r"zdarzenie (\d+) '", p["opis"])
    if m: return "zd:%s" % m.group(1)
    m = re.search(r"kafel (\d+) ", p["opis"])
    if m: return "kafel:%s@%d,%d" % (m.group(1), p["x"], p["y"])
    return None


klucz_orig = klucz_oceny_problemu


PX_DY = range(-20, 21, 4)        # przesunięcia (px) próbowane dla przedmiotu, który w żadnej kratce nie leży cały na blacie
PREMIA_ROWNO = 5                 # px luzu, które oddajemy za równy rząd takich samych przedmiotów


def zd_przedmiot(eid, x, y, t, dy):
    """przedmiot z kafla jako zdarzenie z obrazkiem tego kafla, pod postacią, przesunięte o dy px (<Px>, TawernaCore)"""
    return {"id": eid, "name": "Na stole: %s %d,%d" % ((L.arkusz(t),) + tuple(L.kol_wiersz(t))), "note": "<Px:0,%d>" % dy,
            "pages": [{"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A",
                                      "selfSwitchValid": False, "switch1Id": 1, "switch1Valid": False, "switch2Id": 1,
                                      "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
                       "directionFix": True,
                       "image": {"characterIndex": 0, "characterName": "", "direction": 2, "pattern": 0, "tileId": t},
                       "list": [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3,
                       "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
                       "moveSpeed": 3, "moveType": 0, "priorityType": 0, "stepAnime": False, "through": False, "trigger": 0,
                       "walkAnime": False}],
            "x": x, "y": y}


def kandydaci_P(ed, kat, p, mp, k):
    out = []
    x, y = p["x"], p["y"]
    m = re.search(r"zdarzenie (\d+) '", p["opis"])
    zajete = {(e.x, e.y) for e in mp.zd}
    # tylko sąsiednie kratki tego samego mebla; przedmiot z podłogi (P3) tylko w górę, na mebel przed którym stoi
    ruchy = [(0, -1), (0, 1), (-1, 0), (1, 0), (-1, -1), (1, -1), (-1, 1), (1, 1)]
    if p["kod"] == "P3": ruchy = [(0, -1), (-1, -1), (1, -1)]
    if m:
        eid = int(m.group(1))
        ev = next((z for z in mp.zd if z.id == eid), None)
        if ev is not None and (ev.komendy or ev.name.startswith("Miejsce:")): return out    # zdarzenia z treścią nie wędrują
        # na krawędzi blatu: przesunięcie obrazka o piksele (<Px:0,dy>)
        if ev is not None and p["kod"] == "P2" and ev.tile_id and re.search(r"krawędzi|krawędź", p["opis"]):
            for dy in PX_DY:
                if (0, dy) == ev.px: continue
                nota = re.sub(r"<Px:-?\d+,-?\d+>", "", ev.note, flags=re.I) + "<Px:%d,%d>" % (ev.px[0], dy)
                out.append(("obrazek zdarzenia %d przesunięty o %d px w pionie" % (eid, dy),
                            lambda e2, eid=eid, nota=nota: e2.notatka(eid, nota), "zd:%d" % eid))
        for (dx, dy) in ruchy:
            nx, ny = x + dx, y + dy
            if not (0 <= nx < ed.W and 0 <= ny < ed.H) or (nx, ny) in zajete: continue
            if ed.t(3, nx, ny) and ed.t(2, nx, ny) and kat.przedmiot(ed.t(3, nx, ny)): continue    # nie na inny przedmiot
            out.append(("przesunięto zdarzenie %d z (%d,%d) do (%d,%d)" % (eid, x, y, nx, ny),
                        lambda e2, eid=eid, nx=nx, ny=ny: e2.przesun(eid, nx, ny), "zd:%d" % eid))
        return out
    m = re.search(r"kafel (\d+) ", p["opis"])
    if not m: return out
    t = int(m.group(1))
    if ed.t(3, x, y) != t: return out
    for (dx, dy) in ruchy:
        nx, ny = x + dx, y + dy
        if not (0 <= nx < ed.W and 0 <= ny < ed.H): continue
        if ed.t(3, nx, ny) != 0 or not ed.t(2, nx, ny) or not kat.blat(ed.t(2, nx, ny)) or (nx, ny) in zajete: continue

        def mv(e2, nx=nx, ny=ny):
            e2.kafel(3, x, y, 0)
            e2.kafel(3, nx, ny, t)
        out.append(("przesunięto kafel %d z (%d,%d) do (%d,%d)" % (t, x, y, nx, ny), mv, "kafel:%d@%d,%d" % (t, nx, ny)))
    # przedmiot na krawędzi blatu, który w żadnej kratce nie leży cały na blacie (stół na dwa rzędy): zdarzenie z obrazkiem
    # tego kafla w tej samej kratce, przesunięte o kilka pikseli na środek blatu (2026-10-22, księgi w bibliotece Map173)
    if p["kod"] == "P2" and re.search(r"krawędzi|krawędź", p["opis"]):
        eid = ed.wolny_numer()
        # przedmioty przesunięte już w tym rzędzie tego stołu (talerze, dwie księgi): ta sama wysokość, jeśli niewiele gorsza
        rowne = {int(m.group(1)) for e in ed.raw["events"] if e and e["y"] == y and abs(e["x"] - x) <= 4 and e["pages"][0]["image"]["tileId"]
                 for m in [re.search(r"<Px:-?\d+,(-?\d+)>", e.get("note", ""))] if m}
        for dy in sorted(PX_DY, key=lambda d: d not in rowne):
            if dy == 0: continue

            def zd(e2, dy=dy):
                e2.kafel(3, x, y, 0)
                e2.dodaj_zd(zd_przedmiot(eid, x, y, t, dy))
            out.append(("kafel %d w (%d,%d) jako zdarzenie %d z obrazkiem kafla, %+d px w pionie" % (t, x, y, eid, dy), zd, "zd:%d" % eid,
                        dy in rowne))
    return out


# ================================================================================================ D4, W1, G3

def kandydaci_D4(ed, kat, p, mp, k):
    out = []
    m = re.search(r"zdarzenie (\d+) '", p["opis"])
    if not m: return out
    eid = int(m.group(1))
    e = next((z for z in mp.zd if z.id == eid), None)
    if e is None: return out
    if e.prio != 1:
        out.append(("zdarzenie %d '%s': priorytet 'jak postać' - akcja z sąsiedniej kratki" % (eid, e.name),
                    lambda e2: e2.prio(eid, 1)))
    if not e.widoczne:
        # niewidoczne „oglądanie”: przesuń o kratkę na tę część mebla / ściany, przed którą da się stanąć
        zajete = {(z.x, z.y) for z in mp.zd}
        for (dx, dy) in ((0, 1), (-1, 0), (1, 0), (-1, 1), (1, 1)):
            nx, ny = e.x + dx, e.y + dy
            if not mp.inside(nx, ny) or mp.stoi(nx, ny) or (nx, ny) in zajete: continue
            if not any((nx + ax, ny + ay) in k.reach for (ax, ay) in L.DIRS.values()): continue

            def mv(e2, nx=nx, ny=ny):
                e2.przesun(eid, nx, ny)
                e2.prio(eid, 1)
            out.append(("niewidoczne zdarzenie %d '%s' przesunięte z (%d,%d) do (%d,%d) (przed nim da się stanąć)" % (
                eid, e.name, e.x, e.y, nx, ny), mv))
    # rzecz zastawiona: odsuń zdarzenie, które stoi na kratce przed nią
    for (dx, dy) in L.DIRS.values():
        cx, cy = e.x + dx, e.y + dy
        for b in mp.ev_block().get((cx, cy), []):
            if b.przenosi or b.komendy_strony or b.name.startswith("Miejsce:"): continue
            for (mx, my) in ((cx - 1, cy), (cx + 1, cy), (cx, cy + 1), (cx - 1, cy + 1), (cx + 1, cy + 1)):
                if not mp.stoi(mx, my) or any((z.x, z.y) == (mx, my) for z in mp.zd): continue
                out.append(("odsunięto zdarzenie %d '%s' z (%d,%d) do (%d,%d), żeby odsłonić '%s'" % (b.id, b.name, cx, cy, mx, my, e.name),
                            lambda e2, bid=b.id, mx=mx, my=my: e2.przesun(bid, mx, my)))
    return out


def kandydaci_W1(ed, kat, p, mp, k):
    out = []
    m = re.search(r"zdarzenia (\d+) '", p["opis"])
    if not m: return out
    eid = int(m.group(1))
    e = next((z for z in mp.zd if z.id == eid), None)
    if e is None: return out
    side = "right" if p["x"] > e.x else "left"
    n = abs(p["x"] - e.x)
    note = e.note
    if "<Occupy" not in note:
        out.append(("zdarzenie %d '%s': <Occupy:%s=%d> - obraz nie wchodzi na wolną kratkę" % (eid, e.name, side, n),
                    lambda e2: e2.notatka(eid, note + "<Occupy:%s=%d>" % (side, n))))
    for (dx, dy) in (((-1, 0), (1, 0), (0, -1), (0, 1)) if not e.komendy else ()):
        nx, ny = e.x + dx, e.y + dy
        if mp.stoi(nx, ny) and not any((z.x, z.y) == (nx, ny) for z in mp.zd):
            out.append(("przesunięto zdarzenie %d '%s' do (%d,%d)" % (eid, e.name, nx, ny),
                        lambda e2, nx=nx, ny=ny: e2.przesun(eid, nx, ny)))
    return out


GENERATORY = {"O1": kandydaci_O1, "G1": kandydaci_G1, "P1": kandydaci_P, "P2": kandydaci_P, "P3": kandydaci_P,
              "D4": kandydaci_D4, "W1": kandydaci_W1, "G3": kandydaci_W1}

# ================================================================================================ plan jednej mapy

# decyzje ręczne (po obejrzeniu zrzutów przed / po): mapa -> {(kod, x, y): numer kandydata albo 'pomin'}
RECZNE = {
    110: {("G1", 10, 6): 1},          # skrzynka u stóp łóżka: jak po lewej usunięta (symetria), nie blokada regionem
    169: {("D1", 1, 7): "pomin", ("D1", 11, 8): "pomin"},          # martwe kratki za meblami, bez zdarzeń
    177: {("G3", 8, 5): "pomin"},     # stół: <LudOff:24,0> działa w Ludzie.js tylko dla zdarzeń 2500-2699 - do decyzji
    109: {("P1", 13, 5): "pomin"},    # rzecz na łóżku - do decyzji użytkownika
    173: {("P1", 2, 9): "pomin"},     # popiersie na okrągłym stoliku E(7,11) - wygląda dobrze, stolik nie jest w katalogu blatów
    176: {("O1", 3, 4): "pomin", ("O1", 16, 10): "pomin"},   # urna E(6,13) bez niszy ściennej - sama na posadzce wygląda dobrze
    171: {("D1", 16, 4): "pomin"},    # martwa kratka między krzesłem Baltazara a regałem, bez zdarzeń
}


def _przesun_kafle(ed, cells, dy):
    """przesuwa kafle B-E z podanych kratek (warstwy 2-3) o dy w pionie (cała grupa naraz)"""
    stare = []
    for (x, y) in cells:
        for z in (2, 3):
            t = ed.t(z, x, y)
            if t: stare.append((z, x, y, t))
    for (z, x, y, t) in stare: ed.kafel(z, x, y, 0)
    for (z, x, y, t) in stare: ed.kafel(z, x, y + dy, t)


def _r173(ed):
    """Biblioteka: dwa regały 4x2 (C(0..3,6..7)) bez dolnego rzędu stały na środku - bohater wchodził pod nie. Regały
    stają pod tylną ścianą (rzędy 4-6) z dolnym rzędem C(0..3,8), przejście w rzędzie 7 zostaje wolne; kandelabr
    spod lewego regału na (1,9), jak prawy na (15,9). Zdarzenia „Regały” (3,7) i (13,7) o rząd wyżej, przy regałach."""
    for x0 in (1, 12):
        cells = [(x0 + i, y) for i in range(4) for y in (6, 7)]
        _przesun_kafle(ed, cells, -2)
        for i in range(4):
            ed.kafel(2, x0 + i, 6, 320 + i)
    ed.przesun(14, 1, 9)
    ed.przesun(15, 3, 6)
    ed.przesun(16, 13, 6)


def _r172(ed):
    """Hol: kamienie z krukiem (1,3) i (21,3) zasłaniała dolna połowa doniczki bez rośliny (kafel D(4,8) bez D(4,6..7)) -
    usunięta (mały wazon pod nią zostaje); (9,3) i (13,3) zamykały kandelabry przy schodach - o kratkę niżej, symetrycznie."""
    for x in (1, 21):
        ed.kafel(2, x, 4, 0)
    ed.przesun(11, 9, 6)
    ed.przesun(12, 13, 6)


RECZNE_OPS = {173: _r173, 172: _r172}


def plan_mapy(mid, verbose=True):
    raw = L.load_json(L.DATA + "Map%03d.json" % mid)
    ed = Edycja(mid, copy.deepcopy(raw))
    kat = K.Kat(raw["tilesetId"])
    probs0, k0 = problemy(ed.raw, mid)
    log = []
    proby = []
    pominiete = []
    # (ręczne operacje są jednorazowe: po instalacji już nie; plan etapu 2 odłożony w poprawki/etap2/)
    juz = any(os.path.exists(pp) and L.load_json(pp).get("zainstalowano")
              for pp in (os.path.join(PLANY, "Map%03d.json" % mid), os.path.join(PLANY, "etap2", "Map%03d.json" % mid)))
    if mid in RECZNE_OPS and not juz:
        e2 = ed.kopia()
        RECZNE_OPS[mid](e2)
        nowe, kn = problemy(e2.raw, mid)
        ok, why = lepiej(probs0, nowe, k0, kn, ed.mapa())
        if ok:
            ed = e2
            log.append({"kod": "ręcznie", "x": -1, "y": -1, "problem": "decyzja ręczna",
                        "poprawka": (RECZNE_OPS[mid].__doc__ or "").strip().replace("\n", " ")})
        else:
            print("Map%03d: poprawka ręczna odrzucona: %s" % (mid, why))
    for kod in KOLEJNOSC:
        if kod not in GENERATORY: continue
        guard = 0
        while guard < 40:
            guard += 1
            cur, kc = problemy(ed.raw, mid)
            mp = ed.mapa()
            todo = [p for p in cur if p["kod"] == kod and p["waga"] != "info" and not p.get("ukryj")
                    and (kod, p["x"], p["y"]) not in {(a, b, c) for (a, b, c, _) in pominiete}]
            if mid in RECZNE_FILTR:
                todo = [p for p in todo if RECZNE_FILTR[mid](p)]
            if not todo: break
            p = todo[0]
            cel = (p["kod"], p["x"], p["y"])
            wybor = RECZNE.get(mid, {}).get(cel)
            kands = GENERATORY[kod](ed, kat, p, mp, kc)
            if wybor == "pomin":
                pominiete.append(cel + ("decyzja: zostawione",)); continue
            if isinstance(wybor, int):
                kands = kands[wybor:wybor + 1]
            done = False
            powody = []
            najlepszy = None          # przedmioty: wybierz miejsce najdalej od krawędzi blatu
            for kand in kands:
                opis, fn = kand[0], kand[1]
                klucz_p = kand[2] if len(kand) > 2 else None
                premia = PREMIA_ROWNO if len(kand) > 3 and kand[3] else 0
                e2 = ed.kopia()
                try:
                    fn(e2)
                except Niezgodne as ex:
                    powody.append("%s: %s" % (opis, ex)); continue
                nowe, kn = problemy(e2.raw, mid)
                ok, why = lepiej(cur, nowe, kc, kn, mp, cel)
                if ok and klucz_p is not None:
                    oc = kn.oceny.get(klucz_p)
                    # ten sam mebel co przedtem (albo blat znany z map wzorcowych), nie krzesło ani łóżko obok
                    orig = kc.oceny.get(klucz_orig(p))
                    ten_sam = oc and ((orig and orig.get("obiekt") is not None and oc.get("obiekt") == orig.get("obiekt"))
                                      or ((not orig or orig.get("obiekt") is None) and oc.get("wyuczony")))
                    if not oc or not oc.get("blat") or oc["luz"] < (0 if oc.get("plaski") else 2) or not ten_sam:
                        ok, why = False, "przedmiot nie leży pewnie na tym samym blacie (%s)" % (oc,)
                    elif najlepszy is None or oc["luz"] + premia > najlepszy[0]:
                        najlepszy = (oc["luz"] + premia, opis, e2, oc["luz"])
                    continue
                if not ok: proby.append({"kod": kod, "x": p["x"], "y": p["y"], "kandydat": opis, "odrzucony": why})
                if ok:
                    e2.opis.append("%s %s (%d,%d): %s" % (kod, p["opis"][:70], p["x"], p["y"], opis))
                    ed = e2
                    log.append({"kod": kod, "x": p["x"], "y": p["y"], "problem": p["opis"], "poprawka": opis})
                    done = True
                    break
                powody.append("%s: %s" % (opis, why))
            if not done and najlepszy is not None:
                _, opis, e2, luz = najlepszy
                ed = e2
                log.append({"kod": kod, "x": p["x"], "y": p["y"], "problem": p["opis"], "poprawka": "%s (%d px od krawędzi)" % (opis, luz)})
                done = True
            if not done:
                pominiete.append(cel + ("; ".join(powody[:4]) or "brak kandydatów",))
    probs1, k1 = problemy(ed.raw, mid)
    wynik = {"mapa": mid, "nazwa": L.map_name(mid), "ops": ed.ops, "log": log,
             "pominiete": [{"kod": a, "x": b, "y": c, "dlaczego": d} for (a, b, c, d) in pominiete], "proby": proby,
             "przed": sorted(["%s %d,%d" % c for c in klucze(probs0)]), "po": sorted(["%s %d,%d" % c for c in klucze(probs1)]),
             "sha_data": hashlib.sha256(wczytaj_bajty(L.DATA + "Map%03d.json" % mid)).hexdigest()}
    os.makedirs(STAGING, exist_ok=True)
    os.makedirs(PLANY, exist_ok=True)
    sp = os.path.join(STAGING, "Map%03d.json" % mid)
    if ed.ops:
        with open(sp, "wb") as f:
            f.write(tekst_mapy(ed.raw))
    elif os.path.exists(sp):
        os.remove(sp)
    L.save_json(os.path.join(PLANY, "Map%03d.json" % mid), wynik, indent=1)
    if verbose:
        print("Map%03d %s: %d -> %d uwag, %d operacji" % (mid, wynik["nazwa"], len(wynik["przed"]), len(wynik["po"]), len(ed.ops)))
        for l in log: print("   + %s (%d,%d): %s" % (l["kod"], l["x"], l["y"], l["poprawka"]))
        for pm in wynik["pominiete"]: print("   - %s (%d,%d) zostaje: %s" % (pm["kod"], pm["x"], pm["y"], pm["dlaczego"][:160]))
    return wynik


# filtr problemów do poprawy na mapie (104 Ratusz: mapa użytkownika - tylko świeca dodana przez agenta, zdarzenie 18)
RECZNE_FILTR = {104: lambda p: "zdarzenie 18 " in p["opis"]}


# ================================================================================================ obrazy przed / po

def obraz_przed_po(mid, out=None):
    from PIL import Image, ImageDraw
    raw0 = L.load_json(L.DATA + "Map%03d.json" % mid)
    sp = os.path.join(STAGING, "Map%03d.json" % mid)
    raw1 = L.load_json(sp) if os.path.exists(sp) else raw0
    imgs = []
    for raw, tyt in ((raw0, "PRZED"), (raw1, "PO")):
        mp = L.Mapa(mid, raw=raw)
        k = K.Kontrola(mp)
        probs = [p for p in k.run() if p["waga"] != "info"]
        marks = [(p["x"], p["y"], K.KOLOR[p["kod"][0]], p["kod"] if not p.get("ukryj") else "") for p in probs]
        im = L.render(mp, grid=True, marks=marks)
        head = Image.new("RGBA", (im.width, 34), (24, 22, 30, 255))
        d = ImageDraw.Draw(head)
        d.text((8, 6), "%s: Map%03d %s - uwagi: %d" % (tyt, mid, mp.nazwa, sum(1 for p in probs if not p.get("ukryj"))),
               fill=(255, 214, 90) if tyt == "PRZED" else (150, 240, 150), font=L.font(18, True))
        full = Image.new("RGBA", (im.width, im.height + 34), (24, 22, 30, 255))
        full.alpha_composite(head, (0, 0)); full.alpha_composite(im, (0, 34))
        imgs.append(full)
    W = imgs[0].width + imgs[1].width + 16
    Hh = max(i.height for i in imgs)
    canvas = Image.new("RGBA", (W, Hh), (24, 22, 30, 255))
    canvas.alpha_composite(imgs[0], (0, 0)); canvas.alpha_composite(imgs[1], (imgs[0].width + 16, 0))
    out = out or os.path.join(L.DOCS, "poprawki_Map%03d.png" % mid)
    rgb = canvas.convert("RGB")
    if rgb.width * rgb.height > 300_000: rgb = rgb.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.NONE)
    rgb.save(out, optimize=True)
    return out


# ================================================================================================ instalacja

def edytor_otwarty():
    """RPG Maker MZ (edytor) albo gra z NW.js z folderu projektu działa? (tasklist)"""
    try:
        out = subprocess.run(["tasklist", "/FO", "CSV", "/NH"], capture_output=True, text=True, timeout=30).stdout
    except Exception:
        return True
    return bool(re.search(r'"RPGMZ\.exe"', out, re.I))


def instaluj(ids, czekaj_min=0):
    os.makedirs(ARCHIWUM, exist_ok=True)
    raport = []
    koniec = time.time() + czekaj_min * 60
    while edytor_otwarty():
        if time.time() > koniec:
            print("Edytor RPG Maker MZ jest otwarty - nic nie zapisano. Kopie robocze czekają w", STAGING)
            return None
        time.sleep(30)
    for mid in ids:
        pp = os.path.join(PLANY, "Map%03d.json" % mid)
        if not os.path.exists(pp):
            continue
        plan = L.load_json(pp)
        if not plan["ops"]:
            continue
        if edytor_otwarty():
            print("Edytor otwarty w trakcie instalacji - przerywam przed Map%03d" % mid)
            break
        path = L.DATA + "Map%03d.json" % mid
        bajty = wczytaj_bajty(path)
        raw = json.loads(bajty.decode("utf-8"))
        if tekst_mapy(raw) != bajty:
            raport.append((mid, "POMINIĘTA: plik nie jest w układzie edytora (zapis zmieniłby więcej niż poprawki)"))
            continue
        try:
            for op in plan["ops"]:
                zastosuj(raw, op, sprawdz=True)
        except Niezgodne as ex:
            raport.append((mid, "POMINIĘTA: mapa zmieniła się od planu (%s) - trzeba zrobić plan od nowa" % ex))
            continue
        # kontrola: żadnych nowych problemów względem tego, co jest teraz na dysku
        raw0 = json.loads(bajty.decode("utf-8"))
        p0, k0 = problemy(raw0, mid)
        p1, k1 = problemy(raw, mid)
        nowe = nowe_klucze(p0, p1, L.Mapa(mid, raw=raw0))
        if nowe:
            raport.append((mid, "POMINIĘTA: po poprawce nowe problemy %s" % sorted(nowe)[:5]))
            continue
        stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        with open(os.path.join(ARCHIWUM, "Map%03d_%s.json" % (mid, stamp)), "wb") as f:
            f.write(bajty)
        # ostatnie sprawdzenie tuż przed zapisem: plik się nie zmienił od wczytania, edytor zamknięty
        if wczytaj_bajty(path) != bajty or edytor_otwarty():
            raport.append((mid, "POMINIĘTA: plik zmienił się w trakcie albo otworzono edytor"))
            continue
        nowy = tekst_mapy(raw)
        with open(path, "wb") as f:
            f.write(nowy)
        plan["zainstalowano"] = datetime.datetime.now().isoformat(timespec="seconds")
        plan["sha_po"] = hashlib.sha256(nowy).hexdigest()
        L.save_json(pp, plan, indent=1)
        raport.append((mid, "zainstalowana: %d operacji, uwagi %d -> %d" % (len(plan["ops"]), len(klucze(p0)), len(klucze(p1)))))
    for mid, r in raport:
        print("Map%03d %s" % (mid, r))
    return raport


# ================================================================================================ CLI

def main(argv):
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    if not argv:
        print(__doc__); return
    cmd = argv[0]
    ids = [int(a) for a in argv[1:] if a.isdigit()] or DO_POPRAWY
    if cmd == "plan":
        K.katalog()
        for mid in ids:
            if mid in UZYTKOWNIKA:
                print("Map%03d: mapa użytkownika - tylko raport" % mid); continue
            plan_mapy(mid)
    elif cmd == "obrazy":
        for mid in ids:
            print(obraz_przed_po(mid))
    elif cmd == "instaluj":
        cz = 0
        if "--czekaj" in argv: cz = float(argv[argv.index("--czekaj") + 1])
        instaluj(ids, cz)
    elif cmd == "stan":
        for mid in ids:
            pp = os.path.join(PLANY, "Map%03d.json" % mid)
            if not os.path.exists(pp): continue
            p = L.load_json(pp)
            print("Map%03d %-28s ops %2d  uwagi %d -> %d  %s" % (mid, p["nazwa"][:28], len(p["ops"]), len(p["przed"]), len(p["po"]),
                                                             "zainstalowana " + p["zainstalowano"] if p.get("zainstalowano") else ""))
    else:
        print(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
