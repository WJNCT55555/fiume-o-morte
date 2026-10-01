/* az_propaganda 校验：结构、双语、成本、零和，以及新机制 openCard 的跳转。 */
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
const F = globalThis.Fiume, Eng = F.Engine, W = F.World;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
const near = (a, b, e) => Math.abs(a - b) <= (e == null ? 1e-6 : e);

const card = Eng.CARD_BY_ID['az_propaganda'];
const EXPECT = ['rete_privata', 'volantinaggio', 'testa_di_ferro', 'canali_diplomatici', 'reclutamento', 'chiudere'];
const CLS = W.CLASSES.map(c => c.id), FAC = W.FACTIONS.map(f => f.id), PARTIES = W.PARTIES.map(p => p.id);
const ORDER = ['authority', 'garrison', 'fervour', 'squadre', 'violence', 'coup', 'subversion',
  'milizia', 'civicGuard', 'police', 'legionari', 'carabinieri', 'garrisonTroops'];

function play(optionId, seed, pre) {
  let s = Eng.createState('1919-09', 'historical', seed == null ? 42 : seed);
  if (pre) pre(s);
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId }).state;
  return s;
}

console.log('=== 1. 结构与双语 ===');
ok(!!card, 'CARD_BY_ID 能检索到 az_propaganda');
ok(card.deck === 'azione', `deck = ${card.deck}`);
ok(!card.forces && !card.ministry, '不带 forces / ministry');
ok(card.cost && card.cost.ap === 1, `AP = ${card.cost && card.cost.ap}`);
ok(card.cooldown === 4, `cooldown = ${card.cooldown}（常规手段，4 档）`);
ok(!!card.name.zh && !!card.name.it, 'name 双语');
ok(!!card.text.zh && !!card.text.it, 'text 双语');
ok(card.options.length === 6, `选项数 ${card.options.length}`);
ok(card.options.map(o => o.id).join(',') === EXPECT.join(','), '选项顺序正确');
card.options.forEach(o => {
  ok(!!o.text.zh && !!o.text.it, `${o.id}: text 双语`);
  ok(!!o.subtitle && !!o.subtitle.zh && !!o.subtitle.it, `${o.id}: subtitle 双语`);
  ok(Array.isArray(o.preview) && o.preview.length >= 2, `${o.id}: preview ${o.preview.length} 条`);
});

console.log('\n=== 2. 键合法性 ===');
card.options.forEach(o => {
  const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
  Object.keys(e.factions || {}).forEach(k => ok(FAC.includes(k), `${o.id}: factions.${k} 合法`));
  if (e.factions) Object.keys(e.factions).forEach(k =>
    Object.keys(e.factions[k]).forEach(x => ok(['inf', 'dis'].includes(x), `${o.id}: factions.${k}.${x} 合法`)));
  Object.keys(e.order || {}).forEach(k => ok(ORDER.includes(k), `${o.id}: order.${k} 合法`));
  ok(e.legitimacy === undefined, `${o.id}: 不写派生值`);
  ok(!e.journals, `${o.id}: 不激活日志`);
  (e.support || []).forEach(t => {
    ok(CLS.includes(t[0]), `${o.id}: 阶层 ${t[0]} 合法`);
    ok(PARTIES.includes(t[1]), `${o.id}: 政党 ${t[1]} 合法`);
  });
});

console.log('\n=== 3. 成本：五个实质选项各 −1，关闭免费 ===');
{
  const EXPECT_COST = {
    rete_privata: -1, volantinaggio: -1, testa_di_ferro: -1,
    canali_diplomatici: -1, reclutamento: -1, chiudere: 0
  };
  card.options.forEach(o => {
    const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
    const c = e.funds || 0;
    ok(c === EXPECT_COST[o.id], `${o.id}: 金库 ${c}（期望 ${EXPECT_COST[o.id]}）`);
  });
  const b = Eng.createState('1919-09', 'historical', 42);
  const s = play('volantinaggio');
  ok(near(s.funds - b.funds, -1), `端到端：空投扣款 1（实为 ${s.funds - b.funds}）`);
  const s2 = play('chiudere');
  ok(near(s2.funds - b.funds, 0), `关闭宣传机器不花钱（实为 ${s2.funds - b.funds}）`);
}

console.log('\n=== 4. 效果实打 ===');
{
  const b = Eng.createState('1919-09', 'historical', 42);
  const v = play('volantinaggio');
  ok(near(v.order.fervour - b.order.fervour, 6), `空投：热忱 +6（实为 ${v.order.fervour - b.order.fervour}）`);
  ok(near(v.order.authority - b.order.authority, 3), `空投：权威 +3（实为 ${v.order.authority - b.order.authority}）`);
  const t = play('testa_di_ferro');
  /* Influence is a zero-sum SHARE, and a patch that moves several factions is
     settled as ONE batch (R.batchFactionInfluence): the gains come out of the
     donors only, so each target receives exactly what was written. Before the
     batch existed this came out +4.09 / +1.41, because the first transfer ate
     into the second one's target. */
  const dFut = t.factions.futuristi.inf - b.factions.futuristi.inf;
  const dArd = t.factions.arditi.inf - b.factions.arditi.inf;
  console.log(`   《铁头》实际：未来主义 ${dFut.toFixed(2)}（写 5）／阿迪蒂 ${dArd.toFixed(2)}（写 3）`);
  ok(near(dFut, 5), `未来主义精确 +5（实际 ${dFut.toFixed(2)}）`);
  ok(near(dArd, 3), `阿迪蒂精确 +3（实际 ${dArd.toFixed(2)}）`);
  const r = play('reclutamento');
  ok(near(r.order.milizia - b.order.milizia, 450), `征兵宣传：兵力 +450（实为 ${r.order.milizia - b.order.milizia}）`);
  const dFas = r.factions.fascisti.inf - b.factions.fascisti.inf;
  console.log(`   征兵宣传实际：法西斯派影响力 ${dFas.toFixed(2)}（写 3）`);
  ok(near(dFas, 3), `征兵宣传：法西斯派影响力精确 +3（实际 ${dFas.toFixed(2)}）`);
  ok(near(r.factions.fascisti.dis - b.factions.fascisti.dis, -5), `征兵宣传：法西斯派异议 −5（实为 ${r.factions.fascisti.dis - b.factions.fascisti.dis}）`);
  const c = play('chiudere');
  ok(JSON.stringify(c.order) === JSON.stringify(b.order), '关闭宣传机器：order 无变化');
}

console.log('\n=== 5. openCard 跳转机制 ===');
{
  /* 选项 1 → az_forze_italia */
  let s = Eng.createState('1919-09', 'historical', 42);
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  ok(s.pendingCard === 'az_propaganda', `打出后 pendingCard = ${s.pendingCard}`);
  const r = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'rete_privata' });
  s = r.state;
  console.log(`   选择「私人网络」后 pendingCard = ${s.pendingCard}`);
  ok(s.pendingCard === 'az_forze_italia', '跳转到 az_forze_italia');
  ok(s.hand.indexOf(card.id) < 0, '原卡已弃掉');
  /* 现在应当能解析目标卡的选项 */
  const opts = Eng.cardOptions(s, Eng.CARD_BY_ID['az_forze_italia']);
  ok(opts.length > 0, `目标卡选项可解析（${opts.length} 个）`);
  ok(opts.some(o => o.enabled), '目标卡至少有一个可用选项');
  const before = s.order.fervour;
  const r2 = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: opts.filter(o => o.enabled)[0].id });
  ok(r2.state !== s, '目标卡的选项可正常结算（跳转后菜单是活的）');
  ok(r2.state.pendingCard == null, '结算后 pendingCard 清空');
  console.log(`   目标卡结算后 pendingCard = ${r2.state.pendingCard}`);
}
{
  /* 选项 4 → az_fiume_league */
  const s = play('canali_diplomatici');
  ok(s.pendingCard === 'az_fiume_league', `「外交渠道」跳转到 az_fiume_league（实为 ${s.pendingCard}）`);
}
{
  /* 跳转无视目标卡冷却 */
  let s = Eng.createState('1919-09', 'historical', 42);
  /* 先把目标卡打到冷却里 */
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: 'az_forze_italia' }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: 'az_forze_italia' }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'fascisti' }).state;
  const cd = s.eventCooldowns['c_az_forze_italia'];
  ok(cd > s.monthIndex, `目标卡已在冷却中（${cd} > ${s.monthIndex}）`);
  const blocked = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: 'az_forze_italia' });
  ok(blocked.state === s, '冷却期内无法正常抽取该卡');
  /* 但跳转仍应打开它 */
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'rete_privata' }).state;
  ok(s.pendingCard === 'az_forze_italia', '跳转无视冷却，仍打开目标卡');
}
{
  /* 跳转不重复扣 AP：目标卡的 AP 不被收取 */
  let s = Eng.createState('1919-09', 'historical', 42);
  const ap0 = s.ap;
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'rete_privata' }).state;
  const apAfterJump = s.ap;
  ok(near(ap0 - apAfterJump, 1), `跳转只花了宣传攻势的 1 AP（${ap0} → ${apAfterJump}）`);
}
{
  /* 目标卡自身选项的门仍然生效 */
  let s = Eng.createState('1919-09', 'historical', 42);
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'rete_privata' }).state;
  const comunisti = Eng.cardOptions(s, Eng.CARD_BY_ID['az_forze_italia']).find(o => o.id === 'comunisti');
  console.log(`   目标卡的「共产党」选项：enabled=${comunisti.enabled}`);
  ok(comunisti.enabled === false, '意共未成立时，跳转过去也无法选共产党（目标卡自己的门仍生效）');
}

console.log('\n=== 6. 零和与守恒 ===');
card.options.forEach(o => {
  const s = play(o.id);
  ok(near(W.FACTIONS.reduce((a, f) => a + s.factions[f.id].inf, 0), 100), `${o.id}: 派系合计 100`);
});

console.log('\n=== 7. 软锁 ===');
{
  const worst = Eng.createState('1919-09', 'historical', 1);
  worst.order.authority = 0;
  Object.keys(worst.factions).forEach(k => { worst.factions[k].inf = 1; worst.factions[k].dis = 100; });
  const avail = Eng.cardOptions(worst, card).filter(o => o.enabled);
  console.log('   最坏状态可用选项:', avail.map(o => o.id).join(','));
  ok(avail.length === 6, '六个选项全部无条件');
}

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
