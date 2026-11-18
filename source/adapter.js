/* The review adapter translates checkpoint state into the one-day surface.
   Simulation, transactions, probability, work, settlement and save validation
   are supplied by the unmodified candidate modules above. */
(() => {
  'use strict';
  const P = window.Pizza;
  const C = P.CONFIG;
  const copy = JSON.parse(document.getElementById('stand-copy').textContent);
  const seed = 6;
  const ids = ['flour', 'sauce', 'cheese', 'napkins', 'paper_plates'];
  const supportedStock = new Set(ids);
  const cash = cents => '$' + (cents / 100).toFixed(2);
  const fill = (template, params = {}) => template.replace(/\{(\w+)\}/g, (token, k) => params[k] ?? token);
  const entriesByEffect = new Map();
  copy.events.forEach(entry => {
    if (!entriesByEffect.has(entry.effect)) entriesByEffect.set(entry.effect, []);
    entriesByEffect.get(entry.effect).push(entry);
  });
  const cost = id => id === 'microwave' ? C.upgrades.clean_microwave.cost : C.inventoryCosts[id];

  // These keys belong exclusively to this prototype, including on a file URL.
  for (const slot of ['run', 'bests', 'settings']) C.keys[slot] = 'roadside.one-day.design-v1.' + slot;
  const naturalEnd = P.Events.end;
  const reviewHash = new URLSearchParams(window.location.hash.slice(1));
  const forcedEvent = reviewHash.get('event');
  const previewEvent = copy.events.find(e => e.id === forcedEvent);
  const previewType = P.DATA.events.find(e => e.id === previewEvent?.effect)?.type;
  for (const [k, lines] of Object.entries(copy.reactions)) P.DATA.reactions[k] = [...lines];
  P.DATA.recipes.find(r => r.id === 'plain').name = copy.names.plain;
  function configureEvent(day) {
    for (const event of P.DATA.events) {
      const choices = entriesByEffect.get(event.id);
      const content = choices[(day - 1) % choices.length];
      event.name = content.title;
      event.text = content.message;
    }
  }
  P.Events.end = s => {
    if (forcedEvent === 'none') return;
    if (previewEvent && ['random', 'conditional'].includes(previewType)) {
      const entry = P.DATA.events.find(e => e.id === previewEvent.effect);
      entry.name = previewEvent.title;
      entry.text = previewEvent.message;
      if (P.Events.trigger(s, previewEvent.effect)) s.today.events.at(-1).copyId = previewEvent.id;
      return;
    }
    naturalEnd(s);
  };
  const loaded = P.Save.load();
  let state = loaded.state || P.State.create(seed);
  configureEvent(state.day);
  // The engine validates its own save. Keep optional presentation history
  // tolerant of old or damaged entries without discarding a playable run.
  if (Array.isArray(state.reviewLog)) {
    state.reviewLog = state.reviewLog.filter(row => row && Object.hasOwn(copy.counter, row.key) &&
      row.params && typeof row.params === 'object' && typeof row.time === 'string' &&
      typeof row.kind === 'string').slice(-C.maxLog);
  }
  let checkpoint = null;
  let paused = false;
  let panelOpen = false;
  let notice = loaded.notice ? (loaded.state ? copy.feedback.restore : copy.feedback.incompatible) :
    (!loaded.state ? copy.feedback.start : '');
  let saveNotice = '';
  let lastTime = performance.now();
  let lastPaint = '';
  const logEntries = () => Array.isArray(state.reviewLog) ? state.reviewLog : [];
  function addLog(key, params, kind, number) {
    state.reviewLog = logEntries();
    const elapsed = state.dayRun?.elapsed ?? (key === 'closed' ? C.daySeconds : 0);
    const duration = state.dayRun?.duration ?? C.daySeconds;
    state.reviewLog.push({ key, params, kind, number, time: clock(elapsed / duration) });
    if (state.reviewLog.length > C.maxLog) state.reviewLog.shift();
  }
  function clock(fraction) {
    const minute = 11 * 60 + Math.floor(Math.min(1, fraction) * 8 * 60);
    return String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0');
  }
  function persist() {
    if (!P.Save.save(state, checkpoint)) saveNotice = copy.feedback.saveUnavailable;
  }
  function missingResources() {
    return ['dough', 'sauce', 'cheese'].filter(id => !state.inventory[id]);
  }
  function workReason(kind) {
    if (state.phase !== 'management') return copy.feedback.beforeOpen;
    if (state.action) return state.action.type === kind ? '' : copy.feedback.finishWork;
    if (kind === 'dough') return state.inventory.flour ? '' : copy.feedback.noFlour;
    const missing = missingResources();
    return missing.length ? fill(copy.feedback.noIngredients, {
      items: missing.map(id => '1 ' + (copy.names[id] || id).toLowerCase()).join(' + ')
    }) : '';
  }
  function openReason() {
    if (state.phase !== 'management') return copy.feedback.beforeOpen;
    if (state.action) return copy.feedback.finishWork;
    if (!state.health) return copy.feedback.noHealth;
    const microwave = state.upgrades.includes('clean_microwave');
    if (!state.inventory.slices) return microwave ? copy.feedback.noTray : copy.feedback.noMicrowaveOrTray;
    return microwave ? '' : copy.feedback.noMicrowave;
  }
  function availableToBuy(id) {
    if (state.phase !== 'management') return copy.feedback.beforeOpen;
    if (id === 'microwave' && state.upgrades.includes('clean_microwave')) return copy.feedback.installedAlready;
    return state.cash >= cost(id) ? '' : copy.feedback.noCash;
  }
  function entryLine(row) {
    const p = { ...row.params };
    if (p.mood) p.line = copy.reactions[p.mood]?.[p.lineIndex] || p.line;
    return fill(copy.counter[row.key], p);
  }
  function currentOutcome() {
    const customer = state.dayRun?.customer;
    if (!customer) return null;
    const visitor = customer.number;
    if (customer.stage === 'arriving') return { kind: 'arriving', text: copy.counter.arrivalShort, visitor, amount: 0 };
    const outcome = customer.outcome;
    const isMiss = outcome.kind === 'miss';
    const text = isMiss ? (state.inventory.slices ? copy.counter.atCapacity : copy.counter.soldOut) : outcome.text;
    return { visitor, kind: outcome.kind, text, amount: outcome.revenue };
  }
  function recordOutcome(customer) {
    const result = customer.outcome;
    let key = 'sale';
    if (result.kind === 'passed') key = 'walk';
    if (result.kind === 'miss') key = state.inventory.slices ? 'busy' : 'out';
    const params = { n: customer.number, line: result.text, money: cash(result.revenue),
      mood: result.kind, lineIndex: copy.reactions[result.kind]?.indexOf(result.text) };
    addLog(key, params, result.kind === 'miss' || result.kind === 'passed' ? 'walk' : 'sale', customer.number);
  }
  // Translate the dispatched checkpoint effect for the editable receipt. The
  // numerical values come from config; writing a line never applies its effect.
  function effectSummary(id) {
    const E = C.events;
    const values = {
      big_game: { count: E.bigGame }, rain: { percent: 100 * E.rain },
      scratch: { cash: cash(E.scratch) }, good_tv: { rep: E.interview }, bad_tv: { rep: E.interview },
      cat: { rep: E.catRep, dirt: E.catDirt }, garbage: {}, windfall: { multiple: C.recycling.windfall },
      weekend: { count: E.weekend }, rats: {}, sympathy: { cash: cash(E.sympathyCash) },
      wheelchair: { count: C.recycling.capacity, rep: C.recycling.wheelchairRep }
    };
    return fill(copy.effects[id], values[id]);
  }
  function receiptFor(r) {
    const events = r.events.map(e => {
      const candidates = entriesByEffect.get(e.id);
      const content = copy.events.find(v => v.id === e.copyId) || candidates[(r.day - 1) % candidates.length];
      return { title: content.title, message: content.message, effect: effectSummary(e.id) };
    });
    let template = copy.receipt.sellThroughClue, count = 0;
    if (r.soldOut) { template = copy.receipt.stockClue; count = r.soldOut; }
    else if (r.turnedAway) { template = copy.receipt.capacityClue; count = r.turnedAway; }
    else if (r.passed) template = state.inventory.napkins ? copy.receipt.wasteClue : copy.receipt.supplyClue;
    else if (r.spoiledSlices) { template = copy.receipt.overprepClue; count = r.spoiledSlices; }
    const clue = fill(template, { count, passed: r.passed, visitors: r.potential });
    return { prepared: r.served + r.spoiledSlices, sold: r.served, leftovers: r.spoiledSlices,
      sales: r.revenue, spending: r.expenseTotal, change: r.net, clue, events,
      eventTitle: events.map(e => e.title).join(' / '),
      eventMessage: events.length ? events.map(e => e.message + ' ' + e.effect).join(' ') : copy.receipt.quiet,
      startCash: r.startCash, endCash: r.endCash, healthChange: r.healthChange,
      visitors: r.potential, passed: r.passed, soldOut: r.soldOut };
  }
  function viewModel() {
    const phase = state.phase === 'management' ? 'prep' : state.phase === 'day' ? 'service' : 'report';
    const run = state.dayRun, t = state.today, r = state.report;
    const receipt = r ? receiptFor(r) : null;
    const work = state.action ? { kind: state.action.type === 'prepare' ? 'slices' : 'dough',
      progress: Math.round(100 * (1 - state.action.remaining / state.action.total)) } : null;
    const noDough = workReason('dough'), noSlices = workReason('prepare'), noOpen = openReason();
    const costs = {}, canBuy = {}, buyReason = {};
    for (const id of [...ids, 'microwave']) {
      costs[id] = cost(id); buyReason[id] = availableToBuy(id); canBuy[id] = !buyReason[id];
    }
    return { phase, day: state.day, cash: state.cash, health: state.health, reputation: state.rep, price: state.price,
      stock: { ...state.inventory }, costs, microwave: state.upgrades.includes('clean_microwave'), work,
      workStep: { dough: P.Logic.clickPower(state, 'dough'), slices: P.Logic.clickPower(state, 'prepare') },
      forecast: { visitors: run || receipt ? t.potential : P.Customers.forecast(state), capacity: P.State.capacity(state),
        chance: Math.round(P.Customers.chance(state) * 1000) / 10 },
      prepared: receipt?.prepared ?? (state.inventory.slices + t.served), sold: t.served,
      possibleSales: state.inventory.slices * state.price, sales: t.income.slices + t.income.drinks, spending: P.State.sum(t.expenses), openingCash: t.startCash,
      paused, visitorsSeen: run?.customer?.number ?? (receipt ? t.potential : 0),
      serviceProgress: run ? run.elapsed / run.duration : receipt ? 1 : 0,
      log: logEntries().map(row => ({ time: row.time, text: entryLine(row), kind: row.kind, visitor: row.number })),
      reaction: currentOutcome(), receipt, notice, saveNotice, ready: !noOpen, openReason: noOpen,
      canBuy, buyReason, canDough: !noDough, canPrepare: !noSlices, workReasons: { dough: noDough, slices: noSlices },
      priceMin: C.price.min, priceMax: C.price.max, priceStep: C.price.step, batchSize: C.slicesPerBatch,
      dayTerminal: state.phase === 'score' || (phase === 'report' && (state.health === 0 || state.day >= C.maxDays)) };
  }
  function render() {
    window.StandView.render(viewModel(), copy);
  }
  function reset() {
    checkpoint = null; paused = false; panelOpen = false; saveNotice = ''; lastPaint = '';
    state = P.State.create(seed); configureEvent(1); notice = copy.feedback.start; persist(); render();
  }
  function action(name, id) {
    if (name === 'panel') { panelOpen = id === true || id === 'true'; lastTime = performance.now(); return; }
    if (name === 'reset') { reset(); return; }
    if (name === 'pause') {
      if (state.phase === 'day') { paused = !paused; lastTime = performance.now(); render(); }
      return;
    }
    if (name === 'next') {
      if (state.phase !== 'report') return;
      if (viewModel().dayTerminal) { reset(); return; }
      // An end-of-day modifier may refer to the next day's event copy.
      configureEvent(state.day + 1);
      P.Logic.continueDay(state);
      state.reviewLog = []; notice = copy.feedback.newDay; persist(); render(); return;
    }
    if (state.phase !== 'management') return;
    let type = name, item = id;
    if (name === 'work') type = id === 'slices' ? 'prepare' : id;
    if (name === 'microwave' || (name === 'buy' && item === 'microwave')) { type = 'upgrade'; item = 'clean_microwave'; }
    if (type === 'price' && (String(id) === '1' || String(id) === '-1')) item = Number(id) === 1 ? 'up' : 'down';
    if (!['buy', 'upgrade', 'dough', 'prepare', 'price', 'open'].includes(type)) return;
    if (type === 'buy' && !supportedStock.has(item)) return;
    if (type === 'upgrade' && item !== 'clean_microwave') return;
    if (type === 'open') {
      const why = openReason();
      if (why) { notice = why; render(); return; }
      checkpoint = P.Save.clone(state);
    }
    const result = P.Logic.action(state, type, item);
    if (!result.ok) {
      notice = type === 'buy' || type === 'upgrade' ? availableToBuy(type === 'upgrade' ? 'microwave' : item) :
        workReason(type); render(); return;
    }
    switch (type) {
      case 'buy': notice = fill(copy.feedback.bought, { item: copy.names[item], cost: cash(cost(item)) }); break;
      case 'upgrade': notice = fill(copy.feedback.installed, { cost: cash(cost('microwave')) }); break;
      case 'dough':
      case 'prepare': {
        const makingDough = type === 'dough';
        if (!state.action) notice = makingDough ? copy.feedback.doughReady : fill(copy.feedback.slicesReady, { batch: C.slicesPerBatch });
        else notice = fill(makingDough ? copy.feedback.doughWorking : copy.feedback.slicesWorking,
          { progress: Math.round(100 * (1 - state.action.remaining / state.action.total)) });
        break;
      }
      case 'price': notice = fill(copy.feedback.price, { price: cash(state.price) }); break;
      case 'open':
        state.reviewLog = []; notice = ''; paused = false; lastTime = performance.now(); lastPaint = '';
        addLog('opened', { visitors: state.today.potential }, 'open', 0);
        break;
    }
    persist(); render();
  }
  // Small steps preserve the checkpoint's separate arrival and decision beats.
  // Hidden tabs and secondary panels suspend the review's wall clock.
  function tick() {
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.3);
    lastTime = now;
    if (document.hidden || paused || panelOpen || state.phase !== 'day') return;
    const before = state.dayRun.customer;
    P.Logic.tick(state, delta);
    if (state.phase === 'report') {
      addLog('closed', { sold: state.today.served }, 'close', 0);
      checkpoint = null; notice = ''; persist(); render(); return;
    }
    const current = state.dayRun.customer;
    if (current && current.number !== before?.number)
      addLog('arrived', { n: current.number }, 'arrival', current.number);
    if (current?.stage === 'result' && (before?.stage !== 'result' || before.number !== current.number))
      recordOutcome(current);
    // The first day is below all milestones. Later continuing samples use the
    // same checkpoint unlocks; acknowledge them after settlement of each beat.
    if (state.pendingMilestones.length) state.pendingMilestones = [];
    const frameKey = Math.floor(state.dayRun.elapsed * 4) + '/' + (current?.number || 0) + '/' + current?.stage;
    if (frameKey !== lastPaint) { lastPaint = frameKey; render(); }
  }
  window.Stand = { action };
  document.addEventListener('stand-action', event => action(event.detail.action, event.detail.id));
  document.addEventListener('visibilitychange', () => { lastTime = performance.now(); });
  window.setInterval(tick, 120);
  render();
})();
