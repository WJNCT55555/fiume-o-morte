'use strict';
/* 不改源码，运行时把沙盒的 dated 改成 false（= 用户定义：沙盒事件同普通），
   对比「现状(dated:true)」与「按定义(dated:false)」的差别。

   做法：临时替换 W.DIFFICULTIES 里 sandbox 那一项。因为 createState 每次按 id 查表，
   所以替换后新建的状态就走新配置；本进程结束后不影响任何文件。
*/
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, R, Meta } = H;

function setSandboxDated(flag) {
  W.DIFFICULTIES.forEach(d => { if (d.id === 'sandbox') d.dated = flag; });
}
const ORIGINAL = W.DIFFICULTIES.filter(d => d.id === 'sandbox')[0].dated;

const DATED_EVENTS = Object.keys(Eng.EVENT_BY_ID)
  .map(k => Eng.EVENT_BY_ID[k])
  .filter(e => e.date && !e.superEvent && !e.chain);

/* 沙盒玩法：可点名抽牌 */
function playSandbox(goalId, seed) {
  const agent = ST.makeAgent(goalId, V.EVENTS[goalId] || {}, V.OPTS);
  let s = Eng.createState('1919-09', 'sandbox', seed);
  const fired = [];
  let g = 0;
  while (s.phase !== 'ended' && g++ < 6000) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      const pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      fired.push(ev.id);
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
        const dv = decks.filter(d => d.id === agent.draw(s, decks))[0] || decks[0];
        if (dv) {
          const cand = (dv.cards || []).slice();
          const ranked = agent.ranked(s, cand.map(c => Object.assign({ playable: true }, c))).filter(x => x.score > -1000);
          const target = ranked.length ? ranked[0].id : (cand[0] && cand[0].id);
          if (target) { const r = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: target }); if (r.state !== s) s = r.state; }
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
  return { s, fired };
}

console.log(`原始 sandbox.dated = ${ORIGINAL}\n`);

for (const [label, flag] of [['现状 dated=true（照史实）', true], ['按定义 dated=false（同普通）', false]]) {
  setSandboxDated(flag);
  console.log('='.repeat(78));
  console.log(`### ${label}`);
  console.log('='.repeat(78));
  for (const goal of ['danzig', 'comune', 'carnaro', 'fiume_o_morte']) {
    const r = playSandbox(goal, 100);
    const s = r.s;
    const datedFired = [...new Set(r.fired)].filter(id => DATED_EVENTS.some(e => e.id === id));
    console.log(`  ${goal.padEnd(15)} → ${String(s.ending).padEnd(22)} @${s.date.y}-${String(s.date.m).padStart(2, '0')}`
      + `  carta_done=${String(!!s.flags.carta_done).padEnd(5)} guarantee=${String(!!s.flags.international_guarantee).padEnd(5)}`
      + ` treaty=${String(!!s.flags.treaty_rome).padEnd(5)} coup=${!!s.flags.coup_done}`);
    console.log(`     本局触发的「带日期事件」: ${datedFired.length ? datedFired.join(', ') : '（一个都没有）'}`);
  }
  console.log('');
}

setSandboxDated(ORIGINAL);   /* 还原，避免影响同进程后续 */
console.log(`已还原 sandbox.dated = ${W.DIFFICULTIES.filter(d => d.id === 'sandbox')[0].dated}`);
