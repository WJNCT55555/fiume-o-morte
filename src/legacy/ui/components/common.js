/* ==========================================================================
   展示层 · 组件公共件
   与《自由未烬》src/lib/utils.ts + 各组件的共享片段对应。
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core, root.Fiume.World, root.Fiume.I18N, root.Fiume.Orn);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.UI = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this,
  function (Core, W, I18N, Orn) {
    'use strict';
    var UI = {};
    var h = Core.h;
    UI.h = h;

    UI.T = function (key, vars) { return I18N.t(key, vars); };
    UI.L = function (node) { return Core.L(node); };

    UI.icon = function (name, size, cls) { return Orn.icon(name, { size: size || 18, cls: cls }); };

    /* Basic boxes */
    UI.frame = function (cls, children) {
      var el = h('div', { class: 'frame' + (cls ? ' ' + cls : '') });
      (children || []).forEach(function (c) { if (c) el.appendChild(c); });
      return el;
    };

    UI.banner = function (title, sub) {
      return h('div', { class: 'banner' }, [
        h('div', { class: 'banner__t' }, title),
        sub ? h('div', { class: 'banner__s' }, Core.sub(sub)) : null
      ]);
    };

    UI.field = function (k, v, strong) {
      return h('div', { class: 'field' + (strong ? ' field--strong' : '') }, [
        h('span', { class: 'field__k' }, k), h('span', { class: 'field__v' }, v)
      ]);
    };

    UI.bar = function (v, max, color, cls) {
      var b = h('div', { class: 'bar' + (cls ? ' ' + cls : '') });
      b.appendChild(h('div', {
        class: 'bar__fill',
        style: { width: Core.clamp(v / (max || 100) * 100, 0, 100) + '%', background: color }
      }));
      return b;
    };

    UI.deltaChip = function (n, invert) {
      var good = invert ? n < 0 : n > 0;
      var bad = invert ? n > 0 : n < 0;
      var cls = n === 0 ? 'delta-flat' : (good ? 'delta-up' : (bad ? 'delta-dn' : 'delta-flat'));
      var arrow = n > 0 ? '▲' : n < 0 ? '▼' : '·';
      return h('span', { class: 'resslot__d ' + cls }, arrow + Core.fmt(Math.abs(n)));
    };

    UI.avatar = function (img, letter, cls) {
      var el = h('div', { class: cls || 'adv__av' });
      if (img) el.appendChild(h('img', { src: img, alt: '', loading: 'lazy', onerror: 'this.remove()' }));
      else el.textContent = letter || '·';
      return el;
    };

    /* Collapsible sections */
    /* Mirrors AccordionSection in the reference project. Open state lives in UI.secState,
       so it survives re-renders without entering GameState. */
    UI.secState = {};
    UI.section = function (id, title, sub, bodyEls, opts) {
      opts = opts || {};
      var open = UI.secState[id];
      if (open === undefined) open = opts.defaultOpen !== false;
      var sec = h('div', { class: 'sec' + (open ? '' : ' is-closed') });
      var hd = h('button', {
        class: 'sec__hd', type: 'button', title: opts.hint || '',
        'aria-expanded': open ? 'true' : 'false', 'aria-controls': 'sec-' + id,
        onclick: function () {
          UI.secState[id] = sec.classList.contains('is-closed');
          sec.classList.toggle('is-closed');
          hd.setAttribute('aria-expanded', UI.secState[id] ? 'true' : 'false');
        }
      }, [
        opts.icon ? Orn.icon(opts.icon, 13) : null,
        h('span', { class: 'sec__t' }, title),
        sub ? h('span', { class: 'sec__it' }, sub) : null,
        h('span', { class: 'sec__ar' }, '▼')
      ]);
      sec.appendChild(hd);
      var bd = h('div', { class: 'sec__bd', id: 'sec-' + id });
      (bodyEls || []).forEach(function (c) { if (c) bd.appendChild(c); });
      sec.appendChild(bd);
      return sec;
    };

    /* #RRGGBB → "r,g,b" */
    UI.hexRgb = function (hex) {
      var s = String(hex || '#888888').replace('#', '');
      if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
      var n = parseInt(s, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
    };

    UI.IMG = {
      comandante: 'img/Portrait/Portrait_gabriele_d_annunzio.png',
      proclama: 'img/History/reggenza_proc.jpg',
      /* Advisor portraits are data now (see `Advisor.portrait` in
         src/game/advisors/*.ts and the roster in src/game/engine/selectors.js),
         because this catalogue and the local map in views.js had drifted apart
         and handed four advisors another man's face. Only the portraits that
         non-advisor screens ask for by name live here. */
      caviglia: 'img/Portrait/Portrait_enrico_caviglia.png',
      giolitti: 'img/Portrait/Portrait_giovanni_giolitti.png',
      hostventuri: 'img/Portrait/Portrait_giovanni_host_venturi.png',
      bacci: 'img/Portrait/Portrait_icilio_bacci.png',
      pantaleoni: 'img/Portrait/Portrait_maffeo_pantaleoni.png',
      foto_fiume: 'img/History/foto_fiume.jpg',
      scudetto: 'img/History/dannunzio_scudetto.jpg',
      popolo: 'img/History/impresa_fiume.jpg',
      esilio: 'img/History/assemblea_esilio.jpg',
      porto: 'img/History/rijeka_1900.jpg',
      kossuth: 'img/History/fiume_1900_b.jpg',
      labaro: 'img/labaro.svg',
      emblema: 'img/emblema.svg',
      stemma: 'img/coat_fiume.svg',
      leaderFrame: 'img/UI/leader_frame.png',
      diploDetailsHeader: 'img/UI/diplo_details_header.png'
    };
    UI.HOLDER_AVATAR = {
      esteri: UI.IMG.comandante, difesa: UI.IMG.hostventuri,
      interno: UI.IMG.bacci, finanze: UI.IMG.pantaleoni
    };

    return UI;
  });
