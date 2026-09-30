// Content contracts for the existing simulation engine. State and effect patches
// are interpreted by the legacy reducers, so their nested shape remains flexible.
export type LocalizedText = { zh: string; it: string };
export type SimulationState = any;
export type EffectPatch = Record<string, unknown>;
export type Effect = EffectPatch | ((state: SimulationState) => EffectPatch);

export interface CardOption {
  id: string;
  text: LocalizedText;
  /** The line under the option: what it means, not what it does. Optional;
      when absent the renderer falls back to the Italian of the option text. */
  subtitle?: LocalizedText;
  preview: string[];
  effect: Effect;
  require?: (state: SimulationState) => boolean;
  requireText?: LocalizedText;
}

export interface Card {
  id: string;
  deck: 'azione' | 'governo' | 'partito';
  forces?: string[];
  ministry?: string;
  name: LocalizedText;
  /** A one-line frame for the card, drawn under its name. */
  subtitle: LocalizedText;
  text: LocalizedText;
  /** Optional while the resource layer is unbuilt. Readers must guard. */
  cost?: { ap: number; funds?: number; arms?: number };
  /** Turns before the card can be drawn again. A turn is presented as a
      week, so this is a number of weeks. Defaults to 4. */
  cooldown?: number;
  require?: (state: SimulationState) => boolean;
  requireText?: LocalizedText;
  options: CardOption[];
}

export interface Advisor {
  id: string;
  zh: string;
  it: string;
  faction: string | null;
  bio: string;
  action: LocalizedText;
  effect: EffectPatch;
  require?: (state: SimulationState) => boolean;
}

export interface EventOption {
  id: string;
  text: LocalizedText;
  preview?: Array<string | { zh: string; label: string }>;
  effect: Effect;
  condition?: (state: SimulationState) => boolean;
  requireText?: LocalizedText;
}

export interface GameEvent {
  id: string;
  date?: { y: number; m: number; d?: number };
  title: LocalizedText;
  body: LocalizedText;
  opening?: boolean;
  once?: boolean;
  repeatable?: boolean;
  cooldown?: number;
  chain?: boolean;
  superEvent?: boolean;
  condition?: (state: SimulationState) => boolean;
  options: EventOption[];
}
