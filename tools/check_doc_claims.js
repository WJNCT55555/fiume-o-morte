/* Behavioural checks for the claims the design document makes. Reading the
   source proves intent; this proves what the engine actually does. */
const path = require('path');
const ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));
require.extensions['.ts'] = (module, filename) => {
  const src = require('fs').readFileSync(filename, 'utf8');
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
const F = globalThis.Fiume, Eng = F.Engine, R = F.Rules, Core = F.Core, W = F.World;

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : fail++; console.log((cond ? '  ok   ' : '  FAIL ') + msg); };

console.log('§3  时间与回合');
let s = Eng.createState('1919-09', 'historical', 42);
ok(s.date.y === 1919 && s.date.m === 9 && s.date.d === 12, `开局 ${s.date.y}-${s.date.m}-${s.date.d}`);
ok(s.ap === 2 && s.maxAp === 2, `开局 ${s.ap}/${s.maxAp} AP`);
const d0 = s.date.d;
Eng.advanceWeek(s, Core.makeRng(1));
ok(s.date.d === 30 && s.date.m === 9, `推进一回合到 ${s.date.m} 月 ${s.date.d} 日（下半月月末）`);
ok(s.ap === 2, `结算后 AP 恢复为 ${s.ap}`);
ok(s.monthIndex === 1, `回合计数 ${s.monthIndex}（每回合 +1，非跨月才加）`);

console.log('§5  军团民意是派生的');
s = Eng.createState('1919-09', 'historical', 42);
const nat = R.nationalSupport(s);
ok(Math.abs(s.legitimacy - nat.LEG) < 0.01, `军团民意 ${s.legitimacy.toFixed(1)} == 全国支持 LEG ${nat.LEG.toFixed(1)}`);
const before = s.legitimacy;
R.applyEffect(s, { legitimacy: 50 });
ok(Math.abs(s.legitimacy - before) < 0.001, `写入 legitimacy 补丁后值不变（${s.legitimacy.toFixed(1)}）`);
R.applyEffect(s, { support: [['operai', 'LEG', 5]] });
Eng.postProcess(s);
ok(s.legitimacy > before, `提升产业工人支持后，派生民意随之上升（${before.toFixed(1)}→${s.legitimacy.toFixed(1)}）`);

console.log('§6  保守分布');
W.CLASSES.forEach(c => {
  const row = s.classes[c.id].support;
  const sum = W.PARTIES.reduce((a, p) => a + (row[p.id] || 0), 0);
  ok(Math.abs(sum - 100) < 0.5, `${c.zh} 支持行和 ${sum.toFixed(2)}`);
});
const popSum = W.CLASSES.reduce((a, c) => a + s.classes[c.id].pop, 0);
ok(Math.abs(popSum - 100) < 0.5, `阶层人口权重合计 ${popSum}`);
const infSum = W.FACTIONS.reduce((a, f) => a + s.factions[f.id].inf, 0);
ok(Math.abs(infSum - 100) < 0.5, `派系影响力合计 ${infSum.toFixed(2)}`);

console.log('§14 抽卡完全手动');
s = Eng.createState('1919-09', 'historical', 42);
ok(s.hand.length === 0, `开局预留处为空（${s.hand.length}/${s.handLimit}）`);
Eng.advanceWeek(s, Core.makeRng(2));
ok(s.hand.length === 0, `推进一回合后仍为空（无自动补牌）：${s.hand.length}`);
const decks = F.Sel.decks(s);
ok(decks.length === 2, `牌库数 ${decks.length}`);
const first = decks.find(d => d.cards.length);
const drawn = Eng.dispatch(s, { type: 'DRAW_CARD', cardId: first.cards[0].id }).state;
ok(drawn.hand.length === 1, `手动抽卡后 ${drawn.hand.length} 张`);

console.log('§7  党际关系对称');
s = Eng.createState('1919-09', 'historical', 42);
let sym = true;
W.PARTIES.forEach(a => W.PARTIES.forEach(b => {
  if (a.id < b.id && Math.abs(R.relationOf(s, a.id, b.id) - R.relationOf(s, b.id, a.id)) > 0.001) sym = false;
}));
ok(sym, '关系矩阵对称');

console.log('§18 Core.sub 中文模式返回空');
ok(Core.sub({ zh: '甲', it: 'A' }) === '', 'Core.sub 在中文模式返回空串');
ok(Core.L({ zh: '甲', it: 'A' }) === '甲', 'Core.L 在中文模式返回中文');

console.log('§11.5 一九一九年的两场投票');
{
  const flags = f => { const t = Eng.createState('1919-09', 'historical', 7); Object.assign(t.flags, f); return t; };
  const one = R.municipalElection(flags({ single_list: true }));
  const two = R.municipalElection(flags({ free_election: true }));
  const none = R.municipalElection(flags({ no_election: true }));
  ok(one.detail.council === R.MUNICIPAL_SEATS, `市议会 ${R.MUNICIPAL_SEATS} 席`);
  ok((one.detail.turnout < 50) && (two.detail.turnout > 60),
     `弃权把投票率压到 ${one.detail.turnout}%，全员参选是 ${two.detail.turnout}%`);
  ok(one.detail.share.AUT == null && one.detail.share.PCR == null, '一份名单时自治党与克罗地亚人不在票面上');
  ok(!!two.detail.share.AUT && !!two.detail.share.PCR, '两份名单时他们都在票面上');
  ok(none.detail.noElection && !Object.values(none.seats).some(v => v > 0), '不选举时没有议会');
  // the isolation the doc claims
  const iso = flags({ free_election: true });
  const held = iso.counters.electionsHeld, cab = JSON.stringify(iso.cabinet);
  Eng.runMunicipal(iso);
  ok(iso.counters.electionsHeld === held && JSON.stringify(iso.cabinet) === cab,
     'runMunicipal 不动 electionsHeld 与内阁（文档如此声明）');

  const acc = R.modusVote(flags({ modus_accepted: true }));
  const blk = R.modusVote(flags({ modus_blocked: true }));
  const dly = R.modusVote(flags({ modus_delayed: true }));
  ok(acc.carried === true && blk.carried === false, '接受通过、拒绝否决');
  ok(dly.absPct > 40, `拖延时弃权 ${dly.absPct}%（军团观望）`);
  ok(Math.abs(acc.yesPct + acc.noPct + acc.absPct - 100) < 0.5, '三项占比合计 100%');
}

console.log();
console.log(`PASS ${pass} / ${pass + fail}`);
process.exit(fail ? 1 : 0);
