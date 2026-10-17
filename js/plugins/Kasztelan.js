//=============================================================================
// Kasztelan.js
//=============================================================================
// The arc W4 "Krew kasztelana" after its compact chapters 1-5 (TownQuests.js: Borgar's half key, the raven cairn, Tadek's forge, the
// grate in the cellar opened, Borgar's saying) - docs/QUESTY.md W4, chapters 6-8:
//   6 "Ród Kowali" - who Borgar's blood was: three of the clues - the Order's notes underground (the saying carved on floor 3,
//     "Kasztelan Kowal" on 6, "Ostatni wpis" on 10 - "Słowa zna tylko krew kasztelana - niech je powtarza, choćby jako żart przy
//     piwie", the prior's letter to the castellan on 20), the list of castellans (W2's chronicles or floor 24), brother Kleofas on the
//     cliff (shown the key: the key's guard swore "Nie pytam o to, czego nie chcę wiedzieć"), grandpa Stach ("Kruk u nas, klucz u
//     Kowali"). Three found: the note "Ród Kowali"
//   7 "Konfrontacja" - only after chapter 1 is over (Story.chapterEnded: the debt paid or the field lost - QUESTY 6.2) and only
//     after closing time (23-1, at the bar): tell him everything (the key, the castellan, the oath; his nights at the grate when the
//     Truth Layer's page is known - it counts as W9's truth told) or keep silent - it is his tavern and his saying. Told, he flares
//     up and shuts the tavern for a day (no shift: the door locked from outside, Borgar says only "zamknięte"); the next night he
//     waits in the cellar by the grate. Already half-prepared - Melia sang the song only for him (W3 b) or he heard of his nights
//     (W9) - he does not flare up: it all comes at once, at the bar. His grandmother: "Pilnuj piwnicy i nie pytaj". Then the hero
//     asks: "Chodź ze mną w dół" - he comes when he trusts the hero enough (the song for him, his nights told, a dozen shifts or the
//     tavern's fame; telling the Lord first counts against) - or he stays as the cellar's guard: "zejdziesz - nie wracaj do pracy"
//     (the next descent ends the hero's shifts until Act III's siege is over); "Zostań, pilnuj piwnicy" - the guard by agreement
//   8 "Komnata Serca" - the key opens the last door (Underground.js); Borgar who went down can take the guardian's place
//     (Underground: world().borgar). The arc ends with any ending of the Heart.
// What Borgar does then: "idzie" - after closing, every night 1-5 he keeps a fire at the tenth gate (Map140; his basket there: bread
// and water once a day), stronger in Act III (Act3_Data), at the Heart; "pilnuje" - every night 1-5 by the grate in the cellar (Map009)
// with a fire basket, the old door holds better in Act III; "niewie" - nothing changes, he does not know.
// The tavern's own map (Map001) is the user's: nothing in its file changes - Borgar's event, the counter and the town's tavern door
// (Map008) answer in code (Game_Event.list) while W4 needs it.
// Events: Tawerna.inject ids 540-559 (owner "Kasztelan"): 540-541 the cellar (Map009), 542-544 the tenth gate (Map140).
// API: window.Kasztelan (Tawerna.api("Kasztelan")).

/*:
 * @target MZ
 * @plugindesc [W4] Wątek „Krew kasztelana” rozdz. 6-8: ród Kowali (poszlaki), konfrontacja z Borgarem po zamknięciu, zamknięta tawerna, noc w piwnicy, Borgar idzie w dół albo pilnuje piwnicy, Komnata Serca. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base TownQuests
 * @orderAfter TownQuests
 * @orderAfter Story
 * @orderAfter Underground
 * @orderAfter Act3
 * @orderAfter Pustelnia
 * @orderAfter Dwor
 *
 * @help
 * ============================================================================
 * Kasztelan.js - wątek W4 „Krew kasztelana”, rozdziały 6-8
 * ============================================================================
 * Rozdziały 1-5 (pół klucza znad baru, kopiec z krukiem, kuźnia Tadka, krata
 * w piwnicy, słowa Borgara) są w TownQuests.js. Tu dalej:
 *  6 Ród Kowali - trzy poszlaki: zapiski zakonu w podziemiach (piętra 3, 6,
 *    10, 20, 24), kroniki z Archiwum (lista kasztelanów), brat Kleofas
 *    (pokaż mu klucz), dziadek Stach.
 *  7 Konfrontacja - po rozdziale 1 (spłata długu albo strata pola), po
 *    zamknięciu (23-1) przy barze: powiedz Borgarowi wszystko albo przemilcz.
 *    Powiedziane: Borgar się wścieka i zamyka tawernę na dzień (bez zmiany),
 *    następnej nocy czeka w piwnicy przy kracie. Kto mu wcześniej zaśpiewał
 *    pieśń (W3) albo powiedział o jego nocach (W9) - bez złości, od razu.
 *    Potem: „Chodź ze mną w dół” albo „Zostań, pilnuj piwnicy”.
 *  8 Komnata Serca - klucz otwiera ostatnie drzwi; Borgar, który poszedł
 *    w dół, może zostać strażnikiem zamiast bohatera.
 * Zdarzenia 540-559 (rejestr TawernaCore: "Kasztelan"). Mapa tawerny
 * (Map001) się nie zmienia - Borgar, lada i drzwi odpowiadają w kodzie.
 * F9, zakładka „Wyspa i fabuła”: „W4: rozdział N”.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Kasztelan.js: brak TawernaCore.js");
    const PLUGIN = "Kasztelan";
    const MAP = { tavern: 1, town: 8, cellar: 9, ruins: 10, floor10: 140, house: 19, cairn: 20 };
    const IDS = [540, 559];
    const EV = { cellarBorgar: 540, cellarFire: 541, postBorgar: 542, postFire: 543, postBasket: 544 };
    // the places: the cellar - Borgar right of the grate (15,2), his fire basket left of it (the grate's own tile 15,3 stays free);
    // the tenth gate (Map140) - the west corner of the entrance hall by the stairs up (5,12; the rival's camp is east, 12-25)
    const POS = { cellarBorgar: [16, 3, 4], cellarFire: [14, 3], postFire: [3, 16], postBorgar: [4, 16, 4], postBasket: [2, 16] };
    // talk: after closing at the bar; door: the town's door shut on the shut day; bar: Borgar only says "zamknięte"; cellar: the night
    // he waits by the grate; post: the nights he keeps his post (the cellar or the tenth gate) - he is not at the bar then
    const HOURS = { talk: [23, 1], door: [5, 22], bar: [5, 23], cellar: [23, 5], post: [1, 5] };
    const NEED = 3, BREAD = 83, WATER = 35, TRUST = { shifts: 12, rep: 40 };
    const KEY_ICON = 195, BREAD_ICON = 0;
    const HERO = { id: 0, name: "" };
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const ST = () => T.api("Story") || window.Story || null;
    const UG = () => T.api("Underground") || window.Underground || null;
    const SB = () => T.api("SpeechBubbles") || window.SpeechBubbles || null;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const onMap = id => !!(window.$gameMap && $gameMap.mapId() === id);
    const report = (where, e) => console.error("[Kasztelan] " + where + ":", e);
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const now = () => day() * 24 + hour();

    // ------------------------------------------------------------------
    // The words (Polish). "> " - the hero
    // ------------------------------------------------------------------
    const TX = {
        // ---- 6: the clues
        clues: {
            napis: "napis w murze (piętro 3)", kowal: "„Kasztelan Kowal” (piętro 6)", wpis: "„Ostatni wpis” (piętro 10)",
            przeor: "list przeora do kasztelana (piętro 20)", lista: "lista kasztelanów", kleofas: "brat Kleofas", dziadek: "dziadek Stach"
        },
        where: "Szukaj w zapiskach zakonu w podziemiach, w kronikach z Archiwum, u brata Kleofasa na klifie (pokaż mu klucz) i u dziadka Stacha.",
        whereDone: "Wiem dość. Teraz Borgar.",
        kleofas: ["> Bracie Kleofasie. Poznajesz ten klucz?",
            "(Kleofas obraca klucz w palcach. Długo patrzy na kruka na uchwycie.) Klucz straży. Pisałem w kronice, że przepadł razem z ostatnim kasztelanem.",
            "> Z kasztelanem?",
            "Bogumił z rodu Kowali. Kasztelan i klucznik. Kowale kuli zamki zakonu, a potem ich pilnowali - z ojca na syna.",
            "Każda straż miała swoją przysięgę. Dzwon woła. Pieśń pamięta. Pióro zapisuje. A klucz zamyka - i nie pyta.",
            "Klucznik przysięgał: „Nie pytam o to, czego nie chcę wiedzieć.” Kto trzyma klucz do Serca, nie może być ciekawy. Ciekawy klucznik to otwarte drzwi.",
            "> Tak samo mówi Borgar. Karczmarz. Jak żart, przy piwie.",
            "(Kleofas milknie. Długo.) Ostatni przeor kazał strażom zapomnieć, po co strzegą. Zostawić same słowa. Widać zostawili.",
            "Klucz przetrwał. A ja myślałem, że została tylko pieśń w knajpianych balladach. ...Twój karczmarz pilnuje, chłopcze. Tylko nie wie czego."],
        noteKleofas: ["Straż klucza", "Brat Kleofas poznał klucz: to klucz straży zakonu. Ostatni kasztelan, Bogumił z rodu Kowali, był też klucznikiem - Kowale kuli zamki zakonu i ich pilnowali. Przysięga klucznika brzmiała: „Nie pytam o to, czego nie chcę wiedzieć.” Kto trzyma klucz do Serca, nie może być ciekawy."],
        dziadek: ["> Dziadku. Pod kopcem z krukiem na podwórzu leżała połowa klucza. Wiedziałeś?",
            "(Dziadek odkłada fajkę.) Wiedziałem, że coś tam leży. Ojciec kazał orać dookoła i nie pytać.",
            "Jak byłem mały, mówił mi: „Kruk u nas, klucz u Kowali. Przyjdzie kiedyś Kowal, powie swoje słowa - oddać mu, co jego.”",
            "> Borgar jest Kowalem.",
            "No przecie. Borgar Kowal. Jego dziad i mój ojciec pili w tej samej karczmie, na tych samych starych kamieniach.",
            "Myślałem, że to taka gadka starych ludzi, synku. Jak o kruku, co przynosi listy. ...A ty mi teraz mówisz, że kruki przynosiły."],
        noteDziadek: ["Kruk u nas, klucz u Kowali", "Dziadek Stach pamięta słowa swojego ojca: „Kruk u nas, klucz u Kowali. Przyjdzie kiedyś Kowal, powie swoje słowa - oddać mu, co jego.” Ród dziadka przechował połowę klucza dla rodu Borgara. Karczma Kowali od zawsze stała na kamieniach twierdzy."],
        rodThink: ["> (Bogumił z rodu Kowali, kasztelan i klucznik. A zdanie Borgara to nie żart - to przysięga straży klucza.)",
            "> (Powiedzieć mu? Po zamknięciu, przy barze. ...Albo uszanować jego słowa. To jego tawerna.)"],
        noteRod: "Borgar Kowal jest z rodu ostatniego kasztelana twierdzy - Bogumiła z rodu Kowali, kasztelana i klucznika. Kowale kuli zamki zakonu i ich pilnowali. Zdanie Borgara „Nie pytam o to, czego nie chcę wiedzieć” to nie żart przy piwie, tylko przysięga straży klucza - zakon kazał ją powtarzać, żeby nikt nie pamiętał, po co. Skąd wiem: {skad}.",

        // ---- 7: the confrontation at the bar
        topic: "Borgarze... chodzi o twój ród.",
        notNow: ["Nie teraz, chłopcze. Sala pełna, uszy wszędzie. Po zamknięciu - od jedenastej do pierwszej.",
            "Po zamknięciu. Od jedenastej. Teraz mam ręce pełne kufli."],
        notYet: ["Najpierw spłać swoje sprawy u Lorda. Potem pogadamy o moich."],
        intro: ["(Borgar wyciera ostatni kufel. Sala pusta, świece dopalają się na stołach.)", "Zamknięte. ...Ale ty nie przyszedłeś na piwo, co? Masz tę minę."],
        introHero: ["> (Klucz kasztelana ciąży w kieszeni.)"],
        ask: "No? Mów albo idź spać.",
        optTell: "Powiedz mu wszystko.", optKeep: "Przemilcz. To jego tawerna.", optLater: "Nie teraz.",
        later: ["To idź spać. Ja też pójdę. ...Kiedyś."],
        tellCore: ["> Borgarze. Twój ród to Kowale z twierdzy. Ostatni kasztelan, Bogumił, był z twojej krwi. Kasztelan i klucznik."],
        tellLista: ["> Jest na liście kasztelanów zakonu: „Bogumił z rodu Kowali. Następny - z tego samego rodu. Jeśli ród przetrwa.”"],
        tellSlowa: ["> A twoje zdanie... „Nie pytam o to, czego nie chcę wiedzieć.” To nie żart. To przysięga straży klucza. Zakon kazał wam ją powtarzać - choćby przy piwie."],
        tellDziadek: ["> Mój dziadek pamięta: „Kruk u nas, klucz u Kowali.” Nasze rody przechowały ten klucz na pół."],
        tellKlucz: ["> (Kładziesz klucz kasztelana na ladzie. Kruk na uchwycie łapie światło świecy.)"],
        tellNoce: ["> I jeszcze jedno. Co noc schodzisz do piwnicy i stajesz przed kratą. Rano tego nie pamiętasz."],
        lordFirst: ["A Lordowi powiedziałeś pierwszemu. Jego ludzie łażą mi teraz po piwnicy."],
        preparedSong: ["(Borgar długo milczy. Kładzie dłoń na kluczu.) Od tamtej nocy, kiedy Melia śpiewała tylko dla mnie, wiedziałem, że to przyjdzie."],
        preparedNights: ["(Borgar kiwa głową, powoli.) Po tym, co mi powiedziałeś o moich nocach... spodziewałem się czegoś takiego."],
        anger: ["(Borgar uderza pięścią w ladę. Kufle podskakują.)",
            "Kasztelan. Klucznik. Przysięga. Ja leję piwo, chłopcze! Babka szorowała tu podłogi, a dziadek nosił beczki!",
            "Całe życie powtarzam to zdanie gościom, a oni się śmieją. A ty mi mówisz, że mój ród... że ja...",
            "Wynoś się. Jutro nie otwieram. Dla nikogo. Dla ciebie też."],
        angerThink: ["> (Pierwszy raz widziałem Borgara takiego. Jutro tawerna zamknięta.)"],
        noteAnger: ["Borgar zamknął tawernę", "Powiedziałem Borgarowi o jego rodzie: kasztelan, klucznik, przysięga. Wściekł się - jutro tawerna zamknięta, dla wszystkich. Następnej nocy mam przyjść do piwnicy? Nie powiedział. Ale wiem, gdzie go szukać."],
        keepThink: ["> (To jego tawerna. Jego krew i jego słowa. „Nie pytam o to, czego nie chcę wiedzieć” - może właśnie tak ma zostać.)"],
        keepSay: ["> Nic, Borgarze. Dobranoc."],
        keepBorgar: ["(Borgar patrzy na ciebie długo. Potem chowa ścierkę za pas.) ...Dobranoc. Nie wiem, co chciałeś powiedzieć. I nie chcę wiedzieć."],
        noteKeep: ["Przemilczane", "Nie powiedziałem Borgarowi, kim był jego ród. To jego tawerna i jego słowa: „Nie pytam o to, czego nie chcę wiedzieć.” Klucz kasztelana zostaje u mnie. Borgar dalej nie wie, czego pilnuje."],

        // ---- 7: the shut day and the night in the cellar
        closedBar: ["Zamknięte, mówiłem. Dziś nie nalewam. Nikomu."],
        closedCounter: "Za ladą pusto. Na desce kredą: „Dziś nieczynne”.",
        closedDoor: "Zamknięte. Na drzwiach kredą: „Dziś nieczynne”.",
        awayCounter: "Za ladą pusto. Borgar wyszedł - na ladzie stoi świeca.",
        cellarIntro: ["(Borgar siedzi na beczce przy kracie. Kosz z żarem grzeje mu ręce. Nie podnosi głowy.)",
            "Siadaj. ...Nie spałem całą noc i cały dzień. Myślałem."],
        grandma: ["Babka. Babka Kowalowa. Jak byłem mały, przyprowadziła mnie tutaj, do tej kraty, i powiedziała: „Pilnuj piwnicy i nie pytaj.”",
            "Myślałem, że chodzi o piwo. O złodziei. ...A ona wiedziała. Albo nie wiedziała - tylko powtarzała, co jej powtórzono."],
        grandmaNights: ["Co noc tu stoję, mówisz. Teraz wiem dlaczego. Krew ciągnie do kraty."],
        grandmaEnd: ["Kowale kuli zamki i ich pilnowali. Trzysta lat. A ja nawet nie wiedziałem czego."],
        verdictAsk: "No to co teraz, chłopcze?",
        optCome: "Chodź ze mną w dół.", optStay: "Zostań. Pilnuj piwnicy.",
        askCome: ["> Chodź ze mną w dół, Borgarze. Twój ród trzymał ten klucz. Niech go nie niesie obcy."],
        askStay: ["> Zostań. Pilnuj piwnicy - jak twój ród. Ja zejdę sam."],
        whySong: "Melia mi to wyśpiewała, ty mi to powiedziałeś. Dwa razy to już nie przypadek.",
        whyNights: "Powiedziałeś mi o moich nocach, choć mogłeś milczeć.",
        whyShifts: "Tyle wieczorów stałeś za moim barem. Komu mam ufać, jak nie tobie?",
        whyNotShifts: "Znam cię za krótko, żeby iść za tobą w ciemność.",
        whyNotLord: "Lordowi powiedziałeś pierwszemu. Jego ludzie już łażą mi po piwnicy.",
        whyNotAny: "Ty idziesz po coś na dół. Ja nie wiem nawet po co.",
        comeYes: ["(Borgar wstaje. Kolana mu trzeszczą.) Babka by mnie zabiła. Ale babki nie ma, a ty jesteś.",
            "Na dziesiątym piętrze stoi zbroja, co zna moje słowa? To niech je usłyszy z mojej gęby.",
            "Za dnia nalewam. Ale co noc, po zamknięciu, schodzę do dziesiątej bramy. Rozpalę tam ogień. Będzie gdzie wrócić.",
            "Klucz zostaw sobie. A jak dojdziesz do samego dołu - nie pójdziesz sam. Kowale pilnują kluczy do końca."],
        comeNo: ["Nie."],
        comeNoEnd: ["Moje miejsce jest tu. Przy kracie. Babka kazała pilnować - to będę pilnował.",
            "A ty posłuchaj. Zejdziesz tam jeszcze raz - nie wracaj do pracy. Za mój bar nie staje ktoś, kto łazi tam, gdzie mój ród trzymał drzwi zamknięte."],
        stayYes: ["(Borgar kiwa głową, powoli.) Tak. To umiem. Pilnować.",
            "Co noc, po zamknięciu, siądę tu z koszem żaru. Kto zejdzie bez ciebie - nie wyjdzie bez mojej wiedzy.",
            "A ty schodź, kiedy musisz. Tylko wracaj na górę. Zawsze wracaj na górę."],
        notes: {
            idzie: ["Borgar idzie ze mną", "Borgar wie, kim był jego ród. Babka kazała mu „pilnować piwnicy i nie pytać”. Poprosiłem, żeby zszedł ze mną - i zszedł: co noc po zamknięciu (od pierwszej do piątej) pali ogień przy dziesiątej bramie, w koszu zostawia chleb i wodę. Klucz kasztelana mam ja. „Kowale pilnują kluczy do końca.”"],
            pilnuje: ["Borgar pilnuje piwnicy", "Borgar wie, kim był jego ród. Babka kazała mu „pilnować piwnicy i nie pytać” - i tak zrobi: co noc po zamknięciu (od pierwszej do piątej) siedzi przy kracie z koszem żaru. „Zawsze wracaj na górę.”"],
            ostrzegl: ["Borgar pilnuje piwnicy", "Borgar wie, kim był jego ród, ale ze mną w dół nie pójdzie. Co noc po zamknięciu (od pierwszej do piątej) siedzi przy kracie z koszem żaru. Ostrzegł: „Zejdziesz tam jeszcze raz - nie wracaj do pracy.”"]
        },
        tops: { idzie: ["Borgar idzie z tobą", "Co noc pali ogień przy dziesiątej bramie"], pilnuje: ["Borgar pilnuje piwnicy", "Co noc przy kracie, od pierwszej do piątej"],
            ostrzegl: ["Borgar pilnuje piwnicy", "„Zejdziesz - nie wracaj do pracy”"] },

        // ---- 8 and after: the posts, the shifts, the grate
        grateWarn: ["> (Borgar mówił: zejdziesz tam jeszcze raz - nie wracaj do pracy.)"],
        grateAsk: "> Zejść mimo to?",
        optDown: "Zejdź.", optUp: "Zostań na górze.",
        firedThink: ["> (Zszedłem. Borgar się dowie - zawsze się dowiaduje.)"],
        noteFired: ["Bez pracy u Borgara", "Zszedłem przez kratę, choć Borgar ostrzegał. Za jego bar już nie wejdę - jeść da, pokój wynajmie, ale zmiany nie. Może kiedyś mu przejdzie."],
        shiftClosed: "Zamknięte, mówiłem. Dziś żadnej zmiany.",
        shiftFired: "Mówiłem: zejdziesz - nie wracaj do pracy. Jeść ci dam, pokój wynajmę. Za bar nie wejdziesz.",
        reconcileTopic: "Borgarze... po tamtej nocy?",
        reconcile: ["> Borgarze... Po tamtej nocy. Bronili jej obaj - ty piwnicy, ja drzwi.",
            "(Borgar odstawia kufel.) Przyszli z góry, nie z dołu. Pilnowałem kraty, a oni weszli drzwiami. ...Babka nie wszystko wiedziała.",
            "Wracaj za bar. Pilnujemy tej samej rzeczy, każdy z innej strony."],
        noteReconcile: ["Z powrotem za barem", "Po oblężeniu Borgar przyjął mnie z powrotem: „Pilnujemy tej samej rzeczy, każdy z innej strony.” Zmiany znowu są moje."],
        cellarGuard: ["Cicho. Słuchaj... nic. Dobrze, że nic.", "Kto schodzi, ten wraca. Ty też. Pamiętaj.", "Babka siedziała tu przede mną. Teraz wiem, po co.",
            "Na górze już zamknięte. Idź spać, chłopcze."],
        cellarGuardDown: ["Znowu w dół? ...Wracaj na górę. Zawsze wracaj na górę."],
        postFirst: ["(Borgar dokłada drew do ognia.) No i jestem. Dziesiąta brama, ognisko, kosz z chlebem. Jak u mnie w karczmie, tylko goście cichsi.",
            "Zbroja patrzy na mnie, jakby mnie znała. Może zna. Kowale kuli jej zamek."],
        postLines: ["Siadaj przy ogniu. Na dole nikt nie zamawia na krechę.", "Weź chleb z kosza. Wody też. Na dole jej nie ma.",
            "Słyszałem coś z dołu. Pewnie nic. Na dole zawsze coś słychać.", "O piątej wracam na górę. Kufle same się nie umyją."],
        basketTake: ["> (Pod płótnem: bochenek chleba i dzban wody. Na płótnie kredą: „Wracaj na górę. B.”)"],
        basketEmpty: "Kosz pusty. Borgar dokłada co noc.",
        basketLook: "Kosz Borgara",
        fireCellar: "Kosz z żarem Borgara. Grzeje przy kracie.",
        firePost: "Ognisko Borgara przy dziesiątej bramie.",
        keyLock: ["> (Klucz kasztelana obraca się w zamku z krukiem. Kowale kuli ten zamek - i ten klucz.)"],
        noteKeyLock: ["Klucz kasztelana na dole", "Klucz kasztelana otworzył zamek ostatnich drzwi pod Kruczymi Skałami - do Komnaty Serca. Kowale kuli i zamek, i klucz."],
        // the journal's chapter 8
        serce: {
            idzie: "Borgar idzie ze mną: co noc (1–5) pali ogień przy dziesiątej bramie - w koszu chleb i woda. Klucz kasztelana otworzy ostatnie drzwi, do Komnaty Serca (piętro 100). Borgar zejdzie tam ze mną - może zostać strażnikiem zamiast mnie.",
            pilnuje: "Borgar pilnuje piwnicy: co noc (1–5) siedzi przy kracie. Klucz kasztelana otworzy ostatnie drzwi, do Komnaty Serca (piętro 100).",
            niewie: "Przemilczałem Borgarowi, kim był jego ród. Klucz kasztelana otworzy ostatnie drzwi, do Komnaty Serca (piętro 100).",
            warned: " Borgar ostrzegł: zejdziesz - nie wracaj do pracy.",
            fired: " Za bar Borgara nie wrócę - chyba że coś się zmieni.",
            back: " Po oblężeniu Borgar przyjął mnie z powrotem za bar."
        },
        cellarStep: "Borgar się wściekł i zamknął tawernę na dzień {dzien} - bez zmiany. Następnej nocy, od 23:00, czeka w piwnicy przy kracie.",
        // the end of the arc (W4 done with an ending of the Heart)
        endNote: {
            guardian: ["Krew kasztelana", "Borgar został strażnikiem Serca. „Ktoś z rodu musiał wrócić na wartę.” Klucz kasztelana wrócił do Kowali - tam, gdzie był trzysta lat."],
            idzie: ["Krew kasztelana", "Borgar zszedł ze mną do samego Serca - jak Kowale, którzy pilnowali kluczy do końca. Klucz kasztelana wraca nad bar. Tym razem wiadomo, po co tam wisi."],
            pilnuje: ["Krew kasztelana", "Klucz kasztelana otworzył ostatnie drzwi. Borgar został na górze, przy kracie. Wie już, czego pilnuje - i że ktoś wraca."],
            niewie: ["Krew kasztelana", "Klucz kasztelana otworzył ostatnie drzwi. Borgar nie wie, czyj to był klucz. Dalej powtarza gościom swoje zdanie - jak żart przy piwie."],
            none: ["Krew kasztelana", "Serce zostało za mną. Klucz kasztelana też. Borgar o niczym nie wie - nie zdążyłem mu powiedzieć."]
        },
        // the epilogue's line (Underground.js) - null: nothing to say
        epilog: {
            idzie: "Ogień przy dziesiątej bramie dogasa co rano - i co noc ktoś go rozpala. Borgar mówi, że to dla tych, co wracają.",
            pilnuje: "Borgar co noc siada przy kracie z koszem żaru. Wie już, czego pilnuje. I już nie przestawia beczek.",
            fired: "Za bar Borgara już nie wróciłeś. Mijacie się na rynku i kiwacie głowami - jak dwaj strażnicy z różnych zmian.",
            niewie: "Borgar dalej powtarza gościom swoje zdanie, jak żart przy piwie. Nie wie po co. Może tak jest lepiej."
        },
        // W9's truth of Borgar's nights told after W4 (TownQuests' tellIf)
        w9After: ["(Borgar milknie.) Po tym, co mi powiedziałeś o moim rodzie... to nie beczki. To krata. Krew ciągnie."],
        // the town's remarks once (TownQuests' REMARKS)
        remarks: [
            { id: "w4Zamkniete", who: "piekarka", flag: "borgarZamknal", lines: ["Słyszałeś, kochaneczku? Borgar nie otworzył karczmy! Pierwszy raz, odkąd pamiętam. Chory czy co?"] },
            { id: "w4Kowadlo", who: "kowal", flag: "borgarWie", lines: ["Borgar był u mnie w kuźni. Stał i patrzył na kowadło. Nic nie mówił. ...Powiedziałeś mu, co?"] }
        ],
        // F9
        f9: { 1: "pół klucza znad baru", 2: "kopiec z krukiem", 3: "kuźnia Tadka", 4: "krata w piwnicy", 5: "słowa Borgara", 6: "ród Kowali", 7: "konfrontacja",
            8: "noc w piwnicy", 9: "Komnata Serca" }
    };

    // ------------------------------------------------------------------
    // The state (the save) and TownQuests' flags
    // ------------------------------------------------------------------
    const store = T.state.define("kasztelan", () => ({
        clues: {}, rod: 0,                                   // 6: the clues found (key -> day), the chapter's note written
        how: "", closed: 0, stance: "", verdict: 0,          // 7: tell / keep, the shut day, idzie | pilnuje | niewie
        warned: 0, fired: 0, back: 0,                        // the warning, the shifts gone, back after the siege
        basket: -1, postSeen: 0, keyLock: 0, end: ""         // the basket's day, the first night at the post, the Heart's lock, the end
    }), { version: 1, owner: PLUGIN });
    const S = () => store();
    const qstate = () => { const q = TQ(); try { return q && q.state ? q.state() : null; } catch (e) { return null; } };
    const flags = () => { const s = qstate(); return (s && s.flags) || {}; };
    const flag = k => !!flags()[k];
    function setFlag(k) { const s = qstate(); if (s && s.flags && k && !s.flags[k]) s.flags[k] = day(); }
    const vcount = k => { const s = qstate(); return s && s.v ? s.v[k] || 0 : 0; };
    const vgive = (k, n) => { const s = qstate(); if (s && s.v) s.v[k] = (s.v[k] || 0) + (n || 1); };
    const rec = id => { const q = TQ(); return q && q.rec ? q.rec(id) : null; };
    const W4 = () => (TQ() && TQ().Q ? TQ().Q.W4 : null);
    const w4 = () => rec("W4");
    const w4Active = () => { const r = w4(); return !!r && r.s === "active"; };
    const w4Done = () => { const r = w4(); return !!r && r.s === "done"; };
    const stepOf = name => { const q = W4(); return q ? q.steps.findIndex(s => s.talk === name || s.check === name || s.vars === name) : -1; };
    const cur = () => { const r = w4(), q = W4(); if (!r || r.s !== "active" || !q) return ""; const st = q.steps[r.step]; return st ? st.talk || st.check || st.vars || "" : ""; };
    const at = name => cur() === name;
    const xp = (n, why) => T.call("Combat", "gainXp", n, why || "W4", true);
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const notePair = p => note(p[0], p[1]);
    const chapterEnded = () => { const s = ST(); try { return !!(s && s.chapterEnded && s.chapterEnded()); } catch (e) { return false; } };
    const siegeOn = () => { try { const A = T.api("Act3"); return !!(A && A.phase && A.phase() === "siege"); } catch (e) { return false; } };
    const siegeOver = () => { try { const A = T.api("Act3"); if (A && A.outcome && A.outcome()) return true; } catch (e) { /* (the flags) */ } const f = flags(); return !!(f.act3Held || f.act3Costly || f.act3Fallen); };
    const ugState = () => { const U = UG(); try { return U && U.state ? U.state() : null; } catch (e) { return null; } };
    const autoChecks = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    function complete(name, opts) { const q = TQ(); if (q && q.completeStep && at(name)) q.completeStep("W4", opts || {}); }

    // ------------------------------------------------------------------
    // Talk helpers (event commands; "> " the hero)
    // ------------------------------------------------------------------
    const LINE = 46, PAGE = 3;
    function wrap(text) {
        const out = [];
        let line = "";
        for (const w of String(text).split(/\s+/)) {
            if (!w) continue;
            if (line && (line + " " + w).length > LINE) { out.push(line); line = w; } else line = line ? line + " " + w : w;
        }
        if (line) out.push(line);
        return out;
    }
    function sayTo(out, spk, text) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""]));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l])));
        }
        return out;
    }
    function linesTo(out, spk, arr, vars) {
        for (const raw of [].concat(arr || [])) {
            if (!raw) continue;
            const s = fill(raw, vars);
            if (s.startsWith("> ")) sayTo(out, HERO, s.slice(2)); else sayTo(out, spk, s);
        }
        return out;
    }
    function choiceTo(out, labels, branches, cancel) {
        out.push(C(102, [labels, cancel === undefined ? labels.length - 1 : cancel, 0, 2, 0]));
        labels.forEach((l, i) => {
            out.push(C(402, [i, l]));
            for (const c of branches[i] || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + 1 }));
            out.push(C(0, [], 1));
        });
        out.push(C(404, []));
        return out;
    }
    const act = (out, args) => (out.push(C(355, ["Kasztelan.act(this, " + JSON.stringify(args) + ")"])), out);
    function run(interp, list) {
        if (!interp || !list || !list.length) return;
        const ev = $gameMap.event(interp.eventId());
        interp.setupChild(list.concat([C(0, [])]), ev ? ev.eventId() : 0);
    }
    // the hero's thoughts after a talk (bubbles over him, one by one)
    const thoughts = [];
    let thoughtAt = 0;
    function think(lines) { for (const l of [].concat(lines || [])) if (l) thoughts.push(String(l).replace(/^> /, "")); }
    function updateThoughts() {
        if (!thoughts.length || Graphics.frameCount < thoughtAt || !(SceneManager._scene instanceof Scene_Map) || $gameMap.isEventRunning() || $gameMessage.isBusy()) return;
        const t = thoughts.shift(), sb = SB();
        if (sb && sb.say) sb.say($gamePlayer, t, 230); else T.popup(t, { color: "#eceef0" });
        thoughtAt = Graphics.frameCount + 240;
    }
    const sayOver = (ch, text, frames) => { const sb = SB(); if (sb && sb.say && ch) sb.say(ch, text, frames || 200); };

    // ------------------------------------------------------------------
    // 6. Ród Kowali: the clues
    // ------------------------------------------------------------------
    const CLUES = [
        { key: "napis", note: "3" }, { key: "kowal", note: "6" }, { key: "wpis", note: "10d" }, { key: "przeor", note: "20c" },
        { key: "lista", note: "24", flags: ["chroniclesTaken", "chroniclesForAmbrozy", "chroniclesLeft", "ambrozyChronicles"] },
        { key: "kleofas", talk: "pustelnik" }, { key: "dziadek", talk: "grandpa" }
    ];
    // the clues the game shows on its own (the Order's notes read, the chronicles of the Archive) - kept once found
    function syncClues() {
        if (!has()) return 0;
        const s = S(), u = ugState(), notes = (u && u.notes) || {}, f = flags();
        for (const c of CLUES) {
            if (s.clues[c.key] || c.talk) continue;
            if ((c.note && notes[c.note]) || (c.flags || []).some(k => f[k])) s.clues[c.key] = day();
        }
        return clueCount();
    }
    const clueCount = () => CLUES.filter(c => S().clues[c.key]).length;
    function rodVars() {
        syncClues();
        const got = CLUES.filter(c => S().clues[c.key]).map(c => TX.clues[c.key]), n = got.length;
        return { n: Math.min(n, NEED), need: NEED, jest: n ? " (" + got.join(", ") + ")" : "", gdzie: n >= NEED ? TX.whereDone : TX.where };
    }
    function rodDone() {
        const s = S();
        if (s.rod) return;
        s.rod = day();
        const skad = CLUES.filter(c => s.clues[c.key]).map(c => TX.clues[c.key]).join(", ");
        think(TX.rodThink);
        return ["Ród Kowali", fill(TX.noteRod, { skad })];
    }
    function clueTalk(key, spk) {
        const out = [];
        if (key === "pustelnik") { linesTo(out, spk, TX.kleofas); return act(out, ["clue", "kleofas"]); }
        if (key === "grandpa") { linesTo(out, spk, TX.dziadek); return act(out, ["clue", "dziadek"]); }
        return null;
    }
    function clueFound(key) {
        const s = S();
        if (s.clues[key]) return;
        s.clues[key] = day();
        notePair(key === "kleofas" ? TX.noteKleofas : TX.noteDziadek);
        xp(40, "W4: " + TX.clues[key]);
        T.popup("Poszlaka: " + TX.clues[key], { top: true, color: "#ffe27a", sub: "Ród Kowali - " + Math.min(clueCount(), NEED) + " z " + NEED });
        autoChecks();
    }

    // ------------------------------------------------------------------
    // 7. The confrontation at the bar: tell or keep silent; told - his anger (the shut day) or, half-prepared, the night's talk at once
    // ------------------------------------------------------------------
    const talkHours = () => inHours(hour(), HOURS.talk);
    // W9's truth of his nights (the Truth Layer, floor 76): known and not yet told or kept
    function nightsPending() {
        const q = TQ(), r = rec("W9"), U = UG();
        let known = false;
        try { const t = U && U.truths ? U.truths() : {}; known = Object.keys(t).some(k => t[k] && t[k].who === "borgar"); } catch (e) { known = false; }
        if (!known || flag("borgarKnows") || flag("truthKept_borgar") || flag("truthTold_borgar")) return false;
        return !(r && r.t && r.t.res && r.t.res.borgar) && !!q;
    }
    const prepared = () => flag("w3Borgar") || flag("w4Faster") || flag("borgarKnows");
    const trustOk = () => {
        let shifts = 0, rep = 0;
        try { const TS = T.api("TavernShift"); shifts = TS && TS.stats ? TS.stats().done || 0 : 0; } catch (e) { shifts = 0; }
        try { const QB = T.api("QuestBoard"); rep = QB && QB.reputation ? QB.reputation() || 0 : 0; } catch (e) { rep = 0; }
        return shifts >= TRUST.shifts || rep >= TRUST.rep;
    };
    // how far he trusts the hero to go down with him: the song for him (W3 b), his nights told (W9, also now), the bar's evenings or
    // the tavern's fame; the Lord told first (W7 ch. 6) counts against. Two: he comes.
    function score(nightsNow) {
        const f = flags(), why = [], whyNot = [];
        let n = 0;
        if (f.w3Borgar || f.w4Faster) { n++; why.push(TX.whySong); }
        if (f.borgarKnows || nightsNow) { n++; why.push(TX.whyNights); }
        if (trustOk()) { n++; why.push(TX.whyShifts); } else whyNot.push(TX.whyNotShifts);
        if (f.w7LordFirst && !f.w7KlamstwoWyszlo) { n--; whyNot.unshift(TX.whyNotLord); }
        if (!whyNot.length) whyNot.push(TX.whyNotAny);
        return { n, ok: n >= 2, why: why.slice(0, 2), whyNot: whyNot.slice(0, 2) };
    }
    function confrontList(spk) {
        const out = [];
        if (!chapterEnded()) return linesTo(out, spk, TX.notYet);
        if (!talkHours()) return linesTo(out, spk, [pick(TX.notNow)]);
        linesTo(out, spk, TX.intro);
        linesTo(out, HERO, TX.introHero);
        linesTo(out, spk, [TX.ask]);
        return choiceTo(out, [TX.optTell, TX.optKeep, TX.optLater], [tellBranch(spk), keepBranch(spk), linesTo([], spk, TX.later)], 2);
    }
    function tellBranch(spk) {
        const out = [], cl = S().clues, f = flags(), nights = nightsPending(), ready = prepared();
        linesTo(out, HERO, TX.tellCore);
        if (cl.lista) linesTo(out, HERO, TX.tellLista);
        if (cl.wpis || cl.przeor || cl.kleofas || cl.napis) linesTo(out, HERO, TX.tellSlowa);
        if (cl.dziadek) linesTo(out, HERO, TX.tellDziadek);
        linesTo(out, HERO, TX.tellKlucz);
        if (nights) linesTo(out, HERO, TX.tellNoce);
        act(out, ["tell", nights ? 1 : 0]);
        if (f.w7LordFirst && !f.w7KlamstwoWyszlo) linesTo(out, spk, TX.lordFirst);
        if (ready) {
            linesTo(out, spk, f.w3Borgar || f.w4Faster ? TX.preparedSong : TX.preparedNights);
            return verdict(out, spk, nights);
        }
        linesTo(out, spk, TX.anger);
        return act(out, ["anger"]);
    }
    function keepBranch(spk) {
        const out = [];
        linesTo(out, HERO, TX.keepThink);
        linesTo(out, HERO, TX.keepSay);
        linesTo(out, spk, TX.keepBorgar);
        return act(out, ["keep"]);
    }
    // the grandmother's words, then the hero's ask - he comes along, or stays by the grate (by agreement / refusing, with the warning)
    function verdict(out, spk, nightsNow) {
        linesTo(out, spk, TX.grandma);
        if (flag("borgarKnows") || nightsNow) linesTo(out, spk, TX.grandmaNights);
        linesTo(out, spk, TX.grandmaEnd);
        linesTo(out, spk, [TX.verdictAsk]);
        const sc = score(nightsNow), come = [], stay = [];
        linesTo(come, HERO, TX.askCome);
        if (sc.ok) { linesTo(come, spk, sc.why.concat(TX.comeYes)); act(come, ["verdict", "idzie"]); }
        else { linesTo(come, spk, TX.comeNo.concat(sc.whyNot, TX.comeNoEnd)); act(come, ["verdict", "ostrzegl"]); }
        linesTo(stay, HERO, TX.askStay);
        linesTo(stay, spk, TX.stayYes);
        act(stay, ["verdict", "pilnuje"]);
        return choiceTo(out, [TX.optCome, TX.optStay], [come, stay], -1);
    }
    // the shut day: the next day (the talk before midnight) or this one (after it)
    function tell(nights) {
        const s = S();
        s.how = "tell";
        setFlag("borgarWie");
        if (nights) tellNights();
    }
    // his nights at the grate said in the same breath - W9's truth told (its reward and note, the W9 record's result)
    function tellNights() {
        const q = TQ();
        if (!q) return;
        try { if (!rec("W9")) q.autoChecks(); } catch (e) { /* (below) */ }
        const r = rec("W9"), f = q.FX && q.FX.w9Truth;
        if (r && r.s === "active" && f && f.act && q.Q.W9) { try { f.act(q.Q.W9, "tell:borgar"); } catch (e) { report("W9 tell", e); } }
        if (!flag("borgarKnows")) { setFlag("borgarKnows"); setFlag("truthTold_borgar"); }
    }
    function anger() {
        const s = S();
        s.closed = hour() >= 12 ? day() + 1 : day();
        setFlag("borgarZamknal");
        think(TX.angerThink);
        notePair(TX.noteAnger);
        complete("w4Konfrontacja", { to: stepOf("w4Piwnica"), reward: { xp: 100 } });
    }
    function keep() {
        const s = S();
        s.how = "keep"; s.stance = "niewie";
        setFlag("borgarNieWie");
        complete("w4Konfrontacja", { to: stepOf("w4Serce"), reward: { xp: 80, note: TX.noteKeep } });
    }
    function decide(how) {
        const s = S();
        if (s.stance && s.stance !== "niewie") return;
        s.stance = how === "idzie" ? "idzie" : "pilnuje";
        s.verdict = day();
        if (how === "idzie") setFlag("borgarIdzie");
        else { setFlag("borgarPilnuje"); if (how === "ostrzegl") { setFlag("borgarOstrzegl"); s.warned = day(); } }
        const tp = TX.tops[how];
        if (tp) T.popup(tp[0], { top: true, color: "#ffe27a", sub: tp[1] });
        const name = at("w4Piwnica") ? "w4Piwnica" : "w4Konfrontacja";
        complete(name, { to: stepOf("w4Serce"), reward: { xp: 200, opinion: how === "idzie" ? 2 : 0, note: TX.notes[how] } });
        sync();
    }

    // ------------------------------------------------------------------
    // The shut day, the cellar's night, the posts (Borgar away from the bar 1-5)
    // ------------------------------------------------------------------
    const closedBarNow = () => !!S().closed && day() === S().closed && inHours(hour(), HOURS.bar);
    const doorClosedNow = () => !!S().closed && day() === S().closed && inHours(hour(), HOURS.door) && !siegeOn();
    const cellarNightNow = () => at("w4Piwnica") && !!S().closed && now() >= S().closed * 24 + HOURS.cellar[0] && inHours(hour(), HOURS.cellar) && !siegeOn();
    // the Heart's ending made Borgar its guardian: he sits on the bench before it (Underground.js) - no posts up here any more
    const guardianNow = () => { const u = ugState(); return !!(u && u.ending && u.ending.kind === "straznik" && u.ending.guardian === "borgar"); };
    const stance = () => S().stance || "";
    const postsOn = () => (stance() === "idzie" || stance() === "pilnuje") && !guardianNow();
    const postNow = () => postsOn() && inHours(hour(), HOURS.post) && !siegeOn();
    const barAway = () => (cellarNightNow() || postNow()) && !siegeOn();
    const cellarBorgarNow = () => cellarNightNow() || (stance() === "pilnuje" && postNow());
    const cellarFireOn = () => at("w4Piwnica") || (stance() === "pilnuje" && postsOn());
    const postBorgarNow = () => stance() === "idzie" && postNow();

    // the events (Tawerna.inject 540-559): built with the map's data; shown / hidden by the hour (sync)
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function eventData(id, name, x, y, o) {
        const img = o.img || ["", 0, 2, 0];
        const page = { conditions: Object.assign({}, BLANK), directionFix: !!o.fix, image: { tileId: 0, characterName: img[0], direction: o.dir || img[2], pattern: img[3], characterIndex: img[1] },
            list: [C(355, ["Kasztelan.act(this);"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: o.priority === undefined ? 1 : o.priority, stepAnime: !!o.anim, through: !!o.through, trigger: 0, walkAnime: o.walk !== false };
        return { id, name: "W4: " + name, note: "<Kasztelan:" + o.key + ">" + (o.note || ""), pages: [page], x, y };
    }
    const FIRE_LIGHT = "<Light:170,255,150,70><LightFlicker:0.16,255,110,40><LightHeight:26>";
    const BORGAR_NOTE = "<Bust:People3_5><BustName:Borgar>";
    function build(data, mapId) {
        const out = [];
        if (!has()) return out;
        if (mapId === MAP.cellar && (at("w4Piwnica") || (stance() === "pilnuje" && postsOn()))) {
            const b = POS.cellarBorgar, f = POS.cellarFire;
            out.push(eventData(EV.cellarBorgar, "Borgar", b[0], b[1], { key: "borgar", img: ["$Npc_Borgar", 0, 2, 1], dir: b[2], note: BORGAR_NOTE }));
            out.push(eventData(EV.cellarFire, "Kosz z żarem Borgara", f[0], f[1], { key: "zar", img: ["!Decoration", 0, 2, 0], fix: true, anim: true, walk: false, note: FIRE_LIGHT }));
        } else if (mapId === MAP.floor10 && stance() === "idzie" && postsOn()) {
            const b = POS.postBorgar, f = POS.postFire, k = POS.postBasket;
            out.push(eventData(EV.postBorgar, "Borgar", b[0], b[1], { key: "post", img: ["$Npc_Borgar", 0, 2, 1], dir: b[2], note: BORGAR_NOTE }));
            out.push(eventData(EV.postFire, "Ognisko Borgara", f[0], f[1], { key: "ognisko", img: ["!Decoration", 2, 4, 0], fix: true, anim: true, walk: false, note: FIRE_LIGHT.replace("26", "14") }));
            out.push(eventData(EV.postBasket, "Kosz Borgara", k[0], k[1], { key: "kosz", img: ["!Decoration_static_2", 0, 2, 2], fix: true, walk: false }));
        }
        return out.filter(e => e.x < data.width && e.y < data.height);
    }
    T.inject([MAP.cellar, MAP.floor10], { ids: IDS, owner: PLUGIN, build });

    const evOf = id => (window.$gameMap ? $gameMap.event(id) : null);
    const keyOf = ev => { const m = ev && ev.event && ev.event() && /<Kasztelan:(\w+)>/.exec(ev.event().note || ""); return m ? m[1] : ""; };
    function remember(ev) { if (ev && ev._w4prio === undefined) { ev._w4prio = ev._priorityType; ev._w4through = ev.isThrough(); } }
    function showEv(ev) {
        if (!ev || ev._w4hidden === false) return;
        remember(ev);
        ev.setTransparent(false); ev.setThrough(!!ev._w4through); ev._priorityType = ev._w4prio === undefined ? 1 : ev._w4prio;
        ev._w4hidden = false;
    }
    function hideEv(ev) {
        if (!ev || ev._w4hidden === true) return;
        remember(ev);
        ev._w4hidden = true;
        ev.setTransparent(true); ev.setThrough(true); ev._priorityType = 0;
    }
    const hidden = ev => !!ev && ev._w4hidden === true;
    const barBorgar = () => { const s = ST(); try { return s && s.borgarEvent ? s.borgarEvent() : null; } catch (e) { return null; } };
    function sync() {
        if (!has()) return;
        if (onMap(MAP.cellar)) {
            const b = evOf(EV.cellarBorgar), f = evOf(EV.cellarFire);
            if (b) { if (cellarBorgarNow()) showEv(b); else hideEv(b); }
            if (f) { if (cellarFireOn()) showEv(f); else hideEv(f); }
        } else if (onMap(MAP.floor10)) {
            const b = evOf(EV.postBorgar);
            if (b) { if (postBorgarNow()) showEv(b); else hideEv(b); }
            for (const id of [EV.postFire, EV.postBasket]) { const e = evOf(id); if (e) { if (stance() === "idzie" && postsOn()) showEv(e); else hideEv(e); } }
        } else if (onMap(MAP.tavern) && !siegeOn()) {
            const b = barBorgar();
            if (b) { if (barAway()) hideEv(b); else if (hidden(b)) showEv(b); }
        }
    }
    // the parallel "Atmosfera - Borgar" of the tavern shows balloons over him: not while he is away
    const _requestBalloon = Game_Temp.prototype.requestBalloon;
    Game_Temp.prototype.requestBalloon = function(target) {
        if (target instanceof Game_Event && hidden(target)) return;
        return _requestBalloon.apply(this, arguments);
    };

    // ------------------------------------------------------------------
    // The tavern's own events answer in code (the user's Map001 untouched): Borgar and the counter on the shut day / while he is away;
    // the cellar's grate asks first while his warning stands
    // ------------------------------------------------------------------
    const STUB_CLOSED = [C(355, ["Kasztelan.closed(this)"]), C(0, [])];
    const STUB_GRATE = [C(355, ["Kasztelan.grate(this)"]), C(0, [])];
    const STUB_DOOR = [C(355, ["Kasztelan.door(this)"]), C(0, [])];
    const counterTag = ev => {
        if (ev._w4counter === undefined) {
            const d = ev.event(), p = d && d.pages ? d.pages.map(pg => JSON.stringify(pg.list)).join("") : "";
            ev._w4counter = /<Tavern:meal[\s>]/.test(p + ((d && d.note) || ""));
        }
        return ev._w4counter;
    };
    const grateOf = ev => { const d = ev.event(); return !!d && /^Stara krata zakonu/.test(d.name || ""); };
    const doorOf = ev => { const d = ev.event(); return !!d && /^Drzwi tawerny/.test(d.name || ""); };
    let grateGo = false;   // (the warning answered "Zejdź": the original commands once)
    const _Game_Event_list = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        if (window.$gameMap && has() && this._mapId === $gameMap.mapId()) {
            const m = this._mapId;
            if (m === MAP.tavern && !siegeOn()) {
                const S0 = ST(), role = S0 && S0.roleOf ? S0.roleOf(this) : null;
                if (role === "borgar" && (closedBarNow() || hidden(this))) return STUB_CLOSED;
                if (role !== "borgar" && (closedBarNow() || barAway()) && counterTag(this)) return STUB_CLOSED;
            } else if (m === MAP.town && doorClosedNow() && doorOf(this)) return STUB_DOOR;
            else if (m === MAP.cellar && !grateGo && grateOf(this) && this.findProperPageIndex() >= 1 && S().warned && !S().fired && !S().back) return STUB_GRATE;
        }
        return _Game_Event_list.call(this);
    };
    function closedTalk(interp) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev) return;
        const S0 = ST(), role = S0 && S0.roleOf ? S0.roleOf(ev) : null;
        if (role === "borgar" && !hidden(ev)) { run(interp, linesTo([], { id: ev.eventId(), name: "Borgar" }, TX.closedBar)); return; }
        T.popup(closedBarNow() ? TX.closedCounter : TX.awayCounter, { kind: "info" });
    }
    function grateTalk(interp) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev) return;
        const out = [], yes = [];
        linesTo(out, HERO, TX.grateWarn);
        linesTo(out, HERO, [TX.grateAsk]);
        act(yes, ["fire"]);
        yes.push(C(355, ["Kasztelan.grateDown(this)"]));
        choiceTo(out, [TX.optDown, TX.optUp], [yes, []], 1);
        run(interp, out);
    }
    // "Zejdź": the grate's own commands (its open page: down to the castle's ruins)
    function grateDown(interp) {
        const ev = interp && $gameMap.event(interp.eventId());
        if (!ev) return;
        grateGo = true;
        let list = null;
        try { list = (ev.list() || []).slice(); } finally { grateGo = false; }
        if (!list || !list.length) return;
        if (list[list.length - 1].code === 0) list.pop();
        run(interp, list);
    }
    // the town's door of the tavern (Map008 "Drzwi tawerny") on the shut day: a popup over the hero, a step back - only the door:
    // the scenes' own transfers (the Heart's film, F9) go in as always
    function doorTalk(interp) {
        if (!has()) return;
        T.popup(TX.closedDoor, { kind: "info" });
        stepBack($gamePlayer);
    }
    function stepBack(p) {
        const back = { 2: 8, 4: 6, 6: 4, 8: 2 }[p.direction()] || 2;
        const x = $gameMap.roundXWithDirection(p.x, back), y = $gameMap.roundYWithDirection(p.y, back);
        if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f)) { p.locate(x, y); p.setDirection(back); }
    }
    // the shifts (Story.js's Borgar asks): the shut day; the hero went down after the warning (till the siege is over and they made up)
    function shiftBan() {
        if (!has()) return null;
        if (closedBarNow()) return TX.shiftClosed;
        const s = S();
        if (s.fired && !s.back) return TX.shiftFired;
        return null;
    }
    function fire() {
        const s = S();
        if (!s.warned || s.fired || s.back) return;
        s.fired = day();
        setFlag("borgarZwolnil");
        notePair(TX.noteFired);
        think(TX.firedThink);
    }

    // ------------------------------------------------------------------
    // The injected events and the talks' script: Kasztelan.act(this) - by the event; Kasztelan.act(this, [what, ...]) - from a talk
    // ------------------------------------------------------------------
    function actCall(interp, args) {
        if (!has()) return;
        try {
            if (Array.isArray(args)) return actArgs(args, interp);
            if (!interp) return;
            const ev = $gameMap.event(interp.eventId());
            if (!ev || hidden(ev)) return;
            const k = keyOf(ev), spk = { id: ev.eventId(), name: "Borgar" };
            if (k === "borgar") {
                if (cellarNightNow()) {
                    const out = linesTo([], spk, TX.cellarIntro);
                    run(interp, verdict(out, spk, false));
                } else run(interp, linesTo([], spk, [pick(TX.cellarGuard)]));
            } else if (k === "post") {
                const s = S(), first = !s.postSeen;
                s.postSeen = s.postSeen || day();
                run(interp, linesTo([], spk, first ? TX.postFirst : [pick(TX.postLines)]));
            } else if (k === "kosz") basket(interp);
            else if (k === "zar") T.popup(TX.fireCellar, { kind: "info" });
            else if (k === "ognisko") T.popup(TX.firePost, { kind: "info" });
        } catch (e) { report("act", e); }
    }
    function actArgs(args, interp) {
        const [what, a] = args;
        if (what === "clue") clueFound(a);
        else if (what === "tell") tell(!!a);
        else if (what === "anger") anger();
        else if (what === "keep") keep();
        else if (what === "verdict") decide(a);
        else if (what === "fire") fire();
        else if (what === "back") reconcile();
    }
    // Borgar's basket at the tenth gate: bread and water once a day
    function basket(interp) {
        const s = S();
        if (s.basket === day()) { T.popup(TX.basketEmpty, { kind: "info" }); return; }
        s.basket = day();
        const out = linesTo([], HERO, TX.basketTake);
        run(interp, out);
        if (window.$dataItems && $dataItems[BREAD]) {
            $gameParty.gainItem($dataItems[BREAD], 1);
            T.popup($dataItems[BREAD].name + " ×1", { icon: $dataItems[BREAD].iconIndex || BREAD_ICON, kind: "good" });
        }
        const N = T.api("Needs") || window.Needs;
        let got = 0;
        try { got = N && N.drink ? N.drink(WATER) : 0; if (N && N.fillSkin) N.fillSkin(); } catch (e) { got = 0; }
        if (got > 0) T.popup("Nawodnienie +" + got, { kind: "good" });
    }
    // after the siege of Act III: back behind the bar
    const reconcileReady = () => !!S().fired && !S().back && siegeOver() && !barAway();
    function reconcile() {
        const s = S();
        if (!s.fired || s.back) return;
        s.back = day();
        setFlag("borgarPrzyjal");
        notePair(TX.noteReconcile);
        xp(60, "W4");
    }

    // ------------------------------------------------------------------
    // TownQuests' W4 steps (TownQuests_Data.js): w4Rod, w4Konfrontacja, w4Piwnica, w4Serce
    // ------------------------------------------------------------------
    function serceText() {
        const s = S(), t = TX.serce;
        let out = t[s.stance] || t.niewie;
        if (s.stance === "pilnuje" && s.warned) out += s.back ? t.back : s.fired ? t.fired : t.warned;
        return out;
    }
    function endNow() {
        const u = ugState(), s = S(), U = UG();
        if (!u || !u.ending) return false;
        if (U && U.film && U.film.cinema) return false;   // (the ending's film first - the arc's popup after it)
        if (s.end) return true;
        const g = u.ending.kind === "straznik" && u.ending.guardian === "borgar";
        s.end = g ? "guardian" : s.stance || "none";
        notePair(TX.endNote[s.end] || TX.endNote.none);
        return true;
    }
    function hookQuests() {
        const q = TQ();
        if (!q || !q.FX || hookQuests.done) return;
        hookQuests.done = true;
        Object.assign(q.FX, {
            // 6: three clues; Kleofas and grandpa tell theirs in a talk
            w4Rod: {
                vars: () => rodVars(),
                check(qq, r) {
                    if (syncClues() < NEED) return false;
                    const n = rodDone();
                    if (n) r.t.rodNote = n;
                    return true;
                },
                talk(qq, r, st, key, spk) {
                    if (!CLUES.some(c => c.talk === key && !S().clues[c.key])) return null;
                    const list = clueTalk(key, spk);
                    return list ? { ready: true, list } : null;
                },
                ready: (qq, r, st, key) => (CLUES.some(c => c.talk === key) ? CLUES.some(c => c.talk === key && !S().clues[c.key]) : null)
            },
            // 7: at the bar after closing
            w4Konfrontacja: {
                borgarTopic: () => TX.topic,
                borgarList: (qq, r, st, spk) => confrontList(spk),
                ready: (qq, r, st, key) => (key === "borgar" ? chapterEnded() && talkHours() && !barAway() : null)
            },
            // 7: the shut day and the night in the cellar
            w4Piwnica: { vars: () => ({ dzien: S().closed || day() }) },
            // 8: the Heart - any of its endings closes the arc; after the siege the fired hero is taken back
            w4Serce: {
                vars: () => ({ serce: serceText() }),
                check: () => endNow(),
                borgarTopic: () => (reconcileReady() ? TX.reconcileTopic : null),
                borgarList(qq, r, st, spk) { const out = []; if (!reconcileReady()) return out; linesTo(out, spk, TX.reconcile); return act(out, ["back"]); },
                ready: (qq, r, st, key) => (key === "borgar" ? reconcileReady() : null)
            }
        });
        // the step's own reward function (TownQuests: st.rewardFx) - the chapter's note goes with the step's popup
        q.FX.w4RodReward = { reward: (qq, r) => ({ note: r.t.rodNote || null }) };
        // W9's truth of his nights told after W4: Borgar knows his blood already
        try {
            const t = q.Q && q.Q.W9 && q.Q.W9.truths && q.Q.W9.truths.borgar;
            if (t && !(t.tellIf || []).some(x => x[0] === "borgarWie")) t.tellIf = (t.tellIf || []).concat([["borgarWie", TX.w9After]]);
        } catch (e) { report("W9 tellIf", e); }
        // the town's remarks once
        try {
            const D = window.TownQuestsData;
            if (D && D.REMARKS) for (const m of TX.remarks) if (!D.REMARKS.some(o => o.id === m.id)) D.REMARKS.push(m);
        } catch (e) { report("remarks", e); }
    }
    hookQuests();

    // ------------------------------------------------------------------
    // The frame, the maps, the Heart's lock, a descent after the warning
    // ------------------------------------------------------------------
    T.onMapUpdate((scene, n) => {
        if (scene !== SceneManager._scene || !has()) return;
        if (n % 20 === 0) sync();
        updateThoughts();
        // Borgar's word when the hero comes by his post
        if (n % 30 === 0) {
            const b = onMap(MAP.cellar) ? evOf(EV.cellarBorgar) : onMap(MAP.floor10) ? evOf(EV.postBorgar) : null;
            if (b && !hidden(b) && !$gameMap.isEventRunning() && Math.hypot(b.x - $gamePlayer.x, b.y - $gamePlayer.y) < 3.5) {
                const s = S(), k = "bark" + $gameMap.mapId();
                if (s[k] !== day()) { s[k] = day(); sayOver(b, onMap(MAP.cellar) && !cellarNightNow() ? pick(TX.cellarGuardDown) : "Siadaj. Ogień jest.", 220); }
            }
        }
    }, { owner: PLUGIN, name: "update" });
    T.on("mapReady", () => {
        if (!has()) return;
        for (const id of [EV.cellarBorgar, EV.cellarFire, EV.postBorgar, EV.postFire, EV.postBasket]) { const e = evOf(id); if (e) { e._w4hidden = undefined; hideEv(e); } }
        sync();
        // a descent after the warning by any way (the grate, the diggers' tunnel): the shifts are gone
        const U = UG(), m = $gameMap.mapId();
        let down = m === MAP.ruins;
        try { down = down || !!(U && U.isUnderground && U.isUnderground(m)); } catch (e) { /* (as is) */ }
        if (down && S().warned && !S().fired && !S().back) fire();
        if (w4Active()) { syncClues(); autoChecks(); }
    }, { owner: PLUGIN });
    T.on("undergroundLock", e => {
        if (!has() || !e || e.lock !== "key" || S().keyLock) return;
        S().keyLock = day();
        notePair(TX.noteKeyLock);
        think(TX.keyLock);
    }, { owner: PLUGIN });
    T.on("undergroundEnding", () => { if (has()) autoChecks(); }, { owner: PLUGIN });
    T.on("load", () => { thoughts.length = 0; thoughtAt = 0; grateGo = false; }, { owner: PLUGIN });
    T.on("newGame", () => { thoughts.length = 0; thoughtAt = 0; grateGo = false; }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // For the Heart's world (Underground.js), its epilogue and Act III
    // ------------------------------------------------------------------
    function forWorld() {
        const s = S();
        return { stance: s.stance || null, told: s.how === "tell", closed: !!s.closed, warned: !!s.warned, fired: !!s.fired && !s.back, back: !!s.back,
            clues: clueCount(), keyLock: !!s.keyLock };
    }
    function epilogue(kind, w, who) {
        const s = S(), E = TX.epilog, guardian = kind ? kind === "straznik" && who === "borgar" : guardianNow();
        if (guardian) return null;
        if (s.stance === "pilnuje" && s.fired && !s.back) return E.fired;
        return E[s.stance] || null;
    }

    // ------------------------------------------------------------------
    // F9 ("Wyspa i fabuła"): straight to a chapter - the debt, the flags, the things, the hour, the place
    // ------------------------------------------------------------------
    const JUMP = {
        1: { ch: 1, step: 0, hour: 11, go: [MAP.tavern, 52, 31, 8] },
        2: { ch: 2, step: 1, hour: 12, go: [MAP.cairn, 8, 7, 8] },
        3: { ch: 3, step: 2, hour: 10, go: [MAP.town, 8, 50, 4] },
        4: { ch: 4, step: 4, hour: 12, go: [MAP.cellar, 15, 3, 8] },
        5: { ch: 5, step: 5, hour: 12, go: [MAP.tavern, 52, 31, 8] },
        6: { ch: 6, name: "w4Rod", hour: 10, go: [MAP.house, 10, 7, 8] },
        7: { ch: 7, name: "w4Konfrontacja", hour: 23.5, go: [MAP.tavern, 52, 31, 8] },
        8: { ch: 7, name: "w4Piwnica", hour: 23.5, go: [MAP.cellar, 14, 4, 6] },
        9: { ch: 8, name: "w4Serce", hour: 1.5, go: [MAP.floor10, 5, 13, 2] }
    };
    function debugJump(i) {
        const j = JUMP[i], q = TQ(), St = ST();
        if (!j || !q || !has() || !St || !St.active || !St.active()) return null;
        const ss = St.state(), s = S(), U = UG();
        if (!chapterEnded()) { ss.flags.hired = true; ss.paid = ss.debt; if (St.chapterDone) St.chapterDone(); }
        const idx = j.name ? stepOf(j.name) : j.step;
        if (idx < 0) return null;
        // the things of the chapters before
        if (idx === 1) vgive("klucz_borgar", 1);
        if (idx === 1 && window.$dataItems && $dataItems[62]) $gameParty.gainItem($dataItems[62], 1);
        if (idx === 2) {
            vgive("klucz_borgar", 1); vgive("klucz_kopiec", 1);
            if ($dataItems[86]) $gameParty.gainItem($dataItems[86], 1);
            if ($dataItems[79]) $gameParty.gainItem($dataItems[79], 2);
        }
        if (idx >= 4 && vcount("klucz_kasztelana") <= 0) vgive("klucz_kasztelana", 1);
        if (U && U.open && U.close) { if (idx === 4) U.close(); else if (idx >= 5) U.open(); }
        if (idx >= 6) setFlag("borgarSaying");
        if (j.ch >= 7) {   // (three clues: the Order's notes of floors 3, 6 and 10 read)
            const u = ugState();
            if (u && u.notes) for (const k of ["3", "6", "10d"]) u.notes[k] = true;
            syncClues();
            if (!s.rod) s.rod = day();
        }
        if (i === 8) { s.how = "tell"; setFlag("borgarWie"); setFlag("borgarZamknal"); s.closed = day(); }
        if (i === 9) { s.how = "tell"; setFlag("borgarWie"); if (!s.stance) { s.stance = "idzie"; s.verdict = day(); setFlag("borgarIdzie"); } }
        if (i <= 7) { s.stance = ""; s.how = ""; s.closed = 0; }
        const r = q.rec("W4");
        if (!r || r.s !== "active") q.start("W4", idx);
        else { r.step = idx; r.sday = day(); }
        $gameSystem.setDayNightHour(j.hour);
        if (q.refreshMarkers) q.refreshMarkers();
        return j.go;
    }

    // ------------------------------------------------------------------
    // API
    // ------------------------------------------------------------------
    window.Kasztelan = T.register(PLUGIN, {
        TX, POS, EV, HOURS, JUMP, CLUES, NEED, state: () => S(), act: actCall, closed: closedTalk, grate: grateTalk, grateDown, door: doorTalk,
        shiftBan, forWorld, epilogue, debugJump, sync, syncClues, clueCount, score, stance, step: () => cur(),
        closedNow: () => closedBarNow(), doorClosed: () => doorClosedNow(), cellarNight: () => cellarNightNow(), barAway: () => barAway(),
        nightsPending, prepared, reconcileReady, f9Name: i => TX.f9[i] || ""
    });
})();
