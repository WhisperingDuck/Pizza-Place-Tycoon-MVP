(function (P) {
  'use strict';
  const C = P.CONFIG;
  const clone = value => JSON.parse(JSON.stringify(value));
  let problem = '';
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); problem = ''; return true; }
    catch (_) { problem = 'Saving is unavailable in this browser. Keep this tab open to continue your run.'; return false; }
  }
  function read(key) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : null; }
    catch (_) { problem = 'A saved file could not be read. A fresh run is available.'; return null; }
  }
  function valid(s) {
    try {
      const nonnegative = n => Number.isFinite(n) && n >= 0;
      const integer = n => Number.isSafeInteger(n) && n >= 0;
      const milestones = list => Array.isArray(list) && list.every(m => integer(m.at) && Array.isArray(m.names) && m.names.every(n => typeof n === 'string'));
      const ledger = day => {
        if (!day || !integer(day.day)) return false;
        if (!['slices', 'drinks', 'recycling', 'events'].every(k => integer(day.income[k]))) return false;
        if (!['ingredients', 'supplies', 'upgrades', 'food', 'events'].every(k => integer(day.expenses[k]))) return false;
        if (!['potential', 'served', 'passed', 'soldOut', 'turnedAway', 'closed', 'drinks', 'spoiledSlices', 'wastedDough', 'spoiledToppings', 'startCash', 'startHealth', 'startRep', 'startDisgust'].every(k => nonnegative(day[k]))) return false;
        if (!['delighted', 'satisfied', 'neutral', 'disgusted'].every(k => integer(day.reactions[k]))) return false;
        if (!Object.entries(day.sales).every(([id, n]) => integer(n) && P.DATA.recipes.some(r => r.id === id))) return false;
        if (day.milestones !== undefined && !milestones(day.milestones)) return false;
        return Array.isArray(day.events) && day.events.every(e => P.DATA.events.some(item => item.id === e.id) && typeof e.name === 'string' && typeof e.text === 'string' && typeof e.effect === 'string');
      };
      const report = r => ledger(r) && r.finalized === true && ['endCash', 'revenue', 'incomeTotal', 'expenseTotal', 'net', 'repChange', 'healthChange', 'disgustChange', 'endHealth', 'endRep', 'endDisgust'].every(k => Number.isFinite(r[k]));
      if (!s || s.version !== C.saveVersion || !['management', 'report', 'score'].includes(s.phase)) return false;
      if (!Number.isInteger(s.day) || s.day < 1 || s.day > C.maxDays || !integer(s.cash)) return false;
      if (![s.health, s.rep, s.dirt, s.rats, s.waste, s.xp].every(nonnegative) || s.health > C.maxHealth || s.xp > C.skillMax * C.skillXP) return false;
      if (!integer(s.price) || s.price < C.price.min || s.price > C.price.max || !integer(s.rng) || s.rng > 0xffffffff || !integer(s.logId)) return false;
      if (!['trained', 'recycled', 'windfall', 'sympathyUsed', 'bestsRecorded', 'wheelchairBuilt'].every(k => typeof s[k] === 'boolean')) return false;
      if (!integer(s.waste) || s.waste > C.recycling.capacity || !milestones(s.pendingMilestones) || !milestones(s.today.milestones)) return false;
      if (!P.DATA.items.every(i => integer(s.inventory[i.id])) || !integer(s.inventory.dough) || !integer(s.inventory.slices)) return false;
      if (!Array.isArray(s.upgrades) || new Set(s.upgrades).size !== s.upgrades.length || !s.upgrades.every(id => C.upgrades[id])) return false;
      if (!Array.isArray(s.menu) || !s.menu.length || new Set(s.menu).size !== s.menu.length || s.menu.length > P.State.slots(s)) return false;
      if (!s.menu.every(id => P.DATA.recipes.some(r => r.id === id && P.State.recipeUnlocked(s, r)))) return false;
      for (const id of Object.keys(C.toppingUnlocks)) {
        if (!Array.isArray(s.lots[id]) || !s.lots[id].every(l => integer(l.quantity) && integer(l.expiresOn))) return false;
        if (s.lots[id].reduce((n, l) => n + l.quantity, 0) !== s.inventory[id]) return false;
      }
      if (!['income', 'spending', 'slices', 'customers', 'days', 'bestRevenue', 'bestSlices'].every(k => integer(s.stats[k])) || !ledger(s.today) || s.today.day !== s.day) return false;
      if (!Array.isArray(s.log) || s.log.length > C.maxLog || !s.log.every(l => typeof l.text === 'string' && ['system', 'prep', 'purchase', 'unlock', 'sale', 'miss', 'pass', 'warning', 'event'].includes(l.type))) return false;
      if (!Array.isArray(s.history) || s.history.length > C.maxHistory || !s.history.every(report) || !Array.isArray(s.unlocks)) return false;
      if (!['bonus', 'multiplier'].every(k => nonnegative(s.modifiers[k]) && nonnegative(s.tomorrow[k]))) return false;
      if (s.action && (!['dough', 'prepare', 'train', 'clean', 'food'].includes(s.action.type) || !nonnegative(s.action.remaining) || !nonnegative(s.action.total) || !s.action.total || s.action.remaining > s.action.total)) return false;
      if (s.phase === 'report' && (!report(s.report) || s.report.day !== s.day)) return false;
      if (s.phase === 'score' && (!s.final || !['score', 'profit', 'rep', 'slices', 'days'].every(k => Number.isFinite(s.final[k])) || !['health', 'cash', 'complete'].includes(s.endReason))) return false;
      return true;
    } catch (_) { return false; }
  }
  function save(s, checkpoint) {
    if (s.phase === 'day') {
      if (!checkpoint) return false;
      return write(C.keys.run, { version: C.saveVersion, restoreDay: true, state: checkpoint });
    }
    return write(C.keys.run, { version: C.saveVersion, restoreDay: false, state: s });
  }
  function load() {
    const file = read(C.keys.run);
    if (!file) return { state: null, notice: problem };
    let migrated = false;
    if (file.state?.version === 1) {
      const s = file.state;
      // Old recycling was general rubbish, not refundable Pop cans.
      s.dirt = Math.min(C.disgust.max, s.dirt + s.waste); s.waste = 0;
      s.wheelchairBuilt = false; s.pendingMilestones = []; s.lastCustomer = null;
      if (s.today) s.today.milestones = [];
      if (s.action && ['dough', 'train'].includes(s.action.type) && s.action.total > 0) {
        s.action.remaining = Math.ceil(s.action.remaining / s.action.total * C.work.total);
        s.action.total = C.work.total;
      }
      s.version = C.saveVersion; migrated = true;
    }
    if (!valid(file.state)) return { state: null, notice: 'The old save is incompatible or damaged. Starting a fresh run.' };
    return { state: file.state, notice: [file.restoreDay ? 'Restored your prepared day. Your stock and cash are back to the moment before opening.' : '', migrated ? 'Run updated. Click to finish manual work. Old rubbish is now dirt; sell Pop to start collecting cans.' : ''].filter(Boolean).join(' ') };
  }
  function bests() {
    const value = read(C.keys.bests);
    return value && ['score', 'profit', 'rep', 'slices', 'days'].every(k => Number.isFinite(value[k]) || value[k] === null) ? value : { score: null, profit: null, rep: 0, slices: 0, days: 0 };
  }
  function record(s) {
    if (s.phase !== 'score' || s.bestsRecorded) return;
    const previous = bests(), next = { ...previous };
    s.previousBest = previous.score;
    s.newBest = previous.score === null || s.final.score > previous.score;
    Object.keys(next).forEach(k => { next[k] = next[k] === null ? s.final[k] : Math.max(next[k], s.final[k]); });
    if (write(C.keys.bests, next)) s.bestsRecorded = true;
  }
  function settings() {
    const value = read(C.keys.settings) || {};
    return { sound: value.sound === true, reducedMotion: value.reducedMotion === true, speed: C.speeds.includes(value.speed) ? value.speed : 1 };
  }
  function clear(all = false) {
    try { localStorage.removeItem(C.keys.run); if (all) { localStorage.removeItem(C.keys.bests); localStorage.removeItem(C.keys.settings); } return true; }
    catch (_) { problem = 'Your browser did not allow saved data to be cleared.'; return false; }
  }
  P.Save = { clone, valid, save, load, bests, record, settings, saveSettings: value => write(C.keys.settings, value), clear, problem: () => problem };
})(Pizza);
