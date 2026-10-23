//=============================================================================
// Ubior.js
//=============================================================================
// The clothes seen on the hero (2026-10-22; the method: docs/ekwipunek/METODA.md, the plan: docs/ekwipunek/PLAN.md). Whatever he
// wears in Equipment.js shows on him, in every sheet of his (the walk, the run, sneaking, every work and fight, sitting, lying,
// the torch, the ride on the eagle), on the big figure of the P menu's "Ekwipunek" (with the thing chosen there tried on: tryOn)
// and on his talk bust - without one drawn combination.
//
//   - A mask per sheet (img/system/Ubior_Maska_<sheet>.png, tools/ubior/maski.py): every pixel of the figure coloured by its part -
//     hair, face and neck, hands, feet, other skin, shirt, trousers, belt, tool, outline...
//   - Clothes repaint their part through a ramp of their own colours, chosen by the brightness of the old pixel (the folds and the
//     shading stay): the shirt (tors), the trousers (nogi), the belt (pas), the hands (rece: gloves), the feet (stopy: bast shoes).
//   - Overlays sit on points found in each frame: hats and caps on the top of the hair (a picture: Ubior_Kapelusz, Ubior_Czapka),
//     the kerchief and the headband drawn from the hair itself, boots with shafts from the feet and the trousers' hems, the
//     backpack and the bag on the shoulders and the hip (Ubior_Plecak, Ubior_Torba, Ubior_Sakiewka). Lying, rolling (the head not
//     over the body) the things of the head and the back are not drawn - a hat would hang in the air.
//   - The patterns (WZORY): js/plugins/Ubior_Data.js (window.UbiorData / Tawerna.api("Ubior_Data")), a key per pattern; an item
//     says what it is with <Ubior:miejsce,wzor> in its note. Without Ubior_Data.js the patterns of this file (WZORY_GRAFIKI) work.
//   - Every dressed sheet is a live copy (one Bitmap per sheet, redrawn when the outfit changes - whoever keeps the sheet, the card,
//     the eagle's rider, sees the change), the compositions are kept (sheet + outfit) and given out by ImageManager instead of the
//     plain sheets: HeroLook.js and the swings do not know about it.
//   - (2026-10-23, docs/ekwipunek/PLAN_BRON_ZBROJE.md) Helmets, hoods, the coif (pictures Ubior_Helm_<kind>, 5 views, a material's
//     ramp + an accent's; also lying and rolling - the picture turned with the head), armour on the shirt (a texture over the ramp:
//     quilted, leather, mail, scales, plate), bracers, greaves, shod boots. Over the head: whatever sticks out over the top of a
//     cell (a helmet's crown in the walk, where the hair begins 2 px under the cell's edge) goes into the sheet's "overhang" strip
//     (HEADROOM rows over each cell) and a child sprite of whoever shows the sheet draws it right over the frame - the cells, the
//     anchors of the feet and every other plugin stay as they were. The weapons on the swings (new kinds drawn along the swing's
//     axis, materials) are Ubior_Bron.js, put in through addLayer().

/*:
 * @target MZ
 * @plugindesc Ubiór na bohaterze: wszystko, co założone (głowa, tors, nogi, stopy, pas, rękawice, plecy; hełmy, zbroje, karwasze, nagolenniki), widać na postaci we wszystkich arkuszach, na karcie postaci i na popiersiu. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter HeroLook
 * @orderAfter Equipment
 * @orderAfter Ubior_Data
 * @orderAfter MenuRing
 *
 * @help
 * ============================================================================
 * Ubior.js - widoczny ubiór bohatera
 * ============================================================================
 * Każdy założony przedmiot widać na postaci (bez rysowania kombinacji):
 *  - ubrania przemalowują część postaci (maska części ciała, rampa kolorów
 *    po jasności - cieniowanie zostaje): koszula, spodnie, pas, rękawice,
 *    łapcie;
 *  - nakładki: kapelusz, filcowa czapka, chusta, opaska, buty z cholewką,
 *    plecak, torba przez ramię, sakiewka przy pasie.
 * Przedmiot ubioru ma w notatce <Ubior:miejsce,wzor> (miejsce: glowa, tors,
 * nogi, stopy, pas, rece, plecy; wzór: klucz z tabeli WZORY w
 * Ubior_Data.js). Co założone - mówi Equipment.js (menu P -> Ekwipunek).
 * Leżąc i w przewrocie nakrycie głowy i plecak się chowają (hełmy, kaptur
 * i czepiec nie: obracają się z głową).
 * Zbroje (2026-10-23): hełmy i kaptury (Ubior_Helm_*), przeszywanica,
 * skórznia, kolczuga, łuska, napierśnik (faktura na koszuli), karwasze,
 * nagolenniki, buty okute - klucze helm_<rodzaj>_<material>,
 * zbroja_<rodzaj>_<material>, karwasze_<m>, nagolenniki_<m>,
 * buty_okute_<m> (docs/ekwipunek/PLAN_BRON_ZBROJE.md, „Klucze wyglądu”).
 * Notatka przedmiotu: <Ubior:miejsce,wzor> albo <Zbroja:miejsce,wzor>.
 * Nad głową: co wystaje nad klatkę (hełm w chodzie), rysuje się nad nią
 * (pasek „nad głową” arkusza) - klatki i kotwice stóp bez zmian.
 *
 * Skrypt (próby, test):
 *   Ubior.set({ glowa: "chusta_czerwona", tors: "kaftan_czerwony" })
 *                       - strój na sztywno (brak miejsca: jak w ekwipunku,
 *                         "" - nic); Ubior.set(null) - tylko ekwipunek
 *   Ubior.outfit()      - co widać teraz
 *   Ubior.sheet(nazwa)  - przebrany arkusz; Ubior.stats() - czas składania
 *   Ubior.tryOn(nazwa, { glowa: "kapelusz_slomkowy" }) - arkusz w tym, co
 *                         założone, plus przymierzana rzecz (podgląd w menu
 *                         P -> Ekwipunek); Ubior.itemLook(id) - miejsce i wzór
 *   Ubior.problems(nazwa) - klatki, w których nakrycie głowy siedzi źle
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Ubior";
    const T = window.Tawerna || null;
    if (window.Ubior && window.Ubior.FULL) return;   // (put into the page twice: kept as it was)

    // ---- the parts of the masks (tools/ubior/maski.py CZESCI: the same colours)
    const P = { kontur: 1, wlosy: 2, konturWlosow: 3, skora: 4, stopy: 5, konturStop: 6, koszula: 7, konturKoszuli: 8, spodnie: 9,
        pas: 10, narzedzie: 11, oczyUsta: 12, inne: 13, dlonie: 14, twarzSzyja: 15 };
    const PART_OF = new Map([[0x000000, 1], [0x3c3cdc, 2], [0x14146e, 3], [0xffc896, 4], [0xff7800, 5], [0x823c00, 6], [0xebebeb, 7],
        [0x6e6e6e, 8], [0x965a28, 9], [0xe6d200, 10], [0xff00ff, 11], [0xff0000, 12], [0x00a0a0, 13], [0xff50a0, 14], [0xbe96ff, 15]]);
    const isHair = L => L === P.wlosy || L === P.konturWlosow;
    const isSkin = L => L === P.skora || L === P.dlonie || L === P.stopy || L === P.twarzSzyja;
    const isBody = L => L === P.koszula || L === P.spodnie || L === P.pas || L === P.konturKoszuli;

    // ---- every sheet of the hero (HeroLook.js, Torch.js, Motyle.js's net): cells and the ways of the rows
    const W8 = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"], W4 = ["S", "W", "E", "N"];
    const SHEETS = {};
    for (const n of ["Walk", "Run", "Sneak", "TorchWalk", "TorchRun", "TorchSneak"]) SHEETS["Hero_" + n] = { folder: "characters", cell: 64, rows: W8 };
    for (const n of ["Axe", "AxeSide", "Pick", "Shovel", "Rake", "Hoe", "Hammer", "Rod", "Sling", "Bow", "Spear", "Club", "Punch", "Crouch", "Sit",
        "Roast", "LieDown", "Roll", "Torch", "TorchCrouch", "Net"]) SHEETS["Hero_" + n] = { folder: "system", cell: 96, rows: W4 };
    const BACK = { N: true, NW: true, NE: true };
    const FRONT = { S: true, SW: true, SE: true };

    // ---- the places on the body (the note's miejsce) -> Equipment.js's parts, and the part of the mask a ramp repaints
    const PLACES = { glowa: "head", tors: "torso", nogi: "legs", stopy: "feet", pas: "belt", rece: "hands", plecy: "back" };
    const ORDER = ["glowa", "tors", "nogi", "stopy", "pas", "rece", "plecy"];
    const PART_FOR = { tors: P.koszula, nogi: P.spodnie, pas: P.pas, rece: P.dlonie, stopy: P.stopy };
    // the brightness (luma 0..1) each part has on the plain sheets (the 3rd-97th percentile over all masks): the ramp spans it
    const RANGE = { [P.koszula]: [0.26, 0.62], [P.spodnie]: [0.12, 0.40], [P.pas]: [0.19, 0.80], [P.dlonie]: [0.41, 0.86], [P.stopy]: [0.37, 0.86],
        [P.wlosy]: [0.01, 0.27] };
    const TEMPLATE_RANGE = [0.18, 0.86];   // (the grey templates of tools/ubior/nakladki.py)

    // ---- the patterns this file knows (Ubior_Data.js's WZORY go over them; its fields win, missing ones come from here).
    // rampa: dark -> light; nakladka: kapelusz | czapka | chusta | opaska | buty | plecak | torba | sakiewka
    const WZORY_GRAFIKI = {
        kapelusz_slomkowy: { miejsce: "glowa", nakladka: "kapelusz" },
        kapelusz_slomkowy_ciemny: { miejsce: "glowa", nakladka: "kapelusz", rampa: ["#3a2a14", "#5a4220", "#7a5c2e", "#987640", "#b39054", "#c9a868"] },
        chusta_biala: { miejsce: "glowa", nakladka: "chusta", rampa: ["#6e6a62", "#9a958a", "#c2bdb0", "#dedad0", "#f2efe8"] },
        chusta_czerwona: { miejsce: "glowa", nakladka: "chusta", rampa: ["#4a1414", "#741f1c", "#9c2e26", "#bf4434", "#d8634c"] },
        chusta_niebieska: { miejsce: "glowa", nakladka: "chusta", rampa: ["#18233f", "#253862", "#345088", "#4a6cab", "#6e8fc6"] },
        czapka_filc_braz: { miejsce: "glowa", nakladka: "czapka", rampa: ["#2a1a10", "#3f2818", "#573822", "#6f4a2e", "#875e3c", "#a0744c", "#b58a60"] },
        czapka_filc_szara: { miejsce: "glowa", nakladka: "czapka", rampa: ["#26262a", "#3a3a3f", "#4e4e54", "#64646a", "#7a7a80", "#929298", "#aaaaae"] },
        czapka_filc_zielona: { miejsce: "glowa", nakladka: "czapka", rampa: ["#17220f", "#243418", "#324622", "#41582c", "#526b38", "#667f46", "#7c9558"] },
        opaska_braz: { miejsce: "glowa", nakladka: "opaska", rampa: ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"] },
        opaska_czarna: { miejsce: "glowa", nakladka: "opaska", rampa: ["#141214", "#24222a", "#36343e", "#4c4a56"] },
        koszula_lniana_biala: { miejsce: "tors", rampa: ["#4a3f33", "#6b5d4a", "#8f7f64", "#b0a07f", "#cbbd9a", "#e0d4b4", "#f0e8cf"] },
        koszula_lniana_zolta: { miejsce: "tors", rampa: ["#4a3a14", "#6e5820", "#94782e", "#b89842", "#d2b45a", "#e4ca78", "#f0dc98"] },
        koszula_lniana_niebieska: { miejsce: "tors", rampa: ["#1e2638", "#2e3a54", "#435373", "#5c6e92", "#7889ac", "#97a6c4", "#b6c2d8"] },
        kaftan_czerwony: { miejsce: "tors", rampa: ["#3a1214", "#561a1a", "#73241f", "#8f3024", "#a8402c", "#bf5638", "#d2704a"] },
        kaftan_brazowy: { miejsce: "tors", rampa: ["#2a1810", "#3f2618", "#563622", "#6d472e", "#84593a", "#9b6c48", "#b08158"] },
        kaftan_granatowy: { miejsce: "tors", rampa: ["#10142a", "#18203e", "#222d54", "#2e3c6a", "#3d4d80", "#506196", "#6878ac"] },
        kurta_zielona: { miejsce: "tors", rampa: ["#1c2614", "#2a3a1c", "#3a4f25", "#4b6330", "#5f793c", "#78914c", "#9aad66"] },
        kurta_brazowa: { miejsce: "tors", rampa: ["#24160d", "#3a2414", "#54351d", "#6d4726", "#875b31", "#a1713f", "#bb8a52"] },
        koszula_odswietna: { miejsce: "tors", rampa: ["#5a524a", "#7e766a", "#a49c8e", "#c6bfb1", "#e0dbd0", "#f2efe8", "#fbfaf6"], haft: ["#8e1c1c", "#c23a2a"] },
        spodnie_plocienne_szare: { miejsce: "nogi", rampa: ["#24221f", "#38352f", "#4e4a42", "#666157", "#7e796d"] },
        spodnie_plocienne_niebieskie: { miejsce: "nogi", rampa: ["#141a2a", "#202a42", "#2e3c5a", "#405074", "#56688e"] },
        spodnie_plocienne_brazowe: { miejsce: "nogi", rampa: ["#24170e", "#3a2617", "#523822", "#6a4a2e", "#825d3c"] },
        spodnie_welniane_brazowe: { miejsce: "nogi", rampa: ["#2a1810", "#40261a", "#583624", "#704830", "#885a3e"] },
        spodnie_welniane_zielone: { miejsce: "nogi", rampa: ["#141d10", "#223018", "#304222", "#40552c", "#526a38"] },
        spodnie_skorzane_czarne: { miejsce: "nogi", rampa: ["#0e0c0e", "#1a181c", "#28262c", "#3a3840", "#504e58"] },
        spodnie_skorzane_brazowe: { miejsce: "nogi", rampa: ["#1e120a", "#321e10", "#4a2e18", "#644022", "#80562e"] },
        lapcie: { miejsce: "stopy", rampa: ["#3a2a14", "#5c4524", "#806236", "#a3824c", "#c2a266", "#d9bd84"] },
        buty_brazowe: { miejsce: "stopy", nakladka: "buty", rampa: ["#1e1209", "#33200f", "#4b3018", "#664224", "#815634", "#9a6c44"] },
        buty_czarne: { miejsce: "stopy", nakladka: "buty", rampa: ["#0c0b0c", "#18161a", "#26232a", "#36333c", "#4a4652", "#605c6a"] },
        pas_skorzany_braz: { miejsce: "pas", rampa: ["#2a170c", "#4a2a16", "#6a3e22", "#8a5630", "#a87040"] },
        pas_skorzany_czarny: { miejsce: "pas", rampa: ["#0c0b0c", "#1c1a1e", "#2e2b32", "#423e48", "#5a5662"] },
        pas_sakiewka: { miejsce: "pas", rampa: ["#2a170c", "#4a2a16", "#6a3e22", "#8a5630", "#a87040"], nakladka: "sakiewka",
            rampaNakladki: ["#2a170c", "#4a2a16", "#6a3e22", "#8a5630", "#a87040", "#c08a56"] },
        rekawice_brazowe: { miejsce: "rece", rampa: ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f"] },
        rekawice_szare: { miejsce: "rece", rampa: ["#232226", "#36353a", "#4b4a50", "#626168", "#7b7a82", "#94939a"] },
        plecak: { miejsce: "plecy", nakladka: "plecak" },
        torba_plocienna: { miejsce: "plecy", nakladka: "torba", rampa: ["#4a3e2c", "#6e5e44", "#928060", "#b2a07c", "#cdbd98", "#e0d3b2"],
            pasek: ["#3a2c1c", "#6a5436"] },
        torba_skorzana: { miejsce: "plecy", nakladka: "torba", rampa: ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f"],
            pasek: ["#24150c", "#5a3a22"] }
    };
    // what Equipment.js has worn without a <Ubior:...> note (the items the game had before Ubior_Data.js)
    const FROM_ITEM = { 113: "buty_brazowe", 171: "kurta_brazowa", 114: "plecak" };
    // the pictures of the overlays: frame w x h, anchor = the pixel put on the middle of the top of the hair (head things) or the
    // middle of the shoulders' line (back things), cut = rows from the picture's top where the hair it does not cover is taken away
    const PICTURES = {
        kapelusz: { file: "Ubior_Kapelusz", w: 32, h: 16, anchor: [16, 2], back: 1, cut: 9, shadow: [0.72, 0.86], template: false },
        czapka: { file: "Ubior_Czapka", w: 32, h: 12, anchor: [16, 2], back: 0, cut: 8, shadow: [0.8, 0.9], template: true },
        plecak: { file: "Ubior_Plecak", w: 20, h: 16 },
        torba: { file: "Ubior_Torba", w: 9, h: 8, template: true },
        sakiewka: { file: "Ubior_Sakiewka", w: 6, h: 7, template: true }
    };

    // ---- the armour (2026-10-23, docs/ekwipunek/PLAN_BRON_ZBROJE.md): the materials (a ramp of 7, dark -> light; akcent: 4 tones of the
    // rivets, straps, the cross; polysk: how much the plate shines), the helmets (tools/ubior/helmy.py: 5 views 32 x 32 - S, SW, W, NW,
    // N, the others mirrored -, the anchor (16, 10) on the top of the hair; grey = the material, reddish = the accent, alpha 64 = an
    // opening where the face and the fringe show; cut: the picture's rows from its top where the hair it does not cover goes)
    const MATERIALY = {
        len: { rampa: ["#3e3a30", "#5a5446", "#777060", "#958d7a", "#b1a993", "#cbc4ad", "#e0dac4"], akcent: ["#2a2418", "#4a3e2a", "#6a5a3c", "#8a7650"] },
        welna: { rampa: ["#22261c", "#333a2a", "#454e39", "#58634a", "#6c785c", "#828e70", "#9aa586"], akcent: ["#2a2418", "#4a3e2a", "#6a5a3c", "#8a7650"] },
        jedwab: { rampa: ["#3c3f44", "#5a5e65", "#7b8088", "#a0a5ad", "#c6cad0", "#e0e3e7", "#f4f5f7"], akcent: ["#5a4a30", "#7a6640", "#9a8456", "#bca46e"] },
        skora: { rampa: ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f", "#bd8a55"], akcent: ["#1a100a", "#2e1c10", "#4a2e18", "#6a4426"] },
        skora_czarna: { rampa: ["#0e0b0a", "#1a1513", "#28211d", "#373029", "#4a4038", "#5e5349", "#74685c"], akcent: ["#5a4a30", "#7a6640", "#9a8456", "#bca46e"] },
        drewno: { rampa: ["#24160c", "#3a2414", "#52341d", "#6a4527", "#835833", "#9c6c40", "#b5824f"], akcent: ["#2e2c2a", "#4a4744", "#6a6662", "#8e8a84"] },
        kamien: { rampa: ["#2a2826", "#3c3936", "#504c47", "#66615a", "#7c766e", "#948d83", "#aca498"], akcent: ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"] },
        braz: { rampa: ["#2e1a0c", "#4a2c12", "#6a421b", "#8c5a26", "#ad7633", "#c99447", "#e0b464"], akcent: ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"], polysk: 0.6 },
        zelazo: { rampa: ["#1b1d20", "#2c2f33", "#40444a", "#565b62", "#6e747b", "#888e95", "#a4a9ae"], akcent: ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"], polysk: 0.4 },
        stal: { rampa: ["#1c222a", "#2e3742", "#44505d", "#5d6b7a", "#7a8999", "#9cabb9", "#c4d0da"], akcent: ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"], polysk: 0.9 },
        zakon: { rampa: ["#0e1018", "#1a1e2c", "#282e42", "#38405a", "#4c5674", "#66728f", "#8e9ab4"], akcent: ["#5a3c10", "#8a6420", "#b88c34", "#e0bc5c"], polysk: 1 }
    };
    const METAL = { braz: true, zelazo: true, stal: true, zakon: true };
    // the helmets' kinds: the materials each is made in (the keys helm_<kind>_<material>), the accent (its own tones, or "jasny": the
    // material's light ones - rivets), the texture of a metal / a soft one
    const HELMY = {
        kaptur: { cut: 32, materialy: ["len", "welna", "skora", "skora_czarna"], faktura: { miekki: "sukno" } },
        czepiec: { cut: 32, materialy: ["len", "skora", "zelazo", "stal", "zakon"], faktura: { metal: "kolczuga", miekki: "pikowana" } },
        kapalin: { cut: 21, materialy: ["zelazo", "stal", "braz", "zakon"], akcent: "skora" },
        otwarty: { cut: 21, materialy: ["skora", "braz", "zelazo", "stal"], akcent: "jasny" },
        nosal: { cut: 21, materialy: ["braz", "zelazo", "stal", "zakon"], akcent: "jasny" },
        zakonny: { cut: 32, materialy: ["zelazo", "stal", "zakon"], akcent: "jasny" }
    };
    for (const k of Object.keys(HELMY)) PICTURES["helm_" + k] = { file: "Ubior_Helm_" + k[0].toUpperCase() + k.slice(1), w: 32, h: 32, anchor: [16, 10],
        views: 5, cut: HELMY[k].cut, template: true, helm: k };
    // the armour on the shirt (tors: the shirt's ramp + a texture), the bracers (rece), the greaves (nogi), the shod boots (stopy)
    const ZBROJE = {
        przeszywanica: { materialy: ["len", "welna", "skora", "jedwab"], faktura: "pikowana" },
        skorznia: { materialy: ["skora", "skora_czarna"], faktura: "skora" },
        kolczuga: { materialy: ["zelazo", "stal", "zakon"], faktura: "kolczuga" },
        luska: { materialy: ["braz", "zelazo", "stal", "zakon"], faktura: "luska" },
        napiersnik: { materialy: ["braz", "zelazo", "stal", "zakon"], faktura: "blacha" }
    };
    const KARWASZE = ["skora", "skora_czarna", "braz", "zelazo", "stal", "zakon"], NAGOLENNIKI = ["skora", "braz", "zelazo", "stal", "zakon"], OKUTE = ["zelazo", "stal", "zakon"];
    function armourPatterns() {
        const out = {}, akc = (kind, m) => kind === "jasny" ? MATERIALY[m].rampa.slice(3) : kind ? MATERIALY[kind].akcent : MATERIALY[m].akcent;
        for (const [k, h] of Object.entries(HELMY)) {
            for (const m of h.materialy) {
                out["helm_" + k + "_" + m] = { miejsce: "glowa", nakladka: "helm_" + k, rampa: MATERIALY[m].rampa, rampaAkcentu: akc(h.akcent, m), material: m,
                    faktura: h.faktura ? h.faktura[METAL[m] ? "metal" : "miekki"] || null : null, polysk: MATERIALY[m].polysk || 0 };
            }
        }
        for (const [k, z] of Object.entries(ZBROJE)) {
            for (const m of z.materialy) out["zbroja_" + k + "_" + m] = { miejsce: "tors", rampa: MATERIALY[m].rampa, faktura: z.faktura, material: m, polysk: MATERIALY[m].polysk || 0 };
        }
        for (const m of KARWASZE) out["karwasze_" + m] = { miejsce: "rece", nakladka: "karwasze", rampa: MATERIALY[m].rampa, material: m,
            rampaDloni: METAL[m] ? MATERIALY.skora.rampa : null };
        for (const m of NAGOLENNIKI) out["nagolenniki_" + m] = { miejsce: "nogi", nakladka: "nagolenniki", rampa: MATERIALY[m].rampa, material: m, polysk: MATERIALY[m].polysk || 0 };
        for (const m of OKUTE) out["buty_okute_" + m] = { miejsce: "stopy", nakladka: "buty", rampa: MATERIALY.skora.rampa, okucie: MATERIALY[m].rampa, material: m };
        return out;
    }
    Object.assign(WZORY_GRAFIKI, armourPatterns());

    // ---- the patterns: Ubior_Data.js's over this file's
    const hex = s => { const v = String(s).replace("#", ""); return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]; };
    const dataApi = () => (T && T.api ? T.api("Ubior_Data") : null) || window.Ubior_Data || window.UbiorData || null;
    // Ubior_Data.js names a nakladka by its file (Ubior_Kapelusz, Ubior_Cholewka...): the kind of overlay here
    const KIND_OF = { kapelusz: "kapelusz", czapka: "czapka", chusta: "chusta", opaska: "opaska", cholewka: "buty", buty: "buty", plecak: "plecak",
        torba: "torba", sakiewka: "sakiewka", karwasze: "karwasze", nagolenniki: "nagolenniki" };
    // (the helmets: Ubior_Helm_Kaptur / helm_kaptur...)
    const kindOf = n => {
        if (!n) return null;
        const s = String(n).replace(/^Ubior_/i, "").toLowerCase();
        return KIND_OF[s] || (PICTURES[s] && PICTURES[s].helm ? s : null);
    };
    const darker = c => c.map(v => Math.round(v * 0.62));
    let patternsCache = null, patternsFrom = null, patternsArmour = null;
    function patterns() {
        const D = dataApi(), theirs = D && (D.WZORY || D.wzory) || null, armour = D && D.WZORY_ZBROI || null;
        if (patternsCache && patternsFrom === theirs && patternsArmour === armour) return patternsCache;
        const out = {};
        for (const k of Object.keys(WZORY_GRAFIKI)) out[k] = Object.assign({}, WZORY_GRAFIKI[k]);
        // (the clothes' WZORY, then the armour's WZORY_ZBROI - helmets, armour, bracers, greaves, shod boots: Ubior_Data.js 2026-10-23)
        for (const tab of [theirs, armour]) {
            if (!tab) continue;
            for (const k of Object.keys(tab)) {
                const w = theirs[k] || {}, mine = out[k] || {};
                const rampa = w.rampa || w.ramp || w.kolory || mine.rampa;
                out[k] = Object.assign({}, mine, w, { rampa, nakladka: kindOf(w.nakladka || w.overlay) || mine.nakladka, miejsce: w.miejsce || w.slot || mine.miejsce });
            }
        }
        patternsArmour = armour;
        for (const k of Object.keys(out)) {
            const w = out[k];
            w.key = k;
            if (Array.isArray(w.rampa) && w.rampa.length) w._ramp = w.rampa.map(hex);
            if (Array.isArray(w.rampaNakladki)) w._rampOver = w.rampaNakladki.map(hex);
            if (Array.isArray(w.haft)) w._haft = w.haft.map(hex);
            else if (w.akcent && w.miejsce === "tors") { const c = hex(w.akcent); w._haft = [darker(c), c]; }   // (the feast shirt's embroidery)
            if (w.akcent && w.miejsce === "pas") w._buckle = hex(w.akcent);
            if (Array.isArray(w.pasek)) w._strap = w.pasek.map(hex);
            // (the armour: the accent's ramp - rivets, straps, the cross -, the hands under the bracers, the shoe's iron)
            if (Array.isArray(w.rampaAkcentu)) w._akcent = w.rampaAkcentu.map(hex);
            if (Array.isArray(w.rampaDloni)) w._hands = w.rampaDloni.map(hex);
            if (Array.isArray(w.okucie)) w._iron = w.okucie.map(hex);
        }
        patternsFrom = theirs;
        patternsCache = out;
        return out;
    }

    // ---- what he wears: Equipment.js's parts (the item's note <Ubior:miejsce,wzor>), over it Ubior.set (tests, scenes)
    const store = T && T.state && T.state.define ? T.state.define("ubior", () => ({ slots: {} }), { version: 1, owner: PLUGIN })
        : () => ($gameSystem._ubior || ($gameSystem._ubior = { slots: {} }));
    // (<Zbroja:miejsce,wzor> - the armour of Bron_Data.js, 2026-10-23 - the same)
    const NOTE_RE = /<(?:Ubior|Zbroja):\s*([a-z]+)\s*,\s*([A-Za-z0-9_]+)\s*>/i;
    function patternOfItem(id) {
        const it = window.$dataItems && $dataItems[id];
        if (!it) return null;
        if (it._ubior === undefined) {
            const m = NOTE_RE.exec(it.note || "");
            it._ubior = m ? { miejsce: m[1].toLowerCase(), wzor: m[2] } : FROM_ITEM[id] ? { miejsce: null, wzor: FROM_ITEM[id] } : null;
        }
        return it._ubior;
    }
    function outfitNow() {
        const out = {}, W = patterns();
        if (!window.$gameSystem) return out;
        const D = dataApi(), E = (T && T.api && T.api("Equipment")) || window.Equipment;
        if (D && typeof D.stroj === "function") {
            // (Ubior_Data.js knows every thing of the clothes: what is worn, as { miejsce: wzor })
            let st = {};
            try { st = D.stroj() || {}; } catch (e) { st = {}; }
            for (const place of ORDER) if (st[place] && W[st[place]]) out[place] = st[place];
        }
        // the parts Ubior_Data did not fill (the armour, the old items): the worn item's note <Ubior:...> / <Zbroja:...>
        if (E && E.current) {
            for (const place of ORDER) {
                if (out[place]) continue;
                let id = 0;
                try { id = E.current(PLACES[place]) || 0; } catch (e) { id = 0; }
                const u = id ? patternOfItem(id) : null;
                if (u && W[u.wzor]) {
                    const at = u.miejsce || W[u.wzor].miejsce || place;
                    if (!out[at]) out[at] = u.wzor;
                }
            }
        }
        const s = store().slots || {};
        for (const k of ORDER) {
            if (s[k] === undefined) continue;
            if (s[k] && W[s[k]]) out[k] = s[k];
            else delete out[k];
        }
        return out;
    }
    const keyOf = o => ORDER.map(k => o[k] || "").join("|");
    let memo = { f: -1, o: {}, k: "" };
    function current() {
        const f = Graphics.frameCount;
        if (memo.f !== f) {
            const o = outfitNow();
            memo = { f, o, k: keyOf(o) };
        }
        return memo;
    }
    const changed = () => { memo.f = -1; };
    // the whole outfit at once: { glowa, tors, ... } - a missing place: as Equipment has it, "" or null: nothing; null: Equipment only
    function set(o) {
        if (!window.$gameSystem) return false;
        const s = store();
        if (o === null) { s.slots = {}; changed(); return true; }
        for (const k of ORDER) {
            if (!(k in (o || {}))) delete s.slots[k];
            else s.slots[k] = o[k] && patterns()[o[k]] ? o[k] : "";
        }
        changed();
        return true;
    }
    function wear(key) {
        const w = patterns()[key];
        if (!w || !window.$gameSystem) return false;
        store().slots[w.miejsce] = key;
        changed();
        return true;
    }
    function takeOff(place) {
        if (!ORDER.includes(place) || !window.$gameSystem) return false;
        store().slots[place] = "";
        changed();
        return true;
    }
    const heroOn = () => !window.HeroLook || !HeroLook.active || HeroLook.active();

    // ---- pictures read through a canvas of our own (willReadFrequently: the reads are not slowed down)
    function pixels(bitmap) {
        const src = bitmap._canvas || bitmap._image;
        const w = bitmap.width, h = bitmap.height, cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(src, 0, 0);
        const img = cx.getImageData(0, 0, w, h);
        return { w, h, img, data: img.data, cv, cx };
    }
    const _loadCharacter = ImageManager.loadCharacter, _loadSystem = ImageManager.loadSystem, _loadPicture = ImageManager.loadPicture;
    const plain = name => (SHEETS[name].folder === "characters" ? _loadCharacter : _loadSystem).call(ImageManager, name);
    const masks = {};
    // the mask of a sheet (file: another mask of it - Ubior_Bron.js's sheet without its weapon has its own)
    function maskOf(name, file) {
        const f = file || "Ubior_Maska_" + name, m = masks[f];
        if (m) return m;
        const b = _loadSystem.call(ImageManager, f);
        if (b.isError && b.isError()) return (masks[f] = false);
        if (!b.isReady()) return null;
        const px = pixels(b), n = px.w * px.h, parts = new Uint8Array(n), d = px.data;
        for (let i = 0; i < n; i++) {
            const p = i * 4;
            if (d[p + 3]) parts[i] = PART_OF.get((d[p] << 16) | (d[p + 1] << 8) | d[p + 2]) || P.inne;
        }
        return (masks[f] = { w: px.w, h: px.h, parts, file: f });
    }
    const pictures = {};
    function pictureOf(name) {
        const m = pictures[name];
        if (m) return m;
        const b = _loadSystem.call(ImageManager, name);
        if (b.isError && b.isError()) return (pictures[name] = false);
        if (!b.isReady()) return null;
        const px = pixels(b);
        return (pictures[name] = { w: px.w, h: px.h, data: px.data });
    }

    // ---- a ramp: the old colour's brightness over a range -> one colour of the ramp (the same old colour, the same new one)
    const luma = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const lutCache = new Map();
    function lutOf(ramp, range, key) {
        const ck = key + "@" + range.join(",");
        let f = lutCache.get(ck);
        if (f) return f;
        const n = ramp.length, lo = range[0], hi = range[1], seen = new Map();
        f = (r, g, b) => {
            const k = (r << 16) | (g << 8) | b;
            let c = seen.get(k);
            if (!c) {
                const t = Math.max(0, Math.min(1, (luma(r, g, b) - lo) / (hi - lo)));
                c = ramp[Math.round(t * (n - 1))];
                seen.set(k, c);
            }
            return c;
        };
        lutCache.set(ck, f);
        return f;
    }

    // ---- a head not over the body: the angle of the picture (0 = upright, the way to the head from the body, snapped to a quarter when
    // near one), the top of the hair along that way (the anchor) and the view from the face (in the picture's own frame)
    function headTurn(parts, W, x0, y0, cell, info, fn, fxs, fys) {
        let ux = info.hx - info.bx, uy = info.hy - info.by;
        const len = Math.hypot(ux, uy) || 1;
        ux /= len; uy /= len;
        let th = Math.atan2(ux, -uy);
        const q = Math.round(th / (Math.PI / 2)) * (Math.PI / 2);
        th = Math.abs(th - q) < 0.35 ? q : Math.round(th / (Math.PI / 8)) * (Math.PI / 8);
        // the top of the hair: the farthest hair along the way (the middle of the hair that far, within a pixel)
        let best = -1e9;
        for (let y = 0; y < cell; y++) {
            const row = (y0 + y) * W + x0;
            for (let x = 0; x < cell; x++) {
                if (!isHair(parts[row + x])) continue;
                const d = (x - info.hx) * ux + (y - info.hy) * uy;
                if (d > best) best = d;
            }
        }
        let sx = 0, sy = 0, n = 0;
        for (let y = 0; y < cell; y++) {
            const row = (y0 + y) * W + x0;
            for (let x = 0; x < cell; x++) {
                if (!isHair(parts[row + x])) continue;
                const d = (x - info.hx) * ux + (y - info.hy) * uy;
                if (d >= best - 1.5) { sx += x; sy += y; n++; }
            }
        }
        const ax = Math.round(sx / n), ay = Math.round(sy / n);
        // the face in the picture's frame (turned back by th): its side tells the view
        let view = "N";
        if (fn >= 6) {
            const fx = fxs / fn - info.hx, fy = fys / fn - info.hy, c = Math.cos(-th), s = Math.sin(-th);
            const px = fx * c - fy * s;
            view = px < -2.5 ? "W" : px > 2.5 ? "E" : "S";
        }
        return { th, ax, ay, view };
    }

    // ---- what each cell of a sheet has (from the mask, once): the head, the body, the shoulders, the belt
    const cellCache = {};
    function cellsOf(name, mask) {
        const ck = name + (mask.file && mask.file !== "Ubior_Maska_" + name ? "|" + mask.file : "");
        if (cellCache[ck]) return cellCache[ck];
        const def = SHEETS[name], cell = def.cell, W = mask.w, H = mask.h, parts = mask.parts;
        const cols = Math.floor(W / cell), rows = Math.floor(H / cell), out = [];
        for (let r = 0; r < rows; r++) {
            const dir = def.rows[r] || "S", rowCells = [];
            for (let c = 0; c < cols; c++) {
                const x0 = c * cell, y0 = r * cell;
                let hn = 0, hxs = 0, hys = 0, bn = 0, bxs = 0, bys = 0, top = -1, first = -1, shTop = -1, beltN = 0, beltY = 0, beltX0 = 1e9, beltX1 = -1;
                let fn = 0, fxs = 0, fys = 0;
                const rowHair = new Int16Array(cell);
                for (let y = 0; y < cell; y++) {
                    const row = (y0 + y) * W + x0;
                    let n = 0, shirtN = 0;
                    for (let x = 0; x < cell; x++) {
                        const L = parts[row + x];
                        if (!L) continue;
                        if (isHair(L)) { n++; hxs += x; hys += y; }
                        if (isBody(L)) { bn++; bxs += x; bys += y; }
                        if (L === P.koszula) shirtN++;
                        if (L === P.twarzSzyja || L === P.oczyUsta) { fn++; fxs += x; fys += y; }
                        if (L === P.pas) { beltN++; beltY += y; if (x < beltX0) beltX0 = x; if (x > beltX1) beltX1 = x; }
                    }
                    if (shirtN >= 4 && shTop < 0) shTop = y;   // (the shoulders: the first row with some shirt - not a bit of the collar)
                    rowHair[y] = n;
                    hn += n;
                    if (n && first < 0) first = y;
                    if (n >= 6 && top < 0) top = y;
                }
                if (top < 0) top = first;
                const info = { c, r, dir, x0, y0, none: hn === 0 };
                if (hn) {
                    let sx = 0, n = 0;
                    for (let y = top; y < Math.min(cell, top + 5); y++) {
                        const row = (y0 + y) * W + x0;
                        for (let x = 0; x < cell; x++) if (isHair(parts[row + x])) { sx += x; n++; }
                    }
                    info.ax = Math.round(sx / Math.max(1, n));
                    info.ay = top;
                    info.hx = hxs / hn;
                    info.hy = hys / hn;
                }
                if (bn) { info.bx = bxs / bn; info.by = bys / bn; }
                // standing (sitting, crouching) with the head over the body: the head and the back things are drawn; lying, upside down: not
                info.upright = info.none ? false : !bn || (info.by - info.hy > 2 && Math.abs(Math.atan2(info.bx - info.hx, info.by - info.hy)) < 0.87);
                // the head turned (lying, rolling - the helmets go with it): the way from the body to the head, the top of the hair along
                // it, the way the face looks (the view: S the face, W / E its side, N none)
                if (hn && bn && !info.upright) info.turn = headTurn(parts, W, x0, y0, cell, info, fn, fxs, fys);
                // the shoulders: the first row of the shirt, its middle (over 5 rows), its sides
                if (shTop >= 0) {
                    let sx = 0, n = 0, xmin = 1e9, xmax = -1;
                    for (let y = shTop; y < Math.min(cell, shTop + 6); y++) {
                        const row = (y0 + y) * W + x0;
                        for (let x = 0; x < cell; x++) {
                            const L = parts[row + x];
                            if (L === P.koszula || L === P.konturKoszuli) { sx += x; n++; if (x < xmin) xmin = x; if (x > xmax) xmax = x; }
                        }
                    }
                    info.sy = shTop; info.sx = sx / n; info.sx0 = xmin; info.sx1 = xmax;
                }
                if (beltN) { info.beltY = beltY / beltN; info.beltX0 = beltX0; info.beltX1 = beltX1; }
                rowCells.push(info);
            }
            // the top of the hair is exact but a handle across the top of the head splits its rows: where it and the middle of all the
            // hair disagree by more than a pixel (against the row's usual distance), the head things follow the middle
            const ok = rowCells.filter(i => !i.none && i.upright), med = v => v.slice().sort((p, q) => p - q)[v.length >> 1];
            const mdx = ok.length ? med(ok.map(i => i.ax - i.hx)) : 0, mdy = ok.length ? med(ok.map(i => i.ay - i.hy)) : 0;
            for (const i of rowCells) {
                if (i.none) continue;
                const ex = Math.round(i.hx + mdx), ey = Math.round(i.hy + mdy);
                i.top = [i.ax, i.ay];
                i.fixed = i.upright && (Math.abs(i.ax - ex) > 1 || Math.abs(i.ay - ey) > 1);
                if (i.fixed) { if (Math.abs(i.ax - ex) > 1) i.ax = ex; if (Math.abs(i.ay - ey) > 1) i.ay = ey; }
                out.push(i);
            }
        }
        return (cellCache[ck] = out);
    }

    // ---- drawing helpers over a sheet's pixels (d: RGBA, parts: the mask)
    function setPx(d, i, c) { const p = i * 4; d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255; }
    const OUTLINE = [10, 9, 8];
    // ---- over the head (2026-10-23): HEADROOM rows over every cell kept in the sheet's strip (a helmet's crown over the top of a walking
    // cell); the strip's row r holds the HEADROOM rows over that row's cells, then the cells' own top TOP_ROWS rows (a frame cut a
    // little lower - the eagle's rider - still gets its head whole). OV: the strip of the composition being made (null: none yet)
    const HEADROOM = 12, TOP_ROWS = 4, OH = HEADROOM + TOP_ROWS;
    let OV = null;
    function ovPut(ci, X, Y, c) {
        if (!OV || X < ci.x0 || X >= ci.x0 + OV.cell || Y >= ci.y0 || Y < ci.y0 - HEADROOM) return false;
        const p = ((ci.r * OH + Y - (ci.y0 - HEADROOM)) * OV.W + X) * 4, d = OV.d;
        d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
        OV.any = true;
        return true;
    }
    // a picture's frame put at (ox, oy) in a cell: skip(L) - mask parts it stays behind; lut - recolour; mirror
    function putPicture(d, parts, W, ci, cell, pic, frame, fw, fh, ox, oy, o) {
        const pd = pic.data, pw = pic.w, fx = frame * fw;
        let drawn = 0, hidden = 0, clipped = 0, onHair = 0;
        const bottom = new Int16Array(fw).fill(-1);
        for (let yy = 0; yy < fh; yy++) {
            for (let xx = 0; xx < fw; xx++) {
                const sx = o.mirror ? fw - 1 - xx : xx, hp = (yy * pw + fx + sx) * 4;
                if (!pd[hp + 3]) continue;
                bottom[xx] = yy;
                const X = ox + xx, Y = oy + yy;
                if (X < ci.x0 || X >= ci.x0 + cell || Y < ci.y0 || Y >= ci.y0 + cell) {
                    // (over the cell's top: into the strip over the head - a head thing only)
                    if (o.over && Y < ci.y0 && X >= ci.x0 && X < ci.x0 + cell) {
                        let c = [pd[hp], pd[hp + 1], pd[hp + 2]];
                        if (o.lut && !(c[0] < 20 && c[1] < 20 && c[2] < 20)) c = o.lut(c[0], c[1], c[2]);
                        if (ovPut(ci, X, Y, c)) { drawn++; continue; }
                    }
                    clipped++;
                    continue;
                }
                const i = Y * W + X, L = parts[i];
                if (o.skip && o.skip(L, d[i * 4 + 3])) { hidden++; continue; }
                if (isHair(L)) onHair++;
                let c = [pd[hp], pd[hp + 1], pd[hp + 2]];
                if (o.lut && !(c[0] < 20 && c[1] < 20 && c[2] < 20)) c = o.lut(c[0], c[1], c[2]);
                setPx(d, i, c);
                drawn++;
            }
        }
        return { drawn, hidden, clipped, onHair, bottom };
    }

    // ---- the head: a picture (hat, cap) on the top of the hair; the hair it presses down goes, the brim throws a shadow
    function headPicture(d, parts, W, ci, cell, w, kind) {
        const def = PICTURES[kind], pic = pictureOf(def.file);
        if (!pic) return null;
        const frame = BACK[ci.dir] ? def.back : 0, ox = ci.x0 + ci.ax - def.anchor[0], oy = ci.y0 + ci.ay - def.anchor[1];
        const lut = w._ramp ? lutOf(w._ramp, def.template ? TEMPLATE_RANGE : [0.14, 0.9], w.key + ":" + kind) : null;
        const res = putPicture(d, parts, W, ci, cell, pic, frame, def.w, def.h, ox, oy, { lut, skip: L => L === P.narzedzie, over: true });
        const pd = pic.data, pw = pic.w, fx = frame * def.w;
        const hatAt = (xx, yy) => xx >= 0 && xx < def.w && yy >= 0 && yy < def.h && pd[(yy * pw + fx + xx) * 4 + 3] > 0;
        let cut = 0;
        for (let Y = ci.y0; Y < Math.min(ci.y0 + cell, oy + def.cut); Y++) {
            for (let X = ci.x0; X < ci.x0 + cell; X++) {
                const i = Y * W + X;
                if (!isHair(parts[i]) || hatAt(X - ox, Y - oy)) continue;
                d[i * 4 + 3] = 0;
                cut++;
            }
        }
        for (let xx = 0; xx < def.w; xx++) {
            const X = ox + xx;
            if (res.bottom[xx] < 0 || X < ci.x0 || X >= ci.x0 + cell) continue;
            for (let k = 1; k <= def.shadow.length; k++) {
                const Y = oy + res.bottom[xx] + k;
                if (Y < ci.y0 || Y >= ci.y0 + cell) continue;
                const i = Y * W + X, L = parts[i], p = i * 4;
                if (!(isHair(L) || isSkin(L) || L === P.oczyUsta) || !d[p + 3]) continue;
                const f = def.shadow[k - 1];
                d[p] *= f; d[p + 1] *= f; d[p + 2] *= f;
            }
        }
        res.cut = cut;
        return res;
    }
    // the kerchief: the hair's top (7 rows from the top of the hair) becomes cloth - lighter on top and on the left, the hair's own
    // strands a step either way; a dark hem at its lower edge; seen from the side or behind, the knot and the two ends at the back
    function kerchief(d, parts, W, ci, cell, w, rows) {
        const ramp = w._ramp, n = ramp.length, band = rows || 7, y0 = ci.y0 + ci.ay, x0 = ci.x0;
        const hairLo = RANGE[P.wlosy][0], hairHi = RANGE[P.wlosy][1];
        let drawn = 0, hx0 = 1e9, hx1 = -1;
        const lowest = new Int16Array(cell).fill(-1);
        for (let Y = Math.max(ci.y0, y0 - 1); Y < Math.min(ci.y0 + cell, y0 + band); Y++) {
            for (let X = x0; X < x0 + cell; X++) {
                const i = Y * W + X, L = parts[i];
                if (!isHair(L) || !d[i * 4 + 3]) continue;
                // the figure's edge keeps its outline
                const edge = X === x0 || X === x0 + cell - 1 || !parts[i - 1] || !parts[i + 1] || !parts[i - W] || (Y + 1 < ci.y0 + cell && !parts[i + W]);
                if (X < hx0) hx0 = X;
                if (X > hx1) hx1 = X;
                if (lowest[X - x0] < Y) lowest[X - x0] = Y;
                if (edge) { setPx(d, i, OUTLINE); continue; }
                const p = i * 4, t = Math.max(0, Math.min(1, (luma(d[p], d[p + 1], d[p + 2]) - hairLo) / (hairHi - hairLo)));
                const vert = 1 - (Y - y0) / band;
                const k = Math.round((n - 1) * (0.35 + 0.45 * vert) + (t - 0.4) * 1.6);
                setPx(d, i, ramp[Math.max(0, Math.min(n - 1, k))]);
                drawn++;
            }
        }
        // the hem: one row under the cloth, where there is still hair
        for (let x = 0; x < cell; x++) {
            const Y = lowest[x] + 1;
            if (lowest[x] < 0 || Y >= ci.y0 + cell) continue;
            const i = Y * W + x0 + x;
            if (isHair(parts[i]) && d[i * 4 + 3]) setPx(d, i, OUTLINE);
        }
        // the knot at the back of the head (from the side, from behind)
        if (!FRONT[ci.dir] && hx1 >= 0) {
            const side = ci.dir === "W" || ci.dir === "NW" ? 1 : ci.dir === "E" || ci.dir === "NE" ? -1 : 0;
            const kx = side > 0 ? hx1 : side < 0 ? hx0 : Math.round((hx0 + hx1) / 2), ky = y0 + band - 2;
            const knot = side === 0 ? [[0, 0], [-1, 0], [1, 0], [0, 1], [-1, 2], [1, 2], [-1, 3], [1, 3]] : [[0, 0], [side, 0], [side, 1], [side, 2], [side * 2, 2], [side * 2, 3]];
            for (const [dx, dy] of knot) {
                const X = kx + dx, Y = ky + dy;
                if (X < x0 || X >= x0 + cell || Y < ci.y0 || Y >= ci.y0 + cell) continue;
                const i = Y * W + X;
                if (parts[i] === P.narzedzie) continue;
                setPx(d, i, ramp[Math.max(0, n - 3 + (dy === 0 ? 1 : 0))]);
            }
        }
        return { drawn };
    }
    // the headband: two rows across the head at the forehead (light over dark), a knot at the back
    function headband(d, parts, W, ci, cell, w) {
        const ramp = w._ramp, n = ramp.length, x0 = ci.x0, yb = ci.y0 + ci.ay + 6;
        let drawn = 0, hx0 = 1e9, hx1 = -1;
        for (let k = 0; k < 2; k++) {
            const Y = yb + k;
            if (Y < ci.y0 || Y >= ci.y0 + cell) continue;
            for (let X = x0; X < x0 + cell; X++) {
                const i = Y * W + X, L = parts[i];
                if (!(isHair(L) || L === P.twarzSzyja || L === P.oczyUsta) || !d[i * 4 + 3]) continue;
                // only across the head: between the hair's sides on this row
                const edge = !parts[i - 1] || !parts[i + 1];
                if (X < hx0) hx0 = X;
                if (X > hx1) hx1 = X;
                setPx(d, i, edge ? OUTLINE : ramp[k === 0 ? n - 1 - ((X - x0) % 5 === 0 ? 1 : 0) : Math.max(0, n - 3)]);
                drawn++;
            }
        }
        if (!FRONT[ci.dir] && hx1 >= 0) {
            const side = ci.dir === "W" || ci.dir === "NW" ? 1 : ci.dir === "E" || ci.dir === "NE" ? -1 : 0;
            const kx = side > 0 ? hx1 + 1 : side < 0 ? hx0 - 1 : Math.round((hx0 + hx1) / 2);
            const tail = side === 0 ? [[0, 2], [0, 3], [1, 3]] : [[0, 0], [0, 1], [side, 2], [side, 3]];
            for (const [dx, dy] of tail) {
                const X = kx + dx, Y = yb + dy;
                if (X < x0 || X >= x0 + cell || Y < ci.y0 || Y >= ci.y0 + cell) continue;
                const i = Y * W + X;
                if (parts[i] === P.narzedzie || isSkin(parts[i])) continue;
                setPx(d, i, ramp[Math.max(0, n - 2 - (dy > 1 ? 1 : 0))]);
            }
        }
        return { drawn };
    }
    // boots with shafts: the feet and the trousers (and the knees' holes) up to 4 px over the feet become leather; the shaft's top a
    // lighter fold
    // opt (2026-10-23): rows - how high the shaft goes over the feet (4; the greaves 7), feet - the feet repainted too (the greaves: no),
    // ramp - the shaft's own (the greaves' metal); w._iron (shod boots): the toes' cap and the shaft's top band in iron
    function boots(d, parts, W, ci, cell, w, opt) {
        const o = opt || {}, ramp = o.ramp || w._ramp, n = ramp.length, x0 = ci.x0, y0 = ci.y0, rows = o.rows || 4, feetToo = o.feet !== false;
        const key = w.key + (o.rows ? ":" + o.rows : "");
        const feetLut = lutOf(ramp, RANGE[P.stopy], key + ":feet"), legLut = lutOf(ramp, RANGE[P.spodnie], key + ":legs");
        const iron = w._iron || null, ironLut = iron ? lutOf(iron, RANGE[P.stopy], w.key + ":iron") : null;
        // "up" from the feet: toward the head
        const ux = ci.upright || !ci.bx ? 0 : Math.sign(Math.round((ci.hx - ci.bx) / Math.max(1, Math.abs(ci.hy - ci.by) + Math.abs(ci.hx - ci.bx)) * 1.4));
        const uy = ci.upright || !ci.bx ? -1 : Math.sign(Math.round((ci.hy - ci.by) / Math.max(1, Math.abs(ci.hy - ci.by) + Math.abs(ci.hx - ci.bx)) * 1.4));
        const shaft = new Uint8Array(cell * cell);
        for (let y = 0; y < cell; y++) {
            for (let x = 0; x < cell; x++) {
                const i = (y0 + y) * W + x0 + x;
                if (parts[i] !== P.stopy) continue;
                for (let k = 1; k <= rows; k++) {
                    const xx = x + ux * k, yy = y + uy * k;
                    if (xx < 0 || yy < 0 || xx >= cell || yy >= cell) break;
                    const j = (y0 + yy) * W + x0 + xx, L = parts[j];
                    if (L === P.spodnie || L === P.skora || L === P.konturStop) shaft[yy * cell + xx] = 1;
                    else if (L !== P.stopy) break;
                }
            }
        }
        const isFoot = (x, y) => x >= 0 && y >= 0 && x < cell && y < cell && parts[(y0 + y) * W + x0 + x] === P.stopy;
        let drawn = 0;
        for (let y = 0; y < cell; y++) {
            for (let x = 0; x < cell; x++) {
                const i = (y0 + y) * W + x0 + x, L = parts[i], p = i * 4;
                if (!d[p + 3]) continue;
                if (L === P.stopy) {
                    if (!feetToo) continue;
                    // (shod: the toes - the foot's last 2 px toward the ground - in an iron cap)
                    const toe = ironLut && !isFoot(x - ux * 2, y - uy * 2);
                    setPx(d, i, toe ? ironLut(d[p], d[p + 1], d[p + 2]) : feetLut(d[p], d[p + 1], d[p + 2]));
                    drawn++;
                } else if (shaft[y * cell + x] && L !== P.konturStop) {
                    // the top row of the shaft (nothing of the shaft over it): the fold, lighter (shod: an iron band)
                    const ax = x + ux, ay = y + uy, top = !(ax >= 0 && ay >= 0 && ax < cell && ay < cell && shaft[ay * cell + ax]);
                    const c = legLut(d[p], d[p + 1], d[p + 2]);
                    if (top && iron) setPx(d, i, iron[Math.max(0, iron.length - 2)]);
                    else setPx(d, i, top ? ramp[Math.min(n - 1, ramp.indexOf(c) + 2)] : (o.shine && ramp.indexOf(c) >= n - 3 ? ramp[n - 1] : c));
                    drawn++;
                }
            }
        }
        return { drawn };
    }

    // the greaves standing: the trousers and the bare shins in a band of 7 rows over the feet (each leg from its own foot's top), the
    // band's top row a lighter rim, a ridge down each shin
    function greaveBand(d, parts, W, ci, cell, w) {
        const ramp = w._ramp, n = ramp.length, lut = lutOf(ramp, RANGE[P.spodnie], w.key + ":nagol"), skin = lutOf(ramp, [0.41, 0.86], w.key + ":nagolS");
        const x0 = ci.x0, y0 = ci.y0, top = new Int16Array(cell).fill(-1);
        for (let x = 0; x < cell; x++) {
            for (let y = 0; y < cell; y++) if (parts[(y0 + y) * W + x0 + x] === P.stopy) { top[x] = y; break; }
        }
        // (a column without a foot takes its neighbour's - the legs' outline and the gaps)
        for (let pass = 0; pass < 2; pass++) for (let x = 0; x < cell; x++) if (top[x] < 0) top[x] = Math.max(x > 0 ? top[x - 1] : -1, x < cell - 1 ? top[x + 1] : -1);
        let drawn = 0;
        for (let x = 0; x < cell; x++) {
            if (top[x] < 0) continue;
            for (let y = Math.max(0, top[x] - 7); y < top[x]; y++) {
                const i = (y0 + y) * W + x0 + x, L = parts[i], p = i * 4;
                if (!d[p + 3] || !(L === P.spodnie || L === P.skora)) continue;
                const c = L === P.skora ? skin(d[p], d[p + 1], d[p + 2]) : lut(d[p], d[p + 1], d[p + 2]);
                let k = ramp.indexOf(c);
                if (y === top[x] - 7) k += 2;                                              // (the rim)
                const xl = parts[i - 1], xr = parts[i + 1];
                if ((xl === P.spodnie || xl === P.skora) && (xr === P.spodnie || xr === P.skora) && (x & 1) === (top[x] & 1)) k += w.polysk ? 1 : 0;
                setPx(d, i, ramp[Math.max(0, Math.min(n - 1, k))]);
                drawn++;
            }
        }
        return { drawn };
    }

    // ---- the armour's textures: a step of the ramp's index at (x, y) in the thing's own frame (the shoulders' middle, a picture's corner)
    const md = (v, n) => ((v % n) + n) % n;
    const FAKTURY = {
        // quilted: a diamond grid of seams, the cushions between them a touch lighter
        pikowana: (x, y) => (md(x + y, 4) === 0 || md(x - y, 4) === 0 ? -1 : md(x + y, 4) === 2 && md(x - y, 4) === 2 ? 1 : 0),
        // leather: stitched bands (a dark seam every 5 rows), a rivet here and there
        skora: (x, y) => (md(y, 5) === 4 ? -1 : md(y, 5) === 1 && md(x, 6) === 3 ? 1 : 0),
        // mail: little rings - light and dark pixels in staggered rows
        kolczuga: (x, y) => { const k = md(x + 2 * md(y, 2), 4); return md(y, 2) === 0 ? (k === 0 ? 1 : k === 2 ? -1 : 0) : (k === 1 || k === 3 ? -1 : 0); },
        // scales: rows of 3, each scale 4 wide, the rows staggered: the lower edge in shadow, the top lit
        luska: (x, y) => { const r = Math.floor(y / 3), yy = y - 3 * r, xx = md(x + (r & 1) * 2, 4); return yy === 2 ? (xx === 0 ? -1 : -2) : yy === 0 && (xx === 1 || xx === 2) ? 1 : 0; },
        // cloth: a faint weave
        sukno: (x, y) => (md(x * 3 + y * 5, 7) === 0 ? -1 : 0),
        blacha: () => 0
    };
    // the armour on the shirt: the shirt's own ramp by brightness, the texture over it (anchored on the shoulders, so it does not swim as
    // he bobs); the plate: more contrast, the light tones shine, a ridge down the front
    function armourIndex(w, t, x, y, front) {
        const n = w._ramp.length;
        if (w.faktura === "blacha") {
            // (plate: hard light - the shadows deeper, the lit side bright; a ridge down the middle; the lames under the chest)
            const k = Math.round((0.1 + 0.75 * Math.pow(t, 0.65)) * (n - 1)) + (front && x === 0 ? 2 : front && x === 1 ? -2 : 0) + (y >= 10 && md(y - 10, 3) === 2 ? -2 : 0);
            return t > 0.8 && w.polysk && (x + y) % 3 !== 0 ? n - 1 : k;
        }
        // (the shading squeezed into the ramp's middle, so the texture has room both ways; its steps doubled - at 1 px a one-tone
        // texture vanished among the tunic's own folds)
        const f = FAKTURY[w.faktura];
        return Math.round((0.18 + 0.64 * t) * (n - 1)) + (f ? 2 * f(x, y) : 0);
    }
    function armourShirt(d, parts, W, H, cell, cells, w) {
        const ramp = w._ramp, n = ramp.length, lo = RANGE[P.koszula][0], hi = RANGE[P.koszula][1];
        const cols = Math.floor(W / cell), rows = Math.floor(H / cell), anchor = new Int16Array(cols * rows * 3).fill(-999);
        for (const ci of cells) {
            if (ci.sx === undefined) continue;
            const a = (ci.r * cols + ci.c) * 3;
            anchor[a] = Math.round(ci.sx); anchor[a + 1] = ci.sy; anchor[a + 2] = FRONT[ci.dir] || BACK[ci.dir] ? 1 : 0;
        }
        for (let i = 0, N = W * H; i < N; i++) {
            if (parts[i] !== P.koszula) continue;
            const p = i * 4;
            if (!d[p + 3]) continue;
            const x = i % W, y = (i - x) / W, c = Math.floor(x / cell), r = Math.floor(y / cell), a = (r * cols + c) * 3;
            const ax = anchor[a] === -999 ? cell >> 1 : anchor[a], ay = anchor[a] === -999 ? cell >> 2 : anchor[a + 1];
            const t = Math.max(0, Math.min(1, (luma(d[p], d[p + 1], d[p + 2]) - lo) / (hi - lo)));
            const k = armourIndex(w, t, x - c * cell - ax, y - r * cell - ay, anchor[a + 2] === 1);
            setPx(d, i, ramp[Math.max(0, Math.min(n - 1, k))]);
        }
    }
    // the bracers: the forearms (the bare skin next to the hands, up to 5 px from them) in the bracers' ramp, a lighter rim at both ends;
    // the hands of metal ones in leather gloves (w._hands)
    function bracers(d, parts, W, H, w) {
        const N = W * H, depth = new Uint8Array(N), q = [];
        for (let i = 0; i < N; i++) if (parts[i] === P.dlonie) { depth[i] = 1; q.push(i); }
        for (let h = 0; h < q.length; h++) {
            const i = q[h], k = depth[i];
            if (k > 5) continue;
            for (const j of [i - 1, i + 1, i - W, i + W]) {
                if (j < 0 || j >= N || depth[j] || parts[j] !== P.skora) continue;
                depth[j] = k + 1;
                q.push(j);
            }
        }
        const ramp = w._ramp, n = ramp.length, lut = lutOf(ramp, [0.41, 0.86], w.key + ":karwasze");
        const hands = w._hands ? lutOf(w._hands, RANGE[P.dlonie], w.key + ":dlonie") : null;
        for (let i = 0; i < N; i++) {
            const k = depth[i], p = i * 4;
            if (!k || !d[p + 3]) continue;
            if (k === 1) { if (hands) setPx(d, i, hands(d[p], d[p + 1], d[p + 2])); continue; }
            const c = lut(d[p], d[p + 1], d[p + 2]);
            // (the rims: next to the hand and at the far end)
            let far = k === 6;
            if (!far) { far = true; for (const j of [i - 1, i + 1, i - W, i + W]) if (depth[j] > k) { far = false; break; } }
            setPx(d, i, k === 2 || far ? ramp[Math.min(n - 1, ramp.indexOf(c) + 1)] : c);
        }
    }

    // ---- the helmets (hood, coif, kettle hat, open helm, nasal helm, the Order's great helm): the view's picture on the top of the hair,
    // turned with the head when he lies or rolls; grey -> the material, reddish -> the accent, alpha 64 -> an opening (the face shows);
    // the hair it does not cover goes (its cut rows); a tool in front stays in front; over the cell's top: the strip over the head
    const HELM_VIEW = { S: [0, false], SW: [1, false], W: [2, false], NW: [3, false], N: [4, false], SE: [1, true], E: [2, true], NE: [3, true] };
    function helmet(d, parts, W, ci, cell, w, kind) {
        const def = PICTURES[kind], pic = pictureOf(def.file);
        if (!pic || !w._ramp) return null;
        const turn = ci.upright ? null : ci.turn;
        if (!ci.upright && !turn) return null;
        const th = turn ? turn.th : 0, ax = ci.x0 + (turn ? turn.ax : ci.ax), ay = ci.y0 + (turn ? turn.ay : ci.ay);
        const [frame, mirror] = HELM_VIEW[turn ? turn.view : ci.dir] || HELM_VIEW.S;
        const cs = Math.cos(-th), sn = Math.sin(-th), A = def.anchor, fw = def.w, fh = def.h, pd = pic.data, pw = pic.w, fx = frame * fw;
        const ramp = w._ramp, n = ramp.length, acc = w._akcent || ramp.slice(-4), tex = FAKTURY[w.faktura] || null;
        const R = 27, X0 = Math.max(ci.x0, ax - R), X1 = Math.min(ci.x0 + cell - 1, ax + R);
        const Y0 = Math.max(ci.y0 - HEADROOM, ay - R), Y1 = Math.min(ci.y0 + cell - 1, ay + R);
        // the picture's pixel under (X, Y): sx, sy (maybe outside the frame) and its alpha
        let sx = 0, sy = 0, al = 0, hp = 0;
        const at = (X, Y) => {
            const dx = X - ax, dy = Y - ay;
            let px = Math.round(dx * cs - dy * sn);
            const py = Math.round(dx * sn + dy * cs);
            if (mirror) px = -px;
            sx = A[0] + px; sy = A[1] + py;
            al = sx >= 0 && sy >= 0 && sx < fw && sy < fh ? pd[(hp = (sy * pw + fx + sx) * 4) + 3] : 0;
        };
        let drawn = 0, hidden = 0, onHair = 0, cut = 0, over = 0;
        const bw = X1 - X0 + 1, solid = new Uint8Array(bw * (Y1 - Y0 + 1));
        for (let Y = Y0; Y <= Y1; Y++) {
            for (let X = X0; X <= X1; X++) {
                at(X, Y);
                const inCell = Y >= ci.y0, i = Y * W + X, L = inCell ? parts[i] : 0;
                // the hair it does not cover (over its cut rows; never in an opening)
                if (inCell && isHair(L) && al === 0 && sy < def.cut && d[i * 4 + 3]) { d[i * 4 + 3] = 0; cut++; }
                if (al !== 255) continue;
                solid[(Y - Y0) * bw + X - X0] = 1;
                if (inCell && L === P.narzedzie) { hidden++; continue; }
                const r = pd[hp], g = pd[hp + 1], b = pd[hp + 2];
                let c;
                if (r < 20 && g < 20 && b < 20) c = OUTLINE;
                else if (r - g >= 30) c = acc[Math.max(0, Math.min(acc.length - 1, Math.round((r - 110) / 120 * (acc.length - 1))))];
                else {
                    const t = Math.max(0, Math.min(1, (luma(r, g, b) - TEMPLATE_RANGE[0]) / (TEMPLATE_RANGE[1] - TEMPLATE_RANGE[0])));
                    let k = Math.round(t * (n - 1)) + (tex ? tex(sx, sy) : 0);
                    if (w.polysk && t > 0.9) k = n - 1;
                    c = ramp[Math.max(0, Math.min(n - 1, k))];
                }
                if (!inCell) { if (ovPut(ci, X, Y, c)) over++; continue; }
                if (isHair(L)) onHair++;
                setPx(d, i, c);
                drawn++;
            }
        }
        // its shadow: under each lower edge of it (the brim, the hood's opening) the skin, the hair, the eyes a pixel or two darker
        if (!turn) {
            for (let X = X0; X <= X1; X++) {
                for (let Y = Math.max(Y0, ci.y0); Y < Y1; Y++) {
                    if (!solid[(Y - Y0) * bw + X - X0] || solid[(Y + 1 - Y0) * bw + X - X0]) continue;
                    for (let k = 1; k <= 2; k++) {
                        const YY = Y + k;
                        if (YY > Y1 || YY >= ci.y0 + cell || solid[(YY - Y0) * bw + X - X0]) break;
                        const i = YY * W + X, L = parts[i], p = i * 4;
                        if (!(isHair(L) || isSkin(L) || L === P.oczyUsta) || !d[p + 3]) break;
                        const f = k === 1 ? 0.74 : 0.88;
                        d[p] *= f; d[p + 1] *= f; d[p + 2] *= f;
                    }
                }
            }
        }
        return { drawn: drawn + over, over, hidden, onHair, cut, clipped: 0, turned: turn ? Math.round(th * 180 / Math.PI) : 0, view: turn ? turn.view : ci.dir };
    }
    // the back things: the backpack (front - the straps, side - its profile behind, back - all of it), the bag across the body
    const OVER_BODY = L => L === P.koszula || L === P.konturKoszuli || L === P.pas || L === P.spodnie || L === P.kontur;
    function backpack(d, parts, W, ci, cell, w) {
        const def = PICTURES.plecak, pic = pictureOf(def.file);
        if (!pic || ci.sy === undefined) return null;
        const dir = ci.dir;
        let frame, ox, oy = ci.y0 + ci.sy - 1, mirror = false, skip;
        if (BACK[dir]) {   // from behind: the whole pack over the back (not over the hair or the arms)
            frame = 2;
            ox = ci.x0 + Math.round(ci.sx) - 10 + (dir === "NW" ? 1 : dir === "NE" ? -1 : 0);
            oy += 1;
            skip = (L, a) => !(OVER_BODY(L) || !a);
        } else if (dir === "W" || dir === "E") {   // from the side: the profile behind the back
            frame = 1;
            mirror = dir === "E";
            ox = dir === "W" ? ci.x0 + ci.sx1 - 10 : ci.x0 + ci.sx0 - 9;
            skip = (L, a) => !(OVER_BODY(L) || !a);
        } else {   // from the front: the straps over the shoulders
            frame = 0;
            ox = ci.x0 + Math.round(ci.sx) - 10 + (dir === "SW" ? -1 : dir === "SE" ? 1 : 0);
            oy -= 1;
            skip = L => !(L === P.koszula || L === P.konturKoszuli);
        }
        const lut = w._ramp ? lutOf(w._ramp, [0.15, 0.82], w.key + ":plecak") : null;
        return putPicture(d, parts, W, ci, cell, pic, frame, def.w, def.h, ox, oy, { mirror, skip, lut });
    }
    // the belt's buckle (Ubior_Data's akcent): two pixels on the belt, in front (from behind: none)
    function buckle(d, parts, W, ci, cell, w) {
        if (!w._buckle || ci.beltY === undefined || BACK[ci.dir]) return;
        const y = ci.y0 + Math.round(ci.beltY), x = ci.x0 + (FRONT[ci.dir] ? Math.round((ci.beltX0 + ci.beltX1) / 2) : ci.dir === "W" ? ci.beltX0 + 1 : ci.beltX1 - 1);
        const hi = w._buckle, lo = darker(hi);
        for (const [dx, dy, c] of [[0, 0, hi], [1, 0, lo], [0, 1, lo]]) {
            const i = (y + dy) * W + x + dx;
            if (parts[i] === P.pas) setPx(d, i, c);
        }
    }
    function line(x0, y0, x1, y1, fn) {
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = dx + dy, x = x0, y = y0;
        for (let guard = 0; guard < 200; guard++) {
            fn(x, y);
            if (x === x1 && y === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x += sx; }
            if (e2 <= dx) { err += dx; y += sy; }
        }
    }
    function bag(d, parts, W, ci, cell, w) {
        const def = PICTURES.torba, pic = pictureOf(def.file);
        if (!pic || ci.sy === undefined) return null;
        const strap = w._strap || [[40, 28, 18], [96, 72, 46]], dir = ci.dir, x0 = ci.x0, y0 = ci.y0;
        const hipY = ci.beltY !== undefined ? Math.round(ci.beltY) + 2 : ci.sy + 14;
        const lut = w._ramp ? lutOf(w._ramp, TEMPLATE_RANGE, w.key + ":torba") : null;
        let a, b, bx;
        if (FRONT[dir]) { a = [Math.round(ci.sx1) - 3, ci.sy + 1]; b = [ci.sx0 + 1, hipY]; bx = ci.sx0 - 4; }
        else if (BACK[dir]) { a = [ci.sx0 + 3, ci.sy + 1]; b = [ci.sx1 - 1, hipY]; bx = ci.sx1 - 4; }
        else if (dir === "E") { a = [Math.round(ci.sx), ci.sy]; b = [Math.round(ci.sx), hipY]; bx = Math.round(ci.sx) - 4; }
        else { a = [Math.round(ci.sx), ci.sy]; b = [Math.round(ci.sx), ci.sy + 2]; bx = ci.sx1 - 3; }
        // the strap: two pixels thick (light over dark) over the shirt and the belt only
        line(a[0], a[1], b[0], b[1], (x, y) => {
            for (let k = 0; k < 2; k++) {
                const X = x0 + x, Y = y0 + y + k;
                if (X < x0 || X >= x0 + cell || Y < y0 || Y >= y0 + cell) continue;
                const i = Y * W + X, L = parts[i];
                if (L === P.koszula || L === P.pas || L === P.konturKoszuli) setPx(d, i, strap[k === 0 ? 1 : 0]);
            }
        });
        const behind = dir === "W";
        return putPicture(d, parts, W, ci, cell, pic, 0, def.w, def.h, x0 + bx, y0 + hipY - 1, { lut,
            skip: (L, alpha) => behind ? !!alpha : !(OVER_BODY(L) || !alpha) });
    }
    function pouch(d, parts, W, ci, cell, w) {
        const def = PICTURES.sakiewka, pic = pictureOf(def.file);
        if (!pic || ci.beltY === undefined) return null;
        const dir = ci.dir, x0 = ci.x0, y0 = ci.y0, by = Math.round(ci.beltY);
        let px;
        if (FRONT[dir]) px = ci.beltX1 - 4;
        else if (BACK[dir]) px = ci.beltX0 - 1;
        else if (dir === "E") px = ci.beltX0 + 1;
        else px = ci.beltX1 - 4;
        const lut = lutOf(w._rampOver || w._ramp || [[60, 40, 24], [110, 76, 46], [150, 110, 70]], TEMPLATE_RANGE, w.key + ":sakiewka");
        return putPicture(d, parts, W, ci, cell, pic, 0, def.w, def.h, x0 + px, y0 + by, { lut, skip: (L, a) => !(OVER_BODY(L) || !a) });
    }
    // the embroidered trim of the feast shirt: the shirt's pixels at its edges (next to its outline, toward the skin, the belt, the trousers)
    function trim(d, parts, W, H, w) {
        const c = w._haft;
        if (!c) return;
        for (let i = W + 1; i < W * H - W - 1; i++) {
            if (parts[i] !== P.koszula) continue;
            const near = [i - 1, i + 1, i - W, i + W];
            let edge = false;
            for (const j of near) {
                if (parts[j] !== P.konturKoszuli) continue;
                // the outline between the shirt and the skin / the belt / the trousers (the collar, the sleeves' and the hem's ends)
                const k = j + (j - i);
                const L2 = parts[k];
                if (isSkin(L2) || L2 === P.pas || L2 === P.spodnie || L2 === P.dlonie) { edge = true; break; }
            }
            if (edge) setPx(d, i, c[(i % 3 === 0) ? 1 : 0]);
        }
    }

    // ---- one dressed composition of a sheet (a canvas, and its strip over the head - a canvas or null); report: the head things'
    // place in every cell. lay: the other plugins' layers on this sheet ([{ L, key }] - Ubior_Bron.js's weapon)
    const stats = [];
    const report = {};
    function compose(name, src, mask, o, lay) {
        const def = SHEETS[name], px = pixels(src), W = px.w, H = px.h, d = px.data, cell = def.cell, Wz = patterns();
        const parts = lay && lay.length ? mask.parts.slice() : mask.parts;   // (a layer changes the parts - its weapon is the tool now)
        const rows = Math.floor(H / cell);
        OV = { d: new Uint8ClampedArray(W * rows * OH * 4), W, cell, any: false };
        const tors = o.tors && Wz[o.tors], hands = o.rece && Wz[o.rece], legs = o.nogi && Wz[o.nogi];
        const armour = tors && tors.faktura && tors._ramp ? tors : null, bracer = hands && hands.nakladka === "karwasze" && hands._ramp ? hands : null;
        const greaves = legs && legs.nakladka === "nagolenniki" && legs._ramp ? legs : null;
        // 1. the clothes: each worn piece repaints its part (the boots: below, with their shafts; the armour, the bracers, the greaves:
        // their own way)
        const jobs = [];
        for (const place of ORDER) {
            const w = o[place] && Wz[o[place]], part = PART_FOR[place];
            if (!w || !part || !w._ramp) continue;
            if (place === "stopy" && w.nakladka === "buty") continue;
            if ((place === "tors" && armour) || (place === "rece" && bracer) || (place === "nogi" && greaves)) continue;
            jobs[part] = lutOf(w._ramp, RANGE[part], w.key + ":" + part);
        }
        if (jobs.length) {
            for (let i = 0, n = W * H; i < n; i++) {
                const f = jobs[parts[i]];
                if (!f) continue;
                const p = i * 4;
                if (!d[p + 3]) continue;
                const c = f(d[p], d[p + 1], d[p + 2]);
                d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
            }
        }
        const cells = cellsOf(name, mask);
        if (armour) armourShirt(d, parts, W, H, cell, cells, armour);
        if (bracer) bracers(d, parts, W, H, bracer);
        if (tors && tors._haft) trim(d, parts, W, H, tors);
        // the layers (the weapon in hand), before the overlays: what they draw is the tool a helmet stays behind
        for (const { L, key } of lay || []) {
            try { L.draw({ name, d, parts, W, H, cell, cells, key, o, setPx, OUTLINE, PARTS: P }); } catch (e) { console.error(PLUGIN + ": " + (L.name || "layer") + ": " + e.message); }
        }
        // 2. the overlays, cell by cell
        const head = o.glowa && Wz[o.glowa], feet = o.stopy && Wz[o.stopy], back = o.plecy && Wz[o.plecy], belt = o.pas && Wz[o.pas];
        const helm = head && PICTURES[head.nakladka] && PICTURES[head.nakladka].helm ? head : null;
        const rep = [];
        for (const ci of cells) {
            if (greaves) (ci.upright ? greaveBand(d, parts, W, ci, cell, greaves) : boots(d, parts, W, ci, cell, greaves, { rows: 7, feet: false, shine: !!greaves.polysk }));
            if (feet && feet.nakladka === "buty" && feet._ramp) boots(d, parts, W, ci, cell, feet);
            if (ci.none || !ci.upright) {
                // (lying, rolling: a helmet turns with the head; the hats and the back things hide)
                if (helm && !ci.none && ci.turn) {
                    const r = helmet(d, parts, W, ci, cell, helm, helm.nakladka);
                    rep.push(Object.assign({ c: ci.c, r: ci.r, dir: ci.dir, x: ci.turn.ax, y: ci.turn.ay, hx: ci.hx, hy: ci.hy, top: ci.top, fixed: false, kind: helm.nakladka }, r || {}));
                } else if (head || back) rep.push({ c: ci.c, r: ci.r, dir: ci.dir, none: ci.none, off: true });
                continue;
            }
            if (belt) buckle(d, parts, W, ci, cell, belt);
            if (belt && belt.nakladka === "sakiewka") pouch(d, parts, W, ci, cell, belt);
            if (back && back.nakladka === "plecak") backpack(d, parts, W, ci, cell, back);
            if (back && back.nakladka === "torba") bag(d, parts, W, ci, cell, back);
            if (head) {
                const kind = head.nakladka;
                let r = null;
                if (kind === "kapelusz" || kind === "czapka") r = headPicture(d, parts, W, ci, cell, head, kind);
                else if (helm) r = helmet(d, parts, W, ci, cell, head, kind);
                else if (kind === "chusta" && head._ramp) r = kerchief(d, parts, W, ci, cell, head);
                else if (kind === "opaska" && head._ramp) r = headband(d, parts, W, ci, cell, head);
                rep.push(Object.assign({ c: ci.c, r: ci.r, dir: ci.dir, x: ci.ax, y: ci.ay, hx: ci.hx, hy: ci.hy, top: ci.top, fixed: ci.fixed, kind }, r || {}));
            }
        }
        if (head) report[name] = { head: o.glowa, cells: rep };
        px.cx.putImageData(px.img, 0, 0);
        // the strip over the head: the HEADROOM rows drawn over the cells, then each cell's own top rows under them
        let strip = null;
        if (OV.any) {
            const sd = OV.d;
            for (let r = 0; r < rows; r++) {
                for (let y = 0; y < TOP_ROWS; y++) {
                    const from = (r * cell + y) * W * 4, to = (r * OH + HEADROOM + y) * W * 4;
                    sd.set(d.subarray(from, from + W * 4), to);
                }
            }
            strip = document.createElement("canvas");
            strip.width = W;
            strip.height = rows * OH;
            strip.getContext("2d").putImageData(new ImageData(sd, W, rows * OH), 0, 0);
        }
        OV = null;
        return { cv: px.cv, strip };
    }

    // ---- other plugins' layers over the compositions (2026-10-23; Ubior_Bron.js: the weapon in hand drawn on its swings). A layer:
    // { name, key(sheet) -> "" (nothing on this sheet) or its look's key there, base(sheet, key) -> null or { src: a Bitmap of the
    // same size, mask: the file of its mask } (another sheet under everything - the swing without its old weapon), ready(sheet, key)
    // -> false while its pictures load, draw(ctx) - after the clothes, before the overlays (ctx: d, parts - its own copy, W, H, cell,
    // cells, key...) }. The key of a sheet = the outfit's + the layers'; asked every frame (a layer keeps its own answer for the frame).
    const layers = [];
    function addLayer(L) {
        if (!L || typeof L.draw !== "function") return null;
        const i = layers.findIndex(x => x.name === L.name);
        if (i >= 0) layers[i] = L; else layers.push(L);
        kept.clear();
        changed();
        return L;
    }
    function layersOn(name) {
        const out = [];
        for (const L of layers) {
            let key = "";
            try { key = L.key ? L.key(name) || "" : ""; } catch (e) { key = ""; }
            if (key) out.push({ L, key });
        }
        return out;
    }
    const layerKey = lay => lay.map(x => "#" + x.L.name + ":" + x.key).join("");

    // ---- the live sheets: one Bitmap per sheet, redrawn when the outfit changes; the compositions kept (sheet + outfit)
    const live = {};
    const kept = new Map();
    const KEEP = 16;
    function composed(name, src, o, k, lay) {
        const ck = name + "#" + k, e = kept.get(ck);
        if (e && e.src === src) { e.used = Graphics.frameCount; return e.cv; }
        // (a layer's own sheet under everything - the swing without its old weapon - and its mask)
        let base = src, maskFile = null;
        for (const { L, key } of lay || []) {
            const b = L.base ? L.base(name, key) : null;
            if (!b) continue;
            if (!b.src || !b.src.isReady() || (b.src.isError && b.src.isError())) return null;
            base = b.src;
            maskFile = b.mask || null;
            break;
        }
        const mask = maskOf(name, maskFile);
        if (!mask || mask.w !== base.width || mask.h !== base.height || base.width !== src.width || base.height !== src.height) return null;
        const Wz = patterns();
        for (const place of ORDER) {
            const w = o[place] && Wz[o[place]], pd = w && w.nakladka && PICTURES[w.nakladka];
            if (pd && !pictureOf(pd.file)) return null;
        }
        for (const { L, key } of lay || []) if (L.ready && !L.ready(name, key)) return null;
        const t0 = performance.now();
        const res = compose(name, base, mask, o, lay);
        const cv = res.cv;
        cv._ubiorStrip = res.strip;
        stats.push({ sheet: name, outfit: k, ms: +(performance.now() - t0).toFixed(2), w: src.width, h: src.height });
        if (stats.length > 400) stats.shift();
        kept.set(ck, { cv, src, used: Graphics.frameCount });
        if (kept.size > KEEP) {
            const old = [...kept.entries()].sort((a, b) => a[1].used - b[1].used);
            for (const [key] of old.slice(0, kept.size - KEEP)) kept.delete(key);
        }
        return cv;
    }
    // the sheet to show for `name` now (null: the plain one - not ready yet, the old Reid, nothing ever worn on this sheet)
    function sheetFor(name, folder) {
        const def = SHEETS[name];
        if (!def || def.folder !== folder || !window.$gameSystem) return null;
        const src = plain(name);
        if (!src.isReady() || (src.isError && src.isError())) return null;
        const m = current(), on = heroOn(), lay = on ? layersOn(name) : [], k = on ? m.k + layerKey(lay) : "";
        const empty = !k.replace(/\|/g, "");
        let L = live[name];
        if (!L) {
            // (the walk is kept by others - the card, the eagle's rider: it is live from the start; the others once something is worn)
            if (empty && name !== "Hero_Walk") return null;
            L = live[name] = { bmp: new Bitmap(src.width, src.height), key: null, src: null, strip: null };
            L.bmp._url = src._url;
            L.bmp._ubior = name;
            L.bmp.smooth = src.smooth;
            L.bmp._ubiorStrip = { bmp: null, on: false, cell: def.cell };
        }
        if (L.key !== k || L.src !== src) {
            const cv = empty ? (src._canvas || src._image) : composed(name, src, m.o, k, lay);
            if (!cv) return L.key === null ? null : L.bmp;   // (a picture of an overlay still loading: the last look a frame longer)
            const ctx = L.bmp.context;
            ctx.clearRect(0, 0, src.width, src.height);
            ctx.drawImage(cv, 0, 0);
            L.bmp._baseTexture.update();
            // the strip over the head (a helmet's crown over the cells' top): its own live Bitmap
            const st = L.bmp._ubiorStrip, sv = empty ? null : cv._ubiorStrip || null;
            if (sv) {
                if (!st.bmp) { st.bmp = new Bitmap(sv.width, sv.height); st.bmp.smooth = false; }
                st.bmp.context.clearRect(0, 0, sv.width, sv.height);
                st.bmp.context.drawImage(sv, 0, 0);
                st.bmp._baseTexture.update();
            }
            st.on = !!sv;
            L.key = k;
            L.src = src;
            L.bmp._ubiorDressed = !empty;
        }
        return L.bmp;
    }
    // ---- a look tried on (the P menu's Ekwipunek, 2026-10-22: the hero in the chosen thing before it is put on): the sheet `name`
    // dressed in what is worn now with `over` laid over it ({ miejsce: wzor }; "" or null - nothing on that place). A canvas from
    // the kept compositions (the same cache as the live sheets: trying the same thing again costs nothing); the plain sheet's canvas
    // when nothing is worn; null while the sheet, its mask or an overlay's picture still loads (ask again a frame later). The canvas
    // carries its strip over the head as ._ubiorStrip (cellWithHead draws both).
    function tryOn(name, over) {
        const def = SHEETS[name];
        if (!def || !window.$gameSystem) return null;
        const src = plain(name);
        if (!src.isReady() || (src.isError && src.isError())) return null;
        const o = Object.assign({}, heroOn() ? current().o : {}), Wz = patterns();
        for (const k of Object.keys(over || {})) {
            if (!ORDER.includes(k)) continue;
            if (over[k] && Wz[over[k]]) o[k] = over[k];
            else delete o[k];
        }
        const lay = heroOn() ? layersOn(name) : [], k = keyOf(o) + layerKey(lay);
        if (!k.replace(/\|/g, "")) return src._canvas || src._image || null;
        return composed(name, src, o, k, lay);
    }
    // ---- one cell of a sheet with what is over its head: a canvas cell x (HEADROOM + cell), the cell's top at y = HEADROOM.
    // src: a canvas from tryOn, a live sheet (Bitmap) or a plain one; (c, r) the cell. The P menu's figure, a portrait of the hero.
    function cellWithHead(src, name, c, r) {
        const def = SHEETS[name];
        if (!def || !src) return null;
        const cell = def.cell, img = src._canvas || src._image || src, cv = document.createElement("canvas");
        cv.width = cell;
        cv.height = cell + HEADROOM;
        const ctx = cv.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        const st = src._ubiorStrip, strip = st ? (st.bmp !== undefined ? (st.on && st.bmp ? st.bmp.canvas : null) : st) : null;
        if (strip) ctx.drawImage(strip, c * cell, r * OH, cell, HEADROOM, 0, 0, cell, HEADROOM);
        ctx.drawImage(img, c * cell, r * cell, cell, cell, 0, HEADROOM, cell, cell);
        return cv;
    }
    // which place and pattern an item dresses (Ubior_Data's item, else its note <Ubior:miejsce,wzor>): { miejsce, wzor } or null
    function itemLook(id) {
        const D = dataApi(), p = D && D.przedmiot ? D.przedmiot(id) : null;
        if (p && p.wzor && patterns()[p.wzor]) return { miejsce: p.miejsce || patterns()[p.wzor].miejsce, wzor: p.wzor };
        const u = patternOfItem(id), W = patterns();
        return u && W[u.wzor] ? { miejsce: u.miejsce || W[u.wzor].miejsce, wzor: u.wzor } : null;
    }
    ImageManager.loadCharacter = function(filename) {
        return sheetFor(filename, "characters") || _loadCharacter.apply(this, arguments);
    };
    ImageManager.loadSystem = function(filename) {
        return sheetFor(filename, "system") || _loadSystem.apply(this, arguments);
    };
    // the walking sprite: HeroLook.js sets the sheet only when it changes - the live one put in once it is there
    const _updateBitmap = Sprite_Character.prototype.updateBitmap;
    Sprite_Character.prototype.updateBitmap = function() {
        _updateBitmap.call(this);
        if (this._heroSheet && SHEETS[this._heroSheet] && SHEETS[this._heroSheet].folder === "characters") {
            const b = ImageManager.loadCharacter(this._heroSheet);
            if (b !== this.bitmap && b.isReady()) this.bitmap = b;
        }
    };
    // ---- over the head on the screen (2026-10-23): a child sprite of whoever shows a dressed sheet (the walking hero, the swing's body,
    // the eagle's rider, the hall's waiter) draws the strip's part over that sprite's frame - put in when the sheet is given to a sprite,
    // following its frame each time it is drawn (after every update, before the render: never a frame late). Its parent's opacity,
    // filters, the trees' and the roofs' order are its own.
    function Sprite_UbiorHead() { this.initialize(); }
    Sprite_UbiorHead.prototype = Object.create(Sprite.prototype);
    Sprite_UbiorHead.prototype.constructor = Sprite_UbiorHead;
    Sprite_UbiorHead.prototype.update = function() {};
    Sprite_UbiorHead.prototype.updateTransform = function() {
        this.follow();
        Sprite.prototype.updateTransform.call(this);
    };
    Sprite_UbiorHead.prototype.follow = function() {
        const p = this.parent, b = p && p.bitmap, st = b && b._ubiorStrip, f = p && p._frame, def = b && SHEETS[b._ubior];
        if (!st || !st.on || !st.bmp || !def || !f || f.width <= 0 || f.height <= 0) { this.renderable = false; return; }
        const cell = def.cell, r = Math.floor(f.y / cell), top = f.y - r * cell;
        if (top > TOP_ROWS || f.x + f.width > (Math.floor(f.x / cell) + 1) * cell) { this.renderable = false; return; }
        if (this.bitmap !== st.bmp) this.bitmap = st.bmp;
        const h = HEADROOM + top;
        this.setFrame(f.x, r * OH, f.width, h);
        this.x = -p.anchor.x * f.width;
        this.y = -p.anchor.y * f.height - h;
        this.renderable = true;
    };
    const _onBitmapChange = Sprite.prototype._onBitmapChange;
    Sprite.prototype._onBitmapChange = function() {
        _onBitmapChange.call(this);
        const b = this._bitmap;
        if (b && b._ubiorStrip && !this._ubiorHead && !(this instanceof Sprite_UbiorHead)) {
            this._ubiorHead = new Sprite_UbiorHead();
            this.addChildAt(this._ubiorHead, 0);
        }
    };
    // a new outfit at once (not a frame late): the bag and the parts changed
    const _gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function() { _gainItem.apply(this, arguments); changed(); };
    function hookEquipment() {
        const E = (T && T.api && T.api("Equipment")) || window.Equipment;
        if (!E || E._ubiorHooked) return;
        for (const fn of ["equip", "unequip"]) {
            const f = E[fn];
            if (typeof f === "function") E[fn] = function() { const r = f.apply(this, arguments); changed(); return r; };
        }
        E._ubiorHooked = true;
    }

    // (the P menu's Ekwipunek - MenuRing.js "Lista", 2026-10-22 - draws the whole cell of the live Hero_Walk itself and asks tryOn()
    // for the thing chosen in its list: no hook into the menu here any more)

    // ---- the talk bust: the same method on the portrait (img/pictures/Hero_Bust + its mask Ubior_Maska_Hero_Bust; the shirt and
    // the vest repainted smoothly - the portrait is painted, not pixel art - the head things: pictures in the bust's size)
    const BUST = "Hero_Bust";
    let bustLive = null;
    function bustFor() {
        const src = _loadPicture.call(ImageManager, BUST);
        if (!src.isReady() || !window.$gameSystem) return null;
        const m = current(), k = heroOn() ? keyOf({ glowa: m.o.glowa, tors: m.o.tors }) : "|";
        if (!bustLive) {
            if (!k.replace(/\|/g, "")) return null;
            bustLive = { bmp: new Bitmap(src.width, src.height), key: null };
            bustLive.bmp._url = src._url;
        }
        if (bustLive.key !== k) {
            const cv = k.replace(/\|/g, "") ? bustComposed(src, m.o) : (src._canvas || src._image);
            if (!cv) return bustLive.key === null ? null : bustLive.bmp;
            const ctx = bustLive.bmp.context;
            ctx.clearRect(0, 0, src.width, src.height);
            ctx.drawImage(cv, 0, 0);
            bustLive.bmp._baseTexture.update();
            bustLive.key = k;
        }
        return bustLive.bmp;
    }
    const BUST_HEAD = { kapelusz: "Ubior_Bust_Kapelusz", czapka: "Ubior_Bust_Czapka", chusta: "Ubior_Bust_Chusta", opaska: "Ubior_Bust_Opaska" };
    // the hair over this line (y) that the head thing does not cover goes (the opaska leaves the hair alone)
    const BUST_CUT = { kapelusz: 64, czapka: 72, chusta: 84, opaska: 0 };
    // the helmets (tools/ubior/helmy.py): the hood, the coif and the great helm take all the hair they do not cover - but the fringe in
    // the hood's and the coif's opening (an ellipse: cx, cy, rx, ry)
    const BUST_OPEN = { helm_kaptur: [155, 142, 51, 60], helm_czepiec: [155, 142, 48, 58] };
    for (const [k, cut] of Object.entries({ kaptur: 350, czepiec: 350, kapalin: 108, otwarty: 98, nosal: 98, zakonny: 350 })) {
        BUST_HEAD["helm_" + k] = "Ubior_Bust_Helm_" + k[0].toUpperCase() + k.slice(1);
        BUST_CUT["helm_" + k] = cut;
    }
    const bustKept = new Map();
    function bustComposed(src, o) {
        const Wz = patterns(), tors = o.tors && Wz[o.tors], head = o.glowa && Wz[o.glowa], ck = (tors ? tors.key : "") + "|" + (head ? head.key : "");
        if (bustKept.has(ck)) return bustKept.get(ck);
        const mb = _loadSystem.call(ImageManager, "Ubior_Maska_" + BUST);
        if (!mb.isReady()) return null;
        const hp = head && BUST_HEAD[head.nakladka] ? _loadSystem.call(ImageManager, BUST_HEAD[head.nakladka]) : null;
        if (hp && !hp.isReady() && !(hp.isError && hp.isError())) return null;
        const t0 = performance.now();
        const px = pixels(src), d = px.data, mk = pixels(mb).data, n = px.w * px.h;
        // the clothes: smooth (the brightness between two colours of the ramp), the shading of the painting kept
        if (tors && tors._ramp) {
            const ramp = tors._ramp, last = ramp.length - 1, tex = tors.faktura ? FAKTURY[tors.faktura] : null, plate = tors.faktura === "blacha";
            for (let i = 0; i < n; i++) {
                const p = i * 4;
                if (!d[p + 3] || !mk[p + 3] || PART_OF.get((mk[p] << 16) | (mk[p + 1] << 8) | mk[p + 2]) !== P.koszula) continue;
                let u = Math.max(0, Math.min(1, (luma(d[p], d[p + 1], d[p + 2]) - 0.12) / 0.72));
                // (the armour's texture, 3 x the size of the walking figure's - the bust is painted bigger)
                if (tex) { const x = i % px.w, y = (i - x) / px.w; u = Math.max(0, Math.min(1, u + tex(Math.floor(x / 3), Math.floor(y / 3)) * 0.09)); }
                if (plate) u = u > 0.8 && tors.polysk ? 1 : Math.pow(u, 0.8);
                const t = u * last, a = Math.floor(t), f = t - a, b = Math.min(last, a + 1);
                d[p] = ramp[a][0] + (ramp[b][0] - ramp[a][0]) * f;
                d[p + 1] = ramp[a][1] + (ramp[b][1] - ramp[a][1]) * f;
                d[p + 2] = ramp[a][2] + (ramp[b][2] - ramp[a][2]) * f;
            }
        }
        // the head thing: its picture over the bust; the hair above its lower edge outside it - gone
        if (hp && hp.isReady()) {
            const pp = pixels(hp), pd = pp.data, ramp = head._ramp, last = ramp ? ramp.length - 1 : 0, template = head.nakladka !== "kapelusz";
            const cutY = BUST_CUT[head.nakladka] || 0, open = BUST_OPEN[head.nakladka] || null, acc = head._akcent || null;
            const htex = head.faktura && FAKTURY[head.faktura] ? FAKTURY[head.faktura] : null;
            for (let i = 0; i < n; i++) {
                const p = i * 4, y = Math.floor(i / px.w);
                if (y >= cutY || !mk[p + 3]) continue;
                if (open) { const x = i % px.w, ex = (x - open[0]) / open[2], ey = (y - open[1]) / open[3]; if (ex * ex + ey * ey <= 1) continue; }
                if (PART_OF.get((mk[p] << 16) | (mk[p + 1] << 8) | mk[p + 2]) === P.wlosy && pd[p + 3] < 128) d[p + 3] = 0;
            }
            for (let i = 0; i < n; i++) {
                const p = i * 4, a = pd[p + 3] / 255;
                if (!a) continue;
                let r = pd[p], g = pd[p + 1], b = pd[p + 2];
                if (ramp && (template || head.key !== "kapelusz_slomkowy") && !(r < 24 && g < 24 && b < 24)) {
                    // (a helmet's accent - reddish in the template - through the accent's ramp, mixed by how reddish it is)
                    const red = acc ? Math.max(0, Math.min(1, (r - g - 12) / 36)) : 0, r0 = r;
                    let u = Math.max(0, Math.min(1, (luma(r, g, b) - 0.15) / 0.75));
                    // (a helmet's texture - the coif's mail - 3 x the walking figure's size, like the armour on the shirt)
                    if (htex) { const x = i % px.w, y = (i - x) / px.w; u = Math.max(0, Math.min(1, u + htex(Math.floor(x / 3), Math.floor(y / 3)) * 0.09)); }
                    const t = u * last, k = Math.floor(t), f = t - k, k2 = Math.min(last, k + 1);
                    r = ramp[k][0] + (ramp[k2][0] - ramp[k][0]) * f; g = ramp[k][1] + (ramp[k2][1] - ramp[k][1]) * f; b = ramp[k][2] + (ramp[k2][2] - ramp[k][2]) * f;
                    if (red > 0) {
                        const al = acc.length - 1, ta = Math.max(0, Math.min(1, (r0 - 100) / 140)) * al, ka = Math.floor(ta), fa = ta - ka, kb = Math.min(al, ka + 1);
                        const ar = acc[ka][0] + (acc[kb][0] - acc[ka][0]) * fa, ag = acc[ka][1] + (acc[kb][1] - acc[ka][1]) * fa, ab = acc[ka][2] + (acc[kb][2] - acc[ka][2]) * fa;
                        r += (ar - r) * red; g += (ag - g) * red; b += (ab - b) * red;
                    }
                }
                const ia = d[p + 3] / 255, oa = a + ia * (1 - a);
                d[p] = (r * a + d[p] * ia * (1 - a)) / oa;
                d[p + 1] = (g * a + d[p + 1] * ia * (1 - a)) / oa;
                d[p + 2] = (b * a + d[p + 2] * ia * (1 - a)) / oa;
                d[p + 3] = oa * 255;
            }
        }
        px.cx.putImageData(px.img, 0, 0);
        stats.push({ sheet: BUST, outfit: ck, ms: +(performance.now() - t0).toFixed(2), w: px.w, h: px.h });
        bustKept.set(ck, px.cv);
        if (bustKept.size > 8) bustKept.delete(bustKept.keys().next().value);
        return px.cv;
    }
    ImageManager.loadPicture = function(filename) {
        return (filename === BUST && bustFor()) || _loadPicture.apply(this, arguments);
    };
    // the talks' kit (TawernaUI) loads the busts past ImageManager
    function hookBusts() {
        const ui = T && T.ui;
        if (!ui || !ui.loadBust || ui._ubiorHooked) return;
        const load = ui.loadBust;
        ui.loadBust = function(name) { return (name === BUST && bustFor()) || load.apply(this, arguments); };
        ui._ubiorHooked = true;
    }

    // ---- the masks and the overlays load with the map; the hooks into the others once they are all there
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        preload();
    };
    const _Scene_Base_create = Scene_Base.prototype.create;
    Scene_Base.prototype.create = function() {
        _Scene_Base_create.call(this);
        hookEquipment();
        hookBusts();
    };
    function preload() {
        if (!window.$gameSystem || !keyOf(outfitNow()).replace(/\|/g, "")) return;
        for (const name of Object.keys(SHEETS)) _loadSystem.call(ImageManager, "Ubior_Maska_" + name);
        for (const p of Object.values(PICTURES)) _loadSystem.call(ImageManager, p.file);
    }

    // ---- frames where the head thing sits badly: no hair found, cut by the cell's edge, its place jumps (more than the head does),
    // hardly over the hair; and the ones where it is hidden (lying, upside down)
    function problems(name) {
        const rep = report[name];
        if (!rep) return null;
        const out = [], cells = rep.cells, shown = cells.filter(c => !c.off && c.drawn);
        const over = shown.map(c => c.onHair / Math.max(1, c.drawn)).sort((a, b) => a - b), median = over.length ? over[over.length >> 1] : 0;
        let prev = null;
        for (const c of cells) {
            const where = name + " wiersz " + c.r + " (" + c.dir + ") klatka " + c.c;
            if (c.off) { out.push({ where, c: c.c, r: c.r, off: true, note: true, what: c.none ? "brak głowy w masce - nic na głowie" : "głowa nie nad ciałem (leży, przewrót) - nakrycie schowane" }); prev = null; continue; }
            if (c.clipped) out.push({ where, c: c.c, r: c.r, what: "ucięte krawędzią klatki (" + c.clipped + " px)" });
            if (c.drawn && (c.kind === "kapelusz" || c.kind === "czapka")) {
                const share = c.onHair / Math.max(1, c.drawn);
                if (share < 0.5 * median) out.push({ where, c: c.c, r: c.r, what: "mało nad włosami (" + Math.round(share * 100) + "% przy zwykłych " + Math.round(median * 100) + "%)" });
            }
            if (c.fixed) out.push({ where, c: c.c, r: c.r, note: true, what: "góra włosów myląca (" + c.top.join(",") + ") - wg środka głowy (" + c.x + "," + c.y + ")" });
            if (prev && prev.r === c.r && (Math.abs(prev.x - c.x) > 2 || Math.abs(prev.y - c.y) > 2)) {
                const dx = c.x - prev.x, dy = c.y - prev.y, hdx = c.hx - prev.hx, hdy = c.hy - prev.hy, withHead = Math.abs(dx - hdx) <= 1.5 && Math.abs(dy - hdy) <= 1.5;
                out.push({ where, c: c.c, r: c.r, jump: true, note: withHead, what: "skok o " + dx + "," + dy + " px od klatki " + prev.c +
                    (withHead ? " - cała głowa tyle samo: nakrycie idzie z nią" : " - głowa tylko o " + hdx.toFixed(1) + "," + hdy.toFixed(1)) });
            }
            if (c.drawn !== undefined && c.hidden > 0.15 * (c.drawn + c.hidden)) out.push({ where, c: c.c, r: c.r, note: true, what: "narzędzie zasłania część nakrycia (tak ma być)" });
            prev = c;
        }
        return { median: +median.toFixed(2), list: out, cells: cells.length };
    }

    // (liveKey: the outfit's part of a live sheet's key - what Ubior.key() says; liveFullKey: with the layers' - the weapon)
    const outfitPart = k => (k === null || k === undefined ? k : String(k).split("#")[0]);
    const api = { VERSION: "1.1.0", FULL: true, SHEETS, PARTS: P, PLACES, ORDER, FROM_ITEM, PICTURES, WZORY_GRAFIKI, MATERIALY, HELMY, ZBROJE, HEADROOM, OH, TOP_ROWS,
        patterns, wear, takeOff, set,
        outfit: () => outfitNow(), sheet: name => (SHEETS[name] ? sheetFor(name, SHEETS[name].folder) || plain(name) : null), tryOn, itemLook, cellWithHead,
        bust: () => bustFor() || _loadPicture.call(ImageManager, BUST), bustKey: () => (bustLive ? bustLive.key : null),
        key: () => keyOf(outfitNow()), liveKey: name => (live[name] ? outfitPart(live[name].key) : null), liveFullKey: name => (live[name] ? live[name].key : null),
        sheetKey: name => keyOf(outfitNow()) + layerKey(layersOn(name)), stats: () => stats.slice(), problems,
        cells: name => (cellCache[name] ? cellCache[name].map(c => Object.assign({}, c)) : null),
        // (for Ubior_Bron.js: its layer, the masks, the pictures, the ramps; the strip of a live sheet)
        addLayer, layers: () => layers.slice(), maskOf, pictureOf, lutOf, luma, pixels, loadSystemPlain: n => _loadSystem.call(ImageManager, n),
        strip: name => (live[name] && live[name].bmp._ubiorStrip.on ? live[name].bmp._ubiorStrip.bmp : null), Sprite_UbiorHead,
        changed, clear: () => { kept.clear(); bustKept.clear(); for (const k of Object.keys(live)) live[k].key = null; if (bustLive) bustLive.key = null; changed(); } };
    window.Ubior = T && T.register ? T.register(PLUGIN, api) : api;
})();
