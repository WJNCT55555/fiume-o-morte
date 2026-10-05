'use strict';
const H = require('./ending_harness.js');
const { Eng, Meta, W } = H;
const ids = Object.keys(Eng.EVENT_BY_ID);
const rows = ids.map(id => {
  const e = Eng.EVENT_BY_ID[id];
  return { id, date: e.date ? `${e.date.y}-${String(e.date.m).padStart(2, '0')}` : '', super: !!e.superEvent, chain: !!e.chain, once: !!e.once, rep: !!e.repeatable, title: (e.title && e.title.zh) || '', nopt: (e.options || []).length };
});
rows.sort((a, b) => (a.date || 'zzz').localeCompare(b.date || 'zzz') || a.id.localeCompare(b.id));
console.log(`=== 全部事件 ${rows.length} 个 ===`);
console.log('日期        super chain once rep 选项  id                                    标题');
rows.forEach(r => {
  console.log(`${(r.date || '—').padEnd(9)} ${r.super ? '  Y  ' : '  .  '} ${r.chain ? ' Y ' : ' . '} ${r.once ? ' Y  ' : ' .  '} ${r.rep ? ' Y ' : ' . '}  ${String(r.nopt).padStart(2)}  ${r.id.padEnd(36)} ${r.title}`);
});

console.log('\n=== 日志清单 ===');
Meta.JOURNALS.forEach(j => console.log('  ', j.id.padEnd(18), j.zh));

console.log('\n=== 宪章要求 ===');
Meta.CHARTER_REQUIREMENTS.forEach(r => console.log('  ', r.id.padEnd(14), r.zh, '≥', r.level));
