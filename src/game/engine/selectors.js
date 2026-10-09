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
        funds: st.funds, arms: st.arms,
        legitimacy: st.legitimacy,
        tension: Math.round(st.order.tension),
        coup: Math.round(st.order.coup),
        subversion: Math.round(st.order.subversion || 0),
        phase: st.phase
      };
    };

    /** Era: 12 September 1919, the day of the march, is year I of the Impresa */
    S.eraYear = function (st) {
      var e = W.ERA, years = st.date.y - e.y;
      if (st.date.m < e.m || (st.date.m === e.m && st.date.d < e.d)) years -= 1;
      return Math.max(1, years + 1);
    };

    /** Resource bar: treasury / legitimacy / fervour / militia */
    S.resources = function (st) {
      var d = Eng.resourceDeltas(st), cur = d.cur;
      var defs = {
        tesoro: { main: (cur.tesoro / 1000).toFixed(2), unit: 'M£', delta: Math.round(d.tesoro) },
        legittimita: { main: Math.round(cur.legittimita).toString(), unit: '', delta: Math.round(d.legittimita) },
        fervore: { main: Math.round(cur.fervore).toString(), unit: '', delta: Math.round(d.fervore) },
        milizia: { main: Core.fmt(cur.milizia), unit: '', delta: Math.round(d.milizia) }
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
          id: c.id, zh: c.zh, it: c.it, pop: cls.pop,
          note: Core.L({ zh: c.note || '', it: c.noteIt || c.note || '' }),
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
          id: c.id, zh: c.zh, it: c.it, pop: cls.pop,
          note: Core.L({ zh: c.note || '', it: c.noteIt || c.note || '' }),
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
        industryActivity: Core.round1(R.industryActivity(st)),
        unemploymentTarget: Core.round1(R.unemploymentTarget(st)),
        inflationTarget: Core.round1(R.inflationTarget(st)),
        confidenceTarget: Core.round1(R.confidenceTarget(st)),
        emigration: R.emigration(st),
        incomeTaxRate: R.incomeTaxRate(st),
        hinterland: Core.round1(e.hinterland), delta: Core.round1(e.delta),
        works: Core.round1(e.works), recognition: Core.round1(e.recognition),
        strike: Core.round1(e.strike),
        unemployment: Core.round1(e.unemployment), inflation: Core.round1(e.inflation),
        population: Math.round(e.population),
        debt: Math.round(e.debt), arrears: Math.round(e.arrears), treasury: Math.round(e.treasury),
        capitalConfidence: Core.round1(e.capitalConfidence),
        revenue: rev, spending: sp,
        net: Core.round1(rev.total - sp.total)
      };
    };

    S.crisis = function (st) {
      var o = st.order;
      return {
        authority: Core.round1(o.authority), garrison: Core.round1(o.garrison),
        fervour: Core.round1(o.fervour), squadre: Core.round1(o.squadre),
        violence: Core.round1(o.violence), tension: Core.round1(o.tension),
        /* Two crises, two gauges. `coup` is the siege (Rome); `subversion` is the
           fascist takeover (the movement's own right wing). */
        coup: Core.round1(o.coup), milestones: o.coupMilestones.slice(),
        milestoneDefs: R.siegeMilestones(st),
        subversion: Core.round1(o.subversion || 0),
        subversionMilestones: (o.subversionMilestones || []).slice(),
        subversionDefs: R.subversionMilestones(),
        milizia: Math.round(o.milizia),
        police: Math.round(o.police),
        carabinieri: Math.round(o.carabinieri)
      };
    };

    /** Active modifiers only. Their amounts come from the same law and economy
        calculations used by half-month settlement; event flags without a
        recurring effect are listed separately as historical markers. */
    S.spirits = function (st) {
      var out = [];
      var L = st.laws;
      var monthly = R.lawMonthly(st);
      function amount(n, digits, unit) {
        var rounded = Number(n.toFixed(digits));
        /* The unit is a {zh, it} node like the label, so the reading follows the
           active language too ("点/半月" / "pt./mezzo mese"). */
        return (rounded > 0 ? '+' : rounded < 0 ? '−' : '') +
          Math.abs(rounded).toFixed(digits) + (unit ? Core.L(unit) : '');
      }
      /* Every label this builds is a bilingual node. The panel prints it through
         Core.L, so a bare Chinese string here shows Chinese in every locale. */
      function effect(zh, it, n, digits, unit) {
        return { zh: zh, it: it, value: amount(n, digits, unit) };
      }
      var LVL = { zh: ' 级', it: ' liv.' };
      function withoutLaw(id) {
        var other = Core.deepClone(st);
        other.laws[id] = 0;
        return other;
      }
      function lawDelta(id, group, key) {
        var baseline = R.lawMonthly(withoutLaw(id));
        return ((monthly[group] || {})[key] || 0) - ((baseline[group] || {})[key] || 0);
      }
      function supportDelta(id, classId, partyId) {
        function sum(patch) {
          return (patch.support || []).reduce(function (total, entry) {
            return total + (entry[0] === classId && entry[1] === partyId ? entry[2] : 0);
          }, 0);
        }
        return sum(monthly) - sum(R.lawMonthly(withoutLaw(id)));
      }
      var PER_HALF = { zh: ' 点/半月', it: ' pt./mezzo mese' };
      var PTS = { zh: ' 点', it: ' pt.' };
      var PT_HALF = { zh: ' 百分点/半月', it: ' pp./mezzo mese' };
      var KE_HALF = { zh: ' K£/半月', it: ' K£/mezzo mese' };
      if (st.flags.charter_promulgated) {
        var charter = R.charterProgress(st);
        out.push({ icon: 'column', zh: '《卡尔纳罗宪章》', it: 'Carta del Carnaro',
          meta: charter.met + '/' + charter.total + Core.L({ zh: ' 项达标', it: ' obiettivi raggiunti' }), effects: [
          effect('围攻压力', 'Pressione dell\'assedio', monthly.order.coup || 0, 2, PER_HALF),
          effect('军团支持流失基数', 'Perdita di base del sostegno', -0.25 * charter.score, 2, PER_HALF)
        ] });
      }
      if (L.orario >= 1) out.push({ icon: 'fasces', zh: '工时立法', it: 'Legge sull\'orario',
        meta: L.orario + Core.L(LVL), effects: [
        effect('罢工强度', 'Intensità degli scioperi', lawDelta('orario', 'economy', 'strike'), 1, PER_HALF),
        effect('失业率', 'Disoccupazione', lawDelta('orario', 'economy', 'unemployment'), 2, PT_HALF),
        effect('资本信心', 'Fiducia del capitale', lawDelta('orario', 'economy', 'capitalConfidence'), 1, PER_HALF)
      ] });
      if (L.lavoro >= 1) {
        var relief = R.spending(st).relief - R.spending(withoutLaw('lavoro')).relief;
        out.push({ icon: 'fasces', zh: '劳动保障', it: 'Tutele del lavoro',
          meta: L.lavoro + Core.L(LVL), effects: [
          effect('罢工强度', 'Intensità degli scioperi', lawDelta('lavoro', 'economy', 'strike'), 1, PER_HALF),
          effect('救济支出', 'Spesa assistenziale', relief, 1, KE_HALF)
        ] });
      }
      if (L.ordine >= 2) out.push({ icon: 'legittimita', zh: '市政警察监督', it: 'Vigilanza sulla polizia',
        meta: L.ordine + Core.L(LVL), effects: [
        effect('法西斯小队', 'Squadre fasciste', lawDelta('ordine', 'order', 'squadre'), 1, PER_HALF),
        effect('领袖权威', 'Autorità del Comandante', lawDelta('ordine', 'order', 'authority'), 1, PER_HALF)
      ] });
      if (L.portofranco >= 1) out.push({ icon: 'coins', zh: '自由港制度', it: 'Regime del porto franco',
        meta: L.portofranco + Core.L(LVL), effects: [
        effect('港口吞吐目标', 'Obiettivo del traffico', R.trafficTarget(st) - R.trafficTarget(withoutLaw('portofranco')), 1, PTS),
        effect('资本信心', 'Fiducia del capitale', lawDelta('portofranco', 'economy', 'capitalConfidence'), 1, PER_HALF)
      ] });
      if (L.lingua >= 1) {
        var langEffects = [effect('南斯拉夫关系', 'Rapporti con la Jugoslavia', lawDelta('lingua', 'diplo', 'yugoslavia'), 1, PER_HALF)];
        if (L.lingua >= 2) langEffects.push(effect('斯拉夫农民·自治党支持',
          'Contadini croati · sostegno autonomista', supportDelta('lingua', 'contadini', 'AUT'), 1, PER_HALF));
        out.push({ icon: 'star', zh: '官方语言制度', it: 'Regime linguistico ufficiale',
          meta: L.lingua + Core.L(LVL), effects: langEffects });
      }
      if (L.scuola >= 1) out.push({ icon: 'star', zh: '双语教育', it: 'Istruzione bilingue',
        meta: L.scuola + Core.L(LVL), effects: [
        effect('斯拉夫农民·军团支持', 'Contadini croati · sostegno alla Legione', supportDelta('scuola', 'contadini', 'LEG'), 2, PER_HALF)
      ] });
      return out;
    };

    S.spiritMarkers = function (st) {
      /* Bilingual nodes: the marker list prints through Core.L. */
      var markers = [
        ['international_guarantee', '国际保证', 'Garanzia internazionale'],
        ['worker_control', '工人接管工厂', 'Operai al controllo delle fabbriche'],
        ['smuggle', '边境走私', 'Contrabbando di frontiera'],
        ['fascio_disarmed', '法西斯解除武装', 'Fascio disarmato'],
        ['dannunzio_left', '诗人已离开', 'Il Poeta ha lasciato la città']
      ];
      return markers.filter(function (entry) { return !!st.flags[entry[0]]; })
        .map(function (entry) { return { zh: entry[1], it: entry[2] }; });
    };

    S.factions = function (st) {
      return {
        /* Seated along the movement's own left-to-right axis (`FACTIONS[].order`),
           not by influence: an ordering by size reshuffles itself every time a
           card moves a point, and a political spectrum that reorders is not one. */
        list: W.FACTIONS.map(function (f) {
          var x = st.factions[f.id];
          return { id: f.id, zh: f.zh, it: f.it, color: f.color, blurb: f.blurb,
            order: f.order, inf: Core.round1(x.inf), dis: Core.round1(x.dis) };
        }).sort(function (a, b) {
          return (a.order == null ? 999 : a.order) - (b.order == null ? 999 : b.order);
        }),
        dissent: Core.round1(R.factionDissent(st)),
        unity: Core.round1(R.unityEfficiency(st) * 100)
      };
    };

    S.diplo = function (st) {
      return {
        posture: st.posture,
        list: W.DIPLO_ACTORS.map(function (a) {
          return { id: a.id, zh: a.zh, it: a.it, color: a.color, value: Core.round1(st.diplo[a.id] || 0) };
        }),
        postures: W.POSTURES.map(function (p) {
          var drift = W.POSTURE_DRIFT[p.id] || {};
          return { id: p.id, zh: p.zh, it: p.it, desc: p.desc,
            active: st.posture === p.id,
            effects: W.DIPLO_ACTORS.filter(function (a) { return drift[a.id] != null; }).map(function (a) {
              return { id: a.id, zh: a.zh, value: drift[a.id] };
            }) };
        })
      };
    };

    /* The forces outside Fiume. `front` contains the political movements that
       currently exist; `forzearmate` is the officer corps, a gate of
       its own rather than a member of the front. `atGate` is the full alliance
       threshold (80 for each movement); `consolidating` mirrors the monthly floor in
       the journal's own effect, so the panel and the rule agree on which forces
       are already being carried. */
    S.forze = function (st) {
      var z = st.forze || {};
      var frontMin = W.FORZA_FRONT_MIN == null ? 60 : W.FORZA_FRONT_MIN;
      var list = W.FORZE.filter(function (f) { return W.forzaExists(st, f.id); }).map(function (f) {
        var v = Core.round1(z[f.id] == null ? f.init : z[f.id]);
        var gate = f.gate == null ? 80 : f.gate;
        /* `Core.L` passes a plain string straight through, so the Italian has to
           travel as a node. A bare `Core.L(f.note)` left these paragraphs in
           Chinese in every locale. */
        return { id: f.id, zh: f.zh, it: f.it, color: f.color,
          note: Core.L({ zh: f.note || '', it: f.noteIt || f.note || '' }),
          value: v, allied: !!f.allied, gate: gate,
          atGate: v >= gate, consolidating: !!f.allied && v >= frontMin };
      });
      var front = list.filter(function (x) { return x.allied; });
      return {
        list: list,
        front: front,
        alliedCount: front.filter(function (x) { return x.atGate; }).length,
        consolidatingCount: front.filter(function (x) { return x.consolidating; }).length,
        officer: list.filter(function (x) { return x.id === 'forzearmate'; })[0] || null
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
        var required = Meta.CHARTER_REQUIREMENTS.filter(function (r) { return r.id === L.id; })[0];
        /* `label` is the name of the level now in force; `levelList` is every
           level in both languages, for the law dossier's ladder. */
        return { id: L.id, zh: L.zh, it: L.it, level: lvl, max: L.max,
          label: L.levels[lvl], labelIt: (L.levelsIt || [])[lvl] || '',
          levels: L.levels.slice(), levelList: L.levels.map(function (zh, n) {
            return { zh: zh, it: (L.levelsIt || [])[n] || zh, n: n };
          }),
          effect: W.LAW_EFFECTS[L.id], source: W.LAW_SOURCES[L.id],
          charterTarget: required ? required.level : null };
      });
    };

    S.charter = function (st) {
      var progress = R.charterProgress(st);
      return {
        drafted: !!st.flags.deambris_arrived,
        programmed: !!st.flags.charter_program,
        promulgated: !!st.flags.charter_promulgated,
        arengo: !!st.flags.charter_debate_resolved,
        done: !!(st.journals.carta && st.journals.carta.done),
        met: progress.met, total: progress.total,
        requirements: Meta.CHARTER_REQUIREMENTS.map(function (r) {
          return { id: r.id, zh: r.zh, it: r.it, level: r.level,
            current: st.laws[r.id] || 0, met: (st.laws[r.id] || 0) >= r.level };
        })
      };
    };

    S.journals = function (st) {
      var out = [];
      Object.keys(st.journals).forEach(function (jid) {
        var js = st.journals[jid], def = Meta.JOURNAL_BY_ID[jid];
        if (!def) return;
        out.push({ id: jid, zh: def.zh, it: def.it, desc: def.desc, active: js.active, done: js.done,
          failed: js.failed, months: js.months,
          /* The four blocks behind the expandable panel: what completes the
             journal, what fails it, and what each outcome does. Authored in
             meta.js as bilingual lists so the panel never has to read the
             predicate functions. */
          goal: def.goal || null, outcome: def.outcome || null });
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
       per deck and opens a picker listing these.
       The candidate list comes from Eng.drawableIn, which is the same call the
       random draw uses — so what the picker shows and what DRAW_RANDOM can hand
       you are always the same set. `mode` tells the UI which of the two it is:
       'pick' in sandbox, 'random' everywhere else. */
    S.decks = function (st) {
      var slotsFree = Math.max(0, st.handLimit - st.hand.length);
      var sandbox = st.difficulty === 'sandbox';
      return W.DECKS.map(function (d) {
        var cards = Eng.drawableIn(st, d.id);
        return {
          id: d.id, zh: d.zh, it: d.it, icon: d.icon, color: d.color,
          mode: sandbox ? 'pick' : 'random',
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
        /* `portrait` has to travel with the advisor: the roster, the seat row and
           the deck all render it, and dropping it here silently reduced every
           advisor to a lettered placeholder. */
        return { id: a.id, zh: a.zh, it: a.it, bio: a.bio, action: a.action,
          portrait: a.portrait || '',
          faction: a.faction, external: !a.faction,
          factionZh: f ? f.zh : '外部盟友', factionIt: f ? f.it : 'Alleati esterni',
          factionColor: f ? f.color : '#8A8377',
          active: st.advisors.active.indexOf(a.id) >= 0, unlocked: unlocked,
          dissent: dis, cdLeft: cdLeft };
      });
    };

    /* Resolve a choice on a cloned state. The live reducer applies caps,
       zero-sum transfers, derived opinion and event routing; handwritten
       option.preview strings cannot reliably describe those outcomes. */
    /* ---- Effect-preview vocabulary ------------------------------------------
       The preview is built here, not in the view, so every label it emits has to
       carry its own Italian: a bare Chinese string would come out Chinese in the
       Italian locale no matter how the view renders it. These are {zh, it} nodes.

       `previewJoin(kind, ...)` glues parts with the connector the language wants,
       so "手工业者与小店主·军团支持" and "Artigiani e bottegai · consenso dei
       legionari" are one code path rather than two. */
    var PL = {
      funds: { zh: '金库', it: 'Cassa' },
      arms: { zh: '军备', it: 'Armi' },
      ap: { zh: '行动力', it: 'Punti azione' },
      legitimacy: { zh: '军团民意', it: 'Opinione sulla Legione' },
      relation: { zh: '关系', it: 'rapporti' },
      /* A faction reads as "{name}力量" in Chinese but needs a preposition in
         Italian ("influenza dei Sindacalisti"), so the {a} sits inside the phrase.
         All five faction names are masculine plurals, so `dei` fits each. */
      influence: { zh: '{a}力量', it: 'influenza dei {a}' },
      dissent: { zh: '{a}异议', it: 'dissenso dei {a}' },
      /* Chinese appends the noun directly ("军团支持"); Italian reads "consenso
         del Partito". The ' · ' between the class and this phrase comes from the
         'cat' connector, so the suffix itself carries no leading separator. */
      supportSuffix: { zh: '{a}支持', it: 'consenso del {a}' },      nationalSupport: { zh: '全国支持', it: 'consenso nazionale' },
      seats: { zh: '议会席位', it: 'seggi' },
      cohesion: { zh: '联盟凝聚力', it: 'Coesione della coalizione' },
      join: { zh: '加入执政联盟：{a}', it: 'Entra nella coalizione: {a}' },
      quit: { zh: '退出执政联盟：{a}', it: 'Esce dalla coalizione: {a}' },
      cabinet: { zh: '{a}：{b} → {c}', it: '{a}: {b} → {c}' },
      journalIn: { zh: '开启日志：{a}', it: 'Diario aperto: {a}' },
      flagOn: { zh: ' · 生效', it: ' · attivo' },
      flagOff: { zh: ' · 取消', it: ' · revocato' },
      ending: { zh: '结局：{a}', it: 'Finale: {a}' },
      achievement: { zh: '解锁成就：{a}', it: 'Obiettivo sbloccato: {a}' },
      situation: { zh: '局势：{a}', it: 'Situazione: {a}' },
      lawLevel: { zh: '（第 {a} 级 → 第 {b} 级）', it: ' (liv. {a} → liv. {b})' },
      unavailable: { zh: '效果预览不可用', it: 'Anteprima non disponibile' },
      district: { zh: '{a}·{b}', it: '{a} · {b}' },
      pairRelation: { zh: '{a}与{b}关系', it: 'Rapporti {a}–{b}' },
      points: { zh: ' 点', it: ' pt.' },
      seatsUnit: { zh: ' 席', it: ' seggi' },
      chainCard: { zh: '接续卡牌：{a}', it: 'Carta successiva: {a}' },
      phase: { zh: '局势阶段：{a}', it: 'Fase: {a}' },
      queueEvent: { zh: '加入待办事件：{a}', it: 'Evento in coda: {a}' },
      followUp: { zh: '后续事件：{a}', it: 'Evento successivo: {a}' },
      noChange: { zh: '无即时数值变化', it: 'Nessun valore cambia subito' }
    };
    /* 'mod' = a modifier that follows a name ("意大利王国关系" / "Rapporti con il
       Regno d'Italia"); 'cat' = side-by-side names ("手工业者与小店主·军团支持").
       A `true` connector means "no separator", which cannot be expressed as an
       empty string in a {zh, it} node: Core.L falls through to `it` on a falsy
       reading, so an empty zh value would leak the Italian one. */
    var PREVIEW_SEP = {
      mod: { zh: true, it: ' ' },
      cat: { zh: '·', it: ' · ' },
      /* Chinese appends the noun ("…军团支持"); Italian reads "… · consenso del
         Partito", so the connector differs per language. */
      of: { zh: true, it: ' ' }
    };
    function previewJoin(kind) {
      var sepNode = PREVIEW_SEP[kind] || PREVIEW_SEP.mod;
      /* `arguments` must be read before the loop below: inside the forEach
         callback it refers to the callback's own arguments, not this function's. */
      var args = [];
      for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
      /* Built per language, so a part that needs a preposition ("consenso del
         Partito") can differ in shape between zh and it. An empty reading is a
         legitimate part (the 'mod' connector is empty in Chinese); only a
         missing node is dropped. */
      var out = {};
      ['zh', 'it'].forEach(function (lang) {
        var parts = [];
        args.forEach(function (a) {
          if (a == null || (typeof a === 'string' && a === '')) return;
          parts.push(typeof a === 'string' ? a : (a[lang] || a.zh || a.it || ''));
        });
        var sep = sepNode[lang];
        out[lang] = sep === true ? parts.join('') : parts.join(sep == null ? '' : sep);
      });
      return Core.L(out);
    }
    /* Fill a {a}/{b}/{c} template in whichever language is active. A value may
       itself be a {zh, it} node (a card or party name), which is resolved
       recursively so a nested placeholder cannot survive into the output. */
    function previewFill(tmpl, vars) {
      function resolve(lang, v) {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
        return v[lang] || v.zh || v.it || '';
      }
      var out = {};
      Object.keys(tmpl).forEach(function (lang) {
        var s = tmpl[lang];
        Object.keys(vars).forEach(function (k) {
          s = s.split('{' + k + '}').join(resolve(lang, vars[k]));
        });
        out[lang] = s;
      });
      return Core.L(out);
    }

    var PREVIEW_ORDER = {
      authority: { zh: '领袖权威', it: 'Autorità del Comandante' },
      garrison: { zh: '意大利驻军', it: 'Presidio italiano' },
      fervour: { zh: '民众热忱', it: 'Fervore popolare' },
      squadre: { zh: '法西斯小队', it: 'Squadre fasciste' },
      violence: { zh: '政治暴力', it: 'Violenza politica' },
      tension: { zh: '紧张局势', it: 'Tensione' },
      coup: { zh: '法西斯占领风险', it: 'Rischio di presa fascista' },
      subversion: { zh: '颠覆风险', it: 'Rischio di sovversione' },
      milizia: { zh: '军团兵力', it: 'Forza della Legione' },
      police: { zh: '市政警察', it: 'Polizia municipale' },
      carabinieri: { zh: '皇家宪兵', it: 'Carabinieri reali' }
    };
    var PREVIEW_ECONOMY = {
      traffic: { zh: '港口吞吐指数', it: 'Indice del porto' },
      hinterland: { zh: '腹地通达', it: 'Accesso all\'entroterra' },
      delta: { zh: '三角洲控制', it: 'Controllo del delta' },
      works: { zh: '港口工程', it: 'Opere portuali' },
      recognition: { zh: '国际承认', it: 'Riconoscimento internazionale' },
      strike: { zh: '罢工强度', it: 'Intensità degli scioperi' },
      unemployment: { zh: '失业率', it: 'Disoccupazione' },
      inflation: { zh: '通胀率', it: 'Inflazione' },
      population: { zh: '人口', it: 'Popolazione' },
      treasury: { zh: '国库储备', it: 'Riserve' },
      debt: { zh: '债务', it: 'Debito' },
      arrears: { zh: '欠款', it: 'Arretrati' },
      capitalConfidence: { zh: '资本信心', it: 'Fiducia del capitale' },
      lastRevenue: { zh: '上期收入', it: 'Entrate del periodo scorso' }
    };
    var PREVIEW_COUNTERS = {
      strikes: { zh: '罢工次数', it: 'Scioperi' },
      violenceEvents: { zh: '暴力事件', it: 'Episodi di violenza' },
      emigrants: { zh: '离城人数', it: 'Emigranti' },
      exileMonths: { zh: '流亡月数', it: 'Mesi di esilio' },
      resistMonths: { zh: '抵抗月数', it: 'Mesi di resistenza' },
      calmMonths: { zh: '平静月数', it: 'Mesi di calma' },
      electionsHeld: { zh: '选举次数', it: 'Elezioni tenute' }
    };
    var PREVIEW_FLAGS = {
      charter_promulgated: { zh: '《卡尔纳罗宪章》颁布', it: 'Carta del Carnaro promulgata' },
      charter_debate_resolved: { zh: '宪章辩论完成', it: 'Dibattito sulla Carta concluso' },
      charter_program: { zh: '宪章立法纲领', it: 'Programma legislativo della Carta' },
      charter_drafted: { zh: '宪章草案', it: 'Bozza della Carta' },
      deambris_arrived: { zh: '德·安布里斯加入', it: 'De Ambris è arrivato' },
      free_election: { zh: '自由选举', it: 'Elezioni libere' },
      no_election: { zh: '取消选举', it: 'Elezioni annullate' },
      single_list: { zh: '单一名单', it: 'Lista unica' },
      runMunicipal: { zh: '市政选举', it: 'Elezioni municipali' },
      splitList: { zh: '分立名单', it: 'Liste separate' },
      boycott: { zh: '抵制选举', it: 'Boicottaggio elettorale' },
      exile: { zh: '流亡', it: 'Esilio' },
      coup_done: { zh: '政变已发生', it: 'Colpo di Stato avvenuto' },
      smuggle: { zh: '边境走私', it: 'Contrabbando di frontiera' },
      worker_control: { zh: '工人接管', it: 'Operai al controllo' },
      blasich_contact: { zh: '布拉西奇接触', it: 'Contatto con Blasich' },
      blasich_in: { zh: '布拉西奇入阁', it: 'Blasich nel gabinetto' },
      grand_coalition: { zh: '大联合', it: 'Grande coalizione' },
      natale_done: { zh: '血腥圣诞', it: 'Natale di sangue' },
      dannunzio_left: { zh: '邓南遮离开', it: 'D\'Annunzio ha lasciato la città' },
      treaty_rome: { zh: '《罗马条约》', it: 'Trattato di Roma' },
      soviet_contact: { zh: '苏维埃接触', it: 'Contatto con i sovietici' },
      magyar_exiles: { zh: '匈牙利流亡者网络', it: 'Rete degli esuli magiari' },
      balkan_plot: { zh: '巴尔干密约', it: 'Patto balcanico segreto' },
      modus_accepted: { zh: '接受临时方案', it: 'Modus vivendi accettato' },
      modus_blocked: { zh: '拒绝临时方案', it: 'Modus vivendi rifiutato' },
      modus_delayed: { zh: '延后临时方案', it: 'Modus vivendi rinviato' },
      modus_voted: { zh: '临时方案表决', it: 'Voto sul modus vivendi' },
      fascio_disarmed: { zh: '法西斯解除武装', it: 'Fascio disarmato' },
      cervo_scandal: { zh: '金鹿旅馆丑闻', it: 'Scandalo del Cervo' },
      carne_scolpita: { zh: '雕刻的肉事件', it: 'Caso della «carne scolpita»' },
      persia: { zh: '波斯号事件', it: 'Caso della Persia' },
      persia_refused: { zh: '拒绝波斯号', it: 'Persia rifiutata' },
      carnaro_bonds: { zh: '卡尔纳罗公债', it: 'Prestito del Carnaro' },
      milan_loan: { zh: '米兰借款', it: 'Prestito di Milano' },
      factories_leased: { zh: '工厂租赁', it: 'Fabbriche affittate' },
      fascist_money: { zh: '法西斯资金', it: 'Finanziamenti fascisti' },
      mussolini_letter: { zh: '墨索里尼来信', it: 'Lettera di Mussolini' },
      rome_talks: { zh: '与罗马谈判', it: 'Trattative con Roma' },
      marcia_1920_refused: { zh: '拒绝进军罗马', it: 'Marcia su Roma rifiutata' },
      officer_contact: { zh: '接触意大利军官团', it: 'Contatto con il corpo ufficiale' },
      marcia_1920_open: { zh: '进军罗马路线', it: 'Linea della marcia su Roma' },
      marcia_1920_early: { zh: '提前进军', it: 'Marcia anticipata' },
      marcia_1920_waited: { zh: '暂缓进军', it: 'Marcia rinviata' },
      balcony_declaration: { zh: '阳台宣言', it: 'Dichiarazione dal balcone' },
      adunata_scandal: { zh: '集会丑闻', it: 'Scandalo dell\'adunata' },
      occupied_islands: { zh: '占领岛屿', it: 'Isole occupate' },
      accept_rapallo: { zh: '接受《拉帕洛条约》', it: 'Trattato di Rapallo accettato' },
      comintern_door: { zh: '意大利共产党成立', it: 'Nascita del Partito Comunista' },
      psi_split_from_pcdi: { zh: '社会党与共产党分裂', it: 'Scissione fra socialisti e comunisti' },
      baross_deal: { zh: '巴罗斯港协议', it: 'Accordo di Porto Baross' },
      baross_arbitration: { zh: '巴罗斯港仲裁', it: 'Arbitrato su Porto Baross' },
      stay: { zh: '留守阜姆', it: 'Restare a Fiume' },
      italian_occupation: { zh: '意大利占领', it: 'Occupazione italiana' },
      civic_resistance: { zh: '市民抵抗', it: 'Resistenza civica' },
      legion_party: { zh: '军团政党', it: 'Partito della Legione' },
      rest_in_city: { zh: '留在城中', it: 'Restare in città' },
      stay_political: { zh: '继续政治斗争', it: 'Continuare la lotta politica' },
      underground: { zh: '转入地下', it: 'Passare alla clandestinità' },
      behind_scenes: { zh: '幕后谈判', it: 'Trattative dietro le quinte' },
      partial_deal: { zh: '部分妥协', it: 'Compromesso parziale' },
      bombacci_front: { zh: '邦巴奇加入阵线', it: 'Bombacci entra nel fronte' },
      bombacci_rebuffed: { zh: '拒绝邦巴奇', it: 'Bombacci respinto' },
      blood_christmas: { zh: '血腥圣诞战斗', it: 'Combattimenti del Natale di sangue' },
      martyred: { zh: '殉难', it: 'Martirio' },
      marcia_1920: { zh: '向罗马进军', it: 'Marcia su Roma' },
      marcia_1920_failed: { zh: '进军罗马失败', it: 'Marcia su Roma fallita' },
      refused_march: { zh: '拒绝进军', it: 'Marcia rifiutata' },
      gramsci_front: { zh: '葛兰西加入阵线', it: 'Gramsci entra nel fronte' },
      malatesta_front: { zh: '马拉泰斯塔加入阵线', it: 'Malatesta entra nel fronte' },
      fascist_embrace: { zh: '接纳法西斯', it: 'Abbraccio ai fascisti' },
      fascist_alliance: { zh: '法西斯同盟', it: 'Alleanza con i fascisti' },
      fascist_refused: { zh: '拒绝法西斯', it: 'Fascisti rifiutati' }
    };
    function previewNumber(n) {
      var v = Math.round(n * 100) / 100;
      return (Math.abs(v - Math.round(v)) < 0.005) ? String(Math.round(v)) :
        (Math.abs(v * 10 - Math.round(v * 10)) < 0.005 ? v.toFixed(1) : v.toFixed(2));
    }
    /* The label and the reading are always separated, in both languages: zh wants
       a space too ("领袖权威 +5", not "领袖权威+5"). */
    function previewDelta(lines, label, before, after, unit) {
      if (typeof before !== 'number' || typeof after !== 'number' ||
          !isFinite(before) || !isFinite(after) || Math.abs(after - before) < 0.005) return;
      var d = after - before;
      lines.push((typeof label === 'string' ? label : Core.L(label)) + ' ' +
        (d > 0 ? '+' : '−') + previewNumber(Math.abs(d)) + (unit || ''));
    }
    function previewFields(lines, before, after, labels, unit) {
      Object.keys(labels).forEach(function (key) {
        previewDelta(lines, labels[key], before[key], after[key], unit);
      });
    }
    /* Resolve an id to its {zh, it} node, so the caller can compose a bilingual
       label instead of pasting the Chinese name into a sentence. */
    function previewNode(list, id) {
      var found = list.filter(function (x) { return x.id === id; })[0];
      return found || { zh: id, it: id };
    }
    function previewEffectPatch(option, state) {
      // The callback may read or alter its argument. Never give it the live state.
      return (typeof option.effect === 'function' ? option.effect(Core.deepClone(state)) : option.effect) || {};
    }
    S.optionEffectPreview = function (st, type, option, enabled) {
      if (!enabled) return [];
      try {
        var source = Core.deepClone(st);
        var patch = previewEffectPatch(option, source);
        var result = Eng.dispatch(source, { type: type, optionId: option.id });
        if (result.toast && result.toast.kind === 'warn') return [Core.L(PL.unavailable)];
        var after = result.state;
        var lines = [];
        previewDelta(lines, PL.funds, st.funds, after.funds, ' K£');
        previewDelta(lines, PL.arms, st.arms, after.arms);
        previewDelta(lines, PL.ap, st.ap, after.ap);
        previewFields(lines, st.order, after.order, PREVIEW_ORDER);
        previewFields(lines, st.economy, after.economy, PREVIEW_ECONOMY);
        previewDelta(lines, PL.legitimacy, st.legitimacy, after.legitimacy);

        W.LAWS.forEach(function (law) {
          var from = st.laws[law.id] || 0, to = after.laws[law.id] || 0;
          if (from !== to) lines.push(
            previewJoin('mod', law, (to > from ? '+' : '−') + Math.abs(to - from)) +
            previewFill(PL.lawLevel, { a: from, b: to }));
        });
        W.DIPLO_ACTORS.forEach(function (actor) {
          previewDelta(lines, previewJoin('mod', actor, PL.relation), st.diplo[actor.id], after.diplo[actor.id]);
        });
        W.FORZE.forEach(function (force) {
          if (W.forzaExists && !W.forzaExists(after, force.id)) return;
          previewDelta(lines, previewJoin('mod', force, PL.relation), (st.forze || {})[force.id], (after.forze || {})[force.id]);
        });
        W.FACTIONS.forEach(function (faction) {
          previewDelta(lines, previewFill(PL.influence, { a: faction }), st.factions[faction.id].inf, after.factions[faction.id].inf);
          previewDelta(lines, previewFill(PL.dissent, { a: faction }), st.factions[faction.id].dis, after.factions[faction.id].dis);
        });

        // Show the class/party named by the actual effect. Normalisation moves
        // every other party in that class; listing all of those would bury the
        // player's intended choice under dozens of secondary decimal shifts.
        var supportTargets = {};
        (patch.support || []).forEach(function (entry) {
          supportTargets[entry[0] + ':' + entry[1]] = [entry[0], entry[1]];
        });
        if (patch.mergeParty) W.CLASSES.forEach(function (cls) {
          [patch.mergeParty.from, patch.mergeParty.to].forEach(function (id) {
            supportTargets[cls.id + ':' + id] = [cls.id, id];
          });
        });
        Object.keys(supportTargets).forEach(function (key) {
          var target = supportTargets[key], cls = target[0], party = target[1];
          if (!st.classes[cls] || !after.classes[cls]) return;
          previewDelta(lines, previewJoin('cat', previewNode(W.CLASSES, cls),
            previewFill(PL.supportSuffix, { a: previewNode(W.PARTIES, party) })),
            st.classes[cls].support[party] || 0, after.classes[cls].support[party] || 0, Core.L(PL.points));
        });
        if (patch.parties) Object.keys(patch.parties).forEach(function (party) {
          previewDelta(lines, previewJoin('mod', previewNode(W.PARTIES, party), PL.nationalSupport),
            (st.partySupport || {})[party] || 0, (after.partySupport || {})[party] || 0, Core.L(PL.points));
        });
        if (patch.relations) patch.relations.forEach(function (pair) {
          previewDelta(lines, previewFill(PL.pairRelation, {
            a: previewNode(W.PARTIES, pair[0]), b: previewNode(W.PARTIES, pair[1]) }),
            R.relationOf(st, pair[0], pair[1]), R.relationOf(after, pair[0], pair[1]));
        });
        W.DISTRICTS.forEach(function (district) {
          var labels = {
            control: { zh: '控制', it: 'controllo' },
            agitation: { zh: '动荡', it: 'agitazione' },
            unemployment: { zh: '失业率', it: 'disoccupazione' }
          };
          ['control', 'agitation', 'unemployment'].forEach(function (key) {
            previewDelta(lines, previewFill(PL.district, { a: district, b: labels[key] }),
              st.districts[district.id][key], after.districts[district.id][key]);
          });
        });
        previewFields(lines, st.counters, after.counters, PREVIEW_COUNTERS);
        previewFields(lines, st.revenueBoost, after.revenueBoost, {
          porto: { zh: '港口收入加成', it: 'Maggior gettito portuale' },
          dogana: { zh: '关税收入加成', it: 'Maggior gettito doganale' },
          consumo: { zh: '消费税收入加成', it: 'Maggior gettito sui consumi' },
          reddito: { zh: '所得税收入加成', it: 'Maggior gettito sul reddito' }
        });
        previewDelta(lines, PL.cohesion, st.coalition.cohesion, after.coalition.cohesion);
        after.coalition.members.forEach(function (id) {
          if (st.coalition.members.indexOf(id) < 0) lines.push(previewFill(PL.join, { a: previewNode(W.PARTIES, id) }));
        });
        st.coalition.members.forEach(function (id) {
          if (after.coalition.members.indexOf(id) < 0) lines.push(previewFill(PL.quit, { a: previewNode(W.PARTIES, id) }));
        });
        W.PARTIES.forEach(function (party) {
          previewDelta(lines, previewJoin('mod', party, PL.seats), st.assembly[party.id] || 0,
            after.assembly[party.id] || 0, Core.L(PL.seatsUnit));
        });
        Object.keys(after.cabinet).forEach(function (ministry) {
          if (after.cabinet[ministry] !== st.cabinet[ministry]) lines.push(previewFill(PL.cabinet, {
            a: previewNode(W.MINISTRIES, ministry),
            b: previewNode(W.PARTIES, st.cabinet[ministry]),
            c: previewNode(W.PARTIES, after.cabinet[ministry])
          }));
        });
        Object.keys(after.journals).forEach(function (id) {
          if (!st.journals[id] && after.journals[id]) {
            lines.push(previewFill(PL.journalIn, { a: previewNode(Meta.JOURNALS, id) }));
          }
        });
        Object.keys(after.flags).forEach(function (key) {
          if (after.flags[key] !== st.flags[key] && patch.flags && Object.prototype.hasOwnProperty.call(patch.flags, key)) {
            /* `PREVIEW_FLAGS[key]` is a node and `previewFill` returns a string;
               both go through Core.L so the concatenation never sees an object. */
            var flagNode = Core.L(PREVIEW_FLAGS[key] || previewFill(PL.situation, { a: key }));
            lines.push(flagNode + (after.flags[key] ? Core.L(PL.flagOn) : Core.L(PL.flagOff)));
          }
        });
        /* The patch key is `openCard`; reading `pendingCard` here meant the card
           name was never substituted and the label rendered as "接续卡牌：{a}". */
        var opened = after.openCard || after.pendingCard;
        if (opened && opened !== (st.openCard || st.pendingCard) && Eng.CARD_BY_ID[opened]) {
          lines.push(previewFill(PL.chainCard, { a: Eng.CARD_BY_ID[opened].name }));
        }
        if (after.phase !== st.phase && after.phase !== 'ended') {
          var phaseNames = {
            event: { zh: '事件', it: 'evento' }, action: { zh: '行动', it: 'azione' },
            exile: { zh: '流亡', it: 'esilio' }, occupied: { zh: '占领', it: 'occupazione' }
          };
          lines.push(previewFill(PL.phase, { a: phaseNames[after.phase] || after.phase }));
        }
        after.eventQueue.forEach(function (id) {
          if (st.eventQueue.indexOf(id) < 0 && Eng.EVENT_BY_ID[id])
            lines.push(previewFill(PL.queueEvent, { a: Eng.EVENT_BY_ID[id].title }));
        });
        if (type === 'RESOLVE_EVENT' && after.currentEvent && after.currentEvent !== st.currentEvent && Eng.EVENT_BY_ID[after.currentEvent]) {
          lines.push(previewFill(PL.followUp, { a: Eng.EVENT_BY_ID[after.currentEvent].title }));
        }
        if (after.ending && after.ending !== st.ending) {
          lines.push(previewFill(PL.ending, { a: previewNode(Meta.ENDINGS, after.ending) }));
        }
        if (after.achievements.length > st.achievements.length) after.achievements.forEach(function (id) {
          if (st.achievements.indexOf(id) < 0) {
            lines.push(previewFill(PL.achievement, { a: previewNode(Meta.ACHIEVEMENTS, id) }));
          }
        });
        return lines.length ? lines : [Core.L(PL.noChange)];
      } catch (e) {
        return [Core.L(PL.unavailable)];
      }
    };

    /* Card choice menu (multi-option cards) */
    S.cardView = function (st) {
      if (!st.pendingCard) return null;
      var c = Eng.CARD_BY_ID[st.pendingCard];
      if (!c) return null;
      return {
        id: c.id, deck: c.deck, name: c.name, text: c.text,
        cost: c.cost || {},
        ministry: c.ministry || null,
        options: Eng.cardOptions(st, c).map(function (o) {
          var authored = (c.options || []).filter(function (candidate) { return candidate.id === o.id; })[0];
          o.preview = S.optionEffectPreview(st, 'RESOLVE_CARD_OPTION', authored, o.enabled);
          return o;
        })
      };
    };

    /* Party relations, as a matrix the assembly tab can render directly. */
    S.relations = function (st) {
      var cols = W.PARTIES.filter(function (p) { return p.id !== st.playerForce; });
      return {
        /* `it` travels with every name: the chord plate and its rail render
           these through Core.L, so dropping it here left the Italian locale
           showing Chinese party names. */
        cols: cols.map(function (p) {
          return { id: p.id, zh: p.zh, it: p.it, short: p.short, color: p.color, camp: p.camp };
        }),
        rows: W.PARTIES.map(function (a) {
          return {
            id: a.id, zh: a.zh, it: a.it, short: a.short, color: a.color,
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
        /* The note is a bilingual node like the name, so the map's district
           detail follows the language setting. */
        return { id: d.id, zh: d.zh, it: d.it, status: d.status,
          note: { zh: d.note || '', it: d.noteIt || d.note || '' },
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
        var prev = S.optionEffectPreview(st, 'RESOLVE_EVENT', o, ok);
        return { id: o.id, text: o.text, enabled: ok, reason: reason, preview: prev };
      });
      /* The result is worked out here, when the event opens, against the state
         as it stands — and against the live rules, so a result is never a
         stored figure that can go stale. */
      var res = null;
      if (ev.result) {
        try { res = ev.result(st, { R: R, W: W, Core: Core, Eng: Eng }); } catch (e) { res = null; }
      }
      return { id: ev.id, title: ev.title, body: ev.body, options: opts,
        superEvent: !!ev.superEvent, result: res };
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
        return { v: 11, at: Date.now(), label: Core.dateLabel(st.date), state: c };
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
          // v5: the organization system was pulled out whole, so any save
          // written before that carries a dead `organizations` map.
          if ((st.version || 0) < 5) {
            delete st.organizations;
            st.version = 5;
          }
          if ((st.version || 0) < 6) {
            delete st.militants;
            if (st.order) delete st.order.legionari;
            st.version = 6;
          }
          if ((st.version || 0) < 7) {
            st.forze = st.forze || {};
            W.FORZE.forEach(function (f) {
              if (st.forze[f.id] == null) st.forze[f.id] = f.init;
            });
            st.version = 7;
          }
          if ((st.version || 0) < 8) {
            var activeAchievements = Meta.ACHIEVEMENTS.map(function (a) { return a.id; });
            st.achievements = (st.achievements || []).filter(function (id) {
              return activeAchievements.indexOf(id) !== -1;
            });
            st.version = 8;
          }
          if ((st.version || 0) < 9) {
            if (st.order) delete st.order.garrisonTroops;
            if (st.prev) {
              delete st.prev.produzione;
              delete st.prev.pressione;
            }
            st.version = 9;
          }
          if ((st.version || 0) < 10) {
            if (st.economy) {
              delete st.economy.lastSpending;
              delete st.economy.lastNet;
            }
            st.version = 10;
          }
          if ((st.version || 0) < 11) {
            // Hotel Bonavia was removed. A save paused on it must be able to
            // resume, and a queued copy must never reopen an unknown event.
            if (st.currentEvent === 'ev_fascio_split') {
              st.currentEvent = null;
              if (st.phase === 'event') st.phase = 'action';
            }
            if (st.eventQueue) st.eventQueue = st.eventQueue.filter(function (id) { return id !== 'ev_fascio_split'; });
            if (st.eventHistory) st.eventHistory = st.eventHistory.filter(function (id) { return id !== 'ev_fascio_split'; });
            if (st.eventCooldowns) delete st.eventCooldowns.ev_fascio_split;
            st.version = 11;
          }
          if ((st.version || 0) < 12) {
            var oldCartaLevel = (st.laws && st.laws.statuto) || 0;
            st.flags = st.flags || {};
            st.journals = st.journals || {};
            st.eventQueue = st.eventQueue || [];
            st.eventHistory = st.eventHistory || [];
            st.eventCooldowns = st.eventCooldowns || {};
            if (st.flags.deambris_arrived || st.flags.charter_drafted || oldCartaLevel > 0 || st.journals.carta) {
              if (st.journals.carta) st.flags.charter_program = true;
              else if (st.eventQueue.indexOf('ev_carta_programma') < 0 && st.currentEvent !== 'ev_1920_01_deambris')
                st.eventQueue.unshift('ev_carta_programma');
            }
            if (oldCartaLevel > 0) st.flags.charter_promulgated = true;
            if (st.journals.carta && st.journals.carta.done) {
              st.flags.carta_done = true;
              st.flags.charter_program = true;
              st.flags.charter_debate_resolved = true;
            }
            if (st.laws) delete st.laws.statuto;
            if (st.order) delete st.order.civicGuard;
            delete st.journals.guardia;
            if (st.monotonic) { delete st.monotonic.guardCreated; delete st.monotonic.guardDissolved; }
            st.hand = (st.hand || []).map(function (id) { return id === 'gv_guardia' ? 'gv_polizia' : id; });
            st.discard = (st.discard || []).map(function (id) { return id === 'gv_guardia' ? 'gv_polizia' : id; });
            if (st.pendingCard === 'gv_guardia') st.pendingCard = 'gv_polizia';
            if (st.eventCooldowns.c_gv_guardia != null) {
              st.eventCooldowns.c_gv_polizia = st.eventCooldowns.c_gv_guardia;
              delete st.eventCooldowns.c_gv_guardia;
            }
            st.version = 12;
          }
          if ((st.version || 0) < 13) {
            st.laws = st.laws || {};
            var oldLabour = Math.floor(Math.max(0, Math.min(3, st.laws.lavoro || 0)));
            // The old ladder mixed eight-hour limits, a port labour office and
            // collective bargaining. Preserve the substance in both new laws.
            st.laws.orario = oldLabour >= 1 ? 1 : 0;
            st.laws.lavoro = [0, 0, 1, 3][oldLabour];
            st.version = 13;
          }
          /* Same-version saves never reach a migration step, so the invariants
             have to be applied here too: a save written before the crisis axes
             were unified carries 0–140 in `order`, `prev` and `series` alike, and
             only one entry point normalising them was the bug. */
          if (Eng.postProcess) Eng.postProcess(st);
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
