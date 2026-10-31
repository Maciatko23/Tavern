# -*- coding: utf-8 -*-
# Generuje docs/mapy/SWIAT.md z docs/mapy/swiat.json i z układu (swiat_kratki.py). Nic nie zapisuje do data/ ani js/.
#   python tools/mapy/swiat_obrazy.py && python tools/mapy/swiat_opis.py
import os, sys, json, re, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import numpy as np
import swiat_kratki as K
import swiat_krawedzie as KR
import swiat_obrazy as O

sw, sas, pas, nies, ed, stare, bk, J = K.wszystko(verbose=False)
M = {int(k): v for k, v in J["mapy"].items()}
OFF = K.OFF
NAMES = K.NAMES
PLAYER = K.PLAYER
SD = {"N": "północna", "E": "wschodnia", "S": "południowa", "W": "zachodnia"}


def nm(m): return "%d %s" % (m, NAMES.get(m) or M[m]["nazwa"])


def czesc(m):
    e = M[m]
    cx, cy = e["x0_maski"] + e["szer"] / 2, e["y0_maski"] + e["wys"] / 2
    return K.czesc_kruka(cx / K.S + 110, cy / K.S + 58)


def zakres(v):
    v = sorted(set(v))
    return "%d" % v[0] if len(v) == 1 else "%d-%d" % (v[0], v[-1])


def grupuj_zdarzenia(lst):
    g = collections.OrderedDict()
    for t in lst:
        g.setdefault(t["nazwa"], []).append(t["id"])
    out = []
    for n, ids in g.items():
        out.append("%s (%d): #%s%s" % (n, len(ids), ", #".join(str(i) for i in ids[:6]), " ..." if len(ids) > 6 else ""))
    return "; ".join(out)


def zasoby_w_morzu(m):
    """zdarzenia-zasoby (drzewa, krzaki, kamienie, kłody), które wypadają w morze; znikną razem z lądem"""
    d = json.load(open(os.path.join(K.DATA, "Map%03d.json" % m), encoding="utf-8"))
    x0, y0 = sw.rects[m][0], sw.rects[m][1]
    tr = {t[0] for t in sw.tresc[m]}
    n = 0
    for e in d["events"]:
        if not e or e["id"] in tr or (e["name"] or "").startswith("Przej"): continue
        X, Y = x0 + e["x"], y0 + e["y"]
        if 0 <= X < K.WW and 0 <= Y < K.WH and not sw.L[Y, X]: n += 1
    return n


def skladowe_morza(m, maks=3):
    x, y, w, h = sw.rects[m]
    ow, oh = sw.size[m]
    sea = ~sw.L[y:y + oh, x:x + ow]
    lab = np.zeros(sea.shape, int); k = 0; out = []
    for yy in range(sea.shape[0]):
        for xx in range(sea.shape[1]):
            if sea[yy, xx] and not lab[yy, xx]:
                k += 1; st = [(xx, yy)]; lab[yy, xx] = k; c = 0; xs = []; ys = []
                while st:
                    a, b = st.pop(); c += 1; xs.append(a); ys.append(b)
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        u, v = a + dx, b + dy
                        if 0 <= u < sea.shape[1] and 0 <= v < sea.shape[0] and sea[v, u] and not lab[v, u]: lab[v, u] = k; st.append((u, v))
                out.append((c, min(xs), max(xs), min(ys), max(ys)))
    out = [o for o in out if o[0] >= 20]
    out.sort(reverse=True)
    return out[:maks]


nowe = sorted(m for m in M if M[m]["nowa"])
isn = [m for m in M if not M[m]["nowa"]]
suma_morza = sum(M[m]["morze_do_domalowania"]["kratek"] + M[m]["nowa_czesc_morza"] for m in isn)
rosnace = [m for m in isn if any(M[m]["rosnie"])]
cov_proc = J["pokrycie"]["linia_brzegu_proc"]
wiersze, zle_kr = KR.sprawdz(sw, sas, bk)
skok_max = max([e["skok_kratek"] for e in bk] or [0])
tresc_razem = sum(M[m]["tresc"]["razem"] for m in isn)
tresc_pas = sum(len(M[m]["tresc"]["w_pasie_surowej_sylwetki"]) for m in isn)
tresc_morze = sum(len(M[m]["tresc"]["w_morzu_po_wybrzuszeniu"]) for m in isn)
trasa = sw.trasa(pas, 20, 8)

L = []
w = L.append
w("# Świat Kruczej Wyspy w kratkach")
w("")
w("2026-10-30. **PROJEKT do oceny.** W `data/` ani `js/` nic nie zmieniłem. Narzędzia (`tools/mapy/`): `swiat_kratki.py` (układ, maska, `swiat.json`), `swiat_obrazy.py` (obrazki), `swiat_opis.py` (ten plik), `swiat_krawedzie.py` (**sprawdzanie krawędzi do etapów**).")
w("")
w("Obrazki w `docs/mapy/`:")
w("")
w("- `swiat_podglad.png`: **ładny podgląd całej wyspy** (bez ramek technicznych): tak będzie wyglądać świat i mapa w menu. Gładki brzeg, suche koryto rzeki (bez wody) poszerzające się ku ujściu, drogi o stałej szerokości.")
w("- `swiat_kratki.png`: rysunek techniczny. Mapy jako miniatury z prawdziwych kafli, nowe w pomarańczowych ramkach, droga, suche koryto rzeki, linia brzegu (zielona tam, gdzie leży na mapie), **czerwone pola = tu będzie morze (pusty teren)**, żółte = wybrzuszenie lądu wokół treści.")
w("- `swiat_kratki_podzial.png`: sam podział na mapy (puzzle): numery, rozmiary, krawędzie (zielone przejście, niebieskie morze, brązowa ściana, szare wspólne).")
w("- `swiat_zblizenia.png`: **zbliżenia trzech styków map z brzegiem**: obie mapy obok siebie, biała linia brzegu przechodzi przez krawędź w tej samej kratce i pod tym samym kątem.")
w("- `swiat.json`: dane do budowy (położenie map, odcinki krawędzi z sąsiadami, przejścia, suche koryto, brzeg na każdej krawędzi, treść w pasie morza, obecne wyjścia i ich los). `swiat_maska.png`: maska lądu świata (po wybrzuszeniach).")
w("")
w("## Jak działa świat w kratkach")
w("")
w("- Jedna siatka kratek: sylwetka kruka z Atlasu (`kruk_maska.png`), skala **0,70 kratki na piksel Atlasu** (zostaje: tak puzzle pasują, mniejsza skala wymusza nakładanie, większa zostawia puste brzegi), świat %d x %d kratek (sama sylwetka %d x %d). Kratka świata = kratka maski + przesunięcie (%d, %d)." % (J["rozmiar_swiata"][0], J["rozmiar_swiata"][1], round(1075 * K.S), round(635 * K.S), OFF[0], OFF[1]))
w("- Mapa to prostokątny **wycinek świata** (x0, y0, szer., wys.). Sąsiedzi dzielą krawędź co do kratki; przejście z kratki (X, Y) prowadzi do **tej samej kratki świata** w sąsiedniej mapie. Na jednej krawędzi może być kilku sąsiadów (odcinki). Krawędź bez sąsiada to morze albo ściana (klif, gęsty las, góry); wspólna krawędź bez drogi to też ściana.")
w("- **Brzeg z jednej maski**: sylwetkę wygładzono (łuki, zatoki, cyple, bez schodków), więc linia brzegu przechodzi przez granice map bez skoku. Linia brzegu leży na mapach w **%.1f%%**." % cov_proc)
w("- **Brzeg omija treść.** Za treść uznaję: budynki i ich ogrodzenia (`<Occupy>`), drzwi do wnętrz, zdarzenia z tagami wtyczek (`Town`, `Garnizon`, `Wyspa`, `Wrak`, `Latarnia`, `Studnia`, `Zagroda`), lampy, obozy, nory, studnie, krzyże, namioty, kuter, bramy, wozy, stragany, ule, gniazda itp. (nazwa). **Nie** liczę drzew, krzaków, kamieni, kłód i pni (zasoby; pod morzem zniknęłyby razem z lądem). Wokół treści z pasa morza ląd się wybrzusza (wypukła obwiednia, wygładzona): %d kratek lądu dołożone do sylwetki. Obecnych zdarzeń z treścią: %d, w pasie morza surowej sylwetki leżało %d, **w morzu po wybrzuszeniu: %d**." % (J["wybrzuszenia_wokol_tresci_kratek"], tresc_razem, tresc_pas, tresc_morze))
w("")
w("## Uproszczona sylwetka (gracz: kształt tylko z grubsza)")
w("")
w("Priorytet to połączenia i porządek, kruk ma być tylko z grubsza. Sylwetkę uproszczono (zamknięcie r=11 i otwarcie r=6 maski, potem łagodne wygładzenie): **usunięte** wąskie pióra i palce lądu (postrzępiony dół ogona pod Leśną drogą, palce pod prawym skrzydłem przy Łące#2), zatoczka wcięta w lewe skrzydło przy Łące#3 i inne wąskie wcięcia oraz cypelki; brzeg jest spokojny, z łagodnymi łukami, także na stykach map. **Zostało:** zatoka pod lewym skrzydłem z wejściem do basenu Przystani od zachodu, głowa z Orlą Granią, cypel z latarnią, wrak i wszystko, co ma treść (wokół treści brzeg wybrzusza się łagodnie). Mniej map: powiększam obecne mapy spoza listy gracza (w prawo i w dół) zamiast dokładać nowe: **nowych map było 13, jest %d**; mapy z samym lasem i brzegiem są tylko tam, gdzie brzeg nie dochodzi do żadnej obecnej mapy; bez mikro-map (najmniejsza 60 x 40)." % len(nowe))
w("")
w("## Najważniejsze liczby")
w("")
w("- Obecnych map plenerowych: %d. **Rosną: %d** (%s). **Nowych map: %d** (poprzednia wersja miała 13; rozmiary od 60 x 40, bez mikro-map)." % (len(isn), len(rosnace), ", ".join("%s +%d/+%d" % (nm(m), M[m]["rosnie"][0], M[m]["rosnie"][1]) for m in rosnace) if rosnace else "żadna", len(nowe)))
w("- **Morza do domalowania na obecnych mapach: %d kratek**, wszystko na pustym terenie (las, łąka, skały): zero zdarzeń z treścią. Zasoby (drzewa, kamienie), które znikną pod morzem, są wypisane przy każdej mapie." % suma_morza)
w("- **Droga z domu dziadka do miasta: %s** (%d mapy, czyli 2 pośrednie): Dom dziadka dotyka Kruczego Jaru od południa, Kruczy Jar Posiadłości Lorda od wschodu, a ta miasta." % (" -> ".join(str(m) for m in trasa), len(trasa)))
st_zostaje = sum(1 for s in stare if s["kod"] == "zostaje"); st_cel = sum(1 for s in stare if s["kod"] == "nowy_cel"); st_zam = sum(1 for s in stare if s["kod"] == "zamyka"); st_prz = sum(1 for s in stare if s["kod"] == "przesuniete")
w("- Obecnych wyjść między mapami plenerowymi: %d. **Zostaje w tej samej kratce: %d**, ta sama krawędź z nowym celem: %d, przesunięte: %d, zamyka się (morze lub ściana): %d." % (len(stare), st_zostaje, st_cel, st_prz, st_zam))
w("- **Sprawdzanie krawędzi** (`python tools/mapy/swiat_krawedzie.py`): %d wspólnych krawędzi, niezgodności drogi/rzeki: **%d**, największe przesunięcie przecięcia brzegu na granicy map: **%d kratek**, treść w morzu: **%d**." % (len(wiersze), zle_kr, skok_max, tresc_morze))
w("")
w("## Brzeg na wspólnych krawędziach")
w("")
w("Dla każdej wspólnej krawędzi, przez którą przechodzi brzeg: kratka świata, w której linia brzegu ją przecina (y dla krawędzi pionowej, x dla poziomej), przejście (ląd -> morze albo odwrotnie) i kierunek: kąt linii brzegu (0° = w prawo, 90° = w górę) z pola maski. Obie mapy czytają jedną maskę, więc przecięcie wypada w tej samej kratce i pod tym samym kątem (przesunięcie przecięcia między ostatnią kolumną jednej mapy a pierwszą drugiej: co najwyżej %d kratek, to nachylenie brzegu; kąty z lokalnych pomiarów obu stron są w `swiat.json`, pola `kat_a`, `kat_b`)." % skok_max)
w("")
w("| krawędź | strona A | odcinek (kratki świata) | brzeg przecina w kratce | przejście | kąt brzegu |")
w("|---|---|---|---|---|---|")
for e in bk:
    if not e["przeciecia"]: continue
    ax = "y" if e["strona"] == "E" else "x"
    for c in e["przeciecia"]:
        w("| %s <-> %s | %s | %s %d-%d | %s = %d | %s | %s° |" % (nm(e["a"]) if e["a"] < 900 else "N%d" % e["a"], nm(e["b"]) if e["b"] < 900 else "N%d" % e["b"], SD[e["strona"]], ax, e["od"], e["do"], ax, c["pos"], c["przejscie"].replace("lad", "ląd"), c["kat"]))
w("")
w("Pełne dane są w `swiat.json`, pole `brzeg_na_krawedziach`.")
w("")
w("## Mapy gracza: dokładna lista zmian (do Twojej zgody)")
w("")
w("Mapy gracza: 3, 4, 8, 13, 23, 24, 111. Kratki podaję lokalnie (w mapie, od lewego górnego rogu) i w świecie. **Morze jest tylko na pustym terenie**, zero zdarzeń z treścią.")
w("")
starep = {(s["od"], s["do"]) for s in stare if s["kod"] in ("zostaje", "przesuniete")}
starep |= {(b, a) for a, b in starep}
skip_src = {(s["od"], s["nowy_cel"]) for s in stare if s["kod"] == "nowy_cel"}
for m in (8, 24, 3, 4, 23, 13, 111):
    e = M[m]
    mz = e["morze_do_domalowania"]
    w("### %s" % nm(m))
    w("")
    w("- Świat: x0 = %d, y0 = %d, rozmiar %d x %d (%s). Rośnie: %s." % (e["x0"], e["y0"], e["szer"], e["wys"], czesc(m), "nie" if not any(e["rosnie"]) else ("**+%d kolumn wstawionych przed murem, od x 90** (wariant z jednym murem niżej)" % e["rosnie"][0] if m == 111 else "**+%d kolumn w prawo, +%d w dół** (nowa ziemia na zewnątrz, treść bez zmian)" % tuple(e["rosnie"]))))
    if mz["kratek"]:
        sk = skladowe_morza(m)
        w("- **Morze: %d kratek (%.1f%%)** na pustym terenie: %s." % (mz["kratek"], mz["proc"], "; ".join("%d kratek w prostokącie x %d-%d, y %d-%d" % c for c in sk)))
    else:
        w("- Morze: 0 kratek (cała mapa to ląd).")
    pas_t = e["tresc"]["w_pasie_surowej_sylwetki"]
    w("- Treść, która leżała w pasie morza surowej sylwetki: %s. Po wybrzuszeniu w morzu: 0." % (grupuj_zdarzenia(pas_t) if pas_t else "żadna"))
    zas = zasoby_w_morzu(m)
    if zas: w("- Zasoby pod morzem (drzewa, kamienie, kłody): %d, znikną." % zas)
    for s in stare:
        if s["od"] != m: continue
        cells = zakres(s["kratki_lokalne"] and [c[1] if s["strona"] in "EW" else c[0] for c in s["kratki_lokalne"]])
        os_ = "y" if s["strona"] in "EW" else "x"
        sw_ = zakres(s["kratki_swiata"])
        pre = "Krawędź %s, kratki %s %s (świat %s %s)" % (SD[s["strona"]], os_, cells, os_, sw_)
        if s["kod"] == "zostaje" and m == 111 and s["strona"] == "E": w("- %s: nadal do %s, **w tej samej kratce świata, ale na nowej krawędzi mapy (x 101 zamiast 91)**, patrz niżej." % (pre, nm(s["do"])))
        elif s["kod"] == "zostaje": w("- %s: **bez zmian**, nadal do %s." % (pre, nm(s["do"])))
        elif s["kod"] == "nowy_cel":
            nl = s.get("nowe_ladowanie_lokalne") or []
            ll = "; ".join("(%d,%d)" % tuple(c) for c in nl[:3])
            w("- %s: dziś do %s (lądowanie (%d,%d)); **po zmianie do %s**, lądowanie w tej samej kratce świata, lokalnie %s." % (pre, nm(s["do"]), s["ladowanie"][0], s["ladowanie"][1], nm(s["nowy_cel"]), ll))
        elif s["kod"] == "przesuniete": w("- %s: do %s, **lądowanie przesunięte** (%s)." % (pre, nm(s["do"]), s["wynik"]))
        else: w("- %s: dziś do %s; **znika** (%s)." % (pre, nm(s["do"]), s["wynik"].split("(")[1].rstrip(")")))
    for p in pas:
        if p.get("wspinaczka") or m not in (p["a"], p["b"]): continue
        o = p["b"] if p["a"] == m else p["a"]
        if o in M and not M[o]["nowa"] and (m, o) not in starep and (m, o) not in skip_src:
            side = p["strona"] if p["a"] == m else {"E": "W", "S": "N"}[p["strona"]]
            os_ = "y" if side in "EW" else "x"
            loc = p["pos"] - (e["y0"] if side in "EW" else e["x0"])
            w("- **NOWE wyjście**: krawędź %s, kratki %s %d-%d (świat %s %d-%d), do %s (%s)." % (SD[side], os_, loc - 1, loc + 1, os_, p["pos"] - 1, p["pos"] + 1, nm(o), p["droga"].split(" (")[0]))
    if m == 111:
        most = None
        pw = K.chaikin([K.W(p) for p in K.ROADS[[k for k in K.ROADS if k.startswith("Trakt zachodni")][0]]], 3)
        for part in K.KORYTO:
            kw = K.chaikin([K.W(p) for p in part], 3)
            for a_, b_ in zip(pw, pw[1:]):
                for u_, v_ in zip(kw, kw[1:]):
                    xx = O._przeciecie(a_, b_, u_, v_)
                    if xx and most is None: most = xx
        mx = (round(most[0]) - e["x0"]) if most else 99
        my = (round(most[1]) - e["y0"]) if most else 17
        w("- **Wariant z jednym murem: 10 kolumn wstawionych PRZED murem, od x 90 (nic nie zapisuję, tylko opis).** Mapa rośnie z 92 do 102 kolumn. Nowe kolumny x 90-99 (cała wysokość, 112 rzędów) to czysty grunt i **suche koryto (fosa) przed murem po stronie Podgrodzia**; pas muru i bramy, który dziś stoi na x 90-91, **przesuwa się o +10 na x 100-101, czyli na nowy wschodni brzeg**, i dalej styka się z murem Okolic Tawerny jak dziś. Wychodzi jeden mur z fosą przed nim, a brama stoi po właściwej stronie fosy.")
        w("- **Co dokładnie się przesuwa (+10 kolumn, tylko to):** kafle muru z x 90-91 we wszystkich rzędach; zdarzenia bramy zachodniej i muru: #19 Pochodnia na baszcie (90,13) -> (100,13); #90 Brama zachodnia: skrzydło i cień (90,18) -> (100,18); #91 Brama zachodnia: światło latarni (91,16) -> (101,16); #89 Brama zachodnia: dach i słupy (91,19) -> (101,19); przejścia #65 (91,17) -> (101,17) i #66 (91,18) -> (101,18), które w tej samej kratce świata (y %d-%d) prowadzą do Okolic Tawerny (8); oraz zasoby na x 90: Drzewo #111 (90,84) -> (100,84), Drzewo #254 (90,88) -> (100,88), Suchy krzaczek #290 (90,101) -> (100,101)." % (e["y0"] + 17, e["y0"] + 18))
        w("- **Zostaje na swoich miejscach (x 89 i mniej, placyk przed bramą):** #18 Latarnia przy bramie (88,19); #20 Posłanie żebraka (88,14); #67 Drogowskaz: Podgrodzie (86,15); #70 Miejsce: brama_zach (87,18); #71 Miejsce: zebrak (89,16); #72 Miejsce: zebrak_noc (89,14); #400 Miejsce: w5_lada (89,17); płot (ok. x 85) i wszystkie budynki, drzewa i zdarzenia o x < 90 (np. Beczki #316 (84,16)).")
        w("- **Fosa i most:** suche koryto leży w x 90-99 (6-8 kratek dna ze skarpami, 1-2 kolumny gruntu po bokach), przed murem po stronie Podgrodzia. **Most z placyku przed bramą (x 89) do bramy (x 100)**: kamienny, 10 kratek długości i 4 szerokości (lokalnie y 16-19), czyli na wysokości bramy. **Poniżej linii murów** (rzędy y 20-111) koryto biegnie dalej w tych samych kolumnach x 90-99 na południe, do dolnej krawędzi mapy i dalej do basenu Przystani. Wschodnie wyjście stoi więc na x 101 (kratki y 17-18, tak jak dziś, tylko 10 kolumn dalej).")
        w("- Poza tym nic w Map111 się nie rusza: te same budynki, ulice, płot, wnętrza i zadania. Gdyby wstawienie 10 kolumn było nie do przyjęcia, alternatywa: koryto w pasie x 86-89 (4 wolne kolumny między płotem a murem, tylko do y ok. 66, dalej budynki), czyli bez miejsca na mostek i fosę, więc nie polecam.")
    if m == 13:
        w("- **Szlak górski**: z północnej bramy miasta (8, krawędź północna, x 49-51 lokalnie) przez Góry do Orlej Grani: w 13 wchodzi południową krawędzią w kratce świata x ok. %d i wychodzi północną (do 175) w x ok. %d, wspólna krawędź 13 / 175 to droga (zamiast wspinaczki)." % (next((p["pos"] for p in pas if p["a"] == 13 and p["b"] == 8 or p["a"] == 8 and p["b"] == 13), 460), next((p["pos"] for p in pas if (p["a"], p["b"]) == (175, 13) or (p["a"], p["b"]) == (13, 175)), 452)))
    w("")
w("## Tabela map")
w("")
w("| mapa | część kruka | x0, y0 | rozmiar | rośnie | morze do domalowania | zasoby pod morzem | woda poza maską |")
w("|---|---|---|---|---|---|---|---|")
for m in K.OUTDOOR:
    e = M[m]
    mz = e["morze_do_domalowania"]; wz = e["woda_poza_maska"]
    ros = "nie" if not any(e["rosnie"]) else "+%d w prawo, +%d w dół" % tuple(e["rosnie"])
    w("| %s%s | %s | %d, %d | %d x %d | %s | %d kratek (%.1f%%) | %d | %d (%.1f%%) |" % (nm(m), " *" if m in PLAYER else "", czesc(m), e["x0"], e["y0"], e["szer"], e["wys"], ros, mz["kratek"], mz["proc"], zasoby_w_morzu(m), wz["kratek"], wz["proc"]))
w("")
w("`*` = mapa gracza. Woda poza maską to woda w mapie tam, gdzie świat ma ląd (staw, rzeczka z mapy): zostaje. Basen Przystani jest morzem z maski.")
w("")
w("## Co leży w pasie do zalania (treść), mapa po mapie")
w("")
w("Dla każdej obecnej mapy: ile kratek morza i jakie zdarzenia z treścią wypadły w pasie morza surowej sylwetki kruka. Wszystkie są **chronione wybrzuszeniem lądu**, w morzu po zmianie: **0**.")
w("")
for m in K.OUTDOOR:
    e = M[m]
    mz = e["morze_do_domalowania"]
    pas_t = e["tresc"]["w_pasie_surowej_sylwetki"]
    w("- **%s**: morze %d kratek (%.1f%%). W pasie: %s. W morzu po zmianie: %d." % (nm(m), mz["kratek"] + e["nowa_czesc_morza"], mz["proc"], grupuj_zdarzenia(pas_t) if pas_t else "nic z treścią", len(e["tresc"]["w_morzu_po_wybrzuszeniu"])))
w("")
w("## Pozostałe mapy: zmiany wyjść")
w("")
for m in K.OUTDOOR:
    if m in PLAYER: continue
    e = M[m]
    w("### %s" % nm(m))
    w("")
    w("- Położenie: x0 = %d, y0 = %d, %d x %d (%s), rośnie: %s." % (e["x0"], e["y0"], e["szer"], e["wys"], czesc(m), "nie" if not any(e["rosnie"]) else "+%d/+%d" % tuple(e["rosnie"])))
    for s in stare:
        if s["od"] != m: continue
        os_ = "y" if s["strona"] in "EW" else "x"
        pre = "krawędź %s, %s %s" % (SD[s["strona"]], os_, zakres(s["kratki_swiata"]))
        if s["kod"] == "zostaje": w("- %s: bez zmian, do %s." % (pre, nm(s["do"])))
        elif s["kod"] == "nowy_cel": w("- %s: cel z %s na %s." % (pre, nm(s["do"]), nm(s["nowy_cel"])))
        elif s["kod"] == "przesuniete": w("- %s: do %s, lądowanie przesunięte." % (pre, nm(s["do"])))
        else: w("- %s: znika (do %s)." % (pre, nm(s["do"])))
    for p in pas:
        if p.get("wspinaczka") or m not in (p["a"], p["b"]): continue
        o = p["b"] if p["a"] == m else p["a"]
        if o in M and not M[o]["nowa"] and (m, o) not in starep and (m, o) not in skip_src:
            w("- NOWE przejście do %s (kratka świata %d, %s)." % (nm(o), p["pos"], p["droga"].split(" (")[0]))
    w("")
w("## Nowe mapy")
w("")
w("Każda stoi przy brzegu, dotyka rodzica i innych sąsiadów całą wspólną krawędzią i ma ścieżkę z rodzicem (do każdego punktu brzegu da się dojść albo go zobaczyć). Brzeg wynika z maski. Bez zadań, bez treści w morzu.")
w("")
w("| nr | nazwa | rozmiar | x0, y0 | część kruka | co na niej | wejście z (rodzic) | sąsiedzi |")
w("|---|---|---|---|---|---|---|---|")
for m in nowe:
    e = M[m]
    sas_ = set()
    for sd in "NESW":
        for sg in e["krawedzie"][sd]:
            if sg["typ"] == "sasiad": sas_.add(sg["sasiad"])
    w("| %d | %s | %d x %d | %d, %d | %s | %s | %s | %s |" % (m, e["nazwa"], e["szer"], e["wys"], e["x0"], e["y0"], e["czesc"], e["opis"], nm(e["rodzic"]), ", ".join(str(x) for x in sorted(sas_))))
w("")
w("## Przystań pod miastem")
w("")
w("- **Przystań (125) leży bezpośrednio pod Okolicami Tawerny (8)**: 8 ma x0 = %d, y0 = %d (104 x 138), 125 ma x0 = %d, y0 = %d (112 x 80); wspólna krawędź to całe 104 kratki dolnej krawędzi miasta." % (M[8]["x0"], M[8]["y0"], M[125]["x0"], M[125]["y0"]))
w("- Południowa brama miasta (kratki świata x %d-%d na dolnej krawędzi 8, lokalnie 24-26) wchodzi do Przystani w tej samej kratce (lokalnie w 125 też x 24-26; dziś jej wyjście północne jest przy x 14-16, więc przesuwa się o 10 kratek; to mapa spoza listy gracza). Droga kończy się przy nabrzeżu (zdarzenie „Miejsce: nabrzeze”)." % (M[8]["x0"] + 24, M[8]["x0"] + 26))
w("- **Wpływ od lewej strony ogona, pod lewym skrzydłem.** Świat ma zatokę w kącie między lewym skrzydłem a ogonem (%d kratek morza wcięte w ląd): osłonięta, łagodnie zwężająca się ku basenowi; statki wpływają od zachodu i południowego zachodu, płyną wzdłuż lewego boku ogona i kończą w basenie Przystani. Skrzydło jest nad zatoką, ogon po jej prawej, kruk zostaje czytelny." % int(sw.basen.sum()))
w("- **Basen Map125 (zachodnia część mapy, lokalnie x 0-20) jest teraz morzem z maski**, nie żółtą „wodą poza maską”: woda kafelków, przez którą nie da się przejść, = morze świata; pomosty i nabrzeże zostają lądem. Mapy nie odbijamy. Morze do domalowania w 125: %d kratek (%.1f%%), na pustym terenie (zatoka wchodzi w dolny i zachodni pas mapy), treść w morzu: 0." % (M[125]["morze_do_domalowania"]["kratek"], M[125]["morze_do_domalowania"]["proc"]))
w("- **Dawna „Zatoka portowa” (902) na wschodzie znika**: wschodni brzeg ogona przy porcie to zwykły ląd (brzeg z maski). Leśna droga (21) stoi teraz pod Przystanią (x0 = %d, y0 = %d, %d x %d), droga z nabrzeża prowadzi do niej." % (M[21]["x0"], M[21]["y0"], M[21]["szer"], M[21]["wys"]))
w("- **Polna droga (22)** nie leży pod miastem: stoi na wschód od miasta (x0 = %d, y0 = %d, %d x %d), nad Posiadłością Lorda; łączy się z miastem (górna część wschodniej krawędzi) i z Osadą Milczących (na północ). To droga na pola." % (M[22]["x0"], M[22]["y0"], M[22]["szer"], M[22]["wys"]))
w("- Lewe skrzydło bez portu: Podgrodzie -> Garnizon -> Wrak (i drugi ciąg Góry -> Urwisko -> Pustelnia).")
w("")
w("## Suche koryto rzeki")
w("")
w("Decyzja gracza: ślad po rzece tak, ale **bez wody**. Wzdłuż całego biegu jest suche koryto: popękane błoto, kamienie i otoczaki, suche trzciny przy skarpach (na rysunku ciemna skarpa i jasne dno z otoczakami). Rzeka znika **pod wzgórzem zamkowym** (wlot, czarny łuk w Górach, kratka świata %s) i wypływa **suchym jarem (fosą) tuż przed murem Podgrodzia i miasta** (wylot, kratka świata %s), jak fosa; jar poszerza się od 3 do 7 kratek i kończy się **w basenie Przystani** (dawne ujście rzeki: port zbudowano w ujściu, a dolną część wypełnia dziś morze)." % (tuple(K.W(K.WLOT)), tuple(K.W(K.WYLOT))))
w("")
w("- Część A (Góry): kratki świata %s. Część B (jar za murem do basenu): kratki świata %s." % (" ".join("(%d,%d)" % tuple(map(round, p)) for p in J["suche_koryto"][0][::6]), " ".join("(%d,%d)" % tuple(map(round, p)) for p in J["suche_koryto"][1][::6])))
w("- Jar leży w **nowym pasie 10 kolumn wstawionych przed murem Podgrodzia** (Map111, lokalnie x 90-99; mur z bramą przesuwa się na x 100-101), więc **nie idzie po żadnym budynku, zadaniu ani miejscu**. Okolice Tawerny (8) bez zmian: zachodni mur miasta stoi na x 0-2, domy od x 4. Drogę z placyku do bramy Podgrodzia przecina **most** (kamienny, jeden); brama stoi po drugiej stronie fosy, za mostem. Szczegóły zmian w Map111: sekcja „Mapy gracza”.")
w("- Przebieg przez krawędzie map: %s." % "; ".join("%s <-> %s, %s %d" % (nm(r["a"]), nm(r["b"]), "y" if r["strona"] == "E" else "x", r["pos"]) for r in J["suche_koryto_przejscia"]))
w("- **Oceniony i odrzucony inny bieg:** (1) przez Okolice Tawerny ulicą: po budynkach i miejscach; (2) przez wąski pas między płotem a murem Podgrodzia bez powiększenia: tylko 4 wolne kolumny (x 86-89) i tylko do y ok. 66, dalej budynki; (3) na zachód od Podgrodzia: między Górami a Garnizonem nie ma map (puszcza), trasa 140 kratek przez treść Urwiska i Garnizonu, kończyłaby się daleko od basenu. Wariant „za murem” z 10 nowymi kolumnami w Map111 jest najkrótszy i ma zero zmian w istniejącej treści.")
w("")
w("## Dom dziadka, Kruczy Jar i Lord")
w("")
w("- **Dom dziadka (20) dotyka Kruczego Jaru (3) od południa**: wychodzisz z podwórza i jesteś na swoim polu (wyjście południowe 3 w kratkach x 8-10 lokalnie wchodzi do 20). Dom dziadka rośnie o 20 kratek w prawo, żeby objąć całą dolną krawędź pola.")
w("- **Posiadłość Lorda (24) dotyka pola od zachodu** (wyjście zachodnie 3 do 24), więc Lord zabiera pole za długi tuż obok.")
w("- Trasa do miasta: %s." % " -> ".join(nm(m) for m in trasa))
w("")
w("## Szlak górski")
w("")
w("Z północnej bramy miasta (8) w górę do Gór (13) i dalej na Orlą Grań (175): droga w kratkach świata %s. Przecina wspólną krawędź 8 / 13 w x ok. 460 i 13 / 175 w x ok. 452 (lokalnie w 13: x 49-51 i x 52-54 od lewej)." % (", ".join("(%d,%d)" % K.W(p) for p in K.ROADS["Szlak górski (północna brama miasta -> Góry -> Orla Grań)"][::2])))
w("")
w("## Jakość (zasady rysunku)")
w("")
w("- Brzeg: gładka krzywa z maski (łuki, zatoki, cyple), bez prostych odcinków i schodków; wybrzuszenia wokół treści to wypukłe, zaokrąglone cyple.")
w("- Drogi: stała szerokość 3 kratek, łagodne zakręty (wygładzone łamane), prowadzą do celów. Rzeka: gładka, 2-7 kratek.")
w("- Podział: mapy dotykają się krawędziami bez szczelin; nowe mapy mają co najmniej 60 x 40 i krawędzie wyrównane do sąsiadów, gdzie się dało. Środek lewego skrzydła bez map zostaje jako nieprzechodnia puszcza i skały otoczona mapami, daleko od brzegu.")
w("")
w("## Etapy budowy")
w("")
w("Po każdym etapie `python tools/mapy/swiat_krawedzie.py` sprawdza każdą wspólną krawędź kratka po kratce: woda, ląd, droga, suche koryto, klif/ściana, brzeg (kratka przecięcia i kąt z obu stron), treść w morzu, spójność przejść. Etap uznajemy za gotowy dopiero przy `WYNIK: OK`.")
w("")
w("1. **Tułów**: miasto (8), Przystań pod nim (125) z basenem otwartym na zatokę pod lewym skrzydłem, ogon (Leśna droga 21 i nowe mapy pod ogonem), suche koryto (Góry -> jar za murem -> basen), szlak górski (8 -> 13 -> 175).")
w("2. **Prawe skrzydło**: Kruczy Jar (3), Łąka#1 (4), Skraj lasu (23), Dom dziadka (20), Posiadłość Lorda (24), Polna droga (22), Osada (120), Latarnia (159), Spalona zagroda (168), Łąka#2 (17) i nowe mapy brzegowe.")
w("3. **Lewe skrzydło i głowa**: Podgrodzie (111), Garnizon (162), Wrak (165), Łąka#3 (18), Urwisko (157), Pustelnia (155), Góry (13), Orla Grań (175) i nowe mapy brzegowe.")
w("4. **Mapa w menu P z tego samego świata**: `MapaWyspy_Data.js` czyta `swiat.json` (BRZEG z maski, położenia z x0, y0, szer., wys., drogi i suche koryto z `drogi`, `suche_koryto`).")
w("")
w("## Pytania do gracza")
w("")
w("1. Czy kształt wyspy po wybrzuszeniach i z zatoką pod lewym skrzydłem wokół treści (`swiat_podglad.png`) jest dla Ciebie nadal rozpoznawalnym krukiem? Skrzydła są pełniejsze, bo osady i latarnia musiały zostać na lądzie. Jeśli kruk ma być szczuplejszy, trzeba przenieść treść tych map w głąb, a nie dokładać lądu.")
w("2. Czy lista zmian na mapach gracza (3, 4, 8, 13, 23, 24, 111) jest do przyjęcia? Najwięcej na 13 (cele i miejsce wyjść) i 111 (morze po lewej i u dołu, wyjście zachodnie do Garnizonu).")
w("3. **Suche koryto za zachodnim murem**: zgoda na powiększenie Map111 (Podgrodzie, mapa gracza) o 10 kolumn w prawo za murem i przesunięcie jej wschodniego wyjścia z x 91 na x 101 (most nad korytem)? Alternatywy w sekcji o korycie.")
w("4. Środek lewego skrzydła (puszcza i skały bez map) zostaje bez zmian?")
open(os.path.join(ROOT, "docs", "mapy", "SWIAT.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
print("zapisano SWIAT.md", len(L), "linii")
