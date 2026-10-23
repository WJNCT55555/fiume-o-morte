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
    /* Advisor portraits travel with the advisor data now
       (`src/game/advisors/*.ts` → `Advisor.portrait`), because this legacy view
       layer and the React screens read the same roster. Those paths are
       project-relative (`img/Portrait/...`), matching every other asset path
       in this file. A missing portrait is not an error: `avatar` draws the
       initial-letter plate instead of borrowing another man's face. */
    function assetUrl(path) {
      return path ? String(path).replace(/^\/+/, '') : '';
    }
    var HOLDER_AVATAR = {
      esteri: V.IMG.comandante, difesa: V.IMG.hostventuri,
      interno: V.IMG.bacci, finanze: V.IMG.pantaleoni
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
    /* A titled panel. `sub` is a SECOND, different line — a rule, a count, a
       scope note — and it is a translated node or a plain string already in the
       active language. It is not a translation of the title: the UI shows one
       language at a time, so nothing is printed twice. */
    function banner(title, sub) {
      var s = (sub && typeof sub === 'object') ? Core.L(sub) : sub;
      return h('div', { class: 'banner' }, [
        h('div', { class: 'banner__t' }, title),
        s ? h('div', { class: 'banner__s' }, s) : null
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
        h('div', { class: 'resbar__d2' }, T('bar.era') + ' ' + T('bar.anndi', { n: Core.roman(era) }))
      ])];
      [res[0], res[1], res[3]].forEach(function (r) {
        /* One line, in the active locale. The Italian used to be printed
           underneath as a second line; the UI is single-language now. */
        slots.push(h('div', { class: 'resslot', title: Core.L(r) }, [
          h('div', { class: 'medallion' }, icon(r.icon, 19)),
          h('div', { class: 'resslot__b' }, [
            h('div', { class: 'resslot__k' }, Core.L(r)),
            h('div', { class: 'resslot__v' }, [r.main + (r.unit ? ' ' + r.unit : ''), deltaChip(r.delta, r.invert)])
          ])
        ]));
      });
      slots.push(h('div', { class: 'resslot resslot--crisis' }, [
        h('div', { class: 'medallion' }, icon('flame', 19)),
        h('div', { class: 'resslot__b' }, [
          h('div', { class: 'resslot__k' }, T('bar.crisi')),
          h('div', { class: 'resslot__v' }, Math.round(crisis.coup) + ' / 100')
        ])
      ]));
      slots.push(h('div', { class: 'resslot resslot--ap' }, [
        h('div', { class: 'resslot__b' }, [
          h('div', { class: 'resslot__k' }, T('bar.ap')),
          h('div', { class: 'resslot__v' }, st.ap + ' / ' + st.maxAp)
        ])
      ]));
      slots.push(h('div', { class: 'resbar__motto' }, [
        st.difficulty === 'sandbox' ? h('button', {
          class: 'evboard-btn sandbox-trigger', type: 'button', title: T('sandbox.title'),
          onclick: act.openSandbox
        }, [icon('gear', 13), T('sandbox.title')]) : null,
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
        /* `it` travels with the name: the map prints it through Core.L. */
        return {
          id: u.id, zh: u.zh, it: u.it, lon: u.lon, lat: u.lat, kind: u.kind,
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
        h('button', { class: 'mapcanvas__zoom', title: T('map.zoom.in'), disabled: MapView.zoom >= MapView.maxZoom, onclick: function () { MapView.zoomBy(1.35); } }, '+'),
        h('button', { class: 'mapcanvas__zoom', title: T('map.zoom.out'), disabled: MapView.zoom <= MapView.minZoom, onclick: function () { MapView.zoomBy(1 / 1.35); } }, '−'),
        h('button', { class: 'mapcanvas__zoom mapcanvas__zoom--reset', title: T('map.zoom.reset'), onclick: function () { MapView.resetZoom(); } }, '⤢')
      ]));
      canvas.appendChild(h('div', { class: 'mapcanvas__hint' }, T('map.hint')));
      var chosen = dists.filter(function (d) { return d.id === ui.district; })[0];
      var detail = chosen ? frame('district-detail', [
        banner(Core.L(chosen)),
        h('div', { class: 'district-detail__body' }, [
          field(T('map.control'), Math.round(chosen.control) + ' / 100', true),
          field(T('map.agitation'), Math.round(chosen.agitation) + ' / 100'),
          MapView.occupation(chosen.id, st.date) === 'italy'
            ? h('div', { class: 'small dim' }, T('map.note.italian')) : null,
          h('div', { class: 'small dim' }, Core.L(chosen.note) + T('map.note.schematic'))
        ])
      ]) : null;
      return h('div', { class: 'col' }, [
        frame('', [
          h('div', { class: 'row row--between', style: { padding: '5px 9px', borderBottom: '1px solid var(--hair-soft)' } }, [
            h('div', { class: 'row', style: { gap: '7px' } }, [
              h('span', { class: 'chip' }, T('map.scope', { n: dists.length }))
            ]),
            h('span', { class: 'tiny dim2' }, T('map.base'))
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
            h('div', { class: 'pick__n', style: { fontSize: '13px' } }, Core.L(d)),
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
          T('evboard.done.count', { n: rows.length - pending.length })));
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
        banner(T('ev.title'), pending.length ? T('ev.pending.count', { n: pending.length }) : T('ev.pending.none')),
        body
      ]);
    }

    function consiglieriPanel(st, act) {
      var av = Sel.advisors(st);
      var body = h('div', { style: { padding: '8px 11px' } }, [
        h('div', { class: 'tiny dim2', style: { marginBottom: '6px' } },
          T('adv.seated', { a: st.advisors.active.length, b: 3 }) + ' · ' +
          T('adv.cooldown', { n: Eng.advisorCooldown(st) / 2 }))
      ]);
      av.forEach(function (a) {
        var row = h('div', { class: 'adv' }, [
          avatar(assetUrl(a.portrait), a.zh.slice(0, 1)),
          h('div', { class: 'adv__b' }, [
            h('div', { class: 'adv__n' }, Core.L(a)),
            h('div', { class: 'adv__x' }, Core.L(a.bio)),
            h('div', { class: 'adv__m' }, [
              h('span', { class: 'chip' }, [h('span', { class: 'swatch', style: { background: a.factionColor } }), Core.L({ zh: a.factionZh, it: a.factionIt })]),
              h('span', { class: 'chip ' + (a.dissent > 60 ? 'chip--bad' : a.dissent > 40 ? 'chip--warn' : '') }, T('adv.dissent', { n: a.dissent }))
            ]),
            (function () {
              var btns = h('div', { class: 'row', style: { gap: '5px', marginTop: '3px' } });
              if (a.active) {
                btns.appendChild(h('button', {
                  class: 'btn btn--sm',
                  onclick: function () { act.openAdvisor(a.id); }
                }, T('adv.menu')));
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
              h('div', { class: 'jrn__title' }, Core.L(j)),
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
          h('span', { class: 'logline__x' }, Core.L(l))
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
    /* Every player-facing string on this tab now comes from I18N.STRINGS via
       T(). The `ecoText(zh, it)` helper that used to build inline bilingual
       nodes is gone with the bilingual UI: one language is shown at a time. */

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

    /* The model documentation used to sit inside the economy and crisis tabs as
       two collapsible blocks. It lives in Settings → 图书馆 now: the panels keep
       the readings a player acts on, and the arithmetic is one deliberate visit
       away instead of a wall of text in the middle of a decision.
       `ecoFormulaBook` therefore returns the plain group grid — the <details>
       wrapper belongs to the library, not to the model. */
    function ecoFormulaGroups(st, ec) {
      var e = st.economy;
      var grid = h('div', { class: 'eco-formulas__grid' });
      var flow = h('section', { class: 'eco-formulas__group' }, [
        h('h4', {}, T('lib.formulas')),
        ecoFormula(T('lib.eco.trafficTarget'), T('lib.eco.trafficTarget.math'), ec.trafficTarget.toFixed(1)),
        ecoFormula(T('lib.eco.industry'), T('lib.eco.industry.math'), ec.industryActivity.toFixed(1)),
        ecoFormula(T('lib.eco.unempTarget'), T('lib.eco.unempTarget.math'), ec.unemploymentTarget.toFixed(1) + '%'),
        ecoFormula(T('lib.eco.inflTarget'), T('lib.eco.inflTarget.math'), ec.inflationTarget.toFixed(1) + '%')
      ]);
      var confidence = h('section', { class: 'eco-formulas__group' }, [
        h('h4', {}, T('lib.confidence')),
        ecoFormula(T('lib.eco.confTarget'), T('lib.eco.confTarget.math'), ec.confidenceTarget.toFixed(1)),
        ecoFormula(T('lib.eco.emigration'), T('lib.eco.emigration.math'), Core.fmt(Math.round(ec.emigration))),
        ecoFormula(T('lib.eco.nextPop'), T('lib.eco.nextPop.math'), Core.fmt(Math.max(30000, e.population - ec.emigration + 30))),
        ecoFormula(T('lib.eco.convergence'), T('lib.eco.convergence.math'), T('lib.eco.each'))
      ]);
      var fiscal = h('section', { class: 'eco-formulas__group eco-formulas__group--wide' }, [
        h('h4', {}, T('lib.fiscal')),
        ecoFormula(T('eco.tax.porto'), T('lib.eco.tax.porto.math'), Core.fmt(ec.revenue.porto)),
        ecoFormula(T('eco.tax.dogana'), T('lib.eco.tax.dogana.math'), Core.fmt(ec.revenue.dogana)),
        ecoFormula(T('eco.tax.consumo'), T('lib.eco.tax.consumo.math'), Core.fmt(ec.revenue.consumo)),
        ecoFormula(T('lib.eco.incomeTax'), T('lib.eco.incomeTax.math'), Math.round(ec.incomeTaxRate * 100) + '%'),
        ecoFormula(T('eco.tax.reddito'), T('lib.eco.tax.reddito.math'), Core.fmt(ec.revenue.reddito)),
        ecoFormula(T('eco.spending'), T('lib.eco.spending.math'), Core.fmt(ec.spending.total)),
        ecoFormula(T('eco.net'), T('lib.eco.net.math'), Core.signed(ec.net, 1))
      ]);
      grid.appendChild(flow); grid.appendChild(confidence); grid.appendChild(fiscal);
      return grid;
    }

    /* The library: the three model chapters, rendered flat (no collapsible
       wrapper) for the settings modal. Every string here is an i18n key, so the
       whole page follows the language setting like the rest of the UI. */
    V.formulaLibrary = function (st) {
      var ec = Sel.economy(st);
      var cr = Sel.crisis(st);
      var wrap = h('div', { class: 'library' });
      wrap.appendChild(h('p', { class: 'library__intro' }, T('lib.intro')));

      var ecoGroup = h('section', { class: 'eco-formulas__group eco-formulas__group--wide' }, [
        h('h4', {}, T('lib.economy')),
        h('p', { class: 'eco-formulas__intro' }, T('lib.economy.sub'))
      ]);
      /* The formula grid brings its own three <section>s; the chapter heading
         above it names the whole thing. */
      ecoGroup.appendChild(ecoFormulaGroups(st, ec));
      wrap.appendChild(ecoGroup);

      wrap.appendChild(h('section', { class: 'eco-formulas__group eco-formulas__group--wide' }, [
        h('h4', {}, T('lib.crisis')),
        h('p', { class: 'eco-formulas__intro' }, T('lib.crisis.sub')),
        h('div', { class: 'small', style: { marginTop: '6px' } }, T('lib.tension')),
        h('div', { class: 'mono small' }, T('lib.tension.math')),
        h('div', { class: 'small', style: { marginTop: '6px' } }, T('lib.siege')),
        h('div', { class: 'mono small' }, T('lib.siege.math')),
        h('div', { class: 'small', style: { marginTop: '6px' } }, T('lib.plot')),
        h('div', { class: 'mono small' }, T('lib.plot.math')),
        h('div', { class: 'tiny dim2', style: { marginTop: '6px' } }, T('lib.axes'))
      ]));

      var law = (Sel.electoralLaw ? Sel.electoralLaw() : null);
      var ele = h('section', { class: 'eco-formulas__group eco-formulas__group--wide' }, [
        h('h4', {}, T('lib.election')),
        h('p', { class: 'eco-formulas__intro' }, T('lib.election.sub'))
      ]);
      if (law) {
        ele.appendChild(h('div', { class: 'mono small' },
          T('lib.election.seats', { total: law.total, cm: law.cityMajority, cn: law.cityMinority,
            sm: law.subMajority, sn: law.subMinority, th: law.threshold })));
      }
      ele.appendChild(h('div', { class: 'tiny dim2', style: { marginTop: '6px' } }, T('lib.note.election')));
      wrap.appendChild(ele);
      return wrap;
    }

    function tabEconomia(st) {
      var ec = Sel.economy(st);
      var col = h('div', { class: 'col' });
      var body = h('div', { class: 'eco-dashboard' });

      body.appendChild(h('div', { class: 'eco-kpis' }, [
        ecoStat(T('eco.net'), Core.signed(ec.net, 1), ' K£',
          T('eco.kpi.net'), ec.net >= 0 ? 'good' : 'bad'),
        ecoStat(T('eco.debt'), Core.fmt(ec.debt), ' K£',
          T('eco.kpi.net.note'), 'bad'),
        ecoStat(T('cri.unemp'), ec.unemployment.toFixed(1), '%',
          T('eco.kpi.target', { n: ec.unemploymentTarget.toFixed(1) }), ec.unemployment > 25 ? 'bad' : ''),
        ecoStat(T('eco.infl'), ec.inflation.toFixed(1), '%',
          T('eco.kpi.target', { n: ec.inflationTarget.toFixed(1) }), ec.inflation > 16 ? 'bad' : '')
      ]));

      body.appendChild(h('div', { class: 'eco-sectionhead' }, [
        h('span', {}, T('eco.blocks.port')),
        h('small', {}, T('eco.scale.note'))
      ]));
      body.appendChild(h('div', { class: 'ecoport-grid' }, [(function () {
        var head = h('div', { class: 'ecometric--lead' });
        head.appendChild(h('div', { class: 'ecometric__hd' }, [
          h('span', { class: 'ecometric__k' }, T('eco.traffic')),
          h('span', { class: 'ecometric__v num' }, ec.traffic.toFixed(1))
        ]));
        head.appendChild(h('div', { class: 'eco-target' }, [
          h('span', {}, T('eco.chart.current')),
          h('strong', { class: 'num' }, ec.trafficTarget.toFixed(1))
        ]));
        var tr = h('div', { class: 'bar eco-trafficbar' });
        tr.appendChild(h('div', { class: 'bar__fill', style: { width: Core.clamp(ec.traffic, 0, 100) + '%' } }));
        tr.appendChild(h('div', { class: 'eco-trafficbar__target', style: { left: Core.clamp(ec.trafficTarget, 0, 100) + '%' } }));
        head.appendChild(tr);
        head.appendChild(h('div', { class: 'eco-leadnote' }, T('eco.chart.lead')));
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
        h('span', {}, T('eco.trend.title')),
        h('small', {}, T('eco.trend.sub'))
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
        else cell.appendChild(h('div', { class: 'ecotrend__empty' }, T('eco.trend.empty')));
        trendRow.appendChild(cell);
      });
      body.appendChild(trendRow);
      body.appendChild(h('div', { class: 'eco-sectionhead' }, [
        h('span', {}, T('eco.blocks.budget')),
        h('small', {}, T('eco.trend.est'))
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
      /* The formula book has moved to Settings → 图书馆. This tab keeps the
         readings and the levers; the arithmetic is one deliberate visit away. */
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
          row.appendChild(h('button', { class: 'advslot advslot--empty', type: 'button',
            disabled: !pool.length, onclick: act.openAdvisorDeck }, [
            h('div', { class: 'advslot__i' }, Core.roman(i + 1)),
            h('div', { class: 'advslot__e' }, T('adv.empty'))
          ]));
          continue;
        }
        var card = h('button', { class: 'advslot advslot--full', type: 'button',
          'aria-label': Core.L(a) + ' · ' + T('adv.menu'), 'aria-haspopup': 'dialog',
          onclick: act.openAdvisor.bind(null, a.id) });
        var status = a.cdLeft > 0 ? T('adv.cooling', { n: a.cdLeft / 2 }) :
          a.availableCount ? T('adv.ready', { n: a.availableCount }) : T('adv.unavailable');
        card.appendChild(h('div', { class: 'advslot__portrait' + (a.portrait ? '' : ' is-placeholder') }, [
          a.portrait
            ? h('img', { src: assetUrl(a.portrait), alt: Core.L(a), loading: 'lazy' })
            : h('span', { class: 'advslot__initial', 'aria-hidden': 'true' }, a.zh.slice(0, 1)),
          h('span', { class: 'advslot__seat', 'aria-hidden': 'true' }, Core.roman(i + 1)),
          h('span', { class: 'advslot__status' + (a.availableCount ? ' is-ready' : ''),
            title: status, 'aria-label': status })
        ]));
        card.appendChild(h('div', { class: 'advslot__caption' }, [
          h('div', { class: 'advslot__n' }, Core.L(a)),
          h('div', { class: 'advslot__f' }, [
            h('span', { class: 'advslot__faction-mark', style: { background: a.factionColor }, 'aria-hidden': 'true' }),
            h('span', {}, Core.L({ zh: a.factionZh, it: a.factionIt }))
          ]),
          h('span', { class: 'advslot__open', 'aria-hidden': 'true' }, Orn.decoArrow())
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
        banner(T('adv.title'), T('adv.sub') + ' · ' + T('adv.seated', { a: seated.length, b: 3 })),
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
            avatar(assetUrl(a.portrait), a.zh.slice(0, 1)),
            h('div', { class: 'deckrow__b' }, [
              h('div', { class: 'deckrow__n' }, Core.L(a)),
              h('div', { class: 'deckrow__t' }, Core.L(a.bio)),
              h('div', { class: 'advslot__act' }, T('adv.options', { n: a.optionCount }) + ' · ' +
                a.actions.map(function (o) { return Core.L(o.text); }).join(' / '))
            ]),
            h('div', { class: 'deckrow__m' }, [
              h('span', { style: { color: a.factionColor } }, Core.L({ zh: a.factionZh, it: a.factionIt })),
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

    V.advisorModal = function (st, advisorId, act) {
      var a = Sel.advisorView(st, advisorId);
      if (!a) return null;
      var profile = h('div', { class: 'advisor-menu__profile' }, [
        avatar(assetUrl(a.portrait), a.zh.slice(0, 1), 'advisor-menu__portrait'),
        h('div', { class: 'advisor-menu__identity' }, [
          h('div', { class: 'advisor-menu__faction', style: { color: a.factionColor } },
            Core.L({ zh: a.factionZh, it: a.factionIt })),
          a.external ? null : h('div', { class: 'advisor-menu__dissent' }, T('adv.dissent', { n: a.dissent.toFixed(1) })),
          h('p', { class: 'advisor-menu__bio' }, Core.L(a.bio))
        ])
      ]);
      var directives = h('div', { class: 'advisor-menu__directives' }, [
        h('div', { class: 'advisor-menu__choicehead' }, [
          h('strong', {}, T('adv.directives')),
          h('span', {}, T('adv.cost'))
        ]),
        h('p', { class: 'advisor-menu__rule' }, T('adv.rule', { n: st.advisors.cooldown / 2 }))
      ]);
      a.actions.forEach(function (option, index) {
        directives.appendChild(h('button', {
          class: 'opt opt--advisor', disabled: !option.enabled,
          onclick: function () { act.useAdvisor(a.id, option.id); }
        }, [
          h('div', { class: 'opt__h' }, [
            h('span', { class: 'advisor-menu__number', 'aria-hidden': 'true' }, Core.roman(index + 1)),
            h('span', { class: 'opt__n' }, Core.L(option.text)),
            h('span', { class: 'opt__i' }, Core.L(option.subtitle))
          ]),
          option.preview.length ? h('div', { class: 'opt__p' }, option.preview.map(function (line) {
            return h('span', { class: 'opt__pv' + (/−/.test(line) ? ' dn' : (/\+/.test(line) ? ' up' : '')) }, line);
          })) : null,
          option.reason ? h('div', { class: 'opt__lock' }, Core.L(option.reason)) : null
        ]));
      });
      return V.modal(Core.L(a), T('adv.menu'), [
        h('div', { class: 'advisor-menu' }, [profile, directives])
      ], [
        h('button', { class: 'btn btn--ghost advisor-menu__fire', onclick: function () { act.fireAdvisor(a.id); } }, T('adv.fire')),
        h('button', { class: 'btn btn--primary', onclick: act.closeModal }, T('btn.back'))
      ], { cls: 'modal--advisor', kicker: T('adv.menu'), onScrim: act.closeModal });
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
            h('div', { class: 'deck__n', style: { color: d.drawable ? 'var(--gold-pale)' : 'rgba(233,220,188,.4)' } }, Core.L(d)),
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
      /* The coup thresholds differ before and after Bloody Christmas, so the two
         periods are separate ladders. There is no line here announcing the
         Rapallo deadline: the date is already on the calendar, and a permanent
         "the attack comes on 24 December" chip told the player nothing they
         could act on. */
      if (!st.flags.natale_done) {
        if (cr.coup >= 75) alerts.push(['bad', T('br.coup.75', { n: Math.round(cr.coup) })]);
        else if (cr.coup >= 40) alerts.push(['warn', T('br.coup.40', { n: Math.round(cr.coup) })]);
      } else {
        if (cr.coup >= 70) alerts.push(['bad', T('br.coup.70', { n: Math.round(cr.coup) })]);
        if (cr.squadre >= 55) alerts.push(['bad', T('br.squadre', { n: Math.round(cr.squadre) })]);
      }
      if (cr.violence >= 55) alerts.push(['bad', T('br.violence', { n: Math.round(cr.violence) })]);
      if (ec.unemployment >= 26) alerts.push(['warn', T('br.unemployment', { n: ec.unemployment.toFixed(1) })]);
      if (ec.traffic < 26) alerts.push(['warn', T('br.traffic', { n: ec.traffic.toFixed(1) })]);
      if (ec.net < 0) alerts.push(['warn', T('br.deficit', { n: Core.signed(ec.net, 1) })]);
      if (ec.inflation > 22) alerts.push(['warn', T('br.inflation', { n: ec.inflation.toFixed(1) })]);
      if (fac.dissent > 35) alerts.push(['warn', T('br.dissent', { a: fac.dissent.toFixed(0), b: fac.unity.toFixed(0) })]);
      if (cr.milizia < 500 && !st.flags.natale_done) alerts.push(['bad', T('br.milizia', { n: Core.fmt(cr.milizia) })]);
      /* The journals line is gone too: "进行中的日志：事业的第一年" restated what the
         diary panel already shows, and it pushed a real warning off the six-line
         budget whenever two logs were running. */
      if (!alerts.length) alerts.push(['ok', T('br.calm')]);

      var grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '8px' } });
      [[T('br.trafficShort'), ec.traffic.toFixed(1), T('br.target') + ' ' + ec.trafficTarget.toFixed(1), '#EBD07A'],
       [T('br.unempShort'), ec.unemployment.toFixed(1) + '%', T('eco.infl') + ' ' + ec.inflation.toFixed(1) + '%', '#E8A9A2'],
       [T('br.net'), Core.signed(ec.net, 1), T('eco.debt') + ' ' + Core.fmt(ec.debt), ec.net >= 0 ? '#B9D69B' : '#E8A9A2'],
       [T('bar.crisi'), String(Math.round(Math.min(100, cr.coup))), cr.milestoneDefs.length ? T('br.next') + ' ' + (cr.milestoneDefs.filter(function (m) { return cr.milestones.indexOf(m.id) < 0; })[0] || {}).at : '', cr.coup > 60 ? '#E8A9A2' : '#B9D69B']
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
            T(a[0] === 'bad' ? 'br.tag.bad' : a[0] === 'warn' ? 'br.tag.warn' : a[0] === 'info' ? 'br.tag.info' : 'br.tag.ok')),
          h('span', { class: 'small', style: { color: 'rgba(233,220,188,.84)' } }, a[1])
        ]));
      });
      return frame('', [banner(T('rep.title'), T('rep.sub')), body]);
    }

    /* The option's second line: its subtitle in the active language.
       Cards always carry one; event options carry one only where the author
       wanted to say something extra (about a quarter of them — the "this is the
       historical choice" markers live here). When an option has no subtitle the
       line is simply absent.

       It is NOT the option text repeated. Until 2026-10 this fell back to
       `Core.sub(o.text)`, which returned the active language's own text: fine
       while Chinese was the only playable locale, but in Italian it printed the
       option twice, once above the other.
       Returns a plain string so callers can place it inline; an empty string
       means there is nothing to show. */
    function optionLine(o) {
      return o.subtitle ? Core.L(o.subtitle) : '';
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

      /* Keep the whole node rather than flattening it to `zh`: the rail renders
         it through Core.L, so a party name has to stay a {zh, it} pair. */
      var parties = rel.rows.map(function (r) {
        return { id: r.id, zh: r.zh, it: r.it, short: r.short, color: r.color, camp: r.camp,
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
        h('div', { class: 'chordhead__s' }, T('chord.sub')),
        h('div', { class: 'chordhead__r' }, [h('i', {}), h('b', {}), h('i', {})])
      ]);

      /* Share of the electorate — the length of each arc. It lives in the rail
         because it is party reference data of the same kind as the emblems
         above it, and because the plate below is then a clean square that can
         be sized to meet the rail without a ragged caption under it. */
      var caption = h('div', { class: 'chordrail__sec' }, [
        h('div', { class: 'chordrail__sh' }, [
          h('span', { class: 'chordrail__ht' }, T('chord.support'))
        ])
      ].concat(parties.map(function (p) {
        return h('div', { class: 'chordrail__s', title: Core.L(p) }, [
          h('i', { class: 'chordrail__ssw', style: { background: p.color } }),
          h('span', { class: 'chordrail__sk' }, p.short),
          h('span', { class: 'chordrail__sn2' }, Core.L(p)),
          h('span', { class: 'chordrail__sv' }, p.weight.toFixed(1) + '%')
        ]);
      })));

      /* One bar, read left to right: cold to warm. */
      var scale = h('div', { class: 'chordkey' }, [
        h('span', { class: 'chordkey__e' }, T('rel.opposed')),
        h('i', { class: 'chordkey__scale' }, [h('b'), h('b'), h('b')]),
        h('span', { class: 'chordkey__e' }, T('rel.close')),
        h('span', { class: 'chordkey__i' },
          h('span', {}, T('chord.keynote')))
      ]);

      var note = h('div', { class: 'tiny dim2', style: { marginTop: '8px' } },
        T('chord.note'));

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
      var myName = mine ? Core.L(mine) : '';
      var rail = h('div', { class: 'chordrail' }, [
        h('div', { class: 'chordrail__h' }, [
          h('span', { class: 'chordrail__ht' }, T('chord.mine.title', { a: myName }))
        ])
      ].concat(
        (mine ? mine.cells.slice() : []).sort(function (a, b) { return b.v - a.v; })
          .map(function (c) {
            var p = W.PARTY_BY_ID[c.id] || { zh: c.id, short: c.id, color: '#888' };
            var col = Charts.warmthColor(c.v);
            var badge = p.emblem
              ? h('img', { class: 'chordrail__em', src: p.emblem, alt: '' })
              : h('span', { class: 'chordrail__em chordrail__em--flat', style: { background: p.color } });
            return h('div', { class: 'chordrail__r', title: T('chord.tip.row', { a: myName, b: Core.L(p), v: c.v.toFixed(1) }) }, [
              h('i', { class: 'chordrail__fill',
                style: { width: Core.round1(Charts.warmth(c.v) * 100) + '%', background: col } }),
              badge,
              h('span', { class: 'chordrail__tx' }, [
                h('span', { class: 'chordrail__n' }, Core.L(p)),
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
            h('span', { class: 'chordkey__e' }, T('rel.opposed')),
            h('i', { class: 'chordkey__scale' }, [h('b'), h('b'), h('b')]),
            h('span', { class: 'chordkey__e' }, T('rel.close'))
          ]),
          h('div', { class: 'chordrail__sn' }, T('chord.keynote'))
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

    /* ---- Arengo: the Charter's two councils ----------------------------------
       Deliberately thin. The seat arcs, the apportionment figures and the
       chamber captions all live in src/ui/arengo.ts, which is a normal ES module
       and can therefore import the dependency-free d3-parliament chart directly.
       This legacy IIFE cannot import anything, so it only finds the node and
       hands it over through the `Fiume.Arengo` global.
       The 1921 general election (Sel.parliament / state.assembly) is untouched —
       it simply no longer has a tab of its own. */
    /* ---- Arengo -------------------------------------------------------------
       Two halves. The upper half is the Regency's own machinery — the seven
       Rectors and the party-relations panel — which used to live on this tab and
       must not be lost with the chart. The lower half is the Charter's two
       councils, drawn by src/ui/arengo.ts.
       The seat arcs and the apportionment figures live in that ES module because
       this legacy IIFE cannot import anything; it hands the node over through the
       `Fiume.Arengo` global. The 1921 general election (state.assembly) is
       untouched — it simply no longer has a tab of its own. */
    function tabArengo(st) {
      var ret = Sel.rettori(st);
      var col = h('div', { class: 'col' });

      /* ---- the seven Rectors ---- */
      var cb = h('div', { style: { padding: '9px 11px' } });
      ret.forEach(function (m) {
        cb.appendChild(h('div', { class: 'adv' }, [
          avatar(HOLDER_AVATAR[m.id], (m.holder || m.zh).slice(0, 1), 'adv__av'),
          h('div', { class: 'adv__b' }, [
            h('div', { class: 'adv__n' }, Core.L(m)),
            h('div', { class: 'adv__x' }, m.holder ? (T('cab.holder') + m.holder) : T('cab.power') + ' ' + (m.power * 100).toFixed(0) + '%'),
            h('div', { class: 'adv__m' }, [
              h('span', { class: 'chip' + (m.mine ? ' chip--gold' : '') }, [h('span', { class: 'swatch', style: { background: m.color } }), Core.L({ zh: m.ownerZh, it: m.ownerIt })]),
              h('span', { class: 'chip' }, T('cab.weight') + ' ' + (m.power * 100).toFixed(0) + '%')
            ])
          ])
        ]));
      });
      cb.appendChild(h('div', { class: 'tiny dim2' },
        T('cab.coalition') + st.coalition.members.map(function (m) { return W.PARTY_BY_ID[m] ? Core.L(W.PARTY_BY_ID[m]) : m; }).join(' + ') +
        ' · ' + T('cab.cohesion') + ' ' + st.coalition.cohesion.toFixed(0)));
      col.appendChild(frame('', [banner(T('gab.title'), T('gab.sub')), cb]));

      /* ---- party relations ---- */
      col.appendChild(relationsPanel(st));

      /* ---- the Charter's two councils ---- */
      var api = (typeof globalThis !== 'undefined' ? globalThis : window).Fiume;
      if (!api || !api.Arengo || typeof api.Arengo.render !== 'function') {
        col.appendChild(frame('', [banner(T('ar.title')), h('div', { class: 'assembly-empty' }, [
          h('strong', {}, T('ar.nomount')),
          h('span', {}, T('ar.nomount.sub'))
        ])]));
        return col;
      }
      var mount = h('div', { class: 'arengo-mount' });
      col.appendChild(mount);
      /* Render after the node is in the document so the SVG can measure itself. */
      (window.requestAnimationFrame || function (f) { f(); })(function () {
        try { api.Arengo.render(mount, st); }
        catch (e) { mount.appendChild(h('div', { class: 'tiny dim' }, T('ar.err.render', { m: (e && e.message) || '' }))); }
      });
      return col;
    }


    function tabDiplomazia(st, act) {
      var d = Sel.diplo(st);
      var forces = Sel.forze(st);
      var col = h('div', { class: 'col diplo-dossier' });
      var activePosture = d.postures.filter(function (p) { return p.active; })[0];
      col.appendChild(h('div', { class: 'diplo-intro' }, [
        h('div', { class: 'diplo-intro__copy' }, [
          h('strong', {}, T('dip.dossier')),
          h('span', {}, T('dip.intro'))
        ]),
        h('div', { class: 'diplo-intro__posture' }, [
          h('small', {}, T('dip.posture.current')),
          h('strong', {}, activePosture ? Core.L(activePosture) : T('dip.unspecified'))
        ])
      ]));

      var b = h('div', { class: 'diplo-relations' });
      var groups = [
        { label: 'dip.groups.neighbours', ids: ['italy', 'yugoslavia'] },
        { label: 'dip.groups.entente', ids: ['uk', 'france', 'usa', 'league'] },
        { label: 'dip.groups.other', ids: ['soviet'] }
      ];
      groups.forEach(function (group) {
        b.appendChild(h('div', { class: 'diplo-relations__group' }, [
          h('strong', {}, T(group.label))
        ]));
        group.ids.forEach(function (id) {
          var a = d.list.filter(function (item) { return item.id === id; })[0];
          if (!a) return;
          var tone = a.value < 25 ? 'cold' : a.value < 60 ? 'cautious' : 'warm';
          var reading = T(a.value < 25 ? 'dip.tone.cold' : a.value < 60 ? 'dip.tone.cautious' : 'dip.tone.warm');
          b.appendChild(h('div', { class: 'relation-entry relation-entry--state relation-entry--' + tone }, [
            h('div', { class: 'relation-entry__head' }, [
              h('span', { class: 'relation-entry__identity' }, [
                h('i', { class: 'relation-entry__sigil', style: { background: a.color }, 'aria-hidden': 'true' }),
                h('span', { class: 'relation-entry__names' }, [
                  h('strong', {}, Core.L(a))
                ])
              ]),
              h('span', { class: 'relation-entry__reading' }, reading),
              h('strong', { class: 'relation-entry__value num' }, a.value.toFixed(1))
            ]),
            h('div', { class: 'relation-track relation-track--state', role: 'meter',
              'aria-label': T('dip.aria.state', { a: Core.L(a) }), 'aria-valuemin': '0', 'aria-valuemax': '100',
              'aria-valuenow': String(a.value) }, [
              h('i', { class: 'relation-track__half', 'aria-hidden': 'true' }),
              h('span', { class: 'relation-track__fill', style: { width: Core.clamp(a.value, 0, 100) + '%' } })
            ])
          ]));
        });
      });
      b.appendChild(h('div', { class: 'relation-scale relation-scale--state' }, [
        h('span', {}, T('dip.scale.low')), h('span', {}, T('dip.scale.mid')), h('span', {}, T('dip.scale.high'))
      ]));

      var fb = h('div', { class: 'forze-relations' });
      var frontMin = W.FORZA_FRONT_MIN == null ? 50 : W.FORZA_FRONT_MIN;
      fb.appendChild(h('div', { class: 'forze-relations__summary' }, [
        h('div', { class: 'forze-relations__heading' }, [
          h('div', {}, [h('strong', {}, T('dip.portico.title'))]),
          h('div', { class: 'forze-relations__pledges', 'aria-label': T('dip.portico.aria', { a: forces.alliedCount, b: W.FORZA_FRONT_NEEDED }) }, [
            icon('laurel', 34), h('strong', {}, forces.alliedCount + '/' + W.FORZA_FRONT_NEEDED)
          ])
        ]),
        h('span', {}, T('dip.portico.note', { a: frontMin }))
      ]));
      // These are decorative monograms, not historical party emblems.
      var forceDesign = {
        fascisti: { label: 'dip.force.fascisti', monogram: 'PNF', icon: 'fasces', color: '#C4764D' },
        socialisti: { label: 'dip.force.socialisti', monogram: 'PSI', icon: 'star', color: '#C95863' },
        anarchici: { label: 'dip.force.anarchici', monogram: 'A', icon: 'flame', color: '#B8B5A4' },
        comunisti: { label: 'dip.force.comunisti', monogram: 'PCI', icon: 'industria', color: '#C54437' },
        corradini: { label: 'dip.force.corradini', monogram: 'ANI', icon: 'eagle', color: '#CFB568' },
        sindacalisti: { label: 'dip.force.sindacalisti', monogram: 'SR', icon: 'milizia', color: '#829C86' }
      };
      var selectedForce = forces.front.filter(function (f) { return f.id === UI.forzaSelectedId; })[0] || forces.front[0];
      var dossier = h('div', { class: 'forze-dossier', id: 'forze-dossier', role: 'region',
        'aria-label': T('dip.dossier.aria'), 'aria-live': 'polite', 'aria-atomic': 'true' });
      var pillars = [];
      function forceStatus(f) {
        return T(f.atGate ? 'dip.status.gate' : f.consolidating ? 'dip.status.hold' : f.value < 0 ? 'rel.opposed' : 'dip.status.open');
      }
      function selectForce(f) {
        UI.forzaSelectedId = f.id;
        pillars.forEach(function (pillar) {
          var selected = pillar.getAttribute('data-force') === f.id;
          pillar.classList.toggle('is-selected', selected);
          pillar.setAttribute('aria-pressed', String(selected));
        });
        var design = forceDesign[f.id];
        dossier.style.setProperty('--force-ink', design.color);
        dossier.replaceChildren(
          h('div', { class: 'forze-dossier__head' }, [
            h('span', { class: 'forze-dossier__seal', 'aria-hidden': 'true' }, icon(design.icon, 24)),
            h('div', { class: 'forze-dossier__identity' }, [h('strong', {}, Core.L(f))]),
            h('span', { class: 'forze-dossier__status' }, forceStatus(f))
          ]),
          h('p', {}, f.note),
          h('div', { class: 'forze-dossier__men' }, T('dip.dossier.men', { n: f.men })),
          h('div', { class: 'forze-dossier__distance' }, [
            h('span', {}, f.atGate ? T('dip.dossier.allied') : T('dip.dossier.distance', { n: f.gate })),
            h('strong', {}, f.atGate ? T('dip.dossier.gate') : T('dip.dossier.gap', { n: (f.gate - f.value).toFixed(1) }))
          ])
        );
      }
      var portico = h('div', { class: 'forze-portico', 'aria-label': T('dip.portico.chart.aria') });
      // The officer corps has its own gate. Its horizontal scale becomes the
      // entablature above the political columns, with room for their readings.
      if (forces.officer) portico.appendChild(officerEntablature(forces.officer));
      var colonnade = h('div', { class: 'forze-portico__colonnade' });
      var guides = h('div', { class: 'forze-portico__guides', 'aria-hidden': 'true' });
      [100, 80, frontMin, 0].forEach(function (value) {
        guides.appendChild(h('div', { class: 'forze-portico__guide' +
          (value === 80 ? ' is-gate' : value === frontMin ? ' is-floor' : value === 0 ? ' is-zero' : ''),
          style: { bottom: value + '%' } }, h('span', {}, String(value))));
      });
      colonnade.appendChild(guides);
      var columnGrid = h('div', { class: 'forze-portico__columns' });
      columnGrid.style.setProperty('--force-count', forces.front.length);
      forces.front.forEach(function (f, index) {
        var design = forceDesign[f.id];
        var position = Core.clamp(f.value, 0, 100);
        var ticks = h('span', { class: 'forze-pillar__ticks', 'aria-hidden': 'true' });
        for (var n = 1; n < 20; n++) ticks.appendChild(h('i', { style: { bottom: (n * 5) + '%' } }));
        var pillar = h('button', {
          class: 'forze-pillar' + (f.atGate ? ' is-at-gate' : '') + (f.value < 0 ? ' is-negative' : ''), type: 'button',
          'data-force': f.id, 'aria-controls': 'forze-dossier', 'aria-pressed': 'false',
          'aria-label': T('dip.pillar.aria', { a: Core.L(f), v: Core.signed(f.value, 1), s: forceStatus(f) }),
          onclick: function () { selectForce(f); },
          onkeydown: function (event) {
            var target;
            if (event.key === 'ArrowRight') target = (index + 1) % pillars.length;
            if (event.key === 'ArrowLeft') target = (index + pillars.length - 1) % pillars.length;
            if (event.key === 'Home') target = 0;
            if (event.key === 'End') target = pillars.length - 1;
            if (target == null) return;
            event.preventDefault();
            // React renders a copy of the legacy view, so focus the live
            // event's column rather than the detached description node.
            event.currentTarget.closest('.forze-portico').querySelectorAll('.forze-pillar')[target].focus();
            selectForce(forces.front[target]);
          }
        }, [
          h('span', { class: 'forze-pillar__head' }, [
            h('small', {}, Core.roman(index + 1)), h('strong', { class: 'num' }, Core.signed(f.value, 1))
          ]),
          h('span', { class: 'forze-pillar__monument' }, [
            h('span', { class: 'forze-pillar__capital', 'aria-hidden': 'true' }),
            h('span', { class: 'forze-pillar__shaft', role: 'meter', 'aria-label': T('dip.aria.state', { a: Core.L(f) }),
              'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(position),
              'aria-valuetext': T('dip.pillar.valuetext', { v: Core.signed(f.value, 1), s: forceStatus(f) }) }, [
              h('span', { class: 'forze-pillar__fill', 'aria-hidden': 'true',
                style: { bottom: '0%', height: position + '%' } }), ticks
            ]),
            h('span', { class: 'forze-pillar__base', 'aria-hidden': 'true' })
          ]),
          h('span', { class: 'forze-pillar__seal', 'aria-hidden': 'true' }, icon(design.icon, 20)),
          h('strong', { class: 'forze-pillar__name' }, T(design.label)),
          h('small', { class: 'forze-pillar__monogram' }, design.monogram),
          h('span', { class: 'forze-pillar__status' }, forceStatus(f))
        ]);
        pillar.style.setProperty('--force-ink', design.color);
        pillars.push(pillar); columnGrid.appendChild(pillar);
      });
      colonnade.appendChild(columnGrid); portico.appendChild(colonnade); fb.appendChild(portico);
      fb.appendChild(h('div', { class: 'forze-portico__legend' }, [
        h('span', {}, T('dip.legend.zero')), h('span', { class: 'is-floor' }, T('dip.legend.floor', { n: frontMin })),
        h('span', { class: 'is-gate' }, T('dip.legend.gate')), h('small', {}, T('dip.legend.click'))
      ]));
      fb.appendChild(dossier);
      if (selectedForce) selectForce(selectedForce);

      function officerEntablature(f) {
        var position = Core.clamp(f.value, 0, 100);
        var ticks = h('span', { class: 'forze-entablature__ticks', 'aria-hidden': 'true' });
        for (var n = 1; n < 20; n++) ticks.appendChild(h('i', { style: { left: (n * 5) + '%' } }));
        return h('div', { class: 'forze-entablature' + (f.atGate ? ' is-at-gate' : '') +
          (f.value < 0 ? ' is-negative' : ''), 'data-force': f.id }, [
          h('div', { class: 'forze-entablature__crown', 'aria-hidden': 'true' }),
          h('div', { class: 'forze-entablature__frieze' }, [
            h('div', { class: 'forze-entablature__inscription' }, [
              h('small', {}, 'CORPO · UFFICIALI'),
              h('span', {}, T('dip.officer.independent'))
            ]),
            h('div', { class: 'forze-entablature__reading' }, [
              h('strong', {}, Core.L(f)),
              h('strong', { class: 'forze-entablature__value num' }, Core.signed(f.value, 1))
            ]),
            h('div', { class: 'forze-entablature__meta' }, [
              h('span', {}, T('dip.officer.gate', { n: f.gate })),
              h('span', { class: 'forze-entablature__status' }, forceStatus(f))
            ])
          ]),
          h('div', { class: 'forze-entablature__track', role: 'meter',
            'aria-label': T('dip.aria.state', { a: Core.L(f) }), 'aria-valuemin': '0', 'aria-valuemax': '100',
            'aria-valuenow': String(position),
            'aria-valuetext': T('dip.pillar.valuetext', { v: Core.signed(f.value, 1), s: forceStatus(f) }) }, [
            h('span', { class: 'forze-entablature__fill', 'aria-hidden': 'true',
              style: { left: '0%', width: position + '%' } }),
            ticks,
            h('i', { class: 'forze-entablature__gate', style: { left: f.gate + '%' }, 'aria-hidden': 'true' })
          ]),
          h('div', { class: 'forze-entablature__cornice', 'aria-hidden': 'true' })
        ]);
      }
      col.appendChild(h('div', { class: 'diplo-relations-grid' }, [
        frame('diplo-column', [banner(T('dip.states'), T('dip.states.sub')), b]),
        frame('diplo-column', [banner(T('dip.forces'), T('dip.forces.sub')), fb])
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
            h('strong', {}, Core.L(po)), h('span', {}, T(po.active ? 'dip.current' : 'dip.choose'))
          ]),
          h('div', { class: 'diplo-posture__it' }, po.it),
          h('p', {}, Core.L({ zh: po.desc, it: po.descIt })),
          h('div', { class: 'diplo-posture__effects' }, po.effects.map(function (effect) {
            return h('span', { class: 'diplo-posture__effect' + (effect.value < 0 ? ' is-negative' : '') },
              Core.L(effect) + ' ' + (effect.value > 0 ? '+' : '−') + Math.abs(effect.value));
          }))
        ]));
      });
      pb.appendChild(grid);
      pb.appendChild(h('p', { class: 'diplo-postures__note' }, T('dip.postures.note')));
      col.appendChild(frame('', [banner(T('dip.posture'), T('dip.posture.line')), pb]));

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
        'aria-label': Core.L({ zh: L.zh, it: L.it }) + ' · ' + T('leg.allLevels') });
      dossier.appendChild(h('div', { class: 'law-dossier__head' }, [
        h('div', { class: 'law-dossier__name' }, [
          h('span', { class: 'law-dossier__eyebrow' }, T('leg.dossier')),
          h('h2', {}, Core.L(L))
        ]),
        h('div', { class: 'law-dossier__seal' }, [
          h('strong', {}, String(L.level)), h('span', {}, '/ ' + L.max)
        ])
      ]));
      dossier.appendChild(h('div', { class: 'law-dossier__current' }, [
        h('span', {}, T('leg.inForce')),
        h('strong', {}, Core.L({ zh: L.label, it: L.labelIt }))
      ]));
      if (charterProgrammed && L.charterTarget != null) dossier.appendChild(h('div', { class: 'law-dossier__charter' },
        T('leg.charterTarget', { n: L.charterTarget }) + ' · ' +
        (L.level >= L.charterTarget ? T('leg.met') : T('leg.pending'))));
      if (L.effect) dossier.appendChild(h('aside', { class: 'law-dossier__effect' }, [
        h('span', { class: 'law-dossier__effect-label' }, T('leg.effect')),
        h('p', {}, Core.L(L.effect))
      ]));
      var course = h('ol', { class: 'law-course', 'aria-label': T('leg.allLevels') });
      (L.levelList || []).forEach(function (entry, n) {
        var status = n < L.level ? 'lower' : n === L.level ? 'current' : 'future';
        course.appendChild(h('li', { class: 'law-course__item law-course__item--' + status }, [
          h('span', { class: 'law-course__number', 'aria-hidden': 'true' }, String(n).padStart(2, '0')),
          h('span', { class: 'law-course__copy' }, [
            h('span', { class: 'law-course__label' }, Core.L(entry)),
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
          h('span', {}, Core.L(r)),
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
        var folio = h('section', { class: 'law-chapter', 'aria-label': Core.L(chapter) });
        folio.appendChild(h('div', { class: 'law-chapter__heading' }, [
          h('span', { class: 'law-chapter__roman', 'aria-hidden': 'true' }, chapter.number),
          h('div', {}, [h('h3', {}, Core.L(chapter))]),
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
          h('strong', { class: 'law-tile__name' }, Core.L(L)),
          h('span', { class: 'law-tile__current' }, Core.L({ zh: L.label, it: L.labelIt })),
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

    /* A curved glass vessel in a turned brass frame. Fill by chamber area so
       the amount of sand, rather than its height, follows the 0–100 pressure. */
    function crisisHourglass(value, color, title) {
      var fraction = Core.clamp(value / W.CRISIS_MAX, 0, 1);
      function curve(from, a, b, to) {
        var points = [];
        for (var i = 1; i <= 32; i++) {
          var t = i / 32, u = 1 - t;
          points.push([u*u*u*from[0] + 3*u*u*t*a[0] + 3*u*t*t*b[0] + t*t*t*to[0],
            u*u*u*from[1] + 3*u*u*t*a[1] + 3*u*t*t*b[1] + t*t*t*to[1]]);
        }
        return points;
      }
      var right = [[134, 44]].concat(curve([134,44], [144,76], [134,100], [110,117]),
        curve([110,117], [98,126], [94,130], [94,138]));
      var upper = right.concat(right.slice().reverse().map(function (p) { return [180 - p[0], p[1]]; }));
      var lower = upper.map(function (p) { return [p[0], 288 - p[1]]; }).reverse();
      function area(points) {
        return Math.abs(points.reduce(function (sum, p, i) {
          var q = points[(i + 1) % points.length];
          return sum + p[0]*q[1] - q[0]*p[1];
        }, 0)) / 2;
      }
      function below(points, y) {
        var cut = [];
        points.forEach(function (p, i) {
          var q = points[(i + 1) % points.length], pIn = p[1] >= y, qIn = q[1] >= y;
          if (pIn) cut.push(p);
          if (pIn !== qIn) cut.push([p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]), y]);
        });
        return cut;
      }
      function sand(points, share) {
        var lo = Math.min.apply(null, points.map(function (p) { return p[1]; }));
        var hi = Math.max.apply(null, points.map(function (p) { return p[1]; }));
        if (share <= 0) return { points: [], y: hi };
        if (share >= 1) return { points: points, y: lo };
        var target = area(points) * share;
        for (var i = 0; i < 32; i++) {
          var mid = (lo + hi) / 2;
          if (area(below(points, mid)) > target) lo = mid; else hi = mid;
        }
        var y = (lo + hi) / 2;
        return { points: below(points, y), y: y };
      }
      var upperSand = sand(upper, 1 - fraction), lowerSand = sand(lower, fraction);
      var meter = h('div', { class: 'crisis-hourglass', role: 'meter', 'aria-label': title + '压力',
        'aria-valuemin': '0', 'aria-valuemax': String(W.CRISIS_MAX), 'aria-valuenow': String(value),
        'aria-valuetext': value.toFixed(1) + ' / ' + W.CRISIS_MAX + '；下层积沙表示当前压力' });
      var drawing = Core.svg('svg', { viewBox: '0 0 180 286', 'aria-hidden': 'true', focusable: 'false' });
      function add(tag, attrs) { drawing.appendChild(Core.svg(tag, attrs)); }
      var glass = 'M46 44H134C144 76 134 100 110 117C98 126 94 130 94 138' +
        'Q91 144 94 150C94 158 98 162 110 171C134 188 144 212 134 244H46' +
        'C36 212 46 188 70 171C82 162 86 158 86 150Q89 144 86 138' +
        'C86 130 82 126 70 117C46 100 36 76 46 44Z';
      add('path', { d: glass, class: 'crisis-hourglass__glass' });
      [['upper', upperSand], ['lower', lowerSand]].forEach(function (entry) {
        add('polygon', { class: 'crisis-hourglass__sand crisis-hourglass__sand--' + entry[0], fill: color,
          points: entry[1].points.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') });
      });
      if (fraction > 0 && fraction < 1) add('line', { class: 'crisis-hourglass__stream', stroke: color,
        x1: 90, y1: 138, x2: 90, y2: lowerSand.y, 'stroke-width': 1.6, 'stroke-dasharray': '2 4' });
      add('path', { d: glass, class: 'crisis-hourglass__outline' });
      add('path', { d: 'M52 54C47 78 56 95 72 109M52 230C47 205 56 190 72 179', class: 'crisis-hourglass__reflection' });
      // Turned, curved supports and stepped oval brass caps; all flat colours.
      ['M27 39C21 60 36 86 30 116C25 148 25 199 30 249H37' +
        'C32 199 32 150 37 117C43 86 29 62 35 39Z',
       'M153 39C159 60 144 86 150 116C155 148 155 199 150 249H143' +
        'C148 199 148 150 143 117C137 86 151 62 145 39Z'].forEach(function (d) {
        add('path', { d: d, class: 'crisis-hourglass__rail' });
      });
      [[90,32,70,7],[90,39,60,4],[90,249,60,4],[90,256,70,7],[90,264,76,5]].forEach(function (plate) {
        add('ellipse', { cx: plate[0], cy: plate[1], rx: plate[2], ry: plate[3], class: 'crisis-hourglass__frame' });
      });
      [31, 149].forEach(function (x) { [46, 117, 177, 241].forEach(function (y) {
        add('ellipse', { cx: x, cy: y, rx: 5, ry: 2.4, class: 'crisis-hourglass__stud' });
      }); });
      add('path', { d: 'M78 21Q84 14 90 20Q96 14 102 21M90 12V23', class: 'crisis-hourglass__ornament' });
      drawing.appendChild(Core.svgText(90, 10, 'TEMPVS', { class: 'crisis-hourglass__inscription', 'text-anchor': 'middle' }));
      drawing.appendChild(Core.svgText(90, 283, 'FIVME · MCMXIX', { class: 'crisis-hourglass__caption', 'text-anchor': 'middle' }));
      meter.appendChild(drawing);
      return meter;
    }

    /* The two crises share a scale and a shape, with separate sand colours,
       numerical pressure readings, and their own historical milestones. */
    function crisisGauge(parent, title, motto, value, color, defs, passed) {
      parent.style.setProperty('--crisis-ink', color);
      parent.classList.toggle('is-critical', value >= 100);
      parent.appendChild(h('div', { class: 'crisis-axis__heading' }, [
        h('small', {}, motto),
        h('div', { class: 'crisis-axis__title-row' }, [h('strong', {}, title),
          h('div', { class: 'crisis-axis__value' }, [h('strong', { class: 'num' }, value.toFixed(1)),
            h('span', {}, '/ ' + W.CRISIS_MAX)])])
      ]));
      var milestones = h('div', { class: 'crisis-axis__milestones' });
      defs.forEach(function (m) {
        var has = passed.indexOf(m.id) >= 0;
        var ev = m.event ? Eng.EVENT_BY_ID[m.event] : null;
        milestones.appendChild(h('div', { class: 'crisis-axis__milestone' + (has ? ' is-passed' : ''), 'data-milestone': m.id,
          title: ev ? Core.L(ev.title) : '' }, [
          h('span', { class: 'crisis-axis__threshold' }, String(m.at)),
          h('div', { class: 'crisis-axis__milestone-copy' }, [
            h('span', { class: 'crisis-axis__milestone-name' }, Core.L(m)),
            h('span', { class: 'crisis-axis__milestone-status' }, T(has ? 'cri.milestone.hit' : 'cri.milestone.miss')),
            ev ? h('span', { class: 'crisis-axis__milestone-event' }, T('cri.milestone.event')) : null
          ])
        ]));
      });
      parent.appendChild(h('div', { class: 'crisis-axis__instrument' }, [
        crisisHourglass(value, color, title), milestones
      ]));
    }

    function tabCrisi(st) {
      var cr = Sel.crisis(st);
      var col = h('div', { class: 'col' });
      var b = h('div', { style: { padding: '9px 11px' } });
      [[T('cri.authority'), cr.authority, '#3C7FA8'], [T('cri.garrison'), cr.garrison, '#6B4E9E'],
       [T('cri.fervour'), cr.fervour, '#A31621'], [T('cri.squadre'), cr.squadre, '#2B2B33'],
       [T('cri.violence'), cr.violence, '#8A2A2A']].forEach(function (r) {
        b.appendChild(Charts.barRow(r[0], null, r[1], 100, r[2]));
      });
      /* The two crisis formulas have moved to Settings → 图书馆. What stays here
         is the pair of gauges and the forces that feed them. */

      var crisisPair = h('div', { class: 'crisis-pair' });
      var siegePanel = h('div', { class: 'crisis-axis' });
      var plotPanel = h('div', { class: 'crisis-axis' });
      crisisGauge(siegePanel, T('cri.siege.title'), 'ROMA · ASSEDIO', cr.coup, '#D2AC5E',
        cr.milestoneDefs, cr.milestones);
      crisisGauge(plotPanel, T('cri.plot.title'), 'FIUME · INSIDIAE', cr.subversion, '#BD6961',
        cr.subversionDefs, cr.subversionMilestones);
      crisisPair.appendChild(siegePanel);
      crisisPair.appendChild(plotPanel);
      b.appendChild(crisisPair);
      col.appendChild(frame('', [banner(T('cri.title'), T('cri.sub')), b]));

      var ob = h('div', { style: { padding: '9px 11px' } });
      [[T('cri.forze.milizia'), cr.milizia, '#C9A227', 6000],
       [T('cri.forze.police'), cr.police, '#3C7FA8', 400], [T('cri.forze.carabinieri'), cr.carabinieri, '#8A7A5A', 400],
       [T('cri.forze.squadre'), Math.round(cr.squadre * 14), '#2B2B33', 1600]
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
      grid.appendChild(h('div', { class: 'cmatrix__h cmatrix__h--l' }, T('ele.classWeight')));
      [T('ele.turnout')].forEach(function (t) {
        grid.appendChild(h('div', { class: 'cmatrix__h', title: t }, t));
      });
      mx.cols.forEach(function (col) {
        grid.appendChild(h('div', {
          class: 'cmatrix__h cmatrix__h--p' + (col.player ? ' is-player' : ''),
          style: { color: col.color }, title: Core.L(col)
        }, [
          h('span', { class: 'cmatrix__dot', style: { background: col.color } }),
          h('span', {}, col.short)
        ]));
      });

      /* Class rows */
      mx.rows.forEach(function (r) {
        grid.appendChild(h('div', { class: 'cmatrix__l', title: r.note || '' }, [
          h('span', { class: 'cmatrix__n' }, Core.L(r)),
          h('span', { class: 'cmatrix__w' }, String(r.pop))
        ]));
        grid.appendChild(h('div', { class: 'cmatrix__t', title: T('ele.turnoutTip', { n: r.turnout }) }, [
          bar(r.turnout, 100, 'linear-gradient(90deg,#6B4E9E,#A98BD6)'),
          h('span', { class: 'cmatrix__tv' }, r.turnout.toFixed(0))
        ]));
        r.cells.forEach(function (cell) {
          var a = cell.share;
          grid.appendChild(h('div', {
            class: 'cmatrix__c' + (cell.v >= 20 ? ' is-strong' : ''),
            style: { background: 'rgba(' + hexRgb(cell.color) + ',' + (0.07 + a * 0.85).toFixed(3) + ')' },
            title: Core.L(r) + ' → ' + cell.id + ' ' + cell.v.toFixed(1) + '%'
          }, cell.v >= 1 ? cell.v.toFixed(0) : '·'));
        });
      });

      /* National support */
      grid.appendChild(h('div', { class: 'cmatrix__l cmatrix__l--sum' }, T('eco.consenso')));
      grid.appendChild(h('div', { class: 'cmatrix__t cmatrix__t--sum', title: T('ele.turnoutTotal') },
        [h('span', { class: 'cmatrix__tv' }, mx.turnout.toFixed(0) + '%')]));
      mx.totals.forEach(function (t) {
        grid.appendChild(h('div', {
          class: 'cmatrix__c cmatrix__c--sum', style: { color: t.color },
          title: Core.L(W.PARTY_BY_ID[t.id])
        }, t.v.toFixed(1)));
      });

      /* List totals */
      var listRow = h('div', { class: 'cmatrix__lists' });
      mx.lists.forEach(function (L) {
        listRow.appendChild(h('div', { class: 'cmatrix__list' }, [
          h('span', { class: 'swatch', style: { background: L.color } }),
          h('span', { class: 'cmatrix__listn' }, Core.L(L)),
          h('b', { class: 'cmatrix__listv' }, L.v.toFixed(1) + '%')
        ]));
      });

      var body = h('div', { style: { padding: '8px 10px 4px' } }, [grid, listRow]);
      /* The election arithmetic itself lives in Settings → 图书馆; here it is
         named and pointed at, rather than repeated as a second implementation. */
      body.appendChild(h('div', { class: 'tiny dim2', style: { padding: '7px 2px 5px', lineHeight: 1.6 } }, [
        h('b', {}, T('ele.note.lead')), ' ', T('ele.note.pointer')
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
        col.appendChild(frame('', [banner(T('ev.pending'), T('ev.pending.sub')),
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
      col.appendChild(frame('', [banner(T('eco.pop')),
        h('div', { class: 'archive-intro' }, T('cls.intro'))]));
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
      return frame('', [banner(T('set.timeline')), timeline]);
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
      { id: 'arengo', zh: '政治', it: 'Politica' },
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
          h('div', { class: 'navbtn__l' }, Core.L(n))
        ]));
      });
      return row;
    }

    function ticker(st) {
      var logs = st.log.slice(-9).reverse();
      var rail = h('div', { class: 'ticker__rail' });
      if (!logs.length) logs = [{ turn: st.turn, zh: T('tick.fallback') }];
      logs.forEach(function (l) {
        rail.appendChild(h('div', { class: 'ticker__i' }, [
          h('span', { class: 'ticker__d' }, 'W' + l.turn),
          h('span', {}, Core.L(l))
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
      else if (ui.tab === 'arengo') center.appendChild(tabArengo(st));
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
        var label = open ? Core.L(party)
          : Core.L(party) + (party.lockedNote ? ' · ' + Core.L(party.lockedNote) : '');
        forceChoices.appendChild(h('button', {
          class: 'start-force__pick' + (ui.force === party.id ? ' is-on' : '')
            + (open ? '' : ' is-locked'),
          type: 'button',
          disabled: !open,
          title: open ? null : (Core.L(party.lockedNote) || T('ui.notready')),
          'aria-pressed': ui.force === party.id ? 'true' : 'false',
          onclick: function () { act.setForce(party.id); }
        }, [
          h('span', { class: 'start-force__art', 'aria-hidden': 'true' },
            h('span', { class: 'start-force__emblem-slot' },
              h('img', { class: 'start-force__emblem', src: party.emblem, alt: '' }))),
          h('span', { class: 'start-force__name' }, label),
          h('span', { class: 'start-force__short' }, party.short)
        ]));
      });
      force.appendChild(frame('', [
        banner(T('start.force')),
        forceChoices
      ]));
      setup.appendChild(force);

      var selectedParty = W.PARTY_BY_ID[ui.force] || W.PARTY_BY_ID.LEG;
      var leader = selectedParty.leader;
      var leaderPortrait = h('div', { class: 'start-leader__portrait' }, [
        h('div', { class: 'leader-portrait__window' },
          leader.portrait ? h('img', { src: leader.portrait, alt: Core.L(leader) }) :
            h('img', { class: 'start-leader__emblem', src: selectedParty.emblem, alt: T('start.emblem.alt', { a: Core.L(selectedParty) }) })),
        h('div', { class: 'start-leader__frame', 'aria-hidden': 'true' }),
        !leader.portrait ? h('div', { class: 'start-leader__photo-note' }, T('start.portraitPending')) : null,
        h('div', { class: 'start-leader__plaque' }, Core.L(leader))
      ]);
      var leaderPanel = h('div', { class: 'start-leader' });
      leaderPanel.appendChild(frame('', [
        h('div', { class: 'start-leader__body' }, [
          leaderPortrait,
          h('div', { class: 'start-leader__details' }, [
            h('div', { class: 'start-leader__party' }, Core.L(selectedParty)),
            h('div', { class: 'start-leader__party-it' }, selectedParty.it),
            h('p', { class: 'start-leader__blurb' }, selectedParty.blurb)
          ])
        ])
      ]));
      setup.appendChild(leaderPanel);

      var difficulty = h('div', { class: 'start-difficulty' });
      var db = h('div', { class: 'start-difficulty__choices' });
      W.DIFFICULTIES.forEach(function (d) {
        // Only the name is shown. The description is a hover tooltip so the
        // panel stays compact; see .start-difficulty .pick[data-tip] in the CSS.
        db.appendChild(h('button', {
          class: 'pick' + (d.id === ui.difficulty ? ' is-on' : ''),
          type: 'button',
          'aria-pressed': d.id === ui.difficulty ? 'true' : 'false',
          'data-tip': ui.force !== 'LEG' && d.id === 'open' ? T('start.normal.party') : Core.L({ zh: d.note, it: d.noteIt }),
          onclick: function () { act.setDifficulty(d.id); }
        }, [
          h('div', { class: 'pick__n' }, Core.L(d))
        ]));
      });
      difficulty.appendChild(frame('', [banner(T('start.difficulty'), T('start.difficulty.sub')), db]));
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
        h('h1', { class: 'ending__t' }, Core.L(vm)),
        h('div', { class: 'ending__it' }, vm.it),
        h('div', { class: 'tricolore', style: { width: '130px', marginTop: '12px' } }),
        h('div', { class: 'ending__b' }, Core.L(vm.body))
      ]);
      inner.appendChild(head);

      var g = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '8px', padding: '11px' } });
      [[T('eco.traffic').split(' ·')[0], vm.stats.traffic.toFixed(1)], [T('eco.pop'), Core.fmt(vm.stats.population)],
       [T('cri.coup'), Math.round(vm.stats.coup)], [T('cmd.legittimita'), Math.round(vm.stats.legitimacy)],
       [T('end.seats', { a: Core.L(W.PARTY_BY_ID[st.playerForce] || W.PARTY_BY_ID.LEG) }), vm.stats.seats], [T('end.journals'), Sel.journals(st).filter(function (j) { return j.done; }).length + ' / ' + Meta.JOURNALS.length]
      ].forEach(function (x) {
        g.appendChild(h('div', { class: 'pick', style: { marginBottom: '0' } }, [
          h('div', { class: 'pick__n', style: { fontSize: '21px' } }, String(x[1])),
          h('div', { class: 'pick__d' }, x[0])
        ]));
      });
      inner.appendChild(frame('', [banner(T('end.stats')), g]));

      if (vm.achievements.length) {
        var ag = h('div', { class: 'achgrid', style: { padding: '11px' } });
        vm.achievements.forEach(function (a) {
          ag.appendChild(h('div', { class: 'ach' }, [
            h('div', { class: 'ach__n' }, '★ ' + Core.L(a)),
            h('div', { class: 'ach__d' }, Core.L(a.desc))
          ]));
        });
        inner.appendChild(frame('', [banner(T('end.ach'), T('end.ach.got')), ag]));
      } else {
        inner.appendChild(frame('', [banner(T('end.ach'), T('end.ach.none')), h('div', { class: 'empty' }, T('end.noach'))]));
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
            Core.L(d) + ' · ' + T('deck.available', { n: d.available })),
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
      return V.modal(Core.L(d), d, [bd], [
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
                var lbl = typeof pv === 'string' ? pv : Core.L(pv);
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
        role: 'dialog', 'aria-modal': 'true', 'aria-label': title || sub || T('ui.dialog') });
      modal.appendChild(h('div', { class: 'modal__hd' }, [
        opts.kicker ? h('div', { class: 'modal__kicker' }, opts.kicker) : null,
        h('div', { class: 'modal__ttl' }, title)
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

    /* An event's counted result: heading, prose, then the chamber it seats (if
       the count seats one) and the tally in rows. The hemicycle comes from
       src/ui/parliament.ts, which the legacy IIFE reaches through
       `Fiume.Parliament` — the same route the Arengo uses. A missing renderer
       is not an error: the rows still say everything a column of figures can. */
    function resultBlock(res) {
      if (!res) return null;
      var rz = h('div', { class: 'evres' });
      if (res.title) rz.appendChild(h('div', { class: 'evres__t' }, Core.L(res.title)));
      if (res.body) rz.appendChild(h('div', { class: 'evres__b' }, Core.L(res.body)));
      if (res.seats && res.seats.length) {
        var api = (typeof globalThis !== 'undefined' ? globalThis : window).Fiume;
        if (api && api.Parliament && typeof api.Parliament.render === 'function') {
          rz.appendChild(api.Parliament.render({
            seats: res.seats.map(function (b) {
              return { id: b.id, name: Core.L(b.name), seats: b.seats, color: b.color };
            }),
            caption: res.seatsCaption ? Core.L(res.seatsCaption) : ''
          }));
        }
      }
      if (res.rows && res.rows.length) {
        var tb = h('div', { class: 'evres__rows' });
        res.rows.forEach(function (r) {
          tb.appendChild(h('div', { class: 'evres__r' + (r.tone ? ' is-' + r.tone : '') }, [
            h('span', { class: 'evres__k' }, Core.L(r.label)),
            h('span', { class: 'evres__v' }, r.value)
          ]));
        });
        rz.appendChild(tb);
      }
      if (res.note) rz.appendChild(h('div', { class: 'evres__n' }, Core.L(res.note)));
      return rz;
    }

    V.eventModal = function (st, act) {
      var vm = Sel.eventView(st);
      if (!vm) return null;
      var bd = h('div', { class: 'event-sheet' });
      var narrative = h('div', { class: 'event-sheet__narrative' });
      var body = h('div', { class: 'modal__body' });
      body.innerHTML = Core.L(vm.body).replace(/\*\*(.+?)\*\*/g, '<em>$1</em>');
      narrative.appendChild(body);
      /* A counted result, when the event carries one: a heading, a line, then
         the chamber (when the count seats one) and the tally in rows, so a
         column of figures can be read down. */
      var resultEl = resultBlock(vm.result);
      if (resultEl) narrative.appendChild(resultEl);
      bd.appendChild(narrative);
      var choices = h('div', { class: 'event-sheet__choices' });
      choices.appendChild(h('div', { class: 'event-sheet__choicehead' }, [
        h('span', { class: 'event-sheet__choice-title' }, T('evboard.choice')),
        h('span', { class: 'event-sheet__choice-count' },
          Core.fmt(vm.options.length) + ' ' + T('evboard.choice.count'))
      ]));
      vm.options.forEach(function (o, index) {
        choices.appendChild(h('button', {
          class: 'opt', disabled: !o.enabled,
          onclick: function () { act.resolveEvent(o.id); }
        }, [
          h('div', { class: 'opt__h' }, [
            h('span', { class: 'event-sheet__number', 'aria-hidden': 'true' }, Core.roman(index + 1)),
            h('span', { class: 'opt__n' }, Core.L(o.text)),
            optionLine(o) ? h('span', { class: 'opt__i' }, optionLine(o)) : null
          ]),
          o.preview && o.preview.length ? h('div', { class: 'opt__p' }, o.preview.map(function (p) {
            var lbl = typeof p === 'string' ? p : Core.L(p);
            return h('span', { class: 'opt__pv' + (/−/.test(lbl) ? ' dn' : (/\+/.test(lbl) ? ' up' : '')) }, lbl);
          })) : null,
          (!o.enabled && o.reason) ? h('div', { class: 'opt__lock' }, '✕ ' + Core.L(o.reason)) : null
        ]));
      });
      bd.appendChild(choices);
      return V.modal(Core.L(vm.title), vm.title, [bd], [
        h('div', { class: 'tiny', style: { color: 'rgba(42,30,16,.55)', marginRight: 'auto' } },
          vm.superEvent ? T('ev.supreme') : T('ev.nofree'))
      ], { cls: 'modal--event' + (vm.superEvent ? ' modal--wide' : ''), kicker: T(vm.superEvent ? 'ui.kicker.major' : 'ui.kicker.chronicle') });
    };

    return V;
  });
