/* az_cervo_doro 校验：结构、双语、键合法性、效果生效、条件门、
   以及最重要的——任何状态下都不会只剩「取消」一个选项（软锁）。 */
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
const F = globalThis.Fiume, Eng = F.Engine, W = F.World, Core = F.Core;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

const card = Eng.CARD_BY_ID['az_cervo_doro'];
const EXPECT = ['bohemienne', 'discorso', 'nudo', 'amante', 'carne', 'silenzio'];

function playOption(seed, optionId, pre) {
  let s = Eng.createState('1919-09', 'historical', seed);
  if (pre) pre(s);
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId }).state;
  return s;
}

console.log('=== 1. 结构与双语 ===');
ok(!!card, 'Eng.CARD_BY_ID 能检索到 az_cervo_doro');
ok(card.deck === 'azione', `deck = ${card.deck}`);
ok(!card.ministry, '行动卡不带 ministry');
ok(!card.forces, '不带 forces（否则锁定的党派打不出）');
ok(card.cost && card.cost.ap === 1, `AP = ${card.cost && card.cost.ap}`);
ok(card.cooldown === 4, `cooldown = ${card.cooldown}（常规手段，4 档）`);
ok(!!card.name.zh && !!card.name.it, 'name 双语');
ok(!!card.text.zh && !!card.text.it, 'text 双语');
ok(card.options.length === EXPECT.length, `选项数 ${card.options.length}`);
ok(card.options.map(o => o.id).join(',') === EXPECT.join(','), `选项顺序 ${card.options.map(o => o.id).join(',')}`);
card.options.forEach(o => {
  ok(!!o.text.zh && !!o.text.it, `${o.id}: text 双语`);
  ok(!!o.subtitle && !!o.subtitle.zh && !!o.subtitle.it, `${o.id}: subtitle 双语`);
  ok(Array.isArray(o.preview) && o.preview.length >= 2, `${o.id}: preview ${o.preview.length} 条`);
  ok(!!o.effect, `${o.id}: 有效果`);
  if (o.require) ok(!!o.requireText && !!o.requireText.zh && !!o.requireText.it, `${o.id}: 有 require 就有双语 requireText`);
});

console.log('\n=== 2. 键合法性 + 不写派生值 ===');
const CLS = W.CLASSES.map(c => c.id), FAC = W.FACTIONS.map(f => f.id), PARTIES = W.PARTIES.map(p => p.id);
card.options.forEach(o => {
  const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
  Object.keys(e.factions || {}).forEach(k => ok(FAC.includes(k), `${o.id}: factions.${k} 合法`));
  if (e.factions) Object.keys(e.factions).forEach(k => {
    Object.keys(e.factions[k]).forEach(f2 => ok(['inf', 'dis'].includes(f2), `${o.id}: factions.${k}.${f2} 合法`));
  });
  Object.keys(e.order || {}).forEach(k => ok(
    ['authority', 'garrison', 'fervour', 'squadre', 'violence', 'coup', 'subversion', 'milizia',
      'civicGuard', 'police', 'legionari', 'carabinieri', 'garrisonTroops'].includes(k),
    `${o.id}: order.${k} 合法`));
  ok(e.legitimacy === undefined, `${o.id}: 不写派生值 legitimacy`);
  ok(!e.journals, `${o.id}: 不激活日志`);
  (e.support || []).forEach(t => {
    ok(CLS.includes(t[0]), `${o.id}: 阶层 ${t[0]} 合法`);
    ok(PARTIES.includes(t[1]), `${o.id}: 政党 ${t[1]} 合法`);
  });
});

console.log('\n=== 3. 效果生效（实打） ===');
for (const o of card.options) {
  const b0 = Eng.createState('1919-09', 'historical', 42);
  const pre = o.id === 'amante' ? (s => { s.order.authority = 60; })
    : o.id === 'carne' ? (s => { s.factions.futuristi.inf = 40; }) : null;
  const s = playOption(42, o.id, pre);
  console.log(`   ${o.id.padEnd(11)} 权威 ${(s.order.authority - b0.order.authority).toFixed(0).padStart(3)}`
    + ` 热忱 ${(s.order.fervour - b0.order.fervour).toFixed(0).padStart(3)}`
    + ` 围攻 ${(s.order.coup - b0.order.coup).toFixed(0).padStart(3)}`
    + ` | 阿迪蒂 inf ${(s.factions.arditi.inf - b0.factions.arditi.inf).toFixed(0)}`
    + ` 未 ${(s.factions.futuristi.dis - b0.factions.futuristi.dis).toFixed(0)}`
    + ` 工 ${(s.factions.sindacalisti.dis - b0.factions.sindacalisti.dis).toFixed(0)}`
    + ` 收 ${(s.factions.irredentisti.dis - b0.factions.irredentisti.dis).toFixed(0)}`);
  const changed = JSON.stringify(s.factions) !== JSON.stringify(b0.factions)
    || JSON.stringify(s.order) !== JSON.stringify(b0.order)
    || JSON.stringify(s.support || s.classes) !== JSON.stringify(b0.classes);
  ok(changed, `${o.id}: 改变了状态`);
}

console.log('\n=== 4. 条件门 ===');
const amante = card.options.find(o => o.id === 'amante');
const carne = card.options.find(o => o.id === 'carne');
const t = () => Eng.createState('1919-09', 'historical', 1);
ok(amante.require(t()) === false, '情人之夜：开局权威 46，不满足 > 50');
let s1 = t(); s1.order.authority = 55;
ok(amante.require(s1) === true, '情人之夜：权威 55 时开放');
ok(carne.require(t()) === false, '肉雕：开局未来主义派 18，不满足 > 35');
let s2 = t(); s2.factions.futuristi.inf = 40;
ok(carne.require(s2) === true, '肉雕：未来主义派 40 时开放');
const shown = Eng.cardOptions(t(), card).find(o => o.id === 'carne');
ok(shown.enabled === false && !!shown.reason && !!shown.reason.zh, 'UI 会显示具体原因');
console.log('   肉雕门原因:', shown.reason && shown.reason.zh);

console.log('\n=== 5. 软锁检查（最重要） ===');
/* 极端状态：权威 0、未来主义派 0、其他派系全高——此时可选选项还剩几个？ */
const worst = t();
worst.order.authority = 0;
Object.keys(worst.factions).forEach(k => { worst.factions[k].inf = 1; worst.factions[k].dis = 100; });
const worstOpts = Eng.cardOptions(worst, card).filter(o => o.enabled);
console.log('   最坏状态下可用选项:', worstOpts.map(o => o.id).join(','));
ok(worstOpts.length >= 2, `最坏状态下仍有多于一个可选（${worstOpts.length} 个）`);
ok(!(worstOpts.length === 1 && worstOpts[0].id === 'silenzio'),
  '最坏状态不会只剩「安静的夜晚」一个选项');
const unconditional = card.options.filter(o => !o.require).map(o => o.id);
console.log('   无条件选项:', unconditional.join(','));
ok(unconditional.length >= 3, `有 ${unconditional.length} 个无条件选项，任何状态下都可选`);

console.log('\n=== 6. 守恒不变量 ===');
const s3 = playOption(7, 'nudo');
const infSum = W.FACTIONS.reduce((a, f) => a + s3.factions[f.id].inf, 0);
ok(Math.abs(infSum - 100) < 0.6, `派系影响力合计 ${infSum.toFixed(2)}`);
W.CLASSES.forEach(c => {
  const sum = Core.sum(s3.classes[c.id].support);
  ok(Math.abs(sum - 100) < 0.6, `${c.zh} 支持行和 ${sum.toFixed(2)}`);
});

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
