'use strict';
/* 追踪：为什么 1924-01-27《罗马条约》事件触发后游戏没有立刻结束？ */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, R, Meta } = H;

const agent = ST.makeAgent('comune', V.EVENTS.comune, V.OPTS);
let s = Eng.createState('1919-09', 'historical', 100);
let guard = 0;
let seenRome = false;
while (s.phase !== 'ended' && guard++ < 5000) {
  if (s.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    const avail = ev.options.filter(o => !o.condition || o.condition(s));
    let pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
    if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
    const isRome = ev.id === 'ev_1924_01_rome';
    if (isRome || s.date.y >= 1924) {
      console.log(`[事件] ${s.date.y}-${s.date.m}-${s.date.d} ${ev.id} → ${pick.id}`
        + `  treaty_rome=${!!s.flags.treaty_rome} exile=${!!s.flags.exile} ending=${s.ending || '—'} phase=${s.phase} monthIndex=${s.monthIndex}`);
    }
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
    if (isRome) {
      seenRome = true;
      console.log(`   → 解析后： treaty_rome=${!!s.flags.treaty_rome} exile=${!!s.flags.exile}`
        + ` phase=${s.phase} ending=${s.ending || '—'} date=${s.date.y}-${s.date.m}`
        + ` hardEnd 应=${!!(s.flags.treaty_rome && s.date.y >= 1924 && s.date.m >= 3 && !s.flags.exile)}`);
    }
    if (s.phase === 'ended') break;
    continue;
  }
  const t = agent.tax(s);
  for (const k of Object.keys(t)) s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: t[k] }).state;
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
    if (s.phase === 'ended') break;
  }
  const before = s;
  const y = s.date.y, m = s.date.m;
  const adv = Eng.dispatch(s, { type: 'ADVANCE' });
  if (adv.state === before) { console.log('ADVANCE 卡住 @', y + '-' + m); break; }
  s = adv.state;
  if (s.date.y >= 1924) {
    console.log(`[推进] ${y}-${m} → ${s.date.y}-${s.date.m}  treaty_rome=${!!s.flags.treaty_rome}`
      + ` coup_done=${!!s.flags.coup_done} exile=${!!s.flags.exile} stay=${!!s.flags.stay}`
      + ` phase=${s.phase} ending=${s.ending || '—'} currentEvent=${s.currentEvent || '—'}`);
  }
}
console.log(`\n结束：${s.date.y}-${s.date.m} ending=${s.ending} phase=${s.phase} rome已见=${seenRome}`);
