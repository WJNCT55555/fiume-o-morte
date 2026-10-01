/* az_forze_italia 校验：加载、选项、效果键、条件、对抗、守恒 */
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
const F = globalThis.Fiume, Eng = F.Engine, W = F.World, Core = F.Core;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

const card = Eng.CARD_BY_ID['az_forze_italia'];
const EXPECT = ['fascisti', 'anarchici', 'socialisti', 'comunisti', 'deambris', 'corradini', 'nulla'];

console.log('=== 1. 结构与双语 ===');
ok(!!card, 'Eng.CARD_BY_ID 能检索到 az_forze_italia');
ok(card.deck === 'azione', `deck = ${card.deck}`);
ok(!card.ministry, '行动卡不带 ministry');
ok(!card.forces, '不带 forces（否则自治党/社会党无法打出）');
ok(card.cost && card.cost.ap === 1, `AP = ${card.cost && card.cost.ap}`);
ok(!!card.name.zh && !!card.name.it, 'name 双语');
ok(!!card.text.zh && !!card.text.it, 'text 双语');
ok(card.cooldown === 6, `cooldown = ${card.cooldown}（进军线核心，6 档）`);
ok(card.options.length === EXPECT.length, `选项数 ${card.options.length}`);
ok(card.options.map(o => o.id).join(',') === EXPECT.join(','), `选项顺序 ${card.options.map(o => o.id).join(',')}`);
card.options.forEach(o => {
  ok(!!o.text.zh && !!o.text.it, `${o.id}: text 双语`);
  ok(!!o.subtitle && !!o.subtitle.zh && !!o.subtitle.it, `${o.id}: subtitle 双语`);
  ok(Array.isArray(o.preview) && o.preview.length >= 2, `${o.id}: preview ${o.preview.length} 条`);
  ok(!!o.effect, `${o.id}: 有效果`);
});

console.log('\n=== 2. forze 表已改为运动名 ===');
ok(W.FORZE.map(f => f.id).join(',') === 'fascisti,socialisti,anarchici,comunisti,corradini,sindacalisti,forzearmate',
  `W.FORZE = ${W.FORZE.map(f => f.zh).join(' / ')}`);
ok(!W.FORZA_BY_ID.mussolini && !W.FORZA_BY_ID.malatesta, '旧人物 id 已移除');
ok(W.FORZA_FRONT.join(',') === 'fascisti,socialisti,anarchici,comunisti,corradini,sindacalisti',
  `W.FORZA_FRONT = ${W.FORZA_FRONT.join(',')}（六股）`);
ok(W.FORZA_FRONT_NEEDED === 3, `W.FORZA_FRONT_NEEDED = ${W.FORZA_FRONT_NEEDED}（六选三）`);

console.log('\n=== 3. 键合法性 ===');
const CLS = W.CLASSES.map(c => c.id), FAC = W.FACTIONS.map(f => f.id);
const FORZE = W.FORZE.map(f => f.id), PARTIES = W.PARTIES.map(p => p.id);
card.options.forEach(o => {
  const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
  Object.keys(e.forze || {}).forEach(k => ok(FORZE.includes(k), `${o.id}: forze.${k} 合法`));
  Object.keys(e.factions || {}).forEach(k => ok(FAC.includes(k), `${o.id}: factions.${k} 合法`));
  Object.keys(e.laws || {}).forEach(k => ok(W.LAWS.some(L => L.id === k), `${o.id}: laws.${k} 合法`));
  (e.support || []).forEach(t => {
    ok(CLS.includes(t[0]), `${o.id}: 阶层 ${t[0]} 合法`);
    ok(PARTIES.includes(t[1]), `${o.id}: 政党 ${t[1]} 合法`);
  });
  (e.relations || []).forEach(t => ok(PARTIES.includes(t[0]) && PARTIES.includes(t[1]), `${o.id}: 关系对 ${t[0]}|${t[1]} 合法`));
});

/* Play the card the way the UI does: draw into a reserved slot, then play it,
   then answer the menu. PLAY_CARD silently no-ops when the card is not in hand.
   `pre` lets a probe satisfy an option's own gate (the communist door only opens
   after Livorno, which the January 1921 founding event sets). */
function playOption(seed, optionId, pre) {
  let s = Eng.createState('1919-09', 'historical', seed);
  if (pre) Object.assign(s.flags, pre);
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId }).state;
  return s;
}

/* Options whose own `require` needs a flag satisfied before they can be played. */
const PRE = { comunisti: { comintern_door: true } };

console.log('\n=== 4. 效果真实生效（逐一实打） ===');
for (const o of card.options) {
  const b0 = Eng.createState('1919-09', 'historical', 42);
  const b = {
    fascisti: b0.forze.fascisti, socialisti: b0.forze.socialisti,
    anarchici: b0.forze.anarchici, comunisti: b0.forze.comunisti,
    forzearmate: b0.forze.forzearmate,
    fasInf: b0.factions.fascisti.inf, sinInf: b0.factions.sindacalisti.inf,
    irrDis: b0.factions.irredentisti.dis, italy: b0.diplo.italy,
    soviet: b0.diplo.soviet || 0, psif: b0.relations.LEG.PSI
  };
  const s = playOption(42, o.id, PRE[o.id]);
  console.log(`   ${o.id.padEnd(11)} 法${(s.forze.fascisti - b.fascisti).toFixed(1).padStart(6)}`
    + ` 社${(s.forze.socialisti - b.socialisti).toFixed(1).padStart(6)}`
    + ` 无${(s.forze.anarchici - b.anarchici).toFixed(1).padStart(6)}`
    + ` 共${(s.forze.comunisti - b.comunisti).toFixed(1).padStart(6)}`
    + ` 军${(s.forze.forzearmate - b.forzearmate).toFixed(1).padStart(6)}`
    + ` | 法派inf ${(s.factions.fascisti.inf - b.fasInf).toFixed(1)}`
    + ` 工派inf ${(s.factions.sindacalisti.inf - b.sinInf).toFixed(1)}`
    + ` 收异 ${(s.factions.irredentisti.dis - b.irrDis).toFixed(0)}`
    + ` 意 ${(s.diplo.italy - b.italy).toFixed(0)}`
    + ` 苏 ${((s.diplo.soviet || 0) - b.soviet).toFixed(0)}`
    + ` PSI ${(s.relations.LEG.PSI - b.psif).toFixed(0)}`);
  ok(s.funds >= 0 && s.ap >= 0, `${o.id}: 状态合法`);
}

console.log('\n=== 5. 每个选项都改变了状态 ===');
for (const o of card.options) {
  const s0 = Eng.createState('1919-09', 'historical', 42);
  const s1 = playOption(42, o.id, PRE[o.id]);
  const changed = JSON.stringify(s0.forze) !== JSON.stringify(s1.forze)
    || JSON.stringify(s0.factions) !== JSON.stringify(s1.factions)
    || JSON.stringify(s0.diplo) !== JSON.stringify(s1.diplo)
    || JSON.stringify(s0.laws) !== JSON.stringify(s1.laws)
    || s0.order.fervour !== s1.order.fervour;
  ok(changed, `${o.id}: 改变了状态`);
}

console.log('\n=== 6. 条件门 ===');
const soc = card.options.find(o => o.id === 'socialisti');
const com = card.options.find(o => o.id === 'comunisti');
const dea = card.options.find(o => o.id === 'deambris');
const t = () => Eng.createState('1919-09', 'historical', 1);
ok(soc.require(t()) === true, '社会党门：分裂前可用');
let s1 = t(); s1.flags.psi_split_from_pcdi = true;
ok(soc.require(s1) === false, '社会党门：里窝那分裂后关闭');
let s2 = t(); s2.flags.bombacci_rebuffed = true;
ok(soc.require(s2) === false, '社会党门：邦巴奇被拒后关闭');
ok(com.require(t()) === false, '共产党门：建党前关闭');
let s3 = t(); s3.flags.comintern_door = true;
ok(com.require(s3) === true, '共产党门：里窝那之后开启');
ok(dea.require(t()) === true, '德·安布里斯门：工团派影响力足够时可用');
let s4 = t(); s4.factions.sindacalisti.inf = 5;
ok(dea.require(s4) === false, '德·安布里斯门：工团派影响力不足时关闭');
const shown = Eng.cardOptions(t(), card).find(o => o.id === 'comunisti');
ok(shown.enabled === false && !!shown.reason && !!shown.reason.zh, 'UI 会显示具体原因');
console.log('   共产党门原因:', shown.reason && shown.reason.zh);

console.log('\n=== 7. 对抗自动生效（拉一派必推一派） ===');
const b0 = Eng.createState('1919-09', 'historical', 42);
const sF = playOption(42, 'fascisti');
ok(sF.forze.comunisti < b0.forze.comunisti, `联络法西斯后共产党下降（${b0.forze.comunisti} → ${sF.forze.comunisti.toFixed(1)}）`);
const sA = playOption(42, 'anarchici');
ok(sA.forze.forzearmate < b0.forze.forzearmate, `接触无政府主义者后军官团下降（${b0.forze.forzearmate} → ${sA.forze.forzearmate.toFixed(1)}）`);
let s5 = Eng.createState('1919-09', 'historical', 42);
s5.flags.comintern_door = true;
s5 = Eng.dispatch(s5, { type: 'DRAW_CARD', cardId: card.id }).state;
s5 = Eng.dispatch(s5, { type: 'PLAY_CARD', cardId: card.id }).state;
s5 = Eng.dispatch(s5, { type: 'RESOLVE_CARD_OPTION', optionId: 'comunisti' }).state;
ok(s5.forze.fascisti < b0.forze.fascisti, `接触共产党后法西斯下降（${b0.forze.fascisti} → ${s5.forze.fascisti.toFixed(1)}）`);

console.log('\n=== 8. 守恒不变量 ===');
const s6 = playOption(7, 'deambris');
const infSum = W.FACTIONS.reduce((a, f) => a + s6.factions[f.id].inf, 0);
ok(Math.abs(infSum - 100) < 0.6, `派系影响力合计 ${infSum.toFixed(2)}`);
W.CLASSES.forEach(c => {
  const sum = Core.sum(s6.classes[c.id].support);
  ok(Math.abs(sum - 100) < 0.6, `${c.zh} 支持行和 ${sum.toFixed(2)}`);
});

console.log('\n=== ' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗') + ' ===');
process.exit(bad ? 1 : 0);
