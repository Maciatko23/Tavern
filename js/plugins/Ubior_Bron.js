//=============================================================================
// Ubior_Bron.js
//=============================================================================
// The weapon in the hero's hand as it is seen on his swings, and the shield in his guard (2026-10-23; docs/ekwipunek/PLAN_BRON_ZBROJE.md,
// the numbers and the items: Bron_Data.js / Bron.js). A layer of Ubior.js (Ubior.addLayer): the dressed swing sheets get the weapon on
// top of everything else Ubior puts on him.
//   - New kinds (sword, long sword, cleaver, sabre, dagger, mace, flail, staff, war hammer, battle axe, czekan, bardiche, spear heads):
//     drawn once per kind along the axis of the old weapon in every frame of its swing (tools/ubior/bron.py): the swing sheet without
//     its old weapon (img/system/Ubior_BezBroni_<sheet> + its mask) under, the kind's picture (img/system/Ubior_Bron_<Sheet>_<Kind>)
//     over - a template: grey = the metal, greenish = the wood of the haft, reddish = the grip's wrap -, coloured by the material's ramps.
//   - The sheet's own weapon (club, axe, pick, spear, bow, sling) in another material: the same, its own picture as the template (the
//     bow and the sling: their wood / leather repainted on the plain sheet). In its own material (the look the sheet has) nothing is
//     composed: the plain sheet, as before.
//   - Which weapon: the item's note <Bron:rodzaj,material[,wyglad]> (Bron_Data.js; the look key bron_<rodzaj>_<material> or a unique's
//     own), on the sheets its kind is drawn on: in the combat mode the weapon in hand (Combat.hand), else on the work's sheets (axe,
//     pick) the tool he works with (the best one owned), on the others the weapon in hand.
//   - The shield: Combat_UI.js shows the shield's icon in front of him while he guards; here its picture instead
//     (img/system/Ubior_Tarcza_<Kind>: from the front and from the side, tools/ubior/tarcze.py) in its materials (<Tarcza:wzor>).
// Stands under Ubior.js (and under Bron_Data.js when it is there).

/*:
 * @target MZ
 * @plugindesc Ubiór - broń i tarcze na bohaterze: nowe rodzaje broni na zamachach (miecz, topór, młot, włócznia...), materiały broni, tarcza w gardzie. v1.0.0
 * @author Claude
 * @base Ubior
 * @orderAfter Ubior
 * @orderAfter Bron_Data
 * @orderAfter Combat_UI
 *
 * @help
 * ============================================================================
 * Ubior_Bron.js - broń i tarcze na bohaterze
 * ============================================================================
 * Broń w ręku widać na zamachach: nowe rodzaje (miecz, długi miecz, tasak,
 * szabla, sztylet, buzdygan, kiścień, kostur, młot, topór, czekan, bardysz,
 * włócznia, rohatyna, sulica) narysowane na osi starej broni w każdej
 * klatce; materiał (drewno, okute, kamień, brąz, żelazo, stal, kruszec
 * Pierwszych, zakonne) to kolory metalu, drzewca i owijki. Tarcza w gardzie
 * to jej rysunek (z przodu / z boku) zamiast ikony.
 *
 * Klucze wyglądu: bron_<rodzaj>_<material> (notatka <Bron:rodzaj,material>),
 * unikaty: trzecie słowo notatki; tarcze: <Tarcza:tarcza_...>. Lista:
 * docs/ekwipunek/PLAN_BRON_ZBROJE.md, „Klucze wyglądu”.
 *
 * Skrypt (próby, test):
 *   UbiorBron.set({ Hero_Club: "bron_miecz_stal" }) - wygląd na sztywno
 *                       (null - jak w grze); UbiorBron.look(arkusz)
 *   UbiorBron.shield("tarcza_zakonna") - tarcza na sztywno (null - z gry)
 *   UbiorBron.shieldBitmap(klucz, "front"|"side") - obrazek tarczy
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Ubior_Bron";
    const T = window.Tawerna;
    const U = window.Ubior;
    if (!T || !U || !U.addLayer) { console.warn("[Ubior_Bron] Ubior.js (1.1+) is missing - put it above this plugin"); return; }
    if (T.api && T.api(PLUGIN)) return;   // (put into the page twice: kept as it was)

    // ---- the kinds: the swing sheets each is drawn on, and each sheet's own weapon with the material its drawing already has
    const CLUB = ["Hero_Club"], AXE = ["Hero_Axe", "Hero_AxeSide"];
    const SHEETS_OF = {
        palka: CLUB, miecz: CLUB, dlugi_miecz: CLUB, tasak: CLUB, szabla: CLUB, buzdygan: CLUB, kiscien: CLUB, kostur: CLUB,
        sztylet: ["Hero_Punch", "Hero_Club"], mlot: ["Hero_Pick", "Hero_Club"],
        siekiera: AXE, topor: AXE, czekan: AXE, bardysz: AXE, kilof: ["Hero_Pick"],
        wlocznia: ["Hero_Spear"], rohatyna: ["Hero_Spear"], sulica: ["Hero_Spear"],
        luk: ["Hero_Bow"], proca: ["Hero_Sling"]
    };
    const RODZAJE = Object.keys(SHEETS_OF).sort((a, b) => b.length - a.length);   // (the longest first: dlugi_miecz before miecz)
    const NATIVE = { Hero_Club: "palka", Hero_Axe: "siekiera", Hero_AxeSide: "siekiera", Hero_Pick: "kilof", Hero_Spear: "wlocznia", Hero_Bow: "luk", Hero_Sling: "proca" };
    const NATIVE_MATERIAL = { palka: "drewno", siekiera: "zelazo", kilof: "zelazo", wlocznia: "kamien", luk: "krotki", proca: "prosta" };
    // the sheets drawn under a picture of a kind (the swing without its old weapon); the bow and the sling: repainted in place
    const CLEAN = { Hero_Club: true, Hero_Axe: true, Hero_AxeSide: true, Hero_Pick: true, Hero_Spear: true };
    const RECOLOUR = { Hero_Bow: true, Hero_Sling: true };
    const fileOf = (sheet, kind) => "Ubior_Bron_" + sheet.replace("Hero_", "") + "_" + kind[0].toUpperCase() + kind.slice(1);
    // the old items (without Bron_Data.js): their looks
    const OLD = { 156: "bron_palka_drewno", 60: "bron_siekiera_kamien", 115: "bron_siekiera_zelazo", 63: "bron_kilof_kamien", 116: "bron_kilof_zelazo",
        154: "bron_wlocznia_kamien", 126: "bron_luk_krotki", 125: "bron_proca_prosta" };

    // ---- the materials: metal (7 tones, dark -> light), wood of the haft (5), the grip's wrap (4); okute: wood with iron studs
    const SKORA = ["#2a170c", "#45291a", "#63402a", "#85593a"];
    const DREWNO = ["#3a2414", "#55361f", "#73492b", "#925f39", "#b07849"];
    const MATERIALY = {
        drewno: { metal: ["#2a1a0e", "#3e2717", "#553722", "#6d482d", "#865b39", "#9f6f47", "#b88758"], wood: DREWNO, wrap: SKORA },
        okute: { metal: ["#2a1a0e", "#3e2717", "#553722", "#6d482d", "#865b39", "#9f6f47", "#b88758"], wood: DREWNO, wrap: SKORA, studs: ["#2c2f33", "#565b62", "#888e95", "#b9bec4"] },
        kamien: { metal: ["#2a2826", "#3c3936", "#504c47", "#66615a", "#7c766e", "#948d83", "#aca498"], wood: DREWNO, wrap: ["#3a3020", "#574a32", "#756447", "#937f5e"] },
        braz: { metal: ["#2e1a0c", "#4a2c12", "#6a421b", "#8c5a26", "#ad7633", "#c99447", "#e6b766"], wood: DREWNO, wrap: SKORA },
        zelazo: { metal: ["#1b1d20", "#2c2f33", "#40444a", "#565b62", "#6e747b", "#888e95", "#b0b5ba"], wood: DREWNO, wrap: SKORA },
        stal: { metal: ["#1c222a", "#2e3742", "#44505d", "#5d6b7a", "#7a8999", "#9cabb9", "#d2dce4"], wood: DREWNO, wrap: ["#1e1c22", "#34303a", "#4c4654", "#665e70"] },
        pierwszych: { metal: ["#141310", "#2a2620", "#423b2e", "#5e523c", "#7f6e4b", "#a8925f", "#d2bc84"], wood: ["#1c1410", "#2e221a", "#443226", "#5a4434", "#725844"],
            wrap: ["#141214", "#24222a", "#36343e", "#4c4a56"] },
        zakon: { metal: ["#0e1018", "#1a1e2c", "#282e42", "#38405a", "#4c5674", "#66728f", "#a8b4cc"], wood: ["#1c1410", "#2e221a", "#443226", "#5a4434", "#725844"],
            wrap: ["#5a3c10", "#8a6420", "#b88c34", "#e0bc5c"] },
        // the bows (their limbs), the slings (their leather): the ramp of the repainted wood / leather
        krotki: { bow: ["#2a1a0e", "#43291a", "#5e3c24", "#7a5232", "#966a42", "#b08458"] },
        dlugi: { bow: ["#2b1408", "#47220f", "#663418", "#864922", "#a5622f", "#c27f45"] },
        refleksyjny: { bow: ["#1e1712", "#3b2c20", "#5c4632", "#8a6c4a", "#b99a6f", "#e2cfa4"] },
        prosta: { bow: ["#3a2f20", "#574631", "#756044", "#93795a", "#b09473", "#c9b08f"] },
        skorzana: { bow: ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f"] },
        rzemienna: { bow: ["#1c120c", "#2f1d13", "#462b1b", "#5f3b24", "#7a4e30", "#97663f"] }
    };
    MATERIALY.zakon.bow = ["#0e1018", "#1a1e2c", "#2c3248", "#3e4864", "#56648a", "#7888aa"];
    // the uniques (the note's third word): a kind and its own colours
    const UNIKATY = {
        bron_miecz_bogumila: { rodzaj: "miecz", material: "zakon", metal: ["#141a26", "#222c40", "#34425e", "#4a5c80", "#687ea2", "#93a8c6", "#e2ecf6"], wrap: ["#6a4a14", "#9a7224", "#c89a3a", "#f0cc68"] },
        bron_kostur_przeora: { rodzaj: "kostur", material: "zakon", metal: ["#5a3c10", "#7a5418", "#9a6e22", "#b8892e", "#d2a444", "#e8c064", "#f6dc94"], wrap: ["#3a1018", "#5a1a24", "#7a2632", "#9a3442"] },
        bron_dlugi_miecz_bez_herbu: { rodzaj: "dlugi_miecz", material: "pierwszych" },
        bron_szabla_brzozowa: { rodzaj: "szabla", material: "stal", wrap: ["#3a0e10", "#5e1618", "#862024", "#ac3030"] },
        bron_sztylet_krucze_pioro: { rodzaj: "sztylet", material: "stal", metal: ["#08080c", "#121218", "#1c1c26", "#282a36", "#383c4c", "#4e5468", "#7a86a6"], wrap: ["#08080a", "#141418", "#222228", "#34343c"] },
        bron_luk_bialej_zrenicy: { rodzaj: "luk", material: "refleksyjny", bow: ["#5a5650", "#7e7a72", "#a29d94", "#c4c0b6", "#e0ddd4", "#f6f4ee"] }
    };
    const hex = s => { const v = String(s).replace("#", ""); return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]; };
    // a look key -> { key, rodzaj, material, ramps } (null: not a weapon look)
    const looks = new Map();
    function lookOf(key) {
        if (!key) return null;
        if (looks.has(key)) return looks.get(key);
        let r = null;
        const D = window.Ubior_Data, theirs = D && D.WZORY_BRONI && D.WZORY_BRONI[key];
        const uq = UNIKATY[key];
        if (theirs || uq) {
            const w = Object.assign({}, uq || {}, theirs || {});
            r = { rodzaj: w.rodzaj, material: w.material, own: w };
        } else {
            const m = /^bron_(.+)$/.exec(key);
            if (m) {
                const kind = RODZAJE.find(k => m[1] === k || m[1].startsWith(k + "_"));
                if (kind) r = { rodzaj: kind, material: m[1] === kind ? NATIVE_MATERIAL[kind] || "zelazo" : m[1].slice(kind.length + 1), own: {} };
            }
        }
        if (r && SHEETS_OF[r.rodzaj]) {
            const base = MATERIALY[r.material] || MATERIALY.zelazo, o = r.own;
            r.key = key;
            r.metal = (o.metal || o.rampa || base.metal || MATERIALY.zelazo.metal).map(hex);
            r.wood = (o.wood || o.drzewce || base.wood || DREWNO).map(hex);
            r.wrap = (o.wrap || o.owijka || base.wrap || SKORA).map(hex);
            r.studs = base.studs ? base.studs.map(hex) : null;
            r.bow = (o.bow || o.luk || base.bow || MATERIALY.krotki.bow).map(hex);
            // (a look of its own colours - a unique - is drawn even in the sheet's own kind and material)
            r.unique = !!(UNIKATY[key] || (theirs && (theirs.metal || theirs.rampa || theirs.owijka || theirs.drzewce || theirs.luk)));
        } else r = null;
        looks.set(key, r);
        return r;
    }

    // ---- what is in his hand, what he works with
    const B = () => T.api("Bron_Data") || window.Bron_Data || null;
    const NOTE_RE = /<Bron:\s*([a-z_]+)\s*,\s*([a-z_]+)\s*(?:,\s*([A-Za-z0-9_]+)\s*)?>/i;
    function itemLook(id) {
        if (!id || !window.$dataItems || !$dataItems[id]) return null;
        const D = B();
        if (D && D.przedmiot && D.wygladOf) {
            const p = D.przedmiot(id);
            if (p && p.typ === "bron") return lookOf(D.wygladOf(p));
        }
        const it = $dataItems[id];
        if (it._ubiorBron === undefined) {
            const m = NOTE_RE.exec(it.note || "");
            it._ubiorBron = m ? (m[3] || "bron_" + m[1].toLowerCase() + "_" + m[2].toLowerCase()) : OLD[id] || null;
        }
        return lookOf(it._ubiorBron);
    }
    const has = id => !!(window.$dataItems && $dataItems[id] && $gameParty.numItems($dataItems[id]) > 0);
    const C = () => T.api("Combat") || window.Combat || null;
    function handItem() {
        const c = C(), h = c && c.hand ? c.hand() : null;
        if (!h) return 0;
        if (h === "ranged") return c.rangedItem ? c.rangedItem() || 0 : 0;
        return h[0] === "m" ? Number(h.slice(1)) || 0 : 0;
    }
    const combatOn = () => { const c = C(); return !!(c && c.combatMode && c.combatMode()); };
    // the tool of a work sheet: the iron one when owned (as ChoppableTree_Objects.js picks it), else the plain one; a better one of the
    // kind (Bron_Data: steel) first
    const TOOL_RANK = { stal: 4, zakon: 5, pierwszych: 4, zelazo: 3, braz: 2, kamien: 1, drewno: 0 };
    function toolFor(kind, ids) {
        let best = null, rank = -1;
        const D = B(), all = D && D.PRZEDMIOTY ? D.PRZEDMIOTY.filter(p => p.typ === "bron" && p.rodzaj === kind).map(p => p.id) : ids;
        for (const id of all) {
            if (!has(id)) continue;
            const l = itemLook(id), r = l ? TOOL_RANK[l.material] || 0 : 0;
            if (l && r > rank) { rank = r; best = l; }
        }
        return best;
    }
    function rangedFor(kind, old) {
        const br = T.api("Bron");
        const owned = br && br.rangedOwned ? br.rangedOwned(kind === "luk" ? "bow" : "sling") : [];
        const id = owned.length ? owned[0].id : has(old) ? old : 0;
        return id ? itemLook(id) : null;
    }
    // the look on a sheet now (null: its own)
    let forced = null;
    function lookFor(sheet) {
        if (forced && sheet in forced) return forced[sheet] ? lookOf(forced[sheet]) : null;
        if (!window.$gameParty || !NATIVE[sheet] && sheet !== "Hero_Punch") return null;
        const inHand = itemLook(handItem());
        const onThis = inHand && SHEETS_OF[inHand.rodzaj].includes(sheet) ? inHand : null;
        if (sheet === "Hero_Axe" || sheet === "Hero_AxeSide") return combatOn() && onThis ? onThis : toolFor("siekiera", [115, 60]) || onThis;
        if (sheet === "Hero_Pick") return combatOn() && onThis ? onThis : toolFor("kilof", [116, 63]) || onThis;
        if (sheet === "Hero_Bow") return onThis || rangedFor("luk", 126);
        if (sheet === "Hero_Sling") return onThis || rangedFor("proca", 125);
        return onThis;
    }
    // its key on the sheet: "" when it is the sheet's own weapon in the sheet's own material (the plain sheet stays)
    function keyOn(sheet, look) {
        if (!look || !SHEETS_OF[look.rodzaj].includes(sheet)) return "";
        if (look.rodzaj === NATIVE[sheet] && look.material === NATIVE_MATERIAL[look.rodzaj] && !look.unique) return "";
        return look.key;
    }
    let memo = { f: -1, k: {} };
    function key(sheet) {
        const f = Graphics.frameCount;
        if (memo.f !== f) memo = { f, k: {} };
        if (!(sheet in memo.k)) {
            let k = "";
            try { k = keyOn(sheet, lookFor(sheet)); } catch (e) { k = ""; }
            memo.k[sheet] = k;
        }
        return memo.k[sheet];
    }

    // ---- the layer: under - the swing without its old weapon, over - the kind's picture in the material's colours
    const plainSys = n => U.loadSystemPlain(n);
    function base(sheet, k) {
        const l = lookOf(k);
        if (!l || !CLEAN[sheet]) return null;
        return { src: plainSys("Ubior_BezBroni_" + sheet), mask: "Ubior_Maska_BezBroni_" + sheet };
    }
    function ready(sheet, k) {
        const l = lookOf(k);
        if (!l) return true;
        if (RECOLOUR[sheet]) return true;
        return !!U.pictureOf(fileOf(sheet, l.rodzaj));
    }
    // a template's pixel -> its colour (the classes of tools/ubior/bron.py: grey metal, greenish wood, reddish wrap, the outline)
    const GREY = [52, 78, 106, 134, 162, 190, 214], WOOD = [70, 100, 130, 160, 190], ACC = [110, 150, 190, 230];
    const nearest = (arr, v) => { let b = 0; for (let i = 1; i < arr.length; i++) if (Math.abs(arr[i] - v) < Math.abs(arr[b] - v)) b = i; return b; };
    const OUTLINE = [10, 9, 8];
    function colourOf(l, r, g, b, x, y) {
        if (r < 20 && g < 20 && b < 20) return OUTLINE;
        if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10) {
            const k = nearest(GREY, r);
            // (okute: the wood's iron studs - every fourth pixel of the head in iron)
            if (l.studs && ((x + 2 * y) & 3) === 0) return l.studs[Math.min(l.studs.length - 1, k >> 1)];
            return l.metal[Math.round(k * (l.metal.length - 1) / 6)];
        }
        if (g > r) return l.wood[Math.round(nearest(WOOD, g) * (l.wood.length - 1) / 4)];
        return l.wrap[Math.round(nearest(ACC, r) * (l.wrap.length - 1) / 3)];
    }
    function draw(ctx) {
        const l = lookOf(ctx.key);
        if (!l) return;
        const d = ctx.d, parts = ctx.parts, W = ctx.W, H = ctx.H, TOOL = ctx.PARTS.narzedzie;
        if (RECOLOUR[ctx.name]) {
            // the bow's limbs, the sling's leather: the warm pixels of the tool through the material's ramp (the string, the stone,
            // the arrow's iron stay)
            const ramp = l.bow, n = ramp.length;
            for (let i = 0, N = W * H; i < N; i++) {
                if (parts[i] !== TOOL) continue;
                const p = i * 4, R = d[p], G = d[p + 1], Bb = d[p + 2];
                if (!d[p + 3]) continue;
                const mx = Math.max(R, G, Bb), mn = Math.min(R, G, Bb), sat = mx ? (mx - mn) / mx : 0;
                if (sat < 0.18 || R < G || mx < 30) continue;
                const t = Math.max(0, Math.min(1, (U.luma(R, G, Bb) - 0.08) / 0.55)), c = ramp[Math.round(t * (n - 1))];
                d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
            }
            return;
        }
        const pic = U.pictureOf(fileOf(ctx.name, l.rodzaj));
        if (!pic || pic.w !== W || pic.h !== H) return;
        const pd = pic.data;
        for (let i = 0, N = W * H; i < N; i++) {
            const p = i * 4;
            if (!pd[p + 3]) continue;
            const x = i % W, y = (i - x) / W;
            const c = colourOf(l, pd[p], pd[p + 1], pd[p + 2], x, y);
            d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
            parts[i] = TOOL;   // (the weapon now: a helmet stays behind it)
        }
    }
    U.addLayer({ name: "bron", key, base, ready, draw });

    // the pictures load with the map when a weapon of the look is there
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        if (!window.$gameParty) return;
        for (const sheet of Object.keys(NATIVE).concat(["Hero_Punch"])) {
            const k = key(sheet), l = lookOf(k);
            if (!l || RECOLOUR[sheet]) continue;
            plainSys(fileOf(sheet, l.rodzaj));
            if (CLEAN[sheet]) { plainSys("Ubior_BezBroni_" + sheet); plainSys("Ubior_Maska_BezBroni_" + sheet); }
        }
    };
    // (a weapon changed in hand: the live sheets are asked again next frame - the key is read every frame; Ubior.changed for the
    // outfit's memo)

    // ==================================================================================================================================
    // The shield in the guard: its picture instead of its icon (Combat_UI.js Sprite_CombatLayer.updateShield)
    // ==================================================================================================================================
    // the shields: the picture (img/system/Ubior_Tarcza_<plik>), its metal, its wood, its paint
    const TARCZE = {
        tarcza_drewniana: { plik: "Drewniana", metal: "zelazo" },
        tarcza_okuta: { plik: "Okuta", metal: "zelazo" },
        tarcza_umbo: { plik: "UmboBraz", metal: "braz", farba: ["#4a1010", "#7a1c18", "#a82a22", "#cc4434"] },
        tarcza_puklerz: { plik: "Puklerz", metal: "zelazo" },
        tarcza_migdalowa: { plik: "Migdalowa", metal: "zelazo", farba: ["#14203a", "#22345a", "#34507e", "#5070a0"] },
        tarcza_zelazna: { plik: "Zelazna", metal: "stal" },
        tarcza_zakonna: { plik: "Zakonna", metal: "zakon", farba: ["#5a3c10", "#8a6420", "#b88c34", "#e0bc5c"] },
        tarcza_skrzydlata_straz: { plik: "SkrzydlataStraz", metal: "zakon", farba: ["#7a8090", "#a4aab8", "#ccd2dc", "#f2f4f8"] }
    };
    const SHIELD_OLD = { 155: "tarcza_drewniana" };
    // a shield key -> { file, ramps } (tarcza_<kind>[_<material>]: the material over the kind's own metal)
    const shields = new Map();
    function shieldLook(key) {
        if (!key) return null;
        if (shields.has(key)) return shields.get(key);
        const D = window.Ubior_Data, theirs = D && D.WZORY_TARCZ && D.WZORY_TARCZ[key];
        let kind = Object.keys(TARCZE).sort((a, b) => b.length - a.length).find(k => key === k || key.startsWith(k + "_"));
        let r = null;
        if (kind) {
            const t = Object.assign({}, TARCZE[kind], theirs || {}), mat = key === kind ? t.metal : key.slice(kind.length + 1);
            const M = MATERIALY[mat] || MATERIALY[t.metal] || MATERIALY.zelazo;
            r = { key, file: "Ubior_Tarcza_" + t.plik, metal: (t.rampa || M.metal).map(hex), wood: (t.drewno || DREWNO).map(hex),
                wrap: (t.farba || ["#4a1010", "#7a1c18", "#a82a22", "#cc4434"]).map(hex), studs: null };
        }
        shields.set(key, r);
        return r;
    }
    const TNOTE_RE = /<Tarcza:\s*([A-Za-z0-9_]+)\s*>/i;
    function shieldKeyOf(id) {
        if (!id || !window.$dataItems || !$dataItems[id]) return null;
        const D = B();
        if (D && D.przedmiot) { const p = D.przedmiot(id); if (p && p.typ === "tarcza" && p.wzor) return p.wzor; }
        const m = TNOTE_RE.exec($dataItems[id].note || "");
        return m ? m[1] : SHIELD_OLD[id] || null;
    }
    let forcedShield = null;
    const shieldBmps = new Map();
    // the shield's picture, coloured: "front" (he faces down) or "side" (left; right - the sprite mirrors it); null while it loads
    function shieldBitmap(key, view) {
        const l = shieldLook(key);
        if (!l) return null;
        const ck = key + "|" + view;
        if (shieldBmps.has(ck)) return shieldBmps.get(ck);
        const pic = U.pictureOf(l.file);
        if (!pic) return null;
        const fw = 28, fh = pic.h, fx = view === "side" ? fw : 0, bmp = new Bitmap(fw, fh), img = bmp.context.createImageData(fw, fh), o = img.data;
        for (let y = 0; y < fh; y++) {
            for (let x = 0; x < fw; x++) {
                const p = (y * pic.w + fx + x) * 4, q = (y * fw + x) * 4;
                if (!pic.data[p + 3]) continue;
                const c = colourOf(l, pic.data[p], pic.data[p + 1], pic.data[p + 2], x, y);
                o[q] = c[0]; o[q + 1] = c[1]; o[q + 2] = c[2]; o[q + 3] = 255;
            }
        }
        bmp.context.putImageData(img, 0, 0);
        bmp._baseTexture.update();
        bmp.smooth = false;
        shieldBmps.set(ck, bmp);
        return bmp;
    }
    function hookShield() {
        const parts = T.api("Combat_parts"), L = parts && parts.ui && parts.ui.Sprite_CombatLayer;
        if (!L || L.prototype._ubiorShield) return !!L;
        const _update = L.prototype.updateShield;
        L.prototype.updateShield = function() {
            _update.call(this);
            const s = this._shield;
            if (!s || !s.visible) return;
            const c = C(), sh = c && c.shield ? c.shield() : null;
            const k = forcedShield || (sh ? shieldKeyOf(sh.id) : null), l = k ? shieldLook(k) : null;
            const d = $gamePlayer.direction(), view = d === 2 ? "front" : "side", bmp = l ? shieldBitmap(k, view) : null;
            if (!bmp) {
                // (no picture - guarding with the weapon, a shield without a look, still loading: Combat_UI's own icon, drawn again)
                if (s._ubiorShield) { s._icon = undefined; s._ubiorShield = null; }
                return;
            }
            if (s.bitmap !== bmp) s.bitmap = bmp;   // (Combat_UI keeps its _icon: it does not draw its icon over ours each frame)
            s.scale.set(d === 6 ? -1 : 1, 1);
            s._ubiorShield = k;
        };
        L.prototype._ubiorShield = true;
        return true;
    }
    const _Scene_Base_create = Scene_Base.prototype.create;
    Scene_Base.prototype.create = function() {
        _Scene_Base_create.call(this);
        hookShield();
    };
    hookShield();

    const api = { VERSION: "1.0.0", SHEETS_OF, NATIVE, NATIVE_MATERIAL, MATERIALY, UNIKATY, TARCZE, lookOf, itemLook, look: sheet => lookFor(sheet), key,
        fileOf, shieldLook, shieldKeyOf, shieldBitmap,
        set: o => { forced = o ? Object.assign({}, o) : null; memo.f = -1; return true; },
        shield: k => { forcedShield = k || null; return true; } };
    window.UbiorBron = T.register ? T.register(PLUGIN, api) : api;
})();
