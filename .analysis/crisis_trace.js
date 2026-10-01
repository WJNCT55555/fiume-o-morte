/* 事态系统实测：Δ 的真实值、140 上限的后果、血腥圣诞后的重建速度 */
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, Core = F.Core;

let s = Eng.createState('1919-09', 'historical', 4242);
console.log('=== 事态 Δ 实测（史实难度，事件选第一项） ===');
console.log('  回合   日期      事态     Δ     T     权威  驻军  热忱  小队  暴力   兵力   民意');
let turn = 0, prevCoup = s.order.coup, natale = null, coupMark = null;
const beforeNatale = [];
while (turn++ < 500) {
  const c0 = s.order.coup;
  if (s.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    const opts = ev.options.filter(o => !o.condition || o.condition(s));
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
  } else {
    s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
  const o = s.order, T = R.tension(s) * 100;
  const d = o.coup - c0;   // 注意：事件也可能直接改 coup，这里看的是净变化
  if (turn <= 20 || turn % 10 === 0) {
    console.log(`  ${String(turn).padStart(4)}  ${s.date.y}-${String(s.date.m).padStart(2,'0')}-${String(s.date.d).padStart(2,'0')}`
      + `  ${o.coup.toFixed(1).padStart(6)} ${d.toFixed(2).padStart(6)} ${T.toFixed(1).padStart(6)}`
      + ` ${o.authority.toFixed(0).padStart(5)} ${o.garrison.toFixed(0).padStart(5)} ${o.fervour.toFixed(0).padStart(5)}`
      + ` ${o.squadre.toFixed(0).padStart(5)} ${o.violence.toFixed(0).padStart(5)}`
      + ` ${o.milizia.toFixed(0).padStart(6)} ${s.legitimacy.toFixed(0).padStart(6)}`);
  }
  if (s.flags.natale_done && !natale) {
    natale = { y: s.date.y, m: s.date.m, coup: o.coup };
    console.log(`   >>> 血腥圣诞触发于 ${s.date.y}-${s.date.m}，事后事态 = ${o.coup.toFixed(1)}`);
  }
  if (s.flags.coup_done && !coupMark) {
    coupMark = { y: s.date.y, m: s.date.m, coup: o.coup };
    console.log(`   >>> 法西斯接管触发于 ${s.date.y}-${s.date.m}，事态 = ${o.coup.toFixed(1)}`);
  }
  if (turn === 48) {   // 1920-09 快照
    console.log(`   [1920-09 快照] T=${T.toFixed(1)} 权威${o.authority.toFixed(0)} 驻军${o.garrison.toFixed(0)}`
      + ` 热忱${o.fervour.toFixed(0)} 小队${o.squadre.toFixed(0)} 兵力${o.milizia.toFixed(0)} 民意${s.legitimacy.toFixed(0)}`);
    console.log(`   [1920-09 快照] Δ(实算) = ${R.coupDelta(s, 1).toFixed(2)}`
      + `（蜜月系数后；×0.125 前的原始值 = ${(R.coupDelta(s,1)/0.125).toFixed(2)}）`);
  }
  if (s.phase === 'ended') break;
}
console.log(`\n   总计 ${turn} 回合 · 结局 ${s.ending} · 事态峰值 ${Math.max(...s.series.coup).toFixed(0)}`);

/* 血腥圣诞后的 Δ 重建速度 */
console.log('\n=== 血腥圣诞后 Δ 的重建 ===');
let s2 = Eng.createState('1919-09', 'historical', 4242);
let t2 = 0, after = [];
while (t2++ < 500) {
  if (s2.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s2.currentEvent];
    const opts = ev.options.filter(o => !o.condition || o.condition(s2));
    s2 = Eng.dispatch(s2, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
  } else {
    const before = s2.order.coup;
    s2 = Eng.dispatch(s2, { type: 'ADVANCE' }).state;
    if (s2.flags.natale_done && !s2.flags.coup_done) {
      after.push([s2.date.y, s2.date.m, before, s2.order.coup, s2.order.coup - before,
        R.coupDelta(s2, 1), s2.order.coupMilestones.length]);
    }
  }
  if (s2.flags.coup_done) break;
}
console.log('   日期      事前    事后    实际Δ   规则Δ  里程碑');
after.slice(0, 40).forEach(r => console.log(`   ${r[0]}-${String(r[1]).padStart(2,'0')}`
  + `   ${r[2].toFixed(1).padStart(6)} ${r[3].toFixed(1).padStart(6)} ${r[4].toFixed(2).padStart(7)}`
  + ` ${r[5].toFixed(2).padStart(7)} ${String(r[6]).padStart(6)}`));
console.log(`   血腥圣诞后到法西斯接管共 ${after.length} 回合 = ${(after.length/2).toFixed(1)} 个月`);
