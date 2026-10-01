/* az_legione_finanziaria 校验：结构、双语、键合法性、条件门、零和，
   以及最重要的——这张卡会不会把经济打崩（金库/债务/通胀/收入）。 */
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, W = F.World;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
const near = (a, b, e) => Math.abs(a - b) <= (e == null ? 1e-6 : e);

const card = Eng.CARD_BY_ID['az_legione_finanziaria'];
const EXPECT = ['obbligazioni', 'milano', 'riscatto', 'affitto', 'fascisti', 'nulla'];
const CLS = W.CLASSES.map(c => c.id), FAC = W.FACTIONS.map(f => f.id), PARTIES = W.PARTIES.map(p => p.id);
const FORZE = W.FORZE.map(f => f.id);
const ORDER = ['authority', 'garrison', 'fervour', 'squadre', 'violence', 'coup', 'subversion',
  'milizia', 'civicGuard', 'police', 'legionari', 'carabinieri', 'garrisonTroops'];
const LAWS = W.LAWS.map(l => l.id);

function play(optionId, seed, pre) {
  let s = Eng.createState('1919-09', 'historical', seed == null ? 42 : seed);
  if (pre) pre(s);
  const pre_funds = s.funds;
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId }).state;
  return s;
}
/* Each option both costs 1 K£ and raises a large sum, so the pre-state has to be
   captured per option rather than shared across the loop. */
function run(optionId, seed, pre) {
  let s = Eng.createState('1919-09', 'historical', seed == null ? 42 : seed);
  if (pre) pre(s);
  const before = {
    funds: s.funds, debt: s.economy.debt, inflation: s.economy.inflation,
    capitalConfidence: s.economy.capitalConfidence,
    forzeFascisti: s.forze.fascisti, fac: JSON.parse(JSON.stringify(s.factions)),
    flags: Object.assign({}, s.flags)
  };
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId }).state;
  return { s, before };
}

console.log('=== 1. 结构与双语 ===');
ok(!!card, 'CARD_BY_ID 能检索到');
ok(card.deck === 'azione', `deck = ${card.deck}`);
ok(!card.forces && !card.ministry, '不带 forces / ministry');
ok(card.cost && card.cost.ap === 1, `AP = ${card.cost && card.cost.ap}`);
ok(card.cooldown === 9, `cooldown = ${card.cooldown}（重资源卡，9 档）`);
ok(!!card.name.zh && !!card.name.it, 'name 双语');
ok(!!card.text.zh && !!card.text.it, 'text 双语');
ok(card.options.length === 6, `选项数 ${card.options.length}`);
ok(card.options.map(o => o.id).join(',') === EXPECT.join(','), '选项顺序正确');
card.options.forEach(o => {
  ok(!!o.text.zh && !!o.text.it, `${o.id}: text 双语`);
  ok(!!o.subtitle && !!o.subtitle.zh && !!o.subtitle.it, `${o.id}: subtitle 双语`);
  ok(!!o.effect, `${o.id}: 有效果`);
  if (o.require) ok(!!o.requireText && !!o.requireText.zh && !!o.requireText.it, `${o.id}: 有 require 就有 requireText`);
});

console.log('\n=== 2. 键合法性（含 revenueBoost 只认 porto 的坑） ===');
card.options.forEach(o => {
  const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
  Object.keys(e.factions || {}).forEach(k => ok(FAC.includes(k), `${o.id}: factions.${k} 合法`));
  if (e.factions) Object.keys(e.factions).forEach(k =>
    Object.keys(e.factions[k]).forEach(x => ok(['inf', 'dis'].includes(x), `${o.id}: factions.${k}.${x} 合法`)));
  Object.keys(e.order || {}).forEach(k => ok(ORDER.includes(k), `${o.id}: order.${k} 合法`));
  Object.keys(e.forze || {}).forEach(k => ok(FORZE.includes(k), `${o.id}: forze.${k} 合法`));
  Object.keys(e.laws || {}).forEach(k => ok(LAWS.includes(k), `${o.id}: laws.${k} 合法`));
  Object.keys(e.revenueBoost || {}).forEach(k => ok(k === 'porto',
    `${o.id}: revenueBoost.${k} 有效（只有 porto 会被 R.revenue 读取）`));
  ok(e.legitimacy === undefined, `${o.id}: 不写派生值`);
  (e.support || []).forEach(t => {
    ok(CLS.includes(t[0]), `${o.id}: 阶层 ${t[0]} 合法`);
    ok(PARTIES.includes(t[1]), `${o.id}: 政党 ${t[1]} 合法`);
  });
});

console.log('\n=== 3. 成本：打出费 1 K£，五个实质选项筹资，取消不筹资 ===');
{
  /* The 1 K£ is the card's own cost, charged on PLAY_CARD — so it is paid even
     if the player then cancels, and the options' gains are net of it. Nothing is
     charged per option; the options are where the money comes IN. */
  ok(card.cost && card.cost.funds === 1, `卡片打出费 ${card.cost && card.cost.funds} K£`);
  ok(card.cost && card.cost.ap === 1, 'AP 1');
  const NO_GAIN = { nulla: true };
  card.options.forEach(o => {
    const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
    if (NO_GAIN[o.id]) {
      ok(!e.funds, `${o.id}: 不筹资`);
    } else {
      ok(e.funds > 0, `${o.id}: 筹资 +${e.funds} K£`);
    }
  });
  const { s, before } = run('nulla');
  ok(before.funds - s.funds === 1, `取消：净支出 ${before.funds - s.funds} K£（打出费已沉没）`);
  const withPlay = run('obbligazioni');
  ok(withPlay.s.funds - withPlay.before.funds === 699, '债券：净 +699（700 筹资 − 1 打出费）');
}

console.log('\n=== 4. 效果实打 ===');
{
  card.options.filter(o => o.id !== 'nulla').forEach(o => {
    const pre = o.id === 'milano' ? (s => { s.laws.portofranco = 2; }) : null;
    const { s, before } = run(o.id, 42, pre);
    const dFunds = s.funds - before.funds;
    console.log(`   ${o.id.padEnd(14)} 净金库 ${dFunds >= 0 ? '+' : ''}${dFunds}`
      + ` 债务 ${(s.economy.debt - before.debt >= 0 ? '+' : '') + (s.economy.debt - before.debt)}`
      + ` 通胀 ${(s.economy.inflation - before.inflation).toFixed(0)}`
      + ` 资本信心 ${(s.economy.capitalConfidence - before.capitalConfidence).toFixed(0)}`
      + ` | 派系合计 ${W.FACTIONS.reduce((a, f) => a + s.factions[f.id].inf, 0).toFixed(1)}`);
    ok(dFunds > 100, `${o.id}: 筹资后净金库显著增加（${dFunds}）`);
    ok(near(W.FACTIONS.reduce((a, f) => a + s.factions[f.id].inf, 0), 100, 1e-6), `${o.id}: 派系合计 100`);
  });
}

console.log('\n=== 5. 米兰贷款的条件门 ===');
{
  const o = card.options.find(x => x.id === 'milano');
  const s0 = Eng.createState('1919-09', 'historical', 42);
  ok(s0.laws.portofranco === 1, `开局自由港 = ${s0.laws.portofranco}（门槛必须高于开局值才有意义）`);
  ok(o.require(s0) === false, '开局（1 级）不可用');
  const opt0 = Eng.cardOptions(s0, card).find(x => x.id === 'milano');
  ok(opt0.enabled === false && !!opt0.reason, 'UI 会显示原因');
  console.log('   原因:', opt0.reason && opt0.reason.zh);
  const s1 = Eng.createState('1919-09', 'historical', 42);
  s1.laws.portofranco = 2;
  ok(o.require(s1) === true, '自由港 2 级时开放');
  const opt1 = Eng.cardOptions(s1, card).find(x => x.id === 'milano');
  ok(opt1.enabled === true, 'UI 中变为可用');
}

console.log('\n=== 6. 法西斯募捐会推高法西斯派在运动内的分量 ===');
{
  const { s, before } = run('fascisti');
  ok(s.forze.fascisti > before.forzeFascisti, `forze.fascisti ${before.forzeFascisti} → ${s.forze.fascisti}`);
  ok(s.flags.fascist_money === true, '置 fascist_money');
  const d = s.factions.fascisti.inf - before.fac.fascisti.inf;
  ok(near(d, 6), `法西斯派影响力 +6（实为 ${d.toFixed(1)}）`);
}

console.log('\n=== 7. 软锁（六个选项是否有无条件项） ===');
{
  const worst = Eng.createState('1919-09', 'historical', 1);
  worst.laws.portofranco = 0;
  const avail = Eng.cardOptions(worst, card).filter(o => o.enabled);
  console.log('   自由港 0 级时可用:', avail.map(o => o.id).join(','));
  ok(avail.length === 5, `除米兰外仍可选 ${avail.length} 项`);
}

console.log('\n=== 8. 经济安全：连打不会打崩 ===');
{
  let s = Eng.createState('1919-09', 'historical', 42);
  const seen = [];
  let plays = 0;
  for (let i = 0; i < 80; i++) {
    const d = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id });
    if (d.state !== s) {
      s = d.state;
      const r = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id });
      if (r.state !== s) {
        s = r.state;
        if (s.pendingCard) {
          /* 每次都选最贵的债券：金库最多、债务与通胀也最多 */
          s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'obbligazioni' }).state;
          plays++;
        }
      }
    }
    seen.push({ f: Math.round(s.funds), d: Math.round(s.economy.debt), i: Math.round(s.economy.inflation) });
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      const o = ev.options.filter(x => !x.condition || x.condition(s));
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: o[0].id }).state;
    } else s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
  const last = seen[seen.length - 1];
  console.log(`   80 回合内打出 ${plays} 次债券 · 末态 金库 ${last.f} 债务 ${last.d} 通胀 ${last.i}%`);
  const maxInfl = Math.max(...seen.map(x => x.i));
  const maxDebt = Math.max(...seen.map(x => x.d));
  console.log(`   峰值 通胀 ${maxInfl}% 债务 ${maxDebt}`);
  ok(plays >= 1, `冷却生效后仍可反复打出（${plays} 次）`);
  ok(maxInfl <= 90, `通胀未突破引擎上限 90%（峰值 ${maxInfl}%）`);
  ok(last.f >= 0, '金库不为负');
}

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
