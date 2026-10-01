/* 参照策略实测：一个有能力的玩家能不能把三股力量推过 80？
   关键是「选三股、冷落第四股」——对抗是自动的，所以放弃谁决定成败。 */
'use strict';
const path = require('path');
const fs = require('fs');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));
require.extensions['.ts'] = (module, filename) => {
  const src = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const base = path.join(__dirname, '..', 'src');
for (const f of ['lib/core.js', 'game/data/world.js', 'game/data/parties.js', 'game/data/factions.js',
  'game/data/meta.js', 'game/engine/rules.js', 'game/registries/contentRegistry.ts',
  'game/engine/reducers.js', 'game/engine/selectors.js']) {
  require(path.join(base, f));
}
const F = globalThis.Fiume, Eng = F.Engine, S = F.Sel, Core = F.Core;

/* 四股两两对抗权重（来自 W.FORZA_ANTAGONISM）：
     fascisti   → anarchici 3, comunisti 4
     socialisti → fascisti 2
     anarchici  → forzearmate 2
     comunisti  → fascisti 4, forzearmate 2
   选「法西斯 + 社会党 + 无政府主义者」时，对法西斯的惩罚来自社会党(2)、
   对无政府主义者的来自法西斯(3)，社会党无惩罚。这是最优三股组合。 */
function makePlan(keep) {
  const P = { ev_1920_06_romafronte: 'ufficiali' };
  /* Event ids still carry the names of the people the meetings are with; the
     forze keys are movements. This is the mapping between the two. */
  const MEET = {
    fascisti: 'ev_romafronte_mussolini',
    socialisti: 'ev_romafronte_bombacci',
    anarchici: 'ev_romafronte_malatesta',
    comunisti: 'ev_romafronte_gramsci'
  };
  const op = {
    fascisti:   { keep: 'patto', drop: 'rifiuto' },
    socialisti: { keep: 'legge', drop: 'congedare' },
    anarchici:  { keep: 'insurrezione', drop: 'chiudere' },
    comunisti:  { keep: 'firma', drop: 'no' }
  };
  Object.keys(MEET).forEach(k => {
    P[MEET[k]] = keep.includes(k) ? op[k].keep : op[k].drop;
  });
  /* Corradini has no conversation of his own yet: he is reachable only through
     the card option, which the probe does not play. So a plan that "keeps" him
     simply makes no move against him. */
  P.ev_1920_09_romafronte = 'aspettare';
  return P;
}

function run(seed, PLAN, trace) {
  let s = Eng.createState('1919-09', 'historical', seed);
  let g = 0;
  const best = { allied: 0, at: null, forces: null };
  while (s.phase !== 'ended' && g++ < 400) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s.currentEvent = null; continue; }
      const opts = ev.options.filter(o => !o.condition || o.condition(s));
      if (!opts.length) { s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: ev.options[0].id }).state; continue; }
      const pick = opts.find(o => o.id === PLAN[ev.id]) || opts[0];
      if (trace && /romafronte/.test(ev.id)) {
        trace.push(`   ${s.date.y}-${String(s.date.m).padStart(2, '0')} ${ev.id} → ${pick.id}`);
      }
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
    } else {
      for (const k of ['porto', 'dogana', 'consumo', 'reddito']) {
        s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: 0.9 }).state;
      }
      let plays = 0;
      while (plays++ < 4) {
        if (s.hand.length < s.handLimit) {
          const decks = S.decks(s).filter(d => d.drawable);
          const pref = ['gv_bilancio', 'az_arditi', 'az_cucine', 'az_volantini', 'gv_nave', 'gv_lavori', 'gv_portofranco'];
          let drew = false;
          for (const id of pref) {
            for (const d of decks) if (d.cards.some(c => c.id === id)) {
              s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: id }).state; drew = true; break;
            }
            if (drew) break;
          }
          if (!drew) break;
        }
        const cards = S.hand(s).filter(c => c.playable);
        const pick = cards.find(c => ['gv_bilancio', 'az_arditi', 'az_cucine', 'az_volantini', 'gv_nave'].includes(c.id)) || cards[0];
        if (!pick) break;
        const res = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pick.id });
        if (res.state === s) break;
        s = res.state;
        if (s.pendingCard) {
          const card = Eng.CARD_BY_ID[s.pendingCard];
          const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
          if (oo.length) s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: oo[0].id }).state;
        }
      }
      s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
    }
    const z = S.forze(s);
    if (z.alliedCount > best.allied) {
      best.allied = z.alliedCount;
      best.at = s.date.y + '-' + s.date.m;
      best.forces = z.front.map(x => `${x.zh} ${x.value}`).join(' / ');
    }
  }
  const j = s.journals.marcia_1920;
  return {
    s, best,
    opened: !!j, done: !!(j && j.done), failed: !!(j && j.failed),
    milizia: Math.round(s.order.milizia), officer: S.forze(s).officer.value,
    allied: S.forze(s).alliedCount, ending: s.ending, date: s.date.y + '-' + s.date.m
  };
}

const TRIOS = [
  ['fascisti', 'socialisti', 'anarchici'],
  ['fascisti', 'corradini', 'anarchici'],
  ['corradini', 'fascisti', 'socialisti'],
  ['fascisti', 'socialisti', 'comunisti'],
  ['socialisti', 'anarchici', 'comunisti']
];

for (const keep of TRIOS) {
  console.log(`\n=== 保留三股：${keep.join(' + ')}（冷落 ${['fascisti', 'socialisti', 'anarchici', 'comunisti'].filter(k => !keep.includes(k))[0]}）===`);
  const PLAN = makePlan(keep);
  const trace = [];
  const r = run(101, PLAN, trace);
  trace.forEach(t => console.log(t));
  console.log(`   兵力 ${r.milizia} · 军官团 ${r.officer} · 结盟 ${r.allied}/4`);
  console.log(`   峰值结盟 ${r.best.allied}/4 @ ${r.best.at}  [${r.best.forces}]`);
  console.log(`   日志 开启=${r.opened} 完成=${r.done} 失败=${r.failed} · 结局 ${r.ending} @ ${r.date}`);
}

console.log('\n=== 30 个种子 × 最优三股 ===');
const best = makePlan(TRIOS[0]);
let opened = 0, done = 0, failed = 0, peakAllied = 0, peakMil = 0, endings = {};
for (let i = 0; i < 30; i++) {
  const r = run(1000 + i * 13, best);
  if (r.opened) opened++;
  if (r.done) done++;
  if (r.failed) failed++;
  peakAllied = Math.max(peakAllied, r.best.allied);
  peakMil = Math.max(peakMil, r.milizia);
  endings[r.ending] = (endings[r.ending] || 0) + 1;
}
console.log(`   开启 ${opened}/30 · 完成 ${done} · 失败 ${failed}`);
console.log(`   峰值结盟 ${peakAllied}/4 · 兵力峰值 ${peakMil}`);
console.log('   结局分布:', JSON.stringify(endings));
