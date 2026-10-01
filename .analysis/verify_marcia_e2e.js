/* 端到端验证：完整走通「达成日志 → 终局节点 → 新结局」，并确认
   默认史实线不受影响。 */
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
const F = globalThis.Fiume, Eng = F.Engine, S = F.Sel, R = F.Rules, Meta = F.Meta, Core = F.Core;
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

const PLAN = {
  ev_1920_06_romafronte: 'ufficiali',
  ev_romafronte_mussolini: 'patto',
  ev_romafronte_malatesta: 'insurrezione',
  ev_romafronte_bombacci: 'legge',
  ev_romafronte_gramsci: 'no',
  ev_1920_09_romafronte: 'aspettare',
  /* 终局：出发 */
  ev_romafronte_epilogo: 'partire'
};

function play(seed, plan, noCards) {
  let s = Eng.createState('1919-09', 'historical', seed);
  const marks = {};
  let g = 0;
  while (s.phase !== 'ended' && g++ < 400) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s.currentEvent = null; continue; }
      const opts = ev.options.filter(o => !o.condition || o.condition(s));
      if (!opts.length) { s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: ev.options[0].id }).state; continue; }
      const pick = opts.find(o => o.id === plan[ev.id]) || opts[0];
      if (ev.id === 'ev_romafronte_epilogo') marks.epilogo = pick.id;
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
    } else {
      if (!noCards) {
        for (const k of ['porto', 'dogana', 'consumo', 'reddito']) {
          s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: 0.9 }).state;
        }
        let plays = 0;
        while (plays++ < 4) {
          if (s.hand.length < s.handLimit) {
            const decks = S.decks(s).filter(d => d.drawable);
            const pref = ['gv_bilancio', 'az_arditi', 'az_cucine', 'az_volantini', 'gv_nave', 'gv_lavori'];
            let drew = false;
            for (const id of pref) {
              for (const d of decks) if (d.cards.some(c => c.id === id)) {
                s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: id }).state; drew = true; break;
              }
              if (drew) break;
            }
            if (!drew) break;
          }
          const cards = S.hand(s).filter(c => c.playable);
          const pick = cards.find(c => ['gv_bilancio', 'az_arditi', 'az_cucine', 'az_volantini', 'gv_nave'].includes(c.id)) || cards[0];
          if (!pick) break;
          const res = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pick.id });
          if (res.state === s) break;
          s = res.state;
          if (s.pendingCard) {
            const card = Eng.CARD_BY_ID[s.pendingCard];
            const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
            if (oo.length) s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: oo[0].id }).state;
          }
        }
      }
      s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
    }
    const j = s.journals.marcia_1920;
    if (j && j.done && !marks.done) marks.done = s.date.y + '-' + s.date.m;
    if (s.flags.marcia_1920_open && !marks.open) marks.open = s.date.y + '-' + s.date.m;
    if (s.flags.marcia_1920 && !marks.march) marks.march = s.date.y + '-' + s.date.m;
  }
  return { s, marks, g };
}

console.log('=== 1. 端到端：达成 → 终局 → 新结局 ===');
let doneCount = 0, marchCount = 0, endingCount = 0, bestMil = 0, bestAllied = 0;
for (let i = 0; i < 12; i++) {
  const { s, marks } = play(2000 + i * 17, PLAN, false);
  const j = s.journals.marcia_1920;
  if (j && j.done) doneCount++;
  if (marks.march) marchCount++;
  if (s.ending === 'ending_marcia_1920') endingCount++;
  bestMil = Math.max(bestMil, Math.round(s.order.milizia));
  bestAllied = Math.max(bestAllied, S.forze(s).alliedCount);
  if (i === 0) {
    console.log(`   样本 seed 2000：`);
    console.log(`     日志完成于 ${marks.done || '未完成'} · 终局开放 ${marks.open || '未开放'}`
      + ` · 出发 ${marks.march || '未出发'}`);
    console.log(`     终局选择 ${marks.epilogo || '未到'} · 结局 ${s.ending} @ ${s.date.y}-${s.date.m}`);
    console.log(`     兵力 ${Math.round(s.order.milizia)} · 军官团 ${S.forze(s).officer.value}`
      + ` · 结盟 ${S.forze(s).alliedCount}/4`);
  }
}
console.log(`   12 局：日志完成 ${doneCount} · 出发 ${marchCount} · 新结局 ${endingCount}`);
console.log(`   兵力峰值 ${bestMil} · 结盟峰值 ${bestAllied}/4`);
ok(doneCount > 0, '至少有一局达成日志');
ok(marchCount > 0, '至少有一局走完终局并出发');
ok(endingCount > 0, '新结局 ending_marcia_1920 真的能被达成');

console.log('\n=== 2. 默认史实线不受影响（不出牌、不参与新线）===');
for (const seed of [4242, 12345]) {
  const { s, marks } = play(seed, {}, true);
  const j = s.journals.marcia_1920;
  console.log(`   seed ${seed}: 结局 ${s.ending} @ ${s.date.y}-${s.date.m}`
    + ` · 血腥圣诞=${!!s.flags.natale_done} · 政变=${!!s.flags.coup_done}`
    + ` · 新日志 ${j ? '开启' : '未开启'}`);
  ok(!j, `seed ${seed} 默认线不开新日志`);
}

console.log('\n=== 3. 结局优先级与可达性 ===');
const t = Eng.createState('1919-09', 'historical', 1);
t.flags.marcia_1920 = true;
ok(R.resolveEnding(t).id === 'ending_marcia_1920', '命中新结局');
t.flags.coup_done = true;
ok(R.resolveEnding(t).id !== 'ending_marcia_1920', '已政变时不误判');
const jd = Meta.JOURNAL_BY_ID.marcia_1920;
const fake = {
  order: { milizia: 10000 }, date: { y: 1921, m: 6 },
  forze: { fascisti: 85, socialisti: 85, anarchici: 85, comunisti: 10, forzearmate: 65 },
  flags: {}, journals: {}, monthIndex: 20
};
ok(jd.complete(fake) === true, '四项门槛齐备时 complete 为真');
ok(jd.fail(fake) === false, 'complete 为真时 fail 必须为假（同回合互斥）');
const partial = JSON.parse(JSON.stringify(fake));
partial.forze.anarchici = 40;
ok(jd.complete(partial) === false, '只有两股达标时 complete 为假');

console.log('\n=== ' + (bad === 0 ? '全部通过 ✓' : bad + ' 项失败 ✗') + ' ===');
process.exit(bad ? 1 : 0);
