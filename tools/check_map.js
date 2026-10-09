/* Camera limits, historical date transitions and retained district geometry. */
'use strict';
const assert = require('node:assert/strict');
require('../src/lib/core.js');
require('../src/game/data/world.js');
global.window = {};
require('../src/map/data/districts.js');
const M = require('../src/legacy/ui/lib/map.js');
const geo = M.GEO;
assert.deepEqual(geo.features.map(f => f.id).sort(), Fiume.World.DISTRICTS.map(d => d.id).sort());
const names = geo.features.flatMap(f => f.properties.neighbourhoods);
assert.equal(names.length, new Set(names).size, 'Every modern patch has only one game owner');
for (const f of geo.features) {
  assert.equal(f.geometry.coordinates.length, f.id === 'porto' ? 2 : 1, `${f.id}: unexpected detached patch`);
  const point = [f.properties.cx, f.properties.cy];
  function inside(ring) {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > point[1]) !== (b[1] > point[1]) &&
          point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
    }
    return hit;
  }
  assert(f.geometry.coordinates.some(poly => inside(poly[0]) && !poly.slice(1).some(inside)), `${f.id}: label outside district`);
}
M.baseBox = [0, 0, 4000, 3000];
M.resetZoom();
const initial = M.viewBox();
assert.equal(M.zoomAt(.5, .2, .8), false, 'Initial scale cannot zoom out');
assert.deepEqual(M.viewBox(), initial);
M.zoomAt(2, .6, .4);
const zoomed = M.viewBox();
assert(Math.abs(zoomed[0] + zoomed[2] * .6 - 2400) < 1e-6, 'Zoom retains pointer anchor X');
assert(Math.abs(zoomed[1] + zoomed[3] * .4 - 1200) < 1e-6, 'Zoom retains pointer anchor Y');
M.panTo(-1e9, 1e9);
const dragged = M.viewBox();
assert(dragged[0] >= -480 && dragged[1] + dragged[3] <= 3360, 'Dragging stays within painted overscan');
M.zoomAt(100, .5, .5);
assert.equal(M.zoom, 3.2);
M.zoomAt(.0001, .5, .5);
assert.equal(M.zoom, 1);
M.panTo(1700, 1400);
assert.notDeepEqual(M.viewBox(), initial, 'Dragging remains available at minimum zoom');
M.resetZoom();
assert.deepEqual(M.viewBox(), initial, 'Reset restores initial camera');
assert.equal(M.occupation('srdoci', {y:1921,m:5,d:25}), 'italy');
assert.equal(M.occupation('srdoci', {y:1921,m:5,d:26}), null);
for (const id of ['susak','tersatto','pecine']) {
  assert.equal(M.occupation(id, {y:1923,m:3,d:2}), 'italy');
  assert.equal(M.occupation(id, {y:1923,m:3,d:3}), null);
}
assert.equal(M.occupation('centro', {y:1919,m:9,d:12}), null);
delete global.window;
console.log('Map checks passed: camera, 13 district geometries, occupation dates.');
