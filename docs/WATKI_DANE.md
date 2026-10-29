# Wątki i zadania jako dane, teksty w plikach (refaktor, punkty 4 i 5)

Stan na 2026-10-23, etap 1 zrobiony: spis, silnik `js/plugins/Watki.js`, format tekstów `js/teksty/*.txt` z narzędziem
`tools/teksty.js`, pilot W4 „Krew kasztelana” rozdz. 6-8 (`Kasztelan_Data.js` + `js/teksty/kasztelan.txt`). Etap 2 (teksty w plikach):
rozdz. 7a. Etap 3 (wątki paczek, W5, W7, W9 rozdz. 3, W10, Story rozdz. 1 na silniku, 2026-10-28): rozdz. 2.3a i 7b. Etap 4
(TownQuests w kawałkach: rdzeń, zadania K/D bez kodu, W1, W2, W3, W6, W8, zadania Przystani, 2026-10-29): rozdz. 7c. Etap 5
(reszta zadań TownQuests, W4 rozdz. 1-5, W9 rozdz. 6, F9 Act3 / podziemi / W5 / W7 / W9 z silnika, 2026-10-29): rozdz. 7d.

Zasada wszystkich etapów (jak przy poprzednich refaktorach): po każdym kroku dotknięte testy na zielono, stare zapisy się wczytują,
gracz widzi **dokładnie to samo** - te same teksty co do znaku, to samo łamanie linii, kolejność, warunki i nagrody.

---

## 1. Spis: gdzie żyją wątki i zadania

### 1.1 Jak to dziś działa (wspólny szkielet)

- **TownQuests.js** (4729 linii) to już silnik zadań: zadanie = obiekt danych (`TownQuests_Data.js`, 2569 linii) z ofertą, krokami,
  warunkami, nagrodami; rekord w zapisie `_tw.townQuests.q[id] = { s, step, day, sday, sh, times, end, t: {...} }`; dziennik
  (`Journal.addQuestSource("town")`: FABUŁA = wątki W, POBOCZNE = K/D, MIASTECZKO, UKOŃCZONE) i okienko celu (`addTrackerSource`);
  znaczniki nad głowami; rozmowy przez `Tawerna.talk` (przejęcie „quest”). Typy kroków: `bring`, `talk`, `spot` (miejsce wstawiane
  951-959 / 903-909), `wait`, `kill`, `custom` (hak), `pause`. Warunki oferty (`condOk`): godziny, dni, pora roku, susza, deszcz,
  opinia, zrobione zadania, flagi, rynek, prom, przedmioty, `fn`. Nagrody (`applyReward`): złoto (też na dług), przedmioty, XP,
  opinia, notatka, poszlaka, flaga, perk, zaufanie bywalców. Terminy (`deadline`), wybory (`choice`), uwagi mieszkańców (`REMARKS`).
- **Zadań jest 106**: 61 w `TownQuests_Data.js` + 44 z paczek `window.TownQuestsPacks` (Cysterna, Dwor, Garnizon, Kantor, Kruk,
  Latarnia, Lowy, Ludzie, Motyle, Orzel, Pustelnia, Wrak, Zakon, Zasoby) + D21 wpychane przez Homes.js wprost do `QUESTS`.
- **Kod specjalny kroku = klucz w `TownQuests.FX`**: 117 kluczy w samym TownQuests.js, razem ok. **288**. Wtyczki wątków dopisują swoje
  przez `hookQuests()` + `Object.assign(q.FX, {...})` (Kasztelan 5, Rywal 1, Kantor 12, Dwor 14, Zakon 23, Ludzie 22, Lowy 16, Wrak 11,
  Latarnia 12, Cysterna 10, Przystan 9, Zasoby 9, Orzel 8, Kruk 7, Garnizon 5, Homes 4, Pustelnia 2, Motyle 1). Ok. 40% haków `check`
  / `vars` to proste odczyty stanu albo flagi - nadają się na warunki w danych.
- **W każdej wtyczce wątku te same kopie pomocników**: `wrap` / `sayTo` / `linesTo` / `choiceTo` / `act` (5-6 kopii, w czterech
  wariantach: z `@kto:`, z akapitami `\n`, z twardą spacją przed „G”, uproszczony), kolejka myśli `think` / `updateThoughts` (3 kopie,
  różne czasy), adapter flag TownQuests (`flags` / `flag` / `setFlag` w 3 wariantach), `cur` / `at` / `stepOf` / `complete`,
  `eventData` / `hideEv` / `showEv` / `BLANK`, `debugJump` + tabela `JUMP`.
- **F9 (Debug.js, „Wyspa i fabuła”)**: skoki do rozdziałów mają W4, W5, W7 (każdy własne `debugJump`, nazwy rozdziałów W5/W7 wpisane
  w Debug.js), W9 (wariant i piętro), W10 (Przystan nadpisuje Debug); biały orzeł (`Orzel.f9Rows`) i paczki nowego terenu
  (`Okolice.f9.add`). W1, W2, W3, W6, W8 skoków nie mają.
- **Teksty**: w `TX` / `TEXT` / `lines` plików `_Data` (najczęściej), ale też w samych wtyczkach (całe `TX` w Wrak.js, Przystan.js,
  Garnizon.js; Story.js ok. 365 napisów w kodzie bez `TX`; Homes.js ok. 160; TownQuests.js ok. 220 literałów w kodzie: popupy, etykiety
  wyborów, monologi, dziennik). Część `TX` to funkcje (Zakon `towerFound(n)`, Cysterna `post()`, Act3 `fewerNotice(c)`) - do zamiany na
  szablony `{n}`.

### 1.2 Tabela wątków

Trudność = przeniesienie na dane silnika (teksty same w sobie są łatwe wszędzie - narzędzie `wyciagnij`).

| wątek / zadania | gdzie (linie) | w TownQuests? | stan (`_tw`) | haki FX | rozmowy | kod wyjątkowy (zostaje kodem) | teksty | F9 | trudność |
|---|---|---|---|---|---|---|---|---|---|
| **W4 rozdz. 6-8** Krew kasztelana | Kasztelan.js 944 → **543 + Kasztelan_Data 199** | kroki 6-9 W4 | `kasztelan` v1 | 5 → dane | Borgar (temat przy barze), Kleofas, dziadek, wstawiony Borgar | zamknięty dzień, noce, posterunki 540-544, krata, kosz, Serce | TX ~130 → **plik** | W4 1-9 → **dane** | **pilot - zrobione** |
| W4 rozdz. 1-5 | TownQuests (~95) | tak | townQuests | w4Borgar, w4Dig, w4Forge, w4Key, w4Gate, w4Tell | Borgar, Tadek, krata | kopanie, krata w piwnicy | Data `lines` | przez W4 | łatwe |
| **W9 rozdz. 3** Rywal w ruinach | Rywal 1118 + _Data 341 | 2 kroki dopisane do W9 | `rywal` v1 | w9Rywal | przywódca drużyny (wybory zależne od drużyny), ślady | symulacja zejścia, układ śladów na piętrach, walka Humans, chodzenie | TX ~300 w _Data | wariant + piętro | średnie (dane: rozmowa, wyniki, kroki; symulacja kodem) |
| W9 rozdz. 6 prawdy | TownQuests (~80) | tak | townQuests | w9Truth | ~19 osób (temat / przed rozmową) | - | Data `truths` | - | łatwe |
| W5 Towary z kontynentu | Kantor 1336 + _Data 389 | paczka | `kantor` v1 (+ pola dopisywane w locie) | 12 | kupiec, kapral, sołtys, Ludmiła (przejęcia, menu) | nocni goście, skradanie, noszenie skrzyń, rejestr, obóz, prom | TX ~230 + ~40 w kodzie | 1-7 | trudne (~40% na dane) |
| W7 Dwór z kamieni | Dwor 1022 + _Data 379 | paczka | `dwor` v1 | 14 | Lord (talkFx), kamerdyner, drzwi i właz | oprowadzanie, śledzenie Feliksa, gabinet; rusza W1 i W3 | TX ~210 + ~36 w kodzie | 1-7 | średnio-trudne |
| Zakon (K67-70, D36-38) | Zakon 1386 + _Data 648 | paczka | `zakon` v1 | 23 | Kleofas, Hieronim, grabarz (37 akcji) | eksploracja, cień, gaj, wrak | TX ~277 (część funkcje) + ~67 w kodzie | Okolice.f9 | zadania łatwe, mechanika trudna |
| W13 + D29 orzeł | Orzel 2189 + _Data 358 + _Lot 688 | paczka | `orzel` v1 | 8 | (kroki talk w danych) | ptak, lot, gniazda, walka | TX ~100 + ~60 w kodzie | 8 wierszy | zadania łatwe |
| K51, D24 kruk | Kruk 1662 + _Data 277 | paczka | `kruk` v1 | 7 | handBack (kupiec, właściciele listów) | ptak, zwiad, listy | TX ~85 + ~55 w kodzie | Debug | zadania łatwe |
| K52, D26, D27 garnizon | Garnizon 1118 + _Data 295 | paczka | `garnizon` v1 | 5 | rotmistrz, kwatermistrz (menu) | żołnierze, przychylność, łacha, dyby | **TX w silniku** (~147) | Debug | średnie |
| K63-66, D34-35 | Ludzie 1509 + _Data 551 | paczka | `ludzie` v1 | 22 | 7 przejęć, menu kowala | owce, zasadzki, obóz, sklepy | TX ~300 + ~95 w kodzie | Okolice.f9 | trudne |
| Akt III (oblężenie) | Act3 1376 + _Data 279 | nie (własna maszyna faz) | `act3` v1 | - | Ambroży | obrońcy, fale, drzwi, dzwon | TEXT ~144 | Debug | trudne (tylko teksty) |
| D25, W12 wrak | Wrak 1119 + _Data 185 | paczka | `wrak` v1 | 11 | Janek, rozbitek, szmaciarz | zalewanie, łódź, żołnierze | **TX w .js** ~100 + ~15 notatek | - | średnie |
| K50, D23, W2 rozdz. 7 | Pustelnia 671 + _Data 262 | paczka + krok W2 | `pustelnia` v1 | 2 | Kleofas, dzwonnik, kupiec | Noc Pytania, `answer()` | TX ~157 + ~63 w kodzie | - | średnie |
| K49, D22, W11 latarnia | Latarnia 1355 + _Data 323 | paczka | `latarnia` v1 | 12 | latarnik, Janek | wizja, ogień, mgła, napad | TX ~196 + ~45 w kodzie | Debug (mgła) | K49/D22 łatwe, W11 średnio-trudne |
| K47, K48, D20, W10 | Przystan 925 | kroki w TownQuests_Data | `przystan` v1 | 9 | Janek, przemytnik, celnik | listy matki, kuter, prom | **TX w .js** ~186 | W10 | średnie |
| D28, K53 cysterna | Cysterna 693 + _Data 194 | paczka | `cysterna` v1 | 10 | - (zdarzenia mapy) | czerpak, poziom wody | TX ~96 (część funkcje) | - | łatwe |
| Rozdział 1 (dług) | Story 1465 | nie (cele wklejane do `Journal.GOALS`) | `story` v1 | - | dziadek, Lord, Borgar (menu) | mierzenie działki, eskorta, koniec gry | **w kodzie** ~365 | Debug | trudne |
| K22, K33, D13, D6, W3 | TownQuests + TavernLife_Regulars 589 | tak | townQuests + `tavernLife` | ~20 | Melia, Ozzy, Grum (tematy) | gry, Kupała, czapka | `REGULARS` w kodzie ~275 | - | łatwe/średnie |
| D21 Spalona zagroda | Homes 986 | wpycha do `QUESTS` | `homes` v2 | 4 | sołtys | odbudowa, ziemia | w kodzie ~160 | - | zadanie łatwe |
| K55-58, D30, D31 | Zasoby 1499 + _Data 536 | paczka | `zasoby` v1 | 9 | Jagna | mgła, praca ciosami | TX ~300 + ~100 w kodzie | Okolice.f9 | zadania łatwe |
| K59-62, D32, D33 | Lowy 1569 + _Data 477 | paczka | `lowy` v1 | 16 | gajowy, rotmistrz, kłusownik... | zwierzęta, strzelnica | TX ~230 + ~115 w kodzie | Okolice.f9 | zadania łatwe |
| K54 | Motyle 1281 + _Data 196 | paczka | `motyle` v1 | 1 | Kleofas (kronika) | owady, gablotka | ~75 + ~20 | Debug | łatwe |
| Serce, zakończenia | Underground (fabuła ~800) + _Data ~920 | nie | `underground` v1 | - | Lord przy Sercu | film (już interpreter scen z danych), `world()` | TEXT, ENDINGS, EPILOGUE, NOTES ~660 | własne wiersze | dane gotowe, film trudny |
| W1, W2, W3, W6, W8 | TownQuests (W6 ~700, W1 ~330, W8 ~290, W3 ~240, W2 ~130) + dzwon ~220 | tak | townQuests | dziesiątki | wielu mieszkańców | sceny, walki Humans, śledzenie, dzwon | Data + ~220 w kodzie | brak | na końcu, w kawałkach |

### 1.3 Co wspólne, co wyjątkowe

Wspólne (do silnika): rozdziały = kroki zadania z tekstem w dzienniku i `ch`; warunki (flagi, stan, godziny, dzień, krok, rzeczy);
akcje (flagi, stan, notatka, napis u góry, dymek, myśli bohatera, XP, złoto, przedmioty, „krok zrobiony” z nagrodą); rozmowy jako
drzewa kwestii z wyborami; temat w menu postaci (Borgar, bywalcy); skok F9 do rozdziału; stan wątku w `_tw` z wersją.
Wyjątkowe (zostaje kodem, wołane z danych przez **haki**): sceny i filmy, walki (Humans, Creatures), ruch postaci (path8), mini-gry
(dzwon, siłowanie), symulacje (rywal na piętrach, nocni goście kantoru, oblężenie), wstawiane zdarzenia i ich pokazywanie,
sprite'y, mapa i kompas.

---

## 2. Silnik: `js/plugins/Watki.js`

### 2.1 Dlaczego osobna wtyczka, a nie TawernaCore

Rdzeń (warstwa 1) nie wie nic o zadaniach, dzienniku ani TownQuests - i ma zostać mały (jego testy są najszerzej używane). Silnik
wątków to warstwa 3 (systemy): czyta Journal, TownQuests, Story przez `Tawerna.api`. Stoi **zaraz pod Journal** na liście gry
(`python tools/wtyczki.py --dodaj Watki --po Journal`), więc każda wtyczka wątku (także Story i paczki `_Data` nad TownQuests) może
go użyć już przy wczytywaniu. Teksty (`Watki.teksty`) to usługa ogólna - gdyby chciały ich inne systemy (np. Journal, TownLife),
można ją później przenieść do rdzenia bez zmiany plików tekstów.

### 2.2 Co robi

| część | API | opis |
|---|---|---|
| teksty | `Watki.teksty(nazwa)` → obiekt; `Watki.poTekstach(fn)`; `Watki.pliki()`, `Watki.gotowe()`; `Watki.parse`, `Watki.wczytaj(nazwa, tekst)` | plik `js/teksty/<nazwa>.txt` czytany razem z bazą danych (`DataManager.loadDatabase` / `isDatabaseLoaded`) - przed ekranem tytułowym; brak pliku = ekran „Failed to load” z Retry silnika; obiekt wypełniany w miejscu (wtyczka bierze go przy wczytywaniu, teksty są w nim przy grze) |
| rozmowy | `Watki.mowa`: `wrap`, `sayTo`, `linesTo`, `choiceTo`, `script`, `uruchom`, `HERO`, `C` | jeden budowniczy poleceń: 101/401 z `\SPK[n]`, linie po 46 znaków, 3 w oknie, `> ` bohater, opcje `akapity` (`\n`), `kto` (`@klucz:`), `twardaG` - warianty kopii z wtyczek |
| wątek | `Watki.watek(def)` → uchwyt `w`; `w.haki({...})` | dane wątku: stan, rozdziały, rozmowy, akcje, skoki, F9 (2.3) |
| skrypt rozmów | `Watki.act(this, [id, akcja, ...args])` | wołane z poleceń rozmowy; po akcji zdarzenie `watekAkcja` na szynie |
| F9 | `Watki.f9.sekcje()` / `wybierz(row, delta)` / `ok(row)`; `Watki.skocz(id, i)` | Debug.js pokazuje sekcję każdego wątku ze skokami (W4: wiersz `isleW4` jak dotąd); (2026-10-28) wątek może mieć też własne wiersze: `f9: { naglowek, wiersze() -> [{ co, label, icon, desc, pick }], wybierz(row, delta), ok(row) -> { go } \| { say, bad } }` - rodzaj wiersza `isleWatek:<co>` (Podroznicy: prom, przypłyń, odpływ...) |
| dziennik | źródło `"watki"` (`addQuestSource` + `addTrackerSource`) | tylko dla wątków **bez** zadania TownQuests (własny rekord w `_tw.watki`) - stan i źródło powstają dopiero, gdy taki wątek jest; wątek na zadaniu TownQuests ma dziennik TownQuests jak dotąd (automatycznie, z tekstów kroków) |
| zegar | jeden `onMapUpdate("watki")` | myśli bohatera każdego wątku (czasy z danych: `mysli: { klatki, odstep, czekaj }`), sprawdzanie własnych rekordów co 60 klatek |

Zdarzenia szyny: `watekAkcja { watek, akcja, args }`, a dla własnych rekordów `watekStart`, `watekKrok`, `watekKoniec`.

### 2.3 Wątek jako dane

```js
Watki.watek({
    id: "kasztelan", wtyczka: "Kasztelan", teksty: "kasztelan",   // js/teksty/kasztelan.txt
    zadanie: "W4",                                                // rozdziały = kroki zadania TownQuests (bez: własny rekord)
    stan: { klucz: "kasztelan", wersja: 1, domyslne: () => ({...}), migracje: { 2: s => {...} } },   // Tawerna.state
    mysli: { klatki: 230, odstep: 240, czekaj: true },
    kroki: [                                                      // na swoich miejscach w krokach W4 (stare zapisy: te same numery)
        { nazwa: "w4Rod", indeks: 6, ch: 6, gotowe: "rodGotowe", zmienne: "rodZmienne", nagroda: { xp: 120 },
          rozmowy: [{ kto: "pustelnik", gdy: "!stan:clues.kleofas", tresc: ["kleofas", { zrob: "poszlakaKleofas" }] }] },
        { nazwa: "w4Konfrontacja", indeks: 7, ch: 7,
          temat: { kto: "borgar", etykieta: "topic", gotowy: ["rozdzial1", "poZamknieciu", "!barNieMa"], tresc: [{ rozmowa: "konfrontacja" }] } }
    ],
    rozmowy: { konfrontacja: [
        { gdy: "!rozdzial1", mow: "notYet", koniec: true },
        { gdy: "!poZamknieciu", losowo: "notNow", koniec: true },
        "intro", "introHero", "ask",
        { wybor: [{ etykieta: "optTell", tresc: [{ rozmowa: "powiedz" }] }, { etykieta: "optKeep", tresc: [{ rozmowa: "przemilcz" }] },
                  { etykieta: "optLater", tresc: ["later"] }], anuluj: 2 } ] },
    akcje: { keep: [{ stan: { how: "keep", stance: "niewie" } }, { flaga: "borgarNieWie" },
                    { krok: "w4Konfrontacja", do: "w4Serce", nagroda: { xp: 80, notatka: "noteKeep" } }] },
    f9: { rodzaj: "isleW4" },
    skoki: { wymaga: "fabula", przed: [...], lista: { 7: { ch: 7, krok: "w4Konfrontacja", godzina: 23.5, idz: [1, 52, 31, 8], zrob: [...] } } }
});
```

- **Warunki `gdy`**: tekst `"nazwaHaka"`, `"!..."` (nie), `"flaga:x"`, `"stan:a.b"` / `"stan:a.b=wartość"`, `"ctx:x"`, `"krok:nazwa"`,
  `"v:klucz"`; lista = wszystkie; obiekt `{ lub: [] }`, `{ i: [] }`, `{ nie }`, `{ hak, args }`, `{ godziny: [a, b] }`.
- **Akcje `zrob`** (po kolei, jedna rzecz na wpis): `{ stan: { pole: wartość } }` (`"dzis"`, `{ hak }`, `{ arg: i }`), `{ flaga }` /
  `{ flagi }` (TownQuests, bez nadpisywania), `{ v: [klucz, n] }`, `{ przedmiot: [id, n] }`, `{ notatka: klucz }`, `{ ogloszenie: klucz }`
  (napis u góry, para tytuł + podpis), `{ info: klucz }` (dymek), `{ mysl: klucz }`, `{ xp: n, za }`, `{ krok: nazwa | [nazwy], do, nagroda }`
  (rozdział zrobiony - `TownQuests.completeStep` z nagrodą), `{ hak, args }`, `{ emit, dane }`, `{ sprawdz: true }`, blok
  `{ gdy, zrob: [...] }` i `{ gdy, koniec: true }`. `zmienne` - słowa do `{...}` w tekście (hak albo obiekt).
- **Rozmowy**: lista wpisów - `"klucz"` (kwestie klucza), `{ mow, zmienne, kto: "bohater" }`, `{ losowo: klucz }`, `{ hak }` (kwestie
  z kodu), `{ gdy, ..., koniec }`, `{ jesli, to, inaczej }`, `{ rozmowa, ustaw }` (podrozmowa z kontekstem), `{ wybor: [...], anuluj }`,
  `{ zrob: akcja, args }` (polecenie skryptu w tym miejscu), `{ skrypt: "kod" }`. Klucz może mieć `{x}` z kontekstu (`"again.{partia}"`).
- **Kroki na zadaniu TownQuests**: silnik dokłada kroki do `TownQuests.Q.<zadanie>.steps` na ich `indeks` (inny układ = błąd w konsoli
  z napisem „stare zapisy!”) i ich haki do `TownQuests.FX` pod nazwą kroku: `vars` (zmienne), `check` (gotowe), `talk` / `ready`
  (rozmowy z mieszkańcami i ludźmi Story), `borgarTopic` / `borgarList` albo `topic` / `topicList` (temat), `rewardFx`. Tekst kroku
  jest czytany z pliku przy każdym użyciu (getter) - dziennik zawsze pokazuje to, co w pliku.
- **Kod specjalny**: haki rejestrowane przez wtyczkę wątku (`w.haki({ nazwa: (ctx, ...args) => ... })`); `ctx` = `{ spk, key, r, q,
  st, args, ...ustaw }`. Wtyczka dostaje też `w.S()`, `w.flag`, `w.setFlag`, `w.rec`, `w.cur`, `w.at`, `w.stepOf`, `w.complete`,
  `w.rozmowa(nazwa, ctx)`, `w.akcja(nazwa, args)`, `w.mysl(linie)`, `w.skocz(i)`, `w.tx` (teksty).

### 2.3a Wątek z własnymi zadaniami (paczki K / D, etap 3 - 2026-10-28)

```js
const w = Watki.watek({                         // w X_Data.js - nad TownQuests_Data (tam stoją dane paczek)
    id: "cysterna", wtyczka: "Cysterna", teksty: "cysterna",
    stan: { klucz: "cysterna", wersja: 1, domyslne: () => ({...}) },        // ten sam klucz, wersja i pola co dotąd
    mysli: { klatki: 200, odstep: 210, czekaj: "wiadomosc" },              // czekaj: true (zdarzenie albo okno) | "wiadomosc" (tylko okno)
    mowa: { akapity: true },                                               // wariant dawnego wrap/sayTo
    zadania: {                                                             // całe zadania TownQuests (pola TownQuests jak są)
        D28: { kind: "D", giver: null, icon: 391, reward: {...},
            start: ["zbudowana", "flaga:cisternOpen", { mapa: [147, 167] }],  // autoStart (nazwa FX: autoStart albo "d28Start")
            oferta: "poraPawika",                                          // offer.cond.fn (nazwa: offer.cond.fn albo "d28Oferta")
            kroki: [
                { nazwa: "d28Wejdz", gotowe: "stan:been" },                // nazwa = klucz FX kroku (te same co dotąd: testy, inne wtyczki)
                { nazwa: "d28Ksiega", gotowe: "ile:read.ksiega+read.slup>=2", zmienne: { n: { ile: "read.ksiega+read.slup" } } },
                { nazwa: "k63Drewno", type: "bring", to: "drwal", need: [[61, 10]], haki: { hand: "k63Spal", tick: "k63Noc" } },
                { nazwa: "d22Koniec", rozmowy: [{ kto: "latarnik", gdy: "...", tresc: [...], gotowa: false, znacznik: "..." }] }
            ] }
    },
    paczka: { remarks: REMARKS, gossip: GOSSIP, spots: {...}, vitems: {...} },   // reszta paczki window.TownQuestsPacks
    rozmowy: {...}, akcje: {...}
});
w.Q.D28                                          // obiekt zadania (silnik wkłada go do window.TownQuestsPacks i scala słowa "zadania.D28")
```

- Krok: pola silnika (`nazwa`, `gotowe`, `zmienne`, `rozmowy`, `temat`, `haki`, `nagroda`, `nagrodaFx`, `tekst`, `indeks`, `typ`) + każde
  inne pole TownQuests bez zmian (`type`, `to`, `need`, `say`, `done`, `remind`, `early`, `choice`, `deadline`, `end`, `hours`...).
  `haki: { hand, post, tick, enter, blocked, reward, spot, wanted, ch, say, act, ... }` - pozostałe obsługi FX kroku jako haki wtyczki
  (hak dostaje `ctx { w, q, r, st }` i dalej argumenty TownQuests); silnik ustawia pole kroku, które je nazywa (`fx`, `tick`, `guard`...).
- `rozmowy` kroku: `gotowa: false` - kwestia mówiona, ale krok nie gotowy (TownQuests `{ ready: false }`); `znacznik` - dodatkowy warunek
  znacznika nad głową.
- Warunki (nowe): `"stan:a.b>=3"` (też `!=`, `<=`, `>`, `<`; `=` jak dotąd - tekstowo), `"ile:a.b>=3"` (ile prawdziwych wartości ma obiekt
  / lista pod a.b; `"ile:a+b+c"` - ile z tych ścieżek prawdziwych), `"zrobione:K53"`, `"aktywne:K53"`, `"mapa:167"`, `{ mapa: [..] }`.
- Wartości (nowe): `{ stan: "a.b" }`, `{ ile: "a.b", najwyzej: 3 }`; `zmienne` jako obiekt wartości (`{ n: { ile: "gutters" } }`).
- Akcje (nowe): `{ napis: klucz, ikona, kolor, rodzaj, gora: true, pod: klucz }` (popup).
- Pomocniki uchwytu: `w.flag`, `w.setFlag`, `w.vcount`, `w.vgive`, `w.vtake`, `w.qstate()`, `w.done(id)`, `w.active(id)`, `w.rec(id)`,
  `w.cur(id)`, `w.at(nazwa)`, `w.where(nazwa)`, `w.complete(nazwa, { to, reward })`, `w.autoChecks()`, `w.mysl(linie, postać)`,
  `w.mysli()`, `w.thoughtsReset()`, `w.rozmowa(nazwa, ctx)`, `w.uruchom(interp | null, lista)` (bez interp - interpreter mapy),
  `w.akcja(nazwa, args, interp)`; `Watki.mowa.plain(out, tytuł, linie, { spk })` (wiadomość bez mówcy: notatki, karty, słup).
- `w.haki({...})` od razu podpina FX (wtyczka stoi pod TownQuests); wtyczka nad TownQuests - przy pierwszym `mapReady`.

### 2.4 Stan i stare zapisy

Silnik nie zmienia kształtu zapisu: stan wątku to dalej `Tawerna.state` pod tym samym kluczem i wersją (W4: `kasztelan` v1, te same
pola), rekord zadania to dalej `_tw.townQuests.q.W4` z tymi samymi numerami kroków. Nowy klucz `_tw.watki` (rekordy wątków bez
zadania) powstaje dopiero, gdy taki wątek jest na liście - dziś go nie ma, więc zapisy wyglądają jak przed refaktorem. Zmiana
kształtu stanu wątku w przyszłości = `stan.wersja` + 1 i `stan.migracje` (rdzeń robi resztę, jak w ARCHITEKTURA rozdz. 4).

---

## 3. Teksty w plikach: `js/teksty/<nazwa>.txt`

### 3.1 Format

```
# Teksty wątku W4 „Krew kasztelana”, rozdziały 6-8 (...)
# ======================================================================== 7. Konfrontacja przy barze (mówi Borgar)
# temat w menu Borgara
topic = Borgarze... chodzi o twój ród.
[notNow]
Nie teraz, chłopcze. Sala pełna, uszy wszędzie. Po zamknięciu - od jedenastej do pierwszej.
Po zamknięciu. Od jedenastej. Teraz mam ręce pełne kufli.

ask = No? Mów albo idź spać.
[introHero]
> (Klucz kasztelana ciąży w kieszeni.)

[noteKeep]
Przemilczane
Nie powiedziałem Borgarowi, kim był jego ród. To jego tawerna i jego słowa: „Nie pytam o to, czego nie chcę wiedzieć.” (...)

serce.warned = " Borgar ostrzegł: zejdziesz - nie wracaj do pracy."
kroki.w4Piwnica = Borgar się wściekł i zamknął tawernę na dzień {dzien} - bez zmiany. Następnej nocy, od 23:00, czeka w piwnicy przy kracie.
```

- `klucz = tekst` - jeden tekst; `[klucz]` - lista: każda linia pod nagłówkiem to jedna kwestia (jedno okno / dymek), lista kończy się
  na pustej linii; `# ...` - komentarz (też za nagłówkiem listy).
- `> ` na początku kwestii - mówi bohater; bez - postać, z którą się rozmawia (kto - w komentarzu nad listą); `@klucz: ` - inna postać
  (tam, gdzie wątek to obsługuje: TownQuests). `\SPK[n]` dokłada silnik - w plikach go nie ma.
- `{nazwa}` - wstawia gra; `\n` - nowa linia (w notatkach dziennika); kody silnika `\C[2]`, `\N[1]` przechodzą bez zmian.
- `"..."` (cudzysłów prosty) tylko wtedy, gdy tekst zaczyna się albo kończy spacją (dopiski doklejane do innego tekstu).
- Klucz: litery, cyfry, `_`, `-`, kropka = poziom niżej (`greet.baltazar.intro`). Klucze czyta kod - gracz ich nie zmienia.
- Kodowanie UTF-8 (z BOM albo bez), końce linii LF albo CRLF - oba działają (Notatnik).
- Wartość wychodzi taka, jak była w kodzie: tekst albo lista tekstów - kod wtyczki nie musi się zmieniać (`TX.closedBar` dalej działa).

### 3.2 Ładowanie

Wtyczka przy wczytywaniu woła `Watki.teksty("nazwa")` (albo `teksty: "nazwa"` w danych wątku) i dostaje obiekt. Silnik czyta wszystkie
zgłoszone pliki razem z `data/*.json` (`DataManager.loadDatabase`) i wypełnia te obiekty w miejscu, zanim `Scene_Boot` przejdzie dalej -
zanim powstanie jakakolwiek gra. Brak pliku albo błąd serwera = ekran „Failed to load: js/teksty/x.txt” z przyciskiem Retry (jak przy
każdym pliku silnika). Błąd w pliku (linia nie do zrozumienia, klucz dwa razy) = błąd w konsoli z numerem linii; reszta pliku działa.
Teksty potrzebne w danych budowanych przy wczytywaniu wtyczki (np. uwagi mieszkańców) - `Watki.poTekstach(fn)`. Wdrażanie: katalog
`js/` idzie do paczki w całości (ARCHITEKTURA 2.0), edytor RPG Maker plików `js/teksty` nie rusza.

### 3.3 Narzędzie `tools/teksty.js`

```
node tools/teksty.js sprawdz [nazwa...]       błędy zapisu; klucze, których kod nie czyta; klucze, których kod szuka, a pliku nie ma;
                                              słowo dłuższe niż linia okna (46); „” i ( ) nie do pary; prosty cudzysłów " w tekście
node tools/teksty.js porownaj <nazwa> <stary.js|migawka.json> [--obiekt TX] [--pod klucz] [--bez a,b]
                                              znak w znak ze starymi tekstami; klucze przeniesione (ta sama wartość pod innym kluczem)
node tools/teksty.js wyciagnij <stary.js> [--obiekt TX] [--pod klucz]     obiekt tekstów z wtyczki jako plik .txt (do przenoszenia)
node tools/teksty.js lista                    pliki, liczba kluczy, kto je czyta
node tools/teksty.js migawka <wtyczka.js> --kod --obiekt SPEC [...]      stare teksty stałych jako JSON (tests/fixtures/teksty/)
node tools/teksty.js wyjmij <wtyczka.js> --nazwa <plik> --obiekt SPEC [...] [--naglowek "..."] [--wykonaj]
                                              teksty stałych (TX, zadania, mieszkańcy...) do js/teksty/<plik>.txt, w kodzie Watki.scal(...)
node tools/teksty.js kody <wtyczka.js> --nazwa <plik> [--pod kod] [--bez /re/] [--bez-funkcji f1,f2] [--wykonaj]
                                              napisy z funkcji kodu -> kod.<funkcja>.<n> w pliku, w kodzie TK.kod.<funkcja>[n]
                                              ("Karmienia: " + n -> Watki.wstaw(TK.kod.f[4], { n }), szablon „Karmienia: {n}”)
node tools/teksty.js napisy <wtyczka.js>      napisy, które jeszcze są w kodzie
node tools/teksty.js zgodnosc <stara.js> <nowa.js> <plik[,plik]>     każdy napis starej wtyczki jest w nowej albo w plikach
```

SPEC = `NAZWA[=klucz][:rodzaj]`: rodzaj `wszystko` (domyślnie), `zadanie` (pola zadań TownQuests), `nazwy`, `miasto` (każdy napis
poza polami silnika: type, to, giver, flag, check, fx...), `/wyrażenie/` na ścieżkę, `miasto+/^K\d+\./` (oba). Dopiski: `:zostaw`
(pole zostaje w kodzie puste - dla tych, co kopiują je przy wczytywaniu), `:pary` (kwestie scen `[kto, "tekst"]` → `...N.1`),
`:id` (lista zadań: klucze `zadania.K1...` po `id`, nie po numerze - `Watki.scal(QUESTS, "zadania_k", "zadania", "id")`).

Parser narzędzia to ten sam kod co w grze (`Watki.parse`). Dodatkowo gra sama mówi w konsoli o brakującym kluczu („brak tekstu ...”),
a testy z `errorCheck` traktują to jak błąd.

---

## 4. Pilot: W4 „Krew kasztelana” rozdz. 6-8

- `js/plugins/Kasztelan_Data.js` (nowa, zaraz nad Kasztelan.js): cztery rozdziały (kroki W4 6-9), 10 rozmów (konfrontacja, „powiedz”,
  „przemilcz”, werdykt, pogodzenie, noc w piwnicy, warta, kosz, zamknięte, krata) i dwie w rozdziale 6 (Kleofas, dziadek), 10 akcji
  (dwie poszlaki, tell, anger, keep, idzie / pilnuje / ostrzegl, zwolnij, pogodzenie), tematy Borgara przy barze, 9 skoków F9.
- `js/plugins/Kasztelan.js`: 944 → 543 linie. Zostało to, co tylko kod umie: poszlaki czytane z gry, zamknięty dzień i noce,
  posterunki 540-544 (wstawianie, pokazywanie), zamknięta lada i drzwi (`onEventList`), krata, kosz, Serce i epilog, ocena zaufania -
  jako haki danych. API `window.Kasztelan` bez zmian (`debugJump`, `f9Name`, `step`, `state`...).
- `js/teksty/kasztelan.txt`: 130 kluczy (64 list). `porownaj` z migawką sprzed przeniesienia (`tests/fixtures/teksty/kasztelan_przed.json`):
  **122 teksty znak w znak**, 8 nowych kluczy to napisy wyjęte z kodu (tytuł „Ród Kowali”, napis „Poszlaka: ...”, „Siadaj. Ogień jest.”,
  „Nawodnienie +{n}”, cztery teksty wiersza F9 z Debug.js). Usunięte: `basketLook` (nigdy nie pokazywany), `cellarStep` (ten sam tekst
  co krok `w4Piwnica` - teraz `kroki.w4Piwnica`).
- `TownQuests_Data.js`: kroki W4 6-9 wyjęte (wstawia je silnik z danych, na tych samych miejscach). `Debug.js`: wiersz W4 z silnika
  (`Watki.f9`) - ten sam rodzaj `isleW4`, nagłówek, etykieta i opis.
- Testy: `tests/unit/watki.test.js` (26: format, budowniczy, wątek z własnym rekordem, kroki na zadaniu, **rozmowy z danych = polecenia
  starego kodu w 2048 kombinacjach warunków**, akcje, skoki F9), `tests/watki_test.js` (11, port 9625: lista, teksty przed tytułem,
  tekst zmieniony w pliku widać w grze, tekst wczytany w trakcie gry od razu w dzienniku, zapis i wczytanie W4, trzy stare zapisy z
  `tests/fixtures`), `w4_borgar_test` 30/30, `w4_key_test` 16/16 bez zmian w testach.

---

## 5. Jak przenieść następny wątek (przepis)

1. Kopia plików do `backup_art_<data>/refactor_watki/`.
2. Teksty: `node tools/teksty.js wyciagnij js/plugins/X_Data.js > js/teksty/x.txt`, uporządkować (komentarze sekcji, kto mówi),
   napisy z kodu dopisać jako klucze; `TX` w wtyczce = `Watki.teksty("x")`; funkcje w `TX` → szablony `{n}` + `zmienne`.
3. `node tools/teksty.js porownaj x <kopia>.js` - zero różnic (dopuszczalne: przeniesione klucze, nowe klucze z kodu).
4. Dane wątku (`X_Data.js` albo blok na górze wtyczki): `kroki` z `indeks` = dzisiejsze numery, `rozmowy`, `akcje`, `skoki`; haki
   w wtyczce. Usunąć kopie pomocników (`wrap`... `choiceTo`, `think`, `cur`/`at`/`complete`, `debugJump`).
5. Test jednostkowy: rozmowy z danych = polecenia starego kodu (kopia starych funkcji w teście, jak w `watki.test.js`), kroki pole
   w pole; potem testy wątku w grze bez zmian (najwyżej nazwy wewnętrzne), `debug_menu_test`, `rozmowy_test`, `core_fixtures*`.
6. Nowa wtyczka na liście: `python tools/wtyczki.py --dodaj X_Data --przed X --wykonaj`.

---

## 6. Plan dalszych etapów (do decyzji gracza)

Szacunek w sesjach pracy agenta (jak ta: ok. pół dnia każda, z testami).

| etap | co | kolejność | szacunek |
|---|---|---|---|
| **2. Teksty do plików** (bez zmiany logiki) | `TX` / `TEXT` / `lines` każdej wtyczki do `js/teksty/*.txt` narzędziem `wyciagnij` + `porownaj` | Rywal, Cysterna, Motyle, Pustelnia, Kruk, Latarnia, Wrak (TX w .js), Przystan (TX w .js), Garnizon (TX w silniku), Zasoby, Lowy, Ludzie, Orzel, Zakon (funkcje → szablony), Kantor, Dwor, Act3; potem Underground (TEXT, ENDINGS, EPILOGUE, NOTES - duże), TavernLife_Regulars (`REGULARS`), Story i Homes (napisy w kodzie), na końcu `TownQuests_Data.js` w kawałkach (zadania K, D, W, powitania, uwagi) | 5-6 |
| **3. Wątki na silnik** | haki FX → kroki / warunki / akcje / rozmowy w danych, pomocniki usunięte, F9 z danych | najpierw zadania paczek (proste `check` / `vars`): Cysterna, Motyle, Zasoby, Lowy, Kruk, Orzel, Garnizon, Pustelnia; potem Rywal (W9 rozdz. 3: rozmowa przywódcy, wyniki i kroki - symulacja zostaje kodem), Wrak, Latarnia, Przystan, Dwor, Kantor, Zakon, Ludzie; Homes D21 do paczki; Story rozdz. 1 jako wątek z własnym rekordem (źródło dziennika „watki” zamiast wklejania do `Journal.GOALS`); Act3 i Underground tylko skoki i teksty | 8-10 |
| **4. TownQuests w kawałkach** | (a) rdzeń zadań (rekordy, kroki, nagrody, oferty, wybory, terminy, dziennik, znaczniki) do silnika - rekord dalej `_tw.townQuests.q` (później adopcja); (b) zadania K / D bez kodu → dane; (c) W1, W2, W3, W6, W8 - każdy osobno, z testem; (d) skoki F9 dla wszystkich wątków z danych | po etapie 3 | 6-8 |

Razem ok. 20 sesji. Etap 2 daje graczowi najszybciej to, czego chce (wszystkie teksty w plikach do czytania i poprawiania), bez
ryzyka dla logiki. Etap 3 i 4 zmniejszają kod (pilot: −401 linii w Kasztelan.js, +199 linii danych) i dają jedną drogę dla
nowych wątków.

## 7. Ryzyka

- **Stare zapisy**: numery kroków (rozwiązane: `indeks` w danych i błąd w konsoli przy innym układzie), nazwy kluczy FX (zostają),
  prywatne pola `r.t.*` haków (zostają w hakach), pola stanu dopisywane w locie poza `domyslne` (Kantor, Dwor - przy przenoszeniu
  dopisać je do `domyslne`, bez zmiany wersji, bo brakujące pola i tak się dopełniają).
- **Teksty co do znaku**: `porownaj` + test rozmów z kopią starego kodu; łamanie linii i strony okna liczy jeden `wrap` - warianty
  (akapity, twarda spacja przed „G”, `@kto:`) jako opcje wątku, nie nowe zachowanie.
- **Kolejność haków**: przejęcia rozmów i haki `onEventList` zostają we wtyczkach z tymi samymi właścicielami i priorytetami
  (`rozmowy_test` pilnuje drabiny).
- **Plik tekstów zepsuty przez gracza**: gra działa dalej (błąd w konsoli z linią, brakujący tekst = pusta kwestia i błąd „brak tekstu”);
  `node tools/teksty.js sprawdz` przed uruchomieniem. Brak pliku = ekran Retry.
- **Równoległa praca**: TownQuests.js i Debug.js ruszają inni - etapy krótkie, jeden plik naraz, kopie przed zmianą.
- **Testy, które sprawdzają wewnętrzne nazwy** (np. `Kasztelan.act(this, ...)` w poleceniach) - dziś żaden; nowe polecenia to
  `Watki.act(this, [...])`, stare nazwy akcji `Kasztelan.act(this, ["verdict", ...])` dalej działają.

## 7a. Etap 2 - stan (2026-10-23)

Decyzje gracza: format zostaje, jeden plik na wątek albo wtyczkę, klucze jak w kodzie; najpierw wszystkie teksty, silnik potem;
w F9 („Wyspa i fabuła”, Fabuła) wiersz „Wczytaj teksty od nowa” (`Watki.przeladuj`, popup z liczbą plików albo błędem z linią).

- **32 pliki, 7140 kluczy** w `js/teksty/`: kasztelan, rywal, cysterna, motyle, pustelnia, kruk, latarnia, zasoby, lowy, ludzie, zakon,
  orzel, wrak, przystan, garnizon, kantor, dwor, akt3, podziemia, fabula, domy, miasto, zadania_k, zadania_d, w1, w2, w3, w4, w6,
  w8, w9, w10. Każdy plik przeszedł `porownaj` znak w znak z migawką sprzed zmiany (`tests/fixtures/teksty/<plik>_przed.json`,
  migawki napisów kodu `<plik>_kod_<Wtyczka>_przed.json`) i `zgodnosc` (żaden napis starej wtyczki nie zginął).
- Jak teksty wchodzą do gry: `Watki.scal(OBIEKT, "plik", "klucz")` - słowa scalane w obiekt w miejscu po wczytaniu plików (listy
  podmieniane w miejscu, więc kto trzyma listę, widzi słowa); `Watki.teksty("plik")` - cały plik jako obiekt; napisy z funkcji:
  `const TK = Watki.teksty("plik")` na górze wtyczki i `TK.kod.<funkcja>[n]`, z miejscami `Watki.wstaw(tekst, { n })`.
- Zmiany logiki tylko tam, gdzie tekst był liczony przy wczytywaniu wtyczki (zanim są pliki): szablony `{n}` zamiast sklejania
  w funkcjach `TX` (Underground_Data, Zakon_Data przez `kody`), getter nazwy piętra w liście map (Underground.js), `{price}` D21 przez
  `vars` zamiast podmiany przy wczytywaniu (Homes.js), `{od}`/`{do}` rad dziadka (Story.js), klucz `warnBarks.*` → `warnBarks.inni`
  (Act3), słowa Borgara-obrońcy z gettera w `TEXT.borgarObrona` (Act3_Data), `{noce}` w kroku W5 (Kantor), żołnierze garnizonu w Akt III
  (nazwa getterem, słowa w `OBRONA`, Garnizon.js).
- Zostało w kodzie (świadomie): skrypty poleceń zdarzeń (`Kruk.act(this, ...)`, w jednym `Tawerna.popup("Działka należy teraz do
  Lorda.")` w Story.js), znaczniki map („Miejsce: x”), czcionki, wiersze F9 i opisy dla autorów (bossowie podziemi `desc`),
  tytuł rozdziału `CHAPTER` (Story - po nim dziennik szuka rozdziału), sygnały dzwonu `SIGNALS` (klucze „4+2” nie mieszczą się
  w formacie), nazwy miejsc `SPOTS` (TownQuests.js kopiuje je przy wczytywaniu), teksty kopiowane przy wczytywaniu w Zasoby/Lowy/
  Ludzie/Zakon/Latarnia (miejsca i odkrycia `Okolice.registerSpots` / `discoverable`, `defineBuff`, receptury, listy F9 - ok. 200
  napisów; potrzebują `Watki.poTekstach` przy rejestracji albo odświeżenia w Okolice), `tellIf` zadań (listy mieszane), TavernLife_*,
  QuestBoard_Data, Creatures_Data, Debug.

## 7b. Etap 3 - stan (2026-10-28)

Na silniku (dane wątku w `X_Data.js`, a gdy wtyczka nie ma pliku danych - blok na górze wtyczki; kod specjalny jako `w.haki`):

| wątek | zadania / kroki w danych | stan | rozmowy w danych | uwagi |
|---|---|---|---|---|
| Cysterna | D28, K53 (`zadania`, warunki `stan:` / `ile:` / `mapa`) | `cysterna` | zasuwa gałęzi dworskiej | pierwszy wzór |
| Motyle | K54 (oferta hakiem) | w wtyczce | kronika u Kleofasa | |
| Pustelnia | K50, D23; W2 rozdz. 7 jako `obce` | `pustelnia` | spotkanie, Noc Pytania (wybór pytań z danych), karta od Ambrożego / Baltazara | menu Kleofasa i czytanie kart - kod |
| Zasoby, Lowy, Ludzie, Zakon | K55-K70, D30-D38 | swoje | spotkania, pytania z wyborem, akcje | nazwy miejsc i odkryć, wzmocnienia, receptury, F9 - w plikach tekstów (`Watki.poTekstach`) |
| Latarnia, Kruk, Orzel | K49, D22, W11, K51, D24, D29, W13 | swoje | rozmowy kroków (latarnik, Baltazar, Kleofas...) | |
| Garnizon, Wrak | K52, D26, D27, D25, W12 | swoje | spotkania, przychylność, glejt, rekruci, kamienie | myśli Wraka zostały kodem (dymek od razu, bez kolejki) |
| Kantor (W5), Dwor (W7) | W5 10 kroków, W7 8 kroków | swoje (pola dopisywane w locie - w `domyslne`) | najem, „komu”, zebranie; Lord, ślady Feliksa, szuflada, właz | skoki F9 z danych (`skoki`), `debugJump` = `w.skocz`, Debug.js bez zmian |
| Rywal (W9 rozdz. 3) | 2 kroki W9 (`zadanie: "W9"`, indeksy 1-2) | `rywal` | rozmowa przywódcy (opcje drużyn z warunkami) | symulacja zejścia - kod |
| Przystan | K47, D20, W10 jako `obce` (zostają w TownQuests_Data) | `przystan` | spotkania, noc Rocha, donos u celnika | menu Janka / Rocha, listy matki - kod |
| Story rozdz. 1 | wątek z własnym rekordem (`_tw.watki.w.fabula`, FABUŁA): 9 kroków (dziadek, działka, praca, zmiana, dług; po stracie: wyniesienie, dach; piwnica; odkup), `pomin` dla drugiej drogi, `prowadzi` - okienko celu idzie za rozdziałem samo, `dogon` - stary zapis nadrabia kroki po cichu z dniami z dziennika | `story` (adopt `_story`) | wstęp, podziękowania, pierwsza rozmowa po stracie | decyzja gracza 2026-10-28: wpisy jak w innych wątkach; „Zbuduj schronienie” zostaje celem dziennika (po warsztacie) |
| Homes D21 | D21 (`zadania` wątku „domy” w Homes.js; wtyczka pod TownQuests - silnik wkłada zadanie od razu do TownQuests.QUESTS) | w wtyczce | - | wybór aktu u sołtysa: `haki.pick` kroku |

- Silnik dostał: zadania wątku (`zadania`, `paczka`, `start`, `oferta`), obsługę cudzych kroków (`obce`), `haki` kroku (wszystkie obsługi FX
  TownQuests), warunki `ile:` / porównania / `zrobione:` / `aktywne:` / `mapa` / `v:x>=n`, wartości `{ stan }` / `{ ile }`, akcję `napis`,
  wpis rozmowy `polecenie`, `gotowa: false` i `znacznik` w rozmowach kroku, `mysli.czekaj: "wiadomosc"`, `Watki.mowa.plain`, łamanie po
  pikselach (`mowa.px` - Story) i twarz mówcy (`twarz`), `w.uruchom` bez interpretera. Testy: `tests/unit/watki.test.js` (34).
- `tools/audyt/przejscie.js` zna wątki z `zadania` / `obce` i sprawdza, czy każdy hak nazwany w danych jest w kodzie; `tools/teksty.js`
  zna `zadania:` (klucze `zadania.*` czytane).
- Stare zapisy: te same klucze i wersje stanów, te same numery kroków; dawne wywołania skryptów `X.act(this, [...])` z rozmów zapisanych
  w trakcie przekierowane na nowe akcje. Znikły tylko wewnętrzne nazwy FX, których nikt nie wołał (`d28Vars`, `k53Vars`, `w5Vars`,
  `w7Kronika`..., `w12Vars`) - obsługi kroku mają nazwę kroku.
- Kod wtyczek wątków: 21 606 → 20 235 linii (−1371), dane 3579 → 4286 (+707), razem −664; Watki.js 888 → 1049.
- Własne rekordy wątków (Story): kroki z `tytul`, `pomin`, `gdzie` (kompas), `licznik` (pasek w okienku celu), `prowadzi`; dziennik
  `prowadzi`, `dogon`, `dzienKroku`; `Journal.addTrackerSource(fn, { fallback: true })` - źródło pytane po innych, przed celem
  dziennika (miejsce, które miały cele rozdziału 1). Przypięcie wątku ma id wiersza (`watek:<id>`).
- Poprawki po decyzjach gracza (2026-10-28): D26 - „dziennik okrętu” daje swoje +5 Opinii (krok przed sprawdzeniem zadań). Usunięcie
  „nieczytanych” kluczy tekstów (88) okazało się błędem - część czyta się dynamicznie (`f9Names.*`, klucze z danych) - wszystkie
  wróciły 2026-10-29 („przywrócone” na końcach plików); `tools/teksty.js sprawdz` zostawia przy nich tylko uwagę.

## 7c. Etap 4 - stan (2026-10-29): TownQuests w kawałkach

- **Rdzeń**: TownQuests.js buduje rozmowy jednym budowniczym silnika (`Watki.mowa.sayTo / linesTo / choiceTo / C / fill`, opcje
  `{ akapity, twardaG, kto }` - to samo łamanie co dotąd). Silnik: `paczka: false` (zadania wątku wkłada do listy właściciel, na ich
  miejscach), `tekstyZadan: false` (słowa scala dalej TownQuests_Data po id), `teksty` zadania, krok `obcy` (obsługi z innego wątku -
  W2 rozdz. 7 jest Pustelni: pola kroku zostają, nic nie jest wiązane pod jego nazwą; test w `tests/unit/watki.test.js`, 39).
- **Zadania K/D bez kodu** (22: K2-K4, K6, K8, K10-K12, K21, K26, K30-K32, K40-K46, D1, D5): wątek „miasto” w TownQuests_Data.js
  (`MIASTO.Q.<id>` na starych miejscach QUESTS), kroki z nazwami `<id><Przynies|Rozmowa|Miejsce|...>`.
- **Łuki** - każdy wątkiem we własnej wtyczce danych nad TownQuests_Data (`W1_Data.js` „w1”, `W2_Data.js` „w2”, `W3_Data.js` „w3”,
  `W6_Data.js` „w6”, `W8_Data.js` „w8”); w QUESTS `ARC("w1", "W1")` na starym miejscu. Nazwy kroków = dawne nazwy obsług FX (Dwor.js,
  Underground.js i stare zapisy znają kroki po nich i po numerach - bez zmian); obsługi, które nie są krokiem (wspólne `vars`, drugi
  `tick` kroku, `show`/`at` miejsc, `cond.fn` ofert innych zadań) - `obce` tego samego wątku. Kod kroków: haki w TownQuests.js
  (`W1X` + `W1_HAKI` ... `W6_HAKI`, wiązane na końcu pliku), dawne metody spoza kroków w `WnX` (`W1X.TAG / ambushEnd`, `W3X.maybeDone /
  defendEnd`, `W8X.count / duelEnd`, `W6X.risk / tally`...). Z zewnątrz dalej działają `TownQuests.FX.w8Choice.count()` (Rywal.js,
  w6_test - klucz `haki.count`) i `FX.w3Verse.source` (owija go Dwor.js - wewnętrzne wywołania idą przez FX). Start łuku:
  `autoStart: "startWn"` + `start: { hak }` (jedyna różnica w obiekcie zadania: pole `autoStart`).
  | łuk | kroki | haki | obce | warunki w danych |
  |---|---|---|---|---|
  | W1 | 11 | 20 | - | `flaga:sluiceFound` |
  | W2 | 11 (rozdz. 7 `obcy: "pustelnia"`) | 12 | w2Sell | `zrobione:D16` |
  | W3 | 7 | 25 | - | - |
  | W8 | 9 | 36 | w8Vars, w8Wall, w8Crate | - |
  | W6 | 7 | 41 | 8 (w6Vars, w6Wave, w6NotHated - K27/K28/D10, w6Camp, w6Second, w6Work, w6Helper, w6Prop) | - |
- **Przystań**: wątek „przystan” (stan, mowa, 6 rozmów, 6 akcji, zadania K47, K48, D20, W10 - 15 kroków) w `Przystan_Data.js`;
  Przystan.js bierze go `Watki.get("przystan")` i daje haki; klucz i wersja stanu bez zmian.
- **Liczby**: obiekt FX w TownQuests.js 117 wpisów / ok. 2060 linii → 60 / ok. 895 (reszta: zadania K/D z kodem, K22/K33/D13/D6, W4,
  W9, miejsca i oferty); sekcje haków łuków ok. 1150 linii; TownQuests.js 4779 → 4739, TownQuests_Data.js 1415 → 1254, nowe dane łuków
  i przystani ok. 410 linii (bez nagłówków).
- **Sprawdzenie**: migawka wszystkich zadań (`snap_tq.js`: obiekt zadania ze słowami, check, vars, rozmowy każdego mieszkańca, znaczniki,
  dziennik, oferty - w 3 światach, dla każdego kroku) przed etapem i po: różnice tylko `autoStart` W1/W2/W3/W6/W8 (+ nowe W15/W16
  podróżnych). Fale W6 podróżnych (`CALENDAR.waves`, `waves()/isWave()`, `w6Obecni`, werbownik, rekwizycja, oferty K5/K27/K28/D14/K49)
  bez zmian.

## 7d. Etap 5 - stan (2026-10-29): reszta TownQuests na silniku

- Wszystkie zadania TownQuests_Data są wątkami silnika; obiekt `FX` w TownQuests.js jest pusty (same komentarze-wskaźniki) - każdą
  obsługę robi silnik z haków. Grupy (każda wtyczka danych nad TownQuests_Data, w QUESTS `ARC(wątek, id)` na starych miejscach):
  | wątek | plik | zadania | kroki | haki | obce |
  |---|---|---|---|---|---|
  | rynek | Rynek_Data.js | K1, K5, K9, K13, K14, K15, K16, K17, K20, D3, D16 | 17 | 30 | 6 (k5Vars, k9Fair, k9Dice, k13Silence, k16Trade, k20Bonus) |
  | straz | Straz_Data.js | K38, D11, D14, D17, K37, K39 | 18 | 28 | 1 (k37Hold) |
  | oboz | Oboz_Data.js | K19, K27, K28, K29, D4, D10, D18 | 14 | 21 | 1 (d4Reward) |
  | goscie | Goscie_Data.js | K22, K33, D13, D6 | 13 | 36 | 3 (d13Offer, d6Late, d6Bribe) |
  | w4 | W4_Data.js | W4 rozdz. 1-5 (kroki 6-9 dokłada dalej Kasztelan_Data) | 6 | 16 | 1 (w4Open) |
  | w9 | W9_Data.js | W9 rozdz. 6 (kroki 1-2 dokłada dalej Rywal) | 1 | 9 | - |
- Silnik: `pola` wpisu (`obce` / krok) - zwykłe wartości na wpisie FX obok haków (`FX.k16Trade.GOODS`, czyta je w6_test);
  test w `tests/unit/watki.test.js` (40).
- Metody, które wołał ktoś z zewnątrz, zostały na FX jako klucze haków: `FX.d13Offer.pred` (regulars_quests_test), `FX.w9Truth.act`
  (Kasztelan.js), `FX.k16Trade.goods/left/GOODS`; reszta dawnych metod pomocniczych w `STRAZX` (pościg K37), `GOSCIEX` (D13/D6),
  `OBOZX` (K27).
- Liczby: TownQuests.js 4739 → 4722 linii (obiekt FX 895 → 15, sekcje haków wszystkich wątków ok. 2000), TownQuests_Data.js 1254 → 805,
  nowe dane grup ok. 760 linii.
- Sprawdzenie: migawki grup przed / po - 0 różnic (poza `autoStart` W4 i W9); fale W6 podróżnych, K5 (czwarty bochen), K27/K28/D10
  (od dnia 10/11, `w6NotHated`), D14 (od dnia 25) bez zmian.

- **F9 z silnika** (Debug.js nie zna już Act3, Underground, Kantor, Dwor ani Rywal; nikt nie dokłada wierszy do listy z zewnątrz poza
  `isleW10` Przystani): `f9.wiersze` może być listą danych `{ co, rodzaj, etykieta, opis, ikona, pola, gdy, zmienne, wybierz, ok }`
  (etykieta / opis - klucze tekstów z `{x}` z haka `zmienne`; `wybierz` / `ok` - haki wtyczki; OK zwraca `{ go }`, `{ back }`,
  `{ say, bad }` albo `{}`), `f9.zakladka` („wyspa” - domyślnie, albo „zdarzenia”), `f9.kolejnosc` (sekcje bez niej pierwsze, w
  kolejności wtyczek, potem według liczby), `f9.nazwy` (własny klucz nazw rozdziałów), `{name}` w opisie skoku; dawne `wiersze()`
  (podróżni) bez zmian. Wątki: „akt3” (Act3_Data: uzbrój / napad teraz / wyczyść, zakładka zdarzeń), „podziemia” (Underground_Data:
  piętro, krata, zamki, winda, trzy wiersze Serca), W5 (Kantor_Data, `kolejnosc: 5`), W7 (Dwor_Data, 7), W9 (Rywal_Data: wariant i
  spotkanie, 9). Rodzaje wierszy (`underground`, `ugGate`, `act3_*`, `isleW5`...) i ich kolejność bez zmian. Debug.js 943 → 858 linii.
  Klucze `f9.txt`, których kod już nie czyta (33), zostały (uwagi `sprawdz`).

Do zrobienia (reszta): wiersz F9 W10 (`isleW10`, Przystan.js) na silnik; wpis rozmowy z mówcą na wpis (sceny wielu postaci: pomiar
działki, oprowadzanie).

## 8. Pytania do gracza

1. Czy format plików tekstów jest czytelny (przykład w rozdz. 3.1, cały plik: `js/teksty/kasztelan.txt`)? Klucze zostają takie, jak
   w kodzie (często po angielsku) - nowe dajemy po polsku. Woleć jeden plik na wątek (jak teraz) czy jeden na wtyczkę?
2. Kolejność: najpierw wszystkie teksty do plików (etap 2), czy wątek po wątku od razu na silnik (2 i 3 razem)?
3. Czy dodać w F9 wiersz „Wczytaj teksty od nowa” (poprawka w pliku widoczna bez ponownego uruchomienia gry)? Silnik to umie
   (`Watki.wczytaj`), brakuje tylko wiersza.
4. Teksty `basketLook` i `cellarStep` z W4 nie były nigdzie pokazywane (drugi to kopia tekstu kroku) - usunięte. W porządku?
