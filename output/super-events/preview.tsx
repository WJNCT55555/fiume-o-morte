// Local visual fixture: production dialog and registry, no production save writes.
import { createRoot } from 'react-dom/client';
import { SuperEventDialog } from '../../src/components/SuperEventLayer';
import { SUPER_EVENTS } from '../../src/game/superEvents';
import { game } from '../../src/game/runtime';
import '../../src/index.css';
const query = new URLSearchParams(location.search);
game.I18N.setLang(query.get('lang') === 'it' ? 'it' : 'zh');
const event = SUPER_EVENTS.find(item => item.id === query.get('event')) ?? SUPER_EVENTS[1];
createRoot(document.getElementById('root')!).render(<SuperEventDialog event={event}
  acknowledge={() => { document.getElementById('root')!.textContent = '确认完成；原事件流程继续。'; }} />);
