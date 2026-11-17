// ---- my analysis
const PARKED = new Set([22,21,23,17,18,120,121,122,123,124,155,156,157,159,165,166,167,168,169,175,176,177,27,990,991,900,901,910,912,914,917,918,920,922,923,931,933,934,935,950,951,960,961,962,963,964,2,11,12,100,101]);
const BOARD = new Set([162,24,13,111,8,4,125,3,20]);
const spotInfo = {};
for (const [k, s] of Object.entries(TQ.SPOTS)) spotInfo[k] = { map: s.map, marker: s.marker, x: s.x, y: s.y, at: s.at, r: s.r, name: s.name };
const out = { spots: spotInfo, quests: [], residents: {}, tlSpotsByMap: TL.SPOTS_BY_MAP ? Object.fromEntries(Object.entries(TL.SPOTS_BY_MAP).map(([m, v]) => [m, Object.keys(v)])) : {} };
for (const r of RES) out.residents[r.key] = { name: r.name, map: r.map || 8, plan: (r.plan || []).map(p => [p[0], p[1], p[2], typeof p[3] === "function" ? "fn" : p[3]]), home: r.home, indoor: r.indoor, away: r.away, when: typeof r.when === "function" ? "fn" : r.when };
for (const q of QUESTS) {
    const e = { id: q.id, giver: q.giver, name: q.name || q.title, offer: q.offer ? { cond: JSON.parse(JSON.stringify(q.offer.cond || {}, (k, v) => typeof v === "function" ? "fn" : v)), at: q.offer.at, spot: q.offer.spot, hours: q.offer.hours } : null, steps: [] };
    (q.steps || []).forEach((st, i) => {
        const s = { i, type: st.type, to: st.to, spot: st.spot, spots: st.spots, hours: st.hours, nazwa: st.nazwa, watek: st.watek, talk: st.talk, need: st.need, text: (st.text || "").slice(0, 200), targets: st.targets, rozmowyKto: st.rozmowyKto, at: st.at, map: st.map, where: st.where };
        e.steps.push(s);
    });
    out.quests.push(e);
}
fs.writeFileSync("C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/docs/questy_mapa/tmp/analiza.json", JSON.stringify(out));
console.log("quests", out.quests.length, "spots", Object.keys(spotInfo).length, "residents", Object.keys(out.residents).length, "loadErrors", loadErrors.join(" | "));
