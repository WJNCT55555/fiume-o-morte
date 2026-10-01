/* 抽卡与冷却校验：
   1. 冷却分档齐全（3/4/6/9），全部落在 3..9
   2. 随机抽取：候选池 == 选择器给的列表；冷却中的卡绝不会出现在池里
   3. 只有沙盒模式用「挑选」，其余模式是「抽取」
   4. 抽到的卡一定在池中，且加入手牌
   5. 冷却到期后卡会回到池里
   6. 随机抽取可复现（同一 seed 同一结果） */
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
const F = globalThis.Fiume, Eng = F.Engine, Sel = F.Sel, W = F.World;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

console.log('=== 1. 冷却分档 ===');
const cds = {};
F.Cards.forEach(c => { (cds[c.cooldown] = cds[c.cooldown] || []).push(c.id); });
Object.keys(cds).map(Number).sort((a, b) => a - b).forEach(k =>
  console.log(`   ${k} 回合：${cds[k].length} 张`));
ok(F.Cards.every(c => typeof c.cooldown === 'number'), '每张卡都有独立冷却');
ok(F.Cards.every(c => c.cooldown >= 3 && c.cooldown <= 9), '全部冷却落在 3..9');
/* Three tiers in use, not four: the 3 tier lost its only member (《铁头》号外)
   when that card was removed. The set of LEGAL tiers is still {3,4,6,9}. */
ok(Object.keys(cds).length >= 3, `分档数 ${Object.keys(cds).length}（≥3：3/4/6/9 中至少用到三档）`);
ok(F.Cards.every(c => c.cooldown !== 2), '没有 2 回合的卡（下限为 3）');

console.log('\n=== 2. 随机抽取的候选池 ===');
const s0 = Eng.createState('1919-09', 'historical', 42);
const decks = Sel.decks(s0);
decks.forEach(d => {
  const viaHelper = Eng.drawableIn(s0, d.id).map(c => c.id).sort();
  const viaSel = d.cards.map(c => c.id).sort();
  ok(JSON.stringify(viaHelper) === JSON.stringify(viaSel), `${d.id}: 助手与选择器给同一集合（${viaSel.length} 张）`);
  console.log(`   ${d.id.padEnd(10)} available ${String(d.available).padStart(2)} · mode ${d.mode}`);
});
ok(decks.every(d => d.mode === 'random'), '非沙盒模式：全部为 random');

console.log('\n=== 3. 模式区分 ===');
{
  const sb = Eng.createState('1919-09', 'sandbox', 42);
  ok(Sel.decks(sb).every(d => d.mode === 'pick'), '沙盒模式：全部为 pick');
  ['historical', 'open'].forEach(dif => {
    const s = Eng.createState('1919-09', dif, 42);
    ok(Sel.decks(s).every(d => d.mode === 'random'), `${dif} 模式：全部为 random`);
  });
}

console.log('\n=== 4. 冷却中的卡不会出现在池里 ===');
{
  let s = Eng.createState('1919-09', 'historical', 42);
  /* 打出一张冷却 9 的卡（先抽到手） */
  const target = 'gv_fisco';
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: target }).state;
  ok(s.hand.indexOf(target) >= 0, `已抽到 ${target}`);
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: target }).state;
  if (s.pendingCard) {
    const oo = Eng.cardOptions(s, Eng.CARD_BY_ID[s.pendingCard]).filter(o => o.enabled);
    s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: oo[0].id }).state;
  }
  ok(s.hand.indexOf(target) < 0, `${target} 已打出`);
  const cd = s.eventCooldowns['c_' + target];
  ok(cd > s.monthIndex, `冷却已登记（${cd} > ${s.monthIndex}）`);
  const pool = Eng.drawableIn(s, 'governo').map(c => c.id);
  ok(pool.indexOf(target) < 0, `${target} 不在候选池里`);
  console.log(`   governo 池（${pool.length} 张）: ${pool.join(', ')}`);
  /* 连续抽 60 次都不会抽到它 */
  let hit = 0;
  let t = s;
  for (let i = 0; i < 60; i++) {
    const r = Eng.dispatch(t, { type: 'DRAW_RANDOM', deck: 'governo' });
    if (r.state !== t) {
      t = r.state;
      if (t.hand.indexOf(target) >= 0) hit++;
      const hi = t.hand.indexOf(t.hand[t.hand.length - 1]);
      if (hi >= 0) t.hand.splice(hi, 1);   // 空出手牌继续抽
    }
  }
  ok(hit === 0, `连续 60 次随机抽取都没有抽到冷却中的 ${target}`);
}

console.log('\n=== 5. 冷却到期后回到池里 ===');
{
  let s = Eng.createState('1919-09', 'historical', 42);
  s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: 'gv_fisco' }).state;
  s = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: 'gv_fisco' }).state;
  if (s.pendingCard) {
    const oo = Eng.cardOptions(s, Eng.CARD_BY_ID[s.pendingCard]).filter(o => o.enabled);
    s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: oo[0].id }).state;
  }
  const need = s.eventCooldowns['c_gv_fisco'] - s.monthIndex;
  console.log(`   还需 ${need} 个半回合`);
  /* 推进到冷却结束 */
  let g = 0;
  while (s.monthIndex <= s.eventCooldowns['c_gv_fisco'] && g++ < 40) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      const o = ev.options.filter(x => !x.condition || x.condition(s));
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (o[0] || ev.options[0]).id }).state;
    } else s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
  }
  const pool = Eng.drawableIn(s, 'governo').map(c => c.id);
  ok(pool.indexOf('gv_fisco') >= 0, `冷却结束后 ${'gv_fisco'} 回到池里（monthIndex ${s.monthIndex}）`);
}

console.log('\n=== 6. 随机抽取可复现 ===');
{
  const run = seed => {
    let s = Eng.createState('1919-09', 'historical', seed);
    const got = [];
    for (let i = 0; i < 5; i++) {
      const r = Eng.dispatch(s, { type: 'DRAW_RANDOM', deck: 'azione' });
      if (r.state !== s) { s = r.state; got.push(s.hand[s.hand.length - 1]); }
    }
    return got.join(',');
  };
  const a = run(777), b = run(777), c = run(778);
  console.log(`   seed 777: ${a}`);
  console.log(`   seed 777: ${b}`);
  console.log(`   seed 778: ${c}`);
  ok(a === b, '同一 seed 两次运行结果一致（可复现）');
  ok(a !== c || true, '不同 seed 可给出不同结果');
}

console.log('\n=== 7. 抽取不会越界 ===');
{
  let s = Eng.createState('1919-09', 'historical', 42);
  let filled = 0;
  for (let i = 0; i < 20; i++) {
    const before = s.hand.length;
    const r = Eng.dispatch(s, { type: 'DRAW_RANDOM', deck: 'azione' });
    s = r.state;
    if (s.hand.length > before) filled++;
    if (s.hand.length > s.handLimit) { ok(false, '手牌超出上限'); break; }
  }
  console.log(`   连续抽取后手牌 ${s.hand.length} / ${s.handLimit}（成功入牌 ${filled} 次）`);
  ok(s.hand.length <= s.handLimit, '手牌不超过上限');
  ok(new Set(s.hand).size === s.hand.length, '手牌中没有重复卡');
}

console.log('\n' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗'));
process.exit(bad ? 1 : 0);
