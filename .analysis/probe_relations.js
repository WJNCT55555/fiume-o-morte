/* 设计前置验证：关系矩阵能否承载「非政党人物」？
   结论将决定 1920 进军罗马日志的四项门槛用什么机制实现。 */
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

let s = Eng.createState('1919-09', 'historical', 42);
console.log('=== 1. 已知政党对的基线（W.RELATION_BASE） ===');
W.PARTIES.forEach(a => W.PARTIES.forEach(b => {
  if (a.id < b.id) process.stdout.write(`   ${a.id}|${b.id}=${R.relationBaseline(s, a.id, b.id)} `);
}));
console.log('\n');

console.log('=== 2. 未定义的对：基线是多少？ ===');
console.log('   LEG|BOMBacci  =', R.relationBaseline(s, 'LEG', 'BOMBacci'));
console.log('   LEG|MUSSOLINI =', R.relationBaseline(s, 'LEG', 'MUSSOLINI'));
console.log('   relationOf(LEG,MUSSOLINI) =', R.relationOf(s, 'LEG', 'MUSSOLINI'));

console.log('\n=== 3. 写入一个人物键会发生什么？ ===');
R.setRelation(s, 'LEG', 'MUSSOLINI', 45);
console.log('   setRelation(LEG,MUSSOLINI,45) 后：');
console.log('     relationOf =', R.relationOf(s, 'LEG', 'MUSSOLINI'));
console.log('     relationOf 反向 =', R.relationOf(s, 'MUSSOLINI', 'LEG'), '（对称）');
console.log('     state.relations.LEG keys =', Object.keys(s.relations.LEG));
console.log('     state.relations.MUSSOLINI =', JSON.stringify(s.relations.MUSSOLINI));

console.log('\n=== 4. 每月 relationDrift 会不会把它拉回 0？ ===');
R.relationDrift(s);
console.log('   relationDrift 一次后 =', R.relationOf(s, 'LEG', 'MUSSOLINI'), '（应保持不变）');
R.relationDrift(s); R.relationDrift(s);
console.log('   再漂移两次后       =', R.relationOf(s, 'LEG', 'MUSSOLINI'));

console.log('\n=== 5. S.relations（议会页矩阵）是否被污染？ ===');
const rel = S.relations(s);
console.log('   cols =', rel.cols.map(c => c.id).join(','));
console.log('   rows =', rel.rows.map(r => r.id).join(','));
console.log('   regard =', rel.regard, '（联盟内部平均，应不受影响）');

console.log('\n=== 6. applyEffect 走 relations 键的效果是否生效？ ===');
const before = R.relationOf(s, 'LEG', 'MUSSOLINI');
R.applyEffect(s, { relations: [['LEG', 'MUSSOLINI', 25]] });
console.log(`   ${before} → ${R.relationOf(s, 'LEG', 'MUSSOLINI')}`);

console.log('\n=== 7. 存档往返是否保留人物键？ ===');
const back = JSON.parse(JSON.stringify(s));
console.log('   JSON 往返后 =', R.relationOf(back, 'LEG', 'MUSSOLINI'));

console.log('\n=== 8. 军团兵力上限推算（10000 门槛可行性） ===');
console.log('   初始 2500');
console.log('   每回合自动：金库>400 时 +90，否则 −60（reducers.js#L784）');
console.log('   一次性来源：1919-09 进军选项 +180/+260 · 1920-01 冬 +400 · 1920-06 +200');
console.log('              1920-09 +140/+220 · 党事件 +260 · 顾问 micheletti +320 / miani +180');
console.log('              卡牌 gv_bilancio +200 · gv_nave +140/+100 · az_arditi +120 · az_volantini +120 · az_cucine +200');
const oneOff = [180, 260, 400, 200, 220, 140, 260, 320, 180, 200, 140, 120, 120, 200];
console.log(`   一次性合计（全部拿到，互斥项重复计入，故为上限）≈ ${oneOff.reduce((a, b) => a + b, 0)}`);
for (const turns of [10, 20, 30, 40]) {
  console.log(`   仅靠每月 +90 × ${turns} 回合 = ${2500 + 90 * turns}`);
}
console.log('   2500 + 90×36 + 1000（一次性中较稳的部分）≈', 2500 + 90 * 36 + 1000);
console.log('   月俸成本：兵力 × 0.013 K£/回合 → 10000 兵 =', (10000 * 0.013).toFixed(1), 'K£/回合');
console.log('   对照开局总收入 117.3 K£/回合 → 占比', (10000 * 0.013 / 117.3 * 100).toFixed(0) + '%');

console.log('\n=== 9. 四项门槛的现状能力核对 ===');
console.log('   ① 军团兵力 ≥ 10000      → order.milizia，机制存在，可行（见上）');
console.log('   ② 与意大利军方关系 ≥ 60 → 无此机制。最接近的是 order.garrison（0-100，语义为「驻军立场」）');
console.log('   ③ 与四股力量各 ≥ 80     → 无此机制。政党关系矩阵可承载人物键（见上），但需新增内容');
console.log('   ④ 四股力量本身          → 游戏中不存在：Bombacci / Malatesta / Gramsci 完全缺席；');
console.log('                              Mussolini 仅有 flags.mussolini_letter 一个布尔标志');
