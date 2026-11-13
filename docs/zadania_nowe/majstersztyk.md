# Majstersztyk - projekt długiego wątku z rangami (tylko projekt, 2026-11-11)

Roboczy znacznik: **W-Majster** (numer W17+ do nadania przy wdrożeniu). Dokument projektowy: żadnego kodu ani danych gry nie ruszano.

## 1. Pitch, długość, start, związek z fabułą

Dom cechowy (Cech, Map008 x87-93 y79-88) od dnia, w którym bohater pierwszy raz sam wykuje żelazną rzecz, przestaje „obradować za
zamkniętymi drzwiami”. Starszy cechu **Ostap Lemiesz** przyjmuje bohatera na **czeladnika** i od tej chwili bohater awansuje przez
cztery rangi, wykonując **prawdziwe przedmioty z istniejących receptur** (warsztat, kuźnia, garbarnia), od pałki i karwaszy po
stalową kolczugę. W połowie drogi z promu przypływa **Ludwik Zaręba**, czeladnik płatnerski z cechu z kontynentu, który chce
tego samego tytułu - a cech daje jeden tytuł majstra na rok. Ludwik jest lepszy w rękach i gorszy w charakterze: psuje cudze
sztuki. Wszystko kończy się **egzaminem przed cechem na rynku**, przy tłumie, w dzień targowy.

- **Długość:** 4 rangi, ok. 30-40 dni gry (od dnia 12-14 do ok. dnia 45-50). Zdarza się pomiędzy innymi zadaniami; nic nie jest na czas
  poza egzaminem (dzień targowy co 7 dni) i dostawami dla klientów (terminy kilkudniowe).
- **Start:** dzień >= 12, Opinia >= 20 (Bywalec), bohater **ma na koncie wykuty żelazny przedmiot** (dowolny z kuźni) i 20 G wpisowego.
  Poręka: jeden z trzech mistrzów - **Tadek Młot** (kuźnia; najlepiej po D3 „Ręka kowala”), **Ignac** (garbarz; po K20 lub K21) albo
  **Leon** (cieśla; po rozmowie przy warsztacie 33,89). Każdy poręczyciel to inny „fach” (kowal, garbarz, cieśla-łuczarz), co wpływa na
  rangę III i IV.
- **Z fabułą:** wątek poboczny Aktu I-II, osadzony w rzemiośle miasta (dzieje się w tych samych budynkach, co D1, D3, K20-K22).
  Nie dotyka Serca ani ostatecznych zakończeń. Echo w Akcie III: majster bije w dzwon cechu (alarm; jeden dodatkowy obrońca
  - rzemieślnicy z cechu, ale tylko jeśli bohater jest Majstrem i Opinia >= 60). Dopisać do `docs/AKT3.md`.

### Realne przedmioty na każdą rangę (sprawdzone w kodzie)

Wszystkie przedmioty są w `Bron_Data.js` (PRZEPISY: kuźnia, garbarnia, warsztat) albo w Warsztacie (Farming_Data, receptury ręczne):

| Ranga | Sztuka | Stacja | Surowce (z przepisów) |
|---|---|---|---|
| I Czeladnik | Okuta pałka (313) + Skórzane karwasze (360) + Żelazny sztylet (301) | warsztat + garbarnia + kuźnia | pałka + 4 gwoździe; skóra + ścięgno; żelazo + węgiel + drewno |
| II Starszy czeladnik | Komplet dla straży Wita: Żelazny miecz (305), Czepiec kolczy (345), Okuta tarcza (375); opcjonalnie 2x Wiadro (138) dla przytułku | kuźnia, garbarnia | miecz: 3 żelazo, 2 węgiel, skóra; czepiec: 3 żelazo, 2 węgiel, skóra; tarcza: tarcza drewniana + 2 żelazo + 4 gwoździe |
| III Podmistrz (wybór fachu) | **Kowal:** Kolczuga (353) + Żelazna tarcza (379). **Garbarz:** Skórznia (350) + Wysokie buty (371) + Futrzany kaptur (341). **Cieśla-łuczarz:** Łuk + 12 Strzał z lotkami + Oszczep (receptury Warsztatu) | kuźnia / garbarnia / warsztat | kolczuga: 6 żelazo, 4 węgiel, skóra (4 h); skórznia: 4 skóry, 2 ścięgna, lina; kaptur: skóra niedźwiedzia + ścięgno; łuk: 2 drewno, lina, 2 ścięgna, skóra |
| IV Majster (sztuka egzaminacyjna) | **Kowal:** Stalowa kolczuga (357). **Garbarz:** Ćwiekowana skórznia (351) + Futrzany kaptur + Wysokie buty, całość. **Cieśla-łuczarz:** Łuk + Tarcza + 12 Strzał z lotkami + Dębowy kostur (312) razem | kuźnia (stal) / garbarnia / warsztat | kolczuga stalowa: 6 stal, 4 węgiel, skóra (4 h); skórznia ćwiekowana: 4 skóry, 2 ścięgna, 8 gwoździ |

Uwagi: ścieżka cieśli jest tańsza materiałowo niż kowalska - wyrównujemy **ilością** i wymogiem upolowania (ścięgna, pióra, skóra) oraz
dodatkową sztuką w komplecie. Stal (357) to dostępny materiał z huty (tabela skupu: stal 40 -> 20 G); do potwierdzenia w kodzie
przy wdrożeniu, czy gracz ma regularne źródło stali przed dniem 40.

**Jakość sztuki:** gra nie ma stopni jakości przedmiotów, więc cech sprawdza **całość i stan**: przedmiot musi być **nieużywany**
(pełna wytrzymałość - Durability.js), z właściwych materiałów, a kompletność decyduje o randze. Dodatkowo egzamin ma **„ostatnie
szlify”** (patrz scena S7): krótka próba klawiszami, która ocenia **ocenę** (Zaliczony / Dobry / Mistrzowski), nigdy nie blokuje wyniku.

## 2. Rozdziały (rangi)

Klawiatura: **O** akcja/OK, strzałki wybór. Wszystko w dymkach lub okienku rozmowy `Tawerna.talk`.

### Rozdz. 0 „Poręka” (dzień 12+)

- **Gdzie/kto:** kuźnia Tadka (8,63), garbarnia Ignaca (15,85), warsztat Leona (33,89), Cech (drzwi 91,87), Ostap.
- **Co robi gracz:** pierwszy żelazny wyrób; rozmowa u wybranego mistrza (Tadek: „Zanieś mój znak do Ostapa. Ale miej coś w ręku.”);
  w Cechu o 8:00-17:00 drzwi stoją otwarte (zmiana popup z „obradują” na rozmowę z Ostapem); wpisowe 20 G; Ostap daje **Znak
  czeladnika** i zlecenie „Trzy ręce”.
- **Porażka/alternatywa:** brak Opinii 20 - Ostap: „Cech nie wpuszcza kogoś, kogo nikt nie zna. Pomagaj ludziom, wróć.” (dziennik
  wskazuje K-zadania). Bez poręki - nie wejdzie; trzy możliwe poręczyciele, więc zawsze droga.
- **Dziennik:** „Cech przyjmie mnie na czeladnika, jeśli pokażę trzy sztuki: pałkę, karwasze i sztylet.”

### Rozdz. 1 „Trzy ręce” (dzień 12-16) - ranga **Czeladnik**

- **Co robi gracz:** wykonuje trzy sztuki (pałka z gwoździami, karwasze, sztylet) i **składa je na półce próbnej** w Cechu (O przy półce;
  zostają na półce do rana - cech ogląda je „w świetle dnia”). Rano Ostap sprawdza (wynik `Zaliczone`), **zaprzysiężenie** (scena S1),
  **Znak czeladnika**, od teraz bohater może używać **Pracowni cechowej** (3 stacje: kuźnia, warsztat, garbarnia - tylko do zleceń cechu)
  i bierze zlecenia z **tablicy cechu**.
- **Awansuje:** wszystkie trzy sztuki przyjęte (nieużywane, pełna wytrzymałość).
- **Porażka/alternatywa:** sztuka uszkodzona/zużyta -> Ostap zwraca „Użyta rzecz to nie sztuka”, trzeba zrobić nową (surowce
  przepadają, ale wystarczą tanie). Czas: ok. 4-5 godzin pracy w grze (kuźnia 1 h, garbarnia 1 h, warsztat 1 h + zbiór surowców).
- **Dziennik:** „Jestem czeladnikiem cechu. Mam dostęp do pracowni i do tablicy zleceń.”

### Rozdz. 2 „Zamówienia” (dzień 16-26) - ranga **Starszy czeladnik**, przyjazd Ludwika

- **Gdzie/kto:** tablica cechu, kuźnia/garbarnia, Przystań (przyjazd rywala, prom dnia 19), Wit, Kapral, sołtys.
- **Co robi gracz:**
  1. Z tablicy cechu bierze **zamówienie straży** (Wit: „komplet dla czterech żołnierzy: miecz, czepiec, tarcza” - czterokrotnie po
     jednym egzemplarzu - lub 1 komplet na początku, 3 w dni targowe; liczba do ustalenia w danych) z **terminem 6 dni**. Wit płaci
     z kasy garnizonu po odbiorze (120 G za komplet; przychylność garnizonu +3).
  2. **Dzień 19: prom** przywozi Ludwika Zarębę (scena S2). Ludwik dostaje wpis w cechu jako „gość”, od razu bierze dwa zamówienia
     z tej samej tablicy (cenowo podbija bohatera o 10 G - „cech jest szeroki”).
  3. **Spór o zamówienie (S3):** Wit w obecności Ostapa pyta, kto dostarczy szybciej; bohater i Ludwik oddają sztuki w ciągu dnia;
     przy równych sztukach wygrywa lepsza rozmowa/wybór bohatera (dymki: „zrobię taniej” / „zrobię lepiej” / „zrobię razem z
     Ludwikiem” - cząstkowy podział zamówienia). Wygrana = zamówienie i +30 G; przegrana = tylko połowa i uwaga Ostapa.
  4. Opcjonalnie: **2x Wiadro (138)** dla przytułku (przekazane Stefie; jeśli jest wątek W-Gorączka - wiadro idzie do przytułku i
     jest ciepłe wspomnienie; bez niego tylko Opinia +1).
- **Awansuje:** `Starszy czeladnik` po dostarczeniu kompletu (nawet w połowie) i rozmowie z Ostapem.
- **Porażka/alternatywa:** za późno -> Wit odmawia, zamówienie przechodzi do Ludwika (przegrywasz rangę na tydzień, nie na zawsze;
  Ostap daje zlecenie dodatkowe, mniejsze).
- **Dziennik:** „Wit chce kompletu dla straży. Na prom przypłynął Ludwik z cechu płatnerzy. Konkurencja.”

### Rozdz. 3 „Sztuka próbna” (dzień 26-38) - ranga **Podmistrz**, sabotaż

- **Gdzie/kto:** Pracownia cechowa, Cech, półka próbna, nocna pracownia.
- **Co robi gracz:**
  1. Wybór **fachu** (strzałki): kowal (Tadek), garbarz (Ignac), cieśla-łuczarz (Leon). Mistrz fachu uczy techniki w dymkach i
     daje **wskazówkę**: „Na kolczudze liczą się rzędy: nie spiesz się”, „Na skórze liczy się równa sprzączka” itp. (tylko tekst, ma
     wpływ na ocenę szlifów).
  2. Wykonanie **sztuki próbnej** (patrz tabela rangi III) - w Pracowni cechowej lub u siebie; ostateczne złożenie na półce próbnej na noc.
  3. **Sabotaż 1 (noc 1):** rano sztuka na półce ma **pęknięcie** (wygląda jak niedogrzana lub zalana zimną wodą - efekt „pęknięty”,
     nie można jej złożyć). Ostap: „Takie rzeczy zdarzają się, gdy wszyscy patrzą, a nikt nie widzi.” Bohater robi ją od nowa
     (surowce przepadają - ale pierwszy raz Ostap zwraca 1 stal/żelazo z sympatii; do ustalenia przy wyważaniu).
  4. **Dochodzenie:** trzy ślady do wyboru (dwa z trzech wystarczą): (a) mokry węgiel w skrzyni bohatera w Pracowni (Tadek:
     „węgiel mokry? Ktoś go polał”), (b) znak Ludwika odciśnięty w popiele pod półką (rysunek młotka z literą Z), (c) świadek:
     uczeń cechu **Jaś** (nowy mały NPC, zamiatacz Pracowni) widział kogoś przy półce.
  5. **Noc w Pracowni (S5):** bohater zostaje w Cechu po zamknięciu (wybór „Zostań w cieniu” przy drzwiach). 22:00-24:00 Ludwik wchodzi z
     lampą, idzie do półki. Wybór: **Wyjdź i zatrzymaj go** (dymki: „Cech to nie miejsce dla wilków”), **Poczekaj i weź dowód**
     (Ludwik zostawia fiolkę; fiolka = dowód), **Zawołaj Ostapa** (dzwonek przy drzwiach cechu; Ostap przychodzi w koszuli
     nocnej - scena humorystyczna).
  6. **Złożenie** poprawionej sztuki rano: ranga **Podmistrz** (znak i „Fartuch podmistrza”).
- **Awansuje:** sztuka próbna przyjęta; dowody zebrane są potrzebne do rozdz. 4.
- **Porażka/alternatywa:** bohater nie zbiera dowodów - Ludwik przechodzi bez kary, ale sabotaż dalej odbywa się raz, a w rozdz. 4
  szlify są trudniejsze (dodatkowy „wiatr”: jeden rytm więcej). Spóźnienie z drugą sztuką: tydzień dłużej.
- **Dziennik:** „Sztuka próbna - ktoś ją uszkodził na półce. Szukam, kto.”

### Rozdz. 4 „Egzamin” (pierwszy dzień targowy po złożeniu sztuki próbnej + 3 dni, ok. dzień 42-49) - ranga **Majster**

- **Gdzie/kto:** Pracownia (przygotowanie), **rynek** (Map008, rynek_srodek 53,51, trybuna 55-60 x 39-44 do ustalenia przy
  „plac_tablica” 57,39), tłum, trzej egzaminatorzy: Tadek, Ignac, Leon; Ostap przewodniczy; sołtys; Ludwik.
- **Co robi gracz:**
  1. **Dzień przed:** wykonanie **sztuki egzaminacyjnej** (patrz tabela rangi IV, 4 h pracy kolczugi); ostatni raz sprawdza ją
     Ostap; noc przed egzaminem sztuka leży na półce próbnej (Ludwik może znów spróbować - jeśli bohater ma jego fiolkę albo
     świadka, **półkę pilnuje Jaś**, a sztuka pozostaje cała).
  2. **Dzień egzaminu (S6/S7):** przed 12:00 rynek zapełnia się; bohater i Ludwik wnoszą sztuki na trybunę. Komisja ogląda: próba
     młotem (trzy uderzenia), próba cięciem (kołek) lub próba obciążeniem, w zależności od fachu (animacje poniżej).
  3. **„Ostatnie szlify”** - krótka próba klawiszami (mini-gra, tylko strzałki + O): na ekranie pojawia się 3 do 4 symboli
     strzałek; naciśnij te same strzałki w rytm jednego uderzenia młota; trzy rundy. Wynik: **Mistrzowski** (0 błędów),
     **Dobry** (1-3), **Zaliczony** (więcej). Nie ma „oblanego” - tylko ocena. Czas bez limitu klawiszowego (rytm opcjonalny - wersja
     bez rytmu: tylko właściwa kolejność, dla gracza z pomocą dostępności).
  4. **Wynik komisji:** porównanie z Ludwikiem. Wynik zależy od: kompletności sztuki, oceny szlifów, dowodów (rozdz. 3), Opinii
     (głos tłumu: Opinia / 2).
  5. **Zakończenia** (patrz 6): bohater zostaje Majstrem, Ludwik wygrywa, obaj, albo Ludwik zdemaskowany.
- **Porażka/alternatywa:** sztuka niekompletna -> Ostap przesuwa egzamin o tydzień (następny dzień targowy), surowce zostają; kolejne
  podejście. Dwukrotna porażka -> „zaliczony” (dobra wersja: Zaliczony jest zawsze wystarczający na tytuł, o ile Ludwik nie wygrał).
- **Dziennik:** „Egzamin w dzień targowy na rynku. Mam sztukę, mam rywala, mam tłum.”

## 3. Sceny (storyboardy)

**S1 „Zaprzysiężenie” (po rozdz. 1, Cech - izba cechowa, ok. 35 s).** Pasy sceny, muzyka cicha. Ostap stoi przy stole z
chorągwią cechu; trzej mistrzowie (Tadek, Ignac, Leon) po bokach (stoją, zatrzymani `hold`). Bohater podchodzi (ruch do stołu).
Ostap kładzie jego sztukę na stole i uderza młotkiem trzy razy (dźwięk Hammer x3), przybija pieczęć. Dymki: Ostap „W imię
rzemiosła, i żeby ręce pamiętały.” Bohater dostaje fartuch czeladnika (Ubior: brązowy fartuch). Kamera zostaje na stole.

**S2 „Przyjazd Ludwika” (dzień 19, ok. 12:00, ok. 30 s).** Prom przybija (Przystań). Ludwik z dużym kufrem na ramieniu idzie
przez Podgrodzie do miasta (ruch zdarzenia po trasie), minąwszy bohatera przystaje: „Czy tu jest cech, czy stodoła?” Wchodzi do
Cechu, drzwi otwarte (animacja drzwi). W Cechu Ostap czyta jego list z kontynentu (dymek). Dźwięk: kroki, skrzypnięcie kufra.
Powrót do bohatera po 25 s.

**S3 „Spór o zamówienie” (rozdz. 2, 11:00-12:00, ok. 50 s).** Plac przed Cechem, Wit z listą, Ostap, Ludwik i bohater obok
siebie. Humor: Ludwik wygłasza gładką mowę, Wit przerywa „ile?”, Ostap kaszle. Wybór bohatera (3 dymki), efekty w tekście i
w zamówieniu. Kamera 2-ujęciowa (na Wita, na bohatera).

**S4 „Pęknięta sztuka” (rozdz. 3, rano, ok. 25 s).** Pracownia w świetle słońca, Jaś zamiata. Półka próbna: sztuka z
rysą (nakładka „pęknięcie” 1 kafel + iskra dźwiękowa „trzask”). Ostap i Tadek stoją, Tadek gwiżdże. Pasy sceny, 3 dymki.

**S5 „Noc w pracowni” (rozdz. 3, 22:00-24:00, ok. 90 s, przerywalna).** Pracownia po zamknięciu; jedyne światło: żar kuźni
(„każde światło to ogień”), lampa Ludwika (nowe światło kołyszące się). Bohater w cieniu przy drzwiach (kratka z „ciemnym” obszarem,
ten sam efekt co skradanie). Ludwik wchodzi, idzie do półki, wyjmuje fiolkę, kroplami zalewa sztukę (animacja 3 klatki, para
syczy), dymek „Cech nie potrzebuje dwóch majstrów”. Wybór bohatera. Wersja z Ostapem w koszuli nocnej: Ostap wpada z kijem w
ręku; humor.

**S6 „Rynek na egzamin” (rozdz. 4, 11:00-12:00, ok. 40 s).** Pasy sceny, kamera nad rynkiem. Straganiarze przesuwają kramy
(zdarzenia stoją), tłum się zbiera (jeden obraz „tłum” wyświetlany, plus 6-8 mieszkańców TownLife w trybie `stand`, a z nich
Hanka z korzenną drożdżówką i Kuba z beczką). Ambroży bije raz w dzwonnicę (dźwięk). Trybuna cechu, trzej mistrzowie, sołtys.
Muzyka: marsz z fletem (jeśli istnieje; inaczej cisza i szmer tłumu).

**S7 „Próba” (rozdz. 4, 12:00-13:00, ok. 2 min z grą).** Trybuna, kowadło, słup do prób, kołek. Komisja bada sztukę
(animacja: Tadek uderza młotem 3x - efekt iskier; Ignac zgina skórę; Leon kręci łukiem). Potem szlify (mini-gra). Wynik ogłasza
Ostap, tłum ryczy, Melia gra z trybuny (jeśli W3 zaufana) lub z tawerny wieczorem. Ludwik zdejmuje czapkę w ukłonie albo zostaje
zdemaskowany (dowody: fiolka, świadek Jaś) i schodzi z trybuny pod okrzyki.

**S8 „Kufel majstra” (wieczór, tawerna, ok. 30 s).** Borgar stawia kufel „na cześć majstra” (nowy dymek na zmianie), kilku
bywalców (Ozzy, Grum, Melia) wstaje, zwykły toast w sali. Bez mini-gry.

## 4. Nowe postacie, przedmioty, rekwizyty, wnętrza

### Postacie (styl bohatera: biedny wieśniak - rzemieślnicy w rozmytych, praktycznych strojach; Ludwik jedyny „czysty”)

| Kto | Rola | Wygląd | Plan dnia |
|---|---|---|---|
| **Ostap Lemiesz** | Starszy cechu, emerytowany płatnerz, sztywna ręka | ok. 65 lat, siwa broda, ciemnoniebieska kamizela cechu, skórzany fartuch, laska | 8-17 Cech (izba), 12-13 rynek (obiad u Hanki), 17-19 tawerna, dom |
| **Ludwik Zaręba** | rywal, czeladnik płatnerski z cechu Czarnego Brodu | ok. 28, czyste ciemnogranatowe ubranie cechowe, srebrny łańcuszek, rękawice za pasem, wąsik, buty (jedyny obuty z całej piątki) | od dnia 19: 6-18 Pracownia/Cech, 18-21 tawerna (siedzi sam), noc: pokój nr 9 w „Izbie do wynajęcia” (Dom 9 w Map190) |
| **Jaś** | uczeń cechu, zamiatacz Pracowni | ok. 11 lat, za duży fartuch | 7-19 Cech/Pracownia |

Istniejący: Tadek (`kowal`), Ignac (`garbarz`), Leon (`ciesla`), Dorota (`szwaczka`, fartuchy z lnu), Wit (`kapral`) jako klient, sołtys
Bronisław, Hanka, Kuba, Ambroży, Borgar, Melia/Ozzy/Grum, Lord (jeśli przychylność W7 - przysyła kamerdynera z gratulacjami: 1 kwestia).

### Przedmioty (wszystkie nie do sprzedaży, poza nagrodą)
- **Znak czeladnika / starszego czeladnika / podmistrza / majstra** (rangowe odznaki, widoczne w ekranie Postać jako wiersz „Cech:”).
- **Przepustka do pracowni cechowej** (zwykła zdarzeniowa, bez przedmiotu: sprawdza `rank >= 1`).
- **Fiolka z kwasem** (dowód z S5), **Odcisk młotka Ludwika** (dowód z popiołu).
- **Młotek majstra** (nagroda: narzędzie kuźni, -15% czasu pracy w kuźni gracza i w Pracowni; przeciwnik zużycia: dłuższa wytrzymałość).
  Nowy przedmiot, ID do nadania.
- **Fartuchy rang** (Ubior - nakładki: brązowy czeladnika, brązowy z granatowym pasem starszego czeladnika, granatowa kamizela
  podmistrza, granatowa kamizela z łańcuszkiem majstra; Ubior ma już nakładki, jak Płaszcz/Hero Look).

### Rekwizyty map
- **Tablica cechu** (Cech wnętrze; pokazuje rangi bohatera i Ludwika, aktualne zamówienia - 3 naraz).
- **Półka próbna** (Cech, rejestr 1 miejsca na sztukę w nocy).
- **Trybuna egzaminacyjna** (rynek, rekwizyty-zdarzenia tylko w dniu egzaminu: stół, kowadło na kozłach, słup próbny, chorągiew cechu).
- **Obraz „Tłum”** (jedno zdarzenie obrazkowe na rynku, w dniu egzaminu).
- **Nakładka „pęknięcie”** (1 kafel, w Pracowni).
- Rekwizyty to nie przedmioty do podniesienia (zasada „dekoracja nie wygląda na łup”).

### Wnętrza
- **Cech (nowa mapa, ok. 28x18):** izba cechowa (długi stół, chorągiew, ściana trofeów z historycznych sztuk - tarcze i hełmy na ścianie jako
  dekoracja, wyraźnie wmurowane), **Pracownia** z trzema stacjami (kuźnia z żarem, warsztat, kadź garbarska), półka próbna, komora
  Ostapa, drzwi na rynek (91,87). Tylko do Cechu - Wiatrak, Łaźnia i Sukiennice zostają zamknięte (inne wątki).
- Rynek (Map008) bez zmian; trybuna w dzień egzaminu z rekwizytów.

## 5. Animacje i grafika

| Co | Czym | Status |
|---|---|---|
| Ludwik Zaręba (arkusz `$Npc_Ludwik`, 4-8 kierunków, krok) | PixelLab (próbka w `majstersztyk_probki`), skalowanie do formatu postaci gry | próbka zrobiona |
| Ostap, Jaś (arkusze) | PixelLab w stylu bohatera | do zrobienia |
| Popiersia (Ostap, Ludwik) | RTP-podobne | do zrobienia |
| Fartuchy rang (4) | Ubior (nakładki skryptem) | skrypt |
| Animacja próby młotem (Tadek: 3 uderzenia) | istniejący arkusz kowala (młot) - sprawdzić; inaczej 3 klatki skryptem | do zweryfikowania |
| Pęknięcie sztuki, para, iskry | skrypt (nakładki 3 klatki) + istniejące iskry Klimat | skrypt |
| Chorągiew cechu, trybuna, kowadło na kozłach, słup próbny | PixelLab (obiekty) lub kafle Winlu | do zrobienia |
| Obraz „Tłum” (jedno zdarzenie) | skrypt składa 10 arkuszy NPC (istniejące) w jeden obrazek 6 x 3 postacie | skrypt |
| Wnętrze Cechu | skrypt budowy wnętrz (`tools/wnetrza`) + kafle Winlu Interior | skrypt |
| Ikony Znaków rang (4) | PixelLab (ikony 32x32) lub skrypt | do zrobienia |

## 6. Nagrody i konsekwencje

Ekonomia (dług 2500 G do dnia 60; `docs/AUDYT_PRZEJSCIA.md` sekcja 3): wątek jest **po stronie czasu i materiałów**, nie darmowego
złota. Netto ok. **+360 G** przez 35 dni (po odliczeniu wpisowego i surowców wartych ok. 80-120 G), czyli dokładnie rząd wątku W5.

| Moment | G / inne |
|---|---|
| Wpisowe | -20 G |
| Ranga I | 30 G od cechu |
| Ranga II | 120 G od Wita (kompletu) lub 60 G (połowa), przychylność garnizonu +3 |
| Ranga III | 100 G (cech kupuje sztukę próbną po 60% wartości) |
| Ranga IV | 150 G od cechu + premia 20% wartości sztuki z komisji; **Młotek majstra**; Opinia +8 |
| Tablica cechu | po randze II co tydzień 2 zlecenia po 40-90 G (maks. 2 tygodniowo - nie zrywa ekonomii) |

**Zakończenia egzaminu:**
1. **Majster uczciwy** - bohater wygrywa lepszym wykonaniem (Mistrzowski/Dobry) bez demaskowania Ludwika: Ludwik kłania się, zostaje czeladnikiem,
   za rok może spróbować. Opinia +8, Tadek/Ignac/Leon +zaufanie (rabat 15% w kuźni, 5% u Ignaca, dłuższe rozmowy), **tytuł Majster w
   ekranie Postać**.
2. **Majster przez demaskowanie** - dowody pokazane komisji przed wynikiem: Ludwik zdyskwalifikowany, odpływa następnym promem (jego
   zamówienie pada), bohater zostaje Majstrem. Opinia +5 u mieszczan, -2 u Ludwikowych sprzymierzeńców (brak - to tylko tekst).
3. **Dwóch majstrów** (opcja przy Ostapie i Opinii >= 60 oraz ocenie >= Dobry, oraz jeśli Ludwik nie jest zdemaskowany w
   sposób poniżający, a bohater go nie zatłukł dowodem): cech przyjmuje dwóch - Ludwik zostaje w mieście i otwiera pracownię
   w Cechu; dodatkowy płatnerz dla miasta: sklep z kolczugami (SKLEPY.cech), ale rywal wciąż zazdrosny.
4. **Ludwik wygrywa** - bohater odpada (zła ocena i niewykonanie sztuki, brak dowodów): Ludwik zostaje Majstrem i otwiera warsztat
   płatnerski w Cechu, bohater pozostaje „podmistrzem”, może podejść ponownie po 14 dniach (egzamin „poprawkowy” z nowym wnioskiem
   Ostapa). Opinia -2, brak Młotka.

Wpływ na inne wątki: D3 „Ręka kowala” (Tadek - jeśli bohater ma od niego przepis na okutą tarczę, jest to dodatkowa, opcjonalna sztuka
w rangach I-II); D1 (Ignac i buty), K20-K22 (Ignac, struna Melii), D18 (płaszcze), W-Gorączka (wiadra dla przytułku, wiadro 138),
QuestBoard (osobna tablica cechu, ale zlecenia też podbijają Sławę w tawernie o +1), W7 (Lord jako gość - jedna kwestia).

## 7. Implementacja

- **Wtyczki/dane:** `Majster.js` + `Majster_Data.js` (**wątek na silniku Watki.js**, zadania z własnymi etapami jak w 2.3a
  `WATKI_DANE.md`), teksty `js/teksty/majster.txt`. Dane: tabela rang (powyższa tabela jako `RANGI[i].sztuki = [[idPrzedmiotu, ilość]]`), egzaminatorzy,
  tabela ocen. Sprawdzanie przedmiotów przez `Tawerna.items`/Durability (nieużywany = wytrzymałość pełna).
- **Ubior:** nakładki fartuchów rang i kamizeli (`Ubior_Data` - wpis `cech_ranga`), tytuł w ekranie Postać (dopisać wiersz).
- **TownLife:** wpisy `ostap`, `ludwik`, `jas` (plan dnia z góry); `hold` dla Tadka/Ignaca/Leona/Wita w S1-S7; tłum S6 = istniejące
  postacie w trybie `stand`.
- **Mapy:** nowa mapa wnętrza Cechu (skrypt `tools/wnetrza`), markery w Map008: `cech_polka`, `tablica_cechu`, `trybuna_1..4`, `proba_slup`.
  Drzwi Cechu (194): kontrolowane rangą (popup „obradują” dopóki rozdz. 0 nie zaliczony).
- **F9 („Wyspa i fabuła”, sekcja „Cech”):** `Majster: ranga 0-4`, `Majster: przyjazd Ludwika`, `Majster: sabotaż`, `Majster: egzamin
  Mistrzowski/Dobry/Zaliczony`, `Majster: zakończenie 1-4`, `Majster: wyzeruj`.
- **Testy:** `tests/majster_test.js` (rozdz. 0-4, wszystkie cztery zakończenia, poręka od trzech mistrzów, trzy fachy - ścieżka
  kowalska z kolczugą stalową, garbarska i łuczarska, sabotaż z trzema śladami i bez, demaskowanie, brak nieużywanych kopii przy
  egzaminie (Durability), kolizje z D3/D1/K20-K22, wątek W-Gorączka z wiadrami). Autopilot z wypełnionym ekwipunkiem (`tests/ap.js`).
- **Wydajność:** zero skanów na klatkę; tłum = 1 zdarzenie obrazkowe + 6-8 istniejących postaci; trybuna to 4-6 zdarzeń w dniu egzaminu;
  mini-gra szlifów to proste okienko (reaguje na klawisze, bez pętli per klatkę poza sceną).
- **Rozmiar:** **L** (wnętrze, 3 postacie, 8 scen, mini-gra, system rang, 4 zakończenia).
- **Ryzyka:** (1) źródło stali: potwierdzić, że gracz może mieć 6 stali przed dniem ~45 - inaczej alternatywa dla fachu kowala:
  Kolczuga (353) żelazna; (2) ścieżka cieśli niższa materiałowo - może wymagać dopracowania wymogów; (3) cykl dnia i godziny pracy
  kuźni 4 h (kolczuga) - nie zablokuje dnia, ale trzeba uważać na zmianę u Borgara (wątek nie ma sztywnego terminu, więc OK);
  (4) pokazywanie rang w UI (Postać) - wiersz dopisać; (5) rywal nie może „kraść” rzeczy z ekwipunku (zasada zaufania gracza) -
  sabotaż działa tylko na półce próbnej, gdzie gracz sam zostawia sztukę; można jej też nie zostawiać, jeśli w danych jest
  tryb „złóż osobiście” (wtedy rywal nie ma okazji i dowody brakują - wynik 1 zamiast 2).

## 8. Pytania do gracza
1. Czy trzy fachy (kowal, garbarz, cieśla-łuczarz) czy tylko dwa (kowal i garbarz) - cieśla ma najsłabszą listę receptur?
2. Czy rywal może zostać w mieście (zakończenie 3, „dwóch majstrów”)? Czy ma zniknąć zawsze?
3. Czy mini-gra szlifów (strzałki + O, tylko ocena) jest potrzebna, czy egzamin ma być czystą rozmową i sprawdzeniem sztuk?
4. Czy nagroda ma obejmować nowy przedmiot „Młotek majstra”, czy tylko tytuł i rabaty?
