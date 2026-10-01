/* 危机双轴验证：
   1. 两个超级事件各读哪一根轴
   2. 两根轴能否各自独立上升（相关 ≠ 同一根轴）
   3. 里程碑是否互相独立 */
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
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

console.log('=== 1. 两个超级事件读不同的轴 ===');
const natale = Eng.EVENT_BY_ID.ev_natale;
const coup = Eng.EVENT_BY_ID.ev_coup;
const mk = o => {
  const s = Eng.createState('1919-09', 'historical', 42);
  Object.assign(s.order, o);
  s.date = { y: 1920, m: 12, d: 15 };
  return s;
};
/* 只推高围攻轴 */
let s1 = mk({ coup: 120, subversion: 0 });
ok(natale.condition(s1) === true, '围攻 120 / 党内 0 → 血腥圣诞触发');
ok(coup.condition(s1) === false, '围攻 120 / 党内 0 → 法西斯政变不触发');
/* 只推高党内轴 */
let s2 = mk({ coup: 0, subversion: 120 });
s2.date = { y: 1922, m: 6, d: 15 };
ok(natale.condition(s2) === false, '围攻 0 / 党内 120 → 血腥圣诞不触发');
ok(coup.condition(s2) === true, '围攻 0 / 党内 120 → 法西斯政变触发');
/* 两根轴都高。两个事件的日期窗口不重叠：血腥圣诞限 1920-12 或 1921-01..02，
   政变要 ≥1922-03。所以「两轴同时逼近」在游戏里表现为先后到来，而不是同时。
   mk() 把日期钉在 1920-12，所以每根轴各自需要一个对应日期的状态。 */
const coupWindow = mk({ coup: 120, subversion: 120 });
coupWindow.date = { y: 1922, m: 6, d: 15 };
ok(coup.condition(coupWindow) === true, '两轴同时高 → 政变在其窗口内成立');
const nataleWindow = mk({ coup: 120, subversion: 120 });
nataleWindow.date = { y: 1921, m: 1, d: 15 };
ok(natale.condition(nataleWindow) === true, '两轴同时高 → 血腥圣诞在其窗口内成立');
ok(coup.condition(nataleWindow) === false, '同一状态在 1921-01 不能触发政变（日期门）');
console.log('   注：两事件的日期窗口不重叠，所以「同时逼近」在游戏中表现为先后到来');

console.log('\n=== 2. 里程碑互不相同 ===');
const siegeIds = R.siegeMilestones(mk({})).map(m => m.id);
const subvIds = R.subversionMilestones().map(m => m.id);
console.log('   围攻:', siegeIds.join(','), '| 党内:', subvIds.join(','));
ok(siegeIds.every(id => subvIds.indexOf(id) < 0), '两套里程碑 id 无重叠');
ok(siegeIds.length === 4 && subvIds.length === 4, '各 4 个阈值');
/* 旧行为：血腥圣诞之后围攻套文案切成法西斯套 —— 现在不再切换 */
const afterNatale = mk({});
afterNatale.flags.natale_done = true;
afterNatale.date = { y: 1921, m: 3, d: 15 };
ok(R.siegeMilestones(afterNatale).map(m => m.id).join(',') === siegeIds.join(','),
  '围攻里程碑不再因 natale_done 切换成法西斯文案（两轴已分离）');

console.log('\n=== 3. 内部轴独立于外部轴：调参实测 ===');
function grow(patch, turns) {
  const s = Eng.createState('1919-09', 'historical', 42);
  Object.assign(s.order, patch.order || {});
  if (patch.factions) Object.assign(s.factions.fascisti, patch.factions.fascisti || {});
  for (let i = 0; i < turns; i++) {
    s.order.subversion = Math.max(0, Math.min(140, s.order.subversion + R.subversionDelta(s, 1)));
    s.order.coup = Math.max(0, Math.min(140, s.order.coup + R.coupDelta(s, 1)));
  }
  return { coup: Math.round(s.order.coup), sub: Math.round(s.order.subversion) };
}
/* 安静但被围：暴力低、小队低、法西斯弱 */
const quiet = grow({ order: { violence: 15, squadre: 5 }, factions: { fascisti: { inf: 12 } } }, 30);
console.log(`   安静（暴力15/小队5/法西斯12）30 回合： 围攻 ${quiet.coup} · 党内 ${quiet.sub}`);
/* 街头失控：暴力高、小队多、法西斯强 */
const street = grow({ order: { violence: 70, squadre: 70 }, factions: { fascisti: { inf: 35 } } }, 30);
console.log(`   失控（暴力70/小队70/法西斯35）30 回合：围攻 ${street.coup} · 党内 ${street.sub}`);
ok(street.sub > quiet.sub + 30, `内部轴确实由街头与法西斯派驱动（${quiet.sub} vs ${street.sub}）`);
ok(street.coup !== quiet.coup, `外部轴同时受 T/驻军影响（${quiet.coup} vs ${street.coup}）`);
ok(quiet.sub < 100 && street.sub > quiet.sub, '安静局不会自己走向政变');

console.log('\n=== 4. 选择器与趋势序列 ===');
const s4 = Eng.createState('1919-09', 'historical', 42);
const cr = S.crisis(s4);
ok(typeof cr.subversion === 'number' && Array.isArray(cr.subversionDefs), 'S.crisis 暴露 subversion 与 subversionDefs');
ok(Array.isArray(cr.milestoneDefs) && cr.milestoneDefs[0].id === 'i25', 'S.crisis.milestoneDefs 现在是围攻套');
Eng.advanceWeek(s4, Core.makeRng(3));
ok(Array.isArray(s4.series.subversion), '趋势序列含 subversion');
console.log('   series:', Object.keys(s4.series).join(','));

console.log('\n=== 5. 旧存档兼容（无 subversion 字段） ===');
const s5 = Eng.createState('1919-09', 'historical', 42);
delete s5.order.subversion; delete s5.order.subversionMilestones;
Eng.postProcess(s5);
ok(s5.order.subversion === 0, 'postProcess 补出 subversion = 0');
try {
  Eng.advanceWeek(s5, Core.makeRng(4));
  ok(true, 'advanceWeek 不因缺字段抛错');
  ok(typeof S.crisis(s5).subversion === 'number', 'S.crisis 兼容旧状态');
} catch (e) { ok(false, 'advanceWeek 抛错: ' + e.message); }

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
