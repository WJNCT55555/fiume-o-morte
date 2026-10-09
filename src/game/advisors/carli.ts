import type { Advisor } from '../content/types';

export const carli: Advisor = { id: 'carli',     zh: '马里奥·卡利', it: 'Mario Carli', faction: 'arditi',
      bio: '阿迪蒂协会领袖、《铁头》报主编。他的排版比他的政纲更有名。',
      action: { zh: '出版《铁头》号外', it: 'Numero unico di Testa di Ferro' },
      portrait: 'img/Portrait/Portrait_mario_carli.png',
      effect: { support: [['impiegati', 'LEG', 3], ['artigiani', 'LEG', 3], ], order: { fervour: 5, squadre: -2 } } };
