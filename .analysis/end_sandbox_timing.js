'use strict';
/* 沙盒：精确测出 carta_done / international_guarantee / porto_revived 成立的时点，
   以及为什么它们仍然换不到 1920s 结局。 */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, R, Meta } = H;

const WATCH = ['charter_program', 'charter_promulgated', 'charter_debate_resolved',
  'carta_done', 'international_guarantee', 'porto_revived', 'treaty_rome',
  'coup_done', 'exile', 'stay', 'martyred', 'dannunzio_left'];

function run(goalId, seed, diff) {
  const agent = ST.makeAgent(goalId, V.EVENTS[goalId] || {}, V.OPTS);
  let s = Eng.createState('1919-09', diff, seed);
  const marks = {}, first = {};
  WATCH.forEach(f => { first[f] = null; });
  let g = 0;
  while (s.phase !== 'ended' && g++ < 6000) {
    WATCH.forEach(f => { if (s.flags[f] === true && first[f] == null) first[f] = s.date.y + '-' + s.date.m; });
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      const pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
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
        const sandbox = diff === 'sandbox';
        if (sandbox) {
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
  WATCH.forEach(f => { if (s.flags[f] === true && first[f] == null) first[f] = s.date.y + '-' + s.date.m; });
  return { s, first };
}

console.log('=== 沙盒 vs 史实：关键 flag 首次成立时点 ===\n');
for (const goal of ['comune', 'danzig']) {
  for (const diff of ['sandbox', 'historical']) {
    const r = run(goal, 100, diff);
    const s = r.s;
    console.log(`[${goal} / ${diff}]  结局 ${s.ending} @${s.date.y}-${s.date.m}  phase=${s.phase}`);
    const parts = WATCH.filter(f => r.first[f]).map(f => `${f}@${r.first[f]}`);
    console.log('   ' + (parts.join('  ') || '（无）'));
    console.log(`   终局：人口${Math.round(s.economy.population)} 吞吐${Math.round(s.economy.traffic)} laws=${JSON.stringify(s.laws)}`);
    console.log('');
  }
}

console.log('=== 硬结束条件在沙盒下的最早触发点 ===');
{
  /* 无政变、无流亡时，1924-01 之前有没有任何 hardEnd？ */
  const s = Eng.createState('1919-09', 'sandbox', 1);
  const probes = [
    ['1919-09', { y: 1919, m: 9 }], ['1922-03', { y: 1922, m: 3 }],
    ['1923-12', { y: 1923, m: 12 }], ['1924-01', { y: 1924, m: 1 }],
    ['1924-02', { y: 1924, m: 2 }], ['1924-03', { y: 1924, m: 3 }],
  ];
  for (const [label, d] of probes) {
    const c = Eng.createState('1919-09', 'sandbox', 1);
    c.date = { y: d.y, m: d.m, d: 15 };
    c.flags.treaty_rome = true;           /* 罗马条约已签 */
    c.flags.carta_done = true;            /* 宪章已完成 */
    c.flags.international_guarantee = true; /* 共同保证已到手 */
    Eng.checkEnd(c);
    console.log(`   treaty_rome + carta_done + guarantee，日期 ${label} → hardEnd=${!!c.ending}${c.ending ? ' 结算为 ' + c.ending : ''}`);
  }
}
