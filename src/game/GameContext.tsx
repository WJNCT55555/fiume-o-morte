import { createContext, useContext, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { game } from './runtime';
import { acknowledgeSuperEvent, syncSuperEvents } from './superEvents';

export interface ViewState {
  screen: 'start' | 'game' | 'ending';
  tab: string;
  lawFocus: string;
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

export function createGameStore(): GameStore {
  const { Engine, Sel, Core, I18N, World } = game;
  const auto = Sel.Save.load('auto');
  let snapshot: Snapshot = {
    state: null,
    ui: { screen: 'start', tab: 'azioni', lawFocus: 'elettorale', mapMode: 'adriatic', district: 'centro',
      modal: null, deck: null, scenario: '1919-09', difficulty: 'historical', force: 'LEG' },
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
    if (!snapshot.state) return null;
    const result = Engine.dispatch(snapshot.state, action);
    if (!result) { refresh(); return null; }
    const state = syncSuperEvents(result.state);
    Sel.Save.save(state, 'auto');
    const uiPatch: Partial<ViewState> = state.ending ? { screen: 'ending', modal: null } : {};
    if (!state.ending && state.currentEvent && snapshot.ui.modal == null) uiPatch.modal = 'event';
    // A decision's own panel already names the card or event. Clear any older
    // notice so its bottom toast cannot linger behind the new decision.
    const decisionFlow = ['DRAW_CARD', 'DRAW_RANDOM', 'PLAY_CARD', 'RESOLVE_CARD_OPTION', 'RESOLVE_EVENT', 'ADVANCE'];
    change({ state, notice: decisionFlow.includes(action.type) ? null : snapshot.notice }, uiPatch);
    if (result.toast) notice(result.toast.kind, Core.L(result.toast.text));
    /* The state this dispatch produced. Callers must use THIS, not
       `snapshot.state`, which is still the pre-dispatch value — reading the
       snapshot after dispatching was how a card-to-card handover got lost. */
    return state;
  };
  const actions: Record<string, (...args: any[]) => void> = {
    setScenario: (scenario: string) => change({}, { scenario }),
    setDifficulty: (difficulty: string) => change({}, { difficulty }),
    setForce: (force: string) => { if (World.PARTY_BY_ID[force]?.player) change({}, { force }); },
    setTab: (tab: string) => change({}, { tab }),
    setLawFocus: (lawFocus: string) => {
      if (World.LAWS.some((law: { id: string }) => law.id === lawFocus)) change({}, { lawFocus });
    },
    setMapMode: (mapMode: string) => change({}, { mapMode }),
    selectDistrict: (district: string) => change({}, { district, mapMode: 'fiume' }),
    start: () => {
      const state = syncSuperEvents(Engine.createState(snapshot.ui.scenario, snapshot.ui.difficulty, Date.now() % 100000 + 1, snapshot.ui.force));
      Sel.Save.save(state, 'auto');
      change({ state, resume: null, notice: null }, { screen: 'game', tab: 'azioni', modal: state.currentEvent ? 'event' : null });
    },
    restart: () => change({ state: null }, { screen: 'start', modal: null }),
    acknowledgeSuperEvent: () => {
      if (!snapshot.state) return;
      const state = acknowledgeSuperEvent(snapshot.state);
      if (state === snapshot.state) return;
      Sel.Save.save(state, 'auto');
      change({ state });
    },
    openDeck: (deck: string) => change({}, { deck, modal: 'deck' }),
    closeDeck: () => change({}, { deck: null, modal: null }),
    drawCard: (cardId: string) => { dispatch({ type: 'DRAW_CARD', cardId }); change({}, { deck: null, modal: null }); },
    /* The ordinary mode: pick a deck, get a random card. Sandbox keeps the picker
       so a run can be driven deliberately. */
    drawRandom: (deck: string) => { dispatch({ type: 'DRAW_RANDOM', deck }); change({}, { deck: null, modal: null }); },
    discardCard: (cardId: string) => dispatch({ type: 'DISCARD_CARD', cardId }),
    resolveCardOption: (optionId: string) => {
      const next = dispatch({ type: 'RESOLVE_CARD_OPTION', optionId });
      /* Keep the card menu open when the choice handed over to another card
         (`openCard`), so the player actually sees the card they were routed to.
         Reading `snapshot.state` here would be the stale pre-dispatch value and
         would close the menu instead. */
      change({}, { modal: next?.pendingCard ? 'card' : null });
    },
    playCard: (cardId: string) => {
      const next = dispatch({ type: 'PLAY_CARD', cardId });
      // The card is already paid for and discarded; if it opened a choice menu
      // that menu is now mandatory, so it is shown straight away.
      if (next?.pendingCard) change({}, { modal: 'card' });
    },
    openSettings: () => change({}, { modal: 'settings' }),
    openAchievements: () => change({}, { modal: 'ach' }),
    openSaves: () => change({}, { modal: 'save' }),
    setLanguage: (id: string) => { if (I18N.setLang(id)) refresh(); else notice('warn', I18N.t('set.lang.locked')); },
    openEventBoard: () => change({}, { modal: 'evboard' }),
    closeEventBoard: () => change({}, { modal: snapshot.state?.currentEvent ? 'event' : null }),
    selectEvent: (id: string) => {
      const state = snapshot.state;
      if (!state) return;
      if (state.currentEvent === id) { change({}, { modal: 'event' }); return; }
      if (state.eventQueue?.includes(id) && !state.currentEvent) {
        const next = syncSuperEvents({ ...state, eventQueue: state.eventQueue.filter((item: string) => item !== id), currentEvent: id });
        Sel.Save.save(next, 'auto');
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
      const loaded = Sel.Save.load(slot);
      if (!loaded) { notice('warn', I18N.t('toast.emptyslot')); return; }
      Engine.postProcess(loaded);
      const state = syncSuperEvents(loaded);
      change({ state, resume: null }, { screen: state.ending ? 'ending' : 'game', modal: null, tab: 'azioni' });
      notice('ok', I18N.t('toast.loaded', { d: Core.dateLabel(state.date) }));
    },
    resumeSaved: () => {
      const loaded = snapshot.resume;
      if (!loaded) return;
      Engine.postProcess(loaded);
      const state = syncSuperEvents(loaded);
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
