/* 隔离实验：新增事件是否改变了既有对局？
   做法：从 Eng.ALL_EVENTS 里剔除新事件（保持引擎与数据改动不变），
   再跑与 smoke.js 相同的脚本化对局，对比是否回到改动前的行为。
   注意：事件注册表按源码顺序保留，抽卡/调度依赖顺序，所以顺序本身也是变量。 */
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
const F = globalThis.Fiume, Eng = F.Engine, Core = F.Core, R = F.Rules, W = F.World;
const NEW = ['ev_1920_06_romafronte', 'ev_romafronte_mussolini', 'ev_romafronte_malatesta',
  'ev_romafronte_bombacci', 'ev_romafronte_gramsci', 'ev_1920_09_romafronte', 'ev_romafronte_epilogo'];
const ALL = Eng.ALL_EVENTS.slice();

/* Rebuild the engine's lookup tables from the registry array it was built with.
   EVENT_BY_ID is private, so we exercise pickEvent through Eng.ALL_EVENTS by
   temporarily swapping its contents. */
function withEvents(list, fn) {
  const saved = Eng.ALL_EVENTS.slice();
  Eng.ALL_EVENTS.length = 0;
  list.forEach(e => Eng.ALL_EVENTS.push(e));
  // EVENT_BY_ID is captured at module load; the id -> event map used by
  // EVENTS is internal. Rebuild via a fresh require is not possible here, so we
  // also patch the map the engine exposes.
  const savedMap = Object.assign({}, Eng.EVENT_BY_ID);
  NEW.forEach(id => { if (!list.some(e => e.id === id)) delete Eng.EVENT_BY_ID[id]; });
  NEW.forEach(id => {
    const found = saved.find(e => e.id === id);
    if (list.some(e => e.id === id) && found) Eng.EVENT_BY_ID[id] = found;
  });
  try { return fn(); } finally {
    Eng.ALL_EVENTS.length = 0; saved.forEach(e => Eng.ALL_EVENTS.push(e));
    Object.keys(Eng.EVENT_BY_ID).forEach(k => delete Eng.EVENT_BY_ID[k]);
    Object.assign(Eng.EVENT_BY_ID, savedMap);
  }
}

function playGame(scenarioId, difficultyId, seed, strategy) {
  let s = Eng.createState(scenarioId, difficultyId, seed);
  let guard = 0;
  while (s.phase !== 'ended' && guard++ < 400) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s.currentEvent = null; continue; }
      const opts = ev.options.filter(o => !o.condition || o.condition(s));
      const chosen = strategy ? strategy(s, ev, opts) : opts[0];
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (chosen || opts[0]).id }).state;
    } else {
      let plays = 0;
      while (plays++ < 6) {
        if (s.hand.length < s.handLimit) {
          const decks = F.Sel.decks(s).filter(d => d.drawable);
          if (decks.length) {
            const d = decks[Math.floor(Math.random() * decks.length)];
            const pickD = d.cards[Math.floor(Math.random() * d.cards.length)];
            s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: pickD.id }).state;
          }
        }
        const opts = F.Sel.hand(s).filter(c => c.playable && c.cost.funds <= s.funds);
        if (!opts.length) break;
        const pick = opts[Math.floor(Math.random() * opts.length)];
        let res = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pick.id });
        if (res.state === s) break;
        s = res.state;
        if (s.pendingCard) {
          const card = Eng.CARD_BY_ID[s.pendingCard];
          const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
          if (!oo.length) break;
          s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OP', optionId: oo[0].id }).state;
        }
      }
      s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
    }
  }
  return { state: s, turns: guard };
}

function runNoOp(scenarioId, untilYM) {
  let s = Eng.createState(scenarioId, 'historical', 4242);
  const marks = {};
  let guard = 0;
  const done = () => (s.date.y * 12 + s.date.m) >= untilYM || s.phase === 'ended';
  while (!done() && guard++ < 600) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s.currentEvent = null; continue; }
      const opts = ev.options.filter(o => !o.condition || o.condition(s));
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
    } else {
      s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
    }
    if (s.flags.natale_done && !marks.natale) marks.natale = s.date.y + '-' + s.date.m;
    if (s.flags.coup_done && !marks.coup) marks.coup = s.date.y + '-' + s.date.m;
  }
  return { state: s, marks, steps: guard };
}

const WITHOUT = ALL.filter(e => !NEW.includes(e.id));

function report(tag, list) {
  console.log(`\n--- ${tag}（${list.length} 个事件）---`);
  withEvents(list, () => {
    const g1 = playGame('1919-09', 'historical', 12345, (s, ev, opts) => opts[0]);
    console.log(`  1) 史实/首选项: ${g1.state.ending} @ ${g1.state.date.y}-${g1.state.date.m} · ${g1.turns} 回合`
      + ` · 吞吐 ${g1.state.economy.traffic.toFixed(1)} · 人口 ${Math.round(g1.state.economy.population)}`);
    const g3 = playGame('1919-09', 'open', 777, (s, ev, opts) => opts[Math.floor(Math.random() * opts.length)]);
    console.log(`  3) 架空/随机:   ${g3.state.ending} @ ${g3.state.date.y}-${g3.state.date.m} · ${g3.turns} 步`
      + ` · 人口 ${Math.round(g3.state.economy.population)}`);
    const noop = runNoOp('1919-09', 1921 * 12 + 4);
    const res = R.election(noop.state, Core.makeRng(9));
    console.log(`  4) 血腥圣诞: ${noop.marks.natale || '未发生'} · 城区首位 ${res.detail.cityWinner}`
      + ` · 自治派阵营 ${['AUT', 'PAD', 'PCR'].reduce((a, k) => a + (res.seats[k] || 0), 0)} 席`
      + ` / 兼并列 ${['LEG', 'ANI'].reduce((a, k) => a + (res.seats[k] || 0), 0)} 席`);
    const r5 = runNoOp('1919-09', 1923 * 12 + 12);
    console.log(`  5) 血腥圣诞 ${r5.marks.natale || '未发生'} · 法西斯接管 ${r5.marks.coup || '未发生'}`);
    let sawNew = false;
    const rr = runNoOp('1919-09', 1923 * 12 + 12);
    Object.keys(rr.state.journals).forEach(k => { if (k === 'marcia_1920') sawNew = true; });
    console.log(`  6) 默认线是否误开新日志 marcia_1920: ${sawNew ? '是（问题）' : '否'}`);
  });
}

report('A. 剔除新事件（应还原为改动前行为）', WITHOUT);
report('B. 含新事件（当前状态）', ALL);
