import { useGame } from '../game/GameContext';
import { legacyUI } from '../legacy/ui/runtime';
import { TopBar } from './TopBar';
import { SidePanel } from './SidePanel';
import { MainArea } from './MainArea';
import { MapView } from '../map/MapView';
import { EventBoard } from './EventBoard';
import { legacyToReact } from '../lib/legacyReact';

export function GameScreen() {
  const { state, ui, actions, refresh } = useGame();
  if (!state) return null;
  const root = legacyUI.Views.game(state, ui, actions) as HTMLElement;
  const board = root.querySelector(':scope > .board');
  const top = Array.from(root.children).filter(node => !node.classList.contains('ornat') && !node.classList.contains('board'));
  const columns = board ? Array.from(board.children) : [];
  if (columns.length !== 3) throw new Error('Game board structure is incomplete');
  // A pending decision blocks the month, so it is pinned above whichever tab is
  // open. The month's event board has its own tab (事件) instead of floating
  // over every other one. Only a super event takes over the whole screen.
  const pending = legacyUI.Sel.eventView(state);
  const inline = pending
    ? legacyToReact(legacyUI.Views.eventModal(state, actions), refresh, 'event')
    : null;
  return <div className="app">
    <TopBar nodes={top} refresh={refresh} />
    <div className="board">
      <SidePanel node={columns[0]} refresh={refresh} />
      <div className="col col--c">
        {inline && <div className="inline-event">{inline}</div>}
        {ui.tab === 'mappa' ? <MapView node={columns[1]} refresh={refresh} /> : <MainArea node={columns[1]} refresh={refresh} />}
      </div>
      <EventBoard node={columns[2]} refresh={refresh} />
    </div>
  </div>;
}
