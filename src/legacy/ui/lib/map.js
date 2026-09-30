/* ==========================================================================
   UI · 阜姆领土图
   src/map/data/districts.js  →  13 个可点选地点 + 1919 周边控制区 + 埃内奥河
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.Core, root.Fiume.World);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.MapView = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, W) {
  'use strict';
  var svg = Core.svg;
  var GEO = (typeof window !== 'undefined' && window.FIUME_GEO_DISTRICTS) || null;
  var COAST = (typeof window !== 'undefined' && window.FIUME_GEO_COAST) || null;
  var CONTEXT = (typeof window !== 'undefined' && window.FIUME_GEO_CONTEXT) || null;

  var M = {};

  var STATUS_STYLE = {
    fiume: { label: { zh: '军团控制区', it: 'Controllo legionari' }, color: '#B87668' },
    yugo:  { label: { zh: '南斯拉夫控制区', it: 'Regno S.H.S.' }, color: '#AEBCA2' }
  };
  M.STATUS_STYLE = STATUS_STYLE;
  M.GEO = GEO;

  // Polygon coordinates were generated with this origin. The old metadata
  // incorrectly said 14.4 / 45.3 and displaced every point marker by kilometres.
  function meta() { return { lon0: 14.4135, lat0: 45.3477 }; }

  M.zoom = 1;
  M.center = null;
  M.zoomAt = function (factor, fx, fy) {
    var box = M.baseBox;
    if (!box) return;
    var prior = M.zoom, next = Core.clamp(prior * factor, 0.65, 3.2);
    var cx = M.center ? M.center[0] : box[0] + box[2] / 2;
    var cy = M.center ? M.center[1] : box[1] + box[3] / 2;
    var nx = cx + (fx - .5) * box[2] / prior - (fx - .5) * box[2] / next;
    var ny = cy + (fy - .5) * box[3] / prior - (fy - .5) * box[3] / next;
    M.center = [Core.clamp(nx, box[0], box[0] + box[2]), Core.clamp(ny, box[1], box[1] + box[3])];
    M.zoom = next;
  };
  M.zoomBy = function (factor) { M.zoomAt(factor, .5, .5); };
  M.resetZoom = function () { M.zoom = 1; M.center = null; };

  function project(lon, lat) {
    var m = meta(), K = Math.cos(m.lat0 * Math.PI / 180);
    return [(lon - m.lon0) * 111320 * K, -(lat - m.lat0) * 110574];
  }
  M.project = project;

  function kastavUnderItaly(date) {
    if (!date) return true;
    return date.y < 1921 || (date.y === 1921 && (date.m < 5 || (date.m === 5 && date.d < 26)));
  }
  M.kastavUnderItaly = kastavUnderItaly;

  function ringPath(ring) {
    if (!ring || ring.length < 3) return '';
    var d = 'M' + ring[0][0] + ',' + ring[0][1];
    for (var i = 1; i < ring.length; i++) d += 'L' + ring[i][0] + ',' + ring[i][1];
    return d + 'Z';
  }

  /* Soft hand-tinted political wash, with a restrained control ramp. */
  function controlColor(control, status) {
    if (status === 'yugo') return '#AEBCA2';
    var t = Core.clamp(control / 100, 0, 1);
    var lo = [207, 179, 145], hi = [177, 102, 91];
    var c = lo.map(function (v, i) { return Math.round(v + (hi[i] - v) * t); });
    return 'rgb(' + c.join(',') + ')';
  }

  M.render = function (opts) {
    opts = opts || {};
    var dists = opts.districts || [];
    var selected = opts.selected || null;
    var units = opts.units || [];
    var italyInKastav = kastavUnderItaly(opts.date);
    if (!GEO) return svg('svg', { viewBox: '0 0 10 10' });

    var xs = [], ys = [];
    GEO.features.forEach(function (f) {
      f.geometry.coordinates.forEach(function (poly) {
        poly.forEach(function (r) { r.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
      });
    });
    var pad = 3000;
    var vb = [Math.min.apply(null, xs) - pad, Math.min.apply(null, ys) - pad,
      (Math.max.apply(null, xs) - Math.min.apply(null, xs)) + pad * 2,
      (Math.max.apply(null, ys) - Math.min.apply(null, ys)) + pad * 2];
    M.baseBox = vb;
    var cx = M.center ? M.center[0] : vb[0] + vb[2] / 2;
    var cy = M.center ? M.center[1] : vb[1] + vb[3] / 2;
    var vw = vb[2] / M.zoom, vh = vb[3] / M.zoom;
    var zoomBox = [cx - vw / 2, cy - vh / 2, vw, vh];
    var root = svg('svg', { viewBox: zoomBox.join(' '), preserveAspectRatio: 'xMidYMid meet', style: 'max-height:56vh' });
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', '阜姆与周边地点示意地图；加减按钮或滚轮缩放，回车选择地区');

    var defs = svg('defs');
    var paper = svg('pattern', { id: 'map-paper-fleck', patternUnits: 'userSpaceOnUse', width: 410, height: 350 });
    [[23, 37, 11], [139, 95, 6], [302, 28, 8], [70, 221, 5], [271, 279, 10], [382, 179, 5]].forEach(function (dot) {
      paper.appendChild(svg('circle', { cx: dot[0], cy: dot[1], r: dot[2], fill: '#554632', opacity: '.22' }));
    });
    defs.appendChild(paper);
    var seaEtching = svg('pattern', { id: 'map-sea-etching', patternUnits: 'userSpaceOnUse', width: 1300, height: 740 });
    ['M40,130q110,-55 240,0t240,0', 'M590,410q150,-56 300,0t300,0', 'M120,610q130,-48 260,0t260,0'].forEach(function (d) {
      seaEtching.appendChild(svg('path', { d: d, fill: 'none', stroke: '#56757B', 'stroke-width': '9', opacity: '.23' }));
    });
    defs.appendChild(seaEtching);
    var landHatch = svg('pattern', { id: 'map-land-engraving', patternUnits: 'userSpaceOnUse', width: 360, height: 360 });
    landHatch.appendChild(svg('path', { d: 'M-55,115l170,-170M95,360l265,-265M300,415l115,-115',
      fill: 'none', stroke: '#665A43', 'stroke-width': '8', opacity: '.18' }));
    defs.appendChild(landHatch);
    var grain = svg('filter', { id: 'map-paper-grain', x: '0', y: '0', width: '100%', height: '100%' });
    grain.appendChild(svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '.018', numOctaves: '3', seed: '8', stitchTiles: 'stitch' }));
    defs.appendChild(grain);

    var coast = COAST.shoreline;
    var edgeTop = vb[1] - 4000, edgeLeft = vb[0] - 4000, edgeRight = vb[0] + vb[2] + 4000;
    var landPath = 'M' + edgeLeft + ',' + edgeTop + 'L' + edgeRight + ',' + edgeTop +
      'L' + edgeRight + ',' + coast[coast.length - 1][1] +
      'L' + coast[coast.length - 1][0] + ',' + coast[coast.length - 1][1];
    for (var ci = coast.length - 2; ci >= 0; ci--) landPath += 'L' + coast[ci][0] + ',' + coast[ci][1];
    landPath += 'L' + edgeLeft + ',' + coast[0][1] + 'Z';
    var landClip = svg('clipPath', { id: 'map-land-clip' });
    landClip.appendChild(svg('path', { d: landPath }));
    COAST.islets.forEach(function (ring) { landClip.appendChild(svg('path', { d: ringPath(ring) })); });
    defs.appendChild(landClip);
    root.appendChild(defs);

    // The sea and surrounding occupation fields are separate, non-interactive
    // layers. The shore is formed solely by their fill boundary: no coast stroke.
    root.appendChild(svg('rect', { x: edgeLeft, y: edgeTop, width: edgeRight - edgeLeft,
      height: vb[3] + 8000, fill: '#C1D2D2', 'pointer-events': 'none' }));
    root.appendChild(svg('rect', { x: edgeLeft, y: edgeTop, width: edgeRight - edgeLeft,
      height: vb[3] + 8000, fill: 'url(#map-sea-etching)', 'pointer-events': 'none' }));
    root.appendChild(svg('path', { d: landPath, fill: italyInKastav ? '#D5BA98' : '#BFC8B0', 'pointer-events': 'none' }));
    COAST.islets.forEach(function (ring) {
      root.appendChild(svg('path', { d: ringPath(ring), fill: italyInKastav ? '#D5BA98' : '#BFC8B0', 'pointer-events': 'none' }));
    });
    var fields = svg('g', { 'class': 'context-territories', 'clip-path': 'url(#map-land-clip)', 'pointer-events': 'none' });
    if (italyInKastav) {
      var river = GEO.river[0].concat(GEO.river[1].slice(1));
      var riverMouth = river[river.length - 1], mouthIndex = 0, mouthDistance = Infinity;
      coast.forEach(function (p, index) {
        var distance = (p[0] - riverMouth[0]) * (p[0] - riverMouth[0]) + (p[1] - riverMouth[1]) * (p[1] - riverMouth[1]);
        if (distance < mouthDistance) { mouthIndex = index; mouthDistance = distance; }
      });
      fields.appendChild(svg('path', { 'class': 'context-territory context-territory--shs',
        d: ringPath([[river[0][0], edgeTop]].concat(river, coast.slice(mouthIndex),
          [[edgeRight, coast[coast.length - 1][1]], [edgeRight, edgeTop]])),
        fill: '#BFC8B0' }));
    } else {
      var occupationEdge = CONTEXT.rapalloWestEdge.map(function (p) { return project(p[0], p[1]); });
      var last = occupationEdge[occupationEdge.length - 1], nearest = coast[0], nearestIndex = 0, nearestDistance = Infinity;
      coast.forEach(function (p, index) {
        var distance = (p[0] - last[0]) * (p[0] - last[0]) + (p[1] - last[1]) * (p[1] - last[1]);
        if (distance < nearestDistance) { nearest = p; nearestIndex = index; nearestDistance = distance; }
      });
      occupationEdge[occupationEdge.length - 1] = nearest;
      fields.appendChild(svg('path', { 'class': 'context-territory context-territory--italy',
        d: ringPath([[edgeLeft, edgeTop], [occupationEdge[0][0], edgeTop]]
          .concat(occupationEdge, coast.slice(0, nearestIndex).reverse(), [[edgeLeft, coast[0][1]]])),
        fill: '#D5BA98' }));
    }
    root.appendChild(fields);
    if (!italyInKastav) root.appendChild(svg('path', { 'class': 'context-control-line',
      d: occupationEdge.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(''),
      fill: 'none', stroke: '#665745', 'stroke-width': '22', 'stroke-dasharray': '95 62',
      'pointer-events': 'none' }));

    var dmap = {};
    dists.forEach(function (d) { dmap[d.id] = d; });

    GEO.features.forEach(function (f) {
      var p = f.properties, d = dmap[p.id];
      if (!d) return;
      var g = svg('g', { 'class': 'mp' + (selected === p.id ? ' is-sel' : ''), 'data-id': p.id,
        tabindex: '0', role: 'button', 'aria-label': d.zh + '，控制 ' + Math.round(d.control) + '，动荡 ' + Math.round(d.agitation) });
      var ti = svg('title');
      ti.textContent = d.zh + ' / ' + d.it + ' — 控制 ' + Math.round(d.control) + ' · 动荡 ' + Math.round(d.agitation);
      g.appendChild(ti);
      var fill = p.id === 'srdoci' && italyInKastav ? '#D5BA98' : controlColor(d.control, d.status);
      f.geometry.coordinates.forEach(function (poly) {
        poly.forEach(function (r) {
          g.appendChild(svg('path', {
            d: ringPath(r), fill: fill,
            'fill-opacity': '.94',
            stroke: '#594D3D', 'stroke-width': '26'
          }));
        });
      });
      root.appendChild(g);
    });

    root.appendChild(svg('rect', { x: edgeLeft, y: edgeTop, width: edgeRight - edgeLeft,
      height: vb[3] + 8000, fill: 'url(#map-land-engraving)',
      'clip-path': 'url(#map-land-clip)', 'pointer-events': 'none' }));
    root.appendChild(svg('rect', { x: edgeLeft, y: edgeTop, width: edgeRight - edgeLeft,
      height: vb[3] + 8000, fill: 'url(#map-paper-fleck)', 'pointer-events': 'none' }));
    root.appendChild(svg('rect', { x: edgeLeft, y: edgeTop, width: edgeRight - edgeLeft,
      height: vb[3] + 8000, filter: 'url(#map-paper-grain)', opacity: '.14', 'pointer-events': 'none' }));

    if (M.zoom >= 1.25) GEO.features.forEach(function (f) {
      var d = dmap[f.properties.id];
      if (!d) return;
      var points = [];
      f.geometry.coordinates.forEach(function (poly) { poly.forEach(function (ring) { ring.forEach(function (p) { points.push(p); }); }); });
      if (!points.length) return;
      var lx = points.reduce(function (a, p) { return a + p[0]; }, 0) / points.length;
      var ly = points.reduce(function (a, p) { return a + p[1]; }, 0) / points.length;
      var label = svg('text', { x: lx, y: ly, 'text-anchor': 'middle', fill: '#493E32',
        'font-size': '170', 'font-family': 'Georgia, serif', 'letter-spacing': '8',
        stroke: '#E9DCC0', 'stroke-width': '18', 'paint-order': 'stroke', 'pointer-events': 'none' });
      label.textContent = Core.sub(d) || d.zh; root.appendChild(label);
    });

    if (GEO.river) {
      GEO.river.forEach(function (seg) {
        var d = seg.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ');
        root.appendChild(svg('path', {
          d: d, fill: 'none', stroke: '#77959A', 'stroke-width': '38',
          'stroke-linecap': 'round', 'pointer-events': 'none'
        }));
      });
    }

    CONTEXT.labels.forEach(function (entry) {
      var pos = project(entry.lon, entry.lat);
      var atSea = entry.id === 'adriatic';
      var name = svg('text', { 'class': 'context-label context-label--' + entry.id,
        x: pos[0], y: pos[1], 'text-anchor': 'middle', 'pointer-events': 'none',
        fill: atSea ? '#4B6B74' : '#302A22', opacity: atSea ? '.82' : '.9',
        'font-size': atSea ? '525' : (entry.id === 'shs' ? '650' : '930'),
        'font-family': 'Georgia, Times New Roman, serif', 'font-style': atSea ? 'italic' : 'normal',
        'letter-spacing': atSea ? '54' : '48' });
      name.textContent = entry.text;
      root.appendChild(name);
    });

    [
      ['Castua', 14.349, 45.372], ['Mattuglie', 14.321, 45.363],
      ['Preluca', 14.374, 45.341], ['Abbazia', 14.308, 45.337],
      ['Baccari', 14.536, 45.309], ['Grobnico', 14.469, 45.377]
    ].forEach(function (place) {
      var pos = project(place[1], place[2]);
      var label = svg('g', { 'class': 'context-place', 'pointer-events': 'none' });
      label.appendChild(svg('circle', { cx: pos[0], cy: pos[1], r: 32, fill: '#584D3C' }));
      var name = svg('text', { x: pos[0] + 95, y: pos[1] + 35, fill: '#594C39',
        'font-size': '230', 'font-family': 'Georgia, serif', 'font-style': 'italic', 'letter-spacing': '10' });
      name.textContent = place[0]; label.appendChild(name); root.appendChild(label);
    });

    (W.MARKERS || []).forEach(function (m) {
      var xy = project(m.lon, m.lat);
      var col = m.kind === 'dispute' ? '#A67538'
        : (m.kind === 'industry' ? '#94713F' : (m.kind === 'border' ? '#A45A4E'
          : (m.kind === 'memorial' ? '#806941' : '#655C49')));
      var g = svg('g', { 'class': 'mk' });
      var ti = svg('title'); ti.textContent = m.zh + ' · ' + m.it; g.appendChild(ti);
      if (m.kind === 'dispute') {
        g.appendChild(svg('circle', { cx: xy[0], cy: xy[1], r: 210, fill: 'rgba(166,117,56,.10)', stroke: col, 'stroke-width': '18', 'stroke-dasharray': '46 36' }));
        g.appendChild(svg('circle', { cx: xy[0], cy: xy[1], r: 80, fill: col, stroke: '#4C4033', 'stroke-width': '12' }));
      } else {
        var rr = m.kind === 'industry' ? 58 : (m.kind === 'border' ? 74 : 40);
        g.appendChild(svg('circle', { cx: xy[0], cy: xy[1], r: rr, fill: col, stroke: '#4C4033', 'stroke-width': 12 }));
      }
      root.appendChild(g);
    });

    /* Armed garrison points inside the city */
    units.forEach(function (u) {
      var xy = project(u.lon, u.lat);
      var col = u.allied ? '#65868F' : '#9D6B4F';
      var w = 430, hgt = 500;
      var g = svg('g', { 'class': 'mk unit-mk' });
      var ti = svg('title'); ti.textContent = u.zh + (u.count == null ? ' · 位置示意，人数未考证' : ' · 游戏兵力 ' + Core.fmt(u.count)); g.appendChild(ti);
      g.appendChild(svg('rect', {
        x: xy[0] - w / 2, y: xy[1] - hgt / 2, width: w, height: hgt,
        fill: '#F2E7D0', stroke: col, 'stroke-width': '40'
      }));
      var glyph = u.kind === 'naval'
        ? 'M' + (xy[0] - w * .32) + ',' + (xy[1] - hgt * .04) + 'h' + (w * .64) + 'l-' + (w * .1) + ',' + (hgt * .2) + 'h-' + (w * .44) + 'z'
        : u.kind === 'alpine'
          ? 'M' + (xy[0] - w * .3) + ',' + (xy[1] + hgt * .2) + 'l' + (w * .3) + ',-' + (hgt * .4) + 'l' + (w * .3) + ',' + (hgt * .4) + 'z'
          : 'M' + (xy[0] - w * .28) + ',' + (xy[1] + hgt * .2) + 'v-' + (hgt * .34) + 'h' + (w * .56) + 'v' + (hgt * .34) + 'z';
      g.appendChild(svg('path', { d: glyph, fill: u.allied ? '#52727D' : '#87543F' }));
      var t = svg('text', {
        x: xy[0], y: xy[1] + 165, 'text-anchor': 'middle',
        fill: '#433B31', 'font-size': '235', 'font-family': 'var(--font-mono)', 'font-weight': 700
      });
      t.textContent = u.count == null ? '·' : (u.count >= 1000 ? (u.count / 1000).toFixed(1) + 'k' : String(u.count));
      g.appendChild(t);
      g.appendChild(svg('path', { d: 'M' + xy[0] + ',' + (xy[1] + hgt / 2) + 'l95,165h-190z', fill: col }));
      root.appendChild(g);
    });

    /* Scale bar and north arrow */
    var ex0 = Math.min.apply(null, xs), ex1 = Math.max.apply(null, xs);
    var ey0 = Math.min.apply(null, ys), ey1 = Math.max.apply(null, ys);
    var sx = ex0 + 500, sy = ey1 + 400;
    root.appendChild(svg('line', { x1: sx, y1: sy, x2: sx + 1000, y2: sy, stroke: '#544939', 'stroke-width': '30' }));
    root.appendChild(svg('line', { x1: sx, y1: sy - 80, x2: sx, y2: sy + 80, stroke: '#544939', 'stroke-width': '27' }));
    root.appendChild(svg('line', { x1: sx + 1000, y1: sy - 80, x2: sx + 1000, y2: sy + 80, stroke: '#544939', 'stroke-width': '27' }));
    var sc = svg('text', { x: sx + 500, y: sy - 170, 'text-anchor': 'middle', fill: '#544939', 'font-size': '260', 'font-family': 'Georgia, serif' });
    sc.textContent = '1 km'; root.appendChild(sc);

    var nx = ex1 - 700, ny = ey0 + 1000;
    root.appendChild(svg('circle', { cx: nx, cy: ny, r: 340, fill: 'rgba(242,231,208,.75)', stroke: '#65543E', 'stroke-width': '21' }));
    root.appendChild(svg('path', { d: 'M' + nx + ',' + (ny - 260) + 'L' + (nx - 70) + ',' + ny + 'L' + nx + ',' + (ny - 30) + 'L' + (nx + 70) + ',' + ny + 'Z', fill: '#65543E' }));
    var nt = svg('text', { x: nx, y: ny - 430, 'text-anchor': 'middle', fill: '#574935', 'font-size': '310', 'font-family': 'Georgia, serif', 'font-weight': 700 });
    nt.textContent = 'N'; root.appendChild(nt);

    return root;
  };

  M.legend = function (date) {
    var el = Core.h('div', { class: 'maplegend' });
    function add(color, zh) {
      el.appendChild(Core.h('span', { class: 'maplegend__i' }, [
        Core.h('span', { class: 'maplegend__sw', style: { background: color } }),
        Core.h('span', {}, zh)
      ]));
    }
    add('#B87668', '阜姆军团控制');
    add('#D5BA98', kastavUnderItaly(date) ? '意大利占领区（含卡斯塔夫）' : '意大利控制区');
    add('#BFC8B0', '南斯拉夫（S.H.S.）控制区');
    add('#C1D2D2', '亚德里亚海');
    add('#77959A', '埃内奥河');
    add('#A67538', '争议地');
    add('#9D6B4F', '军团驻点');
    add('#65868F', '协约国警备点');
    return el;
  };

  return M;
});
