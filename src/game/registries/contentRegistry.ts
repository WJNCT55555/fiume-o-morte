import { ACTION_AFFAIRS } from '../action_affairs';
import { GOVERNMENT_AFFAIRS } from '../government_affairs';
import { PARTY_AFFAIRS } from '../party_affairs';
import { INITIAL_ADVISORS } from '../advisors';
import { ALL_EVENTS } from '../events';

// Keep source order: drawing, scheduled events, and seeded replays depend on it.
export const ALL_CARDS = [...ACTION_AFFAIRS, ...GOVERNMENT_AFFAIRS, ...PARTY_AFFAIRS];
export { INITIAL_ADVISORS, ALL_EVENTS };

function assertUniqueIds(label: string, entries: ReadonlyArray<{ id: string }>) {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) throw new Error(`Duplicate ${label} ID: ${entry.id}`);
    seen.add(entry.id);
  }
}

assertUniqueIds('card', ALL_CARDS);
assertUniqueIds('advisor', INITIAL_ADVISORS);
assertUniqueIds('event', ALL_EVENTS);

// Adapter for the simulation engine while its reducers remain JavaScript.
const fiume = (globalThis as typeof globalThis & { Fiume?: Record<string, any> }).Fiume;
if (!fiume?.World) throw new Error('Load Fiume.World before the content registry');
fiume.World.ADVISORS = INITIAL_ADVISORS;
fiume.Cards = ALL_CARDS;
fiume.Events = ALL_EVENTS;
