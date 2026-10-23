# Nowe miasto (Map008) - przebudowa 2026-10-22

Wspólny dokument dla wszystkich agentów tej przebudowy. Plan zaakceptowany przez użytkownika („pasuje, działaj”):
`docs/miasteczko/plan_nowe_miasto.png` (rysuje go `tools/miasto2/plan.py`, lista `BLOKI` = współrzędne kratek).

## Decyzje użytkownika

- Miasto w murach na górze mapy (104 x ~95, mur południowy w rzędach 93-99, brama na osi placu w kolumnach 50-53).
  Za murem na południu: pola mieszczan, droga do obecnego wyjścia na Polną drogę (24-26,137), szubienica na wzgórzu.
- Na środku wielki plac handlowy (x 30-73, y 37-63): studnia na samym środku, ławki, krzaki, drzewa, latarnie, stragany,
  tablica ogłoszeń; ludzie tam chodzą.
- Tawerna na tarasie zamkowym nad placem (hala użytkownika), mur zamku z wieżami, szerokie schody prosto na plac.
  Ogród rycerzy na tarasie po lewej, ogródek piwny po prawej. Izba pod skałą wbudowana w mur tarasu.
- Budynki bardziej rozproszone, łatwo do nich dojść (każde drzwi od ulicy, przejścia min. 2 kratki).
- Ręczna praca użytkownika (fasada tawerny, ogród rycerzy, posągi...) przeniesiona, „możesz przy okazji upiększyć”.
- Nowe budynki - WSZYSTKIE z wnętrzami: kaplica (+ przeniesiony cmentarz), dom grabarza, strażnica Lorda,
  stajnia z wozownią, domy mieszkalne 1-9.
- Przechodnie: obecni mieszkańcy częściej przez plac + 8 nowych postaci w stylu bohatera (PixelLab) = mieszkańcy nowych domów.
- Bramy zachodnia (0,50-51 -> Podgrodzie Map111) i wschodnia (103,50-51 -> posiadłość Lorda Map024) zostają na miejscu.

## Nowe budynki: wnętrza, mieszkańcy, wygląd

| klucz | budynek | działka na planie (x0,y0-x1,y1) | wnętrze (mapa) | mieszkaniec | wygląd zewnętrzny (prefabrykat `tools/town/prefabs`) |
|---|---|---|---|---|---|
| kaplica | Kaplica | 4,4-15,16 | Map178 | (opiekuje się grabarz Hieronim) | `twierdza_front` + `!$Gate_Cathedral1`, gotyckie okna, dzwonek |
| dom_grabarza | Dom grabarza | 17,5-23,12 | Map179 | Hieronim, grabarz (TownLife 2930, już jest) | `chata_strzecha` |
| straznica | Strażnica Lorda | 89,37-100,47 | Map180 | kapral Wit Czerwień (już jest) + 2 strażników tła | `kamienica_choragiew` + `mury_baszta`, czerwone chorągwie Lorda (koń), stojaki z bronią |
| stajnia | Stajnia z wozownią | 57,79-74,91 | Map181 | Szczepan Kołodziej, woźnica (nowy) | stodoła (`spichlerz_drewutnia`), wiata z wozami (`woz_siano`), płot, koryto |
| dom1 | Dom 1 | 80,19-88,25 | Map182 | Agata, przekupka z koszem (nowa) | `dom_lukarny_czarny` |
| dom2 | Dom 2 | 92,19-100,30 | Map183 | (nikt z TownLife - mieszczanie w pracy) | `kamienice_szachulec` (jedne drzwi otwarte) |
| dom3 | Dom 3 | 3,37-13,46 | Map184 | Dorota Igła, szwaczka (nowa) | `dom_lukarny_mikstury` (szyld nożyczek zamiast mikstur, jeśli jest) |
| dom4 | Dom 4 | 80,54-89,63 | Map185 | Halina, wdowa + dzieci Kostek i Jagódka (nowi) | `karczma_szachulcowa` bez szyldu z kuflem |
| dom5 | Dom 5 | 92,54-100,63 | Map186 | (nikt - stary dom kupca, zamieszkany przez służącą tła) | `chata_z_bali` |
| dom6 | Dom 6 | 28,79-36,88 | Map187 | Leon Dłuto, cieśla (nowy) | `dom_szczyt_kuznia` bez kuźni (warsztat ciesielski: deski, kozioł) |
| dom7 | Dom 7 | 40,79-47,88 | Map188 | (nikt - para staruszków nie wychodzi z domu) | `dom_lukarny_czarny` (inny kolor drzwi) |
| dom8 | Dom 8 | 80,79-89,89 | Map189 | Wacław Siwy, stary weteran z kulą (nowy) | `kantor_waga` / kamienny dom |
| dom9 | Dom 9 | 91,79-100,90 | Map190 | (nikt - biedna izba do wynajęcia) | `chata_strzecha` z przybudówką |

Wygląd to propozycja: budowniczy mapy może zmienić prefabrykat, ale wpisuje końcowy wybór do `tools/miasto2/budynki.json`
(klucz, nazwa, prostokąt, kratka drzwi, kratka przed drzwiami, prefabrykat, mapa wnętrza) - z tego pliku korzystają wnętrza
i mieszkańcy. Wnętrze ma pasować do budynku z zewnątrz (wielkość, bogactwo, drewno/kamień) i do mieszkańca.

## Nowi mieszkańcy (TownLife, zakres 2940-2949)

| id | klucz | imię | kto | dom | arkusz |
|---|---|---|---|---|---|
| 2940 | kolodziej | Szczepan Kołodziej | woźnica, wozi towar z Polnej drogi | stajnia | `$Npc_Kolodziej` |
| 2941 | przekupka | Agata | przekupka z koszem, sprzedaje na placu | dom1 | `$Npc_Przekupka` |
| 2942 | szwaczka | Dorota Igła | szwaczka | dom3 | `$Npc_Szwaczka` |
| 2943 | wdowa | Halina | wdowa, matka dwójki | dom4 | `$Npc_Wdowa` |
| 2944 | kostek | Kostek | syn Haliny, ~8 lat (mniejsza skala) | dom4 | `$Npc_Kostek` |
| 2945 | jagodka | Jagódka | córka Haliny, ~6 lat (mniejsza skala) | dom4 | `$Npc_Jagodka` |
| 2946 | ciesla | Leon Dłuto | cieśla | dom6 | `$Npc_Ciesla` |
| 2947 | weteran | Wacław Siwy | stary żołnierz o kuli, opowiada o wojnie | dom8 | `$Npc_Weteran` |

Uwaga (agent mieszkańców, 2026-10-22): klucz TownLife woźnicy to `kolodziej` (arkusz `$Npc_Kolodziej`) - klucz `woznica` i arkusz
`$Npc_Woznica` ma już Wojciech, woźnica kupca. W domach mieszkańcy stają na „Miejsce: <klucz>_wnetrze”: `kolodziej_wnetrze` (stajnia,
Map181), `przekupka_wnetrze` (Map182), `szwaczka_wnetrze` (Map184), `wdowa_wnetrze`, `kostek_wnetrze`, `jagodka_wnetrze` (Map185),
`ciesla_wnetrze` (Map187), `weteran_wnetrze` (Map189). Dane: blok „THE NEW TOWN” w `js/plugins/TownLife_Data.js`; dopóki Map008 nie ma
„Miejsce:” drzwi ich domu, są nieobecni. Ławka weterana to `plac_1` (warto postawić ją przy ławce), studnia: `plac_studnia`.

Wszyscy w stylu bohatera (biedni/zwykli mieszczanie, PixelLab pro, style_character_id bohatera - `tools/npc/build_npc.py`,
dzieci `--scale/--head`). Popiersia do rozmów jak pozostali (`tools/busts`).

## Miejsca („Miejsce: <klucz>” na mapie, czyta je TownLife)

Budowniczy mapy stawia niewidoczne zdarzenia `Miejsce: <klucz>` (bez obrazka, bez poleceń, pod postacią) na kratkach:
- `<budynek>_drzwi` - kratka przed drzwiami każdego nowego budynku (kaplica_drzwi, dom1_drzwi ... stajnia_drzwi);
- `plac_1` ... `plac_12` - miejsca na placu (przy ławkach, studni, straganach, pod drzewami), `plac_studnia`,
  `plac_tablica`, `stragan_1` ... `stragan_6` (przed straganami), `skwer`, `brama_pd` (wewnątrz bramy południowej),
  `stajnia_woz` (przy wozach), `straznica_warta` (przy bramie wschodniej), `kaplica_lawka`, `ciesla_warsztat`.
Istniejące „Miejsce: ...” zdarzenia przenoszą się razem z blokami.

## Zasady (obowiązują wszystkich)

- Polski wszędzie (teksty gry, komentarze w dokumentach, raporty).
- NIC nie zapisujemy do `data/*.json`, `js/plugins.js`, `img/system/IconSet.png` - wszystko w staging; instaluje koordynator
  (przy zamkniętym edytorze, łatając plik z dysku w chwili zapisu). Wyjątek: nowe pliki obrazków postaci w `img/characters`,
  `img/pictures` (nowe nazwy, nic nie nadpisujemy).
- Mapa: zdarzenia mapy mają numery 1-499 (>= 500 = zakresy wtyczek). Numery istniejących zdarzeń Map008 ZOSTAJĄ (wtyczki i inne
  mapy się do nich odwołują). Nowe zdarzenia: wolne numery 1-499.
- Kontrola map: `python tools/mapy/kontrola.py` + `docs/MAPY_ZASADY.md` (blaty, gwiazdki, dostęp, obiekty rozcięte);
  `kontrola.bramka()` przed oddaniem mapy.
- Woda jest rzadka celowo (studnia na placu daje mało), każde światło to ogień, popupy nad bohaterem, postacie w stylu bohatera.
- Testy: każdy agent swój port CDP (budowa mapy 9570, wnętrza 9571, mieszkańcy 9572, powiązania 9573), serwer gry
  `node tools/serve.js` na 8765 już działa. Port 8770 to kopia gry użytkownika - nie ruszać. Nie zatrzymywać cudzych procesów.
  Pełny przebieg testów tylko za zgodą użytkownika (pyta koordynator).
- Nie commitujemy (tylko użytkownik zleca commit).
