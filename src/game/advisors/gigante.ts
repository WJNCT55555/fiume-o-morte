import type { Advisor } from '../content/types';

export const gigante: Advisor = { id: 'gigante',   zh: '里卡多·吉甘特', it: 'Riccardo Gigante', faction: null,
      bio: '1919 年 10 月当选的市长。街垒上敢拔枪，市政厅里会算账。',
      action: { zh: '召集城市名流', it: 'Convocare i notabili' },
      effect: { funds: 180, support: [['borghesia', 'LEG', 3], ['artigiani', 'LEG', 2]], economy: { capitalConfidence: 6 }, factions: { sindacalisti: { dis: -8 } } } };
