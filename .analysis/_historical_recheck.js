'use strict';
/* 重审：移除威尼斯后，各结局的可达性
   关键问题：ending_historical（要活到 1924）会不会被 ending_comune（宪章链完成即触发）抢先？
   答案取决于「史实线玩家本来会不会走完宪章」——不会。
   本探针试一条「不颁布宪章」的史实线。 */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, S, W, Meta } = H;

/* 在 historical 目标基础上加「避开宪章」约束 */
function makeNoCharterAgent() {
  const agent = ST.makeAgent('historical', V.EVENTS.historical, V.OPTS);
  agent.evGated = {
    /* 德·安布里斯：可以让他来（历史如此），但不开立法纲领 */
    ev_1920_01_deambris: [['assumere', () => false]],
    /* 阳台宪章：选「只读诗」而不是颁布 */
    ev_1920_09_carta: [['c', () => true], ['b', () => true]],
    ev_carta_dibattito: [['c', () => true], ['b', () => true]],
    /* 罗马阵线：留在阜姆（史实选择） */
    ev_1920_06_romafronte: [['restare', () => true]],
    /* 压住党内轴，避免政变 */
    ev_violence: [['c', () => true]],
    ev_strike: [['b', () => true]],
    ev_1920_10_adunata: [['discorso', () => true]],
  };
  /* 不打会推进宪章日志的政府卡 */
  const base = agent.card.bind(agent);
  agent.card = (s, hv) => base(s, hv.filter(c => c.id !== 'gv_arengo'));
  const baseOpt = agent.option.bind(agent);
  agent.option = (s, card, oo) => baseOpt(s, card, oo);
  return agent;
}

function runNoCharter(seed, diff) {
  const agent = makeNoCharterAgent();
  let s = Eng.createState('1919-09', diff || 'historical', seed);
  let g = 0;
  while (s.phase !== 'ended' && g++ < 8000) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      const gated = (agent.evGated || {})[ev.id];
      let pick = null;
      if (gated) for (const [id, pred] of gated) { if (avail.some(o => o.id === id) && pred(s)) { pick = avail.find(o => o.id === id); break; } }
      if (!pick) pick = avail.find(o => o.id === agent.event(s, ev, avail)) || avail[0];
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
  return s;
}

console.log('=== 「不颁布宪章」的史实线 ===');
const dist = {};
for (const seed of [100, 137, 174, 211, 248, 285, 322]) {
  const s = runNoCharter(seed);
  const k = s.ending + ' @' + s.date.y + '-' + s.date.m;
  dist[k] = (dist[k] || 0) + 1;
  console.log(`  seed ${String(seed).padStart(4)} → ${String(s.ending).padEnd(22)} @${s.date.y}-${String(s.date.m).padStart(2, '0')}`
    + `  人口${String(Math.round(s.economy.population)).padStart(6)} coup=${String(!!s.flags.coup_done).padEnd(5)}`
    + ` treaty=${String(!!s.flags.treaty_rome).padEnd(5)} carta=${String(!!s.flags.carta_done).padEnd(5)}`
    + ` 自由港${s.laws.portofranco} 吞吐${Math.round(s.economy.traffic)}`);
}
console.log('\n  分布:', JSON.stringify(dist));
