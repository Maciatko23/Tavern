# Przystań: koncepcja do zatwierdzenia

Wersja z 2026-10-14. To jest tylko koncepcja: w grze nic się nie zmieniło. Żaden plik w `data/` ani `js/` nie był ruszany.

Obrazy w tym folderze:

| plik | co pokazuje |
|---|---|
| `polozenie.png` | jak się dochodzi na przystań i gdzie na Podgrodziu stanie przejście |
| `rzut_przystani.png` | cała mapa przystani z numerami miejsc i legendą |
| `nabrzeze_zblizenie.png` | zbliżenie nabrzeża (te same numery) |
| `postacie.png` | przemytnik z planszy prologu, opis Janka, straż Lorda |
| `kafelki_morze_pomost.png` | próba wody i pomostu z tilesetu miasteczka (11) |

Szkic mapy jest zbudowany z prawdziwych kafelków tilesetu 11, tymi samymi narzędziami co Podgrodzie (`tools/podgrodzie/plib.py`,
`tools/town/mzrender.py`). Łodzie, prom i wrak to na razie tylko kontury z przerywanej linii, bo takich grafik jeszcze nie ma.
Suszarnie sieci udają na razie stojaki na skóry, a szlaban to dwa kawałki płotu.

---

## 1. Gdzie leży przystań i jak się do niej dochodzi

**Propozycja: na zachodnim brzegu, za Podgrodziem.** Tak samo jest w Atlasie Kruczej Wyspy: przystań leży na zachodzie, od strony
lądu, a droga do niej biegnie z miasteczka przez garnizon.

Droga w grze: miasteczko (Map008) → brama zachodnia przy kuźni → Podgrodzie (Map111) → ścieżka w las na zachodniej krawędzi →
**Przystań (nowa mapa 125)**.

- Na Podgrodziu ścieżka już dziś kończy się na zachodniej krawędzi, na polu **(0,19)**. Tam stoi miejsce `skraj_lasu`, w którym
  kłusownik Rysiek znika w lesie. Sprawdziłem przechodniość: na całej zachodniej krawędzi tylko to jedno pole jest przechodnie,
  reszta to las.
- **Na Map111 dochodzi tylko jedno zdarzenie przejścia** na polu (0,19), z dotknięciem przez gracza. Kafelki zostają bez zmian.
  Kłusownik dalej będzie znikał w tym samym miejscu, bo zdarzenie przejścia reaguje tylko na bohatera.
- Na przystani bohater pojawia się na wschodniej krawędzi, na (54,19), twarzą w lewo.
- Żadnej innej istniejącej mapy nie trzeba dotykać. Tawerna (Map001) zostaje bez zmian: Janek wieczorem siada na wolnym miejscu
  gościa `gosc_8`, które już jest w tawernie.

**Opcja na później (wymaga zmiany kafelków, więc tylko za Twoją zgodą):** druga droga z Polnej drogi (Map022) na zachód. Tamtędy
jedzie wóz przemytników w W5 („Noc promu”). Dziś zachodnia krawędź Polnej drogi to sam las, więc trzeba by tam namalować ścieżkę.

## 2. Układ mapy

**Map125 „Przystań”**, 56 × 40 pól, **tileset 11** (ten sam co miasteczko i Podgrodzie, tileset autora Winlu z pełnymi
flagami przechodniości). Notatka mapy: `<Clouds:on>` (pogoda), `<Farm:off>` (bez budowania), nowa `<Water:salt>` (morze, patrz
punkt 4). Muzyka `Town2` albo cisza, w tle szum morza (`Sea`).

Tileset 11 ma wszystko, czego trzeba na wodę (`kafelki_morze_pomost.png`):
- **A1 rodzaj 6**: głęboka woda z twardą, ciemną krawędzią. Wygląda jak kamienne nabrzeże, więc tym jest basen portu.
- **A1 rodzaj 10**: woda z piaszczystym brzegiem. Tym jest zatoka z plażą.
- **A1 rodzaj 2** (deski) na warstwie 1 nad wodą: pomost. Tak samo robi autor tilesetu mostki na swoich mapach.
- **A1 rodzaj 1**: ciemniejsze plamy głębi daleko od brzegu.
- Dwa rodzaje wody nie mogą się stykać, bo między nimi wyszłaby linia brzegu na środku wody. Dlatego basen portu i zatokę dzieli
  **skalisty cypel** aż do krawędzi mapy. Na cyplu siedzą kruki.

Co jest na mapie (numery jak na `rzut_przystani.png`):

| nr | miejsce | opis |
|---|---|---|
| 1 | Ścieżka z Podgrodzia | wejście ze wschodu, droga przez sosnowy las |
| 2 | Szlaban i posterunek | strażnik Lorda zagląda w tobołki; koksownik |
| 3 | **Komora celna** | celnik straży Lorda, dwie czerwone chorągwie z czarnym koniem (barwy Lorda), stojak z bronią |
| 4 | Skład portowy | worki zboża z rekwizycji (D14), skrzynie z promu; zamknięty, klucz ma celnik |
| 5 | Nabrzeże | bruk, skrzynie, beczki, latarnie na słupach |
| 6 | **Molo promowe** | długi pomost z kwadratową głowicą; na końcu kosz ogniowy jak latarnia dla łodzi |
| 7 | **Prom** | przybija w dni promu (patrz punkt 5); w inne dni przystań przy molo jest pusta |
| 8 | Pomost rybacki | łodzie Janka: jedna przy pomoście, druga obok; rano jednej brakuje, bo Janek jest na morzu |
| 9 | **Chata Janka** | chata z bali kryta strzechą, z wnętrzem; beczka na deszczówkę (pusta, sama dekoracja) |
| 10 | Wędzarnia | mała szopa z kominem i dymem |
| 11 | Sieci i stół rybny | suszarnie sieci, stół do patroszenia, kosze, ławka |
| 12 | **Szopa przy pochylni** | kryjówka przemytnika, z wnętrzem; ognisko w beczce, liny, skrzynie |
| 13 | Pochylnia | stara drewniana pochylnia do wody; tu stanie naprawiony kuter (zadanie) |
| 14 | Skalisty cypel | czarne kamienie i kruki, oddziela port od zatoki |
| 15 | **Plaża i wrak kutra** | kamienista plaża z prologu; wrak kutra przemytnika z połamanym masztem i podartym żaglem |
| 16 | Las | sosny i liściaste drzewa po wschodniej stronie, jak na Podgrodziu (ozdobne, nie do ścinania) |

**Światła, same płomienie** (7 sztuk na szkicu): latarnie na słupach na nabrzeżu i przy szopie, latarnia u drzwi Janka, kosz ogniowy
na końcu mola i na pomoście rybackim, koksownik przy komorze celnej, ognisko w beczce przy szopie. Każde z nich ma ciepłe światło
i migotanie, tak jak ognisko.

**Wnętrza:** Map126 „Chata Janka” i Map127 „Szopa przy pochylni”. Komora celna (Map128) z wnętrzem tylko, jeśli zechcesz. Bez
wnętrza jej drzwi pokażą dymek „Zamknięte.”.

Do dopracowania w etapie 2: niska skarpa między lasem a portem (jak tarasy w górach), więcej drobiazgów na plaży, słupy pod
pomostami.

## 3. Postacie

Obie postacie dostaną arkusze z PixelLab w stylu bohatera, tak samo jak mieszkańcy Podgrodzia (64 × 64, `style_character_id` =
bohater, chodzenie w 8 kierunkach, `tools/npc/build_npc.py`). Popiersia do rozmów zrobię z `tools/busts/kit.py`, dopasowane do
arkusza i sprawdzone `make_match.py`. Ani jednego arkusza RTP.

### Rybak Janek

- **Wygląd:** około 40 lat, szeroki w barach, ogorzała twarz i rudawy zarost. Granatowa czapka z grubej wełny, spłowiała szaroniebieska
  koszula z podwiniętymi rękawami, skórzany fartuch z łuskami ryb, połatane portki do kolan, stare buty z cholewą, nóż u pasa,
  wiklinowy kosz na plecach albo sieć przez ramię.
- **Charakter:** gaduła i śmieszek, przesądny („morze daje, morze bierze”), mieszka sam. Lubi bohatera, bo to on go uratował.
- **Rozkład dnia:**

  | godziny | co robi | gdzie |
  |---|---|---|
  | 0–4 | śpi | Chata Janka |
  | 4–5 | szykuje łódź | pomost rybacki |
  | 5–9 | na morzu (łodzi nie ma przy pomoście) | znika na końcu pomostu |
  | 9–12 | wędzi ryby | wędzarnia |
  | 12–13 | je na ławce | przy stole rybnym |
  | 13–17 | łata sieci, sprzedaje ryby | suszarnie sieci / stół rybny |
  | 17–19 | spaceruje po nabrzeżu | nabrzeże |
  | 19–22 | w tawernie u Borgara | wychodzi ścieżką, siada w tawernie na `gosc_8` |
  | 22–24 | śpi | Chata Janka |

- **Pierwsza rozmowa** (raz, potem zwykłe kwestie):
  > **Janek:** Ej... Ej! To ty! \N[1], tak? To ty! Myślałem, że nie przeżyjesz. Siny byłeś jak dorsz w listopadzie.
  > **\N[1]:** To ty mnie znalazłeś? Na plaży?
  > **Janek:** Ja. O świcie, pod wydmą, przy tym wraku. W garści list, ani myślałeś go puścić. Na szyi kruk, taki sam jak u Stacha. To wziąłem cię na plecy i do niego.
  > **\N[1]:** Dziękuję. Nie wiem, jak ci się odwdzięczę.
  > **Janek:** Daj spokój. Morze daje, morze bierze. A jak raz odda człowieka żywego, to trzeba go zanieść, gdzie trzeba.
  > **Janek:** A! Czekaj. Dwa dni później morze wyrzuciło jeszcze to. *(podaje mokry tobołek)* Chleb zjadły mewy, ser też. Ale chusta została. Haftowana, ładna.
  > *(dostajesz: Chusta matki)*
  > **\N[1]:** To mamy. Haftowała ją całą zimę.
  > **Janek:** To trzymaj blisko. ...No! Jakbyś chciał ryby, to wiesz, gdzie Janek. A jakbyś chciał je łowić, przyjdź o świcie. O świcie biorą najlepiej.
- **Zwykłe kwestie** (przykłady):
  - rano: „O świcie ryba głupia, a rybak mądry. Potem na odwrót.”
  - w dzień: „Wędzę na olszy. Kto wędzi na sośnie, ten je smołę.”
  - wieczór: „Idę do Borgara. Piwo słabe, ale opowieści mocne.”
  - deszcz: „Deszcz! Łap w co się da. Morza się nie napijesz, sól wyżre ci gardło.”
- **Co oferuje:**
  - skupuje świeże ryby (Ryba, id 98) i sprzedaje wędzone (Wędzona ryba, id 106) taniej niż w mieście;
  - uczy łowić: zadanie „Pierwszy połów”, a bez wędki pożycza starą;
  - drobne zlecenia (punkt 3c);
  - plotki z przystani: kto przypłynął promem, co celnik zabrał uchodźcom.

### Przemytnik

- **Imię do wyboru:** **Roch Szkwał** (moja propozycja), Hieronim Mewa albo Wawrzek Sól. Na przystani ukrywa się pod samym imieniem
  i udaje człowieka, który łata sieci i nosi worki z promu.
- **Wygląd jak w prologu:** około 60 lat, siwa broda, kaptur z woskowanego płótna, złoty kolczyk, długi brązowy płaszcz.
  Na przystani płaszcz jest podarty po sztormie, a w ręku zwój liny albo fajka.
- **Czym się zajmuje:** sztorm rozbił mu kuter i zabrał wszystko. Siedzi w szopie przy pochylni i chce połatać kuter, żeby znowu
  pływać na ląd. Celnik Lorda go podejrzewa.
- **Rozkład dnia:**

  | godziny | co robi | gdzie |
  |---|---|---|
  | 0–6 | śpi | szopa |
  | 6–9 | stoi przy wraku i patrzy na morze | plaża |
  | 9–13 | łata sieci, splata liny | przy szopie / pochylni |
  | 13–16 | stoi na nabrzeżu (w dni promu nosi worki przy promie) | nabrzeże / molo |
  | 16–21 | siedzi przy ognisku w beczce | szopa |
  | 21–24 | chodzi po plaży (po naprawie kutra w noce rejsów go nie ma) | plaża |

  Nigdy nie chodzi do miasta: tam łatwiej o donos.
- **Pierwsza rozmowa:**
  > **Przemytnik:** *(patrzy długo)* ...No proszę. Chłopak od ostatnich monet. Żyjesz.
  > **\N[1]:** Ty! Myślałem, że morze cię wzięło. Stałeś przy sterze, a potem ta fala...
  > **Przemytnik:** Wzięło. I wypluło. Mnie zawsze wypluwa, nie smakuję mu. Trzy dni siedziałem na skałach za cyplem i piłem deszcz z kamieni. A kuter... sam widziałeś. Leży na plaży jak zdechły wieloryb.
  > **Przemytnik:** I ciszej z tym „przemytnikiem”. Tu jestem Roch, co łata sieci i nosi worki, jak przypłynie prom. Celnik Lorda za przemyt zabiera łódź, a człowieka zakuwa.
  > **\N[1]:** Nikomu nie powiem.
  > **Przemytnik:** Wiem. Dlatego jeszcze rozmawiamy. *(zerka na szyję bohatera)* A to schowaj pod koszulę.
  > **\N[1]:** Wisiorek? Był ojca.
  > **Przemytnik:** W porcie Czarne Oczy przetrząsały każdą łódź właśnie za takimi kamieniami. Kruk na kamieniu. Kto go miał, ten dalej nie płynął. Czego szukają, nie wiem i wiedzieć nie chcę. Ale ty tego nie noś na wierzchu. Tu też ktoś skupuje kruki.
  > **Przemytnik:** Jakbyś chciał pomóc staremu... kuter da się jeszcze połatać. Deski, liny, smoła. Jak znowu popłynie, zawiozę na ląd list do twojej matki. Za darmo. No, prawie za darmo.
- **Zwykłe kwestie** (przykłady):
  - rano: „Kruk znowu siedział na maszcie wraku. Co rano. Patrzy na ciebie, nie na mnie.”
  - w dzień: „Prom co trzy dni. Na ląd puszczają tylko wojsko i ludzi z glejtem Lorda. Reszta pływa z takimi jak ja.”
  - wieczór: „Vey z kantoru? Ten by sprzedał własną matkę. I sprzedał, widziałem kwit.”
  - noc: „Idź spać. Nocą na przystani kręcą się tylko ci, co nie powinni.”
- **Haczyki:**
  - **Czarne Oczy i kamienie z krukiem**: szukali ich w porcie na lądzie, a na wyspie „ktoś skupuje kruki”. Łączy się z W5
    (Baltazar skupuje kamienie z krukiem dla sztabu) i z wisiorkiem bohatera.
  - **Kruk z masztu**: ten sam kruk co rano siada na wraku. Haczyk pod Urwisko Kruków i oswojonego kruka.
  - **Baltazar Vey**: stara znajomość z lądu, wrogość. Może pomóc albo przeszkodzić w W5 („Noc promu”).
  - **Wieści z lądu**: po naprawie kutra przywozi wieści o wojnie i o matce.
- **Co oferuje** (dopiero gdy kuter pływa): towary z lądu o połowę drożej (sól, żelazo, lekarstwa), listy na ląd, wieści.

### Straż Lorda na przystani

STORY: garnizon przy przystani nosi barwy Lorda. Na przystani stoi **jeden strażnik przy szlabanie** i **celnik w komorze celnej**.
Proponuję wziąć gotowy arkusz `$Npc_Straznik` i popiersie `Straznik_Bust` (zero nowych grafik). Celnik pobiera „opłatę portową”
(dwa grosze od tobołka), zagląda w tobołki uchodźców i z rozkazu dworu spisuje każdy „kamień z krukiem”. To kolejny haczyk: po co
dworowi kruki?

### 3c. Zadania poboczne (krótko)

Numery robocze dalej po istniejących (K46, D19, W9):

1. **K47 „Pierwszy połów”** (Janek, krótkie). O świcie (5–8) złów 3 ryby z pomostu rybackiego. Bez wędki Janek pożycza swoją
   starą. Nagroda: 2 wędzone ryby, Janek odtąd skupuje ryby i daje „rybacką radę” (lepsza szansa na rybę w morzu).
2. **K48 „Sieci po sztormie”** (Janek, krótkie). Przynieś 6 włókna i 2 liny, Janek łata sieci. Nagroda: 20 G i 2 wędzone ryby.
3. **D20 „Kuter na pochylni”** (przemytnik, dłuższe):
   1. z Jankiem i liną ściągacie wrak z plaży na pochylnię;
   2. materiały: 8 desek, 20 gwoździ, 3 liny, 2 smoły (nowy przedmiot: robi ją Zbych Smolarz z Podgrodzia, to jego fach) i żagiel
      (10 włókna, szyje praczka Marta);
   3. noc wypłynięcia: celnik coś podejrzewa. Wybór: odciągnąć strażnika (rozmowa albo 20 G łapówki) albo wydać przemytnika
      celnikowi (40 G; kuter zarekwirowany, przemytnik w kajdanach odpływa promem).
   Nagroda: kuter pływa nocą co kilka dni, przywozi towary i wieści.
4. **W10 „List do matki”** (wątek, otwarty). Bohater pisze list do matki. Wysyła go promem (3 G, ale celnik czyta listy) albo kutrem
   (po D20). Odpowiedź nie przychodzi. Za to przy fali uchodźców (dzień 24 albo 38) kobieta z Brzozowej Woli rozpoznaje haft na
   Chuście matki: „Widziałam ją w obozie za rzeką. Szła z taborem na północ.” Wątek zostaje otwarty: matka nie przypływa, tak jak
   ustaliliśmy w prologu.

## 4. Woda morska: słona, nie do picia

Jak gra rozpoznaje dziś wodę do picia: przycisk akcji przed kafelkiem wody A1 (`Farming_Plots.isWaterTile`, sprawdza warstwy 0 i 1)
otwiera menu „Woda”: wędka, picie, bukłak, konewka, wiadro. Bez żadnych limitów. Czyli **morze z kafelków A1 dawałoby nieskończenie
dużo wody pitnej**. Tego nie wolno.

Propozycja (etap 2):
- Notatka mapy **`<Water:salt>`**: cała woda A1 na tej mapie to morze.
- Przycisk akcji przed morzem: **popup nad bohaterem** z ikoną pragnienia: „Woda morska jest słona - nie do picia”. Jeśli bohater ma
  wędkę, otwiera się menu „Morze” z jedną pozycją „Zarzuć wędkę”. Picia, bukłaka, konewki i wiadra nie ma.
- Łowienie działa jak dziś (`goFishing`: szansa lepsza o świcie i o zmierzchu, w deszczu; daje Rybę 98).
- Pomost z desek nad wodą nie liczy się jako woda: stojąc na molo przed kolejną deską nie wyskoczy menu wody.
- Odgłosy (Atmosphere.js): przy morzu szum morza (`Sea`) zamiast strumienia, a kroki na pomoście brzmią jak drewno, nie jak woda.
- **Żadnych nowych źródeł wody pitnej.** Beczka na deszczówkę u Janka jest pusta (popup „Pusta. Deszcz dawno nie padał.”), na
  przystani nie ma studni. Kałuże po deszczu (Puddles.js) pojawiają się jak na każdej mapie na dworze.
- Kwestie postaci nigdy nie mówią, że wody nie ma nigdzie: wodę nosi się z miasta, jak na Podgrodziu.

## 5. Prom (na razie sam opis)

- Dni promu biorę z kalendarza, który już jest: `TownQuests.isFerry(dzień)`, czyli co 3 dni (1, 4, 7, 10...). Tego dnia jest też
  nowa kartka na tablicy zleceń.
- W dzień promu, od 9 do 15, prom stoi przy molo (zdarzenie z grafiką), a tragarze noszą worki (przemytnik też).
- Gracz nie może popłynąć. Dymek przewoźnika: „Na ląd tylko wojsko i ludzie z glejtem Lorda.”
- W dni fal uchodźców (10, 24, 38, 52 z kalendarza W6) na molo stoją ludzie z tobołkami, a celnik ich przeszukuje. Dalej idą do
  obozu na Podgrodziu, tak jak dziś opowiada W6.
- Dzień 52 „Czwarta fala i noc promu” (W5) czeka w kalendarzu na „przystań i wóz”. Ta mapa to przygotowuje, ale samej nocy promu
  w tym etapie nie robię.

## 6. Technika (etap 2)

### Mapa
- Generator **`tools/przystan/`**, jak `tools/podgrodzie/`: `build.py` (mapa w `staging/`), `check.py` (dojście, przejścia, światła
  tylko z ogniem, żadnej wody pitnej, notatka `<Water:salt>`), `render.py` (obrazy do docs), `build_wnetrza.py` (Map126, Map127),
  `install.py`.
- `install.py` odmawia, gdy działa RPGMZ.exe (tasklist tuż przed zapisem). Nie nadpisuje map zmienionych w edytorze (skróty w
  `installed.json`). Kopie do `backup_art_2026-10-14/przystan/`. Pliki JSON pisze binarnie, z końcówkami linii takimi, jakie plik już ma.
- **Map111:** dopisane jedno zdarzenie „Przejście -> Przystań” na (0,19); instalator znajduje je po nazwie, nic się nie dubluje.
  Bez zmiany kafelków.
- **MapInfos:** 125 „Przystań” (pod Podgrodziem), 126 „Chata Janka”, 127 „Szopa przy pochylni” (i 128 „Komora celna”, jeśli tak).
  Numery 125–129 są wolne.
- `tools/newstart/layout.py` (EDGES: Map111 (0,19) ↔ Map125 (55,19)) i test przejść `run_transfer_test.py`.

### Postacie i zdarzenia
- **TownLife** (już umie wiele map: pole `map` mieszkańca): Janek i przemytnik jako mieszkańcy z `map: 125`. Ich id to kolejne w
  zakresie TownLife 910–949: dziś zajęte są 910–938 (29 mieszkańców), więc **Janek 939, przemytnik 940** (strażnik przystani 941).
  Miejsca jako zdarzenia „Miejsce: <klucz>” na mapie, jak na Podgrodziu. Janek w tawernie: wolne `gosc_8` na Map001 (już jest).
- **Nowa wtyczka `Przystan.js`** (+ `Przystan_Data.js`): pierwsze rozmowy (`TownLife.addTalkHook`), handel rybami u Janka, prom w
  dni promu, łódź Janka na morzu rano, stany kutra (wrak / pochylnia / w rejsie). Zdarzenia wstrzykiwane przez `Tawerna.inject`
  w **zakresie 760–779** (sprawdzone: wolne; zajęte są 730–753 w teście rdzenia, 800–827 i 860–899 podziemia, 840–859 Akt III,
  901–909 Story i TownQuests, 910–998 miasto i dom dziadka, 1000+ sosny).
- Zadania K47, K48, D20, W10 jako wpisy w `TownQuests_Data.js`, żeby dziennik, tablica i Opinia działały same.
- Drobne zmiany w istniejących wtyczkach (z kopiami): `Farming_Plots.js` / `Farming.js` (woda słona, pomost), `Atmosphere.js` (szum
  morza, kroki na deskach), `TownLife_Data.js` (dwaj mieszkańcy), `SpeechBubbles.js` (dwa popiersia na liście). `js/plugins.js`:
  dopisanie Przystan.js tylko przy zamkniętym edytorze.
- **Items.json** (dopisane na końcu, przy zamkniętym edytorze): „Chusta matki” (przedmiot kluczowy) i „Smoła” (materiał).

### Grafika
- `$Npc_Janek` i `$Npc_Przemytnik` (+ chodzenie w 8 kierunkach): PixelLab, około 35 generacji na postać (tyle wychodziło na Podgrodziu).
- `Janek_Bust` i `Przemytnik_Bust`: `tools/busts/make_janek.py`, `make_przemytnik.py` (0 generacji).
- Łodzie (2), kuter jako wrak i po naprawie, prom: PixelLab w stylu Winlu (około 20–40 generacji) albo narysowane w kodzie jak
  drewniana brama Podgrodzia (0 generacji). Do wyboru.
- Suszarnie sieci i ryby na żerdziach: małe obiekty, w kodzie albo PixelLab.
- Latarnie, kosze ogniowe, koksownik, chorągwie Lorda, beczki, skrzynie: już są w paczce (`!Decoration`, `!Flags_banner`, arkusz C).

### Testy (tylko nowe i bezpośrednio dotknięte; na pełny przebieg zapytam)
- Nowy **`tests/przystan_test.js`**: przejście Podgrodzie ↔ przystań w obie strony; przed morzem popup i brak picia (pragnienie bez
  zmian); łowienie z wędką działa; po pomoście się chodzi i nie wyskakuje menu wody; Janek i przemytnik o różnych godzinach (rano
  pomost, wieczorem Janek w tawernie); pierwsza rozmowa daje Chustę matki; prom w dzień promu; każde światło ciepłe i migoczące.
- Dotknięte: `podgrodzie_test`, `podgrodzie_life_test`, `town_life_test`, `talk_busts_test`, `needs_test` (picie przy zwykłej wodzie
  działa jak dawniej), `atmosphere_test`, test przejść `tools/newstart/run_transfer_test.py`.
- Port CDP 9480, serwer `node tools/serve.js` na 8765.

## 7. Pytania do Ciebie

1. **Dojście** przez Podgrodzie, pole (0,19), z jednym nowym zdarzeniem i bez zmiany kafelków: pasuje? Robić też drugą drogę z
   Polnej drogi (wtedy trzeba namalować ścieżkę na Map022)?
2. **Imię przemytnika:** Roch Szkwał, Hieronim Mewa, Wawrzek Sól czy inne?
3. **Celnik:** wystarczy gotowy strażnik w barwach Lorda (`$Npc_Straznik`), czy ma być osobną postacią z własnym arkuszem?
4. **Prom:** tylko widok w dni promu (co 3 dni, 9–15), bez podróży dla gracza. Tak?
5. **Ryby z morza:** zostaje zwykła „Ryba” (98), czy dodać morskie gatunki (śledź, dorsz)?
6. **Janek wieczorem w tawernie** (wolne miejsce `gosc_8`, Map001 bez zmian): tak?
7. **Chusta matki** z wyrzuconego tobołka od Janka (i później haft rozpoznany przez uchodźczynię): tak?
8. **Łodzie, prom i wrak:** PixelLab (około 20–40 generacji) czy rysowane w kodzie (0 generacji)?
9. **Wrak okrętu „na mieliźnie”** ze STORY (statek, który płynął po Serce; inny niż kuter): dodać go już teraz jako ciemny kadłub
   daleko w zatoce, a dojście zrobić później?
10. **Wnętrza:** Chata Janka i Szopa na pewno. Komora celna też z wnętrzem?

---

## Wdrożone (2026-10-14)

Użytkownik zatwierdził koncepcję z odpowiedziami: dojście tylko przez Podgrodzie, przemytnik to **Roch Szkwał**, celnik ma własną
postać (**Sambor Kwit**), prom tylko widoczny, ryby morskie jako **Śledź** i **Dorsz**, Janek wieczorem w tawernie, Chusta matki od
Janka, łodzie z PixelLab, wrak okrętu jako tło, komora celna z wnętrzem.

**Mapy** (tools/przystan: `build.py`, `build_wnetrza.py`, `check.py`, `install.py`, `shots.js`):
- Map125 „Przystań” 56×40, tileset 11; Map126 „Chata Janka”, Map127 „Szopa przy pochylni”, Map128 „Komora celna”.
- Na Map111 dopisane tylko zdarzenie „Przejście -> Przystań” na (0,19), bez zmiany kafelków.
- Instalator sprawdza tasklist przed każdym zapisem, robi kopie do `backup_art_2026-10-14/przystan/` i pamięta skróty map (`installed.json`).

**Grafika:**
- Arkusze `$Npc_Janek`, `$Npc_Przemytnik`, `$Npc_Celnik` (PixelLab, styl bohatera) i popiersia `Janek_Bust`, `Przemytnik_Bust`, `Celnik_Bust`
  (tools/busts) - `postacie_gotowe.png`, `zgodnosc_popiersi.png`.
- Obiekty `!$Przystan_Prom`, `Lodz_Janka`, `Lodz_Mala`, `Kuter`, `Kuter_Wrak`, `Okret_Wrak` (tools/przystan/art) - `obiekty.png`.
- Ikony przedmiotów 173-176 w wolnych polach IconSet (444-447).

**Kod:**
- `Przystan.js` (nowa, po Act3): pierwsze spotkania, skup ryb u Janka, prom i przewoźnik w dni promu (zdarzenia 760-762),
  stany kutra, nocny rejs, donos w komorze celnej, list do matki.
- TownLife_Data: Janek 939, Roch 940, celnik 941, strażnik przystani 942.
- TownQuests_Data: zadania K47, K48, D20, W10, miejsce `przystan_wrak`, żagiel.
- Farming_Plots: morze słone (`<Water:salt>`: popup, tylko wędka, połów to śledź albo dorsz), deski pomostu to nie woda.
- Farming / Farming_Stations / Farming_Data / Journal: „dowolna ryba” w wędzarni, pieczenie śledzia i dorsza na ognisku, FoodTable.
- Atmosphere: szum morza, kroki po deskach.
- TownLife: hak rozmowy „pierwszy”, miejsca „poza domem”.
- SpeechBubbles: trzy popiersia.

**Testy i zrzuty:** `tests/przystan_test.js`; zrzuty z gry `w_grze_*.png` (mapa, prom, Janek, Roch, celnik, noc, wnętrza).

---

## Czerwona woda (2026-10-15)

Użytkownik chciał, żeby woda była tylko ze studni i z rzeki, nigdy z morza, i żeby to ograniczenie było widać i czuć. Zapytał też, czy
nie da się gotować wody z morza. Nie da się.

- **Opowieść:** w suszę morze przy wyspie zakwita. Przy brzegu jest rdzawoczerwone, cuchnie, fale wyrzucają śnięte ryby. Trucizna
  zakwitu nie znika przy gotowaniu, a sól i tak zostaje. Starzy mówią: „krew Kruczych Skał”, czyli Serce krwawi do morza (sama legenda).
- **Kiedy:** czerwona, gdy wśród ostatnich trzech dni nie było dwóch deszczowych. Siła zależy od liczby dni bez deszczu. Po dwóch
  deszczowych dniach woda jest szara, ale dalej słona. Według planu pogody czerwona jest przez około **77% dni** roku.
- **Wygląd** (bez zmiany kafelków, na każdej mapie z `<Water:salt>`):
  - rdzawa barwa najmocniejsza przy brzegu i słabnąca w głąb morza (pomosty nie liczą się jako brzeg);
  - rdzawa piana na linii brzegu;
  - kilka śniętych ryb na brzegu i na pomostach (codziennie inne);
  - szara woda po deszczu jest mętna, szarobura (poprawka użytkownika: wyraźnie widać, że to zła woda, ale słabiej niż
    czerwień) i ma brudną pianę; porównanie przed i po w `czerwona_szara.png`;
  - na przystani dwie tabliczki celnika „Nie pić!”.
- **Odczuwalne:**
  - popup nad bohaterem: „Woda jest czerwona i cuchnie.” albo „Słona - nie do picia.”;
  - **„Napij się mimo to”**: czerwona wywołuje wymioty (woda -18, sytość -12, wytrzymałość -10) i stan **„Zatrucie”** na 8 godzin
    (prace kosztują 30% więcej, wytrzymałość najwyżej 70%, więc i oddech w walce krótszy); szara jest słona (woda -10);
  - **„Nabierz wody”**: odmowa;
  - **„Przegotuj”** (z wiadrem albo kociołkiem): „Dalej czerwona. Nawet para śmierdzi.”;
  - ptaki omijają cuchnący brzeg.
- **Ryby:** przy samym brzegu w czerwieni biorą słabiej i czasem trafia się śnięta (bez wartości). Z końca pomostu i z głowicy mola
  łowi się zdrowo, więc K47 da się zrobić.
- **Rozmowy:** Janek („A ta czerwona woda?”: ojciec próbował gotować, legenda), Roch („Czemu ta woda czerwona?”), celnik (tabliczki, okrzyk).
- **Kod:** `js/plugins/CzerwonaWoda.js` (nowa, po Przystan). Drobne zmiany w `Farming_Plots.js` (menu morza, łowienie przy brzegu),
  `Birds.js`, `Przystan.js`, `TownLife_Data.js`.
- **Grafika:** PixelLab, 15 generacji: `img/system/RedWater_Fish_0/1.png`, `img/characters/!$Przystan_Tabliczka.png`
  (tools/przystan/art/czerwona).
- **Test i zrzuty:** `tests/red_water_test.js`; `czerwona_przystan.png`, `czerwona_plaza.png`, `czerwona_popup.png`, `czerwona_szara.png`.

## W10: listy od matki (2026-10-17, wariant A)

- **Trzy listy** z lądu. Przynosi je przewoźnik promu (w dzień promu, 9–15, na molo) albo Roch po rejsie kutrem (po D20 z wypłynięciem).
  Pierwszy przychodzi 8 dni po wieści z lądu (`w10Wiesc`). Drugi 8 dni po odpowiedzi bohatera, ale nie wcześniej niż 10 dni po pierwszym;
  bez odpowiedzi po 16 dniach. Trzeci 10 dni po drugim, dopiero w okolicach Aktu III.
- **Głos matki:** list czyta się w rozmowie, z popiersiem matki z prologu (`Matka_Bust`, tabliczka „Matka”). Mówi ciche, niewidoczne
  zdarzenie 763 na przystani, ustawiane przy bohaterze. Pełna treść listu trafia do dziennika.
- **Pierwszy list:** żyje, idzie z taborem na północ, pierze i gotuje dla taboru. O ojcu dwie wieści: obóz jeńców za rzeką albo wojsko
  w górach. Pyta o dziadka Stacha i każe zostać przy nim. Ostrzega przed ludźmi z białym okiem pod płaszczem, którzy pytają o kruki.
- **Dziadek** czyta list córki (krok rozmowy w TownQuests): „To dym. Dym gryzie w oczy”. Każe dopisać od siebie, że „fajka dalej śmierdzi”.
- **Odpowiedź** (raz na każdy list): promem (3 G; z pieniędzy celnik bierze dziesiątą część) albo kutrem (za darmo). Do listu można dołożyć
  20 G, 50 G albo paczkę 3 rzeczy, które się nie psują (wędzone mięso, wędzona ryba, ser, miód).
- **Drugi list** zależy od odpowiedzi: pieniądze pokazały jej listę jeńców (pół zmokło) albo „odkładam po groszu”; paczka; „fajka śmierdzi”.
  **Trzeci list:** pas ojca na innym żołnierzu, wygrany w kości od żywego jeńca; tabor idzie na północ; ostrzeżenie przed Czarnymi Oczami
  na wyspie. Wątek zostaje otwarty.
- **Epilog po Sercu:** jedna linijka zależna od tego, czy bohater pisał i pomagał (`Przystan.epilogue`, Underground.js).
- **F9** „Wyspa i fabuła”: „W10: przyślij list od matki” - następny list od razu, bohater na przystani.
