# Akt III — frakcja uderza na tawernę

Stan: 2026-10-07. Kod: `js/plugins/Act3.js` (silnik napadu) i `js/plugins/Act3_Data.js` (fale, obrońcy, teksty, liczby). Test:
`tests/act3_test.js` (47 sprawdzeń, ok. 2 min, port 9470). Zrzuty i GIF: `docs/akt3/`. Katalog fabuły: `docs/QUESTY.md` (W2 rozdz. 8
„Alarm”, W8 rozdz. 7 „Przy drzwiach tawerny”, 6.3 „Akt III”), `docs/STORY.md`.

## Kiedy

- **Wyzwalacz:** bohater zszedł do **50. piętra** (Przekop kopaczy — tam tunel frakcji spotyka schody zakonu), a krata w piwnicy tawerny
  jest otwarta (W4). Frakcja dowiaduje się, że droga w dół zaczyna się pod podłogą tawerny.
- **Uzbrojenie:** pierwsza chwila na górze (tawerna, piwnica albo miasteczko) po zejściu na 50. piętro. Od tej chwili miasto ostrzega.
- **Uderzenie:** następnej nocy (21:00–4:00), kiedy bohater jest w tawernie (Map001) albo w miasteczku (Map008). Noc bez niego — czekają.
  Po **trzech** takich nocach uderzają bez niego (wynik liczony z sojuszników, patrz niżej).
- Napad zwykle przychodzi **przed** Komnatą Serca (piętro 100). Gracz, który zejdzie z 50. na 100. bez wychodzenia na górę, może dojść
  do Serca pierwszy — wtedy `Act3.outcome()` jest jeszcze `null` (agent Serca traktuje to jako „oblężenia jeszcze nie było”).
- **F9** (Zdarzenia): „Akt III: uzbrój napad” (ostrzeżenia, napad następnej nocy), „Akt III: napad na tawernę teraz” (o 22:00 przed
  tawerną), „Akt III: wyczyść stan napadu”.

## Ostrzeżenia (dzień przed)

- Mieszkańcy obok bohatera mówią, co widzieli (raz dziennie każdy): Tadek — groty kupione przez obcych w kolczugach, Hanka — obcy pytali,
  o której Borgar zamyka, Kuba — prom bez flagi, Wit — „kazali nam nie patrzeć w stronę tawerny”, sołtys — pytania o plany piwnic,
  Ignac, Ludmiła, Rafał, Baltazar, Szymek, Ambroży; reszta — „za dużo obcych”.
- W tawernie: Borgar („Dwóch obcych pytało dziś o piwnicę…”), Grum zależnie od W8 (sojusznik: „Będę przy drzwiach”; frakcja: „Nie pij
  jutro wieczorem w tawernie”; bez wyboru: „To nie moja wojna”).
- Notatka w dzienniku „Obcy w miasteczku” (z podpowiedzią: trzy uderzenia i jedno to alarm).
- **Ambroży** zapytany w tym czasie: jeśli ufa bohaterowi — „zadzwonię trzy i jeden”; jeśli nie — mówi, gdzie wisi lina pod dzwonem.

## Alarm: trzy i jeden (W2 rozdz. 8)

- **Ambroży ufa** (lekcje dzwonu D16 — klucz do dzwonnicy, kroniki oddane jemu, prawda powiedziana mu w W9, flaga zaufania, albo W2 od
  rozdz. 4 — rozmowa przy dzwonie): kilka sekund po początku napadu sam bije 3 + 1 i wychodzi do dzwonu (TownLife.hold).
- **Nie ufa:** u góry pojawia się wskazówka, nad dzwonem żółty romb; lina pod dzwonem (zdarzenie 859 na mapie 8, pole 47,29 — bohater
  staje tam, gdzie zwykle Ambroży) otwiera mini-grę dzwonu: cztery uderzenia. Zła liczba — „jeszcze raz”.
- Po alarmie: **Opinia 60+** — mieszkańcy idą z pomocą (Tadek z młotem, Ignac, Kuba, dwóch uchodźców z obozu); Tadek przychodzi też przy
  niższej Opinii, jeśli bohater oddał mu pieniądze na leczenie (`tadekFriend`). **Niższa Opinia** — „Drzwi domów zostają zamknięte”.
  Bez alarmu nikt z miasteczka nie przychodzi.

## Fale

| # | Gdzie | Kto | Dokąd idą |
|---|---|---|---|
| 1 | dziedziniec przed tawerną (mapa 8), od bramy dziedzińca | 2 bandytów, nożownik (z pochodniami - światło ognia nocą) | drzwi tawerny (24,17) |
| 2 | to samo | bandyta, nożownik, 2 łuczników (+ **Rafał** jako nożownik, gdy W6 go wydał) | drzwi tawerny; łucznicy od razu na bohatera |
| 3 | tawerna (mapa 1), przez kuchnię | nożownik, 2 bandytów (+ ci, którzy przeszli przez wyważone drzwi tawerny) | stare drzwi przy piwnicy (9,14) |
| 4 | tawerna, frontowymi drzwiami | **Dowódca kopaczy** (najemnik, poziom +2), najemnik, bandyta (+ **Grum**, gdy w W8 przeszedł do frakcji) | stare drzwi przy piwnicy |

- Poziom ludzi: poziom bohatera −1 (najmniej 3), najemnicy +1, dowódca +2.
- Ci, którzy nie walczą (nikt ich nie zatrzymał), idą do drzwi i je wyważają — pasek nad drzwiami. **Drzwi tawerny wyważone:** szkody +20,
  ci przy drzwiach wchodzą do środka (dołączają do następnej fali w tawernie). **Stare drzwi wyważone:** każdy przy nich schodzi do piwnicy
  (szkody +35 na głowę) — frakcja jest pod tawerną.
- Fala na mapie, na której bohatera nie ma: szkody rosną (6 na godzinę gry), po **godzinie gry** (minuta) drzwi puszczają bez niego.
- Między falami ok. 6 sekund przerwy i napis u góry; gdy następna fala jest na innej mapie: „Są w środku!” / „Są pod drzwiami!”.
- Melia chowa lutnię, Ozzy wchodzi pod stół; Grum bez wyboru w W8 siedzi przy stole i pije.

## Obrońcy (według stanu gry)

| Klucz | Kto | Kiedy | Gdzie |
|---|---|---|---|
| `borgar` | Borgar | zawsze | tawerna - pilnuje starych drzwi (jego zdarzenie przy barze znika na czas walki) |
| `grum` | Grum (wygląd najemnika) | W8: `grumAlly` | obie mapy, przy bohaterze; tarcza z przodu |
| `rafal` | Rafał | W6: `rafalAlly` (`TownQuests.w6().rafal === "ally"`) | dziedziniec, przychodzi od bramy |
| `marek` | Marek | W6: `marekSaved` | dziedziniec |
| `straz` (×2) | strażnicy dworu | W1 b: `lordAlly` | dziedziniec |
| `tadek`, `ignac`, `kuba`, `uchodzcy` (×2) | mieszkańcy | alarm + Opinia 60+ (Tadek też z `tadekFriend`) | dziedziniec, od bramy po alarmie |

- Grum po stronie frakcji (`w8Faction`) jest w fali 4; pokonany i puszczony (albo gdy frakcja wygra) odpływa promem — flaga TownQuests
  `grumGone`; zabity — `grumDead` (znika z tawerny, jak po walce w W8). Grum, który odpłynął albo nie żyje w W8 — nie ma go wcale.
- Rafał wydany (`rafalEnemy` / `rafalGiven`) walczy po stronie frakcji; przemycony (`rafalSmuggled`) albo zabrany przez dwór (`rafalTaken`)
  — nie ma go.
- **Walka obrońców:** obrońca idzie do najbliższego człowieka frakcji przy swoim miejscu (Grum — przy bohaterze), uderza (zamach, ciało
  rzucone do przodu, łuk broni; Grum — prawdziwe ciosy najemnika), a trafiony człowiek bije się z nim (`Humans.setFoe`: jego ciosy trafiają
  obrońcę, nie bohatera). Człowiek bez przeciwnika, gdy bohater daleko, sam bierze się za obrońcę w pobliżu (najwyżej dwóch na jednego).
  Łucznicy zawsze strzelają do bohatera. Obrońca z zerem życia **pada ranny** (leży, „ranny”) — trafia na listę `lost`. Nad obrońcami
  zielony pasek i imię.

## Wynik

- **held** (obroniona): wszystkie fale pokonane, szkody < 35 i rannych najwyżej 1 (albo ćwierć walczących, jeśli to więcej).
- **costly** (obroniona drogo): fale pokonane, ale szkody 35–99 albo więcej rannych.
- **fallen** (padła): szkody 100 (zeszli do piwnicy) — napad kończy się od razu.
- **Bohater pobity** (Humans.js: ludzie nie zabijają — obrabowany, budzi się godzinę później): resztę rozstrzygają obrońcy, którzy jeszcze
  stoją (ich siła przeciw sile ludzi, którzy zostali — `POWER` w danych): costly (szkody co najmniej 50) albo fallen.
- **Bez bohatera** (trzy noce): siła wszystkich obrońców (mieszkańcy tylko wtedy, gdy Ambroży ufa i Opinia 60+) przeciw wszystkim falom:
  costly albo fallen — nigdy held. O wyniku bohater dowiaduje się w tawernie albo w miasteczku („Kiedy cię nie było…”).
- **Nagrody:** held — Opinia +8, 600 dośw., 120 G od Borgara; costly — +3, 400, 40 G; fallen — −3, 150; bez bohatera — Opinia −2 / −5.
  Notatka „Noc pod tawerną” w dzienniku (ranni po imieniu). Po costly / fallen: sadza na ścianach tawerny przez 6 dni, tej nocy jeszcze żar.

## Dla innych wtyczek

```js
Act3.outcome()   // (T.api("Act3")) null, dopóki napadu nie było; potem:
// { result: "held" | "costly" | "fallen", defenders: ["borgar", "grum", ...], lost: ["rafal", ...], day, damage (0-100),
//   bell: "ambrozy" | "hero" | null, grum: "ally" | "neutral" | "gone" | "dead", rafal: "ally" | "gone" | "dead" | "taken" | null,
//   heroBeaten, offscreen, killed, spared, robbed, fled, wentDown, bossBeaten, helpers }
Act3.phase()     // "idle" | "armed" | "siege" | "done"
```

- Szyna (`Tawerna.on`): `act3Armed { day, siegeDay }`, `act3Start { day, hour }`, `act3Wave { wave, id, map }`, `act3Bell { by }`,
  `act3Done` (to samo co `outcome()`).
- Flagi zapasowe w `TownQuests.state().flags`: `act3Held` / `act3Costly` / `act3Fallen` (= dzień).
- Zapis: `Tawerna.state("act3")` — faza, dzień napadu, ostrzeżenia, stan napadu (fala, co z niej zostało, drzwi, szkody, obrońcy i ich
  życie, alarm), wynik. Zapis i wczytanie w środku napadu: ludzie fali wracają (ilu zostało, z ich życiem), obrońcy też.
- Numery zdarzeń (przydział 840–859): **859** — lina dzwonu, zawsze w danych mapy 8 (cicha, póki napad się nie szykuje); 854–858 zarezerwowane
  w rejestrze rdzenia. 840–853 jeszcze nie w rejestrze: `tests/core_test.js` używa 840–841 i 853 jako „wolnych” numerów testowych.
- Humans.js (dopisane na potrzeby obrońców): `Humans.setFoe(człowiek, obrońca | null)`, `Humans.foeOf(człowiek)`,
  `Humans.march(człowiek, x, y)`, `Humans.remove(człowiek)`; `Humans.hit(h, dmg, how, { from: {x, y} })` — garda i odrzut liczone
  od strony tego, kto bije (nie bohatera).

## Decyzje do potwierdzenia

- Wyzwalacz: 50. piętro (przekop kopaczy) + otwarta krata; uderzenie następnej nocy; trzy noce czekania.
- Ufność Ambrożego liczona z istniejących flag (lekcje dzwonu, kroniki, prawda, W2 od rozdz. 4) — bez osobnej miary.
- Grum bez wyboru w W8 nie walczy (siedzi i pije), zamiast odpływać promem.
- Ranni obrońcy nie umierają (lista `lost` = ranni); po napadzie wszyscy wracają do swoich zajęć.
- Bez bohatera nigdy „held”.
- Fala 3 zawsze przez kuchnię, fala 4 frontowymi drzwiami; frakcja nie ma nazwy (otwarte w STORY.md) — dowódca to „Dowódca kopaczy”
  z obozu w jaskini (W8).

## Czego nie ma

- Pożaru do gaszenia (susza: nie ma czym), barykad, przygotowań przed nocą (np. kupienie strzał od Tadka, ustawienie ludzi).
- Śpiący w wynajętym pokoju nad tawerną (Map025) nie jest budzony — napad czeka, aż zejdzie.
- Własnych animacji ciosów mieszkańców (Borgar, Tadek, Ignac, Kuba, Rafał, Marek, uchodźcy, strażnicy: ciało rzucone do przodu i łuk
  broni rysowany kodem); Grum ma prawdziwe ciosy najemnika.
- Sceny po napadzie poza dymkami (Borgar mówi swoje), zmian w rozmowach mieszkańców o tej nocy (to TownQuests / TownLife).
