'use strict';
/* 为每个可达结局提取「关键步骤」：事件选择序列 + 打出的卡 + 判定时的关键数值。 */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, R, Meta } = H;

const CASES = [
  ['silent_port', 'ending_silent_port', 'historical'],
  ['fuga', 'ending_fuga', 'historical'],
  ['fascio', 'ending_fascio', 'historical'],
  ['civil_strife', 'ending_civil_strife', 'historical'],
  ['historical', 'ending_eviction', 'historical'],
  ['marcia_1920', 'ending_marcia_1920', 'historical'],
];

/* 带日志的对局，记录事件与卡牌 */
function runLogged(goalId, seed, difficulty) {
  const agent = ST.makeAgent(goalId, V.EVENTS[goalId] || {}, V.OPTS);
  let s = Eng.createState('1919-09', difficulty, seed);
  const evLog = [], cardLog = [];
  let g = 0;
  while (s.phase !== 'ended' && g++ < 5000) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      const pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      evLog.push({ at: s.date.y + '-' + String(s.date.m).padStart(2, '0'), id: ev.id, opt: pick.id, zh: (ev.title && ev.title.zh) || '' });
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
      if (s.phase === 'ended') break;
      continue;
    }
    const t = agent.tax(s);
    for (const k of Object.keys(t)) s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: t[k] }).state;
    const p = agent.posture(s);
    if (p && p !== s.posture) s = Eng.dispatch(s, { type: 'SET_POSTURE', posture: p }).state;
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
      const card = Eng.CARD_BY_ID[pc.id];
      const r = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pc.id });
      if (r.state === s) break;
      s = r.state;
      let optId = null;
      if (s.pendingCard) {
        const c2 = Eng.CARD_BY_ID[s.pendingCard];
        const oo = Eng.cardOptions(s, c2).filter(o => o.enabled);
        const o = oo.find(x => x.id === agent.option(s, c2, oo)) || oo[0];
        if (!o) break;
        optId = o.id;
        const r2 = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: o.id });
        if (r2.state !== s) s = r2.state;
      }
      cardLog.push({ at: s.date.y + '-' + String(s.date.m).padStart(2, '0'), id: pc.id, name: (card.name && card.name.zh) || '', opt: optId });
    }
    const before = s;
    const adv = Eng.dispatch(s, { type: 'ADVANCE' });
    if (adv.state === before) break;
    s = adv.state;
  }
  return { s, evLog, cardLog };
}

for (const [goalId, endingId, diff] of CASES) {
  const r = runLogged(goalId, 100, diff);
  const s = r.s;
  console.log('\n' + '='.repeat(100));
  console.log(`结局 ${endingId}  ← goal ${goalId} / ${diff} / seed 100`);
  console.log('='.repeat(100));
  console.log(`结束：${s.date.y}-${s.date.m}  ending=${s.ending}  回合=${s.turn}`);
  console.log(`关键数值：人口 ${Math.round(s.economy.population)} · 吞吐 ${Math.round(s.economy.traffic)} · 失业 ${Math.round(s.economy.unemployment)}`
    + ` · 兵力 ${Math.round(s.order.milizia)} · 暴力 ${Math.round(s.order.violence)} · 政变轴 ${Math.round(s.order.coup)}`
    + ` · 党内轴 ${Math.round(s.order.subversion)} · 合法性 ${Math.round(s.legitimacy)} · 金库 ${Math.round(s.funds)}`);
  console.log(`laws: ${JSON.stringify(s.laws)}`);
  const rel = Object.keys(s.flags).filter(k => s.flags[k] === true).sort();
  console.log(`flags(${rel.length}): ${rel.join(', ')}`);
  console.log(`journals: ${Object.entries(s.journals).map(([k, v]) => k + ':' + (v.done ? 'done' : v.failed ? 'FAIL' : 'act')).join(' ')}`);
  /* 事件：只列「非重复性」的决策，重复事件折叠 */
  const counts = {};
  r.evLog.forEach(e => { counts[e.id] = (counts[e.id] || 0) + 1; });
  console.log('\n-- 事件决策（重复事件折叠为 ×N）--');
  const seen = {};
  r.evLog.forEach(e => {
    if (counts[e.id] > 2) {
      if (seen[e.id]) { seen[e.id].n++; return; }
      seen[e.id] = { n: 1, e };
      return;
    }
    console.log(`   ${e.at}  ${e.id.padEnd(30)} → ${e.opt}`);
  });
  Object.keys(seen).forEach(k => {
    console.log(`   （重复）${k.padEnd(30)} ×${seen[k].n}  最后一次 → ${seen[k].e.opt}`);
  });
  console.log('\n-- 打出的卡（按 id 统计）--');
  const cc = {};
  r.cardLog.forEach(c => { cc[c.id] = cc[c.id] || { n: 0, opts: {} }; cc[c.id].n++; if (c.opt) cc[c.id].opts[c.opt] = (cc[c.id].opts[c.opt] || 0) + 1; });
  Object.entries(cc).sort((a, b) => b[1].n - a[1].n).forEach(([id, v]) => {
    const card = Eng.CARD_BY_ID[id];
    console.log(`   ${id.padEnd(28)} ×${String(v.n).padStart(2)}  「${(card.name && card.name.zh) || ''}」  选项: ${Object.entries(v.opts).map(([k, n]) => k + '×' + n).join(' ')}`);
  });
}
