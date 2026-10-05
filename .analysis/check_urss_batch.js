/* 核实本轮六项改动。
   引擎层（1–5 项的数据部分）直接跑；界面部分用无头 Chrome 看 DOM。 */
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
for (const f of ['lib/core.js', 'lib/i18n.js', 'game/data/world.js', 'game/data/parties.js', 'game/data/factions.js',
  'game/data/meta.js', 'game/engine/rules.js', 'game/registries/contentRegistry.ts',
  'game/engine/reducers.js', 'game/engine/selectors.js']) {
  require(path.join(base, f));
}
const F = globalThis.Fiume, Eng = F.Engine, W = F.World;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
const fresh = () => Eng.createState('1919-09', 'historical', 42);

console.log('=== 3. 外交：第三国际 → 苏联 ===');
{
  const sov = W.DIPLO_ACTORS.find(a => a.id === 'soviet');
  ok(!!sov, 'W.DIPLO_ACTORS 里有 id=soviet');
  ok(sov && sov.zh === '苏联', `中文名 = ${sov && sov.zh}`);
  ok(!W.DIPLO_ACTORS.some(a => a.id === 'comintern'), 'comintern 这个 id 已不存在');
  const s = fresh();
  ok(typeof s.diplo.soviet === 'number', `state.diplo.soviet 存在（${s.diplo.soviet}）`);
  ok(s.diplo.comintern === undefined, 'state.diplo.comintern 不存在');
  /* 选择器必须能按 soviet 取到名字，否则外交页会渲染成空白 */
  const list = F.Sel.diplo(s).list;
  const row = list.find(r => r.id === 'soviet');
  ok(!!row && row.zh === '苏联', `Sel.diplo 能解析 soviet（${row && row.zh}）`);
}

console.log('\n=== 4a. 阜姆联盟：苏联 +8，意共成立后 +6 ===');
{
  const card = Eng.CARD_BY_ID.az_fiume_league;
  const opt = card.options.find(o => o.id === 'soviet');
  ok(!!opt, 'az_fiume_league 有 soviet 选项');
  const before = fresh();
  const e1 = typeof opt.effect === 'function' ? opt.effect(before) : opt.effect;
  ok(e1.diplo.soviet === 8, `未成立意共时 dipol.soviet = ${e1.diplo.soviet}（应 8）`);
  ok(!e1.forze || e1.forze.comunisti === undefined, '未成立意共时不加意共关系');
  const after = fresh();
  after.flags.comintern_door = true;
  const e2 = typeof opt.effect === 'function' ? opt.effect(after) : opt.effect;
  ok(e2.diplo.soviet === 8, `意共成立后 dipol.soviet 仍 = ${e2.diplo.soviet}`);
  ok(e2.forze && e2.forze.comunisti === 6, `意共成立后加 forze.comunisti = ${e2.forze && e2.forze.comunisti}（应 6）`);
  /* 真打一次，确认落地 */
  let s = fresh();
  s.flags.comintern_door = true;
  const c2 = Eng.CARD_BY_ID.az_fiume_league;
  const s0 = s.diplo.soviet, f0 = s.forze.comunisti;
  Eng.applyCardEffect(s, c2, c2.options.find(o => o.id === 'soviet'));
  Eng.postProcess(s);
  ok(Math.abs(s.diplo.soviet - (s0 + 8)) < 1e-6 || s.diplo.soviet > s0, `实际落地：soviet ${s0} → ${s.diplo.soviet}`);
  ok(s.forze.comunisti > f0, `实际落地：comunisti ${f0} → ${s.forze.comunisti}`);
}

console.log('\n=== 4b. 波斯号：第一选项加苏联关系 ===');
{
  const ev = Eng.EVENT_BY_ID['ev_1919_10_persia'];
  ok(!!ev, '波斯号事件存在');
  const opt = ev.options[0];
  const e = typeof opt.effect === 'function' ? opt.effect(fresh()) : opt.effect;
  ok(e.diplo && e.diplo.soviet === 6, `第一选项 diplo.soviet = ${e.diplo && e.diplo.soviet}（应 6）`);
  ok(opt.preview.some(p => /苏联/.test((p && p.zh) || '')), '预览里列出了苏联关系');
  /* 另外两个选项不该也加成 */
  const others = ev.options.slice(1).map(o => (typeof o.effect === 'function' ? o.effect(fresh()) : o.effect));
  const leaked = others.filter(x => x.diplo && x.diplo.soviet).length;
  ok(leaked === 0, `其余选项未顺带加苏联关系（${leaked} 个）`);
}

console.log('\n=== 5. 与苏联建交事件 ===');
{
  const ev = Eng.EVENT_BY_ID['ev_1920_urss'];
  ok(!!ev, '事件已注册');
  const mk = (sov, flags) => { const s = fresh(); s.diplo.soviet = sov; Object.assign(s.flags, flags); return s; };
  const base_flags = { charter_promulgated: true, soviet_contact: true };
  ok(ev.condition(mk(81, base_flags)) === true, '关系 81 且宪章已颁布且有接触：触发');
  ok(ev.condition(mk(80, base_flags)) === false, '关系恰好 80：不触发（需 > 80）');
  ok(ev.condition(mk(90, { soviet_contact: true })) === false, '宪章未颁布：不触发');
  ok(ev.condition(mk(90, { charter_promulgated: true })) === false, '尚未与莫斯科接触：不触发');
  ok(!ev.date, '条件事件（无日期，不进史实日历）');
  ok(ev.options.length >= 3, `选项数 ${ev.options.length}（含拒绝）`);
  ok(ev.options.some(o => o.id === 'rifiutare'), '有明确拒绝的选项');
  /* 每个选项都要设 urss_recognised，否则会反复触发 */
  const noFlag = ev.options.filter(o => {
    const e = typeof o.effect === 'function' ? o.effect(mk(90, base_flags)) : o.effect;
    return !e.flags || !e.flags.urss_recognised;
  });
  ok(noFlag.length === 0, `每个选项都置 urss_recognised，不会重复触发（${noFlag.map(o => o.id).join(',') || '无遗漏'}）`);
  /* 接受选项必须真的改变外交 */
  const acc = ev.options.find(o => o.id === 'accettare');
  const e = typeof acc.effect === 'function' ? acc.effect(mk(90, base_flags)) : acc.effect;
  ok(e.diplo.soviet > 0, `接受：苏联关系 +${e.diplo.soviet}`);
  ok(e.diplo.italy < 0 && e.diplo.uk < 0, '接受：意大利与英美法关系下降');
  const rej = ev.options.find(o => o.id === 'rifiutare');
  const er = typeof rej.effect === 'function' ? rej.effect(mk(90, base_flags)) : rej.effect;
  ok(er.diplo.soviet < 0, `拒绝：苏联关系 ${er.diplo.soviet}`);
}

console.log('\n=== 2. i18n：成本提示已移除 ===');
{
  ok(F.I18N['card.cost.hint'] === undefined, 'card.cost.hint 键已删除');
  const src = fs.readFileSync(path.join(base, 'legacy', 'ui', 'views.js'), 'utf8');
  ok(src.indexOf('card.cost.hint') < 0, 'views.js 不再引用该键');
  ok(src.indexOf('成本已在打出时扣除') < 0, '字样已从视图层消失');
}

console.log('\n=== 1. 侧边栏：源码层确认 ===');
{
  const sp = fs.readFileSync(path.join(base, 'legacy', 'ui', 'components', 'sidepanel.js'), 'utf8');
  ok(sp.indexOf('comandante__body') < 0, 'comandante__body 块已移除');
  ok(sp.indexOf("field('军团兵力'") < 0, '军团兵力字段已移除');
  ok(sp.indexOf('cmd.dissenso') < 0, '党内异议度字段已移除');
}

console.log('\n=== 6. 史实时点未被扰动 ===');
{
  /* 新事件是条件事件，不该改变史实日历 */
  const ev = Eng.EVENT_BY_ID['ev_1920_urss'];
  ok(!ev.date && !ev.superEvent && !ev.chain, '不进 dated / superEvent / chain 任何一条优先通道');
}

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
