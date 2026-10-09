import { useEffect } from 'react';
import { GameProvider, useGame } from './game/GameContext';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { EndingScreen } from './components/EndingScreen';
import { ModalLayer } from './components/ModalLayer';
import { EffectPreviewTooltip } from './components/EffectPreviewTooltip';
import { SuperEventLayer } from './components/SuperEventLayer';
import { currentSuperEvent } from './game/superEvents';

function GameContent() {
  const { state, ui, notice, actions } = useGame();
  const superEvent = ui.screen === 'game' ? currentSuperEvent(state) : null;
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => actions.clearNotice(), 2600);
    return () => window.clearTimeout(timer);
  }, [notice, actions]);
  return <>
    <div style={{ display: 'contents' }} inert={!!superEvent} aria-hidden={superEvent ? true : undefined}>
      {ui.screen === 'start' ? <StartScreen /> : ui.screen === 'ending' ? <EndingScreen /> : <GameScreen />}
      <ModalLayer />
      <EffectPreviewTooltip />
      {notice && <div className={`toast toast--${notice.kind} show`} role="status">{notice.text}</div>}
    </div>
    {ui.screen === 'game' && <SuperEventLayer />}
  </>;
}

export default function App() {
  return <GameProvider><GameContent /></GameProvider>;
}
