const path = require('path');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));
require.extensions['.ts'] = (module, filename) => {
  const src = require('fs').readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const base = path.join(__dirname, '..', 'src');
require(path.join(base, 'lib', 'core.js'));
require(path.join(base, 'game', 'data', 'world.js'));
require(path.join(base, 'game', 'data', 'parties.js'));
require(path.join(base, 'game', 'data', 'factions.js'));
require(path.join(base, 'game', 'data', 'meta.js'));
require(path.join(base, 'game', 'engine', 'rules.js'));
require(path.join(base, 'game', 'registries', 'contentRegistry.ts'));
require(path.join(base, 'game', 'engine', 'reducers.js'));
require(path.join(base, 'game', 'engine', 'selectors.js'));

const F = globalThis.Fiume, Eng = F.Engine;
const s = Eng.createState('1919-09', 'historical', 7);
s.diplo = { italy: 40, yugoslavia: 40, uk: 40, france: 40, usa: 40, league: 40 };
s.currentEvent = 'ev_1920_11_rapallo';
const before = { coup: s.order.coup, italy: s.diplo.italy };
const after = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: 'cedere' }).state;
const ok = after.flags.accept_rapallo && after.order.coup < before.coup &&
  after.diplo.italy > before.italy && after.laws.elettorale >= 1 && !('statuto' in after.laws);
console.log(ok ? 'PASS  接受条约降低围攻、改善意大利关系并推进选举法' : 'FAIL  条约效果未完整生效');
process.exit(ok ? 0 : 1);
