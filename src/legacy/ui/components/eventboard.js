/* ==========================================================================
   展示层 · 事件看板
   对应《自由未烬》src/components/EventBoard.tsx + SuperEvent.tsx。
   列出本回合的全部事件：已处理的、当前待决的、以及排队中的，逐一点开处理。
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core, root.Fiume.World, root.Fiume.Engine,
    root.Fiume.Sel, root.Fiume.UI, root.Fiume.Orn);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.UI = root.Fiume.UI || {};
  root.Fiume.UI.EventBoard = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this,
  function (Core, W, Eng, Sel, UI, Orn) {
    'use strict';
    var h = Core.h, T = UI.T, icon = UI.icon;

    var B = {};

    /* This month's events: resolved, current, queued */
    B.list = function (st) {
      var out = [];
      var seen = {};
      var ev = st.currentEvent ? Eng.EVENT_BY_ID[st.currentEvent] : null;
      (st.eventHistory || []).forEach(function (rec) {
        var id = typeof rec === 'string' ? rec : rec.id;
        if (!id || seen[id]) return;
        seen[id] = 1;
        out.push({ id: id, turn: typeof rec === 'string' ? st.turn : (rec.turn || st.turn),
          ev: Eng.EVENT_BY_ID[id], state: 'done' });
      });
      (st.eventQueue || []).forEach(function (id) {
        if (seen[id]) return;
        seen[id] = 1;
        out.push({ id: id, turn: st.turn, ev: Eng.EVENT_BY_ID[id], state: 'queued' });
      });
      if (ev) {
        if (seen[ev.id]) out = out.filter(function (x) { return x.id !== ev.id; });
        out.push({ id: ev.id, turn: st.turn, ev: ev, state: 'current' });
      }
      // Keep only the entries resolved this turn
      out = out.filter(function (x) { return x.state !== 'done' || x.turn === st.turn; });
      out.sort(function (a, b) {
        var rank = { done: 0, current: 1, queued: 2 };
        return rank[a.state] - rank[b.state];
      });
      return out;
    };

    B.count = function (st) {
      return (st.eventQueue || []).length + (st.currentEvent ? 1 : 0);
    };

    /* Entry button shown in the top bar */
    B.trigger = function (st, act) {
      var n = B.count(st);
      return h('button', {
        class: 'evboard-btn', title: T('evboard.open'),
        onclick: function () { act.openEventBoard(); }
      }, [
        icon('star', 12),
        T('evboard.short'),
        h('span', { class: 'evboard-btn__n' }, String(n))
      ]);
    };

    /* The board itself, returned as modal content */
    B.render = function (st, act) {
      var rows = B.list(st);
      var list = h('div', { class: 'evboard__list' });
      if (!rows.length) {
        list.appendChild(h('div', { class: 'evboard__empty' }, T('evboard.empty')));
      }
      rows.forEach(function (r) {
        var title = r.ev ? Core.L(r.ev.title) : r.id;
        var tag = r.state === 'current' ? T('evboard.tag.current')
          : r.state === 'queued' ? T('evboard.tag.queued') : T('evboard.tag.done');
        var tagCol = r.state === 'current' ? 'var(--crimson)'
          : r.state === 'queued' ? 'var(--gold)' : 'rgba(233,220,188,.4)';
        list.appendChild(h('button', {
          class: 'evrow' + (r.state === 'current' ? ' is-current' : r.state === 'done' ? ' is-done' : ''),
          disabled: r.state === 'done',
          onclick: function () { act.selectEvent(r.id); }
        }, [
          h('span', { class: 'evrow__r' }, 'W' + r.turn),
          h('span', { class: 'evrow__t' }, title),
          h('span', { class: 'evrow__tag', style: { color: tagCol } }, tag),
          r.state === 'done' ? null : h('span', { class: 'evrow__go' }, T('evboard.view') + ' →')
        ]));
      });

      var body = h('div', {}, [
        h('div', { class: 'evboard__strip' }),
        h('div', { style: { padding: '0 22px 20px' } }, [
          h('div', { class: 'evboard__t' }, T('evboard.title')),
          h('div', { class: 'evboard__s' }, T('evboard.sub')),
          list
        ])
      ]);
      return body;
    };

    return B;
  });
