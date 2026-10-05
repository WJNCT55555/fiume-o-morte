'use strict';
/* 验证：ending_bloody_history 不再是全局抢占者之后，fiume_o_morte 能否触发？
   难点是 commune(8) 排在它(10.5)之前且共享 carta_done ——
   所以要让 syndacalisti.inf 停在 60 以下，把 commune 的门槛卡住。 */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, R, Meta } = H;

/* 目标：carta_done + porto_revived + traffic>=85，但 commune 不成立 */
const GOAL = {
  label: '阜姆或死亡（避开公社）',
  flags: ['carta_done', 'porto_revived'],
  traffic: { gte: 85, w: 6 },
  laws: { elettorale: 3, cittadinanza: 2, ordine: 2, stampa: 2, scuola: 1, lingua: 1, lavoro: 3, portofranco: 3, dogana: 3 },
  violence: 'down',
  drawOrder: ['governo', 'azione'],
  posture: 'equidistant',
  noCoup: true,
  /* 关键：commune 要 lavoro>=3 && fisco>=2 && sindacalisti.inf>=60 && forze.sindacalisti>=55。
     把 sindacalisti.inf 与 forze.sindacalisti 都压在门槛下即可躲开它。*/
  blocks: [
    { path: 'factions.sindacalisti.inf', gte: 60, card: null },
    { path: 'forze.sindacalisti', gte: 55, card: null },
  ],
};
ST.GOALS.fom_avoid_comune = GOAL;

const EV = Object.assign({}, V.EVENTS.fiume_o_morte || {}, {
  ev_1920_01_deambris: ['assumere'],
  ev_carta_programma: ['programma'],
  ev_1920_09_carta: ['a'],
  ev_carta_dibattito: ['a'],
  ev_1920_06_alleati: ['a'],
});

const agent = ST.makeAgent('fom_avoid_comune', EV, V.OPTS);
let s = Eng.createState('1919-09', 'historical', 100);
let g = 0;
while (s.phase !== 'ended' && g++ < 6000) {
  if (s.currentEvent) {
    const ev = Eng.EVENT_BY_ID[s.currentEvent];
    if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
    const avail = ev.options.filter(o => !o.condition || o.condition(s));
    const pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
    if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
    s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
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

console.log('=== 阜姆或死亡（避开公社门槛）===');
console.log('  ending=' + s.ending + ' @' + s.date.y + '-' + s.date.m);
console.log('  carta_done=' + !!s.flags.carta_done + '  porto_revived=' + !!s.flags.porto_revived
  + '  traffic=' + Math.round(s.economy.traffic) + '  coup_done=' + !!s.flags.coup_done);
console.log('  commune 门槛：lavoro=' + s.laws.lavoro + '(≥3) fisco=' + s.laws.fisco + '(≥2)'
  + ' sind.inf=' + Math.round(s.factions.sindacalisti.inf) + '(≥60) forze.sind=' + Math.round(s.forze.sindacalisti) + '(≥55)');
const cm = Meta.ENDINGS.filter(e => e.id === 'ending_comune')[0];
const fom = Meta.ENDINGS.filter(e => e.id === 'ending_fiume_o_morte')[0];
console.log('  commune.check=' + !!cm.check(s) + '  fiume_o_morte.check=' + !!fom.check(s));
console.log('  → 命中: ' + R.resolveEnding(s).id);
