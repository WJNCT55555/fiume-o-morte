/* ==========================================================================
   UI · 装饰纹样库（纯内联 SVG，无外部依赖）
   风格参照 1919–1924 年意大利/阜姆宣传画与装饰艺术：
   束棒、月桂、鹰、胜利女神、罗盘、纪年饰带、边角花饰。
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Orn = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';
  var O = {}, svg = Core.svg;

  /* Every icon is a set of paths on a 24x24 viewBox */
  var ICONS = {

    /* Gear: settings */
    gear: [
      ['path', 'M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zm0 1.7a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z'],
      ['path', 'M10.9 2h2.2l.4 2.3 1.5.6 1.9-1.4 1.6 1.6-1.4 1.9.6 1.5 2.3.4v2.2l-2.3.4-.6 1.5 1.4 1.9-1.6 1.6-1.9-1.4-1.5.6-.4 2.3h-2.2l-.4-2.3-1.5-.6-1.9 1.4-1.6-1.6 1.4-1.9-.6-1.5L2 13.1v-2.2l2.3-.4.6-1.5L3.5 7.1l1.6-1.6 1.9 1.4 1.5-.6z']
    ],

    /* Trophy: achievements */
    trophy: [
      ['path', 'M7 3h10v3.2a5 5 0 0 1-4 4.9V15h2.4v2H8.6v-2H11v-3.9A5 5 0 0 1 7 6.2zm1.6 1.6v1.6a3.4 3.4 0 0 0 1.6 2.9V6.2a3.4 3.4 0 0 1-.4-1.6zm4.2 0a3.4 3.4 0 0 1-.4 1.6v4.5a3.4 3.4 0 0 0 1.6-2.9V4.6z'],
      ['path', 'M6.4 4.6H3.6v2.2c0 2 1.4 3.5 3.4 3.7v-1.6c-1-.2-1.8-1-1.8-2.1V6.2h1.2z'],
      ['path', 'M17.6 4.6h2.8v2.2c0 2-1.4 3.5-3.4 3.7v-1.6c1-.2 1.8-1 1.8-2.1V6.2h-1.2z'],
      ['rect', { x: 7, y: 17.4, width: 10, height: 2.6, rx: .5 }]
    ],

    /* Musical note: music */
    note: [
      ['path', 'M9 4.2 19 2v3.1l-8 1.7v8.4a3.6 3.6 0 1 0 1.8 3.1V4.2z'],
      ['circle', { cx: 7.2, cy: 17.8, r: 3.2 }]
    ],

    /* Globe: language */
    globe: [
      ['circle', { cx: 12, cy: 12, r: 9 }],
      ['path', 'M3 12h18M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z']
    ],

    /* Floppy disk: saves */
    disk: [
      ['path', 'M4 3h12.6L20 6.4V21H4zm2 2v4h9V5zm1 8h10v6H7z']
    ],

    /* Fasces */
    fasces: [
      ['path', 'M9 3h1.5v18H9z'], ['path', 'M11.4 3H13v18h-1.6z'],
      ['path', 'M6.6 3h1.5v18H6.6z'], ['path', 'M14 3h1.5v18H14z'],
      ['path', 'M4.6 3h1.4v18H4.6z'], ['path', 'M16 3h1.4v18H16z'],
      ['rect', { x: 4, y: 6.4, width: 14, height: 1.5, rx: .5 }],
      ['rect', { x: 4, y: 10.4, width: 14, height: 1.5, rx: .5 }],
      ['rect', { x: 4, y: 14.4, width: 14, height: 1.5, rx: .5 }],
      ['path', 'M18.2 2.2c2 .5 3.4 1.9 3.8 3.9.3 1.6-.4 3-1.9 3.9l-.6-1.4c.9-.6 1.3-1.4 1.1-2.4-.2-1-.9-1.8-2-2.1z']
    ],

    /* Laurel wreath, two branches */
    laurel: [
      ['path', 'M12 21.5C7 21.5 3.2 18 2.4 13.2c-.1-.6.5-1 1-.7 1 .6 1.8 1.5 2.4 2.6C6.6 17.9 9 19.6 12 19.6c3 0 5.4-1.7 6.2-4.5.6-1.1 1.4-2 2.4-2.6.5-.3 1.1.1 1 .7-.8 4.8-4.6 8.3-9.6 8.3z'],
      ['path', 'M4.6 12.4c-1.3-1.2-2-2.7-1.9-4.4.1-.5.7-.8 1.1-.5.5.4 1 .9 1.3 1.5.4.9.5 1.9.3 2.9z'],
      ['path', 'M19.4 12.4c1.3-1.2 2-2.7 1.9-4.4-.1-.5-.7-.8-1.1-.5-.5.4-1 .9-1.3 1.5-.4.9-.5 1.9-.3 2.9z'],
      ['path', 'M7.4 8.6C7.1 7 7.5 5.4 8.6 4.2c.4-.4 1-.3 1.2.2.3.6.5 1.3.5 2 0 1-.3 1.9-.9 2.6z'],
      ['path', 'M16.6 8.6c.3-1.6-.1-3.2-1.2-4.4-.4-.4-1-.3-1.2.2-.3.6-.5 1.3-.5 2 0 1 .3 1.9.9 2.6z']
    ],

    /* Roman eagle */
    eagle: [
      ['path', 'M12 4.2l1.1 2.1 2.3.3-1.7 1.6.4 2.3-2.1-1.1-2.1 1.1.4-2.3-1.7-1.6 2.3-.3z'],
      ['path', 'M11.2 10.4h1.6v6.2h-1.6z'],
      ['path', 'M9.2 16.4h5.6l-1 1.8h-3.6z'],
      ['path', 'M11.4 10.8C9.6 10.2 7.6 9.9 5.4 10c-1.6.1-3.1.4-4.4 1 .9.2 1.8.5 2.6 1 .9.6 1.6 1.3 2.1 2.2.5-.9 1.2-1.6 2-2.1.9-.5 2-.8 3.7-.9z'],
      ['path', 'M12.6 10.8c1.8-.6 3.8-.9 6-.8 1.6.1 3.1.4 4.4 1-.9.2-1.8.5-2.6 1-.9.6-1.6 1.3-2.1 2.2-.5-.9-1.2-1.6-2-2.1-.9-.5-2-.8-3.7-.9z']
    ],

    /* Winged Victory, simplified relief silhouette */
    victory: [
      ['path', 'M12 2.4a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8z'],
      ['path', 'M10.6 6.8h2.8l.6 6-1 5.6h-1.9l-.9-5.6z'],
      ['path', 'M10.4 7.4C8.4 8.6 6.9 10.3 6 12.4l1.6.8c.8-1.7 2-3 3.6-3.9z'],
      ['path', 'M13.6 7.4c2 1.2 3.5 2.9 4.4 5l-1.6.8c-.8-1.7-2-3-3.6-3.9z'],
      ['path', 'M6 12.6c-1.7-.5-3.3-.5-4.8.1.7.7 1.5 1.2 2.4 1.5-.1 1 .1 1.9.6 2.7 1.2-1.9 2.2-3.3 3.4-4.3z'],
      ['path', 'M18 12.6c1.7-.5 3.3-.5 4.8.1-.7.7-1.5 1.2-2.4 1.5.1 1-.1 1.9-.6 2.7-1.2-1.9-2.2-3.3-3.4-4.3z'],
      ['path', 'M8.6 18.6h6.8l.7 1.4H7.9z']
    ],

    /* Flame: fervour */
    flame: [
      ['path', 'M12 2.2c2.6 3 4.3 5.6 4.3 8.4 0 2.9-2 4.9-4.3 4.9s-4.3-2-4.3-4.9c0-1.4.5-2.7 1.4-4.1.3 1.2.9 2 1.8 2.4-.6-2.4-.2-4.5 1.1-6.7z'],
      ['path', 'M12 16.2c1.6 0 2.6 1.1 2.6 2.4 0 1.7-1.2 3.2-2.6 3.2s-2.6-1.5-2.6-3.2c0-1.3 1-2.4 2.6-2.4z']
    ],

    /* Coins: treasury */
    coins: [
      ['ellipse', { cx: 12, cy: 7.4, rx: 8, ry: 3.4 }],
      ['path', 'M4 7.4v3.2c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4V7.4c0 1.9-3.6 3.4-8 3.4s-8-1.5-8-3.4z'],
      ['path', 'M4 13v3.2c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4V13c0 1.9-3.6 3.4-8 3.4s-8-1.5-8-3.4z']
    ],

    /* Legion: militia */
    milizia: [
      ['circle', { cx: 7, cy: 5.6, r: 2.2 }], ['path', 'M4.4 9h5.2l1 5.2-.9 7.6H4.3l-.9-7.6z'],
      ['circle', { cx: 17, cy: 5.6, r: 2.2 }], ['path', 'M14.4 9h5.2l1 5.2-.9 7.6h-5.4l-.9-7.6z'],
      ['circle', { cx: 12, cy: 7.4, r: 2.5 }], ['path', 'M9 11.2h6l1.2 5.8-1 6.4h-6.4l-1-6.4z']
    ],

    /* Factory: production */
    industria: [
      ['path', 'M2.4 20.6V11l5 3.2V11l5 3.2V11l5 3.2V6.4h3.2v14.2z'],
      ['path', 'M5.6 3h2.2v4.2H5.6z'], ['path', 'M9.6 3h2.2v4.2H9.6z'],
      ['rect', { x: 4.6, y: 16.4, width: 2.4, height: 2.4 }],
      ['rect', { x: 9.4, y: 16.4, width: 2.4, height: 2.4 }],
      ['rect', { x: 14.2, y: 16.4, width: 2.4, height: 2.4 }]
    ],

    /* Legitimacy: shield inside a laurel crown */
    legittimita: [
      ['path', 'M12 2.6l7.4 2.6v7.2c0 4.4-3.1 7.9-7.4 9-4.3-1.1-7.4-4.6-7.4-9V5.2z'],
      ['path', 'M12 5.6l4.6 1.6v5.2c0 2.9-1.9 5.2-4.6 6.1-2.7-.9-4.6-3.2-4.6-6.1V7.2z'],
      ['path', 'M12 8.4l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z']
    ],

    /* Star of Italy */
    star: [
      ['path', 'M12 2.4l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.3l-5.9 3.1 1.2-6.5L2.5 9.3l6.6-.9z']
    ],

    /* Compass */
    compass: [
      ['circle', { cx: 12, cy: 12, r: 9.6 }],
      ['path', 'M12 1.4l1.7 4.3h-3.4z'], ['path', 'M12 22.6l1.7-4.3h-3.4z'],
      ['path', 'M1.4 12l4.3 1.7v-3.4z'], ['path', 'M22.6 12l-4.3 1.7v-3.4z'],
      ['path', 'M12 4.6l2.6 9-2.6 5.8-2.6-5.8z'],
      ['path', 'M12 19.4l-2.6-9L12 4.6l2.6 5.8z', { opacity: .55 }]
    ],

    /* Arrow: decision */
    arrow: [
      ['path', 'M4 10.6h9.6V6.2L21.4 12l-7.8 5.8v-4.4H4z']
    ],

    /* Broken column: memorial, used on the ending screen */
    column: [
      ['path', 'M4.4 3.4h15.2v2.4H4.4z'],
      ['path', 'M6 6.2h2.6v11.2H6z'], ['path', 'M10.7 6.2h2.6v11.2h-2.6z'], ['path', 'M15.4 6.2h2.6v11.2h-2.6z'],
      ['path', 'M3.6 17.8h16.8v2.8H3.6z'],
      ['path', 'M12 8.2l1.5 2.6-1.5 2.4-1.5-2.4z']
    ],

    /* Winged lion, the Fiume and Venetian tradition */
    lion: [
      ['path', 'M8.4 19.6c-1.4-1.2-2.2-3-2.2-5.2 0-3.4 2.3-6.2 5.6-6.2 2 0 3.6.9 4.6 2.4l-1.6 1c-.7-1-1.8-1.6-3-1.6-2.3 0-3.8 1.9-3.8 4.4 0 1.6.5 3 1.4 3.9z'],
      ['path', 'M6.2 8.6c-1.4-1.6-3-2.6-4.8-3 .3 1.3.9 2.4 1.9 3.3-.5 1.1-.6 2.2-.3 3.4 1.5-1.4 2.6-2.7 3.2-3.7z'],
      ['path', 'M12.6 6.2c1.6-1.4 3.4-2.2 5.4-2.4-.4 1.2-1.1 2.2-2.1 3 .4 1.1.4 2.2 0 3.3-1.4-1.6-2.5-2.9-3.3-3.9z'],
      ['path', 'M8 19.4h8.4l.9 2.2H7.1z'],
      ['circle', { cx: 12.6, cy: 9.6, r: .9 }]
    ]
  };

  /** Return a 24x24 SVG icon element */
  O.icon = function (name, opts) {
    opts = opts || {};
    var size = opts.size || 24;
    var node = svg('svg', {
      viewBox: '0 0 24 24', width: size, height: size,
      'class': 'icn' + (opts.cls ? ' ' + opts.cls : ''),
      'aria-hidden': 'true', focusable: 'false'
    });
    var defs = (ICONS[name] || []);
    defs.forEach(function (d) {
      var tag = d[0], a = d[1];
      if (typeof a === 'string') a = { d: a };
      var attrs = { fill: 'currentColor' };
      for (var k in a) attrs[k] = a[k];
      if (opts.stroke) { attrs.fill = 'none'; attrs.stroke = 'currentColor'; attrs['stroke-width'] = opts.stroke; }
      node.appendChild(svg(tag, attrs));
    });
    return node;
  };
  O.has = function (n) { return !!ICONS[n]; };
  O.names = function () { return Object.keys(ICONS); };

  /** Inline SVG string, for innerHTML contexts */
  O.iconHTML = function (name, size, cls) {
    var el = O.icon(name, { size: size, cls: cls });
    var box = document.createElement('div');
    box.appendChild(el);
    return box.innerHTML;
  };

  /* ---------------- Composite ornaments ---------------- */

  /** Masthead flourish: the era badge flanked by two laurel sprays */
  O.mastheadFlourish = function (side) {
    var s = svg('svg', { viewBox: '0 0 160 60', width: '160', height: '60', 'class': 'flourish flourish--' + side });
    var g = svg('g', { fill: 'currentColor' });
    var flip = side === 'r';
    g.setAttribute('transform', flip ? 'translate(160,0) scale(-1,1)' : '');
    g.appendChild(svg('path', { d: 'M2 40c26-2 46-10 62-24 4-3 9-3 13 0-14 6-24 15-31 27-8 4-18 6-30 6-5 0-10-1-14-3z' }));
    g.appendChild(svg('path', { d: 'M6 30c20 0 36-6 48-18 3-3 7-3 10 0-11 5-19 13-25 23-7 4-16 6-26 6-3 0-5-1-7-3z', opacity: .55 }));
    for (var i = 0; i < 5; i++) {
      g.appendChild(svg('ellipse', { cx: 24 + i * 11, cy: 20 - i * 1.6, rx: 4.6, ry: 2.1, transform: 'rotate(' + (-32 - i * 3) + ' ' + (24 + i * 11) + ' ' + (20 - i * 1.6) + ')' }));
    }
    g.appendChild(svg('circle', { cx: 78, cy: 34, r: 3.2 }));
    root && 0;
    s.appendChild(g);
    return s;
  };

  /** Side column: fasces with a winged capital, used for the fixed side rails */
  O.sideColumn = function (side) {
    var w = 46, hh = 620;
    var s = svg('svg', { viewBox: '0 0 ' + w + ' ' + hh, width: '100%', height: '100%', preserveAspectRatio: 'none', 'class': 'sidecol sidecol--' + side });
    var g = svg('g', { fill: 'currentColor' });
    function band(y, h) { g.appendChild(svg('rect', { x: 4, y: y, width: w - 8, height: h, rx: 1 })); }
    // Capital
    g.appendChild(svg('path', { d: 'M6 6h' + (w - 12) + 'l4 12H2z' }));
    band(22, 5);
    // Shaft: six flutes
    for (var i = 0; i < 6; i++) {
      g.appendChild(svg('rect', { x: 8 + i * 5.6, y: 32, width: 3, height: hh - 96, rx: 1.4, opacity: i % 2 ? .45 : .95 }));
    }
    // Bands
    for (var b = 0; b < 5; b++) band(90 + b * 96, 4);
    band(hh - 62, 5);
    g.appendChild(svg('path', { d: 'M2 ' + (hh - 52) + 'h' + (w - 4) + 'l-4 14H6z' }));
    s.appendChild(g);
    return s;
  };

  /** Decorative corner filigree, returns four corner elements */
  O.corners = function () {
    var frag = document.createDocumentFragment();
    ['tl', 'tr', 'bl', 'br'].forEach(function (c) {
      var s = svg('svg', { viewBox: '0 0 22 22', width: '22', height: '22', 'class': 'corner corner--' + c });
      var g = svg('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4' });
      g.appendChild(svg('path', { d: 'M1 8V4.6C1 2.6 2.6 1 4.6 1H8' }));
      g.appendChild(svg('path', { d: 'M4 12V6.6C4 5.2 5.2 4 6.6 4H12', opacity: .55 }));
      g.appendChild(svg('circle', { cx: 4.6, cy: 4.6, r: 1.15, fill: 'currentColor', stroke: 'none' }));
      s.appendChild(g);
      frag.appendChild(s);
    });
    return frag;
  };

  /** Triangular ornament on the right of a decision button */
  O.decoArrow = function () {
    var s = svg('svg', { viewBox: '0 0 20 20', width: 16, height: 16, 'class': 'deco-arrow' });
    s.appendChild(svg('path', { d: 'M4 3l10 7-10 7z', fill: 'currentColor' }));
    s.appendChild(svg('path', { d: 'M1 3l10 7-10 7z', fill: 'currentColor', opacity: .4 }));
    return s;
  };

  /** Map unit counter badge */
  O.unitBadge = function (opts) {
    opts = opts || {};
    var n = opts.count == null ? '' : String(opts.count);
    var s = svg('svg', { viewBox: '0 0 46 56', width: opts.size || 34, height: (opts.size || 34) * 56 / 46, 'class': 'unit unit--' + (opts.kind || 'land') });
    s.appendChild(svg('rect', { x: 3, y: 2, width: 40, height: 42, rx: 3, fill: opts.dark ? '#14100C' : '#221A12', stroke: '#C9A227', 'stroke-width': 2 }));
    s.appendChild(svg('rect', { x: 3, y: 2, width: 40, height: 42, rx: 3, fill: 'none', stroke: '#8A6D1F', 'stroke-width': 1 }));
    // Staff
    s.appendChild(svg('path', { d: 'M23 44l4 9h-8z', fill: '#C9A227' }));
    var glyph = opts.kind === 'naval' ? 'M6 26h34l-5 9H11z' : (opts.kind === 'alpine' ? 'M8 34l14-20 14 20z' : 'M10 34V20h26v14z');
    s.appendChild(svg('path', { d: glyph, fill: opts.color || '#E8D9B5', opacity: .9 }));
    if (n) {
      var t = svg('text', { x: 23, y: 32, 'text-anchor': 'middle', 'font-family': 'var(--font-mono)', 'font-size': 17, 'font-weight': 700, fill: '#14100C' });
      t.textContent = n; s.appendChild(t);
    }
    return s;
  };

  return O;
});
