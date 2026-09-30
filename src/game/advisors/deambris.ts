import type { Advisor } from '../content/types';

export const deambris: Advisor = { id: 'deambris',  zh: '阿尔切斯特·德·安布里斯', it: 'Alceste De Ambris', faction: 'sindacalisti',
      bio: '革命工团主义者，摄政政府的内阁首脑，《卡尔纳罗宪章》的实际起草人。他要的是把那份文件真的实施出来。',
      action: { zh: '召开法团院', it: 'Convocare il Consiglio dei Provvisori' },
      effect: { laws: { statuto: 1, lavoro: 1 }, support: [['operai', 'LEG', 4], ['portuali', 'LEG', 3]], economy: { capitalConfidence: -6 }, order: { fervour: 6, squadre: -4 }, factions: { fascisti: { dis: 10 } }, journals: ['carta'] } };
