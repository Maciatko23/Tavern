//=============================================================================
// Bron.js
//=============================================================================
// The weapons, the armour, the shields and the trinkets at work (the data and the numbers: Bron_Data.js; the blows, the guard and the
// armour themselves: Combat_Fight.js, which reads the items' notes; the parts of the body: Equipment.js):
//   - the bonuses: Combat.addPerkSource - the trinket worn (Dodatek), the armour's own (warmth, the noise it makes, the mind's guard),
//     the weapon in hand (`reka`); a thing above the hero's level gives less (Bron_Data.brak). The walk: boots faster, heavy plate slower.
//   - the bows and the slings: the best one owned is the one shot (Hunting_Weapons.defOf asks rangedDef; Combat_Fight / Equipment ask
//     rangedItem) - the old 126 / 125 too.
//   - the wear (Durability.js): every new thing gets its life (blows, jabs, shots; the armour and the shields: the blows taken) and its
//     workbench mending; the smith, the tanner and the seamstress mend for money.
//   - the trade, in the talks (TownLife.addTalkHook, first - a quest's hand-in, offer or remark still comes first): Tadek the smith,
//     quartermaster Kłos (from the garrison's favour 15), the kantor (Baltazar, after W5 Ludmiła); the tanner, the seamstress and the
//     rag-and-bone man get one line more in their clothes' menu (Ubior_Sklepy.addMenu). Their window: Scene_BronSklep (buy / sell / mend).
//     "Porozmawiaj" gives the talk to the rest of the hooks (the quests, Garnizon's menu, Ludzie's steel, the usual lines).
//   - the recipes: the forge (iron, steel), the tannery (leather), the workbench (wood, stone, trophies) - each on the list from the
//     hero's level `poziom - PRZEPISY.widac`.
//   - the loot: Humans' bandits / knifers / archers / mercenaries and the camps' sacks, Creatures' armours / drowned / wraiths / shadows,
//     the bosses' remains, the searched containers of the underground (an extra roll by the floor's band), the Lord's armoury (W7).
//   - the uniques: their bosses' remains, the quests' flags (W4 Borgar, W8 Grum), the quests done (W12, W13, D24), the garrison's favour 80.
//   - F9 (Debug.js, the tab "Wyspa i fabuła", through Okolice.f9): all of them, a set for level N (put on), +1000 G.
// Nothing works before the items 300+ are in data/Items.json (tools/bron/instaluj_dane.py): the shopkeepers then talk as before.
// Bus: emits bronKupiony { key, id, cost, used }, bronSprzedany { key, id, gold }, bronNaprawiony { key, id, cost }, bronUnikat { id, why },
// bronLup { id, floor, kind }.

/*:
 * @target MZ
 * @plugindesc Broń, zbroje, tarcze, dodatki - działanie: sklepy (kowal, kwatermistrz, kantor, garbarz, szwaczka, szmaciarz), kuźnia, łupy, unikaty, bonusy, zużycie, łuki. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TawernaUI
 * @orderAfter Bron_Data
 * @orderAfter Equipment
 * @orderAfter Durability
 * @orderAfter Combat
 * @orderAfter Hunting_Weapons
 * @orderAfter TownLife
 * @orderAfter TownQuests
 * @orderAfter Humans
 * @orderAfter Underground
 * @orderAfter Creatures
 * @orderAfter Garnizon
 * @orderAfter Kantor
 * @orderAfter Dwor
 * @orderAfter Ubior_Sklepy
 *
 * @help
 * ============================================================================
 * Bron.js - broń, zbroje, tarcze i dodatki: sklepy, kuźnia, łupy, unikaty
 * ============================================================================
 * Sklepy w rozmowach: kowal Tadek (brąz i żelazo; naprawa metalu), kwatermistrz
 * Kłos w garnizonie (wojskowe, od przychylności 15), kantor (stal z kontynentu;
 * Baltazar, po W5 Ludmiła). Garbarz Ignac, szwaczka Dorota i szmaciarz Józek:
 * dodatkowa linijka w menu ubrań. W oknie sklepu: strzałki - wybór, ←→ / Q E -
 * zakładka, O - kup / sprzedaj / napraw, P - wyjście.
 *
 * Kuźnia, garbarnia, warsztat: przepisy pojawiają się od poziomu przedmiotu
 * minus 4. Łupy: bandyci, najemnicy, obozy, stwory, bossowie, skrzynie pięter.
 * Unikaty: bossowie, wątki W4, W8, W12, W13, D24, przychylność garnizonu 80.
 *
 * Rzecz z poziomem wyższym niż bohater działa słabiej (3% za poziom, do 45%).
 * F9 (zakładka „Wyspa i fabuła”): Bronie - daj wszystkie, daj zestaw na
 * poziom N (←→), +1000 G.
 *
 * Skrypt: Bron.otworz("kowal", "kup"), .kup(klucz, id), .sprzedaj(klucz, id),
 * .napraw(klucz, id), .oferta(klucz, zakladka), .bonus("cold"), .opis(id)
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Bron.js: brak TawernaCore.js (the Tawerna core is missing)");
    const PLUGIN = "Bron";
    if (T.api(PLUGIN)) return;   // (put into the page twice: kept as it was)
    const D = () => T.api("Bron_Data");
    if (!D()) console.warn("[Bron] Bron_Data.js not found - put it above this plugin");

    const COIN_ICON = 313;
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const has = () => !!window.$gameSystem && !!window.$gameParty && !!window.$dataItems;
    const item = id => (window.$dataItems && $dataItems[id] && $dataItems[id].name ? $dataItems[id] : null);
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const day = () => T.time.day(), hour = () => T.time.hour();
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const E = () => T.api("Equipment");
    const DU = () => T.api("Durability");
    const TQ = () => T.api("TownQuests");
    const TL = () => T.api("TownLife");
    const CB = () => T.api("Combat");
    const pct = v => Math.round(v * 100) + "%";
    const report = (where, e) => console.error("[Bron] " + where + ":", e);
    function hash(a, b, c) {
        let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2246822519);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    const store = T.state.define("bron", () => ({ dane: {}, uzywane: { day: 0, list: [], sold: {} }, kupione: 0, sprzedane: 0, naprawione: 0, lup: 0, f9Poziom: 10 }),
        { version: 1, owner: PLUGIN });

    // ------------------------------------------------------------------
    // The hero's level and a thing's lack of it
    // ------------------------------------------------------------------
    const level = () => { const c = CB(); try { return c && c.hero && window.$gameSystem ? c.hero().level || 1 : 1; } catch (e) { return 1; } };
    const lackOf = p => { const d = D(); return p && d ? d.brak(p.poziom || 1, level()) : 0; };

    // ------------------------------------------------------------------
    // The bonuses of what is worn and held (Combat.addPerkSource) - worked out once a frame, and again after a change
    // ------------------------------------------------------------------
    const WORN_PARTS = ["head", "torso", "hands", "legs", "feet", "left", "extra"];
    let gear = { at: -1, sum: {}, dirty: true };
    const dirty = () => { gear.dirty = true; const F = T.api("Combat_parts"); if (F && F.fight && F.fight.gearChanged) F.fight.gearChanged(); };
    function gearSum() {
        if (!gear.dirty && gear.at === Graphics.frameCount) return gear.sum;
        const d = D(), e = E(), sum = {};
        gear = { at: Graphics.frameCount, sum, dirty: false };
        if (!d || !e || !e.current || !has()) return sum;
        const add = (k, v) => { sum[k] = (sum[k] || 0) + v; };
        for (const part of WORN_PARTS) {
            const id = e.current(part), p = id ? d.przedmiot(id) : null;
            if (!p || p.istnieje) continue;
            const k = 1 - lackOf(p);
            for (const b of Object.keys(p.bonus || {})) add(b, b === "mind.see" ? p.bonus[b] : p.bonus[b] * k);
            if (p.cieplo) add("cold", p.cieplo * k);
            if (p.kara && p.kara.skradanie) add("sneak", -p.kara.skradanie);   // (the noise of the plate: its whole, whatever the level)
            if (p.kara && p.kara.chod) add("_chod", p.kara.chod);
        }
        const hid = e.current("right"), w = hid ? d.przedmiot(hid) : null;
        if (w && w.reka) { const k = 1 - lackOf(w); for (const b of Object.keys(w.reka)) add(b, w.reka[b] * k); }
        return sum;
    }
    const bonus = key => (has() ? gearSum()[key] || 0 : 0);
    const luck = () => bonus("luck");
    // the walk: boots faster, plate slower (the armour's and the shield's `chod`)
    const _distancePerFrame = Game_CharacterBase.prototype.distancePerFrame;
    Game_CharacterBase.prototype.distancePerFrame = function() {
        const d = _distancePerFrame.call(this);
        if (this !== $gamePlayer || !has()) return d;
        const k = bonus("_chod");
        return k ? d * Math.max(0.5, 1 + k) : d;
    };
    // what a thing does, in words (the card in Ekwipunek, Equipment.effectOf) - with its level when the hero is below it
    function opis(id) {
        const d = D(), p = d && d.przedmiot(id);
        if (!p || p.istnieje) return "";
        const t = d.opis(id), l = has() ? lackOf(p) : 0;
        return t + (l > 0 ? " · poziom " + p.poziom + " (masz " + level() + "): słabiej o " + pct(l) : "");
    }

    // ------------------------------------------------------------------
    // The bows and the slings: the best one owned of each (Hunting_Weapons.defOf, Combat_Fight.rangedItem)
    // ------------------------------------------------------------------
    const RANGED = { bow: { rodzaj: "luk", ammo: 127, old: 126 }, sling: { rodzaj: "proca", ammo: 64, old: 125 } };
    let rangedIds = null;
    function rangedIdsOf(kind) {
        const d = D();
        if (!d) return [RANGED[kind].old];
        if (!rangedIds) {
            rangedIds = { bow: [], sling: [] };
            for (const p of d.PRZEDMIOTY) for (const k of Object.keys(RANGED)) if (p.typ === "bron" && p.rodzaj === RANGED[k].rodzaj) rangedIds[k].push(p.id);
        }
        return rangedIds[kind];
    }
    // the ones owned, the strongest first (its shot after its level's lack)
    function rangedOwned(kind) {
        const d = D(), out = [];
        if (!has()) return out;
        for (const id of rangedIdsOf(kind)) {
            if (count(id) <= 0) continue;
            const p = d ? d.przedmiot(id) : null, s = p ? d.staty(p) : null, l = p ? lackOf(p) : 0;
            out.push({ id, p, s, l, eff: s && s.damage ? s.damage * (1 - l) : 0 });
        }
        return out.sort((a, b) => b.eff - a.eff || b.id - a.id);
    }
    const owns = kind => rangedOwned(kind).length > 0;
    const isRanged = id => { const d = D(), p = d && d.przedmiot(id); return !!(p && p.typ === "bron" && (p.rodzaj === "luk" || p.rodzaj === "proca")); };
    const rangedKind = id => { const d = D(), p = d && d.przedmiot(id); return p && p.rodzaj === "proca" ? "sling" : p && p.rodzaj === "luk" ? "bow" : id === 125 ? "sling" : "bow"; };
    const ammo = kind => count(RANGED[kind].ammo) > 0;
    // the one in hand when the hand is "ranged": a bow with arrows, else a sling, else a bow (as Equipment did with 126 / 125)
    function rangedItem() {
        const b = rangedOwned("bow"), s = rangedOwned("sling");
        if (b.length && ammo("bow")) return b[0].id;
        if (s.length) return s[0].id;
        return b.length ? b[0].id : 0;
    }
    const hasRanged = () => (owns("bow") && ammo("bow")) || (owns("sling") && ammo("sling"));
    const anyRanged = () => owns("bow") || owns("sling");
    // its numbers over Hunting_Weapons.WEAPONS[kind]; null: the old one is the best (its own numbers)
    function rangedDef(kind) {
        const best = rangedOwned(kind)[0];
        if (!best || !best.s || (best.id === RANGED[kind].old && !best.l)) return null;
        const s = best.s, l = best.l;
        return { item: best.id, damage: Math.max(1, Math.round(s.damage * (1 - l))), range: s.range, steady: Math.round(s.steady * (1 + l)), cooldown: s.cooldown, stamina: s.stamina };
    }

    // ------------------------------------------------------------------
    // The trade
    // ------------------------------------------------------------------
    // the resident (TownLife key) -> its shop (Bron_Data.SKLEPY key)
    const SHOP_OF = { kowal: "kowal", kwatermistrz: "kwatermistrz", kupiec: "kantor", ludmila: "ludmila", garbarz: "garbarz", szwaczka: "szwaczka", szmaciarz: "szmaciarz" };
    const shop = key => { const d = D(); return d && d.SKLEPY[key] ? d.SKLEPY[key] : null; };
    const listOf = key => { const s = shop(key); return s ? s.sprzedaje || (s.wzor && shop(s.wzor) ? shop(s.wzor).sprzedaje : []) : []; };
    const inHours = (h, w) => !w || (h >= w[0] && h < w[1]);
    const favor = () => { const G = T.api("Garnizon"); return G && G.favor ? G.favor() : 0; };
    const kantorMul = key => { const K = T.api("Kantor"); return (key === "kantor" || key === "ludmila") && K && K.priceMul ? K.priceMul() : 1; };
    // a worn thing's state: what is left of it (0..1)
    function condition(id) {
        const du = DU();
        if (!du || !du.TOOLS || !du.TOOLS[id] || !du.lifeOf) return 1;
        return Math.max(0, Math.min(1, du.left(id) / Math.max(1, du.lifeOf(id))));
    }
    // the rag-and-bone man's used things today: [id] (each sold once a day)
    function usedToday(key) {
        const s = shop(key);
        if (!s || !s.uzywane || !has()) return [];
        const st = store(), dd = day();
        if (st.uzywane.day !== dd) {
            const list = s.uzywane.z.filter(id => item(id)).map((id, i) => ({ id, h: hash(dd, i + 57, 3) })).sort((a, b) => a.h - b.h).slice(0, s.uzywane.ile).map(x => x.id);
            st.uzywane = { day: dd, list, sold: {} };
        }
        return st.uzywane.list.filter(id => !st.uzywane.sold[id]);
    }
    // an item's condition in a shop: { locked: the garrison's favour it wants } (null: free)
    function lockOf(key, id) {
        const s = shop(key), base = s && s.wzor ? shop(s.wzor) : null, w = s && ((s.warunek || (base && base.warunek) || {})[id]);
        return w && w.przychylnosc && favor() < w.przychylnosc ? w.przychylnosc : 0;
    }
    function buyPrice(key, p, used) {
        const d = D(), s = shop(key);
        const base = d.cenaOf(p) || d.wartoscOf(p);
        return Math.max(1, Math.round(base * kantorMul(key) * (used && s && s.uzywane ? s.uzywane.cena : 1)));
    }
    function buys(s, p) {
        const d = D();
        return !!(s && p && !p.unikat && d.wartoscOf(p) > 0 && (s.skupuje === true || (Array.isArray(s.skupuje) && s.skupuje.includes(p.material))));
    }
    function sellPrice(key, id) {
        const s = shop(key), d = D(), p = d && d.przedmiot(id);
        if (!buys(s, p)) return 0;
        const sell = CB() && CB().perk ? CB().perk("sell") : 0;
        return Math.max(1, Math.round(d.wartoscOf(p) * s.skup * Math.max(0.3, condition(id)) * (1 + sell)));
    }
    const mends = (key, p) => { const s = shop(key); return !!(s && p && Array.isArray(s.naprawia) && s.naprawia.includes(p.material)); };
    function repairPrice(id) {
        const d = D(), p = d && d.przedmiot(id), du = DU();
        if (!p || !du || !du.TOOLS || !du.TOOLS[id]) return 0;
        const worn01 = Math.min(1, du.used(id) / Math.max(1, du.lifeOf(id))), M = d.MATERIALY[p.material];
        return Math.max(d.NAPRAWA.min, Math.round(d.wartoscOf(p) * d.NAPRAWA.cena * worn01 * (M && M.naprawa === "kowal2" ? d.NAPRAWA.drogo : 1)));
    }
    const fail = why => ({ ok: false, why });
    function intoBag(it) {
        const before = $gameParty.numItems(it);
        if (before >= $gameParty.maxItems(it)) return false;
        $gameParty.gainItem(it, 1);
        return $gameParty.numItems(it) > before;
    }
    const setUsed = (id, n) => { const du = DU(); if (du && du.setUsed) du.setUsed(id, n); };
    function afterChange() { dirty(); const e = E(); if (e && e.ensure) e.ensure(); }

    function kup(key, id, used) {
        id = Number(id);
        const s = shop(key), d = D(), p = d && d.przedmiot(id), it = item(id);
        if (!s || !p || !it || !has()) return fail("Tego tu nie ma.");
        if (used ? !s.uzywane || !usedToday(key).includes(id) : !listOf(key).includes(id)) return fail("Tego tu nie ma.");
        const lock = lockOf(key, id);
        if (lock) return fail("Tylko dla swoich: przychylność garnizonu " + lock + ".");
        const cost = buyPrice(key, p, used);
        if ($gameParty.gold() < cost) return fail("Potrzebujesz " + cost + " G");
        const had = count(id);
        if (!intoBag(it)) return fail("Nie uniesiesz więcej");
        $gameParty.loseGold(cost);
        const du = DU();
        if (!had && du && du.TOOLS && du.TOOLS[id]) setUsed(id, used ? du.lifeOf(id) * s.uzywane.zuzycie : 0);
        if (used) store().uzywane.sold[id] = true;
        store().kupione++;
        afterChange();
        const on = !!(E() && E().worn && E().worn(id));
        T.emit("bronKupiony", { key, id, cost, used: !!used });
        return { ok: true, cost, on, text: "Kupione: " + p.nazwa + (on ? " - założone" : " - w plecaku") };
    }
    function sprzedaj(key, id) {
        id = Number(id);
        const s = shop(key), d = D(), p = d && d.przedmiot(id), it = item(id);
        if (!s || !p || !it || !buys(s, p)) return fail("Tego tu nie kupią.");
        if (count(id) <= 0) return fail("Nie masz tego.");
        const gold = sellPrice(key, id);
        $gameParty.loseItem(it, 1, false);
        if (count(id) <= 0) setUsed(id, 0);   // (the next one bought is a new one)
        $gameParty.gainGold(gold);
        store().sprzedane++;
        afterChange();
        T.emit("bronSprzedany", { key, id, gold });
        return { ok: true, gold, text: "Sprzedane: " + p.nazwa + " +" + gold + " G" };
    }
    function napraw(key, id) {
        id = Number(id);
        const d = D(), p = d && d.przedmiot(id), du = DU();
        if (!shop(key) || !p || !mends(key, p) || !du || !du.TOOLS || !du.TOOLS[id]) return fail("Tego tu nie naprawią.");
        if (count(id) <= 0) return fail("Nie masz tego.");
        if (!(du.used(id) > 0)) return fail("To jest całe.");
        const cost = repairPrice(id);
        if ($gameParty.gold() < cost) return fail("Potrzebujesz " + cost + " G");
        $gameParty.loseGold(cost);
        du.repair(id);
        store().naprawione++;
        T.emit("bronNaprawiony", { key, id, cost });
        return { ok: true, cost, text: "Naprawione: " + p.nazwa };
    }
    const TABS = ["kup", "sprzedaj", "napraw"];
    function tabsOf(key) {
        const s = shop(key);
        if (!s) return [];
        return TABS.filter(t => t !== "napraw" || (Array.isArray(s.naprawia) && s.naprawia.length));
    }
    // the rows of a tab: { act, id, p, cost | gold, used, name, short, locked }
    function oferta(key, tab) {
        const s = shop(key), d = D(), out = [];
        if (!s || !d || !has()) return out;
        const gold = $gameParty.gold(), lv = level();
        if (tab === "kup") {
            for (const id of listOf(key)) {
                const p = d.przedmiot(id);
                if (!p || !item(id) || p.poziom > lv + (s.pokaz || 99)) continue;
                const cost = buyPrice(key, p, false), locked = lockOf(key, id);
                out.push({ act: "kup", id, p, cost, used: false, name: p.nazwa, short: gold < cost || !!locked, locked });
            }
            for (const id of usedToday(key)) {
                const p = d.przedmiot(id), cost = buyPrice(key, p, true);
                out.push({ act: "kup", id, p, cost, used: true, name: p.nazwa + " (" + d.SKLEP_TEKSTY.uzywane + ")", short: gold < cost });
            }
        } else if (tab === "sprzedaj") {
            for (const p of d.PRZEDMIOTY) {
                if (!item(p.id) || count(p.id) <= 0 || !buys(s, p)) continue;
                const on = !!(E() && E().worn && E().worn(p.id)), n = count(p.id);
                out.push({ act: "sprzedaj", id: p.id, p, gold: sellPrice(key, p.id), n, on, name: p.nazwa + (n > 1 ? " ×" + n : "") + (on && n === 1 ? " · założone" : "") });
            }
        } else if (tab === "napraw") {
            const du = DU();
            for (const p of d.PRZEDMIOTY) {
                if (!item(p.id) || count(p.id) <= 0 || !mends(key, p) || !du || !du.TOOLS || !du.TOOLS[p.id] || !(du.used(p.id) > 0)) continue;
                const cost = repairPrice(p.id);
                out.push({ act: "napraw", id: p.id, p, cost, short: gold < cost, name: p.nazwa + "  " + du.left(p.id) + "/" + du.lifeOf(p.id) });
            }
        }
        return out;
    }
    function doRow(key, r) {
        if (!r) return fail("");
        if (r.act === "kup") return kup(key, r.id, r.used);
        if (r.act === "sprzedaj") return sprzedaj(key, r.id);
        if (r.act === "napraw") return napraw(key, r.id);
        return fail("");
    }

    // ------------------------------------------------------------------
    // The talks: the shopkeeper's menu (first - after a quest's hand-in, offer or remark); "Porozmawiaj" - the rest of the hooks
    // ------------------------------------------------------------------
    const LINE = 46, PAGE = 3;
    function wrapLine(text) {
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
        const lines = wrapLine(text);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""]));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l])));
        }
        return out;
    }
    function choiceTo(out, labels, branches, cancel) {
        out.push(C(102, [labels, cancel, 0, 2, 0]));
        labels.forEach((l, i) => {
            out.push(C(402, [i, l]));
            for (const c of branches[i] || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + 1 }));
            out.push(C(0, [], 1));
        });
        out.push(C(404, []));
        return out;
    }
    const cmdAct = args => [C(355, ["Bron.act(this, " + JSON.stringify(args) + ")"])];
    // the quests speak first: a remark, a ready hand-in, an offer, a quest's marker over the head
    function questFirst(key) {
        const q = TQ();
        if (!q) return false;
        try {
            if (q.remarkFor && q.remarkFor(key)) return true;
            if (q.talkFor && q.talkFor(key, true)) return true;
            if ((q.QUESTS || []).some(x => x.giver === key && x.offer && q.offerable && q.offerable(x.id))) return true;
            if (q.markers) { if (q.refreshMarkers) q.refreshMarkers(); const m = q.markers()[key]; if (m === "ready" || m === "new") return true; }
        } catch (e) { /* (the quests speak through TownQuests) */ }
        return false;
    }
    // the others' first words: Garnizon's first meeting with Kłos (and his trade only for friends), Baltazar's weekly cut, Ludmiła only
    // behind the honest counter
    // (Tadek's menu of Ludzie.js - the steel at a discount - and Baltazar's shop of Kantor.js after W5 get this trade as one line more
    // instead: their own menus come then)
    const qflag = k => { const q = TQ(), st = q && q.state ? q.state() : null; return !!(st && st.flags && st.flags[k]); };
    const YIELD = {
        kowal: () => qflag("ludKowalRabat") && !!T.api("Ludzie") && !!T.api("Ludzie").addMenu,
        kupiec: () => {
            const K = T.api("Kantor"), st = K && K.state ? K.state() : null, q = TQ();
            if (!st) return false;
            if (st.outcome === "double" && day() - (st.weekPaid || 0) >= 7) return true;   // (the weekly cut first)
            const w = K.DATA && K.DATA.TIME && K.DATA.TIME.work, mode = K.mode ? K.mode() : "";
            return !!(q && q.isDone && q.isDone("W5") && (mode === "grip" || mode === "enemy") && (!w || inHours(hour(), w)) && K.addMenu);
        }
    };
    const sells = key => listOf(key).some(id => item(id));
    const openNow = key => { const s = shop(key); return !!s && inHours(hour(), s.godziny) && sells(key); };
    let skipTalk = "";
    function menu(key, resident, ev) {
        const s = shop(key), d = D(), spk = { id: ev.eventId(), name: s.kto }, out = [], M = d.SKLEP_TEKSTY.menu;
        sayTo(out, spk, pick(s.teksty.witaj));
        const labels = [s.menu], branches = [cmdAct(["otworz", key, "kup"])];
        labels.push(M.sprzedaj);
        branches.push(cmdAct(["otworz", key, "sprzedaj"]));
        if (tabsOf(key).includes("napraw")) { labels.push(M.napraw); branches.push(cmdAct(["otworz", key, "napraw"])); }
        labels.push(M.rozmowa, M.nic);
        branches.push(cmdAct(["rozmowa", resident]), []);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    // (only Tadek and Baltazar have no menu of their own to take one line more: the others' trade goes into their menus - menuRows)
    const OWN_TALK = { kowal: true, kupiec: true };
    function talkHook(resident, ev) {
        if (skipTalk && skipTalk === resident) return null;   // ("Porozmawiaj": the others' turn)
        const key = SHOP_OF[resident], s = key ? shop(key) : null;
        if (!OWN_TALK[resident] || !s || !has() || !ev || !openNow(key)) return null;
        if (questFirst(resident) || (YIELD[resident] && YIELD[resident]())) return null;
        return menu(key, resident, ev);
    }
    // "Porozmawiaj": the same talk once more, without this menu - the quests, the others' menus, the usual lines
    function plainTalk(resident, interp) {
        const L = TL();
        if (!L || !L.talk || !interp) return;
        skipTalk = resident;
        try { L.talk(interp); } finally { skipTalk = ""; }
    }
    // ---- one line more in the others' own menus (their rules, hours and words kept): Kłos's (Garnizon, from the garrison's favour and
    // while he is there), his deputy's - once Kłos is handed over (D27): the soldier by the barrels and the granary (role "beczki", event
    // 643) says his words and a greeting, then the quartermaster's trade -, Ludmiła's counter and Baltazar's shop (Kantor), Tadek's
    // steel (Ludzie). key: theirs ("kwatermistrz", "zolnierz:<role>", "ludmila", "kupiec", "kowal")
    const DEPUTY = { key: "zastepca", role: "beczki" };
    function menuRows(key, ev) {
        if (!has()) return null;
        const G = T.api("Garnizon"), gone = !!(G && G.klosGone && G.klosGone());
        const row = (shopKey, extra) => {
            const s = shop(shopKey);
            if (!s || !openNow(shopKey) || favor() < (s.przychylnosc || 0)) return null;
            return [Object.assign({ label: s.menu, cmds: cmdAct(["otworz", shopKey, "kup"]) }, extra || {})];
        };
        if (key === "kwatermistrz") return gone ? null : row("kwatermistrz");
        if (key === "zolnierz:" + DEPUTY.role) return gone ? row(DEPUTY.key, { say: pick(shop(DEPUTY.key).teksty.witaj) }) : null;
        if (key === "ludmila") return row("ludmila");
        if (key === "kupiec") return row("kantor");
        if (key === "kowal") return row("kowal");
        return null;
    }
    // the clothes' shopkeepers: one line more in Ubior_Sklepy's menu
    function ubiorMenu(resident) {
        const key = SHOP_OF[resident], s = key ? shop(key) : null;
        if (!s || !s.ubior || !has() || !sells(key)) return null;
        return [{ label: s.menu, cmds: cmdAct(["otworz", key, "kup"]) }];
    }
    // the events' script: Bron.act(this, [what, key, tab])
    function act(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        try {
            const [what, key, tab] = args;
            if (what === "otworz") otworz(key, tab, interp ? interp.eventId() : 0);
            else if (what === "rozmowa") plainTalk(key, interp);
        } catch (e) { report("act", e); }
    }

    // ------------------------------------------------------------------
    // The shop's window (the black and yellow look of the game: Tawerna.ui)
    // ------------------------------------------------------------------
    let bye = null;   // the shopkeeper's last word, said over his head back on the map
    function otworz(key, tab, eventId) {
        if (!shop(key) || !T.ui || !T.ui.IconList) return false;
        SceneManager.push(Scene_BronSklep);
        SceneManager.prepareNextScene(key, tab || "kup", eventId || 0);
        return true;
    }
    T.onMapUpdate(() => {
        if (!bye || $gameMap.isEventRunning()) return;
        const b = bye;
        bye = null;
        const L = TL(), res = Object.keys(SHOP_OF).find(r => SHOP_OF[r] === b.key), ev = b.eventId ? $gameMap.event(b.eventId) : null;
        if (L && L.say && res) L.say(res, b.text);
        else if (ev) T.call("SpeechBubbles", "say", ev, b.text);   // (the deputy: a soldier, not a resident)
    }, { owner: PLUGIN, name: "bye" });
    // what the hero has now in the place the thing would go: { name, value } for the comparison
    function nowFor(p) {
        const d = D(), e = E(), F = T.api("Combat_parts");
        if (!e || !p) return null;
        if (p.typ === "bron") {
            if (isRanged(p.id)) { const id = rangedItem(), q = id ? d.przedmiot(id) : null, s = q ? d.staty(q) : null; return s ? { name: item(id).name, v: s.damage, what: "strzał" } : null; }
            // (the weapon in hand - or, with the bow in hand, the first one of [ ])
            let h = CB() && CB().handMelee ? CB().handMelee() : 0;
            if (!h && CB() && CB().hand && CB().hand() === "ranged") { const c = (CB().handChoices() || []).find(x => x[0] === "m" && x !== "m0"); h = c ? Number(c.slice(1)) : 0; }
            const w = F && F.fight && F.fight.weaponNow ? F.fight.weaponNow(h) : null;
            return w ? { name: h ? w.name : "Pięści", v: w.dmg, what: "obrażenia" } : null;
        }
        if (p.typ === "zbroja") {
            const id = e.current(d.MIEJSCA[p.miejsce].eq), F2 = F && F.fight, a = id && F2 && F2.ARMORS[id];
            return id ? { name: item(id).name, v: a ? a.reduce : 0, what: "obrona", pct: true } : { name: "nic", v: 0, what: "obrona", pct: true };
        }
        if (p.typ === "tarcza") {
            const sh = F && F.fight && F.fight.shield ? F.fight.shield() : null;
            return sh ? { name: sh.name, v: sh.reduce, what: "blok", pct: true } : { name: "bez tarczy", v: F && F.fight ? F.fight.NO_SHIELD.reduce : 0.45, what: "blok", pct: true };
        }
        const id = e.current("extra");
        return { name: id ? item(id).name : "nic", v: null, what: "" };
    }
    // the thing's own number for the comparison (as it would be for the hero now)
    function valueOf(p) {
        const d = D(), l = lackOf(p);
        if (p.typ === "bron") { const s = d.staty(p); return s.dystans ? Math.round(s.damage * (1 - l)) : Math.max(1, Math.round(s.dmg * (1 - l))); }
        if (p.typ === "zbroja") return p.obrona * (1 - l);
        if (p.typ === "tarcza") return p.blok * (1 - l);
        return null;
    }

    class Scene_BronSklep extends Scene_MenuBase {
        prepare(key, tab, eventId) {
            this._key = key;
            this._tab = tab;
            this._eventId = eventId || 0;
        }
        needsCancelButton() { return false; }
        create() {
            super.create();
            const ui = T.ui, W = Graphics.width, H = Graphics.height;
            this._key = this._key || "kowal";
            this._tabs = tabsOf(this._key);
            if (!this._tabs.includes(this._tab)) this._tab = this._tabs[0] || "kup";
            this._title = new ui.TitleBar({ x: 24, y: 14, w: W - 48, h: 46 });
            this.addChild(this._title);
            this._tabBar = new Sprite(new Bitmap(W - 48, 40));
            this._tabBar.x = 24; this._tabBar.y = 68;
            this.addChild(this._tabBar);
            const LW = 584, top = 116, LH = H - top - 58;
            this._list = new ui.IconList(LW, LH, { row: 44 });
            this._list.x = 24; this._list.y = top;
            this.addChild(this._list);
            this._info = new Sprite(new Bitmap(W - 48 - LW - 16, LH));
            this._info.x = 24 + LW + 16; this._info.y = top;
            this.addChild(this._info);
            this._keys = new ui.KeyHints(H - 46, W);
            this.addChild(this._keys);
            this._msg = null;
            this._tabRects = [];
            this.rebuild(0);
        }
        start() {
            super.start();
            T.audio.se("Book1", { volume: 50 });
        }
        terminate() {
            super.terminate();
            const s = shop(this._key);
            if (s && s.teksty && s.teksty.zegnaj) bye = { key: this._key, text: pick(s.teksty.zegnaj), eventId: this._eventId };
            Input.clear();
            TouchInput.clear();
        }
        rows() { return this._rows || []; }
        rebuild(index) {
            const d = D();
            this._rows = oferta(this._key, this._tab);
            const items = this._rows.map(r => ({ icon: item(r.id) ? item(r.id).iconIndex : 0, text: r.name,
                right: r.act === "sprzedaj" ? "+" + r.gold + " G" : r.cost + " G", color: r.short ? "#8a9099" : undefined }));
            if (!items.length) items.push({ icon: 0, text: d.SKLEP_TEKSTY.pusto[this._tab], disabled: true });
            this._list.set(items, Math.min(index || 0, Math.max(0, items.length - 1)));
            this.drawTitle();
            this.drawTabs();
            this.drawInfo();
            this.drawKeys();
        }
        current() { return this.rows()[this._list.index] || null; }
        drawTitle() {
            const s = shop(this._key), d = D();
            this._title.set(s.kto, s.tytul + "  ·  " + d.SKLEP_TEKSTY.zakladki[this._tab], $gameParty.gold() + " G", COIN_ICON);
        }
        drawTabs() {
            const ui = T.ui, b = this._tabBar.bitmap, d = D();
            b.clear();
            this._tabRects = [];
            let x = 0;
            for (const t of this._tabs) {
                const w = 170;
                ui.button(b, x, 2, w, 34, d.SKLEP_TEKSTY.zakladki[t], { focus: t === this._tab, small: true });
                this._tabRects.push({ t, x: this._tabBar.x + x, y: this._tabBar.y, w, h: 38 });
                x += w + 10;
            }
        }
        drawKeys() {
            const verb = { kup: "kup", sprzedaj: "sprzedaj", napraw: "napraw" }[this._tab];
            const rows = [["O", verb], [["up", "down"], "wybór"]];
            if (this._tabs.length > 1) rows.push([["left", "right"], "zakładka"]);
            rows.push(["P", "wyjdź"]);
            this._keys.set(rows);
        }
        drawInfo() {
            const ui = T.ui, S = ui.style(), b = this._info.bitmap, d = D(), r = this.current(), W = b.width;
            b.clear();
            ui.panel(b, 0, 0, W, b.height, { cut: 6 });
            const x = 22;
            let y = 18;
            if (!r) {
                ui.text(b, d.SKLEP_TEKSTY.pusto[this._tab], x, y, W - 44, { size: 20, color: S.muted });
                this.drawMsg(b);
                return;
            }
            const p = r.p, du = DU(), it = item(p.id);
            ui.icon(b, it ? it.iconIndex : 0, x, y, 64);
            ui.text(b, p.nazwa, x + 80, y + 2, W - x - 100, { size: 24, color: S.accent, bold: true });
            const kind = p.typ === "bron" ? d.RODZAJE[p.rodzaj].nazwa : p.typ === "zbroja" ? "zbroja: " + d.MIEJSCA[p.miejsce].nazwa.toLowerCase() : p.typ === "tarcza" ? "tarcza" : p.rodzaj;
            const mat = d.MATERIALY[p.material] ? d.MATERIALY[p.material].nazwa : "";
            ui.text(b, kind + (mat && p.typ !== "dodatek" ? "  ·  " + mat : "") + "  ·  poziom " + p.poziom + "  ·  waga " + d.wagaOf(p), x + 80, y + 36, W - x - 100, { size: 17, color: S.muted });
            y += 80;
            const l = lackOf(p);
            if (l > 0) {
                ui.text(b, "Masz poziom " + level() + ": słabiej o " + pct(l) + " (do poziomu " + p.poziom + ")", x, y, W - 2 * x, { size: 18, color: ui.COLORS.bad, bold: true });
                y += 28;
            }
            // what it gives (the numbers), and against what the hero has now
            const words = d.opis(p.id).split(" · ");
            for (const line of words.slice(0, 5)) {
                for (const w of ui.wrap(b, line.charAt(0).toUpperCase() + line.slice(1), W - 2 * x, 19).slice(0, 2)) { ui.text(b, w, x, y, W - 2 * x, { size: 19, color: S.text }); y += 25; }
            }
            const now = nowFor(p), v = valueOf(p);
            if (now && v !== null && now.v !== null) {
                const diff = v - now.v, fmt = n => (now.pct ? pct(n) : String(Math.round(n)));
                const sign = diff > 0.0001 ? "+" : diff < -0.0001 ? "-" : "±";
                ui.text(b, "Teraz: " + now.name + " (" + now.what + " " + fmt(now.v) + ") → " + sign + fmt(Math.abs(diff)), x, y + 2, W - 2 * x,
                    { size: 18, color: diff > 0.0001 ? ui.COLORS.good : diff < -0.0001 ? ui.COLORS.bad : S.muted });
                y += 30;
            } else if (now && p.typ === "dodatek") { ui.text(b, "Teraz: " + now.name, x, y + 2, W - 2 * x, { size: 18, color: S.muted }); y += 30; }
            // how long it lasts, how many there are
            const life = du && du.TOOLS && du.TOOLS[p.id] && du.lifeOf ? du.lifeOf(p.id) : d.trwalosc(p), unit = n => (du && du.unitWord && du.TOOLS[p.id] ? du.unitWord(p.id, n) : "");
            let lasts = life ? life + " " + (unit(life) || "ciosów") : "nie zużywa się";
            if (count(p.id) > 0 && life && r.act !== "kup" && du && du.TOOLS[p.id]) lasts = "zostało " + du.left(p.id) + " z " + life + (unit(life) ? " " + unit(life) : "");
            if (r.act === "kup" && r.used) lasts = "używane: zostało ok. połowy";
            ui.text(b, "Wytrzymałość: " + lasts, x, y, W - 2 * x, { size: 18, color: S.muted });
            y += 26;
            const n = count(p.id), on = n > 0 && E() && E().worn && E().worn(p.id);
            ui.text(b, n > 0 ? "Masz: " + n + (on ? " · założone" : " · w plecaku") : "Nie masz.", x, y, W - 2 * x, { size: 18, color: S.muted });
            y += 34;
            const price = r.locked ? "Tylko dla swoich: przychylność garnizonu " + r.locked
                : r.act === "kup" ? "Cena: " + r.cost + " G" : r.act === "sprzedaj" ? "Dostaniesz: " + r.gold + " G" + (r.on && r.n === 1 ? " (zdejmiesz je)" : "") : "Naprawa: " + r.cost + " G - wróci do pełna";
            ui.text(b, price, x, y, W - 2 * x, { size: 22, color: r.short ? ui.COLORS.bad : ui.COLORS.gold, bold: true });
            // the item's own words
            const desc = it ? String(it.description || "").replace(/\n/g, " ") : "";
            const lines = desc ? ui.wrap(b, desc, W - 2 * x, 16).slice(0, 3) : [];
            lines.forEach((ln, i) => ui.text(b, ln, x, b.height - 58 - (lines.length - i) * 22, W - 2 * x, { size: 16, color: S.muted }));
            this.drawMsg(b);
        }
        drawMsg(b) {
            const ui = T.ui;
            if (!this._msg) return;
            ui.text(b, this._msg.text, 22, b.height - 44, b.width - 44, { size: 19, color: this._msg.ok ? ui.COLORS.good : ui.COLORS.bad, bold: true });
        }
        say(text, ok) {
            this._msg = { text, ok, at: Graphics.frameCount };
            this.drawInfo();
        }
        update() {
            super.update();
            if (this._msg && Graphics.frameCount - this._msg.at > 150) { this._msg = null; this.drawInfo(); }
            if (this._leaving) return;
            if (Input.isTriggered("cancel") || TouchInput.isCancelled()) return this.close();
            if (Input.isTriggered("ok")) return this.ok();
            if (Input.isRepeated("up")) return this.move(-1);
            if (Input.isRepeated("down")) return this.move(1);
            if (Input.isTriggered("left") || Input.isTriggered("pageup")) return this.switchTab(-1);
            if (Input.isTriggered("right") || Input.isTriggered("pagedown")) return this.switchTab(1);
            this.updateMouse();
        }
        updateMouse() {
            if (TouchInput.wheelY) { this.move(TouchInput.wheelY > 0 ? 1 : -1); return; }
            if (!TouchInput.isTriggered()) return;
            const x = TouchInput.x, y = TouchInput.y;
            const tab = this._tabRects.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
            if (tab) { if (tab.t !== this._tab) { this._tab = tab.t; SoundManager.playCursor(); this._msg = null; this.rebuild(0); } return; }
            const i = this._list.hitAt(x, y);
            if (i < 0) return;
            if (i === this._list.index) this.ok();
            else { this._list.select(i); SoundManager.playCursor(); this.drawInfo(); }
        }
        move(dir) {
            const before = this._list.index;
            this._list.move(dir);
            if (this._list.index !== before) { SoundManager.playCursor(); this.drawInfo(); }
        }
        switchTab(dir) {
            if (this._tabs.length < 2) return;
            const i = (this._tabs.indexOf(this._tab) + dir + this._tabs.length) % this._tabs.length;
            this._tab = this._tabs[i];
            this._msg = null;
            SoundManager.playCursor();
            this.rebuild(0);
        }
        ok() {
            const r = this.current();
            if (!r) { SoundManager.playBuzzer(); return; }
            const res = doRow(this._key, r), s = shop(this._key);
            if (!res.ok) { SoundManager.playBuzzer(); this.say(res.why, false); return; }
            T.audio.se(r.act === "sprzedaj" ? "Coin" : r.act === "kup" ? "Shop1" : "Hammer", { volume: 70 });
            const said = s.teksty && s.teksty[{ kup: "kupione", sprzedaj: "sprzedane", napraw: "naprawione" }[r.act]];
            this.rebuild(this._list.index);
            this.say(res.text + (said && said.length ? "  " + pick(said) : ""), true);
        }
        close() {
            SoundManager.playCancel();
            this._leaving = true;
            this.popScene();
        }
        // what the tests see
        state() { return { key: this._key, tab: this._tab, tabs: this._tabs.slice(), index: this._list.index, rows: this.rows().map(r => r.name), msg: this._msg ? this._msg.text : "" }; }
    }

    // ------------------------------------------------------------------
    // The recipes: the forge, the tannery, the workbench (each on the list from its level - PRZEPISY.widac)
    // ------------------------------------------------------------------
    function syncRecipes() {
        const FA = T.api("Farming"), B = FA && FA.BUILDINGS, d = D();
        if (!B || !d || !window.$dataItems) return 0;
        const all = d.przepisy(), lv = window.$gameSystem ? level() : 1;
        let n = 0;
        for (const st of Object.keys(all)) {
            const def = B[st];
            if (!def || !Array.isArray(def.recipes)) continue;
            for (let i = def.recipes.length - 1; i >= 0; i--) if (def.recipes[i] && def.recipes[i].bron) def.recipes.splice(i, 1);
            for (const r of all[st]) {
                if (!item(r.output[0]) || !r.inputs.every(([id]) => item(id)) || r.poziom > lv + d.PRZEPISY.widac) continue;
                def.recipes.push(r);
                n++;
            }
        }
        return n;
    }

    // ------------------------------------------------------------------
    // The loot
    // ------------------------------------------------------------------
    const lootWired = { done: false };
    function wireLoot() {
        const d = D();
        if (!d || !window.$dataItems || lootWired.done) return false;
        if (!item(300)) return false;
        const push = (list, entry) => { if (Array.isArray(list) && item(entry[0]) && !list.some(x => x[0] === entry[0])) list.push(entry); };
        const HD = window.HumansData;
        if (HD && HD.KINDS) {
            for (const k of Object.keys(d.LUP.ludzie)) if (HD.KINDS[k]) for (const [id, c] of d.LUP.ludzie[k]) push(HD.KINDS[k].loot, [id, c, 1]);
            if (HD.CAMP && HD.CAMP.sack) for (const [id, c] of d.LUP.oboz) push(HD.CAMP.sack.loot, [id, c, 1]);
        }
        const CD = window.CreaturesData;
        if (CD && CD.KINDS) for (const k of Object.keys(d.LUP.stwory)) if (CD.KINDS[k]) { CD.KINDS[k].loot = CD.KINDS[k].loot || []; for (const [id, c] of d.LUP.stwory[k]) push(CD.KINDS[k].loot, [id, c, 1]); }
        if (CD && CD.BOSSES) for (const k of Object.keys(d.LUP.bossowie)) if (CD.BOSSES[k]) { CD.BOSSES[k].loot = CD.BOSSES[k].loot || []; for (const id of d.LUP.bossowie[k]) push(CD.BOSSES[k].loot, [id, 1, 1]); }
        const DW = window.DworData;
        if (DW && Array.isArray(DW.GEAR)) for (const id of d.LUP.zbrojowniaLorda) if (item(id) && !DW.GEAR.some(g => g[0] === id)) DW.GEAR.push([id, 1]);
        lootWired.done = true;
        return true;
    }
    // a searched container of the underground (Underground.search): one more roll - its kind's chance x (1 + luck), the thing by the band
    function ugExtra(eventId) {
        const UG = T.api("Underground"), d = D();
        if (!UG || !d || !UG.info) return null;
        const mapId = $gameMap.mapId(), info = UG.info(mapId), e = info && info.loot ? info.loot[eventId] : null;
        const chance = e ? d.LUP.podziemia.szansa[e.kind] : 0;
        if (!chance) return null;
        const floor = UG.floorOf ? UG.floorOf(mapId) : 0, band = UG.bandOf ? UG.bandOf(floor) : null, table = band ? d.LUP.podziemia.pasma[band.id] : null;
        if (!table) return null;
        const seed = (info.seed || 0) >>> 0;
        if (hash(seed, eventId, 11) >= chance * (1 + luck())) return null;
        const list = table.filter(([id]) => item(id)), total = list.reduce((a, [, w]) => a + w, 0);
        let r = hash(seed, eventId, 23) * total, pickId = 0;
        for (const [id, w] of list) { r -= w; if (r < 0) { pickId = id; break; } }
        if (!pickId) return null;
        $gameParty.gainItem(item(pickId), 1);
        T.popup(item(pickId).name, { icon: item(pickId).iconIndex, gain: true });
        store().lup++;
        T.emit("bronLup", { id: pickId, floor, kind: e.kind });
        return pickId;
    }
    // luck: a part more of the old coins found in the ruins
    T.on("undergroundLoot", e => {
        if (!e || !(e.gold > 0) || !has()) return;
        const extra = Math.round(e.gold * luck());
        if (extra <= 0) return;
        $gameParty.gainGold(extra);
        T.popup("Szczęście: +" + extra + " G", { icon: COIN_ICON, gain: true });
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The uniques: once each (store().dane[id] - the day it came)
    // ------------------------------------------------------------------
    function giveUnique(id, why) {
        const d = D(), u = d && d.UNIKATY[id], it = item(id), st = has() ? store() : null;
        if (!u || !it || !st || st.dane[id]) return false;
        st.dane[id] = day();
        $gameParty.gainItem(it, 1);
        T.popup(u.tekst || it.name, { top: true, sub: it.name, color: "#ffe9a8" });
        if (u.notatka) T.call("Journal", "addNote", u.notatka[0], u.notatka[1]);
        dirty();
        T.emit("bronUnikat", { id, why: why || "" });
        return true;
    }
    function checkUniques() {
        const d = D();
        if (!d || !has() || !item(396)) return 0;
        const q = TQ(), flags = q && q.state ? (q.state() || {}).flags || {} : {};
        let n = 0;
        for (const key of Object.keys(d.UNIKATY)) {
            const id = Number(key), u = d.UNIKATY[key];
            if (store().dane[id]) continue;
            if (u.flaga && u.flaga.some(f => flags[f])) { if (giveUnique(id, "flaga")) n++; continue; }
            if (u.przychylnosc && favor() >= u.przychylnosc) { if (giveUnique(id, "przychylnosc")) n++; continue; }
            if (u.zadanie && q && q.isDone && u.zadanie.some(z => { try { return q.isDone(z); } catch (e) { return false; } })) { if (giveUnique(id, "zadanie")) n++; }
        }
        return n;
    }
    T.on("townQuestDone", () => { try { checkUniques(); } catch (e) { report("uniques", e); } }, { owner: PLUGIN });
    T.on("garnizonFavor", () => { try { checkUniques(); } catch (e) { report("uniques", e); } }, { owner: PLUGIN });
    T.on("hourChange", () => { try { checkUniques(); } catch (e) { report("uniques", e); } }, { owner: PLUGIN });
    // a unique that comes by other ways (a boss's remains, F9): noted as come, the journal tells its story the first time (bosses)
    const _gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(it, amount, includeEquip) {
        _gainItem.apply(this, arguments);
        if (!it || this !== window.$gameParty || !DataManager.isItem(it)) return;
        const d = D();
        if (!d || !d.przedmiot(it.id)) return;
        dirty();
        if (amount > 0 && d.UNIKATY[it.id] && window.$gameSystem && !store().dane[it.id]) {
            store().dane[it.id] = day();
            const u = d.UNIKATY[it.id];
            if (u.boss && u.notatka) T.call("Journal", "addNote", u.notatka[0], u.notatka[1]);
        }
    };

    // ------------------------------------------------------------------
    // The wear: every new thing as Durability's "tool"
    // ------------------------------------------------------------------
    const METAL = ["braz", "zelazo", "stal", "okute", "pierwszych", "zakon"];
    function wireDurability() {
        const du = DU(), d = D();
        if (!du || !du.TOOLS || !d) return false;
        for (const p of d.PRZEDMIOTY) {
            if (du.TOOLS[p.id] || p.istnieje) continue;
            const life = d.trwalosc(p), unit = d.jednostka(p);
            if (!life || !unit) continue;
            const R = p.typ === "bron" ? d.RODZAJE[p.rodzaj] : null, g = (R && R.g) || p.g || "m", M = d.MATERIALY[p.material] || {};
            const end = g === "f" ? "a" : g === "p" ? "y" : g === "n" ? "o" : "";
            const broke = p.typ === "bron" ? undefined : METAL.includes(p.material) ? "się rozpadł" + end : "się podarł" + end;
            du.TOOLS[p.id] = { life, unit, g, fix: (M.fix || []).map(x => x.slice()), broke, bron: true };
        }
        return true;
    }

    // ------------------------------------------------------------------
    // Wiring into the other systems (again at the boot, a new game, a load)
    // ------------------------------------------------------------------
    const wired = {};
    function wire() {
        const d = D();
        if (!d) return wired;
        const Cb = CB();
        if (Cb && Cb.addPerkSource && !wired.perk) { Cb.addPerkSource(key => bonus(key)); wired.perk = true; }
        // the choice of the weapon in hand and the parts put on: the bonuses again
        if (Cb && !wired.hand) {
            for (const fn of ["setHand", "switchHand"]) if (typeof Cb[fn] === "function") { const o = Cb[fn]; Cb[fn] = function() { const r = o.apply(this, arguments); dirty(); return r; }; }
            wired.hand = true;
        }
        const e = E();
        if (e && !wired.equip) {
            for (const fn of ["equip", "unequip"]) if (typeof e[fn] === "function") { const o = e[fn]; e[fn] = function() { const r = o.apply(this, arguments); dirty(); return r; }; }
            wired.equip = true;
        }
        if (wireDurability()) wired.durability = true;
        try { if (Cb && Cb.refreshGear) Cb.refreshGear(true); } catch (err) { /* (Combat_Fight not in yet) */ }
        if (window.$dataItems && item(300)) {
            if (wireLoot()) wired.loot = true;
            wired.recipes = syncRecipes();
        }
        // the underground's containers: one roll more
        const UG = T.api("Underground");
        if (UG && UG.search && !UG.search._bron) {
            const orig = UG.search;
            const wrapped = function(eventId) { const ok = orig.apply(this, arguments); if (ok && has()) { try { ugExtra(eventId); } catch (err) { report("ug", err); } } return ok; };
            wrapped._bron = true;
            UG.search = wrapped;
            wired.underground = true;
        }
        // the talks: Tadek, Kłos, the kantor; one line more in the clothes' shops
        const L = TL();
        if (L && L.addTalkHook && !wired.talk) {
            L.addTalkHook((key, ev) => { try { return talkHook(key, ev); } catch (err) { report("talk " + key, err); return null; } }, true);
            wired.talk = true;
        }
        // one line more in Kłos's (and his deputy's) menu, Ludmiła's and Baltazar's (Kantor), Tadek's steel (Ludzie)
        for (const name of ["Garnizon", "Kantor", "Ludzie"]) {
            const A = T.api(name);
            if (A && A.addMenu && !wired["menu" + name]) { A.addMenu((key, ev) => menuRows(key, ev)); wired["menu" + name] = true; }
        }
        const US = T.api("Ubior_Sklepy");
        if (US && US.addMenu && !wired.ubior) { US.addMenu(key => ubiorMenu(key)); wired.ubior = true; }
        // F9 (Debug.js, the tab "Wyspa i fabuła")
        const OK = T.api("Okolice");
        if (OK && OK.f9 && OK.f9.add && !wired.f9) {
            OK.f9.add({ owner: PLUGIN, title: "Bronie i zbroje:", rows: f9Rows, pick: f9Pick, ok: f9Ok });
            wired.f9 = true;
        }
        rangedIds = null;
        dirty();
        return wired;
    }
    for (const ev of ["newGame", "load"]) T.on(ev, () => { dirty(); wire(); checkUniques(); }, { owner: PLUGIN });
    T.on("levelUp", () => { dirty(); syncRecipes(); }, { owner: PLUGIN });
    T.on("mapEnter", () => { try { syncRecipes(); checkUniques(); } catch (e) { report("mapEnter", e); } }, { owner: PLUGIN });
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        try { wire(); } catch (e) { report("wire", e); }
    };
    wire();

    // ------------------------------------------------------------------
    // F9: all of them, a set for level N (put on at once), money for the shops
    // ------------------------------------------------------------------
    const F9_MAX = 27;
    function f9Rows() {
        const n = has() ? store().f9Poziom || 10 : 10, icon = item(305) ? item(305).iconIndex : COIN_ICON;
        return [
            { owner: PLUGIN, label: "Bronie: daj wszystkie", icon, what: "all", desc: "Każda broń, zbroja, tarcza, dodatek i unikat 300-406 po jednej sztuce (te, których nie masz - bez względu na udźwig), 30 strzał i 20 kamieni." },
            { owner: PLUGIN, label: "Bronie: daj zestaw na poziom " + n + "   ←→", icon, what: "set", pick: n,
                desc: "Najlepsza broń, łuk, tarcza i każda część zbroi z poziomem najwyżej " + n + " - od razu założone (←→ zmienia poziom)." },
            { owner: PLUGIN, label: "Bronie: +1000 G", icon: COIN_ICON, what: "gold", desc: "Na test sklepów: kowal Tadek, kwatermistrz Kłos, kantor, garbarz, szwaczka, szmaciarz." }
        ];
    }
    function f9Pick(row, delta) {
        if (row.what !== "set" || !has()) return;
        const st = store();
        st.f9Poziom = ((st.f9Poziom || 10) - 1 + delta + F9_MAX) % F9_MAX + 1;
        row.pick = st.f9Poziom;
        row.label = "Bronie: daj zestaw na poziom " + st.f9Poziom + "   ←→";
    }
    // the best of each kind of place for a level: { weapon, ranged, shield, glowa, tors, rece, nogi, stopy }
    function setFor(n) {
        const d = D(), out = {}, best = (a, b, k) => (!a || k(b) > k(a) ? b : a);
        for (const p of d.PRZEDMIOTY) {
            if (p.istnieje || p.unikat || p.narzedzie || p.poziom > n || !item(p.id)) continue;
            if (p.typ === "bron") {
                const s = d.staty(p);
                if (s.dystans) { if (p.rodzaj === "luk") out.ranged = best(out.ranged, p, q => q.poziom * 100 + d.staty(q).damage); }
                else out.weapon = best(out.weapon, p, q => q.poziom * 100 + d.staty(q).dmg);
            } else if (p.typ === "zbroja") out[p.miejsce] = best(out[p.miejsce], p, q => q.poziom * 10 + q.obrona);
            else if (p.typ === "tarcza") out.shield = best(out.shield, p, q => q.poziom * 10 + q.blok);
        }
        return out;
    }
    function f9Ok(row) {
        const d = D();
        if (!d || !has()) return { say: "Brak Bron_Data.js", bad: true };
        if (row.what === "gold") { $gameParty.gainGold(1000); return { say: "+1000 G (masz " + $gameParty.gold() + " G)" }; }
        if (!item(300)) return { say: "Brak przedmiotów 300+ w bazie (tools/bron/instaluj_dane.py)", bad: true };
        // (the test's way into the bag: past the load - Survival's weight cap stops a whole armoury)
        const put = id => { if (item(id) && count(id) <= 0) { $gameParty._items[id] = 1; return true; } return false; };
        if (row.what === "all") {
            let n = 0;
            for (const p of d.PRZEDMIOTY) {
                if (p.istnieje || !item(p.id) || count(p.id) > 0) continue;
                if (d.UNIKATY[p.id]) store().dane[p.id] = store().dane[p.id] || day();
                if (put(p.id)) n++;
            }
            $gameParty.gainItem($dataItems[127], 30);
            $gameParty.gainItem($dataItems[64], 20);
            afterChange();
            return { say: n ? "Dane: " + n + " (ponad udźwig - to test)" : "Masz już wszystko" };
        }
        if (row.what === "set") {
            const n = store().f9Poziom || 10, set = setFor(n), e = E(), names = [];
            const give = p => { if (p) put(p.id); };
            for (const k of ["weapon", "ranged", "shield", "glowa", "tors", "rece", "nogi", "stopy"]) give(set[k]);
            if (set.ranged) $gameParty.gainItem($dataItems[127], 20);
            if (e && e.equip) {
                for (const m of ["glowa", "tors", "rece", "nogi", "stopy"]) if (set[m] && e.equip(d.MIEJSCA[m].eq, set[m].id)) names.push(set[m].nazwa);
                if (set.shield && e.equip("left", set.shield.id)) names.push(set.shield.nazwa);
            }
            const Cb = CB();
            if (set.weapon && Cb && Cb.setHand && Cb.setHand("m" + set.weapon.id)) names.unshift(set.weapon.nazwa);
            afterChange();
            return { say: "Zestaw na poziom " + n + ": " + (names.join(", ") || "nic") };
        }
        return { say: "?", bad: true };
    }

    const api = { VERSION: "1.0.0", act, otworz, kup, sprzedaj, napraw, oferta, tabsOf, doRow, bonus, luck, opis, level, lack: id => lackOf(D() && D().przedmiot(id)),
        rangedItem, rangedKind, rangedDef, rangedOwned, hasRanged, anyRanged, owns, isRanged, usedToday, sellPrice, repairPrice,
        buyPrice: (key, id, used) => { const p = D() && D().przedmiot(id); return p ? buyPrice(key, p, used) : 0; },
        menu: (resident, ev) => { const key = SHOP_OF[resident]; return key && shop(key) && ev ? menu(key, resident, ev) : null; }, talkHook, openNow, questFirst, menuRows,
        syncRecipes, wire, wired: () => Object.assign({}, wired), ugExtra, giveUnique, checkUniques, setFor, f9Rows, f9Ok, f9Pick, refresh: dirty, state: () => store(), Scene_BronSklep };
    window.Bron = T.register(PLUGIN, api);
})();
