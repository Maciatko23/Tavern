# Czego NIE ruszać w nowej tawernie (kod i fabuła szukają tych zdarzeń)

Stan: wersja zbudowana pierwszą metodą (staging w tools/tawerna2/staging). Numery zdarzeń z map w tym stagingu; przy ponownym składaniu map z kawałków starych map numery zdarzeń z kawałków zostają te same (stare id), więc lista dotyczy także nowego układu.

## Parter (Map001)
- Zdarzenia 1-4: Borgar Kowal, Melia Srebrogłosa, Grum Żelazna Pięść, Dziadek Ozzy (Act3 i inne wtyczki wołają je po numerze i nazwie). 5-8 „Atmosfera - …” (równoległe).
- 52 „Lada - rozmowa z Borgarem” i „Tavern:meal (zamówienie posiłku)” (tag `<Tavern:meal>`): lada, zamówienia, zamykanie lady.
- 9 „Luźna cegła” (przejście do piwnicy Map009 10,8; stan w Map009 ev1/ev2 wraca tutaj).
- 209 „Stare drzwi” (obrazek drzwi spiżarni; oblężenie Act3 liczy ich wytrzymałość).
- 21 „Tablica zleceń” (tag `<Tavern:board>`) i 19 (obrazek); 349 „Plan karczmy” (tag `<Tavern:plan>`).
- 360 „Grajek na scenie”; zdarzenia tagowane `<Tavern:stage|dice|arm|darts|mealtable|meal>` (miejsce słuchacza, kości, siłowanie, rzutki, miejsca przy stole).
- 400-429 „Gość stołowy” z `<Siedzi:Klucz>`: miejsca siedzące wieczornych gości (stoją na krzesłach przy stołach - krzesło musi mieć sąsiedni kafel stołu: stół okrągły 842/850/859/867/863/871/844/852 na warstwie 2, długi 416/424/432/439/447 na warstwie 3, krzesło/stołek 390 lub 387/395/386/394).
- 53-59, 62 „Miejsce: gosc_N” (znaczniki stojących gości). Wyjścia „Wyjście -> Kruczogród” (10-12) i „Schody -> Pokoje gości”.
- Zdarzenia świateł (tagi `<Light:...>`, `<LightWhen:night>`, kominki): ogień = światło; nie zamieniać na zwykłe obrazki.
## Pokoje gości (Map025)
- Drzwi „Drzwi -> Pokój N” / „Wejście -> Pokój N” (nazwy dokładnie takie: Intrygi), „Wyjście z pokoju: …”, „Drzwi -> Komnata”.
- Łóżka z komentarzem `<Tavern:bed room=N …>` (1, 2, 3, komnata), świece `<Tavern:candle …>`, drzwi `<Tavern:door room=N>`; kufry/torby „Kufer…”/„Torba…” w pokojach (przeszukania szukają ich w prostokącie pokoju).
- „Złota krata” (`<Tavern:gate>`), „Dzwonek na odźwiernego”, schody (288-290 w dół, 293-295 w górę).
- Ściana między pokojami 1 i 3 oraz 2 i 4 ma być jednokomórkowa (podsłuchy D45 i D44).
- Pokój 1 nie może być zamurowany: tam ukrywa się Rafał (W6, zdarzenie 951).
## Poddasze (Map026)
- Drzwi Lorda (3, 5), Złotego (21), łoże „do wynajęcia (Apartament Złoty)” z `<Tavern:bed room=zloty …>` i świeca z `<Tavern:candle room=zloty>`; stół w salonie Lorda (narada W14); schody 159-164.
## Piwnica (Map009)
- Zdarzenie 1 (samoprzełącznik A czyta dziennik), 2, 7 „Stara krata zakonu”.

## Uzupełnienie (stan po drugiej metodzie, układ „wycięte kawałki starych map”)
- Parter: miejsca gości = zdarzenia „Gość stołowy” id 400-422 (stare id), „Miejsce: podrozny_N / kompania_N / grajek / medyk” (nowe, po jednym), cegła ev9 w spiżarni (przejście do Map009), „Stare drzwi” ev209 w drzwiach spiżarni (oblężenie).
- Piętro gości: balie „Balia” z tagami `<Tavern:bath>` (ev365, 366) i Łaziebna Wanda (ev367) w łazience; Kufer w pokoju 4 (ev363), Torba w pokoju 8 (ev364); „Złota krata” ev298; schody 288-290 (w dół) i 293-295 (do apartamentów).
- Numery pokoi w nazwach drzwi („Drzwi/Wejście -> Pokój N”) muszą zostać: Intrygi zamyka po nich drzwi zajętych pokoi.
