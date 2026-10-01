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
['azione', 'governo', 'partito'].forEach(deck => {
  const cs = F.Cards.filter(c => c.deck === deck);
  if (!cs.length) { console.log(deck + ': 0 张'); return; }
  let opts = 0, subs = 0, evs = 0;
  const missing = [];
  cs.forEach(c => {
    (c.options || []).forEach(o => {
      opts++;
      if (o.subtitle) subs++;
      else missing.push(c.id + '/' + o.id);
    });
    evs += (c.text && c.text.zh || '').length;
  });
  console.log(`\n=== ${deck}（${cs.length} 张 · ${opts} 选项 · 副标题 ${subs}/${opts} · 平均描述 ${Math.round(evs / cs.length)} 字）===`);
  cs.forEach(c => {
    const o = c.options || [];
    const s = o.filter(x => x.subtitle).length;
    console.log(`   ${c.id.padEnd(22)} 描述 ${String((c.text && c.text.zh || '').length).padStart(4)} 字 · 副标题 ${s}/${o.length}`
      + (s < o.length ? '   ← 缺' : ''));
  });
});
