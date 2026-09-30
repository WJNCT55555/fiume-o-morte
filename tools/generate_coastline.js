// Generate the local, metre-based coastline from an OSM Overpass `out geom`
// export. Keep the derived geometry in src so the map also works offline.
// Query: way["natural"="coastline"](45.28,14.25,45.43,14.59);out geom;
const fs = require('node:fs');
const path = require('node:path');

const input = process.argv[2] || path.join(__dirname, 'data', 'osm-coastline.json');
const output = path.join(__dirname, '..', 'src', 'map', 'data', 'coast.js');
const raw = JSON.parse(fs.readFileSync(input, 'utf8'));
const ways = raw.elements.filter(e => e.type === 'way' && e.geometry?.length > 1)
  .map(e => e.geometry.map(p => [p.lon, p.lat]));
const key = p => p[0].toFixed(7) + ',' + p[1].toFixed(7);
const chains = [];

while (ways.length) {
  const chain = ways.pop();
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = ways.length - 1; i >= 0; i--) {
      const segment = ways[i];
      const start = key(chain[0]), end = key(chain[chain.length - 1]);
      if (key(segment[0]) === end) chain.push(...segment.slice(1));
      else if (key(segment[segment.length - 1]) === end) chain.push(...segment.slice(0, -1).reverse());
      else if (key(segment[segment.length - 1]) === start) chain.unshift(...segment.slice(0, -1));
      else if (key(segment[0]) === start) chain.unshift(...segment.slice(1).reverse());
      else continue;
      ways.splice(i, 1);
      changed = true;
    }
  }
  chains.push(chain);
}

const lon0 = 14.4135, lat0 = 45.3477;
const cosLat = Math.cos(lat0 * Math.PI / 180);
const project = p => [(p[0] - lon0) * 111320 * cosLat, -(p[1] - lat0) * 110574];
const distanceToLine = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = dx || dy ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  let index = -1, maximum = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToLine(points[i], points[0], points[points.length - 1]);
    if (d > maximum) { maximum = d; index = i; }
  }
  if (maximum <= tolerance) return [points[0], points[points.length - 1]];
  return simplify(points.slice(0, index + 1), tolerance).slice(0, -1)
    .concat(simplify(points.slice(index), tolerance));
}

const result = chains.map(chain => simplify(chain.map(project), 9)
  .map(p => p.map(n => Math.round(n * 10) / 10)));
result.sort((a, b) => b.length - a.length);
if (result.length < 1 || result[0].length < 300) throw new Error('Incomplete OSM coastline extract');
const data = {
  meta: {
    source: '© OpenStreetMap contributors (ODbL), natural=coastline, Overpass out geom',
    osmTimestamp: raw.osm3s?.timestamp_osm_base || '',
    origin: [lon0, lat0],
    toleranceMetres: 9
  },
  shoreline: result[0],
  islets: result.slice(1)
};
fs.writeFileSync(output, 'window.FIUME_GEO_COAST = ' + JSON.stringify(data) + ';\n');
console.log('Coastline chains:', chains.length, 'output vertices:', result.map(r => r.length).join(', '));
