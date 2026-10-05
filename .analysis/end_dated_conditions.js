'use strict';
/* 列出 17 个 dated 事件的 condition 与 date，评估「条件化」改法 */
const H = require('./ending_harness.js');
const { Eng } = H;

const DATED = Object.keys(Eng.EVENT_BY_ID).map(k => Eng.EVENT_BY_ID[k])
  .filter(e => e.date && !e.superEvent && !e.chain)
  .sort((a, b) => (a.date.y * 12 + a.date.m) - (b.date.y * 12 + b.date.m));

function clean(fn) {
  if (!fn) return '（无 condition）';
  return fn.toString()
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^function \(s\) \{ /, '')
    .replace(/ \}$/, '')
    .trim();
}

for (const e of DATED) {
  console.log(`\n── ${e.id}`);
  console.log(`   date      : ${e.date.y}-${String(e.date.m).padStart(2, '0')}${e.date.d ? '-' + e.date.d : ''}`);
  console.log(`   once      : ${!!e.once}   repeatable: ${!!e.repeatable}   cooldown: ${e.cooldown == null ? '—' : e.cooldown}`);
  console.log(`   options   : ${(e.options || []).map(o => o.id).join(', ')}`);
  console.log(`   condition : ${clean(e.condition)}`);
}
