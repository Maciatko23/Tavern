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
// (v1.3.0, 2026-10-07) alt: { map, when, plan, talk, barks } - the resident moves to another outdoor map while `when` (a registered
// condition) holds: W6 "campOutside" sends Ludmila, Ela, Rafal and Marek to Podgrodzie's tents; TownQuests also adds "w6Fire" (Rafal
// by the camp's fire in W6 rozdz. 3). Marek (W6 rozdz. 7) is the last resident.

/*:
 * @target MZ
 * @plugindesc Dane mieszkańców miasteczka i Podgrodzia: plany dnia, okrzyki, rozmowy (dla TownLife.js). v1.3.0
 * @author Claude
 * @help Same dane - działa z TownLife.js (ma stać nad nim na liście).
 */

(() => {
    "use strict";

    const SPOTS = {
        tawerna: [51, 17, 8], przed_tawerna: [58, 19, 2], brama_twierdzy: [51, 29, 2], ogrod_zakonu: [33, 17, 8], staw: [66, 10, 6],
        stragan1: [33, 59, 2], stragan2: [33, 45, 2], studnia_rynek: [50, 50, 2], rynek_srodek: [53, 52, 2], rynek_lawka: [50, 46, 2],
        piekarnia_drzwi: [38, 73, 8], kantor_drzwi: [18, 47, 8], kantor_przed: [16, 48, 2], kantor_rog: [20, 48, 4],
        ratusz_drzwi: [85, 48, 8], ratusz_przed: [83, 48, 2], dzwonnica: [85, 31, 8],
        schody_rzem: [51, 65, 2], ulica_rzem: [12, 64, 2], kowadlo: [8, 63, 8], kuznia_dom: [13, 61, 8], garbarnia: [15, 85, 8],
        garbarz_dom: [6, 89, 8], woziwoda_dom: [59, 74, 8], brama_wsch: [100, 51, 4], brama_pld: [52, 92, 2],
        dom_mieszczan: [36, 39, 8], pod_murem: [58, 90, 2], stodola: [48, 90, 2], rynek_rog: [71, 47, 2],
        ratusz_obok: [84, 48, 4], stragan1_obok: [31, 58, 6],
        // (2026-10-05, the quests' new people) Lucjan's dice by the right stall; the carter's cart on the street before the south gate
        stragan_kosci: [35, 45, 4], woz_pld: [54, 90, 2],
        // (2026-10-07, W6 "Ludzie z promu") Rafał's seat by the camp's fire under the wall (the fire: TownQuests' prop "w6_fire" 32,51)
        w6_ognisko: [60, 90, 4]
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
                morning: ["Wstaję o czwartej, żeby chleb był na szóstą. Weź bochenek, póki ciepły.", "Gdybyś miał trochę zboża z działki dziadka - kupię. Mąka z młyna przestała przychodzić."],
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
            // (2026-10-07, W6 rozdz. 5 a) the town shut its gate: the camp lives outside the wall, in Podgrodzie by the refugees' tents
            alt: { map: 111, when: "campOutside",
                plan: [[0, "inside", "namioty"], [6.5, "wander", "namioty"], [9, "wander", "plac"], [12, "wander", "kram"], [15, "wander", "namioty"], [20, "inside", "namioty"]],
                barks: { wander: ["Ela, trzymaj się blisko namiotu.", "Za murem... jak psy za płotem.", "Marek... gdzie ty jesteś..."], rain: ["Ela, pod plandekę!"], night: ["Słyszysz? Wilki..."] },
                talk: {
                    morning: ["Brama zamknięta. Mieszkamy teraz tu, za murem. Darin dał nam miejsce przy swoim ognisku.", "Nocą wyją wilki. Ela śpi z nożem pod poduszką. Sześć lat."],
                    day: ["Do miasta wpuszczają nas tylko za dnia. Po chleb. Jak żebraków.", "Gdybyś miał trochę jedzenia dla Eli... Ja wytrzymam."],
                    evening: ["Wieczorem pilnujemy ognia. Wilki boją się ognia. Chyba."], night: ["Cicho... Ela śpi."], rain: ["Deszcz... przynajmniej Ela się napije."]
                } },
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
            },
            alt: { map: 111, when: "campOutside",
                plan: [[0, "inside", "namioty"], [6.6, "wander", "namioty"], [9.2, "wander", "zabawa"], [12.2, "wander", "plac"], [15.2, "wander", "namioty"], [20, "inside", "namioty"]],
                barks: { wander: ["Mamo, patrz! Franek ma procę!", "Głodna jestem...", "Wilki tu przychodzą?"], rain: ["Kap, kap!"], night: [] },
                talk: { morning: ["Tu też są dzieci. Franek mówi, że jego mama pierze dla Lorda."], day: ["Za murem jest ładniej. Tylko w nocy straszno."],
                    evening: ["Darin opowiada o wojnie. Mama mówi, że nie wolno słuchać."], night: ["..."], rain: ["Deszcz smakuje jak w domu."] } }
        },
        {
            key: "rafal", name: "Rafał", title: "obcy w podartym kaftanie", sheet: "$Npc_Rafal", speed: 4,
            // (2026-10-07, W6 rozdz. 3: "w6Fire" - while the camp trusts the hero enough, Rafał sits by the camp's fire 20:30-23:30)
            plan: [[0, "inside", "stodola"], [4.5, "wander", "stodola"], [6.5, "inside", "stodola"], [20.5, "stand", "w6_ognisko", "w6Fire"], [21, "wander", "ulica_rzem", "!w6Fire"],
                   [23.5, "inside", "stodola"]],
            barks: {
                wander: ["...nikt mnie nie widział...", "Kapral? Gdzie kapral?", "Cicho, cicho..."],
                stand: ["Ogień grzeje. Tylko ognia tu nikt mi nie żałuje.", "Siadaj, jak chcesz. Ale nie za blisko."],
                rain: ["Dobrze. W deszcz straż siedzi pod dachem."], night: ["Nie widziałeś mnie. Jasne?"]
            },
            alt: { map: 111, when: "campOutside",
                plan: [[0, "inside", "namioty"], [4.5, "wander", "namioty"], [8, "wander", "drewutnia"], [13, "wander", "skraj_lasu"], [18, "wander", "namioty"], [23.5, "inside", "namioty"]],
                barks: { wander: ["Za murem przynajmniej kapral nie zagląda.", "Drwal daje mi rąbać za miskę zupy. Uczciwie."], night: ["Pilnuję ognia. Wilki."] },
                talk: { morning: ["Za murem jest gorzej i lepiej. Gorzej - wilki. Lepiej - nikt nie pyta, kim byłem."],
                    day: ["Rąbię u Zbycha. Za miskę. Ręce pamiętają kilof, ale siekiera też dobra."], evening: ["Wilki obchodzą obóz co noc. Liczę je. Siedem."],
                    night: ["Nie śpię. Ktoś musi pilnować."], rain: ["Deszcz zmyje ślady. Dobrze."] } },
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
                morning: ["Nosiłem drewno za Zbycha. Dał mi za to suchara. Chcesz pół?", "Ty jesteś od tego dziadka z działki za lasem? On kiedyś dał mi jabłko."],
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
            // (2026-10-17) "inside skraj_lasu" at midday = gone to the forest for wood: away, not in his hut
            away: ["skraj_lasu"],
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
            // (2026-10-17) "inside skraj_lasu" = in the woods at night, not in his hut: he crouches by his snares on Skraj lasu (Map023,
            // spot klusownik_las in SPOTS_BY_MAP below), and says his forest lines there (barks / talk "skraj_lasu")
            indoor: { skraj_lasu: "klusownik_las" },
            barks: {
                skraj_lasu: ["Ciii! Spłoszysz mi zająca.", "Nie widziałeś mnie. Rozumiemy się?", "Pętla stoi, przynęta leży. Teraz tylko czekać."],
                wander: ["Czego się gapisz?", "Zając? Jaki zając? Kupiłem na targu.", "Józek, mam dla ciebie skórki. Tylko cicho."],
                rain: ["W deszcz zwierz idzie do wodopoju. Dobra noc na sidła."],
                night: ["Nie widziałeś mnie. Rozumiemy się?"],
                home: ["Śpię. Idź stąd.", "Nie dotykaj sideł!"]
            },
            talk: {
                morning: ["Mhm... śpię. Przyjdź po południu."],
                day: ["Las Lorda jest pełen zwierzyny. A ludzie tutaj jedzą trawę. Powiedz mi, kto tu jest złodziejem?", "Umiesz zastawić sidła? Przynęta to połowa roboty. Zając sam do pustej pętli nie przyjdzie."],
                evening: ["Jak zajdzie słońce, idę na swoje. Gajowi Lorda śpią pijani, ale kapral Wit - nie śpi nigdy.", "Chcesz kupić skórkę? Taniej niż u kupca z kontynentu. I nie pytaj skąd."],
                night: ["Psst. W lesie za działką twojego dziadka jest źródło. Wyschło, ale ziemia przy nim jeszcze wilgotna. Ktoś tam kopał. Nie ja."],
                rain: ["Deszcz zatrze ślady. Dzisiaj wrócę z pełną torbą."],
                // (in the woods, Skraj lasu - whatever the hour)
                skraj_lasu: ["Cicho! ...Ty tutaj, o tej porze? Las nocą nie jest dla chłopaków z pola. Wracaj, zanim wilki cię zwęszą.",
                             "Psst. W lesie za działką twojego dziadka jest źródło. Wyschło, ale ziemia przy nim jeszcze wilgotna. Ktoś tam kopał. Nie ja.",
                             "Widzisz tę pętlę przy ścieżce? Zając chodzi zawsze tą samą drogą. Głupi jak gajowy Lorda."]
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
        },
        {
            // (2026-10-07, W6 rozdz. 7) Marek, Ludmiła's husband - brought out of the diggers' cave (TownQuests' flag marekSaved): he lives
            // with his wife and daughter - under the wall, or in Podgrodzie when the town shut its gate (alt). Few words yet: the rock
            // took his speech, the kerchief is giving it back. (appended: the others keep their ids)
            key: "marek", name: "Marek", title: "mąż Ludmiły", sheet: "$Npc_Marek", speed: 3,
            when: () => { const Q = window.TownQuests; return !!(Q && typeof Q.marekHome === "function" && Q.marekHome()); },
            plan: [[0, "inside", "pod_murem"], [6.8, "wander", "pod_murem"], [10, "stand", "w6_ognisko"], [13, "wander", "pod_murem"], [17, "stand", "w6_ognisko"],
                   [20, "inside", "pod_murem"]],
            barks: {
                wander: ["...Ela.", "Wiatr... konik... tak.", "(Marek dotyka chusty na szyi.)"],
                stand: ["(Marek patrzy w ogień. Tym razem mruga.)", "...ciepło."],
                rain: ["Deszcz... pamiętam deszcz."], night: []
            },
            talk: {
                morning: ["(Marek długo szuka słów.) ...Dzień... dobry. Tak się mówi. Pamiętam.", "Ludmiła mówi... że byłem daleko. Byłem. W skale."],
                day: ["(Marek pokazuje ci dłonie, pełne odcisków od kilofa.) ...Już nie kopię. Nigdy."],
                evening: ["Ela śpiewa. Ja... słucham. Słuchanie jest dobre."],
                night: ["...Cicho. Ela śpi."], rain: ["(Marek wystawia twarz do deszczu i się uśmiecha.)"]
            },
            alt: { map: 111, when: "campOutside",
                plan: [[0, "inside", "namioty"], [6.8, "wander", "namioty"], [10, "wander", "drewutnia"], [14, "wander", "namioty"], [20, "inside", "namioty"]] }
        },
        // ==================================================================== (2026-10-14) the harbour, Map125 (docs/przystan/KONCEPCJA.md)
        // Their first meetings, Janek's fish trade, Roch's runs, the ferry: Przystan.js (it speaks first). The conditions are Przystan's
        // (functions - the ferry today, the cutter away on a night run). away: "inside" there means away, not at home (TownLife).
        {
            // Janek, the fisherman who found the hero on the beach and carried him to Stach (the prologue). At sea at dawn, smoking
            // and mending later, the evening at Borgar's (the tavern's free guest place gosc_8)
            key: "janek", name: "Janek", title: "rybak", sheet: "$Npc_Janek", map: 125, speed: 3, away: ["na_morze"],
            plan: [[0, "inside", "janek_drzwi"], [4, "work", "lodz"], [5, "inside", "na_morze"], [8.5, "work", "pomost"], [9.5, "work", "wedzarnia"],
                   [12, "stand", "lawka"], [13, "work", "sieci"], [15, "stand", "stol_ryb"], [17, "wander", "nabrzeze"], [19, "inside", "tawerna"],
                   [22.5, "inside", "janek_drzwi"]],
            barks: {
                work: ["Mewy, a sio! To nie dla was!", "Śledź idzie ławicą, jak wojsko na wojnę.", "Sieć to jak życie: jedna dziura i wszystko ucieka."],
                stand: ["Chleb, cebula i śledź. Królewski obiad.", "Ławka twarda, ale widok na morze za darmo."],
                wander: ["Wiatr od lądu... czuć dym. Znowu coś tam płonie.", "Prom się spóźnia. Zawsze się spóźnia."],
                rain: ["Deszcz! Łap, w co się da. Morza się nie napijesz.", "W deszcz ryba bierze lepiej. Tylko rybak marznie."],
                night: ["Późno już. Jutro o świcie na łódź."],
                tavern: ["Borgar, jeszcze jedno! Ale słabe, jutro na morze.", "Opowiadałem wam, jak znalazłem chłopaka na plaży?", "Moje śledzie lepsze niż twoja kapusta, Borgar!"],
                home: ["Sieć znowu porwana... dorsz to nie śledź, szarpie.", "Zupa rybna. Trzeci dzień z rzędu. Dobra jest."]
            },
            talk: {
                morning: ["O świcie ryba głupia, a rybak mądry. Potem na odwrót.", "Śledzie biorą rano, aż woda się gotuje. Weź wędkę i stań na końcu pomostu."],
                day: ["Wędzę na olszy. Kto wędzi na sośnie, ten je smołę.", "Wodę noszę z miasta, jak wszyscy. Morza się nie napijesz - sól wyżre ci gardło.",
                      "Celnik liczy każdą rybę, co idzie promem. Moich nie liczy, bo za chude, mówi."],
                evening: ["Idę do Borgara. Piwo słabe, ale opowieści mocne.", "Wieczorem morze się uspokaja. Ludzie nie."],
                night: ["Czego tu szukasz po nocy? Jak przemytników, to ja nic nie wiem."],
                rain: ["Deszcz! Wystaw garnki, chłopcze. Morze to nie studnia."]
            }
        },
        {
            // Roch Szkwał, the smuggler of the prologue (the cutter, the last coins, the storm). Hides by the slipway under his first name,
            // mends nets and carries sacks on ferry days. Never goes to the town. Gone for good if the hero gives him to the customs (D20)
            key: "przemytnik", name: "Roch", title: "łata sieci na przystani", sheet: "$Npc_Przemytnik", map: 125, speed: 3, away: ["pochylnia"],
            when: () => { const P = window.Przystan; return !(P && typeof P.rochGone === "function" && P.rochGone()); },
            plan: [[0, "inside", "szopa_drzwi"], [0, "inside", "pochylnia", () => !!(window.Przystan && Przystan.kuterAway())],
                   [6, "stand", "wrak"], [9, "work", "pochylnia"], [9, "work", "molo", () => !!(window.Przystan && Przystan.ferryNow())],
                   [13, "stand", "nabrzeze_rog"], [13, "work", "molo", () => !!(window.Przystan && Przystan.ferryNow())], [15, "stand", "nabrzeze_rog"],
                   [16, "work", "beczka_ogien"], [21, "wander", "plaza"], [21, "inside", "pochylnia", () => !!(window.Przystan && Przystan.kuterAway())],
                   [23.5, "inside", "szopa_drzwi"], [23.5, "inside", "pochylnia", () => !!(window.Przystan && Przystan.kuterAway())]],
            barks: {
                stand: ["(Roch patrzy na morze i nic nie mówi.)", "Ten kruk znowu siedzi na maszcie."],
                work: ["Lina do liny, węzeł do węzła...", "Smoły. Gdybym miał choć garnek smoły."],
                wander: ["Plaża w nocy jest najuczciwsza. Nikt nie kłamie, bo nikogo nie ma."],
                rain: ["Deszcz. Dobra noc, żeby coś przewieźć. Gdyby było czym."],
                night: ["Idź spać, chłopcze."],
                home: ["Hm? Zamknij drzwi. Przeciąg."]
            },
            talk: {
                morning: ["Kruk znowu siedział na maszcie wraku. Co rano. Patrzy na ciebie, nie na mnie."],
                day: ["Prom co trzy dni. Na ląd puszczają tylko wojsko i ludzi z glejtem Lorda. Reszta pływa z takimi jak ja.",
                      "Celnik ma księgę. W tej księdze jest każdy grosz i każdy człowiek. Mnie tam nie ma. I niech tak zostanie."],
                evening: ["Vey z kantoru? Ten by sprzedał własną matkę. I sprzedał, widziałem kwit.", "Ogień w beczce. Najlepsze, co mam."],
                night: ["Idź spać. Nocą na przystani kręcą się tylko ci, co nie powinni."],
                rain: ["Deszcz zmywa ślady. Dlatego przemytnicy lubią deszcz. Ja nie jestem przemytnikiem, rzecz jasna."]
            }
        },
        {
            // the Lord's customs officer: the ledger, the port fee, the order to report every raven stone. At his desk in the customs house
            // (Map128) by day, on the pier on ferry days
            key: "celnik", name: "Sambor Kwit", title: "celnik Lorda", sheet: "$Npc_Celnik", map: 125, speed: 2,
            plan: [[0, "inside", "komora_drzwi"], [9, "stand", "molo_kontrola", () => !!(window.Przystan && Przystan.ferryNow())], [15, "inside", "komora_drzwi"],
                   [18, "stand", "komora_przed"], [19.5, "wander", "nabrzeze"], [21, "inside", "komora_drzwi"]],
            barks: {
                stand: ["Tobołki do kontroli! Po kolei!", "Opłata portowa: dwa grosze. Kto nie ma, ten czeka.", "Nie pić z morza! Czerwona woda! Czy ja tu do ściany mówię?"],
                wander: ["Wszystko się zgadza. Wszystko musi się zgadzać."],
                rain: ["Deszcz moczy papiery. Zakazuję deszczu. Żartuję."],
                night: ["Komora zamknięta. Przyjdź za dnia."],
                home: ["Dwa grosze... dwa grosze... i jeden kamień z krukiem. Zapisane.", "Atrament znowu zgęstniał."]
            },
            talk: {
                morning: ["Komora czynna od ósmej. Ty jesteś ten chłopak od Stacha, tak? Mam cię w księdze. Wszyscy są w księdze."],
                day: ["Rozkaz dworu: każdy kamień z krukiem do zgłoszenia. Po co dworowi kruki? Nie moja rzecz. Moja rzecz to zapisać.",
                      "Opłata portowa: dwa grosze od tobołka. Od ciebie nic, ty nie masz tobołka.",
                      "Tabliczki stawiam nie dla ozdoby. Czerwona woda: kto pije, ten rzyga do rana. A potem przychodzi do mnie po zwrot opłaty portowej."],
                evening: ["Dzień zamknięty. Rachunki się zgadzają. Prawie."],
                night: ["Po nocy nikt uczciwy nie chodzi po przystani. Ty też wracaj."],
                rain: ["Deszcz. Papier tego nie lubi."]
            }
        },
        {
            // the guard at the barrier (the manor guard's sheet: the Lord's colours) - by day at the barrier, at night round the quay
            key: "straznik_przystan", name: "Strażnik przystani", title: "straż Lorda", sheet: "$Npc_Straznik", map: 125, speed: 3,
            plan: [[0, "patrol", ["szlaban", "nabrzeze", "molo_wejscie", "nabrzeze"]], [6, "stand", "szlaban"],
                   [22, "patrol", ["szlaban", "nabrzeze", "molo_wejscie", "nabrzeze"]]],
            barks: {
                stand: ["Stój. Dokąd? ...A, przechodź.", "Na przystani bez awantur, takie prawo."],
                patrol: ["Spokojnie dziś.", "Latarnie się palą, wszystko w porządku."],
                rain: ["Mokro jak w rybim brzuchu."],
                night: ["Kto tam? A, to ty."]
            },
            talk: {
                morning: ["Rano przypływają tylko mewy. Prom później."],
                day: ["Pilnuję szlabanu. Kapral Wit mówi: nikt bez opłaty. Ja mówię: nikt bez powodu."],
                evening: ["Zmiana do zmroku, potem obchód. Nuda, bracie, nuda."],
                night: ["Nocą przystań zamknięta. Teoretycznie."],
                rain: ["W taką pogodę nawet przemytnik siedzi w domu."]
            }
        }
    ];

    // ==================================================================== (2026-10-22) THE NEW TOWN: the eight residents of the new houses
    // of Map008 (docs/miasteczko/NOWE_MIASTO.md, "Nowi mieszkańcy"; fixed ids 2940-2947 of EXTRA_RANGE). Sheets in the hero's style
    // (tools/npc/build_npc.py, npcs.json), talk busts tools/busts/make_<key>.py (registered below). Their places are ONLY the new map's
    // "Miejsce: <key>" events (<house>_drzwi, plac_1..12, plac_studnia, plac_tablica, stragan_1..6, skwer, brama_pd, stajnia_woz,
    // straznica_warta, kaplica_lawka, ciesla_warsztat) - on purpose no coordinates in SPOTS; at home "Miejsce: <key>_wnetrze" in their
    // interiors (Map181-189). Until Map008 has the "Miejsce:" of a resident's door (the old map) the resident is away (when) - nobody
    // stands in the map's corner. The carter's key is "kolodziej" (Szczepan Kołodziej): "woznica" is Wojciech's (above).
    // Barks by the time of day: getters (morning 5-11, day 11-17, evening from 17; rain and night first, as for everyone - TownLife),
    // the raw lists in "zaczepki" (rano / dzien / wieczor / deszcz / noc / dom).
    const hourOf = () => (window.$gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    function byTime(z) {
        const now = () => { const h = hourOf(); return h >= 5 && h < 11 ? z.rano : h >= 11 && h < 17 ? z.dzien : z.wieczor; };
        return { get stand() { return now(); }, get work() { return now(); }, get wander() { return now(); }, get patrol() { return now(); },
                 rain: z.deszcz, night: z.noc, home: z.dom || [] };
    }
    const onNewMap = door => () => !window.$gameMap || $gameMap.mapId() !== 8 || !(window.TownLife && TownLife.spot) || !!TownLife.spot(door);
    const newTown = (r, door, z) => Object.assign(r, { map: 8, when: onNewMap(door), zaczepki: z, barks: byTime(z) });
    const NEW_TOWN = [
        newTown({
            // Szczepan, the carter of the stable with the cart shed: early to the fields beyond the south gate and back twice a day
            // ("inside brama_pd" = out on the road, away), the horses' water his worry
            key: "kolodziej", id: 2940, name: "Szczepan Kołodziej", title: "woźnica", sheet: "$Npc_Kolodziej", speed: 3, away: ["brama_pd"],
            plan: [[0, "inside", "stajnia_drzwi"], [5, "work", "stajnia_woz"], [7, "inside", "brama_pd"], [10.5, "work", "stajnia_woz"],
                   [12, "wander", "plac_studnia"], [13, "stand", "stragan_2"], [14, "inside", "brama_pd"], [17.5, "work", "stajnia_woz"],
                   [19, "wander", "plac_5"], [20.5, "inside", "stajnia_drzwi"]],
            talk: {
                morning: ["Szczepan Kołodziej, woźnica. Wożę wszystko, co się na wóz zmieści: zboże z pól za murem, drewno, kamień, czasem i człowieka.",
                    "Rano jadę na Polną drogę, póki chłodno. W południe koń by mi padł od upału."],
                day: ["Wojciech wozi skrzynie dla kupca z kantoru i dobrze na tym wychodzi. Ja wożę ludziom. Mniej grosza, za to sumienie lekkie.",
                    "Najgorsza w tej suszy jest woda dla koni. Człowiek wytrzyma na dzbanie, koń - nie. Sołtys daje mi wiadro z przydziału, a Siwek wypija dwa.",
                    "Na drogach za murem kręcą się rabusie. Wóz z sianem ich nie kusi, ale wóz z workami - i owszem. Jak chodzisz sam, chodź za dnia."],
                evening: ["Wieczorem obrządzam konie. Siwek ma już swoje lata, jak ja. Obaj kaszlemy od kurzu.",
                    "Mówią, że na kontynencie konie biorą do wojska co do jednego. Tu przynajmniej Siwek ciągnie siano, a nie wóz z rannymi."],
                night: ["Nocą nie jeżdżę. Brama zamknięta, a na drogach ciemno jak w worku."],
                rain: ["Deszcz! Wystawiłem koryto i wszystkie wiadra. Siwek stoi z łbem do góry i łapie krople jak dziecko."]
            }
        }, "stajnia_drzwi", {
            rano: ["Wio, Siwku! Wio, nie śpij!", "Z drogi, chłopcze, koła nie patrzą, kogo przejadą.", "Na Polną drogę i z powrotem, zanim słońce przygrzeje."],
            dzien: ["Kto ma ładunek na wóz? Tanio wiozę, uczciwie!", "Koń pije więcej niż ja, a to już coś znaczy.", "Kurz na drodze taki, że koń kicha jak stary dziad."],
            wieczor: ["Siwek wyprzęgnięty, wóz pod wiatą. Dzień zaliczony.", "Wieczorem nawet kurz się kładzie spać.", "Jeszcze tylko koryto napełnić... z czego, pytam się?"],
            deszcz: ["Deszcz! Siwku, pij, póki leje!", "Błoto po piasty, ale niech leje, niech leje!"],
            noc: ["Ciii... konie śpią.", "Po nocy nie wożę. Na drogach różni się kręcą."],
            dom: ["Uprząż trzeba nasmarować, bo skrzypi jak stara brama.", "Siwek kaszle od kurzu... martwię się o niego.", "Nie stój za koniem, kopnie."]
        }),
        newTown({
            // Agata, the market woman with the basket: her stall on the square, a round with the basket, the notice board's gossip
            key: "przekupka", id: 2941, name: "Agata", title: "przekupka", sheet: "$Npc_Przekupka", speed: 3,
            plan: [[0, "inside", "dom1_drzwi"], [5.5, "wander", "plac_studnia"], [6.5, "work", "stragan_1"], [10, "wander", "plac_3"],
                   [11, "work", "stragan_1"], [13, "wander", "plac_tablica"], [14, "work", "stragan_1"], [17, "wander", "plac_9"],
                   [18.5, "inside", "dom1_drzwi"]],
            talk: {
                morning: ["Agata jestem, przekupka. Jajka, cebula, czosnek, zioła z ogródka. A plotki gratis, do każdego zakupu!",
                    "Kury pić chcą jak ludzie. Każdą kroplę z przydziału dzielę: łyk dla mnie, dwa dla kur. Bez kur nie ma jajek, bez jajek nie ma grosza."],
                day: ["Wiesz, że kapral Wit chodzi do kantoru częściej niż do kaplicy? Ja nic nie mówię. Ja tylko widzę.",
                    "Ceny? Ceny robi susza, nie ja. Za cebulę płacę chłopom z pól więcej niż rok temu, a i tak marnieje w ziemi.",
                    "Prom co trzy dni przywozi obcych z kontynentu. Jedni mówią, że to biedacy, drudzy, że szpiedzy. A ja mówię - jeść muszą jedni i drudzy. Byle płacili."],
                evening: ["Wieczorem w tawernie Melia śpiewa. Ja tam nie chodzę, piwo drogie. Ale pod oknem słychać tak samo.",
                    "Lord Zaleski znowu podniósł targowe. Mówią, że się na coś szykuje. Ja mówię - na nasze grosze się szykuje."],
                night: ["Zamknięte, złociutki. Przekupka też człowiek, też śpi."],
                rain: ["Deszcz! Wystawiłam wszystkie garnki i miskę po zupie. Dziś kury będą piły jak jaśnie pan."]
            }
        }, "dom1_drzwi", {
            rano: ["Jajka! Świeże jajka, cebula, czosnek!", "Kto pierwszy, ten lepszy - jajek mało, kury też pić chcą!", "Przy studni zawsze kolejka... a ja mam pełny kosz plotek!"],
            dzien: ["Cebula słodka jak miód! No, prawie jak miód!", "Taniej nie będzie, złociutki, susza!", "Słyszałeś? Prom znowu przywiózł obcych!"],
            wieczor: ["Kosz pusty, nogi pełne... pora do domu.", "Co zostało, oddam za pół ceny! No, za trzy czwarte.", "Tablica znowu pełna ogłoszeń. Sołtys pisze, ludzie czytają, nikt nie słucha."],
            deszcz: ["Deszcz! Kury się ucieszą!", "Zakryć cebulę, zakryć jajka! A gębę otworzyć!"],
            noc: ["Późno już, złociutki. Jutro przyjdź, jajka będą."],
            dom: ["Jajka liczę... sześć, siedem... kura znowu nie zniosła.", "Siadaj, ale nic nie ruszaj, to na sprzedaż."]
        }),
        newTown({
            // Dorota, the seamstress: sews at home in the morning and after noon (her interior), to the stalls for cloth and thread,
            // the guard's mended tabards to the guardhouse before the evening
            key: "szwaczka", id: 2942, name: "Dorota Igła", title: "szwaczka", sheet: "$Npc_Szwaczka", speed: 3,
            plan: [[0, "inside", "dom3_drzwi"], [9.5, "wander", "stragan_4"], [11, "wander", "plac_2"], [12, "inside", "dom3_drzwi"],
                   [15.5, "wander", "plac_8"], [16.5, "wander", "straznica_warta"], [17.5, "inside", "dom3_drzwi"]],
            talk: {
                morning: ["Dorota Igła. Szyję, ceruję, przerabiam. Z dwóch starych koszul zrobię jedną nową, a z jednej starej - porządną łatę.",
                    "Rano szyję w domu, póki światło dobre. Potem idę na plac po nici i sukno. Jak jakiś kupiec coś przywiezie."],
                day: ["Twoja koszula... wybacz, ale to już nie koszula, to wspomnienie koszuli. Przynieś mi kiedyś grosz, a coś z niej uratuję.",
                    "Straż Lorda Zaleskiego zamawia u mnie kaftany. Czerwone, z czarnym koniem na piersi. Wyszyłam już tyle koni, że śnią mi się po nocach.",
                    "Płótna nie ma czym prać. Wodę z przydziału każdy pije, nie płucze. Toteż w mieście chodzą szarzy, choć wszyscy byli kiedyś biali."],
                evening: ["Wieczorem szyję przy łuczywie. Oczy bolą, ale zamówienia same się nie zrobią.",
                    "Wdowa Halina przyprowadza mi czasem dzieci do przymiarki. Kostek wyrasta ze wszystkiego w miesiąc, a Jagódka dostaje to, co po nim zostanie."],
                night: ["Już nie szyję. Przyjdź jutro, po świcie."],
                rain: ["Deszcz! Wystawię balię i wypiorę wszystko, co mam. Nawet to, co mam na sobie."]
            }
        }, "dom3_drzwi", {
            rano: ["Nici... ciemne nici... gdzie są ciemne nici?", "Sukno z kontynentu znowu droższe. Wojna wszystko podraża.", "Igła, naparstek, nożyce - i do roboty."],
            dzien: ["Hej, ty! Ta koszula prosi się o łatę!", "Dwa łokcie płótna i szpulka nici, na więcej mnie nie stać.", "Czerwone sukno dla straży Lorda... znowu czerwone."],
            wieczor: ["Oczy już nie te... przy łuczywie szyć to męka.", "Kaftany dla straży oddane. Może wreszcie zapłacą.", "Jeszcze dwa guziki i koniec na dziś."],
            deszcz: ["Deszcz! Płótno wreszcie się wypierze!", "Do środka, do środka, sukno zmoknie!"],
            noc: ["Późno już. Igła też musi odpocząć."],
            dom: ["Nie ruszaj tego - to płaszcz dla żony sołtysa.", "Ścieg za ściegiem... jak życie.", "Usiądź, tylko nie na szpilkach."]
        }),
        newTown({
            // Halina, the widow (her husband Michał, Leon's journeyman, fell off the chapel roof last autumn): the water queue at the
            // well morning and evening, the square and the green with her children
            key: "wdowa", id: 2943, name: "Halina", title: "wdowa", sheet: "$Npc_Wdowa", speed: 3,
            plan: [[0, "inside", "dom4_drzwi"], [6, "stand", "plac_studnia"], [7.5, "inside", "dom4_drzwi"], [9, "wander", "plac_6"],
                   [12, "inside", "dom4_drzwi"], [13.5, "wander", "skwer"], [16, "stand", "plac_studnia"], [17, "wander", "plac_6"],
                   [18.5, "inside", "dom4_drzwi"]],
            talk: {
                morning: ["Halina. Wdowa. Rano stoję w kolejce do studni - jedno wiadro na rodzinę, tak kazał sołtys. Na nas troje. Musi wystarczyć.",
                    "Kostek chce iść na żołnierza, jak stary Wacław. Wybij mu to z głowy, jak będziesz mógł. Wojna zabiera, nic nie oddaje."],
                day: ["Mój Michał kładł gont na dachu kaplicy. Ostatniej jesieni spadł. Leon mówi, że belka pękła. Przynosi nam czasem drewno, ale w oczy patrzeć mi nie umie.",
                    "Szyję dla Doroty, piorę dla Agaty, sprzątam u sołtysa. Grosz do grosza. Dzieci muszą jeść.",
                    "Masz dziadka, prawda? Dbaj o niego. Starych trzeba pilnować jak dzieci, tylko że oni się nie dają."],
                evening: ["Wieczorem idę jeszcze raz do studni. Czasem zostaje na dnie choć pół wiadra, jak inni już wezmą.",
                    "Jagódka pyta, kiedy tata wróci z dachu. Nie umiem jej powiedzieć. Ty byś umiał?"],
                night: ["Ciii... dzieci śpią. Przyjdź jutro."],
                rain: ["Deszcz! Wszystkie garnki i miski pod rynnę. Dziś dzieci się umyją, a ja zasnę bez liczenia kropel."]
            }
        }, "dom4_drzwi", {
            rano: ["Kostek, nie pchaj się, kolejka jest kolejka.", "Jedno wiadro na rodzinę... jak z tego ugotować i umyć dzieci?", "Jagódko, trzymaj się spódnicy."],
            dzien: ["Kostek! Nie łaź pod konie!", "Jagódko, nie dotykaj, to nie nasze.", "Dzieci, nie odchodźcie daleko!"],
            wieczor: ["Do domu, dzieci, słońce zachodzi.", "Jeszcze wiadro i do domu...", "Kostek, Jagódka! Kolacja!"],
            deszcz: ["Dzieci, wiadra! Wszystkie garnki na dwór!", "Deszcz... Michał zawsze się cieszył z deszczu."],
            noc: ["Dzieci śpią. Ja też powinnam."],
            dom: ["Cicho, dzieci śpią.", "Garnek pusty... jutro coś wymyślę.", "Siadaj, chłopcze. Nie mam czym poczęstować, ale siadaj."]
        }),
        newTown({
            // Kostek, Halina's son (8): carries water with his mother, plays soldier on the square, listens to Wacław, loves the horses
            key: "kostek", id: 2944, name: "Kostek", title: "syn Haliny", sheet: "$Npc_Kostek", speed: 4,
            plan: [[0, "inside", "dom4_drzwi"], [6.1, "wander", "plac_studnia"], [7.5, "inside", "dom4_drzwi"], [9, "wander", "plac_6"],
                   [10.5, "wander", "plac_1"], [12, "inside", "dom4_drzwi"], [13.5, "wander", "skwer"], [15, "wander", "stajnia_woz"],
                   [16.5, "wander", "plac_6"], [18.5, "inside", "dom4_drzwi"]],
            talk: {
                morning: ["Jestem Kostek! Mam osiem lat i miecz! No, z drewna, ale jak się nim walnie, to boli. Pan Leon mi wystrugał.",
                    "Mama mówi, że wody jest mało i nie wolno chlapać. To ja nie chlapię. Tylko troszkę."],
                day: ["Pan Wacław był na prawdziwej wojnie! Ma bliznę i kulę, i opowiada o rycerzach, co mieli konie w żelazie! Jak urosnę, też pójdę na wojnę!",
                    "Pan Szczepan dał mi potrzymać lejce! Siwek mnie zna, naprawdę! Jak mówię „wio”, to rusza uchem.",
                    "Ty nie masz butów! Ja też nie! Jesteśmy jak żołnierze w marszu, tak mówi pan Wacław."],
                evening: ["Już? Mama woła? Dobra, ale jutro znowu bitwa!",
                    "Tata spadł z dachu. Mama płacze w nocy, jak myśli, że śpię. Ja nie płaczę. Żołnierze nie płaczą."],
                night: ["Zzz... na lewo... patrz... zzz..."],
                rain: ["Deszcz! Kto zrobi większy plusk w kałuży, ten jest generałem! Ja pierwszy!"]
            }
        }, "dom4_drzwi", {
            rano: ["Mamo, ja poniosę wiadro! Ja jestem silny!", "Patrz, jak pije koń! Glu, glu, glu!", "Ja pierwszy w kolejce! ...No dobra, drugi."],
            dzien: ["Baczność! Na lewo patrz! Raz, dwa!", "Ciach! Ciach! Pokonałem smoka!", "Pan Wacław mówi, że miecz trzyma się lekko, jak ptaszka!", "Konie! Mogę pogłaskać? Proszę!"],
            wieczor: ["Jeszcze troszkę, mamo! Jeszcze jedna bitwa!", "Jagódka, ty jesteś wróg! Uciekaj!"],
            deszcz: ["Deszcz! Kałuża jak morze!", "Hop! Hop! Mokry jestem jak ryba!"],
            noc: [],
            dom: ["Mamo, ja nie chcę spać, ja jestem żołnierz!", "Jagódka chrapie... hi, hi."]
        }),
        newTown({
            // Jagódka, Halina's daughter (6): never far from her mother - the well, the square, the green
            key: "jagodka", id: 2945, name: "Jagódka", title: "córka Haliny", sheet: "$Npc_Jagodka", speed: 3,
            plan: [[0, "inside", "dom4_drzwi"], [6.2, "wander", "plac_studnia"], [7.5, "inside", "dom4_drzwi"], [9.1, "wander", "plac_6"],
                   [12, "inside", "dom4_drzwi"], [13.6, "wander", "skwer"], [16.1, "wander", "plac_studnia"], [17.1, "wander", "plac_6"],
                   [18.3, "inside", "dom4_drzwi"]],
            talk: {
                morning: ["Jestem Jagódka. Jak jagódki w lesie, tylko większa. Mam tyle lat! (Pokazuje pięć paluszków, potem namyśla się i dokłada szósty.)",
                    "Mama mówi, że wody nie wolno marnować. Ja piję po troszeczku. Jak ptaszek."],
                day: ["Masz jagódki? Ja nigdy nie jadłam prawdziwych jagódek. Mama mówi, że w lesie rosną, ale las daleko i wilki.",
                    "Kostek ma miecz, a ja mam lalę ze szmatki. Pani Dorota mi uszyła! Ma guziczki zamiast oczu.",
                    "Pan z kulą opowiada straszne bajki. Ale ja się nie boję. Trochę się boję."],
                evening: ["Tata naprawiał dach w kaplicy i spadł. Teraz jest w niebie. A w niebie jest woda?",
                    "Mama mówi, że jak będę grzeczna, to w Kupałę pójdziemy szukać kwiatu paproci."],
                night: ["Zzz..."],
                rain: ["Pada! Pada! Kropelki są zimne i słodkie. Spróbuj!"]
            }
        }, "dom4_drzwi", {
            rano: ["Mamo, ja też niosę! Ten mały garnuszek!", "Kap, kap, kap... studnia płacze?", "Jeszcze jestem śpiąca..."],
            dzien: ["Kostek, poczekaj na mnie!", "Kwiatek! Dla mamy!", "Motylek! Motylku, chodź tu!", "Lala, nie płacz, zaraz pójdziemy do domu."],
            wieczor: ["Mamo, nóżki bolą...", "Kostek mnie goni! Ratunku! Hi, hi!"],
            deszcz: ["Deszcz! Buzia do góry - am!", "Kropelki łaskoczą!"],
            noc: [],
            dom: ["Mama mówi, że tata patrzy z nieba. Ale przez dach nieba nie widać.", "Ciii... lala śpi."]
        }),
        newTown({
            // Leon, the carpenter: his workshop yard, mending the stalls of the square, the chapel's roof (where Michał fell)
            key: "ciesla", id: 2946, name: "Leon Dłuto", title: "cieśla", sheet: "$Npc_Ciesla", speed: 3,
            plan: [[0, "inside", "dom6_drzwi"], [6, "work", "ciesla_warsztat"], [9.5, "wander", "plac_4"], [10.5, "work", "stragan_3"],
                   [12, "inside", "dom6_drzwi"], [13, "work", "ciesla_warsztat"], [16, "wander", "kaplica_lawka"], [17, "work", "ciesla_warsztat"],
                   [18.5, "wander", "plac_10"], [20, "inside", "dom6_drzwi"]],
            talk: {
                morning: ["Leon Dłuto, cieśla. Stawiam dachy, kładę belki, naprawiam wszystko, co z drewna. Rano robię w warsztacie, póki drewno chłodne i nie pęka.",
                    "W tę suszę drewno schnie za szybko. Belka pęka wzdłuż słoja, deska paczy się na słońcu. Jak będziesz coś budował, kładź drewno w cieniu."],
                day: ["Stragany na placu stawiałem wszystkie. Teraz chodzę je łatać. Przekupki tłuką w nie koszami, a dzieci włażą na daszki.",
                    "Zbych Smolarz zza muru wozi mi drewno. Uczciwy człowiek, tylko krzywe pnie mu się trafiają. Jak całe to miasto.",
                    "Hieronim zamawia u mnie trumny. W suszę starzy umierają szybciej. Smutna robota, ale ktoś musi ją zrobić porządnie."],
                evening: ["Michał, mąż Haliny, był moim czeladnikiem. Spadł z dachu kaplicy, bo belka pękła. Moja belka. Noszę im drewno na zimę i nie umiem spojrzeć Halinie w oczy.",
                    "Kaplica ma nowy gont. Położyłem go sam, po Michale. Każdy gwóźdź wbijałem, jakby był ostatni."],
                night: ["Warsztat zamknięty. Przyjdź jutro, o świcie."],
                rain: ["Deszcz to dla cieśli zła pogoda i dobra nowina naraz. Robota stoi, za to drewno pije i przestaje pękać."]
            }
        }, "dom6_drzwi", {
            rano: ["Piła ostra, dłuto ostre, tylko ręce stare.", "Deska krzywa jak ta susza... ech.", "Raz, dwa... trach! Dobrze siadło."],
            dzien: ["Ten stragan trzyma się na słowo honoru. Trzeba podbić.", "Drewno wyschło na wiór, pęka pod dłutem.", "Hej, młody! Podaj no tamten klin!"],
            wieczor: ["Wióry z brody, trociny z uszu... koniec dnia.", "Kaplica jeszcze stoi. Dobrze. Niech stoi.", "Jutro trumna dla Hieronima. Znaczy - dla kogoś, kogo Hieronim pochowa."],
            deszcz: ["Deszcz! Drewno odetchnie, i ja z nim.", "Pod dach z deskami, szybko!"],
            noc: ["Idź spać, chłopcze. Ja też już kończę."],
            dom: ["Siekiera naostrzona, piła naostrzona... a sen nie przychodzi.", "Siadaj na zydlu. Sam go zrobiłem. Nie skrzypi.", "Michał... dobry był chłopak. Dobry."]
        }),
        newTown({
            // Wacław, the old soldier on a crutch: his bench on the square (plac_1) with his stories, the guard at the east gate in the
            // evening (he grumbles at their posture)
            key: "weteran", id: 2947, name: "Wacław Siwy", title: "stary żołnierz", sheet: "$Npc_Weteran", speed: 2,
            plan: [[0, "inside", "dom8_drzwi"], [8, "stand", "plac_1"], [11.5, "wander", "plac_studnia"], [12.5, "inside", "dom8_drzwi"],
                   [14, "stand", "plac_1"], [17, "wander", "straznica_warta"], [18, "stand", "plac_1"], [20.5, "inside", "dom8_drzwi"]],
            talk: {
                morning: ["Wacław Siwy. Służyłem w piechocie królewskiej, czterdzieści lat temu. Pod Czarnym Brodem kopia strzaskała mi kolano, a resztę przyniosłem tutaj.",
                    "Rano siedzę na ławce i patrzę, kto idzie na plac. Stary żołnierz zawsze patrzy. Nawet jak już nie ma czego pilnować."],
                day: ["Ta wojna na kontynencie to nie wojna, chłopcze. Za moich czasów król bił się z królem. Teraz biją się wszyscy ze wszystkimi o coś, czego nikt nie widział. Serce, mówią. Ja tam widziałem tylko błoto i krew.",
                    "Kostek chce iść na żołnierza. Opowiadam mu o wojnie, żeby się bał. A on słucha z otwartą gębą i chce jeszcze. Głupi stary, sam sobie winien.",
                    "Werbownicy z garnizonu nad zatoką kręcą się po wyspie. Jak przyjdą do ciebie z grosikiem i dobrym słowem - uciekaj. Wojsko płaci z góry, a odbiera z odsetkami."],
                evening: ["Wieczorem idę popatrzeć na wartę przy strażnicy. Chłopcy Lorda stoją krzywo jak płot. Ale mówię im to tylko w myślach. O kuli nie ucieknę.",
                    "Ten zamek nad placem... kiedyś była tu prawdziwa załoga. Ojciec mówił, że strzegli czegoś pod skałą. Teraz Borgar strzeże beczek. Też zacna służba."],
                night: ["Nie śpię. Starzy żołnierze śpią na jedno oko. Idź do domu, chłopcze."],
                rain: ["Deszcz! Siadaj obok, przeczekamy razem. Pod Brodem padało trzy dni i trzy noce, a my staliśmy w szyku. Tu przynajmniej jest ławka."]
            }
        }, "dom8_drzwi", {
            rano: ["Wstawać, maruderzy! Słońce już wysoko!", "Kolano boli... będzie deszcz. Albo i nie będzie.", "Ech, dawniej to warta stała prosto."],
            dzien: ["Siadaj, chłopcze, opowiem ci, jak było pod Czarnym Brodem.", "Lewa, prawa, lewa... za moich czasów chodziło się w nogę.", "Kto pamięta starą wojnę? Nikt. A nowa już puka do drzwi."],
            wieczor: ["Wartownicy! Hełm prosto, włócznia prosto, gęba na kłódkę!", "Słońce zachodzi jak wtedy, nad Brodem... czerwono.", "Do domu, staruszku. Kula sama nie zaniesie."],
            deszcz: ["Deszcz! Jak w obozie pod Brodem - tylko błota mniej.", "Kości mówiły, że będzie deszcz. Kości nie kłamią."],
            noc: ["Nocą każdy szelest to wróg. Tak już zostaje na zawsze."],
            dom: ["Medal gdzieś tu był... w skrzyni. Albo przepiłem.", "Siadaj. Wody nie mam, ale opowieść mam."]
        })
    ];
    RESIDENTS.push(...NEW_TOWN);
    // their talk busts (tools/busts/make_<key>.py; SpeechBubbles stands above this plugin and checks the files at the database's load)
    if (window.SpeechBubbles && SpeechBubbles.BUSTS) for (const r of NEW_TOWN) SpeechBubbles.BUSTS[r.sheet + ":0"] = r.sheet.slice(5) + "_Bust";

    // ==================================================================== (2026-10-22) NOWE PODGRODZIE: the four residents of the new
    // houses of Map111 (docs/podgrodzie/NOWE_PODGRODZIE.md, "Nowi mieszkańcy"; fixed ids 2950-2953 of the third range, EXTRA_RANGES
    // below - 2900-2949 is given out). Sheets in the hero's style (tools/npc/build_npc.py, npcs.json), talk busts
    // tools/busts/make_<key>.py (registered below). Their places are ONLY the new map's "Miejsce: <key>" events (szynk_drzwi,
    // przytulek_drzwi, garncarnia_drzwi, lepianka1_drzwi, placyk_1..6, szynk_lawy, przytulek_kociol, garncarnia_lawy, glinianka, wybieg
    // and the moved old ones brama_zach, namioty, ziola, zebrak, zabawa); at home "Miejsce: <key>_wnetrze" in their interiors
    // (Map201-204). Until Map111 has the "Miejsce:" of a resident's door (the old map) the resident is away (when), as THE NEW TOWN's.
    // Barks by the time of day (byTime above; the raw lists in "zaczepki"). No new quests: talk and barks only.
    const onNewPodgrodzie = door => () => !window.$gameMap || $gameMap.mapId() !== 111 || !(window.TownLife && TownLife.spot) || !!TownLife.spot(door);
    const newPodgrodzie = (r, door, z) => Object.assign(r, { map: 111, when: onNewPodgrodzie(door), zaczepki: z, barks: byTime(z) });
    const NEW_PODGRODZIE = [
        newPodgrodzie({
            // Mietek, the keeper of the poor man's szynk: kvass of stale bread crusts, thin beer, the benches before the door till late;
            // in the afternoon to the town for Hanka's unsold bread ("inside brama_zach" = gone to the town, away)
            key: "szynkarz", id: 2950, name: "Mietek Kwaśniak", title: "szynkarz", sheet: "$Npc_Szynkarz", speed: 3, away: ["brama_zach"],
            plan: [[0, "inside", "szynk_drzwi"], [7.5, "work", "szynk_lawy"], [10, "inside", "szynk_drzwi"], [11.5, "wander", "placyk_1"],
                   [12.5, "work", "szynk_lawy"], [14, "inside", "brama_zach"], [16, "work", "szynk_lawy"], [23, "inside", "szynk_drzwi"]],
            talk: {
                morning: ["Mietek Kwaśniak, do usług. Szynk mam, nie karczmę - karczma jest na wzgórzu, u Borgara. U Borgara kufel po trzy grosze, u mnie kubek po jednym. I smakuje akurat na jeden.",
                    "Rano warzę kwas. Z czego? Ze skórek chleba, których Hanka z piekarni nie sprzeda, z garści jęczmienia i z wody... której nie ma. Dlatego taki kwaśny."],
                day: ["Do szynku przychodzą ci od gliny, drwale, ludzie z promu. Płacą miedziakiem, guzikiem, czasem obietnicą. Obietnic mam już pełną beczkę.",
                    "Po południu chodzę do miasta po suchy chleb na kwas. Strażnik przy bramie za każdym razem zagląda do worka. Chleb, panie władzo. Stary chleb. A on i tak grzebie.",
                    "Ludzie Lorda, co kopią przy skałach, zaglądają tu czasem nocą. Piją dużo, mówią mało. Raz jeden się upił i gadał, że oni tam wcale nie kamienia szukają. Następnego dnia już go nie przysłali."],
                evening: ["Wieczorem szynk ożywa. Darin opowiada o wojnie, Zbych pije na krechę, a Rysiek płaci zającem, o którego nikt nie pyta.",
                    "Grosz, który tu zostawisz, nie pójdzie do Lorda. To już coś. Siadaj, kwasu naleję. Na krechę też można - ale krótką."],
                night: ["Szynk zamknięty... no, prawie zamknięty. Kubek kwasu się znajdzie, tylko cicho - kapral Wit nie lubi, jak biedota pije po nocy."],
                rain: ["Deszcz! Beczki pod rynnę, wszystkie! Dziś kwas będzie z prawdziwej wody, a nie z modlitwy."]
            }
        }, "szynk_drzwi", {
            rano: ["Kwas świeży, prosto z beczki! No, prawie świeży.", "Ławy wytarte, beczka wytoczona. Można żyć.", "Kubek kwasu na dzień dobry? Grosz, nie więcej!"],
            dzien: ["Siadaj, spocznij! Pod daszkiem jeszcze chłodno.", "Kwas po groszu, cienkusz po dwa! Kto pije?", "U Borgara drożej, u mnie bliżej!"],
            wieczor: ["Wieczór, ludzie! Szynk otwarty do późna!", "Kto ma grosz, niech siada. Kto nie ma - niech siada ciszej.", "Zbych, znowu na krechę? Ech... siadaj."],
            deszcz: ["Deszcz! Beczki pod rynnę!", "Leje! Kwas z deszczówki - jak u króla!"],
            noc: ["Ciszej, ciszej... kapral nie śpi.", "Ostatni kubek i do domu, chłopcze."],
            dom: ["Kwas musi postać trzy dni. Nie ruszaj beczki.", "Krecha Zbycha, krecha Ryśka, krecha Józka... sama krecha, grosza nie widać.", "Siadaj, jest jeszcze ława. Kulawa, ale jest."]
        }),
        newPodgrodzie({
            // Stefa, the keeper of the poorhouse: the cauldron before the door morning, noon and evening, the poorhouse's water ration from
            // the town's well ("inside brama_zach" = away), the tents of the ferry people, herbs from babka Jadwiga, a bowl for old Gaweł
            key: "opiekunka", id: 2951, name: "Ciotka Stefa", title: "opiekunka przytułku", sheet: "$Npc_Opiekunka", speed: 3, away: ["brama_zach"],
            plan: [[0, "inside", "przytulek_drzwi"], [5.5, "work", "przytulek_kociol"], [7.5, "inside", "brama_zach"], [9, "work", "przytulek_kociol"],
                   [12, "wander", "namioty"], [13, "wander", "ziola"], [14, "inside", "przytulek_drzwi"], [16, "work", "przytulek_kociol"],
                   [18.5, "wander", "zebrak"], [19.5, "inside", "przytulek_drzwi"]],
            talk: {
                morning: ["Stefania, ale wszyscy mówią: ciotka Stefa. Prowadzę przytułek. Kto chory, stary albo nie ma dachu - dostaje u mnie siennik i miskę. Siennik twardy, miska płytka, ale są.",
                    "O świcie rozpalam pod kotłem. Kasza, pokrzywa, czasem kość od rzeźnika z miasta. Jak gotujesz dla dwudziestu z garści, to się uczysz liczyć ziarnka."],
                day: ["Sołtys liczy mi wodę jak jednej rodzinie: wiadro na dzień. A pod dachem mam dwadzieścia gąb, gorączkę i dwoje niemowląt. Noszę, ile udźwignę, a resztę wymadlam.",
                    "Ludzie z promu przypływają chorzy: kaszel, rany, głód. Babka Jadwiga daje mi zioła, Darin pomaga nosić. Lord przysłał nam kiedyś jeden kocioł i dużo obietnic. Kocioł się przydał.",
                    "Masz dziadka? To go pilnuj. Połowa moich starych ma dzieci w mieście. Tylko że dzieci w mieście mają ważniejsze sprawy."],
                evening: ["Wieczorem nalewam zupę każdemu, kto przyjdzie z miską. Nikogo nie pytam, skąd jest. Głód nie ma ojczyzny.",
                    "Zanoszę miskę staremu Gawłowi. Do przytułku nie przyjdzie, uparty. Mówi, że pod murem śpi się jak za młodu na warcie."],
                night: ["Ciii... chorzy śpią. Jak cię coś boli, wejdź. Jak nie - idź spać, póki możesz."],
                rain: ["Deszcz! Kocioł pod niebo, beczki, miski, wszystko! Dziś zupa będzie gęsta, a dzieci umyte."]
            }
        }, "przytulek_drzwi", {
            rano: ["Kasza się gotuje! Kto głodny - z miską!", "Ostrożnie, gorące! Dzieci, odsuńcie się od kotła.", "Jeszcze garść pokrzywy... i będzie zupa."],
            dzien: ["Kto chory, niech przyjdzie. Kto zdrowy - niech pomoże nosić.", "Wiadro z miasta, wiadro na dwudziestu... Panie, daj siły.", "Masz może garść kaszy? Nie dla mnie, dla dzieci."],
            wieczor: ["Zupa! Kto ma miskę, niech podchodzi!", "Po kolei, po kolei, dla każdego starczy... może.", "Gaweł, uparciuchu, zjedz chociaż ciepłe."],
            deszcz: ["Deszcz! Kocioł pod niebo!", "Dzieci, łapcie wodę, w co się da!"],
            noc: ["Ciszej, chorzy śpią."],
            dom: ["Cii... ten mały ma gorączkę.", "Wolny siennik został jeden. I ten mokry.", "Pij powoli, po łyczku. Woda droższa niż chleb."]
        }),
        newPodgrodzie({
            // Wit, the potter: clay dug in the pit beyond the palisade at dawn, the pots drying on the benches before the workshop, the
            // wheel indoors, selling on the little square in the afternoon, the kiln in the evening, a mug at Mietek's (the QuestBoard's
            // "Wit, garncarz" - QuestBoard_Data GIVERS.wit - is the same man)
            key: "garncarz", id: 2952, name: "Wit Zduń", title: "garncarz", sheet: "$Npc_Garncarz", speed: 3,
            plan: [[0, "inside", "garncarnia_drzwi"], [5, "work", "glinianka"], [8, "work", "garncarnia_lawy"], [10, "inside", "garncarnia_drzwi"],
                   [13, "work", "placyk_3"], [16, "work", "garncarnia_lawy"], [19, "wander", "szynk_lawy"], [21, "inside", "garncarnia_drzwi"]],
            talk: {
                morning: ["Wit Zduń, garncarz. Wit, jak kapral - tylko że ja ludziom lepię garnki, a on guzy. Moje przynajmniej się przydają.",
                    "Rano kopię glinę w gliniance za palisadą, póki chłodno. W tę suszę glina twarda jak cegła, zanim jeszcze trafi do pieca. Trzeba ją moczyć, a czym? Śliną?"],
                day: ["W suszę garnek to skarb. Każdy chce dzban na wodę, której nie ma, i miskę na zupę od ciotki Stefy. Sprzedaję po groszu albo za garść kaszy. Bogaty nie będę, ale garnki idą.",
                    "Matka Tośki ugniata mi glinę, a ojciec dziewczyny kopie u Lorda przy skałach. Przyniósł mi stamtąd skorupy - stare, z jakimś znakiem. Takich tu nikt nie lepi od stu lat.",
                    "Znajdziesz po deszczu mokrą glinę przy kałuży - ulep sobie garnek i wysusz w cieniu. Krzywy będzie, ale twój. Mój pierwszy też był krzywy."],
                evening: ["Wieczorem palę w piecu. Drewno od Zbycha, ogień do nocy. Jak garnek pęknie w ogniu, słychać - jak strzał. Trzy strzały na wieczór to zły wieczór.",
                    "Potem kubek kwasu u Mietka. Mówię mu, że jego kwas jest kwaśniejszy niż moja glina. Śmieje się. Nalewa. Takie życie."],
                night: ["Piec stygnie, ja też. Przyjdź jutro, za dnia."],
                rain: ["Deszcz! Glinę do koryt, niech pije! Dziś ulepię tyle, co przez cały tydzień."]
            }
        }, "garncarnia_drzwi", {
            rano: ["Hop! ...Twarda jak kamień, ta glina.", "Kto kopie glinę o świcie, ten ma garnki o zmierzchu.", "Uważaj, dół głęboki! Wpadniesz - wylepię z ciebie dzban."],
            dzien: ["Garnki! Dzbany! Miski! Po groszu albo za garść kaszy!", "Dzban na wodę, której nie ma - najlepszy towar w suszy!", "Ten krzywy? Taniej. Krzywy też trzyma wodę."],
            wieczor: ["Piec dyszy, garnki się pieką... oby żaden nie strzelił.", "Mietek, kubek kwasu dla garncarza!", "Dzień zaliczony. Dwa garnki pękły, osiem całych."],
            deszcz: ["Deszcz! Glina pije!", "Koryta pod rynnę! Dziś lepimy!"],
            noc: ["Piec stygnie. Idź spać, chłopcze."],
            dom: ["Koło się kręci, glina się kręci, świat się kręci...", "Nie dotykaj, mokre! Zostawisz palec na wieki.", "Ten dzbanek dla ciotki Stefy. Za darmo. Nie mów nikomu."]
        }),
        newPodgrodzie({
            // Tośka (7), the girl of the first mud hut: the hens and goats of the run in the morning, then with Franek (the play place,
            // the town gate, the play place again - his plan's hours), by her mother at the pottery, the noon soup at ciotka Stefa's
            key: "dziecko", id: 2953, name: "Tośka", title: "dziecko z lepianki", sheet: "$Npc_Dziecko", speed: 4,
            plan: [[0, "inside", "lepianka1_drzwi"], [6.5, "wander", "wybieg"], [8, "wander", "zabawa"], [10, "wander", "garncarnia_lawy"],
                   [11, "wander", "przytulek_kociol"], [12, "wander", "placyk_5"], [14, "wander", "brama_zach"], [16, "wander", "zabawa"],
                   [18.5, "inside", "lepianka1_drzwi"]],
            talk: {
                morning: ["Jestem Tośka. Z lepianki, tej pierwszej. Mam siedem lat i brata, co ciągle ryczy. Ja nie ryczę.",
                    "Rano sypię kurom ziarno. Znaczy, nie ziarno, bo ziarna nie ma - plewy. Kury też ich nie lubią."],
                day: ["Mama ugniata glinę u pana Wita. Ma potem szare ręce aż po łokcie, jak w rękawiczkach. Ja też chcę takie rękawiczki!",
                    "Tata kopie u Lorda przy skałach. Wraca raz na tydzień, brudny, i nic nie mówi. Mama mówi, żeby nie pytać. To nie pytam. Ale ty możesz zapytać.",
                    "Ciotka Stefa daje w południe zupę. Jak się ładnie podziękuje, to nalewa z dna, gdzie gęsto!"],
                evening: ["Franek mówi, że jak dorośniemy, pójdziemy razem do miasta i będziemy bogaci. Ja będę piekła chleb, a on będzie kowalem. I będziemy pili wodę, ile się chce.",
                    "Za murem, w mieście, dzieci mają buty. Widziałam przez bramę. Po co komu buty? Boso szybciej się biega."],
                night: ["Zzz... kura... uciekła... zzz..."],
                rain: ["Deszcz! Deszcz! Franek, chodź, łapiemy do garnka! Pan Wit da nam największy!"]
            }
        }, "lepianka1_drzwi", {
            rano: ["Cip, cip, cip! Kurki, chodźcie!", "Ta koza znowu mnie goni!", "Franek! Franek, poczekaj na mnie!"],
            dzien: ["Berek! Ty gonisz!", "Patrz, ulepiłam ludzika z gliny!", "Masz coś do jedzenia? Tylko pytam.", "Franek mówi, że ty walczyłeś z wilkiem. Naprawdę?"],
            wieczor: ["Jeszcze troszkę! Mama jeszcze nie woła!", "Franek, kto pierwszy do bramy!"],
            deszcz: ["Deszcz! Kałuża jak jezioro!", "Pada! Język na wierzch!"],
            noc: [],
            dom: ["Mama, a kiedy tata wróci?", "Ciii... brat śpi. Nareszcie."]
        })
    ];
    RESIDENTS.push(...NEW_PODGRODZIE);
    if (window.SpeechBubbles && SpeechBubbles.BUSTS) for (const r of NEW_PODGRODZIE) SpeechBubbles.BUSTS[r.sheet + ":0"] = r.sheet.slice(5) + "_Bust";

    // the spots of the other maps residents live on ("map" in their data): defaults only - the map's "Miejsce: <key>" events win
    // (Map024: the guard's day post beside the left fire basket of the forecourt; his night round straz_1..4 - the map's "Miejsce:"
    // markers win; 2026-10-12: the user's rebuilt garden has no straz_4 any more - the defaults keep the round: the orangery's corner,
    // the middle path, the south path, back by the orangery's terrace)
    // (Map023 Skraj lasu: Rysiek's night place by his snares, in the small clearing by the stones - 2026-10-17)
    const SPOTS_BY_MAP = { 111: {}, 125: { tawerna: [53, 19, 6] }, 23: { klusownik_las: [20, 23, 4] }, 24: { straz_dzien: [15, 16, 2], straz_1: [10, 19, 6], straz_2: [19, 19, 2], straz_3: [19, 28, 4], straz_4: [10, 28, 8] } };

    // (2026-10-21) EXTRA_RANGE: the second range of ids for TownLifeExtra (the new terrain's packages, docs/rozszerzenia/PLAN.md)
    // (2026-10-22) EXTRA_RANGES: every range past 910-949 - the second one and the new Podgrodzie's third (TawernaCore's registry)
    window.TownLifeData = { MAP: 8, FIRST_ID: 910, EXTRA_RANGE: [2900, 2949], EXTRA_RANGES: [[2900, 2949], [2950, 2959]], SPOTS, SPOTS_BY_MAP, RESIDENTS };
})();
