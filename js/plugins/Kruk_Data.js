//=============================================================================
// Kruk_Data.js
//=============================================================================
// PAKIET B (docs/miejsca_wyspy/PAKIETY.md) - the data of "Urwisko Kruków" (Map157) and the tame raven (concept approved by the user
// 2026-10-16: docs/miejsca_wyspy/KONCEPCJA.md section 4; the user's choices: the player names the raven, letters only about the
// island, the perch stands on the field). Only data and texts - the engine is Kruk.js.
//   - window.TownQuestsPacks: K51 "Kruk z masztu" (Roch at the harbour; the raven on the cutter's mast at dawn leads the hero over the
//     hermitage to the ravenry), D24 "Oswojony kruk" (three feedings in the ravenry, the ring with the scroll = chronicle card 6,
//     grandpa's "long story", the perch on the field), the residents' remarks once the raven is tame
//   - window.KrukData: the raven's sheet, the food, the letters (to whom, the answers), the foreign letters it brings, the trinkets,
//     the scouting, the texts
// Stands under Wyspa_Data and above TownLife / TownQuests_Data (its fixed place in js/plugins.js - package 0).
// DROUGHT (the user's rule): nothing here gives the hero water.

/*:
 * @target MZ
 * @plugindesc [pakiet B] Dane: Urwisko Kruków (mapa 157) i oswojony kruk: K51, D24, listy, cudze listy, błyskotki, zwiad. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 *
 * @help
 * Pakiet B - dane miejsca (silnik: Kruk.js).
 * Zadania: K51 „Kruk z masztu” (od Rocha na przystani), D24 „Oswojony kruk”
 * (zaczyna się samo po K51). Znaczniki rynien dla K53 stoją na mapie 157.
 * Numery zdarzeń 610-629. Test: tests/kruk_test.js (port 9502).
 */

(() => {
    "use strict";

    const MAP = 157, HARBOUR = 125, HERMITAGE = 155, FIELD = 3;
    const ITEM = { ring: 179, pendant: 172, nails: 88, feathers: 146, rope: 93, iron: 86, stone: 64 };
    const RAVEN_ICON = 437;     // (the pendant's raven - the raven's menus)
    const RING_ICON = 440;      // (the ring with the raven, item 179 - its own icon in IconSet since the integration 2026-10-16: the quests' icon)

    // ------------------------------------------------------------------ the sheet (img/system/Kruk.png, tools/kruk/art/build_sheet.py)
    // cells 48 x 48, the raven faces right (left: mirrored), the feet of the ground frames on row 44 (anchor 45/48)
    const SHEET = {
        file: "Kruk", cell: 48, feet: 45, height: 30,
        stand: [0, 0], caw: [0, [1, 2, 3, 4, 5, 6, 7, 8]], peck: [1, [0, 1, 2, 3, 4, 5, 6, 7, 8]],
        takeoff: [2, [0, 1, 2, 3, 4, 5, 6]], fly: [3, [0, 1, 2, 3, 4, 5, 6, 7]], glide: [3, 2],
        letterStand: [4, 0], letterFly: [4, [1, 2, 3, 4, 5, 6, 7, 8]], sleep: [6, [1, 2, 3, 4]],
        // the perches: the field's (Farm_Grzeda.png 56 x 100) and the Order's old ones in the ravenry (Kruk_Grzeda_Stara.png 55 x 65):
        // px from the picture's foot to the top of the bar the raven stands on
        perchZ: { grzeda: 65, stara: 63 }, oldPerch: "Kruk_Grzeda_Stara"
    };

    // ------------------------------------------------------------------ the raven's life
    const RAVEN = {
        defaultName: "Kruk",
        names: ["Węgielek", "Smoluch", "Sadza", "Czarnuch", "Kracz", "Pióro", "Atrament", "Mrok", "Hugin", "Kruczek", "Bies", "Wieszczek"],
        feedNeed: 3,                         // taming: three feedings, each on another day
        feedHours: [6, 20],                  // the young raven takes food by day
        wildMast: [5, 7],                    // at dawn the wild raven sits on the cutter's mast at the harbour (KONCEPCJA 4)
        sleep: [21, 5],                      // asleep on the perch
        drain: { food: 1.0, water: 1.4 },    // an hour (a day without food: about 24 down)
        hungryLeave: 3,                      // days at 0 food: it flies back to the Urwisko (fed there once: back again)
        trayFood: 45, bowlWater: 60, bowlMax: 3,
        guardRadius: 5,                      // "Pilnuj pola": the crops round the perch (Chebyshev), like a big scarecrow
        letterHours: [1, 2],                 // a letter: back with the answer after 1-2 game hours
        scoutHours: 1.5,
        warnRange: 9, warnGap: 60 * 90,      // wolves / boars / bears near the hero: a warning caw, at most every 90 s
        runScare: 6                          // the young raven: the hero running within this many tiles - it flies off for an hour
    };

    // ------------------------------------------------------------------ letters: to whom on the island (never over the sea)
    // key: TownLife's resident ("grandpa" - Story's), need: when he is "known" (a TownQuests flag or a ready place), replies: the
    // answer the raven brings back (a bubble over it and a popup)
    const LETTERS = [
        { key: "grandpa", name: "Dziadek Stach", replies: ["Dziadek: „Dostałem. Kruk zjadł mi pół chleba. Dobry ptak, tylko bezczelny.”",
            "Dziadek: „Na działce spokojnie. Kapusta rośnie. Ty uważaj na siebie, wnuku.”", "Dziadek: „Mój dziad mówił, że kruk z listem wraca szybciej niż bez. Prawda.”"] },
        { key: "janek", name: "Janek (przystań)", flag: "janekMet", replies: ["Janek: „Kruk usiadł mi na łodzi i nie chciał zejść, póki nie dałem mu śledzia. Pozdrów dziadka.”",
            "Janek: „Morze czerwone. Ryby uciekają w głąb. Przyjdź, to coś odłożę.”"] },
        { key: "przemytnik", name: "Roch (przystań)", flag: "rochMet", replies: ["Roch: „Nie pisz do mnie listów. Listy się czyta. ...Ale ptak ładny.”",
            "Roch: „Mówiłem: patrzył na ciebie, nie na mnie. Kiedyś ci powiem, co jeszcze widział tamtej nocy.”"] },
        { key: "pustelnik", name: "Brat Kleofas (pustelnia)", flag: "pustelnikMet", replies: ["Kleofas: „List posłańca. Pierwszy od trzystu lat. Zapisałem datę.”",
            "Kleofas: „Kruki z Urwiska przylatywały co rano. Ten też przyleciał. Kronika się zgadza.”"] },
        { key: "latarnik", name: "Bazyli (latarnia)", ready: 159, replies: ["Bazyli: „Widziałem go we mgle, zanim przyleciał. Zapisałem.”",
            "Bazyli: „Kruk przy ogniu siedzi spokojnie. Ludzie nie potrafią.”"] },
        { key: "dzwonnik", name: "Ambroży (dzwonnica)", replies: ["Ambroży: „Kruk na dzwonnicy! Mój mistrz by się popłakał. Siedem pozdrowień. Siedem.”",
            "Ambroży: „Nie bij w dzwon bez potrzeby - napisał mi na marginesie twój kruk. Żartuję. Ale wygląda, jakby umiał.”"] },
        { key: "kowal", name: "Tadek (kuźnia)", replies: ["Tadek: „Ptak usiadł na kowadle. Gorącym. Teraz wie.”", "Tadek: „Dostałem. Jak będziesz w mieście, wpadnij - podkuję ci co trzeba.”"] },
        { key: "piekarka", name: "Hanka (piekarnia)", replies: ["Hanka: „Twój kruk ukradł mi bułkę i zostawił list. Uczciwa wymiana.”", "Hanka: „Pozdrowienia! Przynieś mi kiedyś miodu z pustelni.”"] },
        { key: "znachorka", name: "Babka Jadwiga", replies: ["Jadwiga: „Kruk to mądry ptak. Mądrzejszy od połowy miasteczka. Pij wywar z krwawnika.”"] },
        { key: "soltys", name: "Sołtys Bronisław", replies: ["Sołtys: „Pismo przyjąłem. Podatku od ptaków na razie nie ma. Na razie.”"] }
    ];
    // the one the raven will not take (W10 stays open: over the sea, the red water)
    const MOTHER = { name: "Matka (za morzem)", why: "Kruk nie poleci przez morze. Za daleko - i za dużo czerwonej wody pod skrzydłami." };

    // ------------------------------------------------------------------ the foreign letters (KONCEPCJA 4 "Błyskotka": 20%) - light
    // secrets: read (a note), give back to the owner (Opinion +1, he trusts the hero), or sell to Baltazar (G). Each once a game.
    const FOREIGN = [
        { id: "tadek", name: "Liścik Tadka do Hanki", owner: "kowal", ownerName: "Tadek", sell: 4,
            text: "„Hanko. Jak skończysz piec w sobotę, przyjdź pod kuźnię. Mam dla ciebie podkowę na szczęście. Wykułem ją sam, nie śmiej się. T.”",
            back: ["(Tadek czerwienieje po same uszy.) To... skąd to masz? Kruk? Ten twój kruk?!", "Nie czytałeś, prawda? ...Dobra. Dzięki. Nikomu ani słowa."],
            backRead: ["(Tadek patrzy na złamaną pieczęć, potem na ciebie.) Czytałeś. ...Trudno. Dzięki, że oddałeś."] },
        { id: "wit", name: "Weksel kaprala Wita", owner: "kapral", ownerName: "kapral Wit", sell: 6,
            text: "„Ja, Wit Czerwień, kapral straży, winien jestem Lucjanowi Kości trzydzieści groszy za kości. Oddam po żołdzie. Podpisano.”",
            back: ["(Wit wyrywa ci kartkę.) Ani słowa. Słyszysz? ...Dobry chłopak. Zapamiętam."],
            backRead: ["(Wit mruży oczy.) Przeczytałeś. To teraz zapomnij. Dla własnego dobra."] },
        { id: "baltazar", name: "Kwit z kantoru", owner: "kupiec", ownerName: "Baltazar", sell: 0,
            text: "„Dwanaście worków jęczmienia od K. Zapłacono czterdzieści groszy. Odbiór nocą, tylne drzwi. Nie wpisywać.”",
            back: ["(Baltazar uśmiecha się samymi ustami.) Ach, mój kwit. Wiatr porywa papiery, a kruki... kruki je znajdują.", "Przyjacielu. Za uczciwość - pięć groszy. Za pamięć krótką jak ptasia - jeszcze pięć."],
            backRead: ["(Baltazar długo patrzy ci w oczy.) Czytałeś. Rozumiem. Każdy coś czyta. Ważne, co potem mówi."], backGold: 10 },
        { id: "zosia", name: "Rysunek Zosi", owner: "zosia", ownerName: "Zosia", sell: 1,
            text: "(Na karcie węglem: tawerna na wzgórzu, nad nią wielki czarny ptak, a pod spodem krzywe litery: „DLA BABCI. TO JEST KRUK. ON PILNUJE”.)",
            back: ["Mój rysunek! Wiatr mi go wyrwał na murach! (Zosia przytula kartkę.) Kruk go przyniósł? Prawdziwy kruk?!"],
            backRead: ["Mój rysunek! Ładny, prawda? To jest kruk. On pilnuje."] },
        { id: "janek", name: "Kartka z długami Janka", owner: "janek", ownerName: "Janek", sell: 2,
            text: "„Sieć od Rocha - oddać trzy śledzie. Smoła od celnika - oddać dwa grosze, jak będą. Chleb od Hanki - oddać rybą. Mama - oddać wszystko.”",
            back: ["(Janek drapie się po karku.) Moja kartka. Długi liczę. Dzięki, chłopcze."],
            backRead: ["(Janek uśmiecha się krzywo.) No, teraz wiesz, ile winien jest rybak. Nic dziwnego."] },
        { id: "jadwiga", name: "Receptura babki Jadwigi", owner: "znachorka", ownerName: "babka Jadwiga", sell: 5,
            text: "„Na gorączkę: krwawnik, czosnek, łyżka miodu, gotować do połowy. Na złe sny - nic nie pomaga. Ambrożemu nie mówić, bo zaraz będzie dzwonił.”",
            back: ["(Jadwiga chowa kartkę w fartuch.) Moja. Dziękuję, dziecko. Kruk wie, gdzie co leży. Jak dobra znachorka."],
            backRead: ["Czytałeś? To przynajmniej zapamiętaj: krwawnik, czosnek, miód. Kiedyś ci się przyda."] },
        { id: "ambrozy", name: "Kartka Ambrożego", owner: "dzwonnik", ownerName: "Ambroży", sell: 3,
            text: "„Siedem. Cztery i dwa. Raz. Nie mylić z pogrzebowym. Nie mylić z pożarem. Nie mylić z kolacją.”",
            back: ["Moja ściąga! (Ambroży czerwienieje.) Pamiętam wszystko, rzecz jasna. To... na wszelki wypadek. Dziękuję."],
            backRead: ["(Ambroży wzdycha.) Tak, tak. Dzwonnik z ściągą. Śmiej się. Ale nie mów nikomu."] },
        { id: "soltys", name: "Brudnopis sołtysa", owner: "soltys", ownerName: "sołtys", sell: 5,
            text: "„Jaśnie Panie. Podatek z Podgrodzia będzie... (skreślone) ...po żniwach. (skreślone) ...kiedyś. Z wyrazami. (skreślone)”",
            back: ["(Sołtys chowa kartkę za plecy.) Brudnopis! Wiatr porwał. Pismo urzędowe, nie dla oczu. Dziękuję obywatelsko."],
            backRead: ["(Sołtys wzdycha.) Wszyscy kiedyś piszą do Lorda trzy razy. Ja piszę trzydzieści."] }
    ];
    // what lies on the perch some mornings (KONCEPCJA 4): coins 40%, a lost thing 30%, a foreign letter 20%, nothing 10%
    const TRINKET = {
        chance: { coins: 0.4, thing: 0.3, letter: 0.2 }, coins: [1, 5],
        things: [[ITEM.nails, 2, "Kruk przyniósł gwoździe. Pewnie z kuźni."], [ITEM.feathers, 2, "Na grzędzie leżą czyjeś pióra. Kruk się nimi chwali."],
            [ITEM.rope, 1, "Kawałek liny. Ktoś na przystani będzie jej szukał."], [ITEM.iron, 1, "Zardzewiała podkowa. Kruk przytaszczył ją z daleka."]]
    };

    // ------------------------------------------------------------------ the texts
    const TX = {
        // the ravenry, the young raven
        ravenryLook: "Ruina baszty. Na starych żerdziach zakonu siedzą kruki. Jeden młody, z mosiężną obrączką na nóżce, patrzy prosto na ciebie.",
        ravenryEmpty: "Ruina baszty, stare żerdzie zakonu. Kruka z obrączką teraz tu nie ma.",
        ravenryNight: "Kruki śpią na żerdziach, łby pod skrzydłami. Nie budź ich.",
        towerLook: "Baszta z gniazdami. Dziesiątki kruków kracze na murach. Zapach jak z kurnika, tylko gorzej.",
        nestLook: "Gniazdo kruków z patyków i kości. Puste - młode już latają.",
        stoneLook: ["Spod gruzu wystaje ciosany kamień. Wykuty na nim kruk z rozłożonymi skrzydłami - taki sam jak na twoim wisiorku.",
            "Kamień z krukiem, wmurowany w gruz. Ktoś niedawno próbował go wyrwać - świeże ślady łopaty.",
            "Kamień z krukiem w gruzie. Za ciężki, żeby go ruszyć. Ziemia wokół rozkopana."],
        stoneNote: ["Kamienie z krukiem na Urwisku", "W gruzie dawnych murów na Urwisku leżą ciosane kamienie z wykutym krukiem - takim samym jak na moim wisiorku. Ktoś próbował je wyrywać. Świeże ślady łopaty."],
        grate: "Łukowe przejście w skale, zamknięte żelazną kratą z krukiem. Od środka zasuwa. Ani drgnie.",
        grateWet: "Krata z krukiem. Za nią, w ciemności, szumi woda - spływa po deszczu z rynien zakonu.",
        edgeEast: "Ścieżka biegnie dalej na wschód, ale osunęło się zbocze. Na razie nie przejdziesz.",
        edgeSlope: "Ścieżka schodzi pod mury miasteczka. Furta w murze zamurowana od lat.",
        feedNoMeat: "Potrzebujesz mięsa albo ryby",
        feedDone: "Kruk już dziś jadł - przyjdź jutro",
        feedNight: "Kruki śpią - przyjdź za dnia",
        feedDog: "Kruk nie zejdzie, póki pies jest przy tobie. Zostaw psa w domu",
        feedRun: "Kruk się spłoszył. Nie biegaj przy nim",
        feedGone: "Młodego kruka teraz tu nie ma",
        feedOk: ["Kruk zeskakuje z żerdzi, łapie mięso i odskakuje. Patrzy na ciebie bokiem. (karmienie {n}/{need})",
            "Kruk podchodzi bliżej niż wczoraj. Bierze mięso prawie z ręki. (karmienie {n}/{need})"],
        tamed: ["(Kruk zjada do końca, otrząsa się - i jednym skokiem siada ci na ramieniu. Pazury przez koszulę. Ciężki.)",
            "(Na nóżce ma starą mosiężną obrączkę z wybitym krukiem. W obrączce tkwi ciasno zwinięty zwitek.)",
            "(Kruk wyciąga nóżkę, jakby czekał. Zdejmujesz obrączkę razem ze zwitkiem.)"],
        tamedPop: "{imie} siada ci na ramieniu",
        named: "Kruk ma imię: {imie}",
        ringSub: "Zwitek w obrączce to karta pisana szyfrem. Brat Kleofas umie ją przeczytać.",
        // the tame raven
        menuTitle: "Kruk: {imie}",
        pet: "{imie} stroszy pióra i dziobie cię w palec ♥",
        follow: "{imie} leci z tobą",
        stay: "{imie} zostaje na grzędzie",
        guard: "{imie} pilnuje pola z grzędy",
        noPerch: "Kruk potrzebuje grzędy",
        perchFar: "{imie} odlatuje na grzędę",
        night: "{imie} odlatuje na grzędę - noc",
        fed: "{imie} zjada: {co}",
        letterGone: "{imie} odlatuje z listem do: {kto}",
        letterBack: "{imie} wraca z odpowiedzią",
        letterToday: "Dziś {imie} już niósł list - jutro",
        letterQuest: "{imie} doręczył: {co}",
        letterQuestFail: "{imie} wrócił z listem - nie zastał adresata",
        scoutGone: "{imie} leci na zwiad: {gdzie}",
        scoutBack: "{imie} wraca ze zwiadu: {gdzie}",
        scoutToday: "Dziś {imie} już był na zwiadzie - jutro",
        // (2026-10-17: the scouting tells, no marks on the map - Kruk.js finishScout)
        scoutTitle: "Zwiad kruka: {gdzie}",
        scoutEmpty: "spokojnie - nic nie wypatrzył",
        scoutWarn: "Uwaga! {gdzie}: {co}.",
        scoutBubble: "Kra! {gdzie}: {co}.",
        scoutNoCat: "(Jagód i grzybów nie policzył - nie byłeś tam w tej porze roku.)",
        busy: "{imie} jeszcze nie wrócił",
        hungry: "{imie} jest głodny",
        leftHungry: "{imie} odleciał na Urwisko. Głodny.",
        backHome: "{imie} wraca z tobą",
        chase: "{imie} przegania ptaki z pola!",
        chaseAway: "Pod twoją nieobecność {imie} przegonił ptaki z pola",
        warn: "{imie} kracze ostrzegawczo: coś się zbliża!",
        fled: "{imie} spłoszony odlatuje na Urwisko. Wróci rano.",
        trinketCoins: "{imie} przyniósł {n} G",
        trinketLetter: "{imie} przyniósł cudzy list: {co}",
        bowl: "Woda w miseczce: {n}/{max}",
        bowlFull: "Miseczka jest pełna",
        bowlNone: "Nie masz wody: nabierz do wiadra albo bukłaka",
        // K51
        k51Mast: ["(Na złamanym maszcie wraku siedzi wielki czarny kruk. Patrzy prosto na ciebie.)", "(Kracze raz - i zrywa się do lotu, w górę, nad wydmą.)"],
        k51Wait: ["Kra!", "Kraa!", "(Kruk przechyla łeb. Czeka.)"],
        k51Kleofas: "Ten? To z Urwiska. Kruczarnia zakonu. Ostatni kruczarz umarł, zanim się urodziłem.",
        k51KleofasThink: "Kruk przysiadł na kopcu z krukiem. Znak zakonu - i żywy ptak. Jakby wiedział.",
        k51Ravenry: "(Kruk siada na starej żerdzi w ruinie baszty, między innymi krukami. Na nóżce błyska mu mosiężna obrączka.)",
        // the strangers' camp at night
        campNote: ["Obcy na Urwisku", "Nocą na Urwisku obcy ludzie kopią w gruzie dawnych murów. Szukają kamieni z krukiem. Mówią jak ludzie z lądu."],
        campBark: ["Kopać. Kamień z krukiem, nie byle co.", "Ciszej z tą łopatą...", "Gdzieś tu musi być. Mapa nie kłamie."],
        // the foreign letters
        letterAsk: "Cudzy list: {co}",
        letterRead: "Przeczytaj",
        letterKeep: "Schowaj (oddasz właścicielowi albo sprzedasz)",
        letterBackOpt: "Oddaj: {co}",
        letterSellOpt: "Sprzedaj: {co} ({g} G)",
        letterSellAsk: ["> Kruk przyniósł mi coś... nie mojego.", "(Baltazar obraca kartkę w palcach.) Ciekawe. Bardzo ciekawe. Ile chcesz?"],
        letterSold: ["Interes to interes. I nikomu ani słowa, prawda, przyjacielu?"]
    };

    // ------------------------------------------------------------------ the quests (TownQuests packs - docs/QUESTY_STAN.md "Jak dopisać")
    const K51 = {
        id: "K51", kind: "K", title: "Kruk z masztu", giver: "przemytnik", icon: RING_ICON, where: "przystań → pustelnia → Urwisko Kruków",
        when: "o świcie (5–7), od dnia 8",
        desc: "Roch mówi, że co rano na maszcie wraku kutra siedzi kruk i patrzy na ciebie, nie na niego. Kruki nie siadają na wrakach bez powodu.",
        offer: {
            cond: { day: 8, hours: [5, 13], flags: ["rochMet"], fn: "k51Ready" },
            say: ["Kruk znowu siedział na maszcie wraku. Co rano. Patrzy na ciebie, nie na mnie.",
                "Siedział też tamtej nocy, na maszcie, kiedy szliśmy na dno. Sztorm, fale jak dom - a on siedział. Kruki nie siadają na wrakach bez powodu.",
                "Przyjdź o świcie. Zobaczysz sam."],
            yes: "Przyjdę o świcie.", no: "Kruk to kruk.",
            accept: ["Od piątej do siódmej. Potem odlatuje. Nie wiem dokąd. Może ty się dowiesz."],
            decline: ["Jak chcesz. Ptak poczeka. On zawsze czeka."]
        },
        steps: [
            { type: "custom", check: "k51Mast", text: "O świcie (5–7) podejdź do kruka na maszcie wraku kutra (przystań, plaża albo pochylnia)." },
            { type: "custom", check: "k51Follow", vars: "k51Follow", text: "Idź za krukiem. {gdzie}" }
        ],
        reward: { xp: 40, flag: "urwiskoOdkryte",
            note: ["Urwisko Kruków", "Kruk z masztu zaprowadził mnie przez pustelnię na Urwisko Kruków - morską ścianę wzgórza tawerny. W ruinie baszty jest kruczarnia zakonu. Kruk z mosiężną obrączką siedzi tam na starej żerdzi."] }
    };
    const D24 = {
        id: "D24", kind: "D", title: "Oswojony kruk", giver: "grandpa", icon: RING_ICON, autoStart: "d24Start",
        where: "kruczarnia na Urwisku → dom dziadka → działka", when: "3–5 dni",
        desc: "Młody kruk z obrączką zakonu siedzi w kruczarni na Urwisku. Kruki nie biorą jedzenia z byle ręki - trzeba przychodzić, dzień po dniu.",
        steps: [
            { type: "custom", check: "d24Feed", vars: "d24Feed",
                text: "Nakarm kruka w kruczarni na Urwisku trzy razy, każdy raz innego dnia (surowe mięso albo ryba). Nie biegaj przy nim, psa zostaw w domu. Karmienia: {n}/3." },
            { type: "talk", to: "grandpa", guard: "d24Ring", text: "Pokaż dziadkowi obrączkę z nóżki kruka.",
                say: ["> Dziadku. Kruk z Urwiska siada mi na ramieniu. Miał na nóżce to. (Pokazujesz obrączkę.)"],
                done: ["(Dziadek bierze obrączkę i długo obraca ją w palcach.) Skąd to masz? ...Siadaj.",
                    "Mój dziad trzymał kruki. Tam, na Urwisku, zanim na górze postawili karczmę. Mówił, że nasza rodzina nosi listy, których nikt nie powinien czytać. Śmiałem się z niego.",
                    "Twój ojciec też się śmiał. A potem dał ci ten kamień na szyję.",
                    "(Dziadek milknie. Oddaje ci obrączkę.) Dbaj o tego ptaka. I postaw mu grzędę na działce. Kruk musi mieć swoje miejsce, jak każdy."],
                reward: { note: ["Ród kruczarzy", "Dziadek rozpoznał obrączkę kruka. Jego dziad trzymał kruki na Urwisku, zanim na górze postawiono karczmę - „nasza rodzina nosi listy, których nikt nie powinien czytać”. Dziadek mówi, że sam się z tego śmiał, dopóki jego ojciec nie dał mu wisiorka z krukiem - tego samego, który potem dał mojej matce, a ona mnie."] } },
            { type: "custom", check: "d24Perch", vars: "d24Perch", text: "Postaw grzędę na działce - {imie} potrzebuje swojego miejsca (budowanie: Q - 4× Gałęzie, 2× Deski, 1× Lina)." }
        ],
        reward: { xp: 100,
            note: ["Oswojony kruk", "Kruk z Urwiska mieszka teraz na grzędzie na działce. Lata ze mną, nosi listy po wyspie (nie przez morze), leci na zwiad, pilnuje pola przed ptakami, a czasem coś przynosi. Na noc wraca na grzędę."] },
        lines: { guard: "Hm? Pokaż, co tam masz." }
    };
    const REMARKS = [
        { id: "krukJanek", who: "janek", flag: "krukTame", lines: ["Twój kruk? Ten z masztu? Siadał mi na łodzi, jak wypływałem. Myślałem, że przynosi pecha. A przyniósł ciebie."] },
        { id: "krukRoch", who: "przemytnik", flag: "krukTame", lines: ["Widzę, że kruk już nie siedzi na maszcie. Siedzi na tobie. Mówiłem: patrzył na ciebie, nie na mnie."] },
        { id: "krukKleofas", who: "pustelnik", flag: "krukTame", lines: ["Kruczarz. Pierwszy od trzystu lat. ...Nie puszyj się, chłopcze. To kruk wybrał, nie ty."] },
        { id: "krukAmbrozy", who: "dzwonnik", flag: "krukTame", lines: ["Kruk na ramieniu... Mój mistrz mówił, że kiedyś przylatywały z listami na dzwonnicę. Myślałem, że to bajka dla uczniów."] },
        { id: "krukBaltazar", who: "kupiec", flag: "krukTame", lines: ["Ładny ptak, przyjacielu. Kruki przynoszą różne rzeczy. Jakby przyniósł coś... ciekawego, wiesz, gdzie mnie szukać."] }
    ];
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({
        owner: "Kruk", quests: [K51, D24], remarks: REMARKS,
        gossip: { przemytnik: ["Chleb? (Roch odłamuje kawałek i rzuca na piasek.) Dla kruka. Jak przyleci."] }
    });

    window.KrukData = { MAP, HARBOUR, HERMITAGE, FIELD, IDS: [610, 629], ITEM, RAVEN_ICON, RING_ICON, SHEET, RAVEN, LETTERS, MOTHER, FOREIGN, TRINKET, TX,
        K51, D24, REMARKS,
        // food: any meat (raw, roasted, smoked) and fish - the dog's list (FoodTable in Farming_Data.js)
        FOOD: window.FoodTable && FoodTable.tameMeats ? FoodTable.tameMeats() : [] };
})();
