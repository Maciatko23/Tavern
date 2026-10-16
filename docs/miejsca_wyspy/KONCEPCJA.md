# Sześć nowych miejsc Kruczej Wyspy: koncepcja do zatwierdzenia

Wersja z 2026-10-15. To jest tylko koncepcja: w grze nic się nie zmieniło. Nie ruszałem `data/`, `js/plugins.js` ani `js/plugins/`.
Szkice map powstały w pamięci z prawdziwych kafelków (narzędzia `tools/miejsca_wyspy/`: `szkice.py`, `polozenie.py`, `wejscia.py`)
i są tylko obrazkami.

Obrazy w tym folderze:

| plik | co pokazuje |
|---|---|
| `polozenie.png` | mapa wyspy: miejsca, które już są w grze, sześć nowych i drogi między nimi |
| `wejscia.png` | pola na istniejących mapach, na których stanęłyby nowe przejścia |
| `rzut_pustelnia.png` | Pustelnia na klifie (Map155), numery i legenda |
| `rzut_urwisko.png` | Urwisko Kruków (Map157) |
| `rzut_latarnia.png` | Przylądek z latarnią (Map159) |
| `rzut_garnizon.png` | Garnizon nad zatoką (Map162) |
| `rzut_wrak.png` | Wrak na mieliźnie (Map165) |
| `rzut_cysterna.png` | Stara cysterna zakonu (Map167, podziemia) |

Na rzutach przerywana linia to rzecz, której grafiki jeszcze nie ma (latarnia, kadłub okrętu, palisada, ule, żerdzie kruków). Kruki
na rysunkach to ozdoba z arkusza `Bird_Crow`, nie zdarzenia. Numery map (155-167) są wolne i są tylko propozycją.

---

## 0. W skrócie

1. **Pustelnia na klifie** (Map155 + Skryptorium Map156). Na północno-zachodnim klifie, ścieżką z przystani w górę. Mieszka tu brat
   **Kleofas**, ostatni kronikarz zakonu: odczytuje zaszyfrowane kroniki i raz w roku odpowiada na jedno pytanie.
2. **Urwisko Kruków** (Map157). Morska ściana wzgórza tawerny: resztki muru twierdzy, baszty pełne kruków, kruczarnia zakonu. Tu bohater
   oswaja **kruka** (jak psa), a w skale jest krata z krukiem: przelew starej cysterny.
3. **Przylądek z latarnią** (Map159 + izba Map160 + laterna Map161). Latarnia stoi na fundamencie strażnicy zakonu. Latarnik **Bazyli
   Krzesiwo** w mgliste noce widzi w soczewce rzeczy, których nie powinien wiedzieć.
4. **Garnizon nad zatoką** (Map162 + kwatera Map163). Na południe od przystani: palisada, koszary, spichlerz z rekwizycji. Wojsko
   królewskie zakwaterowane za zgodą Lorda: pobór, skup plonów, spięcia z miasteczkiem.
5. **Wrak na mieliźnie** (Map165 + pod pokładem Map166). Okręt Czarnych Oczu, który płynął po Serce i rozbił się w sztormie z prologu.
   Na pokładzie mapa wyspy z zaznaczeniami. Jeden rozbitek siedzi w tawernie pod fałszywym imieniem.
6. **Stara cysterna zakonu** (Map167, podziemia). Prawdziwy zbiornik wody zakonu pod wzgórzem, za Zasuwą główną z piętra 30. Nagroda
   za zejście w głąb: jedno nabranie dziennie, a zapas jest skończony i wspólny z miastem i dworem.

---

## 1. Położenie i drogi

Wszystko zgodnie z Atlasem Kruczej Wyspy: pustelnia na północnym zachodzie, Urwisko za wzgórzem tawerny, latarnia na północno-wschodnim
przylądku, garnizon i wrak przy zachodnich płyciznach, cysterna pod wzgórzem (`polozenie.png`).

**Dwie nowe drogi zaczynają się na przystani** (Map125), bo tylko tam wyspa ma otwarte wybrzeże, a mapy użytkownika zostają nietknięte:

- **Na północ wzdłuż klifów:** przystań → Pustelnia → Urwisko Kruków → Przylądek z latarnią. Na końcu (opcja) ścieżka z przylądka
  schodzi w Góry (Map013). Wtedy wokół wyspy jest pętla: miasteczko → Polna → Leśna → Góry → Przylądek → Urwisko → Pustelnia → Przystań
  → Podgrodzie → miasteczko.
- **Na południe wzdłuż zatoki:** przystań → Garnizon → (łacha w odpływie albo łódź Janka) → Wrak.
- **Pod ziemią:** piętro 30 (Wielka cysterna) → Stara cysterna. Z cysterny kanał przelewu prowadzi do kraty z krukiem na Urwisku. Krata
  otwiera się tylko od środka.

### Przejścia (kontrakt dla budowy)

| skąd | pola | dokąd (lądowanie, kierunek) | uwagi |
|---|---|---|---|
| Przystań Map125 | (14-16, 0) | Pustelnia Map155 (23-25, 34), w górę | **nowe zdarzenie na Map125**, kafelki bez zmian |
| Pustelnia Map155 | (23-25, 35) | Przystań Map125 (14-16, 1), w dół | nowa mapa |
| Pustelnia Map155 | (47, 17-18) | Urwisko Map157 (1, 19-20), w prawo | |
| Urwisko Map157 | (0, 19-20) | Pustelnia Map155 (46, 17-18), w lewo | |
| Urwisko Map157 | (55, 19-20) | Przylądek Map159 (1, 33-34), w prawo | |
| Przylądek Map159 | (0, 33-34) | Urwisko Map157 (54, 19-20), w lewo | |
| Góry Map013 | (59, 11-13) | Przylądek Map159 (29-31, 38), w górę | **opcja**, nowe zdarzenie na Map013 |
| Przylądek Map159 | (29-31, 39) | Góry Map013 (58, 11-13), w lewo | opcja |
| Przystań Map125 | (21-23, 39) | Garnizon Map162 (21-23, 1), w dół | **nowe zdarzenie na Map125** |
| Garnizon Map162 | (21-23, 0) | Przystań Map125 (21-23, 38), w górę | |
| Garnizon Map162 | (0, 20-21) | Wrak Map165 (38, 20-21), w lewo | tylko w odpływie, inaczej dymek „Łacha pod wodą.” |
| łódź Janka (rozmowa) | - | Wrak Map165 (35, 18) | bez zdarzenia na mapie: wybór w rozmowie z Jankiem |
| Wrak Map165 | dziura w burcie (17, 15) | Pod pokładem Map166 | |
| Piętro 30 Map147 | Zasuwa główna (19-21, 5) | Cysterna Map167 (3, 20), w prawo | **bez zmian w pliku Map147**: po W1 rozdz. 7 kod podmienia stronę zasuwy (jak furtkę ogrodu w K33) |
| Cysterna Map167 | kanał (33, 2) | Urwisko Map157 (41, 16), w dół | krata otwiera się od środka, potem w obie strony |

**Co zmienia się na mapach użytkownika:** dwa zdarzenia przejścia na krawędziach przystani (Map125) i jedno (opcja) na krawędzi Gór
(Map013). Tawerna (Map001), miasteczko (Map008), Podgrodzie (Map111) i dwór (Map024) zostają bez zmian. Pola sprawdziłem
(przechodniość z flag tilesetu i zdarzeń): na górnej krawędzi przystani przechodnie są pola 12-33, na dolnej 15-48, na prawej krawędzi
Gór 11-14 (`wejscia.png`).

---

## 2. Wspólne pomysły fabularne (do zatwierdzenia)

Te pomysły spinają sześć miejsc z główną fabułą. Każdy jest też pytaniem w punkcie 11.

- **Okręt Czarnych Oczu.** Wrak to „Biała Źrenica”, okręt Straży Pewności. Płynął po Serce i rozbił się na mieliźnie **w tym samym
  sztormie, w którym zatonął kuter Rocha** (noc prologu). Czarne Oczy szukają „kamieni z krukiem”, bo to dawne znaki posłańców zakonu.
- **Skradzione strony.** Brat Dobiesz (ten od trzech pytań w jednym roku, piętro 20) uciekł na ląd z wyrwanymi stronami Księgi pytań.
  Po stuleciach Czarne Oczy znalazły je w klasztorze na lądzie i tak dowiedziały się o Sercu. Jedna z tych stron leży w kajucie wraku.
- **Cztery straże i kruczarze.** Zakon przetrwał upadek w czterech rodach, które nie wiedzą o sobie nawzajem: **dzwon** (Ambroży),
  **pieśń** (Melia), **klucz** (Borgar), **pióro** (brat Kleofas). Był jeszcze piąty: **kruczarze**, posłańcy z Urwiska. To ród dziadka
  Stacha. Wisiorek bohatera to znak posłańca, a zarazem klucz do szyfru kronik. To wyjaśnia słowa dziadka („Kruk w tej rodzinie... długa
  historia”), kruka na maszcie w prologu i pytanie Lorda o kamienie z krukiem (K32).
- **Wojsko królewskie w garnizonie.** Na wyspie stoi chorągiew króla z lądu (biała chorągiew z feniksem, ta z `!Flags_banner`, już jest
  w paczce). Lord wpuścił ją za pieniądze i musi płacić Koronie podatek wojenny. Dlatego tak naciska na dług dziadka. Ludzie Lorda
  (Wit, celnik, straż dworu) i królewscy patrzą na siebie krzywo.
- **Soczewka latarni nie jest odłamkiem Serca.** To „Oko Strażnicy”: szkło zakon wyszlifował z kryształu Pierwszych (piętra 51-75).
  We mgle odbija Serce jak przez łzy. Serce zostaje jedno, ale wojna i tak toczy się o tę plotkę.

---

## 3. Pustelnia na klifie (Map155, wnętrze Map156 Skryptorium)

### Gdzie i jak dojść
Północno-zachodni klif. Z przystani: górna krawędź Map125, pola 14-16 (nad suszarniami sieci Janka). Na Map125 dochodzi jedno zdarzenie
przejścia, kafelki bez zmian. Dalej ścieżka biegnie na wschód, do Urwiska Kruków.

### Układ mapy (`rzut_pustelnia.png`)
**Map155**, 48 × 36, tileset 11 (jak przystań). Trzy poziomy: na dole kamienista plaża i las, wyżej zbocze, na samej górze klif.
Notatka `<Clouds:on><Farm:off>`. Szum morza (`Sea`).

| nr | miejsce | opis |
|---|---|---|
| 1 | Ścieżka z przystani | wejście od dołu |
| 2 | Schody na skałę | kamienne stopnie w licu skały |
| 3 | Kopiec z krukiem | znak zakonu na rozstaju |
| 4 | Schody na klif | |
| 5 | **Skryptorium** | kamienna kaplica zakonu z wnętrzem (Map156): pulpit, skrzynie kronik, tarcza szyfru |
| 6 | Wieża skryptorium | dawna strażnica; dzwon bez serca (bez dzwonu w środku - patrz W2 rozdz. 7) |
| 7 | Cela brata Kleofasa | tu śpi, zamknięta |
| 8 | Suchy ogródek i ule | miód i wosk |
| 9 | Pusta cysterna na deszczówkę | popup „Pusta. Od lat.” |
| 10 | Groby kronikarzy | trzy krzyże z imionami |
| 11 | Ławka nad urwiskiem | Kleofas o zachodzie słońca |
| 12 | Kamienista plaża | drewno i szczątki po sztormach |
| 13 | Ścieżka na wschód | do Urwiska |

Światła: latarenka przy drzwiach skryptorium, świece w środku. Wszystko to płomienie.
**Wnętrze Map156 Skryptorium** (tileset 8, jak wnętrza Podgrodzia): pulpit z księgą, regały kronik, stół kopisty z kałamarzem, piec,
skrzynia z tarczą szyfru, okno na morze.

### Postać: brat Kleofas
- **Wygląd:** ok. 75 lat, chudy i przygarbiony, łysy z białym wiankiem włosów. Spłowiały niebieski habit (kolor zakonu, taki sam jak w
  skrzyni Najstarszego w Osadzie), sznur w pasie, na nim mosiężna tarcza szyfru. Palce czarne od atramentu, sandały. Styl bohatera
  (PixelLab), żadnego RTP.
- **Charakter:** zrzędliwy i suchy, ale uczciwy. Nie ufa miastu („Zrobili z nas piosenkę”). Lubi miód i porządek. Uczeń ostatniego
  kronikarza; swojego ucznia nigdy nie miał, „bo nikt nie przyszedł”.
- **Rozkład dnia:**

  | godziny | co robi | gdzie |
  |---|---|---|
  | 4-5 | wstaje | cela |
  | 5-7 | stoi nad urwiskiem twarzą do morza (godzinki) | ławka nad urwiskiem |
  | 7-12 | przepisuje kroniki | skryptorium (Map156) |
  | 12-13 | je chleb z miodem | ławka |
  | 13-16 | ogródek i ule | ogródek |
  | 16-19 | skryptorium | Map156 |
  | 19-20 | patrzy na zachód słońca | ławka nad urwiskiem |
  | 20-4 | śpi | cela (zamknięta) |

  W deszcz cały dzień w skryptorium. Nigdy nie schodzi do miasta.
- **Pierwsza rozmowa:**
  > **Kleofas:** Stój. Z ogniem nie podchodź do ksiąg. *(jeśli bohater trzyma pochodnię)*
  > **Kleofas:** ...Czego tu szukasz? Do miasta jest w drugą stronę.
  > **\N[1]:** Szedłem wzdłuż klifu. Nie wiedziałem, że ktoś tu mieszka.
  > **Kleofas:** Mało kto wie. I dobrze. *(patrzy na szyję bohatera)* Pokaż to.
  > **\N[1]:** Wisiorek? Był mojego ojca.
  > **Kleofas:** Ojca... Hm. To by się zgadzało. To nie ozdoba, chłopcze. To znak posłańca. Kruki nie biorą się znikąd.
  > **Kleofas:** Jestem Kleofas. Przepisuję tu rzeczy, których nikt już nie czyta. Jak przyniesiesz atrament, może ci coś przeczytam.
- **Co oferuje:** sprzedaje miód (Miód, 76) i świece woskowe do wnętrz; odczytuje karty kronik; raz w roku odpowiada na jedno pytanie;
  plotki „z kronik” zamiast plotek z miasta.

### Zadania
- **K50 „Atrament dla pustelnika”** (krótkie, od dnia 6). Kleofasowi skończył się atrament. Przynieś 4× Szyszki (na garbnik), 1× Żelazo
  (na rdzę) i 1 porcję własnej deszczówki (zadanie zabiera wodę, nie daje). Nagroda: 2× Miód, 15 G, Kleofas zaczyna czytać kroniki.
- **D22 „Zaszyfrowane kroniki”** (długie, Akt I-II). Sześć kart kroniki, każda w innym miejscu:
  1. Archiwum zakonu (W2 rozdz. 6): jeśli kroniki zabrałeś albo dałeś Ambrożemu. Sprzedane Baltazarowi trzeba odzyskać nocą (W5).
  2. Piętro 20: ostatnia nie wyrwana karta Księgi pytań.
  3. Osada Milczących: „Rejestr straży” Najstarszego (po W8 rozdz. 5).
  4. Kajuta wraku (D24): strona wywieziona przez Dobiesza, z notatkami Czarnych Oczu.
  5. Latarnia: kartka przepisana do Księgi mgieł przez dawnego latarnika.
  6. Urwisko: zwitek w obrączce oswojonego kruka (D23).

  Każdą kartę czytasz z Kleofasem przy pulpicie: 2 godziny gry, klucz to tarcza szyfru i nacięcia na twoim wisiorku. Odczytane karty to
  rozdziały „Kroniki upadku” w dzienniku: (1) zasada jednego pytania, (2) cztery straże i kruczarze, (3) trzy pytania Dobiesza i jego
  ucieczka z kartami, (4) upadek i zapieczętowanie, (5) imiona kruczarzy - jest wśród nich pradziad Stacha, (6) cysterna i racje wody.
  Nagroda: po 40 dośw. za kartę, 120 G na koniec, Kleofas ci ufa, otwiera się „Jedno pytanie”.
- **W2 rozdz. 7 „Jedno pytanie” - przeniesiony do pustelni** (zmiana istniejącego wątku, Akt II). Ambroży oddaje bohaterowi serce
  dzwonu z wieży skryptorium (ród dzwonników przechował je po upadku). Zanosisz je Kleofasowi. W Noc Pytania (Wigilia, północ) dzwon w
  wieży bije siedem razy, a Kleofas odpowiada na jedno pytanie z kronik. Pytania z listy, odpowiedzi ze stanu gry (np. „Co ukrywa mój
  dziadek?” → kruczarze; „Kto zdradzi miasteczko?” → zależnie od flag W1/W5; „Czy Lord wiedział o wodzie?” → nie). Jedno pytanie na rok
  gry. Nagroda: prawda w dzienniku, 100 dośw.

### Mechaniki
- **Czytanie kronik:** karta w torbie (rzecz wirtualna zadania, bez wpisu w bazie) + Kleofas przy pulpicie 7-19 → rozmowa „Przeczytajmy
  kartę”, 2 godziny mijają (jak odpoczynek), notatka w dzienniku. Bez wisiorka nie da się czytać (wisiorek jest zawsze, nie do sprzedania).
- **Pytanie raz w roku:** licznik w stanie wtyczki; dziennik pokazuje „Następne pytanie: Wigilia roku 2”.

### Ryzyka i pytania
- Przeniesienie W2 rozdz. 7 z dzwonnicy do pustelni zmienia katalog (`docs/QUESTY.md`). Rozdział nie był zrobiony, więc nic się nie psuje.
- Ród kruczarzy to duża decyzja fabularna (pytanie 4).

---

## 4. Urwisko Kruków (Map157) i oswojony kruk

### Gdzie i jak dojść
Za wzgórzem tawerny, od strony morza. Wchodzi się tylko wybrzeżem: z pustelni (zachodnia krawędź) albo z przylądka (wschodnia). Od
miasteczka nie, bo jego mury i tawerna zostają bez zmian. Później, pod ziemią, kanał z cysterny wychodzi tu kratą z krukiem.

### Układ mapy (`rzut_urwisko.png`)
**Map157**, 56 × 36, tileset 11. Na górze morze, pod nim klif z resztkami muru twierdzy i dwiema basztami. Niżej taras ze ścieżką,
na dole zbocze wzgórza tawerny.

| nr | miejsce | opis |
|---|---|---|
| 1 | Ścieżka od pustelni | wejście z zachodu |
| 2 | Schody do ruin | w licu górnego tarasu |
| 3 | Resztki muru twierdzy | wyrwy z widokiem na morze |
| 4 | **Kruczarnia** | ruina baszty: żerdzie, gniazda, młody kruk z obrączką zakonu |
| 5 | Baszta z gniazdami | dziesiątki kruków (stada z Birds.js) |
| 6 | **Przelew cysterny** | łukowe wejście z kratą i krukiem (grafika już jest: `!Quest_Places`); po deszczu słychać za nią wodę |
| 7 | Rynny zakonu | kanały wykute w skale, zbiegają do przelewu (K53) |
| 8 | Kamienie z krukiem | w gruzie; szukają ich Czarne Oczy |
| 9 | Zejście na zbocze | ścieżka w dół |
| 10 | Ścieżka na wschód | do przylądka |
| 11 | Nocny obóz obcych | ludzie Czarnych Oczu kopią nocą w gruzie (obóz Humans.js, po D24) |

Bez wnętrza (kruczarnia to otwarta ruina). Światło: tylko ognisko obozu obcych nocą.

### Postacie
Na Urwisku nie ma ludzi, są kruki. Rozmowy prowadzą trzy znane postacie:
- **Roch** (przystań): „Kruk znowu siedział na maszcie wraku. Co rano. Patrzy na ciebie, nie na mnie.” (już to mówi w grze - to
  początek K51).
- **Kleofas**: „Ten? To z Urwiska. Kruczarnia zakonu. Ostatni kruczarz umarł, zanim się urodziłem.”
- **Dziadek Stach** (D23): rozpoznaje obrączkę i wreszcie opowiada „długą historię”:
  > **Stach:** Skąd to masz? ...Siadaj. Mój dziad trzymał kruki. Tam, na Urwisku, zanim na górze postawili karczmę. Mówił, że nasza rodzina nosi listy, których nikt nie powinien czytać. Śmiałem się z niego.
  > **Stach:** Twój ojciec też się śmiał. A potem dał ci ten kamień na szyję. *(milknie)* Dbaj o tego ptaka.

### Kruk (nowy towarzysz, jak pies)
Kruk to ten sam ptak, który w prologu siadł na maszcie kutra. Mieszka w kruczarni, a co rano przylatuje na przystań.
- **Oswajanie (D23):** karmisz go w kruczarni trzy razy, w trzy różne dni (surowe mięso, ryba albo resztki ze zwłok). Nie wolno przy tym
  biegać, a psa trzeba zostawić w domu. Po trzecim razie siada ci na ramieniu i daje zdjąć zwitek z obrączki (karta kroniki nr 6).
- **Grzęda kruka:** nowy budynek na polu dziadka, tak jak buda psa (4× Gałęzie, 2× Deski, 1× Lina, pole 1 × 1). Kruk śpi na grzędzie
  21-5. Je to, co pies (mięso, ryby), pije z kałuży, garnka, wiadra albo z miseczki przy grzędzie. Głodny przez trzy dni wraca na
  Urwisko; żeby go odzyskać, trzeba go znów nakarmić w kruczarni.
- **Imię:** nadaje gracz (ten sam ekran imienia co w prologu), domyślnie „Kruk”.
- **Co robi** (menu przy grzędzie albo gdy leci z bohaterem):
  - **Leć ze mną / Zostań** - leci nad bohaterem z mapy na mapę, siada na pobliskich dachach i drzewach.
  - **Zanieś list** - raz dziennie do znanej postaci na wyspie (Janek, Roch, Kleofas, Bazyli, Ambroży, dziadek...). Listy z zadań
    oznaczone jako „może zanieść kruk” zalicza się bez chodzenia. Kruk wraca po 1-2 godzinach z odpowiedzią w dymku. **Tylko na wyspie:
    nie leci przez morze do matki** (W10 zostaje otwarty).
  - **Zwiad** - raz dziennie leci na wybraną, odwiedzoną mapę. Do końca dnia kompas pokazuje tam zwierzynę, ludzi (obozy bandytów),
    rudę, dojrzałe krzaki i grzyby.
  - **Pilnuj pola** - siedzi na grzędzie i przegania wrony i wróble z zasiewów w promieniu 5 pól (jak strach na wróble, ale większy).
  - **Błyskotka** - rano na grzędzie czasem coś leży: 1-5 G (40%), zgubiona rzecz (30%), **cudzy list** (20%). Cudzy list to mały
    sekret mieszkańca (np. liścik Tadka do Hanki z D7, kwit Baltazara, IOU Wita, list rozbitka z W12). Wybór: przeczytaj (notatka, czasem
    otwiera zadanie), oddaj właścicielowi (Opinia +1, ten ktoś ci ufa) albo sprzedaj Baltazarowi (G, Baltazar coś wie).
- **Bez walki** na początek. Kruk nie umiera: wystraszony odlatuje na Urwisko.

### Zadania
- **K51 „Kruk z masztu”** (krótkie, od dnia 8, po rozmowie z Rochem). O świcie (5-7) kruk siedzi na maszcie wraku kutra na plaży (gdy
  kuter stoi już na pochylni - na jego maszcie). Idź za nim: leci przez górną krawędź przystani, przysiada przy pustelni (dymek Kleofasa), aż do kruczarni na Urwisku. Kiedy zostaniesz z tyłu,
  czeka (jak kot w D12). Nagroda: 40 dośw., odkrycie Urwiska, start D23.
- **D23 „Oswojony kruk”** (długie, 3-5 dni). Trzy karmienia w kruczarni, obrączka i zwitek, rozmowa z dziadkiem, grzęda na polu.
  Nagroda: kruk, karta kroniki nr 6, notatka „Ród kruczarzy”, 100 dośw.
- **K53 „Rynny zakonu”** (krótkie, Akt II, po D27): oczyść 4 rynny w skale z gruzu i gniazd (kilof albo łopata), żeby deszcz znowu
  spływał do cysterny. Nagroda: cysterna dostaje więcej wody po każdym deszczu (punkt 8), Opinia +3. Logika zadania należy do cysterny,
  na Urwisku są tylko znaczniki „Miejsce: rynna_1..4”.

### Ryzyka i pytania
- Kruk to nowy system obok psa (osobna wtyczka `Kruk.js`, wzór z `Dog.js`). Najdroższa grafika pakietu: ptak w locie i na żerdzi.
- Cudze listy muszą być lekkie: małe sekrety, nie rozstrzygają wielkich wątków.

---

## 5. Przylądek z latarnią (Map159, wnętrza Map160 Izba latarnika, Map161 Laterna)

### Gdzie i jak dojść
Północno-wschodni przylądek. Z Urwiska ścieżką na wschód (zachodnia krawędź). Opcja: z Gór (Map013, prawa krawędź, pola 59, 11-13)
ścieżką w dół na przylądek - wtedy wyspa ma pętlę. Na Map013 dochodzi wtedy jedno zdarzenie przejścia.

### Układ mapy (`rzut_latarnia.png`)
**Map159**, 44 × 40, tileset 11, notatka `<Clouds:on><Farm:off><Water:salt>`. Przylądek wcina się w morze. Dwa tarasy ze schodami,
latarnia na samym cyplu.

| nr | miejsce | opis |
|---|---|---|
| 1 | Ścieżka z Urwiska | wejście z zachodu |
| 2 | Ścieżka z gór | opcja |
| 3 | Schody na przylądek | wykute w skale |
| 4 | **Latarnia** | kamienna wieża na fundamencie strażnicy zakonu (grafika do zrobienia, w szkicu kafelki muru i korona baszty) |
| 5 | Laterna z soczewką | na górze ogień i soczewka; wnętrze Map161 |
| 6 | **Izba latarnika** | wnętrze Map160: łóżko, stół, piec, Księga mgieł |
| 7 | Drewutnia i opał | |
| 8 | Beczki tranu | paliwo latarni |
| 9 | Dzwon mgłowy | Bazyli bije w niego co godzinę, kiedy jest mgła |
| 10 | Słup strażnicy | kruk wykuty w kamieniu |
| 11 | Zatoczka szczątków | po sztormie morze wyrzuca tu skrzynie i drewno (łup) |

**Ogień latarni to płomień** w koszu na szczycie (jak ognisko, z migotaniem), soczewka tylko go skupia. Nocą snop światła nad morzem
(warstwa jak promienie słońca w Sky.js, ale ciepła, z ognia). Morze słone (popup, tylko wędka), jak na przystani.

### Postać: latarnik Bazyli Krzesiwo
- **Wygląd:** ok. 60 lat, wysoki i kościsty, długie siwe włosy związane rzemieniem, jedno oko zasnute bielmem. Płaszcz z woskowanego płótna
  jak u Rocha, ale czarny od sadzy. Na pasie hubka i krzesiwo, w ręku latarka. PixelLab, styl bohatera.
- **Charakter:** spokojny, poważny, mówi mało i dokładnie. Wszystko zapisuje w **Księdze mgieł**. Nie tłumaczy, co widzi. Poważny
  odpowiednik Ozzy'ego: Ozzy bełkocze prawdy po pijanemu, Bazyli zapisuje je trzeźwy.
- **Rozkład dnia** (zmierzch i świt z `Sky.sunTimes`):

  | godziny | co robi | gdzie |
  |---|---|---|
  | świt-8 | gasi ogień, pisze w Księdze mgieł | laterna, potem izba |
  | 8-15 | śpi | izba (Map160) |
  | 15-17 | rąbie drewno, nosi opał | drewutnia |
  | 17-zmierzch | je, czyści soczewkę | izba |
  | zmierzch-świt | czuwa przy ogniu, obchodzi galerię; w mgle bije w dzwon | laterna (Map161) |

- **Pierwsza rozmowa:**
  > **Bazyli:** *(długo patrzy)* Kruk na szyi. Widziałem go we mgle. Trzy noce temu. Na szyi chłopca, który wyszedł z morza.
  > **\N[1]:** ...Mnie? Trzy noce temu byłem jeszcze w gorączce u dziadka.
  > **Bazyli:** Wiem. Zapisałem. *(stuka w księgę)* Bazyli. Pilnuję ognia, żeby statki nie szły na skały. Czasem ogień pokazuje więcej, niż powinien.
  > **Bazyli:** Jak przyniesiesz tranu, zapłacę. Jak będzie mgła, możesz wejść na górę. Ale tylko raz na noc. I nie pytaj mnie, co znaczy to, co zobaczysz.
- **Co oferuje:** skupuje opał (Drewno 2 G, Węgiel drzewny 4 G, Tran 6 G); raz dziennie mówi pogodę na dwa dni dokładnie z planu
  pogody (bez zakładu, w odróżnieniu od Ozzy'ego); w mgliste noce wpuszcza na górę do soczewki.

### Zadania
- **K49 „Tran dla latarni”** (krótkie, od dnia 24 - po drugiej fali prom nie przywozi tranu). Przynieś 4× Tran i 6× Drewno. Tran: 3 ryby
  w kociołku (nowy przepis) albo od Janka po 6 G. Nagroda: 30 G, Bazyli ufa, wstęp do laterny.
- **D21 „Księga mgieł”** (długie). Trzy mgliste noce przy soczewce, w dowolnej kolejności. Każda daje jedną wizję i notatkę:
  1. „Statek bez bandery przybija nocą” - ostrzeżenie przed Nocą promu (W5) i przed napadem z Aktu III.
  2. „Człowiek z piórem w czarnej wodzie rysuje wyspę” - poszlaka do rozbitka (W12).
  3. „Kobieta przy rzece, tabor idzie na północ” - matka, zgodnie z W10 (to samo widziała uchodźczyni). Nie mówi, czy matka przypłynie.

  Na koniec Bazyli pyta, co widziałeś: powiedz (zapisuje to, ufa ci bardziej) albo zachowaj dla siebie („Niektóre rzeczy lepiej nosić
  samemu”). Nagroda: 120 dośw., karta kroniki nr 5 (przepisana w księdze przez dawnego latarnika), 60 G.
- **W11 „Soczewka”** (wątek, Akt II-III).
  1. Baltazar oferuje 400 G za „szkiełko z latarni” (W5).
  2. Nocny napad ludzi na latarnię (Humans.js, jak napad z W1 6c): obronić Bazylego albo przyjść za późno (soczewka skradziona, do
     odzyskania w kantorze Baltazara w W5 albo u ludzi Czarnych Oczu na Urwisku).
  3. Kleofas czyta w kronikach, czym jest soczewka (Oko Strażnicy z kryształu Pierwszych). Wybór: zostawić w latarni (Bazyli pilnuje),
     rozbić (latarnia świeci, ale Bazyli traci wizje) albo sprzedać Baltazarowi (pieniądze, Czarne Oczy mają „pewność” na jedną noc -
     napad z Aktu III jest trudniejszy).
  
  W zakończeniach (piętro 100): po „zniszczeniu Serca” soczewka ślepnie, przy „zapieczętowaniu z zasadami” Bazyli widzi tylko w Noc
  Pytania. Jedno zdanie w epilogu.

### Mechaniki
- **Mgła morska nocą:** w noc przed mglistym porankiem (`Sky.mistOfDay(jutro)` ≥ 0,6) na przylądku ciągną pasma mgły (te same bitmapy
  mgły co w Sky.js), dzwon mgłowy bije co godzinę. Tylko wtedy działa soczewka.
- **Wizja przy soczewce:** biały ekran, sylwetka na planszy (styl plansz prologu), jedno zdanie, notatka. Raz na noc. Koszt: następnego
  dnia „Ciężka głowa” (wolniejsza odnowa sił do południa). Umiejętność Hart ducha (drzewko z walki z podziemi) koszt zmniejsza.
- **Zapas opału latarni:** licznik nocy. Kiedy spada do zera w czasie blokady, latarnia gaśnie. Wtedy (opcja do decyzji) następny prom
  się spóźnia o dzień - to dotyka kalendarza promu (`TownQuests.isFerry`), więc tylko za zgodą.

### Ryzyka i pytania
- Wizja o matce dotyka otwartego wątku. Proponuję tylko to, co już mówi uchodźczyni w W10 (matka żyje, idzie z taborem), nic więcej.
- Grafika latarni musi pasować do budynków „prosto z przodu” (zasada z 2026-09-24): wysoka wieża w stylu F, robiona jak budynki pola.

---

## 6. Garnizon nad zatoką (Map162, wnętrze Map163 Kwatera rotmistrza)

### Gdzie i jak dojść
Na południe od przystani, nad tą samą zatoką. Z dolnej krawędzi przystani (pola 21-23, obok plaży z wrakiem kutra). Na Map125 dochodzi
jedno zdarzenie przejścia.

### Układ mapy (`rzut_garnizon.png`)
**Map162**, 56 × 40, tileset 11, `<Clouds:on><Farm:off><Water:salt>`. Po lewej zatoka i mielizna z wrakiem w oddali, po prawej
palisada z bramą od północy.

| nr | miejsce | opis |
|---|---|---|
| 1 | Droga z przystani | |
| 2 | Stół werbownika | pod daszkiem przed bramą: lista, bęben, chorągiew |
| 3 | Brama garnizonu | wartownik, koksownik |
| 4 | Koszary | dom z bali, wstęp tylko dla wojska |
| 5 | **Kwatera rotmistrza** | kamienny dom z chorągwiami z feniksem (prefabrykat autora), wnętrze Map163 |
| 6 | **Spichlerz z rekwizycji** | zboże z D14 i z pól; skup u kwatermistrza |
| 7 | Plac ćwiczeń | manekiny i tarcze strzelnicze (z `!Town_Props`) |
| 8 | Namioty | żołnierze i namiot kwatermistrza |
| 9 | Kuchnia polowa | kocioł, wieczorem żołnierze przy ogniu |
| 10 | Dyby | kara dla dezerterów i złodziei |
| 11 | Wieża strażnicza | widok na zatokę i wrak |
| 12 | Pomost i łódź ratownicza | żołnierze wyławiają łup z wraku |
| 13 | Łacha w odpływie | nocą pieszo do wraku |
| 14 | Wrak w oddali | ten sam, co z przystani |

**Woda:** beczki „z wodą z promu” stoją pod strażą i dają tylko dymek „Woda dla wojska. Odejdź.” Żadnego źródła wody dla bohatera.
Palisada w szkicu to ściana z bali; docelowo pale (grafika albo kafelki autora).

### Postacie (PixelLab, styl bohatera; żołnierze jednym arkuszem w dwóch kolorach)
- **Rotmistrz Florian Bełza.** Ok. 50 lat, siwe wąsy, biały tabard z pomarańczowym feniksem na napierśniku, szabla, utyka na lewą nogę.
  Surowy, sprawiedliwy, zmęczony wojną. Trzyma listę zaginionych żołnierzy.
  - 6-7 musztra na placu · 7-12 kancelaria (Map163) · 12-13 kuchnia · 13-16 obchód: brama, pomost, wieża · 16-20 kancelaria ·
    20-22 przy ogniu · 22-6 śpi.
  - Pierwsza rozmowa:
    > **Bełza:** Stój. Czyj jesteś?
    > **\N[1]:** Wnuk Stacha. Z pola za lasem.
    > **Bełza:** Stacha... Ten od długu u Lorda. *(mierzy bohatera wzrokiem)* Ile masz lat? ...Jeszcze nie. Przyjdź za rok, to dostaniesz buty i żołd.
    > **Bełza:** Masz zboże, to sprzedaj je Kłosowi. Na wojnie każdy worek się liczy. Masz ręce, to drwa zawsze się przydadzą.
- **Kwatermistrz Pafnucy Kłos.** Gruby, rumiany, z księgą i liczydłem, fartuch na tabardzie. Wesoły i przekupny: część królewskiego
  zboża sprzedaje nocą Baltazarowi.
  - 7-18 spichlerz i namiot (skup) · 18-22 przy ogniu · w noce po dniu promu 23-1 przy tylnych drzwiach kantoru na rynku (to jeden
    z gości „trzech stuknięć” z W5) · reszta nocy śpi w namiocie.
- **Werbownik Szczepan Bęben.** Ok. 30 lat, kapelusz z piórem, bęben na pasie, donośny głos („Za króla, chłopcy!”).
  - Zwykle przy stole przed bramą 8-16. W dzień po każdej fali (11, 25, 39, 53) na rynku w miasteczku 9-14 z bębnem i listą.
- **Żołnierze królewscy** (2-4, bez imion): musztra, warta przy bramie i na pomoście, łódź ratownicza przy wraku 9-15, nocą dwaj
  wartownicy (brama, pomost) z polem widzenia jak strażnik dworu w W1.

### Zadania
- **K52 „Drewno dla garnizonu”** (krótkie, od dnia 5). 10× Drewno i 4× Węgiel drzewny dla kuchni polowej. Nagroda: 20 G, przychylność
  garnizonu +20, otwiera się skup u Kłosa.
- **D25 „Lista poborowa”** (długie, w dzień po fali). Werbownik musi zabrać trzech ludzi z miasteczka i Podgrodzia. Na liście są m.in.
  Bartek Kmieć, Zbych Smolarz i Darin (a Rafał, jeśli jest w obozie). Wybór:
  - a) pomóc - namawiasz albo wskazujesz ludzi (10 G za każdego, przychylność +5, Opinia -3 za każdego);
  - b) ostrzec i ukryć - ludzie znikają na dzień (Opinia +3 za każdego, przychylność -10, straż przeszukuje obóz i domy);
  - c) układ - zanosisz rotmistrzowi Dziennik okrętu z wraku (D24): Czarne Oczy straciły okręt, od morza nic nie grozi. Pobór tylko
    z ochotników (przychylność +10, Opinia +5, 60 dośw.).
- **D26 „Zboże dla obozu”** (długie, po rekwizycji D14). Obóz uchodźców głoduje, Ludmiła prosi o pomoc. Zdobądź 4 worki zboża: kup je
  nocą od Kłosa „po cenie dla swoich” (dowód, że sprzedaje królewskie zboże) albo wynieś nocą ze spichlerza (skradanie obok wartownika).
  Potem: wydaj Kłosa rotmistrzowi (przychylność +15, Kłos odpływa promem, Baltazar traci dostawcę - flaga dla W5) albo milcz (Kłos jest
  twoim dłużnikiem: lepsze ceny). Nagroda: Opinia +5 (zaufanie obozu W6), 80 dośw.

### Mechaniki
- **Skup wojskowy** u Kłosa: jęczmień, ziemniaki, marchew, kapusta, wędzone mięso i ryby, skóry, strzały, drewno, węgiel. Zwykła cena,
  a przez 7 dni po każdej fali ×1,5. Kiedy w mieście jest głód (tydzień po rekwizycji D14), każdy dzień sprzedaży jedzenia wojsku
  kosztuje Opinię -1 („nasze zboże idzie na wojnę”). Dobre pieniądze na dług dziadka, ale z ceną.
- **Przychylność garnizonu** 0-100 (start 20), osobno od Opinii w miasteczku. 40: glejt na wrak (D24 legalnie). 60: kowal garnizonu
  sprzedaje strzały i stal. 80: po alarmie z Aktu III dwóch żołnierzy broni tawerny (wpis do obrońców Aktu III). Poniżej 10: patrol na
  drodze przystań-garnizon zagląda do torby i zabiera kamienie z krukiem.
- **Bohater nie jest wcielany.** Jest za młody, a dług dziadka „ręczy dwór”. Pobór dotyczy innych.
- **Cichy haczyk (opcja):** na liście zaginionych rotmistrza jest chorągiew ojca. Tylko słowo „zaginiony”, nic więcej.

### Ryzyka i pytania
- Kto stoi w garnizonie, to decyzja o wojnie (pytanie 2).
- Nowa miara przychylności - mała, tylko progi wyżej.

---

## 7. Wrak na mieliźnie (Map165, pod pokładem Map166) i rozbitek w tawernie

### Gdzie i jak dojść
Mielizna w zatoce, na zachód od garnizonu (wrak widać już z przystani i z garnizonu). Trzy drogi:
- **Łodzią Janka** - po K47, za dnia, bez sztormu. Bez glejtu garnizonu żołnierze z łodzi ratowniczej mogą cię złapać (kara 20 G,
  przychylność -10). Z glejtem (przychylność 40) legalnie. Janek czeka 2 godziny.
- **Pieszo po łasze** - z garnizonu (zachodnia krawędź), tylko w odpływie i najlepiej nocą, obok wartownika na pomoście.
- Wybór w rozmowie z Jankiem (przez `TownLife.addTalkHook`, bez zmian w `Przystan.js`).

### Układ mapy (`rzut_wrak.png`)
**Map165**, 40 × 30, tileset 11, `<Water:salt>`. Piaszczysta łacha, kadłub przechylony na boku (duża grafika do zrobienia; w szkicu
obraz wraku z przystani i obrys), szczątki.

| nr | miejsce | opis |
|---|---|---|
| 1 | Przybicie łodzi | Janek czeka |
| 2 | Łacha od garnizonu | tylko w odpływie |
| 3 | Kadłub okrętu | „Biała Źrenica”, Straż Pewności |
| 4 | Dziura w burcie | zejście pod pokład (Map166) |
| 5 | Podarta bandera | białe oko na czerni |
| 6 | Skrzynie z ładunku | żołnierze garnizonu wynoszą łup |
| 7 | Złamany maszt | kruk siada tu co rano |
| 8 | Głębia | przypływ zalewa łachę |

**Map166 „Pod pokładem”** (tileset 8, deski): ładownia przechylona na bok, w dolnej części woda (w przypływie nie przejdziesz),
szczury, szkielet bosmana z kluczem do kajuty, kajuta kapitana: tuba z mapą, dziennik okrętu, skrzynka monet z okiem, skrzynka z
pięcioma kamieniami z krukiem.

### Rozbitek: „Eryk Sowa”, naprawdę Ansgar Wiel
- **Wygląd:** ok. 35 lat, chudy, nieogolony, ciemne włosy związane z tyłu, blizna nad lewą brwią, palce w atramencie. Za duży szary płaszcz
  (kupiony po sztormie od Józka Łaty). Zawsze długie rękawy: na lewym nadgarstku ma wytatuowane otwarte oko. PixelLab, styl bohatera.
- **Kim jest:** kartograf Straży Pewności z „Białej Źrenicy”. Jedyny, który dopłynął do brzegu. Udaje kupca suknem z lądu, rysuje gościom
  portrety za piwo. Boi się wszystkich: garnizonu, Lorda, a najbardziej swoich, gdyby przypłynęli.
- **Rozkład dnia:** 23-8 śpi (najtańsze łóżko w Pokojach gości, Map025) · 8-10 śniadanie w tawernie · 10-13 chodzi po rynku, z daleka
  od kantoru (Baltazar zna obce monety) · 13-17 przy stole w tawernie, rysuje · 17-19 na murach, patrzy na morze · 19-23 tawerna.
  Nigdy nie chodzi na przystań ani do garnizonu.
- **Tawerna bez zmian:** wszystkie miejsca gości (gosc_1..8) są zajęte. Proponuję wolny stołek przy stole jako miejsce domyślne w
  danych TownLife (bez zdarzenia na mapie), tak jak domyślne miejsca w miasteczku. Map001 i Map025 zostają nietknięte.
- **Pierwsza rozmowa:**
  > **Eryk:** Portret? Dwa grosze albo piwo. Masz ciekawą twarz. Zmęczoną.
  > **\N[1]:** Skąd jesteś? Nie mówisz jak tutejsi.
  > **Eryk:** Z lądu. Sukno. Było sukno. *(uśmiecha się krzywo)* Morze lubi sukno.
  > *(zerka na wisiorek i szybko odwraca wzrok)*
  > **Eryk:** Siadaj prosto. I nie ruszaj się, to wyjdziesz ładniej, niż jesteś.

### Zadania
- **D24 „Mapa z wraku”** (długie, od dnia 15). Dostań się na wrak (jedna z trzech dróg), zejdź pod pokład, znajdź klucz bosmana, otwórz
  kajutę. Łup: **Mapa z zaznaczeniami** (przedmiot kluczowy), **Dziennik okrętu** (lista załogi z opisem kartografa), monety z okiem,
  5 kamieni z krukiem, karta kroniki nr 4. Co z kamieniami: zgłosić celnikowi Samborowi (rozkaz dworu, 5 G za sztukę), sprzedać
  Baltazarowi (W5, 15 G za sztukę, Baltazar „pamięta”) albo zatrzymać (Kleofas tłumaczy, czym są). Nagroda: 100 dośw.
  **Mapa z zaznaczeniami** pokazuje siedem znaków białego oka: wzgórze tawerny, kamieniołom w Górach, przylądek z latarnią, pustelnię,
  Urwisko, kopiec z krukiem na polu dziadka (W4) i dwór. Te miejsca pojawiają się na kompasie i w dzienniku. Mapa prowadzi do pozostałych
  nowych miejsc.
- **W12 „Rozbitek”** (wątek, Akt I-II). Poszlaki (wystarczą dwie z pięciu):
  1. Dziennik okrętu: „Ansgar Wiel, kartograf. Blizna nad lewą brwią, palce w atramencie, oko na nadgarstku.”
  2. Józek Łata (Podgrodzie): po sztormie sprzedał płaszcz obcemu, ten zapłacił „dziwnym groszem z okiem”.
  3. Wizja w latarni (D21, wizja 2).
  4. Nocą, w łaźni tawerny (usługa Wandy) albo przy studni: podwinięty rękaw, tatuaż oka (skradanie).
  5. Cudzy list przyniesiony przez kruka: list szyfrem Czarnych Oczu.

  Rozmowa w cztery oczy. Wybór:
  - a) **Wydaj go garnizonowi.** 80 G, przychylność +20; Ansgar odpływa skuty promem. Opinia bez zmian, Melia przestaje z tobą żartować.
  - b) **Dochowaj tajemnicy.** Zostaje sojusznikiem: czyta szyfr Czarnych Oczu (karta 4 czyta się bez Kleofasa), a przed napadem z Aktu III
    mówi, którędy wejdą (fala przez kuchnię jest słabsza). Flaga dla Aktu III.
  - c) **Pomóż mu uciec** kutrem Rocha (po D20). Zostawia ci własną mapę ze wszystkimi kamieniami z krukiem na wyspie (kompas) i mówi,
    czego szukają Czarne Oczy.
  - d) **Podwójna gra.** Każesz mu narysować fałszywą mapę i sprzedajesz ją Baltazarowi (W5): 100 G, a ludzie Czarnych Oczu kopią w złym
    miejscu (obóz na Urwisku pojawia się później). Ryzyko: jeśli Baltazar to odkryje, nocny napad.
  
  Nagroda za rozdział: 150-250 dośw. zależnie od drogi.

### Mechaniki
- **Pływy** (nowa, mała funkcja w `Wrak.js`, do użycia też przez przyszłą wysepkę pływową): dwa odpływy na dobę po 3 godziny,
  przesuwają się o ok. 50 minut dziennie. Dziennik (Kalendarz) i Janek mówią, kiedy odpływ. W przypływie łacha jest pod wodą, a dolna
  ładownia zalana.
- **Wrak a garnizon:** żołnierze łowią łup łodzią 9-15. Za dnia bez glejtu - kara. Nocą wartownik na pomoście garnizonu patrzy na łachę
  (skradanie jak w ogrodzie dworu).

### Ryzyka i pytania
- Czyj okręt, to decyzja o wojnie (pytanie 3).
- Kadłub to duża grafika (PixelLab, kilkanaście generacji) - musi pasować do wraku tła z przystani.

---

## 8. Stara cysterna zakonu (Map167, podziemia)

### Gdzie i jak dojść
Pod wzgórzem tawerny. **Wejście z piętra 30** (Wielka cysterna, Map147): za Zasuwą główną, którą otwiera sygnał „cztery i dwa” w W1
rozdz. 7. Po tym rozdziale kod podmienia stronę zasuwy na przejście (plik Map147 bez zmian). Do piętra 30 jedzie się windą kasztelana,
więc droga jest późna, ale nie mordercza. **Wyjście:** kanał przelewu do kraty z krukiem na Urwisku. Krata otwiera się dźwignią od
środka i od tej chwili działa w obie strony.

### Układ mapy (`rzut_cysterna.png`)
**Map167**, 40 × 28, tileset 12 (ten sam co kwatery zakonu, piętra 11-30). Notatka jak na ręcznych piętrach (`<Dark:on>`, ciemność 226,
`<Ambience:cave>`, kapanie).

| nr | miejsce | opis |
|---|---|---|
| 1 | Przejście z piętra 30 | |
| 2 | **Słup miary** | dziesięć znaków poziomu wody (zapas 0-100) |
| 3 | Grobla | chodnik przez środek zbiornika |
| 4 | Zasuwa deszczowa | wpuszcza wodę z rynien Urwiska |
| 5 | Gałąź dworska | kanał pod dwór Lorda (to tę gałąź znalazł Feliks w W1) |
| 6 | Kąt wodnego | Księga racji: „jedno wiadro na strażnika na dzień” |
| 7 | **Czerpak zakonu** | kubeł na łańcuchu: jedyne miejsce, gdzie bohater nabiera wody |
| 8 | Kanał przelewu | do kraty na Urwisku |

Woda w zbiorniku jest widoczna, ale jak wszędzie pod ziemią „nie do picia” prosto ze zbiornika. Pić i nabierać można tylko czerpakiem.

### Jak cysterna nie łamie suszy
- **Późno:** dopiero po W1 rozdz. 7 (śluza otwarta) i po zejściu na piętro 30 (Akt II).
- **Raz dziennie:** czerpak daje **1 nabranie na dzień** (napić się do syta albo napełnić jedno naczynie: bukłak, wiadro, garnek). To
  zasada zakonu z Księgi racji.
- **Zapas jest skończony** (0-100, na start 55). Każdego dnia ubywa: 1 na studnię w miasteczku (po W1 rozdz. 7), 1 na ogród dworu (0,5 przy
  śluzie „do połowy”), plus nabrania bohatera. Przybywa tylko z deszczu: +3 za deszczowy dzień przy otwartej zasuwie deszczowej i czystych
  rynnach (K53), +1 przy zapchanych, 0 przy zamkniętej zasuwie.
- **Łańcuch czerpaka sięga tylko do trzeciego znaku.** Poniżej 30 bohater nie nabierze nic (fizycznie, nie zakazem). Poniżej 15 studnia w
  miasteczku daje mniej (Opinia spada, mieszkańcy mówią o tym).
- **Wybór:** zamknąć gałąź dworską (ogród Lorda usycha, miasto i zapas zyskują, Opinia +3, Lord chłodny, jeśli był sojusznikiem) albo ją
  zostawić. Czyli znowu „woda dla siebie czy dla innych” - ale tym razem z prawdziwym zbiornikiem.
- Żadne zadanie nie daje wody jako nagrody. Morze dalej jest słone.

### Zadania
- **D27 „Zapas zakonu”** (długie, Akt II). Wejdź za zasuwę, przejdź obok topielców w wodzie (rodzaj stwora z podziemi), znajdź Księgę
  racji i słup miary, otwórz kratę na Urwisku od środka, zdecyduj o gałęzi dworskiej. Nagroda: czerpak (1 nabranie dziennie), 150 dośw.,
  notatka „Racje zakonu”, rozdział 6 Kroniki upadku czyta się łatwiej.
- **K53 „Rynny zakonu”** (opisane przy Urwisku): więcej wody po deszczu.

### Ryzyka i pytania
- Skrót przez kratę na Urwisku przybliża cysternę do przystani. Proponuję go zostawić (limit 1 dziennie i zapas pilnują suszy). Jeśli
  wolisz ostrzej: krata tylko jako wyjście (z cysterny na Urwisko), nie wejście.

---

## 9. Kolejność w grze (dla gracza)

| kiedy | co |
|---|---|
| Akt I, dni 5-15 | Garnizon (K52, skup), Pustelnia (K50), kruk z masztu (K51) |
| Akt I, dni 15-40 | Wrak (D24) - mapa z zaznaczeniami prowadzi do reszty; oswojony kruk (D23); latarnia (K49 od dnia 24, D21 w mgliste noce); pobór (D25) w dni po falach; zboże dla obozu (D26) po rekwizycji |
| Akt I-II | Rozbitek (W12), Zaszyfrowane kroniki (D22) |
| Akt II | Cysterna (D27, K53), Jedno pytanie (W2 rozdz. 7, Wigilia), Soczewka (W11) |
| Akt III | ostrzeżenie Ansgara, żołnierze przy tawernie (przychylność 80), wizja „statek bez bandery”, epilog latarni i kruka |

Złoto z nowych zadań w rozdziale 1: ok. 250-450 G plus skup wojskowy. To „ciekawe”, nie „konieczne” pieniądze na dług.

---

## 10. Budowa: pakiety, pliki, numery, PixelLab

### Zasada
Każdy pakiet ma **własne mapy, własne wtyczki, własny zakres numerów zdarzeń, własny folder narzędzi, własny test i port**. Wspólne pliki
(baza danych, `plugins.js`, rdzeń) zmienia **tylko koordynator**: raz przed startem (rusztowanie) i raz na końcu (integracja), po kolei, przy
zamkniętym edytorze (tasklist przed każdym zapisem, kopie w `backup_art_<data>/`).

### Pakiet 0 - rusztowanie (koordynator, przed agentami, ok. godziny)
1. `data/MapInfos.json`: wpisy 155-167 (zewnętrzne pod Przystanią, wnętrza pod swoimi mapami, 167 pod Ruinami Zamku) i puste mapy-zaślepki
   tych numerów, żeby drzewo w edytorze się nie sypało.
2. `js/plugins.js`: puste pliki wtyczek wpisane od razu na stałe miejsca. Dane zadań pakietów (`*_Data.js`) **przed `TownQuests.js` i
   `TownLife.js`** (dopisują się do `TownQuestsData.QUESTS` / `TownLifeData.RESIDENTS`, zanim silniki je przeczytają), silniki pakietów na
   końcu listy, przed `TitleScreen` / `Prologue`.
3. `TownLife.js`: drobna zmiana - mieszkaniec może mieć stały numer (`id`), żeby kolejność wtyczek nie przesuwała numerów; numery
   **943-948** rozdane z góry (943 latarnik, 944 pustelnik, 945 rotmistrz, 946 kwatermistrz, 947 werbownik, 948 rozbitek). Zostaje 949.
   Wsparcie domyślnego miejsca w tawernie bez zdarzenia na mapie (dla rozbitka).
4. `TawernaCore.js`: wpisy zakresów do rejestru (niżej).
5. `data/Items.json`: dopisane na końcu prawdziwe przedmioty: **Tran**, **Mapa z zaznaczeniami** (kluczowy), **Obrączka z krukiem**
   (kluczowy). Reszta to rzeczy wirtualne zadań (karty kroniki, dziennik okrętu, glejt, atrament, serce dzwonu, soczewka). Pola ikon
   zarezerwowane (w IconSet jest 51 pustych pól, np. 438-443); ikony rysują pakiety, wkleja koordynator na końcu.
6. `data/System.json`: nazwy przełączników 17-20 (Cysterna_Zasuwa, Urwisko_Krata, Latarnia_Mgla, Garnizon_Glejt) - jeśli pakiety ich
   potrzebują.

### Pakiety równoległe

| pakiet | mapy | wtyczki | numery zdarzeń | TownLife | zadania | test / port | PixelLab (ok.) |
|---|---|---|---|---|---|---|---|
| **A Pustelnia** | 155, 156 | `Pustelnia_Data.js`, `Pustelnia.js` | 600-609 | 944 | K50, D22, W2 rozdz. 7 | `pustelnia_test.js` / 9501 | 40 (Kleofas) |
| **B Urwisko i kruk** | 157 | `Kruk_Data.js`, `Kruk.js` | 610-629 | - | K51, D23 (+ znaczniki dla K53) | `kruk_test.js` / 9502 | 90 (kruk: żerdź, skoki, lot, lądowanie, list; grzęda) |
| **C Latarnia** | 159, 160, 161 | `Latarnia_Data.js`, `Latarnia.js` | 630-639 | 943 | K49, D21, W11 | `latarnia_test.js` / 9503 | 60 (Bazyli, latarnia, plansze wizji) |
| **D Garnizon** | 162, 163 | `Garnizon_Data.js`, `Garnizon.js` | 640-669 | 945-947 | K52, D25, D26 | `garnizon_test.js` / 9504 | 155 (3 postacie + żołnierz, palisada, wieża) |
| **E Wrak i rozbitek** | 165, 166 | `Wrak_Data.js`, `Wrak.js` | 670-679 | 948 | D24, W12 | `wrak_test.js` / 9505 | 55 (Ansgar, kadłub) |
| **F Cysterna** | 167 | `Cysterna.js` | 680-689 | - | D27, K53 | `cysterna_test.js` / 9506 | 0-5 |

Zakres 690-699 zostaje w rezerwie (np. dla przejść wstawianych w kodzie, gdybyś wolał nie dopisywać zdarzeń do Map125 i Map013).
Sprawdziłem wolne numery: zajęte są 730-753 (test rdzenia), 760-779 (przystań), 800-827 (Serce), 840-859 (Akt III), 860-899 (stwory),
901-998 (Story, TownQuests, TownLife, TavernLife, dom dziadka), 1000+ (sosny). Porty 9501-9506 nie są używane przez żaden test.
Razem PixelLab ok. **400-420 generacji**; limit 10 zadań naraz jest wspólny, więc grafikę najlepiej robić w dwóch falach.

**Kto czego dotyka poza swoim pakietem** (tylko ten jeden pakiet, nikt inny):
- A: blok W2 w `TownQuests_Data.js` (rozdz. 7) - jedyny pakiet, który zmienia ten plik.
- B: `Farming_Data.js` (budynek „Grzęda kruka”) - jedyny pakiet, który zmienia Farming.
- C: przepis „Tran” w kociołku - przez API przepisów, a jeśli go nie ma, to zmianę robi koordynator na końcu.
- D: obrońcy Aktu III - dopisuje się do tablicy `Act3Data.DEFENDERS` w czasie ładowania (bez zmian w pliku).
- E: łódź Janka - przez `TownLife.addTalkHook` (bez zmian w `Przystan.js`); funkcja pływów `Wrak.tide()` dla innych.
- F: strona Zasuwy głównej na Map147 i krata na Map157 - podmiana listy zdarzenia w kodzie (bez zmian w plikach); woda przez własne menu
  czerpaka (wzór: `Farming.rationWell`).
- Wszyscy: zadania, rzeczy wirtualne, miejsca i uwagi mieszkańców dopisują we własnym `*_Data.js` do tablic TownQuests; własne kroki przez
  `TownQuests.FX`.

**Kontrakty między pakietami** (ustalone tutaj, żeby nikt nie czekał): współrzędne przejść z punktu 1; znaczniki „Miejsce: rynna_1..4” i
zdarzenie „Przelew cysterny” na Map157 (stawia B, obsługuje F); flagi `glejtWrak` (D → E), `ansgarAlly` / `ansgarGiven` / `ansgarFled`
(E → Akt III, D), `kronikaKarta1..6` (A czyta, B/C/E dają karty), `krukTame` (B → A, E: list), `mgla` (C → E: wizja 2).

### Pakiet 7 - integracja (koordynator, na końcu, po kolei)
1. Zdarzenia przejść na Map125 (dwa) i opcjonalnie Map013 (jedno), `tools/newstart/layout.py` (EDGES) i test przejść
   `run_transfer_test.py`.
2. Ikony do IconSet, sprawdzenie `Items.json` i `plugins.js`.
3. Linijki epilogu w `Underground_Data.js` (latarnia, kruk, garnizon), uwagi mieszkańców o garnizonie.
4. `docs/QUESTY.md`, `docs/QUESTY_STAN.md`, `docs/STORY.md` (rozdział „Wyspa” - co weszło).
5. Testy: tylko nowe i bezpośrednio dotknięte; pełny przebieg tylko po Twojej zgodzie.

### Proponowana kolejność
- **Fala 1 (równolegle):** D Garnizon, E Wrak, A Pustelnia. Południe wyspy i pustelnia mają najwięcej powiązań z tym, co już jest
  (rekwizycje, prom, W2, W5, W6).
- **Fala 2 (równolegle):** B Urwisko i kruk, C Latarnia, F Cysterna. Kruk jest najdroższy w grafice, a cysterna potrzebuje Urwiska (krata).
- Jeśli wolisz po jednym: Wrak → Garnizon → Pustelnia → Urwisko z krukiem → Latarnia → Cysterna.

---

## 11. Pytania do Ciebie (każde z moją propozycją)

1. **Drogi:** nowe miejsca tylko od przystani (północ: Pustelnia → Urwisko → Przylądek; południe: Garnizon → Wrak), dwa zdarzenia przejścia
   na Map125, kafelki bez zmian. *Propozycja: tak.* Do tego zejście z przylądka w Góry (jedno zdarzenie na Map013), żeby była pętla?
   *Propozycja: tak.*
2. **Garnizon:** czyje wojsko? *Propozycja: chorągiew królewska z lądu (feniks), zakwaterowana za zgodą Lorda, który płaci Koronie podatek
   wojenny.* Alternatywa: ludzie Lorda (wtedy garnizon to większy posterunek, bez osobnej strony).
3. **Wrak:** okręt Czarnych Oczu, rozbity w sztormie z prologu, z kartografem, który przeżył. *Propozycja: tak.* Czy kopacze z gór (W8,
   Akt III) to też Czarne Oczy? *Propozycja: zostawić otwarte.*
4. **Ród kruczarzy:** rodzina dziadka to dawni posłańcy zakonu z Urwiska, wisiorek to znak posłańca i klucz do szyfru, a zakon przetrwał
   w czterech strażach (dzwon, pieśń, klucz, pióro). *Propozycja: tak.*
5. **Pustelnik:** brat Kleofas, uczeń ostatniego kronikarza (nie żywy strażnik sprzed upadku). *Propozycja: tak.*
6. **Jedno pytanie rocznie:** przenieść W2 rozdz. 7 z dzwonnicy do pustelni (Ambroży oddaje serce dzwonu, Kleofas odpowiada w Noc
   Pytania). *Propozycja: tak.*
7. **Soczewka:** nie odłamek Serca, tylko szkło z kryształu Pierwszych, które we mgle odbija Serce. *Propozycja: tak* (Serce zostaje jedno).
8. **Kruk:** imię nadaje gracz (ekran z prologu)? Listy tylko po wyspie, nie do matki? Grzęda na polu jak buda psa? *Propozycja: tak, tak, tak.*
9. **Cysterna:** wejście z piętra 30 po W1 rozdz. 7, 1 nabranie dziennie, zapas skończony i wspólny z miastem i dworem, łańcuch sięga do
   trzeciego znaku, krata na Urwisku jako skrót. *Propozycja: tak* (albo krata tylko jako wyjście, jeśli chcesz ostrzej). Czy bohater może
   zamknąć gałąź dworską? *Propozycja: tak, z chłodem Lorda.*
10. **Pływy:** dwa odpływy na dobę, wspólne później z wysepką pływową. *Propozycja: tak.*
11. **Rozbitek w tawernie:** siedzi na wolnym stołku jako miejsce domyślne w danych (Map001 bez zmian), śpi w Pokojach gości. *Propozycja:
    tak.* Albo sam dopiszesz w edytorze „Miejsce: gosc_9”, kiedy skończysz tawernę.
12. **Pobór i bohater:** bohater nie jest wcielany (za młody, dwór ręczy za dług). Ojciec tylko jako „zaginiony” na liście rotmistrza?
    *Propozycja: tak, bez wcielania; ojca jako cichy haczyk - albo wcale, jeśli wolisz nie ruszać tego wątku.*
13. **Wizja o matce w latarni:** tylko to, co już mówi uchodźczyni w W10 (żyje, idzie z taborem na północ). *Propozycja: tak.*
14. **Zgaszona latarnia opóźnia prom** (dotyka kalendarza promu). *Propozycja: nie na początek.*
15. **Budowa:** numery map 155-167, pakiet 0 + dwie fale równoległe + integracja, PixelLab ok. 400-420 generacji. *Propozycja: tak.*
