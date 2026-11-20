(function (P) {
  'use strict';
  const C = P.CONFIG, S = P.State;
  const okay = message => ({ ok: true, message: message || '' });
  const no = message => ({ ok: false, message });
  function openCost(s) {
    let cost = s.upgrades.includes('clean_microwave') ? 0 : C.upgrades.clean_microwave.cost;
    if (s.inventory.slices > 0) return cost;
    if (!s.inventory.dough && s.action?.type !== 'dough' && !s.inventory.flour) cost += C.inventoryCosts.flour;
    if (!s.inventory.sauce) cost += C.inventoryCosts.sauce;
    if (!s.inventory.cheese) cost += C.inventoryCosts.cheese;
    return cost;
  }
  function recycleUnits(s) { return s.waste; }
  function recycleValue(s) { return recycleUnits(s) * C.recycling.centsPerUnit * (s.windfall ? C.recycling.windfall : 1); }
  function clickPower(s, type) { return C.work[type] + S.skill(s) * C.work.skillBonus; }
  function reason(s, action, id, quantity = 1) {
    if (s.phase !== 'management' && s.phase !== 'day') return 'Read the report to continue.';
    const management = s.phase === 'management';
    if (['buy', 'upgrade', 'dough', 'prepare', 'train', 'clean', 'price', 'menu', 'open'].includes(action) && !management) return 'Available before opening.';
    if (['dough', 'prepare', 'train', 'clean', 'food'].includes(action) && s.action) {
      if (s.action.type === action && action !== 'food') return '';
      return 'Finish the current action first.';
    }
    if (action === 'buy') {
      if (!P.DATA.items.some(i => i.id === id)) return 'Unknown item.';
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > C.maxPurchase) return 'Choose a valid quantity.';
      if (!S.unlocked(s, id)) {
        const ingredient = P.RECIPE_BOOK.ingredients.find(item => item.id === id);
        return `Available on Day ${ingredient.day} or at ${ingredient.sold} slices sold.`;
      }
      if (s.cash < C.inventoryCosts[id] * quantity) return 'Not enough cash.';
    }
    if (action === 'upgrade') {
      const u = C.upgrades[id];
      if (!u) return 'Unknown upgrade.';
      if (s.upgrades.includes(id)) return 'Already installed.';
      if (s.stats.slices < u.unlock) return `Requires ${u.unlock} slices sold.`;
      if (s.cash < u.cost) return 'Not enough cash.';
    }
    if (action === 'clean' && !s.dirt && !s.rats) return 'The counter is clean.';
    if (action === 'dough' && s.inventory.flour < 1) return 'Buy flour first.';
    if (action === 'prepare') {
      if (s.inventory.dough < 1) return 'Make dough first.';
      if (s.inventory.sauce < 1 || s.inventory.cheese < 1) return 'Needs 1 sauce and 1 cheese.';
    }
    if (action === 'train') {
      if (s.trained) return 'Already trained today.';
      if (S.skill(s) >= C.skillMax) return 'Skill is at maximum.';
    }
    if (action === 'food') {
      if (s.health >= C.maxHealth) return 'Health is full.';
      if (s.cash < C.foodCost) return 'Not enough cash.';
    }
    if (action === 'recycle') {
      if (!s.waste) return 'Sell Pop to collect refundable cans.';
    }
    if (action === 'wheelchair') {
      if (s.wheelchairBuilt) return 'You already built the wheelchair.';
      if (s.waste < C.recycling.capacity) return 'Fill the can crate first.';
    }
    if (action === 'open') {
      if (s.action) return 'Finish the current action first.';
      if (!s.health) return 'Health is empty.';
      if (!s.upgrades.includes('clean_microwave')) return 'Buy the Clean Microwave first.';
      if (!s.inventory.slices) return 'Prepare at least one batch of slices.';
    }
    if (action === 'close' && management) return 'The stand is not open.';
    if (action === 'menu') {
      const recipe = P.DATA.recipes.find(r => r.id === id);
      if (!recipe || !S.recipeUnlocked(s, recipe)) return 'Discover this recipe in the notebook first.';
      if (s.menu.includes(id) && s.menu.length === 1) return 'Keep at least one recipe on the menu.';
      if (!s.menu.includes(id) && s.menu.length >= S.slots(s) && S.slots(s) !== 1) return 'Menu is full. Remove a recipe first.';
    }
    return '';
  }
  function unlocks(s) {
    const milestones = new Set([...Object.values(C.toppingUnlocks), ...C.slots.map(([n]) => n), ...Object.values(C.upgrades).map(u => u.unlock)]);
    for (const at of milestones) {
      if (!at || s.stats.slices < at || s.unlocks.includes(at)) continue;
      s.unlocks.push(at);
      const names = P.DATA.items.filter(i => C.toppingUnlocks[i.id] === at && s.day < P.RECIPE_BOOK.ingredients.find(item => item.id === i.id).day).map(i => i.name);
      P.DATA.upgrades.filter(u => C.upgrades[u.id].unlock === at).forEach(u => names.push(u.name));
      if (C.slots.some(([n]) => n === at)) names.push('another menu slot');
      if (!names.length) continue;
      S.log(s, 'unlock', `${at} slices sold. Unlocked: ${names.join(', ')}.`);
      const reward = { at, names };
      s.pendingMilestones.push(reward);
      s.today.milestones.push(reward);
    }
  }
  function startAction(s, type, seconds) { s.action = { type, total: seconds, remaining: seconds }; }
  function completeAction(s) {
    if (!s.action) return;
    const type = s.action.type;
    s.action = null;
    if (type === 'dough') { s.inventory.dough++; S.gainXP(s, C.doughXP); S.log(s, 'prep', 'Dough ready. Add sauce and cheese to prepare 8 slices.'); }
    if (type === 'prepare') { s.inventory.slices += C.slicesPerBatch; S.gainXP(s, C.prepXP); S.log(s, 'prep', `${C.slicesPerBatch} slices ready. Unsold slices expire at closing.`); }
    if (type === 'train') { S.gainXP(s, C.trainingXP); S.log(s, 'prep', `Training done. +${C.trainingXP} skill progress. The weights remain unimpressed.`); }
    if (type === 'clean') { const before = S.disgust(s); s.dirt = 0; s.rats = 0; S.log(s, 'prep', `Counter cleaned. Rats evicted. Disgust −${before.toFixed(1)}. Your cans are safe.`); }
    if (type === 'food') { const gain = Math.min(C.foodHealth, C.maxHealth - s.health); s.health += gain; S.log(s, 'prep', `Pizza delivered. +${gain} health. Someone else did the cooking.`); }
  }
  function action(s, type, id, quantity = 1) {
    if (type === 'experiment') return P.Recipes.test(s, id);
    const why = reason(s, type, id, quantity);
    if (why) return no(why);
    if (['dough', 'prepare', 'train', 'clean'].includes(type)) {
      if (!s.action) {
        if (type === 'dough') s.inventory.flour--;
        if (type === 'prepare') { s.inventory.dough--; s.inventory.sauce--; s.inventory.cheese--; }
        if (type === 'train') s.trained = true;
        startAction(s, type, C.work.total);
      }
      s.action.remaining = Math.max(0, s.action.remaining - clickPower(s, type));
      if (!s.action.remaining) completeAction(s);
      return okay();
    }
    switch (type) {
      case 'buy': {
        const item = P.DATA.items.find(i => i.id === id);
        S.money(s, -C.inventoryCosts[id] * quantity, item.group === 'supplies' ? 'supplies' : 'ingredients');
        s.inventory[id] += quantity;
        if (item.group === 'toppings') s.lots[id].push({ quantity, expiresOn: s.day + (s.upgrades.includes('mini_fridge') ? C.freshnessDays : 1) - 1 });
        S.log(s, 'purchase', `Bought ${quantity} ${item.name}. −$${(C.inventoryCosts[id] * quantity / 100).toFixed(2)}.`); break;
      }
      case 'upgrade': {
        const u = C.upgrades[id];
        S.money(s, -u.cost, 'upgrades'); s.upgrades.push(id); S.rep(s, u.rep);
        s.dirt = Math.max(0, s.dirt - (u.clean || 0));
        if (id === 'mini_fridge') Object.values(s.lots).forEach(lots => lots.forEach(l => { l.expiresOn = s.day + C.freshnessDays - 1; }));
        S.log(s, 'unlock', `${P.DATA.upgrades.find(u => u.id === id).name} installed.`); break;
      }
      case 'food': S.money(s, -C.foodCost, 'food'); startAction(s, type, C.foodSeconds); break;
      case 'recycle': {
        const units = recycleUnits(s), payout = recycleValue(s);
        s.waste -= units; s.recycled = true; s.windfall = false;
        S.money(s, payout, 'recycling');
        S.log(s, 'prep', `Returned ${units} Pop cans. +$${(payout / 100).toFixed(2)}.`); break;
      }
      case 'wheelchair': P.Events.trigger(s, 'wheelchair'); break;
      case 'price':
        if (id !== 'up' && id !== 'down') return no('Invalid price change.');
        s.price = S.clamp(s.price + (id === 'up' ? C.price.step : -C.price.step), C.price.min, C.price.max); break;
      case 'menu': s.menu = s.menu.includes(id) ? s.menu.filter(x => x !== id) : S.slots(s) === 1 ? [id] : [...s.menu, id]; break;
      case 'open':
        s.phase = 'day'; P.Customers.schedule(s);
        S.log(s, 'system', `Day ${s.day}: open for business. ${s.today.potential} potential customers. ${s.inventory.slices} slices ready.`); break;
      case 'close': finishDay(s, true); break;
      default: return no('Unknown action.');
    }
    return okay();
  }
  function finishRun(s, reason) {
    if (s.phase === 'score') return;
    s.phase = 'score'; s.endReason = reason; s.action = null;
    s.final = { score: S.score(s), profit: s.stats.income - s.stats.spending, rep: s.rep, slices: s.stats.slices, days: s.stats.days };
  }
  function recovery(s) {
    if (s.phase !== 'management') return;
    if (s.health <= 0) { finishRun(s, 'health'); return; }
    if (s.action) return;
    const minimum = openCost(s), recoveryCash = recycleValue(s);
    if (s.cash + recoveryCash >= minimum) return;
    if (!s.sympathyUsed && s.cash < C.events.sympathyThreshold) P.Events.trigger(s, 'sympathy');
    if (s.cash + recycleValue(s) < minimum) finishRun(s, 'cash');
  }
  function finishDay(s, early = false) {
    if (s.phase !== 'day' || s.today.finalized) return;
    // A paid food order is delivered before closing; it cannot vanish with its timer.
    completeAction(s);
    const t = s.today;
    t.early = early;
    t.closed = t.potential - t.served - t.passed - t.soldOut - t.turnedAway;
    t.wastedDough = s.inventory.dough; t.spoiledSlices = s.inventory.slices;
    s.inventory.dough = 0; s.inventory.slices = 0;
    for (const [id, lots] of Object.entries(s.lots)) {
      const expired = lots.filter(l => l.expiresOn <= s.day).reduce((n, l) => n + l.quantity, 0);
      t.spoiledToppings += expired; s.inventory[id] -= expired;
      s.lots[id] = lots.filter(l => l.expiresOn > s.day);
    }
    s.dirt = Math.min(C.disgust.max, s.dirt + t.spoiledSlices * C.disgust.spoiledSlice + t.wastedDough * C.disgust.wastedDough + t.spoiledToppings * C.disgust.spoiledTopping);
    S.rep(s, t.turnedAway * C.reputation.turnedAway + (early ? C.reputation.early : C.reputation.fullDay));
    s.health = Math.max(0, s.health - C.healthLoss);
    P.Events.end(s);
    s.stats.days++;
    const revenue = t.income.slices + t.income.drinks;
    s.stats.bestRevenue = Math.max(s.stats.bestRevenue, revenue);
    s.stats.bestSlices = Math.max(s.stats.bestSlices, t.served);
    t.finalized = true;
    s.report = JSON.parse(JSON.stringify({ ...t, endCash: s.cash, revenue,
      incomeTotal: S.sum(t.income), expenseTotal: S.sum(t.expenses), net: S.sum(t.income) - S.sum(t.expenses),
      repChange: s.rep - t.startRep, healthChange: s.health - t.startHealth, disgustChange: S.disgust(s) - t.startDisgust,
      endHealth: s.health, endRep: s.rep, endDisgust: S.disgust(s) }));
    s.history.push(s.report);
    if (s.history.length > C.maxHistory) s.history.shift();
    s.phase = 'report'; s.dayRun = null;
    S.log(s, 'system', `Day ${s.day} closed. ${t.served} slices sold. The receipt is ready.`);
  }
  function continueDay(s) {
    if (s.phase !== 'report') return no('No report to continue.');
    if (s.health <= 0) { finishRun(s, 'health'); return okay(); }
    if (s.day >= C.maxDays) { finishRun(s, 'complete'); return okay(); }
    s.day++; s.phase = 'management'; s.recycled = false; s.trained = false;
    s.modifiers = { ...s.tomorrow }; s.tomorrow = { bonus: 0, multiplier: 1 };
    s.today = S.daily(s); s.report = null;
    P.Events.begin(s);
    S.log(s, 'system', `Day ${s.day}. Open when you are ready.`);
    recovery(s);
    return okay();
  }
  function tick(s, seconds, speed = 1) {
    if (s.phase !== 'management' && s.phase !== 'day') return false;
    let changed = false;
    const dt = Math.max(0, seconds) * (s.phase === 'day' ? speed : 1);
    if (s.action?.type === 'food') {
      s.action.remaining -= dt; changed = true;
      if (s.action.remaining <= 0) completeAction(s);
    }
    if (s.phase === 'day') {
      const run = s.dayRun;
      run.elapsed = Math.min(run.duration, run.elapsed + dt);
      while (run.next < run.arrivals.length && run.arrivals[run.next] <= run.elapsed) {
        if (!run.customer || run.customer.stage === 'result') run.customer = { number: run.next + 1, stage: 'arriving', revealAt: run.arrivals[run.next] + C.service.decisionSeconds };
        if (run.customer.revealAt > run.elapsed) break;
        P.Customers.resolve(s);
        run.customer = { ...run.customer, stage: 'result', outcome: s.lastCustomer };
        run.next++;
        // Let the player see and acknowledge every newly earned unlock.
        if (s.pendingMilestones.length) { run.elapsed = Math.min(run.elapsed, run.customer.revealAt); break; }
      }
      if (run.elapsed >= run.duration) finishDay(s);
      changed = true;
    }
    return changed;
  }
  P.Logic = { action, reason, unlocks, tick, finishDay, continueDay, finishRun, recovery, openCost, recycleUnits, recycleValue, clickPower };
})(Pizza);
