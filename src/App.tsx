import { useEffect } from 'react';
import { GameProvider, useGame } from './game/GameContext';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { EndingScreen } from './components/EndingScreen';
import { ModalLayer } from './components/ModalLayer';
import { EffectPreviewTooltip } from './components/EffectPreviewTooltip';

function GameContent() {
  const { ui, notice, actions } = useGame();
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => actions.clearNotice(), 2600);
    return () => window.clearTimeout(timer);
  }, [notice, actions]);
  return <>
    {ui.screen === 'start' ? <StartScreen /> : ui.screen === 'ending' ? <EndingScreen /> : <GameScreen />}
    <ModalLayer />
    <EffectPreviewTooltip />
    {notice && <div className={`toast toast--${notice.kind} show`} role="status">{notice.text}</div>}
  </>;
}

export default function App() {
  return <GameProvider><GameContent /></GameProvider>;
}
