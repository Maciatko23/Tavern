# Wydajność, etap 3: logika świata i wyszukiwanie zdarzeń (2026-10-30)

Notatka do połączenia z docs/WYDAJNOSC.md. Prośba gracza: „ma być super wydajnie na średnim kompie”.

## Co zmieniono

1. **Indeks zdarzeń na kratkach: ODRZUCONY i usunięty.** Wymagał akcesorów `_x/_y/_characterName` na `Game_Event.prototype`, a to zmienia format zapisu gry (pola `_xv/_yv/_cnv`, także przy wyłączonym kluczu; stare zapisy z własnym `_x` dają obiekty o różnych kształtach na gorącej ścieżce). Zysk 0,3-1,5 ms był w szumie. Pomysł na przyszłość bez zmiany zapisu: indeks odbudowywany co klatkę (jedno przejście po zdarzeniach przy pierwszym pytaniu w klatce) albo wywoływany z miejsc, które ruszają zdarzenia (`setPosition`, `moveStraight`, `setImage`), bez zmiany pól obiektu; pytania w środku klatki po ruchu trzeba wtedy unieważniać.
2. **Warstwa kamieni i miejsca zbieractwa** (Farming_Plots.js, Farming_Render.js, Dog.js).
   - Nowe `Farming.gatherTiles()`: płaska lista `[x, y, rodzaj, ...]` kratek, na których `gatherKindOf` mówi „może coś leżeć”,
     wiersz po wierszu (jak dawny przegląd całej mapy). Zależy od mapy, jej rozmiaru i zbioru kratek szyszek (`coneTiles`: raz na
     dzień i przy zmianie listy zdarzeń) - Set jest kluczem. Dawniej przebudowa warstwy i szukanie psa liczyły trzy hasze na każdą
     kratkę mapy.
   - `Sprite_StoneLayer.rebuild` idzie po tej liście; `update` porównuje cztery liczby (mapa, licznik zbieractwa, dzień, rewizja
     farmy) i pozycję widoku jako liczby, nie napisy budowane co klatkę. Przebudowa następuje tylko, gdy coś się zmieniło
     (zbiór, dzień, rewizja farmy) - jak dotąd; teraz jest tańsza i dwa razy rzadziej woła `eventsXy`.
   - `Dog.findTile`: tylko kratki z listy, a przy `center` tylko pudełko promienia (`abs` przed `hypot`). Kolejność i remisy jak dawniej.
3. **Wczesne wyjście w `Game_Map.update`**: wtyczki Lowy, Act3, Creatures, Humans, Livestock, Hunting nie robią kopii listy
   (`slice()`), a Creatures nie woła `updateSwarms` / `updateRings` (filter), gdy list nie ma. Nic poza tym: profil pokazał, że
   „5-7% klatki” na każdej z tych wtyczek to zagnieżdżony łańcuch `Game_Map.update` (cała praca poniżej wliczona do każdej) - własny
   koszt owijek jest znikomy; prawdziwa praca to `Game_Map.updateEvents` (zdarzenia), zwierzęta (Lowy/Hunting_AI) i
   `TownLife.tick` (ok. 2% w miasteczku: `drive` -> `entryAt` / `absent`, plan dnia sprawdzany co klatkę dla każdego mieszkańca;
   warunki `when` mogą się zmienić w każdej chwili, więc nie dodano pamięci podręcznej - to kandydat na później).
4. **Test** (`tests/wydajnosc_test.js`): budżety `farma: 22` i `burza: 22` ms (chodząc, CPU 4x wolniejsze; przed przyspieszeniami
   2026-10-24 farma 47-51, burza 45-47).

