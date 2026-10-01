/* 经济系统：真正被动（零干预）基线与三条策略线的对比。用真引擎。
   被动线的定义：事件只选第一个可用项，且不抽牌、不出牌——纯推进。
   这样才能回答「如果不经营经济，会发生什么」。 */
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, S = F.Sel, Core = F.Core;

function report(tag, s, turns) {
  const e = s.economy;
  console.log(`  ${tag}`);
  console.log(`    结束 ${s.date.y}-${String(s.date.m).padStart(2,'0')} · ${turns} 回合 · 结局 ${s.ending}`);
  console.log(`    吞吐 ${e.traffic.toFixed(1)}（目标 ${R.trafficTarget(s).toFixed(1)}）· 失业 ${e.unemployment.toFixed(1)}%`
    + ` · 人口 ${Math.round(e.population)} · 工业生产 ${R.produzione(s).toFixed(1)}`);
  console.log(`    金库 ${s.funds.toFixed(0)} · 债务 ${e.debt.toFixed(0)} · 拖欠 ${e.arrears.toFixed(0)}`
    + ` · 资本信心 ${e.capitalConfidence.toFixed(1)} · 通胀 ${e.inflation.toFixed(1)}%`);
  console.log(`    收入 ${e.lastRevenue.toFixed(1)} / 支出 ${e.lastSpending.toFixed(1)} / 净 ${e.lastNet.toFixed(1)}`);
  console.log(`    法律 自由港${s.laws.portofranco} 关税${s.laws.dogana} 财政${s.laws.fisco} 劳动${s.laws.lavoro} 宪章${s.laws.statuto}`);
  const peak = Math.max(...s.series.traffic), low = Math.min(...s.series.unemployment);
  console.log(`    series 峰值吞吐 ${peak.toFixed(1)} · 最低失业 ${low.toFixed(1)}%`
    + ` · 事态峰值 ${Math.max(...s.series.coup).toFixed(0)}`);
  const lost = 52000 - Math.round(e.population);
  console.log(`    人口净变化 ${lost >= 0 ? '-' : '+'}${Math.abs(lost)}`);
}

/* ---- A. 真正被动：不抽牌、不出牌 ---- */
console.log('=== A. 真正被动线（不抽牌 / 不出牌，事件选第一项） ===');
let s = Eng.createState('1919-09', 'historical', 4242);
let turn = 0;
const traj = [];
while (turn++ < 500) {
  if (s.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    const opts = ev.options.filter(o => !o.condition || o.condition(s));
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
  } else {
    s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
  if (turn % 8 === 0) traj.push([s.date.y, s.date.m, s.economy.traffic, s.economy.unemployment,
    s.order.coup, s.funds, s.economy.debt, Math.round(s.economy.population)]);
  if (s.phase === 'ended') break;
}
console.log('    回合   日期      吞吐   失业%   事态   金库    债务   人口');
traj.forEach((r, i) => console.log(`   ${String((i+1)*8).padStart(4)}  ${r[0]}-${String(r[1]).padStart(2,'0')}`
  + `     ${r[2].toFixed(1).padStart(5)}  ${r[3].toFixed(1).padStart(5)}  ${r[4].toFixed(0).padStart(5)}`
  + `  ${r[5].toFixed(0).padStart(6)}  ${r[6].toFixed(0).padStart(6)}  ${String(r[7]).padStart(6)}`));
report('被动线', s, turn);
console.log('    flags:', Object.keys(s.flags).filter(k => s.flags[k] === true).join(' '));

/* ---- B. 只调整税率，不碰卡牌 ---- */
console.log('\n=== B. 只调税率（每回合把 4 条税收到 0.9 上限，不出牌） ===');
let s2 = Eng.createState('1919-09', 'open', 4242);
let t2 = 0;
while (t2++ < 500) {
  if (s2.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s2.currentEvent];
    const opts = ev.options.filter(o => !o.condition || o.condition(s2));
    s2 = Eng.dispatch(s2, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
  } else {
    for (const k of ['porto', 'dogana', 'consumo', 'reddito']) {
      s2 = Eng.dispatch(s2, { type: 'SET_TAX', tax: k, value: 0.9 }).state;
    }
    s2 = Eng.dispatch(s2, { type: 'ADVANCE' }).state;
  }
  if (s2.phase === 'ended') break;
}
report('满税线', s2, t2);

/* ---- C. 资本信心对比：满税 vs 港口费优先 ---- */
console.log('\n=== C. 税率结构与资本信心的相互作用 ===');
for (const [tag, tax] of [['全 0.90', { porto: .9, dogana: .9, consumo: .9, reddito: .9 }],
                          ['只港口 0.90', { porto: .9, dogana: .5, consumo: .45, reddito: 0 }],
                          ['港口 0.90 + 所得 0.90', { porto: .9, dogana: .5, consumo: .45, reddito: .9 }],
                          ['港口 0.90 + 关税 0.90', { porto: .9, dogana: .9, consumo: .45, reddito: 0 }]]) {
  const st = Eng.createState('1919-09', 'open', 7);
  st.taxRates = tax;
  const rev = R.revenue(st), sp = R.spending(st);
  console.log(`  ${tag.padEnd(22)} 收入 ${rev.total.toFixed(1).padStart(6)}`
    + `（港口 ${rev.porto.toFixed(0)} / 关税 ${rev.dogana.toFixed(0)} / 消费 ${rev.consumo.toFixed(0)} / 所得 ${rev.reddito.toFixed(0)}）`
    + ` 净 ${(rev.total-sp.total).toFixed(1).padStart(6)}`);
}
