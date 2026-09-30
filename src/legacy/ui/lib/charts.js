/* ==========================================================================
   UI · 图表（纯 SVG，无外部依赖）
   - 议会席位弧图：D3 parliament 布局的等价实现（同心弧 + 比例分配 + 最大余数修正）
   - 环形图 / 堆叠条 / 折线 / 仪表
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Charts = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';
  var C = {}, svg = Core.svg;

  /* ---------------- Parliament seat arc ---------------- */
  /* Layout: k concentric arcs spanning 180 degrees; seat count scales with radius. */
  C.parliamentLayout = function (total, innerR, outerR, seatR) {
    if (total <= 0) return [];
    var span = outerR - innerR;
    var k = Math.max(2, Math.round(Math.sqrt(total) * 0.72));
    var step = k > 1 ? span / (k - 1) : 0;
    var radii = [], i, j;
    for (i = 0; i < k; i++) radii.push(innerR + step * i);
    var sumR = radii.reduce(function (a, b) { return a + b; }, 0);
    var counts = radii.map(function (r) { return Math.max(1, Math.round(total * r / sumR)); });
    // Largest-remainder correction
    var diff = total - counts.reduce(function (a, b) { return a + b; }, 0);
    while (diff !== 0) {
      var idx = diff > 0 ? counts.indexOf(Math.max.apply(null, counts)) : counts.indexOf(Math.max.apply(null, counts));
      if (diff > 0) { counts[idx]++; diff--; }
      else {
        var mi = -1; counts.forEach(function (c, n) { if (c > 1 && (mi < 0 || c > counts[mi])) mi = n; });
        if (mi < 0) break;
        counts[mi]--; diff++;
      }
    }
    var pts = [];
    counts.forEach(function (n, row) {
      var r = radii[row];
      for (j = 0; j < n; j++) {
        var a = Math.PI + (j + 0.5) / n * Math.PI;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, a: a, r: r, row: row, i: pts.length });
      }
    });
    return pts.map(function (p) { return { x: p.x, y: p.y, r: p.r, a: p.a, row: p.row }; });
  };

  var AXIS = ['PSI', 'PCR', 'PAD', 'AUT', 'ANI', 'LEG'];

  C.parliament = function (vm, opts) {
    opts = opts || {};
    var W = 620, H = 340, cx = W / 2, cy = H - 26;
    var innerR = 96, outerR = 232, seatR = opts.seatR || 7.6;
    var total = vm.total || 0;
    if (total <= 0) {
      var empty = svg('svg', { viewBox: '0 0 ' + W + ' ' + H });
      var t = svg('text', { x: cx, y: cy - 60, 'text-anchor': 'middle', fill: 'rgba(233,220,188,.42)', 'font-size': '15', 'font-family': 'var(--font-display)' });
      t.textContent = '摄政由指挥官与七位执政官治理';
      empty.appendChild(t);
      var t2 = svg('text', { x: cx, y: cy - 36, 'text-anchor': 'middle', fill: 'rgba(201,162,39,.6)', 'font-size': '11', 'letter-spacing': '.2em' });
      t2.textContent = 'NESSUNA ASSEMBLEA ELETTA';
      empty.appendChild(t2);
      return empty;
    }
    var pts = C.parliamentLayout(total, innerR, outerR, seatR);
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });

    // Background arc
    root.appendChild(svg('path', {
      d: 'M ' + (cx - outerR - 12) + ' ' + cy + ' A ' + (outerR + 12) + ' ' + (outerR + 12) + ' 0 0 1 ' + (cx + outerR + 12) + ' ' + cy,
      fill: 'none', stroke: 'rgba(201,162,39,.34)', 'stroke-width': '1'
    }));
    root.appendChild(svg('path', {
      d: 'M ' + (cx - innerR + 38) + ' ' + cy + ' A ' + (innerR - 38) + ' ' + (innerR - 38) + ' 0 0 1 ' + (cx + innerR - 38) + ' ' + cy,
      fill: 'none', stroke: 'rgba(201,162,39,.22)', 'stroke-width': '1'
    }));

    // Seat order along the political axis, filled from the left
    var ordered = [];
    AXIS.forEach(function (pid) {
      var s = vm.seats.filter(function (x) { return x.id === pid; })[0];
      if (s) for (var n = 0; n < s.seats; n++) ordered.push(s);
    });
    vm.seats.forEach(function (s) { if (AXIS.indexOf(s.id) < 0) { for (var n = 0; n < s.seats; n++) ordered.push(s); } });

    ordered.forEach(function (s, i) {
      var p = pts[i]; if (!p) return;
      var g = svg('g', { 'class': 'parl__seat' });
      var title = svg('title');
      title.textContent = s.zh + (Core.sub(s) ? ' / ' + Core.sub(s) : '') + ' — ' + s.seats + ' 席';
      g.appendChild(title);
      g.appendChild(svg('circle', {
        cx: Core.round2(cx + p.x), cy: Core.round2(cy + p.y), r: seatR,
        fill: s.color, stroke: 'rgba(8,6,4,.9)', 'stroke-width': '1.1'
      }));
      root.appendChild(g);
    });

    // Majority line
    var majA = Math.PI + 0.5 * Math.PI;
    root.appendChild(svg('line', {
      x1: cx, y1: cy - innerR + 44, x2: cx, y2: cy - outerR - 16,
      stroke: 'rgba(201,162,39,.55)', 'stroke-width': '1', 'stroke-dasharray': '3 4'
    }));

    // Centre readout
    var big = svg('text', {
      x: cx, y: cy - 42, 'text-anchor': 'middle', fill: '#F3E4B0',
      'font-family': 'var(--font-mono)', 'font-size': '34', 'font-weight': '600'
    });
    big.textContent = vm.playerSeats;
    root.appendChild(big);
    var sub = svg('text', {
      x: cx, y: cy - 22, 'text-anchor': 'middle', fill: 'rgba(233,220,188,.52)',
      'font-size': '11', 'letter-spacing': '.14em'
    });
    sub.textContent = 'SEGGI / 76   多数 ' + vm.majority;
    root.appendChild(sub);

    return root;
  };

  /* ---------------- Donut ---------------- */
  C.donut = function (items, opts) {
    opts = opts || {};
    var size = opts.size || 132, stroke = opts.stroke || 17;
    var r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
    var total = items.reduce(function (a, b) { return a + Math.max(0, b.value); }, 0) || 1;
    var root = svg('svg', { viewBox: '0 0 ' + size + ' ' + size, width: size, height: size });
    var a0 = -Math.PI / 2;
    items.forEach(function (it) {
      var frac = Math.max(0, it.value) / total;
      if (frac <= 0.0005) return;
      var a1 = a0 + frac * Math.PI * 2;
      var large = (a1 - a0) > Math.PI ? 1 : 0;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      var g = svg('g');
      var ti = svg('title'); ti.textContent = it.zh + ' ' + Core.round1(it.value); g.appendChild(ti);
      g.appendChild(svg('path', {
        d: 'M ' + Core.round2(x0) + ' ' + Core.round2(y0) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + Core.round2(x1) + ' ' + Core.round2(y1),
        fill: 'none', stroke: it.color, 'stroke-width': stroke, 'stroke-linecap': 'butt'
      }));
      root.appendChild(g);
      a0 = a1;
    });
    if (opts.center != null) {
      var t = svg('text', {
        x: cx, y: cy + 2, 'text-anchor': 'middle', fill: '#F3E4B0',
        'font-family': 'var(--font-mono)', 'font-size': '19', 'font-weight': '600'
      });
      t.textContent = opts.center; root.appendChild(t);
      if (opts.centerSub) {
        var t2 = svg('text', {
          x: cx, y: cy + 19, 'text-anchor': 'middle', fill: 'rgba(233,220,188,.5)', 'font-size': '9.5',
          'letter-spacing': '.12em'
        });
        t2.textContent = opts.centerSub; root.appendChild(t2);
      }
    }
    return root;
  };

  /* ---------------- Trend sparkline ---------------- */
  C.sparkline = function (values, opts) {
    opts = opts || {};
    var w = opts.width || 260, h = opts.height || 46, pad = 3;
    var root = svg('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: h, preserveAspectRatio: 'none' });
    if (!values || values.length < 2) return root;
    var lo = opts.min != null ? opts.min : Math.min.apply(null, values);
    var hi = opts.max != null ? opts.max : Math.max.apply(null, values);
    if (hi - lo < 1e-6) { hi = lo + 1; }
    var step = (w - pad * 2) / (values.length - 1);
    var pts = values.map(function (v, i) {
      return [pad + i * step, h - pad - (v - lo) / (hi - lo) * (h - pad * 2)];
    });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + Core.round2(p[0]) + ' ' + Core.round2(p[1]); }).join(' ');
    if (opts.fill !== false) {
      root.appendChild(svg('path', {
        d: d + ' L ' + Core.round2(pts[pts.length - 1][0]) + ' ' + h + ' L ' + pad + ' ' + h + ' Z',
        fill: opts.fillColor || 'rgba(255,222,24,.14)', stroke: 'none'
      }));
    }
    if (opts.guide != null) {
      var gy = h - pad - (opts.guide - lo) / (hi - lo) * (h - pad * 2);
      if (gy >= 0 && gy <= h) root.appendChild(svg('line', {
        x1: 0, y1: Core.round2(gy), x2: w, y2: Core.round2(gy),
        stroke: 'rgba(201,162,39,.3)', 'stroke-width': '1', 'stroke-dasharray': '3 3'
      }));
    }
    root.appendChild(svg('path', { d: d, fill: 'none', stroke: opts.color || '#FFDE18', 'stroke-width': '1.8', 'stroke-linejoin': 'round' }));
    var last = pts[pts.length - 1];
    root.appendChild(svg('circle', { cx: Core.round2(last[0]), cy: Core.round2(last[1]), r: 2.6, fill: opts.color || '#FFDE18' }));
    return root;
  };

  /* ---------------- Horizontal bar ---------------- */
  C.barRow = function (label, sub, value, max, color, extra) {
    var row = Core.h('div', { class: 'row', style: { gap: '9px' } });
    var lab = Core.h('div', { class: 'flex1 ellip', style: { fontSize: '12.3px' } }, [
      label, sub ? Core.h('span', { class: 'dim tiny', style: { marginLeft: '6px' } }, sub) : null
    ]);
    var track = Core.h('div', { class: 'bar flex1', style: { maxWidth: '132px' } });
    track.appendChild(Core.h('div', {
      class: 'bar__fill',
      style: { width: Core.clamp(value / (max || 100) * 100, 0, 100) + '%', background: color }
    }));
    var v = Core.h('div', { class: 'num nowrap', style: { width: '44px', textAlign: 'right', fontSize: '12px' } },
      (extra != null ? extra : Core.round1(value).toString()));
    row.appendChild(lab); row.appendChild(track); row.appendChild(v);
    return row;
  };

  C.stackBar = function (segments) {
    var el = Core.h('div', { class: 'stackbar' });
    segments.forEach(function (s) {
      if (s.v <= 0) return;
      var seg = Core.h('div', { class: 'stackbar__seg', title: s.zh + ' ' + Core.round1(s.v) + '%' });
      seg.style.width = s.v + '%';
      seg.style.background = s.color;
      el.appendChild(seg);
    });
    return el;
  };

  return C;
});
