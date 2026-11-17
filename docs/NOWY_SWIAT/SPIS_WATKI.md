# Nowy świat: spis całej obecnej fabuły i zadań, z decyzją (szkic 1, 2026-11-13)

Spis wszystkiego, co dziś jest w grze jako fabuła, wątek lub zadanie, z propozycją, co z tym zrobić w nowym świecie
(5 map po 80x80, woda ograniczona, wątek główny „Woda i Serce”). **To propozycja do akceptacji; w grze nic nie zmieniono.**

Skąd dane: `docs/STORY.md`, `docs/QUESTY.md`, `docs/QUESTY_STAN.md`, `docs/AKT3.md`, `docs/PODROZNI.md`, `docs/PODZIEMIA.md`,
`docs/zadania_nowe/`, `docs/rozszerzenia/`, `docs/questy_mapa/PLAN.md`, nagłówki w `js/teksty/*.txt` (wątki W1-W23 i ich
kroki), nazwy wtyczek w `js/plugins/`. Rozmiar „kroki” = liczba kroków zadania w dzienniku (z `js/teksty`); „rozdz.” =
rozdziały wątku wg `QUESTY_STAN.md`.

## Decyzje (skrót)

- **PRZENIEŚĆ** – pasuje prawie bez zmian; zmienia się tylko miejsce (mapa/wnętrze) i imiona.
- **PRZEROBIĆ** – dobry pomysł, ale trzeba przepisać pod nową fabułę (podaję jak).
- **ARCHIWUM** – nie pasuje teraz; zostaje w archiwum (nic nie kasujemy).
- ★ = pasuje szczególnie dobrze do wątku głównego „Woda i Serce” (woda, zakon, lochy, dług, szpieg, matka/ojciec).

## Sumy

Razem **186 pozycji**: **PRZENIEŚĆ 111**, **PRZEROBIĆ 55**, **ARCHIWUM 20**. Z tego **68 oznaczonych ★** (pasują do wątku głównego).

| Grupa | Pozycji | PRZENIEŚĆ | PRZEROBIĆ | ARCHIWUM | w tym ★ |
|---|---|---|---|---|---|
| A. Fabuła główna, prolog, akty (S1-S15) | 15 | 6 | 6 | 3 | 7 |
| B. Wątki W1-W23 | 23 | 16 | 7 | 0 | 16 |
| C. Zadania miejskie K1-K73 | 73 | 48 | 15 | 10 | 19 |
| D. Zadania długie D1-D48 | 48 | 24 | 19 | 5 | 14 |
| D2. Pozostałe linie i paczki (L1-L17) | 17 | 9 | 6 | 2 | 7 |
| E. Tawerna i systemy (T1-T10) | 10 | 8 | 2 | 0 | 5 |

Z zadań K i D 15 nie było nigdy zbudowanych w starej grze (K7, K18, K23-25, K34-36, D2, D7, D8, D12, D15, D19, D9): oznaczone „(czeka)”.
Zostają prawie wszystkie wątki W (23 z 23: żaden nie idzie do archiwum w całości); do archiwum idą głównie rzeczy związane ze starą mapą wyspy
(Wezwanie króla, garnizon, latarnia, Orla Grań, Osada Milczących, Spalona zagroda) i niezbudowane drobiazgi.

## Wątki, które pasują najlepiej do „Wody i Serca”

1. **W1 Woda spod Kruczych Skał** – cała tajemnica „kto ma wodę”: ukryty kanał, wodziarz, ogród Lorda, wielka cysterna zakonu. To już jest ta sama fabuła.
2. **W19 Sygnały z młyna** – szpieg wojny w młynie; w nowym świecie młynarzem jest dokładnie ten szpieg (zmienia się tylko winowajca).
3. **W15 Święte kości** – relikwia w kaplicy, która naprawdę jest kluczem zakonu (wprost z QUESTY.md).
4. **W2 Kod dzwonu** – dzwonnik, pieczęcie i Archiwum zakonu; dobra pierwsza komora lochów pod tawerną.
5. **W4 Krew kasztelana** – klucz do zamurowanej piwnicy i krata zakonu: dokładnie „zejście do lochów” z aktu II.
6. **W7 Dwór** – księga wody Lorda; Feliks staje się rządcą, który fałszuje księgę (wariant A, gdzie „Lord nic nie wie”, już to robi).
7. **W5 Towary z kontynentu (Baltazar)** – lichwiarz skupujący długi; przemyt; kantor jako ogniwo intrygi rządcy.
8. **W21 Gorączka w przytułku** – ludzie piją złą wodę; czysta woda, zioła, znachorka: czysty temat wody.
9. **W10 List do matki + W20 Kruczy listonosz** – listy matki i poszukiwania ojca; kruczarz dziadka; od razu tło całej gry.
10. **W8 Żelazna Pięść + kopalnia** – droga do źródła przez kamieniołom i kopalnię (akt III), Grum jako przewodnik/rywal.

Dalej mocno: W3 Pieśń o Kruczych Skałach (ballada wskazuje drogę w dół), W23 Coś z głębin (Wybrzeże), W12 Rozbitek, W6 Ludzie z promu
(jako rozbitkowie z wraku), W9 Rywal w ruinach (ktoś jeszcze schodzi do lochów), D28 Zapas zakonu (stara cysterna pod tawerną),
D17 Petycja do Lorda (jako petycja o wodę), D9 Spis beczek (niezbudowany; idealny: księga wody).

## Stałe zamiany przy przenoszeniu (jedna decyzja na wszystkie wątki)

- **Kruczogród -> Miasteczko**, stary **Kruczy Jar / działka -> dom i działka dziadka w Podgrodziu**, **dwór (Map024) -> Posiadłość**,
  **Góry/kamieniołom (Map013/014) -> Góry**, **Przystań + wrak -> Wybrzeże** (prom i molo na Wybrzeżu).
- **Feliks (kamerdyner) -> rządca Lorda** (fałszuje księgę wody, okrada Lorda i miasto). **Pokojówka** = jego wspólniczka od jazu.
- **Kuba (woziwoda, w W1 sprzedający wodę)** zostaje uczciwym woziwodą; „wodziarzem po lichwiarskich cenach” robimy nową postać.
- **Borgar** może zostać karczmarzem (przyjaciel dziadka, ród strażników); imię w MIESZKANCY.md „do wyboru”. Wszystkie jego zadania i rozmowy przechodzą.
- **Obóz pod murem (Ludmiła, Ela, Rafał, Marek)** -> rozbitkowie w Podgrodziu (przytułek siostry Klary); „uchodźcy z promu” -> „rozbitkowie z wraku i z promu”.
- **Garnizon królewski nad zatoką** nie istnieje -> wojsko to **straż Lorda i jej kapitan**; „wojsko żąda zapasów” zostaje jako presja na Lorda.
- **Nowy młynarz = szpieg**; stary młynarz **Walenty** (dziś w W19 właściciel młyna) to emeryt, który mu nie ufa.
- **Dni** (dług 2500 G do dnia 60, fale promu 10/24/38/52, jarmark 47-53) są w danych: wystarczy je przeliczyć, kalendarz zostaje.
- **Zasada suszy** (żadne zadanie nie daje wody; wolno ją tylko zabierać/pokazywać) zostaje i pasuje do nowego świata jeszcze lepiej.

---

# A. Fabuła główna, prolog, akty (Story.js, Prologue.js, Act3.js, Underground.js)

| # | Co | O czym (2-3 zdania) | Postacie | Miejsca | Rozmiar | Decyzja |
|---|---|---|---|---|---|---|
| S1 | Prolog „Ostatni prom” (Prologue.js) | Film: wojna na lądzie, wieś Brzozowa Wola płonie (Czarne Oczy = Straż Pewności), matka daje list do dziadka i wisiorek z krukiem, sztorm, plaża. Imię bohatera na starcie. | matka, przemytnik, rybak Janek | ekran filmu, plaża | 1 scena, ~3 min, pomijalna | **PRZENIEŚĆ** (zmiana drobna: ostatni statek „Pomyślność” zamiast kutra, katastrofa u wybrzeża; wrak potem na Wybrzeżu) ★ |
| S2 | Przebudzenie u dziadka (Story.js, scena otwarcia) | Bohater w łóżku, pierwsza rozmowa z dziadkiem, kadry z paskami, mokry list matki; trzy dni gorączki. | dziadek Stach, rybak Janek | dom dziadka | 1 scena | **PRZENIEŚĆ** – Podgrodzie, nowy dom dziadka ★ |
| S3 | Rozdział 1 „Dług dziadka” (Story.js) | 2500 G do dnia 60, spłata Lordowi/Feliksowi (Story.pay), listy w dniach 20/40/55/59/60, praca u Borgara. Haczyk o kamieniach twierdzy. | dziadek, Lord, Feliks, Borgar | dwór, tawerna, działka | ~60 dni gry, główna presja | **PRZEROBIĆ** ★ – dług staje się zastawem za wodę; przychodzi rządca z księgą długu; prawda (woda dla ludzi) odkrywana stopniowo |
| S4 | Strata działki / odkup | Niespłacony dług: scena mierzenia, 3 dni na wyniesienie dobytku, straż zamyka działkę; odkup 3000 G. | Feliks/Teodor, strażnicy | działka dziadka | 1 scena + 3 dni | **PRZENIEŚĆ** (scena już jest, plan ją zachowuje) |
| S5 | „Wezwanie króla” (dzień 3) | Dziadka wzywa król (kruczy strażnik), dom w zastawie, bohater idzie spać do stajni zajazdu. | królewski posłaniec, Feliks, Szczepan | dom dziadka, stajnia, prom | 1 dzień + noclegi | **ARCHIWUM** – dziadek zostaje w Podgrodziu i ma tajemnicę zakonu; z tego zostaje tylko praca w stajni (T9) |
| S6 | Akt II: rozdziały w tawernie | Po rozdziale 1: Borgar, krata (W4), Grum (W8), Lord pyta o to, co pod skałami (W7), Opinia w mieście. | Borgar, Grum, Lord | tawerna, miasto | wiele wątków naraz | **PRZEROBIĆ** – to szkielet aktu II; patrz W4, W8, W7, W9 niżej |
| S7 | Akt III „Frakcja uderza na tawernę” (Act3.js, AKT3.md) | Po zejściu głęboko wróg uderza nocą na tawernę: alarm dzwonu „trzy i jeden”, fale napastników, obrońcy z miasta zależnie od Opinii; wynik wpływa na zakończenia. 47 sprawdzeń, F9. | Ambroży, Tadek, Rafał, Ignac, Kuba, Grum | tawerna, miasto | ~1-2 h gry | **PRZEROBIĆ** ★ – wysłannicy wojny (z młynarzem-szpiegiem w środku) uderzają na tawernę; wyzwalacz: otwarcie wodociągu/zejście do lochów; „tawerna zawsze otwarta” zostaje |
| S8 | Podziemia „100 pięter” (Underground.js, PODZIEMIA.md) | Pięć pasm (piwnice zamku, kwatery zakonu, jaskinie z rzeką, ruiny, Warstwa Prawdy), piętra to losowane labirynty 80x60 ze stałym ziarnem, co 10. piętro ręczne z bossem; stwory (Creatures). | Hieronim i inni, bossy 20-90 | wejście spod tawerny | bardzo duże (kilkanaście godzin) | **PRZEROBIĆ** ★ – generator zostaje „pod tawerną”; pasma 1-2 = lochy zamku i zakonu, pasmo 3 = podziemna rzeka i wodociąg; głębsze pasma albo skrócone, albo kopalnia w Górach jako drugie podziemie |
| S9 | Serce i zakończenia (Underground 2.1: Komnata Serca, Lord przy Sercu) | Na dole trzy zamki, Serce, wybór i zakończenia; Lord jako rywal albo sojusznik zależnie od wcześniejszych wyborów. | Lord, strażnik Serca | Komnata Serca | finał ~30 min | **PRZEROBIĆ** ★ – trzy końcówki z PLAN.md (woda dla wszystkich / układ z Lordem / źródło dla siebie) + zakon wstąp/odejdź; Serce przy źródle w Górach |
| S10 | Opinia w miasteczku (TownQuests) | Miara 0-100 (Obcy... Jeden z nas), odblokowuje zadania i powitania; spada za złamane słowo. | wszyscy mieszkańcy | miasto | system | **PRZENIEŚĆ** (też jako Opinia w Podgrodziu) |
| S11 | Kalendarz zdarzeń | Targ co 7 dni, prom co 3, fale promu 10/24/38/52, imieniny Lorda 33, Noc Kupały 42, dożynki 56, Wigilia. | – | – | system | **PRZENIEŚĆ** |
| S12 | Podróżni z promu (Podroznicy.js, PODROZNI.md) | System: kto przypływa, księga pokoi, renoma karczmy, 16 typów + 13 postaci z imionami (Goniec, medyk, kartograf, grajek, poborca...), tawerna jako scena intryg. | Tobiasz Goniec, Konstanty Mak, Teofil, Jędrek, Zenon Sita, Urszula, Erazm Łaska, Albin, Gaspar Lis, Augustyn, Tymon, Szczerba | tawerna, molo | duży system, ~12 zadań | **PRZENIEŚĆ** ★ – to „rozbitkowie i podróżni z czasem”; molo na Wybrzeżu |
| S13 | Mapa wyspy, Wyspy, Przystań jako ekran | Mapa świata wyspy, wyspy na morzu, ekran przystani. | – | cała wyspa | system | **ARCHIWUM** (nowy świat to 5 map; molo i mapa zostaną odtworzone w prostej formie) |
| S14 | Garnizon królewski (Garnizon.js) | Przychylność garnizonu 0-100, glejt na wrak, rotmistrz, kowal, patrol. | rotmistrz Bełza, Kłos | garnizon nad zatoką | system + K52, D26, D27 | **PRZEROBIĆ** – „straż Lorda” z kapitanem straży (MIESZKANCY.md); przychylność zostaje jako zaufanie straży |
| S15 | Homes: chata gracza, Spalona zagroda | Budowanie własnej chaty/domu; zagroda Ługów (D21). | Józek Łata, Marta | mapa 168 | – | **ARCHIWUM** (kieszeń Spalona zagroda w archiwum wg PLAN.md; budowanie własnej chaty i tak jest w farmie) |

---

# B. Wątki W1-W23

Każdy wątek: o czym, postacie, miejsca, rozmiar, decyzja. „kroki” = kroki w dzienniku; „rozdz.” = rozdziały.

### W1 Woda spod Kruczych Skał (kroki 11, rozdz. 1-7)
Skąd Kuba ma wodę, skoro studnia ledwo daje? Poszlaki (K8, K10, K12, K26, K38), nocą za Kubą do stawu, krata z krukiem na dnie studni, oranżeria nocą (pompa, Feliks przy furtce), na końcu Wielka cysterna zakonu pod miastem (piętro 30) i dzwon „cztery i dwa”.
Postacie: Kuba, Feliks, Tadek, strażnik oranżerii. Miejsca: studnia rynku, staw, dno studni, ogród i oranżeria dworu, podziemia, dzwonnica.
Decyzja: **PRZENIEŚĆ** ★ – Kuba zostaje uczciwy; winowajcą wodziarz + rządca + pokojówka (kradzież z jazu kanałem); oranżeria (W1) już jest w QUESTY.md; cysterna zakonu pod tawerną.

### W2 Kod dzwonu (kroki 11, rozdz. 1-8)
Ambroży dzwoni o dziwnych godzinach; liczba uderzeń to sygnały zakonu. Zapisywanie sygnałów, mini-gra dzwonu, ogród rycerzy, płyta, Archiwum zakonu z Księgą sygnałów i kronikami (sprzedać Baltazarowi 300 G / zostawić / oddać), „Jedno pytanie” u pustelni, alarm „trzy i jeden” w akcie III.
Postacie: Ambroży (dzwonnik), Baltazar, Kleofas. Miejsca: dzwonnica, rynek, ogród rycerzy, Archiwum (Map119).
Decyzja: **PRZENIEŚĆ** ★ – dzwonnica przy kaplicy w Miasteczku; Archiwum = pierwsza komora lochów (z pieczęciami zakonu); „trzy i jeden” zostaje do aktu III.

### W3 Pieśń o Kruczych Skałach (kroki 7, rozdz. 1-8)
Melii śni się siódma ballada. Sześć zwrotek rozsianych: struna (K22), dzwonnik, kobieta z obozu, kamień w ogrodzie, kronika dworu, pijak Ozzy; ostatnia opisuje drogę w dół. Noc Kupały: porwanie Melii (prawdziwa walka z bandytami).
Postacie: Melia, Ozzy, Grum, Ambroży, Ludmiła. Miejsca: tawerna, dzwonnica, obóz, dwór, ogród.
Decyzja: **PRZENIEŚĆ** ★ – zwrotki rozsiane po 3 mapach (tawerna, kaplica, dwór); ostatnia wskazuje drogę do zamurowanej piwnicy; MIESZKANCY.md ma to już zapisane („pieśni zawierają wskazówki do lochów”).

### W4 Krew kasztelana (kroki 6, rozdz. 1-8)
Pół klucza nad barem, druga połowa zakopana, Tadek łączy, klucz otwiera starą kratę zakonu z krukiem w piwnicy tawerny. Rozdz. 6-8: ród Kowali, konfrontacja z Borgarem, zamknięta tawerna, noc w piwnicy.
Postacie: Borgar, Tadek, Lord. Miejsca: bar, podwórze, kuźnia, piwnica tawerny, pustelnia.
Decyzja: **PRZENIEŚĆ** ★ – to jest „zejście do lochów” z aktu II; klucz od karczmarza do zamurowanej piwnicy, kowal dorabia klucz.

### W5 Towary z kontynentu (kroki 10, rozdz. 1-?, Kantor.js, mapa piwnicy kantoru)
Baltazar Vey (kantor) przywozi i wywozi towary dla kogoś. Poszlaki, kurier w kapturze, noc promu, obóz przemytników, piwnica kantoru; wynik wpływa na akt III i W9.
Postacie: Baltazar, Feliks, Kłos, Grum, kurier. Miejsca: kantor, tylne drzwi, piwnica kantoru, Skraj lasu.
Decyzja: **PRZENIEŚĆ** ★ – lichwiarz, który skupuje długi i działa dla rządcy; przemyt przez Wybrzeże; piwnica kantoru jako wnętrze Miasteczka.

### W6 Ludzie z promu (kroki 7, rozdz. 1-7)
Obóz pod murem: Ludmiła z Elą czeka na męża Marka, Rafał ukrywa się przed kapralem (dezerter). Zaufanie obozu, list gończy na tablicy, głosowanie w ratuszu, druga fala, Wigilia, Marek.
Postacie: Ludmiła, Ela, Rafał, Marek, Szymek, kapral Wit. Miejsca: obóz, tablica w tawernie, ratusz, jaskinia.
Decyzja: **PRZEROBIĆ** ★ – obóz = rozbitkowie z wraku w Podgrodziu (przytułek siostry Klary); wątek „kto zostaje, kogo wydamy” zostaje; Rafał pasuje do „dezerter”.

### W7 Dwór z kamieni twierdzy (kroki 8, rozdz. 1-8; Dwor.js, 3 wnętrza)
Lord Zaleski zna tylko bajkę o kamieniach twierdzy; Feliks żyje podwójnie (nocą kanałem do włazu, listy do wroga). Hol z krukami, kronika rodu, gabinet nocą, prawda dla Lorda, do kogo najpierw.
Postacie: Lord, Feliks, służba. Miejsca: dwór (hol, biblioteka, gabinet), ogród.
Decyzja: **PRZEROBIĆ** ★ – wnętrza od nowa (drewno); Feliks -> rządca; „księga wody”, fałszerstwo i sejf zamiast listów; Lord pod presją.

### W8 Żelazna Pięść (kroki 9, rozdz. 1-7; Map013, 014, 120)
Grum pyta o góry, bo ktoś mu płaci. Wyprawa o świcie, kamieniołom, obóz kopaczy w jaskini, tunel, list od mocodawców, Osada Milczących, wybór Gruma. Rozdz. 7: przy drzwiach tawerny (akt III).
Postacie: Grum, Marek, kopacze. Miejsca: tawerna, Góry, kamieniołom, jaskinia.
Decyzja: **PRZEROBIĆ** ★ – Góry i kopalnia jako druga droga do Serca; rozdz. 5-6 w Osadzie Milczących -> ARCHIWUM (Osada w archiwum), zastąpić zawałem/uwięzionymi górnikami.

### W9 Serce Twierdzy (oś) (1 krok zbiorczy; Warstwa Prawdy)
Karty zapisane moim pismem w Warstwie Prawdy: małe prawdy o mieszkańcach. Powiedzieć czy przemilczeć – zmienia, jak patrzą. Rozdz. 3 „Rywal w ruinach” (Rywal.js): jedna drużyna z zewnątrz schodzi po Serce przed bohaterem.
Postacie: Grum, ludzie Lorda, ludzie Baltazara, kopacze Czarnych Oczu. Miejsca: podziemia, miasto, dwór, dom dziadka.
Decyzja: **PRZEROBIĆ** ★ – Rywal w ruinach (MIESZKANCY/QUESTY: „ktoś jeszcze szuka w lochach”) zostaje; Warstwa Prawdy tylko jeśli podziemia zostają głębokie.

### W10 List do matki (kroki 6, Przystan.js)
Janek namawia do listu, list promem (3 G) albo kutrem Rocha; wieść wraca: wieś spalona, matka z taborem na północ, ostatecznie ślad ojca (pas na obcym żołnierzu, jeńcy do kopalni soli). Ostrzeżenie przed białym okiem.
Postacie: Janek, przewoźnik, Roch, celnik. Miejsca: tawerna, molo, kuter.
Decyzja: **PRZENIEŚĆ** ★ – molo na Wybrzeżu; rybak Jan; wprost „listy od matki”.

### W11 Soczewka (kroki 7, Latarnia.js)
Baltazar płaci za „szkiełko z latarni”; soczewka to „Oko Strażnicy” z kryształu Pierwszych; napad nocą.
Postacie: Bazyli (latarnik), Baltazar. Miejsca: kantor, latarnia, pustelnia.
Decyzja: **PRZEROBIĆ** – latarnia (jeśli przylądek na Wybrzeżu) albo wieża zakonu przy źródle; soczewka jako „klucz” do Serca.

### W12 Rozbitek (kroki 3, Wrak.js)
„Eryk Sowa” rysuje portrety za piwo, mówi, że handlował suknem; palce czarne od atramentu; naprawdę Ansgar Wiel.
Postacie: Eryk Sowa. Miejsca: tawerna, rynek, Podgrodzie, wrak.
Decyzja: **PRZENIEŚĆ** ★ – rozbitek z wraku; „statek nie rozbił się przypadkiem” (QUESTY, tajemnice).

### W13 Skrzydlata Straż (kroki 7, Orzel.js)
Wychowywanie białego orła z jaja z Orlej Grani; zakon miał takie orły; lot nad mapami.
Postacie: Kleofas, dziadek, Lord. Miejsca: dom, Orla Grań, pustelnia, dwór.
Decyzja: **PRZEROBIĆ** – gniazdo w Górach (Orla Grań w archiwum); orzeł jako towarzysz i zwiad; lot przez krawędzie map już jest.

### W14 Poselstwo (kroki 7, Poselstwo.js)
Trzecia fala: „pątnik” Albin (naprawdę zwiadowca Czarnych Oczu), potem poseł Korony z listem wartym więcej niż wyspa; intrygi na piętrze II tawerny.
Postacie: Albin/Ragnar Holm, poseł Wierzbięta, gwardzista Ostap, Lord, Feliks, Borgar. Miejsca: tawerna (pokój 8, Apartament Złoty), dzwonnica, mury, dwór.
Decyzja: **PRZEROBIĆ** – późniejszy akt (QUESTY: „wysłannicy jednej ze stron wojny u Lorda”); Posiadłość + tawerna.

### W15 Święte kości (kroki 7, SwieteKosci.js)
Gaspar Lis sprzedaje „kości świętych” i odłamki Serca; przypływa brat Augustyn, który zna towar. Kaplica, kantor, przystań.
Postacie: Gaspar Lis, brat Augustyn, Baltazar, Kleofas. Miejsca: rynek, pokój 12, pustelnia, Podgrodzie, kantor.
Decyzja: **PRZENIEŚĆ** ★ – ksiądz ukrywa relikwię, która jest kluczem zakonu (QUESTY.md, intrygi).

### W16 Dezerter (kroki 4, Dezerter.js)
Chłopak „Tomek” podskakuje na bęben; ktoś płynie jego śladem (łowczyni nagród Szczerba, która bierze żywych).
Postacie: Tymon Wrzos, Szczerba, rotmistrz, Baltazar, Roch. Miejsca: pokój 5, rynek, obóz, garnizon, przystań.
Decyzja: **PRZENIEŚĆ** – jeden z rozbitków (QUESTY.md „Dezerter”); „dwaj dezerterzy z przeciwnych stron w jednej wsi” w intrygach; garnizon -> straż Lorda.

### W17 Jarmark Kruczogrodu (kroki 9, dni 47-53)
Kramy, konkurs piwny, turniej w kości, trupa gra „Legendę o Kruku i Wilku”, kradzież Srebrnego Kruka, śledztwo i pościg po dachach.
Postacie: sołtys Bronisław, trupa, kupcy. Miejsca: ratusz, rynek, Sukiennice, tawerna, dachy.
Decyzja: **PRZENIEŚĆ** – Miasteczko; pościg po dachach wymaga nowego rzędu budynków (zachowujemy jako zaplanowaną część).

### W18 Wesele w Złotym Kuflu (kroki 6, dni 19-22)
Woźnica Wojciech i szwaczka Dorota biorą ślub w tawernie: jedzenie, muzyka, ozdoby, sadzanie gości, taniec, ksiądz.
Postacie: Wojciech, Dorota, Borgar, Kleofas. Miejsca: tawerna, rynek, piekarnia, kapliczka.
Decyzja: **PRZENIEŚĆ** – prawie cała w tawernie; Dorota i Kleofas są w nowym spisie mieszkańców.

### W19 Sygnały z młyna (kroki 5, dni od 24)
Skrzydła wiatraka zmieniają ułożenie po zmroku jak semafor do łodzi z kontynentu. Odczytaj kod, ustaw fałszywy sygnał, odpowiedz łodzi latarnią.
Postacie: młynarz, pomocnik, wypatrywacz, szyper. Miejsca: wiatrak, tawerna, Archiwum, przystań.
Decyzja: **PRZENIEŚĆ** ★ – dokładnie „nowy młynarz = szpieg wojny”; stary Walenty pierwszym tropem.

### W20 Kruczy listonosz (kroki 5, 5 tygodni, Map214 kruczarnia)
Mistrz Gawron i uczeń Wicek; bohater roznosi listy; Cyryl Atrament (pisarz) zdejmuje pieczęcie i zalewa na nowo; człowiek w kapturze.
Miejsca: kruczarnia, miasto, tawerna.
Decyzja: **PRZENIEŚĆ** ★ – wprost w PLAN.md; dziadek jako dawny kruczarz.

### W21 Gorączka w przytułku (kroki 5, dni 30-38)
W obozie gorączka; ktoś zatruwa wodę (winny Wawrzyn); ratunek: wywary, nocne czuwanie, studnia.
Postacie: siostra Stefa, babka Jadwiga, Kleofas, Hanka, Kuba, Tadek, Ignac, Wawrzyn. Miejsca: przytułek, rynek, czerpalnia, garbarnia, ratusz.
Decyzja: **PRZENIEŚĆ** ★ – Podgrodzie: przytułek (siostra Klara), znachorka, picie z koryta; przyczyna: zła woda.

### W22 Majstersztyk (kroki 5, dni 12-50)
Cech przyjmuje tylko poręczonych; cztery rangi; rywal z kontynentu Ludwik; egzamin w dzień targowy.
Postacie: Ostap Lemiesz, Ludwik Zaręba, Jaś, Tadek, Ignac, Leon. Miejsca: cech (wnętrze Map215), kuźnia, garbarnia, warsztat.
Decyzja: **PRZENIEŚĆ** – Miasteczko; cech już w MIESZKANCY.

### W23 Coś z głębin (kroki 7, Morze.js, POTWORY_Z_MORZA.md)
Nocą z morza wychodzą szkielety utopionych żołnierzy, kraby, kraken; mieszkańcy nie giną (są ranni); dzwon o zmierzchu odsuwa głęboką wodę; rośnie liczba i ciągnie ich Serce.
Postacie: Roch, Ozzy, Melia, Ambroży. Miejsca: przystań, brzegi, tawerna, dzwonnica, latarnia, kaplica.
Decyzja: **PRZENIEŚĆ** ★ – Wybrzeże (jest w PLAN.md); „czerwona woda” i burza zostają.

---

# C. Zadania miejskie K1-K73

Krótkie zadania z dawcą w mieście (TownQuests_Data.js). Gdzie „czeka” – nie zbudowane w starej grze.
Nazwa wielkości: K = zwykle 1-3 kroki, 10-20 minut gry.

| Kod | Nazwa | O czym | NPC | Miejsca | Decyzja |
|---|---|---|---|---|---|
| K1 | Węgiel do paleniska | przed 9:00 przynieś węgiel, Tadek naprawi zużyte narzędzie | Tadek | kuźnia | **PRZENIEŚĆ** (węglarz z Podgrodzia dostarcza) |
| K2 | Woda do hartowania | 2 porcje własnej wody do kuźni za 25 G | Tadek | kuźnia | **PRZENIEŚĆ** ★ (woda to teraz towar) |
| K3 | Podkowa w słońcu | błysk na drodze 11-14, podkowa | Tadek | droga | **PRZENIEŚĆ** (droga Podgrodzie-Miasteczko) |
| K4 | Chleb przed świtem | drewno pod okienko piekarni 3:30-5:00 | Hanka/piekarz | piekarnia | **PRZENIEŚĆ** |
| K5 | Bochenki do dziewiątej | codzienne rozwożenie chleba | Hanka, Ambroży, Wit, sołtys | miasto | **PRZENIEŚĆ** |
| K6 | Jęczmień do żaren | dostawa zboża do młyna (lato/jesień) | młynarz | młyn | **PRZENIEŚĆ** (nowy młynarz; patrz W19) |
| K7 | Myszy w mące | (czeka) kot i wnyki w piekarni | piekarz | piekarnia | **ARCHIWUM** (niezbudowane; do odświeżenia) |
| K8 | Pęknięta beczka | poszlaka W1: czyja beczka cieknie | Kuba | rynek | **PRZENIEŚĆ** ★ |
| K9 | Kłótnia w kolejce | rozsądzanie sporu w kolejce do studni | Kuba, Ignac | studnia | **PRZENIEŚĆ** ★ (kolejka do studni wprost z PLAN.md) |
| K10 | Smak wody | kadź garbarza; woda pitna z różnych źródeł | Ignac | garbarnia | **PRZENIEŚĆ** ★ |
| K11 | Myto przy bramie | zapłać 2 G albo 6 polan | Wit | brama | **PRZEROBIĆ** (myto przy wjeździe do Posiadłości/na most) |
| K12 | Łój do latarni | surowe mięso dzika; poszlaka W1 | latarnik/straż | miasto | **PRZEROBIĆ** (latarnie na rynku) |
| K13 | Sznur dzwonu | dostarcz sznur przed południem | Ambroży | dzwonnica | **PRZENIEŚĆ** |
| K14 | Dzwonnik ma chore kolana | mini-gra dzwonu (6 uderzeń) | Ambroży | dzwonnica | **PRZENIEŚĆ** (potrzebne do W2) |
| K15 | Ostrożnie, kruche | zanieś skrzynię (wolniejszy chód) do wozu | woźnica Wojciech, Wit | brama/wóz | **PRZENIEŚĆ** |
| K16 | Grzyby po dwakroć | handel w dzień po promie, podwójna cena | Baltazar | kantor | **PRZENIEŚĆ** |
| K17 | Obwieszczenie o racjach | wywieś obwieszczenie na 4 ścianach | sołtys | miasto | **PRZEROBIĆ** ★ (racje wody) |
| K18 | Kto ruszył stóg? | (czeka) ślady przy stogach | sąsiedzi | Podgrodzie | **ARCHIWUM** |
| K19 | Spis obozu | spisz trzy osoby (Rafał prosi, żeby go nie liczyć) | Ludmiła, Ela, Rafał | obóz | **PRZEROBIĆ** (spis rozbitków w Podgrodziu) |
| K20 | Pierwsza skóra | skóra do garbarni, premia ścięgna | Ignac | garbarnia | **PRZENIEŚĆ** |
| K21 | Garbnik z lasu | kora do garbarza | Ignac | las | **PRZENIEŚĆ** (las Lorda: po kryjomu) |
| K22 | Struna dla Melii | dwie ścięgna, struna, pierwsza zwrotka | Melia, Ignac | tawerna | **PRZENIEŚĆ** ★ (wchodzi do W3) |
| K23 | Chowany na rynku | (czeka) zabawa dzieci | dzieci | rynek | **ARCHIWUM** (można dać „Wróblom”) |
| K24 | Latawiec na dzwonnicy | (czeka) strzał procą | dzieci | dzwonnica | **ARCHIWUM** |
| K25 | Proca dla Bronka | (czeka) puszka na murze | Bronek | mur | **ARCHIWUM** |
| K26 | Pierścionek w studni | wyłów pierścionek 2x lina; krata kruka | Zosia | studnia | **PRZENIEŚĆ** ★ |
| K27 | Konik dla Eli | drewniany konik albo kołysanka Melii | Ela, Ludmiła, Melia | obóz, tawerna | **PRZENIEŚĆ** |
| K28 | Kocioł dla obozu | 2 porcje zupy/gulaszu | Ludmiła | obóz | **PRZENIEŚĆ** (przytułek) |
| K29 | Rana Rafała | opatrunek, nie przy kapralu | Rafał | obóz | **PRZENIEŚĆ** |
| K30 | Koszyki dla dworu | dowóz koszy w dzień targowy | Feliks (rządca) | dwór | **PRZENIEŚĆ** |
| K31 | Imieniny Lorda | prezent: 40 G albo na dług | Feliks, Lord | dwór | **PRZENIEŚĆ** |
| K32 | List od dziadka | dni 5-20; Lord pyta o kamienie z krukiem | dziadek, Lord | dwór | **PRZEROBIĆ** (dziadek nie wyjeżdża; list = sprawa zakonu) |
| K33 | Czapka Ozzy'ego | strzał procą przez kratę ogrodu rycerzy | Ozzy | ogród rycerzy | **PRZEROBIĆ** (ogród rycerzy nie istnieje; kaplica/cmentarz) |
| K34 | Ogień w stogu | (czeka) burza | - | pole | **ARCHIWUM** |
| K35 | Śnieg na dachu | (czeka) zaspy na piekarni | piekarz | miasto | **ARCHIWUM** |
| K36 | Kot na dachu piekarni | (czeka) noszenie kota | piekarz | miasto | **ARCHIWUM** |
| K37 | Sakiewka Lorda | pościg za złodziejem w dzień targowy | Feliks, Szymek | rynek | **PRZENIEŚĆ** |
| K38 | Nocna warta | posterunek, śledzenie Kuby nocą | Wit, Kuba | brama | **PRZEROBIĆ** ★ (śledzimy wodziarza) |
| K39 | Kości z targu | obciążona kość Lucjana, demaskowanie | Bartek, Lucjan | tawerna, targ | **PRZENIEŚĆ** ★ (hazard + Ozzy) |
| K40 | Woda na pranie | 2 porcje deszczówki (zabiera wodę) | Marta (praczka) | Podgrodzie | **PRZENIEŚĆ** ★ |
| K41 | Zioła dla babki Jadwigi | 3 krwawnik + 2 pokrzywa na opatrunki | Jadwiga | Podgrodzie | **PRZENIEŚĆ** (znachorka) |
| K42 | Kram Józka | deski i gwoździe, 2 liny | Józek | Podgrodzie | **PRZENIEŚĆ** |
| K43 | Drewno na ognisko | 6 polan; opowieść Darina o Sercu | Darin | Podgrodzie | **PRZENIEŚĆ** (drewno z Wybrzeża) |
| K44 | Lina dla Zbycha | 2 liny za węgiel | Zbych Smolarz | Podgrodzie | **PRZENIEŚĆ** |
| K45 | Włókno na pętle | włókno za mięso, rada o sidłach | Rysiek | Podgrodzie | **PRZENIEŚĆ** |
| K46 | Suchar dla Franka | chleb za tajemnicę „Kuba nocą z beczkami” | Franek | Podgrodzie | **PRZENIEŚĆ** ★ (trop do wodziarza) |
| K47 | Pierwszy połów | 2 śledzie -> wędzona ryba, rada rybacka | rybak Jan | Wybrzeże | **PRZENIEŚĆ** |
| K48 | Sieci po sztormie | włókno + lina za 20 G | rybak Jan | Wybrzeże | **PRZENIEŚĆ** |
| K49 | Tran dla latarni | tran + drewno, latarnia otwarta nocą | Bazyli | przylądek | **ARCHIWUM** (wraca, jeśli stanie latarnia) |
| K50 | Atrament dla pustelnika | szyszki, żelazo, deszczówka za miód | Kleofas (pustelnik) | pustelnia | **PRZEROBIĆ** (pustelnik przy źródle w Górach) |
| K51 | Kruk z masztu | świt, kruk z wraku do pustelni i Urwiska | Roch | wrak, urwisko | **PRZEROBIĆ** (maszt wraku na Wybrzeżu; kruk -> D24) |
| K52 | Drewno dla garnizonu | 10 drewna + 4 węgla, skup wojskowy | Kłos | garnizon | **PRZEROBIĆ** (kapitan straży Lorda) |
| K53 | Rynny zakonu | rynny na cysternie, deszcz napełnia | – | cysterna | **PRZEROBIĆ** ★ (cysterna pod tawerną + deszczówka) |
| K54 | Motyl z oczkami | złap pawika siatką | Ela | łąka | **PRZENIEŚĆ** |
| K55 | Świece dla dzwonnika | świece dla Ambrożego | Ambroży | dzwonnica | **PRZENIEŚĆ** |
| K56 | Ogródki Podgrodzia | pomóż podlać ogródki | Jadwiga | Podgrodzie | **PRZENIEŚĆ** ★ |
| K57 | Studnia sąsiada | napraw/wykop studnię | dziadek Stach | Podgrodzie | **PRZENIEŚĆ** ★ („studnia w korycie” z QUESTY.md) |
| K58 | Sad Ługów | pomoc w sadzie | Marta Ługowa | Podgrodzie | **PRZENIEŚĆ** |
| K59 | Nora pod korzeniami | ogłoszenie łowczego, znajdź norę | łowczy Bogdan | las | **PRZENIEŚĆ** |
| K60 | Sól dla jeleni | wyłóż lizawkę z soli | łowczy Bogdan | las | **PRZENIEŚĆ** ★ (sól to towar) |
| K61 | Zawody strzeleckie | strzelnica | kwatermistrz Kłos | garnizon | **PRZEROBIĆ** (strzelnica straży Lorda) |
| K62 | Krasula i kury Ługów | zgubiona krowa, kury | Marta | Podgrodzie | **PRZENIEŚĆ** (jak „wdowa z kozą”) |
| K63 | Węgiel dla kowala | zamówienie węgla | Tadek | kuźnia | **PRZENIEŚĆ** |
| K64 | Zabłąkana owca | owca pasterza | Wawrzyn Owczarz | łąka | **PRZENIEŚĆ** |
| K65 | Zgubiony juk | zgubiony bagaż handlarza | Szymon Juczny | droga | **PRZENIEŚĆ** |
| K66 | Nocny patrol | patrol z rotmistrzem | Bełza | droga | **PRZEROBIĆ** (kapitan straży Lorda) |
| K67 | Trzy kruki przy drogach | znaki zakonu przy drogach | Ambroży | drogi | **PRZEROBIĆ** ★ (znaki zakonu na 5 mapach) |
| K68 | Zapiski strażnic | zbierz zapiski wież | Kleofas | wieże | **PRZEROBIĆ** ★ |
| K69 | Grzędy Straży | orle grzędy na grani | Bazyli | Orla Grań | **ARCHIWUM** (Orla Grań w archiwum) |
| K70 | Kawałki wraku | zbieraj szczątki statku | Eryk Sowa | wrak | **PRZENIEŚĆ** ★ |
| K71 | Listy z lądu | roznieś listy z promu | Tobiasz Goniec | miasto | **PRZENIEŚĆ** ★ (poczta, listy matki) |
| K72 | Poczta z lądu | kurier z lądu | Goniec | tawerna | **PRZENIEŚĆ** |
| K73 | Nocne kroki | kroki na piętrze tawerny, podsłuch | goście | tawerna | **PRZENIEŚĆ** |

---

# D. Długie zadania D1-D48

Zwykle 3-8 kroków, 0,5-1,5 h gry każde.

| Kod | Nazwa | O czym | NPC | Miejsca | Decyzja |
|---|---|---|---|---|---|
| D1 | Buty od szewca | 3 skóry, ćwieki, miara, buty łowcy albo podkute | szewc, Tadek | miasto | **PRZENIEŚĆ** |
| D2 | Mąka bez młyna | (czeka) wnętrze młyna, kierat | młynarz | młyn | **PRZEROBIĆ** (połączyć z W19, młyn od środka) |
| D3 | Ręka kowala | podkowy i narzędzia, 60 G albo zostaw | Tadek, Wit, Ignac | kuźnia | **PRZENIEŚĆ** |
| D4 | Złodziej o świcie | zasadzka, Ela, trzy wyjścia | Ela | obóz | **PRZENIEŚĆ** |
| D5 | Wataha pod bramą | tropy, 2 wilki, 80 G | Wit | droga, las | **PRZENIEŚĆ** |
| D6 | Siłacz z targu | treningi z Grumem, turniej siłowania w tawernie | Tadek, Grum, Borgar, Baltazar | tawerna | **PRZENIEŚĆ** |
| D7 | Serce kowala | (czeka) róża z ogrodu dworu, wyznanie, wesele | Tadek | dwór | **PRZEROBIĆ** (romans kowala i ogrodniczki/szwaczki) |
| D8 | Wielki targ | (czeka) targowanie, stragan gracza | – | rynek | **ARCHIWUM** (wejdzie do W17) |
| D9 | Spis beczek | (czeka) spis beczek z wodą w domach | gospodarze | domy | **PRZEROBIĆ** ★ (spis beczek i księga wody) |
| D10 | Gorączka Eli | wywar + deszczówka, noc, rano zdrowa | Ela, Baltazar | obóz | **PRZENIEŚĆ** ★ |
| D11 | Ognie na murach | zalany kosz, mokre ślady do kantoru | Wit, Baltazar | brama | **PRZEROBIĆ** (palisada Podgrodzia) |
| D12 | Ślady kota | (czeka) | - | - | **ARCHIWUM** |
| D13 | Zakład Ozzy'ego | pogoda na jutro, zakład z Grumem | Ozzy, Grum | tawerna | **PRZENIEŚĆ** ★ (deszcz ważny) |
| D14 | Zboże na wojnę | oddaj / łapówka / schowaj | Wit | brama | **PRZEROBIĆ** (wojsko żąda zapasów od Lorda) |
| D15 | Dzieci nocą | (czeka) dzieci wymykają się nocą | dzieci | Podgrodzie | **PRZEROBIĆ** („Wróble” – banda dzieciaków) |
| D16 | Uczeń dzwonnika | 4 lekcje dzwonienia od Opinii 40 | Ambroży | dzwonnica | **PRZENIEŚĆ** |
| D17 | Petycja do Lorda | 5 z 6 podpisów, Lord obniża podatek | Tadek, Hanka, Kuba, Ignac, Ambroży, Baltazar | miasto, dwór | **PRZEROBIĆ** ★ (petycja o wodę/jaz) |
| D18 | Płaszcze przed zimą | obóz albo Feliks dla straży | Ludmiła, Feliks | obóz | **PRZENIEŚĆ** |
| D19 | Kość z Kruczych Skał | (czeka) | Nieznajomy | ogród | **ARCHIWUM** |
| D20 | Kuter na pochylni | wrak z plaży na pochylnię, smoła, żagiel | Janek, Roch, Zbych, Marta | przystań, plaża | **PRZENIEŚĆ** |
| D21 | Spalona zagroda | akt własności, zgliszcza, 350 G | Józek, Marta, sołtys | mapa 168 | **ARCHIWUM** (kieszeń w archiwum) |
| D22 | Księga mgieł | wizja w soczewce, mgła morska | Bazyli | latarnia | **ARCHIWUM** (wraca z latarnią) |
| D23 | Zaszyfrowane kroniki | sześć kart kronik do rozszyfrowania | Kleofas | skryptorium | **PRZEROBIĆ** ★ (szyfr zakonu) |
| D24 | Oswojony kruk | 3 karmienia, kruk na ramieniu, obrączka | dziadek | Urwisko, działka | **PRZENIEŚĆ** (łączy W20, dziadek kruczarz) |
| D25 | Mapa z wraku | łódź Janka na wrak, glejt, mapa | Roch, Janek | wrak | **PRZEROBIĆ** ★ (wrak na Wybrzeżu bez glejtu) |
| D26 | Lista poborowa | werbownik namawia; ostrzeż, namów | werbownik | rynek | **PRZEROBIĆ** (pobór do wojska Lorda) |
| D27 | Zboże dla obozu | worki ze spichlerza, noc w dybach | Ludmiła, Kłos | spichlerz | **PRZEROBIĆ** (przemyt zboża dla Podgrodzia) |
| D28 | Zapas zakonu | stara cysterna z zasuwą, topielce | – | cysterna | **PRZEROBIĆ** ★ (cysterna pod tawerną) |
| D29 | Jajo z grani | jajo orła z Orlej Grani | Bazyli | Orla Grań | **PRZEROBIĆ** (gniazdo w Górach, W13) |
| D30 | Zioła Jagny | zioła rzadkie | Jagna | Podgrodzie | **PRZENIEŚĆ** |
| D31 | Skarby wysypiska | grzebanie w wysypisku | Józek Łata | Podgrodzie | **PRZENIEŚĆ** (paser/kramarz) |
| D32 | Gajowy i kłusownik | las, kłusownik | gajowy Gniewko Bór | las | **PRZENIEŚĆ** ★ (las Lorda, kłusownik) |
| D33 | Gawra pod granią | niedźwiedź/obóz łowców | – | Góry | **PRZENIEŚĆ** |
| D34 | Jaskinia pod zatoczką | celnik, przemytnicy | Sambor Kwit | zatoczka | **PRZEROBIĆ** (jaskinia przemytników na Wybrzeżu) |
| D35 | Szyb pod Orlą Granią | obóz kopaczy, szyb | – | Góry | **PRZENIEŚĆ** ★ (kopalnia) |
| D36 | Cień Strażnika | zjawa strażnika zakonu | – | krąg, grań | **PRZEROBIĆ** ★ (lochy/Góry) |
| D37 | Groby z krukiem | groby strażników | Ambroży | cmentarz | **PRZENIEŚĆ** ★ (grabarz; krypta) |
| D38 | Godzina milczenia | cisza w gaju, próba | – | gaj | **PRZEROBIĆ** ★ (próba cierpliwości zakonu) |
| D39 | Gorączka z promu | medyk Konstanty, zioła, czuwanie | Konstanty Mak, Gerwazy | tawerna | **PRZENIEŚĆ** |
| D40 | Mapa dla kartografa | pięć szkiców z punktów widokowych | Teofil Cyrkiel | wyspa | **PRZEROBIĆ** (widoki na 5 mapach) |
| D41 | Pieśń z lądu | wojskowa wersja pieśni, scena Melii | Jędrek Dudarz, Melia | tawerna | **PRZENIEŚĆ** |
| D42 | Zboże w suszę | kupiec skupuje zboże od biednych | Zenon Sita, Hanka | rynek, tawerna | **PRZENIEŚĆ** ★ |
| D43 | Matka szuka syna | syn w wojsku królewskim | Urszula | garnizon, przystań | **PRZEROBIĆ** (straż Lorda) |
| D44 | Podatek wojenny | poborca liczy podatek, kto chodzi do dworu | Erazm Łaska | tawerna, dwór | **PRZENIEŚĆ** |
| D45 | Gość spod trójki | tajemniczy lokator, stuk w kominie | gość | tawerna, piwnica | **PRZENIEŚĆ** |
| D46 | Skradziona szkatułka | szkatułka wdowy, śledztwo | Ksenia Żuraw | tawerna | **PRZENIEŚĆ** |
| D47 | Wolna Kompania | czterech najemników demoluje tawernę | Hubert Szary i inni | tawerna | **PRZENIEŚĆ** |
| D48 | Mapa Wyspy Kruka | siedem miejsc, gdzie „linie murów się schodzą” | Teofil | wyspa | **PRZEROBIĆ** ★ (śladem zakonu: wodociąg) |

---

# D2. Pozostałe linie fabularne (wtyczki, które siedzą pod kodami W/K/D)

| Kod | Co | O czym | NPC | Miejsca | Rozmiar | Decyzja |
|---|---|---|---|---|---|---|
| L1 | Zakon: paczka D (Zakon.js) | Wieże zakonu, kapliczki, kopce, krąg i komora, orle grzędy, cmentarz i Hieronim, gaj Milczących, karty warty; K67-K70, D36-D38. | Ambroży, Kleofas, Bazyli, Hieronim | całe wyspa | ~7 zadań | **PRZEROBIĆ** ★ – lore zakonu rozłożone po 5 mapach (znaki, wieże, krypta) |
| L2 | Kasztelan (W4 rozdz. 6-8) | patrz W4 | Borgar | tawerna, piwnica | 3 rozdz. | **PRZENIEŚĆ** ★ |
| L3 | Kantor (W5) | patrz W5 | Baltazar | kantor, piwnica | 10 kroków | **PRZENIEŚĆ** ★ |
| L4 | Rywal w ruinach (W9 rozdz. 3) | jedna drużyna schodzi po Serce przed bohaterem (Grum / ludzie Lorda / Baltazara / Czarne Oczy) | Grum, dowódca kopaczy | lochy | 1 rozdz. + walki | **PRZEROBIĆ** ★ |
| L5 | Pustelnia (Pustelnia.js) | Kleofas na klifie: atrament, kroniki, „Jedno pytanie” w Noc Pytania | Kleofas | pustelnia | K50, D23, W2 rozdz. 7 | **PRZEROBIĆ** – pustelnik przy źródle w Górach |
| L6 | Cysterna (Cysterna.js) | stara cysterna zakonu, zasuwa, topielce, rynny | – | podziemia | D28, K53 | **PRZEROBIĆ** ★ |
| L7 | Latarnia (Latarnia.js) | latarnik Bazyli, księga mgieł, soczewka | Bazyli | przylądek | K49, D22, W11 | **ARCHIWUM** (wraca z przylądkiem) |
| L8 | Kruk (Kruk.js) | oswajanie kruka, listy, błyskotki, zwiad | – | Urwisko, działka | K51, D24 | **PRZENIEŚĆ** |
| L9 | Orzeł (Orzel.js) | biały orzeł z Orlej Grani, lot | – | Orla Grań | W13, D29 | **PRZEROBIĆ** |
| L10 | Wrak (Wrak.js) | wrak kutra, glejt, mapa, rozbitek | Roch, Eryk | wrak | D25, W12, K70 | **PRZEROBIĆ** ★ |
| L11 | Przystań (Przystan.js) | molo, rybak Janek, Roch, listy | Janek, Roch | molo | W10, K47, K48, D20 | **PRZENIEŚĆ** |
| L12 | Osada Milczących (Map120-124) | cztery wnętrza chat; W8 rozdz. 5-6 | Milczący | łąka | 4 wnętrza | **ARCHIWUM** (PLAN.md) |
| L13 | Paczka A „Woda i zasoby” (Zasoby.js) | studnia sąsiada, ogródki, sad, wysypisko, zioła; K55-K58, D30-D31 | Jadwiga, Marta, Jagna | Podgrodzie | 6 zadań | **PRZENIEŚĆ** ★ |
| L14 | Paczka B „Łowy” (Lowy.js) | nora, lizawka, strzelnica, gajowy, gawra; K59-K62, D32-D33 | Bogdan, Gniewko Bór | las, Góry | 6 zadań | **PRZENIEŚĆ** |
| L15 | Paczka C „Ludzie” (Ludzie.js) | kowal, pasterz, handlarz, patrol, jaskinia, szyb; K63-K66, D34-D35 | Wawrzyn, Szymon, Bełza | drogi | 6 zadań | **PRZENIEŚĆ** |
| L16 | Starcia: zwierzęta kontra ludzie (Starcia.js) | wilki kontra bandyci, obozy | – | las | system | **PRZENIEŚĆ** |
| L17 | Homes: chata gracza (buildable) | własny dom na ziemi | – | wszędzie | system | **PRZENIEŚĆ** |

---

# E. Tawerna: życie, zlecenia, stali bywalcy

| Kod | Co | O czym | NPC | Miejsca | Rozmiar | Decyzja |
|---|---|---|---|---|---|---|
| T1 | Zmiana w tawernie (TavernShift) | Cztery mini-gry (obsługa, kuchnia...), płaca i napiwki; Borgar ocenia. | Borgar | tawerna | 4 godziny na dzień | **PRZENIEŚĆ** ★ – rdzeń aktu II |
| T2 | Życie tawerny (TavernLife) | Goście na krzesłach (23), pokoje i łaźnia, posiłki, pieśni Melii, sława. | goście | tawerna | system | **PRZENIEŚĆ** ★ |
| T3 | Tablica zleceń (QuestBoard) | Losowane ogłoszenia: dostawy, polowania, listy gończe, ogłoszenia z map; „bez końca”. | Borgar, zleceniodawcy | tawerna | ciągłe | **PRZENIEŚĆ** ★ |
| T4 | Stali bywalcy: Melia, Ozzy, Grum (TavernLife_Regulars) | Rozmowy z plotkami z prawdziwego stanu gry, zaufanie 0-100, zadania własne (K22, K27, K33, D13, W3, W8). | Melia, Ozzy, Grum | tawerna | 3 postacie, duże | **PRZENIEŚĆ** ★ |
| T5 | Kości, rzutki, siłowanie | Gry w tawernie (TavernDice, Darts, ArmWrestle), turniej D6. | goście | tawerna | system | **PRZENIEŚĆ** |
| T6 | Intrygi na piętrach (I1-I7) | Podsłuch przez ścianę, listy pod drzwiami, nocne kroki; D45, D46, K73, D47. | goście | tawerna piętra | 5 zadań | **PRZENIEŚĆ** |
| T7 | Historyjki ilustrowane podróżnych | Sepiowe opowieści gości jako plansze w dzienniku. | podróżni | tawerna | system | **PRZENIEŚĆ** |
| T8 | Stajnia zajazdu (Stajnia.js) | Szczepan Kołodziej, stryszek, zmiana w stajni (obrządek, woda, gnój). | Szczepan | stajnia | zmiana | **PRZEROBIĆ** (praca dodatkowa przy tawernie; bez noclegu z S5) |
| T9 | Dawcy zadań w tawernie | Wiele zadań miasta zleca się w tawernie w oknach wieczoru (122 zadania; 84 z ofertą i oddaniem w tawernie). | – | tawerna | zasada | **PRZENIEŚĆ** |
| T10 | Piwnica tawerny (krata zakonu) | Wejście do podziemi (W4, W2). | Borgar | tawerna | – | **PRZEROBIĆ** ★ – wejście do generowanych lochów |

---

# F. Zadania, których nie ma w grze, a które padły w nowych notatkach (do dopisania)

Z QUESTY.md/MIESZKANCY.md, bez odpowiednika w starej grze (nowa treść do wymyślenia, ale gotowy materiał pomocniczy):
- Wodziarz i pokojówka kradnący wodę z jazu; strażnik jazu do przekupienia; studzienny na rynku.
- Rządca fałszujący księgę wody; lichwiarz skupujący długi.
- Górnicy uwięzieni po zawale; pustelnik przy źródle.
- Cech piwowarów chcący przejąć gości tawerny.
- Dwaj dezerterzy z przeciwnych stron w jednej wsi; łowca nagród.
- Ojciec: kolejne listy i wieści (po W10).
- Kopanie studni w suchym korycie (praca zbiorowa).

---

# G. Wnioski dla długości gry

Z rozeznania (bardzo orientacyjnie): wątki W = ok. 1-2 godziny każdy (23 wątki), D = 0,5-1 godziny, K = 10-20 minut, tawerna i podróżni = ciągłe. Po decyzjach wyżej zostaje wystarczająco, żeby zbliżyć się do 40-60 godzin, jeśli zostaną: oś wodna (W1, W2, W4, W7, W8, W19, W21), listy (W10, W20), rozbitkowie (W6, W12, W16), tawerna z podróżnymi, cech i jarmark (W17, W18, W22) oraz pakiet K/D z Podgrodzia i lasu.

Do uzgodnienia: czy przylądek z latarnią wraca na Wybrzeże (L7, K49, D22, W11); czy podziemia mają 30-40 pięter z kopalnią w Górach zamiast 100; gdzie w nowych 5 mapach stoi dzwonnica (kaplica Miasteczka) i młyn (wzgórze Miasteczka).
