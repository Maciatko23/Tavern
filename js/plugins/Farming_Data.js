//=============================================================================
// Farming_Data.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Dane: uprawy (CROPS), budowle z recepturami (BUILDINGS) i receptury robione gołymi rękami bez budynku (HAND_RECIPES) dla Farming.js. Sam nic nie robi - wczytaj go PRZED Farming. v1.0.0
 * @author Claude
 *
 * @help
 * ============================================================================
 * Farming_Data.js
 * ============================================================================
 * Same tabele danych, które wcześniej siedziały w Farming.js: CROPS (rośliny),
 * BUILDINGS (budowle, w tym ich receptury craftingu) i HAND_RECIPES (receptury
 * robione gołymi rękami, bez żadnego budynku). Nową roślinę albo budowlę
 * dopisuje się TUTAJ, nie w Farming.js.
 *
 * Farming.js wywołuje Farming_Data.build(ITEM) (ITEM to tabela id przedmiotów
 * zbudowana z parametrów wtyczki Farming) i dostaje z powrotem obiekt
 * { CROPS, BUILDINGS, HAND_RECIPES }. Dlatego ten plik musi się wczytać
 * PRZED Farming (w plugins.js jest wpisany tuż nad nim).
 * ============================================================================
 */

(() => {
    "use strict";

    function build(ITEM) {
    // ------------------------------------------------------------------
    // Content tables. Add your own crops / buildings here.
    // ------------------------------------------------------------------
    // seed / produce: item ids. days: growth time. yield / seeds: [min, max] items
    // gained on harvest. row: the crop's row in img/system/Farm_Crops.png (4 stages).
    // seasons: indices into SEASON_NAMES this crop can be sown in (0 spring .. 3 winter).
    const CROPS = {
        potato: { name: "Ziemniaki", seed: 67, produce: 71, days: 4, yield: [2, 4], seeds: [0, 2], row: 0, seasons: [0, 1] },
        carrot: { name: "Marchew", seed: 68, produce: 72, days: 3, yield: [2, 3], seeds: [0, 2], row: 1, seasons: [0, 2] },
        cabbage: { name: "Kapusta", seed: 69, produce: 73, days: 5, yield: [1, 2], seeds: [0, 2], row: 2, seasons: [2, 3] },
        barley: { name: "Jęczmień", seed: 70, produce: 74, days: 6, yield: [3, 5], seeds: [1, 2], row: 3, seasons: [1, 2] }
    };

    // cost: [[item id, count], ...]. w, h: size in tiles (h = 1 when missing; the building stands on its bottom row and its picture rises
    // above it). legacy: the size and picture of buildings put up before the sizes grew (they have no b.v). yard: a fenced field for animals
    // (fence on the outer ring, gate in the bottom row at column gate, the hut inside at hut, the animals of Livestock.js walk in the rest).
    // ventX: px right of the middle of the picture where smoke rises. image: img/system file (null =
    // drawn by the plugin, like the fence). rest: stamina restored when used.
    // hits: blows of the hammer on its building site (without it: half the stamina, at least 2).
    // produce: { item, amount, period (days), cap } items the building makes.
    // slots: a storage chest, this many kinds of items (up to 99 of each).
    // recipes: a crafting station. { id, name, inputs: [[item, n]...], output: [item, n],
    //   hours (game hours), stamina, desc }. One job at a time; it keeps running while
    //   the player is elsewhere. doing: what the running job is called in the menu, under the building's name ("Trwa wypalanie").
    //   vent: px above the foot of the picture where smoke rises. ember: { x, y, scale } the fire
    //   opening (px from the middle / above the foot) where the station glows and lights the night while a job burns.
    const BUILDINGS = {
        // The first building of the game: only what lies on the ground (sticks, stones, flax) - no wood, no planks,
        // because the axe that cuts wood is made here. Every tool is made and mounted on this table (all manual recipes).
        workbench: { name: "Warsztat", cost: [[ITEM.branch, 10], [ITEM.stone, 4], [ITEM.fiber, 4]], w: 2, h: 1, stamina: 9, hits: 30, image: "Farm_Workbench_L", legacy: { w: 2, h: 1, image: "Farm_Workbench" }, indoor: true, startSe: "Hammer",
            recipes: [
                { id: "axe_stone", name: "Zrób kamienną siekierę", inputs: [[ITEM.branch, 5], [ITEM.stone, 2], [ITEM.fiber, 3]], output: [ITEM.axe, 1], manual: true, unique: true, also: [ITEM.ironAxe],
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Ostry kamień przywiązany lnem do gałęzi. Ścina drzewa, rozrąbuje kłody i krzaki." },
                { id: "pick_stone", name: "Zrób kamienny kilof", inputs: [[ITEM.wood, 2], [ITEM.branch, 3], [ITEM.stone, 3]], output: [ITEM.pickaxe, 1], manual: true, unique: true, also: [ITEM.ironPick],
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Trzonek z drewna, obwiązanie z gałęzi i kamienny grot. Rozbija duże skały i żyły rudy." },
                { id: "shovel", name: "Zrób kamienną łopatę", inputs: [[ITEM.wood, 2], [ITEM.branch, 1], [ITEM.stone, 2]], output: [ITEM.shovel, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Płaski kamień przywiązany do długiego kija. Wykopie ziemię i pieńki." },
                { id: "rake", name: "Zrób grabie", inputs: [[ITEM.wood, 1], [ITEM.branch, 4]], output: [ITEM.rake, 1], manual: true, unique: true,
                    hours: 1, stamina: 3, startSe: "Item1", desc: "Kilka gałęzi na drewnianym trzonku. Do grabienia ziemi przed orką." },
                { id: "hoe", name: "Zrób motykę", inputs: [[ITEM.wood, 1], [ITEM.branch, 1], [ITEM.stone, 3]], output: [ITEM.hoe, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Kamienne ostrze na krótkim trzonku. Do orania zagrabionej ziemi." },
                { id: "knife", name: "Zrób nóż kamienny", inputs: [[ITEM.wood, 1], [ITEM.stone, 2], [ITEM.branch, 1]], output: [ITEM.knifeStone, 1], manual: true, unique: true, also: [ITEM.knifeIron],
                    hours: 1, stamina: 3, startSe: "Hammer", desc: "Łupany kamień na drewnianej rękojeści. Do oprawiania zwierzyny." },
                { id: "rod", name: "Zrób wędkę", inputs: [[ITEM.wood, 2], [ITEM.rope, 2], [ITEM.branch, 1]], output: [ITEM.rod, 1], manual: true, unique: true,
                    hours: 1, stamina: 3, startSe: "Hammer", desc: "Długi kij, żyłka z liny i haczyk z drzazgi. Do łowienia w stawie." },
                { id: "saw", name: "Zmontuj piłę", inputs: [[ITEM.sawBlade, 1], [ITEM.wood, 2], [ITEM.rope, 1]], output: [ITEM.saw, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Żelazne ostrze na drewnianej rączce. W tartaku tnie deski szybciej i daje ich więcej." },
                { id: "axe_iron", name: "Zmontuj żelazną siekierę", inputs: [[ITEM.axeHead, 1], [ITEM.planks, 1]], output: [ITEM.ironAxe, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Żelazna głowica na mocnym styliskiu. Zastępuje kamienną siekierę: drzewa, kłody i krzaki padają o jedną trzecią szybciej, a uderzenia kosztują mniej sił." },
                { id: "pick_iron", name: "Zmontuj żelazny kilof", inputs: [[ITEM.pickHead, 1], [ITEM.planks, 1]], output: [ITEM.ironPick, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Żelazny grot na mocnym trzonku. Zastępuje kamienny kilof: skały i żyły rudy pękają o jedną trzecią szybciej, a uderzenia kosztują mniej sił." },
                { id: "sling", name: "Zrób procę", inputs: [[ITEM.rope, 1], [ITEM.fiber, 2], [ITEM.branch, 2]], output: [ITEM.sling, 1], manual: true, unique: true,
                    hours: 1, stamina: 3, startSe: "Item1", desc: "Sznur z lnianą kieszonką na kamień. Ustrzelisz nią zająca, a ze skóry zrobisz legowisko. Strzelasz w trybie walki (Tab) klawiszem O, a amunicją są kamienie." },
                { id: "bow", name: "Zrób łuk", inputs: [[ITEM.wood, 2], [ITEM.rope, 1], [ITEM.sinew, 2], [ITEM.rawHide, 1]], output: [ITEM.bow, 1], manual: true, unique: true,
                    hours: 2, stamina: 5, startSe: "Hammer", desc: "Giętkie drewno, cięciwa ze ścięgien i lina, skórzany uchwyt. Bije dalej i mocniej niż proca, także w jelenia. Potrzebuje strzał." },
                { id: "arrows", name: "Zrób strzały", inputs: [[ITEM.branch, 3], [ITEM.stone, 2], [ITEM.fiber, 2]], output: [ITEM.arrows, 6], manual: true,
                    hours: 1, stamina: 3, startSe: "Item1", desc: "Proste gałązki z kamiennym grotem i lnianym opierzeniem. Sześć sztuk naraz." },
                { id: "arrows_feather", name: "Zrób strzały z lotkami", inputs: [[ITEM.branch, 3], [ITEM.stone, 2], [ITEM.feathers, 3]], output: [ITEM.arrows, 12], manual: true,
                    hours: 1, stamina: 3, startSe: "Item1", desc: "Te same gałązki i groty, ale z lotkami z prawdziwych piór (ptaki z procy): dwanaście sztuk naraz." },
                { id: "spear", name: "Zrób oszczep", inputs: [[ITEM.wood, 1], [ITEM.stone, 2], [ITEM.rope, 1]], output: [ITEM.spear, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Długie drzewce z ostrym kamiennym grotem przywiązanym liną. Broń z najdłuższym zasięgiem: w trybie walki (Tab) szybkie pchnięcia klawiszem O (ponad 2 pola), przytrzymany O - mocne pchnięcie." },
                { id: "club", name: "Zrób pałkę", inputs: [[ITEM.wood, 1], [ITEM.fiber, 1]], output: [ITEM.club, 1], manual: true, unique: true,
                    hours: 1, stamina: 3, startSe: "Hammer", desc: "Gruba, sękata gałąź z uchwytem owiniętym lnem. Najprostsza broń: słabsza od siekiery, ale szybka i lekka - w trybie walki (Tab) atak klawiszem O, seria ciosów, przytrzymany O - mocny cios." },
                { id: "shield", name: "Zrób drewnianą tarczę", inputs: [[ITEM.wood, 2], [ITEM.branch, 2], [ITEM.rope, 2]], output: [ITEM.shield, 1], manual: true, unique: true,
                    hours: 2, stamina: 5, startSe: "Hammer", desc: "Grube deski związane liną, z uchwytem. Wystarczy mieć ją w torbie: w trybie walki (Tab) klawisz P zasłania (przyjmuje trzy czwarte ciosu i mniej męczy), P tuż przed ciosem odbija atak." }
            ],
            repairs: true,   // plus one "Napraw: ..." line for every tool that has been used (Durability.js)
            desc: "Stół, na którym powstają, są montowane i naprawiane wszystkie narzędzia: kamienne od razu, a żelazne z części wykutych w kuźni." },
        fence: { name: "Płot", cost: [[ITEM.planks, 1]], w: 1, stamina: 3, hits: 3, image: null,
            desc: "Blokuje przejście. Łączy się z sąsiednimi płotami." },
        bench: { name: "Ławka", cost: [[ITEM.planks, 2]], w: 1, stamina: 5, hits: 5, image: "Farm_Bench", rest: 25, indoor: true,
            desc: "Można na niej odpocząć: odnawia wytrzymałość (mija godzina)." },
        campfire: { name: "Ognisko", cost: [[ITEM.wood, 6], [ITEM.stone, 6]], w: 1, stamina: 5, hits: 5, image: "Farm_Campfire_L", rest: 15, vent: 48,
            fire: { y: 13, size: 1.25, glow: 2.2, light: 340, smoke: true },   // animated flames (y: px above the foot of the picture), steady smoke, a big glow
            upgrade: { to: "tripod", dx: 0, name: "Dobuduj trójnóg", cost: [[ITEM.branch, 3], [ITEM.rope, 1]], stamina: 3, done: "Dobudowano trójnóg",
                help: "Trzy kijki związane liną staną nad ogniem. Zawiesisz na haczyku jedzenie i możesz odejść: piecze się samo. Nie trzeba młotka." },
            recipes: [
                { id: "roast_deer", name: "Upiecz mięso jelenia", doing: "Trwa pieczenie", inputs: [[ITEM.rawDeer, 1]], output: [ITEM.roastDeer, 1], hours: 0.75, stamina: 1, startSe: "Fire2", desc: "Kawał dziczyzny nad żarem, trzy kwadranse przy ogniu. Syci dłużej niż zając." },
                { id: "roast_boar", name: "Upiecz mięso dzika", doing: "Trwa pieczenie", inputs: [[ITEM.rawBoar, 1]], output: [ITEM.roastBoar, 1], hours: 0.75, stamina: 1, startSe: "Fire2", desc: "Tłusty kawał dzika nad żarem, trzy kwadranse przy ogniu. Syci najdłużej." },
                { id: "roast_wolf", name: "Upiecz mięso wilka", doing: "Trwa pieczenie", inputs: [[ITEM.rawWolf, 1]], output: [ITEM.roastWolf, 1], hours: 0.5, stamina: 1, startSe: "Fire2", desc: "Żylaste mięso wilka nad żarem, pół godziny przy ogniu." },
                { id: "roast_meat", name: "Upiecz mięso zająca", doing: "Trwa pieczenie", inputs: [[ITEM.rawMeat, 1]], output: [ITEM.roastMeat, 1], hours: 0.5, stamina: 1, startSe: "Fire2", desc: "Kawał zająca nad żarem, pół godziny przy ogniu. Syci na kilka godzin." },
                { id: "roast_fish", name: "Upiecz rybę", doing: "Trwa pieczenie", inputs: [[ITEM.fish, 1]], output: [ITEM.roastFish, 1], hours: 0.5, stamina: 1, startSe: "Fire2", desc: "Ryba nad ogniem, pół godziny przy ogniu." },
                { id: "potatoes", name: "Upiecz ziemniaki", doing: "Trwa pieczenie", inputs: [[ITEM.potato, 2]], output: [ITEM.bakedPotato, 2], hours: 0.75, stamina: 1, startSe: "Fire2", desc: "Ziemniaki upieczone w żarze, trzy kwadranse przy ogniu." },
                { id: "eggs", name: "Usmaż jajecznicę", doing: "Trwa smażenie", inputs: [[ITEM.egg, 2]], output: [ITEM.scramble, 1], hours: 0.25, stamina: 1, startSe: "Fire2", desc: "Jajka na rozgrzanym kamieniu, kwadrans." },
                { id: "mushrooms", name: "Upiecz grzyby", doing: "Trwa pieczenie", inputs: [[ITEM.mushroom, 2]], output: [ITEM.grilledMushrooms, 2], hours: 0.25, stamina: 1, startSe: "Fire2", desc: "Kapelusze nadziane na patyk i przypieczone nad żarem, kwadrans." },
                { id: "cheese_baked", name: "Przypiecz ser", doing: "Trwa przypiekanie", inputs: [[ITEM.cheese, 1]], output: [ITEM.bakedCheese, 1], hours: 0.25, stamina: 1, startSe: "Fire2", desc: "Kawałek sera nad żarem, aż zacznie się rozpływać. Kwadrans." }
            ],
            desc: "Ogrzej się przy ogniu (odnawia wytrzymałość, mija godzina) i upiecz coś na patyku, siedząc przy nim (odejdziesz, to nic się nie upiecze). Dobudowany trójnóg piecze bez ciebie, a na nim zawiesisz kociołek." },
        // the middle step between the campfire and the cauldron: it is only ever built by upgrading a campfire (noBuild)
        tripod: { name: "Ognisko z trójnogiem", cost: [[ITEM.wood, 6], [ITEM.stone, 6], [ITEM.branch, 3], [ITEM.rope, 1]], w: 1, stamina: 5, image: "Farm_Tripod_L", rest: 15,
            vent: 66, noBuild: true, refund: [[ITEM.wood, 1], [ITEM.stone, 1], [ITEM.branch, 2]],
            fire: { y: 13, size: 1.25, glow: 2.2, light: 340, smoke: true }, hang: { y: 51, x: 0, rope: 59 },   // the food hangs on a short rope from the hook (px above the foot of the picture: the top of the icon, the top of the rope)
            upgrade: { to: "cauldron", dx: 1, name: "Zawieś kociołek", cost: [[ITEM.cauldronItem, 1]], stamina: 3, done: "Zawieszono kociołek",
                help: "Wieszasz na trójnogu kociołek, który niesiesz w plecaku (wykuwa się w kuźni). Potrzebne miejsce 3 × 2 pola wokół ogniska. Kociołek gotuje zupy, gulasz, owsiankę i wywary, ale zajmuje cały ogień: mięsa na patyku już przy nim nie upieczesz (do tego zbuduj drugie ognisko)." },
            desc: "Trzy kijki i lina nad ogniem. Zawieszasz jedzenie na haczyku i możesz odejść: piecze się samo, a gotowe odbierasz z ognia (albo czekasz obok, siedząc). Później zawiesisz na nim żelazny kociołek." },
        scarecrow: { name: "Strach na wróble", cost: [[ITEM.wood, 3]], w: 1, stamina: 4, hits: 3, image: "Farm_Scarecrow",
            desc: "Rośliny w promieniu 2 kratek rosną o 25% szybciej." },
        coop: { name: "Kurnik", cost: [[ITEM.planks, 10], [ITEM.stone, 2]], w: 6, h: 5, stamina: 14, hits: 30, image: "Farm_Coop_L", legacy: { w: 2, h: 1, image: "Farm_Coop", cost: [[ITEM.planks, 6], [ITEM.stone, 2]] },
            yard: { gate: 2, hut: { dx: 2, dy: 3, w: 2, h: 1 }, animal: "hen", count: 3 },
            produce: { item: 75, amount: 2, period: 1, cap: 6 },
            desc: "Ogrodzony wybieg z kurnikiem: w środku biegają kury i niosą jajka, 2 dziennie (maksymalnie 6). Furtką wchodzisz do środka." },
        hive: { name: "Ul", cost: [[ITEM.planks, 4]], w: 1, stamina: 6, hits: 5, image: "Farm_Hive",
            produce: { item: 76, amount: 1, period: 2, cap: 3 },
            desc: "Pszczoły zbierają miód: 1 słoik co 2 dni (maksymalnie 3)." },
        chest_s: { name: "Mała skrzynia", cost: [[ITEM.planks, 4]], w: 1, stamina: 5, hits: 5, image: "Farm_ChestS", slots: 12, indoor: true,
            desc: "Schowek: 12 rodzajów przedmiotów, po 99 sztuk każdego." },
        chest_l: { name: "Duża skrzynia", cost: [[ITEM.planks, 8], [ITEM.stone, 2], [ITEM.nails, 6]], w: 2, stamina: 8, hits: 8, image: "Farm_ChestL", slots: 30, indoor: true,
            desc: "Schowek: 30 rodzajów przedmiotów, po 99 sztuk każdego. Okuta gwoździami." },
        kiln: { name: "Piec ziemny", cost: [[ITEM.soil, 10], [ITEM.stone, 4]], w: 3, h: 2, stamina: 12, hits: 50, image: "Farm_Kiln_L", legacy: { w: 2, h: 1, image: "Farm_Kiln", vent: 50 }, vent: 95, ventX: -32, smokes: true,
            ember: { x: -14, y: 14, scale: 0.85 },   // a pulsing glow inside the archway while it burns (smoke keeps rising from the chimney, at vent/ventX, as before)
            recipes: [{
                id: "charcoal", name: "Wypal węgiel drzewny", doing: "Trwa wypalanie", inputs: [[ITEM.wood, 6], [ITEM.soil, 2]], output: [ITEM.charcoal, 3],
                hours: 6, stamina: 3, desc: "Drewno pod warstwą ziemi tli się bez płomienia i zamienia w węgiel."
            }],
            desc: "Wypala z drewna węgiel drzewny. Potrzebuje ziemi do przykrycia stosu." },
        compost: { name: "Kompostownik", cost: [[ITEM.planks, 3]], w: 1, stamina: 5, hits: 5, image: "Farm_Compost", startSe: "Earth4",
            recipes: [{
                id: "soil", name: "Kompostuj gałęzie", doing: "Trwa kompostowanie", inputs: [[ITEM.branch, 6]], output: [ITEM.soil, 4],
                hours: 5, stamina: 2, desc: "Gałęzie i resztki roślin rozkładają się na żyzną ziemię."
            }, {
                id: "rot", name: "Kompostuj zepsute jedzenie", doing: "Trwa kompostowanie", inputs: [[ITEM.rot, 4]], output: [ITEM.soil, 3],
                hours: 4, stamina: 2, desc: "Zepsute jedzenie rozkłada się na żyzną ziemię."
            }],
            desc: "Zamienia gałęzie i zepsute jedzenie w ziemię." },
        // Made of raw wood and stones only, because planks do not exist yet: the table brings its own thick hand saw.
        // A real saw (blade forged from iron, mounted at the workbench) is better: more planks in half the time.
        sawmill: { name: "Tartak", cost: [[ITEM.wood, 10], [ITEM.stone, 3]], w: 3, h: 2, stamina: 10, hits: 30, image: "Farm_Sawmill_L", legacy: { w: 2, h: 1, image: "Farm_Sawmill" }, startSe: "Slash1",
            recipes: [
                { id: "planks", name: "Piłuj deski", inputs: [[ITEM.wood, 3]], output: [ITEM.planks, 2], manual: true,
                    hours: 2, stamina: 6, startSe: "Slash1", desc: "Kłodę kładziesz na stole i przepiłowujesz grubą, ręczną piłą na deski. Ciężka robota." },
                { id: "planks_saw", name: "Piłuj deski piłą", inputs: [[ITEM.wood, 3]], output: [ITEM.planks, 3], manual: true, tool: ITEM.saw,
                    hours: 1, stamina: 4, startSe: "Slash1", desc: "Prawdziwa piła tnie równiej i szybciej: z tego samego drewna wychodzi więcej desek, w połowie czasu i za mniej sił." }
            ],
            desc: "Duży stół z kłodami i grubą piłą. Deski piłujesz ręcznie; z prawdziwą piłą (zmontujesz ją w warsztacie) idzie szybciej i wychodzi ich więcej." },
        brewery: { name: "Browar", cost: [[ITEM.planks, 8], [ITEM.stone, 4], [ITEM.nails, 8]], w: 4, h: 2, stamina: 14, hits: 30, image: "Farm_Brewery_XL", v2: { w: 3, h: 2, image: "Farm_Brewery_L" }, legacy: { w: 2, h: 1, image: "Farm_Brewery" }, startSe: "Liquid",
            recipes: [{
                id: "beer", name: "Warz piwo", doing: "Trwa warzenie", inputs: [[CROPS.barley.produce, 4]], output: [ITEM.beer, 3],
                hours: 10, stamina: 3, desc: "Jęczmień fermentuje powoli w kadzi. Karczmarz chętnie odkupi piwo."
            }, {
                id: "mead", name: "Nastaw miód pitny", doing: "Trwa fermentacja", inputs: [[ITEM.honey, 3]], output: [ITEM.mead, 2],
                hours: 8, stamina: 3, desc: "Miód rozpuszczony w wodzie fermentuje w kadzi. Rozgrzewa i trochę gasi pragnienie."
            }],
            desc: "Warzy piwo z jęczmienia. Beczki spinają gwoździe. Długi wypał, ale karczma zawsze je kupi." },
        bakery: { name: "Piekarnia", cost: [[ITEM.planks, 4], [ITEM.brick, 8]], w: 3, h: 2, stamina: 11, hits: 50, image: "Farm_Bakery_L", legacy: { w: 2, h: 1, image: "Farm_Bakery", vent: 68 }, vent: 127, ventX: 44, smokes: true,
            ember: { x: 1, y: 36, scale: 0.7 },   // the mouth of the bread oven
            recipes: [
                { id: "flour", name: "Zmiel mąkę", doing: "Trwa mielenie", inputs: [[CROPS.barley.produce, 3]], output: [ITEM.flour, 2],
                    hours: 2, stamina: 2, startSe: "Machine", desc: "Żarna mielą ziarno na mąkę." },
                { id: "bread", name: "Upiecz chleb", doing: "Trwa pieczenie", inputs: [[ITEM.flour, 2]], output: [ITEM.bread, 2],
                    hours: 3, stamina: 2, desc: "Piec wypieka bochenki ze świeżej mąki." },
                { id: "berry_pie", name: "Upiecz placek jagodowy", doing: "Trwa pieczenie", inputs: [[ITEM.flour, 2], [ITEM.berries, 3], [ITEM.honey, 1]], output: [ITEM.berryPie, 2],
                    hours: 3, stamina: 2, desc: "Kruche ciasto z jagodami i miodem." }
            ],
            desc: "Młyn i piec razem: jęczmień -> mąka -> chleb. Piec z cegieł." },
        brickworks: { name: "Cegielnia", cost: [[ITEM.planks, 3], [ITEM.stone, 6]], w: 3, h: 2, stamina: 11, hits: 50, image: "Farm_Brickworks_L", legacy: { w: 2, h: 1, image: "Farm_Brickworks", vent: 77 }, vent: 120, ventX: -48, smokes: true,
            ember: { x: -21, y: 16, scale: 1.1 },   // between the two firing arches of the stone kiln (it is built of stone: bricks are made here)
            recipes: [{
                id: "brick", name: "Wypal cegły", doing: "Trwa wypalanie", inputs: [[ITEM.stone, 3], [ITEM.soil, 3]], output: [ITEM.brick, 4],
                hours: 7, stamina: 3, desc: "Glina z kamieniem wypalone razem dają trwałą cegłę."
            }],
            desc: "Wypala z kamienia i ziemi cegły - na piekarnię, kuźnię i odbudowę murów." },
        forge: { name: "Kuźnia", cost: [[ITEM.planks, 4], [ITEM.stone, 10], [ITEM.brick, 6]], w: 3, h: 2, stamina: 14, hits: 30, image: "Farm_Forge_L", legacy: { w: 2, h: 1, image: "Farm_Forge", vent: 79 }, vent: 131, ventX: 40, smokes: true,
            ember: { x: 8, y: 33, scale: 0.6 },   // the hearth
            recipes: [
                { id: "iron", name: "Wytop żelazo", doing: "Trwa wytapianie", inputs: [[ITEM.ironOre, 2], [ITEM.charcoal, 2]], output: [ITEM.iron, 2],
                    hours: 8, stamina: 4, desc: "Ruda żelaza topi się w żarze węgla drzewnego." },
                { id: "knife_iron", name: "Wykuj nóż żelazny", inputs: [[ITEM.iron, 1], [ITEM.wood, 1]], output: [ITEM.knifeIron, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Ostrzejszy od kamiennego: z zwierzyny wytnie więcej mięsa." },
                { id: "head_axe", name: "Wykuj głowicę siekiery", inputs: [[ITEM.iron, 3]], output: [ITEM.axeHead, 1], manual: true, unique: true, also: [ITEM.ironAxe],
                    hours: 2, stamina: 6, startSe: "Hammer", desc: "Żelazna głowica z otworem na stylisko. Nasadzisz ją na stylisko w warsztacie." },
                { id: "head_pick", name: "Wykuj grot kilofa", inputs: [[ITEM.iron, 3]], output: [ITEM.pickHead, 1], manual: true, unique: true, also: [ITEM.ironPick],
                    hours: 2, stamina: 6, startSe: "Hammer", desc: "Żelazny grot z otworem na trzonek. Zamontujesz go w warsztacie." },
                { id: "blade_saw", name: "Wykuj ostrze piły", inputs: [[ITEM.iron, 2]], output: [ITEM.sawBlade, 1], manual: true, unique: true, also: [ITEM.saw],
                    hours: 2, stamina: 5, startSe: "Hammer", desc: "Cienkie, twarde ostrze z drobnymi zębami. W warsztacie dorobisz do niego rączkę i będzie z niego piła." },
                { id: "can", name: "Wykuj konewkę", inputs: [[ITEM.iron, 1], [ITEM.planks, 2]], output: [ITEM.wateringCan, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Blaszana konewka do podlewania. Napełnisz ją w studni albo w stawie." },
                { id: "bucket_item", name: "Wykuj wiadro", inputs: [[ITEM.planks, 3], [ITEM.iron, 1]], output: [ITEM.bucket, 1], manual: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Drewniane klepki ściągnięte żelaznymi obręczami. Stawiasz je gotowe w menu pola „Postaw...”: zbiera deszczówkę, nosisz w nim wodę do kociołka, a studnia bez niego nie powstanie." },
                { id: "nails", name: "Wykuj gwoździe", inputs: [[ITEM.iron, 1]], output: [ITEM.nails, 10], manual: true,
                    hours: 1, stamina: 5, startSe: "Hammer", desc: "Na kowadle z pręta żelaza wykuwasz garść gwoździ." },
                { id: "cauldron_item", name: "Wykuj kociołek", inputs: [[ITEM.iron, 8]], output: [ITEM.cauldronItem, 1], manual: true, unique: true, alsoBuilt: "cauldron",
                    hours: 2, stamina: 6, startSe: "Hammer", desc: "Żelazny kociołek z uchem do zawieszenia. Zanieś go do ogniska z trójnogiem, żeby go podpiąć." },
                { id: "shears", name: "Wykuj nożyce", inputs: [[ITEM.iron, 2], [ITEM.wood, 1]], output: [ITEM.shears, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Ostre nożyce do strzyżenia owiec. Bez nich wełna zostaje na owcy." },
                { id: "tongs", name: "Wykuj szczypce", inputs: [[ITEM.iron, 2], [ITEM.wood, 1]], output: [ITEM.tongs, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Żelazne szczypce do trzymania rozżarzonego metalu. Bez nich w hucie nie przetopisz stali." }
            ],
            desc: "Wytapia żelazo z rudy i węgla, a na kowadle kuje z niego gwoździe, noże oraz głowice i ostrza narzędzi (montuje się je w warsztacie)." },
        huta: { name: "Huta", cost: [[ITEM.brick, 10], [ITEM.stone, 6]], w: 2, h: 2, stamina: 14, hits: 30, image: "Farm_Huta_L", vent: 91, ventX: -9, smokes: true,
            ember: { x: -10, y: 24, scale: 0.6 },   // the opening at the bottom of the furnace
            recipes: [
                { id: "steel", name: "Przetop stal", doing: "Trwa przetapianie", inputs: [[ITEM.iron, 2], [ITEM.charcoal, 2]], output: [ITEM.steel, 1], tool: ITEM.tongs,
                    hours: 6, stamina: 5, desc: "Żelazo przetapia się z węglem drzewnym w twardszą stal. Żelazne szczypce trzymają rozżarzony metal, żeby się nie poparzyć." }
            ],
            desc: "Piec z cegieł do przetapiania żelaza na stal. Potrzebne są do tego żelazne szczypce (wykuwa się je w kuźni)." },
        snare: { name: "Pułapka", cost: [[ITEM.branch, 4], [ITEM.rope, 2], [ITEM.stone, 1]], w: 2, stamina: 6, hits: 5, image: "Farm_Snare",
            produce: { item: ITEM.carcass, amount: 0, period: 1, cap: 1 },   // nothing by itself: only the rabbit the bait draws in (b.caught)
            // bait in it draws live rabbits (Hunting.js) from `radius` tiles; one that sniffs at it is caught with `chance`. While the player
            // is not there to see it (another map, asleep) every hour the rabbits are about gives `awayChance` of a catch. Bait lasts
            // `baitHours` or until the first rabbit; `baits`: what can be laid
            lure: { radius: 9, chance: 0.65, awayChance: 0.08, baitHours: 24, baits: [ITEM.carrot, ITEM.cabbage, ITEM.wildApple, ITEM.wildPear, ITEM.berries] },
            desc: "Pułapka na zające. Sama z siebie nic nie złapie: załóż w niej przynętę (marchew, kapusta, dzikie jabłka, gruszki, jagody), a zając, który ją zwęszy, podejdzie i może wpaść. Złapaną zwierzynę oprawisz nożem." },
        smokehouse: { name: "Wędzarnia", cost: [[ITEM.planks, 6], [ITEM.stone, 4], [ITEM.brick, 4], [ITEM.nails, 4]], w: 3, h: 2, stamina: 12, hits: 50, image: "Farm_Smokehouse_L", legacy: { w: 2, h: 1, image: "Farm_Smokehouse", vent: 80 }, vent: 118, ventX: 0, smokes: true,
            recipes: [
                { id: "smoke_meat", name: "Wędź mięso", doing: "Trwa wędzenie", inputs: [[ITEM.wood, 2]], meat: 2, output: [ITEM.smokedMeat, 2], hours: 8, stamina: 2, startSe: "Fire2", desc: "Długo w dymie: mięso syci mocniej i dłużej." },
                { id: "smoke_fish", name: "Wędź rybę", doing: "Trwa wędzenie", inputs: [[ITEM.fish, 2], [ITEM.wood, 2]], output: [ITEM.smokedFish, 2], hours: 6, stamina: 2, startSe: "Fire2", desc: "Ryba w dymie olchowym." }
            ],
            desc: "Wędzi mięso i ryby. Wędzonka daje najwięcej sił." },
        tannery: { name: "Garbarnia", cost: [[ITEM.planks, 4], [ITEM.rope, 2], [ITEM.stone, 2]], w: 3, h: 2, stamina: 10, hits: 30, image: "Farm_Tannery_L", legacy: { w: 2, h: 1, image: "Farm_Tannery" },
            recipes: [
                { id: "tan", name: "Wyprawiaj skórę", doing: "Trwa wyprawianie", inputs: [[ITEM.rawHide, 1], [ITEM.branch, 3]], output: [ITEM.hide, 1], hours: 12, stamina: 2, startSe: "Liquid", desc: "Skóra moczy się w garbniku z kory i gałęzi." },
                { id: "boots", name: "Zszyj buty", inputs: [[ITEM.hide, 2], [ITEM.rope, 1]], output: [ITEM.boots, 1], manual: true, unique: true, hours: 2, stamina: 4, startSe: "Item1", desc: "Mocne buty: chodzisz w nich szybciej." },
                { id: "backpack", name: "Zszyj plecak", inputs: [[ITEM.hide, 3], [ITEM.rope, 2]], output: [ITEM.backpack, 1], manual: true, unique: true, hours: 3, stamina: 5, startSe: "Item1", desc: "Skórzany plecak: zmieścisz w nim więcej." },
                { id: "cloak", name: "Uszyj płaszcz", inputs: [[ITEM.hide, 2], [ITEM.wool, 4], [ITEM.rope, 1]], output: [ITEM.cloak, 1], manual: true, unique: true, hours: 3, stamina: 5, startSe: "Item1", desc: "Ciepły płaszcz. Zimą nie marzniesz." },
                { id: "tent", name: "Zszyj namiot", inputs: [[ITEM.hide, 4], [ITEM.rope, 3], [ITEM.wood, 4]], output: [ITEM.tent, 1], manual: true, unique: true, alsoBuilt: "tent", hours: 4, stamina: 8, startSe: "Item1",
                    desc: "Skóry napięte na czterech żerdziach i zszyte liną. Rozstawisz go tam, gdzie chcesz spać, a rano złożysz i zabierzesz ze sobą." }
            ],
            desc: "Wyprawia skóry, a ze skór szyje buty, plecak, płaszcz i namiot." },
        // The bucket: forged at the forge (recipe bucket_item) and put down ready from the bag, like the tent; it collects rain
        // (rain.rate portions per hour of rain, up to rain.max) and goes back into the bag (pack) with its water. The well needs one.
        bucket: { name: "Wiadro", cost: [[ITEM.bucket, 1]], w: 1, stamina: 2, image: "Farm_Bucket", imageFull: "Farm_Bucket_Full", instant: true, pack: ITEM.bucket,
            packName: "Zabierz wiadro", packHelp: "Zabierasz wiadro do plecaka razem z wodą, jeśli jakąś zebrało. Postawisz je, gdzie zechcesz - z wodą w środku waży więcej. Wiadro jest też potrzebne do budowy studni.", packedText: "Zabrano: Wiadro",
            rain: { max: 6, rate: 1 },
            desc: "Drewniane wiadro z żelaznymi obręczami, wykute w kuźni. Postawione na dworze zbiera deszczówkę (porcja za każdą godzinę deszczu, do 6): napijesz się z niego, podlejesz rośliny w pobliżu albo napełnisz konewkę i bukłak. Możesz je podnieść do plecaka. Jest potrzebne do budowy studni." },
        well: { name: "Studnia", cost: [[ITEM.stone, 12], [ITEM.planks, 3], [ITEM.rope, 2], [ITEM.bucket, 1]], w: 2, h: 2, stamina: 12, hits: 50, image: "Farm_Well_L", refund: [[ITEM.stone, 6], [ITEM.planks, 1], [ITEM.rope, 1], [ITEM.bucket, 1]],
            v2: { cost: [[ITEM.stone, 12], [ITEM.planks, 3], [ITEM.rope, 2]], refund: undefined },   // wells put up before the bucket was needed
            legacy: { w: 2, h: 1, image: "Farm_Well", cost: [[ITEM.stone, 12], [ITEM.planks, 3], [ITEM.rope, 2]], refund: undefined }, water: true,
            desc: "Czysta woda: napełnisz konewkę albo się napijesz. Do budowy potrzebne jest wiadro." },
        // the last step of the campfire: only ever made by hanging a forged cauldron on a tripod (noBuild: not on the Q build list)
        cauldron: { name: "Kociołek", cost: [[ITEM.iron, 2], [ITEM.planks, 2], [ITEM.stone, 4]], w: 3, h: 2, stamina: 10, image: "Farm_Cauldron_XL", v2: { image: "Farm_Cauldron_L", ventX: -17, fire: null }, legacy: { w: 2, h: 1, image: "Farm_Cauldron", vent: 46, fire: null },
            vent: 59, ventX: -1, smokes: true, rest: 15, fire: { y: 15, size: 0.9, glow: 1.1, light: 290 }, noBuild: true,
            recipes: [
                { id: "soup", name: "Ugotuj zupę", doing: "Trwa gotowanie", inputs: [[ITEM.potato, 2], [ITEM.carrot, 1]], meat: 1, output: [ITEM.soup, 2], hours: 3, stamina: 2, startSe: "Liquid", desc: "Warzywa z mięsem: syci i rozgrzewa." },
                { id: "stew", name: "Ugotuj gulasz", doing: "Trwa gotowanie", inputs: [[ITEM.carrot, 1], [ITEM.cabbage, 1]], meat: 2, water: 2, output: [ITEM.stew, 2], hours: 4, stamina: 2, startSe: "Liquid", desc: "Mięso, marchew i kapusta dusone długo w kociołku. Bardzo syci i rozgrzewa na wiele godzin." },
                { id: "cabbage_soup", name: "Ugotuj kapuśniak", doing: "Trwa gotowanie", inputs: [[ITEM.cabbage, 2], [ITEM.potato, 1], [ITEM.smokedMeat, 1]], water: 3, output: [ITEM.cabbageSoup, 2], hours: 3, stamina: 2, startSe: "Liquid", desc: "Kapusta z ziemniakami i kawałkiem wędzonki. Syci, rozgrzewa i trochę gasi pragnienie." },
                { id: "mushroom_soup", name: "Ugotuj zupę grzybową", doing: "Trwa gotowanie", inputs: [[ITEM.mushroom, 3], [ITEM.potato, 1], [ITEM.milk, 1]], water: 3, output: [ITEM.mushroomSoup, 2], hours: 3, stamina: 2, startSe: "Liquid", desc: "Grzyby z ziemniakiem na mleku: kremowa zupa." },
                { id: "porridge", name: "Ugotuj owsiankę", doing: "Trwa gotowanie", inputs: [[CROPS.barley.produce, 3], [ITEM.milk, 1], [ITEM.honey, 1]], water: 1, output: [ITEM.porridge, 2], hours: 2, stamina: 1, startSe: "Liquid", desc: "Kasza jęczmienna na mleku z łyżką miodu. Tania i sycąca." },
                { id: "brew", name: "Zaparz wywar", doing: "Trwa parzenie", inputs: [[ITEM.herb, 3]], output: [ITEM.brew, 2], hours: 2, stamina: 1, startSe: "Liquid", desc: "Gorący wywar z ziół. Rozgrzewa na długo." },
                { id: "nettle_soup", name: "Ugotuj zupę pokrzywową", doing: "Trwa gotowanie", inputs: [[ITEM.nettle, 3], [ITEM.garlic, 1], [ITEM.potato, 1]], water: 2, output: [ITEM.nettleSoup, 2], hours: 2, stamina: 1, startSe: "Liquid",
                    desc: "Młode pokrzywy z dzikim czosnkiem i ziemniakiem: zielona zupa z leśnego zbieractwa. Syci i gasi pragnienie." }
            ],
            desc: "Wisi nad ogniem i zastępuje pieczenie na patyku: gotuje zupy, gulasz, owsiankę i wywary, a przy jego ogniu można się ogrzać. Powstaje z rozbudowy trójnogu. Mięso, ryby i ziemniaki upieczesz na osobnym ognisku." },
        pen: { name: "Owczarnia", cost: [[ITEM.planks, 12], [ITEM.rope, 2], [ITEM.stone, 2]], w: 6, h: 5, stamina: 14, hits: 30, image: "Farm_Pen_L", legacy: { w: 2, h: 1, image: "Farm_Pen", cost: [[ITEM.planks, 6], [ITEM.rope, 2], [ITEM.stone, 2]] },
            yard: { gate: 2, hut: { dx: 2, dy: 3, w: 2, h: 1 }, animal: "sheep", count: 3 },
            produce: { item: ITEM.wool, amount: 1, period: 3, cap: 3, tool: ITEM.shears },
            desc: "Ogrodzony wygon z szopą: w środku pasą się owce i dają wełnę, 1 sztukę co 3 dni (maksymalnie 3), ale do strzyżenia potrzebne są nożyce (wykuwa się je w kuźni). Z wełny szyje się płaszcz." },
        // The forest bed (type key kept from the old hide bedroll): made in "Wytwórz..." (an item), laid out like the tent, but a night on it
        // restores only part of the strength: sleepRestore of the maximum, sleepBad in rain, snow and winter. refund: what Rozbierz gives back.
        bedroll: { name: "Leśne legowisko", cost: [[ITEM.boughBed, 1]], w: 2, stamina: 2, image: "Farm_Bedroll", instant: true, sleep: true, indoor: true, sleepRestore: 0.6, sleepBad: 0.4,
            refund: [[ITEM.branch, 3], [ITEM.fiber, 1]],
            desc: "Sterta gałęzi wyścielona suchą trawą i związana lnem. Prześpisz na niej noc, ale wstaniesz z około 60% sił, a w deszczu, śniegu i zimą z 40%. Namiot wypoczywa lepiej. Zrobisz ją w menu „Wytwórz...”." },
        // A portable building: sewn in the tannery into an item, pitched at once (instant: no site, no hammer) and packed up again
        // into the item (pack). Sleeping in it (sleep) works like the bed of the house did: until the morning, everything restored.
        tent: { name: "Namiot", cost: [[ITEM.tent, 1]], w: 3, h: 2, stamina: 3, image: "Farm_Tent_L", legacy: { w: 2, h: 1, image: "Farm_Tent" }, instant: true, pack: ITEM.tent, sleep: true,
            desc: "Rozstawiasz go od razu, bez młotka. Prześpisz w nim całą noc i wstaniesz z pełnią sił, także w deszczu. Rano złożysz go i zabierzesz ze sobą. Zszyjesz go w garbarni." },
        // dairy: the cowshed gives milk, the dairy turns milk into cheese, the pantry keeps food fresh (Spoilage.js: keeps = how fast it ages)
        cowshed: { name: "Obora", cost: [[ITEM.planks, 16], [ITEM.rope, 3], [ITEM.nails, 6]], w: 8, h: 5, stamina: 18, hits: 40, image: "Farm_Cowshed_XL",
            v2: { w: 7, h: 5, image: "Farm_Cowshed_L", cost: [[ITEM.planks, 14], [ITEM.rope, 3], [ITEM.nails, 6]], stamina: 16, yard: { gate: 3, hut: { dx: 2, dy: 3, w: 3, h: 1 }, animal: "cow", count: 2 } }, legacy: { w: 2, h: 1, image: "Farm_Cowshed", cost: [[ITEM.planks, 8], [ITEM.rope, 3], [ITEM.nails, 4]] },
            yard: { gate: 3, hut: { dx: 2, dy: 3, w: 4, h: 1 }, animal: "cow", count: 2 },
            produce: { item: ITEM.milk, amount: 2, period: 1, cap: 6, tool: ITEM.bucket },
            desc: "Ogrodzony wybieg z oborą: w środku chodzą krowy, a razem dają 2 dzbany mleka dziennie (najwyżej 6), ale do dojenia potrzeba pustego wiadra w plecaku. Mleko szybko kwaśnieje, więc zbieraj je często albo zrób z niego ser." },
        // The player's first house: a log hut (one per game). Its doorway (door.dx: a passable cell of the bottom row) leads to Map100, a room with
        // a 5 x 2 floor where furniture (the buildings marked indoor) is put with the same build menu.
        hut: { name: "Chatka", cost: [[ITEM.planks, 50], [ITEM.nails, 60], [ITEM.stone, 40], [ITEM.iron, 10]], w: 5, h: 3, stamina: 40, hits: 80, image: "Farm_Hut_L", door: { dx: 1 }, single: true,
            desc: "Twój pierwszy własny dach: mała chatka z bali. Wchodzisz do niej przez drzwi, a w środku (podłoga 5 × 2 pola) postawisz meble: łóżko, kredens, warsztat, skrzynie, ławkę albo legowisko. Pod dachem nie leje i nie mrozi. Tylko jedna na całą grę, za to kosztuje mnóstwo desek, gwoździ, kamieni i żelaza." },
        // furniture that stands only inside the hut (indoorOnly); the pieces marked indoor (bench, chests, workbench, bedroll) stand there too
        bed: { name: "Łóżko", cost: [[ITEM.planks, 6], [ITEM.nails, 4], [ITEM.wool, 3]], w: 2, h: 1, stamina: 8, hits: 8, image: "Farm_Bed", sleep: true, indoor: true, indoorOnly: true,
            desc: "Prawdziwe łóżko ze słomianym materacem i wełnianym kocem. Prześpisz w nim całą noc i wstaniesz z pełnią sił. Stoi tylko w chatce." },
        larder: { name: "Kredens", cost: [[ITEM.planks, 8], [ITEM.nails, 6]], w: 1, h: 1, stamina: 8, hits: 8, image: "Farm_Larder", slots: 24, keeps: 0.2, foodOnly: true, indoor: true, indoorOnly: true,
            desc: "Kredens na jedzenie: 24 rodzaje, po 99 sztuk. To, co w nim leży, psuje się pięć razy wolniej, jak w spiżarni. Stoi tylko w chatce." },
        dairy: { name: "Serowarnia", cost: [[ITEM.planks, 6], [ITEM.stone, 4], [ITEM.rope, 2]], w: 3, h: 2, stamina: 11, hits: 50, image: "Farm_Dairy_L", legacy: { w: 2, h: 1, image: "Farm_Dairy" }, startSe: "Liquid",
            recipes: [{
                id: "cheese", name: "Zrób ser", doing: "Trwa ścinanie mleka", inputs: [[ITEM.milk, 3]], output: [ITEM.cheese, 1],
                hours: 10, stamina: 3, startSe: "Liquid", desc: "Mleko zsiada się i dojrzewa pod prasą. Z trzech dzbanów wychodzi jeden ser, który trzyma się miesiąc."
            }],
            desc: "Zsiadłe mleko, prasa i dojrzewające sery. Ser syci na długo i prawie się nie psuje." },
        pantry: { name: "Spiżarnia", cost: [[ITEM.planks, 6], [ITEM.stone, 4], [ITEM.rope, 1]], w: 3, h: 2, stamina: 9, hits: 30, image: "Farm_Pantry_XL", v2: { w: 2, h: 1, image: "Farm_Pantry_L" }, legacy: { w: 1, h: 1, image: "Farm_Pantry" }, slots: 24, keeps: 0.2, foodOnly: true,
            desc: "Chłodna szafa na jedzenie: 24 rodzaje, po 99 sztuk. Wszystko, co w niej leży, psuje się pięć razy wolniej." }
    };
    BUILDINGS.tripod.recipes = BUILDINGS.campfire.recipes;   // the tripod roasts what the campfire roasts
    // the cauldron takes the whole fire: only its own dishes, no roasting on a stick (that needs a campfire of its own)
    for (const r of BUILDINGS.campfire.recipes) r.roast = true;   // sat by the fire with the food on a stick (or hung on the tripod's hook)

    // Recipes that need no building: what a person can make with bare hands from what lies on the ground: the hammer (every building
    // is put up with it, the workbench first), the forest bed, the waterskin, rope, and from the forest floor pine seeds, a bandage and
    // nettle fibre. All the other tools are made at the workbench. Menu of a free plot > "Wytwórz...".
    const HAND_RECIPES = [
        { id: "hammer", name: "Zrób młotek", inputs: [[ITEM.branch, 5], [ITEM.stone, 2], [ITEM.fiber, 3]], output: [ITEM.hammer, 1], manual: true, unique: true, swing: "crouch",
            hours: 1, stamina: 3, startSe: "Hammer", desc: "Kamień przywiązany lnem do gałęzi. Bez niego nie postawisz żadnej budowli." },
        { id: "bough_bed", name: "Zrób leśne legowisko", inputs: [[ITEM.branch, 10], [ITEM.fiber, 10]], output: [ITEM.boughBed, 1], manual: true, unique: true, alsoBuilt: "bedroll", swing: "crouch",
            hours: 1, stamina: 3, startSe: "Item1", desc: "Gałęzie związane lnem i wyścielone suchą trawą. Rozkładasz je potem w menu ziemi, w „Postaw...”. Przespać na nim noc się da, ale wstaniesz z częścią sił. Namiot wypoczywa lepiej." },
        { id: "waterskin", name: "Zrób bukłak", inputs: [[ITEM.hide, 1], [ITEM.fiber, 3]], output: [ITEM.skin, 1], manual: true, unique: true, swing: "crouch",
            hours: 1, stamina: 2, startSe: "Item1", desc: "Wyprawiona skóra (z garbarni) zszyta lnem w worek z korkiem. Mieści 4 łyki wody: napełnisz go przy stawie albo studni, a napijesz się klawiszem G lub z menu Przedmioty." },
        { id: "rope", name: "Skręć linę", inputs: [[ITEM.fiber, 4]], output: [ITEM.rope, 1], manual: true,
            hours: 1, stamina: 2, startSe: "Item1", desc: "Włókna dzikiego lnu skręcone w mocny sznur." },
        // from the forest floor: pine seeds for planting (Forestry.js), a bandage for a wound (Survival.js), fibre out of nettle stalks
        { id: "pine_seeds", name: "Wyłuskaj nasiona sosny", inputs: [[ITEM.cone, 1]], output: [ITEM.pineSeed, 3], manual: true, swing: "crouch",
            hours: 0.25, stamina: 1, startSe: "Item1", desc: "Łuski szyszek rozchylone nożem albo paznokciem: wypadają skrzydlate nasiona. Posadzisz je w menu ziemi („Posadź sosnę”)." },
        { id: "bandage", name: "Zrób opatrunek", inputs: [[ITEM.fiber, 2], [ITEM.herb, 2], [ITEM.yarrow, 2]], output: [ITEM.bandage, 1], manual: true, swing: "crouch",
            hours: 0.25, stamina: 1, startSe: "Item1", desc: "Rozgniecione ziele krwawnika z ziołami, przewiązane lnem. Tamuje krew: leczy ranę (na przykład od dzika). Użyjesz go z menu Przedmioty." },
        { id: "nettle_fiber", name: "Wyskub włókno z pokrzyw", inputs: [[ITEM.nettle, 3]], output: [ITEM.fiber, 2], manual: true, swing: "crouch",
            hours: 0.5, stamina: 1, startSe: "Item1", desc: "Łodygi pokrzywy wymoczone i rozdarte na długie włókna. Równie dobre jak len." }
    ];

        return { CROPS, BUILDINGS, HAND_RECIPES };
    }

    window.Farming_Data = { build };
})();
