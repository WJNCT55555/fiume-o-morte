import type { Advisor } from '../content/types';

export const keller: Advisor = { id: 'keller',    zh: '圭多·凯勒', it: 'Guido Keller', faction: 'arditi',
      bio: '"红心 A"。飞行员、瑜伽士、裸泳者、把一架飞机停在花园里的疯子。他相信革命首先是诗。',
      action: { zh: '空中撒传单', it: 'Volantinaggio aereo' },
      portrait: 'img/Portrait/Portrait_guido_keller.png',
      effect: { order: { fervour: 9, squadre: -3 }, diplo: { uk: 3, france: 3, league: 3 }, support: [['artigiani', 'LEG', 2]], economy: { recognition: 4 } } };
