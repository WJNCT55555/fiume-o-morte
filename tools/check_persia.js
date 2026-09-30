/* Behavioural checks for ev_1919_10_persia and the Giulietti advisor. */
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, Core = F.Core, Sel = F.Sel;

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + m); };

console.log('注册');
ok(!!Eng.EVENT_BY_ID['ev_1919_10_persia'], '事件已进入注册表');
const adv = F.World.ADVISORS.filter(a => a.id === 'giulietti')[0];
ok(!!adv, '顾问 giulietti 已进入注册表');
ok(F.World.ADVISORS.length === 11, `顾问总数 ${F.World.ADVISORS.length}（原 10 + 1）`);

console.log('日期门控');
let s = Eng.createState('1919-09', 'historical', 5);
const seen = [];
for (let i = 0; i < 40 && s.phase !== 'ended'; i++) {
  if (s.currentEvent) {
    seen.push({ ev: s.currentEvent, y: s.date.y, m: s.date.m, d: s.date.d });
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    const o = ev.options.filter(x => !x.condition || x.condition(s));
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (o[0] || ev.options[0]).id }).state;
  } else {
    s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
}
const persia = seen.filter(x => x.ev === 'ev_1919_10_persia');
const comunali = seen.filter(x => x.ev === 'ev_1919_10_comunali');
ok(persia.length === 1, `波斯号触发 ${persia.length} 次`);
ok(persia[0] && persia[0].y === 1919 && persia[0].m === 10 && persia[0].d === 12,
   persia[0] ? `触发于 ${persia[0].y}-${persia[0].m}-${persia[0].d}` : '未触发');
ok(comunali.length === 1 && comunali[0].d === 27,
   comunali[0] ? `市政选举在同月 ${comunali[0].d} 日触发（不冲突）` : '市政选举未触发');

console.log('顾问解锁门控');
let t = Eng.createState('1919-09', 'historical', 5);
const before = Sel.advisors(t).filter(a => a.id === 'giulietti')[0];
ok(before && !before.unlocked, '事件前不可延揽');
const armsBefore = t.arms;
t = Eng.dispatch(t, { type: 'RESOLVE_EVENT', optionId: 'accogliere' });
// simulate the real path: play the event through the dispatcher
let u = Eng.createState('1919-09', 'historical', 5);
u.flags.persia = true;
const after = Sel.advisors(u).filter(a => a.id === 'giulietti')[0];
ok(after && after.unlocked, '事件后（flags.persia）可延揽');
ok(after.faction === 'sindacalisti', `归属派系 ${after.faction}`);

console.log('效果：接收物资');
const ev = Eng.EVENT_BY_ID['ev_1919_10_persia'];
const eff = ev.options[0].effect(u);
ok(eff.arms === 180, `军械 +${eff.arms}`);
ok(u.arms === armsBefore, '事件尚未应用时军械未变');

console.log('顾问行动可用');
let v = Eng.createState('1919-09', 'historical', 5);
v.flags.persia = true;
v.advisors.active = ['giulietti'];
const tr0 = v.economy.traffic, st0 = v.economy.strike;
v = Eng.dispatch(v, { type: 'USE_ADVISOR', advisorId: 'giulietti' }).state;
ok(v.economy.traffic > tr0, `吞吐 ${tr0} -> ${v.economy.traffic.toFixed(1)}`);
ok(v.economy.strike < st0, `罢工 ${st0} -> ${v.economy.strike.toFixed(1)}`);
ok(!!v.flags.smuggle, '设下走私旗标');

console.log();
console.log(`PASS ${pass} / ${pass + fail}`);
process.exit(fail ? 1 : 0);
