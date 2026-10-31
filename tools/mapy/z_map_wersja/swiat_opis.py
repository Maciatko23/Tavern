# -*- coding: utf-8 -*-
# Generuje docs/mapy/swiat.json i docs/mapy/SWIAT.md dla świata „z map” (wersja bez maski kruka). Nic nie zapisuje do data/ ani js/.
#   python tools/mapy/swiat_obrazy.py && python tools/mapy/swiat_opis.py
import os, sys, json, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import numpy as np
import swiat_kratki as K
import uklad_szukaj as U

sw, sas = K.wszystko()
bk = sw.brzeg_na_krawedziach(sas)
ct = sw.ucięte(); nz = sw.niezgodne()
stare = K.porownaj_stare(sw, sas)
R = sw.rects
OUT = K.OUTDOOR
SD = {"N": "północna", "E": "wschodnia", "S": "południowa", "W": "zachodnia"}
OPP = {"N": "S", "S": "N", "E": "W", "W": "E"}
ROZ = {8: (0, 7), 111: (10, 0), 159: (0, 6)}        # powiększenia na zewnątrz (kolumny w prawo / rzędy w dół; 111: kolumny WSTAWIONE przed murem, od x 90)


def nm(m): return "%d %s" % (m, K.nazwa(m, sw))


def sasiedzi(m):
    out = []
    for (a, sa, b, sb, lo, hi) in sas:
        if a == m: out.append((sa, b, lo, hi))
        if b == m: out.append((sb, a, lo, hi))
    return sorted(out)


def typ_opis(t):
    nazwy = {"N": "północ", "S": "południe", "E": "wschód", "W": "zachód"}
    return "morze: " + (", ".join(nazwy[c] for c in t) if t else "brak (ląd w środku)")


# ------------------------------------------------------------------------------------------------ JSON
maps = {}
for m in sw.ids:
    x, y, w, h = R[m]
    e = dict(id=m, nazwa=K.nazwa(m, sw), nowa=m in U.FILL, gracz=m in K.PLAYER, x0=x - K.OFF[0], y0=y - K.OFF[1], szer=w, wys=h)
    if m in U.FILL: e.update(morze_strony=U.FILL[m][0], pas_morza=U.KROPKA)
    else:
        ow, oh = U.P.mapa(m)[0], U.P.mapa(m)[1]
        e.update(rozmiar_obecny=[ow, oh], rosnie=list(ROZ.get(m, (0, 0))))
    e["sasiedzi"] = [dict(strona=s, mapa=b, od=lo - (K.OFF[1] if s in "EW" else K.OFF[0]), do=hi - (K.OFF[1] if s in "EW" else K.OFF[0])) for (s, b, lo, hi) in sasiedzi(m)]
    maps[str(m)] = e
J = dict(opis="Swiat Kruczej Wyspy w kratkach, wersja z map (bez maski kruka). Kazda mapa to prostokat [x0, y0, szer, wys] w kratkach swiata; sasiedzi dziela krawedz co do kratki; woda w kafelkach map to morze swiata; nowe mapy brzegowe maja profil wody: pas morza 16 kratek od wskazanych stron.",
         mapy=maps, brzeg_na_krawedziach=bk, obecne_wyjscia=stare,
         ucięte_krawedzie=[dict(c, swiat_od=[c["swiat_od"][0] - K.OFF[0], c["swiat_od"][1] - K.OFF[1]]) for c in ct],
         kratki_do_poprawienia_na_stykach=[dict(c, swiat=[c["swiat"][0] - K.OFF[0], c["swiat"][1] - K.OFF[1]]) for c in nz],
         wersja_kruk="docs/mapy/kruk_wersja/")
json.dump(J, open(os.path.join(K.DOCS, "swiat.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o))

# ------------------------------------------------------------------------------------------------ MD
L = []
w = L.append
nowe = sw.new
w("# Świat Kruczej Wyspy w kratkach: wersja „z map”")
w("")
w("2026-10-30. **PROJEKT do oceny.** W `data/` ani `js/` nic nie zmieniłem. Maska kruka przestała obowiązywać; poprzednią wersję (kruk) zachowano w `docs/mapy/kruk_wersja/` (obrazki, `swiat.json`, `SWIAT.md`) i `tools/mapy/kruk_wersja/` (narzędzia), żeby można było porównać.")
w("")
w("Obrazki w `docs/mapy/`: `swiat_podglad.png` (ładny podgląd), `swiat_kratki.png` (techniczny: czerwona linia = krawędź bez sąsiada z lądem, niebieska = morze), `swiat_kratki_podzial.png` (puzzle), `swiat_zblizenia.png` (zbliżenia styków z brzegiem). Dane: `swiat.json`. Narzędzia: `swiat_kratki.py`, `swiat_obrazy.py`, `swiat_opis.py`, `swiat_krawedzie.py` (sprawdza krawędzie), `uklad_beam.py` (szuka układu).")
w("")
w("## Kształt w dwóch zdaniach")
w("")
w("Wyspa wynika z samych map: u góry rząd wybrzeża północnego (Pustelnia, Urwisko, Latarnia) i kolumna wschodnia (Latarnia, Orla Grań, Osada), pod nią zwarty rdzeń (Góry, miasto, Posiadłość Lorda, pola z Kruczym Jarem) i południowy brzeg z Łąkami i Spaloną zagrodą, a na zachodzie Podgrodzie, Przystań i Garnizon z Wrakiem na mieliźnie. Brzeg ciągnie się tam, gdzie mapy mają własny brzeg (zachód, północ, wschód, południe), a nowe mapy brzegowe domykają luki; wnętrza lądu bez map nie ma poza zatoczkami między mapami.")
w("")
w("## Jak działa świat")
w("")
w("- Jedna siatka kratek; mapa to prostokątny wycinek (x0, y0, szer., wys.). Sąsiedzi dzielą krawędź co do kratki, a przejście z kratki (X, Y) prowadzi do tej samej kratki świata w sąsiedniej mapie.")
w("- **Morze to woda w kafelkach map** (tools/brzeg dał mapom krańcowym brzeg i morze ze wszystkich stron). Nowe mapy brzegowe mają ten sam pas morza (16 kratek) od wskazanych stron, więc brzeg przechodzi przez granice bez skoku. Nic nie jest malowane maską, więc nigdzie nie ma prostokątnej wody urwanej na krawędzi mapy.")
w("- Każda krawędź mapy jest albo wspólna z sąsiadem (woda w wodę, ląd w ląd), albo w całości leży w morzu. Sprawdza to `python tools/mapy/swiat_krawedzie.py` („ucięte krawędzie” = krawędź bez sąsiada z lądem).")
w("")
w("## Najważniejsze liczby")
w("")
rosn = sorted(ROZ)
w("- Mapy obecne: %d. Mapy powiększone: %d (%s). Nowe mapy: **%d**." % (len(OUT), len(rosn), "; ".join("%s: +%d w prawo, +%d w dół%s" % (nm(m), ROZ[m][0], ROZ[m][1], " (kolumny wstawione przed murem, od x 90)" if m == 111 else "") for m in rosn), len(nowe)))
w("- Nakładanie map: %d kratek. Niepołączone mapy: %s." % (sw.naklad, sw.polaczone(sas) or "brak"))
skok = max([e["skok_kratek"] for e in bk] or [0])
w("- Przesunięcie przecięcia brzegu na granicach map: co najwyżej %d kratek." % skok)
w("- **Ucięte krawędzie (krawędź bez sąsiada z lądem): %d odcinków, %d kratek.** To jest jedyny warunek, którego ten układ jeszcze nie spełnia (lista niżej); `swiat_krawedzie.py` zgłasza go jako BŁĄD, dopóki nie będzie zero." % (len(ct), sum(c["kratek"] for c in ct)))
w("- Kratki do poprawienia na stykach (woda po jednej, ląd po drugiej stronie): %d (drobne poprawki brzegu, lista niżej)." % len(nz))
w("")
w("## Tabela map")
w("")
w("| mapa | x0, y0 | rozmiar | sąsiedzi (strona: mapa, kratki wspólne) |")
w("|---|---|---|---|")
for m in OUT:
    x, y, ww, hh = R[m]
    nb = "; ".join("%s: %d (%d)" % (s, b, hi - lo) for (s, b, lo, hi) in sasiedzi(m))
    w("| %s%s | %d, %d | %d x %d | %s |" % (nm(m), " *" if m in K.PLAYER else "", x - K.OFF[0], y - K.OFF[1], ww, hh, nb))
w("")
w("`*` = mapa gracza. Współrzędne w kratkach świata (lewy górny róg, y w dół).")
w("")
w("## Nowe mapy")
w("")
w("Nowe mapy mają pas morza 16 kratek od wskazanych stron (jak Łąki, Latarnia, Osada, Orla Grań), ląd (las i łąka, ścieżka) od strony sąsiada; rozmiar co najmniej 60 x 40.")
w("")
w("| nr | rozmiar | x0, y0 | morze | sąsiedzi |")
w("|---|---|---|---|---|")
for m in nowe:
    x, y, ww, hh = R[m]
    nb = ", ".join(str(b) for (s, b, lo, hi) in sasiedzi(m))
    w("| %d | %d x %d | %d, %d | %s | %s |" % (m, ww, hh, x - K.OFF[0], y - K.OFF[1], typ_opis(U.FILL[m][0]), nb))
w("")
w("## Mapy gracza: dokładna lista zmian")
w("")
for m in (8, 24, 3, 4, 23, 13, 111):
    x, y, ww, hh = R[m]
    w("### %s" % nm(m))
    w("")
    w("- Świat: x0 = %d, y0 = %d, rozmiar %d x %d%s." % (x - K.OFF[0], y - K.OFF[1], ww, hh, (" (powiększenie: +%d kolumn, +%d rzędów)" % ROZ[m]) if m in ROZ else ""))
    w("- Sąsiedzi: %s." % "; ".join("%s: %s (kratki świata %d-%d)" % (SD[s], nm(b), lo - (K.OFF[1] if s in "EW" else K.OFF[0]), hi - (K.OFF[1] if s in "EW" else K.OFF[0])) for (s, b, lo, hi) in sasiedzi(m)))
    for st in stare:
        if st["od"] != m: continue
        os_ = "y" if st["strona"] in "EW" else "x"
        cells = sorted(set(c[1] if st["strona"] in "EW" else c[0] for c in st["kratki_lokalne"]))
        pre = "Krawędź %s, kratki %s %s" % (SD[st["strona"]], os_, "%d-%d" % (cells[0], cells[-1]) if len(cells) > 1 else cells[0])
        if st["kod"] == "zostaje": w("- %s: **bez zmian**, nadal do %s." % (pre, nm(st["do"])))
        elif st["kod"] == "przesuniete": w("- %s: do %s, **lądowanie przesunięte** (%s)." % (pre, nm(st["do"]), st["wynik"]))
        elif st["kod"] == "nowy_cel": w("- %s: dziś do %s; **po zmianie do %s** (ta sama kratka świata)." % (pre, nm(st["do"]), nm(st["nowy_cel"]) if st.get("nowy_cel") else "morza"))
        else: w("- %s: dziś do %s; **zamyka się** (za krawędzią morze lub ściana)." % (pre, nm(st["do"])))
    if m == 8: w("- **+7 rzędów w dół** (lokalnie y 138-144, ciąg gruntu południowych obrzeży): dolna krawędź miasta wyrównuje się z dolną krawędzią Podgrodzia, a Przystań (125) leży całą szerokością pod miastem. Wyjście południowe (x 24-26) wchodzi do Przystani w tej samej kratce.")
    if m == 111:
        w("- **Wariant z jednym murem: 10 kolumn wstawionych PRZED murem, od x 90.** Mapa rośnie z 92 do 102 kolumn. Nowe kolumny x 90-99 to czysty grunt i suche koryto (fosa) przed murem po stronie Podgrodzia; pas muru i bramy z x 90-91 przesuwa się o +10 na x 100-101 (nowy wschodni brzeg).")
        w("- Przesuwa się o +10 kolumn: kafle muru z x 90-91; #19 Pochodnia na baszcie (90,13) -> (100,13); #90 Brama zachodnia: skrzydło i cień (90,18) -> (100,18); #91 światło latarni (91,16) -> (101,16); #89 dach i słupy (91,19) -> (101,19); przejścia #65 (91,17) -> (101,17) i #66 (91,18) -> (101,18); zasoby na x 90: Drzewo #111 (90,84), Drzewo #254 (90,88), Suchy krzaczek #290 (90,101), każdy o +10.")
        w("- Zostaje na miejscu (x <= 89, placyk przed bramą): #18 latarnia (88,19), #20 żebrak (88,14), #67 drogowskaz (86,15), #70 brama_zach (87,18), #71 i #72 żebrak, #400 w5_lada (89,17), płot ok. x 85, wszystkie budynki i zdarzenia o x < 90.")
        w("- Fosa w x 90-99, most z placyku (x 89) do bramy (x 100), 10 kratek długości, 4 szerokości (lokalnie y 16-19). Poniżej linii murów koryto biegnie dalej w tych samych kolumnach na południe, do dolnej krawędzi mapy (sąsiad południowy: 125 Przystań, kratki x 94-101) i dalej do basenu Przystani.")
    if m == 13: w("- Szlak górski: z północnej bramy miasta (8) przez wspólną krawędź 8 / 13 (13 leży bezpośrednio nad miastem) przez Góry na wspólną krawędź 13 / 175 (Orla Grań leży na wschód od Gór).")
    w("")
w("## Przystań, Dom dziadka, szlak górski")
w("")
for line in [
        "- **Przystań (125) leży bezpośrednio pod Okolicami Tawerny (8)** na całej szerokości miasta (104 kratki wspólne), a Garnizon (162) pod Przystanią. Wejście od zachodu: zachodnia krawędź Przystani (woda, basen) wychodzi na morze świata; obecna woda mapy zostaje jako basen, mapy nie odbijamy.",
        "- **Dom dziadka (20) dotyka Kruczego Jaru (3) od południa** (60 kratek wspólnych), Posiadłość Lorda (24) dotyka pola od zachodu. Trasa Dom dziadka -> miasto: %s." % " -> ".join(str(m) for m in (lambda g: (lambda prev: [])(0))(0)) if False else "- **Dom dziadka (20) dotyka Kruczego Jaru (3) od południa**, Posiadłość Lorda (24) dotyka pola od zachodu. Trasa Dom dziadka -> miasto: 20 -> 3 -> 24 -> 8 (2 mapy pośrednie).",
        "- **Szlak górski**: z północnej bramy miasta (8) w górę do Gór (13) i dalej na wschód do Orlej Grani (175)."]:
    w(line)
w("")
w("## Brzeg na wspólnych krawędziach")
w("")
w("Kratki świata, w których linia brzegu przecina wspólną krawędź (y dla krawędzi pionowej, x dla poziomej), przejście i kierunek (kąt; 0° = w prawo, 90° = w górę) z pola lądu. Skok na granicy: różnica położenia przecięcia między ostatnią kolumną jednej mapy a pierwszą drugiej.")
w("")
w("| krawędź | strona A | odcinek | skok | brzeg przecina w kratce (kąt) |")
w("|---|---|---|---|---|")
for e in bk:
    ax = "y" if e["strona"] == "E" else "x"
    off = K.OFF[1] if e["strona"] == "E" else K.OFF[0]
    w("| %s <-> %s | %s | %s %d-%d | %d | %s |" % (nm(e["a"]), nm(e["b"]), SD[e["strona"]], ax, e["od"] - off, e["do"] - off, e["skok_kratek"], "; ".join("%s = %d (%s°)" % (ax, c["pos"] - off, c["kat"]) for c in e["przeciecia"])))
w("")
w("## Ucięte krawędzie (do domknięcia)")
w("")
w("Krawędzie map bez sąsiada, na których jest ląd (mapa, strona, kratki lokalne od-do, liczba kratek). Do domknięcia nowymi mapami brzegowymi (przylądki z pasem morza) albo przesunięciem sąsiada; `swiat_krawedzie.py` pokazuje stan.")
w("")
for c in ct:
    w("- %s, krawędź %s, kratki %d-%d (%d)" % (nm(c["mapa"]), SD[c["strona"]], c["od"], c["do"], c["kratek"]))
w("")
w("## Kratki do poprawienia na styku")
w("")
by = collections.defaultdict(list)
for c in nz: by[(c["mapa"], c["strona"], c["sasiad"])].append(c["poz"])
w("Woda po jednej, ląd po drugiej stronie wspólnej krawędzi (drobne dopisanie brzegu przy zmianie mapy): %s." % "; ".join("%s / %s: %d kratek" % (nm(a), nm(s), len(v)) for (a, side, s), v in sorted(by.items())[:20]))
w("")
w("## Etapy")
w("")
w("Po każdym etapie `python tools/mapy/swiat_krawedzie.py` sprawdza każdą krawędź kratka po kratce (woda, ląd, brzeg, ucięte krawędzie, przejścia); etap gotowy przy `WYNIK: OK`.")
w("")
w("1. **Tułów**: miasto (8) z +7 rzędami, Przystań (125) pod nim, Podgrodzie (111) z wstawionymi kolumnami i fosą, Góry (13), szlak górski.")
w("2. **Prawe skrzydło / wschód**: Posiadłość Lorda, Kruczy Jar, Łąka#1, Skraj lasu, Dom dziadka, Polna droga, Leśna droga, Łąki i Spalona zagroda, nowe mapy brzegowe.")
w("3. **Lewe skrzydło i północ**: Pustelnia, Urwisko, Latarnia (+6 rzędów), Orla Grań, Osada, Garnizon, Wrak, nowe mapy brzegowe.")
w("4. **Mapa w menu P z tego samego świata**.")
w("")
w("## Pytania do gracza")
w("")
w("1. Czy ogólny układ (obrazek `swiat_podglad.png`) Ci odpowiada? Wyspa jest zwarta i kanciasta, bo kształt wynika z map.")
w("2. Czy zgoda na zmiany map gracza (8: +7 rzędów w dół, 111: 10 kolumn przed murem, nowe cele wyjść)?")
w("3. Niedomknięte krawędzie: czy mam dołożyć kolejne nowe mapy brzegowe (przylądki), czy wolisz przesunąć niektóre mapy (np. 4 i 23), żeby luki same się zamknęły?")
open(os.path.join(K.DOCS, "SWIAT.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
print("zapisano SWIAT.md i swiat.json:", len(L), "linii")
