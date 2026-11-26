# Do zrobienia - 26 listopada 2026

Stan na koniec dnia 25 listopada. Nic z dzisiejszej pracy nie jest jeszcze zacommitowane (37 zmienionych plików, nowe obrazki i testy).

## 1. Umiejętności - czekają na Twoje odpowiedzi

Strona z drzewkami: https://claude.ai/artifact/7AhJnhhssZV9hmxpQE58qY
Dokument z przeglądem: https://claude.ai/artifact/5LbQpkZRWXiX529FSexcEf

Cztery pytania, bez których nie ruszam przebudowy w grze:

1. Progi drzewek na poziomach 1 / 3 / 6 / 10 / 14 / 18 - tak?
2. Punkty umiejętności: +1 za rozdział / bossa, czy 2 na poziom?
3. Wszystkie 7 połączeń starych umiejętności i nowe umiejętności - tak?
4. Jednorazowy zwrot punktów w starych zapisach - tak?

Już ustalone i wpisane na stronę (do zrobienia w grze po odpowiedziach): zamaszyste cięcie 10 / 30 / 50%, szeroki zamach +5 / +10 / +15% szerokości (kilof bije jednego), wstrząs 20% szans na ogłuszenie 0,2 / 0,4 / 0,6 s, wir - przytrzymane O kręci się i bije wszystko dookoła przez 10 s, P przerywa; Wytrych w Rzemiośle; Unik mistrza daje stopnie uniku.

## 2. Autopilot - całą grę

- **Pełna gra od nowa (przebieg calosc2)** - jeszcze szedł na koniec dnia. Dług spłacony, dzień 40, wątek W4. Utknął na „robię kamienny kilof (stary się zużył)” - sprawdzić raport `tests/autopilot_fabula/raport_calosc2.md` i naprawić robienie nowego kilofa.
- **Od piętra 10 (glebiej3)** - doszedł do piętra 20, utknął na piętrze 19 („Czekam (etap 2)”), 26 śmierci. Raport: `tests/autopilot_fabula/raport_od_po_pietrze10_glebiej3.md`. Do poprawy: przeżycie w podziemiach (walka, leczenie, odwrót), potem dalej do Aktu III i zakończenia.
- Zamknięcie się na działce (dzień 17-19) już się nie powtórzyło: sosny i budowle nie odcinają działki od bram.

## 3. Do sprawdzenia w grze (zrobione, ale nie widziane w prawdziwej grze)

- Pułapki zauważane bez skradania (skradanie dalej pomaga).
- Przesunięty płot działki w starym zapisie: rzeczy z rzędu 24 wracają do plecaka.
- Autopilot: picie z rzeki, gdy studnia miejska wyczerpana.
- Broń w ręce: obejrzeć wszystkie 18 rodzajów w grze. (26.11: z zapaloną pochodnią broń jest już w drugiej, wolnej ręce - test 8/8.)
- Unik: ocenić, czy przysiad + podskok wyglądają naturalnie; jeśli nie - prawdziwa animacja odskoku z PixelLab.
- Kamera: przejść kilka scenek (młyn, prom, jarmark, kopalnia, lot orłem) i sprawdzić, czy kamera nie wraca do bohatera za wcześnie. Przy krawędzi mapy kamera staje (bohater nie na środku) - czy tak zostawić?

## 4. Drobne

- ~~Test orła szuka usuniętej mapy Map013~~ - zrobione 26.11: sprawdzenie pliku Map013 usunięte, test 89/89.
- Po zmianie ubrania pierwsze ułamki sekundy niektóre ruchy mogą pokazać poprzedni strój (przebieranie idzie teraz w tle) - sprawdzić, czy to widać.

## 5. Commit i push

Zrobione 26.11 (commit 240490b2, wypchnięty): wszystko z 25 listopada (unik w trzech stopniach, krzyżowanie broni, broń w ręce, kamera, przebieranie w tle, sadzonki, autopilot, Wytrych, F9 +10 000 000 doświadczenia).

## Zrobione 26 listopada (rano)

- Autopilot: gdy zużyje się siekiera, robi kamienną (z gałęzi, kamieni, włókna) - wcześniej kręcił się 8 dni na „robię kamienny kilof”.
- Luźna cegła w tawernie (W4): otwiera się też po rozmowie z Borgarem w ramach W4 (krok 1 i dalej), nie tylko po starym „Zapytaj wprost o zamek”; stary cel w dzienniku zamyka się sam. (Cegła i zejście są na zapleczu - drzwi za ladą; to nie był błąd mapy.)
- Autopilot przechodzi przez drzwi w obrębie mapy (zaplecze tawerny), zamiast „obchodzić błąd mapy”.
- Autopilot krzyżuje broń z uzbrojonym wrogiem (zbroje, bandyci) i bije ciężko, gdy wróg traci rytm.
- Przebiegi: od nowej gry (calosc3) i od piętra 10 (glebiej4) - w toku.
