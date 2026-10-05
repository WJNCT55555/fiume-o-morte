'use strict';
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, R, Meta } = H;

/* 沿 natale 计划跑，并在 martyred 被设置的那一刻打印兵力 */
function probe(seed, difficulty) {
  const agent = ST.makeAgent('natale', V.EVENTS.natale, V.OPTS);
  let s = Eng.createState('1919-09', difficulty || 'historical', seed);
  let guard = 0;
  const rows = [];
  while (s.phase !== 'ended' && guard++ < 5000) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      let pickId = agent.event(s, ev, avail);
      let pick = avail.find(o => o.id === pickId) || avail[0];
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const before = { mil: Math.round(s.order.milizia), martyred: !!s.flags.martyred, coup: Math.round(s.order.coup) };
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
      if (ev.id === 'ev_natale' || ev.id === 'ev_natale_fight' || ev.id === 'ev_natale_deal') {
        rows.push(`${s.date.y}-${s.date.m} ${ev.id} → ${pick.id}  兵力 ${before.mil} → ${Math.round(s.order.milizia)}`
          + `  martyred=${before.martyred}→${!!s.flags.martyred}  coup ${before.coup}→${Math.round(s.order.coup)}`);
      }
      if (s.phase === 'ended') break;
      continue;
    }
    /* 只抽牌，不主动养兵 */
    let plays = 0;
    while (plays++ < 14) {
      if (s.hand.length < s.handLimit) {
        const decks = S.decks(s).filter(d => d.drawable);
        const d = agent.draw(s, decks);
        if (d) { const r = Eng.dispatch(s, { type: 'DRAW_RANDOM', deck: d }); if (r.state !== s) s = r.state; }
      }
      const hv = S.hand(s).filter(c => c.playable);
      const cid = agent.card(s, hv);
      const pc = hv.find(c => c.id === cid);
      if (!pc) break;
      const r = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pc.id });
      if (r.state === s) break;
      s = r.state;
      if (s.pendingCard) {
        const card = Eng.CARD_BY_ID[s.pendingCard];
        const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
        const o = oo.find(x => x.id === agent.option(s, card, oo)) || oo[0];
        if (!o) break;
        const r2 = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: o.id });
        if (r2.state !== s) s = r2.state;
      }
    }
    const before = s;
    const adv = Eng.dispatch(s, { type: 'ADVANCE' });
    if (adv.state === before) break;
    s = adv.state;
  }
  console.log(`\n=== seed ${seed} / ${difficulty || 'historical'} ===`);
  rows.forEach(r => console.log('  ' + r));
  console.log(`  natale_done=${!!s.flags.natale_done} martyred=${!!s.flags.martyred} 结束兵力=${Math.round(s.order.milizia)}`);
  console.log(`  ending=${s.ending} @ ${s.date.y}-${s.date.m}  候选[${Meta.ENDINGS.filter(e => { try { return !!e.check(s); } catch (err) { return false; } }).sort((a, b) => a.priority - b.priority).map(e => e.id).join(', ')}]`);
  return s;
}

for (const seed of [100, 137]) probe(seed, 'historical');
probe(100, 'open');
