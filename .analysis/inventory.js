/* 全量内容清单 + 可达性审计
   输出：事件（按日期/条件分组、触发源）、日志（触发源与目标）、结局（优先级与 check 依赖）、
   成就（授予条件）、卡牌、顾问，以及「孤儿内容」检测。 */
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
const F = globalThis.Fiume, Eng = F.Engine, W = F.World, Meta = F.Meta;
const out = [];
const say = s => out.push(s);

/* ---------- 1. 事件 ---------- */
say('# 1. 事件清单（' + Eng.ALL_EVENTS.length + ' 个）\n');
const evSorted = Eng.ALL_EVENTS.slice().sort((a, b) => {
  const ka = a.date ? a.date.y * 12 + a.date.m : 99999;
  const kb = b.date ? b.date.y * 12 + b.date.m : 99999;
  return ka - kb || a.id.localeCompare(b.id);
});
say('| id | 日期 | 类型 | 选项 | 触发源 |');
say('| --- | --- | --- | --- | --- |');
for (const e of evSorted) {
  const kind = e.superEvent ? '**超级**' : (e.chain ? '链节点' : (e.date ? '日期' : '条件'));
  const d = e.date ? `${e.date.y}-${String(e.date.m).padStart(2, '0')}` : '—';
  /* 谁把它带进来：superEvent 靠 condition；chain 靠父事件的 next/queueEvents */
  const srcs = [];
  for (const p of Eng.ALL_EVENTS) {
    for (const o of (p.options || [])) {
      const patch = typeof o.effect === 'function' ? null : o.effect;
      if (!patch) continue;
      if (patch.next === e.id) srcs.push(p.id + '.next');
      const q = patch.queueEvents || patch.queue;
      if (q && q.indexOf(e.id) >= 0) srcs.push(p.id + '.queue');
    }
  }
  say(`| \`${e.id}\` | ${d} | ${kind} | ${e.options.length} | ${srcs.join(', ') || (e.superEvent ? 'condition（超级）' : e.chain ? '**无（孤儿链节点）**' : '调度池')} |`);
}

/* ---------- 2. 日志 ---------- */
say('\n# 2. 日志（' + Meta.JOURNALS.length + ' 个）\n');
const jRefs = new Map();
function scan(dir, label) {
  const p = path.join(base, 'game', dir);
  if (!fs.existsSync(p)) return;
  for (const f of fs.readdirSync(p).filter(x => x.endsWith('.ts'))) {
    const src = fs.readFileSync(path.join(p, f), 'utf8');
    (src.match(/journals:\s*\[([^\]]*)\]/g) || []).forEach(m => {
      (m.match(/'([a-z_0-9]+)'/g) || []).forEach(id => {
        const k = id.replace(/'/g, '');
        if (!jRefs.has(k)) jRefs.set(k, []);
        jRefs.get(k).push(label + '/' + f.replace(/\.ts$/, ''));
      });
    });
  }
}
scan('events', 'event'); scan('action_affairs', 'card');
scan('government_affairs', 'card'); scan('party_affairs', 'card');
scan('advisors', 'advisor');
say('| id | 名称 | 前置 | 完成条件 | 失败条件 | 激活入口 |');
say('| --- | --- | --- | --- | --- | --- |');
for (const j of Meta.JOURNALS) {
  const g = j.goal || {};
  const c = (g.complete || []).map(x => x.zh).join('；') || '—';
  const f2 = (g.fail || []).length ? g.fail.map(x => x.zh).join('；') : '**永不失败**';
  const refs = jRefs.get(j.id) || [];
  say(`| \`${j.id}\` | ${j.zh} | ${j.start ? j.start.zh : '—'} | ${c} | ${f2} | ${refs.length} 处 |`);
}
const jIds = Meta.JOURNALS.map(j => j.id);
const orphanJ = [...jRefs.keys()].filter(k => !jIds.includes(k));
if (orphanJ.length) say('\n**未定义的日志引用**：' + orphanJ.join(', '));
const neverJ = jIds.filter(k => !jRefs.has(k));
if (neverJ.length) say('\n**从未被激活的日志**：' + neverJ.join(', '));

/* ---------- 3. 结局 ---------- */
say('\n# 3. 结局（' + Meta.ENDINGS.length + ' 个，按 priority 升序）\n');
say('| p | id | 名称 | 标签 | check 读取的字段 |');
say('| --- | --- | --- | --- | --- |');
const sorted = Meta.ENDINGS.slice().sort((a, b) => a.priority - b.priority);
for (const e of sorted) {
  const src = e.check.toString();
  const fields = [...new Set((src.match(/(?:flags\.\w+|laws\.\w+|economy\.\w+|order\.\w+|factions\.\w+|diplo\.\w+|counters\.\w+|assembly\.\w+|date\.\w+)/g) || []))];
  say(`| ${e.priority} | \`${e.id}\` | ${e.zh} | ${e.tag || '—'} | ${fields.join(', ') || '（恒真）'} |`);
}

/* ---------- 4. 成就 ---------- */
say('\n# 4. 成就（' + Meta.ACHIEVEMENTS.length + ' 个）\n');
const achSrc = F.Rules.checkAchievements.toString();
say('| id | 名称 | 授予条件（源码片段） |');
say('| --- | --- | --- |');
for (const a of Meta.ACHIEVEMENTS) {
  const m = achSrc.match(new RegExp("grant\\('" + a.id + "'\\)[^;]*;"));
  let cond = m ? m[0].replace(/^grant\('.*?'\);\s*/, '').replace(/;\s*$/, '') : '**未在 checkAchievements 中出现**';
  say(`| \`${a.id}\` | ${a.zh} | \`${cond}\` |`);
}

/* ---------- 5. 卡牌 / 顾问 / 派系 / 政党 ---------- */
say('\n# 5. 卡牌（' + F.Cards.length + '）\n');
const byDeck = {};
F.Cards.forEach(c => { byDeck[c.deck] = (byDeck[c.deck] || []); byDeck[c.deck].push(c.id + `(${c.options.length})`); });
Object.keys(byDeck).forEach(d => say(`- **${d}** ${byDeck[d].length}：${byDeck[d].join(', ')}`));
say('\n# 6. 顾问（' + W.ADVISORS.length + '）\n');
say(W.ADVISORS.map(a => `- \`${a.id}\` ${a.zh}（${a.faction || '外部'}）${a.require ? ' **[有前置]**' : ''}`).join('\n'));
say('\n# 7. 可选政治力量（player: true）\n');
say(W.PARTIES.filter(p => p.player).map(p => `- \`${p.id}\` ${p.zh}（${p.it}）`).join('\n'));
say('\n# 8. 派系\n');
say(W.FACTIONS.map(f => `- \`${f.id}\` ${f.zh} inf=${f.inf} dis=${f.dis}`).join('\n'));
say('\n# 9. 势力线 W.FORZE\n');
say(W.FORZE.map(f => `- \`${f.id}\` ${f.zh} init=${f.init} gate=${f.gate} allied=${!!f.allied}`).join('\n'));

fs.writeFileSync(path.join(__dirname, 'inventory.md'), out.join('\n') + '\n', 'utf8');
console.log('written .analysis/inventory.md  lines=' + out.length);
console.log('\n--- 摘要 ---');
console.log('事件 ' + Eng.ALL_EVENTS.length + ' · 日志 ' + Meta.JOURNALS.length + ' · 结局 ' + Meta.ENDINGS.length + ' · 成就 ' + Meta.ACHIEVEMENTS.length);
if (orphanJ.length) console.log('未定义日志引用: ' + orphanJ.join(', '));
if (neverJ.length) console.log('从未激活的日志: ' + neverJ.join(', '));
