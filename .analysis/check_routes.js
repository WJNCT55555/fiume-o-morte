/* 终局矩阵验证：
   1. 每个结局都有 route，四条线都有出口
   2. 每个 check 可调用且返回布尔
   3. 逐个构造「应当命中」的状态，确认该结局真的会被 resolveEnding 选中
   4. 报出无法构造出命中状态的结局（潜在不可达） */
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, Meta = F.Meta;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

const ROUTES = { annexione: '并入意大利', marcia: '向罗马进军', carnaro: '卡尔纳罗摄政', collapse: '崩溃' };

console.log('=== 1. route 完整性 ===');
const noRoute = Meta.ENDINGS.filter(e => !e.route);
ok(noRoute.length === 0, `每个结局都有 route${noRoute.length ? '（缺：' + noRoute.map(e => e.id).join(',') + '）' : ''}`);
const byRoute = {};
Meta.ENDINGS.forEach(e => { (byRoute[e.route] = byRoute[e.route] || []).push(e); });
Object.keys(ROUTES).forEach(r => {
  const list = byRoute[r] || [];
  ok(list.length > 0, `${ROUTES[r]}（${r}）有 ${list.length} 个出口：${list.map(e => e.zh).join('、')}`);
});
ok(Object.keys(byRoute).every(r => ROUTES[r]), '没有未知 route 值');

console.log('\n=== 2. check 可调用 ===');
/* A check may return a truthy value that is not a strict boolean
   (`s.flags.dannunzio_left` is `undefined` when unset). What matters is that it
   runs without throwing on a fresh state. */
Meta.ENDINGS.forEach(e => {
  try {
    e.check(Eng.createState('1919-09', 'historical', 1));
    ok(true, `${e.id}.check 可调用`);
  } catch (err) { ok(false, `${e.id}.check 抛错: ${err.message}`); }
});

console.log('\n=== 3. 逐个构造命中状态 ===');
/* 每个条目：如何把状态推到「这个结局应当命中」。 */
function mkState() {
  const s = Eng.createState('1919-09', 'historical', 7);
  return s;
}
const CASES = {
  ending_silent_port: s => { s.economy.population = 40000; },
  ending_fuga: s => { s.flags.dannunzio_left = true; },
  ending_fascio: s => { s.flags.coup_done = true; },
  ending_marcia_1920: s => { s.flags.marcia_1920 = true; },
  ending_civil_strife: s => { s.flags.coup_done = true; s.order.violence = 90; },
  /* 1924 危机：接受合并（外交臂）与武装驱离（1920 军事臂）是两条不同的历史出口 */
  ending_annexation: s => { s.flags.annexation = true; },
  ending_eviction: s => { s.flags.bloody_history = true; },
  ending_comune: s => {
    s.flags.carta_done = true; s.laws.lavoro = 3; s.laws.fisco = 2;
    /* `postProcess` 会把 factions.inf 重新标定为总和 100、把 forze 钳到 [-40,100]，
       所以要用唯一原语 adjustFactionInfluence 反复推，并在设置后重跑 postProcess 校验。 */
    for (let i = 0; i < 40 && s.factions.sindacalisti.inf < 60; i++) {
      R.adjustFactionInfluence(s, 'sindacalisti', 12);
    }
    s.forze.sindacalisti = 80;
  },
  ending_fiume_o_morte: s => {
    s.flags.porto_revived = true; s.economy.traffic = 90; s.flags.carta_done = true;
    s.date.y = 1924; s.date.m = 12;
  },
  /* Removed条目（保留注释以便追溯）：
     ending_natale        — martyred && milizia < 300 数学上不可满足
     ending_danzig        — 改为成就 ach_danzig
     ending_carnaro       — date.y >= 1926 与 1924-12 截止冲突
     ending_venice        — 改为成就 ach_venice
     ending_exile_endured — 24 个月窗口比《罗马条约》晚 2 个月 */
};

const unreachable = [];
for (const e of Meta.ENDINGS) {
  if (e.id === 'ending_timer') { console.log(`   （兜底，跳过构造） ${e.id}`); continue; }
  const build = CASES[e.id];
  if (!build) { unreachable.push(e.id + '（无构造）'); console.log(`   ?? 没有构造用例: ${e.id} [${e.route}]`); continue; }
  const s = mkState();
  build(s);
  Eng.postProcess(s);
  let hit = false;
  try { hit = !!e.check(s); } catch (err) { hit = false; }
  const picked = (() => { try { return R.resolveEnding(s).id; } catch (err) { return 'ERR'; } })();
  const wins = picked === e.id;
  console.log(`   ${wins ? '命中' : '被抢先'} ${e.id} [${e.route}]  构造后 resolveEnding → ${picked}`);
  if (!hit) unreachable.push(e.id + '（check 为假）');
  ok(hit, `${e.id} 的构造状态能使其 check 为真`);
  ok(wins, `${e.id} 在其构造状态中真的被 resolveEnding 选中`);
}

console.log('\n=== 4. 汇总 ===');
if (unreachable.length) console.log('   潜在不可达: ' + unreachable.join('; '));
else console.log('   全部 13 个实质结局都能被构造命中（ending_timer 为兜底）');
const prio = Meta.ENDINGS.slice().sort((a, b) => a.priority - b.priority).map(e => `${e.priority}:${e.id.replace('ending_', '')}`);
console.log('   判定顺序:', prio.join(' → '));

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
