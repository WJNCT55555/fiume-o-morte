import type { Advisor } from '../content/types';

export const giuriati: Advisor = { id: 'giuriati',  zh: '乔瓦尼·朱里亚蒂', it: 'Giovanni Giuriati', faction: 'irredentisti',
      bio: '1919 年阜姆行动的实际组织者之一，后来成了墨索里尼派来的军事委员。他站在每一边。',
      require: function (s) { return s.order.coup < 60 && s.factions.fascisti.inf >= 10; },
      action: { zh: '与民族阵营谈判', it: 'Trattare col blocco nazionale' },
      effect: { order: { squadre: -8, coup: -6 }, factions: { sindacalisti: { dis: 8 } } } };
