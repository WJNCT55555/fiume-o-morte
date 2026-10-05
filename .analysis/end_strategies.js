/* 结局验证：策略库
   每个 ending 一个 goal 定义（阈值 + 关键 flag + 事件选项表），
   一个通用 agent 按 goal 打分选牌、选抽牌堆、选事件选项。

   注意：本文件是只读验证工具，不修改 src/。
*/
'use strict';
const H = require('./ending_harness.js');
const { Eng, S, W, R, Meta } = H;

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */
function get(s, path) {
  let cur = s;
  for (const k of path.split('.')) {
    if (cur == null) return 0;
    cur = cur[k];
  }
  return cur;
}
function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }

/* flag -> 在 effect 里被写入的键 */
const FLAG_KEYS = ['dannunzio_left', 'martyred', 'coup_done', 'exile', 'stay', 'exile_endured',
  'passive_victory', 'treaty_rome', 'carta_done', 'international_guarantee', 'porto_revived',
  'charter_promulgated', 'charter_debate_resolved', 'charter_program', 'marcia_1920',
  'marcia_1920_open', 'marcia_1920_early', 'fascio_disarmed', 'reconciled', 'rest_in_city',
  'stay_political', 'blood_christmas', 'legion_party', 'natale_done'];

/* ------------------------------------------------------------------ *
 * levers：一张卡的作用面标签
 * ------------------------------------------------------------------ */
const LEVERS = {
  az_reclutamento: ['milizia'],
  az_propaganda: ['milizia', 'fervour'],
  az_forze_italia: ['forze'],
  az_fiume_league: ['diplo', 'funds'],
  az_legione_finanziaria: ['fisco', 'funds'],
  az_uscocchi: ['arms', 'funds'],
  az_intrighi: ['relations'],
  az_cervo_doro: ['fervour'],
  az_fazioni: ['lavoro', 'dis'],
};

/* ------------------------------------------------------------------ *
 * 通用打分
 * ------------------------------------------------------------------ */
function makeScorer(goal) {
  const G = Object.assign({
    thresholds: {},      // { 'laws.lavoro': {gte:3, w:5} }
    flags: [],           // ['carta_done']
    laws: {},            // { lavoro: 3 }  -> 达成即封顶
    milizia: null,       // { gte: 10000, w: 6 }
    forze: null,         // { gate: 80, need: 3, w: 4 }
    forzearmate: null,   // { gte: 60, w: 5 }
    traffic: null,       // { gte: 85, w: 5 }
    diplo: null,         // { uk:65, france:65, usa:60, w:5 }
    sindacalistiInf: null,
    population: null,    // { lte: 44000 } 反向目标
    violence: null,
    keepFlags: [],       // 必须避免的 flag
  }, goal || {});

  /* 对某个 effect 产物打分。结构 { order:{}, laws:{}, flags:{}, ... } */
  function scoreEffect(eff) {
    if (!eff || typeof eff !== 'object') return 0;
    let sc = 0;
    const flags = eff.flags || {};
    /* 关键 flag */
    for (const f of G.flags) if (flags[f] !== undefined) {
      /* 目标 flag 出现：给高分；若已拥有则不再加分 */
      sc += 1000;
    }
    for (const f of G.keepFlags) if (flags[f] === true) sc -= 1000;

    const laws = eff.laws || {};
    for (const k of Object.keys(laws)) {
      const target = num(G.laws[k]);
      if (target > 0) sc += num(laws[k]) * 40 * (1 + target);
      else sc += num(laws[k]) * -30;  /* 不需要的法律：轻微负分，避免乱花 AP */
    }

    const order = eff.order || {};
    if (G.milizia) {
      const cur = num(order.__miliziaCur) || 0;
      sc += num(order.milizia) * (G.milizia.w || 4) * 0.05;
    } else {
      sc += num(order.milizia) * -0.02;   /* 不需要兵力时避免养兵成本 */
    }
    if (G.traffic && num(order.traffic) > 0) sc += num(order.traffic) * (G.traffic.w || 3);
    if (G.violence === 'up') sc += num(order.violence) * 6;
    if (G.violence === 'down') sc -= num(order.violence) * 6;
    if (G.wantViolenceUp) sc += num(order.violence) * (G.wantViolenceUp);

    const forze = eff.forze || {};
    if (G.forze) {
      for (const k of Object.keys(forze)) {
        if (k === 'forzearmate') continue;
        if (num(forze[k]) > 0) sc += num(forze[k]) * (G.forze.w || 3);
      }
    }
    if (G.forzearmate) sc += num(forze.forzearmate) * (G.forzearmate.w || 8);

    const econ = eff.economy || {};
    if (G.traffic) sc += num(econ.traffic) * (G.traffic.w || 3);

    const dip = eff.diplo || {};
    if (G.diplo) {
      for (const k of Object.keys(G.diplo)) {
        if (k === 'w') continue;
        sc += num(dip[k]) * (G.diplo.w || 3);
      }
    }

    const fac = eff.factions || {};
    if (G.sindacalistiInf) sc += num((fac.sindacalisti || {}).inf) * (G.sindacalistiInf.w || 8);

    /* 合法性：唯一的内生防线（同时拖慢两个危机轴） */
    if (G.legitimacy) {
      const sup = eff.support || [];
      sup.forEach(function (row) {
        if (Array.isArray(row) && row[1] === 'LEG') sc += num(row[2]) * 2;
      });
      sc -= num((eff.order || {}).squadre) * (G.legitimacy.w || 4);
      sc -= num((eff.order || {}).subversion) * (G.legitimacy.w || 4);
    }

    /* 明确伤害目标的项要扣分 */
    if (G.flags.indexOf('coup_done') >= 0 && flags.coup_done) sc -= 5000;
    if (G.noCoup && (num(order.subversion) > 0 || flags.coup_done)) sc -= 200;
    return sc;
  }

  /* 两个 effect 相减，得到「下家的状态差」——用于撤销 flag 的情况 */
  function scorePair(pre, eff) {
    /* pre 是选项自己的 preview 之外的 before 快照，可选 */
    return scoreEffect(eff);
  }

  return { G, scoreEffect, scorePair };
}

/* ------------------------------------------------------------------ *
 * goal 目录：每个目标结局一组参数
 * ------------------------------------------------------------------ */
const GOALS = {
  /* ---- 崩溃线 ---- */
  /* 无声的港口：不修港口、不压失业、不压暴力 → 每月大量外流，人口跌破 44000。
     刻意「什么都不建」是这条线的正解：任何提升吞吐的行动都会推高人口。 */
  silent_port: {
    label: '无声的港口',
    flags: [],
    violence: 'up',
    wantViolenceUp: 3,
    /* 建港/加吞吐/加人口的卡一律不打 */
    avoidCards: ['gv_portofranco', 'gv_lavori', 'gv_dogana_yu', 'gv_disoccupazione', 'gv_fisco'],
    drawOrder: ['azione'],
  },
  /* 血腥的僵局：政变后把暴力顶到 70 以上；
     政变最早 1922-03 才可能，所以必须**避免更早成立的结局**：
       - commune(8)：不走完宪章（封 gv_arengo，宪章事件选「只读诗」）
       - silent_port(1)：把吞吐/失业经营好，保住人口
       - historical(7)：不要签《罗马条约》——但 1924-01 它会强制触发，
         所以政变必须在 1924-01 之前发生。 */
  civil_strife: {
    label: '内战僵局',
    flags: ['coup_done'],
    laws: { portofranco: 3, dogana: 3, fisco: 2 },
    traffic: { gte: 70, w: 6 },
    violence: 'up',
    wantViolenceUp: 1,
    drawOrder: ['governo', 'azione'],
    keepFlags: ['martyred'],
    collapseGuard: true,
    avoidCards: ['gv_arengo'],
    evGated: {
      ev_1920_09_carta: [['c', () => true], ['b', () => true]],
      ev_carta_dibattito: [['c', () => true], ['b', () => true]],
      ev_violence: [
        ['c', s => !s.flags.coup_done],
        ['b', s => !!s.flags.coup_done],
        ['a', () => true],
      ],
      ev_strike: [
        ['b', s => !s.flags.coup_done],
        ['c', s => !!s.flags.coup_done],
        ['a', () => true],
      ],
      ev_1920_10_adunata: [
        ['discorso', s => !s.flags.coup_done],
        ['eccidio', s => !!s.flags.coup_done],
      ],
      ev_1920_11_rapallo: [
        ['trattare', s => !s.flags.coup_done],
        ['guerra', s => !!s.flags.coup_done],
      ],
      ev_blockade: [
        ['a', s => !s.flags.coup_done],
        ['b', s => !!s.flags.coup_done],
      ],
    },
    cardGate: s => !s.flags.coup_done,
  },
  /* 尚未落幕：什么都不做，让 1927-12 到点 */
  timer: {
    label: '尚未落幕',
    flags: [],
    violence: 'down',
    drawOrder: [],
  },

  /* ---- 并入意大利线 ---- */
  fuga: {
    label: '诗人离开',
    flags: ['dannunzio_left'],
    keepFlags: ['martyred'],
    violence: 'down',
    drawOrder: [],
  },
  natale: {
    label: '血腥圣诞',
    flags: ['martyred'],
    violence: 'up', wantViolenceUp: 0.5,
    /* 需要兵力极低（<300）才能命中，所以主动压低兵力 */
    avoidCards: ['az_reclutamento', 'az_propaganda', 'az_fazioni'],
    preferAbsent: ['order.milizia'],
    drawOrder: ['azione', 'governo'],
    posture: 'roma',
  },
  /* 备选：走「让军团兵撤出」分支，兵力直接归零（`partire` 不设 martyred） */
  natale_fight: {
    label: '血腥圣诞（撤军分支）',
    flags: [],
    violence: 'up', wantViolenceUp: 0.5,
    avoidCards: ['az_reclutamento', 'az_propaganda', 'az_fazioni'],
    preferAbsent: ['order.milizia'],
    drawOrder: ['azione', 'governo'],
    posture: 'roma',
  },  fascio: {
    label: '法西斯城邦',
    flags: ['coup_done'],
    violence: 'down',
    drawOrder: [],
  },
  historical: {
    label: '武装驱离',
    /* 围攻失败分支：不要养兵（守/攻 ≤ 0.6 判败），但要把围攻轴顶满。 */
    flags: ['bloody_history'],
    violence: 'up',
    wantViolenceUp: 1,
    drawOrder: ['azione', 'governo'],
    keepFlags: [],
    /* 不打会加兵力的牌，让军团停在判败区间 */
    avoidCards: ['az_legione_finanziaria', 'gv_lega', 'gv_polizia'],
  },

  /* ---- 进军线 ---- */
  marcia_1920: {
    label: '进军罗马',
    ending: 'ending_marcia_1920',
    flags: ['marcia_1920'],
    milizia: { gte: 10000, w: 6 },
    forzearmate: { gte: 60, w: 10 },
    forze: { gate: 80, need: 3, w: 4 },
    violence: 'down',
    drawOrder: ['azione', 'governo'],
    miliziaFirst: true,
  },
  marcia_early: {
    label: '进军罗马（1920-09 提前窗口）',
    ending: 'ending_marcia_1920',
    flags: ['marcia_1920'],
    milizia: { gte: 10000, w: 6 },
    forzearmate: { gte: 60, w: 10 },
    forze: { gate: 80, need: 2, w: 4 },
    violence: 'down',
    drawOrder: ['azione', 'governo'],
    miliziaFirst: true,
  },
  exile_endured: {
    label: '长夜里的集会',
    flags: ['exile_endured', 'passive_victory'],
    violence: 'down',
    drawOrder: ['governo', 'azione'],
    posture: 'internation',
    noCoup: true,
  },
  stay_occupied: {
    label: '留守占领区（长夜里的集会·第二路径）',
    flags: ['passive_victory'],
    violence: 'down',
    drawOrder: ['governo', 'azione'],
    posture: 'internation',
    noCoup: true,
  },

  /* ---- 卡尔纳罗线 ---- */
  annexation: {
    label: '吞并',
    /* 1924 危机接受签字：需要活到 1924-01 且不政变、不流亡、不留守。
       守住 1920 围城是前提（否则走武装驱离）。
       不要走完宪章链 —— commune(8) 会在 1921 就抢先。 */
    flags: ['annexation'],
    violence: 'down',
    drawOrder: ['governo', 'azione'],
    noCoup: true,
    avoidCards: ['gv_arengo'],
  },
  danzig: {
    label: '亚得里亚的但泽',
    flags: ['carta_done', 'international_guarantee'],
    laws: { elettorale: 3, cittadinanza: 2, ordine: 2, stampa: 2, scuola: 1, lingua: 1, lavoro: 3 },
    diplo: { uk: 65, france: 65, usa: 60, w: 6 },
    violence: 'down',
    drawOrder: ['governo', 'azione'],
    posture: 'internation',
    noCoup: true,
    /* danzig(10) 与 commune(8) 都要 carta_done，但 commune 只要
       lavoro≥3 && fisco≥2 就先成立。要拿但泽必须让 fisco 停在 1
       （或让 lavoro 停在 2），把 commune 的条件卡住。 */
    blocks: [{ path: 'laws.fisco', gte: 2, card: null }],
  },
  comune: {
    label: '阜姆公社',
    flags: ['carta_done'],
    laws: { lavoro: 3, fisco: 2, elettorale: 3, cittadinanza: 2, ordine: 2, stampa: 2, scuola: 1, lingua: 1 },
    /* 门槛：工团派影响力 ≥ 60（运动内部的份额）与 forze.sindacalisti ≥ 55
       （与意大利革命工团主义者的关系）。两者都要主动推，而这要时间——
       党内轴在 1922-03 就会政变，所以这是一条与时间赛跑的路线。*/
    sindacalistiInf: { gte: 60, w: 10 },
    forze: { gate: 55, need: 1, w: 8, only: ['sindacalisti'] },
    violence: 'down',
    drawOrder: ['azione', 'governo'],
    noCoup: true,
  },
  carnaro: {
    label: '卡尔纳罗共和国',
    flags: ['carta_done'],
    laws: { elettorale: 3, cittadinanza: 2, ordine: 2, stampa: 2, scuola: 1, lingua: 1, lavoro: 3 },
    violence: 'down',
    drawOrder: ['governo', 'azione'],
    posture: 'internation',
    noCoup: true,
  },
  fiume_o_morte: {
    label: '阜姆或死亡！',
    ending: 'ending_fiume_o_morte',
    flags: ['carta_done', 'porto_revived'],
    laws: { elettorale: 3, cittadinanza: 2, ordine: 2, stampa: 2, scuola: 1, lingua: 1, lavoro: 3, portofranco: 3, dogana: 3 },
    traffic: { gte: 85, w: 6 },
    violence: 'down',
    drawOrder: ['governo', 'azione'],
    /* 不要「争取国际支持」：共同保证一旦完成，ending_danzig(10) 会抢在
       阜姆或死亡(10.5) 之前。用「等距」保持英法美在门槛之下。 */
    posture: 'equidistant',
    avoidCards: ['gv_arengo'],
    noCoup: true,
  },
  venice: {
    label: '第二个威尼斯',
    ending: 'ending_venice',
    flags: [],
    laws: { portofranco: 3, dogana: 3, fisco: 2 },
    traffic: { gte: 85, w: 8 },
    sindacalistiInf: { gte: 20, w: 10 },
    violence: 'down',
    drawOrder: ['governo', 'azione'],
    noCoup: true,
  },
  /* 第二条路径：普通难度（史实会被《罗马条约》截断） */
  venice_open: {
    label: '第二个威尼斯（普通难度）',
    ending: 'ending_venice',
    flags: [],
    laws: { portofranco: 3, dogana: 3, fisco: 2 },
    traffic: { gte: 85, w: 8 },
    sindacalistiInf: { gte: 20, w: 10 },
    violence: 'down',
    drawOrder: ['governo', 'azione'],
    noCoup: true,
    avoidCards: ['gv_arengo'],
  },
};

/* ------------------------------------------------------------------ *
 * 目标之间的「抢先」关系：高优先级结局会盖住低优先级结局。
 * 这张表列出「要拿 A 就必须避免踩到 B 的门槛」的约束。
 * ------------------------------------------------------------------ */
/* comune(8) 与 danzig(10) 都要 carta_done，但 commune 只要
   lavoro>=3 && fisco>=2 就先成立。danzig 目标因此要把 fisco 卡在 1。 */
GOALS.danzig.blocks = [{ path: 'laws.fisco', gte: 2, card: null }];
/* comune 不需要避开别的（它自己是 8，只输给 1/2/3/3.5/4/7）*/
/* 宪章线必备事件（史实难度）：1 月德·安布里斯 → 9 月阳台颁布 → 宪章辩论 */
const CHARTER_EV = {
  ev_1920_01_deambris: ['assumere'],
  ev_carta_programma: ['programma'],
  ev_1920_09_carta: ['a'],
  ev_carta_dibattito: ['a'],
  ev_1920_06_alleati: ['a'],
};
['fiume_o_morte', 'comune', 'danzig'].forEach(g => { GOALS[g].evExtra = CHARTER_EV; });

/* ------------------------------------------------------------------ *
 * agent 工厂
 * ------------------------------------------------------------------ */
function makeAgent(goalId, evTable, optTable) {
  const goal = GOALS[goalId];
  if (!goal) throw new Error('unknown goal ' + goalId);
  const scorer = makeScorer(goal);
  const EV = evTable || {};
  const OPT = optTable || {};

  function effectsOf(s, card, opt) {
    try { return typeof opt.effect === 'function' ? opt.effect(s) : (opt.effect || {}); }
    catch (e) { return {}; }
  }

  /* 每回合的抽牌堆顺序（按目标动态判断） */
  function decksWanted(s) {
    let order = (goal.drawOrder || ['azione', 'governo']).slice();
    /* 需要部委卡时优先 governo */
    return order;
  }

  const agent = {
    goal,

    /* --- 事件决策 --- */
    event(s, ev, avail) {
      const tbl = EV[ev.id] || (goal.evExtra || {})[ev.id];
      if (tbl) {
        if (typeof tbl === 'function') { const r = tbl(s, avail); if (r) return r; }
        else {
          for (const id of tbl) {
            if (typeof id !== 'string') continue;
            if (avail.some(o => o.id === id)) return id;
          }
        }
      }
      /* 阶段门控：[选项 id, 谓词] 形式，按顺序取第一个谓词为真的 */
      const gated = (goal.evGated || {})[ev.id];
      if (gated) {
        for (const [id, pred] of gated) {
          if (!avail.some(o => o.id === id)) continue;
          let ok = true;
          try { ok = pred(s); } catch (e) { ok = false; }
          if (ok) return id;
        }
      }
      /* 没有指定：用打分挑最好的 */
      let best = null, bs = -1e9;
      for (const o of avail) {
        let eff; try { eff = typeof o.effect === 'function' ? o.effect(s) : (o.effect || {}); } catch (e) { eff = {}; }
        const sc = scorer.scoreEffect(eff);
        if (sc > bs) { bs = sc; best = o.id; }
      }
      return best || (avail[0] && avail[0].id);
    },

    /* --- 抽牌：返回要抽的 deck id，或 null 表示不再抽 --- */
    draw(s, decks) {
      const wanted = decksWanted(s);
      const want = wanted.filter(d => decks.some(x => x.id === d && x.drawable));
      /* 目标牌堆里是否有可打的牌？有就抽那个堆 */
      for (const d of want) {
        const dv = decks.filter(x => x.id === d)[0];
        if (!dv || !dv.drawable) continue;
        return d;
      }
      /* 否则抽任意可抽的堆 */
      const any = decks.filter(x => x.drawable)[0];
      return any ? any.id : null;
    },

    /* --- 打牌：返回 card id 或 null --- */
    card(s, handView) {
      const best = agent.ranked(s, handView);
      return best.length ? best[0].id : null;
    },

    /* 排序后的可打手牌 */
    ranked(s, handView) {
      const blocks = goal.blocks || [];
      /* 某个 effect 会不会把 state 推过某个「必须避开」的阈值 */
      function tripsBlock(eff) {
        for (const b of blocks) {
          const parts = b.path.split('.');
          let cur = eff;
          for (let i = 1; i < parts.length; i++) {
            cur = cur && cur[parts[i]];
            if (cur == null) break;
          }
          const delta = num(cur);
          if (!delta) continue;
          const now = num(get(s, b.path));
          if (now + delta >= b.gte) return b;
        }
        return null;
      }

      const arr = (handView || S.hand(s).filter(c => c.playable)).map(c => {
        const card = Eng.CARD_BY_ID[c.id];
        let bestOpt = null, bs = -1e9, bestEff = null;
        const isGov = c.deck === 'governo';
        const minAp = isGov ? (goal.govApFloor == null ? 0 : goal.govApFloor) : 0;
        if (s.ap < minAp) return { id: c.id, score: -1e6, optId: null, eff: null, card };
        if ((goal.avoidCards || []).indexOf(c.id) >= 0) return { id: c.id, score: -1e6, optId: null, eff: null, card };
        const opts = (card.options && card.options.length)
          ? Eng.cardOptions(s, card).filter(o => o.enabled)
          : [{ id: null }];
        for (const o of opts) {
          const authored = o.id == null ? null : (card.options || []).filter(x => x.id === o.id)[0];
          const eff = authored ? effectsOf(s, card, authored)
            : (typeof card.effect === 'function' ? card.effect(s) : (card.effect || {}));
          let sc = scorer.scoreEffect(eff);
          /* 阶段门控：政变前压低暴力，政变后放开 */
          const wantUpNow = !goal.cardGate || (() => { try { return goal.cardGate(s); } catch (e) { return true; } })();
          if (!wantUpNow) sc -= num((eff.order || {}).violence) * 40;
          /* 会踩到更高优先级结局的门槛时重罚 */
          if (tripsBlock(eff)) sc -= 100000;
          /* 贴合目标的卡加分 */
          const lv = LEVERS[c.id] || [];
          if (goal.milizia && lv.indexOf('milizia') >= 0) sc += 6;
          if (goal.forze && lv.indexOf('forze') >= 0) sc += 6;
          if (goal.traffic && lv.indexOf('fisco') >= 0) sc += 2;
          if (goal.sindacalistiInf && lv.indexOf('lavoro') >= 0) sc += 4;
          if (goal.laws && Object.keys(goal.laws).length && lv.indexOf('fisco') >= 0 && goal.laws.fisco) sc += 4;
          if (goal.noLawSpend && lv.indexOf('fisco') >= 0) sc -= 20;
          /* 压低兵力的目标：任何加兵力的选项都重罚 */
          if (goal.preferAbsent && goal.preferAbsent.indexOf('order.milizia') >= 0) {
            sc -= num((eff.order || {}).milizia) * 2.0;
          }
          /* 资源可行性 */
          if (c.cost && c.cost.funds > s.funds) sc -= 50;
          if (sc > bs) { bs = sc; bestOpt = o; bestEff = eff; }
        }
        return { id: c.id, score: bs, optId: bestOpt && bestOpt.id, eff: bestEff, card };
      });
      arr.sort((a, b) => b.score - a.score);
      return arr.filter(x => x.score > -100);
    },

    /* --- 卡牌选项 --- */
    option(s, card, oo) {
      const tbl = OPT[card.id];
      if (tbl) {
        const list = typeof tbl === 'function' ? tbl(s, oo) : tbl;
        for (const id of (list || [])) if (oo.some(o => o.id === id)) return id;
      }
      /* 用打分 */
      let best = null, bs = -1e9;
      for (const o of oo) {
        const authored = (card.options || []).filter(x => x.id === o.id)[0];
        const eff = authored ? effectsOf(s, card, authored) : {};
        const sc = scorer.scoreEffect(eff);
        if (sc > bs) { bs = sc; best = o.id; }
      }
      return best || (oo[0] && oo[0].id);
    },

    /* --- 姿态 / 税率 --- */
    posture(s) { return goal.posture || 'internation'; },
    tax(s) {
      /* 默认拉满：关税与消费税是主要收入 */
      return { porto: 1, dogana: 1, consumo: 1, reddito: 1 };
    },

    scorer,
    effectsOf,
  };
  return agent;
}

module.exports = { makeAgent, GOALS, makeScorer, get, num, LEVERS };
