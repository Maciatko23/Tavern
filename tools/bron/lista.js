// Broń i zbroje: tabela do akceptacji - docs/ekwipunek/BRON_LISTA.md robiona z js/plugins/Bron_Data.js (jedno źródło liczb).
//   node tools/bron/lista.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "ekwipunek", "BRON_LISTA.md");

function loadData() {
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "plugins", "Bron_Data.js"), "utf8"), sandbox, { filename: "Bron_Data.js" });
    return sandbox.window.Bron_Data;
}

const D = loadData();
const P = D.PRZEDMIOTY.filter(p => !p.istnieje).sort((a, b) => a.id - b.id);
const pct = v => Math.round(v * 100) + "%";
const num = v => String(Math.round(v * 100) / 100).replace(".", ",");
const mat = k => (D.MATERIALY[k] ? D.MATERIALY[k].nazwa : k);
// sold: in some shop's list (or the rag-and-bone man's used ones)
const sold = new Set();
for (const s of Object.values(D.SKLEPY)) { for (const id of s.sprzedaje || []) sold.add(id); if (s.uzywane) for (const id of s.uzywane.z) sold.add(id); }
const price = p => { const c = D.cenaOf(p), w = D.wartoscOf(p); return sold.has(p.id) && c ? c + " G" : w ? "(" + w + ")" : "-"; };
const src = p => (p.zrodla || []).join("; ");
const xpTo = lv => { let s = 0; for (let l = 1; l < lv; l++) s += Math.max(100, Math.round(500 * Math.pow(1.2, l - 1) / 100) * 100); return s; };
const big = n => n >= 1e6 ? (Math.round(n / 1e5) / 10).toString().replace(".", ",") + " mln" : n >= 1e3 ? Math.round(n / 1e3) + " tys." : String(n);

const out = [];
const w = s => out.push(s);
const weapons = P.filter(p => p.typ === "bron" && !p.unikat), armour = P.filter(p => p.typ === "zbroja" && !p.unikat), shields = P.filter(p => p.typ === "tarcza" && !p.unikat);
const trinkets = P.filter(p => p.typ === "dodatek" && !p.unikat), uniques = P.filter(p => p.unikat);
const melee = weapons.filter(p => !D.staty(p).dystans), ranged = weapons.filter(p => D.staty(p).dystans);
const dmgs = melee.map(p => D.staty(p).dmg), prices = P.filter(p => sold.has(p.id)).map(p => D.cenaOf(p)).filter(Boolean);

w("# Broń, zbroje, tarcze i dodatki - lista do akceptacji");
w("");
w("Zrobione z `js/plugins/Bron_Data.js` (`node tools/bron/lista.js` - tabela i gra mają te same liczby). Plan: `PLAN_BRON_ZBROJE.md`.");
w("Nic z tego nie jest jeszcze w grze: przedmioty i ikony czekają w `tools/bron/staging/` na akceptację i instalację (`tools/bron/instaluj_dane.py`).");
w("");
w("## Podsumowanie");
w("");
w("| co | ile | numery | ikony |");
w("|---|---|---|---|");
const tools = melee.filter(p => p.narzedzie);
w("| broń wręcz | " + (melee.length - tools.length) + " | " + Math.min(...melee.map(p => p.id)) + "-" + Math.max(...melee.filter(p => !p.narzedzie).map(p => p.id)) + " | od 576 |");
w("| stalowe narzędzia (siekiera, kilof - też broń) | " + tools.length + " | " + tools.map(p => p.id).join(", ") + " | |");
w("| łuki i proce | " + ranged.length + " | " + ranged.map(p => p.id).join(", ") + " | |");
w("| zbroje i części zbroi | " + armour.length + " | 340-374 | |");
w("| tarcze | " + shields.length + " | 375-380 | |");
w("| dodatki (amulety, pierścienie, talizmany) | " + trinkets.length + " | 381-395 | |");
w("| unikaty | " + uniques.length + " | 396-406 | |");
w("| **razem** | **" + P.length + "** | 300-" + P[P.length - 1].id + " | 576-" + P[P.length - 1].ikona + " (7 nowych rzędów IconSet) |");
w("");
w("- Obrażenia broni wręcz: **" + Math.min(...dmgs) + "-" + Math.max(...dmgs) + "** (dziś: pięści 5, pałka 13, kamienna siekiera 17, oszczep 20, żelazna siekiera 26, żelazny kilof 30); unikaty do " +
    Math.max(...uniques.filter(p => p.typ === "bron" && !D.staty(p).dystans).map(p => D.staty(p).dmg)) + ". Strzał: " + Math.min(...ranged.map(p => D.staty(p).damage)) + "-" + Math.max(...ranged.map(p => D.staty(p).damage)) + " (dziś proca 14, łuk 30).");
w("- Zbroja: część ciosu, którą zatrzymuje - pojedyncza część **" + pct(Math.min(...P.filter(p => p.typ === "zbroja").map(p => p.obrona))) + "-" + pct(Math.max(...P.filter(p => p.typ === "zbroja").map(p => p.obrona))) + "**, cały komplet: skóra ok. 34%, brąz ok. 41%, żelazo ok. 50%, stal ok. 56%, zakonny 59% (sufit sumy **" + pct(D.ZBROJA_MAX) + "**; dziś kurtka 20%). Tarcze: blok **68-87%** (dziś drewniana 75%).");
w("- Ceny w sklepach: **" + Math.min(...prices) + "-" + Math.max(...prices) + " G** (dług dziadka: 2500 G). W nawiasie wartość rzeczy niesprzedawanych (tyle liczy kupiec przy skupie).");
w("");
w("## Zasady balansu");
w("");
w("### Poziom przedmiotu - przeliczony na prawdziwe tempo gry");
w("");
w("Plan mówi: drewno / kamień 1-10, brąz 10-25, żelazo 25-45, stal 45-70, zakonne 70-100. W grze doświadczenie do następnego poziomu rośnie o 20% na poziom (Combat.js), więc:");
w("");
w("| poziom | doświadczenie od początku |");
w("|---|---|");
for (const lv of [10, 15, 20, 25, 30, 45, 70]) w("| " + lv + " | " + big(xpTo(lv)) + " |");
w("");
w("Boss 90. piętra daje ok. 27 tys. doświadczenia, a próba sił (docs/WALKA.md) zakłada bohatera na **poziomie 25 przy 90. piętrze**. Poziom 45 to ~7,6 mln doświadczenia - w praktyce nieosiągalny, 70 i 100 tym bardziej.");
w("Dlatego **przedziały planu przeliczyłem na tempo gry** (kolejność i proporcje te same):");
w("");
w("| materiał | plan | w grze | skąd w podziemiach |");
w("|---|---|---|---|");
w("| drewno, kamień, skóra, płótno | 1-10 | 1-5 | - |");
w("| brąz | 10-25 | 5-9 | piętra 1-10 (bohater ~1-6) |");
w("| żelazo | 25-45 | 9-15 | piętra 11-50 (bohater ~6-17) |");
w("| stal, kruszec Pierwszych | 45-70 | 15-22 | piętra 51-75 (bohater ~17-22) |");
w("| stal zakonna | 70-100 | 22-27 | piętra 76-99 (bohater ~22-25) |");
w("");
w("**Kara za za wysoki poziom** (zamiast blokady): rzecz z poziomem wyższym niż bohater działa słabiej o **" + Math.round(D.KARA.naPoziom * 100) + "% za każdy brakujący poziom (najwyżej " + Math.round(D.KARA.max * 100) +
    "%)** - broń zadaje mniej obrażeń, słabiej chwieje i kosztuje więcej oddechu, zbroja i tarcza mniej zatrzymują, dodatek mniej daje. Na karcie i w sklepie widać: „poziom 16 - masz 10: słabiej o 18%”. Stare przedmioty (siekiery, kilofy, pałka, oszczep, łuk, proca, drewniana tarcza, kurtka) mają poziom 1 - działają jak dziś.");
w("");
w("### Broń: rodzaj x materiał");
w("");
w("Każda broń = liczby rodzaju (dla żelaza) x mnożnik materiału. Obrażenia: drewno x0,55, okute x0,72, kamień x0,70, brąz x0,84, żelazo x1, " + ["stal", "pierwszych", "zakon"].map(k => D.MATERIALY[k].nazwa + " x" + num(D.MATERIALY[k].mn)).join(", ") + ". Zachwianie rośnie o połowę tego. Stal: oddech -1, kryt +1%; zakonna: oddech -2, kryt +3%.");
w("");
w("| rodzaj | zamach (klatki) | obr. | zachw. | zasięg | oddech | kryt | cecha |");
w("|---|---|---|---|---|---|---|---|");
const ZAMACH = { club: "pałka (22)", punch: "pięść (18)", axe: "siekiera (26)", pick: "kilof (34)", spear: "włócznia (32)" };
for (const k of Object.keys(D.RODZAJE)) {
    const R = D.RODZAJE[k];
    if (R.narzedzie || R.dystans) continue;
    w("| " + R.nazwa + " | " + ZAMACH[R.zamach] + " | " + R.dmg + " | " + R.poise + " | " + num(R.reach) + " | " + R.cost + " | " + (R.crit ? pct(R.crit) : "-") + " | " + R.cecha + " |");
}
w("");
w("Szybkość broni daje zamach: krótki zamach (pałka 22 klatki, pięść 18) = więcej ciosów na sekundę, ciężki (kilof 34) = mniej, ale mocniej. Przykład (żelazo, seria ciosów): miecz ok. 87 obrażeń na sekundę i 30 oddechu na sekundę, topór ok. 84 / 37, młot ok. 69 / 37 (na zbroje ok. 97), sztylet ok. 67 z krytykami / 23 (najtańszy w oddechu), włócznia ok. 62 / 22 (ale z 2,3 pola).");
w("Cechy: **pancerz** - więcej obrażeń w puste zbroje, kamienniki i kolczugę najemnika (pałki +20%, buzdygany +30%, czekan +35%, młoty +40%); **na zwierzęta** - rohatyna +30%; **z ukrycia** - sztylety x1,3 do ataku z ukrycia; **krytyk** dodaje się do szansy bohatera (Czujność, umiejętności).");
w("");
w("Porównanie z dzisiejszymi: brązowy topór (26) bije jak żelazna siekiera; żelazny miecz (27) jest szybszy od żelaznej siekiery (26, zamach 26 klatek) i tańszy w oddechu (11 zamiast 16); kamienny młot (26, ale wolny i drogi w oddechu) to mocny start z trzech kamieni. Narzędzia zostają narzędziami - ich liczby się nie zmieniają.");
w("");
w("### Zbroja");
w("");
w("Każda założona część zbroi zatrzymuje swoją część ciosu, który doszedł (po bloku); części się sumują, najwyżej **" + pct(D.ZBROJA_MAX) + "** (Niezłomny z drzewka Obrony liczy się osobno, jak dziś). Każda część zużywa się od każdego ciosu, który doszedł (jak kurtka). Udział części: tors ok. 60%, głowa 15%, nogi 10%, ręce 8%, stopy 7%. Sufit i liczby stali / stali zakonnej zmniejszone po próbie sił (niżej).");
w("Ciężkie zbroje mają kary: **oddech** (krótszy pasek oddechu, np. kolczuga -5%, napierśnik -7%), **skradanie** (zwierzęta słyszą cię lepiej, np. łuska +20%), **chód** (łuski i napierśnik -3%). Skóra i płótno są ciche i ciepłe; buty dają szybszy chód. Zbroja zajmuje te same miejsca co ubranie (głowa, tors, ręce, nogi, stopy) - na torsie albo koszula, albo kolczuga.");
w("");
w("### Tarcze i dodatki");
w("");
w("Tarcza w lewej ręce: **blok** (ile ciosu zatrzymuje przy P), **oddech bloku** (ile oddechu zabiera przyjęty cios - mniej = lepiej), **parowanie** (dłuższe okno idealnego parowania), **osłona** (garda łapie też ciosy z boku). Ciężkie tarcze skracają oddech. Dodatek: jedno miejsce „Dodatek” na karcie - jeden amulet, pierścień albo talizman naraz; bonusy idą przez Combat.perk (te same klucze co umiejętności - liczą się razem).");
w("");
w("### Ceny i skup");
w("");
w("Cena = cena materiału (brąz 55, żelazo 110, stal 240 G za miecz) x udział rodzaju (sztylet 0,55, włócznia 0,8, miecz 1, długi miecz 1,2). Kupcy odkupują swój rodzaj za 40-45% ceny (zużyte mniej), szmaciarz wszystko za 20%; unikatów nikt nie kupuje. Naprawa u kowala / garbarza / szwaczki: 30% ceny za całe zużycie (stal zakonną i kruszec Pierwszych kowal naprawia za podwójną cenę); żelazne i stalowe naprawisz też w warsztacie (sztabka + węgiel).");
w("");

function weaponRow(p) {
    const s = D.staty(p), cechy = [];
    if (s.sweep) cechy.push("szeroki zamach");
    if (s.pancerz > 1) cechy.push("pancerz +" + pct(s.pancerz - 1));
    if (s.zwierz > 1) cechy.push("zwierzęta +" + pct(s.zwierz - 1));
    if (s.ukrycie > 1) cechy.push("z ukrycia x" + num(s.ukrycie));
    for (const k of Object.keys(p.reka || {})) cechy.push("w ręku: " + D.BONUSY[k].opis(p.reka[k]));
    return "| " + p.id + " | " + p.nazwa + " | " + D.RODZAJE[p.rodzaj].nazwa + " | " + mat(p.material) + " | " + p.poziom + " | " + s.dmg + " | " + s.poise + " | " + s.cost + " | " + num(s.reach) +
        " | " + (s.crit ? pct(s.crit) : "-") + " | " + (cechy.join(", ") || "-") + " | " + D.trwalosc(p) + " | " + D.wagaOf(p) + " | " + price(p) + " | " + src(p) + " |";
}
function rangedRow(p) {
    const s = D.staty(p);
    return "| " + p.id + " | " + p.nazwa + " | " + D.RODZAJE[p.rodzaj].nazwa + " | " + mat(p.material) + " | " + p.poziom + " | " + s.damage + " | " + num(s.range) + " | " + s.steady + " | " + s.cooldown +
        " | " + s.stamina + " | " + D.trwalosc(p) + " | " + D.wagaOf(p) + " | " + price(p) + " | " + src(p) + " |";
}
function karaText(p) {
    const k = p.kara || {}, out = [];
    if (k.oddech) out.push("oddech -" + pct(k.oddech));
    if (k.skradanie) out.push("głośniej " + pct(k.skradanie));
    if (k.chod) out.push("chód " + (k.chod > 0 ? "+" : "-") + pct(Math.abs(k.chod)));
    return out.join(", ") || "-";
}
function bonusText(p) {
    const out = [];
    for (const b of Object.keys(p.bonus || {})) out.push(D.BONUSY[b].opis(p.bonus[b]));
    if (p.piesci) out.push("pięści +" + p.piesci.dmg + " obrażeń, +" + p.piesci.poise + " zachwiania");
    return out.join(", ");
}
function armourRow(p) {
    return "| " + p.id + " | " + p.nazwa + " | " + D.MIEJSCA[p.miejsce].nazwa + " | " + mat(p.material) + " | " + p.poziom + " | " + pct(p.obrona) + " | " + (p.cieplo ? "+" + pct(p.cieplo) : "-") +
        " | " + ([karaText(p), bonusText(p)].filter(x => x && x !== "-").join("; ") || "-") + " | " + D.trwalosc(p) + " | " + D.wagaOf(p) + " | " + price(p) + " | " + src(p) + " |";
}
function shieldRow(p) {
    return "| " + p.id + " | " + p.nazwa + " | " + mat(p.material) + " | " + p.poziom + " | " + pct(p.blok) + " | " + num(p.oddechBloku) + " | " + (p.parowanie ? "+" + pct(p.parowanie) : "-") +
        " | " + (p.oslona ? "szersza" : "-") + " | " + karaText(p) + " | " + D.trwalosc(p) + " | " + D.wagaOf(p) + " | " + price(p) + " | " + src(p) + " |";
}

w("## Broń wręcz (" + melee.length + ")");
w("");
w("obr. = obrażenia ciosu (przed Siłą i umiejętnościami), zachw. = zbijanie równowagi wroga, oddech = koszt ciosu, zasięg w polach, trw. = wytrzymałość (ciosy; włócznie: pchnięcia).");
w("");
w("| id | nazwa | rodzaj | materiał | poz. | obr. | zachw. | oddech | zasięg | kryt | cechy | trw. | waga | cena | skąd |");
w("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const p of melee) w(weaponRow(p));
w("");
w("## Łuki i proce (" + ranged.length + ")");
w("");
w("Strzały i kamienie jak dziś; w ręku jest najlepszy posiadany łuk (gdy są strzały), inaczej najlepsza proca. celowanie = klatki, w których kółko się zwęża (mniej = szybciej), przerwa = klatki między strzałami, sił = wytrzymałość za strzał.");
w("");
w("| id | nazwa | rodzaj | wykonanie | poz. | strzał | zasięg | celowanie | przerwa | sił | trw. | waga | cena | skąd |");
w("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
w("| 125 | Proca (jest) | proca | lina | 1 | 14 | 6 | 70 | 24 | 2 | 60 | 1 | - | warsztat |");
w("| 126 | Łuk (jest) | łuk | leszczyna | 1 | 30 | 9 | 55 | 30 | 3 | 80 | 2 | - | warsztat |");
for (const p of ranged) w(rangedRow(p));
w("");
w("## Zbroje i części zbroi (" + armour.length + ")");
w("");
w("obrona = część ciosu, którą zatrzymuje; trw. = ile ciosów przyjmie, zanim się rozpadnie (naprawa przywraca). Dziś: skórzana kurtka 171 (tors, 20%, 60 ciosów) i zielona kurta 266 - zostają bez zmian.");
w("");
w("| id | nazwa | miejsce | materiał | poz. | obrona | ciepło | kary / bonusy | trw. | waga | cena | skąd |");
w("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const p of armour) w(armourRow(p));
w("");
w("## Tarcze (" + shields.length + ")");
w("");
w("| id | nazwa | materiał | poz. | blok | oddech bloku | parowanie | osłona | kary | trw. | waga | cena | skąd |");
w("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
w("| 155 | Drewniana tarcza (jest) | drewno | 1 | 75% | 0,7 | - | - | - | 40 | 3 | - | warsztat |");
for (const p of shields) w(shieldRow(p));
w("");
w("## Dodatki (" + trinkets.length + ")");
w("");
w("| id | nazwa | rodzaj | poz. | co daje | cena | skąd |");
w("|---|---|---|---|---|---|---|");
for (const p of trinkets) w("| " + p.id + " | " + p.nazwa + " | " + p.rodzaj + " | " + p.poziom + " | " + bonusText(p) + " | " + price(p) + " | " + src(p) + " |");
w("");
w("## Unikaty (" + uniques.length + ")");
w("");
w("Każdy raz w grze, z historią z fabuły (STORY.md, QUESTY.md). Nie do kupienia ani sprzedania.");
w("");
w("| id | nazwa | co to | poz. | liczby | skąd | historia |");
w("|---|---|---|---|---|---|---|");
for (const p of uniques) {
    let what, nums;
    if (p.typ === "bron") {
        const s = D.staty(p);
        what = D.RODZAJE[p.rodzaj].nazwa;
        nums = s.dystans ? "strzał " + s.damage + ", zasięg " + num(s.range) + ", celowanie " + s.steady : "obr. " + s.dmg + ", zachw. " + s.poise + ", oddech " + s.cost + ", zasięg " + num(s.reach) + (s.crit ? ", kryt " + pct(s.crit) : "") +
            (s.ukrycie > 1 ? ", z ukrycia x" + num(s.ukrycie) : "") + (s.pancerz > 1 ? ", pancerz +" + pct(s.pancerz - 1) : "") + (Object.keys(p.reka || {}).length ? "; w ręku: " + Object.keys(p.reka).map(k => D.BONUSY[k].opis(p.reka[k])).join(", ") : "");
    } else if (p.typ === "zbroja") { what = "zbroja (" + D.MIEJSCA[p.miejsce].nazwa.toLowerCase() + ")"; nums = "obrona " + pct(p.obrona) + (karaText(p) !== "-" ? ", " + karaText(p) : "") + (bonusText(p) ? ", " + bonusText(p) : ""); }
    else if (p.typ === "tarcza") { what = "tarcza"; nums = "blok " + pct(p.blok) + ", oddech bloku " + num(p.oddechBloku) + ", parowanie +" + pct(p.parowanie) + (p.oslona ? ", szersza osłona" : ""); }
    else { what = p.rodzaj; nums = bonusText(p); }
    w("| " + p.id + " | " + p.nazwa + " | " + what + " | " + p.poziom + " | " + nums + " | " + src(p) + " | " + p.opis + " |");
}
w("");
w("## Skąd się biorą");
w("");
w("### Sklepy (w rozmowach, okno sklepu jak u ubrań: kupno, sprzedaż, naprawa)");
w("");
const shopList = s => (s.sprzedaje || []).map(id => D.przedmiot(id).nazwa).join(", ");
const SK = D.SKLEPY;
w("- **Kowal Tadek Młot** (miasto, kuźnia, " + SK.kowal.godziny.join("-") + "): brąz i żelazo - " + shopList(SK.kowal) + ". Pokazuje to, co ma poziom najwyżej o " + SK.kowal.pokaz + " wyższy od bohatera. Skupuje metal (40%), naprawia metal (stal zakonną i kruszec Pierwszych za podwójną cenę). Rabat stali z Ludzie.js zostaje (pod „Porozmawiaj”).");
w("- **Kwatermistrz Kłos** (garnizon, " + SK.kwatermistrz.godziny.join("-") + ", od przychylności " + SK.kwatermistrz.przychylnosc + "): wojskowe - " + shopList(SK.kwatermistrz) + ". Kaptur zwiadowcy od przychylności 30, brygantyna i pierścień najemnika od 50. Skupuje broń i zbroje (45%). " +
    "Gdy Kłos popłynie (D27, wydany rotmistrzowi), jego sklep prowadzi **" + SK.zastepca.kto + "**, " + SK.zastepca.tytul + " - żołnierz garnizonu przy beczkach i spichlerzu (ten sam wygląd co dotąd): ten sam towar i te same progi przychylności.");
w("- **Kantor** (Baltazar " + SK.kantor.godziny.join("-") + ", po W5 Ludmiła " + SK.ludmila.godziny.join("-") + "): stal i towar z kontynentu - " + shopList(SK.kantor) + ". Ceny kantoru jak jego inne towary (wróg x2, „w garści” x0,5). Skupuje wszystko (45%).");
w("- **Garbarz Ignac** (dopisane do jego menu ubrań): " + shopList(SK.garbarz) + ". Skupuje i naprawia skórę.");
w("- **Szwaczka Dorota** (dopisane do jej menu): " + shopList(SK.szwaczka) + ". Naprawia płótno i jedwab.");
w("- **Szmaciarz Józek Łata** (Podgrodzie, dopisane do jego menu): co dzień " + SK.szmaciarz.uzywane.ile + " używane rzeczy za pół ceny, zużyte w połowie, z: " + SK.szmaciarz.uzywane.z.map(id => D.przedmiot(id).nazwa).join(", ") + "; nowe błyskotki: " + shopList(SK.szmaciarz) + ". Skupuje wszystko za 20%.");
w("");
w("### Kucie i szycie (przepis widać od poziomu rzeczy - " + D.PRZEPISY.widac + ")");
w("");
const recipeText = r => r.inputs.map(([id, n]) => n + "x " + ({ 61: "drewno", 64: "kamień", 77: "gałęzie", 79: "węgiel", 80: "deski", 86: "żelazo", 88: "gwoździe", 93: "lina", 97: "skóra wyprawiona", 143: "stal", 155: "drewniana tarcza", 156: "pałka", 163: "ścięgna", 170: "skóra niedźwiedzia", 202: "kieł odyńca", 203: "pazur niedźwiedzia" }[id] || id)).join(", ");
const R = D.przepisy();
for (const [st, label] of [["forge", "Kuźnia"], ["tannery", "Garbarnia"], ["workbench", "Warsztat"]]) {
    w("**" + label + "** (" + R[st].length + "):");
    w("");
    w("| przedmiot | materiały | godziny | wytrzymałość |");
    w("|---|---|---|---|");
    for (const r of R[st]) w("| " + D.przedmiot(r.output[0]).nazwa + " | " + recipeText(r) + " | " + r.hours + " | " + r.stamina + " |");
    w("");
}
w("Brąz nie jest do kucia: na wyspie nie ma miedzi ani cyny - tylko sklep (Tadek ma stary zapas) i łupy. Stal z huty (żelazo + węgiel, szczypce), jak dziś.");
w("");
w("### Stalowe narzędzia (2026-10-23)");
w("");
w("Stalowa siekiera (407) i stalowy kilof (408) - kuźnia (3 stal, węgiel, deski) albo kantor (180 / 200 G). Jak żelazne zastępują kamienne, tylko lepiej: przy drzewach, krzakach, skałach i rudzie " +
    "**połowa uderzeń** liczby użytkownika (żelazne: 0,65) i o jedną trzecią mniej sił za uderzenie (żelazne: o ćwierć). Przykłady: sosna Pine_A 20 uderzeń - kamienną 20, żelazną 13, stalową 10; " +
    "Pine_C 12 - 12 / 8 / 6; zwykła skała 16 - 16 / 10 / 8; ruda (Ore) 26 - 26 / 17 / 13; głaz 20 - 20 / 13 / 10; gęstwina 5 - 5 / 3 / 3. Siła i umiejętności Zbieractwa tną dalej jak dotąd. " +
    "W walce: stalowa siekiera jak topór ze stali (obr. " + D.staty(D.przedmiot(407)).dmg + ", oddech 15, szeroki zamach), kilof jak młot (obr. " + D.staty(D.przedmiot(408)).dmg + ", oddech 21). Zużycie: 320 / 260 uderzeń (żelazne 220 / 180), naprawa w warsztacie stalą i deską albo u kowala. " +
    "Liczą się też tam, gdzie gra pyta o siekierę albo kilof (karczowanie zagrody, rynny cysterny).");
w("");
w("### Łupy");
w("");
const lootList = l => l.map(([id, c]) => D.przedmiot(id).nazwa + " " + pct(c)).join(", ");
w("- **Bandyta**: " + lootList(D.LUP.ludzie.bandit) + ". **Nożownik**: " + lootList(D.LUP.ludzie.knifer) + ". **Łucznik**: " + lootList(D.LUP.ludzie.archer) + ".");
w("- **Najemnik**: " + lootList(D.LUP.ludzie.mercenary) + ". **Worek w obozie**: " + lootList(D.LUP.oboz) + ".");
w("- **Stwory**: pusta zbroja - " + lootList(D.LUP.stwory.zbroja) + "; topielec - " + lootList(D.LUP.stwory.topielec) + "; upiór, cień - " + lootList(D.LUP.stwory.upior) + ".");
w("- **Pojemniki w podziemiach** (dodatkowy rzut przy przeszukaniu, szansa razy szczęście): " + Object.keys(D.LUP.podziemia.szansa).map(k => k + " " + pct(D.LUP.podziemia.szansa[k])).join(", ") + "; co - według pasma pięter:");
for (const b of Object.keys(D.LUP.podziemia.pasma)) w("  - pasmo " + b + ": " + D.LUP.podziemia.pasma[b].map(([id]) => D.przedmiot(id).nazwa).join(", "));
w("- **Bossowie** (zawsze, w szczątkach): " + Object.keys(D.LUP.bossowie).map(k => k + " - " + D.LUP.bossowie[k].map(id => D.przedmiot(id).nazwa).join(", ")).join("; ") + ".");
w("- **Zbrojownia Lorda** (W7, „powiem wszystko”): dochodzi " + D.LUP.zbrojowniaLorda.map(id => D.przedmiot(id).nazwa).join(", ") + ".");
w("");
w("## Klucze wyglądu");
w("");
w("Każdy klucz poniżej jest w `js/plugins/Ubior_Data.js` agenta grafiki (WZORY_ZBROI, WZORY_BRONI, WZORY_TARCZ, a `buty_czarne` w WZORY ubioru) - sprawdza to test `bron_dane_test`. " +
    "Zbroje: `helm_<rodzaj>_<materiał>`, `zbroja_<rodzaj>_<materiał>`, `karwasze_<m>`, `nagolenniki_<m>`, `buty_okute_<m>` (notatka `<Zbroja:miejsce,wzór>`); broń: `bron_<rodzaj>_<materiał>` (notatka `<Bron:rodzaj,materiał>`, unikat - trzecie słowo notatki); tarcze: `<Tarcza:wzór>`. " +
    "Wysokie buty noszą wygląd czarnych skórzanych z ubioru (`buty_czarne`). Pełna lista kluczy grafiki: `docs/ekwipunek/PLAN_BRON_ZBROJE.md`, „Klucze wyglądu”.");
w("");
w("| id | nazwa | notatka | klucz wyglądu |");
w("|---|---|---|---|");
for (const p of D.PRZEDMIOTY.filter(p => p.typ !== "dodatek").sort((a, b) => a.id - b.id)) w("| " + p.id + " | " + p.nazwa + " | `" + D.notatka(p) + "` | `" + D.wygladOf(p) + "` |");
w("");
w("## Decyzje (użytkownik, 2026-10-23)");
w("");
w("1. Poziomy przeliczone na tempo doświadczenia (brąz 5-9, żelazo 9-15, stal 15-22, zakonne 22-27) i **kara 3% za brakujący poziom (do 45%)** zamiast blokady - zostaje.");
w("2. Zbroja na miejscach ubrania i **jedno miejsce „Dodatek”** - zostaje.");
w("3. **Stalowa siekiera i kilof jako narzędzia** - dorobione (wyżej).");
w("4. **Zastępca Kłosa** po D27 - Kapral Jur, żołnierz garnizonu przy beczkach (bez nowej grafiki).");
w("5. Próba sił z nowym sprzętem - niżej.");
w("6. „Nocne widzenie” z planu - pominięte (ciemność RoomLighting nie ma na to drzwi); zamiast niego szczęście (Grosz strażnicy).");
// the balance check (tests/combat_balance.js --bron against the old gear): tools/bron/proba_sil.json, written after a run
const PROBA = path.join(__dirname, "proba_sil.json");
if (fs.existsSync(PROBA)) {
    const pr = JSON.parse(fs.readFileSync(PROBA, "utf8"));
    w("");
    w("## Próba sił z nowym sprzętem (" + pr.data + ")");
    w("");
    w(pr.opis);
    w("");
    w("| Walka | Wróg (poz.) | Bohater (poz.) | Sprzęt | Stary sprzęt: wygrane, czas, stracone życie, odnowienia | Nowy sprzęt: wygrane, czas, stracone życie, odnowienia |");
    w("|---|---|---|---|---|---|");
    for (const r of pr.wiersze) w("| " + r.name + " | " + r.level + " | " + r.hero + " | " + r.gear + " | " + r.stary + " | " + r.nowy + " |");
    if (pr.wnioski) { w(""); for (const l of pr.wnioski) w("- " + l); }
}
w("");
fs.writeFileSync(OUT, out.join("\n"));
console.log("BRON_LISTA.md: " + P.length + " przedmiotów, " + out.length + " wierszy");
