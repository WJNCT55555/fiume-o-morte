'use strict';
/* 沙盒难度下的宪章链与 1920s 结局可达性 */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, R, Meta } = H;

/* 把沙盒专属的「指定抽牌」接进 agent：沙盒 mode='pick'，可以点名牌 */
function playSandbox(goalId, seed, opts) {
  opts = opts || {};
  const agent = ST.makeAgent(goalId, V.EVENTS[goalId] || {}, V.OPTS);
  let s = Eng.createState('1919-09', 'sandbox', seed);
  const evLog = [], cardLog = [];
  let g = 0;
  while (s.phase !== 'ended' && g++ < 6000) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      const pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      evLog.push({ at: s.date.y + '-' + s.date.m, id: ev.id, opt: pick.id });
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
      /* 沙盒：S.decks 的 mode === 'pick'，牌堆里列出全部候选，可以点名牌 */
      if (s.hand.length < s.handLimit) {
        const decks = S.decks(s).filter(d => d.drawable);
        const want = agent.draw(s, decks);
        const dv = decks.filter(d => d.id === want)[0] || decks[0];
        if (dv) {
          const cand = (dv.cards || []).slice();
          /* 用 agent 的打分挑一张最合目标的候选 */
          const ranked = agent.ranked(s, cand.map(c => Object.assign({ playable: true }, c)))
            .filter(x => x.score > -1000);
          const target = ranked.length ? ranked[0].id : (cand[0] && cand[0].id);
          if (target) {
            const r = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: target });
            if (r.state !== s) { s = r.state; cardLog.push({ at: s.date.y + '-' + s.date.m, id: target, drawn: true }); }
          }
        }
      }
      const hv = S.hand(s).filter(c => c.playable);
      const cid = agent.card(s, hv);
      const pc = hv.find(c => c.id === cid);
      if (!pc) break;
      const r = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pc.id });
      if (r.state === s) break;
      s = r.state;
      let optId = null;
      if (s.pendingCard) {
        const card = Eng.CARD_BY_ID[s.pendingCard];
        const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
        const o = oo.find(x => x.id === agent.option(s, card, oo)) || oo[0];
        if (!o) break;
        optId = o.id;
        const r2 = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: o.id });
        if (r2.state !== s) s = r2.state;
      }
      cardLog.push({ at: s.date.y + '-' + s.date.m, id: pc.id, opt: optId });
    }
    const before = s;
    const adv = Eng.dispatch(s, { type: 'ADVANCE' });
    if (adv.state === before) break;
    s = adv.state;
  }
  return { s, evLog, cardLog };
}

const CASES = process.argv[2] ? [[process.argv[2], null]] : [
  ['comune', 'ending_comune'],
  ['danzig', 'ending_danzig'],
  ['fiume_o_morte', 'ending_fiume_o_morte'],
  ['exile_endured', 'ending_exile_endured'],
];

console.log('=== 沙盒难度（dateRule=conditionFirst，hand=5，coupMul=0.5） ===\n');
for (const [goal, want] of CASES) {
  if (!ST.GOALS[goal]) { console.log(`${goal}: 无策略，跳过`); continue; }
  console.log(`--- goal ${goal} ---`);
  for (const seed of [100, 137, 174]) {
    let r;
    try { r = playSandbox(goal, seed); } catch (e) { console.log(`  seed ${seed} ERR ${e.message}`); continue; }
    const s = r.s;
    console.log(`  seed ${String(seed).padStart(4)} → ${String(s.ending).padEnd(24)} @${s.date.y}-${String(s.date.m).padStart(2,'0')}`
      + `  carta_done=${!!s.flags.carta_done} guarantee=${!!s.flags.international_guarantee}`
      + ` porto_revived=${!!s.flags.porto_revived} coup=${!!s.flags.coup_done} exile=${!!s.flags.exile}`
      + ` treaty=${!!s.flags.treaty_rome} 吞吐${Math.round(s.economy.traffic)} 人口${Math.round(s.economy.population)}`);
    const chain = r.evLog.filter(e => /deambris|carta|natale|rome|coup/.test(e.id));
    if (seed === 100) {
      console.log(`     宪章/终局链: ${chain.map(e => e.id + ':' + e.opt).join(' → ')}`);
      const laws = s.laws;
      console.log(`     laws=${JSON.stringify(laws)}`);
    }
  }
  console.log('');
}
