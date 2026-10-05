'use strict';
const V = require('./end_verify.js');
const H = require('./ending_harness.js');
const { Meta, R } = H;
const goal = process.argv[2] || 'carnaro';
const diff = process.argv[3] || 'open';
const r = V.run(goal, 100, { difficulty: diff });
const s = r.s;
console.log(`goal=${goal} diff=${diff}  ending=${s.ending} @${s.date.y}-${s.date.m}`);
console.log('laws     =', JSON.stringify(s.laws));
console.log('diplo    =', JSON.stringify(Object.fromEntries(Object.entries(s.diplo).map(([k, v]) => [k, Math.round(v)]))));
console.log('economy  = traffic', Math.round(s.economy.traffic), 'population', Math.round(s.economy.population), 'unemployment', Math.round(s.economy.unemployment));
console.log('order    =', JSON.stringify(Object.fromEntries(Object.entries(s.order).filter(([k]) => typeof s.order[k] === 'number').map(([k, v]) => [k, Math.round(v)]))));
console.log('flags    =', Object.keys(s.flags).filter(k => s.flags[k] === true).sort().join(', '));
console.log('factions =', JSON.stringify(Object.fromEntries(Object.entries(s.factions).map(([k, v]) => [k, Math.round(v.inf)]))));
console.log('journals =', Object.entries(s.journals).map(([k, v]) => `${k}:${v.done ? 'done' : v.failed ? 'FAIL' : 'active(' + v.months + ')'}`).join(' '));
console.log('cabinet  =', JSON.stringify(s.cabinet));
console.log('\n--- 各结局 check ---');
Meta.ENDINGS.slice().sort((a, b) => a.priority - b.priority).forEach(e => {
  let v; try { v = e.check(s); } catch (err) { v = 'ERR ' + err.message; }
  console.log(`  ${String(e.priority).padStart(5)} ${e.id.padEnd(24)} ${v ? '✅ true' : 'false'}`);
});
console.log('\n--- 宪章要求进度 ---');
Meta.CHARTER_REQUIREMENTS.forEach(req => {
  const cur = s.laws[req.id] || 0;
  console.log(`  ${req.id.padEnd(14)} ${cur}/${req.level} ${cur >= req.level ? '✅' : '❌'}`);
});
console.log('  charter_promulgated =', !!s.flags.charter_promulgated, ' charter_debate_resolved =', !!s.flags.charter_debate_resolved);
console.log('  charterProgress =', JSON.stringify(R.charterProgress(s)));
