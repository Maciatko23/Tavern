# Sześć nowych miejsc: pakiety dla agentów

Wersja z 2026-10-16. Koncepcja zatwierdzona w całości (`docs/miejsca_wyspy/KONCEPCJA.md`, wszystkie rekomendacje z punktu 11).
Ten plik mówi każdemu agentowi fali: **co jest jego, czego mu nie wolno ruszać i jak korzystać ze wspólnych części.**

---

## 0. Stan rusztowania (pakiet 0)

**Zrobione i działa w grze już teraz** (zmiany wstecznie zgodne, sprawdzone testami):
- `js/plugins/TawernaCore.js` - rejestr numerów zdarzeń 600-699 (punkt 2).
- `js/plugins/TownLife.js` v1.4.0 - mieszkańcy z innych wtyczek przez `window.TownLifeExtra`, ze **stałym numerem**; miejsce w
  pomieszczeniu z danych (`TownLifeData.SPOTS_BY_MAP[mapa][nazwa]`), gdy mapa nie ma zdarzenia „Miejsce:”.
- `js/plugins/TownQuests_Data.js` - zadania z innych wtyczek przez `window.TownQuestsPacks` (zadania, miejsca, rzeczy, uwagi, plotki).
- Nowe pliki wtyczek: `Wyspa_Data.js`, `Wyspa.js` i 12 szkieletów pakietów (`Pustelnia_Data.js` / `Pustelnia.js`, `Kruk_Data.js` /
  `Kruk.js`, `Latarnia_Data.js` / `Latarnia.js`, `Garnizon_Data.js` / `Garnizon.js`, `Wrak_Data.js` / `Wrak.js`, `Cysterna_Data.js` /
  `Cysterna.js`).
- Test `tests/wyspa_szkielet_test.js` 17/17 (port 9495); `tests/smoke/fixtures.js` 13/13, `town_life_test` 10/10,
  `podgrodzie_life_test` 14/14 na prawdziwej grze.

**Przygotowane, ale jeszcze NIE zainstalowane** (zapis do `data/` i `js/plugins.js` zablokowały uprawnienia sesji - instaluje
koordynator albo użytkownik, przy zamkniętym edytorze):
- `tools/miejsca_wyspy/staging/data/`: szkielety map 155-157, 159-163, 165-167, `MapInfos.json` (wpisy tych map), `Items.json`
  (177 Tran, 178 Mapa z zaznaczeniami, 179 Obrączka z krukiem), `System.json` (przełączniki 17-20).
- `tools/miejsca_wyspy/staging/js/plugins.js`: 14 nowych wtyczek na stałych miejscach.
- `tools/miejsca_wyspy/staging/ZMIANY.txt`: co się zmienia i skróty SHA-256 oryginałów z chwili przygotowania.

**Instalacja (raz, przed falą 1):**
1. Edytor RPG Maker zamknięty (`tasklist` tuż przed każdym zapisem).
2. Jeśli od przygotowania coś zmieniło `data/MapInfos.json`, `data/Items.json`, `data/System.json` albo `js/plugins.js` (porównaj
   SHA-256 z `ZMIANY.txt`), najpierw `python tools/miejsca_wyspy/rusztowanie_staging.py` - przygotuje pliki od nowa z bieżących.
3. Kopie oryginałów do `backup_art_2026-10-16/miejsca_wyspy/` (część już tam jest), potem skopiować `staging/data/*.json` →
   `data/` i `staging/js/plugins.js` → `js/plugins.js`. Szkieletów map, które już są w `data/`, nie nadpisywać.
4. Sprawdzenie: `CDP_PORT=9495 node tests/wyspa_szkielet_test.js` (bez nakładki) - 17/17.
5. Użytkownik: po instalacji otworzyć projekt w edytorze na nowo (inaczej zapis z edytora cofnie zmiany), raz zajrzeć do Menedżera
   wtyczek przed zapisem.

**Do czasu instalacji** agent może testować na nakładce: `GAME_OVERLAY=tools/miejsca_wyspy/staging` (dane z folderu roboczego) i
`beforeLoad` z `tests/wyspa_szkielet_test.js` (dopisuje 14 wtyczek do listy). Lepiej jednak zacząć falę po instalacji.

---

## 1. Zasady dla każdego agenta fali

- **Pisz po polsku**: teksty w grze, opisy wtyczek, dokumenty, raport. Kod i komentarze w kodzie mogą być po angielsku jak w reszcie.
- **Edytor może być otwarty u użytkownika.** Przed KAŻDYM zapisem do `data/` sprawdź `tasklist` osobnym krokiem. Jeśli RPG Maker
  działa - nie zapisuj, napisz koordynatorowi. Pliki JSON zapisuj binarnie, z końcówkami linii LF i układem edytora (jeden wpis
  w wierszu, tak jak `nslib.write_map`).
- **Kopie** wszystkiego, co nadpisujesz: `backup_art_<data>/<pakiet>/`.
- **Nie commituj.** Commit i push robi tylko użytkownik.
- **Testy:** tylko Twój test i testy bezpośrednio dotknięte. Nigdy pełnej serii (`tests/run.js full`), nigdy cudzego portu. Serwer gry:
  `node tools/serve.js` (port 8765), uruchom w tle, jeśli nie odpowiada.
- **PixelLab:** limit 10 zadań naraz jest wspólny dla wszystkich sesji. Trzymaj się 3-4 zadań naraz. Każda postać w stylu bohatera
  (pro, `style_character_id` = bohater `bf29bbe1-35e0-4a01-b0e8-f8b502b9f196`, 64×64, `tools/npc/build_npc.py`), **nigdy RTP**.
  Popiersia przez `tools/busts/kit.py` (0 generacji). Budynki „prosto z przodu”, cienki piksel (zasada z 2026-09-24).
- **Każde światło to płomień** (ciepła poświata i migotanie, jak ognisko).
- **Woda jest rzadka.** Żadnych nowych źródeł wody. Każda mapa z morzem ma w notatce `<Water:salt>` (wtedy `CzerwonaWoda.js` robi
  morze czerwone i trujące, a `Farming_Plots` nie daje go pić). Jedyny wyjątek to czerpak cysterny (pakiet F) według zasad koncepcji.
- **Braki** (narzędzie, materiały, siły) zawsze jako popup nad bohaterem (`Tawerna.popup`), nigdy okno wiadomości.
- **Mapy użytkownika zostają.** Plików Map001, Map008, Map013, Map025, Map111, Map125, Map147 (i każdej innej mapy, która nie jest
  Twoja) NIE zmieniasz. Na cudzej mapie możesz tylko wstawiać zdarzenia w kodzie (`Tawerna.inject`, Twoje numery) albo podmieniać
  listę zdarzenia w kodzie (jak furtka ogrodu w K33).
- **Brama Aktu II:** `Wyspa.actTwo()` (= `Story.chapterEnded()`: dług spłacony albo pole stracone).
- **Na koniec** napisz koordynatorowi krótko: co zrobione, testy, co czeka na integrację (lista łat do plików wspólnych), ile
  generacji PixelLab.

---

## 2. Numery i porty

| pakiet | właściciel (`owner` w `Tawerna.inject`) | mapy | zdarzenia | mieszkańcy TownLife | zadania | test / port |
|---|---|---|---|---|---|---|
| **A** Pustelnia | `Pustelnia` | 155, 156 | 600-609 | 944 `pustelnik` | K50, D23, W2 rozdz. 7 | `tests/pustelnia_test.js` / 9501 |
| **B** Urwisko i kruk | `Kruk` | 157 | 610-629 | - | K51, D24 | `tests/kruk_test.js` / 9502 |
| **C** Latarnia | `Latarnia` | 159, 160, 161 | 630-639 | 943 `latarnik` | K49, D22, W11 | `tests/latarnia_test.js` / 9503 |
| **D** Garnizon | `Garnizon` | 162, 163 | 640-669 | 945 `rotmistrz`, 946 `kwatermistrz`, 947 `werbownik` | K52, D26, D27 | `tests/garnizon_test.js` / 9504 |
| **E** Wrak i rozbitek | `Wrak` | 165, 166 | 670-679 | 948 `rozbitek` | D25, W12 | `tests/wrak_test.js` / 9505 |
| **F** Cysterna | `Cysterna` | 167 | 680-689 | - | D28, K53 | `tests/cysterna_test.js` / 9506 |
| koordynator | `Wyspa` | - | 690-699 | 949 wolny | - | `tests/wyspa_szkielet_test.js` / 9495 |

- **Numery zadań przesunięte** względem pierwszej wersji koncepcji: D21 zajęła „Spalona zagroda” (Homes.js), więc długie zadania mają
  D22-D28. Lista z tytułami: `WyspaData.QUESTS` i `WyspaData.QUEST_TITLES`.
- Wolne mapy w zapasie: 158, 164. Zajęte przez inne prace: 154, 168, 169 (domy). Zdarzenia 700-729 to Homes.js.
- Przełączniki (nazwane w `System.json`): 17 `Wyspa_KrataUrwisko` (ustawia F), 18 `Wyspa_ZasuwaCysterny` (F), 19 `Wyspa_MglaPrzyladek`
  (C), 20 `Wyspa_Odplyw` (ustawia `Wyspa.js` co sekundę według pływów).
- Przedmioty: 177 Tran (C), 178 Mapa z zaznaczeniami (E), 179 Obrączka z krukiem (B). Ikony są teraz zastępcze (z RTP); docelowe pola
  IconSet 438-440 - pakiet rysuje ikonę 32×32 do `tools/<pakiet>/art/icons/`, wkleja integracja.

---

## 3. Wspólne części: jak z nich korzystać (bez edytowania cudzych plików)

Wszystko poniżej już działa. Pliki `Wyspa_Data.js`, `Wyspa.js`, `TownLife*.js`, `TownQuests*.js`, `TawernaCore.js` są koordynatora:
**nie zmieniasz ich**; jeśli czegoś w nich brakuje, napisz koordynatorowi.

### Kolejność wtyczek (stała, już wpisana)
```
... TownLife_Data, Wyspa_Data, Pustelnia_Data, Kruk_Data, Latarnia_Data, Garnizon_Data, Wrak_Data, Cysterna_Data, TownLife,
TownQuests_Data, TownQuests, Homes, ... Przystan, CzerwonaWoda, Wyspa, Pustelnia, Kruk, Latarnia, Garnizon, Wrak, Cysterna, CleanHUD ...
```
Twój `*_Data.js` ładuje się **przed** TownLife i TownQuests (dlatego to tam dopisujesz mieszkańców i zadania). Twój silnik (`*.js`)
ładuje się **po** wszystkich systemach gry (Farming, Hunting, Humans, Underground, Act3, Przystan, CzerwonaWoda, Wyspa).

### Mieszkańcy (TownLife)
W swoim `*_Data.js`:
```js
(window.TownLifeExtra = window.TownLifeExtra || []).push({
    key: "latarnik", id: 943, name: "Bazyli Krzesiwo", title: "latarnik", sheet: "$Npc_Latarnik", map: 159, speed: 2,
    plan: [[0, "inside", "izba"], [15, "work", "drewutnia"], ...], barks: {...}, talk: {...}
});
// miejsca na Twoich mapach: zdarzenia „Miejsce: <klucz>” (najlepiej) albo dane:
TownLifeData.SPOTS_BY_MAP[159] = Object.assign(TownLifeData.SPOTS_BY_MAP[159] || {}, { drewutnia: [26, 18, 2] });
```
- `id` **musi** być Twoim numerem z tabeli. Bez `id`, z cudzym numerem albo z zajętym kluczem mieszkaniec nie wejdzie (ostrzeżenie w konsoli).
- Pierwsze rozmowy i własne rozmowy: `TownLife.addTalkHook(fn, true)` w silniku (jak `Przystan.js`).
- Miejsce w pomieszczeniu bez zdarzenia na mapie (rozbitek w tawernie, Map001 bez zmian): `TownLifeData.SPOTS_BY_MAP[1] = { gosc_9: [x, y, kierunek] }`.
  Numer `gosc_N` to kolejność mieszkańców z wpisem „tawerna” w planie - nowy gość dostaje `gosc_9`.

### Zadania (TownQuests)
W swoim `*_Data.js`:
```js
(window.TownQuestsPacks = window.TownQuestsPacks || []).push({
    owner: "Latarnia",
    quests: [{ id: "K49", kind: "K", title: "Tran dla latarni", giver: "latarnik", ... }],   // format: docs/QUESTY_STAN.md „Jak dopisać zadanie”
    spots: { latarnia_soczewka: { map: 161, id: 951, x: 5, y: 3, ... } },                     // miejsca zadań: numery 951-959 NA SWOJEJ mapie
    vitems: { ksiega_mgiel: { name: "Księga mgieł (odpis)", icon: 0 } },
    remarks: [{ id: "lat_ogien", who: "janek", flag: "latarniaZgasla", text: "..." }],
    gossip: { latarnik: ["..."] }
});
```
- Zajęty numer zadania albo klucz zostaje pominięty (ostrzeżenie w konsoli) - nigdy nie nadpisuje istniejącego.
- Własne kroki (`check`, `talk`, `fx`, `spotFx`, `rewardFx`...) dopisujesz w silniku: `Object.assign(TownQuests.FX, { ... })` (jak `Homes.js`).
- Notatki w dzienniku: nagrody zadań (`reward.note`) albo `Journal.addNote(tytuł, tekst)`. Celów dziennika (`Journal.GOALS`) nie dopisujemy.

### Przejścia
- Przejścia **z map użytkownika** (przystań 125, góry 13) wstawia `Wyspa.js` (numery 690-698) - **dopiero gdy Twoje miejsce jest gotowe**:
  w silniku wywołaj `Wyspa.ready(155)` (itd.), kiedy mapa jest zbudowana. W testach: `Wyspa.force(true)` i przeładowanie mapy.
- Przejścia **z Twoich map** (powrót, przejścia między nowymi mapami) to zwykłe zdarzenia w Twoich plikach map - na polach z kontraktu
  (`WyspaData.LINKS`, punkt 5). Wymiary map z kontraktu zostają (od nich zależą krawędzie).
- Przejście z Twojej mapy na mapę **innego pakietu** (np. pustelnia → Urwisko) działa tylko, gdy `Wyspa.isReady(cel)`; inaczej
  popup nad bohaterem („Ścieżka urywa się nad przepaścią.” itp.). Tak żaden gracz nie trafi na pusty szkielet mapy.

### Pływy, flagi, przełączniki
- `Wyspa.tide(dzień?, godzina?)` → `{ level, low, nextLow, nextHigh }`; `Wyspa.lowWaters(dzień)` → godziny odpływów (do rozmów i dziennika).
  Przełącznik 20 = odpływ (do warunków stron zdarzeń).
- Flagi między pakietami: `Wyspa.flag("krukTame")`, `Wyspa.setFlag("glejtWrak")` (to flagi TownQuests; lista i kto co ustawia:
  `WyspaData.FLAGS`). Nowych wspólnych flag nie wymyślaj bez koordynatora; własne (tylko u siebie) nazywaj z przedrostkiem pakietu.

### Inne systemy gry (tylko przez ich API)
- `Tawerna.inject(mapy, { ids: [od, do], owner: "<Twój właściciel>", build })` - zawsze Twój zakres i Twój właściciel z tabeli.
- `Tawerna.popup`, `Tawerna.on/emit`, `Tawerna.state.define("<klucz pakietu>", ...)` - stan w zapisie pod własnym kluczem.
- `Humans.ambush / spawn / camp` (napady i obozy ludzi), `Creatures` (stwory pod ziemią: `<Stwor:rodzaj>` z kontraktu w `docs/PODZIEMIA.md`).
- `Farming.addMenuHook`, `Farming.rationWell` (wzór czerpaka), `Farming.BUILDINGS[...].recipes` (przepis dopisany w czasie ładowania).
- `Act3Data.DEFENDERS.push({...})` - obrońca Aktu III (format jak wpisy w `Act3_Data.js`), bez zmian w pliku.
- `CzerwonaWoda.isRed()`, `Sky.mistOfDay(dzień)`, `Survival.weatherPlan(dzień)`, `TownQuests.isFerry(dzień)`, `TownQuests.dryDays()`.

---

## 4. Czego NIE wolno ruszać (wszystkim pakietom)

- `js/plugins.js` (wtyczki są już wpisane), `data/MapInfos.json`, `data/Items.json`, `data/System.json`, `data/Tilesets.json`, `data/Actors.json`,
  `data/CommonEvents.json` i reszta bazy - zmiany przez koordynatora (lista w raporcie).
- `img/system/IconSet.png` (ikony oddajesz jako pliki PNG).
- Pliki map, które nie są Twoje (w tym wszystkie mapy użytkownika i mapy innych pakietów).
- Wtyczki gry i koordynatora: `TawernaCore`, `Wyspa_Data`, `Wyspa`, `TownLife`, `TownLife_Data`, `TownQuests`, `TownQuests_Data`
  (wyjątek: pakiet A, niżej), `Story`, `Farming*` (wyjątek: pakiet B, niżej), `Przystan`, `CzerwonaWoda`, `Homes`, `Act3*`, `Underground*`,
  `Creatures*`, `Humans*`, `Journal`, `SpeechBubbles`, `Atmosphere`, `Sky`, `Survival`, `Needs`, `Dog` - i pliki innych pakietów.
- Cudze testy (wyjątek: liczby mieszkańców w `town_life_test.js` / `podgrodzie_life_test.js`, jeśli Twój mieszkaniec mieszka na
  mapie 8 albo 111 - wolno poprawić samą liczbę i opisać to w raporcie).
- Cudze foldery `tools/`, `docs/` i grafiki innych pakietów.

---

## 5. Pakiety

### A - Pustelnia na klifie (fala 1)
- **Mapy:** `data/Map155.json` „Pustelnia na klifie” (48×36, tileset 11, `<Clouds:on><Farm:off><Water:salt>`), `data/Map156.json`
  „Skryptorium” (tileset 8, wnętrze; rozmiar dowolny).
- **Kontrakt pól na Map155:** dół (23-25, 35) → przystań 125 (14-16, 1); lądowanie z przystani (23-25, 34). Prawa krawędź (47, 17-18) →
  Urwisko 157 (1, 19-20); lądowanie z Urwiska (46, 17-18). `Wyspa.ready(155)`, gdy mapa gotowa.
- **Pliki:** `js/plugins/Pustelnia_Data.js`, `js/plugins/Pustelnia.js`, `tools/pustelnia/`, `tests/pustelnia_test.js`,
  `docs/miejsca_wyspy/pustelnia/`, grafiki `img/characters/$Npc_Pustelnik*.png`, `!$Pustelnia_*`, `!Pustelnia_*`, popiersie `Pustelnik_Bust`.
- **Wyjątek:** jako jedyny pakiet zmienia **blok W2 w `js/plugins/TownQuests_Data.js`** (dopisanie rozdziału 7 „Jedno pytanie”: serce
  dzwonu od Ambrożego, Noc Pytania w pustelni). Tylko ten blok, nic więcej w tym pliku.
- **Mieszkaniec:** 944 `pustelnik` (brat Kleofas, mapy 155/156).
- **Zadania:** K50 „Atrament dla pustelnika”, D23 „Zaszyfrowane kroniki”, W2 rozdz. 7. Karty kroniki 1-3 zdobywa sam (Archiwum, piętro
  20 - zdarzenie wstawione w kodzie na mapie 146, Osada - mapa 123); karty 4-6 dają pakiety E, C, B przez flagi `kronikaKarta4..6`.
- **Ustawia flagi:** `kronikaKarta1..3`, `sercePustelni`. **Czyta:** `kronikaKarta4..6`, `krukTame`, `ansgarAlly`.
- **PixelLab:** ok. 40 (Kleofas). **Port:** 9501.

### B - Urwisko Kruków i oswojony kruk (fala 2)
- **Mapa:** `data/Map157.json` „Urwisko Kruków” (56×36, tileset 11, `<Clouds:on><Farm:off><Water:salt>`).
- **Kontrakt pól na Map157:** lewa krawędź (0, 19-20) → pustelnia 155 (46, 17-18); lądowanie (1, 19-20). Prawa (55, 19-20) → przylądek
  159 (1, 33-34); lądowanie (54, 19-20). **Krata przelewu** na (41, 15): zdarzenie z obrazkiem `!Quest_Places` (indeks 0, kierunek 2,
  wzór 0), nazwa „Przelew cysterny”, strona 2 na przełączniku 17 = przejście do cysterny 167 (33, 3); lądowanie z cysterny (41, 16).
  **Znaczniki** „Miejsce: rynna_1” … „Miejsce: rynna_4” dla K53 (logika K53 to pakiet F). `Wyspa.ready(157)`, gdy mapa gotowa.
- **Pliki:** `js/plugins/Kruk_Data.js`, `js/plugins/Kruk.js`, `tools/urwisko/`, `tests/kruk_test.js`, `docs/miejsca_wyspy/urwisko/`,
  grafiki `img/characters/$Animal_Kruk*.png` (albo `img/system/Kruk_*.png`), `!$Urwisko_*`, `!Urwisko_*`, budynek `Farm_Grzeda*.png`.
- **Wyjątek:** jako jedyny pakiet zmienia **`js/plugins/Farming_Data.js`** - tylko dopisanie budynku „Grzęda kruka” w `BUILDINGS`
  (4× Gałęzie, 2× Deski, 1× Lina, 1×1). Kopia przed zmianą, test `buildings_contract_test` po zmianie.
- **Kruk:** osobny system na wzór `Dog.js` (własna postać `Game_Character`, bez numerów zdarzeń), imię nadaje gracz (ekran imienia z
  `Prologue.js` - przez jego API albo własną kopię sceny w `Kruk.js`, bez zmian w `Prologue.js`), listy tylko po wyspie.
- **Zadania:** K51 „Kruk z masztu” (start od kwestii Rocha; kruk o świcie na maszcie wraku kutra na Map125 - zdarzenie wstawione w
  kodzie, numery 610-629), D24 „Oswojony kruk” (rozmowa z dziadkiem przez TownQuests, `giver: "grandpa"`, `offer.auto`).
- **Ustawia flagi:** `krukTame`, `kronikaKarta6`. **Daje przedmiot:** 179 Obrączka z krukiem.
- **PixelLab:** ok. 90 (kruk: siedzenie, skoki, lot, lądowanie, z listem; grzęda). **Port:** 9502.

### C - Przylądek z latarnią (fala 2)
- **Mapy:** `data/Map159.json` „Przylądek z latarnią” (44×40, tileset 11, `<Clouds:on><Farm:off><Water:salt>`), `data/Map160.json` „Izba
  latarnika”, `data/Map161.json` „Laterna” (tileset 8).
- **Kontrakt pól na Map159:** lewa krawędź (0, 33-34) → Urwisko 157 (54, 19-20); lądowanie (1, 33-34). Dół (29-31, 39) → góry 13
  (58, 11-13); lądowanie z gór (29-31, 38). `Wyspa.ready(159)`, gdy mapa gotowa (włącza też przejście z gór).
- **Pliki:** `js/plugins/Latarnia_Data.js`, `js/plugins/Latarnia.js`, `tools/latarnia/`, `tests/latarnia_test.js`,
  `docs/miejsca_wyspy/latarnia/`, grafiki `$Npc_Latarnik*.png`, `!$Latarnia_*`, plansze wizji `img/pictures/Latarnia_Wizja_*.png`,
  popiersie `Latarnik_Bust`.
- **Mieszkaniec:** 943 `latarnik` (Bazyli Krzesiwo; noc w laternie - własne zdarzenie, numery 630-639).
- **Zadania:** K49 „Tran dla latarni”, D22 „Księga mgieł”, W11 „Soczewka” (napad: `Humans.ambush` na Map159).
- **Mechaniki:** mgła morska nocą według `Sky.mistOfDay(jutro)` (przełącznik 19), wizje raz na noc, „Ciężka głowa” (stan przez
  `Survival.defineBuff`). Przepis „Tran” w kociołku - dopisany w czasie ładowania do `Farming.BUILDINGS` (bez zmian w `Farming_Data.js`);
  jeśli się nie da, zgłoś to do integracji. Latarnia **nie opóźnia promu**.
- **Ustawia flagi:** `mgla`, `kronikaKarta5`, `soczewkaRozbita`, `soczewkaSprzedana`. **Daje / bierze przedmiot:** 177 Tran.
- **PixelLab:** ok. 60 (Bazyli, wieża latarni, plansze wizji). **Port:** 9503.

### D - Garnizon nad zatoką (fala 1)
- **Mapy:** `data/Map162.json` „Garnizon nad zatoką” (56×40, tileset 11, `<Clouds:on><Farm:off><Water:salt>`), `data/Map163.json`
  „Kwatera rotmistrza” (tileset 8).
- **Kontrakt pól na Map162:** góra (21-23, 0) → przystań 125 (21-23, 38); lądowanie z przystani (21-23, 1). Lewa krawędź (0, 20-21) →
  wrak 165 (38, 20-21) **tylko w odpływie** (przełącznik 20; poza odpływem popup „Łacha pod wodą.”); lądowanie z wraku (1, 20-21).
  `Wyspa.ready(162)`, gdy mapa gotowa.
- **Pliki:** `js/plugins/Garnizon_Data.js`, `js/plugins/Garnizon.js`, `tools/garnizon/`, `tests/garnizon_test.js`,
  `docs/miejsca_wyspy/garnizon/`, grafiki `$Npc_Rotmistrz*`, `$Npc_Kwatermistrz*`, `$Npc_Werbownik*`, `$Npc_Zolnierz*`, `!$Garnizon_*`,
  popiersia `Rotmistrz_Bust`, `Kwatermistrz_Bust`, `Werbownik_Bust`, `Zolnierz_Bust`.
- **Mieszkańcy:** 945 `rotmistrz`, 946 `kwatermistrz` (w noce po promie przy kantorze: `alt` na mapie 8), 947 `werbownik` (w dni po
  falach na rynku: `alt` na mapie 8). Żołnierze to własne zdarzenia 640-669 (na mapie 8 werbownika stół też 640-669, wstawiany w kodzie).
- **Zadania:** K52 „Drewno dla garnizonu”, D26 „Lista poborowa”, D27 „Zboże dla obozu”.
- **Mechaniki:** skup wojskowy, przychylność garnizonu 0-100 (stan pod własnym kluczem), obrońcy Aktu III przez
  `Act3Data.DEFENDERS.push(...)`. Bohater nie jest wcielany. Woda w garnizonie tylko jako pilnowane beczki (popup).
- **Ustawia flagi:** `glejtWrak`, `klosWydany`. **Czyta:** `dziennikOkretu`, `ansgarGiven`.
- **PixelLab:** ok. 155 (trzy postacie + żołnierz, palisada, wieża). **Port:** 9504.

### E - Wrak na mieliźnie i rozbitek (fala 1)
- **Mapy:** `data/Map165.json` „Wrak na mieliźnie” (40×30, tileset 11, `<Clouds:on><Farm:off><Water:salt>`), `data/Map166.json` „Wrak -
  pod pokładem” (tileset 8).
- **Kontrakt pól na Map165:** prawa krawędź (39, 20-21) → garnizon 162 (1, 20-21) tylko w odpływie; lądowanie z garnizonu (38, 20-21).
  Przybicie łodzi Janka: (35, 18). `Wyspa.ready(165)`, gdy mapa gotowa.
- **Pliki:** `js/plugins/Wrak_Data.js`, `js/plugins/Wrak.js`, `tools/wrak/`, `tests/wrak_test.js`, `docs/miejsca_wyspy/wrak/`, grafiki
  `$Npc_Rozbitek*`, `!$Wrak_*`, popiersie `Rozbitek_Bust`.
- **Mieszkaniec:** 948 `rozbitek` („Eryk Sowa” / Ansgar Wiel). W tawernie siedzi na `gosc_9` z `TownLifeData.SPOTS_BY_MAP[1]` (wolne
  pole przy stole, Map001 bez zmian); śpi w Pokojach gości (Map025 bez zmian - miejsce też z danych).
- **Łódź Janka:** wybór w rozmowie z Jankiem przez `TownLife.addTalkHook` (bez zmian w `Przystan.js`).
- **Zadania:** D25 „Mapa z wraku”, W12 „Rozbitek”. Poszlaka od Józka Łaty (Podgrodzie) - przez hak rozmowy, bez zmian w danych Podgrodzia.
- **Ustawia flagi:** `kronikaKarta4`, `dziennikOkretu`, `ansgarGiven`, `ansgarAlly`, `ansgarFled`. **Czyta:** `glejtWrak`, `mgla`, `krukTame`.
- **Daje przedmiot:** 178 Mapa z zaznaczeniami (pokazuje 7 miejsc na kompasie - przez `Journal`/`CleanHUD_Compass` API śledzenia, bez zmian w ich plikach).
- **PixelLab:** ok. 55 (Ansgar, kadłub). **Port:** 9505.

### F - Stara cysterna zakonu (fala 2)
- **Mapa:** `data/Map167.json` „Stara cysterna zakonu” (40×28, tileset 12, notatka jak ręczne piętra podziemi: `<Dark:on>`,
  `<DarkDay/DarkNight:226>`, `<Ambience:cave>`).
- **Kontrakt pól na Map167:** wejście z piętra 30: lądowanie (3, 20); powrót (2, 20) → Map147 (20, 6). Kanał przelewu (33, 2) → Urwisko 157
  (41, 16); lądowanie z kraty (33, 3). Na Map147 **plik bez zmian**: po W1 rozdz. 7 kod podmienia listę zdarzeń „Zasuwa główna”
  (19-21, 5) na przejście (przełącznik 18). Kratę na Urwisku otwiera dźwignia od środka (przełącznik 17). `Wyspa.ready(167)`, gdy gotowa.
- **Pliki:** `js/plugins/Cysterna_Data.js`, `js/plugins/Cysterna.js`, `tools/cysterna/`, `tests/cysterna_test.js`,
  `docs/miejsca_wyspy/cysterna/`, grafiki `!Cysterna_*`.
- **Zadania:** D28 „Zapas zakonu”, K53 „Rynny zakonu” (na znacznikach `rynna_1..4` z mapy pakietu B).
- **Mechaniki:** zapas 0-100 (start 55, stan pod własnym kluczem), czerpak **1 nabranie dziennie** (wzór `Farming.rationWell`),
  łańcuch sięga tylko do trzeciego znaku (poniżej 30 nic), deszcz dolewa przez zasuwę deszczową i rynny, gałąź dworska do zamknięcia
  (Lord chłodny), poniżej 15 studnia w miasteczku daje mniej (przez API TownQuests - jeśli go brak, zgłoś do integracji).
  Stwory: `topielec` z kontraktu podziemi. Woda w zbiorniku poza czerpakiem - „nie do picia” jak pod ziemią.
- **Ustawia flagi:** `cysternaOtwarta`, `galazDworskaZamknieta`, `rynnyCzyste`; przełączniki 17, 18.
- **PixelLab:** 0-5. **Port:** 9506.

---

## 6. Kolejność budowy

1. **Instalacja pakietu 0** (punkt 0).
2. **Fala 1, równolegle:** A Pustelnia, D Garnizon, E Wrak.
3. **Fala 2, równolegle:** B Urwisko i kruk, C Latarnia, F Cysterna.
4. **Pakiet 7 - integracja** (koordynator, po kolei): ikony do IconSet (pola 438-440 i dalsze puste), łaty zgłoszone przez pakiety (np.
   przepis tranu, studnia przy niskim zapasie), linijki epilogu w `Underground_Data.js` (latarnia, kruk, garnizon), uwagi mieszkańców,
   test przejść (`tools/newstart/run_transfer_test.py`: nowe mapy i krawędzie), `docs/QUESTY.md`, `docs/QUESTY_STAN.md`, `docs/STORY.md`.
   Testy tylko dotknięte; pełna seria tylko za zgodą użytkownika.
