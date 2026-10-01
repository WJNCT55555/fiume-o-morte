/* 经济系统：可达上限探测。用真引擎跑，不用手算。
   1) 不干预默认线：吞吐/失业/人口的完整轨迹
   2) AP 约束下的经济最优线：每回合把 2 AP 全部投进经济卡
*/
'use strict';
const path = require('path');
const fs = require('fs');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));
require.extensions['.ts'] = (module, filename) => {
  const src = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const base = path.join(__dirname, '..', 'src');
for (const f of ['lib/core.js', 'game/data/world.js', 'game/data/parties.js', 'game/data/factions.js',
  'game/data/meta.js', 'game/engine/rules.js', 'game/registries/contentRegistry.ts',
  'game/engine/reducers.js', 'game/engine/selectors.js']) {
  require(path.join(base, f));
}
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, S = F.Sel, W = F.World, Core = F.Core;

/* ---------- 1. 不干预默认线 ---------- */
console.log('=== 1. 不干预默认线（史实难度，只在无事件时推进） ===');
let s = Eng.createState('1919-09', 'historical', 4242);
console.log('   回合   日期      吞吐   失业%   事态   金库    债务   人口   收入   支出   净');
let turn = 0;
while (turn++ < 400) {
  if (s.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    const opts = ev.options.filter(o => !o.condition || o.condition(s));
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
  } else {
    s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
  if (turn % 8 === 0 || s.phase === 'ended') {
    const e = s.economy;
    console.log(`   ${String(turn).padStart(4)}  ${s.date.y}-${String(s.date.m).padStart(2,'0')}-${String(s.date.d).padStart(2,'0')}`
      + `  ${e.traffic.toFixed(1).padStart(5)}  ${e.unemployment.toFixed(1).padStart(5)}`
      + `  ${s.order.coup.toFixed(0).padStart(5)}  ${s.funds.toFixed(0).padStart(6)}`
      + `  ${e.debt.toFixed(0).padStart(6)}  ${Math.round(e.population).toString().padStart(6)}`
      + `  ${e.lastRevenue.toFixed(0).padStart(5)}  ${e.lastSpending.toFixed(0).padStart(6)}`
      + `  ${e.lastNet.toFixed(1).padStart(7)}`);
  }
  if (s.phase === 'ended') {
    console.log(`   → 结局 ${s.ending} @ ${s.date.y}-${s.date.m}，人口 ${Math.round(s.economy.population)}`);
    break;
  }
}
console.log('   flags:', Object.keys(s.flags).filter(k => s.flags[k] === true).join(' '));

/* ---------- 2. AP 约束下的经济最优线 ---------- */
console.log('\n=== 2. 经济最优线：每回合 2 AP 全部投入经济类卡牌 ===');
const ECON = ['gv_dogana_yu', 'gv_lavori', 'gv_portofranco', 'gv_disoccupazione', 'gv_fisco',
  'az_molo', 'az_cucine', 'gv_bilancio'];
function playEcon(st) {
  let guard = 0, acted = 0;
  while (guard++ < 12) {
    const hand = S.hand(st).filter(c => c.playable);
    const pick = hand.find(c => ECON.includes(c.id));
    if (!pick) {
      // 抽一张经济卡进预留处
      const decks = S.decks(st).filter(d => d.drawable);
      let drew = false;
      for (const d of decks) {
        const card = d.cards.find(c => ECON.includes(c.id));
        if (card) { st = Eng.dispatch(st, { type: 'DRAW_CARD', cardId: card.id }).state; drew = true; break; }
      }
      if (!drew) break;
      continue;
    }
    const res = Eng.dispatch(st, { type: 'PLAY_CARD', cardId: pick.id });
    if (res.state === st) break;
    st = res.state;
    acted++;
    if (st.pendingCard) {
      const card = Eng.CARD_BY_ID[st.pendingCard];
      const oo = Eng.cardOptions(st, card).filter(o => o.enabled);
      if (oo.length) st = Eng.dispatch(st, { type: 'RESOLVE_CARD_OPTION', optionId: oo[0].id }).state;
    }
    if (st.ap <= 0) break;
  }
  return { st, acted };
}
let s2 = Eng.createState('1919-09', 'open', 99);
console.log('   回合   日期      吞吐   失业%   事态   金库    债务   人口  自由港 腹地 工程 出牌');
let t2 = 0;
while (t2++ < 400) {
  if (s2.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s2.currentEvent];
    const opts = ev.options.filter(o => !o.condition || o.condition(s2));
    s2 = Eng.dispatch(s2, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
  } else {
    playEcon(s2);
    const before = s2;
    s2 = Eng.dispatch(s2, { type: 'ADVANCE' }).state;
  }
  if (t2 % 8 === 0 || s2.phase === 'ended') {
    const e = s2.economy;
    console.log(`   ${String(t2).padStart(4)}  ${s2.date.y}-${String(s2.date.m).padStart(2,'0')}-${String(s2.date.d).padStart(2,'0')}`
      + `  ${e.traffic.toFixed(1).padStart(5)}  ${e.unemployment.toFixed(1).padStart(5)}`
      + `  ${s2.order.coup.toFixed(0).padStart(5)}  ${s2.funds.toFixed(0).padStart(6)}`
      + `  ${e.debt.toFixed(0).padStart(6)}  ${Math.round(e.population).toString().padStart(6)}`
      + `  ${String(s2.laws.portofranco).padStart(5)} ${e.hinterland.toFixed(0).padStart(4)}`
      + ` ${e.works.toFixed(0).padStart(4)}`);
  }
  if (s2.phase === 'ended') {
    console.log(`   → 结局 ${s2.ending} @ ${s2.date.y}-${s2.date.m}，人口 ${Math.round(s2.economy.population)}`);
    break;
  }
}
console.log(`   峰值吞吐 ${Math.max(...s2.series.traffic).toFixed(1)} · 最低失业 ${Math.min(...s2.series.unemployment).toFixed(1)}%`);
console.log(`   最终：自由港 ${s2.laws.portofranco} 腹地 ${s2.economy.hinterland.toFixed(0)} 转口 ${s2.economy.delta.toFixed(0)} 工程 ${s2.economy.works.toFixed(0)} 承认 ${s2.economy.recognition.toFixed(0)}`);
console.log(`   吞吐目标读数 ${R.trafficTarget(s2).toFixed(1)} · 工业生产 ${R.produzione(s2).toFixed(1)} · 外交压力 ${R.pressione(s2).toFixed(1)}`);
