'use strict';
/* 配平三态战斗结算：横轴兵力、纵轴驻军，看三态分布是否合理。 */
const H = require('./ending_harness.js');
const { Eng, R, W } = H;

function make(milizia, garrison, extras) {
  const s = Eng.createState('1919-09', 'historical', 1);
  s.order.milizia = milizia;
  s.order.garrison = garrison;
  if (extras) extras(s);
  s.order.tension = R.tension(s);
  return s;
}

const MIL = [0, 1000, 2500, 4000, 6000, 8000, 10000, 12000, 15000];
const GAR = [20, 30, 40, 60, 80];

console.log('=== 守方/攻方比值矩阵（守=兵力行, 攻=驻军列）===');
console.log('行=兵力  列=驻军  值=守/攻   ●胜(>1.1) ○僵局(0.6~1.1) ✗败(<0.6)');
process.stdout.write('兵力\\驻军'.padEnd(10));
GAR.forEach(g => process.stdout.write(String(g).padStart(11)));
console.log('');
for (const m of MIL) {
  process.stdout.write(String(m).padStart(8) + '  ');
  for (const g of GAR) {
    const s = make(m, g);
    const r = R.resolveBattle(s);
    const mark = r.state === 'victory' ? '●' : (r.state === 'stalemate' ? '○' : '✗');
    process.stdout.write((r.ratio.toFixed(2) + mark).padStart(11));
  }
  console.log('');
}

console.log('\n=== 关键情形核对（攻方含 coup=140，即围城拉满）===');
const cases = [
  ['史实默认线（兵力 6706、驻军 22、coup 140、小队 55）', make(6706, 22, s => { s.order.coup = 140; s.order.squadre = 55; })],
  ['不养兵（兵力 2000、驻军 22、coup 140）', make(2000, 22, s => { s.order.coup = 140; })],
  ['中等（兵力 8000、驻军 22、coup 140）', make(8000, 22, s => { s.order.coup = 140; })],
  ['认真养兵（兵力 11000、驻军 22、coup 140）', make(11000, 22, s => { s.order.coup = 140; })],
  ['加驻军（兵力 11000、驻军 45、coup 140）', make(11000, 45, s => { s.order.coup = 140; })],
  ['满编（兵力 15000、驻军 60、coup 140）', make(15000, 60, s => { s.order.coup = 140; })],
  ['内部分裂（兵力 11000、异议 60）', make(11000, 22, s => {
    s.order.coup = 140;
    W.FACTIONS.forEach(f => { s.factions[f.id].dis = 60; });
  })],
];
cases.forEach(([label, s]) => {
  const r = R.resolveBattle(s);
  console.log('  ' + label.padEnd(42) + ' 守 ' + String(Math.round(r.defender)).padStart(7)
    + ' / 攻 ' + String(Math.round(r.attacker)).padStart(7)
    + '  比 ' + r.ratio.toFixed(2).padStart(6) + '  → ' + r.state);
});
