//=============================================================================
// Durability.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Zużywanie się narzędzi: każde uderzenie, rzut i cięcie zużywa narzędzie, na końcu się łamie. Naprawa w warsztacie. Stan widać na liście przedmiotów. v1.0.0
 * @author Tawerna
 *
 * @param enabled
 * @text Narzędzia się zużywają
 * @type boolean
 * @default true
 *
 * @param lifeFactor
 * @text Wytrzymałość narzędzi (%)
 * @desc 100 = wartości z tabeli w kodzie. 200 = narzędzia wytrzymują dwa razy dłużej, 50 = o połowę krócej.
 * @type number
 * @min 10
 * @max 1000
 * @default 100
 *
 * @help
 * ============================================================================
 * ZUŻYWANIE SIĘ NARZĘDZI
 * ============================================================================
 * Siekiera, kilof, łopata, motyka, grabie, młotek, wędka, noże, piła, proca i łuk
 * mają określoną liczbę użyć (tablica TOOLS w kodzie). Każde uderzenie w drzewo
 * albo skałę, każdy kopnięty dół, zaorana grządka, uderzenie młotkiem w plac
 * budowy, rzut wędką, cięcie piłą, oprawienie zwierzyny czy strzał liczy się jako
 * jedno użycie.
 *
 *   - gdy zostaje mniej niż 15% wytrzymałości, nad postacią pojawia się dymek
 *     ("Kamienna siekiera: zostało 10 uderzeń");
 *   - po ostatnim użyciu narzędzie się łamie (dymek, dźwięk) i znika z plecaka;
 *   - żelazne narzędzie zastępuje kamienne, więc gdy się złamie, pracuje dalej
 *     kamienne (jeśli je masz);
 *   - w warsztacie (menu przy warsztacie) jest "Napraw: ..." dla każdego
 *     nadwerężonego narzędzia. Naprawa kosztuje trochę materiałów, trwa godzinę
 *     i przywraca pełną wytrzymałość;
 *   - na liście przedmiotów przy narzędziu stoi stan ("42/70"), a w opisie
 *     "Wytrzymałość: ...".
 *
 * Parametr "Narzędzia się zużywają" wyłącza cały mechanizm, a "Wytrzymałość
 * narzędzi (%)" skaluje wszystkie wartości naraz.
 *
 * Dla innych wtyczek: Durability.use(idPrzedmiotu, ilość), Durability.repair(id),
 * Durability.left(id), Durability.repairRecipes().
 * ============================================================================
 */

(() => {
    "use strict";

    const params = PluginManager.parameters("Durability");
    const ENABLED = params.enabled !== "false";
    const FACTOR = Math.max(0.1, Number(params.lifeFactor || 100) / 100);

    // id: { life: uses, unit: [1, 2-4, 5+ forms of the word], g: "f" | "m" | "p" (how "broke" ends), fix: [[item id, amount]] }
    const UNIT = {
        blow: ["uderzenie", "uderzenia", "uderzeń"],
        use: ["użycie", "użycia", "użyć"],
        cast: ["rzut", "rzuty", "rzutów"],
        cut: ["cięcie", "cięcia", "cięć"],
        shot: ["strzał", "strzały", "strzałów"]
    };
    const TOOLS = {
        60: { life: 70, unit: "blow", g: "f", fix: [[77, 1], [92, 1]] },              // kamienna siekiera: gałąź + len
        115: { life: 220, unit: "blow", g: "f", fix: [[86, 1], [80, 1]] },            // żelazna siekiera: żelazo + deska
        63: { life: 55, unit: "blow", g: "m", fix: [[77, 1], [64, 1], [92, 1]] },     // kamienny kilof
        116: { life: 180, unit: "blow", g: "m", fix: [[86, 1], [80, 1]] },            // żelazny kilof
        62: { life: 70, unit: "blow", g: "f", fix: [[77, 1], [92, 1]] },              // kamienna łopata
        66: { life: 90, unit: "use", g: "f", fix: [[77, 1], [92, 1]] },               // motyka
        65: { life: 90, unit: "use", g: "p", fix: [[77, 2]] },                         // grabie
        89: { life: 110, unit: "blow", g: "m", fix: [[77, 1], [92, 1]] },             // młotek
        100: { life: 45, unit: "cast", g: "f", fix: [[93, 1]] },                       // wędka
        90: { life: 30, unit: "use", g: "m", fix: [[64, 1], [92, 1]] },               // nóż kamienny
        91: { life: 70, unit: "use", g: "m", fix: [[86, 1]] },                         // nóż żelazny
        118: { life: 90, unit: "cut", g: "f", fix: [[86, 1]] },                        // piła
        125: { life: 60, unit: "shot", g: "f", fix: [[93, 1], [92, 1]] },             // proca: lina + len
        126: { life: 80, unit: "shot", g: "m", fix: [[93, 1], [77, 1]] }              // łuk: lina + gałąź
    };
    const WARN_FRACTION = 0.15;

    const dataItem = id => $dataItems[id] || null;
    const enabled = () => ENABLED;
    const lifeOf = id => (TOOLS[id] ? Math.max(1, Math.round(TOOLS[id].life * FACTOR)) : 0);

    function state() {
        if (!$gameSystem._wear) $gameSystem._wear = { used: {}, warned: {} };
        return $gameSystem._wear;
    }
    const used = id => (state().used[id] || 0);
    const left = id => (TOOLS[id] ? Math.max(0, lifeOf(id) - used(id)) : 0);
    const owns = id => !!dataItem(id) && $gameParty.hasItem(dataItem(id));

    function unitWord(id, n) {
        const forms = UNIT[TOOLS[id].unit];
        return n === 1 ? forms[0] : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? forms[1] : forms[2];
    }
    const leftText = id => left(id) + " " + unitWord(id, left(id));

    function popup(icon, text, color) {
        $gameTemp.pushLootPopup(icon, text, color);
    }
    function broke(id) {
        const item = dataItem(id), g = TOOLS[id].g;
        $gameParty.loseItem(item, 1, false);
        delete state().used[id];
        delete state().warned[id];
        AudioManager.playSe({ name: "Crash", volume: 90, pitch: 105, pan: 0 });
        popup(item.iconIndex, item.name + " się złamał" + (g === "f" ? "a" : g === "p" ? "y" : ""), "#ff9f8f");
    }

    // One use of the tool. Returns true when it broke on this use.
    function use(id, n) {
        if (!ENABLED || !TOOLS[id] || !owns(id)) return false;
        state().used[id] = used(id) + (n || 1);
        const remaining = lifeOf(id) - used(id);
        if (remaining <= 0) { broke(id); return true; }
        if (remaining <= Math.max(3, Math.ceil(lifeOf(id) * WARN_FRACTION)) && !state().warned[id]) {
            state().warned[id] = true;
            popup(dataItem(id).iconIndex, dataItem(id).name + ": zostało " + remaining + " " + unitWord(id, remaining), "#ffd98f");
        }
        return false;
    }
    function repair(id) {
        if (!TOOLS[id]) return false;
        delete state().used[id];
        delete state().warned[id];
        state().repaired = (state().repaired || 0) + 1;   // the journal goal "Napraw narzędzie"
        return true;
    }

    // Recipes of Farming.js's workbench menu: one "Napraw: ..." per tool in the bag that has been used.
    function repairRecipes() {
        if (!ENABLED) return [];
        return Object.keys(TOOLS).map(Number).filter(id => owns(id) && used(id) > 0).map(id => ({
            id: "repair_" + id, name: "Napraw: " + dataItem(id).name, inputs: TOOLS[id].fix, output: [id, 1], repair: id, manual: true,
            hours: 1, stamina: 2, startSe: "Hammer",
            desc: "Wzmacniasz i sklejasz to, co się poluzowało. Wytrzymałość wraca do pełna (teraz " + left(id) + " z " + lifeOf(id) + ")."
        }));
    }

    // ------------------------------------------------------------------
    // What the player sees: the state in the item list and in the description
    // ------------------------------------------------------------------
    const _drawItemNumber = Window_ItemList.prototype.drawItemNumber;
    Window_ItemList.prototype.drawItemNumber = function(item, x, y, width) {
        if (ENABLED && item && DataManager.isItem(item) && TOOLS[item.id] && $gameSystem) {
            const remaining = left(item.id), life = lifeOf(item.id), ratio = remaining / life;
            this.changeTextColor(ColorManager.textColor(ratio <= WARN_FRACTION ? 18 : ratio <= 0.4 ? 17 : 0));
            this.drawText(remaining + "/" + life, x, y, width, "right");
            this.resetTextColor();
            return;
        }
        _drawItemNumber.call(this, item, x, y, width);
    };
    const _Window_Help_setItem = Window_Help.prototype.setItem;
    Window_Help.prototype.setItem = function(item) {
        if (ENABLED && item && DataManager.isItem(item) && TOOLS[item.id] && $gameSystem) {
            this.setText(item.description + "\nWytrzymałość: " + leftText(item.id) + " z " + lifeOf(item.id) + ".");
            return;
        }
        _Window_Help_setItem.call(this, item);
    };

    window.Durability = { TOOLS, use, repair, left, used, lifeOf, enabled, repairRecipes, unitWord };
})();
