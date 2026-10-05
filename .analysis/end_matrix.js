'use strict';
/* 结局可达性总表：对每个结局用专门策略跑 N 局，报告命中率与失败原因。 */
const V = require('./end_verify.js');
const ST = require('./end_strategies.js');
const H = require('./ending_harness.js');

/* goalId -> 对应结局 id；有些 goal 是同一结局的第二条路径 */
const TARGETS = [
  ['silent_port', 'ending_silent_port', 'historical', '不打牌、不修港口，把人赶走'],
  ['fuga', 'ending_fuga', 'historical', '血腥圣诞选「投降、走人」'],
  ['fascio', 'ending_fascio', 'historical', '楼梯抵抗后接受驻军干预'],
  ['civil_strife', 'ending_civil_strife', 'historical', '围攻僵局 / 政变后暴力 > 70'],
  ['historical', 'ending_eviction', 'historical', '围攻失守：武装驱离'],
  ['marcia_1920', 'ending_marcia_1920', 'historical', '凑齐 3 股力量 + 万人纵队'],
  ['marcia_early', 'ending_marcia_1920', 'historical', '1920-09 提前窗口（2 股力量）'],
  ['comune', 'ending_comune', 'historical', '宪章 + 劳动 3 + 财政 2 + 工团派 60 + 关系 55'],
  ['annexation', 'ending_annexation', 'historical', '1924 危机：接受《罗马条约》签字'],
  ['fiume_o_morte', 'ending_fiume_o_morte', 'historical', '拒签 1924 + 港口复兴 + 撑到最后'],
  ['timer', 'ending_timer', 'open', '什么都不命中，撑到 1924-12'],
];

const SEEDS = [100, 137, 174, 211, 248];
const rows = [];
/* 结局总数以 Meta.ENDINGS 为准（ending_carnaro 已移除） */
const ALL_IDS = H.Meta.ENDINGS.map(e => e.id);
for (const [goalId, endingId, diff, note] of TARGETS) {
  if (!ST.GOALS[goalId]) { rows.push({ goalId, endingId, diff, note, hit: 0, n: 0, sample: '（无策略）' }); continue; }
  let hit = 0; const endings = {}; let lastState = null;
  for (const seed of SEEDS) {
    let s;
    try { s = V.run(goalId, seed, { difficulty: diff }).s; }
    catch (e) { endings['ERR:' + e.message] = (endings['ERR:' + e.message] || 0) + 1; continue; }
    lastState = s;
    if (s.ending === endingId) hit++;
    endings[s.ending] = (endings[s.ending] || 0) + 1;
  }
  rows.push({ goalId, endingId, diff, note, hit, n: SEEDS.length, endings, lastState });
}

console.log('='.repeat(104));
console.log('结局可达性总表（每行 5 个种子，史实/普通难度按要求）');
console.log('='.repeat(104));
console.log('结局 id'.padEnd(24) + '难度'.padEnd(12) + '命中'.padEnd(8) + '其他落入的结局');
console.log('-'.repeat(104));
for (const r of rows) {
  const others = r.endings
    ? Object.entries(r.endings).filter(([k]) => k !== r.endingId).map(([k, v]) => `${k}×${v}`).join(' ')
    : r.sample;
  console.log(
    r.endingId.padEnd(24) + r.diff.padEnd(12) +
    `${r.hit}/${r.n}`.padEnd(8) + (others || '—'));
}
console.log('-'.repeat(104));
/* 一个结局算「可达」= 至少有一条 TARGETS 行命中；某一行 0/5 可能只是
   刻意设置的对照（例如 venice 在史实难度必然被《罗马条约》截断）。 */
const byEnding = {};
rows.forEach(r => {
  byEnding[r.endingId] = byEnding[r.endingId] || { any: 0, best: 0, rows: [] };
  byEnding[r.endingId].any += r.hit;
  byEnding[r.endingId].best = Math.max(byEnding[r.endingId].best, r.hit);
  byEnding[r.endingId].rows.push(`${r.diff} ${r.hit}/${r.n}`);
});
const reachIds = Object.keys(byEnding).filter(id => byEnding[id].any > 0);
const unreachIds = Object.keys(byEnding).filter(id => byEnding[id].any === 0);
console.log(`结局总数 ${ALL_IDS.length}（${ALL_IDS.join(', ')}）`);
console.log(`✅ 可复现 ${reachIds.length} 个 · ❌ 不可达 ${unreachIds.length} 个`);
console.log('\n✅ 可复现：');
reachIds.forEach(id => console.log(`   ${id.padEnd(24)} ${byEnding[id].rows.join('  ')}`));
console.log('\n❌ 不可达：');
unreachIds.forEach(id => console.log(`   ${id.padEnd(24)} ${byEnding[id].rows.join('  ')}`));
/* 没有策略覆盖的结局也一并列出，避免「没测过」被当成「不可达」 */
const untested = ALL_IDS.filter(id => !byEnding[id]);
if (untested.length) console.log('\n⚠️ 无验证策略（不等于不可达）: ' + untested.join(', '));
