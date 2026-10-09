import type { Advisor } from '../content/types';

export const micheletti: Advisor = { id: 'micheletti', zh: '彼得罗·米凯莱蒂', it: 'Pietro Micheletti', faction: 'arditi',
      bio: '阿迪蒂军官，1920 年 12 月被派去和诗人谈投降条件的那个人。',
      /* No portrait. He used to be shown D'Annunzio's photograph — the man he
         was sent to negotiate with. See PORTRAIT_ART_DIRECTION.md. */
      action: { zh: '整训军团', it: 'Inquadrare la Legione' },
      effect: { order: { milizia: 320, authority: 4, fervour: -2 }, arms: -6, laws: { ordine: 1 }, factions: { arditi: { inf: 2, dis: -10 } } } };
