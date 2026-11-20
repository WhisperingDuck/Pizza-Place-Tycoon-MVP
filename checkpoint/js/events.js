(function (P) {
  'use strict';
  const C = P.CONFIG, S = P.State;
  function trigger(s, id) {
    const event = P.DATA.events.find(e => e.id === id);
    if (!event) return false;
    let effect = '';
    switch (id) {
      case 'big_game': s.tomorrow.bonus += C.events.bigGame; effect = `Tomorrow: +${C.events.bigGame} potential customers.`; break;
      case 'rain': s.tomorrow.multiplier *= C.events.rain; effect = 'Tomorrow: half the usual foot traffic.'; break;
      case 'scratch': S.money(s, C.events.scratch, 'events'); effect = `+$${(C.events.scratch / 100).toFixed(2)} cash.`; break;
      case 'good_tv': S.rep(s, C.events.interview); effect = `+${C.events.interview} reputation.`; break;
      case 'bad_tv': S.rep(s, -C.events.interview); effect = `−${C.events.interview} reputation (minimum 0).`; break;
      case 'cat': S.rep(s, C.events.catRep); s.dirt = Math.min(C.disgust.max, s.dirt + C.events.catDirt); effect = '+1 reputation, +1 dirt.'; break;
      case 'garbage': s.dirt = 0; s.rats = 0; effect = 'Dirt and rats cleared. Your refundable cans stay in their crate.'; break;
      case 'windfall': s.windfall = true; effect = `Your next recycling payout is ×${C.recycling.windfall}.`; break;
      case 'weekend': s.modifiers.bonus += C.events.weekend; effect = `Today: +${C.events.weekend} potential customers.`; break;
      case 'rats': s.rats += 1; effect = '+1 rat, +1 disgust. Clean the counter before opening tomorrow.'; break;
      case 'wheelchair':
        if (s.wheelchairBuilt || s.waste < C.recycling.capacity) return false;
        s.waste = 0; s.wheelchairBuilt = true; S.rep(s, C.recycling.wheelchairRep);
        effect = `${C.recycling.capacity} cans redeemed for the neighbourhood wheelchair build. +${C.recycling.wheelchairRep} reputation. No cash payout; the refund goes to the project.`;
        break;
      case 'sympathy':
        if (s.sympathyUsed) return false;
        s.sympathyUsed = true; S.money(s, C.events.sympathyCash, 'events');
        effect = `+$${(C.events.sympathyCash / 100).toFixed(2)}. Once per run.`; break;
    }
    s.today.events.push({ id, name: event.name, text: event.text, effect });
    S.log(s, 'event', `${event.name} — ${event.text} ${effect}`);
    return true;
  }
  function randomEvent(s) {
    const pool = P.DATA.events.filter(e => e.type === 'random');
    return trigger(s, pool[Math.floor(S.random(s) * pool.length)].id);
  }
  function begin(s) {
    if (C.events.weekendDays.includes(s.day % C.events.weekLength)) trigger(s, 'weekend');
  }
  function end(s) {
    if (S.random(s) < C.events.chance) randomEvent(s);
    if (s.today.spoiledSlices && S.random(s) < Math.min(C.events.ratMaxChance, s.today.spoiledSlices * C.events.ratPerSlice)) trigger(s, 'rats');
  }
  P.Events = { trigger, randomEvent, begin, end };
})(Pizza);
