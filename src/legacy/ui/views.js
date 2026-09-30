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
      ['ev_coup', V.IMG.hostventuri], ['ev_fascio_split', V.IMG.hostventuri],
      ['ev_1922_10_roma', V.IMG.popolo], ['ev_1924_01_rome', V.IMG.giolitti]
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
        h('div', { class: 'resbar__d1' }, st.date.y + ' · ' + Core.monthNameIt(st.date.m).toUpperCase() + ' ' + st.date.d),
        h('div', { class: 'resbar__d2' }, 'ANNO ' + Core.roman(era) + ' DELL\'IMPRESA')
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
          h('div', { class: 'resslot__k' }, '本周行动点'),
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

    function diariPanel(st) {
      var jr = Sel.journals(st);
      var body = h('div', { style: { padding: '8px 11px' } });
      if (!jr.length) body.appendChild(h('div', { class: 'empty' }, T('dia.empty')));
      jr.forEach(function (j) {
        body.appendChild(h('div', { class: 'jrn' + (j.done ? ' jrn--done' : j.failed ? ' jrn--fail' : '') }, [
          h('div', { class: 'row row--between' }, [
            h('span', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px' } }, j.zh),
            h('span', { class: 'chip' + (j.done ? ' chip--ok' : j.failed ? ' chip--bad' : '') },
              j.done ? T('dia.done') : j.failed ? T('dia.failed') : T('dia.months', { n: j.months }))
          ]),
          h('div', { class: 'tiny dim', style: { marginTop: '2px' } }, Core.L(j.desc))
        ]));
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
    function tabEconomia(st) {
      var ec = Sel.economy(st);
      var col = h('div', { class: 'col' });
      var b = h('div', { style: { padding: '9px 11px' } });
      b.appendChild(h('div', { class: 'row row--between' }, [
        h('span', { class: 'tiny', style: { letterSpacing: '.12em' } }, T('eco.traffic')),
        h('span', { class: 'num', style: { fontSize: '14px', color: 'var(--gold-lit)' } }, ec.traffic.toFixed(1))
      ]));
      b.appendChild(bar(ec.traffic, 100, 'linear-gradient(90deg,#7C0023,#C9A227,#7BA05B)', 'bar--tall'));
      if (st.series.traffic.length > 1) b.appendChild(Charts.sparkline(st.series.traffic,
        { color: '#EBD07A', fillColor: 'rgba(201,162,39,.14)', guide: 75, height: 44 }));
      b.appendChild(h('div', { class: 'divider' }, icon('star', 11)));
      [[T('eco.hinterland'), ec.hinterland, '#6E8B3D'], [T('eco.delta'), ec.delta, '#3E8E7E'],
       [T('eco.works'), ec.works, '#D8AC63'], [T('eco.recognition'), ec.recognition, '#3C7FA8'],
       [T('eco.strike'), ec.strike, '#A31621'], [T('eco.confidence'), ec.capitalConfidence, '#C9A227']].forEach(function (r) {
        b.appendChild(Charts.barRow(r[0], null, r[1], 100, r[2]));
      });
      b.appendChild(h('div', { class: 'divider' }, icon('coins', 11)));
      b.appendChild(field(T('eco.revenue'), Core.fmt(ec.revenue.total) + ' K£', true));
      b.appendChild(field('　' + T('eco.tax.porto') + ' / ' + T('eco.tax.dogana'), Core.fmt(ec.revenue.porto) + ' / ' + Core.fmt(ec.revenue.dogana)));
      b.appendChild(field('　' + T('eco.tax.consumo') + ' / ' + T('eco.tax.reddito'), Core.fmt(ec.revenue.consumo) + ' / ' + Core.fmt(ec.revenue.reddito)));
      b.appendChild(field(T('eco.spending'), Core.fmt(ec.spending.total) + ' K£'));
      b.appendChild(field('　' + T('eco.legion'), Core.fmt(ec.spending.legion || 0) + ' K£'));
      b.appendChild(field(T('eco.net'), Core.signed(ec.net, 1) + ' K£', true));
      b.appendChild(field(T('eco.debt'), Core.fmt(ec.debt) + ' / ' + Core.fmt(ec.arrears) + ' K£'));
      b.appendChild(field(T('eco.pop'), Core.fmt(ec.population)));
      b.appendChild(field(T('eco.unemp'), ec.unemployment.toFixed(1) + '% / ' + ec.inflation.toFixed(1) + '%'));
      col.appendChild(frame('', [banner(T('eco.title'), T('eco.sub')), b]));

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

      /* Three deck tiles. Clicking one opens its drawable-card picker. */
      var tiles = h('div', { class: 'decks' });
      decks.forEach(function (d) {
        tiles.appendChild(h('button', {
          class: 'deck' + (d.drawable ? '' : ' is-off'),
          disabled: !d.drawable,
          style: { borderColor: d.drawable ? d.color : 'rgba(201,162,39,.18)' },
          onclick: function () { act.openDeck(d.id); }
        }, [
          h('div', { class: 'deck__ic' }, icon(d.icon, 22)),
          h('div', { class: 'deck__b' }, [
            h('div', { class: 'deck__n', style: { color: d.drawable ? 'var(--gold-pale)' : 'rgba(233,220,188,.4)' } }, d.zh),
            h('div', { class: 'deck__s' }, d.drawable ? T('deck.draw') + ' · ' + d.available : (d.available ? T('deck.full') : T('deck.none')))
          ])
        ]));
      });

      /* Reserved slots: empty ones are placeholders, filled ones hold a card. */
      var slotRow = h('div', { class: 'slots' });
      slots.forEach(function (sl) {
        if (sl.empty) return;
        var card = sl.card;
        var c = h('div', { class: 'slot slot--full card--' + card.deck });
        c.appendChild(h('div', { class: 'slot__deck' }, T('az.deck.' + card.deck).toUpperCase()));
        c.appendChild(h('div', { class: 'slot__n' }, Core.L(card.name)));
        if (card.subtitle) c.appendChild(h('div', { class: 'slot__sub' }, Core.L(card.subtitle)));
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
      if (!slotRow.childNodes.length) slotRow.appendChild(h('div', { class: 'empty' },
        '手牌为空。选择上方牌堆抽取本周可用的行动。'));

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
      if (!alerts.length) alerts.push(['ok', '本周没有紧急警报。']);

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
       back to the Italian of the option text when no subtitle is written. */
    function optionLine(o) {
      if (o.subtitle) return Core.L(o.subtitle);
      return Core.sub(o.text);
    }

    /* ============================================================
       Party relations
       A matrix of how each party regards each other. Warm cells are parties
       that can be worked with; cold ones are the ones that will not.
       ============================================================ */
    function relationsPanel(st) {
      var rel = Sel.relations(st);
      var CAMP = { annessione: '兼并', autonomia: '自治', cattolico: '天主教', classe: '阶级' };
      var grid = h('div', {
        class: 'relmat',
        style: { gridTemplateColumns: '104px repeat(' + rel.cols.length + ', minmax(52px, 1fr))' }
      });

      grid.appendChild(h('div', { class: 'relmat__h relmat__h--l' }, '党际关系'));
      rel.cols.forEach(function (b) {
        grid.appendChild(h('div', {
          class: 'relmat__h', style: { color: b.color }, title: b.zh + ' · ' + (CAMP[b.camp] || '')
        }, b.short));
      });
      rel.rows.forEach(function (row) {
        grid.appendChild(h('div', {
          class: 'relmat__l' + (row.player ? ' is-player' : ''), title: row.zh
        }, [
          h('span', { class: 'relmat__dot', style: { background: row.color } }),
          h('span', {}, row.short)
        ]));
        row.cells.forEach(function (cell) {
          grid.appendChild(h('div', {
            class: 'relmat__c is-' + cell.tone,
            title: row.zh + ' → ' + W.PARTY_BY_ID[cell.id].zh + '  ' + cell.v.toFixed(1)
          }, (cell.v > 0 ? '+' : '') + cell.v.toFixed(0)));
        });
      });

      var legend = h('div', { class: 'tiny dim2', style: { marginTop: '8px' } },
        '暖色 = 可以合作；冷色 = 不会。数值由「是否同属一个选举阵营」与「在法条上是否同向投票」推导，' +
        '每月向基准回摆；同处内阁会把它推高。当前内阁平均互信 ' + rel.regard.toFixed(1) + '。');

      return frame('', [banner('党际关系', 'RAPPORTI FRA PARTITI'), grid, legend]);
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
      var col = h('div', { class: 'col' });
      var b = h('div', { style: { padding: '9px 11px' } });
      d.list.forEach(function (a) {
        var row = h('div', { class: 'dip row', style: { gap: '9px', padding: '4px 0' } });
        row.appendChild(h('div', { style: { width: '84px', fontSize: '12.5px' } }, a.zh));
        var track = h('div', { class: 'bar flex1' });
        track.appendChild(h('div', { class: 'bar__fill', style: { width: a.value + '%', background: a.color } }));
        row.appendChild(track);
        row.appendChild(h('div', { class: 'num', style: { width: '34px', textAlign: 'right', fontSize: '12px' } }, String(Math.round(a.value))));
        b.appendChild(row);
      });
      col.appendChild(frame('', [banner(T('dip.title'), T('dip.sub')), b]));

      var pb = h('div', { style: { padding: '9px 11px' } });
      var grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '7px' } });
      W.POSTURES.forEach(function (po) {
        grid.appendChild(h('button', {
          class: 'pick posture-pick' + (st.posture === po.id ? ' is-on' : ''),
          type: 'button', style: { marginBottom: '0' },
          onclick: function () { act.setPosture(po.id); }
        }, [
          h('div', { class: 'pick__n' }, po.zh),
          h('div', { class: 'pick__d' }, po.desc),
          h('div', { class: 'tiny dim2', style: { fontStyle: 'italic', marginTop: '2px' } }, po.it)
        ]));
      });
      pb.appendChild(grid);
      col.appendChild(frame('', [banner(T('dip.posture'), T('dip.posture.sub')), pb]));

      return col;
    }

    function tabLeggi(st) {
      var laws = Sel.laws(st);
      var b = h('div', { class: 'laws-list' });
      b.appendChild(h('div', { class: 'small dim', style: { marginBottom: '12px' } },
        '法律通过政府卡和事件改变。展开条目可查看现行内容与各党立场。'));
      laws.forEach(function (L) {
        var row = h('details', { class: 'law-entry' });
        row.appendChild(h('summary', { class: 'law-entry__summary' }, [
          h('span', { class: 'law-entry__title' }, [h('strong', {}, L.zh), h('em', {}, L.it)]),
          h('span', { class: 'chip' + (L.level >= L.max ? ' chip--gold' : '') }, T('leg.level', { a: L.level, b: L.max }))
        ]));
        var content = h('div', { class: 'law-entry__content' });
        content.appendChild(bar(L.level, L.max, 'var(--gold)'));
        content.appendChild(h('div', { class: 'small' }, L.label));
        var stances = h('div', { class: 'row', style: { gap: '6px', flexWrap: 'wrap', marginTop: '5px' } });
        L.stances.forEach(function (s) {
          stances.appendChild(h('span', {
            class: 'chip', title: s.label.zh,
            html: '<span class="swatch" style="background:' + s.color + '"></span> ' + s.zh + ' ' + Core.signed(s.value)
          }));
        });
        content.appendChild(stances);
        row.appendChild(content);
        b.appendChild(row);
      });
      b.appendChild(h('div', { class: 'tiny dim2 mt10' },
        T('leg.note')));
      return h('div', { class: 'col' }, [frame('', [banner(T('leg.title'), T('leg.sub')), b])]);
    }

    function tabCrisi(st) {
      var cr = Sel.crisis(st);
      var col = h('div', { class: 'col' });
      var b = h('div', { style: { padding: '9px 11px' } });
      [['摄政权威', cr.authority, '#3C7FA8'], ['意大利军队立场', cr.garrison, '#6B4E9E'],
       ['民众热忱', cr.fervour, '#A31621'], ['法西斯暴力', cr.squadre, '#2B2B33'],
       ['政治暴力', cr.violence, '#8A2A2A'], ['事态累积', cr.coup, '#C9A227']].forEach(function (r) {
        b.appendChild(Charts.barRow(r[0], null, r[1], 100, r[2]));
      });
      b.appendChild(h('details', { class: 'formula-details' }, [
        h('summary', {}, '查看事态计算方式'),
        h('div', { class: 'mono small' }, 'T = clamp[0,100]( 0.30×(100−权威) + 0.25×(100−驻军) + 0.20×热忱 + 0.25×法西斯暴力 )'),
        h('div', { class: 'mono small' }, 'Δ事态 = clamp[−14,45]( 0.18×T + 0.12×(100−驻军) − 0.05×权威 + 4 − 修正 )')
      ]));
      b.appendChild(h('div', { class: 'divider' }, icon('arrow', 11)));
      b.appendChild(h('div', { class: 'small', style: { marginBottom: '5px' } }, '里程碑'));
      cr.milestoneDefs.forEach(function (m) {
        var has = cr.milestones.indexOf(m.id) >= 0;
        b.appendChild(h('div', { class: 'kv' }, [
          h('span', { class: 'kv__k' + (has ? '' : ' dim2') }, (has ? '◆ ' : '◇ ') + m.at + ' — ' + m.zh),
          h('span', { class: 'kv__v ' + (has ? '' : 'dim2') }, has ? '已过' : '未至')
        ]));
      });
      b.appendChild(h('div', { class: 'divider' }, icon('star', 11)));
      b.appendChild(h('div', { class: 'small', style: { marginBottom: '4px' } }, '事态累积趋势'));
      if (st.series.coup.length > 1) b.appendChild(Charts.sparkline(st.series.coup,
        { color: '#E8A9A2', fillColor: 'rgba(163,22,33,.2)', guide: 100, min: 0, max: 120, height: 56 }));
      col.appendChild(frame('', [banner(T('cri.title'), T('cri.sub')), b]));

      var ob = h('div', { style: { padding: '9px 11px' } });
      [['阜姆军团', cr.milizia, '#C9A227', 6000], ['公民卫队', cr.civicGuard, '#2E7D45', 1600],
       ['市警', cr.police, '#3C7FA8', 400], ['皇家宪兵（意大利）', cr.carabinieri, '#8A7A5A', 400],
       ['意大利驻军', cr.garrisonTroops, '#6B4E9E', 20000], ['法西斯小队（估计）', Math.round(cr.squadre * 14), '#2B2B33', 1600]
      ].forEach(function (r) { ob.appendChild(Charts.barRow(r[0], null, r[1], r[3], r[2])); });
      ob.appendChild(h('div', { class: 'divider' }, icon('milizia', 11)));
      ob.appendChild(h('div', { class: 'small', style: { marginBottom: '4px' } }, '工业与外交'));
      ob.appendChild(Charts.barRow('工业生产', null, cr.produzione, 100, '#D8AC63'));
      ob.appendChild(Charts.barRow('外交压力', null, cr.pressione, 100, '#A31621'));
      col.appendChild(frame('', [banner(T('cri.forze'), T('cri.forze.sub')), ob]));

      var hb = h('div', { style: { padding: '9px 11px' } });
      hb.appendChild(h('div', { class: 'tiny dim', style: { marginBottom: '4px' } }, '失业率'));
      hb.appendChild(Charts.sparkline(st.series.unemployment, { color: '#E8A9A2', fillColor: 'rgba(163,22,33,.16)', guide: 12, max: 45, height: 46 }));
      hb.appendChild(h('div', { class: 'tiny dim mt10', style: { marginBottom: '4px' } }, '人口'));
      hb.appendChild(Charts.sparkline(st.series.population, { color: '#B9D69B', fillColor: 'rgba(123,160,91,.16)', height: 46 }));
      col.appendChild(frame('', [banner(T('cri.tend'), T('cri.tl')), hb]));
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
      else if (ui.tab === 'leggi') center.appendChild(tabLeggi(st));
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
      W.PARTIES.filter(function (party) { return party.player; }).forEach(function (party) {
        forceChoices.appendChild(h('button', {
          class: 'start-force__pick' + (ui.force === party.id ? ' is-on' : ''),
          type: 'button',
          'aria-pressed': ui.force === party.id ? 'true' : 'false',
          onclick: function () { act.setForce(party.id); }
        }, [
          h('span', { class: 'start-force__emblem-slot' },
            h('img', { class: 'start-force__emblem', src: party.emblem, alt: '' })),
          h('span', { class: 'start-force__name' }, party.zh),
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
       Clicking a deck tile opens this list; picking a card fills a free
       reserved slot. Mirrors the cnt-fai DeckView -> choice menu flow.
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
        var opt = h('button', {
          class: 'opt', disabled: !o.enabled,
          onclick: function () { act.resolveCardOption(o.id); }
        }, [
          h('div', { class: 'opt__h' }, [
            h('span', { class: 'opt__n' }, Core.L(o.text))
          ]),
          (o.preview && o.preview.length)
            ? h('div', { class: 'opt__p' }, o.preview.map(function (pv) {
                var lbl = typeof pv === 'string' ? pv : (pv.zh || pv.label || '');
                return h('span', { class: 'opt__pv' + (/−|-/.test(lbl) ? ' dn' : (/\+/.test(lbl) ? ' up' : '')) }, lbl);
              }))
            : null,
          (!o.enabled && o.reason) ? h('div', { class: 'opt__lock' }, '✕ ' + Core.L(o.reason)) : null
        ]);
        bd.appendChild(opt);
      });

      return V.modal(Core.L(vm.name), deckName + (vm.ministry ? ' · ' + vm.ministry.toUpperCase() : ''), [bd], [
        h('button', { class: 'btn btn--ghost', onclick: act.cancelCard }, T('btn.back')),
        h('div', { class: 'tiny', style: { color: 'rgba(42,30,16,.55)', marginLeft: 'auto', alignSelf: 'center' } },
          T('card.cost.hint'))
      ]);
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
      var bd = h('div', {});
      var body = h('div', { class: 'modal__body' });
      body.innerHTML = vm.body.zh.replace(/\*\*(.+?)\*\*/g, '<em>$1</em>');
      bd.appendChild(body);
      bd.appendChild(h('div', { class: 'divider' }, icon('fasces', 12)));
      vm.options.forEach(function (o) {
        bd.appendChild(h('button', {
          class: 'opt', disabled: !o.enabled,
          onclick: function () { act.resolveEvent(o.id); }
        }, [
          h('div', { class: 'opt__h' }, [h('span', { class: 'opt__n' }, o.text.zh), optionLine(o) ? h('span', { class: 'opt__i' }, optionLine(o)) : null]),
          o.preview && o.preview.length ? h('div', { class: 'opt__p' }, o.preview.map(function (p) {
            var lbl = typeof p === 'string' ? p : (p.zh || p.label || '');
            return h('span', { class: 'opt__pv' + (/−/.test(lbl) ? ' dn' : (/\+/.test(lbl) ? ' up' : '')) }, lbl);
          })) : null,
          (!o.enabled && o.reason) ? h('div', { class: 'opt__lock' }, '✕ ' + Core.L(o.reason)) : null
        ]));
      });
      return V.modal(Core.L(vm.title), vm.title, [bd], [
        h('div', { class: 'tiny', style: { color: 'rgba(42,30,16,.55)', marginRight: 'auto' } },
          vm.superEvent ? T('ev.supreme') : T('ev.nofree'))
      ], { cls: vm.superEvent ? 'modal--wide' : '' });
    };

    return V;
  });
