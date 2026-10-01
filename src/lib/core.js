/* ==========================================================================
   《阜姆自由邦 1921》 — core utilities
   Classic script (works from file://) + CommonJS export for the Node smoke test.
   ========================================================================== */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Core = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var Core = {};

  /* ---------- math ---------- */
  Core.clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };
  Core.clamp01 = function (v) { return Core.clamp(v, 0, 100); };
  Core.lerp = function (a, b, t) { return a + (b - a) * t; };
  Core.round1 = function (v) { return Math.round(v * 10) / 10; };
  Core.round2 = function (v) { return Math.round(v * 100) / 100; };
  Core.sum = function (obj) {
    var s = 0; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) s += obj[k];
    return s;
  };
  Core.approach = function (cur, target, rate) { return cur + (target - cur) * rate; };

  /* ---------- deterministic RNG (mulberry32) ---------- */
  Core.makeRng = function (seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  Core.rngFrom = function (state) { return Core.makeRng(state.seed + state.turn * 7919 + state.rngTick * 104729); };

  /* ---------- distributions ---------- */
  Core.normalize = function (obj, total) {
    total = total == null ? 100 : total;
    var s = Core.sum(obj) || 1, out = {}, k;
    for (k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k] * total / s;
    return out;
  };

  /** Zero-sum shift inside one distribution: move `amount` into `id`,
   *  taking it proportionally from every other positive entry. */
  Core.shiftZeroSum = function (obj, id, amount) {
    var others = 0, k;
    for (k in obj) if (k !== id && Object.prototype.hasOwnProperty.call(obj, k)) others += Math.max(0, obj[k]);
    if (others <= 0) return obj;
    var want = Core.clamp(amount, -obj[id], others);
    obj[id] = (obj[id] || 0) + want;
    for (k in obj) {
      if (k === id || !Object.prototype.hasOwnProperty.call(obj, k) || obj[k] <= 0) continue;
      obj[k] = Math.max(0, obj[k] - want * (obj[k] / others));
    }
    return Core.normalize(obj, Core.sum(obj));
  };

  /** Re-balance a pie so it sums to 100 while preserving relative shape. */
  Core.rebalance = function (obj) { return Core.normalize(obj, 100); };

  /** Largest-remainder apportionment. */
  Core.largestRemainder = function (weights, seats) {
    var keys = Object.keys(weights), total = 0, i;
    for (i = 0; i < keys.length; i++) total += Math.max(0, weights[keys[i]]);
    if (total <= 0 || seats <= 0) { var z = {}; keys.forEach(function (k) { z[k] = 0; }); return z; }
    var quota = {}, rem = [], assigned = 0;
    for (i = 0; i < keys.length; i++) {
      var q = Math.max(0, weights[keys[i]]) * seats / total;
      quota[keys[i]] = Math.floor(q);
      assigned += quota[keys[i]];
      rem.push({ k: keys[i], r: q - Math.floor(q) });
    }
    rem.sort(function (a, b) { return b.r - a.r || (a.k < b.k ? -1 : 1); });
    var idx = 0;
    while (assigned < seats && idx < rem.length * 4) {
      quota[rem[idx % rem.length].k]++; assigned++; idx++;
    }
    return quota;
  };

  Core.deepClone = function (o) { return JSON.parse(JSON.stringify(o)); };
  Core.merge = function (base, patch) {
    var out = Core.deepClone(base);
    (function walk(t, p) {
      for (var k in p) {
        if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
        var v = p[k];
        if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) walk(t[k], v);
        else t[k] = Core.deepClone(v);
      }
    })(out, patch || {});
    return out;
  };

  /* ---------- date ---------- */
  var MONTHS_IT = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  var MONTHS_ZH = ['', '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'];
  Core.monthName = function (m) { return MONTHS_ZH[m] || ''; };
  Core.monthNameIt = function (m) { return MONTHS_IT[m] || ''; };
  Core.dateKey = function (d) { return d.y + '-' + (d.m < 10 ? '0' : '') + d.m; };
  /* A turn is half a month, so the day it happens to be dated with is an
     implementation detail — the 15th for the first half, whatever the month
     ends on for the second. Naming a single day would be false precision, and
     the day moves from month to month besides. Everything that tells the
     player when it is says the half. */
  Core.halfMonth = function (d) { return (d.d || 1) <= 15 ? 'first' : 'second'; };
  Core.dateLabel = function (d) {
    return d.y + ' 年 ' + d.m + ' 月' + (Core.halfMonth(d) === 'first' ? '上半月' : '下半月');
  };
  /* The simulation advances half a month at a time: the 1st to the 15th, then
     the 16th to the month's end, two turns per calendar month, 2 action points
     each. A turn is dated by the LAST day of its half, which is what makes
     dated events fire: an event in month M fires on the first turn whose day is
     at or past its own, so with the two turns of a month on the 15th and the
     last day, every day from 1 to 31 stays reachable. Stepping a flat fifteen
     days instead — what this used to do — walked the boundary backwards about
     five days a year and left the halves drifting across the month. */
  Core.daysInMonth = function (y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  Core.nextHalfMonth = function (d) {
    if ((d.d || 1) <= 15) return { y: d.y, m: d.m, d: Core.daysInMonth(d.y, d.m) };
    var m = d.m + 1, y = d.y;
    if (m > 12) { m = 1; y++; }
    return { y: y, m: m, d: 15 };
  };

  Core.nextWeek = function (d) {
    var day = new Date(Date.UTC(d.y, d.m - 1, d.d || 12));
    day.setUTCDate(day.getUTCDate() + 7);
    return { y: day.getUTCFullYear(), m: day.getUTCMonth() + 1, d: day.getUTCDate() };
  };
  Core.nextMonth = function (d) {
    var m = d.m + 1, y = d.y;
    if (m > 12) { m = 1; y++; }
    return { y: y, m: m };
  };
  Core.monthDiff = function (a, b) { return (b.y - a.y) * 12 + (b.m - a.m); };
  Core.cmpDate = function (d, y, m) { return (d.y - y) * 12 + (d.m - m); };

  /* ---------- misc ---------- */
  Core.uid = function () { return 'x' + Math.random().toString(36).slice(2, 9); };
  Core.fmt = function (n, dec) {
    if (n == null || isNaN(n)) return '—';
    var v = dec ? n.toFixed(dec) : Math.round(n).toString();
    return v.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  Core.signed = function (n, dec) {
    var v = dec ? Math.abs(n).toFixed(dec) : Math.abs(Math.round(n)).toString();
    return (n > 0 ? '+' : n < 0 ? '−' : '') + v;
  };
  Core.roman = function (n) {
    var map = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']], s = '';
    map.forEach(function (p) { while (n >= p[0]) { s += p[1]; n -= p[0]; } });
    return s || '—';
  };
  Core.titleCase = function (s) { return s.replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }); };

  Core.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* ---------- tiny DOM helper ---------- */
  Core.on = function (el, name, fn) {
    (el.__fiumeListeners || (el.__fiumeListeners = {}))[name] = fn;
    el.addEventListener(name, fn);
    return el;
  };
  Core.h = function (tag, attrs, children) {
    var el = document.createElement(tag), k;
    if (attrs) for (k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') for (var s in v) el.style[s] = v[s];
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') Core.on(el, k.slice(2), v);
      else if (k === 'dataset') for (var d in v) el.dataset[d] = v[d];
      else el.setAttribute(k, v === true ? '' : v);
    }
    if (children != null) {
      (function add(c) {
        if (c == null || c === false || c === true) return;
        if (Array.isArray(c)) { c.forEach(add); return; }
        el.appendChild((typeof c === 'string' || typeof c === 'number') ? document.createTextNode(String(c)) : c);
      })(Array.isArray(children) ? children : [children]);
    }
    return el;
  };
  Core.qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  Core.qsa = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  Core.clear = function (el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; };
  Core.svg = function (tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag), k;
    if (attrs) for (k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] == null) continue;
      if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') Core.on(el, k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    return el;
  };
  Core.svgText = function (x, y, str, attrs) {
    var t = Core.svg('text', Object.assign({ x: x, y: y }, attrs || {}));
    t.textContent = str; return t;
  };

  /* ---------- i18n: every content node carries {zh, it, ...} ---------- */
  /* The active language is set by Fiume.I18N; missing keys fall back to zh. */
  Core.lang = 'zh';
  /* The secondary line of a content node (its subtitle). Chinese mode is the
     source language, so it shows nothing: the Italian is not a decoration to be
     displayed alongside, it is the same text in another language. When the it
     and en locales are written, this is what fills the subtitle slot. */
  Core.sub = function (node, lang) {
    lang = lang || Core.lang || 'zh';
    if (lang === 'zh') return '';
    if (node == null) return '';
    if (typeof node === 'string') return '';
    return node[lang] || '';
  };

  Core.L = function (node, lang) {
    if (node == null) return '';
    lang = lang || Core.lang || 'zh';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.join(' · ');
    return node[lang] || node.zh || node.it || '';
  };

  return Core;
});
