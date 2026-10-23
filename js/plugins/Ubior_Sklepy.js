//=============================================================================
// Ubior_Sklepy.js
//=============================================================================
// The hero's clothes at work (the data: Ubior_Data.js; the look: Ubior.js; the parts of the body: Equipment.js):
//   - the trade, in the talks of the residents who deal in them (TownLife.addTalkHook, first - a quest's hand-in, offer or remark
//     still comes first, like Ludzie.js's pedlar): Dorota Igła the seamstress, Ignac the tanner and shoemaker, Agata the market woman,
//     Józek Łata the rag-and-bone man of Podgrodzie. Their menu "Pokaż ubrania / Sprzedaj ubrania / Napraw / Ufarbuj / Porozmawiaj"
//     opens the shop's window (Scene_UbiorSklep, Tawerna.ui pieces: the black and yellow look of the game); the greeting by the
//     town's opinion (TownQuests) is said by the shopkeeper before the menu. The kantor (Kantor.js) gets the festive shirt among its
//     goods. Shortages are said in the window itself (it is a menu: no popups there), never by the message window.
//   - the bonuses, through the systems' own doors: Combat.perk wrapped (thirst in the heat - the hat; cold - the felt cap, the kaftan,
//     the woollen trousers; stamina.cost - the headband; gather.cost / farm.cost - the gloves, and on a bush the leather trousers),
//     Combat.carryBonus wrapped (the belts, the bags), the walk (the bast shoes, the black boots - the brown 113 stay Survival's), the
//     bus: "heroRobbed" (the pouch keeps half the money), "townOpinion" (a neat shirt: the opinion's gains grow), "heroHit" (wear).
//     The green jacket is armour like the jacket 171 (Combat_Fight ARMORS).
//   - the wear (Durability.js, unit "wear" = days of work): every point of strength spent wears what is worn a little, every blow that
//     gets through a little more; a worn-out thing tears and is gone (Durability: it leaves the bag, Equipment takes it off).
//     The seamstress mends cloth, the tanner leather, for a few groszy; the leather ones also at the workbench (hide + sinew).
//   - the dyeing: the seamstress turns a white linen shirt yellow or blue (another item - the wear and the wearing kept).
//   - the bast shoes can also be plaited at the workbench (Farming's workbench recipes).
// Nothing works before the items 250+ are in data/Items.json (tools/ubior/instaluj_dane.py): the shopkeepers then talk as before.
// Bus: emits ubiorKupiony { key, id, cost, used }, ubiorSprzedany { key, id, gold }, ubiorNaprawiony { key, id, cost },
// ubiorFarbowany { key, from, to, cost }.

/*:
 * @target MZ
 * @plugindesc Ubiór - handel i działanie: sklepy szwaczki, garbarza, przekupki i szmaciarza w rozmowach (okno sklepu), sprzedaż, naprawa, farbowanie, bonusy ubrań, zużycie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TawernaUI
 * @orderAfter Ubior_Data
 * @orderAfter Equipment
 * @orderAfter Durability
 * @orderAfter Survival
 * @orderAfter Needs
 * @orderAfter Combat
 * @orderAfter TownLife
 * @orderAfter TownQuests
 * @orderAfter Kantor
 *
 * @help
 * ============================================================================
 * Ubior_Sklepy.js - ubrania: sklepy, bonusy, zużycie
 * ============================================================================
 * Sklepy w rozmowach: szwaczka Dorota Igła (koszule, kaftany, czapki,
 * spodnie, płócienna torba; naprawa tkanin, farbowanie koszul), garbarz
 * Ignac (buty, kurty, skórzane spodnie, pasy, rękawice, opaski, skórzana
 * torba; naprawa skór), przekupka Agata (słomkowe kapelusze), szmaciarz
 * Józek Łata w Podgrodziu (chusty, łapcie, co dzień kilka używanych
 * rzeczy; skupuje wszystko, tanio). Każdy odkupuje swój rodzaj za ok. 40%
 * ceny (zużyte - mniej). Kantor: odświętna koszula z haftem.
 * W oknie sklepu: strzałki - wybór, ←→ / Q E - zakładka, O - kup /
 * sprzedaj / napraw / ufarbuj, P - wyjście.
 *
 * Bonusy działają tylko założone (menu P → Ekwipunek). Ubranie zużywa się
 * powoli przy pracy i od ciosów; zniszczone spada z bohatera.
 * F9 (zakładka „Wyspa i fabuła”): Ubiór - daj wszystkie ubrania, +500 G,
 * zdejmij wszystko.
 *
 * Skrypt: Ubior_Sklepy.otworz("szwaczka", "kup"), .kup(klucz, wzor),
 * .sprzedaj(klucz, id), .napraw(klucz, id), .farbuj(klucz, zWzoru, naWzor),
 * .oferta(klucz, zakladka), .bonus("cold"), .udzwig(), .schludnosc()
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Ubior_Sklepy.js: brak TawernaCore.js (the Tawerna core is missing)");
    const PLUGIN = "Ubior_Sklepy";
    if (T.api(PLUGIN)) return;   // (put into the page twice: kept as it was)
    const D = () => T.api("Ubior_Data");
    if (!D()) console.warn("[Ubior_Sklepy] Ubior_Data.js not found - put it above this plugin");

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
    const report = (where, e) => console.error("[Ubior_Sklepy] " + where + ":", e);
    function hash(a, b) {
        let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    const store = T.state.define("ubiorSklepy", () => ({ uzywane: { day: 0, list: [], sold: {} }, opCarry: 0, kupione: 0, sprzedane: 0, naprawione: 0, farbowane: 0 }),
        { version: 1, owner: PLUGIN });

    // ------------------------------------------------------------------
    // What is worn (Equipment.js) - worked out again only when a part changes
    // ------------------------------------------------------------------
    const PARTS = ["head", "torso", "legs", "feet", "belt", "hands", "back"];
    let cache = { key: null, sys: null, list: [] };
    function worn() {
        const e = E(), d = D();
        if (!e || !e.state || !d || !has()) return [];
        const s = e.state();
        if (!s) return [];
        const key = PARTS.map(p => s.slots[p] || 0).join(",");
        if (key !== cache.key || cache.sys !== $gameSystem) cache = { key, sys: $gameSystem, list: d.zalozone() };
        return cache.list;
    }
    const refresh = () => { cache.key = null; };
    // the state of a worn thing: what is left of it (0..1; 1 - it does not wear)
    function condition(id) {
        const du = DU();
        if (!du || !du.TOOLS || !du.TOOLS[id] || !du.lifeOf) return 1;
        return Math.max(0, Math.min(1, du.left(id) / Math.max(1, du.lifeOf(id))));
    }

    // ------------------------------------------------------------------
    // The bonuses
    // ------------------------------------------------------------------
    // the heat for the hat: outdoors, the sun up, summer or a hot / drought day
    function heat() {
        const d = D(), S = T.api("Survival"), O = T.api("Okolice");
        if (!d || !S || !S.isOutdoors || !S.isOutdoors()) return false;
        const h = hour(), dd = day();
        if (h < d.UPAL.od || h >= d.UPAL.do) return false;
        return T.time.season(dd) === d.UPAL.lato || !!(O && ((O.hot && O.hot(dd)) || (O.drought && O.drought(dd))));
    }
    // a bush being cut now: the running event is a bush or a thicket (ChoppableTree)
    function atBush() {
        const it = window.$gameMap && $gameMap._interpreter, ev = it && it.isRunning() ? $gameMap.event(it.eventId()) : null;
        const P = T.api("ChoppableTree_parts"), ob = P && P.objects;
        return !!(ev && ob && ob.bushConfig && ob.bushConfig(ev));
    }
    const WHEN = { upal: heat, krzak: atBush };
    // what the worn clothes add to one of Combat.perk's keys
    function bonus(key) {
        const d = D();
        if (!d || !has()) return 0;
        let sum = 0;
        for (const w of worn()) {
            for (const k of Object.keys(w.p.bonus)) {
                const b = d.BONUSY[k], v = w.p.bonus[k];
                if (!b || typeof v !== "number" || d.STARE[w.id] === k) continue;
                let f = 0;
                if (b.perk === key) f = 1;
                else if (b.perk2 && b.perk2[0] === key) f = b.perk2[1];
                if (!f || (b.kiedy && WHEN[b.kiedy] && !WHEN[b.kiedy]())) continue;
                sum += v * f;
            }
        }
        return sum;
    }
    // a plain bonus summed over what is worn (udzwig, chod, rabunek)
    function total(k) {
        const d = D();
        let sum = 0;
        for (const w of worn()) if (typeof w.p.bonus[k] === "number" && !(d && d.STARE[w.id] === k)) sum += w.p.bonus[k];
        return sum;
    }
    const udzwig = () => (has() ? total("udzwig") : 0);
    const predkosc = () => (has() ? total("chod") : 0);
    // neatness: 0, 1 (a clean linen shirt), 2 (the festive one) - the shirt worn and not torn
    function schludnosc() {
        const d = D();
        if (!d || !has()) return 0;
        let n = 0;
        for (const w of worn()) if (w.p.bonus.schludnosc && condition(w.id) >= d.SCHLUDNOSC.stan) n = Math.max(n, w.p.bonus.schludnosc);
        return n;
    }
    const priceKind = () => { const d = D(), n = schludnosc(); return n && d ? d.SCHLUDNOSC[n].ceny || 0 : 0; };

    // ------------------------------------------------------------------
    // The wear: work (points of strength) and blows
    // ------------------------------------------------------------------
    function wear(n, why) {
        const du = DU();
        if (!du || !du.use || !(n > 0) || !has()) return;
        for (const w of worn().slice()) {
            if (typeof w.p.trwalosc !== "number" || !du.TOOLS || !du.TOOLS[w.id]) continue;   // (armour: by its blows in Combat_Fight; bags: never)
            if (du.use(w.id, n)) refresh();
        }
        if (why === "cios") refresh();
    }

    // ------------------------------------------------------------------
    // Wiring into the other systems (again at the boot, a new game, a load: whatever came later)
    // ------------------------------------------------------------------
    const wired = {};
    function wire() {
        const d = D();
        if (!d) return wired;
        // Combat.perk: every system asks it (Survival cold / stamina.cost, Needs thirst, ChoppableTree gather.cost, Farming farm.cost)
        const CB = T.api("Combat");
        if (CB && typeof CB.perk === "function" && !CB.perk._ubior && !wired.perk) {   // (once: another wrapper put on later hides the flag)
            const orig = CB.perk;
            const wrapped = function(key) { const base = orig.apply(this, arguments); let b = 0; try { b = bonus(key); } catch (e) { report("perk", e); } return b ? base + b : base; };
            wrapped._ubior = true;
            CB.perk = wrapped;
            wired.perk = true;
        }
        // Combat.carryBonus: Survival's load (the belts, the bags)
        if (CB && typeof CB.carryBonus === "function" && !CB.carryBonus._ubior && !wired.carry) {
            const orig = CB.carryBonus;
            const wrapped = function() { return orig.apply(this, arguments) + udzwig(); };
            wrapped._ubior = true;
            CB.carryBonus = wrapped;
            wired.carry = true;
        }
        // Durability: the clothes as "tools" of the unit "wear" (days of work) - or of the blows, like the jacket
        const du = DU();
        if (du && du.TOOLS) {
            for (const p of d.PRZEDMIOTY) {
                if (du.TOOLS[p.id] || p.trwalosc === null || p.trwalosc === undefined) continue;
                const g = p.rodzaj, torn = p.material === "sloma" || p.material === "lyko" ? "się rozpadł" : "się podarł";
                const broke = torn + (g === "f" ? "a" : g === "p" ? "y" : "");
                if (p.trwalosc === "cios") du.TOOLS[p.id] = { life: 60, unit: "block", g, fix: (d.NAPRAWA.warsztat[p.material] || []).slice(), broke, ubior: true };
                else du.TOOLS[p.id] = { life: p.trwalosc, unit: "wear", g, fix: (d.NAPRAWA.warsztat[p.material] || []).slice(), broke, ubior: true };
            }
            wired.durability = true;
        }
        // Combat_Fight's armour: the green jacket like the brown one
        const F = T.api("Combat_parts"), fight = F && F.fight;
        if (fight && fight.ARMORS) for (const p of d.PRZEDMIOTY) if (p.bonus.pancerz && !fight.ARMORS[p.id]) fight.ARMORS[p.id] = { name: p.nazwa, reduce: p.bonus.pancerz };
        // the kantor's goods: the festive shirt (only once it is in the database)
        const KD = window.KantorData;
        if (KD && Array.isArray(KD.GOODS) && d.SKLEPY.kantor) {
            for (const w of d.SKLEPY.kantor.sprzedaje) {
                const p = d.poWzorze(w);
                if (p && item(p.id) && !KD.GOODS.some(g => g.id === p.id)) KD.GOODS.push({ id: p.id, n: 1, price: p.cena });
            }
        }
        // the workbench: the bast shoes plaited of fibre and rope
        const FA = T.api("Farming"), wb = FA && FA.BUILDINGS && FA.BUILDINGS.workbench;
        const lapcie = d.poWzorze("lapcie");
        if (wb && Array.isArray(wb.recipes) && lapcie && item(lapcie.id) && !wb.recipes.some(r => r.id === "ubior_lapcie")) {
            wb.recipes.push({ id: "ubior_lapcie", name: "Upleć łapcie z łyka", inputs: [[92, 4], [93, 1]], output: [lapcie.id, 1], manual: true, hours: 1, stamina: 2,
                startSe: "Hammer", desc: "Pasy włókna splecione w łapcie, podeszwa przeszyta liną. Lekkie, chodzisz trochę szybciej niż boso - ale szybko się rozpadają." });
        }
        // F9 (Debug.js, the tab "Wyspa i fabuła"): the rows through Okolice.f9 - all the clothes, money for the shops, everything off
        const OK = T.api("Okolice");
        if (OK && OK.f9 && OK.f9.add && !wired.f9) {
            OK.f9.add({ owner: PLUGIN, title: "Ubiór (ubrania, sklepy):", rows: f9Rows, ok: f9Ok });
            wired.f9 = true;
        }
        // the talks of the shopkeepers
        const L = TL();
        if (L && L.addTalkHook && !wired.talk) {
            L.addTalkHook((key, ev) => { try { return talkHook(key, ev); } catch (e) { report("talk " + key, e); return null; } }, true);
            wired.talk = true;
        }
        return wired;
    }

    // ---- F9 rows (the user's check of the clothes in the game)
    function f9Rows() {
        const d = D(), p = d && d.poWzorze("koszula_lniana_biala"), icon = p ? p.ikona : COIN_ICON;
        return [
            { owner: PLUGIN, label: "Ubiór: daj wszystkie ubrania", icon, what: "all",
                desc: "Każdy wariant ubrania 250+ po jednej sztuce do torby (te, których nie masz). Na wolne części zakładają się same; resztę zmienisz w menu P → Ekwipunek." },
            { owner: PLUGIN, label: "Ubiór: +500 G", icon: COIN_ICON, what: "gold", desc: "Na test sklepów: szwaczka Dorota, garbarz Ignac, przekupka Agata, szmaciarz Józek (Podgrodzie), kantor." },
            { owner: PLUGIN, label: "Ubiór: zdejmij wszystko (łachman)", icon, what: "off", desc: "Zdejmuje głowę, tors, nogi, stopy, pas, rękawice i plecy - rzeczy zostają w torbie." }
        ];
    }
    function f9Ok(row) {
        const d = D();
        if (!d || !has()) return { say: "Brak Ubior_Data.js", bad: true };
        if (row.what === "gold") { $gameParty.gainGold(500); return { say: "+500 G (masz " + $gameParty.gold() + " G)" }; }
        if (row.what === "off") {
            const e = E();
            let n = 0;
            if (e && e.unequip) for (const part of PARTS) if (e.current(part) && e.unequip(part)) n++;
            refresh();
            return { say: n ? "Zdjęte: " + n + " - bohater w łachmanie" : "Nic nie było założone" };
        }
        if (row.what === "all") {
            const list = d.PRZEDMIOTY.filter(p => p.id >= 250);
            if (!list.some(p => item(p.id))) return { say: "Brak przedmiotów 250+ w bazie (tools/ubior/instaluj_dane.py)", bad: true };
            let n = 0, full = 0;
            for (const p of list) {
                const it = item(p.id);
                if (!it || count(p.id) > 0) continue;
                if (intoBag(it)) n++; else full++;
            }
            afterChange();
            return { say: (n ? "Dane ubrania: " + n : "Masz już wszystkie ubrania") + (full ? " (nie zmieściło się: " + full + ")" : ""), bad: !!full && !n };
        }
        return { say: "?", bad: true };
    }

    // the walk: the bast shoes and the black boots (the brown 113: Survival's own BOOTS_SPEED)
    const _distancePerFrame = Game_CharacterBase.prototype.distancePerFrame;
    Game_CharacterBase.prototype.distancePerFrame = function() {
        const d = _distancePerFrame.call(this);
        if (this !== $gamePlayer) return d;
        const k = predkosc();
        return k ? d * (1 + k) : d;
    };
    // the work: the strength spent wears what is worn
    const _trySpendStamina = Game_System.prototype.trySpendStamina;
    if (typeof _trySpendStamina === "function") {
        Game_System.prototype.trySpendStamina = function(cost) {
            const ok = _trySpendStamina.apply(this, arguments);
            if (ok && cost > 0) { try { const d = D(); if (d) wear(cost * d.ZUZYCIE.praca, "praca"); } catch (e) { report("wear", e); } }
            return ok;
        };
    }
    // the blows that get through
    T.on("heroHit", p => { const d = D(); if (d && p && p.damage > 0) wear(d.ZUZYCIE.cios, "cios"); }, { owner: PLUGIN });
    // the robbery: the pouch under the belt keeps a part of the money taken
    T.on("heroRobbed", p => {
        const k = has() ? total("rabunek") : 0, lost = p && p.gold > 0 ? p.gold : 0, back = Math.floor(lost * Math.min(1, k));
        if (back <= 0) return;
        $gameParty.gainGold(back);
        const w = worn().find(x => x.p.bonus.rabunek);
        T.popup("Sakiewka pod pasem ocalała: +" + back + " G", { icon: w ? w.p.ikona || COIN_ICON : COIN_ICON, kind: "gold" });
    }, { owner: PLUGIN });
    // the opinion: a neat shirt makes every gain a part bigger (the parts gathered until they make a whole point)
    const NEAT_WHY = "Schludny strój";
    T.on("townOpinion", p => {
        if (!p || !(p.change > 0) || p.why === NEAT_WHY || !has()) return;
        const d = D(), n = schludnosc(), q = TQ();
        if (!d || !n || !q || !q.addOpinion) return;
        const s = store();
        s.opCarry = (s.opCarry || 0) + p.change * d.SCHLUDNOSC[n].opinia;
        const whole = Math.floor(s.opCarry + 1e-9);
        if (whole > 0) { s.opCarry -= whole; q.addOpinion(whole, NEAT_WHY); }
    }, { owner: PLUGIN });
    for (const ev of ["newGame", "load"]) T.on(ev, () => { refresh(); wire(); }, { owner: PLUGIN });
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        try { wire(); } catch (e) { report("wire", e); }
    };
    wire();

    // ------------------------------------------------------------------
    // The trade
    // ------------------------------------------------------------------
    const shop = key => { const d = D(); return d && d.SKLEPY[key] && d.SKLEPY[key].godziny ? d.SKLEPY[key] : null; };
    const inHours = (h, w) => h >= w[0] && h < w[1];
    // the rag-and-bone man's used things today: [wzor] (each sold once a day)
    function usedToday(key) {
        const s = shop(key), d = D();
        if (!s || !s.uzywane || !d) return [];
        const st = store(), dd = day();
        if (st.uzywane.day !== dd) {
            const list = s.uzywane.z.filter(w => d.poWzorze(w) && item(d.poWzorze(w).id)).map((w, i) => ({ w, h: hash(dd, i + 31) })).sort((a, b) => a.h - b.h)
                .slice(0, s.uzywane.ile).map(x => x.w);
            st.uzywane = { day: dd, list, sold: {} };
        }
        return st.uzywane.list.filter(w => !st.uzywane.sold[w]);
    }
    // the prices: buying (used: the used price; neat: cheaper), selling (a share of the price by what is left of it; neat: dearer),
    // mending (a share of the price for the wear), dyeing
    function buyPrice(p, used) {   // (used: the shop's "uzywane" - its share of the price)
        return Math.max(1, Math.round(p.cena * (used && used.cena ? used.cena : 1) * (1 - priceKind())));
    }
    function buys(s, p) {
        return !!(p && p.cena && (s.skupuje === true || (Array.isArray(s.skupuje) && s.skupuje.includes(p.material))));
    }
    function sellPrice(key, id) {
        const s = shop(key), d = D(), p = d && d.przedmiot(id);
        if (!s || !buys(s, p)) return 0;
        return Math.max(1, Math.round(p.cena * s.skup * Math.max(0.3, condition(id)) * (1 + priceKind())));
    }
    function mends(key, p) {
        const d = D(), list = d && d.NAPRAWA[key];
        return !!(p && Array.isArray(list) && list.includes(p.material));
    }
    function repairPrice(id) {
        const d = D(), p = d && d.przedmiot(id), du = DU();
        if (!p || !du || !du.TOOLS || !du.TOOLS[id]) return 0;
        const worn01 = Math.min(1, du.used(id) / Math.max(1, du.lifeOf(id)));
        return Math.max(d.NAPRAWA.min, Math.round((p.cena || 10) * d.NAPRAWA.cena * worn01));
    }
    function dyePrice(key, from, to) {
        const d = D(), t = d && d.FARBOWANIE[key] && d.FARBOWANIE[key][from];
        return t && t[to] ? Math.max(1, Math.round(t[to] * (1 - priceKind()))) : 0;
    }
    const fail = why => ({ ok: false, why });
    // a thing into the bag (false: no room - the stack or the load full)
    function intoBag(it) {
        const before = $gameParty.numItems(it);
        if (before >= $gameParty.maxItems(it)) return false;
        $gameParty.gainItem(it, 1);
        return $gameParty.numItems(it) > before;
    }
    const setUsed = (id, n) => { const du = DU(); if (du && du.setUsed) du.setUsed(id, n); };
    function afterChange() { refresh(); const e = E(); if (e && e.ensure) e.ensure(); }

    function kup(key, wzor, used) {
        const s = shop(key), d = D(), p = d && d.poWzorze(wzor), it = p && item(p.id);
        if (!s || !p || !it) return fail("Tego tu nie ma.");
        if (used ? !s.uzywane || !usedToday(key).includes(wzor) : !s.sprzedaje.includes(wzor)) return fail("Tego tu nie ma.");
        const cost = buyPrice(p, used ? s.uzywane : null);
        if ($gameParty.gold() < cost) return fail("Potrzebujesz " + cost + " G");
        const had = count(p.id);
        if (!intoBag(it)) return fail("Nie uniesiesz więcej");
        $gameParty.loseGold(cost);
        const du = DU();
        if (!had && du && du.TOOLS && du.TOOLS[p.id]) setUsed(p.id, used ? du.lifeOf(p.id) * s.uzywane.zuzycie : 0);
        if (used) store().uzywane.sold[wzor] = true;
        store().kupione++;
        afterChange();
        const on = !!(E() && E().worn && E().worn(p.id));
        T.emit("ubiorKupiony", { key, id: p.id, cost, used: !!used });
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
        T.emit("ubiorSprzedany", { key, id, gold });
        return { ok: true, gold, text: "Sprzedane: " + p.nazwa + " +" + gold + " G" };
    }
    function napraw(key, id) {
        id = Number(id);
        const s = shop(key), d = D(), p = d && d.przedmiot(id), du = DU();
        if (!s || !p || !mends(key, p) || !du || !du.TOOLS || !du.TOOLS[id]) return fail("Tego tu nie naprawią.");
        if (count(id) <= 0) return fail("Nie masz tego.");
        if (!(du.used(id) > 0)) return fail("To jest całe.");
        const cost = repairPrice(id);
        if ($gameParty.gold() < cost) return fail("Potrzebujesz " + cost + " G");
        $gameParty.loseGold(cost);
        du.repair(id);
        store().naprawione++;
        refresh();
        T.emit("ubiorNaprawiony", { key, id, cost });
        return { ok: true, cost, text: "Naprawione: " + p.nazwa };
    }
    function farbuj(key, from, to) {
        const d = D(), a = d && d.poWzorze(from), b = d && d.poWzorze(to), cost = dyePrice(key, from, to);
        if (!shop(key) || !a || !b || !cost || !item(a.id) || !item(b.id)) return fail("Tego tu nie ufarbują.");
        if (count(a.id) <= 0) return fail("Nie masz tego.");
        if ($gameParty.gold() < cost) return fail("Potrzebujesz " + cost + " G");
        const e = E(), du = DU(), wasOn = !!(e && e.worn && e.worn(a.id)), had = count(b.id), usedA = du && du.used ? du.used(a.id) : 0;
        if (!intoBag(item(b.id))) return fail("Nie uniesiesz więcej");
        $gameParty.loseItem(item(a.id), 1, false);
        $gameParty.loseGold(cost);
        if (!had) setUsed(b.id, usedA);
        if (count(a.id) <= 0) setUsed(a.id, 0);
        afterChange();
        if (wasOn && e && e.equip && d.MIEJSCA[b.miejsce]) e.equip(d.MIEJSCA[b.miejsce].eq, b.id);
        refresh();
        store().farbowane++;
        T.emit("ubiorFarbowany", { key, from: a.id, to: b.id, cost });
        return { ok: true, cost, text: "Ufarbowane: " + b.nazwa };
    }

    // ------------------------------------------------------------------
    // The offer of a tab: the rows of the window (and the tests)
    // ------------------------------------------------------------------
    const TABS = ["kup", "sprzedaj", "napraw", "farbuj"];
    function tabsOf(key) {
        const s = shop(key), d = D();
        if (!s) return [];
        return TABS.filter(t => t === "kup" || t === "sprzedaj" || (t === "napraw" && s.naprawia) || (t === "farbuj" && s.farbuje && d.FARBOWANIE[key]));
    }
    function oferta(key, tab) {
        const s = shop(key), d = D(), out = [];
        if (!s || !d || !has()) return out;
        const gold = $gameParty.gold();
        if (tab === "kup") {
            for (const w of s.sprzedaje) {
                const p = d.poWzorze(w);
                if (!p || !item(p.id)) continue;
                const cost = buyPrice(p, null);
                out.push({ act: "kup", wzor: w, id: p.id, p, cost, used: false, name: p.nazwa, short: gold < cost });
            }
            for (const w of usedToday(key)) {
                const p = d.poWzorze(w), cost = buyPrice(p, s.uzywane);
                out.push({ act: "kup", wzor: w, id: p.id, p, cost, used: true, name: p.nazwa + " (" + d.TEKSTY.uzywane + ")", short: gold < cost });
            }
        } else if (tab === "sprzedaj") {
            for (const p of d.PRZEDMIOTY) {
                if (!item(p.id) || count(p.id) <= 0 || !buys(s, p)) continue;
                const on = !!(E() && E().worn && E().worn(p.id));
                out.push({ act: "sprzedaj", id: p.id, p, gold: sellPrice(key, p.id), n: count(p.id), on, name: p.nazwa + (count(p.id) > 1 ? " ×" + count(p.id) : "") + (on && count(p.id) === 1 ? " · założone" : "") });
            }
        } else if (tab === "napraw") {
            const du = DU();
            for (const p of d.PRZEDMIOTY) {
                if (!item(p.id) || count(p.id) <= 0 || !mends(key, p) || !du || !du.TOOLS || !du.TOOLS[p.id] || !(du.used(p.id) > 0)) continue;
                const cost = repairPrice(p.id);
                out.push({ act: "napraw", id: p.id, p, cost, short: gold < cost, name: p.nazwa + "  " + du.left(p.id) + "/" + du.lifeOf(p.id) });
            }
        } else if (tab === "farbuj") {
            const f = d.FARBOWANIE[key] || {};
            for (const from of Object.keys(f)) {
                const a = d.poWzorze(from);
                if (!a || !item(a.id) || count(a.id) <= 0) continue;
                for (const to of Object.keys(f[from])) {
                    const b = d.poWzorze(to);
                    if (!b || !item(b.id)) continue;
                    const cost = dyePrice(key, from, to);
                    out.push({ act: "farbuj", from, to, id: a.id, p: a, target: b, cost, short: gold < cost, name: a.nazwa + " → " + b.nazwa.split(" ")[0].toLowerCase() });
                }
            }
        }
        return out;
    }
    function doRow(key, r) {
        if (!r) return fail("");
        if (r.act === "kup") return kup(key, r.wzor, r.used);
        if (r.act === "sprzedaj") return sprzedaj(key, r.id);
        if (r.act === "napraw") return napraw(key, r.id);
        if (r.act === "farbuj") return farbuj(key, r.from, r.to);
        return fail("");
    }

    // ------------------------------------------------------------------
    // The talk: the shopkeeper's menu (first - after a quest's hand-in, offer or remark)
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
    const cmdAct = args => [C(355, ["Ubior_Sklepy.act(this, " + JSON.stringify(args) + ")"])];
    // the quests speak first: a remark, a ready hand-in, an offer (as Ludzie.js's questFirst)
    function questFirst(key) {
        const q = TQ();
        if (!q) return false;
        try {
            if (q.remarkFor && q.remarkFor(key)) return true;
            if (q.talkFor && q.talkFor(key, true)) return true;
            if ((q.QUESTS || []).some(x => x.giver === key && x.offer && q.offerable && q.offerable(x.id))) return true;
        } catch (e) { /* (the quests speak through TownQuests) */ }
        return false;
    }
    // the other first talks of the same people: Józek's clue of W12 (Wrak.js) comes before his stall
    const YIELD = {
        szmaciarz: () => { const W = T.api("Wrak"), s = W && W.state ? W.state() : null; return !!(s && s.met && !(s.clues || {}).jozek && !s.w12); }
    };
    const open = key => { const s = shop(key); return !!s && inHours(hour(), s.godziny) && s.sprzedaje.some(w => { const p = D().poWzorze(w); return p && item(p.id); }); };
    // the greeting of the day by the town's opinion (TownQuests' own: said here, before the menu); null: greeted already today
    function greeting(key) {
        const q = TQ(), st = q && q.state ? q.state() : null, G = window.TownQuestsData && TownQuestsData.GREET;
        if (!st || !G || !st.greeted || st.greeted[key] === day()) return null;
        st.greeted[key] = day();
        const tier = Math.min(4, (q.tier ? q.tier() : 0) + (schludnosc() >= 2 ? 1 : 0)), mine = G[key] && G[key][tier];
        return pick(mine && mine.length ? mine : G.any[tier]);
    }
    // (2026-10-23) other trades of the same shopkeeper, as lines of this menu before "Porozmawiaj" (Bron.js: the leather armour, the
    // padded jacks, the old weapons): Ubior_Sklepy.addMenu(fn(key, ev) -> [{ label, cmds }])
    const extraMenus = [];
    const addMenu = fn => { if (typeof fn === "function" && !extraMenus.includes(fn)) extraMenus.push(fn); };
    function menu(key, ev) {
        const s = shop(key), d = D(), spk = { id: ev.eventId(), name: s.kto }, out = [];
        const g = greeting(key);
        sayTo(out, spk, (g ? g + " " : "") + pick(s.teksty.witaj));
        const M = d.TEKSTY.menu, labels = [], branches = [];
        for (const t of tabsOf(key)) { labels.push(M[t]); branches.push(cmdAct(["otworz", key, t])); }
        for (const fn of extraMenus) {
            let rows = null;
            try { rows = fn(key, ev); } catch (e) { report("menu " + key, e); }
            for (const r of rows || []) if (r && r.label) { labels.push(r.label); branches.push(r.cmds || []); }
        }
        labels.push(M.rozmowa, M.nic);
        branches.push(cmdAct(["rozmowa", key]), []);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    function talkHook(key, ev) {
        if (!has() || !shop(key) || !ev || !open(key)) return null;
        if (questFirst(key) || (YIELD[key] && YIELD[key]())) return null;
        return menu(key, ev);
    }
    // "Porozmawiaj": the quests' talk of the resident (a reminder, an offer), else one of its usual lines
    function plainTalk(key, interp) {
        const q = TQ(), L = TL(), ev = interp && $gameMap.event(interp.eventId()), s = shop(key);
        let list = null;
        try { list = q && q.talkFor ? q.talkFor(key) : null; } catch (e) { list = null; }
        if (!list || !list.length) {
            const t = L && L.lines ? L.lines(key) : null, h = hour();
            const slot = h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
            const lines = t ? t[slot] || t.day || [] : [];
            list = lines.length ? sayTo([], { id: ev ? ev.eventId() : 0, name: s ? s.kto : "" }, pick(lines)) : [];
        }
        if (interp && list.length) interp.setupChild(list.concat([C(0, [])]), interp.eventId());
    }
    // the events' script: Ubior_Sklepy.act(this, [what, key, tab])
    function act(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        try {
            const [what, key, tab] = args;
            if (what === "otworz") otworz(key, tab, interp ? interp.eventId() : 0);
            else if (what === "rozmowa") plainTalk(key, interp);
        } catch (e) { report("act", e); }
    }

    // ------------------------------------------------------------------
    // The shop's window
    // ------------------------------------------------------------------
    let bye = null;   // the shopkeeper's last word, said over his head back on the map
    function otworz(key, tab, eventId) {
        if (!shop(key) || !T.ui || !T.ui.IconList) return false;
        SceneManager.push(Scene_UbiorSklep);
        SceneManager.prepareNextScene(key, tab || "kup", eventId || 0);
        return true;
    }
    T.onMapUpdate(() => {
        if (!bye || $gameMap.isEventRunning()) return;
        const b = bye;
        bye = null;
        const L = TL();
        if (L && L.say) L.say(b.key, b.text);
    }, { owner: PLUGIN, name: "bye" });

    class Scene_UbiorSklep extends Scene_MenuBase {
        prepare(key, tab, eventId) {
            this._key = key;
            this._tab = tab;
            this._eventId = eventId || 0;
        }
        needsCancelButton() { return false; }
        create() {
            super.create();
            const ui = T.ui, W = Graphics.width, H = Graphics.height;
            this._key = this._key || "szwaczka";
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
            if (s && s.teksty && s.teksty.zegnaj) bye = { key: this._key, text: pick(s.teksty.zegnaj) };
            Input.clear();
            TouchInput.clear();
        }
        rows() { return this._rows || []; }
        rebuild(index) {
            const d = D();
            this._rows = oferta(this._key, this._tab);
            const items = this._rows.map(r => ({ icon: r.p.ikona || (item(r.id) ? item(r.id).iconIndex : 0), text: r.name,
                right: r.act === "sprzedaj" ? "+" + r.gold + " G" : r.cost + " G", color: r.short ? "#8a9099" : undefined }));
            if (!items.length) items.push({ icon: 0, text: d.TEKSTY.pusto[this._tab], disabled: true });
            this._list.set(items, Math.min(index || 0, Math.max(0, items.length - 1)));
            this.drawTitle();
            this.drawTabs();
            this.drawInfo();
            this.drawKeys();
        }
        current() { return this.rows()[this._list.index] || null; }
        drawTitle() {
            const s = shop(this._key), d = D();
            this._title.set(s.kto, s.tytul + "  ·  " + d.TEKSTY.zakladki[this._tab], $gameParty.gold() + " G", COIN_ICON);
        }
        drawTabs() {
            const ui = T.ui, b = this._tabBar.bitmap, d = D();
            b.clear();
            this._tabRects = [];
            let x = 0;
            for (const t of this._tabs) {
                const w = 170;
                ui.button(b, x, 2, w, 34, d.TEKSTY.zakladki[t], { focus: t === this._tab, small: true });
                this._tabRects.push({ t, x: this._tabBar.x + x, y: this._tabBar.y, w, h: 38 });
                x += w + 10;
            }
        }
        drawKeys() {
            const verb = { kup: "kup", sprzedaj: "sprzedaj", napraw: "napraw", farbuj: "ufarbuj" }[this._tab];
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
                ui.text(b, d.TEKSTY.pusto[this._tab], x, y, W - 44, { size: 20, color: S.muted });
                this.drawMsg(b);
                return;
            }
            const p = r.p, du = DU();
            const shown = r.act === "farbuj" ? r.target : p;   // (dyeing: the thing as it will be)
            ui.icon(b, shown.ikona || (item(shown.id) ? item(shown.id).iconIndex : 0), x, y, 64);
            ui.text(b, shown.nazwa, x + 80, y + 2, W - x - 100, { size: 24, color: S.accent, bold: true });
            const m = d.MIEJSCA[p.miejsce], mat = d.MATERIALY[p.material] || "";
            ui.text(b, (m ? m.nazwa : "") + (mat ? "  ·  " + mat : "") + (p.waga ? "  ·  waga " + p.waga : ""), x + 80, y + 36, W - x - 100, { size: 17, color: S.muted });
            y += 84;
            // the colours of the thing (the ramp of its look) - for dyeing: before and after
            const ramp = w => (d.WZORY[w] && d.WZORY[w].rampa) || [];
            const swatch = (list, sx, sy) => { list.forEach((c, i) => { b.fillRect(sx + i * 22, sy, 20, 18, "#000000"); b.fillRect(sx + i * 22 + 1, sy + 1, 18, 16, c); }); };
            if (r.act === "farbuj") {
                swatch(ramp(r.from), x, y);
                ui.text(b, "→", x + 6 * 22 + 6, y - 6, 30, { size: 22, color: S.accent, bold: true });
                swatch(ramp(r.to), x + 6 * 22 + 34, y);
            } else swatch(ramp(p.wzor), x, y);
            y += 34;
            // what it gives
            const words = d.opis(shown.id) || "Nic więcej - ładnie wygląda.";
            for (const line of ui.wrap(b, words.charAt(0).toUpperCase() + words.slice(1), W - 2 * x, 19).slice(0, 3)) {
                ui.text(b, line, x, y, W - 2 * x, { size: 19, color: S.text });
                y += 26;
            }
            y += 6;
            // how long it lasts, how many there are
            const life = du && du.TOOLS && du.TOOLS[p.id] && du.lifeOf ? du.lifeOf(p.id) : 0, unit = n => (du && du.unitWord && du.TOOLS[p.id] ? du.unitWord(p.id, n) : "");
            let lasts = p.trwalosc === null ? "nie zużywa się" : p.trwalosc === "cios" ? "zużywa się od ciosów (" + (life || 60) + ")" : "wystarczy na ok. " + (life || p.trwalosc) + " " + (unit(life || p.trwalosc) || "dni pracy");
            if (count(p.id) > 0 && life && r.act !== "kup") lasts = "zostało " + du.left(p.id) + " z " + life + (unit(life) ? " " + unit(life) : "");
            if (r.act === "kup" && r.used) lasts = "używane: zostało ok. połowy";
            ui.text(b, "Trwałość: " + lasts, x, y, W - 2 * x, { size: 18, color: S.muted });
            y += 26;
            const n = count(p.id), on = n > 0 && E() && E().worn && E().worn(p.id);
            const had = r.act === "farbuj" ? "Farbujesz: " + p.nazwa + (on ? " (założona)" : "") : n > 0 ? "Masz: " + n + (on ? " · założone" : " · w plecaku") : "Nie masz.";
            ui.text(b, had, x, y, W - 2 * x, { size: 18, color: S.muted });
            y += 34;
            // the price of what O does now
            const price = r.act === "kup" ? "Cena: " + r.cost + " G" : r.act === "sprzedaj" ? "Dostaniesz: " + r.gold + " G" + (r.on && r.n === 1 ? " (zdejmiesz je)" : "")
                : r.act === "napraw" ? "Naprawa: " + r.cost + " G - wróci do pełna" : "Farbowanie: " + r.cost + " G";
            ui.text(b, price, x, y, W - 2 * x, { size: 22, color: r.short ? ui.COLORS.bad : ui.COLORS.gold, bold: true });
            y += 36;
            if (priceKind() && (r.act === "kup" || r.act === "sprzedaj")) ui.text(b, "Odświętna koszula: kramarz traktuje cię lepiej.", x, y, W - 2 * x, { size: 16, color: ui.COLORS.good });
            // the item's own words
            const di = item(shown.id), desc = di ? String(di.description || "").replace(/\n/g, " ") : "";
            const lines = desc ? ui.wrap(b, desc, W - 2 * x, 16).slice(0, 3) : [];
            lines.forEach((l, i) => ui.text(b, l, x, b.height - 58 - (lines.length - i) * 22, W - 2 * x, { size: 16, color: S.muted }));
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
        // ---- input
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
            const res = doRow(this._key, r);
            const s = shop(this._key);
            if (!res.ok) { SoundManager.playBuzzer(); this.say(res.why, false); return; }
            T.audio.se(r.act === "sprzedaj" ? "Coin" : r.act === "kup" ? "Shop1" : r.act === "napraw" ? "Hammer" : "Water1", { volume: 70 });
            const said = s.teksty && s.teksty[{ kup: "kupione", sprzedaj: "sprzedane", napraw: "naprawione", farbuj: "farbowane" }[r.act]];
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

    const api = { VERSION: "1.0.0", act, otworz, kup, sprzedaj, napraw, farbuj, oferta, tabsOf, doRow, bonus, udzwig, predkosc, schludnosc, heat, worn: () => worn().map(w => w.id),
        refresh, wire, wired: () => Object.assign({}, wired), usedToday, sellPrice, buyPrice: (key, wzor, used) => { const p = D() && D().poWzorze(wzor), s = shop(key); return p ? buyPrice(p, used && s ? s.uzywane : null) : 0; },
        repairPrice, dyePrice, f9Rows, f9Ok, menu: (key, ev) => (shop(key) && ev ? menu(key, ev) : null), talkHook, open, state: () => store(), Scene_UbiorSklep, addMenu };
    window.Ubior_Sklepy = T.register(PLUGIN, api);
})();
