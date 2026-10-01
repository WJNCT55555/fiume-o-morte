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

    /** Aggregated cards and modifiers, shown in the left column as national spirits */
    S.spirits = function (st) {
      var out = [];
      var L = st.laws;
      if (st.flags.charter_promulgated) {
        var charter = R.charterProgress(st);
        out.push({ icon: 'column', zh: '《卡尔纳罗宪章》', v: charter.met + '/' + charter.total + ' 项法律达标' });
      }
      if (L.orario >= 1) out.push({ icon: 'fasces', zh: '工时立法', v: '罢工 −' + (L.orario * 0.5).toFixed(1) + '/月' });
      if (L.lavoro >= 1) out.push({ icon: 'fasces', zh: '劳动保障', v: '罢工 −' + (L.lavoro * 1.1).toFixed(1) + '/月' });
      if (L.ordine >= 2) out.push({ icon: 'legittimita', zh: '市政警察监督', v: '公共秩序 ' + L.ordine + ' 级' });
      if (L.portofranco >= 1) out.push({ icon: 'coins', zh: '自由港制度', v: '资本信心 +' + (L.portofranco * 1.2).toFixed(1) + '/月' });
      if (L.lingua >= 1) out.push({ icon: 'star', zh: '双语条例', v: '子市镇支持 +' + (L.lingua * 5) + '%' });
      if (st.flags.international_guarantee) out.push({ icon: 'legittimita', zh: '国际保证', v: '国联承认' });
      if (st.flags.worker_control) out.push({ icon: 'industria', zh: '工人接管工厂', v: '合作社 +' });
      if (st.flags.smuggle) out.push({ icon: 'compass', zh: '边境走私', v: '金库 + / 合法性 −' });
      if (st.flags.fascio_disarmed) out.push({ icon: 'fasces', zh: '法西斯已解除武装', v: '法西斯暴力 −18' });
      if (st.flags.dannunzio_left) out.push({ icon: 'victory', zh: '诗人已离开', v: '热忱 −' });
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
        return { id: f.id, zh: f.zh, it: f.it, color: f.color, note: Core.L(f.note || {}),
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
        return { id: L.id, zh: L.zh, it: L.it, level: lvl, max: L.max,
          label: L.levels[lvl], levels: L.levels.slice(), effect: W.LAW_EFFECTS[L.id], source: W.LAW_SOURCES[L.id],
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
        return { id: a.id, zh: a.zh, it: a.it, bio: a.bio, action: a.action,
          faction: a.faction, external: !a.faction,
          factionZh: f ? f.zh : '外部盟友', factionColor: f ? f.color : '#8A8377',
          active: st.advisors.active.indexOf(a.id) >= 0, unlocked: unlocked,
          dissent: dis, cdLeft: cdLeft };
      });
    };

    /* Resolve a choice on a cloned state. The live reducer applies caps,
       zero-sum transfers, derived opinion and event routing; handwritten
       option.preview strings cannot reliably describe those outcomes. */
    var PREVIEW_ORDER = {
      authority: '领袖权威', garrison: '意大利驻军', fervour: '民众热忱', squadre: '法西斯小队',
      violence: '政治暴力', tension: '紧张局势', coup: '法西斯占领风险', subversion: '颠覆风险',
      milizia: '军团兵力', police: '市政警察', carabinieri: '皇家宪兵'
    };
    var PREVIEW_ECONOMY = {
      traffic: '港口吞吐指数', hinterland: '腹地通达', delta: '三角洲控制', works: '港口工程',
      recognition: '国际承认', strike: '罢工强度', unemployment: '失业率', inflation: '通胀率',
      population: '人口', treasury: '国库储备', debt: '债务', arrears: '欠款',
      capitalConfidence: '资本信心', lastRevenue: '上期收入'
    };
    var PREVIEW_COUNTERS = {
      strikes: '罢工次数', violenceEvents: '暴力事件', emigrants: '离城人数',
      exileMonths: '流亡月数', resistMonths: '抵抗月数', calmMonths: '平静月数',
      electionsHeld: '选举次数'
    };
    var PREVIEW_FLAGS = {
      charter_promulgated: '《卡尔纳罗宪章》颁布', charter_debate_resolved: '宪章辩论完成',
      charter_program: '宪章立法纲领', charter_drafted: '宪章草案', deambris_arrived: '德·安布里斯加入',
      free_election: '自由选举', no_election: '取消选举', single_list: '单一名单',
      runMunicipal: '市政选举', splitList: '分立名单', boycott: '抵制选举',
      exile: '流亡', coup_done: '政变已发生', smuggle: '边境走私',
      worker_control: '工人接管', blasich_contact: '布拉西奇接触',
      blasich_in: '布拉西奇入阁', grand_coalition: '大联合',
      natale_done: '血腥圣诞', dannunzio_left: '邓南遮离开', treaty_rome: '《罗马条约》',
      soviet_contact: '苏维埃接触', magyar_exiles: '匈牙利流亡者网络', balkan_plot: '巴尔干密约',
      modus_accepted: '接受临时方案', modus_blocked: '拒绝临时方案', modus_delayed: '延后临时方案',
      modus_voted: '临时方案表决', fascio_disarmed: '法西斯解除武装',
      cervo_scandal: '金鹿旅馆丑闻', carne_scolpita: '雕刻的肉事件',
      persia: '波斯号事件', persia_refused: '拒绝波斯号',
      carnaro_bonds: '卡尔纳罗公债', milan_loan: '米兰借款',
      factories_leased: '工厂租赁', fascist_money: '法西斯资金',
      mussolini_letter: '墨索里尼来信', rome_talks: '与罗马谈判',
      marcia_1920_refused: '拒绝进军罗马', officer_contact: '接触意大利军官团',
      marcia_1920_open: '进军罗马路线', marcia_1920_early: '提前进军',
      marcia_1920_waited: '暂缓进军', balcony_declaration: '阳台宣言',
      adunata_scandal: '集会丑闻', occupied_islands: '占领岛屿',
      accept_rapallo: '接受《拉帕洛条约》', comintern_door: '意大利共产党成立',
      psi_split_from_pcdi: '社会党与共产党分裂', baross_deal: '巴罗斯港协议',
      baross_arbitration: '巴罗斯港仲裁', stay: '留守阜姆',
      italian_occupation: '意大利占领', civic_resistance: '市民抵抗',
      legion_party: '军团政党', rest_in_city: '留在城中', stay_political: '继续政治斗争',
      underground: '转入地下', behind_scenes: '幕后谈判', partial_deal: '部分妥协',
      bombacci_front: '邦巴奇加入阵线', bombacci_rebuffed: '拒绝邦巴奇',
      blood_christmas: '血腥圣诞战斗', martyred: '殉难',
      marcia_1920: '向罗马进军', marcia_1920_failed: '进军罗马失败',
      refused_march: '拒绝进军', gramsci_front: '葛兰西加入阵线',
      malatesta_front: '马拉泰斯塔加入阵线', fascist_embrace: '接纳法西斯',
      fascist_alliance: '法西斯同盟', fascist_refused: '拒绝法西斯'
    };
    function previewNumber(n) {
      var v = Math.round(n * 100) / 100;
      return (Math.abs(v - Math.round(v)) < 0.005) ? String(Math.round(v)) :
        (Math.abs(v * 10 - Math.round(v * 10)) < 0.005 ? v.toFixed(1) : v.toFixed(2));
    }
    function previewDelta(lines, label, before, after, unit) {
      if (typeof before !== 'number' || typeof after !== 'number' ||
          !isFinite(before) || !isFinite(after) || Math.abs(after - before) < 0.005) return;
      var d = after - before;
      lines.push(label + ' ' + (d > 0 ? '+' : '−') + previewNumber(Math.abs(d)) + (unit || ''));
    }
    function previewFields(lines, before, after, labels, unit) {
      Object.keys(labels).forEach(function (key) {
        previewDelta(lines, labels[key], before[key], after[key], unit);
      });
    }
    function previewName(list, id) {
      var found = list.filter(function (x) { return x.id === id; })[0];
      return found ? found.zh : id;
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
        if (result.toast && result.toast.kind === 'warn') return ['效果预览不可用'];
        var after = result.state;
        var lines = [];
        previewDelta(lines, '金库', st.funds, after.funds, ' K£');
        previewDelta(lines, '军备', st.arms, after.arms);
        previewDelta(lines, '行动力', st.ap, after.ap);
        previewFields(lines, st.order, after.order, PREVIEW_ORDER);
        previewFields(lines, st.economy, after.economy, PREVIEW_ECONOMY);
        previewDelta(lines, '军团民意', st.legitimacy, after.legitimacy);

        W.LAWS.forEach(function (law) {
          var from = st.laws[law.id] || 0, to = after.laws[law.id] || 0;
          if (from !== to) lines.push(law.zh + ' ' + (to > from ? '+' : '−') + Math.abs(to - from) +
            '（第 ' + from + ' 级 → 第 ' + to + ' 级）');
        });
        W.DIPLO_ACTORS.forEach(function (actor) {
          previewDelta(lines, actor.zh + '关系', st.diplo[actor.id], after.diplo[actor.id]);
        });
        W.FORZE.forEach(function (force) {
          if (W.forzaExists && !W.forzaExists(after, force.id)) return;
          previewDelta(lines, force.zh + '关系', (st.forze || {})[force.id], (after.forze || {})[force.id]);
        });
        W.FACTIONS.forEach(function (faction) {
          previewDelta(lines, faction.zh + '力量', st.factions[faction.id].inf, after.factions[faction.id].inf);
          previewDelta(lines, faction.zh + '异议', st.factions[faction.id].dis, after.factions[faction.id].dis);
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
          previewDelta(lines, previewName(W.CLASSES, cls) + '·' + previewName(W.PARTIES, party) + '支持',
            st.classes[cls].support[party] || 0, after.classes[cls].support[party] || 0, ' 点');
        });
        if (patch.parties) Object.keys(patch.parties).forEach(function (party) {
          previewDelta(lines, previewName(W.PARTIES, party) + '全国支持',
            (st.partySupport || {})[party] || 0, (after.partySupport || {})[party] || 0, ' 点');
        });
        if (patch.relations) patch.relations.forEach(function (pair) {
          previewDelta(lines, previewName(W.PARTIES, pair[0]) + '与' + previewName(W.PARTIES, pair[1]) + '关系',
            R.relationOf(st, pair[0], pair[1]), R.relationOf(after, pair[0], pair[1]));
        });
        W.DISTRICTS.forEach(function (district) {
          ['control', 'agitation', 'unemployment'].forEach(function (key) {
            var labels = { control: '控制', agitation: '动荡', unemployment: '失业率' };
            previewDelta(lines, district.zh + '·' + labels[key], st.districts[district.id][key],
              after.districts[district.id][key]);
          });
        });
        previewFields(lines, st.counters, after.counters, PREVIEW_COUNTERS);
        previewFields(lines, st.revenueBoost, after.revenueBoost,
          { porto: '港口收入加成', dogana: '关税收入加成', consumo: '消费税收入加成', reddito: '所得税收入加成' });
        previewDelta(lines, '联盟凝聚力', st.coalition.cohesion, after.coalition.cohesion);
        after.coalition.members.forEach(function (id) {
          if (st.coalition.members.indexOf(id) < 0) lines.push('加入执政联盟：' + previewName(W.PARTIES, id));
        });
        st.coalition.members.forEach(function (id) {
          if (after.coalition.members.indexOf(id) < 0) lines.push('退出执政联盟：' + previewName(W.PARTIES, id));
        });
        W.PARTIES.forEach(function (party) {
          previewDelta(lines, party.zh + '议会席位', st.assembly[party.id] || 0,
            after.assembly[party.id] || 0, ' 席');
        });
        Object.keys(after.cabinet).forEach(function (ministry) {
          if (after.cabinet[ministry] !== st.cabinet[ministry]) lines.push(
            previewName(W.MINISTRIES, ministry) + '：' + previewName(W.PARTIES, st.cabinet[ministry]) +
            ' → ' + previewName(W.PARTIES, after.cabinet[ministry]));
        });
        Object.keys(after.journals).forEach(function (id) {
          if (!st.journals[id] && after.journals[id]) lines.push('开启日志：' +
            previewName(Meta.JOURNALS, id));
        });
        Object.keys(after.flags).forEach(function (key) {
          if (after.flags[key] !== st.flags[key] && patch.flags && Object.prototype.hasOwnProperty.call(patch.flags, key)) {
            lines.push((PREVIEW_FLAGS[key] || '局势：' + key) + (after.flags[key] ? ' · 生效' : ' · 取消'));
          }
        });
        if (after.pendingCard && after.pendingCard !== st.pendingCard && Eng.CARD_BY_ID[after.pendingCard]) {
          lines.push('接续卡牌：' + Core.L(Eng.CARD_BY_ID[after.pendingCard].name));
        }
        if (after.phase !== st.phase && after.phase !== 'ended') {
          var phaseNames = { event: '事件', action: '行动', exile: '流亡', occupied: '占领' };
          lines.push('局势阶段：' + (phaseNames[after.phase] || after.phase));
        }
        after.eventQueue.forEach(function (id) {
          if (st.eventQueue.indexOf(id) < 0 && Eng.EVENT_BY_ID[id])
            lines.push('加入待办事件：' + Core.L(Eng.EVENT_BY_ID[id].title));
        });
        if (type === 'RESOLVE_EVENT' && after.currentEvent && after.currentEvent !== st.currentEvent && Eng.EVENT_BY_ID[after.currentEvent]) {
          lines.push('后续事件：' + Core.L(Eng.EVENT_BY_ID[after.currentEvent].title));
        }
        if (after.ending && after.ending !== st.ending) lines.push('结局：' + previewName(Meta.ENDINGS, after.ending));
        if (after.achievements.length > st.achievements.length) after.achievements.forEach(function (id) {
          if (st.achievements.indexOf(id) < 0) lines.push('解锁成就：' + previewName(Meta.ACHIEVEMENTS, id));
        });
        return lines.length ? lines : ['无即时数值变化'];
      } catch (e) {
        return ['效果预览不可用'];
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
