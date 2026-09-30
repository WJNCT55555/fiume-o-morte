const path = require('path');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));
require.extensions['.ts'] = (module, filename) => {
  const src = require('fs').readFileSync(filename, 'utf8');
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, Core = F.Core, W = F.World;
const s = Eng.createState('1919-09', 'historical', 9);
const res = R.election(s, Core.makeRng(9));
console.log('城区  ', Object.entries(res.detail.city).sort((a, b) => b[1] - a[1])
  .map(([k, v]) => k + ' ' + v.toFixed(1) + '%').join('  '));
console.log('子市镇', Object.entries(res.detail.sub).sort((a, b) => b[1] - a[1])
  .map(([k, v]) => k + ' ' + v.toFixed(1) + '%').join('  '));
console.log('席位  ', JSON.stringify(res.seats));
const aut = ['AUT', 'PAD', 'PCR'].reduce((a, k) => a + (res.seats[k] || 0), 0);
const ann = ['LEG', 'ANI'].reduce((a, k) => a + (res.seats[k] || 0), 0);
console.log('自治派 ' + aut + ' / 兼并列 ' + ann + '   （史实 57 / 19）');
console.log('名单构成:', W.ELECTORAL_LISTS.map(L => L.id + '=[' + L.members.join('+') + ']').join('  '));
console.log('分裂名单:', W.SPLIT_LISTS.map(L => L.id + '=[' + L.members.join('+') + ']').join('  '));
