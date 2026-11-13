# Kruczy listonosz (wątek W18 - projekt)

Stan: 2026-11-11, TYLKO PROJEKT (żadnego kodu ani danych gry nie zmieniono). Próbka: `docs/zadania_nowe/kruczy_listonosz_probki/mistrz_Gawron_poludnie.png`
(Mistrz Gawron, PixelLab, styl bohatera).

## 1. Pitch, długość, start

Od dnia 3 dziadek Stach i inni „kruczy strażnicy” są na wojnie (królewski posłaniec zabrał ich razem z krukami). W kruczarni w Kruczogrodzie
(Map008, wieża x107-108 y7-13 i izba x109-113 y10-12 w północno-wschodnim rogu miasta; drzwi dziś: „Kruki śpią - zamknięte”) została
poczta: stary, kulawy **Mistrz Gawron** i kilkanaście kruków, które codziennie wracają z listami z frontu, ze wsi i z Zakonu. Gawron nie
dojdzie z listem z jednego końca miasta na drugi, a bohater ma na szyi wisiorek z krukiem, znak posłańca. Zostaje **kruczym listonoszem**:
rano i wieczorem odbiera listy z gołębnika, chodzi z nimi po mieście **o stałych porach** (adresaci mają swoje plany dnia), czyta na
pergaminie listy od dziadka, a przy okazji odkrywa dwie rzeczy: ktoś **odpieczętowuje i zapieczętowuje listy na nowo**, a w torbie krąży
**list bez adresata**. Trzy tygodnie później zdrajcę czyta się po listach, a nie po twarzy.

- Długość: **5 tygodni gry (5 rozdziałów)**, 28-34 listów, kilka scen.
- Start: po **K51 i D24** (kruk bohatera zamieszkał w kruczarni - dziś zmieniane; zadanie czyta flagi `urwiskoOdkryte` / `krukTame`;
  jeśli D24 przenosi karmienie do kruczarni w mieście, to Gawron jest tym, który pierwszy mówi: „Wisiorek. Wejdź.”), od dnia 12, w godz. 6-20.
  Pierwsza rozmowa u kruczarni (wartownik: „Miejsce: kruczarnia_przed”, do wyznaczenia).
- Z fabułą: dziadek i kruczarze (STORY „Urwisko Kruków”: „nasza rodzina nosi listy, których nikt nie powinien czytać”), Czarne Oczy
  szukają nosicieli wisiorków (kamienie z krukiem, W9/D25), W10 (listy matki), W7 (listy Feliksa), W6 (listy obozu), suszą (kruk niesie list, a
  nie wodę).

**Dwie kruczarnie.** Urwisko Kruków (Map157, ruiny zakonu: K51/D24, grzęda, błyskotki) zostaje tym, czym jest. Kruczarnia w mieście to
**poczta**, która korzysta z tej samej trasy kruków (K51: żerdź w kruczarni - tu, według dzisiejszej zmiany). Do uzgodnienia przy wdrożeniu.

## 2. Mechanika (jedna zasada, kilka zadań)

- **Listy** to rzeczy spoza bazy w „Torbie listonosza” (jedno okienko ekwipunku): „List: Hanka”, „List: Tadek”. Każdy ma: adresata (klucz
  TownLife), **okno doręczenia** (np. „do 12:00”, „wieczorem”), wskazówkę „gdzie szukać” (z planu dnia adresata - bez skanowania) i **wagę**
  (zwiększa tylko liczbę, nie ciężar).
- **Odbiór listów:** kruki wracają o **6:30** i **17:30** (z dźwiękiem skrzydeł nad miastem - Klimat_Miasta: kruki). W kruczarni Gawron
  rozkłada listy na stole; gracz bierze je w menu (OK) - **do 6 listów naraz**.
- **Doręczenie:** rozmowa z adresatem w jego miejscu planu dnia: w menu rozmowy pojawia się „Masz list.” (jak `topicList` u stałych bywalców).
  Nagroda za list: 2-4 G (opłata za doręczenie) + Opinia 0-1, zależnie od terminu i rodzaju. **Kruk bohatera** (K, raz dziennie) może
  zanieść list poza miasto (Pustelnia, Latarnia, Garnizon, Przystań, Osada): to kroki z `kruk: true`.
- **Spóźnienie** (po oknie): list dalej można doręczyć, ale adresat jest zły (Opinia −1) albo list przestaje mieć znaczenie (rozdz. 2:
  list na zdrowie umierającego). Nic nie przepada na zawsze (zasada „Przepada albo spóźniłeś się”, jak K13).
- **Pokusa:** każdy list ma pieczęć. Gracz może go **otworzyć** (menu: „Przeczytaj w tajemnicy”), wtedy czyta treść i dostaje poszlakę
  albo wiedzę o mieszkańcu, ale pieczęć trzeba **zalać woskiem na nowo** (świeca w kruczarni i zapas wosku). Gawron zna swoje pieczęcie:
  przy trzecim otwartym liście traci do bohatera zaufanie („Kruk niesie, nie czyta.”) i szczegółowy rozdz. 3 jest trudniejszy. To lustro
  zdrajcy i dobra decyzja moralna: **nic nie jest wymagane, nic nie przepada**.
- **Zasada klawiatury:** żadnej myszy, menu strzałkami, OK, Esc.

## 3. Rozdziały (tygodnie)

### Tydzień 1 „Pierwsza torba” (dni 1-7 od startu)
- **Gdzie/kto:** kruczarnia (Gawron; wnętrze nowe), miasto (piekarnia, kuźnia, dzwonnica, posterunek, ratusz), tawerna (wieczorem).
- **Co robi gracz:** Gawron zaprasza do wnętrza („Dziadek wspominał. Wisiorek… pokaż.”), pokazuje stół, kruki, przysięgę **„Kruk niesie, nie
  czyta”** (gracz zgadza się albo nie - wybór: „Przysięgam.” / „Postaram się.” - drugi daje zdrajcy większą swobodę, bez kary). Pierwsza
  torba: pięć łatwych listów w ciągu dnia (piekarka, kowal Tadek, dzwonnik Ambroży, kapral Wit, sołtys): uczą miejsc i godzin.
- **Pierwszy list od dziadka:** w piątym dniu kruk Stacha przylatuje o 17:30; Gawron podaje list **bohaterowi** (scena S2: czytanie).
  Stach pisze krótko: żyje, jest w obozie pod górami, kruki nie giną, pozdrawia, „pilnuj działki”.
- **Haczyk:** jeden z siedmiu listów ma pieczęć zalaną innym woskiem; Gawron to widzi: „To trzeci taki w tym miesiącu.” Gracz dostaje
  pierwszą poszlakę.
- **Dziennik:** „Zostałem kruczym listonoszem: rano i wieczorem listy, w ciągu dnia obchód.”
- **Nagroda:** ok. 20 G (opłaty), Opinia +2 u osób, które dostały list o czasie.

### Tydzień 2 „Listy z frontu” (wieczory w tawernie)
- **Gdzie/kto:** tawerna (Melia, Grum, Ozzy, Borgar), Przytułek, Kaplica/cmentarz (Kleofas przyjmuje listy dla zmarłych), rynek.
- **Co robi gracz:** listy z wojny: **Grum** dostaje list od swojego dawnego kompana (dostarczenie wieczorem w tawernie: scena S3 - Grum
  siedzi długo, potem stawia kolejkę), **Melia** - list od siostry z kontynentu (o dłoni i pieśni), **Hanka** - list od męża z obozu pod
  Skałą. Trzy listy wymagają dostarczenia **o stałej godzinie** (karta „godziny”: Grum 19-22, Melia 17-21:30, Hanka 5-12).
- **List do zmarłego:** list od żołnierza do jego matki, **starej Gryty** (wdowa, `wdowa`), która umarła z pragnienia przed tygodniem. Gracz
  pyta: sołtys, wdowa-sąsiadka, Ambroży - nikt nie wie, komu zanieść. Wybór (scena S4, cmentarz o zmierzchu): (a) **przeczytaj na grobie**
  (Ambroży dzwoni raz, bohater czyta list na głos w dymkach, kruk siada na krzyżu; Opinia +3, dośw. 40), (b) **zanieś do Kleofasa** (zapisze
  w księdze zmarłych; Opinia +1), (c) **oddaj siostrze** (wdowa sąsiadka; jej rozgniewanie przy dostarczeniu: Opinia 0, ale list
  zniszczy jej spokój), (d) **odeślij nadawcy** (kruk wraca z „adresat nie żyje”; żołnierz w następnym liście pyta; w tygodniu 4 jest
  odpowiedź).
- **List bez adresata** (koniec tygodnia): w torbie po porannym obchodzie leży list bez nazwiska, w miejscu adresu tylko **tusz kruka z
  białym okiem w rogu**. Gawron: „Nie wyszedł z mojego stołu.” Gracz go zabiera (Gawron: „Nie otwieraj. Znajdź, komu należy.”).
- **Dziennik:** „W torbie znalazłem list bez adresata. Ktoś go tam wsunął.”
- **Nagroda:** ok. 30 G, Opinia +3-5 łącznie.

### Tydzień 3 „Kto czyta?” (śledztwo)
- **Gdzie/kto:** kruczarnia (noc), Ratusz (sołtys, pisarz Cyryl), przystań (Sambor czyta listy promu - legalnie), kantor (Baltazar skupuje
  cudze listy przez kruka D24), tawerna (plotki).
- **Co robi gracz:** poszlaki o czterech otwartych listach (karta „Pieczęcie”): kolor wosku, odcisk, zapach tytoniu. Podejrzani:
  1. **Tymon**, uczeń Gawrona (ręce w atramencie, nie śpi nocą) - w rzeczywistości **przepisuje listy dla niepiśmiennych za grosz**, nie czyta cudzych.
  2. **Sambor Kwit** (celnik, ma prawo czytać listy z promu; w mieście nie) - plotka z Przystani; w rozmowie czysty.
  3. **Baltazar Vey** (skupuje cudze listy od kruków: K-„błyskotki”) - ma motyw handlowy, ale jego woskiem są zielone pieczęcie, nie czerwone.
  4. (prawdziwy) **Cyryl Atrament**, pisarz Lorda w Ratuszu (Map104), który przychodzi do kruczarni każdego dnia **uporządkować listy urzędowe**
     i jest przemiły dla bohatera: podpowiada adresy, pożycza lupę, rysuje plan dzielnic. Jego wosk jest ratuszowy czerwony (jak wielu).
  Gracz zbiera poszlaki w wieczornych rozmowach i **nocnej warcie** w kruczarni (scena S5: pierwsza próba - bohater siedzi w izbie od
  23:00; o 3:10 ktoś wchodzi, odpieczętowuje listę pod świecą; gracz zapala latarnię i ścigany uciekający zdrajca rzuca przedmiot i znika
  w ulicach (krótka pogoń przez miasto nocą, 15-20 s, bez walki)). Upuszczona rzecz: **świeca z zielonym woskiem** (fałszywa poszlaka
  na Baltazara) albo **strzęp atramentowej plamy** na rękawie.
- **Alternatywa:** gracz czyta listy po kryjomu, odkrywa poszlaki szybciej, ale Gawron to widzi (patrz pkt 2).
- **Dziennik:** „Ktoś odpieczętowuje listy i zalewa je woskiem. To nie jest ktoś obcy.”
- **Nagroda:** 20 G + Opinia (zależnie od przyjętych uwag).

### Tydzień 4 „Pułapka z listów” (list bez adresata + kruk bohatera)
- **Gdzie/kto:** Archiwum (Map119, Kleofas/Ambroży), kruczarnia, tawerna (Melia pomaga w pisaniu), trzy miejsca zasadzki.
- **Co robi gracz:**
  1. **Dla kogo jest list bez adresata?** Gracz porównuje: pismo (Archiwum: rejestry Ratusza - pismo „prostych, pochylonych liter”), papier
     (z klasztoru na lądzie, wypłowiały), woskowa „oko” w zagięciu (Czarne Oczy). Odczytuje po cichu: pozdrowienie od obcego: *„Dziś jak zawsze.
     W piątek wyślij nazwiska tych, którzy noszą kruka na szyi. Jeśli stary zauważył - zrób to ty, nie on.”* Adresat jest tym, **kto czyta**.
  2. **Pułapka**: bohater i Melia piszą **trzy listy-przynęty** o ukrytym kamieniu z krukiem w trzech miejscach (a: studnia na rynku,
     b: stara krata w piwnicy tawerny, c: kruczarnia). Każdy list trafia do innego podejrzanego (Tymon, Sambor, Cyryl) jako „pomyłka w
     torbie”. Przez trzy noce **kruk bohatera (zwiad raz dziennie)** albo **biały orzeł** (jeśli jest) patrzy z góry na jedno z trzech miejsc.
  3. Trzeciej nocy: człowiek w kapturze (agent Czarnych Oczu, rozmowa przez ukryty podgląd) odwiedza **miejsce c** - kruczarnię; przynęta
     szła od Cyryla. Bohater idzie za agentem (scena S6, krótko, skradanie) i widzi, jak Cyryl oddaje mu paczkę.
- **Wiedza zwiększona przez frakcję:** jeśli W7 prowadzi do aresztowania Feliksa, agentem jest człowiek ze skraju lasu; jeśli Feliks jest w
  grze - to on (kanał „Feliks sprzedaje frakcji”). Zadanie czyta `w7FeliksCzujny`/`feliksArrested` i dobiera postać.
- **Dziennik:** „Zdrajca to Cyryl, pisarz z Ratusza. Listy kruków idą do ludzi w kapturach, a ci szukają nosicieli wisiorków.”
- **Nagroda:** 40 dośw., Opinia +2, poszlaka W7/W9 (łączy z W5, jeśli otwarte).

### Tydzień 5 „Kruk niesie, nie czyta” (finał)
- **Gdzie/kto:** kruczarnia (noc i świt), Ratusz, rynek.
- **Co robi gracz:** konfrontacja w kruczarni (scena S7): Cyryl wchodzi o 3:00 jak co noc, bohater i Gawron czekają. Cyryl nie wybucha:
  mówi cicho, że jego młodsza siostra Lena jest na kontynencie w obozie i „oni mają jej listy”; czytał, bo go zmuszono, i „ostrożnie, nie
  powiedziałem, gdzie jest kamień z krukiem w gruzie”. Gawron milczy.
- **Wybór (klawisze, bez przepadania):**
  1. **Wydaj Witowi** (Cyryl idzie do izby przy posterunku; Opinia +5, Lord wdzięczny: +10 przychylności garnizonu; Lena zostaje sama).
  2. **Przestaw go** (Cyryl zostaje na stanowisku i dalej wysyła **fałszywe nazwiska i fałszywe kryjówki** pod kontrolą bohatera i Gawrona;
     bohater co tydzień pisze „listy do Czarnych Oczu” w tawernie; flaga `listonoszFalszywe` - w Akcie III frakcja wie mniej; ryzyko: jeśli
     bohater zawiedzie, Lena ginie).
  3. **Uciekaj** (Cyryl odpływa promem; Gawron kłamie przed Witem; Opinia −2, ale list od Leny po tygodniu: „dziękuję”, a Czarne Oczy tracą
     ich kanał).
- **Epilog:** Gawron wręcza **Odznakę kruczego listonosza** (kruk z wygrawerowaną datą), przekazuje klucze do kruczarni. List od dziadka:
  „Dostałem. Dobrze zrobiłeś.” Scena S8 (świt, wszystkie kruki odlatują z paczkami).
- **Dziennik:** „Kruczarnia ma nowego mistrza. Kruk niesie, nie czyta.”
- **Nagroda:** 60 G + 150 dośw. + odznaka i **poczta kruków na stałe** (bohater może wysyłać listy z kruczarni do dowolnego miejsca na
  wyspie za 5 G dziennie; kruk bohatera lata także nocą).

## 4. Zestaw listów (przykłady; reszta z szablonów)

| tydzień | adresat (klucz TownLife) | gdzie i kiedy | treść w skrócie | hak |
|---|---|---|---|---|
| 1 | piekarka | piekarnia 4-12 | od męża z frontu: żyje, ale „głodno” | Hanka ściska torbę; +1 |
| 1 | kowal Tadek | kowadło 5:30-12, 13-17 | od brata: potrzebuje podków dla wojska | otwiera K63 |
| 1 | dzwonnik Ambroży | dzwonnica | od starego kolegi: „dzwonić cztery i jeden” | związek z D37 |
| 1 | kapral Wit | posterunek/brama | rozkaz: wzmocnić mury | wskazówka W4/W7 |
| 1 | sołtys | Ratusz | od starosty: zboże na zimę | wątek zboża z W17 |
| 2 | Grum | tawerna 19-22 | od dawnej kompanii: „Kruczek nie żyje” | scena S3 |
| 2 | Melia | tawerna 17-21:30 | od siostry: pieśń „Kruk nad kopcem” | odblokowuje zwrotkę |
| 2 | stara Gryta (nie żyje) | cmentarz | od syna-żołnierza: „piszę, że wracam” | scena S4 |
| 2 | brak | torba | białe oko w rogu | tydzień 4 |
| 3 | Baltazar | kantor 8-18 | rachunek za zioła | „zielony wosk” |
| 3 | sołtys (list urzędowy) | Ratusz | upomnienie Lorda | odpieczętowane |
| 3 | Sambor (przez kruka) | przystań | z prośbą o kamienie z wraku | nie otwarty |
| 4 | Zosia | rynek | od ojca z frontu: „kruki na wsi znikają” | wątek wojny |
| 4 | Ela, Ludmiła (obóz) | obóz | z Rafałem w nagłówku | W6 |
| 4 | Pustelnik Kleofas (kruk) | Pustelnia | skrzynka z zeszytami | D23 |
| 5 | rotmistrz Bełza (kruk) | Garnizon | wiadomości od dowództwa | przychylność garnizonu |
| 5 | bohater (od Stacha) | kruczarnia | finałowy list | scena S8 |

## 5. Sceny

**S1 „Kruk z listem przez ekran” (od tygodnia 1; 10 s, bez belek).** Rano o 6:30 kruki wracają: z prawej krawędzi ekranu nad dachami
przelatuje kruk z **zwiniętą kartką w szponach** (animacja lotu 4 klatki + kartka dorysowana skryptem), dźwięk skrzydeł, kamera jedzie za
nim do wieży, kruk siada na żerdzi, Gawron wychodzi z listem. Dymek Gawrona: „Z obozu. Pewnie dla ciebie.”

**S2 „Czytanie na pergaminie” (tydzień 1 i dalej; 8-15 s).** Okno listu: arkusz papieru w ramce czarno-żółtej (styl UI gry; **bez
pergaminu na cały ekran**, bo „Kronika” została usunięta), tusz w odcieniach nadawcy (dziadek: ciemnobrązowy, pochylone litery), tekst
pojawia się wierszami co 0,5 s, OK przyspiesza, Esc zamyka. W tle ciche skrzypienie pióra. Po liście notatka w dzienniku.

**S3 „Grum czyta” (tydzień 2).** Tawerna wieczorem. Grum siada przy oknie, Melia przestaje śpiewać (muzyka cichnie), kamera na Grumie;
dymek: „Kruczek… dwa lata razem w lesie.” Tawerna na chwilę cichnie (goście przestają się ruszać 4 s), potem Grum wstaje i woła „Kolejka dla
każdego!”; Borgar nalewa (3 s). Nikt nie odpływa z krzeseł (kanapy: „Nobody vanishes”).

**S4 „List na grobie” (tydzień 2, zmierzch).** Cmentarz przy Kaplicy; Ambroży dzwoni raz (dzwon), wiatr (Atmosphere), kamera od tyłu na
bohaterze nad grobem; dymki listu po jednym (6 s każdy). Kruk siada na krzyżu i nie odlatuje. Belki.

**S5 „Noc w kruczarni” (tydzień 3, 3:10).** Wnętrze izby, jedna świeca (ogień). Wchodzi zakapturzona postać (z bocznego wejścia), zdejmuje
pieczęć nożem rozgrzanym nad świecą. Gracz zapala latarnię: zdrajca zrywa się, przewraca stołek, ucieka; pogoń przez noc (Klimat:
latarnie, okna) 18 s, kończy się na rynku, gdzie postać znika w tłumie nocnych strażników (nie ma dowodu). Muzyka bez melodii.

**S6 „Przynęta” (tydzień 4, trzecia noc).** Kruk bohatera na dachu kruczarni (kamera z góry), na dole dwie postacie przekazują sobie
paczkę, kamera przechodzi po cieniach, bohater zakrada się za nimi (skradanie, ptaki płoszą). Dymki szeptem w grze.

**S7 „Prawda w kruczarni” (tydzień 5, noc, 40 s).** Belki. Gawron, bohater i trzy kruki na żerdziach. Cyryl wchodzi, zapala świecę,
widzi ich. Rozmowa w dymkach z popiersiami. Kruki jeden po drugim odlatują przez okno (sygnał rozstrzygnięcia). Wybór w menu (↑↓ OK).

**S8 „Odlot” (epilog, świt, 20 s).** Wszystkie kruki wylatują z wieży z paczkami (kilka sprite'ów, ruch po trasie, rozproszone w stronę
dróg), Gawron i bohater stoją na dziedzińcu; list od dziadka czytany na głos przez Gawrona.

## 6. Postacie, przedmioty, rekwizyty, wnętrza

### Nowe postacie (hero style, PixelLab pro 64x64)
| klucz | imię | rola, plan dnia |
|---|---|---|
| `gawron` | **Mistrz Gawron** (próbka gotowa) | stary kruczarz o drewnianej nodze: 6-20 w kruczarni (miejsce przy stole), 20-22 w tawernie (Borgar przy barze nalewa mu kufel), nocą śpi w izbie kruczarni. |
| `tymon` | **Tymon**, uczeń | 15-letni chłopak, ręce w atramencie, przepisuje listy dla niepiśmiennych; rano w kruczarni, wieczorem na rynku. |
| `pisarz` | **Cyryl Atrament** | pisarz Ratusza: 8-16 w Ratuszu, 16-18 w kruczarni „porządkuje listy urzędowe”, wieczorem tawerna; zdrajca. |
| `kaptur` | **człowiek w kapturze** | agent Czarnych Oczu, tylko w scenach (kanał z W7 / W5). |
Popiersia: Gawron i Cyryl (skrypty tools/busts). Cyryl i Tymon nie mają równolegle pasujących imion do istniejących NPC.
Istniejące postacie dotknięte: Hanka (piekarka), Tadek (kowal), Ambroży, Wit, sołtys, Grum, Melia, Ozzy, Borgar, Baltazar, Sambor (celnik),
Kleofas (Pustelnia), Zosia, Ela i Ludmiła (obóz, W6), Rotmistrz Bełza (kruk), Feliks (jeśli jeszcze w grze).

### Przedmioty (spoza bazy)
- **Torba listonosza** (przedmiot kluczowy; dłuższa lista przedmiotów w okienku „Listy”), **Listy** (ok. 34 wpisy z szablonu), **Wosk i
  pieczęć kruka** (zalanie pieczęci), **Lupa** (od Cyryla; potem odbierana), **Odznaka kruczego listonosza**.
- **Świeca z zielonym woskiem** (fałszywa poszlaka) jako rekwizyt w scenie.

### Rekwizyty i wnętrze
- **Kruczarnia - wnętrze (nowa mapa, ok. 18x12)**: dwie części: *izba pocztowa* (stół do sortowania z przegródkami - przegródki są
  częścią obrazu stołu, nie osobnymi „przedmiotami do wzięcia”, pokój do spania Gawrona, kominek) i *wieża* (żerdzie dla kruków, drabina,
  okno, ptaki przylatujące i odlatujące). Kruki: 4-6 zdarzeń, każde z czterema stanami (siedzi, dziobie, skacze, odlatuje).
  Wejście z drzwi „Drzwi: Kruczarnia” (Map008, dziś zamknięte; zdarzenie istnieje).
- Rynek: **skrzynka pocztowa na słupie** *(opcjonalnie, odłożone)*.
- Zasada „dekoracja nie wygląda na przedmiot do wzięcia”: listy na stole rysowane jako część mebla.

## 7. Animacje i grafika
| co | jak | status |
|---|---|---|
| kruk z listem w szponach (lot, siad, odlot; 4 klatki x 4 kierunki) | skrypt na istniejących kruków (Klimat_Miasta/Kruk) + PixelLab (animate) | do zrobienia (ok. 20 gen) |
| kruki w gołębniku (4 stany) | arkusz istniejący + skrypt | do zrobienia |
| Gawron, Tymon, Cyryl, kaptur (8 kierunków + chód) | PixelLab pro (styl bohatera) | Gawron próbka (10 gen); reszta do zrobienia |
| popiersia | skrypt | do zrobienia |
| kartka z pismem (sprite w szponach, okno listu) | skrypt | do zrobienia |
| pieczęć (zalewanie wosku, światło świecy) | skrypt/efekt ognia | do zrobienia |
| wnętrze kruczarni | skrypt `tools/wnetrza/build.py` | do zrobienia |
| dźwięki: skrzydła kruków, skrzypienie pióra, kapanie wosku | Atmosphere/PixelLab SFX | do zrobienia |

## 8. Nagrody i konsekwencje (ekonomia)
- Opłaty za listy: 2-4 G x ok. 30 = **ok. 90 G**; wątek +60 G w finale = **ok. 150 G pewne** w 5 tygodniach (dla długiego wątku to w normie wobec
  883 G z 90 zadań i długu 2500 G; nic nie daje wody).
- Dośw.: 40 + 40 + 40 + 150 = 270. Opinia: do +10 łącznie, spadek −1 za spóźnienia (nigdy poniżej 0).
- Odznaka i poczta na stałe. Różnica wariantu zdrajcy: `listonoszFalszywe` zmniejsza wiedzę frakcji w Akcie III; `Wydaj` daje
  przychylność garnizonu +10.
- Fabuła: list bez adresata odkrywa, że Czarne Oczy znają kanał kruczarzy; w Akcie III kruki nie wyleciały do Garnizonu bez
  „przestawionych” nazwisk.

## 9. Implementacja
- **Silnik:** `Poczta.js` + `Poczta_Data.js` (jak Kruk.js/Kruk_Data.js, według zasady „dane w Watki”), wątek `poczta`, teksty
  `js/teksty/poczta.txt`. Listy jako rzeczy spoza bazy (`v:list_*`), torba jako jedna lista w menu; okno listu: nowa klasa `Window_List`
  (styl UI: czarno-żółty).
- **Używa istniejących:** TownLife (godziny adresatów: `TownLife.where(key)` bez skanowania, tylko odczyt planu), TownQuests (rozmowy
  adresatów: `topicList`, terminy), Kruk.js (`kruk: true`, zwiad, błyskotki, obcy list - **ten sam mechanizm cudzych listów**; ten wątek
  zastępuje ich losowość przez zaplanowane), SpeechBubbles, CleanHUD.sceneBars, Humans (brak walki), Hunting (skradanie), Atmosphere.
- **Mapy:** jedna nowa (wnętrze kruczarni, 18x12); Map008 bez zmian (drzwi istnieją), tylko zdarzenia `inject`; `Map008` ma ptaki z
  Klimat_Miasta („kruki nad miastem” - dodać przylot o 6:30 i 17:30 bez nowego skanu).
- **F9 „Poczta”:** tydzień N, „pokaż torbę”, „dodaj list X”, „czas 6:30”, „zdrajca ujawniony”.
- **Testy:** `tests/poczta_test.js` (listy powstają z szablonu; okno doręczenia z planem dnia; spóźnienie; pokusa 3 otwarte = Gawron traci
  zaufanie; zdrajca stały (Cyryl) i trzy poszlaki; trzy wyjścia finału z flagami; K51/D24 jako warunek startu).
- **Rozmiar:** **L** (silnik M, dane L: 30+ listów z tekstami, 8 scen, nowe wnętrze, 4 postacie).
- **Ryzyka:** (1) zmiany K51/D24 robione dziś - sprawdzić warunek startu; (2) liczba listów i tekstów - szablony zamiast pisania 34
  unikatowych; (3) wydajność: kruki w kruczarni jako 4-6 zdarzeń tylko wewnątrz wnętrza; (4) zdrajca zależy od Feliksa (W7) - dobór
  agenta po flagach; (5) pokusa: żeby nie zepsuć zaufania Gawrona przez omyłkę, każdą „Przeczytaj” poprzedza pytanie „Na pewno?”.

## 10. Pytania do użytkownika
1. **Zdrajca**: czy Cyryl (pisarz Ratusza, sympatyczny) jest dobrym wyborem, czy wolisz kogoś bliższego (np. Tymona, ucznia - smutniejsze, mniej niespodzianek)?
2. **Okno listu**: papier w czarno-żółtej ramce (jak UI), czy jednak pełny pergamin (wraca „Kronika”, która została usunięta)?
3. **Pokusa czytania cudzych listów**: ma mieć konsekwencje (zaufanie Gawrona), czy tylko poszlaki bez kary?
4. **Kruczarnia w mieście i Urwisko**: potwierdź, że to dwie kruczarnie (poczta i ruiny Zakonu), a dzisiejsza zmiana K51 prowadzi do tej w mieście.
