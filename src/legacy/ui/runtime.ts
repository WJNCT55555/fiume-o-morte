// The React compatibility view depends on the game runtime, never vice versa.
import '../../game/runtime';
import '../../map/data/districts.js';
import '../../map/data/coast.js';
import '../../map/data/context.js';
import './lib/ornaments.js';
import './lib/charts.js';
import './lib/map.js';
import './components/common.js';
import './components/sidepanel.js';
import './components/eventboard.js';
import './views.js';

export const legacyUI = (globalThis as typeof globalThis & { Fiume: Record<string, any> }).Fiume;
if (!legacyUI?.Views) throw new Error('Fiume view modules failed to load');
