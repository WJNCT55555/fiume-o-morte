/* ==========================================================================
   规则层 · 纯计算
   见 docs/设计案.md 第 11–17 章。所有函数不修改输入（除显式标注 mutates 的按月推进器）。
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core, root.Fiume.World, root.Fiume.Meta);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Rules = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, W, Meta) {
  'use strict';

  var R = {};
  var clamp = Core.clamp, clamp01 = Core.clamp01;

  R.PARTY_IDS = W.PARTIES.map(function (p) { return p.id; });

  /* ===================== Support matrix ===================== */
  R.nationalSupport = function (state) {
    var out = {}, i, k, p;
    W.PARTIES.forEach(function (pt) { out[pt.id] = 0; });
    W.CLASSES.forEach(function (c) {
      var cls = state.classes[c.id];
      for (p in cls.support) if (Object.prototype.hasOwnProperty.call(cls.support, p)) {
        out[p] = (out[p] || 0) + cls.pop * cls.support[p] / 100;
      }
    });
    // Party reputation bias, from short-term modifiers granted by events and cards
    for (k in state.supportBias) if (Object.prototype.hasOwnProperty.call(state.supportBias, k)) {
      out[k] = (out[k] || 0) + state.supportBias[k];
    }
    // Clamp to non-negative and renormalise to 100
    for (k in out) out[k] = Math.max(0, out[k]);
    var total = Core.sum(out) || 100;
    for (k in out) out[k] = out[k] * 100 / total;
    return out;
  };

  /** Zero-sum support shift inside a class row */
  R.shiftClassSupport = function (state, classId, partyId, amount) {
    var cls = state.classes[classId];
    if (!cls) return;
    Core.shiftZeroSum(cls.support, partyId, amount);
    var t = Core.sum(cls.support) || 100;
    for (var k in cls.support) cls.support[k] = cls.support[k] * 100 / t;
  };

  /** Directed transfer: move support for one party in a class straight to another (used for erosion) */
  R.defectSupport = function (state, classId, from, to, amount) {
    var cls = state.classes[classId];
    if (!cls || amount <= 0) return;
    var take = Math.min(amount, Math.max(0, cls.support[from] || 0));
    if (take <= 0) return;
    cls.support[from] -= take;
    cls.support[to] = (cls.support[to] || 0) + take;
    var t = Core.sum(cls.support) || 100;
    for (var k in cls.support) cls.support[k] = cls.support[k] * 100 / t;
  };

  /** Apply the same reputation shift to every class, weighted by population */
  R.shiftPartyStanding = function (state, partyId, amount) {
    var per = amount;   // 直接作用于全国百分点
    state.supportBias[partyId] = (state.supportBias[partyId] || 0) + per;
    // Decay slowly so the bias cannot accumulate without bound
    var cap = 22;
    state.supportBias[partyId] = clamp(state.supportBias[partyId], -cap, cap);
  };

  /* ===================== Legion public opinion ===================== */

  /** The Legion's standing in the city, derived rather than stored.
      It is each class's support for the Legion, weighted by that class's share
      of the population. Class turnout is deliberately NOT applied: this is what
      the city thinks of the movement, not how it would vote.
      Nothing in the effect vocabulary may write it. */
  R.legionOpinion = function (state) {
    var nat = R.nationalSupport(state);
    return clamp(nat.LEG || 0, 0, 100);
  };

  /* ===================== Factions ===================== */
  R.factionDissent = function (state) {
    var num = 0, den = 0;
    W.FACTIONS.forEach(function (f) {
      var st = state.factions[f.id];
      if (!st || st.inf <= 0.01) return;
      num += st.inf * st.dis; den += st.inf;
    });
    return den > 0 ? num / den : 0;
  };
  R.unityEfficiency = function (state) { return 1 - R.factionDissent(state) / 100; };
  R.normalizeFactions = function (state) {
    var sum = 0;
    W.FACTIONS.forEach(function (f) { sum += Math.max(0, state.factions[f.id].inf); });
    if (sum <= 0) return;
    W.FACTIONS.forEach(function (f) {
      var s = state.factions[f.id];
      s.inf = Math.max(0, s.inf) * 100 / sum;
      s.dis = clamp(s.dis, 0, 100);
    });
  };

  /* ===================== Crisis and coup ===================== */
  R.tension = function (state) {
    var o = state.order;
    return clamp01(0.30 * (100 - o.authority) + 0.25 * (100 - o.garrison)
      + 0.20 * o.fervour + 0.25 * o.squadre);
  };
  R.coupDelta = function (state, mul) {
    var o = state.order, T = R.tension(state);
    // Rome's standing hostility is a state, not a flow: it presses in full every
    // turn however long a turn is. Only the rates below are halved.
    var d = 0.09 * T + 0.06 * (100 - o.garrison) - 0.025 * o.authority + 15;
    d -= 0.05 * Math.max(0, 25 - o.violence);           // 街道安静时放缓
    d -= 0.03 * Math.max(0, state.legitimacy - 55);      // 高合法性放缓
    d -= 0.025 * Math.max(0, o.milizia - 1200) / 100;     // 军团兵力充足时放缓
    // Honeymoon after the march (1919-09 to 1920-08): the siege is not yet a war
    var ym = state.date.y * 12 + state.date.m;
    if (ym < 1920 * 12 + 9) d *= 0.125;
    // A quiet period follows Bloody Christmas, after which the fascist threat rebuilds more slowly than the siege did
    if (state.flags && state.flags.natale_done && !state.flags.coup_done) {
      var grace = (state.counters && state.counters.graceUntil) || 0;
      d *= (state.monthIndex < grace) ? 0.22 : 0.80;
    }
    d *= (mul == null ? 1 : mul);
    return clamp(d, -7.0, 22.5);
  };

  /* Three milestone sets: honeymoon / siege / fascist */
  R.coupMilestones = function (state) {
    if (state.flags && state.flags.natale_done) {
      return [
        { at: 25, id: 'f25', zh: '法西斯在 Hotel Bonavia 设立总部', it: 'Il Fascio apre sede all\'Hotel Bonavia' },
        { at: 50, id: 'f50', zh: '街头枪击与报馆被砸；第一个死者', it: 'Sparatorie e tipografie devastate: il primo morto' },
        { at: 75, id: 'f75', zh: '君塔的小队从的里雅斯特进城', it: 'Le squadre di Giunta entrano da Trieste' },
        { at: 100, id: 'f100', zh: '他们准备进攻省督府', it: 'Si preparano ad attaccare il Palazzo' }
      ];
    }
    var ym2 = state.date.y * 12 + state.date.m;
    if (ym2 < 1920 * 12 + 9) {
      return [
        { at: 25, id: 'i25', zh: '罗马切断军团兵的汇款与补给', it: 'Roma taglia fondi e rifornimenti ai legionari' },
        { at: 50, id: 'i50', zh: '协约国调查委员会要求解散「阜姆军团」', it: 'La commissione interalleata chiede lo scioglimento della Legione' },
        { at: 75, id: 'i75', zh: '自治派在城里公开组织起来', it: 'Gli autonomi si organizzano apertamente in città' },
        { at: 100, id: 'i100', zh: '尼蒂政府考虑武力解决', it: 'Il governo Nitti valuta la soluzione militare' }
      ];
    }
    return [
      { at: 25, id: 'n25', zh: '罗马中断谈判，开始海上拦截', it: 'Roma interrompe i negoziati e ferma le navi' },
      { at: 50, id: 'n50', zh: '封锁收紧；面粉与煤开始配给', it: 'Il blocco stringe: razionati farina e carbone' },
      { at: 75, id: 'n75', zh: '卡维利亚将军包围城市，发出最后通牒', it: 'Caviglia accerchia la città e invia l\'ultimatum' },
      { at: 100, id: 'n100', zh: '皇家陆军准备进攻', it: 'Il Regio Esercito è pronto ad attaccare' }
    ];
  };
  R.COUP_MILESTONES = [];   // 兼容旧引用；实际使用 R.coupMilestones(state)

  /* ===================== Classes: derived values and monthly evolution ===================== */

  /** Monthly evolution: turnout only. Turnout is a slow variable driven by the
      class baseline and citizenship legislation. */
  R.updateClasses = function (state) {
    W.CLASSES.forEach(function (c) {
      var cls = state.classes[c.id];
      if (!cls) return;
      var base = (W.CLASS_TRAITS[c.id] || {}).turnout || 70;
      var civic = state.laws.cittadinanza >= 2 ? 6 : (state.laws.cittadinanza >= 1 ? 3 : 0);
      var want = clamp(base + civic, 20, 96);
      cls.turnout = clamp(cls.turnout + (want - cls.turnout) * 0.05, 20, 96);
    });
  };

  /** Historical faction drift: the fascists keep growing inside the legionary movement */
  R.factionDrift = function (state) {
    var ym = state.date.y * 12 + state.date.m;
    var f = state.factions;
    if (!f.fascisti || !f.sindacalisti) return;
    var grow = ym < 1920 * 12 + 9 ? 0.125 : 0.275;
    if (state.flags.natale_done) grow *= 1.3;
    if (state.laws.ordine >= 2) grow *= 1.2;
    var d = Math.min(grow, Math.max(0.02, f.sindacalisti.inf * 0.06));
    f.fascisti.inf += d;
    f.sindacalisti.inf = Math.max(4, f.sindacalisti.inf - d * 0.62);
    f.arditi.inf = Math.max(4, f.arditi.inf - d * 0.22);
    f.futuristi.inf = Math.max(4, f.futuristi.inf - d * 0.16);
    // The irredentist case is the one fascism quietly absorbs, so it gives
    // ground at the same rate as the arditi.
    f.irredentisti.inf = Math.max(4, f.irredentisti.inf - d * 0.22);
    R.normalizeFactions(state);
  };

  /* ===================== Elections ===================== */
  /* Four steps, settled separately:
       1. class support vector x class turnout -> each party's potential vote
       2. each party's abstention tradition (50% for the socialists) -> valid votes
       3. organization bonus (legionary organizing / fascist street mobilization)
       4. the 1921 law's mixed majority/minority system -> list seats -> split back to parties
     Abstention raises every other party's share of valid votes; that is the mechanical

  R.PARTY_IDS = W.PARTIES.map(function (p) { return p.id; });

  /** The lists actually filed in this election (affected by flags) */
  R.listsFor = function (state) {
    if (state.flags.legion_alone) {
      return W.SPLIT_LISTS.concat([W.LIST_BY_ID.AUT, W.LIST_BY_ID.PSI]);
    }
    return W.ELECTORAL_LISTS;
  };

  R.election = function (state) {
    var lists = R.listsFor(state);
    var boycott = !!state.flags.boycott;
    var memberOf = {};
    lists.forEach(function (L) {
      L.members.forEach(function (m) { memberOf[m] = L.id; });
    });

    var city = {}, sub = {}, pCity = {}, pSub = {};
    var turnoutWeighted = 0;
    function add(bag, k, v) { if (v) bag[k] = (bag[k] || 0) + v; }

    W.CLASSES.forEach(function (cl) {
      var cls = state.classes[cl.id];
      if (!cls) return;
      var turn = Core.clamp(cls.turnout == null ? 70 : cls.turnout, 0, 100) / 100;
      turnoutWeighted += cls.pop * turn;
      for (var pid in cls.support) {
        if (!Object.prototype.hasOwnProperty.call(cls.support, pid)) continue;
        var listId = memberOf[pid];
        if (!listId) continue;                       // 未参选（抵制时的军团兵）
        var rule = W.PARTY_RULES[pid] || {};
        var abst = rule.abstention || 0;
        var v = cls.pop * cls.support[pid] / 100 * turn * (1 - abst);
        add(city, listId, v * cl.city);
        add(sub, listId, v * (1 - cl.city));
        add(pCity, pid, v * cl.city);
        add(pSub, pid, v * (1 - cl.city));
      }
    });

    /* 3. Organization and the street */
    var orgMul = clamp(0.85 + (state.militants || 0) / 12000, 0.85, 1.35);
    if (city.BLO) city.BLO *= orgMul;
    if (sub.BLO) sub.BLO *= orgMul;
    if (boycott) { city.BLO = 0; sub.BLO = 0; }

    var cityTotal = Core.sum(city) || 1, subTotal = Core.sum(sub) || 1;
    var cityShare = {}, subShare = {};
    Object.keys(city).forEach(function (k) { cityShare[k] = city[k] * 100 / cityTotal; });
    Object.keys(sub).forEach(function (k) { subShare[k] = sub[k] * 100 / subTotal; });

    /* 4. Mixed system: the plurality list takes all majority seats; minority seats use largest remainder with a 6% threshold */
    function allocate(share, majoritySeats, minoritySeats) {
      var ls = Object.keys(share).filter(function (k) { return share[k] > 0.01; });
      ls.sort(function (a, b) { return share[b] - share[a]; });
      var seats = {}, winner = ls[0] || null;
      ls.forEach(function (k) { seats[k] = 0; });
      if (winner) seats[winner] = majoritySeats;
      var others = ls.slice(1).filter(function (k) { return share[k] >= 6; });
      if (!others.length && ls.length > 1) others = ls.slice(1);
      if (others.length) {
        var w = {};
        others.forEach(function (k) { w[k] = share[k]; });
        var alloc = Core.largestRemainder(w, minoritySeats);
        Object.keys(alloc).forEach(function (k) { seats[k] = (seats[k] || 0) + alloc[k]; });
      } else if (winner) {
        seats[winner] += minoritySeats;
      }
      return { seats: seats, winner: winner, share: share };
    }

    var ci = allocate(cityShare, 51, 17);
    var su = allocate(subShare, 6, 2);

    /* List seats to party seats, split by each party's contribution inside the list */
    var seats = {};
    R.PARTY_IDS.forEach(function (x) { seats[x] = 0; });
    function split(bag, shareBag, pBag) {
      Object.keys(bag).forEach(function (L) {
        var n = bag[L];
        if (!n) return;
        var L2 = W.LIST_BY_ID[L] || W.SPLIT_LISTS.filter(function (x) { return x.id === L; })[0];
        var members = L2 ? L2.members.slice() : [L];
        var contrib = {}, tot = 0;
        members.forEach(function (m) { contrib[m] = pBag[m] || 0; tot += contrib[m]; });
        if (tot <= 0) { seats[members[0]] = (seats[members[0]] || 0) + n; return; }
        var alloc = Core.largestRemainder(contrib, n);
        Object.keys(alloc).forEach(function (m) { seats[m] = (seats[m] || 0) + alloc[m]; });
      });
    }
    split(ci.seats, cityShare, pCity);
    split(su.seats, subShare, pSub);

    var detail = {
      city: cityShare, sub: subShare,
      cityWinner: ci.winner, subWinner: su.winner,
      partyCity: pCity, partySub: pSub,
      seats: seats,
      lists: lists.map(function (L) { return L.id; }),
      turnout: Core.round1(turnoutWeighted),
      boycotted: boycott,
      alone: !!state.flags.legion_alone
    };
    return { seats: seats, detail: detail };
  };

  /* ===================== Economy ===================== */
  R.trafficTarget = function (state) {
    var e = state.economy, pf = state.laws.portofranco;
    var t = 11
      + 0.32 * e.hinterland
      + 0.20 * pf * 25
      + 0.17 * e.delta
      + 0.13 * e.works
      + 0.12 * e.recognition
      - 0.20 * state.order.violence
      - 0.10 * e.strike;
    return clamp(t, 0, 100);
  };
  R.industryActivity = function (state) { return clamp(0.6 * state.economy.works + 0.4 * (100 - state.economy.strike), 0, 100); };
  R.unemploymentTarget = function (state) {
    return clamp(46 - 0.42 * state.economy.traffic - 0.12 * R.industryActivity(state), 4, 45);
  };
  R.inflationTarget = function (state) {
    var e = state.economy;
    return clamp(4 + 0.25 * Math.max(0, e.unemployment - 12) + 0.12 * e.strike
      + 0.004 * Math.max(0, state.economy.debt - 2500), 1, 55);
  };
  R.emigration = function (state) {
    var e = state.economy;
    return clamp((e.unemployment - 12) * 20 + (state.order.violence - 40) * 4, 0, 900);
  };
  R.revenue = function (state) {
    var e = state.economy, r = state.taxRates, L = state.laws;
    var conf = 0.75 + 0.005 * e.capitalConfidence;
    var portFees = e.traffic * 3.1 * r.porto * conf;
    var customs = e.traffic * 2.5 * r.dogana * (1 + 0.05 * L.dogana);
    var excise = (100 - e.unemployment) * 0.45 * r.consumo;
    var income = (100 - e.unemployment) * 0.7 * r.reddito * (1 + 0.04 * L.fisco);
    var rec = {
      porto: portFees * (1 + (state.revenueBoost.porto || 0)),
      dogana: customs, consumo: excise, reddito: income
    };
    rec.total = rec.porto + rec.dogana + rec.consumo + rec.reddito;
    return rec;
  };
  R.spending = function (state) {
    var e = state.economy, o = state.order;
    var admin = 42.0;
    var police = 6.0 + o.police / 40.0;
    var guard = o.civicGuard * 0.0175;
    var legion = o.milizia * 0.013;          // 军团兵的军饷与给养
    var works = e.works / 100 * 12.0;
    var debtService = e.debt * 0.0035;
    var relief = Math.max(0, e.unemployment - 12) * 1.7;
    var total = admin + police + guard + legion + works + debtService + relief;
    return { admin: admin, police: police, guard: guard, legion: legion,
      works: works, debt: debtService, relief: relief, total: total };
  };

  /* ===================== Derived resources (the resource bar) ===================== */
  /** Industrial production index, 0-100 */
  R.produzione = function (state) {
    var L = state.laws;
    return clamp(0.42 * state.economy.works
      + 0.30 * (100 - state.economy.strike)
      + 0.16 * state.economy.capitalConfidence
      + 0.08 * state.economy.traffic
      - 0.20 * Math.max(0, state.order.violence - 30)
      + 4 * L.lavoro, 0, 100);
  };
  /** Diplomatic pressure (higher is worse): Roman hostility, the blockade, great-power coldness */
  R.pressione = function (state) {
    var d = state.diplo;
    var p = 0.46 * (100 - d.italy)
      + 0.16 * (100 - d.yugoslavia)
      + 0.12 * (100 - d.uk)
      + 0.10 * (100 - d.france)
      + 0.08 * (100 - d.usa)
      + 0.08 * (100 - d.league);
    if (!state.flags.natale_done) p += 6;                  // 围城期间的额外压力
    if (state.flags.international_guarantee) p -= 18;
    if (state.flags.accept_rapallo) p -= 10;   // accettare il trattato allenta la pressione
    return clamp(p, 0, 100);
  };

  /* ===================== Monthly law effects ===================== */
  R.lawMonthly = function (state) {
    var L = state.laws, out = { diplo: {}, economy: {}, support: [], order: {} };
    // Free port
    out.economy.capitalConfidence = (out.economy.capitalConfidence || 0) + L.portofranco * 1.2;
    // Public order
    out.order.squadre = (out.order.squadre || 0) - L.ordine * 0.8;
    out.order.authority = (out.order.authority || 0) + L.ordine * 0.3;
    // Press freedom
    out.order.violence = (out.order.violence || 0) + (L.stampa >= 2 ? 0.4 : -0.3 * L.stampa);
    // Labour
    out.economy.strike = (out.economy.strike || 0) - L.lavoro * 1.4;
    // Language
    if (L.lingua >= 1) { out.diplo.yugoslavia = (out.diplo.yugoslavia || 0) + 0.5 * L.lingua; }
    if (L.lingua >= 2) { out.support.push(['contadini', 'AUT', 0.3]); }
    // Finance
    out.economy.capitalConfidence = (out.economy.capitalConfidence || 0) - L.fisco * 0.9;
    // Charter
    out.order.coup = (out.order.coup || 0) - L.statuto * 0.7;
    // Citizenship
    return out;
  };

  /* ===================== Law satisfaction (display only) ===================== */
  R.lawStanceLabel = function (v) {
    if (v >= 7) return { zh: '强烈支持', it: 'favorevole' };
    if (v >= 3) return { zh: '支持', it: 'favorevole' };
    if (v > -3) return { zh: '中立', it: 'neutrale' };
    if (v > -7) return { zh: '反对', it: 'contrario' };
    return { zh: '强烈反对', it: 'contrario' };
  };

  /* ===================== Party relations ===================== */
  /* A symmetric matrix of how each party regards each other, -100 to +100.
     It is not stored as a flat list of opinions but derived from two things a
     player can reason about: whether the parties sit in the same electoral camp,
     and how often they would vote the same way on the laws on the books. */

  /** The value a relationship settles at when nothing is pushing it. */
  R.relationBaseline = function (state, a, b) {
    if (a === b) return 100;
    var pa = W.PARTY_BY_ID[a], pb = W.PARTY_BY_ID[b];
    if (!pa || !pb) return 0;
    var v = (pa.camp === pb.camp) ? 34 : -26;
    var same = 0, n = 0;
    W.LAWS.forEach(function (L) {
      var s = W.LAW_STANCE[L.id];
      if (!s) return;
      var x = s[a] || 0, y = s[b] || 0;
      if (x === 0 && y === 0) return;
      n += 1;
      if ((x >= 0) === (y >= 0)) same += 1;
    });
    if (n) v += (same / n - 0.5) * 60;
    // The Legion is the disruptor: everyone's footing with it is uncertain.
    if (a === 'LEG' || b === 'LEG') v -= 12;
    return clamp(v, -100, 100);
  };

  /** Read one side of the matrix. Missing pairs fall back to the baseline. */
  R.relationOf = function (state, a, b) {
    if (a === b) return 100;
    var row = state.relations && state.relations[a];
    var v = row ? row[b] : undefined;
    if (typeof v === 'number') return v;
    return R.relationBaseline(state, a, b);
  };

  /** Write one side, keeping the matrix symmetric. */
  R.setRelation = function (state, a, b, v) {
    if (!state.relations) state.relations = {};
    if (!state.relations[a]) state.relations[a] = {};
    if (!state.relations[b]) state.relations[b] = {};
    v = clamp(v, -100, 100);
    state.relations[a][b] = v;
    state.relations[b][a] = v;
  };

  /** Seed the whole matrix from the baselines. */
  R.relationsInit = function (state) {
    state.relations = {};
    W.PARTIES.forEach(function (a) {
      W.PARTIES.forEach(function (b) {
        if (a.id >= b.id) return;
        R.setRelation(state, a.id, b.id, R.relationBaseline(state, a.id, b.id));
      });
    });
    return state.relations;
  };

  /** Monthly: everything drifts back toward its baseline, except that sitting
      in the same coalition together is itself a reason to think better of each
      other. */
  R.relationDrift = function (state) {
    var mem = (state.coalition && state.coalition.members) || [];
    W.PARTIES.forEach(function (a) {
      W.PARTIES.forEach(function (b) {
        if (a.id >= b.id) return;
        var cur = R.relationOf(state, a.id, b.id);
        var tgt = R.relationBaseline(state, a.id, b.id);
        if (mem.indexOf(a.id) >= 0 && mem.indexOf(b.id) >= 0) tgt += 22;
        R.setRelation(state, a.id, b.id, Core.approach(cur, tgt, 0.07));
      });
    });
  };

  /** Mean regard between the parties that actually sit in the cabinet. */
  R.coalitionRegard = function (state) {
    var mem = (state.coalition && state.coalition.members) || [];
    if (mem.length < 2) return 0;
    var sum = 0, n = 0;
    mem.forEach(function (a) {
      mem.forEach(function (b) {
        if (a >= b) return;
        sum += R.relationOf(state, a, b); n += 1;
      });
    });
    return n ? sum / n : 0;
  };

  /* ===================== Coalition cohesion ===================== */
  /* Regard between coalition partners is the largest single term. */
  R.cohesionTarget = function (state) {
    var T = R.tension(state);
    var diss = R.factionDissent(state);
    var base = 78 - 0.35 * T - 0.25 * diss;
    // How the coalition partners actually regard each other, -100..+100,
    // scaled to about half the range of the cohesion figure.
    base += 0.22 * R.coalitionRegard(state);
    if (state.laws.statuto >= 2) base += 6;
    if (state.economy.traffic > 55) base += 6;
    if (state.order.violence > 55) base -= 8;
    return clamp(base, 0, 100);
  };

  /* ===================== District drift ===================== */
  R.districtTargets = function (state) {
    var out = {};
    W.DISTRICTS.forEach(function (d) {
      var st = state.districts[d.id];
      var isFiume = d.status !== 'yugo';
      var ownPop = d.ethnicIt / 100;
      var baseControl = isFiume
        ? 44 + 0.30 * state.legitimacy + 0.16 * (state.order.authority - 50) - 0.22 * state.order.violence
        : 0;
      if (isFiume && d.id === 'srdoci') baseControl -= 8;
      if (isFiume && d.id === 'drenova') baseControl += 0.12 * state.laws.lingua * 10;
      if (d.id === 'porto') baseControl += 0.10 * state.economy.traffic - 3;
      out[d.id] = { control: clamp(baseControl, 0, 100) };
      out[d.id].agitation = clamp(20 + 0.45 * (state.economy.unemployment - 15)
        + 0.35 * (state.order.violence - 35) + (d.id === 'drenova' || d.id === 'srdoci' ? 14 - 4 * state.laws.lingua : 0), 0, 100);
    });
    return out;
  };

  /* ===================== Endings and achievements ===================== */
  R.resolveEnding = function (state) {
    var sorted = Meta.ENDINGS.slice().sort(function (a, b) { return a.priority - b.priority; });
    for (var i = 0; i < sorted.length; i++) {
      try { if (sorted[i].check(state)) return sorted[i]; } catch (e) { /* ignore */ }
    }
    return sorted[sorted.length - 1];
  };

  R.checkAchievements = function (state) {
    var got = state.achievements, add = [];
    function grant(id) { if (got.indexOf(id) < 0) { got.push(id); add.push(id); } }
    var u = R.nationalSupport(state), mono = state.monotonic;
    if (state.laws.statuto >= 1) grant('ach_balcony');
    if (state.eventHistory.indexOf('ev_carta_dibattito') >= 0) grant('ach_arengo');
    if (state.laws.statuto >= 3) grant('ach_carta');
    if (state.laws.lavoro >= 3 && state.laws.fisco >= 2 && state.order.fervour >= 70) grant('ach_comune');
    if (state.date.y > 1921 || (state.date.y === 1921 && state.date.m >= 4)) grant('ach_survive');
    if (state.flags.fascio_disarmed) grant('ach_disarm');
    if ((state.assembly.LEG || 0) >= 30 && state.counters.electionsHeld >= 1) grant('ach_seats');
    if (state.flags.international_guarantee) grant('ach_geneva');
    if (state.economy.traffic >= 75) grant('ach_port');
    if (state.economy.inflation < 12 && state.economy.debt < 1800) grant('ach_sound');
    if (state.flags.reconciled) grant('ach_reconcile');
    if (state.flags.movement_built) grant('ach_movement');
    if ((state.counters.resistMonths || 0) >= 18) grant('ach_stay');
    if ((state.counters.exileMonths || 0) >= 24) grant('ach_exile');
    if (mono.populationLost >= 5000) grant('ach_empty');
    if (mono.minViolenceOK && state.date.y >= 1924) grant('ach_calm');
    if (mono.minDissentOK && state.monthIndex >= 11) grant('ach_dissent');
    if (state.ending === 'ending_fiume_o_morte') grant('ach_o_morte');
    return add;
  };

  /* ===================== Declarative effect application ===================== */
  /** See content/types.ts and the affairs modules for effect shapes. Mutates state. */
  R.applyEffect = function (state, eff, ctx) {
    if (!eff) return [];
    var notes = [];
    var e = eff;
    var o = state.order, ec = state.economy;

    if (e.funds) { state.funds = Math.max(0, state.funds + e.funds); notes.push(['funds', e.funds]); }
    if (e.arms) { state.arms = Math.max(0, state.arms + e.arms); }
    if (e.militants) { state.militants = Math.max(0, state.militants + e.militants); }
    if (e.ap) { state.ap += e.ap; }

    if (e.support) e.support.forEach(function (t) {
      R.shiftClassSupport(state, t[0], t[1], t[2]);
    });
    if (e.relations) {
      e.relations.forEach(function (t) {
        R.setRelation(state, t[0], t[1], R.relationOf(state, t[0], t[1]) + t[2]);
      });
      notes.push(['relations', e.relations.length + ' coppie']);
    }
    if (e.mergeParty) {
      R.setRelation(state, e.mergeParty.from, e.mergeParty.to, 55);
    }
    if (e.parties) {
      for (var pk in e.parties) if (Object.prototype.hasOwnProperty.call(e.parties, pk)) {
        R.shiftPartyStanding(state, pk, e.parties[pk]);
      }
    }
    if (e.laws) {
      for (var lk in e.laws) if (Object.prototype.hasOwnProperty.call(e.laws, lk)) {
        var def = null;
        W.LAWS.forEach(function (L) { if (L.id === lk) def = L; });
        var mx = def ? def.max : 3;
        state.laws[lk] = clamp((state.laws[lk] || 0) + e.laws[lk], 0, mx);
        notes.push(['law:' + lk, e.laws[lk]]);
      }
    }
    if (e.setLaw) for (var sk in e.setLaw) if (Object.prototype.hasOwnProperty.call(e.setLaw, sk)) state.laws[sk] = e.setLaw[sk];

    if (e.diplo) for (var dk in e.diplo) if (Object.prototype.hasOwnProperty.call(e.diplo, dk)) {
      state.diplo[dk] = clamp((state.diplo[dk] || 0) + e.diplo[dk], 0, 100);
    }
    if (e.order) for (var ok in e.order) if (Object.prototype.hasOwnProperty.call(e.order, ok)) {
      if (ok === 'coup') o.coup = clamp(o.coup + e.order[ok], 0, 140);
      else if (ok === 'civicGuard' || ok === 'police' || ok === 'legionari' || ok === 'carabinieri' || ok === 'garrisonTroops') {
        o[ok] = Math.max(0, o[ok] + e.order[ok]);
      } else o[ok] = clamp((o[ok] || 0) + e.order[ok], 0, 100);
    }
    if (e.economy) for (var ek in e.economy) if (Object.prototype.hasOwnProperty.call(e.economy, ek)) {
      if (ek === 'population') ec.population = Math.max(0, ec.population + e.economy[ek]);
      else if (ek === 'debt' || ek === 'treasury' || ek === 'arrears') ec[ek] = Math.max(0, (ec[ek] || 0) + e.economy[ek]);
      else ec[ek] = clamp((ec[ek] || 0) + e.economy[ek], -100, 500);
    }
    if (e.factions) for (var fk in e.factions) if (Object.prototype.hasOwnProperty.call(e.factions, fk)) {
      var f = state.factions[fk];
      if (!f) continue;
      if (e.factions[fk].inf != null) f.inf = Math.max(0, f.inf + e.factions[fk].inf);
      if (e.factions[fk].dis != null) f.dis = clamp(f.dis + e.factions[fk].dis, 0, 100);
    }
    if (e.districts) for (var dk2 in e.districts) if (Object.prototype.hasOwnProperty.call(e.districts, dk2)) {
      var dst = state.districts[dk2];
      if (!dst) continue;
      for (var dkk in e.districts[dk2]) if (Object.prototype.hasOwnProperty.call(e.districts[dk2], dkk)) {
        dst[dkk] = clamp((dst[dkk] || 0) + e.districts[dk2][dkk], 0, 100);
      }
    }
    if (e.organizations) e.organizations.forEach(function (oid) {
      var org = state.organizations[oid];
      if (org) org.active = true;
    });
    if (e.flags) for (var fl in e.flags) if (Object.prototype.hasOwnProperty.call(e.flags, fl)) state.flags[fl] = e.flags[fl];
    if (e.counters) for (var ck in e.counters) if (Object.prototype.hasOwnProperty.call(e.counters, ck)) {
      state.counters[ck] = (state.counters[ck] || 0) + e.counters[ck];
    }
    if (e.journals) e.journals.forEach(function (jid) { R.activateJournal(state, jid); });
    if (e.revenueBoost) for (var rb in e.revenueBoost) if (Object.prototype.hasOwnProperty.call(e.revenueBoost, rb)) {
      state.revenueBoost[rb] = (state.revenueBoost[rb] || 0) + e.revenueBoost[rb];
    }
    if (e.mergeParty) {
      var from = e.mergeParty.from, to = e.mergeParty.to, share = e.mergeParty.share || 1;
      W.CLASSES.forEach(function (c) {
        var cls = state.classes[c.id];
        var moved = (cls.support[from] || 0) * share;
        cls.support[from] = (cls.support[from] || 0) - moved;
        cls.support[to] = (cls.support[to] || 0) + moved;
      });
      state.flags['merged_' + from] = true;
      notes.push(['merged', from + '→' + to]);
    }
    if (e.coalitionMerge) {
      state.coalition.cohesion = clamp(state.coalition.cohesion - 8, 0, 100);
      // The fascists are not a registered party at the opening; the bloc they
      // would have joined is the Nationalists.
      if (state.coalition.members.indexOf('ANI') < 0) state.coalition.members.push('ANI');
      var n = e.coalitionMerge.ANI || 2;
      var given = 0;
      ['difesa', 'interno', 'istruzione', 'economia'].forEach(function (mid) {
        if (given < n && state.cabinet[mid] === 'LEG') { state.cabinet[mid] = 'ANI'; given++; }
      });
      notes.push(['cabinet', 'ANI 入阁']);
    }
    if (e.cabinet) {
      for (var mk in e.cabinet) if (Object.prototype.hasOwnProperty.call(e.cabinet, mk)) {
        state.cabinet[mk] = e.cabinet[mk];
      }
    }
    if (e.splitList) {
      state.flags.legion_alone = true;
      notes.push(['list', '单独参选']);
    }
    if (e.boycott) {
      state.flags.boycott = true;
      notes.push(['list', '抵制选举']);
    }
    return notes;
  };

  R.activateJournal = function (state, id) {
    if (!state.journals[id]) {
      state.journals[id] = { active: true, done: false, failed: false, months: 0 };
      state.log.push({ turn: state.turn, kind: 'journal', zh: '日志开启：' + (Meta.JOURNAL_BY_ID[id] ? Meta.JOURNAL_BY_ID[id].zh : id), it: 'Diario attivato' });
    }
  };

  return R;
});
