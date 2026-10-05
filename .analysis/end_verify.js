/* 结局可达性验证：对每个目标结局跑多局真实对局 */
'use strict';
const H = require('./ending_harness.js');
const ST = require('./end_strategies.js');
const { Eng, S, W, R, Meta } = H;

/* 只使用事件的最短计划表（对事件驱动的结局足够） */
const EVENTS = {
  /* ---- 并入意大利线 ---- */
  fuga: {
    ev_1919_09_marcia: ['a'], ev_1919_10_comunali: ['a'], ev_1919_10_persia: ['a'],
    ev_1919_11_blocco: ['a'], ev_1919_11_modus: ['a'],
    ev_1920_01_deversa: ['a'],
    ev_1920_06_romafronte: ['restare'],
    ev_natale: ['partire'],
  },
  natale: {
    ev_1920_06_romafronte: ['restare'],
    ev_natale: ['partire'],
  },
  natale_fight: {
    ev_1920_06_romafronte: ['restare'],
    ev_natale: ['resistere'],
    ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
  },
  /* 血腥的僵局：政变后暴力 > 70 */
  civil_strife: {
    ev_1919_09_marcia: ['b'],
    ev_1919_10_comunali: ['c'],
    ev_1919_11_blocco: ['d'], ev_1919_11_modus: ['b'],
    ev_1920_10_adunata: ['eccidio'],
    ev_1920_11_rapallo: ['guerra'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
    ev_coup: ['resistere'], ev_coup_fight: ['b'],
    ev_1924_01_rome: ['b'],
  },
  /* coup_done 且不带 exile/stay —— 只有 ev_coup_fight 的三个选项做到 */
  fascio: {
    ev_1919_09_marcia: ['a'],
    ev_1919_10_comunali: ['c'],
    ev_1919_11_blocco: ['a'], ev_1919_11_modus: ['a'],
    ev_1920_04_sciopero: ['a'],
    ev_1920_06_alleati: ['b'],
    ev_1920_06_romafronte: ['restare'],
    ev_1920_09_carta: ['a'],
    ev_1920_11_rapallo: ['trattare'],
    ev_natale: ['trattare'], ev_natale_deal: ['b'],
    ev_natale_after: ['restare'],
    ev_coup: ['resistere'], ev_coup_fight: ['a'],
    ev_1924_01_rome: ['b'],
  },
  /* 血腥的僵局：政变后暴力 > 70；不要开进军日志，也不要把宪章走完 */
  civil_strife: {
    ev_1919_09_marcia: ['b'],
    ev_1919_10_comunali: ['c'],
    ev_1919_11_blocco: ['d'], ev_1919_11_modus: ['b'],
    ev_1920_06_romafronte: ['restare'],
    ev_1920_09_carta: ['c', 'b'],
    ev_carta_dibattito: ['c', 'b'],
    ev_1920_10_adunata: ['eccidio'],
    ev_1920_11_rapallo: ['guerra'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
    ev_coup: ['resistere'], ev_coup_fight: ['b'],
    ev_violence: ['b'],
    ev_strike: ['c'],
    ev_1924_01_rome: ['b'],
  },
  /* 武装驱离：围攻失败分支 —— 让围攻轴满，抵抗，但**不养兵**（判败）。 */
  historical: {
    ev_1920_06_romafronte: ['restare'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
    ev_violence: ['c'],
    ev_strike: ['b'],
    ev_1919_09_marcia: ['a'],
    ev_1919_10_comunali: ['c'],
    /* 不要颁布宪章：宪章链一旦完成，ending_comune（8）会抢先。 */
    ev_1920_09_carta: ['c', 'b'],
    ev_carta_dibattito: ['c', 'b'],
  },
  /* 尚未落幕：不干预，交给兜底 */
  timer: {
    ev_1919_09_marcia: ['a'],
    ev_1919_10_comunali: ['c'],
    ev_1919_11_blocco: ['c'], ev_1919_11_modus: ['b'],
    ev_1920_06_romafronte: ['restare'],
    ev_natale: ['trattare'], ev_natale_deal: ['b'],
    ev_natale_after: ['restare'],
    ev_violence: ['a'],
    ev_strike: ['b'],
  },
  silent_port: {
    ev_1919_09_marcia: ['b'],
    ev_1919_10_comunali: ['c'],
    ev_1919_11_blocco: ['d'], ev_1919_11_modus: ['b'],
    ev_1920_06_romafronte: ['restare'],
    ev_1920_10_adunata: ['eccidio'],
    ev_1920_11_rapallo: ['guerra'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
    ev_violence: ['b'],
    ev_strike: ['c'],
    ev_coup: ['resistere'], ev_coup_fight: ['a'],
    ev_1924_01_rome: ['b'],
    ev_coup: ['resistere'], ev_coup_fight: ['b'],
    ev_1924_01_rome: ['b'],
  },
  /* ---- 卡尔纳罗线 ---- */
  carnaro: {
    ev_1919_09_marcia: ['c'],
    ev_1919_10_comunali: ['a'],
    ev_1919_11_blocco: ['a'],
    ev_1919_11_modus: ['a'],
    ev_1920_06_alleati: ['a'],
    ev_1920_06_romafronte: ['restare'],
    ev_1920_04_sciopero: ['a'],
    ev_1920_09_carta: ['a'],
    ev_1920_11_rapallo: ['a'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
    ev_1920_10_adunata: ['a'],
  },
  fiume_o_morte: {
    ev_1919_09_marcia: ['c'],
    ev_1919_10_comunali: ['a'],
    ev_1919_11_blocco: ['a'],
    ev_1919_11_modus: ['a'],
    ev_1920_06_alleati: ['a'],
    ev_1920_06_romafronte: ['restare'],
    ev_1920_04_sciopero: ['a'],
    ev_1920_09_carta: ['a'],
    ev_1920_11_rapallo: ['a'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
    /* 1924 危机必须拒绝签字：firmare 会立刻走吞并结局（1924-01），
       而 fiume_o_morte 的门槛在 1924-12。要撑到最后就得拒签并打赢。
       默认走外交条约线（forze.fascisti < 60），选项 id 为 negoziare。 */
    ev_1924_01_rome: ['negoziare'],
    ev_1924_fascist_coup: ['trattare'],
    ev_1924_win: ['durare'],
  },
  /* 吞并：1924 危机接受签字。最短的一条线。 */
  annexation: {
    ev_1919_09_marcia: ['c'],
    ev_1919_10_comunali: ['a'],
    ev_1919_11_blocco: ['a'],
    ev_1919_11_modus: ['a'],
    ev_1920_06_romafronte: ['restare'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
    /* 不走宪章：commune(8) 会在 1921 抢先，到不了 1924。 */
    ev_1920_09_carta: ['c', 'b'],
    ev_carta_dibattito: ['c', 'b'],
    ev_1924_01_rome: ['firmare'],
  },
  danzig: {
    ev_1919_09_marcia: ['c'],
    ev_1919_10_comunali: ['b'],
    ev_1919_11_modus: ['a'],
    ev_1920_06_alleati: ['a'],
    ev_1920_06_romafronte: ['restare'],
    ev_1920_04_sciopero: ['a'],
    ev_1920_09_carta: ['a'],
    ev_1920_11_rapallo: ['a'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
    ev_1920_10_adunata: ['a'],
  },
  comune: {
    ev_1919_09_marcia: ['c'],
    ev_1919_10_comunali: ['a'],
    ev_1919_11_blocco: ['a'],
    ev_1919_11_modus: ['a'],
    ev_1920_06_alleati: ['a'],
    ev_1920_06_romafronte: ['restare'],
    ev_1920_04_sciopero: ['a'],
    ev_1920_09_carta: ['a'],
    ev_1920_11_rapallo: ['a'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
  },
  venice: {
    ev_1919_09_marcia: ['c'],
    ev_1919_10_comunali: ['a'],
    ev_1919_11_blocco: ['a'],
    ev_1919_11_modus: ['a'],
    ev_1920_06_alleati: ['a'],
    ev_1920_06_romafronte: ['restare'],
    ev_1920_09_carta: ['a'],
    ev_1920_11_rapallo: ['a'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['restare'],
    ev_violence: ['c'],
    ev_strike: ['b'],
  },
  /* 普通难度：没有 dated 事件，《罗马条约》不会触发 */
  venice_open: {
    ev_violence: ['c'],
    ev_strike: ['b'],
    ev_baross_talks: ['a'],
  },
  /* ---- 进军线 ---- */
  marcia_1920: {
    ev_1919_09_marcia: ['b'],
    ev_1919_10_comunali: ['c'],
    ev_1919_11_blocco: ['a'],
    ev_1919_11_modus: ['a'],
    ev_1920_01_inverno: ['a'],
    ev_1920_06_romafronte: ['ufficiali'],
    ev_1920_09_romafronte: ['aspettare'],
    ev_1920_11_rapallo: ['guerra'],
    ev_natale: ['resistere'], ev_natale_fight: ['tenere'],
    ev_natale_after: ['congiura'],
    ev_romafronte_mussolini: ['patto'],
    ev_romafronte_malatesta: ['insurrezione'],
    ev_romafronte_bombacci: ['legge'],
    ev_romafronte_gramsci: ['firma'],
    ev_romafronte_epilogo: ['partire'],
  },
  /* 提前进军：1920-09 就走（只要两股力量） */
  marcia_early: {
    ev_1919_09_marcia: ['b'],
    ev_1919_10_comunali: ['c'],
    ev_1919_11_blocco: ['b'],
    ev_1920_01_inverno: ['a'],
    ev_1920_06_romafronte: ['ufficiali'],
    ev_1920_09_romafronte: ['adesso'],
    ev_romafronte_epilogo: ['partire'],
    ev_romafronte_mussolini: ['patto'],
    ev_romafronte_malatesta: ['insurrezione'],
  },
  exile_endured: {
    ev_1919_09_marcia: ['a'],
    ev_1919_10_comunali: ['c'],
    ev_1919_11_blocco: ['a'], ev_1919_11_modus: ['a'],
    ev_1920_06_romafronte: ['restare'],
    ev_natale: ['trattare'], ev_natale_deal: ['b'],
    ev_natale_after: ['restare'],
    ev_coup: ['cedere'], ev_coup_after: ['a'],
  },
  /* 留守分支：政变后留在城里，撑到 24 个月 */
  stay_occupied: {
    ev_1919_09_marcia: ['a'],
    ev_1919_10_comunali: ['c'],
    ev_1919_11_blocco: ['a'], ev_1919_11_modus: ['a'],
    ev_1920_06_romafronte: ['restare'],
    ev_natale: ['trattare'], ev_natale_deal: ['b'],
    ev_natale_after: ['restare'],
    ev_coup: ['cedere'], ev_coup_after: ['b'],
  },
};

/* 卡牌选项表 */
const OPTS = {
  gv_arengo: ['convocare'],
  gv_portofranco: ['decreto'],
  gv_dogana_yu: ['accordo'],
  gv_lavori: ['completo'],
  gv_fisco: ['moderato'],
  gv_disoccupazione: ['cantieri'],
  gv_lingua: ['bilingue'],
  gv_cittadinanza: ['residenza'],
  gv_polizza: ['comunale'],
  gv_polizia: ['comunale'],
  gv_stampa: ['liberta'],
  gv_tutele: ['salario', 'soccorso', 'contratti'],
  gv_orario: ['otto_ore', 'riposo', 'ferie'],
  gv_amnistia: ['politici'],
  gv_disarco: ['disarmo'],
  gv_bilancio: ['pareggio'],
  gv_nota_roma: ['tecnica'],
  gv_nave: ['requisizione', 'requisire'],
  az_reclutamento: ['socialisti', 'regio_esercito'],
  az_propaganda: ['reclutamento'],
  az_forze_italia: ['deambris', 'socialisti', 'corradini', 'fascisti', 'anarchici'],
  az_fiume_league: ['ungheria', 'soviet', 'balcani'],
  az_legione_finanziaria: ['obbligazioni', 'affitto'],
  az_uscocchi: ['sequestrare'],
  az_intrighi: ['autonomi'],
  az_cervo_doro: ['amante'],
  az_fazioni: ['sindacalisti', 'disciplina'],
};

/* ---------------- 单一对局循环（run / trace 共用） ---------------- */
function play(goalId, seed, opts) {
  opts = opts || {};
  const agent = ST.makeAgent(goalId, EVENTS[goalId] || {}, OPTS);
  if (opts.noCards) { agent.draw = () => null; agent.card = () => null; }
  const log = [];
  let s = Eng.createState('1919-09', opts.difficulty || 'historical', seed);
  let guard = 0, lastKey = '';
  const snap = () => {
    log.push(`  ${s.date.y}-${String(s.date.m).padStart(2, '0')}`
      + ` 兵力${String(Math.round(s.order.milizia)).padStart(6)} 人口${String(Math.round(s.economy.population)).padStart(6)}`
      + ` 吞吐${String(Math.round(s.economy.traffic)).padStart(3)} 失业${String(Math.round(s.economy.unemployment)).padStart(3)}`
      + ` coup${String(Math.round(s.order.coup)).padStart(4)} subv${String(Math.round(s.order.subversion)).padStart(4)}`
      + ` viol${String(Math.round(s.order.violence)).padStart(3)} 权威${String(Math.round(s.order.authority)).padStart(3)}`
      + ` 金库${String(Math.round(s.funds)).padStart(5)} 合法${String(Math.round(s.legitimacy)).padStart(3)}`
      + ` ap${s.ap} 手牌${s.hand.length}`
      + ` [${Object.keys(s.flags).filter(k => s.flags[k] === true
        && /natale|martyred|coup|exile|stay|treaty|dannunzio|marcia|carta|porto|guarantee|blood|fascio|reconciled|legion_party/.test(k)).join(',')}]`);
  };
  while (s.phase !== 'ended' && guard++ < 5000) {
    if (opts.trace && s.date.y + '-' + s.date.m !== lastKey) { lastKey = s.date.y + '-' + s.date.m; snap(); }
    /* 事件优先 */
    if (s.currentEvent) {
      const ev = Eng.EVENT_BY_ID[s.currentEvent];
      if (!ev) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      const avail = ev.options.filter(o => !o.condition || o.condition(s));
      let pickId = agent.event(s, ev, avail);
      let pick = avail.find(o => o.id === pickId) || avail[0];
      if (!pick) { s = Eng.dispatch(s, { type: 'ADVANCE' }).state; continue; }
      if (opts.trace) log.push(`    事件 ${s.date.y}-${s.date.m} ${ev.id} → ${pick.id}`);
      s = Eng.dispatch(s, { type: 'RESOLVE_EVENT', optionId: pick.id }).state;
      if (s.phase === 'ended') break;
      continue;
    }
    /* 月度：税 / 姿态 / 抽牌打牌 */
    const t = opts.tax || agent.tax(s);
    for (const k of Object.keys(t)) s = Eng.dispatch(s, { type: 'SET_TAX', tax: k, value: t[k] }).state;
    const p = agent.posture(s);
    if (p && p !== s.posture) s = Eng.dispatch(s, { type: 'SET_POSTURE', posture: p }).state;
    let plays = 0;
    if (!opts.noCards) {
      while (plays++ < 14) {
        if (s.phase === 'ended') break;
        if (s.hand.length < s.handLimit) {
          const decks = S.decks(s).filter(d => d.drawable);
          const d = agent.draw(s, decks);
          if (d) {
            const r = Eng.dispatch(s, { type: 'DRAW_RANDOM', deck: d });
            if (r.state !== s) s = r.state;
          }
        }
        const hv = S.hand(s).filter(c => c.playable);
        const cid = agent.card(s, hv);
        const pickC = hv.find(c => c.id === cid);
        if (!pickC) break;
        const before = s;
        const r = Eng.dispatch(s, { type: 'PLAY_CARD', cardId: pickC.id });
        if (r.state === before) break;
        s = r.state;
        if (opts.trace) log.push(`    卡 ${s.date.y}-${s.date.m} ${pickC.id}`);
        if (s.pendingCard) {
          const card = Eng.CARD_BY_ID[s.pendingCard];
          const oo = Eng.cardOptions(s, card).filter(o => o.enabled);
          const oid = agent.option(s, card, oo);
          const o = oo.find(x => x.id === oid) || oo[0];
          if (!o) break;
          const r2 = Eng.dispatch(s, { type: 'RESOLVE_CARD_OPTION', optionId: o.id });
          if (r2.state !== s) s = r2.state;
        }
      }
    }
    const before = s;
    const adv = Eng.dispatch(s, { type: 'ADVANCE' });
    if (adv.state === before) break;
    s = adv.state;
  }
  const hits = Meta.ENDINGS.filter(e => { try { return !!e.check(s); } catch (err) { return false; } })
    .sort((a, b) => a.priority - b.priority).map(e => e.id);
  return { s, hits, log };
}

function run(goalId, seed, opts) { return play(goalId, seed, opts); }

/* 打印一局的轨迹 */
function trace(goalId, seed, opts) {
  const r = play(goalId, seed, Object.assign({ trace: true }, opts));
  r.log.forEach(l => console.log(l));
  console.log(`  结束 ${r.s.date.y}-${r.s.date.m} phase=${r.s.phase} ending=${r.s.ending}`
    + ` 候选[${r.hits.join(', ')}]`);
  return r.s;
}

function report(goalId, seeds, difficulty) {
  const goal = ST.GOALS[goalId];
  console.log(`\n######## 目标结局 ${goalId} 「${goal.label}」 [难度 ${difficulty || 'historical'}] ########`);
  let win = 0;
  for (const seed of seeds) {
    const { s, hits } = run(goalId, seed, { difficulty });
    const ok = s.ending === (goal.ending || ('ending_' + goalId));
    if (ok) win++;
    console.log(`  seed ${String(seed).padStart(5)} ${ok ? '✅' : '❌'} → ${String(s.ending).padEnd(24)} @ ${s.date.y}-${String(s.date.m).padStart(2, '0')}`
      + `  人口${String(Math.round(s.economy.population)).padStart(6)} 吞吐${String(Math.round(s.economy.traffic)).padStart(3)}`
      + ` 兵力${String(Math.round(s.order.milizia)).padStart(6)} 合法性${String(Math.round(s.legitimacy)).padStart(3)}`
      + ` coup${String(Math.round(s.order.coup)).padStart(4)} subv${String(Math.round(s.order.subversion)).padStart(4)}`
      + `  ${!ok ? '命中候选[' + hits.join(',') + ']' : ''}`);
  }
  console.log(`  → ${win}/${seeds.length} 命中`);
  return win;
}

module.exports = { run, report, trace, EVENTS, OPTS };

if (require.main === module) {
  const which = process.argv[2];
  const n = parseInt(process.argv[3] || '3', 10);
  const seeds = Array.from({ length: n }, (_, i) => 100 + i * 37);
  if (which === 'trace') {
    trace(process.argv[3], parseInt(process.argv[4] || '100', 10),
      { noCards: process.argv[5] === 'nocards', difficulty: process.argv[6] || 'historical' });
  } else if (which === 'all') {
    let tot = 0, cnt = 0;
    for (const g of Object.keys(ST.GOALS)) { tot += report(g, seeds, process.argv[4]); cnt++; }
    console.log(`\n===== 合计 ${tot}/${cnt * seeds.length} =====`);
  } else {
    report(which, seeds, process.argv[4]);
  }
}
