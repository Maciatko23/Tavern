# Podróżni z promu - projekt

Stan: 2026-10-29. **Projekt zatwierdzony przez gracza 2026-10-28 (decyzje: rozdz. 10). Zbudowane: etap 0 (poprawki W6), etap 1 (rdzeń
systemu), etap 2 (sprawy pierwszej szóstki, podsłuch I2) i etap 4 (łańcuchy W15 i W16) - opis budowy, jak to zobaczyć i co dalej:
rozdz. 11.** Etap 3 (intrygi, furtki TavernLife) zbudowany 29.10 po południu (rozdz. 11.9); etap 5 w budowie; etapy 6-8 czekają.
Gracz zatwierdził pomysł w całości (cztery części): podróżni z promu jako stały system, podróżni z własnymi zadaniami, intrygi na
piętrach tawerny, łańcuchy przez kilka promów. Do tego poprawki niespójności W6 i (dopisek gracza) sceny i historyjki.

Szkice: `docs/podroznicy/os_czasu.png` (kto, kiedy i jak długo w rozdziale 1), `docs/podroznicy/ksiega_pokoi.png` (kto gdzie
mieszka na planie pięter, ściany do podsłuchu). Skrypt szkiców (Python + PIL, czyta PLAN_DATA z `TavernLife_Plan.js` i plansze
`img/pictures/TavernPlan_*.png`) leży poza projektem, w katalogu roboczym sesji - przy budowie przenieść do `tools/podroznicy/`.

---

## Spis treści

0. [W skrócie](#0-w-skrócie)
1. [Zasady systemu](#1-zasady-systemu)
2. [Obsada](#2-obsada)
3. [Intrygi na piętrach](#3-intrygi-na-piętrach)
4. [Łańcuchy](#4-łańcuchy)
5. [Poprawki niespójności W6](#5-poprawki-niespójności-w6)
6. [Integracja techniczna](#6-integracja-techniczna)
7. [Grafika postaci](#7-grafika-postaci)
8. [Prezentacja: sceny i historyjki](#8-prezentacja-sceny-i-historyjki)
9. [Kolejność budowy i szacunek](#9-kolejność-budowy-i-szacunek)
10. [Decyzje gracza - zatwierdzone](#10-decyzje-gracza---zatwierdzone-2026-10-28)
11. [Stan budowy](#11-stan-budowy)

---

## 0. W skrócie

| co | jak |
|---|---|
| Kiedy przypływają | W dni promu (1, 4, 7 ... co 3 dni), prom przy molo 9-15. Na prom: 1-3 nowych (stała obsada fabularna + pula losowa). |
| Ilu naraz | W rozdziale 1 najwyżej **4** podróżnych na wyspie (grupa liczy się za jednego). Od Renomy 60 i w Akcie II - 5. |
| Gdzie mieszkają | Pokoje gości na piętrze (Map025, pokoje 4-24) i Apartament Złoty (Map026). **Pokoje 1 i 2 zostają dla bohatera zawsze.** |
| Jak długo | 1-2 promy (3-6 dni), łańcuchy do 4 promów. Odpływają promem o 15:00. Część wraca. |
| Księga pokoi | U Borgara („Księga gości”) i na planie karczmy: kto, który pokój, do kiedy. Zajętego pokoju bohater nie wynajmie. |
| Obsada | 12 postaci z zadaniami + poseł i gwardzista (łańcuch) + Wolna Kompania (stare grafiki najemników) + 16 typów puli. |
| Zadania | Nowe numery: **K71-K74, D39-D47, W14-W16** - od razu jako dane silnika `Watki.js`, teksty w `js/teksty/*.txt`. |
| Intrygi | Zamknięta trójka, rozmowa przez ścianę, skradziona szkatułka, nocne kroki, list pod drzwiami, poselstwo w Złotym, Wolna Kompania. |
| Łańcuchy | W14 „Poselstwo” (dni 37-46), W15 „Święte kości” (13-28), W16 „Dezerter” (25-37). |
| Pieniądze | Złoto pewne ze wszystkich spraw podróżnych ok. **320 G** (13% długu), z wszystkimi chciwymi wyborami do ok. 590 G. Żadnych odpisów długu. |
| Nowe miary | **Renoma karczmy** (0-100, sława samej tawerny, w księdze Borgara). Sława bohatera i Opinia miasteczka - jak dotąd. |
| Woda | Żaden podróżny nie daje wody. Kupiec zbożowy ma beczki - tylko dla wojska. Medyk liczy wodę „na kubki jak złoto”. |
| Fale W6 | Fale w dniach **10, 25, 37, 52** (dni promu - wariant A, zatwierdzony i zbudowany); Ludmiła i Ela przypływają z pierwszą falą (dzień 10). |
| Sceny | Kluczowe chwile grane na mapie (ruch, dymki, emotki, kamera, pasy kinowe, światło ognia, dźwięk) - 0 generacji PixelLab. |
| Historyjki | Ilustrowane, lekko animowane filmiki jak prolog: **wersja oszczędna 4** (H1, H2, H3, H5 - decyzja gracza), reszta jako sceny na mapie; wracają w Dzienniku jako „Wspomnienia”. |
| Grafika | 14 postaci PixelLab w stylu bohatera + 4 ciała puli; razem z rekwizytami i historyjkami **ok. 495 (oszczędnie) - 670 (pełna)** generacji z puli 5000 od 29.10. |
| Budowa | 9 etapów, ok. 12-13 sesji agenta. Pierwszy etap (system bez fabuły) działa bez zmian w TavernLife. |

---

## 1. Zasady systemu

### 1.1 Prom i kalendarz

- **Dni promu:** `TownQuests.isFerry(d)` - dzień 1 i co 3 dni (1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52,
  55, 58 w rozdziale 1). Prom stoi przy molo **9-15** (`Przystan.ferryNow`). Nic tu się nie zmienia.
- **Fale uchodźców** (po poprawce z rozdz. 5): **10, 25, 37, 52** - zawsze w dzień promu.
- **Godziny dnia promu (nowe):**

  | godzina | co |
  |---|---|
  | 6:00 | silnik planuje prom: kto odpływa, kto przypływa, który pokój (zdarzenie szyny `dayStart`) |
  | 9:00 | prom przybija (scena, jeśli bohater jest na przystani - rozdz. 8) |
  | 9:30-11:00 | przybyli na molo i u celnika Sambora, potem droga przez Podgrodzie (dla miasta - „w drodze”) |
  | 12:00-13:00 | przybyli w tawernie u Borgara (wpis do księgi), potem ich plan dnia |
  | 11:00-14:00 | odpływający: rachunek u Borgara (11-12), droga (12-14), molo o 14:00 |
  | 15:00 | prom odpływa |

- To, co już dzieje się w dzień promu, zostaje: nowe kartki na tablicy zleceń, nowy towar w kantorze, handel Baltazara dzień później
  (K16), noc promu W5 (wóz na Polnej drodze), listy W10, werbownik dzień po fali. Podróżni tylko się do tego dokładają (np. Szczerba
  pilnuje molo w dni promu, Urszula patrzy na twarze).

### 1.2 Kto przypływa

**Stała obsada fabularna** - każda postać ma okno przybycia: najwcześniej, warunek, najpóźniej. Gdy warunku nie ma, postać czeka na
następny prom; po „najpóźniej” przypływa i tak (zadanie dopasowuje się do stanu gry). Starsze zapisy: postaci, których okno minęło,
przypływają po kolei, **jedna na prom**, w tej samej kolejności (rozdz. 1.9).

| postać | najwcześniej | warunek | najpóźniej | pobyt | pokój | powrót |
|---|---|---|---|---|---|---|
| Tobiasz, posłaniec | prom 4 | bohater był w miasteczku | 7 | 1 prom | 23 | co 9-12 dni, gdy jest miejsce (13, 25, 37, 46, 55) |
| Konstanty Mak, medyk | 7 | - | 7 | 2 promy | 11 | fala 4 (52-58) |
| Zenon Sita, kupiec zbożowy | 10 (fala 1) | - | 10 | 2 promy | 20 | 46-52, tylko gdy nie zdemaskowany |
| Gaspar Lis, handlarz relikwii | 13 (Wielkanoc) | - | 16 | do 25 | 12 | Akt II, gdy nie zdemaskowany |
| Teofil Cyrkiel, kartograf | 16 | bohater zna 6+ miejsc na mapie wyspy (wcześniej przy 10+) | 19 | 2 promy | 22 | 40-46 |
| Ksenia Żuraw (szkatułka, D46) | 16 | bohater przepracował 3 zmiany | 22 | 2 promy | 18 | - |
| brat Augustyn, wizytator | 2 promy po Gasparze | Gaspar na wyspie albo już odpłynął | 22 | 3 promy | 16 | - |
| Urszula z Olszynki | 19 | bohater zna Janka (W10 możliwe) | 22 | 3 promy (dłużej, gdy syn znaleziony) | 21 | - |
| Tymon Wrzos, dezerter | 25 (fala 2) | - | 25 | do 37 | 5 | - |
| Szczerba, łowczyni | prom po Tymonie | Tymon na wyspie | - | 2-3 promy | 6 | - |
| Wolna Kompania (4) | 28 | W8 rozpoczęte albo dzień 31 | 31 | 3 promy | 9, 10 | Akt III (gdy najęta) |
| Jędrek Dudarz, grajek | 31 (od 22, gdy trwa W3) | - | 34 | do 43 (po Kupale) | 17 | - |
| Erazm Łaska, poborca | 34 | - | 34 | 2 promy (przed listem Lorda z dnia 40) | 4 | - |
| Albin, pątnik | 37 (fala 3) | - | 37 | 3 promy | 15 | Akt II (zwiadowca), gdy nie zdemaskowany |
| poseł Wierzbięta + Ostap | 40 | Albin na wyspie | 43 | 2 promy | Złoty / kącik służby | - |
| „gość spod trójki” (D45) | 46 | bohater wynajął pokój choć raz | 52 | 2 promy | 3 | - |

**Pula losowa** - 16 typów zwykłych podróżnych bez wątku. Na prom 0-2 z puli, tylko gdy jest miejsce pod limitem (1.3). Wybór
deterministyczny: `hash(ziarno zapisu, dzień)` - ten sam zapis daje tych samych ludzi (testy, wczytanie). Każdy ma: wygląd (jedno
z 4 ciał puli + kolory, rozdz. 7), 2-3 kwestie, wieści z lądu wg etapu wojny i **jedną drobną przysługę** (2-6 G, najwyżej 10 G na
prom ze wszystkich).

| typ | drobna przysługa / handel | wieści, kolor |
|---|---|---|
| flisak z lądu | „Zniesiesz worek do tawerny?” - bagaż z przystani do sieni (3 G) | o promach i pogodzie |
| kupiec suknem | sprzedaje igły, nici, płótno (3 rzeczy); kupuje skóry wyprawione | ceny na lądzie |
| stara pątniczka | odprowadź ją na stary cmentarz do grobów braci (4 G) | „za braci dzwoniło się cztery i jeden” |
| żołnierz królewski na przepustce | kości (nowy rywal TavernDice), opowieść z frontu | wojna falami |
| wędrowny kowal | naostrzy broń za 5 G (raz, naprawa Durability -30% ceny) | „groty drożeją” |
| cyrulik | sprzedaje bandaże, kupuje krwawnik i dziurawiec | gorączki w taborach |
| uczeń kupca z listem do Veya | „Gdzie jest kantor?” - zaprowadź (2 G); drobna poszlaka W5 („list do rąk własnych”) | - |
| stary wyspiarz po 40 latach | opowiada o tawernie sprzed lat; zna Gawła | lore: „pod tawerną był mur grubszy niż mój wóz” |
| matka z dzieckiem | dziecko zgubione na rynku - szukaj z Bronkiem i Zosią (4 G) | uchodźcy |
| myśliwy z lądu | kupuje skóry wilka i dzika ×1,2 (najwyżej 3) | „na lądzie wilki chodzą za wojskiem” |
| skryba | przeczyta list niepiśmiennym; za 2 G przepisze ładnie list do matki | - |
| wędrowna szwaczka | łata ubiór 20% taniej (raz) | moda na czarne płaszcze („jak u tych z okiem”) |
| mnich żebraczy | prosi o chleb: dasz - Opinia +1 i krótka premia „Spokój” (+Hart ducha na 4 godz.) | - |
| marynarz z promu | pogoda na jutro; późno: „statki bez bandery” | morze |
| zielarka z lądu | wymienia nasiona (te same uprawy, inne odmiany - tylko nazwy) | - |
| kostkarz-szachraj | gra fałszywymi kośćmi; Czujność 6+ to widzi (jak K39) | - |

**Wieści z lądu** (każdy podróżny ma linijkę z etapu wojny): dni 1-20 - Brzozowa Wola i pobór; 21-40 - rekwizycje, ceny, Czarne Oczy
na drogach; 41-60 - statki bez bandery, „szukają kamieni z krukiem”; Akt II - plotki o „drzwiach pod skałą”; po Akcie III - echo napadu.
Wszystkie wieści zgodne z listami matki (W10): nic nie rozstrzyga losu ojca.

**Planowanie promu (6:00 w dzień promu, raz):**

1. Odpływy dziś (koniec pobytu; sprawa nierozwiązana - rozdz. 1.8).
2. Obsada stała: postaci z otwartym oknem w kolejności tabeli, póki jest miejsce.
3. Pula: 0-2 osoby, póki jest miejsce (na fali o jedną mniej - fala to i tak tłum).
4. Pokoje (1.5): stały pokój postaci, gdy wolny; inaczej najbliższy wolny tego samego rodzaju.
5. Plany dnia (1.4) i wpis do księgi.

### 1.3 Ile naraz

| okres | limit podróżnych na wyspie | nowych na prom |
|---|---|---|
| rozdział 1 | 4 | 1-3 |
| Renoma 60+ | 5 | 1-3 |
| Akt II | 5 (pula częściej: 1-2 na prom) | 1-3 |
| noc napadu (Akt III) | nikt nie przypływa ani nie odpływa tego dnia | 0 |

- Grupa (Wolna Kompania, poseł z gwardzistą) liczy się za **jedno** miejsce.
- Eryk Sowa (pokój 7) i Rafał w kryjówce (pokój 1, W6) nie liczą się do limitu - to mieszkańcy, ale są w księdze.
- Oś czasu (`os_czasu.png`) mieści się w limicie: w najgęstszych dniach (19-22, 28-34, 37-43) jest 4 podróżnych.

### 1.4 Dzień podróżnego

Podróżny to mieszkaniec TownLife (rozdz. 6.3): żyje według planu dnia na mapie miasteczka, „w środku” znaczy w tawernie (sala
albo jego pokój). Szablon, z którego każda postać dostaje swój plan:

| godzina | szablon | odmiany |
|---|---|---|
| 7-9 | śniadanie w sali (Map001, swoje miejsce) | pątnik modli się przy murach |
| 9-12 | sprawy w mieście: rynek, ratusz, kantor, kuźnia, mury | kupcy - rynek; uczeni - palarnia; żołnierze - pokój gier |
| 12-14 | obiad w sali | poborca - Jadalnia prywatna |
| 14-18 | sprawy albo pokój | medyk - obóz pod murem; kartograf - mury ze sznurem |
| 18-23 | wieczór w sali (pieśń Melii, kości, rzutki) | grajek gra; łowczyni przy drzwiach |
| 23-7 | pokój (sen) | nocne wyjścia z danych (rozdz. 3, I4) |

- **Dzień przyjazdu:** do 12:00 „w drodze” (TownLife `away` - na przystani grają aktorzy sceny Podroznicy, rozdz. 6.6), 12:00 sień
  i Borgar, potem plan.
- **Dzień odjazdu:** od 11:00 rachunek u Borgara, od 12:00 „w drodze”, o 14:00 aktorzy na molo, 15:00 prom.
- W deszcz plany przesuwają się do sali (jak u mieszkańców). Dzień targowy - kupcy na rynku do 14:00.

### 1.5 Księga pokoi

**Pokoje** (z planu karczmy, `TavernLife_Plan.js` PLAN_DATA):

| pokoje | kto | uwagi |
|---|---|---|
| 1 (izdebka), 2 (z oknem) | **tylko bohater** | Rafał w kryjówce W6 zajmuje 1 („krewniak Borgara” w księdze) |
| 3 (narożny, kominek) | bohater; wyjątkowo „gość spod trójki” (D45) | jedyny pokój bohatera, który podróżny może zająć |
| Komnata z kominkiem | bohater (Sława 60) | podróżni nie biorą |
| Apartament Złoty (Map026) | bohater (Sława 80); poseł (W14) | rezerwacja od dnia przed przyjazdem posła |
| 4-6, 8-24 (Map025) | podróżni | każda postać ma swój stały pokój (tabela 1.2) |
| 7 | Eryk Sowa (od dawna) | „kupiec suknem” |
| kącik służby (Map026) | gwardzista posła | |

**Zasady:**

- Zajęty pokój bohatera (3, Złoty) - Borgar nie wynajmuje: popup nad bohaterem „Pokój nr 3 zajęty do dnia 49.” (zasada: braki
  zawsze popupem nad bohaterem). Na karcie pokoi TavernLife wiersz pokoju jest przygaszony z tym samym napisem.
- Bohater, który ma wynajęty Złoty w nocy przed przyjazdem posła, śpi do rana; rezerwacja zaczyna się od zwolnienia (10:00).
- Drzwi zajętych pokoi 4-24 (dziś otwarte dla każdego) zamyka wtyczka: O przy drzwiach - „Zamknięte. Ktoś tu mieszka.” i wybór
  „Zapukaj” (gdy gospodarz w środku: krótka rozmowa przez drzwi) / „Odejdź”. Pusty pokój - otwarty jak dotąd.
- **Przeszukanie** (tylko w sprawach, które go potrzebują): kufry i torby podróżne, które już stoją w pokojach (zdarzenia „Kufer
  podróżny”, „Torba podróżna”) - O: „Przeszukać cudze rzeczy?”. Można tylko, gdy gospodarza nie ma (plan dnia) i drzwi są otwarte:
  pokojówka sprząta piętro 9-11 i zostawia otwarte, albo Borgar daje klucz na godzinę (Renoma 50+). Przyłapany (gospodarz wraca wg
  planu w trakcie): Renoma -3, gospodarz nie rozmawia z bohaterem do końca pobytu.
- **Gdzie widać księgę:**
  - menu Borgara: opcja **„Księga gości”** (`Tawerna.talk.option` dla `borgar`) - lista: pokój, kto (imię albo „gość z lądu”),
    do kiedy, Renoma karczmy, utarg Borgara z pokoi w tym tygodniu;
  - **plan karczmy** (sztalugi w sieni i przy schodach, menu P w tawernie): przy pokoju z gościem - imię i „do dnia N”
    (`TavernLife.plan.info`).
- Szkic przypisania pokoi: `docs/podroznicy/ksiega_pokoi.png`.

### 1.6 Renoma karczmy, dochód Borgara, Sława i Opinia

Gra ma już **Sławę** (bohatera, w tawernie, 0-100 - tablica zleceń, `QuestBoard.reputation()`) i **Opinię** (bohatera w miasteczku,
`TownQuests.opinion()`). Proponuję trzecią, małą miarę: **Renoma karczmy** - sława samej tawerny, 0-100, start 30, widoczna w
księdze Borgara. Mieszanie jej ze Sławą bohatera byłoby mylące (decyzja do zatwierdzenia - rozdz. 10).

| co podnosi | ile | co obniża | ile |
|---|---|---|---|
| sprawa podróżnego rozwiązana dobrze | +3 do +8 | podróżny odpłynął z nierozwiązaną sprawą | -2 |
| intryga wyjaśniona (szkatułka, trójka, poselstwo) | +6 do +8 | złe oskarżenie | -5 |
| uspokojona Wolna Kompania | +4 | noc burd Kompanii | -1 za noc |
| zadowolony poseł | +8 | list posła przepadł | -10 |
| (Akt III) tawerna obroniona | +5 | tawerna padła | -10 |

**Co daje Renoma:**

| próg | skutek |
|---|---|
| 40+ | napiwki na zmianie u Borgara +1 G (60+: +2 G, 80+: +3 G) - razem w rozdziale 1 realnie 30-60 G |
| 50+ | Borgar daje klucz na godzinę do przeszukania (1.5); dar: kufel z imieniem bohatera (ozdoba chatki) |
| 60+ | limit podróżnych 5; z puli przypływają zamożniejsi (przysługi do 6 G) |
| 75+ | pokoje bohatera 20% taniej |
| 90+ | Komnata z kominkiem raz w tygodniu za darmo |

- **Dochód Borgara:** liczony z nocy podróżnych (cena pokoju jak w TavernLife: 8-20 G za noc, Złoty 50) - pokazany w księdze jako
  „utarg z pokoi”. Wpływa tylko na słowa Borgara (humor, „w tym tygodniu stać mnie na nowy beczkowóz”) i na jego dary z tabeli.
  Do kieszeni bohatera nie trafia.
- **Sława bohatera:** każda sprawa podróżnego rozwiązana dobrze +2 do +4 (`QuestBoard.addRep`), w całym rozdziale najwyżej +25.
- **Opinia miasteczka:** tylko sprawy publiczne (relikwie na rynku, zboże na zebraniu, szkatułka, Kompania) - jak w zadaniach miasta.

**Ekonomia długu (2500 G do dnia 60).** Liczby z `docs/AUDYT_PRZEJSCIA.md`: dług to 42 G dziennie, zmiana u Borgara 65-80 G,
zadania miasta 883 G pewne. Podróżni mają być „ciekawi, nie konieczni”:

| źródło | złoto pewne (dobre wybory) | chciwe wybory (zamiast albo obok) |
|---|---|---|
| K71/K72 posłaniec | 12 + 4 powroty × 6 = 36 G | - |
| D39 medyk (+K74) | 15 + 10 G | - |
| D40 kartograf | 30 G | +25 G w 2. wizycie (wybór a - frakcja zna mury) |
| D41 grajek | 0-20 G (zakład) | - |
| D42 kupiec zbożowy | 10 G (Hanka) | handel zbożem: do ok. +30 G ponad skup |
| D43 matka i syn | 0 G | (wykup syna kosztuje 40 G) |
| D44 poborca | 0 G | 20 G za donoszenie |
| D45 trójka | 20 G (Borgar) | - |
| D46 szkatułka | 25-30 G | - |
| D47 Kompania | 10-20 G (zakłady) | (najęcie kosztuje 60 G) |
| W14 Poselstwo | 60 G | - |
| W15 Święte kości | 25 G (Augustyn) | 80 G od Baltazara, 30 G od Gaspara |
| W16 Dezerter | 0 G | 60-80 G od Szczerby |
| pula losowa | ok. 50 G przez 20 promów | - |
| Renoma (napiwki) | ok. 30-60 G | - |
| **razem** | **ok. 320 G pewne** (13% długu; realnie, bez kompletu spraw, 200-300 G) | **+ ok. 270 G, razem do ok. 590 G** (24%) - ale chciwe wybory wykluczają dobre zakończenia i kosztują Opinię, przyjaciół i Akt III |

Wydatki (ujścia złota): wykup syna Urszuli 40 G, najęcie Kompanii 60 G, nocleg w pokoju obok podejrzanego (8-20 G), przemyt
dezertera przez Baltazara 50 G. **Żadnych odpisów długu** od podróżnych. Pieniądze z wyborów dają się zarobić dopiero od dnia 25 -
pod koniec rozdziału - więc nie przyspieszają mocno spłaty.

### 1.7 Noc

- Podróżni śpią 23-7 w swoich pokojach (świece w pokojach już palą się nocą - zdarzenia mapy `<LightWhen:night>`).
- Wyjątki z danych: nocne kroki (I4), narady (I2), kradzieże (I3, W14), burdy Kompanii do 1:00, sen Tymona z krzykiem.
- **Bohater śpiący w wynajętym pokoju** może zostać obudzony tylko przez zdarzenie intrygi (kroki, pukanie, krzyk): „Kroki na
  korytarzu...” - „Wstań po cichu” / „Śpij dalej”. Wstanie przerywa sen (odpoczynek tylko za przespany czas). Najwyżej jedna pobudka
  na noc. Sen w pokoju dalej jest bezpieczny (bez wilków), jak w TavernLife.
- Nocą wszystkie światła to ogień: świeca w ręku idącego, kaganki na korytarzach, kominki. Idący ze świecą widzi bohatera w promieniu
  światła (ok. 3 pól), w ciemności z bliska (1,5 pola, przy skradaniu C - 1 pole).
- Napad z Aktu III czeka, aż bohater zejdzie (jak dotąd, `docs/AKT3.md`); podróżni tej nocy siedzą w pokojach (oprócz Kompanii,
  gdy najęta).

### 1.8 Odpływ i powroty

- W dniu odjazdu: rachunek u Borgara (napiwek do utargu), droga, molo 14:00, prom 15:00. Bohater na przystani widzi scenę odjazdu.
- **Sprawa nierozwiązana:** podróżny z zadaniem w toku zostaje **jeden prom dłużej, raz** (popup u góry: „Teofil zostaje do dnia
  25.”), jeśli limit pozwala. Potem odpływa: zadanie kończy się „bez końca” (notatka w dzienniku, Renoma -2), a łańcuchy mają swoje
  zakończenia „bez bohatera” (rozdz. 4).
- **Powroty:** Tobiasz (regularnie), Konstanty (fala 4), Teofil (druga wizyta), Zenon i Gaspar (gdy nie zdemaskowani), Albin (Akt II,
  jako zwiadowca), Kompania (Akt III, gdy najęta). Powracający pamiętają bohatera (stan w zapisie).

### 1.9 Zapis gry

- Jeden klucz: `Tawerna.state("podroznicy")`, wersja 1:

  ```js
  { seed,                                   // ziarno puli (raz na zapis)
    last: 0,                                // ostatni zaplanowany dzień promu
    obecni: { teodor: { od: 16, do: 22, pokoj: "22", wizyta: 1, zostal: 0 }, ... },
    byli: { teodor: [{ od: 16, do: 22 }] },
    ksiega: { "22": "teodor", zloty: "posel", "1": "rafal" },
    pula: { "19": ["flisak", "kowal"] },     // kto z puli przypłynął w dniu (powtarzalne z ziarna)
    renoma: 30, renomaLog: [], utarg: 0,
    intrygi: { szkatulka: { wariant: "A", ... }, trojka: { ... }, kroki: { noc: 0 }, listy: [] },
    widziane: { sceny: {}, historyjki: {} } }
  ```

- Rekordy zadań (K71... W16) - jak każde zadanie: `_tw.townQuests.q` przez silnik `Watki.js`. Flagi dla innych wtyczek (Akt III,
  epilog) - w `TownQuests.state().flags`, jak dotąd.
- **Stare zapisy:** brak klucza = nowy stan z `last` = dzisiejszy dzień (nikt nie przypływa „wstecz”). Postaci, których okno minęło,
  przypływają po kolei, jedna na prom. Zapis w środku dnia promu: planowanie już zrobione (`last`) - nie powtarza się.
- Zmiana kształtu w przyszłości: `wersja` + 1 i migracja (rdzeń, `docs/ARCHITEKTURA.md` rozdz. 4).

### 1.10 Zasady stałe (sprawdzane przy każdym tekście i scenie)

- Bohater jest nastolatkiem: **zero romansów i treści seksualnych**. Urszula mówi do niego „synku”, Szczerba i Kompania traktują go
  jak dzieciaka, który ma odwagę. Nikt nie częstuje go wódką - bohater pije mleko albo wodę (czego Kompania nie rozumie).
- Woda rzadka celowo: nikt jej nie daje, nikt jej nie sprzedaje bohaterowi; zadania mogą wodę **brać** (medyk).
- Każde światło to ogień (świece, kaganki, kominki, pochodnie) - żadnych magicznych poświat.
- Braki (złoto, rzeczy, woda, zajęty pokój) - zawsze popup nad bohaterem.
- Tylko klawiatura: O - akcja / dalej, P - wstecz / pomiń, C - skradanie, przytrzymane P - pomiń całą scenę.
- Wszystkie nowe postacie: PixelLab w stylu bohatera; popiersia malowane kodem (`tools/busts/kit.py`), pasujące do sprite'a.
- Map001, Map025, Map026 (i inne mapy gracza) - **bez zmian w plikach**: wszystko przez `Tawerna.inject`, dane miejsc i znaczniki,
  które stawia gracz (lista w rozdz. 6.7).
- Ludzie nie zabijają (Humans.js: pokonany jest obrabowany) - także w scenach podróżnych.

---

## 2. Obsada

Dwanaście postaci z zadaniami (na start sześć: Tobiasz, Konstanty, Teofil, Zenon, Urszula, Jędrek - reszta w etapach 4-6) oraz
postaci łańcuchów. Opisy do PixelLab po angielsku są gotowe do wklejenia (styl: postać bohatera, `style_character_id`
`bf29bbe1-35e0-4a01-b0e8-f8b502b9f196`, płótno 64×64, stopy na tej samej linii co `Hero_Walk.png`). Do każdego opisu dopisać na końcu
to samo: *„full body, standing, neutral pose, muted earthy medieval palette”*.

> **Uwaga - imiona:** w grze jest już kamerdyner **Teodor** (zastępca Feliksa), dwie **Haliny** i dwóch **Witów**. Kartograf nazywa się
> **Teofil Cyrkiel** (decyzja gracza 8, 2026-10-28). Pozostałe imiona są wolne.

---

### 2.1 Tobiasz Goniec - posłaniec z kontynentu

- **Wygląd (PL):** chudy chłopak ok. 20 lat, granatowy płaszcz jeździecki ochlapany błotem, wielka skórzana torba z listami przez
  pierś, filcowy kapelusz z szarym piórem, wysokie zdarte buty, czerwona chusta na szyi, szybka wesoła twarz.
- **PixelLab (EN):** *lanky courier about 20 years old, mud-spattered dark-blue riding coat, big leather letter satchel worn across
  the chest the whole time, wide felt hat with a grey feather, tall worn boots, red neckerchief, quick friendly face*
- **Charakter i głos:** gaduła, zawsze w biegu, zna plotki z całego lądu - ale cudzy list to dla niego świętość.
  - „Tobiasz, poczta lądowa! Kto tu jest Hanką Mączną? Mam dla niej list i trzy pozdrowienia od siostry.”
  - „Listu nie otwieram. Raz otworzyłem. Potem przez rok nosiłem listy tylko do siebie.”
  - „Wojna jest tam, gdzie nie ma poczty. Póki ja chodzę, jeszcze nie jest najgorzej.”
  - „Prom za cztery godziny, a ja mam jeszcze cztery adresy. Pomożesz? Dwa grosze od listu.”
- **Kiedy i gdzie:** prom 4 (pierwszy stały gość - przy nim Borgar pokazuje księgę), potem co 9-12 dni (13, 25, 37, 46, 55), gdy
  jest miejsce. Pokój 23. Rynek, ratusz, Podgrodzie, przystań; wieczorem przy barze.
- **K71 „Listy z lądu”** (prom 4-7):
  1. Tobiasz daje bohaterowi cztery listy (rzeczy `v:list_*`): **Hanka** (od siostry: mąka na lądzie po 9 groszy - „chleb tu
     jeszcze podrożeje”), **sołtys** (pismo z lądu: „przyjąć ludzi z promu” - zapowiedź fali z dnia 10), **Marta Ługowa** (list do
     Jana od jego brata z lądu - Jan nie żyje; Marta nie umie czytać, bohater czyta jej na głos; brat pyta, czy zagroda stoi),
     **„Do kamerdynera dworu, do rąk własnych”** (rachunek ze sklepu na lądzie: papier, lak, atrament - „na kopy”).
  2. Piąty list - „Do Ludmiły z Olchowej, gdy przypłynie” - Tobiasz zostawia Borgarowi. W dniu 10 Ludmiła go dostaje (od siostry,
     o Marku nic). Małe wejście W6.
  3. Wybór przy liście kamerdynera: doręczyć / otworzyć nad parą (Czujność 6+: bez śladu; mniej - Feliks widzi naruszoną pieczęć:
     flaga `w7FeliksCzujny`) / pokazać Lordowi („Feliks kupuje papier? Pisze mi rachunki, dobry człowiek.”).
  4. Wrócić do Tobiasza przed promem 7 (14:00).
  - **Nagrody:** 2 G za list + 4 G za komplet (12 G), XP 40, Renoma +2. Otwarty list albo pokazany Lordowi - poszlaka W7 „papier
    na kopy” (Feliks pisze dużo listów: jedna z obserwacji do „Dwóch żyć Feliksa”).
- **K72 „Poczta z lądu”** (przy każdym powrocie, powtarzalne): 2-3 listy po wyspie z puli adresatów (mieszkańcy, przystań,
  garnizon, latarnia, pustelnia); 2 G za list. Treści to drobne sekrety mieszkańców (jak listy kruka). W dniu 13 jeden list jest do
  brata Kleofasa z klasztoru w Lipnicy - zapowiedź W15.
- **Powiązania:** W7 (poszlaka), D21 (brat Jana Ługa), W6 (list Ludmiły), W15 (Lipnica). Opcjonalnie (po etapie refaktoru W10):
  po K71 Tobiasz nosi listy bohatera do matki za darmo i bez czytania przez celnika - trzecia droga obok promu i kutra Rocha.

### 2.2 Konstanty Mak - medyk z kontynentu

- **Wygląd (PL):** chudy mężczyzna ok. 45 lat, długi ciemnozielony płaszcz, lniany fartuch, okrągłe druciane okulary, krótka siwa
  broda, torba z ziołami i fiolkami u pasa, pęk suszonych ziół przy pasku.
- **PixelLab (EN):** *thin physician about 45, long dark-green coat, white linen apron, round wire spectacles, short grey beard,
  leather bag with herb bundles and small glass vials at the hip, dried herbs tied to the belt*
- **Charakter i głos:** rzeczowy, zmęczony, ironiczny; wierzy w czystą wodę i mydło, nie w amulety. Szanuje babkę Jadwigę i Jagnę,
  „choć baby gadają do ziół”.
  - „Ręce. Pokaż ręce. Brudne. Pół gorączek tego świata siedzi pod paznokciami.”
  - „Wody nie mam, chłopcze. Nikt tu nie ma. Dlatego liczę ją na kubki jak złoto.”
  - „Na lądzie leczyłem żołnierzy. Tu przynajmniej nikt mnie nie pyta, kogo wolno ratować.”
  - „Amulet? Amulet pomaga sprzedawcy amuletów.”
- **Kiedy i gdzie:** prom 7 (do 13), wraca z falą 4 (52-58). Pokój 11 (z kominkiem: „ogień do wrzątku”). Rano przyjmuje chorych w
  Pokoju myśliwskim tawerny (8-11, Borgar dał mu kąt), po południu obóz pod murem (od dnia 10), wieczorem sala.
- **D39 „Gorączka z promu”:**
  1. Z promu 7 schodzi chory flisak Gerwazy (pula). Medyk prosi o krwawnik ×3 i czosnek ×2 (zbieractwo).
  2. Do naparu potrzeba **2 porcji czystej wody** - z bukłaka albo wiadra bohatera (nikt jej nie da; brak - popup).
  3. Noc przy chorym (Pokój myśliwski, 1-3 godz. siedzenia): o 2:00 zmiana okładu - wybór „zimny okład” (dobrze) / „ciepły koc”
     (gorzej: chory zdrowieje dzień dłużej, medyk wzdycha).
  4. Rano sołtys chce zamknąć flisaka w szopie przy pochylni („zaraza!”): stanąć za medykiem (Opinia 20+ albo jego słowa - Opinia
     +3) albo się zgodzić (flisak zdrowieje wolniej, medyk chłodny).
  5. Opcja: zapoznać medyka z babką Jadwigą (Podgrodzie) - razem robią syrop z dziurawca (dodatkowy przepis).
  - **Nagrody:** 15 G, XP 100, Renoma +3, **przepisy**: napar z krwawnika (gorączka), maść z babki (leczy rany), opatrunek z lnu
    (bandaż bez znachorki); z Jadwigą - syrop z dziurawca.
- **K74 „Obchód”** (powrót z falą 4): gorączka w obozie - roznieść leki do trzech namiotów (10 G, XP 60).
- **Powiązania:** W6 (obóz; D10 - gorączka Eli: napar medyka to druga droga do `v:lek`), K41 (znachorka), paczka A (Jagna), potrzeby
  (woda).

### 2.3 Teofil Cyrkiel - kartograf

- **Wygląd (PL):** krępy mężczyzna ok. 50 lat, brązowa kamizelka na kremowej koszuli z podwiniętymi rękawami, palce w atramencie,
  sznur mierniczy i mosiężny kompas u pasa, skórzana tuba z mapami na plecach, łysy z siwymi bokami, krzaczaste brwi.
- **PixelLab (EN):** *stocky cartographer about 50, brown waistcoat over a cream shirt with rolled-up sleeves, ink-stained fingers,
  coiled measuring cord and a brass compass at the belt, leather map tube on his back, bald with grey hair on the sides, bushy eyebrows*
- **Charakter i głos:** pedant zakochany w liczbach, głuchy na politykę, liczy kroki.
  - „Sześćset dwanaście kroków od bramy do studni. Twoje miasto jest krzywe, chłopcze. Pięknie krzywe.”
  - „Mapa nie kłamie. Kłamią ci, którzy ją zamawiają.”
  - „Tu, gdzie stoi tawerna, na starych planach był mur. Gruby. Bardzo gruby. Ciekawe, prawda?”
  - „Zapłacono mi za wybrzeże. Ale kto przepływa morze i nie rysuje gór?”
- **Kiedy i gdzie:** prom 16 (do 22), druga wizyta 40-46. Pokój 22 (dwa okna - światło do rysowania). Rynek i mury (mierzy sznurem -
  scena), Palarnia i czytelnia (rysuje 15-19), sala wieczorem.
- **D40 „Mapa dla kartografa”:**
  1. **Pomiary:** szkice z pięciu miejsc - lista dobierana z tego, czego bohater jeszcze nie zna (przewaga nowych: Pustelnia,
     Urwisko - baszta, Latarnia - laterna, Garnizon - wieża, kamieniołom, krąg menhirów). Na miejscu O w „punkcie widokowym”
     (miejsce zadania, wstawiane jak 951-959) - popup „Szkic: Urwisko Kruków”.
  2. Oddać szkice (Palarnia, 15-19). Rozmowa o „murach pod tawerną” (zapowiedź W4).
  3. Wybór: pokazać mu mapę z wraku (przedmiot 178), jeśli bohater ją ma. Teofil: „Ta ręka... wojskowy kreślarz z lądu. Robi
     kropki jak oczy.” - **poszlaka W12 „kartograf”** (`Wrak.addClue`). Ansgar (Eryk Sowa) boi się Teofila; gdy Ansgar jest
     sojusznikiem - scena dwóch kartografów przy jednym stole.
  - **Nagrody (wizyta 1):** 30 G, XP 120, Sława +3, Renoma +3; na mapie wyspy **„Szkic kartografa”**: drogi z czasem przejścia, a
    miejsca jeszcze nieznane, do których prowadzi droga, mają na karcie jedno zdanie Teofila zamiast samego „?”.
  4. **Wizyta 2 (40-46):** przywozi gotową „Mapę Kruczej Wyspy” (pamiątka - do powieszenia w chatce) i pyta o siedem miejsc, gdzie
     „stare linie murów się schodzą” (te same co znaki białego oka na mapie z wraku). Wybór:
     - a) pomóc mu narysować „Twierdzę” - kupcy z lądu ją kupią: +25 G, flaga `mapaTwierdzy` (Akt III: frakcja zna mury - rozdz. 4.4);
     - b) przekonać, by stare mury ominął (wymaga 2+ kart kronik D23 albo Hartu ducha 6+; Kleofas: „nie wszystko trzeba rysować”) -
       epilog: mapa bez twierdzy;
     - c) zabrać mu nocą szkic twierdzy z tuby (przeszukanie; złapany - Renoma -3).
  - **Nagrody (wizyta 2):** mapa-pamiątka, XP 100.
- **Powiązania:** mapa wyspy (zakładka „Mapa”, `MapaWyspy.js`), W12 (dwóch kartografów), W4 i W9 (mury pod tawerną), D23 (Kleofas),
  Akt III. Historyjka H4 (rozdz. 8).

### 2.4 Jędrek Dudarz - wędrowny grajek

- **Wygląd (PL):** żylasty mężczyzna ok. 40 lat, łatana kamizelka (czerwone, ochrowe i zielone łaty) na lnianej koszuli, dudy z
  koziej skóry pod pachą, filcowa czapka ze wstążkami, zarost, szeroki uśmiech, łapcie.
- **PixelLab (EN):** *wiry travelling musician about 40, patched colourful vest (red, ochre and green patches) over a linen shirt,
  Polish bagpipe with a goatskin bag carried under his arm the whole time, floppy felt cap with ribbons, stubble, wide grin, bast shoes*
- **Charakter i głos:** wesoły, chełpliwy, złośliwy wobec „karczemnych śpiewaczek”; pod spodem żołnierski grajek, który grał w
  obozach przed bitwą.
  - „Lutnia? Lutnia to dla panienek. Dudy budzą umarłych i dzieci sąsiada.”
  - „Grałem w obozie pod Brzozową Wolą. Ludzie tańczyli, bo rano mieli umierać. Wiesz, jak się wtedy gra?”
  - „Twoja Melia śpiewa o Kruczych Skałach? U nas w wojsku śpiewali to samo. Tylko słowa brzydsze.”
  - „Za grosz zagram wesoło. Za dwa - smutno. Smutne trudniej.”
- **Kiedy i gdzie:** prom 31 (do 43, po Nocy Kupały); od 22, gdy trwa W3. Pokój 17. Rynek w dzień targowy (gra za grosze), Sala ze
  sceną wieczorem, gdy Melia nie śpiewa.
- **D41 „Pieśń z lądu”:**
  1. **Scena dla dwojga:** Jędrek chce grać tam, gdzie Melia; Borgar: „Jedna scena.” Wybór:
     - pogodzić ich (rozmowa z obojgiem: Melia 18-21, Jędrek 21-23): zaufanie Melii +5, Renoma +3;
     - zawody na głosy gości (scena, rozdz. 8): wygrywa Melia (zaufanie +10) albo Jędrek (Melia -5, ale zwrotka od razu); zakład
       10-20 G;
     - odprawić go (Renoma -2, zadanie kończy się bez zwrotki).
  2. **Zwrotka z lądu:** Jędrek zna wojskową wersję „Pieśni o Kruczych Skałach” - śpiewa ją za dzban miodu pitnego albo po wygranej
     w kości (nowy rywal TavernDice). **Gdy bohaterowi brakuje którejś z sześciu zwrotek W3, Jędrek daje jej wariant** (flaga
     `verse_<klucz>`, w dzienniku „z lądu”) - siatka bezpieczeństwa dla trudnych źródeł (kronika dworu, Ozzy o 2:00). Gdy bohater
     ma wszystkie - zwrotka „wojskowa” mówi, że Czarne Oczy znają pieśń (notatka; finał W3 - ludzie Baltazara wiedzą, czego szukać).
  3. Noc Kupały (42): gra przy ognisku. Publiczny finał W3 weselszy (Opinia +2); przy walce z ludźmi Baltazara ucieka („dudy
     szkoda”).
  - **Nagrody:** XP 100, Natchniony po jego grze (własny tekst), zakład, zwrotka.
- **Powiązania:** W3 (zwrotki, Kupała), Melia (zaufanie), TavernDice, W16 (grał pod Brzozową Wolą). Historyjka H8.

### 2.5 Zenon Sita - kupiec zbożowy

- **Wygląd (PL):** tęgi mężczyzna ok. 55 lat, bordowy płaszcz z futrzanym kołnierzem, szeroki pas z sakiewką i mosiężną wagą, worek
  zboża na ramieniu, gładko ogolony podwójny podbródek, płaski kaszkiet.
- **PixelLab (EN):** *portly grain merchant about 55, fine burgundy coat with a fur collar, wide belt with a coin purse and a small
  brass scale, a sack of grain on his shoulder, clean-shaven double chin, flat cap*
- **Charakter i głos:** uprzejmy jak waga - zawsze trochę na swoją korzyść; o ludziach mówi jak o workach.
  - „Susza to nie nieszczęście, młodzieńcze. Susza to cena.”
  - „Woda? Mam beczki z lądu. Wojsko płaci z góry. Ty nie jesteś wojskiem.”
  - „Kupię twój jęczmień. Po sześć... no, po siedem. Dla przyjaciela.”
  - „Chleb drożeje sam. Ja tylko stoję obok.”
- **Kiedy i gdzie:** prom 10 (z falą 1; do 16), wraca 46-52 tylko niezdemaskowany. Pokój 20. Rynek (Hanka, kantor), garnizon (w
  drodze), sala przy barze.
- **D42 „Zboże w suszę”** (daje **Hanka**, nie Zenon): „Skupuje zboże od biednych z Podgrodzia po groszu, a mnie mąka drożeje.”
  1. Dowiedzieć się, komu sprzedaje (dwie drogi z trzech): podsłuch narady Zenona z Kłosem w Jadalni prywatnej (dzień 12, 20:00 -
     I2), przeszukanie pokoju 20 (umowa: „cztery wozy dla chorągwi królewskiej, piąty - kantor Vey”), śledzenie o 11:00 do
     garnizonu (skradanie).
  2. Wybór:
     - a) ujawnić na zebraniu u sołtysa: Opinia +5, Zenon odpływa promem 13 i nie wraca, Hanka daje 10 G i bochen;
     - b) sprzedać mu swoje zboże: jego cena ×1,3 bazy, **najwyżej 20 sztuk przez cały pobyt** (osobno od limitu Kłosa); Hanka
       zawiedziona (Opinia -2);
     - c) wymusić 4 worki dla obozu (warunek: bohater zna umowę): obóz najedzony, zaufanie obozu W6 +1 (druga droga do D27);
     - d) powiedzieć Kłosowi, że wiesz: Kłos milknie, skup ×1,2 jak po D27.
  - **Nagrody:** XP 100-120 + jak wyżej. Beczki z wodą Zenona nigdy nie trafiają do bohatera (umowa z wojskiem) - woda jako władza.
- **Powiązania:** W5 (kantor i zboże, rozdz. 3 W5 - zboże z pieczęcią), D27 (Zboże dla obozu), W6, skup garnizonu, Hanka.

### 2.6 Urszula z Olszynki - kobieta szukająca syna

- **Wygląd (PL):** zmęczona kobieta ok. 40 lat, spłowiała szaroniebieska suknia, brązowa wełniana chusta na ramionach, biała chustka
  na głowie, mały tobołek na plecach, zdarte buty, w ręku złożony list, dobra, smutna twarz.
- **PixelLab (EN):** *tired peasant woman about 40, faded grey-blue dress, brown wool shawl over the shoulders, white headscarf, small
  cloth bundle on her back, worn shoes, holding a folded letter, kind sad face*
- **Charakter i głos:** cicha i uparta, nie prosi o litość; w każdym chłopaku widzi syna - do bohatera mówi „synku” i się poprawia.
  - „Antek. Szesnaście lat, wyższy od ciebie, pieg na nosie. Widziałeś?”
  - „Na lądzie mówią, że chłopców biorą do wojska królewskiego. Wsiadłam na prom, zanim zdążyłam się bać.”
  - „Twoja matka też gdzieś stoi przy drodze i patrzy na każdego chłopaka. Pamiętaj o tym, synku.”
  - „Prom przypłynął. Pójdę popatrzeć. Zawsze chodzę popatrzeć.”
- **Kiedy i gdzie:** prom 22 (do 31; dłużej, gdy syn się znajdzie). Pokój 21 (najtańszy). W każdy dzień promu 9-15 na molo (patrzy na
  twarze - scena), rynek przy werbowniku, kąt sali (szyje dla Borgara za pokój), brama garnizonu.
- **D43 „Matka szuka syna”:**
  1. Rozpytać o Antka (dwie poszlaki z trzech): rotmistrz Bełza (na liście zaginionych go nie ma), werbownik Bęben (księga
     poborowa, D26: „Antoni z Olszynki, zaciężny, wpisany na wyspie” - pod nazwiskiem Kmiotek), Darin albo Rafał (widzieli chłopaka z
     piegiem na promie).
  2. Garnizon: Antek wśród rekrutów (aktor sceny na Map162, grafika rekruta garnizonu). Wstydzi się: „Zaciągnąłem się, żeby mama
     miała żołd. Nie każ mi do niej iść.”
  3. Wybór:
     - a) namówić go na spotkanie (Hart ducha 5+ albo przeczytany list matki z W10: „Moja też pisze. Wiesz, co bym dał, żeby
       przyszła?”) - scena przy bramie garnizonu;
     - b) wykupić go: Bełza „wypisze go za czterdzieści groszy albo za przysługę” (40 G albo przychylność 40+);
     - c) zostawić wybór Antkowi: zostaje w wojsku, matka błogosławi go przy bramie i odpływa (przychylność +5);
     - d) przemilczeć: Urszula odpływa w dniu 31, nic nie wiedząc (notatka, smutny epilog).
  - **Nagrody:** XP 150, Opinia +3 (a, b), Renoma +4; **żadnego złota** - to nie ta sprawa.
- **W10 (bez nowych faktów):** gdy bohater przeczytał już pierwszy list matki, Urszula mówi: „Przy taborze na północ prała kobieta w
  chuście w czerwone kwiaty. Mówiła, że ma syna za morzem.” Przy odjeździe zabiera list bohatera „do rąk, bez celnika” (opcjonalnie,
  jak u Tobiasza).
- **Powiązania:** W10 (lustro losu bohatera), D26 (lista poborowa), garnizon. Historyjka H1.

### 2.7 Erazm Łaska - poborca podatku wojennego

- **Wygląd (PL):** szczupły mężczyzna ok. 35 lat, czarny kubrak z białym kołnierzem, mały pomarańczowy feniks wyszyty na piersi (znak
  Korony), księga pod pachą, żelazna szkatuła, cienki staranny wąsik, czarny kapelusz.
- **PixelLab (EN):** *thin royal tax collector about 35, black doublet with a white collar, small orange phoenix badge on the chest,
  ledger book under the arm, small iron strongbox, neat thin moustache, black brimmed hat*
- **Charakter i głos:** chłodny, grzeczny, ciekawski; bez złej woli, ale z ołówkiem.
  - „Korona nie pyta, skąd pieniądze. Korona liczy.”
  - „Wasz Lord płaci za chorągiew w zatoce. Pytanie, czym płaci.”
  - „Nie przyjmuję prezentów. Zapisuję je.”
  - „Ty tu pracujesz, chłopcze. Wiesz, kto chodzi po schodach o północy?”
- **Kiedy i gdzie:** prom 34 (do 40 - przed przypomnieniem Lorda z dnia 40). Pokój 4 (z kominkiem; ściana z pokojem 2 - podsłuch).
  Dwór 8-12 (w drodze), Jadalnia prywatna (obiad, liczenie), pokój wieczorem (pisze raport przy świecy).
- **D44 „Podatek wojenny”:**
  1. Erazm pyta bohatera: „Kto przychodzi do dworu nocą?” - oferuje 20 G za donos (pokusa, można odmówić).
  2. Podsłuch (noc 36, 23:00, z pokoju 2 albo spod drzwi): Feliks przynosi „resztę podatku”; część monet ma znak oka (jak monety
     z wraku, W12). Erazm: „Pan kamerdyner płaci w obcej monecie?” - „Kupcy z lądu płacą, czym mają.”
  3. Erazm pisze raport: „Pan Zaleski płaci podatek srebrem wroga.” Wybór:
     - a) powiedzieć Lordowi o monetach: poszlaka W7 `w7PoborcaMonety` (jedna z obserwacji do „Dwóch żyć Feliksa”); Lord: „Feliks?
       Niemożliwe” - ale sprawdza szkatułę;
     - b) powiedzieć Erazmowi, że to Feliks, nie Lord: raport o kamerdynerze - gdy W7 skończy się prawdą, Korona od razu oczyszcza
       Lorda; przychylność garnizonu +5;
     - c) wziąć 20 G i donieść, co się wie: Feliks wyczuwa, że ktoś gada (`w7FeliksCzujny`);
     - d) milczeć: raport idzie, garnizon chłodny dla Lorda; po prawdzie W7 Lord: „Korona myślała, że to ja...”.
  - **Nagrody:** XP 120 + jak wyżej. Bez odpisów długu. W liście Lorda z dnia 40 dopisek o poborcy (gdy D44 trwało) - dlatego tak
    naciska.
- **Powiązania:** W7 (Feliks, Lord, podatek wojenny ze `STORY.md`), garnizon, W12 (monety z okiem).

### 2.8 Albin, „pątnik” - naprawdę Ragnar Holm, zwiadowca Czarnych Oczu

- **Wygląd (PL):** szczupły mężczyzna ok. 35 lat, habit z niebarwionej wełny z kapturem, sznur zamiast pasa, wysoki kij pielgrzymi,
  muszla na ramieniu, drewniany różaniec, sandały, czujne oczy, czarny rzemień na szyi.
- **PixelLab (EN):** *lean pilgrim about 35, coarse undyed wool robe with a hood, rope belt, tall pilgrim staff, scallop shell on
  the shoulder, wooden prayer beads, sandals, sharp watchful eyes, thin black cord around the neck*
- **Charakter i głos:** łagodny, uprzejmy, za bardzo ciekawy kamieni; dotyka murów jak ktoś, kto liczy.
  - „Idę do świętych Kruczych Skał. Na lądzie mówią, że tu ziemia pamięta.”
  - „Piękne kamienie w waszej tawernie. Stare. Niektóre... ze znakiem?”
  - „Nie pytać o to, czego nie chce się wiedzieć. Ładne powiedzenie. Kto je wymyślił?”
  - (nocą, zza ściany, w obcej mowie - w dzienniku szyfr, który czyta Ansgar)
- **Kiedy i gdzie:** prom 37 (z falą 3; do 46). Pokój 15 (przy galerii i schodach). Mury i ogród rycerzy (liczy kamienie z krukiem),
  dzwonnica (pyta Ambrożego o sygnały), stary cmentarz, nocą korytarz i drzwi piwnicy.
- **Zadanie:** to rozdział 1 łańcucha **W14 „Poselstwo”** (rozdz. 4.1) - „Kim jest pątnik?”. Poszlaki (3 z 6): odcisk cięciwy na
  palcu (Czujność 6+ w rozmowie), różaniec z paciorkami w kształcie oczu (przeszukanie), nocna rozmowa pod oknem z kurierem (I2),
  Ansgar-sojusznik rozpoznaje go („To Holm. Zwiadowca. Płynął drugim statkiem.”), Ambroży („pytał o sygnały dzwonu”), Borgar
  („dwa razy pytał o piwnicę”).
- **Akt II:** niezdemaskowany wraca przed Aktem III jako zwiadowca (`pielgrzymDonosi`, rozdz. 4.4).
- **Powiązania:** W14, W4 (krata, piwnica), W12 (Ansgar), W2 (sygnały), Akt III.

### 2.9 Gaspar Lis - handlarz relikwii

- **Wygląd (PL):** krzykliwy mężczyzna ok. 45 lat, fioletowy płaszcz ze złotą lamówką, mnóstwo tanich amuletów i medalików na szyi,
  drewniana skrzynka-taca na pasie z małymi relikwiarzami, podkręcony wąs, wysoka czerwona filcowa czapka.
- **PixelLab (EN):** *flashy relic seller about 45, purple coat with gold trim, many cheap amulets and medallions around the neck,
  wooden tray box on a neck strap holding tiny reliquaries, curled moustache, tall red felt cap*
- **Charakter i głos:** kaznodzieja-kramarz, czarujący, wierzy w każdą swoją bajkę, póki płacą.
  - „Kość palca świętego strażnika Kruczych Skał! Za dotknięcie grosz, za kość - porozmawiamy.”
  - „Odłamek Serca w srebrze. Sam go nie dotykam - nie chcę wiedzieć, jak umrę.”
  - „Fałsz? Chłopcze, wiara nie pyta o rachunek.”
  - „Masz coś starego? Z krukiem? Płacę jak za relikwię.”
- **Kiedy i gdzie:** prom 13 (Wielkanoc 13-16, targ 14; do 25). Pokój 12. Kram na rynku w dni targowe i święta, sala (sprzedaje
  gościom), wieczorem kantor (w drodze).
- **Zadanie:** łańcuch **W15 „Święte kości”** (rozdz. 4.2). W Akcie II, niezdemaskowany, wraca ze „szkiełkami z latarni” (echo W11).

### 2.10 Brat Augustyn - wizytator z klasztoru w Lipnicy

- **Wygląd (PL):** stary zakonnik ok. 65 lat, prosty czarny habit, biały sznur, tonsura z białymi włosami, oprawna w skórę księga pod
  pachą, laska, małe okrągłe okulary. (Inny niż Kleofas - niebieski habit - i Ambroży - szara szata.)
- **PixelLab (EN):** *elderly monk about 65, plain black habit, white rope belt, tonsure with white hair, leather-bound book under his
  arm, walking stick, small round spectacles*
- **Charakter i głos:** łagodny, uczony, uparty jak grzech; wierzy, że księgi są bezpieczniejsze „w murach” na lądzie.
  - „Klasztor w Lipnicy stał czterysta lat. Biblioteka - trzysta. Ludzie z okiem potrzebowali jednej nocy.”
  - „Szukam ksiąg, które nam zabrano. I ksiąg, których nikt nie powinien mieć.”
  - „Twój pustelnik pisze szyfrem? Mądry człowiek. My pisaliśmy po łacinie i to nie pomogło.”
  - „Synu, prawda nie jest towarem. Nawet jeśli dobrze się sprzedaje.”
- **Kiedy i gdzie:** prom 19 (do 28). Pokój 16. Stary cmentarz (groby braci - modlitwa), dzwonnica, pustelnia (w drodze), Palarnia i
  czytelnia, kantor (pyta Baltazara).
- **Zadanie:** łańcuch **W15**. **Lore:** Lipnica to klasztor, w którym leżały karty brata Dobiesza i który Czarne Oczy obrabowały
  (`STORY.md`: „po stuleciach te karty znalazły w klasztorze na lądzie Czarne Oczy”). Historyjka H3.

### 2.11 Tymon Wrzos - dezerter

- **Wygląd (PL):** młody żołnierz ok. 22 lat, podarta i brudna biała tunika wojska królewskiego z pomarańczowym feniksem, zerwane
  naszywki, obandażowane lewe przedramię, krótkie ciemne włosy, zarost, nawiedzone oczy, prosty brązowy płaszcz narzucony na wierzch.
- **PixelLab (EN):** *young soldier about 22, torn and dirty white royal army tunic with an orange phoenix, rank insignia ripped off,
  bandaged left forearm, short dark hair, stubble, haunted eyes, plain brown cloak thrown over*
- **Charakter i głos:** nerwowy, uczciwy do bólu, wstydzi się; podskakuje na dźwięk bębna werbownika.
  - „Nazywam się Tomek. Tomasz. Z... nieważne skąd.”
  - „Kazali nam stać, kiedy płonęła wieś. Staliśmy. Potem ja już nie umiałem stać.”
  - „Bęben. Słyszysz? Nie mów nikomu, że się trzęsę.”
  - (tylko po decyzji gracza, rozdz. 10) „Chorągiew brzozowska stała na lewym skrzydle. Ich nie zabijali. Brali. Całymi rzędami.”
- **Kiedy i gdzie:** prom 25 (fala 2, w tłumie uchodźców; najdalej do 37). Pokój 5 pod fałszywym imieniem (ściana z pokojem 3 -
  krzyczy przez sen). O świcie przy studni (pierze bandaż), obóz pod murem (Rafał: „chodzi jak żołnierz”), nocą kuchnia (chleb - I4).
- **Zadanie:** łańcuch **W16 „Dezerter”** (rozdz. 4.3). Historyjka H2.

### 2.12 Szczerba (Dobrawa) - łowczyni nagród

- **Wygląd (PL):** twarda kobieta ok. 40 lat, blizna przez policzek, ciemny skórzany płaszcz, kusza na plecach, krótko obcięte
  siwiejące włosy, kajdany i zwinięty list gończy u pasa, ciężkie buty.
- **PixelLab (EN):** *tough bounty hunter woman about 40, scar across the cheek, long dark leather coat, crossbow on her back, short
  cropped grey-streaked hair, iron manacles and a rolled wanted poster at the belt, heavy boots*
- **Charakter i głos:** chłodna, uczciwa wobec umowy, nie lubi zabijać, szanuje odwagę; z bohaterem rozmawia rzeczowo.
  - „Szukam człowieka. Nie ciebie. Jeszcze.”
  - „List mówi: żywy albo martwy. Ja wolę żywych. Więcej płacą i mniej ważą.”
  - „Każdy ma cenę, chłopcze. Twoja to pewnie ciepła kolacja.”
  - „Twój dezerter uciekł z pola. Ja kiedyś też. Różnica: mnie nikt nie szukał.”
- **Kiedy i gdzie:** prom po Tymonie (28; do 34, do 37, gdy go nie znajdzie). Pokój 6 (widok na korytarz południowy). Pokój myśliwski
  w sali przy drzwiach (patrzy na wejście), molo w dni promu (sprawdza wsiadających), garnizon, obóz pod murem.
- **Zadanie:** łańcuch **W16**.

### 2.13 Postaci łańcuchów i grupa

| postać | wygląd (PL) | PixelLab (EN) | głos |
|---|---|---|---|
| **Poseł Adam Wierzbięta** (W14) | dostojny, ok. 60 lat, długa szata w barwach Korony (biel i pomarańcz), płaszcz z futrem, srebrny łańcuch urzędowy, siwa bródka, teczka z pieczęciami | *dignified royal envoy about 60, long white-and-orange robe, fur-trimmed cloak, silver chain of office, grey goatee, leather document case with red wax seals* | „Korona nie przyjechała negocjować. Przyjechała pomóc panu Zaleskiemu zrozumieć.” / „Złoty apartament? Liczyłem na pałac. Zadowolę się złotem.” / „Ten list jest wart więcej niż wasza wyspa, karczmarzu.” |
| **Gwardzista Ostap** (W14) | rosły, ok. 30 lat, stalowy napierśnik na białej tunice z feniksem, halabarda, kapalin, gruby wąs | *big royal guardsman about 30, steel breastplate over a white tabard with an orange phoenix, halberd, kettle hat helmet, thick moustache* | „Dalej nie wolno.” / „Pan poseł śpi. Ja nie.” / (po Kupale) „Jedno piwo... za króla...” |
| **Wolna Kompania** (D47): Hubert Szary, Jasiek Brzytwa, Kazik Kołek, Ruda Hela | najemnicy w szarych płaszczach - **bez PixelLab**: grafika najemnika z Humans.js (`$Human_Merc*`) przekolorowana kodem | - | „Kompania nie walczy za darmo. Ani za mało.” / „Grum? Znamy Gruma. Kiedyś był nasz.” / „Mleko? Chłopak pije mleko! Borgar, daj mu dwa!” |
| **Ksenia Żuraw** (D46) | wdowa po kupcu korzennym, ok. 50 lat, ciemnozielona suknia, czepiec, pierścienie | jedno z ciał puli (kobieta) w bogatych kolorach | „Karczmarz odpowiada za rzeczy gości. Tak jest na całym lądzie.” |
| **„Gość spod trójki”** (D45) | nikt go nie widzi; gdy już - chudy mężczyzna w czerni, sadza na rękach | ciało puli w czerni | (milczy; mamrocze liczby) |
| **Antek** (D43) | rekrut garnizonu | grafika rekruta z Garnizonu (bez PixelLab) | „Mama tu? Nie... nie każ mi.” |

---

## 3. Intrygi na piętrach

Siedem intryg. Dwie z nich to **mechanizmy** używane przez wiele spraw (I2 podsłuch, I5 list pod drzwiami), pięć to sprawy z własnym
zadaniem albo częścią łańcucha.

### I1 „Gość spod trójki” (D45)

- **Kiedy:** prom 46-52 (koniec rozdziału 1) albo Akt II; warunek: bohater wynajął już pokój choć raz.
- **Przebieg:**
  1. Borgar: „Ktoś wziął trójkę na trzy noce. Zapłacił z góry. Obcą monetą.” - pokazuje monetę z okiem (poszlaka W12, jeśli bohater
     jej nie ma). **Pokój 3 zajęty** - bohater go nie wynajmie.
  2. Gość nie schodzi. Taca z jedzeniem pod drzwiami rano nietknięta, wieczorem pusta. Nocą (1-3) drapanie i stukanie „jakby w
     kominie” (słychać przy pokojach 1 i 5).
  3. Poszlaki (3 z 5): sadza na progu i w korytarzu (rano, O na plamie); w piwnicy tawerny (Map009) cienki sznur z ołowianką zwisa z
     dziury w sklepieniu nad beczkami (rekwizyt wstawiany); podsłuch z pokoju 1 (ściana 1|3): „trzydzieści jeden... trzydzieści dwa
     sążnie”; dziurka od klucza nocą (skradanie pod drzwiami: krótkie ujęcie - człowiek w czerni spuszcza linę w komin); Ansgar
     (sojusznik): „Mierniczy. Liczą, jak głęboko są sklepienia.”
- **Rozwiązanie (do odjazdu):**
  - a) Borgar: wściekły, wyważa drzwi razem z bohaterem (scena), gość ucieka oknem, zostaje notes „31 sążni do sklepienia, krata
    zakonu pod beczkami” - `pomiaryPrzejete`; Renoma +6, 20 G, Borgar ufa bohaterowi bardziej (W4: liczy się jak „prawda o jego
    nocach”);
  - b) kapral Wit albo garnizon: aresztowanie na molo w dniu odjazdu (przychylność +5, Renoma +3);
  - c) samemu zabrać notes, gdy śpi (4-5 rano, skradanie; obudzi się - ucieka z notesem);
  - d) nic: odpływa z pomiarami - `pomiaryWyszly` (Akt III, rozdz. 4.4).
- **Mechanika:** zajęty pokój bohatera (księga), podsłuch (I2), skradanie przy drzwiach, rekwizyt w piwnicy, czas (trzy noce).

### I2 „Rozmowa przez ścianę” - mechanizm podsłuchu

- **Gdzie:** ściany wspólne pokoi, liczone z prostokątów planu karczmy (PLAN_DATA) - bez znaczników na mapach:

  | ściana | kto obok (przykład) |
  |---|---|
  | pokój 1 \| pokój 3 | „gość spod trójki” (I1) |
  | pokój 3 \| pokój 5 | Tymon śni o wojnie (W16) |
  | pokój 2 \| pokój 4 | poborca i Feliks (D44) |
  | komnata \| pokój 24, komnata \| salonik gości | pula, narady |
  | jadalnia \| Złoty salonik (Map026) | poseł (W14) |
  | drzwi każdego zajętego pokoju (od korytarza) | słabiej: co druga kwestia |

  Na parterze (Map001): Jadalnia prywatna - rozmowa przy stole słyszana od drzwi (D42).
- **Jak:** bohater w swoim pokoju (albo w korytarzu przy drzwiach) twarzą do ściany - O: **„Przyłóż ucho”** (przykuca). Rozmowy są
  w danych: pokój, dzień albo warunek, godziny, lista kwestii. Kwestie płyną w przygaszonych dymkach „(zza ściany)” co ok. 2 s.
- **Czujność:** słowa kluczowe w danych są w `{nawiasach}`; poniżej progu Czujności (zwykle 5) zastępuje je „...”. Wysoka Czujność =
  pełna poszlaka; niska = połowa (poszlaka ze słabszym wpisem, czasem potrzebna druga).
- **Hałas:** ruch (W/A/S/D) przerywa. W korytarzu bez skradania - co kwestię 30% szans, że w środku usłyszą („Kto tam?”): milkną;
  rozmowa jednorazowa przepada - poszlaka jest wtedy z innego źródła (każda sprawa ma co najmniej dwa).
- **Gdy nikt nie rozmawia:** „Cisza. Ktoś chrapie.” / „Ktoś przewraca kartki.” / „Nic.” (pusty pokój).
- **Skutek:** notatka w dzienniku „Podsłuchane: ...” z nazwą sprawy.
- **Używają:** D42, D44, D45, W14 (narada, pątnik pod oknem), W15 (Gaspar z kurierem), W16 (Tymon przez sen). To uogólnienie
  ściany z W8 (`w8Wall`: Map025, 22-24, wynajęty pokój, 5 s słuchania).

### I3 „Skradziona szkatułka” (D46)

- **Kiedy:** prom 16-22. Właścicielka: pani **Ksenia Żuraw**, wdowa po kupcu korzennym (pokój 18).
- **Przebieg:** noc 19/20 szkatułka znika z jej pokoju. Rano krzyk na korytarzu (scena). Borgar blady: „Karczmarz odpowiada za rzeczy
  gości.” Ksenia daje termin: odpływa promem 22 o 14:00 - do tego czasu szkatułka albo 60 G od Borgara (Renoma -6).
- **Podejrzani (trzej):** Szymek (złodziejaszek z K37 - „widzieli go na schodach”), łaziebna Wanda (sprząta piętro rano, ma klucze),
  Gaspar (był w dzień u Kseni „pokazać relikwie”).
- **Trzy warianty** (los z ziarna zapisu; te same miejsca poszlak, inna treść):

  | wariant | kto | poszlaki | gdzie szkatułka |
  |---|---|---|---|
  | A | sama Ksenia (chce pieniędzy od Borgara; jest winna Gasparowi) | zamek otwarty kluczem, nie wyłamany; wosk jej świecy w kominku (spaliła spis zawartości); Gaspar: „pani Ksenia jest mi winna za relikwiarz”; podsłuch spod drzwi: „...Borgar zapłaci, ma pieniądze z pokoi...” | w jej własnym kufrze, pod podwójnym dnem |
  | B | Gaspar (dla „relikwii” w szkatułce) | zapach kadzidła w pokoju 18; czerwona nitka z jego czapki na klamce; Szymek widział „pana w fioletach” o 2:00 | w jego skrzynce-tacy, pod fałszywymi kośćmi |
  | C | flisak z puli (odpływa promem 22) | ślady smoły z łodzi na podłodze; Janek: „flisak pytał, który pokój ma bogata pani”; Wanda: „okno na korytarzu było otwarte” | w jego worku na molo - trzeba zdążyć przed 14:00 (celnik Sambor pomaga, jeśli bohater go zna) |

- **Złe oskarżenie:** Opinia -5, Renoma -5; Szymek - zaufanie obozu W6 -1; Wanda - łaźnia droższa przez tydzień; Gaspar - nie
  rozmawia (W15 trudniejsze).
- **Dobre:** Renoma +6, Sława +3, XP 150, 25 G od Borgara (A) albo 30 G od Kseni (B, C).
- **Mechanika:** rozmowy, przeszukanie (1.5), podsłuch, termin (prom), pościg na molo (C).

### I4 „Nocne kroki” (K73)

- **Kiedy:** pierwszy raz w noc, gdy bohater śpi w wynajętym pokoju, a ktoś ma nocne wyjście; potem przy każdej sprawie, która go
  potrzebuje (najwyżej raz na noc).
- **Przebieg:** dźwięk kroków budzi: „Kroki na korytarzu...” - „Wstań po cichu” / „Śpij dalej”. Bohater w ciemnym pokoju (świeca
  zgaszona), C - skradanie. Na korytarzu idzie ktoś ze świecą: widać go z daleka, on widzi bohatera tylko w kręgu światła. Śledzenie
  jak za Kubą w W1 (2-6 pól, nie wejść w krąg).
- **Kto idzie** (dane, wg tego, kto jest na wyspie):
  - Ozzy lunatyk - pierwszy raz zawsze on, gdy nikt inny nie ma wyjścia: schodzi do sali i śpiewa przez sen (gdy brakuje zwrotki
    Ozzy'ego W3 - ta sama zwrotka, bez miodu);
  - Tymon do kuchni po chleb (W16 - można go nakarmić: zaufanie);
  - Albin do drzwi piwnicy - liczy kroki, dotyka zamka (W14);
  - Gaspar albo Ksenia (I3, wariant B / A);
  - Kompania - psikus (koza w łaźni Wandy; Renoma -1, bohater może ją wyprowadzić: +1).
- **Złapany:** idący się odwraca, wymówka („Szukam wychodka.”), wraca do pokoju; poszlaka przepada na tę noc.
- **Nagroda:** poszlaka sprawy; za pierwsze udane śledzenie XP 40 (K73).

### I5 „List pod drzwiami” - kanał

- **Kiedy:** rano (6-10) po nocy bohatera w wynajętym pokoju: przy drzwiach leży list (rekwizyt wstawiany). O - czytanie (okno bez
  mówcy), notatka w dzienniku.
- **Kto pisze** (dane z warunkami):

  | od kogo | treść | odpowiedź |
  |---|---|---|
  | Tymon (W16) | „Pokój 5. Po północy. Proszę. - T.” | rozmowa o północy |
  | Szczerba (W16) | „Wiesz, gdzie jest. 60 groszy i nikt się nie dowie. Odpowiedź: kubek do góry dnem na ladzie.” | opcja w menu Borgara „Odstaw kubek do góry dnem” |
  | Albin (W14) | „O drugiej pod drzwiami piwnicy. Sam. Przyjaciel zakonu.” | gdy bohater pójdzie, nikt nie przychodzi, a jego pokój zostaje przeszukany - Albin szukał wisiorka z krukiem (wisiorek w plecaku - bezpieczny; poszlaka: pątnik szuka kruków) |
  | rywal W9 (Akt II, wg drużyny) | Grum: „Nie schodź jutro. Dołem idą ludzie z okiem.” / ludzie Lorda: „Jaśnie pan prosi, byś najpierw przyszedł do niego.” / Baltazar: „Mój towar na dole jest mój. B.V.” / Czarne Oczy: kartka z okiem i krucze pióro | - |
  | Urszula (po D43) | podziękowanie | - |

### I6 „Poselstwo w Apartamencie Złotym”

Środek łańcucha W14 (rozdz. 4.1). Mechanika: **wejście na piętro II bez Sławy 80 przez służbę** - Borgar prosi: „Zanieś posłowi
kolację, 20:00” (taca), odźwierny otwiera złotą kratę na dzwonek (zdarzenie „Dzwonek na odźwiernego” już stoi na Map025); podsłuch z
jadalni (ściana z Złotym salonikiem); kradzież listu w Noc Kupały; śledztwo dnia 43; pościg na molo przed promem 43.

### I7 „Wolna Kompania” (D47)

- **Kiedy:** prom 28 (do 37), gdy W8 rozpoczęte albo od dnia 31. Czworo najemników w pokojach 9 i 10.
- **Przebieg:** wieczorami w Pokoju gier (kości, rzutki, siłowanie z Grumem - zna ich), hałas do 1:00, burdy (Renoma -1 za noc,
  gdy nikt ich nie uspokoi), Melia nie może śpiewać (D41), straszą Ozzy'ego.
- **Wybory:**
  - a) pokonać Huberta w siłowanie na rękę (rywal mocniejszy niż Tadek) albo w kości - szacunek, cichną (Renoma +4);
  - b) bójka na pięści na dziedzińcu, jeden na jednego (Humans.js, bez broni): wygrana - szacunek; przegrana - obrabowany jak zawsze,
    śmiech, ale też szacunek („bo się nie bał”);
  - c) kapral Wit: wyrzuca ich za mur, odpływają promem 31 i pamiętają: `kompaniaWroga` (Akt III); Renoma +2;
  - d) najmij ich: żołd 60 G z góry; obiecują wrócić, „gdy dzwon zadzwoni trzy i jeden”: `kompaniaNajeta` (Akt III);
  - e) Grum (sojusznik W8) przemawia im do rozsądku - cisza bez walki.
- **Nagrody:** XP 120, Renoma; zakłady 10-20 G; najęcie to świadomy wydatek 60 G.
- **Powiązania:** Akt III (obrońcy albo napastnicy), W8 (Grum), D41 (scena), TavernDice i siłowanie.

---

## 4. Łańcuchy

Każdy łańcuch to zadanie typu W (dziennik: FABUŁA) z rozdziałami jako krokami silnika `Watki.js`. Każdy ma zakończenie „bez
bohatera” - gdy bohater nic nie zrobi, sprawa i tak się kończy, tylko gorzej.

### 4.1 W14 „Poselstwo” (wysłannik + strażnik + fałszywy pielgrzym; wojna o Serce, Lord)

| dzień | co się dzieje | gdzie |
|---|---|---|
| 37 (prom, fala 3) | **rozdz. 1** - Albin przypływa z uchodźcami; modli się przy murach | przystań, mury |
| 37-40 | poszlaki „Kim jest pątnik?” (2.8): podsłuch, nocne kroki, Ansgar, Ambroży, Borgar | tawerna, miasto |
| 39 | Borgar: „Złoty od jutra dla posła Korony.” Księga: rezerwacja | tawerna |
| 40 (prom) | **rozdz. 2** - poseł Wierzbięta i Ostap. Scena przybicia: chorągiewka z feniksem, Feliks wita w imieniu Lorda (albo drugi kamerdyner, gdy Feliksa już nie ma) | przystań |
| 40-43, 20:00 | Borgar prosi o kolację do Złotego (służba = wstęp na piętro II) | Map026 |
| 41, 21:00 | **rozdz. 3** - narada w Wielkim salonie: poseł i Lord (i Feliks, jeśli jest). Podsłuch z jadalni, gdy bohater sprząta po kolacji | Map026 |
| 42 (Noc Kupały) | **punkt zwrotny** - Ostap pije przy ognisku (albo z Kompanią); Albin kradnie list. Bohater przy ognisku W3 - nie widzi; w tawernie - może zobaczyć (I4) | Map026 |
| 43 rano | poseł odkrywa kradzież; Ostap podejrzewa bohatera („nosił kolację!”): oczyścić się poszlakami albo Borgar ręczy (Renoma 50+) | tawerna |
| 43, 9-14 | **rozdz. 4** - śledztwo: wosk świecy posła na schodach galerii, kreda z ogrodu rycerzy na sandałach Albina, ślady przy złotej kracie (odźwierny spał), Ansgar czyta szyfr z notatek Albina, list w pustym kiju pielgrzymim | tawerna, pokój 15 |
| 43, 14:00 | Albin chce odpłynąć - pościg na molo (celnik, strażnik przystani); albo zostaje i chowa list | przystań |
| 43-46 | **rozdz. 5** - co z listem; poseł odpływa 46 | |

**Treść listu:** Korona żąda od Lorda „drzwi pod skałą” - w zamian umorzy podatek wojenny i da tytuł; termin do zimy; przy odmowie
chorągiew z zatoki „zaopiekuje się dworem”. Lord naiwny - pochlebia mu to; Lord sojusznik (W7) - odmawia ostrożnie.

| zakończenie | jak | skutki |
|---|---|---|
| list wraca do posła | znaleziony i oddany przed 46 | 60 G, Renoma +8, przychylność garnizonu +10, `poselWdzieczny` (Akt III: żołnierze królewscy przychodzą już przy przychylności 70) |
| list u Lorda | bohater czyta i zanosi Lordowi przed oddaniem | `w14LordWie` - Lord bliżej sojusznika (zlicza się jak „powiem wszystko” w W7, gdy W7 rozdz. 5 jest zrobione); poseł odpływa wściekły (przychylność -10) |
| kopia | przepisanie nocą w pokoju (papier i atrament, godzina; pomaga Tobiasz albo Kleofas) i zwrot | obie korzyści; przyłapany przez Ostapa (Czujność, skradanie) - Renoma -8, przychylność -10 |
| Albin złapany publicznie | Wit albo rotmistrz zabiera go do wieży | jego notatki (siedem miejsc - jak na mapie z wraku) czyta Ansgar albo Kleofas; `pielgrzymZlapany` (Akt III: fala 3 słabsza) |
| Albin uciekł z listem (bez bohatera) | nikt go nie zatrzymał | `poselstwoWyciek` (Akt III: +1 łucznik w fali 2), poseł oskarża Borgara: Renoma -10 (-3, gdy bohater wskazał winnego) |

Epilog (po Sercu): jedna linijka o pośle („Korona pamięta karczmę pod Kruczymi Skałami...”) wg zakończenia.

### 4.2 W15 „Święte kości” (handlarz + wizytator + Baltazar)

| dzień | co się dzieje | gdzie |
|---|---|---|
| 13 (prom, Wielkanoc) | **rozdz. 1** - Gaspar przypływa, rozkłada kram | rynek |
| 14 (targ) | scena: kazanie z „kością świętego strażnika”; Ozzy kupuje „odłamek Serca” za 3 G, Hanka medalik | rynek |
| 14-19 | „Fałszywe kości” - poszlaki fałszu (dwie z czterech): Ignac (kość barania), Tadek (srebro to cyna), Kleofas („zakon nie trzymał kości - trzymał pytania”), Melia (ballady nie znają świętych) | miasto, pustelnia |
| 16-19 | Gaspar prosi: „Przynieś coś starego z krukiem. Płacę 30 G.” (kamień z krukiem - z wraku, kopca, od Józka) | |
| 19 (prom) | **rozdz. 2** - brat Augustyn: „Ten człowiek sprzedaje księgi naszego klasztoru.” | tawerna |
| 20-22 | dowód: noc 22 Gaspar sprzedaje kurierowi Baltazara „spis z Lipnicy” (podsłuch pod oknem pokoju 12 albo przeszukanie skrzynki) | tawerna, kantor |
| 22-25 | **punkt zwrotny** - w skrzynce Gaspara: fałszywe kości, **jeden prawdziwy kamień z krukiem** (kupiony od Józka Łaty) i **„Spis biblioteki w Lipnicy”** z dopiskiem: „Karty brata Dobiesza - wyjęte. Ludzie z okiem, noc po świętym Marcinie.” | pokój 12 |
| 25 (prom) | Gaspar odpływa (albo zostaje zatrzymany) | przystań |
| 25-28 | **rozdz. 3** - z Augustynem: kamień, spis, Archiwum | |
| 28 | Augustyn odpływa (z księgami albo bez) | przystań |

| zakończenie | skutki |
|---|---|
| Gaspar zdemaskowany na rynku (dwie opinie + przeszukanie) | kupującym zwrot (Ozzy odzyskuje 3 G, Hanka medalik), Opinia +6, Renoma +3; Gaspar nie wraca |
| kamień z krukiem dla Kleofasa albo Ambrożego | Kleofas: zaufanie (D23 - liczy się jak karta do „Kleofas ci ufa”); Ambroży: zaufanie (Akt III - dzwoni sam) |
| kamień dla Baltazara | 80 G; `kamienBaltazar` - frakcja ma jeszcze jeden kamień (Akt III: wiedza, rozdz. 4.4) |
| kamień dla celnika | 5 G, legalnie (jak kamienie z wraku) |
| spis z Lipnicy dla Kleofasa | notatka „Jak Czarne Oczy dowiedziały się o Sercu” (lore), D23 - zaufanie |
| spis i kroniki dla Augustyna | gdy W2 rozdz. 6 zrobione i kroniki nie mają jeszcze właściciela: kroniki płyną na ląd (W2 ma nową opcję „oddać Augustynowi”); epilog: „klasztor w Lipnicy znów...” |
| puścić Gaspara za działkę | 30 G; Opinia -3, gdy Augustyn się dowie; Gaspar wraca w Akcie II ze „szkiełkami z latarni” |

Nagroda za łańcuch: 25 G od Augustyna (jałmużna klasztoru), XP 200 razem, Sława +3. Historyjka H3 (Lipnica) i H6 (kamień z krukiem).

### 4.3 W16 „Dezerter” (dezerter + łowczyni + garnizon + przemyt)

| dzień | co się dzieje | gdzie |
|---|---|---|
| 25 (fala 2) | **rozdz. 1** - Tymon w tłumie; 26 werbownik bije w bęben na rynku - Tymon drży (scena) | przystań, rynek |
| 25-28 | „Tomek z pokoju 5” - Rafał: „chodzi jak żołnierz”; Darin; podsłuch z pokoju 3 (krzyk przez sen „Nie podpalę!”); nocne kroki (chleb) | tawerna, obóz |
| 28 (prom) | **rozdz. 2** - Szczerba. Scena „łowczyni wchodzi do tawerny”; list gończy z feniksem: „Tymon Wrzos, 150 G, żywy” | tawerna |
| 28-31 | Szczerba wypytuje (bohatera też: 60 G za wskazanie); list pod drzwiami od Tymona; Bełza: „Dezerterów wieszają na lądzie. Na mojej wyspie... zobaczymy.” | |
| 31, noc | **punkt zwrotny** - Szczerba wie, który pokój (od bohatera, z plotki albo sama po trzech dniach); na korytarzu przed pokojem 5 (scena). Bohater w tawernie - może wejść między nich | Map025 |
| 31-37 | **rozdz. 3** - rozwiązanie | |
| 34 albo 37 | Szczerba odpływa (z Tymonem albo bez) | przystań |

| zakończenie | jak | skutki |
|---|---|---|
| pod opieką Bełzy | przychylność 50+, słowo bohatera, Tymon sam się zgłasza | Tymon odsługuje w garnizonie; `tymonGarnizon` (Akt III: przy przychylności 60+ przychodzi z żołnierzami); Szczerba odpływa bez nagrody; przychylność +5, XP 250 |
| przemyt | Baltazar (kantor otwarty, 50 G, „skrzynia” - jak Rafał) albo Roch (D20 zrobione, kuter w noc rejsu, za darmo) | Tymon na południu; kantor wie (Baltazar) albo przyjaźń Rocha; Szczerba patrzy krzywo na przystani |
| ukrycie do jej odjazdu | dzwonnica, chata dziadka, Kruczy Jar (jak Rafał: ryzyko przeszukania) | Tymon zostaje w obozie: `tymonOboz` (Akt III: obrońca obok Rafała) |
| wydanie Szczerbie | 60 G za wskazanie, 80 G za przyprowadzenie na molo | Tymon odpływa w kajdanach (scena), Opinia -4, obóz W6 chłodny (jak przy wydaniu Rafała); epilog |
| nic | Szczerba sama go znajduje w noc 31 | Tymon ranny, zabrany - bez złota dla bohatera |

**Zasada:** Szczerba zawsze bierze go żywego (proponuję - decyzja w rozdz. 10). Jedno zdanie o „chorągwi brzozowskiej” (jeńcy, nie
polegli) wzmacnia W10 bez rozstrzygania losu ojca - tylko za zgodą gracza. Historyjka H2 (pod Brzozową Wolą) i H7 (bęben).

### 4.4 Echa w Akcie III (`Act3_Data.js`)

Nowe flagi zmieniają napad tak jak dzisiejsze (`ansgarAlly`, `w9FrakcjaWie`, `w7FeliksDonosi`). **Limity, żeby napad nie stał się
niemożliwy:** z „wiedzy frakcji” najwyżej **+1 zwiadowca** (nożownik w fali 3) i najwyżej **+1 człowiek** w falach 2 i 4.

| flaga | skąd | skutek w napadzie |
|---|---|---|
| `kompaniaNajeta` | D47 d | 2 obrońców „Kompania” na dziedzińcu (Humans: najemnik, po stronie bohatera) |
| `kompaniaWroga` | D47 c | +1 najemnik w fali 4 (frakcja zapłaciła) |
| `tymonGarnizon` | W16 | żołnierze królewscy przy przychylności 60+ (zamiast 80) |
| `tymonOboz` | W16 | +1 obrońca z obozu (gdy Rafał też walczy) |
| `poselWdzieczny` | W14 | żołnierze królewscy przy przychylności 70+ |
| `poselstwoWyciek` | W14 | +1 łucznik w fali 2 |
| `pielgrzymDonosi`, `pomiaryWyszly`, `mapaTwierdzy`, `kamienBaltazar` | W14 Akt II, D45 d, D40 a, W15 | +1 zwiadowca w fali 3 (**jeden**, nie sumują się; jak `w9FrakcjaWie`) |
| `pielgrzymZlapany`, `pielgrzymZwiedziony` | W14 | fala 3 o jednego słabsza (jak `ansgarAlly`; nie sumuje się z nim) |
| `pomiaryPrzejete` | D45 a | stare drzwi przy piwnicy mocniejsze (+20 wytrzymałości) |

---

## 5. Poprawki niespójności W6

### 5.1 Fale nie wypadają w dni promu

**Stan dziś:** fale w dniach 10, 24, 38, 52 (`TownQuests_Data.js` CALENDAR, `Przystan.js` i `Garnizon_Data.js` - stała `WAVES`, W6
`w6Wave.enter` - `Math.max(24, day())`, `w6Second.show` - `day() < 24`). Prom pływa w dni 1, 4, 7 ... 22, 25 ... 37, 40 - **24 i 38
nie są dniami promu.** Widać to w grze: `Przystan.waveNow` pokazuje ludzi z promu tylko przy promie, więc w dniach 24 i 38 na molo
nikogo nie ma, a teksty mówią „Drugi prom, drugie tyle namiotów”.

**Wariant A (zatwierdzony 2026-10-28, zbudowany): fale 10, 25, 37, 52.**

- Jedno źródło prawdy: `CALENDAR.waves = [10, 25, 37, 52]` w `TownQuests_Data.js` i `TownQuests.waves()` / `isWave(d)`;
  `Przystan.js` i `Garnizon_Data.js` czytają z TownQuests (ich stała zostaje tylko jako zapas, gdy TownQuests nie ma).
- W6: `w6Wave.enter` - `Math.max(waves[1], day())`; `w6Second.show` - `day() < (r.t.waveDay || waves[1])`. Kalendarz:
  `{ day: 24 }` → 25, `{ day: 38 }` → 37. K49 „Tran dla latarni”: od dnia 25 (`latarnia.txt` `zadania.K49.when`, warunek oferty).
- Teksty: `{waveDay}` w W6 już jest zmienną - bez zmian. Dokumenty: `FABULA_I_PRZEJSCIE.md` (rozdz. 3), `QUESTY.md` 5.4.
- **Stare zapisy:** rekord W6 z ustawionym `r.t.waveDay` (24) zostaje taki, jaki był - `enter` już się wykonał; zapisy przed tym
  krokiem dostaną 25. Tydzień premii skupu garnizonu przesuwa się o dzień (25-31 zamiast 24-30) - nieszkodliwe. Nic się nie psuje.
- **Testy do poprawy:** `w6_test` (fala 24 → 25, zebranie 25 → 26, tydzień pracy 26-33; linie 143-194), `latarnia_test` (K49 od dnia
  25). `garnizon_test` (dzień 12 w tygodniu po fali 10) i `przystan_test` - bez zmian.
- Zysk: druga i trzecia fala przypływają naprawdę promem - podróżni z fal (Tymon, Albin) schodzą po trapie razem z uchodźcami.

**Wariant B (bez zmian w testach):** dni fal zostają, w dniach 24 i 38 przy molo staje **barka wojskowa z uchodźcami** (osobny statek,
nie prom). Potrzebna nowa grafika statku (ok. 9 generacji) i zmiana `waveNow` w Przystan.js; teksty „Drugi prom” → „barka”. Gorzej
pasuje do podróżnych (oni przypływają promem).

### 5.2 Obóz od dnia 10, a Ludmiła i Ela pod murem od dnia 1

**Stan dziś:** namiot i ognisko obozu pod murem (rekwizyty 903, 905) pokazują się od dnia 10 (`w6Camp.show`), a Ludmiła i Ela
(TownLife_Data) stoją pod murem od dnia 1; K27 (Ludmiła) od dnia 2, K28 od dnia 3; K5 (cztery bochny przed dziewiątą, codzienne od
dnia 1) ma Ludmiłę wśród adresatów. Szymek ma tytuł „chłopak z obozu pod murem”. Darin (Podgrodzie) jest od dnia 1.

**Wariant A (zatwierdzony 2026-10-28, zbudowany): Ludmiła i Ela przypływają z pierwszą falą (dzień 10).**

- TownLife: Ludmiła i Ela dostają `when: "w6Obecni"` = dzień ≥ 10 **albo** istnieje rekord K27, K28, D10, D4 albo K19 **albo** flaga
  `campInside` / `campOutside` (stare zapisy, w których już się poznali, zachowują je od razu).
- K27 od dnia 10 (było 2), K28 od dnia 11 (było 3).
- K5: przed dniem 10 czwartym adresatem (zamiast Ludmiły) jest **Kuba Woziwoda** - stoi przy studni na rynku 7-14, po drodze; od
  dnia 10 - jak dziś Ludmiła. Lista adresatów zależna od dnia (mała zmiana w `k5` albo dwie listy w danych).
- Szymek: tytuł „chłopak spod murów” (miejscowy ulicznik) - tylko tekst; jego plan bez zmian.
- **Rafał zostaje od dnia 1** - to dezerter z wyprawy kopaczy na wyspie, nie z promu (jego słowa: „Żołnierze szukali tu czegoś pod
  skałami. Kazali kopać. Uciekłem.”). Stodoła od dnia 1 pasuje.
- **Darin zostaje od dnia 1** - stary uchodźca Podgrodzia (trzeci rok wojny), namioty na Podgrodziu to osada wcześniejszych
  uciekinierów; jedna kwestia: „Uciekłem pierwszym promem” → „Uciekłem jednym z pierwszych promów, dwa lata temu.” (tylko tekst).
- **Scena dnia 10** (rozdz. 8): Ludmiła z Elą schodzą z promu z pierwszą falą; Tobiasz zostawił list „do Ludmiły z Olchowej” (K71).
- **Testy do poprawy:** `town_quests_test` (K5 dnia `dFerry + 2` z Ludmiłą; K27/K28 w dniu `dm + 1` = 8 → przesunąć za dzień 10),
  `regulars_test` (K27 w dniu 5 → 11), `clean_hud_test` (wiersze K5 - lista adresatów). `w6_test` zaczyna w dniu 12 - bez zmian.

**Wariant tani:** obóz istnieje od dnia 1 (rekwizyty od dnia 1: „przypłynęli tydzień przed tobą”), a pierwsza fala w dniu 10 dokłada
drugą rodzinę i namiot. Bez zmian w testach, ale fala 10 traci swoją wagę. Polecam wariant A.

---

## 6. Integracja techniczna

### 6.1 Nowe pliki

| plik | co | gdzie na liście wtyczek |
|---|---|---|
| `js/plugins/Podroznicy_Data.js` | dane: kalendarz obsady, pula, pokoje, plany dnia, rozmowy podsłuchu, warianty intryg, sceny i historyjki; mieszkańcy do `window.TownLifeExtra`; wątki silnika `Watki.watek(...)` (zadania do `TownQuestsPacks`) | pod `Wrak_Data` (nad TownLife i TownQuests), pod `Watki` |
| `js/plugins/Podroznicy.js` | silnik: planowanie promu, przybycia i odpływy, księga pokoi, Renoma, drzwi zajętych pokoi, przeszukanie, podsłuch, nocne kroki, listy pod drzwiami, sceny na mapie, F9, API `window.Podroznicy` | pod Przystan, Garnizon, Kantor, Wrak, Act3, TavernLife_Plan (`python tools/wtyczki.py --dodaj Podroznicy --po Przystan`) |
| `js/teksty/podroznicy.txt` | system, obsada, pula, K71-K74, D39-D47, intrygi | - |
| `js/teksty/poselstwo.txt`, `swiete_kosci.txt`, `dezerter.txt` | łańcuchy W14-W16 | - |
| `js/teksty/historyjki.txt` | napisy i dymki historyjek (rozdz. 8) | - |
| `img/characters/$Npc_<Klucz>.png` (14 + 4 ciała puli) | postacie | - |
| `img/pictures/<Klucz>_Bust.png` | popiersia (`tools/busts/make_<klucz>.py`, kit.py) | - |
| `img/pictures/Hist_*.png` | plansze historyjek | - |
| `img/characters/!$Podr_*.png` | rekwizyty (trap, bagaż, szkatułka, list, list gończy, przybory posła, kram, tuba z mapami) | - |
| `tests/podroznicy_test.js`, `tests/unit/podroznicy.test.js` | testy (6.9) | - |
| `tools/podroznicy/` | szkice, budowanie postaci (`tools/npc/build_npc.py`), plansze | - |

### 6.2 Silnik wątków i teksty (`docs/WATKI_DANE.md`)

- Cztery wątki w `Podroznicy_Data.js`, każdy z własnymi zadaniami (wzór 2.3a):
  - `Watki.watek({ id: "podroznicy", wtyczka: "Podroznicy", teksty: "podroznicy", stan: { klucz: "podroznicy", wersja: 1, domyslne },
    mowa: { akapity: true }, zadania: { K71, K72, K73, K74, D39 ... D47 }, rozmowy, akcje, f9, skoki })`;
  - `poselstwo` (W14), `swiete_kosci` (W15), `dezerter` (W16) - osobne pliki tekstów.
- Warunki z danych + haki wtyczki: `"podr:teodor"` (na wyspie), `"pokoj:3=trojka"`, `"podsluch:d44"` (podsłuchane), `"renoma>=50"`,
  `"wizyta:teodor=2"`. Rzeczy spoza bazy (`v:list_hanka`, `v:szkatulka`, `v:list_posla`, `v:notes_mierniczego`) - `vitems` paczki.
- Dawcy zadań = klucze mieszkańców TownLife (`teodor`, `urszula` ...) - oferty, znaczniki nad głową, dziennik i okienko celu działają
  same (TownQuests przez silnik).
- Teksty od razu w plikach, klucze po polsku (decyzja z `WATKI_DANE.md` 7a). Sprawdzenie: `node tools/teksty.js sprawdz podroznicy
  poselstwo swiete_kosci dezerter historyjki`.

### 6.3 TownLife - podróżni jako mieszkańcy

- Postaci przez `window.TownLifeExtra` (jak Eryk Sowa w `Wrak_Data.js`), każda ze stałym numerem z **nowego, czwartego zakresu
  3020-3049** (`TownLifeData.EXTRA_RANGES` += `[3020, 3049]`, wpis w `reserved` TawernaCore i w `docs/ARCHITEKTURA.md` §6):
  3020-3033 obsada (14), 3034-3037 Kompania, 3038-3041 cztery „miejsca puli” (mieszkańcy, którym Podroznicy przed wczytaniem mapy
  podmienia arkusz i imię), 3042-3049 zapas.
- `when: "podr_<klucz>"` - warunek rejestrowany przez Podroznicy (`TownLife.addCondition`): mieszkaniec jest tylko w czasie pobytu.
- Plan dnia z szablonu (1.4); „inside” w tawernie przez `indoor`: `podr_sala` → miejsce w sali (`podrozny_1..6`), `podr_pokoj` →
  miejsce w pokoju (`pokoj_<n>`). **Potrzebna jedna mała zmiana w TownLife:** `indoor` może być funkcją `(res, where) → nazwa
  miejsca` (pokój zmienia się z księgą). Bez tej zmiany - Podroznicy podmienia `res.indoor` przy każdym wpisie do księgi (działa, bo
  `placeIndoor` czyta je na bieżąco, ale to mniej czyste).
- Miejsca w pokojach: domyślnie w danych (`SPOTS_BY_MAP[25]`, `[26]` - przy świecy / kufrze każdego pokoju, np. pokój 4: 63,40;
  11: 18,62; 22: 13,8; Złoty salonik: 65,40); gracz może je przesunąć znacznikiem (6.7). Miejsc w sali **nie zgaduję** - Map001 to
  mapa gracza i stoły z `<Tavern:mealtable>` zajmuje bohater przy posiłku - potrzebne znaczniki gracza.
- Przyjazd i odjazd: `away` (dla miasta „w drodze”); na przystani grają aktorzy sceny (6.6).

### 6.4 TavernLife, plan karczmy, zmiana u Borgara (refaktor tawerny trwa - API do uzgodnienia)

Etap 1 (rozdz. 9) działa **bez** zmian w TavernLife: podróżni biorą tylko pokoje 4-24, więc nie ma konfliktu z wynajmem. Od etapu 3
(trójka, poselstwo) potrzebne są małe furtki - proszę refaktor tawerny o:

| furtka | po co |
|---|---|
| `TavernLife.addRoomGuard(fn(room) → { who, until } \| null)` | zajęty pokój 3 / Złoty: wynajem odmówiony popupem nad bohaterem, wiersz karty przygaszony |
| `TavernLife.addGatePass(fn() → bool)` | złota krata otwarta dla bohatera „w służbie” (W14) |
| `TavernLife.plan.addInfo(fn(floor, key) → linie)` | plan karczmy: kto mieszka w pokoju i do kiedy |
| zdarzenie szyny `served { service: "room" }` (jest) | listy pod drzwiami rano (I5) |
| `TavernShift.addTipBonus(fn() → G)` | napiwki wg Renomy (1.6) |

„Księga gości” w menu Borgara to zwykła opcja `Tawerna.talk.option` (bez zmian w TavernLife).

### 6.5 Rozmowy (`Tawerna.talk`, `docs/ROZMOWY.md`)

| poziom | co |
|---|---|
| `meet+5` (605) | pierwsze spotkanie podróżnego (raz, przed zadaniami) - przedstawia się |
| `quest` (500) | zadania podróżnych przez TownQuests (oferty, oddania, kroki) - jak u mieszkańców |
| `shop+25` (475) | menu podróżnego: „Skąd płyniesz?”, „Wieści z lądu”, handel puli, „Bywaj.”; inni mogą dopisać opcje |
| opcja `borgar` | „Księga gości”, „Odstaw kubek do góry dnem” (W16), „Zanieś kolację” (W14) |
| opcja `rotmistrz` | W16 (Tymon), D43 (Antek) - przez kroki zadań; jeśli menu rotmistrza nie bierze opcji, jedna linijka w Garnizon.js |

Aktorzy scen (przewoźnik, Antek, aktorzy przystani) - jeden właściciel: `Podroznicy.act(this, [...])`. `rozmowy_test` - dopisać
nowe poziomy do drabiny.

### 6.6 Numery zdarzeń

| numery | właściciel | mapy | co |
|---|---|---|---|
| **3002-3009** | Podroznicy | 125, 1, 25, 26, 8, 162 | aktorzy scen (przybycie i odjazd na przystani, korytarz nocą, Szczerba i Tymon, Antek) |
| **3010-3017** | Podroznicy | 125, 25, 26, 9, 8 | rekwizyty: trap promu, bagaże (2), szkatułka, list pod drzwiami, list gończy, przybory posła, sznur z ołowianką (Map009), kram Gaspara |
| 3018-3019 | Podroznicy | - | zapas |
| **3020-3049** | TownLife (czwarty zakres) | każda | podróżni jako mieszkańcy (6.3) |

Dziś wolne: 560-569 i od 3002 (`docs/ARCHITEKTURA.md` §6; Woz ma 3000-3001). Rejestr: `reserved` w `TawernaCore.js` + tabela w
ARCHITEKTURA. Wszystko przez `Tawerna.inject` - mapy gracza bez zmian.

### 6.7 Znaczniki do postawienia przez gracza (w edytorze)

Zdarzenia bez grafiki o nazwie „Miejsce: ...” (jak `gosc_1..8`). Kierunek grafiki zdarzenia = kierunek postaci.

| mapa | znaczniki | po co | bez znacznika |
|---|---|---|---|
| **Map001** (sala) | `podrozny_1` ... `podrozny_6` | miejsca podróżnych wieczorem. Propozycja: 2 w Palarni i czytelni (kartograf, wizytator), 2 w Sali biesiadnej, 1 przy kominku w Pokoju myśliwskim (łowczyni - widok na drzwi), 1 w Wielkiej sali przy barze | podróżni nie siadają w sali (są „u siebie” w pokoju) - **potrzebne** |
| Map001 | `kompania_1` ... `kompania_4` | Wolna Kompania w Pokoju gier | Kompania na `podrozny_*` |
| Map001 | `grajek` | Jędrek gra (obok sceny Melii) | gra przy barze |
| Map001 | `medyk` | kąt medyka w Pokoju myśliwskim (8-11) | `podrozny_5` |
| Map025 | `pokoj_4` ... `pokoj_24` | dokładne miejsce w pokoju | dane (przy świecy / kufrze) |
| Map025 | `korytarz_1` ... `korytarz_4` | trasa nocnych kroków (I4) | dane z planu korytarzy |
| Map026 | `posel_stol`, `posel_straz`, `salon_lord`, `salon_posel`, `jadalnia_sluzba` | stół posła w Złotym, gwardzista przy drzwiach, narada w Wielkim salonie, gdzie stoi bohater z tacą | dane (do sprawdzenia testem) |
| Map125 | `trap`, `molo_1` ... `molo_3`, `odprawa` | koniec trapu, gdzie stają przybyli, stolik celnika | dane z miejsc ludzi z promu (Przystan 761-762: 15,16 i 16,16) |

Nic na Map008 (miasteczko) - podróżni chodzą po istniejących miejscach TownLife.

### 6.8 Inne wtyczki - małe furtki

| wtyczka | co | uwagi |
|---|---|---|
| TownQuests (+_Data) | `CALENDAR.waves`, `waves()`, `isWave(d)`; K5 adresaci wg dnia; K27/K28 dni | poprawki W6 (rozdz. 5) |
| TownLife_Data | `EXTRA_RANGES` += [3020, 3049]; Ludmiła i Ela `when`; teksty Darina i Szymka | |
| TownLife | `indoor` jako funkcja (6.3) | jedna linijka |
| Przystan | fale z TownQuests; (później) dodatkowi nosiciele listów W10: `Przystan.addCarrier` | po etapie refaktoru W10 |
| Garnizon_Data | fale z TownQuests | |
| Act3_Data | wpisy obrońców i dodatków fal z flagami (4.4) - albo `Act3.addDefender` / `addExtra` | Act3 w refaktorze wątków: tylko skoki i teksty |
| Wrak_Data (+wrak.txt) | poszlaka `kartograf` w CLUES; W12: dwie z sześciu | `Wrak.addClue` już jest |
| MapaWyspy | „Szkic kartografa”: `addCardLine(fn)`, `addHint(fn)` | karta miejsca już pokazuje ludzi z TownLife |
| TavernDice_Data | rywale: Jędrek, żołnierz z puli, kostkarz | dane |
| TavernLife_ArmWrestle | rywal Hubert Szary (siła) | parametr |
| Journal | zakładka „Wspomnienia” (`Journal.addTab`) z „Obejrzyj jeszcze raz” (O) | refaktor UI - do uzgodnienia |
| Prologue | odtwarzacz historyjek: `Prologue.play(sceny, { onEnd })` | rozdz. 8.2 |
| SpeechBubbles | popiersia nowych postaci (`BUSTS`, jak Pustelnia) | `talk_busts_test` wymaga popiersia każdego mieszkańca |
| CleanHUD | pasy kinowe na żądanie: `$gameTemp._hudCinema` + własne pasy jak `Underground.film` (albo `CleanHUD.kino(on)`) | refaktor UI |

### 6.9 F9 („Wyspa i fabuła”, sekcja „Podróżni” z `Watki.f9`)

- „Następny prom teraz” (planowanie + scena na przystani), „Przypłyń: <postać>” (◀ ▶ wybór, O - przypływa dziś, pokój z księgi),
  „Odpływ wszystkich”, „Księga pokoi: wyczyść”.
- „Renoma +10 / -10”, „Ziarno puli: nowe”.
- „Intryga: I1 ... I7 - start” (ustawia dzień, gości i pokój), „Szkatułka: wariant A / B / C”.
- „W14 / W15 / W16: skok do rozdziału n” (`skoki` w danych wątków).
- „Scena: odtwórz <nazwa>”, „Historyjka: odtwórz <nazwa>”.

### 6.10 Testy (mało: jeden główny test + kilka sprawdzeń)

- **`tests/unit/podroznicy.test.js`** (bez przeglądarki, sekundy): kalendarz obsady na dni 1-61 (kto, kiedy, limity), pula z ziarna
  (powtarzalność), przydział pokoi (1 i 2 zawsze wolne, konflikty), Renoma i progi, limity flag Aktu III (najwyżej +1 zwiadowca),
  przesuwanie okien w starym zapisie.
- **`tests/podroznicy_test.js`** (port **9710**, ok. 4-5 min, ok. 40 sprawdzeń): nowa gra; dzień 4 - Tobiasz w księdze i w sali, K71
  do końca; skok F9 do dnia 13-22 - Gaspar, Teofil, Ksenia; szkatułka wariant A do końca (przeszukanie, termin); zapis i wczytanie w
  środku pobytu (te same osoby, pokoje, plany); podsłuch D44 (Czujność niska / wysoka); nocne kroki (śledzenie, złapany); zajęty
  pokój 3 - wynajem odmówiony popupem (gdy furtka TavernLife jest); W16 skokami do trzech zakończeń - flagi Aktu III; scena przybycia
  (pominięcie P, stan po pominięciu); odpływ z nierozwiązaną sprawą (zostaje raz).
- **Dotknięte zestawy** (po zmianach, raz na końcu - `feedback_fewer_tests`): `w6_test`, `latarnia_test`, `town_quests_test`,
  `regulars_test`, `clean_hud_test` (poprawki W6); `rozmowy_test` (nowe poziomy), `watki_test`, `talk_busts_test` (popiersia),
  `tavern_life_test` (furtki), `act3_test` (nowe flagi), `wrak_test` (szósta poszlaka), `wydajnosc_test` (6.11); narzędzie
  `node tools/audyt/przejscie.js` (nowe zadania: dawcy, godziny, przedmioty, miejsca).

### 6.11 Wydajność (`docs/WYDAJNOSC.md`)

- Planowanie promu raz dziennie (`dayStart`), plany przez TownLife (bez nowej pętli). Godziny scen i podsłuchów - `hourChange`.
- Na mapie jeden `onMapUpdate` co 30 klatek, i tylko na mapach 1, 25, 26, 125 (drzwi, listy, kroki); podsłuch liczy się tylko w
  trakcie słuchania. Ściany do podsłuchu policzone raz z PLAN_DATA przy starcie.
- Aktorzy scen i rekwizyty tylko w czasie sceny (inaczej ukryci i bez startu - `Tawerna.onEventStart` „hidden”).
- Dodatkowo w sali wieczorem najwyżej 5 postaci (4 podróżnych + grupa). **Nowy pomiar w `wydajnosc_test`:** tawerna o 20:00 z
  kompletem podróżnych i bywalców (CPU ×4) - budżet jak miasteczko (15 ms; cel ok. 9 ms). Budżetów nie luzujemy.
- Historyjki: osobna scena (jak prolog), plansze wczytywane przed startem, zwalniane po końcu.

---

## 7. Grafika postaci

### 7.1 Postacie PixelLab (styl bohatera)

Sposób jak przy Kleofasie, Ansgarze i garnizonie: `create_character` (pro, styl bohatera, 64×64, 8 kierunków) + chód (szablon
walking-8-frames), arkusz `$Npc_<Klucz>.png` przez `tools/npc/build_npc.py`. Dotychczasowy koszt: **18-22 generacji na postać**.

| # | postać | klucz | arkusz | dodatkowa poza (scena) | generacje |
|---|---|---|---|---|---|
| 1 | Tobiasz | `tobiasz` | `$Npc_Tobiasz` | - | 20 |
| 2 | Konstanty | `medyk` | `$Npc_Medyk` | - | 20 |
| 3 | Teofil | `kartograf` | `$Npc_Kartograf` | mierzenie sznurem (2 kierunki) | 20 + 6 |
| 4 | Jędrek | `grajek` | `$Npc_Grajek` | gra na dudach (v3, S i E) | 20 + 6 |
| 5 | Zenon | `zboze` | `$Npc_Zboze` | - | 20 |
| 6 | Urszula | `urszula` | `$Npc_Urszula` | - | 20 |
| 7 | Erazm | `poborca` | `$Npc_Poborca` | - | 20 |
| 8 | Albin | `pielgrzym` | `$Npc_Pielgrzym` | modli się, klęcząc przy murze | 20 + 6 |
| 9 | Gaspar | `relikwie` | `$Npc_Relikwie` | - | 20 |
| 10 | Augustyn | `wizytator` | `$Npc_Wizytator` | klęczy przy grobie (własna - inny habit niż Albin) | 20 + 6 |
| 11 | Tymon | `dezerter` | `$Npc_Dezerter` | - | 20 |
| 12 | Szczerba | `lowczyni` | `$Npc_Lowczyni` | mierzy z kuszy (scena na korytarzu, bez strzału) | 20 + 6 |
| 13 | poseł | `posel` | `$Npc_Posel` | siedzi przy stole, pisze (v3, 1 kierunek) | 20 + 4 |
| 14 | Ostap | `gwardzista` | `$Npc_Gwardzista` | - | 20 |
| 15-18 | ciała puli: mężczyzna w płaszczu, kobieta w chuście, starzec z laską, marynarz | `pula_m`, `pula_k`, `pula_s`, `pula_z` | `$Npc_Pula_*` + kolory kodem (8-12 wyglądów) | niesie bagaż (wszyscy, 1 sekwencja) | 4 × 18 + 12 |

**Razem postacie: 280 (obsada) + 84 (pula) = ok. 365 generacji bez póz scen; z pozami (+34) ok. 400.**
Bez PixelLab: Wolna Kompania (najemnik Humans.js przekolorowany), Antek (rekrut garnizonu), Ksenia i „gość spod trójki” (ciała puli).

### 7.2 Popiersia

Wszystkie kodem, **0 generacji** - `tools/busts/make_<klucz>.py` na bazie RTP i `kit.py`, jak 28 mieszkańców; sprawdzenie zgodności
ze sprite'em `python tools/busts/make_match.py po ...` (zasada z 2026-10-07: popiersie pasuje do mapy - włosy, broda, ubiór).

### 7.3 Pula generacji

Konto PixelLab: Tier 2, **5000 generacji na cykl, odnowienie 29.10** (dziś zostało 75 - za mało na cokolwiek z tego projektu). Wersja
oszczędna całego projektu (postacie bez póz + rekwizyty + 4 historyjki) to ok. 495 generacji, pełna (z pozami, wszystkie rekwizyty,
8 historyjek) ok. 670 - **10-13% puli jednego cyklu**. Szczegóły scen i historyjek: rozdz. 8.4.

### 7.4 Co można zrobić bez PixelLab

- Cały system i wszystkie sprawy na **zastępczych arkuszach** (ciała puli z kolorami albo istniejące postacie przekolorowane) - testy
  i rozgrywka od razu; grafiki wchodzą później podmianą pliku.
- Popiersia (kit.py), rekwizyty proste (list, list gończy, kubek, sznur - kodem z kafelków jak drogowskaz Spalonej zagrody), UI
  księgi gości, emotki, dymki, pasy kinowe, dźwięki (RTP).
- Historyjki w wersji „sepia”: zatrzymany kadr prawdziwej mapy z filtrem pergaminu i napisami (jak nazwa mapy „Kronika”) - 0
  generacji (rozdz. 8.2).

---

## 8. Prezentacja: sceny i historyjki

Dopisek gracza: „mogą być historyjki - zwykłe na mapie z nimi albo animowane - jakoś to ładnie przedstawić”. Dwa sposoby:
**sceny na mapie** (tanie, dużo) i **historyjki ilustrowane** (drogie, mało, dla najważniejszych chwil).

### 8.1 Sceny na mapie - środki, które gra już ma

| środek | skąd | jak w scenie |
|---|---|---|
| ruch postaci | trasy ruchu silnika, `TownLife.hold`, aktorzy 3002-3009 | schodzenie z trapu, skradanie, odwracanie głowy |
| miny / emotki | balony RPG Maker (`requestBalloon`): ! ? nuta złość pot ... żarówka Zzz (**bez serca** - zasada nastolatka) | zdziwienie, strach, „...” |
| dymki | SpeechBubbles (`say` nad mówiącym, rozmowy z popiersiami) | krótkie okrzyki bez zatrzymania; rozmowy z wyborem |
| kamera | polecenie „Przewiń mapę” (204) i powrót do bohatera | najazd na drzwi, molo, okno |
| pasy kinowe | jak nazwa mapy „Kinowy” (`Sprite_CleanCinema`, `$gameTemp._hudCinema` chowa HUD) albo pasy jak `Underground.film` | początek i koniec sceny |
| światło nocą | znaczniki `<Light>` na aktorach (świeca, kaganiec - zawsze ogień, migotanie) | nocne kroki, poseł przy świecy |
| deszcz, mgła | pogoda Survival / Storm, mgła morska Latarni | przybicie promu w deszczu, mgła o świcie na molo |
| dźwięk | SE i BGS (RTP): dzwon okrętowy, łańcuch, mewy, kroki, drzwi, pukanie, pióro, bęben | |

**Zasady scen:** każda raz (pamiętana w zapisie), pomijanie: krótko P - następne ujęcie, przytrzymane P - koniec (stan jak po całej
scenie: pozycje, flagi). Bez sceny w czasie walki i napadu. Sceny z danych (lista kroków jak w prologu: `kino`, `kamera`, `idz`,
`dymek`, `emotka`, `czekaj`, `dzwiek`, `swiatlo`, `pogoda`), wykonywane poleceniami silnika w interpreterze mapy (jak ujęcia
zakończeń w `Underground.film`). Na początek każda w Podroznicy.js; później warto wydzielić wspólną usługę scen dla całej gry.

**Przykłady (scenopis):**

1. **Prom przybija** (Map125, dzień promu, 9:00 - gdy bohater jest na przystani):
   pasy; kamera na molo; mewy, dzwon okrętowy, łańcuch; prom zwalnia (warstwa jak dziś „Prom”); trap (rekwizyt) opada; przewoźnik
   woła „Krucza Wyspa! Kto do lądu - za sześć godzin!”; podróżni schodzą po kolei z bagażem, każdy z jednym dymkiem (Tobiasz:
   „Poczta!”, Albin żegna się, Tymon ogląda się za siebie - emotka „...”); celnik Sambor przy stoliku: „Nazwisko? Cel?”; kamera
   wraca; pasy znikają. Ok. 20-30 s. W deszcz - deszcz; o świcie po mglistej nocy - mgła.
2. **Nocna kradzież na korytarzu** (Map025, ok. 1:30; bohater obudzony albo czuwa):
   ciemność; postać ze świecą sunie północnym korytarzem; staje przy drzwiach 18; przykuca (emotka „...”); drzwi; światło znika;
   kroki cichną; po chwili wraca z czymś pod pachą; zdmuchuje świecę - ciemność. Bohater może iść za nią (I4) albo zostać.
3. **Łowczyni wchodzi do tawerny** (Map001, wieczór, dzień 28):
   skrzypnięcie drzwi; kamera na sień; muzyka cichnie; goście odwracają głowy (emotki „...”); Szczerba idzie powoli do baru; kładzie
   list gończy na ladzie (rekwizyt); Borgar: „Czym mogę służyć?” - „Szukam człowieka.”; Melia przestaje grać; kamera wraca; muzyka
   wraca.
4. **Poseł przy świecy** (Map026, Złoty, 22:00; bohater z tacą w jadalni):
   świeca na stole, poseł pisze (skrzypienie pióra), gwardzista przy drzwiach; podsłuch przez ścianę (I2) w przygaszonych dymkach;
   płomień drga - emotka „!” - poseł: „Ktoś tu był?”; pieczęć (dźwięk), list do szkatuły.

**Kluczowe chwile (1-3 na postać, intrygę i łańcuch):**

| kto / co | sceny na mapie |
|---|---|
| Tobiasz | biegnie od domu do domu z torbą; czytanie listu Marcie na głos przy praniu |
| Konstanty | noc przy chorym flisaku (świeca, okład); spór z sołtysem przed tawerną |
| Teofil | mierzy rynek sznurem od bramy do studni (liczy na głos); dwóch kartografów przy jednym stole z Ansgarem |
| Jędrek | zawody z Melią (goście kiwają głowami, emotki nut); dudy przy ognisku Kupały |
| Zenon | waży zboże u Hanki (worek, waga, Hanka kręci głową); zebranie u sołtysa |
| Urszula | w dzień promu na molo patrzy w twarze (emotka „...” przy każdym); spotkanie z Antkiem przy bramie garnizonu |
| Erazm | liczy monety w Jadalni prywatnej; Feliks puka o 23:00 (podsłuch) |
| Albin | modli się przy murze, dotyka kamieni z krukiem; nocą liczy kroki do drzwi piwnicy |
| Gaspar | kazanie z kością na rynku (tłum, emotki „!”); Ozzy kupuje „odłamek Serca” |
| Augustyn | modlitwa przy grobach braci (dzwon „cztery i jeden” z daleka); rozmowa z Kleofasem przy pulpicie |
| Tymon | drży na dźwięk bębna werbownika; krzyk przez sen (podsłuch) |
| Szczerba | wejście do tawerny; noc na korytarzu przed pokojem 5 |
| I1 trójka | Borgar wyważa drzwi; sznur z ołowianką w piwnicy |
| I3 szkatułka | krzyk Kseni na korytarzu rano; oskarżenie przy barze (wszyscy patrzą) |
| I4 kroki | Ozzy lunatyk śpiewa przez sen przy pustej sali |
| I7 Kompania | burda w Pokoju gier (krzesło leci - emotki złości); siłowanie z Hubertem |
| W14 | przybicie posła z chorągiewką; narada w salonie przy świecach; pościg na molo przed promem |
| W15 | kazanie Gaspara; otwarcie skrzynki (fałszywe kości i jeden prawdziwy kamień) |
| W16 | Tymon w kajdanach na trapie albo Tymon przysięga przed Bełzą (zależnie od zakończenia) |
| fala 1 (W6) | Ludmiła z Elą schodzą z promu; Ela pyta „To tu nie ma wojny?” |

### 8.2 Historyjki ilustrowane i animowane

Wzór: film prologu „Ostatni prom” (`Prologue.js`, `docs/prolog/SCENOPIS.md`) - malowane plansze 1280×720 (grafika PixelLab ×2) z
warstwami ruchu: ogień, popiół, deszcz, błyskawice, mgła, falujące chorągwie, kołysanie, postać z klatek animacji; dymki z popiersiami
i krótkie napisy. **Odtwarzacz:** ten sam mechanizm - proponuję, by Prologue.js udostępnił `Prologue.play(sceny, { onEnd })` (dziś
ma już `Prologue.replay()`), a dane historyjek leżały w `Podroznicy_Data.js` i `js/teksty/historyjki.txt`.

- **Ile:** wersja oszczędna **4**, pełna **8** (tabela niżej). Reszta - sceny na mapie.
- **Styl:** 1-2 plansze PixelLab na historyjkę (ten sam pędzel co prolog), lekka animacja: paralaksa 2-3 warstw, dym, ogień, deszcz,
  mgła, czasem jedna postać z klatek (wstaje, idzie); napisy jak kronika prologu (jedno-dwa zdania na ujęcie), dymki z popiersiami.
- **Długość:** 20-45 s (2-4 ujęcia), najdłuższa (H3) do 60 s.
- **Pomijanie:** O - następna kwestia, krótko P - następne ujęcie, **przytrzymane P - cała historyjka** (jak prolog).
- **Kiedy:** po kluczowej rozmowie (podróżny „opowiada”) albo jako punkt zwrotny łańcucha; zawsze poza walką, w bezpiecznym miejscu.
- **Wspomnienia:** każda obejrzana historyjka trafia do Dziennika, zakładka **„Wspomnienia”** (tytuł, kto opowiadał, dzień; O -
  „Obejrzyj jeszcze raz”). Ta sama zakładka może zbierać sceny na mapie do powtórki (tylko te, które się da odtworzyć poza czasem
  akcji - np. przybicie promu). F9: „Historyjka: odtwórz”.

| # | historyjka | kto opowiada / kiedy | plansze i ruch | wersja |
|---|---|---|---|---|
| H1 | „Olszynka, dzień poboru” | Urszula, po pierwszej poszlace D43 | wieś o świcie, werbownik z bębnem, chłopak z piegiem odchodzi drogą (postać idzie), matka przy płocie; mgła | oszczędna |
| H2 | „Pod Brzozową Wolą” | Tymon, gdy zaufa bohaterowi (W16) | pole bitwy nocą, łuna płonącej wsi w dali (ta sama wieś co w prologu, z drugiej strony), chorągiew z feniksem, dym; jeńcy w rzędzie (gdy gracz zgodzi się na wątek) | oszczędna |
| H3 | „Biblioteka w Lipnicy” | Augustyn, po znalezieniu spisu (W15) | biblioteka przy świecach, ludzie w czarnych tabardach z białym okiem wynoszą księgi, karty Dobiesza w ogniu pochodni; deszcz za oknem | oszczędna |
| H4 | „Mapa, której nie ma” | Teofil, druga wizyta (D40) | stara mapa na stole, przy świecy wyłania się twierdza Kruczych Skał w dawnej świetności (przejście z rysunku w obraz), kruki nad murami | pełna |
| H5 | „Pieczęć” | punkt zwrotny W14 - treść listu | sala rady Korony, długi stół, świece, pomarańczowy feniks; w cieniu ktoś z białym okiem pod płaszczem | oszczędna |
| H6 | „Kamień z krukiem” | Kleofas, gdy dostanie kamień (W15) | kruczarz z kamieniem na szyi niesie list przez morze (łódź, fale, kruk nad masztem - echo prologu) | pełna |
| H7 | „Bęben” | koniec W16 (wariant wg zakończenia) | trap promu: Tymon w kajdanach / przysięga przed chorągwią / łódź Rocha w nocy | pełna (3 warianty tła) |
| H8 | „Pieśń z lądu” | Jędrek, gdy zaśpiewa zwrotkę (D41) | obóz wojska przed bitwą, ogniska, żołnierze tańczą, grajek z dudami, iskry | pełna |

### 8.3 Sceny i historyjki w planie budowy

Sceny powstają razem ze sprawami, do których należą (etapy 2-6); historyjki - osobny etap 7 (rozdz. 9), bo zależą od generacji i
od odtwarzacza w Prologue.js. Do czasu planszy każda historyjka ma wersję „sepia” (kadr mapy + napisy), więc nic nie czeka na grafikę.

### 8.4 Koszt grafiki scen i historyjek (osobno od postaci)

| pozycja | oszczędnie | pełna |
|---|---|---|
| **Sceny na mapie:** rekwizyty (trap, bagaż ×2, szkatułka, list gończy, przybory posła, kram, tuba z mapami - `create_object_pro_flash`, ok. 4-6 gen.) | 6 rekwizytów × 5 = 30 | 9 × 5 = 45 |
| pozy scen (zebrane w 7.1: sznur, dudy, modlitwa, kusza, pisanie, bagaż) | (w 7.1) | (w 7.1) |
| **Historyjki:** plansza (`create_image_pro`, z jedną poprawką ok. 10-12 gen.) | 4 × 1,5 planszy × 11 = 66 | 8 × 1,75 × 11 = 154 |
| poprawki na wycinkach (inpaint, ok. 6 gen.) | 4 × 6 = 24 | 8 × 6 = 48 |
| warstwa z ruchem postaci (skeleton v3, ok. 4 gen. na sekwencję) | 2 × 4 = 8 | 6 × 4 = 24 |
| **razem sceny + historyjki** | **ok. 130** | **ok. 270** |
| (dla porównania: postacie z 7.1) | ok. 365 (bez póz) | ok. 400 (z pozami) |
| **cały projekt** | **ok. 495** | **ok. 670** |

Liczby z doświadczenia tego projektu: plansza wizji latarni ok. 9 generacji, prolog - poprawki i animacja chłopca ok. 41, postać pro z
chodem 18-22. Wszystko mieści się w jednym cyklu (5000 od 29.10) z dużym zapasem na inne prace.

---

## 9. Kolejność budowy i szacunek

Szacunek w sesjach agenta (ok. pół dnia każda, z testami). Po każdym etapie gra działa, testy dotknięte na zielono, stare zapisy się
wczytują. Na grafikę etap nie czeka - zastępcze arkusze do czasu PixelLab.

| etap | co | zależy od | sesje | PixelLab |
|---|---|---|---|---|
| 0 ✓ | **zrobione 2026-10-29** (rozdz. 11.1): decyzje gracza (rozdz. 10); poprawki W6 (fale 10/25/37/52, Ludmiła i Ela od dnia 10, K5/K27/K28, teksty Darina i Szymka) + testy W6 | - | 0,5 | 0 |
| 1 ✓ | **zrobione 2026-10-29** (rozdz. 11.2) - **rdzeń systemu:** `Podroznicy.js` + `_Data` + `podroznicy.txt`; planowanie promu, pula (4 ciała zastępcze), czwarty zakres TownLife, plany dnia, księga (pokoje 4-24), Renoma, odpływ i powroty, zapis, F9, scena przybycia na przystani, „Księga gości” u Borgara; test jednostkowy + szkielet głównego | - | 2 | 84 (pula) |
| 2 ✓ | **zrobione 2026-10-29** (rozdz. 11.6) - **pierwsza szóstka:** Tobiasz (K71/K72), Konstanty (D39), Teofil (D40, wizyta 1), Zenon (D42), Urszula (D43), Jędrek (D41); podsłuch I2; popiersia (PixelLab - osobny pomocnik, rozdz. 11.8) | 1 | 2 | 120 (+12 pozy) |
| 3 ✓ | **zrobione 2026-10-29** (rozdz. 11.9) - **intrygi:** furtki TavernLife (od refaktoru tawerny), drzwi zajętych pokoi, przeszukanie, nocne kroki I4, listy pod drzwiami I5, szkatułka I3 (3 warianty), trójka I1 | 1, TavernLife | 1,5 | ok. 15 (rekwizyty) |
| 4 ✓ | **zrobione 2026-10-29** (rozdz. 11.7, bez kroków etapu 3) - **W15 „Święte kości”** (Gaspar, Augustyn) i **W16 „Dezerter”** (Tymon, Szczerba) + flagi Aktu III | 2, 3 | 2 | 80 (+12 pozy) |
| 5 | **W14 „Poselstwo”** (Albin, poseł, Ostap; piętro II, przepustka „w służbie”), **D44** (Erazm), **D47** (Kompania), Teofil - wizyta 2 | 3 | 1,5 | 80 (+10 pozy) |
| 6 | **sceny na mapie** - dopracowanie wszystkich z tabeli 8.1 (kamera, emotki, światła, dźwięki) | 2-5 | 1 | 15 / 30 (rekwizyty) |
| 7 | **historyjki:** odtwarzacz (`Prologue.play`), zakładka „Wspomnienia”, plansze H1-H3, H5 (oszczędnie) albo H1-H8 (pełna) | 4, 5 | 1,5 (oszcz.) / 2,5 (pełna) | ok. 100 / ok. 225 |
| 8 | bilans i audyt: `tools/audyt/przejscie.js`, ekonomia (rozdz. 1.6) na liczbach z gry, dotknięte testy raz, `wydajnosc_test` z tawerną, dokumenty (`FABULA_I_PRZEJSCIE.md`, `QUESTY.md`, `ARCHITEKTURA.md` §6) | wszystko | 0,5 | 0 |
| **razem** | | | **ok. 12,5 (oszczędnie) - 13,5 (pełna)** | **ok. 495 (oszczędnie) - 670 (pełna)** |

Kolejność daje graczowi najpierw żywy prom i tawernę z gośćmi (etap 1), potem po kolei sprawy - każda grywalna od razu po swoim
etapie. Etapy 2 i 4 można dać dwóm agentom równolegle (różne pliki tekstów, ten sam silnik) - po etapie 1.

**Ryzyka:** refaktor tawerny (furtki w 6.4 - do tego czasu etap 3 tylko w części bez TavernLife); refaktor wątków (Przystan, Act3,
TownQuests - małe zmiany w krótkich krokach, kopie przed zmianą); Map001 gracza (bez znaczników `podrozny_*` podróżni nie siedzą w
sali - działa, ale gorzej wygląda); limit 4 osób w gęstych dniach (oś czasu sprawdzona testem jednostkowym).

---

## 10. Decyzje gracza - ZATWIERDZONE 2026-10-28

1. **Ilu podróżnych naraz:** 4 w rozdziale 1 (5 od Renomy 60 i w Akcie II), 1-3 nowych na prom - **tak** (zbudowane: `LIMIT`).
2. **Pokoje bohatera:** podróżni **nigdy** nie biorą pokoi 1 i 2; wyjątkowo 3 (intryga „trójka”) i Złoty (poseł) - **tak** (zbudowane:
   pokoje 1 i 2 w ogóle nie są do przydzielenia; 3 i Złoty tylko dla postaci z `wymaga: "furtka"`, gdy TavernLife ma `addRoomGuard`).
3. **Łowczyni a dezerter:** Szczerba **zawsze bierze Tymona żywego** - łowca nigdy nie zabija dezertera (etap 4).
4. **Ojciec bohatera (W10):** jedno zdanie Tymona o „chorągwi brzozowskiej” (jeńcy, nie polegli) - **tak, jak w projekcie** (etap 4:
   „Chorągiew brzozowska stała na lewym skrzydle. Ich nie zabijali. Brali. Całymi rzędami.” - tylko gdy Tymon zaufa bohaterowi).
5. **Renoma karczmy:** **osobna miara**, nie Sława bohatera - jak w projekcie (zbudowane: `Podroznicy.renoma()`, księga gości).
6. **Fale W6:** **wariant A** - fale 10, 25, 37, 52 (zbudowane: rozdz. 5.1 i 11.1).
7. **Obóz W6:** Ludmiła i Ela z pierwszą falą (dzień 10), K5 z Kubą przed dniem 10, K27 od 10, K28 od 11; Rafał i Darin od dnia 1 -
   **tak** (zbudowane: rozdz. 5.2 i 11.1).
8. **Kartograf:** nazywa się **Teofil Cyrkiel** (Teodor to kamerdyner) - poprawione w tym dokumencie i w grze (`js/teksty/podroznicy.txt`).
9. **Historyjki:** **oszczędnie - 4** (H1 Urszula, H2 Tymon, H3 Lipnica, H5 Pieczęć), reszta jako sceny na mapie; „Wspomnienia” jako
   zakładka Dziennika - **tak** (etap 7).
10. **Pieniądze:** **zostają** jak w projekcie (ok. 320 G pewne, do ok. 590 G z chciwymi wyborami, bez odpisów długu).
11. **Wolna Kompania:** **tak** (najęcie 60 G - dwóch obrońców w Akcie III; wyrzucenie przez Wita - jeden napastnik więcej).
12. **Przeszukiwanie cudzych pokoi:** **tak** (etap 3).
13. **Znaczniki na Map001** (`podrozny_1..6`, `kompania_1..4`, `grajek`, `medyk`): **postawi gracz sam w edytorze**. System działa bez
    nich (zapas: podróżny w swoim pokoju na piętrze) i sam używa znaczników, gdy się pojawią - lista: rozdz. 11.4.
14. **Nowi nosiciele listów do matki** (Tobiasz, Urszula - bez celnika i opłaty): **tak** (Przystań jest już na silniku `Watki.js`).

---

## 11. Stan budowy

### 11.1 Etap 0 - poprawki W6 (zbudowane 2026-10-28/29)

| co | gdzie |
|---|---|
| Fale **10, 25, 37, 52** - jedno źródło: `CALENDAR.waves`, `TownQuests.waves()` / `isWave(d)` | `TownQuests_Data.js`, `TownQuests.js` (API) |
| Przystań i garnizon czytają fale z TownQuests (ich stałe - tylko zapas); werbownik na rynku dzień po fali (11, 26, 38, 53); tydzień skupu po fali; tydzień głodu i D27 od rekwizycji (dzień 28 = druga fala + 3) | `Przystan.js`, `Garnizon.js`, `Garnizon_Data.js` |
| W6 rozdz. 5: druga fala w dniu 25 (`w6Wave.enter` - `Math.max(waves[1], dzień)`; stary rekord z `r.t.waveDay` = 24 zostaje), drugi namiot i Bogdan z Haliną od dnia fali (`w6Second`), tekst kroku `{waveDay}` z kalendarza; kalendarz miasteczka: 24 → 25, 38 → 37 | `TownQuests.js`, `TownQuests_Data.js` |
| Ludmiła i Ela: w miasteczku od południa dnia 10 (`when: "w6Obecni"` - albo gdy jest już rekord K27, K28, D10, D4, K19 lub flaga `campInside` / `campOutside`); rano dnia 10 stoją na molo przystani jako ludzie pierwszej fali (761, 762 - ich arkusze i słowa) | `TownLife_Data.js`, `TownQuests.js`, `Przystan.js`, `js/teksty/przystan.txt` |
| K5: przed dniem 10 czwarty bochen dla **Kuby przy studni** (`targetsBefore`), słowa oferty i kroku wg dnia (`{czwarty}`, `{czwartemu}`, `{placi}` - FX `k5Vars`, słowa zadania `q.vars` w `varsOf`), plotki Kuby | `TownQuests_Data.js`, `TownQuests.js`, `zadania_k.txt`, `miasto.txt` |
| K27 od dnia 10 (było 2), K28 od 11 (było 3), D14 od 25 (było 24), K49 od 25 (było 24) | `TownQuests_Data.js`, `Latarnia_Data.js`, `zadania_d.txt`, `latarnia.txt` |
| Szymek - „chłopak spod murów” (tytuł i trzy kwestie bez obozu i Eli), K37 „głodny chłopak spod murów”; Darin - „Uciekłem jednym z pierwszych promów, dwa lata temu.” | `mieszkancy.txt`, `zadania_k.txt` |
| Testy: `w6_test` (fala 25, zebranie 26, tydzień pracy 26-33, wilki noc 26), `latarnia_test` (K49 od 25), `regulars_test` (K27 w dniu 11-12), `clean_hud_test` (K5 dnia 1 - Kuba), `town_life_test` (podróżni liczeni osobno), `podgrodzie_mieszkancy_test` (czwarty zakres TownLife), `rozmowy_test` i `debug_menu_test` (nowe haki i sekcja F9) | `tests/` |

### 11.2 Etap 1 - rdzeń systemu (zbudowany 2026-10-28/29)

- **Pliki:** `js/plugins/Podroznicy_Data.js` (lista wtyczek: pod `Zakon_Data`, nad `TownLife`), `js/plugins/Podroznicy.js` (pod `Kasztelan`,
  czyli pod TownQuests, Przystan, Garnizon, Kantor, Wrak, Act3), `js/teksty/podroznicy.txt` (ok. 300 kluczy), `tests/unit/podroznicy.test.js`
  (22 sprawdzenia), `tests/podroznicy_test.js` (szkielet głównego, 23 sprawdzenia, ok. 25 s), `tools/podroznicy/zastepcze.py`
  (zastępcze arkusze i popiersia), `tools/podroznicy/miejsca_pokoi.py` (miejsca w pokojach Map025). Skrypt szkiców (`os_czasu.png`,
  `ksiega_pokoi.png`) został w katalogu roboczym sesji projektu - nie przeniesiony.
- **Planowanie promu** (6:00 dnia promu, raz - `last`): odpływy (sprawa w toku - prom dłużej, raz: popup „Teofil zostaje do dnia 25.”),
  obsada w kolejności tabeli 1.2 (okna, warunki, „najpóźniej”, powroty), pula 0-2 z ziarna zapisu; limit 4 / 5, grupa = jedno miejsce,
  1-3 nowych; noc oblężenia - nic. Czysta funkcja `Podroznicy.logika.planuj(stan, dzień, świat)`. Oś czasu zwykłej gry (test
  jednostkowy): Tobiasz 4 (i powroty 13, 25, 37, 46, 55), Konstanty 7 (i 52), Zenon 10, Gaspar 13-25, Teofil i Ksenia 16, Augustyn 19,
  Urszula 22, Tymon 25-37, Szczerba i Kompania 28, Jędrek 31-43, Erazm 34, Albin 37; poseł i „trójka” czekają na furtkę TavernLife.
- **Stare zapisy:** brak klucza = dzień wczytania jako już zaplanowany; spóźnieni z obsady po jednym na prom, w kolejności tabeli.
- **Księga pokoi:** pokoje 4-24 (bez 7 - Eryk Sowa), własny pokój albo najbliższy tego samego rodzaju; „Księga gości” u Borgara (opcja
  `Tawerna.talk.option`, okno bez mówcy): pokój, kto (z puli „gość z lądu”, póki nie poznany), do kiedy / „odpływa dziś” / „przypływa
  promem”, Eryk Sowa, Rafał w kryjówce (W6), Renoma z opisem, utarg z pokoi w tym tygodniu.
- **Renoma karczmy:** 0-100, start 30, dziennik zmian; od 60 limit 5 i zamożniejsza pula; -2 za odpływ z niezałatwioną sprawą (notatka,
  zadanie przerwane). Napiwki, klucz, rabaty i komnata (progi 40/50/75/90) czekają na furtki TavernLife / TavernShift (etap 3).
- **Mieszkańcy TownLife** (czwarty zakres 3020-3049 w `TownLifeData.EXTRA_RANGES` i w rejestrze rdzenia): pola mieszkańca to gettery
  pytające silnik - bez zmian w TownLife.js (`indoor` jako obiekt z getterami zamiast „funkcji” z rozdz. 6.3): imię, arkusz, mapa (8 na
  wyspie i tuż przed promem, inaczej brak zdarzenia - Map008 to najcięższa mapa), plan dnia (szablony `PLANY`, dzień przyjazdu i odjazdu,
  Urszula na molo 9-15 w dni promu), wnętrza, okrzyki, słowa. Pula: 4 miejsca (3038-3041), na które silnik podmienia arkusz i imię.
- **Zastępcze arkusze:** 30 arkuszy i popiersi przekolorowanych z mieszkańców (`tools/podroznicy/zastepcze.py`) pod docelowymi nazwami
  (`$Npc_Tobiasz.png`, `Tobiasz_Bust.png`...): grafika z PixelLab wejdzie podmianą plików.
- **Przystań:** aktorzy 3002-3008 (przybyli 9-11 na molo, odpływający 14-15, Urszula 9-15), scena przybycia o 9:00 (pasy, kamera na molo,
  dzwon okrętowy i łańcuch, przewoźnik, przybyli schodzą po kolei z dymkiem, celnik „Nazwisko? Cel?”, w dniu 10 Ela „To tu nie ma
  wojny?”; P - następne ujęcie, przytrzymane P - koniec; raz na prom, zapamiętana; rusza 1,5 s po wejściu na mapę, kończy się sama „jak po całej”, gdy zegar przeskoczy na inny dzień albo tryb cichy testów ją wyłączy). Trap promu (rekwizyt 3010) - jeszcze bez grafiki.
- **Rozmowy:** pierwsze spotkanie (`meet+5`, raz na wizytę), menu (`shop+25`): „Skąd płyniesz?”, „Jakie wieści z lądu?” (wg etapu
  wojny), „Co słychać?” (głos postaci po kolei), przysługa z puli (etap 1: mnich - chleb, Opinia +1; cyrulik - krwawnik ×3 za 5 G;
  wędrowny kowal - naostrzy narzędzie za 5 G; marynarz - pogoda na jutro), opcje innych systemów, „Bywaj.”. Pozostałe przysługi puli
  (niesienie bagażu, odprowadzenie, szukanie dziecka...) - małe zadania etapu 2.
- **F9** („Wyspa i fabuła” → „Podróżni z promu:”, przez `Watki.f9`: silnik wątków dostał wiersze własne wątku - `f9.wiersze/wybierz/ok`):
  następny prom teraz (dzień promu 8:55, przystań), przypłyń teraz: ◀ ▶ postać / ktoś z puli, odpływ wszystkich, księga: wyczyść,
  Renoma ±10, nowe ziarno puli, scena przybycia.
- **Zapis:** `Tawerna.state("podroznicy")` wersja 1 (pola jak w 1.9 + `noc`, `wizyty`, `sloty`, `utargTyg`, `zlotoProm`, `poznani`).
- **Szyna:** `prom`, `podroznyPrzyplynal`, `podroznyOdplynal`, `renoma`, `podroznicyScena`. **Haki wątku** dla etapów 2-6: `obecny`,
  `wizyta`, `renoma`, `pokojZajety` (warunek danych `{ hak: "obecny", args: ["tobiasz"] }`; stan wątku też: `"stan:obecni.tobiasz"`).
- **Wydajność:** jeden zegar mapy (co 10 klatek: tylko przystań; scena co klatkę, gdy trwa); planowanie na `dayStart` / `hourChange`;
  gettery mieszkańców z pamięcią na dzień i stan; zdarzenia podróżnych na Map008 tylko dla tych na wyspie / tuż przed promem.
- **Testy (tryb cichy):** `Podroznicy.auto(false)` w `QUIET` (`tests/lib/kit.js`) - scena przybycia nie zaczyna się sama w testach innych
  systemów; planowanie i mieszkańcy działają jak w grze.

### 11.3 Jak to zobaczyć w grze

- Nowa gra, dzień 1: zwykle 1-2 osoby z puli (od południa w karczmie, w swoich pokojach na piętrze). Dzień 4 (gdy bohater był już
  w miasteczku): **Tobiasz Goniec** - pokój 23, po 14:00 obchodzi miasteczko z listami, wieczorem w karczmie, nocą u siebie na piętrze.
- U Borgara: „Księga gości”. W karczmie / na piętrze: podróżni przy kufrach w swoich pokojach (do czasu znaczników w sali).
- Przystań w dzień promu przed 9:00 (np. dzień 10): scena przybycia (Zenon Sita, Ludmiła i Ela z pierwszą falą).
- F9 → „Wyspa i fabuła” → „Podróżni z promu:” - wszystko na skróty.

### 11.4 Znaczniki do postawienia przez gracza na Map001 (sala)

Zdarzenia bez grafiki o nazwie **„Miejsce: <nazwa>”** (jak `gosc_1..8`); kierunek grafiki zdarzenia = kierunek postaci (bez grafiki -
kierunek strony). Silnik czyta je przy każdym wczytaniu Map001; bez nich podróżny jest w swoim pokoju na piętrze.

| nazwa | gdzie mniej więcej (plan karczmy, Map001) | kto |
|---|---|---|
| `Miejsce: podrozny_1` | Wielka sala (x 37-63, y 24-44), przy stole blisko baru (bar ok. 52,28) | Tobiasz, Jędrek (bez znacznika `grajek`) |
| `Miejsce: podrozny_2` | Palarnia i czytelnia (x 65-75, y 40-53), przy stole / pulpicie | Teofil, Augustyn, Albin |
| `Miejsce: podrozny_3` | Palarnia i czytelnia, drugie miejsce | Gaspar, Erazm |
| `Miejsce: podrozny_4` | Sala biesiadna (x 17-35, y 24-38), przy stole | Ksenia, Tymon |
| `Miejsce: podrozny_5` | Pokój myśliwski (x 3-15, y 24-38), przy kominku, twarzą do drzwi | Szczerba, Konstanty (bez znacznika `medyk`) |
| `Miejsce: podrozny_6` | Sala biesiadna, drugie miejsce (albo kąt Wielkiej sali) | Zenon, Urszula |
| `Miejsce: kompania_1` ... `kompania_4` | Pokój gier (x 85-97, y 24-38), przy stołach kości i siłowania | Wolna Kompania |
| `Miejsce: grajek` | Sala ze sceną (x 65-83, y 24-38), obok sceny Melii (scena ok. 74,28) | Jędrek wieczorem |
| `Miejsce: medyk` | Pokój myśliwski, kąt (8-11 przyjmuje chorych) | Konstanty rano |

Ludzie z puli siadają na pierwszym wolnym `podrozny_N`. Na Map025 można przesunąć miejsce w pokoju: `Miejsce: pokoj_<n>` (i `pokoj_<n>_2`
- druga osoba w pokoju; domyślne: `tools/podroznicy/miejsca_pokoi.py`).

### 11.5 Dla etapów 2-8 (stan z etapu 1)

- **Etap 2 i 4 równolegle:** etap 2 dopisuje `zadania` (K71-K74, D39-D43...) do wątku `podroznicy` w `Podroznicy_Data.js` i pole
  `zadania: [...]` postaci w `OBSADA` (silnik sam trzyma podróżnego prom dłużej, gdy sprawa trwa); etap 4 robi wątki W15 / W16 we
  **własnych plikach danych** (np. `SwieteKosci_Data.js`, `Dezerter_Data.js` nad TownQuests_Data; teksty `swiete_kosci.txt`,
  `dezerter.txt`), żeby nie kolidować z etapem 2 w jednym pliku. Obecność postaci: hak `obecny` albo `"stan:obecni.<klucz>"`, dzień
  przyjazdu: `Podroznicy.stan().obecni.<klucz>.od`.
- **Etap 3** potrzebuje furtek TavernLife z rozdz. 6.4 (pokój 3 / Złoty - wtedy przypłyną „trójka” i poseł; napiwki z Renomy; plan
  karczmy z imionami gości).
- **Grafika** (PixelLab od 29.10): podmiana plików `$Npc_<Klucz>.png` i `<Klucz>_Bust.png` (nazwy z `tools/podroznicy/zastepcze.py`),
  rekwizyt trapu (3010) w scenie przybycia.

### 11.6 Etap 2 - sprawy pierwszej szóstki i podsłuch (zbudowane 2026-10-29)

- **Pliki:** zadania jako dane wątku `podroznicy` w `Podroznicy_Data.js` (`zadania`, `rozmowy`, `akcje`, `paczka` - listy, uwagi, punkty
  widokowe; stałe `SPRAWY`, rozmowy przez ścianę `PODSLUCH`), kod ich haków w nowej wtyczce `js/plugins/Podroznicy_Sprawy.js` (lista
  wtyczek: zaraz pod `Podroznicy`), teksty w `js/teksty/podroznicy.txt` (sekcja „ETAP 2”, razem 585 kluczy). Postaci obsady mają pole
  `zadania` (Tobiasz K71/K72, Konstanty D39, Teofil D40, Jędrek D41, Zenon D42, Urszula D43): sprawa w toku - prom dłużej, raz.
- **K71 „Listy z lądu”** (Tobiasz, pierwsza wizyta): cztery listy w torbie (Hanka, sołtys, Marta Ługowa - bohater czyta jej na głos,
  Feliks), piąty „do Ludmiły” u Borgara (flaga `k71ListLudmily`, uwaga Ludmiły od dnia 10); u Borgara opcja „Podgrzej list kamerdynera
  nad kociołkiem” (Czujność 6+: lak czysto; mniej: ślad - Feliks przy odbiorze `w7FeliksCzujny`); list pokazany Lordowi albo otwarty -
  W7: obserwacja „rano” Feliksa („papier na kopy” - `Dwor.state().obs.rano`); 2 G za list, 4 G za komplet, XP 40, Renoma +2.
- **Listy do mamy (W10, decyzja 14):** po K71 Tobiasz, a Urszula w dniu swojego odpływu, biorą odpowiedź bohatera na list matki - bez
  opłaty i bez celnika (opcja „Zabierzesz list do mojej mamy?”; to samo menu co u przewoźnika i Rocha - `Przystan.odpowiedz(via, spk)`).
- **K72 „Poczta z lądu”** (każdy powrót Tobiasza, raz na wizytę): 2-3 listy do ludzi wyspy (pula 10 adresatów: drobne sekrety), przy
  drugiej wizycie zawsze list do brata Kleofasa z Lipnicy (zapowiedź W15); 2 G za list.
- **D39 „Gorączka z promu”** (Konstanty): krwawnik ×3 i czosnek ×2, 2 porcje własnej wody bohatera, noc w pokoju 11 (22-4: zimny okład
  albo koc), rano sołtys i szopa (Opinia 20+ albo zimny okład - medyk wygrywa, Opinia +3); 15 G, XP 100, Renoma +3 i **przepis
  „opatrunek medyka”** (ręczny: włókno + krwawnik → opatrunek, flaga `d39Przepis`). Napar, maść i syrop z projektu potrzebują nowych
  przedmiotów w `data/Items.json` - nie dodane (edytor; etap 8 albo później). Jadwiga („razem robią syrop”) - nie zrobione.
- **D40 „Mapa dla kartografa”** (Teofil, wizyta 1): pięć szkiców z sześciu punktów widokowych (miejsca zadań TownQuests, iskierka przy
  znaczniku: klif pustelni 155, baszta kruków 157, laterna 159, wieża garnizonu 162, nad kamieniołomem 13, róg nabrzeża 125); oddanie w
  Palarni 15-23; mapa z wraku (178) - poszlaka W12 „kartograf” (`Wrak_Data` CLUES - szósta); 30 G, XP 120, Sława +3, Renoma +3; na mapie
  wyspy miejsca nieznane mają zdanie Teofila zamiast „?” (`MapaWyspy.addHint` - nowa furtka). Wizyta 2 - etap 5.
- **D41 „Pieśń z lądu”** (Jędrek): jedna scena - pogodzić (Melia 18-21, Jędrek 21-24: zaufanie Melii +5, Renoma +3), zawody z zakładem
  10 G (wygrywa Melia przy zaufaniu 20+: +10, inaczej Jędrek: Melia -5, zwrotka od razu) albo odprawić (Renoma -2, koniec); zwrotka za
  dzban miodu pitnego: brakująca zwrotka W3 (`gainVerse`) albo - bez W3 / komplet - wersja wojskowa (notatka: Czarne Oczy znają pieśń);
  Natchniony 4 godz.; flaga `d41Kupala` (do dnia 42) dla finału W3 - finał jej jeszcze nie czyta.
- **D42 „Zboże w suszę”** (Hanka): dwie z poszlak - narada Zenona z Kłosem za drzwiami Jadalni prywatnej (dzień przyjazdu + 2, 20-22:30,
  podsłuch I2, Czujność 6), Zenon przy wadze Kłosa w garnizonie 11-13:30 (aktor 3008 na Map162, bohater w pobliżu), księga celnika za
  5 G (zamiast przeszukania pokoju 20 do etapu 3); wybór u Hanki: a) sołtys - Zenon odpływa najbliższym promem i nie wraca, Opinia +5,
  10 G i bochen; b) sprzedaż jęczmienia Zenonowi (opcja w jego menu: 8 G za worek, najwyżej 20), Opinia -2; c) cztery worki dla obozu
  (flaga `d42Worki` - zaufanie obozu W6 +1 w `w6TrustCount`); d) Kłos milczy (`d42KlosMilczy` - skup ×1,2 w `Garnizon.js`).
- **D43 „Matka szuka syna”** (Urszula): dwie z trzech poszlak (rotmistrz, werbownik - księga poborowa, Darin albo Rafał); Antek wśród
  rekrutów (aktor 3009 na Map162 obok placu ćwiczeń, 7-19, arkusz żołnierza garnizonu); a) „Chodź do niej” (Hart ducha 5+ albo
  przeczytany pierwszy list matki W10), b) wykup u Bełzy (40 G albo przychylność 40+), c) jego wybór (przychylność +5), d) przemilczeć;
  XP 150 (d: 50), Opinia +3 (a, b), Renoma +4 (bez d); uwaga Urszuli po pierwszym liście matki (W10).
- **I2 - podsłuch** (`Podroznicy.podsluch`): O twarzą do ściany pokoju w tawernie (Map001/025/026; ściany i drzwi z prostokątów planu
  karczmy `TavernLife.plan.DATA`): z pokoju - „Przyłóż ucho”, z korytarza - drzwi (co druga kwestia, bez skradania 30% na kwestię „Kto
  tam?!” - rozmowa jednorazowa przepada). Kwestie co 2 s w dymkach „(zza ściany)”; słowa w `{nawiasach}` poniżej progu Czujności -
  „...”; ruch przerywa. Bohater blisko pokoju, gdy rozmowa trwa: raz na dzień myśl „Zza ściany dochodzą głosy...”. Do końca: notatka
  „Podsłuchane: ...” i szyna `podsluch { id, pelna }`. Bez rozmowy: pokój podróżnego -
  „Cisza. Ktoś chrapie.” / „Ktoś przewraca kartki.”; pokój rozmowy o innej porze - „Nic.”; inaczej O działa jak zawsze. Zarejestrowane:
  `d42Narada`, `w15Kurier` (W15, pokój 12), `w16Sen` (W16, pokój 5). API: `dodaj(def)`, `slyszane(id)`, `trwa()`, `miejsce()`,
  `sluchaj(id, { tryb })` (testy), `zapomnij(id)`.
- **Zmiany w innych plikach** (kopie: `backup_art_2026-10-28/podroznicy/etap2/`): `Podroznicy.js` (aktorzy etapu 2 przez `wstaw`, API
  `naPromie`, `wyjazd`, `odswiez`), `MapaWyspy.js` (`addHint`), `Garnizon.js` (jedna linijka skupu), `TownQuests.js` (jedna flaga w
  `w6TrustCount`), `Wrak_Data.js` + `wrak.txt` (poszlaka „kartograf”), `Przystan.js` + `przystan.txt` (`odpowiedz`, słowa Tobiasza i
  Urszuli przy liście do mamy). Audyt `tools/audyt/przejscie.js` zna podróżnych bez silnika
  (plan profilu, pokój jako wnętrze) - 0 blokad (wcześniejsze 14 blokad W15/W16 „poza mapą (podr_droga)” znikły).
- **Testy:** `tests/podroznicy_sprawy_test.js` (port 9762, 22 sprawdzenia, ok. 45 s - wszystkie sprawy etapu 2, list do mamy, podsłuch),
  `tests/unit/podroznicy.test.js` (25: dane etapu 2 - rozmowy, akcje, teksty, słowa Teofila), `tests/podroznicy_test.js` (24: oferta K71
  w drugiej rozmowie; migawka do porównania zapisu tuż przed zapisem - koniec niestabilności z odpływem puli o 15:00).
- **Jak zobaczyć:** dzień 4 w miasteczku - Tobiasz (druga rozmowa: oferta K71); kociołek u Borgara; dzień 10 - Zenon, oferta D42 u Hanki;
  F9 → „Podróżni z promu” → „Przypłyń teraz” (Teofil, Urszula, Konstanty, Jędrek) - ich oferty od razu.

### 11.7 Etap 4 - łańcuchy W15 i W16 (zbudowane 2026-10-29, pomocnik)

- **Pliki:** `SwieteKosci_Data.js`, `Dezerter_Data.js` (pod `Podroznicy_Data`, nad TownLife i TownQuests_Data), `SwieteKosci.js`,
  `Dezerter.js` (pod `Podroznicy`), teksty `js/teksty/swiete_kosci.txt`, `dezerter.txt`; test `tests/lancuchy_test.js`. Numery zdarzeń
  3050-3069 (właściciel `Lancuchy` w rejestrze rdzenia: 3050 kurier Baltazara na piętrze, 3060 Tymon poza księgą).
- **W15 „Święte kości”**: kazanie Gaspara w dzień targowy, fałszywe kości (dwie z czterech opinii: Ignac, Tadek z medalikiem, Kleofas,
  Melia), wizytator Augustyn, noc sprzedaży (kurier na korytarzu, ściana pokoju 12 - podsłuch I2), skrzynka (na rynku z Witem / przy
  Augustynie / działka 30 G), kamień z krukiem (Kleofas, Ambroży, Baltazar 80 G, celnik 5 G) i spis z Lipnicy (Kleofas albo Augustyn),
  pożegnanie (jałmużna 25 G, Sława +3). Echo w Akcie III: `kamienBaltazar` - jedna lista wiedzy frakcji `Act3Data.WIEDZA_FRAKCJI`
  (najwyżej +1 zwiadowca w fali 3).
- **W16 „Dezerter”**: Tomek z pokoju 5 (bęben werbownika, sen przez ścianę - I2), Szczerba i jej noc pod piątką (zawsze bierze Tymona
  żywego), kryjówki, zakończenia: garnizon (`tymonGarnizon` - słowo bohatera u Bełzy, w Akcie III żołnierze królewscy przy przychylności
  60 i Tymon z nimi), przemyt (Baltazar 50 G / Roch), obóz (`tymonOboz`), wydany (60 / 80 G, Opinia -4), zabrany; zdanie Tymona o
  „chorągwi brzozowskiej” (decyzja 4) tylko przy zaufaniu.
- **Czeka na etap 3** (furtki TavernLife): `SwieteKosci.przeszukanie()` (skrzynka w pokoju 12 pod nieobecność Gaspara),
  `Dezerter.kuchnia({ nakarmil })` (nocne kroki do kuchni), `Dezerter.list(kto)` (listy pod drzwiami).
- **Odpowiedzi - ZATWIERDZONE przez gracza 2026-10-29:** 1) działka 30 G w W15 daje też `kamienBaltazar` - tak; 2) W15 bez bohatera -
  zadanie przegrane, a W16 „nic nie zrobił” - zrobione z Renomą -2 - tak; 3) Tymon w Akcie III tylko przez próg przychylności 60, razem
  z żołnierzami (bez osobnego miejsca obrońcy) - tak; 4) kroniki W2 oddane Augustynowi znikają z W8 i z karty 1 Kleofasa - tak.

### 11.8 Grafika PixelLab (2026-10-29, osobny pomocnik)

- **Z PixelLab, w stylu bohatera** (tryb pro, 64 px, 8 kierunków, `tools/npc/build_npc.py`, wpisy w `tools/npc/npcs.json`): cztery ciała puli
  (Pula_M, K, S, Z) i 10 postaci - Tobiasz, Konstanty (Medyk), Teofil (Kartograf), Jędrek (Grajek), Zenon (Zboze), Urszula, Gaspar
  (Relikwie), Augustyn (Wizytator), Tymon (Dezerter), Szczerba (Lowczyni). Wadliwe kierunki zastąpione lustrem albo skeleton-v3; drobne
  usterki zostały tylko w ukośnych kierunkach (poza arkuszem `$`) - opisane w `notes` w `npcs.json`.
- **Kodem:** sześć wariantów kolorów puli (M2, M3, K2, K3, S2, Z2 - `tools/podroznicy/pula_kolory.py`, tylko pasmo ubrania) i 20 popiersi
  (`tools/busts/make_<klucz>.py`, werdykty w `make_match.py`; częściowo pasuje tylko Zenon - twarz młodsza i mniej okrągła).
- **Zużycie:** 277 generacji (stan konta 4723 z 5000). `talk_busts_test` 39/39.
- **Na zastępczych arkuszach zostali:** Erazm (Poborca), Albin (Pielgrzym), poseł, gwardzista, Ksenia, „trójka”, Kompania 1-4 (etapy 3 i 5).
  Antek (D43) ma arkusz żołnierza garnizonu i rozmawia bez popiersia (popiersie żołnierzy to dorosły mężczyzna).
- **Do obejrzenia:** `docs/postacie/lineup_podrozni_2026-10-29.png`, `docs/popiersia/zgodnosc_podrozni.png`, `docs/postacie/pula_warianty.png`.

### 11.9 Etap 3 - intrygi na piętrach (zbudowane 2026-10-29)

- **Pliki:** `js/plugins/Intrygi_Data.js` (lista wtyczek: pod `Dezerter_Data`, nad TownLife i TownQuests_Data; wątek „intrygi”: zadania
  D45, D46, K73, dane mechanizmów), `js/plugins/Intrygi.js` (pod `Podroznicy_Sprawy`), `js/teksty/intrygi.txt` (155 kluczy), test
  `tests/intrygi_test.js` (port 9763, 16 sprawdzeń). Kopie zmienianych plików: `backup_art_2026-10-28/podroznicy/etap3/`.
- **Furtki TavernLife (rozdz. 6.4)** - małe dopiski w cudzych plikach:
  - `TavernLife.addRoomGuard(fn(room) -> { kto, do, napis } | null)` - pokój bohatera zajęty: Borgar nie wynajmuje (popup nad bohaterem
    „Pokój nr 3: zajęte do dnia 49.”), wiersz karty pokoi przygaszony z tym samym napisem; Intrygi zgłasza pokoje 3 i Złoty z księgi
    Podroznicy - od teraz przypływają też „trójka” (D45) i poseł z gwardzistą (W14).
  - `TavernLife.addRoomPrice(fn(room, cena) -> cena)` - Renoma 75+: pokoje bohatera 20% taniej; 90+: Komnata z kominkiem raz w tygodniu
    za darmo.
  - `TavernLife.addGatePass(fn() -> bool)` - złota krata piętra II otwarta, póki przepustka trwa (W14: kolacja „w służbie” - etap 5).
  - `TavernLife.addWake(fn(room) -> { hour, kto } | null)` - sen w wynajętym łóżku przerwany o tej godzinie; szyna `tavernWake`;
    `TavernLife.sleep(room)` śpi dalej do rana.
  - `TavernLife.plan.addInfo(fn(piętro, klucz) -> linie)` - na planie karczmy przy pokoju: „Tobiasz Goniec - do dnia 7”.
  - `TavernShift.addTipBonus(fn() -> G)` - napiwki na zmianie u Borgara +1 / +2 / +3 G przy Renomie 40 / 60 / 80.
  - `RoomLighting.js`: `<LightFollow>` - światło idzie ze swoim zdarzeniem i gaśnie, gdy zdarzenie jest ukryte (świeca nocnego piechura).
- **Drzwi zajętych pokoi 4-24** (Map025, zdarzenia „Drzwi -> Pokój N” / „Wejście -> Pokój N” - mapa bez zmian, `Tawerna.onEventList`
  „closed”): gdy gość mieszka - „Zamknięte. Ktoś tu mieszka.”, „Zapukaj” (gość w środku odpowiada przez drzwi) / „Odejdź”; otwarte, gdy
  gościa nie ma, a pokojówka sprząta (9-11) albo bohater ma klucz Borgara (opcja u Borgara przy Renomie 50+, na godzinę, tylko gdy
  jakaś sprawa chce przeszukania).
- **Przeszukanie** (`Podroznicy.przeszukanie.dodaj`): kufer / torba gościa w jego pokoju (zdarzenia mapy „Kufer podróżny”, „Torba
  podróżna”) - „Przeszukać cudze rzeczy?”; gość w środku albo wraca w ciągu pół godziny (plan dnia) - przyłapany: Renoma -3 i gość nie
  rozmawia z bohaterem do końca pobytu. Pokój szukania idzie za gościem z księgi (gdy jego stały był zajęty). Zarejestrowane: W15 -
  skrzynka Gaspara (`SwieteKosci.przeszukanie()`: kamień i spis bez konfrontacji), D42 - umowa w kufrze Zenona (trzecia poszlaka, już
  bez księgi celnika), D46 - pokój Kseni (poszlaka wg wariantu).
- **I4 nocne kroki** (`Podroznicy.kroki.dodaj`): piechur ze świecą (zdarzenie 3002 na Map025, `<LightFollow>`) idzie korytarzem do schodów.
  Bohater śpiący w wynajętym pokoju (1, 2, 3, Komnata) budzi się o godzinie piechura: „Kroki na korytarzu...” - „Wstań po cichu” / „Śpij
  dalej”; bohater na piętrze o tej porze - piechur rusza sam. Piechur czeka, aż bohater wyjdzie na korytarz; w kręgu jego świecy (3 pola,
  skradanie 1,5) widzi bohatera - wymówka, wraca do pokoju; dalej niż 9 pól na końcu - zgubiony. Najwyżej jeden na noc. Pierwszy raz
  zawsze Ozzy-lunatyk (K73 „Nocne kroki” - 40 XP; brakująca zwrotka W3 „bełkot” z jego śpiewu przez sen); Tymon do kuchni po chleb (W16 -
  `Dezerter.kuchnia({ nakarmil })`, z bochenem w torbie wybór „Zostaw mu bochen”). Szyna `nocneKroki { id, ok, jak }`.
- **I5 listy pod drzwiami** (`Podroznicy.listy.dodaj`): rano (6-10) po nocy w wynajętym pokoju list przy drzwiach (rekwizyt 3014,
  `!$Podr_List`; Złoty - przy łóżku), O - czytanie, notatka. Zarejestrowane: Tymon i Szczerba (W16 - `Dezerter.list`), Urszula po D43
  (podziękowanie). Szyna `listPodDrzwiami { id }`.
- **D45 „Gość spod trójki” (I1):** „trójka” (obsada, pokój 3) - zadanie rusza samo w tawernie; poszlaki 3 z 5: sadza pod drzwiami trójki
  rano (rekwizyt 3011), sznur z ołowianką w piwnicy nad beczkami (Map009, 3017), liczby zza ściany z pokoju 1 (1-3 w nocy, podsłuch
  I2), dziurka od klucza (drzwi trójki nocą przy skradaniu), Eryk Sowa (gdy sojusznik W12). Rozwiązania: a) Borgar wyważa drzwi (opcja u
  Borgara po 3 poszlakach: notes, `pomiaryPrzejete`, Renoma +6, 20 G, gość ucieka oknem), b) kapral Wit w dniu jego odpływu (areszt na
  molo, przychylność +5, Renoma +3), c) notes zabrany o świcie (4-5, skradanie), d) nic - odpływa z pomiarami: `pomiaryWyszly` (lista
  wiedzy frakcji Aktu III: najwyżej +1 zwiadowca).
- **D46 „Skradziona szkatułka” (I3):** w nocy po trzecim dniu pani Kseni; wariant z ziarna zapisu (A - sama Ksenia, B - Gaspar, gdy jest
  na wyspie, C - flisak); poszlaki: zamek (opcja na jej drzwiach), pokój (przeszukanie), rozmowy (Gaspar, Szymek, Janek), podsłuch pod
  drzwiami (A); oskarżenie u Borgara (pięciu podejrzanych): złe - Opinia -5, Renoma -5 i flaga podejrzanego; trafne - A i B od razu, C
  - worek flisaka na molo przed jej promem (rekwizyt 3012, 9-14). Nagroda: Renoma +6, Sława +3, 150 XP, 25 G (A) / 30 G (B, C); jej prom
  bez szkatułki - Borgar płaci 60 G, Renoma -6, zadanie przegrane.
- **Drobne zaległości etapu 2 zrobione przy okazji:** finał W3 przy ognisku z Jędrkiem - Opinia +2 i myśl (flaga `d41Kupala` + `w3Sung`),
  scena dwóch kartografów (Eryk Sowa jako sojusznik siada przy stole Teofila w D40).
- **Nie zrobione:** szkatułka - wariant C bez prawdziwej postaci flisaka (worek i słowa ludzi), Wanda bez własnej rozmowy (tylko
  oskarżenie), skutki złych oskarżeń poza flagami (Szymek - zaufanie obozu, Wanda - droższa łaźnia, Gaspar - trudniejszy W15) czekają na
  decyzję; dar Renomy 50 (kufel z imieniem) - potrzebny przedmiot w `data/Items.json`; Rafał w kryjówce W6 nie blokuje pokoju 1 (furtka
  jest, reguła czeka na decyzję).

### 11.10 Etap 5 - W14 „Poselstwo”, D44, D47, D48 (zbudowane 2026-10-29, pomocnik)

- **Pliki:** `Poselstwo_Data.js` + `Poselstwo.js` (`poselstwo.txt`) - W14; `Podroznicy5_Data.js` + `Podroznicy5.js` (`podroznicy5.txt`) -
  D44, D47, D48. Dane pod `Dezerter_Data`, silniki pod `Dezerter`. Zdarzenia 3070-3089 (właściciel „Poselstwo”). Test: `tests/poselstwo_test.js`
  (port 9791, 39 sprawdzeń, ~100 s).
- **W14:** Albin (pątnik) z falą 37, poseł z Ostapem w Apartamencie Złotym 3 dni później (tylko gdy jest `TavernLife.addRoomGuard`).
  Rozdziały: trzy poszlaki (Ambroży, rozmowa pod oknem pokoju 15, Borgar; Wit może zamknąć Albina przed kradzieżą), kolacja u Borgara
  20:00-21:00 = „w służbie” (`addGatePass` do 23:00), narada w Wielkim salonie (Lord 3070, Feliks 3071, podsłuch z Jadalni), Noc Kupały
  (Albin pod Złotym 3072: bohater obok = kradzież udaremniona, inaczej list znika o 1:30), śledztwo (wosk 3073, ślady 3074, konfrontacja:
  wieża / fałszywa droga / puszczony), list: poseł (60 G, Renoma +8, przychylność +10), Lord (`w14LordWie`, przychylność -10), kopia
  nocą (ryzyko 35% minus 3 za Percepcję; złapany: Renoma -8). Albin odpływa z listem = `poselstwoWyciek`.
- **D44:** Erazm, noc podatku = przyjazd + 2; Feliks na korytarzu przed czwórką 22:40-23:20 (3080), podsłuch pokoju 4 o 23:00. Raport:
  Lord (`w7PoborcaMonety` + obserwacja nocy W7), Feliks (przychylność +5), 20 G (`w7FeliksCzujny`), milczenie.
- **D47:** burdy do 1:00 (Renoma -1 za noc), Hubert: siłowanie (poziom 3), kości (rywal tylko tej sprawy, 10 G), bójka na dziedzińcu
  (Humans), najęcie 60 G (`kompaniaNajeta`), Wit (`kompaniaWroga`), Grum. **D48:** pamiątka (przedmiot „Mapa Kruczej Wyspy”), 25 G +
  `mapaTwierdzy`, przekonanie (2 karty kronik albo Hart 6), tuba w pokoju 22 (przeszukanie; złapany: Renoma -3).
- **Akt III:** `WIEDZA_FRAKCJI` (+`pielgrzymDonosi`, `mapaTwierdzy`); nowe listy `WIEDZA_FALA2` (łucznik, wyciek) i `WIEDZA_FALA4`
  (najemnik, `kompaniaWroga`); obrońca „kompania” (2, po dzwonie); garnizon przy `poselWdzieczny` od przychylności 70; fala 3 o jednego
  mniej przy złapanym pątniku (nie obok `ansgarAlly`).
- **Nie zrobione:** dopisek o poborcy w liście Lorda z dnia 40 (Story); odczyt `w14LordWie` w Dworze; rejestr Kantora; pamiątka na ścianę
  chatki (HomeDecor) - brak przedmiotu dekoracji; własna grafika Hubertowej bójki poza Humans.
