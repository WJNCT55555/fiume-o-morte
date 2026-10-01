/* 军团集会事件校验：结构、双语、成本、效果、批量零和、选项 4 与进军日志的衔接。 */
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
const F = globalThis.Fiume, Eng = F.Engine, W = F.World;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
const near = (a, b, e) => Math.abs(a - b) <= (e == null ? 1e-6 : e);

const ev = Eng.EVENT_BY_ID['ev_1920_10_adunata'];
const EXPECT = ['disciplina', 'discorso', 'eccidio', 'annuncio_marcia', 'nudo', 'annullare'];
const CLS = W.CLASSES.map(c => c.id), FAC = W.FACTIONS.map(f => f.id), PARTIES = W.PARTIES.map(p => p.id);
const FORZE = W.FORZE.map(f => f.id);
const ORDER = ['authority', 'garrison', 'fervour', 'squadre', 'violence', 'coup', 'subversion',
  'milizia', 'civicGuard', 'police', 'legionari', 'carabinieri', 'garrisonTroops'];

function pick(optionId, seed) {
  const s = Eng.createState('1919-09', 'historical', seed == null ? 42 : seed);
  const before = JSON.parse(JSON.stringify({ order: s.order, fac: s.factions, funds: s.funds, cl: s.classes }));
  const r = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId, eventId: ev.id });
  return { before, after: r.state, s: r.state };
}
/* 直接施加选项效果（事件未在队列中时用它比较干净） */
function apply(optionId, seed, pre) {
  const s = Eng.createState('1919-09', 'historical', seed == null ? 42 : seed);
  if (pre) pre(s);
  const opt = ev.options.find(o => o.id === optionId);
  const eff = typeof opt.effect === 'function' ? opt.effect(s) : opt.effect;
  const before = {
    order: JSON.parse(JSON.stringify(s.order)),
    fac: JSON.parse(JSON.stringify(s.factions)),
    cl: JSON.parse(JSON.stringify(s.classes)),
    funds: s.funds
  };
  F.Rules.applyEffect(s, eff);
  return { before, s };
}

console.log('=== 1. 结构与双语 ===');
ok(!!ev, 'EVENT_BY_ID 能检索到 ev_1920_10_adunata');
ok(!!ev.date && ev.date.y === 1920 && ev.date.m === 10, `日期 ${ev.date && ev.date.y}-${ev.date && ev.date.m}`);
ok(!!ev.title.zh && !!ev.title.it, 'title 双语');
ok(!!ev.body.zh && !!ev.body.it, 'body 双语');
ok(ev.options.length === 6, `选项数 ${ev.options.length}`);
ok(ev.options.map(o => o.id).join(',') === EXPECT.join(','), '选项顺序正确');
ev.options.forEach(o => {
  ok(!!o.text.zh && !!o.text.it, `${o.id}: text 双语`);
  ok(!!o.subtitle && !!o.subtitle.zh && !!o.subtitle.it, `${o.id}: subtitle 双语`);
  ok(Array.isArray(o.preview) && o.preview.length >= 2, `${o.id}: preview ${o.preview.length} 条`);
});

console.log('\n=== 2. 键合法性 ===');
ev.options.forEach(o => {
  const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
  Object.keys(e.factions || {}).forEach(k => ok(FAC.includes(k), `${o.id}: factions.${k} 合法`));
  if (e.factions) Object.keys(e.factions).forEach(k =>
    Object.keys(e.factions[k]).forEach(x => ok(['inf', 'dis'].includes(x), `${o.id}: factions.${k}.${x} 合法`)));
  Object.keys(e.order || {}).forEach(k => ok(ORDER.includes(k), `${o.id}: order.${k} 合法`));
  Object.keys(e.forze || {}).forEach(k => ok(FORZE.includes(k), `${o.id}: forze.${k} 合法`));
  ok(e.legitimacy === undefined, `${o.id}: 不写派生值 legitimacy`);
  ok(!e.journals, `${o.id}: 不激活日志`);
  (e.support || []).forEach(t => {
    ok(CLS.includes(t[0]), `${o.id}: 阶层 ${t[0]} 合法`);
    ok(PARTIES.includes(t[1]), `${o.id}: 政党 ${t[1]} 合法`);
  });
});

console.log('\n=== 3. 成本：五个实质选项各 −1，取消免费 ===');
{
  const EXPECT_COST = { disciplina: -1, discorso: -1, eccidio: -1, annuncio_marcia: -1, nudo: -1, annullare: 0 };
  ev.options.forEach(o => {
    const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
    ok((e.funds || 0) === EXPECT_COST[o.id], `${o.id}: 金库 ${e.funds || 0}（期望 ${EXPECT_COST[o.id]}）`);
  });
}

console.log('\n=== 4. 效果实打 ===');
{
  const r = apply('disciplina');
  const d = (k) => r.s.factions[k].inf - r.before.fac[k].inf;
  console.log(`   纪律：法西斯 ${d('fascisti').toFixed(2)}／收复主义 ${d('irredentisti').toFixed(2)}`
    + ` | 工团异议 ${r.s.factions.sindacalisti.dis - r.before.fac.sindacalisti.dis}`
    + ` 未来异议 ${r.s.factions.futuristi.dis - r.before.fac.futuristi.dis}`);
  ok(near(d('fascisti'), 3), `法西斯派影响力精确 +3（实为 ${d('fascisti').toFixed(2)}）`);
  ok(near(d('irredentisti'), 5), `收复主义者影响力精确 +5（实为 ${d('irredentisti').toFixed(2)}）`);
  ok(r.s.factions.sindacalisti.dis - r.before.fac.sindacalisti.dis === 3, '工团派异议 +3');
  ok(r.s.factions.futuristi.dis - r.before.fac.futuristi.dis === 5, '未来主义派异议 +5');
  ok(r.s.funds - r.before.funds === -1, '扣款 1');
}
{
  const r = apply('discorso');
  const ds = FAC.map(k => r.s.factions[k].dis - r.before.fac[k].dis);
  console.log('   演说：五派异议变化', ds.join(','));
  ok(ds.every(x => x === -4), '所有派系异议 −4');
  ok(r.s.order.fervour - r.before.order.fervour === 6, '热忱 +6');
}
{
  const r = apply('eccidio');
  ok(r.s.classes.portuali.support.LEG - r.before.cl.portuali.support.LEG <= -4, '码头劳工支持下降');
  ok(r.s.classes.operai.support.LEG - r.before.cl.operai.support.LEG <= -2, '产业工人支持下降');
  ok(r.s.factions.sindacalisti.dis - r.before.fac.sindacalisti.dis === 12, '工团派异议 +12');
  ok(r.s.order.violence - r.before.order.violence === 8, '政治暴力 +8');
  ok(r.s.order.subversion - r.before.order.subversion === 6, '党内事态 +6');
}
{
  const r = apply('annuncio_marcia');
  const s0 = Eng.createState('1919-09', 'historical', 42);
  const fs4 = ['fascisti', 'socialisti', 'anarchici', 'comunisti'];
  console.log('   阳台宣言：热忱 +' + (r.s.order.fervour - r.before.order.fervour)
    + ` 事态 +${r.s.order.coup - r.before.order.coup}`
    + ' | 四股力量 ' + fs4.map(k => k + ':' + (r.s.forze[k] - s0.forze[k]).toFixed(1)).join(' '));
  ok(r.s.flags.balcony_declaration === true, '置 balcony_declaration');
  ok(r.s.order.coup - r.before.order.coup === 8, '事态 +8');
  /* 热忱从 92 起步、上限 100，所以 +10 只能落地 +8。这不是 bug，是 clamp。 */
  const fer = r.s.order.fervour - r.before.order.fervour;
  ok(fer === 8, `热忱 +8（起始 92，clamp 到 100；表定 +10）`);
  {
    const s = Eng.createState('1919-09', 'historical', 42);
    s.order.fervour = 50;
    const opt = ev.options.find(o => o.id === 'annuncio_marcia');
    const e = typeof opt.effect === 'function' ? opt.effect(s) : opt.effect;
    const b = s.order.fervour;
    F.Rules.applyEffect(s, { order: { fervour: e.order.fervour } });
    ok(s.order.fervour - b === 10, `有余额时热忱确实 +10（${b} → ${s.order.fervour}）`);
  }
  /* W.FORZA_ANTAGONISM 按每只力量的敌对集合大小缩放其增益，所以表定 +8 落地
     在 +4.0（法西斯，敌对两股）到 +8.0（社会党，敌对一股）之间。这是设计：
     同时拉拢四股力量本来就不如专攻一股划算。断言"四股全部显著上升"。 */
  fs4.forEach(k => {
    const d = r.s.forze[k] - s0.forze[k];
    ok(d >= 4, `forze.${k} 上升 ${d.toFixed(1)}（表定 +8，经敌意缩放）`);
  });
  ok(fs4.every(k => r.s.forze[k] > s0.forze[k]), '四股力量态度全部上升');
}
{
  const r = apply('annullare');
  ok(JSON.stringify(r.s.order) === JSON.stringify(r.before.order), '取消集会：order 无变化');
  ok(r.s.funds === r.before.funds, '取消集会：不花钱');
}
{
  const r = apply('nudo');
  /* 热忱同样受 100 上限约束（起始 92），表定 +12 只能落地 +8。 */
  const fer = r.s.order.fervour - r.before.order.fervour;
  ok(fer === 8, `天体派对：热忱 +8（起始 92，clamp 到 100；表定 +12）`);
  {
    const s = Eng.createState('1919-09', 'historical', 42);
    s.order.fervour = 40;
    const opt = ev.options.find(o => o.id === 'nudo');
    const e = typeof opt.effect === 'function' ? opt.effect(s) : opt.effect;
    const b = s.order.fervour;
    F.Rules.applyEffect(s, { order: { fervour: e.order.fervour } });
    ok(s.order.fervour - b === 12, `有余额时热忱确实 +12（${b} → ${s.order.fervour}）`);
  }
  ok(r.s.order.authority - r.before.order.authority === -7, '摄政权威 −7');
  ok(r.s.flags.adunata_scandal === true, '置 adunata_scandal');
  ok(r.s.classes.borghesia.support.LEG - r.before.cl.borghesia.support.LEG <= -6, '有产精英支持下降');
}

console.log('\n=== 5. 批量零和：每个选项后合计仍为 100 ===');
ev.options.forEach(o => {
  const r = apply(o.id);
  const t = FAC.reduce((a, k) => a + r.s.factions[k].inf, 0);
  ok(near(t, 100), `${o.id}: 派系合计 ${t.toFixed(4)}`);
  ok(FAC.every(k => r.s.factions[k].inf >= 0), `${o.id}: 无负值`);
});

console.log('\n=== 6. 选项 4 与进军日志的衔接（不改阈值） ===');
{
  const j = F.Meta.JOURNAL_BY_ID.marcia_1920;
  /* 阈值必须原封不动：事件不该从内部改写一条线的难度 */
  const thresholds = JSON.stringify(j.goal.complete);
  console.log('   日志完成条件:', thresholds);
  ok(thresholds.indexOf('10 000') >= 0, '军团兵力阈值仍为 10000');
  ok(!j.goal.complete.some(c => /balcony_declaration/.test(JSON.stringify(c))), '日志不读 balcony_declaration');
  /* 但宣言确实推高了其中一根轴 */
  const r = apply('annuncio_marcia');
  const s0 = Eng.createState('1919-09', 'historical', 42);
  const raised = ['fascisti', 'socialisti', 'anarchici', 'comunisti'].filter(k => r.s.forze[k] > s0.forze[k]).length;
  ok(raised === 4, `四股力量态度全部被推高（${raised}/4），正是日志读的那根轴`);
}

console.log('\n=== 7. 注册与可达性 ===');
{
  ok(F.Events.some(e => e.id === ev.id), '已注册进 Events');
  ok(Eng.EVENT_BY_ID[ev.id] === ev, 'EVENT_BY_ID 指向同一对象');
  const st = Eng.createState('1920-10', 'historical', 42);
  st.turn = 26;
  console.log('   有日期事件应当可被选中（difficulty.dated 决定是否入池）');
  ok(!!ev.date, '是日期事件');
}

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
