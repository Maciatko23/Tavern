//=============================================================================
// TownLife_Data.js
//=============================================================================
// The town's residents (Map008 "Okolice Tawerny"; since 2026-10-05 also Podgrodzie, Map111 - "map" in their data): who they are, their sheets, their day hour by hour, what they call out and what
// they say when spoken to (user 2026-10-04: "the town has a daily schedule; residents in the hero's style"). TownLife.js reads it.
//
// SPOTS: key -> [x, y, direction] on Map008. An event named "Miejsce: <key>" on the map moves the spot to it (the editor wins).
// Two residents never "stand"/"work" on the same spot at the same hour (a stroll - "wander" - picks free cells round its spot).
// plan: [hour, act, spot] from that hour on (the last one runs on past midnight to the first); acts:
//   inside  - walks to the spot and goes in (hidden: a door, the tavern's gate)
//   stand   - stands on the spot facing its direction
//   work    - the same, busy (a little movement now and then)
//   wander  - strolls round the spot (3 tiles)
//   patrol  - walks from spot to spot of a list, round and round
//   bell    - stands at the bell; on the full hour inside this act the bell rings (Ambroży)
// barks: what they call out when the hero passes - by act, plus "rain" (rain or a storm) and "night"; indoors "tavern" (in the
// tavern, Map001 "Miejsce: gosc_N") and "home" (in their own interior, "Miejsce: <key>_wnetrze")
// talk: what they say when spoken to - "morning" (5-11), "day" (11-17), "evening" (17-22), "night", "rain"
// (v1.2.0) when: a condition ("market") - the resident is there only while it holds (hidden all the other days); a plan entry's 4th
// field: a condition for that entry (TownLife.addCondition registers more - TownQuests adds "w1Water": Kuba's night trips for water)

/*:
 * @target MZ
 * @plugindesc Dane mieszkańców miasteczka i Podgrodzia: plany dnia, okrzyki, rozmowy (dla TownLife.js). v1.2.0
 * @author Claude
 * @help Same dane - działa z TownLife.js (ma stać nad nim na liście).
 */

(() => {
    "use strict";

    const SPOTS = {
        tawerna: [24, 17, 8], przed_tawerna: [31, 19, 2], brama_twierdzy: [24, 21, 2], ogrod_zakonu: [6, 17, 8], staw: [39, 10, 6],
        stragan1: [21, 31, 2], stragan2: [27, 30, 2], studnia_rynek: [23, 34, 2], rynek_srodek: [26, 36, 2], rynek_lawka: [19, 35, 2],
        piekarnia_drzwi: [6, 39, 8], kantor_drzwi: [14, 39, 8], kantor_przed: [12, 40, 2], kantor_rog: [16, 40, 4],
        ratusz_drzwi: [41, 40, 8], ratusz_przed: [39, 40, 2], dzwonnica: [47, 30, 8],
        schody_rzem: [24, 44, 2], ulica_rzem: [12, 50, 2], kowadlo: [7, 49, 8], kuznia_dom: [12, 47, 8], garbarnia: [16, 45, 8],
        garbarz_dom: [37, 50, 8], woziwoda_dom: [29, 47, 8], brama_wsch: [48, 51, 4], brama_pld: [25, 53, 2],
        dom_mieszczan: [9, 31, 8], pod_murem: [31, 51, 2], stodola: [21, 51, 2], rynek_rog: [30, 38, 2],
        ratusz_obok: [40, 40, 4], stragan1_obok: [19, 31, 6],
        // (2026-10-05, the quests' new people) Lucjan's dice by the right stall; the carter's cart on the street before the south gate
        stragan_kosci: [30, 31, 4], woz_pld: [27, 51, 2]
    };
    const PATROL = ["brama_wsch", "ulica_rzem", "schody_rzem", "rynek_srodek", "brama_twierdzy", "przed_tawerna", "brama_twierdzy", "rynek_srodek", "schody_rzem", "brama_pld"];
    // the manor guard's night round in the west garden (Map024, its "Miejsce: straz_1..4" events - docs/miasta_miejsca_zadan.md)
    const STRAZ = ["straz_1", "straz_2", "straz_3", "straz_4"];

    const RESIDENTS = [
        {
            key: "kowal", name: "Tadek Młot", title: "kowal", sheet: "$Npc_Kowal",
            plan: [[0, "inside", "kuznia_dom"], [5.5, "work", "kowadlo"], [12, "wander", "stragan1"], [13, "work", "kowadlo"], [17, "wander", "ulica_rzem"],
                   [19, "inside", "tawerna"], [22.5, "inside", "kuznia_dom"]],
            barks: {
                work: ["Żelazo trzeba kuć, póki gorące!", "Kto chce naprawić narzędzie, niech podejdzie!", "Uff... ten miech znowu cieknie.", "Siekiera? Motyka? Wszystko naprostuję."],
                wander: ["Chleb Hanki to jedyne, co tu jeszcze nie zdrożało.", "Woda po trzy grosze... czasy."],
                rain: ["Deszcz! Wreszcie kuźnia odetchnie!", "Ha! Niech leje!"],
                night: ["Dobranoc, chłopcze."],
                tavern: ["Kto się siłuje na rękę? Stawiam piwo!", "Borgar, jeszcze jedno!", "Grum? Jutro go pokonam. Albo pojutrze."],
                home: ["Ręce bolą od młota...", "Węgla starczy jeszcze na tydzień."]
            },
            talk: {
                morning: ["Rano kuję najlepiej - ręka świeża, ogień czysty. Przynieś mi rudę, a zrobię ci porządne okucia.", "Narzędzie ci się sypie? Pokaż. U mnie nic się nie marnuje."],
                day: ["Od suszy połowa wioski przyszła z pękniętymi motykami. Ziemia twarda jak kamień.", "Kapral Wit zamówił u mnie nowe groty do włóczni. Dużo grotów. Lord się na coś szykuje."],
                evening: ["Wieczorem idę do Borgara. Kto mnie pokona na rękę, temu stawiam piwo. Na razie nikomu nie stawiałem.", "Kuźnia zamknięta, ale zajrzyj jutro."],
                night: ["Czego tu szukasz po nocy? Idź spać."],
                rain: ["Słyszysz? Deszcz! Jutro wszyscy będą chcieli konewek i wiader."]
            }
        },
        {
            key: "piekarka", name: "Hanka Mączna", title: "piekarka", sheet: "$Npc_Piekarka",
            plan: [[0, "inside", "piekarnia_drzwi"], [6, "stand", "stragan1"], [12, "wander", "rynek_lawka"], [14, "inside", "piekarnia_drzwi"]],
            barks: {
                stand: ["Świeży chleb! Prosto z pieca!", "Bułki, podpłomyki, chleb żytni!", "Dla bosego chłopaka - kromka za darmo!"],
                wander: ["Mąki coraz mniej... młyn stoi, odkąd strumień opadł.", "Ciekawe, czemu u Lorda wszystko takie zielone."],
                rain: ["Deszcz! Niech pada, niech pada!", "Chowaj się pod daszek, zmokniesz!"],
                home: ["Ciasto musi wyrosnąć, nie przeszkadzaj.", "Jutro upiekę więcej, jeśli mąki starczy."],
                night: []
            },
            talk: {
                morning: ["Wstaję o czwartej, żeby chleb był na szóstą. Weź bochenek, póki ciepły.", "Gdybyś miał trochę zboża z pola dziadka - kupię. Mąka z młyna przestała przychodzić."],
                day: ["Młyn stoi, bo strumień opadł i koło nie ma siły. Studnia ledwo daje, Kuba mówi, że wody brak... a jednak co rano ma pełne beczki.", "Bierz chleb na drogę. Tobie i dziadkowi potrzeba sił."],
                evening: ["Zamknięte, kochaneczku. Jutro od szóstej."],
                night: ["Zamknięte, kochaneczku. Jutro od szóstej."],
                rain: ["Deszcz to dla piekarza dobra nowina - ludzie siedzą w domach i jedzą!"]
            }
        },
        {
            key: "woziwoda", name: "Kuba Woziwoda", title: "woziwoda", sheet: "$Npc_Woziwoda",
            plan: [[0, "inside", "woziwoda_dom"], [1.8, "work", "staw", "w1Water"], [3.2, "inside", "woziwoda_dom"], [7, "stand", "studnia_rynek"], [14, "wander", "rynek_srodek"],
                   [16, "inside", "tawerna"], [20.5, "inside", "woziwoda_dom"]],
            barks: {
                stand: ["Woda tylko na przydział sołtysa!", "Piekarnia, kuźnia, tawerna - kolejka po wodę!", "Studnia ledwo kapie, ale Kuba ma wodę!"],
                wander: ["Ech, nogi bolą od tych beczek.", "Nie pytaj, skąd biorę wodę. Interes to interes."],
                work: ["...cicho... nikt nie widzi...", "Szybciej, zanim kapral przejdzie..."],
                rain: ["Deszcz? Sołtys mniej mi zapłaci za wożenie...", "Psia kość, wszyscy łapią deszczówkę."],
                tavern: ["Piwo tańsze niż woda, ha!", "Nie powiem, skąd wożę. Nie i już.", "Ciii... sołtys patrzy."],
                home: ["Beczki trzeba wyszorować przed nocą.", "Nie zaglądaj do wozu!"],
                night: []
            },
            talk: {
                morning: ["Nie sprzedaję na kubki, chłopcze. Woda idzie na przydział sołtysa: piekarnia, kuźnia, tawerna. Chcesz pić - łap deszcz.", "Studnia na rynku daje ledwie parę wiader na dzień. Bez Kuby to miasto by uschło."],
                day: ["Skąd mam wodę? Ze... z daleka. Z gór. Wożę wozem przed świtem. Nie twoja sprawa, co?", "Lord daje mi przepustkę przez bramę. Dobry człowiek z tego Lorda.", "Dla ciebie? Nie ma. Wszystko rozpisane co do dzbana."],
                evening: ["Po robocie idę do Borgara. Tam przynajmniej piwo nie kosztuje tyle co woda."],
                night: ["Ty... co tu robisz o tej porze? Ja tylko... spaceruję. Idź spać i nikomu nic nie mów."],
                rain: ["Jak pada, to wszyscy łapią deszczówkę do wiader i sołtys mniej mi płaci za wożenie."]
            }
        },
        {
            key: "kapral", name: "Kapral Wit Czerwień", title: "straż Lorda", sheet: "$Npc_Kapral", speed: 4,
            plan: [[0, "inside", "brama_wsch"], [6, "stand", "brama_wsch"], [18, "patrol", PATROL], [23, "inside", "brama_wsch"]],
            barks: {
                stand: ["Brama Lorda. Myto - dwa grosze.", "Stać. Kto idzie?", "Bez przepustki dalej nie wejdziesz."],
                patrol: ["Spokój w mieście. Na rozkaz Lorda.", "Rozejść się, nie ma tu nic do oglądania.", "Kto chodzi nocą, ten ma coś do ukrycia."],
                rain: ["Przeklęty deszcz, zbroja rdzewieje.", "Stój pod daszkiem, chłopcze."],
                home: ["Zmiana warty o świcie.", "Czego tu szukasz? To wieża straży."],
                night: ["Do domu, chłopcze. Nocą po mieście chodzi straż - i złodzieje."]
            },
            talk: {
                morning: ["Kapral Wit Czerwień, straż Lorda Zaleskiego. Pilnuję bramy do dworu. Masz tam sprawę? Lord przyjmuje od ósmej.", "Za bramą jest dwór. Za dworem - nic, co by cię obchodziło."],
                day: ["Lord kazał zwiększyć straż. Mówią, że z kontynentu przypływa coraz więcej obcych.", "Kupiec z kantoru? Ma przepustkę od samego Lorda. Nie zadaje się z nim nikt rozsądny."],
                evening: ["Wieczorem obchodzę mury. Jak coś zobaczysz - przyjdź do mnie, nie do sołtysa."],
                night: ["Nocą patroluję mury. Woziwoda? Nie, nie widziałem go. A ty go widziałeś?"],
                rain: ["W deszcz nawet złodzieje siedzą w domach. Tylko straż musi moknąć."]
            }
        },
        {
            key: "dzwonnik", name: "Ambroży", title: "dzwonnik", sheet: "$Npc_Dzwonnik", speed: 2,
            plan: [[0, "inside", "dzwonnica"], [2.8, "bell", "dzwonnica"], [3.2, "inside", "dzwonnica"], [5.7, "bell", "dzwonnica"], [6.3, "wander", "rynek_lawka"],
                   [11.7, "bell", "dzwonnica"], [12.3, "stand", "ogrod_zakonu"], [17.7, "bell", "dzwonnica"], [18.3, "inside", "dzwonnica"]],
            barks: {
                bell: ["Dzwon mówi... słuchaj, co mówi.", "Bim... bam..."],
                wander: ["Kruki znowu kraczą nad murami.", "Za moich młodych lat studnia była pełna."],
                stand: ["Rycerze z kamienia... pamiętają więcej niż ludzie.", "Tam jest ogród. Nikt już tam nie wchodzi. Nikt prócz mnie."],
                rain: ["Woda wraca do skał... dobrze, dobrze."],
                home: ["Lina od dzwonu się strzępi...", "Kruk na belce... patrzy. Zawsze patrzy."],
                night: ["Trzecia... trzeba zadzwonić. Ktoś musi pamiętać."]
            },
            talk: {
                morning: ["Dzwonię o szóstej, w południe i o szóstej wieczorem. Tak było zawsze. Odkąd stoi ten mur.", "Słyszałeś dzwon w nocy? Nie, nie słyszałeś. Ludzie śpią."],
                day: ["Ten ogród za murem... zakon tam sadził zioła, gdy jeszcze był zakon. Klucz? Jaki klucz?", "Twój dziadek? Stach? Dobry chłopak. Kiedyś bał się wieży. Ty się nie boisz?"],
                evening: ["Wieczorem wracam na wieżę. Stąd widać całe miasto. I to, czego miasto nie widzi."],
                night: ["Jedno pytanie na rok, chłopcze. Pamiętaj. Jedno pytanie."],
                rain: ["Deszcz... skały piją. Pod Kruczymi Skałami wody jest więcej, niż myślą."]
            }
        },
        {
            key: "kupiec", name: "Baltazar Vey", title: "kupiec z kontynentu", sheet: "$Npc_Kupiec",
            plan: [[0, "inside", "kantor_drzwi"], [8, "stand", "kantor_przed"], [12, "wander", "stragan2"], [14, "stand", "kantor_przed"], [18, "inside", "tawerna"],
                   [21.5, "stand", "kantor_rog"], [23, "inside", "kantor_drzwi"]],
            barks: {
                stand: ["Towary z kontynentu! Przyprawy, sukno, stal!", "Dla przyjaciół - specjalne ceny.", "Wszystko na sprzedaż. Prawie wszystko."],
                wander: ["Hm, zboże drożeje. Wojna to dobry czas dla kupców.", "Ta wyspa... wszyscy czegoś tu szukają."],
                rain: ["Deszcz psuje sukno. Do środka, do środka!"],
                tavern: ["Słucham, słucham... tawerna mówi więcej niż listy.", "Jakie wieści z promu?", "Dla przyjaciół - specjalne ceny."],
                home: ["Witaj w kantorze. Towar z kontynentu, najlepszy na wyspie.", "Nie dotykaj tej skrzyni, przyjacielu."],
                night: ["Spóźniają się... Ach, to ty. Idź dalej, przyjacielu."]
            },
            talk: {
                morning: ["Baltazar Vey, do usług. Przywożę z kontynentu to, czego wyspa nie ma. A czego wyspa ma za dużo, wywożę.", "Masz coś starego? Monety z krukiem, kawałki kamienia z napisami? Zapłacę dobrze."],
                day: ["Na kontynencie wojna. Każda strona chce tego samego - pewności. Ludzie płacą fortunę za pewność, wiesz?", "Lord Zaleski to rozsądny człowiek. Dobrze się nam razem handluje."],
                evening: ["Wieczór spędzam u Borgara. Tawerna to najlepsze miejsce, by słuchać."],
                night: ["Nie handluję po zmroku. Chyba że... nie. Dobranoc."],
                rain: ["W taką pogodę statki nie przypływają. Pech."]
            }
        },
        {
            key: "soltys", name: "Sołtys Bronisław", title: "sołtys", sheet: "$Npc_Soltys",
            plan: [[0, "inside", "ratusz_drzwi"], [8, "stand", "ratusz_przed"], [12, "wander", "rynek_srodek"], [13, "inside", "ratusz_drzwi"], [16, "wander", "studnia_rynek"],
                   [18, "inside", "tawerna"], [21, "inside", "ratusz_drzwi"]],
            barks: {
                stand: ["Ogłoszenie! Wodę wydzielamy po dzbanie na rodzinę!", "Kto ma sprawę do ratusza - do południa!"],
                wander: ["Ta studnia... kiedyś była sercem rynku.", "Podatek dla Lorda w tym roku znów większy."],
                rain: ["Deszcz! Wszyscy łapać wodę do beczek!"],
                tavern: ["Racje wody znów w dół...", "Sprawy do sołtysa - jutro w ratuszu!"],
                home: ["Księga racji się nie zgadza... znowu.", "Podatek dla Lorda, podatek dla Lorda..."],
                night: []
            },
            talk: {
                morning: ["Sołtys Bronisław. Ratusz otwarty do południa. Woda wydzielana, zboże drożeje, uchodźców przybywa... a Lord chce podatku.", "Słyszałem, że twój dziadek ma dług u Lorda. Zły to człowiek do bycia mu winnym."],
                day: ["Studnia na wiosnę prawie wyschła - daje parę wiader na dzień, więc dzielę je na przydziały. Kopaliśmy głębiej - nic. Jakby ktoś zabrał wodę spod rynku.", "Potrzebuję ludzi do pomocy. Zajrzyj na tablicę ogłoszeń w tawernie."],
                evening: ["Po pracy idę do Borgara posłuchać, co gadają ludzie. Sołtys musi wiedzieć wszystko."],
                night: ["Ratusz zamknięty. Jutro od ósmej."],
                rain: ["Deszcz to błogosławieństwo. Każda kropla do beczki!"]
            }
        },
        {
            key: "garbarz", name: "Ignac", title: "garbarz i szewc", sheet: "$Npc_Garbarz",
            plan: [[0, "inside", "garbarz_dom"], [6.5, "work", "garbarnia"], [17, "wander", "ulica_rzem"], [19, "inside", "tawerna"], [22, "inside", "garbarz_dom"]],
            barks: {
                work: ["Skóry! Skupuję skóry z polowań!", "Garbnik śmierdzi, ale buty z tego wyjdą piękne.", "Hej, bosy! Zrobić ci buty?"],
                wander: ["Bez wody nie wyprawię skór. Ta susza mnie wykończy."],
                rain: ["Deszcz! Wreszcie mam w czym moczyć skóry!"],
                tavern: ["Tadek znowu się chwali.", "Szewc bez butów chodzi, mówią. U mnie jest odwrotnie."],
                home: ["Kopyto, dratwa, szydło... gdzie ja położyłem szydło?", "Przynieś skóry, zrobię buty."],
                night: []
            },
            talk: {
                morning: ["Ignac, garbarz i szewc. Przynieś mi skóry z polowania - kupię albo zrobię ci z nich buty. Na boso daleko nie zajdziesz.", "Skóra zająca, jelenia, dzika - wszystko się przyda."],
                day: ["Do wyprawiania skór trzeba wody. Kupuję od Kuby po trzy grosze... i jakoś zawsze ma.", "Dobre buty to trzy skóry i dzień roboty. Przynieś skóry, resztę zrobię ja."],
                evening: ["Wieczorem do Borgara. Kowal znowu będzie się chwalił, że nikt go nie pokona."],
                night: ["Zamknięte. Jutro od świtu."],
                rain: ["Deszcz! Wystawiam kadzie - woda za darmo, kto by pomyślał."]
            }
        },
        {
            key: "feliks", name: "Feliks", title: "kamerdyner Lorda", sheet: "$Npc_Feliks",
            plan: [[0, "inside", "brama_wsch"], [7, "wander", "stragan1"], [8.5, "stand", "stragan2"], [9.5, "stand", "ratusz_obok"], [10.5, "inside", "brama_wsch"]],
            barks: {
                wander: ["Najlepszy chleb dla dworu, pani Hanko.", "Jaśnie pan lubi świeże bułki."],
                stand: ["Jaśnie pan prosi o terminowe rachunki, panie sołtysie.", "Proszę zapisać na rachunek dworu."],
                rain: ["Deszcz... trzeba zdjąć pranie w oranżerii."], night: []
            },
            talk: {
                morning: ["Feliks, kamerdyner jaśnie pana Zaleskiego. Zakupy dla dworu robię sam - nikomu innemu nie ufam.", "Dług twojego dziadka? Zapisany co do grosza. Jaśnie pan przyjmuje od ósmej."],
                day: ["Dwór? Wszystko w najlepszym porządku. Ogród? Ach, ogród... podlewamy z... z beczek. Bardzo oszczędnie."],
                evening: ["Wieczorami pilnuję drzwi dworu. Jeśli masz pieniądze dla jaśnie pana, zapukaj."],
                night: ["Już późno. Dobranoc."],
                rain: ["Deszcz to dla ogrodu błogosławieństwo. Choć nasz ogród... nie narzeka."]
            }
        },
        {
            key: "bronek", name: "Bronek", title: "chłopak z miasteczka", sheet: "$Npc_Bronek", speed: 4,
            plan: [[0, "inside", "dom_mieszczan"], [8, "wander", "rynek_srodek"], [12, "inside", "dom_mieszczan"], [13, "wander", "rynek_rog"], [18.5, "inside", "dom_mieszczan"]],
            barks: {
                wander: ["Złap mnie, Zośka!", "A ja wiem, gdzie Kuba jeździ w nocy!", "Hej, bosy! Ty też nie masz butów?"],
                rain: ["Kałuża! Hop!", "Deszcz, deszcz!"], night: []
            },
            talk: {
                morning: ["Bronek jestem. Mama mówi, żeby nie gadać z obcymi. Ale ty nie jesteś obcy, ty jesteś od dziadka Stacha!", "Dzwonnik Ambroży czasem dzwoni w nocy. Słyszałem! Nikt mi nie wierzy."],
                day: ["Kuba woziwoda wraca przed świtem z mokrym wozem. Skąd, jak wszędzie sucho?", "Zośka się chowa za studnią. Nie mów jej, że wiem."],
                evening: ["Muszę do domu, bo mama krzyczy."],
                night: ["Zzz..."],
                rain: ["Pada! Chodź skakać po kałużach!"]
            }
        },
        {
            key: "zosia", name: "Zosia", title: "dziewczynka z miasteczka", sheet: "$Npc_Zosia", speed: 4,
            plan: [[0, "inside", "dom_mieszczan"], [8.2, "wander", "rynek_lawka"], [12, "inside", "dom_mieszczan"], [13.2, "wander", "rynek_srodek"], [18.5, "inside", "dom_mieszczan"]],
            barks: {
                wander: ["Bronek, nie widzisz mnie!", "Kotek! Gdzie jest kotek?", "Raz, dwa, trzy... szukam!"],
                rain: ["Mokro mi w warkocze!"], night: []
            },
            talk: {
                morning: ["Jestem Zosia. Masz kotka? U dziadka Stacha jest kotek Mruczek, wiem!", "Pani Hanka daje mi czasem okruszki."],
                day: ["Za murem z rycerzami jest ogród. Dzwonnik mówi, że tam rosną dziwne zioła.", "Bawimy się w chowanego. Chcesz się chować?"],
                evening: ["Mama woła. Pa!"],
                night: ["Zzz..."],
                rain: ["Jak pada, to ptaszki piją z rynny."]
            }
        },
        {
            key: "ludmila", name: "Ludmiła", title: "uchodźczyni z kontynentu", sheet: "$Npc_Ludmila",
            plan: [[0, "inside", "pod_murem"], [6.5, "wander", "pod_murem"], [9, "stand", "stragan1_obok"], [11, "wander", "rynek_rog"], [15, "stand", "ratusz_przed"],
                   [17, "wander", "pod_murem"], [20, "inside", "pod_murem"]],
            barks: {
                stand: ["Dobrzy ludzie... kromka chleba dla dziecka...", "Panie sołtysie, choć dach nad głową..."],
                wander: ["Ela, nie odchodź daleko.", "Marek... gdzie ty jesteś..."],
                rain: ["Ela, pod plandekę!"], night: []
            },
            talk: {
                morning: ["Ludmiła. Przypłynęłyśmy z córką promem, gdy spalili naszą wieś na kontynencie. Mąż... został w wojsku. Nie wiem, czy żyje.", "Śpimy pod murem przy stogach. Sołtys mówi, że miejsca nie ma."],
                day: ["Wszyscy na kontynencie czegoś szukają. Żołnierze mówili o jakimś sercu... o pewności. Ludzie giną za coś, czego nikt nie widział.", "Gdybyś miał trochę jedzenia dla Eli... Ja wytrzymam."],
                evening: ["Wieczorem wracamy pod mur. Jest tam jeszcze ciepło od kamieni."],
                night: ["Cicho... Ela śpi."],
                rain: ["Deszcz... przynajmniej Ela się napije."]
            }
        },
        {
            key: "ela", name: "Ela", title: "córeczka Ludmiły", sheet: "$Npc_Ela", speed: 3,
            plan: [[0, "inside", "pod_murem"], [6.6, "wander", "pod_murem"], [9.2, "wander", "stragan1"], [11.2, "wander", "rynek_rog"], [15.2, "wander", "ratusz_przed"],
                   [17.2, "wander", "pod_murem"], [20, "inside", "pod_murem"]],
            barks: { wander: ["Mamo, patrz!", "Głodna jestem...", "Piesek?"], rain: ["Kap, kap!"], night: [] },
            talk: {
                morning: ["...", "Tata obiecał, że przypłynie. Przypłynie, prawda?"],
                day: ["Masz chleb? Mama mówi, że nie wolno prosić... ale ja bardzo głodna."],
                evening: ["Mama mówi, że na wyspie nie ma wojny."], night: ["..."], rain: ["Deszcz smakuje jak w domu."]
            }
        },
        {
            key: "rafal", name: "Rafał", title: "obcy w podartym kaftanie", sheet: "$Npc_Rafal", speed: 4,
            plan: [[0, "inside", "stodola"], [4.5, "wander", "stodola"], [6.5, "inside", "stodola"], [21, "wander", "ulica_rzem"], [23.5, "inside", "stodola"]],
            barks: {
                wander: ["...nikt mnie nie widział...", "Kapral? Gdzie kapral?", "Cicho, cicho..."],
                rain: ["Dobrze. W deszcz straż siedzi pod dachem."], night: ["Nie widziałeś mnie. Jasne?"]
            },
            talk: {
                morning: ["Nie patrz tak. Jestem... pracuję przy sianie. Tak. Przy sianie."],
                day: ["Czego chcesz?"],
                evening: ["Kaftan? Podarłem o płot. Nic więcej."],
                night: ["Słuchaj. Nie mów kapralowi, że tu jestem. Proszę. Na kontynencie wieszają takich jak ja.", "Żołnierze szukali tu czegoś pod skałami. Kazali kopać. Uciekłem, zanim skończyliśmy."],
                rain: ["Deszcz zmyje ślady. Dobrze."]
            }
        },
        // ---------------- Podgrodzie (Map111): the poor suburb outside the west wall (2026-10-05) - its spots are its own
        // "Miejsce: <key>" events (docs/podgrodzie/MIEJSCA.md)
        {
            key: "praczka", name: "Marta Ługowa", title: "praczka", sheet: "$Npc_Praczka", map: 111,
            plan: [[0, "inside", "praczka_drzwi"], [5, "work", "pranie"], [11, "wander", "plac"], [12.5, "work", "pranie"], [17, "wander", "studnia_sucha"],
                   [19, "inside", "praczka_drzwi"]],
            barks: {
                work: ["Dwa wiadra z miasta na jeden kosz prania... a koszy cała góra.", "Koszule mieszczan, prześcieradła z dworu... a ręce moje.", "Franek! Nie łaź mi po praniu!"],
                wander: ["Grosz za kosz. Kiedyś było dwa.", "Ta studnia wyschła dawno. Teraz każde wiadro noszę z miasta."],
                rain: ["Deszcz! Balie, wszystkie balie pod rynnę!", "Franek, łap wodę, w co się da!"],
                night: ["Do domu, dziecko. Nocą tu niebezpiecznie."],
                home: ["Franek, umyj się... no, przetrzyj chociaż.", "Jutro dworskie pranie. Trzeba wstać przed świtem."]
            },
            talk: {
                morning: ["Piorę dla mieszczan i dla dworu. Wodę noszę z miasta, z przydziału przy studni na rynku - dwa wiadra, tyle co sołtys pozwoli. Ale grosz jest.", "Mój Janek zmarł zimą, został mi Franek. Ma osiem lat, a już nosi drewno za Zbycha."],
                day: ["Kuba woziwoda wozi wodę mieszczanom pod same drzwi - piekarni, kuźni, tawernie. Do nas za mur nie przywiezie, sami nosimy. Podgrodzie się nie liczy.", "Kamerdyner Lorda płaci za pranie najlepiej. I najmniej mówi. Pościel z dworu zawsze wilgotna, jakby u Lorda wody było w bród. Ciekawe, skąd."],
                evening: ["Wieczorem siadam przy naszej suchej studni. Ludzie mówią, że kiedyś była w niej woda i tu był plac targowy. Dziś tylko my i kurz."],
                night: ["Zamknij za sobą bramę, jak będziesz wracał. Nocą łażą tu różni."],
                rain: ["Deszcz! Z beczki deszczówki zrobię pranie i nie muszę dźwigać wiader z miasta. Dzień jak święto!"]
            }
        },
        {
            key: "franek", name: "Franek", title: "syn praczki", sheet: "$Npc_Franek", map: 111, speed: 4,
            plan: [[0, "inside", "praczka_drzwi"], [7, "wander", "zabawa"], [10, "wander", "kram"], [12, "wander", "pranie"], [14, "wander", "brama_zach"],
                   [16, "wander", "zabawa"], [19.5, "inside", "praczka_drzwi"]],
            barks: {
                wander: ["Ej, masz grosza?", "Zakład, że nie trafisz kamieniem w tamten słupek!", "Mama mówi, że jak dorosnę, pójdę do kuźni!", "Rysiek obiecał, że pokaże mi sidła!"],
                rain: ["Deszcz! Deszcz! Hura!"],
                night: [],
                home: ["Nie chcę spać...", "Mamo, a kiedy będzie deszcz?"]
            },
            talk: {
                morning: ["Nosiłem drewno za Zbycha. Dał mi za to suchara. Chcesz pół?", "Ty jesteś od tego dziadka z pola za lasem? On kiedyś dał mi jabłko."],
                day: ["Widziałem, jak Kuba woziwoda jechał przed świtem z pustymi beczkami. A wracał z pełnymi! Skąd?", "Józek ma w kramie prawdziwy hełm z kontynentu. Dziurawy, ale prawdziwy!"],
                evening: ["Mama mówi, że nie wolno chodzić do namiotów uchodźców. A Darin opowiada najlepsze historie o wojnie."],
                night: ["..."],
                rain: ["Pada! Łapię deszcz do garnka! Mama się ucieszy!"]
            }
        },
        {
            key: "drwal", name: "Zbych Smolarz", title: "drwal i węglarz", sheet: "$Npc_Drwal", map: 111,
            plan: [[0, "inside", "drwal_drzwi"], [5, "work", "drewutnia"], [10, "inside", "skraj_lasu"], [15, "work", "drewutnia"], [19, "wander", "namioty"],
                   [21.5, "inside", "drwal_drzwi"]],
            barks: {
                work: ["Hop! ...Hop! Suche drewno pęka jak szkło.", "Węgiel dla kowala, drewno dla piekarni. A dla siebie - drzazgi.", "Nie stój pod siekierą, chłopcze."],
                wander: ["Ogień grzeje lepiej, jak się przy nim gada.", "Darin, opowiedz jeszcze o tych żelaznych ludziach z kontynentu."],
                rain: ["Mokre drewno nie chce się palić... ale niech pada, niech pada."],
                night: ["Idź spać, chłopcze. Ja zaraz też."],
                home: ["Plecy... cholerne plecy.", "Mielerz trzeba doglądać co dzień. Węgiel sam się nie zrobi."]
            },
            talk: {
                morning: ["Rano rąbię, w południe idę do lasu, wieczorem znowu rąbię. Las już nie ten - susza wysuszyła sosny na pieprz. Zapalą się od iskry.", "Jak masz siekierę, to i ty utniesz drewna. Ale nie bierz z lasu Lorda. Jego gajowi pilnują lepiej niż strażnicy bramy."],
                day: ["Byłem w lesie. Z pół dnia drogi stąd ludzie Lorda kopią coś przy skałach. Nie pozwolili mi podejść.", "Kowal Tadek płaci za węgiel uczciwie. Jedyny w mieście, co nie targuje się z biedakiem."],
                evening: ["Siadam przy ognisku uchodźców. Darin opowiada o wojnie, a ja słucham. Lepsze to niż piwo, na które mnie nie stać."],
                night: ["Nocą Rysiek idzie w las. Ja nic nie wiem i ty nic nie wiesz."],
                rain: ["Deszcz? To dobrze. Las przestanie być beczką prochu."]
            }
        },
        {
            key: "klusownik", name: "Rysiek Sidło", title: "kłusownik", sheet: "$Npc_Klusownik", map: 111, speed: 4,
            plan: [[0, "inside", "skraj_lasu"], [4.5, "inside", "klusownik_drzwi"], [13, "wander", "plac"], [15, "wander", "kram"], [17, "wander", "namioty"],
                   [20, "inside", "skraj_lasu"]],
            barks: {
                wander: ["Czego się gapisz?", "Zając? Jaki zając? Kupiłem na targu.", "Józek, mam dla ciebie skórki. Tylko cicho."],
                rain: ["W deszcz zwierz idzie do wodopoju. Dobra noc na sidła."],
                night: ["Nie widziałeś mnie. Rozumiemy się?"],
                home: ["Śpię. Idź stąd.", "Nie dotykaj sideł!"]
            },
            talk: {
                morning: ["Mhm... śpię. Przyjdź po południu."],
                day: ["Las Lorda jest pełen zwierzyny. A ludzie tutaj jedzą trawę. Powiedz mi, kto tu jest złodziejem?", "Umiesz zastawić sidła? Przynęta to połowa roboty. Zając sam do pustej pętli nie przyjdzie."],
                evening: ["Jak zajdzie słońce, idę na swoje. Gajowi Lorda śpią pijani, ale kapral Wit - nie śpi nigdy.", "Chcesz kupić skórkę? Taniej niż u kupca z kontynentu. I nie pytaj skąd."],
                night: ["Psst. W lesie za polem twojego dziadka jest źródło. Wyschło, ale ziemia przy nim jeszcze wilgotna. Ktoś tam kopał. Nie ja."],
                rain: ["Deszcz zatrze ślady. Dzisiaj wrócę z pełną torbą."]
            }
        },
        {
            key: "znachorka", name: "Babka Jadwiga", title: "znachorka", sheet: "$Npc_Znachorka", map: 111, speed: 2,
            plan: [[0, "inside", "znachorka_drzwi"], [6, "work", "ziola"], [10, "wander", "kapliczka"], [12, "work", "ziola"], [16, "stand", "kapliczka"],
                   [18, "inside", "znachorka_drzwi"]],
            barks: {
                work: ["Krwawnik na rany, pokrzywa na siłę, czosnek na wszystko.", "Ziele schnie w trzy dni... w taką suszę w jeden.", "Nie depcz mi ogródka, dziecko."],
                wander: ["Święta panienko, daj deszczu...", "Ręce mi drżą. Stara jestem."],
                stand: ["...i odpuść nam nasze winy... i daj deszczu.", "Pomódl się ze mną, dziecko. Nie zaszkodzi."],
                rain: ["Wysłuchała! Wysłuchała!"],
                night: ["Idź do domu, dziecko. Noc nie jest dla młodych."],
                home: ["Siadaj, siadaj. Herbaty z mięty? Franek przyniósł wody z miasta, zaraz zagotuję.", "Gorączka? Pokaż język."]
            },
            talk: {
                morning: ["Zbieram zioła o świcie, póki chłodno. Rosy nie ma od wiosny, ale ziele jeszcze się trzyma.", "Skaleczyłeś się? Krwawnik przyłożony do rany zatrzymuje krew. Zawiąż szmatką i przejdzie."],
                day: ["Sołtys mówi, że Podgrodzie to złodzieje i darmozjady. A kto mu leczył syna z gorączki? Babka Jadwiga.", "Pamiętam, jak ten zamek był jeszcze zamkiem, nie tawerną. Strzegł czegoś. Mój dziad mówił: strzegł serca ziemi. Głupie bajki starego człowieka."],
                evening: ["Wieczorem modlę się przy kapliczce. O deszcz, o zdrowie dla dzieci, o to, żeby wojna z kontynentu nie przyszła przez morze."],
                night: ["Jak cię boli, zapukaj. Stara Jadwiga i tak nie śpi."],
                rain: ["Deszcz! Widzisz? Mówiłam, że wysłucha!"]
            }
        },
        {
            key: "szmaciarz", name: "Józek Łata", title: "handlarz starzyzną", sheet: "$Npc_Szmaciarz", map: 111,
            plan: [[0, "inside", "szmaciarz_drzwi"], [7, "stand", "kram"], [12, "wander", "brama_zach"], [13, "stand", "kram"], [18, "wander", "plac"],
                   [20, "inside", "szmaciarz_drzwi"]],
            barks: {
                stand: ["Starzyzna! Gwoździe, garnki, łyżki, guziki!", "Wszystko ma swoją cenę, nawet dziura w bucie!", "Hełm z kontynentu! Prawie bez dziur!"],
                wander: ["Ktoś coś wyrzucił? Józek weźmie.", "Pod murem zawsze coś się znajdzie."],
                rain: ["Deszcz! Rdza! Wszystko mi zardzewieje!"],
                night: ["Zamknięte, zamknięte. Jutro!"],
                home: ["Gdzie ja to położyłem...", "Nie dotykaj! To jest... cenne. Bardzo cenne."]
            },
            talk: {
                morning: ["Kupię wszystko i sprzedam wszystko. Gwoździe z rozbiórki, skorupy, sznurek. Ty, chłopcze, wyglądasz na kogoś, kto znajduje rzeczy.", "Kiedyś miałem sklep na rynku. Potem sołtys podniósł czynsz. Teraz mam kram za murem. Ale za to jaki widok!"],
                day: ["Uchodźcy przynoszą rzeczy z kontynentu. Medaliki, guziki od mundurów, raz przynieśli kawałek mapy. Mapy czego? Nie wiem. Kupiłem.", "Ten kupiec z rynku, Baltazar Vey, kupuje u mnie wszystko, co przychodzi z kontynentu. Wszystko. Nawet śmieci. Dziwne, nie?"],
                evening: ["Wieczorem obchodzę plac. Ludzie wyrzucają rzeczy po zmroku, żeby nikt nie widział, że ich nie stać na naprawę."],
                night: ["Zamknięte! ...a, to ty. Nadal zamknięte."],
                rain: ["Deszcz zmywa błoto ze starych rzeczy. Czasem pod spodem jest coś dobrego!"]
            }
        },
        {
            key: "uchodzca", name: "Darin z Kontynentu", title: "uchodźca", sheet: "$Npc_Uchodzca", map: 111,
            plan: [[0, "inside", "uchodzcy_drzwi"], [6, "wander", "namioty"], [8, "wander", "brama_zach"], [12, "work", "drewutnia"], [15, "wander", "plac"],
                   [18, "stand", "namioty"], [22, "inside", "uchodzcy_drzwi"]],
            barks: {
                wander: ["Szukam pracy. Jakiejkolwiek.", "W mieście mówią na nas „przybłędy”.", "Prom co trzeci dzień... może tym razem przypłyną moi."],
                work: ["Zbych pozwala mi rąbać, kiedy jest w lesie. Za strawę.", "W wojsku rąbałem drewno na palisady. Ręce pamiętają."],
                stand: ["Siadaj przy ogniu. Ogień jest za darmo.", "Każdej nocy ktoś nowy. Wojna nie śpi."],
                rain: ["Deszcz... na kontynencie padało, kiedy palili nasze miasto. Nie lubię deszczu."],
                night: ["Nie chodź sam po nocy. Ja już widziałem, co noc robi z ludźmi."],
                home: ["Ciasno tu, ale dach jest.", "Śpij, mała. Śpij..."]
            },
            talk: {
                morning: ["Darin. Byłem cieślą na kontynencie. Potem przyszły wojska i kazali mi budować szubienice. Uciekłem pierwszym promem.", "Rano chodzę pod bramę. Czasem ktoś z miasta szuka rąk do pracy. Rzadko."],
                day: ["Na kontynencie wszyscy walczą o to samo. O Serce. Nikt nie wie, co to jest, ale każdy król chce je mieć.", "Widziałem tu chłopaka w podartym kaftanie, w stodole za murem. Nosił naszywkę z mojego pułku. Udaje, że mnie nie zna."],
                evening: ["Wieczorem pilnuję ognia. Przychodzą Zbych, Rysiek, czasem babka Jadwiga. Opowiadam o wojnie, żeby wiedzieli, czego się bać."],
                night: ["Śpij spokojnie, wyspiarzu. Dopóki morze jest między nami a nimi."],
                rain: ["Ten deszcz pachnie jak u nas, przed wojną. Usiądź. Pomilczmy."]
            }
        },
        {
            key: "zebrak", name: "Stary Gaweł", title: "żebrak", sheet: "$Npc_Zebrak", map: 111, speed: 2,
            plan: [[0, "inside", "zebrak_noc"], [6.5, "stand", "zebrak"], [12, "wander", "plac"], [13.5, "stand", "zebrak"], [19, "wander", "namioty"],
                   [21.5, "inside", "zebrak_noc"]],
            barks: {
                stand: ["Grosik dla starego... Bóg zapłać.", "Pamiętam ten mur, kiedy jeszcze był murem zamku.", "Dobry człowiek, dobry... daj co łaska."],
                wander: ["Kości bolą. Będzie deszcz. Albo i nie będzie.", "Stary Gaweł wszystko widzi. Nikt nie pyta."],
                rain: ["Deszcz! Jak za dawnych lat!", "Niech leje, niech leje..."],
                night: ["Idź spać, młody. Noc nie dla ciebie."]
            },
            talk: {
                morning: ["Gaweł. Stary Gaweł spod bramy. Byłem chłopcem w zamku, nosiłem wodę strażnikom - kiedy zamek był jeszcze zamkiem, a nie tawerną.",
                    "Daj grosik, a powiem ci coś, czego nikt już nie pamięta."],
                day: ["Kiedyś dzwon mówił. Strażnicy znali każde bicie. Trzy i jeden - obcy w murach. Pięć - brama otwarta nocą. Reszty nie pamiętam... albo nie chcę pamiętać.",
                    "W ogrodzie za tawerną stały posągi rycerzy. Na ich tarczach są znaki. Strażnicy mówili, że kto zna dzwon, ten zna drogę."],
                evening: ["Wieczorem siadam przy ognisku uchodźców. Darin to dobry człowiek. Opowiada o wojnie jak stary żołnierz - bo nim jest."],
                night: ["Śpię pod daszkiem przy murze. Jak dzwon bije nocą, budzę się i liczę. Stary nawyk."],
                rain: ["Deszcz... Za moich lat studnia na rynku była pełna po brzegi. Woda szła spod wzgórza, ze starej cysterny zakonu."]
            }
        },
        // ---------------- the quests' people (2026-10-05, TownQuests: K37, K39, K15, W1). Sheets in the hero's style.
        {
            key: "zlodziej", name: "Szymek", title: "chłopak z obozu pod murem", sheet: "$Npc_Zlodziej", speed: 4,
            plan: [[0, "inside", "pod_murem"], [6.5, "wander", "pod_murem"], [8.3, "wander", "rynek_rog"], [12, "wander", "stragan1_obok"], [14, "wander", "schody_rzem"],
                   [17.5, "wander", "pod_murem"], [20.5, "inside", "pod_murem"]],
            barks: {
                wander: ["Pan ma może skórkę chleba?", "Nie gapię się. Tylko patrzę.", "Najszybszy w całym obozie - to ja!", "Z wozu coś spadło? Nie? Szkoda."],
                rain: ["Deszcz! Otwórz gębę, to się napijesz!", "Jak pada, nikt nie goni."], night: []
            },
            talk: {
                morning: ["Szymek jestem. Z obozu pod murem. Mama została na kontynencie, a tata... nie wiem. Ludmiła mówi, żebym się jej trzymał.",
                    "Na targu zawsze coś spadnie z wozu. Trzeba tylko być szybszym od psów."],
                day: ["Ty też chodzisz boso! To jesteś swój.", "Rafał mówi, że na kontynencie za kradzież obcinają rękę. Tu tylko kapral krzyczy. I goni. Wolno goni."],
                evening: ["Wieczorem pod murem ciepło od kamieni. Ela już śpi, a ja pilnuję."],
                night: ["Nie śpię. Pilnuję obozu."],
                rain: ["Jak pada, to nikt nie goni. Wszyscy pod daszkami."]
            }
        },
        {
            key: "gracz", name: "Lucjan Kość", title: "wędrowny gracz w kości", sheet: "$Npc_Gracz", when: "market",   // (only on the market days)
            plan: [[0, "inside", "brama_pld"], [9.7, "stand", "stragan_kosci"], [14, "inside", "brama_pld"]],
            barks: {
                stand: ["Kości, panowie! Pięć groszy, a może wygrasz dziesięć!", "Kto się nie boi szczęścia? Podejdź!", "Szóstka! Znowu szóstka! Ach, co za dzień!"],
                rain: ["Deszcz, a kości suche. Dobry znak!"], night: []
            },
            talk: {
                morning: ["Lucjan Kość, do usług. Gram tam, gdzie targ, a targ jest wszędzie, gdzie są ludzie z groszem.", "Ręce czyste, kości uczciwe. Sprawdź sam - no, tylko nie za długo."],
                day: ["Szczęście to nie grzech, mój drogi. Grzech to nie spróbować.", "W zeszłym tygodniu jeden chłop przegrał tu cały jęczmień. Pech. Zdarza się najlepszym."],
                evening: ["Po targu ruszam dalej. Wyspa duża, a jarmarków dużo."],
                night: ["Dobranoc, dobranoc."],
                rain: ["W deszcz ludzie siedzą pod daszkami i nudzą się. A nuda to najlepszy przyjaciel kości."]
            }
        },
        {
            key: "bartek", name: "Bartek Kmieć", title: "chłop spod Młynówki", sheet: "$Npc_Bartek",
            plan: [[0, "inside", "brama_pld"], [9.5, "wander", "rynek_rog"], [14, "inside", "tawerna"], [21, "inside", "brama_pld"]],
            barks: {
                wander: ["Wszystko przegrałem... wszystko.", "Żona mnie zabije. Albo gorzej - nie odezwie się.", "Siedem szóstek z rzędu. Siedem!"],
                rain: ["Deszcz... przynajmniej pole się napije. Moje pole. Jeszcze moje."],
                tavern: ["Jeszcze jedna partyjka... nie, nie, już nie gram.", "Grosz do grosza, a potem kości...", "Borgar, na kredę. Ostatni raz."],
                night: []
            },
            talk: {
                morning: ["Bartek Kmieć, spod Młynówki. Młyn stoi, mąki nie ma, to przyszedłem sprzedać jęczmień w mieście. I sprzedałem. A potem przegrałem.",
                    "Na targu siedzi taki jeden, z piórem przy kapeluszu. Mówi, że szczęście trzeba zaprosić. Ja zaprosiłem. Przyszło do niego."],
                day: ["Wody w Młynówce po kostki. Kiedyś koło młyna szło tak, że gadać się nie dało."],
                evening: ["Wieczorem u Borgara... kości. Nie, nie, tylko patrzę. Patrzeć wolno."],
                night: ["Do domu daleko. Prześpię się pod murem."],
                rain: ["Deszcz! Może Młynówka się podniesie. Choć na palec."]
            }
        },
        {
            key: "woznica", name: "Wojciech", title: "woźnica", sheet: "$Npc_Woznica",
            plan: [[0, "inside", "brama_pld"], [8, "work", "kantor_rog"], [11.5, "inside", "tawerna"], [15, "inside", "brama_pld"], [21.3, "stand", "woz_pld"],
                   [22.7, "inside", "brama_pld"]],
            barks: {
                work: ["Skrzynie do kantoru! Z drogi!", "Ostrożnie, to z kontynentu!", "Konie się płoszą, nie stój za wozem."],
                stand: ["Czekam na towar. Nie twoja sprawa jaki.", "Konie zmarzną, zanim ten kupiec się ruszy..."],
                tavern: ["Piwo dla woźnicy! Gardło suche jak droga.", "Na przystań i z powrotem, co dzień ta sama droga."],
                rain: ["Błoto po osie. Wóz się zakopie."],
                night: ["Idź, chłopcze. Nocą przy wozach nie ma czego szukać."]
            },
            talk: {
                morning: ["Wojciech, woźnica. Wożę towar z przystani do kantoru i z powrotem. Co w skrzyniach? Nie pytam. Płacą od skrzyni, nie od pytania."],
                day: ["Na przystani mówią, że wojna na kontynencie idzie w złą stronę. Dla kogo złą - zależy, kogo pytasz.", "Kupiec Vey płaci dobrze. Za dobrze, jak na suszone grzyby."],
                evening: ["Wieczorem jadę jeszcze raz pod bramę południową. Kupiec zawsze ma coś na nocny kurs."],
                night: ["Ciii. Konie śpią. Ja nie."],
                rain: ["W deszcz na przystań nie jadę. Kupiec może sobie krzyczeć."]
            }
        },
        {
            key: "straznik", name: "Strażnik dworu", title: "straż Lorda", sheet: "$Npc_Straznik", map: 24, speed: 3,
            plan: [[0, "patrol", STRAZ], [5, "stand", "straz_dzien"], [21, "patrol", STRAZ]],
            barks: {
                stand: ["Dwór jaśnie pana Zaleskiego. Bez sprawy - ani kroku dalej.", "Jaśnie pan przyjmuje od ósmej."],
                patrol: ["Cisza... tylko świerszcze.", "Kto tam? ...Kot. Tylko kot."],
                rain: ["Deszcz, a ja w ogrodzie. Kwiatki mają lepiej niż straż."],
                night: ["Zimno... do świtu jeszcze daleko.", "Ciekawe, co ten Feliks robi po nocach w oranżerii..."]
            },
            talk: {
                morning: ["Straż dworu. Pilnuję, żeby nikt obcy nie deptał jaśnie panu kwiatów.", "Ogród zielony jak na wiosnę, co? Feliks dba. Nie pytaj, czym podlewa."],
                day: ["Jaśnie pan stoi przed drzwiami od ósmej. Ze sprawą - do niego. Bez sprawy - do domu."],
                evening: ["Wieczorem obchodzę ogród. Do rana."],
                night: ["Nocą do ogrodu nie wolno. Rozkaz Feliksa. Znaczy - jaśnie pana."],
                rain: ["W deszcz nawet złodzieje siedzą w domach. A ja nie."]
            }
        },
        {
            // (last in the list: a resident's event id is FIRST + its place here - appended, the others keep their ids)
            // the new butler (user 2026-10-05): once W1 has sent Feliks away (TownLife "gone"), Teodor does the manor's errands in his stead
            key: "kamerdyner", name: "Teodor", title: "kamerdyner Lorda", sheet: "$Npc_Kamerdyner",
            when: () => !!(window.TownLife && typeof TownLife.gone === "function" && TownLife.gone("feliks")),
            plan: [[0, "inside", "brama_wsch"], [7, "wander", "stragan1"], [8.5, "stand", "stragan2"], [9.5, "stand", "ratusz_obok"], [10.5, "inside", "brama_wsch"]],
            barks: {
                wander: ["Dzień dobry, pani Hanko. Dwór płaci gotówką, jak należy.", "Świeże bułki dla jaśnie pana, jeśli łaska."],
                stand: ["Rachunki dworu są otwarte dla każdego, panie sołtysie.", "Proszę mi mówić po imieniu. Teodor."],
                rain: ["Deszcz! Jaśnie pan każe otworzyć rynny dla miasta."], night: []
            },
            talk: {
                morning: ["Teodor, nowy kamerdyner jaśnie pana Zaleskiego. Służyłem jeszcze jego ojcu - wróciłem, kiedy Feliksa... zabrakło.", "Dług twojego dziadka? Zapisany co do grosza, uczciwie. Jaśnie pan przyjmuje od ósmej, a nocą zapukaj - otworzę."],
                day: ["Śluza pod oranżerią jest teraz pod moim kluczem. Ani kropli więcej dla dworu, niż trzeba - tak kazał jaśnie pan."],
                evening: ["Wieczorami pilnuję drzwi dworu. Jeśli niesiesz spłatę dla jaśnie pana, zapukaj śmiało."],
                night: ["Późno już, młodzieńcze. Dobranoc."],
                rain: ["Deszcz to błogosławieństwo dla całego miasta, nie tylko dla ogrodu dworu."]
            }
        }
    ];

    // the spots of the other maps residents live on ("map" in their data): defaults only - the map's "Miejsce: <key>" events win
    // (Map024: the guard's day post beside the left fire basket of the forecourt; his night round is the map's straz_1..4)
    const SPOTS_BY_MAP = { 111: {}, 24: { straz_dzien: [15, 16, 2] } };

    window.TownLifeData = { MAP: 8, FIRST_ID: 910, SPOTS, SPOTS_BY_MAP, RESIDENTS };
})();
