import type { Advisor } from '../content/types';

export const blasich: Advisor = { id: 'blasich',   zh: '马里奥·布拉西奇', it: 'Mario Blasich', faction: null,
      bio: '自治派议员、医生。1920 年 4 月他和社会党一起发动总罢工反对摄政。招揽他是政治赌博。',
      require: function (s) { return s.legitimacy >= 55 && s.flags.blasich_contact; },
      action: { zh: '与自治派和解', it: 'Conciliazione con gli autonomi' },
      effect: { support: [['portuali', 'LEG', 3], ['operai', 'LEG', 3], ['borghesia', 'LEG', 3], ['contadini', 'LEG', 3]], order: { violence: -8, coup: -8 }, factions: { arditi: { dis: 10 } } } };
