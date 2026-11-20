(function (P) {
  'use strict';
  const C = P.CONFIG;
  const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0);
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  function random(s) {
    // Saveable PRNG: reloading a prepared day does not reroll its luck.
    s.rng = (s.rng + 0x6D2B79F5) >>> 0;
    let t = s.rng;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  function log(s, type, text) {
    s.log.push({ id: ++s.logId, day: s.day, type, text });
    if (s.log.length > C.maxLog) s.log.shift();
  }
  function daily(s) {
    return { day: s.day, startCash: s.cash, startHealth: s.health, startRep: s.rep,
      startDisgust: disgust(s), income: { slices: 0, drinks: 0, recycling: 0, events: 0 },
      expenses: { ingredients: 0, supplies: 0, upgrades: 0, food: 0, events: 0 },
      potential: 0, served: 0, passed: 0, soldOut: 0, turnedAway: 0, closed: 0,
      reactions: { delighted: 0, satisfied: 0, neutral: 0, disgusted: 0 },
      sales: {}, drinks: 0, spoiledSlices: 0, wastedDough: 0, spoiledToppings: 0,
      events: [], milestones: [], tastedSlices: 0, discoveries: [], early: false, finalized: false };
  }
  function create(seed) {
    const s = { version: C.saveVersion, phase: 'management', day: 1, cash: C.startingCash,
      health: C.startingHealth, rep: C.startingRep, dirt: 0, rats: 0, waste: 0,
      xp: 0, price: C.price.start, rng: (seed === undefined ? Date.now() ^ Math.floor(Math.random() * 0xffffffff) : seed) >>> 0,
      inventory: { dough: 0, slices: 0 }, lots: {}, upgrades: [], menu: ['plain'],
      trained: false, recycled: false, windfall: false, sympathyUsed: false, action: null,
      tomorrow: { bonus: 0, multiplier: 1 }, modifiers: { bonus: 0, multiplier: 1 },
      dayRun: null, report: null, history: [], log: [], logId: 0, endReason: null,
      stats: { income: 0, spending: 0, slices: 0, customers: 0, days: 0, bestRevenue: 0, bestSlices: 0 },
      unlocks: [], pendingMilestones: [], wheelchairBuilt: false, lastCustomer: null, bestsRecorded: false, final: null,
      recipeBook: { known: ['plain'], attempts: [], last: null } };
    P.DATA.items.forEach(i => { s.inventory[i.id] = 0; if (i.group === 'toppings') s.lots[i.id] = []; });
    s.today = daily(s);
    log(s, 'system', 'A roadside stand. A questionable microwave. $64 and a plan.');
    return s;
  }
  function skill(s) { return Math.min(C.skillMax, Math.floor(s.xp / C.skillXP)); }
  function disgust(s) { return clamp(s.dirt + s.rats * C.disgust.perRat, 0, C.disgust.max); }
  function capacity(s) { return Math.max(1, Math.floor(s.health + skill(s) + s.upgrades.reduce((v, id) => v + C.upgrades[id].capacity, 0))); }
  function slots(s) { return C.slots.reduce((v, [at, n]) => s.stats.slices >= at ? n : v, 1) + (s.upgrades.includes('tiny_menu_board') ? C.upgrades.tiny_menu_board.slots : 0); }
  function unlocked(s, id) {
    const ingredient = P.RECIPE_BOOK.ingredients.find(item => item.id === id);
    return !ingredient || s.day >= ingredient.day || s.stats.slices >= ingredient.sold;
  }
  function recipeUnlocked(s, recipe) { return s.recipeBook?.known.includes(recipe.id) === true; }
  function recipeStocked(s, recipe) { return recipe.ingredients.every(id => s.inventory[id] > 0); }
  function money(s, cents, category) {
    if (!Number.isInteger(cents) || s.cash + cents < 0) throw new Error('Invalid cash transaction');
    s.cash += cents;
    if (cents >= 0) { s.today.income[category] += cents; s.stats.income += cents; }
    else { s.today.expenses[category] -= cents; s.stats.spending -= cents; }
  }
  function rep(s, delta) { s.rep = Math.max(0, s.rep + delta); }
  function gainXP(s, amount) {
    const old = skill(s);
    s.xp = Math.min(C.skillMax * C.skillXP, s.xp + amount);
    if (skill(s) > old) log(s, 'unlock', `Skill level ${skill(s)}. Each click does more work. Serving capacity increased.`);
  }
  function score(s) { return Math.round((s.stats.income - s.stats.spending) / 100 + s.rep * C.score.reputation + s.stats.slices * C.score.slices + s.stats.days * C.score.days + disgust(s) * C.score.disgust); }
  P.State = { create, daily, random, log, sum, clamp, skill, disgust, capacity, slots, unlocked, recipeUnlocked, recipeStocked, money, rep, gainXP, score };
})(Pizza);
