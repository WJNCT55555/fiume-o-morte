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
ok(W.PARTIES.filter(p => p.player).map(p => p.id).join(',') === 'LEG', 'only the Legion is playable for now');
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
  ok(!('militants' in s) && !('legionari' in s.order), `[${tag}] duplicate Legion headcount`);
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
        // Draw from a deck into a free reserved slot first. In historical/open
        // the deck is a RANDOM draw (the player picks the deck, not the card);
        // DRAW_CARD stays available for sandbox and for raw dispatch.
        if (s.hand.length < s.handLimit) {
          const decks = F.Sel.decks(s).filter(d => d.drawable);
          if (decks.length) {
            const d = decks[Math.floor(Math.random() * decks.length)];
            if (d.mode === 'random') {
              s = Eng.dispatch(s, { type: 'DRAW_RANDOM', deck: d.id }).state;
            } else {
              const pickD = d.cards[Math.floor(Math.random() * d.cards.length)];
              s = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: pickD.id }).state;
            }
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
          // The card is already paid for and discarded; with no option left
          // available there is nothing further to resolve.
          if (!oo.length) break;
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
ok(W.PARTIES.filter(p => p.player).map(p => p.id).join(',') === 'LEG', 'only the Legion is playable for now');
/* The Autonomists and the Socialists are modelled — their parties, leaders,
   starting events and cards all exist — but they are not yet open to the
   player. Locked means "cannot be chosen", not "absent": the roster still
   carries them so the opening screen shows the whole spectrum. */
for (const force of ['AUT', 'PSI']) {
  const party = W.PARTY_BY_ID[force];
  ok(!!party, `${force} must still be modelled`);
  ok(party.player !== true, `${force} must not be playable yet`);
  ok(!!party.lockedNote?.zh && !!party.lockedNote?.it, `${force} needs a bilingual locked note`);
  ok(!!party.emblem && fs.existsSync(path.join(__dirname, '..', 'public', party.emblem)), `${force} emblem must still resolve`);
  /* Asking the engine for a locked force must fall back to the Legion rather
     than starting a game nobody can steer. */
  const fellBack = Eng.createState('1919-09', 'open', 777, force);
  ok(fellBack.playerForce === 'LEG', `${force} must fall back to the Legion (got ${fellBack.playerForce})`);
}
/* Their opening events still exist and still resolve — they are simply not
   reachable through createState any more. */
for (const opening of ['ev_1919_09_autonomi', 'ev_1919_09_socialisti']) {
  const ev = Eng.EVENT_BY_ID[opening];
  ok(!!ev, `${opening} must remain registered for a later unlock`);
  if (!ev) continue;
  const s = Eng.createState('1919-09', 'open', 777, 'LEG');
  s.currentEvent = opening;
  const opt = ev.options.filter(o => !o.condition || o.condition(s))[0] || ev.options[0];
  const after = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: opt.id }).state;
  ok(after.eventHistory.includes(opening), `${opening} must still resolve when driven directly`);
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
  const old = Core.deepClone(st6);
  old.version = 5;
  old.militants = 3100;
  old.order.legionari = 2800;
  old.order.garrisonTroops = 6000;
  old.prev.produzione = 50;
  old.prev.pressione = 79;
  old.economy.lastSpending = 110;
  old.economy.lastNet = -12;
  old.laws.statuto = 2;
  old.order.civicGuard = 420;
  old.journals.guardia = { active: true, done: false, failed: false, months: 1 };
  old.hand.push('gv_guardia');
  old.pendingCard = 'gv_guardia';
  old.achievements = ['ach_balcony', 'ach_carta', 'ach_movement', 'ach_exile'];
  old.currentEvent = 'ev_fascio_split';
  old.phase = 'event';
  old.eventQueue.push('ev_fascio_split');
  old.eventHistory.push('ev_fascio_split');
  old.eventCooldowns.ev_fascio_split = old.monthIndex + 4;
  delete old.forze.sindacalisti;
  const previousStorage = global.localStorage;
  global.localStorage = { getItem: () => JSON.stringify({ auto: { state: old }, slots: [] }) };
  const migrated = F.Sel.Save.load('auto');
  if (previousStorage === undefined) delete global.localStorage; else global.localStorage = previousStorage;
  ok(migrated && migrated.version === 13 && migrated.order.milizia === 2500 &&
    migrated.forze.sindacalisti === W.FORZA_BY_ID.sindacalisti.init &&
    !('militants' in migrated) && !('legionari' in migrated.order), '旧存档迁移人数与革命工团主义者关系');
  ok(migrated && migrated.achievements.join(',') === 'ach_balcony', '旧存档不再保留已删除成就');
  ok(migrated && !('garrisonTroops' in migrated.order) && !('produzione' in migrated.prev) &&
    !('pressione' in migrated.prev) && !('lastSpending' in migrated.economy) &&
    !('lastNet' in migrated.economy), '旧存档清除仅供展示的读数');
  ok(migrated && migrated.currentEvent === null && migrated.phase === 'action' &&
    !migrated.eventQueue.includes('ev_fascio_split') &&
    !migrated.eventHistory.includes('ev_fascio_split') &&
    !('ev_fascio_split' in migrated.eventCooldowns) &&
    !Eng.EVENT_BY_ID.ev_fascio_split, '旧存档不会停在已移除的 Hotel Bonavia 事件');
  ok(migrated && !('statuto' in migrated.laws) && !('civicGuard' in migrated.order) &&
    !('guardia' in migrated.journals) && migrated.hand.includes('gv_polizia') &&
    migrated.pendingCard === 'gv_polizia' && migrated.flags.charter_promulgated &&
    migrated.flags.charter_program, '旧存档宪章与市警改革迁移');
  const oldLabour = Core.deepClone(old);
  oldLabour.version = 12;
  oldLabour.laws.lavoro = 3;
  delete oldLabour.laws.orario;
  global.localStorage = { getItem: () => JSON.stringify({ auto: { state: oldLabour }, slots: [] }) };
  const migratedLabour = F.Sel.Save.load('auto');
  ok(migratedLabour && migratedLabour.laws.orario === 1 && migratedLabour.laws.lavoro === 3,
    '旧劳动法最高级迁移为八小时制与完整劳动保障');
  const oldDone = Core.deepClone(old);
  oldDone.version = 11;
  oldDone.currentEvent = null;
  oldDone.eventQueue = [];
  oldDone.journals.carta = { active: false, done: true, failed: false, months: 3 };
  global.localStorage = { getItem: () => JSON.stringify({ auto: { state: oldDone }, slots: [] }) };
  const migratedDone = F.Sel.Save.load('auto');
  if (previousStorage === undefined) delete global.localStorage; else global.localStorage = previousStorage;
  ok(migratedDone && migratedDone.flags.carta_done && migratedDone.flags.charter_debate_resolved &&
    migratedDone.flags.charter_program, '已完成宪章的旧存档保留完成状态');
}

console.log('\n6a) 卡牌与事件操作不显示底部成功提示');
{
  const initial = Eng.createState('1919-09', 'historical', 42);
  initial.currentEvent = null;
  initial.phase = 'action';
  const drawn = Eng.dispatch(initial, { type: 'DRAW_CARD', cardId: 'az_legione_finanziaria' });
  ok(!drawn.toast && drawn.state.hand.includes('az_legione_finanziaria'), '抽到卡牌不弹出名称提示');
  const played = Eng.dispatch(drawn.state, { type: 'PLAY_CARD', cardId: 'az_legione_finanziaria' });
  ok(!played.toast && played.state.pendingCard === 'az_legione_finanziaria', '出牌不弹出名称提示');
  const resolved = Eng.dispatch(played.state, { type: 'RESOLVE_CARD_OPTION', optionId: 'obbligazioni' });
  ok(!resolved.toast && resolved.state.pendingCard === null, '完成卡牌不弹出名称提示');
  const warning = Eng.dispatch(initial, { type: 'DRAW_CARD', cardId: 'missing_card' });
  ok(warning.toast && warning.toast.kind === 'warn', '无效操作仍显示警告');
  const random = Eng.dispatch(initial, { type: 'DRAW_RANDOM', deck: 'azione' });
  ok(!random.toast && random.state.hand.length === 1, '随机抽卡不弹出名称提示');
  const eventState = Eng.createState('1919-09', 'historical', 43);
  eventState.currentEvent = 'ev_1919_09_marcia';
  const eventResolved = Eng.dispatch(eventState, { type: 'RESOLVE_EVENT', optionId: 'a' });
  ok(!eventResolved.toast && eventResolved.state.eventHistory.includes('ev_1919_09_marcia'),
    '完成事件不弹出名称提示');
  ok(W.LAW_STANCE === undefined && F.Sel.laws(initial).every(law => !('stances' in law)),
    '法律页不再使用静态政党立场');
}

console.log('\n6a.1) 德·安布里斯与宪章立法链');
{
  const arrival = Eng.createState('1919-09', 'historical', 48);
  arrival.currentEvent = 'ev_1920_01_deambris';
  const joined = Eng.dispatch(arrival, { type: 'RESOLVE_EVENT', optionId: 'assumere' }).state;
  ok(joined.currentEvent === 'ev_carta_programma', '德·安布里斯加入后立即出现立法纲领');
  ok(Eng.dispatch(arrival, { type: 'RESOLVE_EVENT', optionId: 'assumere' }).state.currentEvent === 'ev_carta_programma',
    '重复开局不会丢失静态事件的后续节点');
  const programme = Eng.dispatch(joined, { type: 'RESOLVE_EVENT', optionId: 'programma' }).state;
  ok(programme.flags.charter_program && programme.journals.carta?.active,
    '立法纲领开启宪章日志');
  ok(W.LAWS.length === 11 && W.LAWS.every(law => law.id !== 'statuto' &&
    W.LAW_EFFECTS[law.id] && W.LAW_SOURCES[law.id]) &&
    Meta.CHARTER_REQUIREMENTS.length < W.LAWS.length,
  '宪章不是法律，宪章目标少于全部法律');
  programme.date = { y: 1920, m: 9, d: 8 };
  programme.currentEvent = 'ev_1920_09_carta';
  const promulgated = Eng.dispatch(programme, { type: 'RESOLVE_EVENT', optionId: 'a' }).state;
  ok(promulgated.flags.charter_promulgated && promulgated.laws.elettorale >= 1 &&
    !('statuto' in promulgated.laws), '正式颁布推动具体选举法而非宪章等级');
  promulgated.currentEvent = 'ev_carta_dibattito';
  const partial = Eng.dispatch(promulgated, { type: 'RESOLVE_EVENT', optionId: 'b' }).state;
  ok(!partial.flags.charter_debate_resolved, '只开政治议会不算完成阿伦戈阶段');
  const debated = Eng.dispatch(promulgated, { type: 'RESOLVE_EVENT', optionId: 'a' }).state;
  ok(debated.flags.charter_debate_resolved && debated.laws.lavoro >= 1,
    '阿伦戈阶段推进选举与劳动立法');
  const carta = Meta.JOURNAL_BY_ID.carta;
  const enacted = Core.deepClone(debated);
  function enact(cardId, optionId) {
    const card = Eng.CARD_BY_ID[cardId];
    Eng.applyCardEffect(enacted, card, card.options.find(option => option.id === optionId));
  }
  enact('gv_arengo', 'convocare');
  enact('gv_cittadinanza', 'residenza');
  enact('gv_polizia', 'comunale');
  enact('gv_stampa', 'liberta');
  enact('gv_lingua', 'bilingue');
  const factorySettlement = Eng.EVENT_BY_ID.ev_factory.options.find(option => option.id === 'b');
  R.applyEffect(enacted, factorySettlement.effect(enacted));
  enact('gv_tutele', 'contratti');
  Eng.postProcess(enacted);
  ok(Meta.CHARTER_REQUIREMENTS.every(r => enacted.laws[r.id] >= r.level) && carta.complete(enacted),
    '宪章七项目标可由现有事件和法律卡牌效果全部落实');
  Meta.CHARTER_REQUIREMENTS.forEach(r => { debated.laws[r.id] = r.level; });
  ok(carta.complete(debated), '七项法律全部达到目标时日志可完成');
  debated.laws.stampa = 1;
  ok(!carta.complete(debated), '任一宪章目标未达标时日志不会完成');
  debated.laws.stampa = 2;
  debated.currentEvent = null;
  const completed = Eng.dispatch(debated, { type: 'ADVANCE' }).state;
  ok(completed.journals.carta.done && completed.flags.carta_done &&
    completed.achievements.includes('ach_carta_implemented'),
  '结算完成宪章日志并解锁成就');
  ok(!('civicGuard' in completed.order) && !Meta.JOURNAL_BY_ID.guardia &&
    !('guard' in R.spending(completed)), '虚构公民卫队已从人数、日志和支出中移除');

  const split = Eng.createState('1919-09', 'historical', 50);
  const eightHour = Eng.EVENT_BY_ID.ev_strike.options.find(option => option.id === 'a');
  R.applyEffect(split, eightHour.effect(split));
  ok(split.laws.orario === 1 && split.laws.lavoro === 0,
    '八小时制事件只推进工时法，不会暗中推进劳动保障');
  const office = Eng.EVENT_BY_ID.ev_strike.options.find(option => option.id === 'b');
  R.applyEffect(split, office.effect(split));
  ok(split.laws.lavoro === 1 && split.laws.orario === 1,
    '港口劳动局选择单独推进劳动保障');
  const hoursCard = Eng.CARD_BY_ID.gv_orario;
  const protectionCard = Eng.CARD_BY_ID.gv_tutele;
  ok(!!hoursCard && !!protectionCard &&
    Eng.cardOptions(split, hoursCard).find(option => option.id === 'riposo').enabled,
    '工时与保障各有政府卡，第二级工时须在八小时制后开放');
  Eng.applyCardEffect(split, protectionCard, protectionCard.options.find(option => option.id === 'soccorso'));
  Eng.postProcess(split);
  /* Assert the STRUCTURAL effect of the law level, not a net figure read across
     the same patch. `soccorso` also lowers unemployment by 2, and relief is
     max(0, unemployment - 12) * 1.7 + laws.lavoro * 2.0, so the two move at once:
     the law level adds 2.0 while the unemployment drop takes away 3.4. Any
     "relief rose by 2" comparison written against the post-patch unemployment is
     therefore unsatisfiable — the old form of this assertion could never pass.
     Pin the law term directly instead. */
  const reliefBase = Math.max(0, split.economy.unemployment - 12) * 1.7;
  ok(split.laws.lavoro === 2 &&
    Math.abs(R.spending(split).relief - (reliefBase + 2 * 2.0)) < 1e-9 &&
    split.laws.orario === 1,
    '劳动保障升级增加持续救助支出，工时等级不变');

  const policy = Eng.createState('1919-09', 'historical', 49);
  function choosePolicy(cardId, optionId) {
    const card = Eng.CARD_BY_ID[cardId];
    Eng.applyCardEffect(policy, card, card.options.find(option => option.id === optionId));
    Eng.postProcess(policy);
  }
  choosePolicy('gv_cittadinanza', 'residenza');
  choosePolicy('gv_polizia', 'comunale');
  choosePolicy('gv_stampa', 'liberta');
  choosePolicy('gv_lingua', 'bilingue');
  ok(policy.laws.cittadinanza === 2 && policy.laws.ordine === 2 &&
    policy.laws.stampa === 2 && policy.laws.lingua === 1 && policy.laws.scuola === 2,
  '法律卡牌首次执行即落实其文字所述制度');
  choosePolicy('gv_stampa', 'censura');
  choosePolicy('gv_cittadinanza', 'sangue');
  ok(policy.laws.stampa === 0 && policy.laws.cittadinanza === 1,
    '反向政策会调整现行法律，而非继续累加等级');
}

console.log('\n6b) 经济公式与增收修正');
{
  const s = Eng.createState('1919-09', 'historical', 29);
  ok(R.incomeTaxRate(s) === 0 && R.revenue(s).reddito === 0,
    '财政法未达二级时不会征收所得税');
  s.laws.fisco = 2;
  ok(R.incomeTaxRate(s) === 0.30 && R.revenue(s).reddito > 0,
    '财政法二级开征所得税');
  s.laws.fisco = 3;
  ok(R.incomeTaxRate(s) === 0.45,
    '财政法三级提高所得税基础税率');
  s.taxRates.reddito = 0.5;
  ok(R.incomeTaxRate(s) === 0.5,
    '显式调税可高于财政法基础税率');
  const base = R.revenue(s);
  s.revenueBoost.dogana = 0.2;
  s.revenueBoost.consumo = 0.15;
  s.revenueBoost.reddito = 0.1;
  const boosted = R.revenue(s);
  ok(Math.abs(boosted.dogana / base.dogana - 1.2) < 1e-9 &&
    Math.abs(boosted.consumo / base.consumo - 1.15) < 1e-9 &&
    Math.abs(boosted.reddito / base.reddito - 1.1) < 1e-9,
  '三项税收增收修正都会进入实际收入');
  const view = F.Sel.economy(s);
  ok(view.trafficTarget === Core.round1(R.trafficTarget(s)) &&
    view.unemploymentTarget === Core.round1(R.unemploymentTarget(s)) &&
    view.inflationTarget === Core.round1(R.inflationTarget(s)) &&
    view.confidenceTarget === Core.round1(R.confidenceTarget(s)),
  '经济界面的目标值与结算规则一致');
}

console.log('\n6c) 成就条件');
{
  const retired = ['ach_carta', 'ach_movement', 'ach_exile'];
  const catalog = Meta.ACHIEVEMENTS.map(a => a.id);
  ok(catalog.length === 17 && retired.every(id => !catalog.includes(id)) &&
    catalog.includes('ach_eia_alala') && catalog.includes('ach_carta_implemented'),
  '成就目录为 17 项，含宪章实施成就且无已删除成就');
  const s = Eng.createState('1919-09', 'open', 42);
  s.order.fervour = 100;
  s.order.authority = 64;
  R.checkAchievements(s);
  ok(!s.achievements.includes('ach_eia_alala'), '领袖权威未达 65 时不解锁新成就');
  s.order.fervour = 99;
  s.order.authority = 65;
  R.checkAchievements(s);
  ok(!s.achievements.includes('ach_eia_alala'), '民众热忱未达 100 时不解锁新成就');
  s.order.fervour = 100;
  R.checkAchievements(s);
  ok(s.achievements.includes('ach_eia_alala'), '两项条件同时满足时解锁新成就');
  s.laws.lavoro = 3;
  s.laws.fisco = 2;
  s.order.fervour = 70;
  s.factions.sindacalisti.inf = 59;
  R.checkAchievements(s);
  ok(!s.achievements.includes('ach_comune'), '工团派影响力不足 60 时不能解锁劳动的共和国');
  s.factions.sindacalisti.inf = 60;
  R.checkAchievements(s);
  ok(s.achievements.includes('ach_comune'), '劳动的共和国要求工团派影响力达到 60，且无合作社份额限制');
  ok(retired.every(id => !s.achievements.includes(id)), '判定不会颁发已删除成就');
}

console.log('\n7) 派生资源读数');
{
  const s = Eng.createState('1919-09', 'historical', 11);
  const res = F.Sel.resources(s);
  console.log('   ' + res.map(r => r.zh + ' ' + r.main + (r.unit ? ' ' + r.unit : '')).join('  ·  '));
  ok(res.length === 4 && !res.some(r => ['produzione', 'pressione'].includes(r.id)),
    '资源栏只保留四项实际使用的数值');
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
  /* The exact distribution here depends on which events fire and which option a
     blind 'take the first one' policy lands on, so it moves whenever a dated
     event is added or an option is reordered. What must hold is the direction:
     the fascists grow inside the movement. The two historical anchors that must
     NOT move are asserted separately in section 5. */
  ok(s9.factions.fascisti.inf > f0 + 0.5, '法西斯派影响力应随时间增长');
}

console.log('\n10) 周回合、每周 2 行动力与跨月结算');
{
  let s = Eng.createState('1919-09', 'historical', 31);
  ok(s.date.d === 12 && s.ap === 2 && s.maxAp === 2, '开局应为 9 月 12 日、2 AP');
  ok(W.DIFFICULTIES.every(d => d.ap === 2), '所有难度每周均为 2 AP');
  s.ap = 0;
  Eng.advanceWeek(s, Core.makeRng(31));
  ok(s.date.m === 9 && s.date.d === 30 && s.ap === 2 && s.monthIndex === 1, '第一回合应到 9 月 30 日（下半月月末）、恢复 2 AP 并结算');
  ok(s.economy.lastRevenue > 0, '每一回合都结算收入');
  Eng.advanceWeek(s, Core.makeRng(32));
  ok(s.date.m === 10 && s.date.d === 15 && s.monthIndex === 2, '第二回合应到 10 月 15 日（上半月月中）');
  Eng.advanceWeek(s, Core.makeRng(33));
  ok(s.date.m === 10 && s.date.d === 31 && s.monthIndex === 3, '第三回合应到 10 月 31 日');
}

console.log('\n11) 军团民意预览与派生结果一致');
{
  let checked = 0;
  Eng.ALL_EVENTS.concat(Eng.ALL_CARDS).forEach(item => {
    (item.options || []).forEach(option => {
      const labels = (option.preview || []).map(x => typeof x === 'string' ? x : x.zh)
        .filter(x => x.includes('军团民意'));
      if (!labels.length) return;
      const state = Eng.createState('1919-09', 'historical', 42);
      const before = state.legitimacy;
      try {
        const effect = typeof option.effect === 'function' ? option.effect(state) : option.effect;
        R.applyEffect(state, effect);
        Eng.postProcess(state);
        const direction = labels.some(x => x.includes('−')) ? -1 : 1;
        ok((state.legitimacy - before) * direction > 0.04,
          item.id + '/' + option.id + ' 的军团民意预览方向正确');
        checked++;
      } catch (e) {
        ok(false, item.id + '/' + option.id + ' 的预览无法计算：' + e.message);
      }
    });
  });
  console.log('   已核对 ' + checked + ' 项民意预览');
}

console.log('\n12) 意大利政治力量与进军罗马门槛');
{
  const s = Eng.createState('1919-09', 'historical', 42);
  const ids = W.FORZA_FRONT;
  ok(ids.length === 6 && ['socialisti', 'anarchici', 'comunisti', 'fascisti', 'corradini', 'sindacalisti'].every(id => ids.includes(id)),
    '进军阵线包含指定六派');
  ok(F.Sel.forze(s).front.length === 5 && !F.Sel.forze(s).front.some(x => x.id === 'comunisti'),
    '意共成立前不在关系列表中');
  const card = Eng.CARD_BY_ID.az_forze_italia;
  const lawBefore = s.laws.lavoro;
  const syndicalistBefore = s.forze.sindacalisti;
  R.applyEffect(s, card.options.find(x => x.id === 'deambris').effect);
  ok(s.forze.sindacalisti === syndicalistBefore + 28 && s.laws.lavoro === lawBefore,
    '德安布里斯提高革命工团主义者关系，不提高宪章或劳动法');
  const nationalistBefore = s.forze.corradini;
  R.applyEffect(s, card.options.find(x => x.id === 'corradini').effect);
  ok(s.forze.corradini === nationalistBefore + 26, '科拉迪尼提高民族主义协会关系');
  const journal = Meta.JOURNAL_BY_ID.marcia_1920;
  s.order.milizia = 10000;
  s.forze.forzearmate = 60;
  ids.forEach(id => { s.forze[id] = 0; });
  s.forze.socialisti = 80;
  s.forze.corradini = 80;
  s.forze.comunisti = 100;
  ok(!journal.complete(s), '意共尚未成立时不计入三个达标关系');
  s.forze.sindacalisti = 80;
  ok(journal.complete(s), '社会党、民族主义协会、革命工团主义者三派达标可完成日志');
  s.forze.sindacalisti = 0;
  s.flags.comintern_door = true;
  ok(F.Sel.forze(s).front.length === 6 && journal.complete(s),
    '意共成立后出现并可计入三个达标关系');
}

console.log('\n13) 卡牌与事件选项按实际结算预览');
{
  const s = Eng.createState('1919-09', 'historical', 42);
  s.currentEvent = 'ev_1919_09_marcia';
  s.order.fervour = 100;
  const before = JSON.stringify(s);
  const eventOption = F.Sel.eventView(s).options.find(o => o.id === 'a');
  const eventAfter = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: 'a' }).state;
  ok(JSON.stringify(s) === before, '事件预览不改变当前游戏状态');
  ok(!eventOption.preview.some(x => x.includes('民众热忱 +')),
    '热忱已经到达上限时不再预览虚假的增长');
  ok(eventOption.preview.includes('意大利王国关系 −12') && eventAfter.diplo.italy - s.diplo.italy === -12,
    '事件预览采用实际外交结算');
  ok(eventOption.preview.some(x => x.startsWith('手工业者与小店主·军团支持 +')),
    '事件预览包含真实的阶层支持变化');

  s.currentEvent = null;
  s.pendingCard = 'gv_cittadinanza';
  s.laws.cittadinanza = 2;
  const cardBefore = JSON.stringify(s);
  const cardOption = F.Sel.cardView(s).options.find(o => o.id === 'residenza');
  ok(JSON.stringify(s) === cardBefore, '卡牌预览不改变当前游戏状态');
  ok(!cardOption.preview.some(x => x.startsWith('公民身份：')),
    '动态法律效果已达目标等级时不预览虚假的升级');
  ok(cardOption.preview.includes('人口 +180'), '卡牌预览包含实际人口变化');
  s.pendingCard = 'az_propaganda';
  const route = F.Sel.cardView(s).options.find(o => o.id === 'rete_privata');
  ok(route.preview.some(x => x.includes('接续卡牌：与意大利力量之间的关系')),
    '卡牌预览包含实际的后续卡牌');

  let unavailable = 0;
  Eng.ALL_CARDS.forEach(card => {
    s.pendingCard = card.id;
    F.Sel.cardView(s).options.forEach(option => {
      if (option.enabled && option.preview.includes('效果预览不可用')) unavailable++;
    });
  });
  ok(unavailable === 0, '所有当前可用卡牌选项都能生成真实预览：' + unavailable + ' 项失败');

  let timeline = Eng.createState('1919-09', 'historical', 4242);
  let eventPreviews = 0;
  for (let step = 0; step < 160 && timeline.phase !== 'ended'; step++) {
    if (!timeline.currentEvent) {
      timeline = Eng.dispatch(timeline, { type: 'ADVANCE' }).state;
      continue;
    }
    const beforeEvent = JSON.stringify(timeline);
    const view = F.Sel.eventView(timeline);
    ok(JSON.stringify(timeline) === beforeEvent, '事件选项预览不修改游戏状态：' + view.id);
    view.options.filter(option => option.enabled).forEach(option => {
      eventPreviews++;
      ok(!option.preview.includes('效果预览不可用'), '事件选项可预览：' + view.id + '/' + option.id);
    });
    timeline = Eng.dispatch(timeline, { type: 'RESOLVE_EVENT',
      optionId: view.options.find(option => option.enabled).id }).state;
  }
  ok(eventPreviews > 20, '史实时间线覆盖了多个事件预览');
}

console.log('\n=== ' + (fails === 0 ? '全部通过 ✓' : fails + ' 项失败 ✗') + ' ===');
process.exit(fails === 0 ? 0 : 1);
