/* 从 git HEAD 读取改写前的政府卡，导出机械值基线（ministry/ap/cooldown/选项 id/preview/effect）。
   之所以走 git 而不是当前工作区：有三个文件在生成基线之前已经被改写了。 */
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const os = require('os');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));
require.extensions['.ts'] = (module, filename) => {
  const src = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const ROOT = path.join(__dirname, '..');
const DIR = 'src/game/government_affairs';

/* 取 HEAD 版本的每个文件，写入临时目录后加载 */
const files = execFileSync('git', ['ls-tree', '--name-only', 'HEAD', DIR + '/'], { cwd: ROOT })
  .toString().split('\n').map(s => s.trim()).filter(s => s.endsWith('.ts'));
console.log('HEAD 中的政府卡文件:', files.length);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gvbase-'));
files.forEach(f => {
  const rel = f.replace(DIR + '/', '');
  const content = execFileSync('git', ['show', 'HEAD:' + f], { cwd: ROOT }).toString('utf8') ||
    execFileSync('git', ['show', 'HEAD:' + f], { cwd: ROOT, maxBuffer: 1 << 26 }).toString('utf8');
  fs.writeFileSync(path.join(tmp, rel), content, 'utf8');
});

/* 加载基线时的引擎常量（用当前 dist 的常量即可，卡牌只关心结构） */
const base = path.join(ROOT, 'src');
for (const f of ['lib/core.js', 'game/data/world.js', 'game/data/parties.js', 'game/data/factions.js',
  'game/data/meta.js', 'game/engine/rules.js', 'game/registries/contentRegistry.ts',
  'game/engine/reducers.js', 'game/engine/selectors.js']) {
  require(path.join(base, f));
}
/* 临时替换 contentRegistry 会注册的卡牌：直接加载 HEAD 版本的四个目录 index 不可行，
   改为逐个加载 HEAD 文件并读取导出。 */
const out = {};
for (const f of files) {
  const rel = f.replace(DIR + '/', '');
  if (rel === 'index.ts') continue;
  let mod;
  try { mod = require(path.join(tmp, rel)); } catch (e) { console.log('  !! 加载失败', rel, e.message); continue; }
  const card = Object.values(mod).find(v => v && typeof v === 'object' && v.deck === 'governo');
  if (!card) { console.log('  ?? 未找到卡片导出', rel); continue; }
  out[card.id] = {
    ministry: card.ministry,
    ap: card.cost && card.cost.ap,
    cooldown: card.cooldown,
    options: (card.options || []).map(o => ({
      id: o.id,
      preview: o.preview,
      effect: typeof o.effect === 'function' ? '[function]' : o.effect
    }))
  };
}
const n = Object.keys(out).length;
console.log('导出基线卡片数:', n);
fs.writeFileSync(path.join(__dirname, 'gv_baseline.json'), JSON.stringify(out, null, 1), 'utf8');
console.log('written .analysis/gv_baseline.json');
console.log('id 列表:', Object.keys(out).join(', '));
