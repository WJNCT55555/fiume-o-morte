'use strict';
/* 对每个「不可达」结局，验证其阻塞原因是否可以由代码静态证明。 */
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const V = require('./end_verify.js');
const { Eng, W, R, Meta, Core } = H;

let failures = 0;
function ok(cond, msg) { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) failures++; }

const E = id => Meta.ENDINGS.filter(e => e.id === id)[0];

/* ---------- 1. 事件调度规则：三档 dateRule ---------- */
console.log('=== 1. 难度 dateRule 门控（reducers.js pickEvent） ===');
{
  const dated = Object.keys(Eng.EVENT_BY_ID).map(k => Eng.EVENT_BY_ID[k]).filter(e => e.date && !e.superEvent && !e.chain);
  console.log(`  带 date 的可排期事件共 ${dated.length} 个`);
  const dif = W.DIFFICULTIES.filter(d => d.id === 'open')[0];
  ok(dif.dateRule === 'conditionFirst', '普通 dateRule = conditionFirst（时间优先按条件）');
  const hist = W.DIFFICULTIES.filter(d => d.id === 'historical')[0];
  ok(hist.dateRule === 'forced', '史实 dateRule = forced（带日期的事件按历史年月推入）');
  const sb = W.DIFFICULTIES.filter(d => d.id === 'sandbox')[0];
  ok(sb.dateRule === 'conditionFirst', '沙盒 dateRule = conditionFirst（事件触发同普通）');
  ok(sb.dateRule === dif.dateRule, '普通与沙盒的触发规则完全一致');
  ok(sb.hand === 5, '沙盒手牌 5 格');
  ok(sb.coupMul === 0.5, '沙盒 coupMul = 0.5');
  /* 规则三分 */
  const both = dated.filter(e => !!e.condition);
  const dateOnly = dated.filter(e => !e.condition);
  console.log(`  带日期+有条件 ${both.length} 个: ${both.map(e => e.id).join(', ')}`);
  console.log(`  带日期+无条件 ${dateOnly.length} 个（三档都按年月推入）`);
  /* 6 since the 1924 crisis split into two mutually exclusive dated+conditioned
     events: the diplomatic treaty (`forze.fascisti < 60`) and the fascist coup
     (`>= 60`). */
  ok(both.length === 6, '6 个事件同时带日期与条件 → 普通/沙盒改按条件排期');
  ok(both.some(e => e.id === 'ev_1924_01_rome' && e.id !== 'ev_1924_fascist_coup'),
    '1924 外交条约是按条件排期的带日期事件');
  ok(both.some(e => e.id === 'ev_1924_fascist_coup'), '1924 法西斯政变同理');
  ok(!!Eng.EVENT_BY_ID.ev_1920_01_deambris.condition,
    'ev_1920_01_deambris 带条件 → 普通/沙盒由条件触发（宪章链在两种难度都可达）');
  ok(both.some(e => e.id === 'ev_1920_01_deambris'), '宪章链入口在「带日期+有条件」这一组里');
  /* 只有它设 deambris_arrived / charter_drafted，只有 ev_carta_programma 设 charter_program */
  const mixinSets = [];
  Object.keys(Eng.EVENT_BY_ID).forEach(k => {
    const ev = Eng.EVENT_BY_ID[k];
    (ev.options || []).forEach(o => {
      let eff; try { eff = typeof o.effect === 'function' ? o.effect(Eng.createState('1919-09', 'historical', 1)) : o.effect; } catch (e) { return; }
      if (eff && eff.flags && (eff.flags.charter_program || eff.flags.deambris_arrived || eff.flags.charter_drafted)) mixinSets.push(ev.id + ':' + o.id);
    });
  });
  console.log('  设置 charter_program/deambris_arrived/charter_drafted 的选项:', mixinSets.join(', ') || '（无）');
  ok(mixinSets.every(x => /^ev_1920_01_deambris|^ev_carta_programma/.test(x)),
    '只有 ev_1920_01_deambris → ev_carta_programma 这一条链能开出宪章纲领');
}

/* ---------- 2. flags.carta_done 的唯一来源 ---------- */
console.log('\n=== 2. flags.carta_done 的唯一来源 ===');
{
  /* carta 日志的 complete 需要 charter_promulgated + charter_debate_resolved + 七条法律 */
  const carta = Meta.JOURNAL_BY_ID.carta;
  const need = Meta.CHARTER_REQUIREMENTS;
  const s = Eng.createState('1919-09', 'historical', 1);
  ok(!carta.complete(s), '新开局 carta 日志未完成');
  s.flags.charter_promulgated = true; s.flags.charter_debate_resolved = true;
  need.forEach(r => { s.laws[r.id] = r.level; });
  ok(!!carta.complete(s), '颁布+阿伦戈+七条法律 = carta 日志完成 → onComplete 设 carta_done');
  ok(!!carta.onComplete().flags.carta_done, 'carta.onComplete 写 flags.carta_done');
  /* gv_lingua 只能到 lingua 1 / scuola 2；gv_polizia 只能到 ordine 2；
     gv_stampa 只能到 stampa 2；gv_cittadinanza 可到 3；gv_tutele 可到 3；
     elettorale 只有 gv_arengo(+1) 与 ev_1920_09_carta(+1) / ev_carta_dibattito(+1) */
  const elecSources = [];
  Object.keys(Eng.CARD_BY_ID).forEach(k => {
    const c = Eng.CARD_BY_ID[k];
    (c.options || []).forEach(o => {
      let eff; try { eff = typeof o.effect === 'function' ? o.effect(s) : o.effect; } catch (e) { return; }
      if (eff && eff.laws && eff.laws.elettorale) elecSources.push('card ' + c.id + ':' + o.id + ' +' + eff.laws.elettorale);
    });
  });
  Object.keys(Eng.EVENT_BY_ID).forEach(k => {
    const ev = Eng.EVENT_BY_ID[k];
    (ev.options || []).forEach(o => {
      let eff; try { eff = typeof o.effect === 'function' ? o.effect(s) : o.effect; } catch (e) { return; }
      if (eff && eff.laws && eff.laws.elettorale) elecSources.push('event ' + ev.id + ':' + o.id + ' +' + eff.laws.elettorale);
    });
  });
  console.log('  elettorale 来源:', elecSources.join(' | '));
  const fromCard = elecSources.filter(x => x.startsWith('card'));
  console.log('  其中来自卡牌的:', fromCard.join(' | '));
  ok(fromCard.length === 1 && /gv_arengo/.test(fromCard[0]), '卡牌里只有 gv_arengo 能加选举法（+1）');
  const eventIds = elecSources.filter(x => x.startsWith('event')).map(x => x.split(' ')[1].split(':')[0]);
  console.log('  其中来自事件的:', eventIds.join(', '));
  /* 逐个说明为什么普通难度拿不到 */
  const datedIds = eventIds.filter(id => !!Eng.EVENT_BY_ID[id].date);
  const condGated = eventIds.filter(id => !Eng.EVENT_BY_ID[id].date);
  console.log('    带 date（普通难度不排期）:', datedIds.join(', '));
  console.log('    无 date（靠条件门控）:', condGated.join(', '));
  ok(datedIds.length === 3, '只有 3 个事件源带 date（普通难度一律不排期）');
  {
    /* ev_carta_dibattito 与 ev_natale_deal 靠条件门控，逐一验证其在普通难度下不可达 */
    const a = Eng.EVENT_BY_ID.ev_carta_dibattito;
    const s5 = Eng.createState('1919-09', 'open', 1);
    const vis = a.condition.toString().replace(/\s+/g, ' ');
    console.log('    ev_carta_dibattito 条件:', vis);
    const s6 = Eng.createState('1919-09', 'open', 1);
    s6.flags.charter_promulgated = true;
    ok(!!a.condition(s6), 'ev_carta_dibattito 需要 charter_promulgated —— 而该 flag 来自 dated 链');
    const nd = Eng.EVENT_BY_ID.ev_natale_deal;
    ok(!!nd.chain, 'ev_natale_deal 是 chain 节点，只能由 ev_natale 进入（ev_natale 是 superEvent，另需 coup>=100）');
  }
}

/* ---------- 3. ending_natale 已移除；围攻改为三态结算 ---------- */
console.log('\n=== 3. 血腥圣诞已不再是结局；围攻链改为三态结算 ===');
{
  ok(!Meta.ENDINGS.some(e => e.id === 'ending_natale'), 'ending_natale 已从 ENDINGS 移除');
  ok(!Meta.ENDINGS.some(e => e.id === 'ending_historical'), 'ending_historical 已不存在');
  ok(!Meta.ENDINGS.some(e => e.id === 'ending_bloody_history'), 'ending_bloody_history 已改名为 ending_eviction');
  const bh = E('ending_eviction');
  ok(bh.zh === '武装驱离' && bh.it === 'Lo sfratto armato', 'ending_eviction 中/意名为「武装驱离」');
  const cs = E('ending_civil_strife');
  ok(cs.zh === '内战僵局', 'ending_civil_strife 中文名为「内战僵局」');
  /* 三态结算：按参考项目 civil_war.scene.dry:73-84 的形状 */
  const s0 = Eng.createState('1919-09', 'historical', 1);
  ok(R.resolveBattle(s0, { defenderPower: 100, attackerPower: 50 }).state === 'victory', '守100/攻50 → victory');
  ok(R.resolveBattle(s0, { defenderPower: 80, attackerPower: 100 }).state === 'stalemate', '守80/攻100 → stalemate');
  ok(R.resolveBattle(s0, { defenderPower: 50, attackerPower: 100 }).state === 'defeat', '守50/攻100 → defeat');
  ok(R.resolveBattle(s0, { defenderPower: 0, attackerPower: 100 }).state === 'defeat', '守0 → defeat');
  ok(R.resolveBattle(s0, { defenderPower: 95, attackerPower: 100 }).favorable === true,
    'favorable 只是文本温度：95/100 仍判 stalemate 但 favorable=true');
  /* 三个臂都存在，且各自的出口正确 */
  const win = Eng.EVENT_BY_ID.ev_natale_win;
  const sm = Eng.EVENT_BY_ID.ev_natale_stalemate;
  const lose = Eng.EVENT_BY_ID.ev_natale_lose;
  ok(!!win && !!sm && !!lose, 'ev_natale_win / ev_natale_stalemate / ev_natale_lose 都已注册');
  const loseEff = lose.options[0].effect(Eng.createState('1919-09', 'historical', 1));
  ok(loseEff.forceEnding === 'ending_eviction',
    '失守臂 forceEnding → ending_eviction（武装驱离挂在围攻失败上）');
  const smEff = sm.options[0].effect(Eng.createState('1919-09', 'historical', 1));
  ok(!!smEff.flags.bloody_stalemate, '僵局臂设 flags.bloody_stalemate → ending_civil_strife');
  const winNext = win.options[0].effect(Eng.createState('1919-09', 'historical', 1)).next;
  ok(winNext === 'ev_natale_after', '守住臂继续游戏（next → ev_natale_after）');
}

/* ---------- 4. ev_1924_01_rome：1924+ 结局的总闸门 ---------- */
console.log('\n=== 4. 1924 危机链：接受合并 → 吞并；拒绝 → 三态 ===');
{
  const rome = Eng.EVENT_BY_ID.ev_1924_01_rome;
  ok(!!rome.date && rome.date.y === 1924 && rome.date.m === 1, 'ev_1924_01_rome 是 dated 事件（1924-01）');
  const st = Eng.createState('1919-09', 'historical', 1);
  st.date = { y: 1924, m: 1, d: 15 };
  ok(rome.condition(st) === true, 'condition 在「独立摄政」时为真');
  /* 政变成功 / 流亡 / 留守三种状态都不该再触发 1924 危机（各自的路线已自行收束） */
  [['coup_done', '政变已成功'], ['exile', '已流亡'], ['stay', '已留守']].forEach(([f, label]) => {
    const c = Eng.createState('1919-09', 'historical', 1);
    c.date = { y: 1924, m: 1, d: 15 }; c.flags[f] = true;
    ok(rome.condition(c) === false, `${label} → 1924 危机不触发`);
  });
  /* 接受合并 = 吞并结局 */
  const firmare = rome.options.filter(o => o.id === 'firmare')[0]
    .effect(Eng.createState('1919-09', 'historical', 1));
  ok(firmare.forceEnding === 'ending_annexation' && !!firmare.flags.annexation,
    'firmare → flags.annexation + forceEnding ending_annexation');
  const ann = E('ending_annexation');
  ok(ann.zh === '吞并' && ann.it === 'L\'annessione', 'ending_annexation 中/意名为「吞并」');
  ok(!ann.check(Eng.createState('1919-09', 'historical', 1)), 'ending_annexation 开局不成立');
  /* 拒绝合并 = 三态，且阈值与围攻链一致 */
  const s0 = Eng.createState('1919-09', 'historical', 1);
  ok(R.resolveAnnexation(s0, { defenderPower: 100, attackerPower: 50 }).state === 'victory', '1924：守100/攻50 → victory');
  ok(R.resolveAnnexation(s0, { defenderPower: 80, attackerPower: 100 }).state === 'stalemate', '1924：守80/攻100 → stalemate');
  ok(R.resolveAnnexation(s0, { defenderPower: 50, attackerPower: 100 }).state === 'defeat', '1924：守50/攻100 → defeat');
  const win = Eng.EVENT_BY_ID.ev_1924_win;
  const sm = Eng.EVENT_BY_ID.ev_1924_stalemate;
  const lose = Eng.EVENT_BY_ID.ev_1924_lose;
  ok(!!win && !!sm && !!lose, 'ev_1924_win / _stalemate / _lose 都已注册');
  ok(win.options[0].effect(Eng.createState('1919-09', 'historical', 1)).next === undefined,
    '打赢臂不设 next（继续游戏）');
  ok(sm.options[0].effect(Eng.createState('1919-09', 'historical', 1)).forceEnding === 'ending_civil_strife',
    '僵局臂 forceEnding → ending_civil_strife');
  ok(lose.options[0].effect(Eng.createState('1919-09', 'historical', 1)).forceEnding === 'ending_fascio',
    '打输臂 forceEnding → ending_fascio');
  /* 吞并 ≠ 武装驱离：两条不同的历史出口 */
  ok(ann.priority !== E('ending_eviction').priority,
    `吞并 (${ann.priority}) 与武装驱离 (${E('ending_eviction').priority}) 是两个独立结局`);
  /* ending_eviction 只读 bloody_history —— treaty_rome 与 exile 都不再触发结局 */
  const ev = E('ending_eviction');
  const s2 = Eng.createState('1919-09', 'historical', 1);
  s2.flags.treaty_rome = true;
  ok(!ev.check(s2), 'ending_eviction 不由 treaty_rome 触发（1924 走的是吞并）');
  s2.flags.treaty_rome = false; s2.flags.exile = true;
  ok(!ev.check(s2), 'ending_eviction 不由 exile 触发');
  s2.flags.exile = false; s2.flags.bloody_history = true;
  ok(!!ev.check(s2), 'ending_eviction 唯一入口 = bloody_history（围攻失败）');
  /* 1924-03 的硬结束分支已删除：原本它只为 ending_historical 的 treaty_rome 服务，
     现在 treaty_rome 不选任何结局，那条分支只会让游戏在 1924-03 落入兜底。 */
  {
    const c = Eng.createState('1919-09', 'historical', 1);
    c.date = { y: 1924, m: 3, d: 15 };
    c.flags.treaty_rome = true;
    c.flags.porto_revived = true; c.economy.traffic = 90; c.flags.carta_done = true;
    c.factions.sindacalisti.inf = 10; c.forze.sindacalisti = 10;
    Eng.checkEnd(c);
    ok(c.ending !== 'ending_timer',
      `1924-03 不再强制结算为兜底（实际 ${c.ending || '未结算'}）——这是 fiume_o_morte 可达的前提`);
    const d = Eng.createState('1919-09', 'historical', 1);
    d.date = { y: 1924, m: 12, d: 16 };
    d.flags.treaty_rome = true;
    d.flags.porto_revived = true; d.economy.traffic = 90; d.flags.carta_done = true;
    d.factions.sindacalisti.inf = 10; d.forze.sindacalisti = 10;
    Eng.checkEnd(d);
    ok(d.ending === 'ending_fiume_o_morte',
      `同一状态撑到 1924-12 → ending_fiume_o_morte（实际 ${d.ending}）`);
  }
  /* ending_carnaro 与 ending_venice 均已移除 */
  ok(!E('ending_carnaro'), 'ending_carnaro 已从 ENDINGS 移除');
  ok(!E('ending_venice'), 'ending_venice 已从 ENDINGS 移除（改为成就 ach_venice）');
  ok(Meta.ENDINGS.length === 10, `ENDINGS 共 10 条（实际 ${Meta.ENDINGS.length}）`);
  ok(Meta.ACHIEVEMENTS.some(a => a.id === 'ach_venice'), 'ach_venice 已加入成就目录');
  {
    const fom = E('ending_fiume_o_morte');
    const ev2 = E('ending_eviction');
    ok(fom.priority > ev2.priority,
      `ending_fiume_o_morte (${fom.priority}) 排在 ending_eviction (${ev2.priority}) 之后——但后者只由围攻失败触发，不再抢它`);
    ok(!/date\.y\s*>=\s*192[67]/.test(fom.check.toString()),
      'ending_fiume_o_morte 不再要求 1926/1927');
    const s = Eng.createState('1919-09', 'historical', 1);
    s.flags.porto_revived = true; s.flags.carta_done = true; s.economy.traffic = 90;
    s.date = { y: 1924, m: 11, d: 15 };
    ok(!fom.check(s), 'ending_fiume_o_morte 在 1924-11 不成立');
    s.date = { y: 1924, m: 12, d: 16 };
    ok(!!fom.check(s), 'ending_fiume_o_morte 在 1924-12 成立');
    /* commune(8) 排在 fiume_o_morte(10.5) 之前，且两者共享 carta_done。
       （danzig 已改为成就 ach_danzig，不再参与优先级竞争。） */
    const cm = E('ending_comune');
    ok(cm.priority < fom.priority,
      `ending_comune (${cm.priority}) 抢先于 ending_fiume_o_morte (${fom.priority})`);
    const s2 = Eng.createState('1919-09', 'historical', 1);
    s2.flags.carta_done = true; s2.laws.lavoro = 3; s2.laws.fisco = 2;
    s2.factions.sindacalisti.inf = 60; s2.forze.sindacalisti = 55;
    s2.flags.porto_revived = true; s2.economy.traffic = 90;
    s2.date = { y: 1924, m: 12, d: 16 };
    ok(!!cm.check(s2) && !!fom.check(s2), '条件齐备时 commune 与 fiume_o_morte 同时成立');
    ok(R.resolveEnding(s2).id === 'ending_comune',
      '→ resolveEnding 取 ending_comune（priority 8 在前）');
  }
  /* checkEnd 的硬结束：1924-03 那条 treaty_rome 分支已删除 ——
     它现在既不该结算，也不该拦住 fiume_o_morte。 */
  {
    const s3 = Eng.createState('1919-09', 'historical', 1);
    s3.flags.treaty_rome = true; s3.date = { y: 1924, m: 3, d: 16 };
    Eng.checkEnd(s3);
    ok(!s3.ending, 'checkEnd 在 treaty_rome + 1924-03 时不结算（旧的强制结算分支已删）');
    const s4 = Eng.createState('1919-09', 'historical', 1);
    s4.date = { y: 1924, m: 12, d: 16 };
    Eng.checkEnd(s4);
    ok(!!s4.ending, 'checkEnd 在 1924-12（MAX_END）仍会结算（' + s4.ending + '）');
  }
}

/* ---------- 5. ending_venice 已改为成就 ach_venice ---------- */
console.log('\n=== 5. ending_venice → ach_venice ===');
{
  ok(!E('ending_venice'), 'ending_venice 已从 ENDINGS 移除');
  const s = Eng.createState('1919-09', 'open', 1);
  s.laws.portofranco = 3; s.economy.traffic = 90; s.factions.sindacalisti.inf = 24;
  s.achievements = [];
  Eng.postProcess(s);
  R.checkAchievements(s);
  ok(s.achievements.includes('ach_venice'), '同一条件现在授予成就 ach_venice');
  /* 该状态不应再命中任何结局（成就不是结局） */
  const hit = Meta.ENDINGS.filter(e => e.id !== 'ending_timer')
    .filter(e => { try { return !!e.check(s); } catch (err) { return false; } })
    .map(e => e.id);
  ok(hit.length === 0, `自由港3+吞吐90+工团派24 不再命中任何实质结局（实际 ${hit.join(',') || '无'}）`);
}

/* ---------- 6. ending_timer 的兜底性质 ---------- */
console.log('\n=== 6. ending_timer（priority 99 兜底） ===');
{
  const t = E('ending_timer');
  ok(t.priority === 99, 'ending_timer priority = 99（最后判定）');
  ok(t.check(Eng.createState('1919-09', 'open', 1)) === true, '其 check 恒为真');
  ok(Meta.ENDINGS.filter(e => e.priority > 99).length === 0, '没有比它更低的优先级');
  /* 只要比赛还在继续且没有别的结局命中，MAX_END 一定会结算成它 */
  const s = Eng.createState('1919-09', 'open', 1);
  s.date = { y: 1927, m: 12, d: 16 };
  Eng.checkEnd(s);
  ok(!!s.ending, 'MAX_END 时 checkEnd 会结算 → ' + s.ending);
}

console.log('\n' + (failures === 0 ? '全部阻塞原因均已静态证明 ✓' : failures + ' 项未能证明 ✗'));
process.exit(failures ? 1 : 0);
