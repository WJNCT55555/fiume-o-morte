/* 两个基础事实的测量，用来给门槛定一个可达的值：
   (1) 认真经营时，军团兵力能涨到多少？上限在哪一回合？
   (2) 对局真正的结束点是何时？（不是日志自己设的截止日） */
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
const F = globalThis.Fiume, Eng = F.Engine, S = F.Sel, W = F.World, Core = F.Core;

/* 只做两件事：把四条税收到 0.9（收入最大化），优先打征兵/经济卡。
   不参与进军线。目的只是量出兵力与时间的天花板。 */
function run(seed, wantTrace) {
  let s = Eng.createState('1919-09', 'historical', seed);
  const rows = [];
  let g = 0;
  while (s.phase !== 'ended' && g++ < 400) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s.currentEvent = null; continue; }
      const opts = ev.options.filter(o => !o.condition || o.condition(s));
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
    } else {
      for (const k of ['porto', 'dogana', 'consumo', 'reddito']) {
        s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: 0.9 }).state;
      }
      let plays = 0;
      while (plays++ < 4) {
        if (s.hand.length < s.handLimit) {
          const decks = S.decks(s).filter(d => d.drawable);
          const pref = ['gv_bilancio', 'az_arditi', 'az_cucine', 'az_volantini', 'gv_nave',
            'gv_lavori', 'gv_portofranco', 'gv_disoccupazione'];
          let drew = false;
          for (const id of pref) {
            for (const d of decks) if (d.cards.some(c => c.id === id)) {
              s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: id }).state; drew = true; break;
            }
            if (drew) break;
          }
          if (!drew) break;
        }
        const cards = S.hand(s).filter(c => c.playable);
        const pick = cards.find(c => ['gv_bilancio', 'az_arditi', 'az_cucine', 'az_volantini', 'gv_nave'].includes(c.id)) || cards[0];
        if (!pick) break;
        const res = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pick.id });
        if (res.state === s) break;
        s = res.state;
        if (s.pendingCard) {
          const card = Eng.CARD_BY_ID[s.pendingCard];
          const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
          if (oo.length) s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: oo[0].id }).state;
        }
      }
      s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
    }
    rows.push({
      t: s.turn, ym: s.date.y + '-' + String(s.date.m).padStart(2, '0'),
      mil: Math.round(s.order.milizia), funds: Math.round(s.funds),
      traffic: +s.economy.traffic.toFixed(1), coup: Math.round(s.order.coup),
      forz: s.forze ? Math.round(s.forze.forzearmate) : null
    });
  }
  return { s, rows, g };
}

console.log('=== 兵力/时间天花板（史实难度，四税拉满 + 优先征兵卡）===');
for (const seed of [4242, 777]) {
  const { s, rows, g } = run(seed, false);
  const peak = rows.reduce((a, b) => (b.mil > a.mil ? b : a), rows[0]);
  const peakFunds = rows.reduce((a, b) => (b.funds > a.funds ? b : a), rows[0]);
  console.log(`\n  seed ${seed}: 结局 ${s.ending} @ ${s.date.y}-${s.date.m}（${g} 步）`);
  console.log(`    兵力峰值 ${peak.mil} @ ${peak.ym} (回合 ${peak.t})`);
  console.log(`    金库峰值 ${peakFunds.funds} @ ${peakFunds.ym}`);
  console.log(`    结束时 兵力 ${Math.round(s.order.milizia)} · 军官团 ${s.forze ? Math.round(s.forze.forzearmate) : '-'} · 吞吐 ${s.economy.traffic.toFixed(1)}`);
  console.log('    兵力轨迹（每 8 回合）:');
  rows.filter(r => r.t % 8 === 0).forEach(r => {
    console.log(`      ${r.ym} t=${String(r.t).padStart(3)} 兵力 ${String(r.mil).padStart(5)}`
      + ` 金库 ${String(r.funds).padStart(6)} 吞吐 ${String(r.traffic).padStart(5)} 事态 ${String(r.coup).padStart(3)}`);
  });
  const marks = rows.filter(r => r.mil >= 6000);
  if (marks.length) console.log(`    首次 ≥6000：${marks[0].ym}（回合 ${marks[0].t}）`);
  else console.log('    从未达到 6000');
}

console.log('\n=== 对局真正的结束约束 ===');
const { s: endS, rows: endRows } = run(4242, false);
console.log(`   实测结束：${endS.date.y}-${endS.date.m} · ${endS.ending}`);
console.log('   → 日志的截止日应该由这个约束决定，而不是我自己挑的日期');
console.log('   → 血腥圣诞 1920-12 会把 coup 重置，所以第一次危机不是终点');
console.log('   → 真正终结「进军」可能性的是：法西斯政变 / 罗马条约 / 血腥圣诞投降');
