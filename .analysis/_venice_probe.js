'use strict';
/* 威尼斯到底卡在哪：条件何时成立 vs 游戏何时才做判定（checkEnd） */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, R, Meta } = H;

function probe(goalId, diff, seed) {
  const agent = ST.makeAgent(goalId, V.EVENTS[goalId] || {}, V.OPTS);
  let s = Eng.createState('1919-09', diff, seed);
  const rows = [];
  let g = 0;
  let veniceFirst = null;      // 威尼斯条件首次成立
  let settleAt = null;         // 游戏首次结算
  let romeAt = null;

  const venice = Meta.ENDINGS.filter(e => e.id === 'ending_venice')[0];
  const hist = Meta.ENDINGS.filter(e => e.id === 'ending_historical')[0];

  while (s.phase !== 'ended' && g++ < 8000) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      const pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      if (ev.id === 'ev_1924_01_rome') romeAt = s.date.y + '-' + s.date.m;
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
      if (s.phase === 'ended') { settleAt = s.date.y + '-' + s.date.m; break; }
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
    /* 每回合检查一次：威尼斯条件成立了吗？历史结局条件成立了吗？ */
    const ym = s.date.y + '-' + String(s.date.m).padStart(2, '0');
    const vOk = !!venice.check(s), hOk = !!hist.check(s);
    const key = vOk + '|' + hOk;
    if (!rows.length || rows[rows.length - 1].key !== key) {
      rows.push({ ym, key, vOk, hOk,
        pf: s.laws.portofranco, tr: Math.round(s.economy.traffic),
        si: Math.round(s.factions.sindacalisti.inf), cd: !!s.flags.coup_done });
    }
    if (vOk && !veniceFirst) veniceFirst = ym;

    const before = s;
    const adv = Eng.dispatch(s, { type: 'ADVANCE' });
    if (adv.state === before) break;
    s = adv.state;
  }
  if (s.phase === 'ended' && !settleAt) settleAt = s.date.y + '-' + s.date.m;

  console.log(`\n=== ${goalId} / ${diff} / seed ${seed} ===`);
  console.log(`  威尼斯条件首次成立: ${veniceFirst || '从未'}`);
  console.log(`  罗马条约触发:       ${romeAt || '未触发'}`);
  console.log(`  游戏结算于:         ${settleAt || '未结算'}  → ${s.ending}`);
  console.log('  条件状态变化（只在变化时打印）:');
  rows.forEach(r => {
    console.log(`    ${r.ym.padEnd(9)} 威尼斯=${String(r.vOk).padEnd(5)} 历史=${String(r.hOk).padEnd(5)}`
      + `  自由港${r.pf} 吞吐${String(r.tr).padStart(3)} 工团派${String(r.si).padStart(3)} coup=${r.cd}`);
  });
  return s;
}

probe('venice', 'open', 100);
probe('venice', 'historical', 100);
