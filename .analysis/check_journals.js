/* 日志系统校验：12 条日志的 goal / outcome 元数据完整性，
   以及实际对局中激活日志的面板读数。 */
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
const F = globalThis.Fiume, Eng = F.Engine, Meta = F.Meta, Sel = F.Sel, Core = F.Core;
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } };

console.log('=== 1. 元数据完整性 ===');
const ids = Meta.JOURNALS.map(j => j.id);
console.log(`   日志总数 ${ids.length}：${ids.join(', ')}`);
Meta.JOURNALS.forEach(j => {
  const g = j.goal, o = j.outcome;
  ok(!!g, `${j.id} 缺少 goal`);
  ok(!!o, `${j.id} 缺少 outcome`);
  if (!g || !o) return;
  ok(Array.isArray(g.complete), `${j.id}.goal.complete 应为数组`);
  ok(Array.isArray(g.fail), `${j.id}.goal.fail 应为数组`);
  ok(Array.isArray(o.onComplete), `${j.id}.outcome.onComplete 应为数组`);
  ok(Array.isArray(o.onFail), `${j.id}.outcome.onFail 应为数组`);
  // 每条文案都必须是双语节点
  [].concat(g.complete, g.fail, o.onComplete, o.onFail).forEach(x => {
    ok(typeof x === 'object' && !!x.zh, `${j.id} 有一条缺 zh 的文案`);
  });
  // 有 complete 谓词就必须有完成条件，反之亦然
  ok(typeof j.complete === 'function' ? g.complete.length > 0 : g.complete.length === 0,
    `${j.id} 的 goal.complete 与 complete 谓词不匹配`);
  // fail 谓词恒为 false 时，空数组是「永不失败」的正确表达，不算缺失
  const failNever = typeof j.fail === 'function' && j.fail.length === 0;
  ok(failNever ? g.fail.length === 0 : (typeof j.fail === 'function' ? g.fail.length > 0 : g.fail.length === 0),
    `${j.id} 的 goal.fail 与 fail 谓词不匹配`);
  ok(typeof j.onComplete === 'function' ? o.onComplete.length > 0 : o.onComplete.length === 0,
    `${j.id} 的 outcome.onComplete 与 onComplete 谓词不匹配`);
});
// 唯一允许 onFail 为空的是 esilio（fail 恒为 false）
Meta.JOURNALS.forEach(j => {
  const never = j.fail && j.fail.length === 0;
  if (never) console.log(`   注：${j.id} 永不失败，goal.fail 与 outcome.onFail 为空`);
});
console.log(`   完整性检查 ${fail === 0 ? '全部通过 ✓' : fail + ' 项失败'}`);

console.log('\n=== 2. 实际对局中的面板读数 ===');
let s = Eng.createState('1919-09', 'historical', 12345);
let turn = 0;
while (turn++ < 200 && s.phase !== 'ended') {
  if (s.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    const opts = ev.options.filter(o => !o.condition || o.condition(s));
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
  } else {
    s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
  if (turn === 60) {
    const jr = Sel.journals(s);
    console.log(`   1919-09 起第 60 回合（${s.date.y}-${s.date.m}）· state.journals 有 ${Object.keys(s.journals).length} 条`);
    console.log(`   Sel.journals 返回 ${jr.length} 条：`);
    jr.forEach(j => {
      const st = j.done ? '完成' : j.failed ? '失败' : `进行 ${j.months} 月`;
      console.log(`     · ${j.zh} [${st}] desc=${typeof j.desc} goal=${!!j.goal} outcome=${!!j.outcome}`);
      if (j.goal) {
        console.log(`         完成条件: ${j.goal.complete.map(x => Core.L(x)).join(' / ')}`);
        console.log(`         失败条件: ${(j.goal.fail.length ? j.goal.fail : ['无失败条件']).map(x => typeof x === 'string' ? x : Core.L(x)).join(' / ')}`);
        console.log(`         完成效果: ${j.outcome.onComplete.map(x => Core.L(x)).join(' / ')}`);
        console.log(`         失败效果: ${(j.outcome.onFail.length ? j.outcome.onFail : ['无']).map(x => typeof x === 'string' ? x : Core.L(x)).join(' / ')}`);
      }
    });
  }
}
console.log(`\n   对局结束 ${s.date.y}-${s.date.m} · 结局 ${s.ending}`);
console.log(`   最终 state.journals：${Object.keys(s.journals).join(', ') || '（无）'}`);
const fin = Sel.journals(s);
console.log(`   最终面板 ${fin.length} 条：`);
fin.forEach(j => console.log(`     · ${j.zh} ${j.done ? '[完成]' : j.failed ? '[失败]' : '[进行 ' + j.months + ' 月]'}`));

console.log('\n=== 3. 内容层引用了哪些日志 id（事件 + 卡牌 + 顾问）===');
const refs = new Map();   // id -> [来源]
function scanDir(dir, label) {
  const p = path.join(base, 'game', dir);
  if (!fs.existsSync(p)) return;
  fs.readdirSync(p).filter(f => f.endsWith('.ts')).forEach(f => {
    const src = fs.readFileSync(path.join(p, f), 'utf8');
    const m = src.match(/journals:\s*\[([^\]]*)\]/g) || [];
    m.forEach(x => (x.match(/'([a-z_]+)'/g) || []).forEach(id => {
      const k = id.replace(/'/g, '');
      if (!refs.has(k)) refs.set(k, []);
      refs.get(k).push(`${label}/${f.replace(/\.ts$/, '')}`);
    }));
  });
}
scanDir('events', 'event');
scanDir('government_affairs', 'card');
scanDir('action_affairs', 'card');
scanDir('party_affairs', 'card');
console.log(`   内容层出现的日志 id ${refs.size} 个：`);
[...refs.keys()].sort().forEach(id => console.log(`     · ${id}  ← ${refs.get(id).join(', ')}`));
[...refs.keys()].forEach(id => {
  if (!Meta.JOURNAL_BY_ID[id]) {
    fail++;
    console.log(`  ✗ 内容引用了未定义的日志 id：「${id}」— activateJournal 静默忽略，该效果永不生效（来源：${refs.get(id).join(', ')}）`);
  }
});
const never = ids.filter(id => !refs.has(id));
console.log(`   从未被任何内容激活的日志：${never.join(', ') || '（无）'}`);
Meta.JOURNALS.forEach(j => {
  const n = refs.get(j.id) ? refs.get(j.id).length : 0;
  console.log(`     ${j.zh.padEnd(18)} 激活入口 ${n} 处${n ? '：' + refs.get(j.id).join(', ') : '   ← 玩家永远看不到'}`);
});

console.log('\n=== ' + (fail === 0 ? '全部通过 ✓' : fail + ' 项失败 ✗') + ' ===');
process.exit(fail ? 1 : 0);
