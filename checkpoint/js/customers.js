(function (P) {
  'use strict';
  const C = P.CONFIG, S = P.State;
  function forecast(s) {
    return S.clamp(Math.round((C.baseCustomers + s.rep + s.modifiers.bonus) * s.modifiers.multiplier), 1, C.maxCustomers);
  }
  function factors(s) {
    const menu = s.menu.map(id => P.DATA.recipes.find(r => r.id === id)).filter(r => r && S.recipeStocked(s, r));
    return { base: C.buy.base, price: (C.price.start - s.price) / 100 * C.price.sensitivity,
      menu: Math.min(C.buy.maxMenu, menu.length * C.buy.menu),
      supplies: (Number(s.inventory.napkins > 0) + Number(s.inventory.paper_plates > 0)) * C.buy.supply,
      disgust: -S.disgust(s) * C.buy.disgust };
  }
  function chance(s) { return S.clamp(S.sum(factors(s)), C.buy.min, C.buy.max); }
  function schedule(s) {
    const potential = forecast(s);
    s.today.potential = potential;
    // Stratified arrivals make a whole day readable while retaining uncertainty.
    const duration = Math.max(C.daySeconds, potential * C.service.customerSeconds), slot = duration / potential;
    const arrivals = Array.from({ length: potential }, (_, i) => (i + 0.12 + S.random(s) * 0.08) * slot);
    s.dayRun = { elapsed: 0, next: 0, arrivals, duration, customer: null };
  }
  function consumeTopping(s, id) {
    s.inventory[id] -= 1;
    const lot = s.lots[id].find(l => l.quantity > 0);
    if (lot) lot.quantity -= 1;
    s.lots[id] = s.lots[id].filter(l => l.quantity > 0);
  }
  function chooseRecipe(s) {
    const choices = s.menu.map(id => ({ recipe: P.DATA.recipes.find(r => r.id === id), weight: C.orderWeights.menu }));
    if (!s.menu.includes('plain')) choices.push({ recipe: P.DATA.recipes[0], weight: C.orderWeights.plain });
    let roll = S.random(s) * choices.reduce((n, c) => n + c.weight, 0);
    return (choices.find(c => (roll -= c.weight) < 0) || choices[0]).recipe;
  }
  function reaction(s, recipe, missing, fallback) {
    const delight = Math.min(C.reaction.maxDelight, C.reaction.delight + S.skill(s) * C.reaction.skill + C.recipeDelight[recipe.id]);
    const gross = Math.min(C.reaction.maxDisgust, C.reaction.disgust + S.disgust(s) * C.reaction.dirt + missing * C.reaction.missing + (fallback ? C.reaction.fallback : 0));
    // Reserve disgust first, then delight; all four bands always total exactly 1.
    const delighted = Math.min(delight, 1 - gross);
    const satisfied = Math.min(C.reaction.satisfied, 1 - gross - delighted);
    const roll = S.random(s);
    return roll < gross ? 'disgusted' : roll < gross + delighted ? 'delighted' : roll < gross + delighted + satisfied ? 'satisfied' : 'neutral';
  }
  function resolve(s) {
    const t = s.today;
    const result = (kind, title, text, revenue = 0, rep = 0) => {
      s.lastCustomer = { kind, title, text, revenue, rep };
    };
    if (t.served >= S.capacity(s)) {
      t.turnedAway++; result('miss', 'Too busy.', 'At serving capacity. −1 reputation at closing.'); S.log(s, 'miss', 'At capacity. A customer sees the queue and chooses inner peace.'); return;
    }
    if (s.inventory.slices <= 0) {
      t.soldOut++; result('miss', 'Sold out.', 'An empty counter. An unfulfilled lunch.'); S.log(s, 'miss', 'Sold out. Someone would have considered a slice.'); return;
    }
    if (S.random(s) >= chance(s)) {
      t.passed++; const lines = P.DATA.reactions.passed;
      const line = lines[Math.floor(S.random(s) * lines.length)];
      result('passed', 'Maybe next time.', line); S.log(s, 'pass', line); return;
    }
    let recipe = chooseRecipe(s);
    const fallback = !S.recipeStocked(s, recipe);
    if (fallback) recipe = P.DATA.recipes[0];
    const missing = Number(s.inventory.napkins === 0) + Number(s.inventory.paper_plates === 0);
    s.inventory.slices--;
    recipe.ingredients.forEach(id => consumeTopping(s, id));
    ['napkins', 'paper_plates'].forEach(id => { if (s.inventory[id] > 0) s.inventory[id]--; });
    s.dirt = Math.min(C.disgust.max, s.dirt + C.disgust.perSale + missing * C.disgust.missingSupply);
    const sliceRevenue = s.price + C.recipeBonuses[recipe.id];
    S.money(s, sliceRevenue, 'slices');
    let drinkRevenue = 0;
    if (s.inventory.pop > 0 && S.random(s) < C.popChance) {
      s.inventory.pop--; t.drinks++; drinkRevenue = C.popPrice; S.money(s, drinkRevenue, 'drinks');
      if (s.waste < C.recycling.capacity) s.waste++;
      else { s.dirt = Math.min(C.disgust.max, s.dirt + C.disgust.overflowCan); S.log(s, 'warning', 'Can crate full. A discarded can adds dirt.'); }
    }
    t.served++; t.sales[recipe.id] = (t.sales[recipe.id] || 0) + 1;
    s.stats.slices++; s.stats.customers++;
    const mood = reaction(s, recipe, missing, fallback);
    t.reactions[mood]++;
    const repBefore = s.rep;
    if (mood === 'delighted') S.rep(s, C.reputation.delighted);
    if (mood === 'disgusted') S.rep(s, C.reputation.disgusted);
    const lines = P.DATA.reactions[mood], line = lines[Math.floor(S.random(s) * lines.length)];
    result(mood, `${recipe.name}${drinkRevenue ? ' + Pop' : ''}`, `${fallback ? 'Topping sold out; served plain. ' : ''}${line}`, sliceRevenue + drinkRevenue, s.rep - repBefore);
    S.log(s, mood === 'disgusted' ? 'warning' : 'sale', `${recipe.name}${drinkRevenue ? ' + Pop' : ''} · +$${((sliceRevenue + drinkRevenue) / 100).toFixed(2)} · ${mood}. ${fallback ? 'Topping sold out; served plain. ' : ''}${line}`);
    P.Logic.unlocks(s);
  }
  P.Customers = { forecast, factors, chance, schedule, resolve };
})(Pizza);
