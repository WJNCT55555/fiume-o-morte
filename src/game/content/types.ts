// Content contracts for the existing simulation engine. State and effect patches
// are interpreted by the legacy reducers, so their nested shape remains flexible.
export type LocalizedText = { zh: string; it: string };
export type SimulationState = any;
export type EffectPatch = Record<string, unknown>;
export type Effect = EffectPatch | ((state: SimulationState) => EffectPatch);

export interface CardOption {
  id: string;
  text: LocalizedText;
  /** The option's second line. Only options carry one; cards do not. */
  subtitle?: LocalizedText;
  /** Legacy authored hint. The UI computes its preview from the settled effect. */
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
  text: LocalizedText;
  /** Optional while the resource layer is unbuilt. Readers must guard. */
  cost?: { ap: number; funds?: number; arms?: number };
  /** Turns before the card can be drawn again. A turn is half a month, so
      this counts half-months. Defaults to 4. */
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
  /** Path under `public/`, e.g. `img/Portrait/Portrait_mario_carli.png`. The
      data holds a plain project-relative path; each UI layer turns it into a
      served URL, because the Vite base is only known to the bundler.
      Left out when no likeness of the person is on file — the row then shows
      the initial-letter plate instead of borrowing another man's face. */
  portrait?: string;
  require?: (state: SimulationState) => boolean;
}

export interface EventOption {
  id: string;
  text: LocalizedText;
  /** The option's second line, drawn under its text. */
  subtitle?: LocalizedText;
  /** Legacy authored hint. The UI computes its preview from the settled effect. */
  preview?: Array<string | { zh: string; label: string }>;
  effect: Effect;
  condition?: (state: SimulationState) => boolean;
  requireText?: LocalizedText;
}

export interface EventResult {
  /** A heading over the tally, e.g. 计票结果. */
  title?: LocalizedText;
  /** A line of prose under the heading. */
  body?: LocalizedText;
  /** The tally itself, one row per entry. */
  rows?: { label: LocalizedText; value: string; tone?: 'good' | 'bad' }[];
  /** A closing line, set apart. */
  note?: LocalizedText;
  /** A chamber this result seats, drawn as a hemicycle above the rows. Use it
      wherever the point of the count is the shape of the chamber rather than a
      list of figures — an election above all, where "who can outvote whom" is
      not visible in a column of numbers. The view renders whatever is here; the
      engine stores no chart. */
  seats?: {
    id: string;
    /** Party name. A `{zh, it}` node, because the event's `result` hook has no
        access to the active locale — the view resolves it. */
    name: LocalizedText;
    seats: number;
    color: string;
  }[];
  /** Caption under the chamber, e.g. the size and the majority it implies. */
  seatsCaption?: LocalizedText;
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
  /** Legacy simulation priority flag; independent of the super-event UI layer. */
  superEvent?: boolean;
  condition?: (state: SimulationState) => boolean;
  /** A tally shown under the body, worked out when the event opens. `body` is
      fixed prose; anything that has to be counted — seats, votes, a division —
      belongs here rather than written into the text. The second argument is the
      engine, so the figure can be computed live instead of stored. */
  result?: (state: SimulationState, api?: any) => EventResult | null;
  options: EventOption[];
}
