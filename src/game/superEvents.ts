import type { LocalizedText } from './content/types';

/** Presentation only. These entries never enter the simulation event registry. */
export interface SuperEvent {
  id: string;
  triggerEvent: string;
  title: LocalizedText;
  description: LocalizedText;
  attribution: LocalizedText;
  option: LocalizedText;
  image: string;
  imageCaption: LocalizedText;
  tone: 'march' | 'siege';
}

export const SUPER_EVENTS: readonly SuperEvent[] = [
  {
    id: 'super_marcia_fiume',
    triggerEvent: 'ev_1919_09_marcia',
    title: { zh: '进军阜姆', it: 'La marcia su Fiume' },
    description: {
      zh: '“来自阜姆的意大利人！在疯狂而卑鄙的世界里，阜姆今天是自由的标志;在疯狂而卑鄙的世界里，只有一个真理：这就是阜姆;只有一种爱：这就是阜姆！阜姆就像一座明亮的灯塔，在一片萧条的海洋中闪耀着光芒......”',
      it: '«Italiani di Fiume! In un mondo folle e vile, Fiume è oggi il simbolo della libertà; in un mondo folle e vile, vi è una sola verità: Fiume; vi è un solo amore: Fiume! Fiume è come un faro luminoso che risplende in un mare desolato…»',
    },
    attribution: { zh: '——邓南遮', it: '— Gabriele D’Annunzio' },
    option: { zh: '阜姆，或死亡！', it: 'Fiume o morte!' },
    image: 'img/History/foto_fiume.jpg',
    imageCaption: { zh: '邓南遮与军团 · 历史照片', it: "D’Annunzio e i legionari · fotografia storica" },
    tone: 'march',
  },
  {
    id: 'super_italian_attack',
    triggerEvent: 'ev_natale',
    title: { zh: '意大利进攻阜姆', it: "L’Italia attacca Fiume" },
    description: {
      zh: '“当我昨日已准备好牺牲并已安慰我的灵魂时，今天我却要动用所有武器来保卫我的生命。在我的战争中，我曾微笑着百次献出它。”',
      it: '«Se ieri ero pronto al sacrificio e avevo confortato la mia anima, oggi devo usare tutte le armi per difendere la mia vita. Nella mia guerra l’ho offerta cento volte, sorridendo.»',
    },
    attribution: { zh: '——邓南遮《致意大利人书》', it: '— Gabriele D’Annunzio, Lettera agli Italiani' },
    option: { zh: '命运已至。', it: 'Il momento è giunto.' },
    image: 'img/History/rijeka_1900.jpg',
    imageCaption: { zh: '阜姆港景 · 历史明信片', it: 'Il porto di Fiume · cartolina storica' },
    tone: 'siege',
  },
];

interface SuperEventProgress {
  pending: string[];
  acknowledged: string[];
}

interface PresentationState {
  currentEvent?: string | null;
  eventHistory?: string[];
  ending?: unknown;
  superEvents?: SuperEventProgress;
}

const known = (id: string) => SUPER_EVENTS.some(event => event.id === id);
const unique = (ids: string[]) => [...new Set(ids.filter(known))];

/** Attach saveable presentation metadata while leaving all game fields intact. */
export function syncSuperEvents<T extends PresentationState>(state: T): T {
  // Existing saves do not replay historical moments whose ordinary event has
  // already been resolved. An active, unanswered event can still show its frame.
  const acknowledged = unique(state.superEvents?.acknowledged ?? SUPER_EVENTS
    .filter(event => state.eventHistory?.includes(event.triggerEvent)).map(event => event.id));
  const pending = unique(state.superEvents?.pending ?? []).filter(id => !acknowledged.includes(id));
  if (!state.ending) {
    for (const event of SUPER_EVENTS) {
      if (state.currentEvent === event.triggerEvent && !acknowledged.includes(event.id) && !pending.includes(event.id)) {
        pending.push(event.id);
      }
    }
  }
  return { ...state, superEvents: { acknowledged, pending: state.ending ? [] : pending } };
}

export function currentSuperEvent(state: PresentationState | null): SuperEvent | null {
  if (!state || state.ending) return null;
  return SUPER_EVENTS.find(event => event.id === state.superEvents?.pending?.[0]) ?? null;
}

/** Acknowledgement has no effect patch and does not call RESOLVE_EVENT. */
export function acknowledgeSuperEvent<T extends PresentationState>(state: T): T {
  const current = currentSuperEvent(state);
  if (!current) return state;
  return { ...state, superEvents: {
    pending: state.superEvents!.pending.slice(1),
    acknowledged: unique([...state.superEvents!.acknowledged, current.id]),
  } };
}
