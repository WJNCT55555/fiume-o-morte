/* ==========================================================================
   引擎 · 状态构造 / action 路由 / 半月回合与月度结算
   单一状态模型 + 唯一写入漏斗。见 ARCHITECTURE 风格与 docs/设计案.md 第 6 章。
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core, root.Fiume.World, root.Fiume.Rules,
    root.Fiume.Cards, root.Fiume.Events, root.Fiume.Meta);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Engine = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this,
  function (Core, W, R, Cards, Events, Meta) {
    'use strict';

    var Eng = {};
    var clamp = Core.clamp;
    var CARD_BY_ID = {};
    Cards.forEach(function (c) { CARD_BY_ID[c.id] = c; });
    /* Ending judgement order, computed once. `checkEnd` walks this list on every
       settlement, so sorting it per turn would be wasted work. `ending_timer` is
       dropped here: its check is `return true` and it must never act as a trigger
       (see the note in checkEnd). */
    var ENDINGS_BY_PRIORITY = Meta.ENDINGS
      .filter(function (e) { return e.id !== 'ending_timer'; })
      .sort(function (a, b) { return a.priority - b.priority; });
    var EVENT_BY_ID = {};
    Events.forEach(function (e) { EVENT_BY_ID[e.id] = e; });

    Eng.CARD_BY_ID = CARD_BY_ID;
    Eng.EVENT_BY_ID = EVENT_BY_ID;
    Eng.ALL_CARDS = Cards;
    Eng.ALL_EVENTS = Events;
    Eng.MINISTRIES = W.MINISTRIES;

    /* ==========================================================
       状态构造
       ========================================================== */
    Eng.createState = function (scenarioId, difficultyId, seed, forceId) {
      var scn = W.SCENARIOS.filter(function (s) { return s.id === scenarioId; })[0] || W.SCENARIOS[0];
      var dif = W.DIFFICULTIES.filter(function (d) { return d.id === difficultyId; })[0] || W.DIFFICULTIES[0];
      var playerForce = W.PARTY_BY_ID[forceId] && W.PARTY_BY_ID[forceId].player ? forceId : W.PLAYER.id;
      var start = scn.start;
      var s = {
        version: 13,
        scenario: scn.id, difficulty: dif.id,
        seed: seed || 20251005, rngTick: 0,
        date: { y: start.y, m: start.m, d: start.d || 12 },
        turn: 1, phase: 'event', monthIndex: 0,
        playerForce: playerForce,
        ap: dif.ap, maxAp: dif.ap, handLimit: dif.hand,   // handLimit = reserved card slots

        funds: 2400,
        arms: 220,
        legitimacy: 40,
        supportBias: {},

        classes: {}, factions: {},

        revenueBoost: { porto: 0, dogana: 0, consumo: 0, reddito: 0 },
        taxRates: { porto: 0.60, dogana: 0.50, consumo: 0.45, reddito: 0.0 },

        economy: {
          traffic: 34, hinterland: 20, delta: 14, works: 32, recognition: 26,
          /* 35, not 8: `ev_strike` ("the ultimatum of the Sedi Riunite") fires in the
             20..40 band, and labour unrest has no upward monthly drift — the only
             term in R.lawMonthly is `-(orario*0.5) - lavoro*1.1`. Starting below the
             band therefore meant the ultimatum could never open: the strike falls to
             0 as soon as labour law passes and never comes back. Starting inside it
             makes the ultimatum a live threat from September 1919, which is the
             historical situation — the port was already organised and already
             pressing. The cost is real and deliberate: capital confidence opens at
             51 instead of 65. */
          strike: 35, unemployment: 24, inflation: 8, population: 52000,
          /* 48, not 38, to offset the strike change above: `strike` enters
             R.confidenceTarget as `-0.5 * strike`, so opening at 35 instead of 8
             costs 13.5 points of target. Raising the opening figure keeps the
             ACTUAL starting confidence near where it was (38 against a target of
             64.6 before, 48 against 51.1 now — still short, but not a collapse),
             which is what the charter route needs to survive to 1921. */
          treasury: 0, debt: 1800, arrears: 0, capitalConfidence: 48,
          lastRevenue: 0
        },

        laws: {
          elettorale: 0, lingua: 0, portofranco: 1, cittadinanza: 0,
          ordine: 0, stampa: 1, scuola: 0, dogana: 0, orario: 0, lavoro: 0, fisco: 0
        },

        assembly: {},
        electionDetail: null,
        /* The Arengo — the Charter's two councils (Consiglio degli Ottimi and
           Consiglio dei Provvisori). Null until the Charter is promulgated; see
           R.conveneArengo. `assembly` above is the 1921 general election and is
           deliberately kept apart from both. */
        arengo: null,
        cabinet: {}, coalition: { members: ['LEG'], cohesion: 66, formed: Core.dateKey(start) },
        relations: {},   // symmetric party-to-party regard, -100..+100

        order: {
          authority: 46, garrison: 22, fervour: 92, squadre: 12, violence: 22,
          tension: 0, coup: 8, coupMilestones: [],
          subversion: 0, subversionMilestones: [],
          milizia: 2500, police: 120, carabinieri: 120
        },

        diplo: {}, posture: 'equidistant',
        districts: {},
        hand: [], discard: [], deckCounts: {},
        currentEvent: null, eventQueue: [], eventHistory: [], eventCooldowns: {},
        pendingCard: null,   // card id awaiting an option choice; null when no card menu is open

        journals: {}, advisors: { roster: [], active: [], lastAction: -99, cooldown: 6 },
        flags: {}, log: [], achievements: [], ending: null,
        counters: { strikes: 0, violenceEvents: 0, emigrants: 0, exileMonths: 0, resistMonths: 0, calmMonths: 0, electionsHeld: 0 },
        monotonic: { populationLost: 0, minViolenceOK: true, minDissentOK: true, coupHappened: false, electionsWon: 0, electionsHeld: 0 },
        sandbox: { open: false },
        series: { traffic: [34], unemployment: [24], coup: [8], legitimacy: [40], population: [52000] }
      };

      W.CLASSES.forEach(function (c) {
        var sup = {};
        var row = W.INITIAL_SUPPORT[c.id] || {};
        W.PARTIES.forEach(function (p) { sup[p.id] = row[p.id] || 0; });
        var tr = W.CLASS_TRAITS[c.id] || {};
        s.classes[c.id] = {
          pop: c.pop,
          support: Core.normalize(sup, 100),
          turnout: tr.turnout == null ? 70 : tr.turnout,   // 投票率 0–100
        };
      });
      W.FACTIONS.forEach(function (f) { s.factions[f.id] = { inf: f.inf, dis: f.dis }; });
        W.DIPLO_ACTORS.forEach(function (a) { s.diplo[a.id] = a.init; });
      /* The forces outside Fiume keep their own map: their attitude toward the
         Legion is a relationship, not a diplomatic standing, so it must not
         enter diplomacy and faction relationships. */
      s.forze = {};
      W.FORZE.forEach(function (f) { s.forze[f.id] = f.init; });
      W.DISTRICTS.forEach(function (d) {
        s.districts[d.id] = {
          control: d.control, agitation: d.agitation, unemployment: d.unemployment,
          ethnicIt: d.ethnicIt, ethnicSl: d.ethnicSl
        };
      });
      W.MINISTRIES.forEach(function (m) { s.cabinet[m.id] = 'LEG'; });

      // Scenario seed overrides
      var sd = scn.seed || {};
      if (sd.assembly) s.assembly = Core.merge(s.assembly, sd.assembly);
      if (sd.authority != null) s.order.authority = sd.authority;
      if (sd.garrison != null) s.order.garrison = sd.garrison;
      if (sd.coup != null) s.order.coup = sd.coup;
      if (sd.violence != null) s.order.violence = sd.violence;
      if (sd.milizia != null) s.order.milizia = sd.milizia;
      if (sd.exile) { s.flags.exile = true; s.flags.coup_done = true; s.phase = 'exile'; }
      if (sd.contested) s.flags.contested = true;
      if (sd.runElection) s.flags.run_election_now = true;

      s.order.tension = R.tension(s);
      s.partySupport = R.nationalSupport(s);
      if (sd.runElection) Eng.runElection(s, Core.makeRng(s.seed + 17));
      // The reserved slots start empty. Cards enter them only through an
      // explicit DRAW_CARD, so the player chooses when to draw.
      var first = Eng.pickEvent(s, Core.makeRng(s.seed + 3));
      s.currentEvent = first ? first.id : null;
      if (!s.currentEvent) s.phase = 'action';
      R.relationsInit(s);

      Eng.postProcess(s);
      s.prev = Eng.resourceSnapshot(s);
      return s;
    };

    /* Resource snapshot, used to display month-on-month deltas */
    Eng.resourceSnapshot = function (s) {
      return {
        tesoro: s.funds, legittimita: s.legitimacy, fervore: s.order.fervour,
        milizia: s.order.milizia,
        traffic: s.economy.traffic, unemployment: s.economy.unemployment, population: s.economy.population
      };
    };
    Eng.resourceDeltas = function (s) {
      var cur = Eng.resourceSnapshot(s), p = s.prev || cur, out = {};
      Object.keys(cur).forEach(function (k) { out[k] = cur[k] - (p[k] == null ? cur[k] : p[k]); });
      out.cur = cur;
      return out;
    };

    /* ==========================================================
       卡牌
       ========================================================== */
    /* ---------------------------------------------------------------
       Card resolution
       Applies the card cost, the chosen option effect (or the card's own
       effect when it has no options), then discards the card and starts
       its cooldown. Shared by PLAY_CARD and RESOLVE_CARD_OPTION.
       --------------------------------------------------------------- */
    /* Deduct the card's declared cost. Paid once, the moment the card is
       played, whether or not it opens a choice menu. */
    Eng.payCardCost = function (state, card) {
      if (!card.cost) return;
      if (card.cost.ap) state.ap = Math.max(0, state.ap - card.cost.ap);
      if (card.cost.funds) state.funds = Math.max(0, state.funds - card.cost.funds);
      if (card.cost.arms) state.arms = Math.max(0, state.arms - card.cost.arms);
    };

    /* Discard the card and start its cooldown. Also paid on play: the card is
       spent by being played, not by being resolved. */
    Eng.commitCard = function (state, card) {
      var hi = state.hand.indexOf(card.id);
      if (hi >= 0) state.hand.splice(hi, 1);
      state.discard.push(card.id);
      // A turn is half a month, so a cooldown written in turns is simply a
      // count of half-months. Do not convert to whole months.
      state.eventCooldowns['c_' + card.id] = state.monthIndex + (card.cooldown == null ? 4 : card.cooldown);
      state.log.push({ turn: state.turn, kind: 'card', zh: '打出：' + Core.L(card.name),
        it: Core.L(card.name, 'it') });
    };

    /* Apply the chosen option, or the card's own effect when it has none. */
    Eng.applyCardEffect = function (state, card, option) {
      var src = option || card;
      var eff = null;
      if (src.effect) {
        eff = typeof src.effect === 'function' ? src.effect(state) : src.effect;
        /* Routing keys are actions, not state patches: R.applyEffect silently
           ignores a key it does not know, so anything handled here has to be
           pulled out before the patch is applied. `conveneChambers` was the one
           that mattered — the Charter card set it, nothing consumed it, and the
           Arengo stayed unmounted until the next ADVANCE happened to tick it. */
        if (eff) {
          var patch = Object.assign({}, eff);
          var doArengo = patch.conveneChambers; delete patch.conveneChambers;
          var doElection = patch.runElection; delete patch.runElection;
          var doMunicipal = patch.runMunicipal; delete patch.runMunicipal;
          R.applyEffect(state, patch);
          if (doArengo) R.conveneArengo(state);
          if (doElection) Eng.runElection(state, Core.makeRng(state.seed + 17));
          if (doMunicipal) Eng.runMunicipal(state);
        }
      }
      R.normalizeFactions(state);
      if (option) {
        state.log.push({ turn: state.turn, kind: 'card', zh: '抉择：' + Core.L(option.text),
          it: Core.L(option.text, 'it') });
      }
      /* Hand over to another card's menu. This is how one card routes into
         another (宣传攻势 → 与意大利力量之间的关系), and it deliberately bypasses
         that card's cooldown and its AP cost: the target is not being played from
         hand, it is being opened as the consequence of a choice already paid for.
         Its own `require` gates still apply through cardOptions, so a locked
         option stays locked. The patch is the one computed above — never call an
         effect function twice, it may read state. */
      var target = eff && eff.openCard;
      if (target) {
        if (CARD_BY_ID[target]) state.pendingCard = target;
        else state.log.push({ turn: state.turn, kind: 'card',
          zh: '跳转目标不存在：' + target, it: 'Carta di destinazione inesistente: ' + target });
      }
      /* Report the handover, if any. The caller MUST NOT clear pendingCard
         afterwards when this is set — that is exactly what silently ate the jump
         the first time round. */
      return target && CARD_BY_ID[target] ? target : null;
    };

    /* Cost, effect and discard in one step. Used by the option-less path and
       kept for any caller that wants the whole sequence at once. */
    Eng.settleCard = function (state, card, option) {
      Eng.payCardCost(state, card);
      Eng.commitCard(state, card);
      Eng.applyCardEffect(state, card, option);
    };

    /* The engine only validates availability. The selector simulates the
       chosen action to produce its actual, current-state effect preview. */
    Eng.cardOptions = function (state, card) {
      return (card.options || []).map(function (o) {
        var ok = !o.require || o.require(state);
        return {
          id: o.id, text: o.text, subtitle: o.subtitle,
          enabled: !!ok, reason: ok ? null : (o.requireText || { zh: '条件不满足', it: 'Condizioni non soddisfatte' })
        };
      });
    };

    // Menu availability and execution share the same checks. The stored clock
    // advances once per half-month, including the advisors' global cooldown.
    Eng.advisorCooldown = function (state) {
      return Math.max(0, state.advisors.cooldown - (state.monthIndex - state.advisors.lastAction));
    };
    Eng.canUseAdvisor = function (state, advisor, option) {
      function refused(zh, it) { return { ok: false, reason: { zh: zh, it: it } }; }
      if (!advisor || state.advisors.active.indexOf(advisor.id) < 0) {
        return refused('顾问尚未在任。', 'Il consigliere non è in carica.');
      }
      if (!option || advisor.actions.indexOf(option) < 0) {
        return refused('请选择一项顾问行动。', 'Scegliere una direttiva.');
      }
      if (state.ending || state.currentEvent || state.pendingCard) {
        return refused('请先处理当前待决事项。', 'Risolvere prima la decisione in sospeso.');
      }
      if (state.ap < 1) return refused('行动力不足，需要 1 AP。', 'Servono 1 PA.');
      var cooldown = Eng.advisorCooldown(state);
      if (cooldown > 0) {
        return refused('顾问团共享冷却，还需 ' + cooldown / 2 + ' 个月。',
          'Raffreddamento condiviso: ancora ' + cooldown / 2 + ' mesi.');
      }
      if (advisor.faction && state.factions[advisor.faction] && state.factions[advisor.faction].dis > 70) {
        return refused('该派系异议过高，顾问拒绝行动。', 'Il consigliere rifiuta: dissenso di corrente troppo alto.');
      }
      if (option.require && !option.require(state)) {
        return { ok: false, reason: option.requireText || { zh: '条件不满足。', it: 'Condizioni non soddisfatte.' } };
      }
      return { ok: true, reason: null };
    };
    Eng.advisorOptions = function (state, advisor) {
      return advisor.actions.map(function (option) {
        var available = Eng.canUseAdvisor(state, advisor, option);
        return { id: option.id, text: option.text, subtitle: option.subtitle,
          enabled: available.ok, reason: available.reason };
      });
    };

    Eng.canPlayCard = function (state, card) {
      if (!card) return { ok: false, reason: { zh: '无此卡牌', it: 'Carta inesistente' } };
      if (card.deck === 'partito' && (card.forces || ['LEG']).indexOf(state.playerForce) < 0) {
        return { ok: false, reason: { zh: '这张党派牌不属于所选政治力量', it: 'Questa carta non appartiene al partito scelto' } };
      }
      if (card.deck === 'governo' && state.cabinet[card.ministry] !== state.playerForce) {
        var m = W.MINISTRIES.filter(function (x) { return x.id === card.ministry; })[0];
        return { ok: false, reason: { zh: '未掌握部委：' + (m ? m.zh : card.ministry), it: 'Ministero non controllato' } };
      }
      if (card.cost && card.cost.ap > state.ap) return { ok: false, reason: { zh: '行动力不足', it: 'PA insufficienti' } };
      if (card.cost && card.cost.funds > state.funds) return { ok: false, reason: { zh: '经费不足', it: 'Cassa insufficiente' } };
      if (card.cost && card.cost.arms > state.arms) return { ok: false, reason: { zh: '军备不足', it: 'Armi insufficienti' } };
      if (card.require && !card.require(state)) return { ok: false, reason: card.requireText || { zh: '条件不满足', it: 'Condizioni non soddisfatte' } };
      /* The cooldown. `commitCard` has always written
         eventCooldowns['c_' + id], but nothing ever read it, so a card could be
         re-fetched with DRAW_CARD the instant it was played and spammed. The
         deck tiles hid that by filtering on other grounds; the dispatcher did
         not. Turns are half-months, so the stored value is a monthIndex. */
      var cd = state.eventCooldowns && state.eventCooldowns['c_' + card.id];
      if (cd != null && cd > state.monthIndex) {
        return { ok: false, reason: { zh: '仍在冷却（还需 ' + (cd - state.monthIndex) + ' 个半回合）', it: 'In ricarica (' + (cd - state.monthIndex) + ' mezzi turni)' } };
      }
      return { ok: true };
    };

    /* The cards a deck can currently offer: in that deck, not already in hand,
       and passing canPlayCard — which is where AP, funds, arms, `require` and
       the cooldown are all enforced. Both the picker (S.decks) and the random
       draw go through this, so the two can never offer different sets. */
    Eng.drawableIn = function (state, deckId) {
      return Cards.filter(function (c) {
        if (c.deck !== deckId) return false;
        if (state.hand.indexOf(c.id) >= 0) return false;
        return Eng.canPlayCard(state, c).ok;
      });
    };

    Eng.availableCards = function (state) {
      return Cards.filter(function (c) {
        if (c.deck === 'partito' && (c.forces || ['LEG']).indexOf(state.playerForce) < 0) return false;
        if (c.deck === 'governo' && state.cabinet[c.ministry] !== state.playerForce) return false;
        if (c.require && !c.require(state)) return false;
        return true;
      });
    };

    Eng.drawCards = function (state, rng) {
      var need = state.handLimit - state.hand.length;
      if (need <= 0) return;
      var pool = Eng.availableCards(state).filter(function (c) {
        return state.hand.indexOf(c.id) < 0 && (state.eventCooldowns['c_' + c.id] || 0) <= state.monthIndex;
      });
      if (pool.length < need) {
        pool = Eng.availableCards(state).filter(function (c) { return state.hand.indexOf(c.id) < 0; });
      }
      if (pool.length < need) pool = Eng.availableCards(state).slice();
      for (var i = 0; i < need && pool.length; i++) {
        var idx = Math.floor(rng() * pool.length);
        var pick = pool.splice(idx, 1)[0];
        state.hand.push(pick.id);
      }
    };

    /* ==========================================================
       事件调度
       ========================================================== */
    function evCondition(evt, state) {
      if (evt.once && state.eventHistory.indexOf(evt.id) >= 0) return false;
      if (!evt.repeatable && state.eventHistory.indexOf(evt.id) >= 0) return false;
      if (evt.cooldown && (state.eventCooldowns[evt.id] || 0) > state.monthIndex) return false;
      if (evt.condition) { try { if (!evt.condition(state)) return false; } catch (e) { return false; } }
      return true;
    }

    Eng.pickEvent = function (state, rng) {
      var dif = W.DIFFICULTIES.filter(function (d) { return d.id === state.difficulty; })[0];
      // 1. Super-events (Bloody Christmas / coup): condition-driven, highest priority
      for (var si = 0; si < Events.length; si++) {
        var se = Events[si];
        if (!se.superEvent) continue;
        if (evCondition(se, state)) return se;
      }
      // 2. Queued events
      while (state.eventQueue.length) {
        var qid = state.eventQueue.shift();
        var qe = EVENT_BY_ID[qid];
        if (qe) return qe;
      }
      /* 3 + 4. Dated and conditional events, ordered by the difficulty's
         `dateRule` (see the table in data/world.js). Two passes:
           pass A — events that CARRY a date
           pass B — events that do NOT carry a date
         'forced'        史实: a dated event is forced into its own month, and the
                         date outranks the condition's timing; an event that also
                         has a condition still needs that condition to pass.
         'conditionFirst' 普通/沙盒: a dated event is scheduled by its condition
                         like any other, with no calendar gate; only events that
                         have a date and NO condition still wait for their month.
         'dateOnly'      dated events are scheduled by month, but only the ones
                         without a condition (the conditioned ones fall through to
                         pass B, which has no calendar gate). */
      var rule = dif && dif.dateRule;
      /* 2b. Crisis milestones in non-historical modes. A `crisis` event is
         scheduled by its own gauge threshold, not by its calendar month; the
         historical date stays in force under `dateRule: 'forced'`. Sorting by
         threshold keeps the lowest crossed milestone first when one settlement
         crosses several. `evCondition` still enforces once/history/cooldown. */
      if (rule !== 'forced') {
        var gaugeHits = [];
        for (var gi = 0; gi < Events.length; gi++) {
          var ge = Events[gi];
          if (!ge.crisis) continue;
          /* Repeatable crisis events (street violence) are ambient: their own
             condition schedules them in the conditional pass, and letting them
             into this pass would let the 50 milestone preempt the 75 one. */
          if (ge.repeatable) continue;
          if ((state.order[ge.crisis.axis] || 0) < ge.crisis.at) continue;
          if (!evCondition(ge, state)) continue;
          gaugeHits.push(ge);
        }
        if (gaugeHits.length) {
          gaugeHits.sort(function (a, b) { return a.crisis.at - b.crisis.at; });
          return gaugeHits[0];
        }
      }
      var datedPass = [];
      var condPass = [];
      for (var i = 0; i < Events.length; i++) {
        var e = Events[i];
        if (e.superEvent || e.chain) continue;
        if (e.date) datedPass.push(e); else condPass.push(e);
      }
      function inMonth(ev, st) {
        return ev.date.y === st.date.y && ev.date.m === st.date.m &&
          (!ev.date.d || st.date.d >= ev.date.d);
      }
      if (rule === 'forced') {
        // A. the month's dated events, in calendar order
        for (var a1 = 0; a1 < datedPass.length; a1++) {
          if (!inMonth(datedPass[a1], state)) continue;
          if (!evCondition(datedPass[a1], state)) continue;
          return datedPass[a1];
        }
        // B. everything else that has no date
        for (var a2 = 0; a2 < condPass.length; a2++) {
          if (evCondition(condPass[a2], state)) return condPass[a2];
        }
      } else if (rule === 'conditionFirst') {
        /* 普通 / 沙盒 (读法 B): the calendar is a GATE, the condition is the
           trigger. An event that carries both a date and a condition can only be
           scheduled once its own month has arrived, and then only if its condition
           passes — so it may be skipped entirely and never come back, which is
           exactly what 史实 cannot do (there the date forces it through).
           An event with a date and NO condition is still simply due that month. */
        for (var b1 = 0; b1 < datedPass.length; b1++) {
          if (!inMonth(datedPass[b1], state)) continue;   // 日期是闸门：未到不触发
          if (!evCondition(datedPass[b1], state)) continue;
          return datedPass[b1];
        }
        for (var b2 = 0; b2 < condPass.length; b2++) {
          if (evCondition(condPass[b2], state)) return condPass[b2];
        }
      } else {
        // 'dateOnly' (and any difficulty that declares no dateRule): month first,
        // but only for the events that have a date and no condition
        for (var c1 = 0; c1 < datedPass.length; c1++) {
          if (datedPass[c1].condition) continue;
          if (!inMonth(datedPass[c1], state)) continue;
          if (!evCondition(datedPass[c1], state)) continue;
          return datedPass[c1];
        }
        for (var c2 = 0; c2 < condPass.length; c2++) {
          if (evCondition(condPass[c2], state)) return condPass[c2];
        }
        for (var c3 = 0; c3 < datedPass.length; c3++) {
          if (!datedPass[c3].condition) continue;
          if (!evCondition(datedPass[c3], state)) continue;
          return datedPass[c3];
        }
      }
      return null;
    };

    Eng.pushEvent = function (state, id) {
      if (EVENT_BY_ID[id] && state.eventQueue.indexOf(id) < 0) state.eventQueue.push(id);
    };

    /* Sandbox edits share one catalogue with the menu. Only these numeric
       fields can be written; derived readings and narrative internals stay out. */
    Eng.sandboxFields = function (state) {
      var fields = [];
      function field(group, path, zh, it, min, max, step, unit) {
        fields.push({ group: group, path: path, zh: zh, it: it,
          min: min, max: max, step: step == null ? 1 : step, unit: unit || '',
          integer: path.indexOf('laws.') === 0 || ['ap', 'handLimit', 'arms', 'order.milizia',
            'order.police', 'order.carabinieri', 'economy.population'].indexOf(path) >= 0 });
      }
      field('resources', 'funds', '金库', 'Cassa', 0, 1000000000, 100, 'K£');
      field('resources', 'arms', '军备', 'Armamenti', 0, 10000000, 100);
      field('resources', 'ap', '本回合行动点', 'PA del turno', 0, 999, 1, 'AP');
      field('resources', 'handLimit', '手牌槽位', 'Spazi nella mano', Math.max(1, state.hand.length), 30);
      [['authority', '领袖权威', 'Autorità'], ['garrison', '意大利军队立场', 'Atteggiamento dell’esercito'],
       ['fervour', '民众热忱', 'Fervore'], ['squadre', '法西斯小队', 'Squadre fasciste'],
       ['violence', '政治暴力', 'Violenza politica'], ['coup', '围攻压力', 'Pressione dell’assedio'],
       ['subversion', '阴谋压力', 'Pressione fascista']].forEach(function (x) {
        field('resources', 'order.' + x[0], x[1], x[2], 0, 100);
      });
      [['milizia', '军团兵力', 'Legionari'], ['police', '市警人数', 'Polizia municipale'],
       ['carabinieri', '皇家宪兵人数', 'Carabinieri']].forEach(function (x) {
        field('resources', 'order.' + x[0], x[1], x[2], 0, 10000000, 100);
      });
      [['traffic', '港口吞吐', 'Traffico del porto'], ['hinterland', '腹地通达', 'Accesso all’entroterra'],
       ['delta', '三角洲控制', 'Controllo del Delta'], ['works', '港口工程', 'Lavori portuali'],
       ['recognition', '国际承认', 'Riconoscimento internazionale'], ['strike', '罢工强度', 'Scioperi'],
       ['capitalConfidence', '资本信心', 'Fiducia dei capitali']].forEach(function (x) {
        field('economy', 'economy.' + x[0], x[1], x[2], 0, 100);
      });
      field('economy', 'economy.unemployment', '失业率', 'Disoccupazione', 0, 70, 0.5, '%');
      field('economy', 'economy.inflation', '通胀率', 'Inflazione', 0, 90, 0.5, '%');
      field('economy', 'economy.population', '人口', 'Popolazione', 1, 10000000, 1000);
      field('economy', 'economy.debt', '债务', 'Debito', 0, 1000000000, 100, 'K£');
      field('economy', 'economy.arrears', '欠薪', 'Arretrati', 0, 1000000000, 100, 'K£');
      W.DIPLO_ACTORS.forEach(function (x) { field('relations', 'diplo.' + x.id, x.zh, x.it, 0, 100, 5); });
      W.FORZE.filter(function (x) { return W.forzaExists(state, x.id); }).forEach(function (x) {
        field('relations', 'forze.' + x.id, x.zh, x.it, -40, 100, 5);
      });
      W.FACTIONS.forEach(function (x) {
        field('politics', 'factions.' + x.id + '.inf', x.zh + ' · 影响力', x.it + ' · Influenza', 0, 100);
        field('politics', 'factions.' + x.id + '.dis', x.zh + ' · 异议', x.it + ' · Dissenso', 0, 100);
      });
      W.CLASSES.forEach(function (x) {
        W.PARTIES.forEach(function (p) {
          field('politics', 'classes.' + x.id + '.support.' + p.id,
            x.zh + ' · ' + p.zh, x.it + ' · ' + p.it, 0, 100);
        });
        field('politics', 'classes.' + x.id + '.turnout', x.zh + ' · 投票率', x.it + ' · Affluenza', 0, 100);
      });
      W.LAWS.forEach(function (x) { field('laws', 'laws.' + x.id, x.zh, x.it, 0, x.max); });
      return fields;
    };

    Eng.sandboxEvents = function () { return Events.filter(function (e) { return !e.chain; }); };
    Eng.applySandbox = function (state, action) {
      function refuse(zh, it) { return { state: state, toast: { kind: 'warn', text: { zh: zh, it: it } } }; }
      if (state.difficulty !== 'sandbox' || state.ending)
        return refuse('仅限进行中的沙盒对局。', 'Disponibile solo in una partita Sandbox in corso.');
      var next = Core.deepClone(state);
      if (action.type === 'SANDBOX_EDIT') {
        var spec = Eng.sandboxFields(state).filter(function (x) { return x.path === action.path; })[0];
        if (!spec || typeof action.value !== 'number' || !Number.isFinite(action.value))
          return refuse('请选择有效的数值字段。', 'Scegliere un campo numerico valido.');
        var value = clamp(action.value, spec.min, spec.max), parts = spec.path.split('.');
        if (spec.integer) value = Math.round(value);
        if (parts[0] === 'factions' && parts[2] === 'inf') {
          R.adjustFactionInfluence(next, parts[1], value - next.factions[parts[1]].inf);
        } else if (parts[0] === 'classes' && parts[2] === 'support') {
          var row = next.classes[parts[1]].support, party = parts[3];
          // At 100% there are no proportional donors/receivers. Distribute the
          // released share equally through the normal directed-transfer helper.
          if (row[party] >= 100 - 1e-9 && value < row[party]) {
            var others = W.PARTIES.filter(function (p) { return p.id !== party; });
            var released = (row[party] - value) / others.length;
            others.forEach(function (p) { R.defectSupport(next, parts[1], party, p.id, released); });
          } else R.shiftClassSupport(next, parts[1], party, value - row[party]);
        } else {
          var obj = next;
          parts.slice(0, -1).forEach(function (p) { obj = obj[p]; });
          obj[parts[parts.length - 1]] = value;
        }
      } else if (action.type === 'SANDBOX_CLEAR_COOLDOWNS') {
        Object.keys(next.eventCooldowns).forEach(function (id) {
          if (id.indexOf('c_') === 0) delete next.eventCooldowns[id];
        });
        next.advisors.lastAction = -99;
      } else if (action.type === 'SANDBOX_ADD_CARD') {
        if (!CARD_BY_ID[action.cardId] || next.hand.indexOf(action.cardId) >= 0 || next.hand.length >= next.handLimit)
          return refuse('卡牌不存在、已在手中或没有空余槽位。', 'Carta inesistente, già in mano o senza spazio disponibile.');
        next.hand.push(action.cardId);
      } else if (action.type === 'SANDBOX_EVENT') {
        var event = Eng.sandboxEvents().filter(function (e) { return e.id === action.eventId; })[0];
        if (!event || next.currentEvent === event.id || next.eventQueue.indexOf(event.id) >= 0)
          return refuse('事件不可手动触发，或已经在处理中。', 'Evento non disponibile o già in corso.');
        if (next.currentEvent || next.pendingCard) Eng.pushEvent(next, event.id);
        else { next.currentEvent = event.id; next.phase = 'event'; }
      } else return refuse('未知的沙盒操作。', 'Comando Sandbox sconosciuto.');
      // These edits cost no AP and never consume RNG or advance the calendar.
      Eng.postProcess(next);
      return { state: next, toast: null };
    };

    /* ==========================================================
       行动路由
       ========================================================== */
    Eng.dispatch = function (state, action) {
      if (typeof action.type === 'string' && action.type.indexOf('SANDBOX_') === 0)
        return Eng.applySandbox(state, action);
      var next = Core.deepClone(state);
      var rng = Core.makeRng(next.seed + next.turn * 7919 + (next.rngTick = (next.rngTick || 0) + 1));
      var result = { state: next, toast: null };

      switch (action.type) {
        /* ---------- Draw from a deck into a free reserved slot ---------- */
        /* By id: the picker path, used by sandbox (and by the UI when the player
           is allowed to choose). `deck` instead of `cardId` draws a RANDOM card
           from that deck — see DRAW_RANDOM below, which is what the ordinary
           difficulties use. */
        case 'DRAW_CARD': {
          var dc = CARD_BY_ID[action.cardId];
          if (!dc) { result.toast = { kind: 'warn', text: 'No such card' }; break; }
          if (next.hand.length >= next.handLimit) {
            result.toast = { kind: 'warn', text: Core.L({ zh: '预留处已满', it: 'Slot esauriti' }) };
            break;
          }
          if (next.hand.indexOf(dc.id) >= 0) break;
          var dchk = Eng.canPlayCard(next, dc);
          if (!dchk.ok) { result.toast = { kind: 'warn', text: Core.L(dchk.reason) }; return { state: state, toast: result.toast }; }
          next.hand.push(dc.id);
          break;
        }

        /* ---------- Draw a random card from a deck ---------- */
        /* The ordinary mode: the player picks a DECK, not a card. Candidates are
           exactly the cards the picker would have offered — not in hand and
           passing canPlayCard, which is where the cooldown gate lives, so a card
           on cooldown can never come up. The pick uses the dispatcher's seeded
           rng, so a run stays reproducible from its seed. */
        case 'DRAW_RANDOM': {
          if (next.hand.length >= next.handLimit) {
            result.toast = { kind: 'warn', text: Core.L({ zh: '预留处已满', it: 'Slot esauriti' }) };
            break;
          }
          var pool = Eng.drawableIn(next, action.deck);
          if (!pool.length) {
            result.toast = { kind: 'warn', text: Core.L({ zh: '这个牌堆暂时没有可抽的牌', it: 'Nessuna carta disponibile in questo mazzo' }) };
            break;
          }
          var picked = pool[Math.floor(rng() * pool.length) % pool.length];
          next.hand.push(picked.id);
          break;
        }

        /* ---------- Discard a reserved card without playing it ---------- */
        case 'DISCARD_CARD': {
          var hi2 = next.hand.indexOf(action.cardId);
          if (hi2 >= 0) { next.hand.splice(hi2, 1); next.discard.push(action.cardId); }
          break;
        }

        /* ---------- Play a card ---------- */
        case 'PLAY_CARD': {
          var card = CARD_BY_ID[action.cardId];
          var chk = Eng.canPlayCard(next, card);
          if (!chk.ok) { result.toast = { kind: 'warn', text: Core.L(chk.reason) }; return { state: state, toast: result.toast }; }
          // The cost is paid and the card discarded the instant it is played.
          // If it opens a choice menu, that menu must then be answered: there
          // is no backing out. This is how the reference project settles a
          // card, and it is why the menu carries no cancel button.
          Eng.payCardCost(next, card);
          Eng.commitCard(next, card);
          if (card.options && card.options.length) {
            next.pendingCard = card.id;
          } else {
            Eng.applyCardEffect(next, card, null);
          }
          break;
        }

        /* ---------- Resolve the card's choice ---------- */
        case 'RESOLVE_CARD_OPTION': {
          var pc = next.pendingCard ? CARD_BY_ID[next.pendingCard] : null;
          if (!pc) { result.toast = { kind: 'warn', text: 'No card awaiting a choice' }; break; }
          var opts = Eng.cardOptions(next, pc);
          var chosen = null;
          opts.forEach(function (o) { if (o.id === action.optionId) chosen = o; });
          if (!chosen || !chosen.enabled) {
            result.toast = { kind: 'warn', text: Core.L((chosen && chosen.reason) || { zh: '该选项不可用', it: 'Opzione non disponibile' }) };
            break;
          }
          /* `chosen` is the view model from cardOptions — it carries id, text,
             subtitle, enabled and reason, but NOT the effect. Handing
             it to applyCardEffect meant src.effect was always undefined, so every
             multi-option card in the game resolved as a no-op. The authored
             option is looked up fresh from the card and that is what gets
             applied; the view model is only used for the enabled check above. */
          var authored = null;
          (pc.options || []).forEach(function (o) { if (o.id === chosen.id) authored = o; });
          if (!authored) { result.toast = { kind: 'warn', text: 'No such option' }; break; }
          // Cost and discard already happened at play time; only the effect remains.
          // applyCardEffect returns a card id when this choice hands over to
          // another card's menu (`openCard`); in that case the new pendingCard
          // must survive, or the handover is lost.
          var jumped = Eng.applyCardEffect(next, pc, authored);
          next.pendingCard = jumped || null;
          break;
        }

        /* ---------- Resolve an event ---------- */
        case 'RESOLVE_EVENT': {
          var ev = next.currentEvent ? EVENT_BY_ID[next.currentEvent] : null;
          if (!ev) { result.toast = { kind: 'warn', text: '无当前事件' }; break; }
          var opt = null;
          ev.options.forEach(function (op) { if (op.id === action.optionId) opt = op; });
          if (!opt) break;
          // The authoring object is shared by every run. Remove routing keys
          // from a copy, otherwise resolving once erases `next` for later games.
          var patch = Object.assign({}, (typeof opt.effect === 'function' ? opt.effect(next) : opt.effect) || {});
          var nextEvt = patch.next || null;
          var queued = patch.queueEvents || patch.queue || [];
          delete patch.next; delete patch.queueEvents; delete patch.queue;
          var forced = patch.forceEnding; delete patch.forceEnding;
          var doElection = patch.runElection; delete patch.runElection;
          var doMunicipal = patch.runMunicipal; delete patch.runMunicipal;
          var doArengo = patch.conveneChambers; delete patch.conveneChambers;
          var forcedCheck = patch.forceEndingCheck; delete patch.forceEndingCheck;
          var phaseSet = patch.phase; delete patch.phase;

          R.applyEffect(next, patch);
          R.normalizeFactions(next);
          next.eventHistory.push(ev.id);
          if (ev.cooldown) next.eventCooldowns[ev.id] = next.monthIndex + ev.cooldown;
          next.log.push({ turn: next.turn, kind: 'event', zh: ev.title.zh + ' → ' + Core.L(opt.text), it: ev.title.it });

          if (doElection) Eng.runElection(next, rng);
          if (doMunicipal) Eng.runMunicipal(next);
          if (doArengo) R.conveneArengo(next);
          queued.forEach(function (q) { Eng.pushEvent(next, q); });
          if (phaseSet) next.phase = phaseSet;
          if (forced) { next.currentEvent = null; next.ending = forced; next.phase = 'ended'; break; }

          if (nextEvt) { next.currentEvent = nextEvt; }
          else {
            next.currentEvent = null;
            var nxt = Eng.pickEvent(next, rng);
            if (nxt) next.currentEvent = nxt.id; else next.phase = 'action';
          }
          if (forcedCheck || next.currentEvent === null) Eng.checkEnd(next);
          break;
        }

        /* ---------- Advance ---------- */
        case 'ADVANCE': {
          if (next.currentEvent) { result.toast = { kind: 'warn', text: Core.L({ zh: '必须先处理当前事件', it: 'Risolvere prima l\'evento' }) }; break; }
          Eng.advanceWeek(next, rng);
          break;
        }

        /* ---------- Diplomatic posture ---------- */
        case 'SET_POSTURE': {
          if (next.ap < 0) break;
          next.posture = action.posture;
          next.log.push({ turn: next.turn, kind: 'diplo', zh: '外交姿态调整为「' + Core.L(W.POSTURES.filter(function (p) { return p.id === action.posture; })[0] || {}) + '」', it: 'Postura diplomatica aggiornata' });
          break;
        }

        /* ---------- Advisors ---------- */
        case 'HIRE_ADVISOR': {
          var adv = W.ADVISORS.filter(function (a) { return a.id === action.advisorId; })[0];
          if (!adv) break;
          if (adv.require && !adv.require(next)) { result.toast = { kind: 'warn', text: Core.L({ zh: '条件不满足', it: 'Condizioni non soddisfatte' }) }; break; }
          if (next.advisors.active.indexOf(adv.id) >= 0) break;
          if (next.advisors.active.length >= 3) { result.toast = { kind: 'warn', text: Core.L({ zh: '最多三位在任顾问', it: 'Massimo tre consiglieri' }) }; break; }
          next.advisors.active.push(adv.id);
          if (adv.faction && next.factions[adv.faction]) next.factions[adv.faction].dis = clamp(next.factions[adv.faction].dis - 5, 0, 100);
          next.log.push({ turn: next.turn, kind: 'advisor', zh: '任命顾问：' + adv.zh, it: 'Nominato: ' + adv.it });
          break;
        }
        case 'FIRE_ADVISOR': {
          var i2 = next.advisors.active.indexOf(action.advisorId);
          if (i2 >= 0) next.advisors.active.splice(i2, 1);
          break;
        }
        case 'USE_ADVISOR': {
          var adv2 = W.ADVISORS.filter(function (a) { return a.id === action.advisorId; })[0];
          var directive = adv2 && adv2.actions.filter(function (o) { return o.id === action.optionId; })[0];
          var available = Eng.canUseAdvisor(next, adv2, directive);
          if (!available.ok) { result.toast = { kind: 'warn', text: Core.L(available.reason) }; break; }
          var ae = typeof directive.effect === 'function' ? directive.effect(Core.deepClone(next)) : directive.effect;
          next.ap -= 1;
          next.advisors.lastAction = next.monthIndex;
          R.applyEffect(next, ae);
          R.normalizeFactions(next);
          next.log.push({ turn: next.turn, kind: 'advisor', zh: adv2.zh + '：' + directive.text.zh, it: adv2.it + ': ' + directive.text.it });
          result.toast = { kind: 'ok', text: Core.L(adv2) + ' — ' + Core.L(directive.text) };
          break;
        }

        /* ---------- Tax rates ---------- */
        case 'SET_TAX': {
          var key = action.tax, val = clamp(action.value, 0, 0.9);
          next.taxRates[key] = val;
          break;
        }

        /* ---------- Load a save ---------- */
        case 'LOAD_STATE': {
          var loaded = Core.deepClone(action.state);
          Eng.postProcess(loaded);
          return { state: loaded, toast: { kind: 'ok', text: Core.L({ zh: '存档已载入', it: 'Partita caricata' }) } };
        }

        default: break;
      }

      // Single post-processing pipeline
      Eng.postProcess(next);
      return result;
    };

    /* ==========================================================
       统一后处理（不变量）
       ========================================================== */
    Eng.postProcess = function (s) {
      var o = s.order;
      ['authority', 'garrison', 'fervour', 'squadre', 'violence'].forEach(function (k) { o[k] = clamp(o[k], 0, 100); });
      o.coup = clamp(o.coup || 0, 0, W.CRISIS_MAX);
      o.subversion = clamp(o.subversion || 0, 0, W.CRISIS_MAX);
      o.milizia = Math.max(0, o.milizia);
      /* The two crisis axes are read from four places, and all four have to share
         the 0–CRISIS_MAX range or the gauge and its own trend line disagree:
         `order` is the live value, `prev` the turn-start snapshot, `series` the
         history the chart plots, and `*Milestones` the markers. A save written
         before the range was unified carries 0–140 in all of them, so clamp each
         in place rather than only the live one. */
      ['coup', 'subversion'].forEach(function (axis) {
        if (s.prev && isFinite(s.prev[axis])) s.prev[axis] = clamp(s.prev[axis], 0, W.CRISIS_MAX);
        if (s.series && Array.isArray(s.series[axis])) {
          s.series[axis] = s.series[axis].map(function (v) {
            return isFinite(v) ? clamp(v, 0, W.CRISIS_MAX) : v;
          });
        }
        /* The milestone list can name a threshold above the ceiling, which would
           leave a step the gauge can never reach. */
        if (Array.isArray(o[axis + 'Milestones'])) {
          o[axis + 'Milestones'] = o[axis + 'Milestones'].filter(function (id) {
            var n = parseInt(String(id).replace(/[^0-9]/g, ''), 10);
            return !isFinite(n) || n <= W.CRISIS_MAX;
          });
        }
      });
      // Old saves carried two extra headcounts. The armed Legion is now the
      // single canonical value used by the UI, elections and effects.
      delete s.militants;
      delete o.legionari;
      delete o.civicGuard;
      delete s.laws.statuto;
      /* Diplomatic actors are a closed list in W.DIPLO_ACTORS. Old saves — and
         effects written before the Soviet actor was renamed — can carry keys
         that no longer name an actor (Hungary, the Vatican, `comintern`); drop
         them so neither the diplomacy panel nor its previews can show ghosts. */
      if (s.diplo) {
        var knownDiplo = {};
        W.DIPLO_ACTORS.forEach(function (a) { knownDiplo[a.id] = true; });
        Object.keys(s.diplo).forEach(function (k) { if (!knownDiplo[k]) delete s.diplo[k]; });
      }
      if (s.journals) delete s.journals.guardia;
      if (s.monotonic) { delete s.monotonic.guardCreated; delete s.monotonic.guardDissolved; }
      /* Seats are keyed by advisor id, and the roster is data that can lose an
         entry between builds. A save holding a retired id would show two
         advisors while the counter claims three, with no way to free the seat:
         the panel only renders advisors that still exist, and DISMISS_ADVISOR
         looks the id up in the same list. Drop ids that are no longer real. */
      if (s.advisors && Array.isArray(s.advisors.active)) {
        s.advisors.active = s.advisors.active.filter(function (id) {
          return W.ADVISORS.some(function (a) { return a.id === id; });
        });
      }
      /* A charter in force with no councils is not a charter: art. 3 puts the
         Ottimi and the Provvisori in the text itself. Promulgation arrives by
         more than one route (the September 1920 event, the Arengo card, and any
         that come later), so rather than trust each of them to seat the chambers,
         the invariant is enforced here — the one place every entry point runs
         through, old saves included. Idempotent: `arengoTick` seats them once and
         afterwards only reseats the Ottimi when their three-year term lapses. */
      if (s.flags.charter_promulgated) R.arengoTick(s);
      // Legion public opinion is derived here and nowhere else. It replaced the
      // old stored legitimacy: the same number now has a definition the player
      // can read off the class matrix.
      s.legitimacy = clamp(R.legionOpinion(s), 0, 100);
      s.funds = Math.max(0, s.funds);
      s.economy.unemployment = clamp(s.economy.unemployment, 0, 70);
      s.economy.inflation = clamp(s.economy.inflation, 0, 90);
      s.economy.traffic = clamp(s.economy.traffic, 0, 100);
      s.economy.strike = clamp(s.economy.strike, 0, 100);
      s.economy.population = Math.max(0, s.economy.population);
      s.economy.debt = Math.max(0, s.economy.debt);
      s.economy.capitalConfidence = clamp(s.economy.capitalConfidence, 0, 100);
      for (var k in s.diplo) s.diplo[k] = clamp(s.diplo[k], 0, 100);
      W.LAWS.forEach(function (L) { s.laws[L.id] = clamp(s.laws[L.id] || 0, 0, L.max); });
      R.normalizeFactions(s);
      W.CLASSES.forEach(function (c) {
        var row = s.classes[c.id].support;
        var t = Core.sum(row) || 100;
        for (var p in row) row[p] = row[p] * 100 / t;
      });
      W.DISTRICTS.forEach(function (d) {
        var st = s.districts[d.id];
        ['control', 'agitation', 'unemployment', 'ethnicIt', 'ethnicSl'].forEach(function (k) { st[k] = clamp(st[k], 0, 100); });
        if (d.status === 'yugo') st.control = 0;
      });
      // Filter coalition members
      s.coalition.members = s.coalition.members.filter(function (m, i, a) { return a.indexOf(m) === i; });
      // Monotonic flags
      s.monotonic.populationLost = Math.max(s.monotonic.populationLost, 52000 - s.economy.population);
      s.monotonic.electionsHeld = Math.max(s.monotonic.electionsHeld || 0, s.counters.electionsHeld || 0);
      if (s.order.violence > 15) s.monotonic.minViolenceOK = false;
      if (R.factionDissent(s) > 10) s.monotonic.minDissentOK = false;
      if (s.flags.coup_done) s.monotonic.coupHappened = true;
      // A quiet period after Bloody Christmas: the fascist threat needs time to rebuild
      if (s.flags.natale_done && !s.counters.graceUntil) s.counters.graceUntil = s.monthIndex + 5;
      // Achievements (not granted in sandbox)
      if (s.difficulty !== 'sandbox') {
        var got = R.checkAchievements(s);
        got.forEach(function (id) {
          var def = null;
          Meta.ACHIEVEMENTS.forEach(function (a) { if (a.id === id) def = a; });
          s.log.push({ turn: s.turn, kind: 'journal', zh: '成就解锁：' + (def ? def.zh : id), it: 'Obiettivo: ' + (def ? def.it : id) });
        });
      }
      s.order.tension = R.tension(s);
      s.partySupport = R.nationalSupport(s);
    };

    /* ==========================================================
       选举结算
       ========================================================== */
    Eng.runElection = function (s, rng) {
      var res = R.election(s, rng);
      s.assembly = res.seats;
      s.electionDetail = res.detail;
      s.counters.electionsHeld = (s.counters.electionsHeld || 0) + 1;
      s.monotonic.electionsHeld = s.counters.electionsHeld;
      var winner = res.detail.cityWinner;
      if (winner === 'LEG') s.monotonic.electionsWon = (s.monotonic.electionsWon || 0) + 1;
      var total = Core.sum(s.assembly);
      var maj = Math.floor(total / 2) + 1;
      var mine = s.assembly[s.playerForce] || 0;
      if (mine >= maj) {
        s.coalition = { members: [s.playerForce], cohesion: clamp(56 + 0.3 * s.legitimacy, 0, 100), formed: Core.dateKey(s.date) };
      } else {
        s.flags.minority_government = true;
        s.coalition.cohesion = clamp(s.coalition.cohesion - 18, 0, 100);
      }
      // Cabinet formation: distribute the seven Rector seats by seat share
      var order = W.MINISTRIES.map(function (m) { return m.id; });
      var parties = Object.keys(s.assembly).filter(function (p) { return s.assembly[p] > 0; })
        .sort(function (a, b) { return s.assembly[b] - s.assembly[a]; });
      var pool = [];
      parties.forEach(function (p) {
        var n = (p === s.playerForce) ? 4 : Math.max(1, Math.round(s.assembly[p] / 10));
        for (var i = 0; i < n; i++) pool.push(p);
      });
      order.forEach(function (mid, i) { s.cabinet[mid] = pool[i % pool.length] || s.playerForce; });
      if (mine >= maj) { s.cabinet.esteri = s.playerForce; s.cabinet.difesa = s.playerForce; }
      var names = Object.keys(s.assembly).map(function (k) { return k + ' ' + s.assembly[k]; }).join(' · ');
      s.log.push({
        turn: s.turn, kind: 'election',
        zh: '制宪议会选举结果：' + names + '（共 ' + total + ' 席，多数 ' + maj + '）'
          + (s.flags.boycott ? ' · 军团兵抵制了这场选举' : ''),
        it: 'Elezioni della Costituente: ' + names
      });
      return res;
    };

    /* The municipal vote, kept deliberately apart from the general one above.
       runElection also reshuffles the cabinet, reforms the coalition and bumps
       counters.electionsHeld — and that counter is exactly what the `elezioni`
       journal and the forty-seat achievement are waiting on, so a city council
       election in October 1919 must not touch it. This writes the tally and a
       log line, and nothing else. */
    Eng.runMunicipal = function (s) {
      var res = R.municipalElection(s);
      s.municipalDetail = res.detail;
      s.municipalSeats = res.seats;
      var d = res.detail;
      if (d.noElection) {
        s.log.push({ turn: s.turn, kind: 'election',
          zh: '市政厅被直接接管，没有举行选举。',
          it: 'Il Municipio è occupato: nessuna elezione.' });
        return res;
      }
      var names = d.ranked.map(function (p) {
        var nm = W.PARTY_BY_ID[p] || { zh: p };
        return nm.zh + ' ' + res.seats[p];
      }).join(' · ');
      s.log.push({
        turn: s.turn, kind: 'election',
        zh: '市政选举结果：' + names + '（共 ' + d.council + ' 席，投票率 ' + d.turnout + '%'
          + (d.singleList ? ' · 自治派与克罗地亚人弃权' : '') + '）',
        it: 'Elezioni municipali: ' + names
      });
      return res;
    };

    /* ==========================================================
       半月回合；每一回合都运行一次完整结算
       ========================================================== */
    Eng.advanceWeek = function (s, rng) {
      var dif = W.DIFFICULTIES.filter(function (d) { return d.id === s.difficulty; })[0];
      var oldMonth = Core.dateKey(s.date);
      // A turn is half a month: two turns per calendar month, 2 AP each.
      // Every per-turn rate above is halved to match.
      s.date = Core.nextHalfMonth(s.date);
      s.turn += 1;
      // Settlement runs every turn now, not only on a month boundary, so the
      // per-turn rates above are halved to keep the monthly totals unchanged.
      s.monthIndex = (s.monthIndex || 0) + 1;
      s.phase = 'event';

      // 1. Clear the reserved slots. Cards are drawn by hand from the decks,
      //    so nothing is redrawn automatically (mirrors cnt-fai deck handling).
      s.hand.forEach(function (id) { s.discard.push(id); });
      s.hand = [];
      s.ap = dif.ap;
      s.pendingCard = null;

      // Settlement runs every half-month, so this block is unconditional.
      {

      // 2. Revenue and spending
      var rev = R.revenue(s), sp = R.spending(s);
      var net = rev.total - sp.total;
      s.funds = Math.max(0, s.funds + net);
      s.economy.lastRevenue = rev.total;
      if (net >= 0) {
        if (s.economy.debt > 0) {
          var repay = Math.min(s.economy.debt, net * 0.5); s.economy.debt -= repay;
        }
      } else {
        var need = -net;
        // Draw on the krone and lira reserves
        var reserve = s.economy.treasury || 0;
        if (reserve > 0) { var use = Math.min(reserve, need); s.economy.treasury = reserve - use; need -= use; }
        if (need > 0) {
          if (s.economy.debt < 6500) { s.economy.debt += need * 1.15; s.economy.capitalConfidence -= 0.4; }
          else { s.economy.arrears += need; s.order.authority -= 0.8; }
        }
      }

      // 3. Port and economy
      var tt = R.trafficTarget(s);
      s.economy.traffic = Core.approach(s.economy.traffic, tt, 0.09);
      var ut = R.unemploymentTarget(s);
      s.economy.unemployment = Core.approach(s.economy.unemployment, ut, 0.125);
      var it2 = R.inflationTarget(s);
      s.economy.inflation = Core.approach(s.economy.inflation, it2, 0.1);
      s.economy.capitalConfidence = Core.approach(s.economy.capitalConfidence,
        R.confidenceTarget(s), 0.075);

      // 4. Emigration and population
      var em = R.emigration(s);
      s.economy.population = Math.max(30000, s.economy.population - em + 30.0);
      s.counters.emigrants = (s.counters.emigrants || 0) + em;

      // 5. Monthly law effects
      R.applyEffect(s, R.lawMonthly(s));

      /* 5b. The Arengo. Once the Charter is promulgated the two councils exist;
         the Ottimi's three-year term is checked here so a Regency long enough to
         outlast its first council reseats it rather than freezing it. */
      if (s.flags.charter_promulgated) R.arengoTick(s);

      // 6. Economic-to-political feedback (zero-sum)
      var e = s.economy;
      if (e.unemployment > 25) {
        R.shiftClassSupport(s, 'operai', 'PSI', 0.9);
        R.shiftClassSupport(s, 'portuali', 'PSI', 0.8);
        R.shiftClassSupport(s, 'artigiani', 'ANI', 0.7);
        R.shiftClassSupport(s, 'impiegati', 'ANI', 0.5);
      } else if (e.unemployment < 14) {
        R.shiftClassSupport(s, 'operai', 'AUT', 0.7);
        R.shiftClassSupport(s, 'portuali', 'AUT', 0.7);
      }
      if (e.inflation > 16) {
        R.shiftClassSupport(s, 'impiegati', 'ANI', 0.6);
        R.shiftClassSupport(s, 'operai', 'PSI', 0.4);
      }
      if (e.traffic < 26) {
        R.shiftClassSupport(s, 'borghesia', 'PAD', 0.8);
        R.shiftClassSupport(s, 'portuali', 'PSI', 0.4);
      } else if (e.traffic > 55) {
        R.shiftClassSupport(s, 'borghesia', 'AUT', 0.8);
        R.shiftClassSupport(s, 'portuali', 'AUT', 0.5);
        R.shiftClassSupport(s, 'impiegati', 'AUT', 0.4);
      }
      if (s.order.violence > 50) {
        R.shiftClassSupport(s, 'artigiani', 'ANI', 0.8);
        R.shiftClassSupport(s, 'operai', 'PSI', 0.4);
      }

      // 6b. Legionary support erosion: blockade, unpaid wages, and "the poet cannot do sums"
      //     This is the mechanism behind the annexationists' slide from the 1919 landslide.
      //     The two transfer rates below are the single lever on how steep that slide is:
      //     at 0.62/0.20 the Legion reached its support floor inside about a year, which
      //     left the historical April 1921 line unreachable.
      var defectors = ['portuali', 'operai', 'artigiani', 'impiegati', 'borghesia'];
      var ero = 4.0
        + 0.6 * Math.max(0, (25 - e.traffic) / 25)
        - 0.6 * (s.legitimacy / 100)
        - 0.25 * R.charterProgress(s).score
        - 0.11 * s.laws.orario
        - 0.175 * s.laws.lavoro
        - 0.15 * s.laws.lingua;
      if (s.flags.natale_done) ero *= 0.62;
      if (s.flags.accept_rapallo) ero *= 0.5;
      ero = clamp(ero, -0.25, 4.0);
      defectors.forEach(function (cid) {
        R.defectSupport(s, cid, 'LEG', 'AUT', ero * 0.31);
        R.defectSupport(s, cid, 'LEG', 'ANI', ero * 0.10);
      });
      R.shiftClassSupport(s, 'contadini', 'AUT', 0.35);

      // 6c. Class turnout drift. Faction influence is NOT drifted here: every
      // automatic change to faction power has to be attributable to a journal or
      // a law, and the historical fascist growth is now the `impresa` journal's
      // monthly effect (meta.js), where the panel can show it.
      R.updateClasses(s);


      // 9. Journals
      Object.keys(s.journals).forEach(function (jid) {
        var js = s.journals[jid], def = Meta.JOURNAL_BY_ID[jid];
        if (!def || !js.active || js.done || js.failed) return;
        js.months += 1;
        var m = def.monthly ? def.monthly(s) : null;
        if (m) R.applyEffect(s, m);
        if (def.complete && def.complete(s)) {
          js.done = true; js.active = false;
          R.applyEffect(s, def.onComplete ? def.onComplete(s) : null);
          s.log.push({ turn: s.turn, kind: 'journal', zh: '日志完成：' + def.zh, it: 'Diario completato: ' + def.it });
        } else if (def.fail && def.fail(s)) {
          js.failed = true; js.active = false;
          R.applyEffect(s, def.onFail ? def.onFail(s) : null);
          s.log.push({ turn: s.turn, kind: 'journal', zh: '日志失败：' + def.zh, it: 'Diario fallito: ' + def.it });
        }
      });

      // 10. Coalition cohesion and political upkeep
      R.relationDrift(s);
      var ct = R.cohesionTarget(s);
      s.coalition.cohesion = Core.approach(s.coalition.cohesion, ct, 0.15);
      if (s.coalition.cohesion < 25) s.flags.coalition_crisis = true; else delete s.flags.coalition_crisis;

      // 11. Crisis
      var d = R.coupDelta(s, dif.coupMul);
      s.order.coup = clamp(s.order.coup + d, 0, W.CRISIS_MAX);
      R.siegeMilestones(s).forEach(function (m) {
        if (s.order.coup >= m.at && s.order.coupMilestones.indexOf(m.id) < 0) {
          s.order.coupMilestones.push(m.id);
          s.log.push({ turn: s.turn, kind: 'crisis', zh: '事态 ' + m.at + '：' + m.zh, it: m.it });
        }
      });
      /* The second crisis, tracked separately: see R.subversionDelta. */
      var sd = R.subversionDelta(s, dif.coupMul);
      s.order.subversion = clamp(s.order.subversion + sd, 0, W.CRISIS_MAX);
      R.subversionMilestones().forEach(function (m) {
        if (s.order.subversion >= m.at && s.order.subversionMilestones.indexOf(m.id) < 0) {
          s.order.subversionMilestones.push(m.id);
          s.log.push({ turn: s.turn, kind: 'crisis', zh: '党内 ' + m.at + '：' + m.zh, it: m.it });
        }
      });
      // Legionary reinforcement and attrition (short supplies during a siege cost men)
      if (!s.flags.natale_done) {
        /* Recruitment is bounded by what the treasury can actually pay, not by a
           flat figure. A flat +90 caps the Legion near 3 200 over a whole game —
           measured in .analysis/probe_ceiling.js — which makes any design that
           needs a ten-thousand-man column impossible by construction. Scaling
           with revenue keeps the original intent (you cannot feed men you cannot
           pay for) while letting a genuinely rich Regency raise the column the
           1920 march would need: half the turn's take, floored at 60 so an
           early-game Regency still recruits, capped at 900 per turn. The cap is
           deliberately high: the army's own salary bill (0.013 per man per turn,
           so 130 K£ a turn at ten thousand) and the 400 K£ floor below are what
           actually limit the column, not this figure. */
        var rev = s.economy.lastRevenue || 0;
        var recruit = clamp(Math.round(rev * 0.8), 60, 900);
        s.order.milizia += (s.funds > 400 ? recruit : -60);
      } else if (s.factions.arditi.inf > 12) {
        /* After the siege the Legion still recruits, but at half the pre-war
           rate: the arditi are the cadres left, and what they can raise depends
           on the same treasury. A flat +40 here capped the Legion at about
           7 800 no matter how well the Regency was doing, which put any
           ten-thousand-man design out of reach by construction. */
        var rev2 = s.economy.lastRevenue || 0;
        s.order.milizia += clamp(Math.round(rev2 * 0.4), 40, 400);
      } else {
        s.order.milizia -= 30;
      }

      // 12. Diplomatic drift
      var po = W.POSTURES.filter(function (p) { return p.id === s.posture; })[0] || W.POSTURES[1];
      var drift = W.POSTURE_DRIFT[po.id] || {};
      for (var dk in drift) s.diplo[dk] = clamp(s.diplo[dk] + drift[dk], 0, 100);
      // The forces outside Fiume drift on their own: Rome keeps working on the
      // officer corps, and the communist left loses patience with a movement
      // that has not delivered a social programme. The officer corps also reads
      // the size of the Legion, which is the only thing that can raise it.
      if (s.forze) {
        var fdrift = W.FORZA_DRIFT || {};
        for (var fk in fdrift) if (Object.prototype.hasOwnProperty.call(fdrift, fk)) {
          if (s.forze[fk] == null) continue;
          var fDelta = fdrift[fk] + (W.forzaMiliziaDelta ? W.forzaMiliziaDelta(s, fk) : 0);
          s.forze[fk] = clamp(s.forze[fk] + fDelta, -40, 100);
        }
      }
      // Fascist pressure transmitted from Italy
      if (s.date.y > 1922 || (s.date.y === 1922 && s.date.m >= 11)) {
        s.order.squadre = clamp(s.order.squadre + 0.35, 0, 100);
        s.order.garrison = clamp(s.order.garrison - 0.25, 0, 100);
      }

      // 13. District drift
      var dt = R.districtTargets(s);
      W.DISTRICTS.forEach(function (dd) {
        var st = s.districts[dd.id];
        st.control = Core.approach(st.control, dt[dd.id].control, 0.11);
        st.agitation = Core.approach(st.agitation, dt[dd.id].agitation, 0.125);
        st.unemployment = Core.approach(st.unemployment, s.economy.unemployment + (dd.status === 'yugo' ? -4 : 0), 0.1);
      });

      // 14. Counters and cooldowns
      if (s.economy.strike > 40) s.counters.strikes = (s.counters.strikes || 0) + 1;
      if (s.order.violence < 25) s.counters.calmMonths = (s.counters.calmMonths || 0) + 1; else s.counters.calmMonths = 0;
      if (s.flags.exile) s.counters.exileMonths = (s.counters.exileMonths || 0) + 1;
      if (s.flags.stay) s.counters.resistMonths = (s.counters.resistMonths || 0) + 1;
      s.eventQueue = s.eventQueue.filter(function (id) { return !!EVENT_BY_ID[id]; });
      s.pendingCard = null;

      // 15. Monthly bookkeeping
      s.order.tension = R.tension(s);

      // 15b. Trend series (for the sparklines)
      var ser = s.series || (s.series = { traffic: [], unemployment: [], coup: [], legitimacy: [], population: [] });
      ser.traffic.push(Core.round1(s.economy.traffic));
      ser.unemployment.push(Core.round1(s.economy.unemployment));
      ser.coup.push(Core.round1(s.order.coup));
      if (!ser.subversion) ser.subversion = [];
      ser.subversion.push(Core.round1(s.order.subversion || 0));
      ser.legitimacy.push(Core.round1(s.legitimacy));
      ser.population.push(Math.round(s.economy.population));
      ['traffic', 'unemployment', 'coup', 'subversion', 'legitimacy', 'population'].forEach(function (k) {
        if (ser[k].length > 120) ser[k].shift();
      });
      }

      // 16. Next step: draw an event, otherwise enter the action phase
      var ne = Eng.pickEvent(s, rng);
      if (ne) s.currentEvent = ne.id; else { s.currentEvent = null; s.phase = 'action'; }

      // 17. Record the resource snapshot for next turn's delta display
      s.prev = Eng.resourceSnapshot(s);

      Eng.checkEnd(s);
    };

    /* ==========================================================
       结局检查
       ========================================================== */
    Eng.checkEnd = function (s) {
      if (s.ending) return;
      var hardEnd = (s.date.y > W.MAX_END.y) ||
        (s.date.y === W.MAX_END.y && s.date.m >= W.MAX_END.m);
      /* A hard end used to sit here for 1924-03: "16 March 1924, the annexation is
         proclaimed and anyone not in exile reaches the endgame". It existed only
         for `ending_historical`, whose check read `treaty_rome`. That ending is
         now `ending_eviction` and reads `bloody_history` — the 1920 armed eviction
         — so `treaty_rome` no longer selects anything, and the branch settled runs
         at 1924-03 with the catch-all instead. Removing it is what lets a Regency
         that survives to the end of the window reach `ending_fiume_o_morte` at
         1924-12, which is `MAX_END` and the ending's own gate. */
      // Taken over by the fascists without going into exile or staying: settle immediately
      if (s.flags.coup_done && !s.flags.exile && !s.flags.stay) hardEnd = true;
      // An exile movement that lasts twenty-four months comes to a close
      if (s.flags.exile && (s.counters.exileMonths || 0) >= 24) hardEnd = true;
      if (s.flags.stay && (s.counters.resistMonths || 0) >= 24) hardEnd = true;

      /* 条件满足即结算。
         A game does not have to run all the way to MAX_END: the moment a
         substantive ending's own condition is satisfied it is the ending, and
         waiting for a later settlement point could only ever let a *lower*
         priority ending win instead. That mattered concretely — a condition that
         became true long before the first settlement point was simply never
         looked at.
         `ending_timer` is excluded on purpose: it is the catch-all whose check is
         `return true`, so treating it as a trigger would end every game on the
         first turn. It stays what it was — the fallback for reaching MAX_END
         without anything else having happened. */
      if (!hardEnd) {
        for (var i = 0; i < ENDINGS_BY_PRIORITY.length; i++) {
          var hit = false;
          try { hit = !!ENDINGS_BY_PRIORITY[i].check(s); } catch (e) { hit = false; }
          if (hit) { hardEnd = true; break; }
        }
      }

      if (hardEnd) {
        var end = R.resolveEnding(s);
        s.ending = end.id;
        s.endingData = end;
        s.phase = 'ended';
      }
    };

    return Eng;
  });
