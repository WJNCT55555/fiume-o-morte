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
const F = globalThis.Fiume;
const gv = F.Cards.filter(c => c.deck === 'governo');
console.log('政府卡 ' + gv.length + ' 张\n');
let totOpts = 0, withSub = 0, withPrev = 0;
const rows = [];
gv.forEach(c => {
  const opts = c.options || [];
  totOpts += opts.length;
  const subs = opts.filter(o => o.subtitle).length;
  const prevs = opts.filter(o => o.preview && o.preview.length).length;
  const noPreview = opts.filter(o => !o.preview || !o.preview.length).length;
  withSub += subs; withPrev += prevs;
  const t = c.text ? (c.text.zh || '').length : 0;
  rows.push({
    id: c.id, ministry: c.ministry, zh: c.name.zh,
    opts: opts.length, subs, prevs, noPreview,
    textLen: t, cooldown: c.cooldown, ap: c.cost && c.cost.ap,
    hasRequire: !!c.require, hasRequireText: !!c.requireText
  });
});
console.log('id'.padEnd(20) + '席位'.padEnd(12) + '名称'.padEnd(12) + '选项 副标题 预览 无预览 描述字数 冷却 AP');
rows.forEach(r => {
  console.log(
    r.id.padEnd(20) +
    String(r.ministry || '—').padEnd(12) +
    String(r.zh).padEnd(12) +
    String(r.opts).padEnd(5) +
    String(r.subs).padEnd(6) +
    String(r.prevs).padEnd(5) +
    String(r.noPreview).padEnd(6) +
    String(r.textLen).padEnd(9) +
    String(r.cooldown == null ? '—' : r.cooldown).padEnd(5) +
    String(r.ap)
  );
});
console.log(`\n合计：${gv.length} 张卡 · ${totOpts} 个选项 · 带副标题 ${withSub} · 带预览 ${withPrev}`);
console.log(`缺 requireText 的: ${rows.filter(r => r.hasRequire && !r.hasRequireText).map(r => r.id).join(',') || '（无）'}`);

/* 行动卡的对照基线 */
const az = F.Cards.filter(c => c.deck === 'azione');
const azOpts = az.reduce((a, c) => a + (c.options || []).length, 0);
const azSubs = az.reduce((a, c) => a + (c.options || []).filter(o => o.subtitle).length, 0);
const azTextLen = Math.round(az.reduce((a, c) => a + (c.text ? (c.text.zh || '').length : 0), 0) / az.length);
console.log(`\n行动卡基线：${az.length} 张 · ${azOpts} 选项 · 副标题 ${azSubs}/${azOpts} · 平均描述 ${azTextLen} 字`);
