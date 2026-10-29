# docs/popiersia/zgodnosc_*.png: every talk bust beside its character on the map - the bust (as in the game, facing left), the
# map sheet's front frame enlarged x4 (nearest) and its head x8 - with a verdict: does the bust match the sprite (hair / bald
# head, beard, colours, clothes, hat)?
# Run: python tools/busts/make_match.py przed|po [out.png] [--pics DIR] [key ...]
#   przed: the verdicts before the 2026-10-07 pass (run with --pics backup_art_2026-10-07/popiersia to show the old busts)
#   po:    after it (the busts from img/pictures; the tavern regulars' own <Name>_Bust files)
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from make_residents import RESIDENTS, PODROZNI

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
PICS = os.path.join(ROOT, 'img', 'pictures')
CHARS = os.path.join(ROOT, 'img', 'characters')

# (key, bust, who, sheet, (col, row) of the front frame in 64 px cells); the tavern regulars: (old RTP bust, own bust)
ENTRIES = [('hero', 'Hero_Bust', 'Bohater', 'Hero_Walk', (0, 0)), ('dziadek', 'Stach_Bust', 'Dziadek Stach', '$Npc_Dziadek', (1, 0)),
           ('borgar', ('People3_5', 'Borgar_Bust'), 'Borgar', '$Npc_Borgar', (1, 0)),
           ('melia', ('People2_8', 'Melia_Bust'), 'Melia', '$Npc_Melia', (1, 0)),
           ('grum', ('Actor2_5', 'Grum_Bust'), 'Grum', '$Npc_Grum', (1, 0)), ('ozzy', ('People2_1', 'Ozzy_Bust'), 'Ozzy', '$Npc_Ozzy', (1, 0)),
           ('wanda', ('People1_6', 'Wanda_Bust'), 'Wanda', '$Npc_Wanda', (1, 0))]
for key, who, base in RESIDENTS:
    K = key[0].upper() + key[1:]
    ENTRIES.append((key, K + '_Bust', who, '$Npc_' + K, (1, 0)))
# the travellers from the ferry (2026-10-29): their own keys and sheet names (Pula_M, not Pula_m); the pool's colour variants too
for key, K, who in PODROZNI:
    ENTRIES.append((key, K + '_Bust', who, '$Npc_' + K, (1, 0)))
for K, who in (('Pula_M2', 'Podróżny w płaszczu, wariant 2'), ('Pula_M3', 'Podróżny w płaszczu, wariant 3'),
               ('Pula_K2', 'Podróżna w chuście, wariant 2'), ('Pula_K3', 'Podróżna w chuście, wariant 3'),
               ('Pula_S2', 'Starzec z laską, wariant 2'), ('Pula_Z2', 'Marynarz, wariant 2'),
               ('Ksenia', 'Ksenia Żuraw (ciało puli K)'), ('Trojka', '„Gość spod trójki” (ciało puli M)')):
    ENTRIES.append((K.lower(), K + '_Bust', who, '$Npc_' + K, (1, 0)))

OK, PART, BAD, FIXED = 'PASUJE', 'CZĘŚCIOWO', 'NIE PASUJE', 'POPRAWIONE'
COL = {OK: (120, 220, 120), PART: (240, 200, 80), BAD: (255, 100, 90), FIXED: (110, 190, 255)}
# the verdicts before the pass (2026-10-07)
PRZED = {
    'hero': (OK, 'czarne włosy, szara lniana koszula z łatami, bieda - jak na mapie.'),
    'dziadek': (OK, 'siwa broda, brązowa czapka, łatana sukmana. Drobne: na mapie czapka z daszkiem, broda krótsza.'),
    'borgar': (BAD, 'RTP: szlachcic w złoto-fioletowym kaftanie, kozia bródka. Mapa: karczmarz - pełna siwa broda, biała koszula, '
                    'fioletowa chusta, musztardowa kamizelka, fartuch.'),
    'melia': (BAD, 'RTP: różowe włosy, gogle, czarny top. Mapa: długie srebrne włosy, niebieska suknia, śliwkowa peleryna.'),
    'grum': (BAD, 'RTP: zielone nastroszone włosy, bez brody, goła pierś. Mapa: krótkie ciemne włosy, pełna ciemna broda, '
                  'brązowa skórznia (opaska na oko i czerwona chusta się zgadzają).'),
    'ozzy': (BAD, 'RTP: biała szata kapłana, okulary. Mapa: brązowy kapelusz, czerwony nos, siwe wąsy i broda, granatowy łatany płaszcz.'),
    'wanda': (PART, 'warkocz i brązowe włosy tak; brak jasnej bluzki z bufkami, gorsetu, fartucha i ścierki na ramieniu.'),
    'soltys': (PART, 'siwe włosy, sumiaste wąsy, złoty łańcuch tak; na mapie brązowa kamizelka na białej koszuli z długimi rękawami, w popiersiu brązowy kaftan.'),
    'piekarka': (PART, 'biały czepek tak; mapa: pulchna, brązowe włosy, niebieska suknia i biały fartuch (w popiersiu peleryna).'),
    'woziwoda': (OK, 'słomkowy kapelusz, brązowe włosy, biała koszula, brązowa kamizelka.'),
    'kowal': (BAD, 'na mapie ŁYSY, z pełną, gęstą ciemnobrązową brodą; w popiersiu czarne włosy i krótka czarna broda.'),
    'kapral': (PART, 'kapalin i wąsy tak; na mapie kolczuga i czerwony wapenrok z czarnym koniem, w popiersiu zbroja płytowa.'),
    'dzwonnik': (PART, 'łysy, biała broda tak; na mapie zwykły ciemnoszary habit ze sznurem i kluczem, w popiersiu ozdobna szata.'),
    'kupiec': (PART, 'zielony kaftan tak; na mapie bordowy kapelusz z rondem i czerwonym piórem, pełna czarna broda, ciemniejsza skóra.'),
    'garbarz': (PART, 'kaszkiet tak; na mapie oliwkowa koszula i skórzany fartuch, w popiersiu zielona peleryna.'),
    'feliks': (OK, 'siwe włosy, czarny surdut, biała chusta.'),
    'kamerdyner': (PART, 'siwe włosy, czerwona kamizelka, biała chusta tak; na mapie STARY sługa w czarnym fraku, bez okularów - w popiersiu młoda twarz w okularach.'),
    'lord': (OK, 'zaczesane włosy, broda, futrzany kołnierz, czerwony kaftan.'),
    'straznik': (PART, 'kapalin tak; na mapie kolczuga i czerwony wapenrok z czarnym koniem, w popiersiu zbroja płytowa.'),
    'bronek': (PART, 'rudobrązowe potargane włosy tak; na mapie kremowa lniana tunika bez fartucha, w popiersiu brązowy fartuch z łatą.'),
    'zosia': (PART, 'jasne kucyki tak; na mapie czerwona sukienka i biały fartuszek, w popiersiu różowa sukienka z kokardką.'),
    'ludmila': (PART, 'na mapie włosy związane, brązowa chusta na ramionach, szarozielona suknia; w popiersiu rozpuszczone, sweter.'),
    'ela': (PART, 'na mapie potargane ciemnobrązowe włosy i podarta zgaszona niebieska sukienka; w popiersiu schludna jasna fryzura i czysta sukienka.'),
    'rafal': (PART, 'na mapie prawie czarne kręcone potargane włosy, podarta niebieska tunika z łatą, bandaże; w popiersiu jasnobrązowe proste włosy, kurtka z kapturem.'),
    'zlodziej': (PART, 'na mapie rdzawy kaptur NA głowie; w popiersiu bez kaptura.'),
    'gracz': (OK, 'czarny kapelusz z piórem, wąsy, czerwony kaftan.'),
    'bartek': (PART, 'na mapie potargane piaskowe włosy, zarost, brązowa kamizelka na białej koszuli; w popiersiu gładki młodzik w swetrze.'),
    'woznica': (PART, 'kapelusz, żółta chusta, płaszcz tak; na mapie pełna siwobrązowa broda - w popiersiu brak.'),
    'praczka': (PART, 'chusta podobna; w popiersiu młoda zakonnica z białym kołnierzem, na mapie starsza kobieta, szara suknia, fartuch.'),
    'franek': (OK, 'rudobrązowe włosy, żółta koszula.'),
    'drwal': (OK, 'ciemne włosy, gęsta ciemna broda.'),
    'klusownik': (PART, 'na mapie zielony kaptur NA głowie, ciemne włosy; w popiersiu kaptur zsunięty, sterczące włosy.'),
    'znachorka': (PART, 'stara, siwe włosy tak; na mapie gruba ciemnobrązowa, prawie czarna chusta i brązowa suknia, w popiersiu jasnoszara chusta.'),
    'szmaciarz': (OK, 'kapelusz z łatami, łatany płaszcz.'),
    'uchodzca': (OK, 'ciemne włosy, oliwkowa kurta.'),
    'zebrak': (OK, 'siwe długie włosy i broda, łachmany.'),
    'marek': (BAD, 'nowy mieszkaniec bez popiersia - w rozmowie tylko dymek nad głową.'),
    'janek': (BAD, 'nowa postać przystani (2026-10-14) bez popiersia.'),
    'przemytnik': (BAD, 'nowa postać przystani (2026-10-14) bez popiersia.'),
    'celnik': (BAD, 'nowa postać przystani (2026-10-14) bez popiersia.'),
}
# after the pass: only what changed (the rest keeps its verdict from PRZED)
PO = {
    # the new town's houses (2026-10-22): made to match their sheets from the start
    'kolodziej': (OK, 'ciemnoczerwona chusta zawiązana z tyłu, czarne włosy, krótka pełna czarna broda z wąsami, ogorzała skóra, brązowa '
                      'kamizelka z owczej skóry (runo na brzegach) na spranej niebieskiej koszuli.'),
    'przekupka': (OK, 'musztardowa chusta na głowie, brązowe włosy i oczy, opalona twarz, ciemnozielony sznurowany gorset, płócienna bluzka '
                      '(kosz i fartuch poniżej kadru).'),
    'szwaczka': (OK, 'ciemnobrązowe włosy upięte w kok, śliwkowa wełniana suknia, biały kołnierzyk, żółta miara krawiecka na szyi.'),
    'wdowa': (OK, 'ciemnoszara wełniana chusta na głowie i ramionach, ciemne włosy, zmęczona zamknięta twarz, brązowy wełniany szal z łatą, '
                  'czarna suknia żałobna (wiadro poniżej kadru).'),
    'kostek': (OK, 'potargane czarne włosy, brązowe oczy, brud na policzku, za duża sprana niebieska tunika z łatami, sznurek przy szyi.'),
    'jagodka': (OK, 'dwa ciemnobrązowe kucyki, brązowe oczy, sprana mszystozielona sukienka z łatą, płócienny kołnierzyk.'),
    'ciesla': (OK, 'szaroniebieska filcowa czapka z wywiniętym brzegiem, krótka brązowa broda z siwizną, płócienna koszula, płócienny '
                   'fartuch z kieszenią (ołówek, trociny). Twarz starsza niż 45 lat (baza RTP), broda to łagodzi.'),
    'weteran': (OK, 'siwe włosy, krzaczaste białe brwi, wielkie opadające białe wąsy i krótka biała broda, blizna na policzku, sprany '
                    'granatowy płaszcz żołnierski z mosiężnymi epoletami i guzikami, szary wełniany szal (kula poniżej kadru).'),
    # the new Podgrodzie's houses (2026-10-22, docs/podgrodzie/NOWE_PODGRODZIE.md): made to match their sheets from the start
    'szynkarz': (OK, 'łysa czaszka z wiankiem siwobrązowych włosów, gęste opadające wąsy, rumiana pełna twarz, czerwony nos, rozpięta '
                     'zgniłozielona kamizelka na złamanobiałej koszuli (fartuch i ścierka poniżej kadru).'),
    'opiekunka': (OK, 'biała lniana chusta zawiązana pod brodą, siwe włosy na czole, rumiana życzliwa twarz, granatowa suknia, biały '
                      'kołnierzyk, góra białego fartucha z plamą.'),
    'garncarz': (OK, 'kręcone rudobrązowe włosy, szara opaska z węzłem, krótka ruda broda, ceglasta tunika, szary skórzany fartuch na '
                     'rzemieniu, grudki gliny (szare przedramiona poniżej kadru).'),
    'dziecko': (OK, 'nierówno obcięte słomkowe włosy, piegi, smuga gliny na policzku, za duża ochrowa sukienka z worka z szarą łatą.'),
    'kowal': (FIXED, 'łysy (ogolona, lśniąca czaszka z sadzą), krótkie ciemne włosy tylko nad uszami, pełna gęsta ciemnobrązowa broda z wąsami.'),
    'dzwonnik': (FIXED, 'zwykły ciemnoszary wełniany habit z wyłożonym kapturem, sznur z kluczem; ozdobna szata zakonu zachowana jako Ambrozy_Bust_Zakon.png.'),
    'borgar': (FIXED, 'nowe Borgar_Bust: pełna siwa broda, kremowa koszula, fioletowa chusta, musztardowa kamizelka (fartuch poniżej kadru).'),
    'melia': (FIXED, 'nowe Melia_Bust (baza People2_2): długie srebrne włosy, niebieska sznurowana suknia, śliwkowa pelerynka.'),
    'grum': (FIXED, 'nowe Grum_Bust: krótkie ciemne włosy, pełna broda, opaska i blizna, czerwona chusta, brązowa skórznia, żelazna rękawica.'),
    'ozzy': (FIXED, 'nowe Ozzy_Bust (baza SF_People1_7): zgnieciony brązowy kapelusz, czerwony nos, siwe wąsy i broda, granatowy łatany płaszcz.'),
    'wanda': (FIXED, 'nowe Wanda_Bust: kremowa bluzka z bufkami, sznurowany gorset, fartuch, ścierka na ramieniu, warkocz.'),
    'piekarka': (FIXED, 'brązowe włosy pod czepkiem, pełniejsza twarz, niebieska suknia, biały fartuch z mąką.'),
    'kapral': (FIXED, 'kolczy kaptur i kolczuga, czerwony wapenrok z czarnym koniem, kapalin, wąsy.'),
    'straznik': (FIXED, 'kolczy kołnierz i kolczuga, czerwony wapenrok z koniem, kapalin, brązowe włosy.'),
    'kupiec': (FIXED, 'bordowy kapelusz z rondem, piórem i rozetą, pełna czarna broda, śniada skóra (szarfa poniżej kadru).'),
    'garbarz': (FIXED, 'kaszkiet, oliwkowa koszula, skórzany fartuch na szelkach, skórzane rękawice.'),
    'ludmila': (FIXED, 'włosy związane w kok, brązowa wełniana chusta na ramionach, szarozielona suknia.'),
    'praczka': (FIXED, 'baza SF_People1_6: starsza, zmęczona, szaroniebieska chusta na głowie, szarobrązowa suknia, poplamiony fartuch.'),
    'zlodziej': (FIXED, 'rdzawy kaptur na głowie, ciemne włosy pod nim, łata.'),
    'klusownik': (FIXED, 'ciemnozielony kaptur na głowie, ciemne włosy, zarost, brązowa skórznia, łuk na plecach.'),
    'bartek': (FIXED, 'krótka piaskowa broda i zarost, ciemniejsze włosy, brązowa kamizelka na białej koszuli.'),
    'woznica': (FIXED, 'pełna siwobrązowa broda z wąsami nad szalem, ogorzała czerwona twarz.'),
    'soltys': (FIXED, 'brązowa zapinana kamizelka na białej koszuli z długimi rękawami, złoty łańcuch, krzaczaste brwi i sumiaste wąsy.'),
    'kamerdyner': (FIXED, 'postarzony (zmarszczki, siwe bokobrody), czarny frak, czerwona kamizelka, biały fular i rękawiczka; okulary -> monokl (gest ręki z bazy).'),
    'znachorka': (FIXED, 'gruba ciemnobrązowa, prawie czarna dziergana chusta, brązowa suknia, siwy kok, zioła.'),
    'rafal': (FIXED, 'prawie czarne kręcone włosy, zarost, cienie pod oczami, prosta niebieska lniana tunika z łatą i dziurami (bandaże poniżej kadru).'),
    'ela': (FIXED, 'potargane ciemnobrązowe włosy, zgaszona niebieska sukienka z łatami i rozdarciem.'),
    'bronek': (FIXED, 'bez fartucha: kremowa lniana tunika z dekoltem w serek i sznurkiem, rudawe włosy.'),
    'zosia': (FIXED, 'zgaszona czerwona sukienka, biały poplamiony fartuszek z szelkami, jasne kucyki.'),
    'marek': (FIXED, 'nowe Marek_Bust (baza SF_Actor3_3): długie potargane ciemne włosy, długa broda, blady i zakurzony, puste spojrzenie, brudna koszula, skórzana kamizelka.'),
    # the harbour (2026-10-14)
    'janek': (FIXED, 'nowe Janek_Bust (baza Actor3_1): granatowa czapka z dzianiny z wywiniętym brzegiem, rudy krótki zarost z wąsami, '
                     'ogorzała twarz, szaroniebieska koszula, skórzany fartuch z łuskami, szelki i wiklinowy kosz za ramieniem. '
                     'Na mapie broda trochę pełniejsza.'),
    'przemytnik': (FIXED, 'nowe Przemytnik_Bust (baza People2_1, bez okularów; kaptur z Actor3_5): brązowy kaptur z woskowanego płótna, '
                          'pełna siwa broda z wąsami, ciemne gęste brwi, ogorzała skóra, złoty kolczyk, brązowa peleryna i płaszcz, '
                          'ciemna kamizelka - jak na mapie i na planszy prologu.'),
    'celnik': (FIXED, 'nowe Celnik_Bust (baza SF_People1_5, bez wąsów): czarna okrągła czapka bez daszka, krótkie siwe włosy, siwe '
                      'bokobrody, gładki podbródek, wąskie usta, czerwony kaftan z czarnym kołnierzem i czarnym koniem, księga pod pachą.'),
    # the travellers from the ferry (2026-10-29, docs/PODROZNI.md): PixelLab sheets + busts made to match them from the start
    'pula_m': (OK, 'baza SF_Actor1_7: ciemnozielony wełniany płaszcz zapięty pod szyją mosiężną zapinką, kaptur zsunięty na kark, kremowa '
                   'lniana tunika, krótkie brązowe włosy, krótka pełna brązowa broda z wąsami, opalona twarz.'),
    'pula_k': (OK, 'baza People4_6: ciemnoczerwona wełniana chusta zawiązana pod brodą, brązowe włosy na czole, brązowy dziany szal ze '
                   'skrzyżowanymi końcami i frędzlami, zgaszona niebieska suknia, góra złamanobiałego fartucha.'),
    'pula_s': (OK, 'baza People1_7: łysy czubek głowy, białe włosy po bokach, krzaczaste białe brwi, krótka biała broda z wąsami, '
                   'pomarszczona twarz, gruby brązowy szal z frędzlami, długi szaroniebieski wełniany płaszcz (laska poniżej kadru).'),
    'pula_z': (OK, 'baza SF_People1_3: granatowa dziana czapka bez daszka, ogorzała twarz, krótki ciemny zarost, granatowa wełniana kurta '
                   'z wyłogami, kremowa lniana koszula rozpięta pod szyją.'),
    'pula_m2': (OK, 'Pula_M przekolorowany (tools/podroznicy/pula_kolory.py): rdzawobrązowy płaszcz - jak arkusz.'),
    'pula_m3': (OK, 'Pula_M przekolorowany: szaroniebieski płaszcz - jak arkusz.'),
    'pula_k2': (OK, 'Pula_K przekolorowana: musztardowa chusta, mszysta suknia - jak arkusz.'),
    'pula_k3': (OK, 'Pula_K przekolorowana: granatowa chusta, śliwkowa suknia - jak arkusz.'),
    'pula_s2': (OK, 'Pula_S przekolorowany: oliwkowy płaszcz - jak arkusz.'),
    'pula_z2': (OK, 'Pula_Z przekolorowany: bordowa czapka i kurta - jak arkusz.'),
    'poborca': (OK, 'czarny kapelusz z szerokim rondem, krótkie ciemne włosy, cienki czarny wąsik, czarny kaftan z białym kołnierzem i pomarańczowym feniksem, księga pod pachą.'),
    'pielgrzym': (OK, 'krótkie czarne włosy, czujne oczy, gładka twarz, niebarwiona kremowa wełniana szata z opuszczonym kapturem, różaniec, kij pielgrzymi za ramieniem.'),
    'posel': (OK, 'baza People3_5: siwe zaczesane włosy, siwa kozia bródka, biała szata z pomarańczowymi lamówkami, srebrny łańcuch urzędowy z medalionem, łupkowy płaszcz z futrzanym kołnierzem (na mapie futro jaśniejsze i płaszcz szerszy).'),
    'gwardzista': (OK, 'kapalin, gruby ciemny wąs, kolczy kaptur i napierśnik, biały wapenrok z pomarańczowym feniksem, halabarda za ramieniem.'),
    'kompania_1': (OK, 'Hubert Szary: kapalin, pełna siwa broda, szara pikowana przeszywanica z kolczym kołnierzem.'),
    'kompania_2': (OK, 'Jasiek Brzytwa: szara opaska na głowie, ciemnoszara chusta zasłaniająca twarz po oczy, szara kamizelka.'),
    'kompania_3': (OK, 'Kazik Kołek: szary kaptur z peleryną, krótka brązowa broda, brązowa skórzana tunika, kołczan i rzemień łuku.'),
    'kompania_4': (OK, 'Ruda Hela: szary kaptur z peleryną, rude włosy i kosmyki przy twarzy, zdecydowana twarz, szara tunika.'),
    'ksenia': (OK, 'Pula_K przekolorowana (pula_kolory.py): kremowy czepiec, bordowy szal, ciemnozielona suknia - jak arkusz.'),
    'trojka': (OK, 'Pula_M przekolorowany: czarny płaszcz i ciemna tunika (sadza na dłoniach tylko na arkuszu - dłonie poniżej kadru).'),
    'tobiasz': (OK, 'baza Actor1_1: szeroki brązowy filcowy kapelusz z ciemną taśmą i szarym piórem, potargane brązowe włosy, '
                    'czerwona chusta, zabłocony granatowy płaszcz jeździecki ze stójką, skórzany pas torby przez pierś.'),
    'medyk': (OK, 'baza People2_1: siwe dłuższe rozczochrane włosy, okrągłe druciane okulary, zmęczona twarz z workami pod oczami, '
                  'krótka siwa broda z wąsami, ciemnozielony płaszcz, biały lniany fartuch z szelką na szyi. Twarz raczej ~55-60 lat.'),
    'kartograf': (OK, 'baza People3_5 (bez bródki): łysy z siwymi kępkami nad uszami, krzaczaste siwe brwi, gładko ogolony, brązowa '
                      'kamizelka na kremowej koszuli, za ramieniem skórzana tuba na mapy.'),
    'grajek': (OK, 'baza People2_7: szeroki uśmiech, ciemny zarost, miękka szarobrązowa filcowa czapka z czerwonymi, niebieskimi i '
                   'żółtymi wstążkami, łatana kamizelka (czerwień, ochra, oliwka) na lnianej koszuli, piszczałki dud za ramieniem.'),
    'zboze': (PART, 'baza SF_Actor3_1: płaski brązowy kaszkiet, gładko ogolona pełniejsza twarz z podwójnym podbródkiem, bordowy płaszcz '
                    'z brązowym futrzanym kołnierzem, wór zboża za ramieniem. Twarz młodsza (~45) i mniej okrągła niż na mapie.'),
    'urszula': (OK, 'baza SF_Actor1_2: biała lniana chusta opadająca na ramiona, ciemne włosy z siwizną, zmęczona smutna twarz, '
                    'brązowy dziany szal, sprana szaroniebieska suknia, list u dołu kadru.'),
    'relikwie': (OK, 'baza Actor3_3: wysoka czerwona filcowa czapka (fez), czarne włosy na skroniach, podkręcone czarne wąsy, fioletowy '
                     'kaftan ze złotą lamówką, kilkanaście tanich amuletów na sznurkach, rzemienie skrzynki. Twarz węższa niż na mapie.'),
    'wizytator': (OK, 'baza People2_1: łysy z tonsurą, białe włosy na skroniach, małe okrągłe okulary w czarnej oprawce, dobrotliwa '
                      'pomarszczona twarz bez zarostu, czarny habit z kapturem na ramionach (inny niż szary habit Ambrożego).'),
    'dezerter': (OK, 'baza People3_3: krótkie potargane czarne włosy, zarost, cienie pod oczami, podarta brudna biała tunika z '
                     'pomarańczowym feniksem i śladem po zerwanych dystynkcjach, brązowy płaszcz na ramionach (bandaż poniżej kadru).'),
    'lowczyni': (OK, 'baza Actor2_6 (zbroja całkiem zamalowana): krótkie siwe włosy zaczesane do tyłu, blizna przez policzek, surowa '
                     'twarz, długi ciemnobrązowy skórzany płaszcz z wysokim kołnierzem, kusza na plecach nad ramieniem, pas przez pierś.'),
}

BH = 280                 # the bust's height here
COLS = 3
CW, CH = 720, BH + 104
BG = (30, 31, 38)


def font(sz):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def frame_of(sheet, cell):
    s = Image.open(os.path.join(CHARS, sheet + '.png')).convert('RGBA')
    x, y = cell
    return s.crop((x * 64, y * 64, x * 64 + 64, y * 64 + 64))


def head_box(fr):
    a = np.asarray(fr)[..., 3] > 20
    ys, xs = np.nonzero(a)
    top = ys.min()
    rows = a[top:top + 22]
    cx = int(round(np.nonzero(rows)[1].mean()))
    return (cx - 14, top - 2, cx + 14, top + 22)


def wrap(d, text, f, w):
    lines, cur = [], ''
    for word in text.split():
        t = (cur + ' ' + word).strip()
        if d.textlength(t, font=f) > w and cur:
            lines.append(cur)
            cur = word
        else:
            cur = t
    if cur:
        lines.append(cur)
    return lines


def build(out, entries, pics, verdicts, title):
    F1, F2, F3 = font(18), font(13), font(14)
    rows = (len(entries) + COLS - 1) // COLS
    sheet = Image.new('RGBA', (COLS * CW + 20, rows * CH + 50), BG + (255,))
    d = ImageDraw.Draw(sheet)
    d.text((12, 12), title, fill=(255, 220, 90, 255), font=F1)
    for i, (key, bust, who, sh, cell) in enumerate(entries):
        x0, y0 = 10 + (i % COLS) * CW, 44 + (i // COLS) * CH
        d.rectangle((x0, y0, x0 + CW - 8, y0 + CH - 8), outline=(60, 62, 74, 255))
        verdict, note = verdicts.get(key, ('?', ''))
        d.text((x0 + 8, y0 + 4), who, fill=(240, 240, 240, 255), font=F1)
        vx = x0 + 16 + d.textlength(who, font=F1)
        d.text((vx, y0 + 6), verdict, fill=COL.get(verdict, (200, 200, 200)) + (255,), font=F3)
        d.text((x0 + CW - 16 - d.textlength(bust + ' / ' + sh, font=F2), y0 + 8), bust + ' / ' + sh, fill=(150, 150, 160, 255), font=F2)
        for j, ln in enumerate(wrap(d, note, F2, CW - 30)[:4]):
            d.text((x0 + 8, y0 + 30 + j * 17), ln, fill=(200, 200, 210, 255), font=F2)
        p = os.path.join(pics, bust + '.png')
        if not os.path.exists(p) and not bust.endswith('_Bust'):
            p = os.path.join(PICS, bust + '.png')     # (the RTP busts: not in a backup folder)
        if os.path.exists(p):
            im = Image.open(p).convert('RGBA')
            im = im.resize((round(im.width * BH / im.height), BH), Image.LANCZOS)
            sheet.alpha_composite(im, (x0 + 4, y0 + CH - 8 - BH))
        else:
            d.text((x0 + 30, y0 + CH - BH / 2), 'BRAK ' + bust, fill=(255, 90, 90, 255), font=F1)
        fr = frame_of(sh, cell)
        bb = fr.getbbox()
        body = fr.crop(bb)
        body = body.resize((body.width * 4, body.height * 4), Image.NEAREST)
        sheet.alpha_composite(body, (x0 + 280 + (200 - body.width) // 2, y0 + CH - 12 - body.height))
        hb = head_box(fr)
        head = fr.crop(hb).resize(((hb[2] - hb[0]) * 8, (hb[3] - hb[1]) * 8), Image.NEAREST)
        hx, hy = x0 + CW - 8 - head.width - 6, y0 + CH - 12 - head.height - 40
        d.rectangle((hx - 1, hy - 1, hx + head.width, hy + head.height), fill=(52, 54, 64, 255))
        sheet.alpha_composite(head, (hx, hy))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.convert('RGB').save(out)
    print('ok', out)


if __name__ == '__main__':
    args = sys.argv[1:]
    mode = args.pop(0) if args and args[0] in ('przed', 'po') else 'po'
    pics = PICS
    if '--pics' in args:
        i = args.index('--pics')
        pics = os.path.join(ROOT, args[i + 1]) if not os.path.isabs(args[i + 1]) else args[i + 1]
        del args[i:i + 2]
    out = args.pop(0) if args and args[0].endswith('.png') else os.path.join(ROOT, 'docs', 'popiersia', 'zgodnosc_%s.png' % mode)
    only = set(args)
    ents = []
    for key, bust, who, sh, cell in ENTRIES:
        if isinstance(bust, tuple):
            bust = bust[0] if mode == 'przed' else bust[1]
        if not only or key in only:
            ents.append((key, bust, who, sh, cell))
    verdicts = dict(PRZED)
    if mode == 'po':
        verdicts.update(PO)
    title = ('PRZED (2026-10-07): ' if mode == 'przed' else 'PO poprawkach (2026-10-07): ') + \
        'popiersie (jak w grze, zwrócone w lewo) | postać z mapy x4 | głowa x8 (nearest)'
    build(out, ents, pics, verdicts, title)
