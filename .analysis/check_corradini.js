/* 科拉迪尼能否真的过 80？他只靠卡牌选项，没有自己的会面事件。 */
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
const F = globalThis.Fiume, Eng = F.Engine, S = F.Sel, W = F.World, Core = F.Core, Meta = F.Meta;
const card = Eng.CARD_BY_ID['az_forze_italia'];
const journal = Meta.JOURNAL_BY_ID.marcia_1920;

/* 只做一件事：反复打这张卡的 corradini 选项，看它能不能被月结推进到 80。 */
let s = Eng.createState('1919-09', 'historical', 42);
F.Rules.activateJournal(s, 'marcia_1920');
console.log('初始 民族主义协会 =', s.forze.corradini);

function playCorradini(st) {
  let t = st;
  t = Eng.dispatch(t, { type: 'DRAW_CARD', cardId: card.id }).state;
  t = Eng.dispatch(t, { type: 'PLAY_CARD', cardId: card.id }).state;
  t = Eng.dispatch(t, { type: 'RESOLVE_CARD_OPTION', optionId: 'corradini' }).state;
  return t;
}

console.log('\n--- 第 1 次选项 ---');
s = playCorradini(s);
console.log('  -> 民族主义协会 =', s.forze.corradini.toFixed(1));

console.log('\n--- 之后逐回合月结（卡在冷却中，不复打） ---');
let last = s.forze.corradini;
for (let i = 0; i < 26; i++) {
  // 只让日志月结跑：手动调用 journal.monthly 走 applyEffect
  const m = journal.monthly(s);
  F.Rules.applyEffect(s, m);
  const now = s.forze.corradini;
  if (i % 4 === 0 || now !== last) {
    console.log(`  t+${i}  民族主义协会 = ${now.toFixed(1)}  (月结 ${JSON.stringify(m.forze)})`);
  }
  last = now;
}
console.log('\n结论：单次选项 + 月结 26 回合后 =', s.forze.corradini.toFixed(1));

console.log('\n--- 再打一次（冷却 5 回合已过） ---');
s = playCorradini(s);
console.log('  第二次选项后 =', s.forze.corradini.toFixed(1));
for (let i = 0; i < 30; i++) F.Rules.applyEffect(s, journal.monthly(s));
console.log('  再 30 回合月结后 =', s.forze.corradini.toFixed(1));
console.log('\n  能否过 80:', s.forze.corradini >= 80 ? '可以' : '还不可以');

console.log('\n--- 对照：其他四股一次会面后的月结效果 ---');
const s2 = Eng.createState('1919-09', 'historical', 42);
F.Rules.activateJournal(s2, 'marcia_1920');
F.Rules.applyEffect(s2, { forze: { fascisti: 26 } });
console.log('  法西斯 一次会面 =', s2.forze.fascisti.toFixed(1));
for (let i = 0; i < 26; i++) F.Rules.applyEffect(s2, journal.monthly(s2));
console.log('  26 回合月结后 =', s2.forze.fascisti.toFixed(1), '| 社会党', s2.forze.socialisti.toFixed(1),
  '| 无政府', s2.forze.anarchici.toFixed(1), '| 共产党', s2.forze.comunisti.toFixed(1),
  '| 民族主义', s2.forze.corradini.toFixed(1));
