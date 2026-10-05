'use strict';
/* 验证围攻链的三态分流：给定不同兵力/驻军，ev_natale_fight 应分别走向
   ev_natale_win / ev_natale_stalemate / ev_natale_lose。 */
const H = require('./ending_harness.js');
const { Eng, R, Meta } = H;

function forceNatale(milizia, garrison, coup, tactic) {
  let s = Eng.createState('1919-09', 'historical', 1);
  s.order.milizia = milizia;
  s.order.garrison = garrison;
  s.order.coup = coup;
  s.date = { y: 1920, m: 12, d: 15 };
  /* 直接进入 ev_natale → resistere → ev_natale_fight */
  s.currentEvent = 'ev_natale';
  s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: 'resistere' }).state;
  if (s.currentEvent !== 'ev_natale_fight') {
    return { err: '未能进入 ev_natale_fight，当前=' + s.currentEvent };
  }
  const before = { mil: Math.round(s.order.milizia), gar: s.order.garrison, coup: s.order.coup };
  const r = R.resolveBattle(s, {
    defenderPower: R.battleForces(s, 'defender') * ({ tenere: 1, sortita: 1.15, cessate: 0.9 }[tactic] || 1)
  });
  s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: tactic }).state;
  return { before, r, next: s.currentEvent, ending: s.ending, phase: s.phase, s };
}

const cases = [
  ['不养兵（2000 兵 / 驻军 22 / coup 140）', 2000, 22, 140],
  ['史实默认线（6700 兵 / 驻军 22 / coup 140）', 6700, 22, 140],
  ['中等（9000 兵 / 驻军 22 / coup 140）', 9000, 22, 140],
  ['认真守（13000 兵 / 驻军 30 / coup 140）', 13000, 30, 140],
  ['满编（16000 兵 / 驻军 60 / coup 140）', 16000, 60, 140],
];

console.log('=== ev_natale_fight 三态分流（战术 tenere）===');
for (const [label, m, g, c] of cases) {
  const out = forceNatale(m, g, c, 'tenere');
  if (out.err) { console.log('  ' + label + ' → ' + out.err); continue; }
  console.log('  ' + label.padEnd(38) + ' 守 ' + String(Math.round(out.r.defender)).padStart(6)
    + ' / 攻 ' + String(Math.round(out.r.attacker)).padStart(6)
    + '  比 ' + out.r.ratio.toFixed(2).padStart(5)
    + '  → ' + out.r.state.padEnd(9)
    + '  next=' + String(out.next || ('ending=' + out.ending)));
}

console.log('\n=== 三个结局臂各自可达 ===');
for (const [label, m, g, c] of cases) {
  const out = forceNatale(m, g, c, 'tenere');
  if (out.err) continue;
  if (out.next === 'ev_natale_win' || out.next === 'ev_natale_stalemate' || out.next === 'ev_natale_lose') {
    /* 继续把该臂推到底，确认落点 */
    let s = out.s;
    let steps = 0, seen = [out.next];
    while (s.phase !== 'ended' && steps++ < 8) {
      if (s.currentEvent) {
        const ev = Eng.EVENT_BY_ID[s.currentEvent];
        const opt = ev.options[0];
        s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: opt.id }).state;
        seen.push(ev.id + ':' + opt.id);
      } else break;
    }
    console.log('  ' + label.padEnd(38) + ' ' + seen.slice(0, 3).join(' → ')
      + (s.ending ? '  ⇒ ' + s.ending : '  （继续游戏, phase=' + s.phase + '）'));
  }
}