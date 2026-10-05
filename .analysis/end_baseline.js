/* 基准对局：什么都不做（不主动打牌、事件选第一个选项），验证史实默认线 */
'use strict';
const H = require('./ending_harness.js');
const { Eng, S } = H;

function run(seed, eventPick) {
  const plan = {
    event(s, ev, avail) {
      if (eventPick) { const p = eventPick(s, ev, avail); if (p) return p; }
      return avail[0] && avail[0].id;
    },
    /* 不主动抽牌、不打牌 */
    draw() { return '__none__'; },
    card() { return null; },
  };
  const { s } = H.playGame(seed, plan);
  return s;
}

console.log('=== 被动对局（不打任何卡，事件选第一项） ===');
for (const seed of [1, 7, 42, 101, 2024]) {
  const s = run(seed);
  const flags = Object.keys(s.flags).filter(k => s.flags[k] === true).sort();
  console.log(`seed ${String(seed).padStart(5)} → ${String(s.ending).padEnd(22)} @ ${s.date.y}-${String(s.date.m).padStart(2, '0')}`
    + `  人口 ${Math.round(s.economy.population)}  兵力 ${Math.round(s.order.milizia)}  合法性 ${Math.round(s.legitimacy)}`);
  if (seed === 1) {
    console.log('   flags:', flags.join(', '));
    console.log('   席次 LEG =', s.assembly.LEG, ' AUT =', s.assembly.AUT, ' PSI =', s.assembly.PSI);
    console.log('   traffic =', Math.round(s.economy.traffic), ' coup =', Math.round(s.order.coup), ' subversion =', Math.round(s.order.subversion));
  }
}

console.log('\n=== 默认线是否复现史实：血腥圣诞 1920-12 + 1921-04 选举 ===');
const s = run(1);
console.log('  natale_done:', s.flags.natale_done, ' martyred:', s.flags.martyred, ' dannunzio_left:', s.flags.dannunzio_left);
console.log('  选举已举行:', s.counters.electionsHeld, ' LEG 席次:', s.assembly.LEG);
console.log('  城区兼并列得票（如记录）:', s.counters.lastVoteShare || s.election && s.election.share || '见 election 结构');
console.log('  election =', JSON.stringify(s.election || null).slice(0, 400));
