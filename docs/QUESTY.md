# Questy miasteczka — katalog

> Propozycja do wyboru (2026-10-04). Co już jest w grze (TownQuests.js), a co czeka - `docs/QUESTY_STAN.md`. Postacie, miejsca i systemy są takie, jak w
> `docs/STORY.md`, `docs/WALKA.md`, `docs/ARCHITEKTURA.md` i na mapie „Okolice Tawerny” (Map008). Numery: **K** = krótki,
> **D** = długi, **W** = wątek (bardzo długi). Typ questu jest w nawiasie przy nazwie.
> **Woda (użytkownik, 2026-10-05):** studnia na rynku daje wodę, ale mało - sołtys ją przydziela (w grze: 2 nabrania dziennie,
> zdarzenia „Studnia miejska” `<Studnia:2>`); woda jest w wodospadzie i rzece; strumień przy młynie opadł, nie wysechł. Wątek W1 bez zmian.

## 1. Jak są zbudowane questy

- **Kto, gdzie, kiedy.** Quest daje zawsze konkretna osoba w konkretnym miejscu i tylko wtedy, gdy według swojego planu
  dnia tam jest: Hanka przy straganie 6–12, Kapral Wit za dnia przy bramie wschodniej, a nocą na murach, Kuba przy skąpej
  studni 7–14 itd. Część questów polega właśnie na **śledzeniu czyjegoś planu dnia** (np. dokąd ktoś chodzi o 2 w nocy).
- **Co robi gracz** — to, co gra już umie: zbieranie, uprawa na polu dziadka, polowanie i oprawianie, warsztat i stanowiska,
  gotowanie, walka, skradanie (C), proca i łuk (celowanie), pies, mini-gry tawerny, pogoda, zegar i susza. Wszystko, czego
  jeszcze nie ma, jest wypisane w ostatniej kolumnie tabel („Co trzeba dobudować”).
- **Wieczory należą do tawerny.** Zmiana u Borgara trwa 16–21, dlatego questy w mieście są głównie rano i za dnia, a
  śledztwa po 21.
- **Nagrody:**
  - **złoto** idzie na dług dziadka (2500 G do dnia 60). Krótki quest daje 5–30 G, długi 40–120 G, rozdział wątku
    50–250 G. Zlecenia dworu (od Feliksa) można zaliczyć od razu „na dług” — tak jak na tablicy zleceń;
  - **przedmioty**: narzędzia, ubranie, jedzenie, kości do gry, klucze;
  - **Opinia w miasteczku** (0–100, nowa — tabela niżej);
  - **sekrety i poszlaki**: notatki w dzienniku; zebrane poszlaki otwierają kolejne kroki wątków;
  - **doświadczenie** liczone jak w `WALKA.md`: ukończony quest = cel z dziennika (50), odkrycie fabularne 40, pierwsze
    wejście na nową mapę 50.
- **Zasada suszy (twarda).** Żaden quest nie daje wody ani nowego źródła wody jako nagrody. Bohater ma tylko deszczówkę
  (wiadro, gliniany garnek, beczkę na deszczówkę, kałuże, bukłak). Kuba **nie sprzedaje wody bohaterowi** - rozwozi ją tylko
  na przydział sołtysa (piekarnia, kuźnia, tawerna), a przydział maleje z każdym dniem bez deszczu. Kiedy quest wymaga wody, gracz oddaje ją z własnego zapasu — i to jest prawdziwy wybór („woda
  dla siebie czy dla innych”). Nawet finał wątku wody (W1) nie daje wody bohaterowi.
- **Opinia w miasteczku** to coś innego niż „Sława w tawernie” z tablicy zleceń: sława dotyczy tawerny, opinia — ulicy.
  Na starcie wynosi 10 („obcy chłopak w łachmanach”).

| Próg | Nazwa | Co daje |
|---|---|---|
| 0 | Obcy | ludzie odpowiadają półsłówkami; straż sprawdza cię nocą |
| 20 | Bywalec | drugi stragan do wynajęcia na dzień targowy; plotki przy straganach; nocna warta u Wita |
| 40 | Sąsiad | rabat 5% u Hanki, Tadka i Ignaca; wstęp na dzwonnicę; dzieci przynoszą plotki |
| 60 | Zaufany | rabat 10%; sołtys pyta cię o zdanie w sporach; ludzie ukryją cię przed strażą |
| 80 | Jeden z nas | rabat 15%; w finałach wątków miasto staje po twojej stronie (alarm dzwonu, obrona tawerny) |

  Opinia spada (od −1 do −15) za kradzież na oczach ludzi, donos, przyłapane kłamstwo, złamane słowo i za nocne
  włóczenie się, kiedy złapie cię straż.

- **Wspólne potrzeby** (budowane raz, dla wszystkich questów): silnik questów (kroki, flagi i wybory w zapisie gry,
  zakładka „Questy” w dzienniku, przypinanie do HUD), plany dnia mieszkańców (już powstają), licznik Opinii, wybory w
  dymkach (SpeechBubbles już je ma), znacznik „!” / „?” nad osobą z questem (jak nad tablicą zleceń) oraz warunki:
  godzina, dzień, pogoda, liczba dni bez deszczu i postęp fabuły.
- **Kalendarz:** pora roku trwa 28 dni (wiosna 1–28, lato 29–56, jesień 57–84, zima 85–112). Targ jest co 7 dni
  (dni 7, 14, 21…). Prom przypływa co 3 dni — w te same dni, w które Borgar wiesza nowe kartki (propozycja).

---

## 2. Krótkie questy

Trwają kilka minut, dzieją się w jednym albo dwóch miejscach i mieszczą się w jednym dniu.

| # | Nazwa | Kto daje | Gdzie | Co (opis i kroki) | Kiedy | Nagroda | Mechaniki gry | Co trzeba dobudować |
|---|---|---|---|---|---|---|---|---|
| K1 | Węgiel do paleniska *(dostawa)* | Tadek Młot | kuźnia, taras rzemieślników | Palenisko przygasa, a węgla nie ma. 1) Przynieś 5× Węgiel drzewny (z pieca na polu albo z drzewa zwęglonego piorunem). 2) Jeśli oddasz go przed 9:00, Tadek naostrzy ci narzędzie. | 6–17, od dnia 2 | 15 G, naprawa jednego narzędzia, Opinia +2 | piec, zwęglone drzewa (Storm), zużycie narzędzi (Durability) | nic |
| K2 | Woda do hartowania *(wybór)* | Tadek Młot | kuźnia | Koryto do hartowania wyschło i kuźnia stoi. Oddaj 2 porcje swojej deszczówki (wiadro albo garnek) albo odmów — wtedy Tadek pójdzie prosić sołtysa o większy przydział. | 6–17, po 3+ dniach bez deszczu | 25 G albo 6× Gwoździe; Opinia +3 | wiadro, gliniany garnek, pragnienie (Needs) | nic |
| K3 | Podkowa w słońcu *(szukanie)* | Tadek Młot | kuźnia → Polna droga | Z wozu Wieśka wypadła podkowa dla konia Lorda. W samo południe błyska w słońcu między kamieniami, więc szukasz błysku, a nie przedmiotu. | 11–14, pogodnie | 10 G, rabat 5% w kuźni na 7 dni | słońce i cienie (Sky), zbieractwo | błysk na ziemi, przedmiot Podkowa |
| K4 | Chleb przed świtem *(na czas, mini-gra)* | Hanka Mączna | piekarnia (rynek) | Piec musi ruszyć o 4:00, a drewna brak. 1) Przynieś 4× Drewno przed 5:00. 2) Pomóż wsunąć bochny łopatą (krótka gra w rytm, jak „kuchnia w rytm”). | 3:30–5:00 | 8 G + 2× Chleb prosto z pieca (ciepły: grzeje zimą); Opinia +2 | zegar, sen (trzeba wstać przed świtem), rytm z TavernShift | mini-gra „łopata do pieca”, wnętrze piekarni |
| K5 | Bochenki do 9:00 *(roznoszenie na czas)* | Hanka Mączna | stragan → dzwonnica, brama wschodnia, obóz, ratusz | Roznieś 4 bochny przed 9:00: Ambrożemu (dzwonnica), Kapralowi Witowi (brama wschodnia), Ludmile (obóz pod murem) i sołtysowi (ratusz). Każdy rzuca jedno zdanie plotki. | 6–9, raz dziennie, można powtarzać | 12 G, 4 plotki w dzienniku | bieg (Shift) i zmęczenie, plany dnia | nic |
| K6 | Jęczmień do żaren *(dostawa z pola)* | Hanka Mączna | stragan na rynku | Mąki brak, bo młyn stoi. Przynieś 4× Jęczmień z pola dziadka — Hanka zmiele go w ręcznych żarnach. Otwiera D2. | lato–jesień, 6–12 | Placek jagodowy + 10 G | uprawa jęczmienia (Farming) | nic |
| K7 | Myszy w mące *(dwa sposoby)* | Hanka Mączna | piekarnia, spiżarnia | W workach z mąką są myszy. Zastaw w spiżarni 2 wnyki z serem na przynętę albo przynieś od dziadka Mruczka (niesiesz go na rękach; gdy biegniesz, ucieka). Rano jest 3 myszy mniej. | od dnia 3, noc | 10 G albo bochen w każdy dzień targowy; z Mruczkiem dziadek jest dumny | wnyki i przynęta (Hunting), Mruczek | noszenie kota, wnętrze piekarni |
| K8 | Pęknięta beczka *(rzemiosło)* | Kuba Woziwoda | studnia na rynku (daje mało) | Beczka cieknie, a każda kropla to pieniądz. Przynieś 2× Deski i 4× Gwoździe i na miejscu zbij młotkiem obręcz. | 7–14 | 10 G; Kuba: „Skąd woda? Z daleka. Nie pytaj” (początek W1) | warsztat, młotek | nic |
| K9 | Kłótnia w kolejce *(rozsądzanie)* | Kuba Woziwoda | studnia na rynku (daje mało) | O 7:00, przy beczkach z przydziałem, Tadek i Ignac skaczą sobie do oczu o to, czyja robota ważniejsza (bohater w tej kolejce nie stoi - jemu Kuba wody nie daje). Rozsądź w dymkach: po połowie i na zmianę / niech rzucą kośćmi / nie moja sprawa. | 7–8, po 3+ dniach bez deszczu | za dobre wyjście Opinia +3, za złe −2; sąsiadka zaprasza na obiad (posiłek) | wybory w dymkach (SpeechBubbles), kości | wybory z konsekwencją |
| K10 | Smak wody *(śledztwo)* | Garbarz Ignac | garbarnia | Ignac moczy skóry w wodzie od Kuby (z przydziału), a one pachną różami. Powąchaj jego kadź: róża i żelazo. Potem pokaż mu własną deszczówkę (nic nie oddajesz) — nie pachnie niczym. Opis trafia do dziennika. Ignac: „Róże rosną tylko tam, gdzie ktoś je podlewa”. | 6:30–17, po K8 | poszlaka do W1, +40 dośw. | picie (Needs), notatki w dzienniku | nic |
| K11 | Myto przy bramie *(zapłać albo odrób)* | Kapral Wit Czerwień | brama wschodnia | Przy pierwszym przejściu do dworu Wit chce 2 G „na wojnę”. Zapłać albo odrób: zanieś 6× Drewno do koszy żarowych. Jeśli odrobisz, jesteś już „znany” i dalej przechodzisz bez myta. | za dnia, pierwsze przejście | wolne przejście; Wit cię zapamiętuje (ważne w W1 i W5) | zbieranie drewna | myto przy bramie (zdarzenie) |
| K12 | Łój do latarni *(dostawa nocą)* | Kapral Wit Czerwień | chodnik na murach | W latarni patrolu kończy się łój. Przynieś łój z oprawionego dzika albo jelenia (albo 2× Pochodnia). W zamian Wit rzuca: „Po północy to nie ja jestem tu najdziwniejszy”. | 21–4 | 2× Pochodnia od Wita, poszlaka do W1/W5 | oprawianie zwłok, pochodnie | przedmiot Łój (z oprawiania) |
| K13 | Sznur dzwonu *(na czas)* | Ambroży Dzwonnik | dzwonnica (rynek) | Sznur się przetarł. Przynieś 2× Lina przed 12:00. Jeśli się spóźnisz, w mieście pierwszy raz w historii nie zadzwoni południe — wszyscy o tym gadają, a Ambroży jest blady jak ściana. | 6–11:59 | 10 G, Opinia +2 | lina (len, warsztat) | wnętrze dzwonnicy |
| K14 | Dzwonnik ma chore kolana *(mini-gra)* | Ambroży Dzwonnik | szczyt dzwonnicy | O 18:00 Ambroży nie da rady wejść po schodach. Zadzwoń sam: 6 uderzeń w rytm (O, gdy serce dzwonu jest na górze). Jeśli wybijesz złą liczbę, Ambroży blednie: „Nie tak! Trzy i jeden to coś innego…” — to pierwsza poszlaka kodu (W2). | 17:30–18:10, od Opinii 20 | 8 G, Ambroży trochę bardziej ci ufa | gra rytmu na `Scene_MiniGame` (TawernaUI) | mini-gra dzwonu |
| K15 | Ostrożnie, kruche *(nocny kurier, wybór)* | Baltazar Vey | Kantor → brama południowa | „Skrzynia na wóz pod bramą, o 22:00. Nie otwierać”. Wybór: zanieś ją / otwórz po drodze (w słomie leżą stare kamienie z wyrytym krukiem; zamek pęka i Baltazar to zauważy) / zanieś ją Kapralowi Witowi. | 20–22 | 25 G albo poszlaka do W5, albo lepsza opinia u straży; każdy wybór zmienia W5 | noc, skradanie (C), ciężar | ciężka skrzynia (wolniejszy chód) |
| K16 | Grzyby po dwakroć *(handel)* | Baltazar Vey | Kantor | Dzień po promie Baltazar skupuje grzyby, jagody i wędzone mięso po podwójnej cenie. Sprzedaj mu do 10 sztuk przed 18:00. Dziwne, że bierze tylko to, co długo wytrzyma (wędzone i suszone). | dzień po promie, 8–18 | podwójna cena; poszlaka: to zapasy na długą drogę (obóz kopaczy, W8) | zbieractwo, wędzarnia, psucie się (Spoilage) | sklep Kantoru |
| K17 | Obwieszczenie o racjach *(roznoszenie, rozmowy)* | Sołtys Bronisław | ratusz → tawerna, piekarnia, kuźnia, obóz | Przybij 4 obwieszczenia: racje wody od Kuby i kara za kradzież deszczówki. Każdy reaguje inaczej: Hanka pyta, czym zarobi ciasto, Tadek klnie, a Ludmiła chce wiedzieć, czy obóz też dostanie racje. | 8–16 | 10 G, Opinia +1; wiesz już, kto jest przeciw sołtysowi | gwoździe, młotek | zdarzenia obwieszczeń |
| K18 | Kto ruszył stóg? *(śledztwo)* | Sołtys Bronisław | stogi siana, taras rzemieślników | Dwóch sąsiadów kłóci się o stóg, który ktoś „przesunął na miedzę”. Wysłuchaj obu (każdy bywa w domu o innej porze) i obejrzyj ślady. Prawda: stóg przesunął podmuch burzy. | dzień po burzy, 8–18 | 15 G; za prawdę Opinia +2 u obu, za stronniczość +3 u jednego i −2 u drugiego | wiatr burzy (Storm), wybory | ślady (zdarzenia) |
| K19 | Spis obozu *(wybór)* | Sołtys Bronisław | obóz uchodźców pod murem | Policz ludzi w obozie — porozmawiaj z każdym z 5 namiotów. Rafał prosi, żebyś go nie liczył. Wybór: podaj prawdziwą liczbę albo zaniżoną (racje będą mniejsze, ale Rafała nikt nie zauważy). | po pierwszej fali (dzień 10+), 9–17 | 10 G; zmienia W6 | rozmowy, wybory | namioty jako zdarzenia |
| K20 | Pierwsza skóra *(nauka)* | Garbarz Ignac | garbarnia, taras rzemieślników | Sprzedaj Ignacowi pierwszą Surową skórę. Ignac ogląda cięcia i pokazuje, jak oprawiać czyściej. | 7–17, po pierwszym polowaniu | 8 G; przy 3 następnych oprawieniach +1 Ścięgna | oprawianie (Hunting) | mała premia przy oprawianiu |
| K21 | Garbnik z lasu *(zbieranie)* | Garbarz Ignac | garbarnia | Skończył się garbnik. Przynieś 10× Szyszki i 4× Gałęzie (na korę) przed 17:00. | 7–17 | 12 G, rabat w garbarni na 1 dzień | zbieractwo | nic |
| K22 | Struna dla Melii *(łańcuch, na czas)* | Melia Srebrogłosa | scena tawerny → garbarnia | W lutni pękła struna. 1) Zdobądź Ścięgna (z oprawiania). 2) Ignac skręca z nich strunę (1 h). 3) Oddaj ją Melii przed 18:00. Jeśli zdążysz, Melia zaśpiewa zwrotkę, której nikt jeszcze nie słyszał (W3). | 10–18 | Natchniony za darmo, 15 G, nowa zwrotka | oprawianie, pieśń Melii (TavernLife) | przedmiot Struna |
| K23 | Chowany na rynku *(zabawa na czas)* | Bronek i Zosia | rynek | Masz 5 minut, żeby znaleźć oboje: za straganem, w pustej beczce Kuby, za studnią albo w stogu na tarasie niżej. Znalezieni dają ci swój „skarb” — kamyk z wyrytym krukiem. | 12–17, bez deszczu | Opinia +2, kamyk z krukiem (poszlaka do W2); później dzieci przynoszą plotki | zegar, szukanie | kryjówki (zdarzenia) |
| K24 | Latawiec na dzwonnicy *(celowanie)* | Zosia | dzwonnica | Latawiec zaplątał się o zdobienia wieży. Przetnij sznurek strzałem z procy (przytrzymane F, kółko się zwęża) i złap latawiec, zanim wiatr porwie go za mur. | dzień z wiatrem albo przed burzą | 5 G od matki, Opinia +2 | proca i celowanie (Hunting_Weapons), wiatr (Storm) | latawiec jako cel |
| K25 | Proca dla Bronka *(rzemiosło, nauka)* | Bronek | rynek → warsztat na polu | Zrób na warsztacie procę i pokaż Bronkowi 3 trafienia w puszkę na murze. Od następnego dnia Bronek przegania ptaki z dachu piekarni. | dowolnie | przez 3 dni bochen dziennie od Hanki, Opinia +2 | warsztat, proca, ptaki (Birds) | nic |
| K26 | Pierścionek w studni *(zejście, poszlaka)* | Zosia | studnia na rynku (daje mało) | Zosia wrzuciła do studni pierścionek matki. Zejdź po 2× Lina. Na dnie tylko płytka kałuża; leży w niej pierścionek… i zamurowany otwór kanału, a w nim kamień z wyrytym krukiem. Ktoś kiedyś odciął tę studnię. | za dnia, nie w deszcz | Opinia +3, poszlaka do W1 | lina | mała mapa: dno studni |
| K27 | Konik dla Eli *(rzemiosło albo wybór)* | Ludmiła | obóz uchodźców | Od przeprawy Ela nie śpi. Wystrugaj jej drewnianego konika (Drewno + nóż) albo przyprowadź Melię, żeby zaśpiewała pod murem (Melia przyjdzie, ale tego wieczoru nie zaśpiewa w tawernie). | 20–23 | Opinia +3; Ludmiła mówi: „Tam, skąd uciekamy, szukają serca skały” (poszlaka) | warsztat, pieśń Melii | przedmiot Drewniany konik |
| K28 | Kocioł dla obozu *(gotowanie)* | Ludmiła | obóz uchodźców | Ugotuj w kociołku kapuśniak albo gulasz dla 4 osób i donieś go ciepły (danie stygnie i się psuje). | wieczorem; zimą liczy się podwójnie | Opinia +4; uchodźcy pomogą przy żniwach (W6) | kociołek, dania, psucie się (Spoilage) | nic |
| K29 | Rana Rafała *(po cichu)* | Rafał (dezerter) | obóz, za namiotem | Rafał ukrywa ranę po strzale. Zrób Opatrunek i załóż mu go tak, żeby nie zobaczył tego Kapral Wit (przechodzi obok co godzinę). | 10–16 | Rafał zaczyna ci ufać (W6), +40 dośw. | opatrunek, rana, skradanie | nic |
| K30 | Koszyki dla dworu *(dźwiganie)* | Feliks | stragany (rynek) → drzwi dworu | Feliks robi zakupy między 6 a 9 i nie da rady wszystkiego unieść. Zanieś 3 koszyki do drzwi dworu przed 9:00 (są ciężkie, więc idziesz wolniej). | dni targowe, 6–9 | 5 G + 5 G „na dług”; Lord rzuca przy drzwiach kilka słów | udźwig, plany dnia | nic |
| K31 | Imieniny Lorda *(zamówienie)* | Feliks | drzwi dworu | Na imieniny Lord chce 2× Miód pitny i Placek jagodowy. Dostarcz je do 20:00 w dniu imienin. | dzień 33 (propozycja) | 40 G (można „na dług”); list Lorda w dniu 40 łagodniejszy | miód pitny, pieczenie | data imienin |
| K32 | List od dziadka *(posłaniec)* | Dziadek Stach | dom dziadka → drzwi dworu | Dziadek prosi w liście o zwłokę. Zanieś go Lordowi. Zwłoki nie będzie — ale Lord pyta, czy na polu dziadka „leżą jeszcze stare kamienie z krukiem”. | dni 5–20, 8–20 | +40 dośw., poszlaka do W4/W7 | dług (Story) | nic |
| K33 | Czapka Ozzy'ego *(dziwne)* | Dziadek Ozzy | tawerna → zamknięty ogród | Ozzy zgubił czapkę: „Leży na głowie rycerza, tego bez nosa”. I rzeczywiście leży — na posągu za murem zamkniętego ogrodu. Strąć ją procą przez kratę furtki. Skąd Ozzy to wiedział? | wieczorem | piwo od Ozzy'ego, poszlaka do W2 | proca, celowanie | czapka na posągu |
| K34 | Ogień w stogu *(zdarzenie w burzy, wybór)* | zdarzenie (krzyk sołtysa na rynku) | taras rzemieślników | Piorun zapala stóg. Gasisz go: każde wiadro albo garnek wody gasi jeden płomień. Wodę bierzesz z własnych zapasów — ratujesz stóg czy swoje pragnienie? | w czasie burzy | Opinia +8 (najwięcej ze wszystkich krótkich); przez 2 tygodnie sołtys zwalnia cię z myta i opłaty za stragan | burza, wiadra, garnki, pragnienie | ogień na mapie |
| K35 | Śnieg na dachu *(praca)* | Hanka Mączna | piekarnia | Po śnieżycy dach piekarni trzeszczy. Przed zmierzchem odgarnij łopatą śnieg w 3 miejscach. | zima, po śnieżycy | 10 G + gorący chleb (grzeje), Opinia +2 | łopata, zimno (Survival) | zaspy na dachu (zdarzenia) |
| K36 | Kot na dachu piekarni *(zwabianie)* | Dziadek Stach | dom dziadka → piekarnia | Mruczek nie wrócił na noc. Siedzi na dachu piekarni, bo pachnie tam mlekiem. Zwab go Mlekiem albo Serem i zanieś do domu. | rano, po nocy, w którą kot zniknął | Owsianka od dziadka; dziadek trochę bardziej ci ufa | mleko (zagroda), Mruczek | noszenie kota (jak w K7) |
| K37 | Sakiewka Lorda *(pościg, wybór)* | Lord Zaleski (krzyk) | rynek → taras rzemieślników | W dzień targowy złodziejaszek odcina Lordowi sakiewkę i ucieka schodami w dół. Dogoń go (bieg, oddech). Wybór: oddaj sakiewkę Lordowi / puść złodzieja (to głodny chłopak z obozu) / zatrzymaj sakiewkę (80 G; jeśli ktoś to zobaczy, Opinia −15, a straż zaczyna cię szukać). | dzień targowy, 10–12 | Lord odpisuje 50 G z długu albo Opinia u uchodźców +5, albo 80 G | bieg (Combat RUN), zmęczenie | uciekający NPC |
| K38 | Nocna warta *(obserwacja)* | Kapral Wit Czerwień | mury, baszta przy bramie wschodniej | Zastąp chorego strażnika od 1:00 do 3:00 i wypatruj ruchu: lis, sowa… a o 2:00 Kuba z pustym wozem. Wit bez słowa otwiera mu furtkę w bramie wschodniej. | 1–3 w nocy, od Opinii 20 | 15 G, poszlaka do W1 | noc, potrzeba snu, Czujność | widok z muru (zdarzenia) |
| K39 | Kości z targu *(oszust)* | Bartek Kmieć | tawerna → stragan na rynku | Bartek przegrał wszystko z wędrownym graczem na targu: „ma szczęście jak diabeł”. Zagraj z graczem w kości i (przy Czujności 10+) wypatrz, kiedy podmienia kość. Wybór: zdemaskuj go (Opinia +4, oszust wylatuje z targu) albo weź udział w zysku (10 G i milczysz). | dzień targowy, 10–14 | Opinia +4 albo 10 G; Bartek oddaje ci 5 G | kości (TavernDice), Czujność | wędrowny gracz (nowy rywal w kościach) |

---

## 3. Długie questy

Kilka kroków, kilka dni, 2–4 miejsca i małe wybory.

| # | Nazwa | Kto daje | Gdzie | Co (opis i kroki) | Kiedy | Nagroda | Mechaniki gry | Co trzeba dobudować |
|---|---|---|---|---|---|---|---|---|
| D1 | Buty od szewca *(polowanie + rzemiosło, wybór)* | Garbarz Ignac | garbarnia + łąki i las + kuźnia | Ignac nie może patrzeć na bose stopy bohatera. 1) Przynieś 3× Surowa skóra z jelenia albo dzika. 2) Ignac wyprawia je 2 dni (we własnej garbarni zrobisz to szybciej, ale gorzej). 3) Tadek kuje 12 ćwieków (1× Żelazo). 4) Miara: przyjdź o 7:00 boso po rosie, a Ignac obejrzy ślad stopy. 5) Buty odbierasz po 2 dniach. Wybór kroju: **Buty łowcy** (ciche: przy skradaniu zwierzęta słyszą cię później) albo **Podkute buty** (nie ślizgasz się na śniegu, mniej się męczysz na kamieniach). | od dnia 5, 4–6 dni, 7–17 | wybrane buty (lepsze niż Skórzane buty z garbarni), Opinia +4 | polowanie, oprawianie, garbarnia, kuźnia, skradanie | 2 nowe przedmioty (buty) |
| D2 | Mąka bez młyna *(budowa, wybór)* | Hanka Mączna | piekarnia + stary młyn nad suchym korytem + kuźnia + pole dziadka | 1) Hanka mówi, że koło młyna stoi, odkąd opadł strumień. 2) Obejrzyj młyn: koło i kamienie są całe, brakuje tylko wody. 3) Tadek radzi: „kierat zamiast koła”. Potrzeba 10× Deski, 2× Żelazo i 2× Lina; zbijasz kierat przy młynie (plac budowy, młotek). 4) Do kieratu trzeba zwierzęcia: krowy z zagrody dziadka (wolniej) albo konia Lorda (szybciej, ale Lord chce co dziesiąty worek). 5) Pierwsze mielenie: 10× Jęczmień. | lato–jesień, 3–5 dni | mąka u Hanki na stałe o połowę tańsza, Placek w każdy dzień targowy; z krową Opinia +6, z koniem Opinia +3 i przychylność dworu | zwierzęta (Livestock), jęczmień, budowa młotkiem | kierat i wnętrze młyna (albo cały młyn, jeśli nie ma go na mapie) |
| D3 | Ręka kowala *(praca przy palenisku, 3 dni)* | Tadek Młot | kuźnia + brama wschodnia + ratusz + garbarnia | Tadek poparzył dłoń, więc przez trzy dni zastępujesz go przy jego palenisku. Dzień 1: 4 podkowy dla koni straży (Wit odbiera je o 17:00). Dzień 2: 20× Gwoździe dla sołtysa (na scenę na dożynki). Dzień 3: Nóż żelazny dla Ignaca. Spóźnisz się — klient się obraża. Na koniec wybór: weź 60 G albo zostaw je Tadkowi na leczenie. | 3 kolejne dni, 6–17 | 60 G albo: Tadek uczy cię przepisu na okutą tarczę i daje na zawsze 15% rabatu w kuźni | kuźnia (forge), ruda i żelazo, zużycie narzędzi | praca na cudzym stanowisku (kuźnia w mieście) |
| D4 | Złodziej o świcie *(zasadzka, wybór moralny)* | Hanka Mączna | stragan na rynku + obóz uchodźców | Co rano znika jeden bochen. 1) O 5:30 zaczaj się przy straganie (skradanie — nie daj się zobaczyć). 2) Mała postać ucieka w stronę obozu. 3) Idź jej tropem sam albo z psem (wywęszy chleb). 4) To Ela, która nosi chleb chorej matce. Wybór: a) powiedz Hance (Ela zostaje ukarana, a obóz cię nie lubi), b) przez tydzień płać za chleb sam (5 G dziennie), c) namów Hankę, żeby wzięła Ludmiłę do pieca na 4:00 (wymaga Opinii ≥ 20). | od dnia 11 (po pierwszej fali), 2–3 dni | przy c) chleb tanieje, Opinia +6, a Ela daje ci rysunek: kruk nad tawerną i „schody w dół” (poszlaka do W9) | skradanie, pies (tropienie), plany dnia | trop zapachu dla psa |
| D5 | Wataha pod bramą *(walka, 3 noce)* | Kapral Wit Czerwień | brama południowa + Polna droga + Skraj lasu | Wilki podchodzą pod mur, a straż „ma z dworu rozkaz nie wychodzić”. 1) O świcie obejrzyj tropy pod bramą. 2) Drugiej nocy zabij 2 wilki zwiadowców na Polnej drodze. 3) Trzeciej nocy — przewodnik watahy z kompanami na Skraju lasu. Wit daje ci 6× Strzały. Na koniec wybór: oddaj zasługę Witowi (będzie twoim dłużnikiem) albo ogłoś wszystko u sołtysa (Opinia). | 3 noce, 21–5 | 80 G; do tego Opinia +5 albo przysługa Wita (raz przepuści cię nocą bez pytań — przyda się w W1 i W5) | walka (wataha), łuk, oprawianie | nic (wilki już są) |
| D6 | Siłacz z targu *(turniej, przekupstwo)* | Tadek Młot | tawerna (siłowanie) + rynek | W dzień targowy jest turniej siłowania: Tadek i Grum walczą o beczkę piwa. 1) Trening: 3 wieczory siłowania z Grumem. 2) Zapis u sołtysa (2 G). 3) Baltazar daje ci 40 G, żebyś przegrał w ćwierćfinale („mam zakład”). 4) Turniej: 3 pojedynki (mini-gra siłowania). Wybór: sprzedaj walkę / wygraj / przegraj uczciwie. | dzień targowy 14 albo 21, wieczory przed nim | za wygraną 50 G, Pas siłacza (większy udźwig) i Opinia +5; za sprzedaną walkę 40 G i zaufanie Baltazara (W5) | siłowanie (TavernLife_ArmWrestle), Siła | turniej na rynku, Pas siłacza |
| D7 | Serce kowala *(swaty, kradzież nocą)* | Tadek Młot (po cichu) | kuźnia + piekarnia + ogród dworu + scena tawerny | Tadek kocha Hankę i nie umie jej tego powiedzieć. 1) Wybadaj Hankę: kocha róże, „kiedyś rosły i u nas”. 2) Zdobądź różę: zerwij ją nocą w ogrodzie dworu (skradanie; na murach jest Kapral) albo niech Tadek wykuje żelazną (2× Żelazo). 3) Melia ułoży piosenkę (za Miód pitny). 4) Tadek wyznaje miłość przy scenie. Finał: wesele w tawernie. Zerwana róża ma mokrą ziemię na łodydze — w taką suszę! (poszlaka do W1). | 5–7 dni, wieczory | wesele = zmiana u Borgara z podwójnymi napiwkami, 30 G od młodych, Opinia +8 | skradanie, kuźnia, zmiana w tawernie, pieśń | scena wyznania, wesele (goście, stoły) |
| D8 | Wielki targ *(handel, mini-gra)* | Sołtys Bronisław | rynek (drugi stragan) + pole dziadka | Od Opinii 20 możesz wynająć drugi stragan na dzień targowy (5 G). 1) Przez 3 dni szykujesz towar: warzywa, ser, jajka, placki. 2) W dzień targowy, między 6 a 14, sprzedajesz go z targowaniem — gdy podnosisz cenę, klient może odejść. 3) Konkurencja: Feliks wystawia wielkie, soczyste kapusty z dworu. W taką suszę? Wybór: wojna cenowa albo pytanie do Feliksa, skąd taka kapusta (poszlaka do W1). | co 7 dni, od dnia 14 | 30–120 G za dzień (w suszę warzywa są droższe), Opinia +2 | uprawy, psucie się, zwierzęta, Opinia | mini-gra targowania, stragan gracza |
| D9 | Spis beczek *(śledztwo po domach, wybór)* | Sołtys Bronisław | ratusz + domy + piekarnia + Kantor | Sołtys chce policzyć wodę w mieście, żeby racje były sprawiedliwe. Odwiedzaj domy wtedy, gdy gospodarze są w środku (plany dnia). Znaleziska: Hanka chowa beczkę (do ciasta — bez niej nie upiecze chleba), a w piwnicy Kantoru stoi 20 beczek (Baltazar: „to wino”). Wybór: pełny raport (Hanka traci beczkę, chleb drożeje) / raport bez Hanki / przemilczenie Kantoru za 30 G od Baltazara. | od dnia 15, 2–3 dni, 8–18 | 40 G od sołtysa; poszlaka do W5 („wino” pachnie mułem i żelazem); Opinia w górę albo w dół | plany dnia, wybory | wnętrza domów albo rozmowy w drzwiach |
| D10 | Gorączka Eli *(zioła, gotowanie, czuwanie)* | Ludmiła | obóz + łąki + łaźnia (Wanda) + Kantor | Ela ma gorączkę. 1) Wanda zna napar: 2× Krwawnik, 2× Pokrzywa, 1× Dziki czosnek i 1× Miód. 2) Ugotuj Wywar ziołowy na ognisku — na własnej deszczówce. 3) Czuwaj całą noc przy ognisku w obozie (odpoczynek przy ogniu). 4) Rano gorączka spada. Jest też skrót: Baltazar sprzedaje „lek z kontynentu” za 60 G. Działa, ale na flakonie jest pieczęć wojska (poszlaka do W5/W6). | wiosna–lato (zioła), 2 dni | Opinia +6, Ludmiła łata twoje łachmany (lepszy wygląd), Rafał zaczyna ci ufać (W6) | zbieractwo, gotowanie, pragnienie, odpoczynek przy ogniu | Wywar „dla dziecka” (odmiana), łaty na stroju (HeroLook) |
| D11 | Ognie na murach *(dostawy + sabotaż)* | Kapral Wit Czerwień | brama wschodnia i mury + piec na polu | Kosze żarowe gasną, a dwór nie przysyła węgla. Przez 7 wieczorów przynoś przed 21:00 po 3× Węgiel drzewny. Czwartej nocy ktoś zalewa kosz wodą — marnuje wodę w taką suszę! Śledzisz go: to człowiek Baltazara, któremu przy bramie potrzebna jest ciemność do przemytu. Wybór: złap go (walka albo oddanie Witowi) / przymknij oko (Baltazar płaci 30 G). | 7 dni, 19–21 + czwarta noc | 70 G, Opinia +5; zmienia W5 | piec (węgiel), noc, skradanie, walka | gaszenie koszy (zdarzenie) |
| D12 | Ślady kota *(śledzenie nocą)* | Dziadek Stach | dom dziadka + Polna droga + tawerna (piwnica) + Map009 | Mruczek znika nocami i wraca w pajęczynach, „jakby wyszedł z lochu”. 1) Idź za kotem nocą (biegnie, gubi się, czeka na ciebie). 2) Trop prowadzi do tawerny, przez okienko piwnicy. 3) Kot znika za luźną cegłą — a za nią jest przejście (Map009). Wybór: od razu powiedzieć Borgarowi („nie pytaj o to, czego nie chcesz wiedzieć”) albo zatrzymać to dla siebie. | Akt I, od dnia 20 | odkrycie fabularne (+40, i +50 za nową mapę), początek W9 | noc, skradanie, Mruczek | kot z nocną trasą |
| D13 | Zakład Ozzy'ego *(przepowiednie)* | Dziadek Ozzy | tawerna + piekarnia + brama wschodnia + rynek | Ozzy po pijaku przepowiada: „Jutro o trzeciej burza. Pojutrze pęknie piec Hanki. Za trzy dni koń kaprala zgubi podkowę”. Grum zakłada się o 10 G, że to bzdury. Bądź na miejscu i sprawdź każdą przepowiednię — wszystkie się sprawdzają. Na koniec Ozzy na chwilę trzeźwieje i mówi o tobie coś, czego nie mógł wiedzieć. | 3 dni (burza z planu pogody) | 30 G z zakładu, +100 dośw., zaufanie Ozzy'ego (W9) | plan pogody (Survival/Storm), plany dnia | przepowiednie czytane z planu pogody |
| D14 | Zboże na wojnę *(rekwizycja, wybór)* | Kapral Wit Czerwień (z rozkazu dworu) | ratusz + pole dziadka + dom dziadka | Po bitwie na kontynencie dwór zbiera „zboże na wojnę”: trzecią część jęczmienia z każdego pola. Wit przyjdzie na pole dziadka za 3 dni. Wybór: oddaj (Lord zalicza 50 G na dług) / ukryj zboże w skrzyni w chacie albo u Hanki (ryzyko przeszukania — Wit sprawdza skrzynie) / przekup Wita (20 G). | po drugiej fali (dzień 24+) | zależnie od wyboru; złapany na ukrywaniu płacisz 40 G kary i straż patrzy na ciebie krzywo | uprawy, skrzynie, dług (Story) | rekwizycja (Wit na polu) |
| D15 | Dzieci nocą *(śledzenie, wybór)* | matka Bronka i Zosi (dom przy rynku) | rynek + dziura w murze + zamknięty ogród | Dzieci wymykają się nocą z domu. 1) O 23:00 czekaj pod ich domem. 2) Idź za nimi (C) przez dziurę w murze do zamkniętego ogrodu. 3) Dzieci bawią się w rycerzy przy posągach; jeden posąg ma w cokole pustą niszę. 4) Nadchodzi patrol Wita. Wybór: okłam Wita i wyprowadź dzieci po cichu / oddaj je Witowi (matka będzie wdzięczna, dzieci się obrażą). W zamian dzieci pokazują ci dziurę w murze — możesz wejść do ogrodu jeszcze przed W2. | od dnia 12, noc 23–1 | Opinia +3, wejście do ogrodu (W2) | skradanie, plany dnia, patrol | dziura w murze, nisza w posągu |
| D16 | Uczeń dzwonnika *(nauka, 4 dni)* | Ambroży Dzwonnik | dzwonnica | Ambroży szuka następcy, „na wszelki wypadek”. Przez 4 dni dzwonisz z nim o 6, 12 i 18 (mini-gra dzwonu, rytmy coraz trudniejsze). Ostatniego dnia Ambroży mówi: „Zwykłe godziny już umiesz. Inne… może kiedyś”. | od Opinii 40, 4 dni | klucz do dzwonnicy, widok z wieży (cała mapa miasta odkryta na minimapie), zaufanie Ambrożego (W2) | mini-gra dzwonu, minimapa | mini-gra dzwonu (jak w K14) |
| D17 | Petycja do Lorda *(zbieranie podpisów)* | Sołtys Bronisław | ratusz + domy + kuźnia + garbarnia + drzwi dworu | Dwór chce od każdego domu 10 G podatku wojennego. Kuby, Ignaca i obozu na to nie stać. 1) Zbierz 10 podpisów (krzyżyków) — każdego w godzinach, kiedy ta osoba jest na miejscu. Baltazar podpisze tylko za przysługę, Kapral Wit nie podpisze wcale. 2) Zanieś petycję Lordowi (8–20). 3) Lord obniża podatek o połowę i prosi: „Gdybyś coś znalazł pod Kruczymi Skałami, przyjdź najpierw do mnie”. | po dniu 20 | Opinia +8, 30 G od sołtysa; Lord cię zapamiętuje (W7) | plany dnia, rozmowy | petycja (przedmiot), list podatkowy |
| D18 | Płaszcze przed zimą *(rzemiosło, wybór moralny)* | Garbarz Ignac | garbarnia + obóz + brama wschodnia | Idzie zima, a obóz marznie. Ignac uszyje 5 płaszczy, jeśli przyniesiesz 10× Surowa skóra i 5× Wełna. Kiedy płaszcze są gotowe, Feliks oferuje za nie trzy razy więcej — dla straży dworu. Wybór: płaszcze dla obozu (Opinia, W6) albo dla straży (90 G; Ignac jest wściekły, a część uchodźców odpływa promem). | jesień (dni 70–84) | dla obozu: Opinia +10 i płaszcz dla ciebie; dla straży: 90 G | polowanie, wełna, garbarnia, zimno | nic (Płaszcz już jest) |
| D19 | Kość z Kruczych Skał *(kości, Akt II)* | Nieznajomy w kapturze | stół kości w tawernie + dzwonnica + zamknięty ogród | Wygraj z Nieznajomym Kość z Kruczych Skał. Na jej ściankach zamiast oczek są kreski i przerwy — rytm dzwonu. Ambroży poznaje w nim sygnał zakonu „pytanie”. Rzucona przy posągu bez nosa, kość zawsze pada tą samą ścianką i wskazuje płytę w ścieżce. | od Sławy w tawernie 80 | klucz do zagadki ogrodu (W2), +100 dośw. | kości (TavernDice), Sława w tawernie | znaczenie kości w ogrodzie |

---

## 4. Bardzo długie questy (wątki)

Wątki ciągną się przez rozdział 1 i dalsze akty: mają wiele kroków, wybory z konsekwencjami i są związane z główną
fabułą. Po tabeli każdy wątek ma swoją listę rozdziałów.

| # | Nazwa | Kto daje | Gdzie | Co (opis i kroki) | Kiedy | Nagroda | Mechaniki gry | Co trzeba dobudować |
|---|---|---|---|---|---|---|---|---|
| W1 | Woda spod Kruczych Skał *(śledztwo, wielki wybór)* | Kuba Woziwoda (mimo woli), Hanka Mączna, sołtys Bronisław | studnia na rynku (daje mało), staw z wodospadem za halą, brama wschodnia nocą, ogród dworu, stary młyn, kanał pod rynkiem, cysterna zakonu (Akt II) | Skąd Kuba ma wodę? Czemu ogród Lorda jest zielony? Kto odciął studnię i młyn? Nocne śledztwo kończy się wielkim wyborem: ujawnić, dogadać się z dworem, szantażować albo milczeć. | od dnia 3 (K8, K10) do Aktu II | Opinia do +20, tańsza mąka i chleb, odpis z długu (wariant z dworem) — **nigdy woda dla bohatera** | skradanie, plany dnia, noc, Czujność, walka z ludźmi (etap 3), dzwon | mapa kanału pod rynkiem, oranżeria z pompą, cysterna (Akt II) |
| W2 | Kod dzwonu *(zagadka, zaufanie)* | Ambroży Dzwonnik | dzwonnica, rynek, zamknięty ogród z posągami, Archiwum zakonu pod ogrodem | Dzwonienie o dziwnych godzinach to sygnały zakonu: Ambroży wciąż ostrzega miasto, które już ich nie rozumie. Zapisujesz godziny i liczbę uderzeń, łączysz je ze zdarzeniami, otwierasz ogród i archiwum. | od dnia 7 do Aktu III | klucz do dzwonnicy i ogrodu, Księga sygnałów, „jedno pytanie na rok” u Ambrożego, alarm dzwonu w finale | notatki w dzienniku (zapis godzin), mini-gra dzwonu, skradanie, cienie słońca, zagadka posągów | tabela sygnałów w dzienniku, mapa Archiwum zakonu, zagadka posągów |
| W3 | Pieśń o Kruczych Skałach *(zbieranie zwrotek, wybór)* | Melia Srebrogłosa | scena tawerny, dzwonnica, obóz, tawerna nocą, zamknięty ogród, biblioteka dworu, łąka w Noc Kupały | Melii śni się siódma ballada, ale bez słów. Zbierasz zwrotki z pięciu źródeł; ostatnia opisuje drogę w dół. Kto usłyszy całą pieśń — decydujesz ty. | od wysłuchania 6 ballad (TavernLife) do Nocy Kupały (dzień 42) albo później | silniejszy Natchniony, skrót w podziemiach, doświadczenie; pieśń zaśpiewana publicznie = Opinia | pieśń Melii, rozmowy, skradanie, walka (obrona Melii) | 5 nowych zwrotek (tekst), noc święta, biblioteka we dworze |
| W4 | Krew kasztelana *(rodzinny sekret Borgara)* | Borgar (niechętnie), Tadek Młot | bar w tawernie, kuźnia, pole dziadka, drzwi dworu, piwnica tawerny, Komnata Serca | Borgar Kowal jest potomkiem ostatniego kasztelana. Połowa żelaznego klucza wisi nad barem „na szczęście”, druga jest zakopana. Składasz klucz, a potem musisz o wszystkim powiedzieć Borgarowi. | od dnia 15 do Aktu III | Klucz kasztelana (otwiera Komnatę Serca), Borgar jako sojusznik albo strażnik piwnicy; w finale Borgar może zostać strażnikiem zamiast ciebie | kopanie łopatą, cienie słońca (Sky), kuźnia, wybory | 2 połówki klucza i cały klucz, scena konfrontacji, wnętrze dworu |
| W5 | Towary z kontynentu *(przemyt, praca od środka)* | Baltazar Vey (pośrednio), Kapral Wit, sołtys Bronisław | Kantor, tylne drzwi Kantoru nocą, brama południowa, Skraj lasu (obóz przemytników), Polna droga (wóz do przystani) | Baltazar przemyca dla jednej ze stron wojny: wywozi zboże z rekwizycji i kamienie z krukiem, przywozi mapy, narzędzia i ludzi. Najmujesz się u niego jako nocny tragarz, zdobywasz rejestr i decydujesz, co z nim zrobić. | od dnia 10 do Aktu II | 20 G za noc pracy, rejestr (dowód), łapówki albo Opinia; Kantor zostaje albo znika; tańsze żelazo i stal | skradanie, noc, ciężar, walka z ludźmi (etap 3), wybory | wnętrze Kantoru z piwnicą i gabinetem, obóz przemytników (zdarzenia na Skraju lasu), rejestr |
| W6 | Ludzie z promu *(uchodźcy, wybory moralne)* | Ludmiła (z Elą), Rafał, sołtys Bronisław, Kapral Wit | obóz uchodźców pod murem, ratusz, tablica zleceń, pole dziadka, kopalnia (Akt II) | Wojna przypływa falami. Ludmiła szuka męża, Marka, a Rafał jest dezerterem z wyprawy po Serce. Ukrywasz go, wydajesz albo przemycasz; miasto głosuje, czy zamknąć bramy. | od pierwszej fali (dzień 10) do Aktu II | Opinia (u uchodźców i w mieście), pomocnicy na polu dziadka (żniwa), Rafał jako sojusznik w walce, odnaleziony Marek | rozmowy, skradanie, walka, uprawy, gotowanie | fale uchodźców (obóz rośnie), głosowanie w ratuszu, listy gończe na ludzi |
| W7 | Dwór z kamieni twierdzy *(Lord, Feliks, dług i to, co po nim)* | Lord Leopold Zaleski, Feliks | drzwi dworu, ogród, wnętrze dworu (hol, biblioteka, gabinet, oranżeria), brama wschodnia | Dług dziadka i dalszy ciąg: Lord, który „zna tylko bajkę”, i Feliks, który rano robi zakupy, a nocą prowadzi interesy. Kto we dworze stoi za frakcją, zależy od wariantu do wyboru autora — w obu gra prowadzi do dowodów. | od dnia 1 (dług) do Aktu III | spłata długu (koniec rozdziału 1), odpisy z długu za wybory, w Akcie II pomoc Lorda albo jego wrogość | dług (Story), rozmowy, skradanie we dworze, wybory | wnętrze dworu, Feliks jako postać z planem dnia na mapie miasta |
| W8 | Żelazna Pięść *(najemnik, wojna)* | Grum Żelazna Pięść | tawerna (siłowanie, kości), Góry i kamieniołom (Map013), Jaskinia (Map014), obóz kopaczy, Osada Milczących (Akt II) | Grum najmuje bohatera na przewodnika w góry. Widzisz tam obóz kopaczy z wyprawy po Serce, a Grum zaczyna wątpić. Możesz przeciągnąć go na swoją stronę, walczyć z nim albo pracować dla frakcji. | od Sławy w tawernie 40 i dnia 20 do Aktu III | 50 G za wyprawę, broń najemnika, Grum jako sojusznik albo przeciwnik | walka (najemnik z tarczą: ciężki cios, zajście od tyłu), skradanie, siłowanie, kości, przetrwanie poza domem | podpięte mapy Gór i Jaskini, obóz kopaczy, walka z ludźmi (etap 3) |
| W9 | Serce Twierdzy *(oś główna)* | Dziadek Ozzy, Borgar, Melia, Ambroży — i samo Serce | piwnica tawerny i luźna cegła (Map009), Ruiny Zamku (Map010), 100 pięter, Komnata Serca (Map011) | Oś, w którą wpadają wszystkie wątki: trzy „zamki” do Komnaty Serca (klucz z W4, sygnał z W2, pieśń z W3), prawdy o mieszkańcach w Warstwie Prawdy i cztery zakończenia ze `STORY.md`. Stan miasta (Opinia, sojusznicy, kto żyje) zmienia finał. | Akt I (poszlaki) → Akt II (zejście) → Akt III (wybór) | zakończenie; prawdy o mieszkańcach jako wybory | wszystko: walka ze stworami z ruin, Hart ducha, podziemia składane z kawałków, dziennik | mapy podziemi (co 10. piętro ręcznie), Komnata Serca, sceny zakończeń |

### W1. Woda spod Kruczych Skał

Prawda (propozycja): pod wzgórzem jest stara cysterna zakonu. Zakon prowadził z niej wodę kanałem pod rynek (do studni) i do
młynówki. Kiedy z kamieni twierdzy budowano dwór, dziadek Lorda przekopał się do kanału i doprowadził wodę pod dwór. W suszę
dopływ zmalał tak bardzo, że woda płynie już tylko do dworu — stąd zielony ogród, a w mieście studnia daje ledwie parę wiader na dzień i młyn stoi.
Wodospad za halą to przelew cysterny i z tygodnia na tydzień robi się cieńszy. Feliks nocą sprzedaje wodę Kubie, a Kapral
Wit przepuszcza wóz w zamian za działkę.

1. **Poszlaki** (dni 3–15). K8 (Kuba: „nie pytaj”), K10 (woda pachnie różą i żelazem), K26 (zamurowany kanał w studni, kruk),
   K38 (Wit wypuszcza Kubę o 2:00), D8 (soczyste kapusty z dworu), D7 (róża z mokrą ziemią). Trzy poszlaki z sześciu
   otwierają rozdział 2. Wodospad za halą co tydzień jest trochę cieńszy (tylko wygląd), a sołtys liczy dni.
2. **Wóz o drugiej w nocy** (Kuba; rynek → brama wschodnia → tylna furtka ogrodu dworu). Idziesz za wozem, skradając się
   (C); na murach jest Wit z latarnią. Przy furtce Feliks napełnia beczki z pompy w oranżerii. Jeśli cię przyłapią, Wit
   zabiera 10 G „za włóczenie się”, Opinia spada o 3 i próbujesz następnej nocy.
3. **Rozmowa z Kubą** (rynek, 7–14). Wybór: a) obiecujesz milczenie, a Kuba mówi wszystko: płaci Feliksowi 3 G za beczkę,
   a sołtys płaci mu za przydział 9, kapral bierze działkę; b) szantaż — Kuba płaci ci 5 G w każdy dzień targowy, ale skarży się Feliksowi
   (później czeka cię zasadzka na drodze, W7); c) grozisz mu sołtysem — Kuba ucieka na tydzień, piekarnia i kuźnia nie dostają
   przydziału, Baltazar sprzedaje miastu wodę dwa razy drożej (bohaterowi nie sprzedaje nikt) i całe miasto na tym cierpi (Opinia spada).
4. **Suche koryto** (stary młyn, taras rzemieślników). Koryto młynówki znika pod murem w stronę wzgórza. W środku jest
   kamienna krata z krukiem, taka sama jak w studni. Za kratą słychać wodę — płynie, ale nie tutaj. Tadek: „Tej kraty nie kuł
   kowal, tylko zakon”.
5. **Oranżeria nocą** (ogród dworu). Zakradasz się mimo patrolu. Pompa stoi na kamiennym włazie z krukiem: dwór dobudowano na
   kanale zakonu. W szufladzie ogrodnika leży rysunek śluzy z dopiskiem: „zasuwa na dworze, studnia i młyn zamknięte”.
   Zabrany rysunek jest dowodem.
6. **Wielki wybór** (ratusz, drzwi dworu albo rynek w dzień targowy):
   - a) **Ujawnić to na targu** razem z sołtysem. Tłum idzie pod bramę wschodnią; Lord wypiera się albo zrzuca winę na
     Feliksa (zależnie od W7). Śluzę otwierają „do połowy”: w młynówce znów płynie woda i młyn rusza (D2 bez kieratu), ale
     studnia na rynku dalej daje mało. Opinia +15; dwór jest chłodny (żadnych ulg, list z dnia 55 jest ostrzejszy);
     Wita degradują albo staje się ci wdzięczny (W5).
   - b) **Pójść po cichu do Lorda.** Lord prosi o milczenie, Feliks przestaje handlować z Kubą, a „za dyskrecję” dostajesz
     200 G odpisu z długu. Miasto nic nie wie; Kuba zostaje bez towaru, a woda w Kantorze drożeje. Jeśli prawda wyjdzie na
     jaw później (W5, W7), Opinia spada o 20.
   - c) **Szantażować Feliksa**: 20 G co tydzień. Po 2 tygodniach ludzie Feliksa napadają cię na Polnej drodze (walka z
     ludźmi).
   - d) **Milczeć.** Nic się nie zmienia, ale rozdział 7 i tak wraca w Akcie II.
7. **Cysterna zakonu** (Akt II, piętra 11–30). Kanał od studni prowadzi do cysterny pod wzgórzem. Główną zasuwę otwiera sygnał
   „woda” z kodu dzwonu (W2). Po jej otwarciu studnia na rynku się napełnia, ale sołtys zamyka ją na klucz i wydziela domom
   racje. Miasto świętuje: Opinia +20, chleb i woda tanieją, a Kuba wraca do uczciwej roboty (rozwozi racje). **Bohater nie
   dostaje z niej wody** — mieszka na polu dziadka i tam liczy się tylko jego własna studnia (zasada suszy).

### W2. Kod dzwonu

Sygnały (propozycja): **3 + 1** = „obcy w murach” (ktoś puka do Kantoru po północy), **1-1-1-1** = „zmiana warty” (Wit
kończy patrol), **2 + 2 + 2** = „ogień” (burza, płonący stóg), **5** = „brama otwarta nocą” (wóz Kuby), **4 + 2** = „woda
idzie” (pierwszy deszcz po długiej suszy — dawne wezwanie do otwarcia cystern), **7 o północy** = „pytanie” (Noc Pytania,
raz w roku).

1. **Dziwne godziny** (rynek, cały Akt I). Dziwne dzwonienie budzi bohatera w nocy. Godzina i liczba uderzeń trafiają do
   dziennika (nowa notatka „Dzwon”). Po K14 wiesz już, że liczba ma znaczenie.
2. **Uczeń** (D16). Zdobywasz zaufanie Ambrożego i klucz do dzwonnicy. Ambroży przyznaje, że „ma swoje dzwonienia”, ale
   po co dzwoni, nie powie: „Przysięgałem”.
3. **Łączenie** (noce, różne miejsca). Przy każdym sygnale trzeba być świadkiem zdarzenia: 3 + 1 przy Kantorze (W5), 5 przy
   bramie wschodniej (W1), 2 + 2 + 2 w burzy, 4 + 2 przy pierwszym deszczu. Kiedy pasują trzy, dziennik układa je w tabelę.
4. **Rozmowa przy dzwonie** (dzwonnica, 18:00). Pokazujesz Ambrożemu tabelę. Ambroży płacze: jest ostatnim uczniem straży
   zakonu i pilnował dzwonu, „bo nikt nie odwołał warty”. Daje ci klucz do furtki zamkniętego ogrodu (albo wchodzisz dziurą
   w murze z D15).
5. **Ogród rycerzy** (zamknięty ogród). Stoi tu siedem posągów; każdy ma tarczę z nacięciami (od 1 do 7). Kiedy zadzwonisz z
   wieży sygnał „pytanie” (7), w samo południe cienie posągów (słońce ze Sky) wskazują płytę w ścieżce — tę samą wskazuje kość
   z D19. Pod płytą są schody do **Archiwum zakonu**.
6. **Archiwum** (nowa mała mapa). Leżą tu kroniki zakonu: zasada jednego pytania, lista kasztelanów (ostatni był „z rodu
   Kowali” — W4), Księga sygnałów oraz wzmianka o cysternie i zasuwie otwieranej sygnałem (W1). Wybór: zabierz kroniki
   (Baltazar zaoferuje za nie 300 G — W5) / zostaw je / oddaj Ambrożemu.
7. **Jedno pytanie** (dzwonnica, raz w roku). Ambroży ma prawo zadać Sercu jedno pytanie na rok i nigdy go nie użył. Oddaje
   to prawo bohaterowi: w Noc Pytania (zima) możesz zapytać Ambrożego o jedną rzecz z listy (np. „kto zdradzi?”, „gdzie jest
   Marek?”, „co ukrywa dziadek?”), a on odpowiada prawdą z kronik. Jedno pytanie na rok gry — wybierz dobrze.
8. **Alarm** (Akt III). Kiedy frakcja uderza na tawernę, ty albo Ambroży dzwonicie 3 + 1. Przy Opinii 60+ mieszkańcy
   przychodzą z młotami i widłami (Tadek, Ignac, Kuba, uchodźcy) i bronicie się razem. Przy niskiej Opinii drzwi domów
   zostają zamknięte.

### W3. Pieśń o Kruczych Skałach

1. **Siódma ballada** (scena). Po sześciu balladach (`docs/tawerna_zycie/uslugi.md`) Melia opowiada sen: melodię zna, słów
   nie. W dzienniku pojawia się notatka „Siódma ballada” z pustymi wersami.
2. **Rytm** (dzwonnica). Melodia to rytm dzwonu. Ambroży nuci pierwszy wers, „bo tak się kiedyś dzwoniło” (wymaga D16).
3. **Kołysanka zza morza** (obóz). Ludmiła śpiewa Eli kołysankę z kontynentu, „Serce, co nie kłamie”. To druga zwrotka —
   wersja drugiej strony: tam też znają legendę (wymaga K27 albo D10).
4. **Bełkot o drugiej** (tawerna). Ozzy śpiewa przez sen, ale tylko po Miodzie pitnym, tylko o 2:00 i tylko wtedy, gdy masz
   wynajęty pokój (Ozzy śpi w sali). Tak poznajesz trzecią zwrotkę.
5. **Cokoły** (zamknięty ogród). Na cokołach posągów wyryto wersy czwartej zwrotki (trzeba dostać się do ogrodu: D15 albo W2).
6. **Kronika rodu** (biblioteka dworu). Feliks wpuści cię nocą za przysługę, albo Lord sam pokaże kronikę, gdy spłacisz połowę
   długu (W7). Piąta zwrotka: „Dwór z kamieni, kamień pamięta”.
7. **Skąd Melia to zna** (scena, po północy). Propozycja: Melia pochodzi od pieśniarek zakonu. Zakon przechowywał pamięć w
   pieśniach, a nie w księgach, bo księgę można ukraść. Melia płacze albo się śmieje — zależnie od tego, jak jej to powiesz
   (wybór w dymkach).
8. **Gdzie zaśpiewa całość** (wybór):
   - a) **Publicznie w Noc Kupały** (ognisko na łące za bramą południową). Całe miasto słyszy prawdę, Opinia +10, Melia
     staje się sławna. Słyszą ją jednak i ludzie Baltazara: tej samej nocy próbują ją porwać (walka, obrona sceny), a frakcja
     przyspiesza (W5, W8).
   - b) **Tylko dla Borgara** (zamknięta tawerna, po 23:00). Borgar w końcu wierzy (W4 idzie szybciej).
   - c) **Spalić słowa.** Drogę znasz tylko ty, a Melia traci „natchnienie” i już nie śpiewa starych ballad (Natchniony na
     stałe słabszy). Najbezpieczniej i najsmutniej.
   W każdym wariancie dostajesz skrót przez piętra 1–10 (wers „trzeci schodek pusty”), a Natchniony daje +15% doświadczenia.

### W4. Krew kasztelana

1. **Na szczęście** (bar). Nad barem wisi połowa starego klucza. Borgar: „Dziadek mówił: nie zdejmuj, nie pytaj”. Gdy po raz
   trzeci usłyszysz od niego „nie pytaj o to, czego nie chcesz wiedzieć”, możesz zapytać, skąd ma to powiedzenie (wybór w
   rozmowie).
2. **Kowale z twierdzy** (kuźnia). Borgar pożycza ci klucz na jeden dzień (przy Opinii ≥ 40 albo po D3), a Tadek go ogląda:
   to zakonna robota, połowa klucza-pieczęci. „Kowal to u Borgarów nie zawód, tylko tytuł. Kowale kuli zamki zakonu”.
3. **Gdzie jest druga połowa** (tawerna, dom dziadka). Ballada „Ostatni kasztelan” mówi: „Klucz zakopał, zatarł ślad”. Lord
   pytał o kamienie z krukiem na polu dziadka (K32). Dziadek Stach przypomina sobie, że przy miedzy leży stary kamień —
   „zawsze się go orało dookoła”.
4. **Cień kamienia** (pole dziadka). Pierwszego dnia lata (dzień 29) w samo południe cień kamienia z krukiem wskazuje miejsce
   (cienie słońca ze Sky). Kopiesz łopatą. Jeśli kopiesz za dnia, z drogi może cię zobaczyć Feliks — porę wybierasz sam.
5. **Lord chce być pierwszy** (drzwi dworu). Jeśli Feliks cię widział, Lord wzywa cię do siebie: „Mówiłem: przyjdź najpierw do
   mnie”. Wybór: oddaj połowę klucza Lordowi (250 G odpisu z długu, ale W7 robi się trudniejszy) / skłam (dwór cię nie lubi,
   Feliks zaczyna cię szpiegować) / pokaż, ale nie oddawaj.
6. **Kucie nocą** (kuźnia, po 21). Tadek po cichu łączy połówki w palenisku (2× Żelazo i węgiel). Bierze za to 30 G albo
   przysługę z D7.
7. **Konfrontacja** (tawerna po zamknięciu; najlepiej po spłacie długu). Pokazujesz Borgarowi klucz i listę kasztelanów (W2).
   Borgar wpada w złość i zamyka tawernę na dzień (nie ma zmiany!). Następnej nocy przychodzi sam: babka kazała mu „pilnować
   piwnicy i nie pytać”. To, co zrobi Borgar, zależy od twoich wcześniejszych wyborów: albo zejdzie z tobą w dół (towarzysz w
   Akcie II), albo stanie w piwnicy jako strażnik („zejdziesz — nie wracaj do pracy”).
8. **Komnata Serca** (Akt III). Klucz otwiera ostatnie drzwi. Jeśli Borgar jest z tobą, w finale może zająć miejsce strażnika
   zamiast bohatera (zakończenie „strażnik”).

### W5. Towary z kontynentu

1. **Dziwny kupiec** (dni 10–20). K15, K16, D9 (beczki „wina”), D11 (zgaszone kosze). Kiedy ktoś puka po północy do Kantoru,
   Ambroży dzwoni 3 + 1 (W2).
2. **Trzy stuknięcia** (tylne drzwi Kantoru, 23–1). Obserwujesz gości: zakapturzonego człowieka z promu, Feliksa (raz w
   tygodniu!), raz nawet Gruma. Idziesz za jednym z nich przez bramę południową na Skraj lasu — tam przy ognisku jest obóz
   przemytników.
3. **Nocny tragarz** (Kantor). Baltazar cię zatrudnia, jeśli ma do ciebie zaufanie (K15 bez otwierania skrzyni albo sprzedana
   walka w D6): 20 G za noc, od 22 do 2, ładowanie skrzyń na wóz. Co noc widzisz więcej: worki zboża z rekwizycji (D14),
   kamienie z krukiem skupowane od ludzi „na pamiątki”, zwoje map wyspy.
4. **Rejestr** (gabinet Baltazara). Trzeciej nocy Baltazar wychodzi o 0:30 na 20 minut. W tym czasie zabierz albo przepisz
   rejestr (skradanie na czas). W rejestrze: „K.W. — 5 G/tydz.” (Kapral Wit), „F.” (Feliks), „G.Ż.P.” (Grum), „kamienie z
   krukiem → do sztabu [frakcja]” i „czekamy na drzwi pod skałą”.
5. **Komu to dać** (wybór):
   - a) **Kapralowi Witowi.** Wit sam jest w rejestrze. Jeśli ci ufa (D5), przyznaje się i staje po twojej stronie
     (sojusznik w finale). Jeśli nie — rejestr „ginie”, a ciebie straż zatrzymuje na noc (tracisz zmianę).
   - b) **Sołtysowi i miastu.** Zebranie w ratuszu: Kantor zostaje zamknięty, Opinia +12. Baltazar ucieka promem i wraca w
     Akcie II z najemnikami.
   - c) **Podwójna gra.** Oddajesz Baltazarowi kopię, pracujesz dalej (30 G tygodniowo) i donosisz, komu chcesz. Baltazar
     chce cię w Akcie II jako przewodnika po piwnicach: schodzisz wcześniej, ale frakcja idzie za tobą.
   - d) **Szantaż.** 50 G jednorazowo, ale od tej chwili Baltazar jest twoim wrogiem (ceny dwa razy wyższe, nocny napad).
6. **Noc promu** (Polna droga; wóz jedzie do przystani). Po kolejnej bitwie szykuje się wielki ładunek: kamienie z krukiem i
   porwany Rafał (jeśli w W6 źle go ukryłeś). Przy wozie jest zasadzka: walczysz z ludźmi Baltazara (bandyci, łucznik) albo
   po cichu podmieniasz skrzynie.
7. **Co dalej z Kantorem** (Akt II). Jeśli jest zamknięty, miasto nie ma towarów z kontynentu (żelazo i stal tylko z twojej
   kuźni). Jeśli przejmie go Ludmiła albo sołtys, staje się uczciwym sklepem z cenami niższymi o 10%. Jeśli Baltazar jest w
   twojej garści, masz tanie żelazo i stal, ale frakcja wie o każdym twoim kroku w podziemiach.

### W6. Ludzie z promu

1. **Pierwsza fala** (dzień 10, obóz). Prom po bitwie przywozi ludzi i pod murem staje pięć namiotów. Sołtys: „Nie mamy wody
   dla swoich”. K19, K27, K28, K29.
2. **Chleb i gorączka** (dni 11–20). D4 (Ela i chleb), D10 (gorączka Eli). Obóz coraz bardziej ci ufa.
3. **Kim był Rafał** (obóz, noc, przy ognisku). Kiedy w pełni ci ufa, Rafał opowiada, że był kopaczem w wyprawie, która szuka
   „drzwi pod skałą” od strony gór. Uciekł, gdy „jeden z nas dotknął czegoś w skale i przestał mówić”. Marek, mąż Ludmiły,
   był w tej samej drużynie.
4. **List gończy** (tablica zleceń w tawernie). Na tablicy pojawia się kartka POSZUKIWANY — tym razem z człowiekiem: Rafał,
   120 G (od Kaprala, z rozkazu dworu). Wybór: a) ukryj Rafała — w pokoju w tawernie na 7 dni, w chacie na polu dziadka albo u
   Ambrożego w dzwonnicy (każde miejsce może zostać przeszukane); b) wydaj go — 120 G i życzliwość Lorda, ale Ludmiła cię
   znienawidzi, Ela płacze, a Rafał wraca w Akcie II jako wróg; c) przemyć go promem przez Baltazara (50 G; łączy się z W5).
5. **Druga fala** (dzień 24). Namiotów przybywa, przy beczkach Kuby są kłótnie o wodę. W ratuszu zebranie: czy zamknąć bramę
   dla nowych? Twój głos waży tyle, ile twoja Opinia. a) Zamknąć — w mieście spokój, ale obóz staje pod murem od zewnątrz
   (nocą wilki! — D5 robi się trudniejsze). b) Wpuścić z obowiązkiem pracy — uchodźcy chodzą przy kieracie (D2) i pomagają
   ci w żniwach (przez tydzień 2 pomocników na polu dziadka sami zbiera plony).
6. **Zima** (dni 85+). D18 (płaszcze), wspólna Wigilia w obozie albo w tawernie (gotujesz dla wszystkich, Opinia +10).
7. **Marek** (Akt II, kopalnia, piętra 31–50). Marek żyje w tunelach obozu kopaczy, ale „wie za dużo” i milczy — jak ludzie z
   Osady Milczących. Wyprowadzenie go to walka i ucieczka. Jego powrót do Ludmiły i Eli to najcieplejsza scena gry. Potem
   Marek pomaga bronić tawerny.

### W7. Dwór z kamieni twierdzy

Do wyboru autora (`STORY.md` zostawia to otwarte):

- **Wariant A — Lord nic nie wie.** Lord jest próżny i naiwny, wierzy w „bajkę”. Feliks od lat sprzedaje frakcji wodę,
  informacje i kamienie. Gdy Lord pozna prawdę, łamie się i staje się sojusznikiem.
- **Wariant B — Lord wie.** Lord finansuje jedną ze stron wojny za obietnicę tytułu. Feliks jest wierny, ale przerażony — i
  to on wyjawia prawdę bohaterowi.

1. **Dług** (dni 1–60). Spłaty przy drzwiach (8–20) albo nocą u Feliksa (Story); K30, K31, K32, D17. Odpisy z długu za
   wybory: zlecenia Feliksa na tablicy, D14 (oddane zboże), W1 b (milczenie), W4 (połowa klucza), K37 (sakiewka).
2. **Zaproszenie** (po spłacie 1250 G). Lord pierwszy raz wpuszcza bohatera do holu. Ściany są z kamieni twierdzy, na co
   dziesiątym wyryto kruka. Lord pokazuje kronikę rodu („to bajki, ale ładne”) — piąta zwrotka (W3).
3. **Dwa życia Feliksa** (rano rynek, nocą furtka ogrodu i tylne drzwi Kantoru). Śledzisz Feliksa przez całą dobę: 6–9 zakupy,
   9–20 dwór, o 2:00 woda dla Kuby (W1), raz w tygodniu o północy Kantor (W5). Z notatek w dzienniku składa się plan dnia
   Feliksa.
4. **Gabinet** (wnętrze dworu, noc). Wchodzisz przez oranżerię (W1, rozdział 5) albo jako gość. W gabinecie leżą listy: w
   wariancie A pisane ręką Feliksa, w wariancie B z pieczęcią Lorda. Wybór: zabierz je, przepisz albo zostaw.
5. **Ostatnia spłata** (drzwi dworu, do świtu dnia 61). Feliks przynosi pokwitowanie, dziadek dziękuje. Haczyk: Lord opowiada
   rodzinną bajkę o drzwiach pod Kruczymi Skałami — „gdybyś coś znalazł, przyjdź najpierw do mnie”.
6. **Do kogo najpierw** (Akt II). Z każdym znaleziskiem z podziemi idziesz do Lorda (płaci 100 G tygodniowo i daje ekwipunek,
   ale jego ludzie schodzą za tobą), milczysz (Feliks szpieguje i donosi frakcji) albo kłamiesz (gdy to wyjdzie na jaw: wrogość
   dworu, wyższe myto, straż przeszukuje twoją chatę).
7. **Lord przy Sercu** (Akt III). Lord chce zadać swoje jedno pytanie (propozycja: „czy mój syn zginął na wojnie przeze
   mnie?”). Pozwolić mu, odmówić czy zapytać za niego — to jedna z prawd, które w zakończeniu zmieniają dwór.

### W8. Żelazna Pięść

1. **Pytania o góry** (tawerna). Grum wypytuje o jaskinie na wschodzie. Rozmowę otwierają wygrane w siłowaniu i w kości.
2. **Przewodnik** (Góry i kamieniołom, o świcie). Grum płaci 50 G za wyprawę. Musisz znać drogę i przeżyć dzień z dala od
   domu: jedzenie, woda w bukłaku, zioła. Pierwsza wyprawa prowadzi do starego kamieniołomu, z którego brano kamień na
   twierdzę i na dwór.
3. **Obóz kopaczy** (Jaskinia). Ludzie frakcji drążą tunel w stronę Kruczych Skał. Jest wśród nich Marek (W6) — milczy i
   patrzy w ścianę. Grum blednie.
4. **List z rozkazem** (tawerna; list przychodzi przez Baltazara). Rozkaz brzmi: „Znaleźć wejście za każdą cenę. Świadków nie
   zostawiać”. Grum pokazuje ci go po pijanemu albo podsłuchujesz go z pokoju obok (w tawernie ściany są cienkie).
5. **Co Serce robi z człowiekiem** (Osada Milczących, Akt II). Grum widzi ludzi, którzy „wiedzieli za dużo”.
6. **Wybór Gruma.** Żeby go przeciągnąć, potrzebujesz dwóch rzeczy z trzech: uratowanego Marka (W6), kronik zakonu (W2) i
   wygranego finałowego siłowania „na honor”. W przeciwnym razie walczysz z Grumem przy wejściu do tuneli (najemnik z tarczą:
   ciężki cios albo atak w plecy) albo pracujesz dla frakcji (pieniądze, ale frakcja idzie z tobą do Serca).
7. **Przy drzwiach tawerny** (Akt III). Kiedy frakcja uderza, Grum stoi z tobą, przeciw tobie albo odpływa promem —
   zależnie od twojego wyboru.

### W9. Serce Twierdzy (oś główna)

1. **Legenda jako żart** (Akt I). Ballady Melii, bełkot Ozzy'ego, „Grzyby za opowieść” i „Deski do piwnicy” z tablicy
   zleceń, przepowiednie Ozzy'ego (D13), rysunek Eli (D4).
2. **Za luźną cegłą** (Map009). Przez D12 (kot) albo samą cegłę. Pierwsze schody w dół. Borgar (W4) wie o tym albo nie.
3. **Ruiny pod spodem** (Map010, piętra 1–10). Magazyny i pierwsze zapiski zakonu, skrót z pieśni (W3). Pojawia się rywal z
   zewnątrz: Baltazar (W5), Grum (W8) albo ludzie Lorda (W7) — ten, kogo nie przeciągnąłeś na swoją stronę.
4. **Kwatery i kaplica** (piętra 11–30). Sala rytuału jednego pytania i cysterna (W1, rozdział 7).
5. **Jaskinie i podziemna rzeka** (piętra 31–50). Połączenie z tunelem kopaczy (W8) i Marek (W6).
6. **Warstwa Prawdy** (piętra 76–99). Bohater zaczyna „wiedzieć”: poznaje prawdy o Kubie, Feliksie, Hance, Borgarze i
   dziadku Stachu. Przy każdej wybierasz, czy po powrocie powiesz o niej tej osobie, czy przemilczysz — to zmienia waszą
   relację.
7. **Komnata Serca** (piętro 100 / Map011). Trzy zamki: klucz kasztelana (W4), sygnał „pytanie” (W2) i pieśń (W3).
   Propozycja: wystarczą dowolne dwa, a trzeci daje lepsze zakończenie.
8. **Wybór** (Akt III, jak w `STORY.md`): zniszczyć Serce / zostać strażnikiem (albo oddać to miejsce Borgarowi lub
   Ambrożemu) / uwolnić prawdę / zapieczętować Serce z zasadami. Epilog miasta zależy od Opinii, sojuszników (Wit, Grum, Rafał,
   Marek, Borgar) i od tego, co zrobiłeś z wodą (W1).

---

## 5. Życie miasta — zdarzenia dnia i tygodnia

### 5.1 Doba

| Godzina | Co się dzieje | Gdzie | Questy |
|---|---|---|---|
| 3:30–4:00 | Hanka rozpala piec | piekarnia | K4 |
| 6:00 | dzwon (6 uderzeń); Hanka otwiera stragan; Feliks robi zakupy (6–9) | rynek | K5, K30 |
| 6–17 | Tadek przy palenisku | kuźnia | K1–K3, D3 |
| 7:00 | Kuba z beczkami przy studni na rynku (daje mało), kolejka | rynek | K8–K10 |
| 7–17 | Ignac garbuje i szyje | garbarnia | K20–K22, D1 |
| 8–20 | Lord przed drzwiami dworu; Wit przy bramie wschodniej (myto) | brama wschodnia, dwór | K11, Story |
| 8–16 | sołtys w ratuszu | ratusz | K17–K19, D9, D17 |
| 12:00 | dzwon (12); Hanka zamyka stragan | rynek | K13 |
| 12–17 | Bronek i Zosia bawią się na rynku | rynek | K23–K26 |
| 14:00 | Kuba zamyka beczki | rynek | — |
| 16–21 | zmiana w tawernie; wieczorem siłowanie (Tadek, Grum), kości, rzutki | tawerna | D6, K39 |
| 18:00 | dzwon (18); Melia na scenie (18–24) | dzwonnica, tawerna | K14, K22, W3 |
| 21:00–5:00 | Wit z latarnią na murach, płoną kosze żarowe | mury, bramy | K12, K38, D11 |
| 23:00–1:00 | goście Kantoru (trzy stuknięcia) | tylne drzwi Kantoru | W5 |
| 2:00 | Kuba z pustym wozem przez bramę wschodnią | rynek → dwór | W1 |
| dziwne godziny | sygnały Ambrożego | dzwonnica | W2 |

### 5.2 Tydzień

- **Dzień targowy co 7 dni** (7, 14, 21…): 2–3 stragany wędrownych kupców (nasiona, narzędzia, a czasem oszust z „odłamkiem
  reliktu”), drugi stragan do wynajęcia (D8), Lord w mieście w godzinach 10–12 (K37), turnieje (D6), wędrowny gracz w kości
  (K39). Warzywa są wtedy droższe, chleb tańszy.
- **Prom co 3 dni** (propozycja; w te same dni, w które pojawiają się nowe kartki na tablicy): w Kantorze nowe towary, w
  tawernie nowi goście tymczasowi (`STORY.md`), wieści z wojny (Baltazar, Rafał, Ozzy).
- **Tablica zleceń co 3 dni** (już jest).

### 5.3 Pogoda i susza

- **Licznik dni bez deszczu** (w grze: dziennik, Kalendarz miasteczka). Przydział od Kuby dla domów i warsztatów maleje co 2 dni
  suszy (bohater przydziału nie dostaje). Chleb drożeje o 1 G co 5 dni. Rośnie liczba kłótni w kolejce (K9) i spada zaufanie do sołtysa. Wodospad za halą robi
  się cieńszy (tylko wygląd).
- **Deszcz.** Wszyscy wystawiają na rynek beczki i garnki (scena), przydziały wracają do normy, dzieci skaczą po kałużach
  (Puddles), a po pierwszym deszczu Ambroży dzwoni 4 + 2.
- **Burza.** Ambroży nie dzwoni (piorun!), a po uderzeniu daje sygnał „ogień”. Stóg może się zapalić (K34), Kantor jest
  zamknięty, a Wit chowa się w baszcie — to najlepsza noc na śledzenie. W suszę pożar jest naprawdę groźny.
- **Śnieg.** K35, zimno, obóz cierpi (D18).

### 5.4 Święta i zdarzenia roku

| Kiedy | Co | Co się dzieje | Questy |
|---|---|---|---|
| wiosna, dni 13–16 (już w kalendarzu) | Wielkanoc | Hanka zbiera 12 jajek na pisanki; dzieci szukają pisanek na rynku (na czas); śmigus-dyngus bez wody — sołtys zakazał, więc dzieci obsypują się mąką | krótkie zadania świąteczne |
| lato, dzień 14 (dzień 42) | Noc Kupały | ogniska na łące za bramą południową (w suszę — Wit pilnuje), wianki puszczane na stawie za halą, kwiat paproci w lesie (jedna noc w roku) | W3 a, D7 |
| ostatni dzień lata (dzień 56, też targ) | Dożynki | wieniec z jęczmienia z pola dziadka; konkurs na największą kapustę (wygrywa zawsze dwór — W1); uczta Lorda dla miasta; Lord publicznie przypomina o długu dziadka (4 dni do terminu); śpiewa Melia | W1, W7, D3 |
| zima, dni 12–16 (Wigilia już w kalendarzu) | Wigilia i Noc Pytania | o północy Ambroży bije 7 razy; „w Wigilię zwierzęta mówią ludzkim głosem” — Mruczek mówi jedno prawdziwe zdanie (zabawne echo Serca); Wigilia w obozie | W2 rozdz. 7, W6 rozdz. 6 |
| dni 10, 24, 38, 52 (propozycja: co 14 dni w rozdziale 1) | prom po bitwie | nowi uchodźcy (obóz rośnie), 2 dni później rekwizycja, ceny przez tydzień wyższe o 10%, nowe twarze w tawernie | W6, D14, W5 rozdz. 6 |
| dzień 33 (propozycja) | imieniny Lorda | u drzwi dworu kolejka z prezentami | K31 |

---

## 6. Kolejność i powiązania

### 6.1 Co otwiera co

```
K8, K10, K26, K38, D7, D8 ──(3 z 6 poszlak)──> W1 rozdz. 2 ──> ... ──> W1 rozdz. 6 (wielki wybór)
K14 ──> D16 (Opinia 40) ──> W2 rozdz. 2;   K23, K33, D15, D19 ──> wejście do ogrodu (W2 rozdz. 5)
6 ballad (TavernLife) + K22 ──> W3;   K27/D10 ──> zwrotka Ludmiły;   D16 ──> zwrotka Ambrożego
K32 ──> W4 rozdz. 3;   D3 albo Opinia 40 ──> W4 rozdz. 2;   W2 rozdz. 6 (lista kasztelanów) ──> W4 rozdz. 7
K15, K16, D9, D11, D6 (sprzedana walka) ──> W5 rozdz. 2–3
K19, K27–K29, D4, D10 ──> W6 rozdz. 3;   W6 rozdz. 4 c <──> W5 (przemyt Rafała)
K30–K32, D14, D17 ──> W7 rozdz. 1–2;   W1 rozdz. 5 (oranżeria) ──> W7 rozdz. 4 (gabinet)
D6 + kości z Grumem + Sława w tawernie 40 ──> W8
D12 ──> W9 rozdz. 2;   D13 ──> zaufanie Ozzy'ego (W9)
W2 (sygnał „woda”) ──> W1 rozdz. 7;   W2 + W3 + W4 ──> W9 rozdz. 7 (trzy zamki)
```

### 6.2 Rozdział 1 (dług) — proponowana kolejność

| Dni | Pora roku i wydarzenia | Questy w mieście | Złoto z miasta (orientacyjnie) |
|---|---|---|---|
| 1–4 | wiosna; dziadek, pole, Borgar, pierwsza zmiana; pierwsza wizyta w mieście | K1, K4, K5, K8, K11, K17, K20 | 60–80 G |
| 5–9 | dzień 7: pierwszy targ | K2, K3, K7, K10, K13, K21, K23, K30, K32; początek D1 | 80–110 G |
| 10–16 | dzień 10: pierwsza fala; dni 13–16 Wielkanoc; dzień 14: targ | K14–K16, K19, K25–K29, K37; D4 (od 11), D6, D8, D15 (od 12) | 150–200 G |
| 17–23 | dzień 20: list Lorda; Opinia ~40 | K38, K39; D3, D5, D9, D12 (od 20), D16, D17; W1 rozdz. 2 | 180–250 G |
| 24–28 | dzień 24: druga fala, potem rekwizycja | D10, D11, D14; W5 rozdz. 2–3; W2 rozdz. 3; W6 rozdz. 4–5 | 150–200 G |
| 29–42 | lato; dzień 29: cień kamienia (W4); dzień 33: imieniny; dzień 38: trzecia fala; dzień 40: list; dzień 42: Noc Kupały | K6, K31; D2, D7, D13; W1 rozdz. 3–5; W3 (zbieranie zwrotek, finał a); W4 rozdz. 4–6; W5 rozdz. 4–5 | 200–300 G |
| 43–56 | dzień 52: czwarta fala i noc promu; dzień 55: list; dzień 56: dożynki | W1 rozdz. 6 (wielki wybór); W2 rozdz. 4–5; W5 rozdz. 6; W7 rozdz. 2–4; D8 w dni targowe | 150–300 G (plus ewentualne odpisy z długu) |
| 57–60 | jesień; listy w dniach 59 i 60 | ostatnie spłaty, W7 rozdz. 5 (haczyk); konfrontacja z Borgarem (W4 rozdz. 7) dopiero **po** spłacie, żeby zamknięta tawerna nie kosztowała zmiany przed terminem | — |

Razem, jeśli zrobi się prawie wszystko: ok. 1000–1400 G, ale w praktyce gracz zrobi mniej więcej połowę (ok. 600 G, czyli
około jednej czwartej długu). Resztę dają zmiany u Borgara, tablica zleceń i sprzedaż. Kwoty trzeba zestroić razem z tablicą
i zmianami w nocnym maratonie — questy miasta mają dawać pieniądze „ciekawe”, a nie „konieczne”.

### 6.3 Akt II i dalej

1. **Wejście:** spłacony dług (W7 rozdz. 5) i luźna cegła (W9 rozdz. 2; D12 może ją otworzyć wcześniej).
2. **Równolegle w Akcie II:** W2 rozdz. 6–7 (archiwum, Noc Pytania zimą), W4 rozdz. 7–8 (Borgar), W5 rozdz. 7 (Kantor), W6
   rozdz. 6–7 (zima, Marek), W8 rozdz. 2–6 (góry, Grum), W1 rozdz. 7 (cysterna), W3 — jeśli nie została skończona w Noc
   Kupały. Zejście w głąb (W9 rozdz. 3–6) idzie piętro po piętrze, a wątki dorzucają skróty i sojuszników.
3. **Akt III:** W9 rozdz. 7–8 (Komnata Serca, wybór); alarm dzwonu i obrona tawerny (W2 rozdz. 8); Grum przy drzwiach (W8
   rozdz. 7); Lord przy Sercu (W7 rozdz. 7). Wszystko, co wydarzyło się w mieście, decyduje, kto stanie obok bohatera.

### 6.4 Zbiorczo: co trzeba dobudować

- **Systemy:** silnik questów z zakładką w dzienniku; Opinia w miasteczku; plany dnia mieszkańców (powstają) razem z nocnymi
  trasami (Kuba, Feliks, goście Kantoru); wybory z konsekwencjami w dymkach; mini-gra dzwonu; mini-gra targowania; noszenie
  kota i ciężkiej skrzyni; uciekający i śledzony NPC; licznik dni bez deszczu i przydziały od niego zależne; fale uchodźców (obóz
  rośnie); prom (choćby jako wieść i wóz); tropienie zapachu przez psa; przepowiednie Ozzy'ego czytane z planu pogody.
- **Mapy i wnętrza:** piekarnia, dzwonnica, Kantor (piwnica i gabinet), młyn (kierat), dwór (hol, biblioteka, gabinet,
  oranżeria), dno studni, kanał pod rynkiem, Archiwum zakonu, obóz przemytników i obóz kopaczy (jako zdarzenia na Skraju lasu i
  w Jaskini), podpięte Góry (Map013) i Jaskinia (Map014), opcjonalnie przystań. Drzwi wnętrz z koncepcji miasta są już na
  mapie (napis „Zamknięte.”).
- **Przedmioty:** Łój, Struna, Drewniany konik, Podkowa, Buty łowcy, Podkute buty, Pas siłacza, dwie połówki klucza i Klucz
  kasztelana, Rejestr Baltazara, Petycja, Księga sygnałów, Rysunek śluzy, Kamyk z krukiem, Kość z Kruczych Skał (już jest w
  TavernDice — nadać jej znaczenie).
- **Postacie (w stylu bohatera):** 8 mieszkańców, Bronek i Zosia z matką, Ludmiła i Ela, Rafał, Feliks na mapie miasta,
  wędrowny gracz w kości, złodziejaszek, sąsiedzi od stogu, Marek (Akt II).
