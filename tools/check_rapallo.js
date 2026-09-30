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

const F = globalThis.Fiume, R = F.Rules, Eng = F.Engine;
const s = Eng.createState('1919-09', 'historical', 7);
s.diplo = { italy: 40, yugoslavia: 40, uk: 40, france: 40, usa: 40, league: 40 };

const before = R.pressione(s);
s.flags.accept_rapallo = true;
const after = R.pressione(s);
console.log('外交压力  接受拉帕洛前 ' + before.toFixed(1) + '  →  接受后 ' + after.toFixed(1) +
  '   差 ' + (before - after).toFixed(1) + '（期望 10.0）');

const ok = Math.abs((before - after) - 10) < 0.01;
console.log(ok ? 'PASS  条约的缓和效果已生效' : 'FAIL  仍然不生效');
process.exit(ok ? 0 : 1);
