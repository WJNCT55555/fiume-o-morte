/* ==========================================================================
   引擎 · selector / read model 与持久化
   UI 只读取这里导出的 view model，不直接推导业务数值。
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core, root.Fiume.World, root.Fiume.Rules, root.Fiume.Engine, root.Fiume.Meta,
    root.Fiume.Cards);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Sel = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this,
  function (Core, W, R, Eng, Meta, Cards) {
    'use strict';
    var S = {};

    S.header = function (st) {
      return {
        date: Core.dateLabel(st.date),
        dateIt: st.date.d + ' ' + Core.monthNameIt(st.date.m) + ' ' + st.date.y,
        turn: st.turn,
        ap: st.ap, maxAp: st.maxAp,
        funds: st.funds, arms: st.arms, militants: st.militants,
        legitimacy: st.legitimacy,
        tension: Math.round(st.order.tension),
        coup: Math.round(st.order.coup),
        phase: st.phase
      };
    };

    /** Era: 12 September 1919, the day of the march, is year I of the Impresa */
    S.eraYear = function (st) {
      var e = W.ERA, years = st.date.y - e.y;
      if (st.date.m < e.m || (st.date.m === e.m && st.date.d < e.d)) years -= 1;
      return Math.max(1, years + 1);
    };

    /** Resource bar: treasury / legitimacy / fervour / militia / industry / pressure */
    S.resources = function (st) {
      var d = Eng.resourceDeltas(st), cur = d.cur;
      var defs = {
        tesoro: { main: (cur.tesoro / 1000).toFixed(2), unit: 'M£', delta: Math.round(d.tesoro) },
        legittimita: { main: Math.round(cur.legittimita).toString(), unit: '', delta: Math.round(d.legittimita) },
        fervore: { main: Math.round(cur.fervore).toString(), unit: '', delta: Math.round(d.fervore) },
        milizia: { main: Core.fmt(cur.milizia), unit: '', delta: Math.round(d.milizia) },
        produzione: { main: Math.round(cur.produzione).toString(), unit: '', delta: Math.round(d.produzione) },
        pressione: { main: Math.round(cur.pressione).toString(), unit: '', delta: Math.round(d.pressione), invert: true }
      };
      return W.RESOURCES.map(function (r) {
        var v = defs[r.id] || { main: '—', unit: '', delta: 0 };
        return { id: r.id, zh: r.zh, it: r.it, icon: r.icon, main: v.main, unit: v.unit,
          delta: v.delta, invert: !!v.invert };
      });
    };

    /* Aggregate support by electoral list, weighted by class population and without a turnout adjustment */
    S.listSupport = function (st, bag) {
      var out = {};
      W.ELECTORAL_LISTS.concat(W.SPLIT_LISTS).forEach(function (L) {
        var v = 0;
        L.members.forEach(function (m) { v += bag[m] || 0; });
        out[L.id] = v;
      });
      return out;
    };

    S.support = function (st) {
      var nat = R.nationalSupport(st);
      var lists = S.listSupport(st, nat);
      var rows = W.PARTIES.map(function (p) {
        var L = W.LIST_BY_ID[W.MEMBER_OF[p.id]];
        return {
          id: p.id, zh: p.zh, it: p.it, short: p.short, color: p.color, camp: p.camp,
          list: W.MEMBER_OF[p.id], listZh: L ? L.zh : p.zh, listColor: L ? L.color : p.color,
          player: p.id === st.playerForce, value: Core.round1(nat[p.id] || 0)
        };
      }).sort(function (a, b) { return b.value - a.value; });

      var classes = W.CLASSES.map(function (c) {
        var cls = st.classes[c.id];
        var top = null;
        W.PARTIES.forEach(function (p) { if (!top || cls.support[p.id] > cls.support[top.id]) top = p; });
        return {
          id: c.id, zh: c.zh, it: c.it, pop: cls.pop, note: Core.L(c.note || {}),
          cityPct: Math.round((c.city || 0) * 100),
          turnout: Core.round1(cls.turnout),
          top: top.id, topColor: top.color, topValue: Core.round1(cls.support[top.id]),
          row: W.PARTIES.map(function (p) { return { id: p.id, color: p.color, v: cls.support[p.id] }; })
            .filter(function (x) { return x.v > 0.4; })
        };
      });
      return { national: rows, classes: classes, lists: lists };
    };

    /* Class support matrix: rows are classes, columns are parties, rendered directly by the UI table */
    S.classMatrix = function (st) {
      var nat = R.nationalSupport(st);
      var cols = W.PARTIES.map(function (p) {
        var L = W.LIST_BY_ID[W.MEMBER_OF[p.id]];
        return { id: p.id, short: p.short, zh: p.zh, it: p.it, color: p.color,
          list: W.MEMBER_OF[p.id], listColor: L ? L.color : p.color, player: p.id === st.playerForce };
      });
      var rows = W.CLASSES.map(function (c) {
        var cls = st.classes[c.id];
        return {
          id: c.id, zh: c.zh, it: c.it, pop: cls.pop, note: Core.L(c.note || {}),
          cityPct: Math.round((c.city || 0) * 100),
          turnout: Core.round1(cls.turnout),
          cells: cols.map(function (col) {
            var v = cls.support[col.id] || 0;
            return { id: col.id, color: col.color, v: Core.round1(v), share: v / 100 };
          })
        };
      });
      var totals = cols.map(function (col) {
        return { id: col.id, color: col.color, v: Core.round1(nat[col.id] || 0) };
      });
      var lists = [];
      var activeLists = st.flags.legion_alone
        ? W.SPLIT_LISTS.concat([W.LIST_BY_ID.AUT, W.LIST_BY_ID.PSI])
        : W.ELECTORAL_LISTS;
      activeLists.forEach(function (L) {
        var v = 0;
        L.members.forEach(function (m) { v += nat[m] || 0; });
        if (v > 0.05) lists.push({ id: L.id, zh: L.zh, it: L.it, color: L.color, v: Core.round1(v) });
      });
      lists.sort(function (a, b) { return b.v - a.v; });
      var turnout = 0;
      W.CLASSES.forEach(function (c) { turnout += st.classes[c.id].pop * st.classes[c.id].turnout / 100; });
      return { cols: cols, rows: rows, totals: totals, lists: lists, turnout: Core.round1(turnout) };
    };

    /* Electoral thresholds: the structural parameters of the 1921 electoral law */
    S.electoralLaw = function () {
      return { total: 76, cityMajority: 51, cityMinority: 17, subMajority: 6, subMinority: 2, threshold: 6 };
    };

    S.economy = function (st) {
      var e = st.economy, rev = R.revenue(st), sp = R.spending(st);
      return {
        traffic: Core.round1(e.traffic), trafficTarget: Core.round1(R.trafficTarget(st)),
        hinterland: Core.round1(e.hinterland), delta: Core.round1(e.delta),
        works: Core.round1(e.works), recognition: Core.round1(e.recognition),
        strike: Core.round1(e.strike),
        unemployment: Core.round1(e.unemployment), inflation: Core.round1(e.inflation),
        population: Math.round(e.population),
        debt: Math.round(e.debt), arrears: Math.round(e.arrears), treasury: Math.round(e.treasury),
        capitalConfidence: Core.round1(e.capitalConfidence),
        revenue: rev, spending: sp,
        net: Core.round1(rev.total - sp.total),
        lastNet: Core.round1(e.lastNet || 0)
      };
    };

    S.crisis = function (st) {
      var o = st.order;
      return {
        authority: Core.round1(o.authority), garrison: Core.round1(o.garrison),
        fervour: Core.round1(o.fervour), squadre: Core.round1(o.squadre),
        violence: Core.round1(o.violence), tension: Core.round1(o.tension),
        coup: Core.round1(o.coup), milestones: o.coupMilestones.slice(),
        milestoneDefs: R.coupMilestones(st),
        milizia: Math.round(o.milizia), civicGuard: Math.round(o.civicGuard),
        police: Math.round(o.police), legionari: Math.round(o.legionari),
        carabinieri: Math.round(o.carabinieri), garrisonTroops: Math.round(o.garrisonTroops),
        produzione: Core.round1(R.produzione(st)), pressione: Core.round1(R.pressione(st))
      };
    };

    /** Aggregated cards and modifiers, shown in the left column as national spirits */
    S.spirits = function (st) {
      var out = [];
      var L = st.laws;
      if (L.statuto >= 1) out.push({ icon: 'column', zh: '《卡尔纳罗宪章》生效', v: '+' + L.statuto * 3 + '% 合法性' });
      if (L.lavoro >= 1) out.push({ icon: 'fasces', zh: '劳动立法', v: '罢工 −' + L.lavoro * 1.4 + '/月' });
      if (L.ordine >= 2) out.push({ icon: 'legittimita', zh: '公民卫队', v: '+' + Math.round(st.order.civicGuard) + ' 人' });
      if (L.portofranco >= 1) out.push({ icon: 'coins', zh: '自由港制度', v: '资本信心 +' + (L.portofranco * 1.2).toFixed(1) + '/月' });
      if (L.lingua >= 1) out.push({ icon: 'star', zh: '双语条例', v: '子市镇支持 +' + (L.lingua * 5) + '%' });
      if (st.flags.international_guarantee) out.push({ icon: 'legittimita', zh: '国际保证', v: '外交压力 −18' });
      if (st.flags.worker_control) out.push({ icon: 'industria', zh: '工人接管工厂', v: '合作社 +' });
      if (st.flags.smuggle) out.push({ icon: 'compass', zh: '边境走私', v: '金库 + / 合法性 −' });
      if (st.flags.fascio_disarmed) out.push({ icon: 'fasces', zh: '法西斯已解除武装', v: '法西斯暴力 −18' });
      if (st.flags.dannunzio_left) out.push({ icon: 'victory', zh: '诗人已离开', v: '热忱 −' });
      if (st.order.milizia > st.order.garrisonTroops) out.push({ icon: 'milizia', zh: '军团兵力超过驻军', v: '可以抵抗' });
      if (st.order.squadre > 50) out.push({ icon: 'flame', zh: '法西斯控制街道', v: '政变风险 +' });
      if (st.economy.inflation > 25) out.push({ icon: 'coins', zh: '阜姆券贬值', v: '通胀 ' + st.economy.inflation.toFixed(0) + '%' });
      return out;
    };

    S.factions = function (st) {
      return {
        list: W.FACTIONS.map(function (f) {
          var x = st.factions[f.id];
          return { id: f.id, zh: f.zh, it: f.it, color: f.color, blurb: f.blurb,
            inf: Core.round1(x.inf), dis: Core.round1(x.dis) };
        }).sort(function (a, b) { return b.inf - a.inf; }),
        dissent: Core.round1(R.factionDissent(st)),
        unity: Core.round1(R.unityEfficiency(st) * 100)
      };
    };

    S.diplo = function (st) {
      return {
        posture: st.posture,
        list: W.DIPLO_ACTORS.map(function (a) {
          return { id: a.id, zh: a.zh, it: a.it, color: a.color, value: Core.round1(st.diplo[a.id] || 0) };
        })
      };
    };

    S.parliament = function (st) {
      var seats = [], total = 0;
      W.PARTIES.forEach(function (p) {
        var n = st.assembly[p.id] || 0;
        if (n > 0) { seats.push({ id: p.id, zh: p.zh, it: p.it, short: p.short, color: p.color, seats: n }); total += n; }
      });
      seats.sort(function (a, b) { return b.seats - a.seats; });
      var majority = Math.floor(total / 2) + 1;
      return {
        seats: seats, total: total, majority: majority,
        hasMajority: (st.assembly[st.playerForce] || 0) >= majority,
        playerSeats: st.assembly[st.playerForce] || 0,
        detail: st.electionDetail,
        founded: total > 0,
        boycotted: !!st.flags.boycott,
        alone: !!st.flags.legion_alone
      };
    };

    S.rettori = function (st) {
      return W.MINISTRIES.map(function (m) {
        var owner = st.cabinet[m.id];
        var p = W.PARTY_BY_ID[owner] || { zh: owner, it: owner, color: '#8A7A5A' };
        return { id: m.id, zh: m.zh, it: m.it, power: m.power, holder: m.holder || '',
          owner: owner, ownerZh: p.zh, ownerIt: p.it, color: p.color, mine: owner === st.playerForce };
      });
    };
    S.cabinet = S.rettori;

    S.laws = function (st) {
      return W.LAWS.map(function (L) {
        var lvl = st.laws[L.id] || 0;
        var stances = W.PARTIES.filter(function (p) { return p.id !== 'LEG'; }).map(function (p) {
          var v = (W.LAW_STANCE[L.id] || {})[p.id] || 0;
          return { id: p.id, zh: p.zh, color: p.color, value: v, label: R.lawStanceLabel(v) };
        });
        return { id: L.id, zh: L.zh, it: L.it, level: lvl, max: L.max, label: L.levels[lvl], stances: stances };
      });
    };

    S.journals = function (st) {
      var out = [];
      Object.keys(st.journals).forEach(function (jid) {
        var js = st.journals[jid], def = Meta.JOURNAL_BY_ID[jid];
        if (!def) return;
        out.push({ id: jid, zh: def.zh, it: def.it, desc: def.desc, active: js.active, done: js.done,
          failed: js.failed, months: js.months });
      });
      return out.sort(function (a, b) { return (b.active ? 1 : 0) - (a.active ? 1 : 0); });
    };

    S.hand = function (st) {
      return st.hand.map(function (id) {
        var c = Eng.CARD_BY_ID[id];
        if (!c) return null;
        var chk = Eng.canPlayCard(st, c);
        var m = c.ministry ? W.MINISTRIES.filter(function (x) { return x.id === c.ministry; })[0] : null;
        return { id: c.id, deck: c.deck, name: c.name, text: c.text, cost: c.cost || {},
          ministry: m ? m.zh : null, playable: chk.ok, reason: chk.ok ? null : chk.reason,
          optionCount: (c.options || []).length };
      }).filter(Boolean);
    };

    /* Three decks. Each entry is one drawable card; the UI shows a deck tile
       per deck and opens a picker listing these. */
    S.decks = function (st) {
      var slotsFree = Math.max(0, st.handLimit - st.hand.length);
      return W.DECKS.map(function (d) {
        var cards = Cards.filter(function (c) {
          return c.deck === d.id && st.hand.indexOf(c.id) < 0 && Eng.canPlayCard(st, c).ok;
        });
        return {
          id: d.id, zh: d.zh, it: d.it, icon: d.icon, color: d.color,
          blurb: d.id === 'partito' && st.playerForce !== 'LEG'
            ? { zh: (W.PARTY_BY_ID[st.playerForce] || W.PARTY_BY_ID.LEG).zh + '的组织与宣传行动。', it: 'Organizzazione e propaganda del partito.' }
            : d.blurb,
          available: cards.length,
          cards: cards.map(function (c) {
            var m = c.ministry ? W.MINISTRIES.filter(function (x) { return x.id === c.ministry; })[0] : null;
            return { id: c.id, name: c.name, text: c.text, cost: c.cost || {},
              ministry: m ? m.zh : null, optionCount: (c.options || []).length };
          })
        };
      }).map(function (d) { d.drawable = slotsFree > 0 && d.available > 0; return d; });
    };

    S.slots = function (st) {
      var out = [];
      for (var i = 0; i < st.handLimit; i++) {
        var id = st.hand[i];
        var c = id ? Eng.CARD_BY_ID[id] : null;
        out.push({ index: i, empty: !c, card: c ? S.hand(st).filter(function (x) { return x.id === id; })[0] : null });
      }
      return out;
    };

    S.advisors = function (st) {
      return W.ADVISORS.map(function (a) {
        var unlocked = a.require ? a.require(st) : true;
        var f = a.faction ? W.FACTIONS.filter(function (x) { return x.id === a.faction; })[0] : null;
        var cdLeft = Math.max(0, st.advisors.cooldown - (st.turn - st.advisors.lastAction));
        var dis = (f && st.factions[f.id]) ? Core.round1(st.factions[f.id].dis) : 0;
        return { id: a.id, zh: a.zh, it: a.it, bio: a.bio, action: a.action,
          faction: a.faction, external: !a.faction,
          factionZh: f ? f.zh : '外部盟友', factionColor: f ? f.color : '#8A8377',
          active: st.advisors.active.indexOf(a.id) >= 0, unlocked: unlocked,
          dissent: dis, cdLeft: cdLeft };
      });
    };

    /* Card choice menu (multi-option cards) */
    S.cardView = function (st) {
      if (!st.pendingCard) return null;
      var c = Eng.CARD_BY_ID[st.pendingCard];
      if (!c) return null;
      return {
        id: c.id, deck: c.deck, name: c.name, text: c.text, cost: c.cost || {},
        ministry: c.ministry || null,
        options: Eng.cardOptions(st, c)
      };
    };

    /* Party relations, as a matrix the assembly tab can render directly. */
    S.relations = function (st) {
      var cols = W.PARTIES.filter(function (p) { return p.id !== st.playerForce; });
      return {
        cols: cols.map(function (p) {
          return { id: p.id, zh: p.zh, short: p.short, color: p.color, camp: p.camp };
        }),
        rows: W.PARTIES.map(function (a) {
          return {
            id: a.id, zh: a.zh, short: a.short, color: a.color,
            player: a.id === st.playerForce,
            cells: cols.map(function (b) {
              var v = R.relationOf(st, a.id, b.id);
              return { id: b.id, v: Core.round1(v), tone: v >= 25 ? 'warm' : v <= -25 ? 'cold' : 'flat' };
            })
          };
        }),
        regard: Core.round1(R.coalitionRegard(st))
      };
    };

    S.districts = function (st) {
      return W.DISTRICTS.map(function (d) {
        var x = st.districts[d.id];
        return { id: d.id, zh: d.zh, it: d.it, status: d.status, note: d.note,
          control: Core.round1(x.control), agitation: Core.round1(x.agitation),
          unemployment: Core.round1(x.unemployment), ethnicIt: Math.round(x.ethnicIt), ethnicSl: Math.round(x.ethnicSl),
          strategic: d.strategic, industry: d.industry, port: d.port };
      });
    };

    S.eventView = function (st) {
      if (!st.currentEvent) return null;
      var ev = Eng.EVENT_BY_ID[st.currentEvent];
      if (!ev) return null;
      var opts = ev.options.map(function (o) {
        var ok = true, reason = null;
        if (o.condition) { try { ok = !!o.condition(st); } catch (e) { ok = false; } }
        if (!ok) reason = o.requireText || { zh: '条件不满足', it: 'Condizioni non soddisfatte' };
        var prev = null;
        try { prev = (typeof o.preview === 'function') ? o.preview(st) : (o.preview || null); } catch (e2) { prev = null; }
        if (prev && !Array.isArray(prev)) prev = [prev];
        return { id: o.id, text: o.text, enabled: ok, reason: reason, preview: prev };
      });
      return { id: ev.id, title: ev.title, body: ev.body, options: opts, superEvent: !!ev.superEvent };
    };

    S.ending = function (st) {
      if (!st.ending) return null;
      var def = Meta.ENDINGS.filter(function (e) { return e.id === st.ending; })[0];
      if (!def) return null;
      var ach = st.achievements.map(function (id) {
        return Meta.ACHIEVEMENTS.filter(function (a) { return a.id === id; })[0];
      }).filter(Boolean);
      return { id: def.id, zh: def.zh, it: def.it, tag: def.tag, body: def.body,
        achievements: ach, turn: st.turn, date: Core.dateLabel(st.date),
        stats: { traffic: Core.round1(st.economy.traffic), population: Math.round(st.economy.population),
                 coup: Core.round1(st.order.coup), legitimacy: Core.round1(st.legitimacy),
                 seats: st.assembly[st.playerForce] || 0 } };
    };

    S.log = function (st) { return st.log.slice(-60).reverse(); };
    S.journalCatalog = function () { return Meta.JOURNALS; };
    S.achievementCatalog = function () { return Meta.ACHIEVEMENTS; };

    /* ==================== Persistence ==================== */
    var KEY = 'fiume_saves_v1';
    S.Save = {
      list: function () {
        try { return JSON.parse(localStorage.getItem(KEY) || '{"auto":null,"slots":[null,null,null,null,null]}'); }
        catch (e) { return { auto: null, slots: [null, null, null, null, null] }; }
      },
      write: function (bag) { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) {} },
      serialize: function (st) {
        var c = Core.deepClone(st);
        c.currentEvent = st.currentEvent;   // 事件以 ID 持久化，读取时经注册表恢复
        return { v: 4, at: Date.now(), label: Core.dateLabel(st.date), state: c };
      },
      save: function (st, slot) {
        var bag = S.Save.list();
        var payload = S.Save.serialize(st);
        if (slot === 'auto') bag.auto = payload; else bag.slots[slot] = payload;
        S.Save.write(bag);
        return true;
      },
      load: function (slot) {
        var bag = S.Save.list();
        var p = slot === 'auto' ? bag.auto : bag.slots[slot];
        if (!p || !p.state) return null;
        try {
          var st = p.state;
          if ((st.version || 0) < 4) {
            var oldTurn = st.turn || 1;
            st.date.d = 12;
            st.monthIndex = Core.monthDiff({ y: 1919, m: 9 }, st.date);
            Object.keys(st.eventCooldowns || {}).forEach(function (k) {
              st.eventCooldowns[k] = st.monthIndex + Math.max(0, st.eventCooldowns[k] - oldTurn);
            });
            if (st.advisors && st.advisors.lastAction > -90) st.advisors.lastAction = st.monthIndex - (oldTurn - st.advisors.lastAction);
            if (st.counters && st.counters.graceUntil) st.counters.graceUntil = st.monthIndex + Math.max(0, st.counters.graceUntil - oldTurn);
            var start = new Date(Date.UTC(1919, 8, 12));
            var current = new Date(Date.UTC(st.date.y, st.date.m - 1, st.date.d));
            st.turn = Math.floor((current - start) / 604800000) + 1;
            st.ap = Math.min(2, st.ap);
            st.maxAp = 2;
            st.version = 4;
          }
          return st;
        } catch (e) { return null; }
      },
      remove: function (slot) {
        var bag = S.Save.list();
        if (slot === 'auto') bag.auto = null; else bag.slots[slot] = null;
        S.Save.write(bag);
      }
    };

    return S;
  });
