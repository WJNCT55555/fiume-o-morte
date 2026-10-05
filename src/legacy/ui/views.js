/* ==========================================================================
   UI · 视图层（装饰艺术 / 宣传画风格）
   所有展示数据来自 Sel.*（read model），组件内不做业务推导。
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core, root.Fiume.World, root.Fiume.Meta, root.Fiume.Rules,
    root.Fiume.Engine, root.Fiume.Sel, root.Fiume.Charts, root.Fiume.MapView, root.Fiume.Orn,
    root.Fiume.I18N, root.Fiume.UI);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Views = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this,
  function (Core, W, Meta, R, Eng, Sel, Charts, MapView, Orn, I18N, UI) {
    'use strict';
    var V = {}, h = Core.h;

    /** UI strings (translatable); content nodes go through Core.L and Sel.* */
    function T(key, vars) { return I18N.t(key, vars); }
    V.T = T;

    V.IMG = UI.IMG;
    var ADV_AVATAR = {
      deambris: V.IMG.deambris, keller: V.IMG.keller, carli: V.IMG.carli,
      blasich: V.IMG.blasich, grossich: V.IMG.grossich
    };
    var HOLDER_AVATAR = {
      esteri: V.IMG.comandante, difesa: V.IMG.hostventuri
    };
    var EVENT_PHOTO = [
      ['ev_1920_09_carta', V.IMG.proclama], ['ev_1920_10_blocco', V.IMG.porto],
      ['ev_1920_11_rapallo', V.IMG.scudetto], ['ev_natale', V.IMG.foto_fiume],
      ['ev_natale_fight', V.IMG.foto_fiume], ['ev_natale_deal', V.IMG.proclama],
      ['ev_natale_after', V.IMG.esilio], ['ev_1921_04_elezioni', V.IMG.proclama],
      ['ev_coup', V.IMG.hostventuri],
      /* ev_1922_10_roma was removed with the 1922 march line. */
      ['ev_1924_01_rome', V.IMG.giolitti]
    ];

    function icon(name, size, cls) { return Orn.icon(name, { size: size || 18, cls: cls }); }

    function frame(cls, children, corners) {
      var el = h('div', { class: 'frame' + (cls ? ' ' + cls : '') });
      if (corners !== false) el.appendChild(Orn.corners());
      (children || []).forEach(function (c) { if (c) el.appendChild(c); });
      return el;
    }
    function banner(title, sub) {
      return h('div', { class: 'banner' }, [
        h('div', { class: 'banner__t' }, title),
        sub ? h('div', { class: 'banner__s' }, Core.sub(sub)) : null
      ]);
    }
    function ptitle(txt, extra) {
      var el = h('div', { class: 'ptitle' }, [h('span', {}, txt), extra || null]);
      return el;
    }
    function field(k, v, strong) {
      return h('div', { class: 'field' + (strong ? ' field--strong' : '') }, [
        h('span', { class: 'field__k' }, k), h('span', { class: 'field__v' }, v)
      ]);
    }
    function bar(v, max, color, cls) {
      var b = h('div', { class: 'bar' + (cls ? ' ' + cls : '') });
      b.appendChild(h('div', { class: 'bar__fill', style: { width: Core.clamp(v / (max || 100) * 100, 0, 100) + '%', background: color } }));
      return b;
    }
    function deltaChip(n, invert) {
      var good = invert ? n < 0 : n > 0;
      var bad = invert ? n > 0 : n < 0;
      var cls = n === 0 ? 'delta-flat' : (good ? 'delta-up' : (bad ? 'delta-dn' : 'delta-flat'));
      var arrow = n > 0 ? '▲' : n < 0 ? '▼' : '·';
      return h('span', { class: 'resslot__d ' + cls }, arrow + Core.fmt(Math.abs(n)));
    }
    function avatar(img, letter, cls) {
      var el = h('div', { class: cls || 'adv__av' });
      if (img) el.appendChild(h('img', { src: img, alt: '', loading: 'lazy', onerror: 'this.remove()' }));
      else el.textContent = letter || '·';
      return el;
    }

    /* ============================================================
       报头
       ============================================================ */
    function masthead() {
      return h('div', { class: 'masthead' }, [
        Orn.mastheadFlourish('l'),
        h('div', { class: 'masthead__c' }, [
          h('div', { class: 'masthead__t' }, ['FIUME O ', h('em', {}, 'MORTE'), '!']),
          h('div', { class: 'masthead__s' }, T('app.motto'))
        ]),
        Orn.mastheadFlourish('r')
      ]);
    }

    /* ============================================================
       资源条
       ============================================================ */
    function resbar(st, ui, act) {
      var res = Sel.resources(st);
      var crisis = Sel.crisis(st);
      var era = Sel.eraYear(st);
      var slots = [h('div', { class: 'resbar__date' }, [
        h('div', { class: 'resbar__d1' }, Core.dateLabel(st.date)),
        h('div', { class: 'resbar__d2' }, T('bar.era') + ' 第 ' + Core.roman(era) + ' 年')
      ])];
      [res[0], res[1], res[3]].forEach(function (r) {
        slots.push(h('div', { class: 'resslot', title: r.it }, [
          h('div', { class: 'medallion' }, icon(r.icon, 19)),
          h('div', { class: 'resslot__b' }, [
            h('div', { class: 'resslot__k' }, r.zh),
            h('div', { class: 'resslot__v' }, [r.main + (r.unit ? ' ' + r.unit : ''), deltaChip(r.delta, r.invert)])
          ])
        ]));
      });
      slots.push(h('div', { class: 'resslot resslot--crisis' }, [
        h('div', { class: 'medallion' }, icon('flame', 19)),
        h('div', { class: 'resslot__b' }, [
          h('div', { class: 'resslot__k' }, '事态'),
          h('div', { class: 'resslot__v' }, Math.round(crisis.coup) + ' / 100')
        ])
      ]));
      slots.push(h('div', { class: 'resslot resslot--ap' }, [
        h('div', { class: 'resslot__b' }, [
          h('div', { class: 'resslot__k' }, '本回合行动点'),
          h('div', { class: 'resslot__v' }, st.ap + ' / ' + st.maxAp)
        ])
      ]));
      slots.push(h('div', { class: 'resbar__motto' }, [
        h('button', {
          class: 'evboard-btn', title: T('set.open'),
          onclick: act.openSettings
        }, [icon('gear', 13), T('set.open')]),
      ]));
      return h('div', { class: 'resbar' }, slots);
    }

    /* ============================================================
       地图面板
       ============================================================ */
    function mapPanel(st, ui, act) {
      var dists = Sel.districts(st);
      var units = (W.FIUME_UNITS || []).filter(function (u) { return !u.allied || st.date.y === 1919; }).map(function (u) {
        return {
          id: u.id, zh: u.zh, lon: u.lon, lat: u.lat, kind: u.kind,
          allied: !!u.allied, count: null
        };
      });
      var canvas = h('div', { class: 'mapcanvas' });
      var mapEl = MapView.render({ districts: dists, units: units, selected: ui.district, date: st.date });
      Core.on(mapEl, 'click', function (e) {
        var g = e.target.closest ? e.target.closest('g.mp') : null;
        if (!g) return;
        if (g.dataset.id && dists.some(function (d) { return d.id === g.dataset.id; })) act.selectDistrict(g.dataset.id);
      });
      Core.on(mapEl, 'keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var g = e.target.closest ? e.target.closest('g.mp') : null;
        if (!g || !g.dataset.id) return;
        e.preventDefault();
        act.selectDistrict(g.dataset.id);
      });
      canvas.appendChild(mapEl);
      canvas.appendChild(h('div', { class: 'mapcanvas__title' }, 'CARTA DI FIUME · ' + st.date.y));
      canvas.appendChild(h('div', { class: 'mapcanvas__controls' }, [
        h('button', { class: 'mapcanvas__zoom', title: '放大地图', onclick: function () { MapView.zoomBy(1.35); } }, '+'),
        h('button', { class: 'mapcanvas__zoom', title: '缩小地图', onclick: function () { MapView.zoomBy(1 / 1.35); } }, '−'),
        h('button', { class: 'mapcanvas__zoom mapcanvas__zoom--reset', title: '恢复地图', onclick: function () { MapView.resetZoom(); } }, '⤢')
      ]));
      var chosen = dists.filter(function (d) { return d.id === ui.district; })[0];
      var detail = chosen ? frame('district-detail', [
        banner(chosen.zh, chosen.it),
        h('div', { class: 'district-detail__body' }, [
          field('控制', Math.round(chosen.control) + ' / 100', true),
          field('动荡', Math.round(chosen.agitation) + ' / 100'),
          h('div', { class: 'small dim' }, chosen.note + '。地图为地点示意，非 1919 年官方行政区划。')
        ])
      ]) : null;
      return h('div', { class: 'col' }, [
        frame('', [
          h('div', { class: 'row row--between', style: { padding: '5px 9px', borderBottom: '1px solid var(--hair-soft)' } }, [
            h('div', { class: 'row', style: { gap: '7px' } }, [
              h('span', { class: 'chip' }, '阜姆及周边 · ' + dists.length + ' 个地点')
            ]),
            h('span', { class: 'tiny dim2' }, '海岸 © OpenStreetMap · 占领范围随日期变化')
          ]),
          canvas,
          MapView.legend(st.date)
        ]),
        detail
      ]);
    }

    /** Territory strip below the map: control and agitation for key districts */
    function territoryStrip(st, dists, act) {
      var pick = ['centro', 'porto', 'plase', 'drenova', 'srdoci', 'susak'];
      var row = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(146px,1fr))', gap: '8px', padding: '9px 11px' } });
      pick.forEach(function (id) {
        var d = dists.filter(function (x) { return x.id === id; })[0];
        if (!d) return;
        var stl = MapView.STATUS_STYLE[d.status] || MapView.STATUS_STYLE.fiume;
        var cell = h('div', {
          class: 'pick' + (st.selected === id ? ' is-on' : ''),
          style: { marginBottom: '0', padding: '7px 9px' },
          onclick: function () { act.selectDistrict(id); }
        }, [
          h('div', { class: 'row row--between' }, [
            h('div', { class: 'pick__n', style: { fontSize: '13px' } }, d.zh),
            h('span', { class: 'swatch', style: { background: stl.color } })
          ]),
          h('div', { class: 'tiny dim2', style: { margin: '2px 0 5px', fontStyle: 'italic' } }, d.it),
          (function () {
            var b = h('div', {});
            b.appendChild(h('div', { class: 'row row--between tiny' }, [
              h('span', { class: 'dim' }, T('terr.control')), h('span', { class: 'num' }, d.control.toFixed(0))
            ]));
            b.appendChild(bar(d.control, 100, 'linear-gradient(90deg,#7C0023,#C9A227,#7BA05B)'));
            b.appendChild(h('div', { class: 'row row--between tiny', style: { marginTop: '4px' } }, [
              h('span', { class: 'dim' }, T('terr.agit')), h('span', { class: 'num' }, d.agitation.toFixed(0))
            ]));
            b.appendChild(bar(d.agitation, 100, d.agitation > 50 ? '#C8342E' : d.agitation > 30 ? '#C9A227' : '#7BA05B'));
            return b;
          })()
        ]);
        row.appendChild(cell);
      });
      return h('div', { class: 'col' }, [frame('', [banner(T('terr.title'), T('terr.sub')), row])]);
    }

    /* ============================================================
       右栏：事件与决策
       ============================================================ */
    /* ============================================================
       右栏 · 事件看板摘要
       完整的决策在弹窗里（对应《自由未烬》EventBoard + SuperEvent 的双层结构）；
       这里只列出本月事件、当前待决与入口。
       ============================================================ */
    function eventPanel(st, act) {
      var rows = UI.EventBoard.list(st);
      var cur = rows.filter(function (r) { return r.state === 'current'; })[0] || null;
      var pending = rows.filter(function (r) { return r.state !== 'done'; });
      var body = h('div', {});

      if (!pending.length) {
        body.appendChild(h('div', { class: 'decpanel__ttl' }, [T('ev.none')]));
        body.appendChild(h('div', { class: 'decpanel__bd' }, [
          h('div', { class: 'tiny dim', style: { marginBottom: '9px' } }, T('ev.none.body')),
          h('button', {
            class: 'btn btn--primary btn--block', onclick: act.advance
          }, T('btn.next'))
        ]));
      } else {
        var list = h('div', { style: { padding: '9px 11px' } });
        pending.forEach(function (r) {
          var tag = r.state === 'current' ? T('evboard.tag.current') : r.state === 'queued' ? T('evboard.tag.queued') : T('evboard.tag.done');
          list.appendChild(h('div', {
            class: 'row',
            style: {
              gap: '8px', padding: '6px 0', alignItems: 'flex-start',
              borderBottom: '1px solid rgba(201,162,39,.1)',
              opacity: r.state === 'done' ? .42 : 1
            }
          }, [
            h('span', {
              class: 'cmatrix__dot', style: { background: r.state === 'current' ? 'var(--crimson)' : r.state === 'queued' ? 'var(--gold)' : 'rgba(233,220,188,.4)', marginTop: '6px' }
            }),
            h('div', { class: 'flex1' }, [
              h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: r.state === 'current' ? 'var(--gold-pale)' : 'rgba(233,220,188,.86)' } },
                r.ev ? Core.L(r.ev.title) : r.id),
              h('div', { class: 'tiny dim2', style: { marginTop: '1px' } }, 'W' + r.turn + ' · ' + tag)
            ]),
            r.state === 'done' ? null : h('button', {
              class: 'btn btn--sm', onclick: function () { act.selectEvent(r.id); }
            }, T('evboard.view'))
          ]));
        });
        body.appendChild(list);
        if (rows.length > pending.length) body.appendChild(h('div', { class: 'tiny dim2 agenda-done' },
          '已处理 ' + (rows.length - pending.length) + ' 项 · 详见档案'));
        if (cur) {
          body.appendChild(h('div', { style: { padding: '0 11px 11px' } }, [
            h('div', { class: 'tiny dim2', style: { textAlign: 'center' } }, T('ev.hint'))
          ]));
        } else {
          body.appendChild(h('div', { style: { padding: '0 11px 11px' } }, [
            h('button', {
              class: 'btn btn--primary btn--block', onclick: act.advance
            }, T('btn.next'))
          ]));
        }
      }
      return frame('agenda-panel', [
        banner(T('ev.title'), pending.length ? (pending.length + ' IN SOSPESO') : 'NESSUN ORDINE DEL GIORNO'),
        body
      ]);
    }

    function consiglieriPanel(st, act) {
      var av = Sel.advisors(st);
      var body = h('div', { style: { padding: '8px 11px' } }, [
        h('div', { class: 'tiny dim2', style: { marginBottom: '6px' } },
          T('adv.seated', { a: st.advisors.active.length, b: 3 }) + ' · ' +
          T('adv.cooldown', { n: Math.max(0, st.advisors.cooldown - (st.turn - st.advisors.lastAction)) }))
      ]);
      av.forEach(function (a) {
        var row = h('div', { class: 'adv' }, [
          avatar(ADV_AVATAR[a.id], a.zh.slice(0, 1)),
          h('div', { class: 'adv__b' }, [
            h('div', { class: 'adv__n' }, a.zh),
            h('div', { class: 'adv__x' }, a.bio),
            h('div', { class: 'adv__m' }, [
              h('span', { class: 'chip' }, [h('span', { class: 'swatch', style: { background: a.factionColor } }), a.factionZh]),
              h('span', { class: 'chip ' + (a.dissent > 60 ? 'chip--bad' : a.dissent > 40 ? 'chip--warn' : '') }, T('adv.dissent', { n: a.dissent }))
            ]),
            (function () {
              var btns = h('div', { class: 'row', style: { gap: '5px', marginTop: '3px' } });
              if (a.active) {
                btns.appendChild(h('button', {
                  class: 'btn btn--sm', disabled: a.cdLeft > 0 || st.ap < 1,
                  onclick: function () { act.useAdvisor(a.id); }
                }, a.cdLeft > 0 ? T('adv.cooling', { n: a.cdLeft }) : Core.L(a.action)));
                btns.appendChild(h('button', { class: 'btn btn--sm btn--ghost', onclick: function () { act.fireAdvisor(a.id); } }, T('btn.fire')));
              } else {
                btns.appendChild(h('button', {
                  class: 'btn btn--sm btn--ghost', disabled: !a.unlocked,
                  onclick: function () { act.hireAdvisor(a.id); }
                }, a.unlocked ? T('btn.hire') : T('btn.locked')));
              }
              return btns;
            })()
          ])
        ]);
        body.appendChild(row);
      });
      return frame('', [banner(T('adv.title'), T('adv.sub')), body]);
    }

    /* One labelled block inside an expanded journal: a heading plus a list.
       Empty lists collapse to a single "none" line, which is how a journal
       with no failure path (esilio) reads. */
    function jrnBlock(title, items) {
      var box = h('div', { class: 'jrn__block' });
      box.appendChild(h('div', { class: 'jrn__block-k' }, title));
      var list = h('ul', { class: 'jrn__list' });
      if (items && items.length) {
        items.forEach(function (x) { list.appendChild(h('li', {}, Core.L(x))); });
      } else {
        list.appendChild(h('li', { class: 'jrn__none' }, T('dia.noEffect')));
      }
      box.appendChild(list);
      return box;
    }

    function diariPanel(st) {
      var jr = Sel.journals(st);
      var body = h('div', { style: { padding: '8px 11px' } });
      if (!jr.length) body.appendChild(h('div', { class: 'empty' }, T('dia.empty')));
      jr.forEach(function (j) {
        var g = j.goal || {}, o = j.outcome || {};
        /* Every activated journal is expandable: completion and failure
           conditions, and what each outcome does. The four blocks come from
           meta.js's goal / outcome fields via Sel.journals. */
        var det = h('details', { class: 'jrn' + (j.done ? ' jrn--done' : j.failed ? ' jrn--fail' : '') }, [
          h('summary', { class: 'jrn__summary' }, [
            h('div', { class: 'jrn__head' }, [
              h('div', { class: 'jrn__title' }, j.zh),
              h('div', { class: 'jrn__desc tiny dim' }, Core.L(j.desc))
            ]),
            h('span', { class: 'chip' + (j.done ? ' chip--ok' : j.failed ? ' chip--bad' : '') },
              j.done ? T('dia.done') : j.failed ? T('dia.failed') : T('dia.months', { n: j.months }))
          ]),
          h('div', { class: 'jrn__body' }, [
            jrnBlock(T('dia.goal'), g.complete),
            jrnBlock(T('dia.fail'), g.fail && g.fail.length ? g.fail : [T('dia.noFail')]),
            jrnBlock(T('dia.onComplete'), o.onComplete),
            jrnBlock(T('dia.onFail'), o.onFail)
          ])
        ]);
        body.appendChild(det);
      });
      return frame('', [banner(T('dia.title'), T('dia.sub')), body]);
    }

    function registroPanel(st) {
      var logs = Sel.log(st);
      var body = h('div', { class: 'logflow' });
      if (!logs.length) body.appendChild(h('div', { class: 'empty' }, T('reg.empty')));
      logs.forEach(function (l) {
        body.appendChild(h('div', { class: 'logline logline--' + l.kind }, [
          h('span', { class: 'logline__t' }, 'W' + l.turn),
          h('span', { class: 'logline__x' }, l.zh)
        ]));
      });
      return frame('', [banner(T('reg.title'), T('reg.sub')), body]);
    }

    /* ============================================================
       中央页签
       ============================================================ */
    /* ============================================================
       Economy
       Laid out the way a political-sim economy screen is usually laid out:
       the two human totals as trends first (unemployment, population), then the
       six port and confidence measures as one comparable block, then the budget
       as two side-by-side donuts. Every figure on this tab is either a chart or
       a labelled readout — no bare rows of numbers.
       ============================================================ */
    function ecoText(zh, it) { return Core.L({ zh: zh, it: it }); }

    function ecoStat(label, value, unit, note, tone) {
      var v = h('div', { class: 'eco-kpi__value num' }, String(value));
      if (unit) v.appendChild(h('span', { class: 'eco-kpi__unit' }, unit));
      return h('div', { class: 'eco-kpi' + (tone ? ' eco-kpi--' + tone : '') }, [
        h('div', { class: 'eco-kpi__label' }, label), v,
        h('div', { class: 'eco-kpi__note' }, note)
      ]);
    }

    /* Six measures on one 0-100 scale, drawn as a grid of compact bars so they
       can be compared at a glance instead of read one by one. The bar sits to the
       left and the label to its right, so a row reads "▬▬▬▬ 腹地通达 20". */
    function ecoMeasureGrid(rows) {
      var grid = h('div', { class: 'ecometrics' });
      rows.forEach(function (r) {
        var cell = h('div', { class: 'ecometric' });
        var track = h('div', { class: 'bar ecometric__bar' });
        track.appendChild(h('div', { class: 'bar__fill', style: { width: Core.clamp(r[1], 0, 100) + '%', background: r[2] } }));
        cell.appendChild(track);
        cell.appendChild(h('span', { class: 'ecometric__k ellip', title: r[0] }, r[0]));
        cell.appendChild(h('span', { class: 'ecometric__v num' }, Core.round1(r[1]).toFixed(0)));
        grid.appendChild(cell);
      });
      return grid;
    }

    function ecoBudget(title, items, total, centerLabel, signed) {
      var box = h('div', { class: 'ecobudget' });
      box.appendChild(h('div', { class: 'ecobudget__hd' }, [
        h('span', {}, title),
        h('span', { class: 'num ' + (signed ? (total >= 0 ? 'up' : 'dn') : '') }, Core.fmt(total) + ' K£')
      ]));
      var body = h('div', { class: 'ecobudget__body' });
      body.appendChild(Charts.donut(items.map(function (it) {
        return { zh: it[0], value: it[1], color: it[2] };
      }), { size: 116, stroke: 15, center: Core.fmt(total), centerSub: centerLabel }));
      var legend = h('div', { class: 'ecobudget__legend' });
      var sum = items.reduce(function (a, it) { return a + Math.max(0, it[1]); }, 0) || 1;
      items.forEach(function (it) {
        legend.appendChild(h('div', { class: 'ecoleg' }, [
          h('span', { class: 'ecoleg__sw', style: { background: it[2] } }),
          h('span', { class: 'ecoleg__k ellip' }, it[0]),
          h('span', { class: 'ecoleg__v num' }, Core.fmt(it[1])),
          h('span', { class: 'ecoleg__p num' }, Math.round(Math.max(0, it[1]) / sum * 100) + '%')
        ]));
      });
      body.appendChild(legend);
      box.appendChild(body);
      return box;
    }

    function ecoFormula(label, formula, current) {
      return h('div', { class: 'eco-formula' }, [
        h('div', { class: 'eco-formula__heading' }, [
          h('strong', {}, label), h('span', { class: 'num' }, current)
        ]),
        h('div', { class: 'eco-formula__math' }, formula)
      ]);
    }

    function ecoFormulaBook(st, ec) {
      var e = st.economy;
      var book = h('details', { class: 'eco-formulas' });
      book.appendChild(h('summary', { class: 'eco-formulas__summary' }, [
        h('span', {}, ecoText('经济模型 · 公式与结算顺序', 'Modello economico · formule e liquidazione')),
        h('span', { class: 'eco-formulas__hint' }, ecoText('展开查看', 'Apri'))
      ]));
      var body = h('div', { class: 'eco-formulas__body' });
      body.appendChild(h('p', { class: 'eco-formulas__intro' }, ecoText(
        '每半月先按当前状态结算收支，再依次更新港口、失业、通胀、信心和人口。目标值不是即时跳变；每轮只追近一部分。clamp 表示限制在括号中的范围。',
        'Ogni mezzo mese si salda il bilancio con lo stato attuale, poi si aggiornano porto, disoccupazione, inflazione, fiducia e popolazione. I valori convergono gradualmente; clamp limita il risultato.'
      )));
      var grid = h('div', { class: 'eco-formulas__grid' });
      var flow = h('section', { class: 'eco-formulas__group' }, [
        h('h4', {}, ecoText('港口 → 生产 → 就业', 'Porto → produzione → lavoro')),
        ecoFormula(ecoText('吞吐目标', 'Obiettivo portuale'),
          ecoText('clamp(11 + 0.32×腹地 + 5×自由港等级 + 0.17×三角洲 + 0.13×工程 + 0.12×承认 − 0.20×暴力 − 0.10×罢工, 0, 100)',
            'clamp(11 + 0.32×entroterra + 5×livello porto franco + 0.17×delta + 0.13×opere + 0.12×riconoscimento − 0.20×violenza − 0.10×scioperi, 0, 100)'),
          ec.trafficTarget.toFixed(1)),
        ecoFormula(ecoText('工业活跃度', 'Attività industriale'),
          ecoText('clamp(0.60×工程 + 0.40×(100 − 罢工), 0, 100)', 'clamp(0.60×opere + 0.40×(100 − scioperi), 0, 100)'), ec.industryActivity.toFixed(1)),
        ecoFormula(ecoText('失业目标', 'Obiettivo disoccupazione'),
          ecoText('clamp(46 − 0.42×当前吞吐 − 0.12×工业活跃度, 4, 45)', 'clamp(46 − 0.42×traffico attuale − 0.12×attività industriale, 4, 45)'), ec.unemploymentTarget.toFixed(1) + '%'),
        ecoFormula(ecoText('通胀目标', 'Obiettivo inflazione'),
          ecoText('clamp(4 + 0.25×max(失业−12, 0) + 0.12×罢工 + 0.004×max(债务−2500, 0), 1, 55)',
            'clamp(4 + 0.25×max(disoccupazione−12, 0) + 0.12×scioperi + 0.004×max(debito−2500, 0), 1, 55)'),
          ec.inflationTarget.toFixed(1) + '%')
      ]);
      var confidence = h('section', { class: 'eco-formulas__group' }, [
        h('h4', {}, ecoText('信心与人口', 'Fiducia e popolazione')),
        ecoFormula(ecoText('资本信心目标', 'Obiettivo fiducia'),
          ecoText('clamp(70 − 0.50×罢工 + 0.25×(吞吐−40) − 0.30×暴力 + 0.20×合法性, 0, 100)',
            'clamp(70 − 0.50×scioperi + 0.25×(traffico−40) − 0.30×violenza + 0.20×legittimità, 0, 100)'),
          ec.confidenceTarget.toFixed(1)),
        ecoFormula(ecoText('迁出人口', 'Emigrazione'),
          ecoText('clamp(20×(失业−12) + 4×(暴力−40), 0, 900)', 'clamp(20×(disoccupazione−12) + 4×(violenza−40), 0, 900)'), Core.fmt(Math.round(ec.emigration))),
        ecoFormula(ecoText('下轮人口', 'Popolazione successiva'),
          ecoText('max(30000, 当前人口 − 迁出人口 + 30)', 'max(30000, popolazione attuale − emigrazione + 30)'), Core.fmt(Math.max(30000, e.population - ec.emigration + 30))),
        ecoFormula(ecoText('每轮追近幅度', 'Convergenza per turno'),
          ecoText('新值 = 旧值 + (目标−旧值)×比例；吞吐 9%，失业 12.5%，通胀 10%，信心 7.5%',
            'nuovo = vecchio + (obiettivo−vecchio)×quota; porto 9%, disoccupazione 12.5%, inflazione 10%, fiducia 7.5%'),
          ecoText('每半月', 'mezzo mese'))
      ]);
      var fiscal = h('section', { class: 'eco-formulas__group eco-formulas__group--wide' }, [
        h('h4', {}, ecoText('每半月财政 · 单位 K£', 'Bilancio semimensile · K£')),
        ecoFormula(T('eco.tax.porto'),
          ecoText('吞吐×3.1×港口税率×(0.75+0.005×资本信心)×(1+港口增收修正)',
            'traffico×3.1×aliquota portuale×(0.75+0.005×fiducia)×(1+bonus portuale)'), Core.fmt(ec.revenue.porto)),
        ecoFormula(T('eco.tax.dogana'),
          ecoText('吞吐×2.5×关税率×(1+0.05×关税法等级)×(1+关税增收修正)',
            'traffico×2.5×aliquota doganale×(1+0.05×livello dazi)×(1+bonus doganale)'), Core.fmt(ec.revenue.dogana)),
        ecoFormula(T('eco.tax.consumo'),
          ecoText('(100−失业率)×0.45×消费税率×(1+消费税增收修正)',
            '(100−disoccupazione)×0.45×aliquota sui consumi×(1+bonus consumi)'), Core.fmt(ec.revenue.consumo)),
        ecoFormula(ecoText('有效所得税率', 'Aliquota effettiva sul reddito'),
          ecoText('财政法 < 2 级为 0；2 级取 max(设定税率, 0.30)；3 级取 max(设定税率, 0.45)',
            'Livello fiscale < 2: 0; livello 2: max(aliquota impostata, 0.30); livello 3: max(aliquota impostata, 0.45)'),
          Math.round(ec.incomeTaxRate * 100) + '%'),
        ecoFormula(T('eco.tax.reddito'),
          ecoText('(100−失业率)×0.70×有效所得税率×(1+所得税增收修正)×(1+0.04×财政法等级)',
            '(100−disoccupazione)×0.70×aliquota effettiva×(1+bonus reddito)×(1+0.04×livello fiscale)'), Core.fmt(ec.revenue.reddito)),
        ecoFormula(T('eco.spending'),
          ecoText('行政 42 + 市警 (6+警员/40) + 军团 (人数×0.013) + 工程 (工程/100×12) + 债务 (债务×0.0035) + 救济 (max(失业−12,0)×1.7 + 劳动保障等级×2)',
            'amministrazione 42 + polizia (6+agenti/40) + legione (uomini×0.013) + opere (opere/100×12) + interessi (debito×0.0035) + soccorso (max(disoccupazione−12,0)×1.7 + tutele×2)'), Core.fmt(ec.spending.total)),
        ecoFormula(T('eco.net'),
          ecoText('四项收入合计 − 六项支出合计；盈余的最多 50% 用于偿债，赤字先用储备，再按 1.15 倍举债；债务达到 6500 后记入欠款。',
            'Quattro entrate meno sei spese; fino al 50% dell’avanzo ripaga il debito. Il disavanzo usa le riserve, poi genera debito ×1.15; da 6500 viene registrato come arretrato.'),
          Core.signed(ec.net, 1))
      ]);
      grid.appendChild(flow); grid.appendChild(confidence); grid.appendChild(fiscal);
      body.appendChild(grid); book.appendChild(body);
      return book;
    }

    function tabEconomia(st) {
      var ec = Sel.economy(st);
      var col = h('div', { class: 'col' });
      var body = h('div', { class: 'eco-dashboard' });

      body.appendChild(h('div', { class: 'eco-kpis' }, [
        ecoStat(T('eco.net'), Core.signed(ec.net, 1), ' K£',
          ecoText('预计每半月收支', 'Saldo previsto ogni mezzo mese'), ec.net >= 0 ? 'good' : 'bad'),
        ecoStat(T('eco.debt'), Core.fmt(ec.debt), ' K£',
          ecoText('盈余会逐步偿债', 'Il surplus ripaga il debito'), 'bad'),
        ecoStat(T('cri.unemp'), ec.unemployment.toFixed(1), '%',
          ecoText('目标 ' + ec.unemploymentTarget.toFixed(1) + '%', 'Obiettivo ' + ec.unemploymentTarget.toFixed(1) + '%'), ec.unemployment > 25 ? 'bad' : ''),
        ecoStat(T('eco.infl'), ec.inflation.toFixed(1), '%',
          ecoText('目标 ' + ec.inflationTarget.toFixed(1) + '%', 'Obiettivo ' + ec.inflationTarget.toFixed(1) + '%'), ec.inflation > 16 ? 'bad' : '')
      ]));

      body.appendChild(h('div', { class: 'eco-sectionhead' }, [
        h('span', {}, T('eco.blocks.port')),
        h('small', {}, ecoText('指标 0—100 · 每半月结算', 'Indici 0—100 · ogni mezzo mese'))
      ]));
      body.appendChild(h('div', { class: 'ecoport-grid' }, [(function () {
        var head = h('div', { class: 'ecometric--lead' });
        head.appendChild(h('div', { class: 'ecometric__hd' }, [
          h('span', { class: 'ecometric__k' }, T('eco.traffic')),
          h('span', { class: 'ecometric__v num' }, ec.traffic.toFixed(1))
        ]));
        head.appendChild(h('div', { class: 'eco-target' }, [
          h('span', {}, ecoText('当前目标', 'Obiettivo attuale')),
          h('strong', { class: 'num' }, ec.trafficTarget.toFixed(1))
        ]));
        var tr = h('div', { class: 'bar eco-trafficbar' });
        tr.appendChild(h('div', { class: 'bar__fill', style: { width: Core.clamp(ec.traffic, 0, 100) + '%' } }));
        tr.appendChild(h('div', { class: 'eco-trafficbar__target', style: { left: Core.clamp(ec.trafficTarget, 0, 100) + '%' } }));
        head.appendChild(tr);
        head.appendChild(h('div', { class: 'eco-leadnote' }, ecoText('金线标记目标；吞吐影响税收、就业与政治支持', 'La linea dorata indica l’obiettivo; il porto incide su entrate, lavoro e consenso')));
        if (st.series.traffic.length > 1) head.appendChild(Charts.lines([{ values: st.series.traffic, color: '#EBD07A', fill: 'rgba(201,162,39,.14)' }], { height: 86, grid: 2, floor0: true }));
        return head;
      })(), ecoMeasureGrid([
        [T('eco.hinterland'), ec.hinterland, '#6E8B3D'],
        [T('eco.delta'), ec.delta, '#3E8E7E'],
        [T('eco.works'), ec.works, '#D8AC63'],
        [T('eco.recognition'), ec.recognition, '#3C7FA8'],
        [T('eco.strike'), ec.strike, '#A31621'],
        [T('eco.confidence'), ec.capitalConfidence, '#C9A227']
      ])]));

      body.appendChild(h('div', { class: 'eco-sectionhead' }, [
        h('span', {}, ecoText('人口与就业轨迹', 'Popolazione e lavoro')),
        h('small', {}, ecoText('随半月结算更新', 'Aggiornamento semimensile'))
      ]));
      var trendRow = h('div', { class: 'ecotrends' });
      [[T('cri.unemp'), st.series.unemployment, '%', '#A31621', 'rgba(163,22,33,.16)'],
       [T('cri.pop'), st.series.population, '', '#3C7FA8', 'rgba(60,127,168,.16)']].forEach(function (cfg) {
        var cell = h('div', { class: 'ecotrend' });
        var last = cfg[1].length ? cfg[1][cfg[1].length - 1] : 0;
        var prev = cfg[1].length > 1 ? cfg[1][cfg[1].length - 2] : last;
        var delta = last - prev;
        /* Label on its own line, figure on the next: the two collided when they
           shared a baseline (the traffic caption is a long string). */
        cell.appendChild(h('div', { class: 'ecotrend__k' }, cfg[0]));
        cell.appendChild(h('div', { class: 'ecotrend__row' }, [
          h('span', { class: 'ecotrend__v num' }, cfg[2] === '%' ? last.toFixed(1) + '%' : Core.fmt(last)),
          h('span', { class: 'ecotrend__d num ' + (delta > 0 ? 'up' : delta < 0 ? 'dn' : 'dim2') },
            (delta > 0 ? '+' : '') + (cfg[2] === '%' ? delta.toFixed(1) : Core.fmt(delta)))
        ]));
        if (cfg[1].length > 1) cell.appendChild(Charts.lines([{ values: cfg[1], color: cfg[3], fill: cfg[4] }],
          { height: 82, grid: 3, floor0: true }));
        else cell.appendChild(h('div', { class: 'ecotrend__empty' }, ecoText('下次结算后形成趋势', 'La tendenza apparirà al prossimo turno')));
        trendRow.appendChild(cell);
      });
      body.appendChild(trendRow);
      body.appendChild(h('div', { class: 'eco-sectionhead' }, [
        h('span', {}, T('eco.blocks.budget')),
        h('small', {}, ecoText('按当前状态预估', 'Stima sullo stato attuale'))
      ]));
      body.appendChild(h('div', { class: 'ecobudgets' }, [
            ecoBudget(T('eco.revenue'), [
              [T('eco.tax.porto'), ec.revenue.porto, '#C9A227'],
              [T('eco.tax.dogana'), ec.revenue.dogana, '#6E8B3D'],
              [T('eco.tax.consumo'), ec.revenue.consumo, '#A31621'],
              [T('eco.tax.reddito'), ec.revenue.reddito, '#3C7FA8']
            ], ec.revenue.total, T('eco.revShort')),
            ecoBudget(T('eco.spending'), [
              [T('eco.legion'), ec.spending.legion || 0, '#A31621'],
              [T('eco.admin'), ec.spending.admin || 0, '#6E8B3D'],
              [T('eco.police'), ec.spending.police || 0, '#3C7FA8'],
              [T('eco.relief'), ec.spending.relief || 0, '#D8AC63'],
              [T('eco.worksS'), ec.spending.works || 0, '#8A6FB0'],
              [T('eco.debtS'), ec.spending.debt || 0, '#8A2A2A']
            ], ec.spending.total, T('eco.spShort'))
      ]));
      if (ec.arrears > 0) body.appendChild(h('div', { class: 'eco-arrears' }, [
        h('span', {}, T('eco.arrears')), h('strong', { class: 'num' }, Core.fmt(ec.arrears) + ' K£')
      ]));
      body.appendChild(ecoFormulaBook(st, ec));
      col.appendChild(frame('', [banner(T('eco.title'), T('eco.sub')), body]));

      return col;
    }
    var actTax = null;
    function act_setTax(k, v) { if (actTax) actTax.setTax(k, v); }

    /* ============================================================
       Advisor row (mirrors the card deck row)
       Three horizontal slots plus one deck. Picking an advisor from the deck
       seats them in a free slot; a seated advisor can act or be dismissed.
       ============================================================ */
    function advisorRow(st, act) {
      var av = Sel.advisors(st);
      var seated = av.filter(function (a) { return a.active; });
      var pool = av.filter(function (a) { return !a.active && a.unlocked; });
      var row = h('div', { class: 'advslots' });

      for (var i = 0; i < 3; i++) {
        var a = seated[i];
        if (!a) {
          row.appendChild(h('div', { class: 'advslot advslot--empty' }, [
            h('div', { class: 'advslot__i' }, String(i + 1)),
            h('div', { class: 'advslot__e' }, T('adv.empty'))
          ]));
          continue;
        }
        var canAct = a.cdLeft <= 0;
        var card = h('div', { class: 'advslot advslot--full' });
        card.appendChild(h('div', { class: 'advslot__top' }, [
          avatar(ADV_AVATAR[a.id], a.zh.slice(0, 1)),
          h('div', { class: 'advslot__hd' }, [
            h('div', { class: 'advslot__n' }, a.zh),
            h('div', { class: 'advslot__f', style: { color: a.factionColor } },
              a.factionZh + (a.external ? '' : ' · ' + T('adv.diss') + ' ' + a.dissent.toFixed(1)))
          ])
        ]));
        card.appendChild(h('div', { class: 'advslot__bio' }, a.bio));
        card.appendChild(h('div', { class: 'advslot__act' }, Core.L(a.action)));
        card.appendChild(h('div', { class: 'row', style: { gap: '6px', marginTop: 'auto' } }, [
          h('button', {
            class: 'btn btn--sm flex1', disabled: !canAct,
            onclick: function () { act.useAdvisor(a.id); }
          }, canAct ? T('adv.act') : T('adv.wait', { n: a.cdLeft })),
          h('button', {
            class: 'btn btn--sm btn--ghost', title: T('adv.fire'),
            onclick: function () { act.fireAdvisor(a.id); }
          }, '✕')
        ]));
        row.appendChild(card);
      }

      var drawable = pool.length > 0 && seated.length < 3;
      row.appendChild(h('button', {
        class: 'advdeck' + (drawable ? '' : ' is-off'),
        disabled: !drawable,
        onclick: function () { act.openAdvisorDeck(); }
      }, [
        h('div', { class: 'advdeck__ic' }, icon('laurel', 22)),
        h('div', { class: 'advdeck__b' }, [
          h('div', { class: 'advdeck__n' }, T('adv.deck')),
          h('div', { class: 'advdeck__s' },
            seated.length >= 3 ? T('adv.full') : (pool.length ? T('adv.pick') + ' · ' + pool.length : T('adv.none')))
        ])
      ]));

      return frame('', [
        banner(T('adv.title'), 'CONSIGLIERI'),
        h('div', { style: { padding: '9px 11px' } }, row)
      ]);
    }

    /* Deck picker for advisors. */
    V.advisorDeckModal = function (st, act) {
      var pool = Sel.advisors(st).filter(function (a) { return !a.active && a.unlocked; });
      var bd = h('div', { class: 'modal__body' });
      if (!pool.length) {
        bd.appendChild(h('div', { class: 'evboard__empty' }, T('adv.none')));
      } else {
        var list = h('div', { class: 'decklist' });
        pool.forEach(function (a) {
          list.appendChild(h('button', {
            class: 'deckrow', onclick: function () { act.hireAdvisor(a.id); }
          }, [
            avatar(ADV_AVATAR[a.id], a.zh.slice(0, 1)),
            h('div', { class: 'deckrow__b' }, [
              h('div', { class: 'deckrow__n' }, a.zh),
              h('div', { class: 'deckrow__t' }, a.bio),
              h('div', { class: 'advslot__act' }, Core.L(a.action))
            ]),
            h('div', { class: 'deckrow__m' }, [
              h('span', { style: { color: a.factionColor } }, a.factionZh),
              a.external ? null : h('span', {}, T('adv.diss') + ' ' + a.dissent.toFixed(1))
            ]),
            Orn.decoArrow()
          ]));
        });
        bd.appendChild(list);
      }
      return V.modal(T('adv.deck'), 'CONSIGLIERI', [bd], [
        h('div', { class: 'tiny', style: { color: 'rgba(42,30,16,.55)', marginRight: 'auto', alignSelf: 'center' } },
          T('adv.seated', { a: st.advisors.active.length, b: 3 })),
        h('button', { class: 'btn btn--ghost', onclick: act.closeAdvisorDeck }, T('btn.back'))
      ], { cls: 'modal--wide', onScrim: act.closeAdvisorDeck });
    };

    function tabAzioni(st, act) {
      var decks = Sel.decks(st);
      var slots = Sel.slots(st);

      /* Three deck tiles. Clicking one draws straight into a free slot.
         In the ordinary difficulties that is a random draw (the tile IS the
         draw); sandbox keeps the picker, so there the tile still opens the list. */
      var tiles = h('div', { class: 'decks' });
      decks.forEach(function (d) {
        var picks = d.mode === 'pick';
        tiles.appendChild(h('button', {
          class: 'deck' + (d.drawable ? '' : ' is-off'),
          disabled: !d.drawable,
          style: { borderColor: d.drawable ? d.color : 'rgba(201,162,39,.18)' },
          title: picks ? T('deck.pickHint') : T('deck.drawHint'),
          onclick: function () {
            if (picks) act.openDeck(d.id); else act.drawRandom(d.id);
          }
        }, [
          h('div', { class: 'deck__ic' }, icon(d.icon, 22)),
          h('div', { class: 'deck__b' }, [
            h('div', { class: 'deck__n', style: { color: d.drawable ? 'var(--gold-pale)' : 'rgba(233,220,188,.4)' } }, d.zh),
            h('div', { class: 'deck__s' }, d.drawable
              ? (picks ? T('deck.pickShort') : T('deck.draw')) + ' · ' + d.available
              : (d.available ? T('deck.full') : T('deck.none')))
          ])
        ]));
      });

      /* Reserved slots. ALL of them are drawn, empty ones included: the row is a
         fixed set of slots, so the player can see how much room is left and where
         a card will land. Empty slots used to be skipped, which left the row
         either blank or short and hid the hand limit entirely. */
      var slotRow = h('div', { class: 'slots' });
      slots.forEach(function (sl) {
        if (sl.empty) {
          /* `slot--empty` is the existing style for an unfilled slot (dashed
             inner rule, dim border); only the label is new. */
          slotRow.appendChild(h('div', { class: 'slot slot--empty' }, [
            h('div', { class: 'slot__deck' }, T('deck.slot', { n: sl.index + 1 })),
            h('div', { class: 'slot__ph' }, T('deck.empty'))
          ]));
          return;
        }
        var card = sl.card;
        var c = h('div', { class: 'slot slot--full card--' + card.deck });
        c.appendChild(h('div', { class: 'slot__deck' }, T('az.deck.' + card.deck).toUpperCase()));
        c.appendChild(h('div', { class: 'slot__n' }, Core.L(card.name)));
        c.appendChild(h('div', { class: 'slot__t' }, Core.L(card.text)));
        var cost = h('div', { class: 'slot__cost' });
        cost.appendChild(h('span', {}, T('az.cost.ap', { n: (card.cost || {}).ap || 0 })));
        if ((card.cost || {}).funds) cost.appendChild(h('span', {}, Core.fmt(card.cost.funds) + ' K£'));
        if ((card.cost || {}).arms) cost.appendChild(h('span', {}, T('az.cost.armi', { n: card.cost.arms })));
        if (card.ministry) cost.appendChild(h('span', {}, card.ministry));
        c.appendChild(cost);
        c.appendChild(h('div', { class: 'row', style: { gap: '6px', marginTop: '7px' } }, [
          card.playable
            ? h('button', { class: 'btn btn--sm flex1', onclick: function () { act.playCard(card.id); } },
                card.optionCount > 1 ? T('card.choose', { n: card.optionCount }) : T('btn.play'))
            : h('div', { class: 'card__lock flex1' }, '✕ ' + Core.L(card.reason)),
          h('button', { class: 'btn btn--sm btn--ghost', title: T('deck.discard'),
            onclick: function () { act.discardCard(card.id); } }, '✕')
        ]));
        slotRow.appendChild(c);
      });
      /* The row now always holds handLimit slots, so this branch only shows when
         the limit itself is zero. Kept as a guard. */
      if (!slotRow.childNodes.length) slotRow.appendChild(h('div', { class: 'empty' },
        '手牌为空。选择上方牌堆抽取本回合可用的行动。'));

      return h('div', { class: 'col' }, [
        frame('', [
          banner(T('az.title'), T('deck.slots', { a: st.hand.length, b: st.handLimit })),
          h('div', { style: { padding: '9px 11px' } }, [
            tiles,
            h('div', { class: 'divider' }, icon('star', 11)),
            slotRow
          ])
        ]),
        advisorRow(st, act),
        briefingPanel(st)
      ]);
    }

    function briefingPanel(st) {
      var ec = Sel.economy(st), cr = Sel.crisis(st), fac = Sel.factions(st);
      var alerts = [];
      if (!st.flags.natale_done) {
        if (cr.coup >= 75) alerts.push(['bad', '事态 ' + Math.round(cr.coup) + '：卡维利亚的最后通牒已到。皇家陆军随时可能攻城。']);
        else if (cr.coup >= 40) alerts.push(['warn', '事态 ' + Math.round(cr.coup) + '：封锁与外交孤立正在累积。']);
        alerts.push(['info', '《拉帕洛条约》已于 1920 年 11 月 12 日签署。史实线上，攻击将在 1920 年 12 月 24 日到来。']);
      } else {
        if (cr.coup >= 70) alerts.push(['bad', '事态 ' + Math.round(cr.coup) + '：法西斯的小队已经接近行动阈值。']);
        if (cr.squadre >= 55) alerts.push(['bad', '法西斯暴力 ' + Math.round(cr.squadre) + '：他们在街上已经有了自己的秩序。']);
      }
      if (cr.violence >= 55) alerts.push(['bad', '政治暴力 ' + Math.round(cr.violence) + '：小店主与教士正在滑向法西斯。']);
      if (ec.unemployment >= 26) alerts.push(['warn', '失业 ' + ec.unemployment.toFixed(1) + '%：工人正在同时转向社会党与共产党。']);
      if (ec.traffic < 26) alerts.push(['warn', '港口吞吐 ' + ec.traffic.toFixed(1) + '：商人开始怀疑诗人会不会算账。']);
      if (ec.net < 0) alerts.push(['warn', '月度赤字 ' + Core.signed(ec.net, 1) + ' K£：军团军饷是最大的一笔。']);
      if (ec.inflation > 22) alerts.push(['warn', '通胀 ' + ec.inflation.toFixed(1) + '%：阜姆券正在失去它作为货币的礼貌。']);
      if (fac.dissent > 35) alerts.push(['warn', '党内整体异议 ' + fac.dissent.toFixed(0) + '：统一行动效率降至 ' + fac.unity.toFixed(0) + '%。']);
      if (cr.milizia < 500 && !st.flags.natale_done) alerts.push(['bad', '军团兵力仅 ' + Core.fmt(cr.milizia) + '：不足以守住省督府。']);
      var active = Sel.journals(st).filter(function (j) { return j.active; });
      if (active.length) alerts.push(['info', '进行中的日志：' + active.map(function (j) { return j.zh; }).join('、')]);
      if (!alerts.length) alerts.push(['ok', '本回合没有紧急警报。']);

      var grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '8px' } });
      [['港口吞吐', ec.traffic.toFixed(1), '目标 ' + ec.trafficTarget.toFixed(1), '#EBD07A'],
       ['失业率', ec.unemployment.toFixed(1) + '%', '通胀 ' + ec.inflation.toFixed(1) + '%', '#E8A9A2'],
       ['月度结余', Core.signed(ec.net, 1), '债务 ' + Core.fmt(ec.debt), ec.net >= 0 ? '#B9D69B' : '#E8A9A2'],
       ['事态', String(Math.round(Math.min(100, cr.coup))), cr.milestoneDefs.length ? '下一里程碑 ' + (cr.milestoneDefs.filter(function (m) { return cr.milestones.indexOf(m.id) < 0; })[0] || {}).at : '', cr.coup > 60 ? '#E8A9A2' : '#B9D69B']
      ].forEach(function (c) {
        grid.appendChild(h('div', { class: 'pick', style: { marginBottom: '0' } }, [
          h('div', { class: 'pick__n', style: { fontSize: '21px', color: c[3] } }, String(c[1])),
          h('div', { class: 'pick__d' }, c[0] + (c[2] ? ' · ' + c[2] : ''))
        ]));
      });
      var body = h('div', { style: { padding: '9px 11px' } }, [grid]);
      alerts.slice(0, 6).forEach(function (a) {
        body.appendChild(h('div', { class: 'row', style: { gap: '8px', padding: '3px 0', alignItems: 'flex-start', marginTop: '4px' } }, [
          h('span', { class: 'chip chip--' + (a[0] === 'bad' ? 'bad' : a[0] === 'warn' ? 'warn' : a[0] === 'info' ? 'info' : 'ok'), style: { flex: 'none', marginTop: '2px' } },
            a[0] === 'bad' ? '危急' : a[0] === 'warn' ? '注意' : a[0] === 'info' ? '史实' : '正常'),
          h('span', { class: 'small', style: { color: 'rgba(233,220,188,.84)' } }, a[1])
        ]));
      });
      return frame('', [banner(T('rep.title'), T('rep.sub')), body]);
    }

    /* The option's second line: its subtitle in the active language, falling
       back to the Italian of the option text when no subtitle is written.
       Returns a plain string so callers can place it inline, the way the event
       modal does; an empty string means there is nothing to show. */
    function optionLine(o) {
      if (o.subtitle) return Core.L(o.subtitle);
      return Core.sub(o.text);
    }

    /* ============================================================
       Party relations
       A matrix of how each party regards each other. Warm cells are parties
       that can be worked with; cold ones are the ones that will not.
       ============================================================ */
    /* ============================================================
       Party relations
       A chord diagram of how the parties stand to one another: the ring is
       each party's electoral weight, the cords are their feelings. An
       alliance is a silk band that widens with warmth; a feud is a hatched
       crimson thread. The exact numbers stay available in the fold below,
       because a diagram should not be the only copy of the arithmetic.
       ============================================================ */
    function relationsPanel(st) {
      var rel = Sel.relations(st);
      var sup = Sel.support(st).national;
      var byId = {};
      sup.forEach(function (p) { byId[p.id] = p.value; });

      var parties = rel.rows.map(function (r) {
        return { id: r.id, zh: r.zh, short: r.short, color: r.color, camp: r.camp,
          weight: Math.max(4, byId[r.id] || 0) };
      });
      var lookup = {};
      rel.rows.forEach(function (r) {
        r.cells.forEach(function (c) { lookup[r.id + '|' + c.id] = c.v; });
      });

      var chart = Charts.chord({
        parties: parties,
        value: function (a, b) {
          var v = lookup[a + '|' + b];
          if (v == null) v = lookup[b + '|' + a];
          return v == null ? 0 : v;
        }
      });

      /* The plate's own title, set the way a printed map is headed. */
      var head = h('div', { class: 'chordhead' }, [
        h('div', { class: 'chordhead__t' }, 'FIUME · MCMXIX'),
        h('div', { class: 'chordhead__s' }, '阜姆 · 各党派关系弦图'),
        h('div', { class: 'chordhead__r' }, [h('i', {}), h('b', {}), h('i', {})])
      ]);

      /* Share of the electorate — the length of each arc. It lives in the rail
         because it is party reference data of the same kind as the emblems
         above it, and because the plate below is then a clean square that can
         be sized to meet the rail without a ragged caption under it. */
      var caption = h('div', { class: 'chordrail__sec' }, [
        h('div', { class: 'chordrail__sh' }, [
          h('span', { class: 'chordrail__ht' }, '各党支持度'),
          h('span', { class: 'chordrail__hs' }, 'CONSENSO')
        ])
      ].concat(parties.map(function (p) {
        return h('div', { class: 'chordrail__s', title: p.zh }, [
          h('i', { class: 'chordrail__ssw', style: { background: p.color } }),
          h('span', { class: 'chordrail__sk' }, p.short),
          h('span', { class: 'chordrail__sn2' }, p.zh),
          h('span', { class: 'chordrail__sv' }, p.weight.toFixed(1) + '%')
        ]);
      })));

      /* One bar, read left to right: cold to warm. */
      var scale = h('div', { class: 'chordkey' }, [
        h('span', { class: 'chordkey__e' }, '对立'),
        h('i', { class: 'chordkey__scale' }, [h('b'), h('b'), h('b')]),
        h('span', { class: 'chordkey__e' }, '亲近'),
        h('span', { class: 'chordkey__i' },
          h('span', {}, '丝带越宽、越绿，关系越好；越窄、越红，关系越差'))
      ]);

      var note = h('div', { class: 'tiny dim2', style: { marginTop: '8px' } },
        '各党关系的基准是写定的史实立场，不随法条投票或选举阵营变动。每回合向基准回摆；同处内阁会把它推高。');

      /* ---- the player's own row, stood up beside the plate ----
         The old numeric grid was six rows by five, and every cell outside the
         player's own row was the mirror of one inside it. What the player
         actually asks is "how does each of them stand with me", so that single
         row is what survives, sorted best-first. Width and colour come from
         the same two functions the plate uses.

         The party emblems live here too: they were drawn for the start screen
         only, which shows the playable parties, so the two the player cannot
         pick had nowhere to appear at all. */
      var mine = rel.rows.filter(function (r) { return r.player; })[0];
      var myName = mine ? mine.zh : '';
      var rail = h('div', { class: 'chordrail' }, [
        h('div', { class: 'chordrail__h' }, [
          h('span', { class: 'chordrail__ht' }, '与' + myName + '的关系'),
          h('span', { class: 'chordrail__hs' }, 'RAPPORTI')
        ])
      ].concat(
        (mine ? mine.cells.slice() : []).sort(function (a, b) { return b.v - a.v; })
          .map(function (c) {
            var p = W.PARTY_BY_ID[c.id] || { zh: c.id, short: c.id, color: '#888' };
            var col = Charts.warmthColor(c.v);
            var badge = p.emblem
              ? h('img', { class: 'chordrail__em', src: p.emblem, alt: '' })
              : h('span', { class: 'chordrail__em chordrail__em--flat', style: { background: p.color } });
            return h('div', { class: 'chordrail__r', title: myName + ' ↔ ' + p.zh + '：' + c.v.toFixed(1) }, [
              h('i', { class: 'chordrail__fill',
                style: { width: Core.round1(Charts.warmth(c.v) * 100) + '%', background: col } }),
              badge,
              h('span', { class: 'chordrail__tx' }, [
                h('span', { class: 'chordrail__n' }, p.zh),
                h('span', { class: 'chordrail__k' }, p.short)
              ]),
              h('span', { class: 'chordrail__v', style: { color: col } },
                (c.v > 0 ? '+' : '') + c.v.toFixed(0))
            ]);
          })
      ).concat([
        /* The scale explains the ribbons and the bars alike, so it belongs with
           the thing that uses both readings. */
        h('div', { class: 'chordrail__f' }, [
          h('div', { class: 'chordrail__sc' }, [
            h('span', { class: 'chordkey__e' }, '对立'),
            h('i', { class: 'chordkey__scale' }, [h('b'), h('b'), h('b')]),
            h('span', { class: 'chordkey__e' }, '亲近')
          ]),
          h('div', { class: 'chordrail__sn' }, '越宽、越绿，关系越好；越窄、越红，关系越差')
        ]),
        caption
      ]));

      // The plate is a clean square now, so it can simply be told how tall to
      // be; the rail stretches to whatever the row ends up measuring.
      var plate = h('div', { class: 'chordbody' }, [chart]);

      return frame('', [
        head,
        h('div', { class: 'chordrow' }, [rail, plate]),
        note
      ]);
    }

    function tabAssemblea(st) {
      var vm = Sel.parliament(st), ret = Sel.rettori(st);
      var col = h('div', { class: 'col' });
      var body = h('div', { style: { padding: '10px 11px' } });
      if (vm.founded) {
        body.appendChild(h('div', { style: { display: 'flex', justifyContent: 'center' } }, Charts.parliament(vm)));
        var labs = h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '6px 12px', justifyContent: 'center', marginTop: '6px' } });
        vm.seats.forEach(function (s) {
          labs.appendChild(h('div', { class: 'row', style: { gap: '6px', fontSize: '12px' } }, [
            h('span', { class: 'swatch', style: { background: s.color } }),
            h('span', {}, s.zh), h('b', { class: 'num' }, String(s.seats))
          ]));
        });
        body.appendChild(labs);
        body.appendChild(h('div', { class: 'divider' }, icon('fasces', 11)));
        body.appendChild(h('div', { class: 'tiny dim' },
          '1921 年 4 月 24 日选举法（第 1100 号）：城区 68 席（51 多数 + 17 少数），子市镇 8 席（6 多数 + 2 少数）。' +
          '多数派席位由得票第一的名单通吃。' + (vm.alone ? '（军团兵单独参选。）' : '') + (vm.boycotted ? '（军团兵抵制了这场选举。）' : '')));
      } else {
        body.appendChild(h('div', { class: 'assembly-empty' }, [
          h('strong', {}, '议会尚未选出'),
          h('span', {}, '当前由指挥官与七位执政官治理。制宪议会选举定于 1921 年 4 月 24 日。')
        ]));
      }
      if (st.electionDetail) {
        var d = st.electionDetail;
        body.appendChild(h('div', { class: 'divider' }, icon('star', 11)));
        var tbl = h('table', { class: 'tbl' });
        tbl.appendChild(h('tr', {}, [h('th', {}, '名单'), h('th', { class: 'num' }, '城区'), h('th', { class: 'num' }, '子市镇')]));
        Object.keys(d.city).sort(function (a, b) { return d.city[b] - d.city[a]; }).forEach(function (k) {
          var pt = W.PARTY_BY_ID[k];
          tbl.appendChild(h('tr', {}, [
            h('td', {}, h('span', { class: 'row' }, [h('span', { class: 'swatch', style: { background: pt ? pt.color : '#888' } }), h('span', {}, pt ? pt.zh : k)])),
            h('td', { class: 'num' }, (d.city[k] || 0).toFixed(1) + '%'),
            h('td', { class: 'num' }, (d.sub[k] || 0).toFixed(1) + '%')
          ]));
        });
        body.appendChild(tbl);
      }
      col.appendChild(frame('', [banner(T('parl.title'), vm.founded ? T('parl.seats', { n: vm.total, m: vm.majority }) : T('parl.notyet')), body]));

      var cb = h('div', { style: { padding: '9px 11px' } });
      ret.forEach(function (m) {
        cb.appendChild(h('div', { class: 'adv' }, [
          avatar(HOLDER_AVATAR[m.id], (m.holder || m.zh).slice(0, 1), 'adv__av'),
          h('div', { class: 'adv__b' }, [
            h('div', { class: 'adv__n' }, m.zh + ' · ' + m.it),
            h('div', { class: 'adv__x' }, m.holder ? ('现任：' + m.holder) : '席位权重 ' + (m.power * 100).toFixed(0) + '%'),
            h('div', { class: 'adv__m' }, [
              h('span', { class: 'chip' + (m.mine ? ' chip--gold' : '') }, [h('span', { class: 'swatch', style: { background: m.color } }), m.ownerZh]),
              h('span', { class: 'chip' }, '权重 ' + (m.power * 100).toFixed(0) + '%')
            ])
          ])
        ]));
      });
      cb.appendChild(h('div', { class: 'tiny dim2' },
        '摄政联盟：' + st.coalition.members.map(function (m) { return W.PARTY_BY_ID[m] ? W.PARTY_BY_ID[m].zh : m; }).join(' + ') +
        ' · 凝聚力 ' + st.coalition.cohesion.toFixed(0)));
      col.appendChild(frame('', [banner(T('gab.title'), T('gab.sub')), cb]));
      col.appendChild(relationsPanel(st));
      return col;
    }

    function tabDiplomazia(st, act) {
      var d = Sel.diplo(st);
      var forces = Sel.forze(st);
      var col = h('div', { class: 'col diplo-dossier' });
      var activePosture = d.postures.filter(function (p) { return p.active; })[0];
      col.appendChild(h('div', { class: 'diplo-intro' }, [
        h('div', { class: 'diplo-intro__copy' }, [
          h('strong', {}, '对外关系档案'),
          h('span', {}, '国家关系以 0—100 计；意大利政治力量的态度以 −40—100 计。两者独立结算。')
        ]),
        h('div', { class: 'diplo-intro__posture' }, [
          h('small', {}, '现行外交姿态'),
          h('strong', {}, activePosture ? activePosture.zh : '未指定')
        ])
      ]));

      var b = h('div', { class: 'diplo-relations' });
      var groups = [
        { zh: '邻国', it: 'VICINI', ids: ['italy', 'yugoslavia'] },
        { zh: '协约国与国际机构', it: 'INTESA', ids: ['uk', 'france', 'usa', 'league'] },
        { zh: '其他外交渠道', it: 'ALTRI', ids: ['hungary', 'vatican', 'soviet'] }
      ];
      groups.forEach(function (group) {
        b.appendChild(h('div', { class: 'diplo-relations__group' }, [
          h('strong', {}, group.zh), h('small', {}, group.it)
        ]));
        group.ids.forEach(function (id) {
          var a = d.list.filter(function (item) { return item.id === id; })[0];
          if (!a) return;
          var tone = a.value < 25 ? 'cold' : a.value < 60 ? 'cautious' : 'warm';
          var reading = a.value < 25 ? '冷淡' : a.value < 60 ? '谨慎' : '友好';
          b.appendChild(h('div', { class: 'relation-entry relation-entry--state relation-entry--' + tone }, [
            h('div', { class: 'relation-entry__head' }, [
              h('span', { class: 'relation-entry__identity' }, [
                h('i', { class: 'relation-entry__sigil', style: { background: a.color }, 'aria-hidden': 'true' }),
                h('span', { class: 'relation-entry__names' }, [
                  h('strong', {}, a.zh), h('small', {}, a.it)
                ])
              ]),
              h('span', { class: 'relation-entry__reading' }, reading),
              h('strong', { class: 'relation-entry__value num' }, a.value.toFixed(1))
            ]),
            h('div', { class: 'relation-track relation-track--state', role: 'meter',
              'aria-label': a.zh + '关系', 'aria-valuemin': '0', 'aria-valuemax': '100',
              'aria-valuenow': String(a.value) }, [
              h('i', { class: 'relation-track__half', 'aria-hidden': 'true' }),
              h('span', { class: 'relation-track__fill', style: { width: Core.clamp(a.value, 0, 100) + '%' } })
            ])
          ]));
        });
      });
      b.appendChild(h('div', { class: 'relation-scale relation-scale--state' }, [
        h('span', {}, '0 · 疏远'), h('span', {}, '50 · 中间'), h('span', {}, '100 · 亲近')
      ]));

      var fb = h('div', { class: 'forze-relations' });
      fb.appendChild(h('div', { class: 'forze-relations__summary' }, [
        h('strong', {}, '关系达标 ' + forces.alliedCount + ' / ' + W.FORZA_FRONT_NEEDED + ' 派'),
        h('span', {}, '六派中至少三派关系达到 80；日志开启后，60 为维系线。')
      ]));
      function forceEntry(f, officer) {
        var zero = 40 / 140 * 100;
        var position = Core.clamp((f.value + 40) / 140 * 100, 0, 100);
        var positive = f.value >= 0;
        var gate = officer ? 60 : f.gate;
        var gatePosition = (gate + 40) / 140 * 100;
        var tone = f.value < 0 ? 'cold' : f.value >= gate ? 'warm' : f.value >= 60 ? 'cautious' : 'neutral';
        var status = f.value >= gate ? '已达标' : f.value >= 60 ? '达到维系线' : f.value < 0 ? '对立' : '待争取';
        var entry = h('details', { class: 'relation-entry relation-entry--force relation-entry--' + tone });
        entry.appendChild(h('summary', { class: 'relation-entry__summary' }, [
          h('span', { class: 'relation-entry__head' }, [
            h('span', { class: 'relation-entry__identity' }, [
              h('i', { class: 'relation-entry__sigil', style: { background: f.color }, 'aria-hidden': 'true' }),
              h('span', { class: 'relation-entry__names' }, [
                h('strong', {}, f.zh), h('small', {}, f.it)
              ])
            ]),
            h('span', { class: 'relation-entry__reading' }, status),
            h('strong', { class: 'relation-entry__value num' },
              (f.value > 0 ? '+' : '') + f.value.toFixed(1))
          ]),
          h('span', { class: 'relation-track relation-track--force', role: 'meter',
            'aria-label': f.zh + '关系', 'aria-valuemin': '-40', 'aria-valuemax': '100',
            'aria-valuenow': String(f.value) }, [
            h('i', { class: 'relation-track__zero', style: { left: zero + '%' }, 'aria-hidden': 'true' }),
            h('i', { class: 'relation-track__gate', style: { left: gatePosition + '%' }, 'aria-hidden': 'true' }),
            h('span', { class: 'relation-track__fill' + (positive ? '' : ' is-negative'),
              style: { left: Math.min(zero, position) + '%', width: Math.abs(position - zero) + '%' } })
          ])
        ]));
        entry.appendChild(h('div', { class: 'relation-entry__detail' }, [
          h('p', {}, f.note),
          h('span', {}, officer ? '军官团需达到 60，是进军罗马的独立条件。' :
            '日志开启后，60 为维系线；80 为进军罗马的达标线。')
        ]));
        return entry;
      }
      forces.front.forEach(function (f) { fb.appendChild(forceEntry(f, false)); });
      if (!W.forzaExists(st, 'comunisti')) fb.appendChild(h('p', { class: 'forze-relations__pending' },
        '意大利共产党尚未成立，成立后才出现在这份名单中。'));
      fb.appendChild(h('div', { class: 'relation-scale relation-scale--force' }, [
        h('span', {}, '−40'), h('span', {}, '0'), h('span', {}, '60 · 维系'),
        h('span', {}, '80 · 达标'), h('span', {}, '100')
      ]));
      if (forces.officer) fb.appendChild(h('div', { class: 'forze-relations__officer' }, [
        h('div', { class: 'forze-relations__officer-title' }, [
          h('strong', {}, '独立条件 · 军官团'), h('span', {}, '进军罗马需达到 60')
        ]),
        forceEntry(forces.officer, true)
      ]));
      col.appendChild(h('div', { class: 'diplo-relations-grid' }, [
        frame('diplo-column', [banner('国家与国际机构', '外交关系 · 0—100'), b]),
        frame('diplo-column', [banner('意大利政治力量', '进军罗马 · −40—100'), fb])
      ]));

      var pb = h('div', { class: 'diplo-postures' });
      var grid = h('div', { class: 'diplo-postures__grid' });
      d.postures.forEach(function (po) {
        grid.appendChild(h('button', {
          class: 'diplo-posture' + (po.active ? ' is-on' : ''),
          type: 'button', 'aria-pressed': po.active ? 'true' : 'false',
          onclick: function () { act.setPosture(po.id); }
        }, [
          h('div', { class: 'diplo-posture__head' }, [
            h('strong', {}, po.zh), h('span', {}, po.active ? '现行' : '选择')
          ]),
          h('div', { class: 'diplo-posture__it' }, po.it),
          h('p', {}, po.desc),
          h('div', { class: 'diplo-posture__effects' }, po.effects.map(function (effect) {
            return h('span', { class: 'diplo-posture__effect' + (effect.value < 0 ? ' is-negative' : '') },
              effect.zh + ' ' + (effect.value > 0 ? '+' : '−') + Math.abs(effect.value));
          }))
        ]));
      });
      pb.appendChild(grid);
      pb.appendChild(h('p', { class: 'diplo-postures__note' },
        '数字为每半月结算时的基础关系变化；法律、事件及关系上限另行生效。切换姿态本身不消耗行动力。'));
      col.appendChild(frame('', [banner(T('dip.posture'), '每半月基础变化 · ORIENTAMENTO'), pb]));

      return col;
    }

    function lawSteps(L) {
      var steps = h('span', { class: 'law-tile__steps', 'aria-hidden': 'true' });
      L.levels.forEach(function (_, n) {
        steps.appendChild(h('span', { class: 'law-tile__step' +
          (n < L.level ? ' is-lower' : n === L.level ? ' is-current' : '') }));
      });
      return steps;
    }

    function lawDossier(L, act, charterProgrammed) {
      var dossier = h('section', { class: 'law-dossier', id: 'law-dossier', tabindex: '-1',
        'aria-label': L.zh + ' · ' + T('leg.allLevels') });
      dossier.appendChild(h('div', { class: 'law-dossier__head' }, [
        h('div', { class: 'law-dossier__name' }, [
          h('span', { class: 'law-dossier__eyebrow' }, T('leg.dossier')),
          h('h2', {}, L.zh), h('span', { class: 'law-dossier__it' }, L.it)
        ]),
        h('div', { class: 'law-dossier__seal' }, [
          h('strong', {}, String(L.level)), h('span', {}, '/ ' + L.max)
        ])
      ]));
      dossier.appendChild(h('div', { class: 'law-dossier__current' }, [
        h('span', {}, T('leg.inForce')),
        h('strong', {}, L.label)
      ]));
      if (charterProgrammed && L.charterTarget != null) dossier.appendChild(h('div', { class: 'law-dossier__charter' },
        T('leg.charterTarget', { n: L.charterTarget }) + ' · ' +
        (L.level >= L.charterTarget ? T('leg.met') : T('leg.pending'))));
      if (L.effect) dossier.appendChild(h('aside', { class: 'law-dossier__effect' }, [
        h('span', { class: 'law-dossier__effect-label' }, T('leg.effect')),
        h('p', {}, Core.L(L.effect))
      ]));
      var course = h('ol', { class: 'law-course', 'aria-label': T('leg.allLevels') });
      L.levels.forEach(function (label, n) {
        var status = n < L.level ? 'lower' : n === L.level ? 'current' : 'future';
        course.appendChild(h('li', { class: 'law-course__item law-course__item--' + status }, [
          h('span', { class: 'law-course__number', 'aria-hidden': 'true' }, String(n).padStart(2, '0')),
          h('span', { class: 'law-course__copy' }, [
            h('span', { class: 'law-course__label' }, label),
            h('span', { class: 'law-course__status' },
              n === L.level ? T('leg.inForce') : n < L.level ? T('leg.lower') :
                n === L.level + 1 ? T('leg.next') : T('leg.future'))
          ])
        ]));
      });
      dossier.appendChild(course);

      dossier.appendChild(h('div', { class: 'law-dossier__foot' }, [
        h('span', {}, T('leg.route') + ' · ' + (L.source ? Core.L(L.source) : T('leg.how'))),
        h('button', { class: 'law-dossier__action', type: 'button', onclick: function () { act.setTab('azioni'); } },
          T('leg.toActions') + ' →')
      ]));
      return dossier;
    }

    function tabLeggi(st, ui, act) {
      var laws = Sel.laws(st);
      var charter = Sel.charter(st);
      var focused = laws.filter(function (L) { return L.id === ui.lawFocus; })[0] || laws[0];
      var advanced = laws.filter(function (L) { return L.level > 0; }).length;
      var complete = laws.filter(function (L) { return L.level === L.max; }).length;
      var b = h('div', { class: 'laws-atlas' });
      b.appendChild(h('div', { class: 'laws-atlas__intro' }, [
        h('div', {}, [
          h('div', { class: 'laws-atlas__eyebrow' }, T('leg.atlas')),
          h('p', {}, T('leg.intro'))
        ]),
        h('div', { class: 'laws-atlas__stats' }, [
          h('div', {}, [h('strong', {}, String(laws.length)), h('span', {}, T('leg.laws'))]),
          h('div', {}, [h('strong', {}, String(advanced)), h('span', {}, T('leg.advanced'))]),
          h('div', {}, [h('strong', {}, String(complete)), h('span', {}, T('leg.complete'))])
        ])
      ]));
      var charterBoard = h('section', { class: 'charter-board', 'aria-label': T('leg.charter') });
      charterBoard.appendChild(h('div', { class: 'charter-board__head' }, [
        h('div', {}, [
          h('span', { class: 'charter-board__eyebrow' }, 'DE AMBRIS · CARTA DEL CARNARO'),
          h('h2', {}, T('leg.charter')),
          h('p', {}, T('leg.charterIntro'))
        ]),
        h('div', { class: 'charter-board__progress' }, [
          h('strong', {}, (charter.programmed ? charter.met : '—') + ' / ' + charter.total),
          h('span', {}, T('leg.requirementsMet'))
        ])
      ]));
      var stageRow = h('ol', { class: 'charter-board__stages' });
      [[T('leg.stageDraft'), charter.drafted], [T('leg.stageProgram'), charter.programmed],
        [T('leg.stagePromulgate'), charter.promulgated], [T('leg.stageArengo'), charter.arengo],
        [T('leg.stageComplete'), charter.done]].forEach(function (stage, index) {
        stageRow.appendChild(h('li', { class: 'charter-board__stage' + (stage[1] ? ' is-done' : '') }, [
          h('span', { class: 'charter-board__stage-number' }, String(index + 1).padStart(2, '0')),
          h('span', {}, stage[0])
        ]));
      });
      charterBoard.appendChild(stageRow);
      charterBoard.appendChild(h('div', { class: 'charter-board__caption' },
        charter.programmed ? T('leg.charterGoals') : T('leg.charterLocked')));
      var reqGrid = h('div', { class: 'charter-board__requirements' });
      if (charter.programmed) charter.requirements.forEach(function (r) {
        reqGrid.appendChild(h('button', { type: 'button',
          class: 'charter-board__requirement' + (r.met ? ' is-met' : ''),
          onclick: function () {
            act.setLawFocus(r.id);
            requestAnimationFrame(function () {
              var panel = document.getElementById('law-dossier');
              if (panel) panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
            });
          }
        }, [
          h('span', { class: 'charter-board__check', 'aria-hidden': 'true' }, r.met ? '◆' : '◇'),
          h('span', {}, r.zh),
          h('strong', {}, r.current + ' / ' + r.level)
        ]));
      });
      charterBoard.appendChild(reqGrid);
      b.appendChild(charterBoard);
      var chapters = [
        { number: 'I', zh: T('leg.chapterCivic'), it: 'CITTADINI E LIBERTÀ',
          ids: ['elettorale', 'cittadinanza', 'lingua', 'stampa', 'scuola'] },
        { number: 'II', zh: T('leg.chapterLabour'), it: 'IL LAVORO',
          ids: ['orario', 'lavoro'] },
        { number: 'III', zh: T('leg.chapterState'), it: 'LA CITTÀ E IL PORTO',
          ids: ['ordine', 'portofranco', 'dogana', 'fisco'] }
      ];
      chapters.forEach(function (chapter) {
        var folio = h('section', { class: 'law-chapter', 'aria-label': chapter.zh });
        folio.appendChild(h('div', { class: 'law-chapter__heading' }, [
          h('span', { class: 'law-chapter__roman', 'aria-hidden': 'true' }, chapter.number),
          h('div', {}, [h('span', { class: 'law-chapter__it' }, chapter.it), h('h3', {}, chapter.zh)]),
          h('span', { class: 'law-chapter__count' }, String(chapter.ids.length).padStart(2, '0') + ' / ' + String(laws.length).padStart(2, '0'))
        ]));
        var grid = h('div', { class: 'laws-atlas__grid', 'aria-label': T('leg.select') });
        chapter.ids.forEach(function (id) {
          var L = laws.filter(function (entry) { return entry.id === id; })[0];
          if (!L) return;
          var index = laws.indexOf(L);
          grid.appendChild(h('button', {
          class: 'law-tile' + (focused.id === L.id ? ' is-selected' : ''), type: 'button',
          'aria-pressed': focused.id === L.id ? 'true' : 'false', 'aria-controls': 'law-dossier',
          onclick: function () {
            act.setLawFocus(L.id);
            requestAnimationFrame(function () {
              var panel = document.getElementById('law-dossier');
              if (panel) panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
            });
          }
        }, [
          h('span', { class: 'law-tile__top' }, [
            h('span', { class: 'law-tile__index' }, String(index + 1).padStart(2, '0')),
            h('span', { class: 'law-tile__level' }, L.level + ' / ' + L.max)
          ]),
          h('strong', { class: 'law-tile__name' }, L.zh),
          h('span', { class: 'law-tile__current' }, L.label),
          L.charterTarget != null ? h('span', { class: 'law-tile__target' +
            (charter.programmed && L.level >= L.charterTarget ? ' is-met' : '') },
            charter.programmed ? T('leg.charterTarget', { n: L.charterTarget }) : T('leg.awaitProgram')) :
            h('span', { class: 'law-tile__independent' }, T('leg.independent')),
          lawSteps(L)
          ]));
        });
        folio.appendChild(grid);
        b.appendChild(folio);
      });
      b.appendChild(lawDossier(focused, act, charter.programmed));
      return h('div', { class: 'col' }, [frame('', [banner(T('leg.title'), T('leg.sub')), b])]);
    }

    /* One labelled gauge block, used twice: the two crises are the same shape but
       different pressures, so they read identically and are told apart by title
       and colour. */
    function crisisGauge(parent, title, value, color, defs, passed, series, guide) {
      parent.appendChild(h('div', { class: 'small', style: { marginBottom: '3px', letterSpacing: '.06em' } }, title));
      parent.appendChild(Charts.barRow('', null, value, 140, color));
      defs.forEach(function (m) {
        var has = passed.indexOf(m.id) >= 0;
        parent.appendChild(h('div', { class: 'kv' }, [
          h('span', { class: 'kv__k' + (has ? '' : ' dim2') }, (has ? '◆ ' : '◇ ') + m.at + ' — ' + m.zh),
          h('span', { class: 'kv__v ' + (has ? '' : 'dim2') }, has ? '已过' : '未至')
        ]));
      });
      if (series && series.length > 1) {
        parent.appendChild(Charts.sparkline(series,
          { color: color, fillColor: 'rgba(163,22,33,.18)', guide: guide || 100, min: 0, max: 120, height: 44 }));
      }
    }

    function tabCrisi(st) {
      var cr = Sel.crisis(st);
      var col = h('div', { class: 'col' });
      var b = h('div', { style: { padding: '9px 11px' } });
      [['摄政权威', cr.authority, '#3C7FA8'], ['意大利军队立场', cr.garrison, '#6B4E9E'],
       ['民众热忱', cr.fervour, '#A31621'], ['法西斯暴力', cr.squadre, '#2B2B33'],
       ['政治暴力', cr.violence, '#8A2A2A']].forEach(function (r) {
        b.appendChild(Charts.barRow(r[0], null, r[1], 100, r[2]));
      });
      b.appendChild(h('details', { class: 'formula-details' }, [
        h('summary', {}, '查看两条危机的计算方式'),
        h('div', { class: 'small', style: { marginTop: '6px' } }, '紧张度 T（四条量表 → 围攻）'),
        h('div', { class: 'mono small' }, 'T = clamp[0,100]( 0.30×(100−权威) + 0.25×(100−驻军) + 0.20×热忱 + 0.25×法西斯暴力 )'),
        h('div', { class: 'small', style: { marginTop: '6px' } }, '围攻 Δ事态（罗马的耐心）'),
        h('div', { class: 'mono small' }, 'Δ = clamp[−7, 22.5]( 0.09×T + 0.06×(100−驻军) − 0.025×权威 + 15 − 三项修正 )'),
        h('div', { class: 'small', style: { marginTop: '6px' } }, '阴谋 Δ（法西斯的占领）'),
        h('div', { class: 'mono small' }, 'Δ = clamp[−6, 20]( −6 + 0.30×法西斯小队 + 0.35×max(0,暴力−25) + 0.50×max(0,法西斯派影响力−15) − 0.04×军团民意 )'),
        h('div', { class: 'tiny dim2', style: { marginTop: '6px' } },
          '两条轴互相独立：罗马的军队与墨索里尼的小队不是同一件事。')
      ]));

      var crisisPair = h('div', { class: 'crisis-pair' });
      var siegePanel = h('div', { class: 'crisis-axis' });
      var plotPanel = h('div', { class: 'crisis-axis' });
      crisisGauge(siegePanel, '围攻 · 罗马的耐心', cr.coup, '#C9A227',
        cr.milestoneDefs, cr.milestones, st.series.coup, 100);
      crisisGauge(plotPanel, '阴谋 · 法西斯的占领', cr.subversion, '#8A2A2A',
        cr.subversionDefs, cr.subversionMilestones, (st.series || {}).subversion, 100);
      crisisPair.appendChild(siegePanel);
      crisisPair.appendChild(plotPanel);
      b.appendChild(crisisPair);
      col.appendChild(frame('', [banner(T('cri.title'), T('cri.sub')), b]));

      var ob = h('div', { style: { padding: '9px 11px' } });
      [['阜姆军团', cr.milizia, '#C9A227', 6000],
       ['市警（编制估计）', cr.police, '#3C7FA8', 400], ['皇家宪兵（意大利）', cr.carabinieri, '#8A7A5A', 400],
       ['法西斯小队（估计）', Math.round(cr.squadre * 14), '#2B2B33', 1600]
      ].forEach(function (r) { ob.appendChild(Charts.barRow(r[0], null, r[1], r[3], r[2])); });
      col.appendChild(frame('', [banner(T('cri.forze'), T('cri.forze.sub')), ob]));

      return col;
    }


    /* ============================================================
       阶层支持度矩阵
       行 = 社会阶层（人口权重 / 投票率 / 组织渗透 / 战斗性）
       列 = 十个史实政党，单元格是该党在该阶层内的支持份额
       ============================================================ */
    function classMatrixPanel(st) {
      var mx = Sel.classMatrix(st);
      var law = Sel.electoralLaw();

      var grid = h('div', { class: 'cmatrix', style: { gridTemplateColumns: '132px 44px ' + mx.cols.map(function () { return 'minmax(42px,1fr)'; }).join(' ') } });

      /* Header row */
      grid.appendChild(h('div', { class: 'cmatrix__h cmatrix__h--l' }, '阶层 · 权重'));
      ['投票率'].forEach(function (t) {
        grid.appendChild(h('div', { class: 'cmatrix__h', title: t }, t));
      });
      mx.cols.forEach(function (col) {
        grid.appendChild(h('div', {
          class: 'cmatrix__h cmatrix__h--p' + (col.player ? ' is-player' : ''),
          style: { color: col.color }, title: col.zh + ' · ' + col.it
        }, [
          h('span', { class: 'cmatrix__dot', style: { background: col.color } }),
          h('span', {}, col.short)
        ]));
      });

      /* Class rows */
      mx.rows.forEach(function (r) {
        grid.appendChild(h('div', { class: 'cmatrix__l', title: r.note || '' }, [
          h('span', { class: 'cmatrix__n' }, r.zh),
          h('span', { class: 'cmatrix__w' }, String(r.pop))
        ]));
        grid.appendChild(h('div', { class: 'cmatrix__t', title: '投票率 ' + r.turnout + '%' }, [
          bar(r.turnout, 100, 'linear-gradient(90deg,#6B4E9E,#A98BD6)'),
          h('span', { class: 'cmatrix__tv' }, r.turnout.toFixed(0))
        ]));
        r.cells.forEach(function (cell) {
          var a = cell.share;
          grid.appendChild(h('div', {
            class: 'cmatrix__c' + (cell.v >= 20 ? ' is-strong' : ''),
            style: { background: 'rgba(' + hexRgb(cell.color) + ',' + (0.07 + a * 0.85).toFixed(3) + ')' },
            title: r.zh + ' → ' + cell.id + ' ' + cell.v.toFixed(1) + '%'
          }, cell.v >= 1 ? cell.v.toFixed(0) : '·'));
        });
      });

      /* National support */
      grid.appendChild(h('div', { class: 'cmatrix__l cmatrix__l--sum' }, '全国支持'));
      grid.appendChild(h('div', { class: 'cmatrix__t cmatrix__t--sum', title: '全市加权投票率' },
        [h('span', { class: 'cmatrix__tv' }, mx.turnout.toFixed(0) + '%')]));
      mx.totals.forEach(function (t) {
        grid.appendChild(h('div', {
          class: 'cmatrix__c cmatrix__c--sum', style: { color: t.color },
          title: W.PARTY_BY_ID[t.id].zh
        }, t.v.toFixed(1)));
      });

      /* List totals */
      var listRow = h('div', { class: 'cmatrix__lists' });
      mx.lists.forEach(function (L) {
        listRow.appendChild(h('div', { class: 'cmatrix__list' }, [
          h('span', { class: 'swatch', style: { background: L.color } }),
          h('span', { class: 'cmatrix__listn' }, L.zh),
          h('b', { class: 'cmatrix__listv' }, L.v.toFixed(1) + '%')
        ]));
      });

      var body = h('div', { style: { padding: '8px 10px 4px' } }, [grid, listRow]);
      body.appendChild(h('div', { class: 'tiny dim2', style: { padding: '7px 2px 5px', lineHeight: 1.6 } }, [
        '选举结算：',
        h('b', {}, '列表支持度 × 阶层投票率 × (1 − 该党弃权率)'),
        ' → 名单得票 → 按 1921 年选举法（' + law.total + ' 席 = 城区 ' + law.cityMajority + '+' + law.cityMinority +
        ' ＋ 子市镇 ' + law.subMajority + '+' + law.subMinority + '）分配；多数派席位由得票第一的名单通吃，少数派按最大余数法、门槛 ' + law.threshold + '%。',
        h('br'),
        '社会党的弃权传统（50%）会抬高其他名单的有效票占比——这正是 1921 年 4 月自治党拿到 66% 的原因之一。'
      ]));
      return frame('', [banner(T('cls.title'), T('cls.sub')), body]);
    }

    /** #RRGGBB → "r,g,b" */
    function hexRgb(hex) {
      var s = String(hex || '#888888').replace('#', '');
      if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
      var n = parseInt(s, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
    }

    /* ============================================================
       Events tab
       The month's event board lives here rather than floating above every
       other tab. A pending decision is shown first because it blocks the month.
       ============================================================ */
    function tabEventi(st, act) {
      var col = h('div', { class: 'col' });
      var pending = Sel.eventView(st);
      if (pending) {
        // The decision itself is pinned at the top of this same column, so this
        // panel only has to report that the month is blocked.
        col.appendChild(frame('', [banner(T('ev.pending'), 'DECISIONE IN SOSPESO'),
          h('div', { class: 'tiny dim', style: { padding: '10px 12px' } }, T('ev.hint'))
        ]));
      }
      col.appendChild(UI.EventBoard.render(st, act));
      return col;
    }

    /* ============================================================
       Population tab
       Who lives in Fiume and whom they support. The historical timeline and
       the administrative record moved into the settings menu; the national
       spirits and the journal moved to the right column.
       ============================================================ */
    function tabPopolazione(st) {
      var col = h('div', { class: 'col archive-page' });
      col.appendChild(frame('', [banner('人口', 'POPOLAZIONE'),
        h('div', { class: 'archive-intro' }, '城市的构成：各阶层的人口权重、政治倾向与投票率，以及政党在社会中的支持基础。')]));
      col.appendChild(UI.SidePanel.archive(st));
      col.appendChild(classMatrixPanel(st));
      return col;
    }

    /* The historical timeline, shown inside the settings menu. */
    function timelinePanel() {
      var timeline = h('div', { class: 'archive-timeline' });
      W.TIMELINE.forEach(function (item) {
        timeline.appendChild(h('div', { class: 'tl__i' }, [h('span', { class: 'tl__d' }, item.d), h('span', {}, item.zh)]));
      });
      return frame('', [banner('史实时间轴', 'CRONOLOGIA'), timeline]);
    }

    // Exposed so the React modal layer can mount them inside the settings menu.
    V.timelinePanel = timelinePanel;
    V.registroPanel = registroPanel;
    V.diariPanel = diariPanel;

    /* ============================================================
       导航与报尾
       ============================================================ */
    var NAV = [
      { id: 'eventi', zh: '事件', it: 'Eventi' },
      { id: 'azioni', zh: '行动', it: 'Azioni' },
      { id: 'mappa', zh: '地图', it: 'Carta' },
      { id: 'crisi', zh: '危机', it: 'Crisi' },
      { id: 'economia', zh: '经济', it: 'Economia' },
      { id: 'assemblea', zh: '议会', it: 'Assemblea' },
      { id: 'diplomazia', zh: '外交', it: 'Diplomazia' },
      { id: 'leggi', zh: '法律', it: 'Leggi' },
      { id: 'popolazione', zh: '人口', it: 'Popolazione' }
    ];
    V.NAV = NAV;

    function navRow(st, ui, act) {
      var row = h('div', { class: 'navrow' });
      // While the event phase is open the month is blocked: only the events tab
      // can be entered. This is why the top bar no longer needs a 待决 button.
      var locked = st.phase === 'event';
      NAV.forEach(function (n) {
        var shut = locked && n.id !== 'eventi';
        row.appendChild(h('button', {
          class: 'navbtn' + (ui.tab === n.id ? ' is-on' : '') + (shut ? ' is-locked' : ''),
          'data-tab': n.id, 'aria-current': ui.tab === n.id ? 'page' : null,
          disabled: shut,
          title: shut ? T('nav.locked') : null,
          onclick: function () { act.setTab(n.id); }
        }, [
          h('div', { class: 'navbtn__l' }, n.zh),
          Core.sub(n) ? h('div', { class: 'navbtn__s' }, Core.sub(n)) : null
        ]));
      });
      return row;
    }

    function ticker(st) {
      var logs = st.log.slice(-9).reverse();
      var rail = h('div', { class: 'ticker__rail' });
      if (!logs.length) logs = [{ turn: st.turn, zh: '1920 年 9 月 12 日：进军一周年。阳台上宣读了《卡尔纳罗宪章》。' }];
      logs.forEach(function (l) {
        rail.appendChild(h('div', { class: 'ticker__i' }, [
          h('span', { class: 'ticker__d' }, 'W' + l.turn),
          h('span', {}, l.zh)
        ]));
      });
      return h('div', { class: 'ticker' }, [
        h('div', { class: 'ticker__h' }, [icon('star', 14), T('tick.title')]),
        rail
      ]);
    }

    /* ============================================================
       主界面
       ============================================================ */
    V.game = function (st, ui, act) {
      actTax = act;
      var app = h('div', { class: 'app' });
      app.appendChild(h('div', { class: 'ornat ornat--l' }, [Orn.sideColumn('l'), h('div', { class: 'ornat__motto' }, 'MEMENTO AVDERE SEMPER')]));
      app.appendChild(h('div', { class: 'ornat ornat--r' }, [Orn.sideColumn('r'), h('div', { class: 'ornat__motto' }, 'DISOBBEDIRE · CREARE · COMBATTERE')]));
      app.appendChild(masthead());
      app.appendChild(resbar(st, ui, act));
      app.appendChild(navRow(st, ui, act));

      var board = h('div', { class: 'board' });
      var left = h('div', { class: 'col col--l' });
      left.appendChild(UI.SidePanel.render(st, ui, act));
      board.appendChild(left);

      var center = h('div', { class: 'col' });
      if (ui.tab === 'eventi') center.appendChild(tabEventi(st, act));
      else if (ui.tab === 'mappa') center.appendChild(mapPanel(st, ui, act));
      else if (ui.tab === 'economia') center.appendChild(tabEconomia(st));
      else if (ui.tab === 'azioni') center.appendChild(tabAzioni(st, act));
      else if (ui.tab === 'assemblea') center.appendChild(tabAssemblea(st));
      else if (ui.tab === 'diplomazia') center.appendChild(tabDiplomazia(st, act));
      else if (ui.tab === 'leggi') center.appendChild(tabLeggi(st, ui, act));
      else if (ui.tab === 'crisi') center.appendChild(tabCrisi(st));
      else center.appendChild(tabPopolazione(st));
      board.appendChild(center);

      var right = h('div', { class: 'col col--r' });
      right.appendChild(eventPanel(st, act));
      right.appendChild(UI.SidePanel.spiritsBlock(st));
      right.appendChild(diariPanel(st));
      board.appendChild(right);

      app.appendChild(board);
      return app;
    };

    /* ============================================================
       开始界面
       ============================================================ */
    V.start = function (ui, act) {
      var wrap = h('div', { class: 'stage-full stage-full--start' });
      wrap.appendChild(h('div', { class: 'ornat ornat--l' }, [Orn.sideColumn('l'), h('div', { class: 'ornat__motto' }, 'MEMENTO AVDERE SEMPER')]));
      wrap.appendChild(h('div', { class: 'ornat ornat--r' }, [Orn.sideColumn('r'), h('div', { class: 'ornat__motto' }, 'QVIS CONTRA NOS?')]));
      var inner = h('div', { class: 'stage-full__in' });

      var splash = h('div', { class: 'splash' });
      var introKey = ui.force === 'AUT' ? 'start.body.aut' : ui.force === 'PSI' ? 'start.body.psi' : 'start.body';
      splash.appendChild(frame('', [
        h('div', { class: 'splash__copy' }, [
          h('div', { class: 'tricolore', style: { width: '90px', marginBottom: '14px' } }),
          h('div', { class: 'splash__t' }, ['FIUME O ', h('em', {}, 'MORTE')]),
          h('div', { class: 'splash__d' }, T(introKey)),
          h('div', { class: 'divider' }, icon('fasces', 12)),
          h('button', { class: 'btn btn--primary start-play-btn', type: 'button', onclick: act.start }, ui.force === 'LEG' ? T('btn.start') : T('btn.start.party'))
        ])
      ]));
      splash.appendChild(h('div', { class: 'splash__art frame' }, [
        h('img', { src: V.IMG.proclama, alt: 'Proclamazione della Reggenza', onerror: 'this.style.display="none"' }),
        h('div', { class: 'splash__cap' }, [
          T('start.caption'),
          h('i', {}, 'Proclamazione della Reggenza italiana del Carnaro')
        ])
      ]));
      inner.appendChild(splash);

      var setup = h('div', { class: 'start-setup' });
      var force = h('div', { class: 'start-force' });
      var forceChoices = h('div', { class: 'start-force__choices' });
      /* The roster shows the Legion plus the forces that are modelled as playable
         but not yet open (they carry a `lockedNote`). Parties that exist only as
         AI actors in the simulation are not offered at all — showing five locked
         buttons would turn the choice into a wall of grey. */
      W.PARTIES.filter(function (party) { return !!party.player || !!party.lockedNote; }).forEach(function (party) {
        var open = !!party.player;
        var label = open ? party.zh
          : party.zh + (party.lockedNote ? ' · ' + Core.L(party.lockedNote) : '');
        forceChoices.appendChild(h('button', {
          class: 'start-force__pick' + (ui.force === party.id ? ' is-on' : '')
            + (open ? '' : ' is-locked'),
          type: 'button',
          disabled: !open,
          title: open ? null : Core.L(party.lockedNote || { zh: '尚未开放' }),
          'aria-pressed': ui.force === party.id ? 'true' : 'false',
          onclick: function () { act.setForce(party.id); }
        }, [
          h('span', { class: 'start-force__emblem-slot' },
            h('img', { class: 'start-force__emblem', src: party.emblem, alt: '' })),
          h('span', { class: 'start-force__name' }, label),
          h('span', { class: 'start-force__short' }, party.short)
        ]));
      });
      force.appendChild(frame('', [
        banner(T('start.force'), 'FORZE POLITICHE'),
        forceChoices
      ]));
      setup.appendChild(force);

      var selectedParty = W.PARTY_BY_ID[ui.force] || W.PARTY_BY_ID.LEG;
      var leader = selectedParty.leader;
      var leaderPortrait = h('div', { class: 'start-leader__portrait' }, [
        leader.portrait ? h('img', { src: leader.portrait, alt: Core.L(leader) }) :
          h('img', { class: 'start-leader__emblem', src: selectedParty.emblem, alt: selectedParty.zh + '党徽' }),
        h('div', { class: 'start-leader__frame', 'aria-hidden': 'true' }),
        !leader.portrait ? h('div', { class: 'start-leader__photo-note' }, T('start.portraitPending')) : null,
        h('div', { class: 'start-leader__plaque' }, Core.L(leader))
      ]);
      var leaderPanel = h('div', { class: 'start-leader' });
      leaderPanel.appendChild(frame('', [
        h('div', { class: 'start-leader__body' }, [
          leaderPortrait,
          h('div', { class: 'start-leader__details' }, [
            h('div', { class: 'start-leader__party' }, selectedParty.zh),
            h('div', { class: 'start-leader__party-it' }, selectedParty.it),
            h('p', { class: 'start-leader__blurb' }, selectedParty.blurb)
          ])
        ])
      ]));
      setup.appendChild(leaderPanel);

      var difficulty = h('div', { class: 'start-difficulty' });
      var db = h('div', { class: 'start-difficulty__choices' });
      W.DIFFICULTIES.filter(function (d) { return d.id !== 'historical'; }).forEach(function (d) {
        // Only the name is shown. The description is a hover tooltip so the
        // panel stays compact; see .start-difficulty .pick[data-tip] in the CSS.
        db.appendChild(h('button', {
          class: 'pick' + (d.id === ui.difficulty ? ' is-on' : ''),
          type: 'button',
          'aria-pressed': d.id === ui.difficulty ? 'true' : 'false',
          'data-tip': ui.force !== 'LEG' && d.id === 'open' ? T('start.normal.party') : d.note,
          onclick: function () { act.setDifficulty(d.id); }
        }, [
          h('div', { class: 'pick__n' }, d.zh)
        ]));
      });
      difficulty.appendChild(frame('', [banner(T('start.difficulty'), 'MODALITÀ'), db]));
      setup.appendChild(difficulty);
      inner.appendChild(setup);
      wrap.appendChild(inner);
      return wrap;
    };

    /* ============================================================
       结局
       ============================================================ */
    V.ending = function (st, act) {
      var vm = Sel.ending(st);
      if (!vm) return null;
      var wrap = h('div', { class: 'stage-full' });
      wrap.appendChild(h('div', { class: 'ornat ornat--l' }, [Orn.sideColumn('l'), h('div', { class: 'ornat__motto' }, 'QVIS MANEBIT MEMOR')]));
      wrap.appendChild(h('div', { class: 'ornat ornat--r' }, [Orn.sideColumn('r'), h('div', { class: 'ornat__motto' }, 'BELLEZZA · DISCIPLINA · AUDACIA · IMPERO')]));
      var inner = h('div', { class: 'stage-full__in' });
      inner.appendChild(masthead());

      var head = h('div', { style: { padding: '18px 4px 0' } }, [
        h('div', { class: 'row', style: { gap: '10px' } }, [
          h('span', { class: 'ending__tag' }, vm.tag),
          h('span', { class: 'chip' }, vm.date),
          h('span', { class: 'chip' }, T('end.turn', { n: vm.turn }))
        ]),
        h('h1', { class: 'ending__t' }, vm.zh),
        h('div', { class: 'ending__it' }, vm.it),
        h('div', { class: 'tricolore', style: { width: '130px', marginTop: '12px' } }),
        h('div', { class: 'ending__b' }, vm.body.zh)
      ]);
      inner.appendChild(head);

      var g = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '8px', padding: '11px' } });
      [[T('eco.traffic').split(' ·')[0], vm.stats.traffic.toFixed(1)], [T('eco.pop'), Core.fmt(vm.stats.population)],
       [T('cri.coup'), Math.round(vm.stats.coup)], [T('cmd.legittimita'), Math.round(vm.stats.legitimacy)],
       [(W.PARTY_BY_ID[st.playerForce] || W.PARTY_BY_ID.LEG).zh + '席位', vm.stats.seats], [T('end.journals'), Sel.journals(st).filter(function (j) { return j.done; }).length + ' / ' + Meta.JOURNALS.length]
      ].forEach(function (x) {
        g.appendChild(h('div', { class: 'pick', style: { marginBottom: '0' } }, [
          h('div', { class: 'pick__n', style: { fontSize: '21px' } }, String(x[1])),
          h('div', { class: 'pick__d' }, x[0])
        ]));
      });
      inner.appendChild(frame('', [banner(T('end.stats'), 'BILANCIO'), g]));

      if (vm.achievements.length) {
        var ag = h('div', { class: 'achgrid', style: { padding: '11px' } });
        vm.achievements.forEach(function (a) {
          ag.appendChild(h('div', { class: 'ach' }, [
            h('div', { class: 'ach__n' }, '★ ' + a.zh),
            h('div', { class: 'ach__d' }, Core.L(a.desc))
          ]));
        });
        inner.appendChild(frame('', [banner(T('end.ach'), 'RAGGIUNTI'), ag]));
      } else {
        inner.appendChild(frame('', [banner(T('end.ach'), 'NESSUNO'), h('div', { class: 'empty' }, T('end.noach'))]));
      }

      inner.appendChild(h('div', { class: 'row', style: { marginTop: '16px', gap: '10px', paddingBottom: '30px' } }, [
        h('button', { class: 'btn btn--primary', onclick: act.restart }, T('btn.restart')),
        h('button', { class: 'btn btn--ghost', onclick: act.about }, T('mod.about'))
      ]));
      wrap.appendChild(inner);
      return wrap;
    };

    /* ============================================================
       卡牌选项
       多选项的卡在结算前先弹这一层（对应《自由未烬》每张卡内联的当前事件）。
       ============================================================ */
    /* ============================================================
       Deck picker
       SANDBOX ONLY. In the ordinary difficulties clicking a deck tile draws a
       random card straight into a free slot (DRAW_RANDOM) and this modal never
       opens. Here the tile opens the list and picking a card fills a slot.
       ============================================================ */
    V.deckModal = function (st, ui, act) {
      var decks = Sel.decks(st);
      var d = null;
      decks.forEach(function (x) { if (x.id === ui.deck) d = x; });
      if (!d) return null;
      var bd = h('div', { class: 'modal__body' });
      bd.appendChild(h('div', { style: { fontStyle: 'italic', marginBottom: '14px' } }, Core.L(d.blurb)));

      if (!d.cards.length) {
        bd.appendChild(h('div', { class: 'evboard__empty' }, T('deck.none')));
      } else if (d.mode === 'random') {
        /* The ordinary rule: the deck is a draw, not a shop. The player chooses
           WHICH DECK to draw from and then learns what came up. Sandbox keeps the
           full list below. */
        bd.appendChild(h('div', { class: 'deckdraw' }, [
          h('div', { class: 'deckdraw__n' },
            d.zh + ' · ' + T('deck.available', { n: d.available })),
          h('div', { class: 'deckdraw__t' }, T('deck.randomNote')),
          h('button', {
            class: 'btn btn--gold', style: { marginTop: '10px' },
            onclick: function () { act.drawRandom(d.id); }
          }, T('deck.drawOne'))
        ]));
      } else {
        var list = h('div', { class: 'decklist' });
        d.cards.forEach(function (c) {
          list.appendChild(h('button', {
            class: 'deckrow', onclick: function () { act.drawCard(c.id); }
          }, [
            h('div', { class: 'deckrow__b' }, [
              h('div', { class: 'deckrow__n' }, Core.L(c.name)),
              h('div', { class: 'deckrow__t' }, Core.L(c.text))
            ]),
            h('div', { class: 'deckrow__m' }, [
              h('span', {}, 'AP ' + ((c.cost || {}).ap || 0)),
              c.ministry ? h('span', {}, c.ministry) : null,
              h('span', {}, T('card.choose', { n: c.optionCount }))
            ]),
            Orn.decoArrow()
          ]));
        });
        bd.appendChild(list);
      }
      return V.modal(Core.L(d.zh), d, [bd], [
        h('div', { class: 'tiny', style: { color: 'rgba(42,30,16,.55)', marginRight: 'auto', alignSelf: 'center' } },
          T('deck.slots', { a: st.hand.length, b: st.handLimit })),
        h('button', { class: 'btn btn--ghost', onclick: act.closeDeck }, T('btn.back'))
      ], { cls: 'modal--wide', onScrim: act.closeDeck });
    };

    V.cardModal = function (st, act) {
      var vm = Sel.cardView(st);
      if (!vm) return null;
      var deckName = T('az.deck.' + vm.deck).toUpperCase();
      var bd = h('div', {});
      bd.appendChild(h('div', { class: 'modal__body', style: { fontStyle: 'italic', fontSize: '14.5px' } }, Core.L(vm.text)));

      var cost = [];
      if (vm.cost.ap) cost.push('AP ' + vm.cost.ap);
      if (vm.cost.funds) cost.push(Core.fmt(vm.cost.funds) + ' K£');
      if (vm.cost.arms) cost.push(T('bar.armi') + ' ' + vm.cost.arms);
      bd.appendChild(h('div', { class: 'row', style: { gap: '10px', padding: '0 0 12px 2px' } },
        cost.map(function (x) { return h('span', { class: 'chip' }, x); })));

      vm.options.forEach(function (o) {
        var btn = h('button', {
          class: 'opt opt--card', disabled: !o.enabled,
          onclick: function () { act.resolveCardOption(o.id); }
        }, [
          h('div', { class: 'opt__h' }, [
            h('span', { class: 'opt__n' }, Core.L(o.text)),
            optionLine(o) ? h('span', { class: 'opt__i' }, optionLine(o)) : null
          ]),
          (o.preview && o.preview.length)
            ? h('div', { class: 'opt__p' }, o.preview.map(function (pv) {
                var lbl = typeof pv === 'string' ? pv : (pv.zh || pv.label || '');
                return h('span', { class: 'opt__pv' + (/−|-/.test(lbl) ? ' dn' : (/\+/.test(lbl) ? ' up' : '')) }, lbl);
              }))
            : null,
          (!o.enabled && o.reason) ? h('div', { class: 'opt__lock' }, '✕ ' + Core.L(o.reason)) : null
        ]);
        bd.appendChild(btn);
      });

      /* The choice must be made: the cost is already paid and the card
         discarded. The explanatory line that used to sit in the modal footer
         spelled that out to the player, who has already seen the cost leave the
         treasury. The footer is left empty rather than removed, so the modal
         keeps its footer spacing. */
      return V.modal(Core.L(vm.name), deckName + (vm.ministry ? ' · ' + vm.ministry.toUpperCase() : ''), [bd], []);
    };

    /* ============================================================
       弹窗
       ============================================================ */
    V.modal = function (title, sub, contentEls, footerEls, opts) {
      opts = opts || {};
      var scrim = h('div', { class: 'scrim show' });
      var modal = h('div', { class: 'modal' + (opts.cls ? ' ' + opts.cls : ''),
        role: 'dialog', 'aria-modal': 'true', 'aria-label': title || sub || '对话框' });
      modal.appendChild(h('div', { class: 'modal__hd' }, [
        opts.kicker ? h('div', { class: 'modal__kicker' }, opts.kicker) : null,
        h('div', { class: 'modal__ttl' }, title),
        Core.sub(sub) ? h('div', { class: 'modal__it' }, Core.sub(sub)) : null
      ]));
      var bd = h('div', { class: 'modal__bd' });
      (contentEls || []).forEach(function (c) { if (c) bd.appendChild(c); });
      modal.appendChild(bd);
      if (footerEls) modal.appendChild(h('div', { class: 'modal__ft' }, footerEls));
      scrim.appendChild(modal);
      if (opts.onScrim) Core.on(scrim, 'click', function (e) { if (e.target === e.currentTarget) opts.onScrim(); });
      if (opts.onScrim) Core.on(scrim, 'keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); opts.onScrim(); }
      });
      return scrim;
    };

    V.eventModal = function (st, act) {
      var vm = Sel.eventView(st);
      if (!vm) return null;
      var bd = h('div', { class: 'event-sheet' });
      var narrative = h('div', { class: 'event-sheet__narrative' });
      var body = h('div', { class: 'modal__body' });
      body.innerHTML = vm.body.zh.replace(/\*\*(.+?)\*\*/g, '<em>$1</em>');
      narrative.appendChild(body);
      /* A counted result, when the event carries one: a heading, a line, then
         the tally itself in rows, so a column of figures can be read down. */
      if (vm.result) {
        var rz = h('div', { class: 'evres' });
        if (vm.result.title) rz.appendChild(h('div', { class: 'evres__t' }, Core.L(vm.result.title)));
        if (vm.result.body) rz.appendChild(h('div', { class: 'evres__b' }, Core.L(vm.result.body)));
        if (vm.result.rows && vm.result.rows.length) {
          var tb = h('div', { class: 'evres__rows' });
          vm.result.rows.forEach(function (r) {
            tb.appendChild(h('div', { class: 'evres__r' + (r.tone ? ' is-' + r.tone : '') }, [
              h('span', { class: 'evres__k' }, Core.L(r.label)),
              h('span', { class: 'evres__v' }, r.value)
            ]));
          });
          rz.appendChild(tb);
        }
        if (vm.result.note) rz.appendChild(h('div', { class: 'evres__n' }, Core.L(vm.result.note)));
        narrative.appendChild(rz);
      }
      bd.appendChild(narrative);
      var choices = h('div', { class: 'event-sheet__choices' });
      choices.appendChild(h('div', { class: 'event-sheet__choicehead' }, [
        h('span', { class: 'event-sheet__choice-title' }, '作出抉择'),
        h('span', { class: 'event-sheet__choice-count' }, Core.fmt(vm.options.length) + ' 项选择 · SCELTE')
      ]));
      vm.options.forEach(function (o, index) {
        choices.appendChild(h('button', {
          class: 'opt', disabled: !o.enabled,
          onclick: function () { act.resolveEvent(o.id); }
        }, [
          h('div', { class: 'opt__h' }, [
            h('span', { class: 'event-sheet__number', 'aria-hidden': 'true' }, Core.roman(index + 1)),
            h('span', { class: 'opt__n' }, o.text.zh),
            optionLine(o) ? h('span', { class: 'opt__i' }, optionLine(o)) : null
          ]),
          o.preview && o.preview.length ? h('div', { class: 'opt__p' }, o.preview.map(function (p) {
            var lbl = typeof p === 'string' ? p : (p.zh || p.label || '');
            return h('span', { class: 'opt__pv' + (/−/.test(lbl) ? ' dn' : (/\+/.test(lbl) ? ' up' : '')) }, lbl);
          })) : null,
          (!o.enabled && o.reason) ? h('div', { class: 'opt__lock' }, '✕ ' + Core.L(o.reason)) : null
        ]));
      });
      bd.appendChild(choices);
      return V.modal(Core.L(vm.title), vm.title, [bd], [
        h('div', { class: 'tiny', style: { color: 'rgba(42,30,16,.55)', marginRight: 'auto' } },
          vm.superEvent ? T('ev.supreme') : T('ev.nofree'))
      ], { cls: 'modal--event' + (vm.superEvent ? ' modal--wide' : ''), kicker: vm.superEvent ? '重大事件 · EVENTO STRAORDINARIO' : '时局纪事 · CRONACA' });
    };

    return V;
  });
