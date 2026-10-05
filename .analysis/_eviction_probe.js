'use strict';
/* 武装驱离：需要把守/攻压到 0.6 以下，但人口不能跌破 44000（否则 silent_port 抢先）。
   策略：正常经营经济（保住人口/吞吐），但**不招募、并主动削减军团**。 */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, R, Meta } = H;

/* 复用 commune 的经济策略骨架，但换掉事件表与卡牌筛选 */
const GOAL = {
  label: '武装驱离（不养兵 + 顶满围攻轴）',
  flags: ['bloody_history'],
  laws: { portofranco: 3, dogana: 3, fisco: 2 },
  traffic: { gte: 60, w: 5 },
  violence: 'up',
  wantViolenceUp: 1,
  drawOrder: ['governo', 'azione'],
  collapseGuard: true,
  /* 关键：把所有加兵力的卡档掉 */
  avoidCards: ['az_reclutamento', 'az_propaganda', 'gv_nave', 'gv_bilancio'],
  evGated: {
    ev_natale: [['resistere', () => true]],
    ev_natale_fight: [['tenere', () => true]],
    ev_1920_01_inverno: [['b', () => true]],   /* milizia -180 */
    ev_1920_06_alleati: [['c', () => true]],   /* milizia -260 */
    ev_1919_10_comunali: [['c', () => true]],
    ev_1919_09_marcia: [['a', () => true]],
  },
};
ST.GOALS.eviction = GOAL;

for (const seed of [100, 137, 174, 211, 248]) {
  const agent = ST.makeAgent('eviction', V.EVENTS.comune || {}, V.OPTS);
  let s = Eng.createState('1919-09', 'historical', seed);
  let g = 0, siege = null;
  while (s.phase !== 'ended' && g++ < 6000) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      if (ev.id === 'ev_natale_fight') {
        siege = R.resolveBattle(s, { defenderPower: R.battleForces(s, 'defender') });
      }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      const gated = (GOAL.evGated || {})[ev.id];
      let pick = null;
      if (gated) for (const [id, pred] of gated) { if (avail.some(o => o.id === id) && pred(s)) { pick = avail.find(o => o.id === id); break; } }
      if (!pick) pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
      if (s.phase === 'ended') break;
      continue;
    }
    const t = agent.tax(s);
    for (const k of Object.keys(t)) s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: t[k] }).state;
    const p = agent.posture(s);
    if (p && p !== s.posture) s = Eng.dispatch(s, { type: 'SET_POSTURE', posture: p }).state;
    let plays = 0;
    while (plays++ < 18) {
      if (s.phase === 'ended') break;
      if (s.hand.length < s.handLimit) {
        const decks = S.decks(s).filter(d => d.drawable);
        const d = agent.draw(s, decks);
        if (d) { const rr = Eng.dispatch(s, { type: 'DRAW_RANDOM', deck: d }); if (rr.state !== s) s = rr.state; }
      }
      const hv = S.hand(s).filter(c => c.playable);
      const cid = agent.card(s, hv);
      const pc = hv.find(c => c.id === cid);
      if (!pc) break;
      const rr = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pc.id });
      if (rr.state === s) break;
      s = rr.state;
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
  console.log(`  seed ${String(seed).padStart(4)} → ${String(s.ending).padEnd(20)} @${s.date.y}-${String(s.date.m).padStart(2,'0')}`
    + `  人口 ${String(Math.round(s.economy.population)).padStart(6)}  兵力 ${String(Math.round(s.order.milizia)).padStart(5)}`
    + (siege ? `  围攻 守${Math.round(siege.defender)}/攻${Math.round(siege.attacker)}=${siege.ratio.toFixed(2)} ${siege.state}` : '  （未到围攻）'));
}
