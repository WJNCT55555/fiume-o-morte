'use strict';
/* 直接回答：守住围攻 → 一路跑到 1924，fiume_o_morte 能拿到吗？
   做法：构造一个「围攻打赢 + 港口复兴 + 宪章完成」的状态，
   然后按真实时序推进到 1924，逐观测点看谁先成立。 */
const H = require('./ending_harness.js');
const { Eng, R, Meta } = H;

const PRIO = Meta.ENDINGS.filter(e => e.id !== 'ending_timer').sort((a, b) => a.priority - b.priority);

function whoWins(s) {
  for (const e of PRIO) {
    let v = false; try { v = !!e.check(s); } catch (err) { v = false; }
    if (v) return { id: e.id, zh: e.zh, prio: e.priority };
  }
  return { id: 'ending_timer', zh: '尚未落幕', prio: 99 };
}

console.log('=== 场景：围攻打赢，港口复兴，宪章完成，不政变 ===');
console.log('逐半回合推进，看每个观测点谁先成立（只看状态变化的关键点）\n');

/* 用真实引擎推进一个「守住围攻之后」的对局 */
let s = Eng.createState('1919-09', 'historical', 100);
/* 直接把状态设成「赢下围攻之后」的样子 */
s.flags.siege_held = true;
s.flags.natale_done = true;
s.flags.bloody_christmas = true;
s.flags.carta_done = true;
s.flags.porto_revived = true;
s.order.coup = 0;
s.order.milizia = 9000;
s.economy.traffic = 95;
s.laws.lavoro = 3;
s.laws.fisco = 3;
/* 卡住 commune 的两道新门槛 */
s.factions.sindacalisti.inf = 40;
s.forze.sindacalisti = 30;
s.date = { y: 1921, m: 1, d: 15 };
Eng.postProcess(s);

let last = null;
let g = 0;
let stopReason = 'unknown';
while (s.phase !== 'ended' && g++ < 4000) {
  const w = whoWins(s);
  const key = s.date.y + '-' + s.date.m;
  if (w.id !== last) {
    console.log(`  ${key}  → ${w.id} (${w.zh}, priority ${w.prio})`
      + (w.id === 'ending_timer' ? '   [尚无终结条件成立]' : ''));
    last = w.id;
  }
  /* 推进到下一个事件/回合；事件一律选第一个选项，避免干扰 */
  if (s.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
    /* 压住法西斯政变，否则 1922-03 就把游戏收掉，到不了 1924 */
    if (ev.id === 'ev_coup') s.order.subversion = 0;
    const avail = ev.options.filter(o => !o.condition || o.condition(s));
    const before = { t: !!s.flags.treaty_rome };
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (avail[0] || ev.options[0]).id }).state;
    if (!before.t && s.flags.treaty_rome) console.log(`           ↳ ${ev.id} 触发并设 treaty_rome`);
    continue;
  }
  /* 同时压住两条危机轴，保证能跑到 1924 */
  s.order.subversion = Math.min(s.order.subversion, 40);
  const adv = Eng.dispatch(s, { type: 'ADVANCE' });
  if (adv.state === s) { stopReason = 'ADVANCE 无进展 @' + s.date.y + '-' + s.date.m; break; }
  s = adv.state;
}
if (s.phase === 'ended') stopReason = '已结算';
else if (g >= 4000) stopReason = '循环上限 4000';
console.log('\n  终止原因: ' + stopReason + '   phase=' + s.phase);

console.log('\n  终局: ' + s.ending + ' @' + s.date.y + '-' + s.date.m);
console.log('  treaty_rome=' + !!s.flags.treaty_rome + '  carta_done=' + !!s.flags.carta_done
  + '  porto_revived=' + !!s.flags.porto_revived + '  吞吐=' + Math.round(s.economy.traffic)
  + '  coup_done=' + !!s.flags.coup_done + '  sind.inf=' + Math.round(s.factions.sindacalisti.inf));

const fom = Meta.ENDINGS.filter(e => e.id === 'ending_fiume_o_morte')[0];
console.log('\n=== fiume_o_morte 的五个子条件 ===');
console.log('  porto_revived  = ' + !!s.flags.porto_revived);
console.log('  traffic >= 85  = ' + Math.round(s.economy.traffic));
console.log('  !coup_done     = ' + !s.flags.coup_done);
console.log('  carta_done     = ' + !!s.flags.carta_done);
console.log('  date >= 1924-12= ' + (s.date.y > 1924 || (s.date.y === 1924 && s.date.m >= 12))
  + '   (当前 ' + s.date.y + '-' + s.date.m + ')');
console.log('  → fiume_o_morte.check = ' + (() => { try { return !!fom.check(s); } catch (e) { return false; } })());
