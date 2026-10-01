/* 设计前置验证 2：新增外交键 / 人物线是否会让引擎静默出错？
   结论决定 3.2 的 ② 该用 diplo 新键还是人物线。 */
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
let bad = 0;
const ok = (c, m) => { console.log((c ? '   ok   ' : '   FAIL ') + m); if (!c) bad++; };

let s = Eng.createState('1919-09', 'historical', 42);

console.log('=== 1. 写一个不存在的外交键会怎样？ ===');
const p0 = R.pressione(s);
R.applyEffect(s, { diplo: { forze_armate: 40 } });
const p1 = R.pressione(s);
console.log(`   diplo.forze_armate = ${s.diplo.forze_armate}`);
console.log(`   pressione: ${p0.toFixed(2)} → ${p1.toFixed(2)}`);
ok(Math.abs(p0 - p1) < 1e-9, 'pressione 不受未知键影响（公式只读六个固定键）');
ok(s.diplo.forze_armate === 40, '未知键被写入 state.diplo');

console.log('\n=== 2. 未知键在 postProcess 里会不会被夹坏？ ===');
Eng.postProcess(s);
console.log(`   postProcess 后 = ${s.diplo.forze_armate}`);
ok(s.diplo.forze_armate === 40, '0-100 夹取正确（40 不变）');
s.diplo.forze_armate = 150; Eng.postProcess(s);
ok(s.diplo.forze_armate === 100, '>100 被夹到 100');
s.diplo.forze_armate = -20; Eng.postProcess(s);
ok(s.diplo.forze_armate === 0, '<0 被夹到 0');

console.log('\n=== 3. 存不存进存档？每月漂移会不会动它？ ===');
R.applyEffect(s, { diplo: { forze_armate: 55 } });
const before = s.diplo.forze_armate;
const drift = { rome: { italy: .8 }, equidistant: { italy: -.25 }, belgrade: {}, internation: {} }[s.posture] || {};
Object.keys(drift).forEach(k => { s.diplo[k] = Math.max(0, Math.min(100, s.diplo[k] + drift[k])); });
ok(s.diplo.forze_armate === before, `每月外交漂移只遍历姿态里写死的键，未知键保持 ${before}`);
const rt = JSON.parse(JSON.stringify(s));
ok(rt.diplo.forze_armate === before, 'JSON 存档往返保留该键');

console.log('\n=== 4. smoke 不变量会不会因未知键失败？ ===');
// smoke.js: Object.keys(s.diplo).forEach(k => ok(s.diplo[k] >= 0 && s.diplo[k] <= 100))
let inv = true;
Object.keys(s.diplo).forEach(k => { if (!(s.diplo[k] >= 0 && s.diplo[k] <= 100)) inv = false; });
ok(inv, '「所有 diplo 值在 0-100」不变量成立（smoke.js 会遍历全部键）');

console.log('\n=== 5. 一个完整回合后，人物线 + 新外交键是否都存活？ ===');
R.setRelation(s, 'LEG', 'MUSSOLINI', 62);
R.setRelation(s, 'LEG', 'MALATESTA', 71);
s.diplo.forze_armate = 63;
const s2 = Eng.dispatch(s, { type: 'ADVANCE' }).state;
console.log(`   LEG|MUSSOLINI = ${R.relationOf(s2, 'LEG', 'MUSSOLINI')}`);
console.log(`   LEG|MALATESTA = ${R.relationOf(s2, 'LEG', 'MALATESTA')}`);
console.log(`   diplo.forze_armate = ${s2.diplo.forze_armate}`);
ok(R.relationOf(s2, 'LEG', 'MUSSOLINI') === 62, '人物线经完整回合后未被重置');
ok(s2.diplo.forze_armate === 63, '新外交键经完整回合后未被重置');

console.log('\n=== 6. 若把人物放进 W.RELATION_BASE，relationsInit 会种下初值吗？ ===');
// relationsInit 只遍历 W.PARTIES 两两，所以新键不会被初始化 —— 必须靠 createState 或首个事件写入
const s3 = Eng.createState('1919-09', 'historical', 42);
console.log('   新局的 state.relations.LEG keys =', Object.keys(s3.relations.LEG).join(','));
ok(!s3.relations.LEG.MUSSOLINI, 'relationsInit 不会给人物线种初值 → 初始值必须在 createState 或事件里写');
console.log('   → 建议：在 createState 里对 W.FORCES（新增常量表）做一次初始 setRelation');

console.log('\n=== 7. 日志 complete 与 fail 同回合同时为真的行为 ===');
console.log('   见 reducers.js：先判 complete，命中即 done 并 return 该分支，fail 不再检查');
console.log('   （代码顺序：if (def.complete && def.complete(s)) {...} else if (def.fail && def.fail(s)) {...}）');
console.log('   → 所以「窗口关闭」的 fail 条件与 complete 条件必须互斥，否则完成会被失败抢先/掩盖');

console.log('\n=== ' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗') + ' ===');
process.exit(bad ? 1 : 0);
