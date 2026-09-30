/* ==========================================================================
   展示层 · 左侧边栏
   对应《自由未烬》src/components/SidePanel.tsx。
   区块（全部可折叠）：
     IL COMANDANTE  指挥官
     政党支持率      十个政党，按选举名单分组，含相对上月的增减
     阶层民意        九个阶层：首选党、对军团兵的支持、投票率/组织/战斗性
     派系            军团兵运动内部的四个派系
     执政官会议      七位执政官
     国家精神        生效中的修正
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core, root.Fiume.World, root.Fiume.Rules, root.Fiume.Sel,
    root.Fiume.UI, root.Fiume.Orn, root.Fiume.Charts);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.UI = root.Fiume.UI || {};
  root.Fiume.UI.SidePanel = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this,
  function (Core, W, R, Sel, UI, Orn, Charts) {
    'use strict';
    var h = Core.h, T = UI.T, frame = UI.frame, field = UI.field, bar = UI.bar, section = UI.section;
    var icon = UI.icon;

    var S = {};

    /* ------------------------------------------------------ IL COMANDANTE */
    function comandante(st, act) {
      var party = W.PARTY_BY_ID[st.playerForce] || W.PARTY_BY_ID.LEG;
      var leader = party.leader;
      var mine = Sel.support(st).national.filter(function (p) { return p.id === party.id; })[0];
      return frame('comandante', [
        h('div', { class: 'comandante__ph' }, [
          h('img', { class: leader.portrait ? '' : 'comandante__emblem', src: leader.portrait || party.emblem, alt: Core.L(leader) }),
          h('div', { class: 'comandante__frame', 'aria-hidden': 'true' }),
          // The name and the office sit inside the frame, on the band the
          // photograph leaves clear at its foot, rather than in a strip below.
          h('div', { class: 'comandante__name' }, [
            h('div', { class: 'comandante__n' }, leader.zh || Core.L(leader)),
            h('div', { class: 'comandante__r' }, party.id === 'LEG' ? T('cmd.sub') : (party.zh || ''))
          ]),
          !leader.portrait ? h('div', { class: 'comandante__photo-note' }, T('start.portraitPending')) : null,
        ]),
        h('div', { class: 'comandante__body' }, [
          party.id === 'LEG' ? field('运动成员', Core.fmt(st.militants)) : field('全国支持', (mine ? mine.value : 0).toFixed(1) + '%'),
          party.id === 'LEG' ? field(T('cmd.dissenso'), R.factionDissent(st).toFixed(1)) : field('议会席位', String(st.assembly[party.id] || 0)),
        ])
      ]);
    }

    /* ---------------------------------------------------------- LE TRE MISURE */
/* Legion public opinion, the leader's authority and popular fervour sit
   together under the portrait: the three numbers that describe the movement's
   own condition rather than the city's. */
function gauges(st) {
  var rows = [
    { zh: '军团民意', v: st.legitimacy,
      hint: '各阶层对军团的支持，按阶层人口加权；不计投票率。' },
    { zh: '领袖权威', v: st.order.authority,
      hint: '命令被执行的程度。财政欠款会削弱它，公共秩序法会加强它。' },
    { zh: '民众狂热', v: st.order.fervour,
      hint: '街头的亢奋。它推高紧张度，既是本钱也是危险。' }
  ];
  var body = h('div', { class: 'cmdr-gauge' });
  rows.forEach(function (r) {
    body.appendChild(h('div', { class: 'field', title: r.hint }, [
      h('div', { class: 'cmdr-gauge__h' }, [
        h('span', { class: 'cmdr-gauge__k' }, r.zh),
        h('span', { class: 'cmdr-gauge__v' }, r.v.toFixed(1))
      ]),
      bar(r.v, 100, 'var(--gold)')
    ]));
  });
  return frame('', [body]);
}

/* Party support */
    function partySupport(st) {
      var sup = Sel.support(st);
      var groups = {};
      sup.national.forEach(function (p) {
        (groups[p.list] = groups[p.list] || []).push(p);
      });
      var lists = Object.keys(groups).map(function (k) {
        var L = W.LIST_BY_ID[k];
        var tot = groups[k].reduce(function (a, x) { return a + x.value; }, 0);
        return { id: k, L: L, members: groups[k], total: tot };
      }).sort(function (a, b) { return b.total - a.total; });

      var body = [];
      lists.forEach(function (g) {
        var L = g.L || { zh: g.id, color: '#888' };
        body.push(h('div', { class: 'plist' }, [
          h('span', { class: 'swatch', style: { background: L.color } }),
          h('span', { class: 'plist__n' }, Core.L(L.zh ? L : { zh: g.id })),
          h('span', { class: 'plist__v' }, g.total.toFixed(1) + '%')
        ]));
        g.members.forEach(function (p) {
          body.push(h('div', { class: 'psup' + (p.player ? ' is-player' : '') }, [
            h('span', { class: 'psup__sw', style: { background: p.color } }),
            h('span', { class: 'psup__n', title: p.it }, p.zh),
            h('span', { class: 'psup__k' }, p.short),
            h('span', { class: 'psup__v', style: { color: p.player ? 'var(--gold-lit)' : 'rgba(233,220,188,.86)' } },
              p.value.toFixed(1))
          ]));
          body.push(h('div', { class: 'psup__bar' },
            h('i', { style: { width: Math.min(100, p.value * 3.2) + '%', background: p.color } })));
        });
      });
      body.push(h('div', { class: 'tiny dim2', style: { marginTop: '7px', lineHeight: 1.55 } },
        '按阶层人口加权，未折算投票率与弃权。选举结算见「经济 → 阶层支持度」。'));
      return section('consenso', T('side.consenso'), 'CONSENSO', body, { icon: 'column' });
    }

    /* Social classes */
    function classSupport(st) {
      var sup = Sel.support(st);
      var body = [];
      sup.classes.forEach(function (c) {
        var mine = (c.row.filter(function (x) { return x.id === st.playerForce; })[0] || { v: 0 }).v;
        var top = W.PARTY_BY_ID[c.top];
        body.push(h('div', { class: 'cls', title: c.note || '' }, [
          h('div', { class: 'cls__top' }, [
            h('span', { class: 'cls__sw', style: { background: top.color } }),
            h('span', { class: 'cls__n' }, c.zh),
            h('span', { class: 'cls__pop' }, String(c.pop)),
            h('span', { class: 'cls__v', style: { color: mine > 0 ? 'var(--gold-lit)' : 'rgba(233,220,188,.4)' } },
              mine.toFixed(0) + '%')
          ]),
        ]));
      });
      body.push(h('div', { class: 'tiny dim2', style: { marginTop: '6px' } },
        '金色数字 = 该阶层里' + (W.PARTY_BY_ID[st.playerForce] || W.PARTY_BY_ID.LEG).zh + '的支持份额。右侧三条为该阶层的投票率 / 组织渗透 / 战斗性。'));
      return section('classi', T('side.classi'), 'CLASSI', body, { icon: 'industria', defaultOpen: false });
    }

    /* Factions */
    function factions(st) {
      var f = Sel.factions(st);
      var body = [
        h('div', { class: 'row row--between', style: { marginBottom: '7px' } }, [
          h('span', { class: 'tiny dim' }, T('ideologia.diss') + ' ' + f.dissent.toFixed(1)),
          h('span', { class: 'chip ' + (f.dissent < 20 ? 'chip--ok' : f.dissent < 35 ? 'chip--warn' : 'chip--bad') },
            T('ideologia.unity') + ' ' + f.unity.toFixed(0) + '%')
        ])
      ];
      f.list.forEach(function (x) {
        body.push(h('div', { class: 'fac', title: x.blurb }, [
          h('div', { class: 'fac__top' }, [
            h('span', { class: 'swatch', style: { background: x.color } }),
            h('span', { class: 'fac__n' }, x.zh),
            h('span', { class: 'fac__i' }, x.inf.toFixed(0) + ' · ' + x.dis.toFixed(0))
          ]),
          h('div', { class: 'fac__bars' }, [
            (function () { var d = h('div', {}, [h('div', { class: 'fac__lb' }, T('ideologia.inf'))]); d.appendChild(bar(x.inf, 45, x.color)); return d; })(),
            (function () { var d = h('div', {}, [h('div', { class: 'fac__lb' }, T('ideologia.dis'))]); d.appendChild(bar(x.dis, 100, x.dis > 50 ? '#A31621' : x.dis > 30 ? '#C9A227' : '#7BA05B')); return d; })()
          ])
        ]));
      });
      return section('correnti', T('ideologia.title'), 'CORRENTI', body, { icon: 'fasces' });
    }

    /* Consiglio dei Rettori */
    function cabinet(st) {
      var ret = Sel.rettori(st);
      var grid = h('div', { class: 'cabinet' });
      ret.forEach(function (m) {
        grid.appendChild(h('div', { class: 'cab', title: m.it + (m.holder ? ' — ' + m.holder : '') }, [
          UI.avatar(UI.HOLDER_AVATAR[m.id], (m.holder || m.zh).slice(0, 1), 'cab__f'),
          h('div', { class: 'cab__n' }, m.zh)
        ]));
      });
      var body = [grid, h('div', { class: 'divider' }, icon('fasces', 11))];
      ret.forEach(function (m) {
        body.push(h('div', { class: 'field', title: m.it + (m.holder ? ' · ' + m.holder : '') }, [
          h('span', { class: 'field__k' }, m.zh),
          h('span', {
            class: 'field__v',
            style: { color: m.mine ? 'var(--gold-lit)' : 'rgba(233,220,188,.55)' }
          }, m.holder ? m.holder : m.ownerZh)
        ]));
      });
      return section('gabinetto', T('gab.title'), T('gab.sub'), body, { icon: 'column', defaultOpen: false });
    }

    /* National spirits */
    function spirits(st) {
      var sp = Sel.spirits(st);
      var body = [];
      if (!sp.length) body.push(h('div', { class: 'empty' }, '—'));
      sp.forEach(function (x) {
        body.push(h('div', { class: 'spirit' }, [
          icon(x.icon, 15), h('span', { class: 'spirit__n' }, x.zh), h('span', { class: 'spirit__v' }, x.v)
        ]));
      });
      return section('spirito', T('spirito.title'), T('spirito.sub'), body, { icon: 'star', defaultOpen: false });
    }

    /* Assembly */
    S.render = function (st, ui, act) {
      var col = h('div', { class: 'side' });
      col.appendChild(comandante(st, act));
      col.appendChild(gauges(st));
      // Factions live in the side panel: they are the movement's internal
      // line struggle and are read every month, not browsed occasionally.
      col.appendChild(factions(st));
      return col;
    };

    S.archive = function (st) {
      var col = h('div', { class: 'col archive-social' });
      col.appendChild(partySupport(st));
      col.appendChild(classSupport(st));
      return col;
    };

    /* National spirits and the journal live in the right column. */
    S.spiritsBlock = function (st) { return spirits(st); };

    return S;
  });
