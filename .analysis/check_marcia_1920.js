/* 1920 进军罗马：结构 + 可达性验证 */
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, S = F.Sel, W = F.World, Meta = F.Meta, Core = F.Core;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

console.log('=== 1. 数据表 ===');
ok(W.FORZE.length === 7, `W.FORZE 有 ${W.FORZE.length} 条`);
ok(W.FORZE.filter(f => f.allied).length === 6, '六股「力量」+ 军官团');
ok(W.FORZA_FRONT.length === 6 && W.FORZA_FRONT_NEEDED === 3, `六选三（front ${W.FORZA_FRONT.length} / needed ${W.FORZA_FRONT_NEEDED}）`);
ok(W.FORZE.every(f => f.zh && f.it && typeof f.init === 'number'), '每条都有双语名与 init');
ok(!!W.FORZA_BY_ID.fascisti && !!W.FORZA_BY_ID.forzearmate, 'FORZA_BY_ID 索引正确');
ok(!!W.FORZA_ANTAGONISM.fascisti && !!W.FORZA_ANTAGONISM.comunisti, '对抗表存在');

console.log('\n=== 2. 日志 ===');
let s = Eng.createState('1919-09', 'historical', 42);
const j = Meta.JOURNAL_BY_ID.marcia_1920;
ok(!!j, '日志 marcia_1920 已定义');
ok(!!j.goal && j.goal.complete.length === 3 && j.goal.fail.length === 1, 'goal 三条件 + 一失败条件');
ok(!!j.outcome && j.outcome.onComplete.length === 2 && j.outcome.onFail.length === 3, 'outcome 结构完整');
ok(j.goal.complete.every(x => x.zh && x.it), 'goal 全双语');
ok(j.outcome.onFail.every(x => x.zh && x.it), 'outcome 全双语');
ok(!j.complete(s) && !j.fail(s), '开局既未完成也未失败');

console.log('\n=== 3. 结局优先级（resolveEnding 按 priority 升序取首个命中） ===');
const pr = {};
Meta.ENDINGS.forEach(e => { pr[e.id] = e.priority; });
console.log(`   ending_fascio=${pr.ending_fascio} · ending_marcia_1920=${pr.ending_marcia_1920}`);
ok(pr.ending_marcia_1920 <= pr.ending_fascio, '1920 版不晚于法西斯城邦');
/* The 1922 march ending and its chain were cut as unreachable; if they come
   back, the priority relationship has to be re-established deliberately. */
ok(pr.ending_marcia === undefined, '1922 版进军结局已剪除');
ok(pr.ending_yugoslav === undefined, '南斯拉夫之门（不可达）已剪除');
ok(!Eng.EVENT_BY_ID.ev_1922_10_roma && !Eng.EVENT_BY_ID.ev_marcia, '1922 进军线两个事件已删除');
ok(Eng.ALL_EVENTS.filter(e => e.chain).every(e => {
  return Eng.ALL_EVENTS.some(p => (p.options || []).some(o => {
    let patch = null; try { patch = typeof o.effect === 'function' ? o.effect({}) : o.effect; } catch (err) { patch = null; }
    return patch && (patch.next === e.id || (patch.queueEvents || []).indexOf(e.id) >= 0);
  }));
}), '剪除后没有留下孤儿链节点');
const s1 = Eng.createState('1919-09', 'historical', 42);
s1.flags.marcia_1920 = true;
ok(R.resolveEnding(s1).id === 'ending_marcia_1920', `命中 ${R.resolveEnding(s1).id}`);
const s2 = Eng.createState('1919-09', 'historical', 42);
s2.flags.marcia_1920 = true; s2.flags.coup_done = true;
ok(R.resolveEnding(s2).id !== 'ending_marcia_1920', '已政变时不会误判为 1920 进军');

console.log('\n=== 4. 事件注册 ===');
const ids = ['ev_1920_06_romafronte', 'ev_romafronte_mussolini', 'ev_romafronte_malatesta',
  'ev_romafronte_bombacci', 'ev_romafronte_gramsci', 'ev_1920_09_romafronte', 'ev_romafronte_epilogo'];
ids.forEach(id => ok(!!Eng.EVENT_BY_ID[id], `已注册 ${id}`));
/* The four approaches are conditional, not chained: a queued (chained) node
   would resolve on the very next turn with no chance to advance the month, so
   queueing all four would push them through in a single turn and front-load the
   antagonism. They must wait for the journal and let the player set the pace. */
const FORCE_EV = ['ev_romafronte_mussolini', 'ev_romafronte_malatesta',
  'ev_romafronte_bombacci', 'ev_romafronte_gramsci'];
FORCE_EV.forEach(id => {
  const e = Eng.EVENT_BY_ID[id];
  ok(e.chain !== true, `${id} 不挂 chain（条件驱动，玩家决定节奏）`);
  ok(typeof e.condition === 'function', `${id} 有 condition`);
  /* The condition reads state.date through W.forzaWindowOpen, so the probe
     state has to carry a date — a bare {journals:{}} makes it throw. */
  const at = m => ({ journals: { marcia_1920: { active: true } }, date: { y: 1920, m } });
  const opened = [7, 8, 9, 10].some(m => e.condition(at(m)) === true);
  ok(opened, `${id} 在其窗口内可调度`);
  ok(e.condition({ journals: {}, date: { y: 1920, m: 9 } }) === false, `${id} 日志未开启时不可调度`);
  ok(e.condition({ journals: { marcia_1920: { active: false, done: true } }, date: { y: 1920, m: 9 } }) === false, `${id} 日志结束后不可调度`);
  ok(e.condition(at(6)) === false || e.condition(at(11)) === false, `${id} 窗口之外不可调度`);
});
ok(Eng.EVENT_BY_ID.ev_1920_06_romafronte.chain !== true, '开口事件可被日期调度');
ok(Eng.EVENT_BY_ID.ev_1920_06_romafronte.date && Eng.EVENT_BY_ID.ev_1920_06_romafronte.date.y === 1920, '开口事件定在 1920 年');
/* The opening event must NOT queue: see FORCE_EV above. */
const openEff = Eng.EVENT_BY_ID.ev_1920_06_romafronte.options.find(o => o.id === 'tessere').effect({});
ok(!openEff.queueEvents, '开口事件不 queueEvents（否则四条线在一回合内被强推）');
ok(openEff.journals && openEff.journals[0] === 'marcia_1920', '开口事件激活日志');
/* Refusal must be the FIRST option: the default line has to stay historical.
   Both opt-in routes (tessere / ufficiali) sit after it. */
const openOpts = Eng.EVENT_BY_ID.ev_1920_06_romafronte.options.map(o => o.id);
console.log('   开口选项顺序:', openOpts.join(' → '));
ok(openOpts[0] === 'restare', '第一个选项是「留下」（默认线保持史实）');
openOpts.slice(1).forEach(id => {
  const eff = Eng.EVENT_BY_ID.ev_1920_06_romafronte.options.find(o => o.id === id).effect({});
  ok(eff.journals && eff.journals[0] === 'marcia_1920', `选项 ${id} 激活日志`);
  ok(!eff.queueEvents, `选项 ${id} 不 queueEvents（否则四条线在一回合内被强推）`);
});
/* The officer corps has no other lever: exactly one option must raise it. */
const raisers = openOpts.filter(id =>
  (Eng.EVENT_BY_ID.ev_1920_06_romafronte.options.find(o => o.id === id).effect({}).forze || {}).forzearmate > 0);
ok(raisers.length === 1 && raisers[0] === 'ufficiali', `只有「ufficiali」能提高军官团（实为 ${raisers.join(',') || '无'}）`);
/* Each force line needs its own window, or all four resolve on one turn. */
['fascisti', 'anarchici', 'socialisti', 'comunisti'].forEach(k => {
  ok(!!W.FORZA_WINDOW[k], `${k} 有窗口`);
});
const wMonths = Object.values(W.FORZA_WINDOW).map(w => w.from.y * 12 + w.from.m);
ok(new Set(wMonths).size === Object.keys(W.FORZA_WINDOW).length, '各窗口的开启月份互不相同（不会同回合触发）');
ok(W.forzaWindowOpen({ date: { y: 1922, m: 6 } }, 'fascisti') === false, '窗口在 1922-06 已关闭');
ok(W.forzaWindowOpen({ date: { y: 1920, m: 7 } }, 'fascisti') === true, '墨索里尼窗口 1920-07 开启');
/* Each approach must fire at most once, or the window turns the 80 threshold
   into a matter of patience rather than of picking a coalition. */
FORCE_EV.forEach(id => ok(Eng.EVENT_BY_ID[id].once === true, `${id} 标了 once（不可重复刷）`));
/* The September window and the epilogue are time/condition driven on purpose. */
ok(Eng.EVENT_BY_ID.ev_1920_09_romafronte.chain !== true, '九月窗口由条件驱动，不挂 chain');
ok(Eng.EVENT_BY_ID.ev_romafronte_epilogo.chain !== true, '终局节点由条件驱动，不挂 chain');
ok(Eng.EVENT_BY_ID.ev_romafronte_epilogo.superEvent !== true, '终局节点不是 superEvent（不会抢占血腥圣诞/政变）');

console.log('\n=== 5. forze 效果键 ===');
const t = Eng.createState('1919-09', 'historical', 42);
console.log('   初始:', W.FORZE.map(f => `${f.zh} ${t.forze[f.id]}`).join(' / '));
ok(W.FORZE.every(f => t.forze[f.id] === f.init), '初值按 W.FORZE 种下');
const before = { ...t.forze };
R.applyEffect(t, { forze: { fascisti: 12 } });
ok(t.forze.fascisti === before.fascisti + 12, '指定力量 +12');
ok(t.forze.anarchici < before.anarchici, `对抗自动生效：无政府主义者 ${before.anarchici} → ${t.forze.anarchici}`);
ok(t.forze.comunisti < before.comunisti, `共产党同步被推远：${before.comunisti} → ${t.forze.comunisti}`);
R.applyEffect(t, { forze: { comunisti: -999 } });
ok(t.forze.comunisti === -40, `下限 −40 生效（${t.forze.comunisti}）`);
R.applyEffect(t, { forze: { fascisti: 999 } });
ok(t.forze.fascisti === 100, `上限 100 生效（${t.forze.fascisti}）`);

console.log('\n=== 6. 军官团不低于 0、不影响外交与事态 ===');
/* `R.pressione` was removed from the engine (its state was folded into the
   siege axis and smoke.js asserts it is gone). Assert on what still exists:
   forze must not leak into diplo, and must not move the siege. */
const t2 = Eng.createState('1919-09', 'historical', 42);
const d0 = JSON.stringify(t2.diplo), coup0 = t2.order.coup;
R.applyEffect(t2, { forze: { forzearmate: 40 } });
ok(t2.order.coup === coup0, '事态累积不受 forze 影响');
ok(JSON.stringify(t2.diplo) === d0, 'state.diplo 未被 forze 污染');

console.log('\n=== 7. 每月漂移 ===');
const t3 = Eng.createState('1919-09', 'historical', 42);
t3.forze.forzearmate = 50; t3.forze.comunisti = 50; t3.forze.fascisti = 50;
/* dispatch refuses ADVANCE while an event is pending, so drive the turn the way
   the engine does rather than through the action router. */
Eng.advanceWeek(t3, Core.makeRng(7));
console.log(`   军官团 ${t3.forze.forzearmate} · 葛兰西 ${t3.forze.comunisti.toFixed(2)} · 墨索里尼 ${t3.forze.fascisti.toFixed(2)}`);
ok(t3.forze.forzearmate < 50, '军官团每月 −0.4');
ok(t3.forze.comunisti < 50, '葛兰西每月 −0.15');
ok(Math.abs(t3.forze.fascisti - 50) < 1e-9, '墨索里尼不漂移');

console.log('\n=== 8. 选择器 ===');
const fz = S.forze(t3);
ok(fz.list.length === 6 && fz.front.length === 5, 'list 6 条 / front 5 条');
ok(typeof fz.alliedCount === 'number', `alliedCount = ${fz.alliedCount}`);
ok(fz.officer && fz.officer.id === 'forzearmate', 'officer 指向军官团');
ok(fz.front.every(x => typeof x.atGate === 'boolean'), 'atGate 布尔');
ok(fz.front.every(x => typeof x.consolidating === 'boolean'), 'consolidating 布尔（与日志每月门槛同源）');
ok(fz.front.every(x => x.gate === 80) && fz.officer.gate === 60, '门槛：四股 80 / 军官团 60');

console.log('\n=== 9. 存档往返 ===');
const rt = JSON.parse(JSON.stringify(t3));
ok(rt.forze && typeof rt.forze.fascisti === 'number', 'forze 随存档往返');

console.log('\n=== 10. 日志界面结构（goal/outcome 可展开） ===');
const v = S.journals((function () {
  const x = Eng.createState('1919-09', 'historical', 42);
  R.activateJournal(x, 'marcia_1920');
  return x;
})());
const jv = v.filter(x => x.id === 'marcia_1920')[0];
ok(!!jv, 'Sel.journals 返回该日志');
ok(jv.goal.complete.length === 3 && jv.goal.fail.length === 1, '面板可读到 3 完成条件 / 1 失败条件');
ok(jv.outcome.onComplete.length === 2 && jv.outcome.onFail.length === 3, '面板可读到 2 完成效果 / 3 失败效果');

console.log('\n=== ' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗') + ' ===');
process.exit(bad ? 1 : 0);
