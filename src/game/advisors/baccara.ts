import type { Advisor } from '../content/types';

export const baccara: Advisor = { id: 'baccara',   zh: '路易莎·巴卡拉', it: 'Luisa Baccara', faction: 'arditi',
      bio: '钢琴家，指挥官的伴侣。《卡尔纳罗宪章》把音乐写成了国家的基本制度之一——这不是玩笑。',
      action: { zh: '在阿伦戈举办音乐会', it: 'Concerto all\'Arengo' },
      effect: { order: { fervour: 5, violence: -6 }, support: [['artigiani', 'LEG', 3], ['borghesia', 'LEG', 2]], diplo: { vatican: 4, france: 3 } } };
