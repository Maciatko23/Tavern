# Walka i rozwój postaci — dokument projektowy

Ustalone z autorem 2026-09-24. Walka **taktyczna i ciężka**, na żywo na mapie (swobodny ruch w 8 kierunkach),
zbudowana na tym, co już jest: wytrzymałość, życie, rany i opatrunki, głód i pragnienie, skradanie (C),
łuk i proca (celowanie), włócznia i dzik (Hunting.js).

## 1. Oddech — waluta walki

- W walce pod paskiem wytrzymałości pojawia się krótki pasek **oddechu**. Każdy cios, przewrót i blok go
  zużywa; wraca w 2–3 s, gdy przestajesz działać.
- Pusty oddech = **zadyszka**: wolniejszy ruch, brak przewrotu.
- Zmęczenie (dzienna wytrzymałość), głód, pragnienie i rana **skracają** pasek oddechu.
- Walka nie zjada dziennej wytrzymałości na pracę; życie zabierają tylko trafienia.

## 2. Ruchy gracza

| Klawisz | Ruch |
|---|---|
| O (stuknięcie) | cios; 2–3 w rytmie = kombo, ostatni odrzuca |
| O (przytrzymanie) | ciężki cios: ładowanie, przebija blok, mocno zbija równowagę |
| Spacja | przewrót w 8 kierunkach z chwilą nietykalności (Spacja przestaje być „OK” na mapie; OK = O / Enter) |
| P (przytrzymanie) | blok tarczą (mniej obrażeń, kosztuje oddech) |
| P tuż przed trafieniem | parowanie: wróg traci równowagę, można go dobić |
| [ / ] | poprzednia / następna broń w ręku |
| Tab | tryb walki / tryb normalny (klawisze ustalone z autorem: tylko w trybie walki O = atak, P = obrona, [ ] = broń) |
| C + cios | atak z ukrycia na nieświadomego wroga: podwójne obrażenia |
| łuk / proca | jak teraz (celowanie kółkiem) |

Każda broń walczy inaczej: pałka szybka i słaba, siekiera wolna z szerokim zamachem, włócznia daleka
(pchnięcia), miecz z kuźni zrównoważony. Broń się zużywa (Durability.js).

## 3. Trafienie ma wagę

- Stop-klatka przy uderzeniu, odrzut, biały błysk trafionego, iskry / krew, wstrząs ekranu przy ciężkim ciosie,
  dźwięk zależny od broni.
- **Równowaga** (pasek obok życia wroga): ciosy ją zbijają, pusta = zatacza się i jest odsłonięty.
  Gracz też może zostać przewrócony (np. łapa niedźwiedzia).

## 4. Przeciwnicy — czytelne zamiary

Każdy atak: **zamach** (poza, „!”, błysk) → **uderzenie** → **odsłonięcie**. Czytasz zamach, robisz unik albo
parujesz, karzesz w odsłonięciu.

- **Zwierzęta**: wilki (wataha 3–4, nocą; krążą, jeden atakuje, reszta zachodzi z boku; bez przewodnika
  uciekają), dzik (szarża — przeniesiony do nowego systemu), niedźwiedź (wolny, dużo równowagi, cios łapą
  i przygniecenie — **nie do sparowania**, tylko unik).
- **Ludzie**: bandyta z pałką (blokuje, markuje), łucznik (trzyma dystans, ucieka), najemnik z tarczą
  (sam paruje: trzeba ciężkiego ciosu albo zajść od tyłu). Przy małym życiu mogą się **poddać** — oszczędzić
  czy nie (wątek frakcji Gruma).
- **Stwory z ruin (Akt II)**: pusta zbroja strażnika (tylko ciężki cios / w plecy), upiór prawdy (widoczny i
  trafialny tylko, gdy „pokazuje prawdę”; atakuje Hart ducha).

## 5. Atrybuty (gracz, ludzie i stwory)

| Atrybut | Wpływa na |
|---|---|
| Siła | obrażenia wręcz, zbijanie równowagi, udźwig |
| Zręczność | szybkość ciosów i kombo, koszt/długość przewrotu, celność łuku i procy |
| Kondycja | życie, długość oddechu, odporność na rany i przewrócenie |
| Czujność | skradanie, dłuższe okno parowania, trafienia krytyczne |
| Hart ducha | odporność na strach i „prawdy” z Serca (stwory z ruin biją też w umysł) |

Start: po 5 w każdym, najwyżej 60 (od 2026-09-24; wcześniej 25). Efekt jednego punktu jest mały (np. Siła +3,5% obrażeń,
Kondycja +5 życia), więc szczyt jest mocny, ale nie absurdalny.

## 6. Poziomy, doświadczenie, punkty

- **Doświadczenie**: walka (więcej za silniejszego wroga) + cele z dziennika + odkrycia fabularne +
  pierwsze zrobienie czegoś nowego. Wartości (ustalone z autorem 2026-09-24): zając 5, jeleń 10, wilk 15,
  dzik 20 (+20% za każdy poziom zwierzęcia ponad 1; o 3 poziomy słabsze od bohatera 60%, o 5 — 25%); cel z
  dziennika 50; pierwsze wejście na nową mapę 50; odkrycie fabularne 40; pierwszy raz zdobyty przedmiot 5,
  narzędzie / broń / przedmiot kluczowy 5; pierwszy budynek danego rodzaju 5. Ptaki nie dają doświadczenia.
- **Poziom najwyżej 100** (ustalone 2026-09-24): zwykłe przejście gry kończy się ok. 60–70, setka to wyzwanie
  końcowe (ok. 3 razy więcej doświadczenia). Na poziom **3 punkty atrybutów + 1 punkt umiejętności**.
  Doświadczenie do następnego poziomu: 60 + 9 × poziom^1,5 (1→2: 69, 30→31: 1539, 99→100: 8926).
  Nie da się mieć wszystkiego — 99 punktów na 187 stopni umiejętności: wybiera się styl postaci.
- Awans: komunikat i dźwięk; w HUD cienki pasek doświadczenia.

## 7. Umiejętności — drzewka dziedzin (od 2026-09-24)

Dziesięć osobnych drzewek (Skills_Data.js), każde na własnej stronie ekranu Postaci (Q / E): **Walka wręcz,
Obrona, Strzelectwo, Przetrwanie, Zbieractwo, Łowiectwo, Rolnictwo, Rzemiosło, Budownictwo, Kuchnia** —
razem 97 umiejętności i 187 stopni. Umiejętność otwiera drogę do tych pod nią (wystarczy jedna z dróg), wiele
ma kilka stopni (każdy stopień to punkt). Rzędy wymagają poziomu postaci: 1, 4, 10, 20, 32, 48; część
umiejętności ma też progi atrybutów (np. Szeroki zamach — Siła 20).

Umiejętności działają prawie na wszystko: obrażenia, krytyki, blok, oddech, życie, przewrót; celowanie, strzały,
pociski; koszt wytrzymałości każdej pracy, głód, pragnienie, zimno, sen, leczenie, udźwig; liczba uderzeń przy
drzewach i skałach, dodatkowe sztuki z drzew, skał i zbiorów z ziemi, ruda ze zwykłych skał; skradanie, mięso,
skóry, ścięgna, sidła, ryby, pióra; wzrost roślin, plony, nasiona, konewka, podlewanie, zwierzęta gospodarskie,
naloty ptaków; czas pracy warsztatów i pieców, zwrot materiałów, podwójny wyrób, zużycie narzędzi, naprawy,
ceny w sklepie; uderzenia na placu budowy, koszt uderzenia, zwrot przy rozbiórce; wartość jedzenia, premie,
psucie się zapasów, ogień, pieczenie. Inne wtyczki pytają Combat.perk(klucz).

Umiejętności etapu 1 (Płynne kombo, Rozpęd, Kontra, Szeroki zamach, Dobicie, Twarda garda, Czujne oko, Akrobata,
Gruba skóra, Drugi oddech) są w drzewkach Walki wręcz i Obrony pod tymi samymi nazwami.

## 8. Przeciwnicy mają poziom i atrybuty

- Każdy typ ma własny rozkład (bandyta zwinny i słaby, najemnik silny i odporny, zbroja: ogromna Kondycja,
  zero Zręczności).
- Siła wrogów zależy od **miejsca**, nie od poziomu gracza — wtedy czuć, że się rośnie.
- Przy pasku życia wroga poziom w kolorze: szary (dużo słabszy), biały (podobny), pomarańczowy (silniejszy),
  czerwona czaszka (uciekaj).

## 9. Ekran postaci

Nowa zakładka **Postać** w menu P: atrybuty z „+”, drzewka umiejętności, poziom, doświadczenie i wyliczone
wartości (obrażenia, życie, oddech, udźwig).

## 10. Wyposażenie

Pałka (w ręku), miecz i topór bojowy (kuźnia), tarcza drewniana (warsztat) i okuta (kuźnia), skórzana
kurtka (garbarnia) — mniej obrażeń. Rany i opatrunki jak teraz.

## 11. Etapy

1. **Rdzeń + rozwój + wilki**: oddech, kombo, ciężki cios, przewrót, blok/parowanie, odczucie trafienia,
   życie i równowaga wrogów, atrybuty, poziomy i doświadczenie, ekran Postaci, drzewka walki wręcz i obrony,
   pałka i tarcza, dzik w nowym systemie, wataha wilków, przywoływanie wrogów w F9.
   *Zrobione (2026-09-24):* całość. Pałka: przedmiot 156, warsztat (drewno + len), własny szybki zamach
   (Swing_Club, 22 klatki), 13 obrażeń, 10 oddechu. Tarcza drewniana: przedmiot 155, warsztat (2 drewna,
   2 gałęzie, 2 liny), zużywa się od przyjętych ciosów. Przewrót i upadek mają własne animacje (Swing_Roll,
   szybkie Swing_LieDown), po czystym trafieniu bohater odchyla się od ciosu, ogłuszony wróg chwieje się pod
   gwiazdkami. Ekran Postaci: menu P → Postać; w prawym dolnym rogu pasek poziomu i doświadczenia (żółte „P”,
   gdy są punkty do rozdania). Dzik z bliska (5 pól) szarżuje w prostej linii; gdy chybi, przebiega ok. 3,5
   pola dalej i stoi zziajany ~1,7 s — czas na atak. Klawisze: patrz niżej.
   Dwa tryby: Tab przełącza tryb normalny (O akcja, P menu, [ ] nic) i tryb walki (na mapie O = atak,
   P = obrona, [ ] = poprzednia / następna broń, Enter, Esc i R nic; w menu i rozmowach wszystko jak zwykle;
   u góry ekranu miga napis „Tryb walki”). Bez broni bohater bije pięściami.
2. **Zwierzęta**: niedźwiedź, ataki z ukrycia, skórzana kurtka, drzewka strzelectwa i przetrwania.
3. **Ludzie**: bandyci, łucznik, najemnik, nocne obozy, poddawanie się.
4. **Stwory z ruin**: razem z mapami podziemi (Akt II), Hart ducha w użyciu.

Grafika na każdy etap: animacje postaci (przewrót, ciosy każdej broni, zamach ciężkiego ciosu, blok) i nowe
sprite'y wrogów — PixelLab, tak jak dotychczasowe arkusze zamachów (najbardziej pracochłonna część).
