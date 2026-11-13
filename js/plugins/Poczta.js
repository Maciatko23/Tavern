//=============================================================================
// Poczta.js
//=============================================================================
// The thread W20 "Kruczy listonosz" (docs/zadania_nowe/kruczy_listonosz.md) - the ENGINE; the data: Poczta_Data.js, the words:
// js/teksty/poczta.txt. The raven post of Kruczogród: the ravens come home at 6:30 and 17:30 with letters; Master Gawron lays them on the
// sorting table of the Kruczarnia (Map214); the hero takes up to six into his bag and walks them round the town to their addressees (each has
// his hours), is paid a few groszy, may read a seal in secret (three of them and Gawron's trust is gone). Five weeks: the first bag,
// the letters from the front (and the one to the dead, and the one with no address), who is reading them (the night watch), the trap of the
// three baits, the night confrontation with Cyryl the clerk, the choice, the farewell.
//   1. the letters: availability by the week and the slot, the bag (6), the delivery (a takeover of the talk of the addressee - "Masz list."),
//      the fee, the opinion, late deliveries, the secret reading, the seals
//   2. the windows (black and yellow like the HUD): the letter on a sheet of paper (lines appear one by one), the bag (key B)
//   3. the scenes (bubbles, the ravens' flight, the night): S1 the raven with the letter, S2 reading, S3 Grum, S4 the grave, S5 the
//      night watch and the chase, S6 the bait, S7 the truth, S8 the farewell
//   4. the Kruczarnia: the door of Map008, the ravens on the perches, the table, the injected actors (4400 the hooded man, 4401 the grave,
//      4403 Cyryl as an actor), the F9 rows
// API: window.Poczta (Tawerna.api("Poczta")): stan(), torba(), okno(id), drzwi(interp), stol(interp), doreczy(interp, key)...

/*:
 * @target MZ
 * @plugindesc [W20] Kruczy listonosz - silnik: listy z kruków (6:30 i 17:30), torba (B), doręczenia, okno listu, kruczarnia (mapa 214), sceny S1-S8, nocna warta, pułapka, finał. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Poczta_Data
 * @orderAfter Dezerter
 *
 * @help
 * ============================================================================
 * Poczta.js - wątek W20 „Kruczy listonosz” (docs/zadania_nowe/kruczy_listonosz.md)
 * ============================================================================
 * Rano o 6:30 i wieczorem o 17:30 kruki wracają z listami; stół do sortowania
 * w kruczarni (mapa 214, drzwi na mapie 8 w narożniku NE); do 6 listów w torbie
 * (klawisz B), doręczenie w rozmowie z adresatem („Masz list.”), okno listu
 * w czarno-żółtej ramce. F9 → „Wyspa i fabuła” → „Wątek W20”.
 * W skryptach: Poczta.stan(), Poczta.torba(), Poczta.okno("l1_hanka").
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.PocztaData;
    if (!T || !window.Watki || !D) throw new Error("Poczta.js: brak TawernaCore.js / Watki.js / Poczta_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Poczta";
    const w = D.watek, M = Watki.mowa, C = M.C, fill = Watki.wstaw;
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap && !!window.$gameParty;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const SB = () => T.api("SpeechBubbles") || window.SpeechBubbles || null;
    const tx = k => w.tekst(k);
    const report = (where, e) => console.error("[Poczta] " + where + ":", e);
    const listOf = v => (Array.isArray(v) ? v : v ? [v] : []);
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const LET = id => D.LISTY.find(l => l.id === id) || null;
    const BAIT = id => D.PRZYNETY.find(l => l.id === id) || null;
    const abs = (d, h) => d * 24 + h;
    const nowAbs = () => abs(day(), hour());
    const imie = key => w.tekstMoze("imie." + key) || key;
    const onMap = id => has() && $gameMap.mapId() === id;

    // ==================================================================
    // 1. The letters
    // ==================================================================
    const recQ = () => { try { return w.rec("W20"); } catch (e) { return null; } };
    // the step of W20 now (0-4); 9 when the thread is done; -1 not begun
    function stepNow() {
        const r = recQ();
        if (!r) return -1;
        return r.s === "done" ? 9 : r.s === "active" ? r.step : -1;
    }
    const started = () => !!(has() && S().start > 0);
    const weekOf = d => (S().start > 0 ? Math.floor((d - S().start) / 7) + 1 : 0);
    const arrivalDay = L => S().start + (L.ch - 1) * 7 + (L.d - 1);
    const arrivalAbs = L => abs(arrivalDay(L), L.slot === "w" ? D.PRZYLOT[1] : D.PRZYLOT[0]);
    const inBag = id => S().bag.includes(id);
    // letters on the table now: arrived (their week and slot), their chapter reached, not taken
    function onTable() {
        if (!started()) return [];
        const st = stepNow(), now = nowAbs();
        return D.LISTY.filter(L => !S().taken[L.id] && st >= L.ch - 1 && now >= arrivalAbs(L));
    }
    // a bait written by the hero is a letter in the bag too (id p_*): its data
    const letterData = id => LET(id) || BAIT(id);
    const bagList = () => S().bag.map(id => ({ id, L: letterData(id) })).filter(x => x.L);
    const lettersFor = key => bagList().filter(x => x.L.to === key);

    function isLate(L) {
        if (!L.okno) return false;
        return !inHours(hour(), L.okno);
    }
    const windowText = L => (L.okno ? hhmm(L.okno[0]) + "-" + hhmm(L.okno[1]) : "cały dzień");
    function hhmm(h) { const m = Math.round((h % 1) * 60); return Math.floor(h) + (m ? ":" + String(m).padStart(2, "0") : ""); }

    function opinion(n, why) {
        const q = TQ();
        if (!q || !q.addOpinion || !n) return 0;
        const got = q.addOpinion(n, why || tx("zadania.W20.title"));
        if (got) T.popup(fill(tx(got > 0 ? "napis.opinia" : "napis.opiniaMinus"), { n: Math.abs(got) }), { top: true, color: got > 0 ? "#9ff0a8" : "#ff9f8f" });
        return got;
    }
    function gold(n) {
        if (!n || !has()) return;
        $gameParty.gainGold(n);
        T.popup(fill(tx("napis.zloto"), { n }), { icon: 314, kind: "gold" });
    }

    // take the letters from the table into the bag (up to the bag's size; the special ones act at once)
    function take() {
        const s = S(), list = onTable().filter(L => L.special !== "dziadek" && L.special !== "dziadek5");
        let n = 0, haczyk = null, bez = null;
        for (const L of list) {
            if (L.special === "bez") { bez = L; continue; }
            if (s.bag.length >= D.TORBA) { T.popup(tx("napis.pelna"), { kind: "need" }); break; }
            s.bag.push(L.id); s.taken[L.id] = day(); n++;
            if (L.special === "haczyk") haczyk = L;
            if (L.special === "otwarty") { s.opened[L.id] = 1; clueAdd("rzecz0"); }
        }
        if (bez && !s.taken[bez.id]) { s.bag.push(bez.id); s.taken[bez.id] = day(); s.bez = day(); n++; }
        if (n) { T.audio.se("Book1", { volume: 70 }); T.popup(fill(tx("napis.torba"), { n: s.bag.length }), { kind: "info" }); }
        w.autoChecks();
        return { n, haczyk, bez };
    }
    // the clue counter (week 3): wicek, sambor, baltazar, cyryl, rzecz (the thing dropped in the night), wosk (week 1's), rzecz0 (an opened letter)
    function clueAdd(k) { const c = S().clue; if (c[k]) return false; c[k] = day(); return true; }
    const clueCount = () => ["wicek", "sambor", "baltazar", "cyryl", "rzecz"].filter(k => S().clue[k]).length;
    function poszlaka(k) {
        if (!clueAdd(k)) return;
        const t = w.tekstMoze("poszlaka." + k);
        if (t) w.mysl(["(" + t + ")"]);
        T.popup(fill(tx("napis.poszlaka"), { n: Math.min(3, clueCount()) }), { top: true, color: "#ffd866" });
        w.autoChecks();
    }

    // ---- delivery
    function pay(L, late, opened) {
        const fee = late ? Math.max(1, Math.floor(L.oplata / 2)) : L.oplata;
        if (fee) gold(fee);
        let op = L.opinia;
        if (late || (opened && !S().sealed[L.id])) op = -1;
        if (op) opinion(op, imie(L.to));
        return { fee, op };
    }
    // the hero hands letter `id` to `key` (via: "reka" | "kruk" | how); the commands of the addressee's answer are returned
    function deliver(id, key, via) {
        const s = S(), L = letterData(id);
        if (!L || !inBag(id)) return [];
        const late = isLate(L), opened = !!s.opened[id];
        s.bag.splice(s.bag.indexOf(id), 1);
        s.done[id] = { day: day(), hour: Math.round(hour() * 10) / 10, late: late ? 1 : 0, opened: opened ? 1 : 0, how: via || "reka" };
        const pr = pay(L, late, opened);
        T.emit("poczta", { co: "doreczono", id, key, late, opened });
        w.autoChecks();
        return { late, opened, pr, L };
    }
    // answer lines of the addressee: the letter's own, else the general ones
    function answerLines(r, spk) {
        const out = [];
        const own = w.tekstMoze("odpowiedz." + r.L.id);
        const base = r.opened && !S().sealed[r.L.id] ? tx("reakcja.otwarty") : r.late ? tx("reakcja.spozniony") : own || tx("reakcja.domyslna");
        if (!base) return out;
        M.sayTo(out, spk, base.replace(/^\(.*?\)\s*/, ""), 0, { akapity: true });
        return out;
    }
    // the clue a resident can give now (week 3): who knows something about the opened letters
    const szlakDla = key => (started() && stepNow() === 2 && D.SZLAKI[key] && !S().clue[D.SZLAKI[key]] ? D.SZLAKI[key] : null);
    const maListy = key => {
        if (!started()) return false;
        if (key === "wdowa" || key === "pustelnik") return inBag("l2_gryta");
        return lettersFor(key).some(x => !x.L.special || x.L.special === "haczyk" || x.L.special === "otwarty");
    };
    // "Masz list." (and in week 3 "Wypytaj o otwarte listy") - the row at the talk of a resident (a takeover; "Nie, w innej sprawie" lets the rest speak)
    function talkFor(key, ev) {
        if (!has() || !started()) return null;
        const mine = maListy(key) || (key === "wdowa" || key === "pustelnik" ? inBag("l2_gryta") : false) || bagList().some(x => x.L.to === key && BAIT(x.id));
        const szlak = szlakDla(key);
        if (!mine && !szlak) return null;
        const out = [], labels = [], branches = [];
        const q = JSON.stringify(key);
        if (mine) { labels.push(tx("dostawa.opcja")); branches.push(M.script([], "Poczta.doreczy(this, " + q + ")")); }
        if (szlak) { labels.push(tx("szlak.opcja")); branches.push(M.script([], "Poczta.szlak(this, " + q + ")")); }
        labels.push(tx("dostawa.nie")); branches.push(M.script([], "Poczta.inna(this, " + q + ")"));
        M.choiceTo(out, labels, branches, labels.length - 1);
        return out;
    }
    // week 3: a resident says what he knows of the opened letters (one clue each)
    function szlak(interp, key) {
        const k = szlakDla(key);
        if (!k) return;
        const ev = interp && interp.eventId && $gameMap.event(interp.eventId());
        const spk = speakerOf(key, ev), out = [];
        M.linesTo(out, spk, tx("poszlaki." + k), null, 0, { akapity: true, kto: x => speakerOf(x) });
        run(interp, out);
        poszlaka(k);
    }
    const OPT = { akapity: true, kto: k => (k === "kaptur" || k === "cyryl") && actor(k === "kaptur" ? D.KAPTUR.id : 4403) && !actor(k === "kaptur" ? D.KAPTUR.id : 4403)._transparent ? { id: actor(k === "kaptur" ? D.KAPTUR.id : 4403).eventId(), name: "" } : speakerOf(k) };
    function speakerOf(key, ev) {
        const e = ev || (TL() && TL().eventOf ? TL().eventOf(key) : null);
        return e ? { id: e.eventId(), name: (e._town && e._town.name) || "" } : { id: 0, name: "" };
    }
    function inna(interp, key) {
        const ev = interp && interp.eventId && $gameMap.event(interp.eventId());
        T.talk.run(interp, key, { ev, owner: PLUGIN, skip: PLUGIN });
    }
    // the delivery (a script of the takeover's branch): every letter of `key`, the answers
    function doreczy(interp, key) {
        if (!has()) return;
        const ev = interp && interp.eventId && $gameMap.event(interp.eventId());
        const spk = speakerOf(key, ev), out = [];
        const baits = bagList().filter(x => x.L.to === key && BAIT(x.id));
        for (const b of baits) {   // a bait: "a mistake in the bag" - who takes it is noted by the night
            deliver(b.id, key, "przynieta");
            M.sayTo(out, spk, tx("przynety.pomylka"), 0, { akapity: true });
            S().przynety[b.id] = day();
        }
        for (const x of lettersFor(key).filter(x => !x.L.special || x.L.special === "haczyk" || x.L.special === "otwarty")) {
            const r = deliver(x.id, key);
            if (r && r.L) for (const c of answerLines(r, spk)) out.push(c);
        }
        if (key === "wdowa" && inBag("l2_gryta")) { grytaRozwiaz("sasiadka"); M.linesTo(out, spk, tx("gryta.sasiadka"), null, 0, { akapity: true, kto: k => speakerOf(k) }); }
        if (key === "pustelnik" && inBag("l2_gryta")) { grytaRozwiaz("kleofas"); M.linesTo(out, spk, tx("gryta.kleofas"), null, 0, { akapity: true, kto: k => speakerOf(k) }); }
        run(interp, out);
    }
    // old Gryta's letter: grob | kleofas | sasiadka | odeslij - nothing is required and nothing is lost
    function grytaRozwiaz(how) {
        const s = S();
        if (!inBag("l2_gryta")) return false;
        s.bag.splice(s.bag.indexOf("l2_gryta"), 1);
        s.gryta = how;
        s.done.l2_gryta = { day: day(), hour: hour(), late: 0, opened: 0, how };
        if (how === "grob") { opinion(3, imie("wdowa")); w.wykonaj([{ xp: 40 }], { args: [] }); }
        if (how === "kleofas") opinion(1, imie("pustelnik"));
        T.emit("poczta", { co: "gryta", how });
        w.autoChecks();
        return true;
    }
    function doreczLista(ctx, id) {   // Grum's and Melia's (the steps' talks of the regulars): the letter is delivered by the talk
        const L = LET(id), r = deliver(id, L && L.to, "reka");
        if (r && r.L && r.late) w.mysl(["(" + tx("reakcja.spozniony") + ")"]);
        if (id === "l2_grum") setTimeout(() => scenaGrum(), 600);
    }

    // ==================================================================
    // 2. The windows
    // ==================================================================
    const YEL = "#ffd23f", INK = "#2a2218";
    const modal = { win: null, done: null };
    const isModal = () => !!modal.win;
    function openModal(win, done) {
        const sc = SceneManager._scene;
        if (!sc || !sc.addWindow || modal.win) return false;
        modal.win = win; modal.done = done || null;
        sc.addWindow(win);
        return true;
    }
    function closeModal() {
        const win = modal.win, done = modal.done;
        modal.win = null; modal.done = null;
        if (win) { try { win.parent && win.parent.removeChild(win); win.destroy(); } catch (e) { /* (gone with the scene) */ } }
        Input.clear();
        if (done) try { done(); } catch (e) { report("modal", e); }
    }
    const okKey = () => ["ok", "keyEnter", "keyO"].some(k => Input.isTriggered(k));
    const backKey = () => ["cancel", "escape", "keyEsc", "keyP"].some(k => Input.isTriggered(k));

    // the letter on a sheet of paper in a black and yellow frame; the lines come every half second, O hurries, O / Esc after closes
    class Window_PocztaList extends Window_Base {
        constructor(rect, data) {
            super(rect);
            this.opacity = 0;
            this._data = data; this._shown = 0; this._t = 0;
            this._lines = data.lines;
            this.paint();
        }
        paint() {
            const c = this.contents, W = this.innerWidth, H = this.innerHeight;
            c.clear();
            c.fillRect(0, 0, W, H, "#000000");
            c.fillRect(0, 0, W, 3, YEL); c.fillRect(0, H - 3, W, 3, YEL); c.fillRect(0, 0, 3, H, YEL); c.fillRect(W - 3, 0, 3, H, YEL);
            c.fillRect(14, 40, W - 28, H - 80, "#e9dec2");
            c.fillRect(14, 40, W - 28, 2, "#b59f74"); c.fillRect(14, H - 42, W - 28, 2, "#b59f74");
            c.fontFace = $gameSystem.mainFontFace(); c.fontSize = 22;
            c.outlineWidth = 0;
            c.textColor = YEL;
            c.drawText(tx("okno.tytul")[0], 20, 8, W - 40, 28, "left");
            c.drawText(fill("{od}: {x}", { od: tx("okno.od"), x: this._data.od }), 20, 8, W - 40, 28, "right");
            c.fontSize = 24;
            c.textColor = this._data.ink || INK;
            const lh = 30, top = 52;
            this._lines.forEach((l, i) => { if (i < this._shown) c.drawText(l, 30, top + i * lh, W - 60, lh, "left"); });
            c.fontSize = 18; c.textColor = YEL;
            c.drawText(tx("okno.zamknij"), 20, H - 34, W - 40, 26, "right");
        }
        update() {
            super.update();
            this._t++;
            const all = this._shown >= this._lines.length;
            if (!all && (this._t % 30 === 0)) { this._shown++; this.paint(); if (this._t % 60 === 0) T.audio.se("Book2", { volume: 25, pitch: 130 }); }
            if (okKey()) { if (!all) { this._shown = this._lines.length; this.paint(); Input.clear(); } else closeModal(); }
            else if (backKey()) closeModal();
        }
    }
    const wrapText = (text, n) => { const out = []; for (const para of String(text).split("\n")) { let line = ""; for (const wd of para.split(/\s+/)) { if (!wd) continue; if (line && (line + " " + wd).length > n) { out.push(line); line = wd; } else line = line ? line + " " + wd : wd; } out.push(line); } return out; };
    // the letter read: id of a letter (LISTY / baits) - the sheet; done() when closed
    function okno(id, done) {
        const L = letterData(id);
        if (!L || !has() || isModal()) return false;
        const body = [].concat(w.tekstMoze("list." + id + ".tresc") || ["..."]).join("\n");
        const lines = [];
        for (const p of body.split("\n")) for (const l of wrapText(p, 44)) lines.push(l);
        const W = 560, H = Math.min(Graphics.height - 40, 150 + lines.length * 30 + 20);
        const rect = new Rectangle(Math.floor((Graphics.width - W) / 2), Math.floor((Graphics.height - H) / 2), W, H);
        const ink = /dziadek/.test(id) ? "#4a2f17" : "#2a2218";
        const win = new Window_PocztaList(rect, { od: w.tekstMoze("list." + id + ".od") || "?", lines, ink });
        T.audio.se("Book1", { volume: 60 });
        return openModal(win, done);
    }

    // the bag (key B): the letters with the addressee, the hours and where to look; O on a letter - the secret reading (twice asked)
    class Window_PocztaTorba extends Window_Base {
        constructor(rect) {
            super(rect);
            this.opacity = 0;
            this._i = 0; this._ask = 0; this._t = 0;
            this.paint();
        }
        items() { return bagList(); }
        paint() {
            const c = this.contents, W = this.innerWidth, H = this.innerHeight, it = this.items();
            c.clear();
            c.fillRect(0, 0, W, H, "#000000");
            c.fillRect(0, 0, W, 3, YEL); c.fillRect(0, H - 3, W, 3, YEL); c.fillRect(0, 0, 3, H, YEL); c.fillRect(W - 3, 0, 3, H, YEL);
            c.fontFace = $gameSystem.mainFontFace(); c.fontSize = 24; c.textColor = YEL; c.outlineWidth = 0;
            c.drawText(tx("torba.naglowek")[0] + "  " + it.length + "/" + D.TORBA, 18, 8, W - 36, 30, "left");
            c.fontSize = 20;
            if (!it.length) { c.textColor = "#cfcfcf"; c.drawText(tx("torba.pusta")[0], 18, 60, W - 36, 28, "left"); }
            it.forEach((x, i) => {
                const y = 46 + i * 54, sel = i === this._i;
                if (sel) { c.fillRect(10, y - 2, W - 20, 52, "#2b2410"); c.fillRect(10, y - 2, 4, 52, YEL); }
                c.textColor = sel ? YEL : "#ffffff";
                const to = x.L.to ? imie(x.L.to) : "?";
                c.drawText(to + "  -  " + windowText(x.L) + (S().opened[x.id] ? "  " + tx("torba.otwarte") : ""), 22, y, W - 44, 24, "left");
                c.fontSize = 16; c.textColor = "#b8b8b8";
                c.drawText(x.L.to ? tx("gdzie." + x.L.to) : tx("gdzie.bohater"), 22, y + 24, W - 44, 22, "left");
                c.fontSize = 20;
            });
            c.fontSize = 17; c.textColor = YEL;
            const hint = this._ask === 1 ? fill(tx("torba.pytanie"), { kto: it[this._i] ? imie(it[this._i].L.to || "?") : "" }) + "  O / Esc"
                : this._ask === 2 ? tx("torba.pytanie2") + "  O / Esc" : "W/S - wybór   O - przeczytaj w tajemnicy   Esc - zamknij";
            c.drawText(hint, 18, H - 30, W - 36, 24, "left");
        }
        update() {
            super.update();
            const it = this.items();
            if (this._ask) {
                if (okKey()) {
                    if (this._ask === 1) { this._ask = 2; this.paint(); } else { this._ask = 0; const id = it[this._i] && it[this._i].id; Input.clear(); readSecret(id); }
                } else if (backKey()) { this._ask = 0; this.paint(); Input.clear(); }
                return;
            }
            if (Input.isRepeated("down") && it.length) { this._i = (this._i + 1) % it.length; this.paint(); T.audio.se("Cursor1", { volume: 40 }); }
            else if (Input.isRepeated("up") && it.length) { this._i = (this._i + it.length - 1) % it.length; this.paint(); T.audio.se("Cursor1", { volume: 40 }); }
            else if (okKey() && it.length) { this._ask = 1; this.paint(); Input.clear(); }
            else if (backKey()) closeModal();
        }
    }
    function torba() {
        if (!has() || isModal() || !started()) return false;
        const n = Math.max(1, bagList().length), W = 600, H = Math.min(Graphics.height - 30, 110 + n * 54);
        const win = new Window_PocztaTorba(new Rectangle(Math.floor((Graphics.width - W) / 2), Math.floor((Graphics.height - H) / 2), W, H));
        return openModal(win);
    }
    // the secret reading: the letter's text, a clue now and then, the seal opened; the third one costs Gawron's trust
    function readSecret(id) {
        const s = S(), L = letterData(id);
        if (!L) { closeModal(); return; }
        closeModal();
        const first = !s.opened[id];
        s.opened[id] = 1;
        if (first) {
            s.secrets++;
            if (L.id === "l2_bez") s.bezCzytany = day();
            const zk = L.wosk === "zielony" ? "baltazar" : L.wosk === "czerwony" ? "cyryl" : null;
            if (zk) { w.mysl(["(" + (zk === "baltazar" ? tx("poszlaka.baltazar") : tx("poszlaka.cyryl")) + ")"]); }
            if (s.secrets >= D.ZAUFANIE_PROG && s.trust) { s.trust = 0; T.popup(tx("napis.zaufanie"), { top: true, color: "#ff9f8f" }); T.emit("poczta", { co: "zaufanie" }); }
        }
        setTimeout(() => okno(id), 20);
    }
    // sealing again at the table (the candle and the wax are there)
    function zalej() {
        const s = S(), ids = s.bag.filter(id => s.opened[id] && !s.sealed[id]);
        if (!ids.length) { T.popup(tx("zalej.nic")[0], { kind: "info" }); return; }
        for (const id of ids) s.sealed[id] = 1;
        T.audio.se("Fire1", { volume: 35, pitch: 140 });
        w.mysl(tx("zalej.zrobione"));
    }

    // ==================================================================
    // 3. The scenes
    // ==================================================================
    const scena = { kroki: [], t: 0, mapa: 0 };
    function graj(kroki) { scena.kroki = kroki.slice(); scena.t = 0; scena.mapa = $gameMap.mapId(); }
    const busy = () => scena.kroki.length > 0;
    function scenaTick() {
        if (!scena.kroki.length) return;
        if ($gameMap.mapId() !== scena.mapa) { scena.kroki = []; return; }
        if (scena.t > 0) { scena.t--; return; }
        const k = scena.kroki.shift();
        const ch = typeof k.kto === "function" ? k.kto() : k.kto;
        if (k.tekst && ch && SB() && SB().say) SB().say(ch, k.tekst, k.klatki || 150);
        if (k.dzwiek) T.audio.se(k.dzwiek[0], { volume: k.dzwiek[1] || 80, pitch: k.dzwiek[2] || 100 });
        if (k.mysl) w.mysl([k.mysl]);
        if (typeof k.zrob === "function") { try { k.zrob(); } catch (e) { report("scena", e); } }
        scena.t = k.czekaj || 0;
    }
    const tavernNpc = key => { const L = T.api("TavernLife"); try { return L && L.npc && onMap(D.MAP.tawerna) ? L.npc(key) : null; } catch (e) { return null; } };
    const evOf = key => {
        if (key === "bohater") return $gamePlayer;
        const e = tavernNpc(key) || (TL() && TL().eventOf ? TL().eventOf(key) : null);
        return e && !(e._town && e._town.hidden) ? e : null;
    };
    const actor = id => (has() && $gameMap.event(id)) || null;
    function mowca(ctx, key) {
        if (key === "kaptur") { const a = actor(D.KAPTUR.id); return a ? { id: a.eventId(), name: "" } : null; }
        if (key === "cyryl") { const a = actor(CYRYL_ACTOR); if (a && !a._transparent) return { id: a.eventId(), name: "" }; }
        const e = evOf(key) || (TL() && TL().eventOf ? TL().eventOf(key) : null);
        return e && e.eventId ? { id: e.eventId(), name: "" } : null;
    }
    // commands played from a script of an event: as a child of that interpreter (the map's own one is busy with the event)
    function run(interp, out) {
        if (!out || !out.length) return;
        if (interp && interp.setupChild) interp.setupChild(out.concat([C(0, [])]), interp.eventId ? interp.eventId() : 0);
        else w.uruchom(null, out);
    }
    // when the map's interpreter is free (no event, no message): fn once - for what a timer starts
    function kiedyWolne(fn) {
        let n = 0;
        const iv = setInterval(() => {
            if (!has() || ++n > 300) { clearInterval(iv); return; }
            if ($gameMap.isEventRunning() || $gameMessage.isBusy()) return;
            clearInterval(iv);
            try { fn(); } catch (e) { report("kiedyWolne", e); }
        }, 200);
    }
    // a talk (commands) in the map's interpreter
    function powiedz(entries, ctx) {
        const out = w.build(entries, Object.assign({ spk: { id: 0, name: "" } }, ctx || {}), []);
        w.uruchom(null, out);
    }

    // ---- S1: the raven with the letter over the screen (6:30, 17:30), the ravens' sound
    let fly = null;
    function przelot(then) {
        if (!has() || fly || !(SceneManager._scene instanceof Scene_Map)) return;
        const sc = SceneManager._scene, sp = new Sprite(ImageManager.loadSystem("Kruk"));
        const F = (window.KrukData && KrukData.SHEET) || { cell: 48 }, cell = F.cell || 48, frames = (F.letterFly && F.letterFly[1]) || [1, 2, 3, 4, 5, 6, 7, 8], row = (F.letterFly && F.letterFly[0]) || 4;
        sp.anchor.set(0.5, 0.9);
        sp.scale.set(-1.6, 1.6);
        sp.x = Graphics.width + 60; sp.y = 80 + Math.random() * 60; sp.z = 9;
        sc.addChild(sp);
        fly = { sp, t: 0, cell, frames, row, then };
        T.audio.se("Crow", { volume: 40, pitch: 110 });
    }
    function przelotTick() {
        if (!fly) return;
        const f = fly, sp = f.sp;
        f.t++;
        const fr = f.frames[Math.floor(f.t / 4) % f.frames.length];
        if (sp.bitmap && sp.bitmap.isReady()) sp.setFrame(fr * f.cell, f.row * f.cell, f.cell, f.cell);
        sp.x -= 3.2; sp.y += Math.sin(f.t / 12) * 0.6 + 0.1;
        if (f.t === 70) T.audio.se("Evasion1", { volume: 30, pitch: 130 });
        if (sp.x < -80 || !(SceneManager._scene instanceof Scene_Map) || f.t > 700) {
            try { sp.parent && sp.parent.removeChild(sp); sp.destroy(); } catch (e) { /* (the scene is gone) */ }
            const then = f.then; fly = null;
            if (then) then();
        }
    }
    // arrival of the ravens: the notice (once per slot), the flyover when the hero is outdoors on the town's map
    let lastSlot = "";
    function przylotTick() {
        if (!started()) return;
        const h = hour(), d = day();
        const slot = h >= D.PRZYLOT[1] ? "w" : h >= D.PRZYLOT[0] ? "r" : "";
        if (!slot) return;
        const key = d + ":" + slot;
        if (S().arrivals[key] || lastSlot === key) return;
        lastSlot = key;
        if (!onTable().length) return;
        S().arrivals[key] = 1;
        T.popup(tx(slot === "r" ? "napis.listyRano" : "napis.listyWieczor"), { top: true, color: "#ffd866" });
        if (onMap(D.MAP.miasto) && T.isCalm(SceneManager._scene)) przelot();
    }

    // ---- S3: Grum reads (the tavern goes quiet for a moment)
    function scenaGrum() {
        if (!onMap(D.MAP.tawerna) || busy()) return;
        S().sc.s3 = day();
        const g = evOf("grum"), b = evOf("borgar");
        graj([{ czekaj: 20 }, { kto: g, tekst: "Kruczek... Dwa lata razem w lesie.", czekaj: 150 },
            { kto: g, tekst: "Borgar! Kolejka dla każdego! Za Kruczka!", dzwiek: ["Applause1", 40, 90], czekaj: 140 },
            { kto: b, tekst: "Za Kruczka.", czekaj: 60 }]);
    }

    // ---- S4: the letter on the grave (the old cemetery of Map008; the bell once at dusk)
    function grob(interp) {
        if (!inBag("l2_gryta")) return;
        const out = [];
        M.choiceTo(out, [tx("gryta.opcja.grob"), tx("gryta.opcja.nie")], [M.script([], "Poczta.scenaGrob()"), []], 1);
        interp.setupChild(out.concat([C(0, [])]), interp.eventId());
    }
    function scenaGrob() {
        if (!inBag("l2_gryta") || !onMap(D.MAP.miasto)) return;
        const lines = [].concat(tx("grob.tekst")), steps = [{ czekaj: 10, dzwiek: ["Bell1", 35, 80] }];
        for (const l of lines) steps.push({ kto: () => $gamePlayer, tekst: l.replace(/^> /, ""), czekaj: 260 });
        steps.push({ dzwiek: ["Crow", 30, 90], zrob: () => { grytaRozwiaz("grob"); } });
        graj(steps);
    }
    function odeslij(interp) {
        if (!inBag("l2_gryta")) return;
        grytaRozwiaz("odeslij");
        run(interp, M.linesTo([], speakerOf("gawron"), tx("gryta.odeslij"), null, 0, { akapity: true, kto: k => speakerOf(k) }));
    }

    // ---- S5: the night watch, the thief at 3:10 and the chase (the hooded actor 4400 runs; the dropped thing; the chase ends in the market)
    const CYRYL_ACTOR = 4403;
    const hide = a => { if (!a) return; a.setTransparent(true); a.setThrough(true); a.locate(0, 0); };
    function show(a, sheet, x, y, d) { if (!a) return; a.setImage(sheet, 0); a.locate(x, y); a.setDirection(d || 2); a.setThrough(true); a.setTransparent(false); a.setMoveSpeed(4); }
    function walkTo(a, tx_, ty_, limit) {
        const H = window.Hunting, RA = window.RoamingActor;
        if (!a || a.isMoving()) return false;
        if (a.x === tx_ && a.y === ty_) return true;
        const key = tx_ + "," + ty_;
        if (a._pzT !== key) { a._pzT = key; a._pzN = 0; }
        if (++a._pzN > (limit || 500)) { a.locate(tx_, ty_); a._pzN = 0; return true; }   // (stuck: nobody is left standing in a wall)
        const d = H && H.path8 ? H.path8(a, tx_, ty_, { key: "poczta" }).dir : a.findDirectionTo(tx_, ty_);
        if (d > 0) { if (RA && RA.step) RA.step(a, d); else a.moveStraight(d); }
        return false;
    }
    let chase = null;
    const CHASE = [[112, 18], [108, 22], [100, 30], [92, 40], [80, 46], [70, 50], [60, 50]];
    function scenaNoc() {
        const s = S();
        if (s.noc || !onMap(D.MAP.kruczarnia) || busy()) return;
        s.noc = day();
        const k = actor(D.KAPTUR.id), g = evOf("gawron");
        if (!k) return;
        $gameScreen.startFadeOut(30);
        setTimeout(() => {
            $gameSystem.setDayNightHour(3.1);
            $gameScreen.startFadeIn(30);
            show(k, D.KAPTUR.sheet, 5, 12, 8);
            k.setMoveSpeed(3);
            const rz = Math.random() < 0.5 ? "zielony" : "plama";
            let phase = 0;
            graj([{ czekaj: 40, mysl: tx("noc.wejscie")[0] }, { czekaj: 10, zrob: () => { phase = 1; } }]);
            const timer = setInterval(() => {
                if (!onMap(D.MAP.kruczarnia)) { clearInterval(timer); hide(k); return; }
                if (phase === 1) { if (walkTo(k, 4, 9)) { phase = 2; k.setDirection(8); w.mysl([tx("noc.wejscie")[1], tx("noc.kaptur")[0]]); w.mysl([tx("noc.kaptur")[1]]); } }
                else if (phase === 2 && Math.abs($gamePlayer.x - k.x) + Math.abs($gamePlayer.y - k.y) < 6 && !isModal()) {
                    phase = 3; w.mysl(["> Stój!"]); T.audio.se("Cursor3", { volume: 70 });
                    if (g) SB() && SB().say && SB().say(g, "Co tam?", 100);
                    setTimeout(() => { phase = 4; k.setMoveSpeed(5); s.rzecz = rz; w.mysl(tx(rz === "zielony" ? "noc.rzecz.zielony" : "noc.rzecz.plama")); poszlaka("rzecz"); }, 800);
                } else if (phase === 4) { if (walkTo(k, 5, 12)) { clearInterval(timer); hide(k); startChase(); } }
            }, 60);
        }, 700);
    }
    function startChase() {
        if (!actor(D.KAPTUR.id)) return;
        chase = { i: 0, t: 0, startedAt: Graphics.frameCount, expires: Graphics.frameCount + 60 * 90 };
    }
    function chaseTick() {
        if (!chase) return;
        const k = actor(D.KAPTUR.id);
        if (!k) { chase = null; return; }
        if (!chase.armed && Graphics.frameCount > chase.expires) { chase = null; return; }
        if (!chase.armed) {
            if (!onMap(D.MAP.miasto)) return;
            chase.armed = true; chase.i = 0; chase.t = 0;
            show(k, D.KAPTUR.sheet, D.DRZWI.przed[0], D.DRZWI.przed[1] + 1, 2);
            k.setMoveSpeed(5);
        }
        chase.t++;
        if (chase.t > D.NOC.pogon * 60 || chase.i >= CHASE.length) {
            hide(k); chase = null;
            w.mysl([tx("noc.pogon.koniec")[0]]);
            return;
        }
        const g = CHASE[chase.i];
        if (walkTo(k, g[0], g[1], 240)) chase.i++;
    }

    // ---- S6: the third night - the bait, the parcel
    function scenaPrzynieta() {
        const s = S();
        if (s.s6 || !onMap(D.MAP.miasto) || busy()) return;
        s.s6 = day();
        const k = actor(D.KAPTUR.id), c = actor(CYRYL_ACTOR);
        if (!k || !c) return;
        show(k, D.KAPTUR.sheet, 113, 14, 4); show(c, "$Npc_Cyryl", 111, 14, 6);
        k.setMoveSpeed(3);
        graj([{ czekaj: 30, mysl: tx("przynieta.noc")[0] },
            { kto: k, tekst: "Jest kamień?", czekaj: 120 },
            { kto: c, tekst: "Jutro. Dziś Gawron nie śpi. Paczka. Reszta w piątek.", czekaj: 180 },
            { czekaj: 60, mysl: tx("przynieta.noc")[3] },
            { kto: k, tekst: "Za dużo czasu. Czarne Oczy nie czekają.", czekaj: 150 },
            { czekaj: 40, mysl: tx("przynieta.cyryl")[0], zrob: () => { s.cyrylZnany = day(); const q = tx("cyryl.notatka"); T.call("Journal", "addNote", q[0], q[1]); w.autoChecks(); } },
            { czekaj: 60, zrob: () => { hide(k); hide(c); } }]);
    }

    const bars = on => { const h = T.api("CleanHUD"); try { if (h && h.sceneBars) h.sceneBars(on); } catch (e) { report("bars", e); } };
    // ---- S7: the truth in the Kruczarnia at 3:00 and the choice
    function scenaPrawda() {
        const s = S();
        if (s.finale || !onMap(D.MAP.kruczarnia) || busy() || stepNow() !== 4) return;
        const c = actor(CYRYL_ACTOR);
        if (!c) return;
        $gameScreen.startFadeOut(30);
        setTimeout(() => {
            $gameSystem.setDayNightHour(D.FINAL.godzina);
            $gameScreen.startFadeIn(30);
            show(c, "$Npc_Cyryl", 5, 12, 8);
            c.setMoveSpeed(3);
            let ph = 0;
            bars(true);
            const timer = setInterval(() => {
                if (!onMap(D.MAP.kruczarnia)) { clearInterval(timer); hide(c); bars(false); return; }
                if (ph === 0 && walkTo(c, 4, 9)) {
                    ph = 1; clearInterval(timer);
                    const spkG = speakerOf("gawron"), spkC = { id: c.eventId(), name: "" };
                    const ctx = { spk: spkG };
                    const out = [];
                    const kto = key => (key === "cyryl" ? spkC : speakerOf(key));
                    M.linesTo(out, spkG, tx("finaly.gawron"), null, 0, { akapity: true, kto });
                    M.linesTo(out, spkC, tx("finaly.cyryl"), null, 0, { akapity: true, kto });
                    for (const l of w.rozmowa("final", ctx)) out.push(l);
                    kiedyWolne(() => w.uruchom(null, out));
                }
            }, 60);
        }, 700);
    }
    function final(ctx, how) {
        const s = S();
        if (s.finale) return;
        s.finale = how;
        const c = actor(CYRYL_ACTOR);
        if (how === "wydaj") { opinion(D.OPINIA.wydal, imie("cyryl")); T.call("Garnizon", "addFavor", D.FINAL.przychylnosc); w.setFlag("listonoszWydany"); }
        if (how === "przestaw") w.setFlag("listonoszFalszywe");
        if (how === "uciekaj") { opinion(D.OPINIA.uciekl, imie("cyryl")); w.setFlag("listonoszUciekl"); }
        const key = TL() && TL().setGone ? TL().setGone("cyryl", how === "przestaw" ? false : true) : 0;
        void key;
        if (c) setTimeout(() => hide(c), 600);
        bars(false);
        setTimeout(() => scenaOdlot(), 1500);
        w.autoChecks();
    }
    // ---- S8: the farewell at dawn - the ravens fly out with their parcels, Gawron hands the badge over
    function scenaOdlot() {
        const s = S();
        if (s.epilog || !onMap(D.MAP.kruczarnia)) return;
        s.epilog = day();
        $gameSystem.setDayNightHour(6.2);
        for (let i = 0; i < 3; i++) setTimeout(() => przelot(), i * 700);
        const out = [];
        M.linesTo(out, speakerOf("gawron"), tx("epilog.gawron"), null, 0, OPT);
        M.linesTo(out, speakerOf("gawron"), tx("epilog.koniec"), null, 0, OPT);
        kiedyWolne(() => w.uruchom(null, out));
        if (T.call("Farming", "gainItemByName", "Odznaka kruczego listonosza") === undefined) { /* the badge is a note only (no item in the base) */ }
        gold(D.FINAL.plata);
        T.popup(tx("napis.odznaka"), { top: true, color: "#ffd866" });
        const p = w.pair("notatki.koniec"); if (p) T.call("Journal", "addNote", p[0], p[1]);
        s.poczta = day();
        w.setFlag("listonoszPoczta");
        T.popup(tx("napis.stalaPoczta"), { top: true, color: "#9ff0a8" });
        w.autoChecks();
    }

    // ==================================================================
    // 4. The Kruczarnia, the door, the table, the perches, the actors
    // ==================================================================
    function drzwi(interp) {
        if (!has()) return;
        const s = S(), hr = hour(), act = w.active("W20") || w.done("W20");
        const night = hr < D.GODZINY[0] || hr >= D.GODZINY[1];
        let allowed = act && (!night || (started() && stepNow() >= 2));
        if (!allowed || (!started() && !(w.active("W20")))) { T.popup(tx(night ? "drzwi.zamkniete" : act ? "drzwi.czeka" : "drzwi.zamkniete")[0], { color: "info" }); return; }
        T.audio.se("Door1", { volume: 80 });
        $gamePlayer.reserveTransfer(D.MAP.kruczarnia, 5, 11, 8, 0);
    }
    // the table: the menu - take the letters, the bag, seal again, send the raven, write the baits, watch the night, send back
    function stol(interp) {
        if (!has() || !interp) return;
        const s = S(), spk = speakerOf("gawron"), out = [], rows = [];
        const wait = onTable();
        const bez = onTable().find(L => L.special === "bez");
        if (!started()) { M.sayTo(out, { id: 0, name: "" }, tx("stol.pusty")[0], 0); run(interp, out); return; }
        // the day letters of grandpa: Gawron hands them over by hand (S2)
        const dz = wait.find(L => L.special === "dziadek" || L.special === "dziadek5");
        if (dz) { dziadek(dz, interp); return; }
        rows.push({ label: tx("stol.opcja.wez"), js: "Poczta.wez(this)" });
        rows.push({ label: tx("stol.opcja.torba"), js: "Poczta.otworzTorbe()" });
        if (s.bag.some(id => s.opened[id] && !s.sealed[id])) rows.push({ label: tx("stol.opcja.zalej"), js: "Poczta.zalej()" });
        if (T.api("Kruk") && Kruk.state && Kruk.state().stage === "tame" && s.bag.some(id => letterData(id) && letterData(id).kruk)) rows.push({ label: tx("stol.opcja.kruk"), js: "Poczta.wyslijKruka(this)" });
        if (stepNow() === 3 && !s.baits) rows.push({ label: tx("stol.opcja.napisz"), js: "Poczta.napisz(this)" });
        if (inBag("l2_gryta")) rows.push({ label: tx("stol.opcja.odeslij"), js: "Poczta.odeslij(this)" });
        const night = hour() >= D.NOC.czuwanie[0] || hour() < D.NOC.czuwanie[1];
        if (night && stepNow() === 2 && !s.noc) rows.push({ label: "Czuwaj do trzeciej", js: "Poczta.czuwaj('noc')" });
        if (night && stepNow() === 3 && s.baits && !s.s6 && nocyOd() >= nocyPotrzeba()) rows.push({ label: "Czekaj w cieniu pod wieżą", js: "Poczta.czuwaj('przynieta')" });
        if (night && stepNow() === 4 && !s.finale) rows.push({ label: "Czekaj na Cyryla (3:00)", js: "Poczta.czuwaj('prawda')" });
        rows.push({ label: tx("stol.opcja.nic"), js: "" });
        const labels = rows.map(r => r.label), branches = rows.map(r => (r.js ? M.script([], r.js) : []));
        M.choiceTo(out, labels, branches, labels.length - 1);
        run(interp, out);
    }
    const nocyOd = () => (S().baits ? Math.max(0, day() - S().baits) : 0);
    const nocyPotrzeba = () => (S().trust ? 3 : 4);   // (Gawron, who lost his trust in the hero, is wary: one more night)
    function wez(interp) {
        const r = take();
        if (!r.n && !onTable().length) { run(interp, M.sayTo([], { id: 0, name: "" }, tx("stol.pusty")[0], 0)); return; }
        const out = [];
        if (!S().trust && !S().trustSaid) { S().trustSaid = 1; M.linesTo(out, speakerOf("gawron"), tx("gawron.zaufanie"), null, 0, OPT); M.linesTo(out, speakerOf("gawron"), tx("gawron.zaufanieKoniec"), null, 0, OPT); }
        if (r.haczyk) {
            M.linesTo(out, speakerOf("gawron"), tx("haczyk.gawron"), null, 0, OPT);
            poszlaka("wosk");
            const p = w.pair("notatki.zdrajca"); if (p) T.call("Journal", "addNote", p[0], p[1]);
        }
        if (r.bez) {
            M.linesTo(out, speakerOf("gawron"), tx("bez.adresata"), null, 0, OPT);
            const p = w.pair("notatki.bez"); if (p) T.call("Journal", "addNote", p[0], p[1]);
        }
        run(interp, out);
    }
    // grandpa's letters: handed over by Gawron, read on the sheet (S2), a note; counts as delivered
    function dziadek(L, interp) {
        const s = S();
        s.taken[L.id] = day();
        s.done[L.id] = { day: day(), hour: hour(), late: 0, opened: 0, how: "reka" };
        const out = [];
        M.linesTo(out, speakerOf("gawron"), tx("dziadek.gawron"), null, 0, OPT);
        out.push(C(355, ["Poczta.okno(" + JSON.stringify(L.id) + ")"]));
        out.push(C(355, ["this.setWaitMode('poczta')"]));
        run(interp, out);
        const p = w.pair("notatki.dziadek"); if (p && L.id === "l1_dziadek") T.call("Journal", "addNote", p[0], p[1]);
        w.autoChecks();
    }
    function napisz(interp) {
        const s = S();
        if (s.baits) return;
        const out = [];
        if (!s.bezCzytany) {   // Gawron reads the letter without an address aloud - once, as an exception
            s.bezCzytany = day();
            M.linesTo(out, speakerOf("gawron"), tx("bez.czytanie"), null, 0, OPT);
        }
        s.baits = day();
        for (const b of D.PRZYNETY) { if (!inBag(b.id) && !s.taken[b.id]) { s.bag.push(b.id); s.taken[b.id] = day(); } }
        M.linesTo(out, speakerOf("gawron"), tx("przynety.wstep"), null, 0, OPT);
        M.sayTo(out, { id: 0, name: "" }, tx("przynety.napisane")[0], 0, { akapity: true });
        run(interp, out);
        T.popup(fill(tx("napis.torba"), { n: S().bag.length }), { kind: "info" });
        w.autoChecks();
    }
    function wyslijKruka(interp) {
        const s = S(), ids = s.bag.filter(id => letterData(id) && letterData(id).kruk && !s.wyslane[id]);
        if (!ids.length) return;
        if (s.wsent === day()) { T.popup("Kruk dziś już leciał.", { kind: "info" }); return; }
        const id = ids[0];
        s.wyslane[id] = day(); s.wsent = day();
        const L = letterData(id);
        T.popup(tx("napis.kruk"), { kind: "info" });
        s.bag.splice(s.bag.indexOf(id), 1);
        s.done[id] = { day: day(), hour: hour(), late: 0, opened: s.opened[id] ? 1 : 0, how: "kruk" };
        pay(L, false, !!s.opened[id]);
        w.autoChecks();
    }
    function czuwaj(co) {
        const s = S();
        if (co === "noc") { const g = hour() < D.NOC.czuwanie[1] || hour() >= D.NOC.czuwanie[0]; if (g) setTimeout(scenaNoc, 50); }
        else if (co === "przynieta") {
            $gameScreen.startFadeOut(30);
            setTimeout(() => { $gamePlayer.reserveTransfer(D.MAP.miasto, 112, 17, 8, 0); $gameSystem.setDayNightHour(23.5); }, 500);
            s.wait6 = 1;
        } else if (co === "prawda") setTimeout(scenaPrawda, 50);
    }
    function przegrodki(interp) { run(interp, M.sayTo([], { id: 0, name: "" }, tx("przegrodki." + (1 + Math.floor(Math.random() * 2)))[0], 0)); }
    function biurko() { const e = actor(CYRYL_ACTOR); if (!e) return; /* (his desk: nothing to take) */ }
    function kruk(interp, n) { T.audio.se("Crow", { volume: 40, pitch: 90 + n * 6 }); const l = tx("kruk." + n); if (l && l[0]) run(interp, M.sayTo([], { id: 0, name: "" }, l[0], 0)); }

    // the perches: the ravens move now and then (peck, caw) - only the Kruczarnia's own events, once a second
    function krukiTick() {
        if (!onMap(D.MAP.kruczarnia) || Graphics.frameCount % 45) return;
        const night = hour() < 6 || hour() >= 20;
        for (const e of $gameMap.events()) {
            const d = e.event && e.event();
            if (!d || !/^Żerdź \(kruk/.test(d.name)) continue;
            if (night) { e.setDirection(8); e.setPattern(Math.floor(Graphics.frameCount / 45) % 3); continue; }
            if (Math.random() < 0.18) { const p = Math.random() < 0.5 ? 2 : 1; e.setPattern(p); setTimeout(() => e.setPattern(0), 500 + Math.random() * 700); if (p === 1 && Math.random() < 0.3) T.audio.se("Crow", { volume: 18, pitch: 90 + Math.random() * 30 }); }
        }
    }

    // ---- injected events: the hooded actor, the grave of Gryta, Cyryl as an actor (hidden at rest)
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    const page = (cmds, o) => Object.assign({ conditions: Object.assign({}, BLANK), directionFix: false, image: { tileId: 0, characterName: "", direction: 2, pattern: 1, characterIndex: 0 },
        list: cmds || [C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: 4, moveType: 0, priorityType: 1,
        stepAnime: false, through: true, trigger: 0, walkAnime: true }, o || {});
    const actorEv = (id, name, sheet) => ({ id, name, note: "", x: 0, y: 0, pages: [page(null, { image: { tileId: 0, characterName: sheet, direction: 2, pattern: 1, characterIndex: 0 } })] });
    T.inject([D.MAP.miasto, D.MAP.kruczarnia], { ids: D.IDS, owner: D.OWNER, build: (data, mapId) => {
        const list = [actorEv(D.KAPTUR.id, "Człowiek w kapturze", D.KAPTUR.sheet), actorEv(CYRYL_ACTOR, "Cyryl (scena)", "$Npc_Cyryl")];
        if (mapId === D.MAP.miasto) {
            const g = D.GRYTA.grob;
            list.push({ id: 4401, name: "Grób starej Gryty", note: "", x: g[0], y: g[1], pages: [page([C(355, ["Poczta.grob(this)"]), C(0, [])], { through: false, trigger: 0, walkAnime: false })] });
        }
        return list;
    } });
    // the hooded actor and Cyryl rest hidden (set at map start)
    T.on("mapReady", () => {
        if (!has()) return;
        for (const id of [D.KAPTUR.id, CYRYL_ACTOR]) { const a = actor(id); if (a && !(chase && chase.armed && id === D.KAPTUR.id)) hide(a); }
        scena.kroki = [];
        if (onMap(D.MAP.kruczarnia)) mapaWejscie();
    }, { owner: PLUGIN });
    // the first time in: Gawron's talk (the meeting) - the thread starts here
    function mapaWejscie() {
        const s = S();
        if (!s.start && w.active("W20")) {
            s.start = day();
            setTimeout(() => {
                const spk = speakerOf("gawron");
                const out = w.rozmowa("spotkanie", { spk, kto: k => speakerOf(k) });
                if (!out.length) return;
                const pair = w.pair("notatki.listonosz");
                kiedyWolne(() => w.uruchom(null, out));
                if (pair) T.call("Journal", "addNote", pair[0], pair[1]);
                w.mysl([tx("mysl.torba")]);
                w.autoChecks();
            }, 800);
        }
    }
    function przysiega(ctx, how) { S().oath = how; w.autoChecks(); }

    // ---- the talks (Tawerna.talk): a letter in the bag for the one spoken to
    T.talk.takeover({ owner: PLUGIN, who: key => has() && started() && (lettersFor(key).length > 0 || maListy(key) || !!szlakDla(key)),
        priority: T.talk.PRIORITY.errand - 10, run: ctx => { try { return talkFor(ctx.who, ctx.ev); } catch (e) { report("talk", e); return null; } } });

    // ==================================================================
    // Steps (conditions of the chapters), the words, the F9 rows, the clock
    // ==================================================================
    const doneN = ids => ids.filter(id => S().done[id]).length;
    const W1 = ["l1_hanka", "l1_tadek", "l1_ambrozy", "l1_wit", "l1_soltys"];
    const torbaText = () => {
        const b = bagList();
        return b.length ? tx("torba.naglowek")[0] + ": " + b.map(x => (x.L.to ? imie(x.L.to) : "?")).join(", ") + "." : "";
    };
    w.haki({
        otwarta: () => has() && day() >= D.OD_DNIA,
        maList: (ctx, id) => has() && inBag(id),
        maKtoList: ctx => has() && D.BYWALCY.some(k => lettersFor(k).length > 0),
        kluczJest: (ctx, key) => ctx.key === key,
        k1Gotowe: () => has() && started() && doneN(W1) >= 5 && !!S().done.l1_dziadek,
        k2Gotowe: () => has() && !!S().done.l2_grum && !!S().done.l2_melia && !!S().done.l2_hanka && !!S().gryta && !!S().bez,
        k3Gotowe: () => has() && !!S().noc && clueCount() >= 3,
        k4Gotowe: () => has() && !!S().s6,
        k5Gotowe: () => has() && !!S().finale && !!S().epilog,
        k1Zmienne: () => ({ k1: !started() ? tx("kroki.k1.start") : doneN(W1) >= 5 ? tx("kroki.k1.dziadek") : fill(tx("kroki.k1.torba"), { n: doneN(W1), torba: torbaText() }) }),
        k2Zmienne: () => ({ k2: (fill(tx("kroki.k2.torba"), { torba: torbaText(), zmarly: inBag("l2_gryta") ? tx("kroki.k2.zmarly") : "" }) + (S().bez && !S().bezCzytany ? " " + tx("kroki.k2.bez") : "")).replace(/\s+/g, " ").trim() }),
        k3Zmienne: () => ({ k3: S().noc ? fill(tx("kroki.k3.po"), { rzecz: S().rzecz === "zielony" ? "świecę z zielonym woskiem" : "strzęp rękawa" }) : fill(tx("kroki.k3.start"), { n: Math.min(3, clueCount()), noc: tx("kroki.k3.noc") }) }),
        k4Zmienne: () => ({ k4: !S().baits ? tx("kroki.k4.start") : nocyOd() < nocyPotrzeba() ? fill(tx("kroki.k4.czekaj"), { dzien: "za " + Math.max(0, nocyPotrzeba() - nocyOd()) + " dni" }) : tx("kroki.k4.noc") }),
        k5Zmienne: () => ({ k5: S().finale ? tx("kroki.k5.koniec") : tx("kroki.k5.start") }),
        mowca, przysiega, doreczLista, final, poszlaka: (ctx, k) => poszlaka(k),
        f9Przygotuj: () => has(),
        f9Tydzien: (ctx, n) => { const s = S(); if (!s.start) s.start = day() - (n - 1) * 7; if (n >= 2 && !s.start) s.start = day() - 7; return true; },
        f9Torba: ctx => { const s = S(); if (!s.start) s.start = day(); let k = 0; for (const L of D.LISTY) { if (s.bag.length >= D.TORBA) break; if (!s.taken[L.id] && L.ch <= weekOf(day()) + 1 && L.to && !s.bag.includes(L.id)) { s.bag.push(L.id); s.taken[L.id] = day(); k++; } } return { say: "Do torby: " + k }; },
        f9Czas: ctx => { $gameSystem.setDayNightHour(6.5); return { say: "Godzina 6:30" }; },
        f9Zdrajca: ctx => { const s = S(); s.cyrylZnany = day(); s.s6 = s.s6 || day(); w.autoChecks(); return { say: "Cyryl znany" }; }
    });
    // the clock: the arrivals, the scenes, the ravens
    let tickN = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        try {
            przelotTick();
            if (++tickN % 30 === 0) przylotTick();
            if (busy()) scenaTick();
            chaseTick();
            krukiTick();
        } catch (e) { report("zegar", e); }
    }, { owner: PLUGIN, name: "poczta" });
    // the third night's wait: the hero is under the tower - the scene plays
    T.onMapUpdate(() => {
        if (!has() || !S().wait6 || !onMap(D.MAP.miasto) || busy()) return;
        if (isModal() || $gameMap.isEventRunning()) return;
        S().wait6 = 0;
        $gameScreen.startFadeIn(40);
        scenaPrzynieta();
    }, { owner: PLUGIN, name: "poczta6" });
    // the key B opens the bag
    Input.keyMapper[66] = "pocztaTorba";
    T.onMapUpdate(() => {
        if (!has() || !started() || !Input.isTriggered("pocztaTorba") || isModal() || $gameMap.isEventRunning() || $gameMessage.isBusy()) return;
        if (T.isCalm(SceneManager._scene)) torba();
    }, { owner: PLUGIN, name: "poczta_B" });
    // the modal window holds the hero and the interpreter's wait
    const _canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() { return isModal() ? false : _canMove.call(this); };
    const _uwm = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === "poczta") { if (isModal()) return true; this._waitMode = ""; return false; }
        return _uwm.call(this);
    };
    // the old scene closes the window
    T.on("mapReady", () => { if (modal.win) { modal.win = null; modal.done = null; } fly = null; }, { owner: PLUGIN });

    window.Poczta = T.register(PLUGIN, {
        stan: () => S(), szlak, torba, okno, drzwi, stol, wez, zalej, odeslij, napisz, wyslijKruka, czuwaj, przegrodki, biurko, kruk, grob, scenaGrob, doreczy, inna,
        otworzTorbe: () => setTimeout(torba, 10), onTable, bagList, deliver, take, poszlaka, clueCount, stepNow, weekOf, scenaNoc, scenaPrzynieta, scenaPrawda, scenaOdlot,
        przelot, final: how => final({}, how), grytaRozwiaz, isModal, czytaj: id => readSecret(id), zalej, LISTY: D.LISTY, watek: w
    });
})();
