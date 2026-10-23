//=============================================================================
// Equipment.js
//=============================================================================
// Ekwipunek (the user's, 2026-10-08): what the hero wears and holds, part by part - and only what he wears works.
//   head Głowa, torso Tors, cloak Płaszcz, hands Rękawice, belt Pas, legs Nogi, feet Stopy, right Prawa ręka (the weapon), left Lewa
//   ręka (the shield or the burning torch), back Plecy (the backpack), extra Dodatek.
// The things the game has for them: the leather jacket 171 (torso - Combat_Fight ARMORS: a fifth off every blow, worn out by them), the
// cloak 112 (no cold - Survival), the leather boots 113 (a quicker walk - Survival), the backpack 114 (bigger stacks, more load -
// Survival), the wooden shield 155 (left hand - the block, Combat_Fight SHIELDS), the torch 59 (left hand while it burns - Torch.js),
// the weapons (right hand: the weapon chosen in the combat mode with [ ] - Combat.hand(); one state, so the two never differ).
// Worn: the part holds the thing and the bag has it. A thing that comes into the bag goes on by itself when its part is free (so an
// old save - the jacket and the shield owned - keeps working, and a new cloak is worn at once); one taken off by hand stays off; one
// that leaves the bag (torn, sold, used up) leaves its part, and goes on again when it comes back. The burning torch is in the left
// hand (the shield waits on the back and comes back when the torch goes out) - unless it is the weapon of the combat mode: then it is
// in the right hand and the shield in the left.
// (2026-10-22) The clothes (Ubior_Data.js / Ubior_Sklepy.js): every item with <Ubior:miejsce,wzor> in its note goes on its part
// (glowa head, tors torso, nogi legs, stopy feet, pas belt, rece hands, plecy back) - read from the database once it is there; what
// one does and where it is bought: Ubior_Data's words. The old things keep their places (113, 114, 171 get the note too).
// No engine hooks here (MenuRing.js puts this file into the page while it is not in js/plugins.js): the others ask -
// Combat_Fight.js (shield, armour), Survival.js (cold, boots, backpack), MenuRing.js (the card's figure with its places).

/*:
 * @target MZ
 * @plugindesc Ekwipunek: części ciała (głowa, tors, płaszcz, ręce...), działa tylko to, co założone; zapis w grze. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Combat_Fight
 * @orderAfter Survival
 * @orderAfter Torch
 *
 * @help
 * ============================================================================
 * Equipment.js - ekwipunek bohatera
 * ============================================================================
 * Części: Głowa, Tors, Płaszcz, Rękawice, Pas, Nogi, Stopy, Prawa ręka
 * (broń), Lewa ręka (tarcza albo zapalona pochodnia), Plecy (plecak),
 * Dodatek. Działa tylko to, co założone:
 *   Skórzana kurtka (tors)      - cios o 20% słabszy, zużywa się od ciosów
 *   Płaszcz                     - zimą i w śniegu nie marzniesz
 *   Skórzane buty (stopy)       - chodzisz szybciej
 *   Plecak (plecy)              - większe stosy, więcej udźwigu
 *   Drewniana tarcza (lewa ręka)- blok przyjmuje 3/4 ciosu
 *   Pochodnia (lewa ręka)       - świeci i płoszy zwierzęta, dopóki płonie
 *   Broń (prawa ręka)           - ta sama, co wybrana w trybie walki [ ]
 * Rzecz, która trafia do plecaka, zakłada się sama, gdy jej miejsce jest
 * wolne. Zakładanie i zdejmowanie: menu P → Ekwipunek.
 * Skrypt: Equipment.worn(id), Equipment.equip(część, id),
 * Equipment.unequip(część), Equipment.slots().
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Equipment.js: brak TawernaCore.js (the Tawerna core is missing)");
    const PLUGIN = "Equipment";
    if (T.api(PLUGIN)) return;   // (put into the page twice: kept as it was)

    const TORCH = 59, SHIELD = 155;
    // the parts, in the order of the card; items: what goes there (none: the game has nothing for it yet); from: where it is made
    const SLOTS = [
        { id: "head", label: "Głowa", items: [] },
        { id: "cloak", label: "Płaszcz", items: [112], from: "garbarnia" },
        { id: "torso", label: "Tors", items: [171], from: "garbarnia" },
        { id: "back", label: "Plecy", items: [114], from: "garbarnia", extra: true },
        { id: "right", label: "Prawa ręka", items: [], from: "warsztat", hand: true },
        { id: "left", label: "Lewa ręka", items: [SHIELD, TORCH], from: "warsztat", hand: true },
        { id: "hands", label: "Rękawice", items: [] },
        { id: "belt", label: "Pas", items: [] },
        { id: "legs", label: "Nogi", items: [] },
        { id: "feet", label: "Stopy", items: [113], from: "garbarnia" },
        { id: "extra", label: "Dodatek", items: [], extra: true }
    ];
    const SLOT = {};
    for (const s of SLOTS) SLOT[s.id] = s;
    // what goes on by itself (the torch: only by lighting it; the weapons: Combat's own choice)
    const WEARABLE = { 171: "torso", 112: "cloak", 113: "feet", 114: "back", 155: "left" };
    // what each one does (the card's words)
    const EFFECT = {
        171: () => { const a = armorDef(171); return a ? "cios słabszy o " + Math.round(a.reduce * 100) + "%" : "cios słabszy"; },
        112: () => "zimą i w śniegu nie marzniesz",
        113: () => { const S = T.api("Survival"); return "chodzisz szybciej" + (S && S.BOOTS_SPEED ? " (+" + Math.round((S.BOOTS_SPEED - 1) * 100) + "%)" : ""); },
        114: () => "większe stosy, więcej udźwigu",
        155: () => { const sh = shieldDef(155); return sh ? "blok zatrzymuje " + Math.round(sh.reduce * 100) + "% ciosu" : "blok"; },
        59: () => { const Tr = T.api("Torch"), r = Tr && Tr.ratio ? Tr.ratio() : 0, h = Tr && Tr.TORCH ? Tr.TORCH.hours : 3; return "płonie jeszcze ok. " + Math.max(1, Math.round(r * h * 60)) + " min · światło, płoszy zwierzęta"; }
    };

    // the clothes from the items' notes: <Ubior:miejsce,wzor> -> the part (read again when the database changes); (2026-10-23) the
    // armour <Zbroja:miejsce,wzor> the same way, the shields <Tarcza:wzor> -> the left hand, the trinkets <Dodatek:rodzaj> -> Dodatek
    // (Bron_Data.js; the weapons <Bron:...> are Combat's right hand)
    const UBIOR_PART = { glowa: "head", tors: "torso", nogi: "legs", stopy: "feet", pas: "belt", rece: "hands", plecy: "back" };
    const NOTED = new Set();   // (the things put on a part by their note - not the old ones above)
    let notesOf = null, notesLen = 0;
    function partOfNote(note) {
        const m = /<(?:Ubior|Zbroja):\s*([a-z]+)\s*,/.exec(note);
        if (m) return UBIOR_PART[m[1]] || null;
        if (/<Tarcza:/.test(note)) return "left";
        if (/<Dodatek:/.test(note)) return "extra";
        return null;
    }
    function readNotes() {
        if (!window.$dataItems || (notesOf === $dataItems && notesLen === $dataItems.length)) return;
        notesOf = $dataItems;
        notesLen = $dataItems.length;
        for (const it of $dataItems) {
            const slot = it && it.name ? partOfNote(it.note || "") : null;
            if (!slot || WEARABLE[it.id]) continue;
            WEARABLE[it.id] = slot;
            if (!SLOT[slot].items.includes(it.id)) SLOT[slot].items.push(it.id);
            NOTED.add(it.id);
        }
    }
    // what a thing does (the card's words): the old ones here, the gear Bron's (with its level), the clothes Ubior_Data's
    const effectOf = id => (EFFECT[id] ? EFFECT[id]() : String(T.call("Bron", "opis", id) || T.call("Ubior_Data", "opis", id) || ""));
    // where a thing not had comes from: made (the old ones: the part's workshop) and / or bought (Ubior_Data, Bron_Data)
    function source(id) {
        readNotes();
        const def = SLOT[WEARABLE[id]], buy = String(T.call("Ubior_Data", "gdzie", id) || T.call("Bron_Data", "gdzie", id) || "");
        const made = def && def.from && !NOTED.has(Number(id)) ? "zrobisz: " + def.from : "";
        return [made, buy ? "kupisz: " + buy : ""].filter(Boolean).join(" · ") || "zrobisz: " + ((def && def.from) || "?");
    }

    const store = T.state.define("equip", () => ({ slots: {}, seen: {} }), { version: 1, owner: PLUGIN });
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const has = id => !!item(id) && !!window.$gameParty && $gameParty.numItems(item(id)) > 0;
    const Cb = () => T.api("Combat");
    const fightParts = () => { const P = T.api("Combat_parts"); return P && P.fight ? P.fight : null; };
    const shieldDef = id => { const F = fightParts(); return F && F.SHIELDS ? F.SHIELDS[id] || null : null; };
    const armorDef = id => { const F = fightParts(); return F && F.ARMORS ? F.ARMORS[id] || null : null; };
    const torchLit = () => !!T.call("Torch", "isLit");
    const hand = () => { const C = Cb(); return C && C.hand ? C.hand() || "m0" : "m0"; };

    // ---- the bag and the parts kept in step: new things go on by themselves where the part is free, the gone ones come off
    function ensure() {
        if (!window.$gameSystem || !window.$gameParty || !window.$dataItems) return null;
        readNotes();
        const s = store();
        for (const key of Object.keys(WEARABLE)) {
            const id = Number(key), slot = WEARABLE[key];
            if (has(id)) {
                if (!s.seen[id]) {
                    s.seen[id] = true;
                    const cur = s.slots[slot];
                    if (!cur || !has(cur)) s.slots[slot] = id;
                }
            } else {
                if (s.seen[id]) delete s.seen[id];
                if (s.slots[slot] === id) s.slots[slot] = 0;
            }
        }
        return s;
    }
    // the left hand as it is now: the burning torch (when it is not the weapon in the right one), else the shield (or nothing)
    function leftNow() {
        const s = ensure();
        if (torchLit() && hand() !== "m" + TORCH) return TORCH;
        const id = s ? s.slots.left || 0 : 0;
        return id && has(id) ? id : 0;
    }
    // the right hand: the weapon of the combat mode ("m<id>", "ranged" = the bow or the sling, "m0" = the fists)
    // the bow / the sling the "ranged" hand holds: the best one owned (Combat.rangedItem - Bron.js's variants too)
    const rangedId = () => { const C = Cb(); return C && C.rangedItem ? C.rangedItem() || 0 : has(126) && has(127) ? 126 : has(125) ? 125 : has(126) ? 126 : 0; };
    const isRanged = id => id === 125 || id === 126 || !!T.call("Bron", "isRanged", id);
    function rightNow() {
        const h = hand();
        if (h === "ranged") return rangedId();
        return h[0] === "m" ? Number(h.slice(1)) || 0 : 0;
    }
    // what is on a part now: an item id (0: nothing)
    function current(slot) {
        if (slot === "left") return leftNow();
        if (slot === "right") return rightNow();
        const s = ensure();
        const id = s ? s.slots[slot] || 0 : 0;
        return id && has(id) ? id : 0;
    }
    // worn: on its part now (the burning torch: in either hand)
    function worn(id) {
        id = Number(id);
        if (id === TORCH) return torchLit();
        const slot = WEARABLE[id];
        if (slot) return current(slot) === id;
        return rightNow() === id && id > 0;
    }

    // ---- putting on and taking off
    // the choices for a part: { id, name, icon, worn, note } - the right hand: Combat's weapons; the left: the shield, the torch
    function choices(slot) {
        readNotes();
        const def = SLOT[slot], out = [];
        if (!def) return out;
        if (slot === "right") {
            const C = Cb(), list = C && C.handChoices ? C.handChoices() : ["m0"], now = hand();
            for (const h of list) {
                const id = h === "ranged" ? rangedId() || (has(126) ? 126 : 125) : Number(h.slice(1)) || 0;
                const name = h === "m0" ? "Pięści" : h === "ranged" ? (item(id) ? item(id).name : "Łuk / proca") : item(id) ? item(id).name : h;
                const icon = h === "m0" ? (fightParts() ? fightParts().FIST_ICON : 0) : item(id) ? item(id).iconIndex : 0;
                out.push({ id, hand: h, name, icon, worn: h === now, note: weaponNote(h) });
            }
            return out;
        }
        if (slot === "left") {
            const now = leftNow();
            // the shields owned: the wooden one, then the others of their notes <Tarcza:...> (Bron_Data.js)
            for (const id of def.items) if (id !== TORCH && has(id)) out.push({ id, name: item(id).name, icon: item(id).iconIndex, worn: now === id, note: effectOf(id) });
            if (torchLit()) out.push({ id: TORCH, name: "Pochodnia (płonie)", icon: torchIcon(), worn: now === TORCH, note: EFFECT[TORCH]() });
            else if (has(TORCH)) out.push({ id: TORCH, name: "Pochodnia - zapal", icon: torchIcon(), worn: false, note: "zapalisz jedną z " + $gameParty.numItems(item(TORCH)) });
            return out;
        }
        for (const id of def.items) if (has(id)) out.push({ id, name: item(id).name, icon: item(id).iconIndex, worn: current(slot) === id, note: effectOf(id) });
        return out;
    }
    const torchIcon = () => { const Tr = T.api("Torch"); return Tr && Tr.ICON ? Tr.ICON : item(TORCH) ? item(TORCH).iconIndex : 0; };
    function weaponNote(h) {
        const F = fightParts();
        if (h === "ranged") { const t = String(T.call("Bron", "opis", rangedId()) || ""); return t || "strzela z daleka (F)"; }
        const id = h === "m0" ? 0 : Number(h.slice(1)), w = F && F.weaponNow ? F.weaponNow(id) : F && F.MELEE ? F.MELEE[id] : null;
        if (!w) return "";
        const lack = w.lack ? " · poziom " + w.poziom + ": słabiej o " + Math.round(w.lack * 100) + "%" : "";
        return "obrażenia " + w.dmg + " · zasięg " + w.reach.toFixed(1).replace(".", ",") + (w.crit ? " · krytyk +" + Math.round(w.crit * 100) + "%" : "") + (w.fire ? " · podpala" : "") + lack;
    }
    // the burning torch out of the hand: into the ground in front of him (or where he stands) - it keeps burning there - else put out
    function torchAway() {
        const Tr = T.api("Torch");
        if (!Tr || !torchLit()) return;
        const t = Tr.frontTile ? Tr.frontTile() : null, here = { x: $gamePlayer.x, y: $gamePlayer.y };
        const spot = t && Tr.canPlantAt(t.x, t.y) ? t : Tr.canPlantAt(here.x, here.y) ? here : null;
        if (spot && Tr.plantTorch(spot.x, spot.y, { instant: true })) return;
        Tr.douse("");
        T.call("SpeechBubbles", "say", $gamePlayer, "Gaszę pochodnię");
    }
    // put `id` on the part; true when it is on
    function equip(slot, id, h) {
        const s = ensure(), def = SLOT[slot];
        if (!s || !def) return false;
        id = Number(id) || 0;
        if (slot === "right") {
            const C = Cb(), want = h || (id === 0 ? "m0" : isRanged(id) ? "ranged" : "m" + id);
            if (want === "m" + TORCH && !torchLit()) return false;
            return !!(C && C.setHand && C.setHand(want));
        }
        if (slot === "left") {
            if (id === TORCH) {
                if (torchLit()) { if (hand() === "m" + TORCH) T.call("Combat", "setHand", "m0"); return true; }   // (from the right hand to the left)
                if (!has(TORCH)) return false;
                $gameParty.loseItem(item(TORCH), 1);
                return !!T.call("Torch", "light");   // (Torch.light gives the torch back when it cannot burn - a downpour)
            }
            if (!has(id)) return false;
            if (torchLit() && hand() !== "m" + TORCH) torchAway();
            s.slots.left = id;
            s.seen[id] = true;
            return true;
        }
        if (!def.items.includes(id) || !has(id)) return false;
        s.slots[slot] = id;
        s.seen[id] = true;
        return true;
    }
    function unequip(slot) {
        const s = ensure();
        if (!s || !SLOT[slot]) return false;
        if (slot === "right") return !!T.call("Combat", "setHand", "m0");
        if (slot === "left" && leftNow() === TORCH) { torchAway(); return true; }
        if (!current(slot)) return false;
        s.slots[slot] = 0;
        return true;
    }

    // ---- for the card: every part with what is on it and a word on it
    function slots() {
        readNotes();
        return SLOTS.map(def => {
            const id = current(def.id), it = id ? item(id) : null;
            const out = { id: def.id, label: def.label, item: id, extra: !!def.extra, none: !def.items.length && !def.hand, from: def.from || "" };
            if (def.id === "right") {
                const h = hand();
                out.hand = h;
                out.name = h === "m0" ? "Pięści" : h === "ranged" ? (it ? it.name : "Łuk / proca") : it ? it.name : "";
                out.icon = h === "m0" ? (fightParts() ? fightParts().FIST_ICON : 0) : it ? it.iconIndex : 0;
                out.note = weaponNote(h) + (h === "m0" ? "" : "  ·  [ ] zmienia w trybie walki");
                out.item = h === "m0" ? 0 : id;
                return out;
            }
            if (it) {
                out.name = id === TORCH ? "Pochodnia (płonie)" : it.name;
                out.icon = id === TORCH ? torchIcon() : it.iconIndex;
                out.note = effectOf(id);
                const D = T.api("Durability");
                if (D && D.TOOLS && D.TOOLS[id] && D.left && D.lifeOf) out.wear = { left: D.left(id), life: D.lifeOf(id) };
            } else {
                out.name = "";
                out.icon = 0;
                const owned = def.items.filter(has);
                const buy = String(T.call("Ubior_Data", "gdzieMiejsce", def.id) || "");   // (the clothes: who sells them)
                out.note = out.none ? "brak w grze" : owned.length ? "zdjęte · Enter: załóż" : def.id === "left" ? "zrobisz: warsztat (tarcza) · pochodnia: kupisz, zrobisz"
                    : [def.from ? "zrobisz: " + def.from : "", buy ? "kupisz: " + buy : ""].filter(Boolean).join(" · ") || "zrobisz: " + def.from;
            }
            return out;
        });
    }

    window.Equipment = T.register(PLUGIN, { SLOTS, WEARABLE, TORCH, SHIELD, worn, current, choices, equip, unequip, slots, ensure, state: () => ensure(), source, readNotes });
})();
