import { legacyUI } from '../legacy/ui/runtime';
import { useGame } from '../game/GameContext';
import { legacyToReact } from '../lib/legacyReact';

export function StartScreen() {
  const { ui, actions, refresh } = useGame();
  return <>{legacyToReact(legacyUI.Views.start(ui, actions), refresh)}</>;
}
