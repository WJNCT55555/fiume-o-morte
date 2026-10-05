'use strict';
/* 「提前完成威尼斯条件」为什么无效：checkEnd 的触发点枚举 */
const H = require('./ending_harness.js');
const { Eng, W, Meta, R } = H;

const V = Meta.ENDINGS.filter(e => e.id === 'ending_venice')[0];
const HIST = Meta.ENDINGS.filter(e => e.id === 'ending_historical')[0];

console.log('=== 1. resolveEnding 只从 checkEnd 调用（全仓唯一调用点）===');
const fs = require('fs');
const red = fs.readFileSync('src/game/engine/reducers.js', 'utf8');
const rules = fs.readFileSync('src/game/engine/rules.js', 'utf8');
console.log('  reducers.js 里 "resolveEnding" 出现次数:', (red.match(/resolveEnding/g) || []).length,
  '→', (red.match(/[^\n]*resolveEnding[^\n]*/g) || []).map(x => x.trim()).join(' | '));
console.log('  rules.js 里 "resolveEnding" 出现次数:', (rules.match(/resolveEnding/g) || []).length, '（只有定义）');

console.log('\n=== 2. hardEnd 的全部触发条件（checkEnd 内含）===');
console.log('  a) s.date > MAX_END 或 (= 且 m >= MAX_END.m)     → 最早 1924-12');
console.log('  b) treaty_rome && date >= 1924-03 && !exile      → 最早 1924-03');
console.log('  c) coup_done && !exile && !stay                  → 政变时');
console.log('  d) exile && exileMonths >= 24                    → 最早 1924-03');
console.log('  e) stay && resistMonths >= 24                    → 最早 1924-03');

console.log('\n=== 3. 逐条检验：能不能在 1924-01 之前触发结算？ ===');
const trials = [
  ['1920-04（威尼斯刚成立）', { y: 1920, m: 4 }],
  ['1921-06', { y: 1921, m: 6 }],
  ['1922-03（政变最早时点）', { y: 1922, m: 3 }],
  ['1923-12', { y: 1923, m: 12 }],
  ['1924-01（罗马条约月）', { y: 1924, m: 1 }],
  ['1924-02', { y: 1924, m: 2 }],
  ['1924-03', { y: 1924, m: 3 }],
  ['1924-12（MAX_END）', { y: 1924, m: 12 }],
];
for (const [label, d] of trials) {
  const s = Eng.createState('1919-09', 'open', 1);
  /* 把威尼斯的条件做成「早已完成」，且没有政变/流亡/驻留/罗马条约 */
  s.laws.portofranco = 3; s.economy.traffic = 95; s.factions.sindacalisti.inf = 30;
  s.flags.coup_done = false; s.flags.exile = false; s.flags.stay = false; s.flags.treaty_rome = false;
  s.date = { y: d.y, m: d.m, d: 15 };
  const veniceOk = !!V.check(s);
  Eng.checkEnd(s);
  console.log(`  ${label.padEnd(24)} 威尼斯条件=${String(veniceOk).padEnd(5)} → checkEnd 结算=${s.ending || '（不结算）'}`);
}

console.log('\n=== 4. 在 1924-01 结算点上，是谁赢？（罗马条约已签）===');
{
  const s = Eng.createState('1919-09', 'open', 1);
  s.laws.portofranco = 3; s.economy.traffic = 95; s.factions.sindacalisti.inf = 30;
  s.flags.treaty_rome = true;
  s.date = { y: 1924, m: 3, d: 16 };
  console.log('  威尼斯 check =', !!V.check(s), ' 历史 check =', !!HIST.check(s));
  console.log('  resolveEnding =', R.resolveEnding(s).id, '(威尼斯 priority', V.priority, 'vs 历史', HIST.priority + ')');
}

console.log('\n=== 5. 想拿威尼斯，必须绕开罗马条约？ ===');
{
  const rome = Eng.EVENT_BY_ID.ev_1924_01_rome;
  console.log('  ev_1924_01_rome.condition =', rome.condition.toString().replace(/\s+/g, ' '));
  console.log('  它是 dated 事件，date =', JSON.stringify(rome.date));
  console.log('  → 只要活到 1924-01 且 !treaty_rome 就会被排期；两个选项都写 treaty_rome');
  const a = rome.options[0].effect(Eng.createState('1919-09', 'open', 1));
  const b = rome.options[1].effect(Eng.createState('1919-09', 'open', 1));
  console.log('  选项 a 写 treaty_rome =', !!a.flags.treaty_rome, '；选项 b 写 treaty_rome =', !!b.flags.treaty_rome);
}
