'use strict';
/* 验证 1924 链：接受合并 → 吞并；拒绝 → 三态（胜=继续 / 僵局=内战僵局 / 败=法西斯城邦）。 */
const H = require('./ending_harness.js');
const { Eng, R, Meta } = H;

function run1924(milizia, squadre, subversion, tactic) {
  let s = Eng.createState('1919-09', 'historical', 1);
  s.flags.siege_held = true;          /* 1920 围城守住了 */
  s.flags.natale_done = true;
  s.order.coup = 0;
  s.order.milizia = milizia;
  s.order.squadre = squadre;
  s.order.subversion = subversion;
  s.order.garrison = 22;
  s.date = { y: 1924, m: 1, d: 15 };
  Eng.postProcess(s);
  s.currentEvent = 'ev_1924_01_rome';
  const cond = Eng.EVENT_BY_ID.ev_1924_01_rome.condition(s);
  if (tactic === 'firmare') {
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: 'firmare' }).state;
    return { cond, r: null, s };
  }
  const base = R.annexationForces(s, 'defender');
  const r = R.resolveAnnexation(s, { defenderPower: base * ({ trattare: 1, barricare: 1.15, cedere: 0.9 }[tactic] || 1) });
  s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: tactic }).state;
  return { cond, r, s };
}

console.log('=== ev_1924_01_rome 的 condition ===');
{
  const ok1 = Eng.createState('1919-09', 'historical', 1);
  ok1.date = { y: 1924, m: 1, d: 15 };
  console.log('  独立摄政（无 coup/exile/stay）→ ' + Eng.EVENT_BY_ID.ev_1924_01_rome.condition(ok1));
  const ok2 = Eng.createState('1919-09', 'historical', 1);
  ok2.date = { y: 1924, m: 1, d: 15 }; ok2.flags.coup_done = true;
  console.log('  政变已成功 → ' + Eng.EVENT_BY_ID.ev_1924_01_rome.condition(ok2) + '（不再触发，政变路线已自行收束）');
  const ok3 = Eng.createState('1919-09', 'historical', 1);
  ok3.date = { y: 1924, m: 1, d: 15 }; ok3.flags.exile = true;
  console.log('  已流亡 → ' + Eng.EVENT_BY_ID.ev_1924_01_rome.condition(ok3));
}

console.log('\n=== 接受合并 ===');
{
  const o = run1924(12000, 60, 100, 'firmare');
  console.log('  终局: ' + o.s.ending + '  @' + o.s.date.y + '-' + o.s.date.m);
  console.log('  flags: annexation=' + !!o.s.flags.annexation + '  treaty_rome=' + !!o.s.flags.treaty_rome);
}

console.log('\n=== 拒绝合并 → 三态 ===');
const cases = [
  ['兵力很弱（1500 / 小队 80 / 颠覆 140）', 1500, 80, 140],
  ['中等（6000 / 小队 60 / 颠覆 120）', 6000, 60, 120],
  ['强（14000 / 小队 40 / 颠覆 100）', 14000, 40, 100],
];
for (const [label, m, sq, sv] of cases) {
  const o = run1924(m, sq, sv, 'trattare');
  console.log('  ' + label.padEnd(34)
    + ' 守 ' + String(Math.round(o.r.defender)).padStart(6)
    + ' / 攻 ' + String(Math.round(o.r.attacker)).padStart(6)
    + '  比 ' + o.r.ratio.toFixed(2).padStart(5)
    + '  → ' + o.r.state.padEnd(9)
    + ' next=' + o.s.currentEvent
    + (o.s.ending ? '  ⇒ ' + o.s.ending : ''));
}

console.log('\n=== 两条 1924 路径（forze.fascisti 阈值 60）===');
{
  const mk = (v, m, sq, sv) => {
    const s = Eng.createState('1919-09', 'historical', 1);
    s.flags.siege_held = true; s.flags.natale_done = true;
    s.order.coup = 0; s.order.milizia = m; s.order.squadre = sq; s.order.subversion = sv;
    s.order.garrison = 22; s.forze.fascisti = v;
    s.date = { y: 1924, m: 1, d: 15 };
    Eng.postProcess(s);
    return s;
  };
  const rome = Eng.EVENT_BY_ID.ev_1924_01_rome;
  const coup = Eng.EVENT_BY_ID.ev_1924_fascist_coup;
  for (const v of [38, 59, 60, 64]) {
    const s = mk(v, 6000, 60, 120);
    const a = rome.condition(s), b = coup.condition(s);
    console.log(`  forze.fascisti ${String(v).padStart(3)} → 外交条约=${String(a).padEnd(5)} 法西斯政变=${String(b).padEnd(5)}`
      + `  攻方: 条约 ${String(Math.round(R.treatyForces(s, 'attacker'))).padStart(5)} / 政变 ${String(Math.round(R.annexationForces(s, 'attacker'))).padStart(5)}`);
  }
  /* 两条路径的「接受合并」都通向吞并 */
  for (const [id, opt] of [['ev_1924_01_rome', 'firmare'], ['ev_1924_fascist_coup', 'firmare']]) {
    const e = Eng.EVENT_BY_ID[id].options.filter(o => o.id === opt)[0]
      .effect(Eng.createState('1919-09', 'historical', 1));
    console.log(`  ${id}:${opt} → forceEnding ${e.forceEnding}`);
  }
  /* 弱法西斯线上拒签：容易赢；强法西斯线：难 */
  const weak = mk(38, 6000, 60, 120);
  const rw = R.resolveTreaty(weak, { defenderPower: R.treatyForces(weak, 'defender') });
  console.log(`  弱法西斯线（38）拒签：守 ${Math.round(rw.defender)} / 攻 ${Math.round(rw.attacker)} = ${rw.ratio.toFixed(2)} → ${rw.state}`);
  const strong = mk(64, 6000, 60, 120);
  const rs = R.resolveAnnexation(strong, { defenderPower: R.annexationForces(strong, 'defender') });
  console.log(`  强法西斯线（64）拒签：守 ${Math.round(rs.defender)} / 攻 ${Math.round(rs.attacker)} = ${rs.ratio.toFixed(2)} → ${rs.state}`);
}

console.log('\n=== 三个拒绝臂各自推到底（法西斯政变线）===');
for (const [label, m, sq, sv] of cases) {
  const o = run1924(m, sq, sv, 'trattare');
  let s = o.s, steps = 0;
  while (s.phase !== 'ended' && s.currentEvent && steps++ < 5) {
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: ev.options[0].id }).state;
  }
  console.log('  ' + label.padEnd(34) + ' → ' + (s.ending || '（继续游戏, phase=' + s.phase + '）'));
}
