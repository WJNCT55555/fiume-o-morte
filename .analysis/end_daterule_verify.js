'use strict';
/* 验证三档难度的事件触发规则：
     forced         史实：带日期的事件按年月推入（日期优先于条件）
     conditionFirst 普通/沙盒：同时有日期与条件 → 按条件；只有日期无条件 → 按年月
     dateOnly       （未使用的兜底）
   并对比规则改动前后「哪些事件会触发」。 */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, Meta } = H;

const ALL = Object.keys(Eng.EVENT_BY_ID).map(k => Eng.EVENT_BY_ID[k]);
const DATED = ALL.filter(e => e.date && !e.superEvent && !e.chain);
const DATE_ONLY = DATED.filter(e => !e.condition);
const DATE_AND_COND = DATED.filter(e => !!e.condition);
const COND_ONLY = ALL.filter(e => !e.date && !e.superEvent && !e.chain);

console.log('=== 事件分类（按新规则关心的维度） ===');
console.log(`  带日期 且 有条件 : ${DATE_AND_COND.length}  → ${DATE_AND_COND.map(e => e.id).join(', ')}`);
console.log(`  带日期 但 无条件 : ${DATE_ONLY.length}  → ${DATE_ONLY.map(e => e.id).join(', ')}`);
console.log(`  无日期 有条件    : ${COND_ONLY.length}（全部按条件触发，三档一致）`);
console.log(`  superEvent       : ${ALL.filter(e => e.superEvent).length}（按条件，三档一致）`);

/* 跑一局，记录事件首次触发的年月 */
function run(goalId, diff, seed) {
  const agent = ST.makeAgent(goalId, V.EVENTS[goalId] || {}, V.OPTS);
  let s = Eng.createState('1919-09', diff, seed);
  const firstFire = {};
  let g = 0;
  while (s.phase !== 'ended' && g++ < 8000) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      const pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      if (firstFire[ev.id] == null) firstFire[ev.id] = s.date.y + '-' + String(s.date.m).padStart(2, '0');
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
        if (diff === 'sandbox') {
          const dv = decks.filter(d => d.id === agent.draw(s, decks))[0] || decks[0];
          if (dv) {
            const cand = (dv.cards || []).slice();
            const ranked = agent.ranked(s, cand.map(c => Object.assign({ playable: true }, c))).filter(x => x.score > -1000);
            const target = ranked.length ? ranked[0].id : (cand[0] && cand[0].id);
            if (target) { const r = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: target }); if (r.state !== s) s = r.state; }
          }
        } else {
          const d = agent.draw(s, decks);
          if (d) { const r = Eng.dispatch(s, { type: 'DRAW_RANDOM', deck: d }); if (r.state !== s) s = r.state; }
        }
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
  return { s, firstFire };
}

for (const diff of ['historical', 'open', 'sandbox']) {
  const r = run('historical', diff, 100);
  console.log('\n' + '='.repeat(80));
  console.log(`### ${diff}（dateRule=${W.DIFFICULTIES.filter(d => d.id === diff)[0].dateRule}）  结局 ${r.s.ending} @${r.s.date.y}-${r.s.date.m}`);
  console.log('='.repeat(80));
  console.log('  [带日期且条件] 触发情况（普通/沙盒应由条件决定时机）：');
  DATE_AND_COND.forEach(e => {
    const want = e.date.y + '-' + String(e.date.m).padStart(2, '0');
    const got = r.firstFire[e.id] || '未触发';
    const onDate = got === want || (got !== '未触发' && got.slice(0, 4) === String(e.date.y));
    console.log(`    ${e.id.padEnd(28)} 史定 ${want.padEnd(8)} 实触发 ${got.padEnd(9)} ${got === '未触发' ? '' : (onDate ? '(同年)' : '(偏离)')}`);
  });
  console.log('  [带日期但无条件] 触发情况（三档都应按年月）：');
  DATE_ONLY.forEach(e => {
    const want = e.date.y + '-' + String(e.date.m).padStart(2, '0');
    const got = r.firstFire[e.id] || '未触发';
    console.log(`    ${e.id.padEnd(28)} 史定 ${want.padEnd(8)} 实触发 ${got.padEnd(9)} ${got === want ? '✓ 准点' : (got === '未触发' ? '' : '✗ 偏离')}`);
  });
}
