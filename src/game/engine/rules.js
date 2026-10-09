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

  /** Zero-sum faction influence transfer, ported from the reference project's
      `adjustFactionInfluence` (cnt-fai …/src/game/utils/factionEffects.ts).
      Influence is a share of a fixed 100, so a change to one faction is taken
      from — or given to — the others **in proportion to what they currently
      hold**. Cascading is handled: if a contributor would go below zero it gives
      only what it has and the remainder is redistributed among the rest.
      This is the ONLY way faction influence may move. A bare `inf += x` is not a
      transfer: it changes the total, and any later renormalisation then silently
      takes the difference out of every other faction in proportion to size.

      SUB-INTEGER CHANGES ARE PRESERVED. The stored `inf` is a float and the
      panel rounds it for display. That matters because the historical drift is
      worth ~0.125 a turn: an earlier version of this function rounded every
      faction to an integer on every call, which silently erased the drift
      entirely (the +0.125 landed in the faction's own rounding remainder and
      never accumulated). Rounding belongs at the display layer, not here. */
  R.adjustFactionInfluence = function (state, targetId, delta) {
    var f = state.factions;
    if (!f || !f[targetId] || !delta) return 0;
    var ids = W.FACTIONS.map(function (x) { return x.id; });
    var before = f[targetId].inf;
    var guard = 0;

    if (delta > 0) {
      var remaining = Math.min(delta, 100 - f[targetId].inf);
      if (remaining <= 0) return 0;
      var actual = remaining;
      while (remaining > 1e-9 && guard++ < 50) {
        var givers = ids.filter(function (k) { return k !== targetId && f[k].inf > 0; });
        var S = givers.reduce(function (a, k) { return a + f[k].inf; }, 0);
        if (S <= 0) { actual -= remaining; break; }
        var next = 0;
        givers.forEach(function (k) {
          var deduction = remaining * (f[k].inf / S);
          if (f[k].inf < deduction) { next += deduction - f[k].inf; f[k].inf = 0; }
          else f[k].inf -= deduction;
        });
        remaining = next;
      }
      f[targetId].inf += actual;
    } else {
      var take = Math.min(-delta, f[targetId].inf);
      if (take <= 0) return 0;
      var receivers = ids.filter(function (k) { return k !== targetId; });
      var tot = receivers.reduce(function (a, k) { return a + f[k].inf; }, 0);
      if (tot <= 0) {
        var share = take / receivers.length;
        receivers.forEach(function (k) { f[k].inf += share; });
      } else {
        receivers.forEach(function (k) { f[k].inf += take * (f[k].inf / tot); });
      }
      f[targetId].inf -= take;
    }

    /* Clamp tiny negatives and keep the sum at exactly 100 by settling any
       float residue on the target. The residue is ~1e-13, i.e. invisible, and
       crucially it does NOT swallow the caller's delta. */
    ids.forEach(function (k) { if (f[k].inf < 0) f[k].inf = 0; });
    var total = ids.reduce(function (a, k) { return a + f[k].inf; }, 0);
    if (Math.abs(total - 100) > 1e-9) f[targetId].inf += 100 - total;

    return f[targetId].inf - before;
  };

  /** Several influence changes settled AT ONCE, so each target receives what was
      asked for instead of whatever survives the others' transfers.

      Why this exists: `adjustFactionInfluence` moves shares one at a time, so two
      gains in the same patch compete. Raising the futurists by 5 draws
      proportionally from all four others — including the arditi — and then the
      arditi's own +3 has to be scaled back to keep the total at 100. Write
      "+5 futurists, +3 arditi" and you got +4.09 / +1.41.

      Here the gains are taken from the DONORS only (never from a faction that is
      itself being raised), each gain is capped at the headroom actually
      available, and the integer residue is settled on the largest donor so the
      total stays exactly 100. If the donors cannot cover the gains, everyone
      (donors and targets alike) is scaled by the same factor, so the ratio the
      author wrote still holds.
      `deltas` is `{ factionId: number }`; returns the deltas actually applied. */
  R.batchFactionInfluence = function (state, deltas) {
    var f = state.factions;
    if (!f || !deltas) return {};
    var ids = W.FACTIONS.map(function (x) { return x.id; });

    /* Accept both shapes: a flat map `{ futuristi: 5 }` and the nested patch form
       the effect layer actually carries, `{ futuristi: { inf: 5, dis: -8 } }`.
       Passing the nested form straight in made every amount `Math.abs({...})`,
       i.e. NaN, and the whole call quietly did nothing. */
    var amount = function (v) {
      if (v == null) return 0;
      if (typeof v === 'number') return v;
      if (typeof v === 'object' && typeof v.inf === 'number') return v.inf;
      return 0;
    };

    var gains = [], losses = [];
    ids.forEach(function (k) {
      var d = amount(deltas[k]);
      if (!f[k] || !d) return;
      (d > 0 ? gains : losses).push({ id: k, want: Math.abs(d) });
    });
    if (!gains.length && !losses.length) return {};

    /* Clamp each request to the headroom that actually exists. */
    gains.forEach(function (g) { g.want = Math.min(g.want, Math.max(0, 100 - f[g.id].inf)); });
    losses.forEach(function (l) { l.want = Math.min(l.want, f[l.id].inf); });
    gains = gains.filter(function (g) { return g.want > 1e-9; });
    losses = losses.filter(function (l) { return l.want > 1e-9; });
    if (!gains.length && !losses.length) return {};

    var gainTotal = gains.reduce(function (a, g) { return a + g.want; }, 0);
    var lossTotal = losses.reduce(function (a, l) { return a + l.want; }, 0);

    /* Which factions pay for the gains?
       Normally the ones this patch does NOT touch. But a patch can touch EVERY
       faction — the monthly fascist drift is exactly that, +d to the fascists and
       −d to each of the other four. Then there are no untouched donors at all,
       so the losers pay: they give up their stated loss and the gains are minted
       from exactly that, which keeps the total at 100. */
    var untouched = ids.filter(function (k) { return amount(deltas[k]) === 0; });
    var paidByLosers = untouched.length === 0;

    var applied = {}, pool = 0, donors = untouched, donorWant = [];

    if (paidByLosers) {
      /* No untouched faction to draw on: the losses themselves are the budget.
         Each loser gives up exactly its stated loss and the gains are minted
         from precisely that, so the total holds at 100. Scooping the losers'
         whole holdings instead would hand most of it straight back in the
         refund below and the gain would cancel out. */
      losses.forEach(function (l) {
        f[l.id].inf = Math.max(0, f[l.id].inf - l.want);
        applied[l.id] = -l.want;
        pool += l.want;
      });
      donors = losses.map(function (l) { return l.id; });
      donorWant = donors.map(function (k) { return Math.max(0, f[k].inf); });
    } else {
      /* The untouched factions' whole holding goes into the middle; the gains are
         drawn from it and the remainder is handed back in proportion. Forgetting
         to scoop it in is what made the total climb instead of staying at 100. */
      donorWant = untouched.map(function (k) { return f[k].inf; });
      untouched.forEach(function (k) { f[k].inf = 0; });
      losses.forEach(function (l) {
        f[l.id].inf = Math.max(0, f[l.id].inf - l.want);
        applied[l.id] = -l.want;
      });
      pool = donorWant.reduce(function (a, v) { return a + v; }, 0) + lossTotal;
    }
    /* How many points the gains are allowed to command. */
    var budget = pool;
    var donorPool = donorWant.reduce(function (a, v) { return a + v; }, 0);

    /* Requests that cannot be met in full are scaled by one common factor, so
       relative proportions survive. */
    var scale = gainTotal > budget ? budget / gainTotal : 1;

    /* Give each gain its request (scaled), drawing on the pool. */
    gains.forEach(function (g) {
      var add = Math.min(g.want * scale, pool);
      f[g.id].inf += add;
      pool -= add;
      applied[g.id] = add;
    });

    /* Whatever is left goes back to the donors, in proportion to what they held
       after paying. */
    if (pool > 1e-9 && donorPool > 0) {
      donors.forEach(function (k, i) { f[k].inf += pool * (donorWant[i] / donorPool); });
    }

    /* Clamp only. Do NOT round the targets to integers here: sub-integer changes
       are the whole point (the monthly drift is worth 0.125), and `Math.round`
       on a target silently erased it — `Math.round(17.125)` is 17, which read as
       "the fascists did not grow at all". Rounding belongs at the display layer;
       `adjustFactionInfluence` stores floats for the same reason. */
    var TOL = 1e-9;
    ids.forEach(function (k) {
      if (!(f[k].inf > TOL)) f[k].inf = 0;
      if (f[k].inf > 100) f[k].inf = 100;
    });
    /* Fold any float residue into the largest faction so the total is exactly
       100 without moving a target off its granted amount. */
    var settled = ids.reduce(function (a, k) { return a + f[k].inf; }, 0);
    var need = 100 - settled;
    if (Math.abs(need) > 1e-9) {
      var sinkK = null;
      ids.forEach(function (k) { if (!sinkK || f[k].inf > f[sinkK].inf) sinkK = k; });
      if (sinkK) f[sinkK].inf = Math.max(0, Math.min(100, f[sinkK].inf + need));
    }
    if (W.DEBUG_BATCH) console.log('[batch] applied', JSON.stringify(applied),
      'inf', ids.map(function (k) { return k + ':' + f[k].inf.toFixed(4); }).join(' '));
    return applied;
  };

  /** Safety net only. Influence should already be a zero-sum share summing to 100
      because every change went through adjustFactionInfluence; this rescales if
      something ever got in another way (an old save, a sandbox edit). It must not
      be the mechanism, or the zero-sum property is lost. */
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

  /* ===================== The two crises ===================== */
  /* The Regency faces two threats that are not the same threat, and the game
     used to model them as one number. `order.coup` is the SIEGE: how close Rome
     is to sending the Royal Army — driven by the blockade, the treaties, the
     garrison and the Regency's own standing. `order.subversion` is the FASCIST
     TAKEOVER: how close Mussolini's movement is to coming up the stairs of the
     Palazzo — driven by street violence, the squadre, and the fascists' weight
     inside the Legion's own movement.
     A player can be safe from one and lost to the other, which is the whole
     point: history took Fiume by the second road after failing at the first. */

  /* The siege's own milestones. Three sets by phase, as before. */
  R.siegeMilestones = function (state) {
    var ym = state.date.y * 12 + state.date.m;
    if (ym < 1920 * 12 + 9) {
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

  /* The takeover's own milestones. These used to be the post-Bloody-Christmas
     branch of the siege set — i.e. the game switched which crisis it narrated
     based on a flag, rather than tracking two pressures. They are now genuinely
     independent of the siege's. */
  R.subversionMilestones = function () {
    return [
      { at: 25, id: 's25', zh: '法西斯派在党内要求席位', it: 'I fascisti chiedono seggi nel movimento' },
      { at: 50, id: 's50', zh: '街头枪击与报馆被砸；第一个死者', it: 'Sparatorie e tipografie devastate: il primo morto' },
      { at: 75, id: 's75', zh: '君塔的小队从的里雅斯特进城', it: 'Le squadre di Giunta entrano da Trieste' },
      { at: 100, id: 's100', zh: '他们准备进攻省督府', it: 'Si preparano ad attaccare il Palazzo' }
    ];
  };

  /* Per-turn growth of the internal threat. It is not a copy of the siege: it
     answers to the street and to the fascists' own strength, so a player who
     keeps the peace and holds the fascists down can be under siege for years
     without ever facing a coup — and a player who lets the squadre run can be
     taken from inside while Rome is still talking. */
  R.subversionDelta = function (state, mul) {
    var o = state.order;
    var f = state.factions && state.factions.fascisti ? state.factions.fascisti.inf : 0;
    var d = -6                      // the movement's own inertia: it has to be driven
      + 0.30 * o.squadre            // armed squads on the street
      + 0.35 * Math.max(0, o.violence - 25)
      + 0.50 * Math.max(0, f - 15)  // fascist weight inside the Legion
      - 0.04 * (state.legitimacy || 0);   // the Comandante's personal hold
    /* The honeymoon covers the siege too: in 1919 nobody is plotting indoors. */
    var ym = state.date.y * 12 + state.date.m;
    if (ym < 1920 * 6) d *= 0.25;
    d *= (mul == null ? 1 : mul);
    return clamp(d, -6.0, 20.0);
  };

  /* Kept for older callers/tests that still ask for the siege set by that name. */
  R.coupMilestones = R.siegeMilestones;
  R.COUP_MILESTONES = [];   // 兼容旧引用；实际使用 R.siegeMilestones(state)

  /* ===================== Classes: derived values and monthly evolution ===================== */

  /** Turnout is a slow variable driven by citizenship and electoral law. */
  R.updateClasses = function (state) {
    W.CLASSES.forEach(function (c) {
      var cls = state.classes[c.id];
      if (!cls) return;
      var base = (W.CLASS_TRAITS[c.id] || {}).turnout || 70;
      var civic = state.laws.cittadinanza >= 2 ? 6 : (state.laws.cittadinanza >= 1 ? 3 : 0);
      var want = clamp(base + civic + (state.laws.elettorale || 0) * 1.5, 20, 96);
      cls.turnout = clamp(cls.turnout + (want - cls.turnout) * 0.05, 20, 96);
    });
  };

  /* Faction influence has exactly ONE mutation primitive: adjustFactionInfluence
     above. There is deliberately no R.factionDrift any more — the historical
     growth of the fascists is declared as the `impresa` journal's monthly effect
     (meta.js), so that every automatic change to faction power can be pointed at
     a journal or a law rather than being an engine rule the player cannot see. */

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
    var orgMul = clamp(0.85 + state.order.milizia / 12000, 0.85, 1.35);
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

  /* ===================== Municipal elections ===================== */
  /* The city council, not the Constituent Assembly. Same ballot — the tally is
     R.election's, read back off detail.partyCity, so the two can never drift
     apart — but a different chamber: city only, purely proportional, no
     majority bonus and no sub-district, because the Municipio is the city's.

     Kept well clear of Eng.runElection, which also reshuffles the cabinet,
     reforms the coalition and increments counters.electionsHeld. That counter
     is what the `elezioni` journal and the forty-seat achievement wait on, and
     a municipal vote in October 1919 must not trip either of them.

     Council size is a design parameter, not a computed one; 60 is the figure
     used here and it is worth a second opinion. */
  R.MUNICIPAL_SEATS = 60;
  R.municipalElection = function (state) {
    /* Taking the Municipio outright means no ballot is ever cast. */
    if (state.flags.no_election) {
      return {
        seats: R.PARTY_IDS.reduce(function (a, p) { a[p] = 0; return a; }, {}),
        detail: { share: {}, ranked: [], winner: null, runnerUp: null,
                  council: R.MUNICIPAL_SEATS, turnout: 0,
                  boycotted: false, singleList: false, noElection: true }
      };
    }

    var d = R.election(state).detail;
    var tally = d.partyCity || {};

    /* One list means the autonomists and the Croats stay away — Zanella called
       for abstention and the Croatian districts followed. Their votes are not
       cast at all, so the council is smaller and the National Council's share
       is inflated by the abstention rather than by persuasion. Two lists put
       everyone on the ballot and the city's real split shows through. */
    var singleList = !!state.flags.single_list;
    var absent = singleList ? { AUT: 1, PCR: 1, PAD: 1 } : {};

    var votes = {}, total = 0;
    Object.keys(tally).forEach(function (p) {
      if (absent[p] || !(tally[p] > 0)) return;
      votes[p] = tally[p];
      total += tally[p];
    });
    var seats = R.PARTY_IDS.reduce(function (a, p) { a[p] = 0; return a; }, {});
    if (total > 0) {
      var alloc = Core.largestRemainder(votes, R.MUNICIPAL_SEATS);
      Object.keys(alloc).forEach(function (p) { seats[p] = alloc[p]; });
    }
    var share = {};
    Object.keys(votes).forEach(function (p) { share[p] = votes[p] * 100 / (total || 1); });
    var ranked = Object.keys(seats).filter(function (p) { return seats[p] > 0; })
      .sort(function (a, b) { return seats[b] - seats[a]; });
    return {
      seats: seats,
      detail: {
        share: share,
        ranked: ranked,
        winner: ranked[0] || null,
        runnerUp: ranked[1] || null,
        council: R.MUNICIPAL_SEATS,
        turnout: singleList ? Core.round1(d.turnout * 0.72) : d.turnout,
        boycotted: singleList,
        singleList: singleList,
        noElection: false
      }
    };
  };

  /* ===================== The Modus Vivendi division ===================== */
  /* Nitti's provisional settlement, put to the city on 15 December 1919. What
     is being decided is not whether the terms are good but whether they are
     worth more than the wait for annexation, which is why almost nobody votes
     on the merits — each party votes its own predicament, weighted by the
     strength it actually has. The Comandante's answer in November swings the
     Legion and the arditi, and nothing else. */
  R.MODUS_STANCE = {
    AUT: 'yes',    // a free state is what the autonomists have wanted all along
    PAD: 'yes',
    PCR: 'yes',    // anything that keeps Fiume out of Italy
    ANI: 'no',     // nothing short of annexation
    PSI: 'no'      // against the whole settlement, and against the Regency
  };
  R.modusVote = function (state) {
    var accepted = !!state.flags.modus_accepted;
    var blocked = !!state.flags.modus_blocked;
    var rows = [], yes = 0, no = 0, abstain = 0;

    /* Strength is the assembly when one has been elected, the city's own
       support otherwise — the Council existed before any ballot did. */
    var seats = state.assembly || {};
    var hasSeats = Core.sum(seats) > 0;

    var weigh = function (p) {
      if (hasSeats) return seats[p] || 0;
      var w = 0;
      W.CLASSES.forEach(function (cl) {
        var cls = state.classes[cl.id];
        if (cls && cls.support[p]) w += cls.pop * cls.support[p] / 100;
      });
      return Math.round(w * 10) / 10;
    };
    var record = function (p, weight, stance, zh, it) {
      if (weight <= 0) return;
      if (stance === 'yes') yes += weight;
      else if (stance === 'no') no += weight;
      else abstain += weight;
      rows.push({ party: p, weight: weight, stance: stance, zh: zh, it: it });
    };

    R.PARTY_IDS.forEach(function (p) {
      var stance = R.MODUS_STANCE[p];
      if (!stance) return;
      record(p, weigh(p), stance,
        stance === 'yes' ? '赞成' : '反对',
        stance === 'yes' ? 'favorevole' : 'contrario');
    });

    /* The Legion is not of one mind, so it follows the Comandante — and splits
       when it does not. With him against, the arditi come out against; with
       him for it, the irreconcilables abstain rather than vote yes. The arditi
       are always a row of their own, so the hall can be read down. */
    var ard = Math.round(state.order.milizia / 100 * 10) / 10;
    var legion = weigh('LEG');
    if (blocked) {
      record('LEG', legion, 'no', '军团随指挥官反对', 'La Legione segue il Comandante');
      record('ARD', ard, 'no', '阿迪蒂随指挥官反对', 'Gli arditi seguono il Comandante');
    } else if (accepted) {
      record('LEG', legion, 'yes', '军团随指挥官赞成', 'La Legione segue il Comandante');
      if (state.factions.arditi.dis > 40) {
        record('ARD', ard, 'abstain', '阿迪蒂拒绝投票', 'Gli arditi non votano');
      } else {
        record('ARD', ard, 'yes', '阿迪蒂随指挥官赞成', 'Gli arditi seguono il Comandante');
      }
    } else {
      record('LEG', legion, 'abstain', '指挥官尚未表态，军团观望', 'La Legione attende');
      record('ARD', ard, 'abstain', '阿迪蒂等待指挥官', 'Gli arditi attendono il Comandante');
    }

    var total = yes + no + abstain || 1;
    return {
      rows: rows.sort(function (a, b) { return b.weight - a.weight; }),
      yes: Core.round1(yes), no: Core.round1(no), abstain: Core.round1(abstain),
      yesPct: Core.round1(yes * 100 / total),
      noPct: Core.round1(no * 100 / total),
      absPct: Core.round1(abstain * 100 / total),
      carried: yes > no
    };
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
  R.confidenceTarget = function (state) {
    var e = state.economy;
    return clamp(70 - 0.5 * e.strike + 0.25 * (e.traffic - 40)
      - 0.3 * state.order.violence + 0.2 * state.legitimacy, 0, 100);
  };
  R.incomeTaxRate = function (state) {
    var lvl = state.laws.fisco || 0;
    if (lvl < 2) return 0;
    return Math.max(state.taxRates.reddito || 0, lvl >= 3 ? 0.45 : 0.30);
  };
  R.revenue = function (state) {
    var e = state.economy, r = state.taxRates, L = state.laws, boost = state.revenueBoost || {};
    var conf = 0.75 + 0.005 * e.capitalConfidence;
    var portFees = e.traffic * 3.1 * r.porto * conf;
    var customs = e.traffic * 2.5 * r.dogana * (1 + 0.05 * L.dogana);
    var excise = (100 - e.unemployment) * 0.45 * r.consumo;
    var income = (100 - e.unemployment) * 0.7 * R.incomeTaxRate(state) * (1 + 0.04 * L.fisco);
    var rec = {
      porto: portFees * (1 + (boost.porto || 0)),
      dogana: customs * (1 + (boost.dogana || 0)),
      consumo: excise * (1 + (boost.consumo || 0)),
      reddito: income * (1 + (boost.reddito || 0))
    };
    rec.total = rec.porto + rec.dogana + rec.consumo + rec.reddito;
    return rec;
  };
  R.spending = function (state) {
    var e = state.economy, o = state.order;
    var admin = 42.0;
    var police = 6.0 + o.police / 40.0;
    var legion = o.milizia * 0.013;          // 军团兵的军饷与给养
    var works = e.works / 100 * 12.0;
    var debtService = e.debt * 0.0035;
    var relief = Math.max(0, e.unemployment - 12) * 1.7 + (state.laws.lavoro || 0) * 2.0;
    var total = admin + police + legion + works + debtService + relief;
    return { admin: admin, police: police, legion: legion,
      works: works, debt: debtService, relief: relief, total: total };
  };

  R.charterProgress = function (state) {
    var requirements = Meta.CHARTER_REQUIREMENTS;
    var met = requirements.filter(function (r) { return (state.laws[r.id] || 0) >= r.level; }).length;
    var fractions = requirements.reduce(function (sum, r) {
      return sum + Math.min(1, (state.laws[r.id] || 0) / r.level);
    }, 0);
    return { met: met, total: requirements.length,
      score: state.flags.charter_promulgated ? 3 * fractions / requirements.length : 0 };
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
    // Working hours and social protection are distinct legal choices.
    out.economy.strike = (out.economy.strike || 0) - (L.orario || 0) * 0.5 - L.lavoro * 1.1;
    out.economy.unemployment = (out.economy.unemployment || 0) - (L.orario || 0) * 0.12;
    out.economy.capitalConfidence = (out.economy.capitalConfidence || 0) - (L.orario || 0) * 0.2;
    // Language
    if (L.lingua >= 1) { out.diplo.yugoslavia = (out.diplo.yugoslavia || 0) + 0.5 * L.lingua; }
    if (L.lingua >= 2) { out.support.push(['contadini', 'AUT', 0.3]); }
    if (L.scuola >= 1) { out.support.push(['contadini', 'LEG', 0.25 * L.scuola]); }
    // Finance
    out.economy.capitalConfidence = (out.economy.capitalConfidence || 0) - L.fisco * 0.9;
    // The promulgated Charter's stabilising effect follows enacted provisions.
    out.order.coup = (out.order.coup || 0) - R.charterProgress(state).score * 0.7;
    // Citizenship
    return out;
  };

  /* ===================== Party relations ===================== */
  /* A symmetric matrix of how each party regards each other, -100 to +100.
     It is not stored as a flat list of opinions but derived from two things a
     player can reason about: whether the parties sit in the same electoral camp,
     and how often they would vote the same way on the laws on the books. */

  /** The value a relationship settles at when nothing is pushing it. */
  /* How two parties stand to each other when nothing has happened yet. Read
     straight from the authored table, so the standing feuds of September 1919
     do not shift because a law was voted a particular way. Everything that
     moves after that — drift, and the effect of governing together — is
     handled in relationDrift below. */
  R.relationBaseline = function (state, a, b) {
    if (a === b) return 100;
    if (!W.PARTY_BY_ID[a] || !W.PARTY_BY_ID[b]) return 0;
    var key = a < b ? a + '|' + b : b + '|' + a;
    var v = W.RELATION_BASE[key];
    return typeof v === 'number' ? v : 0;
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
    if (state.flags.carta_done) base += 6;
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

  /* ===================== Three-state battle resolution ===================== */
  /* A siege is not a menu choice: the two sides are priced, compared, and the
     result falls out of the comparison. The shape is lifted from
     `social_democracy_alternate_history`'s `civil_war.scene.dry:73-84`, where the
     republic's `total_power` is weighed against the enemy's and yields exactly
     three outcomes — victory, a long war, or total defeat:

       if (total_power > enemy_power * 1.1)      republic_victory
       else if (total_power / enemy_power >= 0.6) long_war
       else                                       total_defeat

     Two deliberate differences from the reference:
       - the margin is per-battle (`opts.margin`, default `W.BATTLE_MARGIN`), so a
         siege Rome is committed to can be harder to survive than a street coup;
       - a defender at zero is a defeat outright, because here the attacker is a
         real army with artillery rather than a paramilitary of comparable quality.
     `isFavorable` is kept for narrative temperature only, exactly as the
     reference uses it: it decides which text to show, never who won. */
  R.battleForces = function (state, side) {
    var o = state.order;
    var C = (W.BATTLE || {})[side] || {};
    if (side === 'defender') {
      /* What the Regency can actually put on the barricades: the Legion, plus the
         units whose loyalty is a function of its own standing. */
      var d = o.milizia * (C.milizia == null ? 1.0 : C.milizia)
        + o.police * (C.police == null ? 2.0 : C.police)
        + o.carabinieri * (C.carabinieri == null ? 1.5 : C.carabinieri)
        + o.garrison * (C.garrison == null ? 8.0 : C.garrison) * (o.authority / 100)
        + o.fervour * (C.fervour == null ? 4.0 : C.fervour);
      /* A movement that has lost the street fights with itself. */
      d *= 1 - R.factionDissent(state) / (C.dissentDiv || 200);
      return Math.max(0, d);
    }
    /* The attacker is the Royal Army reinforced by the ships (the siege axis
       `coup`, 0..100) plus Mussolini's squads. */
    var a = o.garrison * (C.garrison == null ? 34.0 : C.garrison)
      + Math.max(0, o.coup || 0) * (C.coup == null ? 26.0 : C.coup)
      + o.squadre * (C.squadre == null ? 8.0 : C.squadre);
    return Math.max(0, a);
  };

  R.resolveBattle = function (state, opts) {
    opts = opts || {};
    var d = opts.defenderPower == null ? R.battleForces(state, 'defender') : opts.defenderPower;
    var a = opts.attackerPower == null ? R.battleForces(state, 'attacker') : opts.attackerPower;
    return R._battleOutcome(state, d, a, opts);
  };

  /* The 1924 crisis: the fascist coup arrives together with the Treaty of Rome, so
     the attacker is the squads AND the state that backs them. This is why it is a
     separate pricing rather than a reuse of the siege or the 1922 coup: neither of
     those has a foreign ultimatum behind it. `subversion` is the internal fascist
     pressure (0..100) and is what makes this attempt bigger than the 1922 one. */
  R.annexationForces = function (state, side) {
    if (side === 'defender') return R.battleForces(state, 'defender');
    var o = state.order, C = W.COUP_1924 || {};
    return Math.max(0,
      o.squadre * (C.squadre == null ? 10.0 : C.squadre)
      + Math.max(0, o.subversion || 0) * (C.subversion == null ? 40.0 : C.subversion)
      + o.garrison * (C.garrison == null ? 20.0 : C.garrison));
  };

  R.resolveAnnexation = function (state, opts) {
    opts = opts || {};
    var d = opts.defenderPower == null ? R.annexationForces(state, 'defender') : opts.defenderPower;
    var a = opts.attackerPower == null ? R.annexationForces(state, 'attacker') : opts.attackerPower;
    return R._battleOutcome(state, d, a, opts);
  };

  /* The 1924 diplomatic crisis: the Treaty of Rome is enforced by the Royal Army
     because the Italian fascists never grew strong enough to do it themselves
     (`forze.fascisti < 60`). Same three-state resolution, weaker attacker — see
     W.TREATY_1924 for why there is no `subversion` term here. */
  R.treatyForces = function (state, side) {
    if (side === 'defender') return R.battleForces(state, 'defender');
    var o = state.order, C = W.TREATY_1924 || {};
    return Math.max(0,
      o.squadre * (C.squadre == null ? 4.0 : C.squadre)
      + o.garrison * (C.garrison == null ? 12.0 : C.garrison));
  };

  R.resolveTreaty = function (state, opts) {
    opts = opts || {};
    var d = opts.defenderPower == null ? R.treatyForces(state, 'defender') : opts.defenderPower;
    var a = opts.attackerPower == null ? R.treatyForces(state, 'attacker') : opts.attackerPower;
    return R._battleOutcome(state, d, a, opts);
  };

  /* Shared three-state comparison, so every 1924 / siege path reads the same
     thresholds and cannot drift apart. */
  R._battleOutcome = function (state, d, a, opts) {
    opts = opts || {};
    var margin = opts.margin == null ? (W.BATTLE_MARGIN || 1.0) : opts.margin;
    var floor = opts.floor == null ? (W.BATTLE_STALEMATE || 0.6) : opts.floor;
    if (d <= 0) return { state: 'defeat', defender: 0, attacker: a, ratio: 0, favorable: false };
    if (a <= 0) return { state: 'victory', defender: d, attacker: 0, ratio: Infinity, favorable: true };
    var ratio = d / a;
    return {
      state: ratio > margin ? 'victory' : (ratio >= floor ? 'stalemate' : 'defeat'),
      defender: d, attacker: a, ratio: ratio,
      favorable: ratio >= (W.BATTLE_FAVORABLE || 0.95)
    };
  };

  /* ===================== The Arengo: two chambers ===================== */
  /* The Charter's legislature is bicameral and only exists once the Charter has been
     promulgated — the two councils TOGETHER are the Arengo (see gv_arengo). Neither
     is a general election: the Ottimi are apportioned to the citizen body, the
     Provvisori to the nine Corporations. */

  /** The franchise, per `laws.cittadinanza`. Level 0 is the Legion plus anyone
      resident before 1918; each further level admits another group, with the
      post-1918 Italians (`regnicoli`) last. Returns the franchised share of each
      class and the citizen total, from which the Ottimi's size follows. */
  R.electorate = function (state) {
    var level = clamp(state.laws.cittadinanza || 0, 0, W.CITIZENSHIP_FRANCHISE.length - 1);
    var admitted = {};
    for (var i = 0; i <= level; i++) {
      (W.CITIZENSHIP_FRANCHISE[i] || []).forEach(function (cid) { admitted[cid] = true; });
    }
    var byClass = {}, share = 0;
    W.CLASSES.forEach(function (cl) {
      var st = state.classes[cl.id];
      if (!st) return;
      var on = !!admitted[cl.id];
      byClass[cl.id] = on ? st.pop : 0;
      if (on) share += st.pop;
    });
    var citizens = Math.round((state.economy.population || 0) * share / 100);
    return {
      level: level, byClass: byClass,
      classShare: share,
      citizens: citizens,
      popTotal: Math.round(state.economy.population || 0)
    };
  };

  /** The Consiglio degli Ottimi: one councillor per thousand CITIZENS, so both the
      franchise and the population move it. Seats are apportioned to parties by the
      same class→support weights the general election uses, restricted to the
      franchised classes. Term: three years (`W.OTTIMI_TERM_TURNS`). */
  R.ottimiChamber = function (state) {
    var el = R.electorate(state);
    var seats = Math.max(1, Math.floor(el.citizens / (W.OTTIMI_PER_CITIZENS || 1000)));
    var weights = {};
    R.PARTY_IDS.forEach(function (p) { weights[p] = 0; });
    W.CLASSES.forEach(function (cl) {
      if (!el.byClass[cl.id]) return;
      var st = state.classes[cl.id];
      if (!st) return;
      for (var pid in st.support) {
        if (!Object.prototype.hasOwnProperty.call(st.support, pid)) continue;
        weights[pid] = (weights[pid] || 0) + el.byClass[cl.id] * st.support[pid] / 100;
      }
    });
    var alloc = Core.largestRemainder(weights, seats);
    var out = {};
    R.PARTY_IDS.forEach(function (p) { out[p] = alloc[p] || 0; });
    return { seats: seats, byParty: out, citizens: el.citizens, franchiseLevel: el.level };
  };

  /** The Consiglio dei Provvisori: 60 seats, elected by the nine Corporations.
      For each Corporation its seat bloc is apportioned among the parties in
      proportion to the class support inside that Corporation's membership. Any
      seats that fall to the player's own party are then spread across the Legion's
      internal factions in proportion to their influence. */
  R.provvisoriChamber = function (state) {
    var byParty = {}, byCorporation = {};
    R.PARTY_IDS.forEach(function (p) { byParty[p] = 0; });
    (W.CORPORATIONS || []).forEach(function (corp) {
      var weights = {};
      R.PARTY_IDS.forEach(function (p) { weights[p] = 0; });
      Object.keys(corp.members).forEach(function (cid) {
        var st = state.classes[cid];
        if (!st) return;
        var w = corp.members[cid] * st.pop;
        for (var pid in st.support) {
          if (!Object.prototype.hasOwnProperty.call(st.support, pid)) continue;
          weights[pid] = (weights[pid] || 0) + w * st.support[pid] / 100;
        }
      });
      var alloc = Core.largestRemainder(weights, corp.seats);
      var seats = {};
      R.PARTY_IDS.forEach(function (p) { seats[p] = alloc[p] || 0; byParty[p] += seats[p]; });
      var tot = R.PARTY_IDS.reduce(function (a, p) { return a + weights[p]; }, 0) || 1;
      var top = R.PARTY_IDS.filter(function (p) { return seats[p] > 0; })
        .sort(function (a, b) { return seats[b] - seats[a]; });
      byCorporation[corp.id] = {
        id: corp.id, zh: corp.zh, it: corp.it, seats: corp.seats,
        byParty: seats, winner: top[0] || null,
        share: weights[top[0]] ? weights[top[0]] * 100 / tot : 0
      };
    });
    return {
      seats: W.CORPORATION_SEATS || 60,
      byParty: byParty,
      byCorporation: byCorporation,
      factions: R.splitFactions(state, byParty[state.playerForce] || 0)
    };
  };

  /** Spread `seats` across the player's own factions in proportion to influence.
      The Legion is not one party: handing it a bloc of council seats hands them to
      the arditi, the sindacalisti, the futuristi and the rest, in the share they
      actually hold inside it. */
  R.splitFactions = function (state, seats) {
    if (!seats) return {};
    var weights = {};
    W.FACTIONS.forEach(function (f) {
      var st = state.factions[f.id];
      weights[f.id] = st ? Math.max(0, st.inf) : 0;
    });
    var alloc = Core.largestRemainder(weights, seats);
    var out = {};
    W.FACTIONS.forEach(function (f) { if (alloc[f.id]) out[f.id] = alloc[f.id]; });
    return out;
  };

  /** Rebuild both chambers. Called when the Charter is promulgated and whenever a
      chamber's term runs out. Returns null while the Charter is still in the
      archive: there is nothing to sit in. */
  R.conveneArengo = function (state) {
    if (!state.flags.charter_promulgated) return null;
    var ottimi = R.ottimiChamber(state);
    var provvisori = R.provvisoriChamber(state);
    state.arengo = {
      ottimi: {
        seats: ottimi.seats, byParty: ottimi.byParty,
        byFaction: R.splitFactions(state, ottimi.byParty[state.playerForce] || 0),
        citizens: ottimi.citizens, franchiseLevel: ottimi.franchiseLevel,
        termStart: state.turn, termEnd: state.turn + (W.OTTIMI_TERM_TURNS || 72)
      },
      provvisori: {
        seats: provvisori.seats, byParty: provvisori.byParty,
        byCorporation: provvisori.byCorporation, byFaction: provvisori.factions,
        termStart: state.turn, termEnd: null      /* the Corporations sit for the life of the Regency */
      },
      convened: state.turn
    };
    return state.arengo;
  };

  /** The Ottimi's three-year term. Idempotent; the engine calls it every turn so a
      long Regency reseats the council rather than freezing its first composition. */
  R.arengoTick = function (state) {
    if (!state.flags.charter_promulgated) return false;
    if (!state.arengo || !state.arengo.ottimi) { R.conveneArengo(state); return true; }
    var o = state.arengo.ottimi;
    if (o.termEnd != null && state.turn >= o.termEnd) {
      var fresh = R.ottimiChamber(state);
      state.arengo.ottimi = {
        seats: fresh.seats, byParty: fresh.byParty,
        byFaction: R.splitFactions(state, fresh.byParty[state.playerForce] || 0),
        citizens: fresh.citizens, franchiseLevel: fresh.franchiseLevel,
        termStart: state.turn, termEnd: state.turn + (W.OTTIMI_TERM_TURNS || 72)
      };
      return true;
    }
    return false;
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
    if (state.flags.charter_promulgated) grant('ach_balcony');
    if (state.flags.charter_debate_resolved) grant('ach_arengo');
    if (state.journals.carta && state.journals.carta.done) grant('ach_carta_implemented');
    if (state.laws.lavoro >= 3 && state.laws.fisco >= 2 && state.order.fervour >= 70 &&
        state.factions.sindacalisti.inf >= 60) grant('ach_comune');
    if (state.date.y > 1921 || (state.date.y === 1921 && state.date.m >= 4)) grant('ach_survive');
    if (state.flags.fascio_disarmed) grant('ach_disarm');
    if ((state.assembly.LEG || 0) >= 30 && state.counters.electionsHeld >= 1) grant('ach_seats');
    if (state.flags.international_guarantee) grant('ach_geneva');
    if (state.economy.traffic >= 75) grant('ach_port');
    if (state.economy.inflation < 12 && state.economy.debt < 1800) grant('ach_sound');
    if (state.flags.reconciled) grant('ach_reconcile');
    if ((state.counters.resistMonths || 0) >= 18) grant('ach_stay');
    if (state.order.fervour >= 100 && state.order.authority >= 65) grant('ach_eia_alala');
    if (mono.populationLost >= 5000) grant('ach_empty');
    if (mono.minViolenceOK && state.date.y >= 1924) grant('ach_calm');
    if (mono.minDissentOK && state.monthIndex >= 11) grant('ach_dissent');
    /* Venice and Danzig live here now rather than in ENDINGS. */
    if (state.laws.portofranco >= 3 && state.economy.traffic >= 85 &&
        state.factions.sindacalisti.inf >= 20) grant('ach_venice');
    if (state.flags.international_guarantee && state.flags.carta_done) grant('ach_danzig');
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
        if (!def) continue;
        var mx = def.max;
        state.laws[lk] = clamp((state.laws[lk] || 0) + e.laws[lk], 0, mx);
        notes.push(['law:' + lk, e.laws[lk]]);
      }
    }
    if (e.setLaw) for (var sk in e.setLaw) if (Object.prototype.hasOwnProperty.call(e.setLaw, sk)) state.laws[sk] = e.setLaw[sk];

    if (e.diplo) for (var dk in e.diplo) if (Object.prototype.hasOwnProperty.call(e.diplo, dk)) {
      state.diplo[dk] = clamp((state.diplo[dk] || 0) + e.diplo[dk], 0, 100);
    }
    if (e.order) for (var ok in e.order) if (Object.prototype.hasOwnProperty.call(e.order, ok)) {
      if (ok === 'coup' || ok === 'subversion') o[ok] = clamp((o[ok] || 0) + e.order[ok], 0, W.CRISIS_MAX);
      /* Unit counts, not 0-100 scales. `milizia` belongs here and was missing:
         it is a headcount that starts at 2 500 and is raised by events well past
         100 (ev_1919_09_marcia +260, ev_1920_01_inverno +400, advisors +320), so
         the generic clamp was silently collapsing the whole Legion to 100 every
         time any of those fired. */
      else if (ok === 'police' || ok === 'milizia' || ok === 'carabinieri') {
        o[ok] = Math.max(0, o[ok] + e.order[ok]);
      } else o[ok] = clamp((o[ok] || 0) + e.order[ok], 0, 100);
    }
    if (e.economy) for (var ek in e.economy) if (Object.prototype.hasOwnProperty.call(e.economy, ek)) {
      if (ek === 'population') ec.population = Math.max(0, ec.population + e.economy[ek]);
      else if (ek === 'debt' || ek === 'treasury' || ek === 'arrears') ec[ek] = Math.max(0, (ec[ek] || 0) + e.economy[ek]);
      else ec[ek] = clamp((ec[ek] || 0) + e.economy[ek], -100, 500);
    }
    if (e.factions) {
      /* Influence is a share of a fixed 100, so it moves by transfer, never by
         addition. See R.adjustFactionInfluence / R.batchFactionInfluence.
         When a patch moves SEVERAL factions at once they are settled together:
         otherwise the first transfer eats into the second one's target and the
         authored numbers do not land (+5/+3 came out +4.09/+1.41). */
      var infMoves = {}, infCount = 0;
      for (var pk in e.factions) if (Object.prototype.hasOwnProperty.call(e.factions, pk)) {
        if (e.factions[pk].inf != null) { infMoves[pk] = e.factions[pk].inf; infCount++; }
      }
      if (infCount > 1) R.batchFactionInfluence(state, infMoves);
      for (var fk in e.factions) if (Object.prototype.hasOwnProperty.call(e.factions, fk)) {
        var f = state.factions[fk];
        if (!f) continue;
        if (e.factions[fk].inf != null && infCount === 1) {
          R.adjustFactionInfluence(state, fk, e.factions[fk].inf);
        }
        if (e.factions[fk].dis != null) f.dis = clamp(f.dis + e.factions[fk].dis, 0, 100);
      }
    }
    if (e.districts) for (var dk2 in e.districts) if (Object.prototype.hasOwnProperty.call(e.districts, dk2)) {
      var dst = state.districts[dk2];
      if (!dst) continue;
      for (var dkk in e.districts[dk2]) if (Object.prototype.hasOwnProperty.call(e.districts[dk2], dkk)) {
        dst[dkk] = clamp((dst[dkk] || 0) + e.districts[dk2][dkk], 0, 100);
      }
    }
    if (e.flags) for (var fl in e.flags) if (Object.prototype.hasOwnProperty.call(e.flags, fl)) state.flags[fl] = e.flags[fl];
    /* The forces outside Fiume. A positive move toward one is automatically a
       negative move for whoever it is written in W.FORZA_ANTAGONISM as its
       rival, so courting one movement can strain another relationship.
       Seeded at -40..+40 because an
       attitude is a relationship, not a resource stock. */
    if (e.forze) for (var fz in e.forze) if (Object.prototype.hasOwnProperty.call(e.forze, fz)) {
      if (!state.forze) state.forze = {};
      var fzD = e.forze[fz], fzV = (state.forze[fz] || 0) + fzD;
      state.forze[fz] = clamp(fzV, -40, 100);
      notes.push(['forze:' + fz, fzD]);
      if (fzD > 0) {
        var fzAnt = (W.FORZA_ANTAGONISM || {})[fz] || {};
        for (var fzR in fzAnt) if (Object.prototype.hasOwnProperty.call(fzAnt, fzR)) {
          /* Scale once, from the patch, not from state: reading the already
             written value here would make the penalty depend on itself. */
          var fzPen = fzAnt[fzR] * fzD / 12;
          state.forze[fzR] = clamp((state.forze[fzR] || 0) - fzPen, -40, 100);
          notes.push(['forze_rival:' + fzR, -fzPen]);
        }
      }
    }
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
