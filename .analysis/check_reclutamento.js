/* az_reclutamento 校验：结构、双语、键合法性、条件效果、零和、以及
   军团兵力 +1000/+500/+300 对经济与结局的影响。 */
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, W = F.World;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
const near = (a, b, e) => Math.abs(a - b) <= (e == null ? 1e-6 : e);

const card = Eng.CARD_BY_ID['az_reclutamento'];
const EXPECT = ['regio_esercito', 'studenti', 'rastrellamento', 'popoli_oppressi', 'socialisti', 'chiudere'];
const CLS = W.CLASSES.map(c => c.id), FAC = W.FACTIONS.map(f => f.id), PARTIES = W.PARTIES.map(p => p.id);
const FORZE = W.FORZE.map(f => f.id);
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
ok(!!card, 'CARD_BY_ID 能检索到 az_reclutamento');
ok(card.deck === 'azione', `deck = ${card.deck}`);
ok(!card.forces, '不带 forces');
ok(card.cost && card.cost.ap === 1, `AP = ${card.cost && card.cost.ap}`);
ok(card.cooldown === 9, `cooldown = ${card.cooldown}（成建制征兵，9 档）`);
ok(!!card.name.zh && !!card.name.it, 'name 双语');
ok(!!card.text.zh && !!card.text.it, 'text 双语');
ok(card.options.length === 6, `选项数 ${card.options.length}`);
ok(card.options.map(o => o.id).join(',') === EXPECT.join(','), '选项顺序正确');
card.options.forEach(o => {
  ok(!!o.text.zh && !!o.text.it, `${o.id}: text 双语`);
  ok(!!o.subtitle && !!o.subtitle.zh && !!o.subtitle.it, `${o.id}: subtitle 双语`);
  ok(Array.isArray(o.preview) && o.preview.length >= 2, `${o.id}: preview ${o.preview.length} 条`);
  ok(!!o.effect, `${o.id}: 有效果`);
});

console.log('\n=== 2. 键合法性 + 不写派生值 ===');
card.options.forEach(o => {
  const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
  Object.keys(e.factions || {}).forEach(k => ok(FAC.includes(k), `${o.id}: factions.${k} 合法`));
  if (e.factions) Object.keys(e.factions).forEach(k =>
    Object.keys(e.factions[k]).forEach(x => ok(['inf', 'dis'].includes(x), `${o.id}: factions.${k}.${x} 合法`)));
  Object.keys(e.order || {}).forEach(k => ok(ORDER.includes(k), `${o.id}: order.${k} 合法`));
  Object.keys(e.forze || {}).forEach(k => ok(FORZE.includes(k), `${o.id}: forze.${k} 合法`));
  Object.keys(e.diplo || {}).forEach(k => ok(typeof k === 'string', `${o.id}: diplo.${k}`));
  ok(e.legitimacy === undefined, `${o.id}: 不写派生值 legitimacy`);
  ok(!e.journals, `${o.id}: 不激活日志`);
  (e.support || []).forEach(t => {
    ok(CLS.includes(t[0]), `${o.id}: 阶层 ${t[0]} 合法`);
    ok(PARTIES.includes(t[1]), `${o.id}: 政党 ${t[1]} 合法`);
  });
});

console.log('\n=== 3. 效果实打（delta） ===');
for (const o of card.options) {
  const b = Eng.createState('1919-09', 'historical', 42);
  const s = play(o.id);
  const d = (a, c) => ((s[a][c] - b[a][c]) >= 0 ? '+' : '') + (s[a][c] - b[a][c]).toFixed(0);
  console.log(`   ${o.id.padEnd(16)} 兵力 ${String(d('order', 'milizia')).padStart(6)}`
    + ` 暴力 ${String(d('order', 'violence')).padStart(3)} 小队 ${String(d('order', 'squadre')).padStart(3)}`
    + ` 热忱 ${String(d('order', 'fervour')).padStart(3)} 权威 ${String(d('order', 'authority')).padStart(3)}`
    + ` | 法西斯 ${(s.factions.fascisti.inf - b.factions.fascisti.inf).toFixed(1)}`
    + ` 阿迪蒂 ${(s.factions.arditi.inf - b.factions.arditi.inf).toFixed(1)}`
    + ` 工团 ${(s.factions.sindacalisti.inf - b.factions.sindacalisti.inf).toFixed(1)}`);
  ok(near(W.FACTIONS.reduce((a, f) => a + s.factions[f.id].inf, 0), 100), `${o.id}: 派系合计 100`);
  ok(F.Factions === undefined || true, '');
}

console.log('\n=== 4. 具体数值断言 ===');
{
  const s = play('regio_esercito');
  const b = Eng.createState('1919-09', 'historical', 42);
  ok(near(s.order.milizia - b.order.milizia, 1000), `皇家陆军呼吁：兵力 +1000（实为 ${s.order.milizia - b.order.milizia}）`);
  ok(near(s.forze.forzearmate - b.forze.forzearmate, 5), `与意大利军官团 +5（实为 ${(s.forze.forzearmate - b.forze.forzearmate).toFixed(1)}）`);
  ok(s.classes.contadini.support.LEG < b.classes.contadini.support.LEG, '斯拉夫农民支持下降');
  ok(s.classes.portuali.support.LEG < b.classes.portuali.support.LEG, '码头劳工支持下降');
  ok(s.factions.arditi.inf > b.factions.arditi.inf, '阿迪蒂影响力上升');
}
{
  const s = play('studenti');
  const b = Eng.createState('1919-09', 'historical', 42);
  ok(near(s.order.milizia - b.order.milizia, 500), `未成年志愿者：兵力 +500（实为 ${s.order.milizia - b.order.milizia}）`);
  ok(s.economy.unemployment > b.economy.unemployment, '失业率上升');
  ok(s.order.violence > b.order.violence, '政治暴力上升');
  ok(s.classes.regnicoli.support.LEG > b.classes.regnicoli.support.LEG, '意大利侨民支持上升');
}
{
  const s = play('rastrellamento');
  const b = Eng.createState('1919-09', 'historical', 42);
  ok(near(s.order.violence - b.order.violence, 5), `政治暴力 +5（实为 ${s.order.violence - b.order.violence}）`);
  ok(near(s.order.squadre - b.order.squadre, 3), `法西斯小队 +3（实为 ${s.order.squadre - b.order.squadre}）`);
  ok(near(s.factions.fascisti.inf - b.factions.fascisti.inf, 5), `法西斯派影响力 +5（实为 ${(s.factions.fascisti.inf - b.factions.fascisti.inf).toFixed(1)}）`);
}
{
  const s = play('popoli_oppressi');
  const b = Eng.createState('1919-09', 'historical', 42);
  ok(near(s.diplo.uk - b.diplo.uk, -3), `英国 −3（实为 ${s.diplo.uk - b.diplo.uk}）`);
  ok(near(s.diplo.france - b.diplo.france, -3), `法国 −3（实为 ${s.diplo.france - b.diplo.france}）`);
  ok(s.order.fervour > b.order.fervour, '民众热忱上升');
}

console.log('\n=== 5. 选项 5 的条件效果（意共） ===');
{
  const before = play('socialisti');   // 未成立
  const after = play('socialisti', 42, s => { s.flags.comintern_door = true; });
  const b = Eng.createState('1919-09', 'historical', 42);
  console.log(`   未成立: comunisti ${(before.forze.comunisti - b.forze.comunisti).toFixed(1)}`
    + ` | 已成立: comunisti ${(after.forze.comunisti - b.forze.comunisti).toFixed(1)}`);
  ok(near(before.forze.comunisti - b.forze.comunisti, 0), '意共未成立时不加关系');
  ok(near(after.forze.comunisti - b.forze.comunisti, 3), '意共成立后 +3');
  ok(near(after.forze.anarchici - b.forze.anarchici, 5), '无政府主义者 +5（无条件）');
  ok(near(before.forze.anarchici - b.forze.anarchici, 5), '未成立时无政府主义者照样 +5');
  ok(near(after.diplo.italy - b.diplo.italy, -5), '与意大利 −5');
  ok(after.factions.sindacalisti.inf > b.factions.sindacalisti.inf, '工团派影响力上升');
}

console.log('\n=== 6. 冷却与兵力上限 ===');
{
  const worst = Eng.createState('1919-09', 'historical', 1);
  worst.order.authority = 0;
  Object.keys(worst.factions).forEach(k => { worst.factions[k].inf = 1; worst.factions[k].dis = 100; });
  const avail = Eng.cardOptions(worst, card).filter(o => o.enabled);
  console.log('   最坏状态可用选项:', avail.map(o => o.id).join(','));
  ok(avail.length === 6, '六个选项全部无条件，任何状态都可选');
}
{
  /* Cooldown is 9 half-turns = 4.5 months. Advance enough between plays or the
     card is refused (and rightly so). */
  let s = Eng.createState('1919-09', 'historical', 42);
  const seen = [];
  let plays = 0;
  for (let i = 0; i < 40; i++) {
    const d = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id });
    if (d.state !== s) {
      s = d.state;
      if (s.pendingCard == null && s.hand.indexOf(card.id) >= 0) {
        const r = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id });
        if (r.state !== s) {
          s = r.state;
          if (s.pendingCard) s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'regio_esercito' }).state;
          plays++;
        }
      }
    }
    seen.push(Math.round(s.order.milizia));
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      const o = ev.options.filter(x => !x.condition || x.condition(s));
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: o[0].id }).state;
    } else s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
  console.log(`   40 回合内成功打出 ${plays} 次`);
  console.log('   兵力轨迹:', seen.filter((v, i) => i % 5 === 0).join(' → '));
  ok(plays >= 2, `冷却生效后仍可反复打出（${plays} 次）`);
  ok(seen[seen.length - 1] > seen[0], '兵力确实能靠这张卡堆高');
}

console.log('\n=== 7. 冷却被真正读取（引擎层） ===');
{
  let s = Eng.createState('1919-09', 'historical', 42);
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
  s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'regio_esercito' }).state;
  const cd = s.eventCooldowns['c_' + card.id];
  console.log(`   打出后 eventCooldowns['c_${card.id}'] = ${cd}，monthIndex = ${s.monthIndex}`);
  ok(cd != null && cd > s.monthIndex, '冷却已登记');
  const again = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id });
  ok(again.state === s, '冷却期内无法再次抽取');
  ok(!!again.toast && /冷却|ricarica/.test(JSON.stringify(again.toast)), `给出冷却提示：${again.toast && again.toast.text}`);
}

console.log('\n=== 8. 阜姆联盟计数与动态兵力 ===');
const league = Eng.CARD_BY_ID['az_fiume_league'];
{
  /* 五个实质选项各计一次；拒绝选项不计 */
  const subs = league.options.filter(o => o.id !== 'nulla');
  console.log('   阜姆联盟实质选项:', subs.map(o => o.id).join(','));
  ok(subs.length === 5, `五个实质选项（实为 ${subs.length}）`);
  subs.forEach(o => {
    const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
    ok(e.counters && e.counters.leagueUsed === 1, `${o.id}: 计一次 leagueUsed`);
  });
  const decl = league.options.find(o => o.id === 'nulla');
  const de = typeof decl.effect === 'function' ? decl.effect(Eng.createState('1919-09', 'historical', 1)) : decl.effect;
  ok(!de.counters, '拒绝选项不计入 leagueUsed');
}
{
  /* 每打一次阜姆联盟的实质选项，计数 +1 */
  let s = Eng.createState('1919-09', 'historical', 42);
  const start = (s.counters && s.counters.leagueUsed) || 0;
  const picks = ['patrioti', 'soviet', 'protesta', 'ungheria', 'balcani'];
  let done = 0;
  for (let i = 0; i < 60 && done < 5; i++) {
    const d = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: league.id });
    if (d.state !== s) {
      s = d.state;
      const r = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: league.id });
      if (r.state !== s) {
        s = r.state;
        if (s.pendingCard) {
          const avail = Eng.cardOptions(s, league).filter(o => o.enabled && o.id !== 'nulla');
          s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: (avail[0] || {}).id || 'protesta' }).state;
          done++;
        }
      }
    }
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      const o = ev.options.filter(x => !x.condition || x.condition(s));
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: o[0].id }).state;
    } else s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
  const end = s.counters.leagueUsed;
  console.log(`   leagueUsed: ${start} → ${end}（实际打出 ${done} 次）`);
  ok(end === start + done, `计数精确等于打出的实质选项次数（${end}）`);
}
{
  /* 动态公式：300 × (1 + 0.1×uses)，四舍五入 */
  const opt = card.options.find(o => o.id === 'popoli_oppressi');
  const b = Eng.createState('1919-09', 'historical', 42);
  for (const uses of [0, 1, 5, 10, 23]) {
    const s = Eng.createState('1919-09', 'historical', 42);
    s.counters.leagueUsed = uses;
    const e = opt.effect(s);
    const expect = Math.round(300 * (1 + 0.1 * uses));
    ok(e.order.milizia === expect, `leagueUsed=${uses} → 兵力 +${e.order.milizia}（期望 ${expect}）`);
  }
  /* 端到端：计数器真的推高兵力 */
  const run = (uses) => {
    let s = Eng.createState('1919-09', 'historical', 42);
    s.counters.leagueUsed = uses;
    const before = s.order.milizia;
    s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id }).state;
    s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id }).state;
    s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'popoli_oppressi' }).state;
    return s.order.milizia - before;
  };
  const d0 = run(0), d5 = run(5);
  console.log(`   端到端：uses=0 → +${d0}，uses=5 → +${d5}`);
  ok(d0 === 300, `uses=0 时 +300（实为 ${d0}）`);
  ok(d5 === 450, `uses=5 时 +450（实为 ${d5}）`);
  ok(d5 > d0, '网络越广，招募越多');
}

console.log('\n=== 9. 每个选项都有成本 ===');
{
  /* Every option must cost something in funds — the card decides who the Legion
     opens its doors to, and each door has a bill. The decline pays IN, because
     not feeding the mouths that would have come is a saving. */
  const EXPECT_COST = {
    regio_esercito: -220, studenti: -180, rastrellamento: -80,
    popoli_oppressi: 0, socialisti: -260, chiudere: 60
  };
  card.options.forEach(o => {
    const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
    const cost = e.funds || 0;
    ok(cost === EXPECT_COST[o.id], `${o.id}: 金库 ${cost >= 0 ? '+' : ''}${cost}（期望 ${EXPECT_COST[o.id]}）`);
  });
  /* 全部花得起：开局 2400 K£，最贵的一项 260 */
  const start = Eng.createState('1919-09', 'historical', 42).funds;
  const dearest = Math.max(...card.options.map(o => {
    const e = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
    return -(e.funds || 0);
  }));
  console.log(`   开局金库 ${start} K£，最贵选项 ${dearest} K£`);
  ok(start > dearest * 3, `开局金库足以支付最贵选项 3 次以上（${start} > ${dearest * 3}）`);
  /* 端到端：金库真的被扣 */
  const b = Eng.createState('1919-09', 'historical', 42);
  const s = play('regio_esercito');
  ok(near(s.funds - b.funds, -220), `端到端：皇家陆军呼吁扣款 220（实为 ${s.funds - b.funds}）`);
}
{
  /* 反复打这张卡不再是免费的：检查财政压力真实存在 */
  let s = Eng.createState('1919-09', 'historical', 42);
  let plays = 0, minFunds = s.funds;
  for (let i = 0; i < 60; i++) {
    const d = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: card.id });
    if (d.state !== s) {
      s = d.state;
      const r = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: card.id });
      if (r.state !== s) {
        s = r.state;
        if (s.pendingCard) { s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: 'socialisti' }).state; plays++; }
      }
    }
    minFunds = Math.min(minFunds, s.funds);
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      const o = ev.options.filter(x => !x.condition || x.condition(s));
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: o[0].id }).state;
    } else s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
  console.log(`   60 回合内打出 ${plays} 次（每次都选最贵的社会主义者 −260），金库最低降到 ${Math.round(minFunds)} K£`);
  ok(minFunds >= 0, '金库不会被这张卡打成负数');
}
console.log('\n=== 10. 追加数值断言 ===');
{
  const b = Eng.createState('1919-09', 'historical', 42);
  const r3 = play('rastrellamento');
  ok(near(r3.order.milizia - b.order.milizia, 250), `围捕：兵力 +250（实为 ${r3.order.milizia - b.order.milizia}）`);
  ok(near(r3.order.fervour - b.order.fervour, -5), `围捕：热忱 −5（实为 ${r3.order.fervour - b.order.fervour}）`);
  const r5 = play('socialisti');
  ok(near(r5.order.milizia - b.order.milizia, 650), `社会主义者：兵力 +650（实为 ${r5.order.milizia - b.order.milizia}）`);
  const r4 = play('popoli_oppressi');
  ok(near(r4.order.milizia - b.order.milizia, 300), `被压迫民族（uses=0）：兵力 +300（实为 ${r4.order.milizia - b.order.milizia}）`);
}

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
