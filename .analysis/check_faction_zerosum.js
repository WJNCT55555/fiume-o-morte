/* 派系力量零和验证：
   1. 合计恒为 100（整数）
   2. 单派系 +N：其余派系合计恰好 −N，且按**当前份额比例**分摊
   3. 单派系 −N：其余派系合计恰好 +N
   4. 级联：贡献者不足时先扣到 0，余额继续分摊，合计仍为 100
   5. 边界：目标已 100 / 已 0
   6. applyEffect 的效果路径也走零和（不再有裸 ++）
   7. normalizeFactions 只是安全网：正常状态下不应改变任何值 */
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
/* Influence is a float now, because sub-integer drift has to accumulate.
   Every comparison therefore uses a tolerance, and the UI does the rounding. */
const near = (a, b, eps) => Math.abs(a - b) <= (eps == null ? 1e-6 : eps);

const IDS = W.FACTIONS.map(f => f.id);
const snap = s => IDS.map(k => s.factions[k].inf);
const total = s => IDS.reduce((a, k) => a + s.factions[k].inf, 0);
const fresh = (patch) => {
  const s = Eng.createState('1919-09', 'historical', 42);
  if (patch) patch(s);
  return s;
};
const show = s => IDS.map(k => k.slice(0, 5) + ':' + s.factions[k].inf).join(' ');

console.log('=== 0. 初始 ===');
let s0 = fresh();
console.log('   ' + show(s0), '| 合计', total(s0));
ok(near(total(s0), 100), `初始合计 100（实为 ${total(s0)}）`);
ok(IDS.every(k => Number.isFinite(s0.factions[k].inf)), '初始值均为有限数');

console.log('\n=== 1. +N：其余合计恰好 −N ===');
for (const [target, delta] of [['futuristi', 3], ['arditi', 2], ['fascisti', 6], ['futuristi', 10]]) {
  const s = fresh();
  const before = snap(s);
  const moved = R.adjustFactionInfluence(s, target, delta);
  const after = snap(s);
  const othersDelta = IDS.reduce((a, k, i) => a + (k === target ? 0 : after[i] - before[i]), 0);
  const targetDelta = after[IDS.indexOf(target)] - before[IDS.indexOf(target)];
  console.log(`   ${target} +${delta}: 目标 ${targetDelta >= 0 ? '+' : ''}${targetDelta}`
    + ` | 其余合计 ${othersDelta} | 合计 ${total(s)} | 实际转移 ${moved}`);
  ok(near(total(s), 100), `${target}+${delta}: 合计仍为 100`);
  ok(near(othersDelta, -targetDelta), `${target}+${delta}: 其余合计 = −目标变化（零和）`);
  ok(near(targetDelta, delta), `${target}+${delta}: 目标恰好变化 ${delta}（浮点容差内）`);
}

console.log('\n=== 2. −N：其余合计恰好 +N ===');
for (const [target, delta] of [['arditi', -3], ['fascisti', -4], ['sindacalisti', -5]]) {
  const s = fresh();
  const before = snap(s);
  R.adjustFactionInfluence(s, target, delta);
  const after = snap(s);
  const i = IDS.indexOf(target);
  const othersDelta = IDS.reduce((a, k, j) => a + (k === target ? 0 : after[j] - before[j]), 0);
  console.log(`   ${target} ${delta}: 目标 ${after[i] - before[i]} | 其余合计 +${othersDelta} | 合计 ${total(s)}`);
  ok(near(total(s), 100), `${target}${delta}: 合计仍为 100`);
  ok(near(othersDelta, -(after[i] - before[i])), `${target}${delta}: 零和`);
}

console.log('\n=== 3. 按当前份额比例分摊 ===');
{
  const s = fresh();
  const before = snap(s);
  R.adjustFactionInfluence(s, 'futuristi', 4);
  const after = snap(s);
  const i = IDS.indexOf('futuristi');
  /* 预期每个贡献者的扣减比例 ≈ 它自己的份额 / 其余份额之和 */
  const othersBefore = IDS.filter(k => k !== 'futuristi').map(k => before[IDS.indexOf(k)]);
  const S = othersBefore.reduce((a, b) => a + b, 0);
  let allProportional = true;
  IDS.forEach((k, j) => {
    if (k === 'futuristi') return;
    const expected = 4 * (before[j] / S);
    const actual = before[j] - after[j];
    if (Math.abs(actual - expected) > 0.6) allProportional = false;   // 允许整数取整
  });
  ok(allProportional, '各贡献者的扣减与其份额成比例');
}

console.log('\n=== 4. 级联：贡献者不足时先扣到 0 ===');
{
  const s = fresh();
  /* 只留两个小派系有份额，其余压到 0 */
  IDS.forEach(k => { s.factions[k].inf = 0; });
  s.factions.arditi.inf = 2;
  s.factions.futuristi.inf = 98;
  const moved = R.adjustFactionInfluence(s, 'futuristi', 40);
  console.log('   ' + show(s), '| 合计', total(s), '| 实际转移', moved);
  ok(near(total(s), 100), '级联后合计仍为 100');
  ok(near(s.factions.arditi.inf, 0), '阿迪蒂被扣到 0（只有 2 可给）');
  ok(near(s.factions.futuristi.inf, 100), '目标补足到 100');
  ok(IDS.every(k => s.factions[k].inf >= 0), '无负值');
}

console.log('\n=== 5. 边界：目标已 100 / 已 0 ===');
{
  const a = fresh();
  IDS.forEach(k => { a.factions[k].inf = 0; });
  a.factions.arditi.inf = 100;
  const m1 = R.adjustFactionInfluence(a, 'arditi', 20);
  ok(m1 === 0 && near(total(a), 100), `目标已 100 时无法再增（转移 ${m1}，合计 ${total(a)}）`);
  const b = fresh();
  IDS.forEach(k => { b.factions[k].inf = 0; });
  b.factions.futuristi.inf = 100;
  const m2 = R.adjustFactionInfluence(b, 'arditi', -10);
  ok(m2 === 0 && near(total(b), 100), `目标已 0 时无法再减（转移 ${m2}，合计 ${total(b)}）`);
}

console.log('\n=== 6. applyEffect 走零和（不再有裸 ++） ===');
{
  const s = fresh();
  const before = snap(s);
  R.applyEffect(s, { factions: { futuristi: { inf: 3 } } });
  const after = snap(s);
  const i = IDS.indexOf('futuristi');
  const othersDelta = IDS.reduce((a, k, j) => a + (k === 'futuristi' ? 0 : after[j] - before[j]), 0);
  console.log('   ' + show(s), '| 合计', total(s));
  ok(near(total(s), 100), 'applyEffect 后合计 100');
  ok(near(othersDelta, -(after[i] - before[i])), 'applyEffect 的 inf 变化是零和的');
}

console.log('\n=== 7. normalizeFactions 只是安全网 ===');
{
  const s = fresh();
  R.adjustFactionInfluence(s, 'futuristi', 5);
  const before = snap(s);
  R.normalizeFactions(s);
  const after = snap(s);
  ok(JSON.stringify(before) === JSON.stringify(after),
    `正常状态下 normalizeFactions 不改变任何值（${before.join(',')} → ${after.join(',')}）`);
}

console.log('\n=== 8. 真实卡牌的效果也是零和 ===');
{
  const card = Eng.CARD_BY_ID['az_cervo_doro'];
  /* The fixture has to be a legal state (influence already summing to 100), or
     normalizeFactions will rescale it and every number afterwards is noise. */
  const mkCultivated = () => {
    const s = fresh();
    R.adjustFactionInfluence(s, 'futuristi', 22);   // 18 -> 40, zero-sum
    return s;
  };
  let s = mkCultivated();
  const before = snap(s);
  ok(near(total(s), 100) && s.factions.futuristi.inf === 40,
    `夹具合法：未来主义派 40、合计 ${total(s)}`);
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'carne' }).state;
  const after = snap(s);
  const i = IDS.indexOf('futuristi');
  const othersDelta = IDS.reduce((a, k, j) => a + (k === 'futuristi' ? 0 : after[j] - before[j]), 0);
  console.log(`   肉雕（未来主义派 +3）: ${before.join(',')} → ${after.join(',')} | 合计 ${total(s)}`);
  ok(near(total(s), 100), '卡牌效果后合计 100');
  ok(near(total(s), 100), '卡牌效果后合计仍为 100（未被重标定）');
  ok(near(othersDelta, -(after[i] - before[i])), '卡牌的未来主义派加成是零和的');
  ok(after[i] > before[i], `未来主义派确实上升（${before[i]} → ${after[i]}）`);
}

console.log('\n=== 9. 多次连续变动不漂移 ===');
{
  const s = fresh();
  for (let i = 0; i < 40; i++) R.adjustFactionInfluence(s, IDS[i % IDS.length], i % 2 ? 2 : -2);
  console.log('   ' + show(s), '| 合计', total(s));
  ok(near(total(s), 100), '40 次连续变动后合计仍是 100');
  ok(IDS.every(k => s.factions[k].inf >= 0), '无负值');
  ok(IDS.every(k => Number.isFinite(s.factions[k].inf)), '全部为有限数');
}

console.log('\n=== 10. 批量转移（batchFactionInfluence） ===');
{
  /* Two gains settled together: each target gets exactly what was written, and
     the donors pay in proportion to their own size. Sequential transfers could
     not do this — the first gain ate into the second one's target. */
  const s = fresh();
  const before = snap(s);
  const applied = R.batchFactionInfluence(s, { futuristi: 5, arditi: 3 });
  const after = snap(s);
  const iF = IDS.indexOf('futuristi'), iA = IDS.indexOf('arditi');
  console.log('   ' + show(s), '| 合计', total(s));
  ok(near(total(s), 100), `合计 100（实为 ${total(s)}）`);
  ok(near(after[iF] - before[iF], 5), `未来主义精确 +5（实为 ${(after[iF] - before[iF]).toFixed(2)}）`);
  ok(near(after[iA] - before[iA], 3), `阿迪蒂精确 +3（实为 ${(after[iA] - before[iA]).toFixed(2)}）`);
  ok(near(applied.futuristi, 5) && near(applied.arditi, 3), 'applied 报告实际到账');
  const donorsDelta = ['sindacalisti', 'fascisti', 'irredentisti']
    .reduce((a, k) => a + (after[IDS.indexOf(k)] - before[IDS.indexOf(k)]), 0);
  ok(near(donorsDelta, -8), `三个捐赠方合计 −8（实为 ${donorsDelta.toFixed(2)}）`);
  const dw = ['sindacalisti', 'fascisti', 'irredentisti'].map(k => before[IDS.indexOf(k)]);
  const S = dw.reduce((a, b) => a + b, 0);
  let prop = true;
  ['sindacalisti', 'fascisti', 'irredentisti'].forEach((k, j) => {
    const expected = 8 * (dw[j] / S);
    const actual = before[IDS.indexOf(k)] - after[IDS.indexOf(k)];
    if (Math.abs(actual - expected) > 0.6) prop = false;
  });
  ok(prop, '捐赠方按自身份额比例承担');
}
{
  const s = fresh();
  const before = snap(s);
  R.batchFactionInfluence(s, { futuristi: 4, fascisti: -6 });
  const after = snap(s);
  const iF = IDS.indexOf('futuristi'), iFa = IDS.indexOf('fascisti');
  console.log('   加/减混合: ' + show(s), '| 合计', total(s));
  ok(near(after[iF] - before[iF], 4), `未来主义 +4（实为 ${(after[iF] - before[iF]).toFixed(2)}）`);
  ok(near(after[iFa] - before[iFa], -6), `法西斯 −6（实为 ${(after[iFa] - before[iFa]).toFixed(2)}）`);
  ok(near(total(s), 100), `合计 100（实为 ${total(s)}）`);
}
{
  const s = fresh();
  const before = snap(s);
  R.batchFactionInfluence(s, { futuristi: 60, arditi: 40 });
  const after = snap(s);
  console.log('   超额请求: ' + show(s), '| 合计', total(s));
  ok(near(total(s), 100), `合计 100（实为 ${total(s)}）`);
  ok(IDS.every(k => s.factions[k].inf >= 0), '无负值');
  const gF = after[IDS.indexOf('futuristi')] - before[IDS.indexOf('futuristi')];
  const gA = after[IDS.indexOf('arditi')] - before[IDS.indexOf('arditi')];
  ok(gF > 0 && gA > 0, '两者都上升');
  ok(Math.abs(gF / gA - 60 / 40) < 0.35, `请求比例保持（${(gF / gA).toFixed(2)} ≈ 1.5）`);
}
{
  const s = fresh();
  const b = snap(s);
  R.batchFactionInfluence(s, {});
  ok(JSON.stringify(snap(s)) === JSON.stringify(b), '空批次不改变任何值');
  R.batchFactionInfluence(s, { futuristi: 2 });
  ok(near(s.factions.futuristi.inf - b[IDS.indexOf('futuristi')], 2), '单目标批次也精确');
  ok(near(total(s), 100), '单目标批次合计 100');
}
{
  const s = fresh();
  for (let i = 0; i < 30; i++) R.batchFactionInfluence(s, { futuristi: 2, arditi: 1 });
  console.log('   30 次连续批量: ' + show(s), '| 合计', total(s));
  ok(near(total(s), 100), '30 次批量后合计仍为 100');
  ok(IDS.every(k => s.factions[k].inf >= 0), '无负值');
}

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
