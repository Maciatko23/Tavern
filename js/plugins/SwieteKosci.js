//=============================================================================
// SwieteKosci.js
//=============================================================================
// The chain W15 "Święte kości" (docs/PODROZNI.md 4.2, stage 4 of the ferry's travellers, 2026-10-29) - the ENGINE; the data:
// SwieteKosci_Data.js, the words: js/teksty/swiete_kosci.txt. What the data cannot do:
//   - the hooks of the data: who is on the island (Podroznicy's book: Gaspar "relikwie", Augustyn "wizytator"), the days (the sermon on
//     the first market day after Gaspar's ferry, the night of the sale - his arrival + 9, or tonight from F9), the clues (the four
//     judges of the bones, the proof), the words of the steps, the box (the stone and the list into the bag), the money, the renown,
//     the town's opinion, Sława, D23's card (the stone or the list counts as one of Kleofas's cards), the quest's end
//   - Gaspar's menu (the traveller's own - Podroznicy.js): "Kup medalik" (Tadek tests it), "Sprzedaj kamień z krukiem" (a wreck's stone,
//     30 G - it lands in his box)
//   - the scenes (simple: bubbles, balloons, a sound): the sermon at the market (9-12 of the market day, the hero near Gaspar), the box
//     opened at the market (Wit, Gaspar, the people)
//   - Baltazar's courier on the guests' floor (Map025, the night of the sale 22:00-23:30, event 3050): seen near, or spoken to - the proof
//   - the wall of room 12 (Podroznicy.podsluch - stage 2's mechanism; registered once it is there): the proof, full or half
//   - Gaspar sailing with his box shut (the chain's own ending "bez bohatera": the quest lost, the renown -2)
//   - Act III (docs/PODROZNI.md 4.4): the faction's knowledge - one list of flags (Act3Data.WIEDZA_FRAKCJI, shared by the chains) and
//     ONE scout more in wave 3 for any of them, never added to W9's / W7's scout, none when W9 beat their scouts (w9FrakcjaPobita)
// Stage 3 (searching the rooms, the night steps, the letters) is not built: SwieteKosci.przeszukanie() is the box searched in room 12
// while Gaspar is out (the stone and the list without a confrontation) - for stage 3 to call.
// API: window.SwieteKosci (Tawerna.api("SwieteKosci")).

/*:
 * @target MZ
 * @plugindesc [W15] Łańcuch „Święte kości” - silnik: kazanie Gaspara na rynku, fałszywe kości, kurier Baltazara nocą na piętrze, skrzynka, kamień z krukiem i spis z Lipnicy, echo w Akcie III. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base SwieteKosci_Data
 * @base Podroznicy
 * @orderAfter Podroznicy
 * @orderAfter Act3
 *
 * @help
 * ============================================================================
 * SwieteKosci.js - łańcuch W15 „Święte kości” (docs/PODROZNI.md 4.2)
 * ============================================================================
 * Gaspar Lis, handlarz relikwii, przypływa promem 13. W dzień targowy głosi
 * kazanie na rynku (9-12). Brat Augustyn z Lipnicy przypływa dwa promy
 * później. W noc sprzedaży (dzień przybycia Gaspara + 9, 22-23:30) kurier
 * Baltazara stoi pod drzwiami pokoju 12 na piętrze gości.
 * F9 → „Wyspa i fabuła” → „Wątek W15”: przeskok do rozdziału.
 * W skryptach: SwieteKosci.stan(), SwieteKosci.przeszukanie().
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.SwieteKosciData;
    if (!T || !window.Watki || !D) throw new Error("SwieteKosci.js: brak TawernaCore.js / Watki.js / SwieteKosci_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "SwieteKosci";
    const w = D.watek, KTO = D.KTO;
    const fill = Watki.wstaw, C = Watki.mowa.C;
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const P = () => T.api("Podroznicy") || window.Podroznicy || null;
    const TL = () => T.api("TownLife");
    const TQ = () => T.api("TownQuests");
    const SB = () => T.api("SpeechBubbles");
    const tx = k => w.tekst(k);
    const listOf = v => (Array.isArray(v) ? v : v ? [v] : []);
    const report = (where, e) => console.error("[SwieteKosci] " + where + ":", e);
    const COIN = 314;

    // ==================================================================
    // 1. Who is on the island, the days
    // ==================================================================
    const ksiega = () => { const p = P(); try { return p && has() ? p.stan() : null; } catch (e) { return null; } };
    const wpis = key => { const s = ksiega(); return s ? s.obecni[key] || null : null; };
    const byli = key => { const s = ksiega(); return s && s.byli[key] && s.byli[key].length ? s.byli[key] : null; };
    // Gaspar's first visit: the day he came (0 - never)
    function przyjazd() {
        const e = wpis(KTO.gaspar);
        if (e && (e.wizyta || 1) === 1) return e.od;
        const b = byli(KTO.gaspar);
        return b ? b[0].od : 0;
    }
    // the sermon: the first market day after his ferry (day 14)
    function dzienKazania() {
        const g = przyjazd(), q = TQ();
        if (!g) return 0;
        for (let d = g + D.CZAS.kazanieOd; d <= g + D.CZAS.kazanieDo; d++) if (q && q.isMarket ? q.isMarket(d) : d % 7 === 0) return d;
        return g + 1;
    }
    // the night of the sale: the arrival + 9 (day 22), or tonight (F9)
    const nocSprzedazy = () => (has() && S().noc ? S().noc : przyjazd() ? przyjazd() + D.CZAS.noc : 0);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const evOf = key => { const L = TL(); const ev = L && L.eventOf ? L.eventOf(key) : null; return ev && !(ev._town && ev._town.hidden) && !ev.isTransparent() ? ev : null; };
    const punkty = o => Object.values(o || {}).reduce((a, v) => a + (v === true ? 1 : Number(v) || 0), 0);
    const dowodJest = () => punkty(S().dowod) >= 1;
    const falszN = () => Object.keys(S().falsz).filter(k => S().falsz[k]).length;
    const odswiez = () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const sprawdz = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); odswiez(); };
    const spkOf = ev => ({ id: ev ? ev.eventId() : -1, name: ev && ev.event() ? String(ev.event().name || "").replace(/\s*\(.*\)\s*$/, "") : "" });
    const note = key => { const p = w.pair(key); if (p) T.call("Journal", "addNote", p[0], p[1]); };

    // ==================================================================
    // 2. Scenes: bubbles, balloons and sounds in a row (never holding the hero)
    // ==================================================================
    const scena = { kroki: [], t: 0, mapa: 0 };
    function graj(kroki) { scena.kroki = kroki.slice(); scena.t = 0; scena.mapa = $gameMap.mapId(); }
    function scenaTick() {
        if (!scena.kroki.length) return;
        if ($gameMap.mapId() !== scena.mapa) { scena.kroki = []; return; }
        if (scena.t > 0) { scena.t--; return; }
        const k = scena.kroki.shift();
        const ch = typeof k.kto === "function" ? k.kto() : k.kto;
        if (k.tekst && ch && SB() && SB().say) SB().say(ch, k.tekst, k.klatki || D.SCENA.dymek);
        if (k.emotka) for (const c of listOf(typeof k.kogo === "function" ? k.kogo() : ch)) if (c) $gameTemp.requestBalloon(c, k.emotka);
        if (k.dzwiek) T.audio.se(k.dzwiek[0], { volume: k.dzwiek[1] || 80, pitch: k.dzwiek[2] || 100 });
        if (k.mysl) w.mysl([k.mysl]);
        scena.t = k.czekaj || 0;
    }
    // the town's people near a character (the crowd of a scene)
    function tlum(ev, r) {
        const L = TL();
        if (!L || !L.residents || !ev) return [];
        return L.residents().filter(e => e !== ev && !(e._town && e._town.hidden) && !e.isTransparent() && dist(e, ev) <= r).slice(0, 5);
    }

    // ---------------------------------------------------------------- the sermon at the market (the market day after Gaspar's ferry)
    function kazanieTick() {
        const s = S();
        if (s.kazanie || $gameMap.mapId() !== D.MAP.miasto || !wpis(KTO.gaspar) || scena.kroki.length) return;
        const d = dzienKazania(), h = hour();
        if (day() !== d || h < D.CZAS.kazanie[0] || h >= D.CZAS.kazanie[1]) return;
        const g = evOf(KTO.gaspar);
        if (!g || dist(g, $gamePlayer) > D.SCENA.widzi || !T.isCalm(SceneManager._scene)) return;
        s.kazanie = day();
        w.setFlag("w15Kazanie");
        const lines = listOf(tx("scena.kazanie")), hanka = evOf("piekarka"), gap = D.SCENA.dymek + D.SCENA.przerwa;
        const k = [{ kto: g, emotka: 1, kogo: () => tlum(g, D.SCENA.tlum), czekaj: 20 }];
        lines.forEach((l, i) => {
            k.push({ kto: g, tekst: l, czekaj: gap });
            if (i === 0) k.push({ kto: () => tlum(g, D.SCENA.tlum)[0] || null, tekst: tx("scena.tlum"), czekaj: 30 });
            if (i === 2 && hanka && dist(hanka, g) <= 16) k.push({ kto: hanka, tekst: tx("scena.hanka"), czekaj: gap });
        });
        k.push({ mysl: tx("mysl.kazanie") });
        graj(k);
        sprawdz();
    }
    // ---------------------------------------------------------------- the box opened at the market (after the talk)
    function scenaRynek() {
        const g = evOf(KTO.gaspar), wit = evOf("kapral"), gap = D.SCENA.dymek + D.SCENA.przerwa;
        graj([{ czekaj: 40 }, { kto: wit, tekst: tx("scena.rynek.wit"), czekaj: wit ? gap : 0 }, { kto: g, tekst: tx("scena.rynek.gaspar"), emotka: 6, czekaj: gap },
            { kto: () => tlum(g || $gamePlayer, D.SCENA.tlum)[0] || null, tekst: tx("scena.rynek.tlum"), emotka: 1, kogo: () => tlum(g || $gamePlayer, D.SCENA.tlum), czekaj: gap },
            { kto: () => evOf("piekarka"), tekst: tx("scena.rynek.hanka"), czekaj: 20 }]);
    }

    // ==================================================================
    // 3. The clues, the box, the money
    // ==================================================================
    function falsz(k) {
        const s = S();
        if (!k || s.falsz[k] || !w.active("W15")) return;
        s.falsz[k] = day();
        const n = falszN();
        T.popup(fill(tx("poszlaka.falsz"), { n: Math.min(2, n) }), { top: true, color: "#ffe27a" });
        if (n === 2) note("notatki.falsz");
        sprawdz();
    }
    // the proof: 1 full, 0.5 half (the wall heard with a low Czujność); the first full one - the note
    function dowod(k, v) {
        const s = S();
        if (!k || !w.active("W15") || s.skrzynka) return;
        const was = dowodJest(), val = Math.max(Number(s.dowod[k]) || 0, Number(v) || 1);
        if (val === (Number(s.dowod[k]) || 0)) return;
        s.dowod[k] = val;
        if (!was && dowodJest()) { T.popup(tx("poszlaka.dowod"), { top: true, color: "#ffe27a" }); note("notatki.dowod"); }
        sprawdz();
    }
    function skrzynkaWyjmij() {
        if (w.vcount("kamien_gaspara") < 1) w.vgive("kamien_gaspara", 1);
        if (w.vcount("spis_lipnicy") < 1) w.vgive("spis_lipnicy", 1);
        T.audio.se("Chest1", { volume: 80 });
        odswiez();
    }
    function zloto(n) {
        if (!(n > 0)) return;
        $gameParty.gainGold(n);
        T.popup(fill(tx("napis.zloto"), { n }), { icon: COIN, kind: "gold" });
    }
    // D23 (Pustelnia): Kleofas trusts the hero after six cards read ("ile:read>=6") - the stone or the list counts as one of them
    function kartaKleofasa(what) {
        const ps = Watki.stan("pustelnia");
        if (!ps || !ps.read || ps.read[what] || w.done("D23")) return;
        ps.read[what] = day();
        sprawdz();
    }
    // stage 3: the box searched in room 12 while Gaspar is out - the stone and the list without a confrontation (Gaspar not unmasked)
    function przeszukanie() {
        if (!has() || !w.active("W15") || S().skrzynka) return false;
        const at = ["w15Kram", "w15Falsz", "w15Augustyn", "w15Dowod", "w15Skrzynka"].find(n => w.at(n));
        if (!at) return false;
        Object.assign(S(), { skrzynka: "szukal", skrzynkaDzien: day() });
        skrzynkaWyjmij();
        note("notatki.przeszukana");
        w.complete(at, { to: "w15Komu", reward: { xp: 50 } });
        return true;
    }
    // the chain's own end "bez bohatera": Gaspar sails with his box shut - the list and the stone go to Baltazar's courier
    function bezBohatera() {
        const s = S();
        if (!w.active("W15") || s.skrzynka) return;
        Object.assign(s, { koniec: "uciekl", skrzynka: "uciekl", kamien: s.kamien || "uciekl", spis: s.spis || "uciekl" });
        w.setFlag("gasparUciekl");
        const p = P();
        if (p && p.renoma) p.renoma(D.RENOMA.bezKonca, "bezKonca:" + KTO.gaspar);
        note("notatki.uciekl");
        const q = TQ();
        if (q && q.fail) q.fail("W15");
    }

    // ==================================================================
    // 4. Gaspar's menu (the traveller's own, Podroznicy.js - other systems' rows): the medallion, a raven stone sold
    // ==================================================================
    function kupMedalik(ctx) {
        const cena = D.CENY.medalik;
        if ($gameParty.gold() < cena) { T.popup.need(COIN, fill(tx("medalik.brak"), { cena })); return null; }
        $gameParty.loseGold(cena);
        w.vgive("medalik_gaspara", 1);
        S().medalik = day();
        odswiez();
        return w.linie([], spkOf(ctx.ev), "medalik.kupiony");
    }
    function sprzedajKamien(ctx) {
        if (w.vcount("kamien_kruk") < 1) return null;
        w.vtake("kamien_kruk", 1);
        S().kamienSprzedany = day();
        zloto(D.CENY.kamienGaspar);
        return w.linie([], spkOf(ctx.ev), "kamien.sprzedany");
    }
    const menuOtwarte = () => has() && w.active("W15") && !S().skrzynka;
    T.talk.option({ owner: PLUGIN, who: KTO.gaspar, id: "medalik", order: T.talk.ORDER.extra,
        when: () => menuOtwarte() && !S().medalik && w.vcount("medalik_gaspara") < 1,
        label: () => fill(tx("menu.medalik"), { cena: D.CENY.medalik }), run: ctx => { try { return kupMedalik(ctx); } catch (e) { report("medalik", e); return null; } } });
    T.talk.option({ owner: PLUGIN, who: KTO.gaspar, id: "kamien", order: T.talk.ORDER.extra + 1,
        when: () => menuOtwarte() && !S().kamienSprzedany && w.vcount("kamien_kruk") > 0,
        label: () => fill(tx("menu.kamien"), { cena: D.CENY.kamienGaspar }), run: ctx => { try { return sprzedajKamien(ctx); } catch (e) { report("kamień", e); return null; } } });

    // ==================================================================
    // 5. Baltazar's courier on the guests' floor (Map025, the night of the sale 22:00-23:30): event 3050
    // ==================================================================
    const K = D.KURIER;
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function kurierDane() {
        return { id: K.id, name: "", note: "<Lancuchy:kurier>", x: K.x, y: K.y, pages: [{ conditions: Object.assign({}, COND), directionFix: false,
            image: { tileId: 0, characterName: K.sheet, direction: K.dir, pattern: 1, characterIndex: K.index },
            list: [C(355, ["SwieteKosci.kurier(this);"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true }] };
    }
    T.inject(K.map, { ids: [K.id, K.id], owner: D.OWNER, build: () => [kurierDane()] });
    function kurierWidoczny() {
        if (!has() || !w.active("W15")) return false;
        const s = S(), h = hour();
        return !s.skrzynka && s.kurier !== day() && !!wpis(KTO.gaspar) && day() === nocSprzedazy() && h >= K.godziny[0] && h < K.godziny[1];
    }
    function pokaz(ev, on) {
        const st = ev._lan || (ev._lan = {});
        if (st.on === on) return;
        st.on = on;
        ev.setTransparent(!on);
        ev.setThrough(!on);
        if (on) { const de = ev.event(); if (de) de.name = tx("kurier.imie"); ev.setImage(K.sheet, K.index); ev.setDirection(K.dir); }
    }
    function kurierTick() {
        const ev = $gameMap.mapId() === K.map ? $gameMap.event(K.id) : null;
        if (!ev) return;
        const on = kurierWidoczny();
        pokaz(ev, on);
        if (!on) { if (ev._trigger !== -1) ev._trigger = -1; return; }
        if (ev._trigger !== 0) ev._trigger = 0;
        if (!S().dowod.kurier && dist(ev, $gamePlayer) <= K.widzi && T.isCalm(SceneManager._scene)) {
            w.mysl([tx("mysl.kurier")]);
            dowod("kurier", 1);
        }
    }
    // spoken to: his lines, the proof; he goes down the stairs afterwards
    function kurier(interp) {
        if (!interp || !has()) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev || !kurierWidoczny()) return;
        const out = w.linie([], { id: ev.eventId(), name: tx("kurier.imie") }, "kurier.rozmowa");
        out.push(C(355, ["SwieteKosci.kurierPoszedl();"]));
        Watki.mowa.uruchom(interp, out);
    }
    function kurierPoszedl() {
        if (!has()) return;
        dowod("kurier", 1);
        S().kurier = day();
        T.popup(tx("kurier.wyszedl"), { kind: "info" });
    }

    // ==================================================================
    // 6. The wall of room 12 (Podroznicy.podsluch - the mechanism of stage 2): the night of the sale, 22-24
    // ==================================================================
    let podsluchJest = false;
    function podsluchDodaj() {
        const p = P();
        if (podsluchJest || !p || !p.podsluch || typeof p.podsluch.dodaj !== "function") return false;
        podsluchJest = true;
        try {
            p.podsluch.dodaj({ id: "w15Kurier", plik: "swiete_kosci", mapa: D.MAP.pietro, pokoj: "12", godziny: D.CZAS.nocGodziny, kwestie: "podsluch.kurier", prog: 5, raz: true,
                gdy: () => has() && w.active("W15") && !S().skrzynka && !!wpis(KTO.gaspar) && day() === nocSprzedazy() });
        } catch (e) { report("podsłuch", e); }
        return true;
    }
    podsluchDodaj();
    T.on("podsluch", e => { if (e && e.id === "w15Kurier" && has()) dowod("podsluch", e.pelna ? 1 : 0.5); }, { owner: PLUGIN });

    // ==================================================================
    // 7. Act III (docs/PODROZNI.md 4.4): the faction's knowledge - ONE scout more in wave 3 for any flag of the shared list, never
    //    added to W9's / W7's scout (the same name), none when W9 beat their scouts in the ruins
    // ==================================================================
    (function echa() {
        const A3 = window.Act3Data;
        if (!A3 || !Array.isArray(A3.WAVES)) return;
        const list = A3.WIEDZA_FRAKCJI = A3.WIEDZA_FRAKCJI || [];
        for (const f of D.ECHA.wiedza) if (!list.includes(f)) list.push(f);
        if (A3._wiedzaFrakcji) return;
        const w3 = A3.WAVES.find(x => x && x.id === "w3");
        if (!w3) return;
        A3._wiedzaFrakcji = PLUGIN;
        const orig = w3.extra;
        w3.extra = c => {
            const out = (typeof orig === "function" ? orig(c) : []) || [];
            const f = (c && c.flags) || {}, name = A3.TEXT && A3.TEXT.fale && A3.TEXT.fale.imiona ? A3.TEXT.fale.imiona.zwiadowca : "";
            if (f.w9FrakcjaPobita || out.some(x => x && x.name === name)) return out;
            if (list.some(k => f[k])) out.push({ kind: "knifer", name, lv: 0 });
            return out;
        };
    })();

    // ==================================================================
    // 8. The hooks of the data (conditions, words, actions, F9)
    // ==================================================================
    w.haki({
        // "@key: ..." in a talk: that resident says it
        mowca: (ctx, key) => { const ev = evOf(key); return ev ? spkOf(ev) : null; },
        gasparJest: () => !!wpis(KTO.gaspar),
        gasparPoznany: () => { const s = ksiega(); return !!(s && s.poznani && s.poznani[KTO.gaspar]); },
        poKazaniu: () => { const d = dzienKazania(); return !!d && day() > d; },
        augustynJest: () => !!wpis(KTO.augustyn),
        augustynOdplynal: () => !wpis(KTO.augustyn) && !!byli(KTO.augustyn),
        poNocy: () => { const n = nocSprzedazy(); return !!n && day() > n; },
        dowodJest: () => dowodJest(),
        partnerBaltazara: () => w.flag("w5Podwojna") || w.flag("balthazarTrust"),
        kronikiWolne: () => w.vcount("kroniki") > 0 && w.flag("chroniclesTaken") && !w.flag("w5ChroniclesSold") && !w.flag("kronikiAugustyn"),
        // the words of the steps
        w15Zmienne: () => {
            const s = S(), a = wpis(KTO.augustyn), n = nocSprzedazy(), kam = w.vcount("kamien_gaspara") > 0 && !s.kamien, sp = w.vcount("spis_lipnicy") > 0 && !s.spis;
            return { targ: dzienKazania() || "-", n: Math.min(2, falszN()), dzien: a ? a.do : day(),
                augustyn: tx(a ? "kroki.augustyn.jest" : "kroki.augustyn.czeka"),
                kiedy: fill(tx(n && day() > n ? "kroki.dowod.po" : "kroki.dowod.przed"), { dzien: n || "-" }),
                co: tx(kam && sp ? "kroki.komu.oba" : kam ? "kroki.komu.kamien" : sp ? "kroki.komu.spis" : "kroki.komu.nic") };
        },
        // actions
        falsz: (ctx, k) => falsz(k),
        dowod: (ctx, k, v) => dowod(k, v),
        skrzynkaWyjmij: () => skrzynkaWyjmij(),
        scenaRynek: () => scenaRynek(),
        zabierz: (ctx, k, n) => { w.vtake(k, n || 1); odswiez(); },
        zloto: (ctx, n) => zloto(n),
        renoma: (ctx, n, why) => { const p = P(); if (p && p.renoma) p.renoma(n, why); },
        opinia: (ctx, n) => { T.call("TownQuests", "addOpinion", n, tx("zadania.W15.title")); },
        slawa: (ctx, n) => { if (T.call("QuestBoard", "addRep", n) !== undefined) T.popup(fill(tx("napis.slawa"), { n }), { top: true, color: "#9ff0a8" }); },
        kartaKleofasa: (ctx, what) => kartaKleofasa(what),
        zakoncz: (ctx, rw) => { const q = TQ(); if (q && q.finish) q.finish("W15", rw); },
        // F9: Gaspar (and from the 3rd jump Augustyn) on the island, the clues of the chapters before; the 4th - the night tonight
        f9Przygotuj: ctx => {
            const k = Number(ctx.skok) || 1, s = S(), p = P();
            if (!p) return;
            if (day() < 13) $gameSystem._dayNightDay = 13;
            // (the chapters from this one on afresh: what a jump further on gave is taken back)
            s.koniec = "";
            if (k < 6) { Object.assign(s, { skrzynka: "", skrzynkaDzien: 0, kamien: "", spis: "" }); w.vtake("kamien_gaspara", 9); w.vtake("spis_lipnicy", 9); }
            if (k < 5) { s.dowod = {}; s.kurier = 0; s.noc = 0; }
            if (k < 3) s.falsz = {};
            if (k < 2) s.kazanie = 0;
            // (both stay at least three days from now - a jump never lands on their leaving)
            const q = TQ(), prom = d => { for (let x = d; x < d + 6; x++) if (q && q.isFerry ? q.isFerry(x) : (x - 1) % 3 === 0) return x; return d; };
            const zostan = key => { const e = wpis(key); if (e && e.do < day() + 3) Object.assign(e, { do: prom(day() + 3), zostal: 0 }); };
            if (!wpis(KTO.gaspar)) p.przyplyn(KTO.gaspar);
            zostan(KTO.gaspar);
            if (k >= 2 && !s.kazanie) s.kazanie = day();
            if (k >= 3) {
                if (!wpis(KTO.augustyn)) p.przyplyn(KTO.augustyn);
                zostan(KTO.augustyn);
                for (const j of ["ignac", "tadek"]) if (falszN() < 2 && !s.falsz[j]) s.falsz[j] = day();
            }
            if (k === 4) { s.noc = day(); s.kurier = 0; delete s.dowod.kurier; }
            if (k >= 5 && !dowodJest()) s.dowod.kurier = 1;
            if (k >= 6 && !s.skrzynka) { Object.assign(s, { skrzynka: "augustyn", skrzynkaDzien: day() }); skrzynkaWyjmij(); }
            if (k >= 7) {
                if (!s.kamien) { w.vtake("kamien_gaspara", 1); s.kamien = "kleofas"; }
                if (!s.spis) { w.vtake("spis_lipnicy", 1); s.spis = "augustyn"; }
            }
        }
    });

    // ==================================================================
    // 9. The clock and the bus
    // ==================================================================
    let ticks = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        try {
            scenaTick();
            if (++ticks % 15) return;
            kurierTick();
            kazanieTick();
        } catch (e) { report("zegar", e); }
    }, { owner: PLUGIN, name: "swieteKosci" });
    T.on("mapReady", () => { scena.kroki = []; podsluchDodaj(); if (has()) kurierTick(); }, { owner: PLUGIN });
    T.on("load", () => { scena.kroki = []; }, { owner: PLUGIN });
    // Gaspar sails (by the ferry) with his box shut: the chain's own end; Augustyn sails: the steps that wait for him move on
    T.on("podroznyOdplynal", e => {
        if (!e || !has() || e.jak !== "prom") return;
        try {
            if (e.kto === KTO.gaspar) bezBohatera();
            if (e.kto === KTO.augustyn) sprawdz();
        } catch (er) { report("odpływ", er); }
    }, { owner: PLUGIN });

    window.SwieteKosci = T.register(PLUGIN, {
        D, stan: () => S(), dzienKazania, nocSprzedazy, przyjazd, kurier, kurierPoszedl, kurierWidoczny, przeszukanie, bezBohatera,
        falsz, dowod, scena: { trwa: () => scena.kroki.length > 0 }, podsluch: () => podsluchJest
    });
})();
