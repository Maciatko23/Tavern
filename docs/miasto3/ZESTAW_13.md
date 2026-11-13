# Zestaw 13 "Kruczogród (średniowiecze)" v2 - przewodnik do ręcznych poprawek w edytorze

Wersja z przebudowy miasta (miasto4, 2026-11-08). Zestaw 13 = A1/A2/A5 jak zestaw 11 (Styl_B), **A3 i A4 = `Styl_FB/A3`, `Styl_FB/A4`** (dachy i ściany budynków Winlu w stylu paczki, jak na mapie testowej Map027 / zestaw 17) + cztery własne arkusze B, C, D, E: `img/tilesets/Kruczogrod/Miasto2_B..E.png`.
Obraz z ramkami i nazwami: `docs/miasto4/zestaw_13_v2.png` (żółta kreska = granica połówek palety: w edytorze każdy arkusz to dwie połówki po 8 kolumn, jedna nad drugą).

## Zasady

- Kawałki paczki (Fantastic Buildings: Medieval) i budynki Winlu leżą w arkuszach w całości w jednej połówce (maks. 8 kolumn); kaplica to dwie części (`kosciol_l`, `kosciol_p`) w tych samych rzędach obu połówek; szeroka kuźnia (12 kolumn) tak samo (`w_kuznia` + `w_kuznia~p`).
- **Budynki Winlu (`w_*`) to mozaiki**: w arkuszu leżą tylko kafle B-E użyte przez budynek (kolejność czytania budynku od lewej-górnej), bez powtórzeń; dachy i ściany tych budynków to autokafle A3/A4 (Styl_FB), więc budynek składa się z autokafli + kafli z mozaiki. Gotowe budynki najłatwiej kopiować z mapy (Map008 / Map027).
- Flagi przejścia: kawałki paczki - dotychczasowe z zestawu 13 (korpusy blokują, drzwi przechodnie, nadproże bramy ma gwiazdkę); kafle Winlu - skopiowane z zestawu 17 (mapa testowa). Kratka 0 arkusza B jest pusta z gwiazdką.
- Rodzaje podłoża: bruk = autokafel A2 rodzaj 19 (zawsze kształt 0, pełny środek, bez trawiastych brzegów); ogrody, sady, zieleńce = trawa (27) z miękkim brzegiem i kwiatami (28); podwórza warsztatów = ziemia (17); płoty: 22 (rygle), 38 (kłody).
- Drzwi: zdarzenie przeniesienia stoi na kratce drzwi; drzwi budynków Winlu rysuje zdarzenie z obrazkiem `!Fantasy_door*_FB`, ozdoby (okna dachowe, szyldy, latarnie) to zdarzenia `*_FB`.
- Źródło układu: `tools/miasto4/uklad4.json` (buduje `tools/miasto4/zestaw4.py`), mapa składana `tools/miasto4/build4.py`.

## Arkusz B

- `kosciol_l` - kol. 1, wiersz 0, 5x12; drzwi: kolumna 4, wiersz 11 - kaplica: lewa część (5 kolumn), prawa część stoi w drugiej połówce arkusza w tych samych rzędach
- `mur_v` - kol. 6, wiersz 0, 2x5 - mur pionowy: odcinek środkowy 5 rzędów, powtarzać
- `kosciol_p` - kol. 8, wiersz 0, 4x12 - kaplica: prawa część (4 kolumny)
- `w_ratusz` - kol. 12, wiersz 0, 4x13 - budynek Winlu z mapy testowej Map027
- `mur_h` - kol. 6, wiersz 5, 2x4 - mur poziomy, 4 rzędy, powtarzać co 2 kratki (kolumny 12,13)
- `mur_h3` - kol. 6, wiersz 9, 2x3 - mur niski 3 rzędy (ogród rycerzy)
- `stajnia` - kol. 0, wiersz 12, 8x4; drzwi: kolumna 6, wiersz 3 - stajnia pod strzechą z końmi w boksach, drzwi z prawej
- `w_dom15` - kol. 8, wiersz 13, 7x3 - budynek Winlu z mapy testowej Map027

## Arkusz C

- `kamienica` - kol. 0, wiersz 0, 6x9 - skrzydło tawerny (długa kamienica z lukarnami), bez drzwi
- `szubienica` - kol. 6, wiersz 0, 2x4 - szubienica na pagórku
- `w_kantor` - kol. 8, wiersz 0, 8x5 - budynek Winlu z mapy testowej Map027
- `wieza` - kol. 6, wiersz 4, 2x4 - baszta 2x4 ze strzelnicą
- `gildia` - kol. 8, wiersz 5, 5x10; drzwi: kolumna 2, wiersz 9 - front tawerny: dom cechowy z czerwonym godłem, podwójne drzwi
- `dom_wieza` - kol. 13, wiersz 5, 3x8; drzwi: kolumna 1, wiersz 7 - kamienny dom-wieża (strażnica, izba pod skałą)
- `wozownia` - kol. 0, wiersz 9, 8x5 - wozownia z bali z zagrodą dla konia (bez drzwi, tło podwórza)
- `mur_nadproze` - kol. 13, wiersz 13, 2x2 - nadproże bramy (2 rzędy: chodnik + blanki), przechodnie pod spodem (gwiazdka)
- `w_woziwoda` - kol. 0, wiersz 14, 8x2 - budynek Winlu z mapy testowej Map027
- `w_studnia` - kol. 8, wiersz 15, 8x1 - budynek Winlu z mapy testowej Map027

## Arkusz D

- `ratusz` - kol. 0, wiersz 0, 8x8; drzwi: kolumna 1, wiersz 7 - ratusz: hala z arkadami, drzwi (1,7) i kancelaria (6,7)
- `sklep` - kol. 8, wiersz 0, 4x10; drzwi: kolumna 2, wiersz 9 - dom z kramem w oknie (piekarnia, szwaczka)
- `dom_szachulec` - kol. 12, wiersz 0, 4x8; drzwi: kolumna 1, wiersz 7 - szachulec z kamienną parterową izbą
- `w_kamienica` - kol. 0, wiersz 8, 8x5 - budynek Winlu z mapy testowej Map027
- `mur_v_gora` - kol. 12, wiersz 8, 2x2 - mur pionowy: zwieńczenie baszty u góry (2 rzędy)
- `wieza3` - kol. 14, wiersz 8, 2x3 - baszta 2x3 (narożnik ogrodu)
- `dzwonnica` - kol. 8, wiersz 10, 6x6; drzwi: kolumna 3, wiersz 5 - drewniana dzwonnica z dzwonem (lina i dzwonnik w lewej kratce drzwi)
- `mur_v_dol` - kol. 14, wiersz 11, 2x3 - mur pionowy: dół odcinka z wieżą (3 rzędy)
- `w_kuznia` - kol. 0, wiersz 13, 8x3 - budynek Winlu z mapy testowej Map027

## Arkusz E

- `dom_kwiaty` - kol. 0, wiersz 0, 5x6; drzwi: kolumna 2, wiersz 5 - dom z balkonem pełnym kwiatów
- `chata_b` - kol. 8, wiersz 0, 4x6; drzwi: kolumna 2, wiersz 5 - chata pod strzechą z oknami
- `w_piekarnia` - kol. 12, wiersz 0, 4x8 - budynek Winlu z mapy testowej Map027
- `chata_bale` - kol. 0, wiersz 6, 5x6; drzwi: kolumna 2, wiersz 5 - chata z bali z czerwonymi kwiatami
- `chata_c` - kol. 8, wiersz 6, 4x5; drzwi: kolumna 1, wiersz 4 - mała chata z kwiatami w oknie
- `chata_a` - kol. 12, wiersz 8, 4x4; drzwi: kolumna 2, wiersz 3 - mała chata pod strzechą z lukarną
- `kratki` - kol. 8, wiersz 11, 4x3 - grządki warzywne w płotku
- `w_izba` - kol. 0, wiersz 12, 4x3 - budynek Winlu z mapy testowej Map027
- `w_straznica` - kol. 8, wiersz 14, 6x2 - budynek Winlu z mapy testowej Map027
- `w_grabarz` - kol. 0, wiersz 15, 7x1 - budynek Winlu z mapy testowej Map027

## Budynki w mieście (Map008) i ich wnętrza

