// Load the deterministic simulation in dependency order. No UI module is
// imported here: game rules can run without React or the browser view layer.
import '../lib/core.js';
import '../lib/i18n.js';
import './data/world.js';
import './data/parties.js';
import './data/factions.js';
import './data/meta.js';
import './engine/rules.js';
import './registries/contentRegistry';
import './engine/reducers.js';
import './engine/selectors.js';

export const game = (globalThis as typeof globalThis & { Fiume: Record<string, any> }).Fiume;
if (!game?.Engine || !game?.Sel) throw new Error('Fiume game modules failed to load');
