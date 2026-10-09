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
/* The catalogue, so the checks below can assert on the strings a player reads. */
require(path.join(base, 'lib', 'i18n.js'));

const F = globalThis.Fiume;
const { Core, World: W, Rules: R, Engine: Eng, Meta } = F;

let fails = 0;
function ok(cond, msg) {
  if (!cond) { fails++; console.log('  ✗ ' + msg); }
}

const portraitDir = path.join(__dirname, '..', 'public', 'img', 'Portrait');
fs.readdirSync(portraitDir).forEach(file => {
  ok(/^Portrait_[a-z0-9]+(?:_[a-z0-9]+)*\.png$/.test(file), `portrait filename ${file}`);
});

/* A file whose bytes disagree with its extension loads fine from Node and still
   fails in the browser, because the server sends the declared content type.
   Portrait_Riccardo_Gigante was WebP bytes named .png for exactly that reason. */
const IMAGE_SIGNATURES = [
  { ext: '.png', test: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: '.jpg', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: '.webp', test: b => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
];
fs.readdirSync(portraitDir).forEach(file => {
  const bytes = fs.readFileSync(path.join(portraitDir, file)).subarray(0, 12);
  const ext = path.extname(file).toLowerCase();
  const sig = IMAGE_SIGNATURES.find(s => s.ext === ext);
  ok(sig && sig.test(bytes), `portrait ${file} does not contain ${ext} data`);
});

W.PARTIES.forEach(party => {
  ok(!!party.leader?.zh && !!party.leader?.it, `party ${party.id} needs a named leader`);
  if (party.leader?.portrait) ok(fs.existsSync(path.join(__dirname, '..', 'public', party.leader.portrait)), `party ${party.id} portrait is missing`);
  /* Every party that declares an emblem must have the file. Checking only the
     playable party let PCR stay unwired: nothing renders it on the start screen,
     so a missing emblem was invisible until a player looked at another panel. */
  if (party.emblem) ok(fs.existsSync(path.join(__dirname, '..', 'public', party.emblem)), `party ${party.id} emblem is missing: ${party.emblem}`);
});
ok(W.PARTIES.filter(p => p.player).map(p => p.id).join(',') === 'LEG', 'only the Legion is playable for now');
/* The seat charts read left to right along the political spectrum, so `order` is
   load-bearing, not decoration: d3-parliament hands contiguous arcs to parties in
   the order it is given, which means a wrong axis silently redraws the chamber as
   a different political map. Both axes are asserted literally — renumbering them
   is a design decision, not a refactor, and should have to break a test. */
{
  const PARTY_AXIS = ['PCR', 'PSI', 'AUT', 'PAD', 'LEG', 'ANI'];
  const axis = W.PARTIES.slice().sort((a, b) => a.order - b.order).map(p => p.id);
  ok(axis.join(',') === PARTY_AXIS.join(','),
    '政党席位轴必须是从左到右的意识形态顺序；实际：' + axis.join(', '));
  ok(W.PARTIES.every(p => typeof p.order === 'number'),
    '每个政党都要有 order，否则它会被排到最右');
  const FACTION_AXIS = ['sindacalisti', 'futuristi', 'arditi', 'irredentisti', 'fascisti'];
  const faxis = W.FACTIONS.slice().sort((a, b) => a.order - b.order).map(f => f.id);
  ok(faxis.join(',') === FACTION_AXIS.join(','),
    '派系轴必须是从左到右的顺序；实际：' + faxis.join(', '));
  ok(W.FACTIONS.every(f => typeof f.order === 'number'), '每个派系都要有 order');
  ok(new Set(W.PARTIES.map(p => p.order)).size === W.PARTIES.length,
    '政党的 order 不得重复');
  ok(new Set(W.FACTIONS.map(f => f.order)).size === W.FACTIONS.length,
    '派系的 order 不得重复');
  /* The roster reads along the axis too, not by influence. */
  const roster = F.Sel.factions(Eng.createState('1919-09', 'historical', 7)).list.map(f => f.id);
  ok(roster.join(',') === FACTION_AXIS.join(','),
    '派系面板顺序必须同轴；实际：' + roster.join(', '));
}
/* The assembly, the chord plate and the start screen all show a party emblem, so
   an unset one is a hole rather than a style choice. */
{
  const missing = W.PARTIES.filter(p => !p.emblem).map(p => p.id);
  ok(missing.length === 0, '每个政党都有党徽：' + (missing.length ? missing.join(', ') : '全部就位'));
}

/* Advisor portraits are content, not UI: they live on the advisor records in
   src/game/advisors/*.ts and are read through Sel.advisors. A declared portrait
   must exist; the advisors below are the ones with no likeness on file yet, so
   that list can only shrink. */
const advisorsWithoutPortrait = W.ADVISORS.filter(a => !a.portrait).map(a => a.id);
W.ADVISORS.forEach(advisor => {
  if (!advisor.portrait) return;
  ok(fs.existsSync(path.join(__dirname, '..', 'public', advisor.portrait)), `advisor ${advisor.id} portrait is missing`);
});
/* A named allowlist rather than a count: a new advisor added without a likeness
   now fails here instead of sliding in under an upper bound. These two are the
   ones with no portrait on file. */
const PORTRAIT_GAPS = ['miani', 'micheletti'];
ok(advisorsWithoutPortrait.slice().sort().join(',') === PORTRAIT_GAPS.slice().sort().join(','),
  '无肖像顾问名单应与 PORTRAIT_GAPS 一致；实际：' + (advisorsWithoutPortrait.join(', ') || '无'));
/* Declaring a portrait is not the same as showing one: the roster, the seat row
   and the deck all read it off `Sel.advisors`, so a field dropped in that
   projection turns every advisor into a lettered placeholder while the files sit
   unused on disk. Assert the field survives the projection. */
{
  const s = Eng.createState('1919-09', 'historical', 7);
  const projected = F.Sel.advisors(s);
  ok(projected.length === W.ADVISORS.length, '顾问列表长度与数据一致');
  W.ADVISORS.forEach(a => {
    const row = projected.filter(x => x.id === a.id)[0];
    if (!row) { ok(false, `Sel.advisors 漏掉了顾问 ${a.id}`); return; }
    if (a.portrait) {
      ok(row.portrait === a.portrait,
        `Sel.advisors 必须传出 ${a.id} 的肖像（否则界面退回字母缩写）`);
    }
    ok(row.factionZh && row.factionIt !== undefined, `顾问 ${a.id} 的派系名必须双语`);
  });
}
/* Retiring an advisor must also free the seat it held in existing saves: seats
   are ids, the panel only renders advisors that still exist, and DISMISS looks
   the id up in the same list, so a stale id would be unremovable. */
{
  const s = Eng.createState('1919-09', 'historical', 7);
  s.advisors.active = ['a_retired_advisor', W.ADVISORS[0].id, W.ADVISORS[1].id];
  const loaded = Eng.dispatch(Eng.createState('1919-09', 'historical', 7),
    { type: 'LOAD_STATE', state: s }).state;
  ok(loaded.advisors.active.indexOf('a_retired_advisor') < 0,
    '载入存档时剔除已下线的顾问 id，释放其席位');
  ok(loaded.advisors.active.length === 2, '剔除后席位计数与实际在任顾问一致');
}
const imageManifest = require(path.join(__dirname, '..', 'public', 'img', 'manifest.json'));
Object.entries(imageManifest).forEach(([key, item]) => {
  ok(fs.existsSync(path.join(__dirname, '..', 'public', 'img', item.file)), `manifest image ${key} is missing`);
});

/* Every portrait the game can show, whichever layer declares it. */
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
  ['authority', 'garrison', 'fervour', 'squadre', 'violence', 'coup', 'subversion'].forEach(k => {
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
  enact('gv_arengo', 'convocare');  enact('gv_cittadinanza', 'residenza');
  enact('gv_polizia', 'comunale');
  enact('gv_stampa', 'liberta');
  enact('gv_lingua', 'bilingue');
  const factorySettlement = Eng.EVENT_BY_ID.ev_factory.options.find(option => option.id === 'b');
  R.applyEffect(enacted, factorySettlement.effect(enacted));
  enact('gv_tutele', 'contratti');
  Eng.postProcess(enacted);
  ok(Meta.CHARTER_REQUIREMENTS.every(r => enacted.laws[r.id] >= r.level) && carta.complete(enacted),
    '宪章七项目标可由现有事件和法律卡牌效果全部落实');
  /* The Provvisori caption prints the number of Corporations, so the figure and
     the table can only move together. It read "九家" while the table held seven. */
  {
    const convoked = Eng.createState('1919-09', 'historical', 7);
    convoked.flags.charter_promulgated = true;
    R.arengoTick(convoked);
    const prov = convoked.arengo && convoked.arengo.provvisori;
    ok(!!prov, '宪章颁布后法团理事会应当召开');
    if (prov) {
      ok(Object.keys(prov.byCorporation).length === W.CORPORATIONS.length,
        '法团理事会实际召开的法团数应等于 W.CORPORATIONS.length（' + W.CORPORATIONS.length + '）');
      ok(prov.seats === W.CORPORATION_SEATS,
        '法团理事会席位应等于 W.CORPORATION_SEATS（' + W.CORPORATION_SEATS + '）');
      const label = F.I18N.t('ar.provvisori.rule',
        { c: Object.keys(prov.byCorporation).length, n: prov.seats });
      ok(label.indexOf(String(W.CORPORATIONS.length)) >= 0 && label.indexOf(String(W.CORPORATION_SEATS)) >= 0,
        '法团理事会说明里的数字必须来自数据表：' + label);
      ok(label.indexOf('九') < 0 && label.indexOf('60 席') !== -1,
        '法团理事会说明不再硬编码错误的家数：' + label);
    }
  }
  /* The Charter card must seat the Arengo the moment it resolves, not one
     ADVANCE later. Its option carries `conveneChambers`, which is a routing key
     rather than a state patch: R.applyEffect ignores keys it does not know, so
     the card path has to lift it out the same way the event path does. When it
     did not, `charter_promulgated` was set and `state.arengo` stayed null, and
     the politics tab showed nothing until the player happened to advance a turn. */
  {
    const cs = Eng.createState('1919-09', 'historical', 7);
    cs.date = { y: 1920, m: 9, d: 12 };
    cs.turn = 21; cs.monthIndex = 21;
    cs.cabinet.istruzione = cs.playerForce;
    cs.flags.charter_program = true;
    cs.ap = 2; cs.hand = ['gv_arengo'];
    const charterCard = Eng.CARD_BY_ID.gv_arengo;
    ok(charterCard.require(cs), '召开阿伦戈卡牌在 1920 年 9 月且掌握教育席位时可用');
    let after = Eng.dispatch(cs, { type: 'PLAY_CARD', cardId: 'gv_arengo' }).state;
    ok(after.pendingCard === 'gv_arengo', '打出后进入选项菜单');
    after = Eng.dispatch(after, { type: 'RESOLVE_CARD_OPTION', optionId: 'convocare' }).state;
    ok(!!after.flags.charter_promulgated, '召开选项必须颁布宪章');
    ok(!!after.arengo, '打出宪章卡后议会必须立刻成立（不依赖下一次 ADVANCE）');
    if (after.arengo) {
      ok(after.arengo.ottimi.seats > 0 && after.arengo.provvisori.seats === W.CORPORATION_SEATS,
        '两院席位在卡牌结算时就已算好');
      ok(Object.keys(after.arengo.provvisori.byCorporation).length === W.CORPORATIONS.length,
        '法团理事会成立时即包含全部法团');
      /* The ADVANCE tick must not rebuild it into a different chamber. */
      const ticked = Eng.dispatch(Object.assign({}, after, { currentEvent: null }),
        { type: 'ADVANCE' }).state;
      ok(ticked.arengo && ticked.arengo.ottimi.seats === after.arengo.ottimi.seats,
        '回合推进不会改变已成立议会的构成');
    }
  }
  /* The September 1920 event is the other route to promulgation, and it must
     seat the councils too. Enforced as an invariant in postProcess rather than
     trusted to each authoring site, so a third route added later cannot regress. */
  {
    const es = Eng.createState('1919-09', 'historical', 7);
    es.date = { y: 1920, m: 9, d: 8 };
    es.turn = 25; es.monthIndex = 25;
    es.currentEvent = 'ev_1920_09_carta';
    const prom = Eng.dispatch(es, { type: 'RESOLVE_EVENT', optionId: 'a' }).state;
    ok(!!prom.flags.charter_promulgated, '阳台事件选项 a 必须颁布宪章');
    ok(!!prom.arengo, '颁布宪章的事件路径也必须立刻成立两院');
    /* Old saves: promulgated but never seated must heal on load. */
    const stale = Eng.createState('1919-09', 'historical', 7);
    stale.flags.charter_promulgated = true;
    stale.arengo = null;
    const healed = Eng.dispatch(Eng.createState('1919-09', 'historical', 7),
      { type: 'LOAD_STATE', state: stale }).state;
    ok(!!healed.arengo, '宪章已颁布但缺议会的旧存档，载入时自动补建');
    /* And a state with no charter must NOT grow chambers. */
    const plain = Eng.createState('1919-09', 'historical', 7);
    const idle = Eng.dispatch(plain, { type: 'ADVANCE' }).state;
    ok(!idle.arengo, '未颁布宪章时不得凭空成立议会');
  }
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
  /* 19 since `ending_venice` and `ending_danzig` became `ach_venice` /
     `ach_danzig`: both were things a run accomplishes rather than ways it ends,
     and both were being preempted by `ending_comune`. */
  ok(catalog.length === 19 && retired.every(id => !catalog.includes(id)) &&
    catalog.includes('ach_eia_alala') && catalog.includes('ach_carta_implemented') &&
    catalog.includes('ach_venice') && catalog.includes('ach_danzig'),
  '成就目录为 19 项，含宪章实施、威尼斯与但泽成就，且无已删除成就');
  /* both achievements are granted by the conditions their endings used to carry */
  {
    const s = Eng.createState('1919-09', 'open', 42);
    s.laws.portofranco = 3; s.economy.traffic = 90; s.factions.sindacalisti.inf = 24;
    R.checkAchievements(s);
    ok(s.achievements.includes('ach_venice'), '自由港 3 + 吞吐 90 + 工团派 24 → 解锁「第二个威尼斯」');
    const d = Eng.createState('1919-09', 'open', 42);
    d.flags.international_guarantee = true; d.flags.carta_done = true;
    R.checkAchievements(d);
    ok(d.achievements.includes('ach_danzig'), '共同保证 + 宪章完成 → 解锁「亚得里亚的但泽」');
    ['ending_venice', 'ending_danzig', 'ending_natale', 'ending_exile_endured', 'ending_carnaro']
      .forEach(id => ok(!Meta.ENDINGS.some(e => e.id === id), `${id} 已不再是结局`));
  }
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

/* The election result: a ballot whose outcome the player can only read off a
   column of numbers is a wasted screen, so the count seats a chamber. Assert the
   chain that reaches it and the data that draws it. */
console.log('\n12b) 选举结果事件展示议会图');
{
  const ballot = Eng.EVENT_BY_ID['ev_1921_04_elezioni'];
  const count = Eng.EVENT_BY_ID['ev_1921_04_elezioni_esito'];
  ok(!!ballot && !!count, '选举事件与结果事件都已注册');
  ballot.options.forEach(o => {
    const patch = typeof o.effect === 'function'
      ? o.effect(Core.deepClone(Eng.createState('1921-03', 'historical', 7)))
      : o.effect;
    ok(patch && patch.next === 'ev_1921_04_elezioni_esito',
      `选举选项 ${o.id} 必须链到结果事件`);
    ok(patch && patch.runElection === true,
      `选举选项 ${o.id} 必须结算选举，否则结果事件无票可读`);
  });
  ok(!count.date && count.chain === true, '结果事件由链条打开，不自行按日期触发');

  /* Every path — participation, a solo list, a boycott — must produce a usable
     count screen; the boycott path is the one with no chamber to seat. */
  ['listone', 'sola', 'boicottare'].forEach(optionId => {
    const s = Eng.createState('1921-03', 'historical', 7);
    s.currentEvent = 'ev_1921_04_elezioni';
    const after = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId }).state;
    ok(after.currentEvent === 'ev_1921_04_elezioni_esito',
      `${optionId} 结算后当前事件应当是结果事件（实际 ${after.currentEvent}）`);
    const res = count.result(after, { R, W, Core, Eng });
    ok(!!res, `${optionId} 的结果事件必须产出计票`);
    if (optionId === 'boicottare') {
      /* A boycott is not an empty chamber: the ballot still seats an assembly,
         it seats one without the Legion. The chart has to be drawn — that is
         exactly the picture the choice buys. */
      const mine = after.assembly[after.playerForce] || 0;
      const others = Object.keys(after.assembly).reduce((a, p) => a + after.assembly[p], 0);
      ok(others > 0, '抵制后议会仍然组成（只是没有军团兵的席位）');
      ok(mine === 0, '抵制后军团的席位应为 0');
      ok(Array.isArray(res.seats) && res.seats.length > 0,
        '抵制后仍要画出议会，因为它画的就是「没有你」');
      ok(!res.seats.some(b => b.id === after.playerForce),
        '军团的色块不应出现在抵制后的议会里');
    } else {
      ok(Array.isArray(res.seats) && res.seats.length > 0, `${optionId} 的结果必须带半圆数据`);
      const seated = res.seats.reduce((a, b) => a + b.seats, 0);
      const assembly = Object.keys(after.assembly).reduce((a, p) => a + after.assembly[p], 0);
      ok(seated === assembly,
        `${optionId} 半圆席位数应等于 assembly 合计（${seated} vs ${assembly}）`);
      res.seats.forEach(b => {
        ok(!!b.color && /^#[0-9A-Fa-f]{3,8}$/.test(b.color), `半圆色块 ${b.id} 需要有颜色`);
        ok(!!b.name && !!b.name.zh && !!b.name.it, `半圆色块 ${b.id} 的名称必须双语`);
      });
      ok(!!res.seatsCaption && !!res.seatsCaption.zh && !!res.seatsCaption.it,
        `${optionId} 的结果必须有双语图注`);
    }
  });
}

console.log('\n13) 卡牌与事件选项按实际结算预览');
{  const s = Eng.createState('1919-09', 'historical', 42);
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

  /* Every preview line must be finished prose. A label built from a content node
     that never went through Core.L renders as "[object Object]", and a template
     that never went through previewFill keeps its "{a}" placeholder — both are
     silent at runtime and only visible to a player reading the panel, so they are
     asserted here across every card and event option instead. */
  {
    const malformed = /\[object |\{[a-z]\}|undefined|NaN/;
    const offenders = [];
    let scanned = 0;
    const scan = (label, lines) => (lines || []).forEach(line => {
      scanned++;
      if (malformed.test(line)) offenders.push(label + ' → ' + line);
    });
    Eng.ALL_CARDS.forEach(card => {
      const cs = Eng.createState('1919-09', 'historical', 7);
      cs.pendingCard = card.id;
      const view = F.Sel.cardView(cs);
      if (view) view.options.forEach(o => scan(card.id + '/' + o.id, o.preview));
    });
    Eng.ALL_EVENTS.forEach(ev => {
      const es = Eng.createState('1919-09', 'historical', 7);
      es.currentEvent = ev.id;
      const view = F.Sel.eventView(es);
      if (view) view.options.forEach(o => scan(ev.id + '/' + o.id, o.preview));
    });
    ok(scanned > 1000, '效果预览扫描覆盖了全部卡牌与事件：' + scanned + ' 行');
    ok(offenders.length === 0,
      '效果预览没有未替换的占位符或对象字符串' +
      (offenders.length ? '：' + offenders.slice(0, 4).join('；') + '（共 ' + offenders.length + ' 行）' : ''));
  }
}

console.log('\n14) 国家精神显示实际半月数值与剧情标记');
{
  const s = Eng.createState('1919-09', 'historical', 91);
  Object.assign(s.laws, { orario: 2, lavoro: 3, ordine: 2, portofranco: 2, lingua: 2, scuola: 2 });
  Object.assign(s.flags, { charter_promulgated: true, worker_control: true, smuggle: true,
    international_guarantee: true, fascio_disarmed: true, dannunzio_left: true });
  const before = JSON.stringify(s);
  const spirits = F.Sel.spirits(s);
  const find = name => spirits.find(entry => entry.zh === name);
  const value = (name, label) => find(name)?.effects.find(line => line.zh === label)?.value;
  ok(JSON.stringify(s) === before, '国家精神计算不会修改存档');
  ok(value('工时立法', '罢工强度') === '−1.0 点/半月' &&
    value('工时立法', '失业率') === '−0.24 百分点/半月' &&
    value('工时立法', '资本信心') === '−0.4 点/半月', '工时立法三项半月效果准确');
  ok(value('劳动保障', '罢工强度') === '−3.3 点/半月' &&
    value('劳动保障', '救济支出') === '+6.0 K£/半月', '劳动保障显示罢工与实际支出');
  ok(value('市政警察监督', '法西斯小队') === '−1.6 点/半月' &&
    value('市政警察监督', '领袖权威') === '+0.6 点/半月', '公共秩序法显示真实数值');
  ok(value('自由港制度', '资本信心') === '+2.4 点/半月' &&
    value('官方语言制度', '南斯拉夫关系') === '+1.0 点/半月' &&
    value('双语教育', '斯拉夫农民·军团支持') === '+0.50 点/半月',
    '自由港与语言、教育效果来自现行规则');
  ok(find('《卡尔纳罗宪章》')?.effects[0].value ===
    (R.lawMonthly(s).order.coup < 0 ? '−' : '') + Math.abs(R.lawMonthly(s).order.coup).toFixed(2) + ' 点/半月',
    '宪章围攻修正与当前立法进度一致');
  ok(F.Sel.spiritMarkers(s).length === 5 &&
    !spirits.some(entry => ['国际保证', '工人接管工厂', '边境走私', '法西斯已解除武装', '诗人已离开'].includes(entry.zh)),
    '一次性剧情标记不冒充持续国家精神');
}

console.log('\n15) 两条危机的压力范围统一为 0–100');
{
  const s = Eng.createState('1919-09', 'historical', 151);
  ok(W.CRISIS_MAX === 100, '危机压力的统一上限为 100');
  s.order.coup = 98;
  s.order.subversion = 98;
  R.applyEffect(s, { order: { coup: 20, subversion: 20 } });
  ok(s.order.coup === 100 && s.order.subversion === 100, '两条压力的选项效果不会超过 100');
  R.applyEffect(s, { order: { coup: -200, subversion: -200 } });
  ok(s.order.coup === 0 && s.order.subversion === 0, '两条压力的选项效果不会低于 0');

  const monthly = Eng.createState('1919-09', 'historical', 152);
  monthly.date = { y: 1920, m: 6, d: 1 };
  Object.assign(monthly.order, { coup: 99, subversion: 99, squadre: 90, violence: 90 });
  Eng.advanceWeek(monthly, () => 0.5);
  ok(monthly.order.coup === 100 && monthly.order.subversion === 100,
    '半月结算在 100 封顶');
  ok(monthly.order.coupMilestones.includes('i100') && monthly.order.subversionMilestones.includes('s100'),
    '封顶时仍触发两条危机的最终里程碑');

  const old = Eng.createState('1919-09', 'historical', 153);
  Object.assign(old.order, { coup: 140, subversion: -8 });
  Object.assign(old.prev, { coup: 120, subversion: -3 });
  old.series.coup = [0, 70, 140];
  old.series.subversion = [-8, 50, 130];
  old.order.coupMilestones = ['i25', 'i50', 'i75', 'i100'];
  old.order.subversionMilestones = ['s25', 's50'];
  const before = JSON.stringify(old);
  const loaded = Eng.dispatch(s, { type: 'LOAD_STATE', state: old }).state;
  ok(loaded.order.coup === 100 && loaded.order.subversion === 0 && JSON.stringify(old) === before,
    '直接载入会规范压力范围且不修改传入的存档');
  const previousStorage = global.localStorage;
  let migrated;
  try {
    global.localStorage = { getItem: () => JSON.stringify({ auto: { state: old }, slots: [] }) };
    migrated = F.Sel.Save.load('auto');
  } finally {
    if (previousStorage === undefined) delete global.localStorage; else global.localStorage = previousStorage;
  }
  ok(migrated && migrated.order.coup === 100 && migrated.order.subversion === 0 &&
    migrated.prev.coup === 100 && migrated.prev.subversion === 0 &&
    migrated.series.coup.join(',') === '0,70,100' && migrated.series.subversion.join(',') === '0,50,100',
    '同版本旧存档的当前压力、快照和历史读数统一到 0–100');
  ok(migrated && JSON.stringify(migrated.order.coupMilestones) === JSON.stringify(old.order.coupMilestones) &&
    JSON.stringify(migrated.order.subversionMilestones) === JSON.stringify(old.order.subversionMilestones),
    '旧存档已经触发的里程碑保持不变');
}

console.log('\n=== ' + (fails === 0 ? '全部通过 ✓' : fails + ' 项失败 ✗') + ' ===');
process.exit(fails === 0 ? 0 : 1);
