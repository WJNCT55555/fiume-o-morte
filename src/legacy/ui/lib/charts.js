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

  /* ---------------- Line chart with axes ----------------
     A real trend chart, not a sparkline: baseline, unit gridlines, a marked
     "recent" band, and the latest value as a dot. `series` is an array of
     { values, color, label }. Values are plotted on ONE shared scale unless
     `opts.perSeries` is set, which is what makes two different units comparable
     side by side without lying about their magnitudes. */
  C.lines = function (series, opts) {
    opts = opts || {};
    var w = opts.width || 320, h = opts.height || 132;
    var padL = opts.padLeft != null ? opts.padLeft : 34;
    var padR = 8, padT = 10, padB = opts.padBottom != null ? opts.padBottom : 18;
    var gridN = opts.grid != null ? opts.grid : 3;
    var list = (series || []).filter(function (s) { return s && s.values && s.values.length; });
    var maxLen = list.reduce(function (a, s) { return Math.max(a, s.values.length); }, 0);
    var root = svg('svg', {
      /* No preserveAspectRatio: the viewBox height is pinned to the rendered
         height and the width flexes, so scaling stays uniform. Forcing
         `none` stretched the text horizontally by whatever the flex factor
         was (1.54x at this column width), which made the axis labels look
         smeared. */
      viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: h, class: 'linechart'
    });
    if (!list.length) return root;
    /* One point is still information: draw the dot and the axes rather than
       returning an empty box. Returning early here left the economy trends
       completely blank for the first turn. */
    if (maxLen < 1) return root;

    /* One scale over every series (default), or one per series. */
    var lo = Infinity, hi = -Infinity;
    if (opts.perSeries) {
      list.forEach(function (s) {
        var mn = Math.min.apply(null, s.values), mx = Math.max.apply(null, s.values);
        s._lo = opts.min != null ? opts.min : mn;
        s._hi = opts.max != null ? opts.max : mx;
        if (s._hi - s._lo < 1e-6) s._hi = s._lo + 1;
      });
      lo = 0; hi = 1;   // unused in this branch
    } else {
      list.forEach(function (s) {
        lo = Math.min(lo, Math.min.apply(null, s.values));
        hi = Math.max(hi, Math.max.apply(null, s.values));
      });
      if (opts.min != null) lo = opts.min;
      if (opts.max != null) hi = opts.max;
      if (hi - lo < 1e-6) hi = lo + 1;
      /* Pad the range so the line never runs along the frame, and so a series
         that barely moves still reads as a line with a position rather than a
         flat rule on the axis (population is the case in point). */
      var raw = hi - lo;
      lo = lo - raw * 0.12;
      hi = hi + raw * 0.12;
      if (opts.min != null) lo = Math.max(opts.min, lo);
      if (opts.floor0 && lo < 0) lo = 0;
      /* A range narrower than the label precision prints the same tick twice
         ("52.0k / 52.0k / 52.0k"), which reads as a broken chart. Widen it around
         its centre until the ticks are distinguishable — but default the minimum
         to a small fraction of the scale, NOT a round number, so a series that
         genuinely moves a little still shows that movement rather than being
         flattened by the axis. */
      var minSpan = opts.minSpan != null ? opts.minSpan : Math.max(1, Math.abs(hi) * 0.02);
      if (hi - lo < minSpan) {
        var mid = (hi + lo) / 2;
        lo = mid - minSpan / 2;
        hi = mid + minSpan / 2;
        if (opts.floor0 && lo < 0) { hi -= lo; lo = 0; }
      }
      /* Round the ends outward so the gridlines carry readable numbers. */
      var span = hi - lo;
      var mag = Math.pow(10, Math.floor(Math.log(span) / Math.LN10));
      lo = Math.floor(lo / (mag / 2)) * (mag / 2);
      hi = Math.ceil(hi / (mag / 2)) * (mag / 2);
    }

    var plotW = w - padL - padR, plotH = h - padT - padB;
    var X = function (i) {
      /* With a single sample there is no span to interpolate: park it mid-plot so
         the dot is visible instead of sitting on the axis. */
      return maxLen <= 1 ? padL + plotW / 2 : padL + i / (maxLen - 1) * plotW;
    };
    var YOf = function (s, v) {
      var a = opts.perSeries ? s._lo : lo, b = opts.perSeries ? s._hi : hi;
      return padT + plotH - (v - a) / (b - a) * plotH;
    };

    /* Y label formatting. Three traps, all of which read as rendering faults:
       (1) "52k, 52k, 52k" — different ticks printed the same, so give thousands
           a decimal when the tick step is under 1000;
       (2) a mixed "1000 / 1500 / 2k" ladder — the thousands decision is taken
           once, from the top of the range, and applied to every label;
       (3) "24 / 25 / 24 / 24" — a range narrower than the rounding step made the
           labels non-monotonic, so the precision now follows the tick step. */
    var inThousands = Math.abs(hi) >= 10000;
    var step = (hi - lo) / Math.max(1, gridN);
    var kDec = inThousands && step < 1000 ? 1 : 0;
    var dec = 0;
    if (!inThousands && step > 0) dec = Math.min(2, Math.max(0, Math.ceil(-Math.log(step) / Math.LN10) + 1));
    var yLabel = function (v) {
      if (opts.perSeries) return '';
      if (inThousands) return (v / 1000).toFixed(kDec) + 'k';
      return v.toFixed(dec);
    };

    /* Gridlines + axis labels */
    for (var g = 0; g <= gridN; g++) {
      var vv = lo + (hi - lo) * (g / gridN);
      var yy = YOf(null, vv);
      root.appendChild(svg('line', {
        x1: padL, y1: Core.round2(yy), x2: w - padR, y2: Core.round2(yy),
        stroke: 'rgba(201,162,39,.16)', 'stroke-width': '1'
      }));
      var lt = svg('text', {
        x: padL - 5, y: Core.round2(yy + 3), 'text-anchor': 'end',
        fill: 'rgba(233,220,188,.42)', 'font-family': 'var(--font-mono)', 'font-size': '8.5'
      });
      lt.textContent = yLabel(vv);
      root.appendChild(lt);
    }
    /* Axis rules */
    root.appendChild(svg('line', { x1: padL, y1: padT, x2: padL, y2: padT + plotH, stroke: 'rgba(201,162,39,.3)', 'stroke-width': '1' }));
    root.appendChild(svg('line', { x1: padL, y1: padT + plotH, x2: w - padR, y2: padT + plotH, stroke: 'rgba(201,162,39,.3)', 'stroke-width': '1' }));

    list.forEach(function (s) {
      var pts = s.values.map(function (v, i) { return [X(i), YOf(s, v)]; });
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + Core.round2(p[0]) + ' ' + Core.round2(p[1]); }).join(' ');
      if (s.fill) {
        root.appendChild(svg('path', {
          d: d + ' L ' + Core.round2(pts[pts.length - 1][0]) + ' ' + (padT + plotH) + ' L ' + Core.round2(pts[0][0]) + ' ' + (padT + plotH) + ' Z',
          fill: s.fill, stroke: 'none'
        }));
      }
      root.appendChild(svg('path', {
        d: d, fill: 'none', stroke: s.color || '#C9A227', 'stroke-width': '1.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round'
      }));
      var last = pts[pts.length - 1];
      root.appendChild(svg('circle', { cx: Core.round2(last[0]), cy: Core.round2(last[1]), r: 2.6, fill: s.color || '#C9A227' }));
    });
    /* X labels: first and last only, so they never collide at this width. */
    [[0, 'start'], [maxLen - 1, 'end']].forEach(function (pair) {
      var t = svg('text', {
        x: Core.round2(X(pair[0])), y: h - 5, 'text-anchor': pair[1],
        fill: 'rgba(233,220,188,.42)', 'font-family': 'var(--font-mono)', 'font-size': '8.5'
      });
      t.textContent = opts.xLabels ? (opts.xLabels[pair[0]] || '') : ('T' + pair[0]);
      root.appendChild(t);
    });
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

  /* ============================================================
     Chord diagram — how the parties stand to one another

     Six parties sit on a ring; the length of each arc is that party's
     weight, and the cords between them are their relations.

     Two visual registers, because liking and loathing are not the same
     kind of thing. Amity is a *channel*, so it is drawn as a silk band
     whose width grows with the feeling. Enmity is not a channel at all —
     it is a cord under strain — so it is drawn as a thin crimson thread,
     hatched like an engraving, that gets sharper as the hostility deepens.
     Neither is a gradient: every band is one flat colour.
     ============================================================ */

  function mixHex(a, b, t) {
    function parse(h) {
      h = h.replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    var A = parse(a), B = parse(b);
    var out = '#';
    for (var i = 0; i < 3; i++) {
      var v = Math.round(A[i] + (B[i] - A[i]) * t);
      out += ('0' + v.toString(16)).slice(-2);
    }
    return out;
  }
  C.mixHex = mixHex;   // kept for callers that want a pair colour

  /* One measure for both the width of a cord and its colour, so that a single
     glance reads the whole scale: cold relations pull the ribbon thin and red,
     warm ones draw it wide and green. The floor keeps even the bitterest pair
     visible as a thread rather than a gap.

     The scale saturates at ±70 rather than the nominal ±100, because the
     mechanic derives baselines from camp and law agreement and in practice
     stays inside that band — against a ±100 domain nothing would ever reach a
     decided red or green and the middle would carry no information. */
  var SPAN = 70;
  var COLD = '#A81E2D', MID = '#C9A227', WARM = '#3E8E52';
  function warmth(v) {
    return 0.20 + 0.80 * ((Core.clamp(v, -SPAN, SPAN) + SPAN) / (SPAN * 2));
  }
  function warmthColor(v) {
    var t = (Core.clamp(v, -SPAN, SPAN) + SPAN) / (SPAN * 2);
    return t < 0.5 ? mixHex(COLD, MID, t * 2) : mixHex(MID, WARM, (t - 0.5) * 2);
  }
  C.warmthColor = warmthColor;
  /* The rail beside the plate draws its bars from the same two functions, so
     the two can never tell different stories about the same number. */
  C.warmth = warmth;
  C.WARMTH_SPAN = SPAN;

  C.chord = function (vm, opts) {
    opts = opts || {};
    var SZ = 660, cx = SZ / 2, cy = SZ / 2;
    var R_BAND = 186;   // where cords meet the ring
    var R_OUT = 208;    // outer edge of the party bands
    var R_LABEL = 222;  // where the party names are set, along their own arc

    /* The ouroboros frame. Its measurements come from the source art, so they
       are named here rather than buried in the path: the ring is not centred
       in its own canvas and its body is thicker where the coils overlap, which
       is why the inner edge is quoted at its tightest. */
    var RING_SRC = 'img/UI/ouroboros_ring_frame_carnaro.png';
    var RING_PX = 1254;        // square source
    var RING_R_OUT = 612.5;    // outer edge, measured across the horizontal
    var RING_R_IN = 472;       // inner edge at its tightest (the 45° coil)
    var RING_CX = 625.5;       // the ring's centre inside the source
    var RING_CY = 627.5;
    var RING_OUT = 318;        // where that outer edge should land in the viewBox
    // Keep the snake off the party names, and inside the canvas.
    var ringScale = RING_OUT / RING_R_OUT;
    var ringW = RING_PX * ringScale;
    var ringX = cx - RING_CX * ringScale;
    var ringY = cy - RING_CY * ringScale;
    var ringIn = RING_R_IN * ringScale;

    var root = svg('svg', { viewBox: '0 0 ' + SZ + ' ' + SZ, role: 'img', 'class': 'chord' });
    root.appendChild(svg('image', { href: RING_SRC, x: Core.round2(ringX), y: Core.round2(ringY),
      width: Core.round2(ringW), height: Core.round2(ringW), 'class': 'chord__ring' }));
    var defs = svg('defs');
    root.appendChild(defs);

    var P = vm.parties.filter(function (p) { return p.weight > 0; });
    if (P.length < 2) return root;

    var total = P.reduce(function (a, p) { return a + p.weight; }, 0);
    var GAP = 0.052;                                  // radians between parties
    var idx = {}; P.forEach(function (p, i) { idx[p.id] = i; });

    // Each party's arc, clockwise from the top.
    var cursor = -Math.PI / 2;
    P.forEach(function (p) {
      var span = 2 * Math.PI * (p.weight / total);
      p.a0 = cursor + GAP / 2;
      p.a1 = cursor + span - GAP / 2;
      cursor += span;
    });

    // Within a party's arc, room for each counterpart in proportion to how
    // strong that relation is. Cords hang off R_BAND, so their angular width
    // is what carries the feeling.
    P.forEach(function (p) {
      var kin = [];
      P.forEach(function (q) {
        if (q.id === p.id) return;
        var v = vm.value(p.id, q.id);
        kin.push({ q: q, v: v, w: warmth(v) });
      });
      kin.sort(function (x, y) { return idx[x.q.id] - idx[y.q.id]; });
      var wsum = kin.reduce(function (a, k) { return a + k.w; }, 0) || 1;
      var room = (p.a1 - p.a0) * 0.94;
      var c = p.a0 + (p.a1 - p.a0) * 0.03;
      p.sub = {};
      kin.forEach(function (k) {
        var w = room * (k.w / wsum);
        p.sub[k.q.id] = { a0: c, a1: c + w, v: k.v };
        c += w;
      });
    });

    var pt = function (ang, r) {
      return [Core.round2(cx + Math.cos(ang) * r), Core.round2(cy + Math.sin(ang) * r)];
    };
    var largeArc = function (a0, a1) { return (a1 - a0) > Math.PI ? 1 : 0; };

    /* ---- ornament: a fillet just outside each arc ----
       The ouroboros is the frame now, so the ruled circles and the quarter
       lozenges that used to sit here would only compete with it — and the top
       lozenge would have landed under the serpent's head. */
    P.forEach(function (p) {
      var f1 = pt(p.a0 - GAP * 0.30, R_OUT + 7), f2 = pt(p.a1 + GAP * 0.30, R_OUT + 7);
      root.appendChild(svg('path', {
        d: 'M ' + f1[0] + ' ' + f1[1] + ' A ' + (R_OUT + 7) + ' ' + (R_OUT + 7) + ' 0 ' +
           largeArc(p.a0 - GAP * 0.30, p.a1 + GAP * 0.30) + ' 1 ' + f2[0] + ' ' + f2[1],
        fill: 'none', stroke: 'rgba(201,162,39,.42)', 'stroke-width': '1' }));
    });

    var cordLayer = svg('g');
    var bandLayer = svg('g');
    var labelLayer = svg('g');
    root.appendChild(cordLayer);
    root.appendChild(bandLayer);
    root.appendChild(labelLayer);

    /* ---- cords ---- */
    var drawn = {};
    P.forEach(function (p) {
      P.forEach(function (q) {
        if (p.id >= q.id) return;                     // one cord per pair
        if (!p.sub[q.id] || !q.sub[p.id]) return;
        if (drawn[p.id + q.id]) return;
        drawn[p.id + q.id] = true;
        var v = vm.value(p.id, q.id);
        var A = p.sub[q.id], B = q.sub[p.id];
        var g = svg('g', { 'class': 'chord__cord', 'data-a': p.id, 'data-b': q.id,
          'data-v': Core.round1(v) });
        var ttl = svg('title');
        ttl.textContent = p.zh + ' ↔ ' + q.zh + '：' + (v > 0 ? '+' : '') + Core.round1(v) +
          '（' + (v >= 30 ? '亲近' : v <= -30 ? '对立' : '疏淡') + '）';
        g.appendChild(ttl);

        /* Every relation is a ribbon. One scale drives both its width and its
           hue, so the plate can be read at a glance without a legend lookup:
           narrow and red at the cold end, wide and green at the warm one. */
        var col = warmthColor(v);
        var a1 = pt(A.a0, R_BAND), a2 = pt(A.a1, R_BAND);
        var b1 = pt(B.a0, R_BAND), b2 = pt(B.a1, R_BAND);
        var d = 'M ' + a1[0] + ' ' + a1[1] +
                ' A ' + R_BAND + ' ' + R_BAND + ' 0 ' + largeArc(A.a0, A.a1) + ' 1 ' + a2[0] + ' ' + a2[1] +
                ' Q ' + cx + ' ' + cy + ' ' + b2[0] + ' ' + b2[1] +
                ' A ' + R_BAND + ' ' + R_BAND + ' 0 ' + largeArc(B.a0, B.a1) + ' 0 ' + b1[0] + ' ' + b1[1] +
                ' Q ' + cx + ' ' + cy + ' ' + a1[0] + ' ' + a1[1] + ' Z';
        g.appendChild(svg('path', { d: d, fill: col,
          'fill-opacity': Core.round2(0.34 + 0.24 * (warmth(v) - 0.22) / 0.78), stroke: 'none' }));
        g.appendChild(svg('path', { d: d, fill: 'none',
          stroke: col, 'stroke-opacity': '0.46', 'stroke-width': '0.8' }));
        cordLayer.appendChild(g);
      });
    });

    /* ---- party bands ---- */
    P.forEach(function (p) {
      var a0 = p.a0 - GAP * 0.18, a1 = p.a1 + GAP * 0.18;
      var o1 = pt(a0, R_OUT), o2 = pt(a1, R_OUT);
      var i2 = pt(a1, R_BAND), i1 = pt(a0, R_BAND);
      var d = 'M ' + o1[0] + ' ' + o1[1] +
              ' A ' + R_OUT + ' ' + R_OUT + ' 0 ' + largeArc(a0, a1) + ' 1 ' + o2[0] + ' ' + o2[1] +
              ' L ' + i2[0] + ' ' + i2[1] +
              ' A ' + R_BAND + ' ' + R_BAND + ' 0 ' + largeArc(a0, a1) + ' 0 ' + i1[0] + ' ' + i1[1] + ' Z';
      var g = svg('g', { 'class': 'chord__band', 'data-id': p.id });
      var ttl = svg('title');
      ttl.textContent = p.zh + ' — 全国支持 ' + Core.round1(p.weight) + '%';
      g.appendChild(ttl);
      g.appendChild(svg('path', { d: d, fill: p.color, 'fill-opacity': '0.88',
        stroke: 'rgba(8,6,4,.85)', 'stroke-width': '1' }));
      g.appendChild(svg('path', { d: d, fill: 'none', stroke: 'rgba(233,220,188,.32)', 'stroke-width': '0.8' }));
      bandLayer.appendChild(g);

      /* Label: the party's own name set along its arc, the way a plate is
         lettered. Text follows the arc outward, so it turns upside down once
         the arc crosses into the bottom half of the circle — there the path is
         walked the other way instead. */
      var mid = (p.a0 + p.a1) / 2;
      var flip = Math.sin(mid) > 0;
      var la0 = flip ? p.a1 : p.a0, la1 = flip ? p.a0 : p.a1;
      var sweep = flip ? 0 : 1;
      var lp1 = pt(la0, R_LABEL), lp2 = pt(la1, R_LABEL);
      var pathId = 'chord-arc-' + p.id;
      defs.appendChild(svg('path', { id: pathId, fill: 'none',
        d: 'M ' + lp1[0] + ' ' + lp1[1] + ' A ' + R_LABEL + ' ' + R_LABEL + ' 0 ' +
           largeArc(la0, la1) + ' ' + sweep + ' ' + lp2[0] + ' ' + lp2[1] }));

      var lg = svg('g', { 'class': 'chord__label', 'data-id': p.id });
      var nm = svg('text', { 'font-size': '12.5', 'font-family': 'var(--font-display)',
        'font-weight': '700', 'letter-spacing': '.12em', fill: p.color });
      var tp = svg('textPath', { href: '#' + pathId, startOffset: '50%', 'text-anchor': 'middle' });
      tp.textContent = p.zh;
      nm.appendChild(tp);
      lg.appendChild(nm);
      labelLayer.appendChild(lg);
    });

    /* ---- focusing: hovering a cord lights it and its two bands ---- */
    /* Hovering lights one cord and dims the rest.

       Two traps here, both worth naming. First, the handlers must be
       registered through Core.on: legacyToReact migrates only the listeners
       recorded in __fiumeListeners, so a bare addEventListener is dropped.
       Second — and this is the one that bites — legacyToReact does not adopt
       the nodes built above, it *rebuilds* them as React elements. cordLayer
       and bandLayer therefore point at a discarded tree, and writing classes
       onto it changes nothing on screen. The live subtree has to be reached
       through the event's currentTarget, which React maps to the real node. */
    var cordOf = function (t) { return t && t.closest ? t.closest('.chord__cord') : null; };
    var bandOf = function (t) { return t && t.closest ? t.closest('.chord__band') : null; };

    var paint = function (live, cordEl, bandEl) {
      var pair = cordEl ? [cordEl.getAttribute('data-a'), cordEl.getAttribute('data-b')] : null;
      var one = bandEl ? bandEl.getAttribute('data-id') : null;
      var focusing = !!(pair || one);
      var i, el, hit;

      /* With nothing focused the classes come off entirely. Leaving everything
         marked is-lit would be invisible today but would light up the moment a
         rule keyed on is-lit — which is exactly what the lit ribbon now has. */
      var mark = function (base, isHit) {
        return base + (focusing ? (isHit ? ' is-lit' : ' is-dim') : '');
      };

      var bands = live.querySelectorAll('.chord__band');
      for (i = 0; i < bands.length; i++) {
        el = bands[i];
        hit = pair ? (el.getAttribute('data-id') === pair[0] || el.getAttribute('data-id') === pair[1])
                   : one ? el.getAttribute('data-id') === one : false;
        el.setAttribute('class', mark('chord__band', hit));
      }
      var cords = live.querySelectorAll('.chord__cord');
      for (i = 0; i < cords.length; i++) {
        el = cords[i];
        hit = pair ? (el.getAttribute('data-a') === pair[0] && el.getAttribute('data-b') === pair[1])
                   : one ? (el.getAttribute('data-a') === one || el.getAttribute('data-b') === one) : false;
        el.setAttribute('class', mark('chord__cord', hit));
      }
      /* The name is lettered along the band, so it has to recede with it —
         otherwise a lit cord sits inside a ring of names all shouting at once. */
      var labels = live.querySelectorAll('.chord__label');
      for (i = 0; i < labels.length; i++) {
        el = labels[i];
        hit = pair ? (el.getAttribute('data-id') === pair[0] || el.getAttribute('data-id') === pair[1])
                   : one ? el.getAttribute('data-id') === one : false;
        el.setAttribute('class', mark('chord__label', hit));
      }
    };

    Core.on(root, 'mouseover', function (e) {
      var live = e.currentTarget;
      if (!live || !live.querySelectorAll) return;
      paint(live, cordOf(e.target), bandOf(e.target));
    });
    Core.on(root, 'mouseout', function (e) {
      var live = e.currentTarget;
      if (!live || !live.querySelectorAll) return;
      var to = e.relatedTarget;
      if (!to || !live.contains(to)) paint(live, null, null);
    });

    return root;
  };

  return C;
});
