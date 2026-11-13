//=============================================================================
// Stajnia.js
//=============================================================================
// The stable of the inn in Kruczogród (Map181 "Stajnia z wozownią"), docs/STORY.md "Wezwanie króla (wariant A)": the carter Szczepan
// Kołodziej (TownLife "kolodziej", event 2940) keeps it. Here is everything about it except the shift's scene (Stajnia_Zmiana.js):
//  - Szczepan's talk (a takeover of the core's talk service, docs/ROZMOWY.md): with grandpa's letter (Story.wezwanie().letter) he
//    takes the hero in (the story's step "stajnia"), without it (an old save, a game without the story) he rents the loft and gives
//    work all the same; a menu: "Chcę wziąć zmianę" / "Co z noclegiem?" (+ other systems' options);
//  - the hay loft (injected events 3250-3259, only on Map181; "Miejsce: stryszek" on the map moves it, "Miejsce: stajnia_zmiana"
//    puts the shift's board there): a night's sleep like the tent's / the forest bed's (stamina 0.8 of the maximum, no weather
//    penalty, indoors, no night raids in the town); free on a day the hero worked in the stable, else 5 G (a popup when he has not);
//  - the shift's rules (the morning, once a day, stamina), its pay and the trust that grows with the shifts (4 levels); the pay is
//    applied by applyResult (the scene calls it when it leaves); at the top trust Szczepan's cart rides are free (Woz.js asks
//    Stajnia.freeRide()).
// Saved: Tawerna.state("stajnia") only. Texts: js/teksty/stajnia.txt. Shortfalls (money, strength) are popups, never windows.

/*:
 * @target MZ
 * @plugindesc Stajnia zajazdu w Kruczogrodzie: rozmowa Szczepana Kołodzieja (list od dziadka), stryszek z sianem (nocleg), zasady zmiany w stajni, zaufanie i darmowy wóz. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TownLife
 * @orderAfter Woz
 *
 * @help
 * ============================================================================
 * Stajnia.js - stajnia zajazdu
 * ============================================================================
 * Szczepan Kołodziej (woźnica, TownLife "kolodziej") trzyma stajnię przy
 * zajeździe. Z listem od dziadka przyjmuje bohatera na stryszek; bez listu
 * (stara gra) wynajmuje stryszek za 5 G. Stryszek z sianem w stajni
 * (Map181): "Prześpij noc" - za darmo, gdy tego dnia była zmiana w stajni,
 * inaczej 5 G. Zmiana w stajni: rano (5-13), raz dziennie, mini-gra
 * Stajnia_Zmiana.js (obrządek, karmienie i pojenie, gnój i słoma, konie
 * podróżnych). Zaufanie Szczepana rośnie ze zmianami; na najwyższym
 * poziomie jego wóz (Woz.js) jeździ za darmo.
 *
 * API: Stajnia.state(), trustLevel(), freeRide(), canShift(), startShift(),
 * price(), loft(interp), sleep(interp). Zdarzenia: "Miejsce: stryszek",
 * "Miejsce: stajnia_zmiana" (Map181) przesuwają stryszek i tablicę zmian.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Stajnia.js: brak TawernaCore.js (the Tawerna core is missing)");
    const PLUGIN = "Stajnia";
    if (T.api(PLUGIN)) return;
    const TK = window.Watki && Watki.teksty ? Watki.teksty("stajnia") : {};
    const wstaw = (t, v) => (window.Watki && Watki.wstaw ? Watki.wstaw(String(t || ""), v) : String(t || ""));
    const get = key => { let o = TK; for (const p of String(key).split(".")) { if (!o || typeof o !== "object") return undefined; o = o[p]; } return o; };
    const word = (key, v) => { const t = get(key); return typeof t === "string" ? wstaw(t, v) : ""; };
    const list = key => { const t = get(key); return Array.isArray(t) ? t : typeof t === "string" ? [t] : []; };

    const MAP = 181;                   // "Stajnia z wozownią"
    const WHO = "kolodziej";           // his TownLife key (event 2940)
    const IDS = { loft: 3250, board: 3251 };
    const LOFT_AT = [13, 3];           // where the loft's ladder stands when the map has no "Miejsce: stryszek"
    const PRICE = 5;                   // G a night when no shift was done today
    const RESTORE = 0.8;               // of the maximum stamina (the forest bed 0.6, a bed 1.0)
    const SHIFT_FROM = 5, SHIFT_TO = 13;   // the hours a shift can be taken
    const MIN_STAMINA = 15;
    const SLEEP_FROM = 17, SLEEP_TO = 5;   // the hours the loft takes a sleeper
    const TRUST_AT = [0, 2, 5, 9];     // trust points for the levels 0-3 (a shift gives 1, a grade 4-5 shift 2)
    const FREE_RIDE_LEVEL = 3;

    // ------------------------------------------------------------------ the saved state (its own key)
    const store = T.state.define("stajnia", () => ({ met: false, taken: false, shifts: 0, trust: 0, best: 0, earned: 0, shiftDay: 0, last: null, nights: 0, paid: 0, greet: 0 }),
        { version: 1, owner: PLUGIN });
    const hour = () => T.time.hour();
    // the day a night belongs to: after midnight (before 5:00) it is still yesterday's
    const workDay = () => T.time.day() - (hour() < 5 ? 1 : 0);
    const trustLevel = () => { const t = store().trust; let l = 0; for (let i = 0; i < TRUST_AT.length; i++) if (t >= TRUST_AT[i]) l = i; return l; };
    const freeRide = () => !!window.$gameSystem && trustLevel() >= FREE_RIDE_LEVEL;
    const worked = () => store().shiftDay === workDay();
    const price = () => (worked() ? 0 : PRICE);
    // the story's summons (null: none - an old save, no story); asked defensively, Story.wezwanie may not exist yet
    function wezwanie() {
        try { return T.call("Story", "wezwanie") || null; } catch (e) { return null; }
    }
    const popup = (text, kind) => T.popup(text, { kind: kind || "need" });

    // ------------------------------------------------------------------ the shift's rules
    // null when a shift can be taken now, else { kind: "rano" | "zrobione" | "zmeczony", text }
    function canShift() {
        const h = hour();
        if (h < SHIFT_FROM || h >= SHIFT_TO) return { kind: "rano", text: word("odmowa.rano", { od: SHIFT_FROM, do: SHIFT_TO }) };
        if (worked()) return { kind: "zrobione", text: word("odmowa.zrobione") };
        const st = window.$gameSystem && typeof $gameSystem.stamina === "function" ? $gameSystem.stamina() : 100;
        if (st < MIN_STAMINA) return { kind: "zmeczony", text: word("odmowa.zmeczony") };
        return null;
    }
    // starts the scene (Stajnia_Zmiana.js); the pay etc. is applyResult's, called by the scene when it leaves
    function startShift(opts) {
        const Z = T.api("Stajnia_Zmiana");
        if (!Z || typeof Z.start !== "function") return false;
        const o = Object.assign({}, opts);
        const onEnd = o.onEnd;
        o.onEnd = r => {
            try { afterShift(r); } catch (e) { console.error("[Stajnia] afterShift:", e); }
            if (typeof onEnd === "function") onEnd(r);
        };
        return Z.start(o);
    }
    // the shift's result, when it leaves the scene: the pay, the hours, the stamina, the day, the trust
    function applyResult(res) {
        const s = store(), before = trustLevel();
        if (res.total > 0) $gameParty.gainGold(res.total);
        if (res.hours > 0 && typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(res.hours);
        if (res.stamina > 0 && typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(-res.stamina);
        s.last = { pay: res.pay, tips: res.tips, total: res.total, grade: res.grade, score: res.score, aborted: !!res.aborted, day: T.time.day() };
        s.best = Math.max(s.best || 0, res.grade || 0);
        s.earned = (s.earned || 0) + (res.total || 0);
        if (!res.aborted) {
            s.shifts++;
            s.trust += 1 + (res.grade >= 4 ? 1 : 0);
            s.shiftDay = T.time.day();   // (the shift ends in the same morning it began)
            T.emit("stajniaShift", { grade: res.grade, pay: res.pay, tips: res.tips, total: res.total, shift: s.shifts, trust: s.trust, level: trustLevel() });
        }
        res.trustBefore = before;
        res.trustLevel = trustLevel();
        res.trust = s.trust;
    }
    let lastNews = null;
    function afterShift(res) {
        lastNews = null;
        if (!res || res.aborted) return;
        if (res.trustLevel > res.trustBefore) {
            lastNews = word("zaufanie.poziom." + res.trustLevel);
            if (lastNews) popup(lastNews, "good");
        }
    }

    // ------------------------------------------------------------------ the talk (commands of the interpreter)
    const C = (code, params, indent) => ({ code, indent: indent || 0, parameters: params });
    function wrapText(text, max) {
        const rows = [];
        let line = "";
        for (const w of String(text).split(/\s+/)) { if (line && (line + " " + w).length > max) { rows.push(line); line = w; } else line = line ? line + " " + w : w; }
        if (line) rows.push(line);
        return rows;
    }
    // lines -> message windows (46 characters, 3 rows each); "> " at the start: the hero, else the speaker (event id); "" for a narrator
    function messages(out, lines, id, name) {
        for (const raw of lines) {
            const hero = /^>\s*/.test(raw), text = raw.replace(/^>\s*/, ""), spk = hero ? 0 : id;
            const rows = wrapText(text, 46);
            for (let i = 0; i < rows.length; i += 3) {
                out.push(C(101, ["", 0, 0, 2, hero ? "" : name === undefined ? "Szczepan" : name]));
                rows.slice(i, i + 3).forEach((l, j) => out.push(C(401, [(j === 0 && spk !== null ? "\\SPK[" + spk + "]" : "") + l])));
            }
        }
        return out;
    }
    const answer = (interp, list) => { if (interp && list.length) interp.setupChild(list.concat([C(0, [])]), interp.eventId()); };
    function talkList(ctx) {
        const s = store(), w = wezwanie(), id = ctx.eventId, out = [];
        if (w && w.letter && !s.taken) {
            messages(out, list("rozmowa.list"), id);
            out.push(C(355, ["Stajnia.accept(this);"]));
        } else if (!s.met) {
            messages(out, list("rozmowa.pierwsza"), id);
            out.push(C(355, ["Stajnia.meet(this);"]));
        } else if (worked()) {
            messages(out, [list("rozmowa.dzis")[s.greet++ % Math.max(1, list("rozmowa.dzis").length)] || ""].filter(Boolean), id);
        } else {
            const l = list("rozmowa.znow");
            if (l.length) messages(out, [l[s.greet++ % l.length]], id);
        }
        const own = [
            { label: word("menu.zmiana"), cmds: [C(355, ["Stajnia.offer(this);"])], order: 100 },
            { label: word("menu.nocleg"), cmds: [C(355, ["Stajnia.lodging(this);"])], order: 110 }
        ];
        T.talk.menu(out, T.talk.rows(WHO, ctx, own), word("menu.bywaj"));
        return out;
    }
    T.talk.takeover({ owner: PLUGIN, who: WHO, priority: 480, run: ctx => talkList(ctx) });   // (under the quests, over the shops and the greeting)

    // the scripts of the talk's branches
    function meet() { store().met = true; }
    function accept(interp) {
        const s = store();
        s.met = true;
        s.taken = true;
        T.call("Story", "step", "stajnia");
        T.emit("stajniaTaken", {});
        popup(word("popup.przyjety"), "good");
    }
    function offer(interp) {
        const why = canShift(), id = interp.eventId(), out = [];
        if (why) {
            if (why.kind === "zmeczony") popup(word("popup.zmeczony"));
            messages(out, [why.text], id);
        } else {
            messages(out, list("oferta"), id);
            out.push(C(355, ["Stajnia.begin(this);"]));
        }
        answer(interp, out);
    }
    function lodging(interp) {
        const s = store(), out = [], id = interp.eventId(), w = wezwanie();
        messages(out, list(s.taken || (w && w.letter) ? "nocleg.list" : "nocleg.bez"), id);
        messages(out, [word(worked() ? "nocleg.darmo" : "nocleg.platny", { cena: PRICE })], id);
        const tl = list("zaufanie.opis")[trustLevel()];
        if (tl) messages(out, [wstaw(tl, { punkty: s.trust })], id);
        answer(interp, out);
    }
    // the board (or the talk's offer) -> the scene
    function begin(interp) {
        const why = canShift();
        if (why) { popup(why.text); return false; }
        if (!startShift({})) { popup(word("popup.brak_sceny")); return false; }
        return true;
    }
    // the shift's board in the stable ("Miejsce: stajnia_zmiana"): the same offer without Szczepan
    function board(interp) {
        const out = [];
        messages(out, [word("tablica.pytanie")], null, "");
        T.talk.choice(out, [word("tablica.tak"), word("tablica.nie")], [[C(355, ["Stajnia.offer(this);"])], []], 1);
        answer(interp, out);
    }

    // ------------------------------------------------------------------ the hay loft: a night's sleep
    const wakeHour = () => { const p = PluginManager.parameters("SurvivalHUD"); const v = Number(p && p.wakeHour); return isFinite(v) && v > 0 ? v : 7; };
    function loft(interp) {
        const s = store(), out = [], p = price();
        if (!s.met) { popup(word("popup.pytaj")); return; }
        messages(out, [word("loft.pytanie")], null, "");
        messages(out, [p ? word("loft.cena.platna", { cena: p }) : word("loft.cena.darmo")], null, "");
        T.talk.choice(out, [word("loft.tak"), word("loft.nie")], [[C(355, ["Stajnia.sleep(this);"])], []], 1);
        answer(interp, out);
    }
    // the commands of the night: the screen dark, the new day, the screen light, the greeting (the core's "wake" after sleepUntilHour:
    // Journal's day summary and Atmosphere's autosave)
    function sleep(interp) {
        const h = hour();
        if (typeof $gameSystem.sleepUntilHour !== "function") { popup(word("popup.nie_spac")); return false; }
        if (!(h >= SLEEP_FROM || h < SLEEP_TO)) { popup(word("popup.za_wczesnie"), "info"); return false; }
        const danger = T.call("Farming", "restDanger");
        if (danger) { popup(word("popup.zagrozenie", { kto: danger })); return false; }
        const p = price();
        if (p > 0 && $gameParty.gold() < p) { popup(word("popup.brak_zlota", { cena: p, brak: p - $gameParty.gold() })); return false; }
        if (p > 0) {
            $gameParty.loseGold(p);
            store().paid += p;
            popup(word("popup.zaplacono", { cena: p }), "gold");
        }
        pendingFree = p === 0;
        const cmds = [C(221, []), C(230, [45]), C(355, ["Stajnia.wake(this);"]), C(222, []), C(230, [40]), C(355, ["Stajnia.morning(this);"]), C(0, [])];
        if (interp) interp.setupChild(cmds, interp.eventId());
        else $gameMap._interpreter.setup(cmds, 0);
        return true;
    }
    let pendingFree = false;
    function wake() {
        const perk = T.call("Combat", "perk", "sleep.rest") || 0, restore = Math.min(1, RESTORE * (1 + perk));
        AudioManager.playMe({ name: (PluginManager.parameters("SurvivalHUD") || {}).sleepMe || "Inn1", volume: 90, pitch: 100, pan: 0 });
        $gameSystem.sleepUntilHour(wakeHour());
        if (typeof $gameSystem.setStamina === "function") $gameSystem.setStamina(Math.max($gameSystem.stamina(), Math.round($gameSystem.maxStamina() * restore)));
        for (const member of $gameParty.members()) member.recoverAll();
        store().nights++;
        T.emit("stajniaSleep", { free: pendingFree, restore });
    }
    function morning() {
        const text = word(pendingFree ? "loft.ranoDarmo" : "loft.ranoPlatne");
        if (typeof $gameTemp.queueDayBanner === "function") $gameTemp.queueDayBanner(text);
        else { $gameMessage.add("Dzień " + T.time.day() + ". " + T.time.period().name + "."); $gameMessage.add(text); }
    }

    // ------------------------------------------------------------------ the injected events (Map181 only)
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function eventData(id, name, x, y, img, script) {
        const page = { conditions: Object.assign({}, BLANK), directionFix: true,
            image: { tileId: 0, characterName: img ? img[0] : "", direction: img ? img[2] : 2, pattern: img ? img[3] : 1, characterIndex: img ? img[1] : 0 },
            list: [C(355, [script]), C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: false };
        return { id, name, note: "<Stajnia>", pages: [page], x, y };
    }
    const markerOf = (data, key) => (data.events || []).find(e => e && new RegExp("^Miejsce:\\s*" + key + "\\s*$", "i").test(e.name || ""));
    function build(data, mapId) {
        if (mapId !== MAP) return [];
        const out = [], m = markerOf(data, "stryszek"), b = markerOf(data, "stajnia_zmiana");
        // (the marker wins; without it the ladder stands at the fallback cell - the loft of the old stable)
        out.push(eventData(IDS.loft, word("zdarzenie.stryszek") || "Stryszek", m ? m.x : LOFT_AT[0], m ? m.y : LOFT_AT[1], m ? null : ["!House_Town", 1, 4, 0], "Stajnia.loft(this);"));
        if (b) out.push(eventData(IDS.board, word("zdarzenie.tablica") || "Tablica zmian", b.x, b.y, null, "Stajnia.board(this);"));
        return out;
    }
    T.inject(MAP, { ids: [IDS.loft, 3259], owner: PLUGIN, build });

    window.Stajnia = T.register(PLUGIN, {
        IDS, MAP, PRICE, RESTORE, TRUST_AT, LOFT_AT,
        state: () => store(), trustLevel, freeRide, canShift, worked, price, workDay, wezwanie, startShift, applyResult, news: () => lastNews,
        meet, accept, offer, lodging, begin, board, loft, sleep, wake, morning, messages, build
    });
})();
