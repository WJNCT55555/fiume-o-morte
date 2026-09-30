import { legacyUI } from '../legacy/ui/runtime';
import { useGame } from '../game/GameContext';
import { legacyToReact } from '../lib/legacyReact';

export function EndingScreen() {
  const { state, actions, refresh } = useGame();
  return state ? <>{legacyToReact(legacyUI.Views.ending(state, actions), refresh)}</> : null;
}
