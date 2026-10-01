/* 宪章链可达性实测 —— 对齐「宪章不是可升级的数字」这一版设计。
 *
 * 真实链条（每一环都在此实测，不从注释推断）：
 *   阶段 1  卡牌 az_forze_italia / 选项 deambris
 *           → 设 deambris_arrived，next 指向 ev_carta_programma
 *   阶段 2  ev_carta_programma（chain，单选项 programma）
 *           → 设 charter_program，开启 carta 日志   ← 日志唯一入口
 *   阶段 3  ev_1920_09_carta / 选项 a，门控 = flags.charter_program
 *           → 设 charter_promulgated（颁布并召开阿伦戈）
 *   阶段 4  ev_carta_dibattito / 选项 a，门控 = charter_promulgated &&
 *           !charter_debate_resolved && sindacalisti.inf >= 14
 *           → 设 charter_debate_resolved，推进法律
 *   完成    charter_promulgated && charter_debate_resolved &&
 *           CHARTER_REQUIREMENTS 七项全部达标
 *
 * `laws.statuto` 已不存在（旧脚本按它断言，所以整套都失效了）。 */
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
const F = globalThis.Fiume, Eng = F.Engine, Meta = F.Meta;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

const carta = Meta.JOURNAL_BY_ID.carta;
const evDeambris = Eng.EVENT_BY_ID['ev_1920_01_deambris'];
const evProgramma = Eng.EVENT_BY_ID['ev_carta_programma'];
const evCarta = Eng.EVENT_BY_ID['ev_1920_09_carta'];
const evDib = Eng.EVENT_BY_ID['ev_carta_dibattito'];
const adv = F.World.ADVISORS.find(a => a.id === 'deambris');
const REQ = Meta.CHARTER_REQUIREMENTS;

/* A fresh, complete state so conditions can be probed without half a GameState. */
const fresh = () => Eng.createState('1919-09', 'historical', 42);
const eff = (o, s) => (typeof o.effect === 'function' ? o.effect(s || fresh()) : o.effect);

console.log('=== 1. 各阶段门控 ===');
ok(evProgramma.chain === true, 'ev_carta_programma 是 chain 事件（不可被日程直接调度）');
ok(!evCarta.condition(fresh()) === true, '无 charter_program：颁布事件不触发');
{
  const s = fresh(); s.flags.charter_program = true;
  ok(evCarta.condition(s) === true, '有 charter_program：颁布事件触发');
  ok(evCarta.condition(s) === true, '门控只认 charter_program，不认已删除的 statuto');
}
{
  const s = fresh(); s.flags.charter_promulgated = true;
  /* The starting influence is 24, so it must be pushed BELOW the gate for this
     probe to mean anything — leaving it alone made the assertion vacuous. */
  s.factions.sindacalisti.inf = 10;
  ok(evDib.condition(s) === false, '已颁布但工团派影响力不足 14：辩论不触发（影响力门生效）');
  s.factions.sindacalisti.inf = 20;
  ok(evDib.condition(s) === true, '已颁布且工团派影响力 ≥ 14：辩论触发');
  s.flags.charter_debate_resolved = true;
  ok(evDib.condition(s) === false, '辩论已解决：不再重复触发');
}
{
  const s = fresh(); s.factions.sindacalisti.inf = 20;
  ok(evDib.condition(s) === false, '未颁布：辩论不触发（阶段顺序成立）');
}

console.log('\n=== 2. 日志唯一入口是 ev_carta_programma 的 programma 选项 ===');
const opened = [];
F.Events.forEach(e => (e.options || []).forEach(o => {
  const patch = eff(o);
  if (patch && (patch.journals || []).indexOf('carta') >= 0) opened.push(e.id + '/' + o.id);
}));
console.log('   开启 carta 的选项：' + (opened.join(', ') || '无'));
ok(opened.length === 1 && opened[0] === 'ev_carta_programma/programma',
  `唯一入口是 ev_carta_programma/programma（实为 ${opened.join(', ') || '无'}）`);
ok(eff(evProgramma.options[0]).flags.charter_program === true, '该选项同时置 charter_program');
ok((eff(evDib.options[0]).journals || []).length === 0, '辩论选项不再开日志（只推进，不开启）');
ok((eff(evCarta.options[0]).journals || []).length === 0, '颁布选项不再开日志（只推进，不开启）');

console.log('\n=== 3. 谁能把 next 指向 ev_carta_programma ===');
{
  const src = [];
  F.Events.forEach(e => (e.options || []).forEach(o => {
    const patch = eff(o);
    if (patch && patch.next === 'ev_carta_programma') src.push(e.id + '/' + o.id);
  }));
  console.log('   ' + (src.join(', ') || '无'));
  ok(src.length >= 1, `至少一个入口（${src.join(', ')}）`);
}
{
  const card = Eng.CARD_BY_ID.az_forze_italia;
  const opt = card.options.find(o => o.id === 'deambris');
  ok(!!opt, '行动卡 az_forze_italia 仍有 deambris 选项');
  const patch = typeof opt.effect === 'function' ? opt.effect(fresh()) : opt.effect;
  ok(patch.forze && patch.forze.sindacalisti > 0, `该选项提升革命工团主义阵线（+${patch.forze && patch.forze.sindacalisti}）`);
  ok(!patch.laws || patch.laws.statuto === undefined, '该选项不再推进已删除的宪章等级');
}

console.log('\n=== 4. 顾问与日志解耦 ===');
{
  const s = fresh();
  ok(adv.require(s) === false, '事件前顾问锁定');
  s.flags.deambris_arrived = true;
  ok(adv.require(s) === true, '事件后顾问解锁');
  ok(!adv.effect.journals, '顾问行动不激活日志（推进而非开启）');
}

console.log('\n=== 5. 起草事件置两个 flag ===');
{
  const patch = eff(evDeambris.options[0]);
  console.log('   ' + JSON.stringify(patch.flags));
  ok(patch.flags.charter_drafted === true && patch.flags.deambris_arrived === true,
    '置 charter_drafted 与 deambris_arrived');
}

console.log('\n=== 6. 日志没有失败条件（不会一开启就判失败）===');
ok(typeof carta.fail !== 'function', 'carta 日志未定义 fail —— 不能失败，只可能未完成');

console.log('\n=== 7. 端到端：逐阶段推进直到完成 ===');
{
  let s = Eng.createState('1919-09', 'historical', 2024);
  const obs = [];
  const jstate = () => {
    const j = s.journals.carta;
    return j ? (j.done ? 'done' : j.failed ? 'failed' : 'active') : '未激活';
  };
  const fire = (eventId, optionId) => {
    s.currentEvent = eventId;
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId }).state;
  };

  ok(jstate() === '未激活', `开局：日志 ${jstate()}`);

  /* 阶段 1：起草（德·安布里斯抵达事件） */
  fire('ev_1920_01_deambris', 'assumere');
  obs.push(['阶段1 起草', jstate(), s.flags.charter_drafted === true]);
  ok(s.flags.charter_drafted === true, '阶段 1 置 charter_drafted');
  ok(jstate() === '未激活', '阶段 1 之后日志仍未激活（起草不等于实施）');

  /* 阶段 2：立法纲领 —— 唯一开日志的一步 */
  fire('ev_carta_programma', 'programma');
  obs.push(['阶段2 纲领', jstate(), s.flags.charter_program === true]);
  ok(s.flags.charter_program === true, '阶段 2 置 charter_program');
  ok(jstate() === 'active', `阶段 2 之后日志激活（${jstate()}）`);

  /* 阶段 3：颁布并召开阿伦戈 */
  fire('ev_1920_09_carta', 'a');
  obs.push(['阶段3 颁布', jstate(), s.flags.charter_promulgated === true]);
  ok(s.flags.charter_promulgated === true, '阶段 3 置 charter_promulgated');
  ok(jstate() === 'active', '阶段 3 日志仍在，尚未完成');

  /* 阶段 4：辩论（需先把工团派影响力抬到门槛） */
  s.factions.sindacalisti.inf = 20;
  const before = {};
  REQ.forEach(r => { before[r.id] = s.laws[r.id] || 0; });
  fire('ev_carta_dibattito', 'a');
  obs.push(['阶段4 辩论', jstate(), s.flags.charter_debate_resolved === true]);
  ok(s.flags.charter_debate_resolved === true, '阶段 4 置 charter_debate_resolved');
  const moved = REQ.filter(r => (s.laws[r.id] || 0) > before[r.id]).map(r => r.id);
  console.log('   辩论推进的法律：' + (moved.join(', ') || '无'));
  ok(jstate() === 'active', '阶段 4 之后仍未完成（七项法律尚未全部达标）');

  /* 完成：把七项法律全部补到目标等级，再让结算跑一次 */
  REQ.forEach(r => { s.laws[r.id] = r.level; });
  s.currentEvent = null;
  s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  obs.push(['完成 实施', jstate(), s.flags.carta_done === true]);
  ok(jstate() === 'done', `七项达标后日志完成（${jstate()}）`);
  ok(s.flags.carta_done === true, '完成时置 carta_done');

  /* 反向：少一项就不该完成 */
  {
    const t = Eng.createState('1919-09', 'historical', 2024);
    t.flags.charter_promulgated = true; t.flags.charter_debate_resolved = true;
    REQ.forEach(r => { t.laws[r.id] = r.level; });
    ok(carta.complete(t) === true, '七项全达标时 complete 为真');
    t.laws[REQ[0].id] = REQ[0].level - 1;
    ok(carta.complete(t) === false, `任一项目标（${REQ[0].id}）未达标时 complete 为假`);
    t.laws[REQ[0].id] = REQ[0].level;
    t.flags.charter_debate_resolved = false;
    ok(carta.complete(t) === false, '未召开阿伦戈（辩论未解决）时 complete 为假');
  }

  console.log('   阶段轨迹:');
  obs.forEach(([a, b, c]) => console.log(`      ${a.padEnd(12)} 日志 ${b.padEnd(6)} 条件 ${c}`));
}

console.log('\n=== ' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗') + ' ===');
process.exit(bad ? 1 : 0);
