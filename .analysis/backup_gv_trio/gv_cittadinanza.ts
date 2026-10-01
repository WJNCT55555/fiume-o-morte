import type { Card } from '../content/types';

/* The 1919 electoral law already gave the vote to women; the citizenship law
     decided who else counted. */
export const gvCittadinanza: Card = {
    id: 'gv_cittadinanza', deck: 'governo', ministry: 'interno',
    name: { zh: '公民身份法', it: 'Legge sulla cittadinanza' },
    cooldown: 6,
        text: { zh: '八千人是从意大利王国来的。他们是军团兵的社会基础，也是他们的包袱。',
            it: 'Ottomila sono regnicoli. Sono la base sociale dei legionari, e il loro fardello.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.interno === s.playerForce; },
    requireText: { zh: '未掌握内政与司法执政官席位', it: 'Ministero dell\'Interno non controllato' },
    options: [
      { id: 'residenza', text: { zh: '居住三年即入籍，不问来处', it: 'Tre anni di residenza, da qualunque parte si venga' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['公民法 +1', '人口 +', '意大利 −', '克罗地亚党 +'],
        effect: { laws: { cittadinanza: 1 }, diplo: { italy: -3 },
                  support: [['contadini', 'LEG', 2], ['contadini', 'PCR', 3]],
                  economy: { population: 180 } } },
      { id: 'sangue', text: { zh: '以语言与文化为准', it: 'Per lingua e cultura' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['公民法 +1', '合法性 ++', '民族派 +', '克罗地亚党 −−'],
        effect: { laws: { cittadinanza: 1 },
                  support: [['contadini', 'PCR', -5]],
                  diplo: { italy: 4, yugoslavia: -6 },
                  factions: { fascisti: { dis: -10 }, sindacalisti: { dis: 10 } } } },
      { id: 'doppia', text: { zh: '允许双重国籍', it: 'Doppia cittadinanza' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['公民法 +2', '国际承认 ++', '民族派异议 ++'],
        effect: { laws: { cittadinanza: 2 }, economy: { population: 260 },
                  diplo: { yugoslavia: 8, league: 5, italy: -6 },
                  support: [['contadini', 'LEG', 4], ['impiegati', 'LEG', 3]],
                  factions: { fascisti: { dis: 14 } } } }
    ]
  };
