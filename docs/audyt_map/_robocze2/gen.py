import sys, json, os
sys.path.insert(0, "docs/audyt_map/_robocze2"); sys.path.insert(0, "tools/mapy")
from rend import *
from PIL import ImageDraw
from collections import Counter
F = {}
F[162] = [
(3,3,(56,36,59,53),"Brukowana droga środkiem placu urywa się prostą linią w połowie dziedzińca (y=53), nie dochodzi do południowego płotu; u góry też nie wychodzi za bramę.","Domknąć drogę: przedłużyć do południowego płotu (z bramą) albo zakończyć okrągłym placykiem/obrzeżem; dołożyć drogę przez wyłom w płocie."),
(3,2,(56,32,60,35),"Wyłom w północnym płocie (x=57-59) bez bramy i słupów: palisada kończy się ciętymi końcami.","Dostawić słupy bramne/łuk bramy lub zamknąć wyłom i zrobić bramę z kafli płotu."),
(5,2,(60,34,67,42),"Kamienny budynek (61-66,35-41): przy lewej ścianie wisi zielony pasek (bluszcz) oderwany od muru, prawy bluszcz i dach urywają się ostro; obrazek wygląda na ucięty.","Zamienić obraz na pełny albo obciąć bluszcz do ściany; usunąć oderwany pasek na (60,35-37)."),
(3,2,(61,41,66,50),"Wóz i stos kłód (62-64,41-45) ucięte prostą krawędzią po prawej oraz beczki (63-64,46-49) z urwaną górą/dołem (kontrola O1).","Zastąpić pełnymi obrazkami (cały wóz, cały stos) albo dopasować komplet kafli góra+dół."),
(5,2,(63,44,71,55),"Dom z czerwonym dachem (65-70,45-54): za szczytem dachu wystaje płot z żerdzi (63-69,45) przecięty dachem, dach jest asymetryczny względem ściany.","Usunąć żerdzie za domem albo przesunąć dom; wyrównać oś dachu do osi ściany."),
(6,2,(65,45,70,54),"Dom z czerwonym dachem rysowany z lekką perspektywą (szczyt z przodu, kratownica), gdy reszta zabudowy (koszary, kamienny budynek) jest płaska z góry.","Przerysować prosto z góry w stylu koszar albo zastąpić domem z kafli."),
(1,2,(46,50,56,56),"Obóz namiotowy: trzy małe namioty i jeden duży w nierównym ciągu, między nimi samotne kamienie, żerdź ze słomą i skrzynia; przypadkowe rozrzucenie.","Ułożyć namioty w równy rząd wokół ogniska, drobiazgi zgrupować przy ognisku."),
(2,1,(48,43,55,49),"Manekiny (49,44),(51,44),(53,44) mają odstęp 2, a tarcze (50,48),(53,48) odstęp 3: dwa rzędy nie są w jednej osi.","Ustawić tarcze w osiach manekinów albo oba rzędy na tym samym rozstawie."),
(4,1,(61,41,61,41),"Mała choinka (61,41) przy kamiennym budynku to kafel z gwiazdką: bohater wchodzi pod nią i jest zasłonięty (kontrola G1 kafel 598).","Zdjąć gwiazdkę z niskiej sadzonki albo zablokować przejście."),
(4,1,(52,51,54,53),"Kafel z gwiazdką nad wolną kratką (53,52) przy żerdzi ze słomą: bohater wchodzi pod niski przedmiot (kontrola G1 kafel 487).","Zdjąć gwiazdkę lub zablokować kratkę."),
(5,2,(21,23,32,31),"Zatoczka (22-31,24-30) wcięta w morze z brązowym brzegiem w schodki i wodą w innym odcieniu: kanciasta, niedopasowana do linii wybrzeża.","Usunąć albo przerobić na zwykłą zatokę z miękkim brzegiem."),
(1,2,(84,56,119,100),"Wschodnia połowa: mozaika brązowych i zielonych płatów o prostokątnych brzegach, losowe szare place bruku i ciemne kałuże; brak logiki (ścieżki, pola).","Uporządkować: kilka dużych miękkich płatów lub wyraźna ścieżka; usunąć rozproszone szare i ciemne plamy."),
(1,1,(103,44,113,56),"Dwa osamotnione szare place bruku (110-112,46-48) i (104-108,53-55) pośrodku łąki, bez budynku ani drogi.","Usunąć albo przerobić na ścieżkę prowadzącą do czegoś."),
(1,2,(13,64,31,96),"Duża pusta, nudna łąka na zachodzie (15-30,66-95): trawa, pojedyncze kamienie i krzaki.","Dodać grupy drzew/zarośli, ścieżkę, polanę."),
(1,2,(56,100,100,119),"Południowa łąka (60-100,100-119): jednolita zieleń z rzadko rozsianymi sosnami, bez zagrupowania.","Zgrupować drzewa w kępy, dodać polanę/strumień/ścieżkę."),
(3,2,(103,98,111,119),"Dróżka południowa (105-110,100-119) zaczyna się tępym zaokrąglonym końcem na środku łąki i zwęża się nagle w (106-108,117).","Poprowadzić dróżkę do celu i zakończyć miękko; wyrównać szerokość."),
(5,1,(80,68,101,74),"Cienkie zielone obwódki wokół brązowych wysepek (80-100,69-73) i (115-118,83-86): kontury autokafla bez wypełnienia, jak pętle.","Wypełnić ziemią lub zlać z sąsiednim płatem; usunąć pętle."),
]
F[13] = [
(3,3,(5,25,13,35),"Północny klif kamieniołomu (8-60,27-32) kończy się na lewym końcu (x=8) prostą pionową ścianą bez narożnika.","Dodać zewnętrzne narożniki klifu lub zbocze/rampę na końcu."),
(3,3,(54,25,62,34),"Prawy koniec północnego klifu (x=59-60, y 28-32) urywa się prostą linią w trawie.","Zakończyć narożnikiem lub zejściem."),
(5,3,(8,88,46,107),"Płaskowyż klifowy: tylko południowa ściana, boki to cienka obwódka, ściany mają poszarpane ucięte końce i nie łączą się w jedną krawędź (15-44,90-105).","Zrobić zamknięty pierścień klifu z narożnikami albo zmiękczyć do kamiennej krawędzi."),
(5,3,(44,101,63,113),"Płaskowyż (45-60,103-112): ściana południowa z zębatą górną krawędzią, boki jako cienka linia, brak narożników.","Domknąć narożnikami klifu lub usunąć."),
(5,3,(75,97,88,109),"Ruiny klifu (77-85,99-107): kawałki ścian bez styku, boki ucięte.","Połączyć odcinki w jedną ścianę z narożnikami."),
(5,3,(91,91,110,106),"Płaskowyż (95-107,93-105): półokrągła ściana ucięta u góry, boki jako cienka linia.","Domknąć łuk klifu albo usunąć."),
(5,3,(94,60,110,73),"Klif (97-107,62-71) tworzy owal z kafli ścian, lewy bok wcięty a prawy cienki; brak ciągłej ściany po bokach.","Dopasować narożniki i boki klifu."),
(5,3,(20,73,34,94),"Ruina (22-31,76-92): cienka obwódka z ucięciami i poszarpany dolny mur; kontur kończy się nagle.","Dokończyć mur lub usunąć obrys."),
(5,2,(13,29,19,57),"Cienka pionowa linia kafli (x=16, y 32-54) przez cały las: wygląda jak ułamany mur bez początku i końca.","Usunąć albo zamienić na prawdziwy niski mur z zakończeniami."),
(5,2,(1,23,7,29),"Samotna drewniana brama (3-4,25-26) bez murów i płotu; droga przechodzi obok.","Dostawić płot/mur po bokach lub usunąć bramę."),
(3,2,(29,38,46,52),"Pionowy klif (31-33,41-49) kończy się u dołu zaokrąglonym zakończeniem bez ściany bocznej; poprzeczna ściana (33-40,40-42) kończy się prosto.","Dodać narożniki i połączenie ścian."),
(5,2,(43,38,61,49),"Dwie ściany klifu (53-59,40-43) i (45-52,44-47) tworzą schodek bez narożnika; schody (55-56,41-42) wchodzą w ścianę z krótkim kikutem.","Połączyć ściany narożnikiem i dopasować schody."),
(5,1,(53,42,60,56),"Cienka zielona obwódka ścieżki (55-58,44-54) bez wypełnienia: pętla w kształcie U.","Wypełnić autokaflem ścieżki lub usunąć."),
(1,2,(0,31,15,63),"Gęsty, przypadkowo rozrzucony las sosnowy na zachód od drogi (0-14,32-62): drzewa w kupie bez ładu.","Rozrzedzić, zgrupować w kępy z polankami."),
(1,2,(60,62,113,118),"Łąki z rozrzuconymi szarymi plamami bruku, ciemnymi kałużami i pojedynczymi głazami (60-113,62-118): losowa plamistość, nuda.","Zredukować rozproszone plamy do kilku celowych miejsc."),
(3,2,(111,71,119,84),"Linia morza przy prawej krawędzi ma pionowy uskok (114,73-81) i kwadratowy narożnik wody w (113,118).","Wygładzić linię wybrzeża jak w reszcie świata."),
(1,1,(13,55,62,61),"Szare paski bruku (14-60,58-59) rozsiane poziomo jak odłamki, bez drogi.","Usunąć lub złożyć w drogę."),
]
F[125] = [
(3,3,(29,0,35,6),"Wędzarnia Janka (30-34,2-5): ściana z desek ma płaski górny brzeg bez dachu, komin wisi w powietrzu.","Dodać dach z okapem (jak chata Janka) lub przesunąć budynek w dół."),
(3,2,(33,0,38,4),"Ciemna skała (34-36,0-3) przy górnej krawędzi mapy ucięta krawędzią.","Przedłużyć skałę z ciągłością lub usunąć."),
(6,2,(29,0,34,3),"Jaskrawa wielobarwna plama kwiatów (30-33,0-1) i druga (95-98,0-3): inna grafika niż kafle.","Zastąpić kwiatami w stylu kafli lub usunąć."),
(5,3,(82,95,96,111),"Wzgórze latarni (84-94,97-109): tylko południowa ściana i schody, boki to cienka obwódka; latarnia stoi na krawędzi obwódki.","Zrobić pełny klif z narożnikami i schodami."),
(5,2,(83,97,89,100),"Pływająca deska (84-87,98) obok stosu drewna, wisi na trawie bez powiązania.","Usunąć albo zrobić z niej pomost."),
(5,2,(94,42,103,52),"Prostokątna cienka obwódka (95-102,43-50) ze ścianą południową; w środku sosna stoi na obwódce.","Zrobić pełny klif lub usunąć."),
(5,2,(102,27,111,36),"Prostokątny płaskowyż (104-109,29-34) ze ścianą dolną i cienkimi bokami.","Domknąć klifem lub usunąć."),
(3,1,(12,7,17,26),"Brukowane nabrzeże (13-15,8-24) zaczyna się i kończy prostą linią przy znaku i przy wraku.","Zakończyć łukiem lub schodami."),
(2,2,(44,18,79,31),"Płoty działek (45-77,20-29): krótkie kikuty żerdzi nad domami, słupki w różnych odstępach, brak ciągłości; ogrodzenia nie zamykają działek.","Przeprowadzić jednolity płot wokół każdej działki z równym rozstawem."),
(1,1,(73,19,79,29),"Pojedyncze wózki (75-76,21), (77,26) i lampa przy ostatniej działce rozproszone bez kontekstu.","Zgrupować przy stercie drewna."),
(1,2,(26,38,62,76),"Szeroka pusta łąka (28-60,40-75): prawie nic poza pojedynczymi krzakami i plamami.","Dodać ścieżkę, grupy drzew lub pola."),
(1,1,(86,86,95,93),"Samotna szara plama bruku (88-93,88-91) na trawie nad latarnią.","Usunąć lub zrobić ścieżkę do latarni."),
(3,1,(0,0,11,5),"Północno-zachodni róg: plama bruku (3-7,1-2) ucięta kwadratem przy wodzie.","Zmiękczyć brzeg lub doprowadzić do pomostu."),
(6,2,(8,2,22,27),"Łodzie: żaglówka (10-17,23-26) i łódki wiosłowe (7-14,3-9) widziane z boku, reszta (barka 10-20,20-21) z góry.","Narysować łodzie w widoku z góry jak barkę."),
(4,1,(19,2,22,6),"Kafel z gwiazdką (20,4) nad wolną kratką przy beczkach: bohater wchodzi pod niski przedmiot (kontrola G1 kafel 381).","Zdjąć gwiazdkę lub zablokować kratkę."),
(4,1,(34,15,37,18),"Chorągiew Lorda stoi na meblu (35,17), lampa komory celnej (34,17) na kaflu niebędącym blatem (kontrola Z3/P1).","Postawić chorągiew na ziemi lub na blacie."),
]
names = {162: "Map162", 13: "Map013", 125: "Map125"}
for n, fl in F.items():
    mp = load(n); od = "docs/audyt_map/" + names[n]; os.makedirs(od, exist_ok=True)
    res = []
    for i, (kat, w, b, co, jak) in enumerate(fl, 1):
        x0, y0, x1, y1 = b; p = 3
        X0, Y0, X1, Y1 = max(0, x0-p), max(0, y0-p), min(120, x1+1+p), min(120, y1+1+p)
        m = max(X1-X0, Y1-Y0)
        sc = 1.0 if m <= 22 else (0.75 if m <= 36 else 0.5)
        if m <= 22: sc = min(1.0, 1100/(48*m))
        out = "%s/%02d.png" % (od, i)
        crop(mp, X0, Y0, X1, Y1, sc, out, box=b, grid=False)
        res.append({"kat": kat, "x0": x0, "y0": y0, "x1": x1, "y1": y1, "co": co, "jak": jak, "waga": w, "obraz": out})
    json.dump(res, open("docs/audyt_map/%s.json" % names[n], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    im = mapylib.render(mp, scale=0.2).convert("RGB"); d = ImageDraw.Draw(im); s = 9.6
    for i, r in enumerate(res, 1):
        d.rectangle([r["x0"]*s, r["y0"]*s, (r["x1"]+1)*s, (r["y1"]+1)*s], outline=(255, 0, 0), width=2)
        d.text((r["x0"]*s+2, r["y0"]*s+1), str(i), fill=(255, 255, 0))
    im.save("docs/audyt_map/%s_przeglad.png" % names[n])
    print(n, len(res), sorted(Counter(r["kat"] for r in res).items()))
