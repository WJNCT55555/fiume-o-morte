/* 引擎冒烟测试：在 Node 中跑完整对局，检查不变量。
   用法： node tools/smoke.js  */
'use strict';
const path = require('path');
const fs = require('fs');
const ts = require('typescript');
const base = path.join(__dirname, '..', 'src');

// The content modules are TypeScript, but the deterministic engine can still
// run directly in Node without starting Vite or mounting React.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(output.outputText, filename);
};

require(path.join(base, 'lib', 'core.js'));
require(path.join(base, 'game', 'data', 'world.js'));
require(path.join(base, 'game', 'data', 'parties.js'));
require(path.join(base, 'game', 'data', 'factions.js'));
require(path.join(base, 'game', 'data', 'meta.js'));
require(path.join(base, 'game', 'engine', 'rules.js'));
require(path.join(base, 'game', 'registries', 'contentRegistry.ts'));
require(path.join(base, 'game', 'engine', 'reducers.js'));
require(path.join(base, 'game', 'engine', 'selectors.js'));

const F = globalThis.Fiume;
const { Core, World: W, Rules: R, Engine: Eng, Meta } = F;

let fails = 0;
function ok(cond, msg) {
  if (!cond) { fails++; console.log('  ✗ ' + msg); }
}

const portraitDir = path.join(__dirname, '..', 'public', 'img', 'Portrait');
fs.readdirSync(portraitDir).forEach(file => {
  ok(/^Portrait_[A-Z][A-Za-z0-9]*(?:_[A-Z][A-Za-z0-9]*)*\.(?:jpg|png|webp)$/.test(file), `portrait filename ${file}`);
});
W.PARTIES.forEach(party => {
  ok(!!party.leader?.zh && !!party.leader?.it, `party ${party.id} needs a named leader`);
  if (party.leader?.portrait) ok(fs.existsSync(path.join(__dirname, '..', 'public', party.leader.portrait)), `party ${party.id} portrait is missing`);
  if (party.player) ok(!!party.emblem && fs.existsSync(path.join(__dirname, '..', 'public', party.emblem)), `playable party ${party.id} emblem is missing`);
});
ok(W.PARTIES.filter(p => p.player).map(p => p.id).join(',') === 'LEG,AUT,PSI', 'only Legion, Autonomists, and Socialists are playable');
const imageManifest = require(path.join(__dirname, '..', 'public', 'img', 'manifest.json'));
Object.entries(imageManifest).forEach(([key, item]) => {
  ok(fs.existsSync(path.join(__dirname, '..', 'public', 'img', item.file)), `manifest image ${key} is missing`);
});

function checkInvariants(s, tag) {
  W.CLASSES.forEach(c => {
    const cls = s.classes[c.id];
    const t = Core.sum(cls.support);
    ok(Math.abs(t - 100) < 0.6, `[${tag}] support row ${c.id} sums to ${t.toFixed(2)}`);
    Object.keys(cls.support).forEach(p => {
      ok(cls.support[p] >= -0.001, `[${tag}] negative support ${c.id}.${p} = ${cls.support[p]}`);
    });
    // Turnout is the only per-class trait left; ownership and the old
    // organization / militancy pair were removed from the model.
    ok(cls.turnout >= 0 && cls.turnout <= 100, `[${tag}] class ${c.id}.turnout=${cls.turnout}`);
  });
  W.FACTIONS.forEach(f => {
    const x = s.factions[f.id];
    ok(!!x, `[${tag}] faction ${f.id} missing`);
    if (x) ok(x.dis >= 0 && x.dis <= 100, `[${tag}] faction ${f.id}.dis=${x.dis}`);
  });
  const tot = W.FACTIONS.reduce((a, f) => a + (s.factions[f.id] ? s.factions[f.id].inf : 0), 0);
  ok(Math.abs(tot - 100) < 0.6, `[${tag}] faction influence sums to ${tot.toFixed(2)}`);
  // The ownership pies (unions / land / industry) were removed from the model.
  const fi = W.FACTIONS.reduce((a, f) => a + s.factions[f.id].inf, 0);
  ok(Math.abs(fi - 100) < 0.6, `[${tag}] factions inf sums ${fi}`);
  W.FACTIONS.forEach(f => ok(s.factions[f.id].dis >= 0 && s.factions[f.id].dis <= 100, `[${tag}] dis ${f.id}`));
  ['authority', 'garrison', 'fervour', 'squadre', 'violence'].forEach(k => {
    ok(s.order[k] >= 0 && s.order[k] <= 100, `[${tag}] order.${k}=${s.order[k]}`);
  });
  ok(s.order.milizia >= 0, `[${tag}] milizia negative`);
  ok(R.produzione(s) >= 0 && R.produzione(s) <= 100, `[${tag}] produzione out of range`);
  ok(R.pressione(s) >= 0 && R.pressione(s) <= 100, `[${tag}] pressione out of range`);
  Object.keys(s.diplo).forEach(k => ok(s.diplo[k] >= 0 && s.diplo[k] <= 100, `[${tag}] diplo.${k}=${s.diplo[k]}`));
  W.LAWS.forEach(L => ok(s.laws[L.id] >= 0 && s.laws[L.id] <= L.max, `[${tag}] law ${L.id}=${s.laws[L.id]}`));
  ok(s.ap >= 0, `[${tag}] ap negative`);
  ok(s.funds >= 0, `[${tag}] funds negative`);
  ok(s.economy.population > 20000, `[${tag}] population collapsed ${s.economy.population}`);
  const seats = Core.sum(s.assembly);
  ok(seats === 0 || seats === 76, `[${tag}] assembly seats = ${seats}`);
  ok(s.legitimacy >= 0 && s.legitimacy <= 100, `[${tag}] legitimacy=${s.legitimacy}`);
  try { JSON.parse(JSON.stringify(s)); } catch (e) { ok(false, `[${tag}] not serializable: ${e.message}`); }
}

function playGame(scenarioId, difficultyId, seed, strategy) {
  let s = Eng.createState(scenarioId, difficultyId, seed);
  checkInvariants(s, scenarioId + '/start');
  let guard = 0;
  while (s.phase !== 'ended' && guard++ < 400) {
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      const opts = ev.options.filter(o => !o.condition || o.condition(s));
      const chosen = strategy ? strategy(s, ev, opts) : opts[0];
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: (chosen || opts[0]).id }).state;
    } else {
      let plays = 0;
      while (plays++ < 6) {
        // Draw from a deck into a free reserved slot first.
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
        // Multi-option cards need a second dispatch to settle.
        if (s.pendingCard) {
          const card = Eng.CARD_BY_ID[s.pendingCard];
          const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
          if (!oo.length) { s = Eng.dispatch(s, { type: 'CANCEL_CARD' }).state; break; }
          s = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: oo[Math.floor(Math.random() * oo.length)].id }).state;
        }
      }
      s = Eng.dispatch(s, { type: 'ADVANCE' }).state;
    }
    if (guard % 10 === 0) checkInvariants(s, scenarioId + '/' + s.date.y + '-' + s.date.m);
  }
  checkInvariants(s, scenarioId + '/end');
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

console.log('=== 卡尔纳罗摄政 · 引擎冒烟测试 ===\n');

const legionStart = Eng.createState('1919-09', 'open', 777, 'LEG');
ok(legionStart.playerForce === 'LEG', 'new games must control the selected Legion');
ok(Object.values(legionStart.cabinet).every(force => force === 'LEG'), 'initial Rector seats must belong to the Legion');
for (const [force, opening] of [['AUT', 'ev_1919_09_autonomi'], ['PSI', 'ev_1919_09_socialisti']]) {
  const start = Eng.createState('1919-09', 'open', 777, force);
  ok(start.playerForce === force, `${force} must remain the selected player force`);
  ok(start.currentEvent === opening, `${force} needs its own opening event`);
  ok(Object.values(start.cabinet).every(owner => owner === 'LEG'), `${force} must start in opposition`);
  const partyCards = Eng.availableCards(start).filter(card => card.deck === 'partito');
    // The party deck was removed; no party receives its own cards.
  const firstOption = force === 'PSI' ? 'porto' : 'quartieri';
  const afterOpening = Eng.dispatch(start, { type: 'RESOLVE_EVENT', optionId: firstOption }).state;
  ok(afterOpening.eventHistory.includes(opening), `${force} opening choice must resolve`);
  ok(afterOpening.playerForce === force, `${force} must survive event resolution`);
}

console.log('1) 史实难度 / 默认剧本 / 始终选第一个可用项');
const g1 = playGame('1919-09', 'historical', 12345, (s, ev, opts) => opts[0]);
console.log(`   结束 ${g1.state.date.y}-${g1.state.date.m} · ${g1.state.turn} 回合 · 结局 ${g1.state.ending}`);
console.log(`   吞吐 ${g1.state.economy.traffic.toFixed(1)} · 失业 ${g1.state.economy.unemployment.toFixed(1)}% · 人口 ${Math.round(g1.state.economy.population)}`);
console.log(`   席位 ${Object.entries(g1.state.assembly).filter(([, v]) => v > 0).map(([k, v]) => k + ' ' + v).join(' / ') || '—'}`);
console.log(`   血腥圣诞=${!!g1.state.flags.natale_done} · 法西斯接管=${!!g1.state.flags.coup_done}`);
console.log(`   成就 ${g1.state.achievements.join(', ') || '—'}`);

console.log('\n2) 架空难度 / 随机选项 / 10 次运行');
const ends = {};
for (let i = 0; i < 10; i++) {
  const g = playGame('1919-09', 'open', 1000 + i * 37, (s, ev, opts) => opts[Math.floor(Math.random() * opts.length)]);
  ends[g.state.ending] = (ends[g.state.ending] || 0) + 1;
  process.stdout.write(`   run${String(i).padStart(2)} ${String(g.state.ending).padEnd(22)} ${g.state.date.y}-${String(g.state.date.m).padStart(2, '0')}  吞吐 ${g.state.economy.traffic.toFixed(0)}  事态 ${g.state.order.coup.toFixed(0)}\n`);
}
console.log('   结局分布：', ends);

console.log('\n3) 各剧本');
W.SCENARIOS.forEach(scn => {
  const g = playGame(scn.id, 'open', 777, (s, ev, opts) => opts[Math.floor(Math.random() * opts.length)]);
  console.log(`   ${scn.id.padEnd(8)} ${String(g.turns).padStart(3)} 步 · ${g.state.date.y}-${g.state.date.m} · ${g.state.ending} · 人口 ${Math.round(g.state.economy.population)}`);
});

console.log('\n4) 史实选举基线：不干预至 1921 年 4 月应输掉选举');
{
  const noop = runNoOp('1919-09', 1921 * 12 + 4);
  const s = noop.state;
  const res = R.election(s, Core.makeRng(9));
  const fmt = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v.toFixed(1) + '%').join('  ');
  console.log('   城区：', fmt(res.detail.city));
  console.log('   子市镇：', fmt(res.detail.sub));
  console.log('   席位：', JSON.stringify(res.seats), '合计', Core.sum(res.seats));
  console.log('   血腥圣诞：' + (noop.marks.natale || '未发生'));
  ok(res.detail.cityWinner === 'AUT', '默认线城区第一应为自治党');
  const autBloc = ['AUT', 'PAD', 'PCR'].reduce((a, k) => a + (res.seats[k] || 0), 0);
  const annessBloc = ['LEG', 'ANI'].reduce((a, k) => a + (res.seats[k] || 0), 0);
  console.log('   自治派阵营 ' + autBloc + ' 席 / 兼并列阵营 ' + annessBloc + ' 席（史实重建 57 / 19）');
  ok(autBloc >= 39, `默认线自治派阵营应获绝对多数，实得 ${autBloc}`);
  ok(annessBloc >= 12 && annessBloc <= 26, `默认线兼并列阵营席位数异常：${annessBloc}`);
  ok(Core.sum(res.seats) === 76, '席位总数应为 76');
  ok(noop.marks.natale === '1920-12', '血腥圣诞应在 1920 年 12 月触发（史实：1920-12-24）');
}

console.log('\n5) 血腥圣诞与法西斯接管的时点（不干预）');
{
  const r = runNoOp('1919-09', 1923 * 12 + 12);
  console.log('   血腥圣诞：', r.marks.natale || '未发生', '（史实 1920-12）');
  console.log('   法西斯接管：', r.marks.coup || '未发生', '（史实 1922-03）');
  ok(r.marks.natale === '1920-12', '血腥圣诞应在 1920-12');
}

console.log('\n6) 存档序列化往返');
{
  const st6 = Eng.createState('1919-09', 'historical', 5);
  st6.journals['carta'] = { active: true, done: false, failed: false, months: 3 };
  const back = JSON.parse(JSON.stringify(F.Sel.Save.serialize(st6))).state;
  ok(Core.sum(back.unions).toFixed(2) === Core.sum(st6.unions).toFixed(2), '往返后工会份额一致');
  ok(JSON.stringify(back.classes) === JSON.stringify(st6.classes), '往返后阶层一致');
  ok(back.order.milizia === st6.order.milizia, '往返后军团兵力一致');
  ok(JSON.stringify(back.prev) === JSON.stringify(st6.prev), '往返后资源快照一致');
}

console.log('\n7) 派生资源读数');
{
  const s = Eng.createState('1919-09', 'historical', 11);
  const res = F.Sel.resources(s);
  console.log('   ' + res.map(r => r.zh + ' ' + r.main + (r.unit ? ' ' + r.unit : '')).join('  ·  '));
  ok(res.length === 6, '资源栏应有六格');
  ok(res.every(r => r.main !== '—'), '所有资源都应有数值');
  const dec = res.reduce((a, r) => a + (Math.abs(r.delta) > 0 ? 1 : 0), 0);
  ok(dec === 0, '新局首月不应有增减');
}

console.log('\n8) 政党 / 派系 / 阶层系统');
{
  ok(W.PARTIES.length === 6, `政党数应为 6（阜姆法西斯尚未成立），实为 ${W.PARTIES.length}`);
  ok(W.FACTIONS.length === 5, `派系数应为 5，实为 ${W.FACTIONS.length}`);
  const fids = W.FACTIONS.map(f => f.id).sort().join(',');
  ok(fids === 'arditi,fascisti,futuristi,irredentisti,sindacalisti', '派系应为 阿迪蒂/工团派/未来主义派/法西斯派/收复主义者，实为 ' + fids);
  ok(W.FACTIONS.reduce((a, f) => a + f.inf, 0) === 100, '派系初始影响力应为 100');
  const noList = W.PARTIES.filter(p => !W.MEMBER_OF[p.id]).map(p => p.id);
  ok(noList.length === 0, '存在没有选举名单归属的政党：' + noList.join(','));
  W.CLASSES.forEach(c => {
    const row = W.INITIAL_SUPPORT[c.id];
    ok(!!row, `缺少阶层支持行 ${c.id}`);
    if (!row) return;
    const t = Core.sum(row);
    ok(Math.abs(t - 100) < 0.01, `初始支持行 ${c.id} 和为 ${t}`);
    ok(!!W.CLASS_TRAITS[c.id], `缺少阶层特征 ${c.id}`);
  });
  W.PARTIES.forEach(p => {
    W.CLASSES.forEach(c => {
      ok(W.INITIAL_SUPPORT[c.id][p.id] != null, `支持矩阵缺少单元格 ${c.id}.${p.id}`);
    });
  });
  const s8 = Eng.createState('1919-09', 'historical', 99);
  const mx = F.Sel.classMatrix(s8);
  ok(mx.rows.length === 7 && mx.cols.length === 6, '矩阵应为 7 阶层 × 6 政党');
  ok(Math.abs(mx.totals.reduce((a, t) => a + t.v, 0) - 100) < 0.4, '全国支持合计应约为 100');
  console.log('   全国支持 ' + mx.totals.map(t => t.id + ' ' + t.v.toFixed(1)).join(' / '));
  console.log('   名单 ' + mx.lists.map(L => L.zh + ' ' + L.v.toFixed(1) + '%').join(' / '));
  console.log('   阶层 ' + mx.rows.map(r => r.zh + '(投票' + r.turnout.toFixed(0) + ')').join(' '));
}

console.log('\n9) 派系漂移：法西斯派在运动内部坐大');
{
  let s9 = Eng.createState('1919-09', 'historical', 7);
  const f0 = s9.factions.fascisti.inf;
  let g = 0;
  while (s9.date.y < 1921 && g++ < 120) {
    if (s9.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s9.currentEvent];
      const opts = ev.options.filter(o => !o.condition || o.condition(s9));
      s9 = Eng.dispatch(s9, { type: 'RESOLVE_EVENT', optionId: (opts[0] || ev.options[0]).id }).state;
    } else s9 = Eng.dispatch(s9, { type: 'ADVANCE' }).state;
  }
  console.log(`   法西斯派影响力 ${f0} → ${s9.factions.fascisti.inf.toFixed(1)}（${s9.date.y}-${s9.date.m}，共 ${g} 次行动路由）`);
  console.log('   四派：' + W.FACTIONS.map(f => f.zh + ' ' + s9.factions[f.id].inf.toFixed(1)).join(' / '));
  ok(s9.factions.fascisti.inf > f0 + 0.5, '法西斯派影响力应随时间增长');
}

console.log('\n10) 周回合、每周 2 行动力与跨月结算');
{
  let s = Eng.createState('1919-09', 'historical', 31);
  ok(s.date.d === 12 && s.ap === 2 && s.maxAp === 2, '开局应为 9 月 12 日、2 AP');
  ok(W.DIFFICULTIES.every(d => d.ap === 2), '所有难度每周均为 2 AP');
  s.ap = 0;
  Eng.advanceWeek(s, Core.makeRng(31));
  ok(s.date.m === 9 && s.date.d === 27 && s.ap === 2 && s.monthIndex === 1, '第一回合应到 9 月 27 日、恢复 2 AP 并结算');
  ok(s.economy.lastRevenue > 0, '每一回合都结算收入');
  Eng.advanceWeek(s, Core.makeRng(32));
  ok(s.date.m === 10 && s.date.d === 12 && s.monthIndex === 2, '第二回合应到 10 月 12 日');
  Eng.advanceWeek(s, Core.makeRng(33));
  ok(s.date.m === 10 && s.date.d === 27 && s.monthIndex === 3, '第三回合应到 10 月 27 日');
}

console.log('\n=== ' + (fails === 0 ? '全部通过 ✓' : fails + ' 项失败 ✗') + ' ===');
process.exit(fails === 0 ? 0 : 1);
