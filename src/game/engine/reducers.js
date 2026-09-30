/* ==========================================================================
   引擎 · 状态构造 / action 路由 / 周回合与月度结算
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
        version: 4,
        scenario: scn.id, difficulty: dif.id,
        seed: seed || 20251005, rngTick: 0,
        date: { y: start.y, m: start.m, d: start.d || 12 },
        turn: 1, phase: 'event', monthIndex: 0,
        playerForce: playerForce,
        ap: dif.ap, maxAp: dif.ap, handLimit: dif.hand,   // handLimit = reserved card slots

        funds: 2400,
        arms: 220,
        militants: 2600,
        legitimacy: 40,
        supportBias: {},

        classes: {}, factions: {}, organizations: {},

        revenueBoost: { porto: 0, dogana: 0, consumo: 0, reddito: 0 },
        taxRates: { porto: 0.60, dogana: 0.50, consumo: 0.45, reddito: 0.0 },

        economy: {
          traffic: 34, hinterland: 20, delta: 14, works: 32, recognition: 26,
          strike: 8, unemployment: 24, inflation: 8, population: 52000,
          treasury: 0, debt: 1800, arrears: 0, capitalConfidence: 38,
          lastRevenue: 0, lastSpending: 0, lastNet: 0
        },

        laws: {
          statuto: 0, elettorale: 0, lingua: 0, portofranco: 1, cittadinanza: 0,
          ordine: 0, stampa: 1, scuola: 0, dogana: 0, lavoro: 0, fisco: 0
        },

        assembly: {},
        electionDetail: null,
        cabinet: {}, coalition: { members: ['LEG'], cohesion: 66, formed: Core.dateKey(start) },
        relations: {},   // symmetric party-to-party regard, -100..+100

        order: {
          authority: 46, garrison: 22, fervour: 92, squadre: 12, violence: 22,
          tension: 0, coup: 8, coupMilestones: [],
          milizia: 2500, civicGuard: 0, police: 120, legionari: 2500, carabinieri: 120, garrisonTroops: 6000
        },

        diplo: {}, posture: 'equidistant',
        districts: {},
        hand: [], discard: [], deckCounts: {},
        currentEvent: null, eventQueue: [], eventHistory: [], eventCooldowns: {},
        pendingCard: null,   // card id awaiting an option choice; null when no card menu is open

        journals: {}, advisors: { roster: [], active: [], lastAction: -99, cooldown: 6 },
        flags: {}, log: [], achievements: [], ending: null,
        counters: { strikes: 0, violenceEvents: 0, emigrants: 0, exileMonths: 0, resistMonths: 0, calmMonths: 0, electionsHeld: 0 },
        monotonic: { populationLost: 0, minViolenceOK: true, minDissentOK: true, coupHappened: false, guardDissolved: false, electionsWon: 0, electionsHeld: 0 },
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
      W.ORGANIZATIONS.forEach(function (o) { s.organizations[o.id] = { active: !!o.active }; });
      W.DIPLO_ACTORS.forEach(function (a) { s.diplo[a.id] = a.init; });
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
      if (sd.milizia != null) { s.order.milizia = sd.milizia; s.order.legionari = sd.milizia; }
      if (sd.exile) { s.flags.exile = true; s.flags.coup_done = true; s.phase = 'exile'; }
      if (sd.contested) s.flags.contested = true;
      if (sd.fascioSplit) s.flags.fascio_enemy = true;
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
        milizia: s.order.milizia, produzione: R.produzione(s), pressione: R.pressione(s),
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
    Eng.settleCard = function (state, card, option) {
      if (card.cost) {
        if (card.cost.ap) state.ap = Math.max(0, state.ap - card.cost.ap);
        if (card.cost.funds) state.funds = Math.max(0, state.funds - card.cost.funds);
        if (card.cost.arms) state.arms = Math.max(0, state.arms - card.cost.arms);
      }
      var src = option || card;
      if (src.effect) {
        var eff = typeof src.effect === 'function' ? src.effect(state) : src.effect;
        if (eff) R.applyEffect(state, eff);
      }
      R.normalizeFactions(state);
      var hi = state.hand.indexOf(card.id);
      if (hi >= 0) state.hand.splice(hi, 1);
      state.discard.push(card.id);
      // A turn is presented to the player as a week, so a cooldown written in
        // weeks is simply a number of turns. Do not convert to months.
        state.eventCooldowns['c_' + card.id] = state.monthIndex + (card.cooldown == null ? 4 : card.cooldown);
      state.log.push({
        turn: state.turn, kind: 'card',
        zh: '打出：' + Core.L(card.name) + (option ? ' — ' + Core.L(option.text) : ''),
        it: Core.L(card.name, 'it') + (option ? ' — ' + Core.L(option.text, 'it') : '')
      });
    };

    /* Option view model for the card choice menu: adds availability and
       the rendered outcome preview. */
    Eng.cardOptions = function (state, card) {
      return (card.options || []).map(function (o) {
        var ok = !o.require || o.require(state);
        return {
          id: o.id, text: o.text, preview: o.preview || [],
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
      return { ok: true };
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
          result.toast = { kind: 'ok', text: Core.L(dc.name) + Core.L({ zh: ' — 已入预留处', it: ' — in riserva' }) };
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
          // A card with options opens a choice menu first; nothing is spent until the player picks.
          if (card.options && card.options.length) {
            next.pendingCard = card.id;
            break;
          }
          Eng.settleCard(next, card, null);
          result.toast = { kind: 'ok', text: Core.L(card.name) + Core.L({ zh: ' — 已执行', it: ' — eseguita' }) };
          break;
        }

        /* ---------- Card option ---------- */
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
          Eng.settleCard(next, pc, chosen);
          next.pendingCard = null;
          result.toast = { kind: 'ok', text: Core.L(pc.name) + ' — ' + Core.L(chosen.text) };
          break;
        }

        /* ---------- Close the card menu (nothing is settled, nothing is charged) ---------- */
        case 'CANCEL_CARD': {
          next.pendingCard = null;
          break;
        }

        /* ---------- Resolve an event ---------- */
        case 'RESOLVE_EVENT': {
          var ev = next.currentEvent ? EVENT_BY_ID[next.currentEvent] : null;
          if (!ev) { result.toast = { kind: 'warn', text: '无当前事件' }; break; }
          var opt = null;
          ev.options.forEach(function (op) { if (op.id === action.optionId) opt = op; });
          if (!opt) break;
          var patch = typeof opt.effect === 'function' ? opt.effect(next) : opt.effect;
          patch = patch || {};
          var nextEvt = patch.next || null;
          var queued = patch.queueEvents || patch.queue || [];
          delete patch.next; delete patch.queueEvents; delete patch.queue;
          var forced = patch.forceEnding; delete patch.forceEnding;
          var doElection = patch.runElection; delete patch.runElection;
          var forcedCheck = patch.forceEndingCheck; delete patch.forceEndingCheck;
          var phaseSet = patch.phase; delete patch.phase;

          R.applyEffect(next, patch);
          R.normalizeFactions(next);
          next.eventHistory.push(ev.id);
          if (ev.cooldown) next.eventCooldowns[ev.id] = next.monthIndex + ev.cooldown;
          next.log.push({ turn: next.turn, kind: 'event', zh: ev.title.zh + ' → ' + Core.L(opt.text), it: ev.title.it });

          if (doElection) Eng.runElection(next, rng);
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
      o.milizia = Math.max(0, o.milizia);
      o.legionari = o.milizia;
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
      if (s.laws.ordine < 2 && s.monotonic.guardCreated) s.monotonic.guardDissolved = true;
      if (s.order.civicGuard > 0) s.monotonic.guardCreated = true;
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
      s.economy.lastSpending = sp.total;
      s.economy.lastNet = net;
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
        clamp(70 - 0.5 * s.economy.strike + 0.25 * (s.economy.traffic - 40) - 0.3 * s.order.violence + 0.2 * s.legitimacy, 0, 100), 0.075);

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
        - 0.25 * s.laws.statuto
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

      // 6c. Class turnout drift and faction drift
      R.updateClasses(s);
      R.factionDrift(s);

      // 7. Monthly organization effects
      W.ORGANIZATIONS.forEach(function (o) {
        var st = s.organizations[o.id];
        if (!st || !st.active) return;
        if (o.id === 'porto_fed') s.economy.strike = clamp(s.economy.strike - 0.6, 0, 100);
        if (o.id === 'societa') s.funds += 4.0;
        if (o.id === 'reduci') s.order.squadre = clamp(s.order.squadre - 0.5, 0, 100);
        if (o.id === 'contadini') R.shiftClassSupport(s, 'contadini', 'AUT', 0.25);
        if (o.id === 'guardia') s.order.civicGuard = Math.min(1400, s.order.civicGuard + 7.0);
        if (o.id === 'giovine') s.order.fervour = clamp(s.order.fervour + 0.2, 0, 100);
      });


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
      R.coupMilestones(s).forEach(function (m) {
        if (s.order.coup >= m.at && s.order.coupMilestones.indexOf(m.id) < 0) {
          s.order.coupMilestones.push(m.id);
          s.log.push({ turn: s.turn, kind: 'crisis', zh: '事态 ' + m.at + '：' + m.zh, it: m.it });
        }
      });
      // Legionary reinforcement and attrition (short supplies during a siege cost men)
      if (!s.flags.natale_done) {
        s.order.milizia += (s.funds > 400 ? 90 : -60);
      } else if (s.factions.arditi.inf > 12) {
        s.order.milizia += 40;
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
      ser.legitimacy.push(Core.round1(s.legitimacy));
      ser.population.push(Math.round(s.economy.population));
      ['traffic', 'unemployment', 'coup', 'legitimacy', 'population'].forEach(function (k) {
        if (ser[k].length > 120) ser[k].shift();
      });
      }

      // 16. Next step: draw an event, otherwise enter the action phase
      var ne = Eng.pickEvent(s, rng);
      if (ne) s.currentEvent = ne.id; else { s.currentEvent = null; s.phase = 'action'; }

      // 17. Record the resource snapshot for next week's delta display
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
      if (s.flags.coup_done && !s.flags.exile && !s.flags.stay && !s.flags.march_on_rome) hardEnd = true;
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
