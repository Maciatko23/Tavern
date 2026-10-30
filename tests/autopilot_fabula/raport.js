// Raport autopilota fabuły (tests/autopilot_fabula/raport.md) z FAB.rep - wspólny dla testu i trybu oglądania.
"use strict";

const h2 = h => { const H = Math.floor(h), M = Math.floor((h % 1) * 60); return H + ":" + String(M).padStart(2, "0"); };
const when = r => "dzień " + r.day + " " + h2(r.hour || 0);
const esc = s => String(s === undefined || s === null ? "" : s).replace(/\|/g, "/").replace(/\n/g, " ");

// the minutes of waiting: FAB.rep.idle (the guard counts them), else from the day axis (the time from a "Czekam..." entry to the next one)
function idleOf(rep) {
    if (rep.idle) {
        const total = Object.values(rep.idle.byDay || {}).reduce((a, m) => a + m, 0);
        return { byLabel: rep.idle.byLabel || {}, byDay: rep.idle.byDay || {}, total, fromActs: false };
    }
    const byLabel = {}, byDay = {};
    for (const d of Object.keys(rep.days || {})) {
        const acts = rep.days[d].acts || [];
        for (let i = 0; i < acts.length; i++) {
            if (!/^(Czekam|Przygotowuję się: czekam)/.test(acts[i].w)) continue;
            const m = Math.max(0, ((acts[i + 1] ? acts[i + 1].h : 24) - acts[i].h) * 60), lab = acts[i].w.replace(/\s*\(.*$/, "");
            byLabel[lab] = (byLabel[lab] || 0) + m; byDay[d] = (byDay[d] || 0) + m;
        }
    }
    return { byLabel, byDay, total: Object.values(byDay).reduce((a, m) => a + m, 0), fromActs: true };
}

function write(fin, o) {
    const rep = fin.rep, st = fin.st, L = [];
    const days = Object.keys(rep.days).map(Number).sort((a, b) => a - b);
    const debtPaid = (rep.payments || []).filter(p => p.paid >= (st.debt ? st.debt.debt : 2500))[0];
    const earned = rep.shifts.reduce((s, x) => s + (x.total || 0), 0);
    L.push("# Autopilot fabuły - raport", "");
    L.push(`Data: ${new Date().toISOString().slice(0, 16).replace("T", " ")} · start: ${o.od ? "zapis „" + o.od + "”" : "nowa gra"} · szybkość ×${o.speed} · czas ${o.realMin} min · polityka wyborów: uczciwie i pomocnie`, "");
    L.push("## Podsumowanie", "");
    L.push(`- Doszedł do: **${st.stage}** (dzień ${st.day}, ${st.clock}, ${st.mapName}); ostatnio: ${st.doing}${st.why ? " - " + st.why : ""}`);
    L.push(`- Koniec przebiegu: ${o.stopWhy || "-"}`);
    L.push(`- Dni gry: ${rep.start ? rep.start.day : "?"} → ${st.day} · czas rzeczywisty ${o.realMin} min`);
    if (st.debt) L.push(`- Dług: spłacone ${st.debt.paid}/${st.debt.debt} G` + (debtPaid ? ` - **spłacony w dniu ${debtPaid.day}** (${h2(debtPaid.hour)})` : st.debt.done ? " - spłacony" : ` - zostało ${st.debt.left} G, dni do terminu: ${st.debt.daysLeft}`));
    L.push(`- Zmiany u Borgara: ${rep.shifts.length}, zarobek ze zmian ${earned} G (średnio ${rep.shifts.length ? Math.round(earned / rep.shifts.length) : 0} G)`);
    L.push(`- Śmierci: ${rep.deaths.length} · utknięcia: ${rep.stalls.length} · niejasności celu: ${new Set(rep.unclear.map(u => u.what)).size} · wybory: ${rep.choices.length} · obejścia błędów gry: ${(rep.workarounds || []).length} (rodzajów: ${new Set((rep.workarounds || []).map(w => String(w.what).replace(/\d+/g, "N"))).size})`);
    L.push("");

    // the three stages of the build (the task): from the chapters reached and the deepest floor of each day
    const chs = (rep.chapters || []).map(c => c.name), first = re => (rep.chapters || []).find(c => re.test(c.name));
    const deepest = Math.max(0, ...Object.values(rep.days).map(r => r.deep0 || 0), st.deepest || 0);
    const paidCh = first(/^W4|^Podziemia|^Akt III|^Po Akcie/), w4done = first(/^Podziemia|^Akt III|^Po Akcie/), a3 = first(/^Akt III/), a3done = first(/^Po Akcie/);
    L.push("## Etapy budowy", "");
    L.push(`1. **Prolog → rozdział 1 (dług):** ${debtPaid ? "zrobione - dług spłacony w dniu " + debtPaid.day + " (" + rep.shifts.filter(x => x.day <= debtPaid.day).length + " zmian)" : st.debt && st.debt.done ? "zrobione" : "nie - spłacone " + (st.debt ? st.debt.paid : 0) + "/2500"}`);
    L.push(`2. **W4 (klucz, krata) → piętro 10 → piętro 50 → Akt III:** W4 ${w4done ? "zrobione (dzień " + w4done.day + ")" : paidCh ? "w toku" : "nie zaczęte"}; najgłębiej piętro ${deepest}; Akt III ${a3done ? "rozstrzygnięty (dzień " + a3done.day + ")" : a3 ? "uzbrojony / w toku" : "nie ruszył"}`);
    L.push(`3. **Księga sygnałów (W2) → Komnata Serca → zakończenie:** ${chs.some(n => /Komnata|zakończ/i.test(n)) ? "w toku" : "nie osiągnięte"}${o.stopWhy && /etap 3/.test(o.stopWhy) ? " - " + o.stopWhy : ""}`);
    L.push("");

    L.push("## Czas na rozdział", "");
    L.push("| rozdział | od | czas gry | czas rzeczywisty |", "|---|---|---|---|");
    const ch = rep.chapters || [];
    for (let i = 0; i < ch.length; i++) {
        const a = ch[i], b = ch[i + 1] || { day: st.day, hour: st.hour, real: Date.now() };
        const gh = (b.day * 24 + b.hour) - (a.day * 24 + a.hour);
        L.push(`| ${esc(a.name)} | ${when(a)} | ${Math.floor(gh / 24)} d ${Math.round(gh % 24)} h | ${Math.round((b.real - a.real) / 60000)} min |`);
    }
    L.push("");

    L.push("## Krzywa złota i długu", "");
    L.push("Na koniec każdego dnia: złoto w sakiewce, spłacone, razem (złoto + spłacone). Cel: 2500 G do dnia 60.", "");
    L.push("```");
    const byDay = {};
    for (const [t, g, p] of rep.gold) { const d = Math.floor(t / 24); byDay[d] = [g, p]; }
    const ds = Object.keys(byDay).map(Number).sort((a, b) => a - b);
    for (const d of ds) {
        const [g, p] = byDay[d], tot = g + p, w = Math.round(Math.min(2500, tot) / 2500 * 50), pw = Math.round(Math.min(2500, p) / 2500 * 50);
        const ideal = Math.round(Math.min(2500, d / 60 * 2500) / 2500 * 50);
        let bar = "";
        for (let i = 0; i < 50; i++) bar += i < pw ? "#" : i < w ? "+" : i === ideal ? "|" : ".";
        L.push(`d${String(d).padStart(3)} ${bar} ${String(tot).padStart(5)} G (spł. ${p}, sakiewka ${g})`);
    }
    L.push("```", "# = spłacone, + = w sakiewce, | = tempo 2500/60 dni", "");

    L.push("## Oś dni", "");
    L.push("| dzień | rozdział | złoto (start) | spłacone (start) | najgłębiej | co robił |", "|---|---|---|---|---|---|");
    for (const d of days) {
        const r = rep.days[d];
        const acts = [];
        for (const a of r.acts || []) { if (/^Rozmowa$/.test(a.w)) continue; const t = h2(a.h) + " " + a.w; if (acts[acts.length - 1] !== t) acts.push(t); }
        L.push(`| ${d} | ${esc(r.ch)} | ${r.gold0} | ${r.paid0} | ${r.deep0 || 0} | ${esc(acts.join("; ")).slice(0, 700)} |`);
    }
    L.push("");

    L.push("## Przygotowania przed podziemiami", "");
    const prep = rep.prep || [];
    if (!prep.length) L.push("Brak.");
    for (const x of prep) L.push(`- ${when(x)}: ${esc(x.what)}`);
    const firstPrep = prep.find(x => /^PRZYGOTOWANIE/.test(x.what));
    const tOf = r => r.day * 24 + (r.hour || 0);
    if (firstPrep) {
        const before = rep.deaths.filter(d => tOf(d) < tOf(firstPrep)).length, after = rep.deaths.length - before;
        L.push("", `Zgony przed pierwszym przygotowaniem (do ${when(firstPrep)}): **${before}**, po nim: **${after}**.`);
    }
    L.push("");

    // waiting vs the free time used (the player's note 2026-10-29: "bohater niepotrzebnie CZEKA")
    L.push("## Bezczynność i wolny czas", "");
    const idle = idleOf(rep);
    const ch1Days = days.filter(d => /^Rozdział 1/.test(rep.days[d].ch || "")), otherDays = days.filter(d => !/^Rozdział 1/.test(rep.days[d].ch || ""));
    const sumDays = ds => ds.reduce((a, d) => a + (idle.byDay[d] || 0), 0);
    L.push(`Czekanie na termin (wpisy „Czekam…”, minuty gry; noc się nie liczy) - razem **${Math.round(idle.total)} min**` + (idle.fromActs ? " (policzone z osi dni - starszy zapis)" : "") + ".");
    if (ch1Days.length) L.push(`- Rozdział 1 (${ch1Days.length} dni): ${Math.round(sumDays(ch1Days))} min, średnio **${Math.round(sumDays(ch1Days) / ch1Days.length)} min/dzień**`);
    if (otherDays.length) L.push(`- Dalej (${otherDays.length} dni): ${Math.round(sumDays(otherDays))} min, średnio ${Math.round(sumDays(otherDays) / otherDays.length)} min/dzień`);
    for (const [lab, m] of Object.entries(idle.byLabel).sort((x, y) => y[1] - x[1])) L.push(`- ${esc(lab)}: ${Math.round(m)} min`);
    const free = rep.free || [];
    if (free.length) {
        const byJob = {};
        for (const f of free) { const k = String(f.job).replace(/\s*\(.*$/, ""); byJob[k] = (byJob[k] || 0) + (f.min || 0); }
        L.push("", `Wolny czas użyty na robotę: ${free.length} razy, razem ${free.reduce((a, f) => a + (f.min || 0), 0)} min:`);
        for (const [k, m] of Object.entries(byJob).sort((x, y) => y[1] - x[1])) L.push(`- ${esc(k)}: ${m} min`);
    }
    L.push("");

    L.push("## Śmierci", "");
    if (!rep.deaths.length) L.push("Brak.");
    for (const d of rep.deaths) L.push(`- ${when(d)}, mapa ${d.map}${d.floor ? " (piętro " + d.floor + ")" : ""}: ${esc(d.doing)} ${d.why ? "(" + esc(d.why) + ")" : ""} - wczytany zapis: ${d.reloaded ? "tak" : "nie"}`);
    L.push("");

    L.push("## Wybory", "");
    L.push("Każdy wybór w rozmowach (powtarzalne zliczone).", "");
    const groups = new Map();
    const norm = t => String(t).replace(/\d+/g, "N");   // (the sums change - "Oddaj 100 G / Oddaj wszystko (302 G)" - one row for them)
    for (const c of rep.choices) {
        const k = norm(c.labels.join(" | ") + " => " + c.picked);
        const g = groups.get(k) || { c, n: 0, first: c };
        g.n++; groups.set(k, g);
    }
    L.push("| pierwszy raz | kto | opcje | wybrane | dlaczego | ile razy |", "|---|---|---|---|---|---|");
    for (const g of groups.values()) L.push(`| ${when(g.first)} | ${esc(g.c.who)} | ${esc(g.c.labels.join(" / "))} | **${esc(g.c.picked)}** | ${esc(g.c.why)} | ${g.n} |`);
    L.push("");

    L.push("## Utknięcia", "");
    if (!rep.stalls.length) L.push("Brak.");
    for (const s of rep.stalls) {
        L.push(`### ${s.n}. ${when(s)} - ${esc(s.doing)}`, "");
        L.push(`- Mapa: ${esc(s.mapName)} (${s.map}), pole ${s.pos && s.pos.join(",")} · cel w dzienniku: „${esc(s.tracked && s.tracked.title)}” · kompas: ${s.tracked && s.tracked.compass ? esc(s.tracked.compass.name) + " (mapa " + s.tracked.compass.map + ")" : "brak"}`);
        L.push(`- Zrzut: ${s.shot} · obejście: ${s.strategy}`);
        L.push(`- Podejrzana przyczyna: ${esc(s.cause || guessCause(s))}`);
        L.push("- Ostatnie akcje:", "", ...(s.log || []).map(l => "        " + l), "");
    }
    L.push("");

    L.push("## Obejścia błędów gry (to NIE są ruchy gracza)", "");
    const wk = rep.workarounds || [];
    if (!wk.length) L.push("Brak - cały przebieg zagrany jak gracz.");
    else L.push("Miejsca, w których gra uczciwie nie dała się przejść (błąd mapy) - autopilot je obszedł, żeby sprawdzić resztę (wyłącza to `--bez-obejsc`):", "");
    const wg = new Map();   // (the same fault each trip to the cellar: one line, the first time, how many times)
    for (const w of wk) { const k = String(w.what).replace(/\d+/g, "N"); const g = wg.get(k); if (g) g.n++; else wg.set(k, { w, n: 1 }); }
    for (const { w, n } of wg.values()) L.push(`- ${when(w)}: ${esc(w.what)}${w.why ? " (" + esc(w.why) + ")" : ""}${n > 1 ? " - ×" + n : ""}`);
    L.push("");

    L.push("## Gdzie nie wiadomo, co dalej", "");
    L.push("Chwile, gdy krok fabuły szedł gdzie indziej, niż wskazywał dziennik / kompas (albo kompas nie wskazywał nic).", "");
    if (!rep.unclear.length) L.push("Brak.");
    const ug = new Map();   // (the same thing noted again and again: one line, how many times)
    for (const u of rep.unclear) { const g = ug.get(u.what); if (g) g.n++; else ug.set(u.what, { u, n: 1 }); }
    for (const { u, n } of ug.values()) L.push(`- ${when(u)}: ${esc(u.what)}${u.why ? " (" + esc(u.why) + ")" : ""}${n > 1 ? " - ×" + n : ""}`);
    L.push("");

    L.push("## Mielenie", "");
    const hired = (rep.chapters || []).find(c => /Rozdział 1/.test(c.name));
    L.push(`- Zmiany u Borgara: ${rep.shifts.length} (oceny: ${countBy(rep.shifts.map(s => s.grade))}) - średnio ${rep.shifts.length ? Math.round(earned / rep.shifts.length) : 0} G, napiwki razem ${rep.shifts.reduce((s, x) => s + (x.tips || 0), 0)} G`);
    if (debtPaid && hired) L.push(`- Od początku rozdziału 1 do spłaty: ${debtPaid.day - hired.day} dni gry, w tym ${rep.shifts.filter(s => s.day <= debtPaid.day).length} zmian`);
    const waits = [];
    for (const d of days) for (const a of rep.days[d].acts || []) if (/Czekam/.test(a.w)) waits.push(d);
    L.push(`- Dni z czekaniem w tawernie na zmianę: ${new Set(waits).size}`);
    for (const g of rep.grind || []) L.push(`- ${when(g)}: ${esc(g.what)}`);
    L.push("");

    L.push("## Ostatnie wpisy autopilota", "", ...fin.log.map(l => "    " + l), "");
    if (rep.errors && rep.errors.length) L.push("## Wyjątki strażnika", "", ...rep.errors.slice(-10).map(e => "    " + e), "");
    return L.join("\n");
}
function countBy(a) { const m = {}; for (const x of a) m[x] = (m[x] || 0) + 1; return Object.entries(m).map(([k, n]) => k + "×" + n).join(", ") || "-"; }
function guessCause(s) {
    const t = (s.log || []).join(" ");
    if (/nie znam drogi|brak drogi/.test(t)) return "brak drogi w grafie przejść (zamknięte przejście albo wejście dodawane przez wtyczkę)";
    if (/nie dojdę|nie ma drogi do/.test(t)) return "nie da się dojść do celu na mapie (zablokowane pole, postać na drodze)";
    if (/przejście nie puściło/.test(t)) return "przejście odmawia (godziny drzwi, warunek wtyczki)";
    if (/spłata nie przeszła|zmiany nie było/.test(t)) return "rozmowa nie dała oczekiwanej opcji";
    return "nieznana - patrz zrzut i ostatnie akcje";
}

module.exports = { write };
