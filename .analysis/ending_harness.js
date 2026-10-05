/* 结局验证驱动器（只读验证工具，不修改 src/）
   用无头引擎真实跑完整对局，验证每个结局是否可达。

   用法：
     node .analysis/ending_harness.js list            列出所有结局与 check 条件
     node .analysis/ending_harness.js probe <seed>    跑一局对照策略并打印全过程
     node .analysis/ending_harness.js run <plan> <n>  用某个策略跑 n 局，统计结局分布
*/
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, S = F.Sel, W = F.World, Meta = F.Meta;

module.exports = { F, Eng, R, S, W, Meta };

/* ======================================================================
   通用对局循环：需要调用方提供一个 plan 对象
   plan = {
     event(s, ev)  -> optionId | null   // 事件决策
     card(s, opts) -> cardId | null     // 本月要打出的卡（反复调用直到返回 null）
     option(s, card, opts) -> optionId  // 卡牌选项
     tax(s) -> {...}                    // 税率
     advisor(s) -> id | null
     posture(s) -> id
   }
   ====================================================================== */
function playGame(seed, plan, opts) {
  opts = opts || {};
  const trace = opts.trace ? [] : null;
  let s = Eng.createState('1919-09', 'historical', seed);
  let guard = 0;
  let lastDraw = null;

  function log(msg) { if (trace && trace.length < 3000) trace.push(msg); }

  while (s.phase !== 'ended' && guard++ < (opts.maxSteps || 3000)) {
    /* ---- 1. 事件必须优先处理 ---- */
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      let pickId = plan.event ? plan.event(s, ev, avail) : null;
      let pick = avail.find(o => o.id === pickId);
      if (!pick) { pick = avail[0]; pickId = pick && pick.id; }
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      log(`${s.date.y}-${String(s.date.m).padStart(2, '0')} 事件 ${ev.id} → ${pick.id}`);
      const res = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id });
      if (res.state === s) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      s = res.state;
      continue;
    }

    /* ---- 2. 月度：税 / 姿态 / 顾问 / 打牌 ---- */
    if (plan.tax) {
      const t = plan.tax(s) || {};
      for (const k of Object.keys(t)) s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: t[k] }).state;
    }
    if (plan.posture) {
      const p = plan.posture(s);
      if (p && p !== s.posture) s = Eng.dispatch(s, { type: 'SET_POSTURE', posture: p }).state;
    }
    if (plan.advisor) {
      const a = plan.advisor(s);
      if (a) { const r = Eng.dispatch(s, { type: 'HIRE_ADVISOR', advisorId: a }); if (r.state !== s) s = r.state; }
    }
    if (plan.useAdvisor) {
      const a = plan.useAdvisor(s);
      if (a) { const r = Eng.dispatch(s, { type: 'USE_ADVISOR', advisorId: a }); if (r.state !== s) s = r.state; }
    }

    let plays = 0;
    while (plays++ < (opts.maxPlays || 12)) {
      /* 抽牌 */
      const decks = S.decks(s).filter(d => d.drawable);
      const want = plan.draw ? plan.draw(s, decks) : null;
      if (s.hand.length < s.handLimit) {
        let drew = false;
        if (want) {
          for (const d of decks) if (d.cards.some(c => c.id === want)) {
            const r = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: want });
            if (r.state !== s) { s = r.state; drew = true; }
            break;
          }
        } else {
          /* 史实模式点了牌堆就抽一张：用 DRAW_RANDOM */
          const r = Eng.dispatch(s, { type: 'DRAW_RANDOM' });
          if (r.state !== s) { s = r.state; drew = true; }
        }
        if (!drew) break;
      }
      const handView = S.hand(s).filter(c => c.playable);
      const pickId = plan.card ? plan.card(s, handView) : (handView[0] && handView[0].id);
      const pick = handView.find(c => c.id === pickId);
      if (!pick) break;
      const res = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pick.id });
      if (res.state === s) break;
      s = res.state;
      if (s.pendingCard) {
        const card = Eng.CARD_BY_ID[s.pendingCard];
        const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
        let oid = plan.option ? plan.option(s, card, oo) : null;
        let o = oo.find(x => x.id === oid) || oo[0];
        if (o) {
          const r2 = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: o.id });
          if (r2.state !== s) s = r2.state;
        } else break;
      }
      if (s.phase === 'ended') break;
    }

    /* ---- 3. 推进 ---- */
    const before = s;
    const adv = Eng.dispatch(s, { type: 'ADVANCE' });
    if (adv.state === before) break; /* 卡住 */
    s = adv.state;
  }
  return { s, trace, steps: guard };
}

module.exports.playGame = playGame;

/* ---------------- CLI ---------------- */
if (require.main === module) {
  const cmd = process.argv[2] || 'list';
  if (cmd === 'list') {
    console.log('=== 结局判定顺序（priority 升序） ===');
    Meta.ENDINGS.slice().sort((a, b) => a.priority - b.priority).forEach(e => {
      console.log(`  ${String(e.priority).padStart(5)}  ${e.id.padEnd(24)} [${e.route}] ${e.tag}  ${e.zh}`);
    });
    console.log(`\n共 ${Meta.ENDINGS.length} 条 ENDINGS 记录`);
    console.log('MAX_END =', JSON.stringify(W.MAX_END), ' START =', JSON.stringify(W.START));
  }
}
