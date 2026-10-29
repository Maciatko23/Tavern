// Sky.js (the sun and the sky) without the game: the pure math behind the browser test tests/sky_test.js, with DayNightCycle.js
// (which takes the screen's colour from the sun) and Survival.js (the weather plan behind the mist, under the sky or not). The sun's
// height by the hour and the season (rising and setting at 5:30 / 20:30 in spring, 5 / 21 summer, 6 / 19:30 autumn, 6:45 / 18:30
// winter; its noon height 48 / 60 / 40 / 24 degrees); the sky's colour: the blue hour before sunrise (cool, grey, dark), the warm
// sunrise, no tint at noon, the evening gold and red, the blue dusk, the night; the golden hour and its side (the sun on the right in
// the morning, the left in the evening); the long summer evening against the dark winter one; no jumps through any day of the year;
// sunTimes; DayNightCycle's tone and periods; the rays and the morning mist (only in the morning, thicker after a wet evening, the
// F9 force); Sun.now(): the shadow's way and length (left in the morning, short at noon, right in the evening), none at night or
// under a roof, weaker in rain and a storm.
"use strict";
const unit = require("../lib/unit.js");

unit.test(t => {
    const sys = { day: 5, hour: 12, dayNightDay() { return this.day; }, dayNightHour() { return this.hour; } };
    const screen = { type: "none", power: 0, weatherType() { return this.type; }, weatherPower() { return this.power; } };
    const Graphics = { frameCount: 0, width: 1280, height: 720 };
    let note = "<Clouds:on>";
    const globals = { $gameSystem: sys, $gameScreen: screen, Graphics };
    Object.defineProperty(globals, "$dataMap", { get: () => ({ note }), enumerable: true, configurable: true });
    const w = unit.load(["TawernaCore", "DayNightCycle", "Sky", "Survival"], { globals });
    const T = w.Tawerna, S = T.api("Sun"), L = T.time.seasonLength();
    const at = (h, d) => S.sky(h, d === undefined ? 5 : d);
    const dayOf = s => 3 + s * L;   // (a day of each season)

    // ---------------------------------------------------------------- the sun's height
    const DAYS = [[5.5, 20.5], [5, 21], [6, 19.5], [6.75, 18.5]], TOP = [48, 60, 40, 24];
    const elev = DAYS.map(([rise, set], s) => [S.elevation(rise, s).elev, S.elevation(set, s).elev, S.elevation((rise + set) / 2, s).elev, S.elevation(rise + 1, s).morning, S.elevation(set - 1, s).morning]);
    t.check("the sun's height: 0 at sunrise and sunset of each season (spring 5:30-20:30, summer 5-21, autumn 6-19:30, winter 6:45-18:30), its noon height 48 / 60 / 40 / 24 degrees halfway between, morning before it",
        elev.every((e, s) => Math.abs(e[0]) < 1e-9 && Math.abs(e[1]) < 1e-9 && Math.abs(e[2] - TOP[s]) < 1e-9 && e[3] === true && e[4] === false) &&
        S.elevation(23, 0).elev < -20 && S.elevation(2, 0).elev < -20, elev);
    t.check("Sun.window: window.Sky is Tawerna.api('Sun'), sky(hour) without a day reads today's ($gameSystem)", w.Sky === S && JSON.stringify(S.sky(12)) === JSON.stringify(at(12, 5)));

    // ---------------------------------------------------------------- the sky's colour through a spring day (day 5)
    const blueHour = at(4.6), sunrise = at(5.5), golden = at(6.2), noon = at(12), eveGold = at(19.8), sunset = at(20.5), dusk = at(21.2), night = at(23);
    t.check("before sunrise: the blue hour - cool and grey (blue up, red down, grey), darker than day", blueHour.elev < 0 && blueHour.tone[2] > 10 && blueHour.tone[0] < 10 && blueHour.tone[3] > 15 && blueHour.dark > 0.3, blueHour);
    t.check("at sunrise warm and light (red up, blue down), almost no dark; at noon no tint, no dark", sunrise.tone[0] > 15 && sunrise.tone[2] < 0 && sunrise.dark < 0.2 && noon.tone.every(v => v === 0) && noon.dark === 0,
        { sunrise, noon });
    t.check("in the evening the gold, at sunset warm red, after it the blue hour, then night (the night's tone, full dark)",
        eveGold.tone[0] > 10 && sunset.tone[0] > 20 && dusk.tone[2] > 10 && dusk.dark > 0.4 && night.dark === 1 && JSON.stringify(night.tone) === JSON.stringify(S.NIGHT_TONE), { eveGold, sunset, dusk, night });
    t.check("the golden hour with the sun low: the sun on the right (east) in the morning, on the left in the evening; none at noon or at night",
        golden.golden > 0.5 && eveGold.golden > 0.5 && golden.side === 1 && eveGold.side === -1 && noon.golden === 0 && night.golden === 0, { golden, eveGold });
    const seasons = [0, 1, 2, 3].map(s => +at(20, dayOf(s)).dark.toFixed(3));
    t.check("the days are longer in summer: at 20:00 the summer is light, the winter dark (spring lighter than autumn)", seasons[1] < 0.05 && seasons[3] > 0.8 && seasons[0] < seasons[2], seasons);
    const jump = { tone: 0, dark: 0, golden: 0 };
    for (let s = 0; s < 4; s++) {
        let last = null;
        for (let i = 0; i <= 4800; i++) {
            const k = at((i * 0.005) % 24, dayOf(s));
            if (last) {
                jump.tone = Math.max(jump.tone, ...k.tone.map((v, j) => Math.abs(v - last.tone[j])));
                jump.dark = Math.max(jump.dark, Math.abs(k.dark - last.dark));
                jump.golden = Math.max(jump.golden, Math.abs(k.golden - last.golden));
            }
            last = k;
        }
    }
    t.check("no jumps: through a whole day of every season (every 18 game seconds, past midnight too) the tone moves at most 3 (rounded), the dark and the golden hour at most 0.02",
        jump.tone <= 3 && jump.dark <= 0.02 && jump.golden <= 0.02, jump);
    const times = [0, 1, 2, 3].map(s => S.sunTimes(dayOf(s)));
    t.check("sunTimes(day): the sun crosses the horizon at the season's sunrise and sunset (within 3 game minutes)",
        times.every((x, s) => Math.abs(x.rise - DAYS[s][0]) <= 0.051 && Math.abs(x.set - DAYS[s][1]) <= 0.051), times);

    // ---------------------------------------------------------------- DayNightCycle reads the sun
    const D = w.DayNightCycle, hours = [0, 4.6, 5.5, 6.2, 9, 12, 17.5, 19.8, 20.5, 21.2, 23];
    const periods = [4.9, 5, 7.9, 8, 11, 15, 18, 21, 23.9].map(h => D.periodAt(h).id);
    t.check("DayNightCycle's screen colour is the sun's (computeTone = Sun.sky(h).tone at every hour); its periods: night till 5, dawn, morning 8, noon 11, afternoon 15, evening 18, night 21; Tawerna.time.period asks it",
        hours.every(h => JSON.stringify(D.computeTone(h)) === JSON.stringify(S.sky(h).tone)) && periods.join() === "night,dawn,dawn,morning,noon,afternoon,evening,night,night" &&
        T.time.period(12).id === "noon" && T.time.period(22).id === "night" && T.time.period(6).id === "dawn", periods);

    // ---------------------------------------------------------------- the rays and the mist
    const rays = [3, 5.6, 6, 12, 20.3, 23].map(h => +S.raysAt(h, 5).toFixed(2));
    t.check("the sun's rays: only with the sun low over the horizon, morning and evening (none at night or at noon)", rays[0] === 0 && rays[1] > 0.5 && rays[2] > 0.5 && rays[3] === 0 && rays[4] > 0.5 && rays[5] === 0, rays);
    const mornings = [];
    for (let d = 1; d <= 224; d++) mornings.push(S.mistOfDay(d));
    const clear = mornings.filter(m => m === 0).length, plan = w.Survival.weatherPlan;
    const wetDay = mornings.findIndex((m, i) => { const y = plan(i), today = plan(i + 1); return (y && y.end >= 17) || (today && today.start < 9); }) + 1;
    t.check("the morning mist: 0..1, not every morning (some clear ones), at least 0.45 after a wet evening or with rain before 9 (Survival's weather plan)",
        mornings.every(m => m >= 0 && m <= 1) && clear > 224 * 0.1 && clear < 224 * 0.5 && wetDay > 0 && S.mistOfDay(wetDay) >= 0.45, { clear, wetDay, mist: S.mistOfDay(wetDay) });
    S.forceMist(1, 5);
    const forced = [4, 5.5, 7, 12, 20.5].map(h => +S.mistAt(h, 5).toFixed(2)), otherDay = S.mistOfDay(6) === mornings[5];
    t.check("... the mist lies at dawn only (from the blue hour, gone with the sun high; none in the evening twilight); the F9 force sets that one day's mist",
        S.mistOfDay(5) === 1 && forced[1] > 0.5 && forced[2] > 0 && forced[3] === 0 && forced[4] === 0 && otherDay, forced);
    T.state("sky").mistForce = null;   // (the F9 force off again: Sky's state, $gameSystem._mistForce before)

    // ---------------------------------------------------------------- Sun.now(): the shadows
    const now = h => { sys.hour = h; Graphics.frameCount++; return S.now(); };
    const morning = now(7), noonNow = now(13), evening = now(19), nightNow = now(23);
    t.check("Sun.now(): the shadow falls left in the morning, straight down and short at noon, right in the evening (long when the sun is low); none at night",
        morning.dx < -0.3 && evening.dx > 0.3 && Math.abs(noonNow.dx) < 1e-9 && noonNow.dy === 1 && morning.len > noonNow.len && Math.abs(noonNow.len - 0.6 / Math.tan(48 * Math.PI / 180)) < 1e-9 &&
        noonNow.light === 1 && morning.light > 0.3 && nightNow.light === 0 && nightNow.outdoors, { morning, noonNow, evening, nightNow });
    const same = S.now() === nightNow;
    Object.assign(screen, { type: "rain", power: 5 });
    const rainy = now(13).light;
    Object.assign(screen, { type: "none", power: 0 });
    w.Storm = { level: () => 0.5, flash: () => 0 };
    const stormy = now(13).light;
    w.Storm = undefined;
    note = "<Weather:off>";
    const roof = now(13);
    note = "<Clouds:on>";
    t.check("... worked out once a frame; rain (power 5) leaves a fifth of the light, a storm at 0.5 a bit more than half; under a roof (Survival: not outdoors) no sun at all",
        same && Math.abs(rainy - 0.2) < 1e-9 && Math.abs(stormy - 0.55) < 1e-9 && roof.light === 0 && roof.outdoors === false, { rainy, stormy, roof: roof.light });
});
