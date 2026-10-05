'use strict';
/* 按用户定义把沙盒改成 dated:false 后，逐项核对：
   - 哪些事件仍会触发（条件驱动），哪些彻底消失（日期驱动）
   - 哪些结局条件变得可达 */
const H = require('./ending_harness.js');
const { Eng, W, Meta, R } = H;

const ORIG = W.DIFFICULTIES.filter(d => d.id === 'sandbox')[0].dated;
function setDated(f) { W.DIFFICULTIES.forEach(d => { if (d.id === 'sandbox') d.dated = f; }); }

const ALL = Object.keys(Eng.EVENT_BY_ID).map(k => Eng.EVENT_BY_ID[k]);

console.log('=== A. 事件分类：谁靠日期、谁靠条件 ===\n');
const buckets = { superEvent: [], chain: [], dated: [], conditional: [] };
ALL.forEach(e => {
  if (e.superEvent) buckets.superEvent.push(e);
  else if (e.chain) buckets.chain.push(e);
  else if (e.date) buckets.dated.push(e);
  else buckets.conditional.push(e);
});
for (const [k, list] of Object.entries(buckets)) {
  console.log(`【${k}】${list.length} 个  （${k === 'dated' ? '只有 dated=true 才排期' : k === 'superEvent' ? 'pickEvent 第 1 步，与 dated 无关' : k === 'chain' ? '只能由父事件 next/queue 进入' : 'pickEvent 第 4 步，与 dated 无关'}）`);
  list.sort((a, b) => (a.date ? a.date.y * 12 + a.date.m : 0) - (b.date ? b.date.y * 12 + b.date.m : 0));
  list.forEach(e => {
    const d = e.date ? `${e.date.y}-${String(e.date.m).padStart(2, '0')}` : '—';
    console.log(`    ${d.padEnd(8)} ${e.id.padEnd(30)} ${(e.title && e.title.zh) || ''}`);
  });
  console.log('');
}

console.log('=== B. superEvent 的触发条件（用户举例的「血腥圣诞」在此列） ===');
['ev_natale', 'ev_coup'].forEach(id => {
  const e = Eng.EVENT_BY_ID[id];
  console.log(`  ${id}:`);
  console.log('    condition =', e.condition.toString().replace(/\s+/g, ' ').replace(/\/\*[\s\S]*?\*\//g, '').trim());
});

console.log('\n=== C. dated:false 下，四个「卡尔纳罗系」结局的前置还能不能拿到 ===');
setDated(false);
{
  /* 宪章链入口是一个 dated 事件 → 条件驱动模式下不存在 */
  const entry = Eng.EVENT_BY_ID.ev_1920_01_deambris;
  console.log(`  ev_1920_01_deambris 是 dated 事件: ${!!entry.date}`);
  console.log(`  → dated:false 时它永不排期，charter_program 无从获得`);
  const dib = Eng.EVENT_BY_ID.ev_carta_dibattito;
  console.log(`  ev_carta_dibattito 自身 dated: ${!!dib.date}（它靠条件门控）`);
  const st = Eng.createState('1919-09', 'sandbox', 1);
  st.flags.charter_promulgated = true;
  console.log(`  但其条件需要 charter_promulgated: ${!!dib.condition(st)}`);
  console.log(`  而 charter_promulgated 只来自 dated 的 ev_1920_09_carta:a 或 gv_arengo`);
  console.log(`  gv_arengo.require 需要 flags.charter_program: 见上 —— 链条断在源头`);
}
setDated(ORIG);

console.log('\n=== D. 结论：sandbox.dated 一个字段决定的两套世界 ===');
setDated(true);
const a = Eng.createState('1919-09', 'sandbox', 1);
const datedCount = ALL.filter(e => e.date && !e.superEvent && !e.chain).length;
console.log(`  dated=true （现状）：可排期日期事件 ${datedCount} 个 → 1919–1924 史实主线完整，carta_done 可得，但罗马条约锁死 1924-03`);
setDated(false);
console.log(`  dated=false（你的定义）：可排期日期事件 0 个 → 只有 superEvent + 条件事件，能活到 1927-12，但 charter_program 无从获得`);
setDated(ORIG);
console.log(`\n（已还原 sandbox.dated = ${W.DIFFICULTIES.filter(d => d.id === 'sandbox')[0].dated}）`);
