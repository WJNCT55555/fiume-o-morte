'use strict';
/* 针对性验证：血腥圣诞（ending_natale）到底可不可达？
   条件：martyred && order.milizia < 300。
   - martyred 只有 ev_natale → resistere → ev_natale_fight → b 给。
   - ev_natale 需要 1920-12 时 order.coup >= 100。
   所以要在 1920-12 把兵力压到 300 以下，同时把 coup 推到 100。
   兵力的主要来源是 reducers.js:877-891 的自动补充（每半回合 +clamp(round(rev*0.8),60,900)，
   只要金库 > 400），主要减少手段是 rev=0 时的 −60。

   本探针穷举若干「税务 + 用牌」组合，看是否有一组能同时满足。
*/
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, R, Meta } = H;

function trial(label, opts) {
  const agent = ST.makeAgent(opts.goal || 'natale', V.EVENTS[opts.goal || 'natale'] || {}, V.OPTS);
  if (opts.noCards) { agent.draw = () => null; agent.card = () => null; }
  if (opts.cardFilter) { const base = agent.card.bind(agent); agent.card = (s, hv) => opts.cardFilter(s, hv, base); }
  let s = Eng.createState('1919-09', opts.difficulty || 'historical', opts.seed || 100);
  let guard = 0;
  let atNatale = null, atDec = null;
  while (s.phase !== 'ended' && guard++ < 5000) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      let pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      if (ev.id === 'ev_natale') atDec = { date: s.date.y + '-' + s.date.m, mil: Math.round(s.order.milizia), coup: Math.round(s.order.coup), pop: Math.round(s.economy.population), viol: Math.round(s.order.violence), funds: Math.round(s.funds), tax: JSON.stringify(s.taxRates) };
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
      if (ev.id === 'ev_natale_fight' && pick.id === 'b') {
        atNatale = { mil: Math.round(s.order.milizia), martyred: !!s.flags.martyred };
      }
      if (s.phase === 'ended') break;
      continue;
    }
    const t = opts.tax || agent.tax(s);
    for (const k of Object.keys(t)) s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: t[k] }).state;
    let plays = 0;
    if (!opts.noCards) {
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
    }
    const before = s;
    const adv = Eng.dispatch(s, { type: 'ADVANCE' });
    if (adv.state === before) break;
    s = adv.state;
  }
  const okNatale = s.ending === 'ending_natale';
  console.log(`${okNatale ? '✅' : '❌'} ${label.padEnd(34)} 结局 ${String(s.ending).padEnd(22)} @${s.date.y}-${s.date.m}`);
  if (atDec) console.log(`      血腥圣诞触发时：兵力${atDec.mil} coup${atDec.coup} 人口${atDec.pop} 暴力${atDec.viol} 金库${atDec.funds} 税率${atDec.tax}`);
  else console.log('      （血腥圣诞未触发）');
  if (atNatale) console.log(`      巷战 b 之后：兵力${atNatale.mil} martyred=${atNatale.martyred}  → 需要 <300`);
  return s;
}

console.log('=== 情形 A：零税率 + 不打牌（最小补充） ===');
trial('零税・不打牌', { noCards: true, tax: { porto: 0, dogana: 0, consumo: 0, reddito: 0 } });
trial('零税・不打牌 seed137', { noCards: true, seed: 137, tax: { porto: 0, dogana: 0, consumo: 0, reddito: 0 } });

console.log('\n=== 情形 B：零税率 + 只打减兵/不加兵的牌 ===');
const harmless = ['az_intrighi', 'az_cervo_doro', 'az_fiume_league', 'az_forze_italia', 'az_uscocchi', 'az_legione_finanziaria'];
trial('零税・只打无害卡', {
  tax: { porto: 0, dogana: 0, consumo: 0, reddito: 0 },
  cardFilter: (s, hv, base) => {
    const c = base(s, hv.filter(x => harmless.indexOf(x.id) >= 0));
    return c;
  },
});

console.log('\n=== 情形 C：全额税（对照，看补充强度） ===');
trial('全税・不打牌', { noCards: true });
console.log('\n=== 情形 D：全税 + 主动压兵（撤军分支对照） ===');
trial('全税・压兵', { goal: 'natale', noCards: false });
