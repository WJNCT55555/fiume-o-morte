import type { GameEvent } from '../content/types';

export const ev191909Autonomi: GameEvent = {
  id: 'ev_1919_09_autonomi', opening: true, once: true,
  condition: (s) => s.playerForce === 'AUT' && s.turn === 1,
  title: { zh: '自治派的第一周', it: 'La prima settimana degli autonomi' },
  body: {
    zh: '军团已经进入阜姆。扎内拉和自治党没有军队，却有街区组织、报纸和要求自由邦的市民。你要决定如何开始公开反对军团的统治。',
    it: 'La Legione è entrata a Fiume. Zanella e gli autonomi hanno quartieri, giornali e cittadini favorevoli a uno Stato libero.'
  },
  options: [
    { id: 'quartieri', text: { zh: '先组织街区委员会', it: 'Organizzare i comitati di quartiere' },
      preview: ['自治党支持 +', '合法性 +'],
      effect: { support: [['borghesia', 'AUT', 4], ['impiegati', 'AUT', 3], ['contadini', 'AUT', 3]] } },
    { id: 'estero', text: { zh: '向协约国说明自治主张', it: 'Presentare l’autonomia agli Alleati' },
      preview: ['国际承认 +', '自治党支持 +'],
      effect: { economy: { recognition: 5 }, diplo: { uk: 4, france: 4 }, support: [['borghesia', 'AUT', 3]] } }
  ]
};
