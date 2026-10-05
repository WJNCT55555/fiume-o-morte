'use strict';
/* 用户的问题：围攻打赢了，不就能绕开「血腥的历史」，走到 fiume_o_morte 吗？
   本探针：造一个「守住围攻」的对局，然后让它跑到 1924，逐记录结局竞争。 */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, Meta, R } = H;

/* 守方要赢：兵力够大。先用「认真养兵」策略跑，再在 ev_natale_fight 强制赢。 */
const EV = Object.assign({}, V.EVENTS.comune || {}, {
  ev_1920_01_deambris: ['assumere'],
  ev_carta_programma: ['programma'],
  ev_1920_09_carta: ['a'],
  ev_carta_dibattito: ['a'],
  ev_1920_06_alleati: ['a'],
  ev_natale: ['resistere'],
  ev_natale_fight: ['tenere'],
  ev_natale_after: ['restare'],
});

const agent = ST.makeAgent('comune', EV, V.OPTS);
let s = Eng.createState('1919-09', 'historical', 100);
let guard = 0;
const log = [];
let sawNatale = false, siegeResult = null;

while (s.phase !== 'ended' && guard++ < 8000) {
  if (s.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
    if (ev.id === 'ev_natale') sawNatale = true;
    if (ev.id === 'ev_natale_fight') {
      const r = R.resolveBattle(s, { defenderPower: R.battleForces(s, 'defender') });
      siegeResult = r;
      log.push(`${s.date.y}-${String(s.date.m).padStart(2,'0')} ev_natale_fight: 守 ${Math.round(r.defender)} / 攻 ${Math.round(r.attacker)} 比 ${r.ratio.toFixed(2)} → ${r.state}`);
    }
    const avail = ev.options.filter(o => !o.condition || o.condition(s));
    const pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
    if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
    const before = { t: !!s.flags.treaty_rome, b: !!s.flags.bloody_history };
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
    if (!before.t && s.flags.treaty_rome) log.push(`${s.date.y}-${String(s.date.m).padStart(2,'0')} ${ev.id}:${pick.id} → 设 treaty_rome`);
    if (s.phase === 'ended') break;
    continue;
  }
  const t = agent.tax(s);
  for (const k of Object.keys(t)) s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: t[k] }).state;
  const p = agent.posture(s);
  if (p && p !== s.posture) s = Eng.dispatch(s, { type: 'SET_POSTURE', posture: p }).state;
  let plays = 0;
  while (plays++ < 18) {
    if (s.phase === 'ended') break;
    if (s.hand.length < s.handLimit) {
      const decks = S.decks(s).filter(d => d.drawable);
      const d = agent.draw(s, decks);
      if (d) { const r = Eng.dispatch(s, { type: 'DRAW_RANDOM', deck: d }); if (r.state !== s) s = r.state; }
    }
    const hv = S.hand(s).filter(c => c.playable);
    const cid = agent.card(s, hv);
    const pc = hv.find(c => c.id === cid);
    if (!pc) break;
    const r = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pc.id });
    if (r.state === s) break;
    s = r.state;
    if (s.pendingCard) {
      const card = Eng.CARD_BY_ID[s.pendingCard];
      const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
      const o = oo.find(x => x.id === agent.option(s, card, oo)) || oo[0];
      if (!o) break;
      const r2 = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: o.id });
      if (r2.state !== s) s = r2.state;
    }
  }
  const before = s;
  const adv = Eng.dispatch(s, { type: 'ADVANCE' });
  if (adv.state === before) break;
  s = adv.state;
}

console.log('=== 时间线 ===');
log.forEach(l => console.log('  ' + l));
console.log('');
console.log('  ev_natale 触发过: ' + sawNatale);
console.log('  围攻结算: ' + (siegeResult ? siegeResult.state + ' (比 ' + siegeResult.ratio.toFixed(2) + ')' : '未到'));
console.log('');
console.log('=== 终局 ===');
console.log('  ending = ' + s.ending + '  @' + s.date.y + '-' + s.date.m);
console.log('  flags: treaty_rome=' + !!s.flags.treaty_rome + '  siege_held=' + !!s.flags.siege_held
  + '  bloody_history=' + !!s.flags.bloody_history + '  carta_done=' + !!s.flags.carta_done
  + '  porto_revived=' + !!s.flags.porto_revived);
console.log('  吞吐=' + Math.round(s.economy.traffic) + '  coup_done=' + !!s.flags.coup_done);
console.log('');
console.log('=== 若终局那一刻重新判定，谁赢？ ===');
Meta.ENDINGS.slice().sort((a,b)=>a.priority-b.priority).forEach(e => {
  let v = false; try { v = !!e.check(s); } catch (err) { v = false; }
  if (v) console.log('  ✅ priority ' + String(e.priority).padStart(5) + '  ' + e.id + '  (' + e.zh + ')');
});
console.log('');
console.log('  fiume_o_morte 的门槛: porto_revived && traffic>=85 && !coup_done && carta_done && date>=1924-12');
console.log('  当前 date = ' + s.date.y + '-' + s.date.m + ' → date>=1924-12 满足吗: '
  + (s.date.y > 1924 || (s.date.y === 1924 && s.date.m >= 12)));
