/* 补全清点：成就授予条件 + 链节点真实可达性 */
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
const F = globalThis.Fiume, R = F.Rules, Meta = F.Meta, Eng = F.Engine;

console.log('=== 成就授予条件（从 checkAchievements 源码抽取）===');
const src = R.checkAchievements.toString();
const re = /if\s*\(([^)]*)\)\s*grant\('([a-z_]+)'\)/g;
let m; const rows = [];
while ((m = re.exec(src))) rows.push([m[2], m[1].trim().replace(/\s+/g, ' ')]);
rows.forEach(([id, c]) => console.log('  ' + id.padEnd(16) + ' <= ' + c));
const missing = Meta.ACHIEVEMENTS.map(a => a.id).filter(id => !rows.some(r => r[0] === id));
if (missing.length) console.log('  !! 定义了但授予条件不可解析: ' + missing.join(', '));

console.log('\n=== 链节点可达性（用真实 effect 求值，含函数体）===');
const refs = new Set();
const seed = Eng.createState('1919-09', 'historical', 1);
F.Events.forEach(p => (p.options || []).forEach(o => {
  let patch = null;
  try { patch = typeof o.effect === 'function' ? o.effect(seed) : o.effect; } catch (e) { patch = null; }
  if (!patch) return;
  if (patch.next) refs.add(patch.next);
  (patch.queueEvents || patch.queue || []).forEach(q => refs.add(q));
}));
const chains = F.Events.filter(e => e.chain);
chains.forEach(e => console.log('  ' + e.id.padEnd(30) + (refs.has(e.id) ? 'ok 由父事件进入' : '!! 孤儿')));
console.log(`  链节点 ${chains.length} 个，其中孤儿 ${chains.filter(e => !refs.has(e.id)).length} 个`);

console.log('\n=== 结局 check 依赖的反向索引（哪个结局依赖哪个 flag）===');
const flagToEndings = {};
Meta.ENDINGS.forEach(e => {
  const s = e.check.toString();
  [...new Set((s.match(/flags\.\w+/g) || []))].forEach(f => {
    const k = f.replace('flags.', '');
    (flagToEndings[k] = flagToEndings[k] || []).push(e.id);
  });
});
Object.keys(flagToEndings).sort().forEach(k =>
  console.log('  flags.' + k.padEnd(26) + ' → ' + flagToEndings[k].join(', ')));

console.log('\n=== 谁设置了这些 flag（内容层扫描）===');
const dirs = ['events', 'action_affairs', 'government_affairs', 'party_affairs', 'advisors'];
const files = [];
dirs.forEach(d => {
  const p = path.join(base, 'game', d);
  if (fs.existsSync(p)) fs.readdirSync(p).filter(f => f.endsWith('.ts')).forEach(f => files.push(path.join(p, f)));
});
/* meta.js matters here too: journal onComplete handlers are what set
   carta_done, porto_revived, international_guarantee, exile_endured and
   passive_victory. Omitting it produced five false "unreachable" warnings. */
files.push(path.join(base, 'game', 'data', 'meta.js'));
files.push(path.join(base, 'game', 'data', 'world.js'));
const flagSetters = {};
files.forEach(fp => {
  const s = fs.readFileSync(fp, 'utf8');
  (s.match(/flags:\s*\{[^}]*\}/g) || []).forEach(blk => {
    (blk.match(/([a-z_][a-z_0-9]*)\s*:/g) || []).forEach(k => {
      const name = k.replace(/\s*:$/, '');
      (flagSetters[name] = flagSetters[name] || []).push(path.basename(fp, '.ts').replace('.js', ''));
    });
  });
});
/* 只报「被结局或日志读取但没有任何地方设置」的 flag —— 那才是死结局 */
const readByEnding = Object.keys(flagToEndings);
const jSrc = Meta.JOURNALS.map(j => [j.complete, j.fail].map(f => f ? f.toString() : '').join(' ')).join(' ');
const readByJournal = [...new Set((jSrc.match(/flags\.(\w+)/g) || []))].map(x => x.replace('flags.', ''));
const allRead = [...new Set(readByEnding.concat(readByJournal))];
console.log('  从未被任何内容层设置的 flag（可能导致结局不可达）：');
let dead = 0;
allRead.forEach(f => {
  if (!flagSetters[f]) { console.log('    !! flags.' + f + '  ← 被 ' + (flagToEndings[f] || []).concat(readByJournal.includes(f) ? ['journal'] : []).join(', ') + ' 读取'); dead++; }
});
if (!dead) console.log('    （无）');
