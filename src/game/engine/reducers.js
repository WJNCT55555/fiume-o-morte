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
          strike: 8, unemployment: 24, inflation: 8, population: 52000,
          treasury: 0, debt: 1800, arrears: 0, capitalConfidence: 38,
          lastRevenue: 0
        },

        laws: {
          elettorale: 0, lingua: 0, portofranco: 1, cittadinanza: 0,
          ordine: 0, stampa: 1, scuola: 0, dogana: 0, orario: 0, lavoro: 0, fisco: 0
        },

        assembly: {},
        electionDetail: null,
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
        if (eff) R.applyEffect(state, eff);
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
      // 3. Dated events (historical and sandbox difficulties)
      if (dif.dated) {
        for (var i = 0; i < Events.length; i++) {
          var e = Events[i];
          if (!e.date || e.superEvent || e.chain) continue;
          if (e.date.y !== state.date.y || e.date.m !== state.date.m || (e.date.d && state.date.d < e.date.d)) continue;
          if (!evCondition(e, state)) continue;
          return e;
        }
      }
      // 4. Conditional events (chain nodes are never schedulable)
      for (var j = 0; j < Events.length; j++) {
        var c = Events[j];
        if (c.date || c.superEvent || c.chain) continue;
        if (!evCondition(c, state)) continue;
        return c;
      }
      return null;
    };

    Eng.pushEvent = function (state, id) {
      if (EVENT_BY_ID[id] && state.eventQueue.indexOf(id) < 0) state.eventQueue.push(id);
    };

    /* ==========================================================
       行动路由
       ========================================================== */
    Eng.dispatch = function (state, action) {
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
          var forcedCheck = patch.forceEndingCheck; delete patch.forceEndingCheck;
          var phaseSet = patch.phase; delete patch.phase;

          R.applyEffect(next, patch);
          R.normalizeFactions(next);
          next.eventHistory.push(ev.id);
          if (ev.cooldown) next.eventCooldowns[ev.id] = next.monthIndex + ev.cooldown;
          next.log.push({ turn: next.turn, kind: 'event', zh: ev.title.zh + ' → ' + Core.L(opt.text), it: ev.title.it });

          if (doElection) Eng.runElection(next, rng);
          if (doMunicipal) Eng.runMunicipal(next);
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
          if (!adv2 || next.advisors.active.indexOf(adv2.id) < 0) break;
          if (next.ap < 1) { result.toast = { kind: 'warn', text: Core.L({ zh: '行动力不足', it: 'PA insufficienti' }) }; break; }
          var cd = next.advisors.cooldown - (next.monthIndex - next.advisors.lastAction);
          if (next.monthIndex - next.advisors.lastAction < next.advisors.cooldown) {
            result.toast = { kind: 'warn', text: Core.L({ zh: '顾问行动冷却中（还需 ' + cd + ' 个月）', it: 'Consulente in raffreddamento' }) }; break;
          }
          if (adv2.faction && next.factions[adv2.faction] && next.factions[adv2.faction].dis > 70) {
            result.toast = { kind: 'warn', text: Core.L({ zh: '该派系异议过高，顾问拒绝行动', it: 'Il consigliere rifiuta: dissenso di corrente troppo alto' }) }; break;
          }
          next.ap -= 1;
          next.advisors.lastAction = next.monthIndex;
          var ae = typeof adv2.effect === 'function' ? adv2.effect(next) : adv2.effect;
          R.applyEffect(next, ae);
          R.normalizeFactions(next);
          next.log.push({ turn: next.turn, kind: 'advisor', zh: adv2.zh + '：' + adv2.action.zh, it: adv2.it + ': ' + adv2.action.it });
          result.toast = { kind: 'ok', text: adv2.zh + ' — ' + adv2.action.zh };
          break;
        }

        /* ---------- Tax rates ---------- */
        case 'SET_TAX': {
          var key = action.tax, val = clamp(action.value, 0, 0.9);
          next.taxRates[key] = val;
          break;
        }

        /* ---------- Sandbox ---------- */
        case 'SANDBOX_EDIT': {
          if (next.difficulty !== 'sandbox') break;
          var path = action.path.split('.'), obj = next;
          for (var p = 0; p < path.length - 1; p++) obj = obj[path[p]];
          obj[path[path.length - 1]] = action.value;
          break;
        }

        /* ---------- Load a save ---------- */
        case 'LOAD_STATE': { return { state: action.state, toast: { kind: 'ok', text: Core.L({ zh: '存档已载入', it: 'Partita caricata' }) } }; }

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
      o.coup = clamp(o.coup, 0, 140);
      o.subversion = clamp(o.subversion || 0, 0, 140);
      o.milizia = Math.max(0, o.milizia);
      // Old saves carried two extra headcounts. The armed Legion is now the
      // single canonical value used by the UI, elections and effects.
      delete s.militants;
      delete o.legionari;
      delete o.civicGuard;
      delete s.laws.statuto;
      if (s.journals) delete s.journals.guardia;
      if (s.monotonic) { delete s.monotonic.guardCreated; delete s.monotonic.guardDissolved; }
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
      //     This is the mechanism behind the annexationists sliding from a 1919 landslide to 34% in April 1921.
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
        R.defectSupport(s, cid, 'LEG', 'AUT', ero * 0.62);
        R.defectSupport(s, cid, 'LEG', 'ANI', ero * 0.20);
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
      s.order.coup = clamp(s.order.coup + d, 0, 140);
      R.siegeMilestones(s).forEach(function (m) {
        if (s.order.coup >= m.at && s.order.coupMilestones.indexOf(m.id) < 0) {
          s.order.coupMilestones.push(m.id);
          s.log.push({ turn: s.turn, kind: 'crisis', zh: '事态 ' + m.at + '：' + m.zh, it: m.it });
        }
      });
      /* The second crisis, tracked separately: see R.subversionDelta. */
      var sd = R.subversionDelta(s, dif.coupMul);
      s.order.subversion = clamp(s.order.subversion + sd, 0, 140);
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
      var drift = { rome: { italy: 0.8, yugoslavia: -0.6, uk: -0.1, france: -0.1 },
      equidistant: { italy: -0.25, yugoslavia: -0.3, uk: 0.05, france: 0.05 },
      belgrade: { yugoslavia: 0.8, italy: -0.6, league: -0.1 },
      internation: { uk: 0.55, france: 0.55, usa: 0.4, league: 0.7, italy: -0.5, yugoslavia: -0.3 } }[po.id] || {};
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
      // 16 March 1924: the annexation is proclaimed and anyone not in exile reaches the endgame
      if (s.flags.treaty_rome && s.date.y >= 1924 && s.date.m >= 3 && !s.flags.exile) hardEnd = true;
      // Taken over by the fascists without going into exile or staying: settle immediately
      if (s.flags.coup_done && !s.flags.exile && !s.flags.stay) hardEnd = true;
      // An exile movement that lasts twenty-four months comes to a close
      if (s.flags.exile && (s.counters.exileMonths || 0) >= 24) hardEnd = true;
      if (s.flags.stay && (s.counters.resistMonths || 0) >= 24) hardEnd = true;
      if (hardEnd) {
        var end = R.resolveEnding(s);
        s.ending = end.id;
        s.endingData = end;
        s.phase = 'ended';
      }
    };

    return Eng;
  });
