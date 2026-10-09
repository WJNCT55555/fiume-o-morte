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
  // over every other one. The separate SuperEventLayer presents major moments
  // above this sheet without changing its choices or resolving the event.
  const pending = legacyUI.Sel.eventView(state);
  const inline = pending
    ? legacyToReact(legacyUI.Views.eventModal(state, actions), refresh, 'event')
    : null;
  return <div className={ui.tab === 'leggi' ? 'app app--laws' : 'app'}>
    <TopBar nodes={top} refresh={refresh} />
    <div className="board">
      <SidePanel node={columns[0]} refresh={refresh} />
      <div className="col col--c">
        {/* While an event is pending the sheet REPLACES the tab area rather than
            sitting above it. Leaving the action panel (decks, hand, advisors)
            visible next to an unresolved decision invites the player to keep
            playing a month that has not been answered yet — and ADVANCE is
            refused until it is, so the tabs would be a dead end anyway. */}
        {inline
          ? <div className="inline-event">{inline}</div>
          : (ui.tab === 'mappa' ? <MapView node={columns[1]} refresh={refresh} /> : <MainArea node={columns[1]} refresh={refresh} />)}
      </div>
      <EventBoard node={columns[2]} refresh={refresh} />
    </div>
  </div>;
}
