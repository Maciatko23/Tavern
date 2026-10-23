// The clothes and the looks without the game (Ubior_Data.js; Equipment.js reading the notes; Ubior_Bron.js's looks of the weapons and
// the shields; the gear of Bron_Data.js): every look a place and a ramp of hex colours from dark to light with a mask part or a picture,
// the look keys of docs/ekwipunek/PLAN.md section 5, every thing a real item with its note, icon, price and weight, Equipment putting
// the clothes, the armour, the shields and the trinkets on their parts, the bonuses (Combat.perk effects) and their words, the shops,
// the dyeing (darker over lighter), the mending; the armour's ramps and look keys, every weapon look drawable (Ubior_Bron.lookOf),
// the plain sheet kept for a sheet's own weapon in its own material, every shield's picture.
// Mirrors tests/ubior_dane_test.js (the data block, PLAN_KEYS, the shops, the card's words) and tests/bron_dane_test.js / tests/
// ubior_bron_test.js (the armour on its part, the shield in the left hand, the trinket in Dodatek, the look keys).
const unit = require("../lib/unit.js");

// the keys of docs/ekwipunek/PLAN.md section 5 (as tests/ubior_dane_test.js has them)
const PLAN_KEYS = {
    glowa: ["kapelusz_slomkowy", "kapelusz_slomkowy_ciemny", "chusta_biala", "chusta_czerwona", "chusta_niebieska", "czapka_filc_braz", "czapka_filc_szara",
        "czapka_filc_zielona", "opaska_braz", "opaska_czarna"],
    tors: ["koszula_lniana_biala", "koszula_lniana_zolta", "koszula_lniana_niebieska", "kaftan_czerwony", "kaftan_brazowy", "kaftan_granatowy", "kurta_zielona",
        "kurta_brazowa", "koszula_odswietna"],
    nogi: ["spodnie_plocienne_szare", "spodnie_plocienne_niebieskie", "spodnie_plocienne_brazowe", "spodnie_welniane_brazowe", "spodnie_welniane_zielone",
        "spodnie_skorzane_czarne", "spodnie_skorzane_brazowe"],
    stopy: ["lapcie", "buty_brazowe", "buty_czarne"],
    pas: ["pas_skorzany_braz", "pas_skorzany_czarny", "pas_sakiewka"],
    rece: ["rekawice_brazowe", "rekawice_szare"],
    plecy: ["plecak", "torba_plocienna", "torba_skorzana"]
};
const hexOk = c => /^#[0-9a-f]{6}$/i.test(c);
const luma = c => 0.299 * parseInt(c.slice(1, 3), 16) + 0.587 * parseInt(c.slice(3, 5), 16) + 0.114 * parseInt(c.slice(5, 7), 16);
const darkToLight = r => Array.isArray(r) && r.every(hexOk) && r.every((c, i) => !i || luma(c) >= luma(r[i - 1]));

unit.test(t => {
    const $dataItems = unit.data("Items");
    const $gameParty = { numItems: () => 0, hasItem: () => false };
    const w = unit.load(["TawernaCore", "Skills_Data", "Equipment", "Ubior_Data", "Bron_Data", "Ubior", "Ubior_Bron"], { globals: { $dataItems, $gameParty, $gameSystem: {} } });
    const U = w.Ubior_Data, E = w.Equipment, UB = w.UbiorBron, BD = w.Bron_Data;
    const real = id => !!($dataItems[id] && $dataItems[id].name);

    // ---- the looks of the clothes
    const parts = new Set(Object.values(U.MIEJSCA).map(m => m.czesc).filter(Boolean));
    const lookBad = Object.entries(U.WZORY).filter(([k, z]) => !U.MIEJSCA[z.miejsce] || !(z.rampa.length >= 4 && z.rampa.length <= 6) || !darkToLight(z.rampa) ||
        (!z.nakladka && !z.czesc) || (z.nakladka && !/^Ubior_[A-Za-z]+$/.test(z.nakladka)) || (z.czesc && !parts.has(z.czesc)) || (z.akcent && !hexOk(z.akcent))).map(([k]) => k);
    t.check("every look of the clothes (" + Object.keys(U.WZORY).length + "): a known place, a ramp of 4-6 hex colours from dark to light, a mask part of the places' or a " +
        "picture Ubior_*", lookBad.length === 0, lookBad);
    const keys = {};
    for (const k of Object.keys(U.WZORY)) (keys[U.WZORY[k].miejsce] = keys[U.WZORY[k].miejsce] || []).push(k);
    t.eq("the look keys by place are those of docs/ekwipunek/PLAN.md section 5", keys, PLAN_KEYS);

    // ---- the things
    E.readNotes();
    const ids = U.PRZEDMIOTY.map(p => p.id), thingBad = [];
    for (const p of U.PRZEDMIOTY) {
        const it = $dataItems[p.id], z = U.WZORY[p.wzor];
        if (!z || z.miejsce !== p.miejsce) { thingBad.push(p.id + ": look " + p.wzor); continue; }
        if (!real(p.id)) { thingBad.push(p.id + ": not in Items.json"); continue; }
        if (it.meta.Ubior !== p.miejsce + "," + p.wzor || !it.note.includes(U.notatka(p))) thingBad.push(p.id + ": note");
        if (!U.MATERIALY[p.material] || !["f", "m", "p"].includes(p.rodzaj) || !(p.trwalosc === null || p.trwalosc === "cios" || p.trwalosc > 0)) thingBad.push(p.id + ": material / gender / wear");
        for (const k of Object.keys(p.bonus)) if (!U.BONUSY[k]) thingBad.push(p.id + ": bonus " + k);
        if (p.istnieje) continue;
        const weight = /<Weight:(\d+)>/.exec(it.note);
        if (it.iconIndex !== 528 + p.id - 250 || it.name !== p.nazwa || it.price !== p.cena || !weight || Number(weight[1]) !== p.waga || !p.opis) thingBad.push(p.id + ": icon / name / price / weight");
    }
    t.check("every thing (" + ids.length + ": 250-283 and the old 113, 114, 171) once, a real item with <Ubior:place,look>, its material, gender, wear and bonuses known; " +
        "the new ones: icon 528+, name, price, <Weight:> as the data says", new Set(ids).size === ids.length && ids.filter(id => id >= 250).length === 34 &&
        ids.filter(id => id < 250).sort().join() === "113,114,171" && thingBad.length === 0, thingBad.slice(0, 8));
    const PART = id => E.WEARABLE[id], slotHas = (slot, id) => E.SLOTS.find(s => s.id === slot).items.includes(id);
    const onPart = U.PRZEDMIOTY.filter(p => PART(p.id) !== U.MIEJSCA[p.miejsce].eq || !slotHas(U.MIEJSCA[p.miejsce].eq, p.id)).map(p => p.id)
        .concat(BD.PRZEDMIOTY.filter(p => !p.istnieje && p.typ !== "bron").filter(p => {
            const want = p.typ === "zbroja" ? BD.MIEJSCA[p.miejsce].eq : p.typ === "tarcza" ? "left" : "extra";
            return PART(p.id) !== want || !slotHas(want, p.id);
        }).map(p => p.id));
    t.check("Equipment reads the notes: every piece of clothing on its part, the armour on its (head, torso, hands, legs, feet), the shields in the left hand, " +
        "the trinkets in Dodatek; the old ones keep theirs (113 feet, 114 back, 171 torso, 155 left)", onPart.length === 0 && PART(113) === "feet" && PART(114) === "back" &&
        PART(171) === "torso" && PART(155) === "left", onPart);

    // ---- the bonuses and the words
    const perkBad = Object.entries(U.BONUSY).filter(([k, b]) => (b.perk && !w.SkillData.FX[b.perk]) || (b.perk2 && !w.SkillData.FX[b.perk2[0]])).map(([k]) => k);
    t.check("the bonuses that add to Combat.perk name its effects (thirst, cold, stamina.cost, gather.cost, farm.cost); old things' own bonuses left to their plugins (STARE)",
        perkBad.length === 0 && Object.keys(U.STARE).map(Number).every(id => U.przedmiot(id).istnieje && U.przedmiot(id).bonus[U.STARE[id]] !== undefined), perkBad);
    t.eq("the card's words: the belt with a purse, a felt cap, a plain kerchief (only the look); who sells the white shirt and the festive one",
        [U.opis(279), U.opis(255), U.opis(252), U.wiersze(252), U.wiersze(279), U.gdzie(260), U.gdzie(267), U.gdzie(9999)],
        ["udźwig +15 · przy rabunku sakiewka pod pasem ocala połowę groszy", "zimą i w śniegu marzniesz o 15% mniej", "", [["Daje", "tylko wygląd"]],
            [["Udźwig", "+15"], ["Przy rabunku ocalisz", "50% groszy"]], "Dorota Igła (szwaczka), Józek Łata (handlarz starzyzną), 8 G", "kantor (towar z kontynentu), 60 G", ""]);

    // ---- the shops, the dyeing, the mending
    const shopBad = [];
    for (const [k, s] of Object.entries(U.SKLEPY)) {
        for (const wz of s.sprzedaje.concat(s.uzywane ? s.uzywane.z : [])) { const p = U.poWzorze(wz); if (!p || !(p.cena > 0) || !real(p.id)) shopBad.push(k + ": " + wz); }
        if (k === "kantor") continue;
        if (!(s.skup > 0 && s.skup < 1) || !(s.godziny[0] >= 0 && s.godziny[0] < s.godziny[1] && s.godziny[1] <= 24) || !s.kto || !s.teksty) shopBad.push(k + ": terms");
        for (const m of Array.isArray(s.skupuje) ? s.skupuje : []) if (!U.MATERIALY[m]) shopBad.push(k + ": buys " + m);
    }
    t.check("the shops (" + Object.keys(U.SKLEPY).join(", ") + "): every look sold or used maps to a real item with a price; buying back at a part of it, known materials, " +
        "open hours within the day", shopBad.length === 0, shopBad);
    const dyeBad = [];
    for (const [shop, map] of Object.entries(U.FARBOWANIE)) for (const [from, tos] of Object.entries(map)) for (const [to, price] of Object.entries(tos)) {
        const a = U.WZORY[from], b = U.WZORY[to];
        if (!U.SKLEPY[shop] || !U.SKLEPY[shop].farbuje || !a || !b || a.miejsce !== b.miejsce || !(price > 0) || !(luma(b.rampa[3]) < luma(a.rampa[3]))) dyeBad.push(from + " -> " + to);
    }
    const worn = [...new Set(U.PRZEDMIOTY.filter(p => p.trwalosc !== null).map(p => p.material))];
    t.check("the dyeing (the seamstress): the same place, a price, always a darker colour over a lighter one (white -> yellow -> blue); the mending: every material that wears " +
        "(" + worn.join(", ") + ") mended by the seamstress or the tanner, the leather also at the workbench", dyeBad.length === 0 &&
        worn.every(m => U.NAPRAWA.szwaczka.includes(m) || U.NAPRAWA.garbarz.includes(m)) && U.NAPRAWA.warsztat.skora.every(([id, n]) => real(id) && n > 0), dyeBad);

    // ---- the armour's looks
    const rampBad = Object.entries(U.RAMPY_ZBROI).filter(([k, r]) => r.rampa.length !== 7 || !darkToLight(r.rampa) || r.akcent.length !== 4 || !r.akcent.every(hexOk)).map(([k]) => k);
    const zKeys = Object.keys(U.WZORY_ZBROI), want = [];
    for (const [k, h] of Object.entries(U.HELMY)) for (const m of h.materialy) want.push("helm_" + k + "_" + m);
    for (const [k, z] of Object.entries(U.ZBROJE)) for (const m of z.materialy) want.push("zbroja_" + k + "_" + m);
    const zBad = zKeys.filter(k => { const z = U.WZORY_ZBROI[k]; return !U.MIEJSCA[z.miejsce] || !U.RAMPY_ZBROI[z.material] || !darkToLight(z.rampa); });
    t.check("the armour's ramps: 7 tones dark to light and 4 accents each; the armour's looks (" + zKeys.length + "): every helmet and every armour in each of its materials, " +
        "a known place and material", rampBad.length === 0 && zBad.length === 0 && want.every(k => zKeys.includes(k)), rampBad.concat(zBad, want.filter(k => !zKeys.includes(k))));

    // ---- the weapons' and the shields' looks (Ubior_Bron.js)
    const bKeys = Object.keys(U.WZORY_BRONI);
    const noLook = bKeys.filter(k => { const l = UB.lookOf(k); return !l || !UB.SHEETS_OF[l.rodzaj] || l.metal.length !== 7 || l.wrap.length !== 4; });
    const items = BD.PRZEDMIOTY.filter(p => p.typ === "bron").filter(p => { const l = UB.itemLook(p.id); return !l || l.rodzaj !== p.rodzaj || l.material !== p.material || !!l.unique !== !!p.unikat; });
    t.check("every weapon look (" + bKeys.length + ") is drawable: a kind with its swing sheets, 7 metal tones, 4 of the grip; every weapon item's look is its kind and material, " +
        "the uniques' own colours marked", noLook.length === 0 && items.length === 0 && Object.keys(U.BRON_RODZAJE).every(k => UB.SHEETS_OF[k]), noLook.concat(items.map(p => p.id)));
    UB.set({ Hero_Club: "bron_palka_drewno", Hero_Bow: "bron_luk_krotki", Hero_Sword: "bron_miecz_zelazo", Hero_Axe: "bron_siekiera_stal", Hero_Spear: "bron_miecz_stal" });
    const plain = ["Hero_Club", "Hero_Bow", "Hero_Sword", "Hero_Axe", "Hero_Spear"].map(UB.key);
    UB.set({ Hero_Club: "bron_miecz_zelazo", Hero_Bow: "bron_luk_bialej_zrenicy", Hero_Sword: "bron_miecz_bogumila", Hero_Punch: "bron_sztylet_braz" });
    const drawn = ["Hero_Club", "Hero_Bow", "Hero_Sword", "Hero_Punch"].map(UB.key);
    UB.set(null);
    t.eq("on a sheet: its own weapon in its own material is the plain sheet (''), another material its key, a weapon not drawn on that sheet nothing; " +
        "another kind drawn over it; a unique always its key", [plain, drawn],
        [["", "", "", "bron_siekiera_stal", ""], ["bron_miecz_zelazo", "bron_luk_bialej_zrenicy", "bron_miecz_bogumila", "bron_sztylet_braz"]]);
    const shields = BD.PRZEDMIOTY.filter(p => p.typ === "tarcza").map(p => [p.id, UB.shieldKeyOf(p.id)]);
    const shBad = shields.filter(([id, k]) => { const s = UB.shieldLook(k), z = U.WZORY_TARCZ[k]; return !s || !z || s.file !== "Ubior_Tarcza_" + z.plik || s.metal.length !== 7; });
    t.check("every shield's look: its key from the note (the wooden one by its old id), a picture Ubior_Tarcza_<plik> of Ubior_Data.js and its metal's ramp",
        shBad.length === 0 && shields.length === 8 && UB.shieldKeyOf(155) === "tarcza_drewniana", shBad);
});
