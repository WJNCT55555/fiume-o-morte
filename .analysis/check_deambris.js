/* 德·安布里斯抵达事件 + 顾问门控 校验 */
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
const F = globalThis.Fiume, Eng = F.Engine, S = F.Sel, W = F.World;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

console.log('=== 1. 事件注册与结构 ===');
const ev = Eng.EVENT_BY_ID['ev_1920_01_deambris'];
ok(!!ev, 'ev_1920_01_deambris 已注册');
ok(ev.date && ev.date.y === 1920 && ev.date.m === 1, `日期 ${ev.date && ev.date.y}-${ev.date.m}`);
ok(ev.chain !== true, '不挂 chain（按日期调度）');
ok(ev.superEvent !== true, '不是 superEvent（不会抢占血腥圣诞/政变）');
ok(!!ev.title.zh && !!ev.title.it, 'title 双语');
ok(!!ev.body.zh && !!ev.body.it, 'body 双语');
ok(ev.options.length === 1, `单选项（${ev.options.length}）`);
const opt = ev.options[0];
ok(!!opt.text.zh && !!opt.text.it, 'option text 双语');
ok(!!opt.subtitle && !!opt.subtitle.zh && !!opt.subtitle.it, 'option subtitle 双语');
ok(Array.isArray(opt.preview) && opt.preview.length >= 2, `preview ${opt.preview.length} 条`);
ok(typeof ev.condition === 'function', '有 condition');

console.log('\n=== 2. 选项效果 ===');
const eff = typeof opt.effect === 'function' ? opt.effect(Eng.createState('1919-09', 'historical', 1)) : opt.effect;
console.log('   patch:', JSON.stringify(eff));
ok(eff.flags && eff.flags.deambris_arrived === true, '置 flags.deambris_arrived');
Object.keys(eff.factions || {}).forEach(k => ok(W.FACTIONS.some(f => f.id === k), `factions.${k} 合法`));

console.log('\n=== 3. 顾问门控 ===');
const adv = W.ADVISORS.find(a => a.id === 'deambris');
ok(!!adv, 'deambris 在 W.ADVISORS 中');
ok(typeof adv.require === 'function', '带 require');
let s0 = Eng.createState('1919-09', 'historical', 42);
const before = S.advisors(s0).find(a => a.id === 'deambris');
ok(before && before.unlocked === false, '事件之前：未解锁');
const s1 = Eng.dispatch(
  Eng.dispatch(s0, { type: 'RESOLVE_EVENT', optionId: 'assumere' }).state,
  { type: 'ADVANCE' }).state;
// 直接走事件路径：造出 currentEvent 再结算
let s2 = Eng.createState('1919-09', 'historical', 42);
s2.currentEvent = 'ev_1920_01_deambris';
s2 = Eng.dispatch(s2, { type: 'RESOLVE_EVENT', optionId: 'assumere' }).state;
ok(s2.flags.deambris_arrived === true, '结算后 flag 已置位');
const after = S.advisors(s2).find(a => a.id === 'deambris');
ok(after && after.unlocked === true, '事件之后：已解锁');

console.log('\n=== 4. 雇佣与使用 ===');
let s3 = Eng.dispatch(s2, { type: 'HIRE_ADVISOR', advisorId: 'deambris' }).state;
ok(s3.advisors.active.indexOf('deambris') >= 0, '可以任命');
/* The event already drives sindacalisti dissent to 0, which is the floor, so the
   assertion has to be on effects this advisor is alone in producing. */
const work0 = s3.laws.lavoro, fasDis0 = s3.factions.fascisti.dis, fer0 = s3.order.fervour;
const op0 = s3.classes.operai.support.LEG;
const ap0 = s3.ap;
s3 = Eng.dispatch(s3, { type: 'USE_ADVISOR', advisorId: 'deambris' }).state;
/* The advisor used to raise `laws.statuto`. That law no longer exists — the
   charter is a journal with implementation requirements, not a number to raise.
   The advisor does not touch `forze` either (that is the *card* option's job), so
   assert on what his action actually moves: the labour requirement of the charter
   plus the two things only he does — raising the Fascists' dissent and the
   movement's fervour. */
ok(s3.laws.lavoro > work0, `推进宪章的实施条款：劳动保障（${work0} → ${s3.laws.lavoro}）`);
ok(s3.factions.fascisti.dis > fasDis0, `法西斯派异议上升（${fasDis0.toFixed(1)} → ${s3.factions.fascisti.dis.toFixed(1)}）`);
ok(s3.order.fervour > fer0, `民众热忱上升（${fer0.toFixed(1)} → ${s3.order.fervour.toFixed(1)}）`);
ok(s3.laws.lavoro > work0, `劳动立法推进（${work0} → ${s3.laws.lavoro}）`);
ok(s3.classes.operai.support.LEG > op0, `产业工人支持军团上升（${op0.toFixed(1)} → ${s3.classes.operai.support.LEG.toFixed(1)}）`);
ok(s3.ap < ap0, `消耗 1 AP（${ap0} → ${s3.ap}）`);

console.log('\n=== 5. 事件只发生一次 ===');
ok(ev.condition(s2) === false, 'flag 置位后 condition 为假（不会重复触发）');
/* Asking createState for a locked force now falls back to the Legion, so a
   non-Legion state has to be built by setting playerForce directly — which is
   also the honest way to test the condition. */
const other = Eng.createState('1919-09', 'historical', 42);
other.playerForce = 'AUT';
ok(ev.condition(other) === false, '非军团玩家不触发');

console.log('\n=== 6. 与卡牌「找德·安布里斯」的关系 ===');
const card = Eng.CARD_BY_ID['az_forze_italia'];
const dOpt = card.options.find(o => o.id === 'deambris');
ok(!!dOpt, '卡牌仍有 deambris 选项');
ok(dOpt.require(Eng.createState('1919-09', 'historical', 42)) === true,
  '该选项只要求工团派影响力，不要求 flag（与顾问门控相互独立）');

console.log('\n=== ' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗') + ' ===');
process.exit(bad ? 1 : 0);
