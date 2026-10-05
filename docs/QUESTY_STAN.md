# Questy miasteczka — stan wdrożenia

Stan: 2026-10-05. Katalog: `docs/QUESTY.md`. Kod: `js/plugins/TownQuests.js` (silnik) i `js/plugins/TownQuests_Data.js`
(zadania, teksty, nagrody), wpisane na końcu `js/plugins.js` za TownLife. Test: `tests/town_quests_test.js`.

## Co działa (silnik)

- **Zadania u mieszkańców.** Mieszkaniec TownLife (na mapie miasteczka, w tawernie i w swoim domu) z zadaniem do zaoferowania ma
  nad głową żółte „!”, z rzeczą do oddania — zielony ptaszek. W rozmowie mówi najpierw o zadaniu: oferta z wyborem
  („Przyniosę.” / „Nie teraz.” albo kilka wyjść), przypomnienie (czego brakuje — zawsze **dymek nad bohaterem**, nigdy okno
  wiadomości), oddanie, nagroda. Gdy ktoś nie ma nic do powiedzenia o zadaniach, wita się według Opinii i mówi swoje zwykłe
  zdanie. Jedna sprawa naraz u jednej osoby: póki jego zadanie nie jest skończone, przypomina o nim, zamiast dawać nowe.
- **Lord i dziadek Stach** (Story.js) mówią o zadaniu na początku swojej rozmowy, potem idzie ich zwykła rozmowa (spłata długu).
  Dziadek daje list bez wyboru (w rozmowach fabuły nie ma dodatkowych pytań).
- **Kroki:** przynieś (przedmioty, narzędzia do pokazania, porcje własnej deszczówki, złoto), porozmawiaj, miejsce zadania,
  czekaj, upoluj (szyna `kill`), własne (rozwożenie chleba, podpisy, nocna warta, śledzenie Kuby, dzwon...). Warunki: godziny,
  dzień, dni po innym kroku, pora roku, pogoda, dni bez deszczu, Opinia, inne zadania, flagi, dzień targowy, dzień po promie,
  fabuła. Terminy: przepada albo „spóźniłeś się” (klient się obraża, następny krok).
- **Miejsca zadań** (okienko piekarni, ściany do obwieszczeń, brama południowa, posterunek, kosz żarowy, błysk na Polnej
  drodze) to zdarzenia wstawiane przez `Tawerna.inject` (numery 951–959, mapy 8 i 22). Są widoczne i działają tylko wtedy, gdy
  zadanie ich potrzebuje (żółty romb). Mapy nie są zmieniane.
- **Nagrody:** złoto (część może iść „na dług dziadka” przez `Story.pay`), przedmioty, doświadczenie (Combat), Opinia, notatki i
  poszlaki w dzienniku, flagi na później, premie (buty: `Combat.perk`). Napis u góry: „Nowe zadanie”, „Zadanie wykonane:
  … +15 G · +50 dośw. · Opinia +2”, „Zadanie przepadło”. Szyna: `townQuestAccepted`, `townQuestDone`, `townQuestFailed`,
  `townOpinion`.
- **Dziennik:** zakładka „Miasteczko” — zadania w toku (krok, czego brakuje, termin), Opinia w miasteczku (progi, ostatnie
  zmiany), Kalendarz miasteczka (dni bez deszczu, targ, prom, święta), Sygnały dzwonu, zadania skończone. OK na zadaniu =
  śledzenie w okienku celu („MIASTECZKO”).
- **Zapis:** cały stan w `Tawerna.state("townQuests")` (wersja 1). Nic nie uruchamia się samo przy wczytaniu ani na zmianę dnia:
  sceny poza rozmową (noc u stawu, zasadzka, wynik dzwonu) to dymki nad bohaterem i mieszkańcami.
- **Zasada suszy:** żadne zadanie, wybór ani mieszkaniec nie daje bohaterowi wody. Zadania tylko **zabierają** jego deszczówkę
  (K2, D10) albo każą ją pokazać (K10). Test to sprawdza (żadna nagroda nie jest wodą ani naczyniem z wodą).

## Opinia w miasteczku (0–100, start 10)

| Próg | Nazwa | Co daje w grze |
|---|---|---|
| 0 | Obcy | powitania półsłówkami („Czego?”, „Hm?”) |
| 20 | Bywalec | „A, to ty.”; K14 (dzwonienie za Ambrożego), K38 (nocna warta), w D4 trzecie wyjście (praca dla Ludmiły) |
| 40 | Sąsiad | „Dzień dobry, sąsiedzie!”; D16 (uczeń dzwonnika) |
| 60 | Zaufany | ciepłe powitania |
| 80 | Jeden z nas | „Nasz! Siadaj, mów, co słychać.” |

Rabatów nie ma — w miasteczku nie ma sklepów (tylko sprzedaż Baltazarowi w K16). Spada za złamane słowo (−1 do −3), nocne
włóczenie się przy Kubie (−3), łapówki i nieuczciwe wyjścia.

## Kalendarz

Targ co 7 dni (napis u góry, okrzyki mieszkańców przy straganach), prom co 3 dni (dzień nowych kartek na tablicy zleceń; dzień
później Baltazar skupuje zapasy — K16), sygnały dzwonu (W2). Większe dni (prom z uchodźcami 10/24/38/52, imieniny Lorda 33,
Noc Kupały 42, dożynki 56, Wielkanoc, Wigilia) są w danych i w zakładce „Kalendarz miasteczka”; w grze dzieje się tylko K31 w
dniu 33 — reszta czeka na mapy i sceny (napisane przy dniu w dzienniku).

## Każdy quest z katalogu

zrobione = grywalne od początku do końca; częściowo = grywalne, ale bez części z katalogu; czeka = jeszcze nie w grze.

### Krótkie

| # | Nazwa | Stan | Uwagi / na co czeka |
|---|---|---|---|
| K1 | Węgiel do paleniska | zrobione | przed 9:00 Tadek naprawia najbardziej zużyte narzędzie |
| K2 | Woda do hartowania | zrobione | 2 porcje z wiadra w plecaku albo z bukłaka; 25 G albo 6 gwoździ |
| K3 | Podkowa w słońcu | zrobione | błysk na Polnej drodze 11–14 przy słońcu; rabatu w kuźni nie ma (brak sklepu) |
| K4 | Chleb przed świtem | częściowo | drewno pod okienko piekarni 3:30–5:00 dnia następnego; czeka na: mini-grę „łopata do pieca” |
| K5 | Bochenki do 9:00 | zrobione | codziennie; Ambroży, Wit, Ludmiła, sołtys; plotki w notatkach |
| K6 | Jęczmień do żaren | zrobione | lato i jesień; D2 (młyn) czeka |
| K7 | Myszy w mące | czeka | na: noszenie kota, wnyki we wnętrzu piekarni |
| K8 | Pęknięta beczka | zrobione | poszlaka W1, notatka „Beczka Kuby” |
| K9 | Kłótnia w kolejce | częściowo | rozsądzanie zrobione, ale kłótnię opowiada Kuba (sąsiadkę zastąpił Ignac); czeka na: scenę przy studni (plany dnia) |
| K10 | Smak wody | zrobione | przerobione na suszę: kadź Ignaca zamiast kubka od Kuby, Ozzy nie bierze udziału |
| K11 | Myto przy bramie | częściowo | zapłać 2 G albo przynieś 6 polan; brama nie zatrzymuje (Wit tylko woła „Myto!”) |
| K12 | Łój do latarni | zrobione | „łój” = 1× surowe mięso dzika albo jelenia (albo 2 pochodnie); poszlaka W1 |
| K13 | Sznur dzwonu | zrobione | spóźnienie = w południe dzwon milczy |
| K14 | Dzwonnik ma chore kolana | zrobione | mini-gra dzwonu (6 uderzeń), zła liczba = poszlaka W2; bez wnętrza dzwonnicy |
| K15 | Ostrożnie, kruche | częściowo | skrzynia (wolniejszy chód), wóz, zajrzyj / oddaj Witowi, zapłata nazajutrz; czeka na: woźnicę (postać) |
| K16 | Grzyby po dwakroć | zrobione | handel w dzień po promie, do 10 sztuk, podwójna cena; poszlaka W8 |
| K17 | Obwieszczenie o racjach | zrobione | 4 ściany: tawerna, piekarnia, kuźnia, kantor (zamiast obozu) |
| K18 | Kto ruszył stóg? | czeka | na: sąsiedzi (postacie), ślady przy stogach |
| K19 | Spis obozu | zrobione | trzy osoby (Ludmiła, Ela, Rafał) zamiast pięciu namiotów; Rafał prosi, żeby go nie liczyć |
| K20 | Pierwsza skóra | zrobione | +1 ścięgno przy 3 następnych skórach |
| K21 | Garbnik z lasu | zrobione | rabatu nie ma (brak sklepu) |
| K22 | Struna dla Melii | czeka | na: rozmowa z Melią (TavernLife), przedmiot Struna |
| K23 | Chowany na rynku | czeka | dzieci są; na: kryjówki i sterowanie pozycją dzieci (TownLife) |
| K24 | Latawiec na dzwonnicy | czeka | na: latawiec jako cel procy |
| K25 | Proca dla Bronka | czeka | na: puszka na murze jako cel |
| K26 | Pierścionek w studni | czeka | na: mapa dna studni |
| K27 | Konik dla Eli | zrobione | drewno + nóż; wariant z Melią czeka |
| K28 | Kocioł dla obozu | zrobione | 2 porcje kapuśniaku / gulaszu / zupy grzybowej; zimą Opinia podwójnie |
| K29 | Rana Rafała | zrobione | o świcie albo późnym wieczorem (Rafał wtedy wychodzi), nie przy kapralu |
| K30 | Koszyki dla dworu | zrobione | dzień targowy, Feliks 7–8:30, Lordowi do 9:00; 5 G + 5 G na dług |
| K31 | Imieniny Lorda | zrobione | od Feliksa (dni 26–33), w dniu 33 Lordowi; 40 G albo na dług. Łagodniejszy list z dnia 40 czeka na Story.js |
| K32 | List od dziadka | zrobione | dni 5–20; Lord pyta o kamienie z krukiem |
| K33 | Czapka Ozzy'ego | czeka | na: Ozzy jako rozmówca, czapka na posągu (ogród niedostępny) |
| K34 | Ogień w stogu | czeka | na: ogień na mapie (burza) |
| K35 | Śnieg na dachu | czeka | na: zaspy na dachu piekarni |
| K36 | Kot na dachu piekarni | czeka | na: noszenie kota |
| K37 | Sakiewka Lorda | czeka | na: uciekający złodziejaszek (postać), Lord na rynku |
| K38 | Nocna warta | zrobione | przerobione: posterunek przy bramie twierdzy (Kuba idzie nocą do stawu, Wit nocą siedzi w wieży); poszlaka W1 |
| K39 | Kości z targu | czeka | na: wędrowny gracz w kości (TavernDice) |
| K40 | Woda na pranie (Marta, Podgrodzie) | zrobione | 2 porcje własnej deszczówki (zabiera wodę, nie daje); 5–17, od dnia 2 |
| K41 | Zioła dla babki Jadwigi (Podgrodzie) | zrobione | 3× Krwawnik + 2× Pokrzywa → 2× Opatrunek |
| K42 | Kram Józka (Podgrodzie) | zrobione | 2× Deski + 4× Gwoździe, młotek → 2× Lina, 10 G |
| K43 | Drewno na ognisko (Darin, Podgrodzie) | zrobione | 6× Drewno, 17–22 → notatka „Opowieść Darina” (Serce pod twierdzą na wyspie) |
| K44 | Lina dla Zbycha (Podgrodzie) | zrobione | 2× Lina → 3× Węgiel drzewny |
| K45 | Włókno na pętle (Rysiek, Podgrodzie) | zrobione | 6× Włókno → 2× surowe mięso zająca, rada: sidła tylko z przynętą |
| K46 | Suchar dla Franka (Podgrodzie) | zrobione | 1× Chleb → notatka „Tajemnica Franka” (Kuba nocą z beczkami) |

### Długie

| # | Nazwa | Stan | Uwagi / na co czeka |
|---|---|---|---|
| D1 | Buty od szewca | zrobione | 3 skóry → ćwieki u Tadka → miara o 7:00 po 2 dniach → buty po 2 dniach; Buty łowcy (skradanie +20%) albo Podkute (zimno, mniejszy wysiłek). Dostajesz Skórzane buty — osobne przedmioty czekają na bazę danych |
| D2 | Mąka bez młyna | czeka | na: kierat / wnętrze młyna |
| D3 | Ręka kowala | zrobione | 3 dni: podkowy (kute u Tadka) dla Wita, gwoździe sołtysowi, nóż Ignacowi; spóźnienie = obrażony klient; 60 G albo zostaw Tadkowi (Opinia +6). Przepis na okutą tarczę czeka |
| D4 | Złodziej o świcie | zrobione | zasadzka 5:20–5:50 (C), Ela przy obozie, 3 wyjścia (trzecie od Opinii 20); rysunek Eli (W9). Ela nie biega po mapie o świcie, pies nie tropi — czeka na plan dnia |
| D5 | Wataha pod bramą | zrobione | tropy o świcie, 2 wilki na Polnej drodze nocą, przewodnik na Skraju lasu; 80 G + Opinia albo przysługa Wita |
| D6 | Siłacz z targu | czeka | na: turniej siłowania na rynku, Pas siłacza |
| D7 | Serce kowala | czeka | na: róża w ogrodzie dworu, scena wyznania, wesele |
| D8 | Wielki targ | czeka | na: mini-gra targowania, stragan gracza |
| D9 | Spis beczek | czeka | wnętrza już są (mapy 102–110), ale drzwi są otwarte 6–21, a gospodarze siedzą w domach głównie nocą; na: godziny i rzeczy do znalezienia (beczka Hanki, piwnica kantoru) |
| D10 | Gorączka Eli | zrobione | wywar ziołowy + 1 porcja własnej deszczówki, noc, rano zdrowa; skrót: lek Baltazara za 60 G (pieczęć wojska → poszlaka W6). Czuwanie przy ognisku i łaty na stroju czekają |
| D11 | Ognie na murach | zrobione | 5 wieczorów zamiast 7; zalany kosz przy bramie wschodniej, mokre ślady do kantoru; powiedz Witowi albo weź 30 G od Baltazara. Sabotażysta jako postać czeka |
| D12 | Ślady kota | czeka | na: kot z nocną trasą |
| D13 | Zakład Ozzy'ego | czeka | na: Ozzy, przepowiednie z planu pogody |
| D14 | Zboże na wojnę | zrobione | przy bramie wschodniej (nie na polu dziadka): oddaj (50 G odpisu z długu) / łapówka 20 G / schowaj (po 3 dniach Wit zagląda do torby: kara 40 G) |
| D15 | Dzieci nocą | czeka | na: dzieci wymykające się nocą (plan dnia), dziura w murze, ogród |
| D16 | Uczeń dzwonnika | zrobione | od Opinii 40, 4 lekcje (6, 12 albo 18), coraz szybciej; klucz do dzwonnicy jako flaga (minimapa bez zmian) |
| D17 | Petycja do Lorda | zrobione | 5 z 6 podpisów (Tadek, Hanka, Kuba, Ignac, Ambroży, Baltazar za przysługę), Wit odmawia; Lord obniża podatek |
| D18 | Płaszcze przed zimą | zrobione | jesień od dnia 70; obóz (Opinia +10, płaszcz dla ciebie) albo Feliks dla straży (90 G, Opinia −3) |
| D19 | Kość z Kruczych Skał | czeka | na: Nieznajomy przy kościach jako zleceniodawca, ogród |

### Wątki

| # | Nazwa | Stan | Uwagi / na co czeka |
|---|---|---|---|
| W1 | Woda spod Kruczych Skał | częściowo | rozdz. 1 (poszlaki: K8, K10, K12, K38 — wystarczą 3) i rozdz. 2 (nocą za Kubą do stawu, po cichu; złapany = Opinia −3, próba następnej nocy). Zatrzymany przed odkryciem, kto stoi za wodą: „Ciąg dalszy wkrótce” — **czeka na decyzję autora** (Lord wie / Feliks winny) |
| W2 | Kod dzwonu | częściowo | rozdz. 1 (dzwon o 3:00 w nocy), rozmowa z Ambrożym, rozdz. 2 (D16), rozdz. 3 (tabela sygnałów: 3, 1-1-1-1 o 23:00, 4+2 po suszy, 2+2+2 w burzy — trzy różne), rozdz. 4 (Ambroży, klucz do ogrodu). Ogród rycerzy (2026-10-05): furtka (Map008 zdarzenie 39) otwiera się kluczem Ambrożego, krok „wejdź do ogrodu” (notatka, +40 dośw.), potem przerwa; test `tests/knights_garden_test.js`. Rozdz. 5 dalej (posągi, płyta w południe, Archiwum) czeka na: mapę Archiwum i siedem posągów |
| W3 | Pieśń o Kruczych Skałach | czeka | na: zwrotki (teksty), Melia jako rozmówczyni, Noc Kupały |
| W4 | Krew kasztelana | czeka | na: połówki klucza, Borgar, kopanie przy kamieniu |
| W5 | Towary z kontynentu | czeka | flagi już są (K15, K16, D11); na: wnętrze kantoru z piwnicą nocą, obóz przemytników |
| W6 | Ludzie z promu | czeka | K19, K27, K28, K29, D4, D10, D18 dają już flagi zaufania obozu; na: fale uchodźców, list gończy, głosowanie |
| W7 | Dwór z kamieni twierdzy | czeka | na: decyzja autora (wariant A/B), wnętrze dworu |
| W8 | Żelazna Pięść | czeka | na: Grum jako rozmówca, mapy gór i jaskini |
| W9 | Serce Twierdzy | czeka | na: podziemia (Akt II) |

Razem: 45 zadań w grze - 39 grywalnych w całości (29 krótkich, w tym 7 z Podgrodzia - test `tests/podgrodzie_quests_test.js`; 10 długich), 4 krótkie częściowo (K4, K9, K11, K15) i 2 wątki częściowo (W1, W2); reszta katalogu czeka. Test `tests/town_quests_test.js` (59 sprawdzeń, ok. 4 min) przechodzi od początku do końca K1, K2, K4, K5, K8, K10, K12, K13, K14, K16, K17, K19, K27, K28, K29, K31, K32, D1, D4, D5, D10, D16, W1 (rozdz. 1-2) i W2 (rozdz. 1-4).

## Jak dopisać zadanie (TownQuests_Data.js)

Każde zadanie to jeden obiekt w tablicy `QUESTS`. Najprostsze — „przynieś komuś rzeczy”:

```js
{
    id: "K99", kind: "K", title: "Gwoździe dla Ignaca", giver: "garbarz", icon: 88,
    where: "garbarnia", when: "6:30–17", desc: "Ignacowi skończyły się gwoździe do kopyt.",
    offer: {
        cond: { hours: [6.5, 17], day: 3 },                 // kiedy daje zadanie (tu: od dnia 3, gdy jest przy garbarni)
        say: ["Skończyły mi się gwoździe. Przyniesiesz dziesięć?"],
        yes: "Przyniosę.", no: "Nie teraz.",
        accept: ["Dziesięć. Nie dziewięć."], decline: ["To poczekam."]
    },
    steps: [
        { type: "bring", to: "garbarz", need: [[88, 10]], hours: [6.5, 17],
          text: "Przynieś Ignacowi 10× Gwoździe (garbarnia).",     // to widać w dzienniku i w okienku celu
          remind: ["Gwoździe, chłopcze."], hero: ["> Masz. Dziesięć."], done: ["Dziesięć. Dziękuję."] }
    ],
    reward: { gold: 10, xp: 50, opinion: 1 }
}
```

- `giver` — klucz mieszkańca z `TownLife_Data.js` (`kowal`, `piekarka`, `woziwoda`, `kapral`, `dzwonnik`, `kupiec`, `soltys`,
  `garbarz`, `feliks`, `bronek`, `zosia`, `ludmila`, `ela`, `rafal`) albo `lord` / `grandpa` (wtedy `offer.auto: true` — bez wyboru).
- Linijki: zwykły tekst mówi ten, z kim rozmawiasz; `"> tekst"` — bohater; `"@kowal: tekst"` — ktoś inny (jeśli stoi obok).
- `offer.options` zamiast `yes/no`: `then: "accept" | "decline" | "refuse" | "close"`, `cost` (złoto), `need`, `reward`, `step`.
- Krok: `type` `bring` / `talk` / `spot` / `wait` / `kill` / `custom` / `pause`; warunki `hours`, `dayRel`, `dayIs`,
  `after: [krok, dni]`, `clear`, `deadline: { day, hour, late: "fail" | "next" }`; potrzeby `need`, `needAny`, `tools`,
  `toolsAny`, `water` (oddaje własną deszczówkę), `showWater` (tylko pokazuje), `gold`; po kroku `gives`, `vgives`, `reward`,
  `choice: { options: [{ label, say, reward, flag, perk }] }`.
- Rzeczy, których nie ma w bazie (list, skrzynia, koszyki): `VITEMS` i `["v:klucz", n]` w `need`.
- Nowe miejsce na mapie: wpis w `SPOTS` (mapa, numer 951–959 — na każdej mapie inny, x, y, `wall` dla ściany, `deco` — papier,
  błysk, tropy, zalany kosz) i krok `{ type: "spot", spot: "klucz", ... }`.
- Coś nietypowego (własna rozmowa, zegar, sprawdzenie): nazwa w kroku (`talk`, `tick`, `check`, `spotFx`, `fx`, `sayFx`,
  `rewardFx`) i funkcja o tej nazwie w `FX` w `TownQuests.js`.
- **Nigdy** nie dawaj bohaterowi wody (zasada suszy) — test `town_quests_test` to sprawdza.
- Po dopisaniu: `node tests/run.js town_quests_test` (z `CDP_PORT=9433` albo swoim portem).
