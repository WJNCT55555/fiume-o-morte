import type { Advisor } from '../content/types';

export const gigante: Advisor = { id: 'gigante',   zh: '里卡多·吉甘特', it: 'Riccardo Gigante', faction: null,
      bio: '1919 年 10 月当选的市长。街垒上敢拔枪，市政厅里会算账。',
      /* He had been sharing a group photograph with nobody in particular; the
         file on disk is a real likeness of him at 155×209, the same size as the
         other plain portraits in the folder. It arrived as WebP and was
         re-encoded to PNG so the folder keeps one format. */
      portrait: 'img/Portrait/Portrait_riccardo_gigante.png',
      action: { zh: '召集城市名流', it: 'Convocare i notabili' },
      effect: { funds: 180, support: [['borghesia', 'LEG', 3], ['artigiani', 'LEG', 2]], economy: { capitalConfidence: 6 }, factions: { sindacalisti: { dis: -8 } } } };
