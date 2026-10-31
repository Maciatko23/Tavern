# Wydajność, etap 3: odświeżanie postaci i obiektów na mapie (2026-10-30)

Notatka do połączenia z docs/WYDAJNOSC.md (tamtego pliku ta praca nie edytuje).

## Co zrobiono

### 1. Rozdzielacz haków postaci: `Tawerna.sprite` (TawernaCore.js)

Szesnaście wtyczek owijało `Sprite_Character.update / updateBitmap / updateFrame / updatePosition / updateOther`, każda własnym
domknięciem: dla każdego zdarzenia na mapie (drzewo, kamień, tabliczka) łańcuch wywołań głęboki na szesnaście poziomów, choć większość
haków dotyczy kilku postaci. Teraz TawernaCore owija każdą z tych pięciu metod **raz**, a wtyczki rejestrują hak:

```js
Tawerna.sprite.hook({
    owner: "MojaWtyczka",
    method: "updatePosition",              // update | updateBitmap | updateFrame | updatePosition | updateOther
    when: s => s._character instanceof Game_Event && !!jakasNotatka(s._character),   // tani warunek "dla kogo", opcjonalny
    before(s) { ... },                     // przed tym, co pod spodem (wcześniej załadowane haki i metoda silnika)
    replace(s) { ...; return true; },      // true: reszta (to, co pod spodem) nie jest wołana; false: jest, jak przy owinięciu, które przepuszcza
    after(s) { ... }                       // po tym, co pod spodem
});
```

Reguły:

- **Kolejność** to kolejność ładowania wtyczek (pierwszy zarejestrowany jest najgłębiej, jak pierwsze owinięcie): te same wywołania w tej
  samej kolejności co przy owinięciach.
- **`when` liczy się raz na postać** (i od nowa przy zmianie strony zdarzenia, przy zmianie obrazka postaci `setImage` /
  `setTileImage` - to robi rdzeń - oraz po `Tawerna.sprite.dirty(postac)` / `dirty()`). Ma więc zależeć od tego, co się nie zmienia:
  klasa, notatka, numer zdarzenia, mapa, nazwa obrazka. Jeśli warunek zależy od stanu, który wtyczka sama zmienia w locie
  (np. HomeLife: `_homePose`), wtyczka woła `Tawerna.sprite.dirty(postac)` w miejscu, gdzie ten stan zmienia.
- **Ciało haka musi się samo w pełni zabezpieczać** (tak jak robiło owinięcie): z `Wydajnosc.opts.dispatch = false` (czyli
  `Tawerna.sprite.filter = false`) każdy hak idzie dla każdego sprite'a i obraz ma być ten sam. `when` jest tylko wstępnym sitem.
- Hak bez `when` idzie dla każdego sprite'a (jak dawne owinięcie, ale bez głębokiego stosu).
- **Nowa wtyczka nie owija `Sprite_Character.prototype.update*`** - rejestruje hak. `patternWidth` / `patternHeight` nadal owija się po
  staremu (HomeLife, HeroLook, Hunting) - nie są w rozdzielaczu.

Przeniesione wtyczki (13): TawernaCore (`<Px:>`), Ludzie (`<LudOff:>`), CharacterPolish, Combat (tylko gracz i zwierzęta), Creatures
(tylko `isCreature`), QuestBoard (tylko zwierzęta i tablica), TownQuests (tylko miejsca / mieszkańcy / dwaj z fabuły / tawerna / posąg),
ChoppableTree (updatePosition, updateOther, updateFrame: tylko gracz, rzeczy do zbierania, drzewa dekoracyjne), HeroLook (tylko gracz),
Ubior (tylko gracz), TavernLife_Render (tylko gracz), HomeLife (4 haki: tylko postacie z pozą / rekwizytem), Hunting (3 hooki: tylko
postacie z obrazkiem z `LOOK8`; `Hunting.look8(false)` woła `dirty()`).

Przełącznik: `Wydajnosc.opts.dispatch`.

### 2. Rzeczy nieruchome daleko poza ekranem: "still" (Wydajnosc.js)

Zdarzenie z konfiguracją zbieractwa (drzewo, kamień, krzak, pień, kłoda: `ChoppableTree_Objects.anyHarvestConfig`), które jest
**ustalone** i **daleko** (ten sam margines co `lazy`), nie jest odświeżane **wcale** (dotąd co 4. klatkę). Ustalone: jego wygląd
(miejsce, obrazek, strona, wzór, kierunek, przezroczystość, ...) taki sam jak przy ostatnim odświeżeniu, które samo było wykonane,
gdy już było daleko (cienie i warstwy ułożone "na daleko"); nic się na nim nie przewraca, nie rozbija, nie żarzy. Zmiana któregokolwiek
z tych albo zbliżenie do ekranu - i od razu znów co klatkę. W tym czasie:

- nie liczy się mu macierzy (`Sprite_Character.updateTransform` wraca od razu),
- nie jest rysowany (`render` wraca od razu; leży poza marginesem, więc i tak nie byłoby go widać).

Przełącznik: `Wydajnosc.opts.still` (tylko `lazy` co 4. klatkę, gdy false). Statystyka: `Wydajnosc.stats.idle`.

**Zasada 0 w skrócie (do dopisania do WYDAJNOSC.md):** kod, który czyta sprite innego, odległego zdarzenia (x, y, klatka,
`_occluder`), dostaje dla ustalonych rzeczy daleko poza ekranem stan *sprzed dowolnie dawna* (nie sprzed 1-3 klatek). Logika gry ma
czytać postać (`Game_Event`), nie sprite. Sprite, który musi iść zawsze, ustawia `sprite._wyKeep = true`. Miejsca, które czytają
sprite'y wszystkich postaci (`_characterSprites`) - Sky.js `standing` / `occluders`, ChoppableTree_Render `emberLights`, Torch -
czytają pozycje z ostatniego odświeżenia: ustalona rzecz daleko ma je sprzed dawna, ale leżą one (w współrzędnych ekranu) poza
ekranem z marginesem (FAR_PAD 512 w nocy, DAY_PAD + cień za dnia), więc nie trafiają w obraz ani w zasięg świateł. Nie ma pełnego
audytu każdego czytelnika - gdyby ktoś zobaczył ducha cienia daleko od ekranu, `opts.still = false` to wyłącza. Sprite zbieractwa
schodzi z listy "ustalonych" sam, gdy tylko pali się, przewraca albo rozbija.

## Pomiar

CPU 4x wolniejsze, `--cicho`, mediana z 3 przebiegów, naprzemiennie (przed, po, przed, po...) w osobnych sesjach gry. "Przed" = pliki
13 wtyczek z HEAD i `still` wyłączone; "po" = obecne. Komputer był obciążony (inni agenci mierzyli), rozrzut przebiegów 2-5 ms:
traktować jako rząd wielkości, nie dokładną liczbę.

| miejsce | przed (ms) | po (ms) | uwagi |
|---|---:|---:|---|
| Kruczy Jar, idzie | 24,0 (krok 14,9 + rys. 9,0) | 22,8 (14,2 + 8,6) | ok. -5% |
| farma 17:00 | 25,0 (15,7 + 9,3) | 22,3 (13,9 + 8,4) | ok. -11% |
| burza | 23,9 (15,2 + 8,7) | 23,6 (14,6 + 9,0) | w szumie |
| miasto, idzie | 16,3 (11,6 + 5,2) | 17,7 (12,0 + 5,8) | w szumie (drzew tu prawie nie ma, `still` nic nie daje) |

Rozdzielacz sam daje w kroku ok. 1-2 ms na Jarze (łańcuch 16 owinięć -> płaska lista z filtrem); `still` głównie odciąża rysowanie i
przeliczanie macierzy drzew daleko poza ekranem. Test zamrożonej klatki (`tests/wydajnosc_test.js`): na Jarze 780 sprite'ów
"ustalonych" nie jest odświeżanych, a obraz jest ten sam co z kluczami wyłączonymi (diff 212 B z 3,7 MB przy szumie 478 B).

## Test

`tests/wydajnosc_test.js`: `EXACT` objęło `still` i `dispatch` (zamrożona klatka: ten sam obraz z kluczami wyłączonymi i włączonymi),
plus sprawdzenie, że na Kruczym Jarze ustalone rzeczy daleko faktycznie nie są odświeżane (`idle` > 20, a z kluczami wyłączonymi 0).

## Czego nie zrobiono / dalej

- `patternWidth` / `patternHeight` (HomeLife, HeroLook, Hunting) dalej owinięte po trzy razy; to ok. 2% klatki w profilu (wołane z
  `updateCharacterFrame` dla każdego sprite'a). Można je włączyć do rozdzielacza jako piąty-szósty "rodzaj" metody.
- `still` obejmuje tylko zbieractwo. Inne nieruchome zdarzenia (tabliczki, dekoracje, drzwi) nie, bo ich sprite'y czytają inne wtyczki
  (Latarnia, Kantor, Underground, Storm...) - wymagałoby listy "nie czytaj sprite'a" albo `_wyKeep` w każdej z nich.
