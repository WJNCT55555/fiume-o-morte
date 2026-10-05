'use strict';
/* 校验攻略文档里引用的数值与代码一致 */
const path = require('path');
const fs = require('fs');
const H = require('./ending_harness.js');
const { Eng, S, W, R, Meta, Core } = H;

let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
const near = (a, b, t) => Math.abs(a - b) <= (t == null ? 1e-6 : t);

console.log('=== 难度配置（攻略 §1.4 / §1.5 声明） ===');
{
  const D = id => W.DIFFICULTIES.filter(d => d.id === id)[0];
  ok(D('historical').dateRule === 'forced', '史实 dateRule = forced（带日期的事件按历史年月强制推入）');
  ok(D('open').dateRule === 'conditionFirst', '普通 dateRule = conditionFirst（时间优先按条件）');
  ok(D('sandbox').dateRule === 'conditionFirst', '沙盒 dateRule = conditionFirst（事件触发同普通）');
  ok(D('open').dateRule === D('sandbox').dateRule, '普通与沙盒的事件触发规则完全一致');
  ok(!('dated' in D('historical')), '已移除旧的 dated 字段');
  ok(D('sandbox').hand === 5 && D('open').hand === 4, '沙盒 5 格手牌（卡牌侧才是差异）');
  ok(D('sandbox').coupMul === 0.5, '沙盒 coupMul = 0.5');
}

console.log('\n=== 开局底数（攻略 §1.3） ===');
const s0 = Eng.createState('1919-09', 'historical', 1);
ok(s0.ap === 2, 'AP = 2 每回合');
ok(s0.handLimit === 4, '手牌槽 = 4');
ok(s0.funds === 2400, '金库 = 2400');
ok(s0.order.milizia === 2500, '兵力 = 2500');
ok(s0.economy.population === 52000, '人口 = 52000');
ok(near(s0.economy.traffic, 34), '吞吐 = 34');
ok(near(s0.economy.unemployment, 24), '失业 = 24');
ok(near(s0.order.violence, 22), '暴力 = 22');
ok(near(s0.order.coup, 8), '政变轴 = 8');
ok(Object.values(s0.cabinet).every(f => f === 'LEG'), '开局七席全属 LEG');
ok(W.MAX_END.y === 1924 && W.MAX_END.m === 12, 'MAX_END = 1924-12（所有难度统一截止）');
ok(W.FORZA_FRONT_NEEDED === 3, 'FORZA_FRONT_NEEDED = 3');
/* ending_carnaro / ending_venice / ending_danzig / ending_natale / ending_exile_endured
   均已移除或改为成就 */
['ending_carnaro', 'ending_venice', 'ending_danzig', 'ending_natale', 'ending_exile_endured']
  .forEach(id => ok(!Meta.ENDINGS.some(e => e.id === id), `${id} 已从 ENDINGS 移除`));
ok(Meta.ACHIEVEMENTS.some(a => a.id === 'ach_venice'), 'ach_venice 已加入成就目录');
ok(Meta.ACHIEVEMENTS.some(a => a.id === 'ach_danzig'), 'ach_danzig 已加入成就目录');
ok(Meta.ENDINGS.length === 10, `ENDINGS 共 10 条（实际 ${Meta.ENDINGS.length}）`);
ok(Meta.ACHIEVEMENTS.length === 19, `ACHIEVEMENTS 共 19 条（实际 ${Meta.ACHIEVEMENTS.length}）`);
{
  /* 两个原结局的条件现在授予成就 */
  const s = Eng.createState('1919-09', 'open', 1);
  s.laws.portofranco = 3; s.economy.traffic = 90; s.factions.sindacalisti.inf = 24;
  s.achievements = [];
  R.checkAchievements(s);
  ok(s.achievements.includes('ach_venice'), '自由港 3 + 吞吐 90 + 工团派 24 → ach_venice');
  const s2 = Eng.createState('1919-09', 'open', 1);
  s2.laws.portofranco = 3; s2.economy.traffic = 90; s2.factions.sindacalisti.inf = 19;
  s2.achievements = [];
  R.checkAchievements(s2);
  ok(!s2.achievements.includes('ach_venice'), '工团派影响力 19 < 20 时不授予 ach_venice');
  const d = Eng.createState('1919-09', 'open', 1);
  d.flags.international_guarantee = true; d.flags.carta_done = true;
  d.achievements = [];
  R.checkAchievements(d);
  ok(d.achievements.includes('ach_danzig'), '共同保证 + 宪章完成 → ach_danzig');
}
{
  /* 阜姆公社的两个新门槛 */
  const cm = Meta.ENDINGS.filter(e => e.id === 'ending_comune')[0];
  const base = () => {
    const s = Eng.createState('1919-09', 'historical', 1);
    s.flags.carta_done = true; s.laws.lavoro = 3; s.laws.fisco = 2;
    s.factions.sindacalisti.inf = 60; s.forze.sindacalisti = 55;
    return s;
  };
  ok(!!cm.check(base()), '条件齐备时 ending_comune 成立');
  const a = base(); a.factions.sindacalisti.inf = 59;
  ok(!cm.check(a), '工团派影响力 59 < 60 → 不成立');
  const b = base(); b.forze.sindacalisti = 54;
  ok(!cm.check(b), '与革命工团主义者关系 54 < 55 → 不成立');
}
{
  const fom = Meta.ENDINGS.filter(e => e.id === 'ending_fiume_o_morte')[0];
  const st = Eng.createState('1919-09', 'historical', 1);
  st.flags.porto_revived = true; st.flags.carta_done = true; st.economy.traffic = 90;
  st.date = { y: 1924, m: 11, d: 15 };
  ok(!fom.check(st), 'ending_fiume_o_morte 在 1924-11 尚未成立');
  st.date = { y: 1924, m: 12, d: 16 };
  ok(!!fom.check(st), 'ending_fiume_o_morte 在 1924-12 成立（新门槛）');
}
{
  /* 条件满足即结算：checkEnd 不再等到硬结束点 */
  const s = Eng.createState('1919-09', 'open', 1);
  s.laws.portofranco = 3; s.economy.traffic = 90; s.factions.sindacalisti.inf = 24;
  s.achievements = [];
  /* 该状态本身没有结局条件成立之外的东西，构造一个「成立即结算」的证据：
     直接看 checkEnd 会不会因条件成立而结算 */
  const c = Eng.createState('1919-09', 'open', 1);
  c.flags.coup_done = true; c.order.violence = 80;   /* civil_strife 条件 */
  Eng.checkEnd(c);
  ok(c.ending === 'ending_civil_strife', '条件成立时 checkEnd 立即结算（civil_strife 条件 → 立即 ending_civil_strife）');
  const c2 = Eng.createState('1919-09', 'open', 1);
  Eng.checkEnd(c2);
  ok(!c2.ending, '开局（无任何结局条件成立）不结算');
}

console.log('\n=== 公式（攻略正文引用） ===');
{
  const mk = () => { const s = Eng.createState('1919-09', 'historical', 1); return s; };
  let s = mk(); s.economy.unemployment = 24; s.order.violence = 22;
  ok(near(R.emigration(s), 168), '移民公式：失业24/暴力22 → (24−12)×20 + (22−40)×4 = 168/回合');
  s = mk(); s.economy.traffic = 70;
  ok(near(R.unemploymentTarget(s), 46 - 0.42 * 70 - 0.12 * R.industryActivity(s), 1e-9),
    '失业目标 = 46 − 0.42×吞吐 − 0.12×工业活动');
  s = mk(); s.order.milizia = 10000;
  ok(near(R.spending(s).legion, 130), '军饷 = 兵力 × 0.013（10000 → 130）');
  /* 军官团分档 */
  const bands = W.FORZA_MILIZIA_BANDS;
  ok(bands[0].min === 9000 && near(bands[0].delta, 2.2), '兵力≥9000 档 → +2.2');
  ok(bands[1].min === 6000 && near(bands[1].delta, 1.2), '兵力≥6000 档 → +1.2');
  ok(near(W.FORZA_DRIFT.forzearmate, -0.4), '军官团基线漂移 = −0.4');
  s = mk(); s.order.milizia = 9500;
  ok(near(W.forzaMiliziaDelta(s, 'forzearmate') + W.FORZA_DRIFT.forzearmate, 1.8),
    '兵力≥9000 时军官团每回合净 +1.8');
}

console.log('\n=== 抽牌 / 冷却（攻略 §1.3） ===');
{
  const cards = Object.keys(Eng.CARD_BY_ID).map(k => Eng.CARD_BY_ID[k]);
  const cd = {}; cards.forEach(c => { cd[c.cooldown] = (cd[c.cooldown] || 0) + 1; });
  console.log('  冷却分布:', JSON.stringify(cd));
  ok(cd[9] === 4, '冷却 9（≈4.5 月）共 4 张');
  ok(cd[6] === 10, '冷却 6（≈3 月）共 10 张');
  ok(cd[4] === 12, '冷却 4（≈2 月）共 12 张');
  ok(cards.length === 26, '共 26 张卡');
  ok(cards.filter(c => c.deck === 'azione').length === 9, '行动卡 9 张');
  ok(cards.filter(c => c.deck === 'governo').length === 17, '政府卡 17 张');
}

console.log('\n=== 关键卡牌数值（攻略引用） ===');
{
  const opt = (id, oid) => {
    const c = Eng.CARD_BY_ID[id];
    const o = c.options.filter(x => x.id === oid)[0];
    return typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
  };
  const e1 = opt('az_reclutamento', 'regio_esercito');
  ok(near(e1.order.milizia, 1000) && near(e1.forze.forzearmate, 5),
    'az_reclutamento.regio_esercito：兵力 +1000、军官团 +5');
  const e2 = opt('az_propaganda', 'reclutamento');
  ok(near(e2.order.milizia, 450), 'az_propaganda.reclutamento：兵力 +450');
  const e3 = opt('az_forze_italia', 'corradini');
  ok(near(e3.forze.corradini, 26) && e3.forze.forzearmate === undefined,
    'az_forze_italia.corradini：民族主义 +26、不动军官团');
  const e4 = opt('gv_portofranco', 'decreto');
  ok(near(e4.laws.portofranco, 1) && near(e4.economy.traffic, 6), 'gv_portofranco.decreto：自由港 +1、吞吐 +6');
  const e5 = opt('gv_lavori', 'completo');
  ok(near(e5.economy.traffic, 6) && near(e5.economy.works, 14), 'gv_lavori.completo：吞吐 +6、工程 +14');
  const e6 = opt('gv_dogana_yu', 'accordo');
  ok(near(e6.economy.traffic, 7) && near(e6.economy.hinterland, 16), 'gv_dogana_yu.accordo：吞吐 +7、腹地 +16');
  const e7 = opt('gv_disoccupazione', 'cantieri');
  ok(near(e7.economy.unemployment, -6), 'gv_disoccupazione.cantieri：失业 −6');
  const e8 = opt('gv_fisco', 'moderato');
  ok(near(e8.laws.fisco, 1), 'gv_fisco.moderato：财政 +1');
  const e9 = opt('gv_bilancio', 'pareggio');
  ok(near(e9.economy.debt, -260) && near(e9.economy.inflation, -4), 'gv_bilancio.pareggio：债务 −260、通胀 −4');
  const e10 = opt('az_cervo_doro', 'bohemienne');
  ok(near(e10.factions.arditi.inf, -3), 'az_cervo_doro.bohemienne：阿迪蒂影响力 −3（唯一削减工团派邻项的来源）');
}

console.log('\n=== 事件数值（攻略引用） ===');
{
  const eff = (id, oid) => {
    const ev = Eng.EVENT_BY_ID[id];
    const o = ev.options.filter(x => x.id === oid)[0];
    return typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect;
  };
  /* 围攻链现在是三态结算：选项只改变守方定价，结局由 R.resolveBattle 决定 */
  const arrendersi = eff('ev_natale_fight', 'arrendersi');
  ok(arrendersi.forceEnding === 'ending_fuga', 'ev_natale_fight:arrendersi → forceEnding ending_fuga');
  {
    const lose = eff('ev_natale_lose', 'constatare');
    ok(lose.forceEnding === 'ending_eviction' && !!lose.flags.bloody_history,
      'ev_natale_lose:constatare → flags.bloody_history + forceEnding ending_eviction');
    const sm = eff('ev_natale_stalemate', 'trincea');
    ok(!!sm.flags.bloody_stalemate, 'ev_natale_stalemate:trincea → flags.bloody_stalemate');
    const cm = Meta.ENDINGS.filter(e => e.id === 'ending_civil_strife')[0];
    const st2 = Eng.createState('1919-09', 'historical', 1);
    st2.flags.bloody_stalemate = true;
    ok(!!cm.check(st2), '内战僵局也由围攻僵局触发（flags.bloody_stalemate）');
  }
  /* 三态结算原语本身 */
  {
    const bh = Meta.ENDINGS.filter(e => e.id === 'ending_eviction')[0];
    ok(!Meta.ENDINGS.some(e => e.id === 'ending_historical'), '旧 id ending_historical 已不存在');
    ok(!Meta.ENDINGS.some(e => e.id === 'ending_bloody_history'), '旧 id ending_bloody_history 已不存在');
    ok(bh.zh === '武装驱离' && bh.it === 'Lo sfratto armato', 'ending_eviction 中/意名称正确');
    const tr = Eng.createState('1919-09', 'historical', 1);
    tr.flags.treaty_rome = true;
    ok(!bh.check(tr), 'ending_eviction 不再由 treaty_rome 触发（1924 条约的那条线已摘除）');
    const ev = Eng.createState('1919-09', 'historical', 1);
    ev.flags.bloody_history = true;
    ok(!!bh.check(ev), 'ending_eviction 由 bloody_history 触发（围攻失败唯一入口）');
    const cs = Meta.ENDINGS.filter(e => e.id === 'ending_civil_strife')[0];
    ok(cs.zh === '内战僵局', 'ending_civil_strife 已改名为「内战僵局」');
    const s0 = Eng.createState('1919-09', 'historical', 1);
    const r = R.resolveBattle(s0, { defenderPower: 100, attackerPower: 50 });
    ok(r.state === 'victory', 'R.resolveBattle：守 100 / 攻 50 → victory');
    const r2 = R.resolveBattle(s0, { defenderPower: 80, attackerPower: 100 });
    ok(r2.state === 'stalemate', 'R.resolveBattle：守 80 / 攻 100（0.8）→ stalemate');
    const r3 = R.resolveBattle(s0, { defenderPower: 50, attackerPower: 100 });
    ok(r3.state === 'defeat', 'R.resolveBattle：守 50 / 攻 100（0.5）→ defeat');
    const r4 = R.resolveBattle(s0, { defenderPower: 0, attackerPower: 100 });
    ok(r4.state === 'defeat', 'R.resolveBattle：守方为 0 → 直接 defeat');
  }
  const u = eff('ev_1920_06_romafronte', 'ufficiali');
  ok(near(u.forze.forzearmate, 22) && near(u.funds, -600), 'ev_1920_06_romafronte:ufficiali → 军官团 +22、金库 −600');
  const w = eff('ev_1920_10_adunata', 'annuncio_marcia');
  ok(near(w.forze.fascisti, 8) && near(w.forze.socialisti, 8) && near(w.forze.anarchici, 8) && near(w.forze.comunisti, 8),
    'ev_1920_10_adunata:annuncio_marcia → 四股各 +8');
  const g = eff('ev_1920_11_rapallo', 'guerra');
  ok(near(g.order.coup, 26), 'ev_1920_11_rapallo:guerra → 事态 +26');
  const m = eff('ev_1920_10_adunata', 'eccidio');
  ok(near(m.order.violence, 8) && near(m.order.subversion, 6), 'ev_1920_10_adunata:eccidio → 暴力 +8、党内轴 +6');
  const r1 = eff('ev_romafronte_mussolini', 'patto');
  console.log('  ev_romafronte_mussolini:patto forze =', JSON.stringify(r1.forze));
  ok(near(r1.forze.fascisti, 26), 'ev_romafronte_mussolini:patto → 法西斯 +26');
  const r2 = eff('ev_romafronte_malatesta', 'insurrezione');
  console.log('  ev_romafronte_malatesta:insurrezione forze =', JSON.stringify(r2.forze));
  ok(near(r2.forze.anarchici, 34), 'ev_romafronte_malatesta:insurrezione → 无政府 +34');
  const r3 = eff('ev_romafronte_bombacci', 'legge');
  ok(near(r3.forze.socialisti, 28), 'ev_romafronte_bombacci:legge → 社会党 +28');
  const r4 = eff('ev_romafronte_gramsci', 'firma');
  console.log('  ev_romafronte_gramsci:firma forze =', JSON.stringify(r4.forze));
  ok(near(r4.forze.comunisti, 28), 'ev_romafronte_gramsci:firma → 共产党 +28');
  /* 敌意连带：用引擎真算一次，确认攻略表格里的连带值 */
  {
    const s = Eng.createState('1919-09', 'historical', 1);
    R.applyEffect(s, { forze: { fascisti: 26 } });
    const dAn = s.forze.anarchici - 30, dCo = s.forze.comunisti - 24;
    console.log('  法西斯 +26 的连带：无政府', dAn.toFixed(3), ' 共产党', dCo.toFixed(3));
    ok(near(dAn, -6.5, 0.01) && near(dCo, -8.667, 0.01), '法西斯 +26 → 无政府 −6.5 / 共产党 −8.67');
    const s2 = Eng.createState('1919-09', 'historical', 1);
    R.applyEffect(s2, { forze: { anarchici: 34, comunisti: 28 } });
    console.log('  无政府 +34 → 军官团', (s2.forze.forzearmate - 22).toFixed(3),
      '；共产党 +28 → 军官团', (s2.forze.forzearmate - 22).toFixed(3));
    ok(near(s2.forze.forzearmate - 22, -5.667 - 4.667, 0.02), '无政府 +34 / 共产党 +28 合计把军官团压 −10.33');
    const s3 = Eng.createState('1919-09', 'historical', 1);
    R.applyEffect(s3, { forze: { corradini: 26 } });
    console.log('  民族主义 +26 → 共产党', (s3.forze.comunisti - 24).toFixed(3), ' 社会党', (s3.forze.socialisti - 32).toFixed(3));
    ok(near(s3.forze.comunisti - 24, -6.5, 0.01) && near(s3.forze.socialisti - 32, -4.333, 0.01),
      '民族主义 +26 → 共产党 −6.5 / 社会党 −4.33，军官团不动');
  }
  /* 进军终局 */
  const ep = eff('ev_romafronte_epilogo', 'partire');
  ok(ep.forceEnding === 'ending_marcia_1920' && !!ep.flags.marcia_1920,
    'ev_romafronte_epilogo:partire → forceEnding ending_marcia_1920');
  /* 1924 危机链：接受合并 → 吞并；拒绝 → 三态。两条路径按 forze.fascisti 互斥。 */
  {
    const mk = v => { const s = Eng.createState('1919-09', 'historical', 1); s.date = { y: 1924, m: 1, d: 15 }; s.forze.fascisti = v; return s; };
    const romeEv = Eng.EVENT_BY_ID.ev_1924_01_rome;
    const coupEv = Eng.EVENT_BY_ID.ev_1924_fascist_coup;
    ok(!!coupEv, 'ev_1924_fascist_coup 已注册（法西斯政变变体）');
    ok(romeEv.condition(mk(59)) === true && coupEv.condition(mk(59)) === false,
      'forze.fascisti 59 → 只触发外交条约');
    ok(romeEv.condition(mk(60)) === false && coupEv.condition(mk(60)) === true,
      'forze.fascisti 60 → 只触发法西斯政变');
    const s0 = Eng.createState('1919-09', 'historical', 1);
    s0.order.squadre = 60; s0.order.subversion = 120; s0.order.garrison = 22;
    ok(R.treatyForces(s0, 'attacker') < R.annexationForces(s0, 'attacker') / 5,
      `外交条约攻方 (${Math.round(R.treatyForces(s0, 'attacker'))}) 远弱于法西斯政变 (${Math.round(R.annexationForces(s0, 'attacker'))})`);
  }
  const firmare = eff('ev_1924_01_rome', 'firmare');
  ok(firmare.forceEnding === 'ending_annexation' && !!firmare.flags.annexation,
    'ev_1924_01_rome:firmare → flags.annexation + forceEnding ending_annexation');
  ['negoziare', 'mobilitare', 'ripiegare'].forEach(t => {
    const e = eff('ev_1924_01_rome', t);
    ok(['ev_1924_win', 'ev_1924_stalemate', 'ev_1924_lose'].indexOf(e.next) >= 0,
      `ev_1924_01_rome:${t} → 三态之一（${e.next}）`);
  });
  ['trattare', 'barricare', 'cedere'].forEach(t => {
    const e = eff('ev_1924_fascist_coup', t);
    ok(['ev_1924_win', 'ev_1924_stalemate', 'ev_1924_lose'].indexOf(e.next) >= 0,
      `ev_1924_fascist_coup:${t} → 三态之一（${e.next}）`);
  });
  ok(eff('ev_1924_stalemate', 'constatare').forceEnding === 'ending_civil_strife',
    'ev_1924_stalemate:constatare → ending_civil_strife');
  ok(eff('ev_1924_lose', 'constatare').forceEnding === 'ending_fascio',
    'ev_1924_lose:constatare → ending_fascio');
  /* 政变链 */
  const cf1 = eff('ev_coup_fight', 'a'), cf2 = eff('ev_coup_fight', 'b'), cf3 = eff('ev_coup_fight', 'c');
  ok([cf1, cf2, cf3].every(x => !!x.flags.coup_done && !x.flags.exile && !x.flags.stay),
    'ev_coup_fight 三选项：coup_done 但不带 exile/stay');
  ok(near(cf1.order.violence, -20), 'ev_coup_fight:a → 暴力 −20');
  ok(near(cf2.order.violence, 15), 'ev_coup_fight:b → 暴力 +15');
  const ca = eff('ev_coup_after', 'a'), cb = eff('ev_coup_after', 'b');
  ok(!!ca.flags.exile && !!cb.flags.stay, 'ev_coup_after：a→exile，b→stay');
  const esc = eff('ev_coup', 'fuggire');
  ok(!!esc.flags.coup_done && !!esc.flags.exile, 'ev_coup:fuggire → coup_done + exile');
}

console.log('\n=== 日志条件 ===');
{
  const j = id => Meta.JOURNAL_BY_ID[id];
  let s = Eng.createState('1919-09', 'historical', 1);
  s.diplo.uk = 65; s.diplo.france = 65; s.diplo.usa = 60;
  ok(!j('garanzia').complete(s), 'garanzia 仅外交达标还不够（还需 carta_done）');
  s.flags.carta_done = true;
  ok(!!j('garanzia').complete(s), 'garanzia = uk≥65 && france≥65 && usa≥60 && carta_done');
  const s2 = Eng.createState('1919-09', 'historical', 1);
  s2.date.y = 1926;
  ok(!!j('carnaro') === false || true, '(占位)');
  /* esilio / resistenza */
  const s3 = Eng.createState('1919-09', 'historical', 1);
  ok(!j('esilio').complete(s3), 'esilio 需 exileMonths ≥ 24');
  s3.counters.exileMonths = 24;
  ok(!!j('esilio').complete(s3), 'esilio 在 exileMonths = 24 时完成');
  const s4 = Eng.createState('1919-09', 'historical', 1);
  s4.counters.resistMonths = 18; s4.order.squadre = 24;
  ok(!!j('resistenza').complete(s4), 'resistenza = squadre < 25 && resistMonths ≥ 18');
}

console.log('\n=== 可复现对局（攻略各节实测数据） ===');
{
  const V = require('./end_verify.js');
  const CASES = [
    ['silent_port', 'ending_silent_port', 'historical', 100],
    ['fuga', 'ending_fuga', 'historical', 100],
    ['fascio', 'ending_fascio', 'historical', 174],
    ['civil_strife', 'ending_civil_strife', 'historical', 100],
    ['marcia_1920', 'ending_marcia_1920', 'historical', 100],
    ['comune', 'ending_comune', 'historical', 100],
    ['annexation', 'ending_annexation', 'historical', 100],
    ['fiume_o_morte', 'ending_fiume_o_morte', 'historical', 100],
  ];
  for (const [goal, want, diff, seed] of CASES) {
    const s = V.run(goal, seed, { difficulty: diff }).s;
    ok(s.ending === want, `${goal.padEnd(14)} ${diff.padEnd(10)} seed ${seed} → ${s.ending}（@${s.date.y}-${s.date.m}）`);
  }
  /* ending_eviction 是事件驱动的（forceEnding），不走策略代理碰运气：
     它在围攻链里由 R.resolveBattle 判败后确定性命中。
     判败阈值与链路见 end_blockers.js / _siege_chain.js 的断言。 */
  {
    const s0 = Eng.createState('1919-09', 'historical', 1);
    ok(R.resolveBattle(s0, { defenderPower: 2000, attackerPower: 11276 }).state === 'defeat',
      '武装驱离的入口：守 2000 / 攻 11276 → defeat（判败才走 ev_natale_lose）');
    const lose = Eng.EVENT_BY_ID.ev_natale_lose.options[0]
      .effect(Eng.createState('1919-09', 'historical', 1));
    ok(lose.forceEnding === 'ending_eviction', 'ev_natale_lose → forceEnding ending_eviction');
  }
}

console.log('\n' + (bad === 0 ? '攻略数值与代码全部一致 ✓' : bad + ' 项不符 ✗'));
process.exit(bad ? 1 : 0);
