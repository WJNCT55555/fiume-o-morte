import type { Advisor } from '../content/types';

export const deambris: Advisor = { id: 'deambris',  zh: '阿尔切斯特·德·安布里斯', it: 'Alceste De Ambris', faction: 'sindacalisti',
      bio: '革命工团主义者，摄政政府的内阁首脑，《卡尔纳罗宪章》的实际起草人。他要的是把那份文件真的实施出来。',
      action: { zh: '召开法团院', it: 'Convocare il Consiglio dei Provvisori' },
      portrait: 'img/Portrait/Portrait_alceste_de_ambris.png',
      /* He has to be in the Palazzo before he can be offered a seat in it: the
         January 1920 event sets deambris_arrived. Before that the roster shows
         him locked with the reason below rather than offering a hire button.
         The chained programme event starts the `carta` journal after his arrival.
         His action advances its labor requirement once it is open. */
      require: function (s) { return !!s.flags.deambris_arrived; },
      effect: { laws: { lavoro: 1 }, support: [['operai', 'LEG', 4], ['portuali', 'LEG', 3]], economy: { capitalConfidence: -6 }, order: { fervour: 6, squadre: -4 }, factions: { fascisti: { dis: 10 } } } };
