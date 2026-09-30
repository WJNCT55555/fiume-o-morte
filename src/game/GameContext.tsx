import { createContext, useContext, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { game } from './runtime';

export interface ViewState {
  screen: 'start' | 'game' | 'ending';
  tab: string;
  mapMode: string;
  district: string;
  modal: string | null;
  deck: string | null;
  scenario: string;
  difficulty: string;
  force: string;
}

interface Snapshot {
  state: any | null;
  ui: ViewState;
  notice: { kind: string; text: string; id: number } | null;
  resume: any | null;
}

interface GameStore {
  getSnapshot: () => Snapshot;
  subscribe: (listener: () => void) => () => void;
  refresh: () => void;
  actions: Record<string, (...args: any[]) => void>;
}

const GameContext = createContext<GameStore | null>(null);

function createGameStore(): GameStore {
  const { Engine, Sel, Core, I18N, World } = game;
  const auto = Sel.Save.load('auto');
  let snapshot: Snapshot = {
    state: null,
    ui: { screen: 'start', tab: 'azioni', mapMode: 'adriatic', district: 'centro',
      modal: null, deck: null, scenario: '1919-09', difficulty: 'open', force: 'LEG' },
    notice: null,
    resume: auto && auto.date && !auto.ending ? auto : null,
  };
  const listeners = new Set<() => void>();
  const publish = (next: Snapshot) => { snapshot = next; listeners.forEach(listener => listener()); };
  const change = (patch: Partial<Snapshot>, uiPatch?: Partial<ViewState>) =>
    publish({ ...snapshot, ...patch, ui: { ...snapshot.ui, ...uiPatch } });
  const refresh = () => publish({ ...snapshot });
  const notice = (kind: string, text: string) => change({ notice: { kind, text, id: Date.now() } });
  const dispatch = (action: any) => {
    if (!snapshot.state) return;
    const result = Engine.dispatch(snapshot.state, action);
    if (!result) { refresh(); return; }
    const state = result.state;
    Sel.Save.save(state, 'auto');
    const uiPatch: Partial<ViewState> = state.ending ? { screen: 'ending', modal: null } : {};
    if (!state.ending && state.currentEvent && snapshot.ui.modal == null) uiPatch.modal = 'event';
    change({ state }, uiPatch);
    if (result.toast) notice(result.toast.kind, Core.L(result.toast.text));
  };
  const actions: Record<string, (...args: any[]) => void> = {
    setScenario: (scenario: string) => change({}, { scenario }),
    setDifficulty: (difficulty: string) => change({}, { difficulty }),
    setForce: (force: string) => { if (World.PARTY_BY_ID[force]?.player) change({}, { force }); },
    setTab: (tab: string) => change({}, { tab }),
    setMapMode: (mapMode: string) => change({}, { mapMode }),
    selectDistrict: (district: string) => change({}, { district, mapMode: 'fiume' }),
    start: () => {
      const state = Engine.createState(snapshot.ui.scenario, snapshot.ui.difficulty, Date.now() % 100000 + 1, snapshot.ui.force);
      change({ state, resume: null }, { screen: 'game', tab: 'azioni', modal: state.currentEvent ? 'event' : null });
      notice('ok', state.playerForce === 'LEG' ? I18N.t('toast.start') :
        I18N.t('toast.start.party', { name: World.PARTY_BY_ID[state.playerForce].zh }));
    },
    restart: () => change({ state: null }, { screen: 'start', modal: null }),
    openDeck: (deck: string) => change({}, { deck, modal: 'deck' }),
    closeDeck: () => change({}, { deck: null, modal: null }),
    drawCard: (cardId: string) => { dispatch({ type: 'DRAW_CARD', cardId }); change({}, { deck: null, modal: null }); },
    discardCard: (cardId: string) => dispatch({ type: 'DISCARD_CARD', cardId }),
    resolveCardOption: (optionId: string) => {
      dispatch({ type: 'RESOLVE_CARD_OPTION', optionId });
      change({}, { modal: snapshot.state?.pendingCard ? 'card' : null });
    },
    cancelCard: () => { if (snapshot.state?.pendingCard) dispatch({ type: 'CANCEL_CARD' }); change({}, { modal: null }); },
    playCard: (cardId: string) => {
      dispatch({ type: 'PLAY_CARD', cardId });
      if (snapshot.state?.pendingCard) change({}, { modal: 'card' });
    },
    openSettings: () => change({}, { modal: 'settings' }),
    openAchievements: () => change({}, { modal: 'ach' }),
    openSaves: () => change({}, { modal: 'save' }),
    setLanguage: (id: string) => { if (I18N.setLang(id)) refresh(); else notice('warn', '该语言尚未开放'); },
    openEventBoard: () => change({}, { modal: 'evboard' }),
    closeEventBoard: () => change({}, { modal: snapshot.state?.currentEvent ? 'event' : null }),
    selectEvent: (id: string) => {
      const state = snapshot.state;
      if (!state) return;
      if (state.currentEvent === id) { change({}, { modal: 'event' }); return; }
      if (state.eventQueue?.includes(id) && !state.currentEvent) {
        const next = { ...state, eventQueue: state.eventQueue.filter((item: string) => item !== id), currentEvent: id };
        change({ state: next }, { modal: 'event' });
      }
    },
    openEvent: () => change({}, { modal: 'event' }),
    resolveEvent: (optionId: string) => { change({}, { modal: null }); dispatch({ type: 'RESOLVE_EVENT', optionId }); },
    openAdvisorDeck: () => change({}, { modal: 'advdeck' }),
    closeAdvisorDeck: () => change({}, { modal: null }),
    hireAdvisor: (advisorId: string) => { dispatch({ type: 'HIRE_ADVISOR', advisorId }); change({}, { modal: null }); },
    fireAdvisor: (advisorId: string) => dispatch({ type: 'FIRE_ADVISOR', advisorId }),
    useAdvisor: (advisorId: string) => dispatch({ type: 'USE_ADVISOR', advisorId }),
    setPosture: (posture: string) => dispatch({ type: 'SET_POSTURE', posture }),
    setTax: (tax: string, value: number) => dispatch({ type: 'SET_TAX', tax, value }),
    advance: () => {
      if (snapshot.state?.currentEvent) { change({}, { modal: 'event' }); return; }
      change({}, { tab: 'azioni' });
      dispatch({ type: 'ADVANCE' });
    },
    about: () => change({}, { modal: 'about' }),
    closeModal: () => change({}, { modal: snapshot.state?.currentEvent ? 'event' : null }),
    toggleEventBoard: () => change({}, { modal: snapshot.ui.modal === 'evboard' ? null : 'evboard' }),
    saveMenu: () => change({}, { modal: 'save' }),
    saveTo: (slot: number | 'auto') => {
      if (!snapshot.state) return;
      Sel.Save.save(snapshot.state, slot);
      notice('ok', slot === 'auto' ? I18N.t('toast.autosaved') : I18N.t('toast.saved', { n: slot + 1 }));
    },
    loadFrom: (slot: number | 'auto') => {
      const state = Sel.Save.load(slot);
      if (!state) { notice('warn', I18N.t('toast.emptyslot')); return; }
      Engine.postProcess(state);
      change({ state, resume: null }, { screen: state.ending ? 'ending' : 'game', modal: null, tab: 'azioni' });
      notice('ok', I18N.t('toast.loaded', { d: Core.dateLabel(state.date) }));
    },
    resumeSaved: () => {
      const state = snapshot.resume;
      if (!state) return;
      Engine.postProcess(state);
      change({ state, resume: null }, { screen: 'game', modal: state.currentEvent ? 'event' : null });
    },
    dismissResume: () => change({ resume: null }),
    clearNotice: () => change({ notice: null }),
  };
  return { getSnapshot: () => snapshot, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); }, refresh, actions };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const store = useRef<GameStore | null>(null);
  if (!store.current) store.current = createGameStore();
  return <GameContext.Provider value={store.current}>{children}</GameContext.Provider>;
}

export function useGame() {
  const store = useContext(GameContext);
  if (!store) throw new Error('GameProvider is missing');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...snapshot, actions: store.actions, refresh: store.refresh };
}
