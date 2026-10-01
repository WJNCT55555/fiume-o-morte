import type { GameEvent } from '../content/types';

export const ev191909Socialisti: GameEvent = {
  id: 'ev_1919_09_socialisti', opening: true, once: true,
  condition: (s) => s.playerForce === 'PSI' && s.turn === 1,
  title: { zh: '港口与工厂', it: 'Il porto e le fabbriche' },
  body: {
    zh: '军团进入阜姆后，封锁和物价首先落在工人身上。迈伦德尔与社会党必须在港口、工厂和街头维系组织。',
    it: 'Con l’arrivo della Legione, il blocco e i prezzi pesano sui lavoratori. Mayländer deve tenere insieme porto e fabbriche.'
  },
  options: [
    { id: 'porto', text: { zh: '从码头工人开始组织', it: 'Cominciare dai portuali' },
      preview: ['社会党支持 +', '工会组织 +'],
      effect: { support: [['portuali', 'PSI', 5], ['operai', 'PSI', 3]] } },
    { id: 'prezzi', text: { zh: '建立粮价与失业互助网络', it: 'Organizzare mutuo soccorso contro disoccupazione e prezzi' },
      preview: ['社会党支持 +', '失业率 −'],
      effect: { support: [['operai', 'PSI', 4], ['artigiani', 'PSI', 2]], economy: { unemployment: -2 }, funds: -100 } }
  ]
};
